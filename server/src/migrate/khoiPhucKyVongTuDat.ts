import { DB_PATH, closeDb, db, laDbTuXa, tx } from '../db.ts';
import { choPhepMigrateTurso } from '../moiTruong.ts';
import { khoiPhucKyVongTuDat } from './prKyVongTuDat.ts';

/*
 * KHÔI PHỤC KY-VONG-MT0 — `npm run khoi-phuc-ky-vong-tu-dat`, CHỈ khi chủ SP bảo trả "Không đạt" cũ. Kết luận về như trước (QL đã chốt lại thì giữ), Case /
 * PA Tutor mở lại đúng như trước; khoá giữ → migrate sau không sửa lại.
 * Turso: như `npm run migrate` — phải đặt PISA_CHO_PHEP_MIGRATE_TURSO = nguyên tên máy chủ database, sao lưu trước.
 */
if (laDbTuXa() && !choPhepMigrateTurso(DB_PATH, process.env.PISA_CHO_PHEP_MIGRATE_TURSO)) {
  console.error('[khoi-phuc-ky-vong-tu-dat] TỪ CHỐI: đang trỏ tới Turso. SAO LƯU trước (npm run sao-luu), rồi đặt PISA_CHO_PHEP_MIGRATE_TURSO bằng NGUYÊN tên máy chủ.');
  process.exit(1);
}
console.log(`[khoi-phuc-ky-vong-tu-dat] ${DB_PATH}`);
const ra = tx(() => khoiPhucKyVongTuDat(db()));
console.log(`[khoi-phuc-ky-vong-tu-dat] Xong: ${ra.em.length} em về "Không đạt" cũ, mở lại ${ra.caseMoLai.length} Case.`);
closeDb();
