/** V8-PT (mockup `thiet-ke/v8/phan-tich.html`, chủ SP duyệt 29/10): chữ mới của Phân tích.
 *  Mẫu: 'Chữ Việt': 'English' · có số: '{n} lượt': (b) => `${b.n} …` */
import type { Dich } from '../en.ts';

export const EN_V8_PT_BAO_CAO_GV = {
  'HV có ngày thi': 'students with an exam date',
  'lượt của từng HV trong kỳ': "each student's attempt in the period",
  '{n} GV · xếp theo tên': (b) => `${b.n} teachers · sorted by name`,
  'Mỗi số mở danh sách đúng tập (chỉ đọc), cùng nguồn Tổng quan › GV cần chú ý. Không xếp hạng, không màu ngưỡng — xếp theo tên. "—" = chưa có dữ liệu.':
    'Each number opens its exact list (read-only), same source as Overview › Teachers to watch. No ranking, no threshold colours — sorted by name. "—" = no data yet.',
} satisfies Record<string, Dich>;
