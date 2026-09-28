/**
 * MỘT TẬP cho cả số và danh sách ở tab Ý thức lớp (PR-N1, YC-11.3.2): vi phạm chưa xử lý + vi phạm đang nằm trong PA đang
 * chuẩn bị, CÙNG lọc theo nhóm. Số "n vi phạm" trên dòng em = số dòng "Vi phạm gần đây"; "cũ nhất" tính trên vi phạm chưa xử lý.
 */
export type VpCoNhom = { id: number; category: string; occurredOn: string };

export function dongViPhamLop<V extends VpCoNhom>(i: {
  chuaXuLy: readonly V[]; dangChuanBi: readonly { id: number; kindLabel: string; violations?: readonly V[] | null }[];
  nhom: string | null; homNay: string;
}) {
  const hop = (v: V) => !i.nhom || v.category === i.nhom;
  const dong = [
    ...i.chuaXuLy.filter(hop).map((v) => ({ v, dangChuanBi: null as { id: number; kindLabel: string } | null })),
    ...i.dangChuanBi.flatMap((m) => (m.violations ?? []).filter(hop).map((v) => ({ v, dangChuanBi: { id: m.id, kindLabel: m.kindLabel } }))),
  ].sort((a, b) => b.v.occurredOn.localeCompare(a.v.occurredOn) || b.v.id - a.v.id);
  const cu = i.chuaXuLy.filter(hop).map((v) => v.occurredOn).sort()[0] ?? null;
  const cuNhatNgay = cu ? Math.round((Date.parse(`${i.homNay}T00:00:00Z`) - Date.parse(`${cu.slice(0, 10)}T00:00:00Z`)) / 86_400_000) : null;
  return { dong, so: dong.length, cuNhatNgay };
}
