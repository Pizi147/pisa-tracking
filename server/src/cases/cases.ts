import { db, tx } from '../db.ts';
import { boTroCuaCase, chepKetQuaNhom, quyenBoTro, type BoTroDto } from './boTro.ts';
import { ghiMiniTestTrongTx, kiemMiniTest } from '../normal/cuoiKhoa.ts';
import {
  DISPOSITIONS, INTERVENTION_KINDS, SYSTEM_KINDS, INTERVENTION_KIND_LABEL, INTERVENTION_STATUSES, tenPaViecTiep,
  INTERVENTION_STATUS_LABEL,
  FOLLOWUP_OUTCOMES, CASE_DECISIONS, CASE_OUTCOMES, ENTRY_SKILLS,
  ISSUE_ROLES, PERMISSIONS, URGENCY_LEVELS, DEFAULT_URGENCY,
  isNoPlanCase,
  issuesForTopic,
  CASE_CATEGORY_SHORT, CASE_CATEGORIES, CASE_CATEGORY_LABEL, FOLLOWUP_OUTCOME_LABEL, ratioResult,
  caseCategoriesFor, componentsAreCounts, componentsFor, type CaseCategory,
  CASE_OUTCOME_LABEL, SYSTEM_CLOSE_REASON_LABEL, caseCategoryLabel, caseDedupKey, caseHeadline, caseTitle, categoryOf,
  type SystemCloseReason,
  NEXT_STEP_LABEL, isProposalKind, outcomeLabelFor,
  RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL, RESULT_MODES, RESULT_MODE_LABEL,
  canEndWithOutcome, planDueDate, stepsForMode, weeklyUpdateDue,
  HAN_DUYET_NGAY, hanTheoNgay,
  type NextStep, type RescheduleTarget,
  issueBranchOf, issueLabel, caseTopicLabel, urgencyFromSos,
  SIGNAL_WITHDRAW_SCORE_FIXED, caseTopicsFor, ghepKhac, kiemGhiRoKhac, laKhac, chanHoanThanh, laLanGhiCuoi, mocChuPa, programmeOf, quyetDinhChoPa, trangThaiCaseV4, viecTiepCuaCase, tenCaseSos, tenCaseThuong, nhanDot, tenMon, tenMonNgan,
  type CaseOutcome, type FollowUpOutcome, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, isCoreTeacherOf, napTruocPhamVi, require_, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { nho, trongBoNho } from '../platform/nguCanhRequest.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { currentCycle } from '../fasttrack/cycles.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { isRatioCycle, programmeCodeOfCycle } from '../normal/regular.ts';
import { suggestCaseOwner } from './owner.ts';
import { LA_CASE_SOS, NOT_UNCONFIRMED_PRESET, awaitingCauseCaseIds, dongBoTrangThaiCase, sosCaseState } from './sosState.ts';
import { PLAN_DECISIONS, decisionToStep, type PlanDecision } from '../../../shared/domain/index.ts';
import { apDungDieuChinh, chuanHoaDieuChinh, lichSuDieuChinhCuaCase } from './planRevisions.ts';
import { chuanHoaNguoiThucHien } from './nguoiThucHien.ts';
import { dienMocQuyChe, tenGiuaCua } from './sosAuto.ts';
import { boSungYeuCau, chotYeuCau, taoYeuCau, theCuaDoiTuong } from '../duyet/yeuCau.ts';

/**
 * CASE HỌC VỤ — một vòng đời cho cả hai nguồn.
 *
 * Case sinh từ kết quả đánh giá và case do giáo viên báo đi qua ĐÚNG một bộ máy: cùng
 * trạng thái, cùng hướng xử lý, cùng tác động, cùng cách xem lại. Nếu tách thành hai luồng
 * thì mọi màn hình tổng hợp về sau phải cộng hai nguồn bằng tay, và sẽ lệch.
 *
 * Khác nhau duy nhất là CĂN CỨ MỞ case:
 *   - `mock`: hệ thống tự mở khi có kỹ năng dưới kỳ vọng, `sos_level` là số kỹ năng đó.
 *   - `teacher_report`: giáo viên chủ động báo, `sos_level` để NULL và dùng `urgency`.
 */

// ---------------------------------------------------------------- quyền

/** Người đang xem có được đóng case này không: GVCN của lớp, hoặc Quản lý trong phạm vi. */
/**
 * TÊN CASE — tự sinh, cập nhật theo MỐC MỚI NHẤT.
 *
 * Suy lúc đọc chứ không ghi vào database: sửa điểm thì tên đổi theo, không để lại một cái
 * tên cũ nói sai sự thật. Tiền tố `MT{n}` là cách nhận ra case đã bị điểm chạm vào; case
 * giáo viên tự báo mà chưa lượt MT nào chạm thì không có tiền tố.
 */
export function caseTitleOf(c: {
  id: number; category?: string | null; topic?: string | null;
  origin_kind?: string | null; sos_level?: number | null; title?: string | null;
}): string {
  /*
   * TÊN NGƯỜI TẠO ĐẶT THẮNG TÊN SUY RA. Case tạo tay có tên riêng vì không có gì để suy;
   * và không được tự gán "… dưới kỳ vọng" cho một case không sinh từ điểm (mục 7.3).
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
        WHERE m.case_id = ? AND m.attempt_no IS NOT NULL
        ORDER BY m.attempt_no DESC LIMIT 1`,
    )
    .get(c.id) as any;
  /* PR-S5F-a: tên môn theo chương trình LÚC MỞ Case (FOU "G+V") — Case đi theo em sang BE vẫn một tên, không lúc "G+V" lúc "Writing". */
  const ctTen = latest?.ct_goc ?? latest?.ct ?? null;
  /* PR-SOS T21: Case SOS Fast Track = `[MT1] {phần giữa} [SOS 3]`; phần giữa người sửa được (`title`), mặc định `{kỹ năng} không đạt`. */
  if (c.origin_kind === 'mock' && (latest?.kind ?? 'mock') === 'mock') {
    const cat = c.category ?? categoryOf(c.topic);
    return tenCaseSos({ mt: latest?.attempt_no ?? null, giua: own || `${cat ? tenMon(ctTen, cat) : caseCategoryLabel(cat)} không đạt`, sos: c.sos_level ?? null });
  }
  /* PR-LT2a T58: Case tự tạo từ Giữa khoá lớp thường = `[Giữa khoá] G+V không đạt` — không MT, không SOS. */
  if (c.origin_kind === 'mock' && (latest?.kind === 'progress' || latest?.kind === 'final')) {
    const cat = c.category ?? categoryOf(c.topic);
    return tenCaseThuong({ dot: latest.kind, giua: own || `${cat ? tenMonNgan(ctTen, cat) : caseCategoryLabel(cat)} không đạt` });
  }
  if (own) return own;
  return caseTitle({
    category: c.category ?? categoryOf(c.topic),
    latestAttemptNo: latest?.attempt_no ?? null,
    latestAttemptKind: latest?.kind ?? null,
    chuongTrinh: ctTen,
  });
}

/** Các mốc của một case, cũ trước mới sau — màn case đọc từ trên xuống là ra câu chuyện. */
export function milestonesOf(caseId: number) {
  return (db()
    .prepare(
      `SELECT m.*, u.full_name AS actor_name, (SELECT a.kind FROM assessment_attempts a WHERE a.id = m.attempt_id) AS attempt_kind FROM case_milestones m
         LEFT JOIN users u ON u.id = m.created_by
        WHERE m.case_id = ? ORDER BY m.occurred_on, m.id`,
    )
    .all(caseId) as any[])
    .map((m) => ({
      id: m.id, kind: m.kind, attemptId: m.attempt_id, attemptNo: m.attempt_no, dot: m.attempt_kind ? nhanDot(m.attempt_kind, m.attempt_no) : null,
      band: m.band, expectation: m.expectation, sosLevel: m.sos_level,
      occurredOn: m.occurred_on, note: m.note, actorName: m.actor_name,
    }));
}

/**
 * HOÀN THÀNH CASE — MỘT NÚT, MỘT PANEL KẾT LUẬN (mục 9.3).
 *
 * Trước vòng 7 có bốn đường ra khỏi một case: "Chốt kết quả", "Kéo dài theo dõi", "Chọn
 * hướng xử lý" và "Đổi hướng xử lý". Bốn cái tên cho một câu hỏi duy nhất — case này kết
 * thúc thế nào — nên không ai chắc mình vừa làm gì, và hai case đóng cùng một kiểu lại có
 * hai dấu vết khác nhau. Nay chỉ còn ĐÚNG MỘT đường.
 *
 * "Kéo dài theo dõi" biến mất vì nó vốn không phải một cách kết thúc: case chưa xong thì để
 * mở, và việc phải làm nằm ở PHƯƠNG ÁN (tab "Tiếp tục theo dõi" ở mục 9.1), không phải ở
 * một cái nút đóng-mà-không-đóng.
 *
 * CHỈ ĐÓNG ĐƯỢC KHI MỌI PHƯƠNG ÁN ĐÃ KHÉP LẠI. Đóng sớm thì con số "đã xử lý xong" nói dối:
 * vẫn còn một việc treo mà case đã biến khỏi danh sách của mọi người. Và điểm mới đạt, ngày
 * trôi qua hay "case không có phương án nào" đều KHÔNG tự đóng được case — phải có người có
 * quyền kết luận.
 */
export function closeCaseOutcome(p: Principal, caseId: number, input: {
  /** Mức tiến bộ — BẮT BUỘC (case học thuật). */
  outcome?: string | null; note?: string | null;
  /** Ngày hoàn thành thực tế. Bỏ trống thì lấy hôm nay; không nhận ngày tương lai. */
  closedOn?: string | null;
  /** Mã cũ: chỉ còn nhận 'end'. "Kéo dài theo dõi" đã bỏ (mục 9.3). */
  decision?: string | null;
  /** Ghi chi tiết theo thành phần của kỹ năng case (mục 9.3). TUỲ CHỌN. */
  metrics?: unknown;
}) {
  const conn = db();
  const c = loadCase(caseId);
  if (!canCloseCase(p, c)) {
    throw forbidden('Chỉ Quản lý, hoặc GVCN dạy đúng môn của Case, mới hoàn thành được Case này.');
  }
  const outcome: string = input.outcome ?? '';
  if (!(CASE_OUTCOMES as readonly string[]).includes(outcome)) {
    throw badRequest('Mức độ thành công không hợp lệ.');
  }
  if (input.decision && input.decision !== 'end') {
    throw badRequest('"Kéo dài theo dõi" đã bỏ — case chưa xong thì để mở và cập nhật ở phương án.');
  }
  void CASE_DECISIONS;
  /*
   * GHI CHÚ BẮT BUỘC KHI HOÀN THÀNH CASE (mục 9.2). Bốn mức "thành công đến đâu" không nói được đã làm gì và vì sao kết thúc —
   * mà đó chính là câu người đọc hồ sơ ba tháng sau cần.
   */
  const closeNote = (input.note ?? '').trim();
  if (closeNote.length < 10) {
    throw badRequest('Hoàn thành case thì phải ghi kết luận — ít nhất 10 ký tự.');
  }
  const closedOn = input.closedOn ?? demoToday();
  if (!isIsoDate(closedOn)) throw badRequest('Ngày hoàn thành không hợp lệ.');
  if (closedOn > demoToday()) throw badRequest('Không ghi được ngày hoàn thành ở tương lai.');

  const metrics = normalizeMetrics(input.metrics);
  /*
   * ĐÁNH GIÁ CHI TIẾT PHẢI ĐÚNG KỸ NĂNG CỦA CASE (mục 9.3) — không bắt chấm cả năm kỹ năng,
   * và cũng không cho ghi Reading vào một case Listening.
   */
  if (metrics && c.category) {
    for (const m of metrics) {
      if (m.skill !== c.category) {
        throw badRequest('Phần đánh giá chi tiết chỉ ghi cho đúng kỹ năng của case này.');
      }
    }
  }

  /*
   * MỘT ĐIỀU KIỆN ĐÓNG DUY NHẤT cho cả hai đường vào (mục 7.7 [5]).
   *
   * Trước đây hàm này tự kiểm "còn phương án nào đang chạy không", trong khi nút trên màn
   * hình lại hỏi `closeBlockers`. Hai phép kiểm khác nhau cho cùng một câu hỏi nghĩa là
   * sớm muộn sẽ có đường đóng được case mà màn hình bảo là chưa đóng được — cụ thể là case
   * CHƯA CÓ PHƯƠNG ÁN NÀO vẫn lọt qua đây.
   */
  const blockers = closeBlockers(caseId);
  if (blockers.length) {
    throw badRequest(`Chưa chốt kết quả case được. ${blockers.join(' ')}`);
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
      title: `${c.origin_kind === 'backfill' ? '(nhập bù) ' : ''}Hoàn thành case: ${CASE_OUTCOME_LABEL[outcome as CaseOutcome]}`,
      detail: closeNote,
      refTable: 'sos_cases', refId: caseId, createdBy: p.userId,
      dedupKey: `case_outcome:${caseId}:${closedOn}:end`,
    });
    writeAudit({ actorUserId: p.userId, action: 'case.outcome', entityType: 'sos_case',
      entityId: caseId, entityLabel: caseTitleOf(c),
      after: { outcome, closedOn } });
    return caseDetail(p, caseId);
  });
}

/** Đổi hạn BÁO KẾT QUẢ của case. Mặc định là hết tuần MT kế tiếp, nhưng sửa được. */
export function setFollowUntil(p: Principal, caseId: number, date: string | null) {
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền đổi hạn theo dõi của case này.');
  if (date && !isIsoDate(date)) throw badRequest('Hạn theo dõi không hợp lệ.');
  db().prepare('UPDATE sos_cases SET follow_until = ?, updated_at = ? WHERE id = ?')
    .run(date, nowIso(), caseId);
  return caseDetail(p, caseId);
}

/**
 * AI HOÀN THÀNH ĐƯỢC CASE — RB-6, quyết định 4.15 (22/09/2026), khớp C02.
 *   · Quản lý / Quản trị trong phạm vi: được.
 *   · GVCN của lớp: CHỈ Case đúng môn mình dạy. Case môn khác thì không, dù là lớp mình chủ nhiệm.
 *   · GVBM không kiêm GVCN: không (giữ luật cũ — 4.15 chỉ hỏi về GVCN).
 * Case không có môn (`topic` rỗng, dữ liệu cũ) thì GVCN vẫn được, để dữ liệu cũ không bị khoá.
 */
export function canCloseCase(p: Principal, c: { class_id?: number | null; student_id?: number | null; topic?: string | null }): boolean {
  /* PR-Dọn (rà thêm, ngoài 24 mục quét): bỏ dòng `can(MEETING_EDIT, { anyScope: true })` đứng đầu — nó cho Quản lý ở BẤT KỲ chi nhánh
     hoàn thành Case của chi nhánh khác. Quản lý / Quản trị trong phạm vi đã đi qua `CASE_CLOSE` ngay dưới. */
  if (can(p, PERMISSIONS.CASE_CLOSE, { classId: c.class_id ?? null, studentId: c.student_id ?? null })) return true;
  if (!c.class_id || !isCoreTeacherOf(p, c.class_id)) return false;
  if (!c.topic) return true;
  return can(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.student_id ?? undefined, skill: c.topic });
}

function loadCase(caseId: number) {
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
  if (!c) throw notFound('Không tìm thấy case');
  c.class_id = c.attempt_class_id ?? c.current_class_id ?? null;
  return c;
}

/**
 * NGỮ CẢNH QUYỀN CHO SOS_EDIT (AUTH-01) — MỘT chỗ dựng, dùng ở mọi nơi sửa/xử lý case.
 *
 * Truyền đúng kỹ năng của case (`c.topic`, ví dụ "listening") để `teacherAllows` so khớp phân công GVBM (C02). Thiếu hàm này thì
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
 * QUYỀN CỦA MỘT CASE, cho module khác hỏi (kho tệp) thay vì tự dựng lại ngữ cảnh quyền — đúng bài học AUTH-01: mỗi nơi
 * tự viết `can(...)` một kiểu là cách sinh ra lỗi quyền. Xem = quyền xem case; sửa = `SOS_EDIT` theo đúng kỹ năng (C02).
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
    topic: (c.topic ?? null) as string | null,
  };
}

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
  /** Tên case do người tạo đặt (mục 7.3). Chỉ case tạo tay mới có. */
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
  /** Người dùng đã thấy cảnh báo case trùng và chọn "Ghi vào case đang có". */
  mergeIntoExisting?: boolean;
  /** Người dùng đã thấy cảnh báo và chọn "Đây là vấn đề khác, mở case riêng". */
  parallel?: boolean;
  /** Người phụ trách chính. Bỏ trống thì hệ thống gợi ý theo phân công của lớp. */
  ownerUserId?: number | null;
  /**
   * NHẬP BÙ MỘT CASE ĐÃ XONG TỪ LÂU (PR-C Task 3, mục 10.3–10.4) — cờ chảy suốt cả chuỗi
   * `reportIssue` → `recordIntervention` → `completeIntervention` → `closeCaseOutcome`.
   *
   * Ba việc khác hẳn đường thường khi cờ này bật:
   *   · `origin_kind = 'backfill'` thay vì `'teacher_report'` — chốt 7, phân biệt được ghi
   *     tại chỗ với nhớ lại rồi điền.
   *   · KHÔNG có `follow_until` (chốt 2) — case nhập bù không có hạn nào, vì nó là chuyện đã xảy ra, không phải một nghĩa vụ
   *     đang chạy.
   */
  backfill?: boolean;
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

  /*
   * BỐN TRƯỜNG BẮT BUỘC (mục 6.3): tên, mô tả, mức độ, phân loại.
   *
   * Ba trong bốn cái đó trước đây không bắt buộc, và hệ quả rất cụ thể: hồ sơ đầy những
   * case tên "Reading dưới kỳ vọng" do máy đặt, mô tả trống, phân loại "Chưa rõ" — mở ra
   * không biết em vướng gì, và không bảng tổng hợp nào đếm được.
   */
  const title = (input.title ?? '').trim();
  if (title.length < 6) {
    throw badRequest('Đặt tên cho case — một câu ngắn nói đúng vấn đề, ví dụ '
      + '"Reading: chưa xử lý được dạng True/False/Not Given".');
  }
  const summary = (input.summary ?? '').trim();
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
  if (!allowedTopics.includes(topic)) throw badRequest(`Chủ đề không hợp lệ: ${topic}`);

  /*
   * CẢNH BÁO CASE TRÙNG (mục 7.13).
   *
   * Hạng mục này đã có case chưa xong thì mở thêm một cái nữa hiếm khi đúng: hai case song
   * song cho cùng một môn nghĩa là hai người cùng theo dõi mà không ai thấy việc của người
   * kia. Nên mặc định GHI VÀO CASE ĐANG CÓ; mở riêng vẫn được nhưng phải là quyết định có
   * ý thức — giao diện hỏi trước, và người dùng gửi lại kèm `parallel: true`.
   *
   * Kiểm ở đây chứ không chỉ dựa vào chỉ mục duy nhất: chỉ mục chỉ biết chặn, không nói
   * được cho người dùng biết case đang vướng là case nào.
   */
  /*
   * PHÂN LOẠI BẮT BUỘC, và không có lối thoát "Chưa rõ" (mục 6.3).
   *
   * Chọn "Khác" thì được, nhưng lúc đó phải ghi rõ "Khác" là gì (ô Ghi rõ, T13) — nếu không,
   * "Khác" trở thành đúng cái ô "Chưa rõ" vừa bị bỏ, chỉ khác tên.
   */
  const allowed = issuesForTopic(topic, ctCuaCase).map((i) => i.code);
  const primaryCode = (input.primaryCode ?? '').trim();
  if (!primaryCode) throw badRequest('Chọn phân loại vấn đề — đây là căn cứ để tổng hợp về sau.');
  if (!allowed.includes(primaryCode)) {
    throw badRequest(`Phân loại đã chọn không thuộc bộ phân loại của ${caseTopicLabel(topic, ctCuaCase)}.`);
  }
  /* T13: "Khác" cần ô Ghi rõ ≥ 3 ký tự, lưu ở `case_issues.observation` (Q9). Luật cũ "mô tả ≥ 30 ký tự" đã bỏ. */
  if (laKhac(primaryCode)) {
    const loi = kiemGhiRoKhac(input.observation);
    if (loi) throw badRequest(`Phân loại "Khác": ${loi}.`);
  }

  const category = categoryOf(topic);

  const dedupKey = caseDedupKey({
    category, studentId: input.studentId, cycleId: cycle?.id ?? null, parallel: input.parallel,
  });
  const existing = dedupKey
    ? (conn.prepare(`SELECT * FROM sos_cases WHERE dedup_key = ? AND status != 'done'`).get(dedupKey) as any)
    : null;

  /* PR-SOS K3-23 (M4): Case SOS cùng kỹ năng đang chờ xác nhận nguyên nhân → không gộp, không mở song song — xác nhận ở Case đó. */
  if (existing && sosCaseState(existing.id).awaitingCause) {
    const mt = existing.attempt_id
      ? (conn.prepare('SELECT attempt_no FROM assessment_attempts WHERE id = ?').get(existing.attempt_id) as any)?.attempt_no ?? null : null;
    const nhan = [mt ? `MT${mt}` : null, existing.sos_level ? `SOS ${existing.sos_level}` : null].filter(Boolean).join(' · ');
    throw badRequest(
      `${caseTopicLabel(existing.topic ?? topic, ctCuaCase)} đang có Case chờ xác nhận nguyên nhân${nhan ? ` (${nhan})` : ''} — mở Case để xác nhận.`,
      { caseChoNguyenNhan: { id: existing.id } },
    );
  }

  if (existing && !input.mergeIntoExisting && !input.parallel) {
    /*
     * Kèm đủ dữ liệu để giao diện dựng pop-up hai lựa chọn mà không phải hỏi lại máy chủ
     * lần nữa — người dùng đang dở tay gõ, không nên bắt chờ thêm một vòng mạng.
     */
    throw badRequest(
      `Học viên này đang có case "${caseTitleOf(existing)}" chưa xử lý xong ở hạng mục ${caseCategoryLabel(category)}.`,
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

  if (existing && input.mergeIntoExisting) {
    /* "Ghi vào case đang có" — thêm chữ của người báo, không tạo bản ghi thứ hai. */
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
        title: 'Giáo viên ghi thêm vào case đang có', detail: summary,
        refTable: 'sos_cases', refId: existing.id, createdBy: p.userId,
        dedupKey: `case_note:${existing.id}:${detectedAt}:${summary.slice(0, 20)}`,
      });
      writeAudit({ actorUserId: p.userId, action: 'case.report.merge', entityType: 'sos_case',
        entityId: existing.id, entityLabel: `${student.student_code} · ${summary.slice(0, 40)}`,
        after: { mergedInto: existing.id } });
      return caseDetail(p, existing.id);
    });
  }

  return tx(() => {
    /*
     * CASE CŨ ĐÃ ĐÓNG NHẢ KHOÁ CHỐNG TRÙNG RA (mục 6.2 · 7.5).
     *
     * Khoá `(học viên, lộ trình, hạng mục)` luôn thuộc về case ĐANG MỞ của hạng mục đó. Một
     * case đã chốt kết thúc mà vẫn giữ khoá thì hạng mục ấy bị khoá vĩnh viễn: vấn đề tái
     * diễn sau đó không mở được case mới.
     *
     * Nhả khoá KHÔNG đụng gì tới nội dung case cũ — kết luận, phương án và lịch sử của nó
     * giữ nguyên. Việc nối case mới vào case cũ do đường tín hiệu lo, vì chỉ ở đó mới biết
     * đây là tái diễn hay là một vấn đề khác.
     */
    if (dedupKey) {
      conn.prepare(`UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE dedup_key = ? AND status = 'done'`)
        .run(nowIso(), dedupKey);
    }
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
            * hộ mở case rất thường xuyên; gán họ làm người phụ trách là ghi sai trách nhiệm.
            * Ai báo thì lưu ở `reported_by`, còn đây là gợi ý theo phân công.
            */
           input.ownerUserId ?? suggestCaseOwner({ classId, category }),
           nowIso());
    const caseId = Number(info.lastInsertRowid);

    /*
     * KHÔNG ghi một mốc "Mở case" ở đây (mục 7.6).
     *
     * Ngày mở và người tạo đã nằm ở đầu case; thêm một node "Mở case" vào dòng thời gian
     * nội bộ là lặp lại đúng thông tin đó và đẩy những mốc có nghĩa — hỗ trợ đã làm, kết
     * quả sau hỗ trợ — xuống dưới. Hành trình học tập của TOÀN học viên vẫn có mốc "phát
     * sinh case" (`addJourney` ngay dưới), vì ở đó nó thật sự là một mốc.
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
    writeAudit({ actorUserId: p.userId, action: input.backfill ? 'case.backfill' : 'case.report',
      entityType: 'sos_case', entityId: caseId,
      entityLabel: `${student.student_code} · ${summary.slice(0, 40)}`, after: { urgency, detectedAt } });
    return caseDetail(p, caseId);
  });
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
  const mo = conn.prepare(`SELECT sc.id, sc.topic, sc.category, sc.sos_level, a.attempt_no, a.kind AS attempt_kind FROM sos_cases sc
      LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.student_id = ? AND sc.status != 'done'`).all(studentId) as any[];
  const cho = new Set(awaitingCauseCaseIds(mo.map((c) => c.id as number)));
  const choNguyenNhan: Record<string, { caseId: number; mt: number | null; sos: number | null; dot: string | null }> = {};
  for (const c of mo) if (cho.has(c.id)) choNguyenNhan[c.topic ?? c.category] = { caseId: c.id, mt: c.attempt_no ?? null, sos: c.sos_level ?? null, dot: c.attempt_kind ? nhanDot(c.attempt_kind, c.attempt_no ?? null) : null };   // lớp thường: `Giữa khoá` thay `MT2` (T58)
  return { ratio, topics: caseTopicsFor(ratio, chuongTrinh), chuongTrinh, choNguyenNhan };
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

/** Sửa phân loại vấn đề. Tối đa MỘT vấn đề chính — nhận định đổi được, có lịch sử. */
export function setIssues(p: Principal, caseId: number, input: {
  primaryCode?: string | null; secondaryCodes?: string[];
  observation?: string | null; note?: string | null;
}) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền phân loại vấn đề cho case này.');
  /* PR-S3F #8: Case tự tạo từ SOS chưa có nguyên nhân thì nguyên nhân chỉ đặt qua "Xác nhận Case" (mốc, mô tả, PA đi theo) — không đi đường vòng chỉ-API. */
  const trangThaiSos = sosCaseState(caseId);
  if (trangThaiSos.fromSos && !trangThaiSos.hasCause) {
    throw badRequest('Case tự tạo từ SOS chưa xác nhận nguyên nhân — dùng "Xác nhận Case" để đặt nguyên nhân.');
  }
  for (const code of [input.primaryCode, ...(input.secondaryCodes ?? [])]) {
    if (code && !issueBranchOf(code)) throw badRequest(`Mã vấn đề không hợp lệ: ${code}`);
  }
  if (laKhac(input.primaryCode)) {
    const loi = kiemGhiRoKhac(input.observation);
    if (loi) throw badRequest(`Phân loại "Khác": ${loi}.`);
  }
  return tx(() => {
    const before = conn.prepare('SELECT * FROM case_issues WHERE case_id = ?').all(caseId);
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(caseId);
    // Chủ đề lấy từ chính bản ghi vấn đề — người phân loại không đổi được kỹ năng ở đây.
    addIssues(caseId, p.userId, { ...input, topic: c.topic });
    /* Q28-5: có nguyên nhân là một nửa điều kiện "Đang xử lý" của Case từ SOS. */
    dongBoTrangThaiCase(caseId);
    if (input.note !== undefined) {
      conn.prepare('UPDATE sos_cases SET note = ?, updated_at = ? WHERE id = ?')
        .run((input.note ?? '').trim() || null, nowIso(), caseId);
    }
    const after = conn.prepare('SELECT * FROM case_issues WHERE case_id = ?').all(caseId);
    writeAudit({ actorUserId: p.userId, action: 'case.classify', entityType: 'sos_case', entityId: caseId,
      entityLabel: `Case ${caseId}`, before, after });
    return caseDetail(p, caseId);
  });
}

// ---------------------------------------------------------------- tác động và xem lại

/**
 * Ghi một TÁC ĐỘNG. Một case có nhiều tác động — đây là chỗ các cột cố định cũ không tả được.
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
}) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền ghi nhận hỗ trợ cho case này.');
  /* PR-S3F #2: thẻ "Không cần theo dõi" đang chờ Quản lý duyệt → chưa thêm PA (duyệt xong PA mới thêm sẽ bị huỷ oan). */
  if (sosCaseState(caseId).choDuyetKhongTheoDoi) {
    throw badRequest('Case đang chờ Quản lý duyệt "Không cần theo dõi" — chưa thêm phương án được. Chờ duyệt xong (hoặc bị từ chối) rồi thêm.');
  }
  if (!(INTERVENTION_KINDS as readonly string[]).includes(input.kind) || (SYSTEM_KINDS as readonly string[]).includes(input.kind)) throw badRequest('Loại hỗ trợ không hợp lệ.');   // PR-LT2a: PA Bổ trợ chỉ máy tạo
  const status = input.status && (INTERVENTION_STATUSES as readonly string[]).includes(input.status)
    ? input.status : 'completed';
  for (const [d, label] of [[input.plannedDate, 'Ngày dự kiến'], [input.startedDate, 'Ngày bắt đầu'],
    [input.completedDate, 'Ngày hoàn thành']] as const) {   // PR-SOS Q28-4: `followupDue` không còn nhận
    if (d && !isIsoDate(d)) throw badRequest(`${label} không hợp lệ.`);
  }
  /*
   * MÔ TẢ NGẮN BẮT BUỘC (mục 8.2).
   *
   * Tên loại phương án không nói được gì: "Học tutor" không cho người đọc sau ba tuần biết
   * tutor dạy gì, bao nhiêu buổi, đến khi nào. Đó chính là thứ mà một lần cập nhật kết quả
   * cần để so.
   */
  const moTa = (input.description ?? '').trim();
  if (moTa.length < 8) {
    throw badRequest('Mô tả ngắn phải nói rõ làm gì cho em — ít nhất 8 ký tự.');
  }
  /* T13: PA đề xuất "Khác" cần ô Ghi rõ ≥ 3 ký tự; không có cột riêng nên ghép `{ghi rõ} — {mô tả}` (Q9). */
  if (input.kind === 'other_proposal') {
    const loi = kiemGhiRoKhac(input.ghiRoKhac);
    if (loi) throw badRequest(`PA đề xuất "Khác": ${loi}.`);
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
      throw badRequest('Lùi lịch thi thì phải chọn lùi cái gì: '
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
  const nguoi = chuanHoaNguoiThucHien(p, input, { nhom: 'giao_vien', batBuoc: status !== 'planned' });
  const performerUserId = nguoi?.userId ?? null;
  const performerName = nguoi?.name ?? null;

  return tx(() => {
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
     *   · HẠN GHI KẾT QUẢ (`action_due`): kết quả tuần T2→CN ghi xong trước hết Thứ Hai tuần sau.
     *   · PR-SOS (Q28-4): KHÔNG còn "dự kiến kết thúc" — PA thường `followup_due` luôn NULL (mốc chỉ có ở PA quy chế).
     *
     * CHỐT 1 + 2 (mục 10.4) CHO PHƯƠNG ÁN NHẬP BÙ: không hạn cập nhật, không hạn kết thúc.
     * Phương án bắt đầu từ một ngày quá khứ xa (ví dụ tháng 7) mà vẫn tính hạn kiểu bình
     * thường thì `weeklyUpdateDue` ra một hạn đã trôi qua từ lâu — chính là "sinh ~10 dòng
     * quá hạn giả" mà chủ sản phẩm cảnh báo. Việc đã xong rồi thì không còn gì để mà tới hạn.
     */
    const updateDue = input.backfill ? null : (!cycleStart ? null : weeklyUpdateDue(cycleStart));
    const cycleDue = updateDue;

    const info = conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, performer_name,
                                         recorded_by, status, planned_date, started_date, completed_date,
                                         followup_due, action_due, cycle_no, cycle_started_on,
                                         needs_approval, approval_state, approval_due,
                                         reschedule_target, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?)`,
      )
      .run(caseId, input.kind, description,
           performerUserId, performerName, p.userId, effStatus,
           input.plannedDate ?? null, input.startedDate ?? null, input.completedDate ?? null,
           null, cycleDue, cycleStart,
           needsApproval ? 1 : 0, needsApproval ? 'pending' : null, approvalDue,
           rescheduleTarget, nowIso());
    const id = Number(info.lastInsertRowid);
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
        lyDo: description || null, hanDuyet: approvalDue,
      });
    }

    // Có tác động thì case chuyển sang đang xử lý — trừ khi đã đóng; Case từ SOS theo luật Q28-5.
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
    return caseDetail(p, caseId);
  });
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
}) {
  if ((input.decision as string) === 'comment') throw badRequest('Không còn Góp ý: Duyệt, hoặc Từ chối có lý do.');
  if (input.decision !== 'approved' && input.decision !== 'declined') throw badRequest('Chọn Duyệt hoặc Từ chối.');
  const conn = db();
  const iv = conn
    .prepare(
      /*
       * `sos_cases` KHÔNG có cột lớp — lớp suy ra từ bài đánh giá, hoặc từ lớp em đang học.
       * Giống hệt `loadCase`, để quyền của một case luôn tính trên cùng một lớp dù vào từ
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
    throw badRequest('Không duyệt thì phải ghi lý do, để giáo viên biết nên làm gì tiếp.');
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
    const startDue = input.decision === 'approved' ? weeklyUpdateDue(approvedOn) : null;
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
      title: input.decision === 'approved' ? 'Quản lý duyệt phương án hỗ trợ' : 'Quản lý không duyệt phương án',
      detail: [iv.description, note].filter(Boolean).join(' — ') || null,
      refTable: 'case_interventions', refId: interventionId, createdBy: p.userId,
      dedupKey: `plan-${input.decision}:${interventionId}`,
    });

    /* Người đề xuất nhận `duyet_ket_qua` từ thẻ (thay thông báo `plan-reply` cũ). */
    chotYeuCau(conn, { loai: 'de_xuat_pa', doiTuongLoai: 'intervention', doiTuongId: interventionId },
      input.decision === 'approved' ? 'duyet' : 'tu_choi', { nguoiDuyet: p.userId, lyDo: note });

    writeAudit({ actorUserId: p.userId, action: `case.plan.${input.decision}`,
      entityType: 'case_intervention', entityId: interventionId,
      entityLabel: iv.description ?? iv.kind, after: { decision: input.decision, note } });
    return caseDetail(p, iv.case_id);
  });
}

/**
 * ĐÁNH DẤU MỘT PHƯƠNG ÁN ĐÃ LÀM XONG — kèm NGÀY THỰC HIỆN.
 *
 * Đây là thao tác của mục 7.15: phương án thuộc case Ý thức/Khác thường chỉ cần đúng hai
 * thứ này, ghi chú tuỳ chọn. Phương án học thuật cũng dùng chung đường này, rồi mới hẹn
 * ngày xem lại nếu cần.
 *
 * Bản trước, hai việc trao đổi có đường ghi riêng ở bảng Liên hệ, còn phương án hỗ trợ thì
 * KHÔNG có cách nào đánh dấu đã xong — chỉ ghi thêm một phương án mới. Nay một đường cho
 * tất cả.
 *
 * NGÀY KHÔNG ĐƯỢC Ở TƯƠNG LAI: ghi "đã làm" cho một ngày chưa tới là ghi một việc chưa xảy
 * ra, và mọi thống kê "đã hỗ trợ bao nhiêu em" sẽ đếm nhầm.
 */
export function completeIntervention(p: Principal, interventionId: number, input: {
  doneOn?: string | null; note?: string | null;
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
}) {
  const conn = db();
  const iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  const c = loadCase(iv.case_id);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền cập nhật phương án của case này.');

  if (iv.preset === 1 && !iv.confirmed_at) {
    throw badRequest('Phương án điền sẵn này chưa được xác nhận — xác nhận (hoặc sửa / thay) trước khi ghi việc đã làm.');
  }
  if (iv.approval_state === 'pending') {
    throw badRequest('Phương án này đang chờ Quản lý duyệt, chưa ghi là đã làm được.');
  }
  const doneOn = input.doneOn ?? demoToday();
  /* PR-S3F #8 (T22): PA theo quy chế không khép sớm — chỉ khép ở lần ghi cuối (Ghi kết quả cuối), khi đã tới mốc. */
  if (iv.preset === 1 && !laLanGhiCuoi({ preset: true, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null }, isIsoDate(doneOn) ? doneOn : demoToday())) {
    throw badRequest('PA theo quy chế chưa tới mốc kết thúc — ghi kết quả từng tuần ở "Ghi kết quả PA"; PA chỉ khép ở lần ghi cuối.');
  }
  if (!isIsoDate(doneOn)) throw badRequest('Ngày thực hiện không hợp lệ.');
  if (doneOn > demoToday()) throw badRequest('Không ghi được ngày thực hiện ở tương lai.');

  return tx(() => {
    /*
     * NGƯỜI THỰC HIỆN chỉ ghi khi có lời khai rõ ràng. Người ghi vào hệ thống và người làm
     * là hai vai khác nhau: Admin ghi hộ việc CS gọi phụ huynh thì người làm là CS.
     */
    const performerUserId = input.performerSelf ? p.userId : (input.performerUserId ?? iv.performer_user_id);
    /* PR-S2 (S2): ghi chú KHÔNG ghi đè mô tả PA nữa (trước đây là ghi đè mất dấu). Ghi chú nằm ở hành trình và audit bên dưới. */
    conn
      .prepare(
        `UPDATE case_interventions
            SET status = 'completed', completed_date = ?,
                started_date = COALESCE(started_date, ?),
                performer_user_id = ?, performer_name = COALESCE(?, performer_name),
                updated_at = ?
          WHERE id = ?`,
      )
      .run(doneOn, doneOn, performerUserId ?? null, input.performerName ?? null,
           nowIso(), interventionId);

    /*
     * Case còn ở "chưa ai làm gì" mà vừa có một việc xong thì nó đang được xử lý — đổi
     * trạng thái để nó rời khỏi hàng đợi "chưa có phương án". Case đã đóng thì KHÔNG mở lại
     * chỉ vì ai đó ghi bù một việc cũ.
     */
    dongBoTrangThaiCase(iv.case_id);

    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: 'intervention', eventDate: doneOn,
      title: `Đã làm: ${INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] ?? iv.kind}`,
      detail: input.note ?? iv.description ?? null,
      refTable: 'case_interventions', refId: interventionId, createdBy: p.userId,
      dedupKey: `iv-done:${interventionId}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'case.intervention.complete',
      entityType: 'case_intervention', entityId: interventionId,
      entityLabel: iv.description ?? iv.kind, after: { doneOn, note: input.note ?? null } });
    return caseDetail(p, iv.case_id);
  });
}

/**
 * NHẬP BÙ MỘT CASE ĐÃ XỬ LÝ XONG TỪ LÂU (PR-C Task 3, mục 10.3–10.4).
 *
 * Ghi lại trí nhớ, không phải một sự kiện mới — nên gọi lại ĐÚNG BA hàm của đường thường
 * (`reportIssue` → `recordIntervention` × N → `closeCaseOutcome`) trong MỘT giao dịch, với
 * cờ `backfill: true` chảy suốt `reportIssue`/`recordIntervention`. Không viết đường ghi
 * database song song — trùng luật là cách sinh ra lỗi lệch giữa hai đường.
 *
 * KHÁC MỘT CHỖ SO VỚI CÂU CHỮ GỐC Ở `plan.md`: chuỗi gốc viết là `recordIntervention` →
 * `completeIntervention`, nhưng `recordIntervention` đã tự nhận đủ `startedDate`/
 * `completedDate`/`status: 'completed'` trong MỘT lần gọi — gọi thêm `completeIntervention`
 * sau đó chỉ tạo thêm một dòng hành trình "Đã làm: …" trùng lặp với dòng "Hỗ trợ: …" đã có,
 * không thêm thông tin gì mới. Bỏ bước thừa đó, ghi rõ ở đây để không ai tưởng là bỏ sót.
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
  const key = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() || null : null;
  if (!isIsoDate(input.fromDate) || !isIsoDate(input.toDate)) {
    throw badRequest('Khoảng ngày "từ → đến" không hợp lệ.');
  }
  if (input.fromDate > input.toDate) throw badRequest('Ngày bắt đầu phải trước ngày kết thúc.');
  if (input.toDate > today) throw badRequest('Không nhập bù được một case kết thúc ở tương lai.');

  if (!input.actions?.length) {
    throw badRequest('Ghi ít nhất một dòng "đã làm gì" — nhập bù mà không có việc gì đã làm thì không có gì để ghi.');
  }
  for (const [i, a] of input.actions.entries()) {
    if (!(FOLLOWUP_OUTCOMES as readonly string[]).includes(String(a.ketQua ?? ''))) throw badRequest(`Dòng PA ${i + 1}: chọn Kết quả PA.`);
    if (!isIsoDate(a.fromDate) || !isIsoDate(a.toDate)) throw badRequest('Một dòng "đã làm gì" có ngày không hợp lệ.');
    if (a.fromDate > a.toDate) throw badRequest('Một dòng "đã làm gì" có ngày bắt đầu sau ngày kết thúc.');
    if (a.toDate > today) throw badRequest('Không ghi được một việc đã xong ở ngày tương lai.');
    if ((a.description ?? '').trim().length < 3) throw badRequest('Mỗi dòng "đã làm gì" phải nói rõ đã làm gì.');
    chuanHoaNguoiThucHien(p, a, { nhom: 'giao_vien', batBuoc: true });
  }
  const note = (input.note ?? '').trim();
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
   * giữa chừng chứ không phải kết luận cuối của cả case), nên không cần chặn tay thêm.
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
     * CHỐT 6 (mục 10.4): KHÔNG kích hoạt cảnh báo case trùng như đường thường (đường thường
     * chặn khi hạng mục đã có case đang mở — case nhập bù đã đóng ngay khi tạo nên không đụng
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
          `Học viên này đã có một case nhập bù "${overlap.title ?? caseCategoryLabel(category)}" `
          + `trùng khoảng ${overlap.detected_at} → ${overlap.closed_at} — có phải cùng một lần không?`,
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
 * Ghi một lần XEM LẠI. Gắn với một tác động, hoặc gắn thẳng vào case khi chỉ đang theo dõi.
 *
 * `outcome` là quan sát, KHÔNG phải khẳng định tác động gây ra thay đổi. Vì vậy điểm tăng
 * cũng không tự đóng case — người có quyền mới quyết định.
 */
export function recordFollowUp(p: Principal, caseId: number, input: {
  interventionId?: number | null; observedOn?: string | null;
  outcome?: string | null; note?: string | null; evidenceAttemptId?: number | null;
}) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền ghi nhận theo dõi cho case này.');
  const observedOn = input.observedOn ?? demoToday();
  if (!isIsoDate(observedOn)) throw badRequest('Ngày quan sát không hợp lệ.');
  if (input.outcome && !(FOLLOWUP_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Kết quả quan sát không hợp lệ.');
  }
  if (input.interventionId) {
    const iv = conn.prepare('SELECT case_id, preset, confirmed_at FROM case_interventions WHERE id = ?').get(input.interventionId) as any;
    if (!iv || iv.case_id !== caseId) throw badRequest('Tác động không thuộc case này.');
    if (iv.preset === 1 && !iv.confirmed_at) {
      throw badRequest('Phương án điền sẵn này chưa được xác nhận — xác nhận (hoặc sửa / thay) trước khi ghi theo dõi.');
    }
  }
  // Bằng chứng phải là bài của CHÍNH học viên đó — không gắn nhầm sang em khác.
  if (input.evidenceAttemptId) {
    const a = conn.prepare('SELECT student_id FROM assessment_attempts WHERE id = ?').get(input.evidenceAttemptId) as any;
    if (!a || a.student_id !== c.eff_student_id) throw badRequest('Bằng chứng không thuộc học viên này.');
  }

  return tx(() => {
    const info = conn
      .prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                     outcome, note, evidence_attempt_id, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(caseId, input.interventionId ?? null, observedOn, p.userId,
           input.outcome ?? null, input.note ?? null, input.evidenceAttemptId ?? null, nowIso());
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
}

// ---------------------------------------------------------------- vòng đời

/**
 * Đổi hướng xử lý và/hoặc đóng case.
 *
 * ĐÓNG CASE BẮT BUỘC CÓ HƯỚNG XỬ LÝ. Không có thì không biết case kết thúc vì đã giải quyết
 * hay vì bị bỏ quên. Quyền đóng: GVCN của lớp và Quản lý trong phạm vi.
 */
export function setDisposition(p: Principal, caseId: number, input: {
  disposition?: string | null; note?: string | null; status?: string | null;
  /**
   * Ghi chi tiết theo kỹ năng khi kết luận case (mục 7.7 [5] Option 2) — TUỲ CHỌN.
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
      throw forbidden('Chỉ Quản lý, hoặc GVCN dạy đúng môn của Case, mới hoàn thành được Case này.');
    }
    const disposition = input.disposition ?? c.disposition;
    if (!disposition) {
      throw badRequest('Hoàn thành case thì phải chọn hướng xử lý — để biết case kết thúc vì đã giải quyết hay bị bỏ quên.');
    }
    /*
     * CHỈ ĐÓNG ĐƯỢC KHI MỌI PHƯƠNG ÁN ĐÃ KHÉP LẠI (mục 7.7 [5]).
     *
     * Và một case CHƯA CÓ PHƯƠNG ÁN NÀO cũng không đủ điều kiện: đếm được "0 phương án còn
     * mở" không có nghĩa là đã làm gì cho em. Thông báo NÓI RÕ còn thiếu gì, thay vì chỉ
     * làm mờ một cái nút và để người dùng tự đoán.
     */
    const blockers = closeBlockers(caseId);
    if (blockers.length) {
      throw badRequest(`Chưa hoàn thành case được. ${blockers.join(' ')}`);
    }
    if (disposition === 'monitor') {
      throw badRequest('"Chỉ theo dõi thêm" nghĩa là case còn mở. Chọn hướng khác nếu muốn đóng.');
    }
  } else {
    require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
      'Bạn không có quyền cập nhật case này.');
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
     * ĐIỂM KẾT LUẬN ghi thành một dòng cập nhật gắn thẳng vào case, không gắn vào phương án
     * nào — vì nó là kết luận của CẢ case, không phải kết quả của một vòng hỗ trợ. Nhờ vậy
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
    writeAudit({ actorUserId: p.userId, action: closing ? 'case.close' : 'case.disposition',
      entityType: 'sos_case', entityId: caseId, entityLabel: `Case ${caseId}`,
      before: { status: c.status, disposition: c.disposition },
      after: { status: input.status ?? c.status, disposition: input.disposition ?? c.disposition } });
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

export function caseDetail(p: Principal, caseId: number) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: c.class_id, studentId: c.eff_student_id },
    'Case này nằm ngoài phạm vi bạn được xem.');
  dienMocQuyChe({ caseIds: [caseId] });   // PR-SOS K3-14: mốc quy chế còn trống — có lịch rồi thì điền

  const student = conn
    .prepare('SELECT id, student_code, full_name, status FROM students WHERE id = ?')
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

  /* PR-S2 (S2): lịch sử điều chỉnh của mọi PA trong Case, một truy vấn. */
  const revs = lichSuDieuChinhCuaCase(caseId);
  /* PR-DUYET (Task 5, 9): thẻ hộp Chờ duyệt của mọi PA trong Case — một câu cho cả Case. */
  const theCuaPa = theCuaDoiTuong('intervention',
    (conn.prepare('SELECT id FROM case_interventions WHERE case_id = ?').all(caseId) as any[]).map((r) => r.id as number));
  const mtKeCua = mtKeTheoPa(caseId);

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
      performer: iv.performer_account ?? iv.performer_name ?? null,
      /** Tài khoản người làm hiện tại — panel Điều chỉnh lấy làm giá trị đầu (PR-UX3 Q15); null khi người làm ngoài hệ thống. */
      performerUserId: iv.performer_user_id ?? null,
      // Người ghi khác người làm thì nói rõ, để không đọc nhầm ai đã làm việc đó.
      recordedBy: iv.recorder_name ?? null,
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
      /* HẠN của chu kỳ đang chạy — hai tuần với case học thuật, một tuần với Ý thức/Khác. */
      actionDue: iv.action_due ?? null,
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
      /* PR-LT2a: PA Bổ trợ KHÔNG có bước Xác nhận PA — chờ kế hoạch được duyệt (`chuaChay`), không phải "Chờ xác nhận". */
      awaitingConfirmation: iv.kind !== 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned',
      chuaChay: iv.kind === 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned',
      /** PR-SOS (T22, T63): PA bắt buộc — không thay, không kết thúc sớm; `mocChu` chữ mốc; `lanCuoi` = lần ghi tới là "Ghi kết quả cuối". */
      batBuoc: iv.preset === 1,
      mocQuyChe: (iv.moc_quy_che ?? null) as string | null,
      mocChu: iv.preset === 1
        ? mocChuPa({ span: iv.moc_quy_che ?? null, followupDue: iv.followup_due ?? null, mtKe: mtKeCua(iv), daXacNhan: !!iv.confirmed_at }, demoToday())
        : null,
      lanCuoi: iv.status === 'started' && laLanGhiCuoi({ preset: iv.preset === 1, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null }, demoToday()),
      approvalState: iv.approval_state as string | null,
      approvalDue: iv.approval_due as string | null,
      approvalNote: iv.approval_note as string | null,
      approvedBy: iv.approver_name ?? null,
      approvalAt: iv.approval_at as string | null,
      /** PR-S2 (S2): mỗi lần sửa nội dung PA, cũ trước mới sau. Hàng chính luôn là bản hiện tại. */
      revisions: revs.get(iv.id) ?? [],
      /** PR-DUYET: thẻ ĐANG CHỜ mới nhất của PA (Đề xuất PA / Xin ý kiến) — Ngăn Case nhúng `TheYeuCau` khi người xem duyệt được. */
      yeuCau: theCuaPa.find((y) => y.doiTuongId === iv.id && y.trangThai === 'cho') ?? null,
      /** PR-DUYET (T64): lần Xin ý kiến mới nhất của PA (chờ hoặc đã trả lời) — dòng tím dưới PA. */
      xinYKien: theCuaPa.find((y) => y.doiTuongId === iv.id && y.loai === 'xin_y_kien' && y.trangThai !== 'tu_dong') ?? null,
    }));

  const followups = (conn
    .prepare(
      `SELECT f.*, u.full_name AS observer_name FROM case_followups f
         LEFT JOIN users u ON u.id = f.observer_user_id
        WHERE f.case_id = ? ORDER BY f.observed_on DESC, f.id DESC`,
    )
    .all(caseId) as any[]).map((f) => ({
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
    }));

  const ctCase: string | null = cycle ? cycle.programme_code ?? programmeCodeOfCycle(cycle.id) : null;
  const hoanThanh = c.status === 'done' ? null : chanHoanThanhCua(caseId);
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
    originKind: c.origin_kind,
    student: student ? { id: student.id, code: student.student_code, name: student.full_name, status: student.status } : null,
    cycle,
    classId: c.class_id,
    attemptId: c.attempt_id, attemptNo: c.attempt_no ?? null,
    /** Chủ đề — kỹ năng của case; mọi vấn đề đều phải có chỗ cất. */
    topic: c.topic as string | null,
    /** MH2: mã chương trình của lộ trình Case — web gọi `tenMon(chuongTrinh, …)` (FOU G+V/P, Pre FOU Tổng hợp). */
    chuongTrinh: ctCase,
    topicLabel: c.topic ? caseTopicLabel(c.topic, ctCase) : null,
    /** HẠNG MỤC — đơn vị của case từ vòng 4, dùng chung cho lớp FT và lớp Normal. */
    category: c.category ?? categoryOf(c.topic),
    categoryLabel: (c.category ?? categoryOf(c.topic)) ? tenMon(ctCase, c.category ?? categoryOf(c.topic)) : caseCategoryLabel(null),
    /** Tên case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
    title: caseTitleOf(c),
    /*
     * BA VAI KHÁC NHAU, KHÔNG SUY RA TỪ NHAU (mục 2.3):
     *   `owner`    — người phụ trách chính, chịu trách nhiệm điều phối case
     *   `reportedBy` — người ghi nhận vấn đề, có thể là người nhập hộ
     *   người thực hiện từng phương án — nằm trong chính phương án đó
     */
    ownerUserId: c.owner_user_id ?? null,
    owner: c.owner_user_id
      ? ((conn.prepare('SELECT full_name FROM users WHERE id = ?').get(c.owner_user_id) as any)?.full_name ?? null)
      : null,
    /** Case mở song song có chủ ý với một case khác cùng hạng mục. */
    parallel: !!c.parallel,
    /*
     * LỚP NÀY CHẤM KIỂU GÌ. Lớp Normal chấm điểm đạt/tổng, lớp Fast Track chấm band 0–9.
     * Ô ghi điểm giáo viên tự chấm phải hỏi đúng kiểu của lớp — hỏi band một lớp Normal là
     * hỏi một con số không tồn tại ở đó.
     */
    ratio: isRatioCycle(cycle ?? {}),
    /** Các hạng mục hợp lệ của lớp này — năm ô với FT, bốn ô với Normal. */
    categories: caseCategoriesFor(isRatioCycle(cycle ?? {}) ? 'ratio' : 'ielts_band', ctCase)
      .map((k) => ({ code: k, label: tenMon(ctCase, k) })),
    /** Số kỹ năng dưới kỳ vọng của CẢ LƯỢT. NULL với vấn đề giáo viên báo — không phải SOS 0. */
    sosLevel: c.sos_level,
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
    /** Hạn BÁO KẾT QUẢ của cả case — khác hạn làm từng phương án. */
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
    /** Các mốc trong vòng đời case — cũ trước mới sau, để màn case kể thành câu chuyện. */
    milestones: milestonesOf(caseId),
    /* Ngày demo, để giao diện so hạn mà không phải hỏi thêm một lần nữa. */
    today: demoToday(),
    issues, interventions, followups,
    /** Trạng thái case từ SOS (rulebook v3): chờ xác định nguyên nhân, hạn 3 ngày, lý do đóng `Không cần theo dõi`. */
    sos: sosCaseState(caseId),
    /** PR-SOS (S4-5): thẻ ĐANG CHỜ ở mức Case ("Không cần theo dõi") — Ngăn Case nhúng `TheYeuCau gon` cho Quản lý. */
    yeuCauCase: theCuaDoiTuong('sos_case', [caseId]).find((y) => y.trangThai === 'cho' && y.loai === 'khong_theo_doi') ?? null,
    /** PR-LT2a (N1, N2): khối PA Bổ trợ Giữa khoá — nhóm, môn, người dạy, kế hoạch (thẻ), hạn nộp, người xem nộp được không. `null` = Case không có PA bổ trợ. */
    boTro: boTroCuaCase(p, [caseId]).get(caseId) ?? null,
    /** PR-SOS (T21, §7.3, K3-07): tên Case SOS ba phần · MỘT nhãn trạng thái · MỘT việc tiếp — Ngăn Case chọn nút chính theo đây. */
    tenSos: c.origin_kind === 'mock' && (c.attempt_kind ?? 'mock') === 'mock'
      ? { mt: (conn.prepare('SELECT MAX(attempt_no) n FROM case_milestones WHERE case_id = ?').get(caseId) as any)?.n ?? c.attempt_no ?? null,
          giua: tenGiuaCua(c), sos: c.sos_level ?? null }
      : null,
    ...(() => {
      const st = sosCaseState(caseId);
      const v4 = {
        status: c.status, fromSos: st.fromSos, hasCause: st.hasCause, dismissed: !!st.dismissed, systemClosed: !!c.system_close_reason,
        choDuyetKhongTheoDoi: !!st.choDuyetKhongTheoDoi, coPaChoXacNhan: st.coPaChoXacNhan, hanXacNhan: st.dueOn, boTro: st.boTro,
        lyDoHeThong: c.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[c.system_close_reason as keyof typeof SYSTEM_CLOSE_REASON_LABEL] ?? null : null,
        rutSuaDiem: laRutSuaDiem(c),
      };
      const pas = interventions.filter((i) => i.status !== 'cancelled').map((i) => ({
        /* PR-LT2a: PA Bổ trợ nói "Bổ trợ" (mô tả dài `Bổ trợ 2 buổi/tuần · …` nằm ở hàng PA) — việc tiếp đọc `Ghi kết quả PA Bổ trợ`. */
        id: i.id, ten: tenPaViecTiep(i.kind, i.description),
        batBuoc: i.batBuoc, choXacNhan: i.awaitingConfirmation, xong: i.status === 'completed', actionDue: i.actionDue,
        followupDue: i.followupDue, choDuyet: i.approvalState === 'pending',
      }));
      const hanLapPa = c.origin_kind === 'mock' ? null : planDueDate(String(c.detected_at ?? c.created_at ?? demoToday()).slice(0, 10), c.urgency);
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
      canClose: canCloseCase(p, c),
      canApprove: can(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id }),
    },
  };
}

export type CaseFilters = {
  branchId?: number | null;
  classId?: number | null;
  studentId?: number | null;
  status?: string | null;
  origin?: string | null;
  skill?: string | null;
  /** Hàng đợi: new | active | due | review */
  queue?: string | null;
  /** Loại lớp: 'normal' hay 'ft'. Thay cho bộ lọc "Đầu mục" đã bỏ ở vòng 4 (mục 10.1). */
  classKind?: string | null;
  /** Người phụ trách chính — để bảng giáo viên đếm đúng trách nhiệm của từng người. */
  ownerUserId?: number | null;
  /** Chỉ những case CHƯA CÓ ai phụ trách — một nhóm việc riêng, không phải một trạng thái. */
  noOwner?: boolean;
  /**
   * PHẠM VI LỘ TRÌNH (mục 7.2). Chỉ dùng ở hồ sơ một học viên.
   *
   * Có `cycleId` thì chỉ lấy case của lộ trình đó; không có thì lấy TOÀN BỘ HÀNH TRÌNH,
   * gồm cả case đã hoàn thành từ lớp và lộ trình trước. Bộ lọc phải nói rõ phạm vi, để
   * không ai nhìn một danh sách ngắn rồi tưởng lịch sử đã mất.
   */
  cycleId?: number | null;
};

/**
 * Danh sách case cho màn quản lý.
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
  done: 'Đã xong',
};

/** Một dòng trong danh sách case, sau khi đã dựng xong. */
export type MappedCase = {
  id: number; originKind: string;
  studentId: number | null; studentName: string | null; studentCode: string | null;
  classId: number | null; classCode: string | null; branchId: number | null;
  homeClassId: number | null; homeBranchId: number | null;
  attemptId: number | null; attemptNo: number | null;
  sosLevel: number | null; urgency: string | null;
  summary: string | null; headline: string;
  /** Tên case tự sinh theo mốc mới nhất — "MT2 - Listening dưới kỳ vọng". */
  title: string;
  category: string | null; categoryLabel: string | null;
  primaryCode: string | null; primaryLabel: string | null;
  topic: string | null; topicLabel: string | null; issueBranch: string | null;
  classKind: 'ft' | 'normal';
  status: string; disposition: string | null;
  detectedAt: string; reporterName: string | null;
  /** NGƯỜI PHỤ TRÁCH CHÍNH — NULL nghĩa là chưa ai nhận, và đó là một việc phải xử lý. */
  ownerUserId: number | null; ownerName: string | null;
  /** Bốn ô để đọc một case mà không phải mở ra (mục 6.2 C). */
  currentPlan: string | null; currentPlanDue: string | null;
  lastOutcome: string | null; lastOutcomeOn: string | null; lastNextStep: string | null;
  interventionCount: number; nextDue: string | null; dueOverdue: boolean;
  /** Case mở SONG SONG có chủ ý với một case khác cùng hạng mục. */
  parallel: boolean;
  /** Case này nối tiếp case nào (vấn đề cũ tái phát sau khi đã chốt). */
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
  for (const k of ['studentId', 'classId', 'branchId', 'status', 'cycleId', 'origin', 'ownerUserId', 'noOwner'] as const) {
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
  /*
   * LỌC THEO LỚP EM ĐANG HỌC, không phải lớp lúc đánh giá.
   *
   * Bảng tổng hợp xếp case về lớp em đang học (để cột sĩ số và ba cột SOS nói về cùng một
   * nhóm người). Bấm vào con số đó phải ra ĐÚNG danh sách tạo nên nó — nếu bộ lọc ở đây vẫn
   * đi theo lớp lúc đánh giá thì một lớp vừa nhận bốn em chuyển sang sẽ hiện "19 case" mà
   * bấm vào lại ra danh sách rỗng.
   *
   * Em chưa xếp lớp thì lấy lớp của bài — vẫn hơn là rơi ra khỏi mọi bộ lọc.
   */
  if (f.classId) { where.push(`${LOP_CUA_CASE} = ?`); params.push(f.classId); }
  if (f.branchId) { where.push(`${CN_CUA_CASE} = ?`); params.push(f.branchId); }
  if (f.status) { where.push('sc.status = ?'); params.push(f.status); }
  if (f.cycleId) { where.push('COALESCE(sc.cycle_id, a.cycle_id) = ?'); params.push(f.cycleId); }
  if (f.origin) { where.push('sc.origin_kind = ?'); params.push(f.origin); }
  /* Lọc theo NGƯỜI PHỤ TRÁCH — để bảng giáo viên đếm đúng trách nhiệm của từng người. */
  if (f.ownerUserId) { where.push('sc.owner_user_id = ?'); params.push(f.ownerUserId); }
  if (f.noOwner) where.push('sc.owner_user_id IS NULL');

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
              COALESCE(ac.programme_code, cc.programme_code) AS class_ct,
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

  /*
   * LƯỢT MT MỚI NHẤT của từng case, lấy MỘT LẦN cho cả danh sách.
   *
   * Tên case tự sinh theo mốc mới nhất, nên cần con số này. Hỏi từng case một thì một bảng
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
   * PHƯƠNG ÁN ĐANG CHẠY và KẾT QUẢ GẦN NHẤT của từng case, lấy MỘT LẦN cho cả danh sách.
   *
   * Đây là hai thứ khiến một dòng case đọc được mà không phải mở ra: "đang làm gì" và "lần
   * gần nhất ăn thua đến đâu". Trước vòng này dòng case chỉ nói "đang xử lý · 2 việc" —
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

  /* Kỹ năng của một case = kỹ năng của các dòng phân loại. Một case có thể chạm nhiều kỹ năng. */
  const skillsByCase = new Map<number, string[]>();
  for (const r of conn
    .prepare('SELECT case_id, skill FROM case_issues WHERE skill IS NOT NULL').all() as any[]) {
    const cur = skillsByCase.get(r.case_id) ?? [];
    if (!cur.includes(r.skill)) cur.push(r.skill);
    skillsByCase.set(r.case_id, cur);
  }

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
      /* Lớp Normal và lớp FT chấm khác nhau, nên bộ lọc loại lớp là bộ lọc ĐẦU TIÊN. */
      classKind: (r.class_is_ft ? 'ft' : 'normal') as 'ft' | 'normal',
      attemptId: r.attempt_id, attemptNo: r.attempt_no, attemptKind: r.attempt_kind ?? null,
      sosLevel: r.sos_level, urgency: r.urgency,
      summary: r.summary,
      headline: caseHeadline({
        summary: r.summary, originKind: r.origin_kind, sosLevel: r.sos_level, attemptNo: r.attempt_no,
        attemptKind: r.attempt_kind ?? null,
      }),
      /*
       * TÊN NGƯỜI DÙNG TỰ ĐẶT LUÔN THẮNG (mục 7.3).
       *
       * Bản trước chỗ này luôn dựng lại tên tự sinh, nên một case giáo viên đặt tên "Nghe
       * sót số và tên riêng" lên danh sách lại thành "Listening dưới kỳ vọng" — trong khi
       * mở ra xem thì đúng tên đã gõ. Cùng một case mang hai cái tên ở hai màn là cách
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
      /** Nhánh phân loại nguyên nhân, khi đã có người dạy nhận định. */
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
        : isNoPlanCase({ status: r.status, disposition: r.disposition, interventionCount: r.intervention_count as number }) ? 'no_plan'
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
   * mà chip kỹ năng vẫn đếm cả case lớp FT thì bấm vào ra danh sách ngắn hơn con số trên
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
    /** Số case theo loại lớp — để chip Normal/FT có con số trước khi bấm. */
    classKind: tally(all, (r) => r.classKind),
    /** Ba trạng thái loại trừ nhau, cộng lại đúng bằng tổng. */
    state: tally(both, (r) => r.state),
    /*
     * Vấn đề cũ CHƯA GẮN ĐƯỢC KỸ NĂNG đếm riêng, để các số cộng lại đúng bằng tổng. Bước
     * nâng cấp cố ý không đoán bừa kỹ năng cho những case trượt từ hai kỹ năng trở lên.
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
 *   2. Có case không, đang thế nào?  → trạng thái, đã kéo qua mấy lượt MT
 *   3. Đã áp dụng phương án nào?     → phương án mới nhất và kết quả của nó
 *
 * Hạng mục KHÔNG có case vẫn hiện một dòng. Đó là điểm khác với danh sách case: người dạy
 * cần thấy cả những môn đang ổn, nếu không thì "không thấy Reading" có hai nghĩa — ổn, hoặc
 * chưa ai nhập điểm — và hai nghĩa ấy dẫn tới hai việc khác hẳn nhau.
 */
export function skillSupportBoard(p: Principal, studentId: number, cycleId?: number | null) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  const enr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
    .get(studentId) as any;
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: enr?.class_id ?? null, studentId },
    'Bạn không có quyền xem học viên này.');
  dienMocQuyChe({ studentId });   // PR-SOS K3-14

  /*
   * ĐƯỢC SỬA HAY KHÔNG — trả về sẵn cùng bảng kỹ năng.
   *
   * Hồ sơ học viên nay ghi kết quả NGAY TRONG THẺ CASE, nên nó phải biết trước có được ghi
   * hay không: người chỉ có quyền xem thì không thấy nút, thay vì bấm vào rồi nhận một câu
   * từ chối.
   *
   * (AUTH-01) KHÔNG còn một cờ chung cho cả bảng — case Học thuật siết đúng kỹ năng, nên
   * GV Listening được sửa case Listening mà KHÔNG được sửa case Reading trên CÙNG một bảng.
   * Tính riêng cho từng case ở chỗ dựng thẻ case bên dưới (`sosEditCtx(c)`), không phải một
   * lần hỏi chung ở đây.
   */

  const cycle = cycleId
    ? (conn.prepare('SELECT * FROM learning_cycles WHERE id = ? AND student_id = ?').get(cycleId, studentId) as any)
    : currentCycle(studentId);

  /*
   * ĐIỂM HAI LƯỢT GẦN NHẤT của từng ô nhập điểm, để nói được "tăng hay giảm".
   * Chỉ lấy lượt đã có điểm và chưa bị huỷ — lượt mới xếp tuần chưa nói gì về em.
   */
  const ratio = isRatioCycle(cycle);
  /*
   * ĐIỂM CỦA TỪNG Ô NHẬP — và LỚP NORMAL KHÔNG DÙNG CỘT `band`.
   *
   * Fast Track chấm band IELTS nên đọc `band`. Lớp Normal chấm ĐIỂM ĐẠT trên TỔNG của chính
   * đề đó (21/40), nên `band` của nó luôn trống. Bản trước chỉ đọc `band`, nên hồ sơ một em
   * lớp Foundation có cột "Kết quả gần nhất" trống trơn trong khi bảng điểm ngay bên dưới
   * bày đủ bốn môn — đúng kiểu số liệu đá nhau mà cả mục 4.2 sinh ra để dẹp.
   */
  const scoreRows = conn
    .prepare(
      `SELECT a.attempt_no, a.id AS attempt_id, a.kind, rp.code AS period_code, a.target_at_attempt,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route,
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
    /* Lớp Normal: điểm đạt/tổng của chính đề đó. Fast Track để trống. */
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
    const rr = ratio ? ratioResult(r.raw_score, r.raw_total) : null;
    const list = byCategory.get(cat) ?? [];
    list.push({
      attemptNo: r.attempt_no, attemptId: r.attempt_id,
      band: ratio ? r.raw_score : r.band,
      score: ratio ? r.raw_score : null,
      total: ratio ? r.raw_total : null,
      passed: rr ? rr.outcome === 'pass' : null,
      week: r.period_code ?? null,
      expectation: !ratio && r.target_at_attempt !== null && r.target_at_attempt !== undefined
        ? expectationFor(r.target_at_attempt, r.attempt_no, r.route) : null,
      attemptKind: r.kind ?? null,
    });
    byCategory.set(cat, list);
  }

  /*
   * CASE CỦA LỘ TRÌNH KHÁC VẪN CÒN MỞ THÌ PHẢI HIỆN — dán nhãn rõ, không giấu.
   *
   * Một em học xong LT1 rồi sang LT2 mà case Listening của LT1 chưa chốt thì đó vẫn là việc
   * đang treo của một đứa trẻ có thật. Lọc bỏ nó đi thì bảng sáu dòng nói "không có case"
   * trong khi thẻ tên phía trên vẫn hiện SOS 2 — đúng kiểu số liệu đá nhau owner đã nêu.
   *
   * Xếp sau case của lộ trình đang chọn, nên nó chỉ được chọn làm đại diện khi lộ trình này
   * chưa có case nào ở hạng mục đó.
   */
  const caseRows = conn
    .prepare(
      `SELECT *, (COALESCE(cycle_id, 0) != ?) AS carried_over, (SELECT cy.started_at FROM learning_cycles cy WHERE cy.id = sos_cases.cycle_id) AS lo_trinh_bat_dau,
              (SELECT u.full_name FROM users u WHERE u.id = sos_cases.owner_user_id) AS owner_name FROM sos_cases
        WHERE student_id = ?
          AND (COALESCE(cycle_id, 0) = ? OR status != 'done')
        ORDER BY carried_over, (status = 'done'), parallel, id DESC`,
    )
    .all(cycle?.id ?? 0, studentId, cycle?.id ?? 0) as any[];
  /* AN-8: số bằng chứng của MỌI Case trên bảng — một câu hỏi, không phải một câu cho mỗi thẻ. */
  const soBangChung = demBangChungCase(caseRows.map((c) => c.id as number));
  const boTroMap = boTroCuaCase(p, caseRows.map((c) => c.id as number));   // PR-LT2a: theo TẬP, không hỏi từng Case

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
   * "Cập nhật nghiệp vụ" là một lần ai đó làm gì với case — ghi kết quả, thêm phương án,
   * đổi kết luận. KHÔNG dùng `updated_at` chung: một lần chạy nền chạm vào bản ghi sẽ đẩy
   * case đó lên đầu như thể vừa có người xử lý, và thứ tự trên màn hình thành vô nghĩa.
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
   * phải có dòng — không thì bảng và thẻ tóm tắt nói "không có case" trong khi Case còn mở. Dòng thêm xếp sau các ô chuẩn.
   */
  const oChuan: readonly string[] = caseCategoriesFor(isRatioCycle(cycle) ? 'ratio' : 'ielts_band', ctBang);
  const oNgoai = [...new Set(caseRows.filter((c) => c.status !== 'done' || !c.carried_over).map((c) => (c.category ?? categoryOf(c.topic)) as string | null)
    .filter((k): k is string => !!k && !oChuan.includes(k)))];
  const rows = [...oChuan, ...oNgoai].map((category) => {
    const points = byCategory.get(category) ?? [];
    const latest = points[points.length - 1] ?? null;
    const prev = points.length > 1 ? points[points.length - 2] : null;

    /*
     * Case ĐẠI DIỆN cho hạng mục: ưu tiên cái đang mở, mới nhất. Không có cái nào đang mở
     * thì lấy cái đã đóng gần nhất — "đã từng có vấn đề và đã xử lý xong" là một câu trả
     * lời khác hẳn "chưa từng có vấn đề", và người dạy cần phân biệt hai câu đó.
     */
    const mine = caseRows.filter((c) => (c.category ?? categoryOf(c.topic)) === category);
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
    const lastDone = interventions.find((i) => i.status === 'completed') ?? null;
    const lastFollow = primary
      ? (conn
          .prepare(
            `SELECT outcome, observed_on, note FROM case_followups
              WHERE case_id = ? ORDER BY observed_on DESC, id DESC LIMIT 1`,
          )
          .get(primary.id) as any)
      : null;

    /*
     * TRẠNG THÁI HIỂN THỊ — bốn mức, và mỗi mức dẫn tới một việc khác nhau:
     *   none      chưa từng có case ở hạng mục này
     *   no_plan   có case mà CHƯA AI đề ra phương án   → cần người quyết
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
      label: tenMon(ctBang, category),
      short: tenMonNgan(ctBang, category),
      chuongTrinh: ctBang,
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
      /* Lớp Normal: điểm đạt/tổng của đề gần nhất, để giao diện ghi "21/40" chứ không ghi band. */
      score: latest?.score ?? null,
      total: latest?.total ?? null,
      ratio,
      kck: !!cycle?.khong_cam_ket,
      /*
       * DƯỚI KỲ VỌNG — hai chương trình, hai cách hỏi. Fast Track so band với kỳ vọng của
       * chính lượt đó; lớp Normal so tỷ lệ đạt với ngưỡng của chương trình.
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
      /** Một dòng "đã hỗ trợ gì" dựng từ dữ liệu thật, không phải câu chung chung. */
      supportLine: supportLineOf(openIv, lastDone, lastFollow),
      openActions: openIv.length,
      overdueActionDue: overdueAction?.action_due ?? null,
      /** Hạn ghi kết quả tuần gần nhất của PA đang chạy (bỏ PA chờ duyệt) — ô "Việc cần làm tiếp" dùng (K3-02). */
      nextActionDue: openIv.filter((i) => i.action_due && (i.approval_state ?? '') !== 'pending')
        .map((i) => i.action_due as string).sort()[0] ?? null,
      pendingApproval: interventions.some((i) => i.approval_state === 'pending'),

      /*
       * ĐỦ CÁC CASE CỦA KỸ NĂNG NÀY (mục 4.2) — không chỉ một case đại diện.
       *
       * Em có hai case Reading song song thì cái thứ hai phải có đường vào. Trước đây bảng
       * này chỉ trỏ được vào một case, nên case còn lại chỉ tồn tại ở một khối khác bên
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
           * lấy riêng `skill` theo đúng case (`sosEditCtx` không dùng được thẳng ở đây vì
           * khác tên trường `class_id`/`eff_student_id`).
           */
          canEdit: can(p, PERMISSIONS.SOS_EDIT, {
            classId: enr?.class_id ?? null, studentId,
            skill: c.topic ?? undefined,
          }),
          /*
           * HOÀN THÀNH CASE NGAY TRÊN THẺ (PR-D). Khối `CasePanel` nhúng bên dưới thẻ đã bị
           * gỡ, nên thẻ tự nói: người xem có chốt được không, và còn gì đang chặn. Lấy đúng
           * hai hàm mà nút "Hoàn thành case" ở trang riêng vẫn hỏi — không phép tính thứ hai.
           */
          canClose: canCloseCase(p, { class_id: enr?.class_id ?? null, student_id: studentId, topic: c.topic }),
          closeBlockers: c.status === 'done' ? [] : closeBlockers(c.id),
          /* Đủ thứ để vẽ MỘT THẺ CASE mà không phải gọi thêm một đường nữa (mục 1 · 2). */
          ...caseCardOf(c.id, c, soBangChung, boTroMap.get(c.id) ?? null),
        }))
        .sort((a, b) => {
          const open = (x: typeof a) => (x.status === 'done' ? 1 : 0);
          if (open(a) !== open(b)) return open(a) - open(b);
          const t = (b.touchedOn ?? '').localeCompare(a.touchedOn ?? '');
          if (t !== 0) return t;
          return b.id - a.id;
        }),
    };
  });

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
 * Hồ sơ học viên bày case thành các khối gọn: phân loại, câu mô tả, rồi MỖI PHƯƠNG ÁN MỘT
 * KHỐI NHỎ có tên, người làm, kết quả gần nhất kèm ngày, hạn cập nhật và ngày dự kiến xong.
 *
 * Gộp sẵn ở máy chủ vì giao diện cần cả mấy thứ này CÙNG LÚC cho từng case, và một em có thể
 * có năm case: để giao diện tự gọi từng case một là năm lần gọi cho một lần mở trang.
 *
 * (Trước 21/09/2026 thẻ này còn trả "báo cáo nguồn" của case Ý thức; Ý thức nay là vi phạm và biện pháp xử lý ở một bảng riêng.)
 */
function caseCardOf(caseId: number, c: any, soBangChung: Map<number, number>, boTro: BoTroDto | null = null) {
  const conn = db();
  const today = demoToday();

  const issue = conn
    .prepare(`SELECT taxonomy_code FROM case_issues WHERE case_id = ? AND role = 'primary' LIMIT 1`)
    .get(caseId) as any;

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
      `SELECT fu.*, u.full_name AS observer FROM case_followups fu
         LEFT JOIN users u ON u.id = fu.observer_user_id
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
      choXacNhan: iv.kind !== 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned',
      chuaChay: iv.kind === 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned',
      mocChu: iv.preset === 1 ? mocChuPa({ span: iv.moc_quy_che ?? null, followupDue: iv.followup_due ?? null, mtKe: mtKe(iv), daXacNhan: !!iv.confirmed_at }, today) : null,
      lanCuoi: iv.status === 'started' && laLanGhiCuoi({ preset: iv.preset === 1, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null }, today),
      performer: iv.performer_user_name ?? iv.performer_name ?? null,
      /** PR-VAI-b (Q2): người ghi kết quả PA — đúng cột Công việc dùng (`performer_user_id ?? recorded_by`, `mywork.ts` 2b). */
      nguoiId: (iv.performer_user_id ?? iv.recorded_by ?? null) as number | null,
      nguoiTen: (iv.performer_user_id ? iv.performer_user_name : iv.recorder_user_name) ?? null as string | null,
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
        }))
        .sort((a, b) => a.on.localeCompare(b.on)),
    };
  });

  const sos = sosCaseState(caseId);
  const v4 = {
    status: c.status, fromSos: sos.fromSos, hasCause: sos.hasCause, dismissed: !!sos.dismissed, systemClosed: !!c.system_close_reason,
    choDuyetKhongTheoDoi: !!sos.choDuyetKhongTheoDoi, coPaChoXacNhan: sos.coPaChoXacNhan, hanXacNhan: sos.dueOn, boTro: sos.boTro,
    lyDoHeThong: c.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[c.system_close_reason as keyof typeof SYSTEM_CLOSE_REASON_LABEL] ?? null : null,
    rutSuaDiem: laRutSuaDiem(c),
  };
  const viecTiep = viecTiepCuaCase(v4, plans.map((pl) => ({
    lopCu: laPaLopCu(ivs.find((iv) => iv.id === pl.id)),
    id: pl.id, ten: tenPaViecTiep(pl.kind, pl.name), batBuoc: pl.batBuoc, choXacNhan: pl.choXacNhan, xong: pl.status === 'completed',
    actionDue: pl.actionDue, followupDue: pl.followupDue, choDuyet: pl.pendingApproval,
  })), today, c.origin_kind === 'mock' ? null : planDueDate(String(c.detected_at ?? c.created_at ?? today).slice(0, 10), c.urgency));
  /* Lượt đánh giá mà case này đã đi qua — "MT2 · 17/08" ở chân thẻ (lớp thường: "Giữa khoá"/"Cuối khoá" thay MT{n}). */
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
    /* Chủ đề gốc của case (§7.5, PR-K) — để giao diện mở đúng danh mục phân loại (`issuesForTopic`) khi "Xác định nguyên nhân". */
    topic: c.topic ?? null,
    issueCode: issue?.taxonomy_code ?? null,
    issueLabel: issue?.taxonomy_code ? issueLabel(issue.taxonomy_code) : null,
    summary: c.summary ?? null,
    /* Case tự tạo từ SOS còn chờ GVBM xác định nguyên nhân / xác nhận phương án điền sẵn (§3.2, §7.5 — PR-K). */
    sos,
    /** PR-SOS (T21): tên Case SOS tách ba phần để giao diện vẽ chip `[MT1]` + phần giữa + chip `[SOS 3]` — null với Case tay / lớp thường. */
    tenSos: c.origin_kind === 'mock' && attempts.every((x) => (x.attemptKind ?? 'mock') === 'mock')
      ? { mt: attempts.length ? Math.max(...attempts.map((x) => x.attemptNo)) : null, giua: tenGiuaCua(c), sos: c.sos_level ?? null } : null,
    /** PR-SOS (§7.3, K3-07): MỘT nhãn trạng thái + MỘT việc tiếp của Case — bảng kỹ năng, Ngăn Case, đầu hồ sơ đọc chung. */
    trangThaiV4: trangThaiCaseV4(v4, today),
    viecTiep,
    nguoiLam: nguoiLamCua(viecTiep, c, plans, boTro),
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
     * NHẬP BÙ (PR-C Task 3, chốt 7) — "ai nhập, nhập lúc nào" phải hiện ngay trên thẻ case,
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
 * với Công việc (Q2): Xác nhận nguyên nhân / Xác nhận PA / Đề ra PA → người phụ trách Case · Ghi kết quả → người ghi PA · Nộp kế hoạch →
 * người dạy bổ trợ · Chờ Quản lý duyệt → "Quản lý" (vai, không tên). Tên đọc sẵn trong câu Case / câu PA (JOIN) — không câu thêm.
 */
function nguoiLamCua(v: { chu: string; paId?: number } | null, c: any, plans: { id: number; nguoiId: number | null; nguoiTen: string | null }[], boTro: BoTroDto | null): { id: number | null; ten: string | null } | null {
  if (!v) return null;
  if (v.chu.startsWith('Chờ Quản lý')) return { id: null, ten: 'Quản lý' };
  const pa = v.paId ? plans.find((pl) => pl.id === v.paId) : null;
  const [id, ten] = pa ? [pa.nguoiId, pa.nguoiTen]
    : v.chu === 'Nộp kế hoạch bổ trợ' ? [boTro?.nguoiDay?.userId ?? null, boTro?.nguoiDay?.ten ?? null]
    : [c.owner_user_id ?? null, c.owner_name ?? null];
  return id ? { id, ten } : null;
}

/**
 * MỘT DÒNG "ĐÃ HỖ TRỢ GÌ" — ghép từ phương án đang làm, việc vừa xong và kết quả của nó.
 *
 * Cố ý KHÔNG viết câu chung chung kiểu "đang hỗ trợ". Người đọc cần biết hỗ trợ bằng CÁCH
 * NÀO và có ăn thua không; câu chung chung thì vẫn phải mở case ra mới biết, tức là dòng đó
 * không tiết kiệm được cú bấm nào.
 */
function supportLineOf(openIv: any[], lastDone: any | null, lastFollow: any | null): string | null {
  const name = (iv: any) => (iv.description ?? '').trim()
    || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || iv.kind;
  /*
   * Ngày viết theo lối người Việt đọc (19/09), không phải lối máy lưu (2026-09-19).
   * Dòng này ghép sẵn ở máy chủ nên phải tự định dạng — giao diện không tách ra được nữa.
   */
  const day = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '');
  if (openIv.length) {
    const first = openIv[0];
    const who = first.performer_name_user ?? first.performer_name ?? null;
    return [
      name(first),
      who ? `· ${who}` : '· chưa có người thực hiện',
      openIv.length > 1 ? `· và ${openIv.length - 1} việc nữa` : null,
    ].filter(Boolean).join(' ');
  }
  if (lastDone) {
    return [
      name(lastDone),
      lastDone.completed_date ? `· xong ${day(lastDone.completed_date)}` : null,
      lastFollow?.outcome ? `· ${FOLLOWUP_OUTCOME_LABEL[lastFollow.outcome as FollowUpOutcome] ?? lastFollow.outcome}` : null,
    ].filter(Boolean).join(' ');
  }
  return null;
}

/**
 * ĐỔI NGƯỜI PHỤ TRÁCH CHÍNH của một case (mục 2.3).
 *
 * Đổi người phụ trách KHÔNG cấp thêm quyền cho ai: người mới vẫn chỉ làm được những gì vai
 * và phân công của họ cho phép. Nó chỉ trả lời câu "ai đang giữ việc này" — câu mà trước
 * vòng này không có chỗ nào trả lời được.
 */
export function setCaseOwner(p: Principal, caseId: number, ownerUserId: number | null) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
    'Bạn không có quyền đổi người phụ trách case này.');
  if (ownerUserId !== null) {
    const u = conn.prepare("SELECT id, full_name FROM users WHERE id = ? AND status = 'active'").get(ownerUserId) as any;
    if (!u) throw badRequest('Không tìm thấy người này, hoặc tài khoản đã ngừng hoạt động.');
  }
  return tx(() => {
    const before = c.owner_user_id
      ? ((conn.prepare('SELECT full_name FROM users WHERE id = ?').get(c.owner_user_id) as any)?.full_name ?? null)
      : null;
    conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ?')
      .run(ownerUserId, nowIso(), caseId);
    const after = ownerUserId
      ? ((conn.prepare('SELECT full_name FROM users WHERE id = ?').get(ownerUserId) as any)?.full_name ?? null)
      : null;
    conn
      .prepare(
        `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
         VALUES (?, 'owner', ?, ?, ?, ?)`,
      )
      .run(caseId, before, after, p.userId, nowIso());
    return caseDetail(p, caseId);
  });
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
 *   · có TỔNG ĐIỂM → hiểu là điểm đạt/tổng, ví dụ 24/40 (lớp Normal, hoặc số câu đúng)
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
     * THÀNH PHẦN phải thuộc đúng kỹ năng đó (mục 9.3): không ghi "Passage 2" cho một case
     * Listening. Danh mục thành phần là của chung, nên chỉ có một chỗ quyết định.
     */
    const component = (m?.component ?? '').toString().trim() || null;
    if (component && !(componentsFor(skill) as readonly string[]).includes(component)) {
      throw badRequest(`"${component}" không phải thành phần của ${CASE_CATEGORY_LABEL[skill as CaseCategory] ?? skill}.`);
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
      throw badRequest(`${component} ghi theo số câu đạt/tổng số câu, không phải band.`);
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
  } | null;
  /** Người thực hiện chu kỳ vừa rồi, nếu chưa ghi lúc lên kế hoạch. */
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
  /** Điểm GIÁO VIÊN TỰ CHẤM kèm theo — không phải điểm chính thức. */
  metrics?: unknown;
}) {
  const conn = db();
  const iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  const c = loadCase(iv.case_id);
  /* PR-LT2a (Q9): PA Bổ trợ do người dạy (mặc định GVCN cho FOU) ghi — `quyenBoTro`; PA khác vẫn theo kỹ năng (C02). */
  if (iv.kind === 'bo_tro' || iv.kind === 'bo_tro_mien_phi') {
    if (!quyenBoTro(p, iv)) throw forbidden('Bạn không có quyền cập nhật kết quả của case này.');
  } else {
    require_(p, PERMISSIONS.SOS_EDIT, sosEditCtx(c),
      'Bạn không có quyền cập nhật kết quả của case này.');
  }

  if (iv.preset === 1 && !iv.confirmed_at) {
    throw badRequest('Phương án điền sẵn này chưa được xác nhận — xác nhận (hoặc sửa / thay) trước khi ghi kết quả.');
  }
  if (iv.approval_state === 'pending') {
    throw badRequest('Phương án này đang chờ Quản lý duyệt — chu kỳ thực hiện chưa bắt đầu.');
  }
  if (iv.status === 'cancelled') throw badRequest('Phương án này đã huỷ.');
  if (iv.status === 'completed') {
    throw badRequest('Phương án này đã kết thúc — không cập nhật thêm chu kỳ được.');
  }

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
    throw badRequest('Kết quả không hợp lệ với loại case này.');
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
   * PR-SOS (T22, T63, K3-12, M-17): PA THEO QUY CHẾ không thay, không kết thúc sớm. Lần ghi chạm/qua mốc (`laLanGhiCuoi`) là "Ghi kết quả
   * cuối": bỏ qua quyết định, PA khép `het_moc` — không tự đóng im lặng.
   */
  const batBuoc = iv.preset === 1;
  const lanCuoi = laLanGhiCuoi({ preset: batBuoc, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null }, observedOn);
  if (batBuoc && !lanCuoi) {
    const cam = input.decision !== undefined
      ? !quyetDinhChoPa({ preset: true }, false).includes(input.decision as PlanDecision)
      : mode === 'end';
    if (cam) throw badRequest('PA theo quy chế — không thay, không kết thúc sớm.');
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
    if (!canEndWithOutcome(input.outcome) && String(input.decisionNote ?? '').trim().length < 8) {
      throw badRequest('"Chưa đủ dữ liệu" ở lần ghi cuối thì ghi Lý do, ít nhất 8 ký tự.');
    }
  } else if (mode === 'end') {
    /* PR-S2 (Q2): Chưa đủ dữ liệu vẫn không Kết thúc suông, nhưng THAY được (`endStepsFor('insufficient')` = ['propose']). */
    if (!canEndWithOutcome(input.outcome) && nextStep !== 'propose') {
      throw badRequest('"Chưa đủ dữ liệu" thì chưa kết thúc phương án được, chọn Giữ nguyên, Điều chỉnh hoặc Thay phương án.');
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
      throw badRequest('Chọn "Thay phương án" thì phải nói rõ phương án mới là gì.');
    }
  }
  /*
   * PR-S2: VÌ SAO ĐỔI là điều luật bắt buộc audit (rulebook §18.2 điểm 2). Điều chỉnh và Thay phải có lý do.
   * Kiểm SAU các lỗi của `mode === 'end'` để câu "phương án mới là gì" vẫn báo trước (phép kiểm [9.1]).
   */
  const decisionNote = String(input.decisionNote ?? '').trim() || null;
  if ((nextStep === 'adjust' || nextStep === 'propose') && (decisionNote ?? '').length < 8) {
    throw badRequest('Điều chỉnh hoặc thay phương án thì phải ghi Lý do, ít nhất 8 ký tự.');
  }
  /* PR-DUYET (T64): câu hỏi gửi Quản lý là nội dung của thẻ Xin ý kiến — bắt buộc. */
  if (nextStep === 'ask_manager' && (decisionNote ?? '').length < 8) {
    throw badRequest('Xin hỗ trợ Quản lý thì ghi rõ cần Quản lý giúp gì, ít nhất 8 ký tự.');
  }
  /* T13: thay sang PA đề xuất "Khác" — báo thiếu Ghi rõ TRƯỚC khi ghi gì (`recordIntervention` kiểm lại lần nữa). */
  if (nextStep === 'propose' && input.newPlan?.kind === 'other_proposal') {
    const loi = kiemGhiRoKhac(input.newPlan.ghiRoKhac ?? input.ghiRoKhac);
    if (loi) throw badRequest(`PA đề xuất "Khác": ${loi}.`);
  }
  /* PR-LT2b: lần ghi cuối của PA Bổ trợ miễn phí = ghi Mini Test (một lần cho cả nhóm). Kiểm TRƯỚC khi ghi gì. */
  const mtDong = iv.kind === 'bo_tro_mien_phi' && lanCuoi
    ? conn.prepare('SELECT * FROM mini_test WHERE nhom_bo_tro = ? AND ty_le IS NULL').get(iv.nhom_bo_tro) as any : null;
  if (mtDong && !input.miniTest) throw badRequest('Ghi kết quả cuối của bổ trợ miễn phí thì nhập Mini Test (% và ngày làm).');
  const mtGhi = mtDong ? kiemMiniTest(mtDong, input.miniTest!) : null;
  const remainingIssue = String(input.remainingIssue ?? '').trim() || null;
  if (remainingIssue && remainingIssue.length > 300) throw badRequest('Vấn đề còn tồn tối đa 300 ký tự.');
  /* Điều chỉnh: chuẩn hoá TRƯỚC giao dịch; sai thì không ghi gì. */
  const adjustPatch = nextStep === 'adjust' ? chuanHoaDieuChinh(p, iv, input.adjust, observedOn) : null;
  const metrics = normalizeMetrics(input.metrics);
  if (input.evidenceAttemptId) {
    const a = conn.prepare('SELECT student_id FROM assessment_attempts WHERE id = ?').get(input.evidenceAttemptId) as any;
    if (!a || a.student_id !== c.eff_student_id) throw badRequest('Bằng chứng không thuộc học viên này.');
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
                                     remaining_issue, decision_note, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(iv.case_id, interventionId, observedOn, p.userId,
           input.outcome, note, input.evidenceAttemptId ?? null,
           nextStep, cycleNo, cycleDue, late, metrics ? JSON.stringify(metrics) : null,
           remainingIssue, decisionNote, nowIso());
    const followupId = Number(fInfo.lastInsertRowid);

    /*
     * PR-Form: CHỈ CHUẨN HOÁ VÀ GHI ĐÈ KHI BODY THẬT SỰ GỬI MỘT TRONG BA TRƯỜNG NGƯỜI THỰC HIỆN. Trước đây
     * `performer_name = COALESCE(?, performer_name)` giữ tên cũ khi chỉ gửi `performerUserId` — kết quả là CẢ HAI cột
     * cùng có giá trị, phá luật "chỉ một trong hai" (Q5). Nay không gửi gì thì giữ nguyên cả hai cột đúng như cũ.
     */
    const nguoiGuiLen = input.performerSelf || input.performerUserId != null || (input.performerName ?? '').trim()
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
       * HẠN GHI KẾT QUẢ chuyển sang hết Thứ Hai tuần sau (mục 8.3, R-PA1). Ghi đúng hôm Thứ Hai
       * hạn thì hạn mới là hết Thứ Hai tuần sau, không phải chính hôm nay — nếu không, vừa lưu
       * xong đã thấy báo quá hạn.
       *
       * MỐC giữ nguyên (PR-SOS Q28-4: không còn "dự kiến kết thúc" mặc định — PA thường luôn NULL, PA quy chế giữ mốc quy chế).
       *
       * PR-DUYET (T64, K3-11): "Xin hỗ trợ QL" lưu y như Giữ nguyên — PA KHÔNG dừng, không mất mốc (T22) — rồi gửi câu hỏi
       * thành thẻ Xin ý kiến (ngay dưới). Trước đây PA dừng hẳn chờ Quản lý.
       */
      const nextDue = weeklyUpdateDue(addDays(observedOn, 1));
      conn
        .prepare(
          `UPDATE case_interventions
              SET status = 'started', cycle_no = ?, cycle_started_on = ?, action_due = ?,
                  started_date = COALESCE(started_date, ?),
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
        kind: input.newPlan!.kind,
        description: input.newPlan!.description ?? null,
        performerSelf: input.newPlan!.performerSelf ?? false,
        performerUserId: input.newPlan!.performerUserId ?? null,
        performerName: input.newPlan!.performerName ?? null,
        status: 'started', startedDate: observedOn,
        rescheduleTarget: input.newPlan!.rescheduleTarget ?? null,
        ghiRoKhac: input.newPlan!.ghiRoKhac ?? input.ghiRoKhac ?? null,
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
    if (nextStep === 'ask_manager') {
      const doiTuong = { loai: 'xin_y_kien' as const, doiTuongLoai: 'intervention', doiTuongId: interventionId };
      /* Lần 1 còn chờ (một thẻ chờ cho mỗi PA): KHÔNG ném lỗi — kết quả tuần đã lưu; câu hỏi mới nối vào thẻ đang chờ + báo lại QL. */
      const moi = taoYeuCau(conn, {
        ...doiTuong, hocVienId: c.eff_student_id, lopId: c.class_id ?? null, nguoiXin: p.userId,
        lyDo: decisionNote, duLieu: { followupId },
      });
      if (moi === null) boSungYeuCau(conn, doiTuong, { lyDo: decisionNote, duLieu: { followupId }, ngay: observedOn });
    }

    dongBoTrangThaiCase(iv.case_id);
    /* PR-LT2a (M-03): PA bổ trợ chung — chép kết quả sang các dòng khác của nhóm. */
    chepKetQuaNhom(conn, iv, followupId, {
      nextStep, observedOn, completedOn, lanCuoi, nextDue: weeklyUpdateDue(addDays(observedOn, 1)),
      apDungDieuChinh: (sib, fid) => apDungDieuChinh(sib, adjustPatch!, { followupId: fid, actorUserId: p.userId, reason: decisionNote!, on: observedOn }),
    });
    if (mtDong && mtGhi) ghiMiniTestTrongTx(conn, p, mtDong, mtGhi);   // PR-LT2b: sau khi cả nhóm đã khép

    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: 'followup', eventDate: observedOn,
      title: `Kết quả sau hỗ trợ: ${outcomeLabelFor(input.outcome)}`,
      detail: [
        INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] ?? iv.kind,
        NEXT_STEP_LABEL[nextStep as NextStep],
        note || null,
        decisionNote ? `${nextStep === 'adjust' || nextStep === 'propose' ? 'Lý do' : 'Ghi chú'}: ${decisionNote}` : null,
        remainingIssue ? `Còn tồn: ${remainingIssue}` : null,
      ].filter(Boolean).join(' · '),
      refTable: 'case_followups', refId: followupId, createdBy: p.userId,
      dedupKey: `followup:${followupId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.result.update',
      entityType: 'case_intervention', entityId: interventionId,
      entityLabel: iv.description ?? iv.kind,
      after: { outcome: input.outcome, mode, nextStep, late: !!late, cycleNo, remainingIssue, decisionNote, adjust: adjustPatch },
    });
    return caseDetail(p, iv.case_id);
  });
}

/**
 * CÒN GÌ CHẶN VIỆC HOÀN THÀNH CASE — mục 7.7 [5].
 *
 * Case chỉ đóng được khi MỌI phương án đã khép lại và không còn gì đang chờ. Và một case
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
  return chanHoanThanh(rows.map((r) => ({
    batBuoc: r.preset === 1, xong: r.status === 'completed', choDuyet: r.approval_state === 'pending', followupDue: r.followup_due ?? null,
    mocChu: r.preset === 1 ? mocChuPa({ span: r.moc_quy_che ?? null, followupDue: r.followup_due ?? null, mtKe: mtKe(r), daXacNhan: !!r.confirmed_at }, demoToday()) : '',
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