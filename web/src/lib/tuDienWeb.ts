import type { Dich } from '@shared/i18n/en.ts';

/*
 * TAI-NHANH 02/11: từ điển Anh (~1/3 gói chính) thành mảnh riêng, chỉ tải khi trang tiếng Anh. `await` cấp cao nằm NGAY ở mô-đun
 * từ điển nên mọi mô-đun dùng `t()` (kể cả hằng nhãn tính lúc nạp) chờ từ điển xong mới chạy. Tải hỏng → chữ Việt, không trắng trang.
 */
const en = document.documentElement.lang === 'en' ? await import('@shared/i18n/en.ts').catch(() => null) : null;

export const BANG_EN: Record<string, Dich> = en?.EN ?? {};
export const KHOA_CHI_T: ReadonlySet<string> = en?.KHOA_CHI_T ?? new Set();
