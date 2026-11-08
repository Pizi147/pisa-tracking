/** PT-PANEL (kế hoạch 2026-11-05, mockup v13 A1 / A2) — panel bảng có điểm của Phân tích. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_PT_PANEL = {
  '{a}/{b} câu': '{a}/{b} correct',
  'Số · Báo cáo HV': 'Number · student report',
  'Số · Phân tích GV': 'Number · teacher analysis',
  'Chênh': 'Change',
  'Điểm kỹ năng ở lượt MT so lượt MT liền trước có điểm kỹ năng đó của chính HV. Ô "Sau" ✓ / ✗ so kỳ vọng của lượt đó.':
    'Skill score in the MT compared with the student’s previous MT that has this skill. "After" ✓ / ✗ is against that MT’s expectation.',
  'Lượt Test đạt khi Overall đạt kỳ vọng của lượt (mọi kỹ năng tính Đạt); Overall chưa đạt thì xét từng kỹ năng. Cột tô nền là kỹ năng GV phụ trách.':
    'A Test passes when Overall meets the MT’s expectation (every skill counts as passed); otherwise each skill is checked. Highlighted cells are the teacher’s skills.',
  'HV đang SOS ở lớp GV đang dạy; bảng hiện lượt Mock có điểm gần nhất của HV.': 'Students currently in SOS in the teacher’s classes; the table shows each student’s latest scored Mock.',
  'Lượt MT mới nhất của HV trong kỳ (cùng hàng). Cột Kỳ vọng = kỳ vọng của lượt; Đạt Target = Overall đạt Target lúc thi.':
    'Each student’s latest MT in the period (same row). Expectation = that MT’s expectation; Target met = Overall reached the Target at the time.',
  'HV có lượt MT trong kỳ nhưng chưa đủ điểm để có Overall — ngoài mẫu Đạt MT. Bảng hiện lượt mới nhất.':
    'Students with an MT in the period but not enough scores for an Overall — outside the MT pass base. The table shows the latest MT.',
  'Mỗi HV lấy lượt MT mới nhất chốt điểm trong kỳ. Đạt khi Overall đạt kỳ vọng của lượt đó.':
    'Each student’s latest MT finalised in the period. Passed when Overall meets that MT’s expectation.',
  'đạt từ {n} % mỗi môn': (b) => `pass from ${b.n} % per subject`,
  'Mỗi dòng là một môn GV phụ trách (viền nhấn) ở một bài Progress Test / Final Test. Môn đạt khi tỷ lệ đúng từ ngưỡng của lớp.':
    'Each row is one subject the teacher owns (outlined) in a Progress / Final Test. A subject passes when its correct ratio reaches the class threshold.',
  'mới nhất trước': 'newest first',
  'Trễ {n} ngày': (b) => `${b.n} days late`,
  'Số · Ý thức': 'Number · conduct',
  'Số · Hiệu quả PA': 'Number · plan effectiveness',
  'Đợt {n}': (b) => `Round ${b.n}`,
} satisfies Record<string, Dich>;
