/**
 * KIỂM TRƯỚC OV-13q — CHỈ ĐỌC (cùng danh sách với migrate `prOv13q`, `canDatHanOv13q`): đếm theo chi nhánh số lộ trình đã thi chưa xong (chưa kết quả /
 * chưa chọn bước tiếp) mà hạn 1 tuần đã qua — sau deploy những lộ trình này có hạn = hôm nay + 7 (không đỏ hàng loạt). Không ghi câu nào; chạy được cả trước
 * khi có cột mới.
 *
 * Chạy: `npm run kiem-truoc-ov13q` — file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso); hoặc nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { demoToday } from '../demoConfig.ts';
import { canDatHanOv13q } from '../migrate/prOv13q.ts';
import { NGAY_HAN_SAU_THI, addDaysIso, trangThaiSauThi } from '../../../shared/domain/index.ts';

if (process.argv[1] && /kiemTruocOv13q\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-truoc-ov13q] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
  try {
    const homNay = demoToday();
    const ds = canDatHanOv13q(db(), homNay);
    const theoCn = new Map<string, { kq: number; bt: number }>();
    for (const c of ds) {
      const k = c.chi_nhanh ?? '—';
      const x = theoCn.get(k) ?? { kq: 0, bt: 0 };
      if (trangThaiSauThi(c, homNay).giaiDoan === 'da_thi_cho_kq') x.kq += 1; else x.bt += 1;
      theoCn.set(k, x);
    }
    console.log(`\nHôm nay ${homNay}: ${ds.length} lộ trình đã thi chưa xong mà hạn 1 tuần đã qua — migrate đặt hạn ${addDaysIso(homNay, NGAY_HAN_SAU_THI)}${ds.length ? ':' : '.'}`);
    for (const [cn, x] of [...theoCn].sort()) console.log(`  ${cn}: ${x.kq} chờ kết quả · ${x.bt} chờ bước tiếp`);
  } catch (e) {
    console.error(`[kiem-truoc-ov13q] ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
