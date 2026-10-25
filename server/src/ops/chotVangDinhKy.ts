import { isInitialised, tx } from '../db.ts';
import { thiHanhLenhDenHan } from '../classes/lenhChuyen.ts';
import { quetXetLaiHetHan } from '../normal/xetLai.ts';
import { batDauHenDenHan } from '../loTrinh/buocTiep.ts';
import { todayInBusinessTz } from '../util.ts';
import { baoChamCheoQuaHan } from '../cham/chamCheo.ts';
import { sinhCheckpointKeTiep } from '../normal/regular.ts';

/**
 * QUÉT ĐỊNH KỲ SÁNG THỨ HAI (RB-1, PR-AN): thi hành quyết định chuyển lớp tới hạn + chuông "Speaking quá hạn chấm". Netlify gọi hàm `chot-vang`
 * theo LICH_CHOT_VANG; hàm đó gọi đúng hàm này. Tên giữ từ thời còn chốt dấu "-" cuối Chủ nhật — OV-1b bỏ việc đó ("-" có tác dụng ngay khi ghi).
 *
 * Lịch chạy HAI lần mỗi sáng thứ Hai: lần 06:05 là lưới an toàn khi lần 00:05 lỗi (mỗi việc chạy lặp vô hại). Ngày dùng là NGÀY THẬT giờ Việt Nam.
 * Cron của Netlify tính giờ UTC: 17:05 và 23:05 Chủ nhật UTC = 00:05 và 06:05 thứ Hai giờ Việt Nam (UTC+7).
 * Đổi lịch thì sửa CẢ hằng số này lẫn `netlify.toml` (phép kiểm so hai chỗ).
 */
export const LICH_CHOT_VANG = '5 17,23 * * 0';

export type KetQuaChotVang = { ngay: string; daChuyen: number; boQua: 'chua-khoi-tao' | null; ms: number };

export function chotVangDinhKy(o: {
  ngay?: string; daKhoiTao?: () => boolean;
  /** PR-CT: thi hành quyết định chuyển lớp tới Thứ Hai (mặc định `thiHanhLenhDenHan`); trả số em đã chuyển. */
  chuyen?: (ngay: string) => number;
} = {}): KetQuaChotVang {
  const batDau = Date.now();
  const ngay = o.ngay ?? todayInBusinessTz();
  if (!(o.daKhoiTao ?? isInitialised)()) return { ngay, daChuyen: 0, boQua: 'chua-khoi-tao', ms: Date.now() - batDau };
  /* Lỗi chuyển lớp không làm hỏng việc sau — lượt sáng sau / quét khi đọc thử lại. */
  let daChuyen = 0;
  try { daChuyen = (o.chuyen ?? ((n) => thiHanhLenhDenHan(n).daChuyen))(ngay); } catch (e) { console.error('[chot-vang] chuyển lớp', e); }
  /* OV-13m: Lộ trình mới sau thi "Hẹn bắt đầu" tới tuần (lỗi từng em đã bắt trong hàm). */
  if (!o.chuyen) daChuyen += batDauHenDenHan(ngay);
  /* P9a (N21): Xét lại lộ trình hết hạn (CN tuần 2) → tự ghi "Tiếp tục"; quét khi đọc là lưới an toàn. */
  if (!o.chuyen) try { quetXetLaiHetHan(ngay); } catch (e) { console.error('[chot-vang] xét lại', e); }
  /* PR-LT3 (T18, D3): chuông "Speaking quá hạn chấm" cho GVBM Speaking + GVCN — cùng lượt quét thứ Hai; lỗi không làm hỏng lượt quét. */
  try { baoChamCheoQuaHan(ngay); } catch (e) { console.error('[chot-vang] chuông chấm chéo', e); }
  /* OV-6b2: lớp liên tục — em đã qua tuần thi Checkpoint (chưa đủ điểm) có Checkpoint kế tiếp; lỗi không làm hỏng lượt quét. */
  try { tx(() => sinhCheckpointKeTiep(null, ngay)); } catch (e) { console.error('[chot-vang] checkpoint', e); }
  return { ngay, daChuyen, boQua: null, ms: Date.now() - batDau };
}
