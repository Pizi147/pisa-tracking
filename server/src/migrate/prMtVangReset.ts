/**
 * PR-MT-VANG-RESET (N38 L5, chủ SP 05/11 "Đưa về 0, merge") — ĐỔI DỮ LIỆU MỘT LẦN: kỹ năng Mock đang "đã xếp" có lần vắng > 0 mà SAU lần chốt "-" gần
 * nhất đã có NGƯỜI chọn tuần (dời tay trước N38 không đặt lại số đếm) → lần vắng về 0, như L5 ("chọn tuần = xếp lại từ đầu"); "-" kế tiếp lại là lần 1.
 * Đúng tập của câu SQL chỉ đọc trong #928 (dời tay `skill_week_set` hoặc Quản lý xếp bài vắng `skill_week_moved_absence` có người ghi).
 * Mỗi kỹ năng một dòng nhật ký lịch; lượt tính lại kết quả (về SOS tạm, Case đã có giữ). Khoá `demo_config` → chạy lặp không làm gì, và không
 * bao giờ đụng dữ liệu sinh sau deploy (dữ liệu mới đã theo L5). DB mới (init / seed) ghi khoá sẵn (`duLieuNen`) — migrate không đổi dòng nào.
 */
import { nowIso } from '../util.ts';
import { logSchedule } from '../fasttrack/skillSchedule.ts';
import { refreshOutcome } from '../fasttrack/attempts.ts';
import type { Principal } from '../permissions.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';

export const KHOA_PR_MT_VANG_RESET = 'pr_mt_vang_reset_da_chay';

/** Kỹ năng cần đặt lại (chỉ đọc) — giữ khớp câu SQL của mô tả #928. */
export function kyNangDatLaiVang(conn: any): Array<{ id: number; attempt_id: number; skill: string; absence_move_count: number }> {
  return conn.prepare(
    `WITH chot AS (
       SELECT attempt_id, field AS skill, MAX(id) AS chot_id FROM attempt_schedule_history WHERE action = 'skill_no_show_settled' GROUP BY attempt_id, field)
     SELECT k.id, k.attempt_id, k.skill, k.absence_move_count
       FROM attempt_skills k
       JOIN assessment_attempts a ON a.id = k.attempt_id AND a.kind = 'mock' AND a.status != 'cancelled'
       JOIN students s ON s.id = a.student_id AND ${HV_DANG_HOC_SQL('s')}
       JOIN chot c ON c.attempt_id = k.attempt_id AND c.skill = k.skill
      WHERE k.required = 1 AND k.sit_status = 'scheduled' AND k.absence_move_count > 0
        AND EXISTS (SELECT 1 FROM attempt_schedule_history h WHERE h.attempt_id = k.attempt_id AND h.field = k.skill AND h.id > c.chot_id
                      AND h.actor_user_id IS NOT NULL AND h.action IN ('skill_week_set', 'skill_week_moved_absence'))
      ORDER BY k.attempt_id, k.skill`,
  ).all() as any[];
}

/** Đặt lại — không khoá (phép kiểm gọi thẳng). Trả số kỹ năng đã đổi; lần hai không còn hàng nào khớp. */
export function datLaiVangSauDoiTay(conn: any): number {
  const ds = kyNangDatLaiVang(conn);
  for (const k of ds) {
    conn.prepare('UPDATE attempt_skills SET absence_move_count = 0, updated_at = ? WHERE id = ? AND absence_move_count > 0').run(nowIso(), k.id);
    logSchedule(k.attempt_id, {
      action: 'skill_absence_reset', field: k.skill, oldValue: k.absence_move_count, newValue: 0,
      reason: 'N38: đã chọn tuần sau lần vắng — lần vắng về 0', actor: null,
    });
  }
  /* Tính lại kết quả lượt bằng tên Quản trị hệ thống (Case / tín hiệu ghi người làm); không có thì để lần ghi sau tự tính. */
  const qt = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE r.key = 'system_admin' AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`).get() as any)?.id;
  if (qt) for (const id of new Set(ds.map((k) => k.attempt_id))) refreshOutcome({ userId: qt } as Principal, id);
  return ds.length;
}

export function migratePrMtVangReset(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_MT_VANG_RESET)) return;
  const n = datLaiVangSauDoiTay(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_MT_VANG_RESET, nowIso(), nowIso());
  if (n) applied.push(`PR-MT-VANG-RESET (N38 L5): ${n} kỹ năng Mock đã dời tay sau lần vắng — lần vắng về 0.`);
}
