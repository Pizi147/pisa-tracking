/**
 * BÁO CÁO ĐƠN VỊ — luật lọc ở trình duyệt (PR-BC, D9). Máy chủ đã chỉ trả đơn vị người xem được thấy
 * (`visibleUnits`); ở đây chỉ THU HẸP, không bao giờ mở rộng.
 *
 * D9-a (chủ sản phẩm chốt 04/10): chọn một chi nhánh thì hiện KÈM đơn vị Tutor part-time (không thuộc
 * chi nhánh nào, `branchId === null`); chọn "Tutor part-time" thì chỉ ra Tutor.
 */
export type DonViBaoCao = { unitId: number; branchId: number | null; trangThai: { ma: 'da-nop' | 'nhap' | 'chua' } };
/** 'tat-ca' | 'tutor' (đơn vị không thuộc chi nhánh) | id chi nhánh dạng chuỗi */
export type LocChiNhanhBaoCao = string;

/** Một dòng (đơn vị, việc) có `branchId` khớp lựa chọn chi nhánh không. Dùng chung cho ma trận và "Việc được giao" (D9-b). */
export function khopChiNhanhBaoCao(branchId: number | null, cn: LocChiNhanhBaoCao): boolean {
  if (cn === 'tat-ca') return true;
  if (branchId === null) return cn === 'tutor' || /^\d+$/.test(cn);
  return String(branchId) === cn;
}

export function locDonViBaoCao<U extends DonViBaoCao>(units: U[], loc: { chiNhanh: LocChiNhanhBaoCao; trangThai: U['trangThai']['ma'] | null }): U[] {
  return units.filter((u) => khopChiNhanhBaoCao(u.branchId, loc.chiNhanh) && (!loc.trangThai || u.trangThai.ma === loc.trangThai));
}

export function demTrangThaiDonVi(units: DonViBaoCao[]): { daNop: number; nhap: number; chua: number } {
  const n = { daNop: 0, nhap: 0, chua: 0 };
  for (const u of units) n[u.trangThai.ma === 'da-nop' ? 'daNop' : u.trangThai.ma === 'nhap' ? 'nhap' : 'chua']++;
  return n;
}

/** Lựa chọn của bộ lọc — chỉ chi nhánh CÓ đơn vị trong `units`; `so` = số dòng sẽ hiện. Dưới 3 lựa chọn thực → [] (bộ lọc thừa, ẩn). */
export function luaChonChiNhanhBaoCao(units: DonViBaoCao[], branches: { id: number; name: string }[]): { key: string; nhan: string; so: number }[] {
  const ten = new Map(branches.map((b) => [b.id, b.name]));
  const muc: { key: string; nhan: string; so: number }[] = [];
  for (const u of units) {
    if (u.branchId === null || muc.some((m) => m.key === String(u.branchId))) continue;
    const key = String(u.branchId);
    muc.push({ key, nhan: ten.get(u.branchId) ?? `Chi nhánh ${u.branchId}`, so: locDonViBaoCao(units, { chiNhanh: key, trangThai: null }).length });
  }
  const soTutor = units.filter((u) => u.branchId === null).length;
  if (soTutor) muc.push({ key: 'tutor', nhan: 'Tutor part-time', so: soTutor });
  return muc.length < 3 ? [] : [{ key: 'tat-ca', nhan: 'Tất cả', so: units.length }, ...muc];
}
