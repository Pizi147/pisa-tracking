/*
 * ĐIỂM THEO LƯỢT CHO CẢ LỚP (PR-DL). Cách nhận diện một lượt — DL-0, chủ sản phẩm chốt 04/10:
 * - FT: lượt = `assessment_attempts.attempt_no` (kind 'mock'); MT lịch sử cũng có số lượt; lượt chưa xếp lịch có tuần NULL.
 * - Lớp thường: bài = `kind` ('progress' | 'final'). Mỗi lộ trình có đúng MỘT attempt không huỷ cho mỗi kind
 *   (`normal/regular.ts` tạo bài kiểm `cycle_id + kind`). `attempt_no` đánh số theo lộ trình TỪNG EM (em vào sau Giữa khoá có
 *   Cuối khoá số 1, bạn khác số 2) nên KHÔNG là khoá chung của lớp. Không có "bài thêm"/"lần 2": thi lại = dời tuần trên
 *   cùng attempt.
 * - Lịch riêng của lớp nằm ở `planned_period_id` của attempt và `attempt_skills` — bảng chỉ cần chọn attempt, không đọc
 *   bảng lịch nào khác.
 */
