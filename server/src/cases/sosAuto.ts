import { db, tx } from '../db.ts';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, CONFIRM_EDIT_REASON, URGENCY_LEVELS, academicSupportFor, caseTopicLabel, issueBranchOf,
  hanXacNhan, issuesForTopic, kiemGhiRoKhac, laKhac, mocQuyChe, ngay, reasonNeedsText, tenCaseSos, weeklyUpdateDue,
  type AcademicSupportPreset, type CaseDismissReason, type MilestoneKind,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, notFound, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { suggestCaseOwner } from './owner.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { routeCuaLuot } from '../fasttrack/attempts.ts';
import { addIssues, caseAccess, caseDetail, caseTitleOf } from './cases.ts';
import { chuanHoaNguoiThucHien } from './nguoiThucHien.ts';
import { followUntilAfter } from './sos.ts';
import { taoYeuCau } from '../duyet/yeuCau.ts';
import { PA_QUY_CHE_CHUA_GHI, UNCONFIRMED_PRESET, dongBoTrangThaiCase, sosCaseState } from './sosState.ts';
import { ghiBanDieuChinh } from './planRevisions.ts';

export { UNCONFIRMED_PRESET, NOT_UNCONFIRMED_PRESET, PA_QUY_CHE_CHUA_GHI } from './sosState.ts';

/**
 * SOS TỰ TẠO CASE — PHẦN GHI DỮ LIỆU (SOS v4, PR-SOS; đặc tả 27/09 §3.1d + §5.3 S4-1…S4-7, Q28-3).
 *
 * Chỉ lượt Mock Test FAST TRACK mới đi qua đây (Q-V3-1). Lớp Normal giữ mô hình tín hiệu cũ — không case tự tạo, không phương án điền
 * sẵn, không Phối hợp SOS.
 *
 * `cases/sos.ts` (nơi sở hữu `raiseSignalsForResult`, `taoCaseTuDong`) quyết định KHI NÀO tạo hay gắn case; file này lo phần "PA theo quy chế":
 *   · dựng PA theo bảng MT × mức SOS (`shared/domain/sos.ts`) — PA "CHỜ XÁC NHẬN", KHÔNG tự chạy (Q28-3),
 *   · đồng bộ PA quy chế chờ xác nhận khi mức SOS của lượt đổi (Q24),
 *   · Xác nhận Case → Xác nhận PA, Không cần theo dõi (thẻ Chờ duyệt) — phần dưới.
 *
 * PA QUY CHẾ CHỜ XÁC NHẬN = `preset = 1 AND confirmed_at IS NULL AND status = 'planned'` (`UNCONFIRMED_PRESET`) — biểu diễn có sẵn, mọi
 * lọc (việc Ghi kết quả, hiệu quả PA, `updateResult`) tự loại nó. Loại mốc lưu `moc_quy_che`; mốc (`followup_due`) tính lúc Xác nhận PA,
 * từ NGÀY XÁC NHẬN (K3-46). Chỉ Xác nhận PA mới đặt `confirmed_at` + `confirmed_by`.
 */

/**
 * Lượt này có phải Mock Test Fast Track không. Chỉ lượt Mock của lớp chấm theo band mới tự tạo case / phối hợp; Progress/Final Test của
 * lớp Normal (chấm theo tỷ lệ) thì không.
 */
export function isFastTrackMock(attempt: { kind?: string | null }, scoringMode: 'band' | 'ratio'): boolean {
  return (attempt.kind ?? 'mock') === 'mock' && scoringMode === 'band';
}

/**
 * NGÀY THI DỰ KIẾN của lộ trình, chỉ khi ĐÃ CHỐT TUẦN (`examPlanOf` mức `week`): hết Chủ nhật của tuần thi. Mới biết tháng thì để TRỐNG —
 * bịa một ngày là tạo hạn giả. (Đặc tả §4: "ngày thi dự kiến nếu có".)
 */
export function examDateOf(cycleId: number | null | undefined): string | null {
  if (!cycleId) return null;
  const c = db().prepare('SELECT exam_period_id, exam_month FROM learning_cycles WHERE id = ?').get(cycleId) as any;
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
  const info = db()
    .prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, needs_approval, preset,
                                       moc_quy_che, created_at)
       VALUES (?,?,?,?, NULL, 'planned', 0, 1, ?, ?)`,
    )
    .run(input.caseId, p.kind, p.description, performer, p.span, nowIso());
  return Number(info.lastInsertRowid);
}

/**
 * ĐỒNG BỘ PA QUY CHẾ CHỜ XÁC NHẬN với mức SOS hiện tại của lượt (PR-N1 Q24, PR-SOS).
 *
 * Điểm thường được nhập từng kỹ năng, bởi từng GVBM, vào những lúc khác nhau — nên case đầu tiên ra đời khi lượt mới ở SOS1, trước khi
 * SOS3 xuất hiện. Đặc tả §4 nói phương án theo MỨC SOS CỦA CẢ LƯỢT, nên PA chờ xác nhận phải theo mức mới nhất. PA đã xác nhận thì
 * không bao giờ bị đụng.
 *
 * Áp cho case mà lượt này mở (`opened`) hoặc trượt lại (`repeat`): PA chờ xác nhận chưa chạy nên đi theo hàng MT mới nhất.
 */
export function resyncUnconfirmedPresets(
  attempt: { id: number; attempt_no: number; cycle_id?: number | null },
  sosLevel: number | null,
) {
  if (!presetFor(attempt, sosLevel)) return;
  /* PR-SOS: chỉ PA CHỜ XÁC NHẬN (PA đã xác nhận là việc thật — không đụng); `followup_due` luôn NULL tới lúc xác nhận. */
  const rows = db()
    .prepare(
      `SELECT iv.id, iv.kind, iv.description, iv.moc_quy_che
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE ${PA_QUY_CHE_CHUA_GHI('iv')} AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sc.id AND m.kind IN ('opened', 'repeat') AND m.attempt_id = ?)`,
    )
    .all(attempt.id) as any[];
  for (const iv of rows) {
    const p = presetFor(attempt, sosLevel)!;
    if (iv.kind === p.kind && iv.description === p.description && iv.moc_quy_che === p.span) continue;
    db()
      .prepare('UPDATE case_interventions SET kind = ?, description = ?, moc_quy_che = ?, updated_at = ? WHERE id = ?')
      .run(p.kind, p.description, p.span, nowIso(), iv.id);
  }
}

/** Ghi hành trình + audit + báo GVBM (người phụ trách) cho một case vừa được SOS tự tạo. `hanXacNhan` = `sos_cases.han_xac_nhan`. */
export function announceAutoCase(input: {
  caseId: number; studentId: number; cycleId: number | null; skillLabel: string; attemptNo: number;
  sosLevel: number | null; ownerUserId: number | null; detectedOn: string; hanXacNhan: string; actorUserId: number | null;
}) {
  const st = db().prepare('SELECT full_name FROM students WHERE id = ?').get(input.studentId) as any;
  const ten = tenCaseSos({ mt: input.attemptNo, giua: `${input.skillLabel} không đạt`, sos: input.sosLevel });
  addJourney({
    studentId: input.studentId, cycleId: input.cycleId, eventType: 'case_opened', eventDate: input.detectedOn,
    title: `SOS tự tạo Case ${ten}`,
    detail: 'PA theo quy chế chờ GVBM xác nhận.',
    refTable: 'sos_cases', refId: input.caseId, createdBy: input.actorUserId,
    dedupKey: `case_open:${input.caseId}`,
  });
  writeAudit({
    actorUserId: input.actorUserId, action: 'case.auto_from_sos', entityType: 'sos_case', entityId: input.caseId,
    entityLabel: `${st?.full_name ?? ''} · ${input.skillLabel}`, after: { attemptNo: input.attemptNo, sosLevel: input.sosLevel },
  });
  if (input.ownerUserId) {
    notify({
      userId: input.ownerUserId, kind: 'sos',
      title: `Case mới: ${ten}${st?.full_name ? ` — ${st.full_name}` : ''}`,
      body: `Xác nhận nguyên nhân trước hết ${ngay(input.hanXacNhan, demoToday())}`,
      entityType: 'sos_case', entityId: input.caseId, dedupKey: `sos-case:${input.caseId}`,
    });
  }
}

// ---------------------------------------------------------------- Xác nhận Case · Xác nhận PA · Không cần theo dõi (S4-2…S4-7)

const EDIT_MESSAGE = 'Bạn chỉ xử lý được case của kỹ năng mình được phân công (hoặc là Quản lý trong phạm vi).';

/** Ghi một mốc của Case (khoá chống trùng tuỳ chọn). Viết tại chỗ để không import vòng `sos.ts`. */
function ghiMoc(caseId: number, kind: MilestoneKind, on: string, note: string | null, actor: number | null, dedupKey: string | null = null) {
  db().prepare(`INSERT OR IGNORE INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key) VALUES (?,?,?,?,?,?,?)`)
    .run(caseId, kind, on, note, actor, nowIso(), dedupKey);
}

/** Phần giữa của tên Case SOS — người sửa được (lưu `title`), mặc định `{kỹ năng} không đạt`. */
export function tenGiuaCua(c: { title?: string | null; topic?: string | null; category?: string | null; cycle_id?: number | null }): string {
  const own = (c.title ?? '').trim();
  if (own) return own;
  const ct = c.cycle_id ? (db().prepare('SELECT programme_code ct FROM learning_cycles WHERE id = ?').get(c.cycle_id) as any)?.ct ?? null : null;
  return `${caseTopicLabel(c.topic ?? c.category ?? '', ct)} không đạt`;
}

/**
 * XÁC NHẬN CASE (S4-3, M7, YC-12.3): GVBM đúng kỹ năng (C02) hoặc Quản lý trong phạm vi ghi nguyên nhân + mức gấp + mô tả + phần giữa tên.
 * Chỉ khi Case từ SOS còn chờ nguyên nhân và KHÔNG có thẻ Không cần theo dõi đang chờ (S4-2 hai lựa chọn loại trừ). Case vẫn `open`
 * tới khi có PA do người xác nhận (Q28-5) — giao diện chuyển thẳng sang Xác nhận PA.
 */
export function xacNhanCase(p: Principal, caseId: number, input: {
  primaryCode?: string | null; observation?: string | null; urgency?: string | null; moTa?: string | null; tenGiua?: string | null;
}) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy case');
  caseAccess(caseId).requireEdit(p, EDIT_MESSAGE);
  const st = sosCaseState(caseId);
  if (!st.fromSos) throw badRequest('Chỉ Case tự tạo từ SOS mới có bước Xác nhận Case.');
  if (c.status === 'done') throw badRequest('Case này đã đóng rồi.');
  if (st.hasCause) throw badRequest('Case đã xác nhận nguyên nhân rồi.');
  if (st.choDuyetKhongTheoDoi) throw badRequest('Case đang chờ Quản lý duyệt "Không cần theo dõi" — chờ trả lời rồi mới xác nhận.');
  const ct = c.cycle_id ? (conn.prepare('SELECT programme_code ct FROM learning_cycles WHERE id = ?').get(c.cycle_id) as any)?.ct ?? null : null;
  const primaryCode = String(input.primaryCode ?? '').trim();
  if (!primaryCode) throw badRequest('Chọn phân loại nguyên nhân.');
  if (!issueBranchOf(primaryCode) || !issuesForTopic(c.topic, ct).some((i) => i.code === primaryCode)) {
    throw badRequest(`Phân loại đã chọn không thuộc bộ phân loại của ${caseTopicLabel(c.topic, ct)}.`);
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
  const tenGiua = input.tenGiua === undefined || input.tenGiua === null ? tenGiuaCua(c) : String(input.tenGiua).trim();
  if (tenGiua.length < 3 || tenGiua.length > 80) throw badRequest('Tên Case (phần giữa) cần từ 3 đến 80 ký tự.');
  const today = demoToday();
  return tx(() => {
    addIssues(caseId, p.userId, { primaryCode, observation, topic: c.topic });
    conn.prepare('UPDATE sos_cases SET urgency = ?, summary = ?, title = ?, updated_at = ? WHERE id = ?').run(urgency, moTa, tenGiua, nowIso(), caseId);
    ghiMoc(caseId, 'xac_nhan_case', today, moTa, p.userId, `xac_nhan_case:${caseId}`);
    dongBoTrangThaiCase(caseId);
    const ten = caseTitleOf({ ...c, title: tenGiua });
    addJourney({
      studentId: c.student_id, cycleId: c.cycle_id ?? null, eventType: 'intervention', eventDate: today,
      title: `Xác nhận Case: ${ten}`, detail: moTa, refTable: 'sos_cases', refId: caseId, createdBy: p.userId, dedupKey: `case-confirm:${caseId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.confirm', entityType: 'sos_case', entityId: caseId, entityLabel: ten,
      after: { primaryCode, urgency, tenGiua },
    });
    return caseDetail(p, caseId);
  });
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
}) {
  const conn = db();
  const iv = conn.prepare(`SELECT iv.*, sc.status AS case_status, sc.cycle_id AS case_cycle_id FROM case_interventions iv
      JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id = ?`).get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  caseAccess(iv.case_id).requireEdit(p, EDIT_MESSAGE);
  if (!iv.preset) throw badRequest('Phương án này không phải PA theo quy chế — không cần xác nhận.');
  if (iv.case_status === 'done') throw badRequest('Case đã đóng — không còn xác nhận PA được.');
  if (iv.confirmed_at || iv.status !== 'planned') throw badRequest('PA này đã được xác nhận rồi.');
  if (!sosCaseState(iv.case_id).hasCause) throw badRequest('Xác nhận nguyên nhân (Xác nhận Case) trước, rồi mới xác nhận PA.');
  const description = String(input.description ?? iv.description ?? '').trim();
  if (description.length < 15) throw badRequest('Mô tả PA cần ít nhất 15 ký tự — nêu hướng dẫn, trọng tâm và ai thực hiện.');
  if (description.length > 2000) throw badRequest('Mô tả PA tối đa 2000 ký tự.');
  const nguoi = chuanHoaNguoiThucHien(p, input, { nhom: 'giao_vien', batBuoc: false });
  const performerUserId = nguoi ? nguoi.userId : iv.performer_user_id ?? null;
  const performerName = nguoi ? nguoi.name : iv.performer_name ?? null;
  const today = demoToday();
  const luot = luotSinhPa(iv);
  const moc = iv.moc_quy_che
    ? mocQuyChe(iv.moc_quy_che, { ngayXacNhan: today, nextMtSunday: luot ? followUntilAfter(luot) : null, examDate: examDateOf(iv.case_cycle_id) })
    : null;
  return tx(() => {
    conn.prepare(`UPDATE case_interventions SET description = ?, performer_user_id = ?, performer_name = ?, status = 'started', started_date = ?,
        cycle_no = 1, cycle_started_on = ?, action_due = ?, followup_due = ?, confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?`)
      .run(description, performerUserId, performerName, today, today, weeklyUpdateDue(today), moc, p.userId, nowIso(), nowIso(), interventionId);
    /* Sửa bản máy gán lúc xác nhận thì giữ bản gợi ý trong lịch sử (PR-S2 S2, Q7). */
    if (description !== iv.description || performerUserId !== (iv.performer_user_id ?? null) || performerName !== (iv.performer_name ?? null)) {
      ghiBanDieuChinh({
        iv, source: 'confirm_edit', on: today, actorUserId: p.userId, followupId: null, reason: CONFIRM_EDIT_REASON,
        after: { description, performerUserId, performerName, followupDue: moc },
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
    return caseDetail(p, iv.case_id);
  });
}
/**
 * `KHÔNG CẦN THEO DÕI` (S4-5…S4-7, T23, YC-12.4): GVBM đúng kỹ năng (C02) hoặc Quản lý trong phạm vi GỬI Quản lý duyệt một thẻ `khong_theo_doi`
 * kèm lý do chọn nhanh. Case CHƯA đóng: hàng Case "Chờ Quản lý duyệt · không theo dõi", việc Xác nhận nguyên nhân rời Việc của GVBM và không
 * sinh Báo lên (`awaitingCauseCaseIds` loại thẻ đang chờ). Duyệt → `apDungKhongTheoDoi`; Từ chối → `tuChoiKhongTheoDoi` (hạn mới 3 ngày).
 *
 * Chỉ khi Case còn CHỜ NGUYÊN NHÂN (S4-2: hai lựa chọn loại trừ, Q4) — đã xác nhận nguyên nhân thì kết thúc bằng Hoàn thành Case.
 * QL kiêm GVBM tự gửi thì tự duyệt được như mọi thẻ (Q-D, Câu hỏi 2 = A: thẻ ghi "tự duyệt", báo Quản trị).
 */
export function guiKhongTheoDoi(p: Principal, caseId: number, input: { reasonCode?: string | null; reasonText?: string | null }) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy case');
  caseAccess(caseId).requireEdit(p, EDIT_MESSAGE);
  if (c.status === 'done') throw badRequest('Case này đã đóng rồi.');
  const st = sosCaseState(caseId);
  if (!st.fromSos) {
    throw badRequest('Chỉ gửi "Không cần theo dõi" được với case tự tạo từ SOS — case này không phải case tự tạo từ SOS.');
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
 * (`dismiss_reason_*`, giữ lịch sử), PA quy chế chưa có kết quả tuần huỷ `khong_theo_doi` (không tính thất bại, không vào hiệu quả — K5-55).
 * Lỗi thì ném để hộp rollback cả thẻ.
 */
export function apDungKhongTheoDoi(conn: any, yc: { doi_tuong_id: number; du_lieu: string | null; ly_do: string | null }, nguoiDuyet: number) {
  const caseId = yc.doi_tuong_id;
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy case');
  if (c.status === 'done') throw badRequest('Case này đã đóng rồi.');
  let d: { reasonCode?: string; reasonText?: string | null } = {};
  try { d = JSON.parse(yc.du_lieu ?? '{}'); } catch { d = {}; }
  const code = String(d.reasonCode ?? 'other');
  const note = `Không cần theo dõi · ${yc.ly_do ?? CASE_DISMISS_REASON_LABEL[code as CaseDismissReason] ?? ''}`;
  const today = demoToday();
  const cancelled = conn
    .prepare(`UPDATE case_interventions SET status = 'cancelled', closed_reason = 'khong_theo_doi', updated_at = ?
               WHERE case_id = ? AND ${PA_QUY_CHE_CHUA_GHI('case_interventions')}`)
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
  writeAudit({
    actorUserId: nguoiDuyet, action: 'case.dismiss', entityType: 'sos_case', entityId: caseId, entityLabel: note,
    before: { status: c.status }, after: { status: 'done', reason: code, cancelledPlans: cancelled },
  });
}

/** QUẢN LÝ TỪ CHỐI "Không cần theo dõi" (trong tx của hộp): Case về chờ nguyên nhân, hạn mới 3 ngày từ ngày từ chối; báo GVBM phụ trách. */
export function tuChoiKhongTheoDoi(conn: any, yc: { doi_tuong_id: number; nguoi_xin: number | null }, nguoiDuyet: number, lyDo: string) {
  const caseId = yc.doi_tuong_id;
  const c = conn.prepare('SELECT id, owner_user_id FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy case');
  const today = demoToday();
  const han = hanXacNhan(today);
  conn.prepare('UPDATE sos_cases SET han_xac_nhan = ?, updated_at = ? WHERE id = ?').run(han, nowIso(), caseId);
  ghiMoc(caseId, 'ql_tu_choi_khong_theo_doi', today, lyDo, nguoiDuyet);
  /* Người xin đã nhận "Quản lý từ chối: …" từ hộp; GVBM phụ trách khác người xin thì báo riêng. */
  if (c.owner_user_id && c.owner_user_id !== yc.nguoi_xin && c.owner_user_id !== nguoiDuyet) {
    notify({
      userId: c.owner_user_id, kind: 'sos', title: `Quản lý từ chối: ${lyDo}`.slice(0, 200),
      body: `Không cần theo dõi bị từ chối — xác nhận nguyên nhân trước hết ${ngay(han, today)}`,
      entityType: 'sos_case', entityId: caseId, dedupKey: `tu_choi_ktd:${caseId}:${today}`,
    });
  }
}
