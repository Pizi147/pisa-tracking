/** OV-15b — lưới điểm, dán từ Excel, panel Nhập điểm lớp. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15B = {
  'Nhập điểm · {lop}': 'Enter scores · {lop}',
  /* Dán từ Excel — xem trước (shared/domain/danExcel.ts) */
  'Tên': 'Name',
  'Nhận xét {k}': 'Comment {k}',
  'Lượt này không thi kỹ năng này': 'This skill is not part of this test',
  'Phần thi đã huỷ / đã xác nhận vắng': 'This part is cancelled / confirmed absent',
  'Ô đã có điểm — "-" không xoá được điểm': 'This cell has a score — "-" cannot remove it',
  'Số câu: {x}': 'Correct answers: {x}',
  'Bốn tiêu chí, mỗi tiêu chí 0–9 bậc 0.5 (ví dụ 5.5 6 6 5.5)': 'Four criteria, each 0–9 in steps of 0.5 (e.g. 5.5 6 6 5.5)',
  /* Máy chủ — POST /attempts/scores/lo */
  'Không có dòng nào để lưu.': 'No rows to save.',
  'Mỗi lần lưu tối đa {n} dòng.': 'At most {n} rows per save.',
  'Lượt Test không hợp lệ.': 'Invalid test attempt.',
  'Ô điểm của dòng không hợp lệ.': 'Invalid score cells in this row.',
  'Lỗi máy chủ — dòng này chưa lưu.': 'Server error — this row was not saved.',
} satisfies Record<string, Dich>;
