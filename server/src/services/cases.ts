import { db, tx } from '../db.ts';
import {
  DISPOSITIONS, INTERVENTION_KINDS, INTERVENTION_STATUSES, FOLLOWUP_OUTCOMES,
  APPROVAL_DUE_DAYS, ISSUE_ROLES, PERMISSIONS, URGENCY_LEVELS, caseHeadline, issueBranchOf,
  issueGroupOf, issueLabel,
} from '../../../shared/domain.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, isCoreTeacherOf, require_, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { addJourney, notify, writeAudit } from './audit.ts';
import { currentCycle } from './cycles.ts';

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
  primaryCode?: string | null;
  secondaryCodes?: string[];
  contextCodes?: string[];
  skill?: string | null;
  observation?: string | null;
  detectedAt?: string | null;
  idempotencyKey?: string;
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

  return tx(() => {
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, origin_kind, detected_at, reported_by,
                                summary, urgency, sos_level, status, idempotency_key, created_at)
         VALUES (NULL, ?,?, 'teacher_report', ?,?,?,?, NULL, 'open', ?, ?)`,
      )
      .run(input.studentId, cycle?.id ?? null, detectedAt, p.userId, summary, urgency, key, nowIso());
    const caseId = Number(info.lastInsertRowid);

    addIssues(caseId, p.userId, input);

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

function addIssues(caseId: number, actor: number | null, input: {
  primaryCode?: string | null; secondaryCodes?: string[]; contextCodes?: string[];
  skill?: string | null; observation?: string | null;
}) {
  const conn = db();
  const add = (code: string, role: string, skill?: string | null, obs?: string | null) => {
    if (!code) return;
    conn
      .prepare(
        `INSERT INTO case_issues (case_id, role, taxonomy_code, taxonomy_version, skill, observation, created_by, created_at)
         VALUES (?,?,?,1,?,?,?,?)`,
      )
      .run(caseId, role, code, skill ?? null, obs ?? null, actor, nowIso());
  };
  if (input.primaryCode) add(input.primaryCode, 'primary', input.skill, input.observation);
  for (const c of input.secondaryCodes ?? []) add(c, 'secondary', input.skill, null);
  for (const c of input.contextCodes ?? []) add(c, 'context', null, null);
}

/** Sửa phân loại vấn đề. Tối đa MỘT vấn đề chính — nhận định đổi được, có lịch sử. */
export function setIssues(p: Principal, caseId: number, input: {
  primaryCode?: string | null; secondaryCodes?: string[]; contextCodes?: string[];
  skill?: string | null; observation?: string | null;
}) {
  const conn = db();
  const c = loadCase(caseId);
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.eff_student_id },
    'Bạn không có quyền phân loại vấn đề cho case này.');
  for (const code of [input.primaryCode, ...(input.secondaryCodes ?? []), ...(input.contextCodes ?? [])]) {
    if (code && !issueGroupOf(code)) throw badRequest(`Mã vấn đề không hợp lệ: ${code}`);
  }
  return tx(() => {
    const before = conn.prepare('SELECT * FROM case_issues WHERE case_id = ?').all(caseId);
    conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(caseId);
    addIssues(caseId, p.userId, input);
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
  if (input.needsApproval && status !== 'planned') {
    throw badRequest('Phương án cần Quản lý duyệt thì để ở "đã lên kế hoạch", chưa ghi là đã làm.');
  }
  const performerUserId = input.performerUserId
    ?? (input.performerSelf && !input.performerName?.trim() ? p.userId : null);
  if (!performerUserId && !input.performerName?.trim() && status !== 'planned') {
    throw badRequest('Cần ghi ai là người thực hiện — người nhập không mặc định là người làm.');
  }

  return tx(() => {
    /*
     * Hạn Quản lý phải trả lời: case nặng thì gấp hơn. Quá hạn KHÔNG chặn gì cả — nó chỉ
     * nổi lên màn của Quản lý để một đề xuất không nằm im mãi.
     */
    const hot = (c.sos_level ?? 0) >= 3 || c.urgency === 'urgent';
    const approvalDue = input.needsApproval
      ? addDays(demoToday(), hot ? APPROVAL_DUE_DAYS.urgent : APPROVAL_DUE_DAYS.normal)
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
           input.needsApproval ? 1 : 0, input.needsApproval ? 'pending' : null, approvalDue, nowIso());
    const id = Number(info.lastInsertRowid);

    /*
     * BÁO CHO QUẢN LÝ TRONG MỌI TRƯỜNG HỢP (owner chốt 10/09/2026).
     *
     * Cần duyệt thì đây là việc phải làm; không cần duyệt thì vẫn là tin đáng biết — Quản lý
     * nắm được giáo viên đang xoay xở thế nào mà không phải đi hỏi từng người.
     */
    notifyManagers(c, input.needsApproval ? 'approval' : 'plan', input.description ?? input.kind, id, p.userId);

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
      group: issueGroupOf(i.taxonomy_code), skill: i.skill, observation: i.observation,
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
    /** Số kỹ năng dưới kỳ vọng. NULL với case giáo viên báo — không phải SOS 0. */
    sosLevel: c.sos_level,
    urgency: c.urgency,
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
  primaryCode: string | null; primaryLabel: string | null;
  group: string | null; issueBranch: string | null; skills: string[];
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
      primaryCode: r.primary_code,
      primaryLabel: r.primary_code ? issueLabel(r.primary_code) : null,
      group: issueGroupOf(r.primary_code),
      /** Nhánh trong bảng phân loại: Listening, Ý thức học tập, Giáo trình… */
      issueBranch: issueBranchOf(r.primary_code),
      skills: skillsByCase.get(r.id) ?? [],
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
   * 'none' = CHƯA PHÂN LOẠI, một lựa chọn thật chứ không phải "bỏ trống bộ lọc".
   * Phần lớn vấn đề sinh từ điểm nằm ở đây cho tới khi có người dạy nhận định, nên không
   * lọc được vào nó thì con số "Học sinh 3" bên cạnh tổng 23 nhìn như hệ thống đếm sai.
   */
  if (f.group === 'none') mapped = mapped.filter((r) => !r.group);
  else if (f.group) mapped = mapped.filter((r) => r.group === f.group);
  if (f.skill === 'none') mapped = mapped.filter((r) => r.skills.length === 0);
  else if (f.skill) mapped = mapped.filter((r) => r.skills.includes(f.skill!));

  return { rows: mapped, scopeEmpty: false, facets: facetsOf(base, f) };
}

/**
 * ĐẾM CHO TỪNG LỰA CHỌN LỌC, để nhìn thấy con số TRƯỚC KHI bấm.
 *
 * Mỗi chiều được đếm trên tập đã lọc bởi các chiều KHÁC, không phải bởi chính nó — nếu
 * không thì chọn "Listening" xong mọi kỹ năng khác hiện 0, và người dùng mất luôn đường
 * đi tiếp. Đây là cách lọc theo mặt (facet) thông thường, và là điều kiện để dòng
 * "Học sinh 18 › Listening 6" nói đúng sự thật.
 */
function facetsOf(base: MappedCase[], f: CaseFilters) {
  const matchGroup = (r: MappedCase) => (f.group === 'none' ? !r.group : r.group === f.group);
  const matchSkill = (r: MappedCase) => (f.skill === 'none' ? r.skills.length === 0 : r.skills.includes(f.skill!));
  const byGroup = f.group ? base.filter(matchGroup) : base;
  const bySkill = f.skill ? base.filter(matchSkill) : base;
  const both = f.group ? bySkill.filter(matchGroup) : bySkill;

  const tally = (list: MappedCase[], keys: (r: MappedCase) => (string | null)[]) => {
    const m: Record<string, number> = {};
    for (const r of list) for (const k of keys(r)) if (k) m[k] = (m[k] ?? 0) + 1;
    return m;
  };

  return {
    /** Nhóm vấn đề: đếm trên tập đã lọc theo kỹ năng, chưa lọc theo nhóm. */
    group: tally(bySkill, (r) => [r.group]),
    /** Kỹ năng: đếm trên tập đã lọc theo nhóm, chưa lọc theo kỹ năng. */
    skill: tally(byGroup, (r) => r.skills),
    /** Nhánh phân loại — chi tiết hơn nhóm, ví dụ "Listening" hay "Ý thức học tập". */
    issueBranch: tally(both, (r) => [r.issueBranch]),
    branch: tally(base, (r) => [r.branchId ? String(r.branchId) : null]),
    /** Ba trạng thái loại trừ nhau, cộng lại đúng bằng tổng. */
    state: tally(both, (r) => [r.state]),
    /*
     * CHƯA PHÂN LOẠI đếm riêng, để cộng lại đúng bằng tổng. Bỏ nó đi thì "Học sinh 3" nằm
     * cạnh danh sách 23 dòng, và người đọc chỉ có thể kết luận là hệ thống đếm sai.
     */
    groupNone: bySkill.filter((r) => !r.group).length,
    skillNone: byGroup.filter((r) => r.skills.length === 0).length,
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
