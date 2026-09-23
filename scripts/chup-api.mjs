#!/usr/bin/env node
/**
 * CHỤP JSON MỌI ĐƯỜNG (vai × url) TRONG `DUONG_DO`, trên MỘT CÂY MÃ BẤT KỲ ĐÃ BUILD — kể cả `origin/main` chưa có
 * PR-TD (PR-TD, tốc độ trên Turso, Task 1 bước 7). Dùng để so JSON trước/sau (Task 6): kết quả mọi đường phải
 * GIỐNG HỆT trước và sau khi gộp truy vấn.
 *
 *   node scripts/chup-api.mjs --cay <thư mục gốc cây> --ra <file.json> [--so <file cũ>] [--db <file.sqlite>] [--khong-seed]
 *
 * `DUONG_DO` LUÔN lấy từ dist-server của NHÁNH NÀY (nơi chứa script này) — không phải của `--cay` — để một cây cũ
 * (chưa có PR-TD, thậm chí chưa có Pa/Qa/Rc1) vẫn được gọi đúng bộ đường đang đo hiện tại.
 *
 * KHÔNG dùng bộ đếm câu SQL của PR-TD (`nguCanhRequest.ts`) — cây đang chụp có thể CHƯA có file đó. Tự vá prototype
 * câu lệnh `libsql` CỦA CHÍNH CÂY ĐANG CHỤP (không phải libsql của nhánh này) để đếm `get`/`run`/`iterate`, giống hệt
 * cách đếm ở `db.ts`/`nguCanhRequest.ts`: không đếm `all` (libsql cho `all()` tự gọi lại `iterate()`).
 *
 * SO HAI LẦN CHỤP ĐỘC LẬP TRÊN HAI DATABASE SEED RIÊNG SẼ LỆCH GIẢ: một số bản ghi seed (ví dụ Việc cần làm —
 * `meetingSvc.listTasks`) ghi `createdAt` bằng `new Date()` NGAY LÚC SEED — hai lượt `runSeed()` cách nhau vài giây
 * ra hai giờ khác nhau dù mã hệt nhau (đã tự bắt gặp lúc thử công cụ này). Muốn so JSON CHẮC CHẮN đúng (Task 6):
 * chụp mốc CŨ với `--db <file dùng chung> --ra moc.json` (seed một lần), rồi chụp bản MỚI với CÙNG
 * `--db <file dùng chung> --khong-seed --ra moi.json --so moc.json` — cả hai đọc chung một lượt seed, không lệch giờ.
 */
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

function argVal(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}

const cay = argVal('--cay');
const ra = argVal('--ra');
const so = argVal('--so');
const dbChiDinh = argVal('--db');
const khongSeed = process.argv.includes('--khong-seed');
if (!cay || !ra) {
  console.error('Dùng: node scripts/chup-api.mjs --cay <thư mục gốc cây> --ra <file.json> [--so <file cũ>] [--db <file.sqlite>] [--khong-seed]');
  process.exit(1);
}
if (khongSeed && !dbChiDinh) {
  console.error('--khong-seed chỉ dùng được cùng --db <file.sqlite> (đọc lại đúng dữ liệu đã seed lần trước).');
  process.exit(1);
}

const NHANH_NAY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cayAbs = path.resolve(cay);
const duongCay = (...p) => pathToFileURL(path.join(cayAbs, ...p)).href;
const duongNhanhNay = (...p) => pathToFileURL(path.join(NHANH_NAY, ...p)).href;

// ---------------------------------------------------------------- Database riêng (tmpdir mặc định, hoặc --db), không Turso
process.env.PISA_DB = dbChiDinh ? path.resolve(dbChiDinh) : path.join(os.tmpdir(), `pisa-chup-api-${Date.now()}-${process.pid}.sqlite`);
for (const k of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'BAN_CHINH', 'PISA_CHO_PHEP_SEED_TURSO']) delete process.env[k];
if (!khongSeed) {
  for (const suffix of ['', '-wal', '-shm']) {
    const p = process.env.PISA_DB + suffix;
    if (fs.existsSync(p)) fs.rmSync(p);
  }
}

// ---------------------------------------------------------------- Tự vá libsql CỦA CÂY ĐANG CHỤP để đếm câu SQL
let soCauHienTai = 0;
{
  const libsqlCuaCay = path.join(cayAbs, 'node_modules', 'libsql', 'index.js');
  const specifier = fs.existsSync(libsqlCuaCay) ? pathToFileURL(libsqlCuaCay).href : 'libsql';
  const { default: Database } = await import(specifier);
  const tam = new Database(':memory:');
  const proto = Object.getPrototypeOf(tam.prepare('SELECT 1'));
  tam.close();
  /* KHÔNG vá `all` — nó tự gọi lại `iterate()` trong libsql, đếm cả hai là đếm đôi cùng một câu (xem db.ts). */
  for (const ten of ['run', 'iterate', 'get']) {
    const goc = proto[ten];
    proto[ten] = function (...args) { soCauHienTai += 1; return goc.apply(this, args); };
  }
}

// ---------------------------------------------------------------- Dựng app + seed của cây đang chụp
const { runSeed } = await import(duongCay('dist-server/server/src/seed/seed.js'));
const { createApp } = await import(duongCay('dist-server/server/src/app.js'));
const { createSession } = await import(duongCay('dist-server/server/src/auth.js'));
const dbMod = await import(duongCay('dist-server/server/src/db.js'));

if (!khongSeed) runSeed();
const conn = dbMod.db();

// ---------------------------------------------------------------- DUONG_DO của NHÁNH NÀY (không phải của cây đang chụp)
const { DUONG_DO } = await import(duongNhanhNay('dist-server/server/src/tests/tocDoDuong.js'));

// ---------------------------------------------------------------- Vai → userId thật trên bộ demo vừa seed
const classId = (code) => conn.prepare('SELECT id FROM classes WHERE code = ?').get(code).id;
function userByRole(roleKey, branchCode) {
  const row = conn
    .prepare(
      `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
         LEFT JOIN branches b ON b.id = ur.branch_id
        WHERE r.key = ? AND ${branchCode ? 'b.code = ?' : 'ur.branch_id IS NULL'} ORDER BY ur.user_id LIMIT 1`,
    )
    .get(...(branchCode ? [roleKey, branchCode] : [roleKey]));
  if (!row) throw new Error(`Seed thiếu tài khoản ${roleKey} của ${branchCode ?? 'toàn hệ thống'}`);
  return row.id;
}
function subjectOnlyTeacherOf(classCode) {
  const cid = classId(classCode);
  const row = conn
    .prepare(
      `SELECT user_id AS id FROM teacher_assignments
        WHERE class_id = ? AND skill IS NOT NULL AND status='active'
          AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1)
        LIMIT 1`,
    )
    .get(cid, cid);
  if (!row) throw new Error(`Seed thiếu giáo viên bộ môn không kiêm GVCN ở lớp ${classCode}`);
  return row.id;
}
function coreTeacherOf(classCode) {
  const row = conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 LIMIT 1`).get(classId(classCode));
  if (!row) throw new Error(`Seed thiếu GVCN của lớp ${classCode}`);
  return row.id;
}

const LOP_FT = classId('MB-FT 101');
const LOP_THUONG = classId('MB-FOU 12');
const CN = conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(LOP_FT).b;
const HV = conn
  .prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`)
  .get(LOP_FT).id;
const KASE = conn
  .prepare(
    `SELECT sc.id AS id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE COALESCE(sc.student_id, a.student_id) = ? ORDER BY sc.id LIMIT 1`,
  )
  .get(HV)?.id;

const USER = {
  QL: userByRole('manager', 'MB'),
  GVCN: coreTeacherOf('MB-FT 101'),
  GVBM: subjectOnlyTeacherOf('MB-FT 101'),
  GVCN_THUONG: coreTeacherOf('MB-FOU 12'),
  QT: userByRole('system_admin', null),
};

function urlFor(mau) {
  return mau
    .replace('{lopFT}', String(LOP_FT))
    .replace('{lopThuong}', String(LOP_THUONG))
    .replace('{hv}', String(HV))
    .replace('{case}', String(KASE ?? ''))
    .replace('{cn}', String(CN));
}

const server = createApp().listen(0);
const port = server.address().port;

async function callHttp(vai, url) {
  const headers = { 'content-type': 'application/json', cookie: `pisa_demo_session=${createSession(USER[vai])}` };
  const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { method: 'GET', headers });
  let json = null;
  try { json = await res.json(); } catch { /* không có thân */ }
  return { status: res.status, json };
}

// ---------------------------------------------------------------- Gọi tuần tự mọi (đường × vai), chụp lại
const ketQua = [];
for (const muc of DUONG_DO) {
  for (const vai of muc.vai) {
    const url = urlFor(muc.url);
    const truoc = soCauHienTai;
    // eslint-disable-next-line no-await-in-loop
    const { status, json } = await callHttp(vai, url);
    const soCau = soCauHienTai - truoc;
    ketQua.push({ vai, url, status, soCau, body: json });
  }
}

fs.writeFileSync(ra, JSON.stringify(ketQua, null, 2), 'utf8');
console.log(`Đã chụp ${ketQua.length} mục (vai × url) từ cây ${cayAbs} → ${ra}`);

// ---------------------------------------------------------------- So với file cũ, nếu có
if (so) {
  const cu = JSON.parse(fs.readFileSync(so, 'utf8'));
  const cuByKey = new Map(cu.map((r) => [`${r.vai} ${r.url}`, r]));
  const lech = [];
  const bangSoCau = [];
  for (const moi of ketQua) {
    const key = `${moi.vai} ${moi.url}`;
    const cuMuc = cuByKey.get(key);
    if (!cuMuc) { lech.push(`${key}: KHÔNG có trong file cũ`); continue; }
    if (cuMuc.status !== moi.status) lech.push(`${key}: mã khác — cũ ${cuMuc.status}, mới ${moi.status}`);
    try {
      assert.deepStrictEqual(moi.body, cuMuc.body);
    } catch {
      lech.push(`${key}: JSON khác nhau`);
    }
    bangSoCau.push(`${key} → ${cuMuc.soCau} → ${moi.soCau}`);
  }
  console.log('\nBảng số câu SQL (cũ → mới):');
  for (const dong of bangSoCau) console.log(`  ${dong}`);
  if (lech.length) {
    console.log(`\n${lech.length} MỤC LỆCH:`);
    for (const d of lech) console.log(`  ✗ ${d}`);
  } else {
    console.log(`\nMọi mục (${ketQua.length}) GIỐNG HỆT file cũ.`);
  }
}

server.close();
if (dbMod.closeDb) dbMod.closeDb();
process.exit(0);
