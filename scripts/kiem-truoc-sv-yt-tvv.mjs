/**
 * KIỂM TRƯỚC SV-YT-TVV — CHỈ ĐỌC (không ghi câu nào). Sau PR, mỗi lần LƯU xử lý vi phạm sinh việc "Báo PH" cho TVV của em; em chưa có TVV →
 * việc về QL chi nhánh. Lần xử lý đã lưu / đang chờ QL duyệt TRƯỚC khi bật KHÔNG sinh việc (không migrate dữ liệu). Liệt kê:
 *   1. em đang học CHƯA có TVV theo chi nhánh (việc Báo PH sẽ về QL) — gán TVV trước khi bật (DATA-TVV);
 *   2. lần xử lý đang chờ QL duyệt / đã lưu 5 ngày gần đây — không có việc Báo PH (trước ngày bật).
 * Không việc nào đang mở bị chuyển người (bảng việc mới, rỗng lúc bật).
 *
 * Chạy (sau `npm run build:server`): `node scripts/kiem-truoc-sv-yt-tvv.mjs`
 *   · file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso) · bản chính: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nap = (p) => import(pathToFileURL(path.join(GOC, 'dist-server/server/src', p)).href);
const { DB_PATH, closeDb, db } = await nap('db.js');
const { moTaDichDb } = await nap('moiTruong.js');
const { demoToday } = await nap('demoConfig.js');

console.log(`[kiem-truoc-sv-yt-tvv] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
try {
  const homNay = demoToday();
  const coBang = !!db().prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'viec_bao_ph'").get();
  console.log(`\nHôm nay ${homNay}. Bảng viec_bao_ph: ${coBang ? `có, ${db().prepare('SELECT COUNT(*) AS n FROM viec_bao_ph').get().n} việc` : 'chưa có (migrate tạo khi deploy)'} — việc đang mở bị chuyển người: 0.`);
  const thieu = db().prepare(
    `SELECT COALESCE(b.code, '—') AS cn, COUNT(DISTINCT s.id) AS n, GROUP_CONCAT(DISTINCT s.full_name) AS ten
       FROM students s LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN branches b ON b.id = COALESCE(c.branch_id, s.branch_id)
      WHERE s.status = 'active' AND s.archived_at IS NULL AND s.consultant_user_id IS NULL GROUP BY cn ORDER BY cn`).all();
  console.log(`\n1. Em đang học chưa có TVV (việc Báo PH sẽ về QL chi nhánh): ${thieu.reduce((t, r) => t + r.n, 0)}`);
  for (const r of thieu) console.log(`  ${r.cn}: ${r.n} em — ${String(r.ten ?? '').split(',').slice(0, 8).join('; ')}${r.n > 8 ? '; …' : ''}`);
  const cu = db().prepare(
    `SELECT m.id, m.status, m.kind, s.full_name AS em, COALESCE(c.code, '—') AS lop, substr(m.created_at, 1, 10) AS ngay
       FROM discipline_measures m JOIN students s ON s.id = m.student_id LEFT JOIN classes c ON c.id = m.class_id
      WHERE (m.status = 'cho_duyet' OR (m.status IN ('done', 'da_duyet') AND substr(m.created_at, 1, 10) >= date(?, '-4 day')))
        ${coBang ? 'AND NOT EXISTS (SELECT 1 FROM viec_bao_ph v WHERE v.measure_id = m.id)' : ''}
      ORDER BY m.status, lop, em`).all(homNay);
  console.log(`\n2. Lần xử lý trước ngày bật — KHÔNG sinh việc Báo PH: ${cu.length}`);
  for (const r of cu) console.log(`  ${r.status === 'cho_duyet' ? 'chờ QL duyệt' : 'đã lưu'} · ${r.lop} · ${r.em} · ${r.kind} · ${r.ngay} (lần ${r.id})`);
} catch (e) {
  console.error(`[kiem-truoc-sv-yt-tvv] ${e.message}`);
  process.exitCode = 1;
} finally {
  closeDb();
}
