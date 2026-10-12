/**
 * PHÉP KIỂM TRÊN TURSO GIẢ (fix-tx-turso-savepoint) — tiến trình RIÊNG, nối vào `npm test` sau `tocDo.run.js`.
 *
 * Lỗi `no such savepoint: sp_1` chỉ có khi libsql NỐI MẠNG (Hrana); file SQLite cục bộ không bị nên `run.js` không bắt được. Phép kiểm này dựng
 * `sqld` (máy chủ của Turso) trên cổng cục bộ rồi chạy mã THẬT của `db.ts` qua Hrana. Tìm sqld: biến `SQLD_BIN`, rồi `node_modules/@sqld/linux-x64/sqld`
 * (cài bằng `npm i --no-save @sqld/linux-x64` trên Linux), rồi `sqld` trong PATH. KHÔNG có sqld → in SKIP và thoát 0 (không làm `npm run check` đỏ).
 * `PISA_SQLD_THU_FILE=1`: chạy cùng kịch bản trên FILE cục bộ (không cần sqld) — chỉ để thử chính kịch bản; không chứng minh gì về Hrana.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CHE_DO_FILE = process.env.PISA_SQLD_THU_FILE === '1';

function timSqld(): string | null {
  const ung = [process.env.SQLD_BIN, path.join(ROOT, 'node_modules', '@sqld', 'linux-x64', 'sqld')];
  for (const p of ung) if (p && fs.existsSync(p)) return p;
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['sqld'], { encoding: 'utf8' });
  const dong = r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : '';
  return dong || null;
}

/* Seed demo dựng lịch theo ngày giả (`demo_date`), nhưng khi có TURSO_DATABASE_URL thì `laBanChinh()` bỏ qua `demo_date` và seed hỏng. Nên seed
   trên FILE trong một tiến trình con (không có biến Turso), rồi chép file đó vào thư mục dữ liệu của sqld. Không đổi `laBanChinh()`. */
const FILE_SEED = process.env.PISA_SQLD_FILE_SEED;
if (FILE_SEED) {
  process.env.PISA_DB = FILE_SEED;
  for (const k of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'BAN_CHINH', 'PISA_CHO_PHEP_SEED_TURSO']) delete process.env[k];
  const { runSeed } = await import('../seed/seed.ts');
  const { db, closeDb } = await import('../db.ts');
  runSeed();
  db().pragma('wal_checkpoint(TRUNCATE)');   // dữ liệu còn nằm trong file -wal; không gộp thì chép mỗi file chính sẽ mất hết
  closeDb();
  process.exit(0);
}

const sqld = CHE_DO_FILE ? null : timSqld();
if (!CHE_DO_FILE && (!sqld || process.platform === 'win32')) {
  console.log('SQLD: BỎ QUA — không có sqld trên máy này (đặt SQLD_BIN, hoặc `npm i --no-save @sqld/linux-x64` trên Linux). Các ca Hrana chưa được chạy.');
  process.exit(0);
}

const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), 'z2-sqld-'));
let tienTrinh: ChildProcess | null = null;
const don = () => { try { tienTrinh?.kill(); } catch { /* đã tắt */ } try { fs.rmSync(thuMuc, { recursive: true, force: true }); } catch { /* ignore */ } };
process.on('exit', don);

if (CHE_DO_FILE) {
  process.env.PISA_DB = path.join(thuMuc, 'thu.sqlite');
  for (const k of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'BAN_CHINH', 'PISA_CHO_PHEP_SEED_TURSO']) delete process.env[k];
} else {
  const fileSeed = path.join(thuMuc, 'seed.sqlite');
  const con = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, PISA_SQLD_FILE_SEED: fileSeed }, stdio: 'inherit' });
  if (con.status !== 0) { console.log('SQLD: seed trên file hỏng'); process.exit(1); }
  const thuMucDb = path.join(thuMuc, 'data.sqld', 'dbs', 'default');
  fs.mkdirSync(thuMucDb, { recursive: true });
  fs.copyFileSync(fileSeed, path.join(thuMucDb, 'data'));
  const cong = await new Promise<number>((ok) => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = (s.address() as net.AddressInfo).port; s.close(() => ok(p)); }); });
  tienTrinh = spawn(sqld!, ['--db-path', path.join(thuMuc, 'data.sqld'), '--http-listen-addr', `127.0.0.1:${cong}`], { stdio: 'ignore' });
  let san = false;
  for (let i = 0; i < 100 && !san; i++) {
    try { san = (await fetch(`http://127.0.0.1:${cong}/health`)).ok; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  if (!san) { console.log('SQLD: sqld không lên được trong 10 giây'); process.exit(1); }
  process.env.TURSO_DATABASE_URL = `http://127.0.0.1:${cong}`;
  process.env.TURSO_AUTH_TOKEN = 'thu';
  process.env.PISA_CHO_PHEP_SEED_TURSO = '127.0.0.1';
  delete process.env.BAN_CHINH;
}

const dbMod = await import('../db.ts');
const { db, tx, closeDb } = dbMod;
const { createApp } = await import('../app.ts');
const { createSession } = await import('../auth.ts');
const { writeAudit } = await import('../platform/audit.ts');
const { loadPrincipal } = await import('../permissions.ts');
const week = await import('../platform/week.ts');
const intake = await import('../classes/intake.ts');

if (CHE_DO_FILE) (await import('../seed/seed.ts')).runSeed();
const conn = db();

let passed = 0;
const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e: any) { failures.push(`${name}: ${e.message}`); console.log(`  ✗ ${name}\n      ${e.message}`); }
}
function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }
const ngu = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const so = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as { n: number }).n;

console.log(`\nSQLD · giao dịch qua ${CHE_DO_FILE ? 'FILE cục bộ (chỉ thử kịch bản)' : 'Hrana (sqld)'}`);
conn.exec('CREATE TABLE IF NOT EXISTS zz_tx (id INTEGER PRIMARY KEY, v TEXT NOT NULL)');
const them = (v: string) => db().prepare('INSERT INTO zz_tx (v) VALUES (?)').run(v);
const dem = (tien: string) => so('SELECT COUNT(*) AS n FROM zz_tx WHERE v LIKE ?', `${tien}%`);

await check('(a) câu INSERT chạy lẻ ngoài giao dịch, rồi tx() lồng chạy lại đúng câu đó + câu ghi khác → commit đủ, không "no such savepoint"', () => {
  them('a-le');
  tx(() => {
    them('a-1');
    tx(() => { them('a-2'); db().prepare('UPDATE zz_tx SET v = ? WHERE v = ?').run('a-2b', 'a-2'); });
    them('a-3');
  });
  assert(dem('a-') === 4 && dem('a-2b') === 1, `Số dòng a-: ${dem('a-')}`);
});

await check('(b) như (a) nhưng fn() ném lỗi giữa chừng → KHÔNG dòng nào được ghi (không commit lẻ); lỗi gốc được ném', () => {
  them('b-le');
  let loi: any = null;
  try {
    tx(() => {
      them('b-1');
      tx(() => { them('b-2'); throw new Error('lỗi giả giữa chừng'); });
    });
  } catch (e) { loi = e; }
  assert(loi && /lỗi giả giữa chừng/.test(loi.message), `Lỗi ném ra: ${loi?.message}`);
  assert(dem('b-') === 1, `Chỉ được còn dòng ghi lẻ b-le, thực tế ${dem('b-')} dòng`);
  assert(!conn.inTransaction, 'Giao dịch còn mở');
});

await check('(b2) giao dịch bị mất giữa chừng (fn tự COMMIT) → tx() ném lỗi rõ, không trả như đã ghi thành công', () => {
  let loi: any = null;
  const log = console.error; let ghi = '';
  console.error = (...a: unknown[]) => { ghi += a.join(' '); };
  try { tx(() => { them('b2-1'); conn.exec('COMMIT'); }); } catch (e) { loi = e; } finally { console.error = log; }
  assert(loi && /bị mất giữa chừng/.test(loi.message) && /\[tx\]/.test(ghi), `lỗi=${loi?.message} log=${ghi}`);
});

const may = createApp().listen(0);
const cong = (may.address() as net.AddressInfo).port;
const idQuanLy = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'manager' ORDER BY ur.user_id LIMIT 1`).get() as any).id as number;
let cookieSan = '';   // (d) lấy phiên TRƯỚC khi chờ: createSession chạy trong tiến trình thử, không phải trong request, nên không được đụng luồng đã hết hạn
const goi = async (method: string, url: string, body?: unknown) => {
  const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
    method, headers: { 'content-type': 'application/json', cookie: cookieSan || `pisa_demo_session=${createSession(idQuanLy)}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null; try { json = await res.json(); } catch { /* không có thân */ }
  return { status: res.status, json };
};

await check('(c) writeAudit lẻ rồi POST /ke-hoach-test/xep-moi (MT mới, 4 kỹ năng cùng tuần) → 200, đúng 1 lượt mới', async () => {
  const p = loadPrincipal(idQuanLy);
  const lop = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as any).id as number;
  const hv = intake.commitIntake(loadPrincipal((conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'system_admin' LIMIT 1`).get() as any).id),
    { classId: lop, rows: [{ fullName: 'SQLD Em Mới', target: 6.5, startWeek: week.mondayOf(new Date().toISOString().slice(0, 10)), email: 'sqld@demo.test', dob: '2010-01-01' }] });
  const sid = hv.studentIds[0] as number;
  const truoc = so('SELECT COUNT(*) AS n FROM assessment_attempts WHERE student_id = ?', sid);
  const tuan = week.ensurePeriod(week.mondayOf(new Date(Date.now() + 210 * 864e5).toISOString().slice(0, 10))).id;
  writeAudit({ actorUserId: p.userId, action: 'attempt.cancel_part', entityType: 'student', entityId: sid });   // ghi lẻ, prepare ngoài giao dịch
  const r = await goi('POST', '/ke-hoach-test/xep-moi', { studentId: sid, tuan: { listening: tuan, reading: tuan, writing: tuan, speaking: tuan }, force: true });
  assert(r.status === 200, `${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  const sau = so('SELECT COUNT(*) AS n FROM assessment_attempts WHERE student_id = ?', sid);
  assert(sau === truoc + 1, `Số lượt ${truoc} → ${sau}`);
});

await check('(d) kết nối bỏ không > 10 giây rồi gọi lại → không 500 vĩnh viễn (luồng hết hạn được mở lại)', async () => {
  cookieSan = `pisa_demo_session=${createSession(idQuanLy)}`;
  ngu(11_000);
  const r1 = await goi('GET', '/ref/branches');
  const r2 = await goi('GET', '/ref/branches');
  assert(r1.status === 200 && r2.status === 200, `lần 1: ${r1.status} ${JSON.stringify(r1.json).slice(0, 120)} · lần 2: ${r2.status}`);
});

console.log('\n' + '='.repeat(60));
console.log(failures.length === 0 ? `SQLD: ${passed} KIỂM TRA ĐỀU ĐẠT` : `SQLD: ${passed} ĐẠT, ${failures.length} LỖI:\n  - ${failures.join('\n  - ')}`);
console.log('='.repeat(60));
may.close();
closeDb();
process.exit(failures.length === 0 ? 0 : 1);
