/** GD-11b (overhaul V6, Kế hoạch Test — mockup ⑦ B1–B7). */
import type { Dich } from '../en.ts';

export const EN_GD11B_KE_HOACH = {
  'Xếp MT{n} trước': 'Schedule MT{n} first',
  '{n} HV khác': '{n} more students',
  'Xếp nhiều MT': 'Schedule many MTs',
  'Xếp lịch MT nhiều lớp, Chưa đủ MT': 'Multi-class MT scheduling, Missing MTs',
  'Tìm tên hoặc mã': 'Search name or code',
  'Xoá lịch': 'Delete schedule',
  'Đã xoá lịch {dot} · {ten}': 'Deleted {dot} schedule · {ten}',
  'Hoàn tác xoá lịch': 'Undo schedule delete',
  'Chưa xoá được — {loi} Lịch giữ nguyên.': 'Not deleted — {loi} The schedule is unchanged.',
  'Xoá lịch {dot} của {ten}?': 'Delete the {dot} schedule for {ten}?',
  'Xoá lịch, ghi chú': "Delete schedule, notes",
  'Lớp thường: <b>Xoá lịch</b> ở đầu hộp → đợt về <b>Chưa xếp</b> (đã có điểm / đã làm bài: nút mờ). FT: <b>Xoá MTn</b>.': "Normal class: <b>Delete schedule</b> at the top of the box → the round goes back to <b>Not scheduled</b> (has a score / already sat: greyed button). FT: <b>Delete MTn</b>.",
  'Một kỹ năng: bấm ô MT, mỗi môn <b>Dời</b> · <b>Vắng</b> · <b>Xoá</b>, rồi <b>Lưu</b>.': "One skill: click the MT cell, each subject <b>Move</b> · <b>Absent</b> · <b>Delete</b>, then <b>Save</b>.",
  '<b>⋯</b> môn: <b>Dời hạn chấm</b> · <b>Huỷ điểm</b>; khối <b>Lịch sử · n</b> trong hộp; tên lượt ở đầu hộp mở hồ sơ MT.': "<b>⋯</b> of a subject: <b>Move marking deadline</b> · <b>Cancel score</b>; the <b>History · n</b> block in the box; the attempt name at the top opens the MT profile.",
  '<b>⋯</b> môn: <b>Dời hạn chấm</b> · <b>Huỷ điểm</b>; mọi thay đổi ở khối <b>Lịch sử · n</b> trong hộp; mục ghi "Chỉ Quản lý" thì nhờ QL.': "<b>⋯</b> of a subject: <b>Move marking deadline</b> · <b>Cancel score</b>; every change is in the <b>History · n</b> block of the box; an item marked \"Manager only\" needs a manager.",
  'Xoá lịch một đợt': "Delete one round’s schedule",
  'Lớp thường: bấm ô, <b>Xoá lịch</b> ở đầu hộp → đợt về <b>Chưa xếp</b>, lịch sử giữ; có <b>Hoàn tác</b>.': "Normal class: click the cell, <b>Delete schedule</b> at the top of the box → the round goes back to <b>Not scheduled</b>, history kept; <b>Undo</b> available.",
  'Đã có điểm / đã làm bài: nút mờ.': "Has a score / already sat: greyed button.",
  'Bấm ô MT: mỗi môn có <b>Dời</b> · <b>Vắng</b> · <b>Xoá</b>, rồi <b>Lưu</b>; nút mờ nói lý do ngay tại nút.': 'Click the MT cell: each subject has <b>Move</b> · <b>Absent</b> · <b>Delete</b>, then <b>Save</b>; a greyed button shows its reason right at the button.',
  '<b>Dời</b> = chọn tuần = xếp lại từ đầu — cả môn vắng, huỷ vắng 2 lần, đã xoá.': '<b>Move</b> = pick a week = schedule again from scratch — also for absent, cancelled after 2 absences, deleted subjects.',
  '<b>⋯</b>: <b>Dời hạn chấm</b> · <b>Huỷ điểm</b>; lịch sử ở khối <b>Lịch sử · n</b> trong hộp.': '<b>⋯</b>: <b>Move marking deadline</b> · <b>Cancel score</b>; history is in the <b>History · n</b> block of the box.',
} satisfies Record<string, Dich>;
