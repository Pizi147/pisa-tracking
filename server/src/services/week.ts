import { db } from '../db.ts';
import { addDays, nowIso, parseDate } from '../util.ts';

/**
 * Mã tuần dạng "W1 SEP".
 *
 * Tuần chạy từ thứ Hai đến Chủ nhật. Tuần thuộc THÁNG CÓ NHIỀU NGÀY HƠN, tương đương
 * tháng chứa ngày thứ Năm của tuần đó. Các tuần thuộc cùng một tháng được đánh số theo
 * thứ tự thời gian, bắt đầu từ W1.
 *
 * Mã tuần chỉ là NHÃN. Khoá thật luôn là ngày thứ Hai (có cả năm), vì "W1 SEP" lặp lại
 * mỗi năm.
 */

const MONTH_CODE = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function mondayOf(date: string): string {
  const d = parseDate(date);
  const dow = d.getUTCDay();            // 0 = Chủ nhật
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

/** Tháng sở hữu tuần = tháng chứa thứ Năm (ngày thứ 4 tính từ thứ Hai). */
export function owningMonth(weekStart: string): { year: number; month: number } {
  const thursday = parseDate(addDays(weekStart, 3));
  return { year: thursday.getUTCFullYear(), month: thursday.getUTCMonth() + 1 };
}

/** Thứ tự tuần trong tháng sở hữu: đếm các thứ Hai có cùng tháng sở hữu. */
export function weekNumberInMonth(weekStart: string): number {
  const { year, month } = owningMonth(weekStart);
  // Lùi về thứ Hai đầu tiên còn thuộc tháng này.
  let cursor = weekStart;
  let n = 1;
  for (;;) {
    const prev = addDays(cursor, -7);
    const om = owningMonth(prev);
    if (om.year !== year || om.month !== month) break;
    cursor = prev;
    n += 1;
    if (n > 6) break;                   // chặn vòng lặp bất thường
  }
  return n;
}

export type WeekInfo = {
  weekStart: string;
  weekEnd: string;
  year: number;
  month: number;
  weekNo: number;
  code: string;        // "W1 SEP"
  range: string;       // "28/09 – 04/10"
};

export function weekInfo(date: string): WeekInfo {
  const weekStart = mondayOf(date);
  const weekEnd = addDays(weekStart, 6);
  const { year, month } = owningMonth(weekStart);
  const weekNo = weekNumberInMonth(weekStart);
  const f = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  return {
    weekStart, weekEnd, year, month, weekNo,
    code: `W${weekNo} ${MONTH_CODE[month - 1]}`,
    range: `${f(weekStart)} – ${f(weekEnd)}`,
  };
}

/**
 * Hạn nhập điểm: thứ Tư của tuần KẾ TIẾP sau tuần thi.
 * Hết ngày thứ Tư mới tính quá hạn, không đánh quá hạn ngay đầu ngày.
 */
export function scoreDeadline(testDate: string): string {
  return addDays(mondayOf(testDate), 7 + 2);
}

export function isOverdue(deadline: string, today: string): boolean {
  return today > deadline;
}

// ---------------------------------------------------------------- lưu kỳ

export function ensurePeriod(date: string): { id: number } & WeekInfo {
  const info = weekInfo(date);
  const conn = db();
  const found = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(info.weekStart) as any;
  if (found) return { id: found.id, ...info };
  conn
    .prepare(
      `INSERT INTO report_periods (week_start, week_end, year, month, week_no, code, created_at)
       VALUES (?,?,?,?,?,?,?) ON CONFLICT(week_start) DO NOTHING`,
    )
    .run(info.weekStart, info.weekEnd, info.year, info.month, info.weekNo, info.code, nowIso());
  const row = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(info.weekStart) as any;
  return { id: row.id, ...info };
}

/** Trả về kèm WeekInfo dạng camelCase — hàng thô trong bảng dùng snake_case. */
export function listPeriods(limit = 20): (WeekInfo & { id: number })[] {
  const rows = db()
    .prepare('SELECT * FROM report_periods ORDER BY week_start DESC LIMIT ?')
    .all(limit) as any[];
  return rows.map((r) => ({ id: r.id, ...weekInfo(r.week_start) }));
}

export function periodById(id: number) {
  const row = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(id) as any;
  if (!row) return null;
  return { ...row, ...weekInfo(row.week_start) };
}
