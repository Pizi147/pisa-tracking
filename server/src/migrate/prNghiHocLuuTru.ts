/**
 * NGHI-HOC-LUU-TRU (chủ SP 05/11: "Nghỉ học rồi thì tất nhiên sẽ vào lưu trữ") — ĐỔI DỮ LIỆU MỘT LẦN: em đã Kết thúc học (`finished`) mà chưa Lưu trữ
 * (ngoại lệ cũ PR-TK / OV-8a: em FT có lộ trình chạy chờ KQ thi thật) → Lưu trữ từ ngày kết thúc học, mỗi em một dòng nhật ký `student.archive`.
 * Đúng tập của câu chỉ đọc `docs/sql/nghi-hoc-luu-tru-dem.sql`. Khoá `demo_config` → chạy lặp không làm gì. DB mới (init / seed) ghi khoá sẵn (`duLieuNen`).
 */
import { nowIso } from '../util.ts';

export const KHOA_PR_NGHI_HOC_LUU_TRU = 'pr_nghi_hoc_luu_tru_da_chay';

/** Em cần lưu trữ (chỉ đọc) — giữ khớp `docs/sql/nghi-hoc-luu-tru-dem.sql`. */
export function emNghiHocChuaLuuTru(conn: any): Array<{ id: number; student_code: string; finished_at: string | null }> {
  return conn.prepare(`SELECT id, student_code, finished_at FROM students WHERE status = 'finished' AND archived_at IS NULL ORDER BY id`).all() as any[];
}

/** Lưu trữ — không khoá (phép kiểm gọi thẳng). Trả số em đã đổi; lần hai không còn em nào. */
export function luuTruEmNghiHoc(conn: any): number {
  const ds = emNghiHocChuaLuuTru(conn);
  const luc = nowIso();
  for (const s of ds) {
    const ngay = s.finished_at ?? luc.slice(0, 10);
    if (!conn.prepare(`UPDATE students SET archived_at = ? WHERE id = ? AND archived_at IS NULL`).run(ngay, s.id).changes) continue;
    conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at) VALUES (NULL, 'student.archive', 'student', ?, ?, ?, ?, ?)`)
      .run(s.id, s.student_code, JSON.stringify({ archivedAt: null }), JSON.stringify({ archivedAt: ngay, lyDo: 'Kết thúc học = Lưu trữ (chủ SP 05/11)' }), luc);
  }
  return ds.length;
}

export function migratePrNghiHocLuuTru(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_NGHI_HOC_LUU_TRU)) return;
  const n = luuTruEmNghiHoc(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_NGHI_HOC_LUU_TRU, nowIso(), nowIso());
  if (n) applied.push(`NGHI-HOC-LUU-TRU: ${n} em đã Kết thúc học chưa Lưu trữ — vào Lưu trữ từ ngày kết thúc học.`);
}
