/** LO-TRINH-THEO-HV (chủ SP 11/11) — đổi lộ trình của em ở Sửa thông tin. Khoá = chữ Việt trên web / câu máy chủ. */
import type { Dich } from '../en.ts';

export const EN_LO_TRINH_HV = {
  'Đã đổi lộ trình {cu} → {moi}': 'Pathway changed {cu} → {moi}',
  'MT đã có điểm giữ nguyên lịch và kỳ vọng': 'MTs with scores keep their schedule and expectation',
  'MT chưa thi xếp lại theo lịch {lt}, không về tuần đã qua': 'MTs not yet taken are rescheduled to the {lt} plan, never into past weeks',
  'Lớp thường đi theo chương trình — đổi bằng Chuyển lớp.': 'Regular classes follow their programme — change it with Transfer class.',
  'Lộ trình đã kết thúc — không đổi lộ trình.': 'This pathway has ended — it cannot be changed.',
  'Lộ trình "Khác" mở ở Bước tiếp › Lộ trình mới.': 'The "Other" pathway is opened from Next step › New pathway.',
  'Chỉ Quản lý, GVCN hoặc TVV của em đổi được lộ trình.': "Only Managers, the student's homeroom teacher or consultant can change the pathway.",
} satisfies Record<string, Dich>;
