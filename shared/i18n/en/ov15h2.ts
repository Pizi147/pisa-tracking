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
  'Case trống PA': 'Case without PA',
  'PA chờ xác nhận / duyệt': 'Plan awaiting confirmation / approval',
  'PA đang chạy': 'Plan running',
  'PA xong · chờ đóng': 'Plan done · to close',
} satisfies Record<string, Dich>;
