/**
 * PR-OV11e (HV-18, Q8 chủ SP chốt 14/10): KCK CHỤP THEO LƯỢT — cột `assessment_attempts.kck_at_attempt` (như `target_at_attempt`): dấu KCK lúc lượt
 * CHỐT; NULL = chưa chốt (đọc cờ hiện tại của lộ trình — `kckCuaLuot`). Thêm cột rồi điền lượt Mock / MT0 ĐÃ CHỐT bằng cờ HIỆN TẠI của lộ trình,
 * nên mọi màn hiện y như trước migrate; từ đây tích / bỏ KCK chỉ áp cho lượt chốt sau. Chạy lại: cột đã có, lượt đã điền bỏ qua — không đổi gì.
 */
import { resultOf } from '../fasttrack/attempts.ts';

/**
 * Chỉ thêm cột — gọi ĐẦU giao dịch migrate: các bước dọn cũ (prOv1b, prOv1c) tính kết quả lượt (`resultOf` → `kckCuaLuot`) cần cột này có sẵn.
 */
export function themCotPrOv11e(conn: any, applied: string[]) {
  const cot = conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_attempts') as any[];
  if (!cot.length || cot.some((c) => c.name === 'kck_at_attempt')) return;
  conn.exec('ALTER TABLE assessment_attempts ADD COLUMN kck_at_attempt INTEGER');
  applied.push('PR-OV11e: thêm cột assessment_attempts.kck_at_attempt (KCK chụp theo lượt lúc chốt).');
}

/** Điền lượt đã chốt — gọi CUỐI (sau prOv1b / prOv1c: "chốt" theo dữ liệu đã dọn). */
export function migratePrOv11e(conn: any, applied: string[]) {
  themCotPrOv11e(conn, applied);
  if (!(conn.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_attempts') as any[]).length) return;
  const ds = conn.prepare(
    `SELECT a.*, cy.khong_cam_ket AS cy_kck FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id
      WHERE a.kind IN ('mock', 'mt0') AND a.status != 'cancelled' AND a.kck_at_attempt IS NULL`,
  ).all() as any[];
  let n = 0;
  for (const a of ds) {
    if (!resultOf(a).chot) continue;
    conn.prepare('UPDATE assessment_attempts SET kck_at_attempt = ? WHERE id = ?').run(a.cy_kck ? 1 : 0, a.id);
    n += 1;
  }
  if (n) applied.push(`PR-OV11e: ${n} lượt MT đã chốt — chụp dấu KCK hiện tại của lộ trình (kết luận giữ như màn đang hiện).`);
}
