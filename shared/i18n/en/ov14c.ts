/** OV-14c — Chấm Speaking (GV Speaking chấm chéo). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV14C = {
  'Chấm Speaking': 'Speaking marking',
  'Chấm Speaking · {soBai} bài': 'Speaking marking · {soBai} tests',
  '{n} bài chờ chấm': '{n} to mark',
  'Không có bài Speaking chờ chấm': 'No Speaking tests to mark',
  'Tìm học viên (tên, email)': 'Find student (name, email)',
  'Lọc lớp': 'Filter class',
  'Mọi lớp ({n})': 'All classes ({n})',
  'Không có học viên khớp': 'No matching students',
  'Nhập bởi {ten}': 'Entered by {ten}',
  'vừa lưu': 'just saved',
  'Đã chấm bởi {ten} lúc {luc}': 'Already marked by {ten} at {luc}',
} satisfies Record<string, Dich>;
