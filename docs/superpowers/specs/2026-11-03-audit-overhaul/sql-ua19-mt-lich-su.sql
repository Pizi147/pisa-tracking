-- UA-19 (chủ SP 03/11) — CHỈ ĐỌC. Đếm em có "kết quả hiện tại" ĐỔI sau PR: lượt mới nhất có điểm (lộ trình mới nhất, số MT lớn nhất)
-- là MT lịch sử có tuần thi NGOÀI 4 tuần trước ngày tạo (trước PR bị bỏ qua → "chưa có lượt Test có điểm" hoặc rơi về lượt cũ hơn).
-- Chạy trên bản sao / Turso shell; không ghi gì.
WITH co_diem AS (
  SELECT a.id, a.student_id, a.cycle_id, a.attempt_no, a.lich_su, a.created_at, pr.week_end
    FROM assessment_attempts a
    LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
   WHERE a.status != 'cancelled' AND a.kind = 'mock'
     AND EXISTS (SELECT 1 FROM assessment_scores x WHERE x.attempt_id = a.id AND (x.band IS NOT NULL OR x.raw_score IS NOT NULL))
),
moi_nhat AS (
  SELECT c.*, ROW_NUMBER() OVER (PARTITION BY c.student_id ORDER BY c.cycle_id DESC, c.attempt_no DESC, c.id DESC) AS rn
    FROM co_diem c
)
SELECT COUNT(*) AS so_em_doi,
       SUM(CASE WHEN NOT EXISTS (SELECT 1 FROM co_diem k WHERE k.student_id = m.student_id AND k.id != m.id) THEN 1 ELSE 0 END) AS so_em_truoc_ghi_chua_co_luot
  FROM moi_nhat m
  JOIN students s ON s.id = m.student_id AND s.archived_at IS NULL
 WHERE m.rn = 1 AND m.lich_su = 1
   AND (m.week_end IS NULL OR m.week_end < date(m.created_at, '-28 days'));
