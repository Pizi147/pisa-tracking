/**
 * HÀM CHUNG HIỂN THỊ NGÀY VÀ TUẦN — luật G-6 (spec 2026-09-22-ux-toan-web-truoc-deploy-design §1).
 *
 *   ngày          dd/mm khi cùng năm với hôm nay, dd/mm/yyyy khi khác năm. Không bao giờ ISO.
 *   tuần lịch     W{n} {THÁNG} — "W3 SEP". Tuần thuộc tháng chứa ngày thứ Năm (week.ts). Chỉ thêm năm khi năm của tuần
 *                 khác năm hiện tại, để lịch vắt sang năm sau không bị đọc nhầm.
 *   tuần học      W{n}/{tổng} — "W8/8", tuần thứ n của một khoá lớp thường.
 *
 * Màn mới dùng ba hàm này; màn cũ chuyển dần ở các PR sau. Khoá dữ liệu (thứ Hai, mã tuần có năm) vẫn ở week.ts.
 */
import { shortDate } from './display.ts';
import { MONTH_CODE, mondayOfDate, owningMonthOf, weekNumberInMonthOf } from './week.ts';

const hopLe = (s: string | null | undefined): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(`${s.slice(0, 10)}T00:00:00Z`));

export function ngay(d: string | null | undefined, homNay?: string | null): string {
  if (!hopLe(d)) return '—';
  if (hopLe(homNay)) return shortDate(d, homNay);
  const s = d.slice(0, 10);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}

export function tuanLich(d: string | null | undefined, homNay?: string | null): string {
  if (!hopLe(d)) return '—';
  const start = mondayOfDate(d);
  const { year, month } = owningMonthOf(start);
  const ma = `W${weekNumberInMonthOf(start)} ${MONTH_CODE[month - 1]}`;
  if (!hopLe(homNay)) return ma;
  return owningMonthOf(mondayOfDate(homNay)).year === year ? ma : `${ma} ${year}`;
}

export function tuanKhoa(n: number, tong: number): string {
  if (!Number.isInteger(n) || !Number.isInteger(tong) || n < 1 || tong < 1) return '—';
  return `W${n}/${tong}`;
}
