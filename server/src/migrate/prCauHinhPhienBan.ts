/**
 * QTV2-HAN (chủ SP 11/11, PTA chốt bảng chung): bảng `cau_hinh_phien_ban` — phiên bản cấu hình (hạn mặc định; Case & SOS dùng cùng bảng, `loai` khác)
 * + 3 trigger tăng mốc `tham-chieu` (nhớ đệm làm mới). Bảng rỗng = bản gốc trong mã ⇒ không đổi hành vi. Chỉ thêm bảng / chỉ mục / trigger, chạy lặp được.
 */
import { DDL_CAU_HINH_PHIEN_BAN } from '../platform/cauHinh.ts';

export function migratePrCauHinhPhienBan(conn: any, applied: string[]) {
  const co = (loai: string, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?').get(loai, ten);
  const truoc = co('table', 'cau_hinh_phien_ban') && co('trigger', 'tg_tc_cau_hinh_phien_ban_ins') && co('index', 'idx_chpb_loai');
  if (truoc) return;
  for (const sql of DDL_CAU_HINH_PHIEN_BAN) conn.exec(sql);
  applied.push('QTV2-HAN: bảng cau_hinh_phien_ban (+ chỉ mục, trigger tham-chieu)');
}
