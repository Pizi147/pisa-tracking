/**
 * LUẬT THUẦN CỦA PHÂN TÍCH (PR-Pb, đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.3).
 *
 * Cùng tinh thần `tongQuan.ts` (PR-Pa): không con số nào tính ở đây — số luôn đến từ lõi tập ID
 * ở máy chủ (`server/src/phanTich/*.ts`). File này chỉ giữ những gì máy chủ và web PHẢI đồng ý với
 * nhau: góc nhìn, khoảng thời gian, bộ kỹ năng theo chương trình, cột bảng Tổng hợp, màu ô kết quả,
 * loại lỗi chung, "Nên dùng", bước tiếp theo của Ý thức, và cách xuất Excel từ đúng dữ liệu đang hiện.
 */
import {
  CASE_CATEGORY_LABEL, CASE_CATEGORY_SHORT, FT_CASE_CATEGORIES, NORMAL_CASE_CATEGORIES,
  type CaseCategory,
} from './cases.ts';
import { mondayOfDate } from './week.ts';
import { type ChuongTrinh } from './tongQuan.ts';
import type { TrangThaiCaseV4 } from './sosV4.ts';

// ------------------------------------------------------------------ góc nhìn (Q1, Q16)

/* PR-Pb2-a (T59, K1-27): góc nhìn Danh sách Case đã bỏ — đường dẫn cũ chuyển hướng ở `duongMoi` (dieuHuong.ts). PR-Pb2-b: 'giao-vien' cuối. */
export const GOC_NHIN = ['tong-hop', 'van-de', 'hieu-qua-pa', 'y-thuc', 'giao-vien'] as const;
export type GocNhin = (typeof GOC_NHIN)[number];
export const GOC_NHIN_LABEL: Record<GocNhin, string> = {
  'tong-hop': 'Tổng hợp Test + SOS',
  'van-de': 'Tổng hợp vấn đề HV',
  'hieu-qua-pa': 'Hiệu quả PA',
  'y-thuc': 'Ý thức',   // PR-YT4 (K1-25): Phối hợp SOS ở Việc của GVCN, không ở góc nhìn này
  'giao-vien': 'Giáo viên',
};
export const GOC_NHIN_MAC_DINH: GocNhin = 'tong-hop';
/** PR-S6F-b (D8): lớp thường không có SOS — tab, tiêu đề Excel của Tổng hợp khung Lớp thường là "Tổng hợp Test". */
export const nhanGocNhin = (goc: GocNhin, ct: ChuongTrinh | null): string =>
  goc === 'tong-hop' && ct === 'thuong' ? 'Tổng hợp Test' : GOC_NHIN_LABEL[goc];

/**
 * ĐƯỜNG DẪN CŨ VẪN PHẢI MỞ ĐÚNG MÀN (Q16). `boThamSo` là các tham số CŨ cần xoá khỏi URL.
 * `ct` khác `null` nghĩa là `loai-lop` cũ cần đổi thành tham số chương trình mới.
 * `gocMoi` khác `null` nghĩa là `goc` trên URL là TÊN CŨ (`ket-qua`, `chua-ai-nhan`) — web thay bằng tên mới (replace).
 * Bộ lọc cũ của Danh sách Case (`hang-doi`/`tinh-hinh`/`ky-nang`) không tới được đây: `duongMoi` đã chuyển hướng trước.
 */
export type KetQuaGocNhinTuThamSo = { goc: GocNhin; ct: ChuongTrinh | null; boThamSo: string[]; gocMoi: GocNhin | null };

export function gocNhinTuThamSo(params: { get(key: string): string | null }): KetQuaGocNhinTuThamSo {
  const gocParam = params.get('goc');
  let gocMoi: GocNhin | null = null;
  let goc: GocNhin;
  if (gocParam === 'ket-qua') { goc = 'hieu-qua-pa'; gocMoi = goc; }
  else if (gocParam === 'chua-ai-nhan') { goc = 'van-de'; gocMoi = goc; }
  else if ((GOC_NHIN as readonly string[]).includes(gocParam ?? '')) goc = gocParam as GocNhin;
  else goc = GOC_NHIN_MAC_DINH;
  const boThamSo: string[] = [];
  if (params.get('xem') !== null) boThamSo.push('xem');
  const loaiLop = params.get('loai-lop');
  let ct: ChuongTrinh | null = null;
  if (loaiLop !== null) {
    ct = loaiLop === 'normal' ? 'thuong' : loaiLop === 'ft' ? 'ft' : null;
    boThamSo.push('loai-lop');
  }
  return { goc, ct, boThamSo, gocMoi };
}

/**
 * THAM SỐ CẦN XOÁ KHI BẤM SANG MỘT GÓC NHÌN — ba bộ lọc cũ của Danh sách Case (đã bỏ) luôn dọn; `gv`/`tu`/`den` là bộ lọc RIÊNG
 * của Hiệu quả PA (PR-Pb2-a) — rời góc nhìn đó thì dọn, để quay lại không bị lọc ngầm. PR-S6F-b: `tu`/`den`/`thang` của góc
 * Giáo viên cũng vậy — rời `tuGoc = 'giao-vien'` (kể cả sang Hiệu quả PA) thì dọn.
 */
export function thamSoXoaKhiDoiGoc(goc: GocNhin, tuGoc?: GocNhin): readonly string[] {
  const x = goc === 'hieu-qua-pa' ? ['hang-doi', 'tinh-hinh', 'ky-nang'] : ['hang-doi', 'tinh-hinh', 'ky-nang', 'gv', 'tu', 'den'];
  return tuGoc === 'giao-vien' && goc !== 'giao-vien' ? [...new Set([...x, 'tu', 'den', 'thang'])] : x;
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

/** Fast Track L·R·W1·W2·S; lớp thường L·R·W·S (PR-Pb2-a: khung gộp đã bỏ). */
export function kyNangTheoCt(ct: ChuongTrinh): readonly CaseCategory[] {
  return ct === 'ft' ? FT_CASE_CATEGORIES : NORMAL_CASE_CATEGORIES;
}

/** Tooltip đầy đủ của một kỹ năng. */
export function kyNangTooltip(cat: CaseCategory, _ct: ChuongTrinh): string {
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
/** K1-21: `mt:n` → n (tới MT8 và hơn); Giữa/Cuối khoá đứng sau mọi MT; khoá lạ xếp cuối. */
export function thuTuDot(khoa: string): number {
  const n = khoa.startsWith('mt:') ? Number(khoa.slice(3)) : NaN;
  return khoa === 'giua' ? 1000 : khoa === 'cuoi' ? 1001 : Number.isInteger(n) && n > 0 ? n : 9999;
}

// ------------------------------------------------------------------ cột bảng Tổng hợp (P10, Q14, Q17, Q18)

export type NhomCot = 'ket-qua' | 'ky-nang' | 'xu-ly';
export const NHOM_COT: readonly NhomCot[] = ['ket-qua', 'ky-nang', 'xu-ly'];
const NHAN_NHOM_KY_NANG: Record<ChuongTrinh, string> = {
  ft: 'Dưới kỳ vọng theo kỹ năng (đếm HV)',
  thuong: 'Chưa đạt theo môn (đếm HV)',
};
export function nhomCotLabel(nhom: NhomCot, ct: ChuongTrinh): string {
  if (nhom === 'ket-qua') return 'Kết quả Test (đếm lượt)';
  if (nhom === 'xu-ly') return 'Xử lý (tình trạng hiện tại)';
  return NHAN_NHOM_KY_NANG[ct];
}

/** Động từ của nhóm "dưới kỳ vọng"/"chưa đạt" theo chương trình — dùng cho tooltip cột kỹ năng và các nhãn ngắn. */
const DONG_TU_KY_NANG: Record<ChuongTrinh, string> = {
  ft: 'dưới kỳ vọng', thuong: 'chưa đạt',
};
/** Nhãn NGẮN của nhóm cột (đầu đề bảng, menu "Cột hiện") — cùng luật ct với `nhomCotLabel`, chỉ ngắn hơn. */
export function nhomCotNhanNgan(nhom: NhomCot, ct: ChuongTrinh): string {
  if (nhom === 'ket-qua') return 'Kết quả';
  if (nhom === 'xu-ly') return 'Xử lý';
  return ct === 'ft' ? 'Dưới kỳ vọng' : 'Chưa đạt';
}

export type CotTongHop = {
  khoa: string; nhom: NhomCot; donVi: 'dot-test' | 'hoc-vien' | 'case';
  nhan: (ct: ChuongTrinh) => string;
  goiY: string;
  /** PR-Pb2-a (P4, K1-19): tầng đầu đề con của lớp thường — Giữa khoá (theo môn) · Cuối khoá (% tổng) · Mini Test. */
  nhomCon?: NhomCon;
};
export type NhomCon = 'giua' | 'cuoi' | 'mini';
export const NHAN_NHOM_CON: Record<NhomCon, string> = { giua: 'Giữa khoá (theo môn)', cuoi: 'Cuối khoá (% tổng)', mini: 'Mini Test' };

/** Cột lượt — nhãn đổi theo chương trình (Q18); đứng đầu bảng, cùng nhóm "Kết quả" (sáu cột sau cộng lại đúng bằng nó). */
const COT_LUOT: CotTongHop = {
  khoa: 'luot', nhom: 'ket-qua', donVi: 'dot-test',
  nhan: (ct) => (ct === 'ft' ? 'Lượt MT' : 'Bài kiểm tra'),
  goiY: 'Số lượt đã chấm ít nhất một kỹ năng trong khoảng đang xem. Sáu cột Kết quả cộng lại đúng bằng cột này. Không tính học viên KCK (không cam kết đầu ra).',
};
const COT_LUOT_THUONG: CotTongHop = {
  ...COT_LUOT,
  goiY: 'Số bài đã chấm ít nhất một môn trong khoảng đang xem. Ba cột Giữa khoá, bốn cột Cuối khoá và Chưa đủ điểm cộng lại đúng bằng cột này. Không tính học viên KCK.',
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
/**
 * PR-Pb2-a (P4, K1-19, Q12): khung lớp thường KHÔNG có chữ SOS. Giữa khoá đếm MÔN trượt; Cuối khoá theo 4 dải % tổng (`daiCuoiKhoa`);
 * Chưa đủ điểm; Σ ba nhóm đó = cột Bài. Mini Test đếm HỌC VIÊN, gắn dòng của bài Cuối khoá sinh ra nó (`tu_attempt_id`) — không cộng vào Bài.
 */
const COT_KET_QUA_THUONG: CotTongHop[] = [
  { khoa: 'gk-dat', nhom: 'ket-qua', nhomCon: 'giua', donVi: 'dot-test', nhan: () => 'Đạt hết', goiY: 'Bài Giữa khoá đủ điểm, mọi môn từ 70%.' },
  { khoa: 'gk-1', nhom: 'ket-qua', nhomCon: 'giua', donVi: 'dot-test', nhan: () => '1 môn trượt', goiY: 'Bài Giữa khoá đủ điểm, đúng một môn dưới 70%.' },
  { khoa: 'gk-2', nhom: 'ket-qua', nhomCon: 'giua', donVi: 'dot-test', nhan: () => '≥ 2 môn trượt', goiY: 'Bài Giữa khoá đủ điểm, từ hai môn dưới 70%.' },
  { khoa: 'ck-duoi50', nhom: 'ket-qua', nhomCon: 'cuoi', donVi: 'dot-test', nhan: () => 'Dưới 50%', goiY: 'Bài Cuối khoá đủ điểm, % tổng dưới 50% — gợi ý học lại.' },
  { khoa: 'ck-50', nhom: 'ket-qua', nhomCon: 'cuoi', donVi: 'dot-test', nhan: () => '50–59%', goiY: 'Bài Cuối khoá đủ điểm, % tổng 50–59% — Quản lý cân nhắc.' },
  { khoa: 'ck-60', nhom: 'ket-qua', nhomCon: 'cuoi', donVi: 'dot-test', nhan: () => '60–69%', goiY: 'Bài Cuối khoá đủ điểm, % tổng 60–69% — lên lớp kèm bổ trợ.' },
  { khoa: 'ck-dat', nhom: 'ket-qua', nhomCon: 'cuoi', donVi: 'dot-test', nhan: () => 'Từ 70%', goiY: 'Bài Cuối khoá đủ điểm, % tổng từ 70% — Pass.' },
  { khoa: 'chuaDu', nhom: 'ket-qua', donVi: 'dot-test', nhan: () => 'Chưa đủ điểm', goiY: 'Bài chưa nhập đủ điểm các môn — chưa xếp vào cột Giữa khoá hay Cuối khoá.' },
  { khoa: 'mini-dat', nhom: 'ket-qua', nhomCon: 'mini', donVi: 'hoc-vien', nhan: () => 'Đạt', goiY: 'Học viên làm Mini Test sau bổ trợ (từ bài Cuối khoá của dòng này) đạt từ 70% — đếm học viên.' },
  { khoa: 'mini-truot', nhom: 'ket-qua', nhomCon: 'mini', donVi: 'hoc-vien', nhan: () => 'Trượt', goiY: 'Học viên làm Mini Test sau bổ trợ dưới 70% — đếm học viên.' },
];
/** Cột Kết quả cộng lại đúng bằng cột Bài/Lượt (theo khung) — Mini Test đếm học viên nên đứng ngoài. */
export function cotKetQuaCong(ct: ChuongTrinh): string[] {
  return (ct === 'thuong' ? COT_KET_QUA_THUONG : COT_KET_QUA).filter((c) => c.nhomCon !== 'mini').map((c) => c.khoa);
}
/** Ô không áp dụng (dòng không có bài loại đó) → web và Excel ghi "—" thay vì 0. */
export function oKhongApDung(c: CotTongHop, coDot: { giua: boolean; cuoi: boolean } | undefined): boolean {
  if (!coDot || !c.nhomCon) return false;
  return c.nhomCon === 'giua' ? !coDot.giua : !coDot.cuoi;
}
const COT_XU_LY: CotTongHop[] = [
  { khoa: 'hvCoCase', nhom: 'xu-ly', donVi: 'hoc-vien', nhan: () => 'HV có Case',
    goiY: 'Học viên có ít nhất một Case sinh từ các lượt trong dòng — một em nhiều Case vẫn tính một lần.' },
  { khoa: 'case', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Case', goiY: 'Case sinh từ các lượt trong dòng — là tình trạng HÔM NAY của case, không phải lúc lượt được chấm.' },
  /* PR-SOS (K1-20): bốn cột theo MỘT nhãn trạng thái Case (`trangThaiCaseV4`) — tình trạng hôm nay. */
  { khoa: 'choNguyenNhan', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Chờ nguyên nhân',
    goiY: 'Case chưa xác nhận nguyên nhân — trong ngoặc là số đã quá hạn 3 ngày.' },
  { khoa: 'choDuyet', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Chờ Quản lý duyệt', goiY: 'Case đã gửi "Không cần theo dõi" hoặc kế hoạch bổ trợ, chờ Quản lý duyệt.' },
  { khoa: 'dangLam', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Đang làm', goiY: 'Case đã có nguyên nhân (kể cả PA theo quy chế còn chờ xác nhận) hoặc Case giáo viên báo, chưa xong.' },
  { khoa: 'xongHuy', nhom: 'xu-ly', donVi: 'case', nhan: () => 'Xong/Huỷ', goiY: 'Case đã hoàn thành, huỷ vì không cần theo dõi, hoặc hệ thống đóng.' },
];
/** Trạng thái Case v4 → cột nhóm Xử lý của bảng Tổng hợp. `choNguyenNhanQuaHan` là số phụ trong ngoặc của cột Chờ nguyên nhân. */
export const COT_XU_LY_V4: Record<TrangThaiCaseV4, string> = {
  'cho-nguyen-nhan': 'choNguyenNhan', 'cho-duyet-khong-theo-doi': 'choDuyet', 'cho-xac-nhan-pa': 'dangLam', 'dang-lam': 'dangLam',
  xong: 'xongHuy', 'huy-khong-theo-doi': 'xongHuy', 'he-thong-dong': 'xongHuy', 'rut-sua-diem': 'xongHuy',
  'cho-ke-hoach': 'dangLam', 'cho-duyet-ke-hoach': 'choDuyet',   // PR-LT2a: đã có nguyên nhân; kế hoạch bổ trợ chờ Quản lý duyệt
};

/**
 * Cột kỹ năng "dưới kỳ vọng", sinh từ `kyNangTheoCt` — khoá kỹ thuật `kn:<hạng mục>`, không lộ ra màn (chỉ dùng nội bộ).
 * MH3/MH5 (PR-MON): CHỈ khung Fast Track có cột môn — Lớp thường không lọc/cột theo môn.
 */
export function cotKyNangFor(ct: ChuongTrinh): CotTongHop[] {
  if (ct !== 'ft') return [];
  return kyNangTheoCt(ct).map((cat) => ({
    khoa: `kn:${cat}`, nhom: 'ky-nang' as const, donVi: 'hoc-vien' as const,
    nhan: () => CASE_CATEGORY_SHORT[cat],
    /* PR-UXF-a Q14: đếm cả lượt Tạm thời — khớp Case SOS sinh từ điểm một phần. */
    goiY: `${kyNangTooltip(cat, ct)} ${DONG_TU_KY_NANG[ct]} — đếm học viên, không đếm lượt. Kể cả lượt Tạm thời (chưa đủ điểm).`,
  }));
}

/** Toàn bộ cột của bảng Tổng hợp, đúng thứ tự hiển thị: Lượt + Kết quả · Dưới kỳ vọng theo kỹ năng · Xử lý. */
export function cotTongHopFor(ct: ChuongTrinh): CotTongHop[] {
  return ct === 'thuong'
    ? [COT_LUOT_THUONG, ...COT_KET_QUA_THUONG, ...COT_XU_LY]
    : [COT_LUOT, ...COT_KET_QUA, ...cotKyNangFor(ct), ...COT_XU_LY];
}

// ------------------------------------------------------------------ màu ô kết quả (N-1b, Q23)

export type MauOKetQua = 'dat' | 'sos1' | 'sos2' | 'sos3' | 'tam' | 'xam';

/**
 * Màu MỘT Ô của bảng Tổng hợp. Cột Đạt / SOS 1 / SOS 2 / SOS 3 mang màu riêng khi có số (ô 0 xám);
 * Tạm thời / Chưa đủ điểm chỉ xám đậm (`tam`) khi có số; cột khác (Lượt, kỹ năng, xử lý) không tô — `null`.
 */
/** PR-Pb2-a: cột lớp thường mượn thang màu (không chữ SOS): đạt xanh · 1 môn / 60–69 vàng · 50–59 cam · ≥ 2 môn / dưới 50 / Mini Test trượt đỏ. */
const MAU_THUONG: Record<string, MauOKetQua> = {
  'gk-dat': 'dat', 'ck-dat': 'dat', 'mini-dat': 'dat', 'gk-1': 'sos1', 'ck-60': 'sos1', 'ck-50': 'sos2', 'gk-2': 'sos3', 'ck-duoi50': 'sos3', 'mini-truot': 'sos3',
};
export function mauOKetQua(khoaCot: string, v: number): MauOKetQua | null {
  if (khoaCot in MAU_THUONG) return v > 0 ? MAU_THUONG[khoaCot] : 'xam';
  if (khoaCot === 'dat' || khoaCot === 'sos1' || khoaCot === 'sos2' || khoaCot === 'sos3') return v > 0 ? khoaCot : 'xam';
  if (khoaCot === 'tamThoi' || khoaCot === 'chuaDu') return v > 0 ? 'tam' : 'xam';
  return null;
}

// ------------------------------------------------------------------ vấn đề HV: loại lỗi chung, họ kỹ năng (Q3, Q5)

/**
 * LOẠI LỖI CHUNG (Q3) — công tắc "Gộp theo loại lỗi chung". Một mã có thể nằm ở nhiều nhóm: Reading/Listening chỉ có
 * mục `language` (Từ vựng / ngữ pháp) nên mục đó tính ở cả Ngữ pháp lẫn Từ vựng.
 */
export const LOI_CHUNG: readonly { khoa: string; nhan: string; ma: readonly string[] }[] = [
  { khoa: 'ngu-phap', nhan: 'Ngữ pháp',
    ma: ['student.writing.grammar', 'student.speaking.grammar', 'student.reading.language', 'student.listening.language',
      'student.gv.grammar', 'student.tong_hop.language'] },
  { khoa: 'tu-vung', nhan: 'Từ vựng',
    ma: ['student.writing.lexical', 'student.speaking.lexical', 'student.reading.language', 'student.listening.language',
      'student.gv.vocabulary', 'student.tong_hop.language'] },
  { khoa: 'to-chuc', nhan: 'Tổ chức ý / mạch lạc', ma: ['student.writing.organisation', 'student.speaking.fluency'] },
  { khoa: 'ky-nang-lam-bai', nhan: 'Kỹ năng làm bài', ma: ['student.reading.technique', 'student.listening.technique'] },
  /* K1-22: Phát âm gom Speaking cũ và nhánh P của FOU. */
  { khoa: 'phat-am', nhan: 'Phát âm',
    ma: ['student.speaking.pronunciation', 'student.phat_am.sound', 'student.phat_am.stress', 'student.phat_am.intonation'] },
];

export type HoKyNang = 'listening' | 'reading' | 'writing' | 'speaking';
export const NHAN_HO_KY_NANG: Record<HoKyNang, string> = {
  listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
};

/** Họ kỹ năng của một hạng mục Case (W1/W2/Writing → writing); mã lạ → null. Dùng cho Q5 (Vấn đề HV) lẫn Q18 (Bỏ quên). */
export function hoKyNang(k: string | null | undefined): HoKyNang | null {
  if (!k) return null;
  if (k === 'writing1' || k === 'writing2' || k === 'writing' || k === 'prep_writing' || k === 'gv') return 'writing';
  if (k === 'pronunciation' || k === 'phat_am') return 'speaking';   // nhánh nguyên nhân FOU (T57) nằm ở ô W/S
  // `tong_hop` (Pre FOU) → null: không thuộc họ kỹ năng nào.
  return k === 'listening' || k === 'reading' || k === 'speaking' ? k : null;
}

// ------------------------------------------------------------------ hai việc "bỏ quên" (Q17–Q19)

/** Loại "bỏ quên" cũ — PR-VAI-a (Q7) đã gỡ chỉ số U3 + boQuen.ts; chỉ còn để `duongMoi` chuyển đường dẫn cũ `hang-doi=…` về Tổng quan. */
export const LOAI_BO_QUEN = ['can-ho-tro-2-lan'] as const;
export type LoaiBoQuen = (typeof LOAI_BO_QUEN)[number];
export const laLoaiBoQuen = (s: string | null | undefined): s is LoaiBoQuen => (LOAI_BO_QUEN as readonly string[]).includes(s ?? '');

// ------------------------------------------------------------------ Hiệu quả PA (Q9, Q10)

export const NGUONG_IT_DU_LIEU = 5;
/** 70% tính bằng số nguyên (7/10) để biên 70% đúng tuyệt đối, không dính sai số số thực. */
const NGUONG_NEN_DUNG_PHAN_MUOI = 7;

/**
 * "Nên dùng" (Q9): đủ mẫu (≥ 5 PA), cải thiện ≥ 70% và cao nhất trong vấn đề (hoà thì cả hai). `anhEm` = các loại PA khác
 * của CÙNG vấn đề; loại dưới 5 PA không được xếp hạng (cấm xếp hạng mẫu nhỏ) nên không ngăn ai "Nên dùng".
 */
export function nenDung(
  dong: { soPa: number; caiThien: number },
  anhEm: readonly { soPa: number; caiThien: number }[],
): boolean {
  if (dong.soPa < NGUONG_IT_DU_LIEU) return false;
  const ty = dong.caiThien / dong.soPa;
  if (dong.caiThien * 10 < dong.soPa * NGUONG_NEN_DUNG_PHAN_MUOI) return false;
  return anhEm.every((x) => x.soPa < NGUONG_IT_DU_LIEU || x.caiThien / x.soPa <= ty + 1e-9);
}

/** "Thời gian thường mất" (P9b, PR-Pb2-a): TRUNG VỊ số ngày → tuần, làm tròn, tối thiểu 1; không có PA nào → null. */
export function tuanTrungVi(soNgay: readonly number[]): number | null {
  if (!soNgay.length) return null;
  const x = [...soNgay].sort((a, b) => a - b);
  const g = x.length >> 1;
  const tv = x.length % 2 ? x[g] : (x[g - 1] + x[g]) / 2;
  return Math.max(1, Math.round(tv / 7));
}

/** Tham số URL của Hiệu quả PA (Hợp đồng a↔b): `tu`/`den` = Thứ Hai tuần đầu / tuần cuối (gồm cả tuần `den`), tối đa 52 tuần. */
const HQ_PA_TOI_DA_TUAN = 52;
/** Kiểm `tu`/`den`: trả lỗi (chuỗi) hoặc null. `den` vắng = tới hôm nay. */
export function loiKhoangTuan(tu: string, den: string | null): string | null {
  const laThuHai = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).getUTCDay() === 1
    && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
  if (!laThuHai(tu) || (den !== null && !laThuHai(den))) return 'Khoảng tuần phải bắt đầu bằng ngày Thứ Hai (YYYY-MM-DD).';
  if (den !== null && tu > den) return 'Tuần đầu phải trước hoặc bằng tuần cuối.';
  if (den !== null && (Date.parse(den) - Date.parse(tu)) / 604800000 + 1 > HQ_PA_TOI_DA_TUAN) return `Khoảng tối đa ${HQ_PA_TOI_DA_TUAN} tuần.`;
  return null;
}

// ------------------------------------------------------------------ Ý thức (PR-YT4): bỏ "bước tiếp theo · Sắp Thư CC" (v3)
/* "Học viên cần chú ý" = nhóm Quá hạn · Bắt buộc xử lý · Chờ QL duyệt của cửa trạng thái (K1-25); cột Bậc hiện tại + Bậc kế đọc từ
   `EmYThuc`. Luật 8 tuần / Thư CC của v3 đã bỏ. */

/** Chênh lệch "so với lần trước / kỳ trước": nhiều hơn = xấu (đỏ ↑), ít hơn = tốt (xanh ↓), bằng = xám. null → "—". */
export function nhanSoVoiTruoc(d: number | null): { chu: string; tone: 'bad' | 'ok' | 'muted' } {
  if (d === null) return { chu: '—', tone: 'muted' };
  if (d > 0) return { chu: `↑${d}`, tone: 'bad' };
  if (d < 0) return { chu: `↓${-d}`, tone: 'ok' };
  return { chu: '=', tone: 'muted' };
}

// ------------------------------------------------------------------ kiểu trả về dùng chung máy chủ ↔ web

export type DongTongHop = {
  khoa: string; nhan: string;
  /** Một dòng phụ ≤ 60 ký tự (G-3) — ví dụ khoảng ngày của tuần, hoặc tên chi nhánh khi xem nhiều chi nhánh. */
  phu?: string;
  o: Record<string, number>;
  con?: DongTongHop[];
  /** PR-Pb2-a (lớp thường): dòng có bài Giữa khoá / Cuối khoá không — ô không áp dụng hiện "—". */
  coDot?: { giua: boolean; cuoi: boolean };
};
export type TongHopKetQua = {
  theo: TheoDong; ct: ChuongTrinh; cot: string[];
  hang: DongTongHop[];
  /** Dòng Tổng = HỢP các tập (đếm duy nhất), không phải cộng các dòng — nhất là các cột học viên. */
  tong: Record<string, number>;
  tongCoDot?: { giua: boolean; cuoi: boolean };
  scopeEmpty: boolean;
};

/** Tổng hợp vấn đề HV (PR-UX4): hàng lớn = kỹ năng (hoặc loại lỗi chung), hàng con = loại lỗi (hoặc kỹ năng · loại lỗi). */
export type DongVanDeHv = {
  khoa: string; nhan: string; loai: 'ky-nang' | 'loi' | 'chung' | 'gom';
  soHv: number; soLop: number;
  top3: { classId: number; ma: string; n: number }[];
  /** Hiệu số HV so với lần Test trước của chính từng lớp, cộng qua các lớp; `null` khi không lớp nào đủ 2 đợt. */
  soVoiTruoc: number | null;
  /** "Lỗi phổ biến" (chế độ kỹ năng) hoặc "Kỹ năng nhiều nhất" (chế độ gộp). */
  phu?: string | null;
  goiY?: string;
  con?: DongVanDeHv[];
};
export type VanDeHvKetQua = {
  gop: boolean; chiChinh: boolean;
  tomTat: { hv: number; case: number; lop: number };
  hang: DongVanDeHv[];
  /** PR-SOS (K1-22): `quaHan` = số Case chờ xác nhận nguyên nhân đã quá hạn 3 ngày. */
  chuaPhanLoai: { case: number; hv: number; lop: number; quaHan: number };
  scopeEmpty: boolean;
};

/**
 * Hiệu quả PA — một dòng. PA do GV thêm: hàng lớn = vấn đề (mã lỗi chính), hàng con = loại PA. PA theo quy chế: hàng lớn = SOS 1·2·3 (FT)
 * hoặc Bổ trợ Giữa khoá / sau Cuối khoá (lớp thường), không `nenDung` (PR-Pb2-a, Q8). `tvTuan` = trung vị (Q10); `dongThoi` = số PA chạy cùng PA khác của cùng Case.
 */
export type DongHieuQuaPa = {
  khoa: string; nhan: string; soPa: number; caiThien: number; hocVien: number;
  tvTuan: number | null; dongThoi: number; itDuLieu: boolean; nenDung: boolean;
  con?: DongHieuQuaPa[];
};
export type HieuQuaPaKetQua = {
  /** PA do giáo viên thêm (`preset = 0`) — như bảng cũ, giữ "Nên dùng". */
  gvThem: {
    tomTat: { paCoKetQua: number; caiThien: number; vanDeDuDuLieu: number };
    hang: DongHieuQuaPa[];
    gom: { soVanDe: number; hang: DongHieuQuaPa[] } | null;
  };
  /** PA theo quy chế (`preset = 1`, gồm Bổ trợ) — thứ tự cố định, không so, không xếp hạng. */
  quyChe: { tomTat: { paCoKetQua: number; caiThien: number }; hang: DongHieuQuaPa[] };
  chuaGhiKetQua: number; caseChuaPhanLoai: number;
  /** PA có kết quả mà chưa rõ em học ở đâu lúc làm PA (F03) — không vào bảng nào. */
  chuaRoNguon: number;
  /** Ngữ cảnh đang lọc: tên GV đọc từ máy chủ (không tin URL); khoảng tuần (`den` null = tới hôm nay). */
  loc: { gv: { id: number; ten: string } | null; tu: string; den: string | null; theoKhoang: boolean };
  scopeEmpty: boolean;
};

/** Ý thức (PR-YT4): "Học viên cần chú ý" + "Lớp nhiều vi phạm". */
export type DongHvCanChuY = {
  studentId: number; ten: string; lop: string | null; viPham: number; chuaXuLy: number;
  bienPhapGanNhat: string | null; ngay: string | null;
  /** PR-YT4 (K1-25): nhóm em (Quá hạn · Bắt buộc xử lý · Chờ QL duyệt), bậc hiện tại và bậc kế trên thang. */
  nhom: 'qua_han' | 'bat_buoc' | 'cho_duyet'; bac: string | null; bacKe: string | null;
};
export type DongLopViPham = {
  khoa: string; classId: number | null; nhan: string; viPham: number; chuaXuLy: number;
  hvCoViPham: number; siSo: number | null; soVoiTruoc: number; gvcn: string | null;
  con?: DongLopViPham[];
};
export type YThucPhanTichKetQua = {
  hvCanChuY: DongHvCanChuY[]; lop: DongLopViPham[];
  gom: { soLop: number; hang: DongLopViPham[] } | null;
  bienPhapTheoLoai: Record<string, number>; scopeEmpty: boolean;
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
  out.push([`${nhanGocNhin('tong-hop', kq.ct)} · ${moTaBoLoc}`]);
  out.push([]);
  out.push(['', ...cols.map((c) => (c.nhomCon ? NHAN_NHOM_CON[c.nhomCon] : nhomCotLabel(c.nhom, kq.ct)))]);
  out.push([THEO_DONG_COT_DAU[kq.theo], ...cols.map((c) => c.nhan(kq.ct))]);
  const dong = (r: DongTongHop, thut: boolean) =>
    [`${thut ? '  ' : ''}${r.nhan}${r.phu ? ` · ${r.phu}` : ''}`, ...cols.map((c) => (oKhongApDung(c, r.coDot) ? '—' : r.o[c.khoa] ?? 0))];
  for (const r of kq.hang) {
    out.push(dong(r, false));
    for (const con of r.con ?? []) out.push(dong(con, true));
  }
  out.push([`Cộng ${kq.hang.length} ${THEO_DONG_DANH_TU[kq.theo]}`, ...cols.map((c) => (oKhongApDung(c, kq.tongCoDot) ? '—' : kq.tong[c.khoa] ?? 0))]);
  return out;
}
