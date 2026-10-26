/**
 * Trục tuần biểu đồ Hành trình kỹ năng (R1-SUA-NHO): mỗi cột một tuần, từ điểm đầu tới max(tuần này, điểm cuối).
 * Dài quá `TRAN_TUAN_TRUC` thì xem từng khung `TUAN_MOT_KHUNG` tuần, gần nhất trước. Điểm ngoài khung đang xem không vẽ
 * (`viTriTuan` = null) — không kẹp về cột đầu / cuối.
 */
export const TRAN_TUAN_TRUC = 260;
export const TUAN_MOT_KHUNG = 80;
const TUAN_MS = 7 * 86_400_000;

/** `cacTuan` = thứ Hai ISO của mọi điểm; `lui` = số khung lùi từ gần nhất (0 = gần nhất, quá thì kẹp ở khung đầu). */
export function dungTrucTuan(cacTuan: readonly string[], tuanNay: string, lui = 0): { tuan: string[]; coTruoc: boolean; coSau: boolean } {
  const xep = [...cacTuan].sort();
  const dau = Date.parse(xep[0] ?? tuanNay), cuoi = Date.parse([tuanNay, ...xep].sort().at(-1)!);
  const tuan: string[] = [];
  for (let d = dau; d <= cuoi; d += TUAN_MS) tuan.push(new Date(d).toISOString().slice(0, 10));
  if (tuan.length < 2) tuan.push(new Date(dau + TUAN_MS).toISOString().slice(0, 10));
  if (tuan.length <= TRAN_TUAN_TRUC) return { tuan, coTruoc: false, coSau: false };
  const k = Math.min(Math.max(0, lui), Math.ceil(tuan.length / TUAN_MOT_KHUNG) - 1);
  const het = tuan.length - k * TUAN_MOT_KHUNG, tu = Math.max(0, het - TUAN_MOT_KHUNG);
  return { tuan: tuan.slice(tu, het), coTruoc: tu > 0, coSau: k > 0 };
}

/** Cột của tuần `iso` trên trục; null = ngoài trục (không vẽ). */
export function viTriTuan(truc: readonly string[], iso: string): number | null {
  const i = truc.indexOf(iso);
  return i < 0 ? null : i;
}
