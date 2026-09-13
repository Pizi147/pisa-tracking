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
/**
 * Cửa sổ tuần MẶC ĐỊNH chỉ mở một tuần về phía trước — đúng cho những màn nói về KẾT QUẢ
 * (báo cáo tuần, bảng điểm): tuần chưa tới thì chưa có gì để xem.
 *
 * NHƯNG LÊN KẾ HOẠCH MT LÀ VIỆC CỦA TƯƠNG LAI. Đó là lỗi owner báo: panel "Lên kế hoạch MT"
 * không xếp được quá một tuần tới, trong khi MT3 của một em có thể cách đây bốn tháng. Nên
 * có cửa sổ RỘNG riêng, và màn nào cần thì xin đúng cửa sổ đó.
 */
export const PERIOD_WINDOW_FORWARD_WEEKS = 1;
/** Cửa sổ cho việc xếp lịch: nửa năm về phía trước, đủ cho cả một khoá FT 24 tuần. */
export const PERIOD_WINDOW_PLANNING_FORWARD_WEEKS = 30;

/**
 * Danh sách tuần cho ô chọn tuần — một CỬA SỔ TRƯỢT, không phải toàn bộ lịch sử.
 *
 * Đây là báo cáo vận hành: người dùng cần vài tuần quanh chỗ mình đang đứng, không cần
 * kéo tới cuối năm. Cửa sổ trượt theo tuần đang xem, nên chọn một tuần cũ thì danh sách
 * dịch theo — vẫn đi tiếp về quá khứ được, chỉ là mỗi lần một đoạn.
 *
 * Tương lai chỉ mở MỘT tuần: mở báo cáo của tháng sau thì chẳng có gì để báo cáo.
 */
export function periodWindow(
  anchorId?: number | null,
  opts: { forward?: number; back?: number } = {},
): (WeekInfo & { id: number; isAnchor: boolean })[] {
  const conn = db();
  const anchor = anchorId
    ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(anchorId) as any)
    : null;
  const center = anchor?.week_start ?? mondayOf(demoToday());
  const from = addDays(center, -7 * (opts.back ?? PERIOD_WINDOW_BACK_WEEKS));
  const to = addDays(center, 7 * (opts.forward ?? PERIOD_WINDOW_FORWARD_WEEKS));
  /*
   * TẠO SẴN TUẦN CÒN THIẾU trong khoảng. Bảng tuần chỉ có những tuần đã từng được dùng tới;
   * xếp lịch cho tháng sau mà tuần đó chưa tồn tại thì danh sách hiện ra một khoảng trống và
   * người dùng tưởng không xếp được.
   */
  for (let d = from; d <= to; d = addDays(d, 7)) ensurePeriod(d);
  const rows = conn
    .prepare('SELECT * FROM report_periods WHERE week_start >= ? AND week_start <= ? ORDER BY week_start DESC')
    .all(from, to) as any[];
  return rows.map((r) => ({ id: r.id, ...weekInfo(r.week_start), isAnchor: r.week_start === center }));
}

/** Số ngày cuối tuần mà báo cáo tuần bắt đầu mở để cập nhật. */
export const REPORT_EDIT_WINDOW_DAYS = 2;

/**
 * Sau khi tuần kết thúc vẫn còn thời gian bổ sung đến HẾT THỨ TƯ TUẦN SAU.
 * Chủ nhật + 3 ngày = thứ Tư. Quá mốc đó thì khoá hẳn, chỉ Quản trị hệ thống mở lại.
 */
export const GRACE_DAYS_AFTER_WEEK = 3;

/**
 * Báo cáo tuần chỉ được cập nhật trong HAI NGÀY CUỐI của chính tuần đó.
 *
 * Đầu tuần thì chưa có gì để báo cáo — mở sẵn ô nhập chỉ mời người ta ghi phỏng đoán.
 * Tuần tương lai lại càng không: hiện tại vẫn mở được một tuần cuối năm và nhập bình
 * thường, đó là lỗi. Tuần đã qua thì đóng lại, sửa hồi tố là quyết định vận hành riêng
 * chứ không phải mặc định.
 */
export function reportEditWindow(
  period: { id?: number; week_start: string; week_end: string; code?: string },
  today = demoToday(),
): {
  open: boolean; reason: string | null; opensOn: string; closesOn: string;
  /** Đã khoá hẳn, chỉ Quản trị hệ thống mở lại được. */
  locked: boolean;
  /** Quản trị hệ thống đã mở lại tuần này. */
  unlocked: boolean;
} {
  const opensOn = addDays(period.week_end, -(REPORT_EDIT_WINDOW_DAYS - 1));
  // Hết thứ Tư tuần sau: Chủ nhật + 3 ngày.
  const closesOn = addDays(period.week_end, GRACE_DAYS_AFTER_WEEK);
  const unlocked = period.id ? isPeriodUnlocked(period.id) : false;
  const base = { opensOn, closesOn, unlocked };

  if (today < period.week_start) {
    return { ...base, open: false, locked: false,
      reason: `Tuần ${period.code ?? ''} chưa bắt đầu — chưa có gì để báo cáo.`.trim() };
  }
  if (today < opensOn) {
    return { ...base, open: false, locked: false,
      reason: `Báo cáo tuần mở từ ${opensOn} (hai ngày cuối tuần).` };
  }
  if (today <= closesOn) {
    // Trong tuần, hoặc trong thời gian bù đến hết thứ Tư tuần sau.
    return { ...base, open: true, locked: false, reason: null };
  }
  // Đã quá hạn bù: khoá hẳn, trừ khi Quản trị hệ thống mở lại.
  if (unlocked) {
    return { ...base, open: true, locked: true,
      reason: 'Tuần này đã quá hạn nhưng Quản trị hệ thống đã mở lại để bổ sung.' };
  }
  return { ...base, open: false, locked: true,
    reason: `Đã quá hạn bổ sung (hết ${closesOn}, tức thứ Tư tuần sau). Cần Quản trị hệ thống mở lại.` };
}

/**
 * Quản trị hệ thống mở lại một tuần đã khoá.
 *
 * Ghi vào `demo_config` thay vì thêm một bảng riêng: đây là một ngoại lệ hiếm, có người và
 * thời điểm, không phải một trạng thái nghiệp vụ thường xuyên.
 */
export function isPeriodUnlocked(periodId: number): boolean {
  return !!db().prepare('SELECT value FROM demo_config WHERE key = ?').get(`report_unlock:${periodId}`);
}

export function setPeriodUnlocked(periodId: number, on: boolean, actorUserId: number | null) {
  const conn = db();
  const key = `report_unlock:${periodId}`;
  if (on) {
    conn
      .prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
      .run(key, JSON.stringify({ by: actorUserId, at: nowIso() }), nowIso());
  } else {
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(key);
  }
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
