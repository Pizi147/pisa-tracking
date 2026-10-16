/**
 * OV-13q (chủ SP 16/10): "Đã thi xong · hạn 1 tuần" + Gia hạn.
 *   learning_cycles.han_sau_thi          hạn đã gia hạn (NULL = hạn gốc = ngày thi + 7) — chỉ có hiệu lực khi muộn hơn hạn gốc (`trangThaiSauThi`)
 *   learning_cycles.han_sau_thi_boi      người gia hạn lần cuối
 *   learning_cycles.han_sau_thi_luc      lúc gia hạn lần cuối
 *   learning_cycles.han_sau_thi_ly_do    lý do (tuỳ chọn)
 *   learning_cycles.han_sau_thi_so_lan   số lần gia hạn (0 = hệ thống đặt lúc chuyển luật)
 * `themCotPrOv13q` gọi ĐẦU migrate (bài học #420: mã đọc cột này — việc thi thật / bước tiếp — có thể chạy trong bước trước).
 * `migratePrOv13q` (cuối): DỮ LIỆU CŨ — lộ trình đã thi, chưa xong (chưa kết quả hoặc chưa chọn bước tiếp) mà hạn theo luật mới đã qua → hạn = hôm nay + 7
 * (không đỏ hàng loạt sau deploy). Một lần (khoá `demo_config`) + đã có `han_sau_thi` thì bỏ qua: chạy lại không đổi. `kiemTruocOv13q` = cùng danh sách, không ghi.
 */
import { NGAY_HAN_SAU_THI, addDaysIso, trangThaiSauThi } from '../../../shared/domain/index.ts';
import { COT_SAU_THI, LO_TRINH_MOI_NHAT } from '../loTrinh/thiThat.ts';
import { demoToday } from '../demoConfig.ts';

const COT: [string, string][] = [
  ['han_sau_thi', 'TEXT'], ['han_sau_thi_boi', 'INTEGER'], ['han_sau_thi_luc', 'TEXT'], ['han_sau_thi_ly_do', 'TEXT'],
  ['han_sau_thi_so_lan', 'INTEGER NOT NULL DEFAULT 0'],
];
export const LY_DO_CHUYEN_LUAT = 'Chuyển luật hạn 1 tuần';
/** Bước dữ liệu chạy ĐÚNG MỘT LẦN (mẫu prOv13p): DB dựng bằng mã hiện hành (seed ghi khoá) không bị đặt hạn — lộ trình quá hạn mới là quá hạn thật. */
export const KHOA_PR_OV13Q = 'pr_ov13q_han_sau_thi_at';

export function themCotPrOv13q(conn: any, applied: string[]) {
  const co = new Set((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).map((c) => c.name as string));
  if (!co.size) return;
  const them = COT.filter(([ten]) => !co.has(ten));
  for (const [ten, kieu] of them) conn.exec(`ALTER TABLE learning_cycles ADD COLUMN ${ten} ${kieu}`);
  if (them.length) applied.push(`OV-13q: thêm cột learning_cycles.${them.map(([t]) => t).join(', ')} (hạn sau thi + gia hạn).`);
}

/** Lộ trình FT mới nhất, đã thi, chưa xong, chưa gia hạn, hạn luật mới < hôm nay (cùng cột + cùng hàm với việc Công việc). */
export function canDatHanOv13q(conn: any, homNay: string): any[] {
  /* `kiem-truoc-ov13q` chạy TRƯỚC migrate (chưa có cột) — đọc như chưa gia hạn. */
  const coCot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).some((c) => c.name === 'han_sau_thi');
  const cot = coCot ? COT_SAU_THI : COT_SAU_THI.replace('c.han_sau_thi, c.han_sau_thi_so_lan,', 'NULL AS han_sau_thi, 0 AS han_sau_thi_so_lan,');
  const ds = conn.prepare(`SELECT c.id, c.student_id, s.full_name AS ten, s.student_code AS ma, COALESCE(bc.branch_id, cl.branch_id, s.branch_id) AS branch_id, br.name AS chi_nhanh, ${cot}
      FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
      LEFT JOIN ban_chup_lo_trinh bc ON bc.cycle_id = c.id AND bc.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = c.id)
      LEFT JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = c.student_id) LEFT JOIN classes cl ON cl.id = e.class_id
      LEFT JOIN branches br ON br.id = COALESCE(bc.branch_id, cl.branch_id, s.branch_id)
     WHERE c.route IS NOT NULL AND c.buoc_tiep IS NULL${coCot ? ' AND c.han_sau_thi IS NULL' : ''} AND ${LO_TRINH_MOI_NHAT}
       AND (c.status = 'active' OR COALESCE(bc.ly_do, '') != 'chuyen_lop')`).all() as any[];
  return ds.filter((c) => {
    const st = trangThaiSauThi(c, homNay);
    return (st.giaiDoan === 'da_thi_cho_kq' || st.giaiDoan === 'cho_buoc_tiep') && st.quaHan;
  });
}

export function migratePrOv13q(conn: any, applied: string[]) {
  if (!(conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).some((c) => c.name === 'han_sau_thi')) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_OV13Q)) return;
  const homNay = demoToday();
  const ds = canDatHanOv13q(conn, homNay);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_OV13Q, new Date().toISOString(), new Date().toISOString());
  if (!ds.length) return;
  const han = addDaysIso(homNay, NGAY_HAN_SAU_THI);
  const cau = conn.prepare(`UPDATE learning_cycles SET han_sau_thi = ?, han_sau_thi_luc = ?, han_sau_thi_ly_do = ?, han_sau_thi_so_lan = 0 WHERE id = ? AND han_sau_thi IS NULL`);
  for (const c of ds) cau.run(han, new Date().toISOString(), LY_DO_CHUYEN_LUAT, c.id);
  applied.push(`OV-13q: ${ds.length} lộ trình đã thi chưa xong mà hạn mới đã qua → hạn sau thi ${han} (${LY_DO_CHUYEN_LUAT}).`);
}
