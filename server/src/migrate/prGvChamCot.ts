/**
 * LG-5(c) (chủ SP 13/11, plan overhaul V6): "GV chấm S" đầu cột lưới FT nhớ ở MÁY CHỦ thay localStorage — người chọn × lớp × đợt
 * (đợt = id tuần hoặc "mt{n}", `dotGvCham`). CHỈ THÊM, chạy lặp không làm gì, khớp `schema.sql`.
 */
export const BANG_GV_CHAM_COT = `
  CREATE TABLE IF NOT EXISTS gv_cham_cot (
    user_id INTEGER NOT NULL REFERENCES users(id),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    dot TEXT NOT NULL,
    examiner_user_id INTEGER REFERENCES users(id),
    examiner_name TEXT,
    cap_nhat TEXT NOT NULL,
    PRIMARY KEY (user_id, class_id, dot)
  );`;

export function migratePrGvChamCot(conn: any, applied: string[]) {
  if (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'gv_cham_cot'`).get()) return;
  conn.exec(BANG_GV_CHAM_COT);
  applied.push('LG-5c: bảng gv_cham_cot ("GV chấm S" đầu cột theo người × lớp × đợt, thay localStorage).');
}
