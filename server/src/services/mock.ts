import { db, tx } from '../db.ts';
import {
  ENTRY_SKILLS, MOCK_FT_WEEK, PERMISSIONS, type EntrySkill,
} from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, classScopeSql, editableSkills, require_, scopeFor, type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from './audit.ts';
import {
  ScoreError, bandFromCriteria, bandFromRaw, evaluateMock, isCriteriaSkill, isRawSkill, type MockResult,
} from './scoring.ts';
import { isOverdue, scoreDeadline, weekInfo } from './week.ts';
import { caseProgress, stepsFor, upsertCaseForResult } from './sos.ts';

export type ScoreRow = {
  id: number; skill: EntrySkill; test_date: string | null;
  raw_score: number | null; c1: number | null; c2: number | null; c3: number | null; c4: number | null;
  band: number | null; result_date: string | null; note: string | null;
  entered_by: number | null; entered_at: string | null;
  entered_by_name?: string | null;
};

export function scoresOf(attemptId: number): ScoreRow[] {
  return db()
    .prepare(
      `SELECT s.*, u.full_name AS entered_by_name FROM mock_scores s
         LEFT JOIN users u ON u.id = s.entered_by WHERE s.attempt_id = ?`,
    )
    .all(attemptId) as ScoreRow[];
}

export function entryBandsOf(rows: ScoreRow[]) {
  const map: Partial<Record<EntrySkill, number | null>> = {};
  for (const r of rows) map[r.skill] = r.band;
  return map;
}

export function resultOf(attempt: any, rows?: ScoreRow[]): MockResult {
  const scores = rows ?? scoresOf(attempt.id);
  return evaluateMock(attempt.committed_score_at_test, attempt.attempt_no, entryBandsOf(scores));
}

/** Hạn nhập điểm tính theo NGÀY THI THỰC TẾ của từng kỹ năng, vì các kỹ năng có thể thi khác tuần. */
export function skillDeadline(row: ScoreRow, attempt: any): string | null {
  const base = row.test_date ?? (attempt.status === 'completed' ? attempt.planned_date : null);
  return base ? scoreDeadline(base) : null;
}

export type SkillCell = {
  skill: EntrySkill;
  testDate: string | null;
  rawScore: number | null;
  criteria: [number | null, number | null, number | null, number | null];
  band: number | null;
  resultDate: string | null;
  enteredByName: string | null;
  enteredAt: string | null;
  deadline: string | null;
  overdue: boolean;
  canEdit: boolean;
};

export function skillCells(p: Principal, attempt: any, rows: ScoreRow[], today = demoToday()): SkillCell[] {
  const classSkills = attempt.class_id
    ? (db().prepare('SELECT skill FROM class_skills WHERE class_id = ?').all(attempt.class_id) as any[]).map((r) => r.skill)
    : [...ENTRY_SKILLS];
  const skills = ENTRY_SKILLS.filter((s) => classSkills.includes(s));
  return skills.map((skill) => {
    const row = rows.find((r) => r.skill === skill);
    const deadline = row ? skillDeadline(row, attempt) : (attempt.status === 'completed' ? scoreDeadline(attempt.planned_date) : null);
    return {
      skill,
      testDate: row?.test_date ?? null,
      rawScore: row?.raw_score ?? null,
      criteria: [row?.c1 ?? null, row?.c2 ?? null, row?.c3 ?? null, row?.c4 ?? null],
      band: row?.band ?? null,
      resultDate: row?.result_date ?? null,
      enteredByName: row?.entered_by_name ?? null,
      enteredAt: row?.entered_at ?? null,
      deadline,
      overdue: !!deadline && row?.band == null && isOverdue(deadline, today) && attempt.status !== 'cancelled',
      canEdit: can(p, PERMISSIONS.SCORE_EDIT, { classId: attempt.class_id, skill }),
    };
  });
}

// ---------------------------------------------------------------- danh sách

export type MockFilters = {
  periodId?: number;
  branchId?: number;
  classId?: number;
  studentId?: number;
  status?: string;
  need?: 'my_scores' | 'missing_scores' | 'overdue' | 'sos_open';
  q?: string;
};

export function listMocks(p: Principal, f: MockFilters = {}) {
  const scope = scopeFor(p, PERMISSIONS.MOCK_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  const conn = db();
  const cs = classScopeSql(scope);
  const where: string[] = [cs.sql];
  const params: unknown[] = [...cs.params];

  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  if (f.classId) { where.push('a.class_id = ?'); params.push(f.classId); }
  if (f.studentId) { where.push('a.student_id = ?'); params.push(f.studentId); }
  if (f.status) { where.push('a.status = ?'); params.push(f.status); }
  if (f.q) { where.push('(s.full_name LIKE ? OR s.normalized_name LIKE ? OR s.student_code LIKE ? OR c.code LIKE ?)');
    params.push(`%${f.q}%`, `%${f.q.toLowerCase()}%`, `%${f.q.toUpperCase()}%`, `%${f.q}%`); }

  const rows = conn
    .prepare(
      `SELECT a.*, s.full_name, s.student_code, s.committed_score, s.route,
              c.code AS class_code, c.branch_id, b.name AS branch_name, b.code AS branch_code
         FROM mock_attempts a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN branches b ON b.id = c.branch_id
        WHERE ${where.join(' AND ')}
        ORDER BY a.planned_date DESC, s.full_name`,
    )
    .all(...params) as any[];

  const today = demoToday();
  let mapped = rows.map((a) => {
    const scores = scoresOf(a.id);
    const result = resultOf(a, scores);
    const cells = skillCells(p, a, scores, today);
    const applicable = cells.length;
    const entered = cells.filter((c) => c.band !== null).length;
    const overdueSkills = cells.filter((c) => c.overdue).length;
    const sos = conn.prepare('SELECT * FROM sos_cases WHERE attempt_id = ?').get(a.id) as any;
    // Tuần hiển thị: tuần của lần thi thực tế sớm nhất, nếu chưa thi thì tuần theo lịch dự kiến.
    const firstTest = cells.map((c) => c.testDate).filter(Boolean).sort()[0] ?? null;
    /*
     * Chỉ nhắc nhập điểm khi thực sự đã tới lúc nhập: lượt đã huỷ không cần nhập, và lượt
     * còn ở phía trước cũng chưa có gì để nhập. Đây là lời nhắc theo lịch, KHÔNG phải kết
     * luận "đã thi" — trạng thái đã thi chỉ đổi khi có điểm.
     */
    const dueForEntry = a.status !== 'cancelled'
      && (a.status === 'completed' || !!firstTest || a.planned_date <= today);
    return {
      id: a.id,
      studentId: a.student_id,
      studentName: a.full_name,
      studentCode: a.student_code,
      classId: a.class_id,
      classCode: a.class_code,
      branchId: a.branch_id,
      branchCode: a.branch_code,
      branchName: a.branch_name,
      attemptNo: a.attempt_no,
      route: a.route,
      committedScore: a.committed_score_at_test,
      plannedDate: a.planned_date,
      firstTestDate: firstTest,
      week: weekInfo(firstTest ?? a.planned_date),
      status: a.status,
      expectation: result.expectation,
      bands: result.bands,
      overall: result.overall,
      completed: result.completed,
      complete: result.complete,
      sosLevel: result.sosLevel,
      enteredSkills: entered,
      applicableSkills: applicable,
      overdueSkills,
      myEditableSkills: cells.filter((c) => c.canEdit).map((c) => c.skill),
      myPendingSkills: dueForEntry ? cells.filter((c) => c.canEdit && c.band === null).map((c) => c.skill) : [],
      caseStatus: sos?.status ?? null,
      caseId: sos?.id ?? null,
      canSchedule: can(p, PERMISSIONS.MOCK_SCHEDULE, { classId: a.class_id }),
    };
  });

  if (f.periodId) {
    const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(f.periodId) as any;
    if (period) {
      mapped = mapped.filter((m) => {
        const d = m.firstTestDate ?? m.plannedDate;
        return d >= period.week_start && d <= period.week_end;
      });
    }
  }
  switch (f.need) {
    case 'my_scores': mapped = mapped.filter((m) => m.myPendingSkills.length > 0 && m.status !== 'cancelled'); break;
    case 'missing_scores': mapped = mapped.filter((m) => m.status === 'completed' && m.enteredSkills < m.applicableSkills); break;
    case 'overdue': mapped = mapped.filter((m) => m.overdueSkills > 0); break;
    case 'sos_open': mapped = mapped.filter((m) => m.caseId && m.caseStatus !== 'done'); break;
  }
  return { rows: mapped, scopeEmpty: false };
}

// ---------------------------------------------------------------- chi tiết

export function mockDetail(p: Principal, attemptId: number) {
  const conn = db();
  const a = conn
    .prepare(
      `SELECT a.*, s.full_name, s.student_code, s.committed_score, s.route, s.exam_date,
              c.code AS class_code, c.branch_id, c.kind AS class_kind, b.name AS branch_name
         FROM mock_attempts a JOIN students s ON s.id = a.student_id
         LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN branches b ON b.id = c.branch_id
        WHERE a.id = ?`,
    )
    .get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lần Mock Test');
  require_(p, PERMISSIONS.MOCK_VIEW, { classId: a.class_id, studentId: a.student_id },
    'Lần Mock này nằm ngoài phạm vi bạn được xem.');

  const scores = scoresOf(attemptId);
  const result = resultOf(a, scores);
  const cells = skillCells(p, a, scores);
  const history = conn
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM mock_schedule_history h
         LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.attempt_id = ? ORDER BY h.id DESC`,
    )
    .all(attemptId) as any[];
  const sos = conn
    .prepare(
      `SELECT sc.*, u.full_name AS coordinator_name, hu.full_name AS head_name
         FROM sos_cases sc LEFT JOIN users u ON u.id = sc.coordinator_user_id
         LEFT JOIN users hu ON hu.id = sc.head_confirmed_by WHERE sc.attempt_id = ?`,
    )
    .get(attemptId) as any;
  const caseHistory = sos
    ? (conn
        .prepare(
          `SELECT h.*, u.full_name AS actor_name FROM sos_case_history h
             LEFT JOIN users u ON u.id = h.actor_user_id WHERE h.case_id = ? ORDER BY h.id DESC LIMIT 40`,
        )
        .all(sos.id) as any[])
    : [];
  const tasks = sos
    ? (conn
        .prepare(
          `SELECT t.id, t.code, t.title, t.progress, t.due_date, u.full_name AS assignee_name
             FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id WHERE t.source_sos_case_id = ?`,
        )
        .all(sos.id) as any[])
    : [];

  return {
    id: a.id,
    student: {
      id: a.student_id, name: a.full_name, code: a.student_code,
      committedScore: a.committed_score, route: a.route, examDate: a.exam_date,
    },
    classId: a.class_id, classCode: a.class_code, classKind: a.class_kind,
    branchId: a.branch_id, branchName: a.branch_name,
    attemptNo: a.attempt_no,
    committedScoreAtTest: a.committed_score_at_test,
    ftWeek: MOCK_FT_WEEK[a.attempt_no] ?? null,
    plannedDate: a.planned_date,
    week: weekInfo(a.planned_date),
    status: a.status,
    cancelReason: a.cancel_reason,
    note: a.note,
    result,
    cells,
    history: history.map((h) => ({
      id: h.id, action: h.action, oldDate: h.old_date, newDate: h.new_date,
      reason: h.reason, actorName: h.actor_name, createdAt: h.created_at,
    })),
    sosCase: sos ?? null,
    /** Checklist phối hợp theo Lần MT × mức SOS, kèm trạng thái đã ghi nhận. */
    caseSteps: sos && sos.sos_level > 0
      ? caseProgress(sos, a.attempt_no, sos.sos_level)
      : result.complete && (result.sosLevel ?? 0) > 0
        ? stepsFor(a.attempt_no, result.sosLevel!).map((s) => ({ ...s, person: null, date: null, value: null, state: 'empty' as const }))
        : [],
    caseHistory: caseHistory.map((h) => ({
      id: h.id, field: h.field, oldValue: h.old_value, newValue: h.new_value,
      actorName: h.actor_name, createdAt: h.created_at,
    })),
    tasks,
    viewer: {
      canSchedule: can(p, PERMISSIONS.MOCK_SCHEDULE, { classId: a.class_id }),
      canCancel: can(p, PERMISSIONS.MOCK_CANCEL, { classId: a.class_id }),
      canEditSos: can(p, PERMISSIONS.SOS_EDIT, { classId: a.class_id, studentId: a.student_id }),
      canConfirm: can(p, PERMISSIONS.SOS_CONFIRM, { classId: a.class_id }),
      editableSkills: editableSkills(p, a.class_id, ENTRY_SKILLS),
    },
  };
}

// ---------------------------------------------------------------- lập / dời / huỷ lịch

export function createMock(p: Principal, input: any) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  const enr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`)
    .get(student.id) as any;
  const classId = input.classId ?? enr?.class_id ?? null;
  require_(p, PERMISSIONS.MOCK_SCHEDULE, { classId, studentId: student.id },
    'Bạn không có quyền lập lịch Mock cho học viên này.');
  const attemptNo = Number(input.attemptNo);
  if (!(attemptNo >= 1 && attemptNo <= 5)) throw badRequest('Lần Mock phải từ MT1 đến MT5.');
  if (!isIsoDate(input.plannedDate)) throw badRequest('Ngày dự kiến không hợp lệ.');

  return tx(() => {
    const dup = conn.prepare('SELECT id FROM mock_attempts WHERE student_id = ? AND attempt_no = ?')
      .get(student.id, attemptNo) as any;
    if (dup) throw badRequest(`Học viên đã có lịch ${'MT' + attemptNo}. Hãy dời lịch thay vì tạo mới.`);
    const info = conn
      .prepare(
        `INSERT INTO mock_attempts (student_id, attempt_no, class_id, planned_date, status,
                                    committed_score_at_test, note, created_by, created_at)
         VALUES (?,?,?,?, 'planned', ?, ?, ?, ?)`,
      )
      .run(student.id, attemptNo, classId, input.plannedDate, student.committed_score, input.note ?? null, p.userId, nowIso());
    const id = Number(info.lastInsertRowid);
    conn.prepare(
      `INSERT INTO mock_schedule_history (attempt_id, action, new_date, reason, actor_user_id, created_at)
       VALUES (?, 'created', ?, ?, ?, ?)`).run(id, input.plannedDate, input.reason ?? null, p.userId, nowIso());
    addJourney({
      studentId: student.id, eventType: 'mock_scheduled', eventDate: input.plannedDate,
      title: `Lên lịch MT${attemptNo}`, refTable: 'mock_attempts', refId: id, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'mock.create', entityType: 'mock_attempt', entityId: id,
      entityLabel: `${student.student_code} MT${attemptNo}`, after: { plannedDate: input.plannedDate } });
    return conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(id);
  });
}

/** Dời lịch cập nhật chính lần Mock đó — không tạo lượt mới, không tăng số MT. */
export function rescheduleMock(p: Principal, attemptId: number, newDate: string, reason?: string) {
  const conn = db();
  const a = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lần Mock Test');
  require_(p, PERMISSIONS.MOCK_SCHEDULE, { classId: a.class_id, studentId: a.student_id },
    'Bạn không có quyền dời lịch Mock của lớp này.');
  if (!isIsoDate(newDate)) throw badRequest('Ngày mới không hợp lệ.');
  if (a.status === 'cancelled') throw badRequest('Lần Mock này đã huỷ. Hãy mở lại trước khi dời lịch.');
  if (newDate === a.planned_date) throw badRequest('Ngày mới trùng ngày hiện tại.');

  return tx(() => {
    conn.prepare('UPDATE mock_attempts SET planned_date = ?, updated_at = ? WHERE id = ?')
      .run(newDate, nowIso(), attemptId);
    conn.prepare(
      `INSERT INTO mock_schedule_history (attempt_id, action, old_date, new_date, reason, actor_user_id, created_at)
       VALUES (?, 'rescheduled', ?, ?, ?, ?, ?)`)
      .run(attemptId, a.planned_date, newDate, reason ?? null, p.userId, nowIso());
    addJourney({
      studentId: a.student_id, eventType: 'mock_rescheduled', eventDate: newDate,
      title: `Dời lịch MT${a.attempt_no}`, detail: reason ?? null,
      refTable: 'mock_attempts', refId: attemptId, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'mock.reschedule', entityType: 'mock_attempt', entityId: attemptId,
      before: { plannedDate: a.planned_date }, after: { plannedDate: newDate, reason } });
    return conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId);
  });
}

export function cancelMock(p: Principal, attemptId: number, reason: string) {
  const conn = db();
  const a = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound();
  require_(p, PERMISSIONS.MOCK_CANCEL, { classId: a.class_id, studentId: a.student_id },
    'Bạn không có quyền huỷ lịch Mock.');
  if (!reason?.trim()) throw badRequest('Cần ghi lý do huỷ.');
  return tx(() => {
    conn.prepare(`UPDATE mock_attempts SET status='cancelled', cancel_reason=?, cancelled_at=?, updated_at=? WHERE id=?`)
      .run(reason.trim(), nowIso(), nowIso(), attemptId);
    conn.prepare(
      `INSERT INTO mock_schedule_history (attempt_id, action, old_date, reason, actor_user_id, created_at)
       VALUES (?, 'cancelled', ?, ?, ?, ?)`).run(attemptId, a.planned_date, reason.trim(), p.userId, nowIso());
    addJourney({ studentId: a.student_id, eventType: 'mock_cancelled', eventDate: demoToday(),
      title: `Huỷ MT${a.attempt_no}`, detail: reason.trim(), refTable: 'mock_attempts', refId: attemptId, createdBy: p.userId });
    writeAudit({ actorUserId: p.userId, action: 'mock.cancel', entityType: 'mock_attempt', entityId: attemptId,
      before: { status: a.status }, after: { status: 'cancelled', reason } });
    return conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId);
  });
}

export function reopenMock(p: Principal, attemptId: number) {
  const conn = db();
  const a = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound();
  require_(p, PERMISSIONS.MOCK_CANCEL, { classId: a.class_id, studentId: a.student_id });
  return tx(() => {
    conn.prepare(`UPDATE mock_attempts SET status='planned', cancel_reason=NULL, cancelled_at=NULL, updated_at=? WHERE id=?`)
      .run(nowIso(), attemptId);
    conn.prepare(
      `INSERT INTO mock_schedule_history (attempt_id, action, new_date, actor_user_id, created_at)
       VALUES (?, 'reopened', ?, ?, ?)`).run(attemptId, a.planned_date, p.userId, nowIso());
    return conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId);
  });
}

// ---------------------------------------------------------------- nhập điểm

export type ScorePatch = {
  testDate?: string | null;
  rawScore?: number | null;
  criteria?: (number | null)[];
  resultDate?: string | null;
  note?: string | null;
};

/**
 * Ghi điểm một kỹ năng. Ô trống khác số 0: gửi null nghĩa là xoá về "chưa nhập",
 * không bao giờ tự điền 0.
 */
export function saveScore(p: Principal, attemptId: number, skill: string, patch: ScorePatch) {
  const conn = db();
  const a = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lần Mock Test');
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
    'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.');
  if (a.status === 'cancelled') throw badRequest('Lần Mock này đã huỷ, không nhập điểm được.');

  return tx(() => {
    const existing = conn.prepare('SELECT * FROM mock_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill) as ScoreRow | undefined;
    const before = existing ? { ...existing } : null;

    const testDate = patch.testDate !== undefined ? patch.testDate : existing?.test_date ?? null;
    if (testDate && !isIsoDate(testDate)) throw badRequest('Ngày thi không hợp lệ.');
    const resultDate = patch.resultDate !== undefined ? patch.resultDate : existing?.result_date ?? null;
    if (resultDate && !isIsoDate(resultDate)) throw badRequest('Ngày có kết quả không hợp lệ.');
    if (testDate && resultDate && resultDate < testDate) throw badRequest('Ngày có kết quả không thể trước ngày thi.');

    let raw: number | null = existing?.raw_score ?? null;
    let crit: (number | null)[] = [existing?.c1 ?? null, existing?.c2 ?? null, existing?.c3 ?? null, existing?.c4 ?? null];
    let band: number | null = existing?.band ?? null;

    try {
      if (isRawSkill(skill)) {
        if (patch.rawScore !== undefined) raw = patch.rawScore;
        band = raw === null || raw === undefined ? null : bandFromRaw(skill, raw);
        crit = [null, null, null, null];
      } else if (isCriteriaSkill(skill)) {
        if (patch.criteria !== undefined) {
          if (!Array.isArray(patch.criteria) || patch.criteria.length !== 4) throw badRequest('Cần đủ bốn ô tiêu chí.');
          crit = patch.criteria.map((v) => (v === null || v === undefined || v === ('' as any) ? null : Number(v)));
        }
        band = bandFromCriteria(crit);
        raw = null;
      }
    } catch (e) {
      if (e instanceof ScoreError) throw badRequest(e.message);
      throw e;
    }

    if (existing) {
      conn
        .prepare(
          `UPDATE mock_scores SET test_date=?, raw_score=?, c1=?, c2=?, c3=?, c4=?, band=?, result_date=?,
                                  entered_by=?, entered_at=?, note=? WHERE id=?`,
        )
        .run(testDate, raw, crit[0], crit[1], crit[2], crit[3], band, resultDate, p.userId, nowIso(),
             patch.note !== undefined ? patch.note : existing.note ?? null, existing.id);
    } else {
      conn
        .prepare(
          `INSERT INTO mock_scores (attempt_id, skill, test_date, raw_score, c1, c2, c3, c4, band, result_date, entered_by, entered_at, note)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(attemptId, skill, testDate, raw, crit[0], crit[1], crit[2], crit[3], band, resultDate, p.userId, nowIso(), patch.note ?? null);
    }

    // Có điểm nghĩa là đã thi. Không suy "đã thi" chỉ vì ngày dự kiến đã qua.
    if (band !== null && a.status === 'planned') {
      conn.prepare(`UPDATE mock_attempts SET status='completed', updated_at=? WHERE id=?`).run(nowIso(), attemptId);
    }

    const after = conn.prepare('SELECT * FROM mock_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, skill);
    writeAudit({ actorUserId: p.userId, action: 'mock.score', entityType: 'mock_attempt', entityId: attemptId,
      entityLabel: skill, before, after });

    const fresh = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(attemptId) as any;
    const rows = scoresOf(attemptId);
    const result = resultOf(fresh, rows);
    // Đủ bốn kỹ năng mới chốt SOS và mở case.
    upsertCaseForResult(p, fresh, result);

    return { score: after, result, attemptStatus: fresh.status };
  });
}

/** Bảng nhập điểm theo lớp × tuần: mỗi dòng một học sinh, cột là các kỹ năng. */
export function classScoreSheet(p: Principal, classId: number, periodId: number | null) {
  const conn = db();
  const cls = conn.prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id=c.branch_id WHERE c.id=?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.MOCK_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const period = periodId ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any) : null;

  let sql = `SELECT a.*, s.full_name, s.student_code, s.committed_score
               FROM mock_attempts a JOIN students s ON s.id = a.student_id
              WHERE a.class_id = ? AND a.status != 'cancelled'`;
  const params: unknown[] = [classId];
  if (period) {
    sql += ` AND (a.planned_date BETWEEN ? AND ?
                  OR EXISTS (SELECT 1 FROM mock_scores ms WHERE ms.attempt_id = a.id AND ms.test_date BETWEEN ? AND ?))`;
    params.push(period.week_start, period.week_end, period.week_start, period.week_end);
  }
  sql += ' ORDER BY s.full_name';
  const attempts = conn.prepare(sql).all(...params) as any[];

  return {
    classId, classCode: cls.code, branchName: cls.branch_name,
    period: period ? { id: period.id, code: period.code, weekStart: period.week_start, weekEnd: period.week_end } : null,
    editableSkills: editableSkills(p, classId, ENTRY_SKILLS),
    rows: attempts.map((a) => {
      const scores = scoresOf(a.id);
      const result = resultOf(a, scores);
      return {
        attemptId: a.id,
        studentId: a.student_id,
        studentName: a.full_name,
        studentCode: a.student_code,
        attemptNo: a.attempt_no,
        plannedDate: a.planned_date,
        status: a.status,
        expectation: result.expectation,
        cells: skillCells(p, a, scores),
        result,
      };
    }),
  };
}

export function suggestPlannedDate(classStart: string | null, attemptNo: number): string | null {
  if (!classStart) return null;
  const ftWeek = MOCK_FT_WEEK[attemptNo];
  if (!ftWeek) return null;
  const d = new Date(classStart + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + (ftWeek - 1) * 7);
  return d.toISOString().slice(0, 10);
}

export { notify };
