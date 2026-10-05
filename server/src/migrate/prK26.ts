/**
 * PR-K26: gộp hai hướng trùng nghĩa của Lộ trình tiếp theo — `chua_ro` (bước 1) và `xep_sau` (bước 2) → `chua_quyet`. ĐỔI DỮ LIỆU có sẵn,
 * giữ nguyên `ngay_xem_lai`, `ly_do`, `ghi_chu`. Cột `huong` là TEXT nên không đổi cấu trúc. Chạy lặp được (lần hai 0 dòng).
 */
export function migratePrK26(conn: any, applied: string[]) {
  const r = conn.prepare(`UPDATE lo_trinh_tiep_theo SET huong = 'chua_quyet' WHERE huong IN ('chua_ro', 'xep_sau')`).run();
  if (r.changes > 0) applied.push(`PR-K26: ${r.changes} bản ghi Lộ trình tiếp theo "Chưa rõ"/"Xếp sau" → "Chưa quyết"`);
}
