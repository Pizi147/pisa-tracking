/** GD-16 (overhaul V6, Lưu trữ — mockup ⑩). */
import type { Dich } from '../en.ts';

export const EN_GD16_LUU_TRU = {
  'Chưa có học viên nào đã xoá': 'No deleted students',
  'Chưa học lớp nào': 'No class yet',
  'chưa có khoá học': 'no course yet',
  'Lớp lúc xoá': 'Class when deleted',
  'em khôi phục được': 'restorable',
  // Hướng dẫn "?" (GD-16)
  'Ba tab: <b>Lớp đã kết thúc</b> · <b>Học viên đã lưu trữ</b> · <b>Đã xoá</b>; chia theo chi nhánh, học viên theo lớp cuối.': 'Three tabs: <b>Finished classes</b> · <b>Archived students</b> · <b>Deleted</b>; split by branch, students by last class.',
  'Tab <b>Lớp đã kết thúc</b> · <b>Học viên đã lưu trữ</b> (theo lớp cuối); chỉ lớp bạn từng dạy.': 'Tabs <b>Finished classes</b> · <b>Archived students</b> (by last class); only classes you taught.',
} satisfies Record<string, Dich>;
