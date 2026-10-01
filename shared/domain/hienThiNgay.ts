/**
 * HÀM CHUNG HIỂN THỊ NGÀY VÀ TUẦN — luật G-6 (spec 2026-09-22-ux-toan-web-truoc-deploy-design §1).
 *
 *   ngày          dd/mm khi cùng năm với hôm nay, dd/mm/yyyy khi khác năm. Không bao giờ ISO.
 *   tuần lịch     W{n} {THÁNG} — "W3 SEP". Tuần thuộc tháng chứa ngày thứ Năm (week.ts). Chỉ thêm năm khi năm của tuần
 *                 khác năm hiện tại, để lịch vắt sang năm sau không bị đọc nhầm.
 *   tuần học      W{n}/{tổng} — "W8/8", tuần thứ n của một khoá lớp thường.
 *
 * Màn mới dùng ba hàm này; màn cũ chuyển dần ở các PR sau. Khoá dữ liệu (thứ Hai, mã tuần có năm) vẫn ở week.ts.
 * Chuỗi có giờ đổi sang giờ Việt Nam trước khi lấy ngày; ngày không tồn tại ra "—" (ngayTheoGioVN, display.ts).
 */
import { ngayTheoGioVN, shortDate } from './display.ts';
import { MONTH_CODE, mondayOfDate, owningMonthOf, weekNumberInMonthOf } from './week.ts';

export function ngay(d: string | null | undefined, homNay?: string | null): string {
  const s = ngayTheoGioVN(d);
  if (!s) return '—';
  if (ngayTheoGioVN(homNay)) return shortDate(s, homNay as string);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}

export function tuanLich(d: string | null | undefined, homNay?: string | null): string {
  const s = ngayTheoGioVN(d);
  if (!s) return '—';
  const start = mondayOfDate(s);
  const { year, month } = owningMonthOf(start);
  const ma = `W${weekNumberInMonthOf(start)} ${MONTH_CODE[month - 1]}`;
  const h = ngayTheoGioVN(homNay);
  if (!h) return ma;
  return owningMonthOf(mondayOfDate(h)).year === year ? ma : `${ma} ${year}`;
}

export function tuanKhoa(n: number, tong: number): string {
  if (!Number.isInteger(n) || !Number.isInteger(tong) || n < 1 || tong < 1) return '—';
  return `W${n}/${tong}`;
}

/** "tuần học 3/8" (lớp thường, có tổng) · "tuần học thứ 9" (FT — không giới hạn tuần). Cùng thân với PR-VAI-b Task 1. */
export const chuTuanHoc = (tuan: number, tong: number | null): string => (tong ? `tuần học ${tuan}/${tong}` : `tuần học thứ ${tuan}`);

/**
 * Q31-11 (chủ sản phẩm 01/10): tuần học thứ n của em FT tại tuần `tuan` — đếm từ tuần bắt đầu lộ trình `batDau`, BỎ tuần Tạm dừng
 * (tuần có ngày Tạm dừng tới trước tuần Quay lại; Tạm dừng và Quay lại cùng tuần → không trừ). Trước tuần bắt đầu, hoặc `tuan` nằm
 * trong một khoảng dừng ĐÃ khép → null. Đang dừng (chưa quay lại) → số tuần đã học tới trước tuần dừng. Cùng luật với PR-VAI-b Task 1.
 */
export function tuanHocFt(batDau: string, tuan: string, dung: readonly { tu: string; den: string | null }[]): number | null {
  const dau = mondayOfDate(batDau), den = mondayOfDate(tuan);
  if (den < dau) return null;
  const khoang = dung.map((k) => ({ tu: mondayOfDate(k.tu), den: k.den ? mondayOfDate(k.den) : null }));
  if (khoang.some((k) => k.den !== null && den >= k.tu && den < k.den)) return null;
  const dangDung = (w: string) => khoang.some((k) => w >= k.tu && (k.den === null || w < k.den));
  const TUAN_MS = 7 * 86_400_000;
  const soTuan = Math.round((Date.parse(den) - Date.parse(dau)) / TUAN_MS) + 1;
  let n = 0;
  for (let i = 0; i < soTuan; i++) if (!dangDung(new Date(Date.parse(dau) + i * TUAN_MS).toISOString().slice(0, 10))) n += 1;
  return n || null;
}
