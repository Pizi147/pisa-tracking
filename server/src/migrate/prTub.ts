/**
 * TU-b (rà #477): CHỈ THÊM chỉ mục một phần cho nhóm "chú ý" của trang Tutor — buổi có ô "Không" hoặc đánh giá ≤ 2. `canChuY` (bảng, panel, số menu
 * `/tutors/dem`) đọc qua chỉ mục này thay vì quét cả `case_followup_buoi`. Câu tạo giống hệt `schema.sql`; chạy lặp không làm gì.
 */
export const DDL_TUB = `CREATE INDEX IF NOT EXISTS idx_followup_buoi_chu_y ON case_followup_buoi(tutor_id) WHERE chuan_bi = 0 OR tai_lieu = 0 OR feedback_gv = 0 OR danh_gia <= 2`;

export function migratePrTub(conn: any, applied: string[]) {
  if (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_followup_buoi_chu_y'`).get()) return;
  conn.exec(DDL_TUB);
  applied.push('TU-b: chỉ mục buổi tutor cần chú ý. Dữ liệu cũ giữ nguyên.');
}
