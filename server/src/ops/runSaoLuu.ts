/**
 * `npm run sao-luu` — sao lưu database (Turso nếu có TURSO_DATABASE_URL, không thì file của máy dev) ra BACKUP_DIR, tải kho
 * tệp bằng chứng nếu có NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN, rồi giữ 14 bản mới nhất. Hướng dẫn: TRIEN_KHAI.md mục 10.
 * Nguồn chỉ được ĐỌC. KHÔNG BAO GIỜ in token. Luật an toàn ở `saoLuu.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';

/* Kiểm biến TRƯỚC khi nạp db.ts (db.ts đọc cấu hình kết nối ngay lúc nạp) — mã dự án bên dưới đều nạp động. */
const coTurso = !!process.env.TURSO_DATABASE_URL?.trim();
if (coTurso && !process.env.TURSO_AUTH_TOKEN?.trim()) {
  console.error('[sao-luu] Thiếu biến: TURSO_AUTH_TOKEN — xem TRIEN_KHAI.md mục 10. Chưa làm gì cả.');
  process.exit(1);
}
if (coTurso && !process.env.BACKUP_DIR?.trim()) {
  console.error('[sao-luu] Thiếu biến: BACKUP_DIR (thư mục lưu bản sao, ví dụ G:\\My Drive\\pisa-sao-luu) — xem TRIEN_KHAI.md mục 10. Chưa làm gì cả.');
  process.exit(1);
}

const { DB_PATH, ROOT, closeDb, db } = await import('../db.ts');
const { giuBanMoiNhat, saoLuuRaFile, saoLuuTep, tenBanSaoLuu } = await import('./saoLuu.ts');
const { tenKhoTep } = await import('../platform/khoTep.ts');

const thuMuc = process.env.BACKUP_DIR?.trim() || path.join(ROOT, 'data', 'sao-luu');
const ten = tenBanSaoLuu(new Date());
const file = path.join(thuMuc, `${ten}.sqlite`);
console.log(`[sao-luu] Nguồn: ${DB_PATH} (không in token) → ${file}`);
console.log('[sao-luu] Chỉ ĐỌC nguồn. Các bảng được chép lần lượt — nên chạy lúc không ai đang nhập liệu. Database ở xa thì có thể mất vài phút.');

try {
  const r = saoLuuRaFile(db(), file);
  console.log(`[sao-luu] Database: đã chép ${r.bang} bảng, ${r.dong} dòng — đã mở lại bản sao để kiểm (toàn vẹn, có người dùng).`);
} catch (e) {
  console.error(`[sao-luu] LỖI — không tạo bản sao lưu nào: ${(e as Error).message}`);
  closeDb();
  process.exit(1);
}
closeDb();

const siteID = process.env.NETLIFY_SITE_ID?.trim();
const token = process.env.NETLIFY_AUTH_TOKEN?.trim();
if (siteID && token) {
  const thuMucTep = path.join(thuMuc, `${ten}-tep`);
  try {
    if (fs.existsSync(thuMucTep)) throw new Error(`đã có thư mục ${path.basename(thuMucTep)} — không ghi đè`);
    const { getStore } = await import('@netlify/blobs');
    const r = await saoLuuTep(getStore({ name: tenKhoTep(), siteID, token }), thuMucTep);
    console.log(`[sao-luu] Tệp bằng chứng (kho ${tenKhoTep()}): ${r.tep} tệp, ${(r.byte / 1024 / 1024).toFixed(1)} MB → ${thuMucTep}`);
  } catch (e) {
    console.error(`[sao-luu] LỖI khi tải tệp bằng chứng: ${(e as Error).message}`);
    console.error(`[sao-luu] Bản sao lưu database ở trên vẫn dùng được: ${file}. Chưa xoá bản cũ nào.`);
    process.exit(1);
  }
} else {
  console.log('[sao-luu] Chưa sao lưu tệp bằng chứng (thiếu NETLIFY_SITE_ID/NETLIFY_AUTH_TOKEN) — xem TRIEN_KHAI.md mục 10.');
}

const daXoa = giuBanMoiNhat(thuMuc, 14, `${ten}.sqlite`);
if (daXoa.length) console.log(`[sao-luu] Giữ 14 bản mới nhất — đã xoá bản cũ: ${daXoa.join(', ')}`);
console.log(`[sao-luu] Xong. Bản sao lưu: ${file}`);
