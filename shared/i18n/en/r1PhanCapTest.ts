/** R1-PHAN-CAP-TEST — phân cấp Lịch Test (thiết kế deploy-ux 26/10 mục 4.2, mockup M2 A2). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_R1_PHAN_CAP_TEST = {
  'Thu lớp {classCode}': 'Collapse {classCode}',
  '{daCham}/{tong} bài · {n} HV': (b) => `${b.daCham}/${b.tong} tests · ${b.n} ${Number(b.n) === 1 ? 'student' : 'students'}`,
  'S Expert ngày {ngay}': 'S Expert on {ngay}',
  'S Expert của {ten}': 'S Expert of {ten}',
  'Dán nhiều điểm từ Excel: dùng panel <b>Nhập điểm</b> (Học viên & Lớp › <b>⋯</b> › Nhập điểm) — lưới Lịch Test không có nút Dán.':
    'To paste many scores from Excel, use the <b>Enter scores</b> panel (Students & Classes › <b>⋯</b> › Enter scores) — the Weekly tests grid has no Paste button.',
} satisfies Record<string, Dich>;
