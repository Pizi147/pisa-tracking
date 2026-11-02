/**
 * DOC-IT-2 (02/11): giảm dòng đọc Turso — chỉ thêm chỉ mục một phần (cùng trong schema.sql), không đổi dữ liệu; chạy lại không làm gì.
 * Đo bằng `scripts/do-it.py` trên DB ×3 (mô tả PR); không đường đo nào chậm đi.
 */
export const CHI_MUC_DOC_IT_2: [string, string][] = [
  /* Mini test chưa có tỉ lệ (Công việc mọi vai, `mywork.ts`) — trước SQLite đi ngược từ MỌI ghi danh active (SCAN enrollments) vì không có lối vào `ty_le IS NULL`. */
  ['idx_mini_test_cho', 'CREATE INDEX IF NOT EXISTS idx_mini_test_cho ON mini_test(han) WHERE ty_le IS NULL'],
  /* Hẹn Lộ trình mới tới tuần (`batDauHenDenHan`, lượt quét nền + cron) — trước quét cả `learning_cycles`. */
  ['idx_cycle_hen_lo_trinh', "CREATE INDEX IF NOT EXISTS idx_cycle_hen_lo_trinh ON learning_cycles(buoc_tiep_hen) WHERE buoc_tiep = 'lo_trinh_moi'"],
];

export function migratePrDocIt2(conn: any, applied: string[]) {
  for (const [ten, sql] of CHI_MUC_DOC_IT_2) {
    if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten)) continue;
    conn.exec(sql);
    applied.push(`DOC-IT-2: thêm chỉ mục ${ten}`);
  }
}
