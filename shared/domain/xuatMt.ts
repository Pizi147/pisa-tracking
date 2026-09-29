import { mondayOfDate, owningMonthOf } from './week.ts';
import { tuanLich } from './hienThiNgay.ts';

/**
 * XUẤT EXCEL KẾT QUẢ TEST (PR-XUAT · YC-13.9 · T40). LUẬT THUẦN: đọc + kiểm bộ lọc, bộ cột, dựng mảng hai chiều, tên tệp.
 * Máy chủ (`phanTich/xuatMt.ts`) chỉ lọc + tính dòng rồi gọi `bangFT` / `bangThuong`; trình duyệt chỉ `aoa_to_sheet` → tải về.
 * Ô thiếu điểm là `null` (Excel để trống) — KHÔNG `'—'`, không `''`.
 */

export type KhungXuat = 'ft' | 'thuong';
export type ThoiGianXuat =
  | { kieu: 'tuan'; tu: string; den: string }          // thứ Hai YYYY-MM-DD
  | { kieu: 'thang'; tu: string; den: string }         // YYYY-MM
  | { kieu: 'dot'; dot: string[] };                    // 'mt:1'…'mt:8' | 'giua' | 'cuoi'
export type BoLocXuatMt = {
  khung: KhungXuat; chiNhanh: number[]; lop: number[]; thoiGian: ThoiGianXuat; chiDuDiem: boolean; cot: 'gon' | 'day-du';
};
export type Cell = string | number | null;

export const XUAT_TOI_DA_LUOT = 10_000;
export const XUAT_TOI_DA_TUAN = 104;
export const XUAT_TOI_DA_THANG = 24;
export const DOT_XUAT_FT = ['mt:1', 'mt:2', 'mt:3', 'mt:4', 'mt:5', 'mt:6', 'mt:7', 'mt:8'] as const;
export const DOT_XUAT_THUONG = ['giua', 'cuoi'] as const;

const TUAN_MS = 7 * 86_400_000;
const laNgayIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const laThangIso = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

/** Danh sách từ query ("1,2") hoặc body (mảng) → mảng chuỗi; `null` nếu kiểu lạ. */
function danhSach(v: unknown): string[] | null {
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v.every((x) => typeof x === 'string' || typeof x === 'number') ? v.map(String) : null;
  if (typeof v === 'string') return v.split(',').map((x) => x.trim()).filter(Boolean);
  return typeof v === 'number' ? [String(v)] : null;
}
function danhSachId(v: unknown, ten: string, toiDa: number): number[] | string {
  const ds = danhSach(v);
  if (!ds || !ds.every((x) => /^[1-9]\d{0,9}$/.test(x))) return `${ten} không hợp lệ.`;
  const ids = [...new Set(ds.map(Number))];
  return ids.length > toiDa ? `Chọn tối đa ${toiDa} ${ten.toLowerCase()}.` : ids;
}
const chuoi = (v: unknown) => (typeof v === 'string' ? v.trim() : v === undefined || v === null ? '' : String(v));

/** Trả bộ lọc sạch hoặc CÂU LỖI tiếng Việt. `o` = query (chuỗi, danh sách "1,2") hoặc body JSON — cùng một hình phẳng (`bodyXuatMt`). */
export function docBoLocXuatMt(o: Record<string, unknown>): BoLocXuatMt | string {
  const khung = chuoi(o.khung) || 'ft';
  if (khung !== 'ft' && khung !== 'thuong') return 'Khung phải là Fast Track hoặc Lớp thường.';
  const chiNhanh = danhSachId(o.chiNhanh, 'Chi nhánh', 50);
  if (typeof chiNhanh === 'string') return chiNhanh;
  const lop = danhSachId(o.lop, 'Lớp', 200);
  if (typeof lop === 'string') return lop;
  const cot = chuoi(o.cot) || 'gon';
  if (cot !== 'gon' && cot !== 'day-du') return 'Cột phải là gọn hoặc đầy đủ.';
  const du = o.du === true || chuoi(o.du) === '1' || chuoi(o.du) === 'true';

  const tg = chuoi(o.tg);
  let thoiGian: ThoiGianXuat;
  if (tg === 'tuan') {
    const tu = chuoi(o.tu), den = chuoi(o.den);
    if (!laNgayIso(tu) || !laNgayIso(den) || mondayOfDate(tu) !== tu || mondayOfDate(den) !== den) return 'Tuần phải là một ngày thứ Hai (YYYY-MM-DD).';
    if (tu > den) return 'Tuần bắt đầu phải trước hoặc bằng tuần kết thúc.';
    if ((Date.parse(den) - Date.parse(tu)) / TUAN_MS + 1 > XUAT_TOI_DA_TUAN) return `Khoảng thời gian tối đa ${XUAT_TOI_DA_TUAN} tuần.`;
    thoiGian = { kieu: 'tuan', tu, den };
  } else if (tg === 'thang') {
    const tu = chuoi(o.tu), den = chuoi(o.den);
    if (!laThangIso(tu) || !laThangIso(den)) return 'Tháng phải có dạng YYYY-MM.';
    if (tu > den) return 'Tháng bắt đầu phải trước hoặc bằng tháng kết thúc.';
    const soThang = (Number(den.slice(0, 4)) - Number(tu.slice(0, 4))) * 12 + Number(den.slice(5)) - Number(tu.slice(5)) + 1;
    if (soThang > XUAT_TOI_DA_THANG) return `Khoảng thời gian tối đa ${XUAT_TOI_DA_THANG} tháng.`;
    thoiGian = { kieu: 'thang', tu, den };
  } else if (tg === 'dot') {
    const ds = danhSach(o.dot);
    if (!ds || !ds.length) return 'Chọn ít nhất một đợt.';
    const hopLe: readonly string[] = khung === 'ft' ? DOT_XUAT_FT : DOT_XUAT_THUONG;
    const sai = ds.find((x) => !hopLe.includes(x));
    if (sai) return khung === 'ft' ? 'Khung Fast Track chỉ có đợt MT1 đến MT8.' : 'Lớp thường chỉ có đợt Giữa khoá và Cuối khoá.';
    thoiGian = { kieu: 'dot', dot: [...new Set(ds)] };
  } else return 'Chọn cách lọc thời gian: theo tuần, theo tháng hoặc theo đợt.';
  return { khung, chiNhanh, lop, thoiGian, chiDuDiem: du, cot };
}

/** Hình phẳng của bộ lọc — body POST; GET dùng `queryXuatMt` (cùng khoá, danh sách nối dấu phẩy). */
export function bodyXuatMt(f: BoLocXuatMt) {
  const t = f.thoiGian;
  return {
    khung: f.khung, chiNhanh: f.chiNhanh, lop: f.lop, cot: f.cot, du: f.chiDuDiem ? 1 : 0, tg: t.kieu,
    ...(t.kieu === 'dot' ? { dot: t.dot } : { tu: t.tu, den: t.den }),
  };
}
export function queryXuatMt(f: BoLocXuatMt): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(bodyXuatMt(f))) q.set(k, Array.isArray(v) ? v.join(',') : String(v));
  return q.toString();
}

// ------------------------------------------------------------------ nhãn

export const nhanKhoaDot = (k: string) => (k === 'giua' ? 'Giữa khoá' : k === 'cuoi' ? 'Cuối khoá' : k.startsWith('mt:') ? `MT${k.slice(3)}` : k);
const maTuanCoNam = (thuHai: string) => `${tuanLich(thuHai)} ${owningMonthOf(thuHai).year}`;
const nhanThang = (m: string) => `${m.slice(5)}/${m.slice(0, 4)}`;

/** Các dòng `[nhãn, giá trị]` mô tả bộ lọc — dùng cho sheet "Bộ lọc đã dùng" và nhãn nhật ký. `ten` = tên chi nhánh / mã lớp đã chọn. */
export function moTaBoLoc(f: BoLocXuatMt, ten: { chiNhanh: string[]; lop: string[] }): [string, string][] {
  const t = f.thoiGian;
  return [
    ['Khung', f.khung === 'ft' ? 'Fast Track (Mock Test)' : 'Lớp thường (Giữa khoá · Cuối khoá)'],
    ['Chi nhánh', ten.chiNhanh.length ? ten.chiNhanh.join(', ') : 'Mọi chi nhánh trong phạm vi'],
    ['Lớp', ten.lop.length ? ten.lop.join(', ') : 'Mọi lớp trong phạm vi'],
    ['Thời gian', t.kieu === 'tuan' ? `Theo tuần: ${maTuanCoNam(t.tu)} – ${maTuanCoNam(t.den)}`
      : t.kieu === 'thang' ? `Theo tháng: ${nhanThang(t.tu)} – ${nhanThang(t.den)}` : `Theo đợt: ${t.dot.map(nhanKhoaDot).join(', ')}`],
    ['Lượt', f.chiDuDiem ? 'Chỉ lượt đủ điểm' : 'Mọi lượt'],
    ['Cột', f.cot === 'gon' ? 'Cột gọn' : 'Cột đầy đủ'],
  ];
}

// ------------------------------------------------------------------ bộ cột Fast Track (T40)

export const COT_FT_GON = ['Mã', 'Tên', 'Chi nhánh', 'Lớp', 'Lộ trình', 'MT', 'Tuần', 'L', 'R', 'W', 'S', 'Overall', 'Target',
  'Kỳ vọng', 'SOS', 'Trạng thái lượt'] as const;                                   // 16 cột — K4-35(c)
/** T39/K4-25: W1 `TA CC LR GRA`, W2 `TR CC LR GRA`. ponytail: bảng riêng cho xuất — PR-HSM merge thì dùng `tieuChiNganCua` (Task 8). */
const TIEU_CHI = { writing1: ['TA', 'CC', 'LR', 'GRA'], writing2: ['TR', 'CC', 'LR', 'GRA'], speaking: ['FC', 'LR', 'GRA', 'P'] } as const;   // KHÔNG import CRITERIA_SHORT — PR-HSM xoá nó
export const COT_FT_THEM = ['W1', 'W2', ...TIEU_CHI.writing1.map((t) => `W1 ${t}`), ...TIEU_CHI.writing2.map((t) => `W2 ${t}`),
  ...TIEU_CHI.speaking.map((t) => `S ${t}`), 'Tuần L', 'Tuần R', 'Tuần W', 'Tuần S', 'Người nhập'];

export type DongFT = {
  ma: string; ten: string; chiNhanh: string; lop: string; loTrinh: string;
  mt: number; tuan: string; tuanBd: string;
  l: number | null; r: number | null; w: number | null; s: number | null; overall: number | null;
  target: number | 'KCK' | null; kyVong: number | null; sos: number | null; trangThai: string;
  w1: number | null; w2: number | null;
  tieuChi: Record<'writing1' | 'writing2' | 'speaking', (number | null)[]>;
  tuanKn: Record<'listening' | 'reading' | 'writing' | 'speaking', string | null>;
  nguoiNhap: string | null;
};

/** Hàng 1 = tiêu đề; mọi điểm là số hoặc `null`. */
export function bangFT(dong: DongFT[], cot: 'gon' | 'day-du'): Cell[][] {
  const day = cot === 'day-du';
  const out: Cell[][] = [day ? [...COT_FT_GON, ...COT_FT_THEM] : [...COT_FT_GON]];
  for (const d of dong) {
    const hang: Cell[] = [d.ma, d.ten, d.chiNhanh, d.lop, d.loTrinh, `MT${d.mt}`, d.tuan, d.l, d.r, d.w, d.s, d.overall, d.target,
      d.kyVong, d.sos, d.trangThai];
    if (day) {
      hang.push(d.w1, d.w2, ...d.tieuChi.writing1, ...d.tieuChi.writing2, ...d.tieuChi.speaking,
        d.tuanKn.listening, d.tuanKn.reading, d.tuanKn.writing, d.tuanKn.speaking, d.nguoiNhap);
    }
    out.push(hang);
  }
  return out;
}

// ------------------------------------------------------------------ khung Lớp thường (T40, T58, MH3)

export type DongThuong = {
  ma: string; ten: string; chiNhanh: string; lop: string; bai: string; tuan: string; tuanBd: string;
  /** Mỗi môn của chương trình: tên đã qua `tenMon(ct, k)`; % = số như `68.5`. */
  mon: { ten: string; pct: number | null; diem: number | null; tong: number | null; tuan: string | null }[];
  tyLeTong: number | null; trangThai: string; nguoiNhap: string | null;
};

/** Một chương trình một sheet — môn khác nhau giữa chương trình nên tiêu đề lấy từ `mon` của dòng đầu (cả sheet cùng chương trình). */
export function bangThuong(dong: DongThuong[], cot: 'gon' | 'day-du'): Cell[][] {
  const day = cot === 'day-du';
  const mon = dong[0]?.mon ?? [];
  const tieuDe: Cell[] = ['Mã', 'Tên', 'Chi nhánh', 'Lớp', 'Bài', 'Tuần', ...mon.map((m) => `${m.ten} %`), '% tổng', 'Trạng thái lượt'];
  if (day) tieuDe.push(...mon.flatMap((m) => [`${m.ten} điểm`, `${m.ten} tổng`, `Tuần ${m.ten}`]), 'Người nhập');
  const out: Cell[][] = [tieuDe];
  for (const d of dong) {
    const hang: Cell[] = [d.ma, d.ten, d.chiNhanh, d.lop, d.bai, d.tuan, ...d.mon.map((m) => m.pct), d.tyLeTong, d.trangThai];
    if (day) hang.push(...d.mon.flatMap((m) => [m.diem, m.tong, m.tuan]), d.nguoiNhap);
    out.push(hang);
  }
  return out;
}

/** `ratio` (0–1, chưa làm tròn) → phần trăm một chữ số thập phân (68.5); thiếu → `null`. */
export const phanTram = (ratio: number | null) => (ratio === null ? null : Math.round(ratio * 1000) / 10);

/** Tên sheet lớp thường: `FOU · Giữa–Cuối khoá` — ≤ 31 ký tự, không `: \ / ? * [ ]`. */
export const tenSheetThuong = (ct: string) => `${ct.replace(/[:\\/?*[\]]/g, ' ').trim()} · Giữa–Cuối khoá`.slice(0, 31);

// ------------------------------------------------------------------ trạng thái lượt (T34)

export function trangThaiLuotXuat(o: {
  coDiem: number; yeuCau: number; du: boolean; lichSu: boolean; huyPhan: boolean; tamThoi: boolean; kck: boolean;
}): string {
  const chinh = o.du ? 'Đủ điểm' : o.coDiem === 0 ? 'Chưa có điểm' : `Thiếu điểm ${o.coDiem}/${o.yeuCau}`;
  return [chinh, o.lichSu && 'lịch sử', o.huyPhan && 'đã huỷ phần còn lại', o.tamThoi && !o.kck && 'SOS tạm thời', o.kck && 'không cam kết']
    .filter(Boolean).join(' · ');
}

// ------------------------------------------------------------------ sheet "Bộ lọc đã dùng"

/** ISO (UTC) → `dd/mm/yyyy hh:mm` giờ Việt Nam (UTC+7, không giờ mùa hè). */
export function gioVn(iso: string): string {
  const s = new Date(Date.parse(iso) + 7 * 3_600_000).toISOString();
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 16)}`;
}

export function bangBoLoc(o: { khung: KhungXuat; nguoiXuat: string; luc: string; moTa: [string, string][]; soLuot: number }): Cell[][] {
  const doc = o.khung === 'ft'
    ? ['SOS: 0 = đạt kỳ vọng, 1–3 = số kỹ năng dưới kỳ vọng; trống = chưa tính được hoặc học viên không cam kết.', 'Overall chỉ có khi đủ 4 kỹ năng.']
    : ['% = điểm đạt / tổng điểm của từng môn; % tổng chỉ có khi đủ điểm mọi môn.'];
  return [
    ['Mục', 'Giá trị'],
    ['Người xuất', o.nguoiXuat],
    ['Lúc', gioVn(o.luc)],
    ...o.moTa,
    ['Số lượt', o.soLuot],
    ['Cách đọc', 'Tuần của lượt = tuần sớm nhất trong các kỹ năng phải thi.'],
    ...doc.map((c): Cell[] => ['', c]),
    ['', 'Ô trống = chưa có điểm.'],
  ];
}

// ------------------------------------------------------------------ tên tệp + xem trước

/** Bỏ dấu, giữ hoa/thường (`chuanTieuDe` hạ chữ thường — tên chi nhánh `MB` phải còn `MB`). */
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const nhomTen = (ten: string[], danhTu: string) => (ten.length > 3 ? `${ten.length}-${danhTu}` : ten.map(slug).join('-'));

export function tenTepXuatMt(o: { khung: KhungXuat; chiNhanhTen: string[]; lopMa: string[]; thoiGian: ThoiGianXuat }): string {
  const pv = [o.chiNhanhTen.length && nhomTen(o.chiNhanhTen, 'chi-nhanh'), o.lopMa.length && nhomTen(o.lopMa, 'lop')].filter(Boolean).join('_') || 'tat-ca';
  const t = o.thoiGian;
  let kh: string;
  if (t.kieu === 'tuan') { const a = tuanLich(t.tu).replace(' ', ''), b = tuanLich(t.den).replace(' ', ''); kh = a === b ? a : `${a}-${b}`; }
  else if (t.kieu === 'thang') kh = t.tu === t.den ? t.tu : `${t.tu}-den-${t.den}`;
  else {
    const so = t.dot.map((k) => thuTuKhoa(k)).sort((x, y) => x - y);
    const lienTiep = so.length > 2 && so.every((n, i) => i === 0 || n === so[i - 1] + 1);
    const ten = t.dot.slice().sort((x, y) => thuTuKhoa(x) - thuTuKhoa(y)).map(nhanKhoaDot).map(slug);
    kh = lienTiep ? `${ten[0]}-${ten[ten.length - 1]}` : ten.join('-');
  }
  return `Pisa-Tracking_${o.khung === 'ft' ? 'MT' : 'Test-lop-thuong'}_${pv}_${kh}.xlsx`;
}
const thuTuKhoa = (k: string) => (k === 'giua' ? 1000 : k === 'cuoi' ? 1001 : Number(k.slice(3)));

const so1 = (n: number | null) => (n === null ? '—' : n.toFixed(1));
/** Một dòng xem trước — `PISA-000001 Nguyễn Minh An · MB FT 101 · MT3 · W3 SEP · L 6.0 · R 6.5 · W — · S — · SOS 2 tạm thời`. */
export function dongXemTruoc(d: DongFT, homNay?: string): string {
  const sos = d.target === 'KCK' ? 'KCK' : d.sos === null ? 'SOS —' : `SOS ${d.sos}${d.trangThai.includes('SOS tạm thời') ? ' tạm thời' : ''}`;
  return `${d.ma} ${d.ten} · ${d.lop} · MT${d.mt} · ${tuanLich(d.tuanBd, homNay)} · L ${so1(d.l)} · R ${so1(d.r)} · W ${so1(d.w)} · S ${so1(d.s)} · ${sos}`;
}
export function dongXemTruocThuong(d: DongThuong, homNay?: string): string {
  return `${d.ma} ${d.ten} · ${d.lop} · ${d.bai} · ${tuanLich(d.tuanBd, homNay)} · ${d.mon.map((m) => `${m.ten} ${m.pct === null ? '—' : `${m.pct}%`}`).join(' · ')}`;
}
