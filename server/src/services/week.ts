import { db } from '../db.ts';
import { addDays, nowIso, parseDate } from '../util.ts';
import { demoToday } from '../demoConfig.ts';

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
 * Hạn nhập điểm MẶC ĐỊNH: thứ Tư của tuần KẾ TIẾP sau tuần diễn ra buổi mock.
 * Hết ngày thứ Tư mới tính quá hạn, không đánh quá hạn ngay đầu ngày.
 */
export function defaultScoreDeadline(baseDate: string): string {
  return addDays(mondayOf(baseDate), 7 + 2);
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

/** Cửa sổ tuần quanh tuần đang xem: hai tháng lịch sử, một tuần tương lai. */
export const PERIOD_WINDOW_BACK_WEEKS = 9;
export const PERIOD_WINDOW_FORWARD_WEEKS = 1;

/**
 * Danh sách tuần cho ô chọn tuần — một CỬA SỔ TRƯỢT, không phải toàn bộ lịch sử.
 *
 * Đây là báo cáo vận hành: người dùng cần vài tuần quanh chỗ mình đang đứng, không cần
 * kéo tới cuối năm. Cửa sổ trượt theo tuần đang xem, nên chọn một tuần cũ thì danh sách
 * dịch theo — vẫn đi tiếp về quá khứ được, chỉ là mỗi lần một đoạn.
 *
 * Tương lai chỉ mở MỘT tuần: mở báo cáo của tháng sau thì chẳng có gì để báo cáo.
 */
export function periodWindow(anchorId?: number | null): (WeekInfo & { id: number; isAnchor: boolean })[] {
  const conn = db();
  const anchor = anchorId
    ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(anchorId) as any)
    : null;
  const center = anchor?.week_start ?? mondayOf(demoToday());
  const from = addDays(center, -7 * PERIOD_WINDOW_BACK_WEEKS);
  const to = addDays(center, 7 * PERIOD_WINDOW_FORWARD_WEEKS);
  const rows = conn
    .prepare('SELECT * FROM report_periods WHERE week_start >= ? AND week_start <= ? ORDER BY week_start DESC')
    .all(from, to) as any[];
  return rows.map((r) => ({ id: r.id, ...weekInfo(r.week_start), isAnchor: r.week_start === center }));
}

/** Số ngày cuối tuần mà báo cáo tuần được phép cập nhật. */
export const REPORT_EDIT_WINDOW_DAYS = 2;

/**
 * Báo cáo tuần chỉ được cập nhật trong HAI NGÀY CUỐI của chính tuần đó.
 *
 * Đầu tuần thì chưa có gì để báo cáo — mở sẵn ô nhập chỉ mời người ta ghi phỏng đoán.
 * Tuần tương lai lại càng không: hiện tại vẫn mở được một tuần cuối năm và nhập bình
 * thường, đó là lỗi. Tuần đã qua thì đóng lại, sửa hồi tố là quyết định vận hành riêng
 * chứ không phải mặc định.
 */
export function reportEditWindow(period: { week_start: string; week_end: string; code?: string }, today = demoToday()): {
  open: boolean; reason: string | null; opensOn: string;
} {
  const opensOn = addDays(period.week_end, -(REPORT_EDIT_WINDOW_DAYS - 1));
  if (today < period.week_start) {
    return { open: false, reason: `Tuần ${period.code ?? ''} chưa bắt đầu — chưa có gì để báo cáo.`.trim(), opensOn };
  }
  if (today > period.week_end) {
    return { open: false, reason: 'Tuần này đã kết thúc. Sửa lại báo cáo cũ cần quyết định riêng của quản lý.', opensOn };
  }
  if (today < opensOn) {
    return { open: false, reason: `Báo cáo tuần mở từ ${opensOn} (hai ngày cuối tuần).`, opensOn };
  }
  return { open: true, reason: null, opensOn };
}

export function periodById(id: number) {
  const row = db().prepare('SELECT * FROM report_periods WHERE id = ?').get(id) as any;
  if (!row) return null;
  return { ...row, ...weekInfo(row.week_start) };
}

/**
 * Hạn có hiệu lực của một kỹ năng.
 *
 * Chỉ MỘT hạn có hiệu lực tại một thời điểm: nếu lượt MT có hạn tự đặt thì dùng hạn đó,
 * không thì lấy hạn mặc định tính từ tuần diễn ra buổi mock của chính kỹ năng đó
 * (LRW theo lịch chính, Speaking theo lịch Speaking).
 *
 * Chưa có ngày lịch nào thì KHÔNG có hạn — trả về null thay vì dựng một hạn giả.
 */
export function effectiveDeadline(input: {
  scheduledFor: string | null;
  override: string | null;
}): { date: string | null; source: 'override' | 'default' | 'none' } {
  if (input.override) return { date: input.override, source: 'override' };
  if (input.scheduledFor) return { date: defaultScoreDeadline(input.scheduledFor), source: 'default' };
  return { date: null, source: 'none' };
}
