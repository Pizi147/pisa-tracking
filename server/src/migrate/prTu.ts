/**
 * TU-a (đặc tả Tutor mục 3.1–3.3, 4): CHỈ THÊM — bảng `tutors` + `tutor_nhan_xet`, 9 cột của `case_followup_buoi` (dòng cũ NULL), chỉ mục, vai
 * `head_tutor` + quyền (`migratePermissions` không chèn vai mới — khuôn `prOv2.ts`; hai quyền mới cho Quản trị / QL đi đường `migratePermissions`).
 * Câu tạo giống hệt `schema.sql` (phép kiểm TU-1a so cột, khoá ngoài, chỉ mục). Chạy lặp không làm gì.
 */
import { ROLES, ROLE_PERMISSIONS } from '../seed/data.ts';

export const DDL_TU = `
CREATE TABLE IF NOT EXISTS tutors (
  id INTEGER PRIMARY KEY,
  ten TEXT NOT NULL,
  sdt TEXT,
  noi_day_branch_id INTEGER REFERENCES branches(id),
  chi_online INTEGER NOT NULL DEFAULT 0,
  ky_nang TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  updated_at TEXT,
  updated_by INTEGER REFERENCES users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tutors_sdt ON tutors(sdt) WHERE sdt IS NOT NULL;
CREATE TABLE IF NOT EXISTS tutor_nhan_xet (
  id INTEGER PRIMARY KEY,
  tutor_id INTEGER NOT NULL REFERENCES tutors(id),
  ket_luan TEXT NOT NULL CHECK (ket_luan IN ('on','can_cai_thien','ngung')),
  noi_dung TEXT NOT NULL,
  nguoi_id INTEGER NOT NULL REFERENCES users(id),
  luc TEXT NOT NULL,
  sua_luc TEXT
);
CREATE INDEX IF NOT EXISTS idx_tutor_nhan_xet ON tutor_nhan_xet(tutor_id, luc);
`;

/** 9 cột thêm vào `case_followup_buoi` — đúng thứ tự cuối bảng ở `schema.sql`. */
const COT_BUOI: [string, string][] = [
  ['tutor_id', 'INTEGER REFERENCES tutors(id)'],
  ['hinh_thuc', "TEXT CHECK (hinh_thuc IN ('offline','online'))"],
  ['chuan_bi', 'INTEGER'], ['tai_lieu', 'INTEGER'], ['feedback_gv', 'INTEGER'],
  ['danh_gia', 'INTEGER CHECK (danh_gia BETWEEN 1 AND 5)'],
  ['nhan_xet_tutor', 'TEXT'],
  ['lop_id', 'INTEGER REFERENCES classes(id)'],
  ['ghi_luc', 'TEXT'],
];

export function migratePrTu(conn: any, applied: string[]) {
  const da: string[] = [];
  if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'tutors'`).get()) {
    conn.exec(DDL_TU);
    da.push('bảng tutors, tutor_nhan_xet');
  }
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('case_followup_buoi') as any[]).map((x) => x.name as string));
  const thieu = COT_BUOI.filter(([ten]) => !co.has(ten));
  for (const [ten, kieu] of thieu) conn.exec(`ALTER TABLE case_followup_buoi ADD COLUMN ${ten} ${kieu}`);
  if (thieu.length) da.push(`${thieu.length} cột case_followup_buoi`);
  if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_followup_buoi_tutor'`).get()) {
    conn.exec('CREATE INDEX idx_followup_buoi_tutor ON case_followup_buoi(tutor_id)');
    da.push('chỉ mục buổi theo tutor');
  }
  if (!conn.prepare(`SELECT 1 FROM roles WHERE key = 'head_tutor'`).get()) {
    const roleId = Number(conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES ('head_tutor', ?, 'active')")
      .run(ROLES.find((r) => r.key === 'head_tutor')!.name).lastInsertRowid);
    for (const k of ROLE_PERMISSIONS.head_tutor) {
      const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(k) as any;
      if (!perm) throw new Error(`TU-a: thiếu quyền ${k} — migratePermissions phải chạy trước.`);
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(roleId, perm.id);
    }
    da.push('vai Head tutor');
  }
  if (da.length) applied.push(`TU-a: ${da.join(', ')}. Dữ liệu cũ giữ nguyên.`);
}
