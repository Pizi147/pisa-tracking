/**
 * DATA-TVV (V5 `08` mục 6) — CHỈ ĐỌC: đếm học viên đang học có / chưa TVV theo chi nhánh, trước SV-TVV (việc TVV của em không TVV → QL chi nhánh).
 * Chi nhánh của em = lớp đang học / tạm dừng mới nhất, không có thì `students.branch_id` (như `chiNhanhCuaEm`). "Có TVV" = TVV đang hoạt động
 * cùng chi nhánh (như `kiemTvvCungChiNhanh`); gán người đã nghỉ / khác chi nhánh tính riêng "TVV sai". Không ghi câu nào.
 *
 * Chạy: `npm run dem-tvv` (đã gồm build:server)
 *   · file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso) · bản chính: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 * Gán TVV ở bản chính: `TRIEN_KHAI.md` mục 11.5.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nap = (p) => import(pathToFileURL(path.join(GOC, 'dist-server/server/src', p)).href);
const { DB_PATH, closeDb, db } = await nap('db.js');
const { moTaDichDb } = await nap('moiTruong.js');

const NGUOI_VAI = `FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id
  WHERE u.status = 'active' AND u.approval_state = 'approved'`;
const pt = (a, b) => (b ? `${Math.round((a * 100) / b)} %` : '—');

console.log(`[dem-tvv] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
try {
  const em = db().prepare(
    `WITH x AS (
       SELECT s.consultant_user_id AS tvv, s.consultant_name AS ten_cu,
              (SELECT e.class_id FROM enrollments e WHERE e.student_id = s.id AND e.status IN ('active','paused') ORDER BY e.id DESC LIMIT 1) AS lop,
              s.branch_id AS cn_hs
         FROM students s WHERE s.status = 'active' AND s.archived_at IS NULL),
     y AS (SELECT x.tvv, x.ten_cu, c.code AS lop, COALESCE(c.branch_id, x.cn_hs) AS cn FROM x LEFT JOIN classes c ON c.id = x.lop)
     SELECT y.*, EXISTS (SELECT 1 ${NGUOI_VAI} AND r.key = 'consultant' AND u.id = y.tvv AND (y.cn IS NULL OR ur.branch_id = y.cn)) AS hop_le
       FROM y`).all();
  const cnTen = new Map(db().prepare('SELECT id, code FROM branches').all().map((b) => [b.id, b.code]));
  const demVai = (vai) => new Map(db().prepare(`SELECT ur.branch_id AS cn, COUNT(DISTINCT u.id) AS n ${NGUOI_VAI} AND r.key = ? GROUP BY ur.branch_id`)
    .all(vai).map((r) => [r.cn, r.n]));
  const soTvv = demVai('consultant'), soQl = demVai('manager');

  const theoCn = new Map(), lopThieu = new Map();
  for (const r of em) {
    const loai = r.tvv == null ? 'chua' : r.hop_le ? 'co' : 'sai';
    const g = theoCn.get(r.cn) ?? { tong: 0, co: 0, chua: 0, sai: 0, tenCu: 0 };
    g.tong++; g[loai]++;
    if (loai === 'chua' && r.ten_cu?.trim()) g.tenCu++;
    theoCn.set(r.cn, g);
    if (loai !== 'co') {
      const k = `${cnTen.get(r.cn) ?? '(không chi nhánh)'} · ${r.lop ?? '(không lớp)'}`;
      lopThieu.set(k, (lopThieu.get(k) ?? 0) + 1);
    }
  }

  const dong = [...theoCn].map(([id, g]) => ({ id, cn: cnTen.get(id) ?? '(không chi nhánh)', ...g }))
    .sort((a, b) => a.cn.localeCompare(b.cn));
  const tong = dong.reduce((s, g) => ({ tong: s.tong + g.tong, co: s.co + g.co, chua: s.chua + g.chua, sai: s.sai + g.sai, tenCu: s.tenCu + g.tenCu }),
    { tong: 0, co: 0, chua: 0, sai: 0, tenCu: 0 });
  console.log('\nHọc viên đang học theo chi nhánh ("Chưa TVV" + "TVV sai" = việc TVV sẽ về QL chi nhánh sau SV-TVV)');
  console.table([...dong.map((g) => ({ 'Chi nhánh': g.cn, 'Đang học': g.tong, 'Có TVV': g.co, '% có': pt(g.co, g.tong), 'Chưa TVV': g.chua,
    '· có chữ TVV cũ': g.tenCu, 'TVV sai': g.sai, 'TVV hoạt động': soTvv.get(g.id) ?? 0, 'QL chi nhánh': soQl.get(g.id) ?? 0 })), { 'Chi nhánh': 'TỔNG', 'Đang học': tong.tong, 'Có TVV': tong.co, '% có': pt(tong.co, tong.tong), 'Chưa TVV': tong.chua,
    '· có chữ TVV cũ': tong.tenCu, 'TVV sai': tong.sai, 'TVV hoạt động': '', 'QL chi nhánh': '' }]);
  console.log('Chú thích: "có chữ TVV cũ" = ô TVV chữ (trước OV-2b) còn tên, chưa chọn người · "TVV sai" = người đã nghỉ / không còn vai TVV / khác chi nhánh của em.');
  console.log(`Mục tiêu (overhaul 07): ≥ 95 % em đang học có TVV, hoặc chủ SP chấp nhận phần còn lại về QL. Hiện: ${pt(tong.co, tong.tong)}.`);

  if (lopThieu.size) {
    console.log('\nLớp còn em chưa có TVV hợp lệ (gán ở lớp → Học viên → "Sửa thông tin" → cột TVV):');
    for (const [k, n] of [...lopThieu].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${k}: ${n} em`);
  }
} catch (e) {
  console.error(`[dem-tvv] ${e.message}`);
  process.exitCode = 1;
} finally {
  closeDb();
}
