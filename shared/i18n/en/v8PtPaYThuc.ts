/** V8-PT (mockup `thiet-ke/v8/phan-tich.html`, chủ SP duyệt 29/10): chữ mới của Phân tích.
 *  Mẫu: 'Chữ Việt': 'English' · có số: '{n} lượt': (b) => `${b.n} …` */
import type { Dich } from '../en.ts';

const soNhieu = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_V8_PT_PA_Y_THUC = {
  /* Hiệu quả PA */
  'Nên dùng': 'Recommended',
  'Ít dữ liệu': 'Little data',
  'Số PA': 'Plans',
  'Có cải thiện': 'Improved',
  'Cải thiện': 'Improved',
  'Thời gian thường mất': 'Typical time',
  'GV: {ten}': 'Teacher: {ten}',
  'GV thêm {a} · quy chế {b}': 'teacher-added {a} · required {b}',
  'tiến bộ rõ + một phần': 'clear + partial progress',
  'Chưa tính': 'Not counted',
  'PA do GV thêm': 'Teacher-added plans',
  '{n} PA': (b) => soNhieu(b.n, 'plan', 'plans'),
  '{n} có cải thiện': '{n} improved',
  'Vấn đề / loại PA': 'Issue / plan type',
  '{n} vấn đề khác': (b) => soNhieu(b.n, 'other issue', 'other issues'),
  'mỗi vấn đề ≤ 2 PA có kết quả': 'each issue ≤ 2 plans with a result',
  'bắt buộc · không so, không xếp hạng': 'required · not compared, not ranked',
  'Loại bổ trợ': 'Support type',
  'Mức SOS / loại PA': 'SOS level / plan type',
  /* Ý thức */
  '{n} bắt buộc xử lý': '{n} must be handled',
  '{n} chờ QL duyệt': '{n} awaiting manager approval',
  'trên {n} vi phạm': (b) => `of ${soNhieu(b.n, 'incident', 'incidents')}`,
  'Lớp có vi phạm': 'Classes with incidents',
  'Học viên cần chú ý': 'Students needing attention',
  'Lớp nhiều vi phạm': 'Classes with many incidents',
  'xếp theo vi phạm chưa xử lý': 'sorted by unhandled incidents',
  /* V8-PT-2 */
  'trung vị · PA có cải thiện': 'median · improved plans',
  'so kỳ trước': 'vs previous period',
  'Bậc kế': 'Next step',
  'Lần gần nhất': 'Latest',
  'HV có vi phạm': 'Students with incidents',
  '± kỳ trước': '± previous period',
  'Mở theo nhóm': 'Open by group',
  '{n} nhóm': (b) => soNhieu(b.n, 'group', 'groups'),
  '{n} chưa xử lý': (b) => `${b.n} unhandled`,
  'Chưa có lượt MT nào trong kỳ': 'No Mock Test attempts in this period',
} satisfies Record<string, Dich>;
