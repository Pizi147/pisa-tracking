/**
 * TU2-1 LUAT-KQ-TUTOR (chủ SP 19/11 — `docs/superpowers/specs/2026-11-19-tutor/06-ke-hoach-pr.md` mục 2): CHỈ THÊM, chạy lặp được, không đổi dữ liệu cũ.
 *   · `case_followup_buoi.so_buoi` (số buổi của dòng Tutor, dòng cũ = 1) · `case_followups.buoi_du_kien` ("b" của lần ghi) · `tutors.user_id` + chỉ mục UNIQUE
 *     một phần (dòng danh bạ của một GV) — câu giống hệt `schema.sql`.
 *   · Vai `cx` thêm `tutor.view` (TU12) — ĐÚNG MỘT LẦN (khoá `demo_config`, mẫu `prCxN52`): Quản trị gỡ ô ở màn Vai trò thì deploy sau không cấp lại.
 * Gọi ngay sau TU-a / TU-b (bảng `tutors` đã có; cột `case_followups` của PR-S2 đã thêm — giữ thứ tự cột như `schema.sql`). Bảng chưa có thì bỏ qua phần đó.
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_TUTOR2 = 'pr_tutor2_cx_tutor_view_at';
const COT: [bang: string, cot: string, kieu: string][] = [
  ['case_followup_buoi', 'so_buoi', 'INTEGER NOT NULL DEFAULT 1'],
  ['case_followups', 'buoi_du_kien', 'INTEGER'],
  ['tutors', 'user_id', 'INTEGER REFERENCES users(id)'],
];
export const DDL_TUTOR2_CHI_MUC = 'CREATE UNIQUE INDEX IF NOT EXISTS idx_tutors_user ON tutors(user_id) WHERE user_id IS NOT NULL';

export function migratePrTutor2(conn: any, applied: string[]) {
  const coBang = (t: string) => !!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(t);
  const da: string[] = [];
  for (const [bang, cot, kieu] of COT) {
    if (!coBang(bang) || (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} ${kieu}`);
    da.push(`${bang}.${cot}`);
  }
  if (coBang('tutors') && !conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_tutors_user'").get()) {
    conn.exec(DDL_TUTOR2_CHI_MUC);
    da.push('chỉ mục tutors(user_id)');
  }
  if (coBang('demo_config') && coBang('role_permissions') && !conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_TUTOR2)) {
    const vai = conn.prepare("SELECT id FROM roles WHERE key = 'cx'").get() as any;
    const q = conn.prepare("SELECT id FROM permissions WHERE key = 'tutor.view'").get() as any;
    /* Chưa có vai / quyền (DB cũ, bước TU-a chưa chạy) → chưa khoá, lần gọi sau làm. */
    if (vai && q) {
      if (!conn.prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(vai.id, q.id)) {
        conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(vai.id, q.id);
        da.push('vai CX xem trang Tutor');
      }
      conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_TUTOR2, nowIso(), nowIso());
    }
  }
  if (da.length) applied.push(`TU2-1: ${da.join(', ')}. Dữ liệu cũ giữ nguyên.`);
}
