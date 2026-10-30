/**
 * CHUONG-NHE: cột `users.chuong_dong_bo_luc` — mốc lần đồng bộ thông báo tự động gần nhất của người đó (`dongBoKhiMoChuong`), thay bộ nhớ
 * tiến trình (Netlify mở tiến trình mới → mỗi lần mở chuông đều đồng bộ). NULL = lần mở chuông kế đồng bộ ngay. Chỉ thêm cột, chạy lặp được.
 */
export function migratePrChuongNhe(conn: any, applied: string[]) {
  const cols = (conn.prepare('PRAGMA table_info(users)').all() as any[]).map((c: any) => c.name);
  if (!cols.length || cols.includes('chuong_dong_bo_luc')) return;
  conn.exec('ALTER TABLE users ADD COLUMN chuong_dong_bo_luc TEXT');
  applied.push('CHUONG-NHE: cột users.chuong_dong_bo_luc (mốc đồng bộ chuông).');
}
