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
import { createHash } from 'node:crypto';
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
  chayTrongRequest, nho, coNho, trongBoNho, soCauSql, soDongSql, demHienTai,
} = await import('../platform/nguCanhRequest.ts');
const { loadPrincipal, can, napTruocPhamVi, scopeFor } = await import('../permissions.ts');
const accounts = await import('../platform/accounts.ts');
const { PERMISSIONS, LO_LUU_SUA_CA_LOP } = await import('../../../shared/domain/index.ts');
const { listCases } = await import('../cases/cases.ts');
const { DUONG_DO, MOI_VAI, TRAN, TRAN_DONG, TRAN_GHI_LO } = await import('./tocDoDuong.ts');

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

/*
 * PR-DEPLOY (Task 3b, Q7): THƯỚC ĐO GIỚI HẠN TURSO. Lỗi Turso chỉ lộ trên máy thật (23/09): > 900 tham số / câu, UNION dài, tham số đặt tên bị bỏ qua.
 * Ghi lại MỌI câu SQL (văn bản + tham số) khi `doTurso.bat` — bật SAU khi nhân dữ liệu ×3, tới hết các đường đo + đường ghi lô; kiểm cuối file.
 * Móc ở prototype `prepare` (gắn văn bản câu vào statement) và bốn hàm chạy của Statement — không đổi hành vi, chỉ đếm.
 */
type CauDo = { nhan: string; thamSo: number; ve: number; datTen: boolean; sql: string };
const doTurso = { bat: false, nhan: '(ngoài request)', soCau: 0, nangThamSo: [] as CauDo[], nangVe: [] as CauDo[], datTen: [] as CauDo[] };
/*
 * TD2-a: "không đọc lặp" — trong MỘT request GET, câu lịch kỹ năng (`FROM attempt_skills ask`) và câu điểm (`FROM assessment_scores s
 * LEFT JOIN users u`) không được trả lại cùng một `attempt_id` hai lần. `null` = không theo dõi.
 */
const doLap: { thay: Map<string, Map<number, number>> | null } = { thay: null };
const CAU_LUOT: [string, RegExp][] = [['lịch kỹ năng', /FROM attempt_skills ask\b/], ['điểm', /FROM assessment_scores s\s+LEFT JOIN users u\b/]];
{
  const dbProto = Object.getPrototypeOf(conn);
  const prepGoc = dbProto.prepare;
  dbProto.prepare = function (this: unknown, sql: string) {
    const st = prepGoc.call(this, sql);
    Object.defineProperty(st, '__sql', { value: sql });
    return st;
  };
  const stProto = Object.getPrototypeOf(prepGoc.call(conn, 'SELECT 1'));
  const boChuoi = (sql: string) => sql.replace(/'(?:[^']|'')*'/g, "''").replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const giuTop = (ds: CauDo[], c: CauDo, khoa: 'thamSo' | 've') => {
    ds.push(c); ds.sort((a, b) => b[khoa] - a[khoa]); ds.length = Math.min(ds.length, 5);
  };
  for (const m of ['get', 'all', 'run', 'iterate'] as const) {
    const goc = stProto[m];
    stProto[m] = function (this: any, ...args: unknown[]) {
      if (doTurso.bat && this.__sql) {
        const sach = boChuoi(this.__sql);
        const coDoiTuong = args.some((a) => a !== null && typeof a === 'object' && !Array.isArray(a) && !Buffer.isBuffer(a));
        const c: CauDo = {
          nhan: doTurso.nhan, thamSo: args.flat().length, ve: (sach.match(/\bUNION\b/gi) ?? []).length + 1,
          datTen: coDoiTuong || /(^|[^A-Za-z0-9_'"])[:@$][A-Za-z_]/.test(sach), sql: this.__sql.replace(/\s+/g, ' ').slice(0, 120),
        };
        doTurso.soCau++;
        giuTop(doTurso.nangThamSo, c, 'thamSo');
        giuTop(doTurso.nangVe, c, 've');
        if (c.datTen && doTurso.datTen.length < 5) doTurso.datTen.push(c);
      }
      const out = goc.apply(this, args);
      if (doLap.thay && m === 'all' && this.__sql && Array.isArray(out)) {
        for (const [ten, re] of CAU_LUOT) {
          if (!re.test(this.__sql)) continue;
          const dem = doLap.thay.get(ten) ?? new Map<number, number>();
          doLap.thay.set(ten, dem);
          for (const id of new Set(out.map((r: any) => r.attempt_id as number))) dem.set(id, (dem.get(id) ?? 0) + 1);
        }
      }
      return out;
    };
  }
}
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

const LOP_FT = classId('MB FT 101');
const LOP_THUONG = classId('MB FOU 12');
const LOP_BE = classId('MB BE 08');   // PR-KV: panel Kỳ vọng đầu ra
const LOP_PET = classId('MB PET 01');   // OV-6b2: lớp liên tục (Checkpoint)
const CN = (conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(LOP_FT) as any).b as number;
const HV = (
  conn
    .prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`)
    .get(LOP_FT) as any
).id as number;
/** PR-TK: một lộ trình ĐÃ ĐÓNG (có bản chụp) của chi nhánh mẫu — đường `/lo-trinh/{loTrinhDong}/tong-ket`. */
const LO_TRINH_DONG = (conn.prepare(`SELECT b.cycle_id AS id FROM ban_chup_lo_trinh b JOIN students s ON s.id = b.student_id WHERE s.branch_id = ? ORDER BY b.cycle_id LIMIT 1`).get(CN) as any)?.id as number;
assert(LO_TRINH_DONG, 'Seed thiếu lộ trình đã đóng (bản chụp) ở chi nhánh MB');
/** PR-TK: lớp ĐÃ KẾT THÚC có bản chụp (lớp cũ của em có lộ trình đóng) — đường `/classes/{lopKetThuc}/tong-ket`. Bộ demo chưa có lớp kết thúc → đặt lớp cũ đó `finished`. */
const LOP_KET_THUC = (conn.prepare('SELECT class_id AS id FROM ban_chup_lo_trinh WHERE cycle_id = ? AND class_id IS NOT NULL').get(LO_TRINH_DONG) as any)?.id as number;
assert(LOP_KET_THUC, 'Bản chụp mẫu thiếu lớp');
conn.prepare(`UPDATE classes SET status = 'finished', finished_at = COALESCE(finished_at, ?) WHERE id = ?`).run(new Date().toISOString().slice(0, 10), LOP_KET_THUC);
const KASE = (
  conn
    .prepare(
      `SELECT sc.id AS id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE COALESCE(sc.student_id, a.student_id) = ? ORDER BY sc.id LIMIT 1`,
    )
    .get(HV) as any
)?.id as number | undefined;
assert(KASE, `Seed thiếu Case cho HV mẫu (id ${HV}) ở lớp MB FT 101 — DUONG_DO cần một Case thật`);

const USER: Record<Vai, number> = {
  QL: userByRole('manager', 'MB'),
  GVCN: coreTeacherOf('MB FT 101'),
  GVBM: subjectOnlyTeacherOf('MB FT 101'),
  GVCN_THUONG: coreTeacherOf('MB FOU 12'),
  QT: userByRole('system_admin', null),
  /* OV-10c: Admin MT ở chi nhánh mẫu MB (demo chỉ có Admin Cẩm Phả, ít MT); TVV, CX của demo. */
  ADMIN: accounts.createAccount(loadPrincipal(userByRole('system_admin', null)), {
    email: `do.admin.mb${accounts.EMAIL_SUFFIX}`, password: 'matkhau-do-admin', fullName: 'Đo Admin MB',
    roles: [{ role: 'office_admin', branches: ['MB'] }],
  }).userId as number,
  TVV: userByRole('consultant', 'CP'),
  CX: userByRole('cx', null),
};
/** Quản lý chi nhánh CP — dùng riêng ở Task 2 phép kiểm (c)/(e) (chi nhánh KHÁC với MB của mọi vai trên). */
const QL_CP = userByRole('manager', 'CP');

const server = createApp().listen(0);
/* Giữa hai lượt gọi có đoạn đo đồng bộ dài (nhân dữ liệu, vòng mọi vai) > 5 s mặc định: máy chủ đóng kết nối giữ sống, fetch kế tiếp dùng lại → ECONNRESET. */
server.keepAliveTimeout = 120_000;
const port = (server.address() as any).port as number;

function urlFor(mau: string): string {
  return mau
    .replace('{lopFT}', String(LOP_FT))
    .replace('{lopThuong}', String(LOP_THUONG))
    .replace('{lopBe}', String(LOP_BE))
    .replace('{lopPet}', String(LOP_PET))
    .replace('{hv}', String(HV))
    .replace('{loTrinhDong}', String(LO_TRINH_DONG))
    .replace('{lopKetThuc}', String(LOP_KET_THUC))
    .replace('{case}', String(KASE))
    .replace('{cn}', String(CN))
    .replace('{gv}', String(USER.GVCN));
}

async function callHttpUser(userId: number, method: string, url: string, body?: unknown) {
  doTurso.nhan = `${method} ${url}`;
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
async function doSql(vai: Vai, method: string, url: string): Promise<{ n: number; dong: number; status: number }> {
  const truoc = soCauSql(), dongTruoc = soDongSql();
  if (process.env.PISA_DEM_SQL === '1') console.log(`[vai] ${vai}`);   // TD3-0: dòng `[sql]` ngay sau là của vai này
  const { status } = await callHttp(vai, method, url);
  const sau = soCauSql();
  return { n: sau - truoc, dong: soDongSql() - dongTruoc, status };
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
  const lopCp = classId('CP FT 110'); // ghi danh CŨ ở CP — chi nhánh KHÁC branch_id hiện tại
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
              COALESCE(cur.class_id, a.class_id) AS eff_class_id,   -- PR-Dọn Q5: quyền theo CÙNG lớp với bộ lọc (lớp đang học, rồi lớp của lượt)
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
    /* TD4-a băm Công việc của QT: Case này phải có `created_at` theo ngày DEMO, không theo giờ thật (trước: hạn Thêm PA trôi theo ngày chạy). */
    const { demoToday } = await import('../demoConfig.ts');
    const now = `${demoToday()}T02:00:00.000Z`;
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

    const lopCp = classId('CP FT 110');
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

/**
 * Đo lại TOÀN BỘ DUONG_DO một lượt — dùng làm mốc "trước" cho cả phép trần và phép nhân dữ liệu. `dong` (TD2-a): số dòng SQL trả về
 * của từng (vai × đường) ghi vào Map truyền vào. `lap`: ghi các (vai × đường) đọc lặp một lượt (xem `doLap`).
 */
async function doMotLuot(dong?: Map<string, number>, lap?: string[]): Promise<Map<string, number>> {
  const ra = new Map<string, number>();
  for (const muc of DUONG_DO) {
    for (const vai of muc.vai) {
      const url = urlFor(muc.url);
      if (lap) doLap.thay = new Map();
      const r = await doSql(vai, 'GET', url);
      ra.set(`${vai} ${url}`, r.n);
      dong?.set(`${vai} ${url}`, r.dong);
      if (lap) {
        for (const [ten, dem] of doLap.thay!) {
          const lai = [...dem].filter(([, k]) => k > 1).map(([id]) => id);
          if (lai.length) lap.push(`${vai} ${url}: ${ten} đọc lại ${lai.length} lượt (vd. ${lai.slice(0, 5).join(', ')})`);
        }
        doLap.thay = null;
      }
    }
  }
  return ra;
}

const dongTruocNhan = new Map<string, number>();
const docLap: string[] = [];
const truocNhan = await doMotLuot(dongTruocNhan, docLap);

check('TD2-a · không đọc lặp — mỗi request GET: câu lịch kỹ năng / câu điểm không trả cùng một lượt hai lần', () => {
  assert(docLap.length === 0, `Đọc lặp:\n${docLap.join('\n')}`);
});

check('TD2-a · trần dòng đọc — mọi (đường × vai) trong TRAN_DONG ≤ trần, và mọi khoá TRAN_DONG khớp một đường đã đo', () => {
  const sai: string[] = [];
  for (const [khoa, tran] of Object.entries(TRAN_DONG)) {
    const d = dongTruocNhan.get(khoa);
    if (d === undefined) sai.push(`${khoa}: không có trong đường đo`);
    else if (d > tran) sai.push(`${khoa}: ${d} dòng > trần ${tran}`);
  }
  assert(Object.keys(TRAN_DONG).length >= 10, `TRAN_DONG phải phủ các đường nặng (có ${Object.keys(TRAN_DONG).length})`);
  assert(!sai.length, sai.join('\n'));
});

await checkAsync('PR-TD Task5(1) · trần câu SQL — mọi (đường × vai) đã có trong TRAN đều ≤ trần riêng và ≤ 100', async () => {
  const sai: string[] = [];
  for (const [khoa, n] of truocNhan) {
    const tran = TRAN[khoa];
    if (tran === undefined) continue; // đường mới chưa có mốc — bỏ qua, không phải lỗi
    if (n > tran || n > 100) sai.push(`${khoa}: ${n} câu > trần ${tran} (trần cứng 100)`);
  }
  assert(sai.length === 0, `Vượt trần:\n${sai.join('\n')}`);
});

/* PR-Dọn (9a): hồ sơ HV (FT) ≤ 90 câu ở mọi vai (trước PR 93–98). */
await checkAsync('PR-Dọn (9a) · GET /students/{hv} ≤ 90 câu SQL ở QL, QT, GVCN, GVBM', async () => {
  const sai: string[] = [];
  for (const vai of ['QL', 'QT', 'GVCN', 'GVBM'] as const) {
    const r = await doSql(vai, 'GET', `/students/${HV}`);
    if (r.status !== 200 || r.n > 90) sai.push(`${vai}: ${r.status} · ${r.n} câu`);
  }
  assert(!sai.length, sai.join('; '));
});

/* PR-Dọn (9c): khoá TRAN lạc (id lớp đổi, đường đã xoá…) từng bị bỏ qua lặng lẽ ở phép trên — nay báo đỏ. */
await checkAsync('PR-Dọn (9c) · mọi khoá trong TRAN khớp một cặp (vai × đường) đã đo', async () => {
  const lac = Object.keys(TRAN).filter((k) => !truocNhan.has(k));
  assert(!lac.length, `Khoá TRAN không khớp đường đo nào:\n${lac.join('\n')}`);
});

/* PR-S6F-b (D14): cả LẦN TẢI TRANG Tổng quan — mỗi GET một lần, tổng câu SQL ≤ trần của trang. */
await checkAsync('PR-S6F-b · tải trang đầu Tổng quan GV / QL: mỗi GET một lần (không /my-work/dem, không gọi đôi route nặng), tổng câu SQL ≤ trần trang', async () => {
  const { TAI_TRANG } = await import('./tocDoDuong.ts');
  const sai: string[] = [];
  for (const [trang, x] of Object.entries(TAI_TRANG)) {
    if (new Set(x.urls).size !== x.urls.length) sai.push(`${trang}: có GET lặp`);
    if (x.urls.includes('/my-work/dem')) sai.push(`${trang}: còn /my-work/dem`);
    let tong = 0;
    for (const u of x.urls) {
      const r = await doSql(x.vai, 'GET', urlFor(u));
      if (r.status !== 200) sai.push(`${trang} ${u} → ${r.status}`);
      tong += r.n;
    }
    console.log(`      (đo: ${trang} ${tong} câu / ${x.urls.length} GET)`);
    if (tong > x.tran) sai.push(`${trang}: ${tong} câu > trần ${x.tran}`);
  }
  assert(sai.length === 0, sai.join('\n'));
});

/**
 * PR-TD Task 5 — nhân dữ liệu ×N: với MỖI HV đang có, chép thêm (N-1) bản (học viên, ghi danh — mọi trạng thái,
 * lộ trình, lượt MT, điểm từng kỹ năng, Case, nhóm nguyên nhân, tác động). KHÔNG nhân lớp (Q11 — lớp đổi chậm, nhân
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
          idempotency_key: null, // PR-DEPLOY: cột UNIQUE — Case tay của bộ demo (D18) có khoá
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
const dongSauNhan = new Map<string, number>();
doTurso.bat = true;   // PR-DEPLOY (Q7): từ đây ghi mọi câu SQL — mọi (đường × vai) sau nhân dữ liệu + mọi đường ghi lô
/*
 * PR-SOS: bản sao chép cả `sos_cases.han_xac_nhan` → Case chờ nguyên nhân quá hạn của bản sao sinh thẻ Báo QL ở lần quét ĐẦU (việc ghi
 * một lần, không phải số câu đọc). Quét trước khi đo để phép so "trước/sau" chỉ đo đường đọc.
 */
(await import('../duyet/yeuCau.ts')).quetYeuCau();
console.log(
  `\nNhân dữ liệu ×3: HV ${soNhanDuLieu.hvTruoc} → ${soNhanDuLieu.hvSau}, Case ${soNhanDuLieu.caseTruoc} → ${soNhanDuLieu.caseSau} (lớp giữ nguyên — Q11).`,
);

let cauSauNhan = new Map<string, number>();   // TD4: số câu ×3 của từng (vai × đường)
await checkAsync('PR-TD Task5(2) · sau khi nhân dữ liệu ×3, mọi (đường × vai) không tăng quá 5 câu so với trước', async () => {
  const sauNhan = cauSauNhan = await doMotLuot(dongSauNhan);
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

/* TD2-a: dòng tăng theo dữ liệu là đúng (×3 học viên) — đọc lặp thì vượt. Trần sau nhân = 3 × trần gốc. */
check('TD2-a · sau khi nhân dữ liệu ×3, mọi (đường × vai) trong TRAN_DONG ≤ 3 × trần dòng', () => {
  const sai: string[] = [];
  for (const [khoa, tran] of Object.entries(TRAN_DONG)) {
    const d = dongSauNhan.get(khoa) ?? 0;
    console.log(`      (đo dòng: ${khoa} ${dongTruocNhan.get(khoa)} → ${d})`);
    if (d > 3 * tran) sai.push(`${khoa}: ${d} dòng > 3 × ${tran}`);
  }
  assert(!sai.length, sai.join('\n'));
});

/* TD3-a: `chiConO` (tập cha) — sau lọc `conBaiCanCham` trùng JSON với cách cũ trên dữ liệu ×3, mọi vai đo. */
await checkAsync('TD3-a-1 (×3) · listAttempts chiConO trùng JSON sau conBaiCanCham — mọi vai đo', async () => {
  const { listAttempts, conBaiCanCham } = await import('../fasttrack/attempts.ts');
  const sai: string[] = [];
  for (const vai of MOI_VAI) {   // OV-10c: ADMIN / TVV / CX chỉ đo đường Tổng quan
    const p = PRINCIPAL_CUA.get(USER[vai]) ?? loadPrincipal(USER[vai]);
    const f = { scope: 'managed' as const, chiDangHoc: true, phamViCham: true };
    const a = JSON.stringify(listAttempts(p, f).rows.filter(conBaiCanCham));
    const b = JSON.stringify(listAttempts(p, { ...f, chiConO: true }).rows.filter(conBaiCanCham));
    if (a !== b) sai.push(vai);
  }
  assert(!sai.length, `lệch: ${sai.join(', ')}`);
});

/* TD3-a-2: Lịch Test QL ×3 — trước TD3-a đo 5 177 dòng (top: lịch kỹ năng 2 451, điểm 993, lượt 624); trần 40 %. */
check('TD3-a-2 · GET /cham/lich-test (QL, ×3) ≤ 40 % số dòng trước TD3-a (5 177)', () => {
  const d = dongSauNhan.get('QL /cham/lich-test') ?? Infinity;
  console.log(`      (đo: ${d} dòng)`);
  assert(d <= Math.floor(5177 * 0.4), `${d} dòng > ${Math.floor(5177 * 0.4)}`);
});

/* TD3-b-1: hồ sơ lớp đọc `listClassSummaries(p, { classId })` — phải trùng dòng của lớp đó trong danh sách đủ (cách cũ), mọi vai × lớp. */
await checkAsync('TD3-b-1 (×3) · listClassSummaries { classId } trùng dòng của lớp trong danh sách đủ — mọi vai đo', async () => {
  const { listClassSummaries } = await import('../classes/classes.ts');
  const sai: string[] = [];
  for (const vai of MOI_VAI) {   // OV-10c: ADMIN / TVV / CX chỉ đo đường Tổng quan
    const p = PRINCIPAL_CUA.get(USER[vai]) ?? loadPrincipal(USER[vai]);
    for (const r of listClassSummaries(p, {}).rows) {
      const mot = listClassSummaries(p, { classId: r.id }).rows;
      if (mot.length !== 1 || JSON.stringify(mot[0]) !== JSON.stringify(r)) sai.push(`${vai} lớp ${r.id}`);
    }
  }
  assert(!sai.length, `lệch: ${sai.join(', ')}`);
});

/*
 * TD3-b-2: trước TD3-b (×3) QL hồ sơ lớp FT 5 829 dòng, Học viên & Lớp 8 417. Hồ sơ lớp ≤ 50 %. Học viên & Lớp KHÔNG đạt 50 % mà không đổi luật
 * (còn lại: kết quả gần nhất từng em — `standingFor`, Case, Ý thức, lộ trình); giữ mức đạt được ≤ 80 % (mô tả PR).
 */
check('TD3-b-2 · QL ×3: /classes/{lopFT}/overview ≤ 50 % (5 829), /hoc-vien-lop ≤ 80 % (8 417)', () => {
  const ov = dongSauNhan.get(`QL /classes/${LOP_FT}/overview`) ?? Infinity, hvl = dongSauNhan.get('QL /hoc-vien-lop') ?? Infinity;
  console.log(`      (đo: overview ${ov}, hoc-vien-lop ${hvl} dòng)`);
  assert(ov <= Math.floor(5829 * 0.5) && hvl <= Math.floor(8417 * 0.8), `overview ${ov} / hoc-vien-lop ${hvl}`);
});

/*
 * TD4-a: Công việc trên dữ liệu ×3 — JSON đầy đủ (`items`, `dong`, `groups`, `summary`) TRÙNG ảnh chụp chụp bằng mã TRƯỚC TD4 (main 35517670), mọi vai
 * và mọi góc nhìn. Lọc sớm lượt ở `listAttempts` không được đổi một việc nào. Đổi đầu ra Công việc CÓ CHỦ Ý (hoặc seed / phép kiểm phía trên đổi
 * dữ liệu) thì lệch: chụp lại băm bằng mã trước thay đổi đó (phép in băm đang ra), không sửa cho khớp.
 * 15/10: chụp lại 'QT toi' / 'QT tat-ca' sau khi Case của Task2(e) thôi lấy giờ thật (hạn Thêm PA của nó trôi theo ngày chạy → băm QT đổi mỗi ngày).
 * 15/10 OV-13a: chụp lại 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — Case tạm (Q2) đổi thứ tự sinh Case trong seed → id Case 34↔35 (HV 46) đổi chỗ;
 *   so JSON với main: khác CHỈ ở id Case, nội dung việc không đổi.
 * 15/10 OV-13c: chụp lại 7 băm — đổi CÓ CHỦ Ý: Nhập điểm gom theo tuần thi (khoá `|p{tuần}|`, dòng phụ có mã tuần), việc Case SOS FT + Nhập điểm
 * thêm `tuanThi` / `sos` / `pa` / `periodId` / `kind`. Đã so JSON mã trước (main 0359276) ↔ sau trên bộ demo, 5 vai × Của tôi / Tất cả: việc khác
 * TRÙNG hoàn toàn (trừ trường mới), tổng số bài Nhập điểm không đổi.
 */
await checkAsync('TD4-a (×3) · Công việc trùng JSON ảnh chụp trước TD4 — 6 vai × Của tôi / Tất cả / Của một GV / lọc chi nhánh', async () => {
  const { myWork, viecCuaNguoi } = await import('../worklist/mywork.ts');
  const ANH: Record<string, string> = {
    'QL toi': '6671f11bb8e4d60c', 'QT toi': 'ad9ea8d503e7b56c', 'GVCN toi': '4f51ddef848eaf9e', 'GVBM toi': 'dd8afd71bacf9864',
    'GVCN_THUONG toi': '4f51ddef848eaf9e', 'ADMIN toi': '4ed1fc3fa34653f2', 'QL tat-ca': 'd60e3dc1048bb734', 'QT tat-ca': '273086d4e555e53e',
    'QT tat-ca cn': '41e45b78d1d94242', 'QL gvcn': '912708bfcda5b611',
  };
  const p = (v: Vai) => loadPrincipal(USER[v]);
  const goc: [string, () => unknown][] = [
    ...(['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG', 'ADMIN'] as const).map((v) => [`${v} toi`, () => myWork(p(v))] as [string, () => unknown]),
    ...(['QL', 'QT'] as const).map((v) => [`${v} tat-ca`, () => myWork(p(v), { nguoi: 'tat-ca' })] as [string, () => unknown]),
    ['QT tat-ca cn', () => myWork(p('QT'), { nguoi: 'tat-ca', branchId: CN })],
    ['QL gvcn', () => viecCuaNguoi(p('QL'), USER.GVCN)],
  ];
  const sai: string[] = [];
  for (const [ten, fn] of goc) {
    const bam = chayTrongRequest('GET', () => createHash('sha256').update(JSON.stringify(fn())).digest('hex').slice(0, 16));
    if (ANH[ten] !== bam) sai.push(`'${ten}': '${bam}',`);
  }
  assert(!sai.length, `lệch ảnh chụp:\n${sai.join('\n')}`);
});

/*
 * TD4-b: bản chính 15/10 log `[cham]` /my-work 5–7,5 s, 75–126 câu, 6 900–18 400 dòng (top: lịch kỹ năng của MỌI lượt trong phạm vi). Mốc ×3 trước TD4
 * (main 35517670, đo trong chính phép này): câu / dòng dưới đây. Khoá: dòng ≤ 40 % mốc, số câu ×3 ≤ ×1 + 2 (không tăng theo dữ liệu) và ≤ mốc − 3.
 */
check('TD4-b (×3) · /my-work mọi vai: dòng ≤ 40 % mốc trước TD4, số câu không tăng theo dữ liệu', () => {
  const MOC: Record<string, [number, number]> = {
    'QL /my-work': [66, 5647], 'QT /my-work': [66, 7775], 'GVCN /my-work': [66, 4502], 'GVBM /my-work': [66, 5140], 'GVCN_THUONG /my-work': [66, 4502],
    'QL /my-work?nguoi=tat-ca': [78, 6721], 'QT /my-work?nguoi=tat-ca': [78, 9176], [`QL /my-work?nguoi=${USER.GVCN}`]: [72, 4530],
  };
  const sai: string[] = [];
  for (const [k, [cau, dong]] of Object.entries(MOC)) {
    const c = cauSauNhan.get(k) ?? Infinity, d = dongSauNhan.get(k) ?? Infinity, c1 = truocNhan.get(k) ?? -Infinity;
    console.log(`      (đo ×3: ${k} ${cau} → ${c} câu · ${dong} → ${d} dòng)`);
    if (d > Math.floor(dong * 0.4) || c > c1 + 2 || c > cau - 3) sai.push(`${k}: ${c} câu (×1 ${c1}), ${d} dòng`);
  }
  assert(!sai.length, sai.join('\n'));
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

// ==================================================================== PR-TOC — trần câu SQL của đường ghi theo lô

/** Đếm câu SQL của MỘT lượt POST qua HTTP (tuần tự, như `doSql`). */
async function doGhi(vai: Vai, url: string, body: unknown) {
  const truoc = soCauSql();
  const r = await callHttp(vai, 'POST', url, body);
  return { ...r, n: soCauSql() - truoc };
}
const dongNhap = (tien: string, n: number, ft: boolean) => Array.from({ length: n }, (_, i) => ({
  fullName: `${tien} ${i + 1}`, dob: '12/05/2008', email: `toc${i + 1}.${tien.length}@demo.test`,
  ...(ft ? {
    baselineScore: '5.5', target: '6.5',
    daThiToiMt: i % 5 === 0 ? '4' : undefined,            // em cũ đã thi ngoài web → thêm MT4 lịch sử
    examDate: i % 4 === 0 ? '03/2027' : undefined,
    startWeek: i % 3 === 0 ? undefined : '2026-09-28',    // lẫn tuần khai giảng (MT lịch sử) và tuần riêng
  } : {}),
}));

await checkAsync(`PR-XLMT · Xem trước Xếp lịch MT cả lớp MB FT 101 (POST /ke-hoach-test/hang-loat) ≤ ${TRAN_GHI_LO.xemTruocXepLichMt} câu SQL`, async () => {
  const { ensurePeriod, mondayOf } = await import('../platform/week.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { addDays } = await import('../util.ts');
  const tuan = ensurePeriod(addDays(mondayOf(demoToday()), 7)).id;   // tuần tới — mặc định của ngăn (K4-14)
  const sids = (conn.prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(LOP_FT) as any[]).map((x) => x.id);
  const r = await doGhi('QL', '/ke-hoach-test/hang-loat', {
    classId: LOP_FT, attemptNo: 3, studentIds: sids, xemTruoc: true, tuan: { listening: tuan, reading: tuan, writing: tuan, speaking: tuan },
  });
  assert(r.status === 200 && r.json.dong.length === sids.length, `Xem trước phải trả đủ ${sids.length} em: ${r.status}`);
  console.log(`      (đo: ${sids.length} em, ${r.n} câu)`);
  assert(r.n <= TRAN_GHI_LO.xemTruocXepLichMt, `${r.n} câu > trần ${TRAN_GHI_LO.xemTruocXepLichMt}`);
});

await checkAsync(`PR-TOC · Thêm 35 em lớp FT (POST /intake/commit) ≤ ${TRAN_GHI_LO.themHocVien35FT} câu SQL, đủ lịch MT mặc định`, async () => {
  const r = await doGhi('QL', '/intake/commit', { classId: LOP_FT, rows: dongNhap('Tốc Độ FT', 35, true), idempotencyKey: 'pr-toc-35' });
  assert(r.status === 200 && r.json.added === 35, `Phải thêm đủ 35 em: ${r.status} ${JSON.stringify(r.json)}`);
  assert(r.json.mt.soEm === 35, `Em nào cũng có lịch MT: ${JSON.stringify(r.json.mt)}`);
  const luot = (conn.prepare(
    `SELECT COUNT(*) n FROM assessment_attempts WHERE student_id IN (${r.json.studentIds.join(',')})`).get() as any).n;
  assert(luot === 35 * 3 + 7, `35 em × MT1–3 + 7 em thêm MT4 = 112 lượt, được ${luot}`);
  console.log(`      (đo: ${r.n} câu)`);
  assert(r.n <= TRAN_GHI_LO.themHocVien35FT, `${r.n} câu > trần ${TRAN_GHI_LO.themHocVien35FT}`);
});

await checkAsync(`OV-3b · Lưu nháp lộ trình cả lớp thường (PUT /classes/:id/lo-trinh-nhap) ≤ ${TRAN_GHI_LO.luuNhapCaLop} câu SQL, không tăng theo số em`, async () => {
  const sids = (conn.prepare(
    `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL`).all(LOP_THUONG) as any[]).map((x) => x.id);
  const luu = async (ids: number[]) => {
    const truoc = soCauSql();
    const r = await callHttp('QL', 'PUT', `/classes/${LOP_THUONG}/lo-trinh-nhap`, { items: ids.map((studentId) => ({ studentId, huong: 'len_lop', ghiChu: 'đo' })) });
    return { ...r, n: soCauSql() - truoc };
  };
  const mot = await luu(sids.slice(0, 1));
  const ca = await luu(sids);
  conn.prepare('DELETE FROM lo_trinh_nhap WHERE class_id = ?').run(LOP_THUONG);
  assert(ca.status === 200 && ca.json.ok.length + ca.json.failed.length === sids.length, `Lưu nháp: ${ca.status} ${JSON.stringify(ca.json).slice(0, 300)}`);
  console.log(`      (đo: 1 em ${mot.n} câu, ${sids.length} em ${ca.n} câu)`);
  assert(ca.n === mot.n, `số câu tăng theo số em: ${mot.n} → ${ca.n}`);
  assert(ca.n <= TRAN_GHI_LO.luuNhapCaLop, `${ca.n} câu > trần ${TRAN_GHI_LO.luuNhapCaLop}`);
});

await checkAsync(`PR-TOC · Quyết định chuyển lớp cả lớp thường sang FT (POST /classes/:id/transition, PR-CT) ≤ ${TRAN_GHI_LO.raLenhCaLop} câu SQL`, async () => {
  const them = await callHttp('QL', 'POST', '/intake/commit', { classId: LOP_THUONG, rows: dongNhap('Tốc Độ Thường', 20, false), idempotencyKey: 'pr-toc-20' });
  assert(them.status === 200 && them.json.added === 20, `Chuẩn bị lớp thường 20 em: ${them.status} ${JSON.stringify(them.json)}`);
  const sids = (conn.prepare(
    `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL`).all(LOP_THUONG) as any[]).map((x) => x.id);
  const { tuanChonDuoc } = await import('../../../shared/domain/index.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const r = await doGhi('QL', `/classes/${LOP_THUONG}/transition`, {
    tuanChung: tuanChonDuoc(demoToday())[0], dongs: sids.map((studentId) => ({ studentId, huong: 'fast_track', toClassId: LOP_FT, mucTieu: 6.5 })),
  });
  assert(r.status === 200 && r.json.ok?.length === sids.length && !r.json.failed?.length, `Ra lệnh phải thành công: ${r.status} ${JSON.stringify(r.json).slice(0, 300)}`);
  console.log(`      (đo: ${sids.length} em, ${r.n} câu)`);
  assert(r.n <= TRAN_GHI_LO.raLenhCaLop, `${r.n} câu > trần ${TRAN_GHI_LO.raLenhCaLop}`);
});

await checkAsync(`PR-TOC · THI HÀNH quyết định chuyển lớp cả lớp thường sang FT (thiHanhLenhDenHan, PR-CT) ≤ ${TRAN_GHI_LO.chuyenCaLopSangFT} câu SQL, mỗi em có lịch MT mặc định`, async () => {
  const { thiHanhLenhDenHan } = await import('../classes/lenhChuyen.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { mondayOfDate } = await import('../../../shared/domain/index.ts');
  const sids = (conn.prepare(`SELECT student_id AS id FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai = 'cho'`).all(LOP_THUONG) as any[]).map((x) => x.id);
  assert(sids.length >= 20, `Cần lệnh của cả lớp từ phép đo trước: ${sids.length}`);
  /* Tới Thứ Hai tuần bắt đầu: kéo lệnh về Thứ Hai của tuần hiện tại (đã tới hạn) rồi thi hành. */
  conn.prepare(`UPDATE lenh_chuyen_lop SET tuan_bat_dau = ? WHERE lop_nguon_id = ? AND trang_thai = 'cho'`).run(mondayOfDate(demoToday()), LOP_THUONG);
  let n = 0;
  const goc = conn.prepare.bind(conn);
  (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
  let kq: any;
  try { kq = thiHanhLenhDenHan(demoToday()); } finally { (conn as any).prepare = goc; }
  assert(kq.daChuyen === sids.length && kq.loi === 0, `Thi hành phải chuyển đủ: ${JSON.stringify(kq)}`);
  const coLich = (conn.prepare(
    `SELECT COUNT(DISTINCT c.student_id) n FROM learning_cycles c JOIN assessment_attempts a ON a.cycle_id = c.id
      WHERE c.status = 'active' AND c.route IS NOT NULL AND c.student_id IN (${sids.join(',')})`).get() as any).n;
  assert(coLich === sids.length, `Em nào sang FT cũng có lịch MT: ${coLich}/${sids.length}`);
  console.log(`      (đo: ${sids.length} em, ${n} câu)`);
  assert(n <= TRAN_GHI_LO.chuyenCaLopSangFT, `${n} câu > trần ${TRAN_GHI_LO.chuyenCaLopSangFT}`);
});

await checkAsync(`PR-S3F · Công việc QL (nguoi=tat-ca) với 30 PA "đến lúc thi" chưa có ngày thi ≤ ${TRAN_GHI_LO.congViec30PaChuaNgayThi} câu SQL`, async () => {
  const { demoToday } = await import('../demoConfig.ts');
  const { addDays } = await import('../util.ts');
  const url = '/my-work?nguoi=tat-ca';
  const n0 = (await doSql('QL', 'GET', url)).n;
  const cs = conn.prepare(
    `SELECT MIN(sc.id) AS id, sc.cycle_id FROM sos_cases sc JOIN students s ON s.id = sc.student_id
      WHERE sc.status != 'done' AND s.status = 'active' AND s.archived_at IS NULL AND sc.cycle_id IS NOT NULL
      GROUP BY sc.student_id ORDER BY sc.student_id LIMIT 30`).all() as any[];
  assert(cs.length === 30, `Cần 30 Case mở của 30 em khác nhau, có ${cs.length}`);
  const homNay = demoToday(), bayGio = new Date().toISOString();
  for (const c of cs) {
    conn.prepare(`UPDATE learning_cycles SET exam_date = NULL, exam_month = NULL, exam_period_id = NULL WHERE id = ?`).run(c.cycle_id);
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, needs_approval, preset, moc_quy_che, started_date, cycle_no,
        cycle_started_on, action_due, confirmed_by, confirmed_at, created_at) VALUES (?, 'tutor', 'Tutor · đến lúc thi', 'started', 0, 1, 'until_exam', ?, 1, ?, ?, ?, ?, ?)`)
      .run(c.id, homNay, homNay, addDays(homNay, 7), USER.QT, bayGio, bayGio);
  }
  /* OV-13a (B): lần đọc đầu điền mốc MT cuối của lộ trình cho PA chưa có ngày thi (ghi một lần) — đo lần đọc sau, như người dùng mở lại. */
  const dau = await doSql('QL', 'GET', url);
  const r = await doSql('QL', 'GET', url);
  const conTrong = (conn.prepare(`SELECT COUNT(*) n FROM case_interventions WHERE preset = 1 AND moc_quy_che = 'until_exam' AND followup_due IS NULL AND status = 'started'`).get() as any).n;
  const { mtCuoiCuaLoTrinh } = await import('../cases/sosAuto.ts');
  const coMt = mtCuoiCuaLoTrinh(cs.map((c) => c.cycle_id));
  const mongTrong = cs.filter((c) => !coMt.has(c.cycle_id)).length;   // lộ trình chưa xếp MT nào: vẫn chưa có mốc → việc "Nhập ngày thi" còn
  assert(dau.status === 200 && r.status === 200 && conTrong === mongTrong, `PA "đến lúc thi" có MT cuối phải nhận mốc (còn trống ${conTrong}, mong ${mongTrong}): ${r.status}`);
  console.log(`      (đo: ${n0} câu không PA → ${r.n} câu với 30 PA chưa ngày thi)`);
  assert(r.n <= TRAN_GHI_LO.congViec30PaChuaNgayThi, `${r.n} câu > trần ${TRAN_GHI_LO.congViec30PaChuaNgayThi}`);
});

/* PR-SL: Sửa cả lớp — xem trước kiểm cả lớp một lần; LƯU theo lô `LO_LUU_SUA_CA_LOP` em (web chia lô), mỗi lô gọi lần lượt hàm ghi một em trong MỘT giao dịch. Trần chốt mốc một lô. */
await checkAsync(`PR-SL · Sửa cả lớp MB FT 101: xem trước 30 em + lưu một lô ${LO_LUU_SUA_CA_LOP} em đổi họ tên (POST /classes/:id/sua-ca-lop) ≤ ${TRAN_GHI_LO.xemTruocSuaCaLop30} / ${TRAN_GHI_LO.luuSuaCaLopMotLo} câu SQL`, async () => {
  const sids = (conn.prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 30`).all(LOP_FT) as any[]).map((x) => x.id);
  /* PR-OV2b: dòng có sửa phải đủ email + ngày sinh — em demo có ngày sinh, thiếu email. */
  const rows = sids.map((studentId, i) => ({ studentId, fullName: `Tốc Độ Sửa ${i + 1}`, email: `tocdo${i + 1}@demo.test` }));
  const xem = await doGhi('QL', `/classes/${LOP_FT}/sua-ca-lop/xem-truoc`, { rows });
  const co = LO_LUU_SUA_CA_LOP;
  const luu = await doGhi('QL', `/classes/${LOP_FT}/sua-ca-lop`, { rows: rows.slice(0, co), idempotencyKey: 'pr-sl-lo' });
  assert(xem.status === 200 && luu.status === 200 && luu.json.daSua === co, `${xem.status} ${luu.status} ${JSON.stringify(luu.json)}`);
  console.log(`      (đo: xem trước ${sids.length} em ${xem.n} câu, lưu một lô ${co} em ${luu.n} câu)`);
  assert(xem.n <= TRAN_GHI_LO.xemTruocSuaCaLop30 && luu.n <= TRAN_GHI_LO.luuSuaCaLopMotLo, `${xem.n} / ${luu.n} câu > trần`);
});

await checkAsync(`PR-S5F-b · Công việc GVCN + QL (nguoi=tat-ca) với 60 nhóm PA bổ trợ khắp hệ thống: số câu không tăng theo số nhóm (≤ +${TRAN_GHI_LO.congViec60NhomBoTro})`, async () => {
  const { demoToday } = await import('../demoConfig.ts');
  const { addDays } = await import('../util.ts');
  const n0 = { gv: (await doSql('GVCN', 'GET', '/my-work')).n, ql: (await doSql('QL', 'GET', '/my-work?nguoi=tat-ca')).n };
  const cs = conn.prepare(
    `SELECT MIN(sc.id) AS id FROM sos_cases sc JOIN students s ON s.id = sc.student_id
      WHERE sc.status != 'done' AND s.status = 'active' AND s.archived_at IS NULL
        AND EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
      GROUP BY sc.student_id ORDER BY sc.student_id LIMIT 30`).all() as any[];
  assert(cs.length === 30, `Cần 30 Case mở đã có nguyên nhân của 30 em khác nhau, có ${cs.length}`);
  const homNay = demoToday(), bayGio = new Date().toISOString();
  [...cs, ...cs].forEach((c, i) => {
    const chay = i < 30;   // mỗi Case hai nhóm: 30 nhóm đang chạy (Ghi kết quả) · 30 nhóm chờ nộp kế hoạch
    conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, needs_approval, preset, moc_quy_che, nhom_bo_tro, han_ke_hoach,
        started_date, cycle_no, cycle_started_on, action_due, followup_due, confirmed_by, confirmed_at, created_at) VALUES (?, 'bo_tro', 'Bổ trợ · đo tốc độ', ?, 0, 1, 'den_cuoi_khoa', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      /* Như `taoPaBoTro`: PA bổ trợ luôn có mốc Cuối khoá (`followup_due`) từ lúc tạo. */
      .run(c.id, chay ? 'started' : 'planned', `gk:toc${i}`, addDays(homNay, 3), chay ? homNay : null, 1, chay ? homNay : null,
        chay ? homNay : null, addDays(homNay, 35), chay ? USER.QT : null, chay ? bayGio : null, bayGio);
  });
  const gv = await doSql('GVCN', 'GET', '/my-work'), ql = await doSql('QL', 'GET', '/my-work?nguoi=tat-ca');
  assert(gv.status === 200 && ql.status === 200, `Mã ${gv.status} / ${ql.status}`);
  console.log(`      (đo: GVCN ${n0.gv} → ${gv.n} câu · QL tất cả ${n0.ql} → ${ql.n} câu với 60 nhóm bổ trợ)`);
  assert(gv.n - n0.gv <= TRAN_GHI_LO.congViec60NhomBoTro && ql.n - n0.ql <= TRAN_GHI_LO.congViec60NhomBoTro,
    `Tăng ${gv.n - n0.gv} / ${ql.n - n0.ql} câu > trần +${TRAN_GHI_LO.congViec60NhomBoTro}`);
  conn.prepare(`DELETE FROM case_interventions WHERE nhom_bo_tro LIKE 'gk:toc%'`).run();
});

console.log('\nBảng đo (vai · url → mã HTTP · số câu SQL):');
for (const dong of bangDo) console.log(`  ${dong}`);

await checkAsync(`PR-Dọn (9d) · Đọc hết thông báo (POST /notifications/doc-het) ≤ ${TRAN_GHI_LO.docHet} câu SQL`, async () => {
  const r = await doGhi('GVCN', '/notifications/doc-het', {});
  assert(r.status === 200 && typeof r.json?.daDoc === 'number', `doc-het: ${r.status} ${JSON.stringify(r.json)}`);
  console.log(`      (đo: ${r.n} câu)`);
  assert(r.n <= TRAN_GHI_LO.docHet, `${r.n} câu > trần ${TRAN_GHI_LO.docHet}`);
});

await checkAsync(`PR-XUAT · Xuất Excel cả chi nhánh MB, MT1–MT8, cột đầy đủ (POST /xuat-mt) ≤ ${TRAN_GHI_LO.xuatMtChiNhanh} câu SQL, phản hồi < 6 MB`, async () => {
  const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const r = await doGhi('QL', '/xuat-mt', { chiNhanh: [mb], tg: 'dot', dot: ['mt:1', 'mt:2', 'mt:3', 'mt:4', 'mt:5', 'mt:6', 'mt:7', 'mt:8'], cot: 'day-du' });
  assert(r.status === 200 && r.json.dem.luot > 0 && r.json.sheets[0].aoa.length === r.json.dem.luot + 1, `Xuất phải trả đủ dòng: ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  const kb = Math.round(JSON.stringify(r.json).length / 1024);
  console.log(`      (đo: ${r.json.dem.luot} lượt, ${r.n} câu, ${kb} KB)`);
  assert(kb < 6 * 1024, `${kb} KB ≥ 6 MB (trần Netlify)`);
  assert(r.n <= TRAN_GHI_LO.xuatMtChiNhanh, `${r.n} câu > trần ${TRAN_GHI_LO.xuatMtChiNhanh}`);
});

await checkAsync(`PR-LT2a (M1b) · Thêm 30 em lớp thường (POST /intake/commit) ≤ ${TRAN_GHI_LO.themHocVien30Thuong} câu SQL, em nào cũng có bài Final Test tự tạo`, async () => {
  const r = await doGhi('QL', '/intake/commit', { classId: LOP_THUONG, rows: dongNhap('Tốc Độ Thường LT2a', 30, false), idempotencyKey: 'pr-lt2a-30' });
  assert(r.status === 200 && r.json.added === 30, `Phải thêm đủ 30 em: ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  const coBai = (conn.prepare(
    `SELECT COUNT(DISTINCT student_id) n FROM assessment_attempts WHERE kind = 'final' AND status = 'planned' AND student_id IN (${r.json.studentIds.join(',')})`).get() as any).n;
  assert(coBai === 30, `Em nào vào lớp thường cũng có bài Final Test: ${coBai}/30`);
  console.log(`      (đo: 30 em, ${r.n} câu)`);
  assert(r.n <= TRAN_GHI_LO.themHocVien30Thuong, `${r.n} câu > trần ${TRAN_GHI_LO.themHocVien30Thuong}`);
});

await checkAsync(`PR-CT2 · Ra lệnh cả lớp thường 10 em Final đủ điểm, có Case Giữa khoá (sinh bổ trợ sớm) ≤ ${TRAN_GHI_LO.raLenhSinhBoTro} · đổi 10 em lên → học lại (huỷ bổ trợ) ≤ ${TRAN_GHI_LO.doiLenhHuyBoTro} câu SQL`, async () => {
  const { createClass } = await import('../classes/intake.ts');
  const { ensurePeriod } = await import('../platform/week.ts');
  const { planRegularTests } = await import('../normal/regular.ts');
  const { addDays } = await import('../util.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { tuanChonDuoc, mondayOfDate, caseDedupKey } = await import('../../../shared/domain/index.ts');
  const admin = loadPrincipal(USER.QT);
  const homNay = demoToday(), now = new Date().toISOString();
  const lop = (code: string, kind: string, tuan: number) => {
    const bat = mondayOfDate(addDays(homNay, -7 * (tuan - 1)));
    return (createClass(admin, { code, branchId: CN, kind, startDate: bat, startPeriodId: ensurePeriod(bat).id }) as any).id as number;
  };
  const nguon = lop('MB-TDCT1', 'FOU', 9), dich = lop('MB-TDCT2', 'BE', 1), hocLai = lop('MB-TDCT3', 'FOU', 1);
  const sids: number[] = [];
  for (let i = 0; i < 10; i++) {
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-TDCT${i}`, `Toc Do CT2 ${i}`, `toc do ct2 ${i}`, CN, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, nguon, homNay, now);
    const cyc = conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`).run(sid, homNay, now).lastInsertRowid;
    /* Case Giữa khoá G+V còn mở (thường gặp ở em 50–69%) → nhận PA Final, `dongBoTrangThaiCase` từng Case ở cả sinh lẫn huỷ. */
    conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, owner_user_id, detected_at, dedup_key, created_at)
      VALUES (?,?, 'writing', 'writing', 'teacher_report', 'in_progress', ?, ?, ?, ?)`).run(sid, cyc, USER.QL, homNay, caseDedupKey({ category: 'writing', studentId: sid, cycleId: Number(cyc) }), now);
    sids.push(sid);
  }
  planRegularTests(admin, nguon, { studentIds: sids, kinds: ['final'] });
  /* Điểm Final đủ (55%, trượt G+V và P) ghi thẳng — phép đo chỉ đo đường ra lệnh. */
  for (const r of conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'final'`).all(nguon) as any[]) {
    for (const [k, v] of [['listening', 18], ['reading', 18], ['writing', 10], ['speaking', 9]] as const) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total) VALUES (?,?,?,25)').run(r.id, k, v);
    }
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(r.id);
  }
  const tuanChung = tuanChonDuoc(homNay)[0];
  const soMt = () => (conn.prepare(`SELECT COUNT(*) n FROM mini_test WHERE student_id IN (${sids.join(',')})`).get() as any).n as number;
  const sinh = await doGhi('QL', `/classes/${nguon}/transition`, { tuanChung, dongs: sids.map((studentId) => ({ studentId, huong: 'len_lop', toClassId: dich })) });
  assert(sinh.status === 200 && sinh.json.ok?.length === 10 && soMt() === 10, `Ra lệnh phải sinh 10 Mini Test: ${sinh.status} ${soMt()} ${JSON.stringify(sinh.json).slice(0, 300)}`);
  const huy = await doGhi('QL', `/classes/${nguon}/transition`, { tuanChung, dongs: sids.map((studentId) => ({ studentId, huong: 'hoc_lai', toClassId: hocLai })) });
  assert(huy.status === 200 && huy.json.ok?.length === 10 && soMt() === 0, `Đổi học lại phải huỷ hết: ${huy.status} ${soMt()} ${JSON.stringify(huy.json).slice(0, 300)}`);
  console.log(`      (đo: 10 em, sinh ${sinh.n} câu · huỷ ${huy.n} câu)`);
  assert(sinh.n <= TRAN_GHI_LO.raLenhSinhBoTro, `sinh ${sinh.n} câu > trần ${TRAN_GHI_LO.raLenhSinhBoTro}`);
  assert(huy.n <= TRAN_GHI_LO.doiLenhHuyBoTro, `huỷ ${huy.n} câu > trần ${TRAN_GHI_LO.doiLenhHuyBoTro}`);
});

/* OV-13c (rà #412): Xác nhận PA cùng lúc — web gửi lô ≤ 3 PA mỗi lời gọi (Netlify 10 s); khoá ≤ 45 câu SQL / PA trên dữ liệu ×3. */
await checkAsync('OV-13c · POST /interventions/xac-nhan-pa-lo (×3): lô 3 PA ≤ 45 câu SQL / PA', async () => {
  const { myWork } = await import('../worklist/mywork.ts');
  const p = PRINCIPAL_CUA.get(USER.QL) ?? loadPrincipal(USER.QL);
  const ids = [...new Set((chayTrongRequest('GET', () => myWork(p, { nguoi: 'tat-ca' })).items as any[]).filter((x) => x.group === 'xac_nhan_pa').map((x) => x.paId as number))].slice(0, 3);
  assert(ids.length > 0, 'không có PA chờ xác nhận để đo');
  const truoc = soCauSql();
  const { status, json } = await callHttp('QL', 'POST', '/interventions/xac-nhan-pa-lo',
    { chung: { description: 'Hai buổi mỗi tuần, chữa đề bấm giờ, GV gửi nhận xét.' }, ds: ids.map((id) => ({ id })) });
  const cau = soCauSql() - truoc;
  console.log(`      (đo ×3: ${ids.length} PA → ${cau} câu, ${(cau / ids.length).toFixed(1)} câu / PA · ok ${json?.ok?.length} · lỗi ${json?.loi?.length})`);
  assert(status === 200 && json.ok.length === ids.length, `kết quả: ${status} ${JSON.stringify(json)}`);
  assert(cau <= 45 * ids.length, `${cau} câu cho ${ids.length} PA (> 45 / PA)`);
});

check('PR-DEPLOY (3b) · Giới hạn Turso trên mọi (đường × vai) sau nhân dữ liệu ×3 + mọi đường ghi lô: mỗi câu ≤ 900 tham số, ≤ 20 vế UNION, 0 tham số đặt tên', () => {
  doTurso.bat = false;
  const dong = (c: CauDo) => `${c.nhan} · ${c.thamSo} tham số · ${c.ve} vế · ${c.sql}`;
  console.log(`      (đo ${doTurso.soCau} lần chạy câu SQL)`);
  console.log('      5 câu nặng nhất theo tham số:'); for (const c of doTurso.nangThamSo) console.log(`        ${dong(c)}`);
  console.log('      5 câu nặng nhất theo vế UNION:'); for (const c of doTurso.nangVe) console.log(`        ${dong(c)}`);
  assert(doTurso.soCau > 1000, `thước đo không bắt được câu nào (${doTurso.soCau}) — móc sai chỗ`);
  assert((doTurso.nangThamSo[0]?.thamSo ?? 0) <= 900, `vượt 900 tham số: ${dong(doTurso.nangThamSo[0])}`);
  assert((doTurso.nangVe[0]?.ve ?? 0) <= 20, `vượt 20 vế UNION: ${dong(doTurso.nangVe[0])}`);
  assert(doTurso.datTen.length === 0, `tham số đặt tên: ${doTurso.datTen.map(dong).join(' | ')}`);
});

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
