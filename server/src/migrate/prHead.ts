/**
 * HEAD (chủ SP 18/11 "Đổi 'Quản Lý' thành 'Head'"): chỉ đổi TÊN HIỂN THỊ của vai `manager` trong bảng roles ("Quản lý" → "Head").
 * Khoá `manager` giữ nguyên. Một câu UPDATE có điều kiện nên chạy lặp được (lần hai không đổi dòng nào, không báo gì).
 * Tên cột `key` / `name_vi` không phân biệt hoa thường ở SQLite — bản chính có cột viết hoa vẫn khớp.
 */
export function migratePrHead(conn: any, applied: string[]) {
  const r = conn.prepare("UPDATE roles SET name_vi = 'Head' WHERE key = 'manager' AND name_vi <> 'Head'").run();
  if (r.changes) applied.push('Vai manager: tên hiển thị "Head"');
}
