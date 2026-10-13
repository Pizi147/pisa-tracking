import { db, tx } from '../db.ts';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, CONFIRM_EDIT_REASON, URGENCY_LEVELS, academicSupportFor, caseTopicLabel, coNguoiDay, issueBranchOf, tenMonNgan,
  hanXacNhan, issuesForTopic, kiemGhiRoKhac, laKhac, mocQuyChe, ngay, reasonNeedsText, tenCaseSos, weeklyUpdateDue,
  type AcademicSupportPreset, type CaseDismissReason, type MilestoneKind, nhanBaiThuong } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, notFound, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { suggestCaseOwner } from './owner.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { routeCuaLuot } from '../fasttrack/attempts.ts';
import { addIssues, caseAccess, caseDetail, caseTitleOf } from './cases.ts';
import { chenPa } from './taoPa.ts';
import { followUntilAfter } from './sos.ts';
import { mondayOf } from '../platform/week.ts';
import { taoYeuCau } from '../duyet/yeuCau.ts';
import { dongBoBaoPhCuaBai } from '../yThuc/phoiHop.ts';
import { PA_QUY_CHE_CHUA_GHI, UNCONFIRMED_PRESET, dongBoTrangThaiCase, sosCaseState } from './sosState.ts';
import { ghiBanDieuChinh, nguoiSauSua, soBuoiMoi } from './planRevisions.ts';
import { chayPaBoTro, mocCuoiKhoa } from './boTro.ts';

export { UNCONFIRMED_PRESET, NOT_UNCONFIRMED_PRESET, PA_QUY_CHE_CHUA_GHI } from './sosState.ts';

/**
 * SOS TỰ TẠO CASE — PHẦN GHI DỮ LIỆU (SOS v4, PR-SOS; đặc tả 27/09 §3.1d + §5.3 S4-1…S4-7, Q28-3).
 *
 * Chỉ lượt Mock Test FAST TRACK mới đi qua đây (Q-V3-1). Lớp thường KHÔNG có SOS: Giữa khoá tự tạo Case + PA Bổ trợ (PR-LT2a, `cases/boTro.ts`), Cuối khoá không tín
 * hiệu (LT2b) — không phương án điền sẵn theo mức SOS, không Phối hợp SOS.
 *
 * `cases/sos.ts` (nơi sở hữu `raiseSignalsForResult`, `taoCaseTuDong`) quyết định KHI NÀO tạo hay gắn Case; file này lo phần "PA theo quy chế":
 *   · dựng PA theo bảng MT × mức SOS (`shared/domain/sos.ts`) — PA "CHỜ XÁC NHẬN", KHÔNG tự chạy (Q28-3),
 *   · đồng bộ PA quy chế chờ xác nhận khi mức SOS của lượt đổi (Q24),
 *   · Xác nhận Case → Xác nhận PA, Không cần theo dõi (thẻ Chờ duyệt) — phần dưới.
 *
 * PA QUY CHẾ CHỜ XÁC NHẬN = `preset = 1 AND confirmed_at IS NULL AND status = 'planned'` (`UNCONFIRMED_PRESET`) — biểu diễn có sẵn, mọi
 * lọc (việc Ghi kết quả, hiệu quả PA, `updateResult`) tự loại nó. Loại mốc lưu `moc_quy_che`; mốc (`followup_due`) tính lúc Xác nhận PA,
 * từ NGÀY XÁC NHẬN (K3-46). Chỉ Xác nhận PA mới đặt `confirmed_at` + `confirmed_by`.
 */

/**
 * Lượt này có phải Mock Test Fast Track không. Chỉ lượt Mock của lớp chấm theo band mới tự tạo Case / phối hợp; Giữa khoá / Cuối khoá của
 * lớp thường (chấm theo tỷ lệ) thì không.
 */
export function isFastTrackMock(attempt: { kind?: string | null }, scoringMode: 'band' | 'ratio'): boolean {
  return (attempt.kind ?? 'mock') === 'mock' && scoringMode === 'band';
}

/**
 * NGÀY THI DỰ KIẾN của lộ trình, chỉ khi ĐÃ CHỐT TUẦN (`examPlanOf` mức `week`): hết Chủ nhật của tuần thi. Mới biết tháng thì để TRỐNG —
 * bịa một ngày là tạo hạn giả. (Đặc tả §4: "dự kiến thi nếu có".)
 */
export function examDateOf(cycleId: number | null | undefined): string | null {
  if (!cycleId) return null;
  return examDateTu(db().prepare('SELECT exam_period_id, exam_month, exam_date FROM learning_cycles WHERE id = ?').get(cycleId) as any);
}
/** Như `examDateOf` nhưng từ hàng lộ trình đã có sẵn (PR-S3F #4: dòng được JOIN `exam_week_*` thì không hỏi tuần thi lại). */
function examDateTu(c: Parameters<typeof examPlanOf>[0]): string | null {
  if (c?.exam_date) return c.exam_date;   // PR-SOS: ngày thi cụ thể (T9) thắng tuần
  const plan = examPlanOf(c);
  return plan.confidence === 'week' && plan.weekStart ? addDays(plan.weekStart, 6) : null;
}

/** Loại + mô tả + loại mốc (span) của PA quy chế cho một lượt ở mức SOS đó. `null` khi không có gì để điền. Mốc tính lúc Xác nhận PA. */
export function presetFor(attempt: { attempt_no: number; cycle_id?: number | null }, sosLevel: number | null | undefined): AcademicSupportPreset | null {
  return academicSupportFor(attempt.attempt_no, sosLevel, routeCuaLuot(attempt));   // T4: RF theo hàng "MT3 trở đi"
}

/**
 * DỰNG PA THEO QUY CHẾ CHO MỘT CASE (S03, S4-1). Người thực hiện mặc định là GVBM đúng kỹ năng ở lớp em đang học.
 * Q28-3: PA "CHỜ XÁC NHẬN" — không ngày bắt đầu, không hạn ghi kết quả, không mốc; chạy khi GVBM bấm Xác nhận PA.
 */
export function createPresetPlan(input: {
  caseId: number;
  attempt: { attempt_no: number; cycle_id?: number | null; class_id?: number | null };
  category: string; sosLevel: number | null;
}): number | null {
  const p = presetFor(input.attempt, input.sosLevel);
  if (!p) return null;
  const performer = suggestCaseOwner({ classId: input.attempt.class_id ?? null, category: input.category });
  // Q28-3: PA quy chế KHÔNG tự chạy. Chờ xác nhận = preset=1, planned, confirmed_at NULL (UNCONFIRMED_PRESET). Mốc tính lúc Xác nhận PA.
  return chenPa(db(), [{ caseId: input.caseId, kind: p.kind, description: p.description, performerUserId: performer, status: 'planned', preset: true, mocQuyChe: p.span }])[0];
}

/**
 * ĐỒNG BỘ PA QUY CHẾ CHỜ XÁC NHẬN với mức SOS hiện tại của lượt (PR-N1 Q24, PR-SOS).
 *
 * Điểm thường được nhập từng kỹ năng, bởi từng GVBM, vào những lúc khác nhau — nên Case đầu tiên ra đời khi lượt mới ở SOS1, trước khi
 * SOS3 xuất hiện. Đặc tả §4 nói phương án theo MỨC SOS CỦA CẢ LƯỢT, nên PA chờ xác nhận phải theo mức mới nhất. PA đã xác nhận thì
 * không bao giờ bị đụng.
 *
 * Áp cho Case mà lượt này mở (`opened`) hoặc trượt lại (`repeat`): PA chờ xác nhận chưa chạy nên đi theo hàng MT mới nhất.
 */
export function resyncUnconfirmedPresets(
  attempt: { id: number; attempt_no: number; cycle_id?: number | null },
  sosLevel: number | null,
) {
  if (!presetFor(attempt, sosLevel)) return;
  /* PR-SOS: chỉ PA CHỜ XÁC NHẬN (PA đã xác nhận là việc thật — không đụng); `followup_due` luôn NULL tới lúc xác nhận. */
  const rows = db()
    .prepare(
      `SELECT iv.id, iv.kind, iv.description, iv.moc_quy_che, iv.performer_user_id, iv.performer_name, sc.category
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE ${PA_QUY_CHE_CHUA_GHI('iv')} AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sc.id AND m.kind IN ('opened', 'repeat') AND m.attempt_id = ?)`,
    )
    .all(attempt.id) as any[];
  const lop = rows.length ? (db().prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(attempt.id) as any)?.class_id ?? null : null;
  for (const iv of rows) {
    const p = presetFor(attempt, sosLevel)!;
    /* PR-PA (§8): đổi loại thì người theo loại mới — Tự học không người; Tutor chưa có người → GVBM đúng kỹ năng (như lúc dựng). */
    const nguoi = coNguoiDay(p.kind) ? iv.performer_user_id ?? (iv.performer_name ? null : suggestCaseOwner({ classId: lop, category: iv.category })) : null;
    const ten = coNguoiDay(p.kind) ? iv.performer_name : null;
    if (iv.kind === p.kind && iv.description === p.description && iv.moc_quy_che === p.span && nguoi === iv.performer_user_id && ten === iv.performer_name) continue;
    db()
      .prepare('UPDATE case_interventions SET kind = ?, description = ?, moc_quy_che = ?, performer_user_id = ?, performer_name = ?, updated_at = ? WHERE id = ?')
      .run(p.kind, p.description, p.span, nguoi, ten, nowIso(), iv.id);
  }
}

/** Ghi hành trình + audit + báo GVBM (người phụ trách) cho một Case vừa được SOS tự tạo. `hanXacNhan` = `sos_cases.han_xac_nhan`. */
export function announceAutoCase(input: {
  caseId: number; studentId: number; cycleId: number | null; skillLabel: string; attemptNo: number;
  sosLevel: number | null; ownerUserId: number | null; detectedOn: string; hanXacNhan: string; actorUserId: number | null;
  /** PR-LT2a: Giữa khoá lớp thường — tên Case dựng sẵn (không `[MT n]`/`[SOS n]`) + chữ hành trình riêng. */
  ten?: string; dot?: 'giua-khoa';
}) {
  const st = db().prepare('SELECT full_name FROM students WHERE id = ?').get(input.studentId) as any;
  const ten = input.ten ?? tenCaseSos({ mt: input.attemptNo, giua: `${input.skillLabel} không đạt`, sos: input.sosLevel });
  addJourney({
    studentId: input.studentId, cycleId: input.cycleId, eventType: 'case_opened', eventDate: input.detectedOn,
    title: input.dot === 'giua-khoa' ? `Progress Test tự tạo Case ${ten}` : `SOS tự tạo Case ${ten}`,
    detail: input.dot === 'giua-khoa' ? 'PA Bổ trợ chờ GVBM xác nhận nguyên nhân và kế hoạch bài giảng.' : 'PA theo quy chế chờ GVBM xác nhận.',
    refTable: 'sos_cases', refId: input.caseId, createdBy: input.actorUserId,
    dedupKey: `case_open:${input.caseId}`,
  });
  writeAudit({
    actorUserId: input.actorUserId, action: input.dot ? 'case.auto_from_giua_khoa' : 'case.auto_from_sos', entityType: 'sos_case', entityId: input.caseId,
    entityLabel: `${st?.full_name ?? ''} · ${input.skillLabel}`, after: { attemptNo: input.attemptNo, sosLevel: input.sosLevel },
  });
  if (input.ownerUserId) {
    /* PR-VAI-a (K1-42, Q20): tiêu đề = việc + em + lớp; thân nói Case sinh ra từ đợt nào và hạn. */
    const lop = (db().prepare(`SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1`)
      .get(input.studentId) as any)?.code ?? null;
    notify({
      userId: input.ownerUserId, kind: 'sos',
      title: `Xác nhận nguyên nhân ${input.skillLabel} · ${[st?.full_name, lop].filter(Boolean).join(' · ')}`,
      body: `Case mới sau ${input.dot === 'giua-khoa' ? nhanBaiThuong('progress') : `MT${input.attemptNo}`}: ${ten} · hạn ${ngay(input.hanXacNhan, demoToday())}`,
      entityType: 'sos_case', entityId: input.caseId, dedupKey: `sos-case:${input.caseId}`,
    });
  }
}

// ---------------------------------------------------------------- Xác nhận Case · Xác nhận PA · Không cần theo dõi (S4-2…S4-7)

const EDIT_MESSAGE = 'Bạn chỉ xử lý được Case của kỹ năng mình được phân công (hoặc là Quản lý trong phạm vi).';

/** Ghi một mốc của Case (khoá chống trùng tuỳ chọn). Viết tại chỗ để không import vòng `sos.ts`. */
export function ghiMoc(caseId: number, kind: MilestoneKind, on: string, note: string | null, actor: number | null, dedupKey: string | null = null) {
  db().prepare(`INSERT OR IGNORE INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key) VALUES (?,?,?,?,?,?,?)`)
    .run(caseId, kind, on, note, actor, nowIso(), dedupKey);
}

/** Phần giữa của tên Case SOS — người sửa được (lưu `title`), mặc định `{kỹ năng} không đạt`. */
export function tenGiuaCua(c: { title?: string | null; topic?: string | null; category?: string | null; cycle_id?: number | null; attempt_id?: number | null }): string {
  const own = (c.title ?? '').trim();
  if (own) return own;
  /* PR-LT2a: Case Giữa/Cuối khoá lớp thường — tên môn NGẮN (`G+V không đạt`), khớp `caseTitleOf`. */
  const luot = c.attempt_id ? (db().prepare('SELECT a.kind, cl.programme_code ct FROM assessment_attempts a LEFT JOIN classes cl ON cl.id = a.class_id WHERE a.id = ?').get(c.attempt_id) as any) : null;
  if (luot && (luot.kind === 'progress' || luot.kind === 'final')) return `${tenMonNgan(luot.ct ?? null, c.topic ?? c.category ?? '')} không đạt`;
  const ct = c.cycle_id ? (db().prepare('SELECT programme_code ct FROM learning_cycles WHERE id = ?').get(c.cycle_id) as any)?.ct ?? null : null;
  return `${caseTopicLabel(c.topic ?? c.category ?? '', ct)} không đạt`;
}

/**
 * KIỂM NỘI DUNG CASE — nhóm nguyên nhân (thuộc bộ của kỹ năng; "Khác" cần Ghi rõ), mức gấp, mô tả 15–2000, tên 3–80. Hàm thuần, dùng chung
 * `xacNhanCase` và `suaCase` (PR-LUI-a2) — cùng luật, cùng câu lỗi.
 */
export function kiemNoiDungCase(topic: string | null, ct: string | null, input: {
  primaryCode?: string | null; observation?: string | null; urgency?: string | null; moTa?: string | null; tenGiua?: string | null;
}) {
  const primaryCode = String(input.primaryCode ?? '').trim();
  if (!primaryCode) throw badRequest('Chọn nhóm nguyên nhân.');
  if (!issueBranchOf(primaryCode) || !issuesForTopic(topic as string, ct).some((i) => i.code === primaryCode)) {
    throw badRequest(`Phân loại đã chọn không thuộc bộ phân loại của ${caseTopicLabel(topic ?? '', ct)}.`);
  }
  const observation = String(input.observation ?? '').trim() || null;
  if (laKhac(primaryCode)) {
    const loi = kiemGhiRoKhac(observation);
    if (loi) throw badRequest(`Phân loại "Khác": ${loi}.`);
  }
  const urgency = String(input.urgency ?? '');
  if (!(URGENCY_LEVELS as readonly string[]).includes(urgency)) throw badRequest('Chọn mức độ gấp.');
  const moTa = String(input.moTa ?? '').trim();
  if (moTa.length < 15) throw badRequest('Mô tả cần ít nhất 15 ký tự — sai ở đâu, bài hay buổi nào.');
  if (moTa.length > 2000) throw badRequest('Mô tả tối đa 2000 ký tự.');
  const tenGiua = String(input.tenGiua ?? '').trim();
  if (tenGiua.length < 3 || tenGiua.length > 80) throw badRequest('Tên Case (phần giữa) cần từ 3 đến 80 ký tự.');
  return { primaryCode, observation, urgency, moTa, tenGiua };
}

/**
 * XÁC NHẬN CASE (S4-3, M7, YC-12.3): GVBM đúng kỹ năng (C02) hoặc Quản lý trong phạm vi ghi nguyên nhân + mức gấp + mô tả + phần giữa tên.
 * Chỉ khi Case từ SOS còn chờ nguyên nhân và KHÔNG có thẻ Không cần theo dõi đang chờ (S4-2 hai lựa chọn loại trừ). Case vẫn `open`
 * tới khi có PA do người xác nhận (Q28-5) — giao diện chuyển thẳng sang Xác nhận PA.
 */
/**
 * OV-5a: gọi từ xác nhận nhóm (`xacNhanNhom.ts`) — `chiGhi`: không đọc lại chi tiết Case để trả; `daKiemQuyen`: quyền sửa Case ĐÃ kiểm bằng
 * đúng `caseAccess(...).requireEdit` trong CÙNG giao dịch (không kiểm lần hai sau mỗi câu ghi — bộ nhớ quyền bị xoá theo câu ghi).
 */
export type XacNhanTrongLo = { chiGhi?: boolean; daKiemQuyen?: boolean };

export function xacNhanCase(p: Principal, caseId: number, input: {
  primaryCode?: string | null; observation?: string | null; urgency?: string | null; moTa?: string | null; tenGiua?: string | null;
}, o: XacNhanTrongLo = {}) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy Case');
  if (!o.daKiemQuyen) caseAccess(caseId).requireEdit(p, EDIT_MESSAGE);
  const st = sosCaseState(caseId);
  if (!st.fromSos) throw badRequest('Chỉ Case tự tạo từ kết quả Test mới có bước Xác nhận Case.');
  if (c.status === 'done') throw badRequest('Case này đã đóng rồi.');
  if (st.hasCause) throw badRequest('Case đã xác nhận nguyên nhân rồi.');
  if (st.choDuyetKhongTheoDoi) throw badRequest('Case đang chờ Quản lý duyệt "Không cần theo dõi" — chờ trả lời rồi mới xác nhận.');
  const ct = c.cycle_id ? (conn.prepare('SELECT programme_code ct FROM learning_cycles WHERE id = ?').get(c.cycle_id) as any)?.ct ?? null : null;
  const { primaryCode, observation, urgency, moTa, tenGiua } = kiemNoiDungCase(c.topic, ct, {
    ...input, tenGiua: input.tenGiua === undefined || input.tenGiua === null ? tenGiuaCua(c) : input.tenGiua,
  });
  const today = demoToday();
  return tx(() => {
    addIssues(caseId, p.userId, { primaryCode, observation, topic: c.topic });
    conn.prepare('UPDATE sos_cases SET urgency = ?, summary = ?, title = ?, updated_at = ? WHERE id = ?').run(urgency, moTa, tenGiua, nowIso(), caseId);
    ghiMoc(caseId, 'xac_nhan_case', today, moTa, p.userId, `xac_nhan_case:${caseId}`);
    dongBoTrangThaiCase(caseId);
    /* PR-CT2 (§8): bỏ nộp / duyệt kế hoạch — PA Bổ trợ Giữa khoá chạy ngay (FOU nhóm chung: chỉ môn đã có nguyên nhân). */
    const bt = conn.prepare(`SELECT nhom_bo_tro FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status = 'planned' AND nhom_bo_tro IS NOT NULL LIMIT 1`).get(caseId) as any;
    if (bt) chayPaBoTro(conn, bt.nhom_bo_tro, p.userId, today);
    const ten = caseTitleOf({ ...c, title: tenGiua });
    addJourney({
      studentId: c.student_id, cycleId: c.cycle_id ?? null, eventType: 'intervention', eventDate: today,
      title: `Xác nhận Case: ${ten}`, detail: moTa, refTable: 'sos_cases', refId: caseId, createdBy: p.userId, dedupKey: `case-confirm:${caseId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.confirm', entityType: 'sos_case', entityId: caseId, entityLabel: ten,
      after: { primaryCode, urgency, tenGiua },
    });
    return o.chiGhi ? null : caseDetail(p, caseId);   // OV-5a: xác nhận nhóm không đọc lại chi tiết từng Case
  });
}

/**
 * ĐIỀN MỐC QUY CHẾ CÒN TRỐNG (K3-14, Q2): PA quy chế đang chạy `đến MT{n+1}` / `đến lúc thi` mà lúc xác nhận chưa có lịch / ngày thi thì
 * `followup_due` NULL — PA vẫn chạy. Gọi ở ĐƯỜNG ĐỌC (`caseDetail`, `skillSupportBoard`), không cron: có lịch rồi thì lần đọc sau tự điền.
 * Một câu chọn cho cả tập; chỉ dòng tìm được mốc mới ghi (ít dòng). `theo`: tập Case, hoặc mọi Case của một học viên.
 */
export function dienMocQuyChe(theo: { caseIds?: number[]; studentId?: number }) {
  const conn = db();
  const dk = `iv.preset = 1 AND iv.status = 'started' AND iv.followup_due IS NULL AND iv.moc_quy_che IN ('until_next_mt', 'until_exam')`;
  /*
   * PR-S3F #4: ngày thi (JOIN lộ trình + tuần thi) và tuần của MT kế tiếp lấy NGAY trong câu chọn chính — trước đây mỗi dòng thêm 3 câu
   * (`luotSinhPa`, `followUntilAfter`, `examDateOf`) nên Công việc QL với 30 PA "đến lúc thi" chưa có ngày thi tốn 63 → 147 câu. `src` = lượt
   * sinh PA (cùng luật `luotSinhPa`); `tuan_mt_ke` = tuần của lượt kế tiếp chưa huỷ THEO attempt_no (chỉ PA quy chế FT;
   * `followUntilAfter` xếp theo `soThuTuLuot` cho lớp thường — ở FT hai luật trùng nhau).
   */
  const chon = `SELECT iv.*, sc.cycle_id AS case_cycle_id, cy.exam_period_id, cy.exam_month, cy.exam_date,
         ep.code AS exam_week_code, ep.week_start AS exam_week_start,
         (SELECT p.week_start FROM assessment_attempts nx LEFT JOIN report_periods p ON p.id = nx.planned_period_id
           WHERE nx.cycle_id = src.cycle_id AND nx.attempt_no > src.attempt_no AND nx.status != 'cancelled'
           ORDER BY nx.attempt_no LIMIT 1) AS tuan_mt_ke
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
       LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
       LEFT JOIN report_periods ep ON ep.id = cy.exam_period_id
       LEFT JOIN assessment_attempts src ON src.id = (SELECT m.attempt_id FROM case_milestones m JOIN assessment_attempts a ON a.id = m.attempt_id
           WHERE m.case_id = iv.case_id AND m.kind IN ('opened', 'repeat') AND m.created_at <= iv.created_at
           ORDER BY m.created_at DESC, m.id DESC LIMIT 1)`;
  const rows: any[] = [];
  if (theo.studentId != null) {
    rows.push(...conn.prepare(`${chon} WHERE sc.student_id = ? AND sc.status != 'done' AND ${dk}`).all(theo.studentId) as any[]);
  }
  const ids = theo.caseIds ?? [];
  for (let i = 0; i < ids.length; i += 400) {
    const lo = ids.slice(i, i + 400);
    rows.push(...conn.prepare(`${chon} WHERE iv.case_id IN (${lo.map(() => '?').join(',')}) AND ${dk}`).all(...lo) as any[]);
  }
  for (const iv of rows) {
    const moc = mocQuyChe(iv.moc_quy_che, {
      ngayXacNhan: iv.cycle_started_on ?? iv.started_date ?? demoToday(),
      nextMtSunday: iv.moc_quy_che === 'until_next_mt' && iv.tuan_mt_ke ? addDays(mondayOf(iv.tuan_mt_ke), 6) : null,
      examDate: examDateTu(iv),
    });
    if (moc) conn.prepare('UPDATE case_interventions SET followup_due = ?, updated_at = ? WHERE id = ? AND followup_due IS NULL').run(moc, nowIso(), iv.id);
  }
  /* PR-LT2a: PA Bổ trợ đang chạy mà lúc chạy chưa có lịch Cuối khoá — có lịch rồi thì lần đọc sau tự điền (mốc = hết CN tuần Cuối khoá). */
  const dkBt = `iv.kind = 'bo_tro' AND iv.status = 'started' AND iv.followup_due IS NULL AND iv.moc_quy_che = 'den_cuoi_khoa' AND sc.status != 'done'`;
  const chonBt = `SELECT iv.id, sc.cycle_id, (SELECT a.class_id FROM assessment_attempts a WHERE a.id = sc.attempt_id) AS class_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id`;
  const bt: any[] = [];
  if (theo.studentId != null) bt.push(...conn.prepare(`${chonBt} WHERE sc.student_id = ? AND ${dkBt}`).all(theo.studentId) as any[]);
  for (let i = 0; i < ids.length; i += 400) {
    const lo = ids.slice(i, i + 400);
    bt.push(...conn.prepare(`${chonBt} WHERE iv.case_id IN (${lo.map(() => '?').join(',')}) AND ${dkBt}`).all(...lo) as any[]);
  }
  for (const r of bt) {
    const moc = mocCuoiKhoa(r.cycle_id ?? null, r.class_id ?? null);
    if (moc) conn.prepare('UPDATE case_interventions SET followup_due = ?, updated_at = ? WHERE id = ? AND followup_due IS NULL').run(moc, nowIso(), r.id);
  }
}
/**
 * CHUYỂN LỚP FT → FT CÙNG CHƯƠNG TRÌNH (K3-44, Q13): PA theo quy chế chưa khép của Case đang mở đổi người thực hiện sang GVBM đúng kỹ năng
 * ở lớp mới (`suggestCaseOwner`), ghi bàn giao vào lịch sử Case. Đổi chương trình thì hệ thống đóng như cũ — không qua đây.
 */
export function banGiaoPaQuyChe(studentId: number, toClassId: number, actorUserId: number | null) {
  const conn = db();
  const lop = (conn.prepare('SELECT code FROM classes WHERE id = ?').get(toClassId) as any)?.code ?? '';
  const rows = conn.prepare(`SELECT iv.id, iv.case_id, iv.performer_user_id, iv.performer_name, sc.category, sc.topic, u.full_name AS ten_cu
      FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN users u ON u.id = iv.performer_user_id
     WHERE sc.student_id = ? AND sc.status != 'done' AND iv.preset = 1 AND iv.status IN ('planned', 'started')
       AND iv.kind != 'self_study'`).all(studentId) as any[];   // PR-PA (§8): Tự học không có người
  for (const r of rows) {
    const moi = suggestCaseOwner({ classId: toClassId, category: r.category });
    if (!moi || moi === r.performer_user_id) continue;
    const tenMoi = (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(moi) as any)?.full_name ?? '';
    conn.prepare('UPDATE case_interventions SET performer_user_id = ?, performer_name = NULL, updated_at = ? WHERE id = ?').run(moi, nowIso(), r.id);
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'pa_performer', ?, ?, ?, ?)`)
      .run(r.case_id, r.ten_cu ?? r.performer_name ?? null,
        `${r.ten_cu ?? r.performer_name ?? '—'} → ${tenMoi} (GV ${caseTopicLabel(r.topic ?? r.category ?? '')} ${lop})`, actorUserId, nowIso());
  }
}
/**
 * EM QUAY LẠI HỌC (K3-41, Q14): Tạm dừng dừng hạn Case bằng cách LỌC em `inactive` khỏi Việc / Báo QL; quay lại thì hạn tính lại từ ngày
 * quay lại — Case còn chờ (nguyên nhân / xác nhận PA) nhận hạn xác nhận mới, PA đang chạy nhận hạn ghi kết quả mới. Chạy trong tx của nơi gọi.
 */
export function datLaiHanCase(studentId: number, homNay: string) {
  const conn = db();
  /* PR-HAN: hạn theo mức từng Case (5 ngày; Gấp / SOS 3: 3 ngày). */
  for (const c of conn.prepare(`SELECT id, sos_level, urgency FROM sos_cases WHERE student_id = ? AND status != 'done' AND han_xac_nhan IS NOT NULL
      AND (NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sos_cases.id AND ci.role = 'primary')
           OR EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sos_cases.id AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND iv.kind != 'bo_tro'))`)
    .all(studentId) as any[]) {
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ?, updated_at = ? WHERE id = ?').run(hanXacNhan(homNay, { sosLevel: c.sos_level, urgency: c.urgency }), nowIso(), c.id);
  }
  conn.prepare(`UPDATE case_interventions SET action_due = ?, updated_at = ? WHERE status = 'started' AND action_due IS NOT NULL
      AND COALESCE(approval_state, '') != 'pending' AND case_id IN (SELECT id FROM sos_cases WHERE student_id = ? AND status != 'done')`)
    .run(weeklyUpdateDue(homNay), nowIso(), studentId);
}
/** Lượt MT đã sinh PA quy chế này: mốc `opened`/`repeat` mới nhất của Case tạo không muộn hơn PA. */
function luotSinhPa(iv: any): any | null {
  return db().prepare(`SELECT a.* FROM case_milestones m JOIN assessment_attempts a ON a.id = m.attempt_id
     WHERE m.case_id = ? AND m.kind IN ('opened', 'repeat') AND m.created_at <= ? ORDER BY m.created_at DESC, m.id DESC LIMIT 1`)
    .get(iv.case_id, iv.created_at) as any ?? null;
}

/**
 * XÁC NHẬN PA THEO QUY CHẾ (Q28-3, §3.1d Planning tự quyết, K3-46): PA chờ xác nhận → đang chạy TỪ HÔM NAY. Mốc quy chế tính từ ngày
 * xác nhận (`mocQuyChe`); chưa có lịch / ngày thi thì để trống, điền sau (`dienMocQuyChe`). Đổi người thực hiện được; loại PA thì không.
 * Chỉ hàm này đặt `confirmed_at` + `confirmed_by` (người).
 */
export function xacNhanPaQuyChe(p: Principal, interventionId: number, input: {
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null; description?: string | null;
  /** PR-PA (§8): Số buổi — cùng luật Thêm PA (loại có Số buổi, 1–60; không gửi = giữ). */
  soBuoi?: unknown;
}, o: XacNhanTrongLo = {}) {
  const conn = db();
  const iv = conn.prepare(`SELECT iv.*, sc.status AS case_status, sc.cycle_id AS case_cycle_id FROM case_interventions iv
      JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id = ?`).get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  if (!o.daKiemQuyen) caseAccess(iv.case_id).requireEdit(p, EDIT_MESSAGE);
  if (!iv.preset) throw badRequest('Phương án này không phải PA theo quy chế — không cần xác nhận.');
  if (iv.kind === 'bo_tro') throw badRequest('PA bổ trợ chạy khi Xác nhận Case — không xác nhận riêng.');
  if (iv.case_status === 'done') throw badRequest('Case đã đóng — không còn xác nhận PA được.');
  if (iv.confirmed_at || iv.status !== 'planned') throw badRequest('PA này đã được xác nhận rồi.');
  if (!sosCaseState(iv.case_id).hasCause) throw badRequest('Xác nhận nguyên nhân (Xác nhận Case) trước, rồi mới xác nhận PA.');
  /* PR-S4F #9 (Q28-5): mô tả phải do người xác nhận gửi lên — không lấy mô tả máy gán thay (xác nhận "nguyên văn" thì gửi lại đúng chữ đó). */
  if (typeof input.description !== 'string' || !input.description.trim()) {
    throw badRequest('Thiếu mô tả PA — ghi hướng dẫn, trọng tâm và ai thực hiện rồi mới xác nhận.');
  }
  const description = input.description.trim();
  if (description.length < 15) throw badRequest('Mô tả PA cần ít nhất 15 ký tự — nêu hướng dẫn, trọng tâm và ai thực hiện.');
  if (description.length > 2000) throw badRequest('Mô tả PA tối đa 2000 ký tự.');
  /* PR-PA (§8): như Sửa PA — không gửi khoá người = giữ người máy gán. */
  const { performerUserId, performerName } = nguoiSauSua(p, iv, input);
  const soBuoi = soBuoiMoi(iv, input.soBuoi, 0);
  const today = demoToday();
  const luot = luotSinhPa(iv);
  const moc = iv.moc_quy_che
    ? mocQuyChe(iv.moc_quy_che, { ngayXacNhan: today, nextMtSunday: luot ? followUntilAfter(luot) : null, examDate: examDateOf(iv.case_cycle_id) })
    : null;
  return tx(() => {
    conn.prepare(`UPDATE case_interventions SET description = ?, performer_user_id = ?, performer_name = ?, so_buoi = ?, status = 'started', started_date = ?,
        cycle_no = 1, cycle_started_on = ?, action_due = ?, followup_due = ?, confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?`)
      .run(description, performerUserId, performerName, soBuoi, today, today, weeklyUpdateDue(today), moc, p.userId, nowIso(), nowIso(), interventionId);
    /* Sửa bản máy gán lúc xác nhận thì giữ bản gợi ý trong lịch sử (PR-S2 S2, Q7). */
    if (description !== iv.description || performerUserId !== (iv.performer_user_id ?? null) || performerName !== (iv.performer_name ?? null)
        || soBuoi !== (iv.so_buoi ?? null)) {
      ghiBanDieuChinh({
        iv, source: 'confirm_edit', on: today, actorUserId: p.userId, followupId: null, reason: CONFIRM_EDIT_REASON,
        /* Mốc quy chế, ngày bắt đầu không phải "điều chỉnh". */
        after: { description, performerUserId, performerName, followupDue: iv.followup_due ?? null, soBuoi, startedDate: iv.started_date ?? null },
      });
    }
    dongBoTrangThaiCase(iv.case_id);
    const c = conn.prepare('SELECT student_id, cycle_id FROM sos_cases WHERE id = ?').get(iv.case_id) as any;
    addJourney({
      studentId: c.student_id, cycleId: c.cycle_id ?? null, eventType: 'intervention', eventDate: today,
      title: `Xác nhận PA: ${description.slice(0, 60)}`, detail: null,
      refTable: 'case_interventions', refId: interventionId, createdBy: p.userId, dedupKey: `preset-confirm:${interventionId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.preset.confirm', entityType: 'case_intervention', entityId: interventionId,
      entityLabel: `Case ${iv.case_id} · ${iv.kind}`, before: { description: iv.description }, after: { description, followupDue: moc, performerUserId },
    });
    return o.chiGhi ? null : caseDetail(p, iv.case_id);
  });
}
/**
 * `KHÔNG CẦN THEO DÕI` (S4-5…S4-7, T23, YC-12.4): GVBM đúng kỹ năng (C02) hoặc Quản lý trong phạm vi GỬI Quản lý duyệt một thẻ `khong_theo_doi`
 * kèm lý do chọn nhanh. Case CHƯA đóng: hàng Case "Chờ Quản lý duyệt · không theo dõi", việc Xác nhận nguyên nhân rời Việc của GVBM và không
 * sinh Báo QL (`awaitingCauseCaseIds` loại thẻ đang chờ). Duyệt → `apDungKhongTheoDoi`; Từ chối → `tuChoiKhongTheoDoi` (hạn mới theo `hanXacNhan`).
 *
 * Chỉ khi Case còn CHỜ NGUYÊN NHÂN (S4-2: hai lựa chọn loại trừ, Q4) — đã xác nhận nguyên nhân thì kết thúc bằng Hoàn thành Case.
 * QL kiêm GVBM tự gửi thì tự duyệt được như mọi thẻ (Q-D, Câu hỏi 2 = A: thẻ ghi "tự duyệt", báo Quản trị).
 */
export function guiKhongTheoDoi(p: Principal, caseId: number, input: { reasonCode?: string | null; reasonText?: string | null }) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy Case');
  caseAccess(caseId).requireEdit(p, EDIT_MESSAGE);
  if (c.status === 'done') throw badRequest('Case này đã đóng rồi.');
  const st = sosCaseState(caseId);
  if (!st.fromSos) {
    throw badRequest('Chỉ Case tự tạo từ kết quả Test mới gửi "Không cần theo dõi" được — Case này không phải Case tự tạo.');
  }
  if (st.choDuyetKhongTheoDoi) throw badRequest('Case đã gửi "Không cần theo dõi" — đang chờ Quản lý duyệt.');
  if (st.hasCause) throw badRequest('Case đã xác nhận nguyên nhân — kết thúc bằng Hoàn thành Case.');
  const code = String(input.reasonCode ?? '');
  if (!(CASE_DISMISS_REASONS as readonly string[]).includes(code)) {
    throw badRequest(`Chọn một lý do: ${CASE_DISMISS_REASONS.map((r) => CASE_DISMISS_REASON_LABEL[r]).join(' · ')}.`);
  }
  const text = String(input.reasonText ?? '').trim();
  if (reasonNeedsText(code)) {
    const loi = kiemGhiRoKhac(text);
    if (loi) throw badRequest(`Lý do "Khác": ${loi}.`);
  }
  if (text.length > 300) throw badRequest('Lý do tối đa 300 ký tự.');
  const started = conn
    .prepare(`SELECT COUNT(*) n FROM case_interventions iv WHERE iv.case_id = ? AND iv.status != 'cancelled'
                AND NOT ${UNCONFIRMED_PRESET('iv')} AND NOT ${PA_QUY_CHE_CHUA_GHI('iv')}`)
    .get(caseId) as any;
  const followed = conn.prepare('SELECT COUNT(*) n FROM case_followups WHERE case_id = ?').get(caseId) as any;
  if (started.n > 0 || followed.n > 0) {
    throw badRequest('Case này đã có phương án được xác nhận hoặc đang chạy — kết thúc bằng Hoàn thành Case.');
  }
  const lyDo = `${CASE_DISMISS_REASON_LABEL[code as CaseDismissReason]}${reasonNeedsText(code) ? ` — ${text}` : ''}`;
  const today = demoToday();
  return tx(() => {
    const id = taoYeuCau(conn, {
      loai: 'khong_theo_doi', doiTuongLoai: 'sos_case', doiTuongId: caseId, hocVienId: c.student_id ?? null,
      nguoiXin: p.userId, lyDo, duLieu: { reasonCode: code, reasonText: reasonNeedsText(code) ? text : null },
    });
    if (id === null) throw badRequest('Case đã gửi "Không cần theo dõi" — đang chờ Quản lý duyệt.');
    ghiMoc(caseId, 'xin_khong_theo_doi', today, lyDo, p.userId);
    writeAudit({
      actorUserId: p.userId, action: 'case.dismiss.request', entityType: 'sos_case', entityId: caseId, entityLabel: `Không cần theo dõi · ${lyDo}`,
      after: { reason: code, yeuCauId: id },
    });
    return caseDetail(p, caseId);
  });
}

/**
 * QUẢN LÝ DUYỆT "Không cần theo dõi" — chạy TRONG giao dịch của hộp (`duyetYeuCau`), người duyệt đã được hộp kiểm quyền. Case đóng
 * (`dismiss_reason_*`, giữ lịch sử), PA quy chế chưa có kết quả tuần huỷ `khong_theo_doi` (không tính thất bại, không vào hiệu quả — K5-55); PR-S3F: huỷ MỌI PA planned/started.
 * Lỗi thì ném để hộp rollback cả thẻ.
 */
export function apDungKhongTheoDoi(conn: any, yc: { doi_tuong_id: number; du_lieu: string | null; ly_do: string | null }, nguoiDuyet: number) {
  const caseId = yc.doi_tuong_id;
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy Case');
  if (c.status === 'done') throw badRequest('Case này đã đóng rồi.');
  let d: { reasonCode?: string; reasonText?: string | null } = {};
  try { d = JSON.parse(yc.du_lieu ?? '{}'); } catch { d = {}; }
  const code = String(d.reasonCode ?? 'other');
  const note = `Không cần theo dõi · ${yc.ly_do ?? CASE_DISMISS_REASON_LABEL[code as CaseDismissReason] ?? ''}`;
  const today = demoToday();
  const cancelled = conn
    .prepare(`UPDATE case_interventions SET status = 'cancelled', closed_reason = 'khong_theo_doi', updated_at = ?
               WHERE case_id = ? AND status IN ('planned', 'started')`)   // PR-S3F #2: MỌI PA còn sống, kể cả PA GV tự thêm lúc thẻ đang chờ (ngoài hiệu quả PA: chỉ `completed` được đếm)
    .run(nowIso(), caseId).changes;
  conn
    .prepare(`UPDATE sos_cases SET status = 'done', closed_at = ?, closed_by = ?, dismiss_reason_code = ?, dismiss_reason_text = ?,
                disposition = COALESCE(disposition, 'no_action'), outcome_note = ?, updated_at = ? WHERE id = ?`)
    .run(today, nguoiDuyet, code, d.reasonText ?? null, note, nowIso(), caseId);
  conn
    .prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'status', ?, 'done', ?, ?)`)
    .run(caseId, c.status, nguoiDuyet, nowIso());
  ghiMoc(caseId, 'ql_duyet_khong_theo_doi', today, null, nguoiDuyet);
  ghiMoc(caseId, 'closed', today, note, nguoiDuyet, `dismiss:${caseId}`);
  addJourney({
    studentId: c.student_id, cycleId: c.cycle_id ?? null, eventType: 'case_closed', eventDate: today,
    title: 'Không cần theo dõi', detail: note, refTable: 'sos_cases', refId: caseId, createdBy: nguoiDuyet, dedupKey: `case_dismiss:${caseId}`,
  });
  /* PR-UXF-b (R5-4): Báo phụ huynh theo CASE — môn của Case này rời việc Báo PH của mọi bài Giữa khoá nối với nó (còn môn khác thì việc còn; hết môn thì việc chưa làm tự rút). */
  for (const r of conn.prepare(`SELECT DISTINCT attempt_id FROM case_signals WHERE case_id = ? AND attempt_id IS NOT NULL`).all(caseId) as any[]) dongBoBaoPhCuaBai(r.attempt_id);
  writeAudit({
    actorUserId: nguoiDuyet, action: 'case.dismiss', entityType: 'sos_case', entityId: caseId, entityLabel: note,
    before: { status: c.status }, after: { status: 'done', reason: code, cancelledPlans: cancelled },
  });
}

/** QUẢN LÝ TỪ CHỐI "Không cần theo dõi" (trong tx của hộp): Case về chờ nguyên nhân, hạn mới 5 ngày (Gấp / SOS 3: 3) từ ngày từ chối; báo GVBM phụ trách. */
export function tuChoiKhongTheoDoi(conn: any, yc: { doi_tuong_id: number; nguoi_xin: number | null }, nguoiDuyet: number, lyDo: string) {
  const caseId = yc.doi_tuong_id;
  const c = conn.prepare('SELECT id, owner_user_id, sos_level, urgency, (SELECT full_name FROM students WHERE id = sos_cases.student_id) AS hv FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy Case');
  const today = demoToday();
  const han = hanXacNhan(today, { sosLevel: c.sos_level, urgency: c.urgency });
  conn.prepare('UPDATE sos_cases SET han_xac_nhan = ?, updated_at = ? WHERE id = ?').run(han, nowIso(), caseId);
  ghiMoc(caseId, 'ql_tu_choi_khong_theo_doi', today, lyDo, nguoiDuyet);
  /* Người xin đã nhận "Quản lý từ chối: …" từ hộp; GVBM phụ trách khác người xin thì báo riêng. */
  if (c.owner_user_id && c.owner_user_id !== yc.nguoi_xin && c.owner_user_id !== nguoiDuyet) {
    notify({
      userId: c.owner_user_id, kind: 'sos', title: `Bị từ chối · Không cần theo dõi · ${c.hv ?? 'học viên'}`.slice(0, 200),
      body: `${lyDo.slice(0, 120)} — xác nhận nguyên nhân trước hết ${ngay(han, today)}`,
      entityType: 'sos_case', entityId: caseId, dedupKey: `tu_choi_ktd:${caseId}:${today}`,
    });
  }
}
