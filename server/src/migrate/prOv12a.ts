/**
 * PR-OV12a (chủ SP 14/10): HẠN GHI KẾT QUẢ PA hai tuần một lần, hết Thứ Ba, theo lịch kỳ từ ngày bắt đầu PA (`hanKyGhiKetQua`).
 * PA đang chạy (planned / started, có `action_due`) → hạn kỳ đầu tiên của lịch PA mà ≥ hạn cũ (không bao giờ sớm hơn). Hạn đã nằm trên lịch → không đổi:
 * chạy lại không đổi gì. Turso: đọc một câu; ghi theo lô một câu `CASE` (3 tham số mỗi PA, ≤ 900 tham số / câu), không tham số đặt tên.
 */
import { hanKyGhiKetQua } from '../../../shared/domain/index.ts';
import { theoLo } from '../db.ts';

const lui1 = (iso: string) => new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** PA sẽ đổi hạn: [id, hạn cũ, hạn mới] — một nguồn cho migrate và phép kiểm. */
export function paDoiHanOv12a(conn: any): [number, string, string][] {
  const ds = conn.prepare(
    `SELECT id, action_due, COALESCE(started_date, cycle_started_on) AS bat_dau FROM case_interventions
      WHERE status IN ('planned', 'started') AND action_due IS NOT NULL AND COALESCE(started_date, cycle_started_on) IS NOT NULL`,
  ).all() as any[];
  const doi: [number, string, string][] = [];
  for (const r of ds) {
    const cu = String(r.action_due).slice(0, 10);
    const moi = hanKyGhiKetQua(String(r.bat_dau), lui1(cu));   // kỳ đầu tiên > cũ − 1 ngày = ≥ hạn cũ
    if (moi !== cu) doi.push([r.id, cu, moi]);
  }
  return doi;
}

export function migratePrOv12a(conn: any, applied: string[]) {
  if (!(conn.prepare('SELECT name FROM pragma_table_info(?)').all('case_interventions') as any[]).length) return;
  const doi = paDoiHanOv12a(conn);
  const now = new Date().toISOString();
  theoLo(doi, (lo, ph) => {
    conn.prepare(`UPDATE case_interventions SET action_due = CASE id ${lo.map(() => 'WHEN ? THEN ?').join(' ')} END, updated_at = ? WHERE id IN (${ph})`)
      .run(...lo.flatMap(([id, , moi]) => [id, moi]), now, ...lo.map(([id]) => id));
  }, 290);
  if (doi.length) applied.push(`PR-OV12a: ${doi.length} PA đang chạy đổi hạn ghi kết quả sang lịch kỳ hai tuần (hết Thứ Ba, không sớm hơn hạn cũ).`);
}
