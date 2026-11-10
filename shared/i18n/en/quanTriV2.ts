/** QUAN-TRI-V2 (chủ SP 11/11) — Quản trị: sửa vai / kỹ năng tại dòng, quyền theo vai, nhật ký chung, cấu hình hệ thống. */
import type { Dich } from '../en.ts';

export const EN_QUAN_TRI_V2 = {
  'chưa có kỹ năng': 'no skills yet',
  'Chưa lưu thay đổi': 'Changes not saved',
  'không vai': 'no role',
  'Đổi vai trò · chi nhánh': 'Change role · branch',
  'Đã đổi vai {ten}: {vai}': (b) => `Changed roles of ${b.ten}: ${b.vai}`,
  'Đã hoàn tác vai {ten}': (b) => `Roles of ${b.ten} restored`,
  'Đổi kỹ năng phụ trách': 'Change skills',
  'Đã đổi kỹ năng {ten}': (b) => `Changed skills of ${b.ten}`,
  'Đã hoàn tác kỹ năng {ten}': (b) => `Skills of ${b.ten} restored`,
  'Nhật ký chung': 'Change log',
  'Không tải thêm được': 'Could not load more',
  'Mục: Tất cả': 'Section: All',
  'Người: Tất cả': 'Person: All',
  'Đến': 'To',
  'Chưa có thay đổi nào khớp.': 'No matching changes.',
  'Đã hoàn tác thay đổi quyền': 'Permission changes undone',
  'tự có theo chủ nhiệm': 'comes with homeroom duty',
  'Theo từng vai': 'By role',
  'So sánh mọi vai': 'Compare all roles',
  'Tìm quyền…': 'Search permissions…',
  'Tìm quyền': 'Search permissions',
  'Không có quyền nào khớp.': 'No matching permissions.',
  '{n} đổi': (b) => `${b.n} changed`,
} satisfies Record<string, Dich>;
