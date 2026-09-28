/**
 * NGỮ PHÁP TRẠNG THÁI §7.3 — một dòng một nhãn; màu điểm/SOS không mượn.
 * Sáu nhãn dùng chung cho việc, case, phối hợp: Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ.
 */
export const TRANG_THAI = ['can-lam', 'dang-lam', 'cho-duyet', 'qua-han', 'xong', 'da-huy'] as const;
export type TrangThai = (typeof TRANG_THAI)[number];

/** Có chữ ký chỉ mục `string` để chỗ gọi đọc được bằng mã trạng thái thô (mã lạ → `undefined` lúc chạy). */
export const NHAN_TRANG_THAI: Readonly<Record<TrangThai, string>> & Readonly<Record<string, string>> = {
  'can-lam': 'Cần làm',
  'dang-lam': 'Đang làm',
  'cho-duyet': 'Chờ duyệt',
  'qua-han': 'Quá hạn',
  xong: 'Xong',
  'da-huy': 'Đã huỷ',
};

/** Chữ hiện của nhãn; "Quá hạn" kèm số ngày khi biết (`Quá hạn · 2 ngày`). */
export function chuTrangThai(t: TrangThai, soNgayQuaHan?: number | null): string {
  if (t === 'qua-han' && soNgayQuaHan && soNgayQuaHan > 0) return `Quá hạn · ${soNgayQuaHan} ngày`;
  return NHAN_TRANG_THAI[t];
}

/** Trạng thái việc phối hợp SOS (`pending` | `done` | `removed`) → nhãn chung. */
export function trangThaiPhoiHop(status: string | null | undefined): TrangThai {
  if (status === 'done') return 'xong';
  if (status === 'removed') return 'da-huy';
  return 'can-lam';
}

/** Trạng thái case (đóng/huỷ/mở/chưa xử lý/chưa có kế hoạch/đang xử lý) → nhãn chung. `chua_xu_ly`: Case từ SOS chưa đủ nguyên nhân (N1 Q28-5). */
export function trangThaiCaseDong(state: string | null | undefined): TrangThai {
  if (state === 'done' || state === 'closed') return 'xong';
  if (state === 'dismissed' || state === 'cancelled') return 'da-huy';
  if (!state || state === 'open' || state === 'chua_xu_ly' || state === 'no_plan') return 'can-lam';
  return 'dang-lam';
}
