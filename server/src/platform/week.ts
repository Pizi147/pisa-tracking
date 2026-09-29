import { chenNhieuDong, db, theoLo } from '../db.ts';
import { addDays, nowIso, parseDate } from '../util.ts';
import { demoToday } from '../demoConfig.ts';

/**
 * Mã tuần dạng "W1 SEP 2026".
 *
 * Tuần chạy từ thứ Hai đến Chủ nhật. Tuần thuộc THÁNG CÓ NHIỀU NGÀY HƠN, tương đương
 * tháng chứa ngày thứ Năm của tuần đó. Các tuần thuộc cùng một tháng được đánh số theo
 * thứ tự thời gian, bắt đầu từ W1.
 *
 * Mã tuần chỉ là NHÃN, nhưng NHÃN PHẢI CÓ NĂM. "W1 SEP" lặp lại mỗi năm, mà lịch MT và
 * dự kiến thi hay rơi sang năm sau, nên thiếu năm là người đọc hiểu nhầm. Khoá thật vẫn
 * luôn là ngày thứ Hai.
 */

/*
 * QUY ƯỚC MÃ TUẦN nay nằm ở `shared/domain/week.ts` — giao diện cũng cần dựng mã tuần khi
 * vẽ trục thời gian của hành trình, và hai bản cài đặt cho một quy ước thì sớm muộn hai chỗ
 * gọi cùng một tuần bằng hai cái tên. Ở đây chỉ còn phần đụng tới database.
 */
import { MONTH_CODE, owningMonthOf, weekNumberInMonthOf } from '../../../shared/domain/index.ts';

export function mondayOf(date: string): string {
  const d = parseDate(date);
  const dow = d.getUTCDay();            // 0 = Chủ nhật
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

/** Tháng sở hữu tuần = tháng chứa thứ Năm (ngày thứ 4 tính từ thứ Hai). */
export function owningMonth(weekStart: string): { year: number; month: number } {
  return owningMonthOf(weekStart);
}

/** Thứ tự tuần trong tháng sở hữu: đếm các thứ Hai có cùng tháng sở hữu. */
export function weekNumberInMonth(weekStart: string): number {
  return weekNumberInMonthOf(weekStart);
}

export type WeekInfo = {
  weekStart: string;
  weekEnd: string;
  year: number;
  month: number;
  weekNo: number;
  code: string;        // "W1 SEP 2026"
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
    code: `W${weekNo} ${MONTH_CODE[month - 1]} ${year}`,
    range: `${f(weekStart)} – ${f(weekEnd)}`,
  };
}

/**
 * Hạn nhập điểm MẶC ĐỊNH của Fast Track: thứ Tư của tuần KẾ TIẾP sau tuần thi.
 * Hết ngày thứ Tư mới tính quá hạn, không đánh quá hạn ngay đầu ngày.
 */
export function defaultScoreDeadline(baseDate: string): string {
  return addDays(mondayOf(baseDate), 7 + 2);
}

/** Lớp nào chấm theo band IELTS (Fast Track), lớp nào chấm theo tỷ lệ điểm đạt (Normal). */
export type ScoringMode = 'band' | 'ratio';

/**
 * HẠN CHẤM CỦA MỘT KỸ NĂNG — tính từ TUẦN THI CỦA CHÍNH KỸ NĂNG ĐÓ (mục 10.5).
 *
 *     Fast Track   hết thứ Tư của tuần kế tiếp sau tuần thi kỹ năng đó
 *     Normal       hết Chủ nhật của chính tuần thi kỹ năng đó
 *
 * Đây là ĐIỂM KHÁC BIỆT LỚN NHẤT của vòng 7 so với trước. Trước đây cả đợt dùng chung một
 * hạn, nên dời Speaking sang tuần sau là vô tình gia hạn luôn cho R/L/W đã thi từ tuần
 * trước — ba môn đang quá hạn bỗng sạch nợ. Nay mỗi kỹ năng mang hạn của riêng nó: dời
 * Speaking chỉ đổi hạn Speaking.
 *
 * Hệ quả thứ hai: kỹ năng có tuần thi CHƯA TỚI thì chưa có gì để nợ. Hàm này vẫn trả về
 * một ngày, nhưng nơi gọi phải kiểm "đã đến tuần chưa" trước khi gọi một môn là quá hạn.
 */
export function skillScoreDeadline(mode: ScoringMode, weekStart: string): string {
  const monday = mondayOf(weekStart);
  return mode === 'ratio' ? addDays(monday, 6) : addDays(monday, 7 + 2);
}

export function isOverdue(deadline: string, today: string): boolean {
  return today > deadline;
}

// ---------------------------------------------------------------- lưu kỳ

export function ensurePeriod(date: string): { id: number } & WeekInfo {
  return ensurePeriods([date]).get(date)!;
}

/**
 * `ensurePeriod` cho NHIỀU ngày (PR-TOC): đọc một câu, chèn tuần còn thiếu một câu, đọc lại một câu — không lặp theo từng ngày.
 * Khoá của Map là đúng chuỗi ngày truyền vào.
 */
export function ensurePeriods(dates: readonly string[]): Map<string, { id: number } & WeekInfo> {
  const info = new Map(dates.map((d) => [d, weekInfo(d)]));
  const tuan = [...new Set([...info.values()].map((w) => w.weekStart))];
  const conn = db();
  const idOf = new Map<string, number>();
  const doc = (ds: string[]) => theoLo(ds, (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, week_start FROM report_periods WHERE week_start IN (${ph})`).all(...lo) as any[]) {
      idOf.set(r.week_start, r.id);
    }
  });
  doc(tuan);
  const thieu = tuan.filter((w) => !idOf.has(w));
  if (thieu.length) {
    const now = nowIso();
    const ws = new Map([...info.values()].map((w) => [w.weekStart, w]));
    chenNhieuDong('INSERT INTO report_periods (week_start, week_end, year, month, week_no, code, created_at)',
      thieu.map((t) => { const w = ws.get(t)!; return [w.weekStart, w.weekEnd, w.year, w.month, w.weekNo, w.code, now]; }),
      ' ON CONFLICT(week_start) DO NOTHING');
    doc(thieu);
  }
  return new Map([...info].map(([d, w]) => [d, { id: idOf.get(w.weekStart)!, ...w }]));
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
/**
 * ĐƯỜNG ĐỌC — KHÔNG TẠO HÀNG (sổ §13.8): mỗi tuần trong khoảng được dựng bằng `weekInfo()`
 * thuần (không đụng database) rồi ghép với hàng thật nếu có. Tuần chưa từng được dùng tới thì
 * `id` là `null` — vẫn xuất hiện đủ trong danh sách (vẫn "chọn được"), chỉ là chưa có ID thật.
 * Nơi nào thật sự cần ID (xếp lịch, lưu) thì tự gọi `ensurePeriod(weekStart)` cho ĐÚNG MỘT tuần
 * đó tại thời điểm cần — không phải ở đây, và không phải cho cả cửa sổ.
 */
export function periodWindow(
  anchorId?: number | null,
  opts: { forward?: number; back?: number } = {},
): (WeekInfo & { id: number | null; isAnchor: boolean })[] {
  const conn = db();
  const anchor = anchorId
    ? (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(anchorId) as any)
    : null;
  const center = anchor?.week_start ?? mondayOf(demoToday());
  const from = addDays(center, -7 * (opts.back ?? PERIOD_WINDOW_BACK_WEEKS));
  const to = addDays(center, 7 * (opts.forward ?? PERIOD_WINDOW_FORWARD_WEEKS));
  const rows = conn
    .prepare('SELECT * FROM report_periods WHERE week_start >= ? AND week_start <= ?')
    .all(from, to) as any[];
  const idByWeekStart = new Map(rows.map((r) => [r.week_start as string, r.id as number]));
  const out: (WeekInfo & { id: number | null; isAnchor: boolean })[] = [];
  for (let d = to; d >= from; d = addDays(d, -7)) {
    out.push({ id: idByWeekStart.get(d) ?? null, ...weekInfo(d), isAnchor: d === center });
  }
  return out;
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
 * Hạn có hiệu lực của một lượt MT.
 *
 * Đếm từ TUẦN của lượt MT, không từ ngày của từng kỹ năng — hệ thống không còn giữ ngày
 * thi cụ thể nữa. Cả năm kỹ năng trong một lượt vì thế dùng CHUNG một hạn, đúng như cách
 * người ta nói ngoài đời: "điểm MT tuần này phải xong trước thứ Tư tuần sau".
 *
 * Có hạn tự đặt thì hạn đó thắng. Chưa xếp tuần thì KHÔNG có hạn — trả về null thay vì
 * dựng một hạn giả.
 */
export function effectiveDeadline(input: {
  weekStart: string | null;
  override: string | null;
}): { date: string | null; source: 'override' | 'default' | 'none' } {
  if (input.override) return { date: input.override, source: 'override' };
  if (input.weekStart) return { date: defaultScoreDeadline(input.weekStart), source: 'default' };
  return { date: null, source: 'none' };
}

/**
 * HẠN CÓ HIỆU LỰC CỦA MỘT KỸ NĂNG. Ba nguồn, xét theo thứ tự hẹp dần:
 *
 *   1. hạn riêng đặt cho ĐÚNG kỹ năng đó      → `skillOverride`
 *   2. hạn riêng đặt cho CẢ ĐỢT               → `attemptOverride`
 *   3. hạn mặc định theo tuần thi của kỹ năng → `skillScoreDeadline`
 *
 * Chưa xếp tuần cho kỹ năng thì KHÔNG có hạn — trả về null thay vì dựng một hạn giả từ
 * tuần của đợt. Một môn chưa có lịch thì không ai đang nợ điểm môn đó.
 */
export function effectiveSkillDeadline(input: {
  mode: ScoringMode;
  weekStart: string | null;
  skillOverride?: string | null;
  attemptOverride?: string | null;
}): { date: string | null; source: 'skill_override' | 'attempt_override' | 'default' | 'none' } {
  if (input.skillOverride) return { date: input.skillOverride, source: 'skill_override' };
  if (input.attemptOverride) return { date: input.attemptOverride, source: 'attempt_override' };
  if (input.weekStart) return { date: skillScoreDeadline(input.mode, input.weekStart), source: 'default' };
  return { date: null, source: 'none' };
}
