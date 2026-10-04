/** PHÉP KIỂM PR-BC — Báo cáo đơn vị (D8, D9) + Quản trị › Tài khoản (L3, J10). Luật thuần, gọi thẳng `shared/domain`. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrBcTests(t: Pick<YThucTestKit, 'check' | 'assert'>) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');

  const U = (unitId: number, branchId: number | null, ma: 'da-nop' | 'nhap' | 'chua') => ({ unitId, branchId, trangThai: { ma } });
  const units = [U(1, 10, 'da-nop'), U(2, 20, 'chua'), U(3, 30, 'nhap'), U(6, null, 'chua')];
  const branches = [{ id: 10, name: 'Monbay' }, { id: 20, name: 'Bãi Cháy' }, { id: 30, name: 'Cẩm Phả' }, { id: 40, name: 'Uông Bí' }];

  /* D9-a (chủ sản phẩm chốt 04/10): chọn một chi nhánh thì hiện KÈM dòng Tutor part-time; "tutor" chỉ ra Tutor. */
  check('PR-BC D9 · lọc chi nhánh: id chi nhánh ra đơn vị chi nhánh đó KÈM Tutor (D9-a); "tutor" chỉ ra Tutor; "tat-ca" ra hết', () => {
    assert(d.locDonViBaoCao(units, { chiNhanh: '10', trangThai: null }).map((u: any) => u.unitId).join() === '1,6', 'MB → đơn vị 1 + Tutor 6');
    assert(d.locDonViBaoCao(units, { chiNhanh: 'tutor', trangThai: null }).map((u: any) => u.unitId).join() === '6', 'tutor → chỉ đơn vị 6');
    assert(d.locDonViBaoCao(units, { chiNhanh: 'tat-ca', trangThai: null }).length === 4, 'tất cả → 4');
  });
  check('PR-BC D9 · lọc chi nhánh + trạng thái cùng lúc; chi nhánh lạ (không có trong units) → không lộ đơn vị chi nhánh nào', () => {
    assert(d.locDonViBaoCao(units, { chiNhanh: 'tat-ca', trangThai: 'chua' }).map((u: any) => u.unitId).join() === '2,6', 'chưa báo cáo → 2,6');
    assert(d.locDonViBaoCao(units, { chiNhanh: '20', trangThai: 'da-nop' }).length === 0, 'BC + đã nộp → rỗng');
    assert(d.locDonViBaoCao(units, { chiNhanh: '40', trangThai: null }).every((u: any) => u.branchId === null), 'UB không có trong units → chỉ còn Tutor');
    assert(d.locDonViBaoCao(units, { chiNhanh: 'abc', trangThai: null }).length === 0, 'giá trị rác → rỗng');
  });
  check('PR-BC D9 · ba số đếm theo tập đã lọc chi nhánh (chưa lọc trạng thái)', () => {
    const n = d.demTrangThaiDonVi(d.locDonViBaoCao(units, { chiNhanh: 'tat-ca', trangThai: null }));
    assert(n.daNop === 1 && n.nhap === 1 && n.chua === 2, JSON.stringify(n));
    const m = d.demTrangThaiDonVi(d.locDonViBaoCao(units, { chiNhanh: '10', trangThai: null }));
    assert(m.daNop === 1 && m.nhap === 0 && m.chua === 1, 'MB + Tutor: ' + JSON.stringify(m));
  });
  check('PR-BC D9 · lựa chọn chi nhánh chỉ gồm chi nhánh có đơn vị đang thấy + Tutor; số = số dòng sẽ hiện; < 3 lựa chọn thực → [] (ẩn bộ lọc)', () => {
    const lc = d.luaChonChiNhanhBaoCao(units, branches);
    assert(lc.map((x: any) => x.key).join() === 'tat-ca,10,20,30,tutor', lc.map((x: any) => x.key).join());
    assert(lc[0].nhan === 'Tất cả' && lc[0].so === 4 && lc[1].nhan === 'Monbay' && lc[1].so === 2, JSON.stringify(lc));
    assert(lc[4].nhan === 'Tutor part-time' && lc[4].so === 1, JSON.stringify(lc));
    assert(!lc.some((x: any) => x.key === '40'), 'không liệt kê chi nhánh không có đơn vị trong phạm vi');
    assert(d.luaChonChiNhanhBaoCao([U(1, 10, 'chua'), U(6, null, 'chua')], branches).length === 0, 'QL một chi nhánh → ẩn bộ lọc');
  });
  check('PR-BC D9-b · "Việc được giao" lọc theo chi nhánh của việc: chi nhánh → việc chi nhánh đó + việc toàn hệ thống; tutor → chỉ việc toàn hệ thống', () => {
    const viec = [{ id: 1, branchId: 10 }, { id: 2, branchId: 20 }, { id: 3, branchId: null }];
    const loc = (cn: string) => viec.filter((v) => d.khopChiNhanhBaoCao(v.branchId, cn)).map((v) => v.id).join();
    assert(loc('10') === '1,3' && loc('tutor') === '3' && loc('tat-ca') === '1,2,3', `${loc('10')} | ${loc('tutor')} | ${loc('tat-ca')}`);
  });
  check('PR-BC D8 · kỳ tháng hiện "09/2026", không "2026-09"', () => {
    assert(d.hienONgay('2026-09', 'thang') === '09/2026', d.hienONgay('2026-09', 'thang'));
  });

  // ---------------------------------------------------------------- L3 + J10 (Quản trị › Tài khoản)
  const A = (id: number, roles: [string, string | null][], o: { email?: string | null; skills?: string[]; extra?: unknown[]; ten?: string } = {}) => ({
    id, code: `U${id}`, fullName: o.ten ?? `Người ${id}`, email: o.email === undefined ? `u${id}@pisa.vn` : o.email,
    skills: o.skills ?? ['L'], extra: o.extra ?? [], roles: roles.map(([role, branchCode]) => ({ role, branchCode })),
  });
  const ds = [
    A(1, [['teacher', 'MB']], { ten: 'Nguyễn Thu Hà', skills: ['L', 'R'] }),
    A(2, [['teacher', 'BC'], ['manager', 'MB']]),          // GV ở BC, QL ở MB — KHÔNG phải "GV Monbay"
    A(3, [['teacher', 'MB'], ['teacher', 'CP']], { skills: ['W'] }),
    A(4, [['system_admin', null]], { skills: [] }),
    A(5, [], { email: null, skills: [], extra: [{ permission: 'x' }] }),
  ];
  const L = (o: Partial<{ chiNhanh: string; vai: string; kyNang: string; q: string; phanLoai: string | null }>) => ({ ...d.BO_LOC_TAI_KHOAN_TRONG, ...o });

  check('PR-BC L3 · Giáo viên + Monbay khớp trên CÙNG một lần cấp vai: ra 1 và 3, không ra 2 (GV ở BC + QL ở MB)', () => {
    const r = d.locTaiKhoan(ds, L({ chiNhanh: 'MB', vai: 'teacher' })).map((u: any) => u.id).join();
    assert(r === '1,3', r);
  });
  check('PR-BC L3 · "Toàn hệ thống" chỉ khớp lần cấp branchCode null; chi nhánh cụ thể không khớp vai toàn hệ thống', () => {
    assert(d.locTaiKhoan(ds, L({ chiNhanh: 'toan-he-thong' })).map((u: any) => u.id).join() === '4', 'toàn hệ thống → 4');
    assert(!d.locTaiKhoan(ds, L({ chiNhanh: 'MB' })).some((u: any) => u.id === 4), 'MB không ra admin toàn hệ thống');
  });
  check('PR-BC L3 · kỹ năng, tìm không dấu theo tên/mã/email, phân loại', () => {
    assert(d.locTaiKhoan(ds, L({ kyNang: 'W' })).map((u: any) => u.id).join() === '3', 'kỹ năng W → 3');
    assert(d.locTaiKhoan(ds, L({ q: 'thu ha' })).map((u: any) => u.id).join() === '1', 'tìm "thu ha" khớp "Nguyễn Thu Hà"');
    assert(d.locTaiKhoan(ds, L({ q: 'THU HÀ' })).map((u: any) => u.id).join() === '1', 'tìm có dấu, chữ hoa');
    assert(d.locTaiKhoan(ds, L({ q: 'u5' })).map((u: any) => u.id).join() === '5', 'tìm theo mã');
    assert(d.locTaiKhoan(ds, L({ q: 'u2@pisa' })).map((u: any) => u.id).join() === '2', 'tìm theo email');
    assert(d.locTaiKhoan(ds, L({ phanLoai: 'chua-email' })).map((u: any) => u.id).join() === '5', 'chưa có email → 5');
    const pl = d.phanLoaiTaiKhoan(ds);
    assert(pl['chua-vai'] === 1 && pl['chua-email'] === 1 && pl['chua-ky-nang'] === 2, JSON.stringify(pl));
  });
  check('PR-BC L3 · nhóm theo chi nhánh: người 2 chi nhánh ở cả 2 nhóm, đếm đúng; không vai → nhóm "Chưa có vai trò"; nhóm theo vai không lặp người', () => {
    const g = d.nhomTaiKhoan(ds, 'chi-nhanh', new Map([['MB', 'Monbay'], ['BC', 'Bãi Cháy'], ['CP', 'Cẩm Phả']]));
    const so = Object.fromEntries(g.map((x: any) => [x.nhan, x.rows.map((u: any) => u.id).join()]));
    assert(so['Monbay'] === '1,2,3' && so['Bãi Cháy'] === '2' && so['Cẩm Phả'] === '3', JSON.stringify(so));
    assert(so['Toàn hệ thống'] === '4' && so['Chưa có vai trò'] === '5', JSON.stringify(so));
    const v = Object.fromEntries(d.nhomTaiKhoan(ds, 'vai', new Map(), (r: string) => `[${r}]`).map((x: any) => [x.nhan, x.rows.map((u: any) => u.id).join()]));
    assert(v['[teacher]'] === '1,2,3' && v['[manager]'] === '2' && v['[system_admin]'] === '4', JSON.stringify(v));
  });
  check('PR-BC L3 · bộ lọc đọc/ghi URL khứ hồi; giá trị lạ → mặc định (không ném)', () => {
    const loc = L({ chiNhanh: 'MB', vai: 'teacher', kyNang: 'L', q: 'hà', phanLoai: 'chua-email' });
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(d.ghiBoLocTaiKhoan(loc))) if (v) qs.set(k, v as string);
    assert(JSON.stringify(d.docBoLocTaiKhoan(qs)) === JSON.stringify(loc), qs.toString());
    const la = d.docBoLocTaiKhoan(new URLSearchParams('vai=hacker&kn=Z&loai=abc'));
    assert(la.vai === 'tat-ca' && la.kyNang === 'tat-ca' && la.phanLoai === null, JSON.stringify(la));
    assert(d.docBoLocTaiKhoan(new URLSearchParams('q=' + 'x'.repeat(500))).q.length === 100, 'tìm cắt 100 ký tự');
  });
  check('PR-BC J10 · cột "Quyền cấp riêng" chỉ hiện khi ít nhất một tài khoản có quyền cấp riêng', () => {
    assert(d.coQuyenCapRieng(ds) === true, 'có người 5');
    assert(d.coQuyenCapRieng(ds.slice(0, 4)) === false, 'không ai có → ẩn');
  });
}
