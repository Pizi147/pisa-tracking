/**
 * `npm run khoi-phuc` — khôi phục một file sao lưu (.sqlite) vào một database Turso RỖNG (mới tạo). Hướng dẫn:
 * TRIEN_KHAI.md mục 11.2. Đọc: FILE_SAO_LUU, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, và PISA_CHO_PHEP_KHOI_PHUC = NGUYÊN tên
 * máy chủ của database đích (URL bỏ `libsql://`). KHÔNG BAO GIỜ ghi vào database đã có dữ liệu. KHÔNG in token.
 * Tệp bằng chứng (Netlify Blobs) KHÔNG được chép — việc tay, xem TRIEN_KHAI mục 11.2.
 */
import fs from 'node:fs';
import path from 'node:path';

/* Kiểm biến TRƯỚC khi nạp db.ts (db.ts đọc cấu hình kết nối ngay lúc nạp). */
const thieu = (['FILE_SAO_LUU', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'] as const).filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`[khoi-phuc] Thiếu biến: ${thieu.join(', ')} — xem TRIEN_KHAI.md mục 11.2. Chưa làm gì cả.`);
  process.exit(1);
}
const file = process.env.FILE_SAO_LUU!.trim();
if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
  console.error(`[khoi-phuc] Không thấy file sao lưu ${file} — kiểm lại FILE_SAO_LUU. Chưa làm gì cả.`);
  process.exit(1);
}

const dbMod = await import('../db.ts').catch((e: Error) => {
  console.error(`[khoi-phuc] ${e.message} Chưa làm gì cả.`);
  process.exit(1);
});
const { DB_PATH, closeDb, db } = dbMod;
const { moTaDichDb, tenMayChuDb } = await import('../moiTruong.ts');

/*
 * XÁC NHẬN ĐÍCH — hỏi TRƯỚC khi mở kết nối: phải gõ đúng nguyên tên máy chủ của database đích. (URL `file:` — chỉ dùng khi
 * thử trên máy — thì là tên file.) Không in tên mong đợi ra: xác nhận là để người chạy tự nhìn URL mình định ghi vào.
 */
const tenDich = (tenMayChuDb(DB_PATH) || (/^file:/i.test(DB_PATH) ? path.basename(DB_PATH.replace(/^file:/i, '')) : '')).toLowerCase();
const xacNhan = process.env.PISA_CHO_PHEP_KHOI_PHUC?.trim().toLowerCase();
if (!tenDich || xacNhan !== tenDich) {
  console.error('[khoi-phuc] TỪ CHỐI: chưa xác nhận đúng database đích. Đặt PISA_CHO_PHEP_KHOI_PHUC bằng NGUYÊN tên máy chủ của nó');
  console.error('            (URL database đích bỏ chữ libsql:// ở đầu) — TRIEN_KHAI.md mục 11.2. Chưa làm gì cả.');
  process.exit(1);
}

const { default: Database } = await import('libsql');
const { khoiPhuc } = await import('./khoiPhuc.ts');
console.log(`[khoi-phuc] Đích: ${moTaDichDb(DB_PATH)}`);
console.log(`[khoi-phuc] Sẽ khôi phục ${file} vào database ${DB_PATH} (không in token). Chỉ ghi nếu database đích hoàn toàn trống.`);
console.log('[khoi-phuc] Mọi thứ trong MỘT giao dịch — database ở xa nên có thể mất nhiều phút, đừng đóng cửa sổ.');

const nguon = new Database(file, { readonly: true });
try {
  const r = khoiPhuc(nguon, db(), { moiLan: 100 });
  console.log(`[khoi-phuc] Đã kiểm lại: mọi bảng đúng số dòng như file sao lưu, không có vi phạm khoá ngoại mới.`);
  console.log('[khoi-phuc] Tiếp theo: đổi biến của bản chính thức sang database này (TRIEN_KHAI mục 6) rồi deploy --prod.');
  console.log('[khoi-phuc] Tệp bằng chứng (ảnh, thư) KHÔNG được chép tự động — xem TRIEN_KHAI mục 11.2.');
  console.log(`[khoi-phuc] Xong. Đã khôi phục ${r.bang} bảng, ${r.dong} dòng vào ${DB_PATH}.`);
} catch (e) {
  console.error(`[khoi-phuc] TỪ CHỐI: ${(e as Error).message}`);
  console.error('[khoi-phuc] Mọi thứ nằm trong một giao dịch: bị từ chối hoặc hỏng giữa chừng thì database đích không bị ghi gì.');
  process.exitCode = 1;
} finally {
  nguon.close();
  closeDb();
}
