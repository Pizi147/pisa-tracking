/**
 * CHI NHÁNH MẶC ĐỊNH (PR-NV, T9) — luật thuần, máy chủ (`goiYChiNhanh`) và web (`useChiNhanhMacDinh`) cùng gọi.
 * Thứ tự: (1) lần chọn trước · (2) chi nhánh có vai Quản lý (nhiều → nơi mình dạy nhiều lớp hơn) · (3) chi nhánh có nhiều lớp
 * mình dạy / chủ nhiệm nhất · (4) `cuoi`. Hoà → id nhỏ nhất. `null` = Tất cả chi nhánh.
 */
export type DauVaoChiNhanh = {
  /** Lần chọn trước (web) — nơi gọi chỉ truyền giá trị còn hợp lệ. */
  daChon: number | 'tat-ca' | null;
  /** Chi nhánh người xem có vai 'manager' (grant có branchId, không tính grant toàn hệ thống). */
  quanLy: readonly number[];
  /** Chi nhánh của MỖI lớp đang dạy / chủ nhiệm (có lặp — đếm số lớp). */
  lopDay: readonly number[];
  /** Luật 4: null = "Tất cả", hoặc chi nhánh đầu. */
  cuoi: number | null;
};

export function chiNhanhMacDinh(i: DauVaoChiNhanh): number | null {
  if (i.daChon === 'tat-ca') return null;
  if (i.daChon !== null) return i.daChon;
  const soLop = (b: number) => i.lopDay.filter((x) => x === b).length;
  const nhieuNhat = (ds: readonly number[]) =>
    [...new Set(ds)].sort((a, b) => soLop(b) - soLop(a) || a - b)[0] ?? null;
  return nhieuNhat(i.quanLy) ?? nhieuNhat(i.lopDay) ?? i.cuoi;
}
