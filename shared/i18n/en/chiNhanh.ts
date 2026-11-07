/** CHI-NHANH-LIEN-HE (chủ SP 07/11) — Quản trị › Chi nhánh: tên, địa chỉ, SĐT (đầu tệp Báo cáo PH). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_CHI_NHANH = {
  'Địa chỉ': 'Address',
  'Chưa có địa chỉ': 'No address yet',
  'Đã lưu chi nhánh {ma}': 'Saved branch {ma}',
  'In ở đầu tệp Báo cáo PH của lớp thuộc chi nhánh này': 'Printed at the top of parent reports for classes in this branch',
  'Tên chi nhánh': 'Branch name',
  'Đặt tên cho chi nhánh.': 'Name the branch.',
  'Không tìm thấy chi nhánh': 'Branch not found',
  'Chỉ Quản trị hệ thống xem được thông tin chi nhánh.': 'Only system administrators can view branch details.',
  'Chỉ Quản trị hệ thống sửa được thông tin chi nhánh.': 'Only system administrators can edit branch details.',
  'Sửa thông tin chi nhánh': 'Edit branch details',
} satisfies Record<string, Dich>;
