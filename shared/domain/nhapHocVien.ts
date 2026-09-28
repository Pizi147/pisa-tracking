/**
 * PR-NHAP — luật thuần của panel Thêm học viên và Thông tin HV (YC-5.1…5.4, T8, T9, UX-C C10, K2-19, K2-20).
 * Web và máy chủ gọi CÙNG các hàm này; máy chủ luôn kiểm lại.
 */
import { docONgay } from './oNgay.ts';
import { mondayOfDate } from './week.ts';

export type MucVanDe = 'loi' | 'luu_y';
/** Một vấn đề của một ô. `loi` chặn thêm dòng đó; `luu_y` chỉ để biết. `row` = số dòng trong lưới (0 = cả lô). */
export type VanDeNhap = { row: number; field: string; message: string; muc: MucVanDe };

const ISO_NGAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_THANG = /^\d{4}-\d{2}$/;
const TRONG = new Set(['', '-', '–', '—', 'n/a']);

/**
 * Ô ngày của bảng dán / ô gõ tay (C10, YC-5.3). Nhận `dd/mm/yyyy`, `d/m/yyyy` (dấu / . -) và ISO `yyyy-mm-dd` (giá trị của ô ngày
 * thống nhất + lời gọi nội bộ). `choThang` (Thi dự kiến, T9): nhận thêm `mm/yyyy` / `yyyy-mm` → trả tháng `yyyy-mm`.
 * KHÔNG nhận `dd/mm` thiếu năm, KHÔNG đoán `mm/dd`. Ô trống hoặc "-" → { iso: null, loi: null }.
 */
export function docNgayNhap(raw: unknown, homNay: string,
  luat: { choThang?: boolean; toiDa?: string | null; toiThieu?: string | null } = {}): { iso: string | null; loi: string | null } {
  const s = String(raw ?? '').trim();
  if (TRONG.has(s.toLowerCase())) return { iso: null, loi: null };
  const mau = luat.choThang ? 'Gõ dd/mm/yyyy hoặc mm/yyyy' : 'Gõ dd/mm/yyyy';
  let text = s;
  let kieu: 'ngay' | 'thang';
  if (ISO_NGAY.test(s)) { text = `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`; kieu = 'ngay'; }
  else if (luat.choThang && ISO_THANG.test(s)) { text = `${s.slice(5, 7)}/${s.slice(0, 4)}`; kieu = 'thang'; }
  else {
    const p = s.split(/[/.\-]/);
    if (p.length === 3 && /^\d{1,2}$/.test(p[0]) && /^\d{1,2}$/.test(p[1]) && /^\d{4}$/.test(p[2])) kieu = 'ngay';
    else if (luat.choThang && p.length === 2 && /^\d{1,2}$/.test(p[0]) && /^\d{4}$/.test(p[1])) kieu = 'thang';
    else return { iso: null, loi: mau };
  }
  const r = docONgay(text, kieu, homNay, { toiDa: luat.toiDa, toiThieu: luat.toiThieu });
  return { iso: r.iso, loi: r.iso ? null : (r.loi ?? mau) };
}

const MAU_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Email học viên (T8): cắt khoảng trắng, chữ thường. Không bắt duy nhất (anh chị em có thể dùng chung email phụ huynh). */
export function docEmail(raw: unknown): { email: string | null; loi: string | null } {
  const s = String(raw ?? '').trim().toLowerCase();
  if (TRONG.has(s)) return { email: null, loi: null };
  if (s.length > 254 || !MAU_EMAIL.test(s)) return { email: null, loi: 'Chưa đúng dạng email, ví dụ an.nguyen@gmail.com' };
  return { email: s, loi: null };
}

export type CotNhap = 'fullName' | 'dob' | 'email' | 'baselineScore' | 'entryListening' | 'entryReading' | 'entryWriting'
  | 'entrySpeaking' | 'target' | 'examDate' | 'startWeek' | 'classCode' | 'route' | 'consultant';

/** Tiêu đề cột đã chuẩn hoá (`chuanTieuDe`) → cột. `classCode`, `route` nhận diện để KHÔNG lệch cột rồi bỏ qua (K2-20). */
const TIEU_DE: Record<CotNhap, string[]> = {
  fullName: ['ho ten', 'ho va ten', 'hoten', 'ten', 'ten hoc vien', 'hoc vien', 'full name', 'name'],
  dob: ['ngay sinh', 'sinh ngay', 'dob', 'date of birth'],
  email: ['email', 'e mail', 'mail', 'gmail', 'dia chi email', 'thu dien tu'],
  baselineScore: ['ovr', 'ovr dau vao', 'diem ovr', 'dau vao', 'diem dau vao', 'baseline', 'entry', 'overall'],
  entryListening: ['l', 'listening', 'nghe', 'l dau vao'],
  entryReading: ['r', 'reading', 'doc', 'r dau vao'],
  entryWriting: ['w', 'writing', 'viet', 'w dau vao'],
  entrySpeaking: ['s', 'speaking', 'noi', 's dau vao'],
  target: ['target', 'muc tieu', 'diem cam ket', 'cam ket'],
  examDate: ['thi du kien', 'ngay thi', 'ngay thi du kien', 'thang thi', 'thang du kien thi', 'du kien thi', 'ngay thi ielts', 'exam', 'exam date'],
  startWeek: ['tuan bat dau', 'tuan bat dau hoc', 'tuan hoc dau tien', 'start week', 'ngay bat dau', 'bat dau'],
  classCode: ['lop', 'ma lop', 'class'],
  route: ['lo trinh', 'route'],
  consultant: ['tu van vien', 'tvv', 'consultant'],
};
const BO_QUA_IM = new Set(['', 'stt', 'so thu tu', 'tinh trang']);

export const chuanTieuDe = (h: string) => h.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** YC-5.2: cột dán nhận THEO TIÊU ĐỀ, không theo thứ tự. Cột lạ/lặp → `boQua` (báo người dán); cột lặp lấy cột đầu. */
export function nhanDangCot(dongDau: string[]): { cot: (CotNhap | null)[]; boQua: string[] } {
  const bang = new Map<string, CotNhap>();
  for (const [k, ds] of Object.entries(TIEU_DE)) for (const a of ds) bang.set(a, k as CotNhap);
  const daCo = new Set<CotNhap>();
  const boQua: string[] = [];
  const cot = dongDau.map((h) => {
    const c = chuanTieuDe(h);
    const k = bang.get(c) ?? null;
    if (!k || daCo.has(k)) { if (!BO_QUA_IM.has(c)) boQua.push(h.trim()); return null; }
    daCo.add(k);
    return k;
  });
  return { cot, boQua };
}

export type CotLuoi = { key: CotNhap; nhan: string; batBuoc?: boolean; so?: boolean };
const COT_DAU: CotLuoi[] = [
  { key: 'fullName', nhan: 'Họ và tên', batBuoc: true }, { key: 'dob', nhan: 'Ngày sinh' }, { key: 'email', nhan: 'Email', batBuoc: true },
];
const COT_FT: CotLuoi[] = [
  { key: 'baselineScore', nhan: 'OVR', so: true }, { key: 'entryListening', nhan: 'L', so: true },
  { key: 'entryReading', nhan: 'R', so: true }, { key: 'entryWriting', nhan: 'W', so: true },
  { key: 'entrySpeaking', nhan: 'S', so: true }, { key: 'target', nhan: 'Target', so: true }, { key: 'examDate', nhan: 'Thi dự kiến' },
];
const COT_TUAN: CotLuoi = { key: 'startWeek', nhan: 'Tuần bắt đầu', batBuoc: true };
/** YC-5.2 thứ tự cột. FT: Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Thi dự kiến · Tuần bắt đầu.
 *  Lớp thường (Pre FOU · FOU · BE · ELE): Họ tên · Ngày sinh · Email · Tuần bắt đầu (K2-41). Cột Tình trạng do giao diện vẽ. */
export const cotLuoiNhap = (lopThuong: boolean): CotLuoi[] => (lopThuong ? [...COT_DAU, COT_TUAN] : [...COT_DAU, ...COT_FT, COT_TUAN]);
const NHAN_KHAC: Record<string, string> = { classCode: 'Lớp', route: 'Lộ trình', consultant: 'Tư vấn viên' };
export const nhanCotNhap = (field: string) => [...COT_DAU, ...COT_FT, COT_TUAN].find((c) => c.key === field)?.nhan ?? NHAN_KHAC[field] ?? field;

/**
 * Tuần bắt đầu mặc định cho cả lô (YC-5.4 + K2-19). Lớp thường: tuần khai giảng. Lớp FT nhận em cuốn chiếu: lớp chưa khai giảng
 * hoặc đang ở tuần học 1–2 → tuần khai giảng; muộn hơn (hoặc lớp chưa khai ngày) → TUẦN NÀY — tránh biến MT1 thành "MT lịch sử"
 * của một bài em chưa từng thi. Trả Thứ Hai ISO; `null` = lớp thường chưa khai tuần khai giảng.
 */
export function tuanBatDauMacDinh(lop: { lopThuong: boolean; khaiGiang: string | null }, homNay: string): string | null {
  const tuanNay = mondayOfDate(homNay);
  if (!lop.khaiGiang) return lop.lopThuong ? null : tuanNay;
  const kg = mondayOfDate(lop.khaiGiang);
  if (lop.lopThuong) return kg;
  const soTuanDaQua = Math.round((Date.parse(tuanNay) - Date.parse(kg)) / (7 * 86_400_000));
  return soTuanDaQua <= 1 ? kg : tuanNay;
}
