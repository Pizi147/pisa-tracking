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
import * as attemptSvc from '../services/attempts.ts';
import * as cycleSvc from '../services/cycles.ts';
import * as estimateSvc from '../services/estimates.ts';
import * as classSvc from '../services/classes.ts';
import * as intakeSvc from '../services/intake.ts';
import * as sosSvc from '../services/sos.ts';
import * as studentSvc from '../services/students.ts';
import * as meetingSvc from '../services/meeting.ts';
import * as dashboardSvc from '../services/dashboard.ts';
import { ensurePeriod, listPeriods, periodById, periodWindow, reportEditWindow } from '../services/week.ts';
import * as planningSvc from '../services/planning.ts';
import { signalsFor } from '../services/signals.ts';
import * as regularSvc from '../services/regular.ts';

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
     * Trang mở đầu theo việc thường làm nhất: giáo viên vào thẳng các kỹ năng cần nhập điểm,
     * Admin chi nhánh vào danh sách cần chốt ngày giờ, còn lại mở Tổng quan.
     * Chỉ đổi điểm vào, không đổi quyền.
     */
    landing: p.roleKeys.length === 1
      ? p.roleKeys[0] === 'teacher' ? '/hoc-vien?view=my_scores'
        : p.roleKeys[0] === 'branch_admin' ? '/hoc-vien?view=need_date'
        : '/'
      : '/',
    // Bốn mục điều hướng + một lối phụ. Ẩn/hiện theo quyền, không theo tên vai trò.
    nav: {
      overview: true,
      mocks: !scopeFor(p, PERMISSIONS.ATTEMPT_VIEW).none,
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
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
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
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
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

/**
 * Cửa sổ tuần cho ô chọn tuần: hai tháng lịch sử quanh tuần đang xem, một tuần tương lai.
 * Không trả về toàn bộ lịch sử — đây là báo cáo vận hành, không phải kho lưu trữ.
 */
api.get('/ref/period-window', requireAuth, wrap((req) => {
  ensurePeriod(demoToday());
  const anchor = toInt(req.query?.anchorId);
  return periodWindow(anchor ?? null).map((p) => ({
    id: p.id, code: p.code, weekStart: p.weekStart, weekEnd: p.weekEnd, range: p.range,
    year: p.year, month: p.month, isAnchor: p.isAnchor,
    editWindow: reportEditWindow({ week_start: p.weekStart, week_end: p.weekEnd, code: p.code }),
  }));
}));

/** Danh sách người cho ô chọn Người phụ trách / Người theo dõi — gõ để lọc. */
api.get('/ref/people', requireAuth, wrap((req) =>
  meetingSvc.searchPeople(principalOf(req), qStr(req, 'q'))));

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

api.get('/attempts', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return attemptSvc.listAttempts(principalOf(req), {
    periodId: qInt(req, 'periodId'),
    branchId: qInt(req, 'branchId'),
    classId: qInt(req, 'classId'),
    studentId: qInt(req, 'studentId'),
    status: qStr(req, 'status'),
    need: qStr(req, 'need') as any,
    q: qStr(req, 'q'),
  });
}));

/*
 * CÁC ĐƯỜNG DẪN CỐ ĐỊNH PHẢI ĐỨNG TRƯỚC `/attempts/:id`.
 * Express khớp theo thứ tự khai báo, nên đặt sau thì `:id` sẽ nuốt luôn "no-plan" và
 * "date-duty" — request đi vào hàm chi tiết với một id không phải số.
 */

/** Nghĩa vụ hàng tuần của Admin chi nhánh: MT tuần này và tuần trước còn thiếu ngày. */
api.get('/attempts/date-duty', requireAuth, wrap((req) => planningSvc.dateDutyQueue(principalOf(req), {
  branchId: toInt(req.query?.branchId), classId: toInt(req.query?.classId),
})));

/** Học viên chưa có tuần MT tiếp theo — việc của Quản lý. */
api.get('/attempts/no-plan', requireAuth, wrap((req) => planningSvc.noPlanQueue(principalOf(req), {
  branchId: toInt(req.query?.branchId), classId: toInt(req.query?.classId),
  includePlanned: req.query?.includePlanned === '1',
})));

api.get('/attempts/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return attemptSvc.attemptDetail(principalOf(req), pInt(req, 'id'));
}));

/** Quản lý lập kế hoạch: chốt TUẦN, chưa cần ngày. */
api.post('/attempts', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const periodId = toInt(req.body?.periodId);
  if (!periodId) throw badRequest('Cần chọn tuần kế hoạch.');
  return attemptSvc.createAttempt(principalOf(req), { ...req.body, periodId });
}));

/**
 * Lên kế hoạch MT cho NHIỀU học viên cùng lúc, kèm chọn kỹ năng lượt này yêu cầu.
 * Bỏ tick một kỹ năng = ngay từ đầu không yêu cầu, KHÁC với "có yêu cầu nhưng chưa có điểm".
 */
api.post('/attempts/bulk-plan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const periodId = toInt(req.body?.periodId);
  if (!periodId) throw badRequest('Cần chọn tuần kế hoạch.');
  return planningSvc.bulkPlan(principalOf(req), { ...req.body, periodId });
}));

/** Cập nhật NGÀY MT thực tế cho nhiều lượt cùng lúc — chỉ ngày, không giờ. */
api.post('/attempts/bulk-date', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return planningSvc.bulkSetDate(principalOf(req), req.body ?? {});
}));

/** Việc sinh ra từ dữ liệu — tự hết khi nguồn được xử lý, không có nút đóng giả. */
api.get('/signals', requireAuth, wrap((req) => signalsFor(principalOf(req), {
  branchId: toInt(req.query?.branchId), periodId: toInt(req.query?.periodId),
})));

/** Tổng hợp Tutor theo chính tutor, không cộng cơ học theo từng chi nhánh. */
api.get('/meeting/tutor-rollup', requireAuth, wrap((req) => {
  const periodId = toInt(req.query?.periodId);
  if (!periodId) throw badRequest('Cần chọn tuần.');
  return meetingSvc.tutorRollup(principalOf(req), periodId);
}));

/** Đổi TUẦN kế hoạch — chỉ Quản lý. */
api.post('/attempts/:id/week', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const periodId = toInt(req.body?.periodId);
  if (!periodId) throw badRequest('Cần chọn tuần.');
  return attemptSvc.setPlanningWeek(principalOf(req), pInt(req, 'id'), periodId, req.body?.reason);
}));

/** Chốt NGÀY–GIỜ trong tuần đã duyệt. Lịch chính do Admin CN, lịch Speaking có thể do GV Speaking. */
api.post('/attempts/:id/schedule', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.setSchedule(principalOf(req), pInt(req, 'id'), {
    lrwAt: req.body?.lrwAt,
    speakingAt: req.body?.speakingAt,
    reason: req.body?.reason,
  });
}));

/** Đánh dấu một kỹ năng đánh giá là không mock ở lượt này, hoặc bỏ đánh dấu. */
api.post('/attempts/:id/skills/:skill/skip', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.setSkillSkip(principalOf(req), pInt(req, 'id'), String(req.params.skill),
    req.body?.skipped !== false, req.body?.reason);
}));

api.post('/attempts/:id/deadline', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.setDeadlineOverride(principalOf(req), pInt(req, 'id'),
    req.body?.deadline ?? null, req.body?.reason);
}));

api.post('/attempts/:id/cancel', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.cancelAttempt(principalOf(req), pInt(req, 'id'), String(req.body?.reason ?? ''));
}));

api.post('/attempts/:id/reopen', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.reopenAttempt(principalOf(req), pInt(req, 'id'));
}));

/**
 * Ghi điểm MỘT kỹ năng. Payload KHÔNG nhận trường lịch — quyền nhập điểm không kèm
 * quyền sửa ngày kế hoạch. `takenOn` là ngày mock thực tế, khác ngày lịch.
 */
api.put('/attempts/:id/scores/:skill', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const skill = String(req.params.skill);
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  const b = req.body ?? {};
  return attemptSvc.saveScore(principalOf(req), pInt(req, 'id'), skill, {
    takenOn: b.takenOn, rawScore: b.rawScore, rawTotal: b.rawTotal,
    criteria: b.criteria, resultDate: b.resultDate, note: b.note,
  });
}));

api.get('/classes/:id/score-sheet', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return attemptSvc.classScoreSheet(principalOf(req), pInt(req, 'id'), qInt(req, 'periodId') ?? null);
}));

// ============================================================ Lớp (Học viên lấy lớp làm gốc)

api.get('/classes', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classSvc.listClassSummaries(principalOf(req), {
    branchId: qInt(req, 'branchId'),
    q: qStr(req, 'q'),
  });
}));

/** Danh sách học viên của lớp — chỉ gọi khi người dùng mở rộng lớp đó. */
api.get('/classes/:id/roster', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classSvc.classRoster(principalOf(req), pInt(req, 'id'), qStr(req, 'q'));
}));

api.get('/classes/:id/overview', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classSvc.classOverview(principalOf(req), pInt(req, 'id'));
}));

api.post('/classes', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return intakeSvc.createClass(principalOf(req), req.body ?? {});
}));

// ============================================================ Thêm học viên hàng loạt

/** Tách dòng từ nội dung dán ở Excel/Google Sheets. Không ghi gì vào database. */
api.post('/intake/parse', requireAuth, wrap((req) => {
  const text = String(req.body?.text ?? '');
  if (!text.trim()) throw badRequest('Chưa có nội dung để đọc.');
  return intakeSvc.parsePaste(text);
}));

/** Xem trước: soát lỗi từng dòng, gợi ý trùng hồ sơ. Vẫn không ghi gì. */
api.post('/intake/preview', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  return intakeSvc.previewIntake(principalOf(req), {
    rows: b.rows ?? [], defaultClassId: b.defaultClassId ?? null, dateFormat: b.dateFormat,
  });
}));

api.post('/intake/commit', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return intakeSvc.commitIntake(principalOf(req), {
    rows: b.rows ?? [], defaultClassId: b.defaultClassId ?? null, dateFormat: b.dateFormat,
    skipRows: b.skipRows ?? [], idempotencyKey: b.idempotencyKey,
  });
}));

api.get('/classes/:id/suggested-weeks', requireAuth, wrap((req) => {
  const cls = db().prepare('SELECT start_date FROM classes WHERE id = ?').get(pInt(req, 'id')) as any;
  return { weeks: intakeSvc.suggestMockWeeks(cls?.start_date ?? null, qInt(req, 'count') ?? 3) };
}));

// ============================================================ Lớp thường (FOU/BE/ELE)

/** Bảng nhập điểm của lớp thường: số câu đúng / tổng số câu, đạt từ 60%. */
api.get('/regular/classes/:classId/sheet', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return regularSvc.regularSheet(principalOf(req), pInt(req, 'classId'), qStr(req, 'kind'));
}));

/** Tạo hai bài kiểm tra của khoá theo đúng mốc TUẦN HỌC của chương trình. */
api.post('/regular/classes/:classId/plan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return regularSvc.planRegularTests(principalOf(req), pInt(req, 'classId'));
}));

/** Nhập điểm một kỹ năng: cả số câu đúng và tổng số câu, không tự điền tổng. */
api.put('/regular/attempts/:id/scores/:skill', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return regularSvc.saveRegularScore(principalOf(req), pInt(req, 'id'), req.params.skill, req.body ?? {});
}));

/** Danh sách chương trình học đang dùng. */
api.get('/ref/programmes', requireAuth, wrap(() =>
  db().prepare(`SELECT code, name, weeks, scoring_mode AS scoringMode FROM programmes WHERE status='active' ORDER BY code`).all()));

// ============================================================ Lộ trình và Đánh giá GV

api.get('/students/:id/cycles', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const id = pInt(req, 'id');
  studentSvc.studentDetail(p, id);        // kiểm tra phạm vi trước khi trả dữ liệu
  return cycleSvc.cyclesOf(id);
}));

api.post('/students/:id/cycles', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cycleSvc.createCycle(principalOf(req), { ...req.body, studentId: pInt(req, 'id') });
}));

api.patch('/cycles/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cycleSvc.updateCycle(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.get('/students/:id/estimates', requireAuth, wrap((req) =>
  estimateSvc.estimateHistory(principalOf(req), pInt(req, 'id'), qStr(req, 'skill'))));

api.get('/students/:id/estimate-comparison', requireAuth, wrap((req) =>
  estimateSvc.compareEstimates(principalOf(req), pInt(req, 'id'))));

/**
 * Đánh giá GV là dữ liệu riêng, không bao giờ ghi đè điểm Mock.
 * Giáo viên cập nhật BẤT KỲ LÚC NÀO — không phụ thuộc tuần MT hay hạn nhập điểm.
 */
api.post('/students/:id/estimates', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return estimateSvc.saveEstimate(principalOf(req), { ...req.body, studentId: pInt(req, 'id') });
}));

// ============================================================ Xử lý sau Mock (SOS)

api.patch('/sos-cases/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosSvc.updateCase(principalOf(req), pInt(req, 'id'), req.body ?? {});
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

api.post('/students/:id/status', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const status = req.body?.status;
  if (!['active', 'inactive', 'finished'].includes(status)) throw badRequest('Trạng thái không hợp lệ.');
  return studentSvc.setStudentStatus(principalOf(req), pInt(req, 'id'), status,
    req.body?.date ?? demoToday(), req.body?.reason);
}));

// ============================================================ Họp tuần

api.get('/meeting/board', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const periodId = qInt(req, 'periodId') ?? ensurePeriod(demoToday()).id;
  const board = meetingSvc.meetingBoard(principalOf(req), periodId) as any;
  const period = periodById(periodId);
  // Giao diện phải biết tuần này có đang mở để cập nhật không, và nếu không thì vì sao.
  return { ...board, editWindow: period ? reportEditWindow(period) : null };
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
    throw new HttpError(403, 'Chỉ Quản trị hệ thống mới xem được phần này.');
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
      attempts: (conn.prepare('SELECT COUNT(*) AS n FROM assessment_attempts').get() as any).n,
      cycles: (conn.prepare('SELECT COUNT(*) AS n FROM learning_cycles').get() as any).n,
      estimates: (conn.prepare('SELECT COUNT(*) AS n FROM teacher_estimates').get() as any).n,
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
