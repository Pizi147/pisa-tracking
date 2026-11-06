/** LICH-THI-UI (chủ SP 06/11, mockup v16 bản 3): tab Lịch thi — chữ trạng thái + dòng phụ, nút việc, hộp, dải mở hàng, dòng tiêu đề lớp. */
import type { Bien } from '../en.ts';

export const EN_LICH_THI_UI = {
  'Case SOS {n}': 'SOS case {n}',
  '{n} PA': (b: Bien) => (Number(b.n) === 1 ? '1 plan' : `${b.n} plans`),
  '{n} em': (b: Bien) => (Number(b.n) === 1 ? '1 student' : `${b.n} students`),
  '{n} cần làm': '{n} to do',
  '⚠ {n} quá hạn': '⚠ {n} overdue',
  'Chưa chốt ngày': 'Date not set',
  'Chưa có TVV': 'No counsellor yet',
  'Mọi TVV': 'All counsellors',
  'Chữ vẫn giữ.': 'Your text is kept.',
  'Có KQ': 'Has result',
  'Em chưa có lịch luôn ở danh sách này; hiện không còn em nào. Đổi khoảng tháng ở trên để xem tháng khác.':
    'Students without a schedule always appear here; none are left right now. Change the month range above to see other months.',
  'Hết việc lịch thi trong {khoang}': 'No exam tasks left in {khoang}',
  'Không em nào chờ chốt ngày, ghi KQ hay chọn bước tiếp. Em chưa có lịch xem ở "Tất cả".':
    'No student is waiting for an exam date, a result or a next step. Students without a schedule are under "All".',
  'Hỗ trợ đang mở': 'Open support',
  'Lưu ngày': 'Save date',
  'Sửa KQ': 'Edit result',
  'Sửa ghi chú {ten}': 'Edit note {ten}',
  'Xem toàn bộ': 'View all',
  'Xem tất cả · {n}': 'View all · {n}',
  'Xong · {buoc}': 'Done · {buoc}',
  'bỏ tháng thi': 'exam month removed',
  'chưa có tháng thi': 'no exam month yet',
  'chốt ngày khi tới tháng': 'set the date when the month arrives',
  'quá hạn {ngay}': 'overdue {ngay}',
  'trước: {thang}': 'was: {thang}',
  'Đã thi {ngay} · chờ KQ': 'Took the exam {ngay} · awaiting result',
  'đã tới tháng thi {moc}': 'exam month {moc} has arrived',
  '↑↓ so {mt}': '↑↓ vs {mt}',
  'Bạn không có quyền xem em này.': 'You do not have permission to view this student.',
  'thi {ngay}': 'exam {ngay}',
};
