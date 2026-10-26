/** OV-12f — Học viên & Lớp ba góc nhìn, Đang SOS theo tuần, Cần làm, Panel một em, chữ mới ở Ghi kết quả PA. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_F = {
  /* Thanh góc nhìn · lọc phụ · tuần thi */
  'Lọc phụ': 'More filters',
  'Tuần Test': 'Test week',
  'Toàn bộ': 'All weeks',
  'Toàn bộ 8 tuần': 'All 8 weeks',
  'một tuần Test': 'one test week',
  '{n} lượt SOS': (b) => so(b.n, 'SOS attempt', 'SOS attempts'),
  'Không có học viên SOS ở tuần Test này': 'No students in SOS this test week',
  'Không có học viên SOS trong 8 tuần': 'No students in SOS in the last 8 weeks',
  'Chọn tuần khác hoặc Toàn bộ.': 'Pick another week or All weeks.',
  'Không có việc nào khớp lọc': 'No tasks match the filter',

  /* Bảng Đang SOS */
  'MT · tuần': 'MT · week',
  'SOS · môn': 'SOS · subject',
  'Kết quả đến nay': 'Result so far',
  'chưa xác nhận': 'not confirmed',
  '{n} em SOS': (b) => `${so(b.n, 'student', 'students')} in SOS`,
  '{n} em · {m} lượt SOS': (b) => `${so(b.n, 'student', 'students')} · ${so(b.m, 'SOS attempt', 'SOS attempts')}`,
  'Mở {ten}': 'Open {ten}',
  'lớp {ma}': 'class {ma}',

  /* Cần làm */
  'Người giữ': 'Owner',
  'Không gắn lớp': 'No class',
  'Cả lớp · {n} em': (b) => `Whole class · ${so(b.n, 'student', 'students')}`,
  'Cần làm theo lớp': 'To do by class',
  'Yêu cầu chờ Quản lý': 'Request awaiting manager',
  'Kết quả thi': 'Exam result',
  'Thi {ngay} · chưa có kết quả': 'Exam {ngay} · no result yet',
  'chưa có kết quả': 'no result yet',

  /* Panel một em */
  'Hồ sơ': 'Profile',
  'Gọi': 'Call',
  'Em chưa có Case nào.': 'This student has no Case.',
  'chờ xác nhận': 'awaiting confirmation',
  'đã khép': 'closed',
  'Xem thêm ›': 'More ›',
  'Ghi kết quả': 'Record result',

  /* Ghi kết quả PA (chủ SP 14/10 tối) */
  'Tiến triển (2 tuần)': 'Progress (2 weeks)',
  'Nhận xét buổi {n}': 'Session {n} comment',
  'Ghi rõ hơn — ít nhất 8 ký tự': 'Add more detail — at least 8 characters',
  'Sửa PA này': 'Edit this PA',
  'Cách điều chỉnh': 'How to adjust',
} satisfies Record<string, Dich>;
