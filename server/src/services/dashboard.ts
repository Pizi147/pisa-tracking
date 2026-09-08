import { db } from '../db.ts';
import { PERMISSIONS, TEACHING_SKILLS } from '../../../shared/domain.ts';
import { activeSignalPolicy, demoToday } from '../demoConfig.ts';
import { addDays, weekStartOf } from '../util.ts';
import { can, classScopeSql, studentScopeSql, viewScope, type Principal } from '../permissions.ts';
import { computeSignals } from './weekly.ts';
import { deadlineState } from './tasks.ts';
import { classProgress } from './classes.ts';
import { activeCategoryVersion, categoryDefs } from './reports.ts';

export type DashboardFilters = {
  branchId?: number;
  category?: 'FT' | 'NORMAL';
  teacherId?: number;
  periodId?: number;
  weeks?: number;
};

/** Mọi KPI đều tính từ dữ liệu hiện tại — không có số cứng trong UI. */
export function managerDashboard(p: Principal, f: DashboardFilters = {}) {
  const conn = db();
  const today = demoToday();
  const policy = activeSignalPolicy();
  const academicScope = viewScope(p, PERMISSIONS.ACADEMIC_VIEW);

  const classFilter: string[] = ["c.status = 'active'"];
  const classParams: unknown[] = [];
  const cs = classScopeSql(academicScope);
  classFilter.push(cs.sql);
  classParams.push(...cs.params);
  if (f.branchId) { classFilter.push('c.branch_id = ?'); classParams.push(f.branchId); }
  if (f.category) { classFilter.push('ct.category = ?'); classParams.push(f.category); }
  if (f.teacherId) {
    classFilter.push(`EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.user_id = ? AND ta.status='active')`);
    classParams.push(f.teacherId);
  }

  const classes = conn
    .prepare(
      `SELECT c.id, c.code, c.name, c.branch_id, ct.category, b.name AS branch_name
         FROM classes c JOIN class_types ct ON ct.id = c.class_type_id JOIN branches b ON b.id = c.branch_id
        WHERE ${classFilter.join(' AND ')}`,
    )
    .all(...classParams) as any[];
  const classIds = classes.map((c) => c.id);

  // Đếm theo Student ID duy nhất, không đếm enrollment như người riêng.
  const studentIds = classIds.length
    ? (conn
        .prepare(
          `SELECT DISTINCT e.student_id AS id FROM enrollments e
            WHERE e.class_id IN (${classIds.map(() => '?').join(',')}) AND e.status = 'active'`,
        )
        .all(...classIds) as any[]).map((r) => r.id)
    : [];

  const signals = computeSignals(studentIds);
  const concernStudents = [...signals.values()].filter((s) => s.concern);
  const warningStudentIds = studentIds.length
    ? (conn
        .prepare(
          `SELECT DISTINCT student_id AS id FROM warning_references
            WHERE status != 'closed' AND student_id IN (${studentIds.map(() => '?').join(',')})`,
        )
        .all(...studentIds) as any[]).map((r) => r.id)
    : [];

  const currentWeek = weekStartOf(today);
  const needUpdate = classIds.length
    ? (conn
        .prepare(
          `SELECT COUNT(*) AS n FROM weekly_learning_records
            WHERE class_id IN (${classIds.map(() => '?').join(',')}) AND week_start = ?
              AND applicable = 1 AND attended_main_sessions IS NULL AND expected_main_sessions > 0`,
        )
        .get(...classIds, currentWeek) as any).n
    : 0;

  const taskScope = viewScope(p, PERMISSIONS.TASK_VIEW);
  const taskWhere: string[] = [];
  const taskParams: unknown[] = [];
  if (!taskScope.all) {
    const cl: string[] = ['t.assignee_user_id = ?'];
    taskParams.push(p.userId);
    if (taskScope.branchIds.length) {
      cl.push(`t.branch_id IN (${taskScope.branchIds.map(() => '?').join(',')})`);
      taskParams.push(...taskScope.branchIds);
    }
    if (taskScope.unitIds.length) {
      cl.push(`t.reporting_unit_id IN (${taskScope.unitIds.map(() => '?').join(',')})`);
      taskParams.push(...taskScope.unitIds);
    }
    taskWhere.push('(' + cl.join(' OR ') + ')');
  }
  if (f.branchId) { taskWhere.push('t.branch_id = ?'); taskParams.push(f.branchId); }
  const tasks = conn
    .prepare(
      `SELECT t.*, u.full_name AS assignee_name, b.name AS branch_name, i.code AS issue_code
         FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
         LEFT JOIN branches b ON b.id = t.branch_id
         LEFT JOIN issues i ON i.id = t.issue_id
        ${taskWhere.length ? 'WHERE ' + taskWhere.join(' AND ') : ''}`,
    )
    .all(...taskParams) as any[];
  const withState = tasks.map((t) => ({
    ...t,
    state: deadlineState(t, today),
    ageDays: Math.round((Date.parse(today) - Date.parse((t.created_at as string).slice(0, 10))) / 86400000),
  }));

  const issueScope = viewScope(p, PERMISSIONS.ISSUE_VIEW);
  const issueWhere: string[] = [];
  const issueParams: unknown[] = [];
  if (!issueScope.all) {
    const cl: string[] = ['i.owner_user_id = ?'];
    issueParams.push(p.userId);
    if (issueScope.branchIds.length) { cl.push(`i.branch_id IN (${issueScope.branchIds.map(() => '?').join(',')})`); issueParams.push(...issueScope.branchIds); }
    if (issueScope.classIds.length) { cl.push(`i.class_id IN (${issueScope.classIds.map(() => '?').join(',')})`); issueParams.push(...issueScope.classIds); }
    if (issueScope.studentIds.length) { cl.push(`i.student_id IN (${issueScope.studentIds.map(() => '?').join(',')})`); issueParams.push(...issueScope.studentIds); }
    issueWhere.push('(' + cl.join(' OR ') + ')');
  }
  if (f.branchId) { issueWhere.push('i.branch_id = ?'); issueParams.push(f.branchId); }
  const issues = conn
    .prepare(
      `SELECT i.*, u.full_name AS owner_name, b.name AS branch_name FROM issues i
         LEFT JOIN users u ON u.id = i.owner_user_id LEFT JOIN branches b ON b.id = i.branch_id
        ${issueWhere.length ? 'WHERE ' + issueWhere.join(' AND ') : ''}`,
    )
    .all(...issueParams) as any[];

  const period = f.periodId
    ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(f.periodId) as any)
    : (conn.prepare('SELECT * FROM report_periods WHERE period_start <= ? ORDER BY period_start DESC LIMIT 1').get(today) as any);

  const branchOverview = period ? buildBranchOverview(p, period.id, f.branchId) : { units: [], categories: [] };
  const missingReports = branchOverview.units.filter((u: any) => !u.reportId).length;

  const delayedClasses = classes
    .map((c) => ({ cls: c, prog: classProgress(c.id, today) }))
    .filter((x) => x.prog.summary.delayed)
    .map((x) => ({
      classId: x.cls.id, code: x.cls.code, name: x.cls.name, branchName: x.cls.branch_name,
      category: x.cls.category, lateCount: x.prog.summary.lateCount,
      currentStage: x.prog.summary.currentStage,
      lateStages: x.prog.stages.filter((s) => s.scheduleState === 'late').map((s) => ({ name: s.name, dueDate: s.dueDate, daysLate: s.daysLate })),
    }));

  const overdue = withState.filter((t) => t.state === 'overdue');
  const dueSoon = withState.filter((t) => t.state === 'due_soon');

  return {
    generatedFor: today,
    policy: { version: policy.version, label: policy.label, attendanceMin: policy.attendance_min_rate, homeworkMin: policy.homework_min_rate, experimental: policy.is_experimental === 1, lookbackWeeks: policy.lookback_weeks },
    primaryKpis: [
      { key: 'overdue_tasks', label: 'Công việc quá hạn', value: overdue.length, tone: overdue.length ? 'danger' : 'ok', link: '/cong-viec?view=overdue' },
      { key: 'open_issues', label: 'Vấn đề chưa xử lý xong', value: issues.filter((i) => i.status !== 'resolved').length, tone: 'warn', link: '/van-de?status=open' },
      { key: 'concern_students', label: 'Học viên cần chú ý', value: concernStudents.length, tone: concernStudents.length ? 'warn' : 'ok', link: '/hoc-vien?concern=concern' },
      { key: 'missing_reports', label: 'Báo cáo chi nhánh còn thiếu', value: missingReports, tone: missingReports ? 'danger' : 'ok', link: '/bao-cao' },
      { key: 'need_update', label: 'Dòng dữ liệu tuần chưa cập nhật', value: needUpdate, tone: needUpdate ? 'warn' : 'ok', link: '/lop-hoc' },
      { key: 'due_soon', label: 'Công việc sắp đến hạn', value: dueSoon.length, tone: 'info', link: '/cong-viec?view=due_soon' },
    ],
    secondaryKpis: [
      { key: 'branches', label: 'Chi nhánh trong phạm vi', value: new Set(classes.map((c) => c.branch_id)).size },
      { key: 'active_classes', label: 'Lớp đang hoạt động', value: classes.length },
      { key: 'ft_classes', label: 'Lớp FT', value: classes.filter((c) => c.category === 'FT').length },
      { key: 'normal_classes', label: 'Lớp Normal', value: classes.filter((c) => c.category === 'NORMAL').length },
      { key: 'active_students', label: 'Học viên đang học (theo mã HV)', value: studentIds.length },
      { key: 'delayed_classes', label: 'Lớp chậm theo mốc có hạn', value: delayedClasses.length },
      { key: 'warning_students', label: 'Học viên có ghi nhận cảnh báo mở', value: warningStudentIds.length },
      { key: 'in_progress_tasks', label: 'Công việc đang làm', value: withState.filter((t) => t.status === 'in_progress').length },
      { key: 'paused_tasks', label: 'Công việc tạm dừng', value: withState.filter((t) => t.status === 'paused').length },
      { key: 'completed_tasks', label: 'Công việc đã hoàn thành', value: withState.filter((t) => t.status === 'completed').length },
      { key: 'long_tasks', label: `Công việc kéo dài (> ${policy.long_running_days} ngày)`, value: withState.filter((t) => t.status !== 'completed' && t.ageDays >= policy.long_running_days).length },
      { key: 'no_deadline_tasks', label: 'Công việc chưa có hạn', value: withState.filter((t) => t.state === 'no_deadline').length },
    ],
    branchOverview,
    actionList: [...overdue, ...dueSoon]
      .sort((a, b) => (a.deadline ?? '') < (b.deadline ?? '') ? -1 : 1)
      .slice(0, 12)
      .map((t) => ({
        id: t.id, code: t.code, title: t.title, assigneeName: t.assignee_name,
        deadline: t.deadline, state: t.state, branchName: t.branch_name,
        source: t.issue_code ? `Vấn đề ${t.issue_code}` : t.source_type === 'meeting' ? 'Cuộc họp' : 'Nhập tay',
      })),
    delayedClasses,
    concernStudents: concernStudents.slice(0, 12).map((s) => {
      const st = conn.prepare('SELECT id, student_code, full_name FROM students WHERE id = ?').get(s.studentId) as any;
      return {
        studentId: s.studentId, studentCode: st?.student_code, fullName: st?.full_name,
        reasons: s.reasons, periodLabel: s.periodLabel,
        attendance: s.attendance, homework: s.homework,
      };
    }),
    period,
  };
}

export function buildBranchOverview(p: Principal, periodId: number, branchId?: number) {
  const conn = db();
  const scope = viewScope(p, PERMISSIONS.BRANCH_REPORT_VIEW);
  const version = activeCategoryVersion();
  const cats = categoryDefs(version);

  const where: string[] = ["ru.status = 'active'"];
  const params: unknown[] = [];
  if (!scope.all) {
    const cl: string[] = [];
    if (scope.unitIds.length) { cl.push(`ru.id IN (${scope.unitIds.map(() => '?').join(',')})`); params.push(...scope.unitIds); }
    if (scope.branchIds.length) { cl.push(`ru.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`); params.push(...scope.branchIds); }
    where.push(cl.length ? '(' + cl.join(' OR ') + ')' : '1=0');
  }
  if (branchId) { where.push('ru.branch_id = ?'); params.push(branchId); }

  const units = conn.prepare(`SELECT ru.* FROM reporting_units ru WHERE ${where.join(' AND ')} ORDER BY ru.kind, ru.name`).all(...params) as any[];
  return {
    categories: cats,
    units: units.map((u) => {
      const report = conn.prepare('SELECT * FROM branch_reports WHERE reporting_unit_id = ? AND report_period_id = ?').get(u.id, periodId) as any;
      const rows = report ? (conn.prepare('SELECT * FROM branch_report_categories WHERE branch_report_id = ?').all(report.id) as any[]) : [];
      const byKey = new Map(rows.map((r) => [r.category_key, r]));
      return {
        unitId: u.id, unitName: u.name, kind: u.kind, branchId: u.branch_id,
        reportId: report?.id ?? null, reportStatus: report?.status ?? null,
        cells: cats.map((c) => ({
          key: c.key, label: c.label,
          status: byKey.get(c.key)?.status ?? 'not_reported',
          note: byKey.get(c.key)?.note ?? null,
        })),
      };
    }),
  };
}

/** Dashboard giáo viên: Lớp của tôi → Học viên cần chú ý → Dữ liệu cần cập nhật. */
export function teacherDashboard(p: Principal) {
  const conn = db();
  const today = demoToday();
  const currentWeek = weekStartOf(today);
  const activeAssignments = p.teacherAssignments.filter(
    (a) => a.status === 'active' && a.effective_from <= today && (!a.effective_to || a.effective_to >= today),
  );
  const classIds = [...new Set(activeAssignments.map((a) => a.class_id))];

  const myClasses = classIds.map((id) => {
    const c = conn
      .prepare(
        `SELECT c.*, ct.category, b.name AS branch_name FROM classes c
           JOIN class_types ct ON ct.id = c.class_type_id JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
      )
      .get(id) as any;
    const mine = activeAssignments.filter((a) => a.class_id === id);
    const skills = mine.map((a) => a.skill).filter(Boolean) as string[];
    const isCore = mine.some((a) => a.is_core === 1);
    const activeStudents = (conn
      .prepare(`SELECT COUNT(DISTINCT student_id) AS n FROM enrollments WHERE class_id = ? AND status = 'active'`)
      .get(id) as any).n;

    const skillStatus = skills.map((skill) => {
      const row = conn
        .prepare(
          `SELECT COUNT(*) AS total,
                  SUM(CASE WHEN attended_main_sessions IS NULL THEN 1 ELSE 0 END) AS missing
             FROM weekly_learning_records
            WHERE class_id = ? AND skill = ? AND week_start = ? AND applicable = 1 AND expected_main_sessions > 0`,
        )
        .get(id, skill, currentWeek) as any;
      return { skill, total: row.total ?? 0, missing: row.missing ?? 0 };
    });
    const prog = classProgress(id, today);
    return {
      classId: id, code: c.code, name: c.name, category: c.category, branchName: c.branch_name,
      isCore, skills, activeStudents, skillStatus,
      currentStage: prog.summary.currentStage,
      updateComplete: skillStatus.every((s) => s.missing === 0),
    };
  });

  const studentIds = classIds.length
    ? (conn
        .prepare(
          `SELECT DISTINCT student_id AS id FROM enrollments WHERE class_id IN (${classIds.map(() => '?').join(',')}) AND status = 'active'`,
        )
        .all(...classIds) as any[]).map((r) => r.id)
    : [];
  const signals = computeSignals(studentIds);
  const attention = [...signals.values()]
    .filter((s) => s.concern)
    .map((s) => {
      const st = conn.prepare('SELECT id, student_code, full_name FROM students WHERE id = ?').get(s.studentId) as any;
      const cls = conn
        .prepare(
          `SELECT c.id, c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
            WHERE e.student_id = ? AND e.status = 'active' AND c.id IN (${classIds.map(() => '?').join(',')}) LIMIT 1`,
        )
        .get(s.studentId, ...classIds) as any;
      return {
        studentId: s.studentId, studentCode: st?.student_code, fullName: st?.full_name,
        classId: cls?.id, classCode: cls?.code, reasons: s.reasons,
        attendance: s.attendance, homework: s.homework, periodLabel: s.periodLabel,
      };
    });

  const needsUpdate: any[] = [];
  for (const a of activeAssignments) {
    if (!a.skill) continue;
    for (let i = 0; i < 3; i++) {
      const wk = weekStartOf(addDays(today, -7 * i));
      const row = conn
        .prepare(
          `SELECT COUNT(*) AS missing FROM weekly_learning_records
            WHERE class_id = ? AND skill = ? AND week_start = ? AND applicable = 1
              AND attended_main_sessions IS NULL AND expected_main_sessions > 0`,
        )
        .get(a.class_id, a.skill, wk) as any;
      if (row.missing > 0) {
        const c = conn.prepare('SELECT code FROM classes WHERE id = ?').get(a.class_id) as any;
        needsUpdate.push({ classId: a.class_id, classCode: c.code, skill: a.skill, weekStart: wk, missing: row.missing });
      }
    }
  }

  const myTasks = conn
    .prepare(
      `SELECT t.*, i.code AS issue_code FROM tasks t LEFT JOIN issues i ON i.id = t.issue_id
        WHERE t.assignee_user_id = ? AND t.status != 'completed'
        ORDER BY CASE WHEN t.deadline IS NULL THEN 1 ELSE 0 END, t.deadline LIMIT 8`,
    )
    .all(p.userId) as any[];

  return {
    generatedFor: today,
    currentWeek,
    myClasses,
    attentionStudents: attention,
    needsUpdate: needsUpdate.sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1)),
    myTasks: myTasks.map((t) => ({
      id: t.id, code: t.code, title: t.title, status: t.status, deadline: t.deadline,
      deadlineState: deadlineState(t, today), issueCode: t.issue_code,
    })),
    canSeeManagerView: can(p, PERMISSIONS.ISSUE_MANAGE, {}) || p.grants.some((g) => g.permissions.has(PERMISSIONS.ISSUE_MANAGE)),
  };
}

/** Dashboard tư vấn viên: chỉ dữ liệu đã lọc của học viên được phân công. */
export function consultantDashboard(p: Principal) {
  const conn = db();
  const scope = viewScope(p, PERMISSIONS.ACADEMIC_VIEW);
  const ids = scope.studentIds;
  const signals = computeSignals(ids);
  const students = ids.length
    ? (conn
        .prepare(
          `SELECT s.*, (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                          WHERE e.student_id = s.id AND e.status = 'active' LIMIT 1) AS class_code
             FROM students s WHERE s.id IN (${ids.map(() => '?').join(',')}) ORDER BY s.full_name`,
        )
        .all(...ids) as any[])
    : [];
  return {
    generatedFor: demoToday(),
    total: students.length,
    concernCount: [...signals.values()].filter((s) => s.concern).length,
    students: students.map((s) => ({
      id: s.id, studentCode: s.student_code, fullName: s.full_name, classCode: s.class_code,
      targetBand: s.target_band, examDate: s.exam_date,
      signal: signals.get(s.id),
      warningOpen: (conn.prepare(`SELECT COUNT(*) AS n FROM warning_references WHERE student_id = ? AND status != 'closed'`).get(s.id) as any).n,
    })),
  };
}
