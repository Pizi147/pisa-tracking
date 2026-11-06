/**
 * GIAM-DOC-0611h (06/11): giảm dòng đọc Turso — chỉ thêm chỉ mục (cùng trong schema.sql), không đổi dữ liệu; chạy lại không làm gì.
 * `listCases` của người xem quyền theo chi nhánh lọc tập cha "Case của em thuộc chi nhánh" (`students.branch_id IN …`) — không chỉ mục thì SCAN `students`.
 */
export function migratePrGiamDoc0611h(conn: any, applied: string[]) {
  if (conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_student_branch'").get()) return;
  conn.exec('CREATE INDEX IF NOT EXISTS idx_student_branch ON students(branch_id)');
  applied.push('GIAM-DOC-0611h: thêm chỉ mục idx_student_branch');
}
