import { db } from '../db.ts';
import { PERMISSIONS, SOS_LABEL } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { listAttempts } from '../fasttrack/attempts.ts';
import { listTasks, meetingBoard } from './meeting.ts';
import { periodById } from '../platform/week.ts';

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

  // Tuần kết quả LUÔN là tuần của lượt, nên một lượt không bị đếm vào hai tuần.
  const inWeek = all.filter((m) => m.period?.id === periodId);
  const scheduled = inWeek.filter((m) => m.status !== 'cancelled');
  const cancelled = inWeek.filter((m) => m.status === 'cancelled');
  const done = inWeek.filter((m) => m.status === 'done');
  const uniqueStudents = new Set(scheduled.map((m) => m.studentId)).size;

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
    return { academicStarted: 0, avgResultDays: null };
  }
  const ph = caseIds.map(() => '?').join(',');
  /*
   * (Trước 21/09/2026 ở đây còn đếm "đã trao đổi với học viên / phụ huynh" — hai phương án của case Ý thức/Khác sinh sau SOS. Case đó
   * đã bỏ; việc trao đổi nay là biện pháp xử lý ở module Ý thức và không còn gắn với một đợt Test.)
   */
  const academicStarted = (conn
    .prepare(
      `SELECT COUNT(DISTINCT case_id) n FROM case_interventions
        WHERE case_id IN (${ph}) AND status != 'cancelled'
          AND COALESCE(completed_date, started_date) IS NOT NULL`,
    )
    .get(...caseIds) as any).n;

  /*
   * Thời gian trả kết quả = ngày có kết quả − CHỦ NHẬT của tuần MT.
   * Không còn ngày thi cụ thể, nên mốc gốc là hết tuần MT — cùng một mốc cho mọi kỹ năng.
   */
  const diffs: number[] = [];
  for (const m of inWeek) {
    if (!m.period?.weekEnd) continue;
    const rows = conn.prepare('SELECT result_date FROM assessment_scores WHERE attempt_id = ?').all(m.id) as any[];
    for (const r of rows) {
      if (r.result_date) {
        diffs.push(Math.round((Date.parse(r.result_date) - Date.parse(m.period.weekEnd)) / 86400000));
      }
    }
  }
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  return { academicStarted, avgResultDays: avg(diffs) };
}
