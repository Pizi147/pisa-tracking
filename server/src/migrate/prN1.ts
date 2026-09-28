/**
 * PR-N1 · R-PA5 (§5.6, K5-19): hạn ghi kết quả PA hằng tuần đổi từ HẾT CHỦ NHẬT sang HẾT THỨ HAI tuần sau. Hạn được LƯU ở
 * `case_interventions.action_due` → dời mọi hạn Chủ nhật của PA ĐANG CHẠY thêm 1 ngày, để sáng Thứ Hai đầu tiên sau deploy không
 * ai bị tính quá hạn ngược. Một câu, chạy lại không đổi gì thêm (hạn đã là Thứ Hai). PA xong/huỷ giữ nguyên lịch sử.
 *
 * Hai câu (đếm thử + dời) PHẢI cùng điều kiện — cùng lấy từ `dieuKien()`; sửa một chỗ là sửa cả hai. Câu đếm chỉ LEFT JOIN
 * (Case / lượt thi / học viên chỉ để lấy tên) nên số đếm luôn bằng đúng số dòng câu dời sẽ đổi.
 * `strftime('%w', …)` và `date(…, '+1 day')` là hàm sẵn của SQLite, chạy như nhau trên file cục bộ và Turso (libsql).
 */
const dieuKien = (a = '') =>
  `${a}status IN ('planned', 'started') AND ${a}action_due IS NOT NULL AND strftime('%w', ${a}action_due) = '0'`;

export function demPaDoiHanThuHai(conn: any) {
  const mau = conn.prepare(
    `SELECT iv.id, s.full_name AS hocVien, iv.action_due AS hanCu, date(iv.action_due, '+1 day') AS hanMoi
       FROM case_interventions iv LEFT JOIN sos_cases sc ON sc.id = iv.case_id
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
      WHERE ${dieuKien('iv.')}
      ORDER BY iv.action_due, iv.id`).all() as any[];
  return { soPa: mau.length, mau };
}

export function migratePrN1(conn: any, applied: string[]) {
  const r = conn.prepare(`UPDATE case_interventions SET action_due = date(action_due, '+1 day'), updated_at = ? WHERE ${dieuKien()}`)
    .run(new Date().toISOString());
  if (r.changes) applied.push(`Dời hạn ghi kết quả của ${r.changes} PA đang chạy từ Chủ nhật sang Thứ Hai (R-PA5)`);
}
