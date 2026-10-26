/** OV-15b — lưới điểm, dán từ Excel, panel Nhập điểm lớp. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15B = {
  'Nhập điểm · {lop}': 'Enter scores · {lop}',
  /* Tiêu đề cột "Nhận xét L…S" của tệp xuất Test (R1-EN-2 `dichSheetXuat` dịch qua mẫu này) — không chỉ Dán Excel dùng. */
  'Nhận xét {k}': 'Comment {k}',
  /* Lưới điểm (R1-BO-DAN-EXCEL: bỏ Dán từ Excel điểm — khoá còn lại dùng ở Tutor / máy chủ) */
  'Tên': 'Name',
  'Dán từ Excel': 'Paste from Excel',
  '{n} dòng': (b) => `${b.n} row${Number(b.n) === 1 ? '' : 's'}`,
  'có hàng tiêu đề': 'with header row',
  'không hàng tiêu đề': 'no header row',
  'L, R là': 'L, R are',
  'mới': 'new',
  'ghi đè': 'overwrite',
  'trùng tên': 'same name',
  'lỗi': 'error',
  'không có trong lớp': 'not in class',
  'Dán điểm từ Excel': 'Pasted scores from Excel',
  'Lưu {n} dòng': (b) => `Save ${b.n} row${Number(b.n) === 1 ? '' : 's'}`,
  'Chọn lại': 'Choose again',
  'không đổi': 'unchanged',
  'Ghi đè': 'Overwrite',
  'đã chép': 'copied',
  /* Hướng dẫn — màn "Nhập điểm một lớp" (shared/huongDan/gv.ts), admin / qt bước mở lưới */
  'Nhập điểm một lớp': 'Enter scores for a class',
  'Mở panel Nhập điểm': 'Open the Enter scores panel',
  'Học viên & Lớp: <b>⋯</b> ở hàng lớp › <b>Nhập điểm</b>; hoặc nút <b>Nhập điểm</b> ở hồ sơ lớp.': 'Students & Classes: <b>⋯</b> on the class row › <b>Enter scores</b>; or the <b>Enter scores</b> button on the class profile.',
  'Trong panel: chọn lượt (MT1, MT2…) và môn (<b>Tất cả · L · R · W1 · W2 · S</b>); <b>Chỉ ô còn trống</b> để nhập nốt.': 'In the panel: pick the test (MT1, MT2…) and skill (<b>All · L · R · W1 · W2 · S</b>); <b>Empty cells only</b> to finish entering.',
  'Mở lưới điểm (bấm dòng lớp ở Lịch Test, hoặc <b>⋯</b> hàng lớp › <b>Nhập điểm</b>).': 'Open the score grid (click a class row in Schedule / Marking, or <b>⋯</b> on the class row › <b>Enter scores</b>).',
  'Mở lưới điểm của lớp (Test › Lịch Test, hoặc ⋯ hàng lớp › Nhập điểm).': 'Open the class score grid (Tests › Test schedule, or ⋯ on the class row › Enter scores).',
  /* Máy chủ — POST /attempts/scores/lo */
  'Không có dòng nào để lưu.': 'No rows to save.',
  'Mỗi lần lưu tối đa {n} dòng.': 'At most {n} rows per save.',
  'Lượt Test không hợp lệ.': 'Invalid test attempt.',
  'Ô điểm của dòng không hợp lệ.': 'Invalid score cells in this row.',
  'Lỗi máy chủ — dòng này chưa lưu.': 'Server error — this row was not saved.',
  'Lớp không hợp lệ.': 'Invalid class.',
  'Có dòng không thuộc lớp / lượt đang mở — tải lại bảng rồi dán lại.': 'Some rows are not in the open class / test — reload the table and paste again.',
  '‹ Việc': '‹ Task',
  'Hoàn tác dán điểm từ Excel': 'Undid scores pasted from Excel',
} satisfies Record<string, Dich>;
