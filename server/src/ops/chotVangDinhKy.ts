import { isInitialised } from '../db.ts';
import { settleNoShows } from '../fasttrack/absence.ts';
import { todayInBusinessTz } from '../util.ts';

/**
 * CHỐT DẤU "-" ĐỊNH KỲ (RB-1, quyết định 4.6, PR-AN). Trước đây chỉ chốt khi có người mở trang (attempts, Việc cần làm) — tuần không
 * ai mở web thì số liệu còn "-" chưa chốt. Netlify gọi hàm `chot-vang` theo LICH_CHOT_VANG; hàm đó gọi đúng hàm này.
 *
 * `settleNoShows` chạy lặp vô hại (một buổi chỉ chốt một lần) nên lịch chạy HAI lần mỗi sáng thứ Hai: lần 06:05 là lưới an toàn khi
 * lần 00:05 lỗi. Ngày dùng là NGÀY THẬT giờ Việt Nam — `settleNoShows` chốt tuần có `week_end < ngày`, nên phải chạy SAU nửa đêm VN.
 *
 * Cron của Netlify tính giờ UTC: 17:05 và 23:05 Chủ nhật UTC = 00:05 và 06:05 thứ Hai giờ Việt Nam (UTC+7).
 * Đổi lịch thì sửa CẢ hằng số này lẫn `netlify.toml` (phép kiểm so hai chỗ).
 */
export const LICH_CHOT_VANG = '5 17,23 * * 0';

export type KetQuaChotVang = { ngay: string; daChot: number; boQua: 'chua-khoi-tao' | null; ms: number };

export function chotVangDinhKy(o: {
  ngay?: string; chot?: (ngay: string) => number; daKhoiTao?: () => boolean;
} = {}): KetQuaChotVang {
  const batDau = Date.now();
  const ngay = o.ngay ?? todayInBusinessTz();
  if (!(o.daKhoiTao ?? isInitialised)()) return { ngay, daChot: 0, boQua: 'chua-khoi-tao', ms: Date.now() - batDau };
  const daChot = (o.chot ?? settleNoShows)(ngay);
  return { ngay, daChot, boQua: null, ms: Date.now() - batDau };
}
