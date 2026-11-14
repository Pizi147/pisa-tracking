/**
 * PHÉP KIỂM QTV2-QUYEN (chủ SP 11/11, Quản trị V2 PR-2): tab Quyền & nhật ký —
 *  · Nhật ký chung `nhatKyQuanTri`: lọc đúng mục / người / ngày, trước → sau theo trường, phân trang; QL chỉ xem mục cấu hình, GV bị chặn;
 *  · `/admin/overview` đã bỏ (đọc mọi tài khoản + 6 COUNT(*)) — web không còn gọi;
 *  · Quyền theo vai: web không còn chế độ "Sửa quyền", công tắc có `role="switch"`.
 */
import fs from 'node:fs';

export async function runPrQtv2QuyenTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any }) {
  const { check, assert, assertThrows, conn, P } = t;
  const nk: any = await import('../platform/nhatKyQuanTri.ts');
  const sc: any = await import('../platform/sysconfig.ts');
  const nav: any = await import('../platform/nav.ts');
  const nkMod: any = await import('../platform/nhatKyQuanTri.ts');
  console.log('\nQTV2-QUYEN — Quyền & nhật ký: nhật ký chung, quyền theo vai');
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); } };
  const cp = () => conn.prepare(`SELECT id FROM branches WHERE code = 'CP'`).get() as any;

  check('GD-17a-NK · giá trị nhật ký là chữ người đọc (cùng chữ với ô): Đạt từ %, Còn dùng Có / Không', () => {
    assert(nk.giaTriDoc('nguongDat', '0.65', 'programmes') === '65 %' && nk.giaTriDoc('nguongDat', '70', 'programmes') === '70 %', 'Đạt từ thô');
    assert(nk.giaTriDoc('status', 'inactive', 'routes') === 'Không' && nk.giaTriDoc('status', 'active', 'programmes') === 'Có', 'Còn dùng thô');
    assert(nk.giaTriDoc('bat', 'true', 'system_config') === 'Có' && nk.giaTriDoc('ten', null, 'x') === null, 'Mở / rỗng');
  });

  check('QTV2-NK-1 · mục chi nhánh: dòng mới nhất là lần sửa vừa lưu, có trước → sau theo trường; QL xem được mục cấu hình', () => thu(() => {
    sc.luuChiNhanh(P.admin, cp().id, { name: 'Cẩm Phả', diaChi: 'Số 1 Tô Hiệu', soDienThoai: '082.228.9288' });
    const r = nk.nhatKyQuanTri(P.admin, { muc: 'chi-nhanh' });
    const d = r.dong[0];
    assert(d && d.viec === 'chi_nhanh.sua' && d.muc === 'chi-nhanh', JSON.stringify(d));
    assert(d.truong.some((x: any) => x.ten === 'Địa chỉ' && x.moi === 'Số 1 Tô Hiệu'), `trường: ${JSON.stringify(d.truong)}`);
    assert(r.dong.every((x: any) => x.muc === 'chi-nhanh'), 'lẫn mục khác');
    assert(nk.nhatKyQuanTri(P.mbManager, { muc: 'chi-nhanh' }).dong[0].id === d.id, 'QL không xem được mục chi nhánh');
  }));

  check('QTV2-NK-2 · quyền: QL không xem tài khoản / quyền / mở sửa lịch, không lọc mục → chỉ mục cấu hình; GV bị chặn; mục lạ / ngày sai → 400', () => {
    for (const m of ['tai-khoan', 'quyen', 'mo-sua-lich']) assertThrows(() => nk.nhatKyQuanTri(P.mbManager, { muc: m }), /Quản trị/, `QL xem được ${m}`);
    const ql = nk.nhatKyQuanTri(P.mbManager, {});
    assert(ql.muc.every((m: string) => !['tai-khoan', 'quyen', 'mo-sua-lich'].includes(m)), JSON.stringify(ql.muc));
    assertThrows(() => nk.nhatKyQuanTri(P.lrTeacher, {}), /Quản trị/, 'GV xem được nhật ký');
    assertThrows(() => nk.nhatKyQuanTri(P.admin, { muc: 'x' }), /không hợp lệ/, 'mục lạ');
    assertThrows(() => nk.nhatKyQuanTri(P.admin, { tu: '14/09/2026' }), /YYYY-MM-DD/, 'ngày sai dạng');
  });

  check('QTV2-NK-3 · lọc người + ngày + trang: 51 dòng → trang 1 có 50 + `tiep`, trang 2 phần còn lại; ngoài khoảng ngày không có', () => thu(() => {
    const ins = conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
      VALUES (?, 'chi_nhanh.sua', 'branch', 1, 'MB', '{"name":"A"}', '{"name":"B"}', ?)`);
    for (let i = 0; i < 51; i++) ins.run(P.admin.userId, `2031-01-0${1 + (i % 2)}T08:00:00.000Z`);
    const t1 = nk.nhatKyQuanTri(P.admin, { muc: 'chi-nhanh', nguoi: P.admin.userId, tu: '2031-01-01', den: '2031-01-02' });
    assert(t1.dong.length === 50 && t1.tiep, `trang 1: ${t1.dong.length} · tiep ${t1.tiep}`);
    const t2 = nk.nhatKyQuanTri(P.admin, { muc: 'chi-nhanh', nguoi: P.admin.userId, tu: '2031-01-01', den: '2031-01-02', tiep: t1.tiep });
    assert(t2.dong.length === 1 && t2.tiep === null && t2.nguoi.length === 0, `trang 2: ${t2.dong.length} · người ${t2.nguoi.length} (chỉ trang đầu đọc danh sách người)`);
    assert(nk.nhatKyQuanTri(P.admin, { muc: 'chi-nhanh', tu: '2031-01-03' }).dong.length === 0, 'ngoài khoảng ngày vẫn có');
    assert(t1.nguoi.some((x: any) => x.id === P.admin.userId), 'ô lọc người thiếu');
  }));

  check('QTV2-Q-1 · web: không còn `/admin/overview` và chế độ "Sửa quyền"; quyền theo vai dùng công tắc', () => {
    const ap = fs.readFileSync('web/src/modules/platform/AdminPage.tsx', 'utf8');
    const qv = fs.readFileSync('web/src/modules/platform/QuyenTheoVai.tsx', 'utf8');
    const rt = fs.readFileSync('server/src/routes/index.ts', 'utf8');
    assert(!ap.includes('/admin/overview') && !rt.includes("'/admin/overview'"), 'còn /admin/overview');
    assert(!ap.includes("t('Sửa quyền')") && !qv.includes("t('Sửa quyền')"), 'còn nút Sửa quyền');
    assert(qv.includes('role="switch"') && qv.includes('aria-checked'), 'công tắc thiếu role="switch" / aria-checked');
  });

  check('QTV2-CH-1 · Quản lý XEM chương trình, lộ trình, chi nhánh; không sửa được; GV bị chặn; nav có tab cấu hình cho QL', () => {
    const { navOf } = nav;
    assert(Array.isArray(sc.listProgrammes(P.mbManager)) && sc.listChiNhanh(P.mbManager).length > 0, 'QL không xem được');
    assertThrows(() => sc.saveProgramme(P.mbManager, { code: 'FOU', name: 'X' }), /Quản trị/, 'QL sửa được chương trình');
    assertThrows(() => sc.saveRoute(P.mbManager, { code: 'LT1', name: 'X' }), /Quản trị/, 'QL sửa được lộ trình');
    assertThrows(() => sc.luuChiNhanh(P.mbManager, cp().id, { name: 'X', diaChi: '', soDienThoai: '' }), /Quản trị/, 'QL sửa được chi nhánh');
    assertThrows(() => sc.listProgrammes(P.lrTeacher), /Quản trị/, 'GV xem được chương trình');
    assert(navOf(P.mbManager).bangQuyDoi && !navOf(P.mbManager).admin && !navOf(P.lrTeacher).bangQuyDoi, 'cờ nav cấu hình');
    /* PTA chốt 11/11 (PR-Dọn quét #10): số "đang dùng" (lộ quy mô) chỉ ở bản Quản trị. */
    assert(sc.listProgrammes(P.mbManager).every((x: any) => x.lopDangChay === undefined && x.coLop === undefined), 'QL thấy số lớp chương trình');
    assert(sc.listRoutes(true, false).every((x: any) => x.inUse === undefined && x.lopDangChay === undefined), 'QL thấy số lớp lộ trình');
    assert(sc.listProgrammes(P.admin).every((x: any) => typeof x.lopDangChay === 'number'), 'Quản trị mất số lớp');
    const nk8 = nkMod.nhatKyQuanTri(P.mbManager, { muc: 'chi-nhanh', gioiHan: 8 });
    assert(nk8.dong.length <= 8 && nk8.nguoi.length === 0 && nk8.tiep === null, 'gioi-han: quá 8 dòng / còn đọc danh sách người');
  });
}
