/**
 * PR-PA (§8): MỘT mẫu PA cho mọi đường (tay, quy chế SOS, bổ trợ, tutor kỳ vọng). Luật thuần — web và máy chủ cùng gọi.
 * Số buổi chỉ với Tutor, Tự học, Bổ trợ, Bổ trợ miễn phí; không bắt buộc; số nguyên 1–60. Tự học không có ô người.
 */
export const LOAI_CO_SO_BUOI = ['tutor', 'self_study', 'bo_tro', 'bo_tro_mien_phi'] as const;
const LOAI_NGUOI_DAY = new Set(['tutor', 'bo_tro', 'bo_tro_mien_phi']);
export const SO_BUOI_TOI_DA = 60;

export const coSoBuoi = (kind: string): boolean => (LOAI_CO_SO_BUOI as readonly string[]).includes(kind);
export const coNguoiDay = (kind: string): boolean => kind !== 'self_study';
export const nhanNguoiDay = (kind: string): 'Người dạy' | 'Người thực hiện' => (LOAI_NGUOI_DAY.has(kind) ? 'Người dạy' : 'Người thực hiện');

/** Ô trống (null, '', khoảng trắng) → null; còn lại → số (có thể NaN / không nguyên — hàm kiểm quyết). */
export function soBuoiTu(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  return Number(String(v).trim());
}
const nguyenTrong = (n: number, tu: number) => Number.isInteger(n) && n >= tu && n <= SO_BUOI_TOI_DA;

/** Số buổi của PA: trống được; 1–60 nguyên; không nhỏ hơn số buổi đã dạy. → câu lỗi | null. */
export function kiemSoBuoiPa(v: unknown, daDay = 0): string | null {
  const n = soBuoiTu(v);
  if (n === null) return null;
  if (!nguyenTrong(n, 1)) return 'Từ 1 đến 60 buổi, hoặc để trống';
  if (n < daDay) return `Đã dạy ${daDay} buổi — Số buổi từ ${daDay} trở lên, hoặc để trống`;
  return null;
}

/** Số buổi tuần này (Kết quả của PA có Số buổi): bắt buộc, số nguyên 0–60 (0 = em nghỉ). → câu lỗi | null. */
export function kiemSoBuoiTuan(v: unknown): string | null {
  const n = soBuoiTu(v);
  return n !== null && nguyenTrong(n, 0) ? null : 'Từ 0 đến 60 buổi';
}

/** Đếm buổi: đã dạy / tổng · còn · chưa đủ | đủ | vượt (đủ / vượt chỉ gợi ý "Kết thúc PA"). */
export function demBuoi(daDay: number, tong: number): { da: number; tong: number; con: number; tt: 'chua' | 'du' | 'vuot' } {
  return { da: daDay, tong, con: Math.max(0, tong - daDay), tt: daDay < tong ? 'chua' : daDay === tong ? 'du' : 'vuot' };
}
