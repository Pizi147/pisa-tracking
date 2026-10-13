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
 * thống nhất + lời gọi nội bộ). `choThang` (Dự kiến thi, T9): nhận thêm `mm/yyyy` / `yyyy-mm` → trả tháng `yyyy-mm`.
 * KHÔNG nhận `dd/mm` thiếu năm, KHÔNG đoán `mm/dd`. Ô trống hoặc "-" → { iso: null, loi: null }.
 */
export function docNgayNhap(raw: unknown, homNay: string,
  luat: { choThang?: boolean; toiDa?: string | null; toiThieu?: string | null } = {}): { iso: string | null; loi: string | null } {
  const s = String(raw ?? '').trim();
  if (TRONG.has(s.toLowerCase())) return { iso: null, loi: null };
  const mau = luat.choThang ? 'Gõ dạng dd/mm/yyyy hoặc mm/yyyy' : 'Gõ dạng dd/mm/yyyy';
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

/** PR-TOC — cận năm của ô ngày nhập, chặn năm gõ nhầm (0208, 2206…). Ngày sinh: từ 1900 tới hôm nay. */
export const NGAY_SINH_TOI_THIEU = '1900-01-01';
/** PR-TOC — tuần bắt đầu học, dự kiến thi: trong khoảng năm nay −3 … năm nay +3. */
export function canNamGan(homNay: string): { toiThieu: string; toiDa: string } {
  const y = Number(homNay.slice(0, 4));
  return { toiThieu: `${y - 3}-01-01`, toiDa: `${y + 3}-12-31` };
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
  | 'entrySpeaking' | 'target' | 'examDate' | 'daThiToiMt' | 'startWeek' | 'classCode' | 'route' | 'consultant';

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
  daThiToiMt: ['da thi toi mt', 'da thi toi', 'mt da thi'],
  startWeek: ['tuan bat dau', 'tuan bat dau hoc', 'tuan hoc dau tien', 'start week', 'ngay bat dau', 'bat dau'],
  classCode: ['lop', 'ma lop', 'class'],
  route: ['lo trinh', 'route'],
  consultant: ['tu van vien', 'tvv', 'consultant'],
};
const BO_QUA_IM = new Set(['', 'stt', 'so thu tu', 'tinh trang']);

export const chuanTieuDe = (h: string) => h.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * PR-SL: Sửa thông tin cả lớp lưu THEO LÔ — mỗi em ~10 câu ghi, cả lớp một lần vượt 10 s của Netlify trên Turso. Web gửi lần lượt
 * từng lô `LO_LUU_SUA_CA_LOP` em (mỗi lô một request, một giao dịch, một khoá chống gửi trùng); máy chủ nhận tối đa
 * `TOI_DA_LUU_SUA_CA_LOP` em một lần. Xem trước vẫn kiểm cả lớp một lần.
 */
export const LO_LUU_SUA_CA_LOP = 8;
export const TOI_DA_LUU_SUA_CA_LOP = 10;
export function chiaLo<T>(ds: readonly T[], co: number): T[][] {
  const ra: T[][] = [];
  for (let i = 0; i < ds.length; i += co) ra.push(ds.slice(i, i + co));
  return ra;
}

/**
 * Q29-1 (PR-KCK): ô Target ghi `KCK` / `-` / "không cam kết" = học viên KHÔNG CAM KẾT đầu ra (OV-9: dấu riêng — Target giữ, có kỳ vọng; không SOS).
 * KHÁC ô trống (= chưa có target, vẫn có việc "Điền target"). Dùng chung cho nhập học viên, sửa target, Đề xuất sửa.
 */
export const KCK = 'KCK';
export const GIAI_THICH_KCK = 'Không cam kết đầu ra — không tính SOS';
export const laKck = (v: unknown): boolean => {
  const s = String(v ?? '').trim();
  return /^[-–—]$/.test(s) || ['kck', 'khong cam ket'].includes(chuanTieuDe(s));
};

/*
 * OV-9 (chủ SP 13/10, KCK nhẹ): KCK là DẤU RIÊNG, Target giữ. Ô Target nhận "6.5", "6.5 KCK", "KCK" (/ "-" / "không cam kết") hoặc trống.
 * Dưới kỳ vọng em KCK không SOS — chỉ chip trung tính `DUOI_KY_VONG_KCK` + Case nhẹ cho GV.
 */
export const DUOI_KY_VONG_KCK = 'Dưới kỳ vọng · KCK';
/** "6.5 KCK" → { so: '6.5', kck: true }; "KCK" / "-" → { so: '', kck: true }; còn lại giữ nguyên, kck false. Nơi gọi tự kiểm phần số. */
export function tachKck(v: unknown): { so: unknown; kck: boolean } {
  if (laKck(v)) return { so: '', kck: true };
  const m = typeof v === 'string' ? /^(.+?)\s*kck$/i.exec(v.trim()) : null;
  return m ? { so: m[1].trim(), kck: true } : { so: v, kck: false };
}
/** Chữ ô Target (lưới nhập, gửi máy chủ): "6.5 KCK" · "KCK" · "6.5" · "". */
export const chuTargetKck = (target: number | string | null | undefined, kck: boolean | null | undefined): string => {
  const so = target === null || target === undefined ? '' : String(target);
  return kck ? (so ? `${so} ${KCK}` : KCK) : so;
};
/** Ô Target dạng chữ (lưới nhập, dán Excel, Sửa cả lớp): "-" / "kck" → "KCK", "6.5 kck" → "6.5 KCK"; còn lại giữ nguyên. */
export function chuanOTarget(v: string): string {
  const t = tachKck(v);
  return t.kck ? chuTargetKck(String(t.so ?? '').trim() || null, true) : v;
}
/** Hiện Target ở mọi màn / Hành trình: "6.5 · KCK" · "— · KCK" (KCK mà chưa có Target) · "6.5" · "—". */
export const hienTargetKck = (target: number | string | null | undefined, kck: boolean | null | undefined): string => {
  const so = target === null || target === undefined ? '—' : String(target);
  return kck ? `${so} · ${KCK}` : so;
};

const BANG_TIEU_DE = new Map<string, CotNhap>(Object.entries(TIEU_DE).flatMap(([k, ds]) => ds.map((a) => [a, k as CotNhap] as const)));

/** YC-5.2: cột dán nhận THEO TIÊU ĐỀ, không theo thứ tự. Cột lạ/lặp → `boQua` (báo người dán); cột lặp lấy cột đầu. */
export function nhanDangCot(dongDau: string[]): { cot: (CotNhap | null)[]; boQua: string[] } {
  const bang = BANG_TIEU_DE;
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
  { key: 'fullName', nhan: 'Họ và tên', batBuoc: true }, { key: 'dob', nhan: 'Ngày sinh', batBuoc: true }, { key: 'email', nhan: 'Email' },
];
const COT_BAND: CotLuoi[] = [
  { key: 'baselineScore', nhan: 'Overall', so: true }, { key: 'entryListening', nhan: 'L', so: true },
  { key: 'entryReading', nhan: 'R', so: true }, { key: 'entryWriting', nhan: 'W', so: true },
  { key: 'entrySpeaking', nhan: 'S', so: true },
];
const COT_MUC_TIEU: CotLuoi[] = [{ key: 'target', nhan: 'Target', so: true }, { key: 'examDate', nhan: 'Dự kiến thi' }];
const COT_DA_THI: CotLuoi = { key: 'daThiToiMt', nhan: 'Đã thi tới MT', so: true };
const COT_TUAN: CotLuoi = { key: 'startWeek', nhan: 'Tuần bắt đầu', batBuoc: true };
/** YC-5.2 thứ tự cột — quyết định chủ sản phẩm 04/10 (thay K2-41): lớp thường cũng có Target + Dự kiến thi.
 *  FT: Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Dự kiến thi · Đã thi tới MT (K2-33) · Tuần bắt đầu.
 *  Lớp thường (Pre FOU · FOU · BE · ELE): Họ tên · Ngày sinh · Email · Target · Dự kiến thi · Tuần bắt đầu. Cột Tình trạng do giao diện vẽ. */
export const cotLuoiNhap = (lopThuong: boolean): CotLuoi[] =>
  lopThuong ? [...COT_DAU, ...COT_MUC_TIEU, COT_TUAN] : [...COT_DAU, ...COT_BAND, ...COT_MUC_TIEU, COT_DA_THI, COT_TUAN];
const NHAN_KHAC: Record<string, string> = { classCode: 'Lớp', route: 'Lộ trình', consultant: 'Tư vấn viên' };
export const nhanCotNhap = (field: string) => cotLuoiNhap(false).find((c) => c.key === field)?.nhan ?? NHAN_KHAC[field] ?? field;

/**
 * Tuần bắt đầu mặc định cho cả lô (YC-5.4). Planning chốt 29/09 (câu hỏi 1 của PR-MT, thay K2-19): mọi lớp lấy TUẦN KHAI GIẢNG —
 * em vào muộn thì xem trước báo "n MT sẽ là MT lịch sử" để người nhập đổi tuần nếu cần. Lớp FT chưa có ngày khai giảng → tuần này.
 * Trả Thứ Hai ISO; `null` = lớp thường chưa có ngày khai giảng.
 */
export function tuanBatDauMacDinh(lop: { lopThuong: boolean; khaiGiang: string | null }, homNay: string): string | null {
  if (lop.khaiGiang) return mondayOfDate(lop.khaiGiang);
  return lop.lopThuong ? null : mondayOfDate(homNay);
}

/**
 * PR-NT (yêu cầu bổ sung 04/10): dán từ Excel KHÔNG bắt buộc dòng tiêu đề. Dòng đầu là tiêu đề khi có ô khớp NGUYÊN Ô "Họ và tên" (hoặc
 * bí danh) HOẶC ≥ 2 ô khớp tên cột đã biết, VÀ không ô nào trông như dữ liệu (email, ngày/tháng, số). Chống mất dữ liệu: nghiêng về
 * "là học viên" — tên người ("Nguyễn Văn An", "Email Nguyễn") không khớp nguyên ô nên không bị nuốt; đoán sai thì người dùng đổi bằng một nút.
 */
export function laDongTieuDe(o: string[]): boolean {
  const ten = o.map((c) => BANG_TIEU_DE.get(chuanTieuDe(c)) ?? null);
  const khop = ten.filter(Boolean).length;
  if (!ten.includes('fullName') && khop < 2) return false;
  return !o.some((c) => {
    const s = c.trim();
    return !!s && (!!docEmail(s).email || !!docNgayNhap(s, '2100-12-31', { choThang: true }).iso || /^\d+([.,]\d+)?$/.test(s));
  });
}

/** Cách web đã đọc vùng dán — trả về để panel nói rõ và cho đổi. `thua`: số ô có dữ liệu dư ở dòng dài nhất (bị bỏ); `thieu`: số cột lưới
 *  không có ô ở dòng ngắn nhất (chỉ khi không tiêu đề). */
export type CachDoc = { coTieuDe: boolean; daDoan: boolean; thuTu: CotNhap[]; boQua: string[]; thua: number; thieu: number };

/**
 * `coTieuDe`: undefined = tự đoán (`laDongTieuDe`); true/false = người dùng chọn. Có tiêu đề → khớp theo tên.
 * MỘT MẪU EXCEL CHUNG (chủ sản phẩm 04/10, PR-SL): không tiêu đề → MỌI lớp đọc theo thứ tự cột Fast Track `cotLuoiNhap(false)`. Lớp thường
 * bỏ cột không dùng (Overall, L, R, W, S, Đã thi tới MT) — tên cột vào `boQua`, một lưu ý cho cả lô.
 */
export function docDongDan(dong: string[][], lopThuong: boolean, coTieuDe?: boolean): { cot: (CotNhap | null)[]; batDau: 0 | 1; cach: CachDoc } {
  const laTieuDe = coTieuDe ?? laDongTieuDe(dong[0] ?? []);
  const dung = new Set(cotLuoiNhap(lopThuong).map((c) => c.key));
  const mau = cotLuoiNhap(false);
  const { cot, boQua } = laTieuDe ? nhanDangCot(dong[0] ?? [])
    : { cot: mau.map((c) => (dung.has(c.key) ? c.key : null)), boQua: mau.filter((c) => !dung.has(c.key)).map((c) => c.nhan) };
  const batDau = laTieuDe ? 1 : 0;
  /* Độ dài "thật" của dòng: tới ô cuối có chữ (Excel hay kèm tab trống ở cuối). */
  const dai = dong.slice(batDau).map((d) => { let n = d.length; while (n > 0 && !d[n - 1].trim()) n -= 1; return n; });
  const thua = Math.max(0, ...dai.map((n) => n - cot.length));
  /* Chỉ đếm cột lớp này DÙNG (lớp thường không báo thiếu cột band). */
  const thieu = laTieuDe || !dai.length ? 0 : cot.slice(Math.min(...dai)).filter(Boolean).length;
  return {
    cot, batDau,
    cach: { coTieuDe: laTieuDe, daDoan: coTieuDe === undefined, thuTu: cot.filter((k): k is CotNhap => !!k), boQua, thua, thieu },
  };
}
