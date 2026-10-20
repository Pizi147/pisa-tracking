/** OV-15g — Lịch sử thay đổi (C22): panel chung, lối vào, tên trường / nguồn máy chủ gửi, Hướng dẫn. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15G = {
  'Lịch sử thay đổi': 'Change history',
  'Xem lịch sử thay đổi': 'View change history',
  'Lọc lịch sử thay đổi': 'Filter change history',
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
  '<b>⋯ › Lịch sử thay đổi</b> ở hồ sơ em, hồ sơ lớp; nút <b>Lịch sử thay đổi</b> ở hồ sơ MT, Kết quả thi thật, Góp ý hàng tuần, kết quả Thêm học viên.':
    '<b>⋯ › Change history</b> on the student and class profiles; a <b>Change history</b> button on the MT profile, Real exam result, Weekly feedback and the Add students result.',
  'Mỗi lần lưu một mục: ai · lúc · nguồn · lý do · trước → sau. Lô / Excel: một mục, bấm <b>Xem</b> mở từng em.':
    'One entry per save: who · when · source · reason · before → after. Batch / Excel: one entry, tap <b>View</b> to open each student.',
  'Hồ sơ lớp › <b>⋯ › Lịch sử thay đổi</b>: thông tin lớp, tiến độ, phân công. Góp ý hàng tuần, hồ sơ MT: nút <b>Lịch sử thay đổi</b>.':
    'Class profile › <b>⋯ › Change history</b>: class info, schedule, assignment. Weekly feedback, MT profile: the <b>Change history</b> button.',
} satisfies Record<string, Dich>;
