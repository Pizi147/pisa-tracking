/** G1-08 (chủ SP duyệt #1434) — một ngăn "Xuất Excel" khu Test: tab Điểm Test · Lịch Test. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_G108 = {
  'Xuất Excel…': 'Export Excel…',
  'Xuất Excel · Điểm Test': 'Export Excel · Test scores',
  'Điểm Test': 'Test scores',
  'Xuất gì': 'What to export',
  'Gọn + nhận xét': 'Compact + comments',
  'Đầy đủ': 'Full',
  'Cột gọn + nhận xét': 'Short columns + comments',
  'Nhận xét L · R': 'Comments L · R',
  'Nhận xét W · S': 'Comments W · S',
  'Tìm lớp… (trống = mọi lớp)': 'Find class… (empty = all classes)',
  'Thu hẹp: tìm lớp FT…': 'Narrow down: find FT class…',
  'Mọi lớp Fast Track': 'All Fast Track classes',
  'Các lớp Fast Track đang hiện': 'Fast Track classes shown',
  'Ô MT1…MT10 là tuần Test (lịch), không phải điểm.': 'MT1…MT10 cells are test weeks (schedule), not scores.',
  'Mọi lượt: lấy cả lượt còn thiếu điểm — ô thiếu để trống. Chỉ lượt đủ điểm: lượt đã có điểm mọi kỹ năng phải làm.':
    'All attempts: includes attempts still missing scores — missing cells stay empty. Complete attempts only: every required skill has a score.',
  'Gọn: điểm từng kỹ năng + kết quả lượt. Gọn + nhận xét: thêm 2 cột nhận xét (L · R, W · S). Đầy đủ: thêm tiêu chí W, S, tuần từng môn, người nhập, nhận xét từng bài.':
    'Compact: each skill score + attempt result. Compact + comments: adds 2 comment columns (L · R, W · S). Full: adds W, S criteria, week per skill, entered by, comment per test.',
  'Gọn: % từng môn + % tổng. Đầy đủ: thêm điểm, tổng và tuần từng môn, người nhập.':
    'Compact: % per subject + total %. Full: adds score, total and week per subject, entered by.',
} satisfies Record<string, Dich>;
