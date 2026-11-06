import { CONG_TAC_CP } from '../../../shared/domain/index.ts';
import { CHI_TIET_CP_TU_SINH } from '../normal/regular.ts';
import { nowIso } from '../util.ts';

/** Lý do huỷ đánh dấu Checkpoint ẩn vì tắt tự sinh — bật lại công tắc chỉ khôi phục đúng các lượt mang dấu này. */
export const LY_DO_TAT_CP = 'Tạm tắt Checkpoint tự sinh (chủ SP 06/11)';
/** Checkpoint TỰ SINH (dòng Hành trình `CHI_TIET_CP_TU_SINH` — bản chính 29/10: cả 15 lượt có) chưa có điểm nào (không điểm, không dấu "-"):
 *  đối tượng ẩn khi tắt. Checkpoint QL xếp tay (kể cả lượt ẩn QL đã mở lại — dòng `restored` (xếp tay) / `reopened` (Khôi phục lượt) có người làm)
 *  không đụng (RA-LOI-0711a: thiếu `reopened` → deploy kế ẩn lại lượt QL vừa Khôi phục). */
const TU_SINH_CHUA_DIEM = `EXISTS (SELECT 1 FROM journey_events j WHERE j.ref_table = 'assessment_attempts' AND j.ref_id = a.id AND j.detail = ?)
  AND NOT EXISTS (SELECT 1 FROM attempt_schedule_history h WHERE h.attempt_id = a.id AND h.action IN ('restored', 'reopened') AND h.actor_user_id IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND (sc.raw_score IS NOT NULL OR sc.no_show_period_id IS NOT NULL))`;

/**
 * TAT-CHECKPOINT (chủ SP 06/11): chạy MỖI lần migrate, theo `CONG_TAC_CP.tuSinh` (chạy lặp không đổi).
 *  · TẮT: Checkpoint TỰ SINH `planned` chưa có điểm → huỷ mềm (status `cancelled`, dấu `LY_DO_TAT_CP`, lịch sử lịch) — mọi nơi đã bỏ lượt huỷ nên
 *    hết lịch, hết việc Nhập điểm / quá hạn. Lượt đã có điểm (dù một môn) giữ nguyên. Không xoá dòng nào.
 *  · BẬT: lượt mang dấu → `planned` lại (Hoàn tác cả lô). QL xếp tay Checkpoint n đã ẩn của một em = mở lại đúng lượt đó (`taoCheckpointTay`).
 */
export function migratePrTatCp(conn: any, applied: string[]) {
  const now = nowIso();
  if (!CONG_TAC_CP.tuSinh) {
    const ids = (conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.kind = 'checkpoint' AND a.status = 'planned' AND ${TU_SINH_CHUA_DIEM}`).all(CHI_TIET_CP_TU_SINH) as any[]).map((r) => r.id as number);
    if (!ids.length) return;
    for (const id of ids) {
      conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancel_reason = ?, cancelled_at = ?, updated_at = ? WHERE id = ?`).run(LY_DO_TAT_CP, now, now, id);
      conn.prepare(`INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?, 'cancelled', NULL, NULL, NULL, ?, NULL, ?)`)
        .run(id, LY_DO_TAT_CP, now);
    }
    applied.push(`TAT-CHECKPOINT: ẩn ${ids.length} Checkpoint tự sinh chưa có điểm (huỷ mềm, bật lại công tắc là hiện lại).`);
    return;
  }
  const ids = (conn.prepare(`SELECT id FROM assessment_attempts WHERE kind = 'checkpoint' AND status = 'cancelled' AND cancel_reason = ?`).all(LY_DO_TAT_CP) as any[]).map((r) => r.id as number);
  if (!ids.length) return;
  for (const id of ids) {
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', cancel_reason = NULL, cancelled_at = NULL, updated_at = ? WHERE id = ?`).run(now, id);
    conn.prepare(`INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?, 'restored', NULL, NULL, NULL, ?, NULL, ?)`)
      .run(id, 'Bật lại Checkpoint tự sinh', now);
  }
  applied.push(`TAT-CHECKPOINT: hiện lại ${ids.length} Checkpoint đã ẩn khi tắt tự sinh.`);
}
