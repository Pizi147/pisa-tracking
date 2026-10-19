/**
 * PHÂN TRANG (OV-15e, mockup 6 khung 7) — luật thuần cho `web/src/ui/PhanTrang.tsx`: mặc định 10, chọn 20 / 50; trang ngoài tầm kẹp về trang cuối.
 * Không áp lưới nhập điểm cả lớp và hàng đợi Công việc.
 */
export const CO_TRANG = [10, 20, 50] as const;
export type CoTrang = (typeof CO_TRANG)[number];
export const CO_TRANG_MAC_DINH: CoTrang = 10;
export const laCoTrang = (n: unknown): n is CoTrang => (CO_TRANG as readonly unknown[]).includes(n);

/** Trang (1-based, đã kẹp) · số trang · chỉ số đầu (gồm) / cuối (không gồm) để `slice`. */
export function catTrang(tong: number, trang: number, co: number): { trang: number; soTrang: number; dau: number; cuoi: number } {
  const soTrang = Math.max(1, Math.ceil(tong / co));
  const tr = Math.min(Math.max(1, Math.floor(trang) || 1), soTrang);
  return { trang: tr, soTrang, dau: (tr - 1) * co, cuoi: Math.min(tong, tr * co) };
}
