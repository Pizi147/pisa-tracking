import { HOAN_TAC_VANG_MS, cauDaGhiVang, type KetQuaVang } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * K4 "Vắng" (Q4 = B, chủ sản phẩm 07/10): MỘT thông báo ngắn ở mọi đường ghi vắng — gõ "-" ở lưới lớp thường / lưới FT / màn từng
 * kỹ năng, và nút "Vắng" trên điện thoại. LUAT-34 (luật 4 sửa 21/10): Mock có `hoanTac` → nút "Hoàn tác (n)" 10 giây (= gỡ "-"); sau đó
 * vẫn gỡ được bằng xoá "-" trong ô (PR-BV, "Đã bỏ vắng …" ở nơi gọi máy chủ). Lớp thường giữ như cũ (không nút).
 * `khoa` = mã ô (vd `${attemptId}:${skill}`) — cùng ô thì thông báo mới thay cũ, hai ô liền nhau không nuốt nhau.
 * OV-11a (CA3-1): `kq` = hậu quả máy chủ trả (dời W4 SEP · huỷ (vắng 2 lần) · Không dự thi) — câu nói đúng điều đã xảy ra (`cauDaGhiVang`).
 */
export function thongBaoVang(
  toast: { push: (kind: 'ok', text: string, opts?: { key?: string; ms?: number; demLui?: boolean; hanhDong?: { nhan: string; onBam: () => void } }) => void },
  khoa: string, mon: string, tenHv?: string, kq?: KetQuaVang | null, hoanTac?: () => void,
) {
  toast.push('ok', cauDaGhiVang(mon, tenHv, kq), {
    key: `vang:${khoa}`,
    ...(hoanTac ? { ms: HOAN_TAC_VANG_MS, demLui: true, hanhDong: { nhan: t('Hoàn tác'), onBam: hoanTac } } : {}),
  });
}
