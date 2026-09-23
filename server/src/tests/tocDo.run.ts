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
const { loadPrincipal, can, napTruocPhamVi, scopeFor } = await import('../permissions.ts');
const { PERMISSIONS } = await import('../../../shared/domain/index.ts');
const { listCases } = await import('../cases/cases.ts');
const { DUONG_DO, TRAN } = await import('./tocDoDuong.ts');

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
/** Quản lý chi nhánh CP — dùng riêng ở Task 2 phép kiểm (c)/(e) (chi nhánh KHÁC với MB của mọi vai trên). */
const QL_CP = userByRole('manager', 'CP');

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

async function callHttpUser(userId: number, method: string, url: string, body?: unknown) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  headers.cookie = `pisa_demo_session=${createSession(userId)}`;
  const res = await fetch(`http://127.0.0.1:${port}/api${url}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* không có thân */ }
  return { status: res.status, json };
}

async function callHttp(vai: Vai, method: string, url: string, body?: unknown) {
  return callHttpUser(USER[vai], method, url, body);
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

// ==================================================================== Task 2 — quyền & ngày nghiệp vụ qua bộ nhớ

const TOAN_BO_HV = (conn.prepare('SELECT id FROM students').all() as any[]).map((r) => r.id as number);
const TOAN_BO_LOP = (conn.prepare('SELECT id FROM classes').all() as any[]).map((r) => r.id as number);
const TOAN_BO_TK = (conn.prepare(`SELECT id FROM users WHERE approval_state = 'approved'`).all() as any[]).map((r) => r.id as number);
const PRINCIPAL_CUA = new Map<number, ReturnType<typeof loadPrincipal>>();
for (const uid of TOAN_BO_TK) PRINCIPAL_CUA.set(uid, loadPrincipal(uid));

check('PR-TD Task2(a) · can(p, q, {studentId}) trong kho GET sau napTruocPhamVi(mọi HV) bằng HỆT ngoài kho — mọi tài khoản × mọi HV × 4 quyền chính', () => {
  const QUYEN = [PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.STUDENT_VIEW, PERMISSIONS.SOS_REPORT, PERMISSIONS.STUDENT_EDIT];
  const doiChieu = new Map<string, boolean>();
  for (const uid of TOAN_BO_TK) {
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const sid of TOAN_BO_HV) {
      for (const q of QUYEN) doiChieu.set(`${uid}|${sid}|${q}`, can(p, q, { studentId: sid }));
    }
  }
  chayTrongRequest('GET', () => {
    napTruocPhamVi(TOAN_BO_HV);
    const saiLech: string[] = [];
    for (const uid of TOAN_BO_TK) {
      const p = PRINCIPAL_CUA.get(uid)!;
      for (const sid of TOAN_BO_HV) {
        for (const q of QUYEN) {
          const trongKho = can(p, q, { studentId: sid });
          const ngoaiKho = doiChieu.get(`${uid}|${sid}|${q}`);
          if (trongKho !== ngoaiKho) saiLech.push(`user=${uid} sid=${sid} q=${q}: kho=${trongKho} ngoài=${ngoaiKho}`);
        }
      }
    }
    assert(saiLech.length === 0, `Có ${saiLech.length} lệch giữa trong/ngoài bộ nhớ:\n${saiLech.slice(0, 20).join('\n')}`);
  });
});

check('PR-TD Task2(a2) · can(p, q, {classId}) trong kho GET bằng HỆT ngoài kho — mọi tài khoản × mọi lớp × 5 quyền (gồm SCHEDULE_MOVE, dùng classIsFastTrack qua bộ nhớ)', () => {
  const QUYEN = [
    PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.STUDENT_VIEW, PERMISSIONS.SOS_REPORT,
    PERMISSIONS.STUDENT_EDIT, PERMISSIONS.SCHEDULE_MOVE,
  ];
  const doiChieu = new Map<string, boolean>();
  for (const uid of TOAN_BO_TK) {
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const cid of TOAN_BO_LOP) {
      for (const q of QUYEN) doiChieu.set(`${uid}|${cid}|${q}`, can(p, q, { classId: cid }));
    }
  }
  chayTrongRequest('GET', () => {
    const saiLech: string[] = [];
    for (const uid of TOAN_BO_TK) {
      const p = PRINCIPAL_CUA.get(uid)!;
      for (const cid of TOAN_BO_LOP) {
        for (const q of QUYEN) {
          const trongKho = can(p, q, { classId: cid });
          const ngoaiKho = doiChieu.get(`${uid}|${cid}|${q}`);
          if (trongKho !== ngoaiKho) saiLech.push(`user=${uid} cid=${cid} q=${q}: kho=${trongKho} ngoài=${ngoaiKho}`);
        }
      }
    }
    assert(saiLech.length === 0, `Có ${saiLech.length} lệch giữa trong/ngoài bộ nhớ:\n${saiLech.slice(0, 20).join('\n')}`);
  });
});

check('PR-TD Task2(b) · HV có branch_id trên bảng students nhưng KHÔNG ghi danh lớp nào — vẫn tính đúng phạm vi qua bộ nhớ', () => {
  const info = conn
    .prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
    .run('PR-TD-B1', 'PR TD B1', 'pr td b1', CN, new Date().toISOString());
  const hvB = Number(info.lastInsertRowid);
  const qlMb = PRINCIPAL_CUA.get(USER.QL)!;
  const ngoai = can(qlMb, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvB });
  chayTrongRequest('GET', () => {
    napTruocPhamVi([hvB]);
    const trongKho = can(qlMb, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvB });
    assert(trongKho === ngoai, `Phải khớp ngoài bộ nhớ (ngoài=${ngoai}, trongKho=${trongKho})`);
    assert(trongKho === true, 'Quản lý MB phải thấy HV có branch_id = MB dù không ghi danh lớp nào');
  });
});

check('PR-TD Task2(c) · HV có ghi danh CŨ ở chi nhánh khác branch_id hiện tại — branchesOfStudent tính CẢ HAI chi nhánh, luật can() cũ giữ nguyên qua bộ nhớ (một chi nhánh riêng lẻ không đủ phủ HV có mặt ở CẢ HAI — grantCovers so khớp TOÀN BỘ branches của ngữ cảnh; chỉ vai phạm vi toàn hệ thống mới thấy)', () => {
  const now = new Date().toISOString();
  const info = conn
    .prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
    .run('PR-TD-C1', 'PR TD C1', 'pr td c1', CN, now); // branch_id HIỆN TẠI = MB
  const hvC = Number(info.lastInsertRowid);
  const lopCp = classId('CP-FT 110'); // ghi danh CŨ ở CP — chi nhánh KHÁC branch_id hiện tại
  conn
    .prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, created_at) VALUES (?,?, 'transferred', ?, ?, ?)`)
    .run(hvC, lopCp, '2026-01-01', '2026-02-01', now);

  const qlMb = PRINCIPAL_CUA.get(USER.QL)!;
  const qlCp = PRINCIPAL_CUA.get(QL_CP)!;
  const qt = PRINCIPAL_CUA.get(USER.QT)!;
  const ngoaiMb = can(qlMb, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvC });
  const ngoaiCp = can(qlCp, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvC });
  const ngoaiQt = can(qt, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvC });
  chayTrongRequest('GET', () => {
    napTruocPhamVi([hvC]);
    const trongMb = can(qlMb, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvC });
    const trongCp = can(qlCp, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvC });
    const trongQt = can(qt, PERMISSIONS.ATTEMPT_VIEW, { studentId: hvC });
    assert(
      trongMb === ngoaiMb && trongCp === ngoaiCp && trongQt === ngoaiQt,
      `Phải khớp ngoài bộ nhớ (mb: kho=${trongMb} ngoài=${ngoaiMb}; cp: kho=${trongCp} ngoài=${ngoaiCp}; qt: kho=${trongQt} ngoài=${ngoaiQt})`,
    );
    assert(trongQt === true, 'Vai phạm vi toàn hệ thống (QT) phải luôn thấy được HV, bất kể ghi danh cũ ở chi nhánh nào');
    assert(
      trongMb === false && trongCp === false,
      'Một chi nhánh riêng lẻ (chi nhánh hiện tại HOẶC chi nhánh ghi danh cũ) không đủ phủ HV có mặt ở CẢ HAI chi nhánh — đúng luật can() cũ',
    );
  });
});

await checkAsync("PR-TD Task2(d) · qua HTTP, hai request liền nhau: PUT /demo/config đổi demoDate rồi GET /demo/config thấy ngày mới ngay — không dính bộ nhớ cũ giữa hai request", async () => {
  const truoc = await callHttp('QT', 'GET', '/demo/config');
  const explicitCu = (truoc.json?.demoDateExplicit as string | null) ?? '';
  const ngayMoi = '2026-11-11';
  const put = await callHttp('QT', 'PUT', '/demo/config', { demoDate: ngayMoi });
  assert(put.status === 200, `PUT /demo/config phải 200, được ${put.status}`);
  const sau = await callHttp('QT', 'GET', '/demo/config');
  assert(sau.json?.demoDate === ngayMoi, `GET sau PUT (request khác) phải thấy ngày mới ngay: được ${sau.json?.demoDate}`);
  const khoiPhuc = await callHttp('QT', 'PUT', '/demo/config', { demoDate: explicitCu });
  assert(khoiPhuc.status === 200, 'Phải đặt lại được ngày demo cũ sau phép kiểm');
});

// ==================================================================== Task 3 — listCases nhớ trong request + kiểm quyền theo lô

/**
 * HÀM THAM CHIẾU (đường CŨ): SQL thô lấy đúng ba cột (id, eff_class_id, eff_student_id, cùng các JOIN của
 * `caseTrongPhamVi`), lọc bằng `can()` NGOÀI MỌI KHO — từng dòng hỏi DB, không nhớ gì. Dùng để chứng minh
 * `listCases` sau khi tách/nhớ vẫn ra ĐÚNG tập id như trước PR này.
 */
function thamChieuCaseIds(
  p: ReturnType<typeof loadPrincipal>,
  f: { branchId?: number; classId?: number; studentId?: number; status?: string },
): Set<number> {
  if (scopeFor(p, PERMISSIONS.ATTEMPT_VIEW).none) return new Set();
  const where: string[] = ['1=1'];
  const params: unknown[] = [];
  if (f.studentId) { where.push('COALESCE(sc.student_id, a.student_id) = ?'); params.push(f.studentId); }
  if (f.classId) { where.push('COALESCE(cur.class_id, a.class_id) = ?'); params.push(f.classId); }
  if (f.branchId) { where.push('COALESCE(cc.branch_id, ac.branch_id) = ?'); params.push(f.branchId); }
  if (f.status) { where.push('sc.status = ?'); params.push(f.status); }
  const rows = conn
    .prepare(
      `SELECT sc.id AS id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE ${where.join(' AND ')}`,
    )
    .all(...params) as any[];
  const ids = new Set<number>();
  for (const r of rows) {
    if (can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.eff_class_id, studentId: r.eff_student_id })) ids.add(r.id as number);
  }
  return ids;
}

function urlChoBoLoc(f: { branchId?: number; classId?: number; studentId?: number; status?: string }): string {
  const qs = new URLSearchParams();
  if (f.branchId) qs.set('branchId', String(f.branchId));
  if (f.classId) qs.set('classId', String(f.classId));
  if (f.studentId) qs.set('studentId', String(f.studentId));
  if (f.status) qs.set('status', f.status);
  const s = qs.toString();
  return '/cases' + (s ? `?${s}` : '');
}

const TOAN_BO_CN = (conn.prepare('SELECT id FROM branches').all() as any[]).map((r) => r.id as number);
const BO_LOC_TASK3: Array<{ branchId?: number; classId?: number; studentId?: number; status?: string }> = [
  {},
  ...TOAN_BO_CN.map((b) => ({ branchId: b })),
  { classId: LOP_FT },
  { classId: LOP_THUONG },
  { studentId: HV },
  { status: 'done' },
];

check('PR-TD Task3(1) · listCases (gọi trực tiếp NGOÀI request) ra ĐÚNG tập id như tham chiếu — mọi tài khoản × {}, mỗi chi nhánh, hai lớp mẫu, một HV, status=done', () => {
  const saiLech: string[] = [];
  for (const uid of TOAN_BO_TK) {
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const f of BO_LOC_TASK3) {
      const thamChieu = thamChieuCaseIds(p, f);
      const truc = new Set((listCases(p, f as any).rows as any[]).map((r) => r.id as number));
      const lech = truc.size !== thamChieu.size || [...truc].some((id) => !thamChieu.has(id));
      if (lech) saiLech.push(`user=${uid} f=${JSON.stringify(f)}: trực tiếp=${truc.size} tham chiếu=${thamChieu.size}`);
    }
  }
  assert(saiLech.length === 0, `Lệch giữa listCases (ngoài request) và tham chiếu:\n${saiLech.slice(0, 10).join('\n')}`);
});

await checkAsync('PR-TD Task3(2) · GET /cases (qua HTTP) ra ĐÚNG tập id như tham chiếu — cùng bộ bộ lọc, các vai chính', async () => {
  const saiHttp: string[] = [];
  for (const vai of ['QL', 'GVCN', 'GVBM', 'GVCN_THUONG', 'QT'] as const) {
    const uid = USER[vai];
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const f of BO_LOC_TASK3) {
      const thamChieu = thamChieuCaseIds(p, f);
      // eslint-disable-next-line no-await-in-loop
      const { status, json } = await callHttpUser(uid, 'GET', urlChoBoLoc(f));
      if (status !== 200) { saiHttp.push(`vai=${vai} f=${JSON.stringify(f)}: mã ${status} (mong đợi 200)`); continue; }
      const idsHttp = new Set(((json as any).rows as any[]).map((r) => r.id as number));
      const lech = idsHttp.size !== thamChieu.size || [...idsHttp].some((id) => !thamChieu.has(id));
      if (lech) saiHttp.push(`vai=${vai} f=${JSON.stringify(f)}: http=${idsHttp.size} tham chiếu=${thamChieu.size}`);
    }
  }
  assert(saiHttp.length === 0, `Lệch giữa GET /cases (HTTP) và tham chiếu:\n${saiHttp.slice(0, 10).join('\n')}`);
});

await checkAsync('PR-TD Task3(3) · facets của gọi trực tiếp và của GET /cases (qua HTTP) bằng nhau — cùng bộ lọc, các vai chính', async () => {
  const saiFacets: string[] = [];
  for (const vai of ['QL', 'GVCN', 'GVBM', 'GVCN_THUONG', 'QT'] as const) {
    const uid = USER[vai];
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const f of BO_LOC_TASK3) {
      const truc = listCases(p, f as any).facets;
      // eslint-disable-next-line no-await-in-loop
      const { status, json } = await callHttpUser(uid, 'GET', urlChoBoLoc(f));
      if (status !== 200) continue; // đã báo ở Task3(2)
      if (JSON.stringify(truc) !== JSON.stringify((json as any).facets)) {
        saiFacets.push(`vai=${vai} f=${JSON.stringify(f)}: facets lệch giữa gọi trực tiếp và HTTP`);
      }
    }
  }
  assert(saiFacets.length === 0, `Facets lệch:\n${saiFacets.slice(0, 10).join('\n')}`);
});

check('PR-TD Task3(4) · trong một kho GET, gọi listCases(p, {}) hai lần cùng bộ lọc → lần hai 0 câu SQL', () => {
  const p = PRINCIPAL_CUA.get(USER.QT)!;
  chayTrongRequest('GET', () => {
    listCases(p, {});
    const truoc = soCauSql();
    listCases(p, {});
    const sau = soCauSql();
    assert(sau === truoc, `Lần gọi thứ hai (cùng bộ lọc, cùng request GET) phải 0 câu SQL thêm: được ${sau - truoc}`);
  });
});

/*
 * PR-TD Task2(e) — CHẠY SAU CÙNG trong file (đúng yêu cầu kế hoạch): thao tác ghi thật (chuyển lớp) trên một HV
 * TẠO RIÊNG cho phép kiểm này, để không đụng HV/lớp dùng chung ở các phép kiểm phía trên.
 *
 * HV khởi tạo KHÔNG có ghi danh nào (chỉ gắn `students.branch_id = MB`) — cố ý, không phải sơ suất:
 * `branchesOfStudent`/`napTruocPhamVi` tính CẢ ghi danh cũ (mọi trạng thái, xem Task2(c)) nên nếu HV có sẵn một ghi
 * danh ở MB rồi mới chuyển, ghi danh MB dù đã 'transferred' vẫn còn tính, khiến em vĩnh viễn "thuộc cả hai chi
 * nhánh" và Quản lý CP không bao giờ thấy trọn vẹn — đây là luật `can()`/`ctxBranches` CŨ, không phải lỗi bộ nhớ (đã
 * xác nhận bằng cách tái hiện y hệt với mã KHÔNG qua bộ nhớ của PR này). Không có ghi danh trước thì sau khi chuyển,
 * `branchesOfStudent` chỉ còn đúng CP — đúng kịch bản "trước không thấy, sau thấy ngay" mà phép kiểm này cần.
 */
await checkAsync(
  'PR-TD Task2(e) · qua HTTP: Quản lý CP không thấy Case của một HV MB (chưa xếp lớp) → chuyển HV đó sang lớp CP → Quản lý CP THẤY ngay (không dính bộ nhớ cũ)',
  async () => {
    const now = new Date().toISOString();
    const infoHv = conn
      .prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run('PR-TD-E1', 'PR TD E1', 'pr td e1', CN, now);
    const hvE = Number(infoHv.lastInsertRowid);
    const infoCase = conn
      .prepare(`INSERT INTO sos_cases (student_id, category, origin_kind, status, created_at) VALUES (?, 'listening', 'manager_task', 'open', ?)`)
      .run(hvE, now);
    const caseE = Number(infoCase.lastInsertRowid);

    const truoc = await callHttpUser(QL_CP, 'GET', '/cases');
    assert(truoc.status === 200, `GET /cases (QL_CP, trước chuyển) phải 200, được ${truoc.status}`);
    const thayTruoc = (truoc.json.rows as any[]).some((r) => r.id === caseE);
    assert(!thayTruoc, 'Quản lý CP KHÔNG được thấy Case của một HV còn gắn chi nhánh MB');

    const lopCp = classId('CP-FT 110');
    const chuyen = await callHttpUser(USER.QT, 'POST', `/students/${hvE}/transfer`, {
      toClassId: lopCp, effectiveDate: '2026-09-23', reasonCode: 'doi_lich_hoc',
      handoverNote: 'Bàn giao cho phép kiểm PR-TD Task2(e)',
    });
    assert(chuyen.status === 200, `POST /students/:id/transfer phải 200, được ${chuyen.status}: ${JSON.stringify(chuyen.json)}`);

    const sau = await callHttpUser(QL_CP, 'GET', '/cases');
    assert(sau.status === 200, `GET /cases (QL_CP, sau chuyển) phải 200, được ${sau.status}`);
    const thaySau = (sau.json.rows as any[]).some((r) => r.id === caseE);
    assert(thaySau, 'Quản lý CP PHẢI thấy Case ngay sau khi HV chuyển sang lớp CP — không được dính bộ nhớ cũ giữa hai request');
  },
);

// ==================================================================== Task 5 — trần câu SQL và nhân dữ liệu

/** Đo lại TOÀN BỘ DUONG_DO một lượt — dùng làm mốc "trước" cho cả phép trần và phép nhân dữ liệu. */
async function doMotLuot(): Promise<Map<string, number>> {
  const ra = new Map<string, number>();
  for (const muc of DUONG_DO) {
    for (const vai of muc.vai) {
      const url = urlFor(muc.url);
      const { n } = await doSql(vai, 'GET', url);
      ra.set(`${vai} ${url}`, n);
    }
  }
  return ra;
}

const truocNhan = await doMotLuot();

await checkAsync('PR-TD Task5(1) · trần câu SQL — mọi (đường × vai) đã có trong TRAN đều ≤ trần riêng và ≤ 100', async () => {
  const sai: string[] = [];
  for (const [khoa, n] of truocNhan) {
    const tran = TRAN[khoa];
    if (tran === undefined) continue; // đường mới chưa có mốc — bỏ qua, không phải lỗi
    if (n > tran || n > 100) sai.push(`${khoa}: ${n} câu > trần ${tran} (trần cứng 100)`);
  }
  assert(sai.length === 0, `Vượt trần:\n${sai.join('\n')}`);
});

/**
 * PR-TD Task 5 — nhân dữ liệu ×N: với MỖI HV đang có, chép thêm (N-1) bản (học viên, ghi danh — mọi trạng thái,
 * lộ trình, lượt MT, điểm từng kỹ năng, Case, phân loại vấn đề, tác động). KHÔNG nhân lớp (Q11 — lớp đổi chậm, nhân
 * lớp đòi sao chép phân công/lịch/chương trình, dễ sai). Đọc cột bằng `PRAGMA table_info` nên không cần liệt kê
 * tay từng cột của từng bảng — bảng đổi cột thì hàm này vẫn chạy đúng.
 */
function chepDong(table: string, banGoc: Record<string, unknown>, ghiDe: Record<string, unknown>): number {
  const cols = (conn.prepare(`PRAGMA table_info(${table})`).all() as any[])
    .map((c) => c.name as string)
    .filter((c) => c !== 'id');
  const giaTri = cols.map((c) => (c in ghiDe ? ghiDe[c] : banGoc[c]));
  const info = conn
    .prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .run(...giaTri);
  return Number(info.lastInsertRowid);
}

function nhanDuLieu(n: number): { hvTruoc: number; hvSau: number; caseTruoc: number; caseSau: number } {
  const demHv = () => (conn.prepare('SELECT COUNT(*) AS n FROM students').get() as any).n as number;
  const demCase = () => (conn.prepare('SELECT COUNT(*) AS n FROM sos_cases').get() as any).n as number;
  const hvTruoc = demHv();
  const caseTruoc = demCase();

  const idHvGoc = (conn.prepare('SELECT id FROM students').all() as any[]).map((r) => r.id as number);
  /* Ánh xạ case CŨ → case MỚI, dùng chung suốt cả lượt nhân để previous_case_id nối đúng bản sao của chính nó. */
  const banCase = new Map<number, number>();

  for (let lan = 1; lan < n; lan += 1) {
    for (const hvCu of idHvGoc) {
      const hv = conn.prepare('SELECT * FROM students WHERE id = ?').get(hvCu) as any;
      const hvMoi = chepDong('students', hv, { student_code: `${hv.student_code}-x${lan}` });

      for (const e of conn.prepare('SELECT * FROM enrollments WHERE student_id = ?').all(hvCu) as any[]) {
        chepDong('enrollments', e, { student_id: hvMoi }); // KHÔNG lọc status — mọi ghi danh, giống classesOfStudent
      }

      const idLoTrinh = new Map<number, number>();
      for (const c of conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').all(hvCu) as any[]) {
        /* baseline/outcome attempt tạm NULL — lượt MT của lộ trình này chưa tồn tại; backfill ngay dưới đây. */
        idLoTrinh.set(c.id, chepDong('learning_cycles', c, {
          student_id: hvMoi, baseline_attempt_id: null, outcome_attempt_id: null,
        }));
      }

      const idLuot = new Map<number, number>();
      for (const a of conn.prepare('SELECT * FROM assessment_attempts WHERE student_id = ?').all(hvCu) as any[]) {
        const aMoi = chepDong('assessment_attempts', a, {
          student_id: hvMoi, cycle_id: idLoTrinh.get(a.cycle_id) ?? a.cycle_id,
        });
        idLuot.set(a.id, aMoi);
        for (const s of conn.prepare('SELECT * FROM attempt_skills WHERE attempt_id = ?').all(a.id) as any[]) {
          chepDong('attempt_skills', s, { attempt_id: aMoi });
        }
        for (const s of conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ?').all(a.id) as any[]) {
          chepDong('assessment_scores', s, { attempt_id: aMoi });
        }
      }

      for (const c of conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').all(hvCu) as any[]) {
        conn.prepare('UPDATE learning_cycles SET baseline_attempt_id = ?, outcome_attempt_id = ? WHERE id = ?').run(
          c.baseline_attempt_id ? (idLuot.get(c.baseline_attempt_id) ?? null) : null,
          c.outcome_attempt_id ? (idLuot.get(c.outcome_attempt_id) ?? null) : null,
          idLoTrinh.get(c.id),
        );
      }

      for (const sc of conn.prepare('SELECT * FROM sos_cases WHERE student_id = ?').all(hvCu) as any[]) {
        const scMoi = chepDong('sos_cases', sc, {
          student_id: hvMoi,
          cycle_id: sc.cycle_id ? (idLoTrinh.get(sc.cycle_id) ?? null) : null,
          attempt_id: sc.attempt_id ? (idLuot.get(sc.attempt_id) ?? null) : null,
          dedup_key: null, // chỉ mục duy nhất — nhiều NULL vẫn hợp lệ trong SQLite
          previous_case_id: sc.previous_case_id ? (banCase.get(sc.previous_case_id) ?? null) : null,
        });
        banCase.set(sc.id, scMoi);
        for (const ci of conn.prepare('SELECT * FROM case_issues WHERE case_id = ?').all(sc.id) as any[]) {
          chepDong('case_issues', ci, { case_id: scMoi });
        }
        for (const iv of conn.prepare('SELECT * FROM case_interventions WHERE case_id = ?').all(sc.id) as any[]) {
          chepDong('case_interventions', iv, { case_id: scMoi, migration_key: null, superseded_by: null });
        }
      }
    }
  }

  return { hvTruoc, hvSau: demHv(), caseTruoc, caseSau: demCase() };
}

const soNhanDuLieu = nhanDuLieu(3);
console.log(
  `\nNhân dữ liệu ×3: HV ${soNhanDuLieu.hvTruoc} → ${soNhanDuLieu.hvSau}, Case ${soNhanDuLieu.caseTruoc} → ${soNhanDuLieu.caseSau} (lớp giữ nguyên — Q11).`,
);

await checkAsync('PR-TD Task5(2) · sau khi nhân dữ liệu ×3, mọi (đường × vai) không tăng quá 5 câu so với trước', async () => {
  const sauNhan = await doMotLuot();
  const sai: string[] = [];
  for (const [khoa, truoc] of truocNhan) {
    const sau = sauNhan.get(khoa) ?? 0;
    if (sau > truoc + 5) sai.push(`${khoa}: ${truoc} → ${sau} câu`);
  }
  assert(sai.length === 0, `Tăng quá 5 câu sau khi nhân dữ liệu:\n${sai.join('\n')}`);
  console.log('\nBảng trước → sau nhân dữ liệu ×3 (chỉ đường có thay đổi):');
  for (const [khoa, truoc] of truocNhan) {
    const sau = sauNhan.get(khoa) ?? 0;
    if (sau !== truoc) console.log(`  ${khoa}: ${truoc} → ${sau}`);
  }
});

await checkAsync('PR-TD Task5(3) · sau khi nhân dữ liệu, listCases vẫn ra ĐÚNG tập id như tham chiếu — 3 vai chính', async () => {
  const sai: string[] = [];
  for (const vai of ['QL', 'GVCN', 'QT'] as const) {
    const p = PRINCIPAL_CUA.get(USER[vai])!;
    for (const f of BO_LOC_TASK3) {
      const thamChieu = thamChieuCaseIds(p, f);
      const truc = new Set((listCases(p, f as any).rows as any[]).map((r) => r.id as number));
      const lech = truc.size !== thamChieu.size || [...truc].some((id) => !thamChieu.has(id));
      if (lech) sai.push(`vai=${vai} f=${JSON.stringify(f)}: trực tiếp=${truc.size} tham chiếu=${thamChieu.size}`);
    }
  }
  assert(sai.length === 0, `Lệch sau khi nhân dữ liệu:\n${sai.join('\n')}`);
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
