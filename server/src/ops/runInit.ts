/**
 * `npm run init-ban-chinh` — khởi tạo database BẢN CHÍNH trên Turso, một lần duy nhất. Hướng dẫn: TRIEN_KHAI.md mục 7.
 * Đọc năm biến TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD, CHI_NHANH. KHÔNG BAO GIỜ in token hay mật
 * khẩu. Database đã có dữ liệu → từ chối, không ghi gì (luật ở `initBanChinh.ts`).
 */
import fs from 'node:fs';

/* KIỂM BIẾN TRƯỚC KHI NẠP BẤT KỲ MODULE NÀO chạm tới db.ts (db.ts đọc cấu hình kết nối ngay lúc nạp) — nên mọi import
   của mã dự án bên dưới đều là import động, đặt SAU bước này. */
const BIEN = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'CHI_NHANH'] as const;
const thieu = BIEN.filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`[init-ban-chinh] Thiếu biến: ${thieu.join(', ')} — xem TRIEN_KHAI.md mục 7. Chưa làm gì cả.`);
  process.exit(1);
}

/* Đủ biến rồi mới nạp db.ts. Chưa mở kết nối cho tới lời gọi db(). */
const { DB_PATH, SCHEMA_PATH, closeDb, db } = await import('../db.ts');
const { docDanhSachChiNhanh, initBanChinh } = await import('./initBanChinh.ts');

let chiNhanh: { code: string; name: string }[];
try { chiNhanh = docDanhSachChiNhanh(process.env.CHI_NHANH!); } catch (e) {
  console.error(`[init-ban-chinh] ${(e as Error).message} Chưa làm gì cả.`);
  process.exit(1);
}
const dsChiNhanh = chiNhanh.map((c) => `${c.code} (${c.name})`).join(', ');
console.log(`[init-ban-chinh] Sẽ khởi tạo database ${DB_PATH} (không in token) với các chi nhánh: ${dsChiNhanh}`);
console.log('[init-ban-chinh] Đang kiểm database rồi ghi trong MỘT giao dịch — database ở xa nên có thể mất vài phút, đừng đóng cửa sổ.');

try {
  const r = initBanChinh(db(), {
    adminEmail: process.env.ADMIN_EMAIL!, adminPassword: process.env.ADMIN_PASSWORD!, chiNhanh,
    now: new Date().toISOString(), schemaSql: fs.readFileSync(SCHEMA_PATH, 'utf8'),
  });
  console.log(`[init-ban-chinh] Xong. Đã tạo tài khoản quản trị ${process.env.ADMIN_EMAIL!.trim().toLowerCase()} `
    + `(userId ${r.userId}) và ${r.branchIds.length} chi nhánh: ${dsChiNhanh}.`);
} catch (e) {
  console.error(`[init-ban-chinh] TỪ CHỐI: ${(e as Error).message}`);
  console.error('[init-ban-chinh] Không có gì được ghi (hoặc đã cuộn lại toàn bộ).');
  closeDb();
  process.exit(1);
}
closeDb();
