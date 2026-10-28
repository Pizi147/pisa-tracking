/**
 * BỘ CHỮ TRÌNH BÀY DÙNG CHUNG (PR-H, thiet-ke/TU_DIEN_VA_CHU.md).
 *
 * Nhãn NGHIỆP VỤ (tên trạng thái, phạm vi, hạn…) nằm ở `shared/domain/*` để máy chủ và test cùng đọc. File này chỉ giữ
 * những câu THUẦN TRÌNH BÀY dùng ở nhiều màn — để một khái niệm chỉ có MỘT câu, không mỗi màn tự viết một kiểu.
 * Thêm câu vào đây khi nó xuất hiện ở từ hai nơi; câu chỉ dùng một chỗ thì để tại chỗ.
 */
import { t } from '@shared/i18n/index.ts';

/** Tooltip của "Tuần dự kiến hoàn tất" — MỘT câu cho hồ sơ Test và bảng điểm Normal (TU_DIEN_VA_CHU §3). */
export const TOOLTIP_TUAN_HOAN_TAT = t('Tuần dự kiến hoàn tất là tuần kiểm tra muộn nhất của các kỹ năng trong đợt.');

export const MOC_KIEM_TRA_NORMAL = 'Các mốc kiểm tra được tính từ tuần khai giảng.';

/** Trạng thái rỗng của khối phương án hỗ trợ (TU_DIEN_VA_CHU §2): nói THIẾU gì và ai điền được. */
export const CHUA_CO_PHUONG_AN = 'Chưa có PA';

/* PR-XLMT: "Kỹ năng không kiểm tra trong đợt này" / "Kiểm tra lại…" thay bằng `CHU_THAO_TAC` (T38: Bỏ kỹ năng khỏi đợt · Đưa lại vào đợt). */
