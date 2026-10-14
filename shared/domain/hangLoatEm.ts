/**
 * LÀM NHIỀU HỌC VIÊN MỘT LẦN (PR-LUI-b, chủ sản phẩm 06/10) — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại · Huỷ chuyển lớp · Khôi phục chuyển lớp · Xoá (OV-12a).
 * Chỉ Quản lý / Quản trị.
 * MỘT nguồn cho máy chủ (`students/hangLoat.ts`) và web (`XemTruocHangLoatPanel.tsx`): tên việc, nhãn, việc ngược của nút Hoàn tác, trần.
 */
export const VIEC_HANG_LOAT = ['ket-thuc', 'luu-tru', 'bo-luu-tru', 'hoc-lai', 'huy-lenh', 'khoi-phuc-lenh', 'hoan-tac-ket-thuc', 'hoan-tac-hoc-lai', 'xoa'] as const;
export type ViecHangLoat = (typeof VIEC_HANG_LOAT)[number];

export const NHAN_VIEC_HANG_LOAT: Record<ViecHangLoat, string> = {
  'ket-thuc': 'Kết thúc học', 'luu-tru': 'Lưu trữ', 'bo-luu-tru': 'Bỏ lưu trữ', 'hoc-lai': 'Học lại',
  'huy-lenh': 'Huỷ chuyển lớp', 'khoi-phuc-lenh': 'Khôi phục chuyển lớp',
  'hoan-tac-ket-thuc': 'Hoàn tác Kết thúc học', 'hoan-tac-hoc-lai': 'Hoàn tác Học lại', xoa: 'Xoá',
};

/**
 * Nút Hoàn tác gọi đúng việc ngược này với những học viên đã làm được. Kết thúc học / Học lại có việc hoàn tác RIÊNG (`hoan-tac-*`): trả đúng ngày, mở lại đúng Case / PA,
 * gỡ đúng ghi danh / lộ trình mới — khác với bấm Học lại (chấp nhận Case đã đóng) hay Kết thúc học lần nữa.
 */
export const VIEC_NGUOC: Record<Exclude<ViecHangLoat, 'xoa'>, ViecHangLoat> = {
  'ket-thuc': 'hoan-tac-ket-thuc', 'hoc-lai': 'hoan-tac-hoc-lai', 'luu-tru': 'bo-luu-tru', 'bo-luu-tru': 'luu-tru', 'huy-lenh': 'khoi-phuc-lenh', 'khoi-phuc-lenh': 'huy-lenh',
  'hoan-tac-ket-thuc': 'ket-thuc', 'hoan-tac-hoc-lai': 'hoc-lai',
};

/** Một request GHI tối đa số học viên này (10 s của Netlify; cùng mẫu `LO_LUU_SUA_CA_LOP`). Web chia lô bằng `chiaLo`. */
export const LO_HANG_LOAT_EM = 8;
/** OV-12a: Xoá một em ~37 câu (~4 s trên Turso, `XOA_CAN_CON_MS`) — mỗi request MỘT em. */
export const LO_XOA_EM = 1;
/** Chữ xác nhận Xoá nhiều em; so khớp bỏ dấu, không phân biệt hoa thường ("XOÁ", "Xóa", "xoa" đều được). */
export const CHU_XAC_NHAN_XOA = 'XOÁ';
export const khopXacNhanXoa = (s: unknown): boolean =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase() === 'XOA';
/** Xem trước một lần tối đa số học viên này. */
export const TOI_DA_HANG_LOAT_EM = 200;
/** Máy chủ chỉ cho Khôi phục quyết định chuyển lớp đã huỷ trong số giờ này. */
export const KHOI_PHUC_LENH_GIO = 24;

export type DongXemTruoc = {
  studentId: number; ten: string; ma: string; lop: string | null;
  trangThai: 'dang-hoc' | 'tam-dung' | 'da-ket-thuc' | 'luu-tru';
  /** Có chữ = học viên này KHÔNG được làm (bỏ qua / ngoài quyền / thiếu điều kiện); `null` = làm được. */
  lyDoBo: string | null;
};
export type XemTruocHangLoat = {
  viec: ViecHangLoat; rows: DongXemTruoc[];
  tong: { duoc: number; boQua: number; caseDong: number; paHuy: number; lenhHuy: number; lopMoLai: string[]; theoHuong: Record<string, number>;
    /** OV-12a, chỉ Xoá: dữ liệu sẽ mất của cả lô ("Lượt Test 12", "Điểm đã nhập 40"…). */
    mat?: { nhan: string; so: number }[] };
};
export type KetQuaHangLoat = { ok: number[]; failed: { studentId: number; message: string }[] };
