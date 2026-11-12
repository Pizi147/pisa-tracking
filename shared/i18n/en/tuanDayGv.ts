/** TL-GV (mockup `thiet-ke/v20/ti-le-gv.html`, chủ SP duyệt #1496) — hộp Tuần dạy khi bấm điểm thi thật. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_TUAN_DAY_GV = {
  '+ {n} GV': (b) => `+ ${b.n} teacher${Number(b.n) === 1 ? '' : 's'}`,
  'Chưa có phân công GV {kn}': (b) => `No ${b.kn} teacher assigned`,
  'Chưa tải được tuần dạy. Điểm và bảng không đổi.': 'Could not load teaching weeks. Scores and the table are unchanged.',
  'Phân công {lop}': (b) => `Assign ${b.lop}`,
  'Sửa ở hồ sơ lớp': 'Fix in the class profile',
  'Tuần dạy theo kỹ năng': 'Teaching weeks by skill',
  'Tuần dạy {kn}': (b) => `Teaching weeks ${b.kn}`,
  'W1 · Writing Task 1': 'W1 · Writing Task 1',
  'W2 · Writing Task 2': 'W2 · Writing Task 2',
  'chung {tuan}': (b) => `shared ${b.tuan}`,
  'lấy KQ thi {ngay}': (b) => `result from exam ${b.ngay}`,
  'rồi chuyển sang': 'then moved to',
  'thi thật {ngay}': (b) => `real exam ${b.ngay}`,
  '{n} tuần trống': (b) => `${b.n} unassigned week${b.n === '1' ? '' : 's'}`,
  'Đang tải tuần dạy…': 'Loading teaching weeks…',
  'Đếm theo tuần, từ tuần bắt đầu lộ trình đến tuần thi; tuần GV được phân công kỹ năng này ở lớp em học thì tính cho GV đó. Tuần hai GV cùng dạy: chia đôi (0,5 mỗi người), tổng luôn 100 %. Chỉ tính lớp Fast Track.':
    'Counted by week, from the pathway start week to the exam week; a week counts for a teacher assigned this skill in the student’s class that week. A week two teachers share is split (0.5 each), so the total is always 100 %. Fast Track classes only.',
} satisfies Record<string, Dich>;
