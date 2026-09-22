import { AsyncLocalStorage } from 'node:async_hooks';
import { HttpError } from '../util.ts';

/**
 * HẠN GIỜ MỖI LỜI GỌI (AN-5, PR-AN). Netlify cắt hàm đồng bộ sau 10 giây — và không đặt khác được trong netlify.toml. Bị cắt
 * giữa một giao dịch Turso là giữ khoá ghi cho tới khi Turso tự huỷ phiên đó. `libsql` chạy đồng bộ nên KHÔNG dừng được một
 * giao dịch đang chạy; chỉ có thể KHÔNG BẮT ĐẦU nó khi còn quá ít giờ. `tx()` (db.ts) hỏi hàm dưới đây trước khi mở giao dịch ngoài.
 *
 * Hạn chỉ gắn ở bản chính (middleware `demGio` trong app.ts). Ngoài một lời gọi có hạn (máy dev, lệnh ops, phép kiểm, hàm định kỳ)
 * `conLaiMs()` là null và không chặn gì. Không import db.ts (db.ts import file này).
 */
export const HAN_HAM_NETLIFY_MS = 10_000;
export const KHONG_MO_GIAO_DICH_KHI_CON_MS = 2_500;
export const LOG_CHAM_MS = 3_000;

const kho = new AsyncLocalStorage<{ hetLuc: number }>();

export function chayVoiHan<T>(hetLuc: number, fn: () => T): T {
  return kho.run({ hetLuc }, fn);
}

export function conLaiMs(bayGio: number = Date.now()): number | null {
  const s = kho.getStore();
  return s ? s.hetLuc - bayGio : null;
}

export function chanGiaoDichNeuSapHetGio(bayGio: number = Date.now()): void {
  const con = conLaiMs(bayGio);
  if (con !== null && con < KHONG_MO_GIAO_DICH_KHI_CON_MS) {
    throw new HttpError(503, 'Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.');
  }
}
