/** BAO-CAO-PH (chủ SP 05–06/11) — Báo cáo gửi phụ huynh: tab hồ sơ lớp, panel viết / đọc, lỗi máy chủ. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_BAO_CAO_PH = {
  'Báo cáo PH': 'Parent report',
  'Nhận xét chung': 'General comment',
  'Đề xuất cải thiện': 'Suggestion',
  'Tháng {m}': 'Month {m}',
  'Tháng {m}/{y}': 'Month {m}/{y}',
  'Điểm không hợp lệ': 'Invalid score',
  'Điểm từ 0 đến {tong}': 'Score from 0 to {tong}',
  'Band từ 0 đến 9, bước 0.5': 'Band from 0 to 9, step 0.5',
  'Không tìm thấy lớp': 'Class not found',
  'Đợt báo cáo không có ở lớp này': 'This report round is not in this class',
  'Chương trình của lớp chưa có mẫu báo cáo PH': 'This programme has no parent report template yet',
  'Phần báo cáo không hợp lệ': 'Invalid report section',
  'Đợt báo cáo chưa mở hoặc không có ở lớp này': 'This report round is not open or not in this class',
  'Bạn không được phân công viết phần này.': 'You are not assigned to write this section.',
  'Học viên không có trong đợt báo cáo này': 'Student is not in this report round',
  'Mức tiêu chí không hợp lệ': 'Invalid criterion level',
  'Phần này không có ô điểm': 'This section has no score',
  'Chưa có điểm bài để sửa': 'No test score to edit yet',
} satisfies Record<string, Dich>;
