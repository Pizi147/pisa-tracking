/**
 * KIỂM TRƯỚC LUAT-34 — CHỈ ĐỌC: liệt kê ô Mock "Không dự thi" cũ (`assessment_scores.no_show_cu = 1`, chưa có điểm) theo lớp / MT.
 * Sau LUAT-34 (luật 4 sửa 21/10): ô ở lượt MT cũ (`lich_su = 1`) hiện "Đã huỷ · vắng MT cũ" (khôi phục được: gỡ "-" hoặc Quản lý Khôi phục);
 * ô ở lượt MT hiện tại giữ chữ "Không dự thi" (dữ liệu cũ). Không migrate, không ghi câu nào — chủ SP xem trước khi deploy.
 *
 * Chạy (sau `npm run build:server`): `node scripts/kiem-truoc-luat-34.mjs`
 *   · file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso) · bản chính: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nap = (p) => import(pathToFileURL(path.join(GOC, 'dist-server/server/src', p)).href);
const { DB_PATH, closeDb, db } = await nap('db.js');
const { moTaDichDb } = await nap('moiTruong.js');

console.log(`[kiem-truoc-luat-34] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
try {
  const o = db().prepare(
    `SELECT COALESCE(c.code, '—') AS lop, a.attempt_no AS mt, a.lich_su, s.full_name AS em, sc.skill, COALESCE(rp.code, '—') AS tuan
       FROM assessment_scores sc
       JOIN assessment_attempts a ON a.id = sc.attempt_id AND a.kind = 'mock' AND a.status != 'cancelled'
       JOIN students s ON s.id = a.student_id
       LEFT JOIN classes c ON c.id = a.class_id
       LEFT JOIN report_periods rp ON rp.id = sc.no_show_period_id
      WHERE sc.no_show_cu = 1 AND sc.band IS NULL AND sc.raw_score IS NULL
      ORDER BY c.code, a.attempt_no, s.full_name, sc.skill`).all();
  const cu = o.filter((r) => r.lich_su), nay = o.filter((r) => !r.lich_su);
  console.log(`\nÔ Mock "Không dự thi" cũ: ${o.length} — MT cũ (sẽ hiện "Đã huỷ"): ${cu.length} · MT hiện tại (giữ "Không dự thi"): ${nay.length}`);
  for (const [ten, ds] of [['MT cũ → "Đã huỷ · vắng MT cũ"', cu], ['MT hiện tại → giữ "Không dự thi"', nay]]) {
    if (!ds.length) continue;
    console.log(`\n${ten}`);
    const nhom = new Map();
    for (const r of ds) {
      const k = `${r.lop} · MT${r.mt}`;
      nhom.set(k, [...(nhom.get(k) ?? []), `${r.em} ${r.skill} (${r.tuan})`]);
    }
    for (const [k, xs] of nhom) console.log(`  ${k}: ${xs.length} ô — ${xs.join('; ')}`);
  }
} catch (e) {
  console.error(`[kiem-truoc-luat-34] ${e.message}`);
  process.exitCode = 1;
} finally {
  closeDb();
}
