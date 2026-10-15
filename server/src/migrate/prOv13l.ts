/**
 * OV-13l (chủ SP 15/10): HẠN BÀN GIAO mọi lệnh = muộn hơn của (ngày ra lệnh + 7 ngày, tính cả ngày ra lệnh) và mốc cũ; GVBM = GVCN.
 * Lệnh đang chờ (`cho`), có phiếu (hạn khác NULL), GVCN chưa xác nhận → tính lại, KHÔNG BAO GIỜ sớm hơn hạn cũ (lấy muộn nhất của hạn GVBM cũ,
 * hạn GVCN cũ và mốc 7 ngày). Đã đúng → không đổi: chạy lại không đổi gì. Turso: một câu UPDATE, không tham số đặt tên.
 */
import { HAN_BAN_GIAO_NGAY } from '../../../shared/domain/index.ts';

const MOI = `MAX(han_gvbm, han_gvcn, date(ngay_ra_lenh, '+${HAN_BAN_GIAO_NGAY - 1} days'))`;
const DIEU_KIEN = `trang_thai = 'cho' AND xac_nhan_luc IS NULL AND han_gvbm IS NOT NULL AND han_gvcn IS NOT NULL`;

export function migratePrOv13l(conn: any, applied: string[]) {
  if (!(conn.prepare('SELECT name FROM pragma_table_info(?)').all('lenh_chuyen_lop') as any[]).length) return;
  const r = conn.prepare(`UPDATE lenh_chuyen_lop SET han_gvbm = ${MOI}, han_gvcn = ${MOI}, sua_luc = ?
    WHERE ${DIEU_KIEN} AND (han_gvbm != ${MOI} OR han_gvcn != ${MOI})`).run(new Date().toISOString());
  if (r.changes) applied.push(`OV-13l: ${r.changes} quyết định chuyển lớp đang chờ tính lại hạn bàn giao (≥ 7 ngày từ ngày ra lệnh, GVBM = GVCN, không sớm hơn hạn cũ).`);
}
