/**
 * P7 SV-LO-TRINH (plan.md 1.6 N11, N12): (1) em Tạm dừng hiện có (`inactive`, chưa lưu trữ) vào Lưu trữ — `archived_at` = ngày `pause` gần nhất
 * (không có → hôm nay; bảng `students` không có cột ngày sửa); (2) cột `learning_cycles.route_ten` (tên lộ trình "Khác"); (3) route `KHAC` vào bảng
 * `routes` ở trạng thái NGỪNG — chỉ là mã của lộ trình, không chọn được khi mở lớp / thêm học viên. Chạy hai lần không đổi thêm.
 */
import { tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { nowIso } from '../util.ts';

const coCot = (conn: any, bang: string, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrSvLoTrinh(conn: any, applied: string[]) {
  tx(() => {
    if (!coCot(conn, 'learning_cycles', 'route_ten')) {
      conn.exec('ALTER TABLE learning_cycles ADD COLUMN route_ten TEXT');
      applied.push('P7: cột learning_cycles.route_ten (tên lộ trình "Khác")');
    }
    if (!conn.prepare(`SELECT 1 FROM routes WHERE code = 'KHAC'`).get()) {
      const seq = (conn.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM routes').get() as any).n;
      conn.prepare(`INSERT INTO routes (code, name, note, seq, status, created_at, lich_mt) VALUES ('KHAC', 'Khác', ?, ?, 'inactive', ?, '[]')`)
        .run('Lộ trình "Khác" (Bước tiếp › Lộ trình mới) — không mở lớp, 0 MT', seq, nowIso());
      applied.push('P7: lộ trình KHAC (Khác) — chỉ mã của lộ trình, không mở lớp');
    }
    const n = conn.prepare(
      `UPDATE students SET archived_at = COALESCE(
          (SELECT MAX(j.event_date) FROM journey_events j WHERE j.student_id = students.id AND j.event_type = 'pause'),
          ?)
        WHERE status = 'inactive' AND archived_at IS NULL`,
    ).run(demoToday()).changes;
    if (n) applied.push(`P7: ${n} học viên Tạm dừng vào Lưu trữ (ngày = lần tạm dừng gần nhất)`);
  });
}
