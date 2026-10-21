/**
 * SV-YT-TVV: CHỈ THÊM hai bảng `viec_bao_ph` + `viec_bao_ph_lan` (chép y câu ở `schema.sql`). Không sinh việc cho lần xử lý đã lưu trước khi bật
 * (luật 1: chỉ lần lưu từ nay). Chạy lặp không làm gì.
 */
const SQL = `
  CREATE TABLE IF NOT EXISTS viec_bao_ph (
    id INTEGER PRIMARY KEY,
    measure_id INTEGER UNIQUE REFERENCES discipline_measures(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    nhan TEXT NOT NULL,
    han TEXT NOT NULL,
    trang_thai TEXT NOT NULL DEFAULT 'mo',
    bo_ly_do TEXT, bo_ly_do_chu TEXT, bo_boi INTEGER REFERENCES users(id), bo_luc TEXT,
    tao_luc TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_viec_bao_ph_hv ON viec_bao_ph(student_id, trang_thai);
  CREATE TABLE IF NOT EXISTS viec_bao_ph_lan (
    id INTEGER PRIMARY KEY,
    viec_id INTEGER NOT NULL REFERENCES viec_bao_ph(id),
    ket_qua TEXT NOT NULL,
    ngay TEXT NOT NULL,
    ghi_chu TEXT,
    ghi_boi INTEGER REFERENCES users(id),
    ghi_luc TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_viec_bao_ph_lan ON viec_bao_ph_lan(viec_id);`;

export function migratePrSvYtTvv(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'viec_bao_ph_lan'").get()) return;
  conn.exec(SQL);
  applied.push('Ý thức: việc Báo PH của TVV sau mỗi lần lưu xử lý (SV-YT-TVV)');
}
