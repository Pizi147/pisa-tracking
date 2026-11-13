/**
 * LG-3 BC-PH-VIEC-GV (PTA Plan 14/11): MỐC BẬT việc GV "Viết Báo cáo PH" — ghi MỘT lần `demo_config.bc_ph_viec_gv_tu` = ngày nghiệp vụ lúc migrate chạy
 * (bản chính: ngày deploy). Đợt có hạn trước mốc không sinh việc (chủ SP 14/11, lời 16 ý 1: "không sinh việc cho đợt đã qua trước ngày bật").
 * Chạy lại không đổi (đã có mốc thì thôi). DB dựng mới: seed đặt mốc = ngày seed.
 */
import { demoToday } from '../demoConfig.ts';
import { nowIso } from '../util.ts';

export const KHOA_MOC_BC_PH_VIEC_GV = 'bc_ph_viec_gv_tu';

export function migratePrBcPhViecGv(conn: any, applied: string[]) {
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'demo_config'").get()) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_MOC_BC_PH_VIEC_GV)) return;
  const ngay = demoToday();
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?, ?, ?)').run(KHOA_MOC_BC_PH_VIEC_GV, ngay, nowIso());
  applied.push(`BC-PH-VIEC-GV: mốc bật việc GV "Viết Báo cáo PH" = ${ngay}`);
}
