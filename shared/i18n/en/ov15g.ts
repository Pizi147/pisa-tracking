/** OV-15g — Lịch sử (C22): panel chung, lối vào, tên trường / nguồn máy chủ gửi, Hướng dẫn. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15G = {
  'Xem lịch sử': 'View history',
  'Lọc lịch sử': 'Filter history',
  'Chưa có thay đổi nào': 'No changes yet',
  'Lịch sử bắt đầu ghi từ {ngay}': (b) => `History recorded from ${b.ngay}`,
  'Nguồn': 'Source',
  'thành': 'to',
  'Phân công': 'Assignment',
  'Mã lớp': 'Class code',
  'Tuần khai giảng': 'Start week',
  'Tuần Progress Test': 'Progress Test week',
  'Tuần Final Test': 'Final Test week',
  'Bài Progress Test chưa thi': 'Progress Tests not yet taken',
  'Bài Final Test chưa thi': 'Final Tests not yet taken',
  'Phân công GV': 'Teacher assignment',
  'GVCN đổi GV bộ môn': 'Homeroom teacher changed subject teachers',
  'Tạo lớp': 'Create class',
  'Trạng thái lớp': 'Class status',
  'Mặc định': 'Default',
  'Thêm học viên hàng loạt': 'Bulk add students',
  'Dòng bỏ qua': 'Rows skipped',
  'Hẹn bắt đầu': 'Planned start',
  'Kết luận lịch thi': 'Exam schedule decision',
  'Tháng thi': 'Exam month',
  'Người dùng đã xoá': 'Deleted user',
  'Học viên đã xoá': 'Deleted student',
  '<b>⋯ › Lịch sử</b> ở hồ sơ em, hồ sơ lớp; nút <b>Lịch sử</b> ở hồ sơ MT, Kết quả thi thật, Góp ý hàng tuần, kết quả Thêm học viên.':
    '<b>⋯ › History</b> on the student and class profiles; a <b>History</b> button on the MT profile, Real exam result, Weekly feedback and the Add students result.',
  'Mỗi lần lưu một mục: ai · lúc · nguồn · lý do · trước → sau. Lô / Excel: một mục, bấm <b>Xem</b> mở từng em.':
    'One entry per save: who · when · source · reason · before → after. Batch / Excel: one entry, tap <b>View</b> to open each student.',
  'Hồ sơ lớp › <b>⋯ › Lịch sử</b>: thông tin lớp, tiến độ, phân công. Góp ý hàng tuần, hồ sơ MT: nút <b>Lịch sử</b>.':
    'Class profile › <b>⋯ › History</b>: class info, schedule, assignment. Weekly feedback, MT profile: the <b>History</b> button.',
  /* OV-15i1: chữ máy chủ ghép động (nguồn, tên trường) — mẫu có biến; đoạn " · " còn lại dịch từng phần. */
  'Lịch · {mon}': (b) => `Schedule · ${b.mon}`,
  '{mon} · Điểm': (b) => `${b.mon} · Score`,
  '{n} dòng · {o} ô': (b) => `${b.n} ${Number(b.n) === 1 ? 'row' : 'rows'} · ${b.o} ${Number(b.o) === 1 ? 'cell' : 'cells'}`,
  'thêm {a} · kết thúc {b}': (b) => `added ${b.a} · ended ${b.b}`,
  'Sửa cả lớp': 'Edit whole class',
  'Sửa cả lớp · {n} em': (b) => `Edit whole class · ${b.n} ${Number(b.n) === 1 ? 'student' : 'students'}`,
  'Học viên đã xoá · {n}': (b) => `Deleted student · ${b.n}`,
  'Đổi chương trình': 'Programme change',
  'Hoàn tác dán Excel': 'Undo Excel paste',
} satisfies Record<string, Dich>;
