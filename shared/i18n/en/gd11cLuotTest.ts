/** GD-11c (overhaul V6, trang lượt Test — mockup ⑦ C1–C3). */
import type { Dich } from '../en.ts';

export const EN_GD11C_LUOT_TEST = {
  'Chưa có kết quả nào bị huỷ': 'No result has been cancelled',
  'Vắng, Huỷ điểm, Khôi phục một kỹ năng': 'Absent, Cancel score, Restore for one skill',
  'Trang lượt: <b>⋯</b> cuối dòng kỹ năng › <b>Vắng</b> · <b>Huỷ điểm</b> (Hoàn tác 10 giây) · <b>Khôi phục</b>.': 'Attempt page: <b>⋯</b> at the end of the skill row › <b>Absent</b> · <b>Cancel score</b> (Undo for 10 seconds) · <b>Restore</b>.',
  'Mọi thay đổi của lượt: khối <b>Lịch sử · n</b> cuối trang, mỗi dòng ghi kỹ năng.': 'Every change to the attempt: the <b>History · n</b> block at the bottom of the page, each line names the skill.',
  'Chỉnh lịch cả đợt': 'Adjust the whole schedule for the whole round',
  'Trang lượt MT: <b>Chỉnh lịch ▾</b> › <b>Dời lịch cả đợt</b> · <b>Dời hạn chấm cả đợt</b> · <b>Khôi phục kết quả</b> · <b>Xoá MTn</b>; mục mờ ghi lý do ngay dưới.': 'MT attempt page: <b>Adjust schedule ▾</b> › <b>Move the whole round</b> · <b>Move the marking deadline for the whole round</b> · <b>Restore result</b> · <b>Delete MTn</b>; a greyed item shows its reason right below.',
  '<b>Lớp lúc Test</b> là link hồ sơ lớp; <b>Lịch sử chi tiết</b> trong khối <b>Lịch sử · n</b> có Khôi phục.': '<b>Class at Test</b> links to the class profile; <b>Detailed history</b> in the <b>History · n</b> block can Restore.',
  'Mở từ ô điểm ở hồ sơ em; mọi thay đổi ở khối <b>Lịch sử · n</b> cuối trang.': 'Open it from a score cell on the student profile; every change is in the <b>History · n</b> block at the bottom of the page.',
} satisfies Record<string, Dich>;
