/**
 * BẰNG CHỨNG — dán ảnh, kéo thả, dán liên kết (PR-Form G-9).
 *
 * Trước PR-Form, khối Bằng chứng (`web/src/ui/BangChung.tsx`) chỉ nhận một tệp chọn tay mỗi lần.
 * Owner chốt (mockup `09c-y-thuc-vua.html` dòng 41-68): dán ảnh chụp màn hình bằng Ctrl+V, kéo thả,
 * chọn nhiều tệp cùng lúc, hoặc dán một liên kết. Hai hàm dưới đây là luật thuần cho việc đó — dùng
 * chung cho mọi nơi có khối Bằng chứng, không lặp lại ở từng nơi gọi.
 */
import { t } from '../i18n/index.ts';

/** Đuôi tệp theo MIME của ảnh dán; loại lạ (không phải ảnh Ctrl+V thường gặp) → png. */
const DUOI_THEO_MIME: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
};

/** Tên tệp cho ảnh dán từ clipboard, ví dụ `anh-chup-23-09-1405.png`. Giờ Việt Nam. */
export function tenAnhDan(now: Date, mime: string): string {
  const vn = new Date(now.getTime() + 7 * 3_600_000);
  const dd = String(vn.getUTCDate()).padStart(2, '0');
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const hh = String(vn.getUTCHours()).padStart(2, '0');
  const mi = String(vn.getUTCMinutes()).padStart(2, '0');
  const duoi = DUOI_THEO_MIME[mime] ?? 'png';
  return `anh-chup-${dd}-${mm}-${hh}${mi}.${duoi}`;
}

/** Chữ dán có phải một liên kết đơn (không khoảng trắng, không nhiều dòng) không. */
export function laLienKet(text: string): boolean {
  const t = text.trim();
  if (!t || /\s/.test(t)) return false;
  return /^https?:\/\/\S+$/.test(t);
}

/** Dòng hướng dẫn nhỏ dưới khối Bằng chứng (mockup 09c dòng 41). */
export const CHU_KHOI_BANG_CHUNG = t('Dán ảnh chụp màn hình (Ctrl + V) · kéo thả · chọn tệp · dán liên kết');
