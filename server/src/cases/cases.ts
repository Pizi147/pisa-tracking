import { db, laTrungKhoa, theoKhoaGui, theoLo, tx } from '../db.ts';
import { anhEmNhom, boTroCuaCase, chepKetQuaNhom, quyenBoTro, type BoTroDto } from './boTro.ts';
import { ghiMiniTestTrongTx, kiemMiniTest, laNguoiGiuMiniTestCuaPa } from '../normal/cuoiKhoa.ts';
import {
  DISPOSITIONS, INTERVENTION_KINDS, SYSTEM_KINDS, INTERVENTION_KIND_LABEL, INTERVENTION_STATUSES, tenPaViecTiep,
  INTERVENTION_STATUS_LABEL,
  FOLLOWUP_OUTCOMES, CASE_DECISIONS, CASE_OUTCOMES, ENTRY_SKILLS,
  ISSUE_ROLES, PERMISSIONS, URGENCY_LEVELS, DEFAULT_URGENCY,
  isNoPlanCase,
  issuesForTopic,
  CASE_CATEGORY_SHORT, CASE_CATEGORIES, CASE_CATEGORY_LABEL, FOLLOWUP_OUTCOME_LABEL, ratioResult,
  caseCategoriesFor, chuanKhoaGui, componentsAreCounts, componentsFor, type CaseCategory,
  CASE_OUTCOME_LABEL, SYSTEM_CLOSE_REASON_LABEL, caseCategoryLabel, caseDedupKey, caseHeadline, caseTitle, categoryOf,
  type SystemCloseReason,
  NEXT_STEP_LABEL, isProposalKind, outcomeLabelFor,
  RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL, RESULT_MODES, RESULT_MODE_LABEL,
  canEndWithOutcome, hanThemPa, stepsForMode, hanKe, hanKyGhiKetQua, LY_DO_KET_THUC_PA_TOI_THIEU,
  HAN_DUYET_NGAY, hanTheoNgay,
  type NextStep, type RescheduleTarget,
  issueBranchOf, issueLabel, caseTopicLabel, urgencyFromSos, docNhomNguyenNhan, NHAN_XET_MT_TOI_THIEU, NHAN_XET_TOI_DA,
  SIGNAL_WITHDRAW_SCORE_FIXED, caseTopicsFor, ghepKhac, kiemGhiRoKhac, laKhac, chanHoanThanh, laLanGhiCuoi, mocChuPa, programmeOf, quyetDinhChoPa, trangThaiCaseV4, viecTiepCuaCase, tenCaseSos, tenCaseThuong, nhanDot, tenMon, tenMonNgan, moiNhatTruoc,
  type CaseOutcome, type FollowUpOutcome, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { HttpError, addDays, badRequest, conflict, loi, chuTuDo, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, isCoreTeacherOf, napTruocPhamVi, require_, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { nho, trongBoNho } from '../platform/nguCanhRequest.ts';
import { addJourney, notify, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { currentCycle, cyclesOf } from '../fasttrack/cycles.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { dongHocVien, khoangTamDung } from '../students/tamDung.ts';
import { activeClassOf } from '../yThuc/access.ts';
import { isRatioCycle, nguongDatLop, programmeCodeOfCycle } from '../normal/regular.ts';
import { chuCaseTheoKyNang, doiChuCua, suggestCaseOwner } from './owner.ts';
import { caseKhacChuongTrinh, chuongTrinhCuaLop } from './sos.ts';
import { duLieuDoiPa, ghiDoiPa, kiemTruocDoiPa, rutDoiPa, type VaoDoiPa } from './doiPa.ts';
import { CASE_THAT, LA_CASE_SOS, choDoiPa, NOT_UNCONFIRMED_PRESET, awaitingCauseCaseIds, dongBoTrangThaiCase, dongBoTrangThaiCaseLo, sosCaseState, xuLyCaseMany } from './sosState.ts';
import { CAU_LUU_TRU, PLAN_DECISIONS, duocHoanTacPa, canBuoiTutor, coNguoiDay, coSoBuoiKy, decisionToStep, duongDotTest, kiemBuoiTutor, kiemSoBuoiTuan, soBuoiTu, tuanLich, type BuoiTutor, type PlanDecision } from '../../../shared/domain/index.ts';
import { chenPa } from './taoPa.ts';
import { ganMoTaTuO } from './nguyenNhanO.ts';
import { quyenPhuTrachS } from '../fasttrack/attempts.ts';
import { nguoiGiuKetQua, type DongGiuKetQua } from './giuKetQua.ts';
import { apDungDieuChinh, chuanHoaDieuChinh, daDayCua, ghiBanDieuChinh, lichSuDieuChinhCuaCase, nguoiSauSua, soBuoiMoi } from './planRevisions.ts';
import { chuanHoaNguoiThucHien } from './nguoiThucHien.ts';
import { dienMocQuyChe, kiemNoiDungCase, mtCuoiNho, tenGiuaCua } from './sosAuto.ts';
import { xoaTepSauGiaoDich } from '../platform/attachments.ts';
import { boSungYeuCau, chotYeuCau, taoYeuCau, theCuaDoiTuong } from '../duyet/yeuCau.ts';

/**
 * CASE HỌC VỤ — một vòng đời cho cả hai nguồn.
 *
 * Case sinh từ kết quả đánh giá và Case do giáo viên báo đi qua ĐÚNG một bộ máy: cùng
 * trạng thái, cùng hướng xử lý, cùng tác động, cùng cách xem lại. Nếu tách thành hai luồng
 * thì mọi màn hình tổng hợp về sau phải cộng hai nguồn bằng tay, và sẽ lệch.
 *
 * Khác nhau duy nhất là CĂN CỨ MỞ case:
 *   - `mock`: hệ thống tự mở khi có kỹ năng dưới kỳ vọng, `sos_level` là số kỹ năng đó.
 *   - `teacher_report`: giáo viên chủ động báo, `sos_level` để NULL và dùng `urgency`.
 */

// ---------------------------------------------------------------- quyền

/** Người đang xem có được đóng Case này không: GVCN của lớp, hoặc Quản lý trong phạm vi. */
/**
 * TÊN CASE — tự sinh, cập nhật theo MỐC MỚI NHẤT.
 *
 * Suy lúc đọc chứ không ghi vào database: sửa điểm thì tên đổi theo, không để lại một cái
 * tên cũ nói sai sự thật. Tiền tố `MT{n}` là cách nhận ra Case đã bị điểm chạm vào; Case
 * giáo viên tự báo mà chưa lượt MT nào chạm thì không có tiền tố.
 */
export function caseTitleOf(c: {
  id: number; category?: string | null; topic?: string | null;
  origin_kind?: string | null; sos_level?: number | null; title?: string | null; kck?: number | null;
}): string {
  /*
   * TÊN NGƯỜI TẠO ĐẶT THẮNG TÊN SUY RA. Case tạo tay có tên riêng vì không có gì để suy;
   * và không được tự gán "… dưới kỳ vọng" cho một Case không sinh từ điểm (mục 7.3).
   */
  const own = (c.title ?? '').trim();
  if (own && c.origin_kind !== 'mock') return own;
  const latest = db()
    .prepare(
      `SELECT m.attempt_no, a.kind, cl.programme_code AS ct,
              (SELECT cl2.programme_code FROM case_milestones m2 JOIN assessment_attempts a2 ON a2.id = m2.attempt_id JOIN classes cl2 ON cl2.id = a2.class_id
                WHERE m2.case_id = m.case_id ORDER BY m2.id LIMIT 1) AS ct_goc
         FROM case_milestones m
         LEFT JOIN assessment_attempts a ON a.id = m.attempt_id
         LEFT JOIN classes cl ON cl.id = a.class_id
        WHERE m.case_id = ? AND m.attempt_no IS NOT NULL`,
    )
    .all(c.id).sort(moiNhatTruoc as any)[0] as any;   // lớp thường: Final mới hơn Progress dù attempt_no nhỏ hơn
  /* PR-S5F-a: tên môn theo chương trình LÚC MỞ Case (FOU "G+V") — Case bàn giao sang BE vẫn một tên, không lúc "G+V" lúc "Writing". */
  const ctTen = latest?.ct_goc ?? latest?.ct ?? null;
  /* PR-SOS T21: Case SOS Fast Track = `[MT1] {phần giữa} [SOS 3]`; phần giữa người sửa được (`title`), mặc định `{kỹ năng} không đạt`. */
  if (c.origin_kind === 'mock' && (latest?.kind ?? 'mock') === 'mock') {
    const cat = c.category ?? categoryOf(c.topic);
    return tenCaseSos({ mt: latest?.attempt_no ?? null, giua: own || `${cat ? tenMon(ctTen, cat) : caseCategoryLabel(cat)} không đạt`, sos: c.sos_level ?? null, kck: c.kck });
  }
  /* PR-LT2a: Case tự tạo từ Progress Test lớp thường = `[Progress Test] G+V không đạt` — không MT; OV-12c: kèm `[SOS n]` theo số môn trượt. */
  if (c.origin_kind === 'mock' && (latest?.kind === 'progress' || latest?.kind === 'final')) {
    const cat = c.category ?? categoryOf(c.topic);
    return tenCaseThuong({ dot: latest.kind, giua: own || `${cat ? tenMonNgan(ctTen, cat) : caseCategoryLabel(cat)} không đạt`, sos: c.sos_level ?? null });
  }
  if (own) return own;
  return caseTitle({
    category: c.category ?? categoryOf(c.topic),
    latestAttemptNo: latest?.attempt_no ?? null,
    latestAttemptKind: latest?.kind ?? null,
    chuongTrinh: ctTen,
  });
}

/** Các mốc của một Case, cũ trước mới sau — màn Case đọc từ trên xuống là ra câu chuyện. */
export function milestonesOf(caseId: number) {
  return (db()
    .prepare(
      `SELECT m.*, u.full_name AS actor_name, (SELECT a.kind FROM assessment_attempts a WHERE a.id = m.attempt_id) AS attempt_kind,
             (SELECT a.class_id FROM assessment_attempts a WHERE a.id = m.attempt_id) AS attempt_class_id FROM case_milestones m
         LEFT JOIN users u ON u.id = m.created_by
        WHERE m.case_id = ? ORDER BY m.occurred_on, m.id`,
    )
    .all(caseId) as any[])
    .map((m) => ({
      id: m.id, kind: m.kind, attemptId: m.attempt_id, attemptNo: m.attempt_no, dot: m.attempt_kind ? nhanDot(m.attempt_kind, m.attempt_no) : null,
      /* PR-UXF-b (G5): mốc MT bấm được tới đúng đợt (FT → hồ sơ Mock; lớp thường → bảng điểm lớp). */
      href: m.attempt_id ? duongDotTest({ id: m.attempt_id, kind: m.attempt_kind, classId: m.attempt_class_id }) : null,
      band: m.band, expectation: m.expectation, sosLevel: m.sos_level,
      occurredOn: m.occurred_on, note: m.note, actorName: m.actor_name,
    }));
}

/**
 * HOÀN THÀNH CASE — MỘT NÚT, MỘT PANEL KẾT LUẬN (mục 9.3).
 *
 * Trước vòng 7 có bốn đường ra khỏi một case: "Chốt kết quả", "Kéo dài theo dõi", "Chọn
 * hướng xử lý" và "Đổi hướng xử lý". Bốn cái tên cho một câu hỏi duy nhất — Case này kết
 * thúc thế nào — nên không ai chắc mình vừa làm gì, và hai Case đóng cùng một kiểu lại có
 * hai dấu vết khác nhau. Nay chỉ còn ĐÚNG MỘT đường.
 *
 * "Kéo dài theo dõi" biến mất vì nó vốn không phải một cách kết thúc: Case chưa xong thì để
 * mở, và việc phải làm nằm ở PHƯƠNG ÁN (tab "Theo dõi thêm" ở mục 9.1), không phải ở
 * một cái nút đóng-mà-không-đóng.
 *
 * CHỈ ĐÓNG ĐƯỢC KHI MỌI PHƯƠNG ÁN ĐÃ KHÉP LẠI. Đóng sớm thì con số "đã xử lý xong" nói dối:
 * vẫn còn một việc treo mà Case đã biến khỏi danh sách của mọi người. Và điểm mới đạt, ngày
 * trôi qua hay "Case không có phương án nào" đều KHÔNG tự đóng được Case — phải có người có
 * quyền kết luận.
 */
export function closeCaseOutcome(p: Principal, caseId: number, input: {
  /** Mức tiến bộ — BẮT BUỘC (Case học thuật). */
  outcome?: string | null; note?: string | null;
  /** Ngày hoàn thành thực tế. Bỏ trống thì lấy hôm nay; không nhận ngày tương lai. */
  closedOn?: string | null;
  /** Mã cũ: chỉ còn nhận 'end'. "Kéo dài theo dõi" đã bỏ (mục 9.3). */
  decision?: string | null;
  /** Ghi chi tiết theo thành phần của kỹ năng Case (mục 9.3). TUỲ CHỌN. */
  metrics?: unknown;
}) {
  const conn = db();
  const c = loadCase(caseId);
  if (!canCloseCase(p, c)) {
    throw forbidden('Chỉ Quản lý, giáo viên dạy đúng môn của Case, hoặc GVCN (Case Ý thức) mới hoàn thành được Case này.');
  }
  const outcome: string = input.outcome ?? '';
  if (!(CASE_OUTCOMES as readonly string[]).includes(outcome)) {
    throw badRequest('Mức độ thành công không hợp lệ.');
  }
  if (input.decision && input.decision !== 'end') {
    throw badRequest('"Kéo dài theo dõi" đã bỏ — Case chưa xong thì để mở và cập nhật ở phương án.');
  }
  void CASE_DECISIONS;
  /*
   * GHI CHÚ BẮT BUỘC KHI HOÀN THÀNH CASE (mục 9.2). Bốn mức "thành công đến đâu" không nói được đã làm gì và vì sao kết thúc —
   * mà đó chính là câu người đọc hồ sơ ba tháng sau cần.
   */
  const closeNote = chuTuDo(input.note, 'Kết luận', 2000) ?? '';   // PR-Dọn (Q4, quét #24)
  if (closeNote.length < 10) {
    throw badRequest('Hoàn thành Case thì phải ghi kết luận — ít nhất 10 ký tự.');
  }
  const closedOn = input.closedOn ?? demoToday();
  if (!isIsoDate(closedOn)) throw badRequest('Ngày hoàn thành không hợp lệ.');
  if (closedOn > demoToday()) throw badRequest('Không ghi được ngày hoàn thành ở tương lai.');

  const metrics = normalizeMetrics(input.metrics);
  /*
   * ĐÁNH GIÁ CHI TIẾT PHẢI ĐÚNG KỸ NĂNG CỦA CASE (mục 9.3) — không bắt chấm cả năm kỹ năng,
   * và cũng không cho ghi Reading vào một Case Listening.
   */
  if (metrics && c.category) {
    for (const m of metrics) {
      if (m.skill !== c.category) {
        throw badRequest('Phần đánh giá chi tiết chỉ ghi cho đúng kỹ năng của Case này.');
      }
    }
  }

  /*
   * MỘT ĐIỀU KIỆN ĐÓNG DUY NHẤT cho cả hai đường vào (mục 7.7 [5]).
   *
   * Trước đây hàm này tự kiểm "còn phương án nào đang chạy không", trong khi nút trên màn
   * hình lại hỏi `closeBlockers`. Hai phép kiểm khác nhau cho cùng một câu hỏi nghĩa là
   * sớm muộn sẽ có đường đóng được Case mà màn hình bảo là chưa đóng được — cụ thể là Case
   * CHƯA CÓ PHƯƠNG ÁN NÀO vẫn lọt qua đây.
   */
  const blockers = closeBlockers(caseId);
  if (blockers.length) {
    throw loi(400, 'Chưa chốt kết quả Case được. {lyDo}', { lyDo: blockers.join(' ') });
  }

  return tx(() => {
    conn
      .prepare(
        `UPDATE sos_cases
            SET outcome = ?, outcome_note = ?, outcome_decision = 'end',
                outcome_by = ?, outcome_at = ?,
                status = 'done', closed_by = ?, closed_at = ?,
                disposition = COALESCE(disposition, 'action'),
                updated_at = ?
          WHERE id = ?`,
      )
      .run(outcome, closeNote, p.userId, nowIso(), p.userId, closedOn, nowIso(), caseId);

    conn
      .prepare(
        `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(dedup_key) DO NOTHING`,
      )
      .run(caseId, 'closed', closedOn,
           [CASE_OUTCOME_LABEL[outcome as CaseOutcome], closeNote].join(' — '),
           p.userId, nowIso(), `outcome:${caseId}:${closedOn}:end`);

    /* Đánh giá chi tiết lúc kết luận: lưu thành một dòng cập nhật gắn thẳng vào case. */
    if (metrics) {
      conn
        .prepare(
          `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                       note, metrics, created_at)
           VALUES (?, NULL, ?, ?, ?, ?, ?)`,
        )
        .run(caseId, closedOn, p.userId, closeNote, JSON.stringify(metrics), nowIso());
    }

    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: 'case_closed', eventDate: closedOn,
      /* Chốt 6/mục 10.3 Step 6: nhãn phân biệt mốc nhập bù với mốc ghi tại chỗ. */
      title: `${c.origin_kind === 'backfill' ? '(nhập bù) ' : ''}Hoàn thành Case: ${CASE_OUTCOME_LABEL[outcome as CaseOutcome]}`,
      detail: closeNote,
      refTable: 'sos_cases', refId: caseId, createdBy: p.userId,
      dedupKey: `case_outcome:${caseId}:${closedOn}:end`,
    });
    const quaGv = dongQuaGv(p, c);
    writeAudit({ actorUserId: p.userId, action: 'case.outcome', entityType: 'sos_case',
      entityId: caseId, entityLabel: caseTitleOf(c),
      after: { outcome, closedOn, via: quaGv ? 'gv' : 'quan_ly' } });
    if (quaGv) baoQuanLyCaseDong(p, caseId, c);
    return caseDetail(p, caseId);
  });
}

/** Đổi hạn BÁO KẾT QUẢ của case. Mặc định là hết tuần MT kế tiếp, nhưng sửa được. */
export function setFollowUntil(p: Principal, caseId: number, date: string | null) {
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền đổi hạn theo dõi của Case này.');
  if (date && !isIsoDate(date)) throw badRequest('Hạn theo dõi không hợp lệ.');
  if ((c.follow_until ?? null) === (date ?? null)) return caseDetail(p, caseId);
  tx(() => {
    db().prepare('UPDATE sos_cases SET follow_until = ?, updated_at = ? WHERE id = ?')
      .run(date, nowIso(), caseId);
    /* PR-LUI-a2: đổi hạn theo dõi có nhật ký (trước / sau). */
    writeAudit({ actorUserId: p.userId, action: 'case.follow_until', entityType: 'sos_case', entityId: caseId, entityLabel: caseTitleOf(c),
      before: { followUntil: c.follow_until ?? null }, after: { followUntil: date ?? null } });
  });
  return caseDetail(p, caseId);
}

/**
 * MỞ LẠI CASE ĐÃ HOÀN THÀNH (PR-LUI-a2, chủ sản phẩm 06/10) — Quản lý / Quản trị, và (OV-13h, chủ SP 15/10) mọi người có quyền hoàn thành Case
 * đó (`coTheMoLaiCase`); một bấm, không lý do. Kết luận cũ ở lại trong mốc
 * `closed` + nhật ký; PA đã khép KHÔNG sống lại. Khoá chống trùng đã nhả cho Case mới cùng hạng mục → chặn (mở Case mới đó). Case hệ thống đóng
 * (em kết thúc học…) đi đường riêng của nó (`moLaiCaseHeThongDong`).
 */
export function moLaiCase(p: Principal, caseId: number) {
  const conn = db();
  const c = loadCase(caseId);
  if (!coTheMoLaiCase(p, c)) throw forbidden('Chỉ Quản lý hoặc người hoàn thành được Case này mở lại được.');
  if (c.status !== 'done') throw badRequest('Case này chưa hoàn thành.');
  const chan = chanMoLai(c);
  if (chan) throw badRequest(chan.loi);
  const today = demoToday();
  return tx(() => {
    /* Không PA nào → "Mới mở"; có PA → trạng thái suy như mọi đường khác (`dongBoTrangThaiCase`). */
    conn.prepare(`UPDATE sos_cases SET status = 'open', outcome = NULL, outcome_note = NULL, outcome_decision = NULL, outcome_by = NULL, outcome_at = NULL,
                   closed_by = NULL, closed_at = NULL, dismiss_reason_code = NULL, dismiss_reason_text = NULL, dedup_key = COALESCE(dedup_key, ?), updated_at = ?
                  WHERE id = ?`).run(chanMoLaiKhoa(c), nowIso(), caseId);
    if (conn.prepare('SELECT 1 FROM case_interventions WHERE case_id = ? LIMIT 1').get(caseId)) dongBoTrangThaiCase(caseId);
    const moi = (conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(caseId) as any).status as string;
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'status', 'done', ?, ?, ?)`)
      .run(caseId, moi, p.userId, nowIso());
    /* Mốc / Hành trình của lần đóng trước đổi khoá (giữ lại làm lịch sử) — đóng lại cùng ngày vẫn ghi được mốc mới. */
    const duoi = `:mo-lai:${nowIso()}`;
    conn.prepare(`UPDATE case_milestones SET dedup_key = dedup_key || ? WHERE case_id = ? AND kind = 'closed' AND dedup_key IS NOT NULL`).run(duoi, caseId);
    conn.prepare(`UPDATE journey_events SET dedup_key = dedup_key || ? WHERE ref_table = 'sos_cases' AND ref_id = ? AND event_type = 'case_closed' AND dedup_key IS NOT NULL`)
      .run(duoi, caseId);
    conn.prepare(`INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key) VALUES (?, 'reopened', ?, NULL, ?, ?, ?)`)
      .run(caseId, today, p.userId, nowIso(), `reopen:${caseId}:${nowIso()}`);
    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id, eventType: 'case_reopened', eventDate: today,
      title: 'Mở lại Case', detail: caseTitleOf(c), refTable: 'sos_cases', refId: caseId, createdBy: p.userId,
      dedupKey: `case_reopen:${caseId}:${nowIso()}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'case.reopen', entityType: 'sos_case', entityId: caseId, entityLabel: caseTitleOf(c),
      before: { status: 'done', outcome: c.outcome ?? null, outcomeNote: c.outcome_note ?? null, closedAt: c.closed_at ?? null, closedBy: c.closed_by ?? null,
        dismissReason: c.dismiss_reason_code ?? null },
      after: { status: moi } });
    return caseDetail(p, caseId);
  });
}

/** OV-13h (chủ SP 15/10): ai mở lại được — Quản lý trong phạm vi, hoặc ai hoàn thành được Case này (`canCloseCase`), không chỉ người đã đóng. */
function coTheMoLaiCase(p: Principal, c: any): boolean {
  return can(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id }) || canCloseCase(p, c);
}
/** Khoá chống trùng của Case nếu được mở lại (null = Case song song / không khoá). */
function chanMoLaiKhoa(c: any): string | null {
  return c.parallel ? null : caseDedupKey({ category: c.category ?? categoryOf(c.topic), studentId: c.eff_student_id, cycleId: c.eff_cycle_id });
}
/** Vì sao Case `done` KHÔNG mở lại được (null = được). Dùng chung cho `moLaiCase` và cờ `viewer.coTheMoLai`. */
function chanMoLai(c: any): { loi: string } | null {
  if (c.system_close_reason) return { loi: 'Case do hệ thống đóng — không mở lại được.' };
  const key = chanMoLaiKhoa(c);
  const giu = key ? db().prepare('SELECT id FROM sos_cases WHERE dedup_key = ?').get(key) as any : null;
  if (giu && giu.id !== c.id) return { loi: `Đã có Case ${c.topic ? caseTopicLabel(c.topic) : 'Ý thức'} mới — mở Case đó.` };
  return null;
}

/**
 * AI HOÀN THÀNH ĐƯỢC CASE — RB-6, quyết định 4.15 (22/09/2026), C02; mở rộng PR-QU (chủ sản phẩm 04/10):
 *   · Quản lý / Quản trị trong phạm vi: mọi Case.
 *   · Case học thuật: GV dạy ĐÚNG kỹ năng của Case ở lớp em (GVBM hay GVCN đều thế — GVCN không đóng Case trái môn, C02).
 *   · Case Ý thức (không kỹ năng): GVCN lớp em đang học.
 * Một luật, một chỗ: `CASE_CLOSE` + `teacherAllows`. `tong_hop` (lớp thường không có ô môn) rơi về GVCN như `sosEditCtx`.
 */
export function canCloseCase(p: Principal, c: { class_id?: number | null; student_id?: number | null; topic?: string | null }): boolean {
  /* PR-Dọn (rà thêm, ngoài 24 mục quét): bỏ dòng `can(MEETING_EDIT, { anyScope: true })` đứng đầu — nó cho Quản lý ở BẤT KỲ chi nhánh
     hoàn thành Case của chi nhánh khác. */
  return can(p, PERMISSIONS.CASE_CLOSE, {
    classId: c.class_id ?? null, studentId: c.student_id ?? null,
    skill: c.topic && c.topic !== 'tong_hop' ? c.topic : undefined,
  });
}

/**
 * PR-QU: giáo viên (không phải Quản lý/Quản trị trong phạm vi) vừa hoàn thành Case → báo Quản lý chi nhánh của lớp (để biết, không
 * duyệt) + đánh dấu `via:'gv'` cho nhật ký. Quản lý tự đóng thì không báo ai.
 */
function dongQuaGv(p: Principal, c: { class_id?: number | null; eff_student_id?: number | null }): boolean {
  const ctx = { classId: c.class_id ?? null, studentId: c.eff_student_id ?? null };
  return !p.grants.some((g) => g.roleKey !== 'teacher' && g.permissions.has(PERMISSIONS.CASE_CLOSE) && can({ ...p, grants: [g] }, PERMISSIONS.CASE_CLOSE, ctx));
}
function baoQuanLyCaseDong(p: Principal, caseId: number, c: { class_id?: number | null; eff_student_id?: number | null; topic?: string | null }) {
  const conn = db();
  const lop = c.class_id ? conn.prepare('SELECT branch_id, programme_code FROM classes WHERE id = ?').get(c.class_id) as any : null;
  const hv = c.eff_student_id ? conn.prepare('SELECT full_name, branch_id FROM students WHERE id = ?').get(c.eff_student_id) as any : null;
  const branchId = lop?.branch_id ?? hv?.branch_id ?? null;
  if (!branchId) return;
  const chuDe = c.topic ? `${tenMon(lop?.programme_code ?? null, c.topic)}` : 'Ý thức';
  for (const id of quanLyCuaChiNhanh(branchId)) {
    if (id === p.userId) continue;
    notify({
      userId: id, kind: 'case_dong_gv', title: `${p.fullName} đã đóng Case ${chuDe} của ${hv?.full_name ?? 'học viên'}`,
      entityType: 'sos_case', entityId: caseId, dedupKey: `case_dong_gv:${caseId}:${nowIso().slice(0, 10)}`,
    });
  }
}

export function loadCase(caseId: number) {
  const c = db()
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id,
              a.class_id AS attempt_class_id, a.attempt_no, a.kind AS attempt_kind,
              (SELECT e.class_id FROM enrollments e
                WHERE e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
                ORDER BY e.id DESC LIMIT 1) AS current_class_id
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.id = ?`,
    )
    .get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy Case');
  /* PR-DEPLOY (0b-2): LỚP HIỆN TẠI của em trước, lớp của lượt chỉ khi em không còn ghi danh `active` — cùng một biểu thức với `listCases`
     (`LOP_CUA_CASE`, Q5 Dọn-a): dòng thấy ở danh sách thì mở được, đóng được. Lớp của lượt giữ ở `attempt_class_id` để hiển thị. */
  c.class_id = c.current_class_id ?? c.attempt_class_id ?? null;
  return c;
}

/**
 * NGỮ CẢNH QUYỀN CHO SOS_EDIT (AUTH-01) — MỘT chỗ dựng, dùng ở mọi nơi sửa/xử lý case.
 *
 * Truyền đúng kỹ năng của Case (`c.topic`, ví dụ "listening") để `teacherAllows` so khớp phân công GVBM (C02). Thiếu hàm này thì
 * mỗi nơi gọi `require_`/`can` tự viết một cách khác, và đó chính là kiểu lỗi sinh ra AUTH-01 lần đầu. Ý thức KHÔNG đi qua đây:
 * quyền của nó ở `server/src/yThuc/access.ts` (C02 không áp cho Ý thức).
 */
function sosEditCtx(c: { class_id?: number | null; eff_student_id?: number | null; topic?: string | null }) {
  return {
    classId: c.class_id, studentId: c.eff_student_id,
    /* PR-LT2b (Q14): `tong_hop` không có ô phân công ở lớp FOU/BE/ELE — không kèm kỹ năng thì quyền rơi về GVCN lớp. */
    skill: c.topic === 'tong_hop' ? undefined : c.topic ?? undefined,
  };
}

/**
 * V5 SV-SO1: ngữ cảnh `SOS_EDIT` của NHIỀU Case một lần (Công việc "Làm thay") — cùng lớp (`loadCase`: lớp em đang học, không thì lớp của lượt) và
 * cùng `sosEditCtx`, không hỏi lẻ từng Case. Case không tìm thấy → không có trong Map.
 */
export function ctxSuaCaseNhieu(caseIds: readonly number[]): Map<number, ReturnType<typeof sosEditCtx>> {
  const out = new Map<number, ReturnType<typeof sosEditCtx>>();
  theoLo([...new Set(caseIds)], (lo, ph) => {
    for (const c of db().prepare(
      `SELECT sc.id, sc.topic, COALESCE(sc.student_id, a.student_id) AS eff_student_id, a.class_id AS attempt_class_id,
              (SELECT e.class_id FROM enrollments e
                WHERE e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
                ORDER BY e.id DESC LIMIT 1) AS current_class_id
         FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.id IN (${ph})`).all(...lo) as any[]) {
      out.set(c.id, sosEditCtx({ ...c, class_id: c.current_class_id ?? c.attempt_class_id ?? null }));
    }
  });
  return out;
}

/**
 * QUYỀN CỦA MỘT CASE, cho module khác hỏi (kho tệp) thay vì tự dựng lại ngữ cảnh quyền — đúng bài học AUTH-01: mỗi nơi
 * tự viết `can(...)` một kiểu là cách sinh ra lỗi quyền. Xem = quyền xem Case; sửa = `SOS_EDIT` theo đúng kỹ năng (C02).
 */
/** Case đã rút vì điểm nguồn được sửa/huỷ — `retireCaseForCorrectedScore` ghi `outcome_note` bắt đầu bằng `SIGNAL_WITHDRAW_SCORE_FIXED`. */
const laRutSuaDiem = (c: { status?: string; outcome_note?: string | null }) =>
  c.status === 'done' && String(c.outcome_note ?? '').startsWith(SIGNAL_WITHDRAW_SCORE_FIXED);

export function caseAccess(caseId: number) {
  const c = loadCase(caseId);
  return {
    requireView: (p: Principal, message: string) =>
      require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: c.class_id, studentId: c.eff_student_id }, message),
    requireEdit: (p: Principal, message: string) => require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c), message),
    /** Ngữ cảnh quyền của Case (lớp, học viên, kỹ năng) — cho `cases/boTro.ts` hỏi quyền mà không dựng lại (AUTH-01). */
    ctx: sosEditCtx(c),
    /** PR-LUI-a2: người tạo Case — đính kèm được vào Case mình tạo (kể cả GVCN tạo Case môn không dạy). */
    reportedBy: (c.reported_by ?? null) as number | null,
    topic: (c.topic ?? null) as string | null,
  };
}

/**
 * OV-12c (đặc tả 7.2, rà #389): ai làm được "Xác nhận Case" Progress — người sửa được Case (GV dạy môn, QL) HOẶC GVCN lớp em đang học,
 * kể cả khi GVCN không dạy môn đó. Người phụ trách Case không đổi. Một hàm cho máy chủ (`xacNhanCase`), Công việc (`cause`) và cờ nút.
 */
export function coTheXacNhanCase(p: Principal, caseId: number): boolean {
  const c = loadCase(caseId);
  return can(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c)) || laGvcnLopDangHoc(p, c.current_class_id);
}
/** Vế GVCN của luật trên — không đọc DB (danh sách Công việc / bảng kỹ năng đã có lớp đang học của từng dòng). */
export const laGvcnLopDangHoc = (p: Principal, lopDangHoc: number | null | undefined) => !!lopDangHoc && isCoreTeacherOf(p, lopDangHoc);

// ---------------------------------------------------------------- giáo viên báo vấn đề

/**
 * GIÁO VIÊN BÁO VẤN ĐỀ — không cần chờ Mock, không tạo bài đánh giá giả.
 *
 * `sos_level` để NULL: SOS 1/2/3 là số kỹ năng dưới kỳ vọng ở một bài, giáo viên không có
 * bài nào để đếm. Mức độ gấp là một thang riêng, ghi ở `urgency`.
 *
 * Chống trùng bằng `idempotency_key`: bấm hai lần hoặc thử lại sau lỗi mạng chỉ ra một case.
 */
/** Case đã tạo bằng khoá chống gửi đôi này (`sos_cases.idempotency_key`, UNIQUE) — chung cho Báo vấn đề và Nhập bù (PR-Dọn Q3). */
function caseDaCoTheoKhoa(key: string | null | undefined): number | null {
  if (!key) return null;
  return (db().prepare('SELECT id FROM sos_cases WHERE idempotency_key = ?').get(key) as any)?.id ?? null;
}

export function reportIssue(p: Principal, input: {
  studentId: number;
  cycleId?: number | null;
  /** Tên Case do người tạo đặt (mục 7.3). Chỉ Case tạo tay mới có. */
  title?: string | null;
  /** "Mô tả" — trước vòng 5 ô này tên là "Chuyện gì đang xảy ra". */
  summary: string;
  urgency?: string;
  /** Một trong năm ô L·R·W1·W2·S. */
  topic?: string | null;
  primaryCode?: string | null;
  secondaryCodes?: string[];
  /**
   * BỎ TỪ VÒNG 7 (mục 6.3): "Ghi chú" trùng việc với "Mô tả".
   *
   * Hai ô cùng hỏi một chuyện thì người dùng phải tự chia đôi câu chuyện của mình, và người
   * đọc sau phải ghép lại. Cột vẫn còn trong database để đọc dữ liệu cũ; đường ghi mới đã
   * đóng — truyền vào đây cũng không được lưu.
   */
  note?: string | null;
  observation?: string | null;
  detectedAt?: string | null;
  idempotencyKey?: string;
  /** Người dùng đã thấy cảnh báo Case trùng và chọn "Ghi vào Case đang có". */
  mergeIntoExisting?: boolean;
  /** Người dùng đã thấy cảnh báo và chọn "Đây là vấn đề khác, mở Case riêng". */
  parallel?: boolean;
  /** Người phụ trách chính. Bỏ trống thì hệ thống gợi ý theo phân công của lớp. */
  ownerUserId?: number | null;
  /**
   * NHẬP BÙ MỘT CASE ĐÃ XONG TỪ LÂU (PR-C Task 3, mục 10.3–10.4) — cờ chảy suốt cả chuỗi
   * `reportIssue` → `recordIntervention` → `closeCaseOutcome`.
   *
   * Ba việc khác hẳn đường thường khi cờ này bật:
   *   · `origin_kind = 'backfill'` thay vì `'teacher_report'` — chốt 7, phân biệt được ghi
   *     tại chỗ với nhớ lại rồi điền.
   *   · KHÔNG có `follow_until` (chốt 2) — Case nhập bù không có hạn nào, vì nó là chuyện đã xảy ra, không phải một nghĩa vụ
   *     đang chạy.
   */
  backfill?: boolean;
  /** CASE-NHIEU (`reportIssues`): "mở riêng" vẫn bị chặn khi kỹ năng có Case chờ xác nhận. Đường một kỹ năng giữ như cũ (seed dựng Case song song). */
  kiemChoXacNhan?: boolean;
}) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');

  const enr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
    .get(input.studentId) as any;
  const classId = enr?.class_id ?? null;

  /*
   * Quyền BÁO vấn đề đi theo phạm vi chăm sóc hiện tại, không theo kỹ năng: một giáo viên
   * Listening vẫn được báo "em này hay nghỉ học". Nhưng báo được KHÔNG có nghĩa là được
   * ghi điểm kỹ năng khác — đó là hai quyền riêng.
   */
  require_(p, PERMISSIONS.SOS_REPORT, { classId, studentId: input.studentId },
    'Bạn chỉ báo được vấn đề của học viên trong phạm vi mình phụ trách.');
  if (student.archived_at) throw badRequest(CAU_LUU_TRU);   // OV-11d (HV-3): hồ sơ Lưu trữ khoá

  /*
   * BỐN TRƯỜNG BẮT BUỘC (mục 6.3): tên, mô tả, mức độ, phân loại.
   *
   * Ba trong bốn cái đó trước đây không bắt buộc, và hệ quả rất cụ thể: hồ sơ đầy những
   * Case tên "Reading dưới kỳ vọng" do máy đặt, mô tả trống, phân loại "Chưa rõ" — mở ra
   * không biết em vướng gì, và không bảng tổng hợp nào đếm được.
   */
  /* PR-Dọn (Q4, quét #24): tên ≤ 200, mô tả ≤ 2 000 ký tự. */
  /* CASE-NHIEU: "Ghi vào Case đang có" không đặt tên mới (05 mục 7.1b) — tên khi đó kiểm sau, chỉ khi không có Case để ghi vào. */
  const title = chuTuDo(input.title, 'Tên Case', 200) ?? '';
  const thieuTen = title.length < 6;
  if (thieuTen && !input.mergeIntoExisting) {
    throw badRequest('Đặt tên cho Case — một câu ngắn nói đúng vấn đề, ví dụ '
      + '"Reading: chưa xử lý được dạng True/False/Not Given".');
  }
  const summary = chuTuDo(input.summary, 'Mô tả', 2000) ?? '';
  if (summary.length < 15) {
    throw badRequest('Cần mô tả vấn đề cụ thể hơn: em sai ở đâu, sai như thế nào.');
  }

  /* Hai mức, không ba: `attention` (hiện là "Bình thường" từ 21/09/2026 — chỉ đổi chữ, mã giữ nguyên) và `urgent` (Gấp). Không chọn thì là `attention`. */
  if (input.urgency && !(URGENCY_LEVELS as readonly string[]).includes(input.urgency)) {
    throw badRequest('Mức độ chỉ còn hai bậc: Bình thường hoặc Gấp.');
  }
  const urgency = input.urgency ?? DEFAULT_URGENCY;
  const detectedAt = input.detectedAt ?? demoToday();
  if (!isIsoDate(detectedAt)) throw badRequest('Ngày phát hiện không hợp lệ.');
  if (detectedAt > demoToday()) throw badRequest('Ngày phát hiện không được ở tương lai.');   // PR-Dọn (quét #19)
  const key = input.idempotencyKey?.trim() || null;
  const daCo = caseDaCoTheoKhoa(key);
  if (daCo) return caseDetail(p, daCo);

  /* Lộ trình: gửi rõ thì dùng; không thì lộ trình đang mở. (PR-LT2a: không còn Case tạo từ tín hiệu — Giữa khoá tự tạo Case.) */
  const wantedCycleId = input.cycleId ?? null;
  const cycle = wantedCycleId
    ? (conn.prepare('SELECT * FROM learning_cycles WHERE id = ? AND student_id = ?')
        .get(wantedCycleId, input.studentId) as any)
    : currentCycle(input.studentId);
  if (wantedCycleId && !cycle) throw badRequest('Lộ trình không thuộc học viên này.');

  /*
   * MỌI VẤN ĐỀ PHẢI CÓ CHỖ CẤT. Năm ô FT (L · R · W1 · W2 · S); lớp thường có thêm MỘT môn Writing (`writing`) — nửa máy chủ của F07,
   * để tín hiệu Writing lớp thường "Tạo Case" được (plan PR-S1 Q5). FT không có Case "Writing chung".
   */
  const topic = (input.topic ?? '').trim() || null;
  if (!topic) {
    throw badRequest('Chọn kỹ năng: Listening, Reading, Writing Task 1, Writing Task 2 hay Speaking.');
  }
  const ratioForTopics = !!(cycle && isRatioCycle(cycle));
  /* T57: chương trình của lộ trình quyết định bộ chủ đề (Pre FOU "Tổng hợp") và bộ nguyên nhân (FOU G+V / P). */
  const ctCuaCase: string | null = cycle ? cycle.programme_code ?? programmeCodeOfCycle(cycle.id) : null;
  const allowedTopics: readonly string[] = !ratioForTopics ? ENTRY_SKILLS
    : programmeOf(ctCuaCase) === 'PREFOU' ? caseTopicsFor(true, ctCuaCase)          // Pre FOU chỉ "Tổng hợp" (PF6)
    : [...new Set([...caseTopicsFor(true, ctCuaCase), ...ENTRY_SKILLS])];
  if (!allowedTopics.includes(topic)) throw loi(400, 'Chủ đề không hợp lệ: {topic}', { topic });

  /*
   * CẢNH BÁO CASE TRÙNG (mục 7.13).
   *
   * Hạng mục này đã có Case chưa xong thì mở thêm một cái nữa hiếm khi đúng: hai Case song
   * song cho cùng một môn nghĩa là hai người cùng theo dõi mà không ai thấy việc của người
   * kia. Nên mặc định GHI VÀO CASE ĐANG CÓ; mở riêng vẫn được nhưng phải là quyết định có
   * ý thức — giao diện hỏi trước, và người dùng gửi lại kèm `parallel: true`.
   *
   * Kiểm ở đây chứ không chỉ dựa vào chỉ mục duy nhất: chỉ mục chỉ biết chặn, không nói
   * được cho người dùng biết Case đang vướng là Case nào.
   */
  /*
   * PHÂN LOẠI BẮT BUỘC, và không có lối thoát "Chưa rõ" (mục 6.3).
   *
   * Chọn "Khác" thì được, nhưng lúc đó phải ghi rõ "Khác" là gì (ô Ghi rõ, T13) — nếu không,
   * "Khác" trở thành đúng cái ô "Chưa rõ" vừa bị bỏ, chỉ khác tên.
   */
  const allowed = issuesForTopic(topic, ctCuaCase).map((i) => i.code);
  const primaryCode = (input.primaryCode ?? '').trim();
  if (!primaryCode) throw badRequest('Chọn nhóm nguyên nhân — đây là căn cứ để tổng hợp về sau.');
  if (!allowed.includes(primaryCode)) {
    throw loi(400, 'Phân loại đã chọn không thuộc bộ phân loại của {chuDe}.', { chuDe: caseTopicLabel(topic, ctCuaCase) });
  }
  /* T13: "Khác" cần ô Ghi rõ ≥ 3 ký tự, lưu ở `case_issues.observation` (Q9). Luật cũ "mô tả ≥ 30 ký tự" đã bỏ. */
  if (laKhac(primaryCode)) {
    const sai = kiemGhiRoKhac(input.observation);
    if (sai) throw loi(400, 'Phân loại "Khác": {loi}.', { loi: sai });
  }

  const category = categoryOf(topic);

  /* CASE-NHIEU: lô (`kiemChoXacNhan`) tra Case đang có KỂ CẢ khi "mở riêng" — "mở riêng" không lách được luật Case chờ xác nhận (K3-23) ngay dưới. */
  const dedupKey = caseDedupKey({
    category, studentId: input.studentId, cycleId: cycle?.id ?? null, parallel: input.parallel && !input.kiemChoXacNhan,
  });
  const caCu = dedupKey
    ? (conn.prepare(`SELECT * FROM sos_cases WHERE dedup_key = ? AND status != 'done'`).get(dedupKey) as any)
    : null;
  /* PR-DEPLOY (0b-3 · R5-5): Case MỞ Ở CHƯƠNG TRÌNH KHÁC (FOU "G+V" của em đã lên BE) không phải "Case đang có" của hạng mục này — báo mới mở Case mới, Case cũ nhả khoá ở bước ghi. */
  const caChuongTrinhKhac = !!caCu && caseKhacChuongTrinh(caCu, chuongTrinhCuaLop(activeClassOf(input.studentId)));
  const existing = caChuongTrinhKhac ? null : caCu;

  /* PR-SOS K3-23 (M4): Case SOS cùng kỹ năng đang chờ (Xác nhận Case / Mô tả Case MT) → không gộp, không mở song song — làm ở Case đó. */
  const stCu = existing ? sosCaseState(existing.id) : null;
  if (existing && (stCu!.awaitingCause || stCu!.choNhanXet)) {
    const mt = existing.attempt_id
      ? (conn.prepare('SELECT attempt_no FROM assessment_attempts WHERE id = ?').get(existing.attempt_id) as any)?.attempt_no ?? null : null;
    const nhan = [mt ? `MT${mt}` : null, existing.sos_level ? `SOS ${existing.sos_level}` : null].filter(Boolean).join(' · ');
    throw loi(400, stCu!.choNhanXet ? '{chuDe} đang có Case chờ mô tả{nhan} — mở Case để ghi mô tả.' : '{chuDe} đang có Case chờ xác nhận{nhan} — mở Case để xác nhận.',
      { chuDe: caseTopicLabel(existing.topic ?? topic, ctCuaCase), nhan: nhan ? ` (${nhan})` : '' },
      { caseChoNguyenNhan: { id: existing.id } },
    );
  }

  if (existing && !input.mergeIntoExisting && !input.parallel) {
    /*
     * Kèm đủ dữ liệu để giao diện dựng pop-up hai lựa chọn mà không phải hỏi lại máy chủ
     * lần nữa — người dùng đang dở tay gõ, không nên bắt chờ thêm một vòng mạng.
     */
    throw loi(400, 'Học viên này đang có case "{ten}" chưa xử lý xong ở hạng mục {hangMuc}.', { ten: caseTitleOf(existing), hangMuc: caseCategoryLabel(category) },
      {
        duplicateCase: {
          id: existing.id,
          title: caseTitleOf(existing),
          category,
          categoryLabel: caseCategoryLabel(category),
          detectedAt: existing.detected_at,
          status: existing.status,
          interventionCount: (conn
            .prepare('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?')
            .get(existing.id) as any).n,
        },
      },
    );
  }

  if (thieuTen && !existing) {
    throw badRequest('Đặt tên cho Case — một câu ngắn nói đúng vấn đề, ví dụ '
      + '"Reading: chưa xử lý được dạng True/False/Not Given".');
  }

  if (existing && input.mergeIntoExisting) {
    /* CASE-NHIEU: gửi lại cùng khoá (mạng đứt sau khi đã lưu) → không ghi chữ lần hai. Khoá nằm ở audit vì Case đang có đã có khoá riêng. */
    if (key && conn.prepare(`SELECT 1 FROM audit_logs WHERE entity_type = 'sos_case' AND action = 'case.report.merge' AND entity_id = ? AND after_json LIKE ?`)
      .get(existing.id, `%"khoa":${JSON.stringify(key)}%`)) return caseDetail(p, existing.id);
    /* "Ghi vào Case đang có" — thêm chữ của người báo, không tạo bản ghi thứ hai. */
    return tx(() => {
      conn
        .prepare(
          `UPDATE sos_cases
              SET note = TRIM(COALESCE(note || ' · ', '') || ?),
                  urgency = CASE WHEN ? = 'urgent' THEN 'urgent' ELSE urgency END,
                  updated_at = ?
            WHERE id = ?`,
        )
        .run(summary, urgency, nowIso(), existing.id);
      addIssues(existing.id, p.userId, { ...input, topic });
      addJourney({
        studentId: input.studentId, cycleId: cycle?.id ?? null,
        eventType: 'case_opened', eventDate: detectedAt,
        title: 'Giáo viên ghi thêm vào Case đang có', detail: summary,
        refTable: 'sos_cases', refId: existing.id, createdBy: p.userId,
        dedupKey: `case_note:${existing.id}:${detectedAt}:${summary.slice(0, 20)}`,
      });
      writeAudit({ actorUserId: p.userId, action: 'case.report.merge', entityType: 'sos_case',
        entityId: existing.id, entityLabel: `${student.student_code} · ${summary.slice(0, 40)}`,
        after: { mergedInto: existing.id, khoa: key } });
      return caseDetail(p, existing.id);
    });
  }

  return tx(() => {
    /*
     * CASE CŨ ĐÃ ĐÓNG NHẢ KHOÁ CHỐNG TRÙNG RA (mục 6.2 · 7.5).
     *
     * Khoá `(học viên, lộ trình, hạng mục)` luôn thuộc về Case ĐANG MỞ của hạng mục đó. Một
     * Case đã chốt kết thúc mà vẫn giữ khoá thì hạng mục ấy bị khoá vĩnh viễn: vấn đề tái
     * diễn sau đó không mở được Case mới.
     *
     * Nhả khoá KHÔNG đụng gì tới nội dung Case cũ — kết luận, phương án và lịch sử của nó
     * giữ nguyên. Việc nối Case mới vào Case cũ do đường tín hiệu lo, vì chỉ ở đó mới biết
     * đây là tái diễn hay là một vấn đề khác.
     */
    if (dedupKey && !input.parallel) {
      conn.prepare(`UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE dedup_key = ? AND (status = 'done' OR id = ?)`)
        .run(nowIso(), dedupKey, caChuongTrinhKhac ? caCu.id : 0);
    }
    const chuCase = input.ownerUserId ?? suggestCaseOwner({ classId, category });
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category, origin_kind,
                                detected_at, reported_by, title, summary, urgency, sos_level, status,
                                note, idempotency_key, dedup_key, parallel, owner_user_id, created_at)
         VALUES (NULL, ?,?,?,?, ?, ?,?,?,?,?, NULL, 'open', ?,?,?,?,?,?)`,
      )
      .run(input.studentId, cycle?.id ?? null, topic, category,
           input.backfill ? 'backfill' : 'teacher_report',
           detectedAt, p.userId, title, summary, urgency,
           null, key,
           input.parallel ? null : dedupKey, input.parallel ? 1 : 0,
           /*
            * NGƯỜI BÁO KHÔNG MẶC NHIÊN LÀ NGƯỜI PHỤ TRÁCH (mục 2.3). Quản lý hoặc người nhập
            * hộ mở Case rất thường xuyên; gán họ làm người phụ trách là ghi sai trách nhiệm.
            * Ai báo thì lưu ở `reported_by`, còn đây là gợi ý theo phân công.
            */
           chuCase,
           nowIso());
    const caseId = Number(info.lastInsertRowid);

    /*
     * KHÔNG ghi một mốc "Mở Case" ở đây (mục 7.6).
     *
     * Ngày mở và người tạo đã nằm ở đầu Case; thêm một node "Mở Case" vào dòng thời gian
     * nội bộ là lặp lại đúng thông tin đó và đẩy những mốc có nghĩa — hỗ trợ đã làm, kết
     * quả sau hỗ trợ — xuống dưới. Hành trình học tập của TOÀN học viên vẫn có mốc "phát
     * sinh Case" (`addJourney` ngay dưới), vì ở đó nó thật sự là một mốc.
     */

    addIssues(caseId, p.userId, { ...input, topic, primaryCode });

    addJourney({
      studentId: input.studentId, cycleId: cycle?.id ?? null,
      eventType: 'case_opened', eventDate: detectedAt,
      title: `${input.backfill ? '(nhập bù) ' : ''}Giáo viên ghi nhận vấn đề${input.primaryCode ? `: ${issueLabel(input.primaryCode)}` : ''}`,
      detail: summary,
      refTable: 'sos_cases', refId: caseId, createdBy: p.userId,
      dedupKey: `case_open:${caseId}`,
    });
    /* SL1 (02 4.7 C23): Case tạo tay cho kỹ năng người khác phụ trách → chuông Cần làm của người phụ trách (như Rb §20.11 "Case SOS mới"). */
    if (chuCase && chuCase !== p.userId && !input.backfill) {
      notify({ userId: chuCase, kind: 'case_giao', title: `Thêm PA · Case ${caseTopicLabel(topic, ctCuaCase)} · ${student.full_name}`, body: summary.slice(0, 120),
        entityType: 'sos_case', entityId: caseId, dedupKey: `case_giao:${caseId}`, han: xuLyCaseMany([caseId], demoToday()).get(caseId)?.han ?? null });
    }
    writeAudit({ actorUserId: p.userId, action: input.backfill ? 'case.backfill' : 'case.report',
      entityType: 'sos_case', entityId: caseId,
      entityLabel: `${student.student_code} · ${summary.slice(0, 40)}`, after: { urgency, detectedAt } });
    return caseDetail(p, caseId);
  });
}

/**
 * TẠO CASE NHIỀU KỸ NĂNG MỘT LẦN (CASE-NHIEU · 05 mục 7.1b · 02 B16, C21).
 *
 * Mỗi kỹ năng vẫn MỘT Case độc lập — gọi đúng `reportIssue` n lần (cùng luật, cùng người phụ trách, cùng hạn), trong MỘT giao dịch:
 * một thẻ sai / mất quyền / Case chờ xác nhận → không Case nào được lưu, lỗi mang `details.kyNang` để form chỉ đúng thẻ.
 * Khoá gửi đôi theo lô + kỹ năng (`{khoá}:{kỹ năng}`): gửi lại sau mạng đứt trả đúng các Case đã có.
 */
export function reportIssues(p: Principal, input: {
  studentId: number; cycleId?: number | null; urgency?: string; detectedAt?: string | null; idempotencyKey?: string;
  kyNang: { topic: string; primaryCode?: string | null; observation?: string | null; title?: string | null; summary: string;
    /** Kỹ năng đã có Case mở cùng hạng mục: người dùng chọn trước khi gửi (mục 7.13). */
    gop?: 'ghi-vao' | 'rieng' | null }[];
}) {
  const ds = input.kyNang;
  /* Trần = số kỹ năng nhiều nhất của một chương trình (FT: L · R · W1 · W2 · S); `reportIssue` vẫn kiểm từng kỹ năng thuộc chương trình của em. */
  if (!Array.isArray(ds) || !ds.length || ds.length > caseTopicsFor(true, null).length) throw badRequest('Chọn từ 1 đến 5 kỹ năng.');
  if (ds.some((k) => !k || typeof k.topic !== 'string') || new Set(ds.map((k) => k.topic)).size !== ds.length) {
    throw badRequest('Mỗi kỹ năng chỉ một thẻ.');
  }
  const khoa = input.idempotencyKey?.trim() || null;
  return tx(() => ({
    cases: ds.map((k) => {
      const khoaKn = khoa ? `${khoa}:${k.topic}` : undefined;
      try {
        const c = reportIssue(p, {
          studentId: input.studentId, cycleId: input.cycleId, urgency: input.urgency, detectedAt: input.detectedAt,
          topic: k.topic, primaryCode: k.primaryCode, observation: k.observation, title: k.title, summary: k.summary,
          mergeIntoExisting: k.gop === 'ghi-vao', parallel: k.gop === 'rieng', kiemChoXacNhan: true, idempotencyKey: khoaKn,
        }) as any;
        /* Ghi vào = Case trả về không phải Case mang khoá của thẻ này (`gop: 'ghi-vao'` mà Case cũ vừa đóng thì `reportIssue` mở Case mới). */
        const gop = k.gop === 'ghi-vao' && caseDaCoTheoKhoa(khoaKn) !== c.id;
        return { id: c.id as number, title: c.title as string, topic: k.topic, gop,
          /* Người tạo đính kèm được vào Case mình vừa tạo; ghi vào Case đang có thì theo quyền sửa Case đó. */
          canEdit: !!c.viewer?.canEdit || !gop, viecTiep: c.viecTiep ?? null };
      } catch (e) {
        if (e instanceof HttpError) e.details = { ...(e.details as object ?? {}), kyNang: k.topic };
        throw e;
      }
    }),
  }));
}

/**
 * CHỦ ĐỀ CASE MỞ ĐƯỢC CHO MỘT HỌC VIÊN (F07) — máy chủ và form (`QuickReport.tsx`) đọc CÙNG một bộ.
 *
 * Lớp thường có bốn ô L · R · W · S; Fast Track có năm ô L · R · W1 · W2 · S — đúng bộ mà `reportIssue` đã chấp nhận
 * (Q8), rút về một hàm để form không phải tự đoán lại chương trình của em.
 */
export function caseTopicsOf(p: Principal, studentId: number, cycleId?: number | null) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  const enr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
    .get(studentId) as any;
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: enr?.class_id ?? null, studentId },
    'Bạn không có quyền xem học viên này.');
  const cycle = cycleId
    ? (conn.prepare('SELECT * FROM learning_cycles WHERE id = ? AND student_id = ?').get(cycleId, studentId) as any)
    : currentCycle(studentId);
  const ratio = !!(cycle && isRatioCycle(cycle));
  const chuongTrinh: string | null = cycle ? cycle.programme_code ?? programmeCodeOfCycle(cycle.id) : null;
  /* PR-SOS (K3-23): kỹ năng đang có Case chờ xác nhận nguyên nhân — form "+ Case" chấm nhỏ nút đó và dẫn sang Xác nhận Case. */
  const mo = conn.prepare(`SELECT sc.id, sc.topic, sc.category, sc.sos_level, sc.title, sc.origin_kind, sc.kck, sc.detected_at, sc.dedup_key, sc.goc_programme_code,
        a.attempt_no, a.kind AS attempt_kind, (SELECT COUNT(*) FROM case_interventions iv WHERE iv.case_id = sc.id) AS so_pa FROM sos_cases sc
      LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.student_id = ? AND sc.status != 'done'`).all(studentId) as any[];
  const cho = new Set(awaitingCauseCaseIds(mo.map((c) => c.id as number)));
  const choNguyenNhan: Record<string, { caseId: number; mt: number | null; sos: number | null; dot: string | null }> = {};
  for (const c of mo) if (cho.has(c.id)) choNguyenNhan[c.topic ?? c.category] = { caseId: c.id, mt: c.attempt_no ?? null, sos: c.sos_level ?? null, dot: c.attempt_kind ? nhanDot(c.attempt_kind, c.attempt_no ?? null) : null };   // lớp thường: `Progress Test` thay `MT2` (T58)
  const topics = caseTopicsFor(ratio, chuongTrinh);
  /* OV-11d (HV-19): kỹ năng người xem ghi bù được ("Đã xong từ trước") — CÙNG quyền `recordIntervention` (`SOS_EDIT` theo kỹ năng, C02 giữ). */
  const ghiBuDuoc = topics.filter((t) => can(p, PERMISSIONS.SOS_EDIT, { classId: enr?.class_id ?? null, studentId, skill: t === 'tong_hop' ? undefined : t }));
  /*
   * CASE-NHIEU (05 mục 7.1b): Case mở CÙNG HẠNG MỤC của từng kỹ năng — đúng khoá trùng `reportIssue` dùng (`caseDedupKey`, bỏ Case chương trình
   * khác) — để form hỏi "Ghi vào / mở riêng" ngay khi chọn chip thay vì chờ lỗi 400. Kỹ năng chờ xác nhận đã ở `choNguyenNhan`.
   */
  const ctLop = chuongTrinhCuaLop(enr?.class_id ?? null);
  const dangMo: Record<string, { id: number; title: string; detectedAt: string; soPa: number }> = {};
  for (const k of topics) {
    if (choNguyenNhan[k]) continue;
    const khoa = caseDedupKey({ category: categoryOf(k), studentId, cycleId: cycle?.id ?? null });
    const c = khoa ? mo.find((x) => x.dedup_key === khoa && !caseKhacChuongTrinh(x, ctLop)) : null;
    if (c) dangMo[k] = { id: c.id, title: caseTitleOf(c), detectedAt: c.detected_at, soPa: c.so_pa };
  }
  const phuTrach = chuCaseTheoKyNang(enr?.class_id ?? null, topics);
  return { ratio, topics, chuongTrinh, choNguyenNhan, ghiBuDuoc, dangMo, phuTrach };
}

/**
 * Phân loại NGUYÊN NHÂN bên trong một vấn đề. Chủ đề (kỹ năng) nằm ở chính
 * bản ghi vấn đề; ở đây chỉ nói VÌ SAO, và đó là nhận định của người dạy.
 *
 * "Hoàn cảnh kèm theo" đã bỏ (owner chốt 10/09/2026) — thay bằng ô Ghi chú của vấn đề.
 */
export function addIssues(caseId: number, actor: number | null, input: {
  primaryCode?: string | null; secondaryCodes?: string[];
  topic?: string | null; observation?: string | null;
}) {
  const conn = db();
  const add = (code: string, role: string, obs?: string | null) => {
    if (!code) return;
    conn
      .prepare(
        `INSERT INTO case_issues (case_id, role, taxonomy_code, taxonomy_version, skill, observation, created_by, created_at)
         VALUES (?,?,?,1,?,?,?,?)`,
      )
      .run(caseId, role, code, input.topic ?? null, obs ?? null, actor, nowIso());
  };
  if (input.primaryCode) add(input.primaryCode, 'primary', input.observation);
  for (const c of input.secondaryCodes ?? []) add(c, 'secondary', null);
}

// ---------------------------------------------------------------- tác động và xem lại

/**
 * Ghi một TÁC ĐỘNG. Một Case có nhiều tác động — đây là chỗ các cột cố định cũ không tả được.
 *
 * Người thực hiện tách khỏi người ghi nhận: CS trao đổi với phụ huynh, Admin ghi vào hệ
 * thống, thì phải giữ được cả hai. "Đã xong" bắt buộc có ngày thực tế; không có thì đó mới
 * chỉ là "đang thực hiện".
 */
export function recordIntervention(p: Principal, caseId: number, input: {
  /**
   * "Lùi lịch thi" phải nói rõ LÙI CÁI GÌ (mục 8.1): kế hoạch thi thật của em, hay một phần
   * thi trong đợt MT. Thiếu nó thì người duyệt không biết mình đang đồng ý với chuyện gì, và
   * mã cũ `reschedule_mt` có thể âm thầm sửa nhầm lịch.
   */
  rescheduleTarget?: string | null;
  kind: string; description?: string | null;
  /**
   * `performerSelf` là lời khai TƯỜNG MINH "việc này chính tôi làm". Có nó thì người thực
   * hiện là tài khoản đang đăng nhập. Không có nó thì hệ thống KHÔNG tự suy — người nhập
   * và người làm là hai vai khác nhau, và CS gọi phụ huynh thì người làm là CS chứ không
   * phải giáo viên đang gõ.
   */
  performerSelf?: boolean;
  performerUserId?: number | null; performerName?: string | null;
  /**
   * Giáo viên tự đánh dấu phương án này có cần Quản lý duyệt không. Cần thì nó ở trạng
   * thái ĐANG CHỜ và chưa được ghi là đã làm; không cần thì đi thẳng như trước.
   */
  needsApproval?: boolean;
  status?: string; plannedDate?: string | null; startedDate?: string | null;
  completedDate?: string | null; followupDue?: string | null;
  /** PA đề xuất "Khác" (`other_proposal`, T13): chữ ô Ghi rõ ≥ 3 ký tự — ghép vào đầu mô tả (không có cột riêng, Q9). */
  ghiRoKhac?: string | null;
  /** NHẬP BÙ (PR-C Task 3) — xem ghi chú đầy đủ ở `reportIssue`. Chảy tiếp từ đó. */
  backfill?: boolean;
  /** PA THAY THẾ (nhánh "propose" của Ghi kết quả, rà Dọn-a P2): không qua chặn bấm đúp — nếu không, PA mới trùng loại + mô tả với PA vừa ghi bị gộp và `superseded_by` trỏ về chính nó. */
  thayThe?: boolean;
  /** PR-GVa (F01 = D13): mã của MỘT lần mở form — gửi lại cùng mã trả Case với PA đã ghi, không ghi PA thứ hai. */
  idempotencyKey?: string | null;
  /** PR-PA (§8): Số buổi — chỉ Tutor / Tự học; trống được; số nguyên 1–60. */
  soBuoi?: unknown;
  /** OV-13b: "Đề xuất PA khác" — PA mới chờ duyệt thay PA mặc định `thayPaId` (`doiPa.ts` kiểm trước, kể cả quyền). */
  doiPa?: { thayPaId: number; lyDo: string; goc: { kind: string; chay: boolean }; followupId?: number | null };
}, opts: { daKiemQuyen?: boolean; khongTraCase?: boolean } = {}) {
  const conn = db();
  const c = loadCase(caseId);
  if (!opts.daKiemQuyen) {
    require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
      'Bạn không có quyền ghi nhận hỗ trợ cho Case này.');
  }
  if (c.tam) throw badRequest('Case tạm — lượt Mock Test chưa chốt SOS. Lượt chốt rồi mới thêm PA.');   // OV-13a (Q2)
  /* PR-S3F #2: thẻ "Không cần theo dõi" đang chờ Quản lý duyệt → chưa thêm PA (duyệt xong PA mới thêm sẽ bị huỷ oan). */
  if (sosCaseState(caseId).choDuyetKhongTheoDoi) {
    throw badRequest('Case đang chờ Quản lý duyệt "Không cần theo dõi" — chưa thêm phương án được. Chờ duyệt xong (hoặc bị từ chối) rồi thêm.');
  }
  if (!(INTERVENTION_KINDS as readonly string[]).includes(input.kind) || (SYSTEM_KINDS as readonly string[]).includes(input.kind)) throw badRequest('Loại hỗ trợ không hợp lệ.');   // PR-LT2a: PA Bổ trợ chỉ máy tạo
  const status = input.status && (INTERVENTION_STATUSES as readonly string[]).includes(input.status)
    ? input.status : 'completed';
  for (const [d, label] of [[input.plannedDate, 'Ngày dự kiến'], [input.startedDate, 'Ngày bắt đầu'],
    [input.completedDate, 'Ngày hoàn thành']] as const) {   // PR-SOS Q28-4: `followupDue` không còn nhận
    if (d && !isIsoDate(d)) throw loi(400, '{label} không hợp lệ.', { label });
  }
  /*
   * MÔ TẢ NGẮN BẮT BUỘC (mục 8.2).
   *
   * Tên loại phương án không nói được gì: "Học tutor" không cho người đọc sau ba tuần biết
   * tutor dạy gì, bao nhiêu buổi, đến khi nào. Đó chính là thứ mà một lần cập nhật kết quả
   * cần để so.
   */
  const moTa = chuTuDo(input.description, 'Mô tả ngắn', 2000) ?? '';   // PR-PA: cùng giới hạn với Sửa PA và ô nhập (2000)
  if (moTa.length < 8) {
    throw badRequest('Mô tả ngắn phải nói rõ làm gì cho em — ít nhất 8 ký tự.');
  }
  /* T13: PA đề xuất "Khác" cần ô Ghi rõ ≥ 3 ký tự; không có cột riêng nên ghép `{ghi rõ} — {mô tả}` (Q9). */
  if (input.kind === 'other_proposal') {
    const sai = kiemGhiRoKhac(input.ghiRoKhac);
    if (sai) throw loi(400, 'PA đề xuất "Khác": {loi}.', { loi: sai });
  }
  const description = input.kind === 'other_proposal' ? ghepKhac(input.ghiRoKhac ?? '', moTa) : moTa;
  /*
   * LÙI LỊCH THI PHẢI NÓI RÕ LÙI CÁI GÌ (mục 8.1).
   *
   * Người duyệt cần biết mình đang đồng ý dời kế hoạch thi thật của em, hay dời một phần
   * thi trong đợt MT — hai chuyện khác hẳn nhau về hệ quả.
   */
  let rescheduleTarget: RescheduleTarget | null = null;
  if (input.kind === 'reschedule_mt') {
    if (!input.rescheduleTarget
        || !(RESCHEDULE_TARGETS as readonly string[]).includes(input.rescheduleTarget)) {
      throw badRequest('Dời lịch thi thì phải chọn dời cái gì: '
        + RESCHEDULE_TARGETS.map((t) => RESCHEDULE_TARGET_LABEL[t]).join(' hoặc ') + '.');
    }
    rescheduleTarget = input.rescheduleTarget as RescheduleTarget;
  }
  /*
   * PHƯƠNG ÁN CẦN DUYỆT KHÔNG BAO GIỜ BẮT ĐẦU Ở TRẠNG THÁI ĐÃ LÀM (mục 7.7 [2]).
   * Gửi đi rồi thì nó đang CHỜ, và chu kỳ thực hiện chỉ chạy khi Quản lý duyệt.
   */
  const needsApprovalEarly = isProposalKind(input.kind) || !!input.needsApproval;
  const effStatus = needsApprovalEarly ? 'planned' : status;

  // "Đã xong" phải có ngày thực tế; nếu không thì nó mới là "đang thực hiện".
  if (effStatus === 'completed' && !input.completedDate && !input.startedDate) {
    throw badRequest('Ghi "đã xong" thì phải có ngày thực hiện. Chưa có ngày thì chọn "đang thực hiện".');
  }
  /*
   * NHẬP LỊCH SỬ "ĐÃ XONG" PHẢI LÀ NGÀY THẬT, KHÔNG PHẢI NGÀY MAI (mục 8.2).
   *
   * Một việc chưa xảy ra mà đã ghi là xong thì mọi thống kê "đã làm gì cho em" đều sai, và
   * không ai phát hiện ra vì nó nằm im trong quá khứ.
   */
  const today = demoToday();
  if (effStatus === 'completed' && (input.completedDate ?? input.startedDate ?? today) > today) {
    throw badRequest('Không ghi được việc đã xong ở ngày tương lai.');
  }
  /*
   * ĐỀ XUẤT CHỜ DUYỆT thì chưa phải việc đã làm.
   *
   * Việc hỗ trợ thật diễn ra ngoài phần mềm, nên chờ duyệt không làm chậm điều gì — nhưng
   * ghi luôn là "đã xong" trong lúc còn chờ thì sau này không ai biết Quản lý có đồng ý hay
   * không, và dấu vết ai chậm ở khâu nào cũng mất.
   */
  /*
   * Chọn một loại trong nhóm ĐỀ XUẤT tức là đang xin ý kiến — không phải tick thêm gì.
   * Nhờ vậy ô "cần Quản lý duyệt" chỉ còn hiện ở nhóm phương án giáo viên tự làm được.
   */
  const needsApproval = needsApprovalEarly;
  /*
   * Gửi kèm trạng thái "đã làm" cho một phương án cần duyệt là mâu thuẫn — nhưng thay vì
   * báo lỗi và bắt người dùng gõ lại, hệ thống ĐƯA VỀ "đã lên kế hoạch" (xem `effStatus`).
   * Chỉ chặn khi người dùng khai hẳn một ngày hoàn thành, vì lúc đó họ đang nói một điều
   * khác hẳn: việc đã xong rồi mới đi xin duyệt.
   */
  if (needsApproval && input.completedDate) {
    throw badRequest('Việc đã làm xong rồi thì không còn gì để duyệt — phương án cần duyệt phải ở "đã lên kế hoạch".');
  }
  /* PR-PA (§8): Số buổi chỉ ở loại có số buổi; người KHÔNG bắt buộc. Tự học không có người — vẫn kiểm (gửi sai vẫn 400) nhưng không lưu. */
  const soBuoi = soBuoiMoi({ kind: input.kind }, input.soBuoi, 0);
  const nguoi = chuanHoaNguoiThucHien(p, input, { nhom: 'giao_vien', batBuoc: false });
  const performerUserId = coNguoiDay(input.kind) ? nguoi?.userId ?? null : null;
  const performerName = coNguoiDay(input.kind) ? nguoi?.name ?? null : null;

  /*
   * PR-GVa (F01 = D13): gửi lại CÙNG khoá của lần mở form → trả Case với PA đã ghi. Kiểm quyền / dữ liệu ở trên chạy TRƯỚC khi tra khoá.
   * Nhập bù và PA thay thế đi theo đường khác (nhiều dòng có thể giống nhau, cố ý) — không dùng khoá.
   */
  const khoa = input.backfill || input.thayThe ? null : chuanKhoaGui(input.idempotencyKey);
  const taoMoi = () => tx(() => {
    if (theoKhoaGui('case_interventions', 'recorded_by', p.userId, khoa)) return caseDetail(p, caseId);
    /*
     * HẠN QUẢN LÝ PHẢI TRẢ LỜI — `HAN_DUYET_NGAY` (5) ngày, tính cả ngày gửi (T54, K3-18, PR-N1).
     * Quá hạn KHÔNG chặn gì cả; nó nổi lên màn của Quản lý để một đề xuất không nằm
     * im mãi, và thời gian chờ đó tính cho QUẢN LÝ chứ không phải cho giáo viên.
     */
    const approvalDue = needsApproval ? hanTheoNgay(today, HAN_DUYET_NGAY) : null;

    /*
     * CHU KỲ ĐẦU TIÊN bắt đầu NGAY, trừ hai trường hợp:
     *
     *   · phương án CẦN DUYỆT — chỉ bắt đầu khi được duyệt (mục 7.7): thời gian chờ Quản lý
     *     không được tính là giáo viên đã có thời gian làm;
     *   · NGÀY BẮT ĐẦU Ở TƯƠNG LAI — nghĩa vụ cập nhật chỉ chạy khi thật sự đến ngày (mục
     *     8.2), chứ không giả vờ phương án đã chạy từ hôm nay.
     */
    const cycleStart = needsApproval ? null : (input.startedDate ?? today);

    /*
     * HAI MỐC KHÁC NHAU CỦA MỘT PHƯƠNG ÁN (mục 8.3) — trước đây gộp làm một nên không ai
     * phân biệt được "đã đến lúc báo tiến độ" với "đã đến hạn xong việc".
     *
     *   · HẠN GHI KẾT QUẢ (`action_due`): OV-12a — kỳ hai tuần từ tuần bắt đầu, ghi xong trước hết Thứ Ba sau kỳ (`hanKyGhiKetQua`).
     *   · PR-SOS (Q28-4): KHÔNG còn "dự kiến kết thúc" — PA thường `followup_due` luôn NULL (mốc chỉ có ở PA quy chế).
     *
     * CHỐT 1 + 2 (mục 10.4) CHO PHƯƠNG ÁN NHẬP BÙ: không hạn cập nhật, không hạn kết thúc.
     * Phương án bắt đầu từ một ngày quá khứ xa (ví dụ tháng 7) mà vẫn tính hạn kiểu bình
     * thường thì `hanKyGhiKetQua` ra một hạn đã trôi qua từ lâu — chính là "sinh ~10 dòng
     * quá hạn giả" mà chủ sản phẩm cảnh báo. Việc đã xong rồi thì không còn gì để mà tới hạn.
     */
    const updateDue = input.backfill ? null : (!cycleStart ? null : hanKyGhiKetQua(cycleStart));
    const cycleDue = updateDue;

    const [id] = chenPa(conn, [{
      caseId, kind: input.kind, description, soBuoi, performerUserId, performerName, recordedBy: p.userId, status: effStatus,
      plannedDate: input.plannedDate ?? null, startedDate: input.startedDate ?? null, completedDate: input.completedDate ?? null,
      actionDue: cycleDue, cycleStartedOn: cycleStart,
      needsApproval, approvalState: needsApproval ? 'pending' : null, approvalDue,
      rescheduleTarget, idempotencyKey: khoa,
    }]);
    const performerDisplayName = performerName
      ?? (performerUserId
        ? ((conn.prepare('SELECT full_name FROM users WHERE id = ?').get(performerUserId) as any)?.full_name ?? null)
        : null);

    if (needsApproval) {
      /* PR-DUYET (T43, K1-39): đề xuất cần duyệt thành MỘT thẻ ở hộp Chờ duyệt (thông báo `duyet_moi` do hộp gửi). PA không cần
         duyệt không báo QL nữa — chuông chỉ trỏ việc QL phải làm. */
      taoYeuCau(conn, {
        loai: 'de_xuat_pa', doiTuongLoai: 'intervention', doiTuongId: id,
        hocVienId: c.eff_student_id, lopId: c.class_id ?? null, nguoiXin: p.userId,
        lyDo: description || null, hanDuyet: approvalDue, duLieu: input.doiPa,
      });
      /* OV-13b: PA gốc trỏ PA mới tới khi Quản lý trả lời (`CHO_DOI_PA`) — chưa khép. */
      if (input.doiPa) conn.prepare('UPDATE case_interventions SET superseded_by = ?, updated_at = ? WHERE id = ?').run(id, nowIso(), input.doiPa.thayPaId);
    }

    // Có tác động thì Case chuyển sang đang xử lý — trừ khi đã đóng; Case từ SOS theo luật Q28-5.
    dongBoTrangThaiCase(caseId);
    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: 'intervention', eventDate: input.completedDate ?? input.startedDate ?? today,
      title: `${input.backfill ? '(nhập bù) ' : ''}Hỗ trợ: ${description.slice(0, 60) || input.kind}`,
      detail: performerDisplayName,
      refTable: 'case_interventions', refId: id, createdBy: p.userId,
      dedupKey: `intervention:${id}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'case.intervention', entityType: 'case_intervention',
      entityId: id, entityLabel: `Case ${caseId} · ${input.kind}`, after: { status } });
    return opts.khongTraCase ? null : caseDetail(p, caseId);
  });
  try { return taoMoi(); }
  catch (e) {
    /* Hai lần gửi đồng thời cùng khoá: lần thua vấp unique index → trả Case với PA lần thắng đã ghi. */
    if (laTrungKhoa(e) && theoKhoaGui('case_interventions', 'recorded_by', p.userId, khoa)) return caseDetail(p, caseId);
    throw e;
  }
}

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ XUẤT: duyệt (giáo viên tiến hành) hoặc không duyệt (bắt buộc lý do).
 * PR-DUYET (K3-20, Q4): bỏ "Góp ý" — Từ chối có lý do đã đủ. Đường này chốt luôn thẻ ở hộp Chờ duyệt (cùng giao dịch), nên
 * gọi thẳng (đường cũ) hay qua hộp đều ra một kết quả.
 *
 * Quá hạn KHÔNG tự duyệt và cũng không tự huỷ. Im lặng không bao giờ được hiểu thành đồng ý —
 * nó chỉ làm đề xuất nổi lên màn của Quản lý mỗi ngày cho tới khi có người trả lời.
 */
export function respondToPlan(p: Principal, interventionId: number, input: {
  decision: 'approved' | 'declined'; note?: string | null;
}, opts: {
  /** PR-LUI-a2: hộp Chờ duyệt (duyệt / từ chối nhiều) không dùng Case trả về — bỏ `caseDetail` (~40 câu mỗi thẻ). */
  khongTraCase?: boolean;
} = {}) {
  if ((input.decision as string) === 'comment') throw badRequest('Không còn Góp ý: Duyệt, hoặc Từ chối có lý do.');
  if (input.decision !== 'approved' && input.decision !== 'declined') throw badRequest('Chọn Duyệt hoặc Từ chối.');
  const conn = db();
  const iv = conn
    .prepare(
      /*
       * `sos_cases` KHÔNG có cột lớp — lớp suy ra từ bài đánh giá, hoặc từ lớp em đang học.
       * Giống hệt `loadCase`, để quyền của một Case luôn tính trên cùng một lớp dù vào từ
       * đâu; viết `sc.class_id` là sai và sẽ hỏng ngay khi chạy.
       */
      `SELECT iv.*, sc.student_id, sc.attempt_id, iv.status AS iv_status, sc.status AS case_status,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id,
              COALESCE(a.class_id,
                       (SELECT e.class_id FROM enrollments e
                         WHERE e.student_id = COALESCE(sc.student_id, a.student_id)
                           AND e.status = 'active' ORDER BY e.id DESC LIMIT 1)) AS class_id
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE iv.id = ?`,
    )
    .get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án');
  require_(p, PERMISSIONS.CASE_APPROVE, { classId: iv.class_id, studentId: iv.eff_student_id },
    'Chỉ Quản lý mới duyệt được phương án hỗ trợ.');
  if (!iv.needs_approval) throw badRequest('Phương án này không cần duyệt.');
  /* K5-58 (PR-N1): PA đã huỷ / Case đã đóng thì không còn gì để duyệt — trước đây vẫn duyệt được và PA "sống lại". */
  if (iv.iv_status === 'cancelled' || iv.case_status === 'done') throw badRequest('PA này đã huỷ hoặc Case đã đóng — không còn gì để duyệt.');
  /*
   * ĐÃ TRẢ LỜI RỒI THÌ THÔI. Đổi ý là chuyện bình thường, nhưng sửa đè lên câu trả lời cũ
   * sẽ xoá mất lý do đã ghi — giáo viên đọc lại không biết vì sao lúc đầu bị bác. Đổi ý thì
   * đề xuất lại, để hồ sơ giữ cả hai lần.
   */
  if (iv.approval_state === 'approved' || iv.approval_state === 'declined') {
    throw badRequest(
      iv.approval_state === 'approved'
        ? 'Phương án này đã được duyệt rồi.'
        : 'Phương án này đã bị từ chối. Muốn đổi ý thì giáo viên đề xuất lại, để giữ cả lý do lần trước.',
    );
  }

  const note = (input.note ?? '').trim() || null;
  if (input.decision === 'declined' && !note) {
    throw badRequest('Từ chối thì phải ghi lý do, để giáo viên biết nên làm gì tiếp.');
  }

  return tx(() => {
    /*
     * CHU KỲ THỰC HIỆN BẮT ĐẦU TỪ LÚC ĐƯỢC DUYỆT, không phải từ lúc gửi đề xuất (mục 7.7).
     *
     * Quản lý để đề xuất nằm mười ngày rồi mới duyệt thì mười ngày đó là của Quản lý.
     * Tính hạn từ ngày gửi là bắt giáo viên chịu một cái trễ không phải của họ — và cái
     * số "quá hạn" sau đó chỉ ra một người sai.
     */
    const approvedOn = demoToday();
    /* OV-12a: cùng lịch kỳ từ ngày bắt đầu PA (ngày bắt đầu = ngày duyệt nếu chưa có) — hạn đầu = hạn kỳ đầu tiên ≥ ngày duyệt. */
    const startDue = input.decision === 'approved' ? hanKyGhiKetQua(iv.started_date ?? approvedOn, addDays(approvedOn, -1)) : null;
    conn
      .prepare(
        `UPDATE case_interventions
            SET approval_state = ?, approval_by = ?, approval_at = ?, approval_note = ?,
                status = CASE WHEN ? = 'declined' THEN 'cancelled'
                              WHEN ? = 'approved' THEN 'started' ELSE status END,
                cycle_started_on = CASE WHEN ? = 'approved' THEN ? ELSE cycle_started_on END,
                started_date    = CASE WHEN ? = 'approved' THEN COALESCE(started_date, ?) ELSE started_date END,
                action_due      = CASE WHEN ? = 'approved' THEN ? ELSE action_due END,
                updated_at = ?
          WHERE id = ?`,
      )
      .run(input.decision, p.userId, nowIso(), note,
           input.decision, input.decision,
           input.decision, approvedOn,
           input.decision, approvedOn,
           input.decision, startDue,
           nowIso(), interventionId);

    addJourney({
      studentId: iv.eff_student_id, cycleId: iv.eff_cycle_id,
      eventType: input.decision === 'declined' ? 'plan_declined' : 'plan_approved',
      eventDate: demoToday(),
      title: input.decision === 'approved' ? 'Quản lý duyệt PA hỗ trợ' : 'Quản lý từ chối PA',
      detail: [iv.description, note].filter(Boolean).join(' — ') || null,
      refTable: 'case_interventions', refId: interventionId, createdBy: p.userId,
      dedupKey: `plan-${input.decision}:${interventionId}`,
    });

    /* Người đề xuất nhận `duyet_ket_qua` từ thẻ (thay thông báo `plan-reply` cũ). */
    chotYeuCau(conn, { loai: 'de_xuat_pa', doiTuongLoai: 'intervention', doiTuongId: interventionId },
      input.decision === 'approved' ? 'duyet' : 'tu_choi', { nguoiDuyet: p.userId, lyDo: note });

    writeAudit({ actorUserId: p.userId, action: `case.plan.${input.decision}`,
      entityType: 'case_intervention', entityId: interventionId,
      /* PR-LUI-a2: `before.startedDate` — Huỷ quyết định trả PA về ĐÚNG ngày bắt đầu lúc gửi (duyệt điền ngày duyệt khi trống). */
      entityLabel: iv.description ?? iv.kind, before: { startedDate: iv.started_date ?? null }, after: { decision: input.decision, note } });
    return opts.khongTraCase ? null : caseDetail(p, iv.case_id);
  });
}

/**
 * HUỶ QUYẾT ĐỊNH ĐỀ XUẤT PA BẤM NHẦM (PR-LUI-a2) — đảo `respondToPlan`: PA về đúng như lúc gửi (chờ duyệt, chưa chạy chu kỳ). Gọi TRONG tx
 * của hộp (`huyQuyetDinh` kiểm quyền, trong ngày). Chặn khi PA đã có kết quả hoặc Case đã đóng — lúc đó việc đã thật sự chạy.
 */
export function huyQuyetDinhPa(p: Principal, interventionId: number) {
  const conn = db();
  const iv = conn.prepare(`SELECT iv.*, sc.status AS case_status, COALESCE(sc.student_id, a.student_id) AS eff_student_id,
      COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE iv.id = ?`).get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án');
  if (iv.approval_state !== 'approved' && iv.approval_state !== 'declined') throw badRequest('PA này chưa có quyết định để huỷ.');
  if (iv.case_status === 'done') throw badRequest('Case đã đóng — không huỷ quyết định được.');
  if (conn.prepare('SELECT 1 FROM case_followups WHERE intervention_id = ? LIMIT 1').get(interventionId)) {
    throw badRequest('PA đã có kết quả — không huỷ quyết định được.');
  }
  const nk = conn.prepare(`SELECT before_json FROM audit_logs WHERE entity_type = 'case_intervention' AND entity_id = ? AND action = ?
      ORDER BY id DESC LIMIT 1`).get(interventionId, `case.plan.${iv.approval_state}`) as any;
  let batDau: string | null = iv.started_date ?? null;
  try { if (nk?.before_json) batDau = JSON.parse(nk.before_json).startedDate ?? null; } catch { /* nhật ký cũ không có — giữ ngày đang có */ }
  conn.prepare(`UPDATE case_interventions SET approval_state = 'pending', approval_by = NULL, approval_at = NULL, approval_note = NULL,
      status = 'planned', cycle_started_on = NULL, started_date = ?, action_due = NULL, updated_at = ? WHERE id = ?`)
    .run(batDau, nowIso(), interventionId);
  /* Mốc Hành trình của quyết định cũ đổi khoá (giữ làm lịch sử) — quyết lại vẫn ghi được mốc mới. */
  conn.prepare(`UPDATE journey_events SET dedup_key = dedup_key || ? WHERE dedup_key = ?`)
    .run(`:huy:${nowIso()}`, `plan-${iv.approval_state}:${interventionId}`);
  addJourney({
    studentId: iv.eff_student_id, cycleId: iv.eff_cycle_id, eventType: 'plan_approval_undone', eventDate: demoToday(),
    title: 'Quản lý huỷ quyết định PA', detail: iv.description ?? null,
    refTable: 'case_interventions', refId: interventionId, createdBy: p.userId, dedupKey: `plan-undo:${interventionId}:${nowIso()}`,
  });
  dongBoTrangThaiCase(iv.case_id);
}

// ---------------------------------------------------------------- PR-LUI-a2 · Sửa Case · Xoá Case · Xoá PA

/** Ai sửa được Case: người sửa Case (`SOS_EDIT` đúng môn), người tạo Case, GVCN lớp em, Quản lý / Quản trị trong phạm vi (C02 giữ cho PA). */
function coTheSuaCase(p: Principal, c: any): boolean {
  if (c.status === 'done') return false;
  const xem = can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: c.class_id, studentId: c.eff_student_id });
  return can(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c)) || (xem && c.reported_by === p.userId)
    || can(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id });
}
const CASE_XOA_DUOC = ['teacher_report', 'backfill'];
/** Vì sao KHÔNG xoá được Case (null = được). Dùng chung `xoaCase` và cờ `viewer.coTheXoa`. */
function chanXoaCase(c: any): string | null {
  if (!CASE_XOA_DUOC.includes(c.origin_kind)) return 'Case từ kết quả Test — dùng "Không cần theo dõi".';
  if (c.status === 'done') return 'Case đã hoàn thành — Mở lại trước khi xoá.';
  if (db().prepare('SELECT 1 FROM case_followups WHERE case_id = ? AND intervention_id IS NOT NULL LIMIT 1').get(c.id)) {
    return 'Case còn PA có kết quả — xoá các PA trước.';
  }
  return null;
}

/**
 * SỬA CASE (PR-LUI-a2, mockup mục 18): tên · mô tả · mức · nhóm nguyên nhân (+ Ghi rõ) · kỹ năng (chỉ khi Case CHƯA có PA). Luật nội dung chung
 * `kiemNoiDungCase` với Xác nhận Case. Mỗi ô đổi một dòng `sos_case_history` + nhật ký `case.edit`; không đổi gì thì không ghi.
 */
export function suaCase(p: Principal, caseId: number, input: {
  title?: string | null; summary?: string | null; urgency?: string | null; topic?: string | null;
  primaryCode?: string | null; observation?: string | null;
  /** MO-TA-CASE: nhóm nguyên nhân theo thứ tự chọn (1 = chính, sau = phụ) — như Xác nhận Case; có thì thay `primaryCode` và mọi nhóm phụ. */
  nhom?: unknown;
  /** SV-NX-CASE: `capNhatLuc` của Case lúc mở panel — khác bản đang có → 409 (không ghi đè im lặng); `undefined` = không so. */
  luc?: string | null;
}) {
  const conn = db();
  const c = loadCase(caseId);
  if (c.status === 'done') throw badRequest('Case đã hoàn thành — Mở lại trước khi sửa.');
  if (!coTheSuaCase(p, c)) throw forbidden('Bạn không có quyền sửa Case này.');
  const st = sosCaseState(caseId);
  /* SV-NX-CASE (N8 ②⑤): Case MT sửa / ghi mô tả lúc nào cũng được (kể cả chưa có, quá hạn) — chỉ Case không phải MT còn đòi Xác nhận Case trước. */
  if (st.fromSos && !st.hasCause && !st.laMt) throw badRequest('Case chưa xác nhận — Xác nhận Case trước.');
  const chinh = conn.prepare(`SELECT * FROM case_issues WHERE case_id = ? AND role = 'primary' ORDER BY id LIMIT 1`).get(caseId) as any;
  /* Case MT: mô tả đang đi theo nhận xét của bài (`created_by` NULL). Người sửa mô tả / nhóm ở đây → tách hẳn (`created_by` = người sửa), nhận xét sau không đè. */
  const theoNhanXet = st.laMt && !!chinh && chinh.created_by == null;
  const ct: string | null = c.goc_programme_code ?? (c.eff_cycle_id ? programmeCodeOfCycle(c.eff_cycle_id) : null);
  const topic: string = input.topic === undefined || input.topic === null ? c.topic : String(input.topic).trim();
  const doiKyNang = topic !== c.topic;
  /* SV-NX-CASE: chỉ coi là sửa mô tả khi CÓ gửi nhóm / mô tả — Case MT chưa mô tả mà chỉ đổi tên / mức độ không bị đòi mô tả. */
  const nhom = input.nhom == null ? null : input.nhom;
  if (nhom !== null && (!Array.isArray(nhom) || !nhom.length || !nhom.every((x) => typeof x === 'string') || new Set(nhom).size !== nhom.length)) {
    throw badRequest('Nhóm nguyên nhân không hợp lệ.');
  }
  const guiMoTa = (input.primaryCode != null && input.primaryCode !== '') || input.observation !== undefined || nhom !== null;
  if (typeof input.observation === 'string' && input.observation.trim().length > NHAN_XET_TOI_DA) {
    throw loi(400, 'Nhận xét tối đa {x} ký tự (đang {length}).', { x: NHAN_XET_TOI_DA, length: input.observation.trim().length });
  }
  const nd = kiemNoiDungCase(topic, ct, {
    primaryCode: nhom?.[0] ?? input.primaryCode ?? (doiKyNang ? null : chinh?.taxonomy_code ?? null),
    observation: input.observation !== undefined ? input.observation : chinh?.observation ?? null,
    urgency: input.urgency ?? c.urgency ?? DEFAULT_URGENCY,
    moTa: input.summary ?? c.summary, tenGiua: input.title ?? c.title ?? tenGiuaCua(c),
  }, { khongDoiMoTa: st.laMt, boNguyenNhan: st.laMt && !chinh && !guiMoTa });   // OV-13a (Q1): Case MT không có ô Mô tả — mô tả là nhận xét của bài
  if (nhom?.slice(1).some((x) => !issuesForTopic(topic, ct).some((i) => i.code === x))) {
    throw loi(400, 'Phân loại đã chọn không thuộc bộ phân loại của {chuDe}.', { chuDe: caseTopicLabel(topic, ct) });
  }
  const phuCu = (conn.prepare(`SELECT taxonomy_code FROM case_issues WHERE case_id = ? AND role = 'secondary' ORDER BY id`).all(caseId) as any[]).map((x) => x.taxonomy_code as string);
  let khoaMoi: string | null = c.dedup_key ?? null;
  if (doiKyNang) {
    if (c.origin_kind === 'mock') throw badRequest('Case từ kết quả Test — không đổi kỹ năng.');
    if (conn.prepare('SELECT 1 FROM case_interventions WHERE case_id = ? LIMIT 1').get(caseId)) throw badRequest('Case đã có PA — không đổi kỹ năng.');
    const cycle = c.eff_cycle_id ? conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(c.eff_cycle_id) as any : null;
    if (!(caseTopicsFor(!!cycle && isRatioCycle(cycle), ct) as readonly string[]).includes(topic)) throw loi(400, 'Chủ đề không hợp lệ: {topic}', { topic });
    khoaMoi = c.parallel ? null : caseDedupKey({ category: categoryOf(topic), studentId: c.eff_student_id, cycleId: c.eff_cycle_id });
    const giu = khoaMoi ? conn.prepare(`SELECT id, status FROM sos_cases WHERE dedup_key = ? AND id != ?`).get(khoaMoi, caseId) as any : null;
    if (giu && giu.status !== 'done') throw loi(400, 'Đã có Case {chuDe} đang mở.', { chuDe: caseTopicLabel(topic, ct) });
  }
  const truoc: Record<string, unknown> = {
    title: c.title ?? null, summary: c.summary ?? null, urgency: c.urgency ?? null, topic: c.topic ?? null,
    primaryCode: chinh?.taxonomy_code ?? null, observation: chinh?.observation ?? null, nhomPhu: phuCu.join(',') || null,
  };
  const sau: Record<string, unknown> = {
    title: nd.tenGiua, summary: nd.moTa, urgency: nd.urgency, topic, primaryCode: nd.primaryCode || null, observation: nd.observation,
    nhomPhu: nhom ? nhom.slice(1).join(',') || null : phuCu.join(',') || null,
  };
  const doi = Object.keys(sau).filter((k) => (truoc[k] ?? null) !== (sau[k] ?? null));
  if (!doi.length) return caseDetail(p, caseId);
  const doiMoTa = guiMoTa && (doi.includes('primaryCode') || doi.includes('observation') || doi.includes('nhomPhu') || !chinh);
  if (st.laMt && doiMoTa && (nd.observation ?? '').length < NHAN_XET_MT_TOI_THIEU) {
    throw loi(400, 'Mô tả Case cần ít nhất {n} ký tự — vấn đề học thuật của kỹ năng.', { n: NHAN_XET_MT_TOI_THIEU });
  }
  return tx(() => {
    const ban = (conn.prepare('SELECT updated_at FROM sos_cases WHERE id = ?').get(caseId) as any)?.updated_at ?? null;
    if (input.luc !== undefined && (input.luc ?? null) !== ban) {
      throw loi(409, 'Case vừa được cập nhật lúc {luc} — xem lại rồi bấm Lưu lần nữa để ghi đè', { luc: ban ? ban.slice(11, 16) : '—' }, { luc: ban });
    }
    if (doiKyNang && khoaMoi) conn.prepare(`UPDATE sos_cases SET dedup_key = NULL WHERE dedup_key = ? AND status = 'done'`).run(khoaMoi);
    conn.prepare(`UPDATE sos_cases SET title = ?, summary = ?, urgency = ?, topic = ?, category = ?, dedup_key = ?, updated_at = ? WHERE id = ?`)
      .run(nd.tenGiua, nd.moTa, nd.urgency, topic, categoryOf(topic), khoaMoi, nowIso(), caseId);
    if (chinh) {
      conn.prepare('UPDATE case_issues SET taxonomy_code = ?, observation = ?, skill = ?, created_by = ? WHERE id = ?')
        .run(nd.primaryCode, nd.observation, topic, doiMoTa ? p.userId : chinh.created_by ?? null, chinh.id);
    } else if (nd.primaryCode) addIssues(caseId, p.userId, { primaryCode: nd.primaryCode, observation: nd.observation, topic });
    if (doi.includes('nhomPhu')) {
      conn.prepare(`DELETE FROM case_issues WHERE case_id = ? AND role = 'secondary'`).run(caseId);
      addIssues(caseId, p.userId, { secondaryCodes: nhom!.slice(1), topic });
    }
    const ls = conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?,?,?,?,?,?)`);
    for (const k of doi) ls.run(caseId, k, truoc[k] == null ? null : String(truoc[k]), sau[k] == null ? null : String(sau[k]), p.userId, nowIso());
    if (theoNhanXet && doiMoTa) ls.run(caseId, 'mo_ta_nguon', 'nhan_xet', 'sua_rieng', p.userId, nowIso());   // SV-NX-CASE: từ nay tách khỏi nhận xét
    if (!chinh && nd.primaryCode) dongBoTrangThaiCase(caseId);
    writeAudit({ actorUserId: p.userId, action: 'case.edit', entityType: 'sos_case', entityId: caseId, entityLabel: caseTitleOf({ ...c, title: nd.tenGiua }),
      before: Object.fromEntries(doi.map((k) => [k, truoc[k]])), after: Object.fromEntries(doi.map((k) => [k, sau[k]])) });
    return caseDetail(p, caseId);
  });
}

/**
 * SV-NX-CASE (plan.md 1.6 N8 ③, chủ SP 23/10) — XÁC NHẬN CASE SPEAKING CHẤM CHÉO. Người chấm chéo (không phải GV phụ trách S của em) lưu nhận xét ô S →
 * ô chờ (`cho_phu_trach_xem` = 1), nhận xét đó KHÔNG tự thành mô tả. GV phụ trách S (GVCN / Quản lý làm thay — cùng quyền "Nhận xét GV phụ trách", OV-13k) chọn:
 *   `dung` — nhận xét chấm chéo thành mô tả (đi theo nhận xét ô đó, như GV tự nhập) · `giu` — giữ mô tả đang có · `viet` — mô tả khác (`moTa` ≥ 10 ký tự, tách
 *   khỏi nhận xét). Nhóm: giữ nhóm chính đang có, chưa có thì nhóm của ô / "Khác". Xong → hạ cờ, việc hết. Lịch sử `sos_case_history` + nhật ký `case.xac_nhan_s`.
 */
export function xacNhanCaseS(p: Principal, caseId: number, body: { cach?: unknown; moTa?: unknown }) {
  const conn = db();
  const c = loadCase(caseId);
  if (c.status === 'done' || c.tam || c.topic !== 'speaking' || c.attempt_kind !== 'mock') throw badRequest('Case này không có nhận xét Speaking chấm chéo chờ xác nhận.');
  const o = conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).get(c.attempt_id) as any;
  if (!o?.cho_phu_trach_xem) throw badRequest('Nhận xét Speaking chấm chéo đã được xác nhận.');
  if (!quyenPhuTrachS(p, c.attempt_class_id ?? null)) throw forbidden('Chỉ GV phụ trách Speaking của lớp, GVCN hoặc Quản lý xác nhận được Case này.');
  const cach = body.cach;
  if (cach !== 'dung' && cach !== 'giu' && cach !== 'viet') throw badRequest('Chọn: dùng nhận xét chấm chéo, giữ mô tả, hoặc viết mô tả khác.');
  const chinh = conn.prepare(`SELECT * FROM case_issues WHERE case_id = ? AND role = 'primary' ORDER BY id LIMIT 1`).get(caseId) as any;
  const nx = String(o.comment ?? '').trim();
  if (cach === 'dung' && !nx) throw badRequest('Bài chưa có nhận xét chấm chéo — viết mô tả khác.');
  if (cach === 'giu' && !chinh) throw badRequest('Case chưa có mô tả — dùng nhận xét chấm chéo hoặc viết mô tả khác.');
  const moTa = cach === 'viet' ? String(body.moTa ?? '').trim() : '';
  if (cach === 'viet' && (moTa.length < NHAN_XET_MT_TOI_THIEU || moTa.length > NHAN_XET_TOI_DA)) {
    throw loi(400, 'Mô tả Case cần ít nhất {n} ký tự — vấn đề học thuật của kỹ năng.', { n: NHAN_XET_MT_TOI_THIEU });
  }
  return tx(() => {
    /* Đọc lại cờ TRONG giao dịch: hai người bấm cùng lúc → người sau 400, không ghi đè mô tả người trước vừa chọn. */
    if (!(conn.prepare('SELECT cho_phu_trach_xem c FROM assessment_scores WHERE id = ?').get(o.id) as any)?.c) throw badRequest('Nhận xét Speaking chấm chéo đã được xác nhận.');
    const luc = nowIso();
    const ls = conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?,?,?,?,?,?)`);
    /* Nhóm chính + nhóm phụ TRƯỚC (lịch sử + nhật ký): "dùng nhận xét" thay cả nhóm theo ô — khôi phục được từ đây. */
    const nhomCu = (conn.prepare(`SELECT role, taxonomy_code FROM case_issues WHERE case_id = ? ORDER BY CASE role WHEN 'primary' THEN 0 ELSE 1 END, id`).all(caseId) as any[])
      .map((x) => x.taxonomy_code as string);
    if (cach === 'dung') {
      conn.prepare('UPDATE sos_cases SET mo_ta_attempt_id = NULL WHERE id = ?').run(caseId);   // ép ghi lại (kể cả Case đang có mô tả / đã sửa riêng)
      ganMoTaTuO(conn, caseId, 'speaking', c.attempt_id, nx, o.nhom_nguyen_nhan);
      if ((chinh?.observation ?? null) !== nx) ls.run(caseId, 'observation', chinh?.observation ?? null, nx, p.userId, luc);
      if (chinh?.created_by != null) ls.run(caseId, 'mo_ta_nguon', 'sua_rieng', 'nhan_xet', p.userId, luc);
      const nhomMoi = (conn.prepare(`SELECT taxonomy_code FROM case_issues WHERE case_id = ? ORDER BY CASE role WHEN 'primary' THEN 0 ELSE 1 END, id`).all(caseId) as any[])
        .map((x) => x.taxonomy_code as string);
      if (nhomMoi.join() !== nhomCu.join()) ls.run(caseId, 'nhom_nguyen_nhan', nhomCu.length ? JSON.stringify(nhomCu) : null, JSON.stringify(nhomMoi), p.userId, luc);
    } else if (cach === 'viet') {
      const boNhom = issuesForTopic('speaking');
      const code = chinh?.taxonomy_code ?? docNhomNguyenNhan(o.nhom_nguyen_nhan).find((x) => boNhom.some((i) => i.code === x))
        ?? boNhom.find((i) => laKhac(i.code))?.code;
      if (!code) throw badRequest('Chọn nhóm nguyên nhân.');
      if (chinh) conn.prepare('UPDATE case_issues SET observation = ?, created_by = ? WHERE id = ?').run(moTa, p.userId, chinh.id);
      else addIssues(caseId, p.userId, { primaryCode: code, observation: moTa, topic: 'speaking' });
      ls.run(caseId, 'observation', chinh?.observation ?? null, moTa, p.userId, luc);
      if (!chinh || chinh.created_by == null) ls.run(caseId, 'mo_ta_nguon', chinh ? 'nhan_xet' : null, 'sua_rieng', p.userId, luc);
    }
    conn.prepare('UPDATE assessment_scores SET cho_phu_trach_xem = 0 WHERE id = ?').run(o.id);
    conn.prepare('UPDATE sos_cases SET updated_at = ? WHERE id = ?').run(luc, caseId);
    dongBoTrangThaiCase(caseId);
    writeAudit({ actorUserId: p.userId, action: 'case.xac_nhan_s', entityType: 'sos_case', entityId: caseId, entityLabel: caseTitleOf(c),
      before: { moTa: chinh?.observation ?? null, nhom: nhomCu },
      after: { cach, moTa: cach === 'dung' ? nx : cach === 'viet' ? moTa : chinh?.observation ?? null,
        nhom: (conn.prepare(`SELECT taxonomy_code FROM case_issues WHERE case_id = ? ORDER BY CASE role WHEN 'primary' THEN 0 ELSE 1 END, id`).all(caseId) as any[]).map((x) => x.taxonomy_code) } });
    return caseDetail(p, caseId);
  });
}

/** Câu xoá con → cha của MỘT PA (tham số ?1 = id PA). Tệp đọc riêng trước để xoá trong kho SAU khi chốt. */
const PA_F = 'SELECT id FROM case_followups WHERE intervention_id = ?1';
const CAU_XOA_PA: readonly string[] = [
  `DELETE FROM case_intervention_revisions WHERE intervention_id = ?1 OR followup_id IN (${PA_F})`,
  `DELETE FROM case_followups WHERE intervention_id = ?1`,
  `UPDATE case_interventions SET superseded_by = NULL WHERE superseded_by = ?1`,
  `UPDATE task_students SET intervention_id = NULL WHERE intervention_id = ?1`,
  `DELETE FROM attachments WHERE owner_type = 'case_intervention' AND owner_id = ?1`,
  `DELETE FROM journey_events WHERE ref_table = 'case_interventions' AND ref_id = ?1`,
  `DELETE FROM notifications WHERE entity_type = 'case_intervention' AND entity_id = ?1`,
  `DELETE FROM case_interventions WHERE id = ?1`,
];
/** Câu xoá con → cha của MỘT Case báo tay (tham số ?1 = id Case) — mọi bảng trỏ `sos_cases` / PA của nó (đối chiếu `schema.sql`, như `xoaHocVien`). */
const CASE_I = 'SELECT id FROM case_interventions WHERE case_id = ?1';
const CAU_XOA_CASE: readonly string[] = [
  `UPDATE sos_cases SET previous_case_id = NULL WHERE previous_case_id = ?1`,
  `UPDATE tasks SET source_sos_case_id = NULL WHERE source_sos_case_id = ?1`,
  `UPDATE case_signals SET case_id = NULL WHERE case_id = ?1`,
  `UPDATE ban_chup_luot SET case_id = NULL WHERE case_id = ?1`,
  `UPDATE task_students SET case_id = NULL, intervention_id = NULL WHERE case_id = ?1 OR intervention_id IN (${CASE_I})`,
  `DELETE FROM task_case_links WHERE case_id = ?1`,
  `DELETE FROM case_intervention_revisions WHERE case_id = ?1 OR intervention_id IN (${CASE_I})`,
  `DELETE FROM case_followups WHERE case_id = ?1 OR intervention_id IN (${CASE_I})`,
  `UPDATE case_interventions SET superseded_by = NULL WHERE superseded_by IN (${CASE_I}) AND case_id != ?1`,
  `DELETE FROM attachments WHERE (owner_type = 'sos_case' AND owner_id = ?1) OR (owner_type = 'case_intervention' AND owner_id IN (${CASE_I}))`,
  `DELETE FROM journey_events WHERE (ref_table = 'sos_cases' AND ref_id = ?1) OR (ref_table = 'case_interventions' AND ref_id IN (${CASE_I}))`,
  `DELETE FROM notifications WHERE (entity_type = 'sos_case' AND entity_id = ?1) OR (entity_type = 'case_intervention' AND entity_id IN (${CASE_I}))`,
  `DELETE FROM case_interventions WHERE case_id = ?1`,
  `DELETE FROM case_issues WHERE case_id = ?1`,
  `DELETE FROM case_sources WHERE case_id = ?1`,
  `DELETE FROM case_milestones WHERE case_id = ?1`,
  `DELETE FROM sos_case_history WHERE case_id = ?1`,
  `DELETE FROM sos_cases WHERE id = ?1`,
];

/**
 * XOÁ CASE TẠO NHẦM (PR-LUI-a2, mockup mục 19; chủ sản phẩm 06/10 Q6) — chỉ Quản lý / Quản trị, chỉ Case báo tay, chưa PA nào có kết quả. Xoá hẳn
 * dòng ở mọi bảng trỏ Case; PA chưa làm đi theo; thẻ Chờ duyệt đang chờ tự đóng; nhật ký `case.delete` chụp Case + PA. Tệp xoá SAU khi chốt.
 */
export function xoaCase(p: Principal, caseId: number): { ok: true } {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id }, 'Chỉ Quản lý xoá được Case.');
  const chan = chanXoaCase(c);
  if (chan) throw badRequest(chan);
  const khoaTep: string[] = [];
  tx(() => {
    const pa = conn.prepare('SELECT * FROM case_interventions WHERE case_id = ?').all(caseId) as any[];
    for (const iv of pa) chotYeuCau(conn, { doiTuongLoai: 'intervention', doiTuongId: iv.id }, 'tu_dong', { lyDo: 'Case đã xoá' });
    chotYeuCau(conn, { doiTuongLoai: 'sos_case', doiTuongId: caseId }, 'tu_dong', { lyDo: 'Case đã xoá' });
    for (const r of conn.prepare(`SELECT url FROM attachments WHERE kind = 'file' AND ((owner_type = 'sos_case' AND owner_id = ?1)
        OR (owner_type = 'case_intervention' AND owner_id IN (${CASE_I})))`).all(caseId) as any[]) khoaTep.push(r.url);
    for (const sql of CAU_XOA_CASE) conn.prepare(sql).run(caseId);
    writeAudit({ actorUserId: p.userId, action: 'case.delete', entityType: 'sos_case', entityId: caseId, entityLabel: caseTitleOf(c),
      before: { case: c, pa, soTep: khoaTep.length } });
  });
  xoaTepSauGiaoDich(khoaTep);
  return { ok: true };
}

/**
 * OV-12c (chủ SP 14/10): HỆ THỐNG XOÁ HẲN Case SOS MT khi em đạt lại mà Case chưa có PA được xác nhận (`CASE_CHUA_DUNG` — không tệp, không kết
 * quả). Cùng bộ câu xoá với `xoaCase`; thẻ Chờ duyệt đang chờ tự đóng; nhật ký `case.xoa_overall_dat` chụp Case + PA. Chạy trong tx của nơi gọi.
 */
export function xoaCaseHeThong(conn: any, caseId: number, actor: number | null, lyDo: string, action = 'case.xoa_overall_dat') {
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) return;
  const pa = conn.prepare('SELECT * FROM case_interventions WHERE case_id = ?').all(caseId) as any[];
  for (const iv of pa) chotYeuCau(conn, { doiTuongLoai: 'intervention', doiTuongId: iv.id }, 'tu_dong', { lyDo });
  chotYeuCau(conn, { doiTuongLoai: 'sos_case', doiTuongId: caseId }, 'tu_dong', { lyDo });
  const ten = caseTitleOf(c);
  for (const sql of CAU_XOA_CASE) conn.prepare(sql).run(caseId);
  writeAudit({ actorUserId: actor, action, entityType: 'sos_case', entityId: caseId, entityLabel: ten, before: { case: c, pa }, after: { lyDo } });
}

/**
 * OV-13a (C, chủ SP 15/10): ai "Kết thúc PA" sớm PA theo quy chế — GVCN lớp em đang học hoặc Quản lý / Quản trị trong phạm vi (`CASE_APPROVE`).
 * GVBM không (GVBM vẫn ghi Kết quả / Kết quả cuối như cũ). Một hàm cho máy chủ (`ketThucPaQuyChe`) và cờ nút (`viewer.coTheKetThucPa`).
 */
function coTheKetThucPa(p: Principal, c: any): boolean {
  return laGvcnLopDangHoc(p, c.current_class_id) || can(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id });
}

/**
 * KẾT THÚC PA THEO QUY CHẾ SỚM (OV-13a C): PA quy chế ĐANG CHẠY (đã xác nhận) → khép `completed` / `ket_thuc_som` từ hôm nay, lý do bắt buộc ≥ 10 ký tự.
 * Nhật ký: mốc Case `ket_thuc_pa` (lý do + người) + hành trình + `case.intervention.complete`. Hết PA đang chạy → Case Hoàn thành được như mọi PA khép.
 */
export function ketThucPaQuyChe(p: Principal, interventionId: number, input: { lyDo?: unknown }) {
  const conn = db();
  const iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  const c = loadCase(iv.case_id);
  if (!coTheKetThucPa(p, c)) throw forbidden('Chỉ GVCN lớp em đang học hoặc Quản lý kết thúc sớm PA theo quy chế.');
  if (iv.preset !== 1 || laBoTro(iv)) throw badRequest('Chỉ PA theo quy chế có "Kết thúc PA" ở đây — PA khác kết thúc khi ghi Kết quả.');
  if (c.status === 'done') throw badRequest('Case đã hoàn thành — không còn PA để kết thúc.');
  chanPaChuaChay(iv, 'PA theo quy chế chưa được xác nhận — chưa chạy thì chưa có gì để kết thúc.');
  const lyDo = String(input?.lyDo ?? '').trim();
  if (lyDo.length < LY_DO_KET_THUC_PA_TOI_THIEU) throw loi(400, 'Ghi lý do kết thúc PA, ít nhất {n} ký tự.', { n: LY_DO_KET_THUC_PA_TOI_THIEU });
  if (lyDo.length > 500) throw badRequest('Lý do tối đa 500 ký tự.');
  const today = demoToday();
  const ten = (iv.description ?? '').trim() || (INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] ?? iv.kind);
  return tx(() => {
    /* OV-13b: PA gốc đang chờ đổi PA → thẻ tự đóng + PA mới huỷ, gỡ con trỏ (Duyệt / Huỷ / Từ chối sau đó không còn đụng PA đã kết thúc). */
    for (const y of conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND trang_thai = 'cho' AND json_extract(du_lieu, '$.thayPaId') = ?`)
      .all(interventionId) as any[]) {
      chotYeuCau(conn, { loai: 'de_xuat_pa', doiTuongLoai: 'intervention', doiTuongId: y.doi_tuong_id }, 'tu_dong', { nguoiDuyet: p.userId, lyDo: 'PA gốc đã kết thúc' });
      rutDoiPa(y);
    }
    conn.prepare(`UPDATE case_interventions SET status = 'completed', completed_date = ?, closed_reason = 'ket_thuc_som', updated_at = ? WHERE id = ?`)
      .run(today, nowIso(), interventionId);
    conn.prepare(`INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at) VALUES (?, 'ket_thuc_pa', ?, ?, ?, ?)`)
      .run(iv.case_id, today, `${ten} — ${lyDo}`, p.userId, nowIso());
    dongBoTrangThaiCase(iv.case_id);
    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id, eventType: 'intervention', eventDate: today, title: `Kết thúc PA: ${ten.slice(0, 60)}`, detail: lyDo,
      refTable: 'case_interventions', refId: interventionId, createdBy: p.userId, dedupKey: `pa-ket-thuc:${interventionId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.intervention.complete', entityType: 'case_intervention', entityId: interventionId, entityLabel: ten,
      before: { status: iv.status, followupDue: iv.followup_due ?? null }, after: { status: 'completed', closedReason: 'ket_thuc_som', lyDo },
    });
    return caseDetail(p, iv.case_id);
  });
}

/**
 * XOÁ PA (PR-LUI-a2, chủ sản phẩm 06/10 Q6) — chỉ Quản lý / Quản trị, kể cả PA đã ghi kết quả. Xoá PA + mọi kết quả tuần + lịch sử điều chỉnh + tệp;
 * thẻ Chờ duyệt đang chờ của PA tự đóng; nhật ký chụp PA + mọi kết quả. Hết PA → Case về "Mới mở". PA quy chế / Bổ trợ do hệ thống sinh: không xoá.
 */
export function xoaPa(p: Principal, interventionId: number): { ok: true; caseId: number } {
  const conn = db();
  const iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án');
  const c = loadCase(iv.case_id);
  require_(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id }, 'Chỉ Quản lý xoá được PA.');
  // ponytail: PA quy chế / Bổ trợ (máy sinh, gắn nhóm + Mini Test) chặn xoá — thêm đường riêng nếu chủ sản phẩm cần.
  if (iv.preset === 1 || (SYSTEM_KINDS as readonly string[]).includes(iv.kind)) throw badRequest('PA do hệ thống tạo — không xoá được.');
  if (c.status === 'done') throw badRequest('Case đã hoàn thành — Mở lại trước khi xoá PA.');
  const khoaTep: string[] = [];
  tx(() => {
    const ketQua = conn.prepare('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id').all(interventionId) as any[];
    goPaTrongTx(conn, iv, { lyDo: 'PA đã xoá' }, khoaTep);
    writeAudit({ actorUserId: p.userId, action: 'intervention.delete', entityType: 'case_intervention', entityId: interventionId,
      entityLabel: iv.description ?? iv.kind, before: { pa: iv, ketQua, soTep: khoaTep.length } });
  });
  xoaTepSauGiaoDich(khoaTep);
  return { ok: true, caseId: iv.case_id };
}

/** Gỡ MỘT PA trong giao dịch (Xoá PA · Hoàn tác thêm PA): thẻ Chờ duyệt đang chờ của PA tự đóng, xoá con → cha, Case đồng bộ (hết PA → "Mới mở"). */
function goPaTrongTx(conn: any, iv: any, the: { nguoiDuyet?: number; lyDo: string }, khoaTep: string[]): void {
  chotYeuCau(conn, { doiTuongLoai: 'intervention', doiTuongId: iv.id }, 'tu_dong', the);
  for (const r of conn.prepare(`SELECT url FROM attachments WHERE kind = 'file' AND owner_type = 'case_intervention' AND owner_id = ?`)
    .all(iv.id) as any[]) khoaTep.push(r.url);
  for (const sql of CAU_XOA_PA) conn.prepare(sql).run(iv.id);
  if (conn.prepare('SELECT 1 FROM case_interventions WHERE case_id = ? LIMIT 1').get(iv.case_id)) dongBoTrangThaiCase(iv.case_id);
  else conn.prepare(`UPDATE sos_cases SET status = 'open', updated_at = ? WHERE id = ?`).run(nowIso(), iv.case_id);
}

/**
 * HOÀN TÁC THÊM PA (SV-BAI-LOP-2, mockup `thiet-ke/v7/ho-so-hv.html` "✓ Vừa thêm · Hoàn tác") — chỉ NGƯỜI VỪA THÊM (còn quyền ghi PA của Case), trong
 * `HOAN_TAC_PA_MS` (+5 s mạng), khi PA chưa có kết quả và QL chưa trả lời đề xuất. Gỡ như Xoá PA (`goPaTrongTx`): thẻ Chờ duyệt đóng, mốc Hành trình mất,
 * Case về trạng thái trước. Nhật ký `intervention.undo_add` chụp PA. PA "Đề xuất PA khác" (thay PA gốc) rút ở thẻ, không qua đây. Trả Case.
 */
export function hoanTacThemPa(p: Principal, interventionId: number) {
  const conn = db();
  const iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án');
  const c = loadCase(iv.case_id);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c), 'Bạn không có quyền ghi nhận hỗ trợ cho Case này.');
  if (iv.recorded_by !== p.userId) throw forbidden('Chỉ người vừa thêm PA hoàn tác được — Quản lý dùng "Xoá PA".');
  if (iv.preset === 1 || (SYSTEM_KINDS as readonly string[]).includes(iv.kind)) throw badRequest('PA do hệ thống tạo — không hoàn tác được.');
  if (!duocHoanTacPa(iv.created_at, Date.now())) throw conflict('Đã quá thời gian hoàn tác.');
  const khoaTep: string[] = [];
  tx(() => {
    /* Kiểm trong giao dịch: kết quả / câu trả lời QL ghi chen giữa lúc kiểm và lúc gỡ không bị xoá theo. */
    if (conn.prepare('SELECT 1 FROM case_followups WHERE intervention_id = ? LIMIT 1').get(interventionId)) throw conflict('PA đã có kết quả — không hoàn tác được.');
    const tt = (conn.prepare('SELECT approval_state FROM case_interventions WHERE id = ?').get(interventionId) as any)?.approval_state;
    if (tt && tt !== 'pending') throw conflict('Quản lý đã trả lời đề xuất — không hoàn tác được.');
    if (conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND trang_thai = 'cho' AND doi_tuong_loai = 'intervention' AND doi_tuong_id = ?
        AND json_extract(du_lieu, '$.thayPaId') IS NOT NULL`).get(interventionId)) throw badRequest('PA đề xuất thay PA khác — rút ở thẻ Chờ duyệt.');
    goPaTrongTx(conn, iv, { nguoiDuyet: p.userId, lyDo: 'Giáo viên hoàn tác thêm PA' }, khoaTep);
    writeAudit({ actorUserId: p.userId, action: 'intervention.undo_add', entityType: 'case_intervention', entityId: interventionId,
      entityLabel: iv.description ?? iv.kind, before: { pa: iv }, after: null });
  });
  xoaTepSauGiaoDich(khoaTep);
  return caseDetail(p, iv.case_id);
}

/**
 * NHẬP BÙ MỘT CASE ĐÃ XỬ LÝ XONG TỪ LÂU (PR-C Task 3, mục 10.3–10.4).
 *
 * Ghi lại trí nhớ, không phải một sự kiện mới — nên gọi lại ĐÚNG BA hàm của đường thường
 * (`reportIssue` → `recordIntervention` × N → `closeCaseOutcome`) trong MỘT giao dịch, với
 * cờ `backfill: true` chảy suốt `reportIssue`/`recordIntervention`. Không viết đường ghi
 * database song song — trùng luật là cách sinh ra lỗi lệch giữa hai đường.
 *
 * `recordIntervention` tự nhận đủ `startedDate`/`completedDate`/`status: 'completed'` trong MỘT lần gọi — không cần bước "đã làm" riêng.
 */
export function backfillCase(p: Principal, input: {
  studentId: number; cycleId?: number | null;
  topic: string; primaryCode: string;
  title?: string | null; summary: string;
  /** Phân loại "Khác" (T13): chữ ô Ghi rõ — `reportIssue` kiểm ≥ 3 ký tự. */
  observation?: string | null;
  fromDate: string; toDate: string;
  actions: {
    description: string; performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
    fromDate: string; toDate: string;
    /** PR-SOS (YC-12.5.3): kết quả của PA nhập bù — bắt buộc, để hàng PA hiện kết quả thay "Chưa có kết quả". */
    ketQua?: string | null;
  }[];
  outcome: string; note: string;
  metrics?: unknown;
  /** Người dùng đã thấy cảnh báo trùng nhập bù (chốt 6) và xác nhận đây là lần khác. */
  confirmDuplicate?: boolean;
  /** PR-Dọn (Q3): khoá chống gửi đôi — một khoá cho mỗi lần mở form, như `/cases/report`. */
  idempotencyKey?: string;
}) {
  const conn = db();
  const today = demoToday();
  /*
   * PR-Dọn (Q1, quét #6): KIỂM QUYỀN TRƯỚC MỌI BƯỚC — câu kiểm trùng bên dưới trả tên + ngày Case của em; chạy trước khi kiểm quyền
   * thì GV gửi `studentId` của chi nhánh khác đọc được Case nhập bù của em đó. Cùng ngữ cảnh với `reportIssue` (lớp đang học).
   */
  const lopDangHoc = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
    .get(input.studentId) as any)?.class_id ?? null;
  require_(p, PERMISSIONS.SOS_REPORT, { classId: lopDangHoc, studentId: input.studentId },
    'Bạn chỉ báo được vấn đề của học viên trong phạm vi mình phụ trách.');
  if ((conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(input.studentId) as any)?.archived_at) throw badRequest(CAU_LUU_TRU);   // OV-11d (HV-3)
  const key = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() || null : null;
  if (!isIsoDate(input.fromDate) || !isIsoDate(input.toDate)) {
    throw badRequest('Khoảng ngày "từ → đến" không hợp lệ.');
  }
  if (input.fromDate > input.toDate) throw badRequest('Ngày bắt đầu phải trước ngày kết thúc.');
  if (input.toDate > today) throw badRequest('Không nhập bù được một Case kết thúc ở tương lai.');

  if (!Array.isArray(input.actions) || !input.actions.length) {
    throw badRequest('Ghi ít nhất một dòng "đã làm gì" — nhập bù mà không có việc gì đã làm thì không có gì để ghi.');
  }
  if (input.actions.length > 50) throw badRequest('Tối đa 50 dòng "đã làm gì" cho một Case nhập bù.');   // PR-Dọn (Q6, quét #16)
  for (const [i, a] of input.actions.entries()) {
    if (!(FOLLOWUP_OUTCOMES as readonly string[]).includes(String(a.ketQua ?? ''))) throw loi(400, 'Dòng PA {x}: chọn Kết quả PA.', { x: i + 1 });
    if (!isIsoDate(a.fromDate) || !isIsoDate(a.toDate)) throw badRequest('Một dòng "đã làm gì" có ngày không hợp lệ.');
    if (a.fromDate > a.toDate) throw badRequest('Một dòng "đã làm gì" có ngày bắt đầu sau ngày kết thúc.');
    if (a.toDate > today) throw badRequest('Không ghi được một việc đã xong ở ngày tương lai.');
    if ((chuTuDo(a.description, `Dòng PA ${i + 1}`, 2000) ?? '').length < 3) throw badRequest('Mỗi dòng "đã làm gì" phải nói rõ đã làm gì.');
    chuanHoaNguoiThucHien(p, a, { nhom: 'giao_vien', batBuoc: false });   // PR-PA (§8): Người dạy không bắt buộc
  }
  const note = chuTuDo(input.note, 'Kết luận', 2000) ?? '';   // PR-Dọn (Q4, quét #24)
  /*
   * GHI CHÚ KẾT LUẬN BẮT BUỘC — "ngày quá khứ không tự chứng minh hiệu quả" (mục 2 sổ audio).
   * Giao diện đã chặn dưới 10 ký tự, nhưng chặn TAY ở đây nữa: đây là API thật, gọi thẳng
   * (không qua form) mà thiếu ghi chú thì lỗ đúng thứ tính năng này sinh ra để chặn.
   */
  if (note.length < 10) {
    throw badRequest('Nhập bù phải có ghi chú kết luận — ít nhất 10 ký tự.');
  }
  /*
   * CASE-03: nhập bù không có lối thoát "Chưa đủ dữ liệu" — bộ `CASE_OUTCOMES` dùng lại ở
   * đây vốn đã không có mức đó (nó chỉ tồn tại ở `FOLLOWUP_OUTCOMES`, cho MỘT lần xem lại
   * giữa chừng chứ không phải kết luận cuối của cả Case), nên không cần chặn tay thêm.
   */
  if (!(CASE_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Mức độ thành công không hợp lệ.');
  }

  const category = categoryOf((input.topic ?? '').trim() || null);

  return tx(() => {
    /* PR-Dọn (Q3, quét #25): gửi lại cùng khoá → trả Case đã tạo. Kiểm TRONG giao dịch (BEGIN IMMEDIATE) để hai lần gửi sát nhau không cùng lọt. */
    const daCo = caseDaCoTheoKhoa(key);
    if (daCo) return caseDetail(p, daCo);
    /*
     * CHỐT 6 (mục 10.4): KHÔNG kích hoạt cảnh báo Case trùng như đường thường (đường thường
     * chặn khi hạng mục đã có Case đang mở — Case nhập bù đã đóng ngay khi tạo nên không đụng
     * luật đó). NHƯNG phải cảnh báo khi trùng với MỘT CASE NHẬP BÙ KHÁC cùng khoảng thời gian
     * — đó mới thật sự là nhập hai lần cùng một chuyện.
     */
    if (category && !input.confirmDuplicate) {
      const overlap = conn
        .prepare(
          `SELECT id, title, detected_at, closed_at FROM sos_cases
            WHERE student_id = ? AND category = ? AND origin_kind = 'backfill'
              AND NOT (closed_at < ? OR detected_at > ?)
            LIMIT 1`,
        )
        .get(input.studentId, category, input.fromDate, input.toDate) as any;
      if (overlap) {
        throw badRequest(
          `Học viên này đã có một Case nhập bù "${overlap.title ?? caseCategoryLabel(category)}" `
          + `trùng khoảng ${tuanLich(overlap.detected_at, demoToday())} → ${tuanLich(overlap.closed_at, demoToday())} — có phải cùng một lần không?`,
          { duplicateBackfill: { id: overlap.id, title: overlap.title, from: overlap.detected_at, to: overlap.closed_at } },
        );
      }
    }

    const created = reportIssue(p, {
      studentId: input.studentId, cycleId: input.cycleId,
      topic: input.topic, primaryCode: input.primaryCode,
      title: input.title, summary: input.summary, observation: input.observation ?? null,
      detectedAt: input.fromDate,
      parallel: true,
      backfill: true,
      idempotencyKey: key ?? undefined,
    }) as any;

    for (const a of input.actions) {
      recordIntervention(p, created.id, {
        kind: 'other', description: a.description,
        performerSelf: a.performerSelf, performerUserId: a.performerUserId, performerName: a.performerName,
        status: 'completed', startedDate: a.fromDate, completedDate: a.toDate,
        backfill: true,
      });
      /* YC-12.5.3: kết quả PA nhập bù = một dòng theo dõi (next_step 'complete') — bảng kỹ năng / Ngăn Case đọc kết quả ở đây. */
      const ivId = (conn.prepare('SELECT id FROM case_interventions WHERE case_id = ? ORDER BY id DESC LIMIT 1').get(created.id) as any).id;
      conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id, outcome, note, next_step, cycle_no, late, created_at)
                    VALUES (?,?,?,?,?, 'Nhập bù', 'complete', 1, 0, ?)`).run(created.id, ivId, a.toDate, p.userId, a.ketQua, nowIso());
    }

    const closed = closeCaseOutcome(p, created.id, {
      outcome: input.outcome, note, closedOn: input.toDate, metrics: input.metrics,
    });
    writeAudit({ actorUserId: p.userId, action: 'case.backfill.done', entityType: 'sos_case',
      entityId: created.id, entityLabel: input.title ?? input.summary.slice(0, 40),
      after: { from: input.fromDate, to: input.toDate, actions: input.actions.length } });
    return closed;
  });
}

/**
 * Ghi một lần XEM LẠI. Gắn với một tác động, hoặc gắn thẳng vào Case khi chỉ đang theo dõi.
 *
 * `outcome` là quan sát, KHÔNG phải khẳng định tác động gây ra thay đổi. Vì vậy điểm tăng
 * cũng không tự đóng Case — người có quyền mới quyết định.
 */
export function recordFollowUp(p: Principal, caseId: number, input: {
  interventionId?: number | null; observedOn?: string | null;
  outcome?: string | null; note?: string | null; evidenceAttemptId?: number | null;
  /** PR-GVa (F01 = D13): mã của MỘT lần mở form — gửi lại cùng mã không ghi lần xem lại thứ hai. */
  idempotencyKey?: string | null;
}) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền ghi nhận theo dõi cho Case này.');
  const observedOn = input.observedOn ?? demoToday();
  if (!isIsoDate(observedOn)) throw badRequest('Ngày quan sát không hợp lệ.');
  if (input.outcome && !(FOLLOWUP_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Kết quả quan sát không hợp lệ.');
  }
  if (input.interventionId) {
    const iv = conn.prepare('SELECT case_id, preset, confirmed_at FROM case_interventions WHERE id = ?').get(input.interventionId) as any;
    if (!iv || iv.case_id !== caseId) throw badRequest('Tác động không thuộc Case này.');
    if (iv.preset === 1 && !iv.confirmed_at) {
      throw badRequest('Phương án điền sẵn này chưa được xác nhận — xác nhận (hoặc sửa / thay) trước khi ghi theo dõi.');
    }
  }
  // Bằng chứng phải là bài của CHÍNH học viên đó — không gắn nhầm sang em khác.
  if (input.evidenceAttemptId) {
    const a = conn.prepare('SELECT student_id FROM assessment_attempts WHERE id = ?').get(input.evidenceAttemptId) as any;
    if (!a || a.student_id !== c.eff_student_id) throw badRequest('Bằng chứng không thuộc học viên này.');
  }

  /* PR-GVa (F01 = D13): gửi lại CÙNG khoá của lần mở form → trả Case với lần xem lại đã ghi. Kiểm quyền / dữ liệu ở trên chạy TRƯỚC. */
  const khoa = chuanKhoaGui(input.idempotencyKey);
  const taoMoi = () => tx(() => {
    if (theoKhoaGui('case_followups', 'observer_user_id', p.userId, khoa)) return caseDetail(p, caseId);
    const info = conn
      .prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                     outcome, note, evidence_attempt_id, created_at, idempotency_key)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(caseId, input.interventionId ?? null, observedOn, p.userId,
           input.outcome ?? null, input.note ?? null, input.evidenceAttemptId ?? null, nowIso(), khoa);
    const id = Number(info.lastInsertRowid);
    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: 'followup', eventDate: observedOn,
      title: `Xem lại sau hỗ trợ${input.outcome ? `: ${input.outcome}` : ''}`,
      detail: input.note ?? null,
      refTable: 'case_followups', refId: id, createdBy: p.userId,
      dedupKey: `followup:${id}`,
    });
    return caseDetail(p, caseId);
  });
  try { return taoMoi(); }
  catch (e) {
    if (laTrungKhoa(e) && theoKhoaGui('case_followups', 'observer_user_id', p.userId, khoa)) return caseDetail(p, caseId);
    throw e;
  }
}

// ---------------------------------------------------------------- vòng đời

/**
 * Đổi hướng xử lý và/hoặc đóng case.
 *
 * ĐÓNG CASE BẮT BUỘC CÓ HƯỚNG XỬ LÝ. Không có thì không biết Case kết thúc vì đã giải quyết
 * hay vì bị bỏ quên. Quyền đóng: GVCN của lớp và Quản lý trong phạm vi.
 */
export function setDisposition(p: Principal, caseId: number, input: {
  disposition?: string | null; note?: string | null; status?: string | null;
  /**
   * Ghi chi tiết theo kỹ năng khi kết luận Case (mục 7.7 [5] Option 2) — TUỲ CHỌN.
   * Mặc định chỉ cần ghi chú ngắn; ai muốn ghi kỹ thì ghi thêm điểm mình tự chấm.
   */
  metrics?: unknown;
}) {
  const conn = db();
  const c = loadCase(caseId);
  const closing = input.status === 'done';
  const metrics = normalizeMetrics(input.metrics);

  if (closing) {
    if (!canCloseCase(p, c)) {
      throw forbidden('Chỉ Quản lý, giáo viên dạy đúng môn của Case, hoặc GVCN (Case Ý thức) mới hoàn thành được Case này.');
    }
    const disposition = input.disposition ?? c.disposition;
    if (!disposition) {
      throw badRequest('Hoàn thành Case thì phải chọn hướng xử lý — để biết Case kết thúc vì đã giải quyết hay bị bỏ quên.');
    }
    /*
     * CHỈ ĐÓNG ĐƯỢC KHI MỌI PHƯƠNG ÁN ĐÃ KHÉP LẠI (mục 7.7 [5]).
     *
     * Và một Case CHƯA CÓ PHƯƠNG ÁN NÀO cũng không đủ điều kiện: đếm được "0 phương án còn
     * mở" không có nghĩa là đã làm gì cho em. Thông báo NÓI RÕ còn thiếu gì, thay vì chỉ
     * làm mờ một cái nút và để người dùng tự đoán.
     */
    const blockers = closeBlockers(caseId);
    if (blockers.length) {
      throw loi(400, 'Chưa hoàn thành Case được. {lyDo}', { lyDo: blockers.join(' ') });
    }
    if (disposition === 'monitor') {
      throw badRequest('"Chỉ theo dõi thêm" nghĩa là Case còn mở. Chọn hướng khác nếu muốn đóng.');
    }
  } else {
    require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
      'Bạn không có quyền cập nhật Case này.');
  }
  if (input.disposition && !(DISPOSITIONS as readonly string[]).includes(input.disposition)) {
    throw badRequest('Hướng xử lý không hợp lệ.');
  }

  return tx(() => {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (input.disposition !== undefined) { sets.push('disposition = ?'); params.push(input.disposition); }
    if (input.note !== undefined) { sets.push('disposition_note = ?'); params.push(input.note); }
    if (input.status) {
      sets.push('status = ?'); params.push(input.status);
      if (closing) {
        sets.push('closed_by = ?', 'closed_at = ?');
        params.push(p.userId, nowIso());
      } else {
        sets.push('closed_by = NULL', 'closed_at = NULL');
      }
    }
    if (!sets.length && !metrics) return caseDetail(p, caseId);
    if (sets.length) {
      sets.push('updated_at = ?'); params.push(nowIso(), caseId);
      conn.prepare(`UPDATE sos_cases SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    }

    /*
     * ĐIỂM KẾT LUẬN ghi thành một dòng cập nhật gắn thẳng vào Case, không gắn vào phương án
     * nào — vì nó là kết luận của CẢ Case, không phải kết quả của một vòng hỗ trợ. Nhờ vậy
     * biểu đồ tiến bộ chỉ phải đọc một chỗ duy nhất để lấy mọi điểm cô tự chấm.
     */
    if (metrics) {
      conn
        .prepare(
          `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                       note, metrics, created_at)
           VALUES (?, NULL, ?, ?, ?, ?, ?)`,
        )
        .run(caseId, demoToday(), p.userId, input.note ?? null, JSON.stringify(metrics), nowIso());
    }

    conn
      .prepare(
        `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
         VALUES (?, 'disposition', ?, ?, ?, ?)`,
      )
      .run(caseId, c.disposition ?? null, input.disposition ?? c.disposition ?? null, p.userId, nowIso());

    if (closing) {
      addJourney({
        studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
        eventType: 'case_closed', eventDate: demoToday(),
        title: 'Kết thúc theo dõi vấn đề',
        detail: input.note ?? null,
        refTable: 'sos_cases', refId: caseId, createdBy: p.userId,
        dedupKey: `case_closed:${caseId}:${nowIso().slice(0, 10)}`,
      });
    }
    const quaGv = closing && dongQuaGv(p, c);
    writeAudit({ actorUserId: p.userId, action: closing ? 'case.close' : 'case.disposition',
      entityType: 'sos_case', entityId: caseId, entityLabel: `Case ${caseId}`,
      before: { status: c.status, disposition: c.disposition },
      after: { status: input.status ?? c.status, disposition: input.disposition ?? c.disposition, ...(closing ? { via: quaGv ? 'gv' : 'quan_ly' } : {}) } });
    if (quaGv) baoQuanLyCaseDong(p, caseId, c);
    return caseDetail(p, caseId);
  });
}

// ---------------------------------------------------------------- đọc

/**
 * PR-VAI-b (T65, Q11): ngày Tạm dừng gần nhất khi em ĐANG Tạm dừng (`students.status = 'inactive'`), không thì null — giao diện thay "Quá hạn"
 * bằng nhãn vàng "Tạm dừng từ dd/mm". Chỉ đổi chữ: luật số liệu đã lọc em Tạm dừng. Một câu, chỉ khi em đang dừng.
 */
function tamDungTuCua(student: { id: number; status: string } | null | undefined): string | null {
  if (!student || student.status !== 'inactive') return null;
  return khoangTamDung([student.id])[student.id]?.find((k) => k.den === null)?.tu ?? null;
}

/** Quyền XEM một Case (đường `GET /cases/:id`) — P14 DICH dùng lại đúng hàm này cho chữ của Case / PA / kết quả PA. */
export function kiemXemCase(p: Principal, caseId: number) {
  const conn = db();
  const c = loadCase(caseId);
  /* PR-PA (§8): người giữ việc Kết quả của một PA trong Case xem được Case (vd. chủ Case khi lớp mới chưa phân công môn). */
  const ivCuaCase = conn.prepare('SELECT id, nhom_bo_tro, status, closed_reason FROM case_interventions WHERE case_id = ?').all(caseId) as any[];
  const giu = giuCuaCase(c, ivCuaCase);
  /* Chỉ PA đang chạy mở quyền xem — PA đã khép / huỷ thì người giữ việc (vd. chủ Case dự phòng) không còn việc ở đây. */
  if (!ivCuaCase.some((iv) => (iv.status === 'planned' || iv.status === 'started') && giu.get(iv.id) === p.userId)) {
    require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: c.class_id, studentId: c.eff_student_id }, 'Case này nằm ngoài phạm vi bạn được xem.');
  }
  return { c, ivCuaCase, giu };
}

export function caseDetail(p: Principal, caseId: number) {
  const conn = db();
  const { c, ivCuaCase, giu } = kiemXemCase(p, caseId);
  dienMocQuyChe({ caseIds: [caseId] });   // PR-SOS K3-14: mốc quy chế còn trống — có lịch rồi thì điền

  const student = conn
    .prepare('SELECT id, student_code, full_name, status, parent_name, parent_relation, parent_phone FROM students WHERE id = ?')
    .get(c.eff_student_id) as any;
  const cycle = c.eff_cycle_id
    ? conn.prepare('SELECT id, seq, route, target_score, exam_month, exam_period_id, programme_code FROM learning_cycles WHERE id = ?')
        .get(c.eff_cycle_id) as any
    : null;

  const issues = (conn
    .prepare(
      `SELECT i.*, u.full_name AS by_name FROM case_issues i
         LEFT JOIN users u ON u.id = i.created_by WHERE i.case_id = ? ORDER BY
         CASE i.role WHEN 'primary' THEN 0 WHEN 'secondary' THEN 1 ELSE 2 END, i.id`,
    )
    .all(caseId) as any[])
    .map((i) => ({
      id: i.id, role: i.role, code: i.taxonomy_code, label: issueLabel(i.taxonomy_code),
      branch: issueBranchOf(i.taxonomy_code), skill: i.skill, observation: i.observation,
      byName: i.by_name ?? null,
    }));
  /* OV-13k: Case MT Speaking — nguyên nhân = nhận xét người chấm + "Nhận xét GV phụ trách" (đọc sống từ ô, lưu riêng) + nhóm. */
  const nxPhuTrach = c.topic === 'speaking' && c.attempt_id
    ? (conn.prepare(`SELECT nhan_xet_phu_trach FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).get(c.attempt_id) as any)?.nhan_xet_phu_trach ?? null
    : null;
  if (nxPhuTrach) { const chinh = issues.find((i) => i.role === 'primary'); if (chinh) (chinh as any).nhanXetPhuTrach = nxPhuTrach; }
  /* SV-NX-CASE (N8 ②): mô tả đang đi theo nhận xét của bài nào (`moTaTuMt` "MT2") — null = người sửa riêng / chưa có. */
  const chinhMt = issues.find((i) => i.role === 'primary');
  /* Lượt nguồn đã bị xoá (hoàn tác lộ trình…) → coi như không nguồn: không hiện "MT?" (đồng bộ cũng bỏ qua — ô không còn nhận xét). */
  const luotNguon = chinhMt && chinhMt.byName == null && c.mo_ta_attempt_id
    ? conn.prepare('SELECT attempt_no FROM assessment_attempts WHERE id = ?').get(c.mo_ta_attempt_id) as any : null;
  if (luotNguon) {
    (chinhMt as any).moTaTuMt = `MT${luotNguon.attempt_no}`;
    (chinhMt as any).moTaTuAttemptId = c.mo_ta_attempt_id;
  }
  /* SV-NX-CASE (N8 ③): nhận xét Speaking chấm chéo đang chờ GV phụ trách xác nhận Case — panel hiện sẵn nhận xét + ba lựa chọn (`xacNhanCaseS`). */
  const oS = c.topic === 'speaking' && c.attempt_kind === 'mock' && c.status !== 'done' && !c.tam
    ? conn.prepare(`SELECT s.comment, s.cho_phu_trach_xem, COALESCE(u.full_name, s.examiner_name) AS nguoi_cham FROM assessment_scores s
        LEFT JOIN users u ON u.id = s.examiner_user_id WHERE s.attempt_id = ? AND s.skill = 'speaking'`).get(c.attempt_id) as any : null;
  const choXacNhanS = oS?.cho_phu_trach_xem
    ? { nhanXet: (oS.comment ?? null) as string | null, nguoiCham: (oS.nguoi_cham ?? null) as string | null, luot: `MT${c.attempt_no}`, han: (c.han_xac_nhan ?? null) as string | null,
        coTheXacNhan: quyenPhuTrachS(p, c.attempt_class_id ?? null) }
    : null;
  /* OV-12c (P5): Case MT — nguyên nhân theo TỪNG lượt (mốc mở / trượt lại ↔ nhận xét + nhóm của ô lượt đó, đọc sống từ ô): "MT1: … · MT2: …". */
  const nguyenNhanTheoLuot = (conn.prepare(
    `SELECT a.id AS attempt_id, a.attempt_no, s.comment, s.nhom_nguyen_nhan, s.nhan_xet_phu_trach FROM case_milestones m
       JOIN assessment_attempts a ON a.id = m.attempt_id AND a.kind = 'mock'
       LEFT JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = ?
      WHERE m.case_id = ? AND m.kind IN ('opened', 'repeat') GROUP BY a.id ORDER BY MIN(m.id)`,
  ).all(c.topic ?? '', caseId) as any[]).map((r) => ({
    attemptId: r.attempt_id as number, luot: `MT${r.attempt_no}`, nhanXet: (r.comment ?? null) as string | null,
    nhanXetPhuTrach: (r.nhan_xet_phu_trach ?? null) as string | null,
    nhom: docNhomNguyenNhan(r.nhom_nguyen_nhan).map((code) => ({ code, label: issueLabel(code) })),
  }));

  /* PR-S2 (S2): lịch sử điều chỉnh của mọi PA trong Case, một truy vấn. */
  const revs = lichSuDieuChinhCuaCase(caseId);
  /* PR-DUYET (Task 5, 9): thẻ hộp Chờ duyệt của mọi PA trong Case — một câu cho cả Case. */
  const theCuaPa = theCuaDoiTuong('intervention', ivCuaCase.map((r) => r.id as number));
  const mtKeCua = mtKeTheoPa(caseId);
  /* PR-PA (§8): PA web tạo — 'ky_vong' = PA Tutor đầu tiên của Case "Kỳ vọng đầu ra…" (Chuyển cấp; `preset 0`, người ghi là Quản lý bấm Lưu);
     'he_thong' = PA quy chế / Bổ trợ / không người ghi; null = PA người tạo tay. */
  const kyVong = c.origin_kind === 'chuyen_cap' && String(c.title ?? '').startsWith('Kỳ vọng đầu ra');
  const paDau = Math.min(...ivCuaCase.map((r) => r.id as number));
  const nguonTaoPa = (iv: any): 'ky_vong' | 'he_thong' | null =>
    kyVong && iv.kind === 'tutor' && iv.id === paDau ? 'ky_vong'
      : iv.preset === 1 || iv.kind === 'bo_tro' || iv.kind === 'bo_tro_mien_phi' || !iv.recorded_by ? 'he_thong' : null;
  /* PR-PA (§8): Đã dạy của mọi PA trong Case — một câu. */
  const daDayTheoPa = new Map((conn.prepare('SELECT intervention_id i, COALESCE(SUM(so_buoi), 0) n FROM case_followups WHERE case_id = ? GROUP BY intervention_id')
    .all(caseId) as any[]).map((r) => [r.i as number, Number(r.n)]));
  /* OV-13b: thẻ "Đề xuất PA khác" mới nhất của mỗi PA gốc (đối tượng thẻ = PA mới, cùng Case) — một câu. */
  const doiPaCua = new Map<number, any>();
  const paMoiDoi = new Set<number>();
  for (const y of conn.prepare(`SELECT y.*, iv.kind AS kind_moi FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id
      WHERE y.loai = 'de_xuat_pa' AND y.doi_tuong_loai = 'intervention' AND iv.case_id = ? AND json_extract(y.du_lieu, '$.thayPaId') IS NOT NULL
      ORDER BY y.id DESC`).all(caseId) as any[]) {
    const d = duLieuDoiPa(y)!;
    paMoiDoi.add(y.doi_tuong_id);
    if (!doiPaCua.has(d.thayPaId)) doiPaCua.set(d.thayPaId, y);
  }

  const interventions = (conn
    .prepare(
      `SELECT iv.*, u.full_name AS performer_account, r.full_name AS recorder_name,
              ap.full_name AS approver_name
         FROM case_interventions iv
         LEFT JOIN users u ON u.id = iv.performer_user_id
         LEFT JOIN users r ON r.id = iv.recorded_by
         LEFT JOIN users ap ON ap.id = iv.approval_by
        WHERE iv.case_id = ? ORDER BY
          COALESCE(iv.completed_date, iv.started_date, iv.planned_date, iv.created_at), iv.id`,
    )
    .all(caseId) as any[]).map((iv) => ({
      id: iv.id, kind: iv.kind, description: iv.description, status: iv.status,
      /** PR-PA (§8): Số buổi của PA (null = không đếm) và Đã dạy (tổng Số buổi tuần này). */
      soBuoi: (iv.so_buoi ?? null) as number | null,
      daDay: daDayTheoPa.get(iv.id) ?? 0,
      /** PR-PA (§8): người xem ghi được Kết quả của PA này — quyền theo vai trò hoặc là người giữ việc. */
      ghiDuoc: giu.get(iv.id) === p.userId || quyenPaTheoVaiTro(p, iv, c),
      performer: iv.performer_account ?? iv.performer_name ?? null,
      /** Tài khoản người làm hiện tại — panel Điều chỉnh lấy làm giá trị đầu (PR-UX3 Q15); null khi người làm ngoài hệ thống. */
      performerUserId: iv.performer_user_id ?? null,
      // Người ghi khác người làm thì nói rõ, để không đọc nhầm ai đã làm việc đó.
      recordedBy: iv.recorder_name ?? null,
      /** PR-PA (§8): ngày tạo + nguồn PA web tạo — dòng "Web tạo … · 06/10" của Sửa PA, dòng "Tạo" của Nhật ký PA. */
      createdAt: (iv.created_at ?? null) as string | null,
      nguonTao: nguonTaoPa(iv),
      byProxy: !iv.performer_user_id && !!iv.performer_name,
      plannedDate: iv.planned_date, startedDate: iv.started_date, completedDate: iv.completed_date,
      /** NGÀY DỰ KIẾN KẾT THÚC phương án (mục 8.2) — khác hạn cập nhật hằng tuần ở dưới. */
      followupDue: iv.followup_due,
      /** Lùi lịch thi thì lùi cái gì: kế hoạch thi thật, hay một phần thi trong đợt MT. */
      rescheduleTarget: iv.reschedule_target ?? null,
      /*
       * CHU KỲ XỬ LÝ. `cycleNo` là vòng thứ mấy của CHÍNH phương án này — "đã ba vòng mà
       * vẫn chưa chuyển" là một câu khác hẳn "một cái hạn bị đẩy lùi ba lần".
       */
      cycleNo: iv.cycle_no ?? 1,
      cycleStartedOn: iv.cycle_started_on ?? null,
      /** Khép lại VÌ SAO: `done` đã xong · `superseded` bị thay bằng phương án khác. */
      closedReason: iv.closed_reason ?? null,
      supersededBy: iv.superseded_by ?? null,
      /* HẠN của chu kỳ đang chạy — hai tuần với Case học thuật, một tuần với Ý thức/Khác. */
      actionDue: iv.action_due ?? null,
      /* CV-LOI (CV-14): PA bổ trợ miễn phí còn chờ Mini Test — hạn của việc là hạn Mini Test (cùng `mini_test.han` của dòng Công việc). */
      miniTestHan: iv.kind === 'bo_tro_mien_phi' && iv.nhom_bo_tro != null
        ? ((conn.prepare('SELECT MIN(han) AS han FROM mini_test WHERE nhom_bo_tro = ? AND ty_le IS NULL').get(iv.nhom_bo_tro) as any)?.han ?? null) as string | null
        : null,
      actionOverdue: !!iv.action_due && iv.action_due < demoToday()
        && (iv.status === 'planned' || iv.status === 'started')
        && (iv.approval_state ?? '') !== 'pending',
      /*
       * Quá hạn XEM LẠI: có hẹn, tới ngày mà chưa ai ghi kết quả.
       * Trước đây còn đòi `status !== 'completed'` — sai, vì làm xong rồi mới đúng là lúc
       * phải xem lại; điều kiện đó khiến gần như không việc nào bị coi là quá hạn.
       */
      overdue: !!iv.followup_due && iv.followup_due < demoToday() && iv.status !== 'cancelled'
        && !(iv.preset === 1 && !iv.confirmed_at)         // gợi ý điền sẵn chưa xác nhận không có nghĩa vụ xem lại (Q-V3-3)
        && !conn
          .prepare('SELECT 1 FROM case_followups WHERE intervention_id = ? AND cycle_no = ?')
          .get(iv.id, iv.cycle_no ?? 1),
      // NULL = không cần duyệt, khác hẳn 'pending' = đang chờ Quản lý trả lời.
      needsApproval: !!iv.needs_approval,
      /** PA theo quy chế SOS. `awaitingConfirmation` = "Chờ xác nhận" (Q28-3, Q3): chạy khi GVBM bấm Xác nhận PA. */
      preset: iv.preset === 1,
      confirmedAt: (iv.confirmed_at ?? null) as string | null,
      /* PR-LT2a → PR-CT2: PA Bổ trợ KHÔNG có bước Xác nhận PA — chờ Xác nhận Case (`chuaChay`), không phải "Chờ xác nhận". */
      awaitingConfirmation: iv.kind !== 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned' && !choDoiPa(iv),
      chuaChay: iv.kind === 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned',
      /** PR-SOS (T22, T63): PA bắt buộc — không thay, không kết thúc sớm; `mocChu` chữ mốc; `lanCuoi` = lần ghi tới là "Ghi kết quả cuối". */
      batBuoc: iv.preset === 1,
      mocQuyChe: (iv.moc_quy_che ?? null) as string | null,
      mocChu: iv.preset === 1
        ? mocChuPa({ span: iv.moc_quy_che ?? null, followupDue: iv.followup_due ?? null, mtKe: mtKeCua(iv), daXacNhan: !!iv.confirmed_at, mtCuoi: iv.moc_quy_che === 'until_exam' ? mtCuoiNho(c.cycle_id) : null }, demoToday())
        : null,
      lanCuoi: iv.status === 'started' && laLanGhiCuoi({ preset: iv.preset === 1, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null, mienPhi: iv.kind === 'bo_tro_mien_phi' }, demoToday()),
      approvalState: iv.approval_state as string | null,
      approvalDue: iv.approval_due as string | null,
      approvalNote: iv.approval_note as string | null,
      approvedBy: iv.approver_name ?? null,
      approvalAt: iv.approval_at as string | null,
      /** PR-S2 (S2): mỗi lần sửa nội dung PA, cũ trước mới sau. Hàng chính luôn là bản hiện tại. */
      revisions: revs.get(iv.id) ?? [],
      /** PR-DUYET: thẻ ĐANG CHỜ mới nhất của PA (Đề xuất PA / Xin ý kiến) — Ngăn Case nhúng `TheYeuCau` khi người xem duyệt được. */
      yeuCau: theCuaPa.find((y) => y.doiTuongId === iv.id && y.trangThai === 'cho') ?? null,
      /** OV-13b: đề xuất đổi PA mới nhất của PA gốc này — "chờ" (Rút được bởi người gửi) / "tu_choi" (kèm lý do; "Đề xuất lại"). */
      doiPa: (() => {
        const y = doiPaCua.get(iv.id);
        if (!y || (y.trang_thai !== 'cho' && y.trang_thai !== 'tu_choi')) return null;
        if (y.trang_thai === 'tu_choi' && iv.confirmed_at && iv.confirmed_at > (y.xu_ly_luc ?? '')) return null;   // đã xác nhận PA gốc sau khi bị từ chối
        return { yeuCauId: y.id as number, trangThai: y.trang_thai as 'cho' | 'tu_choi', paMoiId: y.doi_tuong_id as number, loaiMoi: y.kind_moi as string,
          guiLuc: y.tao_luc as string, hanDuyet: (y.han_duyet ?? null) as string | null, lyDoTuChoi: (y.ly_do_tu_choi ?? null) as string | null,
          lyDo: duLieuDoiPa(y)!.lyDo, laNguoiGui: y.nguoi_xin === p.userId };
      })(),
      /** OV-13b: PA mới của một đề xuất đổi PA — dòng PA gốc đã nói nó; danh sách PA ẩn khi còn chờ / bị từ chối. */
      laPaDoi: paMoiDoi.has(iv.id),
      /** PR-DUYET (T64): lần Xin ý kiến mới nhất của PA (chờ hoặc đã trả lời) — dòng tím dưới PA. */
      xinYKien: theCuaPa.find((y) => y.doiTuongId === iv.id && y.loai === 'xin_y_kien' && y.trangThai !== 'tu_dong') ?? null,
    }));

  const dongFu = conn
    .prepare(
      `SELECT f.*, u.full_name AS observer_name, pt.full_name AS phu_trach_account FROM case_followups f
         LEFT JOIN users u ON u.id = f.observer_user_id LEFT JOIN users pt ON pt.id = f.phu_trach_user_id
        WHERE f.case_id = ? ORDER BY f.observed_on DESC, f.id DESC`,
    )
    .all(caseId) as any[];
  /* OV-7b: "Sửa" — lần ghi Kết quả mới nhất của mỗi PA / lần Xem lại mới nhất của Case; người đã ghi + Quản lý; Case chưa hoàn thành. */
  const quanLyCase = can(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id });
  const khoaSua = (f: any) => (f.next_step ? `pa:${f.intervention_id}` : f.metrics ? null : 'xem-lai');   // dòng điểm tự chấm lúc kết luận: không sửa
  /* PA còn đúng trạng thái lần ghi để lại (cùng luật `nguCanhSuaKetQua`) — PA khép bằng đường khác (Mini Test ở hồ sơ, dữ liệu cũ) thì không hiện nút. */
  const paCua = new Map(ivCuaCase.map((r) => [r.id as number, r]));
  const khopPa = (f: any) => !f.next_step || paKhopLanGhi(f.next_step, paCua.get(f.intervention_id));
  const moiNhat = new Map<string | null, number>();
  for (const f of dongFu) moiNhat.set(khoaSua(f), Math.max(moiNhat.get(khoaSua(f)) ?? 0, f.id));
  /* OV-12h: dòng buổi Tutor của mọi lần ghi của Case — một câu. */
  const buoiCua = new Map<number, BuoiTutor[]>();
  for (const b of conn.prepare(`SELECT b.followup_id, ${COT_BUOI} FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
      WHERE f.case_id = ? ORDER BY b.followup_id, b.buoi_so`).all(caseId) as any[]) {
    buoiCua.set(b.followup_id, [...(buoiCua.get(b.followup_id) ?? []), buoiTuDong(b)]);
  }
  const followups = dongFu.map((f) => ({
      id: f.id, interventionId: f.intervention_id, observedOn: f.observed_on,
      observerName: f.observer_name ?? null, outcome: f.outcome, note: f.note,
      evidenceAttemptId: f.evidence_attempt_id,
      nextStep: f.next_step ?? null, cycleNo: f.cycle_no ?? null,
      cycleDue: f.cycle_due ?? null, late: !!f.late,
      /* Điểm cô tự chấm kèm lần cập nhật này — KHÔNG phải điểm chính thức. */
      metrics: parseMetrics(f.metrics),
      /* PR-S2 (S4): vấn đề còn tồn, và lý do (Điều chỉnh/Thay) hoặc ghi chú của quyết định. */
      remainingIssue: (f.remaining_issue ?? null) as string | null,
      decisionNote: (f.decision_note ?? null) as string | null,
      /* PR-PA (§8): Người dạy tuần này (cột cũ `phu_trach_*` — PR-LUI-a2) + Số buổi tuần này. Dòng cũ null. */
      nguoiDay: (f.phu_trach_account ?? f.phu_trach_ten ?? null) as string | null,
      soBuoi: (f.so_buoi ?? null) as number | null,
      /** OV-12h: buổi Tutor (tên · nhận xét), theo thứ tự buổi; lần ghi cũ / loại khác: []. */
      buoi: buoiCua.get(f.id) ?? [],
      suaDuoc: c.status !== 'done' && (f.observer_user_id === p.userId || quanLyCase)
        && khoaSua(f) !== null && moiNhat.get(khoaSua(f)) === f.id && khopPa(f),
    }));

  /* PR-DEPLOY (0b-3): chương trình GỐC của Case (lúc mở) trước, rồi mới tới chương trình lộ trình — Case "G+V" của em đã lên BE vẫn ghi "G+V", bộ nguyên nhân của FOU. */
  const ctCase: string | null = c.goc_programme_code ?? (cycle ? cycle.programme_code ?? programmeCodeOfCycle(cycle.id) : null);
  const hoanThanh = c.status === 'done' ? null : chanHoanThanhCua(caseId);
  const sosSt = sosCaseState(caseId);
  const suaDuoc = coTheSuaCase(p, c);
  const history = conn
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM sos_case_history h
         LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.case_id = ? ORDER BY h.id DESC LIMIT 50`,
    )
    .all(caseId) as any[];

  return {
    /** PR-VAI-b (T65): em đang Tạm dừng → ngày dừng (nhãn vàng thay "Quá hạn" ở Ngăn Case). */
    tamDungTu: tamDungTuCua(student),
    id: c.id,
    /** SV-NX-CASE: mốc phiên bản cho Sửa Case (409 khi người khác / máy vừa sửa). */
    capNhatLuc: c.updated_at ?? null,
    originKind: c.origin_kind,
    student: student ? {
      id: student.id, code: student.student_code, name: student.full_name, status: student.status,
      /** OV-12e: Phụ huynh ở Ngăn Case chỉ đọc của TVV / CX (cùng liên hệ đầu hồ sơ — mọi vai xem hồ sơ đã thấy, OV-10b). */
      phuHuynh: { parentName: student.parent_name ?? null, parentRelation: student.parent_relation ?? null, parentPhone: student.parent_phone ?? null },
    } : null,
    cycle,
    classId: c.class_id,
    attemptId: c.attempt_id, attemptNo: c.attempt_no ?? null,
    /** Chủ đề — kỹ năng của Case; mọi vấn đề đều phải có chỗ cất. */
    topic: c.topic as string | null,
    /** MH2: mã chương trình của lộ trình Case — web gọi `tenMon(chuongTrinh, …)` (FOU G+V/P, Pre FOU Tổng hợp). */
    chuongTrinh: ctCase,
    topicLabel: c.topic ? caseTopicLabel(c.topic, ctCase) : null,
    /** HẠNG MỤC — đơn vị của Case từ vòng 4, dùng chung cho lớp FT và lớp thường. */
    category: c.category ?? categoryOf(c.topic),
    categoryLabel: (c.category ?? categoryOf(c.topic)) ? tenMon(ctCase, c.category ?? categoryOf(c.topic)) : caseCategoryLabel(null),
    /** Tên Case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
    title: caseTitleOf(c),
    /*
     * BA VAI KHÁC NHAU, KHÔNG SUY RA TỪ NHAU (mục 2.3):
     *   `owner`    — người phụ trách chính, chịu trách nhiệm điều phối Case
     *   `reportedBy` — người ghi nhận vấn đề, có thể là người nhập hộ
     *   người thực hiện từng phương án — nằm trong chính phương án đó
     */
    ownerUserId: c.owner_user_id ?? null,
    owner: c.owner_user_id
      ? ((conn.prepare('SELECT full_name FROM users WHERE id = ?').get(c.owner_user_id) as any)?.full_name ?? null)
      : null,
    /** R1-NO-CU (D17): nút "Đổi người…" — quyền (QL / GVCN lớp em) + ứng viên (GV dạy kỹ năng của Case ở lớp + GVCN). */
    doiChu: doiChuCua(p, caseId),
    /** Case mở song song có chủ ý với một Case khác cùng hạng mục. */
    parallel: !!c.parallel,
    /*
     * LỚP NÀY CHẤM KIỂU GÌ. Lớp thường chấm điểm đạt/tổng, lớp Fast Track chấm band 0–9.
     * Ô ghi điểm giáo viên tự chấm phải hỏi đúng kiểu của lớp — hỏi band một lớp thường là
     * hỏi một con số không tồn tại ở đó.
     */
    ratio: isRatioCycle(cycle ?? {}),
    /** Các hạng mục hợp lệ của lớp này — năm ô với FT, bốn ô với Normal. */
    categories: caseCategoriesFor(isRatioCycle(cycle ?? {}) ? 'ratio' : 'ielts_band', ctCase)
      .map((k) => ({ code: k, label: tenMon(ctCase, k) })),
    /** Số kỹ năng dưới kỳ vọng của CẢ LƯỢT. NULL với vấn đề giáo viên báo — không phải SOS 0. */
    sosLevel: c.sos_level,
    /** OV-9: Case nhẹ của em KCK — chip trung tính "Dưới kỳ vọng · KCK", không hạn, không PA quy chế. */
    kck: !!c.kck,
    /**
     * Mức độ ưu tiên. Vấn đề sinh từ điểm không ghi mức vào database (hai thang cố tình tách nhau);
     * suy từ SOS lúc hiển thị. Từ vòng 5 mức độ ưu tiên KHÔNG còn quyết định hạn — hạn là chu kỳ
     * hai tuần, xem `cycleDeadline`.
     */
    urgency: c.urgency ?? (c.sos_level !== null ? urgencyFromSos(c.sos_level) : null),
    note: c.note,
    summary: c.summary,
    headline: caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no ?? null,
      attemptKind: c.attempt_kind ?? null,
    }),
    detectedAt: c.detected_at,
    reportedBy: c.reported_by
      ? (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(c.reported_by) as any)?.full_name ?? null
      : null,
    status: c.status,
    /** S16/S17: Case do hệ thống tự đóng — mã và nhãn lý do. `null` khi người đóng hoặc chưa đóng. */
    systemCloseReason: c.system_close_reason ?? null,
    systemCloseLabel: c.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[c.system_close_reason as SystemCloseReason] ?? null : null,
    disposition: c.disposition,
    dispositionNote: c.disposition_note,
    closedAt: c.closed_at,
    acknowledgedAt: c.acknowledged_at,
    /** Hạn BÁO KẾT QUẢ của cả Case — khác hạn làm từng phương án. */
    followUntil: c.follow_until ?? null,
    followOverdue: !!c.follow_until && c.status !== 'done' && c.follow_until < demoToday(),
    /** Kết quả chung đã chốt, nếu có. */
    outcome: c.outcome ?? null,
    outcomeLabel: c.outcome ? CASE_OUTCOME_LABEL[c.outcome as CaseOutcome] ?? c.outcome : null,
    outcomeNote: c.outcome_note ?? null,
    outcomeDecision: c.outcome_decision ?? null,
    outcomeAt: c.outcome_at ?? null,
    /*
     * CHỈ CHỐT ĐƯỢC KHI MỌI PHƯƠNG ÁN ĐÃ CÓ KẾT QUẢ. Giao diện dùng cờ này để làm mờ nút
     * thay vì để người dùng bấm rồi mới nhận lỗi.
     */
    canFinish: interventions.every((i: any) => i.status === 'completed' || i.status === 'cancelled'),
    /** Các mốc trong vòng đời Case — cũ trước mới sau, để màn Case kể thành câu chuyện. */
    milestones: milestonesOf(caseId),
    /* Ngày demo, để giao diện so hạn mà không phải hỏi thêm một lần nữa. */
    today: demoToday(),
    issues, interventions, followups, nguyenNhanTheoLuot, choXacNhanS,
    /** Trạng thái Case từ SOS (rulebook v3): chờ xác định nguyên nhân, hạn `hanXacNhan` (5 ngày; Gấp / SOS 3: 3), lý do đóng `Không cần theo dõi`. */
    sos: sosSt,
    /** PR-SOS (S4-5): thẻ ĐANG CHỜ ở mức Case ("Không cần theo dõi") — Ngăn Case nhúng `TheYeuCau gon` cho Quản lý. */
    yeuCauCase: theCuaDoiTuong('sos_case', [caseId]).find((y) => y.trangThai === 'cho' && y.loai === 'khong_theo_doi') ?? null,
    /** PR-LT2a (N1, N2): khối PA Bổ trợ Giữa khoá — nhóm, số buổi, chung, môn (PR-CT2: bỏ kế hoạch). `null` = Case không có PA bổ trợ. */
    boTro: boTroCuaCase([caseId]).get(caseId) ?? null,
    /** PR-SOS (T21, §7.3, K3-07): tên Case SOS ba phần · MỘT nhãn trạng thái · MỘT việc tiếp — Ngăn Case chọn nút chính theo đây. */
    tenSos: c.origin_kind === 'mock' && (c.attempt_kind ?? 'mock') === 'mock'
      ? { mt: (conn.prepare('SELECT MAX(attempt_no) n FROM case_milestones WHERE case_id = ?').get(caseId) as any)?.n ?? c.attempt_no ?? null,
          giua: tenGiuaCua(c), sos: c.sos_level ?? null, kck: !!c.kck }
      : null,
    ...(() => {
      const st = sosSt;
      const v4 = {
        status: c.status, fromSos: st.fromSos, hasCause: st.hasCause, laMt: st.laMt, dismissed: !!st.dismissed, systemClosed: !!c.system_close_reason,
        choDuyetKhongTheoDoi: !!st.choDuyetKhongTheoDoi, coPaChoXacNhan: st.coPaChoXacNhan, choDoiPa: st.choDoiPa, hanXacNhan: st.dueOn, tam: st.tam,
        lyDoHeThong: c.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[c.system_close_reason as keyof typeof SYSTEM_CLOSE_REASON_LABEL] ?? null : null,
        rutSuaDiem: laRutSuaDiem(c),
      };
      const pas = interventions.filter((i) => i.status !== 'cancelled').map((i) => ({
        /* PR-LT2a: PA Bổ trợ nói "Bổ trợ" (mô tả dài `Bổ trợ 2 buổi/tuần · …` nằm ở hàng PA) — việc tiếp đọc `Ghi kết quả PA Bổ trợ`. */
        id: i.id, ten: tenPaViecTiep(i.kind, i.description),
        batBuoc: i.batBuoc, choXacNhan: i.awaitingConfirmation, xong: i.status === 'completed', actionDue: i.actionDue,
        followupDue: i.followupDue, choDuyet: i.approvalState === 'pending', mienPhi: i.kind === 'bo_tro_mien_phi',
      }));
      const hanLapPa = hanThemPa(c)   /* OV-11c (HV-14): cùng hàm với Công việc, kể cả Case hệ thống mở */;
      return { trangThaiV4: trangThaiCaseV4(v4, demoToday()), viecTiep: viecTiepCuaCase(v4, pas, demoToday(), hanLapPa) };
    })(),
    history: history.map((h) => ({
      id: h.id, field: h.field, oldValue: h.old_value, newValue: h.new_value,
      actorName: h.actor_name, createdAt: h.created_at,
    })),
    /*
     * CÒN THIẾU GÌ ĐỂ HOÀN THÀNH CASE — nói thẳng, không làm mờ một cái nút rồi để người
     * dùng tự đoán (mục 7.7 [5]). Rỗng nghĩa là đủ điều kiện đóng.
     */
    closeBlockers: !hoanThanh ? [] : hoanThanh.an ? [hoanThanh.dong!] : hoanThanh.ly_do,
    /** PR-SOS (K3-09): `an` = ẩn nút Hoàn thành (PA theo quy chế chưa khép) + dòng mờ `dong`. */
    hoanThanh,
    viewer: {
      canEdit: can(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c)),
      /** OV-12c: nút / panel "Xác nhận Case" Progress (GVCN lớp đang học làm được dù không dạy môn). */
      coTheXacNhanCase: sosSt.fromSos && !sosSt.laMt && !sosSt.hasCause && coTheXacNhanCase(p, caseId),
      canClose: canCloseCase(p, c),
      canApprove: quanLyCase,
      /** OV-13a (C): menu ⋯ PA "Kết thúc PA" cho PA theo quy chế đang chạy — GVCN lớp đang học · Quản lý. */
      coTheKetThucPa: c.status !== 'done' && coTheKetThucPa(p, c),
      /* PR-LUI-a2: Mở lại (Case đã hoàn thành) · Sửa · Xoá Case (QL/QT, Case báo tay chưa có PA ghi kết quả) · Kỹ năng khoá khi đã có PA. */
      coTheMoLai: c.status === 'done' && coTheMoLaiCase(p, c) && !chanMoLai(c),
      coTheSua: suaDuoc && !(sosSt.fromSos && !sosSt.hasCause && !sosSt.laMt),   // SV-NX-CASE: Case MT ghi / sửa mô tả lúc nào cũng được
      /** Ô "Tên Case" của panel Sửa Case: tên riêng, hoặc phần giữa mặc định của Case SOS / Giữa khoá. */
      tenSua: suaDuoc ? (c.title ?? tenGiuaCua(c)) as string : null,
      ...(() => {
        /* Có quyền xoá mà còn PA có kết quả → `chanXoa` là câu hướng dẫn ở panel Sửa Case (nút Xoá Case khoá). */
        const chanXoa = c.status !== 'done' && CASE_XOA_DUOC.includes(c.origin_kind)
          && can(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id }) ? chanXoaCase(c) : 'khong';
        return { coTheXoa: chanXoa === null, chanXoa: chanXoa === 'khong' ? null : chanXoa };
      })(),
      khoaKyNang: c.origin_kind === 'mock' || interventions.length > 0,
    },
  };
}

export type CaseFilters = {
  branchId?: number | null;
  classId?: number | null;
  studentId?: number | null;
  /** OV-15f: chỉ Case của các em này (xuất Excel danh sách — không đọc cả chi nhánh); ≤ 500 em một lần. */
  studentIds?: number[] | null;
  status?: string | null;
  origin?: string | null;
  skill?: string | null;
  /** Hàng đợi: new | active | due | review */
  queue?: string | null;
  /** Loại lớp: 'normal' hay 'ft'. Thay cho bộ lọc "Đầu mục" đã bỏ ở vòng 4 (mục 10.1). */
  classKind?: string | null;
  /** Người phụ trách chính — để bảng giáo viên đếm đúng trách nhiệm của từng người. */
  ownerUserId?: number | null;
  /** Chỉ những Case CHƯA CÓ ai phụ trách — một nhóm việc riêng, không phải một trạng thái. */
  noOwner?: boolean;
  /**
   * PHẠM VI LỘ TRÌNH (mục 7.2). Chỉ dùng ở hồ sơ một học viên.
   *
   * Có `cycleId` thì chỉ lấy Case của lộ trình đó; không có thì lấy TOÀN BỘ HÀNH TRÌNH,
   * gồm cả Case đã hoàn thành từ lớp và lộ trình trước. Bộ lọc phải nói rõ phạm vi, để
   * không ai nhìn một danh sách ngắn rồi tưởng lịch sử đã mất.
   */
  cycleId?: number | null;
  /** OV-13a: kèm Case tạm — CHỈ panel một em (hồ sơ HV đọc đường riêng). Mặc định không: Case tạm không vào danh sách / số đếm nào (`CASE_THAT`). */
  kemTam?: boolean;
};

/**
 * Danh sách Case cho màn quản lý.
 *
 * Bốn hàng đợi trả lời bốn câu hỏi khác nhau, KHÔNG chồng nhau về mục đích:
 *   new    — chưa ai định hướng xử lý
 *   active — đang hỗ trợ hoặc đang theo dõi
 *   due    — đã hẹn xem lại và đã tới hạn
 *   review — mức cao hoặc người báo đánh dấu gấp
 */
/** Ba trạng thái loại trừ nhau dùng cho màn tổng hợp của Quản lý. */
export type CaseState = 'chua_xu_ly' | 'no_plan' | 'working' | 'done';
export const CASE_STATE_LABEL: Record<CaseState, string> = {
  /* Q28-5: Case từ SOS có PA quy chế máy gán nhưng chưa xác nhận đủ nguyên nhân + PA. */
  chua_xu_ly: 'Chưa xử lý',
  no_plan: 'Chưa có PA học thuật',
  working: 'Đang xử lý',
  done: 'Xong',
};

/** Một dòng trong danh sách Case, sau khi đã dựng xong. */
export type MappedCase = {
  id: number; originKind: string;
  studentId: number | null; studentName: string | null; studentCode: string | null;
  classId: number | null; classCode: string | null; branchId: number | null;
  homeClassId: number | null; homeBranchId: number | null;
  attemptId: number | null; attemptNo: number | null;
  sosLevel: number | null; urgency: string | null;
  /** OV-9: Case nhẹ của em KCK — không mức SOS, không hạn, không PA quy chế. */
  kck: boolean;
  summary: string | null; headline: string;
  /** Tên Case tự sinh theo mốc mới nhất — "MT2 - Listening dưới kỳ vọng". */
  title: string;
  category: string | null; categoryLabel: string | null;
  primaryCode: string | null; primaryLabel: string | null;
  topic: string | null; topicLabel: string | null; issueBranch: string | null;
  classKind: 'ft' | 'normal';
  status: string; disposition: string | null;
  detectedAt: string; reporterName: string | null;
  /** NGƯỜI PHỤ TRÁCH CHÍNH — NULL nghĩa là chưa ai nhận, và đó là một việc phải xử lý. */
  ownerUserId: number | null; ownerName: string | null;
  /** Bốn ô để đọc một Case mà không phải mở ra (mục 6.2 C). */
  currentPlan: string | null; currentPlanDue: string | null;
  lastOutcome: string | null; lastOutcomeOn: string | null; lastNextStep: string | null;
  interventionCount: number; nextDue: string | null; dueOverdue: boolean;
  /** Case mở SONG SONG có chủ ý với một Case khác cùng hạng mục. */
  parallel: boolean;
  /** OV-13a (Q2): Case tạm của lượt chưa chốt — không là việc (Thêm PA, chọn người phụ trách). */
  tam: boolean;
  /** Case này nối tiếp Case nào (vấn đề cũ tái phát sau khi đã chốt). */
  previousCaseId: number | null;
  state: CaseState;
};

/**
 * PR-TD: khoá bộ nhớ của `caseTrongPhamVi` — CHỈ gồm các bộ lọc đi vào SQL (`queue`/`classKind`/`skill` lọc SAU,
 * trong bộ nhớ, không vào khoá) — để các lần gọi cùng bộ lọc SQL, khác `queue` (Tổng quan ~12 lần
 * cùng bộ lọc SQL) dùng chung đúng MỘT kết quả SQL. Bỏ giá trị `null`/`undefined`/`false`, sắp khoá theo tên để cùng
 * một bộ lọc luôn ra cùng một khoá bất kể thứ tự viết trong object.
 */
function khoaDsCase(userId: number, f: CaseFilters): string {
  const fSql: Record<string, unknown> = {};
  for (const k of ['studentId', 'studentIds', 'classId', 'branchId', 'status', 'cycleId', 'origin', 'ownerUserId', 'noOwner', 'kemTam'] as const) {
    const v = f[k];
    if (v !== null && v !== undefined && v !== false) fSql[k] = v;
  }
  const sapXep: Record<string, unknown> = {};
  for (const k of Object.keys(fSql).sort()) sapXep[k] = fSql[k];
  return `ds-case:${userId}:${JSON.stringify(sapXep)}`;
}

/**
 * PR-Dọn (Q5, quét #8): LỚP CỦA MỘT CASE cho danh sách — lớp em ĐANG HỌC, chưa xếp lớp thì lớp của lượt. MỘT biểu thức cho bộ lọc
 * `classId`/`branchId`, cho `branchId` trả về và cho lớp đưa vào `can()`: lọc theo lớp nào thì quyền xét theo đúng lớp đó (trước đây
 * lọc theo lớp hiện tại mà xét quyền theo lớp của lượt → em chuyển chi nhánh thì QL cả hai chi nhánh và GVCN mới đều mất Case cũ).
 * Bí danh cố định của câu `caseTrongPhamVi`: `cur` ghi danh đang học, `a` lượt, `cc`/`ac` lớp tương ứng.
 */
const LOP_CUA_CASE = 'COALESCE(cur.class_id, a.class_id)';
const CN_CUA_CASE = 'COALESCE(cc.branch_id, ac.branch_id)';

/**
 * PHẦN SQL + LỌC QUYỀN + DỰNG `MappedCase` của `listCases` — tách riêng để nhớ trong request theo bộ lọc SQL
 * (`khoaDsCase`), không phụ thuộc `queue`/`classKind`/`skill` (lọc trong bộ nhớ ở `listCases`, không đổi).
 */
function caseTrongPhamVi(p: Principal, f: CaseFilters): MappedCase[] {
  return nho(khoaDsCase(p.userId, f), () => {
    const conn = db();
    const today = demoToday();

  const where: string[] = ['1=1'];
  const params: unknown[] = [];
  if (f.studentId) { where.push('COALESCE(sc.student_id, a.student_id) = ?'); params.push(f.studentId); }
  if (f.studentIds?.length) { where.push(`COALESCE(sc.student_id, a.student_id) IN (${f.studentIds.map(() => '?').join(',')})`); params.push(...f.studentIds); }
  /*
   * LỌC THEO LỚP EM ĐANG HỌC, không phải lớp lúc đánh giá.
   *
   * Bảng tổng hợp xếp Case về lớp em đang học (để cột sĩ số và ba cột SOS nói về cùng một
   * nhóm người). Bấm vào con số đó phải ra ĐÚNG danh sách tạo nên nó — nếu bộ lọc ở đây vẫn
   * đi theo lớp lúc đánh giá thì một lớp vừa nhận bốn em chuyển sang sẽ hiện "19 Case" mà
   * bấm vào lại ra danh sách rỗng.
   *
   * Em chưa xếp lớp thì lấy lớp của bài — vẫn hơn là rơi ra khỏi mọi bộ lọc.
   */
  /*
   * TD7: lớp / chi nhánh của Case là biểu thức trên bảng nối (không chỉ mục nào dùng được) → trước mỗi lần lọc phải nối đủ 6 bảng cho MỌI Case.
   * Lọc trước bằng TẬP CHA đi chỉ mục: Case của em đang học lớp ấy (ghi danh active), Case của lượt thuộc lớp ấy, Case chưa gắn em (nối qua lượt);
   * biểu thức cũ vẫn lọc đúng sau đó nên tập kết quả không đổi.
   */
  if (f.classId) {
    where.push(`sc.id IN (SELECT x.id FROM enrollments e JOIN sos_cases x ON x.student_id = e.student_id WHERE e.class_id = ? AND e.status = 'active'
                          UNION SELECT x.id FROM assessment_attempts a2 JOIN sos_cases x ON x.attempt_id = a2.id WHERE a2.class_id = ?
                          UNION SELECT x.id FROM sos_cases x WHERE x.student_id IS NULL)`, `${LOP_CUA_CASE} = ?`);
    params.push(f.classId, f.classId, f.classId);
  }
  if (f.branchId) {
    where.push(`sc.id IN (SELECT x.id FROM classes k JOIN enrollments e ON e.class_id = k.id AND e.status = 'active' JOIN sos_cases x ON x.student_id = e.student_id WHERE k.branch_id = ?
                          UNION SELECT x.id FROM classes k JOIN assessment_attempts a2 ON a2.class_id = k.id JOIN sos_cases x ON x.attempt_id = a2.id WHERE k.branch_id = ?
                          UNION SELECT x.id FROM sos_cases x WHERE x.student_id IS NULL)`, `${CN_CUA_CASE} = ?`);
    params.push(f.branchId, f.branchId, f.branchId);
  }
  if (f.status) { where.push('sc.status = ?'); params.push(f.status); }
  if (f.cycleId) { where.push('COALESCE(sc.cycle_id, a.cycle_id) = ?'); params.push(f.cycleId); }
  if (f.origin) { where.push('sc.origin_kind = ?'); params.push(f.origin); }
  /* Lọc theo NGƯỜI PHỤ TRÁCH — để bảng giáo viên đếm đúng trách nhiệm của từng người. */
  if (f.ownerUserId) { where.push('sc.owner_user_id = ?'); params.push(f.ownerUserId); }
  if (f.noOwner) where.push('sc.owner_user_id IS NULL');
  if (!f.kemTam) where.push(CASE_THAT('sc'));

  const rows = conn
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              ${LOP_CUA_CASE} AS lop_quyen_id,
              ${CN_CUA_CASE} AS eff_branch_id,
              cur.class_id AS home_class_id,
              cc.branch_id AS home_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              COALESCE(ac.is_fast_track, cc.is_fast_track) AS class_is_ft,
              COALESCE(sc.goc_programme_code, ac.programme_code, cc.programme_code) AS class_ct,
              s.full_name, s.student_code,
              a.attempt_no, a.kind AS attempt_kind,
              u.full_name AS reporter_name,
              ow.full_name AS owner_name,
              (SELECT COUNT(*) FROM case_interventions iv WHERE iv.case_id = sc.id) AS intervention_count,
              ${LA_CASE_SOS('sc')} AS tu_sos,
              /* PR-N1 (Task 13, K3-02/T53 Q1): hạn tiếp theo = hạn GHI KẾT QUẢ TUẦN (action_due, hết Thứ Hai) của PA đang
                 chạy — KHÔNG phải dự kiến kết thúc (followup_due, không bao giờ là hạn). Cùng luật với ô "Việc cần làm tiếp". */
              (SELECT MIN(iv.action_due) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.action_due IS NOT NULL AND iv.status IN ('planned','started')
                  AND ${NOT_UNCONFIRMED_PRESET('iv')}) AS next_due,
              (SELECT ci.taxonomy_code FROM case_issues ci
                WHERE ci.case_id = sc.id AND ci.role = 'primary' LIMIT 1) AS primary_code
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
         LEFT JOIN users u ON u.id = sc.reported_by
         LEFT JOIN users ow ON ow.id = sc.owner_user_id
        WHERE ${where.join(' AND ')}
        GROUP BY sc.id
        ORDER BY COALESCE(sc.detected_at, DATE(sc.created_at)) DESC, sc.id DESC`,
    )
    .all(...params) as any[];

  /* TD7: bốn bảng phụ dưới (đọc cả bảng, không theo bộ lọc) nhớ MỘT lần mỗi request GET — Học viên & Lớp / Tổng quan gọi danh sách Case
     theo từng chi nhánh (tới 5 lần), trước mỗi lần đọc lại cả bốn bảng. Người gọi không sửa kết quả. */
  const { latestAttemptByCase, planOf, lastResultOf, skillsByCase } = nho('ds-case-phu', () => {
  /*
   * LƯỢT MT MỚI NHẤT của từng Case, lấy MỘT LẦN cho cả danh sách.
   *
   * Tên Case tự sinh theo mốc mới nhất, nên cần con số này. Hỏi từng Case một thì một bảng
   * ba trăm dòng sinh ba trăm câu truy vấn — đúng kiểu chậm mà không ai biết vì sao.
   */
  const latestAttemptByCase = new Map<number, number>();
  for (const r of conn
    .prepare(
      `SELECT case_id, MAX(attempt_no) AS n FROM case_milestones
        WHERE attempt_no IS NOT NULL GROUP BY case_id`,
    )
    .all() as any[]) {
    latestAttemptByCase.set(r.case_id, r.n);
  }

  /*
   * PHƯƠNG ÁN ĐANG CHẠY và KẾT QUẢ GẦN NHẤT của từng Case, lấy MỘT LẦN cho cả danh sách.
   *
   * Đây là hai thứ khiến một dòng Case đọc được mà không phải mở ra: "đang làm gì" và "lần
   * gần nhất ăn thua đến đâu". Trước vòng này dòng Case chỉ nói "đang xử lý · 2 việc" —
   * đúng nhưng vô dụng, vì nó không nói đang làm gì cho em cả.
   */
  const planOf = new Map<number, { kind: string; description: string | null; due: string | null }>();
  for (const r of conn
    .prepare(
      `SELECT case_id, kind, description, action_due FROM case_interventions
        WHERE status IN ('planned','started') AND COALESCE(approval_state,'') != 'pending'
        ORDER BY id DESC`,
    )
    .all() as any[]) {
    if (!planOf.has(r.case_id)) {
      planOf.set(r.case_id, { kind: r.kind, description: r.description, due: r.action_due });
    }
  }
  const lastResultOf = new Map<number, { outcome: string | null; nextStep: string | null; on: string }>();
  for (const r of conn
    .prepare(
      `SELECT case_id, outcome, next_step, observed_on FROM case_followups
        WHERE outcome IS NOT NULL ORDER BY observed_on DESC, id DESC`,
    )
    .all() as any[]) {
    if (!lastResultOf.has(r.case_id)) {
      lastResultOf.set(r.case_id, { outcome: r.outcome, nextStep: r.next_step, on: r.observed_on });
    }
  }

  /* Kỹ năng của một Case = kỹ năng của các dòng phân loại. Một Case có thể chạm nhiều kỹ năng. */
  const skillsByCase = new Map<number, string[]>();
  for (const r of conn
    .prepare('SELECT case_id, skill FROM case_issues WHERE skill IS NOT NULL').all() as any[]) {
    const cur = skillsByCase.get(r.case_id) ?? [];
    if (!cur.includes(r.skill)) cur.push(r.skill);
    skillsByCase.set(r.case_id, cur);
  }
  return { latestAttemptByCase, planOf, lastResultOf, skillsByCase };
  });

  /*
   * PR-TD: nạp trước chi nhánh/lớp của MỌI HV trong một lô, để `can()` dưới đây không hỏi DB từng dòng một.
   * BỎ QUA khi vai đang có phạm vi TOÀN HỆ THỐNG (`scope.all`, ví dụ Quản trị hệ thống): `can()` luôn `true` ngay ở
   * grant `branchId = null` (`grantCovers`), không bao giờ chạm `branchOfClass`/`branchesOfStudent` — nạp trước ở
   * đây chỉ tốn thêm hai câu SQL mà không có gì để lợi (đã tự bắt gặp lúc rà bằng `PR-Qa (17, fix planning) ·
   * classOverview`: nạp trước cho `P.admin` làm số câu tăng dù `can()` chưa từng cần dữ liệu đó).
   */
  if (!scopeFor(p, PERMISSIONS.ATTEMPT_VIEW).all) napTruocPhamVi(rows.map((r) => r.eff_student_id));

  const all: MappedCase[] = rows
    .filter((r) => can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.lop_quyen_id, studentId: r.eff_student_id }))
    .map((r) => ({
      id: r.id,
      originKind: r.origin_kind,
      studentId: r.eff_student_id, studentName: r.full_name, studentCode: r.student_code,
      classId: r.eff_class_id, classCode: r.class_code, branchId: r.eff_branch_id,
      /*
       * LỚP EM ĐANG HỌC — khác `classId` là lớp LÚC ĐÁNH GIÁ. Bảng tổng hợp gom theo ô này;
       * hồ sơ và danh sách vẫn hiện lớp lúc đánh giá, vì đó là chỗ người ta đọc lịch sử.
       */
      homeClassId: r.home_class_id ?? r.eff_class_id,
      homeBranchId: r.home_branch_id ?? r.eff_branch_id,
      /* Lớp thường và lớp FT chấm khác nhau, nên bộ lọc loại lớp là bộ lọc ĐẦU TIÊN. */
      classKind: (r.class_is_ft ? 'ft' : 'normal') as 'ft' | 'normal',
      attemptId: r.attempt_id, attemptNo: r.attempt_no, attemptKind: r.attempt_kind ?? null,
      sosLevel: r.sos_level, kck: !!r.kck, urgency: r.urgency,
      summary: r.summary,
      headline: caseHeadline({
        summary: r.summary, originKind: r.origin_kind, sosLevel: r.sos_level, attemptNo: r.attempt_no,
        attemptKind: r.attempt_kind ?? null,
      }),
      /*
       * TÊN NGƯỜI DÙNG TỰ ĐẶT LUÔN THẮNG (mục 7.3).
       *
       * Bản trước chỗ này luôn dựng lại tên tự sinh, nên một Case giáo viên đặt tên "Nghe
       * sót số và tên riêng" lên danh sách lại thành "Listening dưới kỳ vọng" — trong khi
       * mở ra xem thì đúng tên đã gõ. Cùng một Case mang hai cái tên ở hai màn là cách
       * chắc chắn để người đọc tưởng đó là hai case.
       */
      title: (r.title ?? '').trim() || caseTitle({
        category: r.category ?? categoryOf(r.topic),
        latestAttemptNo: latestAttemptByCase.get(r.id) ?? r.attempt_no ?? null,
        latestAttemptKind: r.attempt_kind ?? null,
        chuongTrinh: r.class_ct ?? null,
      }),
      /** MH2: mã chương trình của lớp Case (tên môn FOU G+V/P, Pre FOU Tổng hợp). */
      chuongTrinh: (r.class_ct ?? null) as string | null,
      category: r.category ?? categoryOf(r.topic),
      categoryLabel: (r.category ?? categoryOf(r.topic)) ? tenMon(r.class_ct, r.category ?? categoryOf(r.topic)) : caseCategoryLabel(null),
      primaryCode: r.primary_code,
      primaryLabel: r.primary_code ? issueLabel(r.primary_code) : null,
      /** Chủ đề: một trong năm ô L·R·W1·W2·S. */
      topic: r.topic as string | null,
      topicLabel: r.topic ? caseTopicLabel(r.topic, r.class_ct) : null,
      /** Nhánh nhóm nguyên nhân, khi đã có người dạy nhận định. */
      issueBranch: issueBranchOf(r.primary_code),
      status: r.status as string,
      disposition: r.disposition,
      detectedAt: r.detected_at ?? (r.created_at ?? '').slice(0, 10),
      reporterName: r.reporter_name ?? null,
      ownerUserId: r.owner_user_id ?? null,
      ownerName: r.owner_name ?? null,
      /* PHƯƠNG ÁN ĐANG LÀM — tên việc, không phải một con số đếm. */
      currentPlan: (() => {
        const iv = planOf.get(r.id);
        if (!iv) return null;
        return (iv.description ?? '').trim()
          || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || iv.kind;
      })(),
      currentPlanDue: planOf.get(r.id)?.due ?? null,
      /* KẾT QUẢ GẦN NHẤT và bước tiếp theo đã chọn — hai thứ nói "ăn thua đến đâu, rồi sao". */
      lastOutcome: lastResultOf.get(r.id)?.outcome ?? null,
      lastOutcomeOn: lastResultOf.get(r.id)?.on ?? null,
      lastNextStep: lastResultOf.get(r.id)?.nextStep ?? null,
      parallel: !!r.parallel,
      tam: !!r.tam,
      previousCaseId: r.previous_case_id ?? null,
      interventionCount: r.intervention_count as number,
      nextDue: r.next_due as string | null,
      dueOverdue: !!r.next_due && r.next_due < today,
      /*
       * BA TRẠNG THÁI LOẠI TRỪ NHAU, cộng lại đúng bằng tổng — khác hẳn bốn hàng đợi ở
       * dưới (bốn câu hỏi, cố tình chồng nhau). Quản lý cần cả hai cách nhìn: hàng đợi để
       * biết làm gì trước, ba trạng thái để biết bức tranh chung đang ở đâu.
       */
      state: (r.status === 'done' ? 'done'
        : isNoPlanCase({ status: r.status, disposition: r.disposition, interventionCount: r.intervention_count as number, tam: !!r.tam }) ? 'no_plan'
        : r.tu_sos && r.status === 'open' ? 'chua_xu_ly'
        : 'working') as CaseState,
    }));

    return all;
  });
}

/*
 * PR-TD: annotation TƯỜNG MINH — tách `caseTrongPhamVi` qua `trongBoNho` (một lời gọi hàm generic riêng) làm mất
 * "mẹo" suy luận kiểu cũ của TypeScript (khi hai `return` object-literal nằm cùng một hàm, TS tự thêm `facets?:
 * undefined` vào nhánh thiếu — nay hai nhánh được suy luận tách rời nên mẹo đó không còn). Không đổi hình dạng JSON
 * trả về, chỉ khai rõ để nơi gọi cũ dùng `.facets!` vẫn qua được typecheck.
 */
export function listCases(p: Principal, f: CaseFilters = {}): {
  rows: MappedCase[];
  scopeEmpty: boolean;
  facets?: ReturnType<typeof facetsOf>;
} {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  return trongBoNho(() => {
    const all = caseTrongPhamVi(p, f);

    /*
     * Hàng đợi lọc TRƯỚC, vì nó là câu hỏi đang đặt ra ("cái nào chưa ai làm?"). Nhóm và kỹ
     * năng là hai chiều đi sâu bên trong câu hỏi đó, nên số đếm ở các chiều ấy phải tính
     * trong phạm vi hàng đợi đang chọn, không phải trên toàn bộ.
     */
    const queued = (list: MappedCase[]) => {
      switch (f.queue) {
        // Chưa ai định hướng: không có hướng xử lý và cũng chưa có tác động nào.
        case 'new':
          return list.filter((r) => r.status !== 'done' && !r.disposition && r.interventionCount === 0);
        case 'active':
          return list.filter((r) => r.status !== 'done' && (!!r.disposition || r.interventionCount > 0));
        // Tới hạn xem lại: CHỈ khi đã hẹn. Theo dõi không hẹn thì không bao giờ quá hạn.
        case 'due':
          return list.filter((r) => r.status !== 'done' && r.dueOverdue);
        case 'review':
          return list.filter((r) => r.status !== 'done' && ((r.sosLevel ?? 0) >= 3 || r.urgency === 'urgent'));
        default:
          return list;
      }
    };

    const base = queued(all);
    let mapped = base;
    /*
     * `skill` là CHỦ ĐỀ (một trong năm ô kỹ năng). 'none' cho chủ đề = vấn đề cũ chưa gắn được kỹ năng —
     * một lựa chọn thật, để các số cộng lại đúng bằng tổng. (Bộ lọc "đầu mục" Học thuật/Ý thức đã bỏ 21/09/2026.)
     */
    if (f.classKind) mapped = mapped.filter((r) => r.classKind === f.classKind);
    if (f.skill === 'none') mapped = mapped.filter((r) => !r.topic);
    else if (f.skill) mapped = mapped.filter((r) => r.topic === f.skill);

    return { rows: mapped, scopeEmpty: false, facets: facetsOf(base, f) };
  });
}

/**
 * ĐẾM CHO TỪNG LỰA CHỌN LỌC, để nhìn thấy con số TRƯỚC KHI bấm.
 *
 * Mỗi chiều được đếm trên tập đã lọc bởi các chiều KHÁC, không phải bởi chính nó — nếu
 * không thì chọn "Listening" xong mọi kỹ năng khác hiện 0, và người dùng mất luôn đường
 * đi tiếp. Đây là cách lọc theo mặt (facet) thông thường, và là điều kiện để dòng
 * "Học viên 18 › Listening 6" nói đúng sự thật.
 */
function facetsOf(all: MappedCase[], f: CaseFilters) {
  /*
   * LOẠI LỚP LÀ BỘ LỌC NGOÀI CÙNG, nên nó thu hẹp MỌI số đếm bên trong. Chọn "Normal" rồi
   * mà chip kỹ năng vẫn đếm cả Case lớp FT thì bấm vào ra danh sách ngắn hơn con số trên
   * chip — đúng kiểu lệch số owner nêu đích danh.
   */
  const base = f.classKind ? all.filter((r) => r.classKind === f.classKind) : all;
  const matchTopic = (r: MappedCase) => (f.skill === 'none' ? !r.topic : r.topic === f.skill);
  const both = f.skill ? base.filter(matchTopic) : base;

  const tally = (list: MappedCase[], key: (r: MappedCase) => string | null) => {
    const m: Record<string, number> = {};
    for (const r of list) { const k = key(r); if (k) m[k] = (m[k] ?? 0) + 1; }
    return m;
  };

  return {
    /** Chủ đề: đếm trên tập chưa lọc theo chủ đề. */
    skill: tally(base, (r) => r.topic),
    /*
     * NGUYÊN NHÂN đã được người dạy nhận định. Trước đây đếm theo NHÁNH phân loại, nhưng
     * nhánh nay trùng với chính chủ đề (Listening → Listening), nên dòng đó chỉ lặp lại
     * hàng chip ở trên. Đếm theo mã nguyên nhân mới nói thêm được điều gì.
     */
    issueBranch: tally(both, (r) => r.primaryCode),
    branch: tally(all, (r) => (r.branchId ? String(r.branchId) : null)),
    /** Số Case theo loại lớp — để chip Normal/FT có con số trước khi bấm. */
    classKind: tally(all, (r) => r.classKind),
    /** Ba trạng thái loại trừ nhau, cộng lại đúng bằng tổng. */
    state: tally(both, (r) => r.state),
    /*
     * Vấn đề cũ CHƯA GẮN ĐƯỢC KỸ NĂNG đếm riêng, để các số cộng lại đúng bằng tổng. Bước
     * nâng cấp cố ý không đoán bừa kỹ năng cho những Case trượt từ hai kỹ năng trở lên.
     */
    skillNone: base.filter((r) => !r.topic).length,
    total: both.length,
  };
}



/**
 * BẢNG THEO DÕI HỖ TRỢ THEO KỸ NĂNG — mục 7.11, trái tim của hồ sơ học viên.
 *
 * Sáu dòng, không bao giờ nhiều hơn: L · R · W1 · W2 · S · Ý thức/Khác. Mỗi dòng trả lời ba
 * câu trong một cái liếc mắt:
 *
 *   1. Em đang ở đâu ở môn này?      → band MT gần nhất, so với kỳ vọng, và so với lần trước
 *   2. Có Case không, đang thế nào?  → trạng thái, đã kéo qua mấy lượt MT
 *   3. Đã áp dụng phương án nào?     → phương án mới nhất và kết quả của nó
 *
 * Hạng mục KHÔNG có Case vẫn hiện một dòng. Đó là điểm khác với danh sách case: người dạy
 * cần thấy cả những môn đang ổn, nếu không thì "không thấy Reading" có hai nghĩa — ổn, hoặc
 * chưa ai nhập điểm — và hai nghĩa ấy dẫn tới hai việc khác hẳn nhau.
 */
export function skillSupportBoard(p: Principal, studentId: number, cycleId?: number | null) {
  const conn = db();
  const student = dongHocVien(studentId);
  if (!student) throw notFound('Không tìm thấy học viên');
  /* PR-Dọn (9c): lớp đang học qua `activeClassOf` (nhớ trong request) — cùng câu, không đọc lại. */
  const lopDangHoc = activeClassOf(studentId);
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: lopDangHoc, studentId },
    'Bạn không có quyền xem học viên này.');
  dienMocQuyChe({ studentId });   // PR-SOS K3-14

  /*
   * ĐƯỢC SỬA HAY KHÔNG — trả về sẵn cùng bảng kỹ năng.
   *
   * Hồ sơ học viên nay ghi kết quả NGAY TRONG THẺ CASE, nên nó phải biết trước có được ghi
   * hay không: người chỉ có quyền xem thì không thấy nút, thay vì bấm vào rồi nhận một câu
   * từ chối.
   *
   * (AUTH-01) KHÔNG còn một cờ chung cho cả bảng — Case Học thuật siết đúng kỹ năng, nên
   * GV Listening được sửa Case Listening mà KHÔNG được sửa Case Reading trên CÙNG một bảng.
   * Tính riêng cho từng Case ở chỗ dựng thẻ Case bên dưới (`sosEditCtx(c)`), không phải một
   * lần hỏi chung ở đây.
   */

  const cycle = cycleId ? cyclesOf(studentId).find((c) => c.id === cycleId) : currentCycle(studentId);   // PR-Dọn (9d): cùng danh sách đã nhớ

  /*
   * ĐIỂM HAI LƯỢT GẦN NHẤT của từng ô nhập điểm, để nói được "tăng hay giảm".
   * Chỉ lấy lượt đã có điểm và chưa bị huỷ — lượt mới xếp tuần chưa nói gì về em.
   */
  const ratio = isRatioCycle(cycle);
  /*
   * ĐIỂM CỦA TỪNG Ô NHẬP — và LỚP NORMAL KHÔNG DÙNG CỘT `band`.
   *
   * Fast Track chấm band IELTS nên đọc `band`. Lớp thường chấm ĐIỂM ĐẠT trên TỔNG của chính
   * đề đó (21/40), nên `band` của nó luôn trống. Bản trước chỉ đọc `band`, nên hồ sơ một em
   * lớp Foundation có cột "Kết quả gần nhất" trống trơn trong khi bảng điểm ngay bên dưới
   * bày đủ bốn môn — đúng kiểu số liệu đá nhau mà cả mục 4.2 sinh ra để dẹp.
   */
  const scoreRows = conn
    .prepare(
      `SELECT a.attempt_no, a.id AS attempt_id, a.kind, rp.code AS period_code, a.target_at_attempt, a.kck_at_attempt, a.class_id,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route, (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS cy_kck,
              sc.skill, sc.band, sc.raw_score, sc.raw_total
         FROM assessment_attempts a
         JOIN assessment_scores sc ON sc.attempt_id = a.id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.student_id = ? AND COALESCE(a.cycle_id, 0) = ?
          AND a.status != 'cancelled'
          AND (sc.band IS NOT NULL OR (sc.raw_score IS NOT NULL AND sc.raw_total IS NOT NULL))
        ORDER BY a.attempt_no`,
    )
    .all(studentId, cycle?.id ?? 0) as any[];

  type Point = {
    attemptNo: number; attemptId: number; band: number; week: string | null; expectation: number | null;
    /* Lớp thường: điểm đạt/tổng của chính đề đó. Fast Track để trống. */
    score: number | null; total: number | null; passed: boolean | null;
    /** 'mock' | 'progress' | 'final' — lớp thường KHÔNG được gọi bài của mình là "MT" (PR-Form, SkillBoard). */
    attemptKind: string | null;
  };
  const byCategory = new Map<string, Point[]>();
  for (const r of scoreRows) {
    const cat = categoryOf(r.skill);
    if (!cat) continue;
    if (ratio && (r.raw_score === null || r.raw_total === null)) continue;
    if (!ratio && r.band === null) continue;
    const rr = ratio ? ratioResult(r.raw_score, r.raw_total, nguongDatLop(r.class_id)) : null;
    const list = byCategory.get(cat) ?? [];
    list.push({
      attemptNo: r.attempt_no, attemptId: r.attempt_id,
      band: ratio ? r.raw_score : r.band,
      score: ratio ? r.raw_score : null,
      total: ratio ? r.raw_total : null,
      passed: rr ? rr.outcome === 'pass' : null,
      week: r.period_code ?? null,
      /* PR-MT0: MT0 không có kỳ vọng (T5) — chỉ chip SOS hiển thị. */
      expectation: !ratio && r.kind !== 'mt0' && r.target_at_attempt !== null && r.target_at_attempt !== undefined
        ? expectationFor(r.target_at_attempt, r.attempt_no, r.route) : null,
      attemptKind: r.kind ?? null,
    });
    byCategory.set(cat, list);
  }

  /*
   * CASE CỦA LỘ TRÌNH KHÁC VẪN CÒN MỞ THÌ PHẢI HIỆN — dán nhãn rõ, không giấu.
   *
   * Một em học xong LT1 rồi sang LT2 mà Case Listening của LT1 chưa chốt thì đó vẫn là việc
   * đang treo của một đứa trẻ có thật. Lọc bỏ nó đi thì bảng sáu dòng nói "không có Case"
   * trong khi thẻ tên phía trên vẫn hiện SOS 2 — đúng kiểu số liệu đá nhau owner đã nêu.
   *
   * Xếp sau Case của lộ trình đang chọn, nên nó chỉ được chọn làm đại diện khi lộ trình này
   * chưa có Case nào ở hạng mục đó.
   */
  const caseRows = conn
    .prepare(
      `SELECT *, (COALESCE(cycle_id, 0) != ?) AS carried_over, (SELECT cy.started_at FROM learning_cycles cy WHERE cy.id = sos_cases.cycle_id) AS lo_trinh_bat_dau,
              goc_programme_code AS ct_attempt,
              (SELECT cl.code FROM classes cl WHERE cl.id = sos_cases.goc_class_id) AS lop_attempt,
              (SELECT a.class_id FROM assessment_attempts a WHERE a.id = sos_cases.attempt_id) AS attempt_class_id,
              (SELECT u.full_name FROM users u WHERE u.id = sos_cases.owner_user_id) AS owner_name FROM sos_cases
        WHERE student_id = ?
          AND (COALESCE(cycle_id, 0) = ? OR status != 'done')
        ORDER BY carried_over, (status = 'done'), parallel, id DESC`,
    )
    .all(cycle?.id ?? 0, studentId, cycle?.id ?? 0) as any[];
  /* AN-8: số bằng chứng của MỌI Case trên bảng — một câu hỏi, không phải một câu cho mỗi thẻ. */
  const soBangChung = demBangChungCase(caseRows.map((c) => c.id as number));
  const boTroMap = boTroCuaCase(caseRows.map((c) => c.id as number));   // PR-LT2a: theo TẬP, không hỏi từng Case
  /* PR-UXF-b (O1): thẻ Xin ý kiến của MỌI PA trên bảng — một câu tìm PA có thẻ, rồi MỘT lần `theCuaDoiTuong` (rỗng thì không câu nào). Cùng luật chọn với Ngăn Case. */
  const xinYKienCua = new Map<number, any>();
  {
    const idPa: number[] = [];
    theoLo(caseRows.map((c) => c.id as number), (lo, ph) => {
      for (const r of conn.prepare(`SELECT y.doi_tuong_id AS id FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id
         WHERE y.doi_tuong_loai = 'intervention' AND y.loai = 'xin_y_kien' AND iv.case_id IN (${ph})`).all(...lo) as any[]) idPa.push(r.id);
    });
    for (const y of theCuaDoiTuong('intervention', [...new Set(idPa)])) {
      if (y.loai === 'xin_y_kien' && y.trangThai !== 'tu_dong' && !xinYKienCua.has(y.doiTuongId)) xinYKienCua.set(y.doiTuongId, y);
    }
  }

  /* PR-PA (§8): người giữ việc Kết quả của MỌI PA trên bảng — cùng `nguoiGiuKetQua` với Công việc / chỉ số / quyền ghi. Lớp như `loadCase`
     (lớp hiện tại trước, lớp của lượt sau). Một câu PA + `nguoiGiuKetQua` theo lô + một câu tên — không câu mỗi thẻ. */
  const caseTheoId = new Map(caseRows.map((c) => [c.id as number, c]));
  const lopCase = (c: any) => (lopDangHoc ?? c.attempt_class_id ?? null) as number | null;
  const paBang: any[] = [];
  theoLo([...caseTheoId.keys()], (lo, ph) => {
    paBang.push(...conn.prepare(`SELECT id, case_id, nhom_bo_tro FROM case_interventions WHERE case_id IN (${ph})`).all(...lo) as any[]);
  });
  const giuId = nguoiGiuKetQua(paBang.map((iv) => {
    const c = caseTheoId.get(iv.case_id);
    return { id: iv.id, topic: c.topic ?? null, nhomBoTro: iv.nhom_bo_tro ?? null, classId: lopCase(c), ownerUserId: c.owner_user_id ?? null };
  }), demoToday());
  const tenGiu = new Map<number, string>();
  theoLo([...new Set([...giuId.values()].filter((x): x is number => x != null))], (lo, ph) => {
    for (const u of conn.prepare(`SELECT id, full_name FROM users WHERE id IN (${ph})`).all(...lo) as any[]) tenGiu.set(u.id, u.full_name);
  });
  const giuKq = new Map([...giuId].map(([iv, id]) => [iv, { id, ten: id == null ? null : tenGiu.get(id) ?? null }]));

  /*
   * BỘ HẠNG MỤC THEO ĐÚNG CHƯƠNG TRÌNH EM ĐANG HỌC.
   *
   * Em lớp Foundation không có Writing Task 1 và Task 2, nên bày hai dòng đó trên hồ sơ em
   * là bày hai dòng vĩnh viễn trống. Em lớp Fast Track thì ngược lại: một dòng "W" gộp mất
   * mất phân biệt giữa hai bài do hai giáo viên khác nhau chấm.
   */
  /*
   * THỨ TỰ CASE TRONG MỘT KỸ NĂNG (mục 4.3): đang mở trước, rồi tới cập nhật NGHIỆP VỤ mới
   * nhất, rồi ngày tạo.
   *
   * "Cập nhật nghiệp vụ" là một lần ai đó làm gì với Case — ghi kết quả, thêm phương án,
   * đổi kết luận. KHÔNG dùng `updated_at` chung: một lần chạy nền chạm vào bản ghi sẽ đẩy
   * Case đó lên đầu như thể vừa có người xử lý, và thứ tự trên màn hình thành vô nghĩa.
   */
  const lastTouch = (caseId: number): string | null => {
    const r = conn
      .prepare(
        `SELECT MAX(d) AS d FROM (
            SELECT MAX(observed_on) d FROM case_followups WHERE case_id = ?
            UNION ALL SELECT MAX(COALESCE(completed_date, started_date, planned_date)) FROM case_interventions WHERE case_id = ?
            UNION ALL SELECT MAX(occurred_on) FROM case_milestones WHERE case_id = ?)`,
      )
      .get(caseId, caseId, caseId) as any;
    return r?.d ?? null;
  };

  /* MH2 + PF6: bảng kỹ năng theo chương trình lộ trình — FOU G+V/P, Pre FOU một hàng "Tổng hợp". */
  const ctBang: string | null = cycle ? cycle.programme_code ?? programmeCodeOfCycle(cycle.id) : null;
  /*
   * PR-S5F-a: Case có hạng mục NGOÀI ô chuẩn của chương trình đang học (vd. Case "Cuối khoá Pre FOU · Tổng hợp không đạt" đi theo em lên FOU) vẫn
   * phải có dòng — không thì bảng và thẻ tóm tắt nói "không có Case" trong khi Case còn mở. Dòng thêm xếp sau các ô chuẩn.
   */
  const oChuan: readonly string[] = caseCategoriesFor(isRatioCycle(cycle) ? 'ratio' : 'ielts_band', ctBang);
  /*
   * PR-UXF-b (R5-5): Case ĐANG MỞ mà lớp GỐC lúc mở nó (`ct_attempt` = `sos_cases.goc_programme_code`, PR-DEPLOY 0b-3 — không còn đọc theo lượt: lượt đổi theo thời gian, Case tay không có lượt) có TÊN MÔN khác chương trình đang xem (FOU "G+V" / "P" → BE "Writing" / "Speaking") không nằm ở hàng cùng khoá
   * dữ liệu — hàng Writing của BE đọc thành "em yếu Writing" (khi chuyển lớp, Case bàn giao sang lộ trình mới nên không dựa vào `carried_over`). Chúng thành nhóm "Case bàn giao" cuối
   * bảng, tên môn theo chương trình của LỚP đó. Tên giống nhau (L, R) giữ hàng. Chương trình / mã lớp đọc cùng câu SQL nạp Case (không thêm câu).
   */
  const tuLopTruoc = new Map<number, { ct: string | null; lop: string }>();
  for (const c of caseRows) {
    const cat = (c.category ?? categoryOf(c.topic)) as string | null;
    if (c.status !== 'done' && cat && ctBang && c.ct_attempt && tenMonNgan(c.ct_attempt, cat) !== tenMonNgan(ctBang, cat)) tuLopTruoc.set(c.id, { ct: c.ct_attempt, lop: c.lop_attempt });
  }
  const oNgoai = [...new Set(caseRows.filter((c) => !tuLopTruoc.has(c.id) && (c.status !== 'done' || !c.carried_over)).map((c) => (c.category ?? categoryOf(c.topic)) as string | null)
    .filter((k): k is string => !!k && !oChuan.includes(k)))];
  const dongKyNang = (category: string, thuCu?: { ct: string | null; lop: string; cases: any[] }) => {
    /* Hàng "Case bàn giao": không mượn điểm của lộ trình đang xem. */
    const points = thuCu ? [] : byCategory.get(category) ?? [];
    const latest = points[points.length - 1] ?? null;
    const prev = points.length > 1 ? points[points.length - 2] : null;

    /*
     * Case ĐẠI DIỆN cho hạng mục: ưu tiên cái đang mở, mới nhất. Không có cái nào đang mở
     * thì lấy cái đã đóng gần nhất — "đã từng có vấn đề và đã xử lý xong" là một câu trả
     * lời khác hẳn "chưa từng có vấn đề", và người dạy cần phân biệt hai câu đó.
     */
    const mine = thuCu ? thuCu.cases : caseRows.filter((c) => !tuLopTruoc.has(c.id) && (c.category ?? categoryOf(c.topic)) === category);
    const primary = mine.find((c) => c.status !== 'done') ?? mine[0] ?? null;

    let interventions: any[] = [];
    let milestoneCount = 0;
    if (primary) {
      interventions = conn
        .prepare(
          `SELECT iv.*, u.full_name AS performer_name_user FROM case_interventions iv
             LEFT JOIN users u ON u.id = iv.performer_user_id
            WHERE iv.case_id = ? ORDER BY iv.id DESC`,
        )
        .all(primary.id) as any[];
      milestoneCount = (conn
        .prepare('SELECT COUNT(DISTINCT attempt_id) n FROM case_milestones WHERE case_id = ? AND attempt_id IS NOT NULL')
        .get(primary.id) as any).n;
    }
    const openIv = interventions.filter((i) => i.status === 'planned' || i.status === 'started');

    /*
     * TRẠNG THÁI HIỂN THỊ — bốn mức, và mỗi mức dẫn tới một việc khác nhau:
     *   none      chưa từng có Case ở hạng mục này
     *   no_plan   có Case mà CHƯA AI đề ra phương án   → cần người quyết
     *   working   đang xử lý                            → chờ kết quả
     *   done      đã chốt kết thúc                      → để tra lại
     */
    const state = !primary ? 'none'
      : primary.status === 'done' ? 'done'
      : (!primary.disposition && interventions.length === 0) ? 'no_plan'
      : primary.status === 'open' && interventions.some((i) => i.preset) ? 'chua_xu_ly'
      : 'working';

    const overdueAction = openIv.find((i) => i.action_due && i.action_due < demoToday()
      && (i.approval_state ?? '') !== 'pending') ?? null;

    return {
      category,
      label: tenMon(thuCu ? thuCu.ct : ctBang, category),
      short: tenMonNgan(thuCu ? thuCu.ct : ctBang, category),
      chuongTrinh: thuCu ? thuCu.ct : ctBang,
      /** PR-UXF-b (R5-5): mã lớp cũ của nhóm "Case bàn giao" (dòng phụ "từ MB FOU 12"); null = hàng chuẩn. */
      tuLopTruoc: thuCu ? thuCu.lop : null,
      /* Band MT gần nhất — chưa có điểm thì để trống chứ không ghi 0. */
      band: latest?.band ?? null,
      bandAttemptNo: latest?.attemptNo ?? null,
      /** PR-VAI-b (G5): id lượt của `bandAttemptNo` — "MT1" ở bảng kỹ năng mở hồ sơ Mock của đúng lượt, cuộn tới kỹ năng. */
      bandAttemptId: latest?.attemptId ?? null,
      bandWeek: latest?.week ?? null,
      expectation: latest?.expectation ?? null,
      /*
       * HAI SỐ, HAI CÂU HỎI KHÁC NHAU — chốt 17/09, PR18 làm sai nên phải sửa lại.
       *
       * `gap`   còn thiếu bao nhiêu để đạt kỳ vọng CỦA CHÍNH ĐỢT ĐÓ. Đây là số hiện mặc định.
       * `trend` tăng giảm so với lượt trước. Vẫn giữ, nhưng hiện bằng CHỮ trung tính — mũi
       *         tên xanh cạnh một điểm còn dưới kỳ vọng là khen sớm.
       */
      gap: latest && latest.expectation !== null
        ? Math.round((latest.band - latest.expectation) * 10) / 10 : null,
      trend: latest && prev ? Math.round((latest.band - prev.band) * 10) / 10 : null,
      trendFrom: prev ? prev.attemptNo : null,
      /*
       * ĐƯỜNG ĐI qua các lượt, tối đa bốn mốc gần nhất.
       *
       * Owner xin thêm thông tin vào thanh thu gọn, và đây là thứ đáng thêm nhất: một con số
       * 5.0 đứng một mình không phân biệt được em đang lên hay đang tụt, mà đó lại là câu
       * quyết định có cần làm gì không. Cắt còn bốn mốc để dòng không bao giờ dài quá tầm mắt.
       */
      points: points.slice(-4).map((pt) => ({
        attemptNo: pt.attemptNo, band: pt.band, expectation: pt.expectation,
        score: pt.score, total: pt.total, passed: pt.passed, attemptKind: pt.attemptKind,
      })),
      /* Lớp thường: điểm đạt/tổng của đề gần nhất, để giao diện ghi "21/40" chứ không ghi band. */
      score: latest?.score ?? null,
      total: latest?.total ?? null,
      ratio,
      kck: !!cycle?.khong_cam_ket,
      /*
       * DƯỚI KỲ VỌNG — hai chương trình, hai cách hỏi. Fast Track so band với kỳ vọng của
       * chính lượt đó; lớp thường so tỷ lệ đạt với ngưỡng của chương trình.
       */
      missed: ratio
        ? (latest ? latest.passed === false : null)
        : (latest?.expectation !== null && latest?.expectation !== undefined && latest
          ? latest.band < latest.expectation : null),
      state,
      caseId: primary?.id ?? null,
      caseTitle: primary ? caseTitleOf(primary) : null,
      /** Case này thuộc lộ trình KHÁC lộ trình đang xem — giao diện phải nói rõ. */
      carriedOver: !!primary?.carried_over,
      caseStatus: primary?.status ?? null,
      sosLevel: primary?.sos_level ?? null,
      /** Case đã kéo qua mấy lượt MT — đây là thứ nói "phương án cũ chưa đạt kết quả". */
      attemptsSpanned: milestoneCount,
      parallelCount: mine.filter((c) => c.status !== 'done').length,
      followUntil: primary?.follow_until ?? null,
      followOverdue: !!primary && primary.status !== 'done' && !!primary.follow_until
        && primary.follow_until < demoToday(),
      outcome: primary?.outcome ?? null,
      outcomeLabel: primary?.outcome ? CASE_OUTCOME_LABEL[primary.outcome as CaseOutcome] ?? null : null,
      openActions: openIv.length,
      overdueActionDue: overdueAction?.action_due ?? null,
      /** Hạn ghi kết quả tuần gần nhất của PA đang chạy (bỏ PA chờ duyệt) — ô "Việc cần làm tiếp" dùng (K3-02). */
      nextActionDue: openIv.filter((i) => i.action_due && (i.approval_state ?? '') !== 'pending')
        .map((i) => i.action_due as string).sort()[0] ?? null,
      pendingApproval: interventions.some((i) => i.approval_state === 'pending'),

      /*
       * ĐỦ CÁC CASE CỦA KỸ NĂNG NÀY (mục 4.2) — không chỉ một Case đại diện.
       *
       * Em có hai Case Reading song song thì cái thứ hai phải có đường vào. Trước đây bảng
       * này chỉ trỏ được vào một Case, nên Case còn lại chỉ tồn tại ở một khối khác bên
       * dưới — và khối ấy chính là danh sách lặp mà mục 4.2 bảo bỏ đi.
       *
       * Đang mở trước; trong nhóm mở xếp theo lần cập nhật nghiệp vụ mới nhất rồi ngày tạo.
       */
      cases: mine
        .map((c) => ({
          id: c.id as number,
          title: caseTitleOf(c),
          status: c.status as string,
          urgency: c.urgency ?? null,
          sosLevel: c.sos_level ?? null,
          carriedOver: !!c.carried_over,
          parallel: !!c.parallel,
          openedOn: c.detected_at ?? null,
          touchedOn: lastTouch(c.id) ?? c.detected_at ?? null,
          /*
           * `c` ở đây đến từ `SELECT * FROM sos_cases` thẳng (không JOIN ra `class_id` như
           * `loadCase()`) — dùng `classId`/`studentId` đã có sẵn trong phạm vi hàm này, chỉ
           * lấy riêng `skill` theo đúng Case (`sosEditCtx` không dùng được thẳng ở đây vì
           * khác tên trường `class_id`/`eff_student_id`).
           */
          canEdit: can(p, PERMISSIONS.SOS_EDIT, {
            classId: lopDangHoc, studentId,
            skill: c.topic ?? undefined,
          }),
          /* OV-12c: nút "Xác nhận Case" — cùng luật `coTheXacNhanCase` (sửa được Case hoặc GVCN lớp đang học), không thêm câu SQL mỗi Case. */
          coTheXacNhanCase: can(p, PERMISSIONS.SOS_EDIT, { classId: lopDangHoc, studentId, skill: c.topic ?? undefined }) || laGvcnLopDangHoc(p, lopDangHoc),
          /*
           * HOÀN THÀNH CASE NGAY TRÊN THẺ (PR-D). Khối `CasePanel` nhúng bên dưới thẻ đã bị
           * gỡ, nên thẻ tự nói: người xem có chốt được không, và còn gì đang chặn. Lấy đúng
           * hai hàm mà nút "Hoàn thành Case" ở trang riêng vẫn hỏi — không phép tính thứ hai.
           */
          canClose: canCloseCase(p, { class_id: lopDangHoc, student_id: studentId, topic: c.topic }),
          closeBlockers: c.status === 'done' ? [] : closeBlockers(c.id),
          /* Đủ thứ để vẽ MỘT THẺ CASE mà không phải gọi thêm một đường nữa (mục 1 · 2). */
          ...caseCardOf(p, c.id, { ...c, class_id: lopCase(c), eff_student_id: studentId }, soBangChung, boTroMap.get(c.id) ?? null, xinYKienCua, giuKq),
        }))
        .sort((a, b) => {
          const open = (x: typeof a) => (x.status === 'done' ? 1 : 0);
          if (open(a) !== open(b)) return open(a) - open(b);
          const t = (b.touchedOn ?? '').localeCompare(a.touchedOn ?? '');
          if (t !== 0) return t;
          return b.id - a.id;
        }),
    };
  };
  const nhomTruoc = new Map<string, { ct: string | null; lop: string; cases: any[] }>();
  for (const c of caseRows) {
    const t = tuLopTruoc.get(c.id); if (!t) continue;
    const k = `${c.category ?? categoryOf(c.topic)}|${t.ct}|${t.lop}`;
    (nhomTruoc.get(k) ?? nhomTruoc.set(k, { ...t, cases: [] }).get(k)!).cases.push(c);
  }
  const rows = [
    ...[...oChuan, ...oNgoai].map((category) => dongKyNang(category)),
    ...[...nhomTruoc].map(([k, g]) => dongKyNang(k.split('|')[0], g)),
  ];

  return { studentId, cycleId: cycle?.id ?? null, chuongTrinh: ctBang, rows, tamDungTu: tamDungTuCua(student) };
}

/**
 * SỐ BẰNG CHỨNG CỦA NHIỀU CASE MỘT LƯỢT (AN-8, PR-AN). Trước đây mỗi thẻ Case một câu `COUNT(*)` — một em năm Case là năm lượt
 * mạng Turso chỉ để in "Bằng chứng (n)". Case không có dòng nào → không có trong bản đếm (đọc bằng `?? 0`).
 */
export function demBangChungCase(caseIds: number[]): Map<number, number> {
  const ra = new Map<number, number>();
  if (!caseIds.length) return ra;
  const rows = db()
    .prepare(
      `SELECT owner_id AS id, COUNT(*) AS n FROM attachments
        WHERE owner_type = 'sos_case' AND owner_id IN (SELECT value FROM json_each(?))
        GROUP BY owner_id`,
    )
    .all(JSON.stringify(caseIds)) as any[];
  for (const r of rows) ra.set(Number(r.id), Number(r.n));
  return ra;
}

/**
 * MỘT THẺ CASE, ĐỦ ĐỂ ĐỌC MÀ KHÔNG PHẢI MỞ THÊM GÌ.
 *
 * Hồ sơ học viên bày Case thành các khối gọn: phân loại, câu mô tả, rồi MỖI PHƯƠNG ÁN MỘT
 * KHỐI NHỎ có tên, người làm, kết quả gần nhất kèm ngày, hạn cập nhật và ngày dự kiến xong.
 *
 * Gộp sẵn ở máy chủ vì giao diện cần cả mấy thứ này CÙNG LÚC cho từng Case, và một em có thể
 * có năm case: để giao diện tự gọi từng Case một là năm lần gọi cho một lần mở trang.
 *
 * (Trước 21/09/2026 thẻ này còn trả "báo cáo nguồn" của Case Ý thức; Ý thức nay là vi phạm và biện pháp xử lý ở một bảng riêng.)
 */
function caseCardOf(p: Principal, caseId: number, c: any, soBangChung: Map<number, number>, boTro: BoTroDto | null,
  xinYKienCua: ReadonlyMap<number, unknown>, giuKq: ReadonlyMap<number, { id: number | null; ten: string | null }>) {
  const conn = db();
  const today = demoToday();

  /* Hotfix 15/10 (L2): nhóm chính + phụ + nhận xét (Case MT: nhận xét của bài) cho dòng phụ ở hồ sơ HV. */
  const nhomCase = conn
    .prepare(`SELECT taxonomy_code, role, observation FROM case_issues WHERE case_id = ? AND role IN ('primary', 'secondary')
               ORDER BY CASE role WHEN 'primary' THEN 0 ELSE 1 END, id`)
    .all(caseId) as any[];
  const issue = nhomCase.find((i) => i.role === 'primary');

  const ivs = conn
    .prepare(
      `SELECT iv.*, u.full_name AS performer_user_name, rb.full_name AS recorder_user_name FROM case_interventions iv
         LEFT JOIN users u ON u.id = iv.performer_user_id LEFT JOIN users rb ON rb.id = iv.recorded_by
        WHERE iv.case_id = ? AND iv.status != 'cancelled'
        ORDER BY iv.status IN ('completed'), COALESCE(iv.started_date, iv.planned_date, iv.created_at) DESC, iv.id DESC`,
    )
    .all(caseId) as any[];

  const follows = conn
    .prepare(
      `SELECT fu.*, u.full_name AS observer, pt.full_name AS phu_trach_account FROM case_followups fu
         LEFT JOIN users u ON u.id = fu.observer_user_id LEFT JOIN users pt ON pt.id = fu.phu_trach_user_id
        WHERE fu.case_id = ? ORDER BY fu.observed_on DESC, fu.id DESC`,
    )
    .all(caseId) as any[];
  /* PR-S2 (S2): lịch sử điều chỉnh, một truy vấn cho cả Case (gộp nhiều Case: xem plan PR-S2 Q18). */
  const revs = lichSuDieuChinhCuaCase(caseId);
  const mtKe = mtKeTheoPa(caseId);
  /* PR-S5F-a: Case đã đi theo em sang lộ trình mới — PA bổ trợ bắt đầu TRƯỚC lộ trình này là PA của lớp cũ (người dạy cũ ghi tiếp). */
  const batDauLoTrinh: string | null = c.lo_trinh_bat_dau ?? null;   // đọc sẵn trong câu Case của bảng kỹ năng — không thêm câu mỗi thẻ
  const laPaLopCu = (iv: any) => iv.kind === 'bo_tro' && !!batDauLoTrinh
    && String(iv.cycle_started_on ?? iv.started_date ?? iv.planned_date ?? iv.created_at ?? '').slice(0, 10) < batDauLoTrinh;

  const plans = ivs.map((iv) => {
    const last = follows.find((f) => f.intervention_id === iv.id && f.outcome) ?? null;
    const open = iv.status === 'planned' || iv.status === 'started';
    const pending = (iv.approval_state ?? '') === 'pending';
    return {
      id: iv.id as number,
      kind: iv.kind as string,
      kindLabel: INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] ?? iv.kind,
      /* Tên phương án là câu người dạy viết; thiếu thì lùi về tên loại, không để trống. */
      name: (iv.description ?? '').trim() || (INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] ?? iv.kind),
      /* PA theo quy chế SOS (§3.2, PR-K): từ PR-N1 (S4-1) chạy ngay lúc tạo — giao diện hiện dấu `🔒 theo quy chế` cạnh tên. */
      preset: iv.preset === 1,
      confirmedAt: iv.confirmed_at ?? null,
      /* PR-SOS: PA bắt buộc · Chờ xác nhận · chữ mốc · lần ghi tới là "Ghi kết quả cuối" (HangPA, T22, K3-14). */
      batBuoc: iv.preset === 1,
      choXacNhan: iv.kind !== 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned' && !choDoiPa(iv),
      chuaChay: iv.kind === 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned',
      mocChu: iv.preset === 1 ? mocChuPa({ span: iv.moc_quy_che ?? null, followupDue: iv.followup_due ?? null, mtKe: mtKe(iv), daXacNhan: !!iv.confirmed_at, mtCuoi: iv.moc_quy_che === 'until_exam' ? mtCuoiNho(c.cycle_id) : null }, today) : null,
      lanCuoi: iv.status === 'started' && laLanGhiCuoi({ preset: iv.preset === 1, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null, mienPhi: iv.kind === 'bo_tro_mien_phi' }, today),
      performer: iv.performer_user_name ?? iv.performer_name ?? null,
      /** PR-PA (§8): Số buổi + Đã dạy (tổng Số buổi tuần này, từ `follows` đã nạp) — dòng phụ "3/10 buổi" ở bảng kỹ năng. */
      soBuoi: (iv.so_buoi ?? null) as number | null,
      daDay: follows.reduce((n, f) => n + (f.intervention_id === iv.id ? Number(f.so_buoi ?? 0) : 0), 0),
      /** PR-PA (§8): người giữ việc Kết quả (`nguoiGiuKetQua`, bên gọi tính theo lô) — cùng Công việc 2b, chỉ số pa-can-cap-nhat và quyền ghi. */
      nguoiId: giuKq.get(iv.id)?.id ?? null,
      nguoiTen: giuKq.get(iv.id)?.ten ?? null,
      /** PR-PA: người xem ghi được Kết quả PA này không — cùng luật `kiemQuyenPa` (người giữ việc hoặc quyền theo vai trò). */
      ghiDuoc: giuKq.get(iv.id)?.id === p.userId || quyenPaTheoVaiTro(p, iv, c),
      nhom: (iv.nhom_bo_tro ?? null) as string | null,
      status: iv.status as string,
      statusLabel: INTERVENTION_STATUS_LABEL[iv.status as keyof typeof INTERVENTION_STATUS_LABEL] ?? iv.status,
      startedOn: iv.started_date ?? iv.planned_date ?? null,
      completedOn: iv.completed_date ?? null,
      /* HAI HẠN KHÁC NHAU của cùng một phương án, và chúng không được gộp một dòng. */
      actionDue: open ? iv.action_due ?? null : null,
      actionOverdue: !!(open && !pending && iv.action_due && iv.action_due < today),
      followupDue: open ? iv.followup_due ?? null : null,
      followupOverdue: !!(open && iv.followup_due && iv.followup_due < today && !(iv.preset === 1 && !iv.confirmed_at)),
      pendingApproval: pending,
      approvalDue: pending ? iv.approval_due ?? null : null,
      xinYKien: xinYKienCua.get(iv.id) ?? null,
      /*
       * PR-S2: KHÉP LẠI VÌ SAO và PA NÀO THAY NÓ. `superseded` = Được thay thế; `supersededBy` trỏ PA mới.
       * Hành trình (PR-Qb) nối các khối PA theo đúng chuỗi này.
       */
      closedReason: (iv.closed_reason ?? null) as string | null,
      supersededBy: (iv.superseded_by ?? null) as number | null,
      /** PR-S2 (S2): mỗi lần sửa nội dung PA: bản cũ, bản mới, ngày, ai, vì sao. Cũ trước mới sau. */
      revisions: revs.get(iv.id) ?? [],
      lastOutcome: last?.outcome ?? null,
      lastOutcomeLabel: last?.outcome
        ? outcomeLabelFor(last.outcome) : null,
      lastOutcomeOn: last?.observed_on ?? null,
      lastNote: last?.note ?? null,
      /*
       * MỌI LẦN CÓ NGƯỜI NHÌN LẠI VÀ GHI KẾT QUẢ, theo thứ tự thời gian.
       *
       * Dòng thời gian ở tab Hành trình vẽ chúng thành MỐC CÓ NGÀY — không phải mấy cái chấm
       * trắng không đọc được. Một cái chấm không nói được ngày nào, ai ghi, kết quả ra sao,
       * nên nó chỉ là trang trí.
       */
      updates: follows
        .filter((f) => f.intervention_id === iv.id && f.outcome)
        /* PR-S2: `follows` xếp MỚI trước; lật bản sao lại để hai lần CÙNG NGÀY (vd. Điều chỉnh rồi Thay) vẫn đúng thứ tự ghi (sort dưới giữ thứ tự khi trùng ngày). */
        .reverse()
        .map((f) => ({
          on: f.observed_on as string,
          outcome: f.outcome as string,
          label: outcomeLabelFor(f.outcome),
          by: f.observer ?? null,
          /* Mở lịch sử ngay tại dòng phương án (PR-D) thì phải đọc được câu người dạy viết. */
          note: (f.note as string | null) ?? null,
          cycleNo: (f.cycle_no as number | null) ?? null,
          late: !!f.late,
          /* PR-S2 (S4): quyết định của lần đó (continue | adjust | propose | complete | ask_manager | monitor), vấn đề còn tồn, lý do/ghi chú. */
          decision: (f.next_step as string | null) ?? null,
          remainingIssue: (f.remaining_issue as string | null) ?? null,
          decisionNote: (f.decision_note as string | null) ?? null,
          /* PR-PA (§8): Người dạy tuần này (cột cũ `phu_trach_*`). */
          nguoiDay: (f.phu_trach_account ?? f.phu_trach_ten ?? null) as string | null,
        }))
        .sort((a, b) => a.on.localeCompare(b.on)),
    };
  });

  const sos = sosCaseState(caseId);
  const v4 = {
    status: c.status, fromSos: sos.fromSos, hasCause: sos.hasCause, laMt: sos.laMt, dismissed: !!sos.dismissed, systemClosed: !!c.system_close_reason,
    choDuyetKhongTheoDoi: !!sos.choDuyetKhongTheoDoi, coPaChoXacNhan: sos.coPaChoXacNhan, choDoiPa: sos.choDoiPa, hanXacNhan: sos.dueOn, tam: sos.tam,
    lyDoHeThong: c.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[c.system_close_reason as keyof typeof SYSTEM_CLOSE_REASON_LABEL] ?? null : null,
    rutSuaDiem: laRutSuaDiem(c),
  };
  const viecTiep = viecTiepCuaCase(v4, plans.map((pl) => ({
    lopCu: laPaLopCu(ivs.find((iv) => iv.id === pl.id)),
    id: pl.id, ten: tenPaViecTiep(pl.kind, pl.name), batBuoc: pl.batBuoc, choXacNhan: pl.choXacNhan, xong: pl.status === 'completed',
    actionDue: pl.actionDue, followupDue: pl.followupDue, choDuyet: pl.pendingApproval, mienPhi: pl.kind === 'bo_tro_mien_phi',
  })), today, hanThemPa(c))   // OV-11c (HV-14);
  /* Lượt đánh giá mà Case này đã đi qua — "MT2 · 17/08" ở chân thẻ (lớp thường: "Giữa khoá"/"Cuối khoá" thay MT{n}). */
  const attempts = (conn
    .prepare(
      `SELECT DISTINCT m.attempt_no, rp.week_start, a.kind AS attempt_kind FROM case_milestones m
         LEFT JOIN assessment_attempts a ON a.id = m.attempt_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE m.case_id = ? AND m.attempt_no IS NOT NULL
        ORDER BY m.attempt_no`,
    )
    .all(caseId) as any[])
    .map((r) => ({ attemptNo: r.attempt_no as number, week: r.week_start ?? null, attemptKind: r.attempt_kind ?? null }));

  return {
    /* Chủ đề gốc của Case (§7.5, PR-K) — để giao diện mở đúng danh mục phân loại (`issuesForTopic`) khi "Xác định nguyên nhân". */
    topic: c.topic ?? null,
    issueCode: issue?.taxonomy_code ?? null,
    issueLabel: issue?.taxonomy_code ? issueLabel(issue.taxonomy_code) : null,
    nhomPhu: nhomCase.filter((i) => i.role === 'secondary').map((i) => issueLabel(i.taxonomy_code)),
    nhanXet: (issue?.observation ?? null) as string | null,
    summary: c.summary ?? null,
    /* Case tự tạo từ SOS còn chờ GVBM xác định nguyên nhân / xác nhận phương án điền sẵn (§3.2, §7.5 — PR-K). */
    sos,
    /** PR-SOS (T21): tên Case SOS tách ba phần để giao diện vẽ chip `[MT1]` + phần giữa + chip `[SOS 3]` — null với Case tay / lớp thường. */
    tenSos: c.origin_kind === 'mock' && attempts.every((x) => (x.attemptKind ?? 'mock') === 'mock')
      ? { mt: attempts.length ? Math.max(...attempts.map((x) => x.attemptNo)) : null, giua: tenGiuaCua(c), sos: c.sos_level ?? null, kck: !!c.kck } : null,
    /** PR-SOS (§7.3, K3-07): MỘT nhãn trạng thái + MỘT việc tiếp của Case — bảng kỹ năng, Ngăn Case, đầu hồ sơ đọc chung. */
    trangThaiV4: trangThaiCaseV4(v4, today),
    viecTiep,
    nguoiLam: nguoiLamCua(viecTiep, c, plans),
    /** Người phụ trách Case (`owner_user_id`) — việc Xác nhận nguyên nhân / Xác nhận PA của Công việc (Q2). */
    ownerId: (c.owner_user_id ?? null) as number | null,
    plans,
    attempts,
    followUntil: c.follow_until ?? null,
    followOverdue: c.status !== 'done' && !!c.follow_until && c.follow_until < today,
    outcomeLabel: c.outcome ? CASE_OUTCOME_LABEL[c.outcome as CaseOutcome] ?? null : null,
    outcomeNote: c.outcome_note ?? null,
    closedOn: c.closed_at ? String(c.closed_at).slice(0, 10) : null,
    /*
     * NHẬP BÙ (PR-C Task 3, chốt 7) — "ai nhập, nhập lúc nào" phải hiện ngay trên thẻ Case,
     * không giấu trong tooltip. `created_at` là lúc GÕ VÀO hệ thống, khác hẳn `detected_at`
     * (lúc chuyện thật sự xảy ra) — đúng khác biệt chốt 7 đòi phải phân biệt được.
     */
    backfilledBy: c.origin_kind === 'backfill'
      ? ((conn.prepare('SELECT full_name FROM users WHERE id = ?').get(c.reported_by) as any)?.full_name ?? null)
      : null,
    backfilledOn: c.origin_kind === 'backfill' && c.created_at ? String(c.created_at).slice(0, 10) : null,
    /* Số bằng chứng của Case (PR-HV) — để nhãn "Bằng chứng (n)" thu gọn mà không phải tải danh sách tệp. Đếm sẵn cả bảng (AN-8). */
    attachmentCount: soBangChung.get(caseId) ?? 0,
    /** PR-LT2a: khối PA Bổ trợ (xem `boTroCuaCase`) — `null` với Case không có PA bổ trợ. */
    boTro,
  };
}

/**
 * NGƯỜI LÀM VIỆC TIẾP của một Case (PR-VAI-b Q3) — tính MỘT chỗ; cột Việc tiếp, thẻ điện thoại và thanh việc cùng đọc. Cùng luật người làm
 * với Công việc (Q2): Xác nhận nguyên nhân / Xác nhận PA / Thêm PA → người phụ trách Case · Ghi kết quả → người ghi PA ·
 * Chờ Quản lý duyệt → "Quản lý" (vai, không tên). Tên đọc sẵn trong câu Case / câu PA (JOIN) — không câu thêm.
 */
function nguoiLamCua(v: { chu: string; paId?: number } | null, c: any, plans: { id: number; nguoiId: number | null; nguoiTen: string | null }[]): { id: number | null; ten: string | null } | null {
  if (!v) return null;
  if (v.chu.startsWith('Chờ Quản lý')) return { id: null, ten: 'Quản lý' };
  const pa = v.paId ? plans.find((pl) => pl.id === v.paId) : null;
  const [id, ten] = pa ? [pa.nguoiId, pa.nguoiTen] : [c.owner_user_id ?? null, c.owner_name ?? null];
  return id ? { id, ten } : null;
}

// ================================================================ điểm GV tự đánh giá

/**
 * Một con số giáo viên tự chấm khi cập nhật kết quả hoặc kết luận case.
 *
 * `component` là THÀNH PHẦN cụ thể trong kỹ năng — Section 3 của Listening, Lexical
 * Resource của Speaking (mục 9.3). Để trống nghĩa là chấm chung cả kỹ năng. Mỗi kỹ năng chỉ
 * ghi một dòng chung, nhưng ghi được nhiều thành phần khác nhau trong cùng một lần.
 */
export type TeacherMetric = { skill: string; component?: string | null; score: number; total: number | null };

/**
 * ĐIỂM GIÁO VIÊN TỰ ĐÁNH GIÁ — kiểm tra và chuẩn hoá (mục 7.7 [5] Option 2).
 *
 * Đây là con số CÔ TỰ CHẤM, không phải điểm phòng thi. Nó được lưu riêng, không ghi đè điểm
 * chính thức, không đổi mức SOS, và trên biểu đồ tiến bộ nó là ký hiệu khác — không nối
 * chung một đường với điểm chính thức. Trộn hai loại điểm vào một đường là tự tạo ra một
 * "xu hướng" mà không ai chấm cả hai đầu bằng cùng một thước.
 *
 * Hai cách ghi, tuỳ lớp:
 *   · có TỔNG ĐIỂM → hiểu là điểm đạt/tổng, ví dụ 24/40 (lớp thường, hoặc số câu đúng)
 *   · không có tổng → hiểu là BAND 0–9 bước 0,5 (lớp Fast Track)
 */
export function parseMetrics(raw: unknown): TeacherMetric[] | null {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) && v.length ? (v as TeacherMetric[]) : null;
  } catch { return null; }
}

export function normalizeMetrics(input: unknown): TeacherMetric[] | null {
  if (input === undefined || input === null) return null;
  if (!Array.isArray(input)) throw badRequest('Điểm đánh giá phải là một danh sách.');
  const out: TeacherMetric[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const m = raw as any;
    const skill = String(m?.skill ?? '');
    if (!(CASE_CATEGORIES as readonly string[]).includes(skill)) {
      throw badRequest('Điểm đánh giá phải gắn với một kỹ năng cụ thể.');
    }
    /*
     * THÀNH PHẦN phải thuộc đúng kỹ năng đó (mục 9.3): không ghi "Passage 2" cho một Case
     * Listening. Danh mục thành phần là của chung, nên chỉ có một chỗ quyết định.
     */
    const component = (m?.component ?? '').toString().trim() || null;
    if (component && !(componentsFor(skill) as readonly string[]).includes(component)) {
      throw loi(400, '"{component}" không phải thành phần của {kyNang}.', { component, kyNang: CASE_CATEGORY_LABEL[skill as CaseCategory] ?? skill });
    }
    const key = `${skill}::${component ?? ''}`;
    if (seen.has(key)) {
      throw badRequest('Mỗi thành phần chỉ ghi được một điểm trong cùng một lần cập nhật.');
    }
    seen.add(key);
    /*
     * L/R KHÔNG CÓ BAND THEO SECTION/PASSAGE. Ghi "Section 3: 5.0" thì ba tháng sau người
     * đọc tưởng đó là band IELTS — một con số không tồn tại. Bắt ghi đạt/tổng.
     */
    if (component && componentsAreCounts(skill)
        && (m?.total === null || m?.total === undefined || m?.total === '')) {
      throw loi(400, '{component} ghi theo số câu đạt/tổng số câu, không phải band.', { component });
    }
    const score = Number(m?.score);
    if (!Number.isFinite(score) || score < 0) throw badRequest('Điểm đánh giá phải là số không âm.');
    const total = m?.total === null || m?.total === undefined || m?.total === '' ? null : Number(m.total);
    if (total !== null) {
      if (!Number.isFinite(total) || total <= 0) throw badRequest('Tổng điểm phải là số lớn hơn 0.');
      if (score > total) throw badRequest('Điểm đạt không thể lớn hơn tổng điểm.');
    } else {
      if (score > 9) throw badRequest('Không có tổng điểm thì đây là band, phải nằm trong 0–9.');
      if (Math.round(score * 2) !== score * 2) throw badRequest('Band chỉ nhận bước 0,5.');
    }
    out.push({ skill, component, score, total });
  }
  return out.length ? out : null;
}

// ================================================================ chu kỳ xử lý

/**
 * CẬP NHẬT KẾT QUẢ — HAI TAB, HAI VIỆC KHÁC NHAU (mục 9.1).
 *
 *   · TIẾP TỤC THEO DÕI — ghi kết quả của tuần vừa rồi rồi lưu. Phương án VẪN ĐANG CHẠY,
 *     không phải chọn thêm bước tiếp theo, và không đẻ ra một phương án thứ hai giống hệt
 *     chỉ để sang tuần mới.
 *   · KẾT THÚC PHƯƠNG ÁN — cần NGÀY HOÀN THÀNH THẬT và một bước tiếp theo có nghĩa.
 *
 * Chỉ tab kết thúc (hoặc nhập lịch sử "đã xong" có ngày thật) mới khép được một phương án.
 * "Chưa đủ dữ liệu" không đóng được gì: nó là câu trả lời trung thực khi chưa có bài mới,
 * chứ không phải một kết luận.
 *
 * Hạn cũ và việc cập nhật trễ được GIỮ NGUYÊN trong lịch sử. Mở chu kỳ mới không xoá dấu
 * vết chu kỳ cũ đã quá hạn; che quá hạn đi thì con số "bao nhiêu việc trễ" mất nghĩa.
 */
/**
 * OV-12a: hạn kế sau một lần ghi Kết quả — `hanKe` theo lịch kỳ từ ngày bắt đầu PA. Bổ trợ miễn phí ghi trước ngày Mini Test (chưa phải lần cuối):
 * GIỮ hạn hiện tại — PA khép ở Mini Test, hạn kỳ đầu thường sau ngày đó. Một hàm cho dòng chính và dòng chép của nhóm.
 */
function hanKeSauGhi(iv: any, ngayGhi: string): string {
  if (iv.kind === 'bo_tro_mien_phi' && iv.action_due) return iv.action_due;
  return hanKe(iv.started_date ?? iv.cycle_started_on ?? ngayGhi, iv.action_due ?? null, ngayGhi);
}

export function updateResult(p: Principal, interventionId: number, input: {
  /** 'monitor' = tiếp tục theo dõi (mặc định) · 'end' = kết thúc phương án. */
  mode?: string;
  outcome: string;
  note?: string | null;
  nextStep?: string;
  observedOn?: string | null;
  /** Chỉ tab KẾT THÚC: ngày phương án thật sự hoàn thành. */
  completedOn?: string | null;
  evidenceAttemptId?: number | null;
  /** Chỉ dùng khi `nextStep = 'propose'`: phương án mới thay cho phương án này. */
  newPlan?: {
    kind: string; description?: string | null;
    performerUserId?: number | null; performerName?: string | null;
    rescheduleTarget?: string | null;
    performerSelf?: boolean;
    /** Phương án mới là đề xuất "Khác" (`other_proposal`): chữ ô Ghi rõ (T13). */
    ghiRoKhac?: string | null;
    /** PR-PA (§8): Số buổi của PA mới (Thay PA dùng cùng form Thêm PA). */
    soBuoi?: unknown;
  } | null;
  /** Như `newPlan.ghiRoKhac` — nhận cả ở cấp ngoài cho tiện gửi từ form. */
  ghiRoKhac?: string | null;
  /**
   * PR-S2 (S4): quyết định của lần cập nhật: keep | adjust | replace | end | ask_manager. Có thì thay cho cặp `mode`/`nextStep`
   * (dịch bằng `decisionToStep`). Payload cũ không có `decision` giữ nguyên ý nghĩa.
   */
  decision?: string;
  /** PR-LT2b (M-05): PA Bổ trợ miễn phí — lần ghi CUỐI bắt buộc kèm Mini Test (% · ngày làm). */
  miniTest?: { tyLe?: unknown; ngay?: unknown } | null;
  /** PR-S2 (S4): vấn đề còn tồn. Tuỳ chọn, tối đa 300 ký tự. */
  remainingIssue?: string | null;
  /** PR-S2: lý do (bắt buộc khi Điều chỉnh hoặc Thay) hoặc ghi chú (tuỳ chọn). */
  decisionNote?: string | null;
  /**
   * PR-S2 (S2): nội dung mới khi Điều chỉnh. Trường không gửi = giữ nguyên. Không có `kind`: đổi loại là Thay.
   * Với `decision: 'adjust'`, `performerSelf`/`performerUserId`/`performerName` ở cấp ngoài bị bỏ qua (người thực hiện của
   * Điều chỉnh thắng), và `followup_due` không đổi thì giữ đúng như cũ.
   */
  adjust?: {
    description?: string | null;
    performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
    followupDue?: string | null;
    /** PR-PA (§8): Số buổi mới của PA — ≥ đã dạy (tính cả tuần này); null = xoá. */
    soBuoi?: unknown;
  } | null;
  /** Người thực hiện chu kỳ vừa rồi, nếu chưa ghi lúc lên kế hoạch. */
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
  /** Điểm GIÁO VIÊN TỰ CHẤM kèm theo — không phải điểm chính thức. */
  metrics?: unknown;
  /**
   * PR-PA (§8): Người dạy tuần này — tài khoản nhân viên hoặc tên ngoài (lưu cột cũ `phu_trach_*`, X2). Không đổi người của PA.
   * Bắt buộc khi PA có Số buổi và `soBuoi ≥ 1`; Tự học không có ô người (bỏ qua).
   */
  nguoiDay?: { performerUserId?: number | null; performerName?: string | null } | null;
  /** PR-PA (§8): Số buổi tuần này — bắt buộc khi PA có Số buổi, số nguyên 0–60 (0 = em nghỉ). */
  soBuoi?: unknown;
  /** OV-12h: PA Tutor có Số buổi — đúng `soBuoi` dòng [Tên tutor · Nhận xét buổi] (`kiemBuoiTutor`). */
  buoi?: unknown;
  /** OV-13b: "Lưu kết quả · gửi QL duyệt" — kết quả kỳ lưu như Giữ nguyên + Đề xuất PA khác cho PA mặc định đang chạy (`doiPa.ts`). */
  deXuatPa?: VaoDoiPa | null;
}, opts: {
  /** OV-7b (`suaKetQua`): nơi gọi tự trả Case — bỏ `caseDetail` trong giao dịch. */
  khongTraCase?: boolean;
  /** OV-7b: thẻ Xin ý kiến đang chờ là của CHÍNH lần ghi đang sửa — nơi gọi tự viết lại, không nối "Bổ sung" + chuông lần hai. */
  giuYeuCau?: boolean;
  /** OV-12h: sửa lần ghi CŨ của Tutor chưa từng có số buổi — không hỏi Số buổi kỳ này / dòng buổi (giữ như trước). */
  giuCu?: boolean;
  /** TU-a: `suaKetQua` đường đảo — dòng buổi của lần ghi đang sửa (đọc TRƯỚC khi đảo): giữ `ghi_luc` / `lop_id`, lần ghi cũ không bắt 3 ô. */
  buoiTruoc?: DongBuoiCu[];
} = {}) {
  const conn = db();
  const iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  const c = loadCase(iv.case_id);
  kiemQuyenPa(p, iv, c);
  chanPaChuaChay(iv, 'Phương án điền sẵn này chưa được xác nhận — xác nhận (hoặc sửa / thay) trước khi ghi kết quả.');

  /*
   * PR-S2 (S4): `decision` là cách gọi mới, dịch về ĐÚNG cặp `mode`/`nextStep` mà mọi luật bên dưới đã kiểm.
   */
  let modeIn = input.mode;
  let stepIn = input.nextStep;
  if (input.decision !== undefined) {
    if (!(PLAN_DECISIONS as readonly string[]).includes(input.decision)) throw badRequest('Quyết định không hợp lệ.');
    ({ mode: modeIn, nextStep: stepIn } = decisionToStep(input.decision as PlanDecision));
  }
  const mode = modeIn && (RESULT_MODES as readonly string[]).includes(modeIn)
    ? modeIn : 'monitor';
  if (!(FOLLOWUP_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Kết quả không hợp lệ với loại Case này.');
  }
  /*
   * GHI CHÚ CỤ THỂ LÀ BẮT BUỘC (mục 9.1).
   *
   * Một dòng "Tiến bộ một phần" trơ trọi không giúp được người đọc ở tuần sau: tiến bộ ở
   * đâu, còn kẹt chỗ nào, tuần tới làm gì. Đó mới là thứ để so giữa hai chu kỳ.
   */
  const note = (input.note ?? '').trim();
  if (note.length < 8) throw badRequest('Ghi chú phải nói rõ quan sát được gì — ít nhất 8 ký tự.');

  const observedOn = input.observedOn ?? demoToday();
  if (!isIsoDate(observedOn)) throw badRequest('Ngày cập nhật không hợp lệ.');
  if (observedOn > demoToday()) throw badRequest('Không ghi được ngày cập nhật ở tương lai.');

  /*
   * PR-SOS (T22, T63, K3-12, M-17): ở form Kết quả, PA THEO QUY CHẾ không thay, không kết thúc sớm. Lần ghi chạm/qua mốc (`laLanGhiCuoi`) là "Ghi kết
   * quả cuối": bỏ qua quyết định, PA khép `het_moc` — không tự đóng im lặng. OV-13a (C): kết thúc sớm là việc của GVCN / QL (`ketThucPaQuyChe`, có lý do).
   */
  const batBuoc = iv.preset === 1;
  const lanCuoi = laLanGhiCuoi({ preset: batBuoc, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null, mienPhi: iv.kind === 'bo_tro_mien_phi' }, observedOn);
  if (batBuoc && !lanCuoi) {
    const cam = input.decision !== undefined
      ? !quyetDinhChoPa({ preset: true }, false).includes(input.decision as PlanDecision)
      : mode === 'end';
    if (cam) throw badRequest('PA theo quy chế — không thay, không kết thúc sớm. GVCN / Quản lý: "Kết thúc PA" ở menu ⋯ của PA, kèm lý do.');
  }

  /*
   * TAB THEO DÕI không hỏi bước tiếp theo: ghi xong là lưu, phương án chạy tiếp một chu kỳ
   * mới. Đó là cả điểm của việc tách hai tab.
   */
  let nextStep = lanCuoi ? 'complete' : mode === 'end' ? (stepIn ?? '') : (stepIn === 'adjust' ? 'adjust' : 'continue');
  let completedOn: string | null = null;

  if (lanCuoi) {
    /* K3-13: "Chưa đủ dữ liệu" ở lần cuối được, kèm lý do — PA khép, không vào hiệu quả. */
    completedOn = observedOn;
    if (!canEndWithOutcome(input.outcome) && !String(input.decisionNote ?? '').trim()) {
      throw badRequest('"Chưa đủ dữ liệu" ở lần ghi cuối thì ghi Lý do.');   // T7 (PR-MTa): không tối thiểu ký tự
    }
  } else if (mode === 'end') {
    /* PR-S2 (Q2): Chưa đủ dữ liệu vẫn không Kết thúc suông, nhưng THAY được (`endStepsFor('insufficient')` = ['propose']). */
    if (!canEndWithOutcome(input.outcome) && nextStep !== 'propose') {
      throw badRequest('"Chưa đủ dữ liệu" thì chưa kết thúc phương án được, chọn Giữ nguyên, Điều chỉnh hoặc Thay PA.');
    }
    const allowed = stepsForMode('end', input.outcome);
    if (!(allowed as readonly string[]).includes(nextStep)) {
      throw badRequest(
        `Kết quả "${outcomeLabelFor(input.outcome)}" chỉ kết thúc được bằng: `
        + allowed.map((x) => NEXT_STEP_LABEL[x]).join(' · '),
      );
    }
    completedOn = input.completedOn ?? observedOn;
    if (!isIsoDate(completedOn)) throw badRequest('Ngày hoàn thành không hợp lệ.');
    if (completedOn > demoToday()) throw badRequest('Không ghi được ngày hoàn thành ở tương lai.');
    if (nextStep === 'propose' && !input.newPlan?.kind) {
      throw badRequest('Chọn "Thay PA" thì phải nói rõ phương án mới là gì.');
    }
  }
  /*
   * PR-S2: VÌ SAO ĐỔI là điều luật bắt buộc audit (rulebook §18.2 điểm 2). Điều chỉnh và Thay phải có lý do.
   * Kiểm SAU các lỗi của `mode === 'end'` để câu "phương án mới là gì" vẫn báo trước (phép kiểm [9.1]).
   */
  const decisionNote = String(input.decisionNote ?? '').trim() || null;
  if ((nextStep === 'adjust' || nextStep === 'propose') && !decisionNote) {
    throw badRequest('Điều chỉnh hoặc thay phương án thì phải ghi Lý do.');   // T7 (PR-MTa): không tối thiểu ký tự
  }
  /* PR-DUYET (T64): câu hỏi gửi Quản lý là nội dung của thẻ Xin ý kiến — bắt buộc. */
  if (nextStep === 'ask_manager' && (decisionNote ?? '').length < 8) {
    throw badRequest('Xin hỗ trợ Quản lý thì ghi rõ cần Quản lý giúp gì, ít nhất 8 ký tự.');
  }
  /* T13: thay sang PA đề xuất "Khác" — báo thiếu Ghi rõ TRƯỚC khi ghi gì (`recordIntervention` kiểm lại lần nữa). */
  if (nextStep === 'propose' && input.newPlan?.kind === 'other_proposal') {
    const sai = kiemGhiRoKhac(input.newPlan.ghiRoKhac ?? input.ghiRoKhac);
    if (sai) throw loi(400, 'PA đề xuất "Khác": {loi}.', { loi: sai });
  }
  /* PR-LT2b: lần ghi cuối của PA Bổ trợ miễn phí = ghi Mini Test (một lần cho cả nhóm). Kiểm TRƯỚC khi ghi gì. */
  const mtDong = iv.kind === 'bo_tro_mien_phi' && lanCuoi
    ? conn.prepare('SELECT * FROM mini_test WHERE nhom_bo_tro = ? AND ty_le IS NULL').get(iv.nhom_bo_tro) as any : null;
  if (mtDong && !input.miniTest) throw badRequest('Kết quả cuối của bổ trợ miễn phí thì nhập Mini Test (% và ngày làm).');
  const mtGhi = mtDong ? kiemMiniTest(mtDong, input.miniTest!) : null;
  const { remainingIssue, soBuoiTuan, nguoiDay, metrics } = chuKetQuaTuan(p, iv, c, input, !!opts.giuCu);
  const buoi = buoiTutorCua(iv, soBuoiTuan, input.buoi, !!opts.giuCu, laBuoiCu(opts.buoiTruoc ?? []));
  /* Điều chỉnh: chuẩn hoá TRƯỚC giao dịch; sai thì không ghi gì. Số buổi mới ≥ đã dạy SAU tuần này. */
  const adjustPatch = nextStep === 'adjust'
    ? chuanHoaDieuChinh(p, iv, input.adjust, observedOn, daDayCua(interventionId) + (soBuoiTuan ?? 0)) : null;
  if (input.deXuatPa) {
    /* Câu nói đúng vì sao: lần ghi cuối thì PA khép (không còn gì để đổi); còn lại chỉ đi cùng Giữ nguyên. */
    if (lanCuoi) throw badRequest('Đây là lần ghi kết quả cuối — PA kết thúc, không đề xuất PA khác.');
    if (nextStep !== 'continue') throw badRequest('Đề xuất PA khác chỉ đi cùng quyết định Giữ nguyên — PA hiện tại chạy tới khi Quản lý duyệt.');
    kiemTruocDoiPa(p, iv, input.deXuatPa);
  }

  return tx(() => {
    const cycleNo = iv.cycle_no ?? 1;
    const cycleDue = iv.action_due ?? iv.followup_due ?? null;
    /* Cập nhật SAU hạn vẫn ghi đúng là trễ — không reset để che. */
    const late = cycleDue !== null && observedOn > cycleDue ? 1 : 0;

    const fInfo = conn
      .prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                     outcome, note, evidence_attempt_id,
                                     next_step, cycle_no, cycle_due, late, metrics,
                                     remaining_issue, decision_note, created_at, phu_trach_user_id, phu_trach_ten, so_buoi)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(iv.case_id, interventionId, observedOn, p.userId,
           input.outcome, note, input.evidenceAttemptId ?? null,
           nextStep, cycleNo, cycleDue, late, metrics ? JSON.stringify(metrics) : null,
           remainingIssue, decisionNote, nowIso(), nguoiDay?.userId ?? null, nguoiDay?.name ?? null, soBuoiTuan);
    const followupId = Number(fInfo.lastInsertRowid);
    ghiBuoiTutor(conn, followupId, buoi, c.class_id ?? null, opts.buoiTruoc ?? []);

    /*
     * PR-Form: CHỈ CHUẨN HOÁ VÀ GHI ĐÈ KHI BODY THẬT SỰ GỬI MỘT TRONG BA TRƯỜNG NGƯỜI THỰC HIỆN. Trước đây
     * `performer_name = COALESCE(?, performer_name)` giữ tên cũ khi chỉ gửi `performerUserId` — kết quả là CẢ HAI cột
     * cùng có giá trị, phá luật "chỉ một trong hai" (Q5). Nay không gửi gì thì giữ nguyên cả hai cột đúng như cũ.
     */
    const nguoiGuiLen = coNguoiDay(iv.kind) && (input.performerSelf || input.performerUserId != null || (input.performerName ?? '').trim())   // PR-PA: Tự học không người
      ? chuanHoaNguoiThucHien(p, input, { nhom: 'giao_vien', batBuoc: false })
      : null;
    const performerUserId = nguoiGuiLen ? nguoiGuiLen.userId : iv.performer_user_id;
    const performerNameToSave = nguoiGuiLen ? nguoiGuiLen.name : iv.performer_name;
    let created: number | null = null;

    if (nextStep === 'complete') {
      /* Khép lại vì ĐÃ XONG — khác hẳn khép lại vì bị thay thế. */
      conn
        .prepare(
          `UPDATE case_interventions
              SET status = 'completed', completed_date = ?, closed_reason = ?,
                  started_date = COALESCE(started_date, cycle_started_on, ?),
                  performer_user_id = ?, performer_name = ?,
                  updated_at = ?
            WHERE id = ?`,
        )
        .run(completedOn, lanCuoi ? 'het_moc' : 'done', completedOn, performerUserId ?? null, performerNameToSave ?? null,
             nowIso(), interventionId);
    } else if (nextStep === 'monitor' || nextStep === 'continue' || nextStep === 'adjust' || nextStep === 'ask_manager') {
      /*
       * MỞ CHU KỲ MỚI trên CHÍNH phương án này. Không tạo một phương án thứ hai giống hệt:
       * đó vẫn là cùng một việc, chỉ là làm tiếp thêm một vòng nữa.
       *
       * HẠN GHI KẾT QUẢ (OV-12a): hạn CỐ ĐỊNH theo lịch kỳ hai tuần của PA (`hanKe`) — ghi sớm / muộn đều khép kỳ đang đòi, ghi bù
       * khép mọi kỳ đã qua, ghi thêm khi kỳ đang đòi chưa bắt đầu thì giữ hạn. Ghi đúng Thứ Ba hạn → hạn kỳ sau, không phải hôm nay.
       *
       * MỐC giữ nguyên (PR-SOS Q28-4: không còn "dự kiến kết thúc" mặc định — PA thường luôn NULL, PA quy chế giữ mốc quy chế).
       *
       * PR-DUYET (T64, K3-11): "Xin hỗ trợ QL" lưu y như Giữ nguyên — PA KHÔNG dừng, không mất mốc (T22) — rồi gửi câu hỏi
       * thành thẻ Xin ý kiến (ngay dưới). Trước đây PA dừng hẳn chờ Quản lý.
       */
      const nextDue = hanKeSauGhi(iv, observedOn);
      conn
        .prepare(
          `UPDATE case_interventions
              SET status = 'started', cycle_no = ?, cycle_started_on = ?, action_due = ?,
                  started_date = COALESCE(started_date, cycle_started_on, ?),   -- OV-12a: ngày bắt đầu = gốc lịch kỳ, không lấy ngày ghi
                  performer_user_id = ?, performer_name = ?,
                  updated_at = ?
            WHERE id = ?`,
        )
        .run(cycleNo + 1, observedOn, nextDue, observedOn,
             performerUserId ?? null, performerNameToSave ?? null, nowIso(), interventionId);
      /* PR-S2 (S2): Điều chỉnh = cùng PA, đợt mới như Giữ nguyên, rồi đưa bản mới vào và ghi MỘT dòng lịch sử (bản cũ là `iv`). */
      if (nextStep === 'adjust') {
        apDungDieuChinh(iv, adjustPatch!, { followupId, actorUserId: p.userId, reason: decisionNote!, on: observedOn });
      }
    } else if (nextStep === 'propose') {
      /*
       * PHƯƠNG ÁN CŨ ĐƯỢC THAY, KHÔNG PHẢI ĐÃ THÀNH CÔNG. Ghi rõ lý do "Được thay thế" và
       * nối sang phương án mới, để lịch sử không đọc thành "đã hoàn thành tốt đẹp".
       */
      const detail = recordIntervention(p, iv.case_id, {
        thayThe: true,
        kind: input.newPlan!.kind,
        description: input.newPlan!.description ?? null,
        performerSelf: input.newPlan!.performerSelf ?? false,
        performerUserId: input.newPlan!.performerUserId ?? null,
        performerName: input.newPlan!.performerName ?? null,
        status: 'started', startedDate: observedOn,
        rescheduleTarget: input.newPlan!.rescheduleTarget ?? null,
        ghiRoKhac: input.newPlan!.ghiRoKhac ?? input.ghiRoKhac ?? null,
        soBuoi: input.newPlan!.soBuoi,
      }) as any;
      created = (conn
        .prepare('SELECT id FROM case_interventions WHERE case_id = ? ORDER BY id DESC LIMIT 1')
        .get(iv.case_id) as any)?.id ?? null;
      void detail;
      conn
        .prepare(
          `UPDATE case_interventions
              SET status = 'completed', completed_date = ?, closed_reason = 'superseded',
                  superseded_by = ?, updated_at = ?
            WHERE id = ?`,
        )
        .run(completedOn ?? observedOn, created, nowIso(), interventionId);
    }
    if (input.deXuatPa) ghiDoiPa(p, interventionId, input.deXuatPa, followupId);
    if (nextStep === 'ask_manager') {
      const doiTuong = { loai: 'xin_y_kien' as const, doiTuongLoai: 'intervention', doiTuongId: interventionId };
      /* Lần 1 còn chờ (một thẻ chờ cho mỗi PA): KHÔNG ném lỗi — kết quả tuần đã lưu; câu hỏi mới nối vào thẻ đang chờ + báo lại QL. */
      const moi = taoYeuCau(conn, {
        ...doiTuong, hocVienId: c.eff_student_id, lopId: c.class_id ?? null, nguoiXin: p.userId,
        lyDo: decisionNote, duLieu: { followupId },
      });
      if (moi === null && !opts.giuYeuCau) boSungYeuCau(conn, doiTuong, { lyDo: decisionNote, duLieu: { followupId }, ngay: observedOn });
    }

    dongBoTrangThaiCase(iv.case_id);
    /* PR-LT2a (M-03): PA bổ trợ chung — chép kết quả sang các dòng khác của nhóm. */
    chepKetQuaNhom(conn, iv, followupId, {
      nextStep, observedOn, completedOn, lanCuoi, nextDue: hanKeSauGhi(iv, observedOn),
      apDungDieuChinh: (sib, fid) => apDungDieuChinh(sib, adjustPatch!, { followupId: fid, actorUserId: p.userId, reason: decisionNote!, on: observedOn }),
    });
    if (mtDong && mtGhi) ghiMiniTestTrongTx(conn, p, mtDong, mtGhi, input.outcome);   // PR-LT2b: sau khi cả nhóm đã khép · OV-11c: Case theo mức GV chọn

    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: 'followup', eventDate: observedOn,
      title: `Kết quả sau hỗ trợ: ${outcomeLabelFor(input.outcome)}`,
      detail: chiTietKetQua(iv.kind, nextStep, note, decisionNote, remainingIssue),
      refTable: 'case_followups', refId: followupId, createdBy: p.userId,
      dedupKey: `followup:${followupId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.result.update',
      entityType: 'case_intervention', entityId: interventionId,
      entityLabel: iv.description ?? iv.kind,
      after: { outcome: input.outcome, mode, nextStep, late: !!late, cycleNo, remainingIssue, decisionNote, adjust: adjustPatch },
    });
    return opts.khongTraCase ? null : caseDetail(p, iv.case_id);
  });
}

/** Phần chữ của một lần ghi Kết quả — Vấn đề còn tồn, Số buổi / Người dạy tuần này, điểm tự chấm, bằng chứng. Ghi lần đầu và Sửa chữ (OV-7b) dùng chung. */
function chuKetQuaTuan(p: Principal, iv: any, c: any, input: {
  remainingIssue?: string | null; soBuoi?: unknown; metrics?: unknown; evidenceAttemptId?: number | null;
  nguoiDay?: { performerUserId?: number | null; performerName?: string | null } | null;
}, cu = false) {
  const remainingIssue = String(input.remainingIssue ?? '').trim() || null;
  if (remainingIssue && remainingIssue.length > 300) throw badRequest('Vấn đề còn tồn / Ghi chú tối đa 300 ký tự.');
  /* PR-PA (§8): PA có Số buổi → Số buổi tuần này bắt buộc (0–60). PA không Số buổi: không lưu số.
     PR-CT2: Người dạy tuần này KHÔNG bắt buộc; có thì vẫn kiểm (tài khoản đang làm việc / tên ngoài). */
  const coDem = coSoBuoiKy({ kind: iv.kind, soBuoi: iv.so_buoi ?? null, cu });   // OV-12h: mọi PA Tutor có ô này
  const loiTuan = coDem ? kiemSoBuoiTuan(input.soBuoi) : null;
  if (loiTuan) throw loi(400, 'Số buổi kỳ này: {loi}.', { loi: loiTuan });
  const soBuoiTuan = coDem ? soBuoiTu(input.soBuoi) : null;
  const nguoiDay = coNguoiDay(iv.kind)
    ? chuanHoaNguoiThucHien(p, input.nguoiDay ?? {}, { nhom: 'nhan_vien', batBuoc: false, nhan: 'Người dạy tuần này' }) : null;
  const metrics = normalizeMetrics(input.metrics);
  if (input.evidenceAttemptId) {
    const a = db().prepare('SELECT student_id FROM assessment_attempts WHERE id = ?').get(input.evidenceAttemptId) as any;
    if (!a || a.student_id !== c.eff_student_id) throw badRequest('Bằng chứng không thuộc học viên này.');
  }
  return { remainingIssue, soBuoiTuan, nguoiDay, metrics };
}

/**
 * OV-12h: MỌI PA Tutor → bắt buộc đúng `soBuoiTuan` dòng buổi (0 buổi = không dòng); loại khác / sửa lần ghi cũ (`cu`) → null (không ghi bảng).
 * TU-a: 3 ô Có / Không bắt buộc, trừ lần ghi có dòng buổi từ trước TU-a (`cu3`); `tutorId` phải có trong danh sách tutor.
 */
function buoiTutorCua(iv: any, soBuoiTuan: number | null, buoi: unknown, cu = false, cu3 = false): BuoiTutor[] | null {
  if (!canBuoiTutor({ kind: iv.kind, cu }) || soBuoiTuan === null) return null;
  const sai = kiemBuoiTutor(soBuoiTuan, buoi ?? [], cu3);
  if (sai) throw loi(400, 'Buổi tutor: {loi}.', { loi: sai });
  const ds: BuoiTutor[] = (buoi as any[] ?? []).map((b) => ({
    tutorId: b.tutorId ?? null, tutor: String(b.tutor).trim(), nhanXet: String(b.nhanXet).trim(), hinhThuc: b.hinhThuc ?? null,
    chuanBi: b.chuanBi ?? null, taiLieu: b.taiLieu ?? null, feedbackGv: b.feedbackGv ?? null, danhGia: b.danhGia ?? null,
    nhanXetTutor: String(b.nhanXetTutor ?? '').trim() || null,
  }));
  /* "Tutor khác" (gõ tay): 2–100 ký tự (đặc tả mục 5.1). */
  const ngan = ds.findIndex((b) => !b.tutorId && b.tutor.length < 2);
  if (ngan >= 0) throw loi(400, 'Buổi tutor: buổi {x}: tên tutor ít nhất 2 ký tự.', { x: ngan + 1 });
  const ids = [...new Set(ds.flatMap((b) => (b.tutorId ? [b.tutorId] : [])))];
  if (ids.length) {
    /* Tutor danh sách: tên lưu = tên trong danh sách lúc ghi (bản chụp), không theo chữ web gửi. */
    const ten = new Map((db().prepare(`SELECT id, ten FROM tutors WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) as any[]).map((r) => [r.id as number, r.ten as string]));
    const i = ds.findIndex((b) => b.tutorId && !ten.has(b.tutorId));
    if (i >= 0) throw loi(400, 'Buổi tutor: buổi {x}: tutor không có trong danh sách.', { x: i + 1 });
    for (const b of ds) if (b.tutorId) b.tutor = ten.get(b.tutorId)!;
  }
  return ds;
}
/** TU-a: dòng buổi đã ghi (để giữ `ghi_luc` / `lop_id` khi sửa). */
type DongBuoiCu = { buoi_so: number; chuan_bi: number | null; tai_lieu: number | null; feedback_gv: number | null; danh_gia: number | null; ghi_luc: string | null; lop_id: number | null };
const docBuoiCu = (conn: any, followupId: number): DongBuoiCu[] =>
  conn.prepare('SELECT buoi_so, chuan_bi, tai_lieu, feedback_gv, danh_gia, ghi_luc, lop_id FROM case_followup_buoi WHERE followup_id = ?').all(followupId);
/** Lần ghi có dòng buổi từ trước TU-a (3 ô trống) — Sửa không bắt 3 ô. */
const laBuoiCu = (truoc: DongBuoiCu[]) => truoc.some((r) => r.chuan_bi == null);
/** Cột buổi trả web (caseDetail, Sửa kết quả) — bí danh `b`. */
const COT_BUOI = 'b.tutor_id, b.tutor_ten, b.nhan_xet, b.hinh_thuc, b.chuan_bi, b.tai_lieu, b.feedback_gv, b.danh_gia, b.nhan_xet_tutor';
const coKhong = (v: number | null) => (v == null ? null : v === 1);
const buoiTuDong = (b: any): BuoiTutor => ({
  tutorId: b.tutor_id ?? null, tutor: b.tutor_ten, nhanXet: b.nhan_xet, hinhThuc: b.hinh_thuc ?? null,
  chuanBi: coKhong(b.chuan_bi), taiLieu: coKhong(b.tai_lieu), feedbackGv: coKhong(b.feedback_gv), danhGia: b.danh_gia ?? null, nhanXetTutor: b.nhan_xet_tutor ?? null,
});
/**
 * Ghi (thay) các dòng buổi của một lần ghi Kết quả — trong giao dịch của nơi gọi. `null` = không đụng. TU-a (mục 3.2): dòng cùng `buoi_so` mà 3 ô + đánh giá
 * không đổi giữ `ghi_luc` cũ (mốc nhóm tutor cần xem lại ở trang Tutor), đổi thì `ghi_luc` = lúc sửa; `lop_id` = lớp chụp lần đầu (giữ khi sửa), không có thì lớp em lúc này.
 */
function ghiBuoiTutor(conn: any, followupId: number, buoi: BuoiTutor[] | null, lopId: number | null, truoc: DongBuoiCu[] = docBuoiCu(conn, followupId)): void {
  if (!buoi) return;
  const cu = new Map(truoc.map((r) => [r.buoi_so, r]));
  const luc = nowIso();
  const so = (v: boolean | null | undefined) => (v == null ? null : v ? 1 : 0);
  conn.prepare('DELETE FROM case_followup_buoi WHERE followup_id = ?').run(followupId);
  buoi.forEach((b, i) => {
    const gt = [so(b.chuanBi), so(b.taiLieu), so(b.feedbackGv), b.danhGia ?? null];
    const c = cu.get(i + 1);
    const giu = !!c && [c.chuan_bi, c.tai_lieu, c.feedback_gv, c.danh_gia].every((v, k) => (v ?? null) === gt[k]);
    conn.prepare(`INSERT INTO case_followup_buoi (followup_id, buoi_so, tutor_ten, nhan_xet, tutor_id, hinh_thuc, chuan_bi, tai_lieu, feedback_gv, danh_gia,
        nhan_xet_tutor, lop_id, ghi_luc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(followupId, i + 1, b.tutor, b.nhanXet, b.tutorId ?? null, b.hinhThuc ?? null, ...gt, b.nhanXetTutor ?? null,
        c?.lop_id ?? lopId, giu ? c!.ghi_luc : gt.some((v) => v != null) ? luc : null);
  });
}

/** Dòng chi tiết Hành trình của một lần ghi Kết quả (ghi lần đầu và Sửa chữ dùng chung). */
function chiTietKetQua(kind: string, nextStep: string, note: string, decisionNote: string | null, remainingIssue: string | null): string {
  return [
    INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind,
    NEXT_STEP_LABEL[nextStep as NextStep],
    note || null,
    decisionNote ? `${nextStep === 'adjust' || nextStep === 'propose' ? 'Lý do' : 'Ghi chú'}: ${decisionNote}` : null,
    remainingIssue ? `Còn tồn: ${remainingIssue}` : null,
  ].filter(Boolean).join(' · ');
}

// ---------------------------------------------------------------- OV-7b · Sửa sau khi lưu: Kết quả PA gần nhất · Xem lại sau hỗ trợ

type VaoKetQua = Parameters<typeof updateResult>[2];

/** PA còn đúng trạng thái mà lần ghi Kết quả (gần nhất) để lại — khép bằng đường khác (Mini Test ở hồ sơ, huỷ) thì lần ghi đó không đảo được nữa. */
function paKhopLanGhi(nextStep: string, pa: { status: string; closed_reason?: string | null } | undefined): boolean {
  if (!pa) return false;
  if (nextStep === 'complete') return pa.status === 'completed' && (pa.closed_reason === 'done' || pa.closed_reason === 'het_moc');
  if (nextStep === 'propose') return pa.status === 'completed' && pa.closed_reason === 'superseded';
  return pa.status === 'started';
}
/** Quyết định (nút web) của một lần ghi Kết quả. `null` = "Kết quả cuối" PA quy chế / bổ trợ (không có khối Quyết định). */
function quyetDinhCuaLanGhi(f: any, iv: any): PlanDecision | null {
  if (f.next_step === 'adjust') return 'adjust';
  if (f.next_step === 'propose') return 'replace';
  if (f.next_step === 'ask_manager') return 'ask_manager';
  if (f.next_step === 'complete') return iv.closed_reason === 'het_moc' ? null : 'end';
  return 'keep';   // continue · monitor (dòng cũ)
}
/** Đuôi `boSungYeuCau` nối vào thẻ Xin ý kiến đang chờ khi lần ghi này hỏi tiếp. */
const duoiBoSung = (f: { observed_on: string; decision_note: string | null }) =>
  `\nBổ sung ${f.observed_on.slice(8, 10)}/${f.observed_on.slice(5, 7)}: ${f.decision_note ?? ''}`;
const anhLanGhi = (f: any) => ({
  followupId: f.id, observedOn: f.observed_on, outcome: f.outcome, nextStep: f.next_step, note: f.note, decisionNote: f.decision_note,
  remainingIssue: f.remaining_issue, soBuoi: f.so_buoi, nguoiDay: f.phu_trach_user_id ?? f.phu_trach_ten ?? null,
});

/**
 * NGỮ CẢNH SỬA MỘT LẦN GHI KẾT QUẢ PA (OV-7b) — chỉ đọc + kiểm. 403: không phải người đã ghi / Quản lý. 400 (không sửa được gì): không phải lần gần
 * nhất của PA (cả nhóm bổ trợ), Case đã hoàn thành (trừ Case do chính Mini Test của lần này đóng), PA đã đổi bằng đường khác. `chanDoi`: lý do không
 * ĐỔI được lựa chọn (PA thay thế đã chạy / Quản lý đã trả lời) — sửa chữ vẫn được. Bổ trợ nhóm: dòng chép sang PA anh em (cùng ngày, chữ, lựa chọn,
 * người ghi; mới nhất của PA mình) là CÙNG một lần — dòng chính = id nhỏ nhất (`chepKetQuaNhom` chèn sau dòng chính).
 */
function nguCanhSuaKetQua(p: Principal, followupId: number) {
  const conn = db();
  const f = conn.prepare('SELECT * FROM case_followups WHERE id = ?').get(followupId) as any;
  if (!f || !f.intervention_id || !f.next_step) throw notFound('Không tìm thấy lần ghi kết quả PA.');
  const cF = loadCase(f.case_id);
  if (f.observer_user_id !== p.userId && !can(p, PERMISSIONS.CASE_APPROVE, { classId: cF.class_id, studentId: cF.eff_student_id })) {
    throw forbidden('Chỉ người đã ghi lần này hoặc Quản lý sửa được.');
  }
  if (conn.prepare('SELECT 1 FROM case_followups WHERE intervention_id = ? AND id > ? LIMIT 1').get(f.intervention_id, f.id)) {
    throw badRequest('Chỉ sửa được lần ghi gần nhất của PA — lần này đã có lần ghi sau.');
  }
  const ivF = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(f.intervention_id) as any;
  const dong: any[] = ivF.nhom_bo_tro
    ? conn.prepare(`SELECT f2.* FROM case_followups f2 JOIN case_interventions i2 ON i2.id = f2.intervention_id
        WHERE i2.nhom_bo_tro = ? AND f2.observed_on = ? AND f2.outcome IS ? AND f2.note IS ? AND f2.next_step = ? AND f2.observer_user_id IS ?
          AND NOT EXISTS (SELECT 1 FROM case_followups f3 WHERE f3.intervention_id = f2.intervention_id AND f3.id > f2.id) ORDER BY f2.id`)
      .all(ivF.nhom_bo_tro, f.observed_on, f.outcome, f.note, f.next_step, f.observer_user_id) as any[]
    : [f];
  const chinh = dong[0];
  const ph = dong.map(() => '?').join(',');
  if (ivF.nhom_bo_tro && conn.prepare(`SELECT 1 FROM case_followups f2 JOIN case_interventions i2 ON i2.id = f2.intervention_id
      WHERE i2.nhom_bo_tro = ? AND f2.id > ? AND f2.id NOT IN (${ph}) LIMIT 1`).get(ivF.nhom_bo_tro, chinh.id, ...dong.map((r) => r.id))) {
    throw badRequest('PA cùng nhóm bổ trợ đã có lần ghi sau — chỉ sửa được lần ghi gần nhất.');
  }
  const ivs = new Map<number, any>((conn.prepare(`SELECT * FROM case_interventions WHERE id IN (${ph})`)
    .all(...dong.map((r) => r.intervention_id)) as any[]).map((r) => [r.id as number, r]));
  const iv = ivs.get(chinh.intervention_id);
  /* Kết quả cuối bổ trợ miễn phí đã ghi Mini Test (`ghiMiniTestTrongTx`) — sửa thì Mini Test về "chưa ghi" rồi ghi lại. */
  const mt = chinh.next_step === 'complete' && iv.kind === 'bo_tro_mien_phi' && iv.closed_reason === 'het_moc' && iv.nhom_bo_tro
    ? (conn.prepare('SELECT * FROM mini_test WHERE nhom_bo_tro = ? AND ty_le IS NOT NULL').get(iv.nhom_bo_tro) as any) ?? null : null;
  const caseCua = new Map<number, any>([[cF.id, cF]]);
  for (const r of dong) {
    const pa = ivs.get(r.intervention_id);
    if (!caseCua.has(r.case_id)) caseCua.set(r.case_id, loadCase(r.case_id));
    const c = caseCua.get(r.case_id);
    if (c.status === 'done' && !(mt && String(c.outcome_note ?? '').startsWith('Mini Test '))) {
      throw badRequest('Case đã hoàn thành — bấm Mở lại trước khi sửa kết quả.');
    }
    if (!paKhopLanGhi(r.next_step, pa)) {
      throw badRequest(pa.status === 'cancelled' ? 'PA đã huỷ — không sửa kết quả được.'
        : 'PA đã đổi trạng thái sau lần ghi này (vd đã khép khi ghi Mini Test) — lần ghi này không sửa được nữa.');
    }
  }
  /* Thay PA: PA mới đã chạy (có kết quả) hoặc Quản lý đã trả lời đề xuất → không bỏ được lựa chọn Thay. */
  const paMoi = chinh.next_step === 'propose' && iv.superseded_by
    ? (conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(iv.superseded_by) as any) ?? null : null;
  let chanDoi: string | null = null;
  if (paMoi && conn.prepare('SELECT 1 FROM case_followups WHERE intervention_id = ? LIMIT 1').get(paMoi.id)) {
    chanDoi = 'PA thay thế đã có kết quả — chỉ sửa được chữ. Muốn bỏ Thay PA thì nhờ Quản lý xoá PA mới trước.';
  } else if (paMoi && (paMoi.approval_state === 'approved' || paMoi.approval_state === 'declined')) {
    chanDoi = `Quản lý đã ${paMoi.approval_state === 'approved' ? 'duyệt' : 'từ chối'} PA thay thế — chỉ sửa được chữ; ghi kết quả tuần mới ở PA mới.`;
  }
  /* Xin hỗ trợ QL: thẻ của CHÍNH lần này (`du_lieu.followupId`). Đang chờ → viết lại thẳng thẻ; Quản lý đã trả lời → không đổi được. */
  let the: any = null;
  if (chinh.next_step === 'ask_manager') {
    const y = conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE loai = 'xin_y_kien' AND doi_tuong_loai = 'intervention' AND doi_tuong_id = ?
      ORDER BY id DESC LIMIT 1`).get(iv.id) as any;
    let fid: unknown = null;
    try { fid = JSON.parse(y?.du_lieu ?? '{}').followupId; } catch { /* du_lieu hỏng — không phải thẻ của lần này */ }
    if (y && fid === chinh.id && y.trang_thai === 'cho') the = y;
    else if (y && fid === chinh.id && y.trang_thai !== 'tu_dong') chanDoi = 'Quản lý đã trả lời câu hỏi Xin hỗ trợ — chỉ sửa được chữ; ghi kết quả tuần mới nếu cần.';
  }
  /* Câu hỏi lần này NỐI vào thẻ của lần trước ("Bổ sung dd/mm: …") → phần trước giữ lại khi viết lại / bỏ câu hỏi. */
  const lyDoTruoc = the && the.ly_do !== chinh.decision_note && String(the.ly_do ?? '').endsWith(duoiBoSung(chinh))
    ? String(the.ly_do).slice(0, -duoiBoSung(chinh).length) : null;
  return { f, ivF, chinh, dong, ivs, iv, c: caseCua.get(chinh.case_id) ?? loadCase(chinh.case_id), mt, paMoi, the, lyDoTruoc, chanDoi,
    quyetDinh: quyetDinhCuaLanGhi(chinh, iv) };
}
type NguCanhSua = ReturnType<typeof nguCanhSuaKetQua>;

/**
 * SỬA LẦN GHI KẾT QUẢ PA GẦN NHẤT (OV-7b; chủ SP 13/10) — người đã ghi + Quản lý, cùng thân `POST /interventions/:id/result`. Giữ lựa chọn (kết quả,
 * quyết định, ngày) và không gửi lại Điều chỉnh / PA thay / Mini Test = SỬA CHỮ: cập nhật dòng, không đảo gì. Còn lại: ĐẢO hệ quả lần cũ (`daoKetQua`)
 * rồi chạy `updateResult` lần mới — MỘT giao dịch; người ghi giữ như cũ (Quản lý sửa hộ). Nhật ký `case.result.edit` (trước → sau).
 */
export function suaKetQua(p: Principal, followupId: number, input: VaoKetQua) {
  const conn = db();
  const khoaTep: string[] = [];
  /* Đọc + kiểm TRONG giao dịch ghi: hai người sửa cùng lúc thì người sau đọc đúng trạng thái người trước để lại (lần ghi cũ đã thay → 404). */
  const caseId = tx(() => {
    const x = nguCanhSuaKetQua(p, followupId);
    const { chinh, iv } = x;
    const vao: VaoKetQua = {
      ...input, observedOn: input.observedOn ?? chinh.observed_on,
      completedOn: input.completedOn ?? (x.quyetDinh === 'end' ? iv.completed_date : undefined),
    };
    const giuLuaChon = input.outcome === chinh.outcome && (input.decision ?? null) === x.quyetDinh && vao.observedOn === chinh.observed_on
      && (x.quyetDinh !== 'end' || vao.completedOn === iv.completed_date)
      && input.adjust == null && input.newPlan == null && input.miniTest == null;
    if (giuLuaChon) { suaChuKetQua(p, x, vao); return x.f.case_id as number; }
    if (x.chanDoi) throw badRequest(x.chanDoi);
    const buoiTruoc = docBuoiCu(conn, chinh.id);   // TU-a: đọc TRƯỚC khi đảo (xoá lần ghi xoá theo dòng buổi)
    daoKetQua(conn, p, x, khoaTep);
    const truocMax = (conn.prepare('SELECT COALESCE(MAX(id), 0) m FROM case_followups').get() as any).m as number;
    updateResult(p, iv.id, vao, { khongTraCase: true, giuYeuCau: !!x.the, giuCu: chinh.so_buoi == null, buoiTruoc });   // OV-12h: lần ghi cũ không số buổi
    const moi = conn.prepare('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1').get(iv.id) as any;
    /* Quản lý sửa hộ: lần ghi vẫn là của người đã ghi (họ còn sửa tiếp được); ai sửa nằm ở nhật ký. */
    if (chinh.observer_user_id !== p.userId) {
      conn.prepare('UPDATE case_followups SET observer_user_id = ? WHERE id > ? AND observer_user_id = ?').run(chinh.observer_user_id, truocMax, p.userId);
    }
    if (x.the) {
      if (moi.next_step === 'ask_manager') {
        let du: Record<string, unknown> = {};
        try { du = JSON.parse(x.the.du_lieu ?? '{}'); } catch { du = {}; }
        conn.prepare('UPDATE yeu_cau_duyet SET ly_do = ?, du_lieu = ? WHERE id = ?')
          .run(x.lyDoTruoc ? `${x.lyDoTruoc}${duoiBoSung(moi)}` : moi.decision_note, JSON.stringify({ ...du, followupId: moi.id }), x.the.id);
      } else if (x.lyDoTruoc) {
        conn.prepare('UPDATE yeu_cau_duyet SET ly_do = ? WHERE id = ?').run(x.lyDoTruoc, x.the.id);
      } else {
        chotYeuCau(conn, { loai: 'xin_y_kien', doiTuongLoai: 'intervention', doiTuongId: iv.id }, 'tu_dong',
          { nguoiDuyet: p.userId, lyDo: 'Giáo viên sửa kết quả — bỏ Xin hỗ trợ' });
      }
    }
    /* Báo QL Mini Test của lần cũ còn chờ mà lần mới không ghi Mini Test (ngày ghi sửa về trước mốc) → tự đóng. */
    if (x.mt && (conn.prepare('SELECT ty_le FROM mini_test WHERE id = ?').get(x.mt.id) as any)?.ty_le == null) {
      chotYeuCau(conn, { loai: 'bao_len_mini_test', doiTuongLoai: 'mini_test', doiTuongId: x.mt.id }, 'tu_dong', { lyDo: 'Kết quả cuối đã sửa' });
    }
    writeAudit({ actorUserId: p.userId, action: 'case.result.edit', entityType: 'case_intervention', entityId: iv.id,
      entityLabel: iv.description ?? iv.kind, before: anhLanGhi(chinh), after: anhLanGhi(moi) });
    return x.f.case_id as number;
  });
  xoaTepSauGiaoDich(khoaTep);
  return caseDetail(p, caseId);
}

/**
 * HOÀN TÁC LẦN GHI KẾT QUẢ VỪA LƯU (OV-13b: "✓ Đã lưu · Hoàn tác" ở dòng ghi nhanh / panel) — cùng quyền + chặn như Sửa (`nguCanhSuaKetQua`): đảo hệ quả
 * (`daoKetQua`), bỏ thẻ Xin hỗ trợ của chính lần này, rút đề xuất đổi PA gửi cùng lần này. Không cần lý do; nhật ký `case.result.undo`.
 */
export function hoanTacKetQua(p: Principal, followupId: number) {
  const conn = db();
  const khoaTep: string[] = [];
  const caseId = tx(() => {
    /* OV-13b: lần ghi kèm đề xuất đổi PA mà QL đã duyệt — PA mới đang chạy, PA gốc đã khép: không đảo được (nói trước câu chặn chung). */
    if (conn.prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND trang_thai = 'duyet' AND json_extract(du_lieu, '$.followupId') = ?`).get(followupId)) {
      throw badRequest('QL đã duyệt đổi PA — không hoàn tác được.');
    }
    const x = nguCanhSuaKetQua(p, followupId);
    if (x.chanDoi) throw badRequest(x.chanDoi);
    if (x.the) chotYeuCau(conn, { loai: 'xin_y_kien', doiTuongLoai: 'intervention', doiTuongId: x.iv.id }, 'tu_dong', { nguoiDuyet: p.userId, lyDo: 'Giáo viên hoàn tác kết quả' });
    for (const y of conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND trang_thai = 'cho' AND json_extract(du_lieu, '$.followupId') = ?`)
      .all(x.chinh.id) as any[]) {
      chotYeuCau(conn, { loai: 'de_xuat_pa', doiTuongLoai: 'intervention', doiTuongId: y.doi_tuong_id }, 'tu_dong', { nguoiDuyet: p.userId, lyDo: 'Giáo viên hoàn tác kết quả' });
      rutDoiPa(y);
    }
    daoKetQua(conn, p, x, khoaTep);
    writeAudit({ actorUserId: p.userId, action: 'case.result.undo', entityType: 'case_intervention', entityId: x.iv.id,
      entityLabel: x.iv.description ?? x.iv.kind, before: anhLanGhi(x.chinh), after: null });
    return x.f.case_id as number;
  });
  xoaTepSauGiaoDich(khoaTep);
  return caseDetail(p, caseId);
}

/**
 * ĐẢO hệ quả của một lần ghi Kết quả (dòng chính + dòng chép nhóm) — TRONG giao dịch của `suaKetQua`, sau khi `nguCanhSuaKetQua` đã kiểm. Theo mẫu Huỷ
 * quyết định PA: Điều chỉnh (nội dung PA về bản trước, bỏ dòng lịch sử) · Thay PA (xoá PA mới chưa chạy + thẻ của nó) · Mini Test về "chưa ghi" (Case do
 * nó đóng mở lại) · PA về trạng thái ngay trước lần ghi (đợt, hạn) · bỏ dòng kết quả + mốc Hành trình · trạng thái Case. Thẻ Xin hỗ trợ: nơi gọi xử lý.
 */
function daoKetQua(conn: any, p: Principal, x: NguCanhSua, khoaTep: string[]): void {
  const ids = x.dong.map((r) => r.id as number);
  const ph = ids.map(() => '?').join(',');
  const now = nowIso();
  /* Điều chỉnh: chỉ ô chưa ai đổi sau lần ghi (Sửa PA sau đó được giữ). Mọi CASE so với giá trị CŨ của dòng — SQLite đọc dòng trước khi ghi. */
  for (const r of conn.prepare(`SELECT * FROM case_intervention_revisions WHERE followup_id IN (${ph})`).all(...ids) as any[]) {
    conn.prepare(`UPDATE case_interventions SET
        description = CASE WHEN description IS ? THEN ? ELSE description END,
        performer_user_id = CASE WHEN performer_user_id IS ? AND performer_name IS ? THEN ? ELSE performer_user_id END,
        performer_name = CASE WHEN performer_user_id IS ? AND performer_name IS ? THEN ? ELSE performer_name END,
        followup_due = CASE WHEN followup_due IS ? THEN ? ELSE followup_due END,
        so_buoi = CASE WHEN so_buoi IS ? THEN ? ELSE so_buoi END
      WHERE id = ?`).run(r.new_description, r.old_description,
      r.new_performer_user_id, r.new_performer_name, r.old_performer_user_id,
      r.new_performer_user_id, r.new_performer_name, r.old_performer_name,
      r.new_followup_due, r.old_followup_due, r.new_so_buoi, r.old_so_buoi, r.intervention_id);
  }
  conn.prepare(`DELETE FROM case_intervention_revisions WHERE followup_id IN (${ph})`).run(...ids);
  /* Thay PA: PA mới chưa chạy (đã kiểm) xoá hẳn như Xoá PA; thẻ Đề xuất PA của nó tự đóng, không báo người sửa. */
  if (x.paMoi) {
    chotYeuCau(conn, { doiTuongLoai: 'intervention', doiTuongId: x.paMoi.id }, 'tu_dong', { nguoiDuyet: p.userId, lyDo: 'Giáo viên sửa kết quả — bỏ Thay PA' });
    for (const r of conn.prepare(`SELECT url FROM attachments WHERE kind = 'file' AND owner_type = 'case_intervention' AND owner_id = ?`)
      .all(x.paMoi.id) as any[]) khoaTep.push(r.url);
    for (const sql of CAU_XOA_PA) conn.prepare(sql).run(x.paMoi.id);
  }
  /* Mini Test về "chưa ghi"; Case do chính nó đóng mở lại (bỏ mốc đóng). Thẻ Báo QL để `ghiMiniTestTrongTx` lần mới viết lại / đóng. */
  if (x.mt) {
    for (const c of conn.prepare(`SELECT DISTINCT sc.id, sc.closed_at FROM case_interventions i JOIN sos_cases sc ON sc.id = i.case_id
        WHERE i.nhom_bo_tro = ? AND sc.status = 'done' AND sc.outcome_note LIKE 'Mini Test %≥ 70%'`).all(x.mt.nhom_bo_tro) as any[]) {
      conn.prepare(`UPDATE sos_cases SET status = 'open', outcome = NULL, outcome_note = NULL, outcome_decision = NULL, outcome_by = NULL, outcome_at = NULL,
          closed_by = NULL, closed_at = NULL, updated_at = ? WHERE id = ?`).run(now, c.id);
      conn.prepare('DELETE FROM case_milestones WHERE dedup_key = ?').run(`outcome:${c.id}:${c.closed_at}:end`);
    }
    conn.prepare('UPDATE mini_test SET ty_le = NULL, ngay_lam = NULL, ghi_boi = NULL, ghi_luc = NULL WHERE id = ?').run(x.mt.id);
  }
  /* PA về ngay trước lần ghi: Kết thúc / Thay → đang chạy (đợt, hạn không đổi lúc đó); chu kỳ mới → đợt, hạn của chính lần ghi. */
  for (const r of x.dong) {
    const pa = x.ivs.get(r.intervention_id);
    if (r.next_step === 'complete' || r.next_step === 'propose') {
      conn.prepare(`UPDATE case_interventions SET status = 'started', completed_date = NULL, closed_reason = NULL, superseded_by = NULL, updated_at = ? WHERE id = ?`)
        .run(now, pa.id);
    } else {
      // shortcut: ngày mở đợt trước = ngày ghi lần trước (đợt đầu: ngày bắt đầu PA) — PA chạy từ ngày duyệt / xác nhận khác ngày bắt đầu lệch vài ngày, chỉ hiển thị; cần đúng tuyệt đối thì chụp PA vào nhật ký lúc ghi.
      const truoc = conn.prepare('SELECT observed_on FROM case_followups WHERE intervention_id = ? AND id < ? ORDER BY id DESC LIMIT 1').get(pa.id, r.id) as any;
      conn.prepare(`UPDATE case_interventions SET status = 'started', cycle_no = ?, action_due = ?, cycle_started_on = ?, updated_at = ? WHERE id = ?`)
        .run(r.cycle_no ?? 1, r.cycle_due ?? null, truoc?.observed_on ?? pa.started_date ?? null, now, pa.id);
    }
  }
  conn.prepare(`DELETE FROM journey_events WHERE ref_table = 'case_followups' AND ref_id IN (${ph})`).run(...ids);
  conn.prepare(`DELETE FROM case_followups WHERE id IN (${ph})`).run(...ids);
  dongBoTrangThaiCaseLo([...new Set(x.dong.map((r) => r.case_id as number))]);
}

/**
 * Sửa CHỮ của một lần ghi (giữ lựa chọn): dòng chính + dòng chép, lý do Điều chỉnh, câu hỏi thẻ Xin hỗ trợ đang chờ, chi tiết Hành trình. Không đảo gì,
 * không chuông. Gọi TRONG giao dịch của `suaKetQua`.
 */
function suaChuKetQua(p: Principal, x: NguCanhSua, vao: VaoKetQua): void {
  const conn = db();
  const { chinh, iv } = x;
  kiemQuyenPa(p, iv, x.c);   // cùng quyền như lúc ghi (đường đảo kiểm qua `updateResult`)
  const note = (vao.note ?? '').trim();
  if (note.length < 8) throw badRequest('Ghi chú phải nói rõ quan sát được gì — ít nhất 8 ký tự.');
  const decisionNote = String(vao.decisionNote ?? '').trim() || null;
  if ((chinh.next_step === 'adjust' || chinh.next_step === 'propose') && !decisionNote) throw badRequest('Điều chỉnh hoặc thay phương án thì phải ghi Lý do.');
  if (chinh.next_step === 'ask_manager' && (decisionNote ?? '').length < 8) {
    throw badRequest('Xin hỗ trợ Quản lý thì ghi rõ cần Quản lý giúp gì, ít nhất 8 ký tự.');
  }
  if (x.quyetDinh === null && chinh.outcome === 'insufficient' && !decisionNote) throw badRequest('"Chưa đủ dữ liệu" ở lần ghi cuối thì ghi Lý do.');
  if (chinh.next_step === 'ask_manager' && !x.the && x.chanDoi && decisionNote !== chinh.decision_note) {
    throw badRequest('Quản lý đã trả lời câu hỏi Xin hỗ trợ — không sửa được câu hỏi.');
  }
  const cu = chinh.so_buoi == null;   // OV-12h: lần ghi cũ (không số buổi) giữ như trước
  const t = chuKetQuaTuan(p, iv, x.c, vao, cu);
  /* OV-12h: sửa chữ lần ghi Tutor — gửi dòng buổi, hoặc lần ghi đã có dòng, thì kiểm như lúc ghi và thay; lần ghi cũ không gửi thì giữ. */
  const truocBuoi = docBuoiCu(conn, chinh.id);
  const buoi = vao.buoi === undefined && !truocBuoi.length ? null : buoiTutorCua(iv, t.soBuoiTuan, vao.buoi, cu, laBuoiCu(truocBuoi));
  const sau = { ...chinh, note, decision_note: decisionNote, remaining_issue: t.remainingIssue, so_buoi: t.soBuoiTuan,
    phu_trach_user_id: t.nguoiDay?.userId ?? null, phu_trach_ten: t.nguoiDay?.name ?? null };
  const doi = (['note', 'decision_note', 'remaining_issue', 'so_buoi', 'phu_trach_user_id', 'phu_trach_ten'] as const)
    .some((k) => (sau[k] ?? null) !== (chinh[k] ?? null)) || vao.metrics !== undefined || vao.evidenceAttemptId !== undefined || buoi !== null;
  if (!doi) return;
  ghiBuoiTutor(conn, chinh.id, buoi, x.c.class_id ?? null, truocBuoi);
  const ids = x.dong.map((r) => r.id as number);
  const ph = ids.map(() => '?').join(',');
  conn.prepare(`UPDATE case_followups SET note = ?, decision_note = ?, remaining_issue = ?, so_buoi = ?, phu_trach_user_id = ?, phu_trach_ten = ?,
      metrics = CASE WHEN ? = 1 THEN ? ELSE metrics END, evidence_attempt_id = CASE WHEN ? = 1 THEN ? ELSE evidence_attempt_id END
    WHERE id IN (${ph})`)
    .run(note, decisionNote, t.remainingIssue, t.soBuoiTuan, sau.phu_trach_user_id, sau.phu_trach_ten,
      vao.metrics !== undefined ? 1 : 0, t.metrics ? JSON.stringify(t.metrics) : null,
      vao.evidenceAttemptId !== undefined ? 1 : 0, vao.evidenceAttemptId ?? null, ...ids);
  if (chinh.next_step === 'adjust') conn.prepare(`UPDATE case_intervention_revisions SET reason = ? WHERE followup_id IN (${ph})`).run(decisionNote, ...ids);
  if (x.the && decisionNote !== chinh.decision_note) {
    conn.prepare('UPDATE yeu_cau_duyet SET ly_do = ? WHERE id = ?')
      .run(x.lyDoTruoc ? `${x.lyDoTruoc}${duoiBoSung({ observed_on: chinh.observed_on, decision_note: decisionNote })}` : decisionNote, x.the.id);
  }
  conn.prepare(`UPDATE journey_events SET detail = ? WHERE ref_table = 'case_followups' AND ref_id = ?`)
    .run(chiTietKetQua(iv.kind, chinh.next_step, note, decisionNote, t.remainingIssue), chinh.id);
  writeAudit({ actorUserId: p.userId, action: 'case.result.edit', entityType: 'case_intervention', entityId: iv.id,
    entityLabel: iv.description ?? iv.kind, before: anhLanGhi(chinh), after: anhLanGhi(sau) });
}

/**
 * ĐIỀN SẴN form Sửa kết quả (OV-7b) — PA như NGAY TRƯỚC lần ghi (đợt, hạn, nội dung trước Điều chỉnh, Đã dạy trừ tuần này), giá trị đã ghi (kể cả nội
 * dung Điều chỉnh, PA thay, Mini Test), `chan` = câu chặn đổi lựa chọn. Quyền + chặn như `suaKetQua`.
 */
export function moSuaKetQua(p: Principal, followupId: number) {
  const conn = db();
  const x = nguCanhSuaKetQua(p, followupId);
  const { f, ivF: iv } = x;
  const ten = (id: number | null) => (id ? (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(id) as any)?.full_name ?? null : null);
  const rev = conn.prepare('SELECT * FROM case_intervention_revisions WHERE followup_id = ? LIMIT 1').get(f.id) as any;
  const truoc = rev
    ? { description: rev.old_description, performerUserId: rev.old_performer_user_id, performer: ten(rev.old_performer_user_id) ?? rev.old_performer_name,
        soBuoi: rev.old_so_buoi, followupDue: rev.old_followup_due }
    : { description: iv.description, performerUserId: iv.performer_user_id, performer: ten(iv.performer_user_id) ?? iv.performer_name,
        soBuoi: iv.so_buoi, followupDue: iv.followup_due };
  const doiDot = f.next_step !== 'complete' && f.next_step !== 'propose';
  const daDay = Number((conn.prepare('SELECT COALESCE(SUM(so_buoi), 0) n FROM case_followups WHERE intervention_id = ? AND id != ?').get(iv.id, f.id) as any).n);
  const pm = x.paMoi;
  return {
    followupId: f.id as number, caseId: f.case_id as number, chan: x.chanDoi,
    pa: {
      id: iv.id as number, kind: iv.kind as string, description: (truoc.description ?? null) as string | null, performer: (truoc.performer ?? null) as string | null,
      performerUserId: (truoc.performerUserId ?? null) as number | null,
      actionDue: (doiDot ? f.cycle_due : iv.action_due) ?? null as string | null, cycleNo: (doiDot ? f.cycle_no : iv.cycle_no) ?? 1,
      batBuoc: iv.preset === 1, lanCuoi: x.quyetDinh === null,
      mocChu: iv.preset === 1
        ? mocChuPa({ span: iv.moc_quy_che ?? null, followupDue: truoc.followupDue ?? null, mtKe: mtKeTheoPa(iv.case_id)(iv), daXacNhan: !!iv.confirmed_at,
          mtCuoi: iv.moc_quy_che === 'until_exam' ? mtCuoiNho((db().prepare('SELECT cycle_id FROM sos_cases WHERE id = ?').get(iv.case_id) as any)?.cycle_id) : null }, demoToday())
        : null,
      soBuoi: (truoc.soBuoi ?? null) as number | null, daDay,
    },
    giaTri: {
      outcome: f.outcome as string, note: (f.note ?? '') as string, remainingIssue: (f.remaining_issue ?? '') as string, decision: x.quyetDinh,
      decisionNote: (f.decision_note ?? '') as string, observedOn: f.observed_on as string,
      completedOn: (x.quyetDinh === 'end' ? iv.completed_date : null) as string | null, soBuoi: (f.so_buoi ?? null) as number | null,
      /* OV-12h: dòng buổi Tutor đã ghi (lần ghi cũ: []); TU-a: đủ trường (3 ô trống = lần ghi trước TU-a, Sửa không bắt). */
      buoi: (conn.prepare(`SELECT ${COT_BUOI} FROM case_followup_buoi b WHERE b.followup_id = ? ORDER BY b.buoi_so`).all(f.id) as any[]).map(buoiTuDong),
      nguoiDay: f.phu_trach_user_id ? { userId: f.phu_trach_user_id as number, ten: ten(f.phu_trach_user_id) ?? `#${f.phu_trach_user_id}` }
        : f.phu_trach_ten ? { userId: null, ten: f.phu_trach_ten as string } : null,
      miniTest: x.mt ? { tyLe: Math.round(x.mt.ty_le * 1000) / 10, ngay: x.mt.ngay_lam as string } : null,
      adjust: rev ? { description: rev.new_description as string | null, soBuoi: rev.new_so_buoi as number | null, performerUserId: rev.new_performer_user_id as number | null,
        performer: (ten(rev.new_performer_user_id) ?? rev.new_performer_name ?? null) as string | null } : null,
      newPlan: pm ? { kind: pm.kind as string, description: pm.description as string | null, soBuoi: pm.so_buoi as number | null,
        performerUserId: pm.performer_user_id as number | null, performer: (ten(pm.performer_user_id) ?? pm.performer_name ?? null) as string | null } : null,
    },
  };
}

/**
 * SỬA "XEM LẠI SAU HỖ TRỢ" lần mới nhất của Case (OV-7b, `recordFollowUp`) — người đã ghi + Quản lý, tại chỗ: kết quả quan sát, ghi chú, ngày.
 * Hành trình cùng dòng đổi chữ; nhật ký `case.followup.edit` trước → sau. Case đã hoàn thành: Mở lại trước.
 */
export function suaXemLai(p: Principal, followupId: number, input: { outcome?: string | null; note?: string | null; observedOn?: string | null }) {
  const conn = db();
  const f = conn.prepare('SELECT * FROM case_followups WHERE id = ?').get(followupId) as any;
  if (!f || f.next_step || f.metrics) throw notFound('Không tìm thấy lần xem lại.');
  const c = loadCase(f.case_id);
  if (f.observer_user_id !== p.userId && !can(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id })) {
    throw forbidden('Chỉ người đã ghi lần xem lại này hoặc Quản lý sửa được.');
  }
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c), 'Bạn không có quyền ghi nhận theo dõi cho Case này.');   // cùng quyền như `recordFollowUp`
  if (c.status === 'done') throw badRequest('Case đã hoàn thành — bấm Mở lại trước khi sửa.');
  if (conn.prepare('SELECT 1 FROM case_followups WHERE case_id = ? AND next_step IS NULL AND metrics IS NULL AND id > ? LIMIT 1').get(f.case_id, f.id)) {
    throw badRequest('Chỉ sửa được lần xem lại gần nhất.');
  }
  const outcome = input.outcome === undefined ? f.outcome : input.outcome || null;
  if (outcome && !(FOLLOWUP_OUTCOMES as readonly string[]).includes(outcome)) throw badRequest('Kết quả quan sát không hợp lệ.');
  const note = input.note === undefined ? f.note : chuTuDo(input.note, 'Ghi chú', 2000);
  const observedOn = input.observedOn ?? f.observed_on;
  if (!isIsoDate(observedOn)) throw badRequest('Ngày quan sát không hợp lệ.');
  if (observedOn > demoToday()) throw badRequest('Không ghi được ngày quan sát ở tương lai.');
  if (outcome === f.outcome && note === f.note && observedOn === f.observed_on) return caseDetail(p, f.case_id);
  return tx(() => {
    conn.prepare('UPDATE case_followups SET outcome = ?, note = ?, observed_on = ? WHERE id = ?').run(outcome, note, observedOn, f.id);
    conn.prepare(`UPDATE journey_events SET title = ?, detail = ?, event_date = ? WHERE ref_table = 'case_followups' AND ref_id = ?`)
      .run(`Xem lại sau hỗ trợ${outcome ? `: ${outcome}` : ''}`, note, observedOn, f.id);
    writeAudit({ actorUserId: p.userId, action: 'case.followup.edit', entityType: 'case_followup', entityId: f.id, entityLabel: caseTitleOf(c),
      before: { outcome: f.outcome, note: f.note, observedOn: f.observed_on }, after: { outcome, note, observedOn } });
    return caseDetail(p, f.case_id);
  });
}

/** PR-PA (§8): người giữ việc Kết quả của các PA trong MỘT Case (`c` từ `loadCase`: lớp hiện tại trước). */
const giuCuaCase = (c: any, ivs: readonly any[]) => nguoiGiuKetQua(ivs.map((iv) => ({
  id: iv.id, topic: c.topic ?? null, nhomBoTro: iv.nhom_bo_tro ?? null, classId: c.class_id ?? null, ownerUserId: c.owner_user_id ?? null,
})), demoToday());
const laBoTro = (iv: any) => iv.kind === 'bo_tro' || iv.kind === 'bo_tro_mien_phi';
/** PR-LT2a (Q9): PA Bổ trợ do người dạy (mặc định GVCN cho FOU) ghi — `quyenBoTro`; PA khác theo kỹ năng (C02). */
const quyenPaTheoVaiTro = (p: Principal, iv: any, c: any) => laBoTro(iv)
  ? quyenBoTro(p, { ...iv, ctx: { classId: c.class_id ?? null, studentId: c.eff_student_id ?? null, topic: c.topic ?? null } }) || laNguoiGiuMiniTestCuaPa(p, iv)
  : can(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c));

/**
 * OV-12e: `ghiDuoc` của NHIỀU PA một lần (dòng panel số liệu) — CÙNG luật `caseDetail` (người giữ việc || `quyenPaTheoVaiTro`), ngữ cảnh lấy từ cột
 * đã JOIN (`class_id` = lớp hiện tại của em trước, lớp của lượt sau — như `loadCase`), kèm cổng xem Case của `caseDetail`. Người giữ việc theo lô.
 * shortcut: PA bổ trợ miễn phí (`mt:`) mà người xem không có quyền theo vai hỏi thêm `laNguoiGiuMiniTestCuaPa` từng PA (hiếm: chỉ GVBM giữ Mini Test) — gom lô nếu đo thấy chậm.
 */
export function ghiDuocPaMany(p: Principal, rows: readonly {
  id: number; kind: string; performer_user_id: number | null; case_id: number; nhom_bo_tro: string | null;
  topic: string | null; class_id: number | null; eff_student_id: number | null; owner_user_id: number | null;
}[]): Map<number, boolean> {
  const ngay = demoToday();
  const giu = nguoiGiuKetQua(rows.map((r) => ({ id: r.id, topic: r.topic, nhomBoTro: r.nhom_bo_tro, classId: r.class_id, ownerUserId: r.owner_user_id })), ngay);
  /* Cổng xem của `caseDetail`: giữ việc một PA đang chạy của Case, hoặc ATTEMPT_VIEW — không qua thì Ngăn Case 403, nút "Ghi kết quả" vô ích
     (vd. người dạy PA bổ trợ khi em đã chuyển lớp). PA đang chạy của các Case: một câu mỗi lô. */
  const caseCua = new Map(rows.map((r) => [r.case_id, r]));
  const dangChay: (DongGiuKetQua & { caseId: number })[] = [];
  theoLo([...caseCua.keys()], (lo, ph) => {
    for (const iv of db().prepare(`SELECT id, case_id, nhom_bo_tro FROM case_interventions WHERE case_id IN (${ph}) AND status IN ('planned', 'started')`)
      .all(...lo) as any[]) {
      const c = caseCua.get(iv.case_id)!;
      dangChay.push({ id: iv.id, caseId: iv.case_id, topic: c.topic, nhomBoTro: iv.nhom_bo_tro ?? null, classId: c.class_id, ownerUserId: c.owner_user_id });
    }
  });
  const giuChay = nguoiGiuKetQua(dangChay, ngay);
  const giuCase = new Set(dangChay.filter((d) => giuChay.get(d.id) === p.userId).map((d) => d.caseId));
  const xem = (r: typeof rows[number]) => giuCase.has(r.case_id) || can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.class_id, studentId: r.eff_student_id });
  return new Map(rows.map((r) => [r.id, xem(r) && (giu.get(r.id) === p.userId || quyenPaTheoVaiTro(p, r, r))]));
}

/** PR-PA: quyền ghi Kết quả / Sửa PA của MỘT PA — một chỗ. Người giữ việc (§8) luôn ghi được, dù không qua quyền theo vai trò. */
export function kiemQuyenPa(p: Principal, iv: any, c: any, msg = 'Bạn không có quyền cập nhật kết quả của Case này.') {
  if (quyenPaTheoVaiTro(p, iv, c) || giuCuaCase(c, [iv]).get(iv.id) === p.userId) return;
  if (laBoTro(iv)) throw forbidden(msg);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c), msg);   // ném kèm gợi ý quyền
}

/** PR-PA: PA chưa chạy (quy chế chưa xác nhận, chờ Quản lý duyệt) hoặc đã khép → không ghi Kết quả, không Sửa PA. */
function chanPaChuaChay(iv: any, chuaXacNhan: string) {
  if (iv.preset === 1 && !iv.confirmed_at) throw badRequest(chuaXacNhan);
  if (iv.approval_state === 'pending') throw badRequest('Phương án này đang chờ Quản lý duyệt — việc thực hiện chưa bắt đầu.');
  if (iv.status === 'cancelled') throw badRequest('Phương án này đã huỷ.');
  if (iv.status === 'completed') throw badRequest('Phương án này đã kết thúc — không cập nhật thêm được.');
}

/**
 * SỬA PA (PR-PA §8) — cùng form Thêm PA; Loại khoá (đổi loại là Thay). Quyền như Kết quả (`kiemQuyenPa`).
 * Số buổi ≥ đã dạy (null = xoá); Ngày bắt đầu chỉ đổi khi PA chưa có Kết quả. Ô người: gửi BẤT KỲ khoá nào trong ba
 * (`performerSelf` / `performerUserId` / `performerName`) = đặt lại (cả ba trống = xoá người); không gửi khoá nào = giữ. Tự học: bỏ qua người.
 * Không đổi gì → trả Case, không ghi. Đổi → MỘT dòng nhật ký `sua_pa` (cũ → mới) + audit `intervention.edit` cho mỗi dòng đổi.
 * PA bổ trợ nhóm: chỗ đổi áp MỌI dòng đang chạy của nhóm (như Điều chỉnh — `chepKetQuaNhom`), Số buổi kiểm theo đã dạy của từng dòng.
 */
export function suaPa(p: Principal, interventionId: number, input: {
  description?: string | null; soBuoi?: unknown; kind?: string; startedDate?: string | null;
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
}) {
  const conn = db();
  const iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  kiemQuyenPa(p, iv, loadCase(iv.case_id), 'Bạn không có quyền sửa PA này.');
  chanPaChuaChay(iv, 'PA theo quy chế chưa xác nhận — sửa ngay trong Xác nhận PA.');
  if (input.kind !== undefined && input.kind !== iv.kind) throw badRequest('Không đổi được Loại PA — đổi loại thì chọn Thay PA.');
  const oldDesc = (iv.description ?? null) as string | null;
  let description = oldDesc;
  if (typeof input.description === 'string' && input.description.trim() !== (oldDesc ?? '').trim()) {
    description = chuTuDo(input.description, 'Mô tả ngắn', 2000) ?? '';
    if (description.length < 8) throw badRequest('Mô tả ngắn phải nói rõ làm gì cho em — ít nhất 8 ký tự.');
  }
  const soBuoi = soBuoiMoi(iv, input.soBuoi, daDayCua(interventionId));
  const { performerUserId, performerName } = nguoiSauSua(p, iv, input);
  const coKetQua = (id: number) => !!conn.prepare('SELECT 1 FROM case_followups WHERE intervention_id = ? LIMIT 1').get(id);
  let startedDate = (iv.started_date ?? null) as string | null;
  if (input.startedDate && input.startedDate !== startedDate) {
    if (!isIsoDate(input.startedDate)) throw badRequest('Ngày bắt đầu không hợp lệ.');
    if (coKetQua(interventionId)) throw badRequest('PA đã có Kết quả — không đổi Ngày bắt đầu được.');
    startedDate = input.startedDate;
  }
  const mat = (r: any) => ({
    description: (r.description ?? null) as string | null, soBuoi: (r.so_buoi ?? null) as number | null,
    performerUserId: (r.performer_user_id ?? null) as number | null, performerName: (r.performer_name ?? null) as string | null,
    startedDate: (r.started_date ?? null) as string | null,
  });
  type Mat = ReturnType<typeof mat>;
  const sau: Mat = { description, soBuoi, performerUserId, performerName, startedDate };
  const truoc = mat(iv);
  const doi = (Object.keys(sau) as (keyof Mat)[]).filter((k) => sau[k] !== truoc[k]);
  if (!doi.length) return caseDetail(p, iv.case_id);
  /* Dòng anh em nhận ĐÚNG các ô vừa đổi; kiểm lại theo dòng đó (đã dạy, đã có Kết quả) — một dòng sai thì không dòng nào đổi. */
  const dong: { row: any; sau: Mat }[] = [{ row: iv, sau }];
  for (const s of anhEmNhom(conn, iv)) {
    /* Đổi người → chép CẢ HAI ô người (tài khoản XOR tên): dòng anh em có thể đang mang ô kia (vd. `nguoiGuiLen`, bàn giao chỉ đổi một dòng). */
    const chep = doi.some((k) => k === 'performerUserId' || k === 'performerName')
      ? [...new Set([...doi, 'performerUserId', 'performerName'] as (keyof Mat)[])] : doi;
    const moi = { ...mat(s), ...Object.fromEntries(chep.map((k) => [k, sau[k]])) } as Mat;
    if (doi.includes('soBuoi')) soBuoiMoi(s, moi.soBuoi, daDayCua(s.id));
    if (doi.includes('startedDate') && moi.startedDate !== mat(s).startedDate && coKetQua(s.id)) {
      throw badRequest('Một dòng của nhóm đã có Kết quả — không đổi Ngày bắt đầu được.');
    }
    dong.push({ row: s, sau: moi });
  }
  return tx(() => {
    for (const { row, sau: m } of dong) {
      const truoc = mat(row);
      if ((Object.keys(m) as (keyof Mat)[]).every((k) => m[k] === truoc[k])) continue;
      /* Chu kỳ đầu đang chạy (chưa có Kết quả) tính lại từ Ngày bắt đầu mới — như lúc Thêm PA. */
      const doiChuKy = m.startedDate !== truoc.startedDate && row.status === 'started' && !!row.cycle_started_on && !!m.startedDate;
      conn.prepare(`UPDATE case_interventions SET description = ?, so_buoi = ?, performer_user_id = ?, performer_name = ?, started_date = ?,
          cycle_started_on = ?, action_due = ?, updated_at = ? WHERE id = ?`)
        .run(m.description, m.soBuoi, m.performerUserId, m.performerName, m.startedDate,
          doiChuKy ? m.startedDate : row.cycle_started_on ?? null, doiChuKy ? hanKyGhiKetQua(m.startedDate!) : row.action_due ?? null, nowIso(), row.id);
      ghiBanDieuChinh({
        iv: row, source: 'sua_pa', reason: 'Sửa PA', on: demoToday(), actorUserId: p.userId, followupId: null,
        after: { ...m, followupDue: row.followup_due ?? null },
      });
      writeAudit({
        actorUserId: p.userId, action: 'intervention.edit', entityType: 'case_intervention', entityId: row.id,
        entityLabel: `Case ${row.case_id} · ${row.kind}`, before: truoc, after: m,
      });
    }
    return caseDetail(p, iv.case_id);
  });
}

/**
 * CÒN GÌ CHẶN VIỆC HOÀN THÀNH CASE — mục 7.7 [5].
 *
 * Case chỉ đóng được khi MỌI phương án đã khép lại và không còn gì đang chờ. Và một Case
 * CHƯA CÓ PHƯƠNG ÁN NÀO cũng không đủ điều kiện đóng: đếm được "0 phương án còn mở" không
 * có nghĩa là đã làm gì cho em.
 *
 * Trả về danh sách lý do để giao diện nói rõ CÒN THIẾU GÌ, thay vì làm mờ một cái nút và
 * để người dùng tự đoán.
 */
export function closeBlockers(caseId: number): string[] {
  const r = chanHoanThanhCua(caseId);
  return r.an ? [r.dong!] : r.ly_do;
}

/** PR-SOS (K3 §4a, K3-09): chặn Hoàn thành — PA theo quy chế chưa khép thì ẨN nút (`an`) + một dòng; còn lại lý do như cũ. */
export function chanHoanThanhCua(caseId: number) {
  const rows = db().prepare(`SELECT * FROM case_interventions WHERE case_id = ? AND status != 'cancelled'`).all(caseId) as any[];
  const mtKe = mtKeTheoPa(caseId);
  const mtCuoi = rows.some((r) => r.preset === 1 && r.moc_quy_che === 'until_exam') ? mtCuoiNho((db().prepare('SELECT cycle_id FROM sos_cases WHERE id = ?').get(caseId) as any)?.cycle_id) : null;
  return chanHoanThanh(rows.map((r) => ({
    batBuoc: r.preset === 1, xong: r.status === 'completed', choDuyet: r.approval_state === 'pending', followupDue: r.followup_due ?? null,
    mocChu: r.preset === 1 ? mocChuPa({ span: r.moc_quy_che ?? null, followupDue: r.followup_due ?? null, mtKe: mtKe(r), daXacNhan: !!r.confirmed_at, mtCuoi }, demoToday()) : '',
  })));
}

/** Số MT kế tiếp của lượt đã sinh mỗi PA quy chế: mốc `opened`/`repeat` mới nhất không muộn hơn PA. MỘT câu cho cả Case. */
export function mtKeTheoPa(caseId: number): (iv: { created_at: string }) => number | null {
  const moc = db().prepare(`SELECT attempt_no, created_at FROM case_milestones WHERE case_id = ? AND kind IN ('opened', 'repeat')
      AND attempt_no IS NOT NULL ORDER BY created_at DESC, id DESC`).all(caseId) as any[];
  return (iv) => {
    const m = moc.find((x) => x.created_at <= iv.created_at) ?? moc[moc.length - 1];
    return m ? m.attempt_no + 1 : null;
  };
}