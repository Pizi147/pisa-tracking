import type { Dich } from '../en.ts';

/** DON-CHU (05/11): tiền tố chữ máy chủ ghép từ dữ liệu đã lưu (thẻ Chờ duyệt) + đơn vị đếm dòng Phân tích. Khoá = chữ Việt. */
export const EN_DON_CHU = {
  'Hệ thống: {lyDo}': 'System: {lyDo}',
  'Giáo viên: {lyDo}': 'Teacher: {lyDo}',
  'Kết quả tuần: {kq} — {ghiChu}': 'Weekly result: {kq} — {ghiChu}',   // đứng trước khoá dưới: cùng số chữ cái, khoá trước khớp trước
  'Kết quả tuần: {kq}': 'Weekly result: {kq}',
  'đợt': 'rounds',
  'chi nhánh': 'branches',
} satisfies Record<string, Dich>;
