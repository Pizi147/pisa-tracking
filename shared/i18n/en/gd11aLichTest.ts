/** GD-11a (overhaul V6, Lịch Test tuần — mockup ⑦ A1–A6). */
import type { Dich } from '../en.ts';

export const EN_GD11A_LICH_TEST = {
  'Môn của bạn': 'Your skills',
  'Còn chờ': 'Waiting on',
  'còn chờ: {ds}': 'waiting on: {ds}',
  'chấm chéo {mon}': 'cross-marking {mon}',
  '{n} bài chờ duyệt dời': '{n} awaiting move approval',
  'Không tải được Lịch Test tuần.': 'Could not load the weekly Test schedule.',
  'Dữ liệu đã lưu không mất.': 'Saved data is not lost.',
  'Thao tác khác · Test': 'More actions · Tests',
  'Tuần {maTuan} không có Test.': 'Week {maTuan} has no Tests.',
  'Tuần này không có Test.': 'This week has no Tests.',
  '<b>Quá hạn chấm</b> ở trên, <b>Test tuần này</b> ở dưới — mỗi lớp một dòng: đợt · môn của bạn · hạn chấm · bài chờ duyệt dời.':
    '<b>Overdue grading</b> on top, <b>Tests this week</b> below — one row per class: round · your skills · grading deadline · moves awaiting approval.',
  '<b>Quá hạn chấm</b> ở trên, <b>Test tuần này</b> ở dưới — mỗi lớp một dòng: đợt · môn · hạn chấm · <b>Còn chờ</b> GV (môn); <b>Mở tất cả lớp</b> mở hết lưới.':
    '<b>Overdue</b> on top, <b>Tests this week</b> below — one row per class: round · skills · grading deadline · <b>Waiting on</b> teacher (skills); <b>Expand all classes</b> opens every grid.',
  'Điện thoại: <b>⋯</b> cạnh tên trang › <b>Lịch thi thật ›</b>.': 'Phone: <b>⋯</b> next to the page title › <b>Real exam schedule ›</b>.',
  'Điện thoại: <b>⋯</b> cạnh tên trang › <b>Xuất Excel…</b>.': 'Phone: <b>⋯</b> next to the page title › <b>Export Excel…</b>.',
} satisfies Record<string, Dich>;
