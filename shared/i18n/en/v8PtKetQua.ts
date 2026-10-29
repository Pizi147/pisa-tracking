/** V8-PT (mockup `thiet-ke/v8/phan-tich.html`, chủ SP duyệt 29/10): chữ mới của Phân tích.
 *  Mẫu: 'Chữ Việt': 'English' · có số: '{n} lượt': (b) => `${b.n} …` */
import type { Dich } from '../en.ts';

export const EN_V8_PT_KET_QUA = {
  'Mọi kết quả': 'All results',
  'Theo mức SOS': 'By SOS level',
  'Lượt Mock Test': 'Mock Test attempts',
  'xếp theo lớp → tên': 'sorted by class → name',
  'xếp theo mức SOS → lớp → tên': 'sorted by SOS level → class → name',
  'Đạt: OVR ≥ kỳ vọng của đợt (MT1 = Target − 1 · MT2 = Target − 0,5 · từ MT3 = Target).':
    'Passed: OVR ≥ the expected band of the round (MT1 = Target − 1 · MT2 = Target − 0.5 · MT3 onwards = Target).',
  'Chưa đủ điểm: thiếu kỹ năng nên chưa có OVR — không vào tỷ lệ Đạt.': 'Incomplete: a skill is missing so there is no OVR — not counted in the pass rate.',
  'L · R · W · S: ✓ / ✗ so kỳ vọng của đợt. SOS đếm theo lượt, gồm SOS tạm.': 'L · R · W · S: ✓ / ✗ against the expected band. SOS counts attempts, provisional SOS included.',
  'tiếp: {viec}': (b) => `next: ${b.viec}`,
  'không vào tỷ lệ': 'not in the rate',
  'KV': 'Exp.',
  'Lượt thi': 'Exam attempts',
  'Bước tiếp chưa chọn': 'Next step not chosen',
  'chọn ở Sau thi (TVV)': 'chosen in After exam (counsellor)',
  'theo lớp → ngày thi': 'by class → exam date',
  'Đạt Target: OVR ≥ Target, tính lúc nhập kết quả.': 'Target reached: OVR ≥ Target, worked out when the result is entered.',
  'Bước tiếp chọn ở Sau thi (Công việc TVV / hồ sơ HV); ở đây chỉ xem.': 'The next step is chosen in After exam (counsellor Tasks / student profile); view only here.',
} satisfies Record<string, Dich>;
