import { DB_PATH, closeDb, db, laDbTuXa, tx } from '../db.ts';
import { choPhepMigrateTurso } from '../moiTruong.ts';
import { hoanTacResetHanCase } from './prResetHanCase.ts';

/*
 * HOÀN TÁC RESET-HAN-CASE (#1127, RA-LOI-0711k) — `npm run hoan-tac-reset-han-case`, CHỈ khi chủ SP bảo trả hạn cũ (TRIEN_KHAI.md mục 11.6).
 * Trả hạn cũ cho việc mà hạn hiện tại còn đúng hạn reset (ai đã đổi tiếp thì giữ), xoá nhật ký `reset_case:*`, khoá giữ → migrate sau không reset lại.
 * Turso: như `npm run migrate` — phải đặt PISA_CHO_PHEP_MIGRATE_TURSO = nguyên tên máy chủ database, sao lưu trước.
 */
if (laDbTuXa() && !choPhepMigrateTurso(DB_PATH, process.env.PISA_CHO_PHEP_MIGRATE_TURSO)) {
  console.error('[hoan-tac-reset-han] TỪ CHỐI: đang trỏ tới Turso. SAO LƯU trước (npm run sao-luu), rồi đặt PISA_CHO_PHEP_MIGRATE_TURSO bằng NGUYÊN tên máy chủ.');
  process.exit(1);
}
console.log(`[hoan-tac-reset-han] ${DB_PATH}`);
const n = tx(() => hoanTacResetHanCase(db()));
console.log(n ? `[hoan-tac-reset-han] Xong: trả hạn cũ cho ${n} việc tuyến Case.` : '[hoan-tac-reset-han] Không có việc nào để trả (chưa reset, hoặc đã hoàn tác / đã đổi tiếp).');
closeDb();
