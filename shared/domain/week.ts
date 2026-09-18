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

/** Mã ngắn để ghi trên trục chật — "W1 SEP", năm chỉ hiện khi đổi năm. */
export function weekCodeShortOf(date: string): string {
  const start = mondayOfDate(date);
  const { month } = owningMonthOf(start);
  return `W${weekNumberInMonthOf(start)} ${MONTH_CODE[month - 1]}`;
}

export { MONTH_CODE };
