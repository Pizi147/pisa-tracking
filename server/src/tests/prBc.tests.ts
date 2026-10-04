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
}
