/**
 * `npm run chay-thu:mon` — CHẠY THỬ CHỈ ĐỌC trước bước migrate của PR-MON (MH1, K5-29, Q5).
 *
 * Mở cùng database như `migrate/run.ts` nhưng KHÔNG gọi `migrate()` và không ghi gì — chỉ SELECT. In 4 mục:
 *   (1) GV sẽ đổi kỹ năng phụ trách được (cũ → mới) · (2) Case FOU có nguyên nhân kiểu IELTS (giữ mã, để biết) ·
 *   (3) số lớp Pre FOU (phải 0 trên bản chính) · (4) ô `writing` ở lớp FT trong `class_skills`/`teacher_assignments` (phải 0).
 */
import fs from 'node:fs';
import { DB_PATH, closeDb, db, isInitialised, laDbTuXa } from '../db.ts';
import { demCaseFouNguyenNhanIelts, keHoachDoiKyNang } from './prMon.ts';

const bang = (rows: any[]) => { if (rows.length) console.table(rows); else console.log('    (không có)'); };

console.log(`[chay-thu:mon] CHỈ ĐỌC — không nâng cấp, không ghi. Database: ${DB_PATH}`);

/* File cục bộ chưa có thì db() sẽ TẠO file rỗng — chạy thử không được để lại dấu vết, nên dừng trước khi mở. */
if (!laDbTuXa() && !fs.existsSync(DB_PATH)) {
  console.log('[chay-thu:mon] Không có file database ở đường dẫn trên — không có gì để chạy thử.');
  process.exit(0);
}
if (!isInitialised()) {
  console.log('[chay-thu:mon] Database chưa có bảng nào — không có gì để chạy thử.');
  closeDb();
  process.exit(0);
}

const conn = db();
const doi = keHoachDoiKyNang(conn);
console.log(`\n(1) ${doi.length} giáo viên sẽ đổi kỹ năng phụ trách được (Writing lớp thường → W1 + W2)`);
bang(doi.map((x) => ({ 'giáo viên': x.ten, 'cũ → mới': `${x.cu.join(', ')} → ${x.moi.join(', ')}` })));

const fou = demCaseFouNguyenNhanIelts(conn);
console.log(`\n(2) ${fou.soCase} Case lớp FOU có nguyên nhân kiểu IELTS (Writing/Speaking) — GIỮ NGUYÊN, chỉ để biết`);
bang(fou.mau.map((x) => ({ 'Case': x.caseId, 'học viên': x.hocVien, 'mã': x.ma })));

const preFou = (conn.prepare(`SELECT COUNT(*) AS n FROM classes WHERE programme_code = 'PREFOU'`).get() as any).n;
console.log(`\n(3) ${preFou} lớp Pre FOU${preFou ? ' — KHÁC 0: dừng, báo planning' : ' (đúng — phải 0)'}`);

const oW = (bangTen: string) => (conn.prepare(
  `SELECT COUNT(*) AS n FROM ${bangTen} x JOIN classes c ON c.id = x.class_id WHERE c.programme_code = 'FT' AND x.skill = 'writing'`,
).get() as any).n;
const w = { class_skills: oW('class_skills'), teacher_assignments: oW('teacher_assignments') };
console.log(`\n(4) Ô "writing" ở lớp FT: class_skills ${w.class_skills} · teacher_assignments ${w.teacher_assignments}`
  + (w.class_skills + w.teacher_assignments ? ' — KHÁC 0: báo planning' : ' (đúng — phải 0)'));

console.log('\n[chay-thu:mon] Xong — database không bị đổi.');
closeDb();
