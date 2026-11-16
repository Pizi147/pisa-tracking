/** LOP-MOI + CUOI-KHOA (AU-LUI, audit 16/11 gói 3 + N47): thanh áp chung Sửa thông tin học viên (B3-16). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const em = (n: unknown) => `${n} ${Number(n) === 1 ? 'student' : 'students'}`;

export const EN_LOP_MOI = {
  'Áp chung cho em đã chọn': 'Apply to the selected students',
  'Áp môn học cho {n} em': (b) => `Apply subjects to ${em(b.n)}`,
  'TVV áp cho em đã chọn': 'Consultant to apply to the selected students',
  'Áp TVV cho {n} em': (b) => `Apply the consultant to ${em(b.n)}`,
  'Target áp cho em đã chọn': 'Target to apply to the selected students',
  'Áp Target cho {n} em': (b) => `Apply the target to ${em(b.n)}`,
} satisfies Record<string, Dich>;
