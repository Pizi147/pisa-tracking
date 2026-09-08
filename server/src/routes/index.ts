import { Router } from 'express';
import { db, isInitialised } from '../db.ts';
import {
  ENTRY_SKILLS, PERMISSIONS, ROLE_LABEL, type Role,
} from '../../../shared/domain.ts';
import { demoToday, getConfig, scenarioMode, setConfig } from '../demoConfig.ts';
import { HttpError, badRequest, isIsoDate, notFound, toInt } from '../util.ts';
import { SESSION_COOKIE, createSession, destroySession, principalOf, requireAuth } from '../auth.ts';
import { can, loadPrincipal, permissionSummary, scopeFor } from '../permissions.ts';
import { maybeSimulateReadError, maybeSimulateSaveFailure, pInt, qInt, qStr, wrap } from './helpers.ts';
import * as mockSvc from '../services/mock.ts';
import * as sosSvc from '../services/sos.ts';
import * as studentSvc from '../services/students.ts';
import * as meetingSvc from '../services/meeting.ts';
import * as dashboardSvc from '../services/dashboard.ts';
import { ensurePeriod, listPeriods } from '../services/week.ts';

export const api = Router();

// ============================================================ Phiên demo

api.get('/demo/accounts', wrap(() => {
  if (!isInitialised()) throw new HttpError(503, 'Chưa có dữ liệu demo trong máy.', { needsSeed: true });
  const conn = db();
  const users = conn.prepare("SELECT * FROM users WHERE status = 'active' ORDER BY id").all() as any[];
  return users.map((u) => {
    const p = loadPrincipal(u.id);
    return {
      id: u.id, code: u.code, fullName: u.full_name, title: u.title,
      grants: p.grants.map((g) => ({
        role: g.roleKey,
        roleName: g.roleName,
        scope: g.branchName ?? 'Toàn hệ thống',
      })),
      assignmentCount: p.assignments.length,
    };
  });
}));

api.get('/demo/session', wrap((req) => {
  if (!isInitialised()) return { authenticated: false, needsSeed: true, demoDate: demoToday(), scenario: 'normal' };
  const p = req.principal;
  if (!p) return { authenticated: false, demoDate: demoToday(), scenario: scenarioMode() };
  const conn = db();
  return {
    authenticated: true,
    user: { id: p.userId, code: p.code, fullName: p.fullName, title: p.title },
    roles: p.roleKeys,
    roleLabels: p.roleKeys.map((r) => ROLE_LABEL[r as Role] ?? r),
    grants: permissionSummary(p),
    assignments: p.assignments.map((a) => {
      const c = conn.prepare('SELECT code FROM classes WHERE id = ?').get(a.classId) as any;
      return { classId: a.classId, classCode: c?.code ?? null, skill: a.skill, isCore: a.isCore };
    }),
    demoDate: demoToday(),
    scenario: scenarioMode(),
    /*
     * Trang mở đầu: giáo viên vào thẳng các Mock cần nhập điểm thuộc phân công của mình,
     * còn lại mở Tổng quan. Chỉ đổi điểm vào, không đổi quyền.
     */
    landing: p.roleKeys.length === 1 && p.roleKeys[0] === 'teacher' ? '/mock-test?need=my_scores' : '/',
    // Bốn mục điều hướng + một lối phụ. Ẩn/hiện theo quyền, không theo tên vai trò.
    nav: {
      overview: true,
      mocks: !scopeFor(p, PERMISSIONS.MOCK_VIEW).none,
      students: !scopeFor(p, PERMISSIONS.STUDENT_VIEW).none,
      meeting: !scopeFor(p, PERMISSIONS.MEETING_VIEW).none,
      admin: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
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
    if (!['normal', 'loading', 'empty', 'error', 'save_failure'].includes(scenario)) {
      throw badRequest('Kịch bản không hợp lệ.');
    }
    setConfig('scenario_mode', scenario);
  }
  return { demoDate: demoToday(), scenario: scenarioMode() };
}));

// ============================================================ Dữ liệu tham chiếu

api.get('/ref/branches', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const scope = scopeFor(p, PERMISSIONS.MOCK_VIEW);
  const all = db().prepare("SELECT id, code, name FROM branches WHERE status='active' ORDER BY id").all() as any[];
  if (scope.all) return all;
  const viaClass = scope.classIds.length
    ? (db().prepare(`SELECT DISTINCT branch_id AS id FROM classes WHERE id IN (${scope.classIds.map(() => '?').join(',')})`)
        .all(...scope.classIds) as any[]).map((r) => r.id)
    : [];
  const allowed = new Set([...scope.branchIds, ...viaClass]);
  return all.filter((b) => allowed.has(b.id));
}));

api.get('/ref/classes', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const scope = scopeFor(p, PERMISSIONS.MOCK_VIEW);
  if (scope.none) return [];
  const branchId = qInt(req, 'branchId');
  const rows = db()
    .prepare(
      `SELECT c.id, c.code, c.kind, c.route, c.branch_id, c.start_date, b.name AS branch_name, b.code AS branch_code,
              (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status='active') AS student_count
         FROM classes c JOIN branches b ON b.id = c.branch_id
        WHERE c.status = 'active' ORDER BY b.id, c.code`,
    )
    .all() as any[];
  return rows
    .filter((c) => scope.all || scope.branchIds.includes(c.branch_id) || scope.classIds.includes(c.id))
    .filter((c) => !branchId || c.branch_id === branchId);
}));

api.get('/ref/periods', requireAuth, wrap(() => {
  // Luôn có kỳ của ngày demo, kể cả khi seed chưa tạo tới tuần đó.
  ensurePeriod(demoToday());
  return listPeriods(26).map((p) => ({
    id: p.id, code: p.code, weekStart: p.weekStart, weekEnd: p.weekEnd, range: p.range, year: p.year, month: p.month,
  }));
}));

api.get('/ref/current-period', requireAuth, wrap(() => ensurePeriod(demoToday())));

api.get('/ref/users', requireAuth, wrap((req) => {
  const p = principalOf(req);
  if (!can(p, PERMISSIONS.MEETING_EDIT, { anyScope: true }) && !can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })) {
    return db().prepare('SELECT id, code, full_name AS fullName, title FROM users WHERE id = ?').all(p.userId);
  }
  return db()
    .prepare("SELECT id, code, full_name AS fullName, title FROM users WHERE status='active' ORDER BY full_name")
    .all();
}));

api.get('/ref/units', requireAuth, wrap((req) => {
  const p = principalOf(req);
  return meetingSvc.visibleUnits(p).map((u: any) => ({
    id: u.id, code: u.code, name: u.name, kind: u.kind, branchId: u.branch_id,
  }));
}));

// ============================================================ Tổng quan

api.get('/overview', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const periodId = qInt(req, 'periodId') ?? ensurePeriod(demoToday()).id;
  return dashboardSvc.overview(p, periodId, qInt(req, 'branchId'));
}));

// ============================================================ Mock Test

api.get('/mocks', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  return mockSvc.listMocks(p, {
    periodId: qInt(req, 'periodId'),
    branchId: qInt(req, 'branchId'),
    classId: qInt(req, 'classId'),
    studentId: qInt(req, 'studentId'),
    status: qStr(req, 'status'),
    need: qStr(req, 'need') as any,
    q: qStr(req, 'q'),
  });
}));

api.get('/mocks/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return mockSvc.mockDetail(principalOf(req), pInt(req, 'id'));
}));

api.post('/mocks', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return mockSvc.createMock(principalOf(req), req.body ?? {});
}));

api.post('/mocks/:id/reschedule', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { plannedDate, reason } = req.body ?? {};
  if (!plannedDate) throw badRequest('Cần ngày mới.');
  return mockSvc.rescheduleMock(principalOf(req), pInt(req, 'id'), plannedDate, reason);
}));

api.post('/mocks/:id/cancel', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return mockSvc.cancelMock(principalOf(req), pInt(req, 'id'), String(req.body?.reason ?? ''));
}));

api.post('/mocks/:id/reopen', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return mockSvc.reopenMock(principalOf(req), pInt(req, 'id'));
}));

/** Ghi điểm MỘT kỹ năng. Gửi null để xoá về "chưa nhập" — không bao giờ tự điền 0. */
api.put('/mocks/:id/scores/:skill', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const skill = String(req.params.skill);
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  return mockSvc.saveScore(principalOf(req), pInt(req, 'id'), skill, req.body ?? {});
}));

/** Bảng nhập điểm theo lớp: một dòng một học sinh, cột là kỹ năng. */
api.get('/classes/:id/score-sheet', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return mockSvc.classScoreSheet(principalOf(req), pInt(req, 'id'), qInt(req, 'periodId') ?? null);
}));

// ============================================================ Xử lý sau Mock (SOS)

api.patch('/sos-cases/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosSvc.updateCase(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/sos-cases/:id/confirm', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosSvc.confirmCase(principalOf(req), pInt(req, 'id'), req.body?.confirmed !== false);
}));

// ============================================================ Học viên

api.get('/students', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return studentSvc.listStudents(principalOf(req), {
    q: qStr(req, 'q'),
    branchId: qInt(req, 'branchId'),
    classId: qInt(req, 'classId'),
    needAttention: qStr(req, 'need') === 'attention',
  });
}));

api.get('/students/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return studentSvc.studentDetail(principalOf(req), pInt(req, 'id'));
}));

api.get('/students/:id/journey', requireAuth, wrap((req) =>
  studentSvc.journey(principalOf(req), pInt(req, 'id'), qStr(req, 'filter'))));

api.patch('/students/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.updateStudent(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/students/:id/transfer', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { toClassId, effectiveDate, reason } = req.body ?? {};
  if (!toClassId) throw badRequest('Cần chọn lớp đích.');
  return studentSvc.transferStudent(principalOf(req), pInt(req, 'id'), Number(toClassId),
    effectiveDate ?? demoToday(), reason);
}));

api.post('/students/:id/enrollment-status', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const status = req.body?.status;
  if (status !== 'paused' && status !== 'active') throw badRequest('Trạng thái không hợp lệ.');
  return studentSvc.setEnrollmentStatus(principalOf(req), pInt(req, 'id'), status,
    req.body?.date ?? demoToday(), req.body?.reason);
}));

// ============================================================ Họp tuần

api.get('/meeting/board', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const periodId = qInt(req, 'periodId') ?? ensurePeriod(demoToday()).id;
  return meetingSvc.meetingBoard(principalOf(req), periodId);
}));

api.put('/meeting/units/:unitId/reports/:categoryKey', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const periodId = toInt(req.body?.periodId) ?? ensurePeriod(demoToday()).id;
  return meetingSvc.saveUnitReport(principalOf(req), pInt(req, 'unitId'), periodId,
    String(req.params.categoryKey), req.body ?? {});
}));

api.get('/tasks', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return meetingSvc.listTasks(principalOf(req), {
    periodId: qInt(req, 'periodId'),
    view: qStr(req, 'view'),
    assigneeId: qInt(req, 'assigneeId'),
    unitId: qInt(req, 'unitId'),
    q: qStr(req, 'q'),
  });
}));

api.post('/tasks', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return meetingSvc.createTask(principalOf(req), req.body ?? {});
}));

api.patch('/tasks/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return meetingSvc.updateTask(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.get('/tasks/:id/history', requireAuth, wrap((req) => meetingSvc.taskHistory(pInt(req, 'id'))));

// ============================================================ Thông báo

api.get('/notifications', requireAuth, wrap((req) => {
  const p = principalOf(req);
  return db()
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30')
    .all(p.userId);
}));

api.post('/notifications/:id/read', requireAuth, wrap((req) => {
  const p = principalOf(req);
  db().prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?')
    .run(demoToday(), pInt(req, 'id'), p.userId);
  return { ok: true };
}));

// ============================================================ Quản trị (lối phụ)

api.get('/admin/overview', requireAuth, wrap((req) => {
  const p = principalOf(req);
  if (!can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })) {
    throw new HttpError(403, 'Chỉ Admin mới xem được phần Quản trị.');
  }
  const conn = db();
  const roles = conn.prepare('SELECT id, key, name_vi AS name FROM roles ORDER BY id').all() as any[];
  const permissions = conn.prepare('SELECT id, key, name_vi AS name FROM permissions ORDER BY id').all() as any[];
  const matrix = conn
    .prepare(
      `SELECT r.key AS role_key, p.key AS perm_key FROM role_permissions rp
         JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id`,
    )
    .all() as any[];
  const users = (conn.prepare("SELECT * FROM users WHERE status='active' ORDER BY id").all() as any[]).map((u) => {
    const up = loadPrincipal(u.id);
    return {
      id: u.id, code: u.code, fullName: u.full_name, title: u.title,
      grants: up.grants.map((g) => ({ role: g.roleKey, roleName: g.roleName, scope: g.branchName ?? 'Toàn hệ thống' })),
      assignments: up.assignments.length,
    };
  });
  return {
    roles,
    permissions,
    matrix: Object.fromEntries(roles.map((r) => [r.key, matrix.filter((m) => m.role_key === r.key).map((m) => m.perm_key)])),
    users,
    branches: conn.prepare('SELECT id, code, name FROM branches ORDER BY id').all(),
    units: conn.prepare('SELECT id, code, name, kind, branch_id AS branchId FROM reporting_units ORDER BY seq').all(),
    counts: {
      students: (conn.prepare('SELECT COUNT(*) AS n FROM students').get() as any).n,
      classes: (conn.prepare('SELECT COUNT(*) AS n FROM classes').get() as any).n,
      attempts: (conn.prepare('SELECT COUNT(*) AS n FROM mock_attempts').get() as any).n,
      cases: (conn.prepare('SELECT COUNT(*) AS n FROM sos_cases').get() as any).n,
    },
    audit: conn
      .prepare(
        `SELECT a.id, a.action, a.entity_type AS entityType, a.entity_label AS entityLabel,
                a.created_at AS createdAt, u.full_name AS actorName
           FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ORDER BY a.id DESC LIMIT 40`,
      )
      .all(),
  };
}));
