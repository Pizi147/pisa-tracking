/** R1-PHAN-CAP-TEST — phân cấp Lịch Test (thiết kế deploy-ux 26/10 mục 4.2, mockup M2 A2). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_R1_PHAN_CAP_TEST = {
  'Thu lớp {classCode}': 'Collapse {classCode}',
  '{daCham}/{tong} bài · {n} HV': (b) => `${b.daCham}/${b.tong} tests · ${b.n} ${Number(b.n) === 1 ? 'student' : 'students'}`,
  'S Expert ngày {ngay}': 'S Expert on {ngay}',
  'S Expert của {ten}': 'S Expert of {ten}',
} satisfies Record<string, Dich>;
