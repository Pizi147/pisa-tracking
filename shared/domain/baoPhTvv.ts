/**
 * SV-YT-TVV (luật 1–2, chủ SP 21–22/10): mỗi lần LƯU xử lý vi phạm sinh việc "Báo PH · {bậc} · {em}" cho TVV của em (không có → QL chi nhánh).
 * Hạn = 23:59 giờ VN ngày (lưu + 4) — ngày lưu là ngày 1, quá hạn từ 00:00 ngày (lưu + 5). Lưu ngày, so ngày: quá hạn khi hôm nay > hạn.
 */
import { addDaysIso } from './sos.ts';
import { ngayTheoGioVN } from './display.ts';

export const HAN_BAO_PH_NGAY = 4;

/** Hạn từ lúc lưu (ngày `YYYY-MM-DD` hoặc ISO có giờ — đổi về ngày giờ VN trước, 23:30 VN không lệch sang ngày UTC). */
export const hanBaoPh = (luu: string): string => addDaysIso(ngayTheoGioVN(luu) ?? luu.slice(0, 10), HAN_BAO_PH_NGAY);

/**
 * HAN-BAO-PH (chủ SP 03/11, 17.1–17.3): `hanChon` (cột `han_chon`, NULL = mặc định) thắng mọi tính toán; mọi nơi (Công việc, hồ sơ, tab lớp, chuông,
 * Tổng quan TVV "đúng hạn") gọi hàm này với cùng ba tham số.
 * K7 (v4b L2): em Tạm dừng thì việc ẩn, không quá hạn; Quay lại học → hạn mới = ngày quay lại + 4 (không sớm hơn hạn gốc).
 * `khoang` = khoảng Tạm dừng của em (`khoangTamDung`); chỉ khoảng đã kết thúc, bắt đầu không sau hạn gốc, kết thúc từ ngày lưu (= hạn gốc − 4).
 */
export function hanBaoPhHieuLuc(han: string, khoang: readonly { tu: string; den: string | null }[] = [], hanChon?: string | null): string {
  if (hanChon) return hanChon;   // HAN-BAO-PH (chủ SP 03/11): hạn người dùng chọn dùng ĐÚNG ngày đó — không trượt theo Tạm dừng
  const taoNgay = addDaysIso(han, -HAN_BAO_PH_NGAY);
  let h = han;
  for (const k of khoang) if (k.den && k.tu <= h && k.den >= taoNgay) h = [h, addDaysIso(k.den, HAN_BAO_PH_NGAY)].sort()[1];
  return h;
}

export const KET_QUA_BAO_PH = ['da_bao', 'chua_lien_he'] as const;
export type KetQuaBaoPh = (typeof KET_QUA_BAO_PH)[number];
