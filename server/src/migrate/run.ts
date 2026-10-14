import fs from 'node:fs';
import { DB_PATH, closeDb, db, laDbTuXa, laLoiMatKetNoiTurso } from '../db.ts';
import { hasLegacyDisciplineModel, migrate } from '../migrate.ts';
import { choPhepMigrateTurso } from '../moiTruong.ts';
import { demFtChuaDauVao } from './prLc.ts';

/*
 * TURSO (bản chính / bản thử): nâng cấp chỉ khi người chạy XÁC NHẬN bằng đúng nguyên tên máy chủ của database — và phải
 * hỏi TRƯỚC khi mở kết nối. Nâng cấp thì giữ dữ liệu, nhưng một bước nâng cấp hỏng trên dữ liệu thật chỉ cứu được bằng
 * bản sao lưu, nên thông báo nhắc sao lưu trước.
 */
if (laDbTuXa() && !choPhepMigrateTurso(DB_PATH, process.env.PISA_CHO_PHEP_MIGRATE_TURSO)) {
  console.error('[migrate] TỪ CHỐI: đang trỏ tới Turso. Muốn nâng cấp database này: SAO LƯU trước (npm run sao-luu), rồi đặt\n'
    + '          PISA_CHO_PHEP_MIGRATE_TURSO bằng NGUYÊN tên máy chủ của nó.');
  process.exit(1);
}

console.log(`[migrate] Nâng cấp dữ liệu đang có tại ${DB_PATH}`);

/*
 * SAO LƯU TRƯỚC KHI XOÁ MÔ HÌNH CASE Ý THỨC CŨ (PR-J, 21/09/2026).
 * Bước nâng cấp chuyển báo cáo → vi phạm, việc trao đổi → biện pháp rồi GỠ case cũ cùng kết quả/mốc/tín hiệu của nó. Phần được
 * giữ là "sự thật"; phần bị bỏ là suy diễn. Vẫn nên có đường lùi: chép nguyên tệp database sang bên cạnh, một lần, không ghi đè.
 */
if (fs.existsSync(DB_PATH) && hasLegacyDisciplineModel(db())) {
  const backup = `${DB_PATH}.truoc-pr-j.bak`;
  if (fs.existsSync(backup)) {
    console.log(`[migrate] Đã có bản sao lưu ${backup} — giữ nguyên, không ghi đè.`);
  } else {
    db().pragma('wal_checkpoint(TRUNCATE)');
    fs.copyFileSync(DB_PATH, backup);
    console.log(`[migrate] Database còn mô hình Case Ý thức cũ — đã sao lưu sang ${backup} trước khi nâng cấp.`);
  }
}

/* Turso qua mạng có lúc đóng kết nối giữa chừng (`Hrana(Http("connection closed…"))`). migrate() chạy lặp được (mỗi bước một giao dịch ngắn:
 * bước đã chốt thành no-op, bước đang dở bị cuộn lại) → mở kết nối mới và chạy lại, tối đa LAN_THU lần. Lỗi khác ném ngay. */
const LAN_THU = 6;
function migrateCoThuLai(): ReturnType<typeof migrate> {
  for (let lan = 1; ; lan++) {
    try {
      return migrate();
    } catch (e) {
      const loiMang = laDbTuXa() && laLoiMatKetNoiTurso(e);
      if (!loiMang || lan >= LAN_THU) throw e;
      console.warn(`[migrate] Mất kết nối Turso (lần ${lan}/${LAN_THU}) — thử lại với kết nối mới…`);
      closeDb();
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000 * lan);
    }
  }
}

const { applied, skipped } = migrateCoThuLai();
for (const a of applied) console.log(`  ✓ ${a}`);
for (const s of skipped) console.log(`  · ${s}`);
console.log(applied.length
  ? '[migrate] Hoàn tất. Dữ liệu cũ được giữ nguyên, không xoá database.'
  : '[migrate] Không có gì để nâng cấp.');
/* PR-LC (kế hoạch 2026-10-07 mục 6): lộ trình FT cũ thiếu điểm đầu vào — chỉ báo số, không tự sửa. */
const ftChuaDauVao = demFtChuaDauVao(db());
if (ftChuaDauVao) console.log(`[migrate] PR-LC: ${ftChuaDauVao} lộ trình FT (Lên FT đã thi hành) chưa có điểm đầu vào — không tự sửa, QL đặt ở hồ sơ học viên.`);
closeDb();
