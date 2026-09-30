/**
 * HỘP CHỜ DUYỆT (PR-DUYET, đặc tả §5.5, §7.6, Q27-3) — luật thuần dùng chung máy chủ và giao diện.
 *
 * Mọi thứ "ai đó xin Quản lý quyết" là MỘT thẻ trong bảng `yeu_cau_duyet`, hiện ở MỘT hộp (Công việc › Chờ duyệt).
 * Loại thẻ là một mảng: PR sau (SOS, YT4, LT2…) chỉ thêm khoá vào CUỐI `LOAI_YEU_CAU` + một dòng `LOAI_YC_META`.
 */
import { hanTheoNgay, HAN_DUYET_NGAY } from './cases.ts';
import type { TrangThai } from './trangThai.ts';

export const PHAN_LOAI = ['hoc-thuat', 'y-thuc', 'lich-thi', 'thong-tin-hv', 'bao-len'] as const;
export type PhanLoai = (typeof PHAN_LOAI)[number];
export const PHAN_LOAI_LABEL: Record<PhanLoai, string> = {
  'hoc-thuat': 'Học thuật', 'y-thuc': 'Ý thức', 'lich-thi': 'Lịch thi', 'thong-tin-hv': 'Thông tin HV', 'bao-len': 'Báo lên',
};

/** Mỗi PR thêm khoá của mình VÀO CUỐI mảng này (SOS: 'khong_theo_doi'; YT4: 'y_thuc' + 'bao_len_y_thuc' — hai khoá; LT2: 'ke_hoach_bo_tro', 'quyet_dinh_cuoi_khoa', 'bao_len_mini_test'). */
export const LOAI_YEU_CAU = ['de_xuat_pa', 'xin_y_kien', 'lich_thi', 'sua_thong_tin', 'bao_len_nguyen_nhan', 'khong_theo_doi', 'y_thuc', 'bao_len_y_thuc', 'de_xuat_chuyen_lop', 'bao_len_ban_giao', 'bao_len_chua_lenh', 'ke_hoach_bo_tro', 'bao_len_mini_test', 'bao_len_cuoi_khoa'] as const;
export type LoaiYeuCau = (typeof LOAI_YEU_CAU)[number];

/** `da_tra_loi` chỉ của Xin ý kiến; `tu_dong` = hệ thống tự đóng (đối tượng không còn ý nghĩa). */
export const TRANG_THAI_YC = ['cho', 'duyet', 'tu_choi', 'tu_dong', 'da_tra_loi'] as const;
export type TrangThaiYc = (typeof TRANG_THAI_YC)[number];

/** Báo lên = 'nhac' (K1-57: không duyệt, chỉ nhắc) · Xin ý kiến = 'tra-loi' (T64) · còn lại Duyệt/Từ chối. */
export type KieuNut = 'duyet-tu-choi' | 'tra-loi' | 'nhac';

export type LoaiYcMeta = {
  phanLoai: PhanLoai;
  nhan: string;
  kieuNut: KieuNut;
  /** Hạn duyệt mặc định (ngày, tính cả ngày gửi — M-16). `null` = hạn do luồng nguồn truyền vào (hoặc không có). */
  hanNgay: number | null;
  /** Duyệt hàng loạt được (chỉ khi đang lọc đúng một loại). */
  hangLoat: boolean;
};

export const LOAI_YC_META: Record<LoaiYeuCau, LoaiYcMeta> = {
  de_xuat_pa: { phanLoai: 'hoc-thuat', nhan: 'Đề xuất PA', kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: true },
  xin_y_kien: { phanLoai: 'hoc-thuat', nhan: 'Xin ý kiến', kieuNut: 'tra-loi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
  lich_thi: { phanLoai: 'lich-thi', nhan: 'Dời lịch thi lần 2', kieuNut: 'duyet-tu-choi', hanNgay: null, hangLoat: true },
  sua_thong_tin: { phanLoai: 'thong-tin-hv', nhan: 'Đề xuất sửa', kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
  bao_len_nguyen_nhan: { phanLoai: 'bao-len', nhan: 'Case chờ nguyên nhân quá hạn', kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  /* PR-SOS (S4-5, T23): GVBM xin không theo dõi Case SOS chờ nguyên nhân — Quản lý duyệt trong 5 ngày. */
  khong_theo_doi: { phanLoai: 'hoc-thuat', nhan: 'Không cần theo dõi', kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: false },
  /* PR-YT4 (V4-9, V4-10): Meeting CX/GĐCN · WL 3 · Đình chỉ · Khác — QL duyệt trong 5 ngày. */
  y_thuc: { phanLoai: 'y-thuc', nhan: 'Xử lý Ý thức cần duyệt', kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
  /* PR-YT4 (V4-4, V4-5, K3-37, Q9): một thẻ mỗi em — không duyệt, QL biết và nhắc. */
  bao_len_y_thuc: { phanLoai: 'bao-len', nhan: 'Ý thức quá hạn', kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  /* PR-CT (Q30-1, Q30-2, Q30-4): GVCN đề xuất chuyển lớp (5 ngày) · Báo lên bàn giao quá hạn 3 ngày (một thẻ mỗi lớp nguồn) · Báo lên lớp hết khoá còn em chưa có lệnh. */
  de_xuat_chuyen_lop: { phanLoai: 'thong-tin-hv', nhan: 'Đề xuất chuyển lớp', kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: false },
  bao_len_ban_giao: { phanLoai: 'bao-len', nhan: 'Bàn giao quá hạn', kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  bao_len_chua_lenh: { phanLoai: 'bao-len', nhan: 'Lớp hết khoá còn em chưa có lệnh', kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  /* PR-LT2a (T54, M-05): kế hoạch bài giảng PA bổ trợ Giữa khoá — Quản lý duyệt trong 3 ngày (tính cả ngày gửi). */
  ke_hoach_bo_tro: { phanLoai: 'hoc-thuat', nhan: 'Kế hoạch bổ trợ', kieuNut: 'duyet-tu-choi', hanNgay: 3, hangLoat: false },
  /* PR-LT2b (M-05, T76): Mini Test dưới 70% — QL xử lý case-by-case. Bài Cuối khoá dời quá tuần cuối khoá (K4-23) — QL biết và nhắc. */
  bao_len_mini_test: { phanLoai: 'bao-len', nhan: 'Mini Test chưa đạt', kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  bao_len_cuoi_khoa: { phanLoai: 'bao-len', nhan: 'Cuối khoá dời quá hạn', kieuNut: 'nhac', hanNgay: null, hangLoat: false },
};

export function laPhanLoai(x: unknown): x is PhanLoai {
  return typeof x === 'string' && (PHAN_LOAI as readonly string[]).includes(x);
}

/** Hạn duyệt mặc định của một loại, tính từ ngày gửi (cả ngày gửi). `null` khi loại không có hạn mặc định. */
export function hanDuyetMacDinh(loai: LoaiYeuCau, ngayXin: string): string | null {
  const n = LOAI_YC_META[loai].hanNgay;
  return n ? hanTheoNgay(ngayXin.slice(0, 10), n) : null;
}

export type KhoaChip = 'tat-ca' | PhanLoai;
/** Số thẻ trên từng chip — đủ 6 khoá kể cả số 0 (Q12: chip đứng cố định). */
export function demChip(ds: readonly { phanLoai: PhanLoai }[]): Record<KhoaChip, number> {
  const kq = { 'tat-ca': ds.length } as Record<KhoaChip, number>;
  for (const k of PHAN_LOAI) kq[k] = 0;
  for (const x of ds) kq[x.phanLoai] += 1;
  return kq;
}

/**
 * MỘT HÀM ĐẾM cho mọi con số của hộp (chip, badge Công việc, dải Tổng quan): `tong` = mọi thẻ đang chờ trong hộp (bằng chip
 * "Tất cả", GỒM Báo lên) · `quaHan` = thẻ đỏ (hạn đã qua, gồm Báo lên) · `baoLen` = trong đó số thẻ Báo lên (không cần duyệt).
 */
export function demHop(ds: readonly { phanLoai: PhanLoai; hanDuyet: string | null }[], homNay: string) {
  const chip = demChip(ds);
  return { chip, tong: chip['tat-ca'], quaHan: ds.filter((x) => !!x.hanDuyet && x.hanDuyet < homNay).length, baoLen: chip['bao-len'] };
}

/**
 * Thứ tự thẻ: quá hạn → hạn gần → không hạn; cùng hạn: gửi trước đứng trước.
 * Hạn là ngày ISO nên so chuỗi đã đúng — thẻ quá hạn có hạn sớm nhất, tự đứng đầu.
 */
export function sapThe<T extends { hanDuyet: string | null; taoLuc: string }>(ds: readonly T[]): T[] {
  return [...ds].sort((a, b) => {
    if (a.hanDuyet !== b.hanDuyet) {
      if (!a.hanDuyet) return 1;
      if (!b.hanDuyet) return -1;
      return a.hanDuyet < b.hanDuyet ? -1 : 1;
    }
    return a.taoLuc < b.taoLuc ? -1 : a.taoLuc > b.taoLuc ? 1 : 0;
  });
}

/** QL tự gửi rồi tự duyệt (Q-D). Người xin `null` = hệ thống (Báo lên) → không bao giờ là tự duyệt. */
export function laTuDuyet(nguoiXin: number | null, nguoiDuyet: number): boolean {
  return nguoiXin !== null && nguoiXin === nguoiDuyet;
}

/** Đường tới đúng thẻ: người duyệt → hộp Chờ duyệt, người xin → Yêu cầu của tôi. */
export function duongThe(id: number, vai: 'duyet' | 'nguoi-xin'): string {
  return `/cong-viec/${vai === 'duyet' ? 'cho-duyet' : 'yeu-cau'}?the=${id}`;
}

/** Trạng thái thẻ → nhãn chung §7.3 (`NhanTrangThai`) + chữ riêng của hộp. */
export function nhanTrangThaiYc(t: TrangThaiYc, tuDuyet = false): { t: TrangThai; chu: string } {
  switch (t) {
    case 'cho': return { t: 'cho-duyet', chu: 'Chờ duyệt' };
    case 'duyet': return { t: 'xong', chu: tuDuyet ? 'Đã duyệt · tự duyệt' : 'Đã duyệt' };
    case 'da_tra_loi': return { t: 'xong', chu: 'Đã trả lời' };
    case 'tu_choi': return { t: 'da-huy', chu: 'Bị từ chối' };
    case 'tu_dong': return { t: 'da-huy', chu: 'Tự đóng' };
  }
}

/** Một thẻ như máy chủ trả cho giao diện (`GET /yeu-cau`). Chữ đã dựng sẵn — giao diện không tự ghép từ mã. */
export type TheYeuCauDto = {
  id: number;
  /** Id đối tượng gốc (đề nghị dời, PA…) — PR-XLMT: hồ sơ Mock tìm đúng thẻ Lịch thi của một đề nghị dời. */
  doiTuongId?: number | null;
  loai: LoaiYeuCau;
  nhanLoai: string;
  phanLoai: PhanLoai;
  nhanPhanLoai: string;
  kieuNut: KieuNut;
  hangLoat: boolean;
  tieuDe: string;
  /** Ngữ cảnh ngắn sau học viên · lớp (ví dụ "MT2"). */
  phu: string | null;
  dong: string[];
  neuDuyet: string | null;
  /** Đường "Mở" (hồ sơ HV / Ngăn Case / trang lượt thi). */
  mo: string | null;
  hocVienId: number | null;
  hocVien: string | null;
  lopId: number | null;
  lop: string | null;
  nguoiXinId: number | null;
  /** `null` = hệ thống (Báo lên). */
  nguoiXin: string | null;
  nguoiDuyet: string | null;
  lyDo: string | null;
  lyDoTuChoi: string | null;
  traLoi: string | null;
  lyDoDong: string | null;
  hanDuyet: string | null;
  trangThai: TrangThaiYc;
  tuDuyet: boolean;
  taoLuc: string;
  xuLyLuc: string | null;
  duLieu: Record<string, unknown> | null;
};

/** `cho` = mọi thẻ đang chờ trong hộp (= chip "Tất cả", gồm Báo lên); `quaHan` = thẻ đỏ; `baoLen` = trong đó Báo lên — xem `demHop`. */
export type DemYeuCau = { cho: number; quaHan: number; baoLen: number; cuaToiCho: number; cuaToiTuChoi: number };

/** PR-S4F #14: thẻ Báo lên không có người để Nhắc (`duLieu.ownerId` rỗng) — ghi rõ vì sao thay cho nút Nhắc. */
export const nhanKhongNguoiNhac = (loai: string): string =>
  loai === 'bao_len_nguyen_nhan' ? 'Case chưa có người phụ trách' : 'Lớp chưa có GVCN';
