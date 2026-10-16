/**
 * TD6 (chủ SP 16/10): giảm tiếp dòng đọc Turso — chỉ thêm chỉ mục (cùng trong schema.sql), không đổi dữ liệu; chạy lại không làm gì.
 * Mỗi chỉ mục thay một lần quét cho từng dòng ngoài (đo bằng bước máy ảo SQLite trên bộ demo ×3, mô tả PR TD6).
 */
export const CHI_MUC_TD6: [string, string][] = [
  /* Lượt của em ở một lớp (`a.student_id = s.id AND a.class_id = e.class_id`, Điểm theo lượt / Kế hoạch Test) — trước đây duyệt mọi lượt của lớp cho từng em. */
  ['idx_attempt_student_class', 'CREATE INDEX IF NOT EXISTS idx_attempt_student_class ON assessment_attempts(student_id, class_id)'],
  /* Ngày có kết quả của lộ trình (`j.cycle_id = c.id AND j.event_type = 'cycle_outcome'`, Bước tiếp) — trước đây quét cả nhật ký cho từng lộ trình. */
  ['idx_journey_cycle', 'CREATE INDEX IF NOT EXISTS idx_journey_cycle ON journey_events(cycle_id, event_type)'],
  /* Thẻ đang chờ theo (loại, đối tượng) khi câu không nêu `doi_tuong_loai` (thẻ Báo lên Ý thức, Bàn giao) — `ux_ycd_dang_cho` chỉ dùng được cột `loai`. */
  ['idx_ycd_loai_doi_tuong_cho', "CREATE INDEX IF NOT EXISTS idx_ycd_loai_doi_tuong_cho ON yeu_cau_duyet(loai, doi_tuong_id) WHERE trang_thai = 'cho'"],
];

export function migratePrTd6(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_TD6) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`TD6: thêm chỉ mục ${ten}`);
  }
}
