/** HV-LOP-SUA (chủ SP 27/10): Học viên & Lớp theo lớp — hàng lớp, ô SOS lớp, Bộ lọc thêm (theo vai, xếp em trong lớp), ô Việc "Xem thêm n". */
import type { Bien } from '../en.ts';

export const EN_HV_LOP_SUA = {
  'Xem thêm {n}': 'Show {n} more',
  'Việc khác': 'Other tasks',
  /* HV-LOP-VIEC: hạn trong nút việc "Nhập điểm MT3 · L · ⚠ quá 3 ngày". */
  'quá {n} ngày': (b: Bien) => (Number(b.n) === 1 ? '1 day overdue' : `${b.n} days overdue`),
  'Theo vai': 'By role',
  'Xếp em trong lớp': 'Order within class',
  'Theo tên': 'By name',
  'Cần chú ý trước': 'Needs attention first',
  'SOS mức 1: {a} HV, mức 2: {b} HV, mức 3: {c} HV': 'SOS level 1: {a} students, level 2: {b}, level 3: {c}',
};
