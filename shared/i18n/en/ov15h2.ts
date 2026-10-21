/** OV-15h2 — Học viên & Lớp + xuất + dọn (chọn HV để xuất, chốt lịch thi, Bộ lọc thêm, Dán từ Excel lớp thường). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15H2 = {
  /* LT-SV (thêm vào đây cho khỏi sửa dòng chung `en.ts`): nhãn trạng thái lịch thi thật (`nhanLichThi`), việc Chốt ngày thi. */
  'Thi': 'Exam',
  'Chưa chốt ngày thi': 'Exam date not set',
  'Chưa có tháng thi': 'No exam month',
  'Chốt ngày thi': 'Set exam date',
  /* OV-15i2 (thêm vào đây cho khỏi sửa dòng chung `en.ts`): Lịch thi hỏi trước khi bỏ ngày đã chốt; ô chọn cả danh sách. */
  'Bỏ ngày {ngay}?': (b) => `Remove date ${b.ngay}?`,
  'Bỏ ngày': 'Remove date',
  /* BANG-0: ô điểm tỉ lệ có mẫu số khác tổng của cột. */
  'Đề khác': 'Different paper',
  /* BANG-1: tên bảng lưới điểm FT (trình đọc màn, công cụ đo). */
  'Lưới điểm {dot}': (b) => `Scores ${b.dot}`,
  'Tổng số câu': 'Total questions',
  'Bảng điểm {x}': (b) => `Scores ${b.x}`,
  'Điền ô trống': 'Fill empty cells',
  'Chọn cả danh sách': 'Select the whole list',
  'chốt {ngay}': (b) => `set ${b.ngay}`,
  'Tích hàng ở bảng để chọn': 'Tick rows in the table to select',
  'Đã bỏ chọn {n} HV vì đổi bộ lọc': (b) => `Cleared ${b.n} selected students because the filter changed`,
  'Bộ lọc thêm': 'More filters',
  '<b>Bộ lọc thêm</b> (góc Tất cả): Case / PA · kỹ năng · kết quả · thời gian — trong nhóm là "hoặc", giữa nhóm là "và". Tích ô trước tên em → <b>Xuất các HV đã chọn</b>.':
    '<b>More filters</b> (All view): Case / plan · skill · result · test week — "or" inside a group, "and" across groups. Tick the box before a name → <b>Export selected students</b>.',
  'Mọi lúc': 'Any time',
  'Chọn khoảng': 'Pick a range',
  'Xoá lọc thêm': 'Clear more filters',
  'Chọn tất cả HV đang hiện ở trang này · {n}': (b) => `Select all students shown on this page · ${b.n}`,
  'Xuất các HV đã chọn': 'Export selected students',
  'Có Case mở': 'Has open Case',
  'Không Case': 'No Case',
  'Case trống PA': 'Case without plan',
  'Chờ nhận xét': 'Awaiting comment',
  'PA chờ xác nhận / duyệt': 'Plan awaiting confirmation / approval',
  'PA đang chạy': 'Plan running',
  'PA xong · chờ đóng': 'Plan done · to close',
  'Bạn không được phân công môn này': 'You are not assigned to this subject',
  'Ô đang "-" (đã dời tuần) — gỡ dấu ở lưới trước': 'Cell is "-" (moved to another week) — clear the mark in the grid first',
  'Số câu đúng là số nguyên (vd 24 hoặc 24/40)': 'Correct answers must be a whole number (e.g. 24 or 24/40)',
  'Chưa có tổng câu — dán dạng 24/40': 'No total yet — paste as 24/40',
  'Tổng câu phải lớn hơn 0': 'Total must be greater than 0',
  'Đợt đã hoàn tất — chỉ Quản lý sửa được điểm': 'Round completed — only a Manager can change scores',
  'Điểm = số câu đúng (24 — tổng lấy từ cột) hoặc 24/40; "-" = em không làm bài (môn dời sang tuần sau). Ô trống được bỏ qua, không thành 0.':
    'Score = correct answers (24 — total taken from the column) or 24/40; "-" = did not sit (subject moves to next week). Empty cells are skipped, never 0.',
  'Bài này không có môn này': 'This test has no such subject',
  'Lớp thường: cột theo môn của lớp; điểm = số câu đúng (tổng lấy từ cột) hoặc <b>24/40</b>; <b>-</b> = em không làm bài (môn dời sang tuần sau).':
    'Normal classes: one column per subject of the class; score = correct answers (total taken from the column) or <b>24/40</b>; <b>-</b> = did not sit (subject moves to next week).',
  'Số câu đúng ({a}) lớn hơn tổng ({b})': (b) => `Correct answers (${b.a}) exceed the total (${b.b})`,
} satisfies Record<string, Dich>;
