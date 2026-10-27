/** M6 6b-4 PILOT-GV-TRE — panel "GV chấm quá hạn" (theo GV → em còn trống → Nhập hộ). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_PILOT_GV_TRE = {
  'Không GV nào chấm quá hạn': 'No teacher is overdue on marking',
  'Giáo viên này không còn bài trễ chấm': 'This teacher has no overdue marking left',
  'Bài = ô kỹ năng còn trống của em đã thi (W1, W2 tính riêng), đã qua hạn chấm. Cùng tập với khối "GV chấm quá hạn" và ô "quá hạn" ở Tổng quan.':
    'Paper = an empty skill cell of a student who sat the test (W1 and W2 counted separately), past its marking deadline. Same set as the "Teachers overdue on marking" block and the "overdue" tile on Overview.',
  'Bài = ô kỹ năng còn trống của em đã thi (W1, W2 tính riêng), đã qua hạn chấm. Cùng tập với cột "Quá hạn" của bảng GV cần chú ý; Speaking chấm chéo chưa ai nhận vẫn tính quá hạn.':
    'Paper = an empty skill cell of a student who sat the test (W1 and W2 counted separately), past its marking deadline. Same set as the "Overdue" column of Teachers to watch; unclaimed cross-marked Speaking still counts as overdue.',
  'Nhập hộ {mon}': 'Enter {mon} on their behalf',
  '+ {n} bài chưa có GV': '+ {n} papers with no teacher',
  '{n} dòng vừa đủ': '{n} rows just completed',
  'Speaking chấm chéo chưa ai nhận: {n} bài — chờ chấm, không tính quá hạn.': 'Unclaimed cross-marked Speaking: {n} papers — awaiting marking, not counted as overdue.',
  'lớp chưa phân công GV môn': 'class has no subject teacher assigned',
  'thi {tuan}': 'test {tuan}',
  'Đã đủ': 'Complete',
  'Phân công GV ở hồ sơ lớp {lop} ›': 'Assign a teacher on class {lop} ›',
  'người nhập': 'marker',
  'Chỉ GV chấm, Quản lý hoặc Admin của chi nhánh nhập được bài này.': 'Only the marking teacher, a Manager or the branch Admin can enter these papers.',
  'Bạn được ghi là người nhập; bài vẫn của {ten}': 'You are recorded as the one entering; the papers stay with {ten}',
  'Bạn được ghi là người nhập.': 'You are recorded as the one entering.',
  'Mọi chi nhánh': 'All branches',
  'Hồ sơ GV': 'Teacher profile',
  'Dữ liệu đến {ngay}.': 'Data as of {ngay}.',
  'Chấm quá hạn · {ten}': 'Overdue marking · {ten}',
  '{n} bài còn trống': '{n} papers empty',
  'Bài này không thuộc lớp nào — mở ở hồ sơ lượt Test.': 'These papers belong to no class — open them from the test record.',
  'Mở lưới lớp ở Lịch Test ({tuan}) ›': 'Open the class grid in Test schedule ({tuan}) ›',
  'Mở lưới lớp ở Lịch Test ›': 'Open the class grid in Test schedule ›',
  'Các em của dòng này không còn trong lưới lượt — mở lưới lớp để xem.': 'These students are no longer in this test grid — open the class grid to check.',
  'Em còn trống': 'Students with empty cells',
  'SỐ LIỆU · MOCK TEST': 'DATA · MOCK TEST',
  'trống': 'empty',
  'không tính': 'not counted',
} satisfies Record<string, Dich>;
