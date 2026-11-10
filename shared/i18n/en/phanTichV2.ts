/** PHÂN TÍCH V2 (chủ SP 12/11, đặc tả `2026-11-12-phan-tich-v2-design.md`) — tab Chi nhánh · Thi thật · SOS · Giáo viên, báo cáo Chi nhánh. */
import type { Dich } from '../en.ts';

export const EN_PHAN_TICH_V2 = {
  'HV đang học': 'Studying',
  'HV có MT chốt': 'students with a closed MT',
  'lượt kỹ năng tăng band': 'skill attempts up a band',
  'Lượt kỹ năng có band tăng so mốc MT trước của chính HV.': 'Skill attempts whose band went up versus the student’s previous MT.',
  'kết thúc': 'finished',
  'Vào học trong kỳ': 'Started in the period',
  'Kết thúc học trong kỳ': 'Finished in the period',
  'Em thi': 'Sat the exam',
  'Chưa có KQ': 'No result yet',
  'Đạt Target · trừ KCK': 'Met Target · excl. no-commitment',
  'chưa em nào có KQ': 'no results yet',
  'Cùng số với báo cáo Thi thật. Đạt Target trừ KCK. Chưa có KQ là số hiện tại.': 'Same numbers as the Real exam report. Met Target excludes no-commitment students. No result yet is a current count.',
  'Vượt · Đạt · Chưa đạt Target, trừ KCK': 'Above · Met · Below Target, excl. no-commitment',
  'Không em nào thi trong kỳ': 'No one sat the exam in this period',
  'bài · Progress, Final': 'tests · Progress, Final',
  'Bài Progress Test đạt hết và bài Final Test từ 70 % trên bài đủ điểm trong kỳ — cùng ô của bảng Test lớp thường.': 'Progress Tests with every subject passed and Final Tests from 70 %, over fully scored tests in the period — the same cells as the standard-class Test table.',
  'Bài Final Test đủ điểm trong kỳ theo % tổng: Đạt từ 70 % · 60–69 % · 50–59 % · dưới 50 %.': 'Fully scored Final Tests in the period by total %: Pass from 70 % · 60–69 % · 50–59 % · under 50 %.',
  'bài Final': 'Final tests',
  'Không có bài Final trong kỳ': 'No Final Test in this period',
  'Chi nhánh chưa có lớp đang học ở khung này': 'This branch has no active class in this programme',
  'Chưa có chi nhánh nào trong phạm vi': 'No branch in your scope',
  'HV đang học: hiện tại. Đạt MT (HV), Tiến bộ (lượt kỹ năng), Thi thật (em, trừ KCK): trong kỳ. Hàng tổng là tập gốc — một em ở hai lớp tính một lần.': 'Studying: current. Met MT (students), Progress (skill attempts), Real exam (students, excl. no-commitment): in the period. The total row is the base set — a student in two classes counts once.',
  'HV đang học: hiện tại. Đạt Test, Cuối khoá: bài trong kỳ, cùng ô của bảng Test lớp thường.': 'Studying: current. Passed Test, End of course: tests in the period, the same cells as the standard-class Test table.',
  'Tab Giáo viên chỉ QL, Quản trị xem — đang mở Chi nhánh': 'The Teachers tab is for managers and admins — showing Branch',
} satisfies Record<string, Dich>;
