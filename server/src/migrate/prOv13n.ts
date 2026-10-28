/**
 * OV-13n (chủ SP 16/10): bảng §5.3 bỏ "Trao đổi ngắn với HV" ở SOS 2 / SOS 3. Việc `talk_student` điền sẵn (`preset = 1`) còn `pending` của lượt
 * Mock FT chưa huỷ đang ở SOS 2–3 → `removed · system_bang_doi` + một dòng nhật ký như P03 (`sos_coordination.sync`). Việc `done` và việc GVCN tự
 * thêm (`preset = 0`) giữ nguyên; SOS về 1 thì `syncSosCoordination` hồi lại. Chạy lại: không còn dòng nào khớp → không đổi gì.
 */
import { nowIso } from '../util.ts';
import { resultOf } from '../fasttrack/attempts.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { isFastTrackMock } from '../cases/sosAuto.ts';
import { writeAudit } from '../platform/audit.ts';

type DongOv13n = { id: number; attemptId: number; attemptNo: number; sosLevel: number; chiNhanh: string };

function lapDanhSach(conn: any): DongOv13n[] {
  const rows = conn.prepare(
    `SELECT a.*, x.id AS sca_id, COALESCE(b.code, '—') AS chi_nhanh FROM sos_coordination_actions x
       JOIN assessment_attempts a ON a.id = x.attempt_id AND a.kind = 'mock' AND a.status != 'cancelled'
       LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN branches b ON b.id = c.branch_id
      WHERE x.kind = 'talk_student' AND x.preset = 1 AND x.status = 'pending' ORDER BY x.id`,
  ).all() as any[];
  const ra: DongOv13n[] = [];
  for (const a of rows) {
    if (!isFastTrackMock(a, scoringModeOf(a))) continue;
    const sosLevel = resultOf(a).sosLevel;
    if (sosLevel === 2 || sosLevel === 3) ra.push({ id: a.sca_id, attemptId: a.id, attemptNo: a.attempt_no, sosLevel, chiNhanh: a.chi_nhanh });
  }
  return ra;
}

export function migratePrOv13n(conn: any, applied: string[]) {
  const ds = lapDanhSach(conn);
  const now = nowIso();
  for (const d of ds) {
    conn.prepare(
      `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_bang_doi', removed_by = NULL, removed_at = ?, updated_at = ?
        WHERE id = ? AND status = 'pending'`,
    ).run(now, now, d.id);
    writeAudit({
      actorUserId: null, action: 'sos_coordination.sync', entityType: 'assessment_attempt', entityId: d.attemptId,
      entityLabel: `MT${d.attemptNo} SOS ${d.sosLevel}`, after: { added: 0, revived: 0, removed: 1, ly_do: 'system_bang_doi' },
    });
  }
  if (ds.length) applied.push(`OV-13n: ${ds.length} việc "Trao đổi ngắn với HV" điền sẵn chưa làm của lượt SOS 2–3 → bỏ (luật mới, chủ SP 16/10).`);
}
