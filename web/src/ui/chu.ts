/**
 * BỘ CHỮ TRÌNH BÀY DÙNG CHUNG (PR-H, thiet-ke/TU_DIEN_VA_CHU.md).
 *
 * Nhãn NGHIỆP VỤ (tên trạng thái, phạm vi, hạn…) nằm ở `shared/domain/*` để máy chủ và test cùng đọc. File này chỉ giữ
 * những câu THUẦN TRÌNH BÀY dùng ở nhiều màn — để một khái niệm chỉ có MỘT câu, không mỗi màn tự viết một kiểu.
 * Thêm câu vào đây khi nó xuất hiện ở từ hai nơi; câu chỉ dùng một chỗ thì để tại chỗ.
 */

/** Tooltip của "Tuần dự kiến hoàn tất" — MỘT câu cho hồ sơ Test và bảng điểm Normal (TU_DIEN_VA_CHU §3). */
export const TOOLTIP_TUAN_HOAN_TAT = 'Tuần dự kiến hoàn tất là tuần kiểm tra muộn nhất của các kỹ năng trong đợt.';

/** Dòng nói cách tính mốc kiểm tra của lớp — khác nhau theo loại lớp (TU_DIEN_VA_CHU §2). */
export const MOC_KIEM_TRA_FT = 'Lịch Mock Test được xếp riêng cho từng học viên.';
export const MOC_KIEM_TRA_NORMAL = 'Các mốc kiểm tra được tính từ tuần khai giảng.';

/** Trạng thái rỗng của khối phương án hỗ trợ (TU_DIEN_VA_CHU §2): nói THIẾU gì và ai điền được. */
export const CHUA_CO_PHUONG_AN = 'Chưa có phương án hỗ trợ';
export const GOI_Y_THEM_PHUONG_AN = 'Thêm phương án hỗ trợ và người phụ trách.';

/** Việc "Kỹ năng không kiểm tra trong đợt này" và việc ngược lại — thay cho "bỏ khỏi / đưa lại vào phạm vi". */
export const KY_NANG_KHONG_KIEM_TRA = 'Kỹ năng không kiểm tra trong đợt này';
export const KIEM_TRA_LAI_KY_NANG = 'Kiểm tra lại kỹ năng này trong đợt';
