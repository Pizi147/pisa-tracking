/** Tiện ích ngày tháng, chuỗi và lỗi HTTP dùng chung cho toàn bộ server. */
import { dichSang, type Bien, type Khoa } from '../../shared/i18n/index.ts';

export class HttpError extends Error {
  /** PR-EN: câu Việt có `{biến}` (= khoá từ điển) + giá trị biến — web tiếng Anh dịch theo khoá. Câu không biến không cần: web dịch theo chính câu. */
  khoa?: Khoa;
  bien?: Bien;
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
/** PR-EN: lỗi có biến — câu Việt = `khoa` thay `{biến}`; gửi kèm `khoa` + `bien` để web dịch (khoá phải có bản Anh, tsc kiểm). */
export function loi(status: number, khoa: Khoa, bien?: Bien, details?: unknown): HttpError {
  const e = new HttpError(status, dichSang('vi', khoa, bien), details);
  e.khoa = khoa;
  e.bien = bien;
  return e;
}
export const badRequest = (m: string, d?: unknown) => new HttpError(400, m, d);
export const forbidden = (m: string, d?: unknown) => new HttpError(403, m, d);
export const notFound = (m = 'Không tìm thấy dữ liệu') => new HttpError(404, m);
export const conflict = (m: string, d?: unknown) => new HttpError(409, m, d);

/**
 * PR-TOC — ô CHỮ từ JSON phải là chuỗi (hoặc trống): object/mảng lọt vào `.trim()` là lỗi 500, vào `String()` thành chữ
 * "[object Object]" được lưu thật. Ô trong `so` nhận thêm số (band, target… gửi dạng số từ lưới). `ten(k)`: tên ô trong câu báo lỗi.
 */
export function kiemKieuO(o: Record<string, unknown>, chu: readonly string[], so: readonly string[] = [],
  ten: (k: string) => string = (k) => k): void {
  for (const k of [...chu, ...so]) {
    const v = o[k];
    if (v === undefined || v === null || typeof v === 'string' || (typeof v === 'number' && so.includes(k))) continue;
    throw badRequest(`${ten(k)}: giá trị không hợp lệ — cần ${so.includes(k) ? 'số hoặc chữ' : 'chữ'}.`);
  }
}

/**
 * PR-Dọn (Q4): CHỮ TỰ DO lưu vào DB — một cửa kiểm kiểu và trần độ dài. Trống / không gửi → `null`; không phải chuỗi → 400
 * (không để `.trim()` trên object ra 500); dài quá `toiDa` ký tự (sau khi bỏ khoảng trắng hai đầu) → 400, KHÔNG cắt ngầm.
 */
export function chuTuDo(v: unknown, ten: string, toiDa: number): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') throw badRequest(`${ten}: giá trị không hợp lệ — cần chữ.`);
  const s = v.trim();
  if (s.length > toiDa) throw loi(400, '{ten}: Tối đa {toiDa} ký tự (đang có {n}).', { ten, toiDa, n: s.length });
  return s || null;
}

/** Ngày nghiệp vụ theo Asia/Ho_Chi_Minh, lưu dạng YYYY-MM-DD. */
export const BUSINESS_TZ = 'Asia/Ho_Chi_Minh';

export function todayInBusinessTz(luc: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(luc);
}

export function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

export function parseDate(d: string): Date {
  return new Date(d + 'T00:00:00Z');
}

export function addDays(d: string, days: number): string {
  const dt = parseDate(d);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(a).getTime() - parseDate(b).getTime()) / 86400000);
}

/** Thứ Hai của tuần chứa ngày d. */
export function weekStartOf(d: string): string {
  const dt = parseDate(d);
  const dow = dt.getUTCDay();               // 0 = CN
  const delta = dow === 0 ? -6 : 1 - dow;
  return addDays(d, delta);
}

export function nowIso(): string {
  return new Date().toISOString();
}

const DIACRITIC_MAP: Record<string, string> = { đ: 'd', Đ: 'D' };

/** Bỏ dấu để tìm kiếm và dò trùng — không bao giờ ghi đè tên gốc. */
export function normalizeName(s: string): string {
  const replaced = s.replace(/[đĐ]/g, (c) => DIACRITIC_MAP[c] ?? c);
  return replaced
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function pct(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Sinh mã dạng PREFIX-000001 từ số thứ tự. */
export function padCode(prefix: string, n: number, width = 6): string {
  return `${prefix}-${String(n).padStart(width, '0')}`;
}
