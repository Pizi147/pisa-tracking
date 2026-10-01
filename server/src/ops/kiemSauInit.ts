/**
 * KIỂM SAU KHỞI TẠO (PR-DEPLOY, Task 4 — thay `kiem-sau-xoa`) — CHỈ ĐỌC: chỉ `prepare(...).get/all`, không ghi câu nào. Chủ sản phẩm chạy ngay sau
 * `npm run init-ban-chinh` (và bất cứ lúc nào nghi ngờ) để biết database có đúng là "mới tinh" không.
 *
 * In: (1) đích · (2) số dòng từng bảng nền + mọi bảng NGOÀI danh sách nền có dòng · (3) tài khoản, chi nhánh, khoá `demo_config` · (4) tài khoản mang mật
 * khẩu demo · (5) PRAGMA foreign_key_check · (6) dòng cuối `Đạt.` hoặc `CÓ VẤN ĐỀ: …` (mã thoát 1).
 *
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2) rồi `npm run kiem-sau-init`. Không có biến Turso → DB cục bộ. Không bao giờ in token.
 */
import { DB_PATH, closeDb, db } from '../db.ts';
import { moTaDichDb } from '../moiTruong.ts';
import { DEFAULT_ADMIN_PASSWORD, hashPassword } from '../platform/accounts.ts';
import { BANG_NEN_INIT } from './initBanChinh.ts';
import { KHONG_NOI_BO } from './saoLuu.ts';

/** Khoá `demo_config` mà database mới được có (dấu do `napDuLieuNen` ghi). Khoá nào khác = dữ liệu / cấu hình demo lọt vào. */
const KHOA_DUOC_CO = new Set(['normal_pass_threshold', 'xoa_du_lieu_backfill_at', 'khoi_tao_moi_at']);

/**
 * Kiểm một database đã mở. Hàm thuần (nhận `conn`, trả `{ dong, loi }`) để phép kiểm chạy được mà không cần tiến trình con.
 * `dong` = các dòng in ra; `loi` rỗng = đạt.
 */
export function kiemSauInit(conn: any): { dong: string[]; loi: string[] } {
  const dong: string[] = [];
  const loi: string[] = [];
  const bang = (conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND ${KHONG_NOI_BO} ORDER BY name`).all() as { name: string }[]).map((b) => b.name);
  const dem = (b: string) => (conn.prepare(`SELECT COUNT(*) AS n FROM "${b.replace(/"/g, '""')}"`).get() as { n: number }).n;

  dong.push('(1) Bảng nền');
  for (const b of BANG_NEN_INIT) dong.push(`  ${b}: ${bang.includes(b) ? dem(b) : 'THIẾU BẢNG'}`);
  const thieuBang = BANG_NEN_INIT.filter((b) => !bang.includes(b));
  if (thieuBang.length) loi.push(`thiếu bảng ${thieuBang.join(', ')}`);

  dong.push('(2) Bảng ngoài danh sách nền có dòng');
  const bangLa = bang.filter((b) => !BANG_NEN_INIT.includes(b) && dem(b) > 0).map((b) => `${b}=${dem(b)}`);
  const coHocVien = bang.includes('students') && dem('students') > 0;
  dong.push(bangLa.length ? `  ${bangLa.join(', ')}` : '  không có');
  /* DB đã nhập dữ liệu thật thì bảng khác có dòng là bình thường — chỉ báo đỏ khi chưa có học viên nào (DB vừa init phải trống).
     ponytail: lấy "chưa có học viên" làm dấu "vừa init" — đủ cho lệnh chạy ngay sau init; không lưu mốc init riêng. */
  if (bangLa.length && !coHocVien) loi.push(`database chưa có học viên mà bảng ngoài nền có dòng (${bangLa.slice(0, 6).join(', ')}) — dữ liệu demo / dữ liệu lạ lọt vào`);

  dong.push('(3) Tài khoản · chi nhánh · khoá demo_config');
  const taiKhoan = conn.prepare('SELECT id, email, status FROM users ORDER BY id').all() as { id: number; email: string | null; status: string }[];
  dong.push(`  tài khoản: ${taiKhoan.length}${taiKhoan.length ? ` (${taiKhoan.map((u) => u.email ?? `#${u.id}`).join(', ')})` : ''}`);
  const chiNhanh = conn.prepare('SELECT code, name FROM branches ORDER BY id').all() as { code: string; name: string }[];
  dong.push(`  chi nhánh: ${chiNhanh.length}${chiNhanh.length ? ` — ${chiNhanh.map((c) => `${c.code} · ${c.name}`).join(' | ')}` : ''}`);
  if (!chiNhanh.length) loi.push('chưa có chi nhánh nào');
  if (!taiKhoan.length) loi.push('chưa có tài khoản nào');
  const khoa = (bang.includes('demo_config') ? conn.prepare('SELECT key FROM demo_config ORDER BY key').all() : []) as { key: string }[];
  dong.push(`  demo_config: ${khoa.map((k) => k.key).join(', ') || '(trống)'}`);
  const khoaLa = khoa.map((k) => k.key).filter((k) => !KHOA_DUOC_CO.has(k));
  if (khoaLa.length) loi.push(`demo_config có khoá của bản demo (${khoaLa.join(', ')})`);

  dong.push('(4) Tài khoản mang mật khẩu demo');
  const demo = (conn.prepare('SELECT id, email, password_hash, password_salt FROM users WHERE password_hash IS NOT NULL AND password_salt IS NOT NULL').all() as
    { id: number; email: string | null; password_hash: string; password_salt: string }[])
    .filter((u) => hashPassword(DEFAULT_ADMIN_PASSWORD, u.password_salt).hash === u.password_hash);
  dong.push(demo.length ? `  ĐỎ: ${demo.map((u) => u.email ?? `#${u.id}`).join(', ')}` : '  không có');
  if (demo.length) loi.push(`mật khẩu demo còn ở ${demo.length} tài khoản (${demo.map((u) => u.email ?? `#${u.id}`).join(', ')})`);

  dong.push('(5) PRAGMA foreign_key_check');
  const fk = conn.prepare('PRAGMA foreign_key_check').all() as unknown[];
  dong.push(`  foreign_key_check: ${fk.length}`);
  if (fk.length) loi.push(`khoá ngoại sai ${fk.length} dòng`);
  return { dong, loi };
}

/* Chỉ chạy khi được gọi như lệnh (phép kiểm import hàm mà không kích hoạt). */
if (process.argv[1] && /kiemSauInit\.[jt]s$/.test(process.argv[1])) {
  console.log(`[kiem-sau-init] Đích: ${moTaDichDb(DB_PATH)}`);
  const { dong, loi } = kiemSauInit(db());
  for (const d of dong) console.log(d);
  closeDb();
  if (loi.length) {
    console.log(`[kiem-sau-init] CÓ VẤN ĐỀ: ${loi.join(' · ')}`);
    process.exit(1);
  }
  console.log('[kiem-sau-init] Đạt.');
}
