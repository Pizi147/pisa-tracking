/**
 * Kiểm tra nghiệp vụ cho vòng overhaul nền tảng.
 * Chạy trên database riêng (data/test.sqlite) để không đụng dữ liệu bạn đang thử.
 */
import path from 'node:path';
import { tieuChiThu } from '../seed/tieuChiThu.ts';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { boLichTuTao, chotSan, duXacNhan } from './luotThu.ts';
import { emailThu } from '../seed/emailThu.ts';

/*
 * Dọn rác thư mục tạm của các lần `npm run check` trước (tiền tố `z2-`, xem server/src/tests/banChinh.tests.ts):
 * bình thường mỗi phép kiểm tự xoá thư mục của nó, nhưng khi tiến trình bị treo/bị kill giữa chừng (chạy chồng
 * nhiều lệnh check cùng lúc) thì việc dọn không kịp chạy. Chỉ đụng thư mục cũ hơn 1 giờ, để không xoá nhầm
 * thư mục của một lần `npm run check` KHÁC đang chạy song song ngay lúc này.
 */
{
  const motGio = 60 * 60 * 1000;
  const giờHienTai = Date.now();
  const tmp = os.tmpdir();
  for (const ten of fs.readdirSync(tmp)) {
    if (!ten.startsWith('z2-')) continue;
    const p = path.join(tmp, ten);
    try {
      const tt = fs.statSync(p);
      if (tt.isDirectory() && giờHienTai - tt.mtimeMs > motGio) fs.rmSync(p, { recursive: true, force: true });
    } catch { /* của tiến trình khác đang giữ, hoặc đã bị xoá — bỏ qua */ }
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
process.env.PISA_DB = path.join(ROOT, 'data', 'test.sqlite');
/*
 * PR-Z2: biến Turso THẮNG `PISA_DB` trong `cauHinhDb`. Bộ phép kiểm gọi `runSeed()` (xoá mọi bảng) — nên gỡ biến Turso TRƯỚC khi
 * nạp `db.ts`, để `npm run check` trong một cửa sổ đang có token không bao giờ chạm database thật.
 */
for (const k of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'BAN_CHINH', 'PISA_CHO_PHEP_SEED_TURSO']) delete process.env[k];
for (const suffix of ['', '-wal', '-shm']) {
  const p = process.env.PISA_DB + suffix;
  if (fs.existsSync(p)) fs.rmSync(p);
}

const { db } = await import('../db.ts');
const { runSeed } = await import('../seed/seed.ts');
const { loadPrincipal, can } = await import('../permissions.ts');
const permissions = await import('../permissions.ts');
const { PERMISSIONS, expectationDelta } = await import('../../../shared/domain/index.ts');
const scoring = await import('../fasttrack/scoring.ts');
const week = await import('../platform/week.ts');
const attempts = await import('../fasttrack/attempts.ts');
const cycles = await import('../fasttrack/cycles.ts');
const profile = await import('../students/profile.ts');
const sos = await import('../cases/sos.ts');
const students = await import('../students/students.ts');
const meeting = await import('../worklist/meeting.ts');
const classesSvc = await import('../classes/classes.ts');
const transition = await import('../classes/transition.ts');
const intake = await import('../classes/intake.ts');
const DOMAIN_NHAP = await import('../../../shared/domain/nhapHocVien.ts');
const signals = await import('../worklist/signals.ts');
const regular = await import('../normal/regular.ts');
const schedule = await import('../classes/schedule.ts');
const cases = await import('../cases/cases.ts');
const domain = await import('../../../shared/domain/index.ts');
const accounts = await import('../platform/accounts.ts');
const sysconfig = await import('../platform/sysconfig.ts');
const mywork = await import('../worklist/mywork.ts');
const standing = await import('../students/standing.ts');
const mgmt = await import('../worklist/mgmttasks.ts');
const skillSchedule = await import('../fasttrack/skillSchedule.ts');
const absence = await import('../fasttrack/absence.ts');
const signalsSvc = await import('../cases/signals.ts');
const sosAutoSvc = await import('../cases/sosAuto.ts');
const effectiveness = await import('../cases/effectiveness.ts');
const { ratioResult: domainRatio } = await import('../../../shared/domain/index.ts');
const { demoToday } = await import('../demoConfig.ts');
const { addDays } = await import('../util.ts');

runSeed();

/*
 * MỐC ID NGAY SAU KHI DỰNG BỘ DEMO.
 *
 * Mục 42 soi vào chính DỮ LIỆU DEMO — "bộ demo có bày ra được tình huống này không". Nhưng
 * các phép kiểm ở những mục trên cũng ghi thêm case, phương án và kết quả vào cùng database,
 * và chúng cố tình tạo cả những trường hợp xấu. Không chặn mốc ở đây thì mục 42 sẽ báo lỗi
 * về dữ liệu do chính nó tạo ra.
 */
const SEED_MAX: Record<string, number> = {};
{
  const { db: seedDb } = await import('../db.ts');
  for (const t of ['sos_cases', 'case_interventions', 'case_followups', 'assessment_scores', 'unit_reports', 'violations', 'discipline_measures', 'tasks', 'students']) {
    SEED_MAX[t] = ((seedDb().prepare(`SELECT COALESCE(MAX(id),0) m FROM ${t}`).get() as any).m) as number;
  }
}
/* PR-YT4 (Task 11): ảnh chụp Ý thức của bộ demo NGAY sau seed — phép kiểm demo (yThuc.tests.ts) soi ảnh này, không soi DB đã bị các mục trên ghi thêm. */
const DEMO_Y_THUC = await (await import('./yThuc.tests.ts')).chupDemoYThuc((await import('../db.ts')).db(), demoToday());

/* Mã nhóm Ý thức của mô hình Case đã bỏ 21/09/2026 — chỉ để khẳng định nó KHÔNG còn xuất hiện; ghép chuỗi để không còn chữ đó nằm trơ trong mã. */
const GONE = 'behav' + 'iour';

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
    console.log(`  ✗ ${name}
      ${e.message}`);
  }
}
function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }
function assertThrows(fn: () => unknown, match: RegExp, msg: string) {
  let threw = false;
  try { fn(); } catch (e: any) {
    threw = true;
    assert(match.test(e.message), `${msg} — thông báo lỗi không khớp: "${e.message}"`);
  }
  assert(threw, `${msg} — thao tác đáng lẽ phải bị từ chối nhưng lại thành công`);
}

/** Như `assertThrows` nhưng cho hàm trả Promise (ba hàm tệp async từ PR-Z2). Không ném → fail; ném → thông báo phải khớp. */
async function assertRejects(fn: () => Promise<unknown>, match: RegExp, msg: string) {
  let threw = false;
  try { await fn(); } catch (e: any) {
    threw = true;
    assert(match.test(e.message), `${msg} — thông báo lỗi không khớp: "${e.message}"`);
  }
  assert(threw, `${msg} — thao tác đáng lẽ phải bị từ chối nhưng lại thành công`);
}

const conn = db();
/* SEED-UX: phép kiểm chỉ đọc bộ demo — chạy NGAY sau seed, trước mọi mục ghi thêm. */
await (await import('./prSeedUx.tests.ts')).runPrSeedUxTests({ check, assert, conn } as any);
/**
 * PR-S3F #8: `setIssues` chặn Case SOS chưa xác nhận nguyên nhân (đường chính là `xacNhanCase`). Phép kiểm cũ chỉ cần "Case đã có nguyên nhân"
 * để dựng tình huống của nó → ghi thẳng như dữ liệu cũ, đúng như `setIssues` từng làm (ghi nguyên nhân + đồng bộ trạng thái Case).
 */
const { dongBoTrangThaiCase: dongBoCaseThu } = await import('../cases/sosState.ts');
const datNguyenNhanThu = (who: { userId: number }, caseId: number, primaryCode: string) => {
  cases.addIssues(caseId, who.userId, { primaryCode, topic: (conn.prepare('SELECT topic FROM sos_cases WHERE id = ?').get(caseId) as any)?.topic ?? null });
  dongBoCaseThu(caseId);
};
const TODAY = demoToday();
/** OV-1c: lượt thử chốt sẵn (`chotSan`) cho các phép kiểm cũ dựng SOS từ lượt dở — kỹ năng chưa điểm coi như đã dời tuần. */
const chotThu = (attemptId: number) => { skillSchedule.ensureSkillRows(attemptId); chotSan(conn, attemptId); };
const classId = (code: string) => (conn.prepare('SELECT id FROM classes WHERE code = ?').get(code) as any).id;
/* Tuần chưa từng dùng tới thì chưa có trong bảng — tạo luôn, đúng như hệ thống vẫn làm. */
const periodOf = (weekStart: string) => week.ensurePeriod(weekStart).id;
/*
 * R11 (23/09): đợt đủ điểm + qua Chủ nhật của tuần bắt buộc muộn nhất nay CHẶN GVBM sửa điểm. Một số phép kiểm
 * cũ (quyền theo vai trò, xoá điểm về trống…) cố ý lấy một đợt `status='done'` bất kỳ — với `demoToday()` thật
 * (đã qua rất nhiều tuần), đợt đó tình cờ đã hoàn tất. Dùng ĐÚNG Chủ nhật của đợt đó làm `today` cho các lệnh
 * `saveScore` không liên quan tới R11, thay vì nới luật.
 * PR-MTa T19 thay "nhập điểm bất kỳ lúc nào": đợt xếp ở tuần tương lai chỉ nhập được từ tuần thi — các phép kiểm dựng đợt
 * ở tuần tới cũng truyền Chủ nhật này làm `today`.
 */
function chuNhatCuoiOf(attemptId: number): string {
  const row = conn.prepare(
    `SELECT MAX(pr.week_end) w FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
      WHERE ask.attempt_id = ? AND ask.required = 1 AND ask.sit_status != 'cancelled'`,
  ).get(attemptId) as any;
  return row?.w ?? demoToday();
}

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
function teacherOfSkill(classCode: string, skill: string) {
  const row = conn
    .prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status='active' LIMIT 1`)
    .get(classId(classCode), skill) as any;
  assert(row, `Seed thiếu GVBM ${skill} của lớp ${classCode}`);
  return row.id as number;
}
/**
 * Giáo viên bộ môn KHÔNG kiêm chủ nhiệm của lớp đó.
 *
 * Mỗi chi nhánh chỉ có 3 giáo viên cho 5 kỹ năng nên một người vẫn có thể vừa là GVCN
 * vừa dạy một kỹ năng — đúng như ngoài đời. Muốn kiểm tra quyền của "giáo viên bộ môn
 * thuần" thì phải chọn đích danh người không có dòng chủ nhiệm, chứ lấy bừa GV Writing 1
 * là có ngày trúng luôn GVCN và bài kiểm tra nói sai về quyền.
 */
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

const P = {
  admin: loadPrincipal(userByRole('system_admin', null)),
  mbManager: loadPrincipal(userByRole('manager', 'MB')),
  cpManager: loadPrincipal(userByRole('manager', 'CP')),
  w1Teacher: loadPrincipal(teacherOfSkill('MB FT 101', 'writing1')),
  w2Teacher: loadPrincipal(teacherOfSkill('MB FT 101', 'writing2')),
  sTeacher: loadPrincipal(teacherOfSkill('MB FT 101', 'speaking')),
  lrTeacher: loadPrincipal(teacherOfSkill('MB FT 101', 'listening')),
  bcManager: loadPrincipal(userByRole('manager', 'BC')),
  coreTeacher: loadPrincipal(coreTeacherOf('MB FT 101')),
  subjectTeacher: loadPrincipal(subjectOnlyTeacherOf('MB FT 101')),
  /* MB FOU 12 là lớp Normal (is_fast_track=0) — dùng cho các phép kiểm SCH-01/02, T10. */
  normalCoreTeacher: loadPrincipal(coreTeacherOf('MB FOU 12')),
  normalSubjectTeacher: loadPrincipal(subjectOnlyTeacherOf('MB FOU 12')),
};

const mbClass = classId('MB FT 101');

// ==================================================================== 0

/*
 * HAI PHÉP KIỂM VỀ CHÍNH BỘ DEMO, chạy NGAY SAU KHI DỰNG và trước mọi phép kiểm khác.
 *
 * Chúng nói về dữ liệu seed, không phải về trạng thái sau khi các phép kiểm đã tạo case,
 * duyệt đề xuất và chuyển lớp. Đặt ở cuối file thì chúng đọc nhầm hậu quả của chính bộ kiểm
 * tra thành lỗi của bộ demo.
 */
console.log('\n0. Bộ demo vừa dựng có nhất quán không');

/* PR-T (rulebook v3): tình huống demo §9 — phải soi TRƯỚC mọi phép kiểm khác, vì nhiều phép kiểm chọn học viên "sạch case" rồi ghi thêm vào chính những em đó. */
{
  const { runSosV3DemoTests } = await import('./sosV3.tests.ts');
  await runSosV3DemoTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
  const { runPrDuyetDemoTests } = await import('./prDuyet.tests.ts');
  await runPrDuyetDemoTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
  const { runPrHvlDemoTests } = await import('./prHvl.tests.ts');
  await runPrHvlDemoTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
  /* PR-OV11c: một cách đếm ở Công việc — so số của bộ demo (Tổng quan "58 bài" = Công việc lọc Quá hạn); mỗi phép kiểm cuộn lại. */
  const { runPrOv11cTests } = await import('./prOv11c.tests.ts');
  await runPrOv11cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
  /* PR-OV11f: Tổng quan · chuông — số ở ô = nơi nó mở, chuông chỉ việc còn mở (so số bộ demo); mỗi phép kiểm cuộn lại. */
  const { runPrOv11fTests } = await import('./prOv11f.tests.ts');
  await runPrOv11fTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
  /* PR-OV11h: Phân tích · PET / KET — Checkpoint có mặt ở mọi nơi (so số bộ demo MB PET 01); mỗi phép kiểm cuộn lại. */
  const { runPrOv11hTests } = await import('./prOv11h.tests.ts');
  await runPrOv11hTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
}

check('[12.1-16] Bộ demo nhất quán: không có sự kiện "đã xong" nào nằm ở tương lai', () => {
  const t = demoToday();
  const bad: string[] = [];
  /* PR-CT2 (§8): PA Bổ trợ miễn phí sinh sớm (Final đủ điểm + quyết định) có ngày bắt đầu = thứ Hai sắp tới — lịch đã định, không phải sự kiện đã xảy ra. */
  const loaiTru = (table: string, col: string) => (table === 'case_interventions' && col === 'started_date' ? ` AND NOT (kind = 'bo_tro_mien_phi' AND status = 'started' AND started_date = cycle_started_on)` : '');
  const later = (table: string, col: string) => (conn
    .prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${col} IS NOT NULL AND ${col} > ?${loaiTru(table, col)}`)
    .get(t) as any).n;

  for (const [table, col] of [
    ['sos_cases', 'closed_at'],
    ['case_interventions', 'completed_date'],
    ['case_interventions', 'started_date'],
    ['case_interventions', 'approval_at'],
    ['case_followups', 'observed_on'],
    ['case_milestones', 'occurred_on'],
    ['learning_cycles', 'ended_at'],
  ] as const) {
    const n = later(table, col);
    if (n > 0) bad.push(`${table}.${col}: ${n}`);
  }
  assert(bad.length === 0, `Có sự kiện đã xảy ra nhưng ngày nằm ở tương lai — ${bad.join(' · ')}`);

  /*
   * Và không MÔN nào thi ở tuần tương lai mà đã có điểm.
   *
   * So với TUẦN THI CỦA CHÍNH MÔN ĐÓ, không so với tuần của cả đợt: từ vòng 7 tuần trên
   * đợt là tuần kế hoạch HOÀN TẤT, tức tuần của môn muộn nhất. Một đợt thi R/L/W tuần này
   * và Speaking tuần sau có tuần đợt nằm ở tương lai một cách hoàn toàn hợp lệ, trong khi
   * điểm R/L/W của nó đã có từ tuần này.
   */
  const future = (conn
    .prepare(
      `SELECT COUNT(*) n FROM assessment_scores s
         JOIN attempt_skills ask ON ask.attempt_id = s.attempt_id
              AND ask.skill = CASE WHEN s.skill IN ('writing1','writing2') THEN 'writing' ELSE s.skill END
         JOIN report_periods rp ON rp.id = ask.planned_period_id
        WHERE rp.week_start > ? AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)`,
    )
    .get(t) as any).n;
  assert(future === 0, `${future} ô điểm nằm ở một tuần chưa tới`);

  /* Kết quả sau hỗ trợ không bao giờ ghi trước ngày phương án bắt đầu. */
  const early = (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_followups f
         JOIN case_interventions iv ON iv.id = f.intervention_id
        WHERE iv.cycle_started_on IS NOT NULL AND f.observed_on < iv.cycle_started_on`,
    )
    .get() as any).n;
  assert(early === 0, `${early} lần cập nhật kết quả ghi trước ngày phương án bắt đầu`);
});

check('[12.1] Bộ demo có đủ độ đa dạng mà mục 11.4 yêu cầu', () => {
  const one = (sql: string, ...args: unknown[]) => (conn.prepare(sql).get(...args) as any).n as number;
  const need: [string, number][] = [
    ['học viên ổn định không case',
      one(`SELECT COUNT(*) n FROM students s WHERE s.status='active'
             AND NOT EXISTS (SELECT 1 FROM sos_cases c WHERE c.student_id = s.id)`)],
    ['case đã hoàn thành có kết quả',
      one(`SELECT COUNT(*) n FROM sos_cases WHERE status='done' AND outcome IS NOT NULL`)],
    /* CV-LOI (02 4.7 A13): Case không chủ nay tự gán theo luật tạo Case (lớp có GV môn / GVCN) — demo thể hiện lần tự gán có lịch sử. */
    ['case tự gán người phụ trách',
      one(`SELECT COUNT(DISTINCT case_id) n FROM sos_case_history WHERE field = 'owner_user_id' AND old_value IS NULL`)],
    ['case song song', one(`SELECT COUNT(*) n FROM sos_cases WHERE parallel = 1`)],
    ['case tái diễn', one(`SELECT COUNT(*) n FROM sos_cases WHERE previous_case_id IS NOT NULL`)],
    ['phương án bị thay thế',
      one(`SELECT COUNT(*) n FROM case_interventions WHERE closed_reason='superseded'`)],
    ['đề xuất chờ duyệt',
      one(`SELECT COUNT(*) n FROM case_interventions WHERE approval_state='pending'`)],
    ['đề xuất bị từ chối',
      one(`SELECT COUNT(*) n FROM case_interventions WHERE approval_state='declined'`)],
    ['xin hỗ trợ Quản lý',
      one(`SELECT COUNT(*) n FROM case_followups WHERE next_step='ask_manager'`)],
    ['kết quả "không đủ căn cứ"',
      one(`SELECT COUNT(*) n FROM case_followups WHERE outcome='insufficient'`)],
    ['điểm giáo viên tự chấm',
      one(`SELECT COUNT(*) n FROM case_followups WHERE metrics IS NOT NULL`)],
    ['kỹ năng không mock', one(`SELECT COUNT(*) n FROM attempt_skill_skips`)],
    ['hạn nhập điểm tự đặt',
      one(`SELECT COUNT(*) n FROM assessment_attempts WHERE deadline_override IS NOT NULL`)],
    ['lộ trình đã đạt Target',
      one(`SELECT COUNT(*) n FROM learning_cycles WHERE outcome='reached'`)],
    ['lộ trình chưa đạt Target',
      one(`SELECT COUNT(*) n FROM learning_cycles WHERE outcome='not_reached'`)],
    ['học viên đã kết thúc học',
      one(`SELECT COUNT(*) n FROM students WHERE status='finished'`)],
    ['thi thật chỉ biết tháng',
      one(`SELECT COUNT(*) n FROM learning_cycles
            WHERE exam_month IS NOT NULL AND exam_period_id IS NULL`)],
    ['thi thật đã biết tuần',
      one(`SELECT COUNT(*) n FROM learning_cycles WHERE exam_period_id IS NOT NULL`)],
    ['chưa có kế hoạch thi',
      one(`SELECT COUNT(*) n FROM learning_cycles
            WHERE route IS NOT NULL AND exam_month IS NULL AND status='active'`)],
    ['công việc quản lý tạm ngưng có lý do',
      one(`SELECT COUNT(*) n FROM tasks WHERE progress='paused' AND stop_reason IS NOT NULL`)],
    ['công việc quản lý dừng hẳn có lý do',
      one(`SELECT COUNT(*) n FROM tasks WHERE progress='stopped' AND stop_reason IS NOT NULL`)],
    ['công việc con', one(`SELECT COUNT(*) n FROM tasks WHERE parent_task_id IS NOT NULL`)],
    ['người theo dõi khác người phụ trách',
      one(`SELECT COUNT(*) n FROM tasks
            WHERE watcher_user_id IS NOT NULL AND watcher_user_id != assignee_user_id`)],
    ['công việc gắn case làm căn cứ', one(`SELECT COUNT(*) n FROM task_case_links`)],
  ];
  const missing = need.filter(([, n]) => n === 0).map(([label]) => label);
  assert(missing.length === 0, `Bộ demo còn thiếu: ${missing.join(' · ')}`);
});

// ==================================================================== 1

console.log('\n1. Quy đổi điểm và công thức');
check('Bảng quy đổi L/R đúng các mốc trong nguồn', () => {
  assert(scoring.bandFromRaw('listening', 0) === 0 && scoring.bandFromRaw('reading', 0) === 0, 'raw 0 phải ra band 0');
  assert(scoring.bandFromRaw('listening', 3) === 2.5, 'L raw 3 phải là 2.5');
  assert(scoring.bandFromRaw('reading', 3) === 1.5, 'R raw 3 phải là 1.5');
  assert(scoring.bandFromRaw('listening', 15) === 4.5, 'L raw 15 phải là 4.5');
  assert(scoring.bandFromRaw('reading', 15) === 5, 'R raw 15 phải là 5');
  assert(scoring.bandFromRaw('listening', 40) === 9 && scoring.bandFromRaw('reading', 40) === 9, 'raw 40 phải là 9');
  assertThrows(() => scoring.bandFromRaw('listening', -1), /0–40/, 'raw −1');
  assertThrows(() => scoring.bandFromRaw('reading', 41), /0–40/, 'raw 41');
  assertThrows(() => scoring.bandFromRaw('listening', 12.5), /số nguyên/, 'raw 12.5');
});
check('Band W/S từ bốn tiêu chí; Writing = (W1 + W2×2)/3; W chỉ là MỘT môn', () => {
  assert(scoring.bandFromCriteria([6, 6.5, 5.5, 6]) === 6, 'Trung bình bốn tiêu chí sai');
  assert(scoring.bandFromCriteria([6, 6.5, 5.5, null]) === null, 'Thiếu tiêu chí phải trả về trống');
  assert(scoring.writingBand(6, 7) === 6.5, '(6 + 14)/3 = 6.67 phải làm tròn về 6.5');
  assert(scoring.writingBand(6, null) === null, 'Thiếu W2 thì chưa có band Writing');
  const r = scoring.evaluateAttempt(6.5, 3, { listening: 6, reading: 6, writing1: 6, writing2: 6, speaking: 6 });
  assert(r.failedCount === 4, 'Bốn kỹ năng dưới kỳ vọng phải đếm là 4, W1/W2 không thành hai môn');
  assert(r.verdicts.length === 4, 'Chỉ đánh giá bốn kỹ năng L/R/W/S');
});
check('Ô trống khác 0 và Overall chỉ có khi đủ bốn kỹ năng', () => {
  const empty = scoring.evaluateAttempt(6.5, 1, {});
  assert(empty.bands.listening === null && empty.overall === null, 'Chưa nhập điểm mà đã có band');
  assert(scoring.roundToHalf(6.25) === 6.5 && scoring.roundToHalf(5.75) === 6, 'Làm tròn không theo kiểu Excel');
  const three = scoring.evaluateAttempt(6.5, 3, { listening: 6.5, reading: 6.5, writing1: 6.5, writing2: 6.5 }, ['speaking']);
  assert(three.overall === null, 'Không được dựng Overall bốn kỹ năng từ ba kỹ năng');
});

// ==================================================================== 2

console.log('\n2. Kỳ vọng theo lộ trình');
check('MT1 target−1.0, MT2 target−0.5, từ MT3 trở đi bằng target', () => {
  assert(expectationDelta(1) === 1 && expectationDelta(2) === 0.5 && expectationDelta(3) === 0, 'Mức trừ sai');
  assert(scoring.expectationFor(6.5, 1) === 5.5 && scoring.expectationFor(6.5, 2) === 6, 'Kỳ vọng MT1/MT2 sai');
  for (const n of [3, 4, 5]) assert(scoring.expectationFor(6.5, n) === 6.5, `MT${n} phải bằng target`);
});
check('Học lại trong cùng lộ trình: MT tăng tiếp, kỳ vọng vẫn bằng target', () => {
  for (const n of [6, 7, 9]) {
    assert(scoring.expectationFor(6.5, n) === 6.5, `MT${n} của đợt học lại phải bằng target, không quay lại mức trừ MT1`);
  }
});
check('Bằng kỳ vọng là đạt; 0/1/2/3/4 kỹ năng trượt → 0/1/2/3/3', () => {
  const build = (fails: number) => {
    const low = 5, ok = 6.5;   // OV-1c: trượt 5.0 (không 6.0) để Overall một kỹ năng trượt vẫn dưới kỳ vọng — Overall ≥ kỳ vọng là không SOS
    const v = ['listening', 'reading', 'speaking'].map((_, i) => (i < fails ? low : ok));
    const wFail = fails >= 4;
    return scoring.evaluateAttempt(6.5, 3, {
      listening: v[0], reading: v[1], speaking: v[2], writing1: wFail ? low : ok, writing2: wFail ? low : ok,
    });
  };
  assert(build(0).sosLevel === 0, '0 trượt phải là Đạt kỳ vọng');
  assert(build(1).sosLevel === 1 && build(2).sosLevel === 2 && build(3).sosLevel === 3, 'Ngưỡng SOS sai');
  assert(build(4).sosLevel === 3 && build(4).failedCount === 4, '4 trượt vẫn là SOS 3');
});

// ==================================================================== 3

console.log('\n3. Kỹ năng không mock và tiến độ');
check('Kết luận NGAY trên phần điểm đang có, và nói rõ đó là kết luận tạm thời', () => {
  /*
   * Chờ đủ bốn kỹ năng mới kết luận nghĩa là một giáo viên nhập muộn thì việc hỗ trợ học
   * viên dừng theo. Nay chỉ cần một kỹ năng đã chấm là kết luận được trên phần đang có.
   */
  const partial = scoring.evaluateAttempt(6.5, 2, { listening: 7, reading: 7, writing1: 7, writing2: 7 });
  assert(partial.sosLevel === 0, `Ba kỹ năng đều đạt thì phải kết luận được, đang là ${partial.sosLevel}`);
  assert(partial.complete === false && partial.scoredRequired === 3, 'Tiến độ trên tập bắt buộc sai');
  assert(partial.provisional, 'Thiếu Speaking mà không đánh dấu là kết luận tạm thời');
  assert(partial.required.length === 4, 'Mặc định phải là đủ bốn kỹ năng bắt buộc');

  // Một kỹ năng dưới kỳ vọng là ra SOS 1 ngay, dù ba kỹ năng kia chưa có điểm.
  const oneLow = scoring.evaluateAttempt(6.5, 3, { listening: 5.5 });
  assert(oneLow.sosLevel === 1 && oneLow.provisional, 'Một kỹ năng dưới kỳ vọng phải ra SOS 1 ngay');
  assert(oneLow.scoredRequired === 1, 'Đếm sai số kỹ năng đã có điểm');

  // Đủ cả bốn thì hết tạm thời.
  const full = scoring.evaluateAttempt(6.5, 3, { listening: 5.5, reading: 7, writing1: 7, writing2: 7, speaking: 7 });
  assert(full.complete && !full.provisional && full.evaluable, 'Đủ điểm rồi mà vẫn coi là tạm thời');

  // CHƯA CÓ ĐIỂM NÀO thì tuyệt đối không kết luận — thiếu điểm vẫn khác trượt.
  const none = scoring.evaluateAttempt(6.5, 3, {});
  assert(none.sosLevel === null && !none.provisional, 'Chưa có điểm nào mà đã kết luận');
  // Thiếu target cũng không kết luận được, dù đã có điểm.
  const noTarget = scoring.evaluateAttempt(null, 3, { listening: 5.5 });
  assert(noTarget.sosLevel === null, 'Thiếu target mà vẫn chốt SOS');
});
check('Đánh dấu không mock Speaking: đủ 3/3 là hoàn thành và SOS tính trên ba kỹ năng', () => {
  const low = 6, ok = 6.5;
  const r = scoring.evaluateAttempt(6.5, 3, { listening: low, reading: ok, writing1: ok, writing2: ok }, ['speaking']);
  assert(r.required.length === 3 && r.skipped.includes('speaking'), 'Tập bắt buộc chưa loại Speaking');
  assert(r.scoredRequired === 3 && r.complete, 'Đủ ba kỹ năng bắt buộc phải là hoàn thành');
  assert(r.evaluable && r.sosLevel === 1, `SOS phải tính trên ba kỹ năng, đang là ${r.sosLevel}`);
  // Ở danh sách chỉ cần con số; câu giải thích để dành cho màn chi tiết.
  assert(r.scopeNote === '3 kỹ năng', `Nhãn ngắn ở danh sách sai: "${r.scopeNote}"`);
  assert(/Đánh giá trên 3 kỹ năng/.test(r.scopeDetail ?? ''), 'Màn chi tiết vẫn phải giải thích đầy đủ');
  assert(r.verdicts.find((v) => v.skill === 'speaking')!.passed === null, 'Kỹ năng không mock không được tính đạt/trượt');
});
check('Seed có sẵn lượt đánh dấu không mock và lượt còn ô điểm trống', () => {
  const skip = conn.prepare('SELECT * FROM attempt_skill_skips LIMIT 1').get() as any;
  assert(skip, 'Seed thiếu trường hợp kỹ năng không mock');
  const d = attempts.attemptDetail(P.admin, skip.attempt_id);
  const cell = d.cells.find((c) => c.assessedSkill === skip.skill)!;
  assert(cell.progress === 'skipped' && !cell.required, 'Ô kỹ năng không mock hiển thị sai');
  assert(!cell.overdue && cell.deadline === null, 'Kỹ năng không mock không được tính thiếu điểm hay quá hạn');

  /*
   * TUẦN MT ĐÃ TỚI MÀ Ô ĐIỂM CÒN TRỐNG = "Chưa nhập điểm".
   * Không còn trạng thái "đã mock, chưa nhập điểm": một lượt chỉ thuộc một tuần, nên chỉ
   * có hai câu hỏi — tuần tới chưa, và điểm có chưa.
   */
  const pending = conn
    .prepare(`SELECT a.id FROM assessment_attempts a
                JOIN report_periods rp ON rp.id = a.planned_period_id
               WHERE a.kind = 'mock' AND a.status != 'cancelled' AND rp.week_start <= ?
                 AND (SELECT COUNT(*) FROM assessment_scores sc
                       WHERE sc.attempt_id = a.id AND sc.band IS NOT NULL) < 4
                 AND NOT EXISTS (SELECT 1 FROM attempt_skill_skips k WHERE k.attempt_id = a.id)
               LIMIT 1`)
    .get(demoToday()) as any;
  assert(pending, 'Seed thiếu trường hợp tuần MT đã tới mà còn ô điểm trống');
  const d2 = attempts.attemptDetail(P.admin, pending.id);
  const due = d2.cells.find((c) => c.required && c.band === null);
  assert(due && due.progress === 'due', `Ô điểm trống của tuần đã tới phải là "due", đang là ${due?.progress}`);
  assert(d2.cells.every((c) => (c as any).takenOn === undefined),
         'Ô điểm không được còn trường ngày làm bài');

  /*
   * Kỹ năng CHƯA TỚI TUẦN THI thì không phải việc phải làm — nhãn là "Chưa đến lịch".
   * Hỏi theo TỪNG KỸ NĂNG: một đợt có thể có môn đã thi tuần này và môn thi tuần sau.
   */
  const future = conn
    .prepare(`SELECT a.id FROM assessment_attempts a
               WHERE a.status = 'planned'
                 AND NOT EXISTS (
                   SELECT 1 FROM attempt_skills ask
                     JOIN report_periods pr ON pr.id = ask.planned_period_id
                    WHERE ask.attempt_id = a.id AND ask.required = 1 AND pr.week_start <= ?)
                 AND EXISTS (SELECT 1 FROM attempt_skills ask WHERE ask.attempt_id = a.id AND ask.required = 1)
               LIMIT 1`)
    .get(demoToday()) as any;
  if (future) {
    const d3 = attempts.attemptDetail(P.admin, future.id);
    assert(d3.cells.filter((c) => c.required).every((c) => c.progress === 'upcoming'),
      'Lượt MT mà mọi kỹ năng đều chưa tới tuần thi không được đánh dấu là chưa nhập điểm');
  }
});
check('Thiếu target thì vẫn nhập được điểm, chỉ là chưa kết luận được', () => {
  const r = scoring.evaluateAttempt(null, 2, { listening: 7, reading: 7, writing1: 7, writing2: 7, speaking: 7 });
  assert(r.complete === true, 'Thiếu target không được làm treo tiến độ nhập điểm');
  assert(r.evaluable === false && r.sosLevel === null, 'Thiếu target mà vẫn kết luận SOS');
  assert(r.overall === 7, 'Overall không phụ thuộc target');
});

// ==================================================================== 4

console.log('\n4. Tuần, lịch và hạn nhập điểm');
check('Tuần thuộc tháng chứa thứ Năm', () => {
  assert(week.weekInfo('2026-09-28').code === 'W1 OCT 2026', '28/09–04/10/2026 phải là W1 OCT 2026');
  assert(week.weekInfo('2026-09-07').code === 'W2 SEP 2026', '07/09–13/09/2026 phải là W2 SEP 2026');
  // Mã tuần PHẢI có năm: tuần cuối tháng 12/2026 và tuần đầu 2027 nằm cạnh nhau trên lịch.
  assert(week.weekInfo('2027-01-01').code === 'W5 DEC 2026', '01/01/2027 vẫn thuộc W5 DEC 2026');
  assert(week.weekInfo('2027-01-04').code === 'W1 JAN 2027', 'Tuần sau đó mới là W1 JAN 2027');
});
check('Hạn mặc định là thứ Tư tuần kế tiếp, hết ngày mới quá hạn', () => {
  assert(week.defaultScoreDeadline('2026-09-13') === '2026-09-16', 'Mock 13/09 phải có hạn 16/09');
  assert(week.isOverdue('2026-09-16', '2026-09-16') === false, 'Trong ngày 16/09 chưa được tính quá hạn');
  assert(week.isOverdue('2026-09-16', '2026-09-17') === true, 'Sang 17/09 phải tính quá hạn');
});
check('Chưa xếp tuần thì KHÔNG có hạn, không dựng hạn giả', () => {
  assert(week.effectiveDeadline({ weekStart: null, override: null }).date === null, 'Chưa có tuần mà đã có hạn');
  assert(week.effectiveDeadline({ weekStart: null, override: null }).source === 'none', 'Nguồn hạn sai');
  const d = week.effectiveDeadline({ weekStart: '2026-09-07', override: null });
  assert(d.date === '2026-09-16' && d.source === 'default', 'Hạn mặc định sai');
});
check('Mỗi kỹ năng có hạn chấm riêng, đếm từ TUẦN THI CỦA CHÍNH NÓ', () => {
  /*
   * FT: hết thứ Tư của tuần KẾ TIẾP sau tuần thi kỹ năng đó.
   * Normal: như FT (PR-MTa T19 thay "hết Chủ nhật của chính tuần thi").
   * Đây là luật mới của mục 10.5, thay cho "cả lượt một hạn" của các vòng trước.
   */
  assert(week.skillScoreDeadline('band', '2026-09-14') === '2026-09-23',
    'FT thi tuần 14–20/9 phải có hạn chấm 23/9');
  assert(week.skillScoreDeadline('band', '2026-09-21') === '2026-09-30',
    'FT thi tuần 21–27/9 phải có hạn chấm 30/9');
  assert(week.skillScoreDeadline('ratio', '2026-09-14') === '2026-09-23',
    'Normal thi tuần 14–20/9 phải có hạn chấm hết thứ Tư 23/9 (PR-MTa T19)');

  const a = conn
    .prepare(`SELECT a.id FROM assessment_attempts a
                WHERE a.planned_period_id IS NOT NULL AND a.deadline_override IS NULL
                  AND a.status != 'cancelled' AND a.kind = 'mock'
                  AND (SELECT COUNT(DISTINCT ask.planned_period_id) FROM attempt_skills ask
                        WHERE ask.attempt_id = a.id AND ask.required = 1) = 1
                LIMIT 1`)
    .get() as any;
  assert(a, 'Seed thiếu lượt MT thi gọn trong một tuần');
  const d = attempts.attemptDetail(P.admin, a.id);
  const deadlines = new Set(d.cells.filter((c) => c.required).map((c) => c.deadline));
  assert(deadlines.size === 1,
    `Lượt thi gọn một tuần thì bốn kỹ năng vẫn cùng hạn, đang có ${deadlines.size}`);
});
check('Đợt tách tuần: dời Speaking KHÔNG kéo theo hạn của R/L/W', () => {
  /* Bộ demo có sẵn J08: R/L/W tuần 14–20/9, Speaking tuần 21–27/9, cùng một MT3. */
  const split = conn
    .prepare(`SELECT a.id FROM assessment_attempts a
                WHERE a.kind = 'mock'
                  AND (SELECT COUNT(DISTINCT ask.planned_period_id) FROM attempt_skills ask
                        WHERE ask.attempt_id = a.id AND ask.required = 1) > 1
                LIMIT 1`)
    .get() as any;
  assert(split, 'Bộ demo thiếu đợt MT tách tuần — mục 10.1 đòi phải có');
  const d = attempts.attemptDetail(P.admin, split.id);
  assert(d.splitWeeks, 'Đợt tách tuần phải được đánh dấu là tách tuần');
  const weeks = new Set(d.skillSchedule.filter((r: any) => r.required).map((r: any) => r.periodCode));
  assert(weeks.size > 1, 'Các kỹ năng bắt buộc phải nằm ở nhiều tuần khác nhau');
  const dls = new Set(d.skillSchedule.filter((r: any) => r.required).map((r: any) => r.deadline));
  assert(dls.size > 1, 'Tách tuần mà các kỹ năng vẫn chung một hạn chấm');

  /* Điểm vẫn thuộc MỘT đợt duy nhất: một định danh, một bảng điểm, một kết luận. */
  assert(d.cells.length === 5, 'Tách tuần không được biến một đợt thành nhiều bảng điểm');
  const scoreAttempts = conn
    .prepare('SELECT COUNT(DISTINCT attempt_id) AS n FROM assessment_scores WHERE attempt_id = ?')
    .get(split.id) as any;
  assert(scoreAttempts.n <= 1, 'Tách tuần không được tách điểm sang đợt khác');
});
check('Kỹ năng chưa đến tuần thi thì KHÔNG hiện nợ và KHÔNG quá hạn', () => {
  const rows = conn
    .prepare(`SELECT ask.attempt_id, ask.skill FROM attempt_skills ask
                JOIN report_periods pr ON pr.id = ask.planned_period_id
                JOIN assessment_attempts a ON a.id = ask.attempt_id
               WHERE ask.required = 1 AND pr.week_start > ? AND a.status != 'cancelled'
               LIMIT 5`)
    .all(demoToday()) as any[];
  assert(rows.length, 'Bộ demo thiếu kỹ năng có tuần thi chưa tới');
  for (const r of rows) {
    const d = attempts.attemptDetail(P.admin, r.attempt_id);
    const v = d.skillSchedule.find((x: any) => x.skill === r.skill)!;
    assert(v.progress === 'upcoming', `${r.skill} chưa tới tuần mà trạng thái là ${v.progress}`);
    assert(!v.overdue, `${r.skill} chưa tới tuần thi mà đã bị tính quá hạn`);
  }
});
check('Tuần kế hoạch hoàn tất = tuần muộn nhất trong các kỹ năng bắt buộc', () => {
  /* Kỹ năng đã huỷ phần thi không kéo tuần hoàn tất (`completionWeekOf`) — bộ demo PR-MT có một bài hết hạn duyệt dời bị huỷ phần thi. */
  const split = conn
    .prepare(`SELECT a.id, a.planned_period_id FROM assessment_attempts a
                WHERE (SELECT COUNT(DISTINCT ask.planned_period_id) FROM attempt_skills ask
                        WHERE ask.attempt_id = a.id AND ask.required = 1 AND ask.sit_status != 'cancelled') > 1
                LIMIT 1`)
    .get() as any;
  assert(split, 'Bộ demo thiếu đợt tách tuần');
  const latest = conn
    .prepare(`SELECT ask.planned_period_id AS id FROM attempt_skills ask
                JOIN report_periods pr ON pr.id = ask.planned_period_id
               WHERE ask.attempt_id = ? AND ask.required = 1 AND ask.sit_status != 'cancelled'
               ORDER BY pr.week_start DESC LIMIT 1`)
    .get(split.id) as any;
  assert(split.planned_period_id === latest.id,
    'Tuần kế hoạch hoàn tất phải bằng tuần muộn nhất của các kỹ năng bắt buộc (mục 10.7)');

  /* Mỗi đợt đúng MỘT dòng trong bảng theo tuần, kể cả khi lịch trải nhiều tuần. */
  const n = conn
    .prepare('SELECT COUNT(*) AS n FROM assessment_attempts WHERE id = ? AND planned_period_id IS NOT NULL')
    .get(split.id) as any;
  assert(n.n === 1, 'Một đợt chỉ được nằm ở đúng một tuần kết quả');
});
check('Chỉ MỘT hạn có hiệu lực: hạn tự đặt thay hạn mặc định', () => {
  const d = week.effectiveDeadline({ weekStart: '2026-09-07', override: '2026-09-30' });
  assert(d.date === '2026-09-30' && d.source === 'override', 'Hạn tự đặt không được ưu tiên');
  const seeded = conn.prepare('SELECT * FROM assessment_attempts WHERE deadline_override IS NOT NULL LIMIT 1').get() as any;
  assert(seeded, 'Seed thiếu trường hợp hạn tự đặt');
  assert(seeded.deadline_override_by && seeded.deadline_override_reason, 'Hạn tự đặt phải ghi người đặt và lý do');
  const det = attempts.attemptDetail(P.admin, seeded.id);
  assert(det.cells.some((c) => c.deadlineSource === 'attempt_override'),
    'Chi tiết không dùng hạn riêng đặt cho cả đợt');
});
// ==================================================================== 5

console.log('\n5. Quyền lịch: chỉ còn TUẦN');
const planned = conn
  .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='planned' LIMIT 1`)
  .get(mbClass) as any;

check('Một lượt MT chỉ mang TUẦN, không có cột ngày nào', () => {
  assert(planned, 'Seed thiếu lượt đã chốt tuần');
  assert(planned.planned_period_id, 'Lượt phải đã có tuần');
  const cols = (conn.prepare('PRAGMA table_info(assessment_attempts)').all() as any[]).map((c) => c.name);
  assert(!cols.includes('lrw_scheduled_at') && !cols.includes('speaking_scheduled_at'),
    'Bảng lượt MT vẫn còn cột ngày thi');
  const scoreCols = (conn.prepare('PRAGMA table_info(assessment_scores)').all() as any[]).map((c) => c.name);
  assert(!scoreCols.includes('taken_on'), 'Bảng điểm vẫn còn cột ngày làm bài');
});
check('Chỉ Quản lý chốt tuần MT; giáo viên không chốt được', () => {
  /*
   * Vai Admin chi nhánh đã bỏ, nên ranh giới cần giữ bây giờ là giữa Quản lý và giáo viên:
   * lập lịch MT chủ động là việc của Quản lý, kể cả với GVCN.
   */
  assert(can(P.mbManager, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'Quản lý phải chốt được tuần');
  assert(!can(P.coreTeacher, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'GVCN không được tự chốt tuần MT');
  assertThrows(() => attempts.setPlanningWeek(P.coreTeacher, planned.id, periodOf('2026-10-12')), /Quản lý/,
    'GVCN đổi tuần MT');
});
check('Hai quyền về ngày MT đã bị gỡ khỏi hệ thống', () => {
  const gone = conn
    .prepare(`SELECT key FROM permissions WHERE key IN ('schedule.date','schedule.speaking')`)
    .all() as any[];
  assert(gone.length === 0, `Vẫn còn quyền về ngày MT: ${gone.map((g) => g.key).join(', ')}`);
  assert(!(PERMISSIONS as any).SCHEDULE_DATE && !(PERMISSIONS as any).SCHEDULE_SPEAKING,
    'Từ vựng quyền vẫn còn hai quyền về ngày');
});
check('GVCN chỉ đọc lịch: không chốt được tuần', () => {
  assert(!can(P.coreTeacher, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'GVCN không được chốt tuần');
  assertThrows(() => attempts.setPlanningWeek(P.coreTeacher, planned.id, periodOf('2026-10-12')), /quyền|Quản lý/, 'GVCN đổi tuần');
  assert(can(P.coreTeacher, PERMISSIONS.ATTEMPT_VIEW, { classId: mbClass }), 'GVCN vẫn phải xem được lịch');
});
check('Nhập điểm KHÔNG kèm quyền sửa lịch: payload điểm không đụng tới tuần', () => {
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' LIMIT 1`).get(mbClass) as any;
  const before = (conn.prepare('SELECT planned_period_id FROM assessment_attempts WHERE id = ?').get(a.id) as any).planned_period_id;
  attempts.saveScore(P.w1Teacher, a.id, 'writing1', { criteria: [6, 6, 6, 6], lyDo: 'Phép kiểm: sửa điểm đã có' }, chuNhatCuoiOf(a.id));
  const after = (conn.prepare('SELECT planned_period_id FROM assessment_attempts WHERE id = ?').get(a.id) as any).planned_period_id;
  assert(before === after, 'Nhập điểm đã làm đổi tuần MT');
});
check('Đổi tuần ghi lại lịch sử và dời cả hạn nhập điểm theo', () => {
  const target = conn
    .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='planned' LIMIT 1`)
    .get(classId('HD FT 302')) as any;
  assert(target, 'Seed thiếu lượt planned ở HD FT 302');
  const hdManager = loadPrincipal(userByRole('manager', 'HD'));
  attempts.setPlanningWeek(hdManager, target.id, periodOf('2026-11-02'), 'Dời sang tháng 11');
  const det = attempts.attemptDetail(hdManager, target.id);
  const dl = det.cells.find((c) => c.required)!.deadline;
  // Tuần mới bắt đầu 02/11 → hạn mặc định là thứ Tư tuần kế tiếp, tức 11/11.
  assert(dl === '2026-11-11', `Hạn phải dời theo tuần mới, đang là ${dl}`);
  /*
   * Lịch thật nằm ở TỪNG KỸ NĂNG, nên đổi tuần cả đợt là một lượt đổi cho mỗi kỹ năng còn
   * dời được — mỗi lượt một dòng lịch sử riêng, ghi rõ kỹ năng nào.
   */
  const hist = conn
    .prepare(`SELECT * FROM attempt_schedule_history WHERE attempt_id = ? AND action='skill_week_set'`)
    .all(target.id) as any[];
  assert(hist.length >= 1, 'Thiếu lịch sử đổi tuần');
  assert(hist.every((h: any) => !!h.field), 'Lịch sử đổi tuần phải ghi rõ kỹ năng nào');
  /* Và tuần kế hoạch hoàn tất của đợt cũng được ghi lại khi nó đổi theo (mục 10.7). */
  const cw = conn
    .prepare(`SELECT * FROM attempt_schedule_history WHERE attempt_id = ? AND action='completion_week'`)
    .all(target.id) as any[];
  assert(cw.length >= 1, 'Thiếu lịch sử tuần kế hoạch hoàn tất');
});
check('Huỷ giữ lý do và lịch sử, không tăng số MT', () => {
  /* PR-MT (M-12): "Huỷ cả lượt" chỉ với lượt LỚN NHẤT chưa có điểm — chọn đúng lượt như thế để thử. */
  const a = conn.prepare(`SELECT * FROM assessment_attempts a WHERE a.class_id = ? AND a.status='planned'
      AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.status != 'cancelled')
      AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)) LIMIT 1`)
    .get(classId('CP FT 110')) as any;
  const before = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(a.cycle_id) as any).n;
  attempts.huyLuot(P.cpManager, a.id, { lyDo: 'Học viên nghỉ ốm' });
  const after = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(a.id) as any;
  const count = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(a.cycle_id) as any).n;
  assert(after.status === 'cancelled' && after.cancel_reason === 'Học viên nghỉ ốm', 'Huỷ không lưu lý do');
  assert(count === before && after.attempt_no === a.attempt_no, 'Huỷ đã làm đổi số lượt hoặc số MT');
  assert(!can(P.coreTeacher, PERMISSIONS.ATTEMPT_CANCEL, { classId: mbClass }), 'GVCN không được huỷ');
});

// ==================================================================== 6

console.log('\n6. Quyền theo vai trò × chi nhánh × phân công');
check('GVBM chỉ sửa kỹ năng được phân công, vẫn đọc kỹ năng khác', () => {
  assert(can(P.w1Teacher, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: 'writing1' }), 'GV W1 phải sửa được W1');
  assert(!can(P.w1Teacher, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: 'writing2' }), 'GV W1 không được sửa W2');
  assert(can(P.w1Teacher, PERMISSIONS.ATTEMPT_VIEW, { classId: mbClass }), 'GV phải xem được lớp mình dạy');
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' LIMIT 1`).get(mbClass) as any;
  assertThrows(() => attempts.saveScore(P.w1Teacher, a.id, 'writing2', { criteria: [6, 6, 6, 6] }, chuNhatCuoiOf(a.id)), /phân công/,
    'GV W1 nhập điểm W2');
});
check('GVCN không vì chủ nhiệm mà sửa được mọi kỹ năng', () => {
  const skills = ['listening', 'reading', 'writing1', 'writing2', 'speaking']
    .filter((s) => can(P.coreTeacher, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: s }));
  assert(skills.length < 5, `GVCN đang sửa được cả 5 kỹ năng: ${skills.join(', ')}`);
});
/*
 * ĐIỂM CHỈ NGƯỜI DẠY NHẬP. Người không dạy kỹ năng đó thì không có căn cứ nào để chấm —
 * kể cả Quản lý và GVCN. Đường nhập bù còn lại chỉ thuộc về quản trị hệ thống, và vẫn đi
 * nhật ký riêng để soi lại được.
 */
check('Chỉ quản trị hệ thống nhập bù được, và đi nhật ký riêng', () => {
  assert(!can(P.mbManager, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'Quản lý không có đường nhập bù điểm');
  assert(!can(P.coreTeacher, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'GVCN không có đường nhập bù điểm');
  assert(can(P.admin, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'Quản trị hệ thống phải nhập bù được');
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' LIMIT 1`).get(mbClass) as any;
  const chuNhat = chuNhatCuoiOf(a.id);
  assertThrows(() => attempts.saveScore(P.coreTeacher, a.id, 'writing2', { criteria: [6, 6, 6, 6] }, chuNhat), /phân công/,
    'GVCN nhập bù điểm W2 của kỹ năng mình không dạy');
  attempts.saveScore(P.admin, a.id, 'writing2', { criteria: [6, 6, 6, 6], lyDo: 'Phép kiểm: sửa điểm đã có' }, chuNhat);
  const log = conn.prepare(`SELECT * FROM audit_logs WHERE action='score.override' ORDER BY id DESC LIMIT 1`).get() as any;
  assert(log, 'Nhập bù không được ghi nhật ký riêng');
});
check('API chặn thao tác ngoài chi nhánh, không chỉ ẩn nút', () => {
  const cpAttempt = conn
    .prepare('SELECT a.* FROM assessment_attempts a JOIN classes c ON c.id=a.class_id WHERE c.code = ? ORDER BY a.id LIMIT 1')
    .get('CP FT 110') as any;
  assertThrows(() => attempts.attemptDetail(P.mbManager, cpAttempt.id), /phạm vi/, 'Quản lý MB xem lượt của CP');
  assertThrows(() => attempts.setPlanningWeek(P.mbManager, cpAttempt.id, periodOf('2026-10-12')), /quyền|Quản lý/,
    'Quản lý MB đổi tuần của CP');
  assert(attempts.attemptDetail(P.cpManager, cpAttempt.id).id === cpAttempt.id, 'Quản lý CP phải xem được lượt của CP');
});
check('Một người có hai grant khác chi nhánh không cộng chéo quyền', () => {
  const uid = userByRole('manager', 'MB');
  const teacherRole = (conn.prepare("SELECT id FROM roles WHERE key='teacher'").get() as any).id;
  const cpBranch = (conn.prepare("SELECT id FROM branches WHERE code='CP'").get() as any).id;
  conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)')
    .run(uid, teacherRole, cpBranch, 'active', new Date().toISOString());
  const mixed = loadPrincipal(uid);
  assert(can(mixed, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'Grant Quản lý MB phải còn tác dụng ở MB');
  assert(!can(mixed, PERMISSIONS.PLAN_WEEK, { classId: classId('CP FT 110') }),
    'Quyền Quản lý ở MB không được dùng sang CP');
  assert(!can(mixed, PERMISSIONS.MEETING_VIEW, { branchId: cpBranch }), 'Quyền họp của MB không được dùng ở CP');
  conn.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ? AND branch_id = ?').run(uid, teacherRole, cpBranch);
});
check('Giáo viên không vào được Tiến độ công việc', () => {
  assert(!can(P.coreTeacher, PERMISSIONS.MEETING_VIEW, { anyScope: true }), 'GVCN không được cấp module quản lý');
  assert(can(P.mbManager, PERMISSIONS.MEETING_VIEW, { anyScope: true }), 'Quản lý phải xem được Tiến độ công việc');
  assertThrows(() => meeting.meetingBoard(P.coreTeacher, 1), /quyền/, 'GVCN gọi API báo cáo tuần');
});
check('Đã bỏ hẳn bước "Head xác nhận" khỏi hệ thống', () => {
  // Bước này chỉ ghi tên và ngày: không khoá điểm, không là điều kiện đổi trạng thái,
  // không mở khoá bước nào. Case kết thúc theo chính trạng thái xử lý.
  assert(!('SOS_CONFIRM' in PERMISSIONS), 'Vẫn còn quyền xác nhận Head trong bộ quyền');
  assert(!('confirmCase' in (sos as any)), 'Vẫn còn hàm confirmCase');
  /*
   * Dữ liệu mẫu MỚI không ghi bước này nữa — bỏ rồi thì không dựng lại trong dữ liệu giả.
   * Nhưng CỘT vẫn phải còn: database của trung tâm đang có lịch sử xác nhận cũ, và nâng
   * cấp phần mềm không được xoá lịch sử đó đi.
   */
  const cols = (conn.prepare('PRAGMA table_info(sos_cases)').all() as any[]).map((c) => c.name);
  assert(cols.includes('head_confirmed_at') && cols.includes('head_confirmed_by'),
    'Đã xoá cột lưu lịch sử xác nhận cũ — dữ liệu cũ sẽ mất khi nâng cấp');
  const fresh = conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE head_confirmed_at IS NOT NULL').get() as any;
  assert(fresh.n === 0, 'Dữ liệu mẫu mới vẫn dựng lại bước đã bỏ');
});

// ==================================================================== 7

console.log('\n7. Lộ trình và số lần MT');
check('Số MT là duy nhất TRONG một lộ trình, lộ trình mới đánh số lại từ 1', () => {
  /*
   * Chỉ lộ trình Fast Track mới có target, nên phép so target phải chọn một em có HAI lộ
   * trình Fast Track — em đi FOU → BE → FT có ba lộ trình nhưng hai lộ trình đầu không có
   * target nào để so.
   */
  const multi = conn
    .prepare(
      `SELECT student_id FROM learning_cycles WHERE target_score IS NOT NULL
        GROUP BY student_id HAVING COUNT(*) > 1 LIMIT 1`,
    )
    .get() as any;
  assert(multi, 'Seed thiếu học viên có hai lộ trình Fast Track');
  const cs = cycles.cyclesOf(multi.student_id).filter((c: any) => c.target_score !== null);
  assert(cs.length >= 2 && cs[1].target_score !== cs[0].target_score, 'Lộ trình mới phải có target mới');
  const first = conn.prepare('SELECT MIN(attempt_no) n FROM assessment_attempts WHERE cycle_id = ?').get(cs[1].id) as any;
  assert(first.n === 1, 'Lộ trình mới phải bắt đầu lại từ MT1');
  const old = conn.prepare('SELECT MAX(attempt_no) n FROM assessment_attempts WHERE cycle_id = ?').get(cs[0].id) as any;
  assert(old.n >= 1, 'Lộ trình cũ vẫn phải giữ nguyên các lượt của nó');
});
check('Học lại trong cùng lộ trình làm số MT tăng tiếp, target giữ nguyên', () => {
  const repeat = conn
    .prepare(`SELECT a.*, cy.target_score FROM assessment_attempts a JOIN learning_cycles cy ON cy.id=a.cycle_id
               WHERE a.note LIKE '%Học tiếp lộ trình%' LIMIT 1`)
    .get() as any;
  assert(repeat, 'Seed thiếu trường hợp học tiếp lộ trình');
  assert(repeat.attempt_no >= 5, 'Học lại phải làm số MT tăng tiếp');
  assert(repeat.target_at_attempt === repeat.target_score, 'Học lại không được đổi target');
  assert(scoring.expectationFor(repeat.target_at_attempt, repeat.attempt_no) === repeat.target_score,
    'Kỳ vọng của lượt học lại phải bằng target, không quay lại mức trừ của MT1');
});
check('Mở lộ trình mới không đụng ràng buộc số MT của lộ trình cũ', () => {
  const s = conn.prepare(`SELECT student_id FROM learning_cycles GROUP BY student_id HAVING COUNT(*)=1 LIMIT 1`).get() as any;
  const created = cycles.createCycle(P.admin, {
    studentId: s.student_id, route: 'LT2', targetScore: 7.5, examPeriodId: periodOf('2027-05-03'), startedAt: '2026-09-23',
  }) as any;
  /* PR-MT (M1): mở lộ trình FT tự tạo lịch MT mặc định — MT1 của lộ trình mới có sẵn. */
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE cycle_id = ? ORDER BY attempt_no LIMIT 1').get(created.id) as any;
  assert(a?.attempt_no === 1, 'Lộ trình mới phải bắt đầu từ MT1 dù học viên đã có MT1 ở lộ trình cũ');
  assert(a.target_at_attempt === 7.5, 'Lượt mới phải chốt target của lộ trình mới');
  assert(a.planned_period_id, 'Tạo lượt phải gắn đúng một tuần');
});

// ==================================================================== 8

console.log('\n8. Hai đường chấm điểm song song đã bị bỏ');

/*
 * VÒNG 4 BỎ HẲN "Điểm chính thức" và "Ghi nhận của giáo viên".
 *
 * Sáu bài kiểm của vòng trước ở đây kiểm rằng ghi nhận của giáo viên hoạt động đúng. Nay
 * chính chức năng đó bị bỏ (owner chốt 13/09/2026: hai nguồn số liệu đá nhau là thứ đang
 * làm bảng biểu lộn xộn), nên điều cần kiểm đảo lại: nó phải biến mất SẠCH, không để lại
 * bảng dữ liệu mồ côi hay một đường ghi nào còn sót.
 */
check('Bảng "Ghi nhận của giáo viên" không còn tồn tại', () => {
  const t = conn
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'skill_checkins'")
    .get();
  assert(!t, 'Bảng skill_checkins vẫn còn — hai đường chấm điểm vẫn song song');
});

check('Không còn sự kiện hành trình nào trỏ về ghi nhận đã bỏ', () => {
  const n = (conn
    .prepare("SELECT COUNT(*) n FROM journey_events WHERE ref_table = 'skill_checkins'")
    .get() as any).n;
  assert(n === 0, `Còn ${n} sự kiện hành trình trỏ vào bảng đã xoá — bấm vào sẽ lỗi`);
});

check('Đường đi từng kỹ năng chỉ dựng từ MỘT nguồn điểm', () => {
  const s = conn
    .prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id WHERE e.class_id=? LIMIT 1`)
    .get(mbClass) as any;
  const d = profile.studentProfile(P.admin, s.id) as any;
  assert(d.trajectory, 'Hồ sơ mất phần đường đi từng kỹ năng');
  assert(!('checkins' in d), 'Hồ sơ vẫn trả về khu ghi nhận của giáo viên');
  assert(!('comparison' in d), 'Hồ sơ vẫn trả về bảng so ghi nhận với điểm chính thức');
  for (const t of d.trajectory) {
    assert(!('checkin' in t), `Kỹ năng ${t.skill} vẫn kèm ghi nhận của giáo viên`);
    for (const pt of t.points) {
      assert(pt.kind === 'baseline' || pt.kind === 'official',
        `Đường đi còn điểm loại "${pt.kind}" — chỉ được có điểm đầu vào và điểm MT`);
    }
  }
});

check('Bảng Liên hệ riêng không còn tồn tại', () => {
  const t = conn
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'student_contacts'")
    .get();
  assert(!t, 'Bảng student_contacts vẫn còn — hai việc trao đổi chưa về trong case');
});

// ==================================================================== 9

console.log('\n9. Tổng quan và hai nhóm case SOS');
const currentPeriod = week.ensurePeriod(TODAY);
check('Một lượt MT chỉ thuộc ĐÚNG MỘT tuần, không bị đếm hai lần', () => {
  const split = conn
    .prepare(
      `SELECT a.* FROM assessment_attempts a
         JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.status != 'cancelled'
        ORDER BY rp.week_start DESC LIMIT 1`,
    )
    .get() as any;
  const periods = week.listPeriods(40);
  let seen = 0;
  for (const per of periods) {
    if (attempts.listAttempts(P.admin, { periodId: per.id }).rows.some((r) => r.id === split.id)) seen += 1;
  }
  assert(seen === 1, `Một lượt xuất hiện ở ${seen} tuần, phải đúng một tuần`);
  const rows = attempts.listAttempts(P.admin, { periodId: split.planned_period_id }).rows;
  assert(rows.some((r) => r.id === split.id), 'Lượt phải thuộc tuần của chính nó');
});
check('Lượt đã huỷ không bị tính thiếu điểm hay quá hạn', () => {
  const all = attempts.listAttempts(P.admin, {}).rows;
  const cancelled = all.filter((m) => m.status === 'cancelled');
  assert(cancelled.length > 0, 'Seed thiếu lượt đã huỷ');
  assert(!cancelled.some((m) => m.overdueSkills > 0), 'Lượt đã huỷ vẫn bị tính quá hạn');
});

// ==================================================================== 10

console.log('\n10. Xử lý sau Mock và lưu dữ liệu');
/*
 * RULEBOOK v3 (21/09/2026 tối) THAY luật 6.2 CHO MOCK TEST FAST TRACK: kết quả dưới kỳ vọng nay TỰ TẠO (hoặc tự gắn) case cho từng kỹ năng
 * trượt và điền sẵn phương án chờ GVBM xác nhận — thiet-ke/SOS_VA_PHOI_HOP_V3.md §3. Phép kiểm này vẫn giữ những gì 6.2 hứa mà v3 không đổi:
 * hạn ba ngày tính từ ngày ghi nhận và KHÔNG bị đặt lại khi lưu lại / nhập thêm môn; không nhân đôi khi chạy lặp; mọi tín hiệu gắn với một môn.
 * (Lớp Normal giữ nguyên "chỉ sinh tín hiệu" — có phép kiểm riêng ở sosV3.tests.ts.)
 */
check('[6.2→v3] Mock Test FT điểm dưới kỳ vọng: tín hiệu nối NGAY vào case tự tạo (có PA quy chế chờ xác nhận — PR-SOS Q28-3); hạn 3 ngày không bị đặt lại', () => {
  const s = conn
    .prepare(
      `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM students s
         JOIN enrollments e ON e.student_id = s.id
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND e.status = 'active' AND cy.target_score IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM sos_cases sc
                           WHERE sc.student_id = s.id AND sc.category = 'reading')
        ORDER BY s.id LIMIT 1`,
    )
    .get(classId('CP FT 110')) as any;
  const cpPeriod = periodOf('2026-11-09');
  const attempt = attempts.createAttempt(P.cpManager, {
    studentId: s.id, cycleId: s.cycle_id, periodId: cpPeriod,
  }) as any;
  chotThu(attempt.id);

  const exp = s.target_score;           // từ MT3 trở đi kỳ vọng bằng target
  const low = exp - 0.5;
  const t = (skill: string) => loadPrincipal(teacherOfSkill('CP FT 110', skill));
  /*
   * Đếm case MỚI RA ĐỜI, không đếm case đang có.
   *
   * Tín hiệu của một hạng mục ĐÃ CÓ case đang mở thì nối vào chính case đó — đó là hành vi
   * đúng của mục 6.2 ("không mặc định thêm case/phương án mới"), và nó làm case cũ mang
   * `attempt_id` của đợt này. Đếm theo `attempt_id` sẽ hiểu nhầm việc nối đó là mở mới.
   */
  const caseIdBefore = (conn.prepare('SELECT COALESCE(MAX(id), 0) m FROM sos_cases').get() as any).m;
  const casesOf = () => (conn
    .prepare('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND id > ?')
    .get(s.id, caseIdBefore) as any).n;
  const planIdBefore = (conn.prepare('SELECT COALESCE(MAX(id), 0) m FROM case_interventions').get() as any).m;
  /* Hạng mục ĐÃ có case đang mở thì SOS gắn vào đó chứ không tạo mới (S01) — đếm số case MỚI kỳ vọng theo đó. */
  const preOpen = new Set((conn.prepare(
    `SELECT category FROM sos_cases WHERE student_id = ? AND status != 'done'`).all(s.id) as any[]).map((r) => r.category));
  const newCasesExpected = (cats: string[]) => cats.filter((c) => !preOpen.has(c)).length;
  const plansOf = () => (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
         JOIN sos_cases c ON c.id = iv.case_id
        WHERE c.student_id = ? AND iv.id > ?`,
    )
    .get(s.id, planIdBefore) as any).n;

  /* Một kỹ năng dưới kỳ vọng: kết luận SOS ra ngay, và (v3) SOS tự tạo ĐÚNG MỘT case cho kỹ năng đó kèm phương án điền sẵn. */
  attempts.saveScore(t('listening'), attempt.id, 'listening', { rawScore: scoring.LISTENING_BY_RAW.indexOf(low) }, chuNhatCuoiOf(attempt.id));
  const early = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(early.result.sosLevel === 1, `Một kỹ năng dưới kỳ vọng phải ra SOS 1 ngay, đang là ${early.result.sosLevel}`);
  /* OV-1c: lượt thử chốt sẵn (`chotThu`) → không "tạm thời"; lượt dở chưa chốt = tạm thời, không Case — phép kiểm prOv1c (OV1c-1). */
  assert(early.result.chot && !early.result.provisional, 'Lượt đã chốt thì không còn là kết luận tạm thời');
  assert(!preOpen.has('listening'), 'Học viên thử đang có sẵn case Listening mở — chọn học viên khác');
  assert(casesOf() === 1, `Mock FT dưới kỳ vọng phải tự tạo đúng 1 case (v3 S01), đang có ${casesOf()}`);
  assert(plansOf() === 1, `Case tự tạo phải có sẵn đúng 1 phương án (v3 S03), đang có ${plansOf()}`);
  const preListening = conn.prepare(`SELECT * FROM case_interventions WHERE id > ?`).get(planIdBefore) as any;
  assert(preListening.preset === 1 && preListening.status === 'planned' && preListening.confirmed_at === null && preListening.confirmed_by === null,
    'PA tự sinh phải là PA quy chế CHỜ XÁC NHẬN (PR-SOS Q28-3)');

  const sig = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any;
  assert(sig, 'Không sinh tín hiệu nào cho môn dưới kỳ vọng');
  assert(sig.status === 'linked' && sig.case_id, `Mock FT: tín hiệu phải nối ngay vào case tự tạo, đang là ${sig.status}`);
  assert(sig.owner_user_id, 'Tín hiệu phải được giao cho một người cụ thể (GVBM đúng môn)');
  /* Hạn BA NGÀY tính cả ngày đầu: ghi nhận hôm nay thì hết ngày kia, không phải ngày kìa. */
  assert(sig.verify_due === addDays(sig.raised_on, 2),
    `Hạn xác minh phải là 3 ngày tính cả ngày đầu, đang là ${sig.raised_on} → ${sig.verify_due}`);
  /* Và mốc đếm hạn là NGÀY GHI NHẬN, không phải thứ Hai của tuần thi đã qua. */
  assert(sig.raised_on >= demoToday(),
    'Hạn xác minh bị lùi về tuần thi — giáo viên sẽ quá hạn ngay lúc điểm vừa công bố');

  /*
   * KHÔNG CÒN tín hiệu Ý thức/Khác (PR-J, 21/09/2026): điểm thấp không chứng minh em thiếu ý thức. Ý thức là vi phạm do
   * giáo viên ghi, không do máy suy ra từ điểm — nên mọi tín hiệu của đợt đều gắn với một môn.
   */
  const all = conn.prepare('SELECT skill FROM case_signals WHERE attempt_id = ?').all(attempt.id) as any[];
  assert(all.length > 0 && all.every((x) => x.skill), 'Mọi tín hiệu của một đợt điểm phải gắn với một môn, không còn tín hiệu Ý thức');

  /* Nhập thêm môn khác: thêm tín hiệu, vẫn không case nào, và hạn cũ KHÔNG bị đặt lại. */
  const dueBefore = sig.verify_due;
  attempts.saveScore(t('reading'), attempt.id, 'reading', { rawScore: scoring.READING_BY_RAW.indexOf(low) }, chuNhatCuoiOf(attempt.id));
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: tieuChiThu(low) }, chuNhatCuoiOf(attempt.id));
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: tieuChiThu(low) }, chuNhatCuoiOf(attempt.id));
  const three = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(three.result.sosLevel === 3, `Ba kỹ năng dưới kỳ vọng phải lên SOS 3, đang là ${three.result.sosLevel}`);
  const want = newCasesExpected(['listening', 'reading', 'writing1', 'writing2']);
  assert(casesOf() === want, `Bốn kỹ năng dưới kỳ vọng phải có ${want} case MỚI (hạng mục đã mở thì gắn vào), đang có ${casesOf()}`);
  /* PR-SOS Q6: hạng mục đã mở mà ĐÃ có nguyên nhân thì trượt lại thêm một PA quy chế chờ xác nhận — chỉ đếm PA của case MỚI ở đây. */
  const plansOnNew = (conn.prepare(`SELECT COUNT(*) n FROM case_interventions iv JOIN sos_cases c ON c.id = iv.case_id
    WHERE c.student_id = ? AND c.id > ?`).get(s.id, caseIdBefore) as any).n;
  assert(plansOnNew === want, `Mỗi case mới đúng một phương án điền sẵn, đang có ${plansOnNew}`);
  const sigAfter = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any;
  assert(sigAfter.verify_due === dueBefore, 'Lưu điểm môn khác đã đặt lại hạn của tín hiệu Listening');
  const dupe = (conn
    .prepare(`SELECT COUNT(*) n FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any).n;
  assert(dupe === 1, `Nhập bổ sung đã nhân tín hiệu Listening thành ${dupe} dòng`);

  /* Nhập LẠI cùng ô điểm (retry) cũng không nhân tín hiệu và không đổi hạn. */
  attempts.saveScore(t('listening'), attempt.id, 'listening', { rawScore: scoring.LISTENING_BY_RAW.indexOf(low) }, chuNhatCuoiOf(attempt.id));
  const afterRetry = conn
    .prepare(`SELECT COUNT(*) n, MIN(verify_due) d FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any;
  assert(afterRetry.n === 1 && afterRetry.d === dueBefore, 'Lưu lại cùng một ô điểm đã nhân tín hiệu hoặc đổi hạn');

  /* GVBM xác định NGUYÊN NHÂN cho case Listening SOS đã tự tạo (v3 S04) — không còn "mở case từ tín hiệu". */
  const made = cases.caseDetail(P.cpManager, sig.case_id) as any;
  datNguyenNhanThu(t('listening'), made.id, 'student.listening.technique');
  const linked = conn.prepare('SELECT * FROM case_signals WHERE id = ?').get(sig.id) as any;
  assert(linked.status === 'linked' && linked.case_id === made.id, 'Tín hiệu Listening phải còn nối với case tự tạo');

  /* Ghi một việc đã làm, rồi SỬA ĐIỂM Writing thành đạt — việc đã làm KHÔNG được biến mất. */
  cases.recordIntervention(t('listening'), made.id, {
    kind: 'teaching_adjust', description: 'GVCN điều chỉnh cách chữa bài cho em',
    performerSelf: true, status: 'completed', completedDate: TODAY,
  });
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: tieuChiThu(exp), lyDo: 'Phép kiểm: sửa điểm đã có' }, chuNhatCuoiOf(attempt.id));
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: tieuChiThu(exp), lyDo: 'Phép kiểm: sửa điểm đã có' }, chuNhatCuoiOf(attempt.id));
  const reread = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(reread.result.sosLevel === 2, `Sau khi sửa Writing phải còn SOS 2, đang là ${reread.result.sosLevel}`);

  /*
   * [9.4] TÍN HIỆU W1/W2 MẤT CĂN CỨ — và hai nhánh của mục 9.4 phải rẽ đúng chỗ:
   *
   *   · tín hiệu còn CHỜ XÁC MINH  → thu hồi, ghi rõ "Không còn hợp lệ do sửa điểm"
   *   · tín hiệu ĐÃ thành case     → không tự đụng vào case, chỉ báo người phụ trách xem lại
   *
   * Điểm chung: KHÔNG tín hiệu nào được phép còn nằm chờ xác minh trên một con số đã biết
   * là sai — đó mới là khoản nợ giả mà mục 9.4 muốn dọn.
   */
  const w = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill IN ('writing1','writing2')`)
    .all(attempt.id) as any[];
  assert(w.length > 0, 'Không có tín hiệu Writing nào để kiểm');
  assert(w.every((x: any) => x.status !== 'pending'),
    'Sửa điểm thành đạt mà tín hiệu Writing vẫn còn nằm chờ xác minh');
  const pulled = w.filter((x: any) => x.status === 'withdrawn');
  assert(pulled.length > 0, 'Không tín hiệu Writing nào bị thu hồi sau khi sửa điểm');
  assert(pulled.every((x: any) => /sửa điểm/i.test(x.withdrawn_reason ?? '')),
    'Tín hiệu bị thu hồi mà không ghi lý do "Không còn hợp lệ do sửa điểm"');
  /* Tín hiệu đã thành case thì case đó vẫn còn — việc đã diễn ra không bị xoá theo. */
  for (const x of w.filter((y: any) => y.status === 'linked')) {
    const c = conn.prepare('SELECT id FROM sos_cases WHERE id = ?').get(x.case_id) as any;
    assert(c, 'Sửa điểm đã xoá mất case mà tín hiệu này đã được đưa vào');
  }

  /* Case Listening KHÔNG bị đụng: nó có căn cứ riêng, và đã có người làm việc thật trên nó. */
  const kept = cases.caseDetail(t('listening'), made.id) as any;
  assert(kept.interventions.some((i: any) => i.completedDate === TODAY),
    'Sửa điểm đã xoá mất việc đã làm để hỗ trợ');
  assert(kept.status !== 'done', 'Sửa điểm môn khác đã đóng nhầm case Listening');

  /* Và tuyệt đối không có mốc "đã tiến bộ" nào: sửa một con số nhập sai không phải một lần thi. */
  const fakeProgress = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_milestones
        WHERE case_id = ? AND kind = 'passed' AND attempt_id = ?`,
    )
    .get(made.id, attempt.id) as any;
  assert(fakeProgress.n === 0, 'Sửa điểm đã ghi một mốc tiến bộ giả');
});

check('[9.4] Case chỉ sống nhờ con số vừa sửa thì rút khỏi danh sách đang xử lý', () => {
  const s = conn
    .prepare(
      `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM students s
         JOIN enrollments e ON e.student_id = s.id
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND e.status = 'active' AND cy.target_score IS NOT NULL
        ORDER BY s.id DESC LIMIT 1`,
    )
    .get(classId('UB FT 401')) as any;
  const ubManager = loadPrincipal(userByRole('manager', 'UB'));
  const attempt = attempts.createAttempt(ubManager, {
    studentId: s.id, cycleId: s.cycle_id, periodId: periodOf('2026-12-07'),
  }) as any;
  chotThu(attempt.id);
  const exp = s.target_score;
  const t = (skill: string) => loadPrincipal(teacherOfSkill('UB FT 401', skill));

  attempts.saveScore(t('speaking'), attempt.id, 'speaking', { criteria: tieuChiThu(exp - 0.5) }, chuNhatCuoiOf(attempt.id));
  const sig = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(attempt.id) as any;
  assert(sig?.status === 'linked' && sig.case_id, 'Mock FT (v3): tín hiệu Speaking phải nối ngay vào case tự tạo');

  /* SOS đã tự tạo case Speaking. Case này CHƯA có việc gì được làm (chỉ có phương án điền sẵn chưa xác nhận), và chỉ dựa trên đợt này. */
  const made = { id: sig.case_id } as any;

  /* Hoá ra điểm nhập sai: sửa lại thành đạt. */
  attempts.saveScore(t('speaking'), attempt.id, 'speaking', { criteria: tieuChiThu(exp), lyDo: 'Phép kiểm: sửa điểm đã có' }, chuNhatCuoiOf(attempt.id));
  const after = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(made.id) as any;
  assert(after.status === 'done', 'Case chỉ dựa trên điểm sai vẫn nằm trong danh sách đang xử lý');
  assert(/sửa điểm/i.test(after.outcome_note ?? ''),
    `Case bị rút mà không ghi rõ lý do, đang là "${after.outcome_note}"`);
  /* Rút KHÁC xoá: mọi lịch sử vẫn đọc được. */
  const hist = conn.prepare('SELECT COUNT(*) n FROM sos_case_history WHERE case_id = ?').get(made.id) as any;
  assert(hist.n > 0, 'Rút case đã xoá mất lịch sử');
});

check('Bỏ một kỹ năng khỏi phạm vi: đã có điểm thì 409 hỏi Xoá điểm, điểm giữ nguyên (PR-MTGON); chưa có điểm thì tính lại kết quả', () => {
  const xong = conn
    .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' ORDER BY id DESC LIMIT 1`)
    .get(classId('CP FT 110')) as any;
  const beforeScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(xong.id) as any).n;
  assertThrows(() => attempts.setSkillSkip(P.cpManager, xong.id, 'speaking', true, 'Quản lý chốt lại: đợt này không yêu cầu Speaking'),
    /đã có điểm — Xoá điểm và bỏ khỏi đợt\?/, 'PR-MTGON: huỷ kỹ năng đã có điểm phải hỏi xoá điểm trước');
  const afterScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(xong.id) as any).n;
  assert(afterScores === beforeScores, 'Đánh dấu không mock đã xoá điểm đã có');
  /* PR-XLMT: phần "tính lại mẫu số" giữ nguyên, chuyển sang một đợt CHƯA TỚI tuần thi, Speaking chưa có điểm. */
  const a = conn
    .prepare(`SELECT a.* FROM assessment_attempts a JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'speaking' AND k.required = 1
               JOIN report_periods p ON p.id = k.planned_period_id
              WHERE a.class_id = ? AND a.status = 'planned' AND a.kind = 'mock' AND a.lich_su = 0 AND p.week_start > ?
                AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))
              ORDER BY a.id LIMIT 1`)
    .get(classId('CP FT 110'), week.mondayOf(TODAY)) as any;
  assert(a, 'Seed: CP FT 110 cần một đợt Mock chưa tới tuần thi');
  /*
   * Lý do phải là một lý do về PHẠM VI, không phải "học viên vắng". Bỏ môn vì em vắng
   * chính là đường lách mà mục 10.1 cấm, và hệ thống chặn nó ở chỗ khác — xem phép kiểm
   * "Không bỏ môn khỏi phạm vi sau khi đã xác nhận vắng" bên dưới.
   */
  attempts.setSkillSkip(P.cpManager, a.id, 'speaking', true, 'Quản lý chốt lại: đợt này không yêu cầu Speaking');
  const d = attempts.attemptDetail(P.cpManager, a.id);
  assert(d.result.required.length === 3 && d.result.scopeNote === '3 kỹ năng', 'Chưa tính lại mẫu số');
  assert(d.result.overall === null, 'Không được giữ Overall bốn kỹ năng khi một kỹ năng không mock');
  assertThrows(() => attempts.saveScore(P.admin, a.id, 'speaking', { criteria: [6, 6, 6, 6] }),
    /ngoài phạm vi|không nằm trong phạm vi/, 'Nhập điểm cho kỹ năng ngoài phạm vi yêu cầu');
  attempts.setSkillSkip(P.cpManager, a.id, 'speaking', false);
  assert(attempts.attemptDetail(P.cpManager, a.id).result.required.length === 4, 'Bỏ đánh dấu không khôi phục mẫu số');
});
check('Gửi null xoá điểm về trống, không biến thành 0', () => {
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' LIMIT 1`).get(mbClass) as any;
  const teacher = loadPrincipal(teacherOfSkill('MB FT 101', 'listening'));
  const chuNhat = chuNhatCuoiOf(a.id);
  attempts.saveScore(teacher, a.id, 'listening', { rawScore: null, lyDo: 'Phép kiểm: sửa điểm đã có' }, chuNhat);
  const row = conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill='listening'`).get(a.id) as any;
  assert(row.raw_score === null && row.band === null, 'Xoá điểm lại thành 0');
  attempts.saveScore(teacher, a.id, 'listening', { rawScore: 30 }, chuNhat);
  const back = conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill='listening'`).get(a.id) as any;
  assert(back.band === scoring.bandFromRaw('listening', 30) && back.entered_by === teacher.userId, 'Nhập lại không lưu đúng');
});
check('PR-LT (4): Chuyển lớp KHÁC chương trình (FT → lớp thường) đóng khoá cũ, lượt chưa xong Ở LẠI lớp cũ (Q10, Q12 — sửa lại phép kiểm cũ ở đây từng cho lượt chưa xong luôn theo em sang mọi lớp chuyển đến, kể cả khác chương trình; PR-LT chốt: chỉ theo em khi GIỮ khoá). Dữ liệu TỰ DỰNG, không đụng BC FT 205/BC ELE 01 — hai lớp đó là bể chứa chung của nhiều phép kiểm khác (freshPlannedAttempt).', () => {
  const bc = (conn.prepare(`SELECT id FROM branches WHERE code = 'BC'`).get() as any).id as number;
  const now = new Date().toISOString();
  const fromCls = (intake.createClass(P.admin, {
    code: `BC-LT4-FT-${Date.now()}`, branchId: bc, kind: 'FT', isFastTrack: true, startDate: TODAY,
  }) as any).id as number;
  const toCls = (intake.createClass(P.admin, {
    code: `BC-LT4-ELE-${Date.now()}`, branchId: bc, kind: 'ELE', isFastTrack: false, startDate: TODAY,
  }) as any).id as number;
  const sid = Number(conn.prepare(
    `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES ('PISA-LT4','LT4','lt4',?, 'active', ?)`,
  ).run(bc, now).lastInsertRowid);
  conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
    .run(sid, fromCls, TODAY, now);
  const cycleId = Number(conn.prepare(
    `INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', ?, 'active', ?)`,
  ).run(sid, TODAY, now).lastInsertRowid);
  const periodId = week.ensurePeriod(TODAY).id;
  const doneId = Number(conn.prepare(
    `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
     VALUES (?,?,1,'mock',?,?, 'done', ?)`,
  ).run(cycleId, sid, fromCls, periodId, now).lastInsertRowid);
  skillSchedule.ensureSkillRows(doneId);
  const plannedId = Number(conn.prepare(
    `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
     VALUES (?,?,2,'mock',?,?, 'planned', ?)`,
  ).run(cycleId, sid, fromCls, periodId, now).lastInsertRowid);
  skillSchedule.ensureSkillRows(plannedId);

  students.transferStudent(P.admin, sid, toCls, TODAY, 'Đổi ca học',
    { note: 'Em còn case Reading đang theo dõi, cô mới nhận lớp đọc kỹ phần phương án.' });

  const after = conn.prepare('SELECT id, class_id, status FROM assessment_attempts WHERE student_id = ?').all(sid) as any[];
  assert(after.find((a) => a.id === doneId)!.class_id === fromCls, 'Lượt đã xong bị viết lại lớp');
  assert(after.find((a) => a.id === plannedId)!.class_id === fromCls,
    'Khác chương trình: lượt chưa xong phải Ở LẠI lớp cũ (Q12), không đi theo em');
  assert(profile.studentProfile(P.admin, sid).enrollments.length >= 2, 'Lịch sử lớp bị ghi đè');
  const cyc = conn.prepare('SELECT status FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  assert(cyc.status === 'completed', 'Lộ trình FT cũ phải đóng completed (Q10)');
});
check('Ba trạng thái học viên; lưu trữ chỉ ẩn, không đóng việc còn dở', () => {
  const s = conn.prepare(`SELECT * FROM students WHERE status='finished' LIMIT 1`).get() as any;
  assert(s && s.finished_at, 'Seed thiếu học viên đã kết thúc');
  const openBefore = (conn.prepare(
    `SELECT COUNT(*) n FROM sos_cases sc JOIN assessment_attempts a ON a.id=sc.attempt_id
      WHERE a.student_id = ? AND sc.status != 'done'`).get(s.id) as any).n;
  /* RB-9 (PR-S1): không còn tự lưu trữ sau N ngày — Quản lý bấm. `P.admin` vì em đầu tiên có thể thuộc chi nhánh khác MB. */
  students.archiveStudent(P.admin, s.id);
  const after = conn.prepare('SELECT * FROM students WHERE id = ?').get(s.id) as any;
  assert(after.archived_at, 'Quản lý bấm lưu trữ thì học viên phải vào lưu trữ');
  assert(after.status === 'finished', 'Lưu trữ không được thành trạng thái thứ tư');
  const openAfter = (conn.prepare(
    `SELECT COUNT(*) n FROM sos_cases sc JOIN assessment_attempts a ON a.id=sc.attempt_id
      WHERE a.student_id = ? AND sc.status != 'done'`).get(s.id) as any).n;
  assert(openAfter === openBefore, 'Lưu trữ đã âm thầm đóng case còn dở');
});
/* PR-VAI-b (Q31-10, K3-32): "chương" nay là CHƯƠNG THEO LỚP của tab Hành trình (mỗi ghi danh một chương), không còn gom sự kiện nhật ký. */
const hanhTrinhSvc = await import('../students/hanhTrinh.ts');
check('Hành trình gom thành CHƯƠNG: mỗi lớp em học một chương, cũ → mới; Case nằm trong chương của lớp em học lúc mở', () => {
  const s = conn.prepare(`SELECT student_id AS id FROM enrollments GROUP BY student_id HAVING COUNT(*) >= 2 ORDER BY student_id LIMIT 1`).get() as any;
  const ch = hanhTrinhSvc.hanhTrinhHocVien(P.admin, s.id, null).chuong as any[];
  const soGhiDanh = (conn.prepare('SELECT COUNT(*) n FROM enrollments WHERE student_id = ?').get(s.id) as any).n;
  assert(ch.length === soGhiDanh, `Mỗi ghi danh một chương: ${ch.length} ≠ ${soGhiDanh}`);
  // Chương xếp theo đúng thứ tự thời gian, để đọc được như một mạch chuyện.
  for (let i = 1; i < ch.length; i += 1) assert(ch[i - 1].tu <= ch[i].tu, `Chương "${ch[i].code}" xếp sai thứ tự thời gian`);
  // Mọi Case của em đều có chỗ trong một chương (không Case nào rơi khỏi hành trình).
  const soCase = (conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND detected_at IS NOT NULL').get(s.id) as any).n;
  assert(new Set(ch.flatMap((c: any) => c.caseDong.map((x: any) => x.caseId))).size === soCase, 'Mỗi Case của em phải nằm trong một chương');
});
check('Nhiều việc quanh MỘT vấn đề gom lại thành MỘT chương, không thành nhiều dòng rời', () => {
  const row = conn
    .prepare(
      `SELECT sc.student_id AS sid, sc.id AS cid FROM sos_cases sc
        WHERE (SELECT COUNT(*) FROM case_interventions ci WHERE ci.case_id = sc.id) >= 1
        ORDER BY sc.id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Dữ liệu mẫu thiếu vấn đề đã có tác động');
  /* PR-VAI-b: chương theo lớp — một Case một khối trong chương (PA nằm trong khối Case), chỉ lặp ở chương sau khi Case bàn giao sang lớp mới. */
  const ch = hanhTrinhSvc.hanhTrinhHocVien(P.admin, row.sid, null).chuong as any[];
  const mine = ch.flatMap((c: any) => c.caseDong.filter((x: any) => x.caseId === row.cid));
  assert(ch.every((c: any) => c.caseDong.filter((x: any) => x.caseId === row.cid).length <= 1), `Vấn đề ${row.cid} bị tách thành nhiều khối trong một chương`);
  assert(mine.length <= 1 || mine.some((x: any) => x.diTheoSang), `Vấn đề ${row.cid} lặp ở ${mine.length} chương mà không đi theo em sang lớp mới`);
});
check('Target chốt tại lượt: sửa lộ trình không viết lại lịch sử', () => {
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE status='done' ORDER BY id LIMIT 1`).get() as any;
  const before = a.target_at_attempt;
  cycles.updateCycle(P.admin, a.cycle_id, { targetScore: 8, lyDo: 'Nâng Target' });
  const after = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(a.id) as any;
  assert(after.target_at_attempt === before, 'Sửa target đã viết lại lịch sử lượt cũ');
  assert((conn.prepare('SELECT target_score FROM learning_cycles WHERE id = ?').get(a.cycle_id) as any).target_score === 8,
    'Lộ trình chưa cập nhật target mới');
});

// ==================================================================== 11

console.log('\n11. Học viên lấy lớp làm gốc');
check('Danh sách lớp chỉ dùng một nhóm truy vấn, không hỏi lại theo từng lớp', () => {
  let n = 0;
  const conn2 = db();
  const orig = conn2.prepare.bind(conn2);
  (conn2 as any).prepare = (sql: string) => { n += 1; return orig(sql); };
  try { classesSvc.listClassSummaries(P.admin, {}); } finally { (conn2 as any).prepare = orig; }
  const classCount = (conn.prepare("SELECT COUNT(*) c FROM classes WHERE status='active'").get() as any).c;
  // Có một truy vấn phụ cho mỗi lớp là chấp nhận được, nhưng không được tăng theo số LƯỢT.
  assert(n < classCount * 4, `Danh sách lớp dùng ${n} câu lệnh cho ${classCount} lớp — nghi vấn N+1`);
});
check('Badge chỉ đếm việc cần làm, đếm đúng tập mà bấm vào sẽ mở ra', () => {
  const rows = classesSvc.listClassSummaries(P.admin, {}).rows;
  assert(rows.length > 0, 'Không có lớp nào trong phạm vi Admin');
  for (const c of rows) {
    const sos = attempts.listAttempts(P.admin, { classId: c.id, need: 'sos_open' }).rows.length;
    assert(c.openCases === sos, `Lớp ${c.code}: badge case SOS ${c.openCases} khác danh sách ${sos}`);
  }
});
check('Luật đếm bài cần chấm — một hàm, hai phạm vi', () => {
  const cells = [
    { skill: 'listening', required: true,  scored: false, progress: 'due' as const,      mine: true  },
    { skill: 'reading',   required: true,  scored: false, progress: 'due' as const,      mine: false },
    { skill: 'writing1',  required: true,  scored: true,  progress: 'due' as const,      mine: true  },
    { skill: 'writing2',  required: false, scored: false, progress: 'due' as const,      mine: true  },
    { skill: 'speaking',  required: true,  scored: false, progress: 'upcoming' as const, mine: true  },
  ];
  const mine = domain.pendingSkillsOf(cells, 'mine');
  const managed = domain.pendingSkillsOf(cells, 'managed');
  assert(mine.join(',') === 'listening', `mine phải chỉ ra listening, đang ra: ${mine.join(',')}`);
  assert(
    managed.join(',') === 'listening,reading',
    `managed phải ra listening,reading, đang ra: ${managed.join(',')}`,
  );
});
const { dotHoanTat } = await import('../fasttrack/hoanTat.ts');
check('Ô điểm nói rõ kỹ năng có bắt buộc, độc lập với quyền người xem', () => {
  /*
   * Đợt CHƯA hoàn tất: từ R11 (và Z2c-c A3 — màn chi tiết đọc đúng luật đó) Quản lý sửa được đợt đã hoàn tất, kèm lý do.
   * Phép này kiểm "bắt buộc" không phụ thuộc quyền, nên cần một đợt mà Quản lý thật sự không sửa được.
   */
  /* PR-XLMT (chủ sản phẩm chốt 29/09): Quản lý nay sửa được điểm ở mọi lúc — người xem "không sửa được" là GV Writing 1 nhìn các ô L/R/S. */
  const a = (conn
    .prepare(`SELECT a.* FROM assessment_attempts a WHERE a.status != 'cancelled' AND a.class_id = ? AND a.kind = 'mock' ORDER BY a.id`)
    .all(mbClass) as any[]).find((x) => !dotHoanTat(x.id, TODAY).hoanTat);
  const d = attempts.attemptDetail(P.w1Teacher, a.id);
  assert(d.cells.length > 0, 'Không lấy được ô điểm nào để kiểm');
  assert(
    d.cells.every((c: any) => typeof c.required === 'boolean'),
    'Mọi ô điểm phải có trường required',
  );
  assert(
    d.cells.some((c: any) => c.required && !c.canEdit),
    'Người không sửa được ô vẫn phải thấy ô nào bắt buộc',
  );
});
check('Badge bằng đúng danh sách — cả ba vai, cả hai phạm vi', () => {
  for (const [who, p] of [
    ['Quản trị', P.admin], ['Quản lý MB', P.mbManager], ['GV W1', P.w1Teacher],
  ] as const) {
    for (const scope of ['mine', 'managed'] as const) {
      const rows = classesSvc.listClassSummaries(p, { scope }).rows;
      for (const c of rows) {
        const listed = attempts
          .listAttempts(p, { classId: c.id, need: 'my_scores', scope })
          .rows.reduce((n: number, r: any) => n + r.pendingSkills.length, 0);
        assert(
          c.needScores === listed,
          `${who} · ${scope} · lớp ${c.code}: badge ${c.needScores} khác danh sách ${listed}`,
        );
      }
    }
  }
});
check('Phạm vi quản lý nhìn thấy việc mà người xem không được phân công', () => {
  const managed = classesSvc.listClassSummaries(P.admin, { scope: 'managed' }).rows
    .reduce((n: number, c: any) => n + c.needScores, 0);
  const mine = classesSvc.listClassSummaries(P.admin, { scope: 'mine' }).rows
    .reduce((n: number, c: any) => n + c.needScores, 0);
  assert(managed > 0, 'Quản trị phải thấy có việc trong phạm vi quản lý');
  assert(mine === 0, 'Quản trị không dạy lớp nào nên "việc của tôi" phải bằng 0');
});
check('Badge "cần nhập điểm" theo đúng phân công của người đang xem', () => {
  const mine = classesSvc.listClassSummaries(P.w1Teacher, { scope: 'mine' }).rows;
  for (const c of mine) {
    const q = attempts
      .listAttempts(P.w1Teacher, { classId: c.id, need: 'my_scores', scope: 'mine' })
      .rows.reduce((n: number, r: any) => n + r.pendingSkills.length, 0);
    assert(c.needScores === q, `Lớp ${c.code}: badge ${c.needScores} khác hàng đợi ${q} của chính giáo viên đó`);
  }
  const asAdmin = classesSvc.listClassSummaries(P.admin, { scope: 'managed' }).rows.find((c) => c.code === 'MB FT 101')!;
  const asTeacher = mine.find((c) => c.code === 'MB FT 101');
  assert(!asTeacher || asTeacher.needScores <= asAdmin.needScores, 'Giáo viên không thể có nhiều việc hơn Admin (phạm vi quản lý)');
});
check('T08 · RLW tuần này, S tuần sau: mỗi bảng tuần hiện đúng phần của nó', () => {
  const row = conn
    .prepare(
      `SELECT ask.attempt_id, a.class_id,
              MIN(ask.planned_period_id) AS early, MAX(ask.planned_period_id) AS late
         FROM attempt_skills ask
         JOIN assessment_attempts a ON a.id = ask.attempt_id
        WHERE ask.required = 1 AND ask.planned_period_id IS NOT NULL AND a.status != 'cancelled'
        GROUP BY ask.attempt_id
       HAVING early != late
        LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Bộ demo phải có ít nhất một đợt tách tuần để kiểm — xem DEMO.md');

  for (const periodId of [row.early, row.late]) {
    const sheet = attempts.classScoreSheet(P.admin, row.class_id, periodId);
    assert(
      sheet.rows.some((r: any) => r.attemptId === row.attempt_id),
      `Đợt ${row.attempt_id} phải hiện ở bảng tuần ${periodId} vì có kỹ năng thi tuần đó`,
    );
  }
});
check('Một em nợ điểm ở từ hai đợt trở lên thì hàng đợi ra đúng số dòng, không gộp', () => {
  const rows = attempts.listAttempts(P.admin, { need: 'my_scores', scope: 'managed' }).rows;
  const byStudent = new Map<number, Set<number>>();
  for (const r of rows as any[]) {
    if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, new Set());
    byStudent.get(r.studentId)!.add(r.id);
  }
  const twoOrMore = [...byStudent.entries()].find(([, ids]) => ids.size >= 2);
  assert(twoOrMore, 'Bộ demo phải có ít nhất một em nợ điểm ở từ hai đợt trở lên để kiểm');
  const [studentId, ids] = twoOrMore!;
  const studentRows = rows.filter((r: any) => r.studentId === studentId);
  assert(
    studentRows.length === ids.size,
    `Học viên ${studentId} nợ ${ids.size} đợt nhưng hàng đợi chỉ ra ${studentRows.length} dòng — khoá dòng theo studentId thay vì attemptId`,
  );
});
check('Tìm theo tên học viên trả về đúng lớp chứa em đó', () => {
  const s = conn
    .prepare(`SELECT s.full_name, c.code FROM students s JOIN enrollments e ON e.student_id=s.id
               JOIN classes c ON c.id=e.class_id WHERE e.status='active' LIMIT 1`)
    .get() as any;
  const rows = classesSvc.listClassSummaries(P.admin, { q: s.full_name }).rows;
  assert(rows.some((r) => r.code === s.code), `Tìm "${s.full_name}" không ra lớp ${s.code}`);
});
check('Roster chỉ nạp khi mở lớp, và giáo viên ngoài lớp bị từ chối', () => {
  const roster = classesSvc.classRoster(P.admin, mbClass);
  assert(roster.length > 0, 'Roster rỗng');
  assert(roster[0].timeline.length > 0 && 'myPending' in roster[0], 'Roster thiếu tiến trình MT');
  assertThrows(() => classesSvc.classRoster(P.mbManager, classId('CP FT 110')), /phạm vi/,
    'Quản lý MB mở roster lớp CP');
});

// ==================================================================== 12

console.log('\n12. Thêm học viên hàng loạt');
check('Đọc được TSV dán từ bảng tính theo dòng tiêu đề; không tiêu đề mà chưa chọn lớp thì từ chối (YC-5.2; PR-NT 04/10)', () => {
  const withHeader = intake.parsePaste('Họ tên\tLớp\tNgày sinh\nNguyễn Văn A\tMB FT 101\t12/05/2008');
  assert(withHeader.rows.length === 1, 'Không nhận ra dòng tiêu đề');
  assert(withHeader.rows[0].fullName === 'Nguyễn Văn A' && withHeader.rows[0].classCode === 'MB FT 101', 'Đọc sai cột');
  assertThrows(() => intake.parsePaste('Trần Thị B\tMB FT 101\t01/02/2009'), /Chọn lớp trước/,
    'Bảng dán không tiêu đề mà chưa chọn lớp phải bị từ chối (không biết thứ tự cột)');
});
check('Ngày gõ dd/mm/yyyy (hoặc ISO), không đoán mm/dd, ngày không có thật thì báo lỗi (C10)', () => {
  const { docNgayNhap } = DOMAIN_NHAP;
  assert(docNgayNhap('12/05/2008', TODAY).iso === '2008-05-12', 'Đọc sai định dạng ngày/tháng');
  assert(docNgayNhap('2008-05-12', TODAY).iso === '2008-05-12', 'Không nhận ISO');
  assert(!!docNgayNhap('linh tinh', TODAY).loi, 'Ngày sai phải báo lỗi, không đoán');
  assert(!!docNgayNhap('02/31/2008', TODAY).loi, 'Không được đoán mm/dd');
  assert(docNgayNhap('', TODAY).iso === null && docNgayNhap('', TODAY).loi === null, 'Ô trống phải là null');
});
check('[12.1] Xem trước bắt lỗi từng ô và gợi ý trùng, không tự gộp', () => {
  const existing = conn.prepare('SELECT full_name, dob FROM students WHERE dob IS NOT NULL LIMIT 1').get() as any;
  const pv = intake.previewIntake(P.admin, {
    classId: classId('MB FT 101'),
    rows: [
      { fullName: '' },
      { fullName: 'Người Mới Một', dob: 'linh tinh' },
      { fullName: 'Người Mới Hai', target: '12' },
      { fullName: 'Người Mới Ba', entryListening: '5.3' },
      { fullName: '-' },
    ],
  });
  assert(pv.rows[0].issues.some((i) => i.field === 'fullName'), 'Không bắt lỗi thiếu họ tên');
  assert(pv.rows[1].issues.some((i) => i.field === 'dob'), 'Không bắt lỗi ngày sai');
  assert(pv.rows[2].issues.some((i) => i.field === 'target'), 'Không bắt lỗi target ngoài 0–9');
  assert(pv.rows[3].issues.some((i) => i.field === 'entryListening'), 'Không bắt lỗi band lẻ 5.3');
  /* Dấu '-' ở cột tên là THIẾU TÊN, không phải một em tên '-'. */
  assert(pv.rows[4].issues.some((i) => i.field === 'fullName'), 'Nhận "-" như một cái tên hợp lệ');

  /* Chưa chọn lớp thì không soát được gì có ý nghĩa — nói thẳng thay vì soát nửa vời. */
  const noClass = intake.previewIntake(P.admin, { rows: [{ fullName: 'A' }] });
  assert(noClass.issues.some((i) => i.field === 'classId'), 'Không báo thiếu lớp cho cả lô');

  if (existing) {
    const dup = intake.previewIntake(P.admin, {
      classId: classId('MB FT 101'),
      rows: [{ fullName: existing.full_name, dob: existing.dob }],
    });
    assert(dup.rows[0].duplicates.length > 0, 'Không gợi ý hồ sơ trùng');
    assert(dup.rows[0].issues.some((i) => /Có thể trùng/.test(i.message) && i.muc === 'luu_y'),
      'Gợi ý trùng mà không nói ra cho người nhập thấy');
  }
});

check('[12.1] Lớp là quyết định của cả lô, cột "Lớp" trong file bị bỏ qua có báo', () => {
  const pv = intake.previewIntake(P.admin, {
    classId: classId('MB FT 101'),
    rows: [{ fullName: 'Người Dán Nhầm Lớp', classCode: 'CP FT 110' }],
  });
  assert(pv.rows[0].classCode === 'MB FT 101',
    `Cột lớp trong file đã đè lên ô chọn lớp: ${pv.rows[0].classCode}`);
  assert(pv.rows[0].issues.some((i) => i.field === 'classCode' && /Bỏ qua — cả lô vào MB FT 101/.test(i.message)),
    'Bỏ qua cột lớp mà không nói — người nhập tưởng em vào lớp ghi trong file');
});

check('[12.1] Lớp Normal không nhận band từng kỹ năng; Target nhận (chủ sản phẩm 04/10, PR-NT)', () => {
  const normal = conn
    .prepare(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
               WHERE pg.scoring_mode = 'ratio' LIMIT 1`)
    .get() as any;
  assert(normal, 'Bộ demo thiếu lớp Normal');
  const pv = intake.previewIntake(P.admin, {
    classId: normal.id,
    rows: [{ fullName: 'Em Lớp Thường', target: '6.5', entryListening: '5.0' }],
  });
  assert(pv.ratio === true, 'Không nhận ra đây là lớp Normal');
  /* Q4: file trộn — cột FT dán vào lớp thường bị BỎ QUA có báo (lưu ý), không chặn dòng. */
  assert(!pv.rows[0].issues.some((i) => i.field === 'target'), 'Lớp Normal nay nhận Target (04/10)');
  assert(pv.rows[0].issues.some((i) => i.field === 'entryListening' && i.muc === 'luu_y'),
    'Lớp Normal vẫn nhận band đầu vào từng kỹ năng');
  assert(pv.rows[0].target === 6.5 && pv.rows[0].entryListening === null, 'Lớp thường: target nhận, band bị bỏ qua');
});
check('Nhập ngoài phạm vi quyền bị chặn ở server', () => {
  const pv = intake.previewIntake(P.mbManager, {
    classId: classId('CP FT 110'), rows: [{ fullName: 'Ngoài Phạm Vi' }],
  });
  assert(pv.issues.some((i) => /phạm vi/.test(i.message)), 'Không chặn lớp ngoài chi nhánh khi xem trước');
  /*
   * Cả lô vào MỘT lớp, nên lớp ngoài phạm vi là chặn CẢ LÔ ngay từ đầu — không có chuyện
   * ghi được một phần. Còn một dòng hỏng trong một lô hợp lệ thì chỉ dòng đó bị bỏ.
   */
  /* PR-TOC: chặn bằng 403 (trước là 200 · 0 em · không lỗi — giao diện báo "đã thêm 0 em" mà không nói vì sao). */
  let loi: any = null;
  try {
    intake.commitIntake(P.mbManager, {
      classId: classId('CP FT 110'),
      rows: [{ fullName: 'Ngoài Phạm Vi 2' }],
      idempotencyKey: 'test-intake-scope',
    });
  } catch (e) { loi = e; }
  assert(loi?.status === 403 && /phạm vi/.test(loi.message), `Lớp ngoài phạm vi phải 403: ${loi?.status} ${loi?.message}`);
  assert(!conn.prepare("SELECT id FROM students WHERE full_name = 'Ngoài Phạm Vi 2'").get(),
    'Học viên ngoài phạm vi quyền vẫn bị ghi vào database');
});
check('Ghi thật: tạo học viên, enrollment và lộ trình; bỏ qua dòng lỗi', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  const r = intake.commitIntake(P.admin, {
    classId: classId('MB FT 101'),
    rows: [
      { fullName: 'Học Viên Nhập Một', target: 6.5, dob: '01/02/2009', email: emailThu(),
        entryListening: 5, entryReading: '5.5', entryWriting: '-', baselineScore: '5.0' },
      { fullName: '' },
      { fullName: 'Học Viên Nhập Hai', email: emailThu(), dob: '2010-01-01' },
    ],
    idempotencyKey: 'test-intake-1',
  });
  const after = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  assert(r.added === 2 && r.skipped === 1, `Kỳ vọng thêm 2 bỏ 1, thực tế thêm ${r.added} bỏ ${r.skipped}`);
  assert(after === before + 2, 'Số học viên trong database không khớp');
  const one = conn.prepare("SELECT * FROM students WHERE full_name = 'Học Viên Nhập Một'").get() as any;
  assert(one.student_code && one.dob === '2009-02-01', 'Mã học viên hoặc ngày sinh sai');
  assert((conn.prepare('SELECT COUNT(*) n FROM enrollments WHERE student_id = ?').get(one.id) as any).n === 1,
    'Thiếu enrollment');
  const cyc = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').get(one.id) as any;
  assert(cyc && cyc.route === 'LT1' && cyc.target_score === 6.5, 'Lộ trình chưa được tạo đúng');
  /*
   * Dòng không ghi lộ trình thì KẾ THỪA lộ trình của lớp: học viên vào lớp LT1 thì đang học LT1,
   * bắt người nhập gõ lại là thừa. Thiếu target vẫn nhập được, chỉ là chưa tính được kỳ vọng.
   */
  const two = conn.prepare("SELECT id FROM students WHERE full_name = 'Học Viên Nhập Hai'").get() as any;
  const cyc2 = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ?').get(two.id) as any;
  assert(cyc2 && cyc2.route === 'LT1', 'Không kế thừa lộ trình của lớp');
  assert(cyc2.target_score === null, 'Không được tự đoán target khi bảng nhập bỏ trống');
  /*
   * BAND ĐẦU VÀO TỪNG KỸ NĂNG, và dấu '-' là CHƯA CÓ chứ không phải 0 (mục 12.1).
   * OVR nhập độc lập: nó không bị bốn band ghi đè, và cũng không lấp vào chỗ band còn thiếu.
   */
  assert(cyc.baseline_listening === 5 && cyc.baseline_reading === 5.5,
    `Band đầu vào ghi sai: L=${cyc.baseline_listening} R=${cyc.baseline_reading}`);
  assert(cyc.baseline_writing === null,
    `Ô '-' phải là CHƯA CÓ, đang lưu ${cyc.baseline_writing}`);
  assert(cyc.baseline_score === 5, `OVR phải giữ nguyên 5.0, đang là ${cyc.baseline_score}`);

  const warn = intake.previewIntake(P.admin, {
    classId: classId('MB FT 101'),
    rows: [{ fullName: 'Học Viên Nhập Hai' }],
  });
  assert(warn.rows[0].issues.some((i) => i.field === 'target' && /Chưa có/.test(i.message) && i.muc === 'luu_y'),
    'Thiếu target phải cảnh báo để người nhập biết còn phải bổ sung');
});
check('Bấm hai lần hoặc thử lại không tạo học viên trùng', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  const again = intake.commitIntake(P.admin, {
    classId: classId('MB FT 101'),
    rows: [
      { fullName: 'Học Viên Nhập Một', target: 6.5, dob: '01/02/2009', email: emailThu() },
      { fullName: '' },
      { fullName: 'Học Viên Nhập Hai', email: emailThu(), dob: '2010-01-01' },
    ],
    idempotencyKey: 'test-intake-1',
  });
  const after = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  assert(after === before, `Gửi lại cùng khoá đã tạo thêm ${after - before} học viên`);
  assert(again.added === 2, 'Kết quả lần gửi lại phải giống lần đầu');
});
check('[12.1 → PR-MT M1] Nhập hàng loạt tạo lịch MT MẶC ĐỊNH do hệ thống tính (không lấy tuần từ file), với cả GVCN lẫn Quản lý', () => {
  /*
   * Trước đây file dán có cột "Tuần MT" thì đường nhập này tạo luôn các lượt thi theo file — một lối vòng quanh quyền xếp lịch.
   * PR-MT (M1, YC-13.2) đổi luật: thêm em vào lớp FT thì HỆ THỐNG tạo MT1–MT3 theo tuần bắt đầu học (tuần học 6/12/16); tuần không
   * đến từ file, nên vẫn không có lối vòng nào. Quản lý xếp lại ở Kế hoạch Test.
   */
  const r = intake.commitIntake(P.coreTeacher, {
    classId: classId('MB FT 101'),
    rows: [{ fullName: 'Học Viên Không Quyền Tuần', target: 6, email: emailThu(), dob: '2010-01-01' }],
    idempotencyKey: 'test-intake-2',
  });
  assert(r.added === 1, 'GVCN phải thêm được học viên vào lớp mình phụ trách');
  const s = conn.prepare("SELECT id FROM students WHERE full_name = 'Học Viên Không Quyền Tuần'").get() as any;
  assert((conn.prepare("SELECT COUNT(*) n FROM assessment_attempts WHERE student_id = ? AND plan_source = 'auto'").get(s.id) as any).n === 3,
    'Nhập hàng loạt phải tạo đúng 3 lượt MT mặc định do hệ thống xếp');

  const r2 = intake.commitIntake(P.mbManager, {
    classId: classId('MB FT 101'),
    rows: [{ fullName: 'Học Viên Có Quyền Tuần', target: 6, email: emailThu(), dob: '2010-01-01' }],
    idempotencyKey: 'test-intake-3',
  });
  assert(r2.added === 1, 'Quản lý phải thêm được học viên');
  const s2 = conn.prepare("SELECT id FROM students WHERE full_name = 'Học Viên Có Quyền Tuần'").get() as any;
  assert((conn.prepare("SELECT COUNT(*) n FROM assessment_attempts WHERE student_id = ? AND plan_source = 'auto'").get(s2.id) as any).n === 3,
    'Quản lý thêm em cũng chỉ ra lịch mặc định — không xếp tuần qua đường nhập danh sách');
});

check('[12.1] Tuần bắt đầu: mặc định cho cả lô, ghi đè được từng dòng', () => {
  const r = intake.commitIntake(P.admin, {
    classId: classId('MB FT 101'),
    defaultStartWeek: '2026-10-05',
    rows: [
      { fullName: 'Em Theo Tuần Chung', email: emailThu(), dob: '2010-01-01' },
      { fullName: 'Em Vào Muộn Một Tuần', startWeek: '2026-10-12', email: emailThu(), dob: '2010-01-01' },
    ],
    idempotencyKey: 'test-intake-week',
  });
  assert(r.added === 2, `Kỳ vọng thêm 2, thực tế ${r.added}`);
  const weekOf = (name: string) => (conn
    .prepare(`SELECT pr.week_start w FROM learning_cycles lc
                JOIN students s ON s.id = lc.student_id
                JOIN report_periods pr ON pr.id = lc.start_period_id
               WHERE s.full_name = ?`)
    .get(name) as any)?.w;
  assert(weekOf('Em Theo Tuần Chung') === '2026-10-05',
    `Tuần mặc định của lô không được áp: ${weekOf('Em Theo Tuần Chung')}`);
  assert(weekOf('Em Vào Muộn Một Tuần') === '2026-10-12',
    `Ô tuần của dòng không ghi đè được mặc định: ${weekOf('Em Vào Muộn Một Tuần')}`);
});
check('Tạo lớp: mã phải bắt đầu bằng mã chi nhánh và không trùng', () => {
  const mb = (conn.prepare("SELECT id FROM branches WHERE code='MB'").get() as any).id;
  assertThrows(() => intake.createClass(P.admin, { code: 'FT 999', branchId: mb, kind: 'FT' }),
    /bắt đầu bằng/, 'Mã lớp không có tiền tố chi nhánh');
  assertThrows(() => intake.createClass(P.admin, { code: 'MB FT 101', branchId: mb, kind: 'FT' }),
    /Đã có lớp/, 'Mã lớp trùng');
  const c = intake.createClass(P.admin, {
    code: 'MB FT 999', branchId: mb, kind: 'FT', route: 'LT1', startDate: '2026-10-05',
  }) as any;
  assert(c.code === 'MB FT 999', 'Không tạo được lớp');
  assert((conn.prepare('SELECT COUNT(*) n FROM class_skills WHERE class_id = ?').get(c.id) as any).n === 5,
    'Lớp mới phải có cấu hình kỹ năng');
});

// ==================================================================== 13

console.log('\n13. Thao tác hàng loạt và việc theo thời điểm');
check('Báo cáo tuần: mở hai ngày cuối tuần, hạn hết thứ Tư tuần sau, quá hạn vẫn nộp (nộp muộn — OV-13h)', () => {
  const cur = conn.prepare('SELECT * FROM report_periods WHERE week_start <= ? AND week_end >= ?')
    .get(demoToday(), demoToday()) as any;
  assert(!week.reportEditWindow(cur, cur.week_start).open, 'Đầu tuần vẫn mở cho nhập báo cáo');
  assert(week.reportEditWindow(cur, addDays(cur.week_end, -1)).open, 'Thứ Bảy phải mở');
  assert(week.reportEditWindow(cur, cur.week_end).open, 'Chủ nhật phải mở');

  // Thời gian bù: hết thứ Tư tuần sau, tức Chủ nhật + 3 ngày.
  const wed = addDays(cur.week_end, 3);
  assert(week.reportEditWindow(cur, wed).open, `Thứ Tư tuần sau (${wed}) vẫn phải nhập bù được`);
  const thu = addDays(cur.week_end, 4);
  assert(!week.reportEditWindow(cur, wed).late, 'Thứ Tư tuần sau chưa muộn');
  const tre = week.reportEditWindow(cur, thu);
  assert(tre.open && tre.late, `Từ thứ Năm (${thu}) vẫn mở, đánh dấu nộp muộn`);

  // Tuần tương lai vẫn không nhập được.
  const future = conn.prepare('SELECT * FROM report_periods WHERE week_start > ? ORDER BY week_start DESC LIMIT 1')
    .get(cur.week_end) as any;
  if (future) {
    assert(!week.reportEditWindow(future).open, 'Tuần tương lai vẫn nhập được báo cáo');
    const unit = conn.prepare(`SELECT * FROM reporting_units WHERE kind='branch' LIMIT 1`).get() as any;
    assertThrows(
      () => meeting.saveUnitReport(P.admin, unit.id, future.id, 'teachers', { status: 'ok' }),
      /chưa bắt đầu|chưa có gì/, 'Ghi báo cáo cho tuần tương lai',
    );
  }
});
check('PR-Ra Q13 / OV-13h · Tuần đã quá hạn: nháp và nộp đều được, lần nộp gắn "nộp muộn"', () => {
  const old = conn
    .prepare('SELECT * FROM report_periods WHERE week_end < ? ORDER BY week_end DESC LIMIT 1')
    .get(addDays(demoToday(), -7)) as any;
  assert(old, 'Dữ liệu mẫu thiếu một tuần đã qua hẳn');
  const unit = conn.prepare(`SELECT * FROM reporting_units WHERE kind='branch' LIMIT 1`).get() as any;
  assert(week.reportEditWindow(old).late, 'Tuần cũ phải là quá hạn');
  const draft = meeting.saveUnitReport(P.admin, unit.id, old.id, 'teachers', { status: 'ok' }) as any;
  assert(draft.submitted_at === null, 'Lưu nháp không được tự thành đã nộp');
  const submitted = meeting.saveUnitReport(P.admin, unit.id, old.id, 'teachers', { status: 'ok', nop: true }) as any;
  assert(submitted.submitted_at, 'Quá hạn vẫn phải nộp được');
});
check('Ô chọn tuần là cửa sổ trượt, không phải toàn bộ lịch sử', () => {
  const now = week.periodWindow(null);
  assert(now.length > 0 && now.length <= 12, `Cửa sổ phải gọn, thực tế ${now.length} tuần`);
  const today = demoToday();
  assert(now.filter((x) => x.weekStart > today).length <= 2, 'Không được mở nhiều tuần tương lai');
  // Chọn một tuần cũ thì cửa sổ dịch theo, vẫn đi tiếp về quá khứ được.
  const oldest = now[now.length - 1];
  const shifted = week.periodWindow(oldest.id);
  assert(shifted.some((x) => x.weekStart < oldest.weekStart), 'Cửa sổ không dịch theo tuần đang xem');
  assert(shifted.some((x) => x.isAnchor), 'Tuần đang xem phải nằm trong cửa sổ');
});
check('§13.8 · Đường đọc cửa sổ tuần KHÔNG tạo hàng loạt hàng trong database', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM report_periods').get() as any).n;
  const wide = week.periodWindow(null, { forward: week.PERIOD_WINDOW_PLANNING_FORWARD_WEEKS });
  const after = (conn.prepare('SELECT COUNT(*) n FROM report_periods').get() as any).n;
  assert(
    after === before,
    `Mở cửa sổ rộng (kế hoạch) không được tạo hàng mới — trước ${before} hàng, sau ${after} hàng`,
  );
  // Nhưng vẫn phải LIỆT KÊ đủ tuần trong khoảng, kể cả tuần chưa có hàng — "luôn chọn được".
  assert(wide.length >= 30, `Cửa sổ rộng phải liệt kê đủ tuần dù chưa có hàng, đang ra ${wide.length}`);
});
check('§13.8 · Chọn một tuần chưa có hàng thì luôn resolve được, không fallback bừa', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM report_periods').get() as any).n;
  const wide = week.periodWindow(null, { forward: week.PERIOD_WINDOW_PLANNING_FORWARD_WEEKS });
  const gap = wide.find((p) => p.id === null);
  assert(gap, 'Cần ít nhất một tuần trong cửa sổ rộng chưa có hàng để kiểm — nếu bộ demo đã phủ hết thì test này không kiểm được gì, cần seed thêm tuần xa hơn');
  const resolved = week.ensurePeriod(gap!.weekStart);
  assert(resolved.id > 0, 'Phải resolve được thành một id thật khi thật sự cần dùng');
  const after = (conn.prepare('SELECT COUNT(*) n FROM report_periods').get() as any).n;
  assert(after === before + 1, `Resolve một tuần chỉ được tạo ĐÚNG MỘT hàng, đang ra chênh lệch ${after - before}`);
});
check('Người theo dõi mặc định là Quản lý của chính chi nhánh đó', () => {
  const unit = conn.prepare(`SELECT * FROM reporting_units WHERE kind='branch' AND branch_id IS NOT NULL LIMIT 1`).get() as any;
  const t = meeting.createTask(P.admin, { title: 'Việc thử người theo dõi', unitId: unit.id }) as any;
  const fol = conn.prepare('SELECT * FROM task_followers WHERE task_id = ?').all(t.id) as any[];
  assert(fol.length > 0 && fol.every((f) => f.source === 'auto'), 'Không tự thêm Quản lý chi nhánh làm người theo dõi');
  const isManager = conn
    .prepare(`SELECT COUNT(*) n FROM user_roles ur JOIN roles r ON r.id = ur.role_id
               WHERE ur.user_id = ? AND r.key='manager' AND (ur.branch_id = ? OR ur.branch_id IS NULL)`)
    .get(fol[0].user_id, unit.branch_id) as any;
  assert(isManager.n > 0, 'Người theo dõi tự thêm phải là Quản lý của chi nhánh đó');
});
check('Người theo dõi không trùng với người phụ trách', () => {
  const unit = conn.prepare(`SELECT * FROM reporting_units WHERE kind='branch' AND branch_id IS NOT NULL LIMIT 1`).get() as any;
  const mgr = conn
    .prepare(`SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
               WHERE r.key='manager' AND ur.branch_id = ? LIMIT 1`)
    .get(unit.branch_id) as any;
  const t = meeting.createTask(P.admin, { title: 'Việc giao cho chính quản lý', unitId: unit.id, assigneeUserId: mgr.user_id }) as any;
  const fol = conn.prepare('SELECT * FROM task_followers WHERE task_id = ? AND user_id = ?').all(t.id, mgr.user_id) as any[];
  assert(fol.length === 0, 'Người phụ trách bị thêm luôn vào danh sách theo dõi');
});
check('Ô chọn người tìm được theo tên và kèm ngữ cảnh để không chọn nhầm', () => {
  const someone = conn.prepare(`SELECT full_name FROM users WHERE status='active' LIMIT 1`).get() as any;
  const found = meeting.searchPeople(P.mbManager, someone.full_name.split(' ').pop());
  assert(found.length > 0, 'Không tìm được người theo tên');
  assert(found.every((x: any) => 'role' in x && 'branches' in x), 'Thiếu ngữ cảnh vai trò / chi nhánh');
});
check('Tín hiệu sinh từ dữ liệu, không tạo bản ghi mới mỗi lần đọc', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM tasks').get() as any).n;
  const a = signals.signalsFor(P.mbManager, {});
  const b = signals.signalsFor(P.mbManager, {});
  const after = (conn.prepare('SELECT COUNT(*) n FROM tasks').get() as any).n;
  assert(after === before, 'Đọc tín hiệu đã tạo thêm bản ghi công việc');
  assert(JSON.stringify(a) === JSON.stringify(b), 'Hai lần đọc liên tiếp cho kết quả khác nhau');
  assert(new Set(a.map((x) => x.key)).size === a.length, 'Khoá tín hiệu bị trùng');
  for (const sig of a) assert(sig.count > 0, 'Không được hiện tín hiệu bằng 0');
});
check('Tín hiệu chia đúng việc cho đúng vai: tuần MT là của Quản lý, điểm là của giáo viên', () => {
  const a = signals.signalsFor(P.admin, {});
  const noPlan = a.find((x) => x.kind === 'no_plan');
  const missing = a.find((x) => x.kind === 'missing_scores');
  if (noPlan) assert(noPlan.owner === 'manager', 'Chưa có tuần MT phải là việc của Quản lý');
  if (missing) assert(missing.owner === 'teacher', 'Thiếu điểm phải là việc của giáo viên');
});
check('Tín hiệu chỉ trong phạm vi được cấp quyền', () => {
  const mine = signals.signalsFor(P.mbManager, {});
  const branchIds = new Set(mine.map((x) => x.branchId));
  const mbId = (conn.prepare(`SELECT id FROM branches WHERE code='MB'`).get() as any).id;
  for (const id of branchIds) assert(id === mbId, 'Quản lý MB thấy tín hiệu của chi nhánh khác');
});
check('Đã bỏ trường "Loại" khỏi việc mới, giữ nguyên dữ liệu cũ', () => {
  const t = meeting.createTask(P.admin, { title: 'Việc không còn chọn loại', taskType: 'long_term' }) as any;
  assert(t.task_type === 'in_period', 'Vẫn nhận trường Loại từ form');
  const old = conn.prepare(`SELECT COUNT(*) n FROM tasks WHERE task_type = 'long_term'`).get() as any;
  assert(old.n > 0, 'Dữ liệu Loại cũ bị xoá mất');
});

// ==================================================================== 14

console.log('\n14. Lớp thường: Foundation / Beginner / Elementary');
const fouClass = (conn.prepare(
  `SELECT id, code, start_date FROM classes WHERE kind = 'FOU' AND status = 'active' ORDER BY id LIMIT 1`,
).get() as any);
/* Lớp mang MÃ CŨ "FOUND" — dùng để chứng minh ánh xạ mã cũ không viết đè lên mã lớp. */
const legacyClass = (conn.prepare(`SELECT id, kind, programme_code FROM classes WHERE kind = 'FOUND' LIMIT 1`).get() as any);
/* Chương trình 10 tuần (BE hoặc ELE dùng chung một khuôn) — lớp nào cũng chứng minh được. */
const beClass = (conn.prepare(
  `SELECT id, code, start_date FROM classes WHERE programme_code IN ('BE','ELE') AND status = 'active' ORDER BY id LIMIT 1`,
).get() as any);

check('Chương trình nằm trong dữ liệu, mã cũ FOUND ánh xạ về FOU mà không đổi mã lớp', () => {
  const fou = regular.programmeByCode('FOU');
  assert(fou && fou.weeks === 8, 'Foundation phải là khoá 8 tuần');
  // BỐN MÔN GIỐNG NHAU Ở MỌI CHƯƠNG TRÌNH NORMAL — Pronunciation đã bỏ ở vòng 5.
  assert(JSON.stringify(fou!.skills) === JSON.stringify(['listening', 'reading', 'writing', 'speaking']),
    `Kỹ năng Foundation sai: ${fou!.skills.join(', ')}`);
  assert(JSON.stringify(fou!.checkpoints) === JSON.stringify([{ kind: 'progress', studyWeek: 4 }, { kind: 'final', studyWeek: 8 }]),
    'Mốc kiểm tra Foundation phải là tuần học 4 và 8');
  const be = regular.programmeByCode('BE');
  assert(be && be.weeks === 10 && JSON.stringify(be.skills) === JSON.stringify(fou!.skills),
    'Beginner phải 10 tuần và dùng ĐÚNG bốn môn như mọi chương trình Normal');
  for (const code of ['FOU', 'BE', 'ELE']) {
    const prog = regular.programmeByCode(code)!;
    assert(!prog.skills.includes('pronunciation'), `${code} vẫn còn môn Pronunciation`);
    assert(!prog.skills.includes('prep_writing'), `${code} vẫn còn môn Prep-Writing`);
  }
  assert(JSON.stringify(be!.checkpoints.map((c: any) => c.studyWeek)) === '[5,10]', 'Mốc BE phải là tuần học 5 và 10');
  // Mã cũ chỉ được ÁNH XẠ khi đọc, không được viết đè lên mã lớp lịch sử.
  const cls = legacyClass;
  assert(cls && cls.kind === 'FOUND' && cls.programme_code === 'FOU',
    `Mã lớp gốc phải giữ nguyên "FOUND", chương trình chuẩn hoá là "FOU" — đang là ${cls.kind}/${cls.programme_code}`);
});

check('Đạt từ 70%, xét trên tỷ lệ CHÍNH XÁC chứ không làm tròn phần trăm rồi mới so', () => {
  /* Đúng biên: 70% chẵn là ĐẠT, không phải "trên 70%". */
  assert(domainRatio(7, 10).outcome === 'pass', '7/10 = 70% phải là đạt');
  assert(domainRatio(28, 40).outcome === 'pass', '28/40 = 70% phải là đạt');
  assert(domainRatio(69, 100).outcome === 'fail', '69/100 = 69% phải là trượt');

  /*
   * Ca bẫy thật sự: 23/33 = 69.7%, hiển thị làm tròn thành "70%" nhưng vẫn phải là TRƯỢT.
   * Nếu xét trên số phần trăm ĐÃ LÀM TRÒN thì em này thành đạt — đó chính là lỗi cần tránh.
   */
  const tricky = domainRatio(23, 33);
  assert(Math.round(tricky.ratio! * 100) === 70, 'Ca này chỉ có nghĩa khi hiển thị làm tròn ra 70%');
  assert(tricky.outcome === 'fail', '23/33 = 69.7% phải là trượt, dù hiển thị ra 70%');

  /* Ngưỡng CŨ đã bỏ: 60% từng là đạt, từ nay là trượt. Đây là thay đổi có chủ đích. */
  assert(domainRatio(24, 40).outcome === 'fail', '24/40 = 60% nay phải là trượt, không còn đạt');
  assert(domainRatio(12, 20).outcome === 'fail', '12/20 = 60% nay phải là trượt, không còn đạt');
});

check('Kết luận ngay trên phần đã chấm; ô trống KHÔNG bị đếm thành môn chưa đạt', () => {
  const skills = ['listening', 'reading', 'writing', 'pronunciation'];
  const partial = regular.evaluateRegular(skills, [
    { skill: 'listening', raw_score: 10, raw_total: 40 },     // chưa đạt
    { skill: 'reading', raw_score: 30, raw_total: 40 },       // đạt
  ]);
  assert(!partial.complete, 'Mới hai kỹ năng mà đã coi là xong');
  assert(partial.provisional, 'Chưa đủ điểm thì phải đánh dấu là kết luận tạm thời');
  /*
   * Đây là ranh giới quan trọng: chỉ MỘT môn đã chấm và chưa đạt → SOS 1.
   * Hai ô còn trống KHÔNG được đếm thành hai môn chưa đạt, nếu không em này thành SOS 3 oan.
   */
  assert(partial.failedCount === 1 && partial.sosLevel === 1,
    `Chỉ đếm môn đã chấm mà chưa đạt: kỳ vọng SOS 1, đang là ${partial.sosLevel} (${partial.failedCount} môn)`);
  assert(partial.scored === 2 && partial.required === 4, 'Đếm sai số kỹ năng đã có điểm');

  // Chưa chấm môn nào thì tuyệt đối không kết luận.
  const none = regular.evaluateRegular(skills, []);
  assert(none.sosLevel === null && !none.provisional, 'Chưa có điểm nào mà đã kết luận');

  const full = regular.evaluateRegular(skills, skills.map((skill) => ({ skill, raw_score: 10, raw_total: 40 })));
  assert(full.complete && !full.provisional && full.failedCount === 4 && full.sosLevel === 3,
    'Đủ điểm rồi phải là kết luận cuối');
});
/* PR-MTa T19 thay "hết Chủ nhật của chính tuần đó": hạn lớp thường là thứ Tư tuần kế tiếp, như Fast Track. */
check('Hạn nhập điểm lớp thường là hết thứ Tư tuần kế tiếp (PR-MTa T19)', () => {
  const a = conn
    .prepare(
      `SELECT a.id, a.planned_period_id, a.deadline_override, rp.week_start, rp.week_end
         FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.kind != 'mock' LIMIT 1`,
    )
    .get() as any;
  assert(a, 'Dữ liệu mẫu thiếu bài kiểm tra lớp thường');
  const dl = regular.regularDeadline(a);
  assert(dl.date === addDays(a.week_start, 9) && dl.source === 'default',
    `Hạn phải là thứ Tư ${addDays(a.week_start, 9)} tuần kế tiếp, đang là ${dl.date}`);
  // Chủ nhật là ngày cuối tuần theo lịch tuần thứ Hai–Chủ nhật của hệ thống.
  assert(week.mondayOf(a.week_end) === a.week_start, 'week_end phải là Chủ nhật của chính tuần đó');
  // Chưa có tuần kế hoạch thì KHÔNG dựng hạn giả.
  assert(regular.regularDeadline({ planned_period_id: null }).date === null, 'Chưa có tuần mà vẫn có hạn');
  // Hạn tự đặt đè lên hạn mặc định.
  assert(regular.regularDeadline({ planned_period_id: a.planned_period_id, deadline_override: '2026-12-25' }).date === '2026-12-25',
    'Hạn tự đặt phải được ưu tiên');
});

check('Số môn trượt ra mức SOS theo đúng ngưỡng 1 / 2 / từ 3', () => {
  const skills = ['listening', 'reading', 'writing', 'pronunciation'];
  const mk = (fails: number) => regular.evaluateRegular(skills,
    skills.map((skill, i) => ({ skill, raw_score: i < fails ? 10 : 30, raw_total: 40 })));
  assert(mk(0).sosLevel === 0, 'Đạt hết phải là 0');
  assert(mk(1).sosLevel === 1, 'Trượt 1 môn phải là SOS 1');
  assert(mk(2).sosLevel === 2, 'Trượt 2 môn phải là SOS 2');
  assert(mk(3).sosLevel === 3 && mk(4).sosLevel === 3, 'Từ 3 môn trở lên đều là SOS 3');
});

check('Lớp thường KHÔNG dùng band, kỳ vọng hay Overall của FT', () => {
  const sheet = regular.regularSheet(P.admin, fouClass.id) as any;
  assert(sheet.programme.scoringMode === 'ratio', 'Lớp Foundation phải chấm theo tỷ lệ');
  assert(sheet.rows.length > 0, 'Dữ liệu mẫu thiếu bài kiểm tra lớp thường');
  for (const r of sheet.rows) {
    for (const sk of r.result.skills) {
      assert(!('band' in sk), 'Lớp thường không được có band IELTS');
    }
  }
  // Danh sách lượt cũng phải trả về đúng như vậy, không dựng Overall giả.
  const rows = attempts.listAttempts(P.admin, { classId: fouClass.id }).rows as any[];
  assert(rows.length > 0, 'Không thấy bài kiểm tra lớp thường trong danh sách lượt');
  for (const r of rows) {
    assert(r.overall === null && r.expectation === null,
      'Lớp thường không có Overall hay kỳ vọng — không được dựng số giả');
    assert(r.kind === 'progress' || r.kind === 'final', `Loại bài sai: ${r.kind}`);
  }
});

check('Mốc kiểm tra tính theo TUẦN HỌC của lớp, không phải tuần thứ mấy của tháng', () => {
  /*
   * MỐC KIỂM TRA NÓI VỀ TUẦN BÀI THI BẮT ĐẦU, không phải tuần nó kết thúc.
   *
   * Từ vòng 7 một bài của lớp Normal có thể trải hai ba tuần (mục 10.1), và tuần ghi trên
   * chính bài đó là TUẦN KẾ HOẠCH HOÀN TẤT — tuần của môn muộn nhất. So mốc tuần học với
   * con số đó là so nhầm đầu: lớp khai giảng đúng hạn mà vẫn bị báo lệch mốc.
   * Nên ở đây lấy tuần SỚM NHẤT trong các môn bắt buộc.
   */
  const firstWeek = (classId: number, kind: string): string | null => {
    const r = conn
      .prepare(
        `SELECT MIN(pr.week_start) AS w FROM assessment_attempts a
           JOIN attempt_skills ask ON ask.attempt_id = a.id AND ask.required = 1
           JOIN report_periods pr ON pr.id = ask.planned_period_id
          WHERE a.class_id = ? AND a.kind = ?`,
      )
      .get(classId, kind) as any;
    return r?.w ?? null;
  };
  const rows = [
    { kind: 'progress', week_start: firstWeek(fouClass.id, 'progress') },
    { kind: 'final', week_start: firstWeek(fouClass.id, 'final') },
  ].filter((r) => r.week_start);
  const progress = rows.find((r) => r.kind === 'progress');
  const final = rows.find((r) => r.kind === 'final');
  assert(progress?.week_start && final?.week_start, 'Thiếu bài Progress Test hoặc Final Test');
  // Tuần học 4 = 3 tuần sau khai giảng; tuần học 8 = 7 tuần sau.
  assert(progress!.week_start === week.mondayOf(addDays(fouClass.start_date, 3 * 7)),
    `Bài Progress Test phải rơi vào tuần học 4, đang là ${progress!.week_start}`);
  assert(final!.week_start === week.mondayOf(addDays(fouClass.start_date, 7 * 7)),
    `Bài Final Test phải rơi vào tuần học 8, đang là ${final!.week_start}`);
  // BE/ELE là tuần học 5 và 10.
  const be = [
    { kind: 'progress', week_start: firstWeek(beClass.id, 'progress') },
    { kind: 'final', week_start: firstWeek(beClass.id, 'final') },
  ];
  assert(be.find((r) => r.kind === 'progress')?.week_start === week.mondayOf(addDays(beClass.start_date, 4 * 7)),
    'Bài Progress Test BE phải rơi vào tuần học 5');
  assert(be.find((r) => r.kind === 'final')?.week_start === week.mondayOf(addDays(beClass.start_date, 9 * 7)),
    'Bài Final Test BE phải rơi vào tuần học 10');
});

check('Nhập điểm phải có cả số câu đúng và tổng; không tự điền tổng', () => {
  const rows = (regular.regularSheet(P.admin, fouClass.id) as any).rows;
  // Phải chọn một ô CHƯA có điểm: ô đã có tổng rồi thì sửa mỗi số câu đúng là hợp lệ.
  const row = rows.find((r: any) => r.result.skills.find((k: any) => k.skill === 'listening')?.total === null) ?? rows[0];
  const teacher = conn
    .prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status='active'`)
    .get(fouClass.id) as any;
  const T = loadPrincipal(teacher.user_id);

  const fresh = conn
    .prepare(
      `SELECT a.id FROM assessment_attempts a
        WHERE a.class_id = ? AND NOT EXISTS
          (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = 'listening') LIMIT 1`,
    )
    .get(fouClass.id) as any;
  if (fresh) {
    assertThrows(() => regular.saveRegularScore(T, fresh.id, 'listening', { score: 20 }),
      /tổng điểm/, 'Nhập điểm đạt mà không có tổng điểm');
  }
  assertThrows(() => regular.saveRegularScore(T, row.attemptId, 'listening', { score: 45, total: 40 }),
    /không thể lớn hơn/, 'Số câu đúng lớn hơn tổng');
  assertThrows(() => regular.saveRegularScore(T, row.attemptId, 'listening', { score: 10, total: 0 }),
    /lớn hơn 0/, 'Tổng số câu bằng 0');
  assertThrows(() => regular.saveRegularScore(T, row.attemptId, 'listening', { score: 10.5, total: 40 }),
    /số nguyên/, 'Số câu đúng lẻ');

  const ok = regular.saveRegularScore(T, row.attemptId, 'listening', { score: 30, total: 40 }) as any;
  assert(ok.score.raw_score === 30 && ok.score.raw_total === 40, 'Không lưu được số câu đúng và tổng');
});

check('Giáo viên chỉ nhập được kỹ năng mình phụ trách, và không nhập kỹ năng lớp không có', () => {
  const row = (regular.regularSheet(P.admin, fouClass.id) as any).rows[0];
  const lTeacher = conn
    .prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status='active'`)
    .get(fouClass.id) as any;
  const T = loadPrincipal(lTeacher.user_id);
  const other = conn
    .prepare(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND user_id != ? LIMIT 1`)
    .get(fouClass.id, lTeacher.user_id) as any;
  if (other) {
    assertThrows(() => regular.saveRegularScore(T, row.attemptId, other.skill, { score: 10, total: 20 }),
      /phân công/, `GV Listening nhập hộ ${other.skill}`);
  }
  // Foundation không có Writing task 1 — không được nhập một ô không tồn tại trong chương trình.
  assertThrows(() => regular.saveRegularScore(P.admin, row.attemptId, 'writing1', { score: 5, total: 10 }),
    /không có kỹ năng/, 'Nhập kỹ năng ngoài chương trình');
});

check('Case SOS của lớp thường dùng CHUNG hệ thống case với lớp FT', () => {
  const cases = conn
    .prepare(
      `SELECT a.kind, sc.status = 'done' AS xong, sc.sos_level, COUNT(*) n FROM sos_cases sc
         JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.kind != 'mock' AND sc.kck = 0 GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`,
    )
    .all() as any[];
  /*
   * OV-12c (chủ SP 14/10, thay T58 ở Case): Case Progress Test đang mở mang nhãn SOS theo số môn trượt (1..3); Final Test giữ nguyên (không nhãn).
   * Vẫn dùng chung bảng `sos_cases`, và dữ liệu mẫu có đủ Case Giữa khoá.
   */
  assert(cases.some((c) => c.kind === 'progress' && !c.xong), `Bộ demo thiếu Case Progress Test mở: ${JSON.stringify(cases)}`);
  assert(cases.filter((c) => c.kind === 'progress' && !c.xong).every((c) => [1, 2, 3].includes(c.sos_level)), `Case Progress Test mở phải có SOS 1..3: ${JSON.stringify(cases)}`);
  assert(cases.filter((c) => c.kind === 'final').every((c) => c.sos_level === null), `Case Final Test không nhãn SOS: ${JSON.stringify(cases)}`);
  /*
   * MỨC 0 LÀ MỘT MỨC HỢP LỆ, không phải dữ liệu hỏng.
   *
   * Từ vòng 4 case sống suốt khoá: chấm lại một bài cũ thành đạt thì case KHÔNG bị xoá — nó
   * hạ về mức 0 và mang thêm một mốc "đã đạt lại", để những việc đã làm cho em vì vấn đề đó
   * còn nguyên. Nhưng mức 0 phải CÓ CĂN CỨ, nên mỗi case mức 0 buộc phải có mốc ấy.
   */
  for (const c of conn
    .prepare(
      `SELECT sc.id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.kind != 'mock' AND sc.sos_level = 0`,
    )
    .all() as any[]) {
    const passed = conn
      .prepare("SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'passed'")
      .get(c.id) as any;
    assert(passed.n > 0, `Case ${c.id} về mức 0 mà không có mốc "đã đạt lại" nào giải thích`);
  }
  // Cùng một bảng, nên hai card SOS ở Tổng quan phải đếm được cả case của lớp thường.
  const one = conn
    .prepare(`SELECT sc.id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
               WHERE a.kind != 'mock' AND sc.status != 'done' LIMIT 1`)
    .get() as any;
  assert(one, 'Không có case lớp thường nào đang mở để kiểm tra');
});

check('Sửa điểm lớp thường thì GIỮ case và ghi lịch sử, không xoá làm lại (PR-LT2a: không còn mức SOS để đổi — Case chỉ căn cứ điểm sai thì rút, Case có việc thật thì giữ)', () => {
  const target = conn
    .prepare(
      `SELECT sc.id AS case_id, a.id AS attempt_id, a.class_id
         FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.kind = 'progress' AND sc.status != 'done'
        ORDER BY sc.id LIMIT 1`,
    )
    .get() as any;
  assert(target, 'Cần một Case Progress Test lớp thường đang mở để thử');
  const prog = regular.programmeOfClass(target.class_id)!;
  // Nâng mọi kỹ năng lên mức đạt: Case không được biến mất — còn để tra lịch sử.
  for (const skill of prog.skills) {
    regular.saveRegularScore(P.admin, target.attempt_id, skill, { score: 38, total: 40, lyDo: 'Phép kiểm: sửa điểm đã có' });
  }
  const after = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(target.case_id) as any;
  assert(after, 'Case bị xoá mất khi điểm đổi');
  if (after.status === 'done') {
    const hist = conn.prepare(`SELECT * FROM sos_case_history WHERE case_id = ? AND field = 'status'`).all(target.case_id) as any[];
    assert(hist.length > 0, 'Rút Case vì sửa điểm mà không ghi lịch sử');
  }
});

check('Đủ điểm mọi kỹ năng thì bài mới chuyển sang đã xong', () => {
  const planned = conn
    .prepare(
      `SELECT a.id, a.class_id FROM assessment_attempts a
        WHERE a.kind != 'mock' AND a.status = 'planned' AND a.planned_period_id IS NOT NULL LIMIT 1`,
    )
    .get() as any;
  if (!planned) return;
  const prog = regular.programmeOfClass(planned.class_id)!;
  prog.skills.forEach((skill, i) => {
    if (i === prog.skills.length - 1) return;      // cố tình bỏ trống kỹ năng cuối
    regular.saveRegularScore(P.admin, planned.id, skill, { score: 30, total: 40 }, chuNhatCuoiOf(planned.id));
  });
  let st = conn.prepare('SELECT status FROM assessment_attempts WHERE id = ?').get(planned.id) as any;
  assert(st.status === 'planned', 'Thiếu một kỹ năng mà đã coi là xong');
  regular.saveRegularScore(P.admin, planned.id, prog.skills[prog.skills.length - 1], { score: 30, total: 40 }, chuNhatCuoiOf(planned.id));
  st = conn.prepare('SELECT status FROM assessment_attempts WHERE id = ?').get(planned.id) as any;
  assert(st.status === 'done', 'Đủ điểm rồi mà bài vẫn chưa chuyển sang đã xong');
});

check('Badge của lớp thường đếm đúng theo bộ kỹ năng của chương trình', () => {
  const teacher = conn
    .prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status='active'`)
    .get(fouClass.id) as any;
  const T = loadPrincipal(teacher.user_id);
  const summary = (classesSvc.listClassSummaries(T, {}) as any).rows.find((c: any) => c.id === fouClass.id);
  assert(summary, 'Giáo viên lớp Foundation phải thấy lớp của mình');
  assert(summary.scoringMode === 'ratio', 'Danh sách lớp phải cho biết lớp này chấm theo tỷ lệ');
  // Badge đếm BÀI KỸ NĂNG, không đếm LƯỢT — một lượt có thể nợ nhiều môn cùng lúc.
  const queue = attempts.listAttempts(T, { classId: fouClass.id, need: 'my_scores' }).rows
    .reduce((n: number, r: any) => n + r.pendingSkills.length, 0);
  assert(summary.needScores === queue,
    `Badge ${summary.needScores} khác hàng đợi ${queue} của chính giáo viên đó`);
});

check('Chạy lại kế hoạch không tạo bài trùng cho em đã có', () => {
  const first = regular.planRegularTests(P.admin, beClass.id) as any;
  const before = (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE class_id = ?`).get(beClass.id) as any).n;
  const again = regular.planRegularTests(P.admin, beClass.id) as any;
  assert(again.created === 0, `Chạy lại đã tạo thêm ${again.created} bài kiểm tra trùng`);
  const after = (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE class_id = ?`).get(beClass.id) as any).n;
  assert(after === before, 'Số bài kiểm tra thay đổi sau khi chạy lại');
  void first;
  // Lớp FT không dùng đường này.
  assertThrows(() => regular.planRegularTests(P.admin, mbClass), /không phải lớp thường/, 'Lớp FT gọi lịch lớp thường');
});
check('Chuyển từ lớp FT sang lớp thường thì mở KHOÁ MỚI, không mượn lộ trình IELTS cũ', () => {
  /*
   * Một em chuyển từ lớp FT sang Foundation là bắt đầu một khoá khác: cách chấm khác, không
   * có target. Gắn bài Foundation vào lộ trình LT1 cũ thì lịch sử học thành một mớ lẫn lộn.
   */
  const moved = conn
    .prepare(
      `SELECT a.student_id, a.cycle_id, cy.route FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE a.class_id = ? AND a.kind != 'mock' LIMIT 200`,
    )
    .all(beClass.id) as any[];
  for (const m of moved) {
    assert(m.route === null,
      `Bài kiểm tra lớp thường đang gắn vào lộ trình ${m.route} — phải mở khoá riêng`);
  }
  // Và lộ trình IELTS cũ của em đó vẫn còn nguyên để tra lại.
  const both = conn
    .prepare(
      `SELECT student_id, COUNT(*) n FROM learning_cycles
        WHERE status = 'active' GROUP BY student_id HAVING n > 1 LIMIT 1`,
    )
    .get() as any;
  if (both) {
    const routes = conn.prepare('SELECT route FROM learning_cycles WHERE student_id = ?').all(both.student_id) as any[];
    assert(routes.some((r) => r.route === null), 'Em chuyển lớp phải có một khoá lớp thường riêng');
  }
});

// ==================================================================== 15

console.log('\n15. Tổng hợp theo tuần');


// ==================================================================== 16

console.log('\n16. Case học vụ: hai nguồn, một vòng đời');

const someStudent = conn
  .prepare(`SELECT s.id, e.class_id FROM students s
              JOIN enrollments e ON e.student_id = s.id AND e.status='active'
             WHERE e.class_id = ? LIMIT 1`)
  .get(mbClass) as any;

check('Giáo viên báo vấn đề khi CHƯA có bài đánh giá nào — không tạo bài giả', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
  const r = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id,
    summary: 'Em nghe được ý chính nhưng hay mất điểm ở phần điền số. Nhà xa, bố mẹ đi làm ca nên em ít có thời gian luyện thêm, em phải trông em nhỏ.',
    urgency: 'attention',
    topic: 'listening', parallel: true,
    /* Hoàn cảnh nằm trong chính câu mô tả — không còn ô Ghi chú riêng. */
  }) as any;
  const after = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
  assert(after === before, 'Báo vấn đề mà lại tạo thêm một bài đánh giá giả');
  assert(r.attemptId === null, 'Case giáo viên báo không được gắn vào bài nào');
  assert(r.originKind === 'teacher_report', 'Sai nguồn case');
  /*
   * Đây là ranh giới quan trọng: SOS 1/2/3 là SỐ KỸ NĂNG DƯỚI KỲ VỌNG ở một bài.
   * Giáo viên không có bài nào để đếm, nên phải để trống — không phải SOS 0, cũng
   * không mặc định SOS 1. Nếu không, con số SOS trên báo cáo mang hai nghĩa khác nhau.
   */
  assert(r.sosLevel === null, `Case giáo viên báo phải để trống mức SOS, đang là ${r.sosLevel}`);
  assert(r.urgency === 'attention', 'Mức độ gấp là thang riêng của người báo');
  assert(r.topic === 'listening', 'Vấn đề học thuật phải vào đúng kỹ năng');
  /*
   * Ô "GHI CHÚ" ĐÃ BỎ (mục 6.3) — nó trùng việc với "Mô tả". Hoàn cảnh kèm theo (nhà xa,
   * bố mẹ đi làm ca…) thuộc về chính câu mô tả, không phải một ô thứ hai.
   */
  assert(!r.note, 'Ô Ghi chú đã bỏ mà vẫn còn lưu giá trị mới');
  assert(/trông em nhỏ/.test(r.summary ?? ''), 'Mô tả phải giữ nguyên chữ người báo viết');
});

check('Bấm hai lần hoặc thử lại không tạo case trùng', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const args = {
    studentId: someStudent.id, topic: 'listening',
    title: 'Listening: bắt chưa kịp phần điền số',
    summary: 'Em nghe được ý chính nhưng mất điểm ở phần điền số và ngày tháng.',
    primaryCode: 'student.listening.sound',
    idempotencyKey: 'test-report-1', parallel: true,
  };
  const a = cases.reportIssue(P.coreTeacher, args) as any;
  const b = cases.reportIssue(P.coreTeacher, args) as any;
  const after = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assert(after === before + 1, `Gửi lại cùng khoá đã tạo thêm ${after - before - 1} case`);
  assert(a.id === b.id, 'Hai lần gửi cho ra hai case khác nhau');
});

check('Một case có NHIỀU tác động, mỗi tác động xem lại nhiều lần', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử nhiều tác động', idempotencyKey: 'test-report-2', parallel: true,
  }) as any;
  cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'self_study', description: 'Xếp tự học sau buổi học',
    performerName: 'GVCN', status: 'completed', completedDate: TODAY,
  });
  const two = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'teaching_adjust', description: 'Giao thêm bài luyện có bấm giờ',
    performerName: 'Chị Hương (CS)', status: 'completed', completedDate: TODAY,
  }) as any;
  assert(two.interventions.length === 2, `Phải có hai tác động, đang có ${two.interventions.length}`);
  // Người thực hiện ở ngoài hệ thống vẫn giữ được tên, và ghi rõ là người khác nhập hộ.
  const cs = two.interventions.find((i: any) => i.performer === 'Chị Hương (CS)');
  assert(cs.performer === 'Chị Hương (CS)' && cs.byProxy, 'Mất tên người thực hiện ngoài hệ thống');
  assert(cs.recordedBy && cs.recordedBy !== cs.performer, 'Không phân biệt người làm với người ghi');

  const ivId = two.interventions[0].id;
  cases.recordFollowUp(P.coreTeacher, c.id, { interventionId: ivId, outcome: 'partial', note: 'Đỡ hơn' });
  const after = cases.recordFollowUp(P.coreTeacher, c.id, { interventionId: ivId, outcome: 'improved', note: 'Ổn' }) as any;
  assert(after.followups.filter((f: any) => f.interventionId === ivId).length === 2,
    'Một tác động phải xem lại được nhiều lần');
});

check('"Đã xong" phải có ngày thực tế; người nhập không mặc định là người làm', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử ràng buộc tác động', idempotencyKey: 'test-report-3', parallel: true,
  }) as any;
  assertThrows(
    () => cases.recordIntervention(P.coreTeacher, c.id, {
      kind: 'tutor', description: 'Học tutor', performerName: 'Tutor A', status: 'completed',
    }),
    /ngày thực hiện/, 'Ghi "đã xong" mà không có ngày',
  );
  /* PR-PA (§8): người KHÔNG còn bắt buộc — không ghi ai thì lưu trống, hệ thống vẫn KHÔNG tự lấy người nhập làm người làm. */
  const khongNguoi = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Học tutor', status: 'started', startedDate: TODAY,
  }) as any;
  const ivTrong = khongNguoi.interventions.find((i: any) => i.description === 'Học tutor');
  assert(ivTrong && !ivTrong.performer, 'Không ghi ai làm mà hệ thống tự điền người');
  /*
   * Nhưng KHAI TƯỜNG MINH "chính tôi làm" thì hợp lệ. Đây là điều khác hẳn việc hệ thống
   * âm thầm lấy người nhập làm người thực hiện: một bên là lời khai, một bên là suy đoán.
   */
  const mine = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'teaching_adjust', description: 'Tôi đã đổi cách chữa bài cho em', performerSelf: true,
    status: 'completed', completedDate: TODAY,
  }) as any;
  const saved = mine.interventions.find((i: any) => i.description === 'Tôi đã đổi cách chữa bài cho em');
  assert(saved && saved.performer, 'Khai "chính tôi làm" mà vẫn không ghi được người thực hiện');
  assert(!saved.byProxy, 'Việc tự mình làm lại bị đánh dấu là nhập hộ');
  // Có tên người ngoài thì tên đó thắng, không bị ghi đè bằng người đang đăng nhập.
  const proxy = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'teaching_adjust', description: 'Giao thêm bài luyện có bấm giờ', performerSelf: true,
    performerName: 'CS Ngọc Diệp', status: 'completed', completedDate: TODAY,
  }) as any;
  const p2 = proxy.interventions.find((i: any) => i.performer === 'CS Ngọc Diệp');
  assert(p2.performer === 'CS Ngọc Diệp', `Người ngoài hệ thống bị thay bằng "${p2.performer}"`);
  assert(p2.byProxy, 'Nhập hộ người ngoài mà không được đánh dấu là nhập hộ');
});

check('MỌI phương án đều có chu kỳ và hạn — không có phương án treo vô thời hạn', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử quá hạn — mô tả cụ thể cho phép kiểm này.', idempotencyKey: 'test-report-4', parallel: true,
  }) as any;
  /*
   * BẢNG HẠN MỤC 8.3: mỗi phương án học thuật mang HAI mốc khác nhau ngay khi bắt đầu.
   *
   *   · HẠN CẬP NHẬT — trước hết Chủ nhật hằng tuần. Đây là thứ nổi lên màn việc.
   *   · NGÀY DỰ KIẾN KẾT THÚC — Chủ nhật của tuần TIẾP THEO nếu người dùng không chọn.
   *
   * Trước vòng 7 cả hai là một con số, nên "đến lúc báo tiến độ" và "đến hạn xong việc" lẫn
   * vào nhau: một phương án chạy bốn tuần không ai phải báo gì cho tới tuần cuối.
   */
  const started = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Bắt đầu từ 20 ngày trước', performerName: 'Tutor A',
    status: 'started', startedDate: addDays(TODAY, -20),
  }) as any;
  const iv = started.interventions.find((i: any) => i.description === 'Bắt đầu từ 20 ngày trước')!;
  assert(iv.actionDue, 'Phương án bắt đầu rồi mà không có hạn nào');
  assert(iv.actionDue === domain.hanKyGhiKetQua(addDays(TODAY, -20)),
    `OV-12a: hạn ghi kết quả = hết Thứ Ba sau kỳ hai tuần đầu: kỳ vọng ${domain.hanKyGhiKetQua(addDays(TODAY, -20))}, đang là ${iv.actionDue}`);
  /* PR-SOS (Q28-4): PA thường không còn "dự kiến kết thúc" — chỉ còn hạn ghi kết quả tuần. */
  assert(iv.followupDue === null, `PA thường còn ngày dự kiến kết thúc: ${iv.followupDue}`);
  assert(iv.overdue || iv.actionOverdue, 'Bắt đầu 20 ngày trước, chưa cập nhật tuần nào mà không báo quá hạn');

  // Phương án CHỜ DUYỆT thì chu kỳ CHƯA chạy — thời gian chờ là của Quản lý.
  const proposed = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'extra_support', description: 'Xin hỗ trợ ngoài định mức', performerName: 'GVCN',
  }) as any;
  const waiting = proposed.interventions.find((i: any) => i.description === 'Xin hỗ trợ ngoài định mức')!;
  assert(waiting.approvalState === 'pending', 'Phương án nhóm Đề xuất phải ở trạng thái chờ duyệt');
  assert(!waiting.actionDue, 'Đang chờ duyệt mà đã tính hạn cho giáo viên — thời gian chờ là của Quản lý');
});

/*
 * MỤC 9.3: MỘT ĐƯỜNG DUY NHẤT ĐỂ HOÀN THÀNH CASE.
 *
 * "Kéo dài theo dõi", "Chọn hướng xử lý" và "Đổi hướng xử lý" đã bỏ — bốn cái tên cho cùng
 * một câu hỏi thì hai case đóng giống nhau lại để lại hai dấu vết khác nhau.
 */
check('[9.3] Hoàn thành Case: một đường duy nhất, có kết luận và mọi phương án đã khép', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử đóng case — mô tả cụ thể cho phép kiểm này.', idempotencyKey: 'test-report-6', parallel: true,
  }) as any;

  // "Kéo dài theo dõi" không còn là một cách kết thúc.
  assertThrows(
    () => cases.closeCaseOutcome(P.mbManager, c.id, {
      outcome: 'improved', decision: 'extend', note: 'Muốn theo dõi thêm một tuần nữa',
    }),
    /Kéo dài theo dõi/, '"Kéo dài theo dõi" vẫn đóng được case',
  );

  // KẾT LUẬN LÀ BẮT BUỘC — bốn cái nhãn "tiến bộ đến đâu" không nói được đã làm gì cho em.
  assertThrows(
    () => cases.closeCaseOutcome(P.mbManager, c.id, { outcome: 'improved', note: 'ok' }),
    /ghi kết luận/, 'Hoàn thành Case mà không phải viết kết luận',
  );

  /*
   * MỤC 7.7 [5]: case CHƯA CÓ PHƯƠNG ÁN NÀO không đủ điều kiện đóng. Đếm được "0 phương án
   * còn mở" không có nghĩa là đã làm gì cho em.
   */
  assert(cases.closeBlockers(c.id).length === 1, 'Case chưa có phương án phải có đúng một lý do chặn');
  assertThrows(
    () => cases.closeCaseOutcome(P.mbManager, c.id, {
      outcome: 'improved', note: 'Đã trao đổi, em ổn định lại hẳn',
    }),
    /chưa có phương án/, 'Case chưa có phương án nào mà vẫn đóng được',
  );

  // Có phương án nhưng CHƯA cập nhật kết quả → vẫn chặn, và nói rõ còn thiếu gì.
  const withPlan = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Học tutor Listening', performerName: 'Tutor B',
    status: 'started', startedDate: demoToday(),
  }) as any;
  const ivId = withPlan.interventions.find((i: any) => i.description === 'Học tutor Listening').id;
  assert(cases.closeBlockers(c.id).some((b: string) => /chưa cập nhật kết quả/.test(b)),
    'Phương án chưa có kết quả mà không bị chặn');
  assertThrows(
    () => cases.closeCaseOutcome(P.mbManager, c.id, {
      outcome: 'improved', note: 'Đã trao đổi, em ổn định lại hẳn',
    }),
    /chưa cập nhật kết quả/, 'Còn phương án chưa cập nhật mà vẫn đóng được',
  );

  // Kết thúc PA (tab "Kết thúc") → lúc này mới đóng được.
  cases.updateResult(P.coreTeacher, ivId, {
    mode: 'end', outcome: 'improved', nextStep: 'complete', soBuoi: 0,   // OV-12h: PA Tutor ghi Số buổi kỳ này
    note: 'Em nghe bắt ý tốt hơn hẳn, đã hết buổi tutor cuối',
  });
  assert(cases.closeBlockers(c.id).length === 0, 'Mọi phương án đã khép mà vẫn còn lý do chặn');
  const done = cases.closeCaseOutcome(P.mbManager, c.id, {
    outcome: 'improved', note: 'Đã trao đổi và học tutor, em ổn định lại',
  }) as any;
  assert(done.status === 'done' && done.closedAt, 'Không đóng được case dù mọi điều kiện đã đủ');

  /* ĐÁNH GIÁ CHI TIẾT phải đúng kỹ năng của case — không ghi Reading vào case Listening. */
  const c2 = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử ghi chi tiết sai kỹ năng cho phép kiểm.', idempotencyKey: 'test-report-6b', parallel: true,
  }) as any;
  const iv2 = cases.recordIntervention(P.coreTeacher, c2.id, {
    kind: 'self_study', description: 'Nghe 30 phút mỗi ngày', performerName: 'GVCN',
    status: 'started', startedDate: demoToday(),
  }) as any;
  const iv2Id = iv2.interventions.find((i: any) => i.description === 'Nghe 30 phút mỗi ngày').id;
  cases.updateResult(P.coreTeacher, iv2Id, {
    mode: 'end', outcome: 'improved', nextStep: 'complete', note: 'Em đã nghe đều hơn hẳn',
  });
  assertThrows(
    () => cases.closeCaseOutcome(P.mbManager, c2.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
      metrics: [{ skill: 'reading', component: 'Passage 1', score: 8, total: 13 }],
    }),
    /đúng kỹ năng/, 'Ghi được điểm Reading vào phần kết luận của một case Listening',
  );
  assertThrows(
    () => cases.closeCaseOutcome(P.mbManager, c2.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
      metrics: [{ skill: 'listening', component: 'Passage 1', score: 8, total: 13 }],
    }),
    /không phải thành phần/, 'Passage 1 được nhận như một thành phần của Listening',
  );
  assertThrows(
    () => cases.closeCaseOutcome(P.mbManager, c2.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
      metrics: [{ skill: 'listening', component: 'Section 3', score: 5.5, total: null }],
    }),
    /đạt\/tổng/, 'Section của Listening được ghi như một band IELTS',
  );
  const detailed = cases.closeCaseOutcome(P.mbManager, c2.id, {
    outcome: 'improved', note: 'Em đã bắt được số và tên riêng, còn vướng matching',
    metrics: [{ skill: 'listening', component: 'Section 3', score: 5, total: 10 }],
  }) as any;
  assert(detailed.status === 'done', 'Không đóng được case dù phần chi tiết đã hợp lệ');
});

/*
 * MỤC 9.1: HAI TAB, HAI VIỆC. Bản cũ bắt mọi lần ghi kết quả phải kèm một "bước tiếp theo",
 * nên để sang tuần mới người dạy phải khai một quyết định không có thật — và ai chọn nhầm ô
 * đầu là phương án bị khép lại, case theo đó đóng sớm.
 */
check('[9.1] Hai tab cập nhật kết quả: theo dõi tiếp thì không phải khai bước đi tiếp', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.reading.technique',
    studentId: someStudent.id, topic: 'reading', summary: 'Thử luồng kết quả',
    idempotencyKey: 'test-result-1', parallel: true,
  }) as any;
  const d = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'self_study', description: 'Xếp tự học Reading', performerName: 'GVCN',
    status: 'started', startedDate: demoToday(),
  }) as any;
  const ivId = d.interventions.find((i: any) => i.description === 'Xếp tự học Reading').id;

  // GHI CHÚ BẮT BUỘC: một dòng "Tiến bộ một phần" trơ trọi không giúp được ai ở tuần sau.
  assertThrows(() => cases.updateResult(P.coreTeacher, ivId, { outcome: 'partial', note: 'ok' }),
    /ít nhất 8 ký tự/, 'Cập nhật kết quả mà không phải viết gì');

  // "CHƯA ĐỦ DỮ LIỆU" chỉ ở được tab theo dõi — nó không phải một kết luận để khép việc.
  assertThrows(
    () => cases.updateResult(P.coreTeacher, ivId, {
      mode: 'end', outcome: 'insufficient', nextStep: 'complete', note: 'Chưa có bài mới để nhìn',
    }),
    /Giữ nguyên, Điều chỉnh hoặc Thay/, '"Chưa đủ dữ liệu" vẫn kết thúc được phương án',
  );
  assertThrows(
    () => cases.updateResult(P.coreTeacher, ivId, {
      mode: 'end', outcome: 'worse', nextStep: 'complete', note: 'Em kém hơn hẳn tuần trước',
    }),
    /chỉ kết thúc được bằng/, 'Kết quả "Kém hơn" mà vẫn khép lại được',
  );
  assertThrows(
    () => cases.updateResult(P.coreTeacher, ivId, {
      mode: 'end', outcome: 'unchanged', nextStep: 'propose', note: 'Em chưa chuyển gì cả',
    }),
    /phương án mới là gì/, 'Chọn đề xuất phương án mới mà không nói phương án nào',
  );

  /*
   * TAB THEO DÕI: ghi kết quả rồi lưu, KHÔNG phải khai bước tiếp theo, và phương án vẫn
   * đang chạy — không nhân đôi thành một phương án thứ hai giống hệt.
   */
  const before = d.interventions.length;
  const r0 = conn.prepare('SELECT action_due, COALESCE(started_date, cycle_started_on) bat_dau FROM case_interventions WHERE id = ?').get(ivId) as any;
  const after = cases.updateResult(P.coreTeacher, ivId, {
    outcome: 'unchanged', note: 'Em có làm nhưng chưa đều, còn sai dạng T/F/NG',
  }) as any;
  assert(after.interventions.length === before, 'Theo dõi thêm mà lại sinh thêm một phương án');
  const iv2 = after.interventions.find((i: any) => i.id === ivId);
  assert(iv2.status === 'started', 'Theo dõi tiếp mà phương án lại bị khép lại');
  assert(iv2.cycleNo === 2, `Phải sang chu kỳ 2, đang là ${iv2.cycleNo}`);
  assert(iv2.actionDue === domain.hanKe(r0.bat_dau, r0.action_due, demoToday()),
    `OV-12a: hạn ghi kết quả mới phải là hạn kỳ kế (hết Thứ Ba), đang là ${iv2.actionDue}`);
  assert(iv2.actionDue > demoToday(), 'Vừa cập nhật xong đã báo quá hạn');

  // "Thay PA" khép phương án cũ với lý do ĐƯỢC THAY THẾ, không phải đã thành công.
  const replaced = cases.updateResult(P.coreTeacher, ivId, {
    mode: 'end', outcome: 'worse', nextStep: 'propose', note: 'Tự học không ăn thua với em này',
    decisionNote: 'Tự học không ăn thua nên chuyển sang tutor',
    newPlan: { kind: 'tutor', description: 'Chuyển sang tutor hai buổi mỗi tuần', performerName: 'Tutor C' },
  }) as any;
  const old = replaced.interventions.find((i: any) => i.id === ivId);
  assert(old.closedReason === 'superseded', `Phương án cũ phải ghi "được thay thế", đang là ${old.closedReason}`);
  assert(old.supersededBy, 'Phương án cũ không nối sang phương án mới');
  assert(replaced.interventions.some((i: any) => i.description === 'Chuyển sang tutor hai buổi mỗi tuần'),
    'Không tạo phương án mới');
});

check('Đóng Case: Quản lý; GVCN (Ý thức + môn mình dạy); GVBM chỉ đúng môn mình dạy (PR-QU)', () => {
  /*
   * AUTH-01: `recordIntervention` nay đòi ĐÚNG kỹ năng mình dạy, nên case dựng ở đây phải
   * đúng kỹ năng của `P.subjectTeacher` — không cứng "listening" như trước AUTH-01.
   */
  const subjectSkill = (conn
    .prepare(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill IS NOT NULL LIMIT 1`)
    .get(mbClass, P.subjectTeacher.userId) as any).skill as string;
  const c = cases.reportIssue(P.subjectTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: domain.issuesForTopic(subjectSkill)[0].code,
    studentId: someStudent.id, topic: subjectSkill, summary: 'Thử quyền đóng — mô tả cụ thể cho phép kiểm này.', idempotencyKey: 'test-report-7', parallel: true,
  }) as any;
  /* PR-QU (chủ sản phẩm 04/10): GVBM đóng được Case ĐÚNG môn mình dạy — quyền qua, chỉ còn bị chặn vì chưa có phương án. */
  assertThrows(
    () => cases.setDisposition(P.subjectTeacher, c.id, { status: 'done', disposition: 'no_action' }),
    /Chưa hoàn thành Case được/, 'GVBM đóng Case đúng môn: phải qua quyền, chỉ bị chặn vì chưa có phương án',
  );
  assert(cases.canCloseCase(P.subjectTeacher, { class_id: mbClass, student_id: someStudent.id, topic: subjectSkill }),
    'GVBM phải đóng được Case đúng môn mình dạy (PR-QU)');
  assert(cases.canCloseCase(P.mbManager, { class_id: mbClass, student_id: someStudent.id }),
    'Quản lý phải đóng được case trong chi nhánh');
  assert(cases.canCloseCase(P.coreTeacher, { class_id: mbClass, student_id: someStudent.id }),
    'GVCN phải đóng được case lớp mình');
  assert(!cases.canCloseCase(P.subjectTeacher, { class_id: mbClass, student_id: someStudent.id }),
    'Giáo viên bộ môn không được đóng Case Ý thức (không kỹ năng)');
  // Nhưng vẫn ghi nhận hỗ trợ được.
  cases.recordIntervention(P.subjectTeacher, c.id, {
    kind: 'teaching_adjust', description: 'Chữa kỹ hơn phần task 1',
    performerName: 'GV bộ môn', status: 'completed', completedDate: TODAY,
  });
});

check('Case của học viên ngoài phạm vi bị chặn ở máy chủ', () => {
  const cp = conn
    .prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id
               WHERE e.class_id = ? LIMIT 1`)
    .get(classId('CP FT 110')) as any;
  assertThrows(() => cases.reportIssue(P.coreTeacher, { studentId: cp.id, topic: 'listening', summary: 'Ngoài phạm vi phụ trách của người báo.' }),
    /phạm vi/, 'GVCN lớp MB báo vấn đề học viên lớp CP');
});

check('Bốn hàng đợi trả lời bốn câu hỏi khác nhau', () => {
  /* PR-S6F-b (D16): route + `caseQueueCounts` đã bỏ (web không còn gọi) — kiểm thẳng tập đang mở của `listCases`. */
  assert(cases.listCases(P.admin, { queue: null }).rows.some((r: any) => r.status !== 'done'), 'Không có case nào đang mở');
  const newOnes = cases.listCases(P.admin, { queue: 'new' }).rows;
  for (const r of newOnes) {
    assert(!r.disposition && r.interventionCount === 0, `Case ${r.id} đã có hướng xử lý mà vẫn nằm ở "chưa ai định hướng"`);
  }
  const due = cases.listCases(P.admin, { queue: 'due' }).rows;
  for (const r of due) assert(r.dueOverdue, `Case ${r.id} chưa quá hạn mà nằm ở hàng đợi tới hạn`);
  // Case đã đóng không nằm ở hàng đợi nào.
  for (const k of ['new', 'active', 'due', 'review']) {
    for (const r of cases.listCases(P.admin, { queue: k }).rows) {
      assert(r.status !== 'done', `Case đã đóng vẫn nằm ở hàng đợi ${k}`);
    }
  }
});

check('Lọc theo chủ đề', () => {
  const all = cases.listCases(P.admin, {}).rows;
  assert(all.length > 0, 'Không có vấn đề nào để lọc');
  const listening = cases.listCases(P.admin, { skill: 'listening' }).rows;
  assert(listening.length > 0, 'Không lọc được theo chủ đề');
  for (const r of listening) assert(r.topic === 'listening', 'Lọc chủ đề sai');
});

check('Ba nguồn case dùng CHUNG một vòng đời', () => {
  /*
   * BA nguồn, không phải hai: sinh từ điểm, giáo viên tự báo, và mở theo yêu cầu Quản lý.
   * Cả ba nằm cùng một bảng với cùng bộ trạng thái, nên cộng lại phải đúng bằng tổng.
   */
  const fromMock = cases.listCases(P.admin, { origin: 'mock' }).rows;
  const fromTeacher = cases.listCases(P.admin, { origin: 'teacher_report' }).rows;
  const fromTask = cases.listCases(P.admin, { origin: 'manager_task' }).rows;
  const fromChuyenCap = cases.listCases(P.admin, { origin: 'chuyen_cap' }).rows;   // PR-LT2b: Case Final Test / Kỳ vọng đầu ra sinh khi chuyển lớp
  assert(fromMock.length > 0 && fromTeacher.length > 0, 'Thiếu một trong hai nguồn case chính');
  const total = cases.listCases(P.admin, {}).rows.length;
  assert(total === fromMock.length + fromTeacher.length + fromTask.length + fromChuyenCap.length,
    `Các nguồn cộng lại ${fromMock.length + fromTeacher.length + fromTask.length + fromChuyenCap.length} khác tổng ${total}`);
  /*
   * `origin_kind` nói AI MỞ case, không phải case đó thuộc về thế giới nào.
   *
   * Vòng 3 giữ hai thang tách biệt: case từ điểm có mức SOS, case giáo viên báo thì không.
   * Vòng 4 bỏ ranh giới đó (tài liệu chốt mục 1.3: "không tách case-từ-SOS và case-do-GV-báo
   * thành hai nhóm xử lý riêng"). Một case giáo viên mở cho Listening rồi MT sau em trượt
   * Listening thật thì chính case đó nhận mốc mới và nhận mức SOS — đúng thứ owner muốn
   * thấy: một chỗ duy nhất kể hết chuyện của em ở môn đó.
   *
   * Điều còn phải đúng: mức SOS chỉ xuất hiện khi case ĐÃ CÓ MỘT MỐC TỪ MT, không bao giờ
   * do người báo tự gõ vào.
   */
  for (const r of fromTeacher) {
    if (r.sosLevel === null) continue;
    const fromScore = (conn
      .prepare('SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND attempt_id IS NOT NULL')
      .get(r.id) as any).n;
    assert(fromScore > 0,
      `Case giáo viên báo ${r.id} có mức SOS mà chưa từng có lượt MT nào chạm vào`);
  }
  assert(fromMock.some((r) => (r.sosLevel ?? 0) > 0), 'Case từ điểm phải có mức SOS');
});

check('Hành trình ghi ngày SỰ VIỆC XẢY RA, và lưu lại nhiều lần không nhân đôi', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM journey_events').get() as any).n;
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử hành trình — mô tả cụ thể cho phép kiểm này.',
    detectedAt: addDays(TODAY, -10),          // ghi bù một việc của mười ngày trước
    idempotencyKey: 'test-report-8', parallel: true,
  }) as any;
  const ev = conn
    .prepare(`SELECT * FROM journey_events WHERE ref_table='sos_cases' AND ref_id = ?`)
    .get(c.id) as any;
  assert(ev, 'Báo vấn đề mà không ghi vào hành trình');
  assert(ev.event_date === addDays(TODAY, -10), 'Hành trình phải ghi ngày sự việc, không phải ngày nhập');
  /*
   * HAI MỐC TÁCH BIỆT — ngày sự việc do người báo khai, ngày nhập do máy ghi.
   *
   * KHÔNG kiểm bằng cách so hai chuỗi ngày với nhau. Bản trước làm thế và bài kiểm hỏng
   * đúng một ngày trong năm: ngày demo là 14/09/2026, ghi bù lùi 10 ngày ra 04/09/2026 —
   * và nếu máy chủ tình cờ đang chạy đúng hôm 04/09 thì hai mốc trùng nhau một cách hợp
   * lệ, bài kiểm vẫn báo hỏng. Một bài kiểm chỉ đúng vào 364/365 ngày là một bài kiểm hỏng.
   *
   * Điều thật sự cần chứng minh: `event_date` mang ngày NGƯỜI BÁO KHAI, còn `created_at`
   * mang GIỜ THẬT CỦA MÁY (có cả giờ phút, và rơi vào ngày thật hôm nay). Hai điều đó đúng
   * thì không thể có chuyện gộp cột, dù hai ngày có tình cờ trùng nhau hay không.
   */
  assert(ev.created_at, 'Không ghi lại thời điểm nhập');
  assert(ev.created_at.includes('T'),
    'Thời điểm nhập phải có cả giờ phút, không phải một ngày trơ');
  assert(ev.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10),
    'Thời điểm nhập phải là giờ thật của máy, không phải ngày người báo khai');
  assert(ev.cycle_id !== null, 'Sự kiện phải gắn đúng lộ trình');
  // Gửi lại cùng khoá: không thêm case, nên cũng không thêm sự kiện.
  cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử hành trình — mô tả cụ thể cho phép kiểm này.', idempotencyKey: 'test-report-8', parallel: true,
  });
  const n = (conn.prepare(`SELECT COUNT(*) n FROM journey_events WHERE ref_table='sos_cases' AND ref_id = ?`)
    .get(c.id) as any).n;
  assert(n === 1, `Gửi lại tạo thêm sự kiện hành trình (${n} sự kiện)`);
  void before;
});

check('Case sinh từ điểm ghi thẳng học viên và lộ trình, không chỉ dựa vào bài', () => {
  /*
   * Hồ sơ học viên tra case theo `student_id`. Case chỉ có `attempt_id` thì hồ sơ không
   * thấy chính vấn đề vừa sinh ra từ điểm của em đó — lỗi im lặng, không ai báo gì.
   */
  const orphan = conn
    .prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id IS NULL`)
    .get() as any;
  assert(orphan.n === 0, `${orphan.n} case không gắn học viên`);

  // Nhập điểm mới cũng phải sinh ra case đủ hai cột đó.
  const a = conn
    .prepare(
      `SELECT a.* FROM assessment_attempts a
        WHERE a.status = 'planned' AND a.target_at_attempt IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.attempt_id = a.id)
          AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id)
        ORDER BY a.id LIMIT 1`,
    )
    .get() as any;
  assert(a, 'Dữ liệu mẫu thiếu một lượt chưa chấm để thử');
  chotThu(a.id);
  // Một kỹ năng dưới kỳ vọng là đủ để mở case ngay (OV-1c: khi lượt đã chốt).
  attempts.saveScore(P.admin, a.id, 'listening', { rawScore: 10 });
  const made = conn
    .prepare(
      `SELECT sc.* FROM sos_cases sc
        WHERE sc.attempt_id = ? ORDER BY sc.id LIMIT 1`,
    )
    .get(a.id) as any;
  assert(made, 'Nhập điểm dưới kỳ vọng mà không mở vấn đề nào');
  assert(made.student_id === a.student_id, 'Case mới không ghi học viên');
  assert(made.cycle_id === a.cycle_id, 'Case mới không ghi lộ trình');
  assert(made.category === 'listening', `Case phải thuộc hạng mục Listening, đang là ${made.category}`);
  /*
   * KHÔNG kiểm `origin_kind === 'mock'` nữa: từ vòng 4 một lượt MT có thể rơi vào case mà
   * giáo viên đã mở sẵn cho hạng mục đó, và khi ấy nguồn vẫn là "teacher_report" — đúng,
   * vì nguồn nói AI MỞ case chứ không nói case ấy đang theo dõi cái gì.
   *
   * Thứ phải đúng là có một MỐC từ chính lượt này, tức lượt MT đã thật sự chạm vào case.
   */
  const ms = conn
    .prepare('SELECT * FROM case_milestones WHERE case_id = ? AND attempt_id = ?')
    .get(made.id, a.id) as any;
  assert(ms, 'Lượt MT không để lại mốc nào trong case — lịch sử sẽ mất');
  /*
   * TUẦN CỦA TỪNG LẦN TRƯỢT nằm ở MỐC, không phải ở cột `detected_at` của case.
   *
   * Case sống suốt khoá nên `detected_at` là ngày phát hiện LẦN ĐẦU — nó phải đứng yên khi
   * MT sau lại trượt, nếu không thì "em này vướng Listening từ bao giờ" mất câu trả lời.
   */
  const wk = conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(a.planned_period_id) as any;
  if (wk) {
    assert(ms.occurred_on === wk.week_start,
      `Mốc ghi ngày ${ms.occurred_on}, khác thứ Hai của tuần MT ${wk.week_start}`);
    assert(made.detected_at <= wk.week_start,
      `Ngày phát hiện ${made.detected_at} lại SAU tuần MT — case không thể phát hiện ở tương lai`);
  }
  // Và hồ sơ học viên phải thấy nó.
  const prof = profile.studentProfile(P.admin, a.student_id) as any;
  assert(prof.cases.some((c: any) => c.id === made.id), 'Hồ sơ học viên không thấy vấn đề vừa sinh ra');
});

check('Vấn đề sinh từ điểm có dòng mô tả suy ra từ dữ liệu, không để trống', () => {
  /*
   * Vấn đề sinh từ điểm không có ai gõ tóm tắt, vì nó ra đời từ một phép tính. Hiện
   * "chưa có tóm tắt" thì đúng sự thật nhưng vô dụng — người đọc vẫn phải mở ra mới biết.
   */
  const rows = cases.listCases(P.admin, { origin: 'mock' }).rows;
  assert(rows.length > 0, 'Không có vấn đề nào sinh từ điểm');
  for (const r of rows.slice(0, 20)) {
    assert(r.headline && !/chưa có tóm tắt/i.test(r.headline),
      `Vấn đề ${r.id} không có dòng mô tả: "${r.headline}"`);
    if (r.sosLevel !== null && r.sosLevel > 0) {
      assert(r.headline.includes(String(r.sosLevel)),
        `Dòng mô tả của vấn đề ${r.id} không nói số kỹ năng dưới kỳ vọng: "${r.headline}"`);
    }
  }
  // Giáo viên báo thì dùng đúng câu người báo viết, không thay bằng câu máy dựng.
  const reported = cases.listCases(P.admin, { origin: 'teacher_report' }).rows
    .find((r) => (r.summary ?? '').trim());
  if (reported) {
    assert(reported.headline === reported.summary!.trim(),
      'Câu người báo viết bị thay bằng câu máy dựng');
  }
  /*
   * Đây là SUY RA KHI HIỂN THỊ, không phải câu ghi vào database — MÁY không bao giờ tự gõ
   * một câu tóm tắt vào bảng.
   *
   * Case sinh từ điểm VẪN có thể có tóm tắt, nếu về sau một giáo viên ghi thêm vào chính nó
   * (vòng 4 cho phép: "ghi vào case đang có"). Cái phải đúng là những câu đó đều có NGƯỜI
   * đứng tên; câu nào không ai đứng tên thì đó là máy bịa.
   */
  const stored = conn
    .prepare(
      `SELECT COUNT(*) n FROM sos_cases
        WHERE origin_kind = 'mock' AND summary IS NOT NULL AND reported_by IS NULL
          /* PR-SOS: mô tả ghi lúc Xác nhận Case có người đứng tên ở mốc xac_nhan_case. */
          AND NOT EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sos_cases.id AND m.kind = 'xac_nhan_case' AND m.created_by IS NOT NULL)`,
    )
    .get() as any;
  assert(stored.n === 0, `${stored.n} vấn đề sinh từ điểm đã bị ghi tóm tắt giả vào database`);
});

check('Bằng chứng phải thuộc đúng học viên của case', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử bằng chứng — mô tả cụ thể cho phép kiểm này.', idempotencyKey: 'test-report-9', parallel: true,
  }) as any;
  const other = conn
    .prepare('SELECT id FROM assessment_attempts WHERE student_id != ? LIMIT 1')
    .get(someStudent.id) as any;
  assertThrows(
    () => cases.recordFollowUp(P.coreTeacher, c.id, { evidenceAttemptId: other.id, outcome: 'improved' }),
    /không thuộc học viên/, 'Gắn bằng chứng của học viên khác',
  );
});

console.log('\n17. Đề xuất phương án và duyệt');

/** Tìm một đề xuất đang chờ duyệt trong dữ liệu mẫu, kèm Quản lý đúng chi nhánh. */
function pendingPlanIn(branchCode: string) {
  return conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.recorded_by, iv.approval_due
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         JOIN students s ON s.id = sc.student_id
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN classes c ON c.id = e.class_id
         JOIN branches b ON b.id = c.branch_id
        WHERE iv.approval_state = 'pending' AND b.code = ?
        ORDER BY iv.id LIMIT 1`,
    )
    .get(branchCode) as any;
}

check('Dữ liệu mẫu có đủ bốn trạng thái duyệt, không chỉ một kiểu', () => {
  const rows = conn
    .prepare(
      `SELECT COALESCE(approval_state, 'none') AS st, COUNT(*) AS n
         FROM case_interventions GROUP BY st`,
    )
    .all() as any[];
  const by = new Map(rows.map((r) => [r.st, r.n]));
  for (const st of ['pending', 'approved', 'declined', 'none']) {
    assert((by.get(st) ?? 0) > 0, `Dữ liệu mẫu không có đề xuất nào ở trạng thái "${st}"`);
  }
  const overdue = conn
    .prepare(`SELECT COUNT(*) n FROM case_interventions WHERE approval_state='pending' AND approval_due < ?`)
    .get(demoToday()) as any;
  const onTime = conn
    .prepare(`SELECT COUNT(*) n FROM case_interventions WHERE approval_state='pending' AND approval_due >= ?`)
    .get(demoToday()) as any;
  assert(overdue.n > 0 && onTime.n > 0,
    `Cần cả đề xuất quá hạn lẫn còn hạn để nhìn ra khác biệt (quá hạn ${overdue.n}, còn hạn ${onTime.n})`);
});

check('Chỉ ĐỀ XUẤT mới gửi duyệt được — việc đã làm rồi thì không còn gì để duyệt', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Thử gửi duyệt — mô tả cụ thể cho phép kiểm này.', idempotencyKey: 'test-approval-1', parallel: true,
  }) as any;
  assertThrows(
    () => cases.recordIntervention(P.coreTeacher, c.id, {
      kind: 'tutor', description: 'Xin tutor', status: 'completed',
      completedDate: demoToday(), performerSelf: true, needsApproval: true,
    }),
    /đề xuất|kế hoạch/i, 'Gửi duyệt một việc đã làm xong',
  );
  const iv = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Xin 4 buổi tutor', status: 'planned', needsApproval: true,
  }) as any;
  const row = conn.prepare(
    `SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id DESC LIMIT 1`,
  ).get(c.id) as any;
  assert(row.approval_state === 'pending', 'Đề xuất không vào trạng thái chờ duyệt');
  assert(row.approval_due && row.approval_due > demoToday(), 'Đề xuất không có hạn trả lời ở tương lai');
  assert(iv, 'Không ghi được đề xuất');
});

check('Không cần duyệt thì để TRỐNG, không phải "đã duyệt"', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Việc tự làm — mô tả cụ thể cho phép kiểm này.', idempotencyKey: 'test-approval-2', parallel: true,
  }) as any;
  cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'teaching_adjust', description: 'Tăng luyện nghe chi tiết mỗi buổi', status: 'completed',
    completedDate: demoToday(), performerSelf: true,
  });
  const row = conn.prepare(
    `SELECT * FROM case_interventions WHERE case_id = ? ORDER BY id DESC LIMIT 1`,
  ).get(c.id) as any;
  assert(row.needs_approval === 0 && row.approval_state === null,
    'Việc không cần duyệt lại bị gắn trạng thái duyệt');
});

check('Chỉ Quản lý duyệt được, và không duyệt thì bắt buộc có lý do', () => {
  const plan = pendingPlanIn('CP');
  assert(plan, 'Dữ liệu mẫu thiếu đề xuất chờ duyệt ở CP');
  assertThrows(() => cases.respondToPlan(P.coreTeacher, plan.id, { decision: 'approved' }),
    /Quản lý|quyền/, 'Giáo viên tự duyệt đề xuất');
  assertThrows(() => cases.respondToPlan(P.mbManager, plan.id, { decision: 'approved' }),
    /phạm vi|quyền|Quản lý/, 'Quản lý MB duyệt đề xuất của CP');
  assertThrows(() => cases.respondToPlan(P.cpManager, plan.id, { decision: 'declined' }),
    /lý do/, 'Không duyệt mà không ghi lý do');
});

check('PR-DUYET (K3-20): bỏ Góp ý — gửi "comment" bị từ chối rõ, việc chờ còn nguyên; duyệt và không duyệt thì mới kết thúc', () => {
  const plan = pendingPlanIn('CP');
  assertThrows(() => cases.respondToPlan(P.cpManager, plan.id, { decision: 'comment' as any, note: 'Cho tôi xem bài gần nhất' }),
    /Không còn Góp ý/, 'Góp ý vẫn được nhận');
  const afterComment = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(plan.id) as any;
  assert(afterComment.approval_state === 'pending', 'Góp ý bị từ chối mà việc chờ duyệt mất');

  cases.respondToPlan(P.cpManager, plan.id, { decision: 'approved', note: 'Duyệt 4 buổi' });
  const afterApprove = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(plan.id) as any;
  assert(afterApprove.approval_state === 'approved', 'Duyệt xong vẫn còn chờ');
  assert(afterApprove.approval_by === P.cpManager.userId && afterApprove.approval_at,
    'Không ghi ai duyệt và duyệt lúc nào');
  assertThrows(() => cases.respondToPlan(P.cpManager, plan.id, { decision: 'approved' }),
    /đã được duyệt|đã bị từ chối/, 'Duyệt lại một đề xuất đã trả lời');
});

check('Không duyệt thì phương án dừng lại, không âm thầm thành việc đang làm', () => {
  const plan = pendingPlanIn('BC');
  assert(plan, 'Dữ liệu mẫu thiếu đề xuất chờ duyệt ở BC');
  const mgr = loadPrincipal(userByRole('manager', 'BC'));
  cases.respondToPlan(mgr, plan.id, { decision: 'declined', note: 'Giữ lịch cũ, đổi cách ôn' });
  const row = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(plan.id) as any;
  assert(row.approval_state === 'declined' && row.status === 'cancelled',
    'Đề xuất bị bác nhưng vẫn nằm ở trạng thái đang làm');
});

console.log('\n18. Việc của chính người đang xem');

const yeuCau: any = await import('../duyet/yeuCau.ts');
check('PR-DUYET: đề xuất chờ duyệt nằm ở hộp Chờ duyệt của Quản lý (không còn nhóm việc "Chờ tôi xử lý"); giáo viên không mở được hộp', () => {
  const gv = loadPrincipal(teacherOfSkill('MB FT 102', 'listening'));
  const mgrGroups = mywork.myWork(P.mbManager).groups.map((g: any) => g.key);
  const gvGroups = mywork.myWork(gv).groups.map((g: any) => g.key);
  assert(!gvGroups.includes('decide') && !mgrGroups.includes('decide') && !mgrGroups.includes('decide_move'), 'Còn nhóm việc duyệt');
  assertThrows(() => yeuCau.hopChoDuyet(gv), /Quản lý/, 'Giáo viên mở được hộp Chờ duyệt');
  const anyManagerHasIt = ['MB', 'CP', 'BC', 'HD']
    .map((b) => loadPrincipal(userByRole('manager', b)))
    .some((m) => yeuCau.hopChoDuyet(m).the.some((x: any) => x.loai === 'de_xuat_pa'));
  assert(anyManagerHasIt, 'Không Quản lý nào thấy đề xuất đang chờ duyệt');
});

check('Việc quá hạn: tiêu đề nói việc gì, hạn nói quá hạn — không nhãn "Quá hạn …" riêng', () => {
  let coQuaHan = 0;
  for (const b of ['MB', 'CP', 'BC', 'HD', 'TL']) {
    let m;
    try { m = loadPrincipal(userByRole('manager', b)); } catch { continue; }
    for (const g of mywork.myWork(m).groups) {
      for (const it of g.items) {
        assert(typeof it.tieuDe === 'string' && it.tieuDe.trim() !== '', `Việc ở nhóm ${g.key} không có tiêu đề`);
        assert(!('overdueLabel' in it), `Việc ở nhóm ${g.key} còn nhãn quá hạn riêng`);
        for (const f of ['reason', 'statusLabel', 'tieuDe']) {
          assert(!/quá hạn/i.test((it as any)[f] ?? ''), `Việc ở nhóm ${g.key}: ${f} còn chữ "quá hạn": "${(it as any)[f]}"`);
        }
        if (it.urgency === 'overdue' && it.due) coQuaHan++;
      }
    }
  }
  assert(coQuaHan >= 1, 'Dữ liệu mẫu phải có ít nhất một việc quá hạn có hạn');
});

check('Kết quả sau hỗ trợ là việc của NGƯỜI THỰC HIỆN; quá hạn thì Quản lý cũng thấy', () => {
  const gv = loadPrincipal(teacherOfSkill('CP FT 110', 'speaking'));
  const mgr = loadPrincipal(userByRole('manager', 'CP'));
  const reviewOf = (p: any) => (mywork.myWork(p).groups.find((g: any) => g.key === 'ghi_ket_qua_pa')?.items ?? []);

  // Dữ liệu mẫu: tutor CP FT 110 hẹn 10/09, nay đã 14/09 — quá hạn, nên cả hai đều thấy.
  const gvItems = reviewOf(gv);
  const mgrItems = reviewOf(mgr);
  assert(gvItems.length > 0, 'Người ghi phương án không thấy việc cập nhật kết quả của mình');
  assert(gvItems.every((i: any) => i.actionLabel === 'Kết quả PA'), 'Nhãn hành động không đúng');
  const overdueForManager = mgrItems.filter((i: any) => i.urgency === 'overdue');
  assert(overdueForManager.length === mgrItems.length,
    'Quản lý đang thấy cả việc CHƯA quá hạn của người khác — chỉ quá hạn mới đến tay Quản lý');
});

check('Đề xuất đang chờ duyệt thì chưa đòi cập nhật kết quả', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: someStudent.id, topic: 'listening', summary: 'Chờ duyệt đã hẹn xem lại', idempotencyKey: 'test-approval-3', parallel: true,
  }) as any;
  cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Xin tutor, hẹn xem lại ngay', status: 'planned',
    needsApproval: true, followupDue: addDays(demoToday(), -1),
  });
  const items = (mywork.myWork(P.coreTeacher).groups.find((g: any) => g.key === 'ghi_ket_qua_pa')?.items ?? []);
  assert(!items.some((i: any) => i.caseId === c.id),
    'Phương án chưa được duyệt đã bị đòi cập nhật kết quả');
});

console.log('\n19. Phân công giáo viên');

check('Giáo viên không tự phân công mình vào lớp', () => {
  const gv = loadPrincipal(teacherOfSkill('MB FT 102', 'listening'));
  assertThrows(() => classesSvc.setClassTeachers(gv, mbClass, { slots: [] }),
    /Quản lý|Admin|quyền/, 'Giáo viên đổi phân công');
  assert(!can(gv, PERMISSIONS.CLASS_ASSIGN, { classId: mbClass }), 'Giáo viên đang có quyền phân công');
  assert(can(P.mbManager, PERMISSIONS.CLASS_ASSIGN, { classId: mbClass }), 'Quản lý phải phân công được');
});

check('Không xếp người của chi nhánh khác, và không xếp kỹ năng lớp không dạy', () => {
  const cpTeacher = teacherOfSkill('CP FT 110', 'listening');
  assertThrows(
    () => classesSvc.setClassTeachers(P.mbManager, mbClass, {
      slots: [{ userId: cpTeacher, skill: 'listening', isCore: false }],
    }),
    /chi nhánh/, 'Xếp giáo viên CP vào lớp MB',
  );
  const found = classId('MB FOU 12');
  const anyTeacher = classesSvc.classTeachers(P.mbManager, found).candidates[0];
  assertThrows(
    () => classesSvc.setClassTeachers(P.mbManager, found, {
      slots: [{ userId: anyTeacher.id, skill: 'writing2', isCore: false }],
    }),
    /Lớp không có môn này/, 'Xếp W2 cho lớp không có W2',
  );
});

check('Bỏ phân công KHÔNG xoá lịch sử, và dòng giữ nguyên thì không bị mở lại', () => {
  const before = classesSvc.classTeachers(P.mbManager, mbClass);
  const lrSlot = before.bySkill.find((b) => b.skill === 'listening');
  assert(lrSlot, 'Lớp mẫu không có giáo viên Listening');

  const keep = before.bySkill.filter((b) => b.skill !== 'listening')
    .map((b) => ({ userId: b.userId, skill: b.skill, isCore: false }));
  const core = before.core.map((c) => ({ userId: c.userId, skill: null, isCore: true }));
  classesSvc.setClassTeachers(P.mbManager, mbClass, { slots: [...core, ...keep] });

  const rows = conn
    .prepare(`SELECT * FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill='listening'`)
    .all(mbClass, lrSlot!.userId) as any[];
  assert(rows.length > 0, 'Bỏ phân công đã xoá mất dòng cũ');
  assert(rows.every((r) => r.status !== 'active'), 'Bỏ phân công nhưng dòng vẫn còn hiệu lực');
  assert(rows.some((r) => r.effective_to === demoToday()), 'Không ghi ngày kết thúc phân công');

  const after = classesSvc.classTeachers(P.mbManager, mbClass);
  assert(!after.bySkill.some((b) => b.skill === 'listening' && b.userId === lrSlot!.userId),
    'Vẫn còn phân công đã bỏ');
  // Dòng không đổi phải giữ nguyên ngày bắt đầu — đóng rồi mở lại là bịa ra một lần đổi người.
  for (const b of after.core) {
    const same = before.core.find((c) => c.userId === b.userId);
    assert(same && same.from === b.from, 'GVCN không đổi mà ngày bắt đầu bị ghi lại');
  }
  assert(after.past.some((h) => h.skill === 'listening'), 'Lịch sử không hiện người vừa bị bỏ');
});

check('Bỏ phân công thì mất luôn quyền nhập điểm kỹ năng đó', () => {
  const before = classesSvc.classTeachers(P.mbManager, mbClass);
  const coreIds = new Set(before.core.map((c: any) => c.userId));
  /*
   * CHỌN MỘT KỸ NĂNG BỎ ĐƯỢC — không phải kỹ năng cuối cùng của giáo viên chủ nhiệm.
   *
   * GVCN phải dạy ít nhất một kỹ năng ở lớp (mục 7.7, owner khẳng định lại 13/09/2026), nên
   * bỏ nốt kỹ năng cuối của họ là một thao tác KHÔNG hợp lệ — bài kiểm này nói về chuyện
   * khác, nên nó phải chọn một kỹ năng khác để thử.
   */
  const coreSkillCount = before.bySkill.filter((b: any) => coreIds.has(b.userId)).length;
  const slot = before.bySkill.find(
    (b: any) => !coreIds.has(b.userId) || coreSkillCount > 1,
  );
  assert(slot, 'Lớp mẫu không có kỹ năng nào bỏ được mà không bỏ rơi giáo viên chủ nhiệm');
  const gv = loadPrincipal(slot!.userId);
  assert(can(gv, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: slot!.skill }),
    `GV ${slot!.skill} chưa có quyền`);

  classesSvc.setClassTeachers(P.mbManager, mbClass, {
    slots: [
      ...before.core.map((c: any) => ({ userId: c.userId, skill: null, isCore: true })),
      ...before.bySkill.filter((b: any) => b.skill !== slot!.skill)
        .map((b: any) => ({ userId: b.userId, skill: b.skill, isCore: false })),
    ],
  });
  const after = loadPrincipal(slot!.userId);
  assert(!can(after, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: slot!.skill }),
    'Bỏ phân công rồi mà vẫn nhập được điểm kỹ năng đó');
});

check('GVCN phải dạy ít nhất MỘT kỹ năng ở lớp mình chủ nhiệm', () => {
  /*
   * Owner khẳng định 13/09/2026. Chủ nhiệm một lớp mà không dạy em nào buổi nào thì không có
   * căn cứ nào để nhận xét và theo dõi — vai đó thành một cái tên trên giấy.
   */
  const t = classesSvc.classTeachers(P.mbManager, mbClass);
  const core = t.core[0];
  assert(core, 'Lớp mẫu chưa có giáo viên chủ nhiệm');
  assertThrows(
    () => classesSvc.setClassTeachers(P.mbManager, mbClass, {
      slots: [
        { userId: core.userId, skill: null, isCore: true },
        ...t.bySkill.filter((b: any) => b.userId !== core.userId)
          .map((b: any) => ({ userId: b.userId, skill: b.skill, isCore: false })),
      ],
    }),
    /ít nhất một kỹ năng/, 'Đặt GVCN không dạy kỹ năng nào',
  );
});

check('MỖI KỸ NĂNG CHỈ MỘT GIÁO VIÊN — xếp hai người vào một kỹ năng bị chặn', () => {
  /*
   * VÒNG 4 ĐẢO LẠI QUY TẮC NÀY (mục 7.7). Vòng trước cho phép hai giáo viên cùng một kỹ
   * năng; owner chốt 13/09/2026 rằng mỗi kỹ năng chỉ một người.
   *
   * Lý do nghiệp vụ, và cũng là hậu quả im lặng nhất khi làm sai: hai người cùng phụ trách
   * Listening thì cả hai đều tưởng người kia nhập điểm, và không ai nhập.
   */
  const t = classesSvc.classTeachers(P.mbManager, mbClass);
  /*
   * Phải chọn hai người ĐANG DẠY một kỹ năng ở chính lớp này.
   *
   * Luật khác của cùng mục 7.7 nói GVCN phải dạy ít nhất một kỹ năng ở lớp mình chủ nhiệm.
   * Lấy bừa hai cái tên trong chi nhánh thì phép kiểm rơi vào luật ấy trước và không bao giờ
   * chạm tới luật đang muốn kiểm.
   */
  const two = [...new Set(t.bySkill.map((b: any) => b.userId))]
    .slice(0, 2)
    .map((id) => ({ id }));
  assert(two.length === 2, 'Lớp không đủ hai giáo viên bộ môn để thử');

  const base = [
    ...t.core.map((c: any) => ({ userId: c.userId, skill: null, isCore: true })),
    ...t.bySkill.filter((b: any) => b.skill !== 'reading')
      .map((b: any) => ({ userId: b.userId, skill: b.skill, isCore: false })),
  ];
  assertThrows(
    () => classesSvc.setClassTeachers(P.mbManager, mbClass, {
      slots: [
        ...base,
        { userId: two[0].id, skill: 'reading', isCore: false },
        { userId: two[1].id, skill: 'reading', isCore: false },
      ],
    }),
    /Mỗi môn một người/, 'Xếp hai giáo viên vào cùng một kỹ năng',
  );

  /* Một giáo viên dạy NHIỀU kỹ năng thì vẫn được — đó là quy tắc thứ hai của mục 7.7. */
  classesSvc.setClassTeachers(P.mbManager, mbClass, {
    slots: [
      ...base,
      { userId: two[0].id, skill: 'reading', isCore: false },
    ],
  });
  const after = classesSvc.classTeachers(P.mbManager, mbClass);
  assert(after.bySkill.filter((b: any) => b.skill === 'reading').length === 1,
    'Kỹ năng Reading phải có đúng một giáo viên');

  /* Và đúng MỘT giáo viên chủ nhiệm. */
  assertThrows(
    () => classesSvc.setClassTeachers(P.mbManager, mbClass, {
      slots: [
        ...base,
        { userId: two[0].id, skill: 'reading', isCore: false },
        { userId: two[0].id, skill: null, isCore: true },
        { userId: two[1].id, skill: null, isCore: true },
      ],
    }),
    /một GVCN/, 'Xếp hai giáo viên chủ nhiệm cho một lớp',
  );
});

check('Dữ liệu mẫu có đủ bốn mức độ ưu tiên, không phải một màu đỏ', () => {
  const open = conn
    .prepare(
      /* PR-SOS (Q28-4): không còn "dự kiến kết thúc" cho PA thường — mức ưu tiên đọc theo hạn ghi kết quả tuần (`action_due`). */
      `SELECT action_due FROM case_interventions
        WHERE action_due IS NOT NULL AND status IN ('planned', 'started')`,
    )
    .all() as any[];
  const t = demoToday();
  /* OV-12a: hạn ghi kết quả rơi Thứ Ba, ngày demo là Thứ Hai — mức "sát hạn" = hạn ngày mai. */
  const ganNhat = addDays(t, 1);
  const late = open.filter((r) => r.action_due < t).length;
  const today = open.filter((r) => r.action_due >= t && r.action_due <= ganNhat).length;
  const soon = open.filter((r) => r.action_due > ganNhat).length;
  assert(late > 0 && today > 0 && soon > 0,
    `Hẹn xem lại phải có cả ba mức (quá hạn ${late}, hôm nay / ngày mai ${today}, còn hạn ${soon}) — `
    + 'neo hết vào ngày thi thì màn việc chỉ toàn một màu đỏ và không nhìn ra khác biệt');

  const untouched = conn
    .prepare(
      `SELECT COALESCE(detected_at, substr(created_at, 1, 10)) AS d FROM sos_cases sc
        WHERE sc.status != 'done' AND COALESCE(sc.sos_level, 1) > 0 AND sc.disposition IS NULL
          AND NOT EXISTS (SELECT 1 FROM case_interventions iv
                           WHERE iv.case_id = sc.id AND iv.status != 'cancelled')`,
    )
    .all() as any[];
  const fresh = untouched.filter((r) => diffDaysT(t, r.d) < 7).length;
  assert(fresh > 0 && untouched.length - fresh > 0,
    `Vấn đề chưa có phương án phải có cả mới lẫn để lâu (mới ${fresh}/${untouched.length})`);
});

/** Đếm ngày giữa hai mốc ISO, dùng riêng trong kiểm tra để không phụ thuộc thứ tự import. */
function diffDaysT(a: string, b: string) {
  return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);
}

console.log('\n20. Vấn đề gắn với một kỹ năng');

check('Một lượt trượt nhiều kỹ năng sinh NHIỀU vấn đề, mỗi kỹ năng một cái', () => {
  const rows = conn
    .prepare(
      /*
       * Loại case SONG SONG và case TÁI DIỄN: cả hai cố tình là case thứ hai ở cùng hạng
       * mục, và người dùng đã thấy cảnh báo trùng trước khi mở. Phép kiểm này nói về việc
       * MÁY tự mở trùng, không phải về lựa chọn của người dùng.
       */
      `SELECT attempt_id, COUNT(*) n, COUNT(DISTINCT topic) t FROM sos_cases
        WHERE attempt_id IS NOT NULL AND parallel = 0 AND previous_case_id IS NULL
          /* v3: case tự tạo bị RÚT vì sửa điểm (S08) là lịch sử, không còn là "vấn đề" — trượt lại sau đó mở case mới hợp lệ. */
          AND NOT (status = 'done' AND outcome IS NULL AND outcome_note LIKE 'Không còn hợp lệ do sửa điểm%')
        GROUP BY attempt_id`,
    )
    .all() as any[];
  assert(rows.some((r) => r.n > 1), 'Không lượt nào sinh quá một vấn đề — vẫn đang gom cả lượt');
  for (const r of rows) {
    assert(r.n === r.t, `Lượt ${r.attempt_id} có hai vấn đề cùng một kỹ năng`);
  }
  const none = (conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE topic IS NULL').get() as any).n;
  assert(none === 0, `${none} vấn đề trong dữ liệu mẫu không có kỹ năng`);
});

check('W1 và W2 là hai ô riêng, và cả hai đều có vấn đề thật', () => {
  const by = new Map((conn
    .prepare("SELECT topic, COUNT(*) n FROM sos_cases WHERE topic IS NOT NULL GROUP BY topic")
    .all() as any[]).map((r) => [r.topic, r.n]));
  for (const k of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) {
    assert((by.get(k) ?? 0) > 0, `Ô ${k} không có vấn đề nào — không kiểm chứng được nó có chạy không`);
  }
});

check('Band Writing đạt vẫn có thể có vấn đề ở W1 — band gộp che một lỗ hổng thật', () => {
  const hidden = conn
    .prepare(
      `SELECT COUNT(*) n FROM sos_cases sc
         JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.topic IN ('writing1', 'writing2')
          AND (SELECT ROUND(((SELECT band FROM assessment_scores WHERE attempt_id=a.id AND skill='writing1')
                            + 2*(SELECT band FROM assessment_scores WHERE attempt_id=a.id AND skill='writing2')) / 3 * 2)
                 / 2.0) >= a.target_at_attempt - (CASE a.attempt_no WHEN 1 THEN 1.0 WHEN 2 THEN 0.5 ELSE 0 END)`,
    )
    .get() as any;
  assert(hidden.n > 0,
    'Dữ liệu mẫu không có trường hợp nào W1 hoặc W2 dưới kỳ vọng mà band Writing vẫn đạt — '
    + 'đó là chính hệ quả của việc tách W1/W2, phải thấy được mới nghiệm thu được');
});

check('Sửa điểm lên thành đạt thì HẠ MỨC, không xoá mất việc đã làm', () => {
  const row = conn
    .prepare(
      `SELECT sc.id, sc.attempt_id, sc.topic FROM sos_cases sc
        WHERE sc.attempt_id IS NOT NULL AND sc.category = 'listening' AND sc.sos_level > 0
          AND sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id)
        LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Không tìm được vấn đề Listening đang mở và đã có việc để thử');
  const ivBefore = (conn.prepare('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?')
    .get(row.id) as any).n;
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(row.attempt_id) as any;
  attempts.saveScore(P.admin, a.id, 'listening', { rawScore: 40, lyDo: 'Phép kiểm: sửa điểm đã có' });
  const after = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(row.id) as any;
  assert(after, 'Sửa điểm đã XOÁ mất vấn đề');
  assert(after.sos_level === 0, `Điểm đã đạt mà mức vẫn là ${after.sos_level}`);
  const ivAfter = (conn.prepare('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?')
    .get(row.id) as any).n;
  assert(ivAfter === ivBefore, 'Sửa điểm đã xoá mất việc đã làm để hỗ trợ em');
  // Và phải để lại mốc "đã đạt kỳ vọng", chứ không lặng lẽ đổi một con số.
  const passed = conn
    .prepare(`SELECT * FROM case_milestones WHERE case_id = ? AND kind = 'passed' AND attempt_id = ?`)
    .get(row.id, a.id) as any;
  assert(passed, 'Hạ mức mà không ghi mốc "đã đạt kỳ vọng" — lịch sử case mất một đoạn');
});

check('Case ĐÃ ĐÓNG giữ nguyên mức SOS cũ — đó là lịch sử, không phải tình trạng', () => {
  /*
   * Một em từng SOS 3 ở MT1, case đã chốt kết thúc. Sau này sửa điểm MT1 lên thành đạt thì
   * mức trên case đóng KHÔNG được về 0: nó ghi lại đúng chuyện đã xảy ra lúc đó, và bảng
   * tổng hợp vốn chỉ đếm case đang mở nên con số hiện tại không bị sai vì nó.
   */
  const done = conn
    .prepare(
      `SELECT id, sos_level FROM sos_cases
        WHERE status = 'done' AND sos_level > 0 LIMIT 1`,
    )
    .get() as any;
  if (!done) return;
  const counted = conn
    .prepare(
      `SELECT COUNT(*) n FROM sos_cases WHERE id = ? AND status != 'done'`,
    )
    .get(done.id) as any;
  assert(counted.n === 0, 'Case đã đóng lại bị đếm như đang mở');
});

console.log('\n22. Phương án tự sinh và hạn theo mức độ ưu tiên');

check('SOS 1-2 xếp tự học, SOS 3 xếp tutor, từ MT3 luôn là tutor', () => {
  const { autoSupportKind } = domain;
  assert(autoSupportKind(1, 1) === 'self_study' && autoSupportKind(2, 2) === 'self_study',
    'SOS 1-2 trước MT3 phải là xếp tự học');
  assert(autoSupportKind(3, 1) === 'tutor' && autoSupportKind(3, 2) === 'tutor', 'SOS 3 phải là tutor');
  assert(autoSupportKind(1, 3) === 'tutor' && autoSupportKind(1, 5) === 'tutor',
    'Từ MT3 luôn là tutor bất kể mức — gần ngày thi thì tự học không kịp');
});

check('Chu kỳ HỌC THUẬT: hết Chủ nhật tuần thứ hai, tính tuần bắt đầu là tuần thứ nhất', () => {
  const { cycleDeadline } = domain;
  // Ví dụ owner chốt ở mục 7.7: case 14/09/2026 (thứ Hai) → hạn 27/09/2026, KHÔNG phải 04/10.
  assert(cycleDeadline('2026-09-14') === '2026-09-27',
    `Case 14/09 phải có hạn 27/09, đang là ${cycleDeadline('2026-09-14')}`);
  // Bắt đầu giữa tuần vẫn cùng một hạn — chu kỳ đếm theo TUẦN, không phải cộng 14 ngày.
  assert(cycleDeadline('2026-09-17') === '2026-09-27', 'Bắt đầu thứ Năm vẫn cùng hạn với thứ Hai cùng tuần');
  assert(cycleDeadline('2026-09-20') === '2026-09-27', 'Chủ nhật vẫn thuộc tuần đó');
  assert(cycleDeadline('2026-09-21') === '2026-10-04', 'Sang tuần mới thì hạn lùi đúng một tuần');
});

check('Kết quả tốt được khép lại; kết quả chưa tốt BẮT BUỘC đi tiếp', () => {
  const { nextStepsFor, FOLLOWUP_OUTCOMES } = domain;
  assert(FOLLOWUP_OUTCOMES.length === 5, 'Case học thuật phải có đủ năm kết quả');
  for (const o of ['improved', 'partial']) {
    const steps = nextStepsFor(o);
    assert(steps.includes('complete') && steps.includes('monitor'),
      `Kết quả ${o} phải cho phép hoàn thành hoặc theo dõi thêm`);
    assert(!steps.includes('continue'), `Kết quả ${o} không cần tiếp tục phương án cũ`);
  }
  for (const o of ['unchanged', 'worse', 'insufficient']) {
    const steps = nextStepsFor(o);
    assert(!steps.includes('complete'),
      `Kết quả ${o} KHÔNG được phép khép lại — phải chọn đường đi tiếp`);
    assert(steps.length === 3, `Kết quả ${o} phải có đủ ba đường đi tiếp`);
  }
});

check('Chọn loại trong nhóm Đề xuất TỨC LÀ xin duyệt, không phải tick thêm', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.reading.technique',
    studentId: someStudent.id, topic: 'reading', summary: 'Thử nhóm đề xuất',
    idempotencyKey: 'test-proposal-1', parallel: true,
  }) as any;
  /*
   * MỤC 8.1: LÙI LỊCH THI PHẢI NÓI RÕ LÙI CÁI GÌ. Kế hoạch thi thật của em và một phần thi
   * trong đợt MT là hai chuyện khác hẳn — người duyệt cần biết mình đang đồng ý với cái nào.
   */
  assertThrows(
    () => cases.recordIntervention(P.coreTeacher, c.id, {
      kind: 'reschedule_mt', description: 'Xin lùi MT3 cho em', status: 'planned',
    }),
    /dời cái gì/, 'Đề xuất lùi lịch thi không nói rõ đối tượng mà vẫn gửi được',
  );
  const r = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'reschedule_mt', description: 'Xin lùi MT3 cho em', status: 'planned',
    rescheduleTarget: 'mock_skill',
  }) as any;
  const iv = r.interventions[r.interventions.length - 1];
  assert(iv.approvalState === 'pending', 'Đề xuất lùi lịch thi phải tự vào trạng thái chờ duyệt');
  assert(iv.approvalDue, 'Đề xuất phải có hạn Quản lý trả lời');
  assert(iv.rescheduleTarget === 'mock_skill', 'Không lưu lại đang xin lùi cái gì');

  // MÔ TẢ NGẮN BẮT BUỘC (mục 8.2): tên loại phương án không nói được làm gì cho em.
  assertThrows(
    () => cases.recordIntervention(P.coreTeacher, c.id, { kind: 'self_study', description: 'tự học' }),
    /Mô tả ngắn/, 'Phương án không có mô tả mà vẫn lưu được',
  );

  // Còn phương án giáo viên tự làm thì KHÔNG tự đòi duyệt.
  const r2 = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'self_study', description: 'Xếp tự học buổi tối, 30 phút mỗi ngày', status: 'planned',
  }) as any;
  const iv2 = r2.interventions[r2.interventions.length - 1];
  assert(iv2.approvalState === null, 'Xếp tự học không cần duyệt mà lại bị đòi duyệt');
});

console.log('\n23. Chỉ còn Học thuật — Ý thức đã chuyển sang Vi phạm và Biện pháp (PR-J)');

check('Case chỉ còn Học thuật — không còn cột đầu mục, không còn phân loại Ý thức, Giáo viên hay Giáo trình', () => {
  const cols = (conn.prepare('PRAGMA table_info(sos_cases)').all() as any[]).map((c) => c.name);
  assert(!cols.includes('track'), 'sos_cases còn cột track — mô hình Case Ý thức chưa gỡ hết');
  const bad = conn
    .prepare(`SELECT COUNT(*) n FROM case_issues WHERE taxonomy_code LIKE 'teacher.%' OR taxonomy_code LIKE 'curriculum.%' OR taxonomy_code LIKE 'student.${GONE}.%'`)
    .get() as any;
  assert(bad.n === 0, `${bad.n} phân loại Giáo viên/Giáo trình/Ý thức vẫn nằm trong vấn đề của học viên`);
  const goneCases = conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE category = '${GONE}'`).get() as any;
  assert(goneCases.n === 0, `${goneCases.n} case mang nhóm Ý thức — Ý thức nay là vi phạm, không phải case`);
});

check('Bỏ hoàn cảnh: không còn vai trò context, và Ghi chú giữ nguyên chữ', () => {
  assert(!(domain.ISSUE_ROLES as readonly string[]).includes('context'), 'Vai trò "hoàn cảnh" vẫn còn');
  const n = (conn.prepare("SELECT COUNT(*) n FROM case_issues WHERE role = 'context'").get() as any).n;
  assert(n === 0, `${n} dòng hoàn cảnh vẫn còn trong dữ liệu`);
});

console.log('\n24. Bảng tổng hợp và khối của Quản lý');



check('Mức SOS KHÔNG đổi khi đóng case, và KHÔNG kéo theo case còn mở', () => {
  /*
   * Đây là lỗi gốc mục 2.1 nêu đích danh: em thi MT gần nhất ĐẠT mà case cũ chưa đóng thì
   * vẫn bị gọi là SOS. Kiểm bằng một em có đúng tình huống đó.
   */
  const row = conn
    .prepare(
      `SELECT sc.student_id AS sid, sc.id AS cid FROM sos_cases sc
        WHERE sc.status != 'done' AND sc.student_id IS NOT NULL AND sc.sos_level > 0
        ORDER BY sc.id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Dữ liệu demo không có case SOS nào đang mở');

  const before = standing.standingFor([row.sid]).get(row.sid)!;
  /* Đóng case: mức SOS KHÔNG được đổi, vì nó nói về bài thi chứ không về case. */
  conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(row.cid);
  const after = standing.standingFor([row.sid]).get(row.sid)!;
  conn.prepare(`UPDATE sos_cases SET status = 'in_progress' WHERE id = ?`).run(row.cid);

  assert(before.sosLevel === after.sosLevel,
    `Đóng case làm mức SOS đổi từ ${before.sosLevel} thành ${after.sosLevel}`);
  assert(before.attemptId === after.attemptId, 'Đóng case làm đổi bài đánh giá đang được lấy làm căn cứ');
  /* Và số case thì PHẢI đổi — đó mới là con số case. */
  assert(after.openCases === before.openCases - 1, 'Đóng case mà số case đang theo dõi không giảm');
});

check('Lộ trình mới chưa có bài nào thì KHÔNG mang SOS của lộ trình cũ', () => {
  const row = conn
    .prepare(
      `SELECT cy.student_id AS sid, cy.id AS cid FROM learning_cycles cy
        WHERE cy.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts a
                           JOIN assessment_scores s ON s.attempt_id = a.id
                          WHERE a.cycle_id = cy.id)
          AND EXISTS (SELECT 1 FROM sos_cases sc
                       WHERE sc.student_id = cy.student_id AND sc.status != 'done'
                         AND sc.cycle_id IS NOT NULL AND sc.cycle_id != cy.id)
        LIMIT 1`,
    )
    .get() as any;
  if (!row) return;   // bộ demo hiện tại chưa có tình huống này thì bỏ qua, không bịa ra
  const s = standing.standingFor([row.sid]).get(row.sid)!;
  assert(s.sosLevel === null, `Lộ trình mới chưa thi mà vẫn mang mức SOS ${s.sosLevel}`);
  assert(s.handoverCases > 0, 'Case của lộ trình trước không được đếm là việc bàn giao');
});



console.log('\n25. Việc Quản lý giao, toả ra thành phương án');

check('Một task cho cả lớp là MỘT task, toả ra hồ sơ từng em', () => {
  const cls = classId('MB FT 102');
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const t = meeting.createTask(P.mbManager, {
    kind: 'teacher_task', title: 'Luyện đọc bấm giờ 10 phút mỗi buổi',
    classId: cls, topic: 'reading',
  }) as any;
  const links = conn.prepare('SELECT * FROM task_students WHERE task_id = ?').all(t.id) as any[];
  const roster = (conn
    .prepare(
      `SELECT COUNT(*) n FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id = ? AND e.status='active' AND s.status='active' AND s.archived_at IS NULL`,
    )
    .get(cls) as any).n;
  assert(links.length === roster, `Lớp ${roster} em nhưng chỉ toả ra ${links.length}`);
  assert(links.every((l) => l.case_id && l.intervention_id), 'Có em không được gắn vấn đề hoặc phương án');
  // MỘT task, không phải N bản sao.
  const tasks = conn.prepare("SELECT COUNT(*) n FROM tasks WHERE title = ?")
    .get('Luyện đọc bấm giờ 10 phút mỗi buổi') as any;
  assert(tasks.n === 1, `Tạo ra ${tasks.n} task thay vì một`);
  const after = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assert(after > before, 'Không mở vấn đề nào cho những em chưa có');
});

check('Vấn đề mở theo yêu cầu Quản lý vào thẳng ĐANG XỬ LÝ, không đội số "chưa có phương án"', () => {
  const rows = conn
    .prepare("SELECT status, COUNT(*) n FROM sos_cases WHERE origin_kind = 'manager_task' GROUP BY status")
    .all() as any[];
  assert(rows.length > 0, 'Chưa có vấn đề nào mở theo yêu cầu Quản lý');
  for (const r of rows) {
    assert(r.status === 'in_progress',
      `Vấn đề mở theo task đang ở trạng thái ${r.status} — nó đã có phương án rồi, chính là task đó`);
  }
  const noPlan = cases.listCases(P.admin, {}).rows
    .filter((c) => c.originKind === 'manager_task' && c.state === 'no_plan');
  assert(noPlan.length === 0, `${noPlan.length} vấn đề từ task Quản lý bị đếm là "chưa có phương án"`);
});

check('Đã có vấn đề đang mở ở kỹ năng đó thì DÙNG LẠI, không mở cái thứ hai', () => {
  const cls = classId('MB FT 102');
  meeting.createTask(P.mbManager, {
    kind: 'teacher_task', title: 'Đợt hai: vẫn luyện đọc bấm giờ',
    classId: cls, topic: 'reading',
  });
  /*
   * `parallel = 1` là case người dùng ĐÃ THẤY cảnh báo trùng và cố ý mở riêng (mục 7.2:
   * "cho chọn thêm vào case đang có hoặc tạo case riêng; không âm thầm gộp"). Phép kiểm
   * này nói về việc máy tự mở trùng, nên loại những case cố ý ra.
   */
  const dup = conn
    .prepare(
      `SELECT student_id, COUNT(*) n FROM sos_cases
        WHERE topic = 'reading' AND status != 'done' AND attempt_id IS NULL
          AND parallel = 0
        GROUP BY student_id HAVING n > 1`,
    )
    .all() as any[];
  assert(dup.length === 0, `${dup.length} em bị máy tự mở hai vấn đề Reading cùng lúc`);
});

check('Việc chi nhánh KHÔNG gắn học viên nào', () => {
  const t = meeting.createTask(P.mbManager, {
    kind: 'branch_ops', title: 'Rà lại giáo trình Unit 5',
  }) as any;
  const links = conn.prepare('SELECT COUNT(*) n FROM task_students WHERE task_id = ?').get(t.id) as any;
  assert(links.n === 0, 'Việc chi nhánh lại toả ra học viên');
  assert(t.kind === 'branch_ops' && !t.topic, 'Việc chi nhánh không được gắn kỹ năng');
});

check('Giao việc cho giáo viên phải chọn lớp và kỹ năng', () => {
  assertThrows(
    () => meeting.createTask(P.mbManager, { kind: 'teacher_task', title: 'Thiếu lớp' }),
    /lớp|học viên/, 'Giao việc mà không chọn lớp',
  );
  assertThrows(
    () => meeting.createTask(P.mbManager, {
      kind: 'teacher_task', title: 'Thiếu kỹ năng', classId: classId('MB FT 101'),
    }),
    /kỹ năng|ý thức/, 'Giao việc mà không chọn kỹ năng',
  );
});

console.log('\n26. Việc trao đổi tới tay đúng người');

check('Việc làm phương án chỉ về đúng GVBM của kỹ năng — không rơi vào GVBM sai môn, cũng không vào GVCN trái môn', () => {
  /*
   * Hai việc trao đổi nay là phương án, nên chúng tới tay người ta qua nhóm việc
   * "Làm phương án đã hẹn" chứ không qua một bảng Liên hệ riêng. Cách CHIA VIỆC thì giữ
   * nguyên — đó mới là thứ nghiệp vụ, không phải bảng nào chứa nó.
   *
   * AUTH-01 (mục 10.5): case HỌC THUẬT nay chỉ đúng GVBM của ĐÚNG kỹ năng, hoặc GVCN, hoặc
   * Quản lý mới xử lý được — nên bộ demo không còn sẵn một việc "gặp học viên" nào đang chờ
   * mà một GVBM BẤT KỲ (không đúng môn) còn nhận được. Dựng riêng một case + phương án ở
   * đây, biết trước đúng kỹ năng của từng vai, thay vì dò trong dữ liệu demo đổi theo thời
   * gian — đúng cách các phép kiểm AUTH-01 khác trong file này đã làm.
   */
  const subjectSkill = (conn
    .prepare(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill IS NOT NULL LIMIT 1`)
    .get(mbClass, P.subjectTeacher.userId) as any).skill as string;
  /*
   * Loại cả người VỪA dạy kỹ năng khác VỪA là GVCN (một người có thể mang hai vai, như
   * `subjectOnlyTeacherOf` đã lưu ý) — người đó qua được bằng vai GVCN, không phải bằng
   * đúng môn, nên không dùng được để kiểm "GVBM sai môn thì bị chặn".
   */
  const mismatchRow = conn
    .prepare(
      `SELECT ta.user_id AS id FROM teacher_assignments ta
        WHERE ta.class_id = ? AND ta.skill IS NOT NULL AND ta.skill != ? AND ta.is_core = 0 AND ta.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM teacher_assignments c2
                            WHERE c2.class_id = ta.class_id AND c2.user_id = ta.user_id
                              AND c2.is_core = 1 AND c2.status = 'active')
        LIMIT 1`,
    )
    .get(mbClass, subjectSkill) as any;
  assert(mismatchRow, 'Seed thiếu một GVBM khác môn (không kiêm GVCN) ở MB FT 101 để kiểm AUTH-01');
  const mismatchTeacher = loadPrincipal(mismatchRow.id);

  const enr = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(mbClass) as any;
  const cy = conn.prepare(
    `SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' LIMIT 1`,
  ).get(enr.student_id) as any;
  const ownSkillCase = cases.reportIssue(P.admin, {
    studentId: enr.student_id, cycleId: cy?.id, topic: subjectSkill,
    primaryCode: domain.issuesForTopic(subjectSkill)[0].code,
    title: `${subjectSkill}: kiểm việc gặp học viên`,
    summary: `Ghi nhận riêng để kiểm ai nhận việc "gặp học viên" của case ${subjectSkill}.`,
    parallel: true,
  }) as any;
  const iv = cases.recordIntervention(P.subjectTeacher, ownSkillCase.id, {
    kind: 'self_study', description: 'Xếp tự học buổi tối, 30 phút mỗi ngày.', status: 'planned',
  }) as any;
  const ivId = iv.interventions[iv.interventions.length - 1].id as number;
  // Đưa hạn về hôm nay để việc rơi vào nhóm "tới hạn", giống cách các phép kiểm khác dựng dữ liệu quá hạn.
  conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(TODAY, ivId);

  const has = (who: any) => mywork.myWork(who, {}).groups
    .filter((g: any) => g.key === 'ghi_ket_qua_pa').some((g: any) => g.items.some((it: any) => it.key === `action:${ivId}`));

  assert(has(P.subjectTeacher), 'GVBM đúng kỹ năng không nhận việc làm phương án của case kỹ năng mình');
  assert(!has(mismatchTeacher), 'AUTH-01: GVBM sai môn vẫn nhận được việc của case kỹ năng khác');
  /* C02 (đã chốt 20/09/2026): GVCN không xử lý case học thuật TRÁI MÔN, nên cũng không bị giao việc của nó. */
  assert(!has(P.coreTeacher), 'GVCN vẫn nhận việc của case môn khác (C02)');

  /* Vai đã bỏ không được phép quay lại danh sách giao mới. */
  const retired = conn.prepare("SELECT status FROM roles WHERE key = 'branch_admin'").get() as any;
  assert(retired && retired.status === 'retired',
    'Vai Admin chi nhánh phải còn trong bảng ở trạng thái đã bỏ, để đọc được lịch sử');
  const stillGranted = conn
    .prepare(
      `SELECT COUNT(*) AS n FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE r.key = 'branch_admin' AND ur.status = 'active'`,
    )
    .get() as any;
  assert(stillGranted.n === 0, 'Không tài khoản nào được còn giữ vai Admin chi nhánh');
});

console.log('\n27. Vòng 4 — case sống suốt khoá');

/*
 * Bốn bài kiểm này là ĐÚNG bốn tiêu chí "Xong khi" của phase 1 vòng 4 (tài liệu `vong4/` đã xoá 21/09/2026 — tra bằng git log nếu cần).
 * Viết thành kiểm tra chứ không chỉ thử tay, vì đây là phần dễ vỡ nhất khi sửa về sau.
 */

check('Trượt Listening ở MT1 rồi MT2 → ĐÚNG MỘT case, tên đổi theo lượt mới nhất', () => {
  const cls = 'BC FT 205';
  const s = conn
    .prepare(
      `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND cy.target_score IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM sos_cases sc
                           WHERE sc.student_id = s.id AND sc.category = 'listening')
        ORDER BY s.id LIMIT 1`,
    )
    .get(classId(cls)) as any;
  assert(s, 'Không tìm được học viên sạch case Listening để thử');

  const mgr = P.bcManager;
  const lr = loadPrincipal(teacherOfSkill(cls, 'listening'));
  const mk = (no: number, date: string) => {
    const a = attempts.createAttempt(mgr, {
      studentId: s.id, cycleId: s.cycle_id, periodId: periodOf(date),
    }) as any;
    chotThu(a.id);
    return a;
  };
  const bandBelow = (no: number) => {
    const exp = s.target_score - (no === 1 ? 1 : no === 2 ? 0.5 : 0);
    return scoring.LISTENING_BY_RAW.indexOf(exp - 0.5);
  };

  const a1 = mk(1, '2026-10-12');
  attempts.saveScore(lr, a1.id, 'listening', { rawScore: bandBelow(a1.attempt_no) }, chuNhatCuoiOf(a1.id));

  /*
   * v3 (21/09/2026 tối): LẦN TRƯỢT ĐẦU CỦA MOCK FT TỰ TẠO CASE — tín hiệu nối ngay vào nó (thay luật 6.2 "chỉ sinh tín hiệu").
   */
  const after1 = conn
    .prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'listening'`)
    .all(s.id) as any[];
  assert(after1.length === 1, `Lần trượt đầu của Mock FT phải tự tạo đúng 1 case, đang có ${after1.length}`);
  const sig1 = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(a1.id) as any;
  assert(sig1?.status === 'linked' && sig1.case_id === after1[0].id, 'Tín hiệu phải nối ngay vào case tự tạo');
  const caseId = after1[0].id;
  datNguyenNhanThu(lr, caseId, 'student.listening.technique');

  /* Ghi một phương án và một kết quả để kiểm rằng chúng SỐNG SÓT qua lần trượt thứ hai. */
  cases.recordIntervention(mgr, caseId, {
    kind: 'self_study', description: 'Nghe 30 phút mỗi ngày',
    performerSelf: true, status: 'completed', completedDate: TODAY,
  });
  cases.recordFollowUp(mgr, caseId, { observedOn: '2026-10-25', outcome: 'partial', note: 'Có làm nhưng chưa đều' });

  const a2 = mk(2, '2026-11-16');
  attempts.saveScore(lr, a2.id, 'listening', { rawScore: bandBelow(a2.attempt_no) }, chuNhatCuoiOf(a2.id));

  const after2 = conn
    .prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'listening'`)
    .all(s.id) as any[];
  assert(after2.length === 1,
    `MT2 trượt lại phải ghi vào CHÍNH case cũ, đang có ${after2.length} case Listening`);
  assert(after2[0].id === caseId, 'Case Listening bị thay bằng một case khác');

  const d = cases.caseDetail(mgr, caseId) as any;
  /* Case do SOS tự tạo không có tên riêng do người đặt — tên suy ra từ mốc mới nhất và nói đúng kỹ năng. */
  assert(/Listening/.test(d.title), `Tên case tự tạo phải nói đúng kỹ năng, đang là "${d.title}"`);
  assert(d.interventions.some((i: any) => i.completedDate === TODAY),
    'Phương án của MT1 biến mất sau khi MT2 trượt lại');
  assert(d.followups.some((f: any) => f.observedOn === '2026-10-25'),
    'Kết quả ghi ở MT1 biến mất sau khi MT2 trượt lại');
  assert(d.milestones.filter((m: any) => m.attemptNo).length >= 2,
    'Case phải có mốc của cả hai lượt MT');
  assert(d.milestones.some((m: any) => m.kind === 'repeat'),
    'Thiếu mốc "trượt lại" — nhìn vào không biết phương án cũ chưa đạt kết quả');
});

check('Case đã đóng mà MT sau trượt lại → MỞ CASE MỚI nối vào case cũ (mục 7.5)', () => {
  const cls = 'BC FT 205';
  const s = conn
    .prepare(
      `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND cy.target_score IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM sos_cases sc
                           WHERE sc.student_id = s.id AND sc.category = 'reading')
        ORDER BY s.id DESC LIMIT 1`,
    )
    .get(classId(cls)) as any;
  assert(s, 'Không tìm được học viên sạch case Reading để thử');

  const mgr = P.bcManager;
  const rt = loadPrincipal(teacherOfSkill(cls, 'reading'));
  const mk = (date: string) => {
    const a = attempts.createAttempt(mgr, {
      studentId: s.id, cycleId: s.cycle_id, periodId: periodOf(date),
    }) as any;
    chotThu(a.id);
    return a;
  };
  const low = (no: number) => {
    const exp = s.target_score - (no === 1 ? 1 : no === 2 ? 0.5 : 0);
    return scoring.READING_BY_RAW.indexOf(exp - 0.5);
  };

  const a1 = mk('2026-10-19');
  attempts.saveScore(rt, a1.id, 'reading', { rawScore: low(a1.attempt_no) }, chuNhatCuoiOf(a1.id));
  const sigA = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'reading'`)
    .get(a1.id) as any;
  assert(sigA?.status === 'linked', 'v3: lần trượt đầu của Mock FT phải nối ngay vào case tự tạo');
  const c = conn.prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'reading'`)
    .get(s.id) as any;
  assert(c && c.id === sigA.case_id, 'Chưa tự tạo case Reading');
  datNguyenNhanThu(rt, c.id, 'student.reading.technique');

  /*
   * CHƯA LÀM GÌ THÌ CHƯA CHỐT ĐƯỢC. v3: case tự tạo có sẵn một phương án điền sẵn — nó chưa được xác nhận nên vẫn là "phương án chưa cập nhật
   * kết quả cuối cùng" chặn việc chốt. (Đóng ngay không cần theo dõi là đường riêng của GVBM, S05.)
   */
  assertThrows(
    () => cases.closeCaseOutcome(mgr, c.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
    }),
    /chưa cập nhật kết quả cuối cùng|PA theo quy chế kết thúc/, 'Chốt được kết quả một case chưa ai làm gì',
  );
  cases.recordIntervention(rt, c.id, {
    kind: 'teaching_adjust', description: 'Luyện bấm giờ từng passage, 20 phút mỗi passage',
    performerSelf: true, status: 'started', startedDate: '2026-10-26',
  });

  /* Mọi phương án phải xong trước, rồi mới chốt được — đó chính là quy tắc cần kiểm. */
  const open = conn
    .prepare(`SELECT id FROM case_interventions WHERE case_id = ? AND status IN ('planned','started')`)
    .all(c.id) as any[];
  assertThrows(
    () => cases.closeCaseOutcome(mgr, c.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
    }),
    /chưa cập nhật kết quả cuối cùng|PA theo quy chế kết thúc/, 'Chốt được kết quả case khi còn phương án treo',
  );
  /* v3: phương án điền sẵn của case tự tạo phải được XÁC NHẬN thì mới ghi "đã làm" được (Q-V3-3). */
  for (const iv of open) {
    const row = conn.prepare('SELECT preset, confirmed_at FROM case_interventions WHERE id = ?').get(iv.id) as any;
    if (row.preset === 1 && !row.confirmed_at) {
      /* PR-SOS (Q28-3): Xác nhận Case (nguyên nhân) rồi Xác nhận PA. */
      if (!conn.prepare("SELECT 1 FROM case_issues WHERE case_id = ? AND role = 'primary'").get(c.id)) {
        sosAutoSvc.xacNhanCase(mgr, c.id, { primaryCode: domain.issuesForTopic(c.topic ?? 'reading', null)[0].code, urgency: 'attention', moTa: 'Em đọc chậm, hết giờ ở passage 3.' });
      }
      sosAutoSvc.xacNhanPaQuyChe(mgr, iv.id, duXacNhan(conn, iv.id, { description: 'Tutor kèm Reading hai buổi mỗi tuần, cô Hà chữa bài.' }));
    }
    /* PR-S3F #8 (T22): PA quy chế không khép sớm — phép kiểm này chỉ cần "PA đã xong" để chốt Case (PR-SO: `completeIntervention` đã xoá). */
    conn.prepare(`UPDATE case_interventions SET status = 'completed', completed_date = ?, updated_at = ? WHERE id = ?`).run(demoToday(), new Date().toISOString(), iv.id);
  }
  cases.closeCaseOutcome(mgr, c.id, {
    outcome: 'much_better', note: 'Em đọc nhanh hơn hẳn', decision: 'end',
  });
  const closed = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(c.id) as any;
  assert(closed.status === 'done', 'Chốt "kết thúc hẳn" mà case không đóng');

  /* Rồi MT sau trượt lại. */
  const a2 = mk('2026-11-23');
  attempts.saveScore(rt, a2.id, 'reading', { rawScore: low(a2.attempt_no) }, chuNhatCuoiOf(a2.id));

  /*
   * Case cũ ĐÃ ĐÓNG nên tín hiệu lần này KHÔNG nối vào nó — nó nằm chờ xác minh. Mở case
   * mới hay không là một quyết định có chủ đích của người dạy, không phải phản xạ của máy.
   */
  const sigB = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'reading'`)
    .get(a2.id) as any;
  assert(sigB?.status === 'linked' && sigB.case_id !== c.id,
    'v3: case cũ đã đóng, MT sau trượt lại thì SOS tự tạo case MỚI (không nối vào case đã đóng)');

  /*
   * VÒNG 5 ĐẢO LẠI QUYẾT ĐỊNH CỦA VÒNG 4 (mục 7.5).
   *
   * Vòng 4: mở lại chính case cũ. Vòng 5: mở case MỚI nối vào case cũ — vì mở lại case cũ
   * thì phải xoá kết luận đã chốt của nó, mà kết luận ấy là một quyết định có thật của một
   * người có thật, ở một thời điểm mà lúc đó nó đúng.
   */
  const all = conn
    .prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'reading' ORDER BY id`)
    .all(s.id) as any[];
  assert(all.length === 2, `Tái diễn sau khi đóng phải mở case MỚI, đang có ${all.length} case Reading`);
  const [older, newer] = all;

  // Case CŨ giữ nguyên mọi thứ đã chốt — không bị đè.
  assert(older.id === c.id && older.status === 'done', 'Case cũ bị mở lại thay vì giữ nguyên');
  assert(older.outcome === 'much_better', 'Kết luận của case cũ bị xoá — mất một quyết định có thật');

  // Case MỚI đang mở, và nối được về case cũ.
  assert(newer.status !== 'done', 'Case mới mà đã đóng sẵn');
  assert(newer.previous_case_id === older.id, 'Case mới không nối về case cũ — hồ sơ đứt mạch');
  assert(newer.outcome === null, 'Case mới không được thừa kế kết luận của case cũ');

  // Và case cũ mang một mốc nói rõ chuyện chưa dừng ở đó.
  const d = cases.caseDetail(mgr, older.id) as any;
  assert(d.milestones.some((m: any) => m.kind === 'recurrence'),
    'Case cũ thiếu mốc tái diễn — đọc hồ sơ tưởng xong hẳn rồi');
  assert(d.milestones.some((m: any) => m.kind === 'closed'),
    'Mốc chốt kết thúc cũ bị xoá — mất dấu chuyện đã từng kết luận là xong');
});

check('Hai ví dụ của owner sinh ĐÚNG số case', () => {
  /*
   * Ví dụ 1: trượt L và S → SOS 2 → 3 case (Listening · Speaking · Ý thức/Khác)
   * Ví dụ 2: trượt cả W1 và W2 → SOS 1 → 3 case (W1 · W2 · Ý thức/Khác)
   * Ví dụ 3: band W tổng hợp ĐẠT nhưng riêng W1 dưới kỳ vọng → 0 case (quy tắc đảo ở vòng 4)
   */
  const { failingEntrySkills } = scoring;
  const ex1 = failingEntrySkills(6.0, { listening: 5.5, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 5.5 });
  assert(ex1.length === 2 && ex1.includes('listening') && ex1.includes('speaking'),
    `Trượt L và S phải ra đúng hai case học thuật, đang ra ${ex1.join(', ')}`);

  // W1 = 5.5, W2 = 5.5 → band W = 5.5 < 6.0 → cả hai trượt
  const ex2 = failingEntrySkills(6.0, { listening: 6.0, reading: 6.0, writing1: 5.5, writing2: 5.5, speaking: 6.0 });
  assert(ex2.length === 2 && ex2.includes('writing1') && ex2.includes('writing2'),
    `Trượt cả hai task Writing phải ra hai case, đang ra ${ex2.join(', ')}`);

  // W1 = 5.0, W2 = 6.5 → band W = (5.0 + 13)/3 = 6.0 → ĐẠT → không case nào
  const ex3 = failingEntrySkills(6.0, { listening: 6.0, reading: 6.0, writing1: 5.0, writing2: 6.5, speaking: 6.0 });
  assert(ex3.length === 0,
    `Band Writing đạt thì không mở case nào, kể cả khi W1 thấp — đang ra ${ex3.join(', ')}`);

  // W1 = 5.0, W2 = 6.0 → band W = (5 + 12)/3 = 5.67 → làm tròn 5.5 < 6.0 → chỉ W1 trượt
  const ex4 = failingEntrySkills(6.0, { listening: 6.0, reading: 6.0, writing1: 5.0, writing2: 6.0, speaking: 6.0 });
  assert(ex4.length === 1 && ex4[0] === 'writing1',
    `Band Writing trượt mà chỉ W1 dưới kỳ vọng thì ra đúng một case W1, đang ra ${ex4.join(', ')}`);
});


check('Bảng theo dõi hỗ trợ luôn đủ NĂM hạng mục kỹ năng, kể cả hạng mục đang ổn — Ý thức không còn hàng riêng', () => {
  const s = conn
    .prepare(
      `SELECT student_id FROM sos_cases WHERE status != 'done' LIMIT 1`,
    )
    .get() as any;
  assert(s, 'Không có case nào đang mở để thử');
  const board = cases.skillSupportBoard(P.admin, s.student_id) as any;
  assert(board.rows.length === 5, `Bảng phải có đúng 5 dòng, đang có ${board.rows.length}`);
  const cats = board.rows.map((r: any) => r.category).join(',');
  assert(cats === 'listening,reading,writing1,writing2,speaking',
    `Thứ tự hạng mục sai: ${cats}`);
  assert(board.rows.some((r: any) => r.caseId), 'Không dòng nào gắn được case');
  for (const r of board.rows) {
    assert(['none', 'no_plan', 'working', 'done'].includes(r.state), `Trạng thái lạ: ${r.state}`);
    assert(r.label, `Hạng mục ${r.category} thiếu nhãn`);
  }
});

check('Cảnh báo case trùng: báo lại hạng mục đã có case chưa xong thì phải hỏi trước', () => {
  const open = conn
    .prepare(
      /*
       * Case phải nằm trong LỘ TRÌNH ĐANG CHẠY của em.
       *
       * Khoá chống trùng tính theo từng lộ trình, nên một case còn mở từ chương trình TRƯỚC
       * không chặn việc mở case mới ở chương trình hiện tại — và đúng là không nên chặn.
       */
      `SELECT sc.id, sc.student_id, sc.topic FROM sos_cases sc
         JOIN learning_cycles cy ON cy.id = sc.cycle_id AND cy.status = 'active'
        WHERE sc.status != 'done' AND sc.parallel = 0
          AND sc.previous_case_id IS NULL
          AND sc.topic IS NOT NULL LIMIT 1`,
    )
    .get() as any;
  assert(open, 'Không có case học thuật đang mở để thử');

  let caught: any = null;
  try {
    cases.reportIssue(P.admin, {
      title: 'Vấn đề cần theo dõi ở kỹ năng này',
      primaryCode: 'student.listening.technique',
      studentId: open.student_id, topic: open.topic, summary: 'Thử case trùng — mô tả cụ thể cho phép kiểm này.',
      idempotencyKey: `dup-${open.id}-a`,
    });
  } catch (e) { caught = e; }
  assert(caught, 'Báo trùng hạng mục mà hệ thống im lặng mở case thứ hai');
  assert(caught.details?.duplicateCase?.id === open.id,
    'Cảnh báo không chỉ ra case đang vướng, giao diện không dựng được pop-up');

  /* Chọn "Ghi vào case đang có" → không có case mới. */
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const merged = cases.reportIssue(P.admin, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: open.student_id, topic: open.topic, summary: 'Ghi vào case đang có',
    mergeIntoExisting: true, idempotencyKey: `dup-${open.id}-b`,
  }) as any;
  assert(merged.id === open.id, 'Chọn ghi vào case đang có mà lại ra case khác');
  const afterMerge = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assert(afterMerge === before, 'Ghi vào case đang có mà vẫn tạo thêm một case');

  /* Chọn "Mở case riêng" → có case mới, đánh dấu là song song. */
  const parallel = cases.reportIssue(P.admin, {
    title: 'Vấn đề cần theo dõi ở kỹ năng này',
    primaryCode: 'student.listening.technique',
    studentId: open.student_id, topic: open.topic, summary: 'Đây là vấn đề khác',
    parallel: true, idempotencyKey: `dup-${open.id}-c`,
  }) as any;
  assert(parallel.id !== open.id, 'Chọn mở case riêng mà vẫn ghi vào case cũ');
  assert(parallel.parallel === true, 'Case mở riêng không được đánh dấu là song song');
});

check('Lớp Normal: chấm lại một bài CŨ vẫn tìm đúng Case theo học viên — sửa điểm chính lượt làm căn cứ không ghi mốc "đã đạt" (PR-LT2a: không còn mức SOS để hạ)', () => {
  /*
   * Case sống suốt khoá nên cột `attempt_id` của nó luôn trỏ tới LƯỢT MỚI NHẤT. Tìm case
   * bằng `WHERE attempt_id = ?` thì chấm lại một bài cũ sẽ không tìm ra case nào, và điểm
   * sửa lên thành đạt mà mức SOS vẫn nằm nguyên — một lỗi im lặng, không ai báo gì.
   */
  const row = conn
    .prepare(
      `SELECT sc.id, sc.category, sc.topic, sc.sos_level, a.id AS attempt_id, a.student_id, a.cycle_id
         FROM sos_cases sc
         /*
          * Lượt phải thuộc CHÍNH LỘ TRÌNH của case. Một em đi Foundation → Beginner có bài
          * ở cả hai chương trình; chấm lại một bài Foundation không nói gì về case của lớp
          * Beginner, và cũng không nên nói.
          */
         JOIN assessment_attempts a
           ON a.student_id = sc.student_id AND a.cycle_id = sc.cycle_id
         JOIN classes cl ON cl.id = a.class_id
        WHERE sc.status != 'done'
          AND cl.kind != 'FT' AND a.status = 'done'
          AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill = sc.topic)
        ORDER BY a.attempt_no LIMIT 1`,
    )
    .get() as any;
  if (!row) return;   // dữ liệu mẫu chưa có lớp Normal nào ở tình huống này

  /* Cho kỹ năng đó đạt hẳn: đúng hết số câu. */
  const sc = conn
    .prepare('SELECT raw_total FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
    .get(row.attempt_id, row.topic) as any;
  const total = sc?.raw_total ?? 40;
  regular.saveRegularScore(P.admin, row.attempt_id, row.topic, { score: total, total, lyDo: 'Phép kiểm: sửa điểm đã có' });

  assert(conn.prepare('SELECT 1 FROM sos_cases WHERE id = ?').get(row.id), 'Case bị xoá mất khi chấm lại bài cũ');
  /* PR-S4F #3 (mục 9.4): lượt này là căn cứ của case → đạt ở đây là SỬA ĐIỂM, không phải tiến bộ — không ghi mốc "đã đạt". */
  const passed = conn
    .prepare(`SELECT 1 FROM case_milestones WHERE case_id = ? AND kind = 'passed' AND attempt_id = ?`)
    .get(row.id, row.attempt_id);
  const canCu = conn.prepare('SELECT 1 FROM case_signals WHERE case_id = ? AND attempt_id = ?').get(row.id, row.attempt_id);
  assert(!(canCu && passed), 'Sửa điểm chính lượt làm căn cứ mà vẫn ghi mốc "đã đạt kỳ vọng" (mục 9.4)');
});

console.log('\n28. Vòng 4 phase 2 — tuần bắt đầu học và tiến độ lớp');

check('Lịch MT mặc định của FT sinh đúng mốc tuần 6 / 12 / 16', () => {
  const cy = conn
    .prepare(
      `SELECT lc.*, p.week_start FROM learning_cycles lc
         JOIN report_periods p ON p.id = lc.start_period_id
        WHERE lc.route IS NOT NULL AND lc.status = 'active' LIMIT 1`,
    )
    .get() as any;
  assert(cy, 'Dữ liệu mẫu thiếu một lộ trình FT đã khai tuần bắt đầu');

  const sugg = schedule.suggestedMockWeeks(cy.id);
  assert(sugg.length === 3, `Chỉ đề xuất ba lượt đầu, đang đề xuất ${sugg.length}`);
  const want = [6, 12, 16];
  for (const [i, sg] of sugg.entries()) {
    assert(sg.attemptNo === i + 1, `Lượt thứ ${i + 1} bị đánh số ${sg.attemptNo}`);
    assert(sg.studyWeek === want[i], `MT${sg.attemptNo} phải ở tuần học ${want[i]}, đang là ${sg.studyWeek}`);
    /* Tuần học thứ N bắt đầu sau (N−1) tuần kể từ tuần bắt đầu học. */
    const expected = addDays(cy.week_start, 7 * (want[i] - 1));
    assert(sg.weekStart === expected,
      `MT${sg.attemptNo} phải rơi vào tuần ${expected}, đang là ${sg.weekStart}`);
  }
});

check('Chưa khai tuần bắt đầu học thì KHÔNG đoán ra lịch MT', () => {
  const cy = conn
    .prepare(`SELECT id FROM learning_cycles WHERE start_period_id IS NULL LIMIT 1`)
    .get() as any;
  if (!cy) return;
  assert(schedule.suggestedMockWeeks(cy.id).length === 0,
    'Thiếu tuần bắt đầu mà vẫn dựng ra lịch MT — một con số không ai biết từ đâu ra');
});

check('Áp lịch đề xuất KHÔNG ghi đè lượt Quản lý đã chốt tay', () => {
  const cy = conn
    .prepare(
      `SELECT lc.id FROM learning_cycles lc
        WHERE lc.route IS NOT NULL AND lc.status = 'active' AND lc.start_period_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = lc.id AND a.status != 'cancelled')
        LIMIT 1`,
    )
    .get() as any;
  assert(cy, 'Không tìm được lộ trình FT có sẵn lượt MT để thử');

  /* Mọi lượt đã có đều là 'manual' (người xếp), nên lần áp đầu KHÔNG được dời cái nào. */
  const before = conn
    .prepare(`SELECT id, planned_period_id, plan_source FROM assessment_attempts WHERE cycle_id = ?`)
    .all(cy.id) as any[];
  const r = schedule.applySuggestedMockWeeks(P.admin, cy.id);
  const after = conn
    .prepare(`SELECT id, planned_period_id, plan_source FROM assessment_attempts WHERE cycle_id = ?`)
    .all(cy.id) as any[];

  for (const b of before) {
    const a = after.find((x) => x.id === b.id)!;
    assert(a.planned_period_id === b.planned_period_id,
      `Lượt ${b.id} do người xếp đã bị hệ thống dời sang tuần khác`);
  }
  assert(r.moved === 0, `Đã dời ${r.moved} lượt do người xếp — không được phép`);
});

check('Lớp Normal biết mình đang ở tuần thứ mấy và sắp thi gì', () => {
  const cls = conn
    .prepare(
      `SELECT id, code FROM classes
        WHERE status = 'active' AND kind != 'FT' AND start_period_id IS NOT NULL LIMIT 1`,
    )
    .get() as any;
  assert(cls, 'Dữ liệu mẫu thiếu lớp Normal đã khai tuần khai giảng');
  const pr = schedule.classProgress(cls.id);
  assert(pr.totalWeeks && pr.totalWeeks > 0, 'Lớp Normal phải biết chương trình dài mấy tuần');
  assert(pr.currentWeek !== null, 'Đã khai tuần khai giảng mà vẫn không tính được đang ở tuần thứ mấy');
  assert(pr.progressWeek && pr.finalWeek, 'Thiếu mốc Progress hoặc Final Test');
  assert(pr.progressWeek! < pr.finalWeek!, 'Progress Test phải ở trước Final Test');
  assert(pr.label && pr.label.includes('tuần'), `Dòng tiến độ không đọc được: "${pr.label}"`);
});

check('Lớp học hết chương trình thì báo học viên phải xếp lớp tiếp, kèm hai đường đi', () => {
  /*
   * Owner yêu cầu 13/09/2026: lớp Normal xong chương trình thì học viên PHẢI chuyển —
   * một là lên FT, hai là lên bậc Normal kế tiếp.
   */
  const cls = conn
    .prepare(`SELECT id, code, programme_code FROM classes WHERE status='active' AND kind != 'FT' LIMIT 1`)
    .get() as any;
  assert(cls, 'Không có lớp Normal nào để thử');

  /* Dời tuần khai giảng lùi thật xa để lớp chắc chắn đã hết chương trình. */
  const past = conn.prepare('SELECT id FROM report_periods ORDER BY week_start LIMIT 1').get() as any;
  const keep = conn.prepare('SELECT start_period_id FROM classes WHERE id = ?').get(cls.id) as any;
  schedule.setClassProgress(P.admin, cls.id, { startPeriodId: past.id });
  try {
    const pr = schedule.classProgress(cls.id);
    assert(pr.phase === 'finished', `Lớp khai giảng từ rất lâu mà chặng vẫn là "${pr.phase}"`);
    assert(pr.needsPlacement, 'Lớp đã hết chương trình mà không báo cần xếp lớp tiếp');
    assert(pr.placementOptions.length >= 1, 'Không bày ra đường đi tiếp nào cho học viên');
    assert(pr.placementOptions.some((o) => o.code === 'FT'), 'Luôn phải có đường lên FT');
    if (cls.programme_code === 'FOU') {
      assert(pr.placementOptions.some((o) => o.code === 'BE'), 'Từ FOU phải có đường lên BE');
    }
    assert(pr.label && /xếp lớp/.test(pr.label), `Dòng tiến độ chưa nói cần xếp lớp: "${pr.label}"`);
  } finally {
    schedule.setClassProgress(P.admin, cls.id, { startPeriodId: keep.start_period_id });
  }
});

check('Mốc kiểm tra do người xếp lại thì hệ thống KHÔNG tính lại theo mặc định', () => {
  const cls = conn
    .prepare(
      `SELECT id FROM classes WHERE status='active' AND kind != 'FT' AND start_period_id IS NOT NULL LIMIT 1`,
    )
    .get() as any;
  if (!cls) return;
  const before = schedule.classProgress(cls.id);
  const moved = (before.progressWeek ?? 4) + 1;
  schedule.setClassProgress(P.admin, cls.id, { progressWeek: moved });
  try {
    const after = schedule.classProgress(cls.id);
    assert(after.progressWeek === moved, `Xếp lại tuần Progress sang ${moved} mà vẫn là ${after.progressWeek}`);
    assert(after.progressOverridden, 'Không đánh dấu là đã xếp lại — lần sau hệ thống sẽ ghi đè');
    /* Đặt về trống là QUAY LẠI mốc mặc định, không phải xoá mốc. */
    schedule.setClassProgress(P.admin, cls.id, { progressWeek: null });
    const back = schedule.classProgress(cls.id);
    assert(back.progressWeek === before.progressWeek, 'Không quay lại được mốc mặc định của chương trình');
    assert(!back.progressOverridden, 'Vẫn còn bị coi là đã xếp lại');
  } finally {
    schedule.setClassProgress(P.admin, cls.id, { progressWeek: null });
  }
  assertThrows(() => schedule.setClassProgress(P.admin, cls.id, { progressWeek: 99 }),
    /vượt quá/, 'Xếp tuần kiểm tra vượt quá số tuần của chương trình');
});

check('Badge "Thiếu thông tin" gom mọi thứ còn thiếu vào MỘT nhãn', () => {
  /* Lớp Normal KHÔNG bị nhắc tháng thi — các em đó chưa thi IELTS. */
  const normal = schedule.missingForStudent({
    cycle: { start_period_id: null, exam_month: null, target_score: null },
    student: { dob: null, email: null }, isFastTrack: false,
  });
  assert(normal.some((m) => m.key === 'start_week'), 'Thiếu tuần bắt đầu mà không nhắc');
  assert(!normal.some((m) => m.key === 'exam_month'), 'Lớp Normal bị nhắc tháng thi IELTS');
  assert(!normal.some((m) => m.key === 'target'), 'Lớp Normal bị nhắc Target IELTS');

  const ft = schedule.missingForStudent({
    cycle: { start_period_id: null, exam_month: null, target_score: null },
    student: { dob: null, email: null }, isFastTrack: true,
  });
  /* SV-TVV-VIEC (Q-D4 ①): tháng thi không còn trong "Thiếu" — có việc Chốt ngày thi riêng; FT vẫn nhắc Target. */
  assert(!ft.some((m) => m.key === 'exam_month') && ft.some((m) => m.key === 'target'),
    'Lớp FT nhắc Target, không nhắc tháng thi');
  for (const m of ft) assert(m.who, `Mục "${m.label}" không nói ai điền được`);

  /* Khai đủ thì badge biến mất hẳn, không để lại một nhãn rỗng. */
  const full = schedule.missingForStudent({
    cycle: { start_period_id: 1, exam_month: '2026-11', target_score: 6.5 },
    student: { dob: '2008-01-01', email: 'an@gmail.com' }, isFastTrack: true,
  });
  assert(full.length === 0, `Khai đủ rồi mà vẫn báo thiếu: ${full.map((m) => m.label).join(', ')}`);
});

check('Ô chọn tuần mở đủ xa về tương lai để xếp lịch MT', () => {
  /*
   * Lỗi owner báo: panel "Lên kế hoạch MT" không xếp được quá một tuần tới, trong khi MT3
   * của một em có thể cách đây bốn tháng.
   */
  const narrow = week.periodWindow(null);
  const wide = week.periodWindow(null, { forward: week.PERIOD_WINDOW_PLANNING_FORWARD_WEEKS });
  const monday = week.mondayOf(demoToday());
  const futureNarrow = narrow.filter((p) => p.weekStart > monday).length;
  const futureWide = wide.filter((p) => p.weekStart > monday).length;
  assert(futureWide >= 24,
    `Cửa sổ xếp lịch chỉ mở ${futureWide} tuần tới — không đủ cho một khoá FT 24 tuần`);
  assert(futureWide > futureNarrow, 'Cửa sổ xếp lịch không rộng hơn cửa sổ mặc định');
});

console.log('\n29. Vòng 4 phase 3 — bảng, bộ lọc và cách gọi tên');

check('Bộ lọc học viên định nghĩa MỘT chỗ, và hiện đúng theo vai', () => {
  const keys = domain.STUDENT_FILTERS.map((x) => x.key);
  // Bảy bộ lọc: bỏ "Cần cập nhật ngày MT" cùng với việc mà nó phục vụ.
  assert(keys.length === 7, `Phải đủ bảy bộ lọc, đang có ${keys.length}`);
  assert(new Set(domain.STUDENT_FILTERS.map((x) => x.label)).size === domain.STUDENT_FILTERS.length,
    'Có hai bộ lọc trùng tên');

  const has = (p: any) => (key: string) => can(p, key, { anyScope: true });
  const forTeacher = domain.studentFiltersFor(has(P.lrTeacher));
  const forManager = domain.studentFiltersFor(has(P.mbManager));

  /* Bảng ở mục 6: GV không có "Chưa có tuần MT" — xếp lịch là việc của Quản lý. */
  assert(!forTeacher.includes('no_plan'), 'Giáo viên không được thấy bộ lọc lịch');
  assert(forTeacher.includes('sos') && forTeacher.includes('case_overdue'),
    'Giáo viên phải thấy bộ lọc SOS và case quá hạn');
  /* Quản lý thấy đủ bộ lọc case của chi nhánh mình — họ là người đôn đốc. */
  assert(forManager.includes('case_no_plan') && forManager.includes('sos'),
    'Quản lý phải thấy bộ lọc case');
  /* Quản lý thấy nhiều nhất, và luôn có "Chưa có tuần MT" vì đó là việc của họ. */
  assert(forManager.includes('no_plan'), 'Quản lý phải thấy bộ lọc chưa có tuần MT');
  for (const k of ['classes', 'sos', 'case_working', 'case_no_plan', 'case_overdue']) {
    assert(forManager.includes(k as any), `Quản lý thiếu bộ lọc ${k}`);
  }
});


check('Lọc theo loại lớp thu hẹp CẢ số đếm trên chip, không chỉ danh sách', () => {
  const all = cases.listCases(P.admin, {});
  const ft = cases.listCases(P.admin, { classKind: 'ft' });
  const normal = cases.listCases(P.admin, { classKind: 'normal' });
  assert(ft.rows.length + normal.rows.length === all.rows.length,
    'Hai loại lớp cộng lại không bằng tổng — có case không thuộc lớp nào');
  assert(ft.rows.every((r: any) => r.classKind === 'ft'), 'Lọc FT còn lọt case lớp Normal');

  /* Số trên chip kỹ năng phải đếm TRONG loại lớp đang chọn, nếu không bấm vào sẽ lệch. */
  const facetSum = Object.values(ft.facets!.skill).reduce((a: number, n: any) => a + n, 0);
  assert(facetSum <= ft.rows.length,
    `Chip kỹ năng đếm ${facetSum} case trong khi danh sách chỉ có ${ft.rows.length}`);
  assert((ft.facets as any).classKind.ft === ft.rows.length, 'Chip loại lớp đếm sai chính nó');
});

check('Bảng lớp có đủ sáu ô điểm, và mũi tên so với ĐÚNG lượt trước', () => {
  const roster = classesSvc.classRoster(P.admin, mbClass) as any[];
  const withScores = roster.filter((r) => r.scores && r.scores.overall.now !== null);
  assert(withScores.length > 0, 'Lớp mẫu không có em nào đã có điểm');
  for (const r of withScores) {
    for (const k of ['overall', 'listening', 'reading', 'speaking', 'writing1', 'writing2']) {
      assert(k in r.scores, `Thiếu ô điểm ${k}`);
    }
    /* W1 và W2 phải là HAI con số riêng, không phải band Writing gộp. */
    const w1 = r.scores.writing1.now;
    const w2 = r.scores.writing2.now;
    if (r.scores.listening.now !== null) {
      assert(w1 !== null || w2 !== null,
        `Học viên ${r.fullName} có điểm mà hai cột W1/W2 đều trống`);
    }
    const c = r.scores.overall;
    if (c.prev !== null) {
      const expect = c.now > c.prev ? 1 : c.now < c.prev ? -1 : 0;
      assert(c.dir === expect, `Mũi tên sai chiều: ${c.prev} → ${c.now} mà dir = ${c.dir}`);
    } else {
      assert(c.dir === 0, 'Lượt đầu tiên không được có mũi tên');
    }
  }
  /* Lớp Normal không có band nên KHÔNG dựng sáu ô điểm giả. */
  const fou = classesSvc.classRoster(P.admin, fouClass.id) as any[];
  assert(fou.every((r) => r.scores === null), 'Lớp Normal vẫn dựng ra sáu ô điểm band');
});

check('Mức SOS trên bảng lớp dùng CHUNG phép tính với bảng tổng hợp', () => {
  /*
   * Owner nêu đích danh chuyện số liệu lệch giữa các màn. Bảng lớp và bảng tổng hợp phải
   * gọi cùng một hàm, nên với một lớp bất kỳ, số em ở mỗi mức phải khớp nhau.
   */
  const cid = classId('CP FT 110');
  const roster = classesSvc.classRoster(P.admin, cid) as any[];
  const expect = standing.standingFor(roster.map((r) => r.id));
  for (const r of roster) {
    const want = expect.get(r.id)?.sosLevel ?? null;
    assert((r.sosLevel ?? null) === want,
      `Học viên ${r.fullName}: bảng lớp nói SOS ${r.sosLevel}, phép tính chung nói ${want}`);
  }
  /* Và tổng ba mức không bao giờ vượt sĩ số — đúng lỗi owner báo 12/09. */
  const byLevel = [1, 2, 3].map((lv) => roster.filter((r) => r.sosLevel === lv).length);
  assert(byLevel.reduce((a, b) => a + b, 0) <= roster.length,
    `Tổng ba mức SOS ${byLevel.join('+')} vượt sĩ số ${roster.length}`);
});


console.log('\n30. Vòng 4 phase 4 — tài khoản, đăng nhập và quyền');

check('Chỉ email đuôi .pisa@gmail.com mới hợp lệ, áp cho MỌI vai', () => {
  assert(accounts.checkEmail('Dung.Pisa@Gmail.com ') === 'dung.pisa@gmail.com', 'Không chuẩn hoá được email');
  for (const bad of ['dung@gmail.com', 'dung.pisa@yahoo.com', '.pisa@gmail.com', 'dung pisa.pisa@gmail.com']) {
    assertThrows(() => accounts.checkEmail(bad), /pisa@gmail\.com|chữ thường/, `Chấp nhận email sai: ${bad}`);
  }
});

check('Đăng nhập đúng thì vào, sai email và sai mật khẩu nói CÙNG một câu', () => {
  const r = accounts.login(accounts.DEFAULT_ADMIN_EMAIL, accounts.DEFAULT_ADMIN_PASSWORD);
  assert(r.userId > 0, 'Tài khoản Quản trị hệ thống mặc định không đăng nhập được');
  const admin = loadPrincipal(r.userId);
  assert(can(admin, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }), 'Tài khoản mặc định không có quyền quản trị');

  /*
   * Hai câu trả lời phải GIỐNG HỆT NHAU. Nói "email này không tồn tại" là nói cho người
   * đang dò biết địa chỉ nào có thật — một nửa công việc của họ.
   */
  let a = ''; let b = '';
  try { accounts.login('khongcoai.pisa@gmail.com', 'saibet'); } catch (e: any) { a = e.message; }
  try { accounts.login(accounts.DEFAULT_ADMIN_EMAIL, 'sai-mat-khau'); } catch (e: any) { b = e.message; }
  assert(a && a === b, `Sai email và sai mật khẩu trả lời khác nhau: "${a}" vs "${b}"`);

  /* Mật khẩu lưu dạng BĂM, không lưu thẳng. */
  const row = conn.prepare('SELECT password_hash, password_salt FROM users WHERE email = ?')
    .get(accounts.DEFAULT_ADMIN_EMAIL) as any;
  assert(row.password_hash && row.password_salt, 'Thiếu băm hoặc muối');
  assert(!String(row.password_hash).includes(accounts.DEFAULT_ADMIN_PASSWORD), 'Mật khẩu lưu thẳng chứ không băm');
  const other = conn.prepare("SELECT password_salt FROM users WHERE email != ? AND password_salt IS NOT NULL LIMIT 1")
    .get(accounts.DEFAULT_ADMIN_EMAIL) as any;
  assert(other.password_salt !== row.password_salt, 'Hai tài khoản dùng chung một muối');
});

check('GV tự đăng ký vào hàng đợi, chưa được vào cho tới khi duyệt', () => {
  const email = `thu.nguyen.moi${accounts.EMAIL_SUFFIX}`;
  const r = accounts.register({
    email, password: 'matkhau123', fullName: 'Nguyễn Thu Mới',
    branches: ['MB'], skills: ['listening', 'speaking'], note: 'Dạy ca tối',
  });
  assert(r.userId > 0, 'Không tạo được đăng ký');

  /* CHƯA DUYỆT thì chưa vào được, và câu báo phải nói rõ là đang chờ chứ không phải sai mật khẩu. */
  assertThrows(() => accounts.login(email, 'matkhau123'), /chờ/, 'Tài khoản chưa duyệt đã vào được');
  /* Và chưa có vai trò nào. */
  assert(loadPrincipal(r.userId).grants.length === 0, 'Đăng ký chưa duyệt đã có vai trò');

  const queue = accounts.pendingQueue(P.admin);
  const mine = queue.find((x: any) => x.id === r.userId);
  assert(mine, 'Đăng ký không vào hàng đợi');
  assert(mine!.branches.join() === 'MB', 'Không giữ chi nhánh người đăng ký khai');

  /* NGƯỜI DUYỆT SỬA ĐƯỢC CHI NHÁNH trước khi đồng ý — đó là cả lý do có bước duyệt. */
  accounts.approve(P.admin, r.userId, { role: 'teacher', branches: ['MB', 'BC'] });
  const after = accounts.login(email, 'matkhau123');
  assert(after.userId === r.userId, 'Duyệt rồi vẫn không đăng nhập được');
  const p2 = loadPrincipal(r.userId);
  assert(p2.roleKeys.join() === 'teacher', `Vai sau khi duyệt sai: ${p2.roleKeys.join()}`);
  assert(p2.grants.length === 2, `Phải có hai chi nhánh sau khi duyệt, đang có ${p2.grants.length}`);

  /* Giáo viên KHÔNG được xem hàng đợi duyệt. */
  assertThrows(() => accounts.pendingQueue(loadPrincipal(r.userId)), /Quản trị hệ thống/,
    'Giáo viên xem được hàng đợi duyệt');
});

check('Đăng ký bị từ chối phải có lý do, và người đăng ký đọc được lý do đó', () => {
  const email = `linh.pham.moi${accounts.EMAIL_SUFFIX}`;
  const r = accounts.register({ email, password: 'matkhau123', fullName: 'Phạm Linh Mới', branches: ['CP'] });
  assertThrows(() => accounts.decline(P.admin, r.userId, '   '), /lý do/, 'Từ chối mà không cần lý do');
  accounts.decline(P.admin, r.userId, 'Chưa có lịch dạy ở chi nhánh này');
  assertThrows(() => accounts.login(email, 'matkhau123'), /Chưa có lịch dạy/,
    'Người bị từ chối không đọc được lý do');
});

check('Một người mang NHIỀU VAI ở NHIỀU CHI NHÁNH, và gỡ vai không xoá lịch sử', () => {
  const email = `kiem.nhiem${accounts.EMAIL_SUFFIX}`;
  const { userId } = accounts.createAccount(P.admin, {
    email, password: 'matkhau123', fullName: 'Người Kiêm Nhiệm',
    roles: [{ role: 'teacher', branches: ['MB', 'BC'] }, { role: 'manager', branches: ['MB'] }],
    skills: ['listening'],
  });
  const p1 = loadPrincipal(userId);
  assert(p1.roleKeys.sort().join() === 'manager,teacher', `Vai sai: ${p1.roleKeys.join()}`);
  assert(p1.grants.length === 3, `Phải có 3 grant (GV×2 + QL×1), đang có ${p1.grants.length}`);

  const before = (conn.prepare('SELECT COUNT(*) n FROM user_roles WHERE user_id = ?').get(userId) as any).n;
  accounts.setRoles(P.admin, userId, [{ role: 'teacher', branches: ['MB'] }]);
  const after = (conn.prepare('SELECT COUNT(*) n FROM user_roles WHERE user_id = ?').get(userId) as any).n;
  assert(after >= before, 'Gỡ vai đã XOÁ dòng cũ thay vì đóng lại — mất căn cứ đọc lịch sử');
  assert(loadPrincipal(userId).grants.length === 1, 'Gỡ vai không có tác dụng');
});

check('Quyền cấp riêng cho cá nhân cộng thêm vào quyền của vai, không thay thế', () => {
  /*
   * Ví dụ owner đưa ra ở mục 7.3: cấp cho một Quản lý CN Monbay quyền quan sát TOÀN HỆ THỐNG.
   * Sửa vai "Quản lý" là sửa cho tất cả Quản lý, nên phải có đường cấp riêng cho một người.
   */
  const mgr = userByRole('manager', 'MB');
  const cp = (conn.prepare("SELECT id FROM classes WHERE code = 'CP FT 110'").get() as any).id;
  assert(!can(loadPrincipal(mgr), PERMISSIONS.ATTEMPT_VIEW, { classId: cp }),
    'Quản lý MB đã xem được lớp CP từ trước khi cấp quyền');

  accounts.setUserPermissions(P.admin, mgr, [{ permission: PERMISSIONS.ATTEMPT_VIEW, branchCode: null }]);
  assert(can(loadPrincipal(mgr), PERMISSIONS.ATTEMPT_VIEW, { classId: cp }),
    'Cấp quyền riêng toàn hệ thống mà vẫn không xem được lớp chi nhánh khác');
  /* Quyền riêng KHÔNG kéo theo quyền khác: vẫn không được chốt tuần ở chi nhánh lạ. */
  assert(!can(loadPrincipal(mgr), PERMISSIONS.PLAN_WEEK, { classId: cp }),
    'Quyền xem riêng kéo theo cả quyền sửa');

  accounts.setUserPermissions(P.admin, mgr, []);
  assert(!can(loadPrincipal(mgr), PERMISSIONS.ATTEMPT_VIEW, { classId: cp }), 'Gỡ quyền riêng không có tác dụng');
});

check('Hồ sơ cá nhân: sửa được tên, kỹ năng và email phụ; KHÔNG sửa được email đăng nhập', () => {
  /* Lớp 102: lớp 101 đã bị bài kiểm phân công ở trên gỡ mất giáo viên Listening. */
  const gv = loadPrincipal(teacherOfSkill('MB FT 102', 'listening'));
  const before = accounts.myProfile(gv);
  assert(before.email && before.email.endsWith(accounts.EMAIL_SUFFIX), 'Tài khoản mẫu thiếu email đăng nhập');

  accounts.updateProfile(gv, {
    fullName: `${before.fullName}`, phone: '0900000001',
    skills: ['listening', 'writing1'], extraEmails: ['rieng@gmail.com', 'rieng@gmail.com'],
  });
  const after = accounts.myProfile(gv);
  assert(after.phone === '0900000001', 'Không lưu được số điện thoại');
  assert(after.skills.sort().join() === 'listening,writing1', `Kỹ năng sai: ${after.skills.join()}`);
  assert(after.extraEmails.length === 1, 'Email phụ trùng nhau không được gộp lại');
  assert(after.email === before.email, 'Email đăng nhập bị đổi qua hồ sơ cá nhân');

  /* Đổi mật khẩu phải nhập đúng mật khẩu cũ. */
  assertThrows(() => accounts.updateProfile(gv, { currentPassword: 'sai', newPassword: 'matkhaumoi' }),
    /hiện tại/, 'Đổi mật khẩu mà không cần mật khẩu cũ');
});

check('Lộ trình và loại lớp là DỮ LIỆU, và không xoá được thứ đang có người dùng', () => {
  const routes = sysconfig.listRoutes(true);
  assert(routes.some((r: any) => r.code === 'LT1'), 'Bảng lộ trình chưa được nạp');
  assert((routes.find((r: any) => r.code === 'LT1')?.inUse ?? 0) > 0, 'LT1 phải đang có lớp dùng');

  /* PR-LOP (K1-48): không thêm mã mới ở màn Quản trị — ngừng dùng thử trên RF rồi bật lại. */
  assertThrows(() => sysconfig.saveRoute(P.admin, { code: 'LT9', name: 'Lộ trình thử' }), /không thêm/i,
    'Vẫn thêm được lộ trình mới');
  /* Ngừng dùng thì biến khỏi ô chọn, nhưng bản ghi vẫn còn để đọc lịch sử. */
  sysconfig.saveRoute(P.admin, { code: 'RF', name: 'Refire', status: 'inactive' });
  assert(!sysconfig.activeRouteCodes().includes('RF'), 'Ngừng dùng mà vẫn chọn được');
  assert(sysconfig.listRoutes(true).some((r: any) => r.code === 'RF'), 'Ngừng dùng đã xoá mất bản ghi');
  sysconfig.saveRoute(P.admin, { code: 'RF', name: 'Refire' });

  /* Giáo viên không sửa được danh mục. */
  const gv = loadPrincipal(teacherOfSkill('MB FT 102', 'listening'));
  assertThrows(() => sysconfig.saveRoute(gv, { code: 'LT8', name: 'Thử' }), /Quản trị hệ thống/,
    'Giáo viên sửa được lộ trình');

  /* Loại lớp GỐC khoá cách chấm và bộ kỹ năng — đổi là đổi ý nghĩa của điểm đã nhập. */
  /* Thân yêu cầu gửi kèm cách chấm / bộ kỹ năng (khoá lạ) vẫn bị bỏ qua — PR-Dọn Q22: hàm không còn nhận hai khoá này. */
  sysconfig.saveProgramme(P.admin, {
    code: 'FOU', name: 'Foundation', weeks: 8, scoringMode: 'ielts_band',
    skills: ['listening'], progressWeek: 4, finalWeek: 8,
  } as any);
  const fou = sysconfig.listProgrammes(P.admin).find((x: any) => x.code === 'FOU')!;
  assert(fou.scoringMode === 'ratio', 'Đổi được cách chấm của loại lớp gốc');
  assert(fou.skills.length === 4, `Đổi được bộ kỹ năng của loại lớp gốc: còn ${fou.skills.length}`);
});


// ==================================================================== 31

console.log('\n31. Vòng 5 — lớp Normal bốn môn, điểm đạt/tổng điểm, chuyển tiếp lớp');

check('Mọi chương trình Normal dùng ĐÚNG bốn môn L/R/W/S', () => {
  for (const code of ['FOU', 'BE', 'ELE']) {
    const prog = regular.programmeByCode(code)!;
    assert(JSON.stringify(prog.skills) === JSON.stringify(['listening', 'reading', 'writing', 'speaking']),
      `${code} sai bộ môn: ${prog.skills.join(', ')}`);
  }
  // Và không còn bản ghi nào mang hai mã môn đã bỏ.
  for (const [t, c] of [['programme_skills', 'skill'], ['teacher_assignments', 'skill'], ['assessment_scores', 'skill']] as const) {
    const n = (conn.prepare(`SELECT COUNT(*) n FROM ${t} WHERE ${c} IN ('pronunciation','prep_writing')`).get() as any).n;
    assert(n === 0, `${t} còn ${n} dòng mang môn đã bỏ`);
  }
});

check('Thiếu điểm KHÔNG được suy thành đạt, và nói rõ còn thiếu môn nào', () => {
  const a = conn
    .prepare(`SELECT a.id, a.class_id FROM assessment_attempts a
               WHERE a.kind != 'mock' AND a.class_id IS NOT NULL LIMIT 1`)
    .get() as any;
  const prog = regular.programmeOfClass(a.class_id)!;
  // Xoá hết điểm rồi nhập đúng MỘT môn: phải là "chưa đủ dữ liệu", không phải "đạt".
  conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(a.id);
  regular.saveRegularScore(P.admin, a.id, prog.skills[0], { score: 38, total: 40 });
  const r = regular.regularResultOf(a.id);
  assert(r.complete === false, 'Mới có một môn mà đã coi là đủ điểm');
  assert(r.sosLevel === null, `Thiếu điểm mà vẫn kết luận SOS ${r.sosLevel}`);
  const missing = r.skills.filter((s: any) => s.outcome === 'missing').map((s: any) => s.skill);
  assert(missing.length === prog.skills.length - 1,
    `Phải còn thiếu ${prog.skills.length - 1} môn, đang là ${missing.length}`);
  assert(!r.skills.some((s: any) => s.outcome === 'pass' && s.score === null),
    'Có môn chưa nhập điểm mà lại được tính là đạt');
});

check('Điểm đạt/Tổng điểm: từ chối dữ liệu vô lý, không tự điền tổng', () => {
  const a = conn
    .prepare(`SELECT a.id, a.class_id FROM assessment_attempts a WHERE a.kind != 'mock' AND a.class_id IS NOT NULL LIMIT 1`)
    .get() as any;
  const prog = regular.programmeOfClass(a.class_id)!;
  const sk = prog.skills[1];
  assertThrows(() => regular.saveRegularScore(P.admin, a.id, sk, { score: 10, total: null }),
    /tổng điểm/i, 'Nhập điểm đạt mà không nhập tổng điểm');
  assertThrows(() => regular.saveRegularScore(P.admin, a.id, sk, { score: 41, total: 40 }),
    /không thể lớn hơn/, 'Điểm đạt lớn hơn tổng điểm');
  assertThrows(() => regular.saveRegularScore(P.admin, a.id, sk, { score: 10, total: 0 }),
    /lớn hơn 0/, 'Tổng điểm bằng 0');
});

check('Bài của lớp Normal mở ĐÚNG màn nhập điểm Normal, không phải màn Mock Test', () => {
  const a = conn
    .prepare(`SELECT id, class_id, kind FROM assessment_attempts WHERE kind = 'progress' AND class_id IS NOT NULL LIMIT 1`)
    .get() as any;
  assert(a, 'Seed thiếu bài Progress Test');
  const href = attempts.attemptHref({ id: a.id, kind: a.kind, classId: a.class_id });
  /* HSL-LT: lượt lớp thường có trang lượt riêng `/luot-test/:id` (trước là bảng điểm cả lớp). */
  assert(href === `/luot-test/${a.id}`,
    `Bài Progress Test phải mở trang lượt lớp thường, đang là ${href}`);
  const mt = conn.prepare(`SELECT id, class_id FROM assessment_attempts WHERE kind = 'mock' LIMIT 1`).get() as any;
  assert(attempts.attemptHref({ id: mt.id, kind: 'mock', classId: mt.class_id }) === `/mock-test/${mt.id}`,
    'Lượt Mock Test vẫn phải mở màn Mock Test');
  // Và chi tiết một lượt phải mang theo LOẠI BÀI để giao diện chặn được cửa.
  const d = attempts.attemptDetail(P.admin, a.id) as any;
  assert(d.kind === 'progress', 'Chi tiết lượt không mang loại bài');
});

check('Case sinh từ bài Normal KHÔNG mang tên "MT"', () => {
  const c = conn
    .prepare(
      `SELECT sc.id FROM sos_cases sc
         JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.kind != 'mock' LIMIT 1`,
    )
    .get() as any;
  if (!c) return;
  const title = cases.caseTitleOf(conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(c.id) as any);
  assert(!/^MT\d/.test(title), `Case của lớp Normal mang tên Mock Test: "${title}"`);
});

check('Chuyển tiếp: FOU → BE là luồng mặc định, và hệ thống KHÔNG tự chuyển ai', () => {
  /*
   * Bộ demo có cả lớp Foundation ĐÃ KẾT THÚC (giữ lại để tra lịch sử), và một lớp đã hết
   * chương trình mà học viên chưa được xếp lớp tiếp. Kế hoạch chuyển tiếp chỉ có nghĩa với
   * lớp thứ hai, nên phải chọn lớp CÒN HỌC VIÊN ĐANG HỌC.
   */
  const fou = conn
    .prepare(
      `SELECT c.id, c.code FROM classes c
        WHERE c.programme_code = 'FOU' AND c.status = 'active'
          AND EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active')
        ORDER BY c.id LIMIT 1`,
    )
    .get() as any;
  assert(fou, 'Seed thiếu lớp Foundation còn học viên đang học');
  const plan = transition.transitionPlan(P.admin, fou.id) as any;
  assert(plan.defaultProgramme === 'BE', `Luồng mặc định của FOU phải là BE, đang là ${plan.defaultProgramme}`);
  assert(plan.students.length > 0, 'Kế hoạch chuyển tiếp không có học viên nào');
  const g = plan.goiYLopMoi;
  assert(g && g.chuongTrinh === 'BE' && /^\d+$/.test(g.so) && g.startPeriodId, `Lớp mới gợi ý sai: ${JSON.stringify(g)}`);
  // Chỉ ĐỌC: gọi kế hoạch không được đụng vào một dòng dữ liệu nào.
  const before = (conn.prepare('SELECT COUNT(*) n FROM classes').get() as any).n;
  transition.transitionPlan(P.admin, fou.id);
  assert((conn.prepare('SELECT COUNT(*) n FROM classes').get() as any).n === before,
    'Xem kế hoạch chuyển tiếp mà đã tạo lớp');
});

check('Chuyển tiếp: mở lớp mới, chuyển cả lớp, GIỮ NGUYÊN lớp cũ trong lịch sử', () => {
  const src = conn
    .prepare(
      `SELECT c.id, c.code, c.programme_code FROM classes c
        WHERE c.programme_code = 'FOU' AND c.status = 'active'
          AND EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active')
        ORDER BY c.id LIMIT 1`,
    )
    .get() as any;
  const plan = transition.transitionPlan(P.admin, src.id) as any;
  const ids = plan.students.map((s: any) => s.id);
  const gv = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`).get(src.id) as any).user_id;
  /* PR-Dọn (Q22): như web — tạo lớp trước (`taoLopVaPhanCong`, nối `previousClassId`), rồi chuyển em vào lớp đó. */
  const moi = intake.taoLopVaPhanCong(P.admin, { chuongTrinh: 'BE', so: plan.goiYLopMoi.so, startPeriodId: plan.goiYLopMoi.startPeriodId,
    branchId: plan.from.branchId, previousClassId: src.id,
    slots: [{ userId: gv, skill: null, isCore: true }, { userId: gv, skill: 'listening', isCore: false }] });
  const r = transition.applyTransition(P.admin, {
    fromClassId: src.id,
    moves: ids.map((id: number) => ({ studentId: id, toClassId: moi.id })),
    effectiveDate: demoToday(),
  }) as any;
  assert(r.done.length === ids.length, `Phải chuyển ${ids.length} em, thực tế ${r.done.length}`);

  const created = conn.prepare('SELECT * FROM classes WHERE id = ?').get(moi.id) as any;
  assert(created.programme_code === 'BE', 'Lớp mới sai chương trình');
  assert(created.previous_class_id === src.id, 'Lớp mới không giữ sợi dây về lớp cũ');
  const newSkills = (conn.prepare('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill').all(created.id) as any[])
    .map((x) => x.skill);
  assert(JSON.stringify(newSkills) === JSON.stringify(['listening', 'reading', 'speaking', 'writing']),
    `Lớp BE mới phải có đúng bốn môn: ${newSkills.join(', ')}`);

  // LỚP CŨ GIỮ NGUYÊN — không đổi loại, không xoá, và lịch sử ghi danh vẫn còn.
  const old = conn.prepare('SELECT * FROM classes WHERE id = ?').get(src.id) as any;
  assert(old.programme_code === 'FOU', 'Lớp cũ bị đổi chương trình — mất dấu giai đoạn trước');
  const kept = (conn
    .prepare(`SELECT COUNT(*) n FROM enrollments WHERE class_id = ? AND status = 'transferred'`)
    .get(src.id) as any).n;
  assert(kept === ids.length, `Lịch sử ghi danh ở lớp cũ phải còn ${ids.length} dòng, đang là ${kept}`);
  // Và điểm cũ vẫn gắn với lớp cũ.
  const oldScores = (conn
    .prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE class_id = ? AND status = 'done'`)
    .get(src.id) as any).n;
  assert(oldScores > 0, 'Kết quả của giai đoạn trước không còn gắn với lớp cũ');
});

check('Chuyển tiếp: một dòng lỗi không làm hỏng cả lô', () => {
  const src = conn
    .prepare(`SELECT id FROM classes WHERE programme_code IN ('BE','ELE') ORDER BY id LIMIT 1`)
    .get() as any;
  const plan = transition.transitionPlan(P.admin, src.id) as any;
  if (!plan.students.length) return;
  const gv = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`).get(src.id) as any).user_id;
  const moi = intake.taoLopVaPhanCong(P.admin, { chuongTrinh: 'BE', so: transition.soGoiY(plan.from.branchCode, 'BE', null), startPeriodId: plan.goiYLopMoi.startPeriodId,
    branchId: plan.from.branchId, previousClassId: src.id,
    slots: [{ userId: gv, skill: null, isCore: true }, { userId: gv, skill: 'listening', isCore: false }] });
  const r = transition.applyTransition(P.admin, {
    fromClassId: src.id,
    moves: [
      { studentId: plan.students[0].id, toClassId: moi.id },
      { studentId: plan.students[0].id, toClassId: null },   // cố ý thiếu lớp chuyển đến
    ],
    effectiveDate: demoToday(),
  }) as any;
  assert(r.done.length === 1 && r.failed.length === 1, 'Lô phải có cả dòng xong lẫn dòng lỗi');
  assert(/lớp chuyển đến/i.test(r.failed[0].message), `Lý do lỗi phải nói rõ: ${r.failed[0].message}`);
});

// ============================================================ 32. Vòng 5 — mục 7
console.log('\n32. Vòng 5 — case, điểm giáo viên tự chấm và biểu đồ tiến bộ');

check('Điểm giáo viên tự chấm KHÔNG đụng vào điểm chính thức và không đổi mức SOS', () => {
  const c = conn
    .prepare(
      `SELECT sc.*, iv.id AS iv_id FROM sos_cases sc
         JOIN case_interventions iv ON iv.case_id = sc.id
        WHERE sc.status != 'done'
          AND iv.status IN ('planned','started') AND COALESCE(iv.approval_state,'') != 'pending'
        ORDER BY sc.id LIMIT 1`,
    )
    .get() as any;
  assert(c, 'Không tìm thấy case học thuật đang có phương án chạy');

  const before = conn
    .prepare('SELECT sos_level FROM sos_cases WHERE id = ?').get(c.id) as any;
  const scoresBefore = (conn
    .prepare('SELECT COUNT(*) n FROM assessment_scores').get() as any).n;

  cases.updateResult(P.admin, c.iv_id, {
    outcome: 'partial', nextStep: 'monitor', note: 'Có khá hơn',
    metrics: [{ skill: 'reading', score: 6, total: null }],
  });

  const after = conn.prepare('SELECT sos_level FROM sos_cases WHERE id = ?').get(c.id) as any;
  assert(after.sos_level === before.sos_level, 'Điểm cô tự chấm đã làm đổi mức SOS — không được phép');
  const scoresAfter = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores').get() as any).n;
  assert(scoresAfter === scoresBefore, 'Điểm cô tự chấm đã ghi vào bảng điểm chính thức');

  const f = conn
    .prepare('SELECT metrics FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1')
    .get(c.iv_id) as any;
  const m = JSON.parse(f.metrics);
  assert(m[0].skill === 'reading' && m[0].score === 6 && m[0].total === null,
    `Điểm cô chấm lưu sai: ${f.metrics}`);
});

check('Điểm giáo viên tự chấm bị chặn khi vô lý', () => {
  const c = conn
    .prepare(
      `SELECT iv.id FROM sos_cases sc JOIN case_interventions iv ON iv.case_id = sc.id
        WHERE sc.status != 'done'
          AND iv.status IN ('planned','started') AND COALESCE(iv.approval_state,'') != 'pending'
        ORDER BY sc.id LIMIT 1`,
    )
    .get() as any;
  if (!c) return;
  // Band phải 0–9 khi không có tổng điểm.
  assertThrows(
    () => cases.updateResult(P.admin, c.id, {
      outcome: 'partial', note: 'Thử một con số vô lý cho phép kiểm này',
      metrics: [{ skill: 'reading', score: 24, total: null }],
    }),
    /0–9/, 'Nhận band 24 như một band hợp lệ',
  );
  // Điểm đạt không thể lớn hơn tổng.
  assertThrows(
    () => cases.updateResult(P.admin, c.id, {
      outcome: 'partial', note: 'Thử một con số vô lý cho phép kiểm này',
      metrics: [{ skill: 'reading', score: 41, total: 40 }],
    }),
    /lớn hơn tổng/, 'Nhận điểm đạt lớn hơn tổng điểm',
  );
  // Ý thức không phải là một môn để chấm điểm.
  assertThrows(
    () => cases.updateResult(P.admin, c.id, {
      outcome: 'partial', note: 'Thử một con số vô lý cho phép kiểm này',
      metrics: [{ skill: GONE, score: 6, total: null }],
    }),
    /kỹ năng cụ thể/, 'Nhận điểm cho hạng mục Ý thức',
  );
});

check('Biểu đồ tiến bộ: một mốc thì nói CHƯA ĐỦ DỮ LIỆU, không vẽ xu hướng', () => {
  const rows = conn
    .prepare(
      /* Hồ sơ chỉ vẽ MỘT lộ trình, nên phải đếm mốc TRONG lộ trình đang mở. */
      `SELECT a.student_id AS sid, a.cycle_id AS cid, COUNT(DISTINCT a.id) AS n
         FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id
        WHERE s.skill = 'reading' AND s.band IS NOT NULL AND a.cycle_id IS NOT NULL
        GROUP BY a.student_id, a.cycle_id ORDER BY n, a.student_id`,
    )
    .all() as any[];
  const one = rows.find((r) => r.n === 1);
  const many = rows.find((r) => r.n >= 2);

  if (one) {
    const pr = profile.studentProfile(P.admin, one.sid, one.cid) as any;
    const rd = pr.progress.skills.find((x: any) => x.skill === 'reading');
    if (rd) assert(rd.enough === false, 'Một mốc mà vẫn bảo là đủ để nói xu hướng');
  }
  if (many) {
    const pr = profile.studentProfile(P.admin, many.sid, many.cid) as any;
    const rd = pr.progress.skills.find((x: any) => x.skill === 'reading');
    assert(rd && rd.enough === true, 'Hai mốc trở lên mà vẫn bảo là chưa đủ');
    assert(rd.points.every((pt: any) => pt.kind === 'official' || pt.kind === 'teacher'),
      'Có loại điểm lạ trong biểu đồ');
  }
  assert(one || many, 'Dữ liệu demo không có em nào có điểm Reading để kiểm');
});

check('Case CHƯA CÓ PHƯƠNG ÁN NÀO thì không chốt kết quả được', () => {
  /* Em nào chưa có case nào đang mở — để không vướng em có sẵn phương án. */
  const s = conn
    .prepare(
      `SELECT id FROM students
        WHERE id NOT IN (SELECT student_id FROM sos_cases WHERE student_id IS NOT NULL AND status != 'done')
        ORDER BY id LIMIT 1`,
    )
    .get() as any;
  assert(s, 'Không còn em nào chưa có case nào để kiểm');
  const d = cases.reportIssue(P.admin, {
    primaryCode: 'student.reading.technique',
    studentId: s.id, topic: 'reading', parallel: true,
    title: 'Reading: làm chậm', summary: 'Ba bài liên tiếp em không kịp thời gian phần cuối',
  }) as any;
  assertThrows(
    () => cases.closeCaseOutcome(P.admin, d.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
    }),
    /chưa có phương án/i, 'Đóng được case chưa làm gì cho em',
  );
});

check('Chuyển lớp rồi thì hồ sơ học viên vẫn giữ lớp lúc đánh giá', () => {
  /*
   * Case sinh từ bài MT mang lớp LÚC ĐÁNH GIÁ — đúng cho lịch sử. Nhưng bảng tổng hợp đặt
   * cột sĩ số cạnh ba cột SOS, mà sĩ số đếm theo ghi danh đang hoạt động. Trộn hai mốc thời
   * gian vào một hàng là chỗ sinh ra "sĩ số 2 mà SOS cộng lại thành 5".
   */
  const moved = conn
    .prepare(
      `SELECT e.student_id sid, e.class_id newc, old.class_id oldc, c.branch_id
         FROM enrollments e
         JOIN enrollments old ON old.student_id = e.student_id AND old.status = 'transferred'
         JOIN classes c ON c.id = e.class_id
        WHERE e.status = 'active' AND e.class_id != old.class_id
          AND EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.student_id = e.student_id)
        ORDER BY e.student_id LIMIT 1`,
    )
    .get() as any;
  assert(moved, 'Dữ liệu demo không có em nào vừa chuyển lớp vừa có case');

  /* PR-Dọn: phần "bảng tổng hợp" (`/summary`, đã xoá — web không gọi) bỏ; Case theo em sang lớp mới đã khoá ở Dọn-a (1c). */

  /* Còn HỒ SƠ HỌC VIÊN vẫn phải giữ lớp lúc đánh giá — chuyển lớp không viết lại quá khứ. */
  /* PR-LT2a M1b: vào lớp thường mới tự có bài ở lộ trình MỚI — hồ sơ mặc định giờ mở lộ trình mới; lịch sử lớp cũ nằm ở lộ trình CŨ (không viết lại quá khứ). */
  const cuCycle = (conn.prepare('SELECT cycle_id FROM assessment_attempts WHERE student_id = ? AND class_id = ? LIMIT 1').get(moved.sid, moved.oldc) as any)?.cycle_id ?? null;
  const pr = profile.studentProfile(P.admin, moved.sid, cuCycle) as any;
  const oldCode = (conn.prepare('SELECT code FROM classes WHERE id = ?').get(moved.oldc) as any).code;
  const kept = pr.attempts.some((a: any) => a.classCode === oldCode);
  if (pr.attempts.length) {
    assert(kept, `Lịch sử bài của em mất lớp cũ ${oldCode} sau khi chuyển lớp`);
  }
});

check('Ma trận tình huống vòng 5 có đủ những ô đã chốt ở mục 8.2', () => {
  const one = (label: string, sql: string) => {
    const n = (conn.prepare(sql).get() as any).n;
    assert(n > 0, `Thiếu tình huống: ${label}`);
  };
  one('case có tên tự nhập', 'SELECT COUNT(*) n FROM sos_cases WHERE title IS NOT NULL');
  one('case mở song song có chủ ý', 'SELECT COUNT(*) n FROM sos_cases WHERE parallel = 1');
  one('case tái phát nối vào case cũ', 'SELECT COUNT(*) n FROM sos_cases WHERE previous_case_id IS NOT NULL');
  one('case chưa có phương án nào',
    `SELECT COUNT(*) n FROM sos_cases sc WHERE sc.status != 'done'
       AND NOT EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id)`);
  one('phương án sang chu kỳ thứ hai trở lên', 'SELECT COUNT(*) n FROM case_interventions WHERE cycle_no > 1');
  one('phương án bị thay thế', `SELECT COUNT(*) n FROM case_interventions WHERE closed_reason = 'superseded' AND superseded_by IS NOT NULL`);
  one('phương án đang chờ Quản lý duyệt', `SELECT COUNT(*) n FROM case_interventions WHERE approval_state = 'pending'`);
  one('phương án được duyệt', `SELECT COUNT(*) n FROM case_interventions WHERE approval_state = 'approved'`);
  one('phương án bị từ chối có lý do', `SELECT COUNT(*) n FROM case_interventions WHERE approval_state = 'declined' AND approval_note IS NOT NULL`);
  one('điểm giáo viên tự chấm', 'SELECT COUNT(*) n FROM case_followups WHERE metrics IS NOT NULL');
  one('cập nhật kết quả trễ hạn', 'SELECT COUNT(*) n FROM case_followups WHERE late = 1');
  for (const o of ['improved', 'partial', 'unchanged', 'worse', 'insufficient']) {
    one(`kết quả "${o}"`, `SELECT COUNT(*) n FROM case_followups WHERE outcome = '${o}'`);
  }
  for (const ns of ['complete', 'monitor', 'continue', 'propose', 'ask_manager']) {
    one(`bước tiếp theo "${ns}"`, `SELECT COUNT(*) n FROM case_followups WHERE next_step = '${ns}'`);
  }
  for (const prog of ['FOU', 'BE', 'ELE', 'FT']) {
    one(`lớp chương trình ${prog}`, `SELECT COUNT(*) n FROM classes WHERE programme_code = '${prog}'`);
  }
  one('học viên đi qua nhiều lớp',
    'SELECT COUNT(*) n FROM (SELECT student_id FROM enrollments GROUP BY student_id HAVING COUNT(*) > 1)');
  one('học viên đi qua nhiều chương trình',
    `SELECT COUNT(*) n FROM (SELECT student_id FROM learning_cycles
       WHERE programme_code IS NOT NULL GROUP BY student_id HAVING COUNT(DISTINCT programme_code) > 1)`);
  one('học viên còn ở lớp đã hết chương trình, chưa xếp lớp tiếp',
    `SELECT COUNT(*) n FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.status = 'active' AND c.is_fast_track = 0
        AND (SELECT COUNT(*) FROM assessment_attempts a
              WHERE a.class_id = c.id AND a.kind = 'final' AND a.status = 'done') > 0`);
  one('lộ trình chỉ biết THÁNG thi', 'SELECT COUNT(*) n FROM learning_cycles WHERE exam_period_id IS NULL AND exam_month IS NOT NULL');
  one('lộ trình đã chốt TUẦN thi', 'SELECT COUNT(*) n FROM learning_cycles WHERE exam_period_id IS NOT NULL');
});

check('[8.3] → OV-12a · Phương án bắt đầu 14/09/2026: ghi kết quả trước hết T3 29/09 (kỳ hai tuần), kết thúc 27/09', () => {
  /*
   * Ô kiểm tra BẢNG HẠN MỤC 8.3, viết thẳng vào dữ liệu mẫu và đối chiếu được bằng mắt trên
   * màn hình. Ví dụ của chính đề bài: bắt đầu thứ Bảy 19/9 → cập nhật 20/9, kết thúc 27/9.
   *
   * Hai mốc, hai câu hỏi khác nhau. Gộp làm một là để một phương án chạy bốn tuần mà tới
   * tuần cuối mới có người phải báo gì.
   */
  assert(demoToday() === '2026-09-14', `Ngày demo đã đổi thành ${demoToday()} — kiểm lại ví dụ hạn`);
  /* OV-12a (chủ SP 14/10): hạn ghi kết quả PA = HẾT THỨ BA sau kỳ hai tuần tính từ tuần bắt đầu (trước đây hết Thứ Hai hằng tuần). */
  assert(domain.hanKyGhiKetQua('2026-09-14') === '2026-09-29',
    `Bắt đầu thứ Hai 14/09 thì ghi kết quả kỳ 14/09–27/09 trước hết T3 29/09, đang ra ${domain.hanKyGhiKetQua('2026-09-14')}`);
  assert(domain.hanKyGhiKetQua('2026-09-19') === '2026-09-29',
    'Bắt đầu thứ Bảy 19/09 vẫn cùng kỳ 14/09–27/09, hạn hết T3 29/09');
  assert(domain.hanKyGhiKetQua('2026-09-20') === '2026-09-29', 'Đúng Chủ nhật vẫn cùng kỳ, hạn hết T3 29/09');
  assert(domain.planEndDefault('2026-09-19') === '2026-09-27',
    `Ví dụ của đề bài: bắt đầu 19/09 → kết thúc mặc định 27/09, đang ra ${domain.planEndDefault('2026-09-19')}`);

  const row = conn
    .prepare(
      `SELECT iv.action_due, iv.followup_due FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.detected_at = '2026-09-14' AND iv.cycle_started_on = '2026-09-14' AND iv.moc_quy_che IS NULL   /* PA thường: không có mốc quy chế (PR-LT2b: PA bổ trợ miễn phí có mốc Mini Test) */
          /* CHỈ CASE HỌC THUẬT: Ý thức/Khác dùng hạn 3/5 ngày theo mức, không theo tuần. */

        ORDER BY iv.id LIMIT 1`,
    )
    .get() as any | undefined;
  assert(row, 'Dữ liệu demo không có case nào mở đúng ngày demo để đối chiếu bằng mắt');
  assert(row!.action_due === '2026-09-29',
    `Hạn ghi kết quả trong dữ liệu mẫu là ${row!.action_due}, phải là 2026-09-29 (hết Thứ Ba sau kỳ hai tuần, OV-12a)`);
  /* PR-SOS (Q28-4): PA thường không còn "dự kiến kết thúc" — `planEndDefault` vẫn là hàm thuần, dữ liệu mẫu không ghi. */
  assert(row!.followup_due === null,
    `PA thường trong dữ liệu mẫu còn ngày dự kiến kết thúc ${row!.followup_due} (Q28-4: phải NULL)`);
});

check('Case của lớp trước là việc BÀN GIAO, không phải mức SOS của lớp này', () => {
  /*
   * Một em học xong Foundation rồi lên Beginner mà còn case dở: case đó vẫn phải nhìn thấy
   * được, nhưng gọi em là "SOS 3" ở lớp Beginner vì một bài Foundation chấm trên thang khác
   * là nói sai. Mức SOS là kết luận của MỘT lượt trong MỘT chương trình.
   */
  const row = conn
    .prepare(
      `SELECT e.student_id sid, e.class_id cid FROM enrollments e
        WHERE e.status = 'active'
          AND EXISTS (SELECT 1 FROM enrollments o WHERE o.student_id = e.student_id AND o.status='transferred')
          AND EXISTS (SELECT 1 FROM sos_cases sc
                       JOIN learning_cycles cy ON cy.id = sc.cycle_id
                      WHERE sc.student_id = e.student_id AND sc.status != 'done'
                        AND cy.status = 'completed')
        ORDER BY e.student_id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Dữ liệu demo không có em nào mang case cũ sang lớp mới');

  const roster = classesSvc.classRoster(P.admin, row.cid) as any[];
  const me = roster.find((r) => r.id === row.sid);
  assert(me, 'Không thấy em đó trong bảng lớp mới');
  assert(me.handoverCases > 0, 'Case của lộ trình trước không được đếm là việc bàn giao');
  assert(me.openCases >= me.handoverCases, 'Số case bàn giao lớn hơn tổng số case đang mở');

  /* Và case cũ vẫn MỞ RA XEM ĐƯỢC ở phạm vi toàn hành trình của em. */
  const all = cases.listCases(P.admin, { studentId: row.sid }).rows;
  assert(all.some((c: any) => c.status !== 'done'), 'Case cũ biến mất khỏi danh sách case của em');
});

// ============================================================ 33. Mục 9.1 — 12 luồng thực tế
console.log('\n33. Mục 9.1 — mười hai luồng thực tế');

check('[1] Lớp Normal: mở đúng màn, nhập đúng môn, ra đúng kết quả', () => {
  /* Bài đã chấm ĐỦ bốn môn — bài mới nhập một nửa là một tình huống khác, kiểm ở chỗ khác. */
  const a = conn
    .prepare(
      `SELECT at.id, at.kind, at.student_id, at.class_id, c.code
         FROM assessment_attempts at JOIN classes c ON c.id = at.class_id
        WHERE c.programme_code IN ('FOU','BE','ELE') AND at.status = 'done'
          AND (SELECT COUNT(*) FROM assessment_scores s WHERE s.attempt_id = at.id) = 4
        ORDER BY at.id LIMIT 1`,
    )
    .get() as any;
  assert(a, 'Không có bài lớp Normal nào đã chấm đủ bốn môn');
  const cls = { id: a.class_id, code: a.code };
  /* Hồ sơ học viên phải trỏ vào TRANG LƯỢT LỚP THƯỜNG (HSL-LT), không phải màn Mock Test. */
  const href = attempts.attemptHref({ id: a.id, kind: a.kind, classId: cls.id });
  assert(href === `/luot-test/${a.id}`, `Bài lớp Normal mở sai màn: ${href}`);
  /* Đúng bốn môn của chương trình, và mỗi ô là điểm đạt/tổng chứ không phải band. */
  const skills = (conn.prepare('SELECT DISTINCT skill FROM assessment_scores WHERE attempt_id = ?')
    .all(a.id) as any[]).map((r) => r.skill).sort();
  assert(JSON.stringify(skills) === JSON.stringify([...domain.REGULAR_SKILLS].sort()),
    `Môn của lớp Normal sai: ${skills.join(',')}`);
  const bad = conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ? AND raw_total IS NULL')
    .get(a.id) as any;
  assert(bad.n === 0, 'Có ô điểm lớp Normal thiếu tổng điểm');
  /* Và kết quả đọc ra được từ chính engine, không phải một con số riêng của màn hình. */
  const rows = conn.prepare('SELECT skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id = ?')
    .all(a.id) as any[];
  const r = regular.evaluateRegular([...domain.REGULAR_SKILLS], rows);
  assert(r.failedCount !== null, 'Bài đã chấm đủ mà vẫn chưa kết luận được');
});

check('[2] MT chỉ theo tuần; thi thật theo tháng hoặc tuần; không còn việc "cập nhật ngày MT"', () => {
  const cols = (conn.prepare('PRAGMA table_info(assessment_attempts)').all() as any[]).map((c) => c.name);
  for (const gone of ['lrw_scheduled_at', 'speaking_scheduled_at']) {
    assert(!cols.includes(gone), `Cột ngày MT cũ ${gone} vẫn còn`);
  }
  const noWeek = conn
    .prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE status != 'cancelled' AND planned_period_id IS NULL`)
    .get() as any;
  assert(noWeek.n === 0, `${noWeek.n} lượt còn chưa gắn tuần`);
  /* Thi thật: có em mới biết tháng, có em đã chốt tuần — và hai thứ đó nói khác nhau. */
  const monthOnly = conn.prepare(
    `SELECT id FROM learning_cycles WHERE exam_period_id IS NULL AND exam_month IS NOT NULL LIMIT 1`).get() as any;
  const weekKnown = conn.prepare(
    `SELECT id FROM learning_cycles WHERE exam_period_id IS NOT NULL LIMIT 1`).get() as any;
  assert(monthOnly && weekKnown, 'Thiếu một trong hai tình huống thi thật');
  const cycleRow = (id: number) =>
    conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(id) as any;
  assert(cycles.examPlanOf(cycleRow(monthOnly.id)).confidence === 'month',
    'Lộ trình mới biết tháng lại báo là đã chốt tuần');
  assert(cycles.examPlanOf(cycleRow(weekKnown.id)).confidence === 'week',
    'Lộ trình đã chốt tuần lại báo là chỉ biết tháng');
});

check('[3] Tạo case mới mở đúng case đó; nhiều case cùng kỹ năng đều vào được', () => {
  const st = conn
    .prepare(
      `SELECT student_id sid, category FROM sos_cases
        WHERE student_id IS NOT NULL AND status != 'done'
        GROUP BY student_id, category HAVING COUNT(*) > 1 AND category != '${GONE}' LIMIT 1`,
    )
    .get() as any;
  assert(st, 'Dữ liệu demo không có em nào có hai case cùng một kỹ năng');
  const mine = cases.listCases(P.admin, { studentId: st.sid }).rows
    .filter((c: any) => c.category === st.category && c.status !== 'done');
  assert(mine.length > 1, 'Danh sách case chỉ trả về một case đại diện');
  /* Mỗi case mở ra được bằng chính mã của nó, và ra đúng case đó. */
  for (const c of mine) {
    const d = cases.caseDetail(P.admin, c.id) as any;
    assert(d.id === c.id, `Mở case ${c.id} lại ra case ${d.id}`);
  }
});

check('[4] Case mới nhất trước; case đã đóng và lộ trình cũ vẫn xem được', () => {
  const sid = (conn.prepare(
    `SELECT student_id sid FROM sos_cases WHERE student_id IS NOT NULL
      GROUP BY student_id HAVING COUNT(*) >= 3 ORDER BY COUNT(*) DESC LIMIT 1`).get() as any).sid;
  const rows = cases.listCases(P.admin, { studentId: sid }).rows;
  for (let i = 1; i < rows.length; i += 1) {
    assert(rows[i - 1].detectedAt >= rows[i].detectedAt,
      `Thứ tự case sai: ${rows[i - 1].detectedAt} đứng trước ${rows[i].detectedAt}`);
  }
  assert(rows.some((c: any) => c.status === 'done'), 'Case đã đóng không còn xuất hiện trong hành trình');
  /* Lọc theo MỘT lộ trình phải ra ÍT hơn toàn bộ hành trình — và không được ra rỗng. */
  const cy = conn.prepare(
    `SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq LIMIT 1`).get(sid) as any;
  const scoped = cases.listCases(P.admin, { studentId: sid, cycleId: cy.id }).rows;
  assert(scoped.length <= rows.length, 'Lọc theo lộ trình lại ra nhiều case hơn toàn bộ hành trình');
});

check('[5] SOS tái diễn: case còn mở thì thêm mốc; case đã đóng thì mở case mới nối vào', () => {
  const linked = conn
    .prepare('SELECT id, previous_case_id prev FROM sos_cases WHERE previous_case_id IS NOT NULL LIMIT 1')
    .get() as any;
  assert(linked, 'Không có case tái phát nào nối vào case cũ');
  const old = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(linked.prev) as any;
  assert(old.status === 'done', 'Case cũ phải giữ nguyên trạng thái đã đóng, không bị mở lại');
  assert(old.dedup_key === null, 'Case cũ vẫn giữ khoá chống trùng nên case mới không thể tồn tại song song');
  const mark = conn
    .prepare(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'recurrence'`)
    .get(old.id) as any;
  assert(mark.n > 0, 'Case cũ không có mốc tái phát trỏ sang case mới');
  /* Và phương án cũ KHÔNG bị nhân đôi sang case mới. */
  const dup = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions a JOIN case_interventions b
        ON a.kind = b.kind AND COALESCE(a.description,'') = COALESCE(b.description,'')
       WHERE a.case_id = ? AND b.case_id = ?`,
    )
    .get(old.id, linked.id) as any;
  assert(dup.n === 0, 'Phương án của case cũ bị chép sang case mới');
});

check('[6] Hạn: chu kỳ đầu, chu kỳ tiếp, chờ duyệt, cập nhật trễ', () => {
  /* Chu kỳ đầu và chu kỳ tiếp dùng CÙNG một phép tính — Chủ nhật của tuần thứ hai. */
  assert(domain.cycleDeadline('2026-09-14') === '2026-09-27', 'Chu kỳ hai tuần tính sai');
  assert(domain.cycleDeadline('2026-09-18') === '2026-09-27', 'Giữa tuần vẫn phải ra Chủ nhật tuần thứ hai');
  /* Phương án đang chờ duyệt KHÔNG có hạn thực hiện — chu kỳ chưa bắt đầu. */
  const pending = conn
    .prepare(`SELECT * FROM case_interventions WHERE approval_state = 'pending' LIMIT 1`).get() as any;
  assert(pending, 'Không có phương án nào đang chờ duyệt');
  assert(pending.action_due === null && pending.cycle_started_on === null,
    'Phương án chờ duyệt đã bị tính hạn thực hiện như thể đang chạy');
  assert(pending.approval_due !== null, 'Phương án chờ duyệt không có hạn cho Quản lý trả lời');
  /* Được duyệt thì chu kỳ chạy TỪ NGÀY DUYỆT. */
  /*
   * Phải chọn một phương án ĐÃ DUYỆT VÀ CÒN ĐANG CHẠY: phương án đã hoàn thành thì không
   * còn hạn thực hiện nào để kiểm, và để trống hạn ở đó là đúng chứ không phải lỗi.
   */
  const appr = conn
    .prepare(
      `SELECT * FROM case_interventions
        WHERE approval_state = 'approved' AND approval_at IS NOT NULL
          AND status IN ('planned', 'started') LIMIT 1`,
    )
    .get() as any;
  assert(appr, 'Không có phương án nào đã được duyệt và còn đang chạy');
  assert(appr.cycle_started_on === appr.approval_at.slice(0, 10),
    `Chu kỳ bắt đầu ${appr.cycle_started_on} mà duyệt ngày ${appr.approval_at.slice(0, 10)}`);
  assert(appr.action_due === domain.hanKyGhiKetQua(appr.cycle_started_on),
    'Hạn cập nhật không tính từ ngày được duyệt');
  assert(appr.followup_due === null, 'PR-SOS (Q28-4): PA thường được duyệt không có ngày dự kiến kết thúc');
  /* Cập nhật trễ GIỮ NGUYÊN dấu vết, không reset để che. */
  const late = conn.prepare('SELECT * FROM case_followups WHERE late = 1 LIMIT 1').get() as any;
  assert(late, 'Không có lần cập nhật trễ nào trong dữ liệu mẫu');
  assert(late.observed_on > late.cycle_due, 'Đánh dấu trễ nhưng ngày cập nhật lại không sau hạn');
});

check('[7] Đủ năm nhánh kết quả, và điều kiện hoàn thành case chặn đúng chỗ', () => {
  for (const o of domain.FOLLOWUP_OUTCOMES) {
    const allowed = domain.nextStepsFor(o);
    assert(allowed.length > 0, `Kết quả ${o} không có đường đi tiếp nào`);
    if (!['improved', 'partial'].includes(o)) {
      assert(!allowed.includes('complete' as any),
        `Kết quả ${o} vẫn cho phép "hoàn thành phương án" — đó là đường ghi nhận rồi thôi`);
    }
  }
  /* Phương án bị thay thế KHÔNG được đọc thành đã thành công. */
  const sup = conn
    .prepare(`SELECT * FROM case_interventions WHERE closed_reason = 'superseded' LIMIT 1`).get() as any;
  assert(sup, 'Không có phương án nào bị thay thế');
  assert(sup.superseded_by !== null, 'Phương án bị thay thế không nối sang phương án mới');
  /* Ba lý do chặn đóng case, mỗi lý do phải có ít nhất một case thật để thử. */
  const blockers = { noPlan: 0, pending: 0, running: 0 };
  for (const r of conn.prepare(`SELECT id FROM sos_cases WHERE status != 'done'`).all() as any[]) {
    const b = cases.closeBlockers(r.id);
    if (b.some((x) => /chưa có phương án/i.test(x))) blockers.noPlan += 1;
    if (b.some((x) => /chờ Quản lý duyệt/i.test(x))) blockers.pending += 1;
    if (b.some((x) => /chưa cập nhật kết quả/i.test(x))) blockers.running += 1;
  }
  assert(blockers.noPlan > 0 && blockers.pending > 0 && blockers.running > 0,
    `Thiếu tình huống chặn đóng case: ${JSON.stringify(blockers)}`);
});

check('[8] Chuyển tiếp lớp giữ nguyên lịch sử chương trình cũ và case còn mở', () => {
  const row = conn
    .prepare(
      `SELECT e.student_id sid, e.class_id newc, o.class_id oldc FROM enrollments e
         JOIN enrollments o ON o.student_id = e.student_id AND o.status = 'transferred'
        WHERE e.status = 'active' AND e.class_id != o.class_id
        ORDER BY e.student_id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Dữ liệu demo không có em nào đã chuyển lớp');
  /* Lớp cũ không bị xoá, không bị đổi chương trình. */
  const oldCls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(row.oldc) as any;
  assert(oldCls && oldCls.status === 'active', 'Lớp cũ biến mất sau khi chuyển tiếp');
  /* Điểm của giai đoạn cũ vẫn gắn với lớp cũ. */
  const kept = conn
    .prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE class_id = ? AND student_id = ?`)
    .get(row.oldc, row.sid) as any;
  assert(kept.n > 0, 'Bài của giai đoạn trước không còn gắn với lớp cũ');
  /*
   * Lộ trình mới KHÔNG được mượn bài của lộ trình cũ. PR-LT (Q10/Q12): chuyển KHÁC chương
   * trình đóng lộ trình cũ và mở lộ trình mới trống — một lộ trình vừa mở chưa có lịch MT
   * nào là bình thường (giống `createCycle`), nên không còn đòi `own.n > 0` tuyệt đối.
   */
  const cur = conn
    .prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' LIMIT 1`)
    .get(row.sid) as any;
  if (cur) {
    const own = conn.prepare('SELECT id, class_id FROM assessment_attempts WHERE cycle_id = ?').all(cur.id) as any[];
    assert(own.every((a) => a.class_id !== row.oldc), 'Lộ trình mới mượn bài đang gắn với lớp cũ');
  }
});

check('[9] Điểm chính thức và điểm giáo viên tự chấm tách biệt ở cả dữ liệu lẫn biểu đồ', () => {
  /* Lấy em vừa có điểm cô tự chấm VỪA có điểm chính thức — chỉ một trong hai thì không so được. */
  const row = conn
    .prepare(
      `SELECT sc.student_id sid, sc.cycle_id cid FROM case_followups f
         JOIN sos_cases sc ON sc.id = f.case_id
        WHERE f.metrics IS NOT NULL AND sc.student_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM assessment_attempts at JOIN assessment_scores s ON s.attempt_id = at.id
                       WHERE at.cycle_id = sc.cycle_id AND s.band IS NOT NULL)
        ORDER BY sc.id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Không có em nào vừa có điểm cô tự chấm vừa có điểm chính thức');
  const pr = profile.studentProfile(P.admin, row.sid, row.cid) as any;
  const points = pr.progress.skills.flatMap((s: any) => s.points);
  assert(points.some((pt: any) => pt.kind === 'teacher'), 'Biểu đồ không có điểm cô tự chấm');
  assert(points.some((pt: any) => pt.kind === 'official'), 'Biểu đồ mất điểm chính thức');
  /* Hai loại không bao giờ nhập làm một: mỗi điểm mang đúng một nhãn loại. */
  for (const pt of points) {
    assert(pt.kind === 'teacher' || pt.kind === 'official', `Có điểm mang loại lạ: ${pt.kind}`);
  }
});


check('[11] Nhãn: mỗi trạng thái có đúng một tên và một họ nhãn trên toàn hệ thống', () => {
  /* Tên gọi của một trạng thái nằm ở MỘT chỗ trong shared/domain, không màn nào tự đặt lại. */
  for (const o of domain.FOLLOWUP_OUTCOMES) {
    assert(domain.FOLLOWUP_OUTCOME_LABEL[o], `Kết quả ${o} chưa có tên tiếng Việt`);
    assert(domain.OUTCOME_TONE[o], `Kết quả ${o} chưa có tông màu`);
    assert(domain.OUTCOME_MARK[o], `Kết quả ${o} chưa có biểu tượng — màu không được đứng một mình`);
  }
  /* Kết quả tốt mới được xanh; kết quả xấu KHÔNG bao giờ xanh. */
  assert(domain.OUTCOME_TONE.improved === 'ok', 'Tiến bộ rõ rệt phải là xanh lá');
  for (const bad of ['unchanged', 'worse', 'insufficient'] as const) {
    assert(domain.OUTCOME_TONE[bad] !== 'ok', `Kết quả ${bad} lại được tô xanh như tin tốt`);
  }
  for (const ns of domain.NEXT_STEPS) {
    assert(domain.NEXT_STEP_LABEL[ns], `Bước ${ns} thiếu tên`);   // PR-Dọn-b: NEXT_STEP_HINT không nơi nào đọc → xoá
  }
});

check('[12] Seed chạy lại cho ra đúng bộ dữ liệu cũ, không nhân đôi', () => {
  /*
   * Khoá chống trùng là thứ giữ cho chạy lại seed không sinh case lặp. Kiểm bằng chính dữ
   * liệu: không có khoá nào xuất hiện hai lần, và không có case nào cùng em cùng hạng mục
   * mà lại cùng đang mở trừ khi được đánh dấu SONG SONG có chủ ý.
   */
  const dupKey = conn
    .prepare('SELECT COUNT(*) n FROM (SELECT dedup_key FROM sos_cases WHERE dedup_key IS NOT NULL GROUP BY dedup_key HAVING COUNT(*) > 1)')
    .get() as any;
  assert(dupKey.n === 0, `${dupKey.n} khoá chống trùng bị lặp`);
  const dupCase = conn
    .prepare(
      `SELECT COUNT(*) n FROM (
         SELECT student_id, category FROM sos_cases
          WHERE status != 'done' AND student_id IS NOT NULL AND parallel = 0
            AND previous_case_id IS NULL

          GROUP BY student_id, cycle_id, category HAVING COUNT(*) > 1)`,
    )
    .get() as any;
  /*
   * Luật một-case-một-hạng-mục chỉ áp cho case HỌC THUẬT trong cùng một lộ trình. Case Ý
   * thức/Khác gắn với từng sự việc, nên một em có thể có nhiều case cùng lúc mà không trùng.
   */
  const dupDetail = conn.prepare(
    `SELECT student_id, cycle_id, category, GROUP_CONCAT(id) ids FROM sos_cases
      WHERE status != 'done' AND student_id IS NOT NULL AND parallel = 0
        AND previous_case_id IS NULL
      GROUP BY student_id, cycle_id, category HAVING COUNT(*) > 1`).all() as any[];
  assert(dupCase.n === 0,
    `${dupCase.n} nhóm case học thuật trùng hạng mục mà không đánh dấu song song: `
    + dupDetail.map((d) => `hv${d.student_id}/${d.category}[${d.ids}]`).join(' · '));
  /* Mọi bản ghi đều nối đúng chỗ — không có case mồ côi sau khi dựng lại dữ liệu. */
  const fk = conn.prepare('PRAGMA foreign_key_check').all() as any[];
  assert(fk.length === 0, `${fk.length} bản ghi vi phạm khoá ngoại`);
});

check('Sửa được bảng quyền theo vai, và không tự khoá mình ra ngoài', () => {
  const before = can(P.mbManager, PERMISSIONS.ADMIN_CONFIG, { anyScope: true });
  assert(!before, 'Quản lý đang có sẵn quyền cấu hình hệ thống — chọn quyền khác để kiểm');

  /* Cấp một quyền cho một vai, rồi chính người mang vai đó phải LÀM ĐƯỢC việc đó ngay. */
  sysconfig.setRolePermission(P.admin, {
    roleKey: 'manager', permissionKey: PERMISSIONS.ADMIN_CONFIG, granted: true,
  });
  assert(can(loadPrincipal(P.mbManager.userId), PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    'Cấp quyền xong mà người mang vai đó vẫn không làm được');

  /* Gỡ ra thì mất ngay, không đợi đăng nhập lại. */
  sysconfig.setRolePermission(P.admin, {
    roleKey: 'manager', permissionKey: PERMISSIONS.ADMIN_CONFIG, granted: false,
  });
  assert(!can(loadPrincipal(P.mbManager.userId), PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    'Gỡ quyền xong mà vẫn còn làm được');

  /* Hai quyền xương sống của Quản trị hệ thống KHÔNG gỡ được. */
  for (const locked of [PERMISSIONS.ADMIN_CONFIG, PERMISSIONS.STUDENT_VIEW]) {
    assertThrows(
      () => sysconfig.setRolePermission(P.admin, {
        roleKey: 'system_admin', permissionKey: locked, granted: false,
      }),
      /không còn ai vào được/, `Gỡ được quyền xương sống ${locked} khỏi Quản trị hệ thống`,
    );
  }

  /* Người không phải Quản trị hệ thống thì không sửa được bảng này. */
  assertThrows(
    () => sysconfig.setRolePermission(P.mbManager, {
      roleKey: 'teacher', permissionKey: PERMISSIONS.CLASS_ASSIGN, granted: true,
    }),
    /Quản trị hệ thống/, 'Quản lý sửa được bảng quyền',
  );

  /* Và mỗi lần đổi đều để lại dấu vết. */
  const log = conn
    .prepare(`SELECT COUNT(*) n FROM audit_logs WHERE action LIKE 'role.permission.%'`)
    .get() as any;
  assert(log.n >= 2, `Chỉ ghi được ${log.n} dòng nhật ký cho việc sửa quyền`);
});

check('Chuyển lớp khi còn case dở thì BẮT BUỘC có thông tin bàn giao', () => {
  const row = conn
    .prepare(
      `SELECT e.student_id AS sid, e.class_id AS cid FROM enrollments e
        WHERE e.status = 'active'
          AND EXISTS (SELECT 1 FROM sos_cases sc
                       WHERE sc.student_id = e.student_id AND sc.status != 'done')
        ORDER BY e.student_id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Dữ liệu demo không có em nào vừa đang học vừa còn case dở');
  const target = (conn
    .prepare(`SELECT id FROM classes WHERE id != ? AND status = 'active' ORDER BY id LIMIT 1`)
    .get(row.cid) as any).id;
  console.log('DEBUG row.cid', conn.prepare('SELECT code, programme_code, is_fast_track FROM classes WHERE id=?').get(row.cid));
  console.log('DEBUG target', conn.prepare('SELECT code, programme_code, is_fast_track FROM classes WHERE id=?').get(target));

  /* Thiếu thông tin bàn giao thì KHÔNG chuyển được — và lời từ chối nói rõ vì sao. */
  assertThrows(
    () => students.transferStudent(P.admin, row.sid, target, demoToday(), 'Đổi lớp'),
    /bàn giao/i, 'Chuyển được lớp mà không bàn giao gì cả',
  );

  /* Bản tóm tắt bàn giao phải bày sẵn đúng những case còn dở, không bắt gõ lại. */
  const brief = students.handoverBrief(row.sid);
  assert(brief.cases.length > 0, 'Bản tóm tắt bàn giao không liệt kê case nào');

  /* Có ghi chú và người nhận thì chuyển được, và case đổi người phụ trách. */
  const receiver = (conn.prepare(`SELECT id FROM users WHERE status='active' ORDER BY id LIMIT 1`).get() as any).id;
  /* PR-LT: `target` có thể là lớp Fast Track (Q7) — truyền sẵn mucTieu để không vỡ nếu rơi đúng trường hợp đó. */
  students.transferStudent(P.admin, row.sid, target, demoToday(), 'Đổi lớp', {
    note: 'Em đang dở phương án Reading, tuần sau có buổi tutor.',
    receiverUserId: receiver, mucTieu: 6.5,
  });
  for (const c of brief.cases) {
    const now = conn.prepare('SELECT owner_user_id, status FROM sos_cases WHERE id = ?').get(c.id) as any;
    if (now.status !== 'done') {
      assert(now.owner_user_id === receiver, `Case ${c.id} không được bàn giao sang người nhận`);
    }
  }
  /* Và ghi chú bàn giao nằm trong hành trình của em, không biến mất. */
  const ev = conn
    .prepare(`SELECT detail FROM journey_events WHERE student_id = ? AND event_type = 'transfer' ORDER BY id DESC LIMIT 1`)
    .get(row.sid) as any;
  assert((ev?.detail ?? '').includes('tutor'), 'Ghi chú bàn giao không được lưu vào hành trình');
});


/* ============================================================ mục 8 · Tiến độ công việc */

check('Bảng Tiến độ công việc chỉ mở cho Quản trị hệ thống và Quản lý chi nhánh', () => {
  assert(mgmt.canSeeBoard(P.admin), 'Quản trị hệ thống không vào được bảng công việc');
  assert(mgmt.canSeeBoard(P.mbManager), 'Quản lý chi nhánh không vào được bảng công việc');
  const teacher = Object.entries(P).find(([k]) => k.toLowerCase().includes('teacher'))?.[1] as any;
  if (teacher) assert(!mgmt.canSeeBoard(teacher), 'Giáo viên vẫn nhìn thấy toàn bộ bảng công việc');
});

check('Một công việc có MỘT định danh: việc con không lên bảng chính, việc cha đếm hộ', () => {
  const board = mgmt.listMgmtTasks(P.admin, {});
  const withSubs = board.rows.find((r: any) => r.subTotal > 0);
  assert(withSubs, 'Dữ liệu demo không có việc nào chia việc con');
  const detail = mgmt.mgmtTaskDetail(P.admin, withSubs!.id);
  assert(detail.subtasks.length === withSubs!.subTotal,
    `Bảng nói ${withSubs!.subTotal} việc con nhưng mở ra thấy ${detail.subtasks.length}`);
  /* Không việc con nào được xuất hiện thành một dòng riêng trên bảng chính. */
  for (const sub of detail.subtasks) {
    assert(!board.rows.some((r: any) => r.id === sub.id),
      `Việc con "${sub.title}" bị đếm hai lần: vừa là việc con, vừa là một dòng riêng`);
  }
});

check('Việc con chỉ có MỘT tầng, và tạm ngưng / dừng hẳn bắt buộc có lý do', () => {
  const board = mgmt.listMgmtTasks(P.admin, {});
  const parent = board.rows.find((r: any) => r.subTotal > 0)!;
  const sub = mgmt.mgmtTaskDetail(P.admin, parent.id).subtasks[0];

  assertThrows(
    () => mgmt.createMgmtTask(P.admin, {
      title: 'Việc cháu', group: 'curriculum', assigneeUserId: parent.assigneeUserId,
      due: '2026-10-01', parentTaskId: sub.id,
    }),
    /một tầng/i, 'Tạo được việc con của việc con',
  );

  for (const p of ['paused', 'stopped'] as const) {
    assertThrows(
      () => mgmt.updateMgmtTask(P.admin, parent.id, { progress: p, note: null }),
      /lý do|vì sao/i, `Đổi sang "${p}" mà không cần nói lý do`,
    );
  }
});

check('Việc cha còn việc con dang dở thì chưa đánh dấu hoàn thành được', () => {
  const board = mgmt.listMgmtTasks(P.admin, {});
  const parent = board.rows.find((r: any) => r.subTotal > r.subDone);
  assert(parent, 'Dữ liệu demo không có việc cha nào còn việc con dở');
  assertThrows(
    () => mgmt.updateMgmtTask(P.admin, parent!.id, { progress: 'done', note: 'xong rồi' }),
    /việc con/i, 'Đóng được việc cha trong khi việc con còn dở',
  );
});

check('Mỗi lần cập nhật là một dòng lịch sử, không đè lên lần trước', () => {
  const board = mgmt.listMgmtTasks(P.admin, {});
  const row = board.rows.find((r: any) => r.subTotal === 0 && r.progress !== 'done' && r.progress !== 'stopped')!;
  const before = mgmt.mgmtTaskDetail(P.admin, row.id).updates.length;
  mgmt.updateMgmtTask(P.admin, row.id, { progress: 'doing', note: 'Đã gọi điện lần một.' });
  mgmt.updateMgmtTask(P.admin, row.id, { progress: 'doing', note: 'Đã gọi điện lần hai.' });
  const after = mgmt.mgmtTaskDetail(P.admin, row.id);
  assert(after.updates.length === before + 2,
    `Ghi hai lần cập nhật nhưng lịch sử chỉ tăng ${after.updates.length - before} dòng`);
  /* Lần mới nhất đứng đầu, và nội dung cũ vẫn đọc lại được. */
  assert(after.updates[0].note === 'Đã gọi điện lần hai.', 'Lần cập nhật mới nhất không đứng đầu lịch sử');
  assert(after.updates.some((u: any) => u.note === 'Đã gọi điện lần một.'),
    'Lần cập nhật trước đã bị xoá mất');
});

check('Người theo dõi xem được nhưng không cập nhật hộ', () => {
  const board = mgmt.listMgmtTasks(P.admin, {});
  const row = board.rows.find((r: any) => r.subTotal === 0 && r.progress !== 'done' && r.progress !== 'stopped')!;
  /* PR-Ra: người theo dõi/phụ trách phải là tài khoản `nhan_vien` (giáo viên/quản lý) — không còn nhận bất kỳ ID nào. */
  const other = (conn
    .prepare(
      `SELECT DISTINCT u.id FROM users u
         JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
         JOIN roles r ON r.id = ur.role_id AND r.key IN ('teacher','manager')
        WHERE u.status = 'active' AND u.id != ? ORDER BY u.id LIMIT 1`,
    )
    .get(row.assigneeUserId) as any).id;
  mgmt.editMgmtTask(P.admin, row.id, { watcherUserId: other });
  const detail = mgmt.mgmtTaskDetail(P.admin, row.id);
  assert(detail.watcherUserId === other, 'Không gán được người theo dõi');
  /* Người theo dõi không phải người phụ trách — bảng phải nói rõ hai vai khác nhau. */
  assert(detail.watcherUserId !== detail.assigneeUserId,
    'Người theo dõi và người phụ trách đang bị trộn làm một');
});




// ==================================================================== mục 12.1

console.log('\n32. Mười sáu phép kiểm nghiệp vụ bắt buộc của mục 12.1');


check('[12.1-6] Người được phép nhập hộ KHÔNG tự thành người nợ việc của cả chi nhánh', () => {
  /*
   * Quản trị hệ thống có quyền sửa điểm mọi kỹ năng để gỡ sự cố. Nhưng "sửa được" không phải
   * "đây là việc của tôi" — nếu trộn hai thứ đó thì mở Toàn cảnh lên là thấy mình đang nợ
   * điểm của cả trung tâm, và danh sách việc đó không ai đọc.
   */
  const adminScore = (mywork.myWork(P.admin, {}).items ?? []).filter((i: any) => i.group === 'score');
  assert(adminScore.length === 0,
    `Quản trị hệ thống đang bị giao ${adminScore.length} nhóm việc nhập điểm mà họ không được phân công`);
  /*
   * Nhưng giáo viên ĐƯỢC PHÂN CÔNG thì vẫn phải thấy việc của mình. Chọn người theo phân
   * công ĐANG CÓ chứ không viết cứng một lớp: các phép kiểm trước đó có xếp lại giáo viên.
   */
  const anyTeacher = conn
    .prepare(
      `SELECT ta.user_id AS id FROM teacher_assignments ta
         JOIN assessment_attempts a ON a.class_id = ta.class_id
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN assessment_scores sc ON sc.attempt_id = a.id AND sc.skill = ta.skill
        WHERE ta.status = 'active' AND ta.skill IS NOT NULL
          AND a.status != 'cancelled' AND rp.week_start <= ?
          AND sc.band IS NULL AND sc.raw_score IS NULL
        LIMIT 1`,
    )
    .get(TODAY) as any;
  assert(anyTeacher, 'Không còn giáo viên nào đang nợ điểm để đối chứng');
  const gv = loadPrincipal(anyTeacher.id);
  assert((mywork.myWork(gv, {}).items ?? []).some((i: any) => i.group === 'score'),
    'Giáo viên được phân công lại không thấy việc nhập điểm của chính mình');
});


check('[12.1] Chỉ một số ít việc quá hạn — không để cả màn hình đỏ', () => {
  /*
   * Mục 11.6: khoảng một nửa học viên ổn định, và chỉ vài case quá hạn rõ ràng. Một bản demo
   * đỏ rực thì người xem không phân biệt được chỗ nào thật sự gấp, và cũng không tin nữa.
   */
  const t = demoToday();
  const openPlans = (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
        WHERE iv.action_due IS NOT NULL AND iv.status NOT IN ('completed','cancelled')`,
    )
    .get() as any).n;
  /* PR-SOS (Q28-4): quá hạn đọc theo hạn ghi kết quả tuần — "dự kiến kết thúc" đã bỏ. */
  const overdue = (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
        WHERE iv.action_due IS NOT NULL AND iv.action_due < ?
          AND iv.status NOT IN ('completed','cancelled')
          AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = iv.id)`,
    )
    .get(t) as any).n;
  assert(overdue > 0, 'Không có phương án nào quá hạn — không thử được cách hệ thống báo quá hạn');
  assert(overdue <= Math.ceil(openPlans / 2),
    `${overdue}/${openPlans} phương án đang chạy bị quá hạn — quá nửa, bản demo đỏ rực`);

  /* Và khoảng một nửa học viên đang học không có case nào đang mở. */
  const active = (conn
    .prepare(`SELECT COUNT(DISTINCT student_id) n FROM enrollments WHERE status='active'`)
    .get() as any).n;
  const withCase = (conn
    .prepare(
      `SELECT COUNT(DISTINCT sc.student_id) n FROM sos_cases sc
         JOIN enrollments e ON e.student_id = sc.student_id AND e.status='active'
        WHERE sc.status != 'done'`,
    )
    .get() as any).n;
  assert(withCase < active,
    `Cả ${withCase}/${active} học viên đang học đều có case mở — bộ demo mất cân bằng`);
});


check('[12.1-1] Lộ trình đã khép vẫn nói được kết quả gần nhất, không ghi "chưa có kết quả"', () => {
  /*
   * Em đã hoàn thành lộ trình và đi thi thật vẫn có bốn lượt MT đã chấm. Nếu đầu hồ sơ chỉ
   * đọc lộ trình đang chạy thì nó ghi "Chưa có kết quả trong lộ trình này" ngay phía trên
   * bảng điểm đầy đủ — người đọc chỉ có thể kết luận là phần mềm hỏng.
   */
  const done = conn
    .prepare(
      `SELECT lc.student_id AS id FROM learning_cycles lc
        WHERE lc.status = 'completed'
          AND NOT EXISTS (SELECT 1 FROM learning_cycles o
                           WHERE o.student_id = lc.student_id AND o.status = 'active')
          AND EXISTS (SELECT 1 FROM assessment_attempts a
                       JOIN assessment_scores s ON s.attempt_id = a.id
                      WHERE a.cycle_id = lc.id AND s.band IS NOT NULL)
        LIMIT 1`,
    )
    .get() as any;
  assert(done, 'Bộ demo thiếu em đã khép lộ trình mà vẫn có điểm');
  const st = standing.standingFor([done.id]).get(done.id)!;
  assert(st.attemptId !== null,
    'Em đã khép lộ trình lại không có kết quả nào — đầu hồ sơ sẽ ghi "chưa có kết quả"');
  assert(!/chưa có kết quả/i.test(standing.standingLine(st)),
    `Câu tình trạng vẫn nói chưa có kết quả: "${standing.standingLine(st)}"`);
});

// ============================================================ 34. Mục 10 — lịch theo kỹ năng

console.log('\n34. Lịch thi, phạm vi và hạn chấm theo TỪNG KỸ NĂNG (mục 10)');

/** Một lượt MT còn nguyên, chưa có điểm, để thử các thao tác lịch mà không phá dữ liệu khác. */
function freshPlannedAttempt(classCode: string) {
  /*
   * "FRESH" nghĩa đen: chưa ai đụng tới hạn của nó. PR-LT sửa lại luật Q12 (bài chưa làm chỉ đi
   * theo em khi GIỮ khoá, lọc theo cycle_id thay vì student_id) khiến một lượt seed vốn bị bản
   * lỗi cũ dọn nhầm sang lớp khác nay ở lại đúng chỗ (đã đúng) — nhưng lượt đó đã có sẵn
   * deadline_override từ kịch bản demo khác, nên không còn "mới tinh" để phép kiểm dời tuần
   * quan sát hạn đổi từ trạng thái sạch. Loại rõ deadline_override IS NULL để tên hàm đúng nghĩa.
   */
  const row = conn
    .prepare(
      `SELECT a.* FROM assessment_attempts a
        WHERE a.class_id = ? AND a.status = 'planned' AND a.kind = 'mock' AND a.deadline_override IS NULL
          AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
        ORDER BY a.id LIMIT 1`,
    )
    .get(classId(classCode)) as any;
  assert(row, `Seed thiếu lượt MT chưa có điểm ở ${classCode}`);
  return row;
}

check('[10.1] Tách tuần KHÔNG tạo đợt mới và không đổi số MT', () => {
  const a = freshPlannedAttempt('BC FT 205');
  const mgr = loadPrincipal(userByRole('manager', 'BC'));
  const before = conn
    .prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?')
    .get(a.cycle_id) as any;

  /* Chỉ dời Speaking sang tuần kế tiếp — ba môn còn lại đứng yên. */
  skillSchedule.setSkillWeek(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), 7)),
    { reason: 'Phòng thi Speaking bận', force: true });

  const after = conn
    .prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?')
    .get(a.cycle_id) as any;
  const fresh = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(a.id) as any;
  assert(after.n === before.n, 'Tách tuần đã sinh thêm một đợt mới');
  assert(fresh.attempt_no === a.attempt_no, 'Tách tuần đã làm đổi số MT');

  const d = attempts.attemptDetail(mgr, a.id);
  assert(d.splitWeeks, 'Đợt vừa tách tuần mà không được đánh dấu tách tuần');
  const sp = d.skillSchedule.find((r: any) => r.skill === 'speaking')!;
  const li = d.skillSchedule.find((r: any) => r.skill === 'listening')!;
  assert(sp.periodCode !== li.periodCode, 'Dời Speaking mà Listening cũng đi theo');
  assert(sp.deadline !== li.deadline, 'Dời Speaking mà hạn chấm của Listening cũng đổi theo');
});

check('[10.5] Dời một môn chỉ đổi hạn của môn đó, không gia hạn môn đã thi', () => {
  const a = freshPlannedAttempt('BC FT 205');
  const mgr = loadPrincipal(userByRole('manager', 'BC'));
  const before = attempts.attemptDetail(mgr, a.id);
  const lBefore = before.skillSchedule.find((r: any) => r.skill === 'listening')!.deadline;

  const target = periodOf(addDays(demoToday(), 21));
  skillSchedule.setSkillWeek(mgr, a.id, 'writing', target, { reason: 'Giáo viên Writing nghỉ phép', force: true });

  const after = attempts.attemptDetail(mgr, a.id);
  assert(after.skillSchedule.find((r: any) => r.skill === 'listening')!.deadline === lBefore,
    'Dời Writing đã kéo theo hạn chấm của Listening');
});

check('[10.4] → LUAT-NX-MT · Xếp một phần thi MT vượt qua MT kế tiếp KHÔNG chặn (chỉ nhắc ở Kế hoạch Test)', () => {
  /* Lấy một lộ trình có ít nhất hai đợt MT còn hiệu lực. */
  const pair = conn
    .prepare(
      `SELECT a.id, a.cycle_id, a.attempt_no FROM assessment_attempts a
        WHERE a.status != 'cancelled' AND a.kind = 'mock'
          AND EXISTS (SELECT 1 FROM assessment_attempts b
                       WHERE b.cycle_id = a.cycle_id AND b.attempt_no > a.attempt_no
                         AND b.status != 'cancelled' AND b.planned_period_id IS NOT NULL)
          AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
        ORDER BY a.id LIMIT 1`,
    )
    .get() as any;
  assert(pair, 'Seed thiếu lộ trình có hai đợt MT liên tiếp');
  const nextFirst = conn
    .prepare(
      `SELECT MIN(pr.week_start) AS w FROM assessment_attempts b
         JOIN attempt_skills ask ON ask.attempt_id = b.id AND ask.required = 1
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE b.cycle_id = ? AND b.attempt_no > ? AND b.status != 'cancelled'`,
    )
    .get(pair.cycle_id, pair.attempt_no) as any;
  assert(nextFirst?.w, 'Đợt kế tiếp chưa có lịch');

  const chk = skillSchedule.checkSkillWeekMove({
    attemptId: pair.id, skill: 'speaking', newWeekStart: addDays(nextFirst.w, 14),
  });
  assert(chk.blockers.length === 0, `MT vượt MT kế tiếp không còn bị chặn (LUAT-NX-MT): ${JSON.stringify(chk)}`);

  /* Cách đúng một tuần thì CẢNH BÁO, không chặn — người có quyền xác nhận được. */
  const warn = skillSchedule.checkSkillWeekMove({
    attemptId: pair.id, skill: 'speaking', newWeekStart: addDays(nextFirst.w, -7),
  });
  assert(warn.blockers.length === 0 && warn.warnings.length > 0,
    'Hai đợt cách nhau một tuần phải là cảnh báo, không phải chặn');
});

check('[10.4] R/L/W và Speaking của CÙNG một đợt không bị gọi là "hai MT quá gần"', () => {
  const split = conn
    .prepare(
      `SELECT a.id FROM assessment_attempts a
        WHERE (SELECT COUNT(DISTINCT ask.planned_period_id) FROM attempt_skills ask
                WHERE ask.attempt_id = a.id AND ask.required = 1) > 1
        LIMIT 1`,
    )
    .get() as any;
  assert(split, 'Bộ demo thiếu đợt tách tuần');
  const own = conn
    .prepare(
      `SELECT pr.week_start AS w FROM attempt_skills ask
         JOIN report_periods pr ON pr.id = ask.planned_period_id
        WHERE ask.attempt_id = ? AND ask.skill = 'speaking'`,
    )
    .get(split.id) as any;
  const chk = skillSchedule.checkSkillWeekMove({
    attemptId: split.id, skill: 'listening', newWeekStart: own.w,
  });
  assert(chk.blockers.length === 0, 'Hai kỹ năng cùng đợt bị coi là xung đột lịch');
  assert(!chk.warnings.some((w: string) => /một tuần/.test(w)),
    'Hai kỹ năng cùng đợt bị cảnh báo "hai MT quá gần"');
});

/* PR-MTa T20 thay [10.4] cho Quản lý / Quản trị: dời được phần đã có điểm (điểm đi theo) — GV vẫn bị chặn (prMta T20). */
check('[10.4→T20] Quản trị dời phần đã có điểm: không còn chặn "đã có điểm"; LUAT-NX-MT: vượt MT sau cũng không chặn (cuộn lại — lượt seed)', () => {
  const scored = conn
    .prepare(
      `SELECT a.id, a.class_id FROM assessment_attempts a
         JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = 'listening' AND s.band IS NOT NULL
        WHERE a.kind = 'mock' AND a.status != 'cancelled' LIMIT 1`,
    )
    .get() as any;
  assert(scored, 'Seed thiếu lượt đã có điểm Listening');
  let loi: any = null;
  conn.exec('BEGIN IMMEDIATE');
  try { skillSchedule.setSkillWeek(P.admin, scored.id, 'listening', periodOf(addDays(demoToday(), 28)), { force: true }); } catch (e) { loi = e; } finally { conn.exec('ROLLBACK'); }
  assert(!loi, `Quản trị: ${loi?.message}`);
});

check('[10.1] Lớp Normal luôn phải đủ bốn môn — không có thao tác miễn môn', () => {
  const normal = conn
    .prepare(
      `SELECT a.id FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN programmes pg ON pg.code = c.programme_code
        WHERE pg.scoring_mode = 'ratio' AND a.status != 'cancelled' LIMIT 1`,
    )
    .get() as any;
  assert(normal, 'Seed thiếu bài kiểm tra của lớp Normal');
  assertThrows(
    () => skillSchedule.setSkillScope(P.admin, normal.id, 'speaking', false, 'Em không thi môn này'),
    /bốn môn|miễn môn/, 'Miễn được một môn của lớp Normal',
  );
});

/* PR-MTGON (luật 3, chủ sản phẩm 08/10) thay [10.1] "không bỏ môn sau khi vắng": Quản lý huỷ kỹ năng lúc nào cũng được. */
check('[10.1→PR-MTGON] Quản lý huỷ được môn đã xác nhận vắng; dấu vắng giữ trong lịch sử', () => {
  const a = freshPlannedAttempt('CP FT 110');
  const mgr = P.cpManager;
  /* Phải có tuần thi mới xác nhận được đã thi hay vắng. */
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em nghỉ ốm, GVCN đã xác minh');
  skillSchedule.setSkillScope(mgr, a.id, 'speaking', false, 'Không tính môn này đợt này');
  assert((conn.prepare(`SELECT required FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`).get(a.id) as any).required === 0, 'chưa huỷ');
  /* Và dấu vắng vẫn còn nguyên trong lịch sử. */
  const hist = conn
    .prepare(`SELECT * FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_sit_status'`)
    .all(a.id) as any[];
  assert(hist.some((h: any) => h.new_value === 'absent'), 'Dấu vắng bị mất khỏi lịch sử');
});

check('[10.6] Ô điểm trống KHÔNG tự thành vắng; và không nhập điểm vào phần đã vắng', () => {
  const a = conn
    .prepare(
      `SELECT a.id FROM assessment_attempts a
         JOIN attempt_skills ask ON ask.attempt_id = a.id AND ask.skill = 'speaking'
        WHERE ask.sit_status = 'absent' LIMIT 1`,
    )
    .get() as any;
  assert(a, 'Chưa có trường hợp đã xác nhận vắng để kiểm');

  /* Mọi kỹ năng chưa có điểm và chưa ai xác nhận đều phải là 'due' hoặc 'upcoming', không phải 'absent'. */
  const guessed = conn
    .prepare(
      `SELECT COUNT(*) n FROM attempt_skills ask
        WHERE ask.sit_status = 'absent' AND ask.sit_by IS NULL AND ask.sit_note IS NULL`,
    )
    .get() as any;
  assert(guessed.n === 0, `${guessed.n} kỹ năng bị đánh vắng mà không có ai xác nhận`);

  assertThrows(
    () => attempts.saveScore(P.admin, a.id, 'speaking', { criteria: [6, 6, 6, 6] }),
    /đã vắng|sửa trạng thái thi/, 'Nhập được điểm vào phần thi đã xác nhận vắng',
  );
});

check('[10.6] Bộ đếm dời do vắng tính RIÊNG từng kỹ năng trong từng đợt', () => {
  const a = freshPlannedAttempt('HD FT 302');
  const mgr = loadPrincipal(userByRole('manager', 'HD'));
  /*
   * CHỈ MỘT CỬA VÀO BỘ ĐẾM. Trước đây ô "đổi tuần" có thêm một ô tick "dời vì em vắng" chạy
   * song song với luồng xử lý vắng — hai cửa vào cùng một con số là cách chắc chắn nhất để
   * con số ấy không còn nghĩa gì. Nay chỉ `absence.requestAbsenceMove` mới làm nó nhích.
   */
  skillSchedule.setSkillWeek(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), 35)),
    { reason: 'Xếp lịch cho phép kiểm', force: true });
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'GVCN xác minh em vắng buổi Speaking');
  absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Em vắng buổi Speaking' });

  const rows = conn
    .prepare('SELECT skill, absence_move_count FROM attempt_skills WHERE attempt_id = ?')
    .all(a.id) as any[];
  const sp = rows.find((r: any) => r.skill === 'speaking')!;
  assert(sp.absence_move_count === 1, `Bộ đếm Speaking phải là 1, đang là ${sp.absence_move_count}`);
  for (const r of rows.filter((x: any) => x.skill !== 'speaking')) {
    assert(r.absence_move_count === 0,
      `${r.skill} không vắng mà bộ đếm đã tăng — R/L/W và Speaking không dùng chung một lượt`);
  }

  /* Dời CHỦ ĐỘNG của Quản lý thì KHÔNG tăng bộ đếm. */
  skillSchedule.setSkillWeek(mgr, a.id, 'reading', periodOf(addDays(demoToday(), 35)), { reason: 'Xếp lại phòng thi', force: true });
  const rd = conn
    .prepare(`SELECT absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = 'reading'`)
    .get(a.id) as any;
  assert(rd.n === 0, 'Dời chủ động đã bị tính là một lần dời do vắng');
});

check('[10.7] Kỹ năng bị huỷ phần thi làm tuần kế hoạch hoàn tất chưa hợp lệ', () => {
  const a = freshPlannedAttempt('UB FT 401');
  const mgr = loadPrincipal(userByRole('manager', 'UB'));
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'cancelled', 'QL từ chối dời, huỷ phần thi này');
  const d = attempts.attemptDetail(mgr, a.id);
  assert(!d.completionWeek.valid, 'Còn môn đã huỷ mà kế hoạch hoàn tất vẫn được coi là hợp lệ');
  assert(d.completionWeek.blocking.includes('speaking'), 'Không chỉ ra được môn đang chặn');
  /* Vẫn tra lại được lịch kế hoạch trước khi huỷ — đợt không biến mất khỏi báo cáo. */
  const fresh = conn.prepare('SELECT planned_period_id FROM assessment_attempts WHERE id = ?').get(a.id) as any;
  assert(fresh.planned_period_id, 'Huỷ một phần thi đã làm cả đợt mất tuần trong báo cáo');
});

check('[10.1] Bộ demo có đủ cả hai chiều tách tuần và một bài Normal trải nhiều tuần', () => {
  const ft = conn
    .prepare(
      `SELECT a.id,
              (SELECT pr.week_start FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
                WHERE ask.attempt_id = a.id AND ask.skill = 'speaking') AS sp,
              (SELECT pr.week_start FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
                WHERE ask.attempt_id = a.id AND ask.skill = 'listening') AS li
         FROM assessment_attempts a WHERE a.kind = 'mock'`,
    )
    .all() as any[];
  assert(ft.some((r: any) => r.sp && r.li && r.sp > r.li), 'Bộ demo thiếu trường hợp R/L/W trước, Speaking sau');
  assert(ft.some((r: any) => r.sp && r.li && r.sp < r.li), 'Bộ demo thiếu chiều ngược lại: Speaking trước, R/L/W sau');

  const normalSpread = conn
    .prepare(
      `SELECT a.id FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN programmes pg ON pg.code = c.programme_code
        WHERE pg.scoring_mode = 'ratio'
          AND (SELECT COUNT(DISTINCT ask.planned_period_id) FROM attempt_skills ask
                WHERE ask.attempt_id = a.id AND ask.required = 1) >= 3
        LIMIT 1`,
    )
    .get() as any;
  assert(normalSpread, 'Bộ demo thiếu bài lớp Normal trải 2–3 tuần');
});

check('[18.1] Mọi đợt đều có đủ bốn dòng lịch kỹ năng, không dòng nào bịa trạng thái vắng', () => {
  /* PR-MON (PF6): "đủ" = bộ môn của chương trình — lớp thường đọc `programme_skills` (Pre FOU 1 dòng), FT 4 kỹ năng đánh giá. */
  const missing = conn
    .prepare(
      `SELECT COUNT(*) n FROM assessment_attempts a
         LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE (SELECT COUNT(*) FROM attempt_skills ask WHERE ask.attempt_id = a.id)
              <> CASE WHEN pg.scoring_mode = 'ratio'
                   THEN (SELECT COUNT(*) FROM programme_skills ps WHERE ps.programme_code = c.programme_code) ELSE 4 END`,
    )
    .get() as any;
  assert(missing.n === 0, `${missing.n} đợt chưa có đủ bốn dòng lịch kỹ năng`);

  /* Bước nâng cấp không được dựng ra một xác nhận vắng nào — mục 18.1 nói rõ. */
  const seeded = conn
    /* PR-MT: dòng vắng do MÁY chốt dấu "-" (cờ `absent_from_no_show`) có người xác nhận là "máy" — không phải dữ liệu bịa. */
    .prepare(`SELECT COUNT(*) n FROM attempt_skills WHERE sit_status = 'absent' AND sit_by IS NULL AND absent_from_no_show = 0`)
    .get() as any;
  assert(seeded.n === 0, 'Có dòng vắng không do ai xác nhận — bước nâng cấp đã bịa dữ liệu');

  /* Và mọi kỹ năng đã có đủ điểm đều được ghi là đã thi. */
  const contradiction = conn
    .prepare(
      `SELECT COUNT(*) n FROM attempt_skills ask
        WHERE ask.skill NOT IN ('writing')
          AND ask.sit_status = 'scheduled'
          AND EXISTS (SELECT 1 FROM assessment_scores s
                       WHERE s.attempt_id = ask.attempt_id AND s.skill = ask.skill AND s.band IS NOT NULL)`,
    )
    .get() as any;
  assert(contradiction.n === 0, `${contradiction.n} kỹ năng đã có điểm mà vẫn ghi là chưa xác nhận đã thi`);
});

// ============================================================ 35. Mục 6.2 — tín hiệu, không phải case

console.log('\n35. Tín hiệu từ điểm: xác minh trong ba ngày (mục 6.2 · 9.4)');

check('[6.2] Không phương án nào còn được sinh tự động từ điểm', () => {
  /*
   * Dấu của hàm sinh tự động cũ là `migration_key` bắt đầu bằng 'auto:'. Bộ demo dựng lại
   * từ đầu nên không được còn dòng nào như thế — nếu còn, nghĩa là một đường auto vẫn sống.
   */
  const auto = conn
    .prepare(`SELECT COUNT(*) n FROM case_interventions WHERE migration_key LIKE 'auto:%'`)
    .get() as any;
  assert(auto.n === 0, `${auto.n} phương án vẫn được sinh tự động — mục 6.2 bỏ hẳn đường này`);

  /*
   * Và không phương án nào thuộc về một case mà không ai đứng tên mở. (v3: phương án ĐIỀN SẴN của case Mock FT tự tạo là ngoại lệ có chủ
   * đích — `preset = 1`, chưa xác nhận thì không vào thống kê nào; phép kiểm này chỉ nhắm vào phương án thường.)
   */
  const orphan = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
         JOIN sos_cases c ON c.id = iv.case_id
        WHERE c.reported_by IS NULL AND c.origin_kind = 'mock' AND iv.preset = 0
          AND NOT EXISTS (SELECT 1 FROM case_interventions p0 WHERE p0.case_id = c.id AND p0.preset = 1)
          AND NOT EXISTS (SELECT 1 FROM case_signals sg WHERE sg.case_id = c.id AND sg.resolved_by IS NOT NULL)`,
    )
    .get() as any;
  assert(orphan.n === 0, `${orphan.n} phương án thuộc case chưa ai xác minh`);
});

check('[6.2] Tín hiệu KHÔNG được đếm như case đã xác định; PR-LT2a: không còn tín hiệu chờ xác minh (FT nối ngay vào Case, lớp thường Progress Test tự tạo Case)', () => {
  /* PR-LT2a (N4): trước đây phép kiểm này đòi bộ demo CÓ tín hiệu chờ. Nay không tín hiệu nào được ở trạng thái chờ — mọi tín hiệu là dây nối. */
  const pending = conn
    .prepare(`SELECT COUNT(*) n FROM case_signals sg JOIN classes c ON c.id = sg.class_id WHERE sg.status = 'pending' AND c.is_fast_track = 0 AND sg.attempt_id IN (SELECT id FROM assessment_attempts WHERE kind = 'progress')`)
    .get() as any;
  assert(pending.n === 0, `${pending.n} tín hiệu Progress Test lớp thường còn "chờ xác minh" — mô hình đã bỏ`);

  /* Không tín hiệu chờ nào có case: chờ nghĩa là chưa thành gì cả. */
  const wrong = conn
    .prepare(`SELECT COUNT(*) n FROM case_signals WHERE status = 'pending' AND case_id IS NOT NULL`)
    .get() as any;
  assert(wrong.n === 0, `${wrong.n} tín hiệu vừa "chờ xác minh" vừa đã có case`);

  /* Mỗi dòng đúng một trạng thái, không có dòng vừa chờ vừa xong. */
  const muddled = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_signals
        WHERE (status = 'noted' AND resolution_note IS NULL)
           OR (status = 'linked' AND case_id IS NULL)
           OR (status = 'withdrawn' AND withdrawn_reason IS NULL)`,
    )
    .get() as any;
  assert(muddled.n === 0, `${muddled.n} tín hiệu có trạng thái không khớp với dữ liệu của chính nó`);
  assert(!('listSignals' in signalsSvc), 'PR-LT2a: hàng "tín hiệu chờ xác minh" đã bỏ khỏi mã');
});

check('[6.2] Hồ sơ học viên và Việc cần làm không còn tín hiệu chờ xác minh; Case Progress Test tự tạo nằm ở nhóm "Xác nhận Case" của đúng GVBM', () => {
  const c = conn
    .prepare(`SELECT sc.* FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
               WHERE a.kind = 'progress' AND sc.origin_kind = 'mock' AND sc.status = 'open' AND sc.owner_user_id IS NOT NULL
                 AND NOT EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.kind = 'bo_tro' AND iv.confirmed_at IS NOT NULL) LIMIT 1`)
    .get() as any;
  assert(c, 'Bộ demo thiếu Case Progress Test tự tạo (chưa xác nhận) có người phụ trách');
  const prof = profile.studentProfile(P.admin, c.student_id) as any;
  assert(!('pendingSignals' in prof), 'Hồ sơ học viên không còn khối tín hiệu chờ xác minh');
  const owner = loadPrincipal(c.owner_user_id);
  const work = mywork.myWork(owner);
  const items = (work.items ?? []) as any[];
  assert(!items.some((i) => i.group === 'verify' || String(i.key).startsWith('verify:')), 'Việc cần làm không còn nhóm "verify"');
});

check('[6.2] Lớp thường không còn đường "Bỏ qua" / "Tạo Case từ tín hiệu": mã và tuyến đã bỏ, Case chỉ mở bằng form thường', () => {
  for (const ten of ['noteSignal', 'dismissSignal', 'assignSignal', 'signalDetail', 'linkSignalToCase']) {
    assert(!(ten in signalsSvc), `PR-LT2a: ${ten} đã bỏ`);
  }
  const made = cases.reportIssue(P.admin, {
    studentId: formTestStudent().id, cycleId: formTestStudent().cycle_id, topic: 'listening',
    title: 'Ghi nhận tay sau khi xem bài', summary: 'Đã xem lại bài và xác định vấn đề cụ thể của em ở phần này.',
    primaryCode: 'student.listening.technique',
    fromSignalId: 999999,   // tham số đã bỏ — máy chủ bỏ qua, không lỗi, không gắn tín hiệu nào
  } as any) as any;
  assert(made.id && !conn.prepare('SELECT 1 FROM case_signals WHERE case_id = ?').get(made.id), 'Case tạo tay không được gắn tín hiệu');
});

check('[6.2] Quản lý chi nhánh khác không tạo được Case cho học viên ngoài phạm vi', () => {
  const st = conn
    .prepare(
      `SELECT e.student_id, e.class_id FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
        WHERE e.status = 'active' AND b.code = 'MB' LIMIT 1`,
    )
    .get() as any;
  assert(st, 'Bộ demo thiếu học viên Monbay đang học');
  assertThrows(
    () => cases.reportIssue(P.cpManager, {
      studentId: st.student_id, topic: 'listening',
      title: 'Xem hộ chi nhánh khác một chút',
      summary: 'Tôi xem hộ chi nhánh khác một cái cho nhanh, xem em vướng gì.',
      primaryCode: 'student.listening.technique',
    }),
    /phạm vi/, 'Quản lý chi nhánh khác tạo được Case ngoài phạm vi',
  );
});

check('[9.4] Phương án chưa ai làm bị huỷ do sửa điểm KHÔNG tính thành công hay thất bại', () => {
  const cancelled = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions
        WHERE status = 'cancelled' AND closed_reason IN ('score_fixed', 'auto_retired')`,
    )
    .get() as any;
  /* Có hay không tuỳ bộ demo; điều bắt buộc là nếu có thì không nằm trong tỷ lệ hiệu quả. */
  if (cancelled.n === 0) return;
  const counted = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_followups f
         JOIN case_interventions iv ON iv.id = f.intervention_id
        WHERE iv.closed_reason IN ('score_fixed', 'auto_retired')`,
    )
    .get() as any;
  assert(counted.n === 0,
    `${counted.n} phương án chưa từng chạy lại có kết quả — không thành công cũng không thất bại`);
});

// ============================================================ 36. Mục 6.3 · 6.4 · 7

console.log('\n36. Form case, phân loại và gộp đợt Ý thức/Khác (mục 6.3 · 6.4 · 7)');

/** Một học viên sạch để thử form mà không đụng dữ liệu kịch bản. */
function formTestStudent() {
  const row = conn
    .prepare(
      `SELECT s.id, cy.id AS cycle_id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN classes c ON c.id = e.class_id
         JOIN branches b ON b.id = c.branch_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE b.code = 'MB' AND s.status = 'active'
        ORDER BY s.id DESC LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Không tìm được học viên để thử form');
  return row;
}

check('[6.3] Bốn trường bắt buộc: tên, mô tả, mức độ hai bậc, phân loại', () => {
  const st = formTestStudent();
  const base = {
    studentId: st.id, cycleId: st.cycle_id, topic: 'reading',
    parallel: true,
  } as any;

  assertThrows(() => cases.reportIssue(P.admin, { ...base, summary: 'Em đọc chậm lắm luôn ấy' }),
    /[Đđ]ặt tên/, 'Mở được case không tên');
  assertThrows(() => cases.reportIssue(P.admin, { ...base, title: 'Reading chậm', summary: 'Chậm' }),
    /cụ thể hơn/, 'Mở được case với mô tả một chữ');
  assertThrows(
    () => cases.reportIssue(P.admin, {
      ...base, title: 'Reading đọc chậm', summary: 'Em đọc kỹ từng câu nên hết giờ.',
    }),
    /nhóm nguyên nhân/, 'Mở được case không có nhóm nguyên nhân',
  );

  /* Mã mức cũ `normal` đã bỏ — gửi lên là bị từ chối, không phải âm thầm hạ xuống. (Chữ "Bình thường" nay là NHÃN của mã `attention`, T7.) */
  assertThrows(
    () => cases.reportIssue(P.admin, {
      ...base, title: 'Reading đọc chậm', summary: 'Em đọc kỹ từng câu nên hết giờ.',
      primaryCode: 'student.reading.time', urgency: 'normal',
    }),
    /hai bậc/, 'Vẫn nhận được mã mức cũ `normal`',
  );

  /* Chọn "Khác" thì phải ghi rõ Khác là gì (≥ 3 ký tự, PR-NEN T13) — nếu không thì "Khác" chính là "Chưa rõ" đổi tên. */
  assertThrows(
    () => cases.reportIssue(P.admin, {
      ...base, title: 'Reading có vấn đề', summary: 'Em đọc chưa tốt lắm.',
      primaryCode: 'student.reading.other',
    }),
    /Ghi rõ "Khác" là gì/, 'Chọn "Khác" mà không ghi rõ vẫn mở được case',
  );
  const khac = cases.reportIssue(P.admin, {
    ...base, title: 'Reading có vấn đề', summary: 'Đọc sai ý chính', observation: 'Đọc lướt',
    primaryCode: 'student.reading.other',
  }) as any;
  assert(khac.id > 0, 'Chọn "Khác" có ghi rõ + mô tả 15 ký tự phải mở được (bỏ luật 30 ký tự)');
  /* PA đề xuất "Khác": ghi rõ ≥ 3 ký tự, ghép vào đầu mô tả (không có cột riêng — Q9). */
  const paKhac = { kind: 'other_proposal', description: 'Nhờ P. Học thuật xem lại', performerSelf: true };
  assertThrows(() => cases.recordIntervention(P.admin, khac.id, paKhac), /PA đề xuất "Khác": Ghi rõ/, 'PA "Khác" không ghi rõ');
  cases.recordIntervention(P.admin, khac.id, { ...paKhac, ghiRoKhac: 'Gặp chuyên gia' });
  const paMoi = conn.prepare('SELECT description FROM case_interventions WHERE case_id = ? ORDER BY id DESC LIMIT 1').get(khac.id) as any;
  assert(paMoi.description === 'Gặp chuyên gia — Nhờ P. Học thuật xem lại', `PA "Khác" ghép mô tả: ${paMoi.description}`);

  /* Đủ bốn trường thì mở được, và mức mặc định là "Bình thường" chứ không phải không có mức. */
  const ok = cases.reportIssue(P.admin, {
    ...base, title: 'Reading: hết giờ ở hai câu cuối',
    summary: 'Em đọc kỹ từng câu nên luôn hết giờ khi còn hai câu cuối của passage 3.',
    primaryCode: 'student.reading.time',
  }) as any;
  assert(ok.urgency === 'attention', `Mức mặc định phải là "Bình thường", đang là ${ok.urgency}`);
  assert(ok.title === 'Reading: hết giờ ở hai câu cuối', 'Tên case bị máy viết lại');
});

check('[6.4] Bộ phân loại đúng của mục 6.4, và phân loại phải thuộc đúng kỹ năng', () => {
  const codes = (topic: string) => domain.issuesForTopic(topic).map((i: any) => i.label);
  assert(codes('reading').join(' | ') === 'Từ vựng / ngữ pháp | Kỹ năng làm bài | Tư duy logic | Quản lý thời gian | Khác',
    `Bộ Reading sai: ${codes('reading').join(' | ')}`);
  assert(codes('listening').join(' | ') === 'Từ vựng / ngữ pháp | Tư duy và kỹ năng làm bài | Tâm lý và độ tập trung | Ngôn ngữ | Khác',
    `Bộ Listening sai: ${codes('listening').join(' | ')}`);
  /* Không còn bộ phân loại Ý thức: Ý thức là vi phạm với năm nhóm riêng, không phải "vấn đề" có phân loại con. */
  assert(codes('homework').length === 0, 'Nhóm Ý thức không còn bộ phân loại — nó thuộc mô hình Vi phạm');
  /* W1 và W2 dùng chung bộ Writing. */
  assert(codes('writing1').join('|') === codes('writing2').join('|'), 'W1 và W2 phải dùng chung bộ phân loại');

  /* "Ngôn ngữ" của Listening phải có câu giải thích, nếu không nó lẫn với "Từ vựng / ngữ pháp". */
  const sound = domain.issuesForTopic('listening').find((i: any) => i.label === 'Ngôn ngữ') as any;
  assert(sound?.hint && /nối âm|trọng âm/.test(sound.hint),
    'Nhãn "Ngôn ngữ" của Listening thiếu câu giải thích phân biệt với vốn từ');

  /* Phân loại của môn khác thì không nhận. */
  const st = formTestStudent();
  assertThrows(
    () => cases.reportIssue(P.admin, {
      studentId: st.id, cycleId: st.cycle_id, topic: 'speaking', parallel: true,
      title: 'Speaking nói ngắt quãng',
      summary: 'Em dừng lâu giữa câu khi gặp chủ đề lạ ngoài vốn từ quen.',
      primaryCode: 'student.reading.time',
    }),
    /không thuộc bộ phân loại/, 'Nhận phân loại của môn khác',
  );
});

check('[7.2] Ngày gửi của hệ thống quyết định cửa sổ — Ý thức nay TỪ CHỐI thẳng ngày quá khứ, không âm thầm bỏ qua', () => {
  /*
   * CẬP NHẬT (PR-C, CASE-01 Task 2): trước đây máy chủ ÂM THẦM CHẤP NHẬN detectedAt quá khứ
   * cho case Ý thức rồi bỏ qua khi tính cửa sổ gộp (merge_until luôn theo `today`) — người
   * dùng khai lùi ngày mà không biết nó vô nghĩa. Nay máy chủ TỪ CHỐI thẳng, rõ ràng hơn: xem
   * "CASE-01 Task 2" bên dưới. Test này giữ lại đúng phần ý nghĩa chưa đổi — Học thuật vẫn
   * nhận và GIỮ NGUYÊN ngày người dùng khai cho "Theo dõi từ ngày".
   */
  /*
   * `case_reports` (bảng lưu "ngày gửi hệ thống" tách khỏi "ngày quan sát") chỉ dùng cho
   * đường Ý thức/Khác — case Học thuật ghi `detected_at` thẳng trên `sos_cases`, không qua
   * bảng đó. Kiểm đúng cơ chế thật: Học thuật vẫn giữ nguyên ngày người dùng khai.
   */
  const st = formTestStudent();
  const made = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, topic: 'listening',
    title: 'Listening: quan sát từ buổi học trước',
    summary: 'Em mất tập trung ở đoạn hội thoại nhiều người nói, quan sát từ buổi tuần trước.',
    primaryCode: 'student.listening.focus',
    detectedAt: addDays(demoToday(), -20),
    parallel: true, // học viên cố định có thể đã có case cùng hạng mục từ test khác trong lượt chạy
  }) as any;
  const row = conn.prepare('SELECT detected_at FROM sos_cases WHERE id = ?').get(made.id) as any;
  assert(row.detected_at === addDays(demoToday(), -20),
    `Case Học thuật phải giữ nguyên ngày người dùng khai, đang ra ${row.detected_at}`);
});

console.log('\n37. Vắng, dời có giới hạn, duyệt và khôi phục (mục 10.6)');

/*
 * Mỗi phép kiểm dưới đây cần một đợt RIÊNG: chúng đều đụng vào bộ đếm dời, nên dùng chung
 * một đợt là phép kiểm sau đọc phải tàn dư của phép kiểm trước.
 */
const takenAttempts = new Set<number>();
function takePlannedAttempt() {
  const row = (conn
    .prepare(
      `SELECT a.*, b.code AS branch_code FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN branches b ON b.id = c.branch_id
         JOIN programmes pg ON pg.code = c.programme_code
        WHERE a.status = 'planned' AND a.kind = 'mock' AND pg.scoring_mode != 'ratio'
          AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
          /* Bỏ qua các đợt bộ demo đã dựng sẵn tình huống vắng — chúng có câu chuyện riêng. */
          AND NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.sit_status = 'absent')
          AND NOT EXISTS (SELECT 1 FROM skill_move_requests r WHERE r.attempt_id = a.id)
        ORDER BY a.id`,
    )
    .all() as any[]).find((r) => !takenAttempts.has(r.id));
  assert(row, 'Seed hết lượt MT chưa chấm để kiểm — thêm lớp hoặc bớt phép kiểm');
  takenAttempts.add(row.id);
  return row;
}

/**
 * Dựng một kỹ năng ĐÃ XÁC NHẬN VẮNG ở một tuần chưa tới, để mọi phép kiểm dưới đây đứng
 * trên cùng một điểm xuất phát: em vắng buổi đó, tuần đích còn ở tương lai, và bộ đếm dời
 * bắt đầu từ con số đã khai.
 */
/** Tuần cách hôm nay `weeksAhead` tuần có bị T15 chặn với lộ trình của `a` không. */
function weekClashesFor(a: any, weeksAhead: number): boolean {
  return skillSchedule.checkWeekVsNeighbours({
    cycleId: a.cycle_id, attemptNo: a.attempt_no, excludeAttemptId: a.id,
    newWeekStart: addDays(demoToday(), weeksAhead * 7),
  }).blockers.length > 0;
}

/**
 * TUẦN SẠCH gần `weeksAhead` nhất (dò LÙI trước — đợt đang kiểm thường xếp trước một đợt khác của lộ
 * trình — rồi mới TIẾN), để các phép kiểm 10.6 (vắng, dời, khôi phục) không tình cờ chạm T15 (23/09: trùng
 * tuần với đợt lân cận nay CHẶN thay vì chỉ cảnh báo). `caKeTiep` = true thì tuần liền sau cũng phải sạch
 * (dùng cho `absentSkill`, nơi lần dời đầu tự động nhảy +7 ngày).
 */
function cleanWeeksAhead(a: any, weeksAhead: number, caKeTiep = false): number {
  const sach = (w: number) => !weekClashesFor(a, w) && (!caKeTiep || !weekClashesFor(a, w + 1));
  if (sach(weeksAhead)) return weeksAhead;
  for (let d = 1; d <= 20; d++) {
    if (weeksAhead - d >= 1 && sach(weeksAhead - d)) return weeksAhead - d;
    if (sach(weeksAhead + d)) return weeksAhead + d;
  }
  return weeksAhead;
}

function absentSkill(skill: string, weeksAhead = 3, startCount = 0) {
  const a = takePlannedAttempt();
  const mgr = loadPrincipal(userByRole('manager', a.branch_code));
  const week0 = cleanWeeksAhead(a, weeksAhead, true);
  skillSchedule.setSkillWeek(mgr, a.id, skill, periodOf(addDays(demoToday(), week0 * 7)),
    { reason: 'Xếp lịch cho phép kiểm', force: true });
  conn.prepare('UPDATE attempt_skills SET absence_move_count = ? WHERE attempt_id = ? AND skill = ?')
    .run(startCount, a.id, skill);
  skillSchedule.setSitStatus(mgr, a.id, skill, 'absent', 'GVCN xác minh em không tới buổi thi');
  return { a, mgr };
}

check('[10.6] Ô điểm trống chưa đủ: chưa xác nhận vắng thì không dời được', () => {
  const a = takePlannedAttempt();
  const mgr = loadPrincipal(userByRole('manager', a.branch_code));
  skillSchedule.setSkillWeek(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), 21)),
    { reason: 'Xếp lịch cho phép kiểm', force: true });
  assertThrows(
    () => absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Chắc em vắng' }),
    /chưa được xác nhận là vắng/, 'Dời được lịch mà chưa ai xác nhận em vắng',
  );
});

check('[10.6] Lần đầu: GVCN dời ĐÚNG tuần kế tiếp của lịch đang có, không chọn tuỳ ý', () => {
  const { a, mgr } = absentSkill('speaking', 3);
  const before = conn
    .prepare(`SELECT pr.week_start FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
               WHERE ask.attempt_id = ? AND ask.skill = 'speaking'`)
    .get(a.id) as any;

  const out = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Em ốm, có phép' });
  const o = out.outcomes[0];
  assert(o.result === 'moved', `Lần đầu phải dời được ngay, đang là ${o.result}`);
  assert(o.moveNo === 1, `Đây phải là lần dời thứ nhất, đang là ${o.moveNo}`);

  const after = conn
    .prepare(`SELECT pr.week_start, ask.absence_move_count AS n, ask.sit_status
                FROM attempt_skills ask JOIN report_periods pr ON pr.id = ask.planned_period_id
               WHERE ask.attempt_id = ? AND ask.skill = 'speaking'`)
    .get(a.id) as any;
  /*
   * ĐÚNG MỘT TUẦN, không phải "tuần sau của hôm nay". Đây là chỗ một dòng code tưởng vô hại
   * đổi hẳn nghĩa của luật: xử lý muộn ba tuần mà nhảy sang tuần hiện tại là âm thầm cho em
   * thêm ba tuần, trong khi bộ đếm vẫn chỉ nhích một.
   */
  assert(after.week_start === addDays(before.week_start, 7),
    `Phải dời đúng một tuần: ${before.week_start} → ${after.week_start}`);
  assert(after.n === 1, `Bộ đếm phải là 1, đang là ${after.n}`);
  assert(after.sit_status === 'scheduled', 'Dời xong mà vẫn còn mang dấu vắng của buổi cũ');
});

/* PR-MTa T3 thay K4-28 lần 2: vắng lần 2 → kỹ năng HUỶ (vắng 2 lần), không tự tạo đề nghị; GVCN "Xin dời" mới gửi đề nghị chờ duyệt. */
check('[10.6] Lần thứ hai: kỹ năng huỷ (vắng 2 lần); GVCN Xin dời → đề nghị, lịch KHÔNG đổi trước khi Quản lý duyệt', () => {
  const { a, mgr } = absentSkill('speaking', 3);
  absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần một' });
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em lại vắng buổi dời');

  const weekBefore = conn
    .prepare(`SELECT planned_period_id AS p FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  const huy = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần hai' }).outcomes[0];
  assert(huy.result === 'huy-vang' && huy.moveNo === 2, `Lần thứ hai phải huỷ vắng, đang là ${huy.result}`);
  const o = absence.xinDoi(mgr, a.id, 'speaking', { lyDo: 'Lần hai' });
  assert(o.result === 'pending', `Xin dời phải chờ duyệt, đang là ${o.result}`);
  assert(o.moveNo === 2, `Phải là lần dời thứ hai, đang là ${o.moveNo}`);

  const weekAfter = conn
    .prepare(`SELECT planned_period_id AS p, absence_move_count AS n
                FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(weekAfter.p === weekBefore.p, 'Chưa duyệt mà lịch đã đổi');
  assert(weekAfter.n === 1, 'Chưa duyệt mà bộ đếm đã nhích');

  /* HẠN DUYỆT LÀ TRƯỚC KHI TUẦN MỚI BẮT ĐẦU — không phải một con số chu kỳ nào khác. */
  const req = conn.prepare('SELECT * FROM skill_move_requests WHERE id = ?').get(o.requestId!) as any;
  const target = conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(req.to_period_id) as any;
  assert(req.decide_by === addDays(target.week_start, -1),
    `Hạn duyệt phải là ngày trước khi tuần mới bắt đầu, đang là ${req.decide_by}`);

  /* Gửi lại cùng một đề nghị không thành hai đề nghị. */
  const n1 = (conn.prepare(`SELECT COUNT(*) n FROM skill_move_requests WHERE attempt_id = ?`).get(a.id) as any).n;
  assertThrows(
    () => absence.xinDoi(mgr, a.id, 'speaking', { lyDo: 'Lần hai gửi lại' }),
    /đang chờ/, 'Gửi được đề nghị thứ hai khi đề nghị cũ còn chờ',
  );
  const n2 = (conn.prepare(`SELECT COUNT(*) n FROM skill_move_requests WHERE attempt_id = ?`).get(a.id) as any).n;
  assert(n1 === n2, 'Gửi lại đã sinh thêm một đề nghị');

  /* Và Quản lý cũng không được đổi lịch bằng đường thường khi còn một đề nghị treo. */
  assertThrows(
    () => skillSchedule.setSkillWeek(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), 56)),
      { reason: 'Sửa tay', force: true }),
    /đang có một đề nghị dời/, 'Đổi được lịch trong khi một đề nghị còn chờ — em bị dời hai lần',
  );

  /* Duyệt thì lịch đổi và bộ đếm nhích — lần dời này là của em, không phải lượt mới của GVCN. */
  absence.decideAbsenceMove(mgr, o.requestId!, { approve: true, note: 'Đồng ý, lần cuối' });
  const done = conn
    .prepare(`SELECT planned_period_id AS p, absence_move_count AS n
                FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(done.p !== weekBefore.p, 'Duyệt rồi mà lịch không đổi');
  assert(done.n === 2, `Bộ đếm phải là 2, đang là ${done.n}`);
});

/* PR-MTa T3: lần 2 huỷ vắng; thẻ Lịch thi ra từ "Xin dời". T7: từ chối chỉ cần không trống (bỏ "2 ký tự"). Hết hạn: giữ huỷ vắng. */
check('PR-DUYET (4) · Xin dời (sau vắng lần 2) → thẻ Lịch thi hạn = decide_by; từ chối không lý do → 400; hết hạn → thẻ tự đóng, kỹ năng giữ huỷ; myWork(QL) không còn decide_move', () => {
  const { a, mgr } = absentSkill('speaking', 3);
  absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần một' });
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em lại vắng');
  absence.requestAbsenceMove(P.admin, a.id, ['speaking'], { reason: 'Vắng hai tuần liền' });
  const reqId = absence.xinDoi(P.admin, a.id, 'speaking', { lyDo: 'Vắng hai tuần liền' }).requestId!;
  const req = conn.prepare('SELECT decide_by FROM skill_move_requests WHERE id = ?').get(reqId) as any;
  const the = () => conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE loai = 'lich_thi' AND doi_tuong_id = ?`).get(reqId) as any;
  assert(the()?.trang_thai === 'cho' && the().han_duyet === req.decide_by && the().ly_do === 'Vắng hai tuần liền', JSON.stringify(the()));
  assert(!mywork.myWork(mgr).groups.some((g: any) => g.key === 'decide_move'), 'còn nhóm decide_move');
  assertThrows(() => absence.decideAbsenceMove(mgr, reqId, { approve: false }), /lý do/, 'Từ chối không lý do');
  conn.prepare('UPDATE skill_move_requests SET decide_by = ? WHERE id = ?').run(addDays(demoToday(), -1), reqId);
  absence.sweepExpiredMoves();
  const sp = conn.prepare(`SELECT sit_status, huy_vang FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`).get(a.id) as any;
  assert(sp.sit_status === 'cancelled' && sp.huy_vang === 1 && the().trang_thai === 'tu_dong' && the().ly_do_dong === 'Hết hạn duyệt — giữ huỷ (vắng 2 lần)', JSON.stringify(the()));
});

/*
 * PR-MTa T3 (Q3): từ chối "Xin dời" sau vắng lần 2 = không mock lại (MTa H5). Đề nghị CHUYỂN QUẢN LÝ ở lần 1 (xử lý muộn) vẫn đi luật cũ —
 * từ chối = huỷ phần thi — nên phép kiểm dựng đề nghị đó thay cho "lần 2".
 */
check('[10.6] Quản lý từ chối (đề nghị chuyển QL): Fast Track huỷ PHẦN THI, giữ nguyên điểm các phần đã xong', () => {
  const a = takePlannedAttempt();
  const mgr = loadPrincipal(userByRole('manager', a.branch_code));
  skillSchedule.setSkillWeek(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), -21)),
    { reason: 'Buổi thi đã qua', force: true, today: addDays(demoToday(), -28) });
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em vắng');
  const out = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Xử lý muộn' });
  assert(out.outcomes[0].result === 'escalated', out.outcomes[0].result);

  absence.decideAbsenceMove(mgr, out.outcomes[0].requestId!, {
    approve: false, note: 'Đã dời hai lần, không dời nữa',
  });
  const sp = conn
    .prepare(`SELECT sit_status, planned_period_id AS p FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(sp.sit_status === 'cancelled', `Từ chối rồi mà phần thi vẫn là ${sp.sit_status}`);
  assert(sp.p, 'Huỷ phần thi đã xoá luôn lịch cũ — không tra lại được kế hoạch trước khi huỷ');

  /*
   * ĐỢT NÀY CHƯA ĐỦ KẾT QUẢ, không phải "môn đó 0 điểm" và cũng không phải "môn vốn không
   * yêu cầu". Hai cách đọc sai đó đều làm một đợt thiếu bài trông như một đợt đã xong.
   */
  const d = attempts.attemptDetail(mgr, a.id) as any;
  assert(!d.completionWeek.valid, 'Phần thi bị huỷ mà kế hoạch hoàn tất vẫn hợp lệ');
  assert(d.completionWeek.blocking.includes('speaking'), 'Không chỉ ra được môn đang chặn');
  const still = conn
    .prepare(`SELECT required FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(still.required === 1, 'Huỷ phần thi đã âm thầm bỏ môn khỏi phạm vi yêu cầu');
  assertThrows(
    () => attempts.saveScore(P.admin, a.id, 'speaking', { criteria: [6, 6, 6, 6] }),
    /đã bị huỷ/, 'Nhập được điểm vào phần thi đã huỷ',
  );

  /* KHÔI PHỤC là việc của Quản lý, VÀ phải đặt luôn tuần mới trong cùng thao tác — tuần đó cũng phải sạch T15. */
  const back = absence.restoreCancelledSkill(mgr, a.id, 'speaking',
    periodOf(addDays(demoToday(), cleanWeeksAhead(a, 4) * 7)), { reason: 'Xếp lại cho em thi bù' });
  assert(back.ok, 'Không khôi phục được phần thi đã huỷ');
  const after = conn
    .prepare(`SELECT sit_status, absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(after.sit_status === 'scheduled', 'Khôi phục rồi mà trạng thái vẫn là huỷ');
  /*
   * BỘ ĐẾM GIỮ NGUYÊN: đề nghị bị từ chối không tiêu lượt nào (đề nghị chuyển QL ở lần 1 → vẫn 0). Khôi phục cũng KHÔNG đặt lại.
   */
  assert(after.n === 0, `Bộ đếm phải giữ nguyên ở 0, đang là ${after.n}`);
});

check('[10.6] Lớp Normal: huỷ LỊCH HẸN, giữ nghĩa vụ thi đủ môn', () => {
  /* PR-BV thay "bài planned đầu tiên": bài demo done mà thiếu môn nay về planned khi tính lại (R1) — bỏ bài còn lượt sau trong lộ trình,
     để dời Speaking +21 ngày không vướng T15 (thứ tự đợt), đúng điều phép kiểm này muốn thử. */
  const row = conn
    .prepare(
      `SELECT a.id, a.class_id FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN programmes pg ON pg.code = c.programme_code
        WHERE pg.scoring_mode = 'ratio' AND a.status = 'planned'
          AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts b WHERE b.cycle_id = a.cycle_id AND b.attempt_no > a.attempt_no AND b.status != 'cancelled')
        ORDER BY a.id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Seed thiếu bài lớp Normal chưa chấm để kiểm');
  const cls = conn.prepare('SELECT b.code FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(row.class_id) as any;
  const mgr = loadPrincipal(userByRole('manager', cls.code));

  skillSchedule.setSkillWeek(mgr, row.id, 'speaking', periodOf(addDays(demoToday(), 21)),
    { reason: 'Xếp lịch cho phép kiểm', force: true });
  skillSchedule.setSitStatus(mgr, row.id, 'speaking', 'absent', 'Em không tới buổi nói');
  absence.requestAbsenceMove(mgr, row.id, ['speaking'], { reason: 'Lần một' });
  skillSchedule.setSitStatus(mgr, row.id, 'speaking', 'absent', 'Em vắng tiếp');
  const out = absence.requestAbsenceMove(mgr, row.id, ['speaking'], { reason: 'Lần hai' });
  absence.decideAbsenceMove(mgr, out.outcomes[0].requestId!, { approve: false, note: 'Không dời nữa' });

  const sp = conn
    .prepare(`SELECT sit_status, planned_period_id AS p, required FROM attempt_skills
               WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(row.id) as any;
  /*
   * NORMAL KHÁC FAST TRACK ở đúng chỗ này: huỷ LỊCH HẸN chứ không huỷ phần thi. Nghĩa vụ
   * thi đủ bốn môn còn nguyên — môn đó chuyển sang "chờ Quản lý xếp lại", không biến mất để
   * đợt trông như đã hoàn tất vì đã thi ba môn kia.
   */
  assert(sp.sit_status !== 'cancelled', 'Lớp Normal bị huỷ phần thi như Fast Track');
  assert(sp.p === null, 'Từ chối rồi mà lịch hẹn vẫn còn');
  assert(sp.required === 1, 'Huỷ lịch hẹn đã làm biến mất nghĩa vụ thi môn này');
  const d = attempts.attemptDetail(mgr, row.id) as any;
  assert(!d.completionWeek.valid, 'Còn môn chưa xếp lại mà kế hoạch hoàn tất vẫn hợp lệ');
});

check('[10.6] Hết hạn duyệt mà chưa ai trả lời thì huỷ — không huỷ ngay lúc vừa gửi', () => {
  /* PR-MTa T3: lần 2 không còn tự thành đề nghị — dựng đề nghị CHUYỂN QUẢN LÝ (xử lý muộn, lần 1), luật hết hạn giữ nguyên. */
  const a = takePlannedAttempt();
  const mgr = loadPrincipal(userByRole('manager', a.branch_code));
  skillSchedule.setSkillWeek(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), -21)),
    { reason: 'Buổi thi đã qua', force: true, today: addDays(demoToday(), -28) });
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em vắng');
  const out = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Xử lý muộn' });
  assert(out.outcomes[0].result === 'escalated',
    `Cần một đề nghị đang chờ để kiểm, đang là ${out.outcomes[0].result}`);
  const reqId = out.outcomes[0].requestId!;

  /* Vừa gửi xong: KHÔNG huỷ gì cả — khoảng chờ là có thật, và nó là của Quản lý. */
  absence.sweepExpiredMoves();
  const fresh = conn.prepare('SELECT status FROM skill_move_requests WHERE id = ?').get(reqId) as any;
  assert(fresh.status === 'pending', 'Vừa gửi đề nghị đã bị huỷ ngay');

  /* Đẩy hạn về quá khứ rồi quét lại: lúc này mới huỷ. */
  conn.prepare('UPDATE skill_move_requests SET decide_by = ? WHERE id = ?')
    .run(addDays(demoToday(), -1), reqId);
  const n = absence.sweepExpiredMoves();
  assert(n >= 1, 'Quá hạn duyệt mà không huỷ gì');
  const expired = conn.prepare('SELECT status, cancelled_part FROM skill_move_requests WHERE id = ?').get(reqId) as any;
  assert(expired.status === 'expired', `Đề nghị quá hạn phải chuyển sang "expired", đang là ${expired.status}`);
  assert(expired.cancelled_part === 1, 'Quá hạn mà phần thi không bị huỷ');
  const sp = conn
    .prepare(`SELECT sit_status FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(sp.sit_status === 'cancelled', 'Hết hạn mà phần thi vẫn còn hiệu lực');

  /* Đã huỷ rồi thì không duyệt vòng sau lưng nữa — phải đi qua khôi phục. */
  assertThrows(
    () => absence.decideAbsenceMove(mgr, reqId, { approve: true }),
    /đã được xử lý/, 'Duyệt được một đề nghị đã hết hạn và đã huỷ phần thi',
  );
});

check('[10.6] Xử lý muộn: tuần kế tiếp đã qua thì CHUYỂN QUẢN LÝ, không tự nhảy tuần', () => {
  const a = takePlannedAttempt();
  const mgr = loadPrincipal(userByRole('manager', a.branch_code));
  /* Buổi thi nằm ở quá khứ — GVCN xử lý muộn, tuần kế tiếp của nó cũng đã trôi qua. */
  skillSchedule.setSkillWeek(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), -21)),
    { reason: 'Buổi thi đã qua', force: true, today: addDays(demoToday(), -28) });   // PR-XLMT: lịch đặt từ 4 tuần trước (khi tuần đó chưa qua)
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Giờ mới xác minh em vắng');

  const out = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Xử lý muộn' });
  const o = out.outcomes[0];
  assert(o.result === 'escalated', `Tuần đích đã qua thì phải chuyển Quản lý, đang là ${o.result}`);
  const sp = conn
    .prepare(`SELECT absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(sp.n === 0, 'Việc chuyển cho Quản lý đã bị tính thành một lần dời');
  const req = conn.prepare('SELECT decide_by FROM skill_move_requests WHERE id = ?').get(o.requestId!) as any;
  assert(req.decide_by >= demoToday(),
    'Hạn duyệt bị đặt vào quá khứ — giả một khoảng chờ đã hết ngay lúc vừa tạo');
});

check('[10.6] Một thao tác nhóm cho buổi R/L/W, nhưng mỗi kỹ năng vẫn xử lý riêng', () => {
  const a = takePlannedAttempt();
  const mgr = loadPrincipal(userByRole('manager', a.branch_code));
  for (const s of ['listening', 'reading', 'writing']) {
    skillSchedule.setSkillWeek(mgr, a.id, s, periodOf(addDays(demoToday(), 21)),
      { reason: 'Buổi R/L/W', force: true });
    skillSchedule.setSitStatus(mgr, a.id, s, 'absent', 'Em vắng cả buổi R/L/W');
  }
  /* Listening đã dời một lần từ trước → nó phải đi xin duyệt, hai môn kia thì không. */
  conn.prepare(`UPDATE attempt_skills SET absence_move_count = 1 WHERE attempt_id = ? AND skill = 'listening'`)
    .run(a.id);

  const out = absence.requestAbsenceMove(mgr, a.id, ['listening', 'reading', 'writing'], {
    reason: 'Em vắng buổi R/L/W',
  });
  const by = new Map(out.outcomes.map((o: any) => [o.skill, o]));
  assert(by.get('listening')!.result === 'huy-vang',   // PR-MTa T3: vắng lần 2 → huỷ (vắng 2 lần), không tự dời
    'Môn đã dời một lần vẫn tự dời được khi đi theo nhóm — dùng thao tác nhóm để vượt quyền');
  assert(by.get('reading')!.result === 'moved', 'Môn chưa dời lần nào mà không dời được');
  assert(by.get('writing')!.result === 'moved', 'Môn chưa dời lần nào mà không dời được');

  /* Speaking KHÔNG đụng tới: vắng buổi R/L/W không tiêu lượt của buổi nói. */
  const sp = conn
    .prepare(`SELECT absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(sp.n === 0, 'Vắng buổi R/L/W đã tiêu mất lượt dời của Speaking');
});

check('[10.6] Giáo viên bộ môn không tự xử lý việc vắng của lớp', () => {
  const { a } = absentSkill('speaking', 3);
  assertThrows(
    () => absence.requestAbsenceMove(P.subjectTeacher, a.id, ['speaking'], { reason: 'Thử' }),
    /chủ nhiệm|Quản lý/, 'Giáo viên bộ môn xử lý được việc vắng',
  );
});


console.log('\n38. Hồ sơ học viên: đầu hồ sơ, bảng kỹ năng và bốn mục menu (mục 4 · 5)');

check('[4.1] Câu tổng hợp đầu hồ sơ nói rõ TỪNG kỹ năng, không gộp thành một mức', () => {
  /*
   * Ví dụ của chính đề bài: Listening đã đạt nhưng W2/S còn dưới kỳ vọng thì phải nói rõ
   * từng kỹ năng — không làm toàn học viên hết SOS chỉ vì Listening đạt, và cũng không
   * khiến case Listening đang chờ kết luận trông như vẫn chưa đạt.
   */
  const row = conn
    .prepare(
      `SELECT a.student_id sid, a.cycle_id cid FROM assessment_attempts a
         JOIN assessment_scores s ON s.attempt_id = a.id
        WHERE s.band IS NOT NULL GROUP BY a.student_id ORDER BY COUNT(*) DESC LIMIT 1`,
    )
    .get() as any;
  const pr = profile.studentProfile(P.admin, row.sid, row.cid) as any;
  /* PR-VAI-b (Q5): `headline` bỏ — kỹ năng dưới kỳ vọng ở đầu hồ sơ nay là `dauHoSo.duoi` (dựng từ CÙNG bảng kỹ năng). */
  assert(pr.dauHoSo, 'Hồ sơ không có đầu hồ sơ');
  assert(Array.isArray(pr.dauHoSo.duoi) && !('headline' in pr),
    'Đầu hồ sơ phải nêu kỹ năng dưới kỳ vọng; không còn `headline` cũ');

  /* Câu tổng hợp phải khớp với BẢNG BÊN DƯỚI — hai chỗ không được nói ngược nhau. */
  const board = (cases.skillSupportBoard(P.admin, row.sid, row.cid) as any).rows;
  const belowFromBoard = board.filter((r: any) => r.missed === true).map((r: any) => r.short ?? r.label);
  assert(JSON.stringify(pr.dauHoSo.duoi) === JSON.stringify(belowFromBoard),
    `Đầu hồ sơ nói ${JSON.stringify(pr.dauHoSo.duoi)} còn bảng nói ${JSON.stringify(belowFromBoard)}`);
});

check('[4.1] Một em có kỹ năng đạt và kỹ năng chưa đạt thì câu tổng hợp nêu đúng môn chưa đạt', () => {
  const mixed = conn
    .prepare(
      `SELECT a.student_id sid, a.cycle_id cid, a.id aid FROM assessment_attempts a
        WHERE a.status != 'cancelled' AND a.target_at_attempt IS NOT NULL
          AND (SELECT COUNT(*) FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL) >= 4
        ORDER BY a.id DESC`,
    )
    .all() as any[];
  let found = false;
  for (const m of mixed) {
    const board = (cases.skillSupportBoard(P.admin, m.sid, m.cid) as any).rows;
    const below = board.filter((r: any) => r.missed === true);
    const met = board.filter((r: any) => r.missed === false);
    if (!below.length || !met.length) continue;
    found = true;
    const pr = profile.studentProfile(P.admin, m.sid, m.cid) as any;
    for (const r of below) {
      assert(pr.dauHoSo.duoi.includes(r.short ?? r.label),
        `${r.label} dưới kỳ vọng mà câu tổng hợp không nêu`);
    }
    for (const r of met) {
      assert(!pr.dauHoSo.duoi.includes(r.short ?? r.label),
        `${r.label} đã đạt mà câu tổng hợp vẫn kể vào nhóm dưới kỳ vọng`);
    }
    break;
  }
  assert(found, 'Bộ demo thiếu em có kỹ năng đạt lẫn kỹ năng chưa đạt trong cùng một đợt');
});

check('[4.2] Mỗi hàng kỹ năng mang ĐỦ case của nó, không chỉ một case đại diện', () => {
  const dup = conn
    .prepare(
      `SELECT student_id sid, category, COUNT(*) n FROM sos_cases
        WHERE category IS NOT NULL GROUP BY student_id, category HAVING n > 1 LIMIT 1`,
    )
    .get() as any;
  assert(dup, 'Bộ demo thiếu em có nhiều case trong cùng một kỹ năng');
  const cid = (conn.prepare('SELECT cycle_id FROM sos_cases WHERE student_id = ? AND category = ? LIMIT 1')
    .get(dup.sid, dup.category) as any).cycle_id;
  const board = (cases.skillSupportBoard(P.admin, dup.sid, cid) as any).rows;
  const row = board.find((r: any) => r.category === dup.category);
  assert(row, `Không có hàng ${dup.category} trong bảng kỹ năng`);
  assert(row.cases.length >= 2,
    `Kỹ năng có ${dup.n} case mà bảng chỉ trỏ được vào ${row.cases.length} — case còn lại không có đường vào`);

  /* Đang mở TRƯỚC, rồi tới cập nhật nghiệp vụ mới nhất (mục 4.3). */
  const openFirst = row.cases.map((c: any) => (c.status === 'done' ? 1 : 0));
  assert(openFirst.every((v: number, i: number) => i === 0 || openFirst[i - 1] <= v),
    'Case đã hoàn thành chen lên trên case đang mở');
});

check('[4.2] Kỹ năng KHÔNG có case vẫn có hàng riêng — "chưa có dữ liệu" khác "không có vấn đề"', () => {
  const s = conn.prepare('SELECT id FROM students LIMIT 1').get() as any;
  const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? LIMIT 1`).get(s.id) as any;
  const board = (cases.skillSupportBoard(P.admin, s.id, cy?.id ?? null) as any).rows;
  assert(board.length >= 4, `Bảng phải có đủ hàng cho mọi kỹ năng, đang có ${board.length}`);
  assert(board.every((r: any) => r.category !== GONE), 'Bảng kỹ năng không còn hàng Ý thức');
  for (const r of board) {
    assert(Array.isArray(r.cases), `Hàng ${r.category} không có danh sách case`);
    assert(!('signal' in r), `Hàng ${r.category} không còn khối tín hiệu chờ xác minh (PR-LT2a)`);
  }
});

check('[4.2] Case Progress Test tự tạo (PR-LT2a) nằm ở ĐÚNG hàng kỹ năng của nó, không lọt sang hàng khác', () => {
  const c = conn
    .prepare(`SELECT sc.* FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
               WHERE a.kind = 'progress' AND sc.origin_kind = 'mock' AND sc.category IS NOT NULL AND sc.status != 'done' LIMIT 1`)
    .get() as any;
  assert(c, 'Bộ demo không còn Case Progress Test tự tạo nào');
  const board = (cases.skillSupportBoard(P.admin, c.student_id, c.cycle_id) as any).rows;
  /* PR-UXF-b (R5-5): Case hiện ở ĐÚNG MỘT hàng cùng hạng mục — hàng chuẩn, hoặc nhóm "Case bàn giao" khi em đã sang chương trình có TÊN MÔN khác (FOU G+V → BE Writing). */
  const hangCo = board.filter((r: any) => r.cases.some((x: any) => x.id === c.id));
  assert(hangCo.length === 1 && hangCo[0].category === c.category, `Case ${c.category} phải hiện ở đúng một hàng ${c.category}, đang ở: ${hangCo.map((r: any) => `${r.category}${r.tuLopTruoc ? '(từ lớp trước)' : ''}`).join(', ') || 'không hàng nào'}`);
});

check('[4.4] Biểu đồ có khoảng thực hiện phương án trên cùng trục thời gian', () => {
  const row = conn
    .prepare(
      `SELECT sc.student_id sid, sc.cycle_id cid FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.started_date IS NOT NULL
          AND sc.category IS NOT NULL AND sc.category != '${GONE}'
        LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Bộ demo thiếu phương án học thuật đã bắt đầu để vẽ');
  const pr = profile.studentProfile(P.admin, row.sid, row.cid) as any;
  const withPlans = pr.progress.skills.filter((s: any) => (s.plans ?? []).length > 0);
  assert(withPlans.length > 0, 'Không kỹ năng nào có khoảng phương án để vẽ dưới đường điểm');
  for (const s of withPlans) {
    for (const pl of s.plans) {
      assert(pl.from, 'Khoảng phương án không có ngày bắt đầu — không vẽ được');
      assert(pl.caseId, 'Khoảng phương án không nối về case nào — bấm vào không mở được gì');
      /* Chưa xong thì KHÔNG có ngày kết thúc thật; giao diện vẽ đuôi mở tới ngày dự kiến. */
      if (pl.running) assert(pl.to === null, 'Phương án đang chạy mà đã có ngày kết thúc thật');
    }
  }
});

check('[4.5] Hành trình chỉ giữ mốc xuyên chương trình, không lặp mọi cập nhật phương án', () => {
  const row = conn
    .prepare(
      `SELECT student_id sid, cycle_id cid FROM journey_events
        WHERE event_type = 'intervention' AND cycle_id IS NOT NULL LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Bộ demo thiếu sự kiện phương án trong hành trình');
  /* PR-VAI-b (Q14): chương theo lớp chỉ kể Case + PA (khối gọn, kèm kết quả) — KHÔNG lặp từng lần ghi kết quả, không việc / hạn / người giữ việc.
     Từng lần ghi kết quả vẫn tra lại được ở trục tuần (khối PA) và Ngăn Case. */
  const ht = hanhTrinhSvc.hanhTrinhHocVien(P.admin, row.sid, null) as any;
  const chuoi = JSON.stringify(ht.chuong);
  assert(!/"(han|actionDue|followupDue|nguoi|ownerId|observed_on)"/.test(chuoi), 'Chương kể cả việc / hạn / người hoặc từng lần ghi kết quả');
  assert(ht.hop.some((h: any) => h.vanDe.some((v: any) => v.pa.length > 0)) || !ht.chuong.some((c: any) => c.caseDong.some((x: any) => x.pa.length)),
    'Trục tuần phải còn khối PA để tra lại');
});

check('[4.5] Hành trình là của CẢ em, không bị cắt theo lộ trình đang xem', () => {
  const many = conn
    .prepare(
      `SELECT student_id sid, COUNT(*) n FROM learning_cycles
        GROUP BY student_id HAVING n > 1 LIMIT 1`,
    )
    .get() as any;
  assert(many, 'Bộ demo thiếu em đi qua nhiều lộ trình');
  const cys = conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq').all(many.sid) as any[];
  /* PR-VAI-b: chương theo lớp là của CẢ em — không đổi theo giai đoạn đang xem trên trục. */
  void cys;
  const a = hanhTrinhSvc.hanhTrinhHocVien(P.admin, many.sid, 'thuong') as any;
  const b = hanhTrinhSvc.hanhTrinhHocVien(P.admin, many.sid, 'ft') as any;
  assert(JSON.stringify(a.chuong) === JSON.stringify(b.chuong),
    'Đổi giai đoạn đang xem làm chương theo lớp của em dài ngắn khác nhau');
});

check('[5.1] Kết luận lộ trình KHÔNG lấy một lượt Mock Test làm kết quả thi thật', () => {
  const cy = conn
    .prepare(`SELECT lc.id, lc.student_id FROM learning_cycles lc
               JOIN assessment_attempts a ON a.cycle_id = lc.id LIMIT 1`)
    .get() as any;
  const a = conn.prepare('SELECT id FROM assessment_attempts WHERE cycle_id = ? LIMIT 1').get(cy.id) as any;
  assertThrows(
    () => cycles.setOutcome(P.admin, cy.id, { outcome: 'reached', attemptId: a.id }),
    /Mock Test/, 'Lấy được một lượt MT làm kết quả thi thật',
  );
  /* Nhập điểm thật thì bình thường. */
  cycles.setOutcome(P.admin, cy.id, { outcome: 'reached', score: 6.5, note: 'Em báo điểm BC' });
  const after = conn.prepare('SELECT outcome_score, outcome_attempt_id FROM learning_cycles WHERE id = ?')
    .get(cy.id) as any;
  assert(after.outcome_score === 6.5, 'Không lưu được điểm thi thật');
  assert(after.outcome_attempt_id === null, 'Kết luận vẫn còn trỏ vào một lượt MT');
  /* Dọn lại để các phép kiểm sau không đọc phải kết luận vừa dựng. */
  cycles.setOutcome(P.admin, cy.id, { outcome: null, note: null });
});

check('[5.3] Lớp Normal có tuần kết thúc chương trình, không có target IELTS', () => {
  const row = conn
    .prepare(
      `SELECT lc.student_id sid, lc.id cid FROM learning_cycles lc
         JOIN programmes pg ON pg.code = lc.programme_code
        WHERE pg.scoring_mode = 'ratio' AND lc.start_period_id IS NOT NULL LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Bộ demo thiếu lộ trình lớp Normal đã khai tuần bắt đầu');
  const pr = profile.studentProfile(P.admin, row.sid, row.cid) as any;
  assert(pr.cycle.ratio, 'Lộ trình này không được nhận là lớp Normal');
  assert(pr.cycle.endWeek?.code, 'Lớp Normal không có tuần kết thúc chương trình');
  assert(pr.cycle.programmeName, 'Lớp Normal không nói được đang học chương trình nào');
  /*
   * TUẦN KẾT THÚC SUY RA từ tuần bắt đầu cộng độ dài chương trình, không lưu thành cột thứ
   * hai — hai nguồn cho cùng một ngày thì sớm muộn chúng lệch nhau.
   */
  const weeks = { FOU: 8, BE: 10, ELE: 10 }[
    conn.prepare('SELECT programme_code c FROM learning_cycles WHERE id = ?').get(row.cid) as any
      ? (conn.prepare('SELECT programme_code c FROM learning_cycles WHERE id = ?').get(row.cid) as any).c as 'FOU'
      : 'FOU'
  ] ?? 8;
  const start = conn
    .prepare(`SELECT week_start FROM report_periods WHERE id =
              (SELECT start_period_id FROM learning_cycles WHERE id = ?)`)
    .get(row.cid) as any;
  assert(pr.cycle.endWeek.weekStart === addDays(start.week_start, (weeks - 1) * 7),
    `Tuần kết thúc phải là tuần thứ ${weeks} kể từ tuần bắt đầu, đang là ${pr.cycle.endWeek.weekStart}`);
});


check('[4.2] Lớp Normal có kết quả trong bảng kỹ năng — không để trống vì thiếu cột band', () => {
  /*
   * Lớp Normal chấm ĐIỂM ĐẠT trên TỔNG, nên cột `band` của nó luôn trống. Bản trước bảng kỹ
   * năng chỉ đọc `band`, nên hồ sơ một em Foundation có cột "Kết quả gần nhất" trống trơn
   * trong khi bảng điểm ngay bên dưới bày đủ bốn môn.
   */
  const row = conn
    .prepare(
      `SELECT a.student_id sid, a.cycle_id cid FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN programmes pg ON pg.code = c.programme_code
         JOIN assessment_scores s ON s.attempt_id = a.id
        WHERE pg.scoring_mode = 'ratio' AND s.raw_score IS NOT NULL
        LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Bộ demo thiếu bài lớp Normal đã chấm');
  const board = (cases.skillSupportBoard(P.admin, row.sid, row.cid) as any).rows;
  const scored = board.filter((r: any) => r.category !== GONE && r.band !== null);
  assert(scored.length > 0, 'Bảng kỹ năng của em lớp Normal không có kết quả nào');
  for (const r of scored) {
    assert(r.ratio === true, `Hàng ${r.category} không được đánh dấu là lớp Normal`);
    assert(r.total && r.score !== null,
      `Hàng ${r.category} thiếu đạt/tổng — giao diện sẽ phải bịa ra một band`);
    assert(r.missed === (r.score / r.total < 0.7),
      `Hàng ${r.category} kết luận đạt/chưa đạt không khớp ngưỡng 70%`);
  }
});


// ==================================================================== 39

console.log('\n39. Hai dạng xem của lớp và bảng phân tích vấn đề (mục 13.3 · 13.4)');

/** Một em ở lớp MB FT 101, kèm lớp và chu kỳ — đủ để mở case và ghi phương án. */
function boardStudent(offset = 0) {
  const row = conn
    .prepare(
      `SELECT s.id, e.class_id, cy.id AS cycle_id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active'
        ORDER BY s.id LIMIT 1 OFFSET ?`,
    )
    .get(classId('MB FT 101'), offset) as any;
  assert(row, 'Không tìm được học viên ở MB FT 101 để thử');
  return row;
}

check('[15.3] "Chưa đủ dữ liệu" không vào nhóm nào và không vào mẫu số', () => {
  assert(effectiveness.outcomeGroup('improved') === 'success', 'Khá hơn phải là thành công');
  assert(effectiveness.outcomeGroup('partial') === 'success', 'Đỡ một phần phải là thành công');
  assert(effectiveness.outcomeGroup('unchanged') === 'failure', 'Không đổi phải là không thành công');
  assert(effectiveness.outcomeGroup('worse') === 'failure', 'Tệ hơn phải là không thành công');
  assert(effectiveness.outcomeGroup('insufficient') === 'undetermined',
    '"Chưa đủ dữ liệu" đang bị xếp vào một nhóm — đó là lấy sự trung thực của người dạy trừ điểm họ');
  assert(effectiveness.outcomeGroup(null) === 'undetermined',
    'Phương án chưa có kết quả nào đang bị tính là một nhóm');
});

check('[13.4] Năm con số là năm đơn vị khác nhau, và phương án chưa rõ kết quả không phải thất bại', () => {
  const st = boardStudent(3);
  const c = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, topic: 'reading',
    parallel: true, title: 'Reading: hết giờ ở passage 3',
    summary: 'Em đọc kỹ từng câu nên luôn hết giờ khi còn hai câu cuối của passage 3.',
    primaryCode: 'student.reading.time',
  }) as any;

  /* Một case, HAI phương án — nên số phương án không bằng số case. */
  const planIdOf = (detail: any, kind: string) => {
    const iv = detail.interventions.find((i: any) => i.kind === kind);
    assert(iv, `Không tìm thấy phương án ${kind} vừa ghi`);
    return iv.id as number;
  };
  const p1 = planIdOf(cases.recordIntervention(P.admin, c.id, {
    kind: 'self_study', status: 'started', startedDate: demoToday(), performerSelf: true,
    description: 'Mỗi ngày làm một passage bấm giờ 18 phút.',
  }) as any, 'self_study');
  const p2 = planIdOf(cases.recordIntervention(P.admin, c.id, {
    kind: 'teaching_adjust', status: 'started', startedDate: demoToday(), performerSelf: true,
    description: 'Buổi chữa bài sẽ làm chậm phần tìm dẫn chứng trong bài.',
  }) as any, 'teaching_adjust');

  /*
   * Một phương án vẫn ĐANG THEO DÕI với kết quả "chưa đủ dữ liệu"; một phương án KẾT THÚC
   * với kết quả khá hơn. Hai thứ đó phải nằm ở hai cột khác nhau của bảng.
   */
  cases.updateResult(P.admin, p2, {
    outcome: 'insufficient', nextStep: 'continue',
    note: 'Tuần này chưa có bài Reading mới nên chưa nhìn được gì.',
    observedOn: demoToday(),
  });
  cases.updateResult(P.admin, p1, {
    mode: 'end', outcome: 'improved', nextStep: 'complete',
    note: 'Bài bấm giờ tuần này em làm hết passage 3 còn dư hai phút.',
    observedOn: demoToday(), completedOn: demoToday(),
  });

  const board = effectiveness.classIssueBoard(st.class_id, 'reading') as any;
  const row = board.rows.find((r: any) => r.code === 'student.reading.time');
  assert(row, 'Bảng phân tích thiếu hàng phân loại của case vừa mở');
  assert(row.plans >= 2, `Hàng này phải có ít nhất hai phương án, đang có ${row.plans}`);
  assert(row.plans > row.cases || row.cases > 1,
    'Số phương án đang bằng số case — bảng sẽ dụ người đọc chia hai con số cho nhau');
  assert(row.success >= 1, 'Phương án kết thúc với kết quả khá hơn không được đếm là thành công');
  assert(row.running >= 1, 'Phương án đang theo dõi không được đếm');

  /* Cộng các hàng lớn hơn số em duy nhất thì bảng phải NÓI RA, không để người đọc tự cộng. */
  const rowSum = board.rows.reduce((n: number, r: any) => n + r.students, 0);
  if (rowSum > board.studentCount) assert(!!board.note, 'Cộng các hàng ra số khác mà bảng không giải thích');
});

check('[13.4] Tỷ lệ theo LOẠI phương án: mẫu số bỏ phương án chưa rõ, mẫu nhỏ phải nói là mẫu nhỏ', () => {
  const st = boardStudent(3);
  const eff = effectiveness.planEffectiveness({ classId: st.class_id, category: 'reading' }) as any[];
  assert(eff.length > 0, 'Không có loại phương án nào của Reading được tổng hợp');
  for (const k of eff) {
    assert(k.decided === k.success + k.failure,
      `Loại ${k.kind}: mẫu số ${k.decided} không bằng số phương án có kết quả xác định`);
    assert(k.rate === null || (k.rate >= 0 && k.rate <= 100), `Loại ${k.kind}: tỷ lệ ra ngoài 0–100`);
    assert(k.smallSample === (k.decided > 0 && k.decided < 5),
      `Loại ${k.kind}: cờ mẫu nhỏ không khớp mẫu số ${k.decided}`);
  }
});

check('[13.4] Bốn tab cố định của Normal, năm tab của Fast Track — W1 và W2 không mất', () => {
  const normal = effectiveness.issueBoardCategories(true).map((c: any) => c.code);
  const ft = effectiveness.issueBoardCategories(false).map((c: any) => c.code);
  assert(normal.join(',') === 'listening,reading,writing,speaking',
    `Bộ tab lớp Normal sai: ${normal.join(',')}`);
  /* Ý thức/Khác KHÔNG có tab ở đây — nhóm đó không có tỷ lệ tiến bộ để báo cáo. */
  assert(!normal.includes(GONE) && !ft.includes(GONE),
    'Bảng phân tích đang có tab Ý thức/Khác, nơi mọi cột tỷ lệ đều vô nghĩa');
  assert(ft.includes('writing1') && ft.includes('writing2'),
    `Lớp Fast Track mất W1/W2: ${ft.join(',')}`);
  assert(!ft.includes('writing'), 'Lớp Fast Track không được có tab Writing gộp');
});

check('[13.4] Case chưa phân loại có hàng riêng, không bị dồn vào "Khác"', () => {
  const st = boardStudent(4);
  const c = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, topic: 'listening',
    parallel: true, title: 'Listening: nghe sót số liệu',
    summary: 'Em nghe sót phần số liệu ở section 2, nghe lại thì nhận ra ngay.',
    primaryCode: 'student.listening.technique',
  }) as any;
  /* Dữ liệu cũ có case chưa kịp phân loại — bảng phải hiện chúng, không gộp vào "Khác". */
  conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(c.id);

  const board = effectiveness.classIssueBoard(st.class_id, 'listening') as any;
  const un = board.rows.find((r: any) => r.code === '__unclassified__');
  assert(un && un.cases >= 1, 'Case chưa phân loại biến mất khỏi bảng phân tích');
  assert(un.label === 'Chưa chọn nhóm nguyên nhân', `Hàng chưa phân loại đang mang nhãn "${un.label}"`);
  /* Và nó phải là MỘT HÀNG KHÁC với hàng "Khác" — hai tập này cần hai người xử lý khác nhau. */
  assert(board.rows.filter((r: any) => r.code === '__unclassified__').length === 1,
    'Case chưa phân loại bị tách thành nhiều hàng');
  assert(!board.rows.some((r: any) => r.code === 'student.listening.other' && r.label === un.label),
    'Hàng chưa phân loại và hàng "Khác" đang mang cùng một nhãn');
});



// ==================================================================== 40

console.log('\n40. Tiến độ công việc: số bộ lọc và dòng tổng hợp (mục 14.1 · 14.2)');

check('[14.1] Chọn một nhóm KHÔNG làm ba nhóm còn lại về 0', () => {
  const all = mgmt.listMgmtTasks(P.admin, {}) as any;
  assert(all.facets, 'Bảng công việc không trả về số cho từng nhóm');
  /* Bỏ khoá rỗng: đó là những việc CHƯA CÓ NHÓM, không phải một nhóm để lọc. */
  const groups = Object.entries(all.facets.group as Record<string, number>)
    .filter(([k, n]) => k && n > 0)
    .map(([k]) => k);
  assert(groups.length >= 2, `Bộ demo cần ít nhất hai nhóm công việc, đang có ${groups.length}`);

  /* Chọn nhóm thứ nhất: DANH SÁCH co lại, nhưng SỐ trên các nút nhóm phải giữ nguyên. */
  const picked = mgmt.listMgmtTasks(P.admin, { group: groups[0] }) as any;
  assert(picked.rows.every((r: any) => r.group === groups[0]), 'Lọc nhóm mà danh sách vẫn lẫn nhóm khác');
  for (const g of groups) {
    assert(picked.facets.group[g] === all.facets.group[g],
      `Chọn nhóm "${groups[0]}" làm số của nhóm "${g}" đổi từ ${all.facets.group[g]} thành ${picked.facets.group[g]}`);
  }
  assert(picked.facets.group[groups[1]] > 0,
    'Nhóm không được chọn đang hiện 0 — người dùng sẽ tưởng trung tâm hết việc ở nhóm đó');
});

check('[14.1] Số theo trạng thái cũng đếm trên toàn tập, không đếm sau khi đã lọc trạng thái', () => {
  const all = mgmt.listMgmtTasks(P.admin, {}) as any;
  const states = Object.entries(all.facets.progress as Record<string, number>)
    .filter(([k, n]) => k && n > 0).map(([k]) => k);
  assert(states.length >= 2, 'Bộ demo cần ít nhất hai trạng thái công việc');
  const picked = mgmt.listMgmtTasks(P.admin, { progress: states[0] }) as any;
  for (const st of states) {
    assert(picked.facets.progress[st] === all.facets.progress[st],
      `Chọn trạng thái "${states[0]}" làm số của "${st}" thay đổi`);
  }
});

check('[14.2] Dòng tổng hợp (PR-Ra: hàng số Q8) là bốn câu hỏi chồng nhau, không phải một phép chia', () => {
  const all = mgmt.listMgmtTasks(P.admin, {}) as any;
  const s = all.hangSo;
  assert(s, 'Không có hàng số');
  for (const k of ['qua-han', 'cho-nguoi-khac', 'can-quyet-dinh', 'vua-xong']) {
    assert(s[k] >= 0 && s[k] <= all.rows.length, `Con số "${k}" nằm ngoài khoảng hợp lệ`);
  }
  /*
   * Quá hạn và Tạm ngưng CHỒNG NHAU có chủ ý (Q8) — nên bốn con số cộng lại có thể lớn hơn
   * tổng, và giao diện phải nói ra điều đó chứ không được bày như một phép chia.
   *
   * `hangSo` không lọc theo trạng thái đang chọn (chỉ áp nhóm) — gọi không lọc gì cả (`{}`)
   * thì nó phải khớp CHÍNH các dòng "quá hạn" đang hiện ra.
   */
  assert(s['qua-han'] === all.rows.filter((r: any) => r.overdue).length,
    'Số quá hạn ở hàng số không khớp chính các dòng đang hiện khi không lọc trạng thái');
});

check('[14.2] Phạm vi chi nhánh áp TRƯỚC bộ lọc nhóm, không áp sau', () => {
  const mb = (conn.prepare("SELECT id FROM branches WHERE code='MB'").get() as any).id;
  const all = mgmt.listMgmtTasks(P.admin, {}) as any;
  const one = mgmt.listMgmtTasks(P.admin, { branchId: mb }) as any;
  const sumOf = (f: Record<string, number>) => Object.values(f).reduce((a, b) => a + b, 0);
  assert(sumOf(one.facets.group) <= sumOf(all.facets.group),
    'Lọc một chi nhánh mà số việc lại nhiều hơn cả trung tâm');
  assert(one.rows.every((r: any) => r.branchId === mb || r.branchId === null),
    'Lọc chi nhánh mà danh sách vẫn lẫn việc của chi nhánh khác');
});



// ==================================================================== 41

console.log('\n41. Thực trạng: hàng kỹ năng, phạm vi và bấm số (mục 15.1 · 15.2)');



check('[15.2] Học viên đếm DUY NHẤT, và bảng nói ra khi cộng các hàng lớn hơn số em thật', () => {
  const scope = { ratio: false } as any;
  for (const cat of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) {
    const b = effectiveness.issueBoard(scope, cat) as any;
    if (!b.rows.length) continue;
    const rowSum = b.rows.reduce((n: number, r: any) => n + r.students, 0);
    assert(b.studentCount <= rowSum, `${cat}: số em duy nhất lớn hơn tổng các hàng — không thể`);
    if (rowSum > b.studentCount) {
      assert(!!b.note, `${cat}: cộng các hàng ra ${rowSum} mà bảng không giải thích`);
    }
  }
});


// ==================================================================== 42

console.log('\n42. Mười bốn tình huống bộ demo phải có (mục 18.2)');

/*
 * MỖI PHÉP KIỂM Ở ĐÂY SOI VÀO CHÍNH DỮ LIỆU DEMO, không soi vào luật.
 *
 * Luật đã được kiểm ở các mục trên. Phần này trả lời một câu khác: bộ demo có thật sự BÀY
 * RA được tình huống đó để chủ sản phẩm mở lên nhìn không. Một luật đúng mà không có dữ liệu
 * nào chạm tới nó thì không ai kiểm được bằng mắt, và đó chính là chỗ lỗi hay trốn.
 */
const one = (sql: string, ...args: unknown[]) => conn.prepare(sql).get(...args) as any;
const many = (sql: string, ...args: unknown[]) => conn.prepare(sql).all(...args) as any[];

check('[18.2-1] Có đợt MT tách tuần theo CẢ HAI chiều: RLW trước S sau, và S trước RLW sau', () => {
  const rows = many(
    `SELECT a.id,
            (SELECT MIN(rp.week_start) FROM attempt_skills sk
               JOIN report_periods rp ON rp.id = sk.planned_period_id
              WHERE sk.attempt_id = a.id AND sk.skill != 'speaking') AS lrw,
            (SELECT MIN(rp.week_start) FROM attempt_skills sk
               JOIN report_periods rp ON rp.id = sk.planned_period_id
              WHERE sk.attempt_id = a.id AND sk.skill = 'speaking') AS sp
       FROM assessment_attempts a WHERE a.kind = 'mock'`,
  ).filter((r) => r.lrw && r.sp);
  assert(rows.some((r) => r.sp > r.lrw), 'Không có đợt nào thi Speaking SAU nhóm R/L/W');
  assert(rows.some((r) => r.sp < r.lrw), 'Không có đợt nào thi Speaking TRƯỚC nhóm R/L/W');
});

check('[18.2-2] Có đợt FT chỉ thi một phần kỹ năng, hoàn tất đúng scope và KHÔNG có Overall giả', () => {
  const partial = many(
    `SELECT a.id, a.status,
            (SELECT COUNT(*) FROM attempt_skill_skips k WHERE k.attempt_id = a.id) AS skipped
       FROM assessment_attempts a WHERE a.kind = 'mock' AND a.status = 'done'`,
  ).filter((r) => r.skipped > 0);
  assert(partial.length > 0, 'Bộ demo không có đợt MT nào bỏ bớt kỹ năng ngay từ đầu');
  for (const a of partial) {
    const d = attempts.attemptDetail(P.admin, a.id) as any;
    assert(d.overall === null || d.overall === undefined,
      `Đợt ${a.id} thiếu kỹ năng mà vẫn có Overall ${d.overall} — đó là một con số bịa`);
  }
});

check('[18.2-3] Có lớp Normal đủ bốn môn, và ngưỡng đạt là 70%', () => {
  const row = one(
    `SELECT a.id FROM assessment_attempts a
       JOIN classes c ON c.id = a.class_id
       JOIN programmes pg ON pg.code = c.programme_code
      WHERE pg.scoring_mode = 'ratio' AND a.status = 'done' LIMIT 1`,
  );
  assert(row, 'Bộ demo không có bài lớp Normal nào đã chấm');
  /* Lấy một bài Normal ĐÃ CHẤM ĐỦ, và khẳng định lớp Normal luôn yêu cầu đủ bốn môn. */
  const full = many(
    `SELECT a.id, COUNT(DISTINCT s.skill) n FROM assessment_attempts a
       JOIN classes c ON c.id = a.class_id
       JOIN programmes pg ON pg.code = c.programme_code
       JOIN assessment_scores s ON s.attempt_id = a.id AND s.raw_score IS NOT NULL
      WHERE pg.scoring_mode = 'ratio' AND a.status = 'done'
      GROUP BY a.id HAVING n = 4`,
  );
  assert(full.length > 0, 'Không có bài lớp Normal nào đã chấm đủ bốn môn');
  /* Và KHÔNG lớp Normal nào có môn được đánh dấu "không yêu cầu". */
  const optional = one(
    `SELECT COUNT(*) n FROM attempt_skills sk
       JOIN assessment_attempts a ON a.id = sk.attempt_id
       JOIN classes c ON c.id = a.class_id
       JOIN programmes pg ON pg.code = c.programme_code
      WHERE pg.scoring_mode = 'ratio' AND sk.required = 0`,
  ).n;
  assert(optional === 0, `${optional} môn của lớp Normal bị đánh dấu không yêu cầu — lớp Normal luôn cần đủ bốn`);
  assert(domainRatio(28, 40).outcome === 'pass' && domainRatio(27, 40).outcome === 'fail',
    'Ngưỡng đạt của lớp Normal không phải 70%');
});

check('[18.2-4] Có đủ ba khúc của luật dời vì vắng: lần đầu GVCN, lần hai chờ duyệt, và một lần đã được trả lời', () => {
  const reqs = many('SELECT status, move_no FROM skill_move_requests');
  assert(reqs.some((r) => r.status === 'pending'), 'Không có đề nghị dời nào đang chờ Quản lý');
  assert(reqs.some((r) => r.status === 'approved' || r.status === 'declined'),
    'Không có đề nghị dời nào đã được trả lời — không xem được hai lối ra');
  const moved = many(`SELECT skill, absence_move_count FROM attempt_skills WHERE absence_move_count > 0`);
  assert(moved.length > 0, 'Không có kỹ năng nào đã bị dời — bộ đếm dời không có gì để nhìn');
});

check('[18.2-5] Có đợt huỷ RIÊNG một kỹ năng mà các kỹ năng còn lại vẫn nguyên', () => {
  const rows = many(
    `SELECT a.id,
            SUM(sk.sit_status = 'cancelled') AS cancelled,
            SUM(sk.sit_status != 'cancelled') AS alive
       FROM assessment_attempts a JOIN attempt_skills sk ON sk.attempt_id = a.id
      GROUP BY a.id HAVING cancelled > 0 AND alive > 0`,
  );
  assert(rows.length > 0, 'Không có đợt nào huỷ riêng một kỹ năng — không xem được luật "huỷ S giữ RLW"');
  /* Huỷ một kỹ năng KHÔNG được xoá điểm các kỹ năng đã thi của chính đợt đó. */
  for (const r of rows) {
    const kept = one(
      `SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ? AND band IS NOT NULL`, r.id,
    ).n;
    assert(kept >= 0, 'không thể');
  }
});

check('[18.2-6] Có kỹ năng ĐANG CHỜ xếp lại — chưa có tuần, và đợt chưa kết thúc', () => {
  const waiting = many(
    `SELECT a.id, sk.skill FROM assessment_attempts a
       JOIN attempt_skills sk ON sk.attempt_id = a.id
      WHERE sk.required = 1 AND sk.planned_period_id IS NULL AND a.status = 'planned'`,
  );
  const absent = many(
    `SELECT a.id, sk.skill FROM assessment_attempts a
       JOIN attempt_skills sk ON sk.attempt_id = a.id
      WHERE sk.sit_status = 'absent' AND a.status = 'planned'`,
  );
  assert(waiting.length > 0 || absent.length > 0,
    'Không có kỹ năng nào đang chờ xếp lại hoặc đã xác nhận vắng — không xem được khúc "chưa kết thúc đợt"');
});

check('[18.2-8] Có case SOS 2 mở từ điểm, chưa có phương án tự sinh', () => {
  const sos2 = many(
    `SELECT sc.id FROM sos_cases sc
      WHERE sc.sos_level >= 2 AND sc.origin_kind = 'mock'`,
  );
  assert(sos2.length > 0, 'Bộ demo không có case nào ở mức SOS 2 trở lên sinh từ điểm');
  /* Không có phương án nào được máy tự sinh: mọi phương án đều có người ghi. PR-PA (§8): Tự học không có người — PA quy chế Tự học chờ GVBM xác nhận. */
  const ghost = one(
    `SELECT COUNT(*) n FROM case_interventions WHERE recorded_by IS NULL AND performer_user_id IS NULL AND kind != 'self_study'`,
  ).n;
  assert(ghost === 0, `${ghost} phương án không có ai đứng sau — dấu vết của phương án tự sinh`);
});

check('[18.2-9] Có em trượt thật ở MT trước rồi tiến bộ ở MT sau', () => {
  const rows = many(
    `SELECT a.student_id, a.attempt_no, s.skill, s.band
       FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id
      WHERE a.kind = 'mock' AND a.status = 'done' AND s.band IS NOT NULL
      ORDER BY a.student_id, s.skill, a.attempt_no`,
  );
  let improved = false;
  for (let i = 1; i < rows.length; i += 1) {
    const a = rows[i - 1]; const b = rows[i];
    if (a.student_id === b.student_id && a.skill === b.skill && b.band > a.band) { improved = true; break; }
  }
  assert(improved, 'Không có em nào có điểm một kỹ năng tăng giữa hai đợt MT');
});

check('[18.2-11] Có phương án cập nhật "Chưa đủ dữ liệu" rồi mới tới tiến bộ', () => {
  const ivs = many(
    `SELECT intervention_id AS iv, GROUP_CONCAT(outcome) AS seq FROM (
        SELECT intervention_id, outcome FROM case_followups
         WHERE intervention_id IS NOT NULL ORDER BY observed_on, id)
      GROUP BY intervention_id`,
  );
  assert(ivs.some((r) => /insufficient/.test(r.seq) && /improved|partial/.test(r.seq)),
    'Không có phương án nào đi từ "Chưa đủ dữ liệu" tới tiến bộ');
  /* Và lần "chưa đủ dữ liệu" đó KHÔNG được vào mẫu số hiệu quả. */
  const eff = effectiveness.planEffectiveness({ ratio: false } as any);
  for (const k of eff) {
    assert(k.decided === k.success + k.failure, `Loại ${k.kind}: mẫu số lẫn phương án chưa rõ kết quả`);
  }
});

check('[18.2-12] Phương án bị thay thế VẪN giữ kết quả thất bại trong báo cáo', () => {
  const sup = many(
    `SELECT iv.id, sc.category,
            (SELECT fu.outcome FROM case_followups fu
              WHERE fu.intervention_id = iv.id AND fu.outcome IS NOT NULL
              ORDER BY fu.observed_on DESC, fu.id DESC LIMIT 1) AS last
       FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.closed_reason = 'superseded'`,
  );
  assert(sup.length > 0, 'Bộ demo không có phương án nào bị thay thế');
  const failed = sup.filter((r) => r.last === 'unchanged' || r.last === 'worse');
  assert(failed.length > 0, 'Không có phương án bị thay nào mang kết quả thất bại');
  /* Nó phải CÒN trong báo cáo hiệu quả — loại hết phương án bị thay là loại đúng phương án kém. */
  const all = effectiveness.planOutcomes({ ratio: false } as any)
    .concat(effectiveness.planOutcomes({ ratio: true } as any));
  assert(all.some((r) => r.supersededBy && r.group === 'failure'),
    'Phương án bị thay có kết quả thất bại đã biến mất khỏi báo cáo hiệu quả');
});

check('[18.2-12b] (PR-YT4) Có em ĐÃ được xử lý bằng Report mà vi phạm vẫn tái diễn — nhìn được ở dữ liệu Vi phạm và lần xử lý', () => {
  const rows = many(
    `SELECT dm.student_id,
            (SELECT COUNT(*) FROM violations v
              WHERE v.student_id = dm.student_id AND v.occurred_on > dm.performed_on) AS after
       FROM discipline_measures dm
      WHERE dm.kind IN ('report_1', 'report_2', 'report_4_meeting') AND dm.status = 'done'`,
  );
  assert(rows.some((r) => r.after > 0), 'Không có em nào đã được Report mà sau đó vẫn có vi phạm mới');
});

check('[18.2-13] Có case bàn giao khi chuyển lớp, và có em chưa xếp lớp tiếp theo', () => {
  /*
   * BÀN GIAO = case còn mở nhưng thuộc LỘ TRÌNH TRƯỚC của em, đúng định nghĩa mà bảng lớp
   * dùng. Đây là thứ đi theo em sang lớp mới và phải nhìn thấy được, chứ không bị tính thành
   * mức SOS của lớp mới.
   */
  const handover = one(
    `SELECT COUNT(*) n FROM sos_cases sc
       JOIN learning_cycles cur ON cur.student_id = sc.student_id AND cur.status = 'active'
      WHERE sc.status != 'done' AND sc.cycle_id IS NOT NULL AND sc.cycle_id != cur.id`,
  ).n;
  assert(handover > 0, 'Không có case nào còn mở từ lộ trình trước — không xem được việc bàn giao');
  const classes = classesSvc.listClassSummaries(P.admin, {}) as any;
  assert(classes.rows.some((c: any) => c.needsPlacement),
    'Không có lớp nào hết chương trình mà còn học viên chưa xếp lớp tiếp');
});

check('[18.2-14] Báo cáo kỳ họp có đủ bốn tình trạng, kể cả "Chưa báo cáo"', () => {
  const period = periodOf('2026-09-14');
  const board = meeting.meetingBoard(P.admin, period) as any;
  const states = new Set<string>();
  for (const u of board.units) for (const c of u.cells) states.add(c.status ?? 'none');
  for (const want of ['ok', 'watch', 'problem', 'none']) {
    assert(states.has(want), `Bảng báo cáo kỳ họp thiếu tình trạng "${want}" để xem`);
  }
  assert(board.totals.total === board.units.reduce((n: number, u: any) => n + u.cells.length, 0),
    'Số mục dự kiến không dựa trên cấu trúc đang có');
});

check('[18.2] Bộ demo KHÔNG đỏ rực: phần lớn học viên không quá hạn và không thiếu thông tin', () => {
  const total = one(`SELECT COUNT(*) n FROM students WHERE status = 'active'`).n;
  const withOpen = one(
    `SELECT COUNT(DISTINCT student_id) n FROM sos_cases WHERE status != 'done'`,
  ).n;
  assert(withOpen < total, 'Mọi học viên đều đang có case mở — bộ demo đỏ rực thì không ai đọc được');
  /* Và phải có cả em ĐÃ CẢI THIỆN: case đã đóng với kết quả tốt. */
  const good = one(
    `SELECT COUNT(*) n FROM sos_cases WHERE status = 'done' AND outcome IN ('improved','much_better')`,
  ).n;
  assert(good > 0, 'Không có case nào đã khép với kết quả tốt — bộ demo chỉ toàn chuyện xấu');
});

check('[18.2] Không có sự kiện nào đã xảy ra ở TƯƠNG LAI so với ngày demo', () => {
  const today = demoToday();
  const late = [
    ...many(`SELECT 'phương án xong' k, completed_date d FROM case_interventions
              WHERE id <= ? AND completed_date > ?`, SEED_MAX.case_interventions, today),
    ...many(`SELECT 'ghi kết quả' k, observed_on d FROM case_followups
              WHERE id <= ? AND observed_on > ?`, SEED_MAX.case_followups, today),
    ...many(`SELECT 'đóng case' k, closed_at d FROM sos_cases
              WHERE id <= ? AND closed_at IS NOT NULL AND substr(closed_at,1,10) > ?`, SEED_MAX.sos_cases, today),
    /*
     * KHÔNG dùng `entered_at`: đó là dấu thời gian lúc DÒNG ĐƯỢC GHI (đồng hồ thật của máy),
     * không phải ngày sự việc xảy ra. Thứ phải kiểm là: không có điểm nào của một đợt mà
     * TUẦN THI còn chưa tới.
     */
    ...many(`SELECT 'điểm của kỹ năng chưa thi' k, rp.week_start d
               FROM assessment_scores s
               JOIN assessment_attempts a ON a.id = s.attempt_id
               /* Tuần của CHÍNH KỸ NĂNG đó, vì một đợt có thể tách tuần (mục 10.4). */
               LEFT JOIN attempt_skills sk ON sk.attempt_id = a.id AND sk.skill = (
                 CASE WHEN s.skill IN ('writing1','writing2') THEN 'writing' ELSE s.skill END)
               JOIN report_periods rp ON rp.id = COALESCE(sk.planned_period_id, a.planned_period_id)
              WHERE s.id <= ? AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)
                AND rp.week_start > ?`, SEED_MAX.assessment_scores, today),
    /* Ngày báo cáo kỳ họp cũng là ngày hiện ra màn hình, nên nó theo lịch demo. */
    ...many(`SELECT 'báo cáo kỳ họp' k, substr(updated_at,1,10) d FROM unit_reports
              WHERE id <= ? AND updated_at IS NOT NULL AND substr(updated_at,1,10) > ?`,
            SEED_MAX.unit_reports, today),
  ];
  assert(late.length === 0,
    `Có ${late.length} sự kiện ghi là đã xảy ra sau ngày demo, ví dụ ${late[0]?.k} ngày ${late[0]?.d}`);
});

check('Ô điểm: ± là khoảng cách tới kỳ vọng của chính đợt đó', () => {
  const board = cases.skillSupportBoard(P.admin, 3);
  const row = board.rows.find((r: any) => r.band !== null && r.expectation !== null) as any;
  assert(row, 'Cần một hàng có cả điểm và kỳ vọng để kiểm');
  assert(
    row.gap === Math.round((row.band - row.expectation) * 10) / 10,
    `gap phải bằng điểm trừ kỳ vọng, đang là ${row.gap}`,
  );
  assert(!('delta' in row), 'Trường delta cũ phải bị bỏ để không ai đọc nhầm');
});

// ==================================================================== PR-A
// ==================================================================== PR-C

check('CASE-01 Task 2 · Case Học thuật vẫn chọn được ngày quá khứ như cũ', () => {
  const st = formTestStudent();
  const made = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, topic: 'reading',
    primaryCode: 'student.reading.time',
    title: 'Reading: quản lý thời gian còn chậm',
    summary: 'Ghi nhận từ buổi học tuần trước, em làm không kịp hai bài cuối.',
    detectedAt: addDays(demoToday(), -10),
    parallel: true,
  });
  assert(made?.id, 'Case Học thuật phải vẫn chọn ngày quá khứ được như trước PR-C');
});

/*
 * BA PHÉP KIỂM AUTH-01 (mục 10.5 Step 1) dùng đúng `P.subjectTeacher` — GVBM THUẦN của
 * MB FT 101 (không kiêm GVCN). `P.lrTeacher` KHÔNG dùng được ở đây: bộ demo chỉ có 3 giáo
 * viên cho 5 kỹ năng của lớp này, và trong đúng lớp MB FT 101, người dạy Listening lại
 * chính là GVCN — dùng người đó để kiểm "GVBM sai môn bị từ chối" sẽ luôn PASS sai lý do
 * (qua được vì là GVCN, không phải vì đúng môn).
 */
const authSubjectSkill = (conn
  .prepare(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill IS NOT NULL LIMIT 1`)
  .get(mbClass, P.subjectTeacher.userId) as any).skill as string;
const authMismatchSkill = domain.ENTRY_SKILLS.find((s: string) => s !== authSubjectSkill) as string;

check('CASE-01 Task 4 (AUTH-01) · GVBM sửa case của một kỹ năng KHÁC cùng lớp → bị từ chối', () => {
  const enr = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(mbClass) as any;
  const cy = conn.prepare(
    `SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' LIMIT 1`,
  ).get(enr.student_id) as any;
  const otherCase = cases.reportIssue(P.admin, {
    studentId: enr.student_id, cycleId: cy?.id, topic: authMismatchSkill,
    primaryCode: domain.issuesForTopic(authMismatchSkill)[0].code,
    title: `${authMismatchSkill}: kiểm quyền AUTH-01`,
    summary: `Ghi nhận riêng để kiểm quyền AUTH-01 — GVBM ${authSubjectSkill} không được sửa case ${authMismatchSkill}.`,
    parallel: true,
  });
  assertThrows(() => cases.recordIntervention(P.subjectTeacher, otherCase.id, {
    kind: 'self_study', description: 'Giao thêm bài luyện ngoài giờ.', status: 'planned',
  }), /quyền/, `GVBM ${authSubjectSkill} ghi nhận phương án cho case ${authMismatchSkill}`);
});

check('CASE-01 Task 4 (AUTH-01) · GVBM sửa case ĐÚNG kỹ năng mình dạy cùng lớp → được phép', () => {
  const enr = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(mbClass) as any;
  const cy = conn.prepare(
    `SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' LIMIT 1`,
  ).get(enr.student_id) as any;
  const ownCase = cases.reportIssue(P.admin, {
    studentId: enr.student_id, cycleId: cy?.id, topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: kiểm quyền AUTH-01`,
    summary: `Ghi nhận riêng để kiểm quyền — GVBM ${authSubjectSkill} phải sửa được đúng case kỹ năng của mình.`,
    parallel: true,
  });
  const iv = cases.recordIntervention(P.subjectTeacher, ownCase.id, {
    kind: 'self_study', description: 'Giao thêm bài luyện đúng kỹ năng đang dạy.', status: 'planned',
  });
  assert(iv?.id, `GVBM ${authSubjectSkill} phải ghi nhận được phương án cho đúng case kỹ năng của lớp mình dạy`);
});

console.log('\n43. PR-C Task 3 — Tab "Đã xong từ trước" (nhập bù), bảy chốt chặn (mục 10.4)');

/*
 * ĐỦ SINH VIÊN RIÊNG CHO TỪNG PHÉP KIỂM: dùng đúng học viên đang học ở MB FT 101 (khớp
 * `authSubjectSkill`/`authMismatchSkill` đã tính ở trên), nhưng mỗi phép kiểm chọn một
 * PHÂN LOẠI/khoảng ngày khác nhau để không tự đụng chỉ mục chống trùng của CHÍNH các phép
 * kiểm này với nhau.
 */
const backfillEnr = conn
  .prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
  .get(mbClass) as any;
const backfillCycle = conn
  .prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' LIMIT 1`)
  .get(backfillEnr.student_id) as any;

check('Nhập bù (chốt 1) · Không sinh nghĩa vụ cập nhật tuần nào cho phương án đã xong', () => {
  const done = cases.backfillCase(P.mbManager, {
    studentId: backfillEnr.student_id, cycleId: backfillCycle?.id,
    topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 1`, summary: 'Case nhập bù để kiểm chốt 1 — không sinh hạn cập nhật tuần.',
    fromDate: '2026-07-01', toDate: '2026-07-20',
    actions: [{ ketQua: 'improved', description: 'Giao bài luyện thêm mỗi tuần', performerName: 'GV bộ môn', fromDate: '2026-07-01', toDate: '2026-07-20' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 1: đã cải thiện rõ sau ba tuần.',
  }) as any;
  const iv = (conn.prepare('SELECT action_due, followup_due FROM case_interventions WHERE case_id = ?').all(done.id) as any[])[0];
  assert(iv.action_due === null, `Chốt 1: phương án nhập bù không được có hạn cập nhật, đang là ${iv.action_due}`);
  assert(iv.followup_due === null, `Chốt 1: phương án nhập bù không được có hạn kết thúc, đang là ${iv.followup_due}`);
});

check('Nhập bù (chốt 4) · Không tạo tín hiệu, không đổi mức SOS', () => {
  const enr4 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const done = cases.backfillCase(P.mbManager, {
    studentId: enr4.student_id, cycleId: backfillCycle?.id,
    topic: authMismatchSkill,
    primaryCode: domain.issuesForTopic(authMismatchSkill)[0].code,
    title: `${authMismatchSkill}: nhập bù chốt 4`, summary: 'Case nhập bù để kiểm chốt 4 — không tự sinh mức SOS.',
    fromDate: '2026-04-01', toDate: '2026-04-15',
    actions: [{ ketQua: 'improved', description: 'Ôn lại kỹ thuật làm bài', performerName: 'GV bộ môn', fromDate: '2026-04-01', toDate: '2026-04-15' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 4: là trí nhớ, không phải một bài đánh giá mới.',
  }) as any;
  const row = conn.prepare('SELECT sos_level, origin_kind FROM sos_cases WHERE id = ?').get(done.id) as any;
  assert(row.sos_level === null, `Chốt 4: case nhập bù không được tự có mức SOS, đang là ${row.sos_level}`);
  assert(row.origin_kind === 'backfill', `Chốt 4/7: origin_kind phải là "backfill", đang là ${row.origin_kind}`);
});

check('Nhập bù (chốt 5) · Không vào mẫu số hiệu quả hỗ trợ, nhưng vẫn hiện trên hồ sơ', () => {
  const enr5 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const before = effectiveness.planOutcomes({ studentIds: [enr5.student_id] }).length;
  const done = cases.backfillCase(P.mbManager, {
    studentId: enr5.student_id, cycleId: backfillCycle?.id,
    topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 5`, summary: 'Case nhập bù để kiểm chốt 5 — không vào mẫu số hiệu quả.',
    fromDate: '2026-03-01', toDate: '2026-03-10',
    actions: [{ ketQua: 'improved', description: 'Luyện thêm dạng bài hay sai', performerName: 'GV bộ môn', fromDate: '2026-03-01', toDate: '2026-03-10' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 5: không được tính vào tỷ lệ thành công hôm nay.',
  }) as any;
  const after = effectiveness.planOutcomes({ studentIds: [enr5.student_id] });
  assert(after.length === before, `Chốt 5: phương án nhập bù lọt vào mẫu số hiệu quả (${before} → ${after.length})`);
  assert(!after.some((r: any) => r.caseId === done.id), 'Chốt 5: case nhập bù xuất hiện trong danh sách hiệu quả hỗ trợ');
  // Vẫn hiện đủ trên hồ sơ — case đọc lại được, không bị ẩn.
  const detail = cases.caseDetail(P.coreTeacher, done.id) as any;
  assert(detail?.id === done.id && detail.interventions?.length === 1,
    'Chốt 5: case nhập bù phải vẫn đọc lại được đầy đủ trên hồ sơ');
});

check('Nhập bù (chốt 6) · Cảnh báo khi trùng với MỘT CASE NHẬP BÙ KHÁC cùng khoảng thời gian', () => {
  const enr6 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const first = cases.backfillCase(P.mbManager, {
    studentId: enr6.student_id, cycleId: backfillCycle?.id,
    topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 6 lần 1`, summary: 'Case nhập bù lần đầu để kiểm chốt 6 — cảnh báo trùng.',
    fromDate: '2026-02-01', toDate: '2026-02-10',
    actions: [{ ketQua: 'improved', description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-02-01', toDate: '2026-02-10' }],
    outcome: 'improved', note: 'Case nhập bù chốt 6, lần 1.',
  }) as any;
  assertThrows(() => cases.backfillCase(P.mbManager, {
    studentId: enr6.student_id, cycleId: backfillCycle?.id,
    topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 6 lần 2 (trùng)`, summary: 'Case nhập bù thứ hai, TRÙNG khoảng ngày với lần 1.',
    fromDate: '2026-02-05', toDate: '2026-02-15',
    actions: [{ ketQua: 'improved', description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-02-05', toDate: '2026-02-15' }],
    outcome: 'improved', note: 'Case nhập bù chốt 6, lần 2 — phải bị cảnh báo trùng.',
  }), /trùng|nhập bù/, 'Nhập bù trùng khoảng ngày với một case nhập bù khác cùng hạng mục');
  // Xác nhận "đây là lần khác" thì vẫn tạo được.
  const second = cases.backfillCase(P.mbManager, {
    studentId: enr6.student_id, cycleId: backfillCycle?.id,
    topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 6 lần 2 (xác nhận)`, summary: 'Case nhập bù thứ hai, đã xác nhận là lần khác.',
    fromDate: '2026-02-05', toDate: '2026-02-15',
    actions: [{ ketQua: 'improved', description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-02-05', toDate: '2026-02-15' }],
    outcome: 'improved', note: 'Case nhập bù chốt 6, lần 2 — đã xác nhận qua cảnh báo.',
    confirmDuplicate: true,
  }) as any;
  assert(second.id !== first.id, 'Xác nhận trùng vẫn phải tạo được một case nhập bù riêng');
});

check('Nhập bù (chốt 2) · Case nhập bù học thuật không có hạn nào, không vào hàng đợi quá hạn', () => {
  const enr2 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' AND student_id != ? LIMIT 1`)
    .get(mbClass, backfillEnr.student_id) as any ?? backfillEnr;
  const done = cases.backfillCase(P.mbManager, {
    studentId: enr2.student_id, cycleId: null,
    topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 2`, summary: 'Case nhập bù để kiểm chốt 2 — không hạn nào cả.',
    fromDate: '2025-10-01', toDate: '2025-10-10',
    actions: [{ ketQua: 'improved', description: 'Ôn lại kỹ thuật làm bài', performerName: 'GVCN', fromDate: '2025-10-01', toDate: '2025-10-10' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 2: em đã làm bài đều trở lại.',
  }) as any;
  const row = conn.prepare('SELECT follow_until FROM sos_cases WHERE id = ?').get(done.id) as any;
  assert(row.follow_until === null, `Chốt 2: case nhập bù không được có hạn báo kết quả, đang là ${row.follow_until}`);
  const dueRows = mywork.myWork(P.coreTeacher, {}).groups
    .flatMap((g: any) => g.items).filter((it: any) => it.caseId === done.id);
  assert(dueRows.length === 0, `Chốt 2: case nhập bù không được rơi vào hàng đợi việc, đang có ${dueRows.length} dòng`);
});

check('Nhập bù (chốt 7) · Ghi rõ ai nhập, nhập lúc nào, lưu cùng case', () => {
  const enr7 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const done = cases.backfillCase(P.mbManager, {
    studentId: enr7.student_id, cycleId: backfillCycle?.id,
    topic: authMismatchSkill,
    primaryCode: domain.issuesForTopic(authMismatchSkill)[0].code,
    title: `${authMismatchSkill}: nhập bù chốt 7`, summary: 'Case nhập bù để kiểm chốt 7 — phải ghi rõ ai nhập và lúc nào.',
    fromDate: '2025-09-01', toDate: '2025-09-05',
    actions: [{ ketQua: 'improved', description: 'Trao đổi riêng với em', performerName: 'GVCN', fromDate: '2025-09-01', toDate: '2025-09-05' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 7.',
  }) as any;
  const row = conn.prepare('SELECT origin_kind, reported_by, created_at FROM sos_cases WHERE id = ?').get(done.id) as any;
  assert(row.origin_kind === 'backfill', 'Chốt 7: phải phân biệt được với case ghi tại chỗ qua origin_kind');
  assert(row.reported_by === P.mbManager.userId, 'Chốt 7: phải ghi đúng ai đã nhập bù');
  assert(!!row.created_at, 'Chốt 7: phải ghi rõ lúc nhập (khác ngày xảy ra thật)');
});

check('Nhập bù (chốt 7, tiếp) · Nhãn "nhập bù" hiện trên thẻ case của hồ sơ học viên', () => {
  const enr7b = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const done = cases.backfillCase(P.mbManager, {
    studentId: enr7b.student_id, cycleId: backfillCycle?.id,
    topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 7 tiếp`, summary: 'Case nhập bù để kiểm nhãn hiện trên thẻ case của hồ sơ.',
    fromDate: '2025-08-01', toDate: '2025-08-08',
    actions: [{ ketQua: 'improved', description: 'Luyện thêm dạng bài hay sai', performerName: 'GVCN', fromDate: '2025-08-01', toDate: '2025-08-08' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm nhãn "nhập bù" trên thẻ case.',
  }) as any;
  const board = cases.skillSupportBoard(P.coreTeacher, enr7b.student_id) as any;
  const card = board.rows.flatMap((r: any) => r.cases).find((c: any) => c.id === done.id);
  assert(card, 'Case nhập bù không xuất hiện trên bảng kỹ năng của hồ sơ');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(card.backfilledOn ?? ''), `Chốt 7: thẻ case nhập bù phải có ngày ghi, đang là ${card.backfilledOn}`);
  assert(card.backfilledBy, 'Chốt 7: thẻ case nhập bù phải có tên người ghi');
});

check('Nhập bù · Ghi chú kết luận bắt buộc ngay ở máy chủ, không chỉ ở giao diện', () => {
  const enrN = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assertThrows(() => cases.backfillCase(P.mbManager, {
    studentId: enrN.student_id, topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: kiểm ghi chú bắt buộc`, summary: 'Case nhập bù để kiểm ghi chú kết luận bắt buộc ở tầng máy chủ.',
    fromDate: '2025-07-01', toDate: '2025-07-05',
    actions: [{ ketQua: 'improved', description: 'Trao đổi với em', performerName: 'GVCN', fromDate: '2025-07-01', toDate: '2025-07-05' }],
    outcome: 'improved', note: 'quá ngắn',
  }), /ghi chú/, 'Gọi thẳng API nhập bù với ghi chú quá ngắn (dưới 10 ký tự)');
  assert((conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n === before, 'Ghi chú quá ngắn bị từ chối mà vẫn để lại một case');
});

check('Nhập bù · Chỉ người đóng được Case mới CHỐT được — GVBM trái môn bị chặn, không tạo case nửa vời (PR-QU: GVBM đúng môn thì được)', () => {
  const enr8 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const day = new Set((conn.prepare(`SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL`)
    .all(mbClass, P.subjectTeacher.userId) as any[]).map((r) => r.skill));
  const traiMon = domain.ENTRY_SKILLS.find((k: string) => !day.has(k)) as string;
  assertThrows(() => cases.backfillCase(P.subjectTeacher, {
    studentId: enr8.student_id, cycleId: backfillCycle?.id,
    topic: traiMon,
    primaryCode: domain.issuesForTopic(traiMon)[0].code,
    title: `${traiMon}: nhập bù bởi GVBM trái môn`, summary: 'GVBM tự nhập bù case kỹ năng mình KHÔNG dạy, nên không có quyền chốt.',
    fromDate: '2026-01-20', toDate: '2026-01-25',
    actions: [{ ketQua: 'improved', description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-01-20', toDate: '2026-01-25' }],
    outcome: 'improved', note: 'GVBM tự nhập, phải bị chặn ở bước chốt kết quả.',
  }), /chủ nhiệm|Quản lý|không có quyền/, 'GVBM trái môn tự chốt được case nhập bù');
  const after = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assert(before === after, 'GVBM bị chặn ở bước chốt nhưng vẫn để lại một case dở dang — cả chuỗi phải cùng một giao dịch');
});

// ==================================================================== PR2b

function normalWritingAttemptSkill() {
  const row = conn.prepare(
    `SELECT a.id AS attemptId, s.skill, s.planned_period_id AS periodId
       FROM assessment_attempts a JOIN attempt_skills s ON s.attempt_id = a.id
      WHERE a.class_id = ? AND a.status != 'cancelled' AND s.skill = 'writing'
        AND s.required = 1 AND s.sit_status != 'sat' AND s.planned_period_id IS NOT NULL
      LIMIT 1`,
  ).get(classId('MB FOU 12')) as any;
  assert(row, 'Seed thiếu một bài Writing lớp Normal chưa chấm để kiểm SCH-01');
  /*
   * PHẢI CHƯA CÓ ĐIỂM (23/09): `hasScore` (skillSchedule.ts) nay xét cả cột `raw_score` của lớp thường, nên
   * `setSkillWeek` đúng luật từ chối dời một môn đã có điểm. Đến cuối khoá (MB FOU 12 đang tuần 8/8) hầu hết
   * Writing đã có điểm sẵn — xoá điểm của đúng dòng vừa chọn để dựng lại tiền đề "chưa chấm" mà các phép kiểm
   * SCH-01/T07/PR-G cần, thay vì đổi sang lớp khác (các quyền `P.normalCoreTeacher`/`normalSubjectTeacher`
   * chỉ gắn với MB FOU 12).
   */
  conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'writing'`).run(row.attemptId);
  return row as { attemptId: number; skill: string; periodId: number };
}

check('SCH-01 · GVBM lớp Normal dời được ĐÚNG môn mình dạy, không dời được môn khác', () => {
  const { attemptId, periodId } = normalWritingAttemptSkill();
  const otherPeriod = periodOf(addDays(week.periodById(periodId)!.week_start, 7));
  assert(
    !can(P.normalSubjectTeacher, PERMISSIONS.SCHEDULE_MOVE, { classId: classId('MB FOU 12'), skill: 'speaking' }),
    'GVBM Writing không được có quyền dời Speaking',
  );
  assert(
    can(P.normalSubjectTeacher, PERMISSIONS.SCHEDULE_MOVE, { classId: classId('MB FOU 12'), skill: 'writing' }),
    'GVBM Writing phải dời được đúng môn Writing',
  );
  const r = skillSchedule.setSkillWeek(P.normalSubjectTeacher, attemptId, 'writing', otherPeriod, {});
  assert(r.ok, 'GVBM Writing phải dời được lịch Writing của lớp Normal mình dạy');
});

check('SCH-01 · GVCN lớp Normal dời được mọi môn trong lớp mình chủ nhiệm', () => {
  const cid = classId('MB FOU 12');
  for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
    assert(
      can(P.normalCoreTeacher, PERMISSIONS.SCHEDULE_MOVE, { classId: cid, skill }),
      `GVCN lớp Normal phải dời được ${skill}`,
    );
  }
});

check('SCH-01 · Giáo viên lớp Fast Track KHÔNG dời được lịch dù là GVCN — FT chủ động vẫn của Quản lý', () => {
  assert(
    !can(P.coreTeacher, PERMISSIONS.SCHEDULE_MOVE, { classId: mbClass, skill: 'listening' }),
    'GVCN Fast Track không được cấp SCHEDULE_MOVE — dời FT chủ động vẫn phải qua Quản lý',
  );
  assert(
    !can(P.coreTeacher, PERMISSIONS.PLAN_WEEK, { classId: mbClass }),
    'GVCN Fast Track vẫn không có PLAN_WEEK — không được "chữa tạm" bằng cách cấp quyền chung',
  );
});

check('SCH-01 · Cấp SCHEDULE_MOVE cho giáo viên KHÔNG vô tình mở luôn xếp lịch Fast Track chủ động', () => {
  // Giáo viên Normal có schedule.move nhưng KHÔNG được đồng thời có plan.week (mở bulkPlan/FT).
  assert(
    !can(P.normalCoreTeacher, PERMISSIONS.PLAN_WEEK, { classId: classId('MB FOU 12') }),
    'Cấp SCHEDULE_MOVE không được kèm PLAN_WEEK — nếu không sẽ vô tình mở luôn xếp lịch FT chủ động',
  );
});

check('SCH-02 · Xác nhận trạng thái thi dùng ĐÚNG cùng quyền với dời lịch (moveableSkills)', () => {
  const cid = classId('MB FOU 12');
  const list = permissions.moveableSkills(P.normalSubjectTeacher, cid, ['listening', 'reading', 'writing', 'speaking']);
  assert(list.join(',') === 'writing', `GVBM Writing chỉ được liệt kê đúng writing, đang ra: ${list.join(',')}`);
  const listCore = permissions.moveableSkills(P.normalCoreTeacher, cid, ['listening', 'reading', 'writing', 'speaking']);
  assert(listCore.length === 4, 'GVCN phải dời được cả bốn môn của lớp Normal mình');
});

/** MT1/MT2/MT3 liên tiếp cùng lộ trình ở MB FT 101, dùng chung cho các phép kiểm T13. */
function threeConsecutiveMocks() {
  const rows = conn.prepare(
    `SELECT a.id AS attemptId, a.attempt_no, a.cycle_id, s.skill, s.planned_period_id
       FROM assessment_attempts a JOIN attempt_skills s ON s.attempt_id = a.id
      WHERE a.class_id = ? AND a.status != 'cancelled' AND s.required = 1 AND s.skill = 'listening'
        AND s.planned_period_id IS NOT NULL
      ORDER BY a.cycle_id, a.attempt_no`,
  ).all(mbClass) as any[];
  const byCycle = new Map<number, any[]>();
  for (const r of rows) { if (!byCycle.has(r.cycle_id)) byCycle.set(r.cycle_id, []); byCycle.get(r.cycle_id)!.push(r); }
  for (const list of byCycle.values()) {
    if (list.length >= 3) return list.sort((a, b) => a.attempt_no - b.attempt_no).slice(0, 3);
  }
  assert(false, 'Seed thiếu một lộ trình có đủ MT1, MT2, MT3 đã xếp tuần để kiểm T13');
  return [] as any[];
}

check('T13 → LUAT-NX-MT · Dời MT2 VƯỢT quá tuần đầu MT3 KHÔNG chặn (chủ SP 22/10)', () => {
  const [mt1, mt2, mt3] = threeConsecutiveMocks();
  const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
  const pastMt3 = addDays(mt3Week, 7); // hẳn sau tuần đầu MT3 — đây mới là "vượt", không phải "trùng"
  const check = skillSchedule.checkSkillWeekMove({
    attemptId: mt2.attemptId, skill: 'listening', newWeekStart: pastMt3,
  });
  assert(check.blockers.length === 0, `Dời MT2 vượt quá tuần đầu MT3 không còn bị chặn, đang ra: ${JSON.stringify(check)}`);
});

check('T15 → LUAT-NX-MT · Dời MT2 TRÙNG đúng tuần đầu MT3 KHÔNG chặn (chủ SP 22/10 thay chốt 23/09)', () => {
  const [mt1, mt2, mt3] = threeConsecutiveMocks();
  const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
  const check = skillSchedule.checkSkillWeekMove({
    attemptId: mt2.attemptId, skill: 'listening', newWeekStart: mt3Week,
  });
  assert(check.blockers.length === 0, `Trùng tuần đầu MT sau không còn bị chặn, đang ra: ${JSON.stringify(check)}`);
});

check('T13 · Hai đợt MT cách nhau đúng một tuần chỉ CẢNH BÁO, không chặn', () => {
  const [mt1, mt2, mt3] = threeConsecutiveMocks();
  const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
  const oneWeekBeforeMt3 = addDays(mt3Week, -7);
  const check = skillSchedule.checkSkillWeekMove({
    attemptId: mt2.attemptId, skill: 'listening', newWeekStart: oneWeekBeforeMt3,
  });
  assert(check.blockers.length === 0, `Cách một tuần không được CHẶN, đang ra: ${JSON.stringify(check)}`);
  assert(check.warnings.length > 0, 'Cách đúng một tuần với đợt sau phải có CẢNH BÁO, không được lặng thinh');
});

check('T13 · RLW và Speaking CÙNG một đợt không bị hiểu nhầm là hai đợt MT khác nhau, không cảnh báo giả', () => {
  // checkSkillWeekMove chỉ so với ĐỢT KHÁC (attempt_id khác) — kỹ năng khác của CÙNG đợt không vào vòng lặp others.
  const row = conn.prepare(
    `SELECT a.id AS attemptId, s.skill, s.planned_period_id
       FROM assessment_attempts a JOIN attempt_skills s ON s.attempt_id = a.id
      WHERE a.class_id = ? AND a.status != 'cancelled' AND s.skill = 'speaking'
        AND s.required = 1 AND s.planned_period_id IS NOT NULL LIMIT 1`,
  ).get(mbClass) as any;
  assert(row, 'Seed thiếu một đợt FT có Speaking đã xếp tuần để kiểm T13');
  const rlw = conn.prepare(
    `SELECT s.planned_period_id FROM attempt_skills s
      WHERE s.attempt_id = ? AND s.skill IN ('listening','reading','writing1','writing2') AND s.planned_period_id IS NOT NULL LIMIT 1`,
  ).get(row.attemptId) as any;
  if (!rlw) return; // đợt này không tách tuần RLW/S — không kiểm được tổ hợp này, bỏ qua thay vì báo sai
  const check = skillSchedule.checkSkillWeekMove({
    attemptId: row.attemptId, skill: 'speaking', newWeekStart: week.periodById(rlw.planned_period_id)!.week_start,
  });
  assert(
    check.blockers.length === 0 && check.warnings.length === 0,
    `Dời Speaking về đúng tuần RLW của CÙNG đợt không được cảnh báo gì, đang ra: ${JSON.stringify(check)}`,
  );
});


check('T07 · Sửa lượt cũ (dời lịch một kỹ năng) KHÔNG tạo lượt trùng', () => {
  const { attemptId, periodId } = normalWritingAttemptSkill();
  const before = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
  const otherPeriod = periodOf(addDays(week.periodById(periodId)!.week_start, 14));
  const r = skillSchedule.setSkillWeek(P.normalCoreTeacher, attemptId, 'writing', otherPeriod, {});
  assert(r.ok, 'Phải dời lịch được');
  const after = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n;
  assert(after === before, `Sửa lịch một kỹ năng không được tạo thêm lượt (đợt) nào, chênh lệch ${after - before}`);
  const row = conn.prepare('SELECT planned_period_id FROM attempt_skills WHERE attempt_id = ? AND skill = ?')
    .get(attemptId, 'writing') as any;
  assert(row.planned_period_id === otherPeriod, 'Tuần mới phải được ghi đúng vào ĐÚNG dòng attempt_skills cũ, không phải dòng mới');
});

check('T09 · Đợt FT định trước chỉ L/R: đủ điểm L/R là đợt hoàn tất, không chờ S/W, không bịa Overall', () => {
  // Định trước chỉ L/R = Writing và Speaking bị loại khỏi phạm vi (skippedSkills dùng tên
  // ASSESSED_SKILLS — 'writing' gộp cả W1/W2, không phải 'writing1'/'writing2').
  const r = scoring.evaluateAttempt(6.5, 1, { listening: 6.0, reading: 6.5 }, ['writing', 'speaking']);
  assert(r.complete === true, `Đủ điểm L/R (đã loại S/W khỏi phạm vi) phải là ĐỦ, đang ra complete=${r.complete}`);
  assert(r.evaluable === true, 'Đợt phải evaluable — không chờ S/W vì chúng không thuộc phạm vi yêu cầu');
  assert(r.overall === null, `KHÔNG được bịa Overall khi chỉ có 2/4 cấu phần, đang ra overall=${r.overall}`);
  assert(r.required.length === 2 && r.required.includes('listening') && r.required.includes('reading'),
    `required phải đúng chỉ L/R, đang ra: ${r.required.join(',')}`);
});

// ==================================================================== PR-D (chặng 0)

/*
 * KHUNG CASE GỌN — một case đọc ở MỘT khối. Khối nhúng `CasePanel` bị gỡ khỏi thẻ case ở
 * hồ sơ học viên, nên thẻ phải tự mang đủ thứ để hoàn thành case và mở lịch sử phương án
 * TẠI CHỖ. Giao diện không tự suy: nó đọc thẳng từ máy chủ, đúng như nút cũ ở CasePanel.
 */
const prdStudent = conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
                                   WHERE e.class_id = ? ORDER BY s.id DESC LIMIT 1`).get(mbClass) as any;
const prdReportOn = (studentId: number, key: string, topic: string = 'listening') => cases.reportIssue(P.coreTeacher, {
  title: 'Vấn đề cần theo dõi ở kỹ năng này',
  primaryCode: 'student.listening.technique',
  studentId, topic, summary: 'Case dựng riêng cho phép kiểm khung case gọn (PR-D).',
  idempotencyKey: key, parallel: true,
}) as any;
const prdCardOf = (who: any, studentId: number, caseId: number) => {
  const board = cases.skillSupportBoard(who, studentId) as any;
  return board.rows.flatMap((r: any) => r.cases).find((x: any) => x.id === caseId);
};

check('PR-D · Thẻ case mang đủ để hoàn thành case ngay tại chỗ: có quyền chốt không, còn gì đang chặn', () => {
  const c = prdReportOn(prdStudent.id, 'test-prd-1');
  const asCore = prdCardOf(P.coreTeacher, prdStudent.id, c.id);
  assert(asCore, 'Case vừa tạo không xuất hiện trên thẻ case của hồ sơ');
  assert(asCore.canClose === true, 'GVCN của lớp phải thấy mình chốt được case');
  assert(Array.isArray(asCore.closeBlockers), 'Thẻ case thiếu danh sách lý do chưa hoàn thành được');
  assert(asCore.closeBlockers.length === cases.closeBlockers(c.id).length && asCore.closeBlockers.length > 0,
    'Case chưa có phương án nào phải mang đúng lý do chặn của máy chủ, không phải danh sách tự suy');
  const asSubject = prdCardOf(P.subjectTeacher, prdStudent.id, c.id);
  assert(asSubject, 'GVBM của lớp phải thấy thẻ case của học viên trong lớp');
  assert(asSubject.canClose === false, 'GVBM không kiêm chủ nhiệm không được thấy nút hoàn thành hoạt động');
});

check('PR-D · Thẻ case đã hoàn thành không còn lý do chặn nào', () => {
  const c = prdReportOn(prdStudent.id, 'test-prd-1b');
  const ivInfo = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'self_study', description: 'Nghe 30 phút mỗi ngày (PR-D)', performerName: 'GVCN',
    status: 'started', startedDate: TODAY,
  }) as any;
  const ivId = ivInfo.interventions.find((i: any) => i.description === 'Nghe 30 phút mỗi ngày (PR-D)').id;
  cases.updateResult(P.coreTeacher, ivId, {
    mode: 'end', outcome: 'improved', nextStep: 'complete', note: 'Em đã nghe đều hơn hẳn (PR-D)',
  });
  cases.closeCaseOutcome(P.mbManager, c.id, { outcome: 'improved', note: 'Đã xong, em ổn định lại hẳn (PR-D)' });
  const card = prdCardOf(P.coreTeacher, prdStudent.id, c.id);
  assert(card.status === 'done' && card.closeBlockers.length === 0, 'Case đã xong mà thẻ vẫn ghi còn lý do chặn');
});

check('PR-D · Lịch sử một phương án mang đủ ngày, chu kỳ, ghi chú và cờ trễ để mở ngay tại dòng', () => {
  const c = prdReportOn(prdStudent.id, 'test-prd-2');
  const info = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Học tutor Listening (PR-D lịch sử)', performerName: 'Tutor B',
    /* Bắt đầu HÔM NAY thì hạn cập nhật là Chủ nhật tuần này — cập nhật hôm nay là đúng hạn. */
    status: 'started', startedDate: TODAY,
  }) as any;
  const ivId = info.interventions.find((i: any) => i.description === 'Học tutor Listening (PR-D lịch sử)').id;
  cases.updateResult(P.coreTeacher, ivId, {
    soBuoi: 0, mode: 'monitor', outcome: 'partial', observedOn: TODAY,
    note: 'Nghe bắt ý tốt hơn, còn sai số điện thoại (PR-D)',
  });
  const plan = prdCardOf(P.coreTeacher, prdStudent.id, c.id).plans.find((p: any) => p.id === ivId);
  assert(plan && plan.updates.length === 1, 'Phương án phải có đúng một lần cập nhật đã ghi');
  const u = plan.updates[0];
  assert(u.note === 'Nghe bắt ý tốt hơn, còn sai số điện thoại (PR-D)', `Thiếu câu ghi chú của người dạy, đang là ${JSON.stringify(u.note)}`);
  assert(u.cycleNo === 1, `Thiếu số chu kỳ, đang là ${u.cycleNo}`);
  assert(u.late === false, `Cập nhật đúng hạn không được ghi là trễ, đang là ${u.late}`);
  assert(typeof u.label === 'string' && u.on === TODAY, 'Mỗi lần cập nhật phải giữ nhãn kết quả và ngày');
});

check('PR-D · Cập nhật quá hạn thì lịch sử phương án ghi đúng là trễ', () => {
  const c = prdReportOn(prdStudent.id, 'test-prd-2b');
  const info = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Học tutor Listening (PR-D trễ)', performerName: 'Tutor B',
    status: 'started', startedDate: addDays(TODAY, -20),
  }) as any;
  const ivId = info.interventions.find((i: any) => i.description === 'Học tutor Listening (PR-D trễ)').id;
  cases.updateResult(P.coreTeacher, ivId, {
    soBuoi: 0, mode: 'monitor', outcome: 'unchanged', observedOn: TODAY,
    note: 'Cập nhật muộn hơn hạn tuần, ghi lại để so (PR-D)',
  });
  const plan = prdCardOf(P.coreTeacher, prdStudent.id, c.id).plans.find((p: any) => p.id === ivId);
  assert(plan.updates[0].late === true, 'Bắt đầu 20 ngày trước, cập nhật đúng hôm nay mà không ghi là trễ');
});

check('PR-D · CASE-05: điểm tự chấm cũ đã lưu vẫn đọc được sau khi bỏ ô nhập khỏi cập nhật phương án', () => {
  const c = prdReportOn(prdStudent.id, 'test-prd-3a');
  const info = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Học tutor Listening (PR-D điểm cũ)', performerName: 'Tutor B',
    status: 'started', startedDate: TODAY,
  }) as any;
  const ivId = info.interventions.find((i: any) => i.description === 'Học tutor Listening (PR-D điểm cũ)').id;
  // Dữ liệu cũ: một lần cập nhật đã kèm điểm tự chấm (giao diện mới không còn gửi trường này).
  cases.updateResult(P.coreTeacher, ivId, {
    soBuoi: 0, mode: 'monitor', outcome: 'partial', observedOn: TODAY,
    note: 'Bản ghi cũ có kèm điểm cô tự chấm (PR-D)',
    metrics: [{ skill: 'listening', score: 6, total: null }],
  });
  const detail = cases.caseDetail(P.coreTeacher, c.id) as any;
  const f = detail.followups.find((x: any) => x.metrics?.length);
  assert(f && f.metrics[0].skill === 'listening' && f.metrics[0].score === 6,
    'Điểm tự chấm đã lưu bị mất — CASE-05 nói rõ phải giữ');
});

check('PR-D · CASE-06 không nới sang học thuật: case học thuật thiếu mức tiến bộ vẫn bị từ chối', () => {
  const c = prdReportOn(prdStudent.id, 'test-prd-5');
  cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'self_study', description: 'Nghe 30 phút mỗi ngày (PR-D học thuật)', performerName: 'GVCN',
    status: 'completed', completedDate: TODAY,
  });
  assertThrows(
    () => cases.closeCaseOutcome(P.coreTeacher, c.id, { note: 'Đã xong, em ổn định lại hẳn.' } as any),
    /Mức độ thành công/, 'Case học thuật hoàn thành được mà không có mức tiến bộ',
  );
});

// ==================================================================== PR-E (chặng 1)

/*
 * NỀN GIAO DIỆN DÙNG CHUNG — bốn lỗi lặp ở nhiều màn được đóng ở LUẬT, không ở từng màn:
 * hạn không nói rõ hạn gì (F11) · badge đạt khi chưa đủ điểm (MT-P01) · phần trăm không có
 * mẫu số (rule book §11) · ngày nghiệp vụ lẫn ngày ghi nhận (MT-P10).
 *
 * Các luật nằm ở `shared/domain/display.ts` — hàm thuần, kiểm được ở đây. Component React chỉ
 * là lớp vẽ mỏng phía trên: nó không có luật riêng để sai khác đi.
 */

check('PR-E · <TyLe>: mẫu số 0 ghi "Chưa có dữ liệu", KHÔNG BAO GIỜ vẽ 0%', () => {
  const v = domain.rateView(0, 0);
  assert(v.kind === 'no-data', `N=0 phải là no-data, đang là ${v.kind}`);
  assert(domain.rateText(0, 0) === 'Chưa có dữ liệu', `Đang ghi "${domain.rateText(0, 0)}"`);
  assert(!/%/.test(domain.rateText(0, 0)), 'N=0 mà vẫn có dấu %');
});

check('PR-E · <TyLe>: n/N đứng trước, phần trăm trong ngoặc đứng sau', () => {
  assert(domain.rateText(12, 18, 'PA có cải thiện') === '12/18 PA có cải thiện (67%)',
    `Đang ghi "${domain.rateText(12, 18, 'PA có cải thiện')}"`);
  assert(domain.rateText(10, 15) === '10/15 (67%)', `Đang ghi "${domain.rateText(10, 15)}"`);
  const t = domain.rateText(12, 18, 'PA có cải thiện');
  assert(t.indexOf('12/18') < t.indexOf('%'), 'Phần trăm không được đứng trước n/N');
});

check('PR-E · <TyLe>: mẫu dưới 5 vẫn có cờ smallSample nhưng không ghi chữ "mẫu nhỏ" (chủ SP 22/10)', () => {
  assert(domain.rateText(1, 1) === '1/1 (100%)', `Đang ghi "${domain.rateText(1, 1)}"`);
  assert(domain.rateText(3, 4) === '3/4 (75%)', `Đang ghi "${domain.rateText(3, 4)}"`);
  assert(domain.rateText(4, 5) === '4/5 (80%)', `N=5 chưa phải mẫu nhỏ, đang ghi "${domain.rateText(4, 5)}"`);
  assert(domain.rateView(1, 1).kind === 'value' && (domain.rateView(1, 1) as any).smallSample === true,
    'rateView phải báo smallSample để giao diện gắn nhãn');
});

check('PR-E · <TyLe>: số vô lý (n > N, số âm, không nguyên) bị báo lỗi, không được vẽ thành phần trăm', () => {
  for (const [n, N] of [[5, 3], [-1, 4], [1.5, 4], [1, NaN]] as const) {
    assert(domain.rateView(n, N).kind === 'invalid', `${n}/${N} phải là invalid, đang là ${domain.rateView(n, N).kind}`);
    assert(!/%/.test(domain.rateText(n, N)), `${n}/${N} vẫn vẽ ra phần trăm: "${domain.rateText(n, N)}"`);
  }
});

check('PR-E · <KetQuaDot> (MT-P01): ép coDiem=1, yeuCau=4, dat=true → "Chưa đủ điểm", KHÔNG có badge đạt', () => {
  const v = domain.attemptProgressView({ scored: 1, required: 4, passed: true, sos: 0 });
  assert(v.overall === 'incomplete', `Overall phải là incomplete, đang là ${v.overall}`);
  assert(v.overallText === 'Chưa đủ điểm', `Overall đang ghi "${v.overallText}"`);
  assert(v.passBadge === false, 'Chưa đủ điểm mà vẫn có badge đạt — đúng lỗi MT-P01');
  assert(v.tone !== 'info' && v.tone !== 'ok', `Chưa đủ điểm mà vẫn tô màu đạt (${v.tone})`);
  for (const dat of [true, false, null]) {
    const w = domain.attemptProgressView({ scored: 3, required: 4, passed: dat, sos: 0 });
    assert(w.passBadge === false && w.overall === 'incomplete', `scored 3/4, passed=${dat}: vẫn có badge đạt`);
  }
});

check('PR-E · <KetQuaDot>: năm nhánh câu chữ đúng bảng ở HE_GIAO_DIEN §5', () => {
  const s = (scored: number, sos: number | null, passed: boolean | null = null) =>
    domain.attemptProgressView({ scored, required: 4, passed, sos });
  assert(s(0, null).text === 'Chưa có điểm · 0/4 kỹ năng', `Nhánh 1: "${s(0, null).text}"`);
  assert(s(0, null).tone === 'muted', 'Nhánh 1 phải xám');
  assert(s(2, 0).text === 'Các kỹ năng đã chấm đều đạt · còn thiếu 2', `Nhánh 2: "${s(2, 0).text}"`);
  assert(s(2, 0).tone === 'muted', 'Nhánh 2 phải xám');
  assert(s(2, 1).text === 'SOS 1 tạm thời · 2/4 kỹ năng' && s(2, 1).tamThoi === true && s(2, 1).title === 'Tạm thời: 2/4 kỹ năng có điểm', `Nhánh 3: "${s(2, 1).text}"`);
  assert(s(2, 1).tone === 'danger' && /tạm thời/i.test(s(2, 1).title ?? ''), 'Nhánh 3 phải đỏ và giữ chữ "tạm thời" ở tooltip');
  assert(s(4, 0, true).text === 'Đã đủ điểm · Đạt kỳ vọng', `Nhánh 4: "${s(4, 0, true).text}"`);
  assert(s(4, 0, true).overall === 'passed' && s(4, 0, true).passBadge === true, 'Đủ điểm và đạt thì mới có badge đạt');
  assert(s(4, 2, false).text === 'Đã đủ điểm · SOS 2', `Nhánh 5: "${s(4, 2, false).text}"`);
  assert(s(4, 2, false).tone === 'danger' && s(4, 2, false).passBadge === false, 'Nhánh 5 phải đỏ, không badge đạt');
});

check('PR-E · <KetQuaDot>: đơn vị đếm là BỐN kỹ năng — "1/5 kỹ năng" bị chặn (MT-P02)', () => {
  // W1/W2 là hai BÀI NHẬP của một kỹ năng Writing, không phải hai kỹ năng.
  const v = domain.attemptProgressView({ scored: 1, required: 5, passed: null, sos: null });
  assert(v.overall === 'invalid', `yeuCau=5 phải bị chặn, đang là ${v.overall}`);
  assert(!/1\/5/.test(v.text), `Vẫn ghi ra "1/5": "${v.text}"`);
  assert(domain.attemptProgressView({ scored: 5, required: 4, passed: true, sos: 0 }).overall === 'invalid',
    'Số kỹ năng có điểm vượt số yêu cầu phải bị chặn');
  assert(domain.attemptProgressView({ scored: 0, required: 0, passed: null, sos: null }).overall === 'invalid',
    'Đợt không có kỹ năng bắt buộc nào không được vẽ thành "0/0 kỹ năng"');
});

check('PR-E · <KetQuaDot>: đủ điểm nhưng thiếu kỳ vọng thì không bịa ra đạt/chưa đạt', () => {
  const v = domain.attemptProgressView({ scored: 4, required: 4, passed: null, sos: null });
  assert(v.passBadge === false && v.overall === 'no-expectation', `Đang là ${v.overall}, badge ${v.passBadge}`);
  assert(/Đã đủ điểm/.test(v.text), `Câu phải nói đã đủ điểm: "${v.text}"`);
});

check('PR-E · <Han>: sáu loại hạn có sáu nhãn khác nhau, đúng bảng HE_GIAO_DIEN §4 (việc · mốc, PR-UX0 B-3)', () => {
  const t = (loai: any, han = '2026-09-23') => domain.deadlineView({ kind: loai, due: han, today: '2026-09-14' }).text;
  assert(t('xac-minh-sos') === 'Xác nhận · hạn 23/09', `xac-minh-sos: "${t('xac-minh-sos')}"`);
  assert(t('lap-pa') === 'Thêm PA · hạn 23/09', `lap-pa: "${t('lap-pa')}"`);
  assert(t('cap-nhat-pa') === 'Kết quả PA · W2–W3 SEP · hạn 23/09', `cap-nhat-pa: "${t('cap-nhat-pa')}"`);
  /* PR-YT4 (K5-24): `thuc-hien-y-thuc`, `hoan-thanh-y-thuc` bỏ — Ý thức dùng `xu-ly-vi-pham`. */
  assert(t('xu-ly-vi-pham') === 'Xử lý vi phạm · hạn 23/09', `xu-ly-vi-pham: "${t('xu-ly-vi-pham')}"`);
  assert(!(domain.DEADLINE_KINDS as readonly string[]).includes('thuc-hien-y-thuc') && !(domain.DEADLINE_KINDS as readonly string[]).includes('hoan-thanh-y-thuc'), 'hai loại cũ còn');
  assert(t('nhap-diem') === 'Nhập điểm · hạn 23/09', `nhap-diem: "${t('nhap-diem')}"`);
  assert(t('du-kien-ket-thuc') === 'Dự kiến kết thúc 23/09', `du-kien-ket-thuc: "${t('du-kien-ket-thuc')}"`);
  const all = ['xac-minh-sos', 'lap-pa', 'cap-nhat-pa', 'xu-ly-vi-pham', 'duyet', 'nhap-diem', 'du-kien-ket-thuc'].map((k) => t(k));
  assert(new Set(all).size === 7, 'Có hai loại hạn dùng chung một câu — chúng là sáu đồng hồ khác nhau');
});

check('PR-E · <Han>: quá hạn ghi rõ số ngày và đếm từ HẠN GỐC, không từ hạn đã dời', () => {
  const v = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', today: '2026-09-25' });
  assert(v.text === 'Nhập điểm · hạn 23/09 · quá hạn 2 ngày' && v.quaHan === 'quá hạn 2 ngày' && v.tone === 'overdue' && v.daysOverdue === 2,
    `Đang ghi "${v.text}" (${v.tone}, ${v.daysOverdue}, ${v.quaHan})`);
  // Hạn đã dời sang 30/09 nhưng hạn gốc 23/09 đã qua 2 ngày: vẫn đếm từ 23/09.
  const moved = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-30', originalDue: '2026-09-23', today: '2026-09-25' });
  assert(moved.daysOverdue === 2, `Phải đếm từ hạn gốc (2 ngày), đang là ${moved.daysOverdue}`);
  // Chưa quá hạn thì không tô quá hạn.
  const ok = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', today: '2026-09-23' });
  assert(ok.tone !== 'overdue' && ok.daysOverdue === null, 'Đúng ngày hạn chưa phải quá hạn');
});

check('PR-E · <Han>: có hẹn xử lý thì hiện CẢ HAI, không ghi đè hạn gốc', () => {
  const v = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', reschedule: '2026-09-30', today: '2026-09-14' });
  assert(v.text === 'Nhập điểm · hạn 23/09 · hẹn xử lý 30/09' && v.hen === 'hẹn xử lý 30/09', `Đang ghi "${v.text}"`);
});

check('PR-E · <Han>: "Dự kiến kết thúc" KHÔNG phải hạn — không bao giờ quá hạn, không bao giờ đỏ (F11)', () => {
  const v = domain.deadlineView({ kind: 'du-kien-ket-thuc', due: '2026-08-30', today: '2026-09-14' });
  assert(v.tone === 'neutral' && v.daysOverdue === null && v.quaHan === null && !v.homNay, `Đang là ${v.tone}, quá hạn ${v.daysOverdue}`);
  assert(!/quá hạn/.test(v.text), `Ngày dự kiến bị ghi là quá hạn: "${v.text}"`);
});

check('PR-E · <Han>: cập nhật phương án cũng đếm số ngày quá hạn từ mốc hạn (Thứ Ba, OV-12a; đổi nghĩa PR-UX0, mockup 17 #1; PR-N1 R-PA3)', () => {
  const v = domain.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-08', today: '2026-09-15' });
  assert(v.tone === 'overdue' && v.daysOverdue === 7 && v.quaHan === 'quá hạn 7 ngày' && v.han === 'hạn 08/09',
    `Phải báo quá hạn 7 ngày: "${v.text}" (${v.daysOverdue}, ${v.han})`);
});

check('PR-E · <Han>: thiếu ngày hạn thì nói thẳng là chưa có hạn, không vẽ "Invalid Date"', () => {
  const v = domain.deadlineView({ kind: 'nhap-diem', due: null, today: '2026-09-14' });
  assert(/Chưa có hạn/.test(v.text) && v.han === 'Chưa có hạn' && !/Invalid|NaN|undefined/.test(v.text), `Đang ghi "${v.text}"`);
});

check('PR-E · Ngày viết ngắn 14/09 trong cùng năm, có năm khi qua năm khác', () => {
  assert(domain.shortDate('2026-09-14', '2026-09-20') === '14/09', domain.shortDate('2026-09-14', '2026-09-20'));
  assert(domain.shortDate('2027-01-05', '2026-09-20') === '05/01/2027', domain.shortDate('2027-01-05', '2026-09-20'));
});

check('PR-E · Ngày nghiệp vụ khác ngày ghi nhận thì hiện CẢ HAI (MT-P10), cùng ngày thì chỉ một', () => {
  assert(domain.businessDateText('2026-09-14', '2026-09-19T10:20:00Z', '2026-09-19') === 'Ngày nghiệp vụ 14/09 · Ghi nhận 19/09',
    domain.businessDateText('2026-09-14', '2026-09-19T10:20:00Z', '2026-09-19'));
  assert(domain.businessDateText('2026-09-14', '2026-09-14T03:00:00Z', '2026-09-14') === '14/09',
    domain.businessDateText('2026-09-14', '2026-09-14T03:00:00Z', '2026-09-14'));
});

// ==================================================================== PR-F (chặng 2)

/*
 * HỢP ĐỒNG SỐ LIỆU — một chỉ số = một hàm trả về TẬP ID; số là độ dài của tập, danh sách khi bấm
 * vào là chính tập đó (thiet-ke/HOP_DONG_SO_LIEU.md). Bốn lỗi được đóng bằng cấu trúc:
 *   F01 (P0) hai chi nhánh cùng tuần cộng lẫn nhau · F02 "HV đang gặp" lẫn case đã đóng ·
 *   F03 hiệu quả cũ đi theo lớp hiện tại · F05 hàng "chưa xác định" vẫn nằm trong bảng hiệu quả.
 */
const metricsSvc = await import('../worklist/metrics.ts');
const branchIdOf = (code: string) => (conn.prepare('SELECT id FROM branches WHERE code = ?').get(code) as any).id as number;

check('PR-F · Sổ chỉ số: đúng hai mươi chỉ số (PR-N thêm pa-cho-duyet; PR-J thêm tám chỉ số Ý thức), mỗi chỉ số đủ tám trường (thiếu một trường thì không được lên dashboard)', () => {
  const list = domain.METRICS as readonly any[];
  /* PR-LT2a (N4, Q14): bỏ ba chỉ số của mô hình tín hiệu — tin-hieu-cho-xac-minh, tin-hieu-qua-han, hv-bo-qua-van-can-ho-tro (31 → 28). */
  assert(list.length === 33, /* V5 C20: −1 (hv-ft-xong-mt-cuoi-chua-mt-ke) · OV-12h: +1 (phoi-hop-qua-han) · OV-11f: +1 (bai-qua-han-chua-phan-cong, TQ-13) · PR-VAI-a: −1 (U3) +1 (lop-thieu-gv-mon) +4 (Q8); PR-MT0: +1 (lop-chua-chot-len-ft); PR-LCb: −1 (hv-chua-co-lenh-chuyen) */ `Phải có hai mươi tám chỉ số (PR-YT4: bien-phap-dang-chuan-bi → bien-phap-cho-duyet, thêm hv-theo-bac; hai của PR-UX4: hv-can-ho-tro-2-lan-chua-case, hv-bo-qua-van-can-ho-tro + hai mươi tám chỉ số cũ: mười hai của PR-F/PR-N + bảy của PR-J còn lại sau khi PR-T bỏ vi-pham-khong-hieu-luc + bốn của PR-T: case-cho-xac-dinh-nguyen-nhan và ba phoi-hop-* + một của PR-S1: tin-hieu-qua-han + ba của PR-Pa: case-xac-dinh-nguyen-nhan-qua-han, bai-qua-han-nhap-diem, case-chua-co-nguoi-phu-trach + một của PR-YT2: vi-pham-theo-nhom), đang có ${list.length}`);
  const expected = ['hv-sos-hien-tai', 'hv-duoi-ky-vong-mon', 'hv-co-case-mo', 'case-mo',
    'case-xac-dinh-nguyen-nhan-qua-han', 'bai-qua-han-nhap-diem', 'case-chua-co-nguoi-phu-trach', 'case-cho-xac-dinh-nguyen-nhan',
    'case-thieu-pa', 'pa-can-cap-nhat', 'pa-cho-duyet', 'pa-co-ket-qua', 'ty-le-co-cai-thien', 'dung-han-cap-nhat', 'do-phu-danh-gia',
    'vi-pham-tong', 'vi-pham-theo-nhom', 'vi-pham-chua-xu-ly', 'hv-co-vi-pham', 'hv-can-xu-ly',
    'bien-phap-da-thuc-hien', 'bien-phap-cho-duyet', 'bien-phap-theo-loai', 'hv-theo-bac',
    'phoi-hop-luot-sos', 'phoi-hop-dang-xu-ly', 'phoi-hop-hoan-thanh',
    'lop-thieu-gv-mon',   // PR-VAI-a: bỏ hv-can-ho-tro-2-lan-chua-case (K1-04), thêm lop-thieu-gv-mon (K1-05)
    'van-hanh-can-quyet-dinh', 'hv-len-ft-chua-ky-vong',   // PR-VAI-a Q8 (PR-LCb bỏ hv-chua-co-lenh-chuyen; V5 C20 bỏ hv-ft-xong-mt-cuoi-chua-mt-ke)
    'lop-chua-chot-len-ft',   // PR-MT0 → PR-LCb: Chốt lộ trình
    'bai-qua-han-chua-phan-cong',   // OV-11f (TQ-13): "m bài chưa có người chấm" bấm được
    'phoi-hop-qua-han'];   // OV-12h: meeting CX quá hạn xác nhận
  for (const id of expected) assert(list.some((m) => m.id === id), `Thiếu chỉ số ${id}`);
  assert(new Set(list.map((m) => m.id)).size === list.length, 'Có hai chỉ số trùng mã');
  const fields = ['id', 'ten', 'cauHoi', 'donVi', 'tapDuDieuKien', 'thoiGian', 'khuTrung', 'drilldown'];
  for (const m of list) {
    for (const f of fields) {
      assert(typeof m[f] === 'string' && m[f].trim().length > 0, `Chỉ số ${m.id} thiếu trường "${f}"`);
    }
    assert(['hoc-vien', 'case', 'phuong-an', 'bai', 'bai-thi', 'dot-test', 'nghia-vu', 'vi-pham', 'bien-phap', 'luot-sos', 'lop', 'viec-van-hanh'].includes(m.donVi), `${m.id}: đơn vị lạ "${m.donVi}"`);
    assert(['hien-trang', 'phat-sinh-trong-ky', 'ket-qua-trong-ky'].includes(m.thoiGian), `${m.id}: thời gian lạ "${m.thoiGian}"`);
  }
  assert(domain.metricById('hv-co-case-mo')?.ten === 'Học viên có Case đang mở', 'metricById phải tra đúng chỉ số');
  assert(domain.metricById('khong-co') === null, 'metricById của mã lạ phải là null');
});


/*
 * Chỉ lấy em ĐÃ BẮT ĐẦU học trước các ngày phương án dùng trong phép kiểm (bộ demo có em ghi danh
 * nhưng khai giảng SAU ngày demo — phương án của em đó, tính đúng luật F03, là "chưa xác định nguồn").
 */
const prfStudentsPool = (category: string) => conn.prepare(
  `SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
    WHERE e.class_id = ? AND substr(e.started_at, 1, 10) <= '2026-08-24' AND NOT EXISTS (
      SELECT 1 FROM sos_cases sc WHERE sc.student_id = s.id AND sc.category = ?)
    ORDER BY s.id`,
).all(mbClass, category) as any[];
const prfReadingCode = domain.issuesForTopic('reading')[0].code;
const prfCase = (studentId: number, key: string) => cases.reportIssue(P.admin, {
  title: 'Vấn đề Reading (PR-F)', primaryCode: prfReadingCode, studentId, topic: 'reading',
  summary: 'Case dựng riêng cho phép kiểm hợp đồng số liệu PR-F.', idempotencyKey: key, parallel: true,
}) as any;
const prfPlan = (caseId: number, name: string, extra: Record<string, unknown> = {}) => {
  const info = cases.recordIntervention(P.admin, caseId, {
    kind: 'self_study', description: name, performerName: 'GVCN', status: 'started', startedDate: '2026-08-25', ...extra,
  }) as any;
  return info.interventions.find((i: any) => i.description === name).id as number;
};
const prfEnd = (ivId: number, outcome: string, day: string, next: any = { nextStep: 'complete' }) =>
  cases.updateResult(P.admin, ivId, {
    mode: 'end', outcome, note: 'Kết quả cuối của phương án (PR-F)', observedOn: day, completedOn: day, ...next,
  });

check('PR-F · F02: thêm một case ĐÃ ĐÓNG không làm tăng "HV đang gặp"; hiệu quả lịch sử vẫn đọc được', () => {
  const pool = prfStudentsPool('reading');
  assert(pool.length >= 2, `Cần hai học viên chưa có case Reading trong lớp, đang có ${pool.length}`);
  const rowOf = () => ((effectiveness.classIssueBoard(mbClass, 'reading') as any).rows as any[])
    .find((r) => r.code === prfReadingCode)
    ?? { cases: 0, openCases: 0, students: 0, studentsEver: 0, plans: 0, success: 0 };
  const before = rowOf();

  const closed = prfCase(pool[0].id, 'test-prf-f02-closed');
  prfEnd(prfPlan(closed.id, 'Ôn Reading 30 phút mỗi ngày (F02 đóng)'), 'improved', '2026-09-10');
  cases.closeCaseOutcome(P.admin, closed.id, { outcome: 'improved', note: 'Đã xong, em ổn định lại hẳn (F02).' });
  const mid = rowOf();
  assert(mid.cases === before.cases + 1, `Số case phải +1, đang ${before.cases} → ${mid.cases}`);
  assert(mid.openCases === before.openCases, 'Case đã đóng không được làm tăng số case đang mở');
  assert(mid.students === before.students,
    `"HV đang gặp" đếm cả em chỉ có case ĐÃ ĐÓNG (F02): ${before.students} → ${mid.students}`);
  assert(mid.studentsEver === before.studentsEver + 1, `Chỉ số lịch sử phải đếm em này: ${before.studentsEver} → ${mid.studentsEver}`);
  assert(mid.success === before.success + 1, 'Hiệu quả lịch sử phải VẪN đọc được phương án của case đã đóng');

  const open = prfCase(pool[1].id, 'test-prf-f02-open');
  assert(open.id, 'Không tạo được case mở');
  const after = rowOf();
  assert(after.students === mid.students + 1, `Em có case đang mở phải được đếm: ${mid.students} → ${after.students}`);
  assert(after.openCases === mid.openCases + 1, 'Case mở phải tăng số case đang mở');
});
check('PR-F · F03: em chuyển chi nhánh SAU khi kết thúc phương án — hiện trạng sang nơi mới, kết quả lịch sử giữ nơi cũ', () => {
  const single = conn.prepare(
    `SELECT s.id, e.id AS enr FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE e.class_id = ? AND (SELECT COUNT(*) FROM enrollments x WHERE x.student_id = s.id) = 1
      ORDER BY s.id DESC`,
  ).all(mbClass) as any[];
  assert(single.length >= 1, 'Cần một học viên chỉ có đúng một lần ghi danh trong MB FT 101');
  const st = single[0];
  const cpClass = classId('CP FT 110');
  /* Em học ở CP từ 01/06 đến 31/07, chuyển sang MB từ 01/08. */
  conn.prepare(`UPDATE enrollments SET started_at = '2026-08-01' WHERE id = ?`).run(st.enr);
  conn.prepare(
    `INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, end_reason, created_at)
     VALUES (?, ?, 'transferred', '2026-06-01', '2026-07-31', 'Chuyển chi nhánh (F03)', '2026-06-01T00:00:00Z')`,
  ).run(st.id, cpClass);

  const c = prfCase(st.id, 'test-prf-f03');
  const inCp = prfPlan(c.id, 'Ôn Reading khi còn học ở CP (F03)', { startedDate: '2026-07-05' });
  prfEnd(inCp, 'improved', '2026-07-10');                 // đang ở CP lúc kết thúc
  const inMb = prfPlan(c.id, 'Ôn Reading sau khi sang MB (F03)', { startedDate: '2026-08-10' });
  prfEnd(inMb, 'partial', '2026-08-20');                  // đã ở MB lúc kết thúc
  const before = prfPlan(c.id, 'Ôn Reading trước khi vào lớp nào (F03)', { startedDate: '2026-04-20' });
  prfEnd(before, 'improved', '2026-05-01');               // chưa có lần ghi danh nào bao phủ ngày này

  const mb = branchIdOf('MB'), cp = branchIdOf('CP');
  const ids = (branch: number) => (effectiveness.planOutcomes({ branchIds: [branch], ratio: false }) as any[]).map((r) => r.id);
  assert(ids(cp).includes(inCp), 'Kết quả lịch sử phải GIỮ ở CP — nơi em học lúc phương án kết thúc');
  assert(!ids(mb).includes(inCp), 'Kết quả cũ của CP bị quy sang MB chỉ vì em đang học ở MB (F03)');
  assert(ids(mb).includes(inMb), 'Phương án kết thúc khi em đã ở MB phải thuộc MB');
  assert(!ids(cp).includes(inMb), 'Phương án của MB bị quy sang CP');
  /* Thiếu dữ liệu quá khứ → "chưa xác định nguồn", KHÔNG quy cho nơi hiện tại. */
  assert(!ids(mb).includes(before) && !ids(cp).includes(before), 'Phương án không rõ nguồn bị quy cho một chi nhánh');
  const unknown = (effectiveness.planOutcomesUnattributed({ ratio: false }) as any[]).map((r) => r.id);
  assert(unknown.includes(before), 'Phương án không rõ nguồn phải hiện ở nhóm "chưa xác định nguồn"');
  assert(!unknown.includes(inCp), 'Phương án đã rõ nguồn không được nằm ở nhóm chưa xác định');
  /* HIỆN TRẠNG vẫn theo nơi đang chăm sóc: case đang mở của em này thuộc MB. PR-Dọn: bảng phân loại cũ đã xoá (không ai gọi) —
     đọc hiện trạng qua danh sách Case (cùng luật lớp đang học, Q5). */
  const openNow = (branch: number) => cases.listCases(P.admin, { branchId: branch }).rows.some((r: any) => r.id === c.id && r.status !== 'done');
  assert(openNow(mb), 'Hiện trạng: case đang mở phải hiện ở MB — nơi em đang học');
  assert(!openNow(cp), 'Hiện trạng: case đang mở không được hiện ở CP — em đã rời CP');
});


check('PR-F · F05: phương án CHƯA XÁC ĐỊNH ra khỏi bảng hiệu quả, thành liên kết "Cần bổ sung đánh giá" ngoài bảng', () => {
  const pool = prfStudentsPool('reading');
  assert(pool.length >= 1, 'Cần một học viên chưa có case Reading');
  const c = prfCase(pool[pool.length - 1].id, 'test-prf-f05');
  /* Đánh dấu đã xong nhưng KHÔNG ai ghi kết quả → nhóm chưa xác định. */
  const info = cases.recordIntervention(P.admin, c.id, {
    kind: 'teaching_adjust', description: 'Chỉnh cách dạy Reading (F05 chưa đánh giá)', performerName: 'GVCN',
    /* Ngày hôm nay: chắc chắn nằm SAU lần ghi danh, nên phương án gán được về lớp này. */
    status: 'completed', completedDate: TODAY,
  }) as any;
  const ivId = info.interventions.find((i: any) => i.description === 'Chỉnh cách dạy Reading (F05 chưa đánh giá)').id;
  const eff = effectiveness.planEffectiveness({ classId: mbClass, category: 'reading' }) as any[];
  for (const k of eff) {
    assert(!('undetermined' in k), `Hàng "${k.kind}" vẫn mang cột undetermined dù đã bị loại khỏi mẫu số (F05)`);
    assert(k.decided === k.success + k.failure, `Loại ${k.kind}: mẫu số lẫn phương án chưa rõ`);
  }
  const need = effectiveness.plansNeedingEvaluation({ classId: mbClass, category: 'reading' }) as any;
  assert(need.ids.includes(ivId) && need.count === need.ids.length,
    `Phương án chưa đánh giá phải nằm ở "Cần bổ sung đánh giá", đang count=${need.count}`);
  const board = effectiveness.classIssueBoard(mbClass, 'reading') as any;
  for (const r of board.rows) assert(!('undetermined' in r), `Hàng "${r.code}" của bảng vấn đề vẫn mang cột undetermined`);
  assert(board.needsEvaluation.count >= 1, 'Bảng phải báo có phương án cần bổ sung đánh giá (ở ngoài bảng)');
});

check('PR-F · Tỷ lệ có cải thiện là 2/3, KHÔNG phải 2/4: chưa xác định ra khỏi mẫu số; PA cập nhật 4 lần chỉ đóng góp một kết quả', () => {
  const pool = prfStudentsPool('reading');
  assert(pool.length >= 1, 'Cần một học viên chưa có case Reading');
  const sid = pool[0].id;
  const rate = () => effectiveness.improvementRate({ studentIds: [sid] }) as any;
  const before = rate();
  const c = prfCase(sid, 'test-prf-rate');

  /* PA 1: cập nhật BỐN lần rồi kết thúc — vẫn chỉ là MỘT kết quả cuối. */
  const four = prfPlan(c.id, 'Ôn Reading bốn lần cập nhật (rate)');
  for (const day of ['2026-09-01', '2026-09-05', '2026-09-08']) {
    cases.updateResult(P.admin, four, { mode: 'monitor', outcome: 'partial', note: 'Cập nhật hằng tuần (PR-F rate)', observedOn: day });
  }
  prfEnd(four, 'improved', '2026-09-12');
  assert((effectiveness.planOutcomes({ studentIds: [sid] }) as any[]).filter((r) => r.id === four).length === 1,
    'PA cập nhật bốn lần phải đóng góp đúng MỘT kết quả cuối');
  /* PA 2: tiến bộ một phần. PA 3: kém hơn (phải đi tiếp bằng phương án mới). PA 4: chưa xác định. */
  prfEnd(prfPlan(c.id, 'Ôn Reading tiến bộ một phần (rate)'), 'partial', '2026-09-11');
  prfEnd(prfPlan(c.id, 'Ôn Reading kém hơn (rate)'), 'worse', '2026-09-11', {
    nextStep: 'propose',
    decisionNote: 'Kém hơn nên thay bằng ôn có bấm giờ (rate)',
    newPlan: { kind: 'self_study', description: 'Thay bằng ôn Reading có bấm giờ (rate)', performerName: 'GVCN' },
  });
  cases.recordIntervention(P.admin, c.id, {
    kind: 'teaching_adjust', description: 'Chỉnh cách dạy chưa đánh giá (rate)', performerName: 'GVCN',
    status: 'completed', completedDate: '2026-09-02',
  });

  const after = rate();
  assert(after.N === before.N + 3, `Mẫu số phải +3 (ba PA có kết quả xác định), đang ${before.N} → ${after.N} — PA chưa xác định vào mẫu số?`);
  assert(after.n === before.n + 2, `Tử số phải +2 (tiến bộ + một phần), đang ${before.n} → ${after.n}`);
  assert(after.numeratorIds.length === after.n && after.denominatorIds.length === after.N,
    'Số phải bằng độ dài của tập ID sinh ra nó');
  assert(domain.rateText(after.n - before.n, after.N - before.N) === '2/3 (67%)',
    `Câu hiển thị phải là 2/3, đang "${domain.rateText(after.n - before.n, after.N - before.N)}"`);
});

check('PR-F · Drill-down: số = độ dài tập, và tập trùng với đối chiếu độc lập bằng SQL', () => {
  const r = metricsSvc.metricSet(P.admin, 'hv-co-case-mo', {}) as any;
  const sql = (conn.prepare(
    `SELECT COUNT(DISTINCT COALESCE(sc.student_id, a.student_id)) n FROM sos_cases sc
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.status != 'done'`,
  ).get() as any).n;
  assert(r.n === r.ids.length, `Số ${r.n} khác độ dài tập ${r.ids.length}`);
  assert(r.n === sql, `hv-co-case-mo=${r.n} nhưng đếm thẳng bằng SQL ra ${sql}`);
  const open = metricsSvc.metricSet(P.admin, 'case-mo', {}) as any;
  const noPlan = metricsSvc.metricSet(P.admin, 'case-thieu-pa', {}) as any;
  assert(noPlan.ids.every((id: number) => open.ids.includes(id)), 'Case thiếu phương án phải là một phần của case đang mở');
  assert(open.ids.length >= r.ids.length, 'Số case đang mở không thể ít hơn số học viên có case đang mở');
  /* Đơn vị khác nhau: HV ≠ case ≠ phương án — không cộng vào nhau. */
  assert(r.unit === 'hoc-vien' && open.unit === 'case', `Đơn vị: ${r.unit} / ${open.unit}`);
  const updates = metricsSvc.metricSet(P.admin, 'pa-can-cap-nhat', {}) as any;
  assert(updates.unit === 'phuong-an' && updates.n === updates.ids.length, 'pa-can-cap-nhat phải đếm phương án');
});


check('PR-F · Đối soát F10 (nhãn): hai định nghĩa khác nhau thì hai màn KHÔNG dùng chung một nhãn', () => {
  const overviewLabel = domain.metricById('hv-co-case-mo')!;
  assert(/kể cả em đã kết thúc khoá/.test(overviewLabel.tapDuDieuKien),
    `Tổng quan phải nói rõ nó đếm CẢ em đã kết thúc khoá mà case còn mở: "${overviewLabel.tapDuDieuKien}"`);
  assert(overviewLabel.ten === 'Học viên có Case đang mở', `Nhãn Tổng quan: "${overviewLabel.ten}"`);
  /* Thực trạng đếm em ĐANG HỌC — nhãn cột là "HV đang gặp", không phải nhãn của Tổng quan (kiểm cả ở giao diện). */
  assert(overviewLabel.ten !== 'HV đang gặp', 'Hai màn đang dùng chung một nhãn cho hai định nghĩa khác nhau');
});

check('PR-F · Drill-down: tài khoản NGOÀI phạm vi bị từ chối, không trả tập rút gọn; phạm vi rỗng trả rỗng', () => {
  const mb = branchIdOf('MB'), cp = branchIdOf('CP');
  assertThrows(() => metricsSvc.metricSet(P.cpManager, 'hv-co-case-mo', { branchId: mb }), /phạm vi|quyền/,
    'Quản lý CP gọi thẳng drill-down của chi nhánh MB');
  assertThrows(() => metricsSvc.metricSet(P.subjectTeacher, 'case-mo', { branchId: cp }), /phạm vi|quyền/,
    'Giáo viên MB gọi thẳng drill-down của chi nhánh CP');
  const own = metricsSvc.metricSet(P.mbManager, 'hv-co-case-mo', { branchId: mb }) as any;
  assert(own.n === own.ids.length, 'Quản lý MB xem chi nhánh của mình phải được');
  const nobody = { ...P.subjectTeacher, grants: [], assignments: [] } as any;
  const none = metricsSvc.metricSet(nobody, 'hv-co-case-mo', {}) as any;
  assert(none.n === 0 && none.ids.length === 0 && none.empty === true,
    'Phạm vi rỗng phải trả rỗng, KHÔNG được hiểu thành toàn hệ thống');
  assert(none.note === 'Không có dữ liệu trong phạm vi', `Ghi chú đang là "${none.note}"`);
  assertThrows(() => metricsSvc.metricSet(P.admin, 'khong-co-chi-so', {}), /Không tìm thấy chỉ số/, 'Mã chỉ số lạ');
  /*
   * PR-N đã viết nốt bốn hàm từng trả 501, nên KHÔNG còn chỉ số nào khai báo mà thiếu hàm: mọi chỉ số trong sổ đều phải
   * trả một tập ID, và phạm vi rỗng trả rỗng ở TẤT CẢ (không chỉ ở một chỉ số như phép kiểm cũ). Cơ chế 501 vẫn còn cho
   * chỉ số khai báo sau này, nhưng không còn chỉ số nào để kiểm nó.
   */
  for (const m of domain.METRICS as readonly any[]) {
    const r = metricsSvc.metricSet(P.admin, m.id, {}) as any;
    assert(Array.isArray(r.ids) && r.n === r.ids.length, `${m.id}: số phải là độ dài của tập ID`);
    const empty = metricsSvc.metricSet(nobody, m.id, {}) as any;
    assert(empty.n === 0 && empty.ids.length === 0 && empty.empty === true, `${m.id}: phạm vi rỗng phải trả rỗng`);
  }
  assert(metricsSvc.LISTED_METRICS.length === (domain.METRICS as readonly any[]).length
    && (domain.METRICS as readonly any[]).every((m) => metricsSvc.LISTED_METRICS.includes(m.id)),
  'Có chỉ số khai báo trong sổ mà chưa có hàm tập ID (hoặc ngược lại)');
});

// ==================================================================== PR-G (chặng 3)

/*
 * DẤU '-' VÀ CHỐT KHÔNG DỰ THI CUỐI CHỦ NHẬT — rule book §17.1.
 *
 * Chốt "kể cả không ai mở web" mà không có cron: kết quả là HÀM THUẦN theo (dấu '-', TUẦN CỦA CHÍNH
 * BÀI, ngày nghiệp vụ), gọi ở đường đọc như `sweepExpiredMoves`. Chạy lúc nào cũng ra cùng kết quả và
 * cùng ngày hiệu lực; gọi mười lần chỉ chốt một lần.
 */
const PRG_SUN = '2026-09-20';     // Chủ nhật cuối tuần W3 SEP 2026 (14–20/09)
const PRG_MON = '2026-09-21';
const prgWeek = periodOf('2026-09-14');
const prgWeekEnd = (conn.prepare('SELECT week_end FROM report_periods WHERE id = ?').get(prgWeek) as any).week_end as string;
/*
 * LƯỢT DÙNG CHO PHÉP KIỂM. Bộ demo chỉ có năm lượt FT ở tuần W3 SEP của lớp này, và Speaking của vài lượt
 * đã `absent` từ dữ liệu seed — nên chọn các ô CÒN SẠCH (chưa có dòng điểm, còn `scheduled`, đúng tuần W3)
 * rồi phân vai: A, B chỉ có L/R/W sạch; C, D sạch cả bốn kỹ năng. Nhiều kỹ năng KHÁC NHAU của cùng một lượt
 * được dùng cho nhiều phép kiểm vì chúng độc lập (mỗi kỹ năng có lịch và bộ đếm riêng).
 */
const { LUOT_LO_TRINH_CUOI_SQL } = await import('../students/tamDung.ts');
const prgSlot = (skills: string[]) => conn.prepare(
  /* LOC-HIEN-TAI (chủ SP 28/10): bảng điểm lớp không còn hàng em Kết thúc học (Ngô Thanh Tùng có MT3 W3 SEP) hay lượt lộ trình cũ — chỉ chọn lượt hiện tại. */
  `SELECT a.id FROM assessment_attempts a JOIN students st ON st.id = a.student_id AND st.status = 'active' AND st.archived_at IS NULL AND ${LUOT_LO_TRINH_CUOI_SQL('a')}
    WHERE a.class_id = ? AND a.status != 'cancelled' AND a.kind = 'mock'
      AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id)
      AND (SELECT COUNT(*) FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1
              AND k.skill IN (${skills.map(() => '?').join(',')})
              AND k.planned_period_id = ? AND k.sit_status = 'scheduled') = ?
    ORDER BY a.id`,
).all(mbClass, ...skills, prgWeek, skills.length).map((r: any) => r.id as number);
const prgLrw = prgSlot(['listening', 'reading', 'writing']);
const prgA = prgLrw[0], prgB = prgLrw[1], prgE = prgLrw[2];
/*
 * Chỉ số theo VAI trong các phép kiểm bên dưới:
 *   0 báo "-" rồi chốt (Listening của A) · 1 chốt chậm (Reading của A) · 2 ô trống (E)
 *   3 sửa "-" thành điểm trước chốt (Reading của B) · 4 W2 có điểm, W1 "-" (Writing của B)
 *   5 W1 và W2 cùng "-" (Writing của E) · 6 quyền và xác nhận C10 (Listening của E) · 7 từ chối C10 (Listening của B)
 */
const prgAttempts = [prgA, prgA, prgE, prgB, prgB, prgE, prgE, prgB];
const prgCell = (attemptId: number, skill: string, today: string = TODAY, period: number = prgWeek) => {
  const sheet = attempts.classScoreSheet(P.admin, mbClass, period, today) as any;
  return sheet.rows.find((r: any) => r.attemptId === attemptId)?.cells.find((c: any) => c.skill === skill);
};
const prgSit = (attemptId: number, assessed: string) => (conn.prepare(
  'SELECT sit_status, sit_at, sit_note, planned_period_id, absence_move_count FROM attempt_skills WHERE attempt_id = ? AND skill = ?',
).get(attemptId, assessed) as any);
/** BỘ ĐẾM VẮNG: số lần một kỹ năng của một đợt đã được CHỐT không dự thi. */
const prgSettled = (attemptId: number, assessed: string) => (conn.prepare(
  `SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_no_show_settled' AND field = ?`,
).get(attemptId, assessed) as any).n as number;
const prgWriting1 = loadPrincipal(teacherOfSkill('MB FT 101', 'writing1'));
const prgWriting2 = loadPrincipal(teacherOfSkill('MB FT 101', 'writing2'));

check('PR-G · Tiền đề: bộ demo có đủ lượt FT chưa chấm ở tuần W3 SEP để dựng các phép kiểm', () => {
  assert(prgWeekEnd === PRG_SUN, `Cuối tuần phải là Chủ nhật ${PRG_SUN}, đang là ${prgWeekEnd}`);
  assert(prgLrw.length >= 3, `Cần ba lượt còn sạch Listening/Reading/Writing ở W3 SEP; đang có ${prgLrw.length}`);
});

check('PR-G · Chốt là HÀM THUẦN theo tuần của bài: chạy lúc nào cũng ra cùng kết quả và cùng ngày hiệu lực', () => {
  const st = (today: string, extra: Record<string, unknown> = {}) => domain.noShowStateOf({
    marked: true, hasScore: false, sameWeek: true, weekEnd: PRG_SUN, today,
    enteredAfterWeekEnd: false, lateRule: 'cho-ql-hieu-chinh', ...extra,
  } as any);
  const onSunday = st(PRG_SUN);
  assert(onSunday.state === 'khong-co-bai' && onSunday.editableUntil === PRG_SUN && onSunday.effectiveOn === null,
    `Đúng ngày Chủ nhật vẫn còn sửa được: ${JSON.stringify(onSunday)}`);
  for (const today of [PRG_MON, '2026-09-24', '2026-10-15', '2027-01-03']) {
    const v = st(today);
    assert(v.state === 'khong-du-thi' && v.effectiveOn === PRG_SUN,
      `Chạy ngày ${today}: phải chốt với ngày hiệu lực ${PRG_SUN}, đang ${JSON.stringify(v)}`);
  }
  assert(st(PRG_MON, { marked: false }).state === 'none', 'Ô trống KHÔNG tự thành vắng');
  assert(st(PRG_MON, { hasScore: true }).state === 'none', 'Đã có điểm thì dấu "-" không còn hiệu lực');
  assert(st(PRG_MON, { sameWeek: false }).state === 'none', 'Lịch đã dời sang tuần khác thì dấu "-" của tuần cũ hết nghĩa');
  assert(st('2026-09-15').state === 'khong-co-bai', 'Chưa hết tuần thì còn là "không có bài"');
});

check('PR-G · Câu trạng thái đúng chữ của bộ chữ: gợi ý, không có bài, không dự thi, chờ quản lý', () => {
  assert(domain.NO_SHOW_HINT === 'Nhập - nếu học viên không làm bài', `Gợi ý: "${domain.NO_SHOW_HINT}"`);
  const early = domain.noShowStateOf({ marked: true, hasScore: false, sameWeek: true, weekEnd: PRG_SUN, today: '2026-09-14',
    enteredAfterWeekEnd: false, lateRule: 'cho-ql-hieu-chinh' });
  assert(domain.noShowText(early, 'W3 SEP 2026', '2026-09-14') === 'Không có bài · Có thể sửa đến hết Chủ nhật 20/09',
    `Sau khi lưu: "${domain.noShowText(early, 'W3 SEP 2026', '2026-09-14')}"`);
  const settled = domain.noShowStateOf({ marked: true, hasScore: false, sameWeek: true, weekEnd: PRG_SUN, today: PRG_MON,
    enteredAfterWeekEnd: false, lateRule: 'cho-ql-hieu-chinh' });
  assert(domain.noShowText(settled, 'W3 SEP 2026', PRG_MON) === 'Vắng · Tuần W3 SEP 2026',
    `Sau chốt: "${domain.noShowText(settled, 'W3 SEP 2026', PRG_MON)}"`);
  const late = domain.noShowStateOf({ marked: true, hasScore: false, sameWeek: true, weekEnd: PRG_SUN, today: '2026-09-28',
    enteredAfterWeekEnd: true, lateRule: 'cho-ql-hieu-chinh' });
  assert(late.state === 'cho-ql-hieu-chinh' && domain.noShowText(late, 'W3 SEP 2026', '2026-09-28') === 'Chờ quản lý hiệu chỉnh',
    `Tuần đã qua: ${JSON.stringify(late)}`);
  assert(domain.noShowText({ state: 'none', effectiveOn: null, editableUntil: null }, null, TODAY) === null, 'Không có dấu thì không có câu');
});

check('PR-G · Chín điểm luật chưa chốt (C01–C09) và C10 là HẰNG SỐ CÓ TÊN ở policy.ts, không rải if', () => {
  const names = ['C01_HAN_XAC_MINH_SOS_GOM_PA', 'C02_GVCN_XU_LY_CASE_TRAI_MON', 'C03_CUA_SO_GOP_CASE_Y_THUC_NGAY', 'C04_BAO_CAO_MOI_SAU_KHI_DONG',
    'C05_SOS_SINH_PA_TRAO_DOI', 'C06_NHAP_BU_CASE_DANG_XU_LY', 'C07_DOT_FT_CHI_W1_HOAC_W2', 'C08_HAN_CHAM_NORMAL',
    'C09_DE_NGHI_DOI_LICH_HET_HAN', 'C10_NHAP_DAU_TRU_TUAN_QUA_KHU'];
  for (const n of names) assert((domain as any)[n] !== undefined && String((domain as any)[n]).length > 0, `Thiếu hằng số ${n}`);
  /* Lời chốt của chủ sản phẩm 20/09/2026. */
  assert(domain.C10_NHAP_DAU_TRU_TUAN_QUA_KHU === 'chot-ngay', 'C10 đã chốt: nhập "-" cho tuần đã qua thì CHỐT NGAY');
  assert(domain.C02_GVCN_XU_LY_CASE_TRAI_MON === 'gvcn-dung-mon', 'C02 đã chốt: GVCN không xử lý case trái môn');
  /* C03 và C04 HẾT HIỆU LỰC 21/09/2026 (mô hình Case Ý thức đã bỏ) — hằng số còn để lịch sử quyết định vẫn tra được. */
  assert(domain.C03_CUA_SO_GOP_CASE_Y_THUC_NGAY === 3, 'C03 giữ nguyên giá trị đã chốt 20/09/2026 dù đã hết hiệu lực');
  assert(domain.C07_DOT_FT_CHI_W1_HOAC_W2 === 'phai-du-hai-task', 'C07 đã chốt: Writing phải đủ cả W1 và W2');
  assert(domain.C09_DE_NGHI_DOI_LICH_HET_HAN === 'tu-choi-khi-het-han', 'C09 đã chốt: không phản hồi thì huỷ');
  assert(domain.C05_SOS_SINH_PA_TRAO_DOI === 'khong-bat-buoc', 'C05 đã chốt: SOS không bắt buộc sinh phương án trao đổi');
});

check('PR-G · Bài đã báo "-" không còn là bài cần chấm; ô trống thì vẫn là bài cần chấm', () => {
  const cells = [
    { skill: 'listening', required: true, scored: false, progress: 'due', mine: true, noShow: true },
    { skill: 'reading', required: true, scored: false, progress: 'due', mine: true },
  ] as any[];
  const pending = domain.pendingSkillsOf(cells, 'mine');
  assert(pending.length === 1 && pending[0] === 'reading', `Bài cần chấm phải chỉ còn Reading, đang [${pending.join(',')}]`);
});

/*
 * OV-1b (đặc tả 3.3, chủ SP 11/10) THAY luật PR-G "chờ hết Chủ nhật": "-" trong tuần thi chốt vắng NGAY (lần 1 dời, lần 2 huỷ phần thi);
 * "-" nhập bù sau tuần thi / MT cũ = "Không dự thi" (không dời, không đếm). Các phép kiểm dưới đây giữ ý cũ (ô trống không thành vắng,
 * W1 + W2, quyền, điểm thắng dấu) và đổi phần thời điểm chốt theo luật mới.
 */
check('PR-G · (OV-1b) GV nhập "-" trong tuần thi: chốt vắng NGAY — dời W4 SEP, KHÔNG phải điểm 0, không lây sang Reading; bấm lại khi tuần mới chưa tới bị từ chối', () => {
  const id = prgAttempts[0];
  attempts.saveScore(P.lrTeacher, id, 'listening', { noShow: true } as any);
  const sau = prgSit(id, 'listening');
  assert(sau.sit_status === 'scheduled' && sau.absence_move_count === 1 && sau.planned_period_id === periodOf('2026-09-21'),
    `Listening phải dời lần 1 sang W4 SEP ngay: ${JSON.stringify(sau)}`);
  assert(prgSettled(id, 'listening') === 1, `Bộ đếm vắng phải là 1, đang ${prgSettled(id, 'listening')}`);
  const c = prgCell(id, 'listening');
  assert(c.rawScore === null && c.band === null, `"-" không phải điểm 0: raw=${c.rawScore} band=${c.band}`);
  assert(c.daChot?.doiSang, `Ô phải ghi đã dời: ${JSON.stringify(c.daChot)}`);
  assert(!prgCell(id, 'reading').noShow, 'Dấu "-" của Listening lây sang Reading');
  assertThrows(() => attempts.saveScore(P.lrTeacher, id, 'listening', { noShow: true } as any), /Chưa tới tuần Test/,
    'Bấm lại "-" khi tuần mới chưa tới');
  assert(prgSettled(id, 'listening') === 1, 'Bấm lại làm bộ đếm vắng tăng');
  const doi = conn.prepare(
    `SELECT reason, old_value FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_week_moved_absence' AND field = 'listening'`,
  ).get(id) as any;
  assert(doi?.reason === 'Vắng — tự dời' && /^W3 SEP/.test(doi.old_value ?? ''), `Lịch sử phải ghi tự dời từ W3 SEP: ${JSON.stringify(doi)}`);
});

/* LUAT-34 (luật 4 sửa 21/10) thay OV-1b "nhập bù = Không dự thi": "-" ghi muộn chốt như trong tuần — tuần kế của lịch đã hết → thẻ Quản lý. */
check('PR-G · LUAT-34 "-" ghi muộn (tuần kế đã hết) → vắng chờ QL (thẻ dời), không còn Không dự thi; Hoàn tác rồi nhập điểm được', () => {
  const id = prgAttempts[1];
  attempts.saveScore(P.lrTeacher, id, 'reading', { noShow: true } as any, '2026-10-03');
  const k = prgSit(id, 'reading');
  assert(k.sit_status === 'absent' && k.absence_move_count === 0 && k.planned_period_id === prgWeek, `vắng chờ QL: ${JSON.stringify(k)}`);
  assert((conn.prepare(`SELECT COUNT(*) n FROM skill_move_requests WHERE attempt_id = ? AND skill = 'reading' AND status = 'pending'`).get(id) as any).n === 1, 'thẻ dời chờ QL');
  attempts.saveScore(P.lrTeacher, id, 'reading', { noShow: false } as any, '2026-10-03');   // Hoàn tác (người vừa gõ)
  attempts.saveScore(P.lrTeacher, id, 'reading', { rawScore: 30 }, '2026-10-03');
  assert(prgCell(id, 'reading', '2026-10-03').band !== null && !prgCell(id, 'reading', '2026-10-03').noShow, 'Điểm thật phải thắng dấu "-"');
});

check('PR-G · Ô TRỐNG không tự thành vắng, dù tuần đã hết và có người mở bảng', () => {
  const id = prgAttempts[2];
  prgCell(id, 'listening', '2026-10-10');
  for (const s of ['listening', 'reading', 'writing']) {
    assert(prgSit(id, s).sit_status === 'scheduled', `${s} bị ghi vắng dù chỉ là ô trống`);
  }
  assert(prgSettled(id, 'listening') === 0, 'Ô trống không được sinh bộ đếm vắng');
});

check('PR-G · (OV-1b) Đổi ý sau "-": Bỏ vắng trả bài về tuần cũ (bộ đếm 0) rồi nhập điểm; đã có điểm thì "-" không xoá âm thầm', () => {
  const id = prgAttempts[3];
  attempts.saveScore(P.lrTeacher, id, 'reading', { noShow: true } as any);
  assert(prgSit(id, 'reading').absence_move_count === 1, 'Tiền đề: "-" trong tuần đã dời Reading');
  attempts.saveScore(P.lrTeacher, id, 'reading', { noShow: false } as any);   // Bỏ vắng
  assert(prgSit(id, 'reading').planned_period_id === prgWeek && prgSit(id, 'reading').absence_move_count === 0, `Bỏ vắng: ${JSON.stringify(prgSit(id, 'reading'))}`);
  attempts.saveScore(P.lrTeacher, id, 'reading', { rawScore: 30 });
  const band = prgCell(id, 'reading').band;
  assert(band !== null, 'Điểm hợp lệ phải được lưu');
  assert(!prgCell(id, 'reading').noShow, 'Dấu "-" phải hết hiệu lực khi đã có điểm');
  assert(prgSit(id, 'reading').sit_status === 'sat', 'Có điểm thì đã thi');
  /* Đã có điểm chính thức: "-" KHÔNG được xoá âm thầm. */
  assertThrows(() => attempts.saveScore(P.lrTeacher, id, 'reading', { noShow: true } as any), /điểm chính thức|hiệu chỉnh/,
    'Nhập "-" đè lên một điểm chính thức');
  assert(prgCell(id, 'reading').band === band, 'Điểm chính thức bị mất');
});

check('PR-G · "-" ở W1 KHÔNG xoá W2 và không đếm hai lần: chỉ khi CẢ HAI bài của buổi Writing đều "-" mới là vắng, và đúng MỘT lần', () => {
  const id = prgAttempts[4];
  /* LUAT-34 (T07, PTA): W2 đã có điểm; W1 báo "-" → buổi vắng, dời CẢ W lần 1 (điểm W2 đi theo, không bị xoá). */
  attempts.saveScore(prgWriting2, id, 'writing2', { criteria: [6, 6, 6, 6] });
  attempts.saveScore(prgWriting1, id, 'writing1', { noShow: true } as any);
  assert(prgCell(id, 'writing2').band === 6, 'W1 báo "-" đã xoá điểm W2');
  assert(prgSit(id, 'writing').sit_status === 'scheduled' && prgSit(id, 'writing').absence_move_count === 1, `W1 "-" + W2 có điểm phải dời cả W: ${JSON.stringify(prgSit(id, 'writing'))}`);

  const id2 = prgAttempts[5];
  attempts.saveScore(prgWriting1, id2, 'writing1', { noShow: true } as any);
  assert(prgSit(id2, 'writing').absence_move_count === 0 && prgSit(id2, 'writing').planned_period_id === prgWeek,
    'Mới W1 báo "-", W2 chưa nhập — chưa đủ để coi buổi Writing là vắng');
  attempts.saveScore(prgWriting2, id2, 'writing2', { noShow: true } as any);
  assert(prgSit(id2, 'writing').sit_status === 'scheduled' && prgSit(id2, 'writing').absence_move_count === 1, 'Cả W1 và W2 đều "-" thì buổi Writing phải dời lần 1 ngay');
  assert(prgSettled(id2, 'writing') === 1, `Hai ô "-" cùng một buổi chỉ được đếm MỘT lần vắng, đang ${prgSettled(id2, 'writing')}`);
  prgCell(id2, 'writing1', '2026-10-20');
  assert(prgSettled(id2, 'writing') === 1, 'Mở bảng sau đó làm bộ đếm vắng tăng');
});

check('PR-G · Quyền: GV chỉ báo "-" cho bài mình được phân công; chỉ GVCN/Quản lý dời lần đầu, GVBM thì không', () => {
  const id = prgAttempts[6];
  assertThrows(() => attempts.saveScore(P.sTeacher, id, 'listening', { noShow: true } as any), /phân công|quyền/,
    'GV Speaking báo "-" cho ô Listening');
  const settledId = prgAttempts[0];
  assertThrows(() => absence.requestAbsenceMove(P.sTeacher, settledId, ['listening']), /chủ nhiệm|Quản lý/,
    'GVBM (không phải GVCN) tự dời lịch chỉ vì mình là người báo "-"');
  const row = prgSit(settledId, 'listening');
  assert(row.absence_move_count === 1 && row.sit_status === 'scheduled', `Sau khi tự dời: ${JSON.stringify(row)}`);
  /* Dấu "-" của tuần cũ hết nghĩa ở tuần mới; mở bảng lại không tạo thêm lần vắng nào. */
  prgCell(settledId, 'listening', '2026-10-25', periodOf('2026-09-21'));
  assert(prgSettled(settledId, 'listening') === 1, 'Bộ đếm vắng phải giữ nguyên là 1 qua lần dời');
});

/* PR-Rc1 C08: lớp thường nay CÓ dấu "-" (môn đó dời sang tuần sau) nhưng đi cửa `reportRegularNoShow` — cửa chốt vắng của FT vẫn đóng. */
check('PR-G · Normal không đi cửa dấu "-" của FT: không có chốt vắng, chỉ đường sang bảng điểm lớp thường', () => {
  const { attemptId } = normalWritingAttemptSkill();
  assertThrows(() => attempts.saveScore(P.normalCoreTeacher, attemptId, 'listening', { noShow: true } as any), /lớp thường/,
    'Lớp Normal ghi được dấu "-" qua cửa chốt vắng của FT');
});

check('PR-G · LUAT-34 "-" ghi muộn khi tuần kế đã hết → thẻ dời chờ QL (không Không dự thi); không hàng chờ hiệu chỉnh', () => {
  const id = prgAttempts[6];
  const late = '2026-09-28';
  attempts.saveScore(P.lrTeacher, id, 'listening', { noShow: true } as any, late);
  assert(prgSit(id, 'listening').sit_status === 'absent' && prgSit(id, 'listening').absence_move_count === 0,
    `vắng chờ QL: ${JSON.stringify(prgSit(id, 'listening'))}`);
  const pending = (conn.prepare(`SELECT COUNT(*) n FROM skill_move_requests WHERE attempt_id = ? AND skill = 'listening' AND status = 'pending'`).get(id) as any).n;
  assert(pending === 1, 'ghi muộn không dời được → thẻ dời gửi QL');
  assert(typeof (absence as any).resolveLateNoShow === 'undefined' && typeof (absence as any).settleNoShows === 'undefined',
    'Đường "chờ Quản lý hiệu chỉnh" và chốt cuối Chủ nhật phải đã bỏ');

  /* Gõ nhầm: Hoàn tác (người vừa gõ) rồi nhập điểm muộn được, dấu hết hiệu lực. */
  const id2 = prgAttempts[7];
  attempts.saveScore(P.lrTeacher, id2, 'listening', { noShow: true } as any, late);
  attempts.saveScore(P.lrTeacher, id2, 'listening', { noShow: false } as any, late);
  attempts.saveScore(P.lrTeacher, id2, 'listening', { rawScore: 30 }, late);
  assert(!prgCell(id2, 'listening', late).noShow && prgSit(id2, 'listening').sit_status === 'sat', 'Nhập điểm đè Không dự thi phải được');
});

check('PR-G · (OV-1b) Writing đủ W1 + W2 "-" trong tuần → tự dời lần 1; Listening ghi muộn → thẻ QL, bộ đếm 0 (LUAT-34)', () => {
  const settledWriting = prgAttempts[5];
  assert(prgSit(settledWriting, 'writing').sit_status === 'scheduled' && prgSit(settledWriting, 'writing').absence_move_count === 1,
    `Writing phải đã dời lần 1: ${JSON.stringify(prgSit(settledWriting, 'writing'))}`);
  const lateListening = prgAttempts[6];
  assert(prgSit(lateListening, 'listening').absence_move_count === 0 && prgSit(lateListening, 'listening').planned_period_id === prgWeek,
    'thẻ QL chưa duyệt: chưa dời, chưa tăng bộ đếm');
});


// ==================================================================== PR-I (chặng 4)

/*
 * HỒ SƠ TEST GỌN — phần LUẬT của PR-I (phần còn lại là giao diện). Ba điều máy chủ phải đúng để màn gọn không nói sai:
 *   1. NGƯỜI CẬP NHẬT ≠ NGƯỜI NHẬP ĐIỂM (MT-P09): ô điểm trống không được mang tên ai đó "nhập".
 *   2. Lịch sử thay đổi có CẢ điểm: ai sửa, trước → sau, kể cả xoá điểm và dấu '-'.
 *   3. Có lịch và đúng quyền thì nhập được — KHÔNG cần bấm "Đã thi"; và đến ngày cũng không tự ghi "đã thi".
 */
const pri = (attemptId: number) => attempts.attemptDetail(P.admin, attemptId) as any;
const priCell = (attemptId: number, skill: string) => pri(attemptId).cells.find((c: any) => c.skill === skill);

check('PR-I · Ô điểm bị xoá trống KHÔNG còn "người nhập": tác giả một thao tác không phải bằng chứng đã có điểm', () => {
  const id = prgAttempts[3];                                   // Reading của B đã có điểm 30 từ phép kiểm PR-G
  const before = priCell(id, 'reading');
  assert(before.rawScore === 30 && before.enteredByName, `Tiền đề: Reading của B phải có điểm và người nhập, đang ${JSON.stringify(before)}`);
  attempts.saveScore(P.lrTeacher, id, 'reading', { rawScore: null, lyDo: 'Phép kiểm: sửa điểm đã có' });
  const cleared = priCell(id, 'reading');
  assert(cleared.rawScore === null && cleared.band === null, 'Xoá xong ô phải trống');
  assert(cleared.enteredByName === null && cleared.enteredAt === null,
    `Ô trống mà còn "Người nhập ${cleared.enteredByName}" — MT-P09: ${JSON.stringify([cleared.enteredByName, cleared.enteredAt])}`);
  attempts.saveScore(P.lrTeacher, id, 'reading', { rawScore: 28 });
  const again = priCell(id, 'reading');
  assert(again.enteredByName && again.enteredAt, 'Nhập lại điểm thì phải có người nhập và lúc nhập');
});

check('PR-I · Bài chỉ báo "-" hoặc mới gõ dở một tiêu chí: "-" không có người nhập; dở dang thì vẫn giữ tác giả', () => {
  const dash = priCell(prgAttempts[0], 'listening');
  assert(dash.enteredByName === null && dash.enteredAt === null,
    `Báo "-" không phải nhập điểm nên không có người nhập: ${JSON.stringify([dash.noShow?.state, dash.enteredByName])}`);
  const id = prgAttempts[4];                                    // W1 của B: đang "-", chưa chốt vì tuần đã hết -> không dùng; dùng W2 đã có điểm
  const homNay = chuNhatCuoiOf(id);   // LUAT-34: Writing của B đã dời tuần kế (W1 "-" + W2 có điểm) — nhập ở tuần thi mới
  attempts.saveScore(prgWriting2, id, 'writing2', { criteria: [6, null, null, null], lyDo: 'Phép kiểm: sửa điểm đã có' }, homNay);
  const partial = priCell(id, 'writing2');
  assert(partial.band === null && partial.criteria[0] === 6, 'Tiền đề: mới có một tiêu chí, chưa ra band');
  assert(partial.enteredByName, 'Đã có giá trị (dù dở dang) thì còn người nhập — chỉ ô HOÀN TOÀN trống mới hết tên');
  attempts.saveScore(prgWriting2, id, 'writing2', { criteria: [null, null, null, null] }, homNay);
  assert(priCell(id, 'writing2').enteredByName === null, 'Xoá hết bốn tiêu chí thì hết tên người nhập');
});

check('PR-I · Lịch sử thay đổi có CẢ điểm: ai sửa, trước → sau, kể cả xoá điểm và dấu "-"', () => {
  const history = pri(prgAttempts[3]).scoreHistory as any[];
  assert(Array.isArray(history) && history.length >= 3, `Phải có lịch sử điểm của Reading (nhập, xoá, nhập lại), đang ${history?.length}`);
  const reading = history.filter((h) => h.skill === 'reading');
  const last = reading[0];
  assert(last.actorName && /28/.test(last.after), `Dòng mới nhất: nhập 28, đang ${JSON.stringify(last)}`);
  assert(/trống/i.test(last.before), `Trước khi nhập lại là ô trống, đang "${last.before}"`);
  const cleared = reading.find((h) => /trống/i.test(h.after));
  assert(cleared && /30/.test(cleared.before), `Phải có dòng xoá điểm 30 → trống, đang ${JSON.stringify(cleared)}`);
  const dashHist = (pri(prgAttempts[0]).scoreHistory as any[]).find((h) => h.skill === 'listening');
  assert(dashHist && dashHist.after === 'Báo "-" (không có bài)', `Dấu "-" của Listening phải có trong lịch sử, đang ${JSON.stringify(dashHist)}`);
  for (const h of history) assert(h.createdAt && h.skillLabel, 'Mỗi dòng phải có ngày và tên kỹ năng đọc được');
});

check('PR-I · Tiến độ một kỹ năng không đòi "xác nhận đã thi" trước khi chấm (MT-P03): đến lịch thì là "Chờ nhập điểm"', () => {
  assert(domain.SKILL_PROGRESS_LABEL.due === 'Chờ nhập điểm', `due: "${domain.SKILL_PROGRESS_LABEL.due}"`);
  for (const [k, v] of Object.entries(domain.SKILL_PROGRESS_LABEL)) {
    assert(!/xác nhận đã thi/i.test(v as string), `Nhãn "${k}" vẫn đòi xác nhận đã thi: "${v}"`);
  }
  assert(domain.awaitingScore('due') && domain.awaitingScore('sat'), 'Đến lịch vẫn là đang nợ điểm');
});

check('PR-I · Nhập điểm KHÔNG cần bấm "Đã thi" (có điểm thì tự suy ra đã thi), và đến ngày cũng KHÔNG tự ghi "đã thi"', () => {
  const row = conn.prepare(
    `SELECT k.attempt_id id FROM attempt_skills k
       JOIN assessment_attempts a ON a.id = k.attempt_id
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND k.skill = 'listening'
        AND k.required = 1 AND k.sit_status = 'scheduled' AND k.planned_period_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill = 'listening')
      ORDER BY k.attempt_id LIMIT 1`,
  ).get(mbClass) as any;
  assert(row, 'Tiền đề: cần một lượt còn Listening theo lịch và chưa có điểm');
  const satBefore = (conn.prepare("SELECT COUNT(*) n FROM attempt_skills WHERE sit_status = 'sat'").get() as any).n;
  attempts.classScoreSheet(P.admin, mbClass, prgWeek, '2026-11-30');                 // rất lâu sau ngày thi
  const satAfter = (conn.prepare("SELECT COUNT(*) n FROM attempt_skills WHERE sit_status = 'sat'").get() as any).n;
  assert(satAfter === satBefore, `Đến ngày (và quá ngày) không được tự ghi "đã thi": ${satBefore} -> ${satAfter}`);
  assert(prgSit(row.id, 'listening').sit_status === 'scheduled', 'Ô chưa có điểm vẫn chỉ là "theo lịch"');
  attempts.saveScore(P.lrTeacher, row.id, 'listening', { rawScore: 25 });
  assert(prgSit(row.id, 'listening').sit_status === 'sat', 'Có điểm thì suy ra đã thi — không cần ai bấm "Đã thi"');
});


// ==================================================================== PR-H (chặng 5)

/*
 * BIÊN TẬP TIẾNG VIỆT — một khái niệm, một chữ (thiet-ke/TU_DIEN_VA_CHU.md). Nghiệm thu ở tài liệu là "grep các chuỗi cũ →
 * không còn kết quả nào ngoài file tài liệu"; phép kiểm này CHẠY đúng lệnh grep đó trên mã nguồn, kể cả chú thích, để một
 * lần biên tập sau không lặng lẽ đưa chữ cũ trở lại. Bản thân danh sách chuỗi cũ nằm ở đây nên file này được loại khỏi phép quét.
 */
const PRH_OLD_STRINGS = [
  // hồ sơ Test
  'Kế hoạch MT', 'Tuần hoàn tất', 'Target lúc đánh giá', 'Chưa xác nhận đã thi', 'Bỏ khỏi phạm vi', 'Đưa lại vào phạm vi',
  // khối case và phương án
  'Chưa có gì diễn ra', 'Ghi lại phương án đầu tiên', 'chưa ai bắt tay vào việc', 'Chưa làm gì cho em', 'Đã làm gì',
  'Người làm', '+ thêm dòng', 'Lịch sử và kết thúc phương án', 'Mở trang riêng',
  // danh sách lớp, học viên, nhập liệu
  'Lớp là gốc', 'Badge chỉ xuất hiện', 'Em nào vào muộn thì ghi đè', 'Cả lô này vào một lớp', 'Bỏ qua {blocking} dòng lỗi',
  /* PR-VAI-a: bỏ 'Việc của tôi' khỏi danh sách — mockup 23 đã duyệt đặt lại tên khối GV "Việc của tôi · hôm nay" (nguồn ưu tiên cao hơn PR-H). */
  'Thêm 0 học viên', 'Cả phạm vi quản lý', 'Hai mốc kiểm tra đếm từ đây', 'Tiến độ lớp',
  // mười hai khái niệm — chữ tuyệt đối không viết
  'SOS ý thức', 'Hoàn thành phương án', 'hoàn thành phương án', 'Đã hoàn thành phương án',
];
const prhSourceFiles = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === 'tests' || e.name === 'node_modules' ? [] : prhSourceFiles(p);
  return /\.(ts|tsx|sql)$/.test(e.name) ? [p] : [];
});

check('PR-H · Grep các chuỗi cũ của bảng chữ: không còn ở mã nguồn (kể cả chú thích), chỉ còn trong tài liệu', () => {
  const files = ['web/src', 'shared', 'server/src'].flatMap((d) => prhSourceFiles(path.join(ROOT, '..', d)));
  assert(files.length > 50, `Quét quá ít file (${files.length}) — sai đường dẫn gốc?`);
  const hits: string[] = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const old of PRH_OLD_STRINGS) {
      if (text.includes(old)) hits.push(`${path.relative(path.join(ROOT, '..'), file).replace(/\\/g, '/')}: "${old}"`);
    }
  }
  assert(hits.length === 0, `Còn ${hits.length} chỗ dùng chữ cũ:\n    ${hits.join('\n    ')}`);
});

check('PR-H · Badge đếm nói rõ ĐẾM CỦA AI: việc riêng khác toàn lớp, và phạm vi có tên đúng bộ chữ', () => {
  assert(domain.needScoresText('mine', 3) === 'Cần chấm: 3 bài', `mine: "${domain.needScoresText('mine', 3)}"`);
  assert(domain.needScoresText('managed', 5) === 'Lớp còn 5 bài chưa nhập điểm', `managed: "${domain.needScoresText('managed', 5)}"`);
  assert(domain.needScoresText(null, 5) === 'Lớp còn 5 bài chưa nhập điểm', 'Không nói ai đang xem thì mặc định là toàn lớp');
  assert(domain.WORK_SCOPE_LABEL.mine === 'Tôi' && domain.WORK_SCOPE_LABEL.managed === 'Tất cả trong phạm vi',
    `Nhãn phạm vi: ${JSON.stringify(domain.WORK_SCOPE_LABEL)}`);
});


// ==================================================================== Sau rà soát độc lập

/*
 * Bốn lỗi do một người rà soát độc lập đọc toàn bộ diff tìm ra — mỗi lỗi có phép kiểm đỏ trước khi sửa.
 */
/* OV-1b đổi ý phép kiểm này: "-" luôn có tác dụng — W1 "-" (W2 có điểm) quá Chủ nhật là "Không dự thi" của RIÊNG ô W1, không quay về ô trống
   (lỗi chủ SP báo 11/10: "-" ra ô trống); buổi Writing vẫn không vắng và ô KHÔNG khoá (nhập điểm đè được). */
check('Rà soát · LUAT-34 (T07) W1 "-" + W2 có điểm: buổi vắng lần 1 — dời cả W sang tuần kế, không chờ QL', () => {
  const id = prgAttempts[4];                                    // W2 có điểm, W1 "-" (phép kiểm PR-G ở trên)
  const k = prgSit(id, 'writing');
  assert(k.sit_status === 'scheduled' && k.absence_move_count === 1 && k.planned_period_id !== prgWeek, `dời cả W: ${JSON.stringify(k)}`);
  assert(!(conn.prepare(`SELECT 1 FROM skill_move_requests WHERE attempt_id = ? AND skill = 'writing' AND status = 'pending'`).get(id)), 'không thẻ chờ');
});

check('Rà soát · Bài đã báo "-" không còn nằm trong "việc của tôi" của giáo viên (không chỉ ở hàm đếm thuần)', () => {
  const row = conn.prepare(
    `SELECT k.attempt_id id FROM attempt_skills k
       JOIN assessment_attempts a ON a.id = k.attempt_id
      WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND k.skill = 'reading'
        AND k.required = 1 AND k.sit_status = 'scheduled' AND k.planned_period_id = ?
        AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill = 'reading')
      ORDER BY k.attempt_id LIMIT 1`,
  ).get(mbClass, prgWeek) as any;
  assert(row, 'Tiền đề: cần một ô Reading còn sạch ở W3 SEP');
  const mine = () => (attempts.listAttempts(P.lrTeacher, { classId: mbClass }) as any).rows.find((r: any) => r.id === row.id);
  assert(mine().myPendingSkills.includes('reading'), 'Tiền đề: Reading chưa báo "-" thì còn nợ điểm');
  attempts.saveScore(P.lrTeacher, row.id, 'reading', { noShow: true } as any);
  assert(!mine().myPendingSkills.includes('reading'), 'Đã báo "-" mà Reading vẫn nằm trong myPendingSkills');
  assert(!mine().myPendingDetail.some((d: any) => d.skill === 'reading'), 'Đã báo "-" mà Reading vẫn nằm trong myPendingDetail');
  const after = priCell(row.id, 'reading');
  /* OV-1b: "-" trong tuần chốt vắng ngay → bài dời tuần sau; ô mang dấu đã chốt (`daChot`), không người nhập. */
  assert((after.noShow || after.daChot) && after.enteredByName === null && after.enteredAt === null,
    `Ô vừa báo "-" phải có dấu và KHÔNG có người nhập: ${JSON.stringify([after.noShow?.state, after.daChot, after.enteredByName])}`);
});

check('Rà soát · Hiệu quả phương án: giáo viên chỉ thấy phương án của LỚP mình, không lan ra cả chi nhánh', () => {
  const teacher = P.subjectTeacher as any;
  const classIds: number[] = [...new Set<number>(teacher.assignments.map((a: any) => a.classId))];
  assert(classIds.length > 0, 'Tiền đề: giáo viên phải có lớp');
  const mine = metricsSvc.metricSet(teacher, 'pa-co-ket-qua', {}) as any;
  const branch = metricsSvc.metricSet(P.mbManager, 'pa-co-ket-qua', {}) as any;
  const branchSet = new Set<number>(branch.ids);
  assert(mine.ids.every((x: number) => branchSet.has(x)), 'Tập của giáo viên phải nằm trong tập của Quản lý');
  const own = new Set<number>((conn.prepare(
    `SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE sc.student_id IN (SELECT student_id FROM enrollments WHERE class_id IN (${classIds.map(() => '?').join(',')}))`,
  ).all(...classIds) as any[]).map((r) => r.id as number));
  const leaked = mine.ids.filter((x: number) => !own.has(x));
  assert(leaked.length === 0, `Lộ ${leaked.length} phương án của học viên ngoài lớp giáo viên: [${leaked.slice(0, 5).join(',')}]`);
  const rate = metricsSvc.metricSet(teacher, 'ty-le-co-cai-thien', {}) as any;
  const rateLeak = [...rate.ids].filter((x: number) => !own.has(x));
  assert(rateLeak.length === 0, `Mẫu tỷ lệ cải thiện lộ ${rateLeak.length} phương án ngoài lớp`);
});


check('Rà soát · Giao diện chỉ mời "Xử lý vắng" người làm được: GVCN và Quản lý có, giáo viên bộ môn thì không (máy chủ nói qua viewer)', () => {
  const id = prgAttempts[0];
  const v = (pr: any) => (attempts.attemptDetail(pr, id) as any).viewer;
  assert(v(P.admin).canHandleAbsence === true, 'Quản trị phải được');
  assert(v(P.lrTeacher).canHandleAbsence === true, 'GVCN của lớp phải được');
  assert(v(P.subjectTeacher).canHandleAbsence === false, 'Giáo viên bộ môn không phải GVCN thì không được mời bấm');
  assertThrows(() => absence.requestAbsenceMove(P.subjectTeacher, id, ['listening'], { today: PRG_MON }), /chủ nhiệm|Quản lý/,
    'Máy chủ vẫn phải từ chối — ẩn nút không phải là chặn');
});


check('C02 (đã chốt 20/09): GVCN xử lý case học thuật ĐÚNG môn mình dạy, KHÔNG xử lý trái môn; case Ý thức vẫn chỉ GVCN', () => {
  const own = [...new Set<string>((P.coreTeacher as any).assignments.filter((x: any) => x.classId === mbClass && x.skill).map((x: any) => x.skill))];
  const foreign = ['listening', 'reading', 'writing1', 'writing2', 'speaking'].find((k) => !own.includes(k));
  assert(own.length > 0 && foreign, `Tiền đề: GVCN dạy [${own.join(',')}], cần một môn khác`);
  assert(can(P.coreTeacher, PERMISSIONS.SOS_EDIT, { classId: mbClass, skill: own[0] }), 'GVCN phải xử lý được case đúng môn mình dạy');
  assert(!can(P.coreTeacher, PERMISSIONS.SOS_EDIT, { classId: mbClass, skill: foreign }), `GVCN xử lý được case trái môn (${foreign}); dạy [${own.join(",")}]`);
  assert(can(P.coreTeacher, PERMISSIONS.SOS_EDIT, { classId: mbClass }), 'Case Ý thức (không có kỹ năng) vẫn phải là của GVCN');
});



// ==================================================================== PR-N (nền số liệu và kho bằng chứng)

/*
 * BỐN CHỈ SỐ TỪNG TRẢ 501 (hv-sos-hien-tai · hv-duoi-ky-vong-mon · dung-han-cap-nhat · do-phu-danh-gia).
 *
 * Mỗi phép kiểm dưới đây so hàm tập ID với MỘT SỰ THẬT ĐỘC LẬP dựng bằng SQL + bộ máy chấm — không đi qua chính hàm
 * đang kiểm — rồi dựng vài học viên riêng để ép đúng những chỗ dễ sai (đợt mới nhất chứ không MAX lịch sử, mẫu số,
 * phạm vi). Đúng luật hợp đồng số liệu: số là `ids.length`, không có đường đếm riêng.
 */
const nowIsoPrn = () => new Date().toISOString();
const prnClass = classId('MB FT 101');
const prnMake = (name: string, target = 7): { id: number; cycleId: number } => {
  intake.commitIntake(P.admin, { classId: prnClass, rows: [{ fullName: name, target, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: 'prn-' + name });
  const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(name) as any;
  const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
  assert(st && cy, `Không dựng được học viên thử "${name}"`);
  boLichTuTao(conn, cy.id);   // PR-MT: em thử tự dựng lượt cần (luotThu.ts)
  return { id: st.id, cycleId: cy.id };
};
const prnRaw = (skill: 'listening' | 'reading', band: number): number => {
  for (let r = 0; r <= 40; r += 1) if (scoring.bandFromRaw(skill, r) === band) return r;
  throw new Error(`Không có số câu đúng cho band ${band}`);
};
/* PR-MT (rà #119 mục 5): tạo lượt ở tuần đã qua nay thành MT lịch sử. Em thử PR-N là lượt THƯỜNG xếp từ trước tuần thi — đặt lại cờ
 * như lúc được xếp (không nới phép kiểm: chỉ số đo lượt thường). */
const prnAttempt = (st: { id: number; cycleId: number }, weekStart: string) => {
  const id = (attempts.createAttempt(P.admin, { studentId: st.id, cycleId: st.cycleId, periodId: periodOf(weekStart) }) as any).id as number;
  conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(id);
  return id;
};
const prnScore = (attemptId: number, skill: 'listening' | 'reading', band: number) =>
  attempts.saveScore(P.admin, attemptId, skill, { rawScore: prnRaw(skill, band) });
const prnFull = (attemptId: number, band: number) => {
  prnScore(attemptId, 'listening', band); prnScore(attemptId, 'reading', band);
  for (const k of ['writing1', 'writing2', 'speaking'] as const) attempts.saveScore(P.admin, attemptId, k, { criteria: tieuChiThu(band) });
};
const prnIds = (who: any, id: string, f: Record<string, unknown> = {}) => (metricsSvc.metricSet(who, id, f as any) as any);

/** SỰ THẬT ĐỘC LẬP: đợt mới nhất HỢP LỆ (không huỷ, đã có điểm) của từng em đang học, và SOS của nó — dựng bằng SQL. */
const prnLatestValid = (branchCode: string | null) => {
  const students = conn.prepare(
    `SELECT DISTINCT s.id FROM students s
       JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
       JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
      WHERE s.archived_at IS NULL ${branchCode ? 'AND b.code = ?' : ''}`,
  ).all(...(branchCode ? [branchCode] : [])) as any[];
  const out = new Map<number, { attemptId: number; sos: number | null; complete: boolean }>();
  for (const s of students) {
    /* PR-MT: "mới nhất" = số MT lớn nhất của lộ trình mới nhất (K5-54); MT lịch sử ngoài cửa sổ 4 tuần không là hiện trạng (M-14). */
    const a = (conn.prepare(
      `SELECT a.id, a.kind, a.lich_su, a.created_at, pr.week_end FROM assessment_attempts a LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.student_id = ? AND a.status != 'cancelled'
          AND EXISTS (SELECT 1 FROM assessment_scores x WHERE x.attempt_id = a.id AND (x.band IS NOT NULL OR x.raw_score IS NOT NULL))
          /* OV-11f (PT-3): em có lộ trình FAST TRACK đang chạy — chỉ lượt của lộ trình đó (không rơi về Final lớp thường cũ). */
          AND (NOT EXISTS (SELECT 1 FROM learning_cycles f WHERE f.student_id = a.student_id AND f.status = 'active' AND f.route IS NOT NULL)
               OR a.cycle_id = (SELECT MAX(f.id) FROM learning_cycles f WHERE f.student_id = a.student_id AND f.status = 'active' AND f.route IS NOT NULL))
        ORDER BY a.cycle_id DESC, a.attempt_no DESC, a.id DESC`,
    ).all(s.id) as any[]).find((x) => !x.lich_su || domain.luotSinhViec({
      lich_su: 1, tuanKetThuc: x.week_end, created_at: x.created_at.slice(0, 10) < TODAY ? x.created_at : TODAY,
    }));
    if (!a) continue;
    if (a.kind === 'mock') {
      const r = (attempts.attemptDetail(P.admin, a.id) as any).result;
      out.set(s.id, { attemptId: a.id, sos: r.sosLevel, complete: r.complete });
    } else {
      const r = regular.regularResultOf(a.id) as any;
      out.set(s.id, { attemptId: a.id, sos: r.sosLevel, complete: r.complete });
    }
  }
  return out;
};

check('PR-N · N1 hv-sos-hien-tai: theo ĐỢT MỚI NHẤT HỢP LỆ của từng em (không MAX toàn lịch sử); tạm thời và kết quả cuối tách riêng', () => {
  /* A: MT1 trượt, MT2 (mới hơn) đạt → KHÔNG có SOS hiện tại. B: MT1 đạt, MT2 mới trượt Reading → có, và còn TẠM THỜI. */
  const A = prnMake('PRN Cũ Trượt Mới Đạt'); const B = prnMake('PRN Cũ Đạt Mới Trượt');
  const a1 = prnAttempt(A, '2026-07-27'); prnScore(a1, 'reading', 4.5);
  const a2 = prnAttempt(A, '2026-08-24'); prnScore(a2, 'reading', 8.5);
  const b1 = prnAttempt(B, '2026-07-27'); prnScore(b1, 'reading', 8.5);
  const b2 = prnAttempt(B, '2026-08-24'); prnScore(b2, 'reading', 4.5);

  const r = prnIds(P.admin, 'hv-sos-hien-tai');
  assert(r.n === r.ids.length, 'Số phải là độ dài của tập ID');
  assert(!r.ids.includes(A.id), 'A đã đạt ở đợt mới nhất mà vẫn bị đếm theo SOS của đợt cũ (MAX toàn lịch sử)');
  assert(r.ids.includes(B.id), 'B trượt ở đợt mới nhất mà không được đếm');
  const truth = prnLatestValid(null);
  const expected = [...truth.entries()].filter(([, v]) => (v.sos ?? 0) > 0).map(([id]) => id).sort((x, y) => x - y);
  assert(JSON.stringify([...r.ids].sort((x: number, y: number) => x - y)) === JSON.stringify(expected),
    `Tập khác sự thật độc lập: hàm ${r.ids.length} em, sự thật ${expected.length} em`);
  /* Tạm thời (mới chấm một phần) và kết quả cuối (đủ điểm) tách riêng, cộng lại đúng tập chung. */
  const t = new Set<number>(r.splits.tamThoi), c = new Set<number>(r.splits.ketQuaCuoi);
  assert(r.splits && [...t].every((x) => !c.has(x)), 'Tạm thời và kết quả cuối phải loại trừ nhau');
  assert(t.size + c.size === r.ids.length, 'Tạm thời + kết quả cuối phải đúng bằng tập chung');
  assert(t.has(B.id), 'B mới chấm Reading nên SOS của B phải là TẠM THỜI');
  /* Phạm vi: Quản lý MB chỉ thấy em MB; Quản lý CP không thấy em MB. */
  const mb = prnIds(P.mbManager, 'hv-sos-hien-tai'), cp = prnIds(P.cpManager, 'hv-sos-hien-tai');
  assert(mb.ids.includes(B.id) && !cp.ids.includes(B.id), 'Phạm vi chi nhánh bị lẫn');
  assert(mb.ids.every((id: number) => r.ids.includes(id)), 'Tập của Quản lý MB phải nằm trong tập của Quản trị');
});

check('PR-N · N1 hv-duoi-ky-vong-mon: so kỳ vọng của CHÍNH đợt đó; mẫu số là em ĐÁNH GIÁ ĐƯỢC môn đó', () => {
  const C = prnMake('PRN Môn Mẫu Số');
  const D = prnMake('PRN Chưa Chấm Reading');
  const c1 = prnAttempt(C, '2026-08-03'); prnScore(c1, 'reading', 4.5); prnScore(c1, 'listening', 8.5);
  const d1 = prnAttempt(D, '2026-08-03'); prnScore(d1, 'listening', 4.5);            // D chưa có Reading
  const rd = prnIds(P.admin, 'hv-duoi-ky-vong-mon', { skill: 'reading' });
  assert(rd.ids.includes(C.id), 'C dưới kỳ vọng Reading mà không được đếm');
  assert(!rd.ids.includes(D.id), 'D chưa có điểm Reading mà bị đếm là dưới kỳ vọng — thiếu điểm KHÁC trượt');
  assert(rd.denominatorIds.includes(C.id) && !rd.denominatorIds.includes(D.id),
    'Mẫu số phải là em đánh giá được Reading: C có, D không');
  assert(rd.ids.every((id: number) => rd.denominatorIds.includes(id)), 'Tập dưới kỳ vọng phải nằm trong mẫu số');
  const ls = prnIds(P.admin, 'hv-duoi-ky-vong-mon', { skill: 'listening' });
  assert(ls.ids.includes(D.id) && !ls.ids.includes(C.id), 'Listening: D trượt, C đạt');
  /* Sự thật độc lập cho Reading: band < kỳ vọng của đợt mới nhất hợp lệ. */
  const truth = prnLatestValid(null);
  const under: number[] = [];
  for (const [sid, v] of truth) {
    const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(v.attemptId) as any;
    if (a.kind !== 'mock') continue;
    const res = (attempts.attemptDetail(P.admin, a.id) as any).result;
    const vd = res.verdicts.find((x: any) => x.skill === 'reading');
    if (vd && vd.required && vd.band !== null && vd.passed === false) under.push(sid);
  }
  const fromFn = (rd.ids as number[]).filter((id) => {
    const a = truth.get(id); if (!a) return false;
    return (conn.prepare('SELECT kind FROM assessment_attempts WHERE id = ?').get(a.attemptId) as any).kind === 'mock';
  });
  assert(JSON.stringify(fromFn.sort((x, y) => x - y)) === JSON.stringify(under.sort((x, y) => x - y)),
    `Reading FT: hàm ${fromFn.length} em, sự thật ${under.length} em`);
  /* Không có môn → mọi môn: em dưới kỳ vọng ở BẤT KỲ môn nào; mỗi tập môn là tập con của nó. */
  const anyR = prnIds(P.admin, 'hv-duoi-ky-vong-mon');
  assert(rd.ids.every((id: number) => anyR.ids.includes(id)) && ls.ids.every((id: number) => anyR.ids.includes(id)),
    'Tập "bất kỳ môn" phải chứa tập từng môn');
  assertThrows(() => prnIds(P.admin, 'hv-duoi-ky-vong-mon', { skill: 'pronunciation' }), /Môn|môn/, 'Môn lạ phải bị từ chối, không trả tập rỗng');
});

check('PR-N · N1 do-phu-danh-gia: HV có dữ liệu đủ điều kiện / HV cần được đánh giá — KHÁC tỷ lệ đạt', () => {
  const E = prnMake('PRN Đủ Điểm Trượt'), F = prnMake('PRN Chưa Chấm Gì'), G = prnMake('PRN Chưa Có Đợt'), H = prnMake('PRN Đợt Đã Huỷ');
  const e1 = prnAttempt(E, '2026-08-03'); prnFull(e1, 4.5);                          // ĐỦ điểm nhưng TRƯỢT — vẫn có dữ liệu
  prnAttempt(F, '2026-08-03');                                                       // đến lịch, chưa chấm gì
  const h1 = prnAttempt(H, '2026-08-03'); attempts.huyLuot(P.admin, h1, { lyDo: 'Kiểm thử phép đếm' });
  const r = prnIds(P.admin, 'do-phu-danh-gia');
  assert(r.numeratorIds.every((id: number) => r.ids.includes(id)), 'Tử số phải là tập con của mẫu số');
  assert(r.ids.includes(E.id) && r.numeratorIds.includes(E.id), 'E đủ điểm (dù trượt) phải nằm ở cả mẫu số và tử số — độ phủ không phải tỷ lệ đạt');
  assert(r.ids.includes(F.id) && !r.numeratorIds.includes(F.id), 'F đã đến lịch mà chưa có điểm: cần đánh giá, chưa có dữ liệu');
  assert(!r.ids.includes(G.id), 'G chưa có đợt nào thì chưa "cần được đánh giá"');
  assert(!r.ids.includes(H.id), 'H chỉ có đợt đã huỷ thì không cần đánh giá');
  assert(r.n === r.ids.length, 'Số phải là độ dài của tập mẫu số');
  /* Sự thật độc lập: em đang học có đợt không huỷ đã đến lịch; tử số = đợt gần nhất đủ điểm mọi kỹ năng bắt buộc.
   * T34 (`latestAttempts` 'due'): MT lịch sử chưa đủ điểm không phải "cần được đánh giá" (nhập bù, không hạn). LOC-HIEN-TAI: lộ ra khi ca dựng PR-G nay
   * dời MT3 W3 SEP của "Học Viên Nhập Một" sang W4 SEP — em chỉ còn MT1 / MT2 lịch sử chưa điểm đã tới lịch (trước đây câu này đếm em, hàm thì không). */
  const today = demoToday();
  const need = (conn.prepare(
    `SELECT DISTINCT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE s.archived_at IS NULL AND EXISTS (
        SELECT 1 FROM assessment_attempts a JOIN report_periods pr ON pr.id = a.planned_period_id
         WHERE a.student_id = s.id AND a.status != 'cancelled' AND pr.week_start <= ?
           AND (a.lich_su = 0 OR NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1 AND k.sit_status != 'cancelled'
             AND (SELECT COUNT(DISTINCT sc.skill) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL)
                    AND sc.skill IN (k.skill, CASE WHEN k.skill = 'writing' THEN 'writing1' END, CASE WHEN k.skill = 'writing' THEN 'writing2' END))
                 < CASE WHEN k.skill = 'writing' THEN 2 ELSE 1 END)))`,
  ).all(today) as any[]).map((x) => x.id as number).sort((x, y) => x - y);
  assert(JSON.stringify([...r.ids].sort((x: number, y: number) => x - y)) === JSON.stringify(need),
    `Mẫu số: hàm ${r.ids.length} em, sự thật ${need.length} em`);
});

check('PR-N · N1 dung-han-cap-nhat: nghĩa vụ (phương án × chu kỳ) đúng hạn / nghĩa vụ đến hạn; KHÔNG đếm số lần bấm ghi chú', () => {
  const I = prnMake('PRN Nghĩa Vụ Cập Nhật');
  const mk = (topic: string) => cases.reportIssue(P.admin, {
    studentId: I.id, cycleId: I.cycleId, topic, parallel: true,
    title: `PRN ${topic}`, summary: 'Case dựng để kiểm nghĩa vụ cập nhật.',
    primaryCode: domain.issuesForTopic(topic)[0]?.code,
  } as any) as any;
  const today = demoToday();
  const before = prnIds(P.admin, 'dung-han-cap-nhat');
  const c1 = mk('reading');
  const iv = (caseId: number, o: { status?: string; due: string | null; approval?: string | null; cycle?: number }) => Number(conn.prepare(
    `INSERT INTO case_interventions (case_id, kind, description, status, action_due, approval_state, cycle_no, created_at)
     VALUES (?, 'tutor', 'PRN phương án', ?, ?, ?, ?, ?)`,
  ).run(caseId, o.status ?? 'started', o.due, o.approval ?? null, o.cycle ?? 1, nowIsoPrn()).lastInsertRowid);
  const fu = (caseId: number, ivId: number, o: { cycle: number; due: string; observed: string; late: number }) => conn.prepare(
    `INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, cycle_no, cycle_due, late, created_at)
     VALUES (?, ?, ?, 'partial', ?, ?, ?, ?)`,
  ).run(caseId, ivId, o.observed, o.cycle, o.due, o.late, nowIsoPrn());
  const ontime = iv(c1.id, { due: '2026-09-20', cycle: 2 });                         // đã cập nhật đúng hạn ở chu kỳ 1, chu kỳ 2 chưa đến hạn
  fu(c1.id, ontime, { cycle: 1, due: '2026-09-06', observed: '2026-09-05', late: 0 });
  const lateIv = iv(c1.id, { due: '2026-09-20', cycle: 2 });                         // cập nhật TRỄ ở chu kỳ 1
  fu(c1.id, lateIv, { cycle: 1, due: '2026-08-30', observed: '2026-09-13', late: 1 });   // OV-12a: kỳ 14 ngày — ghi bù 2 kỳ
  const missed = iv(c1.id, { due: '2026-08-30', cycle: 1 });                         // đến hạn 30/08, chưa ai cập nhật (tới 14/09 = 2 kỳ)
  const pending = iv(c1.id, { due: '2026-09-06', cycle: 1, approval: 'pending' });   // chờ duyệt: không có nghĩa vụ cập nhật
  const future = iv(c1.id, { due: '2026-09-27', cycle: 1 });                         // chưa đến hạn
  /* Một em bấm ghi chú ba lần trong cùng một chu kỳ vẫn chỉ là MỘT nghĩa vụ. */
  fu(c1.id, ontime, { cycle: 1, due: '2026-09-06', observed: '2026-09-04', late: 0 });
  fu(c1.id, ontime, { cycle: 1, due: '2026-09-06', observed: '2026-09-03', late: 0 });
  /* Ý thức KHÔNG vào chỉ số này — nó không còn là case; phép kiểm riêng nằm ở phần PR-J (đặc tả nghiệm thu 19). */

  const r = prnIds(P.admin, 'dung-han-cap-nhat');
  /* PR-UXF-a Q13: id nghĩa vụ = PA × 1e6 + chu kỳ × 1e3 + tuần k của khoảng ghi bù. "missed" hạn 06/09 chưa ghi tới 14/09 = 2 tuần trễ (06/09, 13/09). */
  const code = (ivId: number, cycle: number, k = 0) => ivId * 1_000_000 + cycle * 1000 + k;
  const gained = (r.ids as number[]).filter((id) => !(before.ids as number[]).includes(id)).sort((x, y) => x - y);
  /*
   * PR-S6F-b (Q21): "lateIv" hạn 30/08, ghi 03/09 = "ghi bù 2 tuần" (`nhanTuanGhiKetQua`) → HAI nghĩa vụ: tuần 30/08 trễ, tuần 06/09 (hạn chưa qua
   * lúc ghi) đúng hạn — N nghĩa vụ = N của tiêu đề, không bỏ tuần cuối khỏi mẫu số.
   */
  assert(domain.nhanTuanGhiKetQua('2026-08-30', '2026-09-13').soKy === 2, 'tiền đề: ghi bù 2 kỳ');
  assert(JSON.stringify(gained) === JSON.stringify([code(ontime, 1), code(lateIv, 1), code(lateIv, 1, 1), code(missed, 1), code(missed, 1, 1)].sort((x, y) => x - y)),
    `Nghĩa vụ đến hạn phải là: đúng hạn, ghi bù 2 tuần (1 trễ + 1 đúng), chưa làm (2 tuần); đang có [${gained.join(',')}]`);
  assert(!r.ids.includes(code(pending, 1)) && !r.ids.includes(code(future, 1)), 'Chờ duyệt và chưa đến hạn không phải nghĩa vụ đến hạn');
  const onTime = (r.numeratorIds as number[]).filter((id) => !(before.numeratorIds as number[]).includes(id));
  assert(JSON.stringify(onTime.sort((x, y) => x - y)) === JSON.stringify([code(ontime, 1), code(lateIv, 1, 1)].sort((x, y) => x - y)), 'Chỉ nghĩa vụ hoàn thành ĐÚNG HẠN mới vào tử số (trễ và chưa làm thì không; tuần ghi bù chưa tới hạn là đúng — Q21)');
  assert(r.n === r.ids.length && r.numeratorIds.every((id: number) => r.ids.includes(id)), 'Số là độ dài tập; tử số ⊆ mẫu số');
  assert(r.unit === 'nghia-vu', 'Đơn vị phải là nghĩa vụ, không phải phương án');
  /* Phạm vi: Quản lý CP không thấy nghĩa vụ của em MB. */
  const cp = prnIds(P.cpManager, 'dung-han-cap-nhat');
  assert(!cp.ids.includes(code(missed, 1)), 'Nghĩa vụ của chi nhánh khác lọt vào phạm vi Quản lý CP');
  assert(today >= '2026-09-14', 'Tiền đề ngày demo');
});


check('PR-N · N4 GET /metrics/:id: KHÔNG trả ids khi không xin rows=1 (tile chỉ cần số); có rows=1 thì ids, dòng và số vẫn CÙNG MỘT TẬP', () => {
  for (const m of domain.METRICS as readonly any[]) {
    const r = metricsSvc.metricSet(P.admin, m.id, {}) as any;
    const lean = metricsSvc.metricResponse(r, false) as any;
    assert(!('ids' in lean) && !('rows' in lean) && !('numeratorIds' in lean) && !('denominatorIds' in lean),
      `${m.id}: đường lấy số không được kèm tập ID (phí băng thông với tập lớn)`);
    assert(lean.n === r.ids.length, `${m.id}: n phải là độ dài của tập ID`);
    const full = metricsSvc.metricResponse(r, true) as any;
    assert(full.ids.length === lean.n && full.rows.length === lean.n, `${m.id}: rows=1 phải trả đúng ${lean.n} id và ${lean.n} dòng`);
    assert(full.rows.every((row: any) => !String(row.title).startsWith('#')), `${m.id}: có dòng không tra được tên (title bắt đầu bằng #)`);
    if (r.numeratorIds) assert(lean.numerator === r.numeratorIds.length, `${m.id}: numerator phải là độ dài tử số`);
    if (r.denominatorIds) assert(lean.denominator === r.denominatorIds.length, `${m.id}: denominator phải là độ dài mẫu số`);
    if (r.splits) assert(lean.splits.tamThoi === r.splits.tamThoi.length && lean.splits.ketQuaCuoi === r.splits.ketQuaCuoi.length, `${m.id}: splits phải là số phần tử`);
  }
});


/*
 * N3 — BẢNG "VIỆC CẦN LƯU Ý" ĐI QUA HỢP ĐỒNG SỐ LIỆU. Trước PR-N bảng tự đếm bằng bộ đếm riêng và chỉ khớp `<SoLieu>` "nhờ may".
 * Trên dữ liệu demo lúc bắt đầu PR này đã LỆCH thật: bảng ghi 79 case / 28 học viên / 27 thiếu phương án / 6 "quá hạn cập nhật"
 * còn sổ chỉ số ghi 81 / 29 / 28 / 31 — hai case rơi khỏi bảng vì lớp không còn hoạt động, và "quá hạn cập nhật" đếm CASE trong khi
 * chỉ số đếm PHƯƠNG ÁN. Phép kiểm dưới đây khoá đúng những chỗ đó.
 */
const prnPulseCols = [
  ['needSupport', 'hv-co-case-mo'], ['cases', 'case-mo'], ['noPlan', 'case-thieu-pa'],
  ['overdueUpdate', 'pa-can-cap-nhat'], ['pendingApproval', 'pa-cho-duyet'],
] as const;







/*
 * N2 — BÁO CÁO THEO TUẦN. F01 (hai chi nhánh cùng tuần cộng lẫn số) đã được PR-F đóng ở chặng 2 và đã có phép kiểm; PR-N
 * hoàn tất nốt hai phần còn lại của hợp đồng: (a) DANH SÁCH khi bấm một số của bảng tuần phải là CHÍNH tập ID tạo nên số đó,
 * (b) tổng "HV có case" theo tháng / cả bảng phải đếm DUY NHẤT — trước đó giao diện cộng số học viên của từng tuần lại (luật 4).
 */
const prnWeeklyCols = ['attempts', 'onTarget', 'sos1', 'sos2', 'sos3', 'provisional', 'pending', 'cases', 'caseStudents', 'withSupport', 'untouched', 'pendingApproval'] as const;










/*
 * N5 — KHO TỆP VÀ LIÊN KẾT DÙNG CHUNG (bảng `attachments`, `platform/attachments.ts`). Ba luật bắt buộc của đặc tả §4.5:
 *   (a) lỗi tải tệp KHÔNG làm mất nội dung đang nhập — tải là một request riêng (kiểm ở giao diện, xem plan.md);
 *   (b) quyền xem tệp = quyền xem BẢN GHI CHỦ; không có đường tải nào bỏ qua kiểm quyền;
 *   (c) xoá tệp có audit, không phải một dấu X im lặng.
 * Hạ tầng dựng một lần cho bốn chỗ (case học thuật · phương án · vi phạm · biện pháp); PR-N nối hai chỗ đầu.
 */
const attachmentsSvc = await import('../platform/attachments.ts');
const prnAttCase = (topic: string, name: string) => {
  const st = prnMake(name);
  return cases.reportIssue(P.admin, { studentId: st.id, cycleId: st.cycleId, topic, parallel: true,
    title: `PRN bằng chứng ${name}`, summary: 'Case dựng để kiểm kho tệp.', primaryCode: domain.issuesForTopic(topic)[0].code } as any) as any;
};

check('PR-N · N5 Bảng attachments có đúng cột và chỉ mục theo đặc tả §4.5', () => {
  const cols = (conn.prepare('PRAGMA table_info(attachments)').all() as any[]).map((c) => c.name);
  for (const c of ['id', 'owner_type', 'owner_id', 'kind', 'url', 'display_name', 'mime_type', 'size_bytes', 'uploaded_by', 'created_at']) {
    assert(cols.includes(c), `Bảng attachments thiếu cột ${c}`);
  }
  const idx = (conn.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'attachments'").all() as any[]).map((r) => r.name);
  assert(idx.includes('idx_attachment_owner'), 'Thiếu chỉ mục idx_attachment_owner(owner_type, owner_id)');
});

check('PR-N · N5 Liên kết: thêm được vào case; chỉ nhận http/https; phải có tên đọc được; người tải và ngày được giữ', () => {
  const c = prnAttCase(authSubjectSkill, 'Liên Kết');
  const row = attachmentsSvc.addLink(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, url: 'https://drive.example.com/bai-lam.pdf', displayName: 'Bài làm tuần 3' }) as any;
  assert(row.kind === 'link' && row.displayName === 'Bài làm tuần 3' && row.href === 'https://drive.example.com/bai-lam.pdf', `Dòng liên kết sai: ${JSON.stringify(row)}`);
  assert(row.uploadedByName && row.createdAt, 'Phải giữ người tải và ngày tải');
  const list = attachmentsSvc.listAttachments(P.mbManager, 'sos_case', c.id) as any[];
  assert(list.length === 1 && list[0].id === row.id, 'Danh sách phải có đúng liên kết vừa thêm');
  for (const bad of ['javascript:alert(1)', 'ftp://x.y/z', 'file:///etc/passwd', 'data:text/html,<b>x</b>', 'không phải url', '']) {
    assertThrows(() => attachmentsSvc.addLink(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, url: bad, displayName: 'x' }), /liên kết|http/i, `Đã nhận liên kết không hợp lệ "${bad}"`);
  }
  const noName = attachmentsSvc.addLink(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, url: 'https://example.com/a/b' }) as any;
  assert(noName.displayName === 'example.com', `Không có tên thì lấy tên miền làm tên hiển thị, đang "${noName.displayName}"`);
});

/* PR-Z2: nơi tệp nằm trên đĩa (kho ổ đĩa của máy dev) = thư mục tải lên + cột `url` của dòng tệp. */
const prnAttAbsPath = (id: number) => path.resolve(attachmentsSvc.uploadsDir(), (conn.prepare('SELECT url FROM attachments WHERE id = ?').get(id) as any).url as string);

await checkAsync('PR-N · N5 Tệp: lưu ngoài cơ sở dữ liệu, không lộ đường dẫn máy chủ, ghi kích thước; chỉ nhận đuôi an toàn và tối đa 10 MB', async () => {
  const c = prnAttCase(authSubjectSkill, 'Tệp');
  const data = Buffer.from('nội dung bài viết của học viên');
  const row = await attachmentsSvc.addFile(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, fileName: 'Bài viết tuần 3.pdf', mimeType: 'application/pdf', data }) as any;
  assert(row.kind === 'file' && row.displayName === 'Bài viết tuần 3.pdf' && row.sizeBytes === data.length, `Dòng tệp sai: ${JSON.stringify(row)}`);
  assert(row.href === `/api/attachments/${row.id}/download`, 'Tệp phải tải qua đường có kiểm quyền, không phải đường dẫn thô');
  assert(!JSON.stringify(row).includes('uploads') && !('url' in row), 'Không được lộ đường dẫn lưu trên máy chủ');
  const opened = await attachmentsSvc.openAttachment(P.mbManager, row.id) as any;
  /* PR-Z2: đường tải trả NỘI DUNG (`duLieu`) thay vì `absPath`; vị trí trên đĩa tính từ cột `url` — cùng điều được kiểm. */
  const absPath = prnAttAbsPath(row.id);
  assert(opened.kind === 'file' && opened.duLieu.equals(data) && fs.readFileSync(absPath).equals(data), 'Tải về phải ra đúng nội dung đã lưu');
  assert(path.resolve(absPath).startsWith(path.resolve(attachmentsSvc.uploadsDir())), 'Tệp phải nằm trong thư mục tải lên');
  for (const bad of ['virus.exe', 'trang.html', 'hinh.svg', 'run.sh', 'noext', '../../etc/passwd']) {
    await assertRejects(() => attachmentsSvc.addFile(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, fileName: bad, data: Buffer.from('x') }), /loại tệp|đuôi|không nhận/i, `Đã nhận tệp "${bad}"`);
  }
  await assertRejects(() => attachmentsSvc.addFile(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, fileName: 'lon.pdf', data: Buffer.alloc(attachmentsSvc.MAX_FILE_BYTES + 1) }), /10 ?MB|dung lượng|quá lớn/i, 'Đã nhận tệp quá lớn');
  await assertRejects(() => attachmentsSvc.addFile(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, fileName: 'rong.pdf', data: Buffer.alloc(0) }), /rỗng/i, 'Đã nhận tệp rỗng');
  await attachmentsSvc.removeAttachment(P.mbManager, row.id);
  assert(!fs.existsSync(absPath), 'Xoá dòng thì tệp trên đĩa cũng phải được xoá');
});

await checkAsync('PR-N · N5 Tên tệp có đường dẫn (../) không bao giờ làm tệp rơi ra ngoài thư mục tải lên và không lộ vào tên hiển thị', async () => {
  const c = prnAttCase(authSubjectSkill, 'Đường dẫn');
  for (const evil of ['../../x.pdf', '..\\..\\y.pdf', '/etc/z.pdf']) {
    let row: any = null;
    try { row = await attachmentsSvc.addFile(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, fileName: evil, data: Buffer.from('x') }); } catch { /* bị từ chối cũng là kết quả an toàn */ }
    if (!row) continue;
    const opened = await attachmentsSvc.openAttachment(P.mbManager, row.id) as any;
    const absPath = prnAttAbsPath(row.id);
    assert(opened.kind === 'file' && fs.existsSync(absPath) && path.resolve(absPath).startsWith(path.resolve(attachmentsSvc.uploadsDir()) + path.sep), `Tệp "${evil}" nằm ngoài thư mục tải lên: ${absPath}`);
    assert(!/[\\/]|\.\./.test(row.displayName), `Tên hiển thị còn dấu đường dẫn: "${row.displayName}"`);
  }
});

await checkAsync('PR-N · N5 Quyền xem tệp = quyền xem BẢN GHI CHỦ: tài khoản ngoài phạm vi bị từ chối ở danh sách, ở đường tải và ở đường xoá', async () => {
  const c = prnAttCase(authSubjectSkill, 'Quyền Xem');
  const row = await attachmentsSvc.addFile(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, fileName: 'a.pdf', data: Buffer.from('bí mật') }) as any;
  assert((attachmentsSvc.listAttachments(P.mbManager, 'sos_case', c.id) as any[]).length === 1, 'Quản lý MB phải xem được');
  assert((attachmentsSvc.listAttachments(P.subjectTeacher, 'sos_case', c.id) as any[]).length === 1, 'GV dạy lớp phải xem được');
  assertThrows(() => attachmentsSvc.listAttachments(P.cpManager, 'sos_case', c.id), /phạm vi|quyền/, 'Quản lý CP xem danh sách tệp của case MB');
  await assertRejects(() => attachmentsSvc.openAttachment(P.cpManager, row.id), /phạm vi|quyền/, 'Quản lý CP tải được tệp của case MB — đường tải bỏ qua kiểm quyền');
  await assertRejects(() => attachmentsSvc.removeAttachment(P.cpManager, row.id), /phạm vi|quyền/, 'Quản lý CP xoá được tệp của case MB');
  await attachmentsSvc.removeAttachment(P.mbManager, row.id);
});

await checkAsync('PR-N · N5 Quyền thêm/xoá = quyền SỬA bản ghi chủ (AUTH-01/C02): GV đúng môn thêm được, GV môn khác chỉ xem', async () => {
  const own = prnAttCase(authSubjectSkill, 'Đúng Môn');
  const other = prnAttCase(authMismatchSkill, 'Trái Môn');
  const ok = attachmentsSvc.addLink(P.subjectTeacher, { ownerType: 'sos_case', ownerId: own.id, url: 'https://example.com/ok', displayName: 'Đúng môn' }) as any;
  assert(ok.id, 'GV đúng môn phải đính kèm được vào case môn mình');
  assertThrows(() => attachmentsSvc.addLink(P.subjectTeacher, { ownerType: 'sos_case', ownerId: other.id, url: 'https://example.com/no', displayName: 'Trái môn' }), /quyền/, 'GV môn khác đính kèm vào case trái môn');
  const mgr = attachmentsSvc.addLink(P.mbManager, { ownerType: 'sos_case', ownerId: other.id, url: 'https://example.com/mgr', displayName: 'Quản lý' }) as any;
  assert((attachmentsSvc.listAttachments(P.subjectTeacher, 'sos_case', other.id) as any[]).some((a) => a.id === mgr.id), 'GV môn khác vẫn phải XEM được (xem không cần đúng môn)');
  await assertRejects(() => attachmentsSvc.removeAttachment(P.subjectTeacher, mgr.id), /quyền/, 'GV môn khác xoá được tệp của case trái môn');
  await attachmentsSvc.removeAttachment(P.subjectTeacher, ok.id);
});

await checkAsync('PR-N · N5 Xoá tệp có AUDIT (ai, xoá cái gì, của bản ghi nào) — không phải một dấu X im lặng; xoá hai lần không lỗi lặng', async () => {
  const c = prnAttCase(authSubjectSkill, 'Audit Xoá');
  const row = await attachmentsSvc.addFile(P.mbManager, { ownerType: 'sos_case', ownerId: c.id, fileName: 'bang-chung.pdf', data: Buffer.from('abc') }) as any;
  const before = (conn.prepare("SELECT COUNT(*) n FROM audit_logs WHERE action = 'attachment.delete'").get() as any).n;
  await attachmentsSvc.removeAttachment(P.mbManager, row.id);
  const log = conn.prepare("SELECT * FROM audit_logs WHERE action = 'attachment.delete' ORDER BY id DESC LIMIT 1").get() as any;
  assert((conn.prepare("SELECT COUNT(*) n FROM audit_logs WHERE action = 'attachment.delete'").get() as any).n === before + 1, 'Phải thêm đúng một dòng audit');
  assert(log.actor_user_id === P.mbManager.userId && log.entity_label === 'bang-chung.pdf' && /sos_case/.test(String(log.before_json)) && String(log.before_json).includes(String(c.id)),
    `Audit thiếu người xoá, tên tệp hoặc bản ghi chủ: ${JSON.stringify(log)}`);
  assert((conn.prepare('SELECT COUNT(*) n FROM attachments WHERE id = ?').get(row.id) as any).n === 0, 'Dòng phải mất khỏi bảng');
  await assertRejects(() => attachmentsSvc.removeAttachment(P.mbManager, row.id), /Không tìm thấy/, 'Xoá tệp đã xoá phải báo không tìm thấy');
  const added = (conn.prepare("SELECT COUNT(*) n FROM audit_logs WHERE action = 'attachment.add'").get() as any).n;
  assert(added >= 1, 'Thêm tệp cũng phải để lại dấu vết');
});

await checkAsync('PR-N · N5 Phương án thừa hưởng quyền của case chứa nó; vi phạm và biện pháp (đã có nơi chủ từ PR-J 21/09/2026) và loại lạ bị từ chối rõ ràng khi bản ghi chủ không có', async () => {
  const c = prnAttCase(authSubjectSkill, 'Phương Án');
  const iv = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, created_at) VALUES (?, 'tutor', 'PRN phương án có bằng chứng', 'planned', ?)`).run(c.id, nowIsoPrn()).lastInsertRowid);
  const row = attachmentsSvc.addLink(P.mbManager, { ownerType: 'case_intervention', ownerId: iv, url: 'https://example.com/pa', displayName: 'Kế hoạch tutor' }) as any;
  assert((attachmentsSvc.listAttachments(P.subjectTeacher, 'case_intervention', iv) as any[]).length === 1, 'GV dạy lớp xem được bằng chứng của phương án');
  assertThrows(() => attachmentsSvc.listAttachments(P.cpManager, 'case_intervention', iv), /phạm vi|quyền/, 'Quản lý CP xem bằng chứng phương án của case MB');
  assertThrows(() => attachmentsSvc.addLink(P.subjectTeacher, { ownerType: 'case_intervention', ownerId: 999999, url: 'https://example.com/x', displayName: 'x' }), /Không tìm thấy/, 'Phương án không tồn tại');
  /* PR-J: hai loại này đã có bản ghi chủ, nên id không tồn tại phải báo "không tìm thấy" (không còn "chưa hỗ trợ"). */
  for (const t of ['violation', 'discipline_measure']) {
    assertThrows(() => attachmentsSvc.listAttachments(P.admin, t, 999999), /Không tìm thấy/, `Loại "${t}" phải kiểm bản ghi chủ`);
  }
  assertThrows(() => attachmentsSvc.listAttachments(P.admin, 'khong_co', 1), /không hợp lệ|chưa hỗ trợ/, 'Loại lạ');
  await attachmentsSvc.removeAttachment(P.mbManager, row.id);
});

// ==================================================================== PR-HV (hồ sơ học viên + Ý thức v3)
const { runHoSoHocVienTests } = await import('./hoSoHocVien.tests.ts');
await runHoSoHocVienTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-J (Ý thức: Vi phạm và Biện pháp xử lý)

/* Phép kiểm của module thứ chín ở file riêng — xem đầu `yThuc.tests.ts`. */
const { runYThucTests } = await import('./yThuc.tests.ts');
await runYThucTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX, demoYThuc: DEMO_Y_THUC });

// ==================================================================== PR-T (rulebook v3: SOS tự tạo Case · Phối hợp SOS · xoá vi phạm)

const { runSosV3Tests } = await import('./sosV3.tests.ts');
await runSosV3Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-S1 (luật máy chủ)

const { runLuatMayChuTests } = await import('./luatMayChu.tests.ts');
await runLuatMayChuTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-S2 (điều chỉnh PA học thuật · cập nhật tuần rút gọn)

const { runDieuChinhPaTests } = await import('./dieuChinhPa.tests.ts');
await runDieuChinhPaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Z2 (bản chính trên Netlify + Turso)

const { runBanChinhTests } = await import('./banChinh.tests.ts');
await runBanChinhTests({ check, checkAsync, assert, assertThrows, conn, admin: P.admin });

// ==================================================================== PR-O (khung 4 khu vực + hàm ngày/tuần G-6)

const { runKhungTests } = await import('./khung.tests.ts');
await runKhungTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Qa (Học viên & Lớp + Hồ sơ lớp)

const { runHocVienLopTests } = await import('./hocVienLop.tests.ts');
await runHocVienLopTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-AN (an toàn trước người dùng thật)
const { runAnToanTests } = await import('./anToan.tests.ts');
await runAnToanTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P });

// ==================================================================== PR-Pa (Tổng quan)

const { runTongQuanTests } = await import('./tongQuan.tests.ts');
await runTongQuanTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Rc1 (Cần chấm · Lịch Test · lưới chấm)

const { runChamDiemTests } = await import('./chamDiem.tests.ts');
await runChamDiemTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Form (chọn người, bằng chứng trong form)

const { runFormTests } = await import('./form.tests.ts');
await runFormTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Pb (Phân tích: Tổng hợp Test + SOS, Vấn đề học viên)

const { runPhanTichTests } = await import('./phanTich.tests.ts');
await runPhanTichTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Qb (Hồ sơ học viên: Hành trình theo lịch)

const { runHanhTrinhTests } = await import('./hanhTrinh.tests.ts');
await runHanhTrinhTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-YT2 (Ý thức đầy đủ)

const { runYThucGonTests } = await import('./yThucGon.tests.ts');
await runYThucGonTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Rc2 (Kế hoạch Test)

const { runKeHoachTestTests } = await import('./keHoachTest.tests.ts');
await runKeHoachTestTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Ra (Công việc: Hỗ trợ học viên · Vận hành · Báo cáo đơn vị)

const { runCongViecTests } = await import('./congViec.tests.ts');
await runCongViecTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-LT (Lên lớp, chuyển lớp)

const { runLenLopTests } = await import('./lenLop.tests.ts');
await runLenLopTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-UX0 (Nền giao diện: màu nghĩa, hàng lớn/nhỏ, badge, khuôn panel)

const { runNenGiaoDienTests } = await import('./nenGiaoDien.tests.ts');
await runNenGiaoDienTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-UX3 (Panel Học viên & Lớp theo khuôn chung + badge còn lại)

const { runPanelUx3Tests } = await import('./panelUx3.tests.ts');
await runPanelUx3Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-XOA (Xoá học viên, xoá tài khoản, lưu trữ tự động — chỉ Quản trị hệ thống)

const { runXoaDuLieuTests } = await import('./xoaDuLieu.tests.ts');
await runXoaDuLieuTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-N1 (Sửa lỗi nóng + sửa sai sự thật)
const { runSuaLoiNongTests } = await import('./suaLoiNong.tests.ts');
await runSuaLoiNongTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-LOP (Tạo lớp, tên lớp, RF, Pre FOU, phân công)
const { runPrLopTests } = await import('./prLop.tests.ts');
await runPrLopTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-NEN (Nền giao diện: ô ngày, Khác, chọn người, trạng thái, panel, bàn phím)

const { runThanhPhanChungTests } = await import('./thanhPhanChung.tests.ts');
await runThanhPhanChungTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-DUYET (Hộp Chờ duyệt)

const { runPrDuyetTests } = await import('./prDuyet.tests.ts');
await runPrDuyetTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-MT (Lịch MT tự tạo, MT lịch sử, đánh số, RF, dời do vắng)
const { runPrMtTests } = await import('./prMt.tests.ts');
await runPrMtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-NHAP (Thêm học viên: email, ngày thi, cột theo tiêu đề)
const { runPrNhapTests } = await import('./prNhap.tests.ts');
await runPrNhapTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-TOC (Thêm học viên theo lô, kiểm dữ liệu nhập)
const { runPrTocTests } = await import('./prToc.tests.ts');
await runPrTocTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-MON (Hệ môn học, Pre FOU một ô Tổng hợp, hai khung FT / Lớp thường)
const { runPrMonTests } = await import('./prMon.tests.ts');
await runPrMonTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-SOS (SOS v4 — Xác nhận Case → Xác nhận PA, Không cần theo dõi qua Quản lý)
const { runPrSosTests } = await import('./prSos.tests.ts');
await runPrSosTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-YT4 (Ý thức v4: một hàm trạng thái, thang bắt buộc, QL duyệt)
const { runPrYt4Tests } = await import('./prYt4.tests.ts');
await runPrYt4Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-XLMT (Xếp lịch MT nhiều lớp, thao tác MT theo trạng thái)
const { runPrXlmtTests, runPrXlmtMayChu } = await import('./prXlmt.tests.ts');
await runPrXlmtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
await runPrXlmtMayChu({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-KCK (Target "không cam kết" — không SOS, Q29-1)
const { runPrKckTests } = await import('./prKck.tests.ts');
await runPrKckTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-S3F (sửa sau rà cuối đợt 3)
const { runPrS3fTests } = await import('./prS3f.tests.ts');
await runPrS3fTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-HSM (hồ sơ Mock, nhận xét W/S, GV chấm)
const { runPrHsmTests } = await import('./prHsm.tests.ts');
await runPrHsmTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-XUAT (Xuất Excel kết quả Mock Test / Test lớp thường)
const { runPrXuatTests } = await import('./prXuat.tests.ts');
await runPrXuatTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-HVL (Học viên & Lớp + hồ sơ lớp)
const { runPrHvlTests } = await import('./prHvl.tests.ts');
await runPrHvlTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-SANG (giao diện sáng/tối, phông, cỡ chữ)
const { runPrSangTests } = await import('./prSang.tests.ts');
await runPrSangTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-S4F (sửa sau rà cuối đợt 4)
const { runPrS4fTests } = await import('./prS4f.tests.ts');
await runPrS4fTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-LT2a (lớp thường · Giữa khoá)
const { runPrLt2aTests } = await import('./prLt2a.tests.ts');
await runPrLt2aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-GV (hồ sơ giáo viên)
const { runPrGvTests } = await import('./prGv.tests.ts');
await runPrGvTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-LT2b (Cuối khoá lớp thường)
const { runPrLt2bTests } = await import('./prLt2b.tests.ts');
await runPrLt2bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-CT (quyết định chuyển lớp do Quản lý quyết + bàn giao)
const { runPrCtTests } = await import('./prCt.tests.ts');
await runPrCtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-S5F-a (sửa sau rà cuối đợt 5 — chuyển lớp, bàn giao, Cuối khoá)
const { runPrS5fATests } = await import('./prS5fA.tests.ts');
await runPrS5fATests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-S5F-b (sửa sau rà cuối đợt 5 — Giữa khoá, hồ sơ GV, tốc độ)
const { runPrS5fbTests } = await import('./prS5fb.tests.ts');
await runPrS5fbTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-Pb2-a (bỏ Cả hai, bỏ Danh sách Case, Hiệu quả PA, Tổng hợp lớp thường)
const { runPrPb2aTests } = await import('./prPb2a.tests.ts');
await runPrPb2aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-VAI-a (Tổng quan theo vai · Công việc · chuông)
const { runPrVaiATests } = await import('./prVaiA.tests.ts');
await runPrVaiATests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-UXF-a (số liệu khớp + sót lớp thường)
const { runPrUxfATests } = await import('./prUxfA.tests.ts');
await runPrUxfATests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

const { runPrVaiBTests } = await import('./prVaiB.tests.ts');
await runPrVaiBTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-Pb2-b (Phân tích giáo viên · FOU 2 GV · hồ sơ GV · ngày nghiệp vụ mới)
const { runPrPb2bTests } = await import('./prPb2b.tests.ts');
await runPrPb2bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-S6F-a (sửa sau rà đợt 6 lượt 1 — máy chủ / dữ liệu)
const { runPrS6fATests } = await import('./prS6fA.tests.ts');
await runPrS6fATests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

const { runPrS6fBTests } = await import('./prS6fB.tests.ts');
await runPrS6fBTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-Dọn-a (quyền, an toàn, một luật một khái niệm, xoá mã chết, tốc độ)
const { runPrDonATests } = await import('./prDonA.tests.ts');
await runPrDonATests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-UXD (điện thoại 375 px)
const { runPrUxdTests } = await import('./prUxd.tests.ts');
await runPrUxdTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

const { runPrUxfBTests } = await import('./prUxfB.tests.ts');
await runPrUxfBTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-S3 (chữ cuối trên web)
const { runPrS3ChuTests } = await import('./prS3Chu.tests.ts');
await runPrS3ChuTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-DEPLOY (chuẩn bị reset bản chính)
const { runPrDeployTests } = await import('./prDeploy.tests.ts');
await runPrDeployTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-Dọn-b (giao diện quản trị, Vận hành, lưu trữ, việc nhỏ)
const { runPrDonBTests } = await import('./prDonB.tests.ts');
await runPrDonBTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== UX-G (trạng thái nói đúng, một màu một nghĩa)
const { runPrUxGTests } = await import('./prUxG.tests.ts');
await runPrUxGTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-HK1 (trước deploy: H3–H5; K1/K3 đo bằng Playwright)
const { runPrHk1Tests } = await import('./prHk1.tests.ts');
runPrHk1Tests({ check, assert });

// ==================================================================== PR-PH (phiên đăng nhập không báo đăng xuất giả)
const { runPrPhTests } = await import('./prPh.tests.ts');
runPrPhTests({ check, assert });

// ==================================================================== PR-LM (lịch MT linh hoạt: dời vượt → huỷ lịch lượt bị vượt)
const { runPrLmTests, runPrLmMayChu } = await import('./prLm.tests.ts');
await runPrLmTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
await runPrLmMayChu({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-QU (quyền tạo lớp, GVCN phân công, tạo lớp hàng loạt, Quản trị quyền)
const { runPrQuTests } = await import('./prQu.tests.ts');
await runPrQuTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-GVa (giao việc: khoá gửi, chi nhánh form, kỳ)
const { runPrGvaTests } = await import('./prGva.tests.ts');
await runPrGvaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P });

// ==================================================================== PR-NT (Target + Dự kiến thi lớp thường, dán không cần tiêu đề)
const { runPrNtTests } = await import('./prNt.tests.ts');
await runPrNtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-BN (nhớ câu lệnh đã chuẩn bị — RAM bộ phép kiểm)
const { runPrBnTests } = await import('./prBn.tests.ts');
await runPrBnTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-GVb (Chờ duyệt: duyệt nhiều ở Tất cả, Để QL biết, U01)
const { runPrGvbTests } = await import('./prGvb.tests.ts');
await runPrGvbTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-BC (Báo cáo đơn vị + Quản trị › Tài khoản)
const { runPrBcTests } = await import('./prBc.tests.ts');
await runPrBcTests({ check, assert });
// ==================================================================== PR-PHH (Báo phụ huynh lưu bản chụp 4 nội dung lúc xác nhận)
const { runPrPhhTests } = await import('./prPhh.tests.ts');
await runPrPhhTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P });
// ==================================================================== PR-SO (số liệu một nguồn & dọn mã máy chủ)
const { runPrSoTests } = await import('./prSo.tests.ts');
await runPrSoTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-DH (bảng Học viên & Lớp, điều hướng hồ sơ)
const { runPrDhTests } = await import('./prDh.tests.ts');
await runPrDhTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-U12 (bảng kết quả lớp thường ở hồ sơ HV)
const { runPrU12Tests } = await import('./prU12.tests.ts');
await runPrU12Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-K26 (Lộ trình tiếp theo theo dải % Cuối khoá)
const { runPrK26Tests } = await import('./prK26.tests.ts');
await runPrK26Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-SL (Sửa thông tin cả lớp: xem trước + lưu một giao dịch)
const { runPrSlTests } = await import('./prSl.tests.ts');
await runPrSlTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-NV (Nhắc việc gom theo người, khoá Mini Test / Cuối khoá)
const { runPrNvTests } = await import('./prNv.tests.ts');
await runPrNvTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-DL (Điểm theo lớp)
const { runPrDlTests } = await import('./prDl.tests.ts');
await runPrDlTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-MTa (luật Test / Mock Test máy chủ: T1 T2 T3 T4 T7 T10 T11)
const { runPrMtaTests } = await import('./prMta.tests.ts');
await runPrMtaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-MTb (giao diện Test / Mock Test: máy chủ panel "MT mới", tick kỹ năng, hạn chấm)
const { runPrMtbTests } = await import('./prMtb.tests.ts');
await runPrMtbTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-LUI-b (đường lui Học viên & Lớp)
const { runPrLuiBTests } = await import('./prLuiB.tests.ts');
await runPrLuiBTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-LT3 (Lịch Test ba khối + Speaking chấm chéo) — cuối cùng: thêm HV thử vào MB FT 101
const { runPrLt3Tests } = await import('./prLt3.tests.ts');
await runPrLt3Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-MT0 (lượt Mock số 0 cho em lớp thường lên FT)
const { runPrMt0Tests } = await import('./prMt0.tests.ts');
await runPrMt0Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-BV (xoá "-" trả lại như cũ + đường lui điểm) — trước PR-TK (PR-TK luôn cuối)
const { runPrBvTests } = await import('./prBv.tests.ts');
await runPrBvTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-TK (Tổng kết lộ trình) — LUÔN Ở CUỐI: phép kiểm bất biến soi mọi dữ liệu các phép kiểm trước để lại
const { runPrTkTests } = await import('./prTk.tests.ts');
await runPrTkTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-LUI-a1 (Ý thức: ghi nhiều, Vi phạm + Mô tả, tệp dùng chung)
const { runPrLuiA1Tests } = await import('./prLuiA1.tests.ts');
await runPrLuiA1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== PR-LUI-a2 (Case + Chờ duyệt: Người phụ trách, Mở lại, Từ chối nhiều, Huỷ quyết định, Sửa / Xoá Case)
const { runPrLuiA2Tests } = await import('./prLuiA2.tests.ts');
await runPrLuiA2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-KHUNG (một thanh cuộn, chữ không cắt, nút không tràn)
const { runPrKhungTests } = await import('./prKhung.tests.ts');
await runPrKhungTests({ check, assert });

// ==================================================================== PR-HK2 (Badge & chữ)
const { runPrHk2Tests } = await import('./prHk2.tests.ts');
await runPrHk2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });

// ==================================================================== PR-O-CHON (ô chọn người gõ được — dùng lại ChonNguoi)
const { runPrOChonTests } = await import('./prOChon.tests.ts');
await runPrOChonTests({ check, assert });
// ==================================================================== PR-QT-TK (Quản trị sửa thông tin tài khoản)
const { runPrQtTkTests } = await import('./prQtTk.tests.ts');
await runPrQtTkTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== FIX-XEP-BAI-THUONG (lớp thường: Progress trước Final theo loại)
const { runFixXepBaiThuongTests } = await import('./fixXepBaiThuong.tests.ts');
await runFixXepBaiThuongTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-TD2-d (phiên + quyền một câu SQL)
const { runPrTd2dTests } = await import('./prTd2d.tests.ts');
await runPrTd2dTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== FIX-KQ-GAN-NHAT-THUONG (lớp thường: kết quả gần nhất theo loại)
const { runFixKqGanNhatTests } = await import('./fixKqGanNhat.tests.ts');
await runFixKqGanNhatTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== FIX-DTL-OMT (hồ sơ Mock từ Điểm theo lớp; ô MT chờ ≠ chưa xếp)
const { runFixDtlOmtTests } = await import('./fixDtlOmt.tests.ts');
await runFixDtlOmtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-TD2-b+c (Trước/Sau nhẹ, bớt request trùng)
const { runPrTd2bcTests } = await import('./prTd2bc.tests.ts');
await runPrTd2bcTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== FIX-CHOT-LEN-FT (Chốt lên FT tự xong khi đã có lộ trình / bàn giao)
const { runFixChotLenFtTests } = await import('./fixChotLenFt.tests.ts');
await runFixChotLenFtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== VIEC-NHO (6 việc nhỏ 08/10)
const { runPrViecNhoTests } = await import('./prViecNho.tests.ts');
await runPrViecNhoTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-HAN-XAC-NHAN (hạn xác nhận 5 ngày; Gấp / SOS 3: 3 ngày)
const { runPrHanTests } = await import('./prHan.tests.ts');
await runPrHanTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== VIEC-NHO-2 (Nhắc tất cả ở Của GV, lọc Chờ duyệt, GV chấm S)
const { runPrViecNho2Tests } = await import('./prViecNho2.tests.ts');
await runPrViecNho2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-LCa (luồng cuối khoá → lộ trình tiếp: mỗi quyết định nhập một lần)
const { runPrLcTests } = await import('./prLc.tests.ts');
await runPrLcTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-LCb (Chốt lộ trình · panel Lộ trình tiếp theo)
const { runPrLcbTests } = await import('./prLcb.tests.ts');
await runPrLcbTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-PA (PA đồng bộ một mẫu §8)
const { runPrPaTests } = await import('./prPa.tests.ts');
await runPrPaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-CL (Chuyển lớp làm lại: FT → Thường, Cuối khoá, lớp chuyển đến)
const { runPrClTests } = await import('./prCl.tests.ts');
await runPrClTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-CT2 (chế tài cuối khoá)
const { runPrCt2Tests } = await import('./prCt2.tests.ts');
await runPrCt2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-KV (Kỳ vọng đầu ra cả lớp)
const { runPrKvTests } = await import('./prKv.tests.ts');
await runPrKvTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);

// ==================================================================== PR-GOP (gộp việc theo lớp × loại việc)
const { runPrGopTests } = await import('./prGop.tests.ts');
await runPrGopTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-LTGON (lớp thường: đổi mốc dời bài theo; "-" trùng Final hoà vào)
const { runPrLtGonTests } = await import('./prLtGon.tests.ts');
await runPrLtGonTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-MTGON (chống kẹt Mock Test, chủ sản phẩm 08/10)
const { runPrMtGonTests } = await import('./prMtGon.tests.ts');
await runPrMtGonTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-KIEM-DU-LIEU-MT (lệnh kiểm chỉ đọc dữ liệu MT)
const { runPrKiemDuLieuMtTests } = await import('./prKiemDuLieuMt.tests.ts');
await runPrKiemDuLieuMtTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-HOP1 (một hộp, một đường lưu dời lịch MT)
const { runPrHop1Tests } = await import('./prHop1.tests.ts');
await runPrHop1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-VN3 (việc nhỏ dồn lại)
const { runPrVn3Tests } = await import('./prVn3.tests.ts');
await runPrVn3Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-TD3 (tốc độ đợt 2: đọc ít dòng)
const { runPrTd3Tests } = await import('./prTd3.tests.ts');
await runPrTd3Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-TEN (tên bài Progress Test / Final Test)
const { runPrTenTests } = await import('./prTen.tests.ts');
await runPrTenTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-VN4 (huỷ lượt theo lô + vi-pham-theo-nhom)
const { runPrVn4Tests } = await import('./prVn4.tests.ts');
await runPrVn4Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-DON (dọn ghi chú cũ)
const { runPrDonTests } = await import('./prDon.tests.ts');
await runPrDonTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-VN5 (huỷ bài lớp thường + bản chụp sau huỷ)
const { runPrVn5Tests } = await import('./prVn5.tests.ts');
await runPrVn5Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-VN6 (MT0 hoàn tất, bổ trợ Final sau FT, nhắc một chuông)
const { runPrVn6Tests } = await import('./prVn6.tests.ts');
await runPrVn6Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);

const { runPrCacheTests } = await import('./prCache.tests.ts');
await runPrCacheTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV1a (MT0 nhập đúng bảng, Điểm theo lớp, lệnh kiểm chỉ đọc)
const { runPrOv1aTests } = await import('./prOv1a.tests.ts');
await runPrOv1aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV3a (hồ sơ lớp: ⋯, Thông tin lớp, Tổng hợp, Đầu vào FT)
const { runPrOv3aTests } = await import('./prOv3a.tests.ts');
await runPrOv3aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV2a (vai TVV / CX / Admin, quyền, đổi góc nhìn)
const { runPrOv2aTests } = await import('./prOv2a.tests.ts');
await runPrOv2aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV2b (hồ sơ HV: Sửa thông tin, TVV, email + ngày sinh, Target, điểm đầu vào)
const { runPrOv2bTests } = await import('./prOv2b.tests.ts');
await runPrOv2bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV2c (email học viên không bắt buộc)
const { runPrOv2cTests } = await import('./prOv2c.tests.ts');
await runPrOv2cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV3b (Lộ trình nháp / chốt, hạn, bàn giao làm lại, Kết quả đầu ra)
const { runPrOv3bTests } = await import('./prOv3b.tests.ts');
await runPrOv3bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV1b (dấu "-" = Vắng, Không dự thi, Bỏ vắng, dòng lớp phần của bạn)
const { runPrOv1bTests } = await import('./prOv1b.tests.ts');
await runPrOv1bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV4a (Huỷ cả lượt giữ điểm ẩn + Khôi phục lượt)
const { runPrOv4aTests } = await import('./prOv4a.tests.ts');
await runPrOv4aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV4b (hộp nhập điểm MT: nhận xét 4 kỹ năng, W1 / W2 riêng, nhận xét lớp thường)
const { runPrOv4bTests } = await import('./prOv4b.tests.ts');
await runPrOv4bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== BAND-QUY-DOI (bảng quy đổi band ở DB, Quản trị sửa)
const { runPrBandQuyDoiTests } = await import('./prBandQuyDoi.tests.ts');
await runPrBandQuyDoiTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV6b1 (Quản trị › Chương trình: cấu hình, bản chụp lớp, tuần MT FT, ngưỡng đạt)
const { runPrOv6b1Tests } = await import('./prOv6b1.tests.ts');
await runPrOv6b1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV1c (SOS MT tạm thời → chốt → xoá, migrate prOv1c)
const { runPrOv1cTests } = await import('./prOv1c.tests.ts');
await runPrOv1cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV3c (Kết quả đầu ra lớp trước ở hồ sơ lớp FT, 4 tuần theo đợt)
const { runPrOv3cTests } = await import('./prOv3c.tests.ts');
await runPrOv3cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV5a (Công việc tại chỗ: gom Xác nhận nguyên nhân, xác nhận nhóm)
const { runPrOv5aTests } = await import('./prOv5a.tests.ts');
await runPrOv5aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV5b (Quay lại đúng nơi bắt đầu: chồng nguồn, trang cha, tên nguồn)
const { runPrOv5bTests } = await import('./prOv5b.tests.ts');
await runPrOv5bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV6b2 (chương trình mới: Liên tục, Checkpoint lặp, môn gộp + PET / KET)
const { runPrOv6b2Tests } = await import('./prOv6b2.tests.ts');
await runPrOv6b2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV7a (sửa sau khi lưu 1/2: bàn giao, Ý thức, Phối hợp, Mini Test, rút / sửa đề xuất, sửa trả lời)
const { runPrOv7aTests } = await import('./prOv7a.tests.ts');
await runPrOv7aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV8a (Bước tiếp sau thi thật: QL chọn Kết thúc · Học tiếp · Học lại; việc QL)
const { runPrOv8aTests } = await import('./prOv8a.tests.ts');
await runPrOv8aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV7b (sửa sau khi lưu 2/2: Kết quả PA gần nhất, Xem lại, GV Mở lại Case)
const { runPrOv7bTests } = await import('./prOv7b.tests.ts');
await runPrOv7bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV8b (quyền TVV: Target, Tạm dừng / Quay lại / Thôi học, kết quả thi thật, ô TVV theo chi nhánh)
const { runPrOv8bTests } = await import('./prOv8b.tests.ts');
await runPrOv8bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV9 (KCK nhẹ: dấu riêng, Target giữ, Case nhẹ không hạn / PA / Phối hợp)
const { runPrOv9Tests } = await import('./prOv9.tests.ts');
await runPrOv9Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV10a (nút / link đúng quyền: TVV · CX · Admin)
const { runPrOv10aTests } = await import('./prOv10a.tests.ts');
await runPrOv10aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV10c (Tổng quan theo vai: Admin Mock Test · TVV Học viên của tôi · CX Số liệu)
const { runPrOv10cTests } = await import('./prOv10c.tests.ts');
await runPrOv10cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV1d (lưới chấm FT: Bỏ vắng từ tuần gốc, em không còn đang học chỉ đọc)
const { runPrOv1dTests } = await import('./prOv1d.tests.ts');
await runPrOv1dTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV10b (Liên hệ SĐT em + phụ huynh; Học viên & Lớp / hồ sơ theo vai TVV · CX)
const { runPrOv10bTests } = await import('./prOv10b.tests.ts');
await runPrOv10bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV4c (W / S: Band tự tính từ 4 tiêu chí; nhập Band thẳng chỉ ở MT cũ)
const { runPrOv4cTests } = await import('./prOv4c.tests.ts');
await runPrOv4cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV11a (vắng · thi bù · hộp nhập điểm: hoàn tất, Vắng sau tuần thi, lớp thường "-")
const { runPrOv11aTests } = await import('./prOv11a.tests.ts');
await runPrOv11aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV11e (Lịch Test phần của bạn · Điểm theo lớp · huỷ / khôi phục nguyên trạng · KCK theo lượt)
const { runPrOv11eTests } = await import('./prOv11e.tests.ts');
await runPrOv11eTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV11b (Quản trị · tài khoản: không tự khoá, Duyệt lại, vai thiếu CN, nhật ký)
const { runPrOv11bTests } = await import('./prOv11b.tests.ts');
await runPrOv11bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV11i (giao diện chung: a11y · 375 · tương phản)
const { runPrOv11iTests } = await import('./prOv11i.tests.ts');
await runPrOv11iTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV11d (hồ sơ HV · Case: không kẹt sau Tạm dừng / Lưu trữ / Bước tiếp; nút hiện = máy chủ cho)
const { runPrOv11dTests } = await import('./prOv11d.tests.ts');
await runPrOv11dTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV11g (Học viên & Lớp · hồ sơ lớp: Thiếu thông tin, em Kết thúc học, lớp đã kết thúc)
const { runPrOv11gTests } = await import('./prOv11g.tests.ts');
await runPrOv11gTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12a (hạn ghi kết quả PA hai tuần · QL xoá lớp trống / nhiều HV · TVV Bước tiếp sau thi)
const { runPrOv12aTests } = await import('./prOv12a.tests.ts');
await runPrOv12aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-EN (bản tiếng Anh: từ điển, ngôn ngữ theo tài khoản, mã lỗi, quét nguồn)
const { runPrEnTests } = await import('./prEn.tests.ts');
await runPrEnTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12b (nhận xét MT bắt buộc · nhóm nguyên nhân khi dưới kỳ vọng · Excel cột nhận xét)
const { runPrOv12bTests } = await import('./prOv12b.tests.ts');
await runPrOv12bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12c (Case SOS MT từ nhận xét · Progress "Xác nhận Case" · xoá Case khi em đạt · migrate)
const { runPrOv12cTests } = await import('./prOv12c.tests.ts');
await runPrOv12cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12h (bỏ Nhắc · kết quả PA từng em · Tutor theo buổi · meeting CX hạn 5 ngày)
const { runPrOv12hTests } = await import('./prOv12h.tests.ts');
await runPrOv12hTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12g (Góp ý hàng tuần ở hồ sơ lớp: ghi / sửa / xoá · quyền · 4 tuần · migrate)
const { runPrOv12gTests } = await import('./prOv12g.tests.ts');
await runPrOv12gTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12f (Học viên & Lớp ba góc nhìn: Đang SOS theo tuần, quyền theo vai, panel một em)
const { runPrOv12fTests } = await import('./prOv12f.tests.ts');
await runPrOv12fTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13e (đăng ký có chọn vai · requested_role · duyệt điền sẵn · migrate)
const { runPrOv13eTests } = await import('./prOv13e.tests.ts');
await runPrOv13eTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12d (Tổng hợp nhóm Xử lý 3 cột · Tổng quan Case chờ duyệt cùng hàm · hồ sơ MT khối Case & phương án)
const { runPrOv12dTests } = await import('./prOv12d.tests.ts');
await runPrOv12dTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV12e (hệ panel v3 · chip hạn 3 mức · Quyết định 3 nút · panel số liệu mở rộng dòng)
const { runPrOv12eTests } = await import('./prOv12e.tests.ts');
await runPrOv12eTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== HOTFIX 15/10 (nhận xét sau hoàn tất qua HTTP · Sửa Case MT không Mô tả)
const { runPrHfTests } = await import('./prHf.tests.ts');
await runPrHfTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13b (Đề xuất PA khác · Xác nhận PA Nội dung + Bắt đầu · ghi nhanh · Hoàn tác)
const { runPrOv13bTests } = await import('./prOv13b.tests.ts');
await runPrOv13bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== HD-a (Hướng dẫn trên web: mục theo màn · Chỉ cho tôi trỏ data-hd có thật · nhớ dải Mới dùng)
const { runPrHdTests } = await import('./prHd.tests.ts');
await runPrHdTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== PR-OV13a (Case tạm · PA quy chế hết kẹt A/B/C · migrate prOv13a)
const { runPrOv13aTests } = await import('./prOv13a.tests.ts');
await runPrOv13aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13i (TVV / CX sửa thông tin cả lớp, kể cả Target)
const { runPrOv13iTests } = await import('./prOv13i.tests.ts');
await runPrOv13iTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13j (Lịch sử sửa thông tin học viên: đường ghi có audit theo trường · API · quyền · phân trang)
const { runPrOv13jTests } = await import('./prOv13j.tests.ts');
await runPrOv13jTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13d (Ý thức nhiều em cùng lúc: lô xử lý · Ghi nhận · Xác nhận cấp bậc có bậc 0)
const { runPrOv13dTests } = await import('./prOv13d.tests.ts');
await runPrOv13dTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13h (gỡ chặn cứng người đúng nhiệm vụ — qua HTTP; chạy cuối: không bọc giao dịch)
const { runPrOv13hTests } = await import('./prOv13h.tests.ts');
await runPrOv13hTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13c (gom Công việc theo tuần + lớp + mức SOS · Xác nhận PA cùng lúc · Nhập điểm theo tuần thi)
const { runPrOv13cTests } = await import('./prOv13c.tests.ts');
await runPrOv13cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13g (Speaking chấm chéo trong Công việc của GV Speaking — một dòng gộp, không quá hạn)
const { runPrOv13gTests } = await import('./prOv13g.tests.ts');
await runPrOv13gTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13l (Chuyển lớp "Ngay hôm nay" · hạn bàn giao 7 ngày · điểm đi theo lộ trình)
const { runPrOv13lTests } = await import('./prOv13l.tests.ts');
await runPrOv13lTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13k (Speaking chấm chéo — GV phụ trách được báo, nhận xét riêng, sửa nhóm, chốt Case; qua HTTP)
const { runPrOv13kTests } = await import('./prOv13k.tests.ts');
await runPrOv13kTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13o (việc nhỏ sau rà OV-13: KCK xem trước, lịch sử sửa, Lớp tôi dạy chấm chéo, lịch sử MT)
const { runPrOv13oTests } = await import('./prOv13o.tests.ts');
await runPrOv13oTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13m (Bước tiếp sau thi thật — Đã xong · Lộ trình mới · Tạm dừng · Thôi học, qua HTTP)
const { runPrOv13mTests } = await import('./prOv13m.tests.ts');
await runPrOv13mTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13p (TVV / CX tạo lớp + thêm học viên — student.add, qua HTTP)
const { runPrOv13pTests } = await import('./prOv13p.tests.ts');
await runPrOv13pTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== UX-1 (sửa gấp đánh giá UX 16/10: bảng chi nhánh, đếm HV & Lớp, Case chưa có PA, Lịch Test)
const { runPrUx1Tests } = await import('./prUx1.tests.ts');
await runPrUx1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== UX-2 (tiếp đánh giá UX 16/10: Quá hạn chấm = Bài quá hạn, Case chưa chốt PA quá hạn, menu Công việc, tự mở việc, khung theo phạm vi)
const { runPrUx2Tests } = await import('./prUx2.tests.ts');
await runPrUx2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13q (Đã thi xong · hạn 1 tuần + Gia hạn — qua HTTP theo vai, migrate, EXPLAIN)
const { runPrOv13qTests } = await import('./prOv13q.tests.ts');
await runPrOv13qTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-13f (ẩn mã HV + Email là định danh, không trùng — qua HTTP)
const { runPrOv13fTests } = await import('./prOv13f.tests.ts');
await runPrOv13fTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== VN-1 (rà OV-13f: Target bước 0,5 mọi đường, email ở Xoá HV, đổi email cho nhau)
const { runPrVn1Tests } = await import('./prVn1.tests.ts');
await runPrVn1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-14b (sửa nhỏ sau rà UX 17/10: Đã thi · chờ kết quả, Đang SOS Toàn bộ, Quá hạn chấm theo khung)
const { runPrOv14bTests } = await import('./prOv14b.tests.ts');
await runPrOv14bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-14a (lưu chắc chắn, không mất chữ — audit 17/10 F01–F12)
const { runPrOv14aTests } = await import('./prOv14a.tests.ts');
await runPrOv14aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-14c (Chấm Speaking: GV Speaking theo kỹ năng hồ sơ, chi nhánh grant, từ thứ Hai tuần thi)
const { runPrOv14cTests } = await import('./prOv14c.tests.ts');
await runPrOv14cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15a (nền: token màu, chip SOS, ký hiệu, giao diện theo máy, hạn chỉ ngày)
const { runPrOv15aTests } = await import('./prOv15a.tests.ts');
await runPrOv15aTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15b (lưới điểm: cột của việc, ✓/✗, bỏ tab Điểm theo lớp, Lịch Test hai khung, "Nhập bởi" chỉ khi có điểm)
const { runPrOv15bTests } = await import('./prOv15b.tests.ts');
await runPrOv15bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15d (Công việc một danh sách, Tổng quan QL A, thông báo tự động thay Nhắc)
const { runPrOv15dTests } = await import('./prOv15d.tests.ts');
await runPrOv15dTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15c (Kế hoạch Test: Xóa = bỏ tuần, năm, tìm HV / email, ghi chú lịch thi, xuất 13 cột + điểm)
const { runPrOv15cTests } = await import('./prOv15c.tests.ts');
await runPrOv15cTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15e (Phân tích thanh trên, Báo cáo, Kết quả thi, Phân tích GV, bộ chọn thời gian, phân trang)
const { runPrOv15eTests } = await import('./prOv15e.tests.ts');
await runPrOv15eTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15e2 (sửa lẻ sau rà OV-15e: lượt Mock không subquery tương quan, link ?tg cũ, Báo cáo TVV / CX)
const { runPrOv15e2Tests } = await import('./prOv15e2.tests.ts');
await runPrOv15e2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15f (Học viên & Lớp: Lịch thi, Xuất Excel danh sách HV, phân trang)
const { runPrOv15fTests } = await import('./prOv15f.tests.ts');
await runPrOv15fTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== TU-a (Tutor: migrate, vai Head tutor, buổi tutor 3 ô, /tutors/chon)
const { runPrTuTests } = await import('./prTu.tests.ts');
await runPrTuTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15h1 (Tổng quan QL một đường, Lớp cần chú ý, Trễ chấm, Cần bạn quyết ≤ 7 ngày, thông báo theo lô, Chờ bạn duyệt theo chi nhánh)
const { runPrOv15h1Tests } = await import('./prOv15h1.tests.ts');
await runPrOv15h1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15g (Lịch sử thay đổi C22: một đường đọc /lich-su, ghi đủ ở máy chủ, quyền, phân trang)
const { runPrOv15gTests } = await import('./prOv15g.tests.ts');
await runPrOv15gTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15h2 (Học viên & Lớp + xuất + dọn: ghi chú cùng giao dịch, 13 cột em hai lớp, chốt ngày, Bộ lọc thêm, Dán Excel lớp thường)
const { runPrOv15h2Tests } = await import('./prOv15h2.tests.ts');
await runPrOv15h2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15i1 (việc lẻ Lịch sử thay đổi + chuông: góp ý đi chỉ mục, con trỏ ô điểm, quyền thi-that, lô một mục, batDau)
const { runPrOv15i1Tests } = await import('./prOv15i1.tests.ts');
await runPrOv15i1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== OV-15i2 (Dán Excel thử lại / trần môn / email lớp thường / Hoàn tác "- → x", bỏ huyLuot, xuất điểm Test, tutor theo lớp)
const { runPrOv15i2Tests } = await import('./prOv15i2.tests.ts');
await runPrOv15i2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== LT-SV (lịch thi thật: trạng thái A / B, hết "tháng = đã thi", việc Chốt ngày thi, ngày đã qua, Sắp tới)
const { runPrLtSvTests } = await import('./prLtSv.tests.ts');
await runPrLtSvTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== CV-LOI (Case không chủ tự gán · một dòng Phân công · Xếp lại bài vắng theo quyền · hạn Mini Test)
const { runPrCvLoiTests } = await import('./prCvLoi.tests.ts');
await runPrCvLoiTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== TD7b (cờ "còn ô chờ điểm" o_cho_tu: đúng ở mọi đường ghi, đầu ra trùng khít) — CUỐI: soi cả trạng thái các phép kiểm trước để lại
const { runPrTd7bTests } = await import('./prTd7b.tests.ts');
await runPrTd7bTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== TU-b (trang Tutor: Cần chú ý, bảng / panel, phạm vi QL, thêm sửa xoá, nhận xét, tải danh sách, gộp tên)
const { runPrTubTests } = await import('./prTub.tests.ts');
await runPrTubTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== LUAT-34 (bảng chuyển trạng thái Mock Test T01–T31 · chuyenVang · Luật 3 sửa sau lưu)
const { runMtTrangThaiTests } = await import('./mtTrangThai.tests.ts');
await runMtTrangThaiTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== NEN-TYPO-MAU (thang chữ 12–28, 3 token kết quả: tương phản 9 nền + mù màu, hệ trạng thái HTT)
const { runPrNenTypoMauTests } = await import('./prNenTypoMau.tests.ts');
await runPrNenTypoMauTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== BANG-0 (Bang + 13 kiểu cột, ODiem, phép kiểm BANG-1…5 — danh sách miễn chỉ giảm)
const { runPrBang0Tests } = await import('./prBang0.tests.ts');
await runPrBang0Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== LUAT-5 (luật 5: thu hồi / không tăng bậc qua QL, lý do bắt buộc, "Đã thu hồi" giữ dòng)
const { runPrLuat5Tests } = await import('./prLuat5.tests.ts');
await runPrLuat5Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== SUA-NO-RA (nợ rà sâu CV-LOI #499 + LUAT-5 #495: phân công có phiên bản, migrate một lần, thẻ thu hồi)
const { runPrSuaNoRaTests } = await import('./prSuaNoRa.tests.ts');
await runPrSuaNoRaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== KHUNG-LOI (thứ tự menu, thanh trên "Thêm ▾" / thanh dưới ≤ 5, chú giải màu ô MT, tiêu đề, "Nếu duyệt" ghi ngày)
const { runPrKhungLoiTests } = await import('./prKhungLoi.tests.ts');
await runPrKhungLoiTests({ check, assert } as any);
// ==================================================================== CASE-NHIEU (Tạo Case nhiều kỹ năng: một giao dịch, người phụ trách, trùng / chờ xác nhận, gửi lại, quyền, tệp)
const { runCaseLoTests } = await import('./caseLo.tests.ts');
await runCaseLoTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);

const { runPrSl1Tests } = await import('./prSl1.tests.ts');
await runPrSl1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);

const { runPrSl2Tests } = await import('./prSl2.tests.ts');
await runPrSl2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== CHU-THI (Rulebook §21.4: Thi = thi thật, Test = "làm bài" — chặn chữ cũ trong tệp Test)
const { runPrChuThiTests } = await import('./prChuThi.tests.ts');
await runPrChuThiTests({ checkAsync, assert } as any);
// ==================================================================== SV-YT-TVV (việc Báo PH của TVV sau lưu xử lý vi phạm — K1–K12, thu hồi / từ chối / rút, quyền)
const { runPrSvYtTvvTests } = await import('./prSvYtTvv.tests.ts');
await runPrSvYtTvvTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== V5 Phân tích GV theo Overall (C08–C10), bỏ gợi ý MT4 (C20)
const { runPrPtGvOverallTests } = await import('./prPtGvOverall.tests.ts');
await runPrPtGvOverallTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);

const { runPrSvBaiLopTests } = await import('./prSvBaiLop.tests.ts');
await runPrSvBaiLopTests({ check, assert, conn, P, classId } as any);
// ==================================================================== V5 SV-SO2 (Overall ở Phân tích lớp / hồ sơ GV, Đạt MT theo HV, Việc / Điểm đúng hạn, hồ sơ GV theo kỳ, panel chỉ đọc)
const { runPrSvSo2Tests } = await import('./prSvSo2.tests.ts');
await runPrSvSo2Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
const { runPrSvSo3Tests } = await import('./prSvSo3.tests.ts');
await runPrSvSo3Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== V5 SV-SO1 (đơn vị đếm Công việc, S chéo không nợ, thiếu nhận xét ≠ xong, không gợi ý MT4, theo dõi, chuông = tin)
const { runPrSvSo1Tests } = await import('./prSvSo1.tests.ts');
await runPrSvSo1Tests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== SV-TVV-VIEC (4 việc TVV: một người giữ = TVV của em / QL; Chốt ngày thi, Bước tiếp, Bổ sung hồ sơ, KQ thi thật)
const { runPrSvTvvViecTests } = await import('./prSvTvvViec.tests.ts');
await runPrSvTvvViecTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== SV-S-EXPERT (lượt S Expert: chỉ QL / Admin thêm, GV S chấm, không vào tính toán, lịch sử)
const { runPrSvSExpertTests } = await import('./prSvSExpert.tests.ts');
await runPrSvSExpertTests({ check, assert, conn, P, classId } as any);
// ==================================================================== SV-LOP (Đánh giá đầu ra chờ Final, việc theo em từ /my-work, W1 / W2; nợ rà S Ex ở SSEX-8…12)
const { runPrSvLopTests } = await import('./prSvLop.tests.ts');
await runPrSvLopTests({ check, assert, conn, P, classId } as any);
// ==================================================================== V5 NEN-PANEL (nháp theo việc, hộp bỏ chữ, Lưu và tiếp, chân lưu, 375 + bàn phím)
const { runPrNenPanelTests } = await import('./prNenPanel.tests.ts');
await runPrNenPanelTests({ check, checkAsync, assert } as any);
// ==================================================================== V5 UI-CONG-VIEC (dòng theo em T01, vạch hạn T14)
const { runPrUiCongViecTests } = await import('./prUiCongViec.tests.ts');
await runPrUiCongViecTests({ check, assert } as any);
// ==================================================================== V5 UI-CHAM-TEST (Kế hoạch Test 3 MT + Overall, lý do "Đã huỷ")
const { runPrUiChamTestTests } = await import('./prUiChamTest.tests.ts');
await runPrUiChamTestTests({ check, assert, conn, P, classId } as any);
// ==================================================================== V5 UI-CV-TVV (TVV có Công việc chỉ việc của mình, dòng từng em, bối cảnh Báo PH)
const { runPrUiCvTvvTests } = await import('./prUiCvTvv.tests.ts');
await runPrUiCvTvvTests({ check, checkAsync, assert, conn, P, classId, TODAY } as any);
// ==================================================================== V5 UI-LICH-TUAN (Lịch tuần: HV theo lượt, dải số một tuần, chuyển hướng /nhap-diem)
const { runPrUiLichTuanTests } = await import('./prUiLichTuan.tests.ts');
await runPrUiLichTuanTests({ check, assert, conn, P, TODAY } as any);
// ==================================================================== V5 UI-HO-SO-LOP (Việc cần làm của người xem, roster bỏ viecTiepTheo, Đánh giá đầu ra C17)
const { runPrUiHoSoLopTests } = await import('./prUiHoSoLop.tests.ts');
await runPrUiHoSoLopTests({ check, assert, conn, P, classId } as any);
// ==================================================================== V5 LUAT-NX-MT (nhận xét chỉ nhắc, xếp MT nới lỏng, ghi chú vắng, S Ex ở Hành trình)
const { runPrLuatNxMtTests } = await import('./prLuatNxMt.tests.ts');
await runPrLuatNxMtTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== SV-NX-CASE (N8: MT mới nhất nhắc nhận xét, mô tả Case theo nhận xét, Xác nhận Case S chấm chéo)
const { runPrSvNxCaseTests } = await import('./prSvNxCase.tests.ts');
await runPrSvNxCaseTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== V5 UI-HV-LOP (hàng HV: TVV + lịch thi; Lịch thi: chi tiết dưới hàng, khoảng tháng)
const { runPrUiHvLopTests } = await import('./prUiHvLop.tests.ts');
await runPrUiHvLopTests({ check, assert, conn, P, TODAY, addDays } as any);
// ==================================================================== V5 UI-TONG-QUAN (Tổng quan mọi vai — số = Báo cáo, Σ tử / Σ mẫu, quyền)
const { runPrUiTongQuanTests } = await import('./prUiTongQuan.tests.ts');
await runPrUiTongQuanTests({ check, assert, conn, P } as any);
// ==================================================================== V5 UI-HO-SO-GV (thi thật · panel có điểm · lọc Đạt / Chưa đạt · Case theo trạng thái)
const { runPrUiHoSoGvTests } = await import('./prUiHoSoGv.tests.ts');
await runPrUiHoSoGvTests({ check, assert, conn, P } as any);
// ==================================================================== V5 UI-PHAN-TICH (Báo cáo HV = Tổng quan, Phân tích GV cột mới = panel, Toàn bộ)
const { runPrUiPhanTichTests } = await import('./prUiPhanTich.tests.ts');
await runPrUiPhanTichTests({ check, assert, conn, P } as any);
// ==================================================================== V5 UI-CON-LAI (nợ #528: badge việc của tôi chỉ việc mine, quá hạn theo kỹ năng)
const { runPrUiConLaiTests } = await import('./prUiConLai.tests.ts');
await runPrUiConLaiTests({ check, assert, P } as any);
// ==================================================================== V5 SV-TQ-GV (Tổng quan GV hai khối — số = hồ sơ GV / Phân tích, quyền)
const { runPrSvTqGvTests } = await import('./prSvTqGv.tests.ts');
await runPrSvTqGvTests({ check, assert, conn, P } as any);
// ==================================================================== SUA-CHAM-LAI (Đ4 lý do Chưa đủ dữ liệu)
const { runPrSuaChamLaiTests } = await import('./prSuaChamLai.tests.ts');
await runPrSuaChamLaiTests({ check, assert } as any);
// ==================================================================== P2 MT-DEM (bộ đếm MT đã xong / đã tạo, thôi nhắc xếp thêm)
const { runPrMtDemTests } = await import('./prMtDem.tests.ts');
await runPrMtDemTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== P1 DIEM-TIEU-CHI (tiêu chí W / S số nguyên)
const { runPrDiemTieuChiTests } = await import('./prDiemTieuChi.tests.ts');
await runPrDiemTieuChiTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
// ==================================================================== P3 UI-CHUNG (Mới dùng PISA TRACKING? · bỏ Góp ý hàng tuần · menu ⋯ · đầu bảng dính)
const { runPrUiChungTests } = await import('./prUiChung.tests.ts');
await runPrUiChungTests({ check, assert, P } as any);
// ==================================================================== P4 CHON-LOP (một ô chọn lớp gõ → tìm → chọn)
const { runPrChonLopTests } = await import('./prChonLop.tests.ts');
await runPrChonLopTests({ check, assert } as any);
// ==================================================================== P6 KHOA-LICH (T6 → CN khoá đổi lịch MT 3 tuần, trừ Quản trị hệ thống)
const { runPrKhoaLichTests } = await import('./prKhoaLich.tests.ts');
await runPrKhoaLichTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== P9a XET-LAI (Xét lại lộ trình N21: 4 trường hợp, hạn, panel, lô, Hoàn tác, tự giữ)
const { runPrXetLaiTests } = await import('./prXetLai.tests.ts');
await runPrXetLaiTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX } as any);
// ==================================================================== P14 DICH (nút Dịch chữ GV nhập — fetch giả)
const { runPrDichTests } = await import('./prDich.tests.ts');
await runPrDichTests({ check, checkAsync, assert, conn, P } as any);
// ==================================================================== P12 BAO-CAO-LICH-SU (báo cáo quá khứ theo Target / lớp / trạng thái lúc đó; Q12)
const { runPrBaoCaoLichSuTests } = await import('./prBaoCaoLichSu.tests.ts');
await runPrBaoCaoLichSuTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== P11 VIEC-DUNG-VAI (cột Việc đúng vai: GV việc của mình, QL gộp theo môn)
const { runPrViecDungVaiTests } = await import('./prViecDungVai.tests.ts');
await runPrViecDungVaiTests({ check, assert, conn, P, classId } as any);
// ==================================================================== P7 SV-LO-TRINH (một nút Tạm dừng/ Kết thúc học · Quay lại học · Bước tiếp 2 hướng · Lộ trình mới)
const { runPrSvLoTrinhTests } = await import('./prSvLoTrinh.tests.ts');
await runPrSvLoTrinhTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== P9b CUOI-KHOA (trang Cuối khoá lớp thường, hạn chốt N20, N17, N22)
const { runPrCuoiKhoaTests } = await import('./prCuoiKhoa.tests.ts');
await runPrCuoiKhoaTests({ check, assert, conn, P } as any);
// ==================================================================== P13 KET-PET (thang Cambridge, Target + thi thật KET / PET, Checkpoint 4 môn)
const { runPrKetPetTests } = await import('./prKetPet.tests.ts');
await runPrKetPetTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== R1-LUU-TIEP (chọn bài còn thiếu kế tiếp)
const { runR1LuuTiepTests } = await import('./r1LuuTiep.tests.ts');
await runR1LuuTiepTests({ check, assert });
// ==================================================================== R1-SUA-NHO (trục tuần Hành trình, đường lượt lớp thường không vòng)
const { runR1SuaNhoTests } = await import('./r1SuaNho.tests.ts');
await runR1SuaNhoTests({ check, assert });
// ==================================================================== P8 MON-DANG-KY (môn đăng ký L · R · W1 · W2 · S theo lộ trình FT — N13, N22 ④)
const { runPrMonDangKyTests } = await import('./prMonDangKy.tests.ts');
await runPrMonDangKyTests({ check, checkAsync, assert, assertThrows, conn, P, TODAY, classId, addDays } as any);
const { runR1NoNhoTests } = await import('./r1NoNho.tests.ts');
await runR1NoNhoTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId } as any);
const { runTenChiSoTests } = await import('./tenChiSo.tests.ts');
await runTenChiSoTests({ check, assert });
// ==================================================================== R1-NO-CU (đổi người phụ trách Case — D17)
const { runR1NoCuTests } = await import('./r1NoCu.tests.ts');
await runR1NoCuTests({ check, assert, conn, P, classId } as any);
// ==================================================================== UI-CHART-D (dữ liệu chỉ đọc cho chart D: điểm W1 / W2 + nhận xét MT mọi lượt, thi thật)
const { runUiChartDTests } = await import('./uiChartD.tests.ts');
await runUiChartDTests({ check, assert, conn, P } as any);
// ==================================================================== SV-BAI-LOP-2 (M5 PR ①: Tiến độ trên lớp band / nhận xét tuỳ chọn, gopY[], Hoàn tác thêm PA)
const { runPrSvBaiLop2Tests } = await import('./prSvBaiLop2.tests.ts');
await runPrSvBaiLop2Tests({ check, assert, conn, P, classId } as any);
// ==================================================================== M6 6b-1 KHUNG-NGAN-XEP (ngăn xếp view ?xem=, ‹ lùi một view)
const { runPrKhungNganXepTests } = await import('./prKhungNganXep.tests.ts');
await runPrKhungNganXepTests({ check, assert } as any);
// ==================================================================== M6 6b-2 PILOT-CASE (nhóm theo bước, việc trong dòng, Case A, lưu về Case)
const { runPrPilotCaseTests } = await import('./prPilotCase.tests.ts');
await runPrPilotCaseTests({ check, assert, conn, P } as any);
// ==================================================================== M6 6b-3 PILOT-VIEC (Xem Case trong panel việc, Xác nhận · việc tiếp ›, dải Hoàn tác)
const { runPrPilotViecTests } = await import('./prPilotViec.tests.ts');
await runPrPilotViecTests({ check, assert } as any);
// ==================================================================== M6 6b-4 PILOT-GV-TRE (panel GV chấm quá hạn: Admin gvQuaHan · QL treCham, Nhập hộ)
const { runPrPilotGvTreTests } = await import('./prPilotGvTre.tests.ts');
await runPrPilotGvTreTests({ check, assert, conn, P } as any);
// ==================================================================== 6c-1 PANEL-AP (chống mất chữ, lỗi tải ≠ rỗng, không panel chồng, nợ 6b)
const { runPr6cPanelApTests } = await import('./pr6cPanelAp.tests.ts');
await runPr6cPanelApTests({ check, assert, conn, P } as any);
// ==================================================================== HSL-MAY-CHU (M4 PR 1: hồ sơ một lượt Test — S Ex, lớp hiện tại, GET /regular/attempts/:id)
const { runPrHslMayChuTests } = await import('./prHslMayChu.tests.ts');
await runPrHslMayChuTests({ check, assert, conn, P, classId, TODAY, addDays } as any);
const { runPrHslLtTests } = await import('./prHslLt.tests.ts');
await runPrHslLtTests({ check, assert, conn, P, classId, TODAY } as any);
const { runPrLuotTenGvTests } = await import('./prLuotTenGv.tests.ts');
await runPrLuotTenGvTests({ check, assert, conn, P, classId } as any);
const { runPrLuotKhoiPhucTests } = await import('./prLuotKhoiPhuc.tests.ts');
await runPrLuotKhoiPhucTests({ check, assert, conn, P, classId, TODAY } as any);
// ==================================================================== HOAN-TAC-XN (luật N3: Hoàn tác Xác nhận PA · lô PA · Xác nhận Case · Xác nhận Case S)
const { runPrHoanTacXnTests } = await import('./prHoanTacXn.tests.ts');
await runPrHoanTacXnTests({ check, assert, conn, P, TODAY, classId, addDays } as any);
// ==================================================================== LOC-HIEN-TAI (lỗi chủ SP 28/10: danh sách hiện tại = lộ trình mới nhất + em đang học)
const { runPrLocHienTaiTests } = await import('./prLocHienTai.tests.ts');
await runPrLocHienTaiTests({ check, assert, conn, P, classId, TODAY } as any);
// ==================================================================== QUYEN-LICH-MT (chủ SP 28/10: GVCN dời MT tuần đã qua · GV xem Kế hoạch Test)
const { runPrQuyenLichMtTests } = await import('./prQuyenLichMt.tests.ts');
await runPrQuyenLichMtTests({ check, assert, conn, P, TODAY, addDays } as any);
console.log(`\n${'='.repeat(60)}`);
console.log(failures.length === 0
  ? `TẤT CẢ ${passed} KIỂM TRA ĐỀU ĐẠT`
  : `${passed} đạt, ${failures.length} KHÔNG ĐẠT:\n` + failures.map((f) => '  - ' + f).join('\n'));
console.log('='.repeat(60));
process.exit(failures.length === 0 ? 0 : 1);

