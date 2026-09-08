import { db } from '../db.ts';
import { PERMISSIONS, SOS_LABEL } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { listMocks } from './mock.ts';
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

  const all = listMocks(p, { branchId }).rows;
  const inWeek = all.filter((m) => {
    const d = m.firstTestDate ?? m.plannedDate;
    return d >= period.week_start && d <= period.week_end;
  });

  const scheduled = inWeek.filter((m) => m.status !== 'cancelled');
  const cancelled = inWeek.filter((m) => m.status === 'cancelled');
  const taken = inWeek.filter((m) => m.status === 'completed');
  const uniqueStudents = new Set(scheduled.map((m) => m.studentId)).size;

  // Thiếu điểm và quá hạn là hai chuyện khác nhau. Lượt đã huỷ không tính vào cả hai.
  const active = all.filter((m) => m.status !== 'cancelled');
  const missingScores = active.filter((m) => m.status === 'completed' && m.enteredSkills < m.applicableSkills);
  const overdueScores = active.filter((m) => m.overdueSkills > 0);

  const completedResults = active.filter((m) => m.complete);
  const sosCounts = { s0: 0, s1: 0, s2: 0, s3: 0 };
  for (const m of completedResults) {
    if (m.sosLevel === 0) sosCounts.s0++;
    else if (m.sosLevel === 1) sosCounts.s1++;
    else if (m.sosLevel === 2) sosCounts.s2++;
    else if (m.sosLevel === 3) sosCounts.s3++;
  }
  const sosInWeek = inWeek.filter((m) => m.complete && (m.sosLevel ?? 0) > 0);
  const openCases = active.filter((m) => m.caseId && m.caseStatus !== 'done');

  const tasks = listTasks(p, {}).rows;
  const board = scopeFor(p, PERMISSIONS.MEETING_VIEW).none ? null : meetingBoard(p, periodId);

  const priority: any[] = [];
  for (const m of overdueScores.slice(0, 20)) {
    priority.push({
      kind: 'overdue_score', studentId: m.studentId, studentName: m.studentName, studentCode: m.studentCode,
      classCode: m.classCode, attemptId: m.id, attemptNo: m.attemptNo,
      reason: `Quá hạn nhập điểm ${m.overdueSkills} kỹ năng`,
      action: 'Nhắc giáo viên bộ môn nhập điểm',
    });
  }
  for (const m of openCases.slice(0, 20)) {
    priority.push({
      kind: 'sos_case', studentId: m.studentId, studentName: m.studentName, studentCode: m.studentCode,
      classCode: m.classCode, attemptId: m.id, attemptNo: m.attemptNo,
      reason: `${SOS_LABEL[(m.sosLevel ?? 1) as 1 | 2 | 3]} · MT${m.attemptNo} chưa xử lý xong`,
      action: 'Mở chi tiết Mock để ghi nhận xử lý',
    });
  }
  for (const t of tasks.filter((t) => t.dueState === 'overdue').slice(0, 10)) {
    priority.push({
      kind: 'overdue_task', taskId: t.id, taskCode: t.code, title: t.title,
      reason: `Công việc quá hạn ${t.dueDate}`, action: t.assigneeName ?? 'Chưa giao',
    });
  }

  return {
    today,
    period: { id: period.id, code: period.code, weekStart: period.week_start, weekEnd: period.week_end, range: period.range },
    kpis: {
      week: {
        scheduled: scheduled.length,
        taken: taken.length,
        cancelled: cancelled.length,
        uniqueStudents,
      },
      scoring: {
        missing: missingScores.length,
        overdue: overdueScores.length,
        complete: active.filter((m) => m.complete).length,
      },
      sos: { ...sosCounts, inWeek: sosInWeek.length },
      cases: {
        open: openCases.length,
        done: active.filter((m) => m.caseId && m.caseStatus === 'done').length,
      },
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
    /** Số liệu hỗ trợ, để trong phần mở rộng. */
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
  const talkedStudent = cases.filter((c) => c.talk_student_date).length;
  const talkedParent = cases.filter((c) => c.talk_parent_date).length;
  const academicStarted = cases.filter((c) => c.academic_start_date).length;

  // Thời gian trả kết quả = ngày có kết quả − ngày thi (không phải số ngày quá hạn).
  const diffs: number[] = [];
  for (const m of inWeek) {
    const rows = conn.prepare('SELECT test_date, result_date FROM mock_scores WHERE attempt_id = ?').all(m.id) as any[];
    for (const r of rows) {
      if (r.test_date && r.result_date) {
        diffs.push(Math.round((Date.parse(r.result_date) - Date.parse(r.test_date)) / 86400000));
      }
    }
  }
  const interv: number[] = [];
  for (const c of cases) {
    const a = conn.prepare('SELECT id FROM mock_attempts WHERE id = ?').get(c.attempt_id) as any;
    if (!a) continue;
    const first = conn.prepare('SELECT MIN(test_date) AS d FROM mock_scores WHERE attempt_id = ?').get(c.attempt_id) as any;
    const dates = [c.talk_student_date, c.talk_parent_date].filter(Boolean).sort();
    if (first?.d && dates.length) {
      interv.push(Math.round((Date.parse(dates[0]) - Date.parse(first.d)) / 86400000));
    }
  }
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  return { talkedStudent, talkedParent, academicStarted, avgResultDays: avg(diffs), avgInterventionDays: avg(interv) };
}
