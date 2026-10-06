import { Router, type Request } from 'express';
import multer from 'multer';
import { db, isInitialised } from '../db.ts';
import { laBanChinh } from '../moiTruong.ts';
import {
  ENTRY_SKILLS, THEO_DONG, tenMonNgan, canNamGan, docBoLocXuatMt, kiemGhiRoKhac, laKhac, soSanhLop, transferReasonText,
  PERMISSIONS, ROLE_LABEL, WORK_SCOPES, chuongTrinhTuThamSo, ctTuyChon, khoangTuThamSo, thamSoNguoi, tuDauKhoang,
  type Role, type TheoDong, type WorkScope,
} from '../../../shared/domain/index.ts';
import { demoToday, getConfig, scenarioMode, setConfig } from '../demoConfig.ts';
import { HttpError, badRequest, chuTuDo, forbidden, isIsoDate, notFound, toInt } from '../util.ts';
import { SESSION_COOKIE, createSession, destroySession, principalOf, requireAuth } from '../auth.ts';
import { can, loadPrincipal, permissionSummary, require_, scopeFor } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { navOf } from '../platform/nav.ts';
import * as attachmentSvc from '../platform/attachments.ts';
import * as timNguoiSvc from '../platform/timNguoi.ts';
import * as violationSvc from '../yThuc/violations.ts';
import * as accessSvc from '../yThuc/access.ts';
import * as xuLySvc from '../yThuc/xuLy.ts';
import * as phoiHopSvc from '../yThuc/phoiHop.ts';
import * as sosAutoSvc from '../cases/sosAuto.ts';
import * as boTroSvc from '../cases/boTro.ts';
import { bangYThucLop } from '../yThuc/board.ts';
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
import * as ketQuaHuySvc from '../fasttrack/ketQuaHuy.ts';
import * as effectiveness from '../cases/effectiveness.ts';
import * as cycleSvc from '../fasttrack/cycles.ts';
import * as thiThatSvc from '../loTrinh/thiThat.ts';
import * as tongKetSvc from '../loTrinh/tongKet.ts';
import * as profileSvc from '../students/profile.ts';
import { hanhTrinhHocVien } from '../students/hanhTrinh.ts';
import { docHet, thongBaoCua } from '../platform/thongBao.ts';
import * as yeuCauSvc from '../duyet/yeuCau.ts';
import * as deXuatSuaSvc from '../duyet/deXuatSua.ts';
import * as classSvc from '../classes/classes.ts';
import * as scheduleSvc from '../classes/schedule.ts';
import * as intakeSvc from '../classes/intake.ts';
import * as transitionSvc from '../classes/transition.ts';
import * as lenhSvc from '../classes/lenhChuyen.ts';
import * as banGiaoSvc from '../classes/banGiao.ts';
import * as loTrinhTiepSvc from '../classes/loTrinhTiep.ts';
import * as cuoiKhoaSvc from '../normal/cuoiKhoa.ts';
import * as luatLoTrinhSvc from '../classes/luatLoTrinh.ts';
import * as hocVienLopSvc from '../classes/hocVienLop.ts';
import * as luuTruSvc from '../classes/luuTru.ts';
import * as phanTichLopSvc from '../classes/phanTichLop.ts';
import { canHoTroLop } from '../classes/canHoTro.ts';
import * as thongTinLopSvc from '../classes/thongTinLop.ts';
import * as xoaKetThucLopSvc from '../classes/xoaKetThucLop.ts';
import * as suaCaLopSvc from '../classes/suaCaLop.ts';
import * as xoaHocVienSvc from '../students/xoaHocVien.ts';
import * as xoaTaiKhoanSvc from '../platform/xoaTaiKhoan.ts';
import * as studentSvc from '../students/students.ts';
import * as hangLoatSvc from '../students/hangLoat.ts';
import * as meetingSvc from '../worklist/meeting.ts';
import {
  PERIOD_WINDOW_PLANNING_FORWARD_WEEKS,
  ensurePeriod, listPeriods, periodById, periodWindow, reportEditWindow, setPeriodUnlocked,
} from '../platform/week.ts';
import * as keHoachSvc from '../keHoach/keHoachTest.ts';
import { signalsFor } from '../worklist/signals.ts';
import * as accountSvc from '../platform/accounts.ts';
import * as gioiHan from '../platform/gioiHanThu.ts';
import * as sysconfigSvc from '../platform/sysconfig.ts';
import * as mgmtSvc from '../worklist/mgmttasks.ts';
import * as highlightSvc from '../worklist/highlights.ts';
import * as tongQuanSvc from '../worklist/tongQuan.ts';
import * as bangSvc from '../worklist/bangChiNhanh.ts';
import * as tongHopSvc from '../phanTich/tongHop.ts';
import * as xuatMtSvc from '../phanTich/xuatMt.ts';
import * as vanDeHvSvc from '../phanTich/vanDeHv.ts';
import * as hieuQuaPaSvc from '../phanTich/hieuQuaPa.ts';
import * as yThucPhanTichSvc from '../phanTich/yThucPhanTich.ts';
import * as giaoVienPtSvc from '../phanTich/giaoVien.ts';
import { khungPtGvTuThamSo } from '../../../shared/domain/index.ts';   // PR-Pb2-b: dòng riêng (Hợp đồng a↔b — không sửa import chung)
import { metricResponse, metricSet, rowsFor } from '../worklist/metrics.ts';
import { myWork, viecCuaNguoi } from '../worklist/mywork.ts';
import { bangGvChiNhanh, hoSoGiaoVien, ketQuaHoSoGv, oHoSoGv, viecHoSoGv } from '../giaoVien/hoSo.ts';
import { nhacViec } from '../worklist/nhacViec.ts';
import * as caseSvc from '../cases/cases.ts';
import * as regularSvc from '../normal/regular.ts';
import * as chamSvc from '../cham/canCham.ts';
import * as diemTheoLuotSvc from '../cham/diemTheoLuot.ts';

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
  /* PR-TD: một câu IN cho mọi mã lớp của phân công, thay vì một câu mỗi phân công. */
  const maLopCua = new Map<number, string>();
  const ctLopCua = new Map<number, string | null>();
  const lopIds = [...new Set(p.assignments.map((a) => a.classId))];
  if (lopIds.length) {
    for (const r of conn
      .prepare(`SELECT id, code, programme_code FROM classes WHERE id IN (${lopIds.map(() => '?').join(',')})`)
      .all(...lopIds) as any[]) {
      maLopCua.set(r.id, r.code);
      ctLopCua.set(r.id, r.programme_code ?? null);
    }
  }
  return {
    authenticated: true,
    user: { id: p.userId, code: p.code, fullName: p.fullName, title: p.title },
    roles: p.roleKeys,
    roleLabels: p.roleKeys.map((r) => ROLE_LABEL[r as Role] ?? r),
    grants: permissionSummary(p),
    assignments: p.assignments.map((a) => (
      { classId: a.classId, classCode: maLopCua.get(a.classId) ?? null, skill: a.skill, isCore: a.isCore,
        /* K1-45: tên môn theo chương trình lớp, dựng sẵn (FOU "G+V"). */
        nhanMon: a.skill ? tenMonNgan(ctLopCua.get(a.classId) ?? null, a.skill) : null }
    )),
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
    /* PR-NV (T9): chi nhánh mặc định của ô chi nhánh khi người xem chưa tự chọn (null = Tất cả). */
    chiNhanhGoiY: hocVienLopSvc.goiYChiNhanh(p, demoToday()),
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
  const all = db().prepare("SELECT id, code, name FROM branches WHERE status='active' ORDER BY id").all() as any[];
  /* PR-QU (B): panel "+ Lớp mới" chỉ bày chi nhánh người này có `class.create`. */
  if (req.query.muc === 'tao-lop') {
    const duoc = new Set(hocVienLopSvc.chiNhanhTaoLop(p));
    return all.filter((b) => duoc.has(b.id));
  }
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
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
  rows.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));
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
  /* PR-DEPLOY (0b-1): mọi vai đều dùng bộ chọn tuần nên không đòi quyền ghi; chặn ngày ngoài ±3 năm để không ai ghi được `report_periods` rác (0001-01-01, 9999-12-27). */
  const tran = canNamGan(demoToday());
  if (weekStart < tran.toiThieu || weekStart > tran.toiDa) throw badRequest('Ngày nằm ngoài khoảng ba năm quanh hôm nay.');
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
    cungChiNhanh: qStr(req, 'cungChiNhanh') === '1',
  });
}));

api.get('/ref/users', requireAuth, wrap((req) => {
  const p = principalOf(req);
  if (!can(p, PERMISSIONS.MEETING_EDIT, { anyScope: true }) && !can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })) {
    return db().prepare('SELECT id, code, full_name AS fullName, title FROM users WHERE id = ?').all(p.userId);
  }
  /* PR-Dọn (quét #9): ngoài Quản trị (toàn hệ thống), chỉ người có vai đang hoạt động ở chi nhánh mình quản (cộng chính mình). */
  const scope = scopeFor(p, PERMISSIONS.MEETING_EDIT);
  if (scope.all || can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })) {
    return db().prepare("SELECT id, code, full_name AS fullName, title FROM users WHERE status='active' ORDER BY full_name").all();
  }
  const cn = scope.branchIds.length ? scope.branchIds : [-1];
  return db()
    .prepare(
      `SELECT id, code, full_name AS fullName, title FROM users u WHERE status='active'
         AND (u.id = ? OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.status = 'active'
                                   AND ur.branch_id IN (${cn.map(() => '?').join(',')})))
        ORDER BY full_name`,
    )
    .all(p.userId, ...cn);
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
api.get('/ref/teachers', requireAuth, wrap((req) =>
  classSvc.giaoVienPhanCong(principalOf(req), { branchId: qInt(req, 'branchId'), classId: qInt(req, 'classId') })));

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
/**
 * PR-Ra Q1–Q2: `?nguoi=` chọn góc nhìn — `toi` (mặc định) · `tat-ca` (Quản lý/Quản trị, Q1) ·
 * một ID giáo viên cụ thể (Q2, "Chọn giáo viên…"). Chuỗi lạ bị `thamSoNguoi` bỏ qua, coi như
 * không gửi — không báo lỗi cho một tham số hỏng, giữ đúng quy ước "phạm vi trên đường dẫn".
 */
api.get('/my-work', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  lenhSvc.quetLenhDenHan();   // PR-CT: quyết định chuyển lớp tới Thứ Hai thì thi hành (chạy lặp an toàn)
  const p = principalOf(req);
  const branchId = qInt(req, 'branchId');
  const nguoi = thamSoNguoi(qStr(req, 'nguoi'));

  if (nguoi === 'tat-ca') {
    if (!can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) throw forbidden('Bạn chỉ xem được việc của mình.');
    return myWork(p, { branchId, nguoi: 'tat-ca' });
  }
  if (typeof nguoi === 'number') return viecCuaNguoi(p, nguoi, branchId);

  return myWork(p, { branchId });
}));

/* PR-S6F-b (D14): `/my-work/dem` đã bỏ — badge GV đọc `summary.overdue` của chính `/my-work` (web gộp GET đang bay, không tính `myWork` hai lần). */

api.post('/my-work/nhac', requireAuth, wrap((req) => {
  const key = String(req.body?.key ?? '');
  const ownerId = toInt(req.body?.ownerId);
  if (!key || !ownerId) throw badRequest('Thiếu key hoặc ownerId.');
  return nhacViec(principalOf(req), { key, ownerId });
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
 * CÁC ĐƯỜNG DẪN CỐ ĐỊNH (`/attempts/xyz`) PHẢI ĐỨNG TRƯỚC `/attempts/:id`.
 * Express khớp theo thứ tự khai báo, nên đặt sau thì `:id` sẽ nuốt luôn chữ cố định —
 * request đi vào hàm chi tiết với một id không phải số.
 */

api.get('/attempts/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return attemptSvc.attemptDetail(principalOf(req), pInt(req, 'id'));
}));

// -------------------------------------------------------------- PR-Rc2: Kế hoạch Test

api.get('/ke-hoach-test/lop', requireAuth, wrap((req) =>
  keHoachSvc.danhSachLop(principalOf(req), { branchId: toInt(req.query?.branchId) })));

api.get('/ke-hoach-test/ft/:classId', requireAuth, wrap((req) =>
  keHoachSvc.luoiFT(principalOf(req), pInt(req, 'classId'))));

/** Đọc object tuần `{ listening: periodId, … }` — từng giá trị qua `toInt`, kỹ năng lạ bị bỏ. */
function tuanTheoKyNang(v: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (!v || typeof v !== 'object') return out;
  for (const k of ['listening', 'reading', 'writing', 'speaking', 'tong_hop']) {   // tong_hop: Pre FOU (PF6)
    const n = toInt(v[k]);
    if (n) out[k] = n;
  }
  return out;
}

api.post('/ke-hoach-test/dot/kiem', requireAuth, wrap((req) => {
  const attemptId = toInt(req.body?.attemptId);
  if (!attemptId || !Array.isArray(req.body?.kyNang)) throw badRequest('Thiếu đợt hoặc kỹ năng cần kiểm.');
  const kyNang = req.body.kyNang.map((k: any) => ({ skill: String(k?.skill ?? ''), periodId: toInt(k?.periodId) }));
  if (kyNang.some((k: any) => !k.periodId)) throw badRequest('Thiếu tuần của một kỹ năng.');
  return keHoachSvc.kiemDot(principalOf(req), { attemptId, kyNang });
}));

api.post('/ke-hoach-test/dot', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const attemptId = toInt(req.body?.attemptId);
  if (!attemptId || !Array.isArray(req.body?.kyNang)) throw badRequest('Thiếu đợt hoặc kỹ năng cần đặt.');
  const kyNang = req.body.kyNang.map((k: any) => ({
    skill: String(k?.skill ?? ''), periodId: toInt(k?.periodId), bo: typeof k?.bo === 'boolean' ? k.bo : undefined,
  }));
  return keHoachSvc.luuDot(principalOf(req), {
    attemptId, kyNang, lyDoBo: req.body.lyDoBo ?? null, force: !!req.body.force, reason: req.body.reason ?? null,
    xacNhanHuyLich: req.body.xacNhanHuyLich === true,
  });
}));

api.post('/ke-hoach-test/xep-moi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const studentId = toInt(req.body?.studentId);
  if (!studentId) throw badRequest('Thiếu học viên.');
  const tuan = tuanTheoKyNang(req.body?.tuan);
  if (req.body?.kind) {
    const classId = toInt(req.body?.classId);
    if (!classId) throw badRequest('Thiếu lớp.');
    return keHoachSvc.xepMoiThuong(principalOf(req), { classId, studentId, kind: req.body.kind, tuan, force: !!req.body.force });
  }
  return keHoachSvc.xepMoi(principalOf(req), {
    studentId, attemptNo: toInt(req.body?.attemptNo) ?? undefined, tuan, bo: Array.isArray(req.body?.bo) ? req.body.bo : [],
    lyDoBo: req.body?.lyDoBo ?? null, force: !!req.body?.force,
  });
}));

api.post('/ke-hoach-test/hang-loat', requireAuth, wrap((req) => {
  if (!req.body?.xemTruoc) maybeSimulateSaveFailure();
  const classId = toInt(req.body?.classId);
  if (!classId) throw badRequest('Thiếu lớp.');
  return keHoachSvc.xepHangLoat(principalOf(req), {
    classId, attemptNo: toInt(req.body?.attemptNo) ?? undefined, kind: req.body?.kind || undefined,
    studentIds: Array.isArray(req.body?.studentIds) ? req.body.studentIds.map((x: any) => toInt(x)).filter(Boolean) : [],
    tuan: tuanTheoKyNang(req.body?.tuan), force: !!req.body?.force, xemTruoc: !!req.body?.xemTruoc,
    /* PR-XLMT (K4-17, T37): đợt riêng từng em (Quản lý bấm chip), kỹ năng cho thi lại, lý do. */
    dotTheoEm: req.body?.dotTheoEm && typeof req.body.dotTheoEm === 'object' ? req.body.dotTheoEm : undefined,
    thiLai: req.body?.thiLai && typeof req.body.thiLai === 'object' ? req.body.thiLai : undefined,
    lyDo: typeof req.body?.lyDo === 'string' ? req.body.lyDo : null,
    xacNhanHuyLich: req.body?.xacNhanHuyLich === true,   // T2 (PR-MTa): popup gộp dời vượt đã xác nhận
  });
}));

api.get('/ke-hoach-test/thuong/:classId', requireAuth, wrap((req) =>
  keHoachSvc.luoiThuong(principalOf(req), pInt(req, 'classId'))));

/*
 * PHÂN TÍCH (PR-Pb, §3.3; PR-UX4) — Tổng hợp Test + SOS, Tổng hợp vấn đề HV, Hiệu quả PA, Ý thức, Bỏ quên.
 * Quyền `meeting.view` được kiểm ngay trong từng dịch vụ (`phanTich/phamVi.ts` cho các đường mới).
 */
const filterTongHopOf = (req: Request) => ({
  branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  soTuan: khoangTuThamSo(qStr(req, 'tg')), classId: qInt(req, 'lop') ?? null,
  theo: (THEO_DONG as readonly string[]).includes(qStr(req, 'theo') ?? '') ? (qStr(req, 'theo') as TheoDong) : 'tuan',
});
api.get('/phan-tich/tong-hop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongHopSvc.tongHop(principalOf(req), filterTongHopOf(req));
}));
api.get('/phan-tich/tong-hop/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongHopSvc.oTongHop(principalOf(req), {
    ...filterTongHopOf(req), khoa: qStr(req, 'khoa') ?? '', cot: qStr(req, 'cot') ?? '',
  });
}));
/* Xuất Excel kết quả Test (PR-XUAT, YC-13.9): xem trước (GET, không ghi) và xuất (POST, ghi nhật ký `mt.xuat_excel`) cùng một hàm lọc. */
api.get('/xuat-mt/xem-truoc', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const f = docBoLocXuatMt(req.query as Record<string, unknown>);
  if (typeof f === 'string') throw badRequest(f);
  return xuatMtSvc.xemTruoc(principalOf(req), f);
}));
api.post('/xuat-mt', requireAuth, wrap((req) => {
  const f = docBoLocXuatMt((req.body ?? {}) as Record<string, unknown>);
  if (typeof f === 'string') throw badRequest(f);
  return xuatMtSvc.xuatExcel(principalOf(req), f);
}));
/* Tổng hợp vấn đề HV (PR-UX4): đếm HV theo nhóm nguyên nhân. `loi=chinh` chỉ lỗi chính; `gop=1` gộp theo nhóm nguyên nhân chung. */
const filterVanDeHvOf = (req: Request) => ({
  branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  classId: qInt(req, 'lop') ?? null, soTuan: khoangTuThamSo(qStr(req, 'tg')),
  chiChinh: qStr(req, 'loi') === 'chinh', gop: qStr(req, 'gop') === '1',
});
api.get('/phan-tich/van-de-hv', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return vanDeHvSvc.vanDeHv(principalOf(req), filterVanDeHvOf(req));
}));
api.get('/phan-tich/van-de-hv/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return vanDeHvSvc.oVanDeHv(principalOf(req), {
    ...filterVanDeHvOf(req), dong: qStr(req, 'dong') ?? '', cot: qStr(req, 'cot') ?? '',
  });
}));
/* Hiệu quả PA (PR-UX4; PR-Pb2-a): PA GV thêm / PA theo quy chế. `gv`, `tu`, `den` — tên CHỐT trong Hợp đồng a↔b; `tu`/`den` thắng `tg`. */
const filterHieuQuaPaOf = (req: Request) => ({
  branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  classId: qInt(req, 'lop') ?? null, soTuan: khoangTuThamSo(qStr(req, 'tg')),
  gv: qStr(req, 'gv') ?? null, tu: qStr(req, 'tu') ?? null, den: qStr(req, 'den') ?? null,
});
api.get('/phan-tich/hieu-qua-pa', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return hieuQuaPaSvc.hieuQuaPa(principalOf(req), filterHieuQuaPaOf(req));
}));
api.get('/phan-tich/hieu-qua-pa/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return hieuQuaPaSvc.oHieuQuaPa(principalOf(req), {
    ...filterHieuQuaPaOf(req), dong: qStr(req, 'dong') ?? '', cot: qStr(req, 'cot') ?? '',
  });
}));
/* Ý thức & Phối hợp (PR-UX4): Học viên cần chú ý + Lớp nhiều vi phạm. Kỳ = từ đầu khoảng `tg` đến hôm nay. */
const filterYThucPhanTichOf = (req: Request) => ({
  branchId: qInt(req, 'branchId') ?? null, ct: null, classId: qInt(req, 'lop') ?? null,   // PR-Pb2-a (Q2): Ý thức luôn gộp hai khung — bỏ qua `ct`
  from: tuDauKhoang(demoToday(), khoangTuThamSo(qStr(req, 'tg'))), to: demoToday(),
});
api.get('/phan-tich/y-thuc', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return yThucPhanTichSvc.yThucPhanTich(principalOf(req), filterYThucPhanTichOf(req));
}));
api.get('/phan-tich/y-thuc/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return yThucPhanTichSvc.oYThucPhanTich(principalOf(req), {
    ...filterYThucPhanTichOf(req), dong: qStr(req, 'dong') ?? '', cot: qStr(req, 'cot') ?? '',
  });
}));
/* PR-Pb2-b: bảng Phân tích giáo viên (Q30-5, Q31-9) + panel Chấm điểm của một GV. `cn`, `gv` số nguyên dương; khoảng `tu`/`den` (Thứ Hai) hoặc `thang`. */
const filterPtGvOf = (req: Request) => ({
  cn: soDuong(req.query.cn, 'cn'), ct: khungPtGvTuThamSo(qStr(req, 'ct')),
  tu: qStr(req, 'tu') ?? null, den: qStr(req, 'den') ?? null, thang: qStr(req, 'thang') ?? null,
});
api.get('/phan-tich/giao-vien', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return giaoVienPtSvc.phanTichGiaoVien(principalOf(req), filterPtGvOf(req));
}));
api.get('/phan-tich/giao-vien/cham-diem', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const gv = soDuong(req.query.gv, 'gv');
  if (gv == null) throw badRequest('Thiếu giáo viên.');
  return giaoVienPtSvc.oChamDiemGv(principalOf(req), { ...filterPtGvOf(req), gv });
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
    { force: req.body?.force === true, huyLichVuot: req.body?.xacNhanHuyLich === true });
}));

/** PR-LM (Q-0310-1): "Huỷ lịch" một lượt = bỏ tuần, giữ lượt — các kỹ năng chưa thi về "Chưa xếp lịch". Lý do tuỳ chọn (T7). */
api.post('/attempts/:id/bo-tuan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return skillScheduleSvc.boTuanLuot(principalOf(req), pInt(req, 'id'), { lyDo: typeof req.body?.lyDo === 'string' ? req.body.lyDo : null });
}));

/** PR-MTa (T2): Quản lý khôi phục kết quả MT đã huỷ do dời vượt `{ lyDo? }`. */
api.post('/attempts/:id/khoi-phuc-ket-qua', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return ketQuaHuySvc.khoiPhucKetQua(principalOf(req), pInt(req, 'id'), { lyDo: typeof req.body?.lyDo === 'string' ? req.body.lyDo : null });
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
    huyLichVuot: req.body?.xacNhanHuyLich === true,
  });
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

api.post('/attempts/:id/skills/:skill/restore', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const periodId = toInt(req.body?.periodId);
  if (!periodId) throw badRequest('Khôi phục thì phải đặt luôn tuần mới — không để phần thi treo không lịch.');
  return absenceSvc.restoreCancelledSkill(principalOf(req), pInt(req, 'id'), String(req.params.skill), periodId, {
    reason: req.body?.reason ?? null,
  });
}));

/** PR-MTa (T3): GVCN / Quản lý "Xin dời" kỹ năng đã huỷ vì vắng 2 lần → thẻ Lịch thi ở Chờ duyệt `{ reason?, idempotencyKey? }`. */
api.post('/attempts/:id/skills/:skill/xin-doi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return absenceSvc.xinDoi(principalOf(req), pInt(req, 'id'), String(req.params.skill), {
    lyDo: typeof req.body?.reason === 'string' ? req.body.reason : null,
    idempotencyKey: typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey : null,
  });
}));

/** PR-MTa (T3, Q3): Quản lý chốt "Không mock lại" — kỹ năng bỏ khỏi đợt `{ lyDo? }`. */
api.post('/attempts/:id/skills/:skill/khong-mock-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return absenceSvc.khongMockLai(principalOf(req), pInt(req, 'id'), String(req.params.skill), typeof req.body?.lyDo === 'string' ? req.body.lyDo : null);
}));

/** PR-XLMT (T38, K4-28): Báo vắng FT — ghi "-" mọi ô của kỹ năng + chốt ngay (lần 1 tự dời, lần 2 chờ Quản lý duyệt). */
api.post('/attempts/:id/skills/:skill/bao-vang', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return absenceSvc.baoVang(principalOf(req), pInt(req, 'id'), String(req.params.skill), typeof req.body?.lyDo === 'string' ? req.body.lyDo : null);
}));

/** PR-XLMT (T38, rà #126): Huỷ điểm một kỹ năng FT — mọi ô chọn (W1/W2) trong một giao dịch; lý do tuỳ chọn (PR-MTa, 06/10). */
api.post('/attempts/:id/skills/:skill/huy-diem', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return keHoachSvc.huyDiem(principalOf(req), {
    attemptId: pInt(req, 'id'), skill: String(req.params.skill),
    o: Array.isArray(req.body?.o) ? req.body.o.map(String) : undefined, lyDo: String(req.body?.lyDo ?? ''),
  });
}));

/** PR-XLMT (T37 "ép vào đợt trùng"): Quản lý cho thi lại kỹ năng đã có điểm — xoá ô (lịch sử giữ), đặt tuần mới. */
api.post('/ke-hoach-test/thi-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  const periodId = toInt(b.periodId);
  if (!periodId) throw badRequest('Cần chọn tuần thi lại.');
  return keHoachSvc.thiLai(principalOf(req), {
    attemptId: toInt(b.attemptId) ?? 0, skills: Array.isArray(b.skills) ? b.skills.map(String) : [],
    periodId, lyDo: String(b.lyDo ?? ''), force: b.force === true,
  });
}));

api.post('/attempts/:id/deadline', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.setDeadlineOverride(principalOf(req), pInt(req, 'id'),
    req.body?.deadline ?? null, req.body?.reason);
}));

api.post('/attempts/:id/cancel', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const cach = req.body?.cach === 'ca-luot' || req.body?.cach === 'phan-con-lai' ? req.body.cach : null;
  return attemptSvc.huyLuot(principalOf(req), pInt(req, 'id'), { lyDo: String(req.body?.reason ?? ''), cach });
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
    /* T10 (PR-MTa): band trực tiếp (L/R thay số câu, W1/W2/S thay 4 tiêu chí) — `saveScore` kiểm bậc 0.5, không cả hai. */
    band: b.band,
    /* RB-5 — lý do hiệu chỉnh khi sửa ô đã có điểm; máy chủ tự quyết khi nào bắt buộc. */
    lyDo: b.lyDo,
    /* Dấu '-' "không có bài" (PR-G) — chỉ nhận đúng true/false, không hiểu chuỗi lạ thành lệnh. */
    noShow: b.noShow === true ? true : b.noShow === false ? false : undefined,
    /* PR-HSM: nhận xét W/S + GV chấm Speaking — máy chủ kiểm lại mọi luật trong `saveScore`. */
    nhanXet: b.nhanXet, gvCham: b.gvCham,
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

/** PR-DL — Điểm theo lớp: các lượt của lớp (mã `mt:<n>` / `thuong:<kind>`) + lượt mở sẵn. Chỉ đọc. */
api.get('/classes/:classId/diem-theo-luot', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return diemTheoLuotSvc.danhSachLuot(principalOf(req), pInt(req, 'classId'));
}));

/** PR-DL — bảng cả lớp của một lượt. Mã sai dạng/sai loại lớp → 400; lớp chưa có lượt đó → 404. Ghi điểm vẫn qua PUT /attempts/:id/scores/:skill. */
api.get('/classes/:classId/diem-theo-luot/:luot', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return diemTheoLuotSvc.bangTheoLuot(principalOf(req), pInt(req, 'classId'), String(req.params.luot));
}));

/** PR-DL — trang Test › Điểm theo lớp: lớp người xem được xem, kèm số ô trống. */
api.get('/diem-theo-lop/lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return diemTheoLuotSvc.lopCuaToi(principalOf(req));
}));

/**
 * Lịch Test (PR-UX1) — MỘT lời gọi đủ cho màn: dải số, Nợ tuần trước, mỗi lớp một hàng. Không truyền tuần thì lấy tuần
 * hiện tại. `phamVi` = "Lớp tôi dạy" (`cua-toi`) / "Tất cả" (`tat-ca`); `classId` = đang lọc một lớp.
 */
api.get('/cham/lich-test', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const periodId = qInt(req, 'periodId') ?? ensurePeriod(demoToday()).id;
  const pv = qStr(req, 'phamVi');
  return chamSvc.lichTest(principalOf(req), periodId, qInt(req, 'branchId'), demoToday(), {
    phamVi: pv === 'cua-toi' || pv === 'tat-ca' ? pv : null, classId: qInt(req, 'classId') ?? null,
  });
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
 * BẢNG PHÂN TÍCH VẤN ĐỀ CỦA MỘT LỚP (mục 13.4). Đường cũ của Bảng Ý thức của lớp (đếm số đợt Case) đã bỏ 21/09/2026:
 * Ý thức nay là vi phạm và biện pháp xử lý, dữ liệu ba khu vực ở `GET /classes/:id/y-thuc`.
 */
api.get('/classes/:id/issue-board', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: id }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const category = qStr(req, 'category');
  if (!category) throw badRequest('Chưa chọn kỹ năng để phân tích.');
  return effectiveness.classIssueBoard(id, category, { fromDate: qStr(req, 'from') ?? null });
}));

/** Danh sách sau một SỐ ở bảng vấn đề / hiệu quả PA của một kỹ năng (PR-HVL, M5) — tính bằng chính `issueBoard`. */
api.get('/classes/:id/issue-board/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const category = qStr(req, 'category');
  const cot = qStr(req, 'cot');
  if (!category || !cot) throw badRequest('Thiếu kỹ năng hoặc cột cần xem.');
  return phanTichLopSvc.oPhanTichLop(principalOf(req), pInt(req, 'id'), category, cot, qStr(req, 'kind') ?? null);
}));

api.get('/classes/:id/issue-board/needs-evaluation', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId: id }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
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
 * CHỦ (đặc tả mục 6) — giao diện chỉ ẩn nút cho gọn mắt. Không có đường nào tạo Case Ý thức: mô hình đó đã bỏ.
 */
const yThucBody = (req: Request) => (req.body ?? {}) as Record<string, any>;

api.get('/students/:id/violations', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const id = pInt(req, 'id');
  const result = violationSvc.listViolations(principalOf(req), {
    studentId: id, trangThai: (qStr(req, 'trangThai') as any) ?? null, category: qStr(req, 'category') ?? null,
    from: qStr(req, 'from') ?? null, to: qStr(req, 'to') ?? null,
  });
  /*
   * Q14: chu kỳ hiện tại của em — FT theo lộ trình (`cycleId`), lớp thường theo khoá đang học (`classId`). MỌI học viên có
   * một dòng `learning_cycles` (intake.ts: "mở lộ trình cho mọi em"), nhưng chỉ FT có `route` (LT1/LT2…) — lớp thường có
   * `programme_code` mà `route = null` (đúng cách `cycleLabel` ở `students/profile.ts:48` phân biệt hai loại), nên `cycleId`
   * chỉ lấy khi `route` có; không thì so `classId` (lớp thường).
   */
  const cyc = cycleSvc.currentCycle(id);
  return { ...result, chuKy: { cycleId: cyc?.route ? cyc.id : null, classId: accessSvc.activeClassOf(id) } };
}));
/** Tab Ý thức của học viên (K3 §4f) + khung phải của tab lớp khi chọn em: thang, thanh việc, vi phạm, dòng thời gian trộn. */
api.get('/students/:id/y-thuc', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return xuLySvc.yThucHocVien(principalOf(req), pInt(req, 'id'), { phamVi: qStr(req, 'pham-vi') === 'tat-ca' ? 'tat-ca' : 'chuoi' });
}));

/** Tab Ý thức của lớp — hai khung (M6): em theo nhóm + dòng thời gian cả lớp. Một request cho cả tab. */
api.get('/classes/:id/y-thuc', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return bangYThucLop(principalOf(req), pInt(req, 'id'));
}));
/** YT-6 "Theo thời gian" — HV ĐANG HỌC ở lớp, MỌI trạng thái (khác ba khu vực của `/classes/:id/y-thuc`, đi theo học viên). */
api.get('/classes/:id/violations', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return violationSvc.listViolations(principalOf(req), {
    activeInClassId: pInt(req, 'id'), trangThai: (qStr(req, 'trangThai') as any) ?? null, category: qStr(req, 'category') ?? null,
    from: qStr(req, 'from') ?? null, to: qStr(req, 'to') ?? null,
  });
}));
/* PR-VAI-a (K5-10): '/y-thuc/my-coordination' đã bỏ — Phối hợp SOS nay là việc `phoi_hop_sos` trong `/my-work` (cùng `myCoordinationLines`). */

/**
 * Cảnh báo trùng mềm (V06) — form gọi trước khi ghi để hiện "Xem vi phạm đó" / "Vẫn ghi vi phạm mới". Không chặn gì.
 * `defaultSkill` (YT-4) — môn tự điền theo phân công của người gọi ở lớp em đang học, để form điền sẵn ô Môn.
 */
api.get('/violations/similar', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const studentId = qInt(req, 'studentId') ?? 0;
  const lop = accessSvc.activeClassOf(studentId);
  return {
    rows: violationSvc.similarViolations(p, {
      studentId, category: qStr(req, 'category') ?? '', occurredOn: qStr(req, 'occurredOn') ?? null,
    }),
    defaultSkill: violationSvc.defaultSkillFor(p, lop),
    /* K5-47: form chọn môn theo chương trình lớp em đang học (`monViPham`). */
    chuongTrinh: lop ? regularSvc.programmeOfClass(lop)?.code ?? null : null,
  };
}));
api.post('/violations', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return violationSvc.recordViolation(principalOf(req), {
    studentId: toInt(b.studentId) ?? 0, category: b.category, description: b.description, occurredOn: b.occurredOn ?? null,
    skill: 'skill' in b ? (b.skill ?? null) : undefined, idempotencyKey: b.idempotencyKey ?? null,
    ghiRoKhac: b.ghiRoKhac ?? null,
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
    ghiRoKhac: 'ghiRoKhac' in b ? (b.ghiRoKhac ?? null) : undefined,
  });
}));
/** XOÁ THẲNG (rulebook v3, V11′–V14′): không lý do, không "đánh dấu không chính xác". Trả số biện pháp đã bị gỡ vi phạm này. */
api.delete('/violations/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return violationSvc.deleteViolation(principalOf(req), pInt(req, 'id'));
}));

/** V4-1: Ghi nhận — "đã xem, không cần biện pháp". Vi phạm đang bắt buộc thì từ chối (V4-2). */
api.post('/students/:id/y-thuc/ghi-nhan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.ghiNhan(principalOf(req), pInt(req, 'id'), yThucBody(req).violationIds);
}));
/** V4-7: Xác nhận xử lý một bước — bậc do máy chủ tính (`bacDaThay` lệch → 409). */
api.post('/students/:id/y-thuc/xu-ly', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return xuLySvc.xacNhanXuLy(principalOf(req), pInt(req, 'id'), {
    violationIds: b.violationIds, performedOn: b.performedOn, performerUserId: b.performerUserId, performerName: b.performerName,
    note: b.note, idempotencyKey: b.idempotencyKey ?? null, bacDaThay: b.bacDaThay,
  });
}));
/** H5: khai bậc đã xử lý trước khi dùng web (GVCN, một lần mỗi chuỗi); PUT = QL sửa. */
api.post('/students/:id/y-thuc/khai-bac', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.khaiBac(principalOf(req), pInt(req, 'id'), yThucBody(req));
}));
api.put('/students/:id/y-thuc/khai-bac', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.suaKhaiBac(principalOf(req), pInt(req, 'id'), yThucBody(req));
}));
api.get('/y-thuc/xu-ly/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return xuLySvc.xemXuLy(principalOf(req), pInt(req, 'id'));
}));
/** V4-9/V4-10 (Q10): Đề xuất QL duyệt = nháp (để tải bằng chứng) → gửi (thẻ `y_thuc`). Đóng panel giữa chừng → xoá nháp. */
api.post('/students/:id/y-thuc/de-xuat', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return xuLySvc.deXuat(principalOf(req), pInt(req, 'id'), { kind: b.kind, customName: b.customName, violationIds: b.violationIds, note: b.note });
}));
api.post('/y-thuc/xu-ly/:id/gui', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.guiDeXuat(principalOf(req), pInt(req, 'id'));
}));
api.delete('/y-thuc/xu-ly/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.xoaNhap(principalOf(req), pInt(req, 'id'));
}));
/** V4-10: QL đã duyệt → GVCN ghi "Đã thực hiện". */
api.post('/y-thuc/xu-ly/:id/da-thuc-hien', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return xuLySvc.daThucHien(principalOf(req), pInt(req, 'id'), {
    performedOn: b.performedOn, performerUserId: b.performerUserId, performerName: b.performerName, note: b.note,
  });
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
    program: ctTuyChon(qStr(req, 'ct')),   // PR-Pb2-a: vắng = gộp; chỉ số Ý thức / Phối hợp bỏ qua khung trong metricSet
    classId: qInt(req, 'classId'),
    ctLop: qStr(req, 'ctLop') ?? null,
  });
  return metricResponse(r, qStr(req, 'rows') === '1');
}));

api.get('/classes/:id/overview', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  lenhSvc.quetLenhDenHan();
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

/** Tạo lớp = lớp + phân công trong MỘT giao dịch (YC-1); tên lớp do máy ghép từ chương trình/lộ trình/số (T1). */
api.post('/classes', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return intakeSvc.taoLopVaPhanCong(principalOf(req), req.body ?? {});
}));

/**
 * PR-QU (C): tạo NHIỀU lớp một lần — `{ rows, idempotencyKey, dryRun }`. Tất cả hoặc không gì; lỗi theo dòng trả 200 `{ ok:false, loi }`
 * để lưới gắn đúng ô (quyền sai vẫn 403 cả lô). `dryRun` = nút "Kiểm tra".
 */
api.post('/classes/bulk', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  if (!b.dryRun) maybeSimulateSaveFailure();
  return intakeSvc.taoLopHangLoat(principalOf(req), { rows: b.rows, idempotencyKey: b.idempotencyKey ?? null, dryRun: !!b.dryRun });
}));

// ============================================================ Học viên & Lớp · hồ sơ lớp (PR-Qa)

/** Trang Học viên & Lớp: lớp + số đếm chip + cờ lọc từng học viên — một request cho cả trang (đặc tả §3.6). */
api.get('/hoc-vien-lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return hocVienLopSvc.danhSachHocVienLop(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, q: qStr(req, 'q') ?? null, phamVi: qStr(req, 'phamVi') ?? null,
    cnNho: qInt(req, 'cnNho') ?? null,
  });
}));

/** Khu Lưu trữ (PR-LT, Q16/Q22): lớp đã kết thúc · học viên đã lưu trữ — ⋯ góc phải trang Học viên & Lớp. */
api.get('/hoc-vien-lop/luu-tru', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return luuTruSvc.danhSachLuuTru(principalOf(req), { branchId: qInt(req, 'branchId') ?? null, q: qStr(req, 'q') ?? null });
}));

/** Tab Phân tích lớp: kỹ năng × đợt, mỗi ô "số HV đạt / số HV có điểm" (đặc tả §3.7). */
api.get('/classes/:id/phan-tich-lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return phanTichLopSvc.phanTichLop(principalOf(req), pInt(req, 'id'));
}));

/** Tab Học viên › Cần hỗ trợ (PR-HVL, M4): mỗi em có Case mở một khối — Case + PA + việc tiếp, theo lô (không N+1). */
api.get('/classes/:id/can-ho-tro', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return canHoTroLop(principalOf(req), pInt(req, 'id'));
}));

/** ⋮ Sửa thông tin lớp: mã lớp, LT (FT), ghi chú; chương trình chỉ khi lớp chưa có học viên và bài Test. */
api.patch('/classes/:id/thong-tin', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return thongTinLopSvc.capNhatThongTinLop(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** ⋮ Hồ sơ lớp › Xoá lớp / Kết thúc lớp — CHỈ Quản trị hệ thống (máy chủ kiểm `admin.config`, PR-UX3). */
api.get('/classes/:id/xoa-ket-thuc', requireAuth, wrap((req) => xoaKetThucLopSvc.xemXoaKetThuc(principalOf(req), pInt(req, 'id'))));
api.post('/classes/:id/xoa', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xoaKetThucLopSvc.xoaLop(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.post('/classes/:id/ket-thuc', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xoaKetThucLopSvc.ketThucLop(principalOf(req), pInt(req, 'id'));
}));
/** PR-LUI-b: ⋮ Hồ sơ lớp đã kết thúc › Mở lại lớp — Quản lý của lớp hoặc Quản trị. */
api.post('/classes/:id/mo-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xoaKetThucLopSvc.moLaiLop(principalOf(req), pInt(req, 'id'), { lyDo: req.body?.lyDo });
}));

/** ⋮ Sửa thông tin cả lớp (PR-SL): giá trị hiện tại của mọi em đang học (panel). */
api.get('/classes/:id/sua-ca-lop', requireAuth, wrap((req) => suaCaLopSvc.duLieuSuaCaLop(principalOf(req), pInt(req, 'id'))));
/** ⋮ Sửa thông tin cả lớp (PR-SL): xem trước — soát từng ô, cảnh báo MT sẽ dời. Không ghi gì. */
api.post('/classes/:id/sua-ca-lop/xem-truoc', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  return suaCaLopSvc.xemTruocSuaCaLop(principalOf(req), pInt(req, 'id'), { rows: b.rows, lyDoTarget: b.lyDoTarget });
}));
/** Lưu: tất cả hoặc không gì, một giao dịch; khoá chống gửi trùng như Thêm học viên. */
api.post('/classes/:id/sua-ca-lop', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return suaCaLopSvc.luuSuaCaLop(principalOf(req), pInt(req, 'id'), { rows: b.rows, lyDoTarget: b.lyDoTarget, idempotencyKey: b.idempotencyKey });
}));

// ============================================================ Thêm học viên hàng loạt

/** Tách dòng từ nội dung dán ở Excel/Google Sheets. Không ghi gì vào database. */
api.post('/intake/parse', requireAuth, wrap((req) => {
  const text = String(req.body?.text ?? '');
  if (!text.trim()) throw badRequest('Chưa có nội dung để đọc.');
  /* PR-NT: không tiêu đề → đọc theo thứ tự cột lưới của lớp; `coTieuDe` = người dùng chọn cách đọc. Không ghi gì nên không cần quyền mới. */
  return intakeSvc.parsePaste(text, {
    classId: Number(req.body?.classId) || null,
    coTieuDe: typeof req.body?.coTieuDe === 'boolean' ? req.body.coTieuDe : undefined,
  });
}));

/** Xem trước: soát lỗi từng ô, gợi ý trùng hồ sơ. Vẫn không ghi gì. */
api.post('/intake/preview', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  return intakeSvc.previewIntake(principalOf(req), {
    rows: b.rows ?? [],
    /* Lớp của CẢ LÔ, chọn một lần ở đầu panel (mục 12.1). */
    classId: toInt(b.classId) || toInt(b.defaultClassId) || null,
    defaultStartWeek: b.defaultStartWeek ?? null,
  });
}));

api.post('/intake/commit', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return intakeSvc.commitIntake(principalOf(req), {
    rows: b.rows ?? [],
    classId: toInt(b.classId) || toInt(b.defaultClassId) || null,
    defaultStartWeek: b.defaultStartWeek ?? null,
    idempotencyKey: b.idempotencyKey,
  });
}));

// ============================================================ Lớp thường (FOU/BE/ELE)

/** Bảng nhập điểm của lớp thường: điểm đạt / tổng điểm, đạt từ 70%. */
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
/* Kèm `skills` + `checkpoints` của bảng: panel Tạo lớp vẽ ô phân công và dòng "10 tuần · Giữa khoá tuần 5 …" từ đây (PR-LOP). */
api.get('/ref/programmes', requireAuth, wrap(() =>
  [...regularSvc.allProgrammes().values()].filter((x) => x.active).sort((x, y) => x.code.localeCompare(y.code))));

// ============================================================ Lộ trình và Đánh giá GV

api.get('/students/:id/cycles', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  return cycleSvc.cyclesOf(id);
}));

/** PR-TK (TK-7): khối "Các lộ trình" của hồ sơ HV — lộ trình đã đóng đọc từ bản chụp. */
api.get('/students/:id/lo-trinh', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongKetSvc.cacLoTrinh(principalOf(req), pInt(req, 'id'));
}));
/** PR-TK (TK-7): ngăn "Tổng kết lộ trình" — chỉ lộ trình đã đóng (đang chạy → 404). */
api.get('/lo-trinh/:cycleId/tong-ket', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongKetSvc.tongKetLoTrinh(principalOf(req), pInt(req, 'cycleId'));
}));
/** PR-TK (TK-7): tab "Tổng kết" của lớp ĐÃ KẾT THÚC. */
api.get('/classes/:id/tong-ket', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongKetSvc.tongKetLop(principalOf(req), pInt(req, 'id'));
}));

api.post('/students/:id/cycles', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  /* PR-Dọn (quét #20): chỉ lấy các khoá cần — không trải cả thân yêu cầu (ghi nguyên vào audit `after`). */
  const { route, targetScore, examPeriodId, startedAt, note } = (req.body ?? {}) as Record<string, any>;
  return cycleSvc.createCycle(principalOf(req), { route, targetScore, examPeriodId, startedAt, note, studentId: pInt(req, 'id') });
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

/** Kết luận cuối lộ trình. Đóng lộ trình về hành chính KHÁC với đạt Target. */
api.put('/cycles/:id/outcome', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  /* PR-TK (TK-K): thân mới { ngayThi, l, r, w, s, khongThi, ghiChu } = kết quả thi thật (máy tính OVR + Đạt / Chưa đạt). Thân cũ { outcome, score, note } giữ nguyên hành vi. */
  const body = (req.body ?? {}) as Record<string, any>;
  if (['ngayThi', 'l', 'r', 'w', 's', 'khongThi', 'ghiChu'].some((k) => k in body)) return thiThatSvc.datKetQuaThiThat(principalOf(req), pInt(req, 'id'), body);
  return cycleSvc.setOutcome(principalOf(req), pInt(req, 'id'), body as any);
}));

/** PR-DUYET (T44): GV của lớp gửi Đề xuất sửa thông tin HV — thành thẻ ở hộp Chờ duyệt. */
api.post('/students/:id/de-xuat-sua', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return deXuatSuaSvc.guiDeXuatSua(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** PR-CT (Q30-1, Q14): GVCN đề xuất chuyển lớp — thẻ Thông tin HV ở hộp Chờ duyệt; Quản lý duyệt = ra lệnh. */
api.post('/students/:id/de-xuat-chuyen-lop', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = (req.body ?? {}) as Record<string, any>;
  return lenhSvc.guiDeXuatChuyenLop(principalOf(req), pInt(req, 'id'), { toClassId: b.toClassId ? Number(b.toClassId) : null, tuan: typeof b.tuan === 'string' ? b.tuan : null, lyDo: b.lyDo });
}));

/** Đổi Target: có hiệu lực từ ngày ghi trở đi, KHÔNG chấm lại các lượt đã chốt. */
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
  const id = pInt(req, 'id');
  require_(principalOf(req), PERMISSIONS.ATTEMPT_VIEW, { classId: id }, 'Lớp này nằm ngoài phạm vi bạn được xem.');   // PR-Dọn (quét #10)
  const pr = scheduleSvc.classProgress(id);
  /* K2-22: dòng tóm tắt MT của lớp FT (panel Tuần khai giảng) — chỉ người xem được lớp; người khác không có dòng này. */
  const tomTatMt = pr.programmeCode === 'FT' && can(principalOf(req), PERMISSIONS.ATTEMPT_VIEW, { classId: id }) ? scheduleSvc.tomTatMt(id) : null;
  return { ...pr, tomTatMt };
}));

/**
 * KẾ HOẠCH CHUYỂN TIẾP khi lớp học hết chương trình (mục 6.1) — chỉ đọc.
 * Trả về chương trình kế tiếp theo luồng mặc định, lớp chuyển đến đang có, và danh sách học viên.
 */
api.get('/classes/:id/transition', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  lenhSvc.quetLenhDenHan();
  return transitionSvc.transitionPlan(principalOf(req), pInt(req, 'id'));
}));

/**
 * PR-CT (Q30-1): RA LỆNH chuyển lớp (không chuyển ngay) — Quản lý lớp nguồn quyết em nào · lớp chuyển đến · tuần bắt đầu; tới Thứ Hai đó web tự thi hành
 * (`thiHanhLenhDenHan`). GVCN, GVBM → 403.
 */
api.post('/classes/:id/transition', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const id = pInt(req, 'id');
  const b = req.body ?? {};
  return lenhSvc.raLenh(principalOf(req), {
    lopNguonId: id, boiCanh: lenhSvc.boiCanhTheoLop(id), tuanChung: b.tuanChung ?? null,
    dongs: Array.isArray(b.dongs) ? b.dongs.map(lenhSvc.dongTuBody) : [],
  });
}));

api.patch('/lenh-chuyen/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  lenhSvc.suaLenh(principalOf(req), pInt(req, 'id'), lenhSvc.suaTuBody(req.body));
  return { ok: true };
}));

api.post('/lenh-chuyen/:id/huy', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  lenhSvc.huyLenh(principalOf(req), pInt(req, 'id'), req.body?.lyDo);
  return { ok: true };
}));

/** Bàn giao (Q30-2): phiếu cả lớp nguồn (một lần đọc), một phiếu, GVBM ghi môn mình, GVCN xác nhận / nhắc. */
api.get('/lenh-chuyen/ban-giao', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const lop = qInt(req, 'lop');
  if (!lop) throw badRequest('Cần lớp (lop).');
  return banGiaoSvc.phieuBanGiao(principalOf(req), { lopNguonId: lop, mon: qStr(req, 'mon') ?? undefined });
}));
api.get('/lenh-chuyen/:id/ban-giao', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return banGiaoSvc.phieuBanGiao(principalOf(req), { lenhId: pInt(req, 'id') });
}));
api.put('/lenh-chuyen/:id/ban-giao-mon', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  banGiaoSvc.ghiMon(principalOf(req), pInt(req, 'id'), String(req.body?.mon ?? ''), String(req.body?.noiDung ?? ''));
  return { ok: true };
}));
api.post('/lenh-chuyen/:id/xac-nhan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  banGiaoSvc.xacNhanBanGiao(principalOf(req), pInt(req, 'id'), String(req.body?.nhanXetChung ?? ''));
  return { ok: true };
}));
api.post('/lenh-chuyen/:id/nhac', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return banGiaoSvc.nhacGvbm(principalOf(req), pInt(req, 'id'), String(req.body?.mon ?? ''));
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
api.get('/cycles/:id/suggested-mocks', requireAuth, wrap((req) => {
  /* PR-Dọn (quét #10): chỉ người xem được em của lộ trình. */
  const c = cycleSvc.cycleById(pInt(req, 'id'));
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(principalOf(req), PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  /* PR-LM: lịch đề xuất ghép lượt thật (trạng thái, tuần từng kỹ năng, kỳ vọng) — panel Lộ trình xếp / dời / huỷ lịch / nhập điểm tại chỗ. */
  const bang = keHoachSvc.lichMtLoTrinh(c.id);
  return { ...bang, coTheXep: can(principalOf(req), PERMISSIONS.PLAN_WEEK, { classId: bang.classId, studentId: c.student_id }) };
}));

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

/* PR-LT2a (N4, Q14): bốn đường `/signals/pending…` đã bỏ — lớp thường không còn "Tạo Case / Bỏ qua"; Giữa khoá tự tạo Case. */

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

/*
 * ĐƯỜNG `/outcomes` ĐÃ BỎ cùng với bảng "Phương án & kết quả" đứng riêng (mục 15.1).
 *
 * Nó là CÁCH ĐẾM THỨ HAI cho cùng một câu hỏi "những gì đã làm có ăn thua không", chạy
 * song song với `cases/effectiveness.ts`. Hai cách đếm cho một câu hỏi thì sớm muộn cũng ra
 * hai con số, và lúc đó không ai biết tin bên nào. Nay chỉ còn một nơi sở hữu luật 15.3.
 */

/* PR-GV: hồ sơ giáo viên + danh sách sau một số. `:id`/`lop`/`cn` là số nguyên dương (sai → 400); quyền kiểm ở `phamViHoSoGv`. */
const soDuong = (v: unknown, ten: string): number | null => {
  if (v === undefined || v === '') return null;
  const n = Number(v);
  if (typeof v !== 'string' || !/^\d+$/.test(v) || !Number.isSafeInteger(n) || n < 1) throw badRequest(`Tham số "${ten}" không hợp lệ.`);
  return n;
};
/** Bảng giáo viên của một chi nhánh (đặt TRƯỚC `/giao-vien/:id`). Không xếp hạng: sắp theo tên. */
api.get('/giao-vien', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return bangGvChiNhanh(principalOf(req), { cn: soDuong(req.query.cn, 'cn'), ct: qStr(req, 'ct') ?? null });
}));
api.get('/giao-vien/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return hoSoGiaoVien(principalOf(req), soDuong(req.params.id, 'id') ?? pInt(req, 'id'));
}));
api.get('/giao-vien/:id/viec', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return viecHoSoGv(principalOf(req), soDuong(req.params.id, 'id') ?? pInt(req, 'id'));
}));
api.get('/giao-vien/:id/ket-qua', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return ketQuaHoSoGv(principalOf(req), soDuong(req.params.id, 'id') ?? pInt(req, 'id'));
}));
api.get('/giao-vien/:id/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return oHoSoGv(principalOf(req), soDuong(req.params.id, 'id') ?? pInt(req, 'id'), {
    cot: qStr(req, 'cot') ?? '', lop: soDuong(req.query.lop, 'lop'), dong: qStr(req, 'dong') ?? null, moc: qStr(req, 'moc') ?? null,
    cn: soDuong(req.query.cn, 'cn'), ct: qStr(req, 'ct') ?? null,
  });
}));

/**
 * Sự kiện nổi bật: tuần này, tuần tới, tuần nữa có gì đáng để ý (mục 3.5).
 * Đây là SỰ KIỆN sắp đến, không phải việc đang nợ — nên tách hẳn khỏi `/my-work`.
 */
api.get('/highlights', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return highlightSvc.highlights(principalOf(req), { branchId: qInt(req, 'branchId'), program: ctTuyChon(qStr(req, 'ct')) });   // GV: Lịch sắp tới gộp hai khung
}));

// ============================================================ Tổng quan (PR-Pa, đặc tả §3.2)

/** Tầng 1 Quản lý: Cần xử lý + dải Chờ duyệt — gộp hai khung (PR-VAI-a Q5). Mọi số đi qua `metricSet` — cùng số với `/metrics/:id`. */
api.get('/tong-quan/quan-ly', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  lenhSvc.quetLenhDenHan();
  return tongQuanSvc.tongQuanQuanLy(principalOf(req), { branchId: qInt(req, 'branchId') ?? null });
}));

/** Điểm đáng chú ý (tầng 3) theo khung `ct=ft|thuong` — tách route để đổi công tắc không tải lại Cần xử lý. */
api.get('/tong-quan/diem-chu-y', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanSvc.diemChuY(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  });
}));

/** Khối giáo viên (PR-VAI-a Q12): Lớp tôi dạy theo khung `ct=ft|thuong` — thay "Học viên cần hỗ trợ". */
api.get('/tong-quan/lop-toi-day', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanSvc.lopToiDay(principalOf(req), { ct: chuongTrinhTuThamSo(qStr(req, 'ct')) });
}));
/** Một ô số của Lớp tôi dạy → danh sách tạo nên nó (G-10). Lớp không dạy → 403. */
api.get('/tong-quan/lop-toi-day/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const classId = qInt(req, 'classId');
  if (!classId) throw badRequest('Thiếu lớp.');
  return tongQuanSvc.oLopToiDay(principalOf(req), { ct: chuongTrinhTuThamSo(qStr(req, 'ct')), classId, cot: qStr(req, 'cot') ?? '' });
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

api.get('/cases/:id', requireAuth, wrap((req) => caseSvc.caseDetail(principalOf(req), pInt(req, 'id'))));

/** Ghi một tác động. Một Case có nhiều tác động. */
api.post('/cases/:id/interventions', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.recordIntervention(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/**
 * CASE TỪ SOS (SOS v4, PR-SOS): GVBM đúng kỹ năng hoặc Quản lý Xác nhận Case (nguyên nhân) → Xác nhận PA theo quy chế, hoặc gửi
 * "Không cần theo dõi" cho Quản lý duyệt. Quyền kiểm ở máy chủ theo ĐÚNG kỹ năng của Case (C02). Đường cũ `/confirm`, `/replace` đã gỡ.
 */
api.post('/cases/:id/xac-nhan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.xacNhanCase(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
/** PR-LT2a (N2, T54): nộp kế hoạch bổ trợ cho CẢ NHÓM của PA — người dạy bổ trợ / GVCN / Quản lý (BE/ELE: GVBM). Tạo thẻ Chờ duyệt · Học thuật. */
api.post('/bo-tro/:ivId/ke-hoach', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return boTroSvc.nopKeHoachBoTro(principalOf(req), pInt(req, 'ivId'), (req.body ?? {}) as any);
}));
api.post('/interventions/:id/xac-nhan-pa', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.xacNhanPaQuyChe(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
api.post('/cases/:id/dismiss', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.guiKhongTheoDoi(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
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

/*
 * HỘP CHỜ DUYỆT (PR-DUYET, T41, §7.6): `hop=cho-duyet` (QL, Quản trị — 403 với GV) · `hop=cua-toi` (mọi vai: thẻ mình đã gửi).
 * Quyết định kiểm quyền theo phạm vi CỦA THẺ; thẻ đã xử lý → 400 "đã được xử lý" để giao diện làm mới danh sách.
 */
api.get('/yeu-cau', requireAuth, wrap((req) => {
  const p = principalOf(req);
  if (qStr(req, 'hop') === 'cua-toi') return yeuCauSvc.yeuCauCuaToi(p);
  const xem = qStr(req, 'xem');
  return yeuCauSvc.hopChoDuyet(p, {
    phanLoai: (qStr(req, 'phanLoai') as any) ?? null, xem: xem === 'da-xu-ly' || xem === 'de-biet' ? xem : 'cho',
    studentId: qInt(req, 'studentId') ?? null, branchId: qInt(req, 'branchId') ?? null, classId: qInt(req, 'lop') ?? null,
    quaHan: qStr(req, 'quaHan') === '1',
  });
}));
api.get('/yeu-cau/dem', requireAuth, wrap((req) => yeuCauSvc.demYeuCau(principalOf(req))));
api.post('/yeu-cau/duyet-nhieu', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.duyetNhieu(principalOf(req), (req.body ?? {}).ids);
}));
/* PR-GVb (Q-B): Nhắc tất cả — kiểm quyền từng thẻ ở `nhacNhieu`; đặt trước `/yeu-cau/:id/...`. */
api.post('/yeu-cau/nhac-nhieu', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.nhacNhieu(principalOf(req), (req.body ?? {}).ids);
}));
api.post('/yeu-cau/:id/duyet', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = (req.body ?? {}) as Record<string, any>;
  return yeuCauSvc.duyetYeuCau(principalOf(req), pInt(req, 'id'), { ghiChu: typeof b.ghiChu === 'string' ? b.ghiChu : null, duLieu: b.duLieu });
}));
api.post('/yeu-cau/:id/tu-choi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.tuChoiYeuCau(principalOf(req), pInt(req, 'id'), (req.body ?? {}).lyDo);
}));
api.post('/yeu-cau/:id/tra-loi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.traLoiYeuCau(principalOf(req), pInt(req, 'id'), (req.body ?? {}).traLoi);
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

/** Tab Hành trình (PR-Qb; PR-VAI-b): chương theo lớp + trục tuần theo giai đoạn (lớp thường | Fast Track) — thay `/lich-su-lop`. */
api.get('/students/:id/hanh-trinh', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const gd = qStr(req, 'giai-doan');
  return hanhTrinhHocVien(principalOf(req), pInt(req, 'id'), gd === 'thuong' || gd === 'ft' ? gd : null);
}));

/** Ghi một lần xem lại sau hỗ trợ. Một tác động có thể xem lại nhiều lần. */
api.post('/cases/:id/followups', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.recordFollowUp(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/*
 * ĐƯỜNG "HƯỚNG XỬ LÝ" ĐÃ BỎ (mục 9.3).
 *
 * Case chỉ còn MỘT đường kết thúc: nút "Hoàn thành Case" → POST /cases/:id/outcome. Giữ hai
 * đường đóng song song là giữ hai dấu vết khác nhau cho cùng một việc, và sớm muộn sẽ có
 * Case đóng được ở đường này mà màn hình ở đường kia bảo là chưa đóng được.
 *
 * Bản ghi cũ vẫn đọc được hướng xử lý của mình; chỉ không sửa qua đường riêng nữa.
 */

// ============================================================ Liên hệ với HS và phụ huynh

/*
 * BA ENDPOINT LIÊN HỆ ĐÃ BỎ Ở VÒNG 4.
 *
 * Hai việc trao đổi nay là hai PHƯƠNG ÁN của Case Ý thức/Khác, nên chúng đi chung đường với
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
 * liệu hai lộ trình vào một khung nhìn, vì Target và thang điểm của chúng khác nhau.
 */
api.get('/students/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  lenhSvc.quetLenhDenHan();
  return profileSvc.studentProfile(principalOf(req), pInt(req, 'id'), qInt(req, 'cycleId'), qInt(req, 'attemptId'));
}));

api.patch('/students/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.updateStudent(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/students/:id/transfer', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const {
    toClassId, effectiveDate, reasonCode, reasonNote, handoverNote, noHandoverNote, receiverUserId,
    nguoiNhan, mucTieu, thangThi,
  } = req.body ?? {};
  if (!toClassId) throw badRequest('Cần chọn lớp chuyển đến.');
  /* PR-CT: panel mới gửi thẳng `lyDo` (một ô chữ, không trống — T7); đường lý do chọn nhanh cũ giữ cho phép kiểm và client cũ. */
  const lyDoTuDo = typeof req.body?.lyDo === 'string' ? chuTuDo(req.body.lyDo, 'Lý do chuyển lớp', 2000) ?? '' : '';   // PR-Dọn (Q4, quét #24)
  if (req.body?.lyDo !== undefined && !lyDoTuDo) throw badRequest('Ghi lý do chuyển lớp.');
  /* RB-3: lý do chọn nhanh BẮT BUỘC; "Khác" phải ghi rõ ≥ 3 ký tự (T13). */
  if (!lyDoTuDo && laKhac(reasonCode)) {
    const loi = kiemGhiRoKhac(reasonNote);
    if (loi) throw badRequest(`Lý do "Khác": ${loi}.`);
  }
  const reason = lyDoTuDo || transferReasonText(reasonCode, reasonNote);
  if (!reason) throw badRequest('Chọn lý do chuyển lớp (chọn "Khác" thì ghi rõ).');
  /* PR-CT: em đang học một lớp → RA LỆNH (Quản lý); chỉ em CHƯA TỪNG xếp lớp (xếp lần đầu) mới đi đường cũ. */
  const sid = pInt(req, 'id');
  const enr = luatLoTrinhSvc.lopHienTaiCua(sid);
  if (enr) {
    const dich = luatLoTrinhSvc.lopDichHopLe(Number(toClassId), enr.class_id);
    const r = lenhSvc.raLenh(principalOf(req), {
      lopNguonId: enr.class_id, boiCanh: 'giua-khoa', tuanChung: req.body?.tuan ?? effectiveDate ?? null,
      dongs: [lenhSvc.dongTuBody({
        studentId: sid, huong: dich?.is_fast_track && !enr.is_fast_track ? 'fast_track' : 'chuyen_lop', toClassId, lyDo: reason,
        mucTieu, ngayThi: req.body?.ngayThi ?? thangThi,
      })],
    });
    if (r.failed.length) throw badRequest(r.failed[0].message);
    return r;
  }
  return studentSvc.transferStudent(principalOf(req), sid, Number(toClassId),
    effectiveDate ?? demoToday(), reason, {
      note: handoverNote ?? null,
      noNote: noHandoverNote === true,
      receiverUserId: receiverUserId ? Number(receiverUserId) : null,
      nguoiNhan: nguoiNhan ?? null,
      mucTieu: mucTieu === undefined || mucTieu === null ? null : Number(mucTieu),
      thangThi: thangThi ?? null,
    });
}));

/** Q3: danh sách chi nhánh + lớp chuyển đến cho panel Chuyển lớp — không lộ học viên lớp khác. */
api.get('/chuyen-lop/lop-dich', requireAuth, wrap((req) => {
  const sid = qInt(req, 'studentId');
  if (!sid) throw badRequest('Cần studentId.');
  return luatLoTrinhSvc.lopDichChoChuyen(principalOf(req), sid);
}));

/** Case đang mở + luật áp dụng khi đã chọn lớp chuyển đến (Q13, Q14). */
api.get('/students/:id/chuyen-lop', requireAuth, wrap((req) => {
  const toClassId = qInt(req, 'toClassId');
  return luatLoTrinhSvc.xemChuyenLop(principalOf(req), pInt(req, 'id'), toClassId ?? null);
}));

/** Lộ trình tiếp theo (PR-LT, Q1) — dự định sau lớp đang học, ghi trước khi thật sự chuyển. */
api.get('/students/:id/lo-trinh-tiep', requireAuth, wrap((req) => {
  return loTrinhTiepSvc.layLoTrinhTiep(principalOf(req), pInt(req, 'id'));
}));

api.put('/students/:id/lo-trinh-tiep', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return loTrinhTiepSvc.ghiLoTrinhTiep(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** PR-K26: Ghi lộ trình tiếp theo cả lớp (hồ sơ lớp ⋮) — một bảng, lưu một giao dịch. */
api.get('/classes/:id/lo-trinh-tiep', requireAuth, wrap((req) => {
  return loTrinhTiepSvc.layLoTrinhTiepCaLop(principalOf(req), pInt(req, 'id'));
}));

api.put('/classes/:id/lo-trinh-tiep', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return loTrinhTiepSvc.ghiLoTrinhTiepCaLop(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** PR-LT2b (T49): Quản lý đánh dấu Đạt / Không đạt kỳ vọng đầu ra của em BE/ELE lên FT. Chỉ `request.approve` (máy chủ kiểm lại). */
api.put('/students/:id/ket-luan-ft', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cuoiKhoaSvc.ghiKetLuanFt(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** PR-LT2b (M-05): ghi / sửa Mini Test ngoài form Ghi kết quả cuối (sửa: chỉ Quản lý, có lý do). */
api.put('/mini-test/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cuoiKhoaSvc.ghiMiniTest(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Những thứ còn dở của một em — để màn chuyển lớp bày sẵn, người chuyển không phải chép tay. */
api.get('/students/:id/handover', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const id = pInt(req, 'id');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  return studentSvc.handoverBrief(id);
}));

/** ⋮ Hồ sơ HV › Xoá học viên — CHỈ Quản trị hệ thống (máy chủ kiểm `admin.config`, PR-XOA). Xoá hẳn trong một giao dịch. */
api.get('/students/:id/xoa', requireAuth, wrap((req) => xoaHocVienSvc.xemXoaHocVien(principalOf(req), pInt(req, 'id'))));
api.post('/students/:id/xoa', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xoaHocVienSvc.xoaHocVien(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

api.post('/students/:id/status', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const status = req.body?.status;
  if (!['active', 'inactive', 'finished'].includes(status)) throw badRequest('Trạng thái không hợp lệ.');
  return studentSvc.setStudentStatus(principalOf(req), pInt(req, 'id'), status,
    req.body?.date ?? demoToday(), req.body?.reason, req.body?.endKind ?? null);
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

/** PR-LUI-b: Học lại — đường lui của Kết thúc học (về lớp cũ, hoặc sang lớp mới + lộ trình mới). Chỉ Quản lý / Quản trị (máy chủ kiểm `plan.week` của học viên). */
api.post('/students/:id/hoc-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return studentSvc.hocLai(principalOf(req), pInt(req, 'id'), {
    date: b.date ?? undefined, lyDo: b.lyDo, moLaiLop: b.moLaiLop === true,
    lopMoiId: b.lopMoiId ? Number(b.lopMoiId) : null, mucTieu: b.mucTieu ?? null, thangThi: b.thangThi ?? null,
  });
}));
/** PR-LUI-b: làm nhiều học viên một lần — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại · Huỷ / Khôi phục chuyển lớp. Chỉ Quản lý / Quản trị (kiểm từng học viên ở máy chủ). */
api.post('/hang-loat-hoc-vien/xem-truoc', requireAuth, wrap((req) => hangLoatSvc.xemTruoc(principalOf(req), req.body ?? {})));
api.post('/hang-loat-hoc-vien', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return hangLoatSvc.chay(principalOf(req), req.body ?? {});
}));
/** PR-LUI-b: lớp cũ + lớp đang hoạt động để chọn "Sang lớp mới" (panel Học lại). */
api.get('/students/:id/hoc-lai/lop-dich', requireAuth, wrap((req) => studentSvc.lopChoHocLai(principalOf(req), pInt(req, 'id'))));

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

/** PR-Ra R6: nối/gỡ một việc Vận hành thật vào một ô báo cáo đơn vị (thay gợi ý tự động cũ). */
api.post('/meeting/reports/:reportId/tasks', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return meetingSvc.linkReportTask(principalOf(req), pInt(req, 'reportId'), toInt(req.body?.taskId) ?? 0);
}));
api.delete('/meeting/reports/:reportId/tasks/:taskId', requireAuth, wrap((req) =>
  meetingSvc.unlinkReportTask(principalOf(req), pInt(req, 'reportId'), pInt(req, 'taskId'))));

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

// ============================================================ Thông báo

api.get('/notifications', requireAuth, wrap((req) => thongBaoCua(principalOf(req).userId)));

/** PR-VAI-a (Q18): "Đọc hết" — một câu UPDATE, chỉ thông báo của chính người gọi; không xoá dòng. */
api.post('/notifications/doc-het', requireAuth, wrap((req) => ({ daDoc: docHet(principalOf(req).userId, demoToday()) })));

api.post('/notifications/:id/read', requireAuth, wrap((req) => {
  const p = principalOf(req);
  db().prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?')
    .run(demoToday(), pInt(req, 'id'), p.userId);
  return { ok: true };
}));

// ============================================================ Tiến độ công việc (mục 8)

/* PR-Ra: giao diện mặc định "Đang mở" — route tự điền 'mo' khi không gửi progress, hàm dịch vụ (không progress) vẫn nghĩa "tất cả". */
api.get('/mgmt-tasks', requireAuth, wrap((req) => mgmtSvc.listMgmtTasks(principalOf(req), {
  branchId: qInt(req, 'branchId'),
  group: qStr(req, 'group'),
  progress: qStr(req, 'progress') ?? 'mo',
  hang: qStr(req, 'hang'),
  assigneeUserId: qInt(req, 'assigneeUserId'),
  periodId: qInt(req, 'periodId'),
})));

api.get('/mgmt-tasks/:id', requireAuth, wrap((req) =>
  mgmtSvc.mgmtTaskDetail(principalOf(req), pInt(req, 'id'))));

api.post('/mgmt-tasks', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return mgmtSvc.createMgmtTask(principalOf(req), {
    title: String(b.title ?? ''), group: String(b.group ?? ''),
    branchId: b.branchId ? Number(b.branchId) : null,
    assigneeUserId: b.assigneeUserId ? Number(b.assigneeUserId) : null,
    assigneeName: typeof b.assigneeName === 'string' ? b.assigneeName : null,
    watcherUserId: b.watcherUserId ? Number(b.watcherUserId) : null,
    due: b.due ?? null, note: b.note ?? null,
    parentTaskId: b.parentTaskId ? Number(b.parentTaskId) : null,
    caseIds: Array.isArray(b.caseIds) ? b.caseIds.map(Number) : [],
    unitReportId: b.unitReportId ? Number(b.unitReportId) : null,
    idempotencyKey: b.idempotencyKey,   // PR-GVa: chuẩn hoá ở `chuanKhoaGui` (chuỗi lạ → không khoá)
  });
}));

api.post('/mgmt-tasks/:id/update', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return mgmtSvc.updateMgmtTask(principalOf(req), pInt(req, 'id'), {
    progress: String(b.progress ?? ''), note: b.note ?? null, reason: b.reason ?? null,
    on: b.on ?? null, reviewOn: b.reviewOn ?? null,
    helpUserId: b.helpUserId ? Number(b.helpUserId) : null, helpName: b.helpName ?? null,
  });
}));

api.patch('/mgmt-tasks/:id', requireAuth, wrap((req) =>
  mgmtSvc.editMgmtTask(principalOf(req), pInt(req, 'id'), req.body ?? {})));

// ============================================================ Quản trị (lối phụ)

api.put('/admin/role-permissions', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  /* UX-C7 (Q23): chế độ "Sửa quyền" gửi `thayDoi: [{ roleKey, permissionKey, granted }]` — một lần lưu, một giao dịch. Dạng một ô cũ vẫn nhận. */
  if (b.thayDoi !== undefined) return sysconfigSvc.setRolePermissions(principalOf(req), b.thayDoi);
  return sysconfigSvc.setRolePermission(principalOf(req), {
    roleKey: String(b.roleKey ?? ''),
    permissionKey: String(b.permissionKey ?? ''),
    granted: !!b.granted,
  });
}));

/** PR-QU (D): ma trận vai × quyền (+ quyền suy ra cho cột GVCN, + lý do ô khoá) và tầm ảnh hưởng của một ô trước khi bật/tắt. */
api.get('/admin/permissions/matrix', requireAuth, wrap((req) => sysconfigSvc.maTranQuyen(principalOf(req))));
api.get('/admin/roles/:key/permissions/:perm/impact', requireAuth, wrap((req) =>
  sysconfigSvc.anhHuongOVai(principalOf(req), String(req.params.key), String(req.params.perm))));

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
  gioiHan.chanNeuBiKhoa('dang_nhap_ip', ip, gioiHan.cauKhoaDangNhapIp);
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
  /* MH1: kỹ năng phụ trách được chỉ 5 ô L · R · W1 · W2 · S. */
  skills: [...ENTRY_SKILLS],
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
api.put('/admin/accounts/:id/skills', requireAuth, wrap((req) => accountSvc.setUserSkills(
  principalOf(req), Number(req.params.id), Array.isArray(req.body?.skills) ? req.body.skills.map(String) : [],
)));
api.put('/admin/accounts/:id/permissions', requireAuth, wrap((req) => accountSvc.setUserPermissions(
  principalOf(req), Number(req.params.id), Array.isArray(req.body?.items) ? req.body.items : [], req.body?.lyDo ?? null,
)));
api.post('/admin/accounts/:id/password', requireAuth, wrap((req) => accountSvc.resetPassword(
  principalOf(req), Number(req.params.id), String(req.body?.password ?? ''),
)));
/** Tài khoản › ⋯ › Xoá tài khoản — CHỈ Quản trị hệ thống (PR-XOA): xoá hẳn nếu chưa có dấu vết, xoá mềm nếu có. */
api.get('/admin/accounts/:id/xoa', requireAuth, wrap((req) => xoaTaiKhoanSvc.xemXoaTaiKhoan(principalOf(req), pInt(req, 'id'))));
api.post('/admin/accounts/:id/xoa', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xoaTaiKhoanSvc.xoaTaiKhoan(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Lộ trình và loại lớp — nay là dữ liệu, Quản trị hệ thống sửa được (mục 7.3). */
/* PR-Dọn (quét #10): danh mục cần đăng nhập; số "đang dùng" (lộ quy mô) chỉ ở bản Quản trị. */
api.get('/ref/routes', requireAuth, wrap(() => sysconfigSvc.listRoutes()));
api.get('/admin/routes', requireAuth, wrap((req) => {
  require_(principalOf(req), PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống xem được danh mục lộ trình đầy đủ.');
  return sysconfigSvc.listRoutes(true);
}));
api.put('/admin/routes', requireAuth, wrap((req) => sysconfigSvc.saveRoute(principalOf(req), req.body ?? {})));
api.get('/admin/programmes', requireAuth, wrap((req) => sysconfigSvc.listProgrammes(principalOf(req))));
api.put('/admin/programmes', requireAuth, wrap((req) => sysconfigSvc.saveProgramme(principalOf(req), req.body ?? {})));
