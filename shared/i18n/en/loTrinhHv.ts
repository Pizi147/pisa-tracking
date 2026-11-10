/** LO-TRINH-THEO-HV (chủ SP 11/11) — đổi lộ trình của em ở Sửa thông tin. Khoá = chữ Việt trên web / câu máy chủ. */
import type { Dich } from '../en.ts';

export const EN_LO_TRINH_HV = {
  'Đã đổi lộ trình {cu} → {moi}': 'Pathway changed {cu} → {moi}',
  'MT đã có điểm giữ nguyên lịch và kỳ vọng': 'MTs with scores keep their schedule and expectation',
  'MT chưa thi xếp lại theo lịch {lt}, không về tuần đã qua': 'MTs not yet taken are rescheduled to the {lt} plan, never into past weeks',
  'Lớp thường đi theo chương trình — đổi bằng Chuyển lớp.': 'Regular classes follow their programme — change it with Transfer class.',
  'Lộ trình đã kết thúc — không đổi lộ trình.': 'This pathway has ended — it cannot be changed.',
  'Lộ trình "Khác" mở ở Bước tiếp › Lộ trình mới.': 'The "Other" pathway is opened from Next step › New pathway.',
  'Chỉ Quản lý, Admin, GVCN hoặc TVV của em đổi được lộ trình.': "Only Managers, Admins, the student's homeroom teacher or consultant can change the pathway.",
  /* #9 lộ trình theo HV tới cùng (bản rà 11/11). */
  'Lịch MT': 'MT schedule',
  'Bước tiếp…': 'Next step…',
  'Target do Quản lý sửa. Quản lý duyệt trong 5 ngày; kết quả báo ở chuông và Yêu cầu của tôi.': 'Managers change the target. They reply within 5 days; you are told in notifications and My requests.',
  'Lộ trình của em — mặc định theo lớp; đổi riêng từng em. Lịch MT tạo theo lộ trình em.': "The student's pathway — defaults to the class; change it per student. MTs are scheduled by the student's pathway.",
  'Lịch MT sửa ở mục Lịch MT. Đổi Target ở đâu cũng bắt ghi lý do.': 'Edit the MT schedule under MT schedule. Changing the Target anywhere needs a reason.',
  'Đề xuất sửa Target / thông tin khác…': 'Request a target / other change…',
} satisfies Record<string, Dich>;
