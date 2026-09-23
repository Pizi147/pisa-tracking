import { Router, type Request } from 'express';
import multer from 'multer';
import { db, isInitialised } from '../db.ts';
import { laBanChinh } from '../moiTruong.ts';
import {
  ENTRY_SKILLS, ENTRY_SKILL_LABEL, ISSUE_TAXONOMY,
  PERMISSIONS, REGULAR_SKILLS, ROLE_LABEL, WORK_SCOPES, chuongTrinhTuThamSo,
  type Role, type WorkScope,
} from '../../../shared/domain/index.ts';
import { transferReasonText } from '../../../shared/domain/index.ts';
import { demoToday, getConfig, scenarioMode, setConfig } from '../demoConfig.ts';
import { HttpError, badRequest, forbidden, isIsoDate, notFound, toInt } from '../util.ts';
import { SESSION_COOKIE, createSession, destroySession, principalOf, requireAuth } from '../auth.ts';
import { can, loadPrincipal, permissionSummary, require_, scopeFor } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { navOf } from '../platform/nav.ts';
import * as attachmentSvc from '../platform/attachments.ts';
import * as timNguoiSvc from '../platform/timNguoi.ts';
import * as violationSvc from '../yThuc/violations.ts';
import * as accessSvc from '../yThuc/access.ts';
import * as measureSvc from '../yThuc/measures.ts';
import * as phoiHopSvc from '../yThuc/phoiHop.ts';
import * as sosAutoSvc from '../cases/sosAuto.ts';
import * as warningSvc from '../yThuc/canhBao.ts';
import { classViolationBoard } from '../yThuc/board.ts';
import { maybeSimulateReadError, maybeSimulateSaveFailure, pInt, qInt, qStr, wrap } from './helpers.ts';

/**
 * PHẠM VI TRÊN ĐƯỜNG DẪN — sai giá trị thì BỎ QUA, không báo lỗi. Màn hình vẫn phải mở
 * được; máy chủ tự chọn mặc định theo vai khi tham số hỏng hoặc thiếu.
 */
const qScope = (req: Request): WorkScope | undefined => {
  const raw = qStr(req, 'scope');
  return (WORK_SCOPES as readonly string[]).includes(raw ?? '') ? (raw as WorkScope) : undefined;
};
import * as attemptSvc from '../fasttrack/attempts.ts';
import * as skillScheduleSvc from '../fasttrack/skillSchedule.ts';
import * as absenceSvc from '../fasttrack/absence.ts';
import * as effectiveness from '../cases/effectiveness.ts';
import * as cycleSvc from '../fasttrack/cycles.ts';
import * as summarySvc from '../worklist/summary.ts';
import * as pulseSvc from '../worklist/branchpulse.ts';
import * as prefSvc from '../platform/prefs.ts';
import * as profileSvc from '../students/profile.ts';
import * as classSvc from '../classes/classes.ts';
import * as scheduleSvc from '../classes/schedule.ts';
import * as intakeSvc from '../classes/intake.ts';
import * as transitionSvc from '../classes/transition.ts';
import * as hocVienLopSvc from '../classes/hocVienLop.ts';
import * as phanTichLopSvc from '../classes/phanTichLop.ts';
import * as thongTinLopSvc from '../classes/thongTinLop.ts';
import * as studentSvc from '../students/students.ts';
import * as meetingSvc from '../worklist/meeting.ts';
import * as dashboardSvc from '../worklist/dashboard.ts';
import {
  PERIOD_WINDOW_PLANNING_FORWARD_WEEKS,
  ensurePeriod, listPeriods, periodById, periodWindow, reportEditWindow, setPeriodUnlocked,
} from '../platform/week.ts';
import * as planningSvc from '../fasttrack/planning.ts';
import { signalsFor } from '../worklist/signals.ts';
import * as accountSvc from '../platform/accounts.ts';
import * as gioiHan from '../platform/gioiHanThu.ts';
import * as sysconfigSvc from '../platform/sysconfig.ts';
import * as mgmtSvc from '../worklist/mgmttasks.ts';
import * as highlightSvc from '../worklist/highlights.ts';
import * as tongQuanSvc from '../worklist/tongQuan.ts';
import * as bangSvc from '../worklist/bangChiNhanh.ts';
import { weeklyDrill, weeklyRollup } from '../worklist/weekly.ts';
import { metricResponse, metricSet, rowsFor } from '../worklist/metrics.ts';
import { myWork } from '../worklist/mywork.ts';
import * as caseSvc from '../cases/cases.ts';
import * as caseSignalSvc from '../cases/signals.ts';
import * as regularSvc from '../normal/regular.ts';
import * as chamSvc from '../cham/canCham.ts';

export const api = Router();

// ============================================================ Phiên demo

/*
 * BẢN CHÍNH: mọi đường /demo đều tắt, TRỪ hai đường mà đăng nhập thật cần:
 *   GET    /demo/session  — biết đã đăng nhập chưa, và ngày nghiệp vụ (`demoDate` = ngày thật ở bản chính)
 *   DELETE /demo/session  — đăng xuất
 * POST /demo/session là "Vào nhanh": đăng nhập bằng id KHÔNG cần mật khẩu — trên mạng là cửa sau, phải 404.
 */
api.use('/demo', (req, res, next) => {
  if (!laBanChinh()) return next();
  const choQua = req.path === '/session' && (req.method === 'GET' || req.method === 'DELETE');
  if (choQua) return next();
  res.status(404).json({ error: 'Không tìm thấy endpoint.' });
});

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
     * Admin chi nhánh vào danh sách cần cập nhật ngày, còn lại mở Tổng quan.
     * Chỉ đổi điểm vào, không đổi quyền.
     */
    /*
     * AI CŨNG VÀO TỔNG QUAN.
     *
     * Trước đây mỗi vai được đẩy tới một danh sách khác nhau, vì màn Tổng quan cũ là bảng số
     * theo tuần — không phải việc của ai cả. Nay Tổng quan CHÍNH LÀ việc của người đang xem,
     * nên không cần đường vòng: giáo viên mở ra thấy điểm mình phải nhập, Quản lý thấy em
     * đang cần hỗ trợ, Admin chi nhánh thấy lịch cần cập nhật.
     */
    landing: '/',
    // Bốn khu vực + tab con, ẩn/hiện theo quyền (PR-O, server/src/platform/nav.ts).
    nav: navOf(p),
    /* Giao diện ẩn nhãn "Bản demo nội bộ" trên bản chính — cùng cờ máy chủ dùng để khoá các đường của bản demo. */
    banChinh: laBanChinh(),
  };
}));

api.post('/demo/session', wrap((req, res) => {
  const userId = toInt(req.body?.userId);
  if (!userId) throw badRequest('Cần chọn tài khoản demo.');
  const user = db().prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").get(userId) as any;
  if (!user) throw notFound('Tài khoản demo không tồn tại.');
  if (req.sessionToken) destroySession(req.sessionToken);
  const token = createSession(userId);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', secure: laBanChinh() });
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
      /* Tên và cách chấm của chương trình đi kèm luôn: ô chọn lớp cần nói lớp đó học gì. */
      `SELECT c.id, c.code, c.kind, c.route, c.branch_id, c.start_date, c.programme_code,
              pg.name AS programme_name, pg.scoring_mode,
              b.name AS branch_name, b.code AS branch_code,
              (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status='active') AS student_count
         FROM classes c JOIN branches b ON b.id = c.branch_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE c.status = 'active' ORDER BY b.id, c.code`,
    )
    .all() as any[];
  /* Kế hoạch Test CHỈ dành cho Fast Track (sổ MT-01) — Normal thi theo lịch lớp, không xếp lượt. */
  const fastTrackOnly = qStr(req, 'fastTrackOnly') === '1';
  return rows
    .filter((c) => scope.all || scope.branchIds.includes(c.branch_id) || scope.classIds.includes(c.id))
    .filter((c) => !branchId || c.branch_id === branchId)
    .filter((c) => !fastTrackOnly || c.scoring_mode === 'ielts_band');
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
/*
 * Cửa sổ tuần. `scope=planning` mở XA về tương lai — lên kế hoạch MT là việc của tương lai,
 * còn các màn nói về kết quả thì giữ cửa sổ hẹp như cũ.
 */
api.get('/ref/period-window', requireAuth, wrap((req) => {
  ensurePeriod(demoToday());
  const anchor = toInt(req.query?.anchorId);
  const planning = qStr(req, 'scope') === 'planning';
  return periodWindow(anchor ?? null, planning ? { forward: PERIOD_WINDOW_PLANNING_FORWARD_WEEKS } : {}).map((p) => ({
    id: p.id, code: p.code, weekStart: p.weekStart, weekEnd: p.weekEnd, range: p.range,
    year: p.year, month: p.month, isAnchor: p.isAnchor,
    editWindow: reportEditWindow({ week_start: p.weekStart, week_end: p.weekEnd, code: p.code }),
  }));
}));

/**
 * RESOLVE ĐÚNG MỘT TUẦN THÀNH ID THẬT (sổ §13.8).
 *
 * Đường đọc `/ref/period-window` không còn tự tạo hàng cho cả cửa sổ — tuần chưa có hàng trả
 * về `id: null` để vẫn hiện/chọn được, nhưng bộ chọn tuần và các màn cần LƯU vào đúng tuần đó
 * phải gọi route này để lấy ID thật, đúng lúc cần, đúng một tuần — không phải hàng loạt.
 */
api.post('/ref/periods/resolve', requireAuth, wrap((req) => {
  const weekStart = req.body?.weekStart;
  if (!isIsoDate(weekStart)) throw badRequest('Cần một ngày hợp lệ (YYYY-MM-DD) để xác định tuần.');
  return ensurePeriod(weekStart);
}));

/** Danh sách người cho ô chọn Người phụ trách / Người theo dõi — gõ để lọc. */
api.get('/ref/people', requireAuth, wrap((req) =>
  meetingSvc.searchPeople(principalOf(req), qStr(req, 'q'))));

/**
 * Danh sách người cho ô `ChonNguoi` (PR-Form F-2) — khác `/ref/people`: không đòi `MEETING_VIEW`
 * (mọi giáo viên tự chọn được người thực hiện), có ngưỡng ≥ 3 ký tự và tìm không dấu (Q2).
 */
api.get('/ref/nguoi', requireAuth, wrap((req) => {
  const nhom = qStr(req, 'nhom');
  return timNguoiSvc.timNguoi(principalOf(req), {
    q: qStr(req, 'q'),
    nhom: nhom === 'nhan_vien' ? 'nhan_vien' : 'giao_vien',
    studentId: qInt(req, 'studentId'),
  });
}));

api.get('/ref/users', requireAuth, wrap((req) => {
  const p = principalOf(req);
  if (!can(p, PERMISSIONS.MEETING_EDIT, { anyScope: true }) && !can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })) {
    return db().prepare('SELECT id, code, full_name AS fullName, title FROM users WHERE id = ?').all(p.userId);
  }
  return db()
    .prepare("SELECT id, code, full_name AS fullName, title FROM users WHERE status='active' ORDER BY full_name")
    .all();
}));

/**
 * GIÁO VIÊN CÓ THỂ PHÂN CÔNG, để form TẠO LỚP phân công được ngay trong cùng panel (mục 12.2).
 *
 * Phải có đường riêng vì lúc này LỚP CHƯA TỒN TẠI — đường `/classes/:id/teachers` cần một
 * lớp đã có. Tách một lớp ra rồi mới đi tìm người dạy là cách chắc chắn nhất để có những
 * lớp không ai phụ trách nằm im vài tuần.
 *
 * Kèm số lớp mỗi người đang dạy, để người phân công thấy ai đang gánh nhiều.
 */
api.get('/ref/teachers', requireAuth, wrap((req) => {
  const p = principalOf(req);
  if (!can(p, PERMISSIONS.CLASS_ASSIGN, { anyScope: true })) return [];
  const branchId = qInt(req, 'branchId');
  return db()
    .prepare(
      `SELECT u.id, u.code, u.full_name AS name, u.title,
              (SELECT COUNT(DISTINCT ta.class_id) FROM teacher_assignments ta
                WHERE ta.user_id = u.id AND ta.status = 'active') AS classCount
         FROM users u
        WHERE u.status = 'active'
          AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                       WHERE ur.user_id = u.id AND r.key IN ('teacher', 'manager', 'system_admin')
                         AND (? IS NULL OR ur.branch_id IS NULL OR ur.branch_id = ?))
        ORDER BY u.full_name`,
    )
    .all(branchId ?? null, branchId ?? null);
}));

api.get('/ref/units', requireAuth, wrap((req) => {
  const p = principalOf(req);
  return meetingSvc.visibleUnits(p).map((u: any) => ({
    id: u.id, code: u.code, name: u.name, kind: u.kind, branchId: u.branch_id,
  }));
}));

// ============================================================ Tổng quan

/**
 * VIỆC CỦA CHÍNH NGƯỜI ĐANG XEM — thay bảng số theo tuần ở màn chính.
 * Chỉ trả về việc người này thực sự làm được; quyền kiểm ở tầng dịch vụ, không phải ẩn nút.
 */
api.get('/my-work', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return myWork(principalOf(req), { branchId: qInt(req, 'branchId') });
}));

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
    scope: qScope(req),
  });
}));

/*
 * CÁC ĐƯỜNG DẪN CỐ ĐỊNH PHẢI ĐỨNG TRƯỚC `/attempts/:id`.
 * Express khớp theo thứ tự khai báo, nên đặt sau thì `:id` sẽ nuốt luôn "no-plan" —
 * request đi vào hàm chi tiết với một id không phải số.
 */

/** Học viên chưa có tuần MT tiếp theo — việc của Quản lý. */
api.get('/attempts/no-plan', requireAuth, wrap((req) => planningSvc.noPlanQueue(principalOf(req), {
  branchId: toInt(req.query?.branchId), classId: toInt(req.query?.classId),
  includePlanned: req.query?.includePlanned === '1',
  /* Gõ tìm thẳng học viên, và lọc "chưa có MT thứ n" — hai cách vào của mục 10. */
  q: qStr(req, 'q'),
  missingAttemptNo: toInt(req.query?.missingAttemptNo),
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

/** Tổng hợp theo tuần cho Quản lý: mỗi tuần một dòng, mọi con số bấm được. */
api.get('/weekly-rollup', requireAuth, wrap((req) => weeklyRollup(principalOf(req), {
  branchId: toInt(req.query?.branchId),
  weeks: toInt(req.query?.weeks) ?? undefined,
  /* Normal và FT đếm hai thứ khác nhau (mục 4.2) — bộ lọc này quyết định nhãn cột luôn. */
  track: req.query?.track === 'normal' ? 'normal' : req.query?.track === 'ft' ? 'ft' : null,
})));

/**
 * DANH SÁCH KHI BẤM MỘT SỐ CỦA BẢNG TUẦN — chính tập ID đã sinh ra số đó (cùng hàm, cùng quyền, cùng bộ lọc).
 * `periodId` bỏ trống là cả bảng (hợp các tuần đang hiện, đếm duy nhất). `rows=1` kèm tên để vẽ danh sách.
 */
api.get('/weekly-rollup/ids', requireAuth, wrap((req) => {
  const col = qStr(req, 'col');
  if (!col) throw badRequest('Chưa chọn cột của bảng tuần.');
  const d = weeklyDrill(principalOf(req), {
    branchId: toInt(req.query?.branchId), weeks: toInt(req.query?.weeks) ?? undefined,
    track: req.query?.track === 'normal' ? 'normal' : req.query?.track === 'ft' ? 'ft' : null,
  }, toInt(req.query?.periodId), col);
  return {
    unit: d.unit, n: d.ids.length, empty: d.empty,
    rows: qStr(req, 'rows') === '1' ? rowsFor(d.unit, d.ids) : undefined,
  };
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
  return attemptSvc.setPlanningWeek(principalOf(req), pInt(req, 'id'), periodId, req.body?.reason,
    { force: req.body?.force === true });
}));

/** Đánh dấu một kỹ năng đánh giá là ngoài phạm vi yêu cầu của lượt này, hoặc bỏ đánh dấu. */
api.post('/attempts/:id/skills/:skill/skip', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.setSkillSkip(principalOf(req), pInt(req, 'id'), String(req.params.skill),
    req.body?.skipped !== false, req.body?.reason);
}));

/*
 * LỊCH THI RIÊNG TỪNG KỸ NĂNG (mục 10.1). Ba thao tác, ba câu hỏi khác nhau:
 * thi tuần nào · đã thi hay vắng · hạn chấm là ngày nào.
 *
 * Mỗi đường đi qua đúng hàm nghiệp vụ của nó, nên ràng buộc thứ tự đợt, quyền theo lớp và
 * nhật ký giữ nguyên dù người dùng vào từ màn chi tiết, bảng điểm hay panel Lịch Mock Test.
 */
api.post('/attempts/:id/skills/:skill/week', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const periodId = toInt(req.body?.periodId);
  if (!periodId) throw badRequest('Cần chọn tuần thi cho kỹ năng này.');
  /*
   * ĐƯỜNG NÀY LÀ DỜI CHỦ ĐỘNG. Dời vì em vắng đi qua `/attempts/:id/absence-move` — ở đó mới
   * có bộ đếm, người duyệt và hạn trả lời (mục 10.6).
   */
  return skillScheduleSvc.setSkillWeek(principalOf(req), pInt(req, 'id'), String(req.params.skill), periodId, {
    reason: req.body?.reason ?? null,
    /* Chỉ vượt được CẢNH BÁO (hai đợt cách nhau một tuần), không vượt được ràng buộc thứ tự. */
    force: req.body?.force === true,
  });
}));

api.post('/attempts/:id/skills/:skill/sit', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return skillScheduleSvc.setSitStatus(principalOf(req), pInt(req, 'id'), String(req.params.skill),
    String(req.body?.status ?? ''), req.body?.note ?? null);
}));

api.post('/attempts/:id/skills/:skill/deadline', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return skillScheduleSvc.setSkillDeadline(principalOf(req), pInt(req, 'id'), String(req.params.skill),
    req.body?.deadline ?? null, req.body?.reason ?? null);
}));

/*
 * VẮNG, DỜI CÓ GIỚI HẠN VÀ KHÔI PHỤC (mục 10.6).
 *
 * Bốn đường, và chúng KHÁC HẲN đường đổi lịch thường ở trên: đổi lịch là quyết định về kế
 * hoạch, còn đây là hệ quả của việc em không có mặt — có bộ đếm, có người duyệt, và có hạn
 * trả lời. Trộn hai đường vào một là mất hẳn bộ đếm.
 */
api.post('/attempts/:id/absence-move', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const skills = Array.isArray(req.body?.skills) ? req.body.skills.map(String) : [];
  return absenceSvc.requestAbsenceMove(principalOf(req), pInt(req, 'id'), skills, {
    reason: req.body?.reason ?? null,
    /* Bấm hai lần hay mạng chập không được thành hai lần dời. */
    idempotencyKey: req.body?.idempotencyKey ?? null,
  });
}));

api.post('/move-requests/:id/decide', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return absenceSvc.decideAbsenceMove(principalOf(req), pInt(req, 'id'), {
    approve: req.body?.approve === true,
    note: req.body?.note ?? null,
    periodId: toInt(req.body?.periodId) || null,
  });
}));

api.get('/move-requests', requireAuth, wrap((req) => absenceSvc.openMoveRequests(principalOf(req))));

api.post('/attempts/:id/skills/:skill/restore', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const periodId = toInt(req.body?.periodId);
  if (!periodId) throw badRequest('Khôi phục thì phải đặt luôn tuần mới — không để phần thi treo không lịch.');
  return absenceSvc.restoreCancelledSkill(principalOf(req), pInt(req, 'id'), String(req.params.skill), periodId, {
    reason: req.body?.reason ?? null,
  });
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
 * Ghi điểm MỘT kỹ năng. Payload KHÔNG nhận trường lịch nào — quyền nhập điểm không kèm
 * quyền đổi tuần MT.
 */
api.put('/attempts/:id/scores/:skill', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const skill = String(req.params.skill);
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  const b = req.body ?? {};
  return attemptSvc.saveScore(principalOf(req), pInt(req, 'id'), skill, {
    rawScore: b.rawScore, rawTotal: b.rawTotal,
    criteria: b.criteria, resultDate: b.resultDate, note: b.note,
    /* RB-5 — lý do hiệu chỉnh khi sửa ô đã có điểm; máy chủ tự quyết khi nào bắt buộc. */
    lyDo: b.lyDo,
    /* Dấu '-' "không có bài" (PR-G) — chỉ nhận đúng true/false, không hiểu chuỗi lạ thành lệnh. */
    noShow: b.noShow === true ? true : b.noShow === false ? false : undefined,
  });
}));

/**
 * QUẢN LÝ HIỆU CHỈNH dấu '-' nhập cho tuần ĐÃ KẾT THÚC (C10): `{ decision: 'confirm' | 'reject' }`.
 * Không tự chốt và không âm thầm mở lại tuần đã chốt — chỉ Quản lý có quyền xếp lịch làm được việc này.
 */
api.post('/attempts/:id/scores/:skill/no-show/resolve', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const skill = String(req.params.skill);
  if (!(ENTRY_SKILLS as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  const decision = req.body?.decision;
  if (decision !== 'confirm' && decision !== 'reject') throw badRequest('Cần chọn xác nhận hoặc từ chối.');
  return absenceSvc.resolveLateNoShow(principalOf(req), pInt(req, 'id'), skill, decision);
}));

api.get('/classes/:id/score-sheet', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return attemptSvc.classScoreSheet(principalOf(req), pInt(req, 'id'), qInt(req, 'periodId') ?? null);
}));
/**
 * MỘT CỬA CHO BẢNG CHẤM (spec §3.5): máy chủ chọn đúng bảng theo loại lớp, giao diện không phải đoán. Mở
 * `/nhap-diem/:id` của một lớp thường thì đây là chỗ trả về lưới lớp thường.
 */
api.get('/classes/:classId/cham', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return chamSvc.chamSheet(principalOf(req), pInt(req, 'classId'), {
    periodId: qInt(req, 'periodId') ?? null, kind: qStr(req, 'kind') ?? null,
  });
}));

/** Cần chấm — mockup 05a2 phương án A: ba mục Quá hạn / Tuần này / Sắp tới, mỗi dòng một lớp + một đợt. */
api.get('/cham/can-cham', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return chamSvc.canChamList(principalOf(req), {
    branchId: qInt(req, 'branchId'), classId: qInt(req, 'classId'), scope: qScope(req),
  });
}));

/** Lịch Test — các lượt Test của một tuần, nhóm theo lớp. Không truyền tuần thì lấy tuần hiện tại. */
api.get('/cham/lich-test', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const periodId = qInt(req, 'periodId') ?? ensurePeriod(demoToday()).id;
  return chamSvc.lichTest(principalOf(req), periodId, qInt(req, 'branchId'));
}));

// ============================================================ Lớp (Học viên lấy lớp làm gốc)

api.get('/classes', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classSvc.listClassSummaries(principalOf(req), {
    branchId: qInt(req, 'branchId'),
    q: qStr(req, 'q'),
    scope: qScope(req),
  });
}));

/** Danh sách học viên của lớp — chỉ gọi khi người dùng mở rộng lớp đó. */
api.get('/classes/:id/roster', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classSvc.classRoster(principalOf(req), pInt(req, 'id'), qStr(req, 'q'));
}));

/*
 * BẢNG PHÂN TÍCH VẤN ĐỀ CỦA MỘT LỚP (mục 13.4). Đường cũ của Bảng Ý thức của lớp (đếm số đợt case) đã bỏ 21/09/2026:
 * Ý thức nay là vi phạm và biện pháp xử lý, dữ liệu ba khu vực ở `GET /classes/:id/y-thuc`.
 */
api.get('/classes/:id/issue-board', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.CASE_VIEW, { classId: id }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const category = qStr(req, 'category');
  if (!category) throw badRequest('Chưa chọn kỹ năng để phân tích.');
  return effectiveness.classIssueBoard(id, category, { fromDate: qStr(req, 'from') ?? null });
}));

/*
 * BẢNG PHÂN TÍCH VẤN ĐỀ Ở PHẠM VI CHI NHÁNH — trang Thực trạng (mục 15).
 *
 * Ba đường dưới đây dùng CHUNG một bộ lọc phạm vi và CHUNG một cách đếm với bảng của từng
 * lớp (mục 13.4). Số tổng, bảng phân loại và danh sách khi bấm số vì thế không thể lệch
 * nhau — đó là cả lý do chúng gọi vào cùng một nơi thay vì mỗi màn tự đếm lấy.
 */
function issueScopeOf(req: any) {
  const p = principalOf(req);
  const sc = scopeFor(p, PERMISSIONS.CASE_VIEW);
  if (sc.none) throw forbidden('Bạn không có quyền xem thực trạng.');
  const asked = qInt(req, 'branchId') ?? null;
  /* Không có quyền toàn hệ thống thì phạm vi luôn là giao của quyền và ô người dùng chọn. */
  const allowed = sc.all ? null : sc.branchIds;
  const branchIds: number[] | null = asked !== null
    ? (allowed && !allowed.includes(asked) ? [] : [asked])
    : allowed;
  const classId = qInt(req, 'classId');
  /* Hỏi theo LỚP thì lớp đó phải nằm trong phạm vi — không được vượt quyền bằng cách truyền classId. */
  if (classId) require_(p, PERMISSIONS.CASE_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  return {
    classId: classId ?? null,
    branchIds: classId ? null : branchIds,
    ratio: qStr(req, 'lop') === 'normal',
    fromDate: qStr(req, 'from') ?? null,
    toDate: qStr(req, 'to') ?? null,
  };
}

/** Hàng kỹ năng: mỗi hạng mục một hàng, kể cả hạng mục chưa có case nào (mục 15.1). */
api.get('/issue-board/skills', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return { rows: effectiveness.issueSkillRows(issueScopeOf(req)) };
}));

/** Bảng phân loại vấn đề của MỘT hạng mục, kèm hiệu quả theo loại phương án. */
api.get('/issue-board', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const category = qStr(req, 'category');
  if (!category) throw badRequest('Chưa chọn kỹ năng để phân tích.');
  return effectiveness.issueBoard(issueScopeOf(req), category);
}));

/** Bấm một số thì ra đúng tập bản ghi tạo nên số đó (mục 15.2). */
api.get('/issue-board/cases', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const category = qStr(req, 'category');
  if (!category) throw badRequest('Chưa chọn kỹ năng để xem chi tiết.');
  return effectiveness.issueBoardCases(issueScopeOf(req), category, qStr(req, 'code'));
}));

/**
 * PHƯƠNG ÁN CẦN BỔ SUNG ĐÁNH GIÁ (F05) — đã kết thúc nhưng chưa có kết quả xác định. Không nằm trong
 * bảng hiệu quả và không vào mẫu số, nhưng cũng không được biến mất: đây là danh sách việc cần làm.
 * Cùng bộ lọc phạm vi với bảng vừa bấm, nên số ghi ở liên kết và danh sách mở ra là một.
 */
api.get('/issue-board/needs-evaluation', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const category = qStr(req, 'category');
  if (!category) throw badRequest('Chưa chọn kỹ năng để xem chi tiết.');
  const need = effectiveness.plansNeedingEvaluation({ ...issueScopeOf(req), category });
  return { count: need.count, rows: rowsFor('phuong-an', need.ids) };
}));

api.get('/classes/:id/issue-board/needs-evaluation', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.CASE_VIEW, { classId: id }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const category = qStr(req, 'category');
  if (!category) throw badRequest('Chưa chọn kỹ năng để xem chi tiết.');
  const need = effectiveness.plansNeedingEvaluation({ classId: id, category, fromDate: qStr(req, 'from') ?? null });
  return { count: need.count, rows: rowsFor('phuong-an', need.ids) };
}));

/**
 * KHO TỆP VÀ LIÊN KẾT DÙNG CHUNG (PR-N N5). Mọi đường đều đi qua `platform/attachments.ts`, nơi kiểm quyền của BẢN GHI CHỦ
 * — không có đường nào phục vụ tệp như một đường dẫn tĩnh. Tải tệp là MỘT request riêng: form đang nhập không bị đụng tới,
 * nên lỗi tải (mạng, quá dung lượng, sai loại) chỉ hiện ở dòng tệp và nội dung đang gõ còn nguyên.
 */
const uploadOne = multer({ storage: multer.memoryStorage(), limits: { fileSize: attachmentSvc.MAX_FILE_BYTES, files: 1, fields: 8 } }).single('file');

api.get('/attachments', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return { rows: attachmentSvc.listAttachments(principalOf(req), qStr(req, 'ownerType') ?? '', qInt(req, 'ownerId') ?? 0) };
}));

api.post('/attachments/link', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attachmentSvc.addLink(principalOf(req), {
    ownerType: String(req.body?.ownerType ?? ''), ownerId: toInt(req.body?.ownerId) ?? 0,
    url: String(req.body?.url ?? ''), displayName: req.body?.displayName ?? null,
  });
}));

api.post('/attachments/file', requireAuth, (req, res, next) => {
  uploadOne(req, res, (err: unknown) => {
    if (!err) return next();
    const code = (err as { code?: string }).code;
    next(code === 'LIMIT_FILE_SIZE' ? new HttpError(413, 'Tệp quá lớn: tối đa 4 MB.') : new HttpError(400, 'Không đọc được tệp tải lên.'));
  });
}, wrap((req) => {
  maybeSimulateSaveFailure();
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw badRequest('Chưa chọn tệp.');
  /* Tên tệp trình duyệt gửi có thể bị mã hoá latin1 — đọc lại đúng UTF-8 để giữ dấu tiếng Việt. */
  const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  return attachmentSvc.addFile(principalOf(req), {
    ownerType: String(req.body?.ownerType ?? ''), ownerId: toInt(req.body?.ownerId) ?? 0,
    fileName, data: file.buffer, displayName: req.body?.displayName || null,
  });
}));

/** Tải về — kiểm quyền XEM bản ghi chủ trước, luôn dạng tải về (không bao giờ hiển thị nội dung tệp trong trang). */
api.get('/attachments/:id/download', requireAuth, wrap(async (req, res) => {
  const o = await attachmentSvc.openAttachment(principalOf(req), pInt(req, 'id'));
  if (o.kind === 'link') { res.redirect(o.url); return undefined; }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Content-Type', o.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(o.downloadName)}`);
  res.send(o.duLieu);
  return undefined;
}));

api.delete('/attachments/:id', requireAuth, wrap(async (req) => {
  maybeSimulateSaveFailure();
  await attachmentSvc.removeAttachment(principalOf(req), pInt(req, 'id'));
  return { ok: true };
}));

/**
 * Ý THỨC — VI PHẠM VÀ BIỆN PHÁP XỬ LÝ (PR-J, 21/09/2026). Module thứ chín: mọi đường đi qua `server/src/yThuc/`, nơi kiểm quyền ở MÁY
 * CHỦ (đặc tả mục 6) — giao diện chỉ ẩn nút cho gọn mắt. Không có đường nào tạo case Ý thức: mô hình đó đã bỏ.
 */
const yThucBody = (req: Request) => (req.body ?? {}) as Record<string, any>;

api.get('/students/:id/violations', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return violationSvc.listViolations(principalOf(req), {
    studentId: pInt(req, 'id'), state: (qStr(req, 'state') as any) ?? null, category: qStr(req, 'category') ?? null,
    from: qStr(req, 'from') ?? null, to: qStr(req, 'to') ?? null,
  });
}));
api.get('/students/:id/measures', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return measureSvc.listMeasures(principalOf(req), { studentId: pInt(req, 'id'), status: (qStr(req, 'status') as any) ?? null });
}));
/** Chín loại biện pháp kèm dòng nào khóa và VÌ SAO — để form nói lý do ngay tại dòng, không báo lỗi sau khi bấm. */
api.get('/students/:id/measure-kinds', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return { rows: measureSvc.measureKindAvailability(principalOf(req), pInt(req, 'id')) };
}));
api.get('/students/:id/violation-warning', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return warningSvc.studentWarning(principalOf(req), pInt(req, 'id'));
}));

/** Ba khu vực Ý thức của lớp (Y03) — một request cho cả tab. */
api.get('/classes/:id/y-thuc', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classViolationBoard(principalOf(req), pInt(req, 'id'));
}));
api.get('/classes/:id/violation-warning', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return warningSvc.classWarning(principalOf(req), pInt(req, 'id'));
}));
/** Một dòng trong Việc cần làm của GVCN (đặc tả 7.10). */
api.get('/y-thuc/my-warnings', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return { rows: warningSvc.myWarningLines(principalOf(req)) };
}));
/** Một dòng trong Việc cần làm của GVCN: lớp mình chủ nhiệm còn lượt Phối hợp SOS chưa hoàn thành (PR-K). */
api.get('/y-thuc/my-coordination', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return { rows: phoiHopSvc.myCoordinationLines(principalOf(req)) };
}));

/**
 * Cảnh báo trùng mềm (V06) — form gọi trước khi ghi để hiện "Xem vi phạm đó" / "Vẫn ghi vi phạm mới". Không chặn gì.
 * `defaultSkill` (YT-4) — môn tự điền theo phân công của người gọi ở lớp em đang học, để form điền sẵn ô Môn.
 */
api.get('/violations/similar', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const studentId = qInt(req, 'studentId') ?? 0;
  return {
    rows: violationSvc.similarViolations(p, {
      studentId, category: qStr(req, 'category') ?? '', occurredOn: qStr(req, 'occurredOn') ?? null,
    }),
    defaultSkill: violationSvc.defaultSkillFor(p, accessSvc.activeClassOf(studentId)),
  };
}));
api.post('/violations', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return violationSvc.recordViolation(principalOf(req), {
    studentId: toInt(b.studentId) ?? 0, category: b.category, description: b.description, occurredOn: b.occurredOn ?? null,
    skill: 'skill' in b ? (b.skill ?? null) : undefined, idempotencyKey: b.idempotencyKey ?? null,
  });
}));
api.get('/violations/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return violationSvc.violationDetail(principalOf(req), pInt(req, 'id'));
}));
api.patch('/violations/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return violationSvc.editViolation(principalOf(req), pInt(req, 'id'), {
    description: b.description, category: b.category, skill: 'skill' in b ? (b.skill ?? null) : undefined,
    occurredOn: 'occurredOn' in b ? (b.occurredOn ?? null) : undefined,
  });
}));
/** XOÁ THẲNG (rulebook v3, V11′–V14′): không lý do, không "đánh dấu không chính xác". Trả số biện pháp đã bị gỡ vi phạm này. */
api.delete('/violations/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return violationSvc.deleteViolation(principalOf(req), pInt(req, 'id'));
}));

api.post('/measures', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return measureSvc.createMeasure(principalOf(req), {
    studentId: toInt(b.studentId) ?? 0, kind: b.kind, customName: b.customName ?? null,
    violationIds: Array.isArray(b.violationIds) ? b.violationIds : [], ownerUserId: toInt(b.ownerUserId) ?? null,
    note: b.note ?? null, idempotencyKey: b.idempotencyKey ?? null,
  });
}));
api.get('/measures/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return measureSvc.measureDetail(principalOf(req), pInt(req, 'id'));
}));
api.patch('/measures/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return measureSvc.updateMeasure(principalOf(req), pInt(req, 'id'), {
    kind: b.kind, customName: 'customName' in b ? (b.customName ?? null) : undefined, note: 'note' in b ? (b.note ?? null) : undefined,
    ownerUserId: 'ownerUserId' in b ? (toInt(b.ownerUserId) ?? null) : undefined,
  });
}));
api.post('/measures/:id/violations', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return measureSvc.addViolations(principalOf(req), pInt(req, 'id'), Array.isArray(b.violationIds) ? b.violationIds : []);
}));
api.delete('/measures/:id/violations/:violationId', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return measureSvc.removeViolation(principalOf(req), pInt(req, 'id'), pInt(req, 'violationId'));
}));
api.post('/measures/:id/confirm', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return measureSvc.confirmMeasure(principalOf(req), pInt(req, 'id'), {
    performedOn: b.performedOn ?? null, performedBy: toInt(b.performedBy) ?? null, performerName: b.performerName ?? null,
    note: 'note' in b ? (b.note ?? '') : undefined, participants: b.participants ?? null,
  });
}));
api.delete('/measures/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  measureSvc.deleteMeasure(principalOf(req), pInt(req, 'id'));
  return { ok: true };
}));

/**
 * DRILL-DOWN DÙNG CHUNG CỦA MỌI CON SỐ (hợp đồng số liệu, PR-F). MỘT route, mọi chỉ số: nhận `id` của
 * chỉ số trong sổ và phạm vi, gọi ĐÚNG hàm đã sinh ra con số, áp CÙNG bộ quyền. Số là độ dài của tập;
 * `?rows=1` thêm dòng để vẽ danh sách. Hỏi chi nhánh ngoài quyền thì bị từ chối (403) — không trả tập
 * rút gọn; phạm vi rỗng trả rỗng, không hiểu thành toàn hệ thống.
 */
api.get('/metrics/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const r = metricSet(principalOf(req), String(req.params.id), {
    branchId: qInt(req, 'branchId'), skill: qStr(req, 'skill') ?? null,
    from: qStr(req, 'from') ?? null, to: qStr(req, 'to') ?? null, kind: qStr(req, 'kind') ?? null,
    program: chuongTrinhTuThamSo(qStr(req, 'ct')),
  });
  return metricResponse(r, qStr(req, 'rows') === '1');
}));

api.get('/classes/:id/overview', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classSvc.classOverview(principalOf(req), pInt(req, 'id'));
}));

/** Phân công giáo viên: ai đang dạy, ai xếp được, và ai đã từng dạy lớp này. */
api.get('/classes/:id/teachers', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return classSvc.classTeachers(principalOf(req), pInt(req, 'id'));
}));

/** Gửi nguyên bức tranh phân công đang hiển thị, không gửi từng thao tác thêm/bớt. */
api.put('/classes/:id/teachers', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return classSvc.setClassTeachers(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/classes', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return intakeSvc.createClass(principalOf(req), req.body ?? {});
}));

// ============================================================ Học viên & Lớp · hồ sơ lớp (PR-Qa)

/** Trang Học viên & Lớp: lớp + số đếm chip + cờ lọc từng học viên — một request cho cả trang (đặc tả §3.6). */
api.get('/hoc-vien-lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return hocVienLopSvc.danhSachHocVienLop(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, q: qStr(req, 'q') ?? null, phamVi: qStr(req, 'phamVi') ?? null,
  });
}));

/** Tab Phân tích lớp: kỹ năng × đợt, mỗi ô "số HV đạt / số HV có điểm" (đặc tả §3.7). */
api.get('/classes/:id/phan-tich-lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return phanTichLopSvc.phanTichLop(principalOf(req), pInt(req, 'id'));
}));

/** ⋮ Sửa thông tin lớp: mã lớp, LT (FT), ghi chú; chương trình chỉ khi lớp chưa có học viên và bài Test. */
api.patch('/classes/:id/thong-tin', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return thongTinLopSvc.capNhatThongTinLop(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

// ============================================================ Thêm học viên hàng loạt

/** Tách dòng từ nội dung dán ở Excel/Google Sheets. Không ghi gì vào database. */
api.post('/intake/parse', requireAuth, wrap((req) => {
  const text = String(req.body?.text ?? '');
  if (!text.trim()) throw badRequest('Chưa có nội dung để đọc.');
  return intakeSvc.parsePaste(text);
}));

/** Xem trước: soát lỗi từng ô, gợi ý trùng hồ sơ. Vẫn không ghi gì. */
api.post('/intake/preview', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  return intakeSvc.previewIntake(principalOf(req), {
    rows: b.rows ?? [],
    /* Lớp của CẢ LÔ, chọn một lần ở đầu panel (mục 12.1). */
    classId: toInt(b.classId) || toInt(b.defaultClassId) || null,
    defaultStartWeek: b.defaultStartWeek ?? null,
    dateFormat: b.dateFormat,
  });
}));

api.post('/intake/commit', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return intakeSvc.commitIntake(principalOf(req), {
    rows: b.rows ?? [],
    classId: toInt(b.classId) || toInt(b.defaultClassId) || null,
    defaultStartWeek: b.defaultStartWeek ?? null,
    dateFormat: b.dateFormat,
    skipRows: b.skipRows ?? [], idempotencyKey: b.idempotencyKey,
  });
}));

api.get('/classes/:id/suggested-weeks', requireAuth, wrap((req) => {
  const cls = db().prepare('SELECT start_date FROM classes WHERE id = ?').get(pInt(req, 'id')) as any;
  return { weeks: intakeSvc.suggestMockWeeks(cls?.start_date ?? null, qInt(req, 'count') ?? 3) };
}));

// ============================================================ Lớp thường (FOU/BE/ELE)

/** Bảng nhập điểm của lớp Normal: điểm đạt / tổng điểm, đạt từ 70%. */
api.get('/regular/classes/:classId/sheet', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return regularSvc.regularSheet(principalOf(req), pInt(req, 'classId'), qStr(req, 'kind'));
}));

/** Tạo hai bài kiểm tra của khoá theo đúng mốc TUẦN HỌC của chương trình. */
api.post('/regular/classes/:classId/plan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return regularSvc.planRegularTests(principalOf(req), pInt(req, 'classId'));
}));

/** Nhập điểm một môn (cả điểm đạt và tổng), hoặc ghi/gỡ dấu "-" (C08 — môn đó tự dời sang tuần sau). */
api.put('/regular/attempts/:id/scores/:skill', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return regularSvc.saveRegularScore(principalOf(req), pInt(req, 'id'), req.params.skill, {
    score: b.score, total: b.total, note: b.note, lyDo: b.lyDo,
    noShow: b.noShow === true ? true : b.noShow === false ? false : undefined,
  });
}));

/** Danh sách chương trình học đang dùng. */
api.get('/ref/programmes', requireAuth, wrap(() =>
  db().prepare(`SELECT code, name, weeks, scoring_mode AS scoringMode FROM programmes WHERE status='active' ORDER BY code`).all()));

// ============================================================ Lộ trình và Đánh giá GV

api.get('/students/:id/cycles', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  return cycleSvc.cyclesOf(id);
}));

api.post('/students/:id/cycles', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cycleSvc.createCycle(principalOf(req), { ...req.body, studentId: pInt(req, 'id') });
}));

/** Một lộ trình, để panel Kế hoạch học nạp đúng giá trị đang có. */
api.get('/cycles/:id', requireAuth, wrap((req) => {
  const c = cycleSvc.cycleById(pInt(req, 'id'));
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(principalOf(req), PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id },
    'Học viên này nằm ngoài phạm vi bạn được xem.');
  return c;
}));

api.patch('/cycles/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cycleSvc.updateCycle(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Điểm xuất phát của lộ trình — phải ghi rõ NGUỒN, không lấy MT1 làm điểm đầu vào. */
api.put('/cycles/:id/baseline', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cycleSvc.setBaseline(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Kết luận cuối lộ trình. Đóng lộ trình về hành chính KHÁC với đạt mục tiêu. */
api.put('/cycles/:id/outcome', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cycleSvc.setOutcome(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Đổi mục tiêu: có hiệu lực từ ngày ghi trở đi, KHÔNG chấm lại các lượt đã chốt. */
api.post('/cycles/:id/target-revision', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cycleSvc.reviseTarget(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/*
 * "GHI NHẬN NHANH CỦA GIÁO VIÊN" ĐÃ BỎ HẲN Ở VÒNG 4 — cùng với khu "Điểm chính thức".
 *
 * Owner chốt 13/09/2026: giữ thêm một đường chấm điểm chạy song song với điểm MT tạo ra hai
 * nguồn số liệu đá nhau, và đó là thứ đang làm bảng biểu lộn xộn. Giáo viên muốn ghi nhận
 * gì về một em thì bấm "+ Case" — ghi vào đó thì việc có người chịu trách nhiệm, có phương
 * án và có kết quả.
 */

// ============================================================ Lộ trình lớp và lịch MT

/** Lớp đang ở tuần thứ mấy, sắp thi gì, và đã hết chương trình chưa. */
api.get('/classes/:id/progress', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return scheduleSvc.classProgress(pInt(req, 'id'));
}));

/**
 * KẾ HOẠCH CHUYỂN TIẾP khi lớp học hết chương trình (mục 6.1) — chỉ đọc.
 * Trả về chương trình kế tiếp theo luồng mặc định, lớp đích đang có, và danh sách học viên.
 */
api.get('/classes/:id/transition', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return transitionSvc.transitionPlan(principalOf(req), pInt(req, 'id'));
}));

/** Xác nhận chuyển tiếp: mở lớp mới (nếu có) rồi chuyển từng em sang lớp đích của em. */
api.post('/classes/:id/transition', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return transitionSvc.applyTransition(principalOf(req), {
    ...(req.body ?? {}), fromClassId: pInt(req, 'id'),
  });
}));

/**
 * Đổi tuần bắt đầu và mốc kiểm tra của lớp. Quyền: Admin CN và Quản lý CN (mục 7.6).
 * Đặt mốc về trống là quay lại mốc mặc định của chương trình, không phải xoá mốc.
 */
api.patch('/classes/:id/progress', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return scheduleSvc.setClassProgress(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Lịch MT hệ thống ĐỀ XUẤT cho một lộ trình FT, tính từ tuần bắt đầu học. */
api.get('/cycles/:id/suggested-mocks', requireAuth, wrap((req) =>
  scheduleSvc.suggestedMockWeeks(pInt(req, 'id'))));

/**
 * Áp lịch đề xuất vào thực tế. KHÔNG đụng vào lượt người đã chốt tay và lượt đã làm xong —
 * đó là toàn bộ ý nghĩa của thao tác này.
 */
api.post('/cycles/:id/apply-suggested-mocks', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return scheduleSvc.applySuggestedMockWeeks(principalOf(req), pInt(req, 'id'));
}));

// ============================================================ Case học vụ

/**
 * Giáo viên báo vấn đề — KHÔNG cần chờ Mock, không tạo bài đánh giá giả.
 * `sos_level` để trống: SOS 1/2/3 là số kỹ năng dưới kỳ vọng ở một bài, ở đây chưa có bài.
 */
api.post('/cases/report', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.reportIssue(principalOf(req), req.body ?? {});
}));

/**
 * NHẬP BÙ MỘT CASE ĐÃ XỬ LÝ XONG TỪ LÂU (PR-C Task 3, mục 10.3). Xem `backfillCase` ở
 * `cases.ts` — reuse trọn vẹn `reportIssue`/`recordIntervention`/`closeCaseOutcome`, chỉ
 * khác ở những gì KHÔNG được sinh ra (bảy chốt chặn mục 10.4).
 */
api.post('/cases/backfill', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.backfillCase(principalOf(req), req.body ?? {});
}));

/*
 * TÍN HIỆU TỪ ĐIỂM (mục 6.2) — hàng riêng, KHÔNG trộn vào danh sách case.
 *
 * Một tín hiệu chưa ai xác minh không phải một vấn đề đã được xác định. Trộn hai thứ lại là
 * cách chắc chắn nhất để con số "đang có bao nhiêu vấn đề" nói quá sự thật.
 */
api.get('/signals/pending', requireAuth, wrap((req) => caseSignalSvc.listSignals(principalOf(req), {
  status: (qStr(req, 'status') as any) ?? 'open',
  branchId: qInt(req, 'branchId'),
  classId: qInt(req, 'classId'),
  studentId: qInt(req, 'studentId'),
  mine: req.query?.mine === '1',
  overdueOnly: req.query?.overdue === '1',
})));

api.get('/signals/pending/:id', requireAuth, wrap((req) =>
  caseSignalSvc.signalDetail(principalOf(req), pInt(req, 'id'))));

/** Quản lý giao tín hiệu cho người khác xác minh, khi chưa ai được phân công đúng môn. */
api.post('/signals/pending/:id/assign', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSignalSvc.assignSignal(principalOf(req), pInt(req, 'id'), toInt(req.body?.userId));
}));

/** Bỏ qua một tín hiệu lớp thường — không tạo Case, lý do không bắt buộc (S1, đặc tả §3.10). */
api.post('/signals/pending/:id/dismiss', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSignalSvc.dismissSignal(principalOf(req), pInt(req, 'id'), { reason: req.body?.reason ?? null });
}));

api.get('/cases', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return caseSvc.listCases(principalOf(req), {
    branchId: toInt(req.query?.branchId), classId: toInt(req.query?.classId),
    studentId: toInt(req.query?.studentId),
    status: qStr(req, 'status'), origin: qStr(req, 'origin'),
    skill: qStr(req, 'skill'), queue: qStr(req, 'queue'),
    classKind: qStr(req, 'classKind'),
    ownerUserId: toInt(req.query?.ownerUserId),
    noOwner: qStr(req, 'noOwner') === '1',
    /* Có `cycleId` = chỉ lộ trình đó; không có = TOÀN BỘ hành trình, kể cả lớp cũ. */
    cycleId: toInt(req.query?.cycleId),
  });
}));

/**
 * Bảng tổng hợp cho Quản lý: một hàng mỗi chi nhánh, hoặc mỗi lớp khi đã chọn chi nhánh.
 * Dùng CHUNG `listCases` với danh sách bên dưới nên số trên bảng và số dòng luôn khớp.
 */
api.get('/summary', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return summarySvc.branchSummary(principalOf(req), { branchId: qInt(req, 'branchId') });
}));

/*
 * ĐƯỜNG `/outcomes` ĐÃ BỎ cùng với bảng "Phương án & kết quả" đứng riêng (mục 15.1).
 *
 * Nó là CÁCH ĐẾM THỨ HAI cho cùng một câu hỏi "những gì đã làm có ăn thua không", chạy
 * song song với `cases/effectiveness.ts`. Hai cách đếm cho một câu hỏi thì sớm muộn cũng ra
 * hai con số, và lúc đó không ai biết tin bên nào. Nay chỉ còn một nơi sở hữu luật 15.3.
 */

/** Khối riêng của Quản lý: chi nhánh đang tắc ở đâu (theo lớp), và ai đang tắc (theo người). */
api.get('/branch-pulse', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return pulseSvc.branchPulse(principalOf(req), { branchId: qInt(req, 'branchId') });
}));

/**
 * Sự kiện nổi bật: tuần này, tuần tới, tuần nữa có gì đáng để ý (mục 3.5).
 * Đây là SỰ KIỆN sắp đến, không phải việc đang nợ — nên tách hẳn khỏi `/my-work`.
 */
api.get('/highlights', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return highlightSvc.highlights(principalOf(req), { branchId: qInt(req, 'branchId'), program: chuongTrinhTuThamSo(qStr(req, 'ct')) });
}));

// ============================================================ Tổng quan (PR-Pa, đặc tả §3.2)

/** Khối Quản lý: Cần xử lý + Điểm đáng chú ý. Mọi số đi qua `metricSet` — cùng số với `/metrics/:id`. */
api.get('/tong-quan/quan-ly', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanSvc.tongQuanQuanLy(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  });
}));

/** Khối giáo viên: Học viên cần hỗ trợ (lớp tôi dạy). */
api.get('/tong-quan/hoc-vien-can-ho-tro', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanSvc.hocVienCanHoTro(principalOf(req));
}));

/** Bảng Theo chi nhánh → lớp. Chỉ số của từng ô; danh sách ô ở route dưới. */
api.get('/tong-quan/chi-nhanh', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return bangSvc.bangChiNhanh(principalOf(req), { branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')) });
}));

/** Danh sách đúng những bản ghi tạo nên MỘT ô của bảng (G-10). */
api.get('/tong-quan/chi-nhanh/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return bangSvc.oBangChiNhanh(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
    cot: qStr(req, 'cot') ?? '', khoa: qStr(req, 'khoa') ?? '',
  });
}));

/** Lựa chọn hiển thị riêng của từng người — bộ cột đang xem, chi nhánh xem lần cuối… */
api.get('/prefs', requireAuth, wrap((req) => prefSvc.allPrefs(principalOf(req))));
api.put('/prefs/:key', requireAuth, wrap((req) => prefSvc.setPref(
  principalOf(req), String(req.params.key), req.body?.value ?? null,
)));

api.get('/cases/queues', requireAuth, wrap((req) => caseSvc.caseQueueCounts(principalOf(req), {
  branchId: toInt(req.query?.branchId), classId: toInt(req.query?.classId),
})));

api.get('/cases/:id', requireAuth, wrap((req) => caseSvc.caseDetail(principalOf(req), pInt(req, 'id'))));

/** Phân loại vấn đề: tối đa MỘT vấn đề chính, kèm yếu tố đi kèm và hoàn cảnh. */
api.put('/cases/:id/issues', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.setIssues(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Ghi một tác động. Một case có nhiều tác động. */
api.post('/cases/:id/interventions', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.recordIntervention(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/**
 * CASE TỪ SOS (rulebook v3, PR-T): GVBM đúng kỹ năng hoặc Quản lý XÁC NHẬN · THAY phương án điền sẵn, hoặc đóng ngay `Không cần theo dõi` kèm lý do
 * chọn nhanh. Quyền kiểm ở máy chủ theo ĐÚNG kỹ năng của case (C02).
 */
api.post('/interventions/:id/confirm', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = (req.body ?? {}) as Record<string, any>;
  return sosAutoSvc.confirmPresetPlan(principalOf(req), pInt(req, 'id'), {
    description: 'description' in b ? (b.description ?? null) : undefined, followupDue: 'followupDue' in b ? (b.followupDue ?? null) : undefined,
    reason: typeof b.reason === 'string' ? b.reason : undefined,
  });
}));
api.post('/interventions/:id/replace', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.replacePresetPlan(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
api.post('/cases/:id/dismiss', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.dismissSosCase(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));

/**
 * PHỐI HỢP SOS (rulebook v3, PR-T) — việc của GVCN sau một lượt Mock có SOS. Xem: mọi giáo viên dạy lớp; thêm / xác nhận / bỏ: GVCN của lớp em đang học và
 * Quản lý (P04). Kiểm ở máy chủ.
 */
api.get('/classes/:id/phoi-hop-sos', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return phoiHopSvc.coordinationOfClass(principalOf(req), pInt(req, 'id'), { includeDone: qStr(req, 'includeDone') === '1' });
}));
api.get('/students/:id/phoi-hop-sos', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return phoiHopSvc.coordinationOfStudent(principalOf(req), pInt(req, 'id'));
}));
api.post('/attempts/:id/phoi-hop-sos', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = (req.body ?? {}) as Record<string, any>;
  return phoiHopSvc.addCoordination(principalOf(req), pInt(req, 'id'), { kind: b.kind, customName: b.customName ?? null });
}));
api.post('/phoi-hop-sos/:id/confirm', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = (req.body ?? {}) as Record<string, any>;
  return phoiHopSvc.confirmCoordination(principalOf(req), pInt(req, 'id'), {
    performedOn: b.performedOn ?? null, note: b.note ?? null, performerName: b.performerName ?? null,
  });
}));
api.post('/phoi-hop-sos/:id/remove', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = (req.body ?? {}) as Record<string, any>;
  return phoiHopSvc.removeCoordination(principalOf(req), pInt(req, 'id'), { reasonCode: b.reasonCode ?? null, reasonText: b.reasonText ?? null });
}));

/**
 * Quản lý trả lời một phương án đang chờ duyệt: duyệt / không duyệt / góp ý.
 * Góp ý KHÔNG kết thúc việc chờ — Quản lý vẫn nợ một câu trả lời.
 */
api.post('/interventions/:id/respond', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.respondToPlan(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/**
 * CẬP NHẬT KẾT QUẢ — một thao tác duy nhất khép lại một chu kỳ xử lý (mục 7.7 [3], 7.9).
 *
 * Gộp ba nút cũ: "Đánh dấu đã làm" · "Ghi quan sát" · "Hướng xử lý". Payload hỏi đúng ba
 * câu: kết quả ra sao, ghi chú, và bước tiếp theo là gì.
 */
api.post('/interventions/:id/result', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.updateResult(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/**
 * Đánh dấu một phương án ĐÃ LÀM XONG kèm ngày thực hiện.
 *
 * Chỉ còn dùng cho việc TRAO ĐỔI (gặp em, gọi phụ huynh) — những việc không có kết quả
 * chuyên môn để ghi, chỉ cần xác nhận đã diễn ra. Phương án học thuật đi qua
 * `/interventions/:id/result`.
 */
api.post('/interventions/:id/complete', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.completeIntervention(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/**
 * CHỐT KẾT QUẢ CẢ CASE — chỉ mở khi mọi phương án đã có kết quả.
 * `decision` là 'end' (kết thúc hẳn) hoặc 'extend' (kéo dài theo dõi + thêm phương án).
 */
api.post('/cases/:id/outcome', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.closeCaseOutcome(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Đổi hạn BÁO KẾT QUẢ của case. Mặc định hết tuần MT kế tiếp, nhưng sửa được. */
api.patch('/cases/:id/follow-until', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.setFollowUntil(principalOf(req), pInt(req, 'id'), req.body?.date ?? null);
}));

/**
 * BẢNG THEO DÕI HỖ TRỢ THEO KỸ NĂNG của một học viên — sáu hạng mục, luôn đủ sáu dòng.
 * Đây là phần giữa của hồ sơ học viên.
 */
api.get('/students/:id/skill-board', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return caseSvc.skillSupportBoard(principalOf(req), pInt(req, 'id'), qInt(req, 'cycleId'));
}));

/** Chủ đề Case mở được cho một học viên (F07) — form đọc route này thay vì tự đoán chương trình. */
api.get('/students/:id/case-topics', requireAuth, wrap((req) =>
  caseSvc.caseTopicsOf(principalOf(req), pInt(req, 'id'), qInt(req, 'cycleId'))));

/** Ghi một lần xem lại sau hỗ trợ. Một tác động có thể xem lại nhiều lần. */
api.post('/cases/:id/followups', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.recordFollowUp(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/*
 * ĐƯỜNG "HƯỚNG XỬ LÝ" ĐÃ BỎ (mục 9.3).
 *
 * Case chỉ còn MỘT đường kết thúc: nút "Hoàn thành case" → POST /cases/:id/outcome. Giữ hai
 * đường đóng song song là giữ hai dấu vết khác nhau cho cùng một việc, và sớm muộn sẽ có
 * case đóng được ở đường này mà màn hình ở đường kia bảo là chưa đóng được.
 *
 * Bản ghi cũ vẫn đọc được hướng xử lý của mình; chỉ không sửa qua đường riêng nữa.
 */

api.put('/cases/:id/owner', requireAuth, wrap((req) => {
  const raw = (req.body ?? {}).ownerUserId;
  return caseSvc.setCaseOwner(principalOf(req), pInt(req, 'id'),
    raw === null || raw === undefined || raw === '' ? null : Number(raw));
}));

/** Bộ phân loại vấn đề để dựng ô chọn. Dữ liệu, không viết cứng trong giao diện. */
api.get('/ref/issue-taxonomy', requireAuth, wrap(() => ({
  /** Chủ đề của case = kỹ năng nhập điểm — dựng ô chọn từ dữ liệu, không viết cứng trong giao diện. */
  topics: ENTRY_SKILLS.map((k) => ({ key: k, label: ENTRY_SKILL_LABEL[k] })),
  /** Phân loại NGUYÊN NHÂN. W1 và W2 dùng chung bộ Writing. */
  branches: ISSUE_TAXONOMY,
})));

// ============================================================ Liên hệ với HS và phụ huynh

/*
 * BA ENDPOINT LIÊN HỆ ĐÃ BỎ Ở VÒNG 4.
 *
 * Hai việc trao đổi nay là hai PHƯƠNG ÁN của case Ý thức/Khác, nên chúng đi chung đường với
 * mọi phương án khác: `POST /cases/:id/interventions` để thêm, `POST /interventions/:id` để
 * đánh dấu đã làm. Ít hơn ba đường, và không còn chỗ nào phải cộng hai nguồn lại.
 */

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

/**
 * HỒ SƠ HỌC VIÊN theo ĐÚNG MỘT LỘ TRÌNH.
 *
 * `cycleId` gửi tường minh; không có thì lấy lộ trình đang chạy. Không bao giờ trộn dữ
 * liệu hai lộ trình vào một khung nhìn, vì mục tiêu và thang điểm của chúng khác nhau.
 */
api.get('/students/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return profileSvc.studentProfile(principalOf(req), pInt(req, 'id'), qInt(req, 'cycleId'));
}));

api.patch('/students/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.updateStudent(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/students/:id/transfer', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const { toClassId, effectiveDate, reasonCode, reasonNote, handoverNote, noHandoverNote, receiverUserId } = req.body ?? {};
  if (!toClassId) throw badRequest('Cần chọn lớp đích.');
  /* RB-3: lý do chọn nhanh BẮT BUỘC; "Khác" phải ghi rõ. */
  const reason = transferReasonText(reasonCode, reasonNote);
  if (!reason) throw badRequest('Chọn lý do chuyển lớp (chọn "Khác" thì ghi rõ).');
  return studentSvc.transferStudent(principalOf(req), pInt(req, 'id'), Number(toClassId),
    effectiveDate ?? demoToday(), reason, {
      note: handoverNote ?? null,
      noNote: noHandoverNote === true,
      receiverUserId: receiverUserId ? Number(receiverUserId) : null,
    });
}));

/** Những thứ còn dở của một em — để màn chuyển lớp bày sẵn, người chuyển không phải chép tay. */
api.get('/students/:id/handover', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  return studentSvc.handoverBrief(id);
}));

api.post('/students/:id/status', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const status = req.body?.status;
  if (!['active', 'inactive', 'finished'].includes(status)) throw badRequest('Trạng thái không hợp lệ.');
  return studentSvc.setStudentStatus(principalOf(req), pInt(req, 'id'), status,
    req.body?.date ?? demoToday(), req.body?.reason);
}));

/** RB-9: lưu trữ / bỏ lưu trữ — chỉ Quản lý, chỉ em đã kết thúc học. Không có tác vụ ngầm. */
api.post('/students/:id/archive', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.archiveStudent(principalOf(req), pInt(req, 'id'));
}));
api.post('/students/:id/unarchive', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.unarchiveStudent(principalOf(req), pInt(req, 'id'));
}));

// ============================================================ Họp tuần

api.get('/meeting/board', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const periodId = qInt(req, 'periodId') ?? ensurePeriod(demoToday()).id;
  /* `month=YYYY-MM` đọc cả tháng; không có thì đọc đúng tuần đang chọn (mục 14.2). */
  const month = qStr(req, 'month');
  const board = meetingSvc.meetingBoard(principalOf(req), periodId, { month }) as any;
  const period = periodById(periodId);
  // Giao diện phải biết tuần này có đang mở để cập nhật không, và nếu không thì vì sao.
  return {
    ...board,
    editWindow: month
      ? { open: false, reason: 'Kỳ tháng chỉ để đọc — nhận định thuộc về tuần người ta viết nó.', opensOn: '' }
      : (period ? reportEditWindow(period) : null),
  };
}));

/**
 * Quản trị hệ thống mở lại một tuần báo cáo đã khoá.
 * Đây là ngoại lệ, nên chỉ một vai trò được làm và có ghi nhật ký.
 */
api.post('/meeting/periods/:periodId/unlock', requireAuth, wrap((req) => {
  const p = principalOf(req);
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true },
    'Chỉ Quản trị hệ thống mới mở lại được tuần báo cáo đã khoá.');
  const periodId = pInt(req, 'periodId');
  const on = req.body?.unlocked !== false;
  setPeriodUnlocked(periodId, on, p.userId);
  writeAudit({
    actorUserId: p.userId, action: on ? 'report.unlock' : 'report.relock',
    entityType: 'report_period', entityId: periodId,
    entityLabel: periodById(periodId)?.code ?? String(periodId),
    after: { unlocked: on },
  });
  const period = periodById(periodId);
  return period ? reportEditWindow(period) : { open: false };
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

// ============================================================ Tiến độ công việc (mục 8)

api.get('/mgmt-tasks', requireAuth, wrap((req) => mgmtSvc.listMgmtTasks(principalOf(req), {
  branchId: qInt(req, 'branchId'),
  group: qStr(req, 'group'),
  progress: qStr(req, 'progress'),
  assigneeUserId: qInt(req, 'assigneeUserId'),
  periodId: qInt(req, 'periodId'),
})));

/** Việc được giao cho chính người đang xem — hiện ở Toàn cảnh, không cần mở tab quản lý. */
api.get('/mgmt-tasks/mine', requireAuth, wrap((req) => mgmtSvc.myMgmtTasks(principalOf(req))));

api.get('/mgmt-tasks/:id', requireAuth, wrap((req) =>
  mgmtSvc.mgmtTaskDetail(principalOf(req), pInt(req, 'id'))));

api.post('/mgmt-tasks', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return mgmtSvc.createMgmtTask(principalOf(req), {
    title: String(b.title ?? ''), group: String(b.group ?? ''),
    branchId: b.branchId ? Number(b.branchId) : null,
    assigneeUserId: b.assigneeUserId ? Number(b.assigneeUserId) : null,
    watcherUserId: b.watcherUserId ? Number(b.watcherUserId) : null,
    due: b.due ?? null, note: b.note ?? null,
    parentTaskId: b.parentTaskId ? Number(b.parentTaskId) : null,
    caseIds: Array.isArray(b.caseIds) ? b.caseIds.map(Number) : [],
  });
}));

api.post('/mgmt-tasks/:id/update', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return mgmtSvc.updateMgmtTask(principalOf(req), pInt(req, 'id'), {
    progress: String(b.progress ?? ''), note: b.note ?? null, reason: b.reason ?? null,
    on: b.on ?? null, reviewOn: b.reviewOn ?? null,
  });
}));

api.patch('/mgmt-tasks/:id', requireAuth, wrap((req) =>
  mgmtSvc.editMgmtTask(principalOf(req), pInt(req, 'id'), req.body ?? {})));

// ============================================================ Quản trị (lối phụ)

api.put('/admin/role-permissions', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  return sysconfigSvc.setRolePermission(principalOf(req), {
    roleKey: String(b.roleKey ?? ''),
    permissionKey: String(b.permissionKey ?? ''),
    granted: !!b.granted,
  });
}));

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
      milestones: (conn.prepare('SELECT COUNT(*) AS n FROM case_milestones').get() as any).n,
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

// ==================================================================== tài khoản (vòng 4 phase 4)

/**
 * ĐĂNG NHẬP THẬT — email + mật khẩu (mục 7.1).
 *
 * Bản demo vẫn giữ nút "Đổi tài khoản demo" ở thanh trên: đó là công cụ để owner xem nhanh
 * cùng một màn hình bằng bốn con mắt khác nhau, và bỏ nó đi thì mỗi lần đổi vai phải gõ lại
 * mật khẩu. Hai đường cùng dẫn tới một `demo_sessions`, nên không có hai cơ chế phiên.
 */
api.post('/auth/login', wrap((req, res) => {
  /*
   * AN-1 (PR-AN): khoá theo email VÀ theo IP, kiểm TRƯỚC khi so mật khẩu — đang khoá thì mật khẩu đúng cũng không vào.
   * Chỉ lần sai mật khẩu/email (400) mới được đếm; tài khoản chờ duyệt/bị từ chối (403) là đúng mật khẩu, không đếm.
   */
  const email = accountSvc.normalizeEmail(String(req.body?.email ?? ''));
  const ip = gioiHan.ipCua(req);
  gioiHan.chanNeuBiKhoa('dang_nhap_email', email, gioiHan.cauKhoaDangNhap);
  gioiHan.chanNeuBiKhoa('dang_nhap_ip', ip, gioiHan.cauKhoaDangNhap);
  let r: accountSvc.LoginResult;
  try {
    r = accountSvc.login(email, String(req.body?.password ?? ''));
  } catch (e) {
    if (e instanceof HttpError && e.status === 400) {
      gioiHan.ghiLanThu('dang_nhap_email', email);
      gioiHan.ghiLanThu('dang_nhap_ip', ip);
    }
    throw e;
  }
  gioiHan.xoaLanThu('dang_nhap_email', email);
  if (req.sessionToken) destroySession(req.sessionToken);
  const token = createSession(r.userId);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', secure: laBanChinh() });
  return { ok: true, userId: r.userId, fullName: r.fullName };
}));

api.post('/auth/register', wrap((req) => {
  /* AN-1: mọi lần gửi đăng ký đều đếm theo IP (kể cả lần hỏng) — chặn tạo hàng loạt tài khoản chờ duyệt. */
  const ip = gioiHan.ipCua(req);
  gioiHan.chanNeuBiKhoa('dang_ky_ip', ip, gioiHan.cauKhoaDangKy);
  gioiHan.ghiLanThu('dang_ky_ip', ip);
  const b = req.body ?? {};
  const r = accountSvc.register({
    email: String(b.email ?? ''), password: String(b.password ?? ''), fullName: String(b.fullName ?? ''),
    phone: b.phone ?? null, branches: Array.isArray(b.branches) ? b.branches : [],
    note: b.note ?? null, skills: Array.isArray(b.skills) ? b.skills : [],
  });
  return { ...r, pending: true };
}));

/** Ô chọn chi nhánh trên màn đăng ký — chưa đăng nhập nên không đi qua `requireAuth`. */
api.get('/auth/branches', wrap(() => {
  if (!isInitialised()) throw new HttpError(503, 'Chưa có dữ liệu demo trong máy.', { needsSeed: true });
  return db().prepare("SELECT code, name FROM branches WHERE status='active' ORDER BY id").all();
}));

/** Thông tin cần cho màn đăng nhập: đuôi email bắt buộc và tài khoản mặc định của bản demo. */
api.get('/auth/info', wrap(() => ({
  emailSuffix: accountSvc.EMAIL_SUFFIX,
  /* Bản chính: không bao giờ gửi mật khẩu mặc định ra ngoài. */
  ...(laBanChinh() ? {} : { demoAdmin: { email: accountSvc.DEFAULT_ADMIN_EMAIL, password: accountSvc.DEFAULT_ADMIN_PASSWORD } }),
  /* Gộp hai bộ kỹ năng và BỎ TRÙNG: Listening có ở cả hai, hiện hai lần là một lỗi nhìn thấy ngay. */
  skills: [...new Set([...ENTRY_SKILLS, ...REGULAR_SKILLS])],
})));

api.get('/me/profile', requireAuth, wrap((req) => accountSvc.myProfile(principalOf(req))));
api.patch('/me/profile', requireAuth, wrap((req) => accountSvc.updateProfile(principalOf(req), req.body ?? {})));

api.get('/admin/accounts', requireAuth, wrap((req) => ({
  rows: accountSvc.listAccounts(principalOf(req)),
  pending: accountSvc.pendingQueue(principalOf(req)),
})));
api.post('/admin/accounts', requireAuth, wrap((req) => accountSvc.createAccount(principalOf(req), req.body ?? {})));
api.post('/admin/accounts/:id/approve', requireAuth, wrap((req) => accountSvc.approve(
  principalOf(req), Number(req.params.id), req.body ?? {},
)));
api.post('/admin/accounts/:id/decline', requireAuth, wrap((req) => accountSvc.decline(
  principalOf(req), Number(req.params.id), String(req.body?.reason ?? ''),
)));
api.put('/admin/accounts/:id/roles', requireAuth, wrap((req) => accountSvc.setRoles(
  principalOf(req), Number(req.params.id), Array.isArray(req.body?.roles) ? req.body.roles : [],
)));
api.put('/admin/accounts/:id/permissions', requireAuth, wrap((req) => accountSvc.setUserPermissions(
  principalOf(req), Number(req.params.id), Array.isArray(req.body?.items) ? req.body.items : [],
)));
api.post('/admin/accounts/:id/password', requireAuth, wrap((req) => accountSvc.resetPassword(
  principalOf(req), Number(req.params.id), String(req.body?.password ?? ''),
)));

/** Lộ trình và loại lớp — nay là dữ liệu, Quản trị hệ thống sửa được (mục 7.3). */
api.get('/ref/routes', wrap(() => sysconfigSvc.listRoutes()));
api.get('/admin/routes', requireAuth, wrap((req) => {
  principalOf(req);
  return sysconfigSvc.listRoutes(true);
}));
api.put('/admin/routes', requireAuth, wrap((req) => sysconfigSvc.saveRoute(principalOf(req), req.body ?? {})));
api.get('/admin/programmes', requireAuth, wrap((req) => sysconfigSvc.listProgrammes(principalOf(req))));
api.put('/admin/programmes', requireAuth, wrap((req) => sysconfigSvc.saveProgramme(principalOf(req), req.body ?? {})));
