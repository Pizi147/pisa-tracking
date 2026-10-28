/**
 * BAND-QUY-DOI (chủ SP 28/10): CHỈ THÊM bảng `bang_quy_doi` (phiên bản bảng quy đổi số câu → band, Quản trị sửa). Không thêm dòng: bảng rỗng = bảng
 * gốc (`BANG_QUY_DOI_GOC`, đúng số đang dùng), nên điểm cũ / mới không đổi gì sau migrate. Câu tạo giống hệt `schema.sql`; chạy lặp không làm gì.
 */
import { DDL_BANG_QUY_DOI } from '../platform/bangQuyDoi.ts';

export function migratePrBandQuyDoi(conn: any, applied: string[]) {
  if (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'bang_quy_doi'`).get()) return;
  conn.exec(DDL_BANG_QUY_DOI);
  applied.push('BAND-QUY-DOI: bảng phiên bản bảng quy đổi band (rỗng = bảng gốc). Dữ liệu cũ giữ nguyên.');
}
