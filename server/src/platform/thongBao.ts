import { db } from '../db.ts';
import { tenMon } from '../../../shared/domain/index.ts';
import { CO_THE_KHONG_THEO_DOI, LA_CASE_SOS } from '../cases/sosState.ts';

/** Chuông trả tối đa bấy nhiêu dòng: MỌI dòng chưa đọc trước, rồi dòng mới nhất (PR-VAI-a Q18). */
export const THONG_BAO_TOI_DA = 50;

/**
 * THÔNG BÁO CỦA MỘT NGƯỜI (R8, PR-Qb) — thêm `student_id`/`attempt_id` bằng LEFT JOIN đúng bảng của
 * từng `entity_type`, để `duongThongBao` (`shared/domain/duongHoSo.ts`) dựng đúng đường dẫn mà không
 * phải đoán theo chữ. Không đổi schema, không đổi cột cũ (`entity_type`, `entity_id`, `read_at`,
 * `title`, `body`) — Header vẫn đọc y hệt.
 *
 * `skill_move_requests` không tự có `student_id`: phải đi qua `assessment_attempts` của chính lượt
 * mà yêu cầu dời lịch đó thuộc về.
 *
 * PR-VAI-a (Q18, Q21): cùng MỘT câu thêm tên em, môn của Case, lớp em đang học và `con_viec` — Case còn chờ nguyên nhân / thẻ còn chờ
 * người duyệt (1) hay đã xong (0) — để chuông xếp Cần làm / Để biết (`nhomThongBao`) và viết dòng "bấm tới đâu" (`noiDenThongBao`).
 * PR-S6F-a: Case chờ nguyên nhân = CÙNG luật `awaitingCauseCaseIds` (Case từ SOS, không có thẻ "Không cần theo dõi" chờ QL); thẻ Báo QL
 * như thẻ chờ duyệt; thẻ bị từ chối còn việc khi chưa có thẻ cùng loại, cùng người, cùng em / lớp gửi SAU nó (đã sửa gửi lại → Để biết).
 */
/** Case của đối tượng một thẻ duyệt — `sos_case` là chính Case, `intervention` là Case của PA; thẻ khác (Ý thức, lịch…) NULL. */
const CASE_CUA_THE = (y: string) => `(CASE ${y}.doi_tuong_loai WHEN 'sos_case' THEN ${y}.doi_tuong_id
  WHEN 'intervention' THEN (SELECT ci.case_id FROM case_interventions ci WHERE ci.id = ${y}.doi_tuong_id) END)`;

export function thongBaoCua(userId: number) {
  const rows = db()
    .prepare(
      `SELECT x.*, s.full_name AS ten_hv,
              (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                WHERE e.student_id = x.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop
         FROM (
           SELECT n.*,
                  COALESCE(sc.student_id, cs.student_id, aa.student_id, aa2.student_id, dm.student_id, ycd.hoc_vien_id,
                           CASE WHEN n.entity_type = 'student' THEN n.entity_id END) AS student_id,
                  CASE WHEN n.entity_type = 'assessment_attempt' THEN n.entity_id ELSE smr.attempt_id END AS attempt_id,
                  COALESCE(sc.category, sc.topic) AS mon_goc, cy.programme_code AS ct, cs.case_id,
                  CASE
                    /* OV-11f (TQ-7): tín hiệu đã vào Case / đã rút → việc xong (Case có chuông riêng). Báo PH qua TVV: còn khi việc phối hợp của lượt chưa làm. */
                    WHEN n.entity_type = 'case_signal' THEN CASE WHEN cs.status = 'pending' THEN 1 ELSE 0 END
                    WHEN n.entity_type = 'assessment_attempt' AND n.kind = 'phoi_hop' THEN
                      CASE WHEN EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = aa.id AND x.kind = 'bao_ph_tvv' AND x.status = 'pending') THEN 1 ELSE 0 END
                    WHEN n.entity_type = 'sos_case' AND n.kind IN ('sos', 'sos_new') THEN
                      CASE WHEN sc.status != 'done' AND ${LA_CASE_SOS('sc')} AND NOT ${CO_THE_KHONG_THEO_DOI('sc')}
                                AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') THEN 1 ELSE 0 END
                    WHEN n.entity_type = 'yeu_cau_duyet' AND n.kind IN ('duyet_moi', 'duyet_qua_han', 'bao_len') THEN
                      CASE WHEN ycd.trang_thai = 'cho' THEN 1 ELSE 0 END
                    WHEN n.entity_type = 'yeu_cau_duyet' AND n.kind = 'duyet_tu_choi' THEN
                      CASE WHEN ycd.trang_thai = 'tu_choi' AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y2
                             WHERE y2.id > ycd.id AND y2.loai = ycd.loai AND y2.nguoi_xin IS ycd.nguoi_xin
                               AND y2.hoc_vien_id IS ycd.hoc_vien_id AND y2.lop_id IS ycd.lop_id
                               /* PR-Dọn: thẻ gắn Case phải cùng CASE (thẻ cho Case B không xoá việc của thẻ bị từ chối ở Case A); thẻ
                                  không gắn Case (Ý thức…) gửi lại là một đối tượng mới, nên vẫn so theo em như cũ.
                                  ponytail: nối thẻ cũ → thẻ mới bằng cột riêng nếu sau này có luồng gửi lại khác đối tượng. */
                               AND ${CASE_CUA_THE('y2')} IS ${CASE_CUA_THE('ycd')}) THEN 1 ELSE 0 END
                  END AS con_viec
             FROM notifications n
             LEFT JOIN sos_cases sc ON n.entity_type = 'sos_case' AND sc.id = n.entity_id
             LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
             LEFT JOIN case_signals cs ON n.entity_type = 'case_signal' AND cs.id = n.entity_id
             LEFT JOIN assessment_attempts aa ON n.entity_type = 'assessment_attempt' AND aa.id = n.entity_id
             LEFT JOIN skill_move_requests smr ON n.entity_type = 'skill_move_requests' AND smr.id = n.entity_id
             LEFT JOIN assessment_attempts aa2 ON aa2.id = smr.attempt_id
             LEFT JOIN discipline_measures dm ON n.entity_type = 'discipline_measure' AND dm.id = n.entity_id
             LEFT JOIN yeu_cau_duyet ycd ON n.entity_type = 'yeu_cau_duyet' AND ycd.id = n.entity_id
            WHERE n.user_id = ?
         ) x
         LEFT JOIN students s ON s.id = x.student_id
        ORDER BY (x.read_at IS NULL) DESC, x.id DESC LIMIT ${THONG_BAO_TOI_DA}`,
    )
    .all(userId) as any[];
  for (const r of rows) {
    r.mon = r.mon_goc ? tenMon(r.ct ?? null, r.mon_goc) : null;
    delete r.mon_goc; delete r.ct;
  }
  return rows;
}

/** "Đọc hết" (Q18): MỘT câu — chỉ tắt chấm chưa đọc của CHÍNH người gọi, không xoá dòng. Trả số dòng đã đánh dấu. */
export function docHet(userId: number, ngay: string): number {
  return Number(db().prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(ngay, userId).changes ?? 0);
}
