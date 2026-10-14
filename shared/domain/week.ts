/**
 * MÃ TUẦN — "W1 SEP 2026", và đây là NƠI DUY NHẤT định nghĩa nó.
 *
 * Tuần chạy thứ Hai → Chủ nhật. Một tuần thuộc về THÁNG CHỨA NGÀY THỨ NĂM của nó, và các
 * tuần cùng tháng được đánh số từ W1 theo thứ tự thời gian.
 *
 * MÃ TUẦN LUÔN CÓ NĂM. "W1 SEP" lặp lại mỗi năm, mà lịch MT và kế hoạch thi hay rơi sang
 * năm sau — thiếu năm là người đọc hiểu nhầm. Khoá thật vẫn luôn là ngày thứ Hai.
 *
 * Để ở `shared/` vì cả máy chủ lẫn giao diện đều cần dựng mã tuần: máy chủ khi lưu kỳ báo
 * cáo, giao diện khi vẽ trục thời gian của hành trình. Hai bản cài đặt cho một quy ước là
 * cách chắc chắn nhất để hai chỗ gọi cùng một tuần bằng hai cái tên.
 */

const MONTH_CODE = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAY_MS = 86_400_000;

const ms = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Thứ Hai của tuần chứa ngày này. */
export function mondayOfDate(date: string): string {
  const t = ms(date);
  const dow = new Date(t).getUTCDay();          // 0 = Chủ nhật
  return iso(t + (dow === 0 ? -6 : 1 - dow) * DAY_MS);
}

/**
 * OV-12a: Thứ Hai ĐẦU KỲ (hai tuần) mà hạn `han` (Thứ Ba) đòi ghi — hai tuần trước tuần chứa hạn. MỘT hàm cho chữ kỳ ở Cần xử lý
 * (`tuanCuaHanGhiKetQua`), tiêu đề form Ghi kết quả (`nhanTuanGhiKetQua`) và nhật ký PA.
 */
export function tuanKetQuaCuaHan(han: string): string {
  return iso(ms(mondayOfDate(han)) - 14 * DAY_MS);
}

/**
 * HẠN GHI KẾT QUẢ PA (OV-12a, chủ SP 14/10): hai tuần một lần, hết THỨ BA. Kỳ tính từ tuần (T2→CN) chứa ngày BẮT ĐẦU PA: kỳ k = 14 ngày từ
 * Thứ Hai tuần bắt đầu + 14(k−1), hạn kỳ k = Thứ Hai đó + 14k + 1. Ví dụ bắt đầu T5 17/09/2026: kỳ 1 = 14/09–27/09 hạn 29/09, kỳ 2 hạn 13/10.
 * Không `sau` → hạn kỳ 1 (lúc PA bắt đầu); có → hạn kỳ đầu tiên > `sau`.
 */
export function hanKyGhiKetQua(batDau: string, sau?: string | null): string {
  const t2 = ms(mondayOfDate(batDau));
  const k = sau ? Math.max(1, Math.floor((ms(sau) - t2 - DAY_MS) / (14 * DAY_MS)) + 1) : 1;
  return iso(t2 + (14 * k + 1) * DAY_MS);
}

/**
 * Hạn kế sau một lần ghi (OV-12a) — hạn CỐ ĐỊNH theo lịch PA: ghi khi kỳ đang đòi chưa bắt đầu (trước hạn − 15 ngày) → giữ hạn; không thì
 * hạn kỳ đầu tiên > max(hạn hiện tại, ngày ghi) — ghi sớm, muộn hay bù nhiều kỳ đều khép tới đó. `hanHienTai` null = như lúc mới bắt đầu.
 */
export function hanKe(batDau: string, hanHienTai: string | null, ngayGhi: string): string {
  if (hanHienTai && ngayGhi < iso(ms(hanHienTai) - 15 * DAY_MS)) return hanHienTai;
  return hanKyGhiKetQua(batDau, hanHienTai && hanHienTai > ngayGhi ? hanHienTai : ngayGhi);
}

/** Tháng sở hữu tuần = tháng chứa ngày thứ Năm. */
export function owningMonthOf(weekStart: string): { year: number; month: number } {
  const th = new Date(ms(weekStart) + 3 * DAY_MS);
  return { year: th.getUTCFullYear(), month: th.getUTCMonth() + 1 };
}

/** Thứ tự tuần trong tháng sở hữu, đếm các thứ Hai có cùng tháng sở hữu. */
export function weekNumberInMonthOf(weekStart: string): number {
  const { year, month } = owningMonthOf(weekStart);
  let cursor = weekStart;
  let n = 1;
  for (;;) {
    const prev = iso(ms(cursor) - 7 * DAY_MS);
    const om = owningMonthOf(prev);
    if (om.year !== year || om.month !== month) break;
    cursor = prev;
    n += 1;
    if (n > 6) break;                            // chặn vòng lặp bất thường
  }
  return n;
}

/** Mã tuần đầy đủ của tuần chứa ngày này — "W1 SEP 2026". */
export function weekCodeOf(date: string): string {
  const start = mondayOfDate(date);
  const { year, month } = owningMonthOf(start);
  return `W${weekNumberInMonthOf(start)} ${MONTH_CODE[month - 1]} ${year}`;
}


export { MONTH_CODE };
