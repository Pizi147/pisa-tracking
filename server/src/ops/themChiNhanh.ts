/**
 * `npm run them-chi-nhanh -- <MÃ> "<Tên chi nhánh>"` — thêm MỘT chi nhánh vào database bản chính (hệ thống chưa có màn tạo
 * chi nhánh). Hướng dẫn: TRIEN_KHAI.md mục 7. Mã đã có → từ chối, không thêm, không sửa gì. KHÔNG in token.
 */
export {};   // là module ES (dùng `await import` ở cấp cao nhất); mã dự án chỉ nạp động, SAU khi kiểm biến

/* Bỏ `--` nếu nó lọt tới đây (PowerShell/npm đôi khi chuyển nguyên); tên chưa bọc ngoặc kép thì ghép lại các phần. */
const [ma, ...phanTen] = process.argv.slice(2).filter((a) => a !== '--');
const ten = phanTen.join(' ').trim();
if (!ma?.trim() || !ten) {
  console.error('[them-chi-nhanh] Cách gõ: npm run them-chi-nhanh -- <MÃ> "<Tên chi nhánh>"   ví dụ: npm run them-chi-nhanh -- UB "Uông Bí"');
  process.exit(1);
}
const thieu = (['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'] as const).filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`[them-chi-nhanh] Thiếu biến: ${thieu.join(', ')} — xem TRIEN_KHAI.md mục 7. Chưa làm gì cả.`);
  process.exit(1);
}

/* Nạp db.ts SAU khi đủ biến: nó đọc cấu hình kết nối ngay lúc nạp. */
const { DB_PATH, closeDb, db } = await import('../db.ts');
const { themChiNhanh } = await import('./initBanChinh.ts');
console.log(`[them-chi-nhanh] Sẽ thêm chi nhánh ${ma.trim().toUpperCase()} (${ten}) vào database ${DB_PATH} (không in token).`);
try {
  const id = themChiNhanh(db(), { code: ma, name: ten }, new Date().toISOString());
  console.log(`[them-chi-nhanh] Xong. Đã thêm chi nhánh ${ma.trim().toUpperCase()} (${ten}), id ${id}.`);
} catch (e) {
  console.error(`[them-chi-nhanh] TỪ CHỐI: ${(e as Error).message}`);
  closeDb();
  process.exit(1);
}
closeDb();
