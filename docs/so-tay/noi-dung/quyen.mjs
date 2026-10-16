// Bảng "Ai làm được gì" chung cho sổ QL, TVV & CX, Admin — theo quyền máy chủ (server/src/seed/data.ts + teacherAllows), mỗi sổ chọn cột.
const VAI = ['GVBM', 'GVCN', 'Quản lý', 'TVV', 'CX', 'Admin'];
const HANG = [
  ['Nhập điểm kỹ năng được phân công', '✓', '✓', '✓', '—', '—', 'Nhập bù'],
  ['Sửa / xoá điểm đã có sau khi đợt hoàn tất', '—', 'MT cũ', '✓', '—', '—', '✓'],
  ['Xếp / dời lịch thi', '—', '—', '✓', '—', '—', '✓'],
  ['Dời hạn chấm · huỷ / khôi phục lượt Test', '—', '—', '✓', '—', '—', '—'],
  ['Xác nhận PA · ghi kết quả PA', 'Đúng kỹ năng', 'Đúng kỹ năng', '✓', 'Xem', 'Xem', 'Xem'],
  ['Duyệt / từ chối thẻ Chờ duyệt', '—', '—', '✓', '—', '—', '—'],
  ['Ghi vi phạm', '✓', '✓', '✓', '—', '—', '—'],
  ['Xử lý vi phạm, Phối hợp SOS', '—', '✓', '✓', 'Xem', 'Xem', 'Xem'],
  ['Tạo lớp', '—', '—', '✓', 'Chi nhánh mình', 'Mọi chi nhánh', '—'],
  ['Phân công giáo viên', '—', '—', '✓', '—', '—', '—'],
  ['Thêm học viên (một em / dán Excel)', '—', 'Lớp chủ nhiệm', '✓', '✓', '✓', '—'],
  ['Sửa thông tin học viên (họ tên, ngày sinh, liên hệ…)', '—', '✓', '✓', '✓', '✓', '✓'],
  ['Đổi Target', '—', 'Đề xuất → QL duyệt', '✓', '✓', '✓', '—'],
  ['Tạm dừng / Thôi học', '—', '—', '✓', '✓', '✓', '—'],
  ['Kết quả thi thật', '—', '✓', '✓', '✓', '✓', '—'],
  ['Chọn bước tiếp sau thi', '—', 'Xem', '✓', '✓', 'Xem', '—'],
  ['Chuyển lớp · lưu trữ · lộ trình tiếp theo', '—', '—', '✓', '—', '—', '—'],
  ['Phân tích', '—', '—', '✓', '✓', '✓ (trừ phần GV)', '✓'],
];
/** `cot`: chỉ số vai muốn hiện (0 = GVBM … 5 = Admin). */
export const bangQuyen = (cot) => ({ cot: ['Việc', ...cot.map((i) => VAI[i])], hang: HANG.map((h) => [h[0], ...cot.map((i) => h[i + 1])]) });
