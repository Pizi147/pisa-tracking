import { Router, type Request } from 'express';
import multer from 'multer';
import { db, isInitialised } from '../db.ts';
import { laBanChinh } from '../moiTruong.ts';
import {
  ENTRY_SKILLS, THEO_DONG, ghepMucTieu, tenMonNgan, canNamGan, docBoLocXuatMt, kiemGhiRoKhac, laKhac, soSanhLop, transferReasonText,
  PERMISSIONS, ROLE_LABEL, coTheDoiGocNhin, tenMon, WORK_SCOPES, chuongTrinhTuThamSo, ctTuyChon, khoangTuThamSo, thamSoNguoi, tuDauKhoang,
  khoangTuUrl, loiKhoang, mondayOfDate,
  type Role, type TheoDong, type WorkScope,
} from '../../../shared/domain/index.ts';
import { demoToday, getConfig, scenarioMode, setConfig } from '../demoConfig.ts';
import { HttpError, badRequest, chuTuDo, forbidden, isIsoDate, loi, notFound, toInt } from '../util.ts';
import { SESSION_COOKIE, createSession, datGocNhin, destroySession, principalOf, requireAuth } from '../auth.ts';
import { can, loadPrincipal, permissionSummary, require_, scopeFor, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { khungPhamVi, navOf } from '../platform/nav.ts';
import * as attachmentSvc from '../platform/attachments.ts';
import * as timNguoiSvc from '../platform/timNguoi.ts';
import { chonTutor } from '../tutors/chon.ts';
import * as tutorSvc from '../tutors/trang.ts';
import { taiLenTutor } from '../tutors/taiLen.ts';
import * as violationSvc from '../yThuc/violations.ts';
import * as accessSvc from '../yThuc/access.ts';
import * as xuLySvc from '../yThuc/xuLy.ts';
import * as loYThucSvc from '../yThuc/lo.ts';
import * as phoiHopSvc from '../yThuc/phoiHop.ts';
import * as baoPhSvc from '../yThuc/baoPhTvv.ts';
import * as sosAutoSvc from '../cases/sosAuto.ts';
import * as doiPaSvc from '../cases/doiPa.ts';
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
import * as buocTiepSvc from '../loTrinh/buocTiep.ts';
import * as tongKetSvc from '../loTrinh/tongKet.ts';
import * as profileSvc from '../students/profile.ts';
import { hanhTrinhHocVien } from '../students/hanhTrinh.ts';
import { docHet, thongBaoCua } from '../platform/thongBao.ts';
import { dongBoKhiMoChuong } from '../platform/thongBaoTuDong.ts';
import { daGhi } from '../platform/thongBaoTuDong.ts';   // OV-15h1
import * as tongQuanQlSvc from '../worklist/tongQuanQl.ts';   // OV-15h1
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
import * as kyVongSvc from '../normal/kyVong.ts';
import * as gopYSvc from '../classes/gopYTuan.ts';
import * as baiLopSvc from '../students/baiTrenLop.ts';
import * as luatLoTrinhSvc from '../classes/luatLoTrinh.ts';
import * as hocVienLopSvc from '../classes/hocVienLop.ts';
import * as lichThiSvc from '../classes/lichThi.ts';
import * as xuatDsSvc from '../classes/xuatDanhSach.ts';
import * as hocVienSosSvc from '../classes/hocVienSos.ts';
import { hocVienTheoVai } from '../classes/hocVienTheoVai.ts';
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
import * as lichSuSuaSvc from '../students/lichSuSua.ts';
import * as lichSuSvc from '../platform/lichSu.ts';
import * as meetingSvc from '../worklist/meeting.ts';
import {
  PERIOD_WINDOW_PLANNING_FORWARD_WEEKS,
  ensurePeriod, listPeriods, periodById, periodWindow, reportEditWindow,
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
import * as hieuQuaPaSvc from '../phanTich/hieuQuaPa.ts';
import * as yThucPhanTichSvc from '../phanTich/yThucPhanTich.ts';
import * as giaoVienPtSvc from '../phanTich/giaoVien.ts';
import * as baoCaoSvc from '../phanTich/baoCao.ts';
import * as ketQuaThiSvc from '../phanTich/ketQuaThi.ts';
import { khungPtGvTuThamSo } from '../../../shared/domain/index.ts';   // PR-Pb2-b: dòng riêng (Hợp đồng a↔b — không sửa import chung)
import { metricResponse, metricSet, rowsFor } from '../worklist/metrics.ts';
import { NHOM_VIEC_TVV, myWork, viecCuaNguoi } from '../worklist/mywork.ts';
import { bangGvChiNhanh, hoSoGiaoVien, ketQuaHoSoGv, oHoSoGv, viecHoSoGv } from '../giaoVien/hoSo.ts';
import { phamViXemViec } from '../worklist/xemViec.ts';
import { soHocVien } from '../worklist/hvCuaToi.ts';
import { tongQuanMt } from '../worklist/tongQuanMt.ts';
import * as caseSvc from '../cases/cases.ts';
import * as regularSvc from '../normal/regular.ts';
import * as chamSvc from '../cham/canCham.ts';
import * as diemTheoLuotSvc from '../cham/diemTheoLuot.ts';
import { luuDiemLo } from '../cham/luuLo.ts';

export const api = Router();

/*
 * PR-OV2a — TEST VÀ CÔNG VIỆC LÀ HAI KHU CÓ QUYỀN VÀO RIÊNG (`test.view`, `work.view`). TVV, CX có `attempt.view` để xem điểm / Case trong
 * hồ sơ HV, lớp, lượt — nhưng không vào danh sách của Test (Lịch Test, Điểm theo lớp, Kế hoạch Test) hay Công việc. Chặn ở đây, một chỗ,
 * theo đường; ghi điểm / xếp lịch vẫn tự kiểm quyền riêng. `/yeu-cau?studentId=` (đầu hồ sơ HV, hồ sơ lượt) không phải khu Công việc.
 */
const KHU_TEST = [/^\/cham\/lich-test\/?$/, /^\/diem-theo-lop(\/|$)/, /^\/ke-hoach-test(\/|$)/];
const KHU_VIEC = [/^\/my-work(\/|$)/, /^\/mgmt-tasks(\/|$)/, /^\/meeting(\/|$)/, /^\/tasks(\/|$)/, /^\/signals\/?$/, /^\/yeu-cau\/dem\/?$/];
api.use((req, _res, next) => {
  const p = req.principal;
  if (!p) { next(); return; }
  /* Express so đường KHÔNG phân biệt hoa thường (`/MY-WORK` vẫn tới `/my-work`) — so bản chữ thường, không thì đổi chữ là lọt chặn. */
  const duong = req.path.toLowerCase();
  const laViec = KHU_VIEC.some((r) => r.test(duong)) || (/^\/yeu-cau\/?$/.test(duong) && req.method === 'GET' && !req.query.studentId);
  const quyen = KHU_TEST.some((r) => r.test(duong)) ? PERMISSIONS.TEST_VIEW : laViec ? PERMISSIONS.WORK_VIEW : null;
  if (quyen && !can(p, quyen, { anyScope: true })) {
    next(forbidden(quyen === PERMISSIONS.TEST_VIEW ? 'Vai trò của bạn không có khu Test.' : 'Vai trò của bạn không có khu Công việc.'));
    return;
  }
  next();
});

/* OV-15h1: ghi thành công → lần mở chuông kế của người đó đồng bộ thông báo tự động ngay (việc vừa xong hết khỏi "Cần làm", không chờ 5 phút). */
api.use((req, res, next) => {
  const id = req.method !== 'GET' ? req.principal?.userId : undefined;
  if (id) res.on('finish', () => { if (res.statusCode < 400) daGhi(id); });
  next();
});

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
  next(loi(404, 'Không tìm thấy endpoint.'));
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
    /* PR-EN: ngôn ngữ của tài khoản (null = chưa chọn) — web đồng bộ với máy (`web/src/lib/session.tsx`). */
    ngonNgu: p.ngonNgu ?? null,
    /* HD-a: dải "Mới dùng PISA?" ở Tổng quan chỉ hiện khi false. */
    daXemHuongDan: !!p.daXemHuongDan,
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
    /* PR-OV2a: menu "Góc nhìn" — chỉ QL / Quản trị nắm ≥ 2 vai; null = không có menu. */
    gocNhin: gocNhinCua(p),
    /* UX-2 (5): khung có lớp trong phạm vi — công tắc Fast Track / Lớp thường. */
    khungPhamVi: khungPhamVi(p),
  };
}));

/**
 * PR-OV2a: dữ liệu menu Góc nhìn + dải "Góc nhìn: {vai} · {phạm vi} · Về {vai gốc}". Phạm vi đọc từ MỌI grant / phân công của tài khoản
 * (principal của phiên đã lọc theo góc nhìn) — một lần đọc lại, chỉ cho người đổi được góc nhìn.
 */
function gocNhinCua(p: Principal) {
  const vaiGoc = p.vaiGoc ?? p.roleKeys;
  if (!coTheDoiGocNhin(vaiGoc)) return null;
  const du = p.gocNhin ? loadPrincipal(p.userId) : p;
  const lopIds = [...new Set(du.assignments.map((a) => a.classId))];
  const lop = new Map<number, { code: string; ct: string | null }>();
  if (lopIds.length) {
    for (const r of db().prepare(`SELECT id, code, programme_code FROM classes WHERE id IN (${lopIds.map(() => '?').join(',')})`).all(...lopIds) as any[]) {
      lop.set(r.id, { code: r.code, ct: r.programme_code ?? null });
    }
  }
  const phamVi = (role: string) => {
    if (role === 'teacher') {
      const ds = [...new Set(du.assignments.map((a) => {
        const l = lop.get(a.classId);
        return l ? `${a.isCore ? 'GVCN' : tenMon(l.ct, a.skill ?? '')} ${l.code}` : null;
      }).filter(Boolean))];
      return ds.join(' · ') || 'chưa có lớp';
    }
    const cn = du.grants.filter((g) => g.roleKey === role).map((g) => g.branchName ?? 'Toàn hệ thống');
    return [...new Set(cn)].join(' · ');
  };
  const goc = vaiGoc.includes('system_admin') ? 'system_admin' : 'manager';
  return {
    dangChon: p.gocNhin ?? null,
    vaiGoc: goc,
    coThe: vaiGoc.map((role) => ({ role, nhan: ROLE_LABEL[role as Role] ?? role, phamVi: phamVi(role) })),
  };
}

/** PR-OV2a: đổi góc nhìn (`role` = vai đang nắm) hoặc về vai gốc (`role: null`). Máy chủ lọc quyền theo vai này ở MỌI request sau. */
api.put('/session/goc-nhin', requireAuth, wrap((req) => {
  const p = principalOf(req);
  const role = req.body?.role ?? null;
  if (role !== null && typeof role !== 'string') throw badRequest('Vai không hợp lệ.');
  const vaiGoc = p.vaiGoc ?? p.roleKeys;
  if (!coTheDoiGocNhin(vaiGoc)) throw forbidden('Chỉ Quản lý hoặc Quản trị hệ thống nắm từ hai vai trở lên mới đổi được góc nhìn.');
  if (role !== null && !vaiGoc.includes(role)) throw forbidden('Tài khoản này không nắm vai đó.');
  datGocNhin(req.sessionToken!, role);
  return { ok: true, gocNhin: role };
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
  /*
   * PR-QU (B): panel "+ Lớp mới" chỉ bày chi nhánh người này có `class.create`. OV-13p: `phanCong` = `class.assign` ở chi nhánh đó — web hiện khối
   * Phân công theo cờ này (TVV / CX không có), không đoán qua lỗi 403 của `/ref/teachers`.
   */
  if (req.query.muc === 'tao-lop') {
    const duoc = new Set(hocVienLopSvc.chiNhanhTaoLop(p));
    return all.filter((b) => duoc.has(b.id)).map((b) => ({ ...b, phanCong: can(p, PERMISSIONS.CLASS_ASSIGN, { branchId: b.id }) }));
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
  /* OV-11h (PT-10): `tg` = số tuần của Phân tích → thêm lớp đã kết thúc có lượt trong khoảng (`ket_thuc: true`, web xếp nhóm "Đã kết thúc"). */
  const tg = qInt(req, 'tg');
  const khoang = khoangOf(req);   // OV-15e: bộ chọn thời gian chung của Phân tích
  return [
    ...rows
      .filter((c) => scope.all || scope.branchIds.includes(c.branch_id) || scope.classIds.includes(c.id))
      .filter((c) => !branchId || c.branch_id === branchId),
    ...(khoang ? tongHopSvc.lopKetThucCoLuot(p, 0, branchId ?? null, khoang) : tg ? tongHopSvc.lopKetThucCoLuot(p, tg, branchId ?? null) : []),
  ].filter((c) => !fastTrackOnly || c.scoring_mode === 'ielts_band');
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

/** TU-a: ô chọn tutor (Ghi kết quả PA Tutor theo `paId`; ô Người dạy PA Tutor theo `studentId`) — 3 số cuối SĐT, ≤ 20 dòng (`tutors/chon.ts`). */
api.get('/tutors/chon', requireAuth, wrap((req) =>
  chonTutor(principalOf(req), { q: qStr(req, 'q'), paId: qInt(req, 'paId'), studentId: qInt(req, 'studentId'), classId: qInt(req, 'classId') })));

/*
 * TU-b: TRANG TUTOR (đặc tả Tutor mục 7, 8) — quyền kiểm trong `tutors/trang.ts` / `taiLen.ts`: đọc `tutor.view` (QL: buổi lớp chi nhánh mình), ghi `tutor.manage`.
 * Khoảng thời gian = bộ chọn chung của Phân tích (`kieu`/`tu`/`den`; vắng = 2 tuần vừa qua). Đường cố định đặt TRƯỚC `/tutors/:id`.
 */
const khoangTutor = (req: Request) => khoangOf(req) ?? (({ tu, den }) => ({ tu, den }))(khoangTuUrl({ get: () => null }, demoToday()));
api.get('/tutors', requireAuth, wrap((req) => tutorSvc.bangTutor(principalOf(req), khoangTutor(req))));
api.get('/tutors/dem', requireAuth, wrap((req) => tutorSvc.demChuY(principalOf(req))));
api.get('/tutors/go-tay', requireAuth, wrap((req) => tutorSvc.tenGoTay(principalOf(req))));
api.post('/tutors/gop', requireAuth, wrap((req) => tutorSvc.gopTen(principalOf(req), req.body)));
api.post('/tutors/gop/hoan-tac', requireAuth, wrap((req) => tutorSvc.hoanTacGop(principalOf(req), req.body)));
api.post('/tutors/tai-len', requireAuth, wrap((req) => taiLenTutor(principalOf(req), req.body)));
api.post('/tutors', requireAuth, wrap((req) => tutorSvc.luuTutor(principalOf(req), req.body)));
api.patch('/tutors/nhan-xet/:id', requireAuth, wrap((req) => tutorSvc.suaNhanXet(principalOf(req), pInt(req, 'id'), req.body)));
api.delete('/tutors/nhan-xet/:id', requireAuth, wrap((req) => tutorSvc.xoaNhanXet(principalOf(req), pInt(req, 'id'))));
api.get('/tutors/:id', requireAuth, wrap((req) => tutorSvc.panelTutor(principalOf(req), pInt(req, 'id'), khoangTutor(req))));
api.patch('/tutors/:id', requireAuth, wrap((req) => tutorSvc.luuTutor(principalOf(req), req.body, pInt(req, 'id'))));
api.delete('/tutors/:id', requireAuth, wrap((req) => tutorSvc.xoaTutor(principalOf(req), pInt(req, 'id'))));
api.post('/tutors/:id/nhan-xet', requireAuth, wrap((req) => tutorSvc.ghiNhanXet(principalOf(req), pInt(req, 'id'), req.body)));

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
/* PR-VN3 (GOP): web chỉ đọc `dong` + `summary` — bỏ `items` / `groups` khỏi JSON (nặng ~3 lần); hàm giữ nguyên cho Nhắc và hồ sơ GV. */
const nheMyWork = ({ items: _items, groups: _groups, ...con }: any) => con;
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
    if (!phamViXemViec(p)) throw forbidden('Bạn chỉ xem được việc của mình.');
    return nheMyWork(myWork(p, { branchId, nguoi: 'tat-ca' }));
  }
  if (typeof nguoi === 'number') return nheMyWork(viecCuaNguoi(p, nguoi, branchId));

  return nheMyWork(myWork(p, { branchId }));
}));

/** OV-14c: hàng đợi "Chấm Speaking" của GV Speaking (panel của việc `KHOA_CHAM_SPEAKING`) — mỗi em một ô S Mock (`baiChamSpeaking`). */
api.get('/my-work/cham-speaking', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return attemptSvc.baiChamSpeaking(principalOf(req));
}));

/* OV-12h (chủ SP 14/10): bỏ hẳn Nhắc — `/my-work/nhac`, `/my-work/nhac-nhieu`, `/yeu-cau/nhac-nhieu`, `/lenh-chuyen/:id/nhac` (404). */
/* PR-S6F-b (D14): `/my-work/dem` đã bỏ — badge GV đọc `summary.overdue` của chính `/my-work` (web gộp GET đang bay, không tính `myWork` hai lần). */

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
  const p = principalOf(req);
  return keHoachSvc.luuLichKemGhiChu(p, ghiChuKem(req.body?.ghiChu), () => keHoachSvc.luuDot(p, {
    attemptId, kyNang, lyDoBo: req.body.lyDoBo ?? null, force: !!req.body.force, reason: req.body.reason ?? null,
  }));
}));

/** OV-15h2 (ý 5): ghi chú lịch thi đi kèm lần lưu lịch (`/dot`, `/xep-moi`) — một giao dịch; thiếu lớp → 400. */
function ghiChuKem(g: any) {
  if (g === undefined || g === null) return null;
  const classId = toInt(g?.classId);
  if (!classId) throw badRequest('Thiếu lớp của ghi chú.');
  return { classId, studentId: toInt(g.studentId), dot: typeof g.dot === 'string' ? g.dot : null, noiDung: g.noiDung };
}

api.post('/ke-hoach-test/xep-moi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const studentId = toInt(req.body?.studentId);
  if (!studentId) throw badRequest('Thiếu học viên.');
  const tuan = tuanTheoKyNang(req.body?.tuan);
  const p = principalOf(req);
  const ghi = ghiChuKem(req.body?.ghiChu);
  if (req.body?.kind) {
    const classId = toInt(req.body?.classId);
    if (!classId) throw badRequest('Thiếu lớp.');
    return keHoachSvc.luuLichKemGhiChu(p, ghi, () => keHoachSvc.xepMoiThuong(p, { classId, studentId, kind: req.body.kind, tuan, force: !!req.body.force }));
  }
  return keHoachSvc.luuLichKemGhiChu(p, ghi, () => keHoachSvc.xepMoi(p, {
    studentId, attemptNo: toInt(req.body?.attemptNo) ?? undefined, tuan, bo: Array.isArray(req.body?.bo) ? req.body.bo : [],
    lyDoBo: req.body?.lyDoBo ?? null, force: !!req.body?.force,
  }));
}));

api.post('/ke-hoach-test/hang-loat', requireAuth, wrap((req) => {
  if (!req.body?.xemTruoc) maybeSimulateSaveFailure();
  const classId = toInt(req.body?.classId);
  if (!classId) throw badRequest('Thiếu lớp.');
  /* T13b (PR-MTb): `attemptNo` = 'moi' (MT mới của từng em) hoặc số; giá trị rác → 400, không bỏ qua âm thầm. `kyNang` = kỹ năng được tick. */
  const dot = req.body?.attemptNo;
  const attemptNo = dot === 'moi' ? 'moi' as const : dot === undefined || dot === null || dot === '' ? undefined : (toInt(dot) ?? NaN);
  return keHoachSvc.xepHangLoat(principalOf(req), {
    classId, attemptNo, kind: req.body?.kind || undefined,
    kyNang: req.body?.kyNang === undefined || req.body?.kyNang === null ? undefined : req.body.kyNang,
    studentIds: Array.isArray(req.body?.studentIds) ? req.body.studentIds.map((x: any) => toInt(x)).filter(Boolean) : [],
    tuan: tuanTheoKyNang(req.body?.tuan), force: !!req.body?.force, xemTruoc: !!req.body?.xemTruoc,
    /* PR-XLMT (K4-17, T37): đợt riêng từng em (Quản lý bấm chip), kỹ năng cho thi lại, lý do. */
    dotTheoEm: req.body?.dotTheoEm && typeof req.body.dotTheoEm === 'object' ? req.body.dotTheoEm : undefined,
    thiLai: req.body?.thiLai && typeof req.body.thiLai === 'object' ? req.body.thiLai : undefined,
    lyDo: typeof req.body?.lyDo === 'string' ? req.body.lyDo : null,
  });
}));

/* OV-15c: tìm lớp / học viên / email (C18), ghi chú lịch thi (C21), xuất Kế hoạch Test 13 cột (C17) + Xuất điểm Test. */
api.get('/ke-hoach-test/tim', requireAuth, wrap((req) =>
  keHoachSvc.timKeHoach(principalOf(req), { q: String(req.query?.q ?? '').slice(0, 100), branchId: toInt(req.query?.branchId) })));

api.post('/ke-hoach-test/ghi-chu', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const classId = toInt(req.body?.classId);
  if (!classId) throw badRequest('Thiếu lớp.');
  return keHoachSvc.luuGhiChu(principalOf(req), { classId, studentId: toInt(req.body?.studentId), dot: typeof req.body?.dot === 'string' ? req.body.dot : null, noiDung: req.body?.noiDung });
}));

api.get('/ke-hoach-test/ghi-chu/lich-su', requireAuth, wrap((req) => {
  const classId = toInt(req.query?.classId);
  if (!classId) throw badRequest('Thiếu lớp.');
  return keHoachSvc.lichSuGhiChu(principalOf(req), { classId, studentId: toInt(req.query?.studentId), dot: typeof req.query?.dot === 'string' ? req.query.dot : null });
}));

/** Danh sách id lớp `[1, 2]` — phần tử lạ → 400 (không bỏ qua âm thầm). */
function dsLop(v: unknown): number[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > 200) throw badRequest('Danh sách lớp không hợp lệ.');
  const ids = v.map((x) => toInt(x));
  if (ids.some((x) => !x)) throw badRequest('Danh sách lớp không hợp lệ.');
  return [...new Set(ids as number[])];
}

api.post('/ke-hoach-test/xuat', requireAuth, wrap((req) =>
  keHoachSvc.xuatKeHoach(principalOf(req), { branchId: toInt(req.body?.branchId), classIds: dsLop(req.body?.classIds), xemTruoc: !!req.body?.xemTruoc,
    chiXepLai: req.body?.chiXepLai === true })));

api.post('/ke-hoach-test/xuat-diem', requireAuth, wrap((req) => {
  const b = req.body ?? {};
  const noiDung = b.noiDung === 'chi-diem' || b.noiDung === 'diem-nhan-xet' ? b.noiDung : null;
  if (!noiDung) throw badRequest('Chọn Điểm + nhận xét hoặc Chỉ điểm.');
  const mtTu = toInt(b.mtTu), mtDen = toInt(b.mtDen);
  const coMt = b.mtTu != null || b.mtDen != null;
  if (coMt && (!mtTu || !mtDen || mtTu < 0 || mtDen > 20 || mtTu > mtDen)) throw badRequest('Khoảng MT không hợp lệ.');
  const coTuan = b.tuanTu != null || b.tuanDen != null;
  if (coTuan && (!isIsoDate(b.tuanTu) || !isIsoDate(b.tuanDen) || b.tuanTu > b.tuanDen)) throw badRequest('Khoảng tuần không hợp lệ.');
  return keHoachSvc.xuatDiemTest(principalOf(req), {
    branchId: toInt(b.branchId), classIds: dsLop(b.classIds), noiDung, xemTruoc: !!b.xemTruoc,
    mt: coMt ? [mtTu!, mtDen!] : null, tuan: coTuan ? [b.tuanTu, b.tuanDen] : null,
  });
}));

api.get('/ke-hoach-test/thuong/:classId', requireAuth, wrap((req) => {
  regularSvc.quetCheckpoint(pInt(req, 'classId'));   // OV-6b2: lớp liên tục — Checkpoint kế tiếp cho em đã qua tuần thi
  return keHoachSvc.luoiThuong(principalOf(req), pInt(req, 'classId'));
}));

/**
 * OV-15e (C29): BỘ CHỌN THỜI GIAN CHUNG — `kieu`/`tu`/`den` (ngày) → khoảng; sai → 400. Không có `kieu` và thiếu một trong `tu`/`den` → null (đường cũ
 * giữ mặc định riêng: `tg`, `thang`, `tu` một mình của Hiệu quả PA).
 */
function khoangOf(req: Request): { tu: string; den: string } | null {
  const get = (k: string) => qStr(req, k) ?? null;
  if (!get('kieu') && !(get('tu') && get('den'))) return null;
  const k = khoangTuUrl({ get }, demoToday());
  const l = loiKhoang(k);
  if (l) throw badRequest(l);
  return { tu: k.tu, den: k.den };
}
/** Hiệu quả PA / Phân tích GV đọc theo TUẦN: Thứ Hai tuần đầu / tuần cuối của khoảng chung; không có khoảng chung → giá trị cũ. */
function tuanKhoangOf(req: Request, cu: { tu?: string | null; den?: string | null }) {
  const k = khoangOf(req);
  return k ? { tu: mondayOfDate(k.tu), den: mondayOfDate(k.den) } : cu;
}

/*
 * PHÂN TÍCH (PR-Pb, §3.3; PR-UX4) — Tổng hợp Test + SOS, Tổng hợp vấn đề HV, Hiệu quả PA, Ý thức, Bỏ quên.
 * Quyền `meeting.view` được kiểm ngay trong từng dịch vụ (`phanTich/phamVi.ts` cho các đường mới).
 */
const filterTongHopOf = (req: Request) => ({
  branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  soTuan: khoangTuThamSo(qStr(req, 'tg')), classId: qInt(req, 'lop') ?? null,
  theo: (THEO_DONG as readonly string[]).includes(qStr(req, 'theo') ?? '') ? (qStr(req, 'theo') as TheoDong) : 'tuan',
  ...khoangOf(req),
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
/* Hiệu quả PA (PR-UX4; PR-Pb2-a): PA GV thêm / PA theo quy chế. `gv`, `tu`, `den` — tên CHỐT trong Hợp đồng a↔b; `tu`/`den` thắng `tg`. */
const filterHieuQuaPaOf = (req: Request) => ({
  branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  classId: qInt(req, 'lop') ?? null, soTuan: khoangTuThamSo(qStr(req, 'tg')),
  gv: qStr(req, 'gv') ?? null, ...tuanKhoangOf(req, { tu: qStr(req, 'tu') ?? null, den: qStr(req, 'den') ?? null }),
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
  from: khoangOf(req)?.tu ?? tuDauKhoang(demoToday(), khoangTuThamSo(qStr(req, 'tg'))), to: khoangOf(req)?.den ?? demoToday(),
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
  ...(qStr(req, 'kieu') ? { ...tuanKhoangOf(req, {}), thang: null } : { tu: qStr(req, 'tu') ?? null, den: qStr(req, 'den') ?? null, thang: qStr(req, 'thang') ?? null }),
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
/* OV-15e (C30): panel một chỉ số khác Chấm điểm của một GV — `cot` = ket-qua:<kỹ năng> · tien-bo · ghi-pa · vi-pham · pa-hieu-qua. */
api.get('/phan-tich/giao-vien/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const gv = soDuong(req.query.gv, 'gv');
  if (gv == null) throw badRequest('Thiếu giáo viên.');
  return giaoVienPtSvc.oChiSoGv(principalOf(req), { ...filterPtGvOf(req), gv, cot: qStr(req, 'cot') ?? '' });
}));
/* OV-15e: Báo cáo (C24–C26) + Kết quả thi (C27) — bộ chọn thời gian chung (`kieu`/`tu`/`den`; vắng = 2 tuần vừa qua). */
const filterBaoCaoOf = (req: Request) => {
  const k = khoangOf(req) ?? khoangTuUrl({ get: () => null }, demoToday());
  return { branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')), classId: qInt(req, 'lop') ?? null, tu: k.tu, den: k.den };
};
api.get('/phan-tich/bao-cao', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return baoCaoSvc.baoCao(principalOf(req), filterBaoCaoOf(req));
}));
api.get('/phan-tich/bao-cao/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return baoCaoSvc.oBaoCao(principalOf(req), { ...filterBaoCaoOf(req), o: qStr(req, 'o') ?? '' });
}));
api.get('/phan-tich/ket-qua-thi', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const f = filterBaoCaoOf(req);
  if (qStr(req, 'loai') === 'thi-that') return ketQuaThiSvc.ketQuaThiThatKq(principalOf(req), f);
  const kq = qStr(req, 'kq');
  return ketQuaThiSvc.ketQuaMockKq(principalOf(req), {
    ...f, xep: qStr(req, 'xep') === 'sos' ? 'sos' : 'lop', kq: kq === 'dat' || kq === 'chua-dat' || kq === 'chua-du' ? kq : null,
  });
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
    req.body?.skipped !== false, req.body?.reason, { xoaDiem: req.body?.xoaDiem === true });
}));

/** PR-MTGON: "Đưa lại cả 4 kỹ năng" — mọi kỹ năng đã huỷ của lượt về đợt, một lần. */
api.post('/attempts/:id/dua-lai-ca-luot', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return attemptSvc.duaLaiCaLuot(principalOf(req), pInt(req, 'id'));
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

/** OV-15c (mục 6): kỹ năng huỷ vì vắng 2 lần → "Khôi phục → Chưa xếp" (không đặt tuần; Quản lý xếp tự do sau đó). Vai khác 403. */
api.post('/attempts/:id/skills/:skill/khoi-phuc-chua-xep', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return absenceSvc.restoreCancelledSkill(principalOf(req), pInt(req, 'id'), String(req.params.skill), null, { reason: 'Khôi phục → Chưa xếp' });
}));

/** PR-MTa (T3): Quản lý "Xin dời" (vai khác 403) kỹ năng đã huỷ vì vắng 2 lần → thẻ Lịch thi ở Chờ duyệt `{ reason?, idempotencyKey? }`. */
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

/** LUAT-34 (T20b): Khôi phục điểm đã huỷ (FT: mọi ô của kỹ năng; lớp thường: môn) — một bấm, người sửa được ô. */
api.post('/attempts/:id/skills/:skill/khoi-phuc-diem', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return ketQuaHuySvc.khoiPhucDiem(principalOf(req), pInt(req, 'id'), String(req.params.skill));
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
  return attemptSvc.huyLuot(principalOf(req), pInt(req, 'id'), { lyDo: typeof req.body?.reason === 'string' ? req.body.reason : null, quaWeb: true });
}));

api.post('/attempts/:id/reopen', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  /* PR-OV4a: Khôi phục lượt — `banId` chọn bản huỷ khi có > 1 (mặc định mới nhất). */
  const banId = req.body?.banId;
  if (banId != null && !Number.isInteger(banId)) throw badRequest('Bản huỷ không hợp lệ.');
  return attemptSvc.reopenAttempt(principalOf(req), pInt(req, 'id'), { banId: banId ?? null });
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
    /* OV-12b: nhóm nguyên nhân (ô MT dưới kỳ vọng) — `saveScore` kiểm mã + luật nhận xét bắt buộc (cửa người dùng: `tuNguoiDung`). */
    nhomNguyenNhan: b.nhomNguyenNhan,
  }, undefined, { tuNguoiDung: true });
}));

/** OV-15b: Dán từ Excel — nhiều ô nhiều em một lần; mỗi dòng một giao dịch qua `saveScore` (quyền, nhận xét MT, band) — `cham/luuLo.ts`. */
api.post('/attempts/scores/lo', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return luuDiemLo(principalOf(req), req.body);
}));

/** OV-15h2 (ý 10): Dán từ Excel lớp thường — cùng `luuDiemLo`, mỗi ô qua `saveRegularScore`; một lần dán = một mục lịch sử. */
api.post('/regular/scores/lo', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return luuDiemLo(principalOf(req), req.body, 'thuong');
}));

/** OV-13k: "Nhận xét GV phụ trách" + nhóm nguyên nhân ô Speaking Mock chấm chéo — GV phụ trách S của lớp, GVCN, Quản lý; không đụng điểm. */
api.put('/attempts/:id/scores/speaking/phu-trach', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return attemptSvc.luuNhanXetPhuTrach(principalOf(req), pInt(req, 'id'), { nhanXetPhuTrach: b.nhanXetPhuTrach, nhomNguyenNhan: b.nhomNguyenNhan });
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

/** PR-DL — Điểm theo lớp: các lượt của lớp (mã `mt:<n>` / `thuong:<kind>` / OV-6b2 `cp:<n>`) + lượt mở sẵn. */
api.get('/classes/:classId/diem-theo-luot', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  regularSvc.quetCheckpoint(pInt(req, 'classId'));   // OV-6b2: lớp liên tục — Checkpoint kế tiếp cho em đã qua tuần thi
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

/** UX-2 (1): ô "Quá hạn chấm" của Lịch Test — `{ n, lop, khac, tieuDe }` từ `oQuaHanCham`; `?rows=1` thêm danh sách (panel `SoLieuO`, cùng hàm). */
api.get('/cham/lich-test/qua-han', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const pv = qStr(req, 'phamVi');
  const khung = qStr(req, 'khung');   // OV-14b: khung đang xem của Lịch Test
  return chamSvc.dsQuaHanCham(principalOf(req), {
    branchId: qInt(req, 'branchId'), phamVi: pv === 'cua-toi' || pv === 'tat-ca' ? pv : null, classId: qInt(req, 'classId') ?? null,
    khung: khung === 'ft' || khung === 'thuong' ? khung : null,
  }, demoToday(), qStr(req, 'rows') === '1');
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
  if (qStr(req, 'chiId') === '1') return classSvc.rosterIds(principalOf(req), pInt(req, 'id'));   // id + tên cho Trước/Sau (PR-TD2-b)
  return classSvc.classRoster(principalOf(req), pInt(req, 'id'), qStr(req, 'q'), qStr(req, 'kemKetThuc') === '1');   // OV-11g: Học viên & Lớp
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

/** PR-LUI-a1: chép một tệp đã tải sang nhiều bản ghi khác (một tệp trong kho, nhiều dòng). */
api.post('/attachments/chep', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return { rows: attachmentSvc.chepTep(principalOf(req), {
    tuId: toInt(b.tuId) ?? 0, ownerType: String(b.ownerType ?? ''),
    ownerIds: Array.isArray(b.ownerIds) ? b.ownerIds.map((x: unknown) => toInt(x) ?? 0) : [],
  }) };
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
/** OV-13d: chọn nhiều ở tab Ý thức lớp — mọi em đang học + em nào làm được hành động nào (lý do khi không). */
api.get('/classes/:id/y-thuc/lo', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return loYThucSvc.loYThucLop(principalOf(req), pInt(req, 'id'));
}));
/** OV-13d: ba hành động theo lô — mỗi em một giao dịch, kết quả từng em (`em[].ok` / `loi`). */
api.post('/classes/:id/y-thuc/lo/xu-ly', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return loYThucSvc.loXuLy(principalOf(req), pInt(req, 'id'), yThucBody(req));
}));
api.post('/classes/:id/y-thuc/lo/ghi-nhan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return loYThucSvc.loGhiNhan(principalOf(req), pInt(req, 'id'), yThucBody(req));
}));
api.post('/classes/:id/y-thuc/lo/cap-bac', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return loYThucSvc.loCapBac(principalOf(req), pInt(req, 'id'), yThucBody(req));
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
    studentId: toInt(b.studentId) ?? 0, category: b.category, ten: b.ten ?? null, description: b.description, occurredOn: b.occurredOn ?? null,
    skill: 'skill' in b ? (b.skill ?? null) : undefined, idempotencyKey: b.idempotencyKey ?? null,
  });
}));
/** PR-LUI-a1: một vi phạm cho nhiều học viên (≤ 8 mỗi lô) HOẶC nhiều vi phạm cho một học viên. Mỗi em một giao dịch; lỗi từng em trả về `loi`. */
api.post('/violations/nhieu', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return violationSvc.recordViolations(principalOf(req), {
    studentIds: Array.isArray(b.studentIds) ? b.studentIds.map((x: unknown) => toInt(x) ?? 0) : [],
    lines: Array.isArray(b.lines) ? b.lines : [], moTaRieng: b.moTaRieng ?? null, idempotencyKey: String(b.idempotencyKey ?? ''),
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
    ten: 'ten' in b ? (b.ten ?? null) : undefined, description: b.description, category: b.category, skill: 'skill' in b ? (b.skill ?? null) : undefined,
    occurredOn: 'occurredOn' in b ? (b.occurredOn ?? null) : undefined,
  });
}));
/** XOÁ THẲNG (rulebook v3, V11′–V14′): không lý do, không "đánh dấu không chính xác". Trả số biện pháp đã bị gỡ vi phạm này. */
api.delete('/violations/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return violationSvc.deleteViolation(principalOf(req), pInt(req, 'id'));
}));

/** PR-LUI-a1: Sửa vi phạm của lần xử lý đã xác nhận / Xoá lần xử lý mới nhất của chuỗi (bậc tính lại). Quyền kiểm ở `xuLy.ts` (Q5). */
api.patch('/discipline-measures/:id/vi-pham', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.suaViPhamXuLy(principalOf(req), pInt(req, 'id'), { violationIds: yThucBody(req).violationIds });
}));
/** LUAT-5: đường xoá cũ chỉ còn trả lỗi (GVCN 403 · QL 400) — lần xử lý đã lưu đi "Thu hồi…" kèm lý do. */
api.delete('/discipline-measures/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.xoaXuLy(principalOf(req), pInt(req, 'id'));
}));
/** LUAT-5 (luật 5): Thu hồi — GVCN gửi thẻ Chờ duyệt, QL thu hồi thẳng; lý do bắt buộc (máy chủ kiểm). */
api.post('/discipline-measures/:id/thu-hoi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.thuHoiXuLy(principalOf(req), pInt(req, 'id'), { lyDo: yThucBody(req).lyDo });
}));
/** OV-7a: sửa mô tả / ngày / người thực hiện của lần xử lý đã xong — chỉ trường có gửi mới đổi. Quyền như Sửa vi phạm. */
api.patch('/discipline-measures/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return xuLySvc.suaXuLy(principalOf(req), pInt(req, 'id'), { note: b.note, performedOn: b.performedOn, performerSelf: b.performerSelf, performerUserId: b.performerUserId, performerName: b.performerName });
}));

/** V4-1: Ghi nhận — "đã xem, không cần biện pháp". Vi phạm đang bắt buộc thì từ chối (V4-2). */
api.post('/students/:id/y-thuc/ghi-nhan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.ghiNhan(principalOf(req), pInt(req, 'id'), yThucBody(req).violationIds);
}));
/** OV-7a: Bỏ ghi nhận bấm nhầm — vi phạm về Mới. */
api.post('/students/:id/y-thuc/bo-ghi-nhan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.boGhiNhan(principalOf(req), pInt(req, 'id'), yThucBody(req).violationIds);
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
/** OV-7a: "Đã thực hiện" bấm nhầm → về QL đã duyệt, chờ thực hiện. */
api.post('/y-thuc/xu-ly/:id/chua-thuc-hien', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xuLySvc.chuaThucHien(principalOf(req), pInt(req, 'id'));
}));
/** V4-10: QL đã duyệt → GVCN ghi "Đã thực hiện". */
api.post('/y-thuc/xu-ly/:id/da-thuc-hien', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return xuLySvc.daThucHien(principalOf(req), pInt(req, 'id'), {
    performedOn: b.performedOn, performerUserId: b.performerUserId, performerName: b.performerName, note: b.note,
  });
}));

/** SV-YT-TVV: việc Báo PH sau lưu xử lý — xem (lịch sử mọi lần ghi) · ghi kết quả (một / nhiều việc) · Kết thúc ngoại lệ (lý do bỏ). Quyền kiểm trong `baoPhTvv.ts`. */
api.get('/y-thuc/bao-ph/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return baoPhSvc.xemViecBaoPh(principalOf(req), pInt(req, 'id'));
}));
api.post('/y-thuc/bao-ph/ghi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return baoPhSvc.ghiKetQuaBaoPh(principalOf(req), { viecIds: b.viecIds, ketQua: b.ketQua, ngay: b.ngay, ghiChu: b.ghiChu });
}));
api.post('/y-thuc/bao-ph/:id/bo', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = yThucBody(req);
  return baoPhSvc.boViecBaoPh(principalOf(req), pInt(req, 'id'), { lyDo: b.lyDo, lyDoKhac: b.lyDoKhac });
}));

/**
 * DRILL-DOWN DÙNG CHUNG CỦA MỌI CON SỐ (hợp đồng số liệu, PR-F). MỘT route, mọi chỉ số: nhận `id` của
 * chỉ số trong sổ và phạm vi, gọi ĐÚNG hàm đã sinh ra con số, áp CÙNG bộ quyền. Số là độ dài của tập;
 * `?rows=1` thêm dòng để vẽ danh sách. Hỏi chi nhánh ngoài quyền thì bị từ chối (403) — không trả tập
 * rút gọn; phạm vi rỗng trả rỗng, không hiểu thành toàn hệ thống.
 */
api.get('/metrics/:id', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const r = metricSet(p, String(req.params.id), {
    branchId: qInt(req, 'branchId'), skill: qStr(req, 'skill') ?? null,
    from: qStr(req, 'from') ?? null, to: qStr(req, 'to') ?? null, kind: qStr(req, 'kind') ?? null,
    program: ctTuyChon(qStr(req, 'ct')),   // PR-Pb2-a: vắng = gộp; chỉ số Ý thức / Phối hợp bỏ qua khung trong metricSet
    classId: qInt(req, 'classId'),
    ctLop: qStr(req, 'ctLop') ?? null,
  });
  return metricResponse(r, qStr(req, 'rows') === '1', p);
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
  /* OV-12f + SL2: góc "Đang SOS" = SOS hiện tại (`hv-sos-hien-tai`) trong phạm vi trang — không lọc tuần (link cũ `tuan=` bỏ qua). */
  if (qStr(req, 'goc') === 'sos') {
    return hocVienSosSvc.dangSos(principalOf(req), {
      phamVi: qStr(req, 'phamVi') ?? null, branchId: qInt(req, 'branchId') ?? null, cnNho: qInt(req, 'cnNho') ?? null, q: qStr(req, 'q') ?? null,
    });
  }
  return hocVienLopSvc.danhSachHocVienLop(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, q: qStr(req, 'q') ?? null, phamVi: qStr(req, 'phamVi') ?? null,
    cnNho: qInt(req, 'cnNho') ?? null, them: qStr(req, 'them') === '1',   // OV-15h2: nhãn Bộ lọc thêm
  });
}));

/** Trước/Sau của hồ sơ lớp mở bằng link (PR-TD2-b): id + cách chấm của `/hoc-vien-lop` mặc định, không nạp lượt. */
api.get('/hoc-vien-lop/ids', requireAuth, wrap((req) => hocVienLopSvc.idsHocVienLop(principalOf(req))));
/* OV-10b: Học viên & Lớp của TVV / CX — mỗi em một dòng theo việc của vai, chip = `chipHocVien` (cùng ô Tổng quan). */
api.get('/hoc-vien-lop/theo-vai', requireAuth, wrap((req) => hocVienTheoVai(principalOf(req), { phamVi: qStr(req, 'phamVi'), branchId: qInt(req, 'branchId') })));

/** OV-15f: Học viên & Lớp › Lịch thi — rà soát lịch thi thật theo tháng dự kiến (mockup 5); lưu một kết luận / ghi chú họp qua `updateCycle` + nhật ký. */
api.get('/hoc-vien-lop/lich-thi', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return lichThiSvc.danhSachLichThi(principalOf(req), {
    thang: qStr(req, 'thang') ?? null, branchId: qInt(req, 'branchId') ?? null, q: qStr(req, 'q') ?? null, phamVi: qStr(req, 'phamVi') ?? null, cnNho: qInt(req, 'cnNho') ?? null,
  });
}));
api.put('/hoc-vien-lop/lich-thi/:cycleId', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return lichThiSvc.luuLichThi(principalOf(req), pInt(req, 'cycleId'), req.body ?? {});
}));
/** OV-15f (C31): Xuất Excel danh sách học viên — nhận chính danh sách em web đang hiện (kế thừa bộ lọc), kiểm quyền xem từng em. `xemTruoc` không ghi nhật ký. */
api.post('/hoc-vien-lop/xuat', requireAuth, wrap((req) => xuatDsSvc.xuatDanhSach(principalOf(req), {
  ids: Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0) : [],
  mau: req.body?.mau, cot: req.body?.cot, boLoc: req.body?.boLoc, pham: req.body?.pham, xemTruoc: !!req.body?.xemTruoc, sos: req.body?.sos,
})));

/** OV-12f: Panel một em (Học viên & Lớp › Mở) — mọi Case em người xem được thấy, tóm tắt cùng hàm với Đang SOS; ngoài phạm vi 403. */
api.get('/hoc-vien-lop/em/:id', requireAuth, wrap((req) => hocVienSosSvc.panelMotEm(principalOf(req), pInt(req, 'id'))));

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

/** OV-3c: hồ sơ lớp FT › Học viên › Kết quả đầu ra — KQĐR QL đã chốt của em vào từ FOU/BE/ELE, 4 tuần theo đợt. Admin 403. */
api.get('/classes/:id/ket-qua-dau-ra', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return kyVongSvc.kqdrLopFt(principalOf(req), pInt(req, 'id'));
}));

/** OV-12g: hồ sơ lớp › Học viên › Góp ý hàng tuần — tuần đang xem + 3 tuần trước; ghi một ô (chữ trống = xoá). Quyền kiểm ở máy chủ. */
api.get('/classes/:id/gop-y', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return gopYSvc.gopYTuan(principalOf(req), pInt(req, 'id'), qStr(req, 'tuan'));
}));
api.put('/classes/:id/gop-y', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return gopYSvc.ghiGopYTuan(principalOf(req), pInt(req, 'id'), req.body ?? {});
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
    score: b.score, total: b.total, note: b.note, lyDo: b.lyDo, nhanXet: b.nhanXet,
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
  studentSvc.chanLuuTruHv(principalOf(req), pInt(req, 'id'));
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
  studentSvc.chanLuuTru(principalOf(req), pInt(req, 'id'));   // OV-11d (HV-3): hồ sơ Lưu trữ khoá
  return cycleSvc.updateCycle(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Điểm xuất phát của lộ trình — phải ghi rõ NGUỒN, không lấy MT1 làm điểm đầu vào. */
api.put('/cycles/:id/baseline', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  studentSvc.chanLuuTru(principalOf(req), pInt(req, 'id'));
  return cycleSvc.setBaseline(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** Kết luận cuối lộ trình. Đóng lộ trình về hành chính KHÁC với đạt Target. */
api.put('/cycles/:id/outcome', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  /* PR-TK (TK-K): thân mới { ngayThi, l, r, w, s, khongThi, ghiChu } = kết quả thi thật (máy tính OVR + Đạt / Chưa đạt). Thân cũ { outcome, score, note } giữ nguyên hành vi. */
  const body = (req.body ?? {}) as Record<string, any>;
  /* OV-13h (chủ SP 15/10): kết quả thi thật nhập được cả khi em đã Lưu trữ — ngoại lệ duy nhất của hồ sơ Lưu trữ (`chanLuuTru` sau nhánh này). */
  if (['ngayThi', 'l', 'r', 'w', 's', 'khongThi', 'ghiChu'].some((k) => k in body)) return thiThatSvc.datKetQuaThiThat(principalOf(req), pInt(req, 'id'), body);
  studentSvc.chanLuuTru(principalOf(req), pInt(req, 'id'));   // OV-11d (HV-3)
  return cycleSvc.setOutcome(principalOf(req), pInt(req, 'id'), body as any);
}));

/** OV-13q: Gia hạn sau thi { han, lyDo? } · `han: null` = Bỏ gia hạn — GVCN lớp cuối, Quản lý, Quản trị, TVV chi nhánh (GVBM / Admin / CX 403). */
api.get('/cycles/:id/han-sau-thi', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return thiThatSvc.docHanSauThi(principalOf(req), pInt(req, 'id'));
}));
api.put('/cycles/:id/han-sau-thi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return thiThatSvc.datHanSauThi(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** OV-13m: panel Bước tiếp — trạng thái + "Đã xong" + hạn / hẹn; ai xem được hồ sơ em thì đọc được (GVCN chỉ đọc: `coTheChon` false). */
api.get('/cycles/:id/buoc-tiep', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const p = principalOf(req);
  const c = cycleSvc.cycleById(pInt(req, 'id'));
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  lenhSvc.quetLenhDenHan();   // hẹn bắt đầu tới tuần → bắt đầu trước khi đọc
  return buocTiepSvc.trangThaiBuocTiep(p, c.id);
}));
/** OV-8a: Bước tiếp sau thi thật — Quản lý / Quản trị (`cycle.edit` của em) và OV-12a: TVV cùng chi nhánh (`coQuyenBuocTiep`). Chọn / đổi = một giao dịch; DELETE = hoàn tác lựa chọn. */
api.post('/cycles/:id/buoc-tiep', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return buocTiepSvc.chonBuocTiep(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.delete('/cycles/:id/buoc-tiep', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return buocTiepSvc.boChonBuocTiep(principalOf(req), pInt(req, 'id'));
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
  studentSvc.chanLuuTru(principalOf(req), pInt(req, 'id'));   // OV-11d (HV-3)
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
 * PR-CL (B6): em của việc "Xét lại lộ trình" ở lớp HIỆN TẠI `:id` (lớp em đang học) — CÙNG hàm với dòng Công việc (cùng tập em). Không 403:
 * quyền lọc theo `class.edit` lớp đó (GVCN/GVBM → `em: []`). Ghi: web gọi `POST /students/:id/transfer` từng em.
 */
api.get('/classes/:id/xet-lai-lo-trinh', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  lenhSvc.quetLenhDenHan();
  const lop = db().prepare('SELECT id, code FROM classes WHERE id = ?').get(pInt(req, 'id')) as { id: number; code: string } | undefined;
  if (!lop) throw notFound('Không tìm thấy lớp');
  const em = cuoiKhoaSvc.emXetLaiLoTrinh(principalOf(req), null, demoToday()).find((x) => x.lopId === lop.id)?.em ?? [];
  return { lop: { id: lop.id, code: lop.code }, em };
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
/* OV-7a: sửa nhận xét chung của phiếu đã xác nhận (tới ngày thi hành lệnh; sau đó chỉ Quản lý). */
api.put('/lenh-chuyen/:id/ban-giao', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  banGiaoSvc.suaBanGiao(principalOf(req), pInt(req, 'id'), String(req.body?.nhanXetChung ?? ''));
  return { ok: true };
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
  const ctx = { classId: bang.classId, studentId: c.student_id };
  /* PR-OV2a: Admin xếp được lịch nhưng không khôi phục kết quả (`attempt.cancel`). */
  return { ...bang, coTheXep: can(principalOf(req), PERMISSIONS.PLAN_WEEK, ctx), coTheKhoiPhuc: can(principalOf(req), PERMISSIONS.ATTEMPT_CANCEL, ctx) };
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
  const b = req.body ?? {};
  /* CASE-NHIEU: có `kyNang` (mảng) = tạo nhiều kỹ năng một lần; không thì một kỹ năng như cũ. */
  return Array.isArray(b.kyNang) ? caseSvc.reportIssues(principalOf(req), b) : caseSvc.reportIssue(principalOf(req), b);
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

/** Tầng 1 Quản lý: Cần xử lý + Cần bạn quyết — theo khung `ct=ft|thuong` (SL2, 9.1-4); vắng = gộp hai khung. Mọi số đi qua `metricSet` — cùng số với `/metrics/:id`. */
api.get('/tong-quan/quan-ly', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  lenhSvc.quetLenhDenHan();
  return tongQuanSvc.tongQuanQuanLy(principalOf(req), { branchId: qInt(req, 'branchId') ?? null, ct: ctTuyChon(qStr(req, 'ct')) });
}));

/** Điểm đáng chú ý (tầng 3) theo khung `ct=ft|thuong` — tách route để đổi công tắc không tải lại Cần xử lý. */
api.get('/tong-quan/diem-chu-y', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanSvc.diemChuY(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  });
}));

/** Khối giáo viên (PR-VAI-a Q12): Lớp tôi dạy theo khung `ct=ft|thuong` — thay "Học viên cần hỗ trợ". */
/* OV-10c: Tổng quan TVV ("Học viên của tôi") / CX ("Số liệu") — ô đếm học viên, cùng nguồn chip Học viên & Lớp. */
api.get('/tong-quan/hoc-vien', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return soHocVien(principalOf(req), { branchId: qInt(req, 'branchId') ?? null });
}));
/* SV-YT-TVV (Q-A1 ①): "Việc của bạn" ở trang đầu TVV — TVV không có khu Công việc (`/my-work` chặn), nên việc TVV giữ đọc ở đây (cùng `myWork`, chỉ nhóm của TVV). */
api.get('/tong-quan/viec-cua-toi', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return nheMyWork(myWork(principalOf(req), { branchId: qInt(req, 'branchId'), chiNhom: NHOM_VIEC_TVV }));
}));
/* OV-10c: Tổng quan Admin — tab "Mock Test" (4 ô + GV chấm quá hạn); mỗi số từ hàm của màn ô đó mở. */
api.get('/tong-quan/mock-test', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanMt(principalOf(req), { branchId: qInt(req, 'branchId') ?? null });
}));
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

/** OV-15h1: Tổng quan QL phần theo khung MỘT GET — Lớp cần chú ý + Tuần này + Trễ chấm theo GV, gọi lại đúng hàm của các đường cũ (số không đổi). */
api.get('/tong-quan/ql', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanQlSvc.tongQuanQl(principalOf(req), { branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')) });
}));
/** OV-15h1: panel "n bài" của một GV ở Trễ chấm (`gv`: id · 0 chưa phân công · -1 Speaking chấm chéo). */
api.get('/tong-quan/ql/tre', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const gvChu = String(req.query.gv ?? '').trim();
  if (!/^-?\d+$/.test(gvChu)) throw badRequest('Thiếu giáo viên.');   // rỗng / chữ → 400, không hiểu là 0 (Chưa phân công)
  const gv = Number(gvChu);
  return tongQuanQlSvc.oTreCham(principalOf(req), { branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')), gv });
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
    chuY: qStr(req, 'chuY') === '1',   // OV-15h1: ô của "Lớp cần chú ý"
  });
}));

api.get('/cases/:id', requireAuth, wrap((req) => caseSvc.caseDetail(principalOf(req), pInt(req, 'id'))));

/** Ghi một tác động. Một Case có nhiều tác động. */
api.post('/cases/:id/interventions', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.recordIntervention(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/**
 * CASE TỪ SOS (SOS v4, PR-SOS → OV-12c): Progress Test — Xác nhận Case MỘT bước (nhóm + mô tả + PA Bổ trợ); Case MT — nguyên nhân từ nhận xét,
 * chỉ Xác nhận PA theo quy chế; hoặc gửi "Không cần theo dõi" cho Quản lý duyệt. Quyền kiểm ở máy chủ theo ĐÚNG kỹ năng của Case (C02). Đường cũ `/confirm`, `/replace` đã gỡ.
 */
api.post('/cases/:id/xac-nhan', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.xacNhanCase(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
api.post('/interventions/:id/xac-nhan-pa', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.xacNhanPaQuyChe(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
/* OV-13b: Đề xuất PA khác cho PA mặc định — thẻ "Đề xuất PA" (QL duyệt); rút = `POST /yeu-cau/:id/rut`. */
api.post('/interventions/:id/de-xuat-doi-pa', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return doiPaSvc.deXuatDoiPa(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
/** OV-13c: Xác nhận PA cùng lúc (dòng gộp Công việc) — mỗi PA một giao dịch, PA lỗi báo riêng. */
api.post('/interventions/xac-nhan-pa-lo', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return sosAutoSvc.xacNhanPaNhieu(principalOf(req), req.body);
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
/* OV-7a: Đưa lại Cần xử lý (việc đã xong) · Khôi phục (việc đã bỏ). */
api.post('/phoi-hop-sos/:id/mo-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return phoiHopSvc.moLaiCoordination(principalOf(req), pInt(req, 'id'));
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
/* OV-15h1: `branchId` — "Chờ bạn duyệt" ở Công việc đếm theo chi nhánh đang lọc (badge menu không gửi: mọi chi nhánh). */
api.get('/yeu-cau/dem', requireAuth, wrap((req) => yeuCauSvc.demYeuCau(principalOf(req), { branchId: qInt(req, 'branchId') ?? null })));
api.post('/yeu-cau/duyet-nhieu', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.duyetNhieu(principalOf(req), (req.body ?? {}).ids);
}));
/* PR-LUI-a2: Từ chối nhiều — cùng luật Duyệt nhiều, một lý do chung. */
api.post('/yeu-cau/tu-choi-nhieu', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = (req.body ?? {}) as Record<string, any>;
  return yeuCauSvc.tuChoiNhieu(principalOf(req), b.ids, b.lyDo);
}));
/* PR-LUI-a2: Huỷ quyết định bấm nhầm trong ngày (chỉ loại có đường đảo — Đề xuất PA). */
api.post('/yeu-cau/:id/huy-quyet-dinh', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.huyQuyetDinh(principalOf(req), pInt(req, 'id'));
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
/* OV-7a: QL sửa câu trả lời Xin ý kiến · người gửi Sửa / Rút thẻ còn chờ (Đề xuất sửa, chuyển lớp, Không cần theo dõi, Ý thức). */
api.post('/yeu-cau/:id/sua-tra-loi', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.suaTraLoi(principalOf(req), pInt(req, 'id'), (req.body ?? {}).traLoi);
}));
api.put('/yeu-cau/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.suaYeuCau(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.post('/yeu-cau/:id/rut', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return yeuCauSvc.rutYeuCau(principalOf(req), pInt(req, 'id'));
}));

/**
 * CẬP NHẬT KẾT QUẢ — một thao tác duy nhất khép lại một chu kỳ xử lý (mục 7.7 [3], 7.9).
 *
 * Gộp ba nút cũ: "Đánh dấu đã làm" · "Ghi quan sát" · "Hướng xử lý". Payload hỏi đúng ba
 * câu: kết quả ra sao, ghi chú, và bước tiếp theo là gì.
 */
api.post('/interventions/:id/result', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.updateResult(principalOf(req), pInt(req, 'id'), req.body ?? {});   // PR-CT2: Người dạy tuần này không bắt buộc; dịch vụ chỉ kiểm định dạng khi có
}));

/**
 * OV-7b: SỬA LẦN GHI KẾT QUẢ PA GẦN NHẤT — GET điền sẵn form (PA như trước lần ghi, giá trị cũ, câu chặn); POST cùng thân `/interventions/:id/result`:
 * giữ lựa chọn = sửa chữ, đổi lựa chọn = đảo hệ quả cũ + ghi lại (một giao dịch). Người đã ghi + Quản lý.
 */
api.get('/followups/:id/sua', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return caseSvc.moSuaKetQua(principalOf(req), pInt(req, 'id'));
}));
api.post('/followups/:id/sua', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.suaKetQua(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
/** OV-13b: Hoàn tác lần ghi kết quả vừa lưu (cùng quyền Sửa). */
api.post('/followups/:id/hoan-tac', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.hoanTacKetQua(principalOf(req), pInt(req, 'id'));
}));
/** OV-7b: sửa "Xem lại sau hỗ trợ" lần mới nhất (kết quả quan sát, ghi chú, ngày) — người đã ghi + Quản lý. */
api.patch('/followups/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.suaXemLai(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** PR-PA (§8): SỬA PA — cùng form Thêm PA; Loại khoá; quyền như Kết quả. */
api.patch('/interventions/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.suaPa(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/**
 * CHỐT KẾT QUẢ CẢ CASE — chỉ mở khi mọi phương án đã có kết quả.
 * `decision` là 'end' (kết thúc hẳn) hoặc 'extend' (kéo dài theo dõi + thêm phương án).
 */
api.post('/cases/:id/outcome', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.closeCaseOutcome(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** PR-LUI-a2: Quản lý / Quản trị mở lại Case đã hoàn thành — một bấm. OV-7b: cả người đã hoàn thành Case (GV). */
api.post('/cases/:id/mo-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.moLaiCase(principalOf(req), pInt(req, 'id'));
}));
/** PR-LUI-a2: Sửa Case (tên, mô tả, mức, kỹ năng khi chưa có PA, nhóm nguyên nhân) · Xoá Case báo tay tạo nhầm · Xoá PA (QL / QT). */
api.patch('/cases/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.suaCase(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
api.delete('/cases/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.xoaCase(principalOf(req), pInt(req, 'id'));
}));
/** OV-13a (C): GVCN / Quản lý kết thúc sớm PA theo quy chế đang chạy — lý do ≥ 10 ký tự; quyền kiểm ở máy chủ (`ketThucPaQuyChe`). */
api.post('/interventions/:id/ket-thuc', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.ketThucPaQuyChe(principalOf(req), pInt(req, 'id'), (req.body ?? {}) as any);
}));
api.delete('/interventions/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return caseSvc.xoaPa(principalOf(req), pInt(req, 'id'));
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

/** SV-BAI-LOP (C11, T18): hồ sơ HV › Bài trên lớp — tuỳ chọn, thang của bài, không vào MT / KPI, không sinh việc. Quyền kiểm ở máy chủ; lịch sử: /lich-su?loai=bai-lop. */
api.get('/students/:id/bai-tren-lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return baiLopSvc.dsBaiTrenLop(principalOf(req), pInt(req, 'id'));
}));
api.post('/students/:id/bai-tren-lop', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return baiLopSvc.themBaiTrenLop(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.put('/bai-tren-lop/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return baiLopSvc.suaBaiTrenLop(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.delete('/bai-tren-lop/:id', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return baiLopSvc.xoaBaiTrenLop(principalOf(req), pInt(req, 'id'));
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

/* OV-13j: Lịch sử sửa thông tin học viên (mới nhất trước; `truoc` = con trỏ trang trước trả về). */
api.get('/students/:id/lich-su-sua', requireAuth, wrap((req) => lichSuSuaSvc.lichSuSua(principalOf(req), pInt(req, 'id'),
  { loai: qStr(req, 'loai'), truoc: qInt(req, 'truoc') })));
/* OV-15g (C22): Lịch sử thay đổi — một đường cho mọi đối tượng (`loai` = hv | lop | phan-cong | gop-y | nhap-hv | thi-that | o); quyền = quyền xem đối tượng. */
api.get('/lich-su', requireAuth, wrap((req) => lichSuSvc.lichSu(principalOf(req),
  { loai: qStr(req, 'loai'), id: qInt(req, 'id'), loc: qStr(req, 'loc'), tiep: qInt(req, 'tiep') })));

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
  if (req.body?.lyDo !== undefined && !lyDoTuDo) throw badRequest('Ghi lý do ngắn');   // PR-CL: cùng chữ `kiemDongLenh`
  /* RB-3: lý do chọn nhanh BẮT BUỘC; "Khác" phải ghi rõ ≥ 3 ký tự (T13). */
  if (!lyDoTuDo && laKhac(reasonCode)) {
    const loi = kiemGhiRoKhac(reasonNote);
    if (loi) throw badRequest(`Lý do "Khác": ${loi}.`);
  }
  const reason = lyDoTuDo || transferReasonText(reasonCode, reasonNote);
  if (!reason) throw badRequest('Chọn lý do chuyển lớp (chọn "Khác" thì ghi rõ).');
  /*
   * PR-CT: em đang học một lớp → RA LỆNH (Quản lý); chỉ em CHƯA TỪNG xếp lớp (xếp lần đầu) mới đi đường cũ.
   * PR-CL (B1): bối cảnh + hướng do máy chủ tính (`huongChuyenMotEm`) — lớp thường đã tới Cuối khoá đi luật Cuối khoá. Lệnh `cho` của em được
   * SỬA (upsert theo học viên) — panel gọi đường này cả khi sửa lệnh.
   */
  const sid = pInt(req, 'id');
  const enr = luatLoTrinhSvc.lopHienTaiCua(sid);
  if (enr) {
    const dich = luatLoTrinhSvc.lopDichHopLe(Number(toClassId), enr.class_id);
    const { boiCanh, huong } = luatLoTrinhSvc.huongChuyenMotEm(enr, dich);
    /* R-C3 (M3: Target / KCK chỉ khi lệnh cũ và hướng mới đều Lên FT): sửa lệnh `cho` mà không gửi Target / Dự kiến thi → giữ giá trị của lệnh (không ghi đè lặng lẽ bằng Target khoá / trống). */
    const cu = db().prepare(`SELECT huong, muc_tieu, khong_cam_ket, ngay_thi FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(sid) as any;
    const vang = (v: unknown) => v === undefined || v === null || v === '';
    const mucTieuGui = vang(mucTieu) && cu?.huong === 'fast_track' && huong === 'fast_track' ? (ghepMucTieu(cu.muc_tieu, cu.khong_cam_ket) ?? undefined) : mucTieu;
    const ngayThiGui = vang(req.body?.ngayThi ?? thangThi) && cu ? cu.ngay_thi ?? undefined : req.body?.ngayThi ?? thangThi;
    const r = lenhSvc.raLenh(principalOf(req), {
      lopNguonId: enr.class_id, boiCanh, tuanChung: req.body?.tuan ?? effectiveDate ?? null,
      dongs: [lenhSvc.dongTuBody({
        studentId: sid, huong, toClassId, lyDo: reason,
        mucTieu: mucTieuGui, ngayThi: ngayThiGui,
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

/** OV-3b: nháp Lộ trình tiếp theo — chỉ Quản lý (`coTheRaLenh`); lô lỗi một phần (`failed`). Đọc nháp qua `GET /classes/:id/transition`. */
api.put('/classes/:id/lo-trinh-nhap', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return loTrinhTiepSvc.luuNhap(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
api.delete('/classes/:id/lo-trinh-nhap/:studentId', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return loTrinhTiepSvc.xoaNhap(principalOf(req), pInt(req, 'id'), pInt(req, 'studentId'));
}));

/** OV-3b: GVCN lớp nguồn đề xuất Kết quả đầu ra (không chạy gì); Quản lý chốt ở `PUT /students/:id/ket-luan-ft`. */
api.put('/students/:id/ket-qua-de-xuat', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return cuoiKhoaSvc.deXuatKetQua(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));

/** PR-KV (§3): panel "Kỳ vọng đầu ra · lớp" — em Lên FT của lớp BE/ELE + MT0 + gợi ý; Lưu một lần cả lớp (một tx). Chỉ Quản lý (`request.approve`). */
api.get('/classes/:id/ky-vong', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return kyVongSvc.panelKyVong(principalOf(req), pInt(req, 'id'));
}));
api.put('/classes/:id/ky-vong', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return kyVongSvc.luuKyVong(principalOf(req), pInt(req, 'id'), req.body ?? {});
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

/** ⋮ Hồ sơ HV › Xoá học viên — Quản lý / Quản trị của em (máy chủ kiểm `cycle.edit` theo phạm vi em, OV-12a; PR-XOA). Xoá hẳn trong một giao dịch. */
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

/** OV-11d (HV-21): Hoàn tác Tạm dừng — trả nguyên trạng, không tính lại hạn (ai Tạm dừng được thì hoàn tác được). */
api.post('/students/:id/hoan-tac-tam-dung', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.hoanTacTamDung(principalOf(req), pInt(req, 'id'));
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

/* OV-13h (chủ SP 15/10): bỏ đường Quản trị mở lại tuần báo cáo — quá hạn vẫn nộp được, gắn nhãn "nộp muộn" (`reportEditWindow`). */
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

api.get('/notifications', requireAuth, wrap((req) => {
  const p = principalOf(req);
  dongBoKhiMoChuong(p, demoToday());   // OV-15d (C03): thông báo tự động thay Nhắc — đồng bộ khi mở chuông, tối đa 5 phút / người
  return thongBaoCua(p.userId);
}));

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
    note: b.note ?? null, skills: Array.isArray(b.skills) ? b.skills : [], role: b.role,
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
/** Tài khoản › ⋯ › Sửa thông tin — CHỈ Quản trị hệ thống (07/10): họ tên, email đăng nhập, điện thoại, chức danh, email khác. */
api.patch('/admin/accounts/:id', requireAuth, wrap((req) => accountSvc.adminUpdateAccount(principalOf(req), pInt(req, 'id'), req.body ?? {})));
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
