/**
 * PR-N1 · R-PA5 (§5.6, K5-19): hạn ghi kết quả PA hằng tuần đổi từ HẾT CHỦ NHẬT sang HẾT THỨ HAI tuần sau. Hạn được LƯU ở
 * `case_interventions.action_due` → dời mọi hạn Chủ nhật của PA ĐANG CHẠY thêm 1 ngày, để sáng Thứ Hai đầu tiên sau deploy không
 * ai bị tính quá hạn ngược. Một câu, chạy lại không đổi gì thêm (hạn đã là Thứ Hai). PA xong/huỷ giữ nguyên lịch sử.
 *
 * Hai câu (đếm thử + dời) PHẢI cùng điều kiện — cùng lấy từ `dieuKien()`; sửa một chỗ là sửa cả hai. Câu đếm chỉ LEFT JOIN
 * (Case / lượt thi / học viên chỉ để lấy tên) nên số đếm luôn bằng đúng số dòng câu dời sẽ đổi.
 * `strftime('%w', …)` và `date(…, '+1 day')` là hàm sẵn của SQLite, chạy như nhau trên file cục bộ và Turso (libsql).
 */
import { CASE_SOS_DANG_XU_LY, LA_CASE_SOS } from '../cases/sosState.ts';

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

/**
 * Q28-5: tính lại "Chưa xử lý" / "Đang xử lý" của Case từ SOS còn mở theo luật mới (cùng điều kiện với `dongBoTrangThaiCase`).
 * Chạy lại không đổi gì thêm.
 */
const TRANG_THAI_SOS_MOI = `CASE WHEN ${CASE_SOS_DANG_XU_LY('sc')} THEN 'in_progress' ELSE 'open' END`;
const CASE_SOS_LECH = `sc.status != 'done' AND ${LA_CASE_SOS('sc')} AND sc.status != ${TRANG_THAI_SOS_MOI}`;
export function demCaseSosDoiTrangThai(conn: any): { thanhChuaXuLy: number; thanhDangXuLy: number } {
  const r = conn.prepare(`SELECT SUM(${TRANG_THAI_SOS_MOI} = 'open') a, SUM(${TRANG_THAI_SOS_MOI} = 'in_progress') b
    FROM sos_cases sc WHERE ${CASE_SOS_LECH}`).get() as any;
  return { thanhChuaXuLy: r?.a ?? 0, thanhDangXuLy: r?.b ?? 0 };
}
export function migrateTrangThaiCaseSos(conn: any, applied: string[]) {
  const r = conn.prepare(`UPDATE sos_cases AS sc SET status = ${TRANG_THAI_SOS_MOI}, updated_at = ? WHERE ${CASE_SOS_LECH}`)
    .run(new Date().toISOString());
  if (r.changes) applied.push(`Tính lại trạng thái ${r.changes} Case từ SOS theo luật Q28-5 (Chưa xử lý tới khi xác nhận nguyên nhân + PA)`);
}

export function migratePrN1(conn: any, applied: string[]) {
  const r = conn.prepare(`UPDATE case_interventions SET action_due = date(action_due, '+1 day'), updated_at = ? WHERE ${dieuKien()}`)
    .run(new Date().toISOString());
  if (r.changes) applied.push(`Dời hạn ghi kết quả của ${r.changes} PA đang chạy từ Chủ nhật sang Thứ Hai (R-PA5)`);
  migrateTrangThaiCaseSos(conn, applied);
}
