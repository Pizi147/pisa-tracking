/** PR-NHAP (YC-5.2, T8, T9, T78): email học viên + NGÀY thi dự kiến. Chỉ thêm cột, không đổi dữ liệu cũ — chạy lại không làm gì. */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrNhap(conn: any, applied: string[]) {
  if (!coCot(conn, 'students', 'email')) {
    conn.exec('ALTER TABLE students ADD COLUMN email TEXT');
    applied.push('Thêm email học viên (bắt buộc khi thêm mới; học viên cũ để trống)');
  }
  if (!coCot(conn, 'learning_cycles', 'exam_date')) {
    conn.exec('ALTER TABLE learning_cycles ADD COLUMN exam_date TEXT');
    applied.push('Thêm ngày thi dự kiến cụ thể cho lộ trình (tuỳ chọn)');
  }
}
