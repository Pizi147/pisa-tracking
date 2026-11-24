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

const { db, closeDb, THAM_SO_TOI_DA, tuanTheoKetNoi, docNho } = await import('../db.ts');
const { tuanTheoId } = await import('../fasttrack/skillSchedule.ts');
const { runSeed } = await import('../seed/seed.ts');
const { createApp } = await import('../app.ts');
const { createSession } = await import('../auth.ts');
const {
  chayTrongRequest, nho, coNho, trongBoNho, soCauSql, soDongSql, demHienTai,
} = await import('../platform/nguCanhRequest.ts');
const { loadPrincipal, can, napTruocPhamVi, scopeFor, boLopCu, boVaiBpxl } = await import('../permissions.ts');
const accounts = await import('../platform/accounts.ts');
const { PERMISSIONS, LO_LUU_SUA_CA_LOP, LO_HANG_LOAT_EM } = await import('../../../shared/domain/index.ts');
const { listCases } = await import('../cases/cases.ts');
const { standingFor } = await import('../students/standing.ts');   // RA-DOC-0611
const { chiSoHoSoGv, phanTichGiaoVien } = await import('../phanTich/giaoVien.ts');   // RA-DOC-0611 · GIAM-DOC-0711a
const { myWork, caseMoTapChaKhiKiem } = await import('../worklist/mywork.ts');   // RA-DOC-0611b
const { danhSachHocVienLop, thieuThongTinHocVien } = await import('../classes/hocVienLop.ts');   // GIAM-DOC-0611
const { mtLichSuChuaNhap } = await import('../cham/canCham.ts');
const { bangChiNhanh } = await import('../worklist/bangChiNhanh.ts');   // TQ-SOS-CN: `{sos23}`   // GIAM-DOC-0611f
const { DUONG_DO, MOI_VAI, TRAN: TRAN_MAU, TRAN_DONG: TRAN_DONG_MAU, TRAN_GHI_LO, TRAN_VH_DUOC_GIAO } = await import('./tocDoDuong.ts');
const nguCanhTd = await import('../platform/nguCanhRequest.ts');   // TD-GHI
const { demoToday: demoToday15d } = await import('../demoConfig.ts');

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
/** TD5: ghi câu (văn bản + tham số) trong lúc `ghi` khác null — để EXPLAIN QUERY PLAN lại sau. */
const doQuet: { ghi: { sql: string; args: unknown[] }[] | null } = { ghi: null };
let sauGhi = 0;   // get() của câu dùng lại đi qua all() — chỉ ghi lần gọi ngoài
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
      if (doQuet.ghi && this.__sql && !sauGhi) doQuet.ghi.push({ sql: this.__sql, args });
      sauGhi++;
      let out: any;
      try { out = goc.apply(this, args); } finally { sauGhi--; }
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
/** OV-15i1: lộ trình đang học + lượt Test đầu của {hv} — Lịch sử thi thật / ô điểm. */
const LO_TRINH_HV = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id DESC LIMIT 1`).get(HV) as any).id as number;
const LUOT_HV = (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? ORDER BY id LIMIT 1`).get(HV, LOP_FT) as any).id as number;
/** HSL-MAY-CHU: một Progress Test của lớp thường mẫu — `/regular/attempts/{luotThuong}`. */
const LUOT_THUONG = (conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'progress' AND status != 'cancelled' ORDER BY id LIMIT 1`).get(LOP_THUONG) as any).id as number;
/** PR-TK: lớp ĐÃ KẾT THÚC có bản chụp (lớp cũ của em có lộ trình đóng) — đường `/classes/{lopKetThuc}/tong-ket`. Bộ demo chưa có lớp kết thúc → đặt lớp cũ đó `finished`. */
const LOP_KET_THUC = (conn.prepare('SELECT class_id AS id FROM ban_chup_lo_trinh WHERE cycle_id = ? AND class_id IS NOT NULL').get(LO_TRINH_DONG) as any)?.id as number;
assert(LOP_KET_THUC, 'Bản chụp mẫu thiếu lớp');
/** TL-GV: hộp Tuần dạy `/cycles/{loTrinhThi}/tuan-day` — bộ demo chưa có KQ thi thật: gắn ngày thi cho lộ trình ĐÃ ĐÓNG mẫu (không vào Công việc). */
const LO_TRINH_THI = (conn.prepare(`SELECT c.id FROM learning_cycles c JOIN students s ON s.id = c.student_id
   WHERE s.branch_id = ? AND c.route IS NOT NULL AND c.status != 'active' ORDER BY c.id LIMIT 1`).get(CN) as any)?.id as number;
assert(LO_TRINH_THI, 'Seed thiếu lộ trình FT đã đóng ở chi nhánh MB');
conn.prepare(`UPDATE learning_cycles SET exam_date = COALESCE(exam_date, date(started_at, '+70 days')) WHERE id = ?`).run(LO_TRINH_THI);
/** BAN-GIAO-NHAN: phiếu chuyển lớp ĐÃ XÁC NHẬN của chi nhánh mẫu — `/lenh-chuyen/{lenhBg}/ban-giao`. */
const LENH_BG = (conn.prepare(`SELECT l.id FROM lenh_chuyen_lop l JOIN classes c ON c.id = l.lop_nguon_id
   WHERE c.branch_id = ? AND l.xac_nhan_luc IS NOT NULL AND l.trang_thai != 'huy' AND l.huong != 'dung_hoc' ORDER BY l.id LIMIT 1`).get(CN) as any)?.id as number;
assert(LENH_BG, 'Seed thiếu phiếu bàn giao đã xác nhận ở chi nhánh MB');
conn.prepare(`UPDATE classes SET status = 'finished', finished_at = COALESCE(finished_at, ?) WHERE id = ?`).run(new Date().toISOString().slice(0, 10), LOP_KET_THUC);
const KASE = (
  conn
    .prepare(
      `SELECT sc.id AS id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE COALESCE(sc.student_id, a.student_id) = ? ORDER BY sc.id LIMIT 1`,
    )
    .get(HV) as any
)?.id as number | undefined;
/** TU-a: một PA Tutor đang chạy của lớp mẫu — đường `/tutors/chon?paId={paTutor}` (ô chọn tutor của Ghi kết quả). */
/** PANEL-MC: thẻ Chờ duyệt có đối tượng PA (Lịch sử yêu cầu gộp nhật ký thẻ + PA + Case). */
const YC_PA = (conn.prepare(`SELECT id FROM yeu_cau_duyet WHERE doi_tuong_loai = 'intervention' AND trang_thai = 'cho'
   AND chi_nhanh_id = (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id LIMIT 1`).get(LOP_FT) as any)?.id as number;   // chi nhánh của QL đo
const PA_TUTOR = (conn.prepare(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
    JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active' AND e.class_id = ?
   WHERE iv.kind = 'tutor' AND iv.status = 'started' ORDER BY iv.id LIMIT 1`).get(LOP_FT) as any)?.id as number;
assert(PA_TUTOR, 'Seed thiếu PA Tutor đang chạy ở MB FT 101');
/** GD-20c: PA đang chạy của MB FT 101 (≤ 20) — đường `/interventions/luoi-ket-qua?ids={paLuoi}` (lưới Ghi kết quả PA một dòng gộp). */
const PA_LUOI = (conn.prepare(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
    JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active' AND e.class_id = ?
   WHERE iv.status IN ('planned', 'started') ORDER BY iv.id LIMIT 20`).all(LOP_FT) as any[]).map((r) => r.id).join(',');
assert(PA_LUOI, 'Seed thiếu PA đang chạy ở MB FT 101');
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
  TVV: userByRole('consultant', 'MB'),   // B2-14 (TURSO-5): TVV đông em nhất của seed (MB, 49 em) — trước TVV Cẩm Phả 4 em, trần TVV không bắt được tăng thật
  CX: userByRole('cx', null),
  HDT: userByRole('head_tutor', null),   // TU2-5: Head tutor — chỉ đo đường trang Tutor
  BPXL: userByRole('scheduler', 'MB'),   // BPXL-1: tài khoản demo Chuyên viên Xếp lịch Monbay
};
/** TQ-SOS-CN: `{sos23}` = id em SOS 2–3 của chi nhánh `{cn}` (chính `sos23Ids` của bảng Tổng quan) — tính lại sau khi nhân dữ liệu. */
const tinhSos23 = () => ((bangChiNhanh(loadPrincipal(USER.QT), { ct: 'ft', chuY: true }).hang.find((h: any) => h.id === CN)?.sos23 ?? []) as number[]).join(',');
let SOS23 = tinhSos23();
/** Quản lý chi nhánh CP — dùng riêng ở Task 2 phép kiểm (c)/(e) (chi nhánh KHÁC với MB của mọi vai trên). */
const QL_CP = userByRole('manager', 'CP');
/** PR-B: một việc bàn giao đổi GV ĐÃ XÁC NHẬN ở MB FT 101 (GVBM → GVCN môn L, chưa chụp tự điền) — đường `/ban-giao-gv/{bgGv}`. Đã xác nhận nên
 *  không vào Công việc (băm /my-work giữ); dòng đổi phân công `huy` nên không đổi quyền xem. */
const BG_GV = (() => {
  const luc = new Date().toISOString();
  const doi = Number(conn.prepare(`INSERT INTO doi_phan_cong (class_id, khoa, nguoi_cu, nguoi_moi, hieu_luc, trang_thai, tao_boi, tao_luc) VALUES (?, 'listening', ?, ?, ?, 'huy', ?, ?)`)
    .run(LOP_FT, USER.GVBM, USER.GVCN, demoToday15d(), USER.QL, luc).lastInsertRowid);
  const id = Number(conn.prepare(`INSERT INTO ban_giao_gv (class_id, nguoi_cu, nguoi_lam, hieu_luc, han, trang_thai, tao_luc, tao_boi, xong_luc, xong_boi) VALUES (?,?,?,?,?, 'xong', ?,?,?,?)`)
    .run(LOP_FT, USER.GVBM, USER.GVBM, demoToday15d(), demoToday15d(), luc, USER.QL, luc, USER.GVBM).lastInsertRowid);
  conn.prepare(`INSERT INTO ban_giao_gv_mon (ban_giao_id, mon, nguoi_moi, doi_id, trang_thai) VALUES (?, 'listening', ?, ?, 'mo')`).run(id, USER.GVCN, doi);
  return id;
})();

/*
 * VH-1 (N59): ĐO TRÊN SEED CÓ DỮ LIỆU — 24 việc Vận hành ở chi nhánh mẫu (4 nhóm khởi đầu + "Không phân loại", 8 việc con, 2 người theo dõi mỗi việc, 4 việc lặp),
 * giao BPXL, Admin MB theo dõi (đo `/mgmt-tasks` QL · QT · CX, `/my-work` BPXL — vai có việc Vận hành; `/my-work/theo-doi` Admin). Không giao GV / Admin (trần + băm `/my-work` giữ).
 */
{
  const mg = await import('../worklist/mgmttasks.ts');
  const qlP = loadPrincipal(USER.QL);
  const nhom = (conn.prepare('SELECT id FROM task_groups WHERE khoa IS NOT NULL ORDER BY thu_tu').all() as any[]).map((r) => r.id as number);
  for (let i = 0; i < 24; i++) {
    const [nguoi, theoDoi] = [USER.BPXL, USER.ADMIN];
    const v = mg.createMgmtTask(qlP, { title: `Đo VH ${i + 1}`, branchId: CN, groupId: i % 5 === 4 ? null : nhom[i % 4], assigneeUserId: nguoi,
      theoDoiIds: [theoDoi], due: demoToday15d(), ...(i % 6 === 0 ? { lap: { kieu: 'tuan', ngay: [1, 4] } } : {}),
      /* VH-1b (N62): 12 / 24 việc có hạng mục chính thống (+ lớp mẫu) — vào đúng mục ở /my-work BPXL, không thêm câu. */
      ...(i % 2 ? { hangMuc: ['bao-ph', 'sau-thi', 'mock'][i % 3], classId: LOP_FT } : {}) } as any);
    if (i % 3 === 0) mg.createMgmtTask(qlP, { title: `Đo VH ${i + 1} · con`, parentTaskId: v.id, assigneeUserId: nguoi, due: demoToday15d() } as any);
  }
}

/** VH-1b (N62): một việc Báo PH (khối giao việc N58 + Mô tả) — đường `/giao-viec/bao_ph/{viecBaoPh}`. */
const VIEC_BAO_PH = (conn.prepare(`SELECT v.id FROM viec_bao_ph v JOIN students s ON s.id = v.student_id WHERE s.branch_id = ? ORDER BY v.id LIMIT 1`).get(CN) as any)?.id as number;
assert(VIEC_BAO_PH, 'Seed thiếu việc Báo PH ở chi nhánh MB');
/** NHẸ HƠN PR-2b: một vi phạm ở chi nhánh MB — tệp của vi phạm tải khi mở dòng ở panel Báo PH (`/attachments?ownerType=violation`). */
const VP = (conn.prepare(`SELECT x.id FROM violations x JOIN students s ON s.id = x.student_id WHERE s.branch_id = ? ORDER BY x.id LIMIT 1`).get(CN) as any)?.id as number;
assert(VP, 'Seed thiếu vi phạm ở chi nhánh MB');
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
    .replace('{loTrinhHv}', String(LO_TRINH_HV))
    .replace('{loTrinhThi}', String(LO_TRINH_THI))
    .replace('{luotHv}', String(LUOT_HV))
    .replace('{luotThuong}', String(LUOT_THUONG))
    .replace('{lopKetThuc}', String(LOP_KET_THUC))
    .replace('{case}', String(KASE))
    .replace('{paTutor}', String(PA_TUTOR))
    .replace('{paLuoi}', PA_LUOI)
    .replace('{ycPa}', String(YC_PA))
    .replace('{bgGv}', String(BG_GV))
    .replace('{lenhBg}', String(LENH_BG))
    .replace('{viecBaoPh}', String(VIEC_BAO_PH))
    .replace('{vp}', String(VP))
    .replace('{cn}', String(CN))
    .replace('{sos23}', SOS23)
    .replace('{gv}', String(USER.GVCN));
}
/* PANEL-MC: khoá trần được viết bằng chỗ thay như URL (`{ycPa}`…) — id lấy từ dữ liệu lúc chạy, không viết cứng. Khoá đã là id thật giữ nguyên. */
const TRAN: Record<string, number> = Object.fromEntries(Object.entries(TRAN_MAU).map(([k, v]) => [urlFor(k), v]));
const TRAN_DONG: Record<string, number> = Object.fromEntries(Object.entries(TRAN_DONG_MAU).map(([k, v]) => [urlFor(k), v]));

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
async function doSql(vai: Vai, method: string, url: string): Promise<{ n: number; dong: number; status: number; json: unknown }> {
  /*
   * TL-NEN: quét đường đọc chạy theo mốc DB (60 s / sau ghi qua API / sang ngày) — các lượt ghi lô ở tệp này xoá mốc. Đo GET với mốc CÒN HẠN
   * (như phần lớn GET thật); `PISA_DO_QUET=1` đo khi quét chạy (mốc NULL). Đặt trước khi tính câu — không vào số đo.
   */
  if (method === 'GET') conn.prepare(`UPDATE moc_he_thong SET luc = ?, ngay = ? WHERE khoa LIKE 'quet:%'`)
    .run(process.env.PISA_DO_QUET === '1' ? null : new Date().toISOString(), demoToday15d());
  const truoc = soCauSql(), dongTruoc = soDongSql();
  if (process.env.PISA_DEM_SQL === '1') console.log(`[vai] ${vai}`);   // TD3-0: dòng `[sql]` ngay sau là của vai này
  const { status, json } = await callHttp(vai, method, url);
  const sau = soCauSql();
  return { n: sau - truoc, dong: soDongSql() - dongTruoc, status, json };
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

check('TOC-DO-2511 · tuần (`tuanTheoId`) nhớ theo tiến trình: GET sau 0 câu, POST vẫn đọc', () => {
  const r = conn.prepare('SELECT id, week_start, week_end, code FROM report_periods ORDER BY id LIMIT 1').get() as any;
  chayTrongRequest('GET', () => (nguCanhTd.datMoc({}), tuanTheoId([r.id])));
  let n = soCauSql();
  const t = chayTrongRequest('GET', () => (nguCanhTd.datMoc({}), tuanTheoId([r.id, r.id])));
  assert(soCauSql() === n, `GET thứ hai phải 0 câu, có ${soCauSql() - n}`);
  assert(t.size === 1 && JSON.stringify(t.get(r.id)) === JSON.stringify({ week_start: r.week_start, week_end: r.week_end, code: r.code }), `sai dòng: ${JSON.stringify([...t])}`);
  n = soCauSql();
  chayTrongRequest('POST', () => (nguCanhTd.datMoc({}), tuanTheoId([r.id])));
  assert(soCauSql() === n + 1, 'request ghi phải đọc lại (tuần vừa chèn trong giao dịch có thể bị huỷ)');
  assert(!tuanTheoKetNoi.get(conn)?.has(-1) && chayTrongRequest('GET', () => (nguCanhTd.datMoc({}), tuanTheoId([-1]))).size === 0, 'id không có phải trả rỗng');
});

check('TOC-DO-2511b · docNho: GET đọc một lần mỗi (câu, tham số); câu ghi xoá nhớ; POST đọc lại', () => {
  const sql = 'SELECT id FROM report_periods WHERE id = ?';
  let n = soCauSql();
  chayTrongRequest('GET', () => { docNho(sql, 1); docNho(sql, 1); });
  assert(soCauSql() === n + 1, `GET: ${soCauSql() - n} câu`);
  n = soCauSql();
  chayTrongRequest('GET', () => { docNho(sql, 1); conn.prepare("UPDATE moc_he_thong SET luc = luc WHERE khoa = 'tham-chieu'").run(); docNho(sql, 1); });
  assert(soCauSql() === n + 3, `GET có ghi: ${soCauSql() - n} câu`);
  n = soCauSql();
  chayTrongRequest('POST', () => { docNho(sql, 1); docNho(sql, 1); });
  assert(soCauSql() === n + 2, `POST: ${soCauSql() - n} câu`);
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

check('TD-GHI · request ghi: nhoTheoBang giữ qua câu ghi bảng khác, quên khi ghi bảng nguồn / RETURNING / BEGIN·ROLLBACK; SAVEPOINT giữ; nho() vẫn tắt; nhoTheoId giữ tới câu ghi kế; GET = nho', () => {
  const ngu = nguCanhTd;
  conn.exec('CREATE TABLE IF NOT EXISTS _td_nguon (v INTEGER); CREATE TABLE IF NOT EXISTS _td_khac (v INTEGER)');
  try {
    const nhan = (v: string) => assert(ngu.bangDichGhi(v.split('|')[0]) === v.split('|')[1], `bảng đích sai: ${v}`);
    ['INSERT OR REPLACE INTO _td_nguon (v) VALUES (1)|_td_nguon', 'UPDATE OR IGNORE _td_nguon AS a SET v = (SELECT 1 FROM _td_khac)|_td_nguon',
      'DELETE FROM "_td_nguon" WHERE v IN (SELECT v FROM _td_khac)|_td_nguon', 'WITH x AS (SELECT 1 FROM _td_khac) UPDATE _td_nguon SET v = 1|_td_nguon',
      'INSERT INTO _td_khac (v) SELECT v FROM _td_nguon ON CONFLICT DO UPDATE SET v = 2|_td_khac', 'UPDATE main._td_nguon SET v = 1|_td_nguon',
      'DELETE FROM "main"."_td_nguon"|_td_nguon'].forEach(nhan);
    assert(ngu.bangDichGhi('PRAGMA optimize') === null, 'câu không có bảng đích phải null (quên hết)');
    ngu.chayTrongRequest('POST', () => {
      let n = 0;
      const doc = () => ngu.nhoTheoBang(['_td_nguon'], 'td-ghi', () => ++n);
      doc(); doc();
      assert(n === 1, `nhớ trong request ghi: ${n}`);
      conn.prepare('INSERT INTO _td_khac (v) VALUES (1)').run();
      conn.prepare('UPDATE _td_khac SET v = (SELECT COUNT(*) FROM _td_nguon)').run();   // bảng nguồn chỉ ĐỌC trong câu ghi → giữ
      doc();
      assert(n === 1, `ghi bảng khác phải giữ: ${n}`);
      conn.prepare('INSERT INTO _td_nguon (v) VALUES (1)').run();
      doc();
      assert(n === 2, `ghi bảng nguồn phải quên: ${n}`);
      conn.prepare('UPDATE _td_nguon SET v = 2 RETURNING v').all();
      doc();
      assert(n === 3, `RETURNING vào bảng nguồn phải quên: ${n}`);
      conn.exec('SAVEPOINT td_ghi'); conn.exec('RELEASE td_ghi');
      doc();
      assert(n === 3, `SAVEPOINT / RELEASE phải giữ: ${n}`);
      conn.exec('BEGIN'); doc();
      assert(n === 4, `BEGIN phải quên (đọc lại trong giao dịch): ${n}`);
      conn.prepare('INSERT INTO _td_nguon (v) VALUES (9)').run(); doc();
      conn.exec('ROLLBACK'); doc();
      assert(n === 6, `ROLLBACK phải quên (giá trị vừa cuộn lại): ${n}`);
      /* trongBoNho trong request ghi: câu ghi bên trong quên luôn nhớ của request ngoài. */
      ngu.trongBoNho(() => conn.prepare('INSERT INTO _td_nguon (v) VALUES (3)').run());
      doc();
      assert(n === 7, `ghi trong trongBoNho phải quên nhớ ngoài: ${n}`);
      let m = 0;
      ngu.nho('td-ghi-nho', () => ++m); ngu.nho('td-ghi-nho', () => ++m);
      assert(m === 2 && !ngu.coNho(), `nho() / coNho() trong request ghi phải như cũ (tắt): ${m}`);
      let k = 0;
      const theoId = () => ngu.nhoTheoId('td-ghi-id:', [1, 2], (ids) => { k++; return new Map(ids.map((id) => [id, [{ id }]])); });
      const a = theoId(); a.get(1)![0].id = 99;
      assert(theoId().get(1)![0].id === 1 && k === 1, `nhoTheoId giữ + trả bản chép: ${k}`);
      conn.prepare('INSERT INTO _td_khac (v) VALUES (2)').run(); theoId();
      assert(k === 2, `nhoTheoId phải quên sau MỌI câu ghi: ${k}`);
    });
    ngu.chayTrongRequest('GET', () => {
      let n = 0;
      const doc = () => ngu.nhoTheoBang(['_td_nguon'], 'td-ghi-get', () => ++n);
      doc(); doc();
      conn.prepare('INSERT INTO _td_khac (v) VALUES (3)').run(); doc();
      assert(n === 2, `GET: như nho() — mọi câu ghi đều quên: ${n}`);
    });
  } finally { conn.exec('DROP TABLE IF EXISTS _td_nguon; DROP TABLE IF EXISTS _td_khac'); }
});

/* TD-GHI: `nhoTheoBang` không thấy câu ghi do TRIGGER sinh ra — mọi trigger (schema.sql, migrate, cauHinh.ts) chỉ được ghi vào ba bảng không bảng nào gắn nhãn. */
check('TD-GHI · mọi CREATE TRIGGER chỉ ghi attempt_skills / sos_cases / moc_he_thong (giả định của nhoTheoBang)', () => {
  const src = path.resolve(__dirname, '../../../../server/src');   // chạy từ dist-server/server/src/tests: đọc mã nguồn
  const tep = [path.join(src, 'schema.sql'), path.join(src, 'platform', 'cauHinh.ts'),
    ...fs.readdirSync(path.join(src, 'migrate')).filter((f) => f.endsWith('.ts')).map((f) => path.join(src, 'migrate', f))];
  const DUOC = new Set(['attempt_skills', 'sos_cases', 'moc_he_thong']);
  const sai: string[] = [];
  let dem = 0;
  for (const f of tep) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/CREATE TRIGGER[\s\S]*?\bBEGIN\b([\s\S]*?)\bEND\b/gi)) {
      dem++;
      for (const g of m[1].matchAll(/\b(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?|DELETE\s+FROM)\s+["`[]?(\w+)/gi)) {
        if (!DUOC.has(g[1].toLowerCase())) sai.push(`${path.basename(f)}: ${g[1]}`);
      }
    }
  }
  assert(dem >= 7, `không tìm thấy trigger (${dem}) — mẫu quét sai`);
  assert(!sai.length, `trigger ghi bảng mới: ${sai.join(', ')} — rà mọi nhoTheoBang đọc bảng đó (nguCanhRequest.ts) rồi mới thêm vào danh sách`);
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

/* B2-14 (TURSO-5): vai TVV đo bằng TVV MB (cùng chi nhánh lớp mẫu) → ba đường trước đo 403 nay 200 ở Task1(g); giữ phép kiểm TVV chi nhánh KHÁC vẫn 403. */
await checkAsync('B2-14 · TVV Cẩm Phả (chi nhánh khác lớp mẫu MB) vẫn 403 ở Báo cáo PH · chữ đã ghi · khối giao việc Báo PH', async () => {
  const tvvCp = userByRole('consultant', 'CP');
  for (const mau of ['/classes/{lopFT}/bao-cao-ph', '/classes/{lopFT}/chu-da-ghi?tu=2026-06-01&den=2026-09-28', '/giao-viec/bao_ph/{viecBaoPh}']) {
    const r = await callHttpUser(tvvCp, 'GET', urlFor(mau));
    assert(r.status === 403, `TVV CP ${mau} → ${r.status}`);
  }
});

// ==================================================================== Task 2 — quyền & ngày nghiệp vụ qua bộ nhớ

const TOAN_BO_HV = (conn.prepare('SELECT id FROM students ORDER BY consultant_user_id, id').all() as any[]).map((r) => r.id as number);
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
  p = boVaiBpxl(p);   // BPXL-1 (N57): BPXL không xem Case — cùng luật `listCases`
  if (scopeFor(p, PERMISSIONS.ATTEMPT_VIEW).none) return new Set();
  const where: string[] = ['sc.tam = 0'];   // OV-13a: listCases không kèm Case tạm (`CASE_THAT`) — SOS-TAM-PA sinh Case tạm cả ô chưa nhận xét
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
    /* N48 (AU-VIEC-3): danh sách Case không gồm em lớp cũ (quyền tạm chỉ mở hồ sơ một em) — cùng luật `listCases` (`boLopCu`). */
    if (can(boLopCu(p), PERMISSIONS.ATTEMPT_VIEW, { classId: r.eff_class_id, studentId: r.eff_student_id })) ids.add(r.id as number);
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

check('RA-DOC-0611 · standingFor nhớ theo em (tập con, khác thứ tự: 0 câu, như tính thẳng) · chiSoHoSoGv chiHocThuat giữ số Tổng quan GV', () => {
  const ids = (conn.prepare('SELECT id FROM students WHERE branch_id = ? ORDER BY id LIMIT 80').all(CN) as any[]).map((r) => r.id as number);
  const con = ids.filter((_, i) => i % 2).reverse();
  const thang = JSON.stringify([...standingFor(con)]);   // ngoài request: tính thẳng, không nhớ
  chayTrongRequest('GET', () => {
    standingFor(ids);
    const truoc = soCauSql();
    const lai = standingFor(con);
    assert(soCauSql() === truoc, `Tập con đã nhớ phải 0 câu SQL thêm: được ${soCauSql() - truoc}`);
    assert(JSON.stringify([...lai]) === thang, 'standingFor nhớ theo em phải trùng tính thẳng (cả thứ tự Map)');
  });
  const p = PRINCIPAL_CUA.get(USER.GVCN)!;
  const du = chiSoHoSoGv(p, p.userId, {}), gon = chiSoHoSoGv(p, p.userId, {}, true);
  for (const k of ['tu', 'den', 'ketQua', 'tienBo', 'hocThuatTheoLop'] as const) {
    assert(JSON.stringify(du[k]) === JSON.stringify(gon[k]), `chiHocThuat đổi "${k}"`);
  }
});

check('RA-DOC-0611b · /my-work mọi tài khoản: tập cha Case theo lớp (GV) giống hệt đọc cả hệ thống', () => {
  const sai: string[] = [];
  for (const uid of TOAN_BO_TK) {
    const p = PRINCIPAL_CUA.get(uid)!;
    caseMoTapChaKhiKiem.tat = true;
    const cu = chayTrongRequest('GET', () => JSON.stringify(myWork(p, {})));
    caseMoTapChaKhiKiem.tat = false;
    const moi = chayTrongRequest('GET', () => JSON.stringify(myWork(p, {})));
    if (cu !== moi) sai.push(`${uid}: myWork khác`);
  }
  caseMoTapChaKhiKiem.tat = false;
  assert(!sai.length, sai.slice(0, 10).join(' | '));
});

check('GIAM-DOC-0711a · napCaseMo tập cha theo chi nhánh: myWork mọi tài khoản × chi nhánh × Của tôi / Tất cả · Phân tích GV · hồ sơ GV giống hệt đọc cả hệ thống', () => {
  const sai: string[] = [];
  const cns = [null, ...(conn.prepare('SELECT id FROM branches ORDER BY id').all() as any[]).map((r) => r.id as number)];
  const hai = (ten: string, fn: () => unknown) => {
    caseMoTapChaKhiKiem.tat = true;
    const cu = chayTrongRequest('GET', () => JSON.stringify(fn()));
    caseMoTapChaKhiKiem.tat = false;
    const moi = chayTrongRequest('GET', () => JSON.stringify(fn()));
    if (cu !== moi) sai.push(ten);
  };
  let soSo = 0;
  for (const uid of TOAN_BO_TK) {
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const branchId of cns) for (const f of [{}, { nguoi: 'tat-ca' as const }, { nguoi: 'tat-ca' as const, tachCuaToi: true }]) {
      hai(`${uid} cn=${branchId} ${JSON.stringify(f)}`, () => myWork(p, { ...f, branchId }));
      soSo++;
    }
  }
  const ql = PRINCIPAL_CUA.get(USER.QT)!;
  for (const cn of cns.filter((x): x is number => x !== null)) for (const ct of ['ft', 'thuong'] as const) { hai(`phanTichGiaoVien cn=${cn} ${ct}`, () => phanTichGiaoVien(ql, { cn, ct })); soSo++; }
  for (const r of conn.prepare(`SELECT DISTINCT user_id AS id FROM teacher_assignments WHERE status = 'active' ORDER BY user_id`).all() as any[]) {
    hai(`chiSoHoSoGv ${r.id}`, () => chiSoHoSoGv(ql, r.id, {}));
    soSo++;
  }
  /* Khoá giảm đọc: QL một chi nhánh khác chi nhánh mẫu, Công việc "Tất cả" — Case mở ngoài chi nhánh không còn về (trước: đọc mọi Case cả hệ thống). */
  const qlKhac = (conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
    WHERE r.key = 'manager' AND ur.status = 'active' AND u.approval_state = 'approved' AND ur.branch_id != ? ORDER BY ur.user_id LIMIT 1`).get(CN) as any).id as number;
  const dong = (tat: boolean) => {
    caseMoTapChaKhiKiem.tat = tat;
    return chayTrongRequest('GET', () => { const d0 = soDongSql(); myWork(PRINCIPAL_CUA.get(qlKhac)!, { nguoi: 'tat-ca' }); return soDongSql() - d0; });
  };
  const [cu, moi] = [dong(true), dong(false)];
  caseMoTapChaKhiKiem.tat = false;
  console.log(`      (so ${soSo} lần; QL chi nhánh khác "Tất cả": ${cu} → ${moi} dòng)`);
  assert(!sai.length, sai.slice(0, 10).join(' | '));
  assert(moi < cu - 50, `QL một chi nhánh vẫn đọc Case mở cả hệ thống: ${cu} → ${moi} dòng`);
});

check('GIAM-DOC-0611 · cờ Thiếu thông tin (chip TVV / CX) = cờ của danh sách Học viên & Lớp — mọi tài khoản × phạm vi × chi nhánh', () => {
  const sai: string[] = [];
  for (const uid of TOAN_BO_TK) {
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const phamVi of ['cua-toi', 'chi-nhanh', 'tat-ca', null]) for (const branchId of [null, CN]) {
      const [cu, moi] = chayTrongRequest('GET', () => [
        JSON.stringify(danhSachHocVienLop(p, { phamVi, branchId }).hocVien.filter((h) => h.thieu).map((h) => ({ id: h.id, thieu: h.thieu }))),
        JSON.stringify(thieuThongTinHocVien(p, { phamVi, branchId }))]);
      if (cu !== moi) sai.push(`${uid} ${phamVi} ${branchId}`);
    }
  }
  assert(!sai.length, sai.slice(0, 10).join(' | '));
});

check('GIAM-DOC-0611f · mtLichSuChuaNhap không truyền lớp (tập cha GVCN ∪ chi nhánh plan.week) = truyền mọi lớp — mọi tài khoản × chi nhánh', () => {
  const moiLop = (conn.prepare('SELECT id FROM classes').all() as any[]).map((r) => r.id as number);
  const sai: string[] = [];
  for (const uid of TOAN_BO_TK) {
    const p = PRINCIPAL_CUA.get(uid)!;
    for (const branchId of [null, CN]) {
      const [moi, cu] = chayTrongRequest('GET', () => [JSON.stringify(mtLichSuChuaNhap(p, { branchId })), JSON.stringify(mtLichSuChuaNhap(p, { classIds: moiLop, branchId }))]);
      if (moi !== cu) sai.push(`${uid} ${branchId}`);
    }
  }
  assert(!sai.length, sai.slice(0, 10).join(' | '));
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
/*
 * DOC-IT (02/11): `PISA_DO_IT=<đường dẫn không đuôi>` — ghi mọi câu SQL (văn bản + tham số) của từng (vai × đường) ở lượt ×3 + 5 đường khi lượt quét chạy
 * (khoá `QUET …`), chép DB ×3 (`VACUUM INTO`) → `python scripts/do-it.py <đường dẫn>` chạy lại từng câu: dòng quét cả bảng, bước máy ảo, SCAN. Cách đọc: docs/toc-do/doc-it-0211.md.
 */
const doIt: { bat: boolean; cau: Record<string, unknown> } = { bat: false, cau: {} };
/* RA-DOC-0611: `PISA_IN_JSON=<tệp>` ghi [mã, JSON] từng (vai × đường) của lượt đo đầu (×1) — so trước / sau từng byte khi giảm đọc. */
const inJson: Record<string, unknown> | null = process.env.PISA_IN_JSON ? {} : null;
async function doMotLuot(dong?: Map<string, number>, lap?: string[]): Promise<Map<string, number>> {
  const ra = new Map<string, number>();
  for (const muc of DUONG_DO) {
    for (const vai of muc.vai) {
      const url = urlFor(muc.url);
      if (lap) doLap.thay = new Map();
      const ghiIt: { sql: string; args: unknown[] }[] | null = doIt.bat ? [] : null;
      doQuet.ghi = ghiIt;
      const r = await doSql(vai, 'GET', url);
      doQuet.ghi = null;
      if (ghiIt) doIt.cau[`${vai} ${url}`] = { n: r.n, dong: r.dong, cau: ghiIt };
      ra.set(`${vai} ${url}`, r.n);
      dong?.set(`${vai} ${url}`, r.dong);
      if (dong && inJson) inJson[`${vai} ${url}`] = [r.status, r.json];
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
/* TL-NEN: `PISA_IN_DO=<tệp>` ghi số câu / dòng từng (vai × đường) ra JSON — cột trước → sau của mô tả PR. */
if (inJson) fs.writeFileSync(process.env.PISA_IN_JSON!, JSON.stringify(inJson));
if (process.env.PISA_IN_DO) fs.writeFileSync(process.env.PISA_IN_DO, JSON.stringify(Object.fromEntries([...truocNhan].map(([k, n]) => [k, [n, dongTruocNhan.get(k)]])), null, 1));

/* LG-8: `GET /my-work` thêm `testSapToi` CHỈ cho vai GV (GVCN · GVBM · GVCN_THUONG); QL · QT · Admin · TVV · CX không có khoá này (JSON và số câu như cũ). */
await checkAsync('LG-8 · /my-work: `testSapToi` chỉ vai GV; vai khác không có khoá; GV: mỗi lớp đang dạy một dòng, mã lớp không trùng', async () => {
  const COC = '/my-work';
  for (const vai of ['GVCN', 'GVBM', 'GVCN_THUONG'] as Vai[]) {
    const r = await doSql(vai, 'GET', COC);
    const ds = (r.json as any).testSapToi;
    assert(r.status === 200 && Array.isArray(ds) && ds.length > 0, `${vai}: thiếu testSapToi`);
    assert(new Set(ds.map((x: any) => x.classId)).size === ds.length, `${vai}: lớp trùng`);
    assert(ds.every((x: any) => 'testKeTiep' in x && typeof x.testTuanNay === 'boolean'), `${vai}: sai dạng dòng ${JSON.stringify(ds[0])}`);
    console.log(`      (${vai} /my-work: ${r.n} câu, ${ds.length} lớp)`);
  }
  for (const vai of ['QL', 'QT', 'ADMIN', 'TVV', 'CX'] as Vai[]) {
    const r = await doSql(vai, 'GET', COC);
    if (r.status === 200) assert(!('testSapToi' in (r.json as any)), `${vai}: không được có testSapToi`);
  }
});

/* DOC-IT-1: `isInitialised` hỏi `sqlite_master` (SCAN ~270 dòng trên bản chính) mỗi lần mở app — đã khởi tạo thì nhớ theo kết nối. */
await checkAsync('DOC-IT-1 · GET /demo/session (mọi vai) không đọc sqlite_master', async () => {
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try {
    for (const vai of MOI_VAI) assert((await doSql(vai, 'GET', '/demo/session')).status === 200, `${vai} /demo/session không 200`);
  } finally { doQuet.ghi = null; }
  const lai = ghi.filter((g) => /sqlite_master/.test(g.sql)).length;
  assert(!lai, `${lai} lần đọc sqlite_master`);
});

/* DOC-IT-4: `/ref/classes` (ô chọn lớp, bộ lọc Phân tích, IntakePanel…) đọc MỌI lớp active cả hệ thống + đếm ghi danh từng lớp rồi mới lọc phạm vi / chi nhánh trong mã.
   Nay lọc trong SQL: JSON trùng cách cũ (cờ `refLopCuKhiKiem.tat`) mọi vai × tham số; GVCN chỉ đọc dòng lớp mình dạy. */
await checkAsync('DOC-IT-4 · /ref/classes lọc phạm vi trong SQL — trùng cách cũ mọi vai, GV không đọc lớp ngoài phạm vi', async () => {
  const { refLopCuKhiKiem } = await import('../routes/index.ts');
  const loi: string[] = [];
  const goi = async (vai: Vai, url: string, cu: boolean) => {
    refLopCuKhiKiem.tat = cu;
    try { return await doSql(vai, 'GET', url).then(async (r) => ({ ...r, json: JSON.stringify((await callHttp(vai, 'GET', url)).json) })); } finally { refLopCuKhiKiem.tat = false; }
  };
  for (const vai of [...MOI_VAI, 'TVV', 'CX', 'ADMIN'] as Vai[]) {
    for (const url of ['/ref/classes', `/ref/classes?branchId=${CN}`, '/ref/classes?fastTrackOnly=1', '/ref/classes?tg=26']) {
      const cu = await goi(vai, url, true), moi = await goi(vai, url, false);
      if (cu.json !== moi.json) loi.push(`${vai} ${url}: JSON khác (${cu.json.length} ≠ ${moi.json.length} ký tự)`);
      if (moi.dong > cu.dong) loi.push(`${vai} ${url}: dòng ${cu.dong} → ${moi.dong}`);
    }
  }
  const tong = (conn.prepare(`SELECT COUNT(*) n FROM classes WHERE status = 'active'`).get() as any).n as number;
  const gv = await goi('GVCN', '/ref/classes', false);
  if (gv.dong >= tong) loi.push(`GVCN /ref/classes đọc ${gv.dong} dòng ≥ ${tong} lớp active cả hệ thống`);
  assert(!loi.length, loi.join(' · '));
});

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

  /* GIAM-DOC-0611h: câu cũ không ORDER BY → SQLite quét chỉ mục phủ nhỏ nhất (trước: idx_student_consultant; nay idx_student_branch) — giữ ĐÚNG thứ tự cũ
     (TVV, id; NULL đầu như chỉ mục) để id dữ liệu ×3 và ảnh chụp TD4-a không đổi. */
  const idHvGoc = (conn.prepare('SELECT id FROM students ORDER BY consultant_user_id, id').all() as any[]).map((r) => r.id as number);
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
SOS23 = tinhSos23();   // TQ-SOS-CN: id em SOS 2–3 của chi nhánh đo sau khi nhân dữ liệu (panel đọc theo số em)
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
  doIt.bat = !!process.env.PISA_DO_IT;
  const sauNhan = cauSauNhan = await doMotLuot(dongSauNhan);
  if (doIt.bat) {
    process.env.PISA_DO_QUET = '1';
    for (const [vai, url] of [['QL', '/yeu-cau/dem'], ['GVCN', '/my-work'], ['QL', '/my-work'], ['QL', '/tong-quan/v5?ct=ft'], ['GVCN', '/tong-quan/lop-toi-day/hai-khoi']] as [Vai, string][]) {
      const g: { sql: string; args: unknown[] }[] = [];
      doQuet.ghi = g;
      const r = await doSql(vai, 'GET', url);
      doQuet.ghi = null;
      doIt.cau[`QUET ${vai} ${url}`] = { n: r.n, dong: r.dong, cau: g };
    }
    delete process.env.PISA_DO_QUET;
    doIt.bat = false;
    const ra = process.env.PISA_DO_IT!;
    for (const s of ['', '-wal', '-shm']) if (fs.existsSync(`${ra}.sqlite${s}`)) fs.rmSync(`${ra}.sqlite${s}`);
    conn.exec(`VACUUM INTO '${ra}.sqlite'`);
    fs.writeFileSync(`${ra}.json`, JSON.stringify(doIt.cau));
  }
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

/* PHEP-DO-LO (plan.md ghi chú OV-3c 12/10): danh sách `IN` theo lô 900 tham số (`theoLo`) — số lượt ×3 vượt bội 900 thì đường đọc mọi lượt thêm
   một câu. Ghi số lượt ×3 + chỗ trống tới mốc lô kế để biết bộ demo còn thêm được bao nhiêu lượt; Task5(2) ở trên là chốt chặn thật. */
check(`PHEP-DO-LO · bộ demo ×3: số lượt so với lô ${THAM_SO_TOI_DA} tham số`, () => {
  const n = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n as number;
  const moc = Math.ceil(n / THAM_SO_TOI_DA) * THAM_SO_TOI_DA;
  console.log(`      (đo: ${n} lượt ×3 = ${Math.ceil(n / THAM_SO_TOI_DA)} lô, còn ${moc - n} lượt ×3 ≈ ${Math.floor((moc - n) / 3)} lượt seed trước lô kế)`);
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

/* TD3-a-2: Lịch Test QL ×3 — trước TD3-a đo 5 177 dòng (top: lịch kỹ năng 2 451, điểm 993, lượt 624); trần 40 %.
 * V5 SV-SO1 (chủ SP 22/10): ô có band thiếu nhận xét bắt buộc là bài chờ chấm thật (seed 385 ô) → khối 1 / 2 / 3 đọc thêm lượt: đo 2 280 (44 %) → trần 45 %. */
check('TD3-a-2 · GET /cham/lich-test (QL, ×3) ≤ 45 % số dòng trước TD3-a (5 177; V5 SV-SO1 — trước 40 %)', () => {
  const d = dongSauNhan.get('QL /cham/lich-test') ?? Infinity;
  console.log(`      (đo: ${d} dòng)`);
  assert(d <= Math.floor(5177 * 0.45), `${d} dòng > ${Math.floor(5177 * 0.45)}`);
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
  /* MAIN-DO: dữ liệu SEED-UX BU_MT2 (10 lượt MT2 MB FT 101 có điểm + Case SOS 4 em, ×3) thêm dòng: hoc-vien-lop 6 463 (58a2d268) → 7 095. Mã đường
     không đổi (SV-LOP riêng: 6 373). Trần Học viên & Lớp theo dữ liệu nay: 7 100 (thay ⌊8 417 × 80 %⌋ = 6 733) — chờ planning duyệt.
     SV-SO3: hàng HV khu d (Xu hướng) đọc thêm các lượt có điểm trước lượt gần nhất của em có Overall + tuần thi: 7 095 → 7 220 → trần 7 220.
     V5 SV-SO1: ô có band thiếu nhận xét bắt buộc là việc / bài chờ (seed 385 ô) → đọc thêm lượt còn ô chờ: đo trên main + SV-SO1 7 316 (main 7 220, +96) → trần 7 320; overview 2 904 vẫn ≤ 50 %. */
  /* P9a XET-LAI: bộ demo Xét lại thêm 4 em + 2 lớp (×3) → hoc-vien-lop 7 320 → 7 507 (sau gộp P7 / P9b) → trần 7 510; mã đường không đổi. */
  /* P13 gộp P9a (26/10): đo (×3) P13 trước gộp 7 313, main P9a 7 507, bản gộp 7 543 (+36: seed PET tách Checkpoint L · R · W · S gặp bộ demo Xét lại);
     mã đường không đổi (đo lại với standingFor của main: vẫn 7 543) → trần 7 545. */
  assert(ov <= Math.floor(5829 * 0.5) && hvl <= 7545, `overview ${ov} / hoc-vien-lop ${hvl}`);
});

/*
 * TD5: Turso tính DÒNG ĐỌC (cả dòng quét), `TRAN_DONG` chỉ đếm dòng trả về — nên khoá bằng EXPLAIN QUERY PLAN. Trước TD5 (×3, đếm bước VM qua
 * Python sqlite3): Case mở của `listClassSummaries` ~181 k bước / lần (SCAN sos_cases cho từng lượt), bảng điểm tuần `classScoreSheet` ~10,9 k.
 * Mọi câu chạm sos_cases / attempt_skills trong hai đường đó không được SCAN cả bảng; migrate chạy lần hai không làm gì.
 */
await checkAsync('TD5 (×3) · Case mở của lớp + bảng điểm tuần: không SCAN sos_cases / attempt_skills; migrate prTd5 chạy lặp được', async () => {
  const { migratePrTd5 } = await import('../migrate/prTd5.ts');
  const { listClassSummaries } = await import('../classes/classes.ts');
  const { classScoreSheet } = await import('../fasttrack/attempts.ts');
  const lan: string[][] = [[], []];
  migratePrTd5(conn, lan[0]); migratePrTd5(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  assert(conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_case_attempt'").get(), 'thiếu idx_case_attempt');
  const tuan = (conn.prepare('SELECT planned_period_id AS id FROM assessment_attempts WHERE class_id = ? AND planned_period_id IS NOT NULL LIMIT 1').get(LOP_FT) as any).id;
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try {
    for (const vai of MOI_VAI) {
      const p = PRINCIPAL_CUA.get(USER[vai]) ?? loadPrincipal(USER[vai]);
      chayTrongRequest('GET', () => listClassSummaries(p, {}));
      if (vai === 'QL' || vai === 'GVCN') chayTrongRequest('GET', () => classScoreSheet(p, LOP_FT, tuan));
    }
  } finally {
    doQuet.ghi = null;
  }
  const quet: string[] = [];
  const daXet = new Set<string>();
  for (const { sql, args } of ghi) {
    if (daXet.has(sql) || !/\b(sos_cases|attempt_skills)\b/.test(sql)) continue;
    daXet.add(sql);
    const bang = new Map([...sql.matchAll(/(?:FROM|JOIN)\s+(\w+)\s+(?:AS\s+)?(\w+)/gi)].map((m) => [m[2], m[1]]));
    for (const r of conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]) {
      const m = /^SCAN (\w+)/.exec(r.detail);
      if (m && ['sos_cases', 'attempt_skills'].includes(bang.get(m[1]) ?? m[1])) quet.push(`${r.detail} · ${sql.replace(/\s+/g, ' ').slice(0, 100)}`);
    }
  }
  assert(daXet.size >= 3, `chỉ bắt được ${daXet.size} câu sos_cases / attempt_skills`);
  assert(!quet.length, `còn quét cả bảng:\n        ${quet.join('\n        ')}`);
});

/*
 * TD6: các câu đã sửa (đo bước máy ảo trên bản chụp ×3, mô tả PR TD6) không quét cả bảng lớn — khoá bằng EXPLAIN QUERY PLAN trên câu thật của các
 * đường GET; migrate prTd6 chạy lần hai không làm gì. JSON trùng main ↔ nhánh đã so một lần trên bản chụp (mô tả PR).
 */
await checkAsync('TD6 (×3) · câu đã sửa không SCAN bảng lớn; migrate prTd6 chạy lặp được', async () => {
  const { migratePrTd6, CHI_MUC_TD6 } = await import('../migrate/prTd6.ts');
  const lan: string[][] = [[], []];
  migratePrTd6(conn, lan[0]); migratePrTd6(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  for (const [ten] of CHI_MUC_TD6) assert(conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten), `thiếu ${ten}`);
  /* (câu, mẫu nhận câu, bảng câu cũ quét / duyệt cho từng dòng, chỉ mục TD6 phải dùng) — bảng ngoài tự lọc của câu (vd. lộ trình của Bước tiếp)
     không thuộc TD6. Hai câu cuối trước đây đã SEARCH nhưng theo chỉ mục một cột (duyệt mọi lượt của lớp / mọi thẻ cùng loại) → khoá theo tên chỉ mục. */
  const CAU: [string, RegExp, string[], string?][] = [
    ['Case theo lượt (loadBundle)', /FROM sos_cases c\s+\/\*[^*]*\*\/\s+LEFT JOIN case_interventions iv/, ['case_interventions', 'sos_cases']],
    ['Báo PH chưa làm', /FROM sos_coordination_actions x JOIN assessment_attempts/, ['assessment_attempts']],
    ['Ý thức cần xử lý', /AND s\.id IN \(SELECT v\.student_id FROM violations/, ['students', 'yeu_cau_duyet']],
    ['ngày kết quả lộ trình', /j\.cycle_id = c\.id AND j\.event_type/, ['journey_events']],
    ['em chưa có lượt Mock', /a\.student_id = s\.id AND a\.class_id = e\.class_id/, ['assessment_attempts'], 'idx_attempt_student_class'],
    ['thẻ Báo lên Ý thức', /y\.loai = 'bao_len_y_thuc' AND y\.doi_tuong_id = s\.id/, ['yeu_cau_duyet'], 'idx_ycd_loai_doi_tuong_cho'],
  ];
  const ghi: { sql: string; args: unknown[] }[] = [];
  const PISA_DO_QUET_GOC = process.env.PISA_DO_QUET;
  doQuet.ghi = ghi;
  process.env.PISA_DO_QUET = '1';   // TL-NEN: câu "thẻ Báo lên Ý thức" nằm trong lượt quét — đo khi quét chạy
  try {
    /* GIAM-DOC-0611: chip TVV / CX không dựng cả danh sách Học viên & Lớp nữa → câu "Báo PH chưa làm" (`viecHocVienTheoLop`) bắt ở `QL /hoc-vien-lop`. */
    for (const [vai, url] of [['CX', '/tong-quan/hoc-vien'], ['GVCN', '/my-work'], ['QL', '/classes/{lopFT}/diem-theo-luot/mt:2'], ['TVV', '/hoc-vien-lop/theo-vai'], ['QL', '/hoc-vien-lop']] as [Vai, string][]) {
      assert((await doSql(vai, 'GET', urlFor(url))).status === 200, `${vai} ${url} không 200`);
    }
  } finally {
    doQuet.ghi = null;
    if (!PISA_DO_QUET_GOC) delete process.env.PISA_DO_QUET;
  }
  const quet: string[] = [];
  for (const [ten, re, lon, chiMuc] of CAU) {
    const cau = [...new Map(ghi.filter((g) => re.test(g.sql)).map((g) => [g.sql, g])).values()];
    assert(cau.length, `không bắt được câu "${ten}"`);
    for (const { sql, args } of cau) {
      const bang = new Map([...sql.matchAll(/(?:FROM|JOIN)\s+(\w+)\s+(?:AS\s+)?(\w+)/gi)].map((m) => [m[2], m[1]]));
      const plan = conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[];
      if (chiMuc && !plan.some((r) => r.detail.includes(chiMuc))) quet.push(`${ten}: không dùng ${chiMuc}`);
      for (const r of plan) {
        /* `SEARCH j` không kèm USING = duyệt cả bảng cho từng dòng ngoài (cách cũ của ngày kết quả lộ trình). */
        const m = /^(?:SCAN (\w+)|SEARCH (\w+)$)/.exec(r.detail);
        if (m && lon.includes(bang.get(m[1] ?? m[2]) ?? m[1] ?? m[2])) quet.push(`${ten}: ${r.detail}`);
      }
    }
  }
  assert(!quet.length, `còn quét cả bảng:\n        ${quet.join('\n        ')}`);
});

/*
 * TD4-a: Công việc trên dữ liệu ×3 — JSON đầy đủ (`items`, `dong`, `groups`, `summary`) TRÙNG ảnh chụp chụp bằng mã TRƯỚC TD4 (main 35517670), mọi vai
 * và mọi góc nhìn. Lọc sớm lượt ở `listAttempts` không được đổi một việc nào. Đổi đầu ra Công việc CÓ CHỦ Ý (hoặc seed / phép kiểm phía trên đổi
 * dữ liệu) thì lệch: chụp lại băm bằng mã trước thay đổi đó (phép in băm đang ra), không sửa cho khớp.
 * 15/10 (OV-13b, chụp lại trên bản gộp OV-13c/d/h): GVCN / GVCN_THUONG toi, QL / QT tat-ca, QT tat-ca cn, QL gvcn — đổi có chủ ý: thêm trường
 * `ghiNhanh` của Kết quả PA (ghi nhanh trên dòng) và `pa.soBuoi` của Xác nhận PA cùng lúc (ô Số buổi Tutor, mockup §9); băm bỏ hai trường đó
 * trùng ảnh của main a4f9c00, đã kiểm.
 * 21/11 SAU-THI-GON A3-13: chụp lại 'QT tat-ca' — đổi CÓ CHỦ Ý: phụ dòng "Chọn bước tiếp" bỏ "Đã xong · " (chỉ "OVR … · Đạt Target").
 * 15/10 OV-13m: chụp lại 'QT toi' / 'QT tat-ca' — dòng "Chọn bước tiếp" (2 lộ trình UB FT 401 của seed) đổi tiêu đề / nhãn dòng gộp / chữ / đường mở panel Bước tiếp (có chủ ý).
 * 15/10: chụp lại 'QT toi' / 'QT tat-ca' sau khi Case của Task2(e) thôi lấy giờ thật (hạn Thêm PA của nó trôi theo ngày chạy → băm QT đổi mỗi ngày).
 * 17/10 EN-e: chụp lại 7 băm — đổi CÓ CHỦ Ý chỉ ở tên việc: actionLabel "Kết quả" → "Kết quả PA", Phối hợp "CX / GĐCN meeting với HV[ / PH]" →
 *   "Meeting CX/GĐCN (sau Mock) · HV[ / PH]". Đã kiểm: thay ngược hai chữ này trong JSON thì cả 11 băm cũ trùng.
 * 15/10 gộp OV-13a + OV-13c: chụp lại 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' trên bản gộp — hai thay đổi có chủ ý ở dưới cộng lại (id Case đổi chỗ + gom tuần).
 * 15/10 OV-13a: chụp lại 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — Case tạm (Q2) đổi thứ tự sinh Case trong seed → id Case 34↔35 (HV 46) đổi chỗ;
 *   so JSON với main: khác CHỈ ở id Case, nội dung việc không đổi.
 * 15/10 OV-13c: chụp lại 7 băm — đổi CÓ CHỦ Ý: Nhập điểm gom theo tuần thi (khoá `|p{tuần}|`, dòng phụ có mã tuần), việc Case SOS FT + Nhập điểm
 * thêm `tuanThi` / `sos` / `pa` / `periodId` / `kind`. Đã so JSON mã trước (main 0359276) ↔ sau trên bộ demo, 5 vai × Của tôi / Tất cả: việc khác
 * TRÙNG hoàn toàn (trừ trường mới), tổng số bài Nhập điểm không đổi.
 * 15/11 GD-1 gộp main (LG-3 #1567, GD-2 #1565): chụp lại 'GVS toi' (trước bf6d53088022e822) — lệch CHỈ do `baiQuaHan` của việc Chấm Speaking (GD-1) cộng trên JSON mới của main.
 * 14/11 GD-1 (Overhaul V6): chụp lại 'GVS toi' — đổi CÓ CHỦ Ý chỉ thêm `baiQuaHan` (số bài quá hạn) vào việc Chấm Speaking — đầu tab "Việc chung của nhóm GV Speaking".
 * 12/11 rà 11/11 #2 (G1-04): chụp lại 'GVS toi' — đổi CÓ CHỦ Ý chỉ `count` của việc Chấm Speaking (số bài → số em khác nhau, ô "n HV").
 * 18/10 OV-14c: chụp lại 'GVS toi' — đổi CÓ CHỦ Ý chỉ ở việc chấm chéo: các dòng "Speaking chấm chéo · {tuần}" gộp theo tuần thay bằng MỘT việc (dòng phụ "n lớp")
 *   "Chấm Speaking · n bài" (khoá `KHOA_CHAM_SPEAKING`), cộng bài thi tuần này (từ thứ Hai tuần thi); 10 băm khác trùng.
 * 15/10 OV-13g: thêm 'GVS toi' (GV Speaking MB FT 101 — chấm chéo). Đầu ra đổi CÓ CHỦ Ý chỉ ở GV dạy Speaking FT: thêm dòng "Speaking chấm chéo".
 *   Đã so JSON mã trước (main a4f9c00) ↔ sau trên bộ demo, mọi tài khoản × Của tôi / Tất cả + QL xem GV 7/9/10: chỉ GV 9, 19 lệch; bỏ việc `|cc` thì
 *   `items` + `dong` TRÙNG hoàn toàn. Số câu /my-work (×1): GV 9 58 → 58, GV 19 55 → 56. 10 băm cũ không đổi.
 * 15/10 gộp OV-13l với main (13b / 13c): chụp lại 9 băm trên bản gộp — ba đổi có chủ ý cộng lại.
 * 15/10 OV-13l: chụp lại mọi vai trừ ADMIN — đổi đầu ra CÓ CHỦ Ý: hạn bàn giao ≥ 7 ngày (GVBM = GVCN), seed D16 (LT1 → RF) giữ lộ trình,
 *   seed kịch bản 6 (MB FOU 23) ra lệnh 9 ngày trước để vẫn "Bàn giao quá hạn".
 * 21/10 LT-SV: chụp lại 'QT toi' / 'QT tat-ca' — đổi CÓ CHỦ Ý: 2 dòng "Chọn bước tiếp" (UB FT 401, chỉ có TUẦN thi W2 AUG) không còn hạn = Chủ nhật tuần + 7
 *   (tuần chưa phải ngày thi — Q-C3 ①); bộ demo 14/09: 0 lộ trình về B, đúng 2 dòng này đổi hạn.
 * 16/10 OV-13q: chụp lại 'QT toi' / 'QT tat-ca' — đổi CÓ CHỦ Ý: 2 dòng "Chọn bước tiếp" (UB FT 401) hạn = ngày thi + 7 (luật 1 tuần), thêm `cycleId` / `daGiaHan` (nút Gia hạn).
 * 16/10 gộp OV-13m với main (13k, 13n): chụp lại QT toi / QT tat-ca trên bản gộp (cùng 2 khoá 13m đã đổi có chủ ý).
 * 16/10 gộp OV-13n với main (13k): chụp lại băm trên bản gộp (13n + 13k đều đổi có chủ ý).
 * 16/10 OV-13n: chụp lại 8 băm — đổi CÓ CHỦ Ý: SOS2/3 không điền sẵn "Trao đổi ngắn với HV" (số việc Phối hợp + seed Khôi/Lan đổi việc đã xác nhận).
 * 16/10 OV-13k gộp main 1694175 (OV-13l): chụp lại 4 băm dưới trên bản gộp — đã so JSON main 1694175 ↔ bản gộp trên bộ demo (QL / QT "Tất cả",
 *   "QT tat-ca cn", GVS / QL / GVCN "Của tôi", QL xem GVCN): chỉ thêm 3 việc `xem_nx_s` + hai nhãn "còn tồn từ" của GV S như dưới; còn lại trùng.
 * 21/10 SV-YT-TVV: chụp lại 5 băm QL / QT (Của tôi, Tất cả, Tất cả chi nhánh) — đổi CÓ CHỦ Ý: seed gửi đề xuất Ý thức qua `guiDeXuat` nên có việc
 *   "Báo PH vi phạm" (`bao_ph_yt`) — em demo chưa có TVV → QL chi nhánh giữ. Việc GV không đổi (6 băm GV / Admin giữ).
 * 21/10 SV-TVV-VIEC: chụp lại 5 băm QL / QT (Của tôi, Tất cả, Tất cả chi nhánh) — đổi CÓ CHỦ Ý: Chốt ngày thi / Cập nhật KQ thi thật / Chọn bước tiếp có
 *   MỘT người giữ (TVV của em; em demo chưa có TVV → QL chi nhánh), KQ thi thật không hạn, thêm dòng "Bổ sung hồ sơ thiếu". 6 băm GV / Admin giữ.
 * 22/10 UI-CV-TVV: chụp lại 'QT toi' / 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — đổi CÓ CHỦ Ý (mockup `tvv.html`): Báo PH · KQ thi thật · Chọn bước tiếp ·
 *   Chốt ngày thi không gộp lớp (mỗi em một dòng, `gopViec` GIU_TUNG_DONG_TVV), nhãn nút "Ghi báo PH" / "Chốt bước tiếp" / "Nhập KQ thi", Báo PH thêm `soLanThu`. 7 băm khác giữ.
 * 22/10 SV-TVV-VIEC #517 (chụp lại ở SV-SO2 vì main đỏ): 'QL toi' / 'QT toi' / 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — đổi CÓ CHỦ Ý: việc TVV của em
 *   không có TVV về QL chi nhánh (R1) và 4 việc TVV mới (N6) hiện ở Công việc của QL / QT.
 * 21/10 CV-LOI (sửa theo rà): chụp lại 'QT tat-ca' — chuyển lớp nay gán chủ Case trống (`ganChuCaseThieu` trong `apDungMotDong`): em chưa có lớp của
 *   Task2(e) có Case trống chủ, chuyển sang lớp CP → Case có GV phụ trách → dòng Thêm PA hiện ở góc nhìn toàn hệ thống (trước: Case vô hình). 10 băm khác giữ.
 * 21/10 CV-LOI: chụp lại 10 băm (ADMIN giữ) — đổi CÓ CHỦ Ý (02 4.7 A13, 9.2-10): seed gán chủ Case không chủ theo luật tạo Case (Case 14 → GV R, 25 → GV S
 *   của lớp, ×3 cùng thế) nên GV đó có thêm "Thêm PA", không còn dòng "Chọn người phụ trách" cho GV / QL; dòng Case không chủ (lớp thiếu GV môn) chỉ cho
 *   người phân công được, thêm `thieuNguoi`. Chưa so JSON từng dòng với main — nguyên nhân lệch đọc từ mã + phép kiểm prCvLoi K1–K3.
 * 15/10 OV-13k: chụp lại 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' / 'GVS toi' — đổi CÓ CHỦ Ý: (1) nhóm mới "Xem nhận xét Speaking" (bộ demo có 3 bài
 *   S Mock người khác GV phụ trách chấm có nhận xét → 3 việc của GV 9); (2) rà #419: "còn tồn từ" của dòng Speaking chấm chéo = tuần cũ nhất của
 *   (lớp, lượt) — GV S: MT1 "W1 SEP" → "W1 JUL", MT2 thêm "W2 AUG". Đã so JSON mã trước (main 022b7f3) ↔ sau trên bộ demo: bỏ việc `xem_nx_s`
 *   thì `items` + `dong` TRÙNG hoàn toàn ở QL / QT "Tất cả", QL / GVCN "Của tôi"; GV S lệch đúng hai nhãn trên. 7 băm cũ không đổi.
 */
await checkAsync('TD4-a (×3) · Công việc trùng JSON ảnh chụp trước TD4 — 6 vai × Của tôi / Tất cả / Của một GV / lọc chi nhánh', async () => {
  const { myWork, viecCuaNguoi } = await import('../worklist/mywork.ts');
  /* CV-SUA-1011 (chủ SP 10/11, thay T18 06/11 phần GVCN): chụp lại GVCN toi · GVCN_THUONG toi · QL gvcn — đổi CÓ CHỦ Ý: GVCN không là GV Speaking mất việc
     "Chấm Speaking" (bài S chéo quá hạn lớp mình); băm mới TRÙNG băm trước T18 06/11 (GVS toi giữ). Trước: GVCN toi 60c5bade0f68786f, QL gvcn b3b7a8f54f080ef5. */
  /* T18 (chủ SP 06/11): chụp lại GVCN toi · GVCN_THUONG toi · QL gvcn · GVS toi — đổi CÓ CHỦ Ý: việc "Chấm Speaking" ghi `urgency: overdue` + `due` khi có bài S chấm chéo quá hạn (GV S) và GVCN lớp FT có thêm việc đó. Trước: GVCN toi 9d92644a93b70d7c, QL gvcn d72da0f9c7bf9628, GVS toi 3183805cc8df091a. */
  /* PR-B (30/10): chụp lại GVBM toi · QL / QT tat-ca · QT tat-ca cn · GVS toi — đổi CÓ CHỦ Ý (luật chủ SP 30/10 "Cùng GV · không cần bàn giao"): seed kịch bản 6
     MB FOU 23 → lớp đích cùng GV mọi môn, nên mất các việc "Bàn giao môn …" của GVBM và chữ "chờ môn …" ở việc GVCN. So JSON origin/main ↔ nhánh: lệch CHỈ các dòng đó. */
  const ANH: Record<string, string> = {
    /* AUDIT-1611 P1-02 / P1-03 (16/11): chụp lại 8 băm (QL / QT toi, ADMIN giữ) — đổi CÓ CHỦ Ý: dòng gộp Nhập điểm mang TỔNG `soBai` / `baiQuaHan` của lớp con
       (trước: số của việc đầu), `viecCuaNguoi` thêm `cuaGv`. Đã kiểm: đảo ngược ba trường đó (soBai / baiQuaHan = việc đầu của dòng, bỏ cuaGv) trước khi băm →
       cả 11 băm trùng ảnh cũ. Trước: GVCN toi a97ea30c5dded10a, GVBM toi 8c05c3e43fd827f4, GVCN_THUONG toi a97ea30c5dded10a, QL tat-ca 619c2dd041fb9ab6,
       QT tat-ca 65ba288685cafd3f, QT tat-ca cn 7e86d8e45cedaebe, QL gvcn e9919e64771e0a57, GVS toi 20255e1f890bf1a5 */
    /* GD-20c (15/11): chụp lại 7 băm (QL / QT toi, GVBM, ADMIN giữ) — đổi CÓ CHỦ Ý: Ghi kết quả PA gộp theo lớp + CÙNG KỲ (khoá dòng gộp thêm `:d{hạn kỳ}`), hai kỳ khác nhau là hai dòng. Trước: GVCN toi 2be2a58247c4c4e9, GVCN_THUONG toi 2be2a58247c4c4e9, QL tat-ca 57e114e2c2891f6a, QT tat-ca 4e54cccf94bb64fc, QT tat-ca cn b6d206fc33ba09f7, QL gvcn 464100c07359814a, GVS toi c0f71c10ba0f7d2d */
    /* RA-LUONG-1 K2/K3 (29/10): chụp lại 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — đổi CÓ CHỦ Ý: dòng gộp Speaking chấm chéo (QL / QT "Tất cả", gom theo lớp)
       giữ đuôi `|cc` như việc lẻ (`khoaGopCua`). So JSON ×1 origin/main ↔ nhánh: lệch CHỈ khoá dòng `gop:score:3:u0` → `gop:score:3:u0|cc`; mọi dòng khác, `items`,
       `summary` trùng. Trước: QL tat-ca 28f8ecdd8a2ebf00, QT tat-ca e91857dde5acb3fe, QT tat-ca cn 9461a089ce103418 */
    /* SUA-TD4A (24/10): main đỏ vì `sos_coordination_actions.created_at` ghi GIỜ THẬT → hạn Meeting CX (tạo + 5) trôi theo ngày chạy (23/10 → 28/10, 24/10 → 29/10).
       Nay ghi theo ngày nghiệp vụ (`nowNghiepVu`). So JSON 23/10 ↔ sau sửa: lệch CHỈ `due` của "Phối hợp SOS · MB FT 101" 2026-10-28 → 2026-09-19 (+ vị trí dòng
       theo hạn); băm 24/10 = 26/10 (đồng hồ giả). Trước: GVCN toi 54c27b39ee9b881f, QL tat-ca 420043d1c928ba28, QT tat-ca 3e43c0b2dc0ade75, QT tat-ca cn 200388dc93d64b79, QL gvcn f66534617b5b28a0 */
    /* SV-NX-CASE (N8 ③, 23/10): "Xem nhận xét Speaking" → "Xác nhận Case" chỉ khi có Case S thật (hạn SOS) — so JSON ×1 gốc df72ee4 ↔ nhánh: lệch CHỈ 3 việc xem_nx_s (bài không Case) ở GV S / QL tất cả; ×3 thêm Case S chấm chéo chờ xác nhận (chưa mô tả → Ghi nhận xét / Xác nhận Case). Trước: GVCN toi 80841402855460fc, GVCN_THUONG toi 80841402855460fc, QL tat-ca 308a1cd5cdf610d4, QT tat-ca d99e66a82939f985, QT tat-ca cn b3b9eb54c28af290, QL gvcn 2bfa98682602b48b, GVS toi 97693a60d0ace310 */
    /* LUAT-NX-MT (chủ SP 22/10): ô có band thiếu nhận xét không còn là việc Nhập điểm → GV / QL "tất cả" đổi CÓ CHỦ Ý; QL / QT "của tôi", ADMIN giữ. */
    /* MAIN-DO: chụp lại theo dữ liệu SEED-UX cuối (BU_MT2, 32504e72 → 9a078719) — so JSON 58a2d268 ↔ 9a078719: việc lệch CHỈ ở 4 em MT2 chưa đạt
       (Ngô Bảo Châu, Lý Thanh Tâm, Phạm Khánh Linh, Kiều Thảo Nhi: việc Case MT2; Case cũ của Kiều Thảo Nhi đổi) và dòng lớp MB FT 101 (MT2 dời W3 AUG); id Case dời. ADMIN giữ.
       SEED-UX: băm đổi theo dữ liệu thêm (TVV, thi thật, MT2 MB FT 101, Báo PH Yến / Bình, lớp HD) — ADMIN không đổi. */
    /* P8 MON-DANG-KY: chụp lại 'QT tat-ca' — so JSON origin/main 41a95e8 (sau gộp P13, R1-LUU-TIEP, R1-DICH-2, EN-1, SUA-NHO) ↔ nhánh (seed mới, QT "Tất cả"): lệch CHỈ việc "Thêm PA học thuật Speaking · Bùi Thu Ninh"
       (seed cho em không học S → Case S đóng "Không còn học môn", N13 Q5) + tổng / quá hạn −1. 10 băm khác giữ. Trước: QT tat-ca 47c64efa1375e602 (main) */
    /* P9b CUOI-KHOA (25/10): chụp lại 10 băm (ADMIN giữ) — so JSON ×3 main 186e73a ↔ nhánh, chuẩn hoá id Case / PA: lệch CÓ CHỦ Ý chỉ ở (1) việc "Chốt lộ trình"
       (N20 hạn CN → T5, nút "Cuối khoá ›", đường `?xem=cuoi-khoa`, hint); (2) N17 Kỳ vọng · Học viên không Case → seed bớt Case của Kiều Thảo Nhi (id Case / PA
       dời 1) và Case S MT2 của em không còn gộp vào Case Kỳ vọng: 3 dòng "Thêm PA học thuật Speaking" → "Ghi nhận xét Speaking · MT2" (GV S, QL / QT tất cả).
       Số việc mọi góc không đổi. Trước: QL toi 3ea67fbf71f97f26, QT toi ae31cc97e115aae1, GVCN toi 76b13509ead6c605, GVBM toi f0e52756d39e2508, QL tat-ca 2f708e34199a5b09,
       QT tat-ca fd4a0025509b3b4c, QT tat-ca cn 9bc50bbc012634a2, QL gvcn 658f91bcc1ae947f, GVS toi bde6ca74489b52be */
    /* P13 KET-PET (26/10): chụp lại 7 băm (QL / QT toi, ADMIN, GVS giữ) — đổi CÓ CHỦ Ý: seed MB PET 01 tách Checkpoint thành L · R · W · S. So JSON items ×1
       main 87a3bc3 ↔ nhánh, 32 tài khoản × Của tôi / Tất cả: lệch CHỈ 2 việc "Nhập điểm Checkpoint · MB PET 01" (GV 7: Listening + Speaking → Listening, Speaking;
       GV 8: Reading + Writing → Reading, Writing; mỗi việc 1 → 2 bài, `kns` / `kn` / đường mở theo môn tách). Trước: GVCN toi 48d4fd7f1dc1645a,
       GVBM toi bbfbcccdcf9d71b4, GVCN_THUONG toi 48d4fd7f1dc1645a, QL tat-ca dd8a7166b581b998, QT tat-ca 364be4cb77b9f362, QT tat-ca cn 7166c9b66b3098c4, QL gvcn 5afa68eea7a17883 */
    /* P9a XET-LAI (sau gộp P9b / P7): so JSON origin/main 87a3bc3 ↔ nhánh (GVCN / GVBM MB FT 101, QL, QL tất cả, QT): lệch CHỈ do bộ demo Xét lại (4 em
       MB FOU 25 → MB BE 05): "Bàn giao 4 em · MB FOU 25" (GVCN, QL tất cả), "Xét lại lộ trình · MB BE 05 / MB FOU 25" (QL / QT), "Báo PH kết quả Test ·
       Hứa Đức Anh 46%", "Ghi Mini Test" 2 em bổ trợ (55 / 57 %). ADMIN giữ. Trước (P9b): QL toi 53d8168836891e39, QT toi 3111c55ff8027ff3, GVCN toi 48d4fd7f1dc1645a,
       GVBM toi bbfbcccdcf9d71b4, QL tat-ca dd8a7166b581b998, QT tat-ca 364be4cb77b9f362, QT tat-ca cn 7166c9b66b3098c4, QL gvcn 5afa68eea7a17883, GVS toi 8b6b85a70a44d3dd */
    /* P13 gộp P9a (26/10): chụp lại 7 băm trên bản gộp (QL / QT toi, ADMIN, GVS giữ) — so JSON ×3 origin/main (P9a, 65357d4^2) ↔ nhánh, 11 góc: lệch CHỈ việc
       "Nhập điểm Checkpoint · MB PET 01" (L + S / R + W → L, S / R, W; 3 → 6 bài, `kn` / đường theo môn tách) và tổng bài nhóm W3 SEP (+3). Trước (main P9a):
       GVCN toi a298f2a5bc0f779f, GVBM toi d2ae222a70a8ab15, GVCN_THUONG toi a298f2a5bc0f779f, QL tat-ca 0674f0c5032b5a23, QT tat-ca 50944d5f2d8af799,
       QT tat-ca cn de4df8179b21e493, QL gvcn cab96ce5168b2724 */
    /* MO-TA-CASE (N8, chủ SP 27/10): chụp lại 8 băm (QL / QT toi, ADMIN giữ) — đổi CÓ CHỦ Ý chỉ chữ việc ghi_nhan_xet: "Ghi nhận xét" → "Mô tả Case",
       "Chờ ghi nhận xét" → "Chờ mô tả Case", lý do "bài chưa có nhận xét (nguyên nhân Case)" → "Case chưa có mô tả", hint nhóm. Đã kiểm: thay ngược bốn chữ đó
       trong JSON trước khi băm → cả 11 băm trùng ảnh cũ. Trước: GVCN toi 3ec58e6c5f038a5b, GVBM toi 5da1466b01c6787d, GVCN_THUONG toi 3ec58e6c5f038a5b,
       QL tat-ca 7833387f3be72dc5, QT tat-ca 1c4725c92e5fe58c, QT tat-ca cn 97e0e1570f6369be, QL gvcn 8b8a066eaa52e514, GVS toi 1f37a0df4f07d06d */
    /* LOC-HIEN-TAI (chủ SP 28/10): chụp lại 8 băm (GVBM, ADMIN, GVS giữ) — đổi CÓ CHỦ Ý: việc Nhập điểm / Chốt tuần / MT cũ chưa nhập / Lịch Test chỉ còn
       lượt hiện tại (lộ trình mới nhất cùng loại, em đang học; MT chưa làm sau thi thật không còn) — dữ liệu ×3 có em học lại / lưu trữ / thi thật. Chưa so
       JSON từng dòng với main — nguyên nhân lệch đọc từ mã + phép kiểm prLocHienTai LHT-1…8. Trước: QL toi e1049bc984a18aca, QT toi 7de7b28ab5fe8b93,
       GVCN toi 82fc3ddf32d43f10, GVCN_THUONG toi 82fc3ddf32d43f10, QL tat-ca 22c0808af745c50f, QT tat-ca b54f972219247783, QT tat-ca cn fdc0016b89453d9d, QL gvcn 87927080df295343 */
    /* AUDIT-BAN-GIAO PR2 (03/11, F05): chụp lại 'GVBM toi' / 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — đổi CÓ CHỦ Ý: bàn giao chuyển lớp FT tách W1 · W2.
       So JSON ×3 origin/main 6e8ac44 ↔ nhánh, 11 góc, bỏ việc `ban_giao*` + số đếm: TRÙNG hoàn toàn. Việc bàn giao lệch CHỈ ở MB FT 103 (W1 Lê Minh Khoa — lớp
       đích vẫn Khoa → cùng GV, hết việc; W2 Cao Khánh Linh: "Bàn giao môn W" → "W2", GVCN "chờ môn W" → "W2"); lớp thường MB FOU 22 giữ "W".
       Trước: GVBM toi 71283ff70674504b, QL tat-ca cf1b31474244ae4e, QT tat-ca cd79349e0bcf3f62, QT tat-ca cn 7cfbd540beff0e8c */
    /* BADGE-CUA-TOI (04/11): chụp lại 'QL toi' / 'QT toi' — đổi CÓ CHỦ Ý: "Nhập điểm MT cũ" (`lich-su:`) / "Điền Target" (`target:`) góc "toi" nay cùng chủ góc
       "tat-ca" (GVCN lớp) → lớp có GVCN không còn là việc của QL / QT (badge = ô "Của tôi", BCT-1). 9 băm khác giữ. Trước: QL toi e52a0d6a5bb7537d, QT toi 5115a3184a27f3d9 */
    /* UI-CONG-VIEC (04/11, PTA: một tên một nguồn): chụp lại 8 băm — đổi CÓ CHỦ Ý CHỈ ở chữ tên việc trong `mywork.ts`: "Kết quả PA {kn}" → "Ghi kết quả PA · {kn}"
       (nút "Ghi kết quả PA"), "Thêm PA học thuật {kn}" / "Xác nhận Case {kn}" / "Mô tả Case {kn}" → kỹ năng tách "·". Diff máy chủ chỉ đổi chuỗi; QL / QT toi, ADMIN giữ.
       Trước: GVCN toi 836db9c7acdd8e39, GVBM toi c64a33f25108620d, GVCN_THUONG toi 836db9c7acdd8e39, QL tat-ca 64c53c3e9d2f7f40, QT tat-ca 85e5bab795ebfcb0,
       QT tat-ca cn 29addc1ddf756b8e, QL gvcn ceb5c556bc540613, GVS toi b4b4e5024a108eca */
    /* UI-3 (N34 ④, 04/11): chụp lại 6 băm (GVCN / GVCN_THUONG toi, QL / QT tat-ca, QT tat-ca cn, QL gvcn) — đổi CÓ CHỦ Ý chỉ chữ việc `yt_xem`: "Ghi nhận n vi phạm mới" →
       "Xem n vi phạm mới", nút "Ghi nhận" → "Đã xem", hint nhóm ("Đã xem (chưa cần xử lý) hoặc Xác nhận xử lý trong 5 ngày"). Nguyên nhân lệch đọc từ mã (chỉ ba chữ đó đổi trong `mywork.ts`). Trước (sau gộp UI-CONG-VIEC): xem dòng trên;
       chụp lại trên bản gộp main #889 (băm UI-CONG-VIEC: GVCN toi 03e3379819323d63, QL tat-ca dced32203deb19bb, QT tat-ca 8dcc420b64f4a736, QT tat-ca cn b279291e75c0e741, QL gvcn 2b323214ee1cfa8e) */
    /* PR-MT-CHAM (N39, 05/11): chụp lại 7 băm (QL / QT toi, ADMIN, GVS giữ) — đổi CÓ CHỦ Ý chỉ `contextLabel` việc chấm Mock: "MT1, MT4 W3 OCT" → "W3 OCT".
       Đã kiểm: trả `mywork.ts` về origin/main (nhãn cũ) trên nhánh → TD4-a đạt với băm cũ. Trước: GVCN toi 8215b08ff50a3871, GVBM toi f4ed555f1ab51285,
       GVCN_THUONG toi 8215b08ff50a3871, QL tat-ca 25a69682950fb439, QT tat-ca c25cf2159c6d850b, QT tat-ca cn ab81cd84860daab9, QL gvcn fab519b88423e38a */
    /* BAO-CAO-PH b (06/11): chụp lại 'ADMIN toi' — đổi CÓ CHỦ Ý: Admin có việc mới "Xuất báo cáo PH" (nhóm Việc quản lý — đợt quá hạn chưa đủ / lớp đủ 7 ngày);
       10 băm khác giữ (QL không nhận việc này). Trước: ADMIN toi 4ed1fc3fa34653f2; chụp lại lần hai sau khi `reason` của việc bỏ tên đợt
       (EN theo mẫu từ điển) — chỉ chữ đó đổi (ddb1ac7c6032790f → 4c6c4dd6a797d681). */
    /* LG-1 BC-PH-HAN-THUONG (chủ SP 13/11 lời 14): chụp lại 'ADMIN toi' — đổi CÓ CHỦ Ý: hạn đợt lớp thường Chủ nhật → thứ Ba tuần sau (+ 2 ngày). So JSON ×1
       origin/main ↔ nhánh: lệch CHỈ việc "Xuất báo cáo PH" — 4 đợt 07/09 (hạn 13/09 → 15/09, chưa quá hạn) rời; 2 đợt Final 31/08 (hạn 06/09 → 08/09, vào cửa sổ 7 ngày)
       vào. Trước: ADMIN toi 4c6c4dd6a797d681. */
    /* P1 G5-01 (rà 11/11): chụp lại 'QL toi' / 'QT toi' / 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — đổi CÓ CHỦ Ý: việc "Chốt lộ trình" (`chot_len_ft`) `mine: false → true`
       (việc của người chốt được) + `summary` đếm thêm các dòng đó. Trước: QL toi f2cc522d889b43ca, QT toi 51fe838d1a390ccb, QL tat-ca 68eb7bf00d5d3794,
       QT tat-ca 5a8f912d0266aeb4, QT tat-ca cn 699c581b1c85ef3a */
    /* YT-BAO-PH (rà 11/11 #7, [XM 1]): chụp lại 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — đổi CÓ CHỦ Ý: seed ghi "Đã thực hiện" Meeting CX/GĐCN (Hà Phương Linh) nên việc
       Báo PH của TVV tự xong, rời Công việc "Tất cả". Trước: QL tat-ca 7f94dda317035ed0, QT tat-ca 57fda42f27026a88, QT tat-ca cn e2258962068479d4. */
    /* #8 bản rà 11/11 (G4-06): chụp lại 7 băm — đổi CÓ CHỦ Ý chỉ việc Bàn giao chuyển lớp: GVCN dạy luôn môn → không còn "Bàn giao môn …" (viết trong phiếu GVCN);
       GVBM nhiều môn một lớp → MỘT việc "Bàn giao môn L · R" (count = số em khác nhau). Đã kiểm: trả banGiao.ts + mywork.ts về origin/main trên nhánh → TD4-a đạt
       với băm cũ. Trước: GVCN toi 9d92644a93b70d7c, GVBM toi e089af060bbfcf23, GVCN_THUONG toi 9d92644a93b70d7c, QL tat-ca 44df50bdddf5043e, QT tat-ca 893884b8134ff493, QT tat-ca cn 0ae00a58528bfe32, QL gvcn d72da0f9c7bf9628 */
    /* SOS-TAM-PA (11/11): chụp lại 8 băm (QL / QT toi, ADMIN giữ) — seed sinh Case tạm cho cả ô chưa nhận xét nên id Case sau đó dời. Đã kiểm (seed main a9da41132 ↔
       nhánh): 8 góc nhìn cùng số việc + cùng nội dung, chỉ khác khoá / caseId / href. Trước: GVCN toi b365951571812c05, GVBM toi 12e56e58ca3ab54f, GVCN_THUONG toi b365951571812c05, QL tat-ca 82a113beaa654d50, QT tat-ca 4ea0cb34545f1f71, QT tat-ca cn 27514f17c920a385, QL gvcn 1704e89b346dd3ad, GVS toi 8925006102baff97. */
    /* PHOI-HOP-V2 (chủ SP 11/11, mockup #1368): chụp lại 7 băm — đổi CÓ CHỦ Ý: dòng Phối hợp SOS một / (lớp × việc) thay một / lớp, bỏ thẻ điểm (`theSos`),
       thêm `phoiHop` / `emIds` / `emTen` (GVBM toi: tài khoản đo cũng có việc Phối hợp SOS — cùng lý do); chụp lại sau gộp SOS-TAM-PA. Trước: GVCN toi b365951571812c05, GVBM toi 12e56e58ca3ab54f,
       GVCN_THUONG toi b365951571812c05, QL tat-ca 82a113beaa654d50, QT tat-ca 4ea0cb34545f1f71, QT tat-ca cn 27514f17c920a385, QL gvcn 1704e89b346dd3ad */
    /* QTV2-BAND (11/11): chụp lại 9 băm — đổi CÓ CHỦ Ý chỉ chữ `hint` / `reason` mô tả luật (Mini Test "Đạt thì Case tự hoàn thành…", Xét lại "dưới mức
       Học lại…") để không lệch khi Quản trị đổi ngưỡng. Đã kiểm: trả mywork.ts về origin/main (sau #1384) trên nhánh → TD4-a đạt với băm cũ. Trước: QL toi
       15eb3872996a260a, QT toi 6627fb30cb9de2f7, GVCN toi 6f6d75efb833e0e7, GVCN_THUONG toi 6f6d75efb833e0e7, QL tat-ca f35cfb2ed97a60cc, QT tat-ca 650abfb450588c2e,
       QT tat-ca cn 46b64ddbd555658b, QL gvcn f6ba5ccba208842e, GVS toi 85067c7b764cb801 */
    /* G3-17 (13/11): chụp lại 8 băm — đổi CÓ CHỦ Ý chỉ chữ việc "Báo phụ huynh qua TVV" → "Báo PH kết quả Test" (tiêu đề / nhãn). */
    /* MON-CT-1311 (13/11): chụp lại 7 băm (QL / QT toi, ADMIN, GVS giữ) — đổi CÓ CHỦ Ý: seed MB PET 01 về L+S · R+W (KET / PET mặc định hai môn). Đã kiểm: trả
       seed PET + hằng `CHUONG_TRINH_LIEN_TUC_CO_SAN` về 4 môn trên nhánh → TD4-a đạt với băm cũ (mọi mã khác của nhánh giữ). Trước: GVCN toi 940b335430de8caf,
       GVBM toi 619ada104fec5944, GVCN_THUONG toi 940b335430de8caf, QL tat-ca 7d767d49828b74e7, QT tat-ca 82c3472f2a05bcdf, QT tat-ca cn b3eff2d5295fb05c, QL gvcn 52d159aa5665aa06 */
    /* TINH-HINH (chủ SP 12/11, N1 sửa): chụp lại 3 băm "Tất cả" — đổi CÓ CHỦ Ý: lần xử lý CHỜ QL không còn sinh việc Báo PH của TVV (seed có đề xuất chờ) — việc
       sinh khi duyệt / tự chốt. "Của tôi" mọi vai không đổi. Trước: QL tat-ca 7ed19aebd00614bd, QT tat-ca b656f012db13e5bd, QT tat-ca cn cab3fd0e23981a6d */
    /* GV-CU-BO-TRO (chủ SP 13/11, A): chụp lại 8 băm (QL / QT toi, ADMIN giữ) — đổi CÓ CHỦ Ý: việc "Ghi Mini Test" (nhóm `mt:`) về Người dạy (GV cũ), GVCN theo dõi.
       So JSON ×3 origin/main ↔ nhánh, 11 góc: lệch CHỈ `minitest:1` / `minitest:4` — người giữ GVCN 7 → Người dạy 8 (tên, `mine`), GV 8 (GVBM, GVS) có thêm hai dòng đó,
       số đếm theo. Trước: GVCN toi 31ebd923a221e835, GVBM toi 0ebf563606c50ead, GVCN_THUONG toi 31ebd923a221e835, QL tat-ca c0b740c6097c651b, QT tat-ca 931741b7e9d11882,
       QT tat-ca cn 19b4c0743b6f7b36, QL gvcn ac54489ae58e3bcf, GVS toi 3c702438ea810b91 */
    /* SUA-CHU-L1 (PTA 13/11): chụp lại 9 băm (QL toi, ADMIN giữ) — đổi CÓ CHỦ Ý CHỈ chữ hint nhóm `ban_giao` (2 / 3 ngày → hạn tối thiểu đọc Hạn mặc định, gốc 7) và `buoc_tiep`
       (Tạm dừng hoặc Thôi học → Tạm dừng / Kết thúc học; 7 ngày đọc Hạn mặc định). Đã kiểm: trả hai hint về chữ cũ trên nhánh → TD4-a đạt với băm cũ. Trước: QT toi 7ebe5b04a14bdd39, GVCN toi ec2e83ad7d3149f8, GVBM toi b8ff6f87720838f4, GVCN_THUONG toi ec2e83ad7d3149f8, QL tat-ca 6db0b9a1a2224b80, QT tat-ca 9c90c2073d99edd3, QT tat-ca cn d1a5972ac6f0863d, QL gvcn d377a756eb1da0cf, GVS toi 5b46fdd308634d6b */
    /* L6 / 2.3 (chủ SP 13/11): chụp lại 6 băm (GVCN / GVCN_THUONG toi, QL / QT tat-ca, QT tat-ca cn, QL gvcn) — đổi CÓ CHỦ Ý CHỈ bỏ việc "Điền Target" (`target:`) của GVCN
       (`mywork.ts`); QL / QT / GVBM toi, ADMIN, GVS giữ. Trước: GVCN toi b1ad0af2e1dd4bd5, GVCN_THUONG toi b1ad0af2e1dd4bd5, QL tat-ca a378c8afa18b77ca, QT tat-ca de6263e02466a6c0, QT tat-ca cn 7c2866d4ce5cfb1a, QL gvcn 1083304bc01cd683 */
    /* LG-3 BC-PH-VIEC-GV (chủ SP 13–14/11): chụp lại 8 băm — đổi CÓ CHỦ Ý: việc mới "Viết Báo cáo PH" (nhóm `bao_cao_ph`, mỗi người × lớp × đợt đang mở / quá hạn ≤ 7 ngày) ở GV
       và ở "Tất cả" của QL / QT (= "Của một GV", OV11c-3). So JSON ×1 origin/main ↔ nhánh (806 đường): lệch CHỈ /my-work GV · QL / QT tất cả · Của một GV — chỉ THÊM
       dòng `bc-ph:*` (GVCN +4, GVBM +6, QL tất cả +17, QT +20 — seed có mốc bật = ngày seed nên đợt hạn trước 14/09 không sinh việc), không mất / đổi dòng nào; số nhóm Vận hành hồ sơ GV 7 tăng theo. Admin, QL / QT "Của tôi" giữ.
       Trước (main sau L6 / 2.3 #1556 · #1564): GVCN toi a79c2967be82df5e, GVBM toi 77e235e4611522bc, GVCN_THUONG toi a79c2967be82df5e, QL tat-ca 29da5f0c277723a2, QT tat-ca 9dfb712f3d614d40, QT tat-ca cn 0252208bd2d3fcdc, QL gvcn 217ad0083cb42779, GVS toi dcacfa50220ee88d */
    /* LG-11 VI-PHAM-BO-DA-XEM (chủ SP lời 47, 15/11): chụp lại 6 băm (GVCN / GVCN_THUONG toi, QL / QT tat-ca, QT tat-ca cn, QL gvcn) — đổi CÓ CHỦ Ý CHỈ bỏ việc
       `yt_xem` (vi phạm người khác ghi thành tin Cập nhật). Đã so trên bản chép thật 12/11 (33 GV + QL 5 chi nhánh): /my-work lệch CHỈ mất dòng `yt_xem` (30 dòng), câu · dòng đọc giữ.
       QL / QT / GVBM toi, ADMIN, GVS giữ. Trước (main sau #1738): GVCN toi 52f7a5ba99d7eccc, GVCN_THUONG toi 52f7a5ba99d7eccc, QL tat-ca f7752b5bc691561a, QT tat-ca 60e53e557d7832a5, QT tat-ca cn 453a428b04f09064, QL gvcn 9bab38ec2790df06 */
    /* XEP-CHAM-TEST (chủ SP 16/11): chụp lại 6 băm — đổi CÓ CHỦ Ý: lớp con (`con`) của dòng gộp Nhập điểm theo thứ tự chấm (`soSanhViecCham`); đã kiểm: trả thứ tự con về
       `sapViec` thì băm khớp bản cũ (lệch CHỈ thứ tự con). Trước: GVCN toi 0e244af2868788f4, GVCN_THUONG toi 0e244af2868788f4, QL tat-ca 7de18f10f09e3ba7, QT tat-ca ada320e08f4702f9,
       QT tat-ca cn 87f85b45dd8e4ec9, QL gvcn 80509247fdf10e9e */
    /* AUDIT-1611 CHU-DUNG-LUAT (16/11): chụp lại 9 băm — đổi CÓ CHỦ Ý ở `mywork.ts` / `canCham.ts` / `banGiao.ts`: B3-18 kỹ năng dòng Chấm nối theo L·R·W·S;
       A1-05 việc "Nhập điểm MT cũ" nút "Nhập điểm ›" + link `&ma=` (tiêu đề trang có mã lớp); B3-09 Bàn giao môn một em ghi tên em → lớp đến. ADMIN, QL toi giữ.
       Trước (main 16/11 sau AU-SO): QT toi 11db1ca94e232a13, GVCN toi 5b567fb9fc7aa168, GVBM toi 9dc4aef5f266094a, GVCN_THUONG toi 5b567fb9fc7aa168, QL tat-ca 7441e526cfa9d8c7,
       QT tat-ca 41c9031fd1f7f54f, QT tat-ca cn 218778b5e821a297, QL gvcn ff446108d217da2d, GVS toi 7a4bed4a0aeddaec */
    /* HEAD (chủ SP 18/11): chụp lại 10 băm — đổi CÓ CHỦ Ý: chữ vai Quản lý / QL trong việc / lý do đổi thành "Head" (ADMIN toi giữ). */
    /* DEM-VIEC (chủ SP 18/11): chụp lại 3 băm Quản trị (QT toi / tat-ca / tat-ca cn) — đổi CÓ CHỦ Ý: việc của QL chi nhánh (em chưa có TVV, Chốt lộ trình, Kỳ vọng, Xét lại,
       Xếp lịch MT, Phân công người phụ trách) ở chi nhánh có QL không còn là của Quản trị: "Của tôi" bỏ dòng, "Tất cả" giữ dòng với `mine: false`, `ownerId: null`.
       8 băm vai khác giữ nguyên. Trước: QT toi e6ce92ac5383842d, QT tat-ca 48f85bbf269d190a, QT tat-ca cn 74fce9d8e33ac72f */
    /* HOC-TIEP (N51, 18/11): chụp lại 'QT tat-ca' — đổi CÓ CHỦ Ý: gợi ý nhóm việc "Chọn bước tiếp" nói 3 hướng (Tạm dừng / Kết thúc học, Học tiếp hoặc Lộ trình mới).
       Đã kiểm (trước HEAD / DEM-VIEC): trả chữ gợi ý cũ → mọi băm trùng ảnh cũ. Trước: QT tat-ca 0b4978eb4ee4b434 */
    /* SO-LIEU-4 (N63 ③, AUDIT-2111 B2-02): chụp lại 'QL toi' / 'QL tat-ca' — đổi CÓ CHỦ Ý: việc Vận hành KHÔNG hạng mục giao cho chính Head nay vào /my-work
       (Việc được giao, +3 dòng `mgmt:` của seed; câu giữ 34 / 51). Trước: QL toi bae55443ea652c0f, QL tat-ca 22a8a1f30e44bec6 */
    /* SUA-2211-B (chủ SP 22/11 ý 9 "Đồng bộ hết chia ra từng lớp đi"): chụp lại 8 băm (QL / QT toi, ADMIN giữ) — đổi CÓ CHỦ Ý: Nhập điểm theo tuần thi gom TRONG MỘT lớp
       (khoá `gop:score:t…:c{lớp}`), không còn dòng "n lớp"; dòng một lớp không mang mã lớp ở `contextLabel`. Diff /my-work chỉ ở `khoaGopCua` + nhánh dòng tuần của `gopViecTheoLop`.
       Trước: GVCN toi edb4cf790b2ddc32, GVBM toi c0018a4d4207215e, GVCN_THUONG toi edb4cf790b2ddc32, QL tat-ca 4d85cbb2cd43b54f, QT tat-ca aae3d57d2cc9e595, QT tat-ca cn f66551b0430a85b6, QL gvcn e131a8cc32044548, GVS toi 5277337aca746e96 */
    /* R3-T2 (rà 24/11): chụp lại 'QL toi' / 'QL tat-ca' / 'QT tat-ca' / 'QT tat-ca cn' — đổi CÓ CHỦ Ý CHỈ nhãn việc Xét lại lộ trình "Xét lại ›" → "Xét lại"
       (panel tại chỗ ở Công việc). Đã kiểm: đảo nhãn về "Xét lại ›" → cả 11 băm trùng ảnh cũ (việc `moc:` thêm `cycleId` / `kind` không có trong bộ đo).
       Trước: QL toi 71b11266cf6b5ad1, QL tat-ca 823f4eee67dd0f26, QT tat-ca e82787f509b476d9, QT tat-ca cn e87ba722c330cfd9 */
    'QL toi': '4f025585561f2eab', 'QT toi': '4ed1fc3fa34653f2', 'GVCN toi': '6f1b3ccac5a948f8', 'GVBM toi': '5fba8a27d45206ab',
    /* BPXL-1 (N57, 20/11): chụp lại 'ADMIN toi' — seed thêm tài khoản demo BPXL (cuối seed) → tài khoản Admin đo (tạo sau seed) id +1, `ownerId` việc của Admin đổi theo;
       không việc nào đổi. Trước: ADMIN toi c07a10f6b7a499e7 */
    /* NHẸ HƠN (chủ SP 22/11): chụp lại 'QT tat-ca' — đổi CÓ CHỦ Ý CHỈ chuỗi ngày: ngày luôn dd/mm/yyyy (`shortDate` / `ngay`) ở `reason` / `contextLabel`
       ("đã thi 15/08/2026", "Đã thi 05/09/2026"). Đã kiểm: bỏ "/2026" khỏi mọi ngày trong JSON (trừ "· thi dd/mm/yyyy" của `examPlanOf` vốn đã có năm) →
       băm trùng ảnh cũ. 10 băm khác giữ. Trước: QT tat-ca dc1d7094099dce13 */
    'GVCN_THUONG toi': '6f1b3ccac5a948f8', 'ADMIN toi': '40367cf553da5cad', 'QL tat-ca': '720f5097bb4c29d9', 'QT tat-ca': '0996d790dec045b7',
    'QT tat-ca cn': 'dfed277355425aa8', 'QL gvcn': '00ad6d45dc70a2b9', 'GVS toi': '10640e5b9d61b1a6',
  };
  const p = (v: Vai) => loadPrincipal(USER[v]);
  const goc: [string, () => unknown][] = [
    ...(['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG', 'ADMIN'] as const).map((v) => [`${v} toi`, () => myWork(p(v))] as [string, () => unknown]),
    ...(['QL', 'QT'] as const).map((v) => [`${v} tat-ca`, () => myWork(p(v), { nguoi: 'tat-ca' })] as [string, () => unknown]),
    ['QT tat-ca cn', () => myWork(p('QT'), { nguoi: 'tat-ca', branchId: CN })],
    ['QL gvcn', () => viecCuaNguoi(p('QL'), USER.GVCN)],
    ['GVS toi', () => myWork(loadPrincipal((conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active' ORDER BY id LIMIT 1`).get(LOP_FT) as any).id))],
  ];
  const sai: string[] = [];
  for (const [ten, fn] of goc) {
    /* 19/10 OV-15b: việc Nhập điểm thêm `kns` (đủ kỹ năng của việc — panel chỉ mở các cột này); băm bỏ trường đó → trùng ảnh cũ (không việc nào khác đổi). */
    /* 22/10 V5 SV-SO1: thêm `summary.viec/bai/nhom/hv/viecQuaHan`, `lamThay` (xem người khác), `chiXem` — băm bỏ các trường đó. Chụp lại GVCN / GVBM / GVCN_THUONG
       "Của tôi", QL / QT "Tất cả", QL gvcn, GVS — đổi CÓ CHỦ Ý (chủ SP 22/10): ô có band thiếu nhận xét bắt buộc thành việc Nhập điểm (bài / hạn / quá hạn).
       Chụp lại sau gộp main (MAIN-DO / SEED-UX): QL / QT / ADMIN "Của tôi" giữ băm main (không có việc Nhập điểm); 8 góc còn lại = main + luật trên. */
    /* UI-CV-V12 (S11, 05/11): `summary` thêm `canLamNgay`, bỏ `bai` / `nhom` / `hv` — chỉ trường summary đổi, băm bỏ (không chụp lại). */
    const MOI = new Set(['viec', 'bai', 'nhom', 'hv', 'viecQuaHan', 'canLamNgay']);
    /* UI-CON-LAI (nợ #528): việc Nhập điểm thêm `knsQuaHan` (kỹ năng thật sự quá hạn — chỉ đổi `summary.viecQuaHan`, đã bỏ ở trên); băm bỏ trường đó. */
    /* PHOI-HOP-SOS-INFO (06/11): dòng Phối hợp SOS thêm `theSos` (thẻ kết quả SOS); băm bỏ trường đó → 11 băm cũ trùng ảnh main (không việc nào khác đổi, không chụp lại). */
    /* CV-TAB b (06/11): việc thêm `cn` (chi nhánh lớp), kết quả thêm `chiNhanh` (GV liên chi nhánh) / `cnAn` (QL xem một GV); băm bỏ ba trường đó → 11 băm cũ trùng (không chụp lại). */
    const bo = (k: string, v: any) => (k === 'kns' || k === 'knsQuaHan' || k === 'theSos' || k === 'lamThay' || k === 'chiXem' || k === 'cn' || k === 'chiNhanh' || k === 'cnAn' ? undefined
      : k === 'summary' && v ? Object.fromEntries(Object.entries(v).filter(([x]) => !MOI.has(x))) : v);
    const bam = chayTrongRequest('GET', () => createHash('sha256').update(JSON.stringify(fn(), bo)).digest('hex').slice(0, 16));
    if (ANH[ten] !== bam) sai.push(`'${ten}': '${bam}',`);
  }
  assert(!sai.length, `lệch ảnh chụp:\n${sai.join('\n')}`);
});

/*
 * TD7a (chủ SP 17/10, Turso Top Queries: câu "Xem nhận xét Speaking" ~225 k dòng / lần): câu xem_nx_s — "Tất cả" (không lọc / lọc chi nhánh) và nhánh lớp
 * ("Của tôi" của GV S) — đi chỉ mục một phần idx_score_cho_phu_trach, không SCAN assessment_scores / case_milestones; migrate prTd7a chạy lần hai không làm gì. JSON /my-work không đổi: TD4-a ở trên.
 */
/*
 * DOC-IT-3 (02/11): người xem chỉ có quyền THEO LỚP (GV) — `listCases` trước đọc MỌI Case cả hệ thống (Tổng quan GV: ô Case mở, hồ sơ GV) rồi `can()` bỏ gần hết.
 * Nay lọc trước tập cha theo lớp phân công / chỉ xem trong SQL. (1) JSON trùng cách cũ (cờ `tapChaTheoLopKhiKiem.tat`) với mọi người dùng chỉ có quyền GV,
 * nhiều bộ lọc; (2) câu không SCAN sos_cases.
 */
await checkAsync('DOC-IT-3 (×3) · listCases của GV: trùng cách cũ mọi GV × bộ lọc; không SCAN sos_cases', async () => {
  const cases = await import('../cases/cases.ts');
  const loi: string[] = [];
  let soGv = 0, soCase = 0;
  const cnLop = new Map((conn.prepare('SELECT id, branch_id FROM classes').all() as any[]).map((r) => [r.id as number, r.branch_id as number | null]));
  for (const { id } of conn.prepare(`SELECT id FROM users WHERE status = 'active' ORDER BY id`).all() as any[]) {
    const p = loadPrincipal(id);
    const pv = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
    if (pv.none || pv.all || pv.branchIds.length) continue;
    soGv++;
    const cn = [...new Set(p.assignments.map((a: any) => cnLop.get(a.classId)).filter((b: any) => b != null))] as number[];
    for (const f of [{}, { ownerUserId: id }, { status: 'open' }, { kemTam: true }, ...cn.map((branchId) => ({ branchId }))] as any[]) {
      cases.tapChaTheoLopKhiKiem.tat = true;
      let cu: string;
      try { cu = JSON.stringify(cases.listCases(p, f)); } finally { cases.tapChaTheoLopKhiKiem.tat = false; }
      const moi = cases.listCases(p, f);
      soCase += moi.rows.length;
      if (JSON.stringify(moi) !== cu) loi.push(`user ${id} ${JSON.stringify(f)}: ${JSON.stringify(moi).length} ≠ ${cu.length} ký tự`);
    }
  }
  assert(soGv >= 3 && soCase > 0, `bộ đo quá mỏng: ${soGv} GV, ${soCase} dòng Case`);
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try { cases.listCases(loadPrincipal(USER.GVCN), {}); } finally { doQuet.ghi = null; }
  const cau = ghi.find((g) => /FROM sos_cases sc\s+LEFT JOIN assessment_attempts a/.test(g.sql));
  assert(cau, 'không bắt được câu danh sách Case');
  const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${cau!.sql}`).all(...cau!.args) as any[]).map((r) => r.detail as string);
  if (plan.some((d) => /^SCAN sc\b/.test(d))) loi.push(`GVCN listCases(p, {}) vẫn SCAN sos_cases: ${plan.join(' | ')}`);
  console.log(`      (đo ×3: ${soGv} GV, ${soCase} dòng Case so)`);
  assert(!loi.length, loi.join(' · '));
});

/* GIAM-DOC-0611h ([XM-B]): người xem quyền THEO CHI NHÁNH (QL / Admin / CX / TVV một chi nhánh) — tập cha "Case của em thuộc chi nhánh" trùng cách cũ, không SCAN. */
await checkAsync('GIAM-DOC-0611h (×3) · listCases quyền chi nhánh: trùng cách cũ mọi tài khoản × bộ lọc; không SCAN sos_cases / students; migrate chạy lặp được', async () => {
  const cases = await import('../cases/cases.ts');
  const { migratePrGiamDoc0611h } = await import('../migrate/prGiamDoc0611h.ts');
  const lan: string[][] = [[], []];
  migratePrGiamDoc0611h(conn, lan[0]); migratePrGiamDoc0611h(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  const loi: string[] = [];
  let soTk = 0, soCase = 0;
  const moiCn = (conn.prepare('SELECT id FROM branches').all() as any[]).map((r) => r.id as number);
  for (const { id } of conn.prepare(`SELECT id FROM users WHERE status = 'active' ORDER BY id`).all() as any[]) {
    const p = loadPrincipal(id);
    const pv = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
    if (pv.none || pv.all || !pv.branchIds.length) continue;
    soTk++;
    for (const f of [{}, { status: 'open' }, { kemTam: true }, { noOwner: true }, ...moiCn.map((branchId) => ({ branchId }))] as any[]) {
      cases.tapChaTheoLopKhiKiem.tat = true;
      let cu: string;
      try { cu = JSON.stringify(cases.listCases(p, f)); } finally { cases.tapChaTheoLopKhiKiem.tat = false; }
      const moi = cases.listCases(p, f);
      soCase += moi.rows.length;
      if (JSON.stringify(moi) !== cu) loi.push(`user ${id} ${JSON.stringify(f)}: ${JSON.stringify(moi).length} ≠ ${cu.length} ký tự`);
    }
  }
  assert(soTk >= 3 && soCase > 0, `bộ đo quá mỏng: ${soTk} tài khoản, ${soCase} dòng Case`);
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try { cases.listCases(loadPrincipal(USER.QL), {}); } finally { doQuet.ghi = null; }
  const cau = ghi.find((g) => /FROM sos_cases sc\s+LEFT JOIN assessment_attempts a/.test(g.sql));
  assert(cau, 'không bắt được câu danh sách Case');
  const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${cau!.sql}`).all(...cau!.args) as any[]).map((r) => r.detail as string);
  if (plan.some((d) => /^SCAN (sc|s2|x)\b/.test(d))) loi.push(`QL listCases(p, {}) vẫn SCAN: ${plan.join(' | ')}`);
  console.log(`      (đo ×3: ${soTk} tài khoản quyền chi nhánh, ${soCase} dòng Case so)`);
  assert(!loi.length, loi.join(' · '));
});

/*
 * DOC-IT-2 (02/11): hai câu quét cả bảng ở Công việc (mọi vai) + lượt quét nền — đo bằng `scripts/do-it.py` trên DB ×3 (mô tả PR). Mini test chưa có tỉ lệ
 * trước đi ngược từ MỌI ghi danh active (SCAN enrollments mỗi lần mở Công việc / Tổng quan GV); hẹn Lộ trình mới tới tuần quét cả `learning_cycles`.
 */
await checkAsync('DOC-IT-2 (×3) · mini test chưa có tỉ lệ + hẹn Lộ trình mới: đi chỉ mục một phần, không SCAN enrollments / learning_cycles; migrate chạy lặp được', async () => {
  const { migratePrDocIt2, CHI_MUC_DOC_IT_2 } = await import('../migrate/prDocIt2.ts');
  const lan: string[][] = [[], []];
  migratePrDocIt2(conn, lan[0]); migratePrDocIt2(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  const ghi: { sql: string; args: unknown[] }[] = [];
  const PISA_DO_QUET_GOC = process.env.PISA_DO_QUET;
  doQuet.ghi = ghi;
  process.env.PISA_DO_QUET = '1';   // câu hẹn Lộ trình mới nằm trong lượt quét — đo khi quét chạy
  try {
    for (const vai of ['GVCN', 'QL'] as Vai[]) assert((await doSql(vai, 'GET', '/my-work')).status === 200, `${vai} /my-work không 200`);
  } finally {
    doQuet.ghi = null;
    if (!PISA_DO_QUET_GOC) delete process.env.PISA_DO_QUET;
  }
  const loi: string[] = [];
  for (const [ten, re, chiMuc] of [['mini test chưa có tỉ lệ', /FROM mini_test m JOIN students s/, CHI_MUC_DOC_IT_2[0][0]], ['hẹn Lộ trình mới', /buoc_tiep = 'lo_trinh_moi' AND buoc_tiep_hen/, CHI_MUC_DOC_IT_2[1][0]]] as const) {
    const cau = [...new Map(ghi.filter((g) => re.test(g.sql)).map((g) => [g.sql, g])).values()];
    if (!cau.length) { loi.push(`không bắt được câu "${ten}"`); continue; }
    for (const { sql, args } of cau) {
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
      if (!plan.some((d) => d.includes(chiMuc)) || plan.some((d) => /^SCAN (cur|learning_cycles)$/.test(d))) loi.push(`${ten}: ${plan.join(' | ')}`);
    }
  }
  assert(!loi.length, loi.join(' · '));
});

/* DOC-IT-6 (02/11): việc TVV của Công việc QL (`viecHoSoTvv`) trước SCAN cả `students` cả hệ thống rồi giữ em thuộc chi nhánh QL quản lý — nay tập cha theo chi nhánh
   trong SQL (JSON = câu cũ: phép S3-a, prS3CauCon). Ở đây: câu thật của QL `/my-work` (Của tôi, một chi nhánh) không SCAN students. */
await checkAsync('DOC-IT-6 (×3) · việc TVV của QL: không SCAN students', async () => {
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try {
    for (const url of ['/my-work', `/my-work?branchId=${CN}`, '/my-work?nguoi=tat-ca']) assert((await doSql('QL', 'GET', url)).status === 200, `QL ${url} không 200`);
  } finally { doQuet.ghi = null; }
  const cau = [...new Map(ghi.filter((g) => /s\.consultant_user_id AS tvv, e\.class_id/.test(g.sql)).map((g) => [g.sql + JSON.stringify(g.args), g])).values()];
  assert(cau.length, 'không bắt được câu việc TVV');
  const loi: string[] = [];
  for (const { sql, args } of cau) {
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
    if (plan.some((d) => /^SCAN s$/.test(d))) loi.push(plan.join(' | '));
  }
  assert(!loi.length, loi.join(' · '));
});

/* DOC-IT-5 (02/11): danh sách Lưu trữ (`danhSachLuuTru` — Học viên & Lớp mọi vai đếm Lưu trữ mỗi lần mở) `WHERE s.archived_at IS NOT NULL` trước SCAN cả `students`
   (bản chính 844 dòng, 14 em lưu trữ) — nay đi chỉ mục một phần. */
await checkAsync('DOC-IT-5 (×3) · Lưu trữ HV đi chỉ mục một phần, không SCAN students; migrate chạy lặp được', async () => {
  const { migratePrDocIt5 } = await import('../migrate/prDocIt5.ts');
  const lan: string[][] = [[], []];
  migratePrDocIt5(conn, lan[0]); migratePrDocIt5(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try {
    for (const vai of ['QL', 'GVCN'] as Vai[]) assert((await doSql(vai, 'GET', '/hoc-vien-lop')).status === 200, `${vai} /hoc-vien-lop không 200`);
  } finally { doQuet.ghi = null; }
  const cau = [...new Map(ghi.filter((g) => /FROM students s WHERE s\.archived_at IS NOT NULL/.test(g.sql)).map((g) => [g.sql, g])).values()];
  assert(cau.length, 'không bắt được câu Lưu trữ');
  const loi: string[] = [];
  for (const { sql, args } of cau) {
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
    if (!plan.some((d) => d.includes('idx_student_luu_tru')) || plan.some((d) => /^SCAN s$/.test(d))) loi.push(plan.join(' | '));
  }
  assert(!loi.length, loi.join(' · '));
});

/* GIAM-DOC-0611c: việc "Báo PH kết quả Test" đang chờ (`mywork.ts` 3c, `emCoBaoPhChuaLam`) `x.kind = ? AND x.status = 'pending'` trước SCAN cả `sos_coordination_actions`
   (bản chính 29/10: 436 dòng, 117 đang chờ) — nay đi chỉ mục một phần idx_sca_cho. */
await checkAsync('GIAM-DOC-0611c (×3) · việc Báo PH đang chờ đi idx_sca_cho, không SCAN sos_coordination_actions; migrate chạy lặp được', async () => {
  const { migratePrGiamDoc0611 } = await import('../migrate/prGiamDoc0611.ts');
  const lan: string[][] = [[], []];
  migratePrGiamDoc0611(conn, lan[0]); migratePrGiamDoc0611(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try {
    assert((await doSql('GVCN', 'GET', '/my-work')).status === 200, 'GVCN /my-work không 200');
  } finally { doQuet.ghi = null; }
  const cau = [...new Map(ghi.filter((g) => /FROM sos_coordination_actions x JOIN students s[\s\S]*x\.kind = 'bao_ph_tvv' AND x\.status = 'pending'/.test(g.sql)).map((g) => [g.sql, g])).values()];
  assert(cau.length, 'không bắt được câu Báo PH kết quả Test');
  const loi: string[] = [];
  for (const { sql, args } of cau) {
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
    if (!plan.some((d) => d.includes('idx_sca_cho')) || plan.some((d) => /^SCAN x$/.test(d))) loi.push(plan.join(' | '));
  }
  assert(!loi.length, loi.join(' · '));
});

/* TURSO-1211 (đo bản chép bản chính, docs/superpowers/specs/2026-11-12-turso-toc-do/ra.md mục A): 7 câu trước quét cả bảng nay đi chỉ mục mới. */
await checkAsync('TURSO-1211 (×3) · 9 câu Công việc / Tổng quan / hồ sơ HV đi chỉ mục mới, không SCAN; migrate chạy lặp được', async () => {
  const { migratePrTurso1211 } = await import('../migrate/prTurso1211.ts');
  const lan: string[][] = [[], []];
  migratePrTurso1211(conn, lan[0]); migratePrTurso1211(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try {
    for (const [vai, url] of [['GVCN', '/my-work'], ['QL', '/my-work'], ['GVCN', '/tong-quan/lop-toi-day/hai-khoi'], ['QL', `/students/${HV}`], ['TVV', '/tong-quan/hoc-vien']] as [Vai, string][]) {
      assert((await doSql(vai, 'GET', url)).status === 200, `${vai} ${url} không 200`);
    }
  } finally { doQuet.ghi = null; }
  const loi: string[] = [];
  for (const [ten, re, chiMuc, scan] of [
    ['Ghi kết quả PA', /iv\.action_due IS NOT NULL AND iv\.action_due <= \?(?!\s*AND iv\.action_due > \?)/, 'idx_iv_ghi_kq', /^SCAN iv$/],
    /* LG-13 "Sắp tới": cùng câu Ghi kết quả PA nhưng đi từ em lớp GV / chủ Case / người dạy nhóm (rowid IN), không quét PA tới hạn cả hệ thống. */
    ['Sắp tới · PA tới kỳ', /AND iv\.id IN \(\s*SELECT iv2\.id AS id/, 'idx_intervention_case', /^SCAN (iv|sc|iv2|sc2|e2)$/],
    /* TD-VIEC: Xác nhận PA lọc tập cha `locCaseMo` — GV đi danh sách Case của lớp (idx_case_student), QL "Của tôi" đi idx_case_owner; "Tất cả" toàn hệ thống giữ idx_iv_cho_xac_nhan. */
    ['Xác nhận PA', /AS chon_pa/, 'idx_iv_cho_xac_nhan|idx_case_owner|idx_case_student', /^SCAN (iv|sc)$/],
    ['Mốc PA quy chế', /iv\.moc_quy_che IN \('until_next_mt', 'until_exam'\)/, 'idx_iv_moc_cho', /^SCAN iv$/],
    ['Chờ kết quả thi', /COALESCE\(c\.thi_that_ngay, c\.exam_date, c\.ended_at\) < \?/, 'idx_cycle_cho_kq_ngay', /^SCAN c\b/],
    ['WL2 thi thật', /FROM discipline_measures dm WHERE dm\.cycle_id = c\.id/, 'idx_dm_cycle', /^SCAN dm$/],
    ['Kết quả PA cuối', /FROM case_followups fu\s+WHERE fu\.intervention_id = iv\.id/, 'idx_followup_iv', /^SCAN fu$/],
    ['Vi phạm 7 ngày', /FROM violations WHERE occurred_on >= \?/, 'idx_violation_ngay', /^SCAN violations$/],
    ['Case mới 7 ngày', /sc\.category FROM sos_cases sc[\s\S]*sc\.created_at >= \?/, 'idx_case_tao', /^SCAN sc$/],
  ] as const) {
    const cau = [...new Map(ghi.filter((g) => re.test(g.sql)).map((g) => [g.sql, g])).values()];
    if (!cau.length) { loi.push(`không bắt được câu "${ten}"`); continue; }
    for (const { sql, args } of cau) {
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
      if (!plan.some((d) => chiMuc.split('|').some((c) => d.includes(c))) || plan.some((d) => scan.test(d))) loi.push(`${ten}: ${plan.join(' | ')}`);
    }
  }
  assert(!loi.length, loi.join(' · '));
});

/* TURSO-1211 (mục C): `/hoc-vien-lop?kem=sos` = danh sách + Đang SOS trong một request — JSON từng phần y hệt hai request riêng; Admin / không xem Case: `sos: null`.
   `doSql` giữ mốc quét còn hạn — lượt quét nền không chen giữa ba lần gọi. */
await checkAsync('TURSO-1211 (×3) · Học viên & Lớp kem=sos: trang + Đang SOS y hệt hai request riêng (mọi vai), Admin sos null', async () => {
  const loi: string[] = [];
  for (const vai of [...MOI_VAI, 'TVV', 'CX', 'ADMIN'] as Vai[]) {
    const gop = await doSql(vai, 'GET', '/hoc-vien-lop?kem=sos');
    const trang = await doSql(vai, 'GET', '/hoc-vien-lop');
    const sos = await doSql(vai, 'GET', '/hoc-vien-lop?goc=sos');
    const { sos: phanSos, ...phanTrang } = gop.json as any;
    if (gop.status !== 200 || JSON.stringify(phanTrang) !== JSON.stringify(trang.json)) loi.push(`${vai}: phần trang khác`);
    if (vai === 'ADMIN' ? phanSos !== null : JSON.stringify(phanSos) !== JSON.stringify(sos.json)) loi.push(`${vai}: phần SOS khác`);
  }
  assert(!loi.length, loi.join(' · '));
});

/* TD-QUET (17/11, đề xuất 2): `/classes/:id/ho-so?phan=…` — mỗi phần y hệt GET lẻ cùng tham số trang (cả lỗi có chủ đích: mã + thân), mọi vai, lớp FT + thường. */
await checkAsync('TD-QUET (×3) · Hồ sơ lớp một GET: mỗi phần trùng JSON GET lẻ (mọi vai, FT + thường), phần lạ → 400', async () => {
  const LE: Record<string, (l: number) => string> = {
    overview: (l) => `/classes/${l}/overview`, roster: (l) => `/classes/${l}/roster`, diemTheoLuot: (l) => `/classes/${l}/diem-theo-luot`,
    viecCuaToi: (l) => `/classes/${l}/viec-theo-em?chi=toi`, xetLai: (l) => `/classes/${l}/xet-lai`, xoaKetThuc: (l) => `/classes/${l}/xoa-ket-thuc`,
    cases: (l) => `/cases?classId=${l}`,
  };
  const loi: string[] = [];
  for (const vai of [...MOI_VAI, 'TVV', 'CX', 'ADMIN'] as Vai[]) {
    for (const lop of [LOP_FT, LOP_THUONG]) {
      const gop = await doSql(vai, 'GET', `/classes/${lop}/ho-so?phan=${Object.keys(LE).join(',')}`);
      if (gop.status !== 200) { loi.push(`${vai} ${lop}: gộp ${gop.status}`); continue; }
      let cauLe = 0, dongLe = 0;
      for (const [k, url] of Object.entries(LE)) {
        const le = await doSql(vai, 'GET', url(lop));
        cauLe += le.n; dongLe += le.dong;
        const { status, data, ...e } = (gop.json as any)[k];
        if (status !== le.status || JSON.stringify(le.status === 200 ? data : e) !== JSON.stringify(le.json)) loi.push(`${vai} ${lop} ${k}`);
      }
      if (gop.n > cauLe || gop.dong > dongLe) loi.push(`${vai} ${lop}: gộp ${gop.n} câu ${gop.dong} dòng > lẻ ${cauLe} / ${dongLe}`);
    }
  }
  if ((await doSql('QL', 'GET', `/classes/${LOP_FT}/ho-so?phan=overview,la`)).status !== 400) loi.push('phần lạ không 400');
  assert(!loi.length, loi.join(' · '));
});

/* TD-QUET (17/11): `kem=sos-dem` = trang y hệt + số tab Đang SOS = chiếu (em · lớp · FT · TVV) của đúng các dòng bảng `goc=sos` (cùng thứ tự tập em); Admin null. */
await checkAsync('TD-QUET (×3) · Học viên & Lớp kem=sos-dem: trang y hệt, sosDem = chiếu dòng Đang SOS (mọi vai), Admin null', async () => {
  const loi: string[] = [];
  for (const vai of [...MOI_VAI, 'TVV', 'CX', 'ADMIN'] as Vai[]) {
    const dem = await doSql(vai, 'GET', '/hoc-vien-lop?kem=sos-dem');
    const trang = await doSql(vai, 'GET', '/hoc-vien-lop');
    const sos = await doSql(vai, 'GET', '/hoc-vien-lop?goc=sos');
    const { sosDem, ...phanTrang } = dem.json as any;
    if (dem.status !== 200 || JSON.stringify(phanTrang) !== JSON.stringify(trang.json)) loi.push(`${vai}: phần trang khác`);
    if (vai === 'ADMIN') { if (sosDem !== null) loi.push('ADMIN: sosDem phải null'); continue; }
    const tap = (rows: any[]) => JSON.stringify(rows.map((r) => [r.studentId, r.classId, r.ft, r.tvv]).sort());
    if (!sosDem || tap(sosDem.rows) !== tap((sos.json as any).rows)) loi.push(`${vai}: sosDem khác dòng Đang SOS`);
  }
  assert(!loi.length, loi.join(' · '));
});

await checkAsync('TD7a (×3) · Xem nhận xét Speaking: không SCAN assessment_scores / case_milestones; migrate prTd7a chạy lặp được', async () => {
  const { migratePrTd7a, CHI_MUC_TD7A } = await import('../migrate/prTd7a.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const lan: string[][] = [[], []];
  migratePrTd7a(conn, lan[0]); migratePrTd7a(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  for (const [ten] of CHI_MUC_TD7A) assert(conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten), `thiếu ${ten}`);
  const gvS = (conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active' ORDER BY id LIMIT 1`).get(LOP_FT) as any).id;
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  try {
    chayTrongRequest('GET', () => myWork(loadPrincipal(USER.QT), { nguoi: 'tat-ca', branchId: CN }));
    chayTrongRequest('GET', () => myWork(loadPrincipal(USER.QL), { nguoi: 'tat-ca' }));
    chayTrongRequest('GET', () => myWork(loadPrincipal(gvS)));
  } finally {
    doQuet.ghi = null;
  }
  const cau = [...new Map(ghi.filter((g) => /s\.cho_phu_trach_xem = 1/.test(g.sql)).map((g) => [g.sql, g])).values()];
  assert(cau.length === 3 && cau.some((g) => /c\.branch_id = \?/.test(g.sql)) && cau.some((g) => /a\.class_id IN \(/.test(g.sql)), `không bắt đủ ba dạng câu xem_nx_s (${cau.length} câu)`);
  const quet: string[] = [];
  for (const { sql, args } of cau) {
    const bang = new Map([...sql.matchAll(/(?:FROM|JOIN)\s+(\w+)\s+(?:AS\s+)?(\w+)/gi)].map((m) => [m[2], m[1]]));
    const plan = conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[];
    if (!plan.some((r) => r.detail.includes('idx_score_cho_phu_trach'))) quet.push(`không dùng idx_score_cho_phu_trach: ${plan[0]?.detail}`);
    for (const r of plan) {
      const m = /^(?:SCAN (\w+)|SEARCH (\w+)$)/.exec(r.detail);
      /* `SCAN s USING … INDEX idx_score_cho_phu_trach` = duyệt chỉ mục một phần — chỉ các ô đang chờ, không phải cả bảng. */
      if (m && !r.detail.includes('idx_score_cho_phu_trach') && ['assessment_scores', 'case_milestones'].includes(bang.get(m[1] ?? m[2]) ?? m[1] ?? m[2])) quet.push(r.detail);
    }
  }
  assert(!quet.length, `còn quét cả bảng:\n        ${quet.join('\n        ')}`);
});

/*
 * TD7 (chủ SP 19/10, Turso Top Queries — tổng dòng đọc theo câu): (1) "MT lịch sử chưa nhập", "chờ kết quả thi thật", "chờ chọn bước tiếp" đi chỉ mục một
 * phần (migrate prTd7), không SCAN learning_cycles / không duyệt mọi lượt của lớp; (2) câu dùng chung chạy MỘT lần mỗi request GET (chờ kết quả thi, chờ
 * bước tiếp, bốn bảng phụ của danh sách Case); danh sách Case lọc chi nhánh không SCAN mọi Case; (3) lượt mới nhất (`latestAttempts`) chỉ nạp lịch kỹ
 * năng của lượt ứng viên — QL Tổng quan chi nhánh trước 765 lượt / request. JSON mọi GET trùng main (đã so 460 phản hồi ×3, mô tả PR); Công việc: TD4-a.
 */
await checkAsync('TD7 (×3) · chỉ mục một phần + câu dùng chung một lần / request + lịch kỹ năng chỉ lượt ứng viên; migrate prTd7 chạy lặp được', async () => {
  const { migratePrTd7, CHI_MUC_TD7 } = await import('../migrate/prTd7.ts');
  const lan: string[][] = [[], []];
  migratePrTd7(conn, lan[0]); migratePrTd7(conn, lan[1]);
  assert(!lan[0].length && !lan[1].length, `migrate trên DB đã có chỉ mục vẫn báo đổi: ${lan.flat().join(' | ')}`);
  for (const [ten] of CHI_MUC_TD7) assert(conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?").get(ten), `thiếu ${ten}`);
  const MAU = {
    lichSu: /a\.lich_su = 1 AND a\.status = 'planned'/, choKq: /AS class_id\s+FROM learning_cycles c JOIN students s/,
    buocTiep: /AS branch_id\s+FROM learning_cycles c JOIN students s/, phuCase: /FROM case_milestones\s+WHERE attempt_no IS NOT NULL GROUP BY case_id/,
    dsCase: /AS intervention_count/, lich: /FROM attempt_skills ask\b/,
  };
  const loi: string[] = [];
  const daXet = new Set<string>();
  for (const [vai, url] of [['GVCN', '/my-work'], ['QL', '/cham/lich-test'], ['CX', '/tong-quan/hoc-vien'], ['TVV', '/hoc-vien-lop/theo-vai'], ['QL', '/tong-quan/chi-nhanh']] as [Vai, string][]) {
    const tho: { sql: string; args: unknown[] }[] = [];
    doQuet.ghi = tho;
    try { assert((await doSql(vai, 'GET', urlFor(url))).status === 200, `${vai} ${url} không 200`); } finally { doQuet.ghi = null; }
    /* libsql: all() gọi iterate() → móc ghi đôi liền nhau; bỏ bản ghi trùng hệt ngay trước. */
    const ghi = tho.filter((g, i) => !i || g.sql !== tho[i - 1].sql || JSON.stringify(g.args) !== JSON.stringify(tho[i - 1].args));
    const dem = (re: RegExp) => ghi.filter((g) => re.test(g.sql)).length;
    for (const k of ['choKq', 'buocTiep', 'phuCase'] as const) if (dem(MAU[k]) > 1) loi.push(`${vai} ${url}: câu ${k} chạy ${dem(MAU[k])} lần`);
    /* Danh sách Case lọc chi nhánh: đi tập cha theo chỉ mục, không SCAN mọi Case (CX hỏi lần lượt 5 chi nhánh). */
    for (const { sql, args } of ghi.filter((g) => MAU.dsCase.test(g.sql) && /COALESCE\(cc\.branch_id, ac\.branch_id\) = \?/.test(g.sql)).slice(0, 1)) {
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
      if (plan.some((d) => /^SCAN sc\b/.test(d))) loi.push(`${vai} ${url}: danh sách Case lọc chi nhánh vẫn SCAN sos_cases`);
      daXet.add(sql);
    }
    if (url === '/tong-quan/chi-nhanh') {
      const soLuot = ghi.filter((g) => MAU.lich.test(g.sql)).reduce((n, g) => n + g.args.flat().length, 0);
      console.log(`      (đo ×3: QL /tong-quan/chi-nhanh lịch kỹ năng ${soLuot} lượt, trước TD7 765)`);
      if (soLuot > 765 * 0.4) loi.push(`QL ${url}: lịch kỹ năng ${soLuot} lượt (> 40 % của 765)`);
    }
    for (const [k, chiMuc] of [['lichSu', 'idx_attempt_lich_su_cho'], ['choKq', 'idx_cycle_cho_kq'], ['buocTiep', 'idx_cycle_cho_buoc_tiep']] as const) {
      for (const { sql, args } of ghi.filter((g) => MAU[k].test(g.sql) && !/c\.student_id = \?$/.test(g.sql.trim()))) {
        if (daXet.has(sql)) continue;
        daXet.add(sql);
        const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
        if (!plan.some((d) => d.includes(chiMuc))) loi.push(`${k}: không dùng ${chiMuc} — ${plan[0]}`);
      }
    }
  }
  for (const k of ['lichSu', 'choKq', 'buocTiep', 'dsCase']) if (![...daXet].some((s) => MAU[k as keyof typeof MAU].test(s))) loi.push(`không bắt được câu ${k}`);
  assert(!loi.length, loi.join('\n        '));
});

/*
 * TD7b (chủ SP 19/10): Nợ điểm (`scoreDebtCells`), badge lớp, danh sách `chiConO` (Công việc, Lịch Test) đọc lượt qua cờ `o_cho_tu` + chỉ mục một phần — không SCAN
 * assessment_attempts, không nạp mọi lượt đã chấm xong. Khoá bằng EXPLAIN QUERY PLAN trên câu thật của các đường chạm; số câu / dòng trước → sau: mô tả PR + TRAN_DONG.
 */
await checkAsync('TD7b (×3) · câu đọc lượt của Nợ điểm / badge lớp / Công việc đi chỉ mục một phần idx_attempt_o_cho[_lop]', async () => {
  const loi: string[] = [];
  const thay = new Set<string>();
  for (const [vai, url] of [['QL', '/tong-quan/chi-nhanh'], ['GVCN', '/my-work'], ['QL', '/cham/lich-test'], ['QL', '/classes'], ['QL', '/metrics/bai-qua-han-nhap-diem?rows=1']] as [Vai, string][]) {
    const tho: { sql: string; args: unknown[] }[] = [];
    doQuet.ghi = tho;
    try { assert((await doSql(vai, 'GET', urlFor(url))).status === 200, `${vai} ${url} không 200`); } finally { doQuet.ghi = null; }
    for (const { sql, args } of tho.filter((g, i) => (!i || g.sql !== tho[i - 1].sql) && /a\.o_cho_tu <= \?/.test(g.sql))) {
      if (thay.has(sql)) continue;
      thay.add(sql);
      const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
      if (plan.some((d) => /^SCAN a\b/.test(d) && !d.includes('idx_attempt_o_cho'))) loi.push(`${vai} ${url}: SCAN assessment_attempts — ${plan.filter((d) => /SCAN|SEARCH a\b/.test(d)).join(' | ')}`);
      if (!plan.some((d) => /idx_attempt_o_cho/.test(d))) loi.push(`${vai} ${url}: không dùng chỉ mục cờ idx_attempt_o_cho[_lop] — ${plan.filter((d) => /SEARCH a\b|SCAN a\b/.test(d)).join(' | ')}`);
    }
  }
  assert(thay.size >= 3, `chỉ bắt được ${thay.size} câu dùng cờ`);
  assert(!loi.length, loi.join(' | '));
});

/*
 * TD4-b: bản chính 15/10 log `[cham]` /my-work 5–7,5 s, 75–126 câu, 6 900–18 400 dòng (top: lịch kỹ năng của MỌI lượt trong phạm vi). Mốc ×3 trước TD4
 * (main 35517670, đo trong chính phép này): câu / dòng dưới đây. Khoá: dòng ≤ 40 % mốc, số câu ×3 ≤ ×1 + 2 (không tăng theo dữ liệu) và ≤ mốc − 3.
 * V5 SV-SO1 (chủ SP 22/10): ô có band thiếu nhận xét bắt buộc là việc thật (seed 327 ô) → /my-work đọc thêm lượt còn ô chờ: đo ×3 43–57 % mốc (sau gộp SEED-UX: tới 66 %) → khoá 70 %
 * (vẫn dưới mốc trước TD4 nhiều; giảm dần khi GV ghi đủ nhận xét). "Tất cả" +1 câu (ngữ cảnh Case "Làm thay").
 */
check('TD4-b (×3) · /my-work mọi vai: dòng ≤ 70 % mốc trước TD4 (V5 SV-SO1; trước 40 %), số câu không tăng theo dữ liệu', () => {
  const MOC: Record<string, [number, number]> = {
    /* SV-YT-TVV + SV-TVV-VIEC (21/10): QL / QT "Của tôi" +2 câu — việc Báo PH (một câu) + Chốt ngày thi / Bổ sung hồ sơ (một câu cho cả hai). */
    /* MAIN-DO (BU_MT2 SEED-UX): +1 câu QL / QT như trần TRAN; dòng ×3 mọi vai +~150 (58a2d268 → 9a078719, QL 2 202 → 2 352) — mốc dòng QL 5 647 → 5 880. */
    /* PC-GV-A +1 câu (quét lịch đổi phân công GV tới hạn trong `quetLenhDenHan`). */
    /* PR-B +1 câu (việc bàn giao khi đổi GV). */
    'QL /my-work': [75, 5880], 'QT /my-work': [75, 7775],   /* P9a XET-LAI +2 câu (tập Xét lại) */   /* SV-NX-CASE +1 (MT mới nhất của em: một câu / trang) */   /* SEED-UX: +1 QL / QT (em "Đã thi · chờ KQ" theo ngày) */
    'GVCN /my-work': [67, 4502], 'GVBM /my-work': [67, 5140], 'GVCN_THUONG /my-work': [67, 4502],
    'QL /my-work?nguoi=tat-ca': [85, 6721], 'QT /my-work?nguoi=tat-ca': [85, 9176],   /* PC-GV-A +1 */   /* P9a XET-LAI +2 câu */   /* MAIN-DO +1 (BU_MT2); V5 SV-SO1 +1 (ngữ cảnh Case "Làm thay") */ [`QL /my-work?nguoi=${USER.GVCN}`]: [73, 4530],
  };
  const sai: string[] = [];
  for (const [k, [cau, dong]] of Object.entries(MOC)) {
    const c = cauSauNhan.get(k) ?? Infinity, d = dongSauNhan.get(k) ?? Infinity, c1 = truocNhan.get(k) ?? -Infinity;
    console.log(`      (đo ×3: ${k} ${cau} → ${c} câu · ${dong} → ${d} dòng)`);
    if (d > Math.floor(dong * 0.7) || c > c1 + 2 || c > cau - 3) sai.push(`${k}: ${c} câu (×1 ${c1}), ${d} dòng`);
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

await checkAsync(`TU-b · Tải danh sách tutor 50 dòng (POST /tutors/tai-len, lưu) ≤ ${TRAN_GHI_LO.taiLenTutor} câu SQL`, async () => {
  const cu = (conn.prepare('SELECT ten FROM tutors ORDER BY id LIMIT 10').all() as any[]).map((x) => [x.ten, '', '', 'L, R, S']);
  const rows = [['Tên', 'SĐT', 'Nơi dạy', 'Kỹ năng'], ...cu, ...Array.from({ length: 40 }, (_, i) => [`Tutor đo ${i}`, `09${String(10000000 + i)}`, 'Online', 'W'])];
  const truoc = soCauSql(), dongTruoc = soDongSql();
  const r = await callHttp('QT', 'POST', '/tutors/tai-len', { rows, luu: true });
  const n = soCauSql() - truoc;
  assert(r.status === 200, `POST tai-len ${r.status}`);
  console.log(`      (đo: ${n} câu, ${soDongSql() - dongTruoc} dòng)`);
  assert(n <= TRAN_GHI_LO.taiLenTutor, `${n} câu > trần ${TRAN_GHI_LO.taiLenTutor}`);
});

/* TD-GHI (chủ SP 18/11): lưu điểm — đường ghi hay gọi nhất (log 24 h: ~200 lần / ngày). FT: 5 môn của MỘT lượt chưa có điểm (môn cuối chốt lượt + Case);
 * lớp thường: các môn của một lượt chưa có điểm. QL nhập (cùng đường kiểm quyền / ghi như GV). Trần từng lần lưu. */
await checkAsync('TD-GHI · lưu điểm FT 5 môn (môn cuối chốt lượt) + lớp thường từng môn ≤ trần câu SQL / lần lưu', async () => {
  const chuaDiem = `NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id) AND a.status = 'planned'`;
  const ft = (conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'mock' AND ${chuaDiem} ORDER BY a.id LIMIT 1`).get(LOP_FT) as any)?.id as number;
  const th = conn.prepare(`SELECT a.id, c.programme_code ct FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
    WHERE c.is_fast_track = 0 AND c.branch_id = ? AND c.status != 'finished' AND a.kind != 'mt0' AND ${chuaDiem} ORDER BY a.class_id = ? DESC, a.id LIMIT 1`).get(CN, LOP_THUONG) as any;
  assert(ft && th, `thiếu lượt chưa có điểm: FT ${ft} · thường ${JSON.stringify(th)}`);
  const ngay = demoToday15d();
  const ghi: string[] = [];
  const luu = async (url: string, body: unknown, tran: number, tranDong: number) => {
    const truoc = soCauSql(), dongTruoc = soDongSql();
    const r = await callHttp('QL', 'PUT', url, body);
    const n = soCauSql() - truoc, dong = soDongSql() - dongTruoc;
    ghi.push(`${url.replace(/\d+/, ':id')} ${n} câu ${dong} dòng`);
    assert(r.status === 200, `${url} ${r.status} ${JSON.stringify(r.json)}`);
    assert(n <= tran && dong <= tranDong, `${url}: ${n} câu / ${dong} dòng > trần ${tran} / ${tranDong}`);
  };
  for (const [k, band] of [['reading', 5], ['listening', 5.5], ['writing1', 5], ['speaking', 5]] as const) {
    await luu(`/attempts/${ft}/scores/${k}`, { band, resultDate: ngay, nhanXet: 'Đo tốc độ lưu điểm.', ...(k === 'speaking' ? { gvCham: { performerName: 'GV ngoài đo tốc độ' } } : {}) }, TRAN_GHI_LO.luuDiemFt, TRAN_GHI_LO.luuDiemFtDong);
  }
  await luu(`/attempts/${ft}/scores/writing2`, { band: 5, resultDate: ngay, nhanXet: 'Đo tốc độ lưu điểm.' }, TRAN_GHI_LO.luuDiemFtChotLuot, TRAN_GHI_LO.luuDiemFtChotLuotDong);
  const mon = (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq').all(th.ct) as any[]).map((r) => r.skill as string);
  for (const k of mon) await luu(`/regular/attempts/${th.id}/scores/${k}`, { score: 5, total: 10 }, TRAN_GHI_LO.luuDiemThuong, TRAN_GHI_LO.luuDiemThuongDong);
  console.log(`      (đo: ${ghi.join(' · ')})`);
});

await checkAsync(`OV-15f · Lưu kết luận Lịch thi (PUT /hoc-vien-lop/lich-thi/:cycleId) ≤ ${TRAN_GHI_LO.luuLichThi} câu SQL`, async () => {
  const cy = (conn.prepare(`SELECT cy.id FROM learning_cycles cy JOIN enrollments e ON e.student_id = cy.student_id AND e.status = 'active' WHERE e.class_id = ? AND cy.status = 'active' LIMIT 1`).get(LOP_FT) as any).id as number;
  const truoc = soCauSql(), dongTruoc = soDongSql();
  const r = await callHttp('QL', 'PUT', `/hoc-vien-lop/lich-thi/${cy}`, { ketLuan: 'can-xac-nhan', ghiChu: 'đo tốc độ' });
  const n = soCauSql() - truoc;
  assert(r.status === 200, `PUT lich-thi ${r.status}`);
  console.log(`      (đo: ${n} câu, ${soDongSql() - dongTruoc} dòng)`);
  assert(n <= TRAN_GHI_LO.luuLichThi, `${n} câu > trần ${TRAN_GHI_LO.luuLichThi}`);
});

await checkAsync(`OV-15f · Xuất Excel danh sách HV mẫu Theo dõi SOS cả lớp MB FT 101 (POST /hoc-vien-lop/xuat) ≤ ${TRAN_GHI_LO.xuatDanhSachSos} câu SQL`, async () => {
  const sids = (conn.prepare(`SELECT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(LOP_FT) as any[]).map((x) => x.id);
  const truoc = soCauSql(), dongTruoc = soDongSql();
  const r = await callHttp('QL', 'POST', '/hoc-vien-lop/xuat', { ids: sids, mau: 'theo-doi-sos', boLoc: 'Đang SOS', xemTruoc: true, sos: { tuan: 'tat-ca' } });
  const n = soCauSql() - truoc;
  assert(r.status === 200 && r.json.dem.hocVien === sids.length, `xuất ${r.status}`);
  console.log(`      (đo: ${sids.length} em, ${n} câu, ${soDongSql() - dongTruoc} dòng)`);
  assert(n <= TRAN_GHI_LO.xuatDanhSachSos, `${n} câu > trần ${TRAN_GHI_LO.xuatDanhSachSos}`);
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

/** PHEP-DO-LO: đo câu + dòng của `fn` trong một giao dịch cuộn lại (không để dấu cho phép đo sau). */
function doCuonLai(fn: () => void) {
  let n = 0, dong = 0;
  conn.exec('BEGIN IMMEDIATE');
  try {
    chayTrongRequest('POST', () => {
      const truoc = soCauSql(), dongTruoc = soDongSql();
      fn();
      n = soCauSql() - truoc; dong = soDongSql() - dongTruoc;
    });
  } finally { conn.exec('ROLLBACK'); }
  return { n, dong };
}

await checkAsync(`PHEP-DO-LO · Huỷ ${LO_HANG_LOAT_EM} quyết định chuyển lớp một lần (huyNhieuLenh) ≤ ${TRAN_GHI_LO.huyNhieuLenh8} câu SQL`, async () => {
  const { huyNhieuLenh } = await import('../classes/lenhChuyen.ts');
  const ids = (conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai = 'cho' ORDER BY id`).all(LOP_THUONG) as any[]).map((x) => x.id);
  assert(ids.length >= LO_HANG_LOAT_EM, `Cần ${LO_HANG_LOAT_EM} lệnh chờ từ phép đo trước: ${ids.length}`);
  const P = loadPrincipal(USER.QL);
  let kq: any;
  const mot = doCuonLai(() => huyNhieuLenh(P, ids.slice(0, 1), 'đo'));
  const lo = doCuonLai(() => { kq = huyNhieuLenh(P, ids.slice(0, LO_HANG_LOAT_EM), 'đo'); });
  assert(kq.ok.length === LO_HANG_LOAT_EM && !kq.failed.length, `Huỷ đủ lô: ${JSON.stringify(kq)}`);
  console.log(`      (đo: 1 lệnh ${mot.n} câu ${mot.dong} dòng · ${LO_HANG_LOAT_EM} lệnh ${lo.n} câu ${lo.dong} dòng)`);
  assert(lo.n <= TRAN_GHI_LO.huyNhieuLenh8, `${lo.n} câu > trần ${TRAN_GHI_LO.huyNhieuLenh8}`);
});

await checkAsync(`PHEP-DO-LO · Gán chủ Case chưa người phụ trách của mọi em có Case mở (≤ 500, nhiều lớp) (ganChuCaseThieu → suggestCaseOwner) ≤ ${TRAN_GHI_LO.ganChuCase500Em} câu SQL`, async () => {
  const { ganChuCaseThieu } = await import('../cases/owner.ts');
  const sids = (conn.prepare(
    `SELECT DISTINCT COALESCE(sc.student_id, a.student_id) AS id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE sc.status != 'done' AND sc.tam = 0 ORDER BY 1 LIMIT 500`).all() as any[]).map((x) => x.id);
  const ph = sids.map(() => '?').join(',');
  let soCase = 0, soGan = 0, soLop = 0;
  const r = doCuonLai(() => {
    soCase = conn.prepare(`UPDATE sos_cases SET owner_user_id = NULL WHERE status != 'done' AND tam = 0 AND (student_id IN (${ph})
      OR attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id IN (${ph})))`).run(...sids, ...sids).changes;
    soLop = (conn.prepare(`SELECT COUNT(DISTINCT class_id) n FROM enrollments WHERE status = 'active' AND student_id IN (${ph})`).get(...sids) as any).n;
    soGan = ganChuCaseThieu({ studentIds: sids, actorId: USER.QL, luc: new Date().toISOString() });
  });
  assert(soGan > 0, `Phải gán được chủ: ${soGan}/${soCase}`);
  /* 2 câu chuẩn bị (UPDATE, đếm lớp) nằm trong r — trừ ra. */
  const n = r.n - 2;
  console.log(`      (đo: ${sids.length} em, ${soLop} lớp, ${soCase} Case, gán ${soGan} — ${n} câu, ${r.dong} dòng)`);
  assert(n <= TRAN_GHI_LO.ganChuCase500Em, `${n} câu > trần ${TRAN_GHI_LO.ganChuCase500Em}`);
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

/* DON-LUONG K42a (rà sâu #742): người ~500 thông báo — trang đầu đầy nên có lượt 2 "Cần làm đã đọc"; lượt 2 lọc ở WHERE bên trong (đã đọc, cũ hơn trang,
   loại có thể còn việc) → dòng quét lượt 2 = số dòng thoả lọc đó (in ra), không phải ~500. */
await checkAsync(`DON-LUONG K42a · GET /notifications người 500 thông báo ≤ ${TRAN_GHI_LO.chuong500} câu, ≤ ${TRAN_GHI_LO.chuong500Dong} dòng trả về`, async () => {
  const u = accounts.createAccount(loadPrincipal(userByRole('system_admin', null)), {
    email: `do.chuong500${accounts.EMAIL_SUFFIX}`, password: 'matkhau-do-chuong', fullName: 'Đo chuông 500', roles: [{ role: 'teacher', branches: ['MB'] }],
  }).userId as number;
  const luc = new Date().toISOString();
  const them = conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at, read_at) VALUES (?,?,?,?,?,?)`);
  for (let i = 0; i < 500; i++) {
    const kind = i % 25 === 0 ? 'case_giao' : 'thu_do';   // 20 dòng loại Cần làm (Case không có → để biết), 480 dòng thường
    them.run(u, kind, `Đo ${i}`, `do500:${i}`, luc, i < 470 ? luc : null);   // 30 dòng mới nhất chưa đọc
  }
  const truoc = soCauSql(), dongTruoc = soDongSql();
  const r = await callHttpUser(u, 'GET', '/notifications');
  const n = soCauSql() - truoc, dong = soDongSql() - dongTruoc;
  const moc = Math.min(...(r.json as any[]).filter((x) => x.read_at).map((x) => x.id));
  const quet2 = (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND read_at IS NOT NULL AND id < ? AND kind IN ('case_giao')`).get(u, moc) as any).n;
  console.log(`      (đo: ${n} câu, ${dong} dòng trả về; lượt 2 quét ~${quet2} dòng thay vì 500)`);
  assert(r.status === 200 && n <= TRAN_GHI_LO.chuong500 && dong <= TRAN_GHI_LO.chuong500Dong, `${r.status} · ${n} câu · ${dong} dòng`);
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
    { chung: { soBuoi: 4, description: 'Hai buổi mỗi tuần, chữa đề bấm giờ, GV gửi nhận xét.' }, ds: ids.map((id) => ({ id })) });
  const cau = soCauSql() - truoc;
  console.log(`      (đo ×3: ${ids.length} PA → ${cau} câu, ${(cau / ids.length).toFixed(1)} câu / PA · ok ${json?.ok?.length} · lỗi ${json?.loi?.length})`);
  assert(status === 200 && json.ok.length === ids.length, `kết quả: ${status} ${JSON.stringify(json)}`);
  assert(cau <= 45 * ids.length, `${cau} câu cho ${ids.length} PA (> 45 / PA)`);
});

/*
 * GV-1 (N58, rà PTA 3 · 4): seed CÓ phần Meeting CX / GĐCN (30 hành động × 2 phần, ba chi nhánh) + Head MB theo dõi mọi phần + 20 việc Báo PH (≥ 60 dòng theo dõi):
 * `/my-work` của TVV / Head / Quản trị / CX — phần Meeting tìm theo chỉ mục (`idx_meeting_phan_mo` / `_giao`), không SCAN bảng; `/my-work/theo-doi` trong trần.
 * Dữ liệu thêm xoá ngay sau đo (không lẫn phép đo khác).
 */
await checkAsync('GV-1 (×3) · /my-work + /my-work/theo-doi có phần Meeting + ≥ 60 dòng theo dõi: không SCAN meeting_phan / viec_theo_doi, câu + dòng trong trần', async () => {
  const luc = new Date().toISOString();
  const em = conn.prepare(`SELECT s.id, COALESCE(c.branch_id, s.branch_id) AS cn, a.id AS att FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      JOIN classes c ON c.id = e.class_id JOIN assessment_attempts a ON a.student_id = s.id AND a.status != 'cancelled' GROUP BY s.id ORDER BY s.id LIMIT 30`).all() as any[];
  const qlMb = USER.QL;
  const them: { x: number[]; mp: number[] } = { x: [], mp: [] };
  for (const r of em) {
    const x = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at) VALUES (?, ?, 'other', ?, 0, 'done', ?)`)
      .run(r.att, r.id, `GV1-DO-${r.id}`, luc).lastInsertRowid);
    them.x.push(x);
    for (const phan of ['xep_lich', 'ket_qua']) {
      const mp = Number(conn.prepare(`INSERT INTO meeting_phan (phoi_hop_id, phan, branch_id, trang_thai, tao_luc) VALUES (?, ?, ?, 'mo', ?)`).run(x, phan, r.cn, luc).lastInsertRowid);
      them.mp.push(mp);
      conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, luc) VALUES ('meeting', ?, ?, 'head', ?)`).run(mp, qlMb, luc);
    }
  }
  for (const v of conn.prepare(`SELECT id FROM viec_bao_ph ORDER BY id LIMIT 20`).all() as any[]) {
    conn.prepare(`INSERT OR IGNORE INTO viec_theo_doi (loai, ref_id, user_id, nguon, luc) VALUES ('bao_ph', ?, ?, 'tay', ?)`).run(v.id, qlMb, luc);
  }
  const soTheoDoi = (conn.prepare('SELECT COUNT(*) n FROM viec_theo_doi WHERE user_id = ?').get(qlMb) as any).n;
  const ghi: { sql: string; args: unknown[] }[] = [];
  doQuet.ghi = ghi;
  const so: string[] = [];
  try {
    for (const [vai, url] of [['TVV', '/my-work'], ['QL', '/my-work'], ['QT', '/my-work'], ['CX', '/my-work'], ['QL', '/my-work?nguoi=tat-ca'], ['QL', '/my-work/theo-doi']] as [Vai, string][]) {
      const d = await doSql(vai, 'GET', url);
      assert(d.status === 200, `${vai} ${url} → ${d.status}`);
      so.push(`${vai} ${url} ${d.n} câu ${d.dong} dòng`);
      const tran = TRAN[`${vai} ${url}`], tranDong = TRAN_DONG[`${vai} ${url}`];
      if (tran) assert(d.n <= tran, `${vai} ${url}: ${d.n} câu > trần ${tran}`);
      /* Dòng TRẢ VỀ của phần Meeting theo luật tăng theo số phần đang mở của chi nhánh (ứng viên, lọc người giữ ở mã) — cộng đúng số phần vừa thêm. */
      if (tranDong) assert(d.dong <= tranDong * 3 + them.mp.length, `${vai} ${url}: ${d.dong} dòng > trần ×3 ${tranDong * 3} + ${them.mp.length} phần Meeting`);
    }
  } finally {
    doQuet.ghi = null;
    conn.prepare(`DELETE FROM viec_theo_doi WHERE user_id = ? AND luc = ?`).run(qlMb, luc);
    for (const id of them.mp) conn.prepare('DELETE FROM meeting_phan WHERE id = ?').run(id);
    for (const id of them.x) conn.prepare('DELETE FROM sos_coordination_actions WHERE id = ?').run(id);
  }
  console.log(`      (đo: ${em.length} Meeting · ${them.mp.length} phần · Head MB theo dõi ${soTheoDoi} việc — ${so.join(' · ')})`);
  const loi: string[] = [];
  const cau = [...new Map(ghi.filter((g) => /FROM meeting_phan mp|FROM viec_theo_doi t/.test(g.sql)).map((g) => [g.sql, g])).values()];
  assert(cau.length >= 2, `không bắt được câu Meeting / theo dõi (${cau.length})`);
  for (const { sql, args } of cau) {
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
    if (plan.some((d) => /^SCAN (mp|meeting_phan|t|viec_theo_doi)$/.test(d))) loi.push(plan.join(' | '));
  }
  assert(!loi.length, loi.join(' ‖ '));
});

/*
 * TL-1 (N61): seed CÓ yêu cầu trả lại — 30 vi phạm (MB) trả về GVBM + 10 về GVCN, mọi việc Báo PH đang mở của em TVV đo "Chờ GV sửa" (`tra_lai_id`).
 * Đo TRƯỚC → SAU trên cùng DB: /my-work GVBM · GVCN · TVV · QL — 0 câu thêm (hai vế UNION ALL trong câu "việc giao cho tôi"), dòng thêm ≤ số yêu cầu của
 * người đó; câu tra_lai đi chỉ mục (không SCAN); panel GET /y-thuc/tra-lai/:id + /y-thuc/bao-ph/:id (Chờ GV sửa) trong trần nhỏ. Xoá dữ liệu thêm sau đo.
 */
await checkAsync('TL-1 (×3) · /my-work có yêu cầu trả lại + Báo PH "Chờ GV sửa": 0 câu thêm, dòng ≤ số yêu cầu, không SCAN vi_pham_tra_lai; panel trong trần', async () => {
  const luc = new Date().toISOString();
  const vp = conn.prepare(`SELECT v.id, v.student_id FROM violations v JOIN enrollments e ON e.student_id = v.student_id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
      WHERE c.branch_id = ? ORDER BY v.id LIMIT 40`).all(CN) as any[];
  const bp = conn.prepare(`SELECT v.id FROM viec_bao_ph v JOIN students s ON s.id = v.student_id WHERE s.consultant_user_id = ? AND v.trang_thai = 'mo' AND v.measure_id IS NOT NULL`).all(USER.TVV) as any[];
  assert(vp.length >= 20, `seed thiếu vi phạm MB (${vp.length})`);
  const DO: [Vai, string][] = [['GVBM', '/my-work'], ['GVCN', '/my-work'], ['TVV', '/my-work'], ['QL', '/my-work'], ['QL', '/my-work?nguoi=tat-ca']];
  const truoc = new Map<string, { n: number; dong: number }>();
  for (const [vai, url] of DO) { const d = await doSql(vai, 'GET', url); truoc.set(`${vai} ${url}`, d); }
  const ids: number[] = [];
  const ghi: { sql: string; args: unknown[] }[] = [];
  const so: string[] = [];
  try {
    for (const [i, r] of vp.entries()) {
      ids.push(Number(conn.prepare(`INSERT INTO vi_pham_tra_lai (student_id, violation_id, ly_do, nguoi_tra, tra_luc, han, nguoi_nhan, trang_thai) VALUES (?, ?, 'Đo TL-1 tốc độ', ?, ?, ?, ?, 'mo')`)
        .run(r.student_id, r.id, USER.QL, luc, demoToday15d(), i < 30 ? USER.GVBM : USER.GVCN).lastInsertRowid));
    }
    for (const b of bp) conn.prepare('UPDATE viec_bao_ph SET tra_lai_id = ? WHERE id = ?').run(ids[0], b.id);
    doQuet.ghi = ghi;
    for (const [vai, url] of DO) {
      const d = await doSql(vai, 'GET', url);
      const t0 = truoc.get(`${vai} ${url}`)!;
      const nhan = vai === 'GVBM' ? 30 : vai === 'GVCN' ? 10 : url.includes('tat-ca') ? ids.length : 0;   // Head "Tất cả": mọi yêu cầu mở của chi nhánh
      so.push(`${vai} ${url} ${t0.n} → ${d.n} câu · ${t0.dong} → ${d.dong} dòng`);
      assert(d.status === 200 && d.n <= t0.n, `${vai} ${url}: ${t0.n} → ${d.n} câu (phải không thêm câu)`);
      assert(d.dong <= t0.dong + nhan, `${vai} ${url}: ${t0.dong} → ${d.dong} dòng (> + ${nhan} yêu cầu)`);
      const tran = TRAN[`${vai} ${url}`], tranDong = TRAN_DONG[`${vai} ${url}`];
      if (tran) assert(d.n <= tran, `${vai} ${url}: ${d.n} câu > trần ${tran}`);
      if (tranDong) assert(d.dong <= tranDong * 3 + nhan, `${vai} ${url}: ${d.dong} dòng > trần ×3 ${tranDong * 3} + ${nhan}`);
    }
    const khoa = new Set(JSON.stringify((await callHttp('GVBM', 'GET', '/my-work')).json).match(/"key":"yt_tra_lai:\d+"/g) ?? []);
    assert(khoa.size === 30, `GVBM thấy ${khoa.size} / 30 việc trả lại`);
    const pn = await doSql('GVBM', 'GET', `/y-thuc/tra-lai/${ids[0]}`);
    assert(pn.status === 200 && pn.n <= 20 && pn.dong <= 60, `panel trả lại: ${pn.status} ${pn.n} câu ${pn.dong} dòng`);
    so.push(`panel trả lại ${pn.n} câu ${pn.dong} dòng`);
    if (bp.length) {
      const b = await doSql('TVV', 'GET', `/y-thuc/bao-ph/${bp[0].id}`);
      assert(b.status === 200 && (b.json as any).choGvSua === true && b.n <= 25, `panel Báo PH: ${b.status} ${b.n} câu`);
      so.push(`panel Báo PH (Chờ GV sửa) ${b.n} câu ${b.dong} dòng`);
    }
  } finally {
    doQuet.ghi = null;
    for (const b of bp) conn.prepare('UPDATE viec_bao_ph SET tra_lai_id = NULL WHERE id = ?').run(b.id);
    if (ids.length) conn.prepare(`DELETE FROM vi_pham_tra_lai WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
  }
  console.log(`      (đo: ${ids.length} yêu cầu · ${bp.length} Báo PH chờ — ${so.join(' · ')})`);
  const loi: string[] = [];
  const cau = [...new Map(ghi.filter((g) => /FROM vi_pham_tra_lai t/.test(g.sql)).map((g) => [g.sql, g])).values()];
  assert(cau.length >= 1, `không bắt được câu trả lại (${cau.length})`);
  for (const { sql, args } of cau) {
    const plan = (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[]).map((r) => r.detail as string);
    if (plan.some((d) => /^SCAN (t|vi_pham_tra_lai)$/.test(d))) loi.push(plan.join(' | '));
  }
  assert(!loi.length, loi.join(' ‖ '));
});

/*
 * AU-2111 P1-01: TVV (vai không có khu Công việc) mở / cập nhật MỘT việc Vận hành được giao — cổng thêm `coQuyenTheoViec` (chỉ vai thiếu `work.view`, chỉ đường
 * `/mgmt-tasks/:id`). Trước: 403 ở cổng. Việc tạo ở chi nhánh của TVV (1 việc con, 1 người theo dõi), xoá ngay sau đo — không lẫn băm / trần khác.
 */
await checkAsync(`AU-2111 P1-01 · TVV mở việc Vận hành được giao: GET /mgmt-tasks/:id ≤ ${TRAN_VH_DUOC_GIAO.cau} câu · ≤ ${TRAN_VH_DUOC_GIAO.dong} dòng; vai có khu Công việc không thêm câu ở cổng`, async () => {
  const mg = await import('../worklist/mgmttasks.ts');
  const gvSvc = await import('../worklist/giaoViec.ts');
  const cnTvv = (conn.prepare(`SELECT ur.branch_id AS b FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.key = 'consultant' AND ur.status = 'active'`).get(USER.TVV) as any).b as number;
  const qt = loadPrincipal(USER.QT);
  const v = mg.createMgmtTask(qt, { title: 'Đo AU-2111 việc TVV', branchId: cnTvv, assigneeUserId: USER.TVV, theoDoiIds: [USER.QT], due: demoToday15d() } as any);
  const con = mg.createMgmtTask(qt, { title: 'Đo AU-2111 việc con', parentTaskId: v.id, assigneeUserId: USER.TVV, due: demoToday15d() } as any);
  try {
    const d = await doSql('TVV', 'GET', `/mgmt-tasks/${v.id}`);
    const q = await doSql('QT', 'GET', `/mgmt-tasks/${v.id}`);
    console.log(`      (đo: TVV ${d.status} ${d.n} câu ${d.dong} dòng · QT ${q.status} ${q.n} câu ${q.dong} dòng)`);
    assert(d.status === 200 && q.status === 200, `TVV ${d.status} · QT ${q.status}`);
    assert(d.n <= TRAN_VH_DUOC_GIAO.cau && d.dong <= TRAN_VH_DUOC_GIAO.dong, `TVV: ${d.n} câu ${d.dong} dòng > trần ${TRAN_VH_DUOC_GIAO.cau} · ${TRAN_VH_DUOC_GIAO.dong}`);
    assert(d.n <= q.n + 4, `cổng thêm quá 4 câu cho TVV: TVV ${d.n} · QT ${q.n}`);
  } finally {
    gvSvc.donViec('van_hanh', [v.id, con.id]);
    conn.prepare('DELETE FROM tasks WHERE id IN (?, ?)').run(con.id, v.id);
  }
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
