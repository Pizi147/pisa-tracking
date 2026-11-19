/** S4-GD GIAM-BUOC (PTA Tutor 20/11) — nút một mục, xoá lịch Test thẳng, Sau thi một nút, chip Loại PA / Nhóm nguyên nhân, mật khẩu điền sẵn, lý do tại nút. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_S4_GIAM_BUOC = {
  'Bỏ chữ, đổi ngôn ngữ': 'Discard text, change language',
  'Chép': 'Copy',
  'Chép mật khẩu ban đầu': 'Copy initial password',
  'Đã chốt · không chọn được': 'Locked · cannot be selected',
  'Chọn một hướng trước': 'Choose a direction first',
  'Lưu điểm · {chon}': (b) => `Save scores · ${b.chon}`,
  'Nhập đủ điểm L R W S để chọn bước tiếp': 'Enter all L R W S scores to choose the next step',
} satisfies Record<string, Dich>;
