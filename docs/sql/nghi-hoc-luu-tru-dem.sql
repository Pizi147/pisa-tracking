-- NGHI-HOC-LUU-TRU (chủ SP 05/11) — CHỈ ĐỌC. Đếm / liệt kê em đã Kết thúc học mà chưa Lưu trữ: đúng tập migrate `prNghiHocLuuTru` sẽ đưa vào Lưu trữ
-- (archived_at = finished_at). Chạy trước deploy để biết số em bị đổi.

-- 1) Số em bị đổi
SELECT COUNT(*) AS so_em FROM students WHERE status = 'finished' AND archived_at IS NULL;

-- 2) Danh sách (id, mã, tên, ngày kết thúc, lớp cuối, có lộ trình FT chưa có KQ thi thật)
SELECT s.id, s.student_code, s.full_name, s.finished_at,
       (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id ORDER BY e.id DESC LIMIT 1) AS lop_cuoi,
       EXISTS (SELECT 1 FROM learning_cycles cy WHERE cy.student_id = s.id AND cy.route IS NOT NULL AND cy.outcome_score IS NULL AND cy.thi_that_khong_thi = 0) AS ft_chua_kq
  FROM students s
 WHERE s.status = 'finished' AND s.archived_at IS NULL
 ORDER BY s.id;
