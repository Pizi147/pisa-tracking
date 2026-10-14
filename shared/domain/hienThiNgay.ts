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
import { t } from '../i18n/index.ts';

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
  /* Không năm chỉ khi gõ lại đúng mã đó ra đúng tuần này (`docTuanLich` chọn tuần gần hôm nay nhất) — tuần xa hơn nửa năm có năm. */
  return owningMonthOf(mondayOfDate(h)).year === year && docTuanLich(ma, h) === start ? ma : `${ma} ${year}`;
}

/**
 * Bộ ĐỌC, đối ngẫu của `tuanLich` (không phải bộ định dạng thứ hai): "W4 SEP" / "w4 sep 2027" → Thứ Hai của tuần đó.
 * Không có năm = tuần mang mã đó GẦN `homNay` nhất, trong ±6 tháng (rà UXF-b P2: cuối 12/2026 gõ "W1 JAN" là tháng 1/2027, không lùi một năm).
 * Tuần không có thật (W5 SEP 2026) hoặc chữ lạ → null. `tuanLich` chỉ bỏ năm khi chính hàm này đọc ngược ra đúng tuần.
 */
export function docTuanLich(text: string, homNay: string): string | null {
  const m = /^W([1-6])\s+([A-Z]{3})(?:\s+(\d{4}))?$/i.exec(text.trim());
  const h = ngayTheoGioVN(homNay);
  const thang = m ? MONTH_CODE.indexOf(m[2].toUpperCase()) : -1;
  if (!m || !h || thang < 0) return null;
  const thu2 = (nam: number): string | null => {
    const dau = new Date(Date.UTC(nam, thang, 1));
    const thuNamDau = (4 - dau.getUTCDay() + 7) % 7;                    // tuần 1 = tuần chứa Thứ Năm đầu tiên của tháng
    const t2 = new Date(dau.getTime() + (thuNamDau - 3 + 7 * (+m[1] - 1)) * 86_400_000).toISOString().slice(0, 10);
    const { year, month } = owningMonthOf(t2);
    return year === nam && month === thang + 1 ? t2 : null;
  };
  if (m[3]) return thu2(+m[3]);
  const nam = owningMonthOf(mondayOfDate(h)).year;
  const cach = (t2: string) => Math.abs(Date.parse(t2) - Date.parse(h)) / 86_400_000;
  return [nam - 1, nam, nam + 1].map(thu2).filter((t2): t2 is string => t2 !== null && cach(t2) <= 183)
    .sort((a, b) => cach(a) - cach(b))[0] ?? null;
}

export function tuanKhoa(n: number, tong: number): string {
  if (!Number.isInteger(n) || !Number.isInteger(tong) || n < 1 || tong < 1) return '—';
  return `W${n}/${tong}`;
}

/**
 * "tuần học 3/8" (lớp thường, có tổng) · "tuần học 9" (FT — không giới hạn tuần). Cùng thân với UXF-a Task 4.
 * PR-S6F-b (D17): em đang dừng → "tuần học 14 · đang dừng"; dừng ngay tuần đầu (`tuan` null) → "đang dừng".
 */
export const chuTuanHoc = (tuan: number | null, tong: number | null, dangDung = false): string => {
  const so = tuan === null ? null : tong ? t('tuần học {tuan}/{tong}', { tuan, tong }) : t('tuần học {tuan}', { tuan });
  return dangDung ? (so ? t('{so} · đang dừng', { so }) : t('đang dừng')) : so ?? '';
};

/**
 * PR-S6F-b (D17): MỘT hàm "tuần học n · đang dừng" cho đầu hồ sơ, chương Hành trình, panel Chuyển lớp / Lên lớp. `ngay` nằm trong một
 * khoảng dừng → tuần học cuối TRƯỚC tuần dừng + `dangDung`; dừng ngay tuần đầu → `{ tuan: null, dangDung: true }`; trước tuần bắt đầu → null.
 */
export function tuanHocTai(batDau: string, ngay: string, dung: readonly { tu: string; den: string | null }[]): { tuan: number | null; dangDung: boolean } | null {
  const t = mondayOfDate(ngay);
  if (t < mondayOfDate(batDau)) return null;
  const k = dung.find((x) => t >= mondayOfDate(x.tu) && (x.den === null || t < mondayOfDate(x.den)));
  if (!k) return { tuan: tuanHocFt(batDau, t, dung), dangDung: false };
  const truoc = new Date(Date.parse(`${mondayOfDate(k.tu)}T00:00:00Z`) - 7 * 86_400_000).toISOString().slice(0, 10);
  return { tuan: tuanHocFt(batDau, truoc, dung), dangDung: true };
}

/**
 * Q31-11: tuần học n của em FT tại tuần `tuan` — đếm từ tuần bắt đầu lộ trình, bỏ tuần Tạm dừng. Trước tuần bắt đầu hoặc tuần đang dừng → null.
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
