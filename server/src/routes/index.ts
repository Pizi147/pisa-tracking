import { Router } from 'express';
import multer from 'multer';
import { db, isInitialised, tx } from '../db.ts';
import { PERMISSIONS, TEACHING_SKILLS } from '../../../shared/domain.ts';
import { demoToday, getConfig, scenarioMode, setConfig, activeSignalPolicy } from '../demoConfig.ts';
import { HttpError, badRequest, isIsoDate, notFound, nowIso, weekStartOf, toInt } from '../util.ts';
import { SESSION_COOKIE, createSession, destroySession, principalOf, requireAuth } from '../auth.ts';
import { can, permissionSummary, viewScope, loadPrincipal } from '../permissions.ts';
import { maybeSimulateReadError, maybeSimulateSaveFailure, pInt, qInt, qStr, wrap } from './helpers.ts';
import * as weekly from '../services/weekly.ts';
import * as studentsSvc from '../services/students.ts';
import * as classesSvc from '../services/classes.ts';
import * as tasksSvc from '../services/tasks.ts';
import * as issuesSvc from '../services/issues.ts';
import * as reportsSvc from '../services/reports.ts';
import * as meetingsSvc from '../services/meetings.ts';
import * as dashboardSvc from '../services/dashboard.ts';
import * as assessmentsSvc from '../services/assessments.ts';
import * as adminSvc from '../services/admin.ts';
import * as importSvc from '../services/import.ts';
import { auditForEntity } from '../services/audit.ts';

export const api = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// ============ Demo session & tools ============

api.get('/demo/accounts', wrap(() => {
  if (!isInitialised()) {
    throw new HttpError(503, 'Chưa có dữ liệu demo trong máy.', { needsSeed: true });
  }
  const conn = db();
  const users = conn.prepare("SELECT * FROM users WHERE status = 'active' ORDER BY id").all() as any[];
  return users.map((u) => {
    const p = loadPrincipal(u.id);
    return {
      id: u.id, code: u.code, fullName: u.full_name, title: u.title, email: u.email,
      roles: p.grants.map((g) => ({ role: g.role_key, roleName: g.role_name, scopeType: g.scope_type, scopeLabel: g.scope_label })),
      teacherAssignmentCount: p.teacherAssignments.filter((a) => a.status === 'active').length,
      consultantStudentCount: p.consultantStudentIds.size,
    };
  });
}));

api.get('/demo/session', wrap((req) => {
  if (!isInitialised()) {
    return { authenticated: false, needsSeed: true, demoDate: demoToday(), scenario: 'normal' };
  }
  const p = req.principal;
  if (!p) return { authenticated: false, demoDate: demoToday(), scenario: scenarioMode() };
  return {
    authenticated: true,
    user: { id: p.userId, code: p.code, fullName: p.fullName, title: p.title, email: p.email },
    roles: p.roleKeys,
    grants: permissionSummary(p),
    teacherAssignments: p.teacherAssignments
      .filter((a) => a.status === 'active')
      .map((a) => {
        const c = db().prepare('SELECT code, name FROM classes WHERE id = ?').get(a.class_id) as any;
        return { classId: a.class_id, classCode: c?.code, className: c?.name, skill: a.skill, isCore: a.is_core === 1 };
      }),
    consultantStudentCount: p.consultantStudentIds.size,
    demoDate: demoToday(),
    scenario: scenarioMode(),
    signalPolicy: activeSignalPolicy(),
    capabilities: {
      manageIssues: p.grants.some((g) => g.permissions.has(PERMISSIONS.ISSUE_MANAGE)),
      manageTasks: p.grants.some((g) => g.permissions.has(PERMISSIONS.TASK_MANAGE)),
      manageReports: p.grants.some((g) => g.permissions.has(PERMISSIONS.BRANCH_REPORT_MANAGE)),
      viewReports: p.grants.some((g) => g.permissions.has(PERMISSIONS.BRANCH_REPORT_VIEW)),
      viewMeetings: p.grants.some((g) => g.permissions.has(PERMISSIONS.MEETING_VIEW)),
      admin: p.grants.some((g) => g.permissions.has(PERMISSIONS.ADMIN_CONFIG) || g.permissions.has(PERMISSIONS.ADMIN_USERS)),
      importStudents: p.grants.some((g) => g.permissions.has(PERMISSIONS.STUDENT_IMPORT)),
      viewAcademic: p.grants.some((g) => g.permissions.has(PERMISSIONS.ACADEMIC_VIEW)),
      viewTasks: p.grants.some((g) => g.permissions.has(PERMISSIONS.TASK_VIEW)),
      viewIssues: p.grants.some((g) => g.permissions.has(PERMISSIONS.ISSUE_VIEW)),
      isTeacher: p.teacherAssignments.some((a) => a.status === 'active'),
      isConsultantOnly: p.grants.length > 0 && p.grants.every((g) => ['consultant_caseload', 'consultant_team'].includes(g.scope_type)),
    },
  };
}));

api.post('/demo/session', wrap((req, res) => {
  const userId = toInt(req.body?.userId);
  if (!userId) throw badRequest('Cần chọn tài khoản demo.');
  const user = db().prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").get(userId) as any;
  if (!user) throw notFound('Tài khoản demo không tồn tại.');
  if (req.sessionToken) destroySession(req.sessionToken);
  const token = createSession(userId);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return { ok: true, userId };
}));

api.delete('/demo/session', wrap((req, res) => {
  if (req.sessionToken) destroySession(req.sessionToken);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  return { ok: true };
}));

api.get('/demo/config', wrap(() => ({
  demoDate: demoToday(),
  demoDateExplicit: getConfig('demo_date') || null,
  scenario: scenarioMode(),
  seededAt: getConfig('seeded_at') || null,
})));

api.put('/demo/config', requireAuth, wrap((req) => {
  const { demoDate, scenario } = req.body ?? {};
  if (demoDate !== undefined) {
    if (demoDate && !isIsoDate(demoDate)) throw badRequest('Ngày demo phải có dạng YYYY-MM-DD.');
    setConfig('demo_date', demoDate ?? '');
  }
  if (scenario !== undefined) {
    if (!['normal', 'loading', 'empty', 'error', 'save_failure'].includes(scenario)) throw badRequest('Kịch bản không hợp lệ.');
    setConfig('scenario_mode', scenario);
  }
  return { demoDate: demoToday(), scenario: scenarioMode() };
}));

// ============ Reference data ============

api.get('/ref/branches', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const scope = viewScope(p, PERMISSIONS.ACADEMIC_VIEW);
  const all = adminSvc.listBranches();
  if (scope.all) return all;
  return all.filter((b) => scope.branchIds.includes(b.id));
}));

api.get('/ref/reporting-units', requireAuth, wrap(() => adminSvc.listReportingUnits()));
api.get('/ref/class-types', requireAuth, wrap(() => adminSvc.listClassTypes()));
api.get('/ref/report-periods', requireAuth, wrap(() => reportsSvc.listReportPeriods()));
api.get('/ref/users', requireAuth, wrap((req) => {
  const p = principalOf(req);
  if (!can(p, PERMISSIONS.TASK_MANAGE, {}) && !can(p, PERMISSIONS.ISSUE_MANAGE, {}) && !can(p, PERMISSIONS.ADMIN_USERS, {})) {
    return db().prepare('SELECT id, full_name, title FROM users WHERE id = ?').all(p.userId);
  }
  return db().prepare("SELECT id, code, full_name, title FROM users WHERE status = 'active' ORDER BY full_name").all();
}));

api.get('/ref/classes', requireAuth, wrap((req) => {
  const p = principalOf(req);
  return classesSvc.listClasses(p, { branchId: qInt(req, 'branchId') }).map((c) => ({
    id: c.id, code: c.code, name: c.name, branchId: c.branchId, branchName: c.branchName, category: c.category,
  }));
}));

api.get('/notifications', requireAuth, wrap((req) => {
  const p = principalOf(req);
  return db()
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30')
    .all(p.userId);
}));

api.post('/notifications/:id/read', requireAuth, wrap((req) => {
  const p = principalOf(req);
  db().prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?').run(nowIso(), pInt(req, 'id'), p.userId);
  return { ok: true };
}));

// ============ Dashboards ============

api.get('/dashboard/manager', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return dashboardSvc.managerDashboard(principalOf(req), {
    branchId: qInt(req, 'branchId'),
    category: qStr(req, 'category') as any,
    teacherId: qInt(req, 'teacherId'),
    periodId: qInt(req, 'periodId'),
  });
}));

api.get('/dashboard/teacher', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return dashboardSvc.teacherDashboard(principalOf(req));
}));

api.get('/dashboard/consultant', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return dashboardSvc.consultantDashboard(principalOf(req));
}));

// ============ Students ============

api.get('/students', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return studentsSvc.listStudents(principalOf(req), {
    q: qStr(req, 'q'),
    branchId: qInt(req, 'branchId'),
    classId: qInt(req, 'classId'),
    classCategory: qStr(req, 'category') as any,
    status: qStr(req, 'status'),
    concern: qStr(req, 'concern') as any,
    consultantId: qInt(req, 'consultantId'),
    limit: qInt(req, 'limit'),
    offset: qInt(req, 'offset'),
  });
}));

api.get('/students/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return studentsSvc.getStudentDetail(principalOf(req), pInt(req, 'id'));
}));

api.get('/students/:id/journey', requireAuth, wrap((req) => {
  const types = qStr(req, 'types')?.split(',').filter(Boolean);
  return studentsSvc.getJourney(principalOf(req), pInt(req, 'id'), types);
}));

api.get('/students/:id/weekly', requireAuth, wrap((req) =>
  studentsSvc.getStudentWeekly(principalOf(req), pInt(req, 'id'), qInt(req, 'weeks') ?? 8)));

api.get('/students/:id/audit', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const id = pInt(req, 'id');
  const canSee = can(p, PERMISSIONS.AUDIT_VIEW, { studentId: id }) && can(p, PERMISSIONS.NOTE_INTERNAL_VIEW, { studentId: id });
  return auditForEntity(p, 'student', id, canSee);
}));

api.post('/students/:id/transfer', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { toClassId, effectiveDate, reason, keepSkills, endStatus } = req.body ?? {};
  if (!toClassId || !isIsoDate(effectiveDate)) throw badRequest('Cần chọn lớp đích và ngày hiệu lực hợp lệ.');
  return studentsSvc.transferStudent(principalOf(req), pInt(req, 'id'), { toClassId, effectiveDate, reason, keepSkills, endStatus });
}));

api.post('/students/:id/notes', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { body, visibility, skill } = req.body ?? {};
  if (!body?.trim()) throw badRequest('Nội dung ghi chú không được để trống.');
  return { id: studentsSvc.createStudentNote(principalOf(req), pInt(req, 'id'), body, visibility === 'shared' ? 'shared' : 'internal', skill) };
}));

api.post('/students/:id/assessments', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return assessmentsSvc.createAssessment(principalOf(req), { ...req.body, studentId: pInt(req, 'id') });
}));

api.post('/students/:id/warning-references', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return assessmentsSvc.createWarningReference(principalOf(req), { ...req.body, studentId: pInt(req, 'id') });
}));

api.patch('/warning-references/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return assessmentsSvc.updateWarningReference(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/students/:id/incident-references', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return { id: assessmentsSvc.createIncidentReference(principalOf(req), { ...req.body, studentId: pInt(req, 'id') }) };
}));

api.post('/estimates', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return { id: assessmentsSvc.createEstimate(principalOf(req), req.body ?? {}) };
}));

// ============ Classes ============

api.get('/classes', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classesSvc.listClasses(principalOf(req), {
    branchId: qInt(req, 'branchId'), category: qStr(req, 'category'), q: qStr(req, 'q'), status: qStr(req, 'status'),
  });
}));

api.get('/classes/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classesSvc.getClassDetail(principalOf(req), pInt(req, 'id'));
}));

api.get('/classes/:id/weekly', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const skill = qStr(req, 'skill') ?? 'listening';
  if (!TEACHING_SKILLS.includes(skill as any)) throw badRequest('Skill không hợp lệ.');
  const week = qStr(req, 'week') ?? demoToday();
  if (!isIsoDate(week)) throw badRequest('Tuần không hợp lệ.');
  return tx(() => weekly.classWeeklyTable(principalOf(req), pInt(req, 'id'), skill, week));
}));

api.get('/classes/:id/week-summary', requireAuth, wrap((req) => {
  const week = qStr(req, 'week') ?? demoToday();
  return weekly.classWeekSummary(pInt(req, 'id'), week);
}));

api.get('/classes/:id/progress', requireAuth, wrap((req) => classesSvc.classProgress(pInt(req, 'id'))));

api.patch('/classes/:id/progress/:stageKey', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return classesSvc.updateStageProgress(principalOf(req), pInt(req, 'id'), req.params.stageKey, req.body ?? {});
}));

api.post('/classes/:id/overrides', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return classesSvc.upsertClassOverride(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.delete('/classes/:id/overrides/:stageKey', requireAuth, wrap((req) => {
  classesSvc.removeClassOverride(principalOf(req), pInt(req, 'id'), req.params.stageKey);
  return { ok: true };
}));

api.get('/classes/:id/overrides', requireAuth, wrap((req) =>
  db().prepare('SELECT * FROM class_stage_overrides WHERE class_id = ? ORDER BY seq').all(pInt(req, 'id'))));

// ============ Weekly records ============

api.patch('/weekly-records/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { clientSeq, ...patch } = req.body ?? {};
  const allowed = ['attended', 'supplemental', 'homeworkAssigned', 'homeworkCompleted', 'note', 'expected'];
  const clean: any = {};
  for (const k of allowed) if (k in patch) clean[k] = patch[k];
  if (!Object.keys(clean).length) throw badRequest('Không có dữ liệu cần lưu.');
  return tx(() => weekly.saveWeeklyRecord(principalOf(req), pInt(req, 'id'), clean, toInt(clientSeq) ?? undefined));
}));

api.post('/weekly-records/bulk', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { recordIds, patch } = req.body ?? {};
  if (!Array.isArray(recordIds) || !recordIds.length) throw badRequest('Chưa chọn dòng nào.');
  if (!patch || !Object.keys(patch).length) throw badRequest('Chưa chọn giá trị cần áp dụng.');
  return weekly.bulkApply(principalOf(req), recordIds.map(Number), patch);
}));

api.get('/weekly-records/:id/detail', requireAuth, wrap((req) => {
  const id = pInt(req, 'id');
  const conn = db();
  const rec = conn.prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any;
  if (!rec) throw notFound();
  const p = principalOf(req);
  if (!can(p, PERMISSIONS.ACADEMIC_VIEW, { classId: rec.class_id, studentId: rec.student_id })) throw notFound();
  return {
    record: weekly.toWeeklyView(rec),
    attendance: conn.prepare('SELECT * FROM attendance_records WHERE weekly_record_id = ? ORDER BY session_date').all(id),
    homework: conn.prepare('SELECT * FROM homework_assignments WHERE weekly_record_id = ? ORDER BY id').all(id),
    activities: conn.prepare('SELECT * FROM learning_activities WHERE weekly_record_id = ? ORDER BY activity_date').all(id),
    delta: weekly.detailDelta(id),
    canEdit: can(p, PERMISSIONS.WEEKLY_EDIT, { classId: rec.class_id, skill: rec.skill }),
  };
}));

api.post('/weekly-records/:id/attendance', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const p = principalOf(req);
  const id = pInt(req, 'id');
  const rec = db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any;
  if (!rec) throw notFound();
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, { classId: rec.class_id, skill: rec.skill })) throw badRequest('Bạn không có quyền sửa skill này.');
  const { sessionDate, status, note } = req.body ?? {};
  if (!isIsoDate(sessionDate)) throw badRequest('Ngày buổi học không hợp lệ.');
  if (!['present', 'absent', 'late', 'excused'].includes(status)) throw badRequest('Trạng thái điểm danh không hợp lệ.');
  return tx(() => {
    db().prepare('INSERT INTO attendance_records (weekly_record_id, session_date, status, note, created_by, created_at) VALUES (?,?,?,?,?,?)')
      .run(id, sessionDate, status, note ?? null, p.userId, nowIso());
    if (rec.attendance_source !== 'detail') weekly.switchToDetailSource(p, id, 'attendance');
    else weekly.recomputeFromDetail(id, 'attendance');
    return { ok: true, record: weekly.toWeeklyView(db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any) };
  });
}));

api.delete('/attendance-records/:id', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const row = db().prepare('SELECT * FROM attendance_records WHERE id = ?').get(pInt(req, 'id')) as any;
  if (!row) throw notFound();
  const rec = db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(row.weekly_record_id) as any;
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, { classId: rec.class_id, skill: rec.skill })) throw badRequest('Bạn không có quyền sửa skill này.');
  return tx(() => {
    db().prepare('DELETE FROM attendance_records WHERE id = ?').run(row.id);
    weekly.recomputeFromDetail(rec.id, 'attendance');
    return { ok: true };
  });
}));

api.post('/weekly-records/:id/homework', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const p = principalOf(req);
  const id = pInt(req, 'id');
  const rec = db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any;
  if (!rec) throw notFound();
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, { classId: rec.class_id, skill: rec.skill })) throw badRequest('Bạn không có quyền sửa skill này.');
  const { title, status, completed, submittedAt, dueDate, note } = req.body ?? {};
  if (!title?.trim()) throw badRequest('Cần tên bài tập.');
  if (!['completed', 'incomplete', 'missing', 'late'].includes(status)) throw badRequest('Trạng thái bài tập không hợp lệ.');
  // 'Late' không tự suy ra hoàn thành: cần cờ completed hoặc mốc nộp.
  const completedFlag = completed === true || (status === 'completed');
  return tx(() => {
    db()
      .prepare(
        `INSERT INTO homework_assignments (weekly_record_id, title, assigned_date, due_date, status, completed, submitted_at, note, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(id, title.trim(), rec.week_start, dueDate ?? null, status, completedFlag ? 1 : 0, submittedAt ?? null, note ?? null, p.userId, nowIso());
    if (rec.homework_source !== 'detail') weekly.switchToDetailSource(p, id, 'homework');
    else weekly.recomputeFromDetail(id, 'homework');
    return { ok: true, record: weekly.toWeeklyView(db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any) };
  });
}));

api.post('/weekly-records/:id/source', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const id = pInt(req, 'id');
  const { dimension, source } = req.body ?? {};
  if (!['attendance', 'homework'].includes(dimension)) throw badRequest('Chiều dữ liệu không hợp lệ.');
  const rec = db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any;
  if (!rec) throw notFound();
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, { classId: rec.class_id, skill: rec.skill })) throw badRequest('Bạn không có quyền sửa skill này.');
  return tx(() => {
    if (source === 'detail') weekly.switchToDetailSource(p, id, dimension);
    else weekly.switchToAggregateSource(p, id, dimension);
    return weekly.toWeeklyView(db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any);
  });
}));

api.post('/weekly-records/:id/activities', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const p = principalOf(req);
  const id = pInt(req, 'id');
  const rec = db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any;
  if (!rec) throw notFound();
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, { classId: rec.class_id, skill: rec.skill })) throw badRequest('Bạn không có quyền sửa skill này.');
  const { activityDate, sessions, kind, classId, teacherName, note } = req.body ?? {};
  if (!isIsoDate(activityDate)) throw badRequest('Ngày hoạt động không hợp lệ.');
  if (!['joint_class', 'tutor', 'one_to_one'].includes(kind)) throw badRequest('Loại buổi bổ trợ không hợp lệ.');
  const n = toInt(sessions) ?? 1;
  if (n < 1 || n > 20) throw badRequest('Số buổi phải từ 1 đến 20.');
  return tx(() => {
    db()
      .prepare(
        `INSERT INTO learning_activities
          (enrollment_id, weekly_record_id, skill, activity_date, sessions, kind, class_id, teacher_name_text, note, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(rec.enrollment_id, id, rec.skill, activityDate, n, kind, classId ?? null, teacherName ?? null, note ?? null, p.userId, nowIso());
    weekly.recomputeFromDetail(id, 'supplemental');
    return { ok: true, record: weekly.toWeeklyView(db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(id) as any) };
  });
}));

api.delete('/activities/:id', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const row = db().prepare('SELECT * FROM learning_activities WHERE id = ?').get(pInt(req, 'id')) as any;
  if (!row) throw notFound();
  const rec = db().prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(row.weekly_record_id) as any;
  if (!can(p, PERMISSIONS.WEEKLY_EDIT, { classId: rec.class_id, skill: rec.skill })) throw badRequest('Bạn không có quyền sửa skill này.');
  return tx(() => {
    db().prepare('DELETE FROM learning_activities WHERE id = ?').run(row.id);
    weekly.recomputeFromDetail(rec.id, 'supplemental');
    return { ok: true };
  });
}));

// ============ Issues ============

api.get('/issues', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return issuesSvc.listIssues(principalOf(req), {
    status: qStr(req, 'status'), branchId: qInt(req, 'branchId'), risk: qStr(req, 'risk'),
    q: qStr(req, 'q'), studentId: qInt(req, 'studentId'), meetingPeriodId: qInt(req, 'meetingPeriodId'),
  });
}));

api.get('/issues/prefill', requireAuth, wrap((req) =>
  issuesSvc.issuePrefill(principalOf(req), {
    studentId: qInt(req, 'studentId'), classId: qInt(req, 'classId'), branchReportId: qInt(req, 'branchReportId'),
  })));

api.get('/issues/:id', requireAuth, wrap((req) => issuesSvc.issueDetail(principalOf(req), pInt(req, 'id'))));

api.post('/issues', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return issuesSvc.createIssue(principalOf(req), req.body ?? {});
}));

api.patch('/issues/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return issuesSvc.updateIssue(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/issues/:id/notes', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return { id: issuesSvc.addIssueNote(principalOf(req), pInt(req, 'id'), req.body?.body ?? '') };
}));

// ============ Tasks ============

api.get('/tasks', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tasksSvc.listTasks(principalOf(req), {
    view: qStr(req, 'view') as any, branchId: qInt(req, 'branchId'), status: qStr(req, 'status'),
    assigneeId: qInt(req, 'assigneeId'), issueId: qInt(req, 'issueId'), studentId: qInt(req, 'studentId'),
    meetingPeriodId: qInt(req, 'meetingPeriodId'), q: qStr(req, 'q'),
  });
}));

api.get('/tasks/:id', requireAuth, wrap((req) => tasksSvc.taskDetail(principalOf(req), pInt(req, 'id'))));

api.post('/tasks', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return tasksSvc.createTask(principalOf(req), req.body ?? {});
}));

api.patch('/tasks/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { reason, ...patch } = req.body ?? {};
  return tasksSvc.updateTask(principalOf(req), pInt(req, 'id'), patch, reason);
}));

// ============ Reports ============

api.get('/reports/branch', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const periodId = qInt(req, 'periodId');
  if (!periodId) throw badRequest('Cần chọn kỳ báo cáo.');
  return reportsSvc.branchReportGrid(principalOf(req), periodId);
}));

api.get('/reports/branch/detail', requireAuth, wrap((req) => {
  const unitId = qInt(req, 'unitId');
  const periodId = qInt(req, 'periodId');
  if (!unitId || !periodId) throw badRequest('Cần chọn đơn vị và kỳ báo cáo.');
  return reportsSvc.getOrCreateBranchReport(principalOf(req), unitId, periodId, false) ?? { empty: true, unitId, periodId };
}));

api.post('/reports/branch', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { unitId, periodId } = req.body ?? {};
  if (!unitId || !periodId) throw badRequest('Cần chọn đơn vị và kỳ báo cáo.');
  return reportsSvc.getOrCreateBranchReport(principalOf(req), unitId, periodId, true);
}));

api.patch('/reports/branch/:id/categories/:key', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return reportsSvc.saveBranchReportCategory(principalOf(req), pInt(req, 'id'), req.params.key, req.body ?? {});
}));

api.post('/reports/branch/:id/submit', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return reportsSvc.submitBranchReport(principalOf(req), pInt(req, 'id'));
}));

api.get('/reports/student-progress', requireAuth, wrap((req) =>
  reportsSvc.listStudentProgressReports(principalOf(req), { studentId: qInt(req, 'studentId'), periodId: qInt(req, 'periodId') })));

api.post('/reports/student-progress', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return reportsSvc.createStudentProgressReport(principalOf(req), req.body ?? {});
}));

// ============ Meetings ============

api.get('/meetings', requireAuth, wrap(() => meetingsSvc.listMeetingPeriods()));
api.get('/meetings/current', requireAuth, wrap(() => meetingsSvc.currentMeetingPeriod()));
api.get('/meetings/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return meetingsSvc.meetingDetail(principalOf(req), pInt(req, 'id'));
}));
api.post('/meetings/:id/decisions', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return meetingsSvc.addDecision(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.post('/meetings/:id/agenda', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return { id: meetingsSvc.addAgendaItem(principalOf(req), pInt(req, 'id'), req.body?.title ?? '', req.body?.note) };
}));
api.post('/meetings/:id/issues', requireAuth, wrap((req) => {
  meetingsSvc.linkIssueToMeeting(principalOf(req), pInt(req, 'id'), toInt(req.body?.issueId)!);
  return { ok: true };
}));

// ============ Import ============

api.post('/import/parse', requireAuth, upload.single('file'), wrap((req) => {
  const p = principalOf(req);
  if (!p.grants.some((g) => g.permissions.has(PERMISSIONS.STUDENT_IMPORT))) {
    throw badRequest('Bạn không có quyền nhập dữ liệu học viên.');
  }
  const file = (req as any).file;
  if (!file) throw badRequest('Chưa chọn tệp.');
  const parsed = importSvc.parseWorkbook(file.buffer, file.originalname);
  return {
    ...parsed,
    fields: importSvc.STUDENT_IMPORT_FIELDS,
    suggestions: parsed.sheets.map((s) => ({ sheet: s.name, mapping: importSvc.guessMapping(s.headers) })),
  };
}));

api.post('/import/validate', requireAuth, wrap((req) => {
  const { rows, mapping } = req.body ?? {};
  if (!Array.isArray(rows)) throw badRequest('Thiếu dữ liệu dòng.');
  return importSvc.validateStudentImport(principalOf(req), rows, mapping ?? {});
}));

api.post('/import/commit', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { token, fileName, rows, mapping, decisions } = req.body ?? {};
  if (!Array.isArray(rows)) throw badRequest('Thiếu dữ liệu dòng.');
  return importSvc.commitStudentImport(principalOf(req), {
    token, fileName: fileName ?? 'import.xlsx', rows, mapping: mapping ?? {}, decisions: decisions ?? [],
  });
}));

api.get('/import/sample', wrap((req, res) => {
  const kind = qStr(req, 'kind') === 'errors' ? 'errors' : 'clean';
  const buf = importSvc.buildSampleWorkbook(kind);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="mau-import-hoc-vien-${kind}.xlsx"`);
  res.send(buf);
}));

// ============ Admin ============

api.get('/admin/overview', requireAuth, wrap((req) => {
  const p = principalOf(req);
  return {
    branches: adminSvc.listBranches(true),
    reportingUnits: adminSvc.listReportingUnits(),
    classTypes: adminSvc.listClassTypes(),
    templates: adminSvc.listTemplates(),
    signalPolicies: adminSvc.listSignalPolicies(),
    canConfig: can(p, PERMISSIONS.ADMIN_CONFIG, {}),
    canUsers: can(p, PERMISSIONS.ADMIN_USERS, {}),
  };
}));

api.get('/admin/users', requireAuth, wrap((req) => adminSvc.listUsers(principalOf(req))));
api.get('/admin/roles', requireAuth, wrap(() => adminSvc.listRolesAndPermissions()));
api.post('/admin/branches', requireAuth, wrap((req) => adminSvc.upsertBranch(principalOf(req), req.body ?? {})));
api.post('/admin/archive', requireAuth, wrap((req) => {
  const { table, id } = req.body ?? {};
  adminSvc.archiveEntity(principalOf(req), table, toInt(id)!);
  return { ok: true };
}));
api.get('/admin/templates', requireAuth, wrap(() => adminSvc.listTemplates()));
api.get('/admin/template-versions/:id', requireAuth, wrap((req) => adminSvc.getTemplateVersion(pInt(req, 'id'))));
api.post('/admin/templates/:id/versions', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return adminSvc.createTemplateVersion(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.post('/admin/classes/:id/template-version', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return adminSvc.assignTemplateVersionToClass(principalOf(req), pInt(req, 'id'), toInt(req.body?.versionId)!);
}));
api.post('/admin/grants', requireAuth, wrap((req) => adminSvc.upsertGrant(principalOf(req), req.body ?? {})));
api.delete('/admin/grants/:id', requireAuth, wrap((req) => { adminSvc.removeGrant(principalOf(req), pInt(req, 'id')); return { ok: true }; }));
api.post('/admin/teacher-assignments', requireAuth, wrap((req) => adminSvc.upsertTeacherAssignment(principalOf(req), req.body ?? {})));
api.delete('/admin/teacher-assignments/:id', requireAuth, wrap((req) => { adminSvc.removeTeacherAssignment(principalOf(req), pInt(req, 'id')); return { ok: true }; }));
api.post('/admin/consultant-assignments', requireAuth, wrap((req) => ({ id: adminSvc.upsertConsultantAssignment(principalOf(req), req.body ?? {}) })));
api.delete('/admin/consultant-assignments/:id', requireAuth, wrap((req) => { adminSvc.removeConsultantAssignment(principalOf(req), pInt(req, 'id')); return { ok: true }; }));
api.post('/admin/signal-policies', requireAuth, wrap((req) => adminSvc.createSignalPolicy(principalOf(req), req.body ?? {})));
api.get('/admin/audit', requireAuth, wrap((req) => adminSvc.listAuditLogs(principalOf(req), qInt(req, 'limit') ?? 100)));
