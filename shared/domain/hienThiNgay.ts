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

/** "tuần học 3/8" (lớp thường, có tổng) · "tuần học thứ 9" (FT — không giới hạn tuần). Cùng thân với UXF-a Task 4. */
export const chuTuanHoc = (tuan: number, tong: number | null): string => (tong ? `tuần học ${tuan}/${tong}` : `tuần học thứ ${tuan}`);

/**
 * Q31-11: tuần học thứ n của em FT tại tuần `tuan` — đếm từ tuần bắt đầu lộ trình, bỏ tuần Tạm dừng. Trước tuần bắt đầu hoặc tuần đang dừng → null.
 * Tuần Tạm dừng = tuần có ngày Tạm dừng tới TRƯỚC tuần Quay lại (Tạm dừng và Quay lại cùng tuần → không trừ tuần nào).
 */
export function tuanHocFt(batDau: string, tuan: string, dung: readonly { tu: string; den: string | null }[]): number | null {
  const a = mondayOfDate(batDau);
  const t = mondayOfDate(tuan);
  if (t < a) return null;
  const soTuan = (x: string, y: string) => Math.round((Date.parse(`${y}T00:00:00Z`) - Date.parse(`${x}T00:00:00Z`)) / (7 * 86_400_000));
  let n = soTuan(a, t) + 1;
  for (const k of dung) {
    const tu = mondayOfDate(k.tu);
    const den = k.den ? mondayOfDate(k.den) : null;
    if (t >= tu && (den === null || t < den)) return null;
    const lo = tu < a ? a : tu;
    const hi = den === null || den > t ? t : den;   // tuần `t` không nằm trong khoảng dừng → hi là cận trên mở
    if (hi > lo) n -= soTuan(lo, hi);
  }
  return n;
}
