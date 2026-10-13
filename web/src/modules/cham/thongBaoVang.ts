import { cauDaGhiVang, type KetQuaVang } from '@shared/domain/index.ts';

/**
 * K4 "Vắng" (Q4 = B, chủ sản phẩm 07/10): MỘT thông báo ngắn, không nút, ở mọi đường ghi vắng — gõ "-" ở lưới lớp
 * thường / lưới FT / màn từng kỹ năng, và nút "Vắng" trên điện thoại. Không có "Hoàn tác": gỡ vắng = xoá "-" trong ô
 * (PR-BV, thông báo "Đã bỏ vắng …" nằm ở nơi gọi máy chủ vì cần tuần máy chủ trả về).
 * `khoa` = mã ô (vd `${attemptId}:${skill}`) — cùng ô thì thông báo mới thay cũ, hai ô liền nhau không nuốt nhau.
 * OV-11a (CA3-1): `kq` = hậu quả máy chủ trả (dời W4 SEP · huỷ phần thi · Không dự thi) — câu nói đúng điều đã xảy ra (`cauDaGhiVang`).
 */
export function thongBaoVang(
  toast: { push: (kind: 'ok', text: string, opts?: { key?: string }) => void },
  khoa: string, mon: string, tenHv?: string, kq?: KetQuaVang | null,
) {
  toast.push('ok', cauDaGhiVang(mon, tenHv, kq), { key: `vang:${khoa}` });
}
