/**
 * BAC-Y-THUC (N36, chủ SP 05/11) — CHỈ THÊM hai cột cờ "Reset bậc vi phạm" (mặc định 0 = giữ bậc, chuỗi đếm thang nối tiếp):
 *   · `lenh_chuyen_lop.reset_bac` — Quản lý tích lúc ra / sửa quyết định chuyển lớp (lệnh có thể thi hành nhiều tuần sau);
 *   · `learning_cycles.reset_bac_y_thuc` — lộ trình MỚI nhận cờ của lệnh lúc thi hành; `chuoiThang` gãy chuỗi ở lộ trình có cờ.
 * Dữ liệu cũ giữ 0; chạy lặp không làm gì; khớp `schema.sql`.
 */
const COT: [string, string][] = [['lenh_chuyen_lop', 'reset_bac'], ['learning_cycles', 'reset_bac_y_thuc']];

export function migratePrBacYThuc(conn: any, applied: string[]) {
  const da: string[] = [];
  for (const [bang, ten] of COT) {
    const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).map((c) => c.name as string));
    if (!co.size || co.has(ten)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${ten} INTEGER NOT NULL DEFAULT 0`);
    da.push(`${bang}.${ten}`);
  }
  if (da.length) applied.push(`BAC-Y-THUC (N36): thêm ${da.join(', ')} — cờ Reset bậc vi phạm khi chuyển lộ trình (mặc định giữ bậc).`);
}
