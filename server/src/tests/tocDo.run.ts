/**
 * PHÉP KIỂM ĐO (PR-TD, tốc độ trên Turso) — tiến trình RIÊNG, DATABASE RIÊNG (`data/test-tocdo.sqlite`), nối vào
 * `npm test` SAU `run.js` (Q5: cần bộ demo sạch và được nhân dữ liệu mà không làm hỏng dữ liệu của `run.js`).
 *
 * Việc 1: phép kiểm hạ tầng của `nguCanhRequest.ts` (Task 1 (a)–(f)) + mọi đường trong `DUONG_DO` trả đúng mã (g).
 * Việc 2 (Task 5): trần câu SQL + nhân dữ liệu — thêm sau khi Task 2–4 xong.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Vai } from './tocDoDuong.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
process.env.PISA_DB = path.join(ROOT, 'data', 'test-tocdo.sqlite');
for (const k of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'BAN_CHINH', 'PISA_CHO_PHEP_SEED_TURSO']) delete process.env[k];
for (const suffix of ['', '-wal', '-shm']) {
  const p = process.env.PISA_DB + suffix;
  if (fs.existsSync(p)) fs.rmSync(p);
}
/* PHẢI đặt TRƯỚC khi import db.ts (và mọi mã import db.ts): lộ chỗ sửa nhầm giá trị nhớ dùng chung trong request. */
process.env.PISA_DONG_BANG_NHO = '1';

const { db, closeDb } = await import('../db.ts');
const { runSeed } = await import('../seed/seed.ts');
const { createApp } = await import('../app.ts');
const { createSession } = await import('../auth.ts');
const {
  chayTrongRequest, nho, coNho, trongBoNho, soCauSql, demHienTai,
} = await import('../platform/nguCanhRequest.ts');
const { DUONG_DO } = await import('./tocDoDuong.ts');

runSeed();

let passed = 0;
const failures: string[] = [];
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e: any) {
    failures.push(`${name}: ${e.message}`);
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}
async function checkAsync(name: string, fn: () => Promise<void>) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e: any) {
    failures.push(`${name}: ${e.message}`);
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}
function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }

const conn = db();
const classId = (code: string) => (conn.prepare('SELECT id FROM classes WHERE code = ?').get(code) as any).id as number;

function userByRole(roleKey: string, branchCode: string | null) {
  const row = conn
    .prepare(
      `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
         LEFT JOIN branches b ON b.id = ur.branch_id
        WHERE r.key = ? AND ${branchCode ? 'b.code = ?' : 'ur.branch_id IS NULL'} ORDER BY ur.user_id LIMIT 1`,
    )
    .get(...(branchCode ? [roleKey, branchCode] : [roleKey])) as any;
  assert(row, `Seed thiếu tài khoản ${roleKey} của ${branchCode ?? 'toàn hệ thống'}`);
  return row.id as number;
}
/** Cùng luật `run.ts:subjectOnlyTeacherOf`: GVBM KHÔNG kiêm GVCN lớp đó. */
function subjectOnlyTeacherOf(classCode: string) {
  const cid = classId(classCode);
  const row = conn
    .prepare(
      `SELECT user_id AS id FROM teacher_assignments
        WHERE class_id = ? AND skill IS NOT NULL AND status='active'
          AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1)
        LIMIT 1`,
    )
    .get(cid, cid) as any;
  assert(row, `Seed thiếu giáo viên bộ môn không kiêm GVCN ở lớp ${classCode}`);
  return row.id as number;
}
function coreTeacherOf(classCode: string) {
  const row = conn
    .prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 LIMIT 1`)
    .get(classId(classCode)) as any;
  assert(row, `Seed thiếu GVCN của lớp ${classCode}`);
  return row.id as number;
}

const LOP_FT = classId('MB-FT 101');
const LOP_THUONG = classId('MB-FOU 12');
const CN = (conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(LOP_FT) as any).b as number;
const HV = (
  conn
    .prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`)
    .get(LOP_FT) as any
).id as number;
const KASE = (
  conn
    .prepare(
      `SELECT sc.id AS id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE COALESCE(sc.student_id, a.student_id) = ? ORDER BY sc.id LIMIT 1`,
    )
    .get(HV) as any
)?.id as number | undefined;
assert(KASE, `Seed thiếu Case cho HV mẫu (id ${HV}) ở lớp MB-FT 101 — DUONG_DO cần một Case thật`);

const USER: Record<Vai, number> = {
  QL: userByRole('manager', 'MB'),
  GVCN: coreTeacherOf('MB-FT 101'),
  GVBM: subjectOnlyTeacherOf('MB-FT 101'),
  GVCN_THUONG: coreTeacherOf('MB-FOU 12'),
  QT: userByRole('system_admin', null),
};

const server = createApp().listen(0);
const port = (server.address() as any).port as number;

function urlFor(mau: string): string {
  return mau
    .replace('{lopFT}', String(LOP_FT))
    .replace('{lopThuong}', String(LOP_THUONG))
    .replace('{hv}', String(HV))
    .replace('{case}', String(KASE))
    .replace('{cn}', String(CN));
}

async function callHttp(vai: Vai, method: string, url: string, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  headers.cookie = `pisa_demo_session=${createSession(USER[vai])}`;
  const res = await fetch(`http://127.0.0.1:${port}/api${url}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: unknown = null;
  try { json = await res.json(); } catch { /* không có thân */ }
  return { status: res.status, json };
}

/** Đếm câu SQL của MỘT lượt gọi HTTP — gọi TUẦN TỰ (không song song, để số không lẫn giữa các lượt gọi). */
async function doSql(vai: Vai, method: string, url: string): Promise<{ n: number; status: number }> {
  const truoc = soCauSql();
  const { status } = await callHttp(vai, method, url);
  const sau = soCauSql();
  return { n: sau - truoc, status };
}

// ==================================================================== Task 1 — hạ tầng nguCanhRequest.ts

check('PR-TD Task1(a) · nho() NGOÀI request không nhớ — tinh() chạy lại mỗi lần gọi', () => {
  let calls = 0;
  const tinh = () => { calls += 1; return calls; };
  const r1 = nho('kiem-a', tinh);
  const r2 = nho('kiem-a', tinh);
  assert(calls === 2 && r1 === 1 && r2 === 2, `Ngoài request phải tính lại mỗi lần gọi: calls=${calls}, r1=${r1}, r2=${r2}`);
});

check("PR-TD Task1(b) · nho() trong chayTrongRequest('GET') nhớ đúng một lần", () => {
  chayTrongRequest('GET', () => {
    let calls = 0;
    const tinh = () => { calls += 1; return 'gia-tri'; };
    const r1 = nho('kiem-b', tinh);
    const r2 = nho('kiem-b', tinh);
    assert(calls === 1 && r1 === r2, `Phải nhớ đúng một lần: calls=${calls}`);
  });
});

check("PR-TD Task1(c) · request 'POST' không mở bộ nhớ", () => {
  chayTrongRequest('POST', () => {
    assert(coNho() === false, 'coNho() phải false trong request POST');
    let calls = 0;
    const tinh = () => { calls += 1; return 'x'; };
    nho('kiem-c', tinh);
    nho('kiem-c', tinh);
    assert(calls === 2, `POST không nhớ nên tinh() phải chạy lại mỗi lần: calls=${calls}`);
  });
});

check('PR-TD Task1(d) · chạy run() trong request GET xoá bộ nhớ', () => {
  chayTrongRequest('GET', () => {
    let calls = 0;
    const tinh = () => { calls += 1; return conn.prepare('SELECT 1 AS x').get(); };
    nho('kiem-d', tinh);
    assert(calls === 1, 'Lần đầu phải tính');
    nho('kiem-d', tinh);
    assert(calls === 1, 'Lần hai (chưa ghi gì) phải lấy từ bộ nhớ, không tính lại');
    /* Một UPDATE vô hại: khoá không tồn tại nên không đổi dữ liệu nào, nhưng vẫn đi qua run(). */
    conn.prepare(`UPDATE demo_config SET value = value WHERE key = 'khong-ton-tai-pr-td'`).run();
    nho('kiem-d', tinh);
    assert(calls === 2, `run() trong kho GET phải xoá bộ nhớ nên tinh() phải chạy lại: calls=${calls}`);
  });
});

check('PR-TD Task1(e) · trongBoNho() ngoài request mở kho tạm rồi tự đóng; lồng trong GET thì dùng lại kho ngoài, câu SQL vẫn cộng vào dem của request', () => {
  assert(coNho() === false, 'Ngoài mọi request/trongBoNho(), coNho() phải false');
  let coNhoBenTrong = false as boolean;
  trongBoNho(() => {
    coNhoBenTrong = coNho();
    nho('kiem-e-tam', () => 1);
  });
  assert(coNhoBenTrong, 'Trong trongBoNho() phải coNho() === true');
  assert(coNho() === false, 'Ra khỏi trongBoNho() (gọi ngoài request) thì coNho() phải về false');

  chayTrongRequest('GET', () => {
    nho('kiem-e-dung-chung', () => 'gia-tri-goc');
    let thayGiaTriKhoNgoai: unknown;
    const dem = demHienTai();
    assert(dem, 'Phải có bộ đếm trong request GET');
    const truoc = dem!.n;
    trongBoNho(() => {
      /* Lồng trong GET: phải dùng lại đúng kho ngoài — thấy khoá đã đặt trước ở kho ngoài. */
      thayGiaTriKhoNgoai = nho('kiem-e-dung-chung', () => 'gia-tri-khac');
      conn.prepare('SELECT 1 AS x').get();
    });
    assert(thayGiaTriKhoNgoai === 'gia-tri-goc', 'trongBoNho() lồng trong GET phải dùng lại đúng kho ngoài');
    assert(dem!.n === truoc + 1, `Câu SQL chạy trong bộ nhớ tạm lồng trong GET phải cộng vào dem của request: trước=${truoc}, sau=${dem!.n}`);
  });
});

check('PR-TD Task1(f) · đếm câu: .all() = 1 câu, .get() = 1 câu (không đếm đôi qua iterate nội bộ của .all())', () => {
  const truoc = soCauSql();
  conn.prepare('SELECT 1 AS x').all();
  const sauAll = soCauSql();
  assert(sauAll === truoc + 1, `.all() phải đếm đúng 1 câu, đếm được ${sauAll - truoc}`);
  conn.prepare('SELECT 1 AS x').get();
  const sauGet = soCauSql();
  assert(sauGet === sauAll + 1, `.get() phải đếm đúng 1 câu, đếm được ${sauGet - sauAll}`);
});

const bangDo: string[] = [];
await checkAsync('PR-TD Task1(g) · mọi đường trong DUONG_DO × vai của nó trả 200 hoặc đúng mã chủ đích', async () => {
  const sai: string[] = [];
  for (const muc of DUONG_DO) {
    for (const vai of muc.vai) {
      const maMongDoi = muc.maChuDich?.[vai] ?? 200;
      const url = urlFor(muc.url);
      const { n, status } = await doSql(vai, 'GET', url);
      bangDo.push(`${vai} ${url} → ${status} (${n} câu)`);
      if (status !== maMongDoi) sai.push(`${vai} ${url} → ${status} (mong đợi ${maMongDoi})`);
    }
  }
  assert(sai.length === 0, `Có đường sai mã:\n${sai.join('\n')}`);
});

console.log('\nBảng đo (vai · url → mã HTTP · số câu SQL):');
for (const dong of bangDo) console.log(`  ${dong}`);

console.log('');
console.log('='.repeat(60));
if (failures.length === 0) {
  console.log(`TỐC ĐỘ: ${passed} KIỂM TRA ĐỀU ĐẠT`);
} else {
  console.log(`TỐC ĐỘ: ${passed} ĐẠT, ${failures.length} LỖI:`);
  for (const f of failures) console.log(`  - ${f}`);
}
console.log('='.repeat(60));

closeDb();
server.close();
process.exit(failures.length === 0 ? 0 : 1);
