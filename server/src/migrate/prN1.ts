/**
 * PR-N1 (Q28-5): tính lại "Chưa xử lý" / "Đang xử lý" của Case SOS. Phần dời hạn Chủ nhật → Thứ Hai (R-PA5) đã gỡ ở PR-SO (DB cũ đã xoá).
 */
import { CASE_SOS_DANG_XU_LY, LA_CASE_SOS } from '../cases/sosState.ts';

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
  /* PR-SO (DEP-gỡ): bước dời hạn Chủ nhật → Thứ Hai cho PA cũ (R-PA5) đã gỡ — DB cũ đã xoá. Còn bước tính lại trạng thái Case SOS (chạy mọi DB). */
  migrateTrangThaiCaseSos(conn, applied);
}
