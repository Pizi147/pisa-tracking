import { db, tx } from '../db.ts';
import { BRANCH_REPORT_STATUSES, PERMISSIONS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { can, require_, viewScope, type Principal } from '../permissions.ts';
import { addJourneyEvent, writeAudit } from './audit.ts';

export function activeCategoryVersion(): number {
  const row = db().prepare("SELECT MAX(version) AS v FROM report_category_defs WHERE status = 'active'").get() as any;
  return row?.v ?? 1;
}

export function categoryDefs(version: number) {
  return db()
    .prepare('SELECT key, label, seq FROM report_category_defs WHERE version = ? ORDER BY seq')
    .all(version) as { key: string; label: string; seq: number }[];
}

export function listReportPeriods() {
  return db().prepare('SELECT * FROM report_periods ORDER BY period_start DESC').all() as any[];
}

/** Đơn vị báo cáo trong phạm vi người dùng, kèm trạng thái báo cáo của kỳ. */
export function branchReportGrid(p: Principal, periodId: number) {
  const scope = viewScope(p, PERMISSIONS.BRANCH_REPORT_VIEW);
  if (scope.none) return { units: [], scopeEmpty: true, categories: [] };
  const conn = db();
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!period) throw notFound('Không tìm thấy kỳ báo cáo');

  const where: string[] = ["ru.status = 'active'"];
  const params: unknown[] = [];
  if (!scope.all) {
    const clauses: string[] = [];
    if (scope.unitIds.length) { clauses.push(`ru.id IN (${scope.unitIds.map(() => '?').join(',')})`); params.push(...scope.unitIds); }
    if (scope.branchIds.length) { clauses.push(`ru.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`); params.push(...scope.branchIds); }
    where.push(clauses.length ? '(' + clauses.join(' OR ') + ')' : '1=0');
  }
  const units = conn.prepare(`SELECT ru.* FROM reporting_units ru WHERE ${where.join(' AND ')} ORDER BY ru.kind, ru.name`).all(...params) as any[];
  const version = activeCategoryVersion();

  return {
    scopeEmpty: false,
    period,
    categories: categoryDefs(version),
    units: units.map((u) => {
      const report = conn
        .prepare('SELECT * FROM branch_reports WHERE reporting_unit_id = ? AND report_period_id = ?')
        .get(u.id, periodId) as any;
      const cats = report
        ? (conn.prepare('SELECT * FROM branch_report_categories WHERE branch_report_id = ? ORDER BY seq').all(report.id) as any[])
        : [];
      const issueCount = report
        ? (conn.prepare('SELECT COUNT(*) AS n FROM issues WHERE source_branch_report_id = ?').get(report.id) as any).n
        : 0;
      return {
        unitId: u.id, unitName: u.name, unitCode: u.code, kind: u.kind, branchId: u.branch_id,
        reportId: report?.id ?? null,
        reportStatus: report?.status ?? null,
        submittedAt: report?.submitted_at ?? null,
        categoryVersion: report?.category_version ?? null,
        categories: cats.map((c) => ({ key: c.category_key, label: c.category_label_snapshot, status: c.status, note: c.note })),
        issueCount,
        /** Chưa gửi khác với "Ổn": không có báo cáo thì mọi nhóm là "Chưa báo cáo". */
        overall: !report ? 'missing' : report.status === 'draft' ? 'draft' : worstStatus(cats.map((c) => c.status)),
        canManage: can(p, PERMISSIONS.BRANCH_REPORT_MANAGE, { branchId: u.branch_id, reportingUnitId: u.id }),
      };
    }),
  };
}

function worstStatus(statuses: string[]): string {
  const order = ['problem', 'watch', 'not_reported', 'ok'];
  for (const s of order) if (statuses.includes(s)) return s;
  return 'not_reported';
}

export function getOrCreateBranchReport(p: Principal, unitId: number, periodId: number, create: boolean) {
  const conn = db();
  const unit = conn.prepare('SELECT * FROM reporting_units WHERE id = ?').get(unitId) as any;
  if (!unit) throw notFound('Không tìm thấy đơn vị báo cáo');
  let report = conn.prepare('SELECT * FROM branch_reports WHERE reporting_unit_id = ? AND report_period_id = ?').get(unitId, periodId) as any;

  if (!report && create) {
    require_(p, PERMISSIONS.BRANCH_REPORT_MANAGE, { branchId: unit.branch_id, reportingUnitId: unitId },
      'Bạn không có quyền nhập báo cáo cho đơn vị này.');
    report = tx(() => {
      const version = activeCategoryVersion();
      const info = conn
        .prepare(
          `INSERT INTO branch_reports (reporting_unit_id, report_period_id, status, category_version, author_user_id, created_at)
           VALUES (?,?,'draft',?,?,?)`,
        )
        .run(unitId, periodId, version, p.userId, nowIso());
      const id = Number(info.lastInsertRowid);
      // Snapshot nhãn category theo version tại thời điểm tạo — báo cáo cũ không đổi khi sửa định nghĩa.
      for (const c of categoryDefs(version)) {
        conn
          .prepare(
            `INSERT INTO branch_report_categories (branch_report_id, category_key, category_label_snapshot, seq, status)
             VALUES (?,?,?,?, 'not_reported')`,
          )
          .run(id, c.key, c.label, c.seq);
      }
      return conn.prepare('SELECT * FROM branch_reports WHERE id = ?').get(id);
    });
  }
  if (!report) return null;
  require_(p, PERMISSIONS.BRANCH_REPORT_VIEW, { branchId: unit.branch_id, reportingUnitId: unitId });

  const cats = conn.prepare('SELECT * FROM branch_report_categories WHERE branch_report_id = ? ORDER BY seq').all(report.id) as any[];
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(periodId) as any;
  const prevPeriod = conn
    .prepare('SELECT * FROM report_periods WHERE period_start < ? ORDER BY period_start DESC LIMIT 1')
    .get(period.period_start) as any;
  const prevReport = prevPeriod
    ? (conn.prepare('SELECT * FROM branch_reports WHERE reporting_unit_id = ? AND report_period_id = ?').get(unitId, prevPeriod.id) as any)
    : null;
  const prevCats = prevReport
    ? (conn.prepare('SELECT * FROM branch_report_categories WHERE branch_report_id = ? ORDER BY seq').all(prevReport.id) as any[])
    : [];
  const issues = conn
    .prepare(
      `SELECT i.id, i.code, i.title, i.status, i.risk_level FROM issues i WHERE i.source_branch_report_id = ? ORDER BY i.id`,
    )
    .all(report.id) as any[];
  const tasks = conn
    .prepare(
      `SELECT t.id, t.code, t.title, t.status, t.deadline, u.full_name AS assignee_name FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_user_id WHERE t.source_branch_report_id = ? ORDER BY t.id`,
    )
    .all(report.id) as any[];

  return {
    id: report.id, unitId, unitName: unit.name, branchId: unit.branch_id,
    periodId, periodLabel: period.label, periodStart: period.period_start, periodEnd: period.period_end,
    status: report.status, summary: report.summary, submittedAt: report.submitted_at,
    categoryVersion: report.category_version,
    categories: cats.map((c) => ({
      key: c.category_key, label: c.category_label_snapshot, seq: c.seq, status: c.status, note: c.note,
      previous: prevCats.find((pc) => pc.category_key === c.category_key)
        ? { status: prevCats.find((pc) => pc.category_key === c.category_key)!.status, note: prevCats.find((pc) => pc.category_key === c.category_key)!.note }
        : null,
    })),
    previousPeriod: prevPeriod ? { id: prevPeriod.id, label: prevPeriod.label, reported: !!prevReport } : null,
    issues, tasks,
    canManage: can(p, PERMISSIONS.BRANCH_REPORT_MANAGE, { branchId: unit.branch_id, reportingUnitId: unitId }),
  };
}

export function saveBranchReportCategory(p: Principal, reportId: number, key: string, patch: { status?: string; note?: string }) {
  const conn = db();
  const report = conn
    .prepare(
      `SELECT br.*, ru.branch_id, ru.name AS unit_name FROM branch_reports br
         JOIN reporting_units ru ON ru.id = br.reporting_unit_id WHERE br.id = ?`,
    )
    .get(reportId) as any;
  if (!report) throw notFound('Không tìm thấy báo cáo');
  require_(p, PERMISSIONS.BRANCH_REPORT_MANAGE, { branchId: report.branch_id, reportingUnitId: report.reporting_unit_id });
  if (patch.status && !BRANCH_REPORT_STATUSES.includes(patch.status as any)) throw badRequest('Trạng thái không hợp lệ.');

  const before = conn.prepare('SELECT * FROM branch_report_categories WHERE branch_report_id = ? AND category_key = ?').get(reportId, key);
  if (!before) throw notFound('Nhóm báo cáo không tồn tại trong báo cáo này.');
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.status !== undefined) { sets.push('status = ?'); params.push(patch.status); }
  if (patch.note !== undefined) { sets.push('note = ?'); params.push(patch.note); }
  if (!sets.length) return before;
  params.push(reportId, key);
  conn.prepare(`UPDATE branch_report_categories SET ${sets.join(', ')} WHERE branch_report_id = ? AND category_key = ?`).run(...params);
  conn.prepare('UPDATE branch_reports SET updated_at = ? WHERE id = ?').run(nowIso(), reportId);
  const after = conn.prepare('SELECT * FROM branch_report_categories WHERE branch_report_id = ? AND category_key = ?').get(reportId, key);
  writeAudit({
    actorUserId: p.userId, action: 'branch_report.category.update', entityType: 'branch_report',
    entityId: reportId, entityLabel: `${report.unit_name} · ${key}`, branchId: report.branch_id, before, after,
  });
  return after;
}

export function submitBranchReport(p: Principal, reportId: number) {
  const conn = db();
  const report = conn
    .prepare(`SELECT br.*, ru.branch_id, ru.name AS unit_name FROM branch_reports br JOIN reporting_units ru ON ru.id = br.reporting_unit_id WHERE br.id = ?`)
    .get(reportId) as any;
  if (!report) throw notFound();
  require_(p, PERMISSIONS.BRANCH_REPORT_MANAGE, { branchId: report.branch_id, reportingUnitId: report.reporting_unit_id });
  const notReported = conn
    .prepare(`SELECT COUNT(*) AS n FROM branch_report_categories WHERE branch_report_id = ? AND status = 'not_reported'`)
    .get(reportId) as any;
  if (notReported.n > 0) throw badRequest(`Còn ${notReported.n} nhóm chưa chọn trạng thái. "Chưa báo cáo" không được coi là "Ổn".`);
  conn.prepare(`UPDATE branch_reports SET status = 'submitted', submitted_at = ?, updated_at = ? WHERE id = ?`).run(nowIso(), nowIso(), reportId);
  writeAudit({
    actorUserId: p.userId, action: 'branch_report.submit', entityType: 'branch_report', entityId: reportId,
    entityLabel: report.unit_name, branchId: report.branch_id, before: { status: report.status }, after: { status: 'submitted' },
  });
  return conn.prepare('SELECT * FROM branch_reports WHERE id = ?').get(reportId);
}

// ---------- Student Progress Report: object riêng, không trộn với Branch Report ----------

export function listStudentProgressReports(p: Principal, filters: { studentId?: number; periodId?: number }) {
  const scope = viewScope(p, PERMISSIONS.ACADEMIC_VIEW);
  if (scope.none) return [];
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.studentId) { where.push('r.student_id = ?'); params.push(filters.studentId); }
  if (filters.periodId) { where.push('r.report_period_id = ?'); params.push(filters.periodId); }
  if (!scope.all) {
    const clauses: string[] = [];
    if (scope.branchIds.length) {
      clauses.push(`EXISTS (SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
                     WHERE e.student_id = r.student_id AND c.branch_id IN (${scope.branchIds.map(() => '?').join(',')}))`);
      params.push(...scope.branchIds);
    }
    if (scope.classIds.length) {
      clauses.push(`EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = r.student_id AND e.class_id IN (${scope.classIds.map(() => '?').join(',')}))`);
      params.push(...scope.classIds);
    }
    if (scope.studentIds.length) {
      clauses.push(`r.student_id IN (${scope.studentIds.map(() => '?').join(',')})`);
      params.push(...scope.studentIds);
    }
    where.push(clauses.length ? '(' + clauses.join(' OR ') + ')' : '1=0');
  }
  const rows = db()
    .prepare(
      `SELECT r.*, s.full_name, s.student_code, u.full_name AS author_name, c.code AS class_code
         FROM student_progress_reports r
         JOIN students s ON s.id = r.student_id
         LEFT JOIN users u ON u.id = r.author_user_id
         LEFT JOIN enrollments e ON e.id = r.enrollment_id
         LEFT JOIN classes c ON c.id = e.class_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY r.report_date DESC, r.id DESC`,
    )
    .all(...params) as any[];

  return rows.map((r) => {
    const canSeeInternal = can(p, PERMISSIONS.NOTE_INTERNAL_VIEW, { studentId: r.student_id });
    return {
      id: r.id, studentId: r.student_id, studentName: r.full_name, studentCode: r.student_code,
      classCode: r.class_code, periodLabel: r.period_label, reportDate: r.report_date,
      progressSummary: canSeeInternal ? r.progress_summary : null,
      attitudeSummary: canSeeInternal ? r.attitude_summary : null,
      nextSteps: canSeeInternal ? r.next_steps : null,
      sharedSummary: r.shared_summary,
      authorName: r.author_name,
      redacted: !canSeeInternal,
    };
  });
}

export function createStudentProgressReport(p: Principal, input: any) {
  require_(p, PERMISSIONS.SUMMARY_EDIT, { studentId: input.studentId },
    'Chỉ GVCN của lớp hoặc quản lý trong phạm vi mới ghi được báo cáo tiến độ học viên.');
  if (!input.periodLabel?.trim()) throw badRequest('Cần chọn kỳ báo cáo.');
  return tx(() => {
    const conn = db();
    const info = conn
      .prepare(
        `INSERT INTO student_progress_reports
          (student_id, enrollment_id, report_period_id, period_label, report_date,
           progress_summary, attitude_summary, next_steps, shared_summary, author_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        input.studentId, input.enrollmentId ?? null, input.reportPeriodId ?? null,
        input.periodLabel.trim(), input.reportDate ?? demoToday(),
        input.progressSummary ?? null, input.attitudeSummary ?? null, input.nextSteps ?? null,
        input.sharedSummary ?? null, p.userId, nowIso(),
      );
    const id = Number(info.lastInsertRowid);
    addJourneyEvent({
      studentId: input.studentId, enrollmentId: input.enrollmentId ?? null,
      eventType: 'progress_report', eventDate: input.reportDate ?? demoToday(),
      title: `Báo cáo tiến độ ${input.periodLabel}`, refTable: 'student_progress_reports', refId: id,
      createdBy: p.userId,
    });
    writeAudit({
      actorUserId: p.userId, action: 'student_progress_report.create', entityType: 'student_progress_report',
      entityId: id, studentId: input.studentId, after: { periodLabel: input.periodLabel },
    });
    return conn.prepare('SELECT * FROM student_progress_reports WHERE id = ?').get(id);
  });
}
