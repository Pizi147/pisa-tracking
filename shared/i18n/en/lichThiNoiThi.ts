/** LICH-THI-NOI-THI (Việc để sau GD-13b, mockup ⑥ K4): nơi thi thật ở tab Lịch thi. */
import type { Dich } from '../en.ts';

export const EN_LICH_THI_NOI_THI = {
  'Nơi thi': 'Test centre',
  'nơi thi {noi}': 'test centre {noi}',
  'bỏ nơi thi': 'removed test centre',
  'Nơi thi tối đa {NOI_THI_TOI_DA} ký tự.': 'Test centre: at most {NOI_THI_TOI_DA} characters.',
  "Lọc theo trạng thái thi: <b>Tất cả</b> · <b>Chưa chốt ngày</b> · <b>Đã chốt</b> · <b>Chờ KQ</b> · <b>Có KQ</b> (cùng <b>Mọi TVV</b>, giữ khi quay lại trang).":
    'Filter by exam status: <b>All</b> · <b>Date not set</b> · <b>Date set</b> · <b>Awaiting result</b> · <b>Has result</b> (with <b>All counsellors</b>, kept when you come back).',
  "Người sửa được: bấm giá trị lịch thi → hộp dưới hàng (<b>Tháng dự kiến</b> / <b>Ngày thi</b> + <b>Nơi thi</b>); em đã thi → panel Sau thi. Lưu xong có <b>Hoàn tác</b> ngay ô.":
    'If you can edit: click the exam value → a box under the row (<b>Expected month</b> / <b>Exam date</b> + <b>Test centre</b>); after the exam → the After-exam panel. After saving, <b>Undo</b> appears right there.',
} satisfies Record<string, Dich>;
