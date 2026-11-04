/** EN-SOT (03/11): chữ lẻ còn tiếng Việt khi chọn English — thanh demo (trước giữ Việt), khối GV chấm quá hạn, nút việc máy chủ gửi. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';
export const EN_SOT_LE = {
  'Ghi báo PH': 'Log parent call',
  'Hoàn thành được sau khi PA theo quy chế kết thúc': 'Can close after the rule-based PA ends',
  'Lịch MT mặc định': 'Default MT schedule',
  'Không có giáo viên nào chấm quá hạn.': 'No teacher is overdue on marking.',
  'Đang tải (skeleton)': 'Loading (skeleton)',
  'Không có dữ liệu': 'No data',
  'Lỗi khi tải': 'Load error',
  'Kịch bản demo: {ten}': 'Demo scenario: {ten}',
  'Ngày demo: {ngay}': 'Demo date: {ngay}',
  'Toàn bộ dữ liệu là giả, không phải dữ liệu thật của trung tâm.': 'All data is fake, not real centre data.',
  'Ngày demo:': 'Demo date:',
  'Kịch bản: {ten}': 'Scenario: {ten}',
  'Công cụ demo': 'Demo tools',
  'Tài khoản': 'Accounts',
  'Đổi tài khoản demo': 'Switch demo account',
  'Chọn tài khoản demo': 'Choose a demo account',
  'Phiên đăng nhập do máy chủ cấp cho tài khoản mẫu. Đây là cơ chế chỉ dành cho bản demo local, không phải xác thực dùng cho sản phẩm thật.':
    'The server issues a session for a sample account. This only exists in the local demo; it is not real sign-in.',
  'Đang tải danh sách…': 'Loading list…',
  'Đang dùng tài khoản: {ten}': 'Now using: {ten}',
  'Đang dùng': 'In use',
  '{n} phân công lớp/kỹ năng': (b) => `${b.n} class/skill ${Number(b.n) === 1 ? 'assignment' : 'assignments'}`,
  'Ngày demo dùng cho mọi phép tính hạn và tuần': 'Demo date used for all due dates and weeks',
  'Đổi ngày để xem lại trạng thái quá hạn / sắp đến hạn. Dữ liệu seed được sinh tương đối theo ngày này.':
    'Change the date to review overdue / due-soon states. Seed data is generated relative to this date.',
  'Dùng ngày thật': 'Use real date',
  'Kịch bản giao diện': 'UI scenario',
  'Chỉ bật khi bạn muốn thử. Hệ thống không bao giờ tự sinh lỗi ngẫu nhiên khi dùng bình thường.':
    'Turn on only to test. The system never creates random errors in normal use.',
  'Nạp lại dữ liệu mẫu': 'Reload sample data',
  'Xoá toàn bộ thay đổi bạn đã nhập và tạo lại dữ liệu gốc. Chạy trong terminal:': 'Clears all your changes and recreates the original data. Run in a terminal:',
  'Hướng dẫn nạp lại': 'How to reload',
  'Tôi đã hiểu': 'Got it',
  'Bản demo không cho phép xoá cơ sở dữ liệu từ giao diện để tránh mất dữ liệu thử nghiệm ngoài ý muốn.':
    'The demo does not allow deleting the database from the UI, to avoid losing test data by accident.',
  'Dừng ứng dụng, chạy lệnh sau rồi khởi động lại:': 'Stop the app, run this command, then start it again:',
} satisfies Record<string, Dich>;
