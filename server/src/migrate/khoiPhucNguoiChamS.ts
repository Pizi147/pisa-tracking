import { DB_PATH, closeDb, db, laDbTuXa, tx } from '../db.ts';
import { choPhepMigrateTurso } from '../moiTruong.ts';
import { khoiPhucNguoiChamS } from './prDonNguoiChamS.ts';

/*
 * KHÔI PHỤC DON-NGUOI-CHAM-S — `npm run khoi-phuc-nguoi-cham-s`, CHỈ khi chủ SP bảo trả người chấm cũ. Trả người chấm cho ô còn trống (ai đã chọn GV chấm
 * sau đó thì giữ), sổ nghĩa vụ đi theo, khoá giữ → migrate sau không dọn lại.
 * Turso: như `npm run migrate` — phải đặt PISA_CHO_PHEP_MIGRATE_TURSO = nguyên tên máy chủ database, sao lưu trước.
 */
if (laDbTuXa() && !choPhepMigrateTurso(DB_PATH, process.env.PISA_CHO_PHEP_MIGRATE_TURSO)) {
  console.error('[khoi-phuc-nguoi-cham-s] TỪ CHỐI: đang trỏ tới Turso. SAO LƯU trước (npm run sao-luu), rồi đặt PISA_CHO_PHEP_MIGRATE_TURSO bằng NGUYÊN tên máy chủ.');
  process.exit(1);
}
console.log(`[khoi-phuc-nguoi-cham-s] ${DB_PATH}`);
const ra = tx(() => khoiPhucNguoiChamS(db()));
console.log(ra.length ? `[khoi-phuc-nguoi-cham-s] Xong: trả người chấm cho ${ra.length} ô S chấm chéo.` : '[khoi-phuc-nguoi-cham-s] Không có ô nào để trả (chưa dọn, đã khôi phục, hoặc đã chọn GV chấm sau).');
closeDb();
