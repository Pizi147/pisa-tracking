/**
 * OCHON-GAN-DAY (GD-5 [XM-d], bảng mẫu ⑤ A5 "Gần đây"): nhóm "Gần đây" ở ĐẦU ô chọn chung khi chưa gõ chữ — vài mục người dùng vừa chọn ở
 * đúng ô đó. Hàm thuần: nơi gọi (`ChonNguoi`) đọc / ghi danh sách gần đây (localStorage theo người dùng + ô), không gọi máy chủ.
 */
export const GAN_DAY_TOI_DA = 3;
/** Danh sách ngắn (≤ 7 mục, ⑤ A6) nhìn hết một lần — không cần "Gần đây". */
export const GAN_DAY_TU = 8;

export type MucGanDay = { id: number; ten: string };

/**
 * Dời (không nhân đôi) các mục gần đây CÓ trong danh sách hiện tại lên đầu, nhãn nhóm `nhan.ganDay`, gần nhất trước. Mục còn lại giữ nhóm và thứ tự;
 * mục không nhóm nhận `nhan.khac` để danh sách có ≥ 2 nhóm (nhãn hiện). Khớp theo id + tên (ô `ds` của nơi gọi có thể đánh id theo vị trí).
 * Mục tắt (`tat`) không đưa lên. Ít hơn `GAN_DAY_TU` mục hoặc không mục gần đây nào có mặt → giữ nguyên.
 */
export function xepGanDay<T extends MucGanDay & { nhom?: string; tat?: unknown }>(rows: readonly T[], ganDay: readonly MucGanDay[], nhan: { ganDay: string; khac: string }): T[] {
  if (rows.length < GAN_DAY_TU || !ganDay.length) return [...rows];
  const len = ganDay.flatMap((g) => rows.filter((r) => r.id === g.id && r.ten === g.ten && !r.tat).slice(0, 1));
  if (!len.length) return [...rows];
  const da = new Set(len);
  return [...len.map((r) => ({ ...r, nhom: nhan.ganDay })), ...rows.filter((r) => !da.has(r)).map((r) => (r.nhom ? r : { ...r, nhom: nhan.khac }))];
}

/** Ghi một lần chọn: mục lên đầu, bỏ bản cũ, tối đa `GAN_DAY_TOI_DA`. */
export const themGanDay = (ds: readonly MucGanDay[], muc: MucGanDay): MucGanDay[] =>
  [{ id: muc.id, ten: muc.ten }, ...ds.filter((x) => !(x.id === muc.id && x.ten === muc.ten))].slice(0, GAN_DAY_TOI_DA);

/** Đọc chuỗi đã lưu — hỏng / sai dáng → rỗng (ô chọn vẫn chạy đúng). */
export function docChuoiGanDay(s: string | null): MucGanDay[] {
  try {
    const v: unknown = s ? JSON.parse(s) : [];
    return Array.isArray(v) ? v.filter((x): x is MucGanDay => !!x && typeof x.id === 'number' && typeof x.ten === 'string').slice(0, GAN_DAY_TOI_DA) : [];
  } catch { return []; }
}
