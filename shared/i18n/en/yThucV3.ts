/** YT-a (mockup `thiet-ke/v19/y-thuc.html`, chủ SP duyệt #1482) — tab Ý thức hồ sơ lớp theo em, lịch sử tại chỗ. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_Y_THUC_V3 = {
  'Bước đang làm': 'Current step',
  'Thu gọn lịch sử': 'Hide history',
  'Đã xử lý là gì': 'What “Actioned” shows',
  'GVCN: lần xử lý (bậc, ngày) hoặc Đã xem. TVV: kết quả báo PH và Nội dung TVV ghi. Báo PH sinh khi GVCN lưu xử lý (kể cả đề xuất chờ QL), hạn 5 ngày.':
    'Homeroom: the action (level, date) or Seen. Consultant: the parent-call result and its Notes. The parent call is created when the homeroom teacher saves an action (including a proposal awaiting the manager), due in 5 days.',
  'Lộ trình này chưa có gì — xem Cả lịch sử.': 'Nothing in this pathway — see Full history.',
  'Phạm vi lịch sử': 'History scope',
  'Lộ trình: vi phạm tính vào thang của lộ trình đang học. Cả lịch sử: mọi lộ trình.': 'Pathway: incidents that count toward the current pathway’s ladder. Full history: every pathway.',
  'Không có việc Ý thức nào của bạn ở lớp này': 'No conduct tasks for you in this class',
  'Không em nào khớp': 'No student matches',
  'Xem tất cả {n} HV': (b) => `See all ${b.n} students`,
  'Chưa xử lý xong': 'Still in progress',
  'Em còn bước chưa xong (GVCN, QL hoặc TVV). Thứ tự: bắt buộc / quá hạn, mới, chờ QL, chờ TVV. Các em khác xếp theo tên.':
    'Students with a step still open (homeroom, manager or consultant). Order: required / overdue, new, awaiting manager, awaiting consultant. Other students follow by name.',
  'Các em khác': 'Other students',
  'Các em': 'Students',
  '{n} HV · theo tên': (b) => `${b.n} students · by name`,
  'Không có vi phạm chờ': 'Nothing pending',
  'Chưa có vi phạm': 'No incidents',
  'Không tải được lịch sử.': 'Could not load history.',
  'Lọc học viên': 'Filter students',
} satisfies Record<string, Dich>;
