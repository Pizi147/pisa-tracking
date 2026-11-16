import { t } from '../i18n/index.ts';
/** "KHÁC" (T13, YC-8): chọn Khác → ô chữ nhỏ ngay dưới, bắt buộc ≥ 3 ký tự. Thay luật cũ "Khác thì mô tả ≥ 30 ký tự" (V05, cases.ts). */
export const KHAC_TOI_THIEU = 3;
/**
 * AUDIT-1611 · luật N50 (6) (chủ SP 16/11): MỌI ô lý do / nhận xét / mô tả bắt buộc dùng MỘT ngưỡng — 8 ký tự (trước rải 8 / 10 / 15; bàn giao 15 → 8).
 * Các hằng theo việc (`CHU_TOI_THIEU_CASE`, `NHAN_XET_TOI_THIEU`…) chỉ là tên gọi của số này. Ô tên ngắn ("Khác", tên vi phạm) giữ 3.
 */
export const CHU_TOI_THIEU = 8;
const MA_KHAC = new Set(['other', 'khac', 'other_proposal']);
export function laKhac(ma: string | null | undefined): boolean { return !!ma && (MA_KHAC.has(ma) || ma.endsWith('.other')); }
export function kiemGhiRoKhac(text: unknown): string | null {
  const n = String(text ?? '').trim().length;
  if (n >= KHAC_TOI_THIEU) return null;
  return n === 0 ? t('Ghi rõ "Khác" là gì') : t('Cần ít nhất {toiThieu} ký tự (đang có {n})', { toiThieu: KHAC_TOI_THIEU, n });
}
/** Chỗ không có cột riêng cho chữ "Khác" (vi phạm, PA đề xuất — Q9): ghép vào đầu mô tả; sửa lại không ghép hai lần. */
export function ghepKhac(ghiRo: string, moTa: string): string {
  const a = ghiRo.trim(); const b = moTa.trim();
  if (!a) return b;
  if (!b) return a;
  return b === a || b.startsWith(`${a} — `) ? b : `${a} — ${b}`;
}
/** Ngược của `ghepKhac` (form sửa): phần trước " — " ĐẦU TIÊN là Ghi rõ, phần sau là mô tả — cùng luật máy chủ (`violations.ts`). */
export function tachKhac(moTa: string): { ghiRo: string; moTa: string } {
  const i = moTa.indexOf(' — ');
  return i < 0 ? { ghiRo: '', moTa } : { ghiRo: moTa.slice(0, i).trim(), moTa: moTa.slice(i + 3).trim() };
}
