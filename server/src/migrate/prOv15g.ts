import { nowIso } from '../util.ts';

/**
 * OV-15g (C22): MỐC bắt đầu "Lịch sử thay đổi" — lúc bản này chạy lần đầu trên một database (chỉ thêm một dòng `demo_config`, chạy lặp không đổi).
 * Lớp / lộ trình có TRƯỚC mốc thì panel ghi "Lịch sử bắt đầu ghi từ {ngày}" — không bịa lịch sử cho dữ liệu cũ. Seed gọi cùng hàm (DB mới = mốc mới).
 */
export const MOC_LICH_SU = 'lich_su_thay_doi_tu';

export function migratePrOv15g(conn: any, applied: string[]) {
  if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'demo_config'`).get()) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(MOC_LICH_SU)) return;
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(MOC_LICH_SU, nowIso(), nowIso());
  applied.push('OV-15g: ghi mốc bắt đầu Lịch sử thay đổi. Dữ liệu cũ giữ nguyên.');
}
