/**
 * TL-1 (N61, chủ SP 20/11 — trả lại vi phạm), chạy lặp không đổi, khớp `schema.sql`:
 *   1. Bảng `vi_pham_tra_lai` (TVV trả một vi phạm / cả lần xử lý về GV) + chỉ mục (một yêu cầu mở mỗi vi phạm / lần xử lý; việc của tôi; giao cho tôi; theo em).
 *   2. `viec_bao_ph.tra_lai_id` — Báo PH đang "Chờ GV sửa" (hạn tạm dừng). NULL = không chờ — dữ liệu cũ giữ nguyên.
 * Chỉ thêm. Mỗi khối TỰ LÀNH: thiếu bảng HOẶC thiếu chỉ mục nào → chạy lại cả khối (`IF NOT EXISTS`). Bảng gốc chưa có (DB rất cũ) → bỏ qua; lần sau làm nốt.
 */
export const BANG_TRA_LAI = `
  CREATE TABLE IF NOT EXISTS vi_pham_tra_lai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    violation_id INTEGER REFERENCES violations(id),
    measure_id INTEGER REFERENCES discipline_measures(id),
    ly_do TEXT NOT NULL,
    nguoi_tra INTEGER NOT NULL REFERENCES users(id),
    tra_luc TEXT NOT NULL,
    han TEXT NOT NULL,
    han_chon TEXT,
    nguoi_nhan INTEGER REFERENCES users(id),
    trang_thai TEXT NOT NULL DEFAULT 'mo',
    ket_qua TEXT,
    tra_loi TEXT,
    xong_luc TEXT,
    xong_boi INTEGER REFERENCES users(id),
    phu_trach_id INTEGER REFERENCES users(id),
    giao_boi INTEGER REFERENCES users(id),
    giao_luc TEXT,
    CHECK ((violation_id IS NULL) <> (measure_id IS NULL))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_tra_lai_vp_mo ON vi_pham_tra_lai(violation_id) WHERE trang_thai = 'mo' AND violation_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS uq_tra_lai_xl_mo ON vi_pham_tra_lai(measure_id) WHERE trang_thai = 'mo' AND measure_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_tra_lai_nhan ON vi_pham_tra_lai(nguoi_nhan) WHERE trang_thai = 'mo';
  CREATE INDEX IF NOT EXISTS idx_tra_lai_giao ON vi_pham_tra_lai(phu_trach_id) WHERE phu_trach_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_tra_lai_hv ON vi_pham_tra_lai(student_id);
  CREATE INDEX IF NOT EXISTS idx_tra_lai_vp ON vi_pham_tra_lai(violation_id);
  CREATE INDEX IF NOT EXISTS idx_tra_lai_xl ON vi_pham_tra_lai(measure_id);`;
const TEN = ['vi_pham_tra_lai', 'uq_tra_lai_vp_mo', 'uq_tra_lai_xl_mo', 'idx_tra_lai_nhan', 'idx_tra_lai_giao', 'idx_tra_lai_hv', 'idx_tra_lai_vp', 'idx_tra_lai_xl'];

const co = (conn: any, ten: string) => !!conn.prepare(`SELECT 1 FROM sqlite_master WHERE name = ?`).get(ten);

export function migratePrTraLai(conn: any, applied: string[]) {
  if (!['users', 'students', 'violations', 'discipline_measures'].every((t) => co(conn, t))) return;
  if (TEN.some((t) => !co(conn, t))) {
    conn.exec(BANG_TRA_LAI);
    applied.push('TL-1: bảng vi_pham_tra_lai (trả lại vi phạm / lần xử lý) + chỉ mục.');
  }
  if (co(conn, 'viec_bao_ph') && !(conn.prepare(`SELECT 1 FROM pragma_table_info('viec_bao_ph') WHERE name = 'tra_lai_id'`).get())) {
    conn.exec('ALTER TABLE viec_bao_ph ADD COLUMN tra_lai_id INTEGER');
    applied.push('TL-1: thêm viec_bao_ph.tra_lai_id (Báo PH "Chờ GV sửa" — hạn tạm dừng; NULL = không chờ).');
  }
}
