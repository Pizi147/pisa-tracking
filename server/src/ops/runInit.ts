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
const dbMod = await import('../db.ts').catch((e: Error) => {
  console.error(`[init-ban-chinh] ${e.message} Chưa làm gì cả.`);
  process.exit(1);
});
const { DB_PATH, SCHEMA_PATH, closeDb, db } = dbMod;
const { docDanhSachChiNhanh, initBanChinh } = await import('./initBanChinh.ts');

let chiNhanh: { code: string; name: string }[];
try { chiNhanh = docDanhSachChiNhanh(process.env.CHI_NHANH!); } catch (e) {
  console.error(`[init-ban-chinh] ${(e as Error).message} Chưa làm gì cả.`);
  process.exit(1);
}
const dsChiNhanh = chiNhanh.map((c) => `${c.code} (${c.name})`).join(', ');
const { moTaDichDb } = await import('../moiTruong.ts');
console.log(`[init-ban-chinh] Đích: ${moTaDichDb(DB_PATH)}`);
/* PR-DEPLOY (5b): reset tại chỗ (xoá rồi tạo lại database cùng tên) thì kho tệp cùng tên còn tệp cũ — cảnh báo, không chặn (kiểm cần biến Netlify). */
{
  const siteID = process.env.NETLIFY_SITE_ID?.trim();
  const token = process.env.NETLIFY_AUTH_TOKEN?.trim();
  const { tenKhoTep } = await import('../platform/khoTep.ts');
  if (siteID && token) {
    try {
      const { getStore } = await import('@netlify/blobs');
      const { demTepKho } = await import('./xoaKhoTep.ts');
      const n = await demTepKho(getStore({ name: tenKhoTep(DB_PATH), siteID, token }));
      if (n) console.log(`[init-ban-chinh] CẢNH BÁO: kho tệp ${tenKhoTep(DB_PATH)} còn ${n} tệp cũ — chạy npm run xoa-kho-tep (TRIEN_KHAI.md mục 1a) rồi mới cho mọi người dùng.`);
      else console.log(`[init-ban-chinh] Kho tệp ${tenKhoTep(DB_PATH)}: trống.`);
    } catch (e) {
      console.log(`[init-ban-chinh] Không kiểm được kho tệp (${(e as Error).message}) — tự kiểm bằng npm run xoa-kho-tep.`);
    }
  } else {
    console.log(`[init-ban-chinh] Chưa kiểm kho tệp ${tenKhoTep(DB_PATH)} (thiếu NETLIFY_SITE_ID/NETLIFY_AUTH_TOKEN) — reset tại chỗ thì chạy npm run xoa-kho-tep trước.`);
  }
}
console.log(`[init-ban-chinh] Sẽ khởi tạo database ${DB_PATH} (không in token) với các chi nhánh: ${dsChiNhanh}`);
console.log('[init-ban-chinh] Đang kiểm database rồi ghi trong MỘT giao dịch — database ở xa nên có thể mất vài phút, đừng đóng cửa sổ.');

try {
  const r = initBanChinh(db(), {
    adminEmail: process.env.ADMIN_EMAIL!, adminPassword: process.env.ADMIN_PASSWORD!, chiNhanh,
    now: new Date().toISOString(), schemaSql: fs.readFileSync(SCHEMA_PATH, 'utf8'),
  });
  /* In ĐỘ DÀI (không in mật khẩu): PowerShell trong ngoặc kép nuốt `$…` — "QuangNinh$2026abc" thành "QuangNinh". Đây là
     tài khoản quản trị duy nhất, lệnh không tạo lại được; độ dài lệch là thấy ngay. */
  console.log(`[init-ban-chinh] Kiểm lại: mật khẩu quản trị dài ${process.env.ADMIN_PASSWORD!.length} ký tự — phải đúng bằng số ký tự bạn đã gõ.`);
  console.log(`[init-ban-chinh] Xong. Đã tạo tài khoản quản trị ${process.env.ADMIN_EMAIL!.trim().toLowerCase()} `
    + `(userId ${r.userId}) và ${r.branchIds.length} chi nhánh: ${dsChiNhanh}.`);
} catch (e) {
  console.error(`[init-ban-chinh] TỪ CHỐI: ${(e as Error).message}`);
  console.error('[init-ban-chinh] Mọi thứ nằm trong một giao dịch: bị từ chối hoặc hỏng giữa chừng thì không có gì được ghi.');
  console.error('[init-ban-chinh] Nếu lỗi trên là lỗi MẠNG: chạy lại đúng lệnh này — nó báo "đã có dữ liệu" nghĩa là lần trước đã ghi xong.');
  closeDb();
  process.exit(1);
}
closeDb();
