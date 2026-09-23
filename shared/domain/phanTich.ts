/**
 * LUẬT THUẦN CỦA PHÂN TÍCH (PR-Pb, đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.3).
 *
 * Cùng tinh thần `tongQuan.ts` (PR-Pa): không con số nào tính ở đây — số luôn đến từ lõi tập ID
 * ở máy chủ (`server/src/phanTich/{tongHop,vanDe}.ts`). File này chỉ giữ những gì máy chủ và web
 * PHẢI đồng ý với nhau: góc nhìn, khoảng thời gian, bộ kỹ năng theo chương trình, cột bảng Tổng
 * hợp, mức nhiệt, và cách xuất Excel từ đúng dữ liệu đang hiện trên bảng.
 */
import {
  CASE_CATEGORIES, CASE_CATEGORY_LABEL, CASE_CATEGORY_SHORT, FT_CASE_CATEGORIES, NORMAL_CASE_CATEGORIES,
  type CaseCategory,
} from './cases.ts';
import { mondayOfDate } from './week.ts';
import { type ChuongTrinh } from './tongQuan.ts';

// ------------------------------------------------------------------ góc nhìn (Q1, Q16)

export const GOC_NHIN = ['tong-hop', 'van-de', 'danh-sach', 'ket-qua', 'y-thuc'] as const;
export type GocNhin = (typeof GOC_NHIN)[number];
export const GOC_NHIN_LABEL: Record<GocNhin, string> = {
  'tong-hop': 'Tổng hợp Test + SOS',
  'van-de': 'Vấn đề học viên',
  'danh-sach': 'Danh sách Case',
  'ket-qua': 'Kết quả hỗ trợ',
  'y-thuc': 'Ý thức & Phối hợp',
};
export const GOC_NHIN_MAC_DINH: GocNhin = 'tong-hop';

/**
 * ĐƯỜNG DẪN CŨ VẪN PHẢI MỞ ĐÚNG MÀN (Q16). `boThamSo` là các tham số CŨ cần xoá khỏi URL —
 * `hang-doi` / `tinh-hinh` / `ky-nang` KHÔNG có mặt ở đây dù chúng đưa người dùng vào Danh sách
 * Case: đó là BỘ LỌC của chính màn đó, không phải tên góc nhìn cũ, nên phải giữ nguyên trên URL.
 * `ct` khác `null` nghĩa là `loai-lop` cũ cần đổi thành tham số chương trình mới.
 */
export type KetQuaGocNhinTuThamSo = { goc: GocNhin; ct: ChuongTrinh | null; boThamSo: string[] };

export function gocNhinTuThamSo(params: { get(key: string): string | null }): KetQuaGocNhinTuThamSo {
  const gocParam = params.get('goc');
  const coBoLocDanhSach = !!(params.get('hang-doi') || params.get('tinh-hinh') || params.get('ky-nang'));
  /*
   * `goc` TƯỜNG MINH LUÔN THẮNG (kể cả `tong-hop`, vốn không có tham số riêng — vắng `goc` mới
   * là lúc suy theo bộ lọc Danh sách Case). Thiếu nhánh này thì bấm "Tổng hợp" trong khi
   * `hang-doi`/`tinh-hinh`/`ky-nang` còn sót trên URL sẽ kẹt mãi ở Danh sách Case.
   */
  const goc: GocNhin =
    gocParam === 'y-thuc' ? 'y-thuc'
    : gocParam === 'van-de' ? 'van-de'
    : gocParam === 'ket-qua' ? 'ket-qua'
    : gocParam === 'tong-hop' ? 'tong-hop'
    : gocParam === 'danh-sach' || coBoLocDanhSach ? 'danh-sach'
    : GOC_NHIN_MAC_DINH;
  const boThamSo: string[] = [];
  if (params.get('xem') !== null) boThamSo.push('xem');
  const loaiLop = params.get('loai-lop');
  let ct: ChuongTrinh | null = null;
  if (loaiLop !== null) {
    ct = loaiLop === 'normal' ? 'thuong' : loaiLop === 'ft' ? 'ft' : null;
    boThamSo.push('loai-lop');
  }
  return { goc, ct, boThamSo };
}

/**
 * THAM SỐ CẦN XOÁ KHI BẤM SANG MỘT GÓC NHÌN KHÁC — `hang-doi`/`tinh-hinh`/`ky-nang` là bộ lọc RIÊNG của Danh sách
 * Case; rời màn đó mà không dọn thì lần bấm kế tiếp lại bị `gocNhinTuThamSo` suy nhầm về Danh sách Case.
 */
export function thamSoXoaKhiDoiGoc(goc: GocNhin): readonly string[] {
  return goc === 'danh-sach' ? [] : ['hang-doi', 'tinh-hinh', 'ky-nang'];
}

// ------------------------------------------------------------------ khoảng thời gian (Q5)

export const KHOANG = [4, 8, 12, 26] as const;
export type Khoang = (typeof KHOANG)[number];
export const KHOANG_LABEL: Record<Khoang, string> = { 4: '4 tuần', 8: '8 tuần', 12: '12 tuần', 26: '6 tháng' };
export const KHOANG_MAC_DINH: Khoang = 8;

export function khoangTuThamSo(s: string | null | undefined): Khoang {
  const n = Number(s);
  return (KHOANG as readonly number[]).includes(n) ? (n as Khoang) : KHOANG_MAC_DINH;
}

function addDaysIso(date: string, n: number): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * MỘT MỐC "TỪ NGÀY" CHO MỌI GÓC NHÌN CÓ KHOẢNG THỜI GIAN (Tổng hợp, Kết quả hỗ trợ, Ý thức) —
 * máy chủ và web cùng gọi hàm này nên không có chuyện hai nơi tính lệch một tuần.
 * Ví dụ: `homNay` một thứ Tư bất kỳ trong tuần W3 SEP 2026 (thứ Hai 21/09), khoảng 8 tuần thì
 * lùi 7 tuần từ chính thứ Hai đó → thứ Hai W... đầu tháng 8.
 */
export function tuDauKhoang(homNay: string, soTuan: number): string {
  return addDaysIso(mondayOfDate(homNay), -7 * (soTuan - 1));
}

// ------------------------------------------------------------------ kỹ năng theo chương trình (Q7)

/** Fast Track L·R·W1·W2·S; lớp thường L·R·W·S; Cả hai là HỢP hai bộ (không gộp W1/W2 vào W — Q7). */
export function kyNangTheoCt(ct: ChuongTrinh): readonly CaseCategory[] {
  if (ct === 'ft') return FT_CASE_CATEGORIES;
  if (ct === 'thuong') return NORMAL_CASE_CATEGORIES;
  return CASE_CATEGORIES;
}

/** Tooltip đầy đủ của một kỹ năng — ở "Cả hai", W cần nói rõ là Writing của lớp thường (Q7) để không lẫn với W1/W2. */
export function kyNangTooltip(cat: CaseCategory, ct: ChuongTrinh): string {
  if (cat === 'writing' && ct === 'ca-hai') return 'Writing (lớp thường)';
  return CASE_CATEGORY_LABEL[cat];
}

// ------------------------------------------------------------------ cách xếp dòng (Q9)

export const THEO_DONG = ['tuan', 'lop', 'dot', 'cn'] as const;
export type TheoDong = (typeof THEO_DONG)[number];
export const THEO_DONG_LABEL: Record<TheoDong, string> = {
  tuan: 'Theo tuần', lop: 'Theo lớp', dot: 'Theo đợt', cn: 'Theo chi nhánh',
};
/** Nhãn cột đầu bảng ("Tuần", "Lớp"…) theo trục đang xếp. */
export const THEO_DONG_COT_DAU: Record<TheoDong, string> = {
  tuan: 'Tuần', lop: 'Lớp', dot: 'Đợt', cn: 'Chi nhánh',
};
/** Danh từ đếm dùng cho nhãn dòng Tổng — "Cộng {n} tuần", "Cộng {n} lớp"… */
export const THEO_DONG_DANH_TU: Record<TheoDong, string> = {
  tuan: 'tuần', lop: 'lớp', dot: 'đợt', cn: 'chi nhánh',
};

/** Đợt của một lượt — FT theo số lần thi (MT1…MT5), lớp thường theo mốc Giữa khoá / Cuối khoá. */
export function nhanDot(kind: string, attemptNo: number | null): string {
  if (kind === 'progress') return 'Giữa khoá';
  if (kind === 'final') return 'Cuối khoá';
  return `MT${attemptNo ?? '?'}`;
}
/** Khoá ổn định của một đợt — dùng để gom dòng con và để sắp thứ tự (`thuTuDot`). */
export function khoaDot(kind: string, attemptNo: number | null): string {
  if (kind === 'progress') return 'giua';
  if (kind === 'final') return 'cuoi';
  return `mt:${attemptNo ?? 0}`;
}
const THU_TU_DOT: Record<string, number> = { 'mt:1': 1, 'mt:2': 2, 'mt:3': 3, 'mt:4': 4, 'mt:5': 5, giua: 6, cuoi: 7 };
export function thuTuDot(khoa: string): number { return THU_TU_DOT[khoa] ?? 99; }

// ------------------------------------------------------------------ cột bảng Tổng hợp (P10, Q14, Q17, Q18)

export type NhomCot = 'ket-qua' | 'ky-nang' | 'xu-ly';
export const NHOM_COT: readonly NhomCot[] = ['ket-qua', 'ky-nang', 'xu-ly'];
const NHAN_NHOM_KY_NANG: Record<ChuongTrinh, string> = {
  ft: 'Dưới kỳ vọng theo kỹ năng (đếm HV)',
  thuong: 'Chưa đạt theo môn (đếm HV)',
  'ca-hai': 'Dưới kỳ vọng · chưa đạt (đếm HV)',
};
export function nhomCotLabel(nhom: NhomCot, ct: ChuongTrinh): string {
  if (nhom === 'ket-qua') return 'Kết quả Test (đếm lượt)';
  if (nhom === 'xu-ly') return 'Xử lý (tình trạng hiện tại)';
  return NHAN_NHOM_KY_NANG[ct];
}

/** Động từ của nhóm "dưới kỳ vọng"/"chưa đạt" theo chương trình — dùng cho tooltip cột kỹ năng và các nhãn ngắn. */
const DONG_TU_KY_NANG: Record<ChuongTrinh, string> = {
  ft: 'dưới kỳ vọng', thuong: 'chưa đạt', 'ca-hai': 'dưới kỳ vọng / chưa đạt',
};
/** Nhãn NGẮN của nhóm cột (đầu đề bảng, menu "Cột hiện") — cùng luật ct với `nhomCotLabel`, chỉ ngắn hơn. */
export function nhomCotNhanNgan(nhom: NhomCot, ct: ChuongTrinh): string {
  if (nhom === 'ket-qua') return 'Kết quả';
  if (nhom === 'xu-ly') return 'Xử lý';
  return ct === 'ft' ? 'Dưới kỳ vọng' : ct === 'thuong' ? 'Chưa đạt' : 'Dưới kỳ vọng / chưa đạt';
}

export type CotTongHop = {
  khoa: string; nhom: NhomCot; donVi: 'dot-test' | 'hoc-vien' | 'case';
  nhan: (ct: ChuongTrinh) => string;
  goiY: string;
};

/** Cột lượt — nhãn đổi theo chương trình (Q18); đứng đầu bảng, cùng nhóm "Kết quả" (sáu cột sau cộng lại đúng bằng nó). */
const COT_LUOT: CotTongHop = {
  khoa: 'luot', nhom: 'ket-qua', donVi: 'dot-test',
  nhan: (ct) => (ct === 'ft' ? 'Lượt MT' : ct === 'thuong' ? 'Bài kiểm tra' : 'Lượt'),
  goiY: 'Số lượt đã chấm ít nhất một kỹ năng trong khoảng đang xem. Sáu cột Kết quả cộng lại đúng bằng cột này.',
};
const COT_KET_QUA: CotTongHop[] = [
  { khoa: 'dat', nhom: 'ket-qua', donVi: 'dot-test', nhan: () => 'Đạt', goiY: 'Đủ điểm mọi kỹ năng, không kỹ năng nào dưới kỳ vọng.' },
  { khoa: 'sos1', nhom: 'ket-qua', donVi: 'dot-test', nhan: () => 'SOS 1', goiY: 'Đủ điểm, đúng một kỹ năng dưới kỳ vọng.' },
  { khoa: 'sos2', nhom: 'ket-qua', donVi: 'dot-test', nhan: () => 'SOS 2', goiY: 'Đủ điểm, hai kỹ năng dưới kỳ vọng.' },
  { khoa: 'sos3', nhom: 'ket-qua', donVi: 'dot-test', nhan: () => 'SOS 3', goiY: 'Đủ điểm, từ ba kỹ năng dưới kỳ vọng.' },
  { khoa: 'tamThoi', nhom: 'ket-qua', donVi: 'dot-test', nhan: () => 'Tạm thời',
    goiY: 'Chưa đủ điểm nhưng phần đã chấm đã kết luận được — mức còn có thể tăng khi vào thêm điểm.' },
  { khoa: 'chuaDu', nhom: 'ket-qua', donVi: 'dot-test', nhan: () => 'Chưa đủ điểm',
    goiY: 'Chưa đủ điểm và phần đã chấm chưa kết luận được gì.' },
];
const COT_XU_LY: CotTongHop[] = [
  { khoa: 'hvCoCase', nhom: 'xu-ly', donVi: 'hoc-vien', nhan: () => 'HV có Case',
    goiY: 'Học viên có ít nhất một Case sinh từ các lượt trong dòng — một em nhiều Case vẫn tính một lần.' },
  { khoa: 'case', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Case', goiY: 'Case sinh từ các lượt trong dòng — là tình trạng HÔM NAY của case, không phải lúc lượt được chấm.' },
  { khoa: 'dangXuLy', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Đang xử lý', goiY: 'Case đã có việc hỗ trợ thực sự diễn ra — tình trạng hôm nay.' },
  { khoa: 'thieuPa', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Thiếu PA học thuật', goiY: 'Case chưa ai ghi sẽ làm gì — tình trạng hôm nay.' },
];

/** Cột kỹ năng "dưới kỳ vọng", sinh từ `kyNangTheoCt` — khoá kỹ thuật `kn:<hạng mục>`, không lộ ra màn (chỉ dùng nội bộ). */
export function cotKyNangFor(ct: ChuongTrinh): CotTongHop[] {
  return kyNangTheoCt(ct).map((cat) => ({
    khoa: `kn:${cat}`, nhom: 'ky-nang' as const, donVi: 'hoc-vien' as const,
    nhan: () => CASE_CATEGORY_SHORT[cat],
    goiY: `${kyNangTooltip(cat, ct)} ${DONG_TU_KY_NANG[ct]} — đếm học viên, không đếm lượt.`,
  }));
}

/** Toàn bộ cột của bảng Tổng hợp, đúng thứ tự hiển thị: Lượt + Kết quả · Dưới kỳ vọng theo kỹ năng · Xử lý. */
export function cotTongHopFor(ct: ChuongTrinh): CotTongHop[] {
  return [COT_LUOT, ...COT_KET_QUA, ...cotKyNangFor(ct), ...COT_XU_LY];
}

// ------------------------------------------------------------------ mức nhiệt (Q12)

/** 0 = không có gì (n=0 hoặc N=0); 1 < 10% ; 2 < 25% ; 3 < 40% ; 4 ≥ 40%. Chỉ để liếc màu, số vẫn in rõ. */
export function mucNhiet(n: number, N: number): 0 | 1 | 2 | 3 | 4 {
  if (N <= 0 || n <= 0) return 0;
  const ty = n / N;
  if (ty < 0.10) return 1;
  if (ty < 0.25) return 2;
  if (ty < 0.40) return 3;
  return 4;
}

// ------------------------------------------------------------------ kiểu trả về dùng chung máy chủ ↔ web

export type DongTongHop = {
  khoa: string; nhan: string;
  /** Một dòng phụ ≤ 60 ký tự (G-3) — ví dụ khoảng ngày của tuần, hoặc tên chi nhánh khi xem nhiều chi nhánh. */
  phu?: string;
  o: Record<string, number>;
  con?: DongTongHop[];
};
export type TongHopKetQua = {
  theo: TheoDong; ct: ChuongTrinh; cot: string[];
  hang: DongTongHop[];
  /** Dòng Tổng = HỢP các tập (đếm duy nhất), không phải cộng các dòng — nhất là các cột học viên. */
  tong: Record<string, number>;
  scopeEmpty: boolean;
};

/** Một ô của ma trận Vấn đề: n = HV có Case chưa xong hạng mục đó, N = HV đang học có kỹ năng đó ở cột này. `null` = không áp dụng. */
export type ONhietVanDe = { n: number; N: number } | null;
export type DongLoiVanDe = { ma: string; nhan: string; o: Record<string, number | null>; tong: number };
export type HangKyNangVanDe = {
  kn: string; nhan: string;
  o: Record<string, ONhietVanDe>;
  tong: { n: number; N: number };
  loiNhieuNhat: { code: string; nhan: string; n: number } | null;
  con: DongLoiVanDe[];
};
export type MaTranVanDe = {
  cot: 'lop' | 'cn';
  cotDs: { khoa: string; nhan: string }[];
  hang: HangKyNangVanDe[];
  scopeEmpty: boolean;
};

// ------------------------------------------------------------------ xuất Excel (Q13)

/**
 * MẢNG HAI CHIỀU CHO EXCEL — `XLSX.utils.aoa_to_sheet` nhận thẳng kết quả này. Chỉ xuất đúng các
 * cột đang hiện trên bảng (`cotHien` là các nhóm đang bật, Q14); dòng con thụt hai dấu cách; dòng
 * Tổng ở cuối. Không lộ khoá kỹ thuật `kn:` — mọi tiêu đề cột đọc qua `nhan(ct)`, không qua `khoa`.
 */
export function bangXuatTongHop(
  kq: TongHopKetQua, cotHien: ReadonlySet<NhomCot>, moTaBoLoc: string,
): (string | number)[][] {
  const cols = cotTongHopFor(kq.ct).filter((c) => cotHien.has(c.nhom));
  const out: (string | number)[][] = [];
  out.push([`Tổng hợp Test + SOS · ${moTaBoLoc}`]);
  out.push([]);
  out.push(['', ...cols.map((c) => nhomCotLabel(c.nhom, kq.ct))]);
  out.push([THEO_DONG_COT_DAU[kq.theo], ...cols.map((c) => c.nhan(kq.ct))]);
  const dong = (r: DongTongHop, thut: boolean) =>
    [`${thut ? '  ' : ''}${r.nhan}${r.phu ? ` · ${r.phu}` : ''}`, ...cols.map((c) => r.o[c.khoa] ?? 0)];
  for (const r of kq.hang) {
    out.push(dong(r, false));
    for (const con of r.con ?? []) out.push(dong(con, true));
  }
  out.push([`Cộng ${kq.hang.length} ${THEO_DONG_DANH_TU[kq.theo]}`, ...cols.map((c) => kq.tong[c.khoa] ?? 0)]);
  return out;
}
