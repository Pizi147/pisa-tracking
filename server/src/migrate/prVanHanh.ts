/**
 * VH-1 (N59, chủ SP 20/11 — việc Vận hành), chạy lặp không đổi, khớp `schema.sql`:
 *   1. Bảng `task_groups` (nhóm tự đặt) + 4 nhóm khởi đầu (nhóm cố định cũ, `khoa` = group_key cũ) — thiếu dòng nào thì thêm.
 *   2. Cột `tasks.group_id`, `lap_kieu`, `lap_ngay`, `lap_goc_id`, `lap_ky`, `lap_dung_luc`, `lap_tu` + chỉ mục `ux_tasks_lap_ky`, `idx_tasks_lap_mo`,
 *      `idx_task_giao_mo` (tự lành: thiếu thì tạo).
 *   3. ĐỔI DỮ LIỆU ĐÚNG MỘT LẦN (khoá `demo_config` — chạy lại không thêm lại người theo dõi người dùng đã bỏ / nhóm đã đổi sang "Không phân loại"):
 *      `group_key` → `group_id`; `tasks.watcher_user_id` + `task_followers` → `viec_theo_doi` (loai 'van_hanh'). Cột / bảng cũ giữ, thôi đọc.
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_VAN_HANH = 'pr_van_hanh_chuyen_at';
/** 4 nhóm cố định cũ (`shared/domain/worklist.ts` TASK_GROUPS) — thứ tự như ô chọn cũ. */
export const NHOM_KHOI_DAU: readonly [string, string][] = [
  ['student_parent', 'Học viên / Phụ huynh'], ['curriculum', 'Giáo trình'], ['teacher', 'Giáo viên'], ['tutor', 'Tutor'],
];

const BANG_NHOM = `CREATE TABLE IF NOT EXISTS task_groups (
  id INTEGER PRIMARY KEY, ten TEXT NOT NULL, thu_tu INTEGER NOT NULL DEFAULT 0, an INTEGER NOT NULL DEFAULT 0,
  branch_id INTEGER REFERENCES branches(id), khoa TEXT UNIQUE, tao_boi INTEGER REFERENCES users(id), tao_luc TEXT NOT NULL
)`;
const COT: [string, string][] = [
  ['group_id', 'INTEGER REFERENCES task_groups(id)'], ['lap_kieu', 'TEXT'], ['lap_ngay', 'TEXT'],
  ['lap_goc_id', 'INTEGER REFERENCES tasks(id)'], ['lap_ky', 'TEXT'], ['lap_dung_luc', 'TEXT'], ['lap_tu', 'TEXT'],
];
const CHI_MUC: [string, string][] = [
  ['ux_tasks_lap_ky', 'CREATE UNIQUE INDEX IF NOT EXISTS ux_tasks_lap_ky ON tasks(lap_goc_id, lap_ky) WHERE lap_goc_id IS NOT NULL'],
  ['idx_tasks_lap_mo', 'CREATE INDEX IF NOT EXISTS idx_tasks_lap_mo ON tasks(id) WHERE lap_kieu IS NOT NULL AND lap_dung_luc IS NULL'],
  ['idx_task_giao_mo', "CREATE INDEX IF NOT EXISTS idx_task_giao_mo ON tasks(assignee_user_id) WHERE progress NOT IN ('done','stopped')"],
];

const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);

/** Thêm nhóm khởi đầu còn thiếu (theo `khoa`). Seed gọi cùng hàm. Trả số dòng thêm. */
export function dienNhomKhoiDau(conn: any): number {
  let n = 0;
  NHOM_KHOI_DAU.forEach(([khoa, ten], i) => {
    n += conn.prepare(`INSERT INTO task_groups (ten, thu_tu, an, branch_id, khoa, tao_luc) SELECT ?, ?, 0, NULL, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM task_groups WHERE khoa = ?)`).run(ten, i + 1, khoa, nowIso(), khoa).changes;
  });
  return n;
}

export function migratePrVanHanh(conn: any, applied: string[]) {
  if (!co(conn, 'tasks') || !co(conn, 'users')) return;
  if (!co(conn, 'task_groups')) {
    conn.exec(BANG_NHOM);
    applied.push('VH-1: bảng task_groups (nhóm việc Vận hành tự đặt).');
  }
  const nNhom = dienNhomKhoiDau(conn);
  if (nNhom) applied.push(`VH-1: ${nNhom} nhóm khởi đầu (4 nhóm cố định cũ).`);
  const cot = new Set((conn.prepare(`SELECT name FROM pragma_table_info('tasks')`).all() as any[]).map((c) => c.name as string));
  const thieu = COT.filter(([c]) => !cot.has(c));
  for (const [c, kieu] of thieu) conn.exec(`ALTER TABLE tasks ADD COLUMN ${c} ${kieu}`);
  if (thieu.length) applied.push(`VH-1: thêm tasks.${thieu.map(([c]) => c).join(', ')} (nhóm tự đặt, lặp lại).`);
  for (const [ten, sql] of CHI_MUC) {
    if (co(conn, ten)) continue;
    conn.exec(sql);
    applied.push(`VH-1: chỉ mục ${ten}.`);
  }

  if (!co(conn, 'demo_config') || !co(conn, 'viec_theo_doi')) return;   // viec_theo_doi: GV-1 (chạy trước) — DB rất cũ: lần sau làm nốt
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_VAN_HANH)) return;
  const nhom = conn.prepare(`UPDATE tasks SET group_id = (SELECT g.id FROM task_groups g WHERE g.khoa = tasks.group_key)
      WHERE group_id IS NULL AND group_key IN (SELECT khoa FROM task_groups WHERE khoa IS NOT NULL)`).run().changes;
  const luc = nowIso();
  const td1 = conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
      SELECT 'van_hanh', t.id, t.watcher_user_id, 'tay', t.created_by, COALESCE(t.created_at, ?) FROM tasks t JOIN users u ON u.id = t.watcher_user_id
       WHERE t.watcher_user_id IS NOT NULL ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(luc).changes;
  const td2 = co(conn, 'task_followers') ? conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
      SELECT 'van_hanh', f.task_id, f.user_id, CASE f.source WHEN 'auto' THEN 'head' ELSE 'tay' END, NULL, COALESCE(f.created_at, ?)
        FROM task_followers f JOIN tasks t ON t.id = f.task_id JOIN users u ON u.id = f.user_id WHERE 1 ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(luc).changes : 0;
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_VAN_HANH, luc, luc);
  applied.push(`VH-1: ${nhom} việc sang nhóm tự đặt; ${td1 + td2} người theo dõi sang viec_theo_doi (${td1} từ watcher_user_id, ${td2} từ task_followers). Một lần.`);
}
