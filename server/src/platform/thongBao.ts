import { db } from '../db.ts';

/**
 * THÔNG BÁO CỦA MỘT NGƯỜI (R8, PR-Qb) — thêm `student_id`/`attempt_id` bằng LEFT JOIN đúng bảng của
 * từng `entity_type`, để `duongThongBao` (`shared/domain/duongHoSo.ts`) dựng đúng đường dẫn mà không
 * phải đoán theo chữ. Không đổi schema, không đổi cột cũ (`entity_type`, `entity_id`, `read_at`,
 * `title`, `body`) — Header vẫn đọc y hệt.
 *
 * `skill_move_requests` không tự có `student_id`: phải đi qua `assessment_attempts` của chính lượt
 * mà yêu cầu dời lịch đó thuộc về.
 */
export function thongBaoCua(userId: number) {
  return db()
    .prepare(
      `SELECT n.*,
              COALESCE(sc.student_id, cs.student_id, aa.student_id, aa2.student_id, dm.student_id) AS student_id,
              CASE WHEN n.entity_type = 'assessment_attempt' THEN n.entity_id ELSE smr.attempt_id END AS attempt_id
         FROM notifications n
         LEFT JOIN sos_cases sc ON n.entity_type = 'sos_case' AND sc.id = n.entity_id
         LEFT JOIN case_signals cs ON n.entity_type = 'case_signal' AND cs.id = n.entity_id
         LEFT JOIN assessment_attempts aa ON n.entity_type = 'assessment_attempt' AND aa.id = n.entity_id
         LEFT JOIN skill_move_requests smr ON n.entity_type = 'skill_move_requests' AND smr.id = n.entity_id
         LEFT JOIN assessment_attempts aa2 ON aa2.id = smr.attempt_id
         LEFT JOIN discipline_measures dm ON n.entity_type = 'discipline_measure' AND dm.id = n.entity_id
        WHERE n.user_id = ?
        ORDER BY n.id DESC LIMIT 30`,
    )
    .all(userId) as any[];
}
