/** OV-13q — cột / điều kiện SQL của `trangThaiSauThi`. Tệp LÁ (không import): nạp trước mọi module dựng câu SQL lúc nạp (buocTiep.ts). */
/**
 * OV-13q: ngày CÓ KẾT QUẢ = mốc Hành trình "Kết quả thi thật" ĐẦU TIÊN của lộ trình — sửa kết quả sau đó không dời hạn Bước tiếp.
 * Lọc theo `student_id` trước để đi chỉ mục `idx_journey_student` (journey_events không có chỉ mục cycle_id).
 * shortcut: lưu dở (thiếu kỹ năng) trước rồi mới đủ cũng tính từ lần lưu dở — cần cột riêng nếu chủ SP báo hạn Bước tiếp sớm.
 */
export const ngayCoKq = (c = 'c') => `(SELECT MIN(j.event_date) FROM journey_events j WHERE j.student_id = ${c}.student_id AND j.cycle_id = ${c}.id AND j.event_type = 'cycle_outcome')`;
export const NGAY_CO_KQ = ngayCoKq();
/**
 * Cột `trangThaiSauThi` đọc — `c` = learning_cycles, `ep` = report_periods của tuần thi dự kiến (`LEFT JOIN report_periods ep ON ep.id = c.exam_period_id`).
 * Ngày có kết quả chỉ đọc khi lộ trình có kết quả mà chưa chọn bước tiếp (danh sách cả chi nhánh không tra Hành trình từng em).
 */
export const cotSauThi = (c = 'c', ep = 'ep') => `${c}.thi_that_ngay, ${c}.exam_date, ${c}.exam_month, ${ep}.week_start AS exam_week, ${c}.ended_at, ${c}.thi_that_khong_thi,
  ${c}.thi_that_l, ${c}.thi_that_r, ${c}.thi_that_w, ${c}.thi_that_s, ${c}.outcome, ${c}.outcome_score, ${c}.buoc_tiep, ${c}.han_sau_thi, ${c}.han_sau_thi_so_lan,
  CASE WHEN ${c}.buoc_tiep IS NULL AND (${c}.thi_that_khong_thi = 1 OR ${c}.thi_that_s IS NOT NULL OR ${c}.outcome_score IS NOT NULL OR COALESCE(${c}.outcome, 'unknown') != 'unknown')
       THEN ${ngayCoKq(c)} END AS ngay_kq`;
export const COT_SAU_THI = cotSauThi();
/**
 * Lộ trình MỚI NHẤT của em chưa Lưu trữ — cùng lọc với việc Chọn bước tiếp. Rà #436: em đã Kết thúc học / lộ trình bỏ dở (`abandoned`) mà CHƯA có kết quả
 * thi → không nhắc "chờ kết quả" (em nghỉ, không đi thi); đã có kết quả thì vẫn chờ chọn bước tiếp như OV-8a / OV-13m. Một chỗ cho việc, nhãn, migrate, kiểm trước.
 */
export const LO_TRINH_MOI_NHAT = `c.seq = (SELECT MAX(x.seq) FROM learning_cycles x WHERE x.student_id = c.student_id) AND s.archived_at IS NULL
  AND (c.thi_that_khong_thi = 1 OR (c.thi_that_l IS NOT NULL AND c.thi_that_r IS NOT NULL AND c.thi_that_w IS NOT NULL AND c.thi_that_s IS NOT NULL)
       OR c.outcome_score IS NOT NULL OR COALESCE(c.outcome, 'unknown') != 'unknown' OR (s.status != 'finished' AND c.status != 'abandoned'))`;

