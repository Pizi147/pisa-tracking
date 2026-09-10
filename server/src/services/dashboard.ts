import { db } from '../db.ts';
import { PERMISSIONS, SOS_LABEL } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { listAttempts } from './attempts.ts';
import { listTasks, meetingBoard } from './meeting.ts';
import { periodById } from './week.ts';

/**
 * Tổng quan tuần: bốn cụm số nhỏ + một danh sách ưu tiên.
 *
 * Tách rõ hai lát cắt:
 *  - Kết quả CỦA TUẦN được chọn (lịch dự kiến và lượt đã thi là hai số khác nhau).
 *  - Việc CÒN TỒN đến thời điểm xem, có thể từ tuần trước — đổi tuần không làm biến mất case cũ.
 */
export function overview(p: Principal, periodId: number, branchId?: number) {
  const today = demoToday();
  const period = periodById(periodId);
  if (!period) throw new Error('Không tìm thấy kỳ');

  const all = listAttempts(p, { branchId }).rows;

  // Tuần kết quả LUÔN là tuần kế hoạch của lượt, nên LRW/Speaking lệch tuần không làm
  // một lượt bị đếm hai lần.
  const inWeek = all.filter((m) => m.period?.id === periodId);
  const scheduled = inWeek.filter((m) => m.status !== 'cancelled');
  const cancelled = inWeek.filter((m) => m.status === 'cancelled');
  const done = inWeek.filter((m) => m.status === 'done');
  const uniqueStudents = new Set(scheduled.map((m) => m.studentId)).size;
  const needsDate = scheduled.filter((m) => m.needsDate).length;

  const active = all.filter((m) => m.status !== 'cancelled');
  const missingScores = active.filter((m) => !m.complete && m.scoredRequired > 0);
  const overdueScores = active.filter((m) => m.overdueSkills > 0);

  // Hai cụm case KHÔNG chồng nhau: 'open' là chưa xử lý, 'in_progress' là đang xử lý.
  // Đã ghi nhận GVCN nhận nhưng chưa bắt đầu vẫn nằm ở nhóm chưa xử lý.
  const withCase = active.filter((m) => m.caseId);
  const caseNew = withCase.filter((m) => m.caseStatus === 'open');
  const caseHandling = withCase.filter((m) => m.caseStatus === 'in_progress');
  const caseDone = withCase.filter((m) => m.caseStatus === 'done');

  const sosCounts = { s0: 0, s1: 0, s2: 0, s3: 0 };
  for (const m of active.filter((x) => x.evaluable)) {
    if (m.sosLevel === 0) sosCounts.s0++;
    else if (m.sosLevel === 1) sosCounts.s1++;
    else if (m.sosLevel === 2) sosCounts.s2++;
    else if (m.sosLevel === 3) sosCounts.s3++;
  }

  const tasks = listTasks(p, {}).rows;
  const board = scopeFor(p, PERMISSIONS.MEETING_VIEW).none ? null : meetingBoard(p, periodId);

  const priority: any[] = [];
  for (const m of caseNew.slice(0, 12)) {
    priority.push({
      kind: 'sos_new', studentId: m.studentId, studentName: m.studentName, studentCode: m.studentCode,
      classCode: m.classCode, attemptId: m.id, attemptNo: m.attemptNo,
      reason: `${SOS_LABEL[(m.sosLevel ?? 1) as 1 | 2 | 3]} · MT${m.attemptNo} chưa ai xử lý`,
      action: 'Mở chi tiết để ghi nhận xử lý',
    });
  }
  for (const m of overdueScores.slice(0, 12)) {
    priority.push({
      kind: 'overdue_score', studentId: m.studentId, studentName: m.studentName, studentCode: m.studentCode,
      classCode: m.classCode, attemptId: m.id, attemptNo: m.attemptNo,
      reason: `Quá hạn nhập điểm ${m.overdueSkills} kỹ năng`,
      action: 'Nhắc giáo viên bộ môn nhập điểm',
    });
  }
  for (const m of scheduled.filter((x) => x.needsDate).slice(0, 8)) {
    priority.push({
      kind: 'needs_date', studentId: m.studentId, studentName: m.studentName, studentCode: m.studentCode,
      classCode: m.classCode, attemptId: m.id, attemptNo: m.attemptNo,
      reason: `MT${m.attemptNo} đã có tuần ${m.period?.code ?? ''} nhưng chưa có ngày`,
      action: 'Cập nhật ngày MT thực tế',
    });
  }
  for (const t of tasks.filter((t) => t.dueState === 'overdue').slice(0, 8)) {
    priority.push({
      kind: 'overdue_task', taskId: t.id, taskCode: t.code, title: t.title,
      reason: `Ghi chú hành động quá hạn ${t.dueDate}`, action: t.assigneeName ?? 'Chưa giao',
    });
  }

  return {
    today,
    period: { id: period.id, code: period.code, weekStart: period.week_start, weekEnd: period.week_end, range: period.range },
    kpis: {
      week: {
        scheduled: scheduled.length,
        done: done.length,
        cancelled: cancelled.length,
        uniqueStudents,
        needsDate,
      },
      scoring: {
        missing: missingScores.length,
        overdue: overdueScores.length,
        complete: active.filter((m) => m.complete).length,
      },
      sos: sosCounts,
      /** Hai tập rời nhau theo trạng thái case, đếm CASE chứ không phải học viên. */
      caseNew: caseNew.length,
      caseHandling: caseHandling.length,
      caseDone: caseDone.length,
    },
    meeting: board
      ? { notReported: board.totals.notReported, problem: board.totals.problem, watch: board.totals.watch, total: board.totals.total }
      : null,
    tasks: {
      overdue: tasks.filter((t) => t.dueState === 'overdue').length,
      dueSoon: tasks.filter((t) => t.dueState === 'due_soon').length,
      open: tasks.filter((t) => t.progress !== 'done').length,
    },
    priority: priority.slice(0, 15),
    support: supportMetrics(active, inWeek),
  };
}

function supportMetrics(active: any[], inWeek: any[]) {
  const conn = db();
  const caseIds = active.map((m) => m.caseId).filter(Boolean);
  if (!caseIds.length) {
    return { talkedStudent: 0, talkedParent: 0, academicStarted: 0, avgResultDays: null, avgInterventionDays: null };
  }
  const ph = caseIds.map(() => '?').join(',');
  const cases = conn.prepare(`SELECT * FROM sos_cases WHERE id IN (${ph}) AND sos_level > 0`).all(...caseIds) as any[];
  /*
   * Hai việc trao đổi nay ở bảng Liên hệ, còn hỗ trợ học thuật ở bảng phương án. Đếm theo
   * LƯỢT chứ không theo vấn đề: một lượt trượt ba kỹ năng vẫn chỉ có một lần gọi phụ huynh.
   */
  const attemptIds = [...new Set(cases.map((c) => c.attempt_id).filter(Boolean))];
  const contactCount = (kind: string) => (attemptIds.length
    ? (conn
        .prepare(
          `SELECT COUNT(DISTINCT attempt_id) n FROM student_contacts
            WHERE kind = ? AND done_on IS NOT NULL
              AND attempt_id IN (${attemptIds.map(() => '?').join(',')})`,
        )
        .get(kind, ...attemptIds) as any).n
    : 0);
  const talkedStudent = contactCount('talk_student');
  const talkedParent = contactCount('talk_parent');
  const academicStarted = (conn
    .prepare(
      `SELECT COUNT(DISTINCT case_id) n FROM case_interventions
        WHERE case_id IN (${ph}) AND status != 'cancelled'
          AND COALESCE(completed_date, started_date) IS NOT NULL`,
    )
    .get(...caseIds) as any).n;

  // Thời gian trả kết quả = ngày có kết quả − ngày thi (không phải số ngày quá hạn).
  const diffs: number[] = [];
  for (const m of inWeek) {
    const rows = conn.prepare('SELECT taken_on, result_date FROM assessment_scores WHERE attempt_id = ?').all(m.id) as any[];
    for (const r of rows) {
      if (r.taken_on && r.result_date) {
        diffs.push(Math.round((Date.parse(r.result_date) - Date.parse(r.taken_on)) / 86400000));
      }
    }
  }
  /* Thời gian bắt đầu can thiệp = lần trao đổi đầu tiên − ngày thi đầu tiên của lượt. */
  const interv: number[] = [];
  for (const aid of attemptIds) {
    const first = conn.prepare('SELECT MIN(taken_on) AS d FROM assessment_scores WHERE attempt_id = ?').get(aid) as any;
    const contact = conn
      .prepare('SELECT MIN(done_on) AS d FROM student_contacts WHERE attempt_id = ? AND done_on IS NOT NULL')
      .get(aid) as any;
    if (first?.d && contact?.d) {
      interv.push(Math.round((Date.parse(contact.d) - Date.parse(first.d)) / 86400000));
    }
  }
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  return { talkedStudent, talkedParent, academicStarted, avgResultDays: avg(diffs), avgInterventionDays: avg(interv) };
}
