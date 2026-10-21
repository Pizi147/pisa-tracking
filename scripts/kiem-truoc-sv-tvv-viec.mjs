/**
 * KIỂM TRƯỚC SV-TVV-VIEC — CHỈ ĐỌC (không ghi câu nào). Liệt kê việc ĐANG MỞ bị chuyển người khi bật PR:
 *   1. Cập nhật KQ thi thật: GVCN lớp cuối → TVV của em (em chưa có TVV → QL chi nhánh), BỎ hạn;
 *   2. Chốt ngày thi: GVCN lớp đang học → TVV / QL;
 *   3. Chọn bước tiếp: mọi QL + TVV chi nhánh → MỘT người giữ (TVV / QL); hạn mới = muộn hơn của (hạn gốc, ngày có KQ + 7);
 *   4. "Thiếu" chỉ còn 4 trường (Ngày sinh · Email · Tuần bắt đầu · Target FT) — số em thiếu theo người giữ việc Bổ sung hồ sơ.
 *
 * Chạy (sau `npm run build:server`): `node scripts/kiem-truoc-sv-tvv-viec.mjs`
 *   · file cục bộ: `$env:PISA_DB` = đường dẫn file (không biến Turso) · bản chính: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (TRIEN_KHAI.md §7.2).
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nap = (p) => import(pathToFileURL(path.join(GOC, 'dist-server/server/src', p)).href);
const { DB_PATH, closeDb, db } = await nap('db.js');
const { moTaDichDb } = await nap('moiTruong.js');
const { demoToday } = await nap('demoConfig.js');
const { loTrinhChoKetQuaThi } = await nap('loTrinh/thiThat.js');
const { choBuocTiep } = await nap('loTrinh/buocTiep.js');
const { missingForStudent } = await nap('classes/schedule.js');
const { examPlanOf } = await nap('fasttrack/cycles.js');
const d = await import(pathToFileURL(path.join(GOC, 'dist-server/shared/domain/index.js')).href);

console.log(`[kiem-truoc-sv-tvv-viec] Đích: ${moTaDichDb(DB_PATH)} — CHỈ ĐỌC, không sửa gì`);
try {
  const homNay = demoToday();
  const conn = db();
  const em = new Map(conn.prepare(
    `SELECT s.id, s.full_name AS ten, s.consultant_user_id AS tvv, u.full_name AS ten_tvv, b.code AS cn
       FROM students s LEFT JOIN users u ON u.id = s.consultant_user_id LEFT JOIN branches b ON b.id = s.branch_id`).all().map((r) => [r.id, r]));
  const gvcn = (classId) => (classId ? conn.prepare(
    `SELECT u.full_name AS ten FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id WHERE ta.class_id = ? AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id LIMIT 1`).get(classId)?.ten : null) ?? '— (QL)';
  const moi = (sid) => { const e = em.get(sid); return e?.tvv ? `TVV ${e.ten_tvv}` : `QL chi nhánh ${e?.cn ?? '—'}`; };

  const kq = loTrinhChoKetQuaThi(homNay);
  console.log(`\nHôm nay ${homNay}.\n\n1. Cập nhật KQ thi thật đang mở: ${kq.length} — GVCN → người giữ mới, bỏ hạn`);
  for (const { c, s } of kq) console.log(`  ${em.get(c.student_id)?.ten} · thi ${s.ngayThi ?? '—'} · hạn cũ ${s.hanGoc ?? '—'} · ${gvcn(c.class_id)} → ${moi(c.student_id)} (lộ trình ${c.id})`);

  const chot = conn.prepare(
    `SELECT s.id, e.class_id, cy.id AS cycle_id, cy.exam_month, cy.exam_date, cy.thi_that_ngay, cy.exam_period_id, rp.week_start AS exam_week_start, rp.code AS exam_week_code
       FROM learning_cycles cy JOIN students s ON s.id = cy.student_id AND s.status = 'active' AND s.archived_at IS NULL
       JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
       LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
      WHERE cy.status = 'active' AND cy.route IS NOT NULL AND cy.exam_date IS NULL AND cy.thi_that_ngay IS NULL AND (cy.exam_month IS NOT NULL OR cy.exam_period_id IS NOT NULL)
        AND COALESCE(cy.thi_that_khong_thi, 0) = 0 AND cy.outcome_score IS NULL AND COALESCE(cy.outcome, 'unknown') = 'unknown'`).all()
    .filter((r) => d.trangThaiLichThi(r, examPlanOf(r), homNay).trangThai === 'chua-chot-ngay');
  console.log(`\n2. Chốt ngày thi đang mở: ${chot.length} — GVCN → người giữ mới`);
  for (const r of chot) console.log(`  ${em.get(r.id)?.ten} · dự kiến ${r.exam_week_code ?? r.exam_month} · ${gvcn(r.class_id)} → ${moi(r.id)} (lộ trình ${r.cycle_id})`);

  const bt = choBuocTiep();
  console.log(`\n3. Chọn bước tiếp đang mở: ${bt.length} — mọi QL + TVV chi nhánh → một người giữ`);
  for (const c of bt) {
    const h = d.trangThaiSauThi(c, homNay);
    console.log(`  ${c.ten} · ${c.class_code ?? '—'} · ngày có KQ ${c.ngay_kq ?? '—'} · hạn mới ${h.han ?? '—'}${h.quaHan ? ' (quá hạn)' : ''} → ${moi(c.student_id)} (lộ trình ${c.id})`);
  }

  const hs = conn.prepare(
    `SELECT s.id, s.dob, s.email, c.is_fast_track, cy.id AS cycle_id, cy.start_period_id, cy.target_score
       FROM students s JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id AND x.status = 'active')
       JOIN classes c ON c.id = e.class_id LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE s.status = 'active' AND s.archived_at IS NULL`).all();
  const nhom = new Map();
  for (const r of hs) {
    const t = missingForStudent({ cycle: r.cycle_id ? { start_period_id: r.start_period_id, target_score: r.target_score } : null, student: { dob: r.dob, email: r.email }, isFastTrack: !!r.is_fast_track });
    if (!t.length) continue;
    const k = moi(r.id);
    const g = nhom.get(k) ?? { n: 0, truong: {} };
    g.n += 1; for (const m of t) g.truong[m.label] = (g.truong[m.label] ?? 0) + 1;
    nhom.set(k, g);
  }
  console.log(`\n4. Bổ sung hồ sơ thiếu (4 trường): ${[...nhom.values()].reduce((s, g) => s + g.n, 0)} em đang học`);
  for (const [k, g] of nhom) console.log(`  ${k}: ${g.n} em — ${Object.entries(g.truong).map(([a, b]) => `${a} ${b}`).join(' · ')}`);
} catch (e) {
  console.error(`[kiem-truoc-sv-tvv-viec] ${e.message}`);
  process.exitCode = 1;
} finally {
  closeDb();
}
