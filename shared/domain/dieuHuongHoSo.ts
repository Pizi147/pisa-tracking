/** Hồ sơ trước / sau trong danh sách người dùng vừa mở (chủ sản phẩm 03/10, Q-0310-4). */
export type NguCanhDs = { loai: 'hoc-vien' | 'lop' | 'luot'; ids: number[]; nhan: string };

export function keBen(ds: readonly number[], id: number): { truoc: number | null; sau: number | null; viTri: number; tong: number } | null {
  const i = ds.indexOf(id);
  if (i < 0) return null;
  return { truoc: i > 0 ? ds[i - 1] : null, sau: i < ds.length - 1 ? ds[i + 1] : null, viTri: i + 1, tong: ds.length };
}

/** Danh sách đi qua `location.state` / `sessionStorage` là dữ liệu ngoài — chỉ nhận đúng dạng, đúng loại, có chứa `id` đang xem. */
export function docNguCanhDs(x: unknown, loai: NguCanhDs['loai'], id: number): NguCanhDs | null {
  const o = x as Partial<NguCanhDs> | null | undefined;
  if (!o || o.loai !== loai || typeof o.nhan !== 'string' || !Array.isArray(o.ids)) return null;
  if (!o.ids.every((n) => Number.isInteger(n) && n > 0) || !o.ids.includes(id)) return null;
  return { loai, ids: o.ids, nhan: o.nhan };
}
