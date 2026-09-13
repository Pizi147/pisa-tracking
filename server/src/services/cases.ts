import { db, tx } from '../db.ts';
import {
  DISPOSITIONS, INTERVENTION_KINDS, INTERVENTION_KIND_LABEL, INTERVENTION_STATUSES,
  FOLLOWUP_OUTCOMES, BEHAVIOUR_TOPICS, CASE_DECISIONS, CASE_OUTCOMES, ENTRY_SKILLS,
  ISSUE_ROLES, PERMISSIONS, THREAD_TRACKS, URGENCY_LEVELS,
  CASE_CATEGORIES, CASE_CATEGORY_SHORT, FOLLOWUP_OUTCOME_LABEL,
  CASE_OUTCOME_LABEL, caseCategoryLabel, caseDedupKey, caseHeadline, caseTitle, categoryOf,
  dueDaysFor, isProposalKind,
  issueBranchOf, issueLabel, threadTopicLabel, urgencyFromSos,
  type CaseOutcome, type FollowUpOutcome, type InterventionKind,
} from '../../../shared/domain.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, isCoreTeacherOf, require_, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, notify, writeAudit } from './audit.ts';
import { currentCycle } from './cycles.ts';
import { expectationFor } from './scoring.ts';

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
  id: number; category?: string | null; track?: string | null; topic?: string | null;
  origin_kind?: string | null; sos_level?: number | null;
}): string {
  const latest = db()
    .prepare(
      `SELECT attempt_no FROM case_milestones
        WHERE case_id = ? AND attempt_no IS NOT NULL
        ORDER BY attempt_no DESC LIMIT 1`,
    )
    .get(c.id) as any;
  return caseTitle({
    category: c.category ?? categoryOf(c.track ?? 'academic', c.topic),
    latestAttemptNo: latest?.attempt_no ?? null,
    originKind: c.origin_kind,
    failedCount: c.sos_level ?? null,
  });
}

/** Các mốc của một case, cũ trước mới sau — màn case đọc từ trên xuống là ra câu chuyện. */
export function milestonesOf(caseId: number) {
  return (db()
    .prepare(
      `SELECT m.*, u.full_name AS actor_name FROM case_milestones m
         LEFT JOIN users u ON u.id = m.created_by
        WHERE m.case_id = ? ORDER BY m.occurred_on, m.id`,
    )
    .all(caseId) as any[])
    .map((m) => ({
      id: m.id, kind: m.kind, attemptId: m.attempt_id, attemptNo: m.attempt_no,
      band: m.band, expectation: m.expectation, sosLevel: m.sos_level,
      occurredOn: m.occurred_on, note: m.note, actorName: m.actor_name,
    }));
}

/**
 * CHỐT KẾT QUẢ CẢ CASE (mục 7.14).
 *
 * CHỈ CHỐT ĐƯỢC KHI MỌI PHƯƠNG ÁN ĐÃ CÓ KẾT QUẢ. Chốt sớm thì con số "đã xử lý xong" nói
 * dối: vẫn còn một việc treo mà case đã biến khỏi danh sách của mọi người.
 *
 * Ba lựa chọn của owner gộp thành hai trường, vì lựa chọn (1) luôn phải đi kèm (2) hoặc (3):
 *   `outcome`   mức độ thành công — bốn mức bấm nhanh, kèm ghi chú tuỳ chọn
 *   `decision`  'end' kết thúc hẳn · 'extend' kéo dài theo dõi + thêm phương án mới
 *
 * "Kéo dài theo dõi" KHÔNG đóng case: nó chỉ chốt đợt vừa rồi rồi để case mở tiếp, và ghi
 * một mốc để lần sau đọc lại biết đợt đó đã kết luận gì.
 */
export function closeCaseOutcome(p: Principal, caseId: number, input: {
  outcome: string; note?: string | null; decision: string;
}) {
  const conn = db();
  const c = loadCase(caseId);
  if (!canCloseCase(p, c)) {
    throw badRequest('Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới chốt được kết quả case.');
  }
  if (!(CASE_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Mức độ thành công không hợp lệ.');
  }
  if (!(CASE_DECISIONS as readonly string[]).includes(input.decision)) {
    throw badRequest('Hãy chọn kết thúc hẳn hay kéo dài theo dõi.');
  }

  const pending = conn
    .prepare(
      `SELECT kind, description FROM case_interventions
        WHERE case_id = ? AND status IN ('planned', 'started')`,
    )
    .all(caseId) as any[];
  if (pending.length) {
    const first = (pending[0].description ?? '').trim()
      || INTERVENTION_KIND_LABEL[pending[0].kind as InterventionKind] || 'một phương án';
    throw badRequest(
      `Còn ${pending.length} phương án chưa có kết quả (${first}). `
      + 'Cập nhật kết quả từng phương án xong rồi mới chốt kết quả chung của case.',
    );
  }

  const today = demoToday();
  return tx(() => {
    conn
      .prepare(
        `UPDATE sos_cases
            SET outcome = ?, outcome_note = ?, outcome_decision = ?,
                outcome_by = ?, outcome_at = ?,
                status = ?, closed_by = ?, closed_at = ?,
                disposition = COALESCE(disposition, ?),
                updated_at = ?
          WHERE id = ?`,
      )
      .run(input.outcome, (input.note ?? '').trim() || null, input.decision,
           p.userId, nowIso(),
           input.decision === 'end' ? 'done' : 'in_progress',
           input.decision === 'end' ? p.userId : null,
           input.decision === 'end' ? today : null,
           input.decision === 'end' ? 'action' : 'monitor',
           nowIso(), caseId);

    conn
      .prepare(
        `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(dedup_key) DO NOTHING`,
      )
      .run(caseId, input.decision === 'end' ? 'closed' : 'extended', today,
           [CASE_OUTCOME_LABEL[input.outcome as CaseOutcome], (input.note ?? '').trim() || null]
             .filter(Boolean).join(' — '),
           p.userId, nowIso(), `outcome:${caseId}:${today}:${input.decision}`);

    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: input.decision === 'end' ? 'case_closed' : 'followup', eventDate: today,
      title: input.decision === 'end'
        ? `Chốt kết thúc case: ${CASE_OUTCOME_LABEL[input.outcome as CaseOutcome]}`
        : `Kéo dài theo dõi: ${CASE_OUTCOME_LABEL[input.outcome as CaseOutcome]}`,
      detail: (input.note ?? '').trim() || null,
      refTable: 'sos_cases', refId: caseId, createdBy: p.userId,
      dedupKey: `case_outcome:${caseId}:${today}:${input.decision}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'case.outcome', entityType: 'sos_case',
      entityId: caseId, entityLabel: caseTitleOf(c),
      after: { outcome: input.outcome, decision: input.decision } });
    return caseDetail(p, caseId);
  });
}

/** Đổi hạn BÁO KẾT QUẢ của case. Mặc định là hết tuần MT kế tiếp, nhưng sửa được. */
export function setFollowUntil(p: Principal, caseId: number, date: string | null) {
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id },
    'Bạn không có quyền đổi hạn theo dõi của case này.');
  if (date && !isIsoDate(date)) throw badRequest('Hạn theo dõi không hợp lệ.');
  db().prepare('UPDATE sos_cases SET follow_until = ?, updated_at = ? WHERE id = ?')
    .run(date, nowIso(), caseId);
  return caseDetail(p, caseId);
}

export function canCloseCase(p: Principal, c: { class_id?: number | null; student_id?: number | null }): boolean {
  if (can(p, PERMISSIONS.MEETING_EDIT, { branchId: null, anyScope: true })) return true;
  if (c.class_id && isCoreTeacherOf(p, c.class_id)) return true;
  return can(p, PERMISSIONS.CASE_CLOSE, { classId: c.class_id ?? null, studentId: c.student_id ?? null });
}

function loadCase(caseId: number) {
  const c = db()
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id,
              a.class_id AS attempt_class_id, a.attempt_no,
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

// ---------------------------------------------------------------- giáo viên báo vấn đề

/**
 * GIÁO VIÊN BÁO VẤN ĐỀ — không cần chờ Mock, không tạo bài đánh giá giả.
 *
 * `sos_level` để NULL: SOS 1/2/3 là số kỹ năng dưới kỳ vọng ở một bài, giáo viên không có
 * bài nào để đếm. Mức độ gấp là một thang riêng, ghi ở `urgency`.
 *
 * Chống trùng bằng `idempotency_key`: bấm hai lần hoặc thử lại sau lỗi mạng chỉ ra một case.
 */
export function reportIssue(p: Principal, input: {
  studentId: number;
  cycleId?: number | null;
  summary: string;
  urgency?: string;
  /** Học thuật hay Ý thức — hai đầu mục, không hơn. */
  track?: string;
  /** Học thuật: một trong năm ô L·R·W1·W2·S. Ý thức: một trong bốn nhóm. */
  topic?: string | null;
  primaryCode?: string | null;
  secondaryCodes?: string[];
  note?: string | null;
  observation?: string | null;
  detectedAt?: string | null;
  idempotencyKey?: string;
  /** Người dùng đã thấy cảnh báo case trùng và chọn "Ghi vào case đang có". */
  mergeIntoExisting?: boolean;
  /** Người dùng đã thấy cảnh báo và chọn "Đây là vấn đề khác, mở case riêng". */
  parallel?: boolean;
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
  require_(p, PERMISSIONS.SOS_EDIT, { classId, studentId: input.studentId },
    'Bạn chỉ báo được vấn đề của học viên trong phạm vi mình phụ trách.');

  const summary = (input.summary ?? '').trim();
  if (!summary) throw badRequest('Cần một câu mô tả vấn đề.');

  /*
   * MỌI VẤN ĐỀ PHẢI CÓ CHỖ CẤT. Không có đầu mục và chủ đề thì nó rơi vào "chưa phân loại"
   * và biến mất khỏi mọi bảng tổng hợp theo kỹ năng — đúng thứ vòng 3 sinh ra để sửa.
   */
  const track = (THREAD_TRACKS as readonly string[]).includes(input.track ?? '')
    ? input.track! : 'academic';
  const topics: readonly string[] = track === 'behaviour' ? BEHAVIOUR_TOPICS : ENTRY_SKILLS;
  const topic = (input.topic ?? '').trim() || null;
  if (!topic) {
    throw badRequest(track === 'behaviour'
      ? 'Hãy chọn nhóm ý thức: chuyên cần, BTVN, tham gia trên lớp hay khác.'
      : 'Hãy chọn kỹ năng: Listening, Reading, Writing Task 1, Writing Task 2 hay Speaking.');
  }
  if (!topics.includes(topic)) throw badRequest(`Chủ đề không hợp lệ: ${topic}`);
  const urgency = input.urgency && (URGENCY_LEVELS as readonly string[]).includes(input.urgency)
    ? input.urgency : 'normal';
  const detectedAt = input.detectedAt ?? demoToday();
  if (!isIsoDate(detectedAt)) throw badRequest('Ngày phát hiện không hợp lệ.');

  const key = input.idempotencyKey?.trim() || null;
  if (key) {
    const seen = conn.prepare('SELECT id FROM sos_cases WHERE idempotency_key = ?').get(key) as any;
    if (seen) return caseDetail(p, seen.id);
  }

  // Lộ trình phải chọn rõ; không có thì lấy lộ trình đang mở, và ghi rõ nếu không có.
  const cycle = input.cycleId
    ? (conn.prepare('SELECT * FROM learning_cycles WHERE id = ? AND student_id = ?')
        .get(input.cycleId, input.studentId) as any)
    : currentCycle(input.studentId);
  if (input.cycleId && !cycle) throw badRequest('Lộ trình không thuộc học viên này.');

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
  const category = categoryOf(track, topic);
  const dedupKey = caseDedupKey({
    track, category, originKind: 'teacher_report',
    studentId: input.studentId, cycleId: cycle?.id ?? null, attemptId: null,
    parallel: input.parallel,
  });
  const existing = dedupKey
    ? (conn.prepare(`SELECT * FROM sos_cases WHERE dedup_key = ? AND status != 'done'`).get(dedupKey) as any)
    : null;

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
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category, origin_kind,
                                detected_at, reported_by, summary, urgency, sos_level, status,
                                note, idempotency_key, dedup_key, parallel, created_at)
         VALUES (NULL, ?,?,?,?,?, 'teacher_report', ?,?,?,?, NULL, 'open', ?,?,?,?,?)`,
      )
      .run(input.studentId, cycle?.id ?? null, track, topic, category,
           detectedAt, p.userId, summary, urgency,
           (input.note ?? '').trim() || null, key,
           input.parallel ? null : dedupKey, input.parallel ? 1 : 0, nowIso());
    const caseId = Number(info.lastInsertRowid);

    /* Mốc mở case — để màn case kể được từ đầu, kể cả case không sinh từ điểm. */
    conn
      .prepare(
        `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
         VALUES (?, 'opened', ?,?,?,?,?)`,
      )
      .run(caseId, detectedAt, input.parallel ? 'Mở song song với case đang có' : 'Giáo viên tự báo',
           p.userId, nowIso(), `open:${caseId}`);

    addIssues(caseId, p.userId, { ...input, topic });

    addJourney({
      studentId: input.studentId, cycleId: cycle?.id ?? null,
      eventType: 'case_opened', eventDate: detectedAt,
      title: `Giáo viên ghi nhận vấn đề${input.primaryCode ? `: ${issueLabel(input.primaryCode)}` : ''}`,
      detail: summary,
      refTable: 'sos_cases', refId: caseId, createdBy: p.userId,
      dedupKey: `case_open:${caseId}`,
    });
    notifyManagers(
      { id: caseId, class_id: classId, eff_student_id: input.studentId }, 'report', summary, caseId, p.userId,
    );
    writeAudit({ actorUserId: p.userId, action: 'case.report', entityType: 'sos_case', entityId: caseId,
      entityLabel: `${student.student_code} · ${summary.slice(0, 40)}`, after: { urgency, detectedAt } });
    return caseDetail(p, caseId);
  });
}

/**
 * Phân loại NGUYÊN NHÂN bên trong một vấn đề. Chủ đề (kỹ năng / nhóm ý thức) nằm ở chính
 * bản ghi vấn đề; ở đây chỉ nói VÌ SAO, và đó là nhận định của người dạy.
 *
 * "Hoàn cảnh kèm theo" đã bỏ (owner chốt 10/09/2026) — thay bằng ô Ghi chú của vấn đề.
 */
function addIssues(caseId: number, actor: number | null, input: {
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
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id },
    'Bạn không có quyền phân loại vấn đề cho case này.');
  for (const code of [input.primaryCode, ...(input.secondaryCodes ?? [])]) {
    if (code && !issueBranchOf(code)) throw badRequest(`Mã vấn đề không hợp lệ: ${code}`);
  }
  return tx(() => {
    const before = conn.prepare('SELECT * FROM case_issues WHERE case_id = ?').all(caseId);
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(caseId);
    // Chủ đề lấy từ chính bản ghi vấn đề — người phân loại không đổi được kỹ năng ở đây.
    addIssues(caseId, p.userId, { ...input, topic: c.topic });
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
/**
 * BÁO CHO QUẢN LÝ CHI NHÁNH.
 *
 * Quản lý không thể ngồi canh từng lớp, nên mọi phương án hỗ trợ đều tới tay họ: cần duyệt
 * thì là việc phải làm, không cần duyệt thì là tin để biết. Trước đây giáo viên báo một vấn
 * đề mà Quản lý hoàn toàn không nhận được gì — phải tự mở màn ra mới thấy.
 */
function notifyManagers(
  c: any, kind: 'approval' | 'plan' | 'report', what: string, refId: number, actorId: number | null,
) {
  const conn = db();
  const branchId = c.branch_id ?? (c.class_id
    ? (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(c.class_id) as any)?.branch_id
    : null);
  const student = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(c.eff_student_id) as any;

  /* Quản lý của CHÍNH chi nhánh đó, cộng người có phạm vi toàn hệ thống. */
  const managers = conn
    .prepare(
      `SELECT DISTINCT ur.user_id FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE r.key IN ('manager', 'system_admin')
          AND (ur.branch_id IS NULL OR ur.branch_id = ?)`,
    )
    .all(branchId ?? -1) as any[];

  const title = kind === 'approval' ? `Chờ duyệt phương án — ${student?.full_name ?? 'học viên'}`
    : kind === 'plan' ? `Đã có phương án hỗ trợ — ${student?.full_name ?? 'học viên'}`
    : `Giáo viên báo vấn đề — ${student?.full_name ?? 'học viên'}`;

  for (const m of managers) {
    if (m.user_id === actorId) continue;      // không tự báo cho chính mình
    notify({
      userId: m.user_id, kind: kind === 'approval' ? 'approval' : 'case',
      title, body: what.slice(0, 120),
      entityType: 'sos_case', entityId: c.id,
      dedupKey: `${kind}:${refId}`,
    });
  }
}

export function recordIntervention(p: Principal, caseId: number, input: {
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
}) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id },
    'Bạn không có quyền ghi nhận hỗ trợ cho case này.');
  if (!(INTERVENTION_KINDS as readonly string[]).includes(input.kind)) throw badRequest('Loại hỗ trợ không hợp lệ.');
  const status = input.status && (INTERVENTION_STATUSES as readonly string[]).includes(input.status)
    ? input.status : 'completed';
  for (const [d, label] of [[input.plannedDate, 'Ngày dự kiến'], [input.startedDate, 'Ngày bắt đầu'],
    [input.completedDate, 'Ngày hoàn thành'], [input.followupDue, 'Ngày xem lại']] as const) {
    if (d && !isIsoDate(d)) throw badRequest(`${label} không hợp lệ.`);
  }
  // "Đã xong" phải có ngày thực tế; nếu không thì nó mới là "đang thực hiện".
  if (status === 'completed' && !input.completedDate && !input.startedDate) {
    throw badRequest('Ghi "đã xong" thì phải có ngày thực hiện. Chưa có ngày thì chọn "đang thực hiện".');
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
  const needsApproval = !!input.needsApproval || isProposalKind(input.kind);
  if (needsApproval && status !== 'planned') {
    throw badRequest('Phương án cần Quản lý duyệt thì để ở "đã lên kế hoạch", chưa ghi là đã làm.');
  }
  const performerUserId = input.performerUserId
    ?? (input.performerSelf && !input.performerName?.trim() ? p.userId : null);
  if (!performerUserId && !input.performerName?.trim() && status !== 'planned') {
    throw badRequest('Cần ghi ai là người thực hiện — người nhập không mặc định là người làm.');
  }

  return tx(() => {
    /*
     * Hạn Quản lý phải trả lời suy thẳng từ mức gấp của vấn đề: 7 · 5 · 3 ngày. Cùng một
     * bảng với hạn xử lý vấn đề, nên không ai phải nhớ hai thang. Quá hạn KHÔNG chặn gì cả
     * — nó chỉ nổi lên màn của Quản lý để một đề xuất không nằm im mãi.
     */
    const approvalDue = needsApproval
      ? addDays(demoToday(), dueDaysFor(c.urgency, c.sos_level))
      : null;

    const info = conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, performer_name,
                                         recorded_by, status, planned_date, started_date, completed_date,
                                         followup_due, needs_approval, approval_state, approval_due, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(caseId, input.kind, input.description ?? null,
           performerUserId, input.performerName?.trim() || null, p.userId, status,
           input.plannedDate ?? null, input.startedDate ?? null, input.completedDate ?? null,
           input.followupDue ?? null,
           needsApproval ? 1 : 0, needsApproval ? 'pending' : null, approvalDue, nowIso());
    const id = Number(info.lastInsertRowid);

    /*
     * BÁO CHO QUẢN LÝ TRONG MỌI TRƯỜNG HỢP (owner chốt 10/09/2026).
     *
     * Cần duyệt thì đây là việc phải làm; không cần duyệt thì vẫn là tin đáng biết — Quản lý
     * nắm được giáo viên đang xoay xở thế nào mà không phải đi hỏi từng người.
     */
    notifyManagers(c, needsApproval ? 'approval' : 'plan', input.description ?? input.kind, id, p.userId);

    // Có tác động thì case chuyển sang đang xử lý — trừ khi đã đóng.
    if (c.status === 'open') {
      conn.prepare(`UPDATE sos_cases SET status = 'in_progress', updated_at = ? WHERE id = ?`).run(nowIso(), caseId);
    }
    addJourney({
      studentId: c.eff_student_id, cycleId: c.eff_cycle_id,
      eventType: 'intervention', eventDate: input.completedDate ?? input.startedDate ?? demoToday(),
      title: `Hỗ trợ: ${input.description?.slice(0, 60) || input.kind}`,
      detail: input.performerName ?? null,
      refTable: 'case_interventions', refId: id, createdBy: p.userId,
      dedupKey: `intervention:${id}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'case.intervention', entityType: 'case_intervention',
      entityId: id, entityLabel: `Case ${caseId} · ${input.kind}`, after: { status } });
    return caseDetail(p, caseId);
  });
}

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ XUẤT.
 *
 * Ba cách trả lời, và cả ba đều là một câu trả lời thật:
 *   duyệt      — đồng ý, giáo viên tiến hành
 *   không duyệt — không làm phương án này, phải ghi lý do
 *   góp ý      — chưa quyết, nhưng có ý kiến; vẫn còn trong hàng chờ
 *
 * Quá hạn KHÔNG tự duyệt và cũng không tự huỷ. Im lặng không bao giờ được hiểu thành đồng ý —
 * nó chỉ làm đề xuất nổi lên màn của Quản lý mỗi ngày cho tới khi có người trả lời.
 */
export function respondToPlan(p: Principal, interventionId: number, input: {
  decision: 'approved' | 'declined' | 'comment'; note?: string | null;
}) {
  const conn = db();
  const iv = conn
    .prepare(
      /*
       * `sos_cases` KHÔNG có cột lớp — lớp suy ra từ bài đánh giá, hoặc từ lớp em đang học.
       * Giống hệt `loadCase`, để quyền của một case luôn tính trên cùng một lớp dù vào từ
       * đâu; viết `sc.class_id` là sai và sẽ hỏng ngay khi chạy.
       */
      `SELECT iv.*, sc.student_id, sc.attempt_id,
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
  if (input.decision === 'comment' && !note) throw badRequest('Hãy viết góp ý.');

  return tx(() => {
    if (input.decision === 'comment') {
      // Góp ý KHÔNG kết thúc việc chờ — Quản lý vẫn nợ một câu trả lời.
      conn.prepare('UPDATE case_interventions SET approval_note = ?, updated_at = ? WHERE id = ?')
        .run(note, nowIso(), interventionId);
    } else {
      conn
        .prepare(
          `UPDATE case_interventions
              SET approval_state = ?, approval_by = ?, approval_at = ?, approval_note = ?,
                  status = CASE WHEN ? = 'declined' THEN 'cancelled' ELSE status END,
                  updated_at = ?
            WHERE id = ?`,
        )
        .run(input.decision, p.userId, nowIso(), note, input.decision, nowIso(), interventionId);
    }

    addJourney({
      studentId: iv.eff_student_id, cycleId: iv.eff_cycle_id,
      eventType: input.decision === 'declined' ? 'plan_declined' : 'plan_approved',
      eventDate: demoToday(),
      title: input.decision === 'approved' ? 'Quản lý duyệt phương án hỗ trợ'
        : input.decision === 'declined' ? 'Quản lý không duyệt phương án'
        : 'Quản lý góp ý về phương án',
      detail: [iv.description, note].filter(Boolean).join(' — ') || null,
      refTable: 'case_interventions', refId: interventionId, createdBy: p.userId,
      dedupKey: `plan-${input.decision}:${interventionId}`,
    });

    // Báo lại cho người đề xuất — họ đang chờ câu trả lời này.
    if (iv.recorded_by && iv.recorded_by !== p.userId) {
      notify({
        userId: iv.recorded_by, kind: 'approval',
        title: input.decision === 'approved' ? 'Phương án của bạn đã được duyệt'
          : input.decision === 'declined' ? 'Phương án của bạn không được duyệt'
          : 'Quản lý góp ý về phương án của bạn',
        body: note ?? iv.description ?? null,
        entityType: 'sos_case', entityId: iv.case_id,
        dedupKey: `plan-reply:${interventionId}:${input.decision}`,
      });
    }

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
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id },
    'Bạn không có quyền cập nhật phương án của case này.');

  if (iv.approval_state === 'pending') {
    throw badRequest('Phương án này đang chờ Quản lý duyệt, chưa ghi là đã làm được.');
  }
  const doneOn = input.doneOn ?? demoToday();
  if (!isIsoDate(doneOn)) throw badRequest('Ngày thực hiện không hợp lệ.');
  if (doneOn > demoToday()) throw badRequest('Không ghi được ngày thực hiện ở tương lai.');

  return tx(() => {
    /*
     * NGƯỜI THỰC HIỆN chỉ ghi khi có lời khai rõ ràng. Người ghi vào hệ thống và người làm
     * là hai vai khác nhau: Admin ghi hộ việc CS gọi phụ huynh thì người làm là CS.
     */
    const performerUserId = input.performerSelf ? p.userId : (input.performerUserId ?? iv.performer_user_id);
    conn
      .prepare(
        `UPDATE case_interventions
            SET status = 'completed', completed_date = ?,
                started_date = COALESCE(started_date, ?),
                performer_user_id = ?, performer_name = COALESCE(?, performer_name),
                description = COALESCE(NULLIF(?, ''), description),
                updated_at = ?
          WHERE id = ?`,
      )
      .run(doneOn, doneOn, performerUserId ?? null, input.performerName ?? null,
           input.note ?? '', nowIso(), interventionId);

    /*
     * Case còn ở "chưa ai làm gì" mà vừa có một việc xong thì nó đang được xử lý — đổi
     * trạng thái để nó rời khỏi hàng đợi "chưa có phương án". Case đã đóng thì KHÔNG mở lại
     * chỉ vì ai đó ghi bù một việc cũ.
     */
    if (c.status === 'open') {
      conn.prepare("UPDATE sos_cases SET status = 'in_progress', updated_at = ? WHERE id = ?")
        .run(nowIso(), iv.case_id);
    }

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
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id },
    'Bạn không có quyền ghi nhận theo dõi cho case này.');
  const observedOn = input.observedOn ?? demoToday();
  if (!isIsoDate(observedOn)) throw badRequest('Ngày quan sát không hợp lệ.');
  if (input.outcome && !(FOLLOWUP_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Kết quả quan sát không hợp lệ.');
  }
  if (input.interventionId) {
    const iv = conn.prepare('SELECT case_id FROM case_interventions WHERE id = ?').get(input.interventionId) as any;
    if (!iv || iv.case_id !== caseId) throw badRequest('Tác động không thuộc case này.');
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
}) {
  const conn = db();
  const c = loadCase(caseId);
  const closing = input.status === 'done';

  if (closing) {
    if (!canCloseCase(p, c)) {
      throw badRequest('Chỉ giáo viên chủ nhiệm của lớp và Quản lý mới đóng được case.');
    }
    const disposition = input.disposition ?? c.disposition;
    if (!disposition) {
      throw badRequest('Đóng case thì phải chọn hướng xử lý — để biết case kết thúc vì đã giải quyết hay bị bỏ quên.');
    }
    if (disposition === 'monitor') {
      throw badRequest('"Chỉ theo dõi thêm" nghĩa là case còn mở. Chọn hướng khác nếu muốn đóng.');
    }
  } else {
    require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id },
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
    if (!sets.length) return caseDetail(p, caseId);
    sets.push('updated_at = ?'); params.push(nowIso(), caseId);
    conn.prepare(`UPDATE sos_cases SET ${sets.join(', ')} WHERE id = ?`).run(...params);

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

export function caseDetail(p: Principal, caseId: number) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: c.class_id, studentId: c.eff_student_id },
    'Case này nằm ngoài phạm vi bạn được xem.');

  const student = conn
    .prepare('SELECT id, student_code, full_name, status FROM students WHERE id = ?')
    .get(c.eff_student_id) as any;
  const cycle = c.eff_cycle_id
    ? conn.prepare('SELECT id, seq, route, target_score, exam_date FROM learning_cycles WHERE id = ?')
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
      // Người ghi khác người làm thì nói rõ, để không đọc nhầm ai đã làm việc đó.
      recordedBy: iv.recorder_name ?? null,
      byProxy: !iv.performer_user_id && !!iv.performer_name,
      plannedDate: iv.planned_date, startedDate: iv.started_date, completedDate: iv.completed_date,
      followupDue: iv.followup_due,
      /* HẠN LÀM phương án — 3/5/7 ngày theo mức SOS. Khác hạn xem lại và hạn duyệt. */
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
        && !conn.prepare('SELECT 1 FROM case_followups WHERE intervention_id = ?').get(iv.id),
      // NULL = không cần duyệt, khác hẳn 'pending' = đang chờ Quản lý trả lời.
      needsApproval: !!iv.needs_approval,
      approvalState: iv.approval_state as string | null,
      approvalDue: iv.approval_due as string | null,
      approvalNote: iv.approval_note as string | null,
      approvedBy: iv.approver_name ?? null,
      approvalAt: iv.approval_at as string | null,
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
    }));

  const history = conn
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM sos_case_history h
         LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.case_id = ? ORDER BY h.id DESC LIMIT 50`,
    )
    .all(caseId) as any[];

  return {
    id: c.id,
    originKind: c.origin_kind,
    student: student ? { id: student.id, code: student.student_code, name: student.full_name, status: student.status } : null,
    cycle,
    classId: c.class_id,
    attemptId: c.attempt_id, attemptNo: c.attempt_no ?? null,
    /** Hai đầu mục và chủ đề — mọi vấn đề đều phải có chỗ cất. */
    track: (c.track ?? 'academic') as string,
    topic: c.topic as string | null,
    topicLabel: c.topic ? threadTopicLabel((c.track ?? 'academic') as any, c.topic) : null,
    /** HẠNG MỤC — đơn vị của case từ vòng 4. Sáu ô, dùng chung cho lớp FT và lớp Normal. */
    category: c.category ?? categoryOf(c.track ?? 'academic', c.topic),
    categoryLabel: caseCategoryLabel(c.category ?? categoryOf(c.track ?? 'academic', c.topic)),
    /** Tên case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
    title: caseTitleOf(c),
    /** Case mở song song có chủ ý với một case khác cùng hạng mục. */
    parallel: !!c.parallel,
    /** Số kỹ năng dưới kỳ vọng của CẢ LƯỢT. NULL với vấn đề giáo viên báo — không phải SOS 0. */
    sosLevel: c.sos_level,
    /**
     * Mức gấp. Vấn đề sinh từ điểm không ghi mức vào database (hai thang cố tình tách nhau);
     * suy từ SOS lúc hiển thị, và hạn xử lý suy tiếp từ mức đó: 7 · 5 · 3 ngày.
     */
    urgency: c.urgency ?? (c.sos_level !== null ? urgencyFromSos(c.sos_level) : null),
    dueDays: dueDaysFor(c.urgency, c.sos_level),
    note: c.note,
    summary: c.summary,
    headline: caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no ?? null,
    }),
    detectedAt: c.detected_at,
    reportedBy: c.reported_by
      ? (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(c.reported_by) as any)?.full_name ?? null
      : null,
    status: c.status,
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
    history: history.map((h) => ({
      id: h.id, field: h.field, oldValue: h.old_value, newValue: h.new_value,
      actorName: h.actor_name, createdAt: h.created_at,
    })),
    viewer: {
      canEdit: can(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id }),
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
  group?: string | null;
  skill?: string | null;
  /** Hàng đợi: new | active | due | review */
  queue?: string | null;
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
export type CaseState = 'no_plan' | 'working' | 'done';
export const CASE_STATE_LABEL: Record<CaseState, string> = {
  no_plan: 'Chưa có phương án hỗ trợ',
  working: 'Đang xử lý',
  done: 'Đã xong',
};

/** Một dòng trong danh sách case, sau khi đã dựng xong. */
export type MappedCase = {
  id: number; originKind: string;
  studentId: number | null; studentName: string | null; studentCode: string | null;
  classId: number | null; classCode: string | null; branchId: number | null;
  attemptId: number | null; attemptNo: number | null;
  sosLevel: number | null; urgency: string | null;
  summary: string | null; headline: string;
  /** Tên case tự sinh theo mốc mới nhất — "MT2 - Listening dưới kỳ vọng". */
  title: string;
  category: string | null; categoryLabel: string | null;
  primaryCode: string | null; primaryLabel: string | null;
  track: string; topic: string | null; topicLabel: string | null; issueBranch: string | null;
  status: string; disposition: string | null;
  detectedAt: string; reporterName: string | null;
  interventionCount: number; nextDue: string | null; dueOverdue: boolean;
  state: CaseState;
};

export function listCases(p: Principal, f: CaseFilters = {}) {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  const conn = db();
  const today = demoToday();

  const where: string[] = ['1=1'];
  const params: unknown[] = [];
  if (f.studentId) { where.push('COALESCE(sc.student_id, a.student_id) = ?'); params.push(f.studentId); }
  if (f.classId) { where.push('COALESCE(a.class_id, cur.class_id) = ?'); params.push(f.classId); }
  if (f.branchId) { where.push('COALESCE(ac.branch_id, cc.branch_id) = ?'); params.push(f.branchId); }
  if (f.status) { where.push('sc.status = ?'); params.push(f.status); }
  if (f.origin) { where.push('sc.origin_kind = ?'); params.push(f.origin); }

  const rows = conn
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, s.student_code,
              a.attempt_no, a.kind AS attempt_kind,
              u.full_name AS reporter_name,
              (SELECT COUNT(*) FROM case_interventions iv WHERE iv.case_id = sc.id) AS intervention_count,
              (SELECT MIN(iv.followup_due) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.followup_due IS NOT NULL AND iv.status != 'completed') AS next_due,
              (SELECT ci.taxonomy_code FROM case_issues ci
                WHERE ci.case_id = sc.id AND ci.role = 'primary' LIMIT 1) AS primary_code
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
         LEFT JOIN users u ON u.id = sc.reported_by
        WHERE ${where.join(' AND ')}
        GROUP BY sc.id
        ORDER BY sc.created_at DESC`,
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

  /* Kỹ năng của một case = kỹ năng của các dòng phân loại. Một case có thể chạm nhiều kỹ năng. */
  const skillsByCase = new Map<number, string[]>();
  for (const r of conn
    .prepare('SELECT case_id, skill FROM case_issues WHERE skill IS NOT NULL').all() as any[]) {
    const cur = skillsByCase.get(r.case_id) ?? [];
    if (!cur.includes(r.skill)) cur.push(r.skill);
    skillsByCase.set(r.case_id, cur);
  }

  const all: MappedCase[] = rows
    .filter((r) => can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.eff_class_id, studentId: r.eff_student_id }))
    .map((r) => ({
      id: r.id,
      originKind: r.origin_kind,
      studentId: r.eff_student_id, studentName: r.full_name, studentCode: r.student_code,
      classId: r.eff_class_id, classCode: r.class_code, branchId: r.eff_branch_id,
      attemptId: r.attempt_id, attemptNo: r.attempt_no,
      sosLevel: r.sos_level, urgency: r.urgency,
      summary: r.summary,
      headline: caseHeadline({
        summary: r.summary, originKind: r.origin_kind, sosLevel: r.sos_level, attemptNo: r.attempt_no,
      }),
      title: caseTitle({
        category: r.category ?? categoryOf(r.track ?? 'academic', r.topic),
        latestAttemptNo: latestAttemptByCase.get(r.id) ?? r.attempt_no ?? null,
        originKind: r.origin_kind,
        failedCount: r.sos_level,
      }),
      category: r.category ?? categoryOf(r.track ?? 'academic', r.topic),
      categoryLabel: caseCategoryLabel(r.category ?? categoryOf(r.track ?? 'academic', r.topic)),
      primaryCode: r.primary_code,
      primaryLabel: r.primary_code ? issueLabel(r.primary_code) : null,
      /** Hai đầu mục: Học thuật hay Ý thức. */
      track: (r.track ?? 'academic') as string,
      /** Chủ đề: một trong năm ô L·R·W1·W2·S, hoặc một trong bốn nhóm ý thức. */
      topic: r.topic as string | null,
      topicLabel: r.topic ? threadTopicLabel((r.track ?? 'academic') as any, r.topic) : null,
      /** Nhánh phân loại nguyên nhân, khi đã có người dạy nhận định. */
      issueBranch: issueBranchOf(r.primary_code),
      status: r.status as string,
      disposition: r.disposition,
      detectedAt: r.detected_at ?? (r.created_at ?? '').slice(0, 10),
      reporterName: r.reporter_name ?? null,
      interventionCount: r.intervention_count as number,
      nextDue: r.next_due as string | null,
      dueOverdue: !!r.next_due && r.next_due < today,
      /*
       * BA TRẠNG THÁI LOẠI TRỪ NHAU, cộng lại đúng bằng tổng — khác hẳn bốn hàng đợi ở
       * dưới (bốn câu hỏi, cố tình chồng nhau). Quản lý cần cả hai cách nhìn: hàng đợi để
       * biết làm gì trước, ba trạng thái để biết bức tranh chung đang ở đâu.
       */
      state: (r.status === 'done' ? 'done'
        : (!r.disposition && (r.intervention_count as number) === 0) ? 'no_plan'
        : 'working') as CaseState,
    }));

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
   * `group` nay là ĐẦU MỤC (Học thuật / Ý thức), `skill` là CHỦ ĐỀ (một trong năm ô kỹ năng
   * hoặc một trong bốn nhóm ý thức). 'none' cho chủ đề = vấn đề cũ chưa gắn được kỹ năng —
   * một lựa chọn thật, để các số cộng lại đúng bằng tổng.
   */
  if (f.group) mapped = mapped.filter((r) => r.track === f.group);
  if (f.skill === 'none') mapped = mapped.filter((r) => !r.topic);
  else if (f.skill) mapped = mapped.filter((r) => r.topic === f.skill);

  return { rows: mapped, scopeEmpty: false, facets: facetsOf(base, f) };
}

/**
 * ĐẾM CHO TỪNG LỰA CHỌN LỌC, để nhìn thấy con số TRƯỚC KHI bấm.
 *
 * Mỗi chiều được đếm trên tập đã lọc bởi các chiều KHÁC, không phải bởi chính nó — nếu
 * không thì chọn "Listening" xong mọi kỹ năng khác hiện 0, và người dùng mất luôn đường
 * đi tiếp. Đây là cách lọc theo mặt (facet) thông thường, và là điều kiện để dòng
 * "Học viên 18 › Listening 6" nói đúng sự thật.
 */
function facetsOf(base: MappedCase[], f: CaseFilters) {
  const byTrack = f.group ? base.filter((r) => r.track === f.group) : base;
  const matchTopic = (r: MappedCase) => (f.skill === 'none' ? !r.topic : r.topic === f.skill);
  const byTopic = f.skill ? base.filter(matchTopic) : base;
  const both = f.group ? byTopic.filter((r) => r.track === f.group) : byTopic;

  const tally = (list: MappedCase[], key: (r: MappedCase) => string | null) => {
    const m: Record<string, number> = {};
    for (const r of list) { const k = key(r); if (k) m[k] = (m[k] ?? 0) + 1; }
    return m;
  };

  return {
    /** Hai đầu mục: đếm trên tập đã lọc theo chủ đề, chưa lọc theo đầu mục. */
    group: tally(byTopic, (r) => r.track),
    /** Chủ đề: đếm trên tập đã lọc theo đầu mục, chưa lọc theo chủ đề. */
    skill: tally(byTrack, (r) => r.topic),
    /*
     * NGUYÊN NHÂN đã được người dạy nhận định. Trước đây đếm theo NHÁNH phân loại, nhưng
     * nhánh nay trùng với chính chủ đề (Listening → Listening), nên dòng đó chỉ lặp lại
     * hàng chip ở trên. Đếm theo mã nguyên nhân mới nói thêm được điều gì.
     */
    issueBranch: tally(both, (r) => r.primaryCode),
    branch: tally(base, (r) => (r.branchId ? String(r.branchId) : null)),
    /** Ba trạng thái loại trừ nhau, cộng lại đúng bằng tổng. */
    state: tally(both, (r) => r.state),
    /*
     * Vấn đề cũ CHƯA GẮN ĐƯỢC KỸ NĂNG đếm riêng, để các số cộng lại đúng bằng tổng. Bước
     * nâng cấp cố ý không đoán bừa kỹ năng cho những case trượt từ hai kỹ năng trở lên.
     */
    groupNone: 0,
    skillNone: byTrack.filter((r) => !r.topic).length,
    total: both.length,
  };
}

/** Đếm cho bốn hàng đợi. Một case có thể thuộc nhiều nhóm — đây là bốn câu hỏi, không phải phép chia. */
export function caseQueueCounts(p: Principal, f: CaseFilters = {}) {
  const all = listCases(p, { ...f, queue: null });
  const q = (k: string) => listCases(p, { ...f, queue: k }).rows.length;
  return {
    total: all.rows.filter((r) => r.status !== 'done').length,
    newCases: q('new'), active: q('active'), due: q('due'), review: q('review'),
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
 *   3. Đã làm gì cho em rồi?         → phương án mới nhất và kết quả của nó
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

  const cycle = cycleId
    ? (conn.prepare('SELECT * FROM learning_cycles WHERE id = ? AND student_id = ?').get(cycleId, studentId) as any)
    : currentCycle(studentId);

  /*
   * ĐIỂM HAI LƯỢT GẦN NHẤT của từng ô nhập điểm, để nói được "tăng hay giảm".
   * Chỉ lấy lượt đã có ngày làm bài và chưa bị huỷ — lượt mới xếp lịch chưa nói gì về em.
   */
  const scoreRows = conn
    .prepare(
      `SELECT a.attempt_no, a.id AS attempt_id, a.lrw_scheduled_at, a.target_at_attempt,
              sc.skill, sc.band
         FROM assessment_attempts a
         JOIN assessment_scores sc ON sc.attempt_id = a.id
        WHERE a.student_id = ? AND COALESCE(a.cycle_id, 0) = ?
          AND a.status != 'cancelled' AND sc.band IS NOT NULL
        ORDER BY a.attempt_no`,
    )
    .all(studentId, cycle?.id ?? 0) as any[];

  type Point = { attemptNo: number; attemptId: number; band: number; on: string | null; expectation: number | null };
  const byCategory = new Map<string, Point[]>();
  for (const r of scoreRows) {
    const cat = categoryOf('academic', r.skill);
    if (!cat) continue;
    const list = byCategory.get(cat) ?? [];
    list.push({
      attemptNo: r.attempt_no, attemptId: r.attempt_id, band: r.band,
      on: (r.lrw_scheduled_at ?? '').slice(0, 10) || null,
      expectation: r.target_at_attempt !== null && r.target_at_attempt !== undefined
        ? expectationFor(r.target_at_attempt, r.attempt_no) : null,
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
      `SELECT *, (COALESCE(cycle_id, 0) != ?) AS carried_over FROM sos_cases
        WHERE student_id = ?
          AND (COALESCE(cycle_id, 0) = ? OR status != 'done')
        ORDER BY carried_over, (status = 'done'), parallel, id DESC`,
    )
    .all(cycle?.id ?? 0, studentId, cycle?.id ?? 0) as any[];

  const rows = CASE_CATEGORIES.map((category) => {
    const points = byCategory.get(category) ?? [];
    const latest = points[points.length - 1] ?? null;
    const prev = points.length > 1 ? points[points.length - 2] : null;

    /*
     * Case ĐẠI DIỆN cho hạng mục: ưu tiên cái đang mở, mới nhất. Không có cái nào đang mở
     * thì lấy cái đã đóng gần nhất — "đã từng có vấn đề và đã xử lý xong" là một câu trả
     * lời khác hẳn "chưa từng có vấn đề", và người dạy cần phân biệt hai câu đó.
     */
    const mine = caseRows.filter((c) => (c.category ?? categoryOf(c.track, c.topic)) === category);
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
      : 'working';

    const overdueAction = openIv.find((i) => i.action_due && i.action_due < demoToday()
      && (i.approval_state ?? '') !== 'pending') ?? null;

    return {
      category,
      label: caseCategoryLabel(category),
      short: CASE_CATEGORY_SHORT[category],
      /* Band MT gần nhất — hạng mục Ý thức/Khác không có điểm, để trống chứ không ghi 0. */
      band: latest?.band ?? null,
      bandAttemptNo: latest?.attemptNo ?? null,
      bandOn: latest?.on ?? null,
      expectation: latest?.expectation ?? null,
      /* So với LƯỢT TRƯỚC, không phải so với kỳ vọng — hai câu hỏi khác nhau. */
      delta: latest && prev ? Math.round((latest.band - prev.band) * 10) / 10 : null,
      /*
       * ĐƯỜNG ĐI qua các lượt, tối đa bốn mốc gần nhất.
       *
       * Owner xin thêm thông tin vào thanh thu gọn, và đây là thứ đáng thêm nhất: một con số
       * 5.0 đứng một mình không phân biệt được em đang lên hay đang tụt, mà đó lại là câu
       * quyết định có cần làm gì không. Cắt còn bốn mốc để dòng không bao giờ dài quá tầm mắt.
       */
      points: points.slice(-4).map((pt) => ({
        attemptNo: pt.attemptNo, band: pt.band, expectation: pt.expectation,
      })),
      missed: latest?.expectation !== null && latest?.expectation !== undefined && latest
        ? latest.band < latest.expectation : null,
      state,
      caseId: primary?.id ?? null,
      caseTitle: primary ? caseTitleOf(primary) : null,
      /** Case này thuộc lộ trình KHÁC lộ trình đang xem — giao diện phải nói rõ. */
      carriedOver: !!primary?.carried_over,
      caseStatus: primary?.status ?? null,
      sosLevel: primary?.sos_level ?? null,
      /** Case đã kéo qua mấy lượt MT — đây là thứ nói "phương án cũ chưa ăn thua". */
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
      pendingApproval: interventions.some((i) => i.approval_state === 'pending'),
    };
  });

  return { studentId, cycleId: cycle?.id ?? null, rows };
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
