/** BCPH-PDF (chủ SP 07/11) — Báo cáo PH xuất PDF như mẫu: nút xuất, điểm sửa thành chữ. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_BAO_CAO_PH_PDF = {
  'Tối đa {n} ký tự': 'Up to {n} characters',
  'Mỗi em một tệp PDF, gói .zip': 'One PDF per student, packed in a .zip',
  'Xuất PDF lớp': 'Class PDF',
  'Xuất Excel lớp': 'Class Excel',
  'Xuất PDF · {ten}': 'Export PDF · {ten}',
  'Xuất Excel · {ten}': 'Export Excel · {ten}',
  'Đợt này chưa có học viên nào để xuất': 'This round has no students to export',
} satisfies Record<string, Dich>;
