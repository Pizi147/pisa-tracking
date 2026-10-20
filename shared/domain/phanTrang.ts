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

/**
 * ĐẦU NHÓM TRÊN TRANG CÓ PHÂN TRANG (SL1 — A3-02, A7-09): bảng nhóm theo lớp mà chia trang theo dòng thì số ở đầu nhóm phải đếm trên TOÀN BỘ dòng
 * của nhóm, không trên lát trang. Trả mỗi nhóm có mặt trong `lat`: mọi dòng của nhóm (`tatCa`) + `tiep` = nhóm đã bắt đầu ở trang trước.
 * `lat` là lát của chính `tatCa` (cùng phần tử — `slice`).
 */
export function nhomTrenTrang<T>(tatCa: readonly T[], lat: readonly T[], khoa: (x: T) => string | number): Map<string | number, { tatCa: T[]; tiep: boolean }> {
  const tren = new Set(lat);
  const out = new Map<string | number, { tatCa: T[]; tiep: boolean }>();
  for (const x of tatCa) {
    const k = khoa(x);
    const g = out.get(k);
    if (g) g.tatCa.push(x); else out.set(k, { tatCa: [x], tiep: !tren.has(x) });
  }
  for (const [k, g] of out) if (!g.tatCa.some((x) => tren.has(x))) out.delete(k);
  return out;
}
