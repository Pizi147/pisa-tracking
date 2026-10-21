/**
 * OV-15f — LUẬT THUẦN của "Lịch thi" (rà soát lịch thi thật khi họp, mockup 5 khung 1) và "Xuất Excel danh sách học viên" (C31, mockup 5 khung 2).
 * Không đọc DB. Máy chủ (`classes/lichThi.ts`, `classes/xuatDanhSach.ts`) và web (`GocLichThi.tsx`, `NganXuatDs.tsx`) dùng chung một nguồn.
 */
import { shortDate } from './display.ts';
import { tuanLich } from './hienThiNgay.ts';
import { t } from '../i18n/index.ts';

// ------------------------------------------------------------------ Lịch thi

/** Bốn kết luận trên một hàng. "Chốt ngày" / "Chuyển tháng" ghi vào lịch chuẩn (`learning_cycles`); "Giữ tháng" / "Cần xác nhận" ghi nhật ký (không đổi lịch). */
export const KET_LUAN_LICH_THI = ['giu-thang', 'chot-ngay', 'chuyen-thang', 'can-xac-nhan'] as const;
export type KetLuanLichThi = (typeof KET_LUAN_LICH_THI)[number];

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
export const laThangIso = (s: unknown): s is string => typeof s === 'string' && THANG.test(s);

/** `?thang=2026-11,2026-12` → các tháng hợp lệ, không trùng, tăng dần, tối đa 12. */
export function dsThangLichThi(s: string | null | undefined): string[] {
  return [...new Set((s ?? '').split(',').map((x) => x.trim()).filter(laThangIso))].sort().slice(0, 12);
}

/** `2026-11` → `11/2026`. */
export const nhanThang = (m: string): string => `${m.slice(5, 7)}/${m.slice(0, 4)}`;

const congThang = (m: string, n: number): string => {
  const k = Number(m.slice(0, 4)) * 12 + (Number(m.slice(5, 7)) - 1) + n;
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`;
};

/**
 * LT-SV (07 mục 4, Q-C3 ① 21/10) — MỘT hàm trạng thái lịch thi thật cho mọi nơi (Lịch thi, đầu hồ sơ, "Sắp tới", việc Chốt ngày thi, tệp xuất).
 *   có ngày (thi thật đã nhập / ngày dự kiến): ≥ hôm nay → `da-chot-ngay` (A) · < hôm nay → `da-thi`
 *   chưa ngày, có tháng HOẶC tuần: tháng ≤ tháng này → `chua-chot-ngay` (B) · sau → `du-kien` · không gì → `chua-co`
 * Không bịa ngày từ tháng / tuần. `ke` = `examPlanOf` của lộ trình (tuần thắng tháng, tháng rác = chưa có).
 */
export type TrangThaiLich = 'chua-co' | 'du-kien' | 'chua-chot-ngay' | 'da-chot-ngay' | 'da-thi';
export type LichThi = { trangThai: TrangThaiLich; ngay: string | null; thang: string | null; tuan: string | null };
export function trangThaiLichThi(
  c: { thi_that_ngay?: string | null; exam_date?: string | null } | null | undefined,
  ke: { confidence: 'none' | 'month' | 'week'; month: string | null; weekStart: string | null }, homNay: string,
): LichThi {
  const la = (v: string | null | undefined) => (v && NGAY.test(v.slice(0, 10)) ? v.slice(0, 10) : null);
  const ngay = la(c?.thi_that_ngay) ?? la(c?.exam_date);
  if (ngay) return { trangThai: ngay < homNay ? 'da-thi' : 'da-chot-ngay', ngay, thang: ngay.slice(0, 7), tuan: null };
  if (ke.confidence === 'none' || !ke.month) return { trangThai: 'chua-co', ngay: null, thang: null, tuan: null };
  const tuan = ke.confidence === 'week' ? ke.weekStart : null;
  return { trangThai: ke.month <= homNay.slice(0, 7) ? 'chua-chot-ngay' : 'du-kien', ngay: null, thang: ke.month, tuan };
}
/** Nhãn của `trangThaiLichThi`, tách đôi cho dòng "nhãn **giá trị**" (đầu hồ sơ): { nhan: 'Thi', gt: '21/11 · còn 9 ngày' } · 'Đã thi' · 'Chưa chốt ngày thi'
 *  '11/2026' / 'W2 DEC' · 'Dự kiến thi' · 'Chưa có tháng thi' (gt rỗng). `tep`: tệp xuất — bỏ "còn n ngày" (chữ trong tệp không cũ theo ngày mở). */
export function tachNhanLichThi(l: LichThi, homNay: string, tep = false): { nhan: string; gt: string } {
  const moc = l.tuan ? tuanLich(l.tuan, homNay) : l.thang ? nhanThang(l.thang) : '';
  switch (l.trangThai) {
    case 'da-thi': return { nhan: t('Đã thi'), gt: shortDate(l.ngay, homNay) };
    case 'da-chot-ngay': {
      const con = Math.round((Date.parse(`${l.ngay}T00:00:00Z`) - Date.parse(`${homNay}T00:00:00Z`)) / 86_400_000);
      const sau = tep ? '' : con === 0 ? ` · ${t('hôm nay')}` : con <= 14 ? ` · ${t('còn {n} ngày', { n: con })}` : '';
      return { nhan: t('Thi'), gt: `${shortDate(l.ngay, homNay)}${sau}` };
    }
    case 'chua-chot-ngay': return { nhan: t('Chưa chốt ngày thi'), gt: moc };
    case 'du-kien': return { nhan: t('Dự kiến thi'), gt: moc };
    default: return { nhan: t('Chưa có tháng thi'), gt: '' };
  }
}
/** MỘT hàm nhãn: "Thi 21/11 · còn 9 ngày" · "Đã thi 28/11" · "Chưa chốt ngày thi 11/2026" · "Dự kiến thi W2 DEC" · "Chưa có tháng thi". */
export function nhanLichThi(l: LichThi, homNay: string, tep = false): string {
  const { nhan, gt } = tachNhanLichThi(l, homNay, tep);
  return gt ? `${nhan} ${gt}` : nhan;
}

/** Tháng kế tiếp của ngày nghiệp vụ — đích của lối "Lịch thi thật ›" ở Test › Lịch Test. */
export const thangKeTiep = (homNay: string): string => congThang(homNay.slice(0, 7), 1);

/** Các tháng để chọn: từ tháng trước tới `sau` tháng sau tháng của ngày nghiệp vụ. */
export const cuaSoThang = (homNay: string, truoc = 1, sau = 10): string[] =>
  Array.from({ length: truoc + sau + 1 }, (_, i) => congThang(homNay.slice(0, 7), i - truoc));

/**
 * Kết luận đang CÓ HIỆU LỰC của một em: có NGÀY thi → "Chốt ngày" (đọc từ lịch chuẩn, không cần ghi riêng); "Giữ tháng" / "Cần xác nhận"
 * chỉ còn hiệu lực khi tháng dự kiến hiện tại CÒN LÀ tháng lúc kết luận (đã dời sang tháng khác thì là lần rà mới); còn lại: chưa rà.
 */
export function ketLuanHienTai(i: { coNgay: boolean; thangDuKien: string | null; luu: { ketLuan: KetLuanLichThi | null; thang: string | null } | null }): KetLuanLichThi | null {
  if (i.coNgay) return 'chot-ngay';
  const l = i.luu;
  if (l && (l.ketLuan === 'giu-thang' || l.ketLuan === 'can-xac-nhan') && l.thang === i.thangDuKien) return l.ketLuan;
  return null;
}

/**
 * Điều cần ghi vào lịch chuẩn cho một kết luận (`examDate` của `updateCycle`: ngày ISO · tháng `yyyy-mm` · trống = xoá). `undefined` = không đổi lịch.
 * Lỗi nhập trả `{ loi }` (máy chủ đổi thành 400). "Đặt tháng" ở em chưa có dự kiến là "Chuyển tháng" không có tháng cũ.
 */
export function suaLichTheoKetLuan(i: {
  ketLuan: KetLuanLichThi; ngay?: string | null; thang?: string | null; coNgay: boolean; thangDuKien: string | null;
}): { examDate: string | null | undefined } | { loi: string } {
  switch (i.ketLuan) {
    case 'chot-ngay':
      return i.ngay && NGAY.test(i.ngay) ? { examDate: i.ngay } : { loi: 'Chọn ngày thi.' };
    case 'chuyen-thang':
      if (!laThangIso(i.thang)) return { loi: 'Chọn tháng thi.' };
      return { examDate: i.thang };
    case 'giu-thang':
      if (!i.thangDuKien) return { loi: 'Em chưa có tháng dự kiến để giữ.' };
      /* Đang có ngày chốt mà bấm "Giữ tháng" = bỏ ngày, về lại tháng đó. */
      return { examDate: i.coNgay ? i.thangDuKien : undefined };
    case 'can-xac-nhan':
      return { examDate: undefined };
  }
}

export type HangDem = { ketLuan: KetLuanLichThi | null; chuaCoDuKien: boolean; chuyenSang?: string | null };
/** Dải đếm đầu bảng: đã chốt · giữ · chuyển · cần xác nhận · chưa rà (em chưa có dự kiến đếm riêng, không tính vào năm số kia). */
export function demKetLuan(rows: readonly HangDem[]) {
  const o = { chotNgay: 0, giuThang: 0, chuyenThang: 0, canXacNhan: 0, chuaRa: 0, chuaCoDuKien: 0 };
  for (const r of rows) {
    /* SL1 (V2A-06): em chưa có dự kiến không nằm trong "n HV" của dải — kết luận gì cũng chỉ đếm ở `chuaCoDuKien` (trước: "Cần xác nhận" bị cộng, 2 ≠ 1). */
    if (r.chuaCoDuKien && !r.chuyenSang) { o.chuaCoDuKien += 1; continue; }
    if (r.chuyenSang) o.chuyenThang += 1;
    else if (r.ketLuan === 'chot-ngay') o.chotNgay += 1;
    else if (r.ketLuan === 'giu-thang') o.giuThang += 1;
    else if (r.ketLuan === 'can-xac-nhan') o.canXacNhan += 1;
    else o.chuaRa += 1;
  }
  return o;
}

// ------------------------------------------------------------------ Xuất Excel danh sách học viên (C31)

export type MauXuatDs = 'co-ban' | 'theo-doi-sos' | 'ket-qua-thi';
export const MAU_XUAT_DS: readonly MauXuatDs[] = ['co-ban', 'theo-doi-sos', 'ket-qua-thi'];

/** Cột chọn được (khoá → tên cột trong tệp). Cột "Điểm" là sáu cột OVR · L · R · W1 · W2 · S. */
export const COT_XUAT_DS = {
  ten: 'Tên học sinh', gmail: 'Gmail', lop: 'Lớp', coSo: 'Cơ sở', sos: 'Mức SOS', tamChinh: 'Tạm / Chính thức', mt: 'MT liên quan',
  kyNang: 'Kỹ năng cần xử lý', caseTt: 'Trạng thái Case', paTt: 'Trạng thái PA', phuTrach: 'Người phụ trách',
  diem: 'Điểm', target: 'Target', lichThi: 'Lịch thi thật', tuanThi: 'Tuần thi', ketQua: 'Kết quả', ketLuan: 'Kết luận', ghiChuHop: 'Ghi chú họp',
} as const;
export type KhoaCotXuatDs = keyof typeof COT_XUAT_DS;
/** Sáu cột con của "Điểm", đúng thứ tự mockup 5. */
export const COT_DIEM_XUAT = ['OVR', 'L', 'R', 'W1', 'W2', 'S'] as const;

export const COT_THEO_MAU: Record<MauXuatDs, readonly KhoaCotXuatDs[]> = {
  'co-ban': ['ten', 'gmail', 'lop', 'coSo'],
  'theo-doi-sos': ['ten', 'gmail', 'lop', 'coSo', 'sos', 'tamChinh', 'mt', 'kyNang', 'caseTt', 'paTt', 'phuTrach'],
  'ket-qua-thi': ['ten', 'gmail', 'lop', 'mt', 'tuanThi', 'diem', 'target', 'ketQua'],
};

/** Danh sách cột người dùng chọn → chỉ khoá hợp lệ, giữ thứ tự của `COT_XUAT_DS`; trống / lạ → cột của mẫu. */
export function cotXuatDs(mau: MauXuatDs, chon: unknown): KhoaCotXuatDs[] {
  const co = new Set(Array.isArray(chon) ? chon.map(String) : []);
  const ds = (Object.keys(COT_XUAT_DS) as KhoaCotXuatDs[]).filter((k) => co.has(k));
  return ds.length ? ds : [...COT_THEO_MAU[mau]];
}

/** Một học viên đã dựng đủ chữ để ghi ra tệp (máy chủ dựng, ô thiếu = `null`). */
export type HvXuatDs = {
  ten: string; gmail: string | null; lop: string; coSo: string | null; sos: string | null; tamChinh: string | null; mt: string | null;
  kyNang: string | null; caseTt: string | null; paTt: string | null; phuTrach: string | null;
  diem: Record<(typeof COT_DIEM_XUAT)[number], number | null>; target: string | null; lichThi: string | null; tuanThi: string | null; ketQua: string | null;
  ketLuan: string | null; ghiChuHop: string | null;
};

/** Sheet "Danh sách": hàng 1 = tên cột; một hàng một em; ô thiếu để TRỐNG (không thành 0). */
export function bangXuatDanhSach(hv: readonly HvXuatDs[], cot: readonly KhoaCotXuatDs[]): (string | number | null)[][] {
  const dau = cot.flatMap((k) => (k === 'diem' ? COT_DIEM_XUAT.map((c) => c as string) : [COT_XUAT_DS[k] as string]));
  const dong = (h: HvXuatDs) => cot.flatMap((k): (string | number | null)[] => (k === 'diem' ? COT_DIEM_XUAT.map((c) => h.diem[c]) : [h[k]]));
  return [dau, ...hv.map(dong)];
}

/** Nhãn mẫu cột trong sheet "Thông tin xuất". */
export const NHAN_MAU_XUAT: Record<MauXuatDs, string> = { 'co-ban': 'Cơ bản', 'theo-doi-sos': 'Theo dõi SOS', 'ket-qua-thi': 'Kết quả thi' };

/** Sheet "Thông tin xuất" (mockup 5 khung 2b): Mục · Giá trị — điều kiện lọc, thời điểm, phạm vi, số em, mẫu cột, người xuất. */
export function bangThongTinXuatDs(o: { dieuKien: string; luc: string; pham: 'loc' | 'chon'; soHv: number; mau: MauXuatDs; soCot: number; nguoi: string }): (string | number | null)[][] {
  return [
    ['Mục', 'Giá trị'],
    ['Điều kiện lọc', o.dieuKien],
    ['Thời điểm dữ liệu', o.luc],
    ['Phạm vi', o.pham === 'chon' ? 'Các học viên đã chọn' : 'Toàn bộ kết quả đang lọc'],
    ['Số học viên', o.soHv],
    ['Mẫu cột', `${NHAN_MAU_XUAT[o.mau]} (${o.soCot} cột)`],
    ['Người xuất', o.nguoi],
  ];
}
