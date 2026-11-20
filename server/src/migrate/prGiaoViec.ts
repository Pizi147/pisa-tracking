/**
 * GV-1 (N58, chủ SP 20/11 — giao việc liên phòng ban) — CHỈ THÊM, chạy lặp không làm gì, khớp `schema.sql`:
 *   1. `phu_trach_id`, `giao_boi`, `giao_luc` trên viec_bao_ph · sos_coordination_actions · tinh_hinh_hoc_tap (NULL = theo luật — dữ liệu cũ giữ nguyên).
 *   2. Bảng viec_theo_doi (người theo dõi) · viec_giao_lan (lịch sử giao) · meeting_phan (Meeting CX / GĐCN: Xếp lịch họp, Kết quả meeting).
 *   3. Chỉ mục một phần `phu_trach_id IS NOT NULL` (việc giao cho tôi) — dòng cũ đều NULL nên không vào chỉ mục, câu cũ không đổi kế hoạch / thứ tự.
 * Bảng gốc chưa có (DB rất cũ ở lần đầu migrate) → bỏ qua bảng đó; lần gọi cuối chuỗi migrate làm nốt.
 */
const BANG_MOI = `
  CREATE TABLE IF NOT EXISTS viec_theo_doi (
    id INTEGER PRIMARY KEY, loai TEXT NOT NULL, ref_id INTEGER NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id),
    nguon TEXT NOT NULL DEFAULT 'tay', them_boi INTEGER REFERENCES users(id), luc TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_viec_theo_doi ON viec_theo_doi(loai, ref_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_viec_theo_doi_nguoi ON viec_theo_doi(user_id);
  CREATE TABLE IF NOT EXISTS viec_giao_lan (
    id INTEGER PRIMARY KEY, loai TEXT NOT NULL, ref_id INTEGER NOT NULL, truong TEXT NOT NULL, cu TEXT, moi TEXT,
    boi INTEGER REFERENCES users(id), luc TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_viec_giao_lan ON viec_giao_lan(loai, ref_id);`;

const MEETING = `
  CREATE TABLE IF NOT EXISTS meeting_phan (
    id INTEGER PRIMARY KEY,
    phoi_hop_id INTEGER NOT NULL REFERENCES sos_coordination_actions(id),
    phan TEXT NOT NULL,
    branch_id INTEGER,
    trang_thai TEXT NOT NULL DEFAULT 'mo',
    ngay_gio TEXT,
    ket_qua TEXT,
    xong_boi INTEGER REFERENCES users(id), xong_luc TEXT, nhap_ho_boi INTEGER REFERENCES users(id),
    han_chon TEXT,
    phu_trach_id INTEGER REFERENCES users(id), giao_boi INTEGER REFERENCES users(id), giao_luc TEXT,
    tao_luc TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_phan ON meeting_phan(phoi_hop_id, phan);
  CREATE INDEX IF NOT EXISTS idx_meeting_phan_mo ON meeting_phan(branch_id) WHERE trang_thai = 'mo';
  CREATE INDEX IF NOT EXISTS idx_meeting_phan_giao ON meeting_phan(phu_trach_id) WHERE phu_trach_id IS NOT NULL;`;

/** Bảng có cột giao việc + tên chỉ mục một phần của nó. */
const BANG_VIEC: [string, string][] = [
  ['viec_bao_ph', 'idx_viec_bao_ph_giao'], ['sos_coordination_actions', 'idx_sca_giao'], ['tinh_hinh_hoc_tap', 'idx_tinh_hinh_giao'],
];

const coBang = (conn: any, ten: string) => !!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(ten);

export function migratePrGiaoViec(conn: any, applied: string[]) {
  if (!coBang(conn, 'users')) return;
  if (!coBang(conn, 'viec_theo_doi') || !coBang(conn, 'viec_giao_lan')) {
    conn.exec(BANG_MOI);
    applied.push('GV-1: bảng viec_theo_doi (người theo dõi việc) + viec_giao_lan (lịch sử giao việc).');
  }
  for (const [bang, chiMuc] of BANG_VIEC) {
    if (!coBang(conn, bang)) continue;
    const cot = new Set((conn.prepare(`SELECT name FROM pragma_table_info(?)`).all(bang) as any[]).map((c) => c.name as string));
    const thieu = ['phu_trach_id', 'giao_boi', 'giao_luc'].filter((c) => !cot.has(c));
    if (thieu.length) {
      if (thieu.includes('phu_trach_id')) conn.exec(`ALTER TABLE ${bang} ADD COLUMN phu_trach_id INTEGER REFERENCES users(id)`);
      if (thieu.includes('giao_boi')) conn.exec(`ALTER TABLE ${bang} ADD COLUMN giao_boi INTEGER REFERENCES users(id)`);
      if (thieu.includes('giao_luc')) conn.exec(`ALTER TABLE ${bang} ADD COLUMN giao_luc TEXT`);
      applied.push(`GV-1: thêm ${bang}.${thieu.join(', ')} (người được giao; NULL = theo luật).`);
    }
    if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?`).get(chiMuc)) {
      conn.exec(`CREATE INDEX IF NOT EXISTS ${chiMuc} ON ${bang}(phu_trach_id) WHERE phu_trach_id IS NOT NULL`);
      applied.push(`GV-1: chỉ mục một phần ${chiMuc} (việc giao cho tôi).`);
    }
  }
  if (coBang(conn, 'sos_coordination_actions') && !coBang(conn, 'meeting_phan')) {
    conn.exec(MEETING);
    applied.push('GV-1: bảng meeting_phan (Meeting CX / GĐCN: Xếp lịch họp · Kết quả meeting).');
  }
}
