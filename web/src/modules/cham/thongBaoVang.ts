/**
 * K4 "Vắng" (Q4 = B, chủ sản phẩm 07/10): MỘT thông báo ngắn, không nút, ở mọi đường ghi vắng — gõ "-" ở lưới lớp
 * thường / lưới FT / màn từng kỹ năng, và nút "Vắng" trên điện thoại. Không có "Hoàn tác": gỡ vắng = xoá "-" trong ô
 * (PR-BV, thông báo "Đã gỡ vắng …" nằm ở nơi gọi máy chủ vì cần tuần máy chủ trả về).
 * `khoa` = mã ô (vd `${attemptId}:${skill}`) — cùng ô thì thông báo mới thay cũ, hai ô liền nhau không nuốt nhau.
 * Lớp thường truyền `tuanMoi` (mã tuần môn dời tới, như `W3 OCT`); FT không dời nên bỏ trống.
 */
export function thongBaoVang(
  toast: { push: (kind: 'ok', text: string, opts?: { key?: string }) => void },
  khoa: string, mon: string, tenHv?: string, tuanMoi?: string | null,
) {
  toast.push('ok', `Đã ghi vắng ${mon}${tenHv ? ` · ${tenHv}` : ''}${tuanMoi ? ` · dời ${tuanMoi}` : ''}`, { key: `vang:${khoa}` });
}
