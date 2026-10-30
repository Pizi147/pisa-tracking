/**
 * TL-NEN (TRANG-LON S3): bảng `moc_he_thong` — mốc chung toàn hệ thống, đọc kèm câu phiên (`auth.ts`, 0 câu thêm).
 * · `tham-chieu`: phiên bản bảng tham chiếu (lớp, chương trình, môn / mốc chương trình, cấu hình) — 15 trigger tăng `so` ở mọi INSERT / UPDATE / DELETE,
 *   mọi đường ghi (API, seed, migrate, ops, phép kiểm) đều trúng. Số khởi đầu ngẫu nhiên: reset DB không lặp số cũ (`platform/mocHeThong.ts`).
 * · `quet:*`: lượt quét đường đọc cuối (`luc`, `ngay` nghiệp vụ) — NULL = phải quét ở GET kế.
 * Chỉ thêm bảng + dòng + trigger, chạy lặp được. Cùng định nghĩa trong `schema.sql` (seed không chạy migrate).
 */
export const BANG_THAM_CHIEU = ['classes', 'programmes', 'programme_skills', 'programme_checkpoints', 'demo_config'] as const;
const VIEC = [['ins', 'INSERT'], ['upd', 'UPDATE'], ['del', 'DELETE']] as const;

export const TRIGGER_THAM_CHIEU = BANG_THAM_CHIEU.flatMap((b) => VIEC.map(([ma, viec]) => ({
  ten: `tg_tc_${b}_${ma}`,
  sql: `CREATE TRIGGER tg_tc_${b}_${ma} AFTER ${viec} ON ${b} BEGIN UPDATE moc_he_thong SET so = so + 1 WHERE khoa = 'tham-chieu'; END`,
})));

export function migratePrTlNen(conn: any, applied: string[]): void {
  const done: string[] = [];
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'moc_he_thong'").get()) {
    conn.exec('CREATE TABLE moc_he_thong (khoa TEXT PRIMARY KEY, so INTEGER, luc TEXT, ngay TEXT)');
    done.push('bảng moc_he_thong');
  }
  conn.exec(`INSERT OR IGNORE INTO moc_he_thong (khoa, so) VALUES ('tham-chieu', abs(random() % 1000000000000) + 1),
    ('quet:yeu-cau', NULL), ('quet:lenh', NULL), ('quet:doi-qua-han', NULL)`);
  for (const t of TRIGGER_THAM_CHIEU) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = ?").get(t.ten)) continue;
    conn.exec(t.sql);
    done.push(t.ten);
  }
  if (done.length) applied.push(`TL-NEN: ${done.length > 3 ? `${done[0]} + ${done.length - 1} trigger phiên bản bảng tham chiếu` : done.join(', ')}.`);
}
