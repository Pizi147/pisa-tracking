/** GD-6 (overhaul V6, hồ sơ lớp mockup ②). */
import type { Dich } from '../en.ts';

export const EN_GD6_HO_SO_LOP = {
  'Giáo viên của lớp': 'Class teachers',
  'đạt từ {x} %': 'pass from {x} %',
  // XM-K6: Kết quả PA lớp thường
  'buổi {a} / {b}': 'session {a} / {b}',
  'bạn còn': 'you have',
  'Cả lớp đủ': 'Class complete',
  'Việc {loai} của bạn ở lớp này': 'Your {loai} tasks in this class',
  // Chip việc của lớp "loại · số" (lời 35)
  'Cần xếp lớp tiếp · {n}': 'Need next class · {n}',
  'Chưa chốt lộ trình · {n}': 'Pathway not set · {n}',
  'Chờ chấm · {n}': 'To grade · {n}',
  'Thiếu thông tin · {n}': 'Missing info · {n}',
  'Chờ duyệt · {n}': 'Awaiting approval · {n}',
  'Quá hạn · {n}': 'Overdue · {n}',
  'Quá hạn của lớp · {n}': 'Class overdue · {n}',
  // Hướng dẫn "?" (GD-6)
  'có nút + Task › Case ở đầu trang.': 'has the + Task › Case button at the top of the page.',
  'Bấm <b>+ Case cho …</b> ở khối <b>Case & phương án</b> (hoặc <b>+ Task › Case</b> đầu hồ sơ lớp).': 'Press <b>+ Case for …</b> in the <b>Case & action plan</b> block (or <b>+ Task › Case</b> at the top of the class profile).',
  'Đầu trang: <b>Việc cần làm</b> của bạn ở lớp theo loại (Nhập điểm · Case · Ý thức · Vận hành) — bấm chip mở thẳng việc đầu, <b>Việc tiếp ›</b> đi hết việc cùng loại. Lớp thường ghi tuần 5/8 (tuần đang học / số tuần).': 'Top of page: your <b>To do</b> in this class by type (Enter scores · Case · Conduct · Operations) — press a chip to open the first task, <b>Next task ›</b> goes through tasks of that type. Regular classes show week 5/8 (current week / total weeks).',
  'Bảng em: bấm tên hoặc ô điểm mở phần dưới dòng — Điểm theo lượt (TVV của em ghi nhỏ ở đây) · thẻ kỹ năng (lớp thường: môn) → Điểm · Case · PA.': 'Student table: press a name or score cell to open the panel below the row — Scores by attempt (the student’s consultant is shown small here) · skill cards (regular classes: subjects) → Scores · Case · PA.',
  'Nút + Task › Case đầu hồ sơ lớp': '+ Task › Case button at the top of the class profile',
  'Bấm <b>+ Task › Case</b> đầu trang rồi chọn em, hoặc ở dòng em bấm <b>⋯ › + Case</b>.': 'Press <b>+ Task › Case</b> at the top and pick a student, or press <b>⋯ › + Case</b> on a student row.',
} satisfies Record<string, Dich>;
