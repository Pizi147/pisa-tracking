/**
 * PR-OV12h (chủ SP 14/10): Kết quả PA Tutor theo buổi — bảng `case_followup_buoi` (khớp `schema.sql`). CHỈ THÊM bảng: Kết quả cũ không có dòng,
 * không điền ngược. An toàn trên Turso đang chạy. Chạy lặp được.
 */
export function migratePrOv12h(conn: any, applied: string[]) {
  if ((conn.prepare('SELECT name FROM sqlite_master WHERE type = ? AND name = ?').all('table', 'case_followup_buoi') as any[]).length) return;
  conn.exec(`CREATE TABLE case_followup_buoi (
    id INTEGER PRIMARY KEY,
    followup_id INTEGER NOT NULL REFERENCES case_followups(id) ON DELETE CASCADE,
    buoi_so INTEGER NOT NULL,
    tutor_ten TEXT NOT NULL,
    nhan_xet TEXT NOT NULL,
    UNIQUE (followup_id, buoi_so)
  )`);
  applied.push('PR-OV12h: bảng case_followup_buoi (Kết quả PA Tutor theo buổi)');
}
