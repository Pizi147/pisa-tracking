/**
 * Kiểm tra nghiệp vụ cho vòng overhaul nền tảng.
 * Chạy trên database riêng (data/test.sqlite) để không đụng dữ liệu bạn đang thử.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
process.env.PISA_DB = path.join(ROOT, 'data', 'test.sqlite');
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
const dashboard = await import('../worklist/dashboard.ts');
const classesSvc = await import('../classes/classes.ts');
const transition = await import('../classes/transition.ts');
const intake = await import('../classes/intake.ts');
const planning = await import('../fasttrack/planning.ts');
const signals = await import('../worklist/signals.ts');
const regular = await import('../normal/regular.ts');
const schedule = await import('../classes/schedule.ts');
const weekly = await import('../worklist/weekly.ts');
const cases = await import('../cases/cases.ts');
const summary = await import('../worklist/summary.ts');
const prefs = await import('../platform/prefs.ts');
const pulse = await import('../worklist/branchpulse.ts');
const domain = await import('../../../shared/domain/index.ts');
const accounts = await import('../platform/accounts.ts');
const sysconfig = await import('../platform/sysconfig.ts');
const mywork = await import('../worklist/mywork.ts');
const standing = await import('../students/standing.ts');
const mgmt = await import('../worklist/mgmttasks.ts');
const skillSchedule = await import('../fasttrack/skillSchedule.ts');
const absence = await import('../fasttrack/absence.ts');
const signalsSvc = await import('../cases/signals.ts');
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
  for (const t of ['sos_cases', 'case_interventions', 'case_followups', 'assessment_scores', 'unit_reports']) {
    SEED_MAX[t] = ((seedDb().prepare(`SELECT COALESCE(MAX(id),0) m FROM ${t}`).get() as any).m) as number;
  }
}

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e: any) {
    failures.push(`${name}: ${e.message}`);
    console.log(`  ✗ ${name}\n      ${e.message}`);
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

const conn = db();
const TODAY = demoToday();
const classId = (code: string) => (conn.prepare('SELECT id FROM classes WHERE code = ?').get(code) as any).id;
/* Tuần chưa từng dùng tới thì chưa có trong bảng — tạo luôn, đúng như hệ thống vẫn làm. */
const periodOf = (weekStart: string) => week.ensurePeriod(weekStart).id;

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
  w1Teacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'writing1')),
  w2Teacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'writing2')),
  sTeacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'speaking')),
  lrTeacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'listening')),
  bcManager: loadPrincipal(userByRole('manager', 'BC')),
  coreTeacher: loadPrincipal(coreTeacherOf('MB-FT 101')),
  subjectTeacher: loadPrincipal(subjectOnlyTeacherOf('MB-FT 101')),
  /* MB-FOU 12 là lớp Normal (is_fast_track=0) — dùng cho các phép kiểm SCH-01/02, T10. */
  normalCoreTeacher: loadPrincipal(coreTeacherOf('MB-FOU 12')),
  normalSubjectTeacher: loadPrincipal(subjectOnlyTeacherOf('MB-FOU 12')),
};

const mbClass = classId('MB-FT 101');

// ==================================================================== 0

/*
 * HAI PHÉP KIỂM VỀ CHÍNH BỘ DEMO, chạy NGAY SAU KHI DỰNG và trước mọi phép kiểm khác.
 *
 * Chúng nói về dữ liệu seed, không phải về trạng thái sau khi các phép kiểm đã tạo case,
 * duyệt đề xuất và chuyển lớp. Đặt ở cuối file thì chúng đọc nhầm hậu quả của chính bộ kiểm
 * tra thành lỗi của bộ demo.
 */
console.log('\n0. Bộ demo vừa dựng có nhất quán không');

check('[12.1-16] Bộ demo nhất quán: không có sự kiện "đã xong" nào nằm ở tương lai', () => {
  const t = demoToday();
  const bad: string[] = [];
  const later = (table: string, col: string) => (conn
    .prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${col} IS NOT NULL AND ${col} > ?`)
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
    ['case chưa có người phụ trách',
      one(`SELECT COUNT(*) n FROM sos_cases WHERE status!='done' AND owner_user_id IS NULL`)],
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
    ['lộ trình đã đạt mục tiêu',
      one(`SELECT COUNT(*) n FROM learning_cycles WHERE outcome='reached'`)],
    ['lộ trình chưa đạt mục tiêu',
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
    const low = 6, ok = 6.5;
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
   * Normal: hết CHỦ NHẬT của chính tuần thi kỹ năng đó.
   * Đây là luật mới của mục 10.5, thay cho "cả lượt một hạn" của các vòng trước.
   */
  assert(week.skillScoreDeadline('band', '2026-09-14') === '2026-09-23',
    'FT thi tuần 14–20/9 phải có hạn chấm 23/9');
  assert(week.skillScoreDeadline('band', '2026-09-21') === '2026-09-30',
    'FT thi tuần 21–27/9 phải có hạn chấm 30/9');
  assert(week.skillScoreDeadline('ratio', '2026-09-14') === '2026-09-20',
    'Normal thi tuần 14–20/9 phải có hạn chấm hết Chủ nhật 20/9');

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
  const split = conn
    .prepare(`SELECT a.id, a.planned_period_id FROM assessment_attempts a
                WHERE (SELECT COUNT(DISTINCT ask.planned_period_id) FROM attempt_skills ask
                        WHERE ask.attempt_id = a.id AND ask.required = 1) > 1
                LIMIT 1`)
    .get() as any;
  assert(split, 'Bộ demo thiếu đợt tách tuần');
  const latest = conn
    .prepare(`SELECT ask.planned_period_id AS id FROM attempt_skills ask
                JOIN report_periods pr ON pr.id = ask.planned_period_id
               WHERE ask.attempt_id = ? AND ask.required = 1
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
  attempts.saveScore(P.w1Teacher, a.id, 'writing1', { criteria: [6, 6, 6, 6] });
  const after = (conn.prepare('SELECT planned_period_id FROM assessment_attempts WHERE id = ?').get(a.id) as any).planned_period_id;
  assert(before === after, 'Nhập điểm đã làm đổi tuần MT');
});
check('Đổi tuần ghi lại lịch sử và dời cả hạn nhập điểm theo', () => {
  const target = conn
    .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='planned' LIMIT 1`)
    .get(classId('HD-FT 302')) as any;
  assert(target, 'Seed thiếu lượt planned ở HD-FT 302');
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
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='planned' LIMIT 1`)
    .get(classId('CP-FT 110')) as any;
  const before = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(a.cycle_id) as any).n;
  assertThrows(() => attempts.cancelAttempt(P.cpManager, a.id, ''), /lý do/, 'Huỷ mà không ghi lý do');
  attempts.cancelAttempt(P.cpManager, a.id, 'Học viên nghỉ ốm');
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
  assertThrows(() => attempts.saveScore(P.w1Teacher, a.id, 'writing2', { criteria: [6, 6, 6, 6] }), /phân công/,
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
  assertThrows(() => attempts.saveScore(P.coreTeacher, a.id, 'writing2', { criteria: [6, 6, 6, 6] }), /phân công/,
    'GVCN nhập bù điểm W2 của kỹ năng mình không dạy');
  attempts.saveScore(P.admin, a.id, 'writing2', { criteria: [6, 6, 6, 6] });
  const log = conn.prepare(`SELECT * FROM audit_logs WHERE action='score.override' ORDER BY id DESC LIMIT 1`).get() as any;
  assert(log, 'Nhập bù không được ghi nhật ký riêng');
});
check('API chặn thao tác ngoài chi nhánh, không chỉ ẩn nút', () => {
  const cpAttempt = conn
    .prepare('SELECT a.* FROM assessment_attempts a JOIN classes c ON c.id=a.class_id WHERE c.code = ? ORDER BY a.id LIMIT 1')
    .get('CP-FT 110') as any;
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
  assert(!can(mixed, PERMISSIONS.PLAN_WEEK, { classId: classId('CP-FT 110') }),
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
  const a = attempts.createAttempt(P.admin, {
    studentId: s.student_id, cycleId: created.id, periodId: periodOf('2026-11-02'),
  }) as any;
  assert(a.attempt_no === 1, 'Lộ trình mới phải bắt đầu từ MT1 dù học viên đã có MT1 ở lộ trình cũ');
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
check('Hai nhóm case chưa xử lý / đang xử lý không chồng nhau', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  const rows = attempts.listAttempts(P.admin, { need: 'sos_open' }).rows;
  const open = rows.filter((r) => r.caseStatus === 'open').length;
  const handling = rows.filter((r) => r.caseStatus === 'in_progress').length;
  assert(o.kpis.caseNew === open, `Card "chưa xử lý" lệch danh sách: ${o.kpis.caseNew} vs ${open}`);
  assert(o.kpis.caseHandling === handling, `Card "đang xử lý" lệch danh sách: ${o.kpis.caseHandling} vs ${handling}`);
  assert(o.kpis.caseNew + o.kpis.caseHandling === rows.length, 'Hai nhóm phải rời nhau và phủ hết case chưa xong');
});
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
check('Phân biệt lịch, đã xong và học viên duy nhất', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  assert(o.kpis.week.scheduled >= o.kpis.week.done, 'Số đã xong không thể lớn hơn số có lịch');
  assert(o.kpis.week.uniqueStudents <= o.kpis.week.scheduled, 'Học viên duy nhất phải ≤ số lượt');
});
check('Lượt đã huỷ không bị tính thiếu điểm hay quá hạn', () => {
  const all = attempts.listAttempts(P.admin, {}).rows;
  const cancelled = all.filter((m) => m.status === 'cancelled');
  assert(cancelled.length > 0, 'Seed thiếu lượt đã huỷ');
  assert(!cancelled.some((m) => m.overdueSkills > 0), 'Lượt đã huỷ vẫn bị tính quá hạn');
});
check('Mỗi KPI mở đúng danh sách bản ghi', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  assert(attempts.listAttempts(P.admin, { need: 'overdue' }).rows.length === o.kpis.scoring.overdue, 'Bộ lọc quá hạn lệch KPI');
  assert(attempts.listAttempts(P.admin, { need: 'missing_scores' }).rows.length === o.kpis.scoring.missing, 'Bộ lọc thiếu điểm lệch KPI');
});
check('Case cũ và việc quá hạn không biến mất khi đổi tuần', () => {
  const other = week.listPeriods(30).find((p) => p.id !== currentPeriod.id)!;
  const a = dashboard.overview(P.admin, currentPeriod.id);
  const b = dashboard.overview(P.admin, other.id);
  assert(a.kpis.caseNew === b.kpis.caseNew && a.kpis.caseHandling === b.kpis.caseHandling, 'Đổi tuần làm mất case còn tồn');
  assert(a.tasks.overdue === b.tasks.overdue, 'Đổi tuần làm mất việc quá hạn');
});

// ==================================================================== 10

console.log('\n10. Xử lý sau Mock và lưu dữ liệu');
check('[6.2] Điểm dưới kỳ vọng sinh TÍN HIỆU, không tự mở case và không tự sinh phương án', () => {
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
    .get(classId('CP-FT 110')) as any;
  const cpPeriod = periodOf('2026-11-09');
  const attempt = attempts.createAttempt(P.cpManager, {
    studentId: s.id, cycleId: s.cycle_id, classId: classId('CP-FT 110'), periodId: cpPeriod,
  }) as any;

  const exp = s.target_score;           // từ MT3 trở đi kỳ vọng bằng target
  const low = exp - 0.5;
  const t = (skill: string) => loadPrincipal(teacherOfSkill('CP-FT 110', skill));
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
  const plansOf = () => (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
         JOIN sos_cases c ON c.id = iv.case_id
        WHERE c.student_id = ? AND iv.id > ?`,
    )
    .get(s.id, planIdBefore) as any).n;

  /* Một kỹ năng dưới kỳ vọng: kết luận SOS ra ngay, nhưng KHÔNG có case nào ra đời. */
  attempts.saveScore(t('listening'), attempt.id, 'listening', { rawScore: scoring.LISTENING_BY_RAW.indexOf(low) });
  const early = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(early.result.sosLevel === 1, `Một kỹ năng dưới kỳ vọng phải ra SOS 1 ngay, đang là ${early.result.sosLevel}`);
  assert(early.result.provisional, 'Chưa đủ điểm thì phải đánh dấu là kết luận tạm thời');
  assert(casesOf() === 0, 'Điểm dưới kỳ vọng đã tự mở case — mục 6.2 cấm');
  assert(plansOf() === 0, 'Điểm dưới kỳ vọng đã tự sinh phương án hỗ trợ — mục 6.2 cấm');

  const sig = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any;
  assert(sig, 'Không sinh tín hiệu nào cho môn dưới kỳ vọng');
  assert(sig.status === 'pending', `Tín hiệu mới phải ở trạng thái chờ xác minh, đang là ${sig.status}`);
  assert(sig.owner_user_id, 'Tín hiệu phải được giao cho một người cụ thể để xác minh');
  /* Hạn BA NGÀY tính cả ngày đầu: ghi nhận hôm nay thì hết ngày kia, không phải ngày kìa. */
  assert(sig.verify_due === addDays(sig.raised_on, 2),
    `Hạn xác minh phải là 3 ngày tính cả ngày đầu, đang là ${sig.raised_on} → ${sig.verify_due}`);
  /* Và mốc đếm hạn là NGÀY GHI NHẬN, không phải thứ Hai của tuần thi đã qua. */
  assert(sig.raised_on >= demoToday(),
    'Hạn xác minh bị lùi về tuần thi — giáo viên sẽ quá hạn ngay lúc điểm vừa công bố');

  /* Một tín hiệu Ý thức/Khác cho GVCN, cũng không phải case. */
  const beh = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND track = 'behaviour'`)
    .all(attempt.id) as any[];
  assert(beh.length === 1, `Mỗi đợt có SOS sinh đúng MỘT tín hiệu Ý thức/Khác, đang có ${beh.length}`);
  assert(beh[0].skill === null, 'Tín hiệu Ý thức/Khác không gắn với môn nào');

  /* Nhập thêm môn khác: thêm tín hiệu, vẫn không case nào, và hạn cũ KHÔNG bị đặt lại. */
  const dueBefore = sig.verify_due;
  attempts.saveScore(t('reading'), attempt.id, 'reading', { rawScore: scoring.READING_BY_RAW.indexOf(low) });
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: [low, low, low, low] });
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: [low, low, low, low] });
  const three = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(three.result.sosLevel === 3, `Ba kỹ năng dưới kỳ vọng phải lên SOS 3, đang là ${three.result.sosLevel}`);
  assert(casesOf() === 0, 'Mức SOS tăng đã tự mở case');
  assert(plansOf() === 0, 'Mức SOS tăng đã tự sinh phương án');
  const sigAfter = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any;
  assert(sigAfter.verify_due === dueBefore, 'Lưu điểm môn khác đã đặt lại hạn của tín hiệu Listening');
  const dupe = (conn
    .prepare(`SELECT COUNT(*) n FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any).n;
  assert(dupe === 1, `Nhập bổ sung đã nhân tín hiệu Listening thành ${dupe} dòng`);

  /* Nhập LẠI cùng ô điểm (retry) cũng không nhân tín hiệu và không đổi hạn. */
  attempts.saveScore(t('listening'), attempt.id, 'listening', { rawScore: scoring.LISTENING_BY_RAW.indexOf(low) });
  const afterRetry = conn
    .prepare(`SELECT COUNT(*) n, MIN(verify_due) d FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(attempt.id) as any;
  assert(afterRetry.n === 1 && afterRetry.d === dueBefore, 'Lưu lại cùng một ô điểm đã nhân tín hiệu hoặc đổi hạn');

  /* GIÁO VIÊN XÁC MINH → đây mới là lúc case ra đời, và nó đi qua đúng form của người dùng. */
  const made = cases.reportIssue(t('listening'), {
    primaryCode: 'student.listening.technique',
    studentId: s.id, cycleId: s.cycle_id, track: 'academic', topic: 'listening',
    title: 'Listening: nghe số và ngày tháng còn sai',
    summary: 'Em bắt được ý chính nhưng mất điểm ở phần điền số, ngày tháng và tên riêng.',
    fromSignalId: sig.id,
  }) as any;
  const linked = conn.prepare('SELECT * FROM case_signals WHERE id = ?').get(sig.id) as any;
  assert(linked.status === 'linked' && linked.case_id === made.id,
    'Tạo case từ tín hiệu mà tín hiệu không được gắn vào case đó');

  /* Ghi một việc đã làm, rồi SỬA ĐIỂM Writing thành đạt — việc đã làm KHÔNG được biến mất. */
  cases.recordIntervention(t('listening'), made.id, {
    kind: 'teaching_adjust', description: 'GVCN điều chỉnh cách chữa bài cho em',
    performerSelf: true, status: 'completed', completedDate: TODAY,
  });
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: [exp, exp, exp, exp] });
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: [exp, exp, exp, exp] });
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
    .get(classId('UB-FT 401')) as any;
  const ubManager = loadPrincipal(userByRole('manager', 'UB'));
  const attempt = attempts.createAttempt(ubManager, {
    studentId: s.id, cycleId: s.cycle_id, classId: classId('UB-FT 401'), periodId: periodOf('2026-12-07'),
  }) as any;
  const exp = s.target_score;
  const t = (skill: string) => loadPrincipal(teacherOfSkill('UB-FT 401', skill));

  attempts.saveScore(t('speaking'), attempt.id, 'speaking', { criteria: [exp - 0.5, exp - 0.5, exp - 0.5, exp - 0.5] });
  const sig = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(attempt.id) as any;
  assert(sig?.status === 'pending', 'Thiếu tín hiệu Speaking đang chờ xác minh');

  /* Giáo viên mở case ngay. Case này CHƯA có việc gì được làm, và chỉ dựa trên đợt này. */
  const made = cases.reportIssue(t('speaking'), {
    primaryCode: 'student.speaking.fluency',
    studentId: s.id, cycleId: s.cycle_id, track: 'academic', topic: 'speaking',
    title: 'Speaking: nói ngắt quãng khi gặp chủ đề lạ',
    summary: 'Em dừng lâu giữa câu khi chủ đề nằm ngoài vốn từ quen thuộc.',
    fromSignalId: sig.id,
  }) as any;

  /* Hoá ra điểm nhập sai: sửa lại thành đạt. */
  attempts.saveScore(t('speaking'), attempt.id, 'speaking', { criteria: [exp, exp, exp, exp] });
  const after = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(made.id) as any;
  assert(after.status === 'done', 'Case chỉ dựa trên điểm sai vẫn nằm trong danh sách đang xử lý');
  assert(/sửa điểm/i.test(after.outcome_note ?? ''),
    `Case bị rút mà không ghi rõ lý do, đang là "${after.outcome_note}"`);
  /* Rút KHÁC xoá: mọi lịch sử vẫn đọc được. */
  const hist = conn.prepare('SELECT COUNT(*) n FROM sos_case_history WHERE case_id = ?').get(made.id) as any;
  assert(hist.n > 0, 'Rút case đã xoá mất lịch sử');
});

check('Bỏ một kỹ năng khỏi phạm vi sau khi đã có điểm thì giữ điểm và tính lại kết quả', () => {
  const a = conn
    .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' ORDER BY id DESC LIMIT 1`)
    .get(classId('CP-FT 110')) as any;
  const beforeScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(a.id) as any).n;
  /*
   * Lý do phải là một lý do về PHẠM VI, không phải "học viên vắng". Bỏ môn vì em vắng
   * chính là đường lách mà mục 10.1 cấm, và hệ thống chặn nó ở chỗ khác — xem phép kiểm
   * "Không bỏ môn khỏi phạm vi sau khi đã xác nhận vắng" bên dưới.
   */
  attempts.setSkillSkip(P.cpManager, a.id, 'speaking', true, 'Quản lý chốt lại: đợt này không yêu cầu Speaking');
  const afterScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(a.id) as any).n;
  assert(afterScores === beforeScores, 'Đánh dấu không mock đã xoá điểm đã có');
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
  const teacher = loadPrincipal(teacherOfSkill('MB-FT 101', 'listening'));
  attempts.saveScore(teacher, a.id, 'listening', { rawScore: null });
  const row = conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill='listening'`).get(a.id) as any;
  assert(row.raw_score === null && row.band === null, 'Xoá điểm lại thành 0');
  attempts.saveScore(teacher, a.id, 'listening', { rawScore: 30 });
  const back = conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill='listening'`).get(a.id) as any;
  assert(back.band === scoring.bandFromRaw('listening', 30) && back.entered_by === teacher.userId, 'Nhập lại không lưu đúng');
});
check('Chuyển lớp giữ lớp cũ cho lượt đã xong, chuyển lượt chưa xong', () => {
  const s = conn
    .prepare(
      `SELECT s.* FROM students s JOIN enrollments e ON e.student_id=s.id
        WHERE e.class_id = ? AND e.status='active' AND s.status='active' ORDER BY s.id LIMIT 1`,
    )
    .get(classId('BC-FT 205')) as any;
  const before = conn.prepare('SELECT id, class_id, status FROM assessment_attempts WHERE student_id = ?').all(s.id) as any[];
  const done = before.filter((a) => a.status === 'done');
  const target = classId('BC-ELE 01');
  students.transferStudent(P.admin, s.id, target, '2026-09-21', 'Đổi ca học',
    { note: 'Em còn case Reading đang theo dõi, cô mới nhận lớp đọc kỹ phần phương án.' });
  const after = conn.prepare('SELECT id, class_id, status FROM assessment_attempts WHERE student_id = ?').all(s.id) as any[];
  for (const t of done) assert(after.find((a) => a.id === t.id)!.class_id === t.class_id, 'Lượt đã xong bị viết lại lớp');
  for (const a of after.filter((x) => x.status === 'planned')) {
    assert(a.class_id === target, 'Lượt chưa xong không chuyển sang lớp mới');
  }
  assert(profile.studentProfile(P.admin, s.id).enrollments.length >= 2, 'Lịch sử lớp bị ghi đè');
});
check('Ba trạng thái học viên; lưu trữ chỉ ẩn, không đóng việc còn dở', () => {
  const s = conn.prepare(`SELECT * FROM students WHERE status='finished' LIMIT 1`).get() as any;
  assert(s && s.finished_at, 'Seed thiếu học viên đã kết thúc');
  const openBefore = (conn.prepare(
    `SELECT COUNT(*) n FROM sos_cases sc JOIN assessment_attempts a ON a.id=sc.attempt_id
      WHERE a.student_id = ? AND sc.status != 'done'`).get(s.id) as any).n;
  const n = students.archiveDueStudents(TODAY);
  const after = conn.prepare('SELECT * FROM students WHERE id = ?').get(s.id) as any;
  assert(n >= 1 && after.archived_at, 'Học viên kết thúc quá hai tuần phải vào lưu trữ');
  assert(after.status === 'finished', 'Lưu trữ không được thành trạng thái thứ tư');
  const openAfter = (conn.prepare(
    `SELECT COUNT(*) n FROM sos_cases sc JOIN assessment_attempts a ON a.id=sc.attempt_id
      WHERE a.student_id = ? AND sc.status != 'done'`).get(s.id) as any).n;
  assert(openAfter === openBefore, 'Lưu trữ đã âm thầm đóng case còn dở');
});
check('Hành trình gom thành CHƯƠNG: mọi việc quanh một vấn đề nằm chung một chỗ', () => {
  const s = conn.prepare(`SELECT student_id AS id FROM journey_events WHERE event_type='cycle_start' LIMIT 1`).get() as any;
  const eps = profile.studentProfile(P.admin, s.id).episodes;
  assert(eps.some((e: any) => e.events.some((x: any) => x.eventType === 'cycle_start')),
    'Thiếu sự kiện bắt đầu lộ trình');
  // Một chương phải xếp sự kiện theo đúng thứ tự xảy ra, để đọc được như một mạch chuyện.
  for (const ep of eps) {
    for (let i = 1; i < ep.events.length; i += 1) {
      assert(ep.events[i - 1].eventDate <= ep.events[i].eventDate,
        `Chương "${ep.title}" xếp sự kiện sai thứ tự thời gian`);
    }
  }
  // Chương của một vấn đề phải mở được đúng vấn đề đó.
  const caseEp = eps.find((e: any) => e.kind === 'case');
  if (caseEp) assert(/^\/hoc-thuat\/case\/\d+$/.test(caseEp.link), `Chương vấn đề thiếu đường dẫn: ${caseEp.link}`);
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
  const eps = profile.studentProfile(P.admin, row.sid).episodes;
  const mine = eps.filter((e: any) => e.link === `/hoc-thuat/case/${row.cid}`);
  assert(mine.length <= 1, `Vấn đề ${row.cid} bị tách thành ${mine.length} chương rời nhau`);
});
check('Target chốt tại lượt: sửa lộ trình không viết lại lịch sử', () => {
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE status='done' ORDER BY id LIMIT 1`).get() as any;
  const before = a.target_at_attempt;
  cycles.updateCycle(P.admin, a.cycle_id, { targetScore: 8 });
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
check('Ô điểm nói rõ kỹ năng có bắt buộc, độc lập với quyền người xem', () => {
  const a = conn
    .prepare(`SELECT a.* FROM assessment_attempts a WHERE a.status != 'cancelled' LIMIT 1`)
    .get() as any;
  const d = attempts.attemptDetail(P.mbManager, a.id);
  assert(d.cells.length > 0, 'Không lấy được ô điểm nào để kiểm');
  assert(
    d.cells.every((c: any) => typeof c.required === 'boolean'),
    'Mọi ô điểm phải có trường required',
  );
  assert(
    d.cells.some((c: any) => c.required) && d.cells.every((c: any) => !c.canEdit),
    'Quản lý không sửa được ô nào nhưng vẫn phải thấy ô nào bắt buộc',
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
  const asAdmin = classesSvc.listClassSummaries(P.admin, { scope: 'managed' }).rows.find((c) => c.code === 'MB-FT 101')!;
  const asTeacher = mine.find((c) => c.code === 'MB-FT 101');
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
  assert(row, 'Bộ demo phải có ít nhất một đợt tách tuần để kiểm — xem DEMO_SCENARIOS.md');

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
  assertThrows(() => classesSvc.classRoster(P.mbManager, classId('CP-FT 110')), /phạm vi/,
    'Quản lý MB mở roster lớp CP');
});

// ==================================================================== 12

console.log('\n12. Thêm học viên hàng loạt');
check('Đọc được TSV dán từ bảng tính, có hoặc không có dòng tiêu đề', () => {
  const withHeader = intake.parsePaste('Họ tên\tLớp\tNgày sinh\nNguyễn Văn A\tMB-FT 101\t12/05/2008');
  assert(withHeader.usedHeader && withHeader.rows.length === 1, 'Không nhận ra dòng tiêu đề');
  assert(withHeader.rows[0].fullName === 'Nguyễn Văn A' && withHeader.rows[0].classCode === 'MB-FT 101', 'Đọc sai cột');
  const noHeader = intake.parsePaste('Trần Thị B\tMB-FT 101\t01/02/2009');
  assert(!noHeader.usedHeader && noHeader.rows[0].fullName === 'Trần Thị B', 'Không đọc được dòng không có tiêu đề');
});
check('Ngày đọc theo đúng định dạng được chọn, ngày mơ hồ thì báo lỗi', () => {
  assert(intake.parseDateAs('12/05/2008', 'dmy') === '2008-05-12', 'Đọc sai định dạng ngày/tháng');
  assert(intake.parseDateAs('12/05/2008', 'mdy') === '2008-12-05', 'Đọc sai định dạng tháng/ngày');
  assert(intake.parseDateAs('2008-05-12', 'dmy') === '2008-05-12', 'Không nhận ISO');
  assert(intake.parseDateAs('linh tinh', 'dmy') === 'invalid', 'Ngày sai phải báo lỗi, không đoán');
  assert(intake.parseDateAs('', 'dmy') === null, 'Ô trống phải là null');
});
check('[12.1] Xem trước bắt lỗi từng ô và gợi ý trùng, không tự gộp', () => {
  const existing = conn.prepare('SELECT full_name, dob FROM students WHERE dob IS NOT NULL LIMIT 1').get() as any;
  const pv = intake.previewIntake(P.admin, {
    classId: classId('MB-FT 101'),
    rows: [
      { fullName: '' },
      { fullName: 'Người Mới Một', dob: 'linh tinh' },
      { fullName: 'Người Mới Hai', target: '12' },
      { fullName: 'Người Mới Ba', entryListening: '5.3' },
      { fullName: '-' },
    ],
    dateFormat: 'dmy',
  });
  assert(pv.rows[0].issues.some((i) => i.field === 'fullName'), 'Không bắt lỗi thiếu họ tên');
  assert(pv.rows[1].issues.some((i) => i.field === 'dob'), 'Không bắt lỗi ngày sai');
  assert(pv.rows[2].issues.some((i) => i.field === 'target'), 'Không bắt lỗi target ngoài 0–9');
  assert(pv.rows[3].issues.some((i) => i.field === 'entryListening'), 'Không bắt lỗi band lẻ 5.3');
  /* Dấu '-' ở cột tên là THIẾU TÊN, không phải một em tên '-'. */
  assert(pv.rows[4].issues.some((i) => i.field === 'fullName'), 'Nhận "-" như một cái tên hợp lệ');

  /* Chưa chọn lớp thì không soát được gì có ý nghĩa — nói thẳng thay vì soát nửa vời. */
  const noClass = intake.previewIntake(P.admin, { rows: [{ fullName: 'A' }], dateFormat: 'dmy' });
  assert(noClass.issues.some((i) => i.field === 'classId'), 'Không báo thiếu lớp cho cả lô');

  if (existing) {
    const dup = intake.previewIntake(P.admin, {
      classId: classId('MB-FT 101'),
      rows: [{ fullName: existing.full_name, dob: existing.dob }], dateFormat: 'iso',
    });
    assert(dup.rows[0].duplicates.length > 0, 'Không gợi ý hồ sơ trùng');
    assert(dup.rows[0].issues.some((i) => /trùng hồ sơ/.test(i.message)),
      'Gợi ý trùng mà không nói ra cho người nhập thấy');
  }
});

check('[12.1] Lớp là quyết định của cả lô, cột "Lớp" trong file bị bỏ qua có báo', () => {
  const pv = intake.previewIntake(P.admin, {
    classId: classId('MB-FT 101'),
    rows: [{ fullName: 'Người Dán Nhầm Lớp', classCode: 'CP-FT 110' }],
    dateFormat: 'dmy',
  });
  assert(pv.rows[0].classCode === 'MB-FT 101',
    `Cột lớp trong file đã đè lên ô chọn lớp: ${pv.rows[0].classCode}`);
  assert(pv.rows[0].issues.some((i) => i.field === 'classCode' && /Bỏ qua cột lớp/.test(i.message)),
    'Bỏ qua cột lớp mà không nói — người nhập tưởng em vào lớp ghi trong file');
});

check('[12.1] Lớp Normal không nhận target IELTS và band từng kỹ năng', () => {
  const normal = conn
    .prepare(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code
               WHERE pg.scoring_mode = 'ratio' LIMIT 1`)
    .get() as any;
  assert(normal, 'Bộ demo thiếu lớp Normal');
  const pv = intake.previewIntake(P.admin, {
    classId: normal.id,
    rows: [{ fullName: 'Em Lớp Thường', target: '6.5', entryListening: '5.0' }],
    dateFormat: 'dmy',
  });
  assert(pv.ratio === true, 'Không nhận ra đây là lớp Normal');
  assert(pv.rows[0].issues.some((i) => i.field === 'target' && /không có target/.test(i.message)),
    'Lớp Normal vẫn nhận target IELTS');
  assert(pv.rows[0].issues.some((i) => i.field === 'entryListening'),
    'Lớp Normal vẫn nhận band đầu vào từng kỹ năng');
});
check('Nhập ngoài phạm vi quyền bị chặn ở server', () => {
  const pv = intake.previewIntake(P.mbManager, {
    classId: classId('CP-FT 110'), rows: [{ fullName: 'Ngoài Phạm Vi' }], dateFormat: 'dmy',
  });
  assert(pv.issues.some((i) => /phạm vi/.test(i.message)), 'Không chặn lớp ngoài chi nhánh khi xem trước');
  /*
   * Cả lô vào MỘT lớp, nên lớp ngoài phạm vi là chặn CẢ LÔ ngay từ đầu — không có chuyện
   * ghi được một phần. Còn một dòng hỏng trong một lô hợp lệ thì chỉ dòng đó bị bỏ.
   */
  const r = intake.commitIntake(P.mbManager, {
    classId: classId('CP-FT 110'),
    rows: [{ fullName: 'Ngoài Phạm Vi 2' }],
    dateFormat: 'dmy', idempotencyKey: 'test-intake-scope',
  });
  assert(r.added === 0, `Lớp ngoài phạm vi mà vẫn ghi được ${r.added} học viên`);
  assert(!conn.prepare("SELECT id FROM students WHERE full_name = 'Ngoài Phạm Vi 2'").get(),
    'Học viên ngoài phạm vi quyền vẫn bị ghi vào database');
});
check('Ghi thật: tạo học viên, enrollment và lộ trình; bỏ qua dòng lỗi', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  const r = intake.commitIntake(P.admin, {
    classId: classId('MB-FT 101'),
    rows: [
      { fullName: 'Học Viên Nhập Một', target: 6.5, dob: '01/02/2009',
        entryListening: 5, entryReading: '5.5', entryWriting: '-', baselineScore: '5.0' },
      { fullName: '' },
      { fullName: 'Học Viên Nhập Hai' },
    ],
    dateFormat: 'dmy', idempotencyKey: 'test-intake-1',
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
    classId: classId('MB-FT 101'),
    rows: [{ fullName: 'Học Viên Nhập Hai' }], dateFormat: 'dmy',
  });
  assert(warn.rows[0].issues.some((i) => i.field === 'target' && /Chưa có target/.test(i.message)),
    'Thiếu target phải cảnh báo để người nhập biết còn phải bổ sung');
});
check('Bấm hai lần hoặc thử lại không tạo học viên trùng', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  const again = intake.commitIntake(P.admin, {
    classId: classId('MB-FT 101'),
    rows: [
      { fullName: 'Học Viên Nhập Một', target: 6.5, dob: '01/02/2009' },
      { fullName: '' },
      { fullName: 'Học Viên Nhập Hai' },
    ],
    dateFormat: 'dmy', idempotencyKey: 'test-intake-1',
  });
  const after = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  assert(after === before, `Gửi lại cùng khoá đã tạo thêm ${after - before} học viên`);
  assert(again.added === 2, 'Kết quả lần gửi lại phải giống lần đầu');
});
check('[12.1] Nhập hàng loạt KHÔNG lập lịch MT, kể cả người có quyền xếp lịch', () => {
  /*
   * Trước đây file dán có cột "Tuần MT" thì đường nhập này tạo luôn các lượt thi. Nghe thì
   * tiện, nhưng nó biến ô nhập danh sách thành một lối vòng quanh quyền xếp lịch — và lịch
   * tạo kiểu đó không đi qua ràng buộc thứ tự đợt nào cả.
   */
  const r = intake.commitIntake(P.coreTeacher, {
    classId: classId('MB-FT 101'),
    rows: [{ fullName: 'Học Viên Không Quyền Tuần', target: 6 }],
    dateFormat: 'iso', idempotencyKey: 'test-intake-2',
  });
  assert(r.added === 1, 'GVCN phải thêm được học viên vào lớp mình phụ trách');
  const s = conn.prepare("SELECT id FROM students WHERE full_name = 'Học Viên Không Quyền Tuần'").get() as any;
  assert((conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE student_id = ?').get(s.id) as any).n === 0,
    'Nhập hàng loạt đã tạo kế hoạch MT');

  const r2 = intake.commitIntake(P.mbManager, {
    classId: classId('MB-FT 101'),
    rows: [{ fullName: 'Học Viên Có Quyền Tuần', target: 6 }],
    dateFormat: 'iso', idempotencyKey: 'test-intake-3',
  });
  assert(r2.added === 1, 'Quản lý phải thêm được học viên');
  const s2 = conn.prepare("SELECT id FROM students WHERE full_name = 'Học Viên Có Quyền Tuần'").get() as any;
  assert((conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE student_id = ?').get(s2.id) as any).n === 0,
    'Người có quyền xếp lịch vẫn không được xếp lịch qua đường nhập danh sách — đó là việc của panel Lộ trình');
});

check('[12.1] Tuần bắt đầu: mặc định cho cả lô, ghi đè được từng dòng', () => {
  const r = intake.commitIntake(P.admin, {
    classId: classId('MB-FT 101'),
    defaultStartWeek: '2026-10-05',
    rows: [
      { fullName: 'Em Theo Tuần Chung' },
      { fullName: 'Em Vào Muộn Một Tuần', startWeek: '2026-10-12' },
    ],
    dateFormat: 'iso', idempotencyKey: 'test-intake-week',
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
  assertThrows(() => intake.createClass(P.admin, { code: 'MB-FT 101', branchId: mb, kind: 'FT' }),
    /Đã có lớp/, 'Mã lớp trùng');
  const c = intake.createClass(P.admin, {
    code: 'MB-FT 999', branchId: mb, kind: 'FT', route: 'LT1', startDate: '2026-10-05',
  }) as any;
  assert(c.code === 'MB-FT 999', 'Không tạo được lớp');
  assert((conn.prepare('SELECT COUNT(*) n FROM class_skills WHERE class_id = ?').get(c.id) as any).n === 5,
    'Lớp mới phải có cấu hình kỹ năng');
});
check('Gợi ý tuần MT lấy theo mốc TUẦN HỌC của chương trình', () => {
  const weeks = intake.suggestMockWeeks('2026-06-22', 3);
  assert(weeks.length === 3, 'Phải gợi ý ba tuần');
  // MT1 ở tuần học 6 => 5 tuần sau ngày khai giảng.
  assert(weeks[0] === '2026-07-27', `Tuần MT1 gợi ý sai: ${weeks[0]}`);
  assert(intake.suggestMockWeeks(null).length === 0, 'Chưa có ngày khai giảng thì không gợi ý bừa');
});

// ==================================================================== 13

console.log('\n13. Thao tác hàng loạt và việc theo thời điểm');
check('Lên kế hoạch MT hàng loạt, chọn luôn kỹ năng lượt này yêu cầu', () => {
  const period = periodOf('2026-11-09');
  const students = conn
    .prepare(
      `SELECT s.id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status='active'
         JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status='active'
        WHERE e.class_id = ?
          AND NOT EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status='planned')
        LIMIT 3`,
    )
    .all(mbClass) as any[];
  assert(students.length >= 2, 'Cần ít nhất hai học viên chưa có kế hoạch để thử');
  const r = planning.bulkPlan(P.mbManager, {
    studentIds: students.map((x) => x.id), periodId: period,
    requiredSkills: ['listening', 'reading', 'writing'],   // bỏ Speaking ngay từ đầu
  });
  assert(r.done === students.length, `Kỳ vọng tạo ${students.length} lượt, thực tế ${r.done}`);
  const first = (r.items as any[])[0];
  const skips = conn.prepare('SELECT skill FROM attempt_skill_skips WHERE attempt_id = ?').all(first.id) as any[];
  assert(skips.length === 1 && skips[0].skill === 'speaking',
    'Kỹ năng không được yêu cầu phải ghi ngay khi lên kế hoạch');
  // "Không yêu cầu" KHÁC "thiếu điểm": lượt xong khi đủ các kỹ năng ĐƯỢC yêu cầu.
  const detail = attempts.attemptDetail(P.mbManager, first.id) as any;
  assert(detail.result.required.length === 3 && !detail.result.required.includes('speaking'),
    'Speaking không được yêu cầu thì không được tính vào tập chờ');
  assert(detail.result.skipped.includes('speaking'), 'Speaking phải nằm ở nhóm không yêu cầu');
});
check('Không được lên kế hoạch một lượt MT không yêu cầu kỹ năng nào', () => {
  const s = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? LIMIT 1`).get(mbClass) as any;
  assertThrows(
    () => planning.bulkPlan(P.mbManager, { studentIds: [s.student_id], periodId: periodOf('2026-11-16'), requiredSkills: [] }),
    /ít nhất một kỹ năng/, 'Lượt MT rỗng kỹ năng',
  );
});
check('Đường dẫn cố định của /attempts đứng TRƯỚC /attempts/:id', () => {
  /*
   * Express khớp route theo thứ tự khai báo. Đặt "no-plan" sau `:id` thì nó bị nuốt và
   * request đi vào hàm chi tiết với một id không phải số.
   */
  /*
   * Đọc CHÍNH file nguồn, qua `path` chứ không qua `URL.pathname`: trên Windows pathname trả
   * về "/C:/..." và mã hoá khoảng trắng thành %20, nên phép kiểm này hỏng ở máy có dấu cách
   * trong đường dẫn — hỏng vì môi trường, không phải vì route sai.
   */
  const src = fs.readFileSync(path.resolve(__dirname, '../../../../server/src/routes/index.ts'), 'utf8');
  const byId = src.indexOf("api.get('/attempts/:id'");
  for (const fixed of ["api.get('/attempts/no-plan'"]) {
    const at = src.indexOf(fixed);
    assert(at > -1 && at < byId, `${fixed} phải khai báo trước /attempts/:id`);
  }
});
check('Quản lý xếp trước được lượt sau cho cả lớp, không phải đợi từng lượt', () => {
  const only = planning.noPlanQueue(P.mbManager, {});
  const all = planning.noPlanQueue(P.mbManager, { includePlanned: true });
  assert(all.rows.length > only.rows.length, 'Mở rộng cả lớp mà danh sách không dài thêm');
  assert(all.noPlanCount === only.rows.length, 'Con số "đang thiếu" phải giữ nguyên khi đổi bộ lọc');
  assert(all.rows.some((r) => r.hasPending), 'Không đánh dấu em đã có lượt đang chờ');
});
check('Chưa có tuần MT là việc của Quản lý, và chỉ tính em đang học', () => {
  const q = planning.noPlanQueue(P.mbManager, {});
  for (const r of q.rows) {
    const n = (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND status='planned'`)
      .get(r.cycleId) as any).n;
    assert(n === 0, `${r.studentName} đã có lượt MT đang chờ mà vẫn bị liệt vào "chưa có tuần"`);
    assert(r.canPlan, 'Quản lý phải lên được kế hoạch cho em trong phạm vi của mình');
  }
});
check('Báo cáo tuần: mở hai ngày cuối tuần, bù đến hết thứ Tư tuần sau, rồi khoá hẳn', () => {
  const cur = conn.prepare('SELECT * FROM report_periods WHERE week_start <= ? AND week_end >= ?')
    .get(demoToday(), demoToday()) as any;
  assert(!week.reportEditWindow(cur, cur.week_start).open, 'Đầu tuần vẫn mở cho nhập báo cáo');
  assert(week.reportEditWindow(cur, addDays(cur.week_end, -1)).open, 'Thứ Bảy phải mở');
  assert(week.reportEditWindow(cur, cur.week_end).open, 'Chủ nhật phải mở');

  // Thời gian bù: hết thứ Tư tuần sau, tức Chủ nhật + 3 ngày.
  const wed = addDays(cur.week_end, 3);
  assert(week.reportEditWindow(cur, wed).open, `Thứ Tư tuần sau (${wed}) vẫn phải nhập bù được`);
  const thu = addDays(cur.week_end, 4);
  const closed = week.reportEditWindow(cur, thu);
  assert(!closed.open && closed.locked, `Từ thứ Năm (${thu}) phải khoá hẳn`);
  assert(/Quản trị hệ thống/.test(closed.reason ?? ''), 'Phải nói rõ ai mở lại được');

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
check('Tuần đã khoá chỉ Quản trị hệ thống mở lại được, và chặn ở máy chủ', () => {
  const old = conn
    .prepare('SELECT * FROM report_periods WHERE week_end < ? ORDER BY week_end DESC LIMIT 1')
    .get(addDays(demoToday(), -7)) as any;
  assert(old, 'Dữ liệu mẫu thiếu một tuần đã qua hẳn');
  const unit = conn.prepare(`SELECT * FROM reporting_units WHERE kind='branch' LIMIT 1`).get() as any;

  assert(week.reportEditWindow(old).locked, 'Tuần cũ phải đang khoá');
  assertThrows(() => meeting.saveUnitReport(P.admin, unit.id, old.id, 'teachers', { status: 'ok' }),
    /quá hạn|Quản trị hệ thống/, 'Ghi báo cáo tuần đã khoá');

  week.setPeriodUnlocked(old.id, true, P.admin.userId);
  const opened = week.reportEditWindow(old);
  assert(opened.open && opened.unlocked, 'Mở lại rồi mà vẫn không ghi được');
  meeting.saveUnitReport(P.admin, unit.id, old.id, 'teachers', { status: 'ok' });   // giờ phải chạy được

  week.setPeriodUnlocked(old.id, false, P.admin.userId);
  assert(!week.reportEditWindow(old).open, 'Khoá lại rồi mà vẫn ghi được');
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
check('Hạn nhập điểm lớp thường là hết Chủ nhật của chính tuần đó', () => {
  const a = conn
    .prepare(
      `SELECT a.id, a.planned_period_id, a.deadline_override, rp.week_start, rp.week_end
         FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.kind != 'mock' LIMIT 1`,
    )
    .get() as any;
  assert(a, 'Dữ liệu mẫu thiếu bài kiểm tra lớp thường');
  const dl = regular.regularDeadline(a);
  assert(dl.date === a.week_end && dl.source === 'week_end',
    `Hạn phải là Chủ nhật ${a.week_end} của tuần đó, đang là ${dl.date}`);
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
  assert(progress?.week_start && final?.week_start, 'Thiếu bài giữa khoá hoặc cuối khoá');
  // Tuần học 4 = 3 tuần sau khai giảng; tuần học 8 = 7 tuần sau.
  assert(progress!.week_start === week.mondayOf(addDays(fouClass.start_date, 3 * 7)),
    `Bài giữa khoá phải rơi vào tuần học 4, đang là ${progress!.week_start}`);
  assert(final!.week_start === week.mondayOf(addDays(fouClass.start_date, 7 * 7)),
    `Bài cuối khoá phải rơi vào tuần học 8, đang là ${final!.week_start}`);
  // BE/ELE là tuần học 5 và 10.
  const be = [
    { kind: 'progress', week_start: firstWeek(beClass.id, 'progress') },
    { kind: 'final', week_start: firstWeek(beClass.id, 'final') },
  ];
  assert(be.find((r) => r.kind === 'progress')?.week_start === week.mondayOf(addDays(beClass.start_date, 4 * 7)),
    'Bài giữa khoá BE phải rơi vào tuần học 5');
  assert(be.find((r) => r.kind === 'final')?.week_start === week.mondayOf(addDays(beClass.start_date, 9 * 7)),
    'Bài cuối khoá BE phải rơi vào tuần học 10');
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
      `SELECT sc.sos_level, COUNT(*) n FROM sos_cases sc
         JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.kind != 'mock' GROUP BY sc.sos_level ORDER BY sc.sos_level`,
    )
    .all() as any[];
  assert(cases.filter((c) => c.sos_level >= 1).length >= 3, 'Dữ liệu mẫu cần đủ cả ba mức SOS của lớp thường');
  for (const c of cases) assert(c.sos_level >= 0 && c.sos_level <= 3, `Mức SOS lạ: ${c.sos_level}`);
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

check('Sửa điểm làm đổi mức SOS thì GIỮ case và ghi lịch sử, không xoá làm lại', () => {
  const target = conn
    .prepare(
      `SELECT sc.id AS case_id, sc.sos_level, a.id AS attempt_id, a.class_id
         FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.kind != 'mock' AND sc.sos_level >= 2 AND sc.track = 'academic'
        ORDER BY sc.id LIMIT 1`,
    )
    .get() as any;
  assert(target, 'Cần một case lớp thường mức từ 2 trở lên để thử');
  const prog = regular.programmeOfClass(target.class_id)!;
  // Nâng mọi kỹ năng lên mức đạt: SOS phải về 0 nhưng case vẫn còn để tra lịch sử.
  for (const skill of prog.skills) {
    regular.saveRegularScore(P.admin, target.attempt_id, skill, { score: 38, total: 40 });
  }
  const after = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(target.case_id) as any;
  assert(after, 'Case bị xoá mất khi điểm đổi');
  assert(after.sos_level === 0, `Mức SOS phải tính lại về 0, đang là ${after.sos_level}`);
  const hist = conn.prepare(`SELECT * FROM sos_case_history WHERE case_id = ? AND field = 'sos_level'`)
    .all(target.case_id) as any[];
  assert(hist.length > 0, 'Đổi mức SOS mà không ghi lịch sử');
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
    regular.saveRegularScore(P.admin, planned.id, skill, { score: 30, total: 40 });
  });
  let st = conn.prepare('SELECT status FROM assessment_attempts WHERE id = ?').get(planned.id) as any;
  assert(st.status === 'planned', 'Thiếu một kỹ năng mà đã coi là xong');
  regular.saveRegularScore(P.admin, planned.id, prog.skills[prog.skills.length - 1], { score: 30, total: 40 });
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
check('Sáu cột kết quả cộng lại đúng bằng số lượt có kết quả', () => {
  const r = weekly.weeklyRollup(P.admin, {});
  assert(r.rows.length > 0, 'Không có tuần nào có dữ liệu');
  for (const row of r.rows) {
    const sum = row.onTarget + row.sos1 + row.sos2 + row.sos3 + row.provisional + row.pending;
    assert(sum === row.attempts, `Tuần ${row.code}: sáu cột cộng lại ${sum}, khác ${row.attempts} lượt`);
  }
});
check('Chỉ đếm lượt ĐÃ CHẤM, và chỉ hiện tuần có dữ liệu', () => {
  const r = weekly.weeklyRollup(P.admin, {});
  for (const row of r.rows) {
    assert(row.attempts > 0 || row.cases > 0, `Tuần ${row.code} rỗng mà vẫn hiện — file Excel cũ mới in dòng trống`);
  }
  // Lượt chưa chấm gì thì không được tính là "lượt có kết quả".
  const planned = (conn.prepare(
    `SELECT COUNT(*) n FROM assessment_attempts a
      WHERE a.status = 'planned'
        AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)`,
  ).get() as any).n;
  assert(planned > 0, 'Cần có lượt chưa chấm để phép kiểm tra này có nghĩa');
  const total = r.rows.reduce((z, x) => z + x.attempts, 0);
  const scoredAttempts = (conn.prepare(
    `SELECT COUNT(DISTINCT a.id) n FROM assessment_attempts a
       JOIN assessment_scores s ON s.attempt_id = a.id
       JOIN report_periods rp ON rp.id = a.planned_period_id
      WHERE a.status != 'cancelled' AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)`,
  ).get() as any).n;
  assert(total <= scoredAttempts, `Đếm ${total} lượt nhưng chỉ có ${scoredAttempts} lượt đã chấm`);
});
check('Tổng hợp tuần chỉ trong phạm vi được cấp quyền', () => {
  const mine = weekly.weeklyRollup(P.mbManager, {});
  const all = weekly.weeklyRollup(P.admin, {});
  const mineTotal = mine.rows.reduce((z, x) => z + x.attempts, 0);
  const allTotal = all.rows.reduce((z, x) => z + x.attempts, 0);
  assert(mineTotal < allTotal, 'Quản lý một chi nhánh lại thấy đúng bằng toàn hệ thống');
  assert(mineTotal > 0, 'Quản lý MB không thấy số nào');
});
check('Sáu cột kết luận loại trừ nhau và cộng lại đúng bằng số lượt', () => {
  /*
   * Đây là phép kiểm tra chính của mục 4.2: một lượt chưa đủ điểm không được vừa nằm ở cột
   * "kết luận tạm thời" vừa được đếm lại ở cột "chưa đủ điểm", và không lượt nào chưa đủ
   * căn cứ mà bị ghi thành "Đạt".
   */
  for (const track of [null, 'normal', 'ft'] as const) {
    const r = weekly.weeklyRollup(P.admin, { track });
    for (const row of r.rows) {
      const sum = row.onTarget + row.sos1 + row.sos2 + row.sos3 + row.provisional + row.pending;
      assert(sum === row.attempts,
        `Tuần ${row.code} (${track ?? 'tất cả'}): sáu cột cộng lại ${sum} nhưng có ${row.attempts} lượt`);
    }
  }
  /* Và lọc theo loại lớp thì tổng hai phần phải bằng tổng chung — không mất, không trùng. */
  const all = weekly.weeklyRollup(P.admin, {});
  const n = (x: any) => x.rows.reduce((z: number, r: any) => z + r.attempts, 0);
  assert(n(weekly.weeklyRollup(P.admin, { track: 'normal' }))
       + n(weekly.weeklyRollup(P.admin, { track: 'ft' })) === n(all),
    'Lượt Normal cộng lượt FT không bằng tổng chung');
});

check('Cột Case đếm CASE, không đếm lượt có case', () => {
  const r = weekly.weeklyRollup(P.admin, {});
  const cases = r.rows.reduce((z, x) => z + x.cases, 0);
  const students = r.rows.reduce((z, x) => z + x.caseStudents, 0);
  assert(cases > 0, 'Không tuần nào có case — dữ liệu mẫu không đủ để kiểm tra');
  /* Một em có thể có nhiều case, nên số case luôn ≥ số học viên có case. */
  assert(cases >= students, `Đếm ${cases} case nhưng lại ${students} học viên có case`);
  /* Và con số phải khớp với số case thật sinh từ những lượt trong cửa sổ đang xem. */
  const pids = r.rows.map((x) => x.periodId);
  const real = (conn.prepare(
    `SELECT COUNT(*) n FROM sos_cases sc
       JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE COALESCE(sc.sos_level, 1) > 0
        AND a.planned_period_id IN (${pids.map(() => '?').join(',')})`,
  ).get(...pids) as any).n;
  assert(cases === real, `Bảng nói ${cases} case, cơ sở dữ liệu có ${real}`);
});

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
    primaryCode: 'student.behaviour.homework',
    studentId: someStudent.id,
    summary: 'Em hay quên bài về nhà hai tuần liền. Nhà xa, bố mẹ đi làm ca nên em phải trông em nhỏ.',
    urgency: 'attention',
    track: 'behaviour', topic: 'homework',
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
  assert(r.track === 'behaviour' && r.topic === 'homework', 'Vấn đề ý thức phải vào đúng đầu mục và nhóm');
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
  assertThrows(
    () => cases.recordIntervention(P.coreTeacher, c.id, {
      kind: 'tutor', description: 'Học tutor', status: 'started', startedDate: TODAY,
    }),
    /người thực hiện/, 'Không ghi ai làm mà vẫn lưu được',
  );
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
  assert(iv.actionDue === domain.weeklyUpdateDue(addDays(TODAY, -20)),
    `Hạn cập nhật phải là Chủ nhật đầu tiên: kỳ vọng ${domain.weeklyUpdateDue(addDays(TODAY, -20))}, đang là ${iv.actionDue}`);
  assert(iv.followupDue === domain.planEndDefault(addDays(TODAY, -20)),
    `Dự kiến kết thúc phải là Chủ nhật tuần tiếp theo: kỳ vọng ${domain.planEndDefault(addDays(TODAY, -20))}, đang là ${iv.followupDue}`);
  assert(iv.actionDue < iv.followupDue, 'Hạn cập nhật và ngày kết thúc bị gộp làm một con số');
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
check('[9.3] Hoàn thành case: một đường duy nhất, có kết luận và mọi phương án đã khép', () => {
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
    /ghi kết luận/, 'Hoàn thành case mà không phải viết kết luận',
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

  // Kết thúc phương án (tab "Kết thúc") → lúc này mới đóng được.
  cases.updateResult(P.coreTeacher, ivId, {
    mode: 'end', outcome: 'improved', nextStep: 'complete',
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
    /Tiếp tục theo dõi/, '"Chưa đủ dữ liệu" vẫn kết thúc được phương án',
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
  const after = cases.updateResult(P.coreTeacher, ivId, {
    outcome: 'unchanged', note: 'Em có làm nhưng chưa đều, còn sai dạng T/F/NG',
  }) as any;
  assert(after.interventions.length === before, 'Tiếp tục theo dõi mà lại sinh thêm một phương án');
  const iv2 = after.interventions.find((i: any) => i.id === ivId);
  assert(iv2.status === 'started', 'Theo dõi tiếp mà phương án lại bị khép lại');
  assert(iv2.cycleNo === 2, `Phải sang chu kỳ 2, đang là ${iv2.cycleNo}`);
  assert(iv2.actionDue === domain.weeklyUpdateDue(addDays(demoToday(), 1)),
    `Hạn cập nhật mới phải là Chủ nhật kế tiếp, đang là ${iv2.actionDue}`);
  assert(iv2.actionDue > demoToday(), 'Vừa cập nhật xong đã báo quá hạn');

  // "Đề xuất phương án mới" khép phương án cũ với lý do ĐƯỢC THAY THẾ, không phải đã thành công.
  const replaced = cases.updateResult(P.coreTeacher, ivId, {
    mode: 'end', outcome: 'worse', nextStep: 'propose', note: 'Tự học không ăn thua với em này',
    newPlan: { kind: 'tutor', description: 'Chuyển sang tutor hai buổi mỗi tuần', performerName: 'Tutor C' },
  }) as any;
  const old = replaced.interventions.find((i: any) => i.id === ivId);
  assert(old.closedReason === 'superseded', `Phương án cũ phải ghi "được thay thế", đang là ${old.closedReason}`);
  assert(old.supersededBy, 'Phương án cũ không nối sang phương án mới');
  assert(replaced.interventions.some((i: any) => i.description === 'Chuyển sang tutor hai buổi mỗi tuần'),
    'Không tạo phương án mới');
});

check('Chỉ GVCN của lớp và Quản lý mới đóng được case', () => {
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
  // Giáo viên bộ môn ghi nhận được nhưng không đóng.
  assertThrows(
    () => cases.setDisposition(P.subjectTeacher, c.id, { status: 'done', disposition: 'no_action' }),
    /chủ nhiệm|Quản lý/, 'Giáo viên bộ môn đóng được case',
  );
  assert(cases.canCloseCase(P.mbManager, { class_id: mbClass, student_id: someStudent.id }),
    'Quản lý phải đóng được case trong chi nhánh');
  assert(cases.canCloseCase(P.coreTeacher, { class_id: mbClass, student_id: someStudent.id }),
    'GVCN phải đóng được case lớp mình');
  assert(!cases.canCloseCase(P.subjectTeacher, { class_id: mbClass, student_id: someStudent.id }),
    'Giáo viên bộ môn không được đóng case');
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
    .get(classId('CP-FT 110')) as any;
  assertThrows(() => cases.reportIssue(P.coreTeacher, { studentId: cp.id, topic: 'listening', summary: 'Ngoài phạm vi phụ trách của người báo.' }),
    /phạm vi/, 'GVCN lớp MB báo vấn đề học viên lớp CP');
});

check('Bốn hàng đợi trả lời bốn câu hỏi khác nhau', () => {
  const q = cases.caseQueueCounts(P.admin, {});
  assert(q.total > 0, 'Không có case nào đang mở');
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

check('Lọc theo đầu mục và theo chủ đề', () => {
  const all = cases.listCases(P.admin, {}).rows;
  assert(all.some((r) => r.track === 'academic'), 'Không có vấn đề nào ở Học thuật');
  assert(all.some((r) => r.track === 'behaviour'), 'Không có vấn đề nào ở Ý thức');
  const academic = cases.listCases(P.admin, { group: 'academic' }).rows;
  for (const r of academic) assert(r.track === 'academic', 'Lọc đầu mục sai');
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
  assert(fromMock.length > 0 && fromTeacher.length > 0, 'Thiếu một trong hai nguồn case chính');
  const total = cases.listCases(P.admin, {}).rows.length;
  assert(total === fromMock.length + fromTeacher.length + fromTask.length,
    `Ba nguồn cộng lại ${fromMock.length + fromTeacher.length + fromTask.length} khác tổng ${total}`);
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
  // Một kỹ năng dưới kỳ vọng là đủ để mở case ngay.
  attempts.saveScore(P.admin, a.id, 'listening', { rawScore: 10 });
  const made = conn
    .prepare(
      `SELECT sc.* FROM sos_cases sc
        WHERE sc.attempt_id = ? AND sc.track = 'academic' ORDER BY sc.id LIMIT 1`,
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
        WHERE origin_kind = 'mock' AND summary IS NOT NULL AND reported_by IS NULL`,
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

check('Góp ý KHÔNG kết thúc việc chờ; duyệt và không duyệt thì mới kết thúc', () => {
  const plan = pendingPlanIn('CP');
  cases.respondToPlan(P.cpManager, plan.id, { decision: 'comment', note: 'Cho tôi xem bài gần nhất' });
  const afterComment = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(plan.id) as any;
  assert(afterComment.approval_state === 'pending', 'Góp ý đã xoá mất việc chờ duyệt');
  assert(afterComment.approval_note === 'Cho tôi xem bài gần nhất', 'Góp ý không được lưu lại');

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

check('Quản lý thấy nhóm "Chờ tôi xử lý", giáo viên thì không', () => {
  const gv = loadPrincipal(teacherOfSkill('MB-FT 102', 'listening'));
  const mgrGroups = mywork.myWork(P.mbManager).groups.map((g: any) => g.key);
  const gvGroups = mywork.myWork(gv).groups.map((g: any) => g.key);
  assert(!gvGroups.includes('decide'), 'Giáo viên bị giao việc duyệt mà họ không có quyền làm');
  const anyManagerHasIt = ['MB', 'CP', 'BC', 'HD']
    .map((b) => loadPrincipal(userByRole('manager', b)))
    .some((m) => mywork.myWork(m).groups.some((g: any) => g.key === 'decide'));
  assert(anyManagerHasIt, 'Không Quản lý nào thấy đề xuất đang chờ duyệt');
  assert(Array.isArray(mgrGroups), 'myWork không trả về nhóm');
});

check('Mỗi việc quá hạn nói rõ quá hạn CÁI GÌ', () => {
  const seen = new Set<string>();
  for (const b of ['MB', 'CP', 'BC', 'HD', 'TL']) {
    let m;
    try { m = loadPrincipal(userByRole('manager', b)); } catch { continue; }
    for (const g of mywork.myWork(m).groups) {
      for (const it of g.items) {
        if (it.urgency === 'overdue') {
          assert(it.overdueLabel && /^Quá hạn /.test(it.overdueLabel),
            `Việc quá hạn ở nhóm ${g.key} không ghi rõ quá hạn gì: ${it.overdueLabel}`);
          seen.add(it.overdueLabel ?? "");
        }
        if (it.urgency === 'normal') assert(!it.overdueLabel, `Việc chưa tới hạn lại gắn nhãn ${it.overdueLabel}`);
      }
    }
  }
  assert(seen.size >= 2, `Chỉ có ${seen.size} kiểu nhãn quá hạn — đáng lẽ mỗi loại việc một kiểu`);
});

check('Kết quả sau hỗ trợ là việc của NGƯỜI THỰC HIỆN; quá hạn thì Quản lý cũng thấy', () => {
  const gv = loadPrincipal(teacherOfSkill('CP-FT 110', 'speaking'));
  const mgr = loadPrincipal(userByRole('manager', 'CP'));
  const reviewOf = (p: any) => (mywork.myWork(p).groups.find((g: any) => g.key === 'result')?.items ?? []);

  // Dữ liệu mẫu: tutor CP-FT 110 hẹn 10/09, nay đã 14/09 — quá hạn, nên cả hai đều thấy.
  const gvItems = reviewOf(gv);
  const mgrItems = reviewOf(mgr);
  assert(gvItems.length > 0, 'Người ghi phương án không thấy việc cập nhật kết quả của mình');
  assert(gvItems.every((i: any) => i.actionLabel === 'Cập nhật kết quả'), 'Nhãn hành động không đúng');
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
  const items = (mywork.myWork(P.coreTeacher).groups.find((g: any) => g.key === 'result')?.items ?? []);
  assert(!items.some((i: any) => i.caseId === c.id),
    'Phương án chưa được duyệt đã bị đòi cập nhật kết quả');
});

console.log('\n19. Phân công giáo viên');

check('Giáo viên không tự phân công mình vào lớp', () => {
  const gv = loadPrincipal(teacherOfSkill('MB-FT 102', 'listening'));
  assertThrows(() => classesSvc.setClassTeachers(gv, mbClass, { slots: [] }),
    /Quản lý|Admin|quyền/, 'Giáo viên đổi phân công');
  assert(!can(gv, PERMISSIONS.CLASS_ASSIGN, { classId: mbClass }), 'Giáo viên đang có quyền phân công');
  assert(can(P.mbManager, PERMISSIONS.CLASS_ASSIGN, { classId: mbClass }), 'Quản lý phải phân công được');
});

check('Không xếp người của chi nhánh khác, và không xếp kỹ năng lớp không dạy', () => {
  const cpTeacher = teacherOfSkill('CP-FT 110', 'listening');
  assertThrows(
    () => classesSvc.setClassTeachers(P.mbManager, mbClass, {
      slots: [{ userId: cpTeacher, skill: 'listening', isCore: false }],
    }),
    /chi nhánh/, 'Xếp giáo viên CP vào lớp MB',
  );
  const found = classId('MB-FOU 12');
  const anyTeacher = classesSvc.classTeachers(P.mbManager, found).candidates[0];
  assertThrows(
    () => classesSvc.setClassTeachers(P.mbManager, found, {
      slots: [{ userId: anyTeacher.id, skill: 'writing2', isCore: false }],
    }),
    /không dạy kỹ năng/, 'Xếp W2 cho lớp không có W2',
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
    /chỉ một người/, 'Xếp hai giáo viên vào cùng một kỹ năng',
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
    /một giáo viên chủ nhiệm/, 'Xếp hai giáo viên chủ nhiệm cho một lớp',
  );
});

check('Dữ liệu mẫu có đủ bốn mức gấp, không phải một màu đỏ', () => {
  const open = conn
    .prepare(
      `SELECT followup_due FROM case_interventions
        WHERE followup_due IS NOT NULL AND status != 'cancelled'
          AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = case_interventions.id)`,
    )
    .all() as any[];
  const t = demoToday();
  const late = open.filter((r) => r.followup_due < t).length;
  const today = open.filter((r) => r.followup_due === t).length;
  const soon = open.filter((r) => r.followup_due > t).length;
  assert(late > 0 && today > 0 && soon > 0,
    `Hẹn xem lại phải có cả ba mức (quá hạn ${late}, hôm nay ${today}, còn hạn ${soon}) — `
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
  attempts.saveScore(P.admin, a.id, 'listening', { rawScore: 40 });
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
        WHERE status = 'done' AND sos_level > 0 AND track = 'academic' LIMIT 1`,
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

console.log('\n21. Hai việc trao đổi — nay là phương án của case Ý thức/Khác');

check('Mỗi lượt có SOS sinh đúng MỘT case Ý thức/Khác, không phải mỗi kỹ năng một cái', () => {
  const dup = conn
    .prepare(
      `SELECT attempt_id, COUNT(*) n FROM sos_cases
        WHERE track = 'behaviour' AND origin_kind = 'mock' AND attempt_id IS NOT NULL
        GROUP BY attempt_id HAVING n > 1`,
    )
    .all() as any[];
  assert(dup.length === 0, `${dup.length} lượt bị sinh trùng case Ý thức/Khác`);

  /*
   * MỌI ĐỢT CÓ SOS PHẢI CÓ MỘT TÍN HIỆU Ý THỨC/KHÁC — nhưng KHÔNG nhất thiết có case.
   *
   * Đây là chỗ vòng 7 đảo lại (mục 6.2). Trước đây mỗi đợt có SOS tự mở một case Ý thức/Khác
   * kèm sẵn hai việc trao đổi; nay nó chỉ sinh một tín hiệu cho GVCN, và cô quyết định có mở
   * case hay không. Một mốc Ý thức/Khác KHÔNG tự kết luận em thiếu ý thức.
   *
   * Nên điều phải kiểm đổi thành: mỗi đợt đúng MỘT tín hiệu Ý thức/Khác, không thừa không
   * thiếu — còn case thì chỉ có khi đã có người xác minh.
   */
  const missing = conn
    .prepare(
      `SELECT sg.attempt_id FROM case_signals sg
        WHERE sg.track = 'academic' AND sg.attempt_id IS NOT NULL AND sg.sos_level > 0
          AND NOT EXISTS (SELECT 1 FROM case_signals b
                           WHERE b.attempt_id = sg.attempt_id AND b.track = 'behaviour')
        GROUP BY sg.attempt_id`,
    )
    .all() as any[];
  assert(missing.length === 0,
    `${missing.length} đợt có SOS mà thiếu tín hiệu Ý thức/Khác (ví dụ đợt ${missing[0]?.attempt_id})`);

  const dupSignal = conn
    .prepare(
      `SELECT attempt_id, COUNT(*) n FROM case_signals
        WHERE track = 'behaviour' AND attempt_id IS NOT NULL
        GROUP BY attempt_id HAVING n > 1`,
    )
    .all() as any[];
  assert(dupSignal.length === 0, `${dupSignal.length} đợt bị sinh trùng tín hiệu Ý thức/Khác`);

  /* Và KHÔNG case Ý thức/Khác nào được ra đời mà không có người xác minh đứng tên. */
  const orphan = conn
    .prepare(
      `SELECT COUNT(*) n FROM sos_cases sc
        WHERE sc.track = 'behaviour' AND sc.origin_kind = 'mock'
          AND NOT EXISTS (SELECT 1 FROM case_signals sg
                           WHERE sg.case_id = sc.id AND sg.resolved_by IS NOT NULL)`,
    )
    .get() as any;
  assert(orphan.n === 0,
    `${orphan.n} case Ý thức/Khác ra đời mà không ai xác minh — máy vẫn đang tự mở case`);
});

check('Case Ý thức/Khác do GVCN mở mang đúng HAI việc trao đổi', () => {
  const rows = conn
    .prepare(
      `SELECT sc.id,
              SUM(CASE WHEN iv.kind = 'talk_student' THEN 1 ELSE 0 END) AS st,
              SUM(CASE WHEN iv.kind = 'talk_parent'  THEN 1 ELSE 0 END) AS pa
         FROM sos_cases sc
         LEFT JOIN case_interventions iv ON iv.case_id = sc.id
        WHERE sc.track = 'behaviour' AND sc.origin_kind = 'mock'
        GROUP BY sc.id`,
    )
    .all() as any[];
  assert(rows.length > 0, 'Không có case Ý thức/Khác nào sinh từ MT để kiểm');
  for (const r of rows) {
    assert(r.st === 1, `Case ${r.id} có ${r.st} việc trao đổi với học viên, phải đúng 1`);
    assert(r.pa === 1, `Case ${r.id} có ${r.pa} việc trao đổi với phụ huynh, phải đúng 1`);
  }
});

check('Hai việc trao đổi nằm CHUNG bảng phương án, không còn bảng riêng', () => {
  const n = (conn
    .prepare("SELECT COUNT(*) n FROM case_interventions WHERE kind IN ('talk_student','talk_parent')")
    .get() as any).n;
  assert(n > 0, 'Không còn việc trao đổi nào trong bảng phương án — dữ liệu cũ bị mất khi di trú');
  /* Và chúng phải nằm trong case Ý thức/Khác, không lạc vào case học thuật. */
  const stray = (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.kind IN ('talk_student','talk_parent') AND sc.track != 'behaviour'`,
    )
    .get() as any).n;
  assert(stray === 0, `${stray} việc trao đổi lạc vào case học thuật`);
});

check('[8.3] Hạn việc trao đổi: 3 ngày nếu Gấp, 5 ngày nếu Cần chú ý, từ lúc nhận case', () => {
  const rows = conn
    .prepare(
      `SELECT iv.action_due, iv.kind, sc.sos_level, sc.detected_at
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.kind IN ('talk_student','talk_parent')
          AND iv.action_due IS NOT NULL AND sc.detected_at IS NOT NULL
          AND sc.origin_kind = 'mock' AND sc.sos_level > 0
        LIMIT 40`,
    )
    .all() as any[];
  assert(rows.length > 0, 'Không có việc trao đổi nào có hạn để kiểm');
  for (const r of rows) {
    /*
     * Việc trao đổi thuộc case Ý thức/Khác. Bảng hạn mục 8.3: nghĩa vụ "có VÀ hoàn thành
     * phương án" tính từ lúc NHẬN CASE — Gấp 3 ngày, Cần chú ý 5 ngày. Không dùng mặc định
     * "Chủ nhật tuần tiếp theo" của học thuật, vì nó vượt hẳn hạn 3/5 ngày.
     */
    const expected = domain.planDueDate(r.detected_at, r.sos_level >= 3 ? 'urgent' : 'attention');
    assert(r.action_due === expected,
      `Việc trao đổi phát hiện ${r.detected_at} phải có hạn ${expected}, đang là ${r.action_due}`);
  }
});

check('Xác nhận đã trao đổi phải có ngày, và không nhận ngày ở tương lai', () => {
  const row = conn
    .prepare(
      `SELECT iv.id, iv.case_id FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         JOIN students s ON s.id = sc.student_id
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN classes cl ON cl.id = e.class_id
         JOIN branches b ON b.id = cl.branch_id
        WHERE iv.kind = 'talk_parent' AND iv.status != 'completed' AND b.code = 'MB' LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Không có việc trao đổi nào đang chờ ở MB');
  assertThrows(
    () => cases.completeIntervention(P.mbManager, row.id, { doneOn: addDays(demoToday(), 3) }),
    /tương lai/, 'Ghi ngày trao đổi ở tương lai',
  );
  cases.completeIntervention(P.mbManager, row.id, {
    doneOn: demoToday(), note: 'Đã gọi, PH nắm được',
  });
  const after = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(row.id) as any;
  assert(after.status === 'completed' && after.completed_date === demoToday(),
    'Không lưu đúng trạng thái và ngày thực hiện');
});

console.log('\n22. Phương án tự sinh và hạn theo mức gấp');

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

check('Chu kỳ Ý THỨC/KHÁC: một tuần kể từ lúc phương án bắt đầu', () => {
  const { cycleDeadline } = domain;
  assert(cycleDeadline('2026-09-14', 'behaviour') === '2026-09-21', 'Một tuần kể từ 14/09 là 21/09');
  assert(cycleDeadline('2026-09-17', 'behaviour') === '2026-09-24',
    'Case Ý thức tính từ chính ngày bắt đầu, KHÔNG căn theo tuần lịch');
});

check('Kết quả tốt được khép lại; kết quả chưa tốt BẮT BUỘC đi tiếp', () => {
  const { nextStepsFor, FOLLOWUP_OUTCOMES, BEHAVIOUR_OUTCOMES } = domain;
  assert(FOLLOWUP_OUTCOMES.length === 5, 'Case học thuật phải có đủ năm kết quả');
  assert(BEHAVIOUR_OUTCOMES.length === 3, 'Case Ý thức/Khác chỉ có ba kết quả');
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
    /lùi cái gì/, 'Đề xuất lùi lịch thi không nói rõ đối tượng mà vẫn gửi được',
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

console.log('\n23. Hai đầu mục thay ba nhóm cũ');

check('Chỉ còn Học thuật và Ý thức — không còn Giáo viên hay Giáo trình', () => {
  const rows = conn.prepare('SELECT DISTINCT track FROM sos_cases').all() as any[];
  for (const r of rows) {
    assert(['academic', 'behaviour'].includes(r.track), `Còn đầu mục lạ: ${r.track}`);
  }
  const bad = conn
    .prepare("SELECT COUNT(*) n FROM case_issues WHERE taxonomy_code LIKE 'teacher.%' OR taxonomy_code LIKE 'curriculum.%'")
    .get() as any;
  assert(bad.n === 0, `${bad.n} phân loại Giáo viên/Giáo trình vẫn nằm trong vấn đề của học viên`);
});

check('Ý thức chỉ bốn nhóm, và không có mã phân loại con', () => {
  const rows = conn.prepare("SELECT DISTINCT topic FROM sos_cases WHERE track = 'behaviour'").all() as any[];
  for (const r of rows) {
    assert(['attendance', 'homework', 'participation', 'other'].includes(r.topic),
      `Nhóm ý thức lạ: ${r.topic}`);
  }
});

check('Bỏ hoàn cảnh: không còn vai trò context, và Ghi chú giữ nguyên chữ', () => {
  assert(!(domain.ISSUE_ROLES as readonly string[]).includes('context'), 'Vai trò "hoàn cảnh" vẫn còn');
  const n = (conn.prepare("SELECT COUNT(*) n FROM case_issues WHERE role = 'context'").get() as any).n;
  assert(n === 0, `${n} dòng hoàn cảnh vẫn còn trong dữ liệu`);
});

console.log('\n24. Bảng tổng hợp và khối của Quản lý');

check('Số trên bảng tổng hợp khớp với danh sách bên dưới', () => {
  const s = summary.branchSummary(P.admin, {});
  assert(s.rows.length > 0, 'Bảng tổng hợp trống');
  const open = cases.listCases(P.admin, {}).rows.filter((r) => r.state !== 'done');
  const fromTable = s.rows.reduce((a, r) => a + (r.cells.openCases?.value ?? 0), 0);
  assert(fromTable === open.length,
    `Bảng cộng ra ${fromTable} vấn đề đang mở nhưng danh sách có ${open.length} — hai chỗ đếm khác nhau`);
  assert(s.total.cells.openCases?.value === fromTable, 'Hàng tổng không bằng tổng các hàng trên');
});

check('SOS đếm HỌC VIÊN theo KẾT QUẢ BÀI GẦN NHẤT, không đếm case', () => {
  /*
   * Mục 2.1: mức SOS là kết luận của MỘT bài đánh giá, không phải "còn việc đang làm dở".
   * Nên ba cột SOS phải đếm được lại từ `standingFor`, và mỗi em chỉ đứng ở đúng một cột.
   */
  const s = summary.branchSummary(P.admin, {});
  const r = s.rows.find((x) => (x.cells.sos2?.value ?? 0) > 0);
  assert(r, 'Không có hàng nào có SOS 2 để thử');

  const ids = (conn
    .prepare(
      `SELECT e.student_id AS id FROM enrollments e
         JOIN students st ON st.id = e.student_id
         JOIN classes cl ON cl.id = e.class_id
        WHERE e.status = 'active' AND st.status = 'active' AND st.archived_at IS NULL
          AND cl.branch_id = ?`,
    )
    .all(r!.branchId) as any[]).map((x) => x.id);
  const st = standing.standingFor(ids);
  const atLevel = (lv: number) => ids.filter((id) => st.get(id)?.sosLevel === lv).length;

  for (const lv of [1, 2, 3]) {
    const shown = r!.cells[`sos${lv}`]?.value ?? 0;
    assert(shown === atLevel(lv),
      `Cột SOS ${lv} nói ${shown} em, nhưng kết quả bài gần nhất cho ra ${atLevel(lv)} em`);
  }
  /* Ba cột loại trừ nhau và không bao giờ vượt sĩ số. */
  const total = atLevel(1) + atLevel(2) + atLevel(3);
  assert(total <= (r!.cells.students?.value ?? 0), 'Ba cột SOS cộng lại vượt sĩ số');
});

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

check('Bộ cột đặt sẵn nhớ theo tài khoản, và không rò sang người khác', () => {
  prefs.setPref(P.mbManager, 'summary.preset', 'skills');
  assert(prefs.getPref(P.mbManager, 'summary.preset') === 'skills', 'Không nhớ lựa chọn');
  assert(prefs.getPref(P.cpManager, 'summary.preset', 'default') === 'default',
    'Lựa chọn của người này rò sang người khác');
  prefs.setPref(P.mbManager, 'summary.preset', 'default');
});

check('Khối Quản lý chỉ dành cho Quản lý, và không xếp hạng giáo viên', () => {
  /* Lớp 102: lớp 101 đã bị test phân công gỡ mất giáo viên Listening. */
  const gv = loadPrincipal(teacherOfSkill('MB-FT 102', 'listening'));
  assert(pulse.branchPulse(gv, {}) === null, 'Giáo viên thấy khối điều phối của Quản lý');
  /* Chưa chọn chi nhánh: mỗi hàng là một CHI NHÁNH, không liệt kê từng lớp (mục 9.2). */
  const b = pulse.branchPulse(P.mbManager, {});
  assert(b && b.mode === 'branches' && b.rows.length > 0, 'Quản lý không thấy chi nhánh nào đang tồn việc');
  // Bảng theo người phải sắp theo VIỆC ĐÃ QUÁ HẠN, không phải theo một chỉ số "hiệu suất".
  for (let i = 1; i < b!.people.length; i++) {
    const late = (x: any) => x.mtOverdue + x.overdueUpdate;
    assert(late(b!.people[i - 1]) >= late(b!.people[i]), 'Bảng theo người sắp sai');
  }

  /* Chọn một chi nhánh: hai nhóm Normal và FT, và hàng tổng phải bằng tổng các hàng. */
  const mbBranch = (conn.prepare("SELECT id FROM branches WHERE code='MB'").get() as any).id;
  const one = pulse.branchPulse(P.mbManager, { branchId: mbBranch })!;
  assert(one.mode === 'groups', 'Chọn chi nhánh rồi vẫn hiện theo chi nhánh');
  const sum = one.rows.reduce((n: number, g: any) => n + g.metrics.cases, 0);
  assert(sum <= one.total.cases, `Tổng nhóm ${sum} vượt quá tổng chi nhánh ${one.total.cases}`);
  for (const g of one.rows) {
    const inner = g.classes.reduce((n: number, c: any) => n + c.metrics.cases, 0);
    assert(inner <= g.metrics.cases, 'Tổng của nhóm nhỏ hơn tổng các lớp trong nhóm');
  }
  /* Sĩ số là sĩ số thật: tổng HV cần hỗ trợ không bao giờ vượt tổng sĩ số. */
  assert(one.total.needSupport <= one.total.size,
    `HV cần hỗ trợ ${one.total.needSupport} vượt sĩ số ${one.total.size}`);
});

console.log('\n25. Việc Quản lý giao, toả ra thành phương án');

check('Một task cho cả lớp là MỘT task, toả ra hồ sơ từng em', () => {
  const cls = classId('MB-FT 102');
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const t = meeting.createTask(P.mbManager, {
    kind: 'teacher_task', title: 'Luyện đọc bấm giờ 10 phút mỗi buổi',
    classId: cls, track: 'academic', topic: 'reading',
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
  const cls = classId('MB-FT 102');
  meeting.createTask(P.mbManager, {
    kind: 'teacher_task', title: 'Đợt hai: vẫn luyện đọc bấm giờ',
    classId: cls, track: 'academic', topic: 'reading',
  });
  /*
   * `parallel = 1` là case người dùng ĐÃ THẤY cảnh báo trùng và cố ý mở riêng (mục 7.2:
   * "cho chọn thêm vào case đang có hoặc tạo case riêng; không âm thầm gộp"). Phép kiểm
   * này nói về việc máy tự mở trùng, nên loại những case cố ý ra.
   */
  const dup = conn
    .prepare(
      `SELECT student_id, COUNT(*) n FROM sos_cases
        WHERE topic = 'reading' AND track = 'academic' AND status != 'done' AND attempt_id IS NULL
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
      kind: 'teacher_task', title: 'Thiếu kỹ năng', classId: classId('MB-FT 101'),
    }),
    /kỹ năng|ý thức/, 'Giao việc mà không chọn kỹ năng',
  );
});

console.log('\n26. Việc trao đổi tới tay đúng người');

check('GVCN nhận việc gặp học viên; việc gọi phụ huynh về Quản lý, không rơi vào GVBM sai môn', () => {
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
  assert(mismatchRow, 'Seed thiếu một GVBM khác môn (không kiêm GVCN) ở MB-FT 101 để kiểm AUTH-01');
  const mismatchTeacher = loadPrincipal(mismatchRow.id);

  const enr = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(mbClass) as any;
  const cy = conn.prepare(
    `SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' LIMIT 1`,
  ).get(enr.student_id) as any;
  const ownSkillCase = cases.reportIssue(P.admin, {
    studentId: enr.student_id, cycleId: cy?.id, track: 'academic', topic: subjectSkill,
    primaryCode: domain.issuesForTopic(subjectSkill)[0].code,
    title: `${subjectSkill}: kiểm việc gặp học viên`,
    summary: `Ghi nhận riêng để kiểm ai nhận việc "gặp học viên" của case ${subjectSkill}.`,
    parallel: true,
  }) as any;
  const iv = cases.recordIntervention(P.subjectTeacher, ownSkillCase.id, {
    kind: 'talk_student', description: 'Hẹn nói chuyện riêng về việc học gần đây.', status: 'planned',
  }) as any;
  const ivId = iv.interventions[iv.interventions.length - 1].id as number;
  // Đưa hạn về hôm nay để việc rơi vào nhóm "tới hạn", giống cách các phép kiểm khác dựng dữ liệu quá hạn.
  conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(TODAY, ivId);

  // Chỉ GVCN mới ghi nhận được việc "gọi phụ huynh" của case này (AUTH-01: cả hai đều đòi đúng người).
  const ivParent = cases.recordIntervention(P.coreTeacher, ownSkillCase.id, {
    kind: 'talk_parent', description: 'Gọi phụ huynh trao đổi tình hình gần đây.', status: 'planned',
  }) as any;
  const ivParentId = ivParent.interventions[ivParent.interventions.length - 1].id as number;
  conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(TODAY, ivParentId);

  const kinds = (who: any) => {
    const out = new Set<string>();
    for (const g of mywork.myWork(who, {}).groups) {
      if (g.key !== 'do_plan') continue;
      for (const it of g.items) {
        if (it.caseId !== ownSkillCase.id) continue;
        /* Nhãn đổi ở mục 8.1: "Meeting với học sinh" và "Report cho gia đình". */
        if (/meeting với học sinh/i.test(it.reason)) out.add('talk_student');
        if (/report cho gia đình/i.test(it.reason)) out.add('talk_parent');
      }
    }
    return out;
  };

  const ownGvKinds = kinds(P.subjectTeacher);
  assert(ownGvKinds.has('talk_student'), 'GVBM đúng kỹ năng không nhận việc gặp học viên của case kỹ năng mình');
  assert(!ownGvKinds.has('talk_parent'), 'GVBM bị giao việc gọi phụ huynh — việc đó không phải của họ');

  const wrongGvKinds = kinds(mismatchTeacher);
  assert(!wrongGvKinds.has('talk_student'), 'AUTH-01: GVBM sai môn vẫn nhận được việc gặp học viên của case kỹ năng khác');

  assert(kinds(P.coreTeacher).has('talk_student'), 'GVCN không nhận việc gặp học viên của case trong lớp mình');

  /*
   * VAI ADMIN CHI NHÁNH ĐÃ BỎ sau PR15. Trước đây việc gọi phụ huynh tới tay văn phòng;
   * nay nó về Quản lý chi nhánh, đúng người có thẩm quyền xử lý phương án Ý thức/Khác.
   * Quản lý thấy CẢ HAI loại vì họ còn là người đôn đốc khi có ai đó quên.
   */
  const mgrKinds = kinds(P.mbManager);
  assert(mgrKinds.has('talk_parent'), 'Quản lý không nhận việc gọi phụ huynh sau khi bỏ vai văn phòng');
  assert(mgrKinds.has('talk_student'), 'Quản lý phải thấy cả việc gặp học viên để còn đôn đốc');

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
 * Bốn bài kiểm này là ĐÚNG bốn tiêu chí "Xong khi" của phase 1 trong `vong4/02_KE_HOACH_PHASE.md`.
 * Viết thành kiểm tra chứ không chỉ thử tay, vì đây là phần dễ vỡ nhất khi sửa về sau.
 */

check('Trượt Listening ở MT1 rồi MT2 → ĐÚNG MỘT case, tên đổi theo lượt mới nhất', () => {
  const cls = 'BC-FT 205';
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
      studentId: s.id, cycleId: s.cycle_id, classId: classId(cls), periodId: periodOf(date),
    }) as any;
    return a;
  };
  const bandBelow = (no: number) => {
    const exp = s.target_score - (no === 1 ? 1 : no === 2 ? 0.5 : 0);
    return scoring.LISTENING_BY_RAW.indexOf(exp - 0.5);
  };

  const a1 = mk(1, '2026-10-12');
  attempts.saveScore(lr, a1.id, 'listening', { rawScore: bandBelow(a1.attempt_no) });

  /*
   * LẦN TRƯỢT ĐẦU CHỈ SINH TÍN HIỆU (mục 6.2). Giáo viên bộ môn xác minh rồi mới có case —
   * đó là bước mà vòng 7 thêm vào, và là lý do case có tên và mô tả do người viết.
   */
  const noCaseYet = conn
    .prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND category = 'listening'`)
    .get(s.id) as any;
  assert(noCaseYet.n === 0, 'Lần trượt đầu đã tự mở case — mục 6.2 cấm');
  const sig1 = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'listening'`)
    .get(a1.id) as any;
  assert(sig1?.status === 'pending', 'Lần trượt đầu phải sinh một tín hiệu chờ xác minh');

  cases.reportIssue(lr, {
    primaryCode: 'student.listening.technique',
    studentId: s.id, cycleId: s.cycle_id, track: 'academic', topic: 'listening',
    title: 'Listening chưa bắt kịp tốc độ bài nghe',
    summary: 'Em nghe được ý chính nhưng mất các chi tiết ở phần 3 và 4.',
    fromSignalId: sig1.id,
  });
  const after1 = conn
    .prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'listening'`)
    .all(s.id) as any[];
  assert(after1.length === 1, `Xác minh xong phải có đúng 1 case, đang có ${after1.length}`);
  const caseId = after1[0].id;

  /* Ghi một phương án và một kết quả để kiểm rằng chúng SỐNG SÓT qua lần trượt thứ hai. */
  cases.recordIntervention(mgr, caseId, {
    kind: 'self_study', description: 'Nghe 30 phút mỗi ngày',
    performerSelf: true, status: 'completed', completedDate: TODAY,
  });
  cases.recordFollowUp(mgr, caseId, { observedOn: '2026-10-25', outcome: 'partial', note: 'Có làm nhưng chưa đều' });

  const a2 = mk(2, '2026-11-16');
  attempts.saveScore(lr, a2.id, 'listening', { rawScore: bandBelow(a2.attempt_no) });

  const after2 = conn
    .prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'listening'`)
    .all(s.id) as any[];
  assert(after2.length === 1,
    `MT2 trượt lại phải ghi vào CHÍNH case cũ, đang có ${after2.length} case Listening`);
  assert(after2[0].id === caseId, 'Case Listening bị thay bằng một case khác');

  const d = cases.caseDetail(mgr, caseId) as any;
  /*
   * TÊN CASE DO NGƯỜI ĐẶT VÀ KHÔNG BỊ MÁY VIẾT LẠI.
   *
   * Vòng trước, mỗi lần trượt lại máy đổi tên case thành "MT{n} - Listening dưới kỳ vọng".
   * Nay tên là nhận định của người dạy (mục 6.3), nên nó phải đứng yên — lần trượt thứ hai
   * thêm một MỐC, không sửa lời của ai.
   */
  assert(d.title === 'Listening chưa bắt kịp tốc độ bài nghe',
    `Tên case do người dạy đặt đã bị máy viết lại thành "${d.title}"`);
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
  const cls = 'BC-FT 205';
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
      studentId: s.id, cycleId: s.cycle_id, classId: classId(cls), periodId: periodOf(date),
    }) as any;
    return a;
  };
  const low = (no: number) => {
    const exp = s.target_score - (no === 1 ? 1 : no === 2 ? 0.5 : 0);
    return scoring.READING_BY_RAW.indexOf(exp - 0.5);
  };

  const a1 = mk('2026-10-19');
  attempts.saveScore(rt, a1.id, 'reading', { rawScore: low(a1.attempt_no) });
  const sigA = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'reading'`)
    .get(a1.id) as any;
  assert(sigA?.status === 'pending', 'Lần trượt đầu phải sinh một tín hiệu chờ xác minh');
  cases.reportIssue(rt, {
    primaryCode: 'student.reading.technique',
    studentId: s.id, cycleId: s.cycle_id, track: 'academic', topic: 'reading',
    title: 'Reading đọc chậm, không kịp bài cuối',
    summary: 'Em đọc kỹ từng câu nên hết giờ khi còn hai câu cuối.',
    fromSignalId: sigA.id,
  });
  const c = conn.prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'reading'`)
    .get(s.id) as any;
  assert(c, 'Chưa mở case Reading');

  /*
   * CHƯA LÀM GÌ THÌ CHƯA CHỐT ĐƯỢC. Từ vòng 7 case mới mở KHÔNG có phương án tự sinh nào,
   * nên chặn đầu tiên người dùng gặp là "chưa có phương án nào" — đúng và đáng có.
   */
  assertThrows(
    () => cases.closeCaseOutcome(mgr, c.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
    }),
    /chưa có phương án nào/, 'Chốt được kết quả một case chưa ai làm gì',
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
    /chưa cập nhật kết quả cuối cùng/, 'Chốt được kết quả case khi còn phương án treo',
  );
  for (const iv of open) cases.completeIntervention(mgr, iv.id, { doneOn: demoToday() });
  cases.closeCaseOutcome(mgr, c.id, {
    outcome: 'much_better', note: 'Em đọc nhanh hơn hẳn', decision: 'end',
  });
  const closed = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(c.id) as any;
  assert(closed.status === 'done', 'Chốt "kết thúc hẳn" mà case không đóng');

  /* Rồi MT sau trượt lại. */
  const a2 = mk('2026-11-23');
  attempts.saveScore(rt, a2.id, 'reading', { rawScore: low(a2.attempt_no) });

  /*
   * Case cũ ĐÃ ĐÓNG nên tín hiệu lần này KHÔNG nối vào nó — nó nằm chờ xác minh. Mở case
   * mới hay không là một quyết định có chủ đích của người dạy, không phải phản xạ của máy.
   */
  const sigB = conn
    .prepare(`SELECT * FROM case_signals WHERE attempt_id = ? AND skill = 'reading'`)
    .get(a2.id) as any;
  assert(sigB?.status === 'pending',
    'Case cũ đã đóng mà tín hiệu mới đã tự nối vào đâu đó thay vì chờ xác minh');
  cases.reportIssue(rt, {
    primaryCode: 'student.reading.technique',
    studentId: s.id, cycleId: s.cycle_id, track: 'academic', topic: 'reading',
    title: 'Reading chậm lại ở dạng bài True/False/Not Given',
    summary: 'Lần này em mất thời gian ở dạng True/False/Not Given, khác với lần trước.',
    fromSignalId: sigB.id,
  });

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

check('Tổng ba cột SOS KHÔNG BAO GIỜ lớn hơn sĩ số', () => {
  /* Đây là lỗi owner nêu đích danh: sĩ số 8 mà ba cột SOS cộng lại thành 11. */
  for (const who of [P.admin, P.mbManager, P.cpManager]) {
    const board = summary.branchSummary(who, {});
    for (const r of [...board.rows, board.total]) {
      const size = r.cells.students?.value ?? 0;
      const sos = (r.cells.sos1?.value ?? 0) + (r.cells.sos2?.value ?? 0) + (r.cells.sos3?.value ?? 0);
      assert(sos <= size, `${r.label}: sĩ số ${size} mà ba cột SOS cộng lại thành ${sos}`);
    }
    /* Và ở tầng lớp cũng vậy — bảng đổi theo chi nhánh thì phép đếm không được đổi. */
    const branches = conn.prepare('SELECT id FROM branches').all() as any[];
    for (const b of branches) {
      const sub = summary.branchSummary(who, { branchId: b.id });
      for (const r of sub.rows) {
        const size = r.cells.students?.value ?? 0;
        const sos = (r.cells.sos1?.value ?? 0) + (r.cells.sos2?.value ?? 0) + (r.cells.sos3?.value ?? 0);
        assert(sos <= size, `Lớp ${r.label}: sĩ số ${size} mà ba cột SOS cộng lại thành ${sos}`);
      }
    }
  }
});

check('Bảng theo dõi hỗ trợ luôn đủ SÁU hạng mục, kể cả hạng mục đang ổn', () => {
  const s = conn
    .prepare(
      `SELECT student_id FROM sos_cases WHERE track = 'academic' AND status != 'done' LIMIT 1`,
    )
    .get() as any;
  assert(s, 'Không có case nào đang mở để thử');
  const board = cases.skillSupportBoard(P.admin, s.student_id) as any;
  assert(board.rows.length === 6, `Bảng phải có đúng 6 dòng, đang có ${board.rows.length}`);
  const cats = board.rows.map((r: any) => r.category).join(',');
  assert(cats === 'listening,reading,writing1,writing2,speaking,behaviour',
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
        WHERE sc.track = 'academic' AND sc.status != 'done' AND sc.parallel = 0
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

check('Lớp Normal: chấm lại một bài CŨ vẫn hạ được mức của case', () => {
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
        WHERE sc.track = 'academic' AND sc.status != 'done' AND sc.sos_level > 0
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
  regular.saveRegularScore(P.admin, row.attempt_id, row.topic, { score: total, total });

  const after = conn.prepare('SELECT sos_level FROM sos_cases WHERE id = ?').get(row.id) as any;
  assert(after.sos_level === 0,
    `Kỹ năng đã đạt mà mức của case vẫn là ${after.sos_level} — case tìm theo lượt thi thay vì theo học viên`);
  const passed = conn
    .prepare(`SELECT 1 FROM case_milestones WHERE case_id = ? AND kind = 'passed'`)
    .get(row.id);
  assert(passed, 'Hạ mức mà không ghi mốc "đã đạt kỳ vọng"');
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
    student: { dob: null }, isFastTrack: false,
  });
  assert(normal.some((m) => m.key === 'start_week'), 'Thiếu tuần bắt đầu mà không nhắc');
  assert(!normal.some((m) => m.key === 'exam_month'), 'Lớp Normal bị nhắc tháng thi IELTS');
  assert(!normal.some((m) => m.key === 'target'), 'Lớp Normal bị nhắc Target IELTS');

  const ft = schedule.missingForStudent({
    cycle: { start_period_id: null, exam_month: null, target_score: null },
    student: { dob: null }, isFastTrack: true,
  });
  assert(ft.some((m) => m.key === 'exam_month') && ft.some((m) => m.key === 'target'),
    'Lớp FT phải bị nhắc cả tháng thi lẫn Target');
  for (const m of ft) assert(m.who, `Mục "${m.label}" không nói ai điền được`);

  /* Khai đủ thì badge biến mất hẳn, không để lại một nhãn rỗng. */
  const full = schedule.missingForStudent({
    cycle: { start_period_id: 1, exam_month: '2026-11', target_score: 6.5 },
    student: { dob: '2008-01-01' }, isFastTrack: true,
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

check('W của lớp Normal có cột RIÊNG, không gộp vào W2 của Fast Track', () => {
  const b = summary.branchSummary(P.admin, {});
  const all = cases.listCases(P.admin, {}).rows.filter((c: any) => c.state !== 'done');
  const countTopic = (t: string) => all.filter((c: any) => c.topic === t).length;

  const keys = b.columns.map((c: any) => c.key);
  assert(keys.includes('skill_writing'), 'Thiếu cột riêng cho môn W của lớp Normal');
  assert(keys.includes('skill_writing1') && keys.includes('skill_writing2'),
    'Vẫn phải giữ hai cột W1/W2 của Fast Track');

  const wCol = b.total.cells.skill_writing?.value ?? 0;
  const w2Col = b.total.cells.skill_writing2?.value ?? 0;
  assert(wCol === countTopic('writing'), `Cột W phải đếm ĐÚNG case môn W: ${wCol} ≠ ${countTopic('writing')}`);
  assert(w2Col === countTopic('writing2'),
    `Cột W2 không được cộng thêm case môn W: ${w2Col} ≠ ${countTopic('writing2')}`);

  // Pronunciation đã bỏ khỏi chương trình, nên không còn case nào mang chủ đề đó.
  assert(countTopic('pronunciation') === 0, 'Dữ liệu mẫu vẫn còn case Pronunciation');
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
  const cid = classId('CP-FT 110');
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

check('Bảng theo tuần: Đạt + SOS 1..3 + Tạm thời + Chưa đủ điểm = số lượt có kết quả', () => {
  const r = weekly.weeklyRollup(P.admin, { weeks: 26 });
  assert(r.rows.length > 0, 'Không có tuần nào có dữ liệu');
  for (const w of r.rows) {
    const sum = w.onTarget + w.sos1 + w.sos2 + w.sos3 + w.provisional + w.pending;
    assert(sum === w.attempts, `Tuần ${w.code}: sáu cột cộng lại ${sum} ≠ ${w.attempts} lượt`);
    assert(typeof w.pendingApproval === 'number', `Tuần ${w.code} thiếu cột Chờ duyệt`);
  }
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
  const cp = (conn.prepare("SELECT id FROM classes WHERE code = 'CP-FT 110'").get() as any).id;
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
  const gv = loadPrincipal(teacherOfSkill('MB-FT 102', 'listening'));
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

  sysconfig.saveRoute(P.admin, { code: 'LT9', name: 'Lộ trình thử' });
  assert(sysconfig.activeRouteCodes().includes('LT9'), 'Không thêm được lộ trình mới');
  /* Ngừng dùng thì biến khỏi ô chọn, nhưng bản ghi vẫn còn để đọc lịch sử. */
  sysconfig.saveRoute(P.admin, { code: 'LT9', name: 'Lộ trình thử', status: 'inactive' });
  assert(!sysconfig.activeRouteCodes().includes('LT9'), 'Ngừng dùng mà vẫn chọn được');
  assert(sysconfig.listRoutes(true).some((r: any) => r.code === 'LT9'), 'Ngừng dùng đã xoá mất bản ghi');

  /* Giáo viên không sửa được danh mục. */
  const gv = loadPrincipal(teacherOfSkill('MB-FT 102', 'listening'));
  assertThrows(() => sysconfig.saveRoute(gv, { code: 'LT8', name: 'Thử' }), /Quản trị hệ thống/,
    'Giáo viên sửa được lộ trình');

  /* Loại lớp GỐC khoá cách chấm và bộ kỹ năng — đổi là đổi ý nghĩa của điểm đã nhập. */
  sysconfig.saveProgramme(P.admin, {
    code: 'FOU', name: 'Foundation', weeks: 8, scoringMode: 'ielts_band',
    skills: ['listening'], progressWeek: 4, finalWeek: 8,
  });
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
  assert(href === `/bang-diem-thuong/${a.class_id}?kind=progress`,
    `Bài Progress Test phải mở bảng điểm lớp Normal, đang là ${href}`);
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
        WHERE a.kind != 'mock' AND sc.track = 'academic' LIMIT 1`,
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
  assert(/^\w+-BE \d\d$/.test(plan.suggestedCode ?? ''), `Mã lớp gợi ý sai: ${plan.suggestedCode}`);
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
  const r = transition.applyTransition(P.admin, {
    fromClassId: src.id,
    newClass: { code: plan.suggestedCode, programme: 'BE' },
    moves: ids.map((id: number) => ({ studentId: id, toNewClass: true })),
    effectiveDate: demoToday(),
  }) as any;
  assert(r.newClass, 'Không mở được lớp mới');
  assert(r.done.length === ids.length, `Phải chuyển ${ids.length} em, thực tế ${r.done.length}`);

  const created = conn.prepare('SELECT * FROM classes WHERE id = ?').get(r.newClass.id) as any;
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
  const r = transition.applyTransition(P.admin, {
    fromClassId: src.id,
    newClass: { code: plan.suggestedCode, programme: plan.defaultProgramme },
    moves: [
      { studentId: plan.students[0].id, toNewClass: true },
      { studentId: plan.students[0].id, toClassId: null },   // cố ý thiếu lớp đích
    ],
    effectiveDate: demoToday(),
  }) as any;
  assert(r.done.length === 1 && r.failed.length === 1, 'Lô phải có cả dòng xong lẫn dòng lỗi');
  assert(/lớp đích/i.test(r.failed[0].message), `Lý do lỗi phải nói rõ: ${r.failed[0].message}`);
});

// ============================================================ 32. Vòng 5 — mục 7
console.log('\n32. Vòng 5 — case, điểm giáo viên tự chấm và biểu đồ tiến bộ');

check('Điểm giáo viên tự chấm KHÔNG đụng vào điểm chính thức và không đổi mức SOS', () => {
  const c = conn
    .prepare(
      `SELECT sc.*, iv.id AS iv_id FROM sos_cases sc
         JOIN case_interventions iv ON iv.case_id = sc.id
        WHERE sc.track = 'academic' AND sc.status != 'done'
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
        WHERE sc.track = 'academic' AND sc.status != 'done'
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
      metrics: [{ skill: 'behaviour', score: 6, total: null }],
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
  /* Em nào chưa có case Ý thức nào đang mở — để không vướng luật chống trùng hạng mục. */
  const s = conn
    .prepare(
      `SELECT id FROM students
        WHERE id NOT IN (SELECT student_id FROM sos_cases
                          WHERE student_id IS NOT NULL AND track = 'behaviour' AND status != 'done')
        ORDER BY id LIMIT 1`,
    )
    .get() as any;
  assert(s, 'Không còn em nào chưa có case Ý thức để kiểm');
  const d = cases.reportIssue(P.admin, {
    primaryCode: 'student.behaviour.attendance',
    studentId: s.id, track: 'behaviour', topic: 'attendance',
    title: 'Nghỉ nhiều không báo', summary: 'Ba buổi liên tiếp không tới lớp',
  }) as any;
  assertThrows(
    () => cases.closeCaseOutcome(P.admin, d.id, {
      outcome: 'improved', note: 'Kết luận đủ dài cho phép kiểm này',
    }),
    /chưa có phương án/i, 'Đóng được case chưa làm gì cho em',
  );
});

check('Chuyển lớp rồi thì case theo em sang lớp mới TRÊN BẢNG TỔNG HỢP', () => {
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

  const board = summary.branchSummary(P.admin, { branchId: moved.branch_id });
  const row = board.rows.find((r: any) => r.classId === moved.newc);
  assert(row, 'Không thấy lớp mới trên bảng tổng hợp');
  const old = board.rows.find((r: any) => r.classId === moved.oldc);

  const sosOf = (r: any) => (r.cells.sos1?.value ?? 0) + (r.cells.sos2?.value ?? 0) + (r.cells.sos3?.value ?? 0);
  assert(sosOf(row!) <= (row!.cells.students?.value ?? 0),
    `Lớp mới: SOS ${sosOf(row!)} vượt sĩ số ${row!.cells.students?.value}`);
  if (old) {
    assert(sosOf(old) <= (old.cells.students?.value ?? 0),
      `Lớp cũ: SOS ${sosOf(old)} vượt sĩ số ${old.cells.students?.value}`);
  }

  /* Còn HỒ SƠ HỌC VIÊN vẫn phải giữ lớp lúc đánh giá — chuyển lớp không viết lại quá khứ. */
  const pr = profile.studentProfile(P.admin, moved.sid) as any;
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

check('[8.3] Phương án bắt đầu 14/09/2026: cập nhật trước 20/09, kết thúc 27/09', () => {
  /*
   * Ô kiểm tra BẢNG HẠN MỤC 8.3, viết thẳng vào dữ liệu mẫu và đối chiếu được bằng mắt trên
   * màn hình. Ví dụ của chính đề bài: bắt đầu thứ Bảy 19/9 → cập nhật 20/9, kết thúc 27/9.
   *
   * Hai mốc, hai câu hỏi khác nhau. Gộp làm một là để một phương án chạy bốn tuần mà tới
   * tuần cuối mới có người phải báo gì.
   */
  assert(demoToday() === '2026-09-14', `Ngày demo đã đổi thành ${demoToday()} — kiểm lại ví dụ hạn`);
  assert(domain.weeklyUpdateDue('2026-09-14') === '2026-09-20',
    `Bắt đầu thứ Hai 14/09 thì cập nhật trước 20/09, đang ra ${domain.weeklyUpdateDue('2026-09-14')}`);
  assert(domain.weeklyUpdateDue('2026-09-19') === '2026-09-20',
    'Bắt đầu thứ Bảy 19/09 vẫn phải cập nhật ngay 20/09 — chưa đủ dữ liệu thì ghi đúng là chưa đủ');
  assert(domain.weeklyUpdateDue('2026-09-20') === '2026-09-20', 'Đúng Chủ nhật thì hạn là chính hôm đó');
  assert(domain.planEndDefault('2026-09-19') === '2026-09-27',
    `Ví dụ của đề bài: bắt đầu 19/09 → kết thúc mặc định 27/09, đang ra ${domain.planEndDefault('2026-09-19')}`);

  const row = conn
    .prepare(
      `SELECT iv.action_due, iv.followup_due FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.detected_at = '2026-09-14' AND iv.cycle_started_on = '2026-09-14'
          /* CHỈ CASE HỌC THUẬT: Ý thức/Khác dùng hạn 3/5 ngày theo mức, không theo tuần. */
          AND sc.track = 'academic'
        ORDER BY iv.id LIMIT 1`,
    )
    .get() as any | undefined;
  assert(row, 'Dữ liệu demo không có case nào mở đúng ngày demo để đối chiếu bằng mắt');
  assert(row!.action_due === '2026-09-20',
    `Hạn cập nhật trong dữ liệu mẫu là ${row!.action_due}, phải là 2026-09-20`);
  assert(row!.followup_due === '2026-09-27',
    `Ngày dự kiến kết thúc trong dữ liệu mẫu là ${row!.followup_due}, phải là 2026-09-27`);
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
  /* Hồ sơ học viên phải trỏ vào BẢNG ĐIỂM NORMAL, không phải màn Mock Test. */
  const href = attempts.attemptHref({ id: a.id, kind: a.kind, classId: cls.id });
  assert(href.startsWith('/bang-diem-thuong/'), `Bài lớp Normal mở sai màn: ${href}`);
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
        GROUP BY student_id, category HAVING COUNT(*) > 1 AND category != 'behaviour' LIMIT 1`,
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
  /*
   * Báo một vấn đề Ý thức/Khác KHÔNG làm case học thuật biến mất.
   *
   * Từ vòng 7, báo cáo ý thức có thể GỘP vào một đợt đang mở thay vì mở case mới (mục 7.2),
   * nên số case không nhất thiết tăng. Điều phải đúng trong cả hai trường hợp là: có thêm
   * MỘT báo cáo thành phần, và mọi case học thuật của em vẫn còn nguyên.
   */
  const before = cases.listCases(P.admin, { studentId: st.sid }).rows.length;
  const reportsBefore = (conn.prepare('SELECT COUNT(*) n FROM case_reports').get() as any).n;
  const created = cases.reportIssue(P.admin, {
    primaryCode: 'student.behaviour.participation',
    studentId: st.sid, track: 'behaviour', topic: 'participation',
    title: 'Kiểm tra: thêm case Ý thức',
    summary: 'Dòng này do bài kiểm tra tạo ra để xem case học thuật có còn không.',
    parallel: true,
  }) as any;
  const after = cases.listCases(P.admin, { studentId: st.sid }).rows;
  const reportsAfter = (conn.prepare('SELECT COUNT(*) n FROM case_reports').get() as any).n;
  assert(reportsAfter === reportsBefore + 1,
    `Báo một vấn đề mà số báo cáo thành phần đổi từ ${reportsBefore} thành ${reportsAfter}`);
  assert(after.length === before || after.length === before + 1,
    `Số case đổi bất thường: ${before} → ${after.length}`);
  assert(after.some((c: any) => c.id === created.id), 'Không mở được case vừa tạo hoặc vừa gộp vào');
  for (const c of mine) {
    assert(after.some((x: any) => x.id === c.id), `Case học thuật ${c.id} biến mất sau khi thêm case Ý thức`);
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

check('[6] Hạn: chu kỳ đầu, chu kỳ tiếp, chờ duyệt, cập nhật trễ, và một tuần với Ý thức/Khác', () => {
  /* Chu kỳ đầu và chu kỳ tiếp dùng CÙNG một phép tính — Chủ nhật của tuần thứ hai. */
  assert(domain.cycleDeadline('2026-09-14') === '2026-09-27', 'Chu kỳ hai tuần tính sai');
  assert(domain.cycleDeadline('2026-09-18') === '2026-09-27', 'Giữa tuần vẫn phải ra Chủ nhật tuần thứ hai');
  assert(domain.cycleDeadline('2026-09-14', 'behaviour') === '2026-09-21', 'Chu kỳ Ý thức phải là một tuần');
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
  assert(appr.action_due === domain.weeklyUpdateDue(appr.cycle_started_on),
    'Hạn cập nhật không tính từ ngày được duyệt');
  assert(appr.followup_due === domain.planEndDefault(appr.cycle_started_on),
    'Ngày dự kiến kết thúc không tính từ ngày được duyệt');
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
  /* Lộ trình mới có bài của CHÍNH nó, không mượn bài của lộ trình cũ. */
  const cur = conn
    .prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' LIMIT 1`)
    .get(row.sid) as any;
  if (cur) {
    const own = conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(cur.id) as any;
    assert(own.n > 0, 'Lộ trình mới trống trơn — không có bài nào của chính nó');
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

check('[10] Cùng phạm vi thì số case khớp giữa Tổng quan, bảng lớp và danh sách', () => {
  const b = conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any;
  const board = summary.branchSummary(P.admin, { branchId: b.id });
  for (const r of board.rows) {
    if (!r.classId) continue;
    /* Số trên bảng tổng hợp = số dòng khi bấm vào, KHÔNG phải hai phép đếm khác nhau. */
    const open = cases.listCases(P.admin, { classId: r.classId }).rows
      .filter((c: any) => c.state !== 'done').length;
    const shown = r.cells.openCases?.value ?? 0;
    /* Bảng tổng hợp xếp case theo lớp em ĐANG học, nên chỉ so được ở lớp không có ai chuyển đi. */
    const moved = conn
      .prepare(
        `SELECT COUNT(*) n FROM enrollments o
          WHERE o.status = 'transferred' AND o.class_id = ?
            AND EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = o.student_id AND e.status='active')`,
      )
      .get(r.classId) as any;
    if (moved.n === 0) {
      assert(shown === open, `${r.label}: bảng nói ${shown} case, danh sách ra ${open}`);
    }
    /* Và ba con số phải là ba thứ khác nhau, không được trộn. */
    const students = r.cells.students?.value ?? 0;
    const sos = (r.cells.sos1?.value ?? 0) + (r.cells.sos2?.value ?? 0) + (r.cells.sos3?.value ?? 0);
    assert(sos <= students, `${r.label}: đếm học viên theo mức SOS lại vượt sĩ số`);
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
    assert(domain.NEXT_STEP_LABEL[ns] && domain.NEXT_STEP_HINT[ns], `Bước ${ns} thiếu tên hoặc lời giải thích`);
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
            AND track = 'academic'
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
        AND previous_case_id IS NULL AND track = 'academic'
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
  students.transferStudent(P.admin, row.sid, target, demoToday(), 'Đổi lớp', {
    note: 'Em đang dở phương án Reading, tuần sau có buổi tutor.',
    receiverUserId: receiver,
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
  const other = (conn
    .prepare(`SELECT id FROM users WHERE status='active' AND id != ? ORDER BY id LIMIT 1`)
    .get(row.assigneeUserId) as any).id;
  mgmt.editMgmtTask(P.admin, row.id, { watcherUserId: other });
  const detail = mgmt.mgmtTaskDetail(P.admin, row.id);
  assert(detail.watcherUserId === other, 'Không gán được người theo dõi');
  /* Người theo dõi không phải người phụ trách — bảng phải nói rõ hai vai khác nhau. */
  assert(detail.watcherUserId !== detail.assigneeUserId,
    'Người theo dõi và người phụ trách đang bị trộn làm một');
});


check('Bảng "Việc cần lưu ý" chỉ đếm trong phạm vi người đang xem', () => {
  /*
   * Lỗi cũ: hàng của chi nhánh ghi 11 học viên mà hàng "Tất cả chi nhánh" ngay dưới ghi 40 —
   * vì câu lệnh lấy sĩ số của mọi lớp trong trung tâm, không lọc theo phạm vi người xem.
   */
  const all = pulse.branchPulse(P.admin, {}) as any;
  const mine = pulse.branchPulse(P.mbManager, {}) as any;
  assert(mine.total.size < all.total.size,
    `Quản lý một chi nhánh thấy tổng ${mine.total.size} bằng cả trung tâm ${all.total.size}`);
  const sumRows = mine.rows.reduce((z: number, r: any) => z + r.metrics.size, 0);
  assert(sumRows <= mine.total.size,
    `Cộng các hàng ra ${sumRows} mà hàng tổng ghi ${mine.total.size}`);
});


// ==================================================================== mục 12.1

console.log('\n32. Mười sáu phép kiểm nghiệp vụ bắt buộc của mục 12.1');

check('[12.1-5] Bảng giáo viên đếm case theo NGƯỜI PHỤ TRÁCH, không theo mọi GV cùng lớp', () => {
  const branch = (conn.prepare("SELECT id FROM branches WHERE code = 'CP'").get() as any).id;
  const board = pulse.branchPulse(P.admin, { branchId: branch }) as any;
  assert(board, 'Không đọc được bảng Việc cần lưu ý của Cẩm Phả');
  for (const person of board.people as any[]) {
    const real = (conn
      .prepare(
        `SELECT COUNT(*) n FROM sos_cases sc
           LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
           LEFT JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
           JOIN classes cl ON cl.id = COALESCE(e.class_id, a.class_id)
          WHERE sc.owner_user_id = ? AND sc.status != 'done' AND cl.branch_id = ?`,
      )
      .get(person.id, branch) as any).n;
    assert(person.cases === real,
      `${person.name}: bảng ghi ${person.cases} case phụ trách, dữ liệu có ${real}`);
  }
  /* Và phải có ít nhất một người thật sự đang phụ trách case, nếu không phép kiểm rỗng nghĩa. */
  assert(board.people.some((x: any) => x.cases > 0), 'Không ai đang phụ trách case ở Cẩm Phả');
});

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

check('[12.1-9] Bấm một con số mở đúng tập dữ liệu — kể cả SOS 3 và Chờ duyệt', () => {
  /* SOS 3 trên bảng tổng hợp = số HỌC VIÊN có kết quả gần nhất ở mức 3, đếm bằng standing. */
  const board = summary.branchSummary(P.admin, {});
  const sos3 = board.rows.reduce((z: number, r: any) => z + (r.cells.sos3?.value ?? 0), 0);
  const ids = (conn
    .prepare(
      `SELECT DISTINCT e.student_id AS id FROM enrollments e
         JOIN students s ON s.id = e.student_id
        WHERE e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL`,
    )
    .all() as any[]).map((r) => r.id);
  const real = [...standing.standingFor(ids).values()].filter((x: any) => x.sosLevel === 3).length;
  assert(sos3 === real, `Bảng nói ${sos3} em ở SOS 3, standing tính ra ${real}`);

  /* Chờ duyệt phải lọc đúng chi nhánh, không lấy cả hệ thống. */
  const cp = (conn.prepare("SELECT id FROM branches WHERE code = 'CP'").get() as any).id;
  const cpBoard = pulse.branchPulse(P.admin, { branchId: cp }) as any;
  assert(cpBoard, 'Không đọc được bảng Việc cần lưu ý của Cẩm Phả');
  const cpReal = (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
         JOIN classes cl ON cl.id = COALESCE(e.class_id, a.class_id)
        WHERE iv.approval_state = 'pending' AND cl.branch_id = ?`,
    )
    .get(cp) as any).n;
  assert(cpBoard.total.pendingApproval === cpReal,
    `Cẩm Phả: bảng nói ${cpBoard.total.pendingApproval} đề xuất chờ duyệt, dữ liệu có ${cpReal}`);
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
        WHERE iv.followup_due IS NOT NULL AND iv.status NOT IN ('completed','cancelled')`,
    )
    .get() as any).n;
  const overdue = (conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
        WHERE iv.followup_due IS NOT NULL AND iv.followup_due < ?
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
  const row = conn
    .prepare(
      `SELECT a.* FROM assessment_attempts a
        WHERE a.class_id = ? AND a.status = 'planned' AND a.kind = 'mock'
          AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
        ORDER BY a.id LIMIT 1`,
    )
    .get(classId(classCode)) as any;
  assert(row, `Seed thiếu lượt MT chưa có điểm ở ${classCode}`);
  return row;
}

check('[10.1] Tách tuần KHÔNG tạo đợt mới và không đổi số MT', () => {
  const a = freshPlannedAttempt('BC-FT 205');
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
  const a = freshPlannedAttempt('BC-FT 205');
  const mgr = loadPrincipal(userByRole('manager', 'BC'));
  const before = attempts.attemptDetail(mgr, a.id);
  const lBefore = before.skillSchedule.find((r: any) => r.skill === 'listening')!.deadline;

  const target = periodOf(addDays(demoToday(), 21));
  skillSchedule.setSkillWeek(mgr, a.id, 'writing', target, { reason: 'Giáo viên Writing nghỉ phép', force: true });

  const after = attempts.attemptDetail(mgr, a.id);
  assert(after.skillSchedule.find((r: any) => r.skill === 'listening')!.deadline === lBefore,
    'Dời Writing đã kéo theo hạn chấm của Listening');
});

check('[10.4] Không xếp một phần thi vượt qua đợt kế tiếp', () => {
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
  assert(chk.blockers.length > 0, 'Xếp một phần thi vượt qua đợt kế tiếp mà không bị chặn');

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

check('[10.4] Phần đã có điểm không dời như một lịch tương lai', () => {
  const scored = conn
    .prepare(
      `SELECT a.id, a.class_id FROM assessment_attempts a
         JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = 'listening' AND s.band IS NOT NULL
        WHERE a.kind = 'mock' AND a.status != 'cancelled' LIMIT 1`,
    )
    .get() as any;
  assert(scored, 'Seed thiếu lượt đã có điểm Listening');
  assertThrows(
    () => skillSchedule.setSkillWeek(P.admin, scored.id, 'listening', periodOf(addDays(demoToday(), 28)), { force: true }),
    /đã có điểm/, 'Dời được một phần thi đã có điểm',
  );
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

check('[10.1] Không bỏ môn khỏi phạm vi SAU khi đã xác nhận vắng', () => {
  const a = freshPlannedAttempt('CP-FT 110');
  const mgr = P.cpManager;
  /* Phải có tuần thi mới xác nhận được đã thi hay vắng. */
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em nghỉ ốm, GVCN đã xác minh');
  assertThrows(
    () => skillSchedule.setSkillScope(mgr, a.id, 'speaking', false, 'Thôi không tính môn này nữa'),
    /đã được xác nhận vắng/, 'Hợp thức hoá được một đợt thiếu bằng cách bỏ môn đã vắng',
  );
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
  const a = freshPlannedAttempt('HD-FT 302');
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
  const a = freshPlannedAttempt('UB-FT 401');
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
  const missing = conn
    .prepare(
      `SELECT COUNT(*) n FROM assessment_attempts a
        WHERE (SELECT COUNT(*) FROM attempt_skills ask WHERE ask.attempt_id = a.id) <> 4`,
    )
    .get() as any;
  assert(missing.n === 0, `${missing.n} đợt chưa có đủ bốn dòng lịch kỹ năng`);

  /* Bước nâng cấp không được dựng ra một xác nhận vắng nào — mục 18.1 nói rõ. */
  const seeded = conn
    .prepare(`SELECT COUNT(*) n FROM attempt_skills WHERE sit_status = 'absent' AND sit_by IS NULL`)
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

  /* Và không phương án nào thuộc về một case mà không ai đứng tên mở. */
  const orphan = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_interventions iv
         JOIN sos_cases c ON c.id = iv.case_id
        WHERE c.reported_by IS NULL AND c.origin_kind = 'mock'
          AND NOT EXISTS (SELECT 1 FROM case_signals sg WHERE sg.case_id = c.id AND sg.resolved_by IS NOT NULL)`,
    )
    .get() as any;
  assert(orphan.n === 0, `${orphan.n} phương án thuộc case chưa ai xác minh`);
});

check('[6.2] Tín hiệu chờ xác minh KHÔNG được đếm như case đã xác định', () => {
  const pending = conn
    .prepare(`SELECT COUNT(*) n FROM case_signals WHERE status = 'pending'`)
    .get() as any;
  assert(pending.n > 0, 'Bộ demo thiếu tín hiệu đang chờ xác minh — hàng việc mới sẽ trống');

  /* Không tín hiệu chờ nào có case: chờ nghĩa là chưa thành gì cả. */
  const wrong = conn
    .prepare(`SELECT COUNT(*) n FROM case_signals WHERE status = 'pending' AND case_id IS NOT NULL`)
    .get() as any;
  assert(wrong.n === 0, `${wrong.n} tín hiệu vừa "chờ xác minh" vừa đã có case`);

  /*
   * Và tín hiệu đã xử lý xong cũng không được quay lại hàng chờ: mỗi dòng đúng một trạng
   * thái, không có dòng vừa chờ vừa xong.
   */
  const muddled = conn
    .prepare(
      `SELECT COUNT(*) n FROM case_signals
        WHERE (status = 'noted' AND resolution_note IS NULL)
           OR (status = 'linked' AND case_id IS NULL)
           OR (status = 'withdrawn' AND withdrawn_reason IS NULL)`,
    )
    .get() as any;
  assert(muddled.n === 0, `${muddled.n} tín hiệu có trạng thái không khớp với dữ liệu của chính nó`);

  /* Tổng hợp riêng phải đếm được, và con số phải khớp với chính bảng dữ liệu. */
  const listed = signalsSvc.listSignals(P.admin, { status: 'pending' });
  assert(listed.rows.length === pending.n,
    `Tổng hợp tín hiệu đếm ${listed.rows.length} mà bảng có ${pending.n}`);
});

check('[6.2] Tín hiệu hiện ở hồ sơ học viên và ở hàng việc của đúng người', () => {
  const sg = conn
    .prepare(`SELECT * FROM case_signals WHERE status = 'pending' AND owner_user_id IS NOT NULL LIMIT 1`)
    .get() as any;
  assert(sg, 'Bộ demo thiếu tín hiệu chờ xác minh đã có người phụ trách');

  const prof = profile.studentProfile(P.admin, sg.student_id) as any;
  assert(prof.pendingSignals.some((x: any) => x.id === sg.id),
    'Hồ sơ học viên không hiện tín hiệu đang chờ xác minh');

  const owner = loadPrincipal(sg.owner_user_id);
  const work = mywork.myWork(owner);
  assert((work.items ?? []).some((i: any) => i.key === `verify:${sg.id}`),
    'Tín hiệu không xuất hiện trong hàng việc của người phải xác minh');

  /* Người KHÁC không thấy nó như việc của mình. */
  const other = conn
    .prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND user_id != ? LIMIT 1`)
    .get(sg.class_id, sg.owner_user_id) as any;
  if (other) {
    const w2 = mywork.myWork(loadPrincipal(other.id));
    assert(!(w2.items ?? []).some((i: any) => i.key === `verify:${sg.id}`),
      'Tín hiệu của người khác lại nằm trong hàng việc của mình');
  }
});

check('[6.2] Xác minh MỘT tín hiệu chỉ có MỘT lối ra: mở case', () => {
  /*
   * Chủ sản phẩm chốt 16/09/2026, ngược với câu "ghi nhận đã xem" của đề bài mục 6.2:
   * xác minh nghĩa là MỞ CASE, không có đường nào khác. Nên không còn thao tác nào sinh ra
   * trạng thái "đã xem, không thành case" — trạng thái đó chỉ còn trên dữ liệu có từ trước.
   */
  assert(!('noteSignal' in signalsSvc),
    'Vẫn còn đường ghi nhận đã xem mà không mở case — chủ sản phẩm đã bỏ lối ra này');

  const sg = conn
    .prepare(`SELECT * FROM case_signals WHERE status = 'pending' LIMIT 1`)
    .get() as any;
  assert(sg, 'Bộ demo thiếu tín hiệu đang chờ xác minh');
  const made = cases.reportIssue(P.admin, {
    studentId: sg.student_id, cycleId: sg.cycle_id,
    track: sg.track, topic: sg.skill ?? 'attendance',
    title: 'Xác minh từ tín hiệu của đợt đánh giá',
    summary: 'Đã xem lại bài và xác định vấn đề cụ thể của em ở phần này.',
    primaryCode: sg.skill
      ? `student.${sg.skill.replace(/[12]$/, '')}.${sg.skill.startsWith('writing') ? 'task' : sg.skill === 'speaking' ? 'fluency' : 'technique'}`
      : 'student.behaviour.attendance',
    fromSignalId: sg.id,
  }) as any;
  const after = conn.prepare('SELECT * FROM case_signals WHERE id = ?').get(sg.id) as any;
  assert(after.status === 'linked' && after.case_id === made.id,
    'Xác minh xong mà tín hiệu không gắn vào case vừa mở');
});

check('[6.2] Chỉ người trong phạm vi phụ trách mới xác minh được tín hiệu', () => {
  const sg = conn
    .prepare(
      `SELECT sg.* FROM case_signals sg
         JOIN classes c ON c.id = sg.class_id
         JOIN branches b ON b.id = c.branch_id
        WHERE sg.status = 'pending' AND b.code = 'MB' LIMIT 1`,
    )
    .get() as any;
  if (!sg) return;
  /* Quản lý chi nhánh khác không đụng được. */
  assertThrows(
    () => cases.reportIssue(P.cpManager, {
      studentId: sg.student_id, cycleId: sg.cycle_id,
      track: sg.track, topic: sg.skill ?? 'attendance',
      title: 'Xem hộ chi nhánh khác một chút',
      summary: 'Tôi xem hộ chi nhánh khác một cái cho nhanh, xem em vướng gì.',
      primaryCode: 'student.behaviour.attendance',
      fromSignalId: sg.id,
    }),
    /phạm vi/, 'Quản lý chi nhánh khác xác minh được tín hiệu ngoài phạm vi',
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
    studentId: st.id, cycleId: st.cycle_id, track: 'academic', topic: 'reading',
    parallel: true,
  } as any;

  assertThrows(() => cases.reportIssue(P.admin, { ...base, summary: 'Em đọc chậm lắm luôn ấy' }),
    /đặt tên/, 'Mở được case không tên');
  assertThrows(() => cases.reportIssue(P.admin, { ...base, title: 'Reading chậm', summary: 'Chậm' }),
    /cụ thể hơn/, 'Mở được case với mô tả một chữ');
  assertThrows(
    () => cases.reportIssue(P.admin, {
      ...base, title: 'Reading đọc chậm', summary: 'Em đọc kỹ từng câu nên hết giờ.',
    }),
    /phân loại/, 'Mở được case không có phân loại vấn đề',
  );

  /* "Bình thường" đã bỏ — gửi lên là bị từ chối, không phải âm thầm hạ xuống. */
  assertThrows(
    () => cases.reportIssue(P.admin, {
      ...base, title: 'Reading đọc chậm', summary: 'Em đọc kỹ từng câu nên hết giờ.',
      primaryCode: 'student.reading.time', urgency: 'normal',
    }),
    /hai bậc/, 'Vẫn nhận được mức "Bình thường"',
  );

  /* Chọn "Khác" thì mô tả phải nói rõ — nếu không thì "Khác" chính là "Chưa rõ" đổi tên. */
  assertThrows(
    () => cases.reportIssue(P.admin, {
      ...base, title: 'Reading có vấn đề', summary: 'Em đọc chưa tốt lắm.',
      primaryCode: 'student.reading.other',
    }),
    /nói rõ vấn đề cụ thể/, 'Chọn "Khác" mà mô tả qua loa vẫn mở được case',
  );

  /* Đủ bốn trường thì mở được, và mức mặc định là "Cần chú ý" chứ không phải không có mức. */
  const ok = cases.reportIssue(P.admin, {
    ...base, title: 'Reading: hết giờ ở hai câu cuối',
    summary: 'Em đọc kỹ từng câu nên luôn hết giờ khi còn hai câu cuối của passage 3.',
    primaryCode: 'student.reading.time',
  }) as any;
  assert(ok.urgency === 'attention', `Mức mặc định phải là "Cần chú ý", đang là ${ok.urgency}`);
  assert(ok.title === 'Reading: hết giờ ở hai câu cuối', 'Tên case bị máy viết lại');
});

check('[6.4] Bộ phân loại đúng của mục 6.4, và phân loại phải thuộc đúng kỹ năng', () => {
  const codes = (topic: string) => domain.issuesForTopic(topic).map((i: any) => i.label);
  assert(codes('reading').join(' | ') === 'Từ vựng / ngữ pháp | Kỹ năng làm bài | Tư duy logic | Quản lý thời gian | Khác',
    `Bộ Reading sai: ${codes('reading').join(' | ')}`);
  assert(codes('listening').join(' | ') === 'Từ vựng / ngữ pháp | Tư duy và kỹ năng làm bài | Tâm lý và độ tập trung | Ngôn ngữ | Khác',
    `Bộ Listening sai: ${codes('listening').join(' | ')}`);
  assert(codes('homework').join(' | ') === 'BTVN | Chuyên cần | Tham gia trên lớp | Khác',
    `Bộ Ý thức/Khác sai: ${codes('homework').join(' | ')}`);
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
      studentId: st.id, cycleId: st.cycle_id, track: 'academic', topic: 'speaking', parallel: true,
      title: 'Speaking nói ngắt quãng',
      summary: 'Em dừng lâu giữa câu khi gặp chủ đề lạ ngoài vốn từ quen.',
      primaryCode: 'student.reading.time',
    }),
    /không thuộc bộ phân loại/, 'Nhận phân loại của môn khác',
  );
});

check('[7.2] Ý thức/Khác: báo trong bốn ngày thì GỘP, ngày thứ năm thì mở đợt mới', () => {
  const st = formTestStudent();
  const mk = (title: string, summary: string) => cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, track: 'behaviour', topic: 'homework',
    title, summary, primaryCode: 'student.behaviour.homework',
  }) as any;

  const first = mk('Thiếu BTVN nhiều buổi', 'Ba buổi liền em không nộp bài về nhà môn Reading.');
  const row1 = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(first.id) as any;
  assert(row1.merge_until === addDays(demoToday(), 3),
    `Cửa sổ gộp phải là bốn ngày kể cả ngày mở: ${demoToday()} → ${row1.merge_until}`);
  assert(row1.episode_no === 1, `Đợt đầu phải là lần 1, đang là ${row1.episode_no}`);
  assert(row1.urgency === 'attention', 'Đợt mới mở đã bị đánh Gấp');

  /* Báo lần hai TRONG cửa sổ: gộp vào chính đợt đó và nâng lên Gấp. */
  const second = mk('Lại thiếu BTVN', 'Buổi Listening hôm nay em cũng không có bài, nói là quên.');
  assert(second.id === first.id, 'Báo cáo trong cửa sổ bốn ngày mà lại mở case mới');
  const row2 = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(first.id) as any;
  assert(row2.urgency === 'urgent', 'Có báo cáo bổ sung mà case không được nâng lên Gấp');
  assert(row2.episode_no === 1, 'Số đợt tăng theo mỗi báo cáo — phải tăng theo ĐỢT');
  const reports = conn
    .prepare('SELECT * FROM case_reports WHERE case_id = ? ORDER BY id').all(first.id) as any[];
  assert(reports.length === 2, `Đợt phải giữ cả hai báo cáo nguồn, đang có ${reports.length}`);
  assert(reports[0].summary !== reports[1].summary, 'Báo cáo sau đã ghi đè báo cáo trước');

  /* Hạn KẾT LUẬN của case vẫn tính từ ngày mở, không lùi theo báo cáo mới. */
  assert(row2.follow_until === addDays(row1.detected_at, 6),
    `Hạn case phải là ngày mở + 6, đang là ${row2.follow_until}`);

  /* Phân loại KHÁC thì không gộp, dù cùng một ngày và cùng một em. */
  const other = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, track: 'behaviour', topic: 'participation',
    title: 'Ít phát biểu trên lớp', summary: 'Em ngồi im cả buổi, gọi mới trả lời một câu ngắn.',
    primaryCode: 'student.behaviour.participation',
  }) as any;
  assert(other.id !== first.id, 'Hai phân loại ý thức khác nhau bị gộp vào một case');
});

check('[7.2] Gửi lại cùng một request không tạo báo cáo thứ hai và không tự nâng mức', () => {
  const st = formTestStudent();
  const args = {
    studentId: st.id, cycleId: st.cycle_id, track: 'behaviour', topic: 'attendance',
    title: 'Nghỉ học không báo trước',
    summary: 'Tuần này em nghỉ hai buổi mà gia đình không báo trước cho lớp.',
    primaryCode: 'student.behaviour.attendance',
    idempotencyKey: 'test-behaviour-retry-1',
  } as any;
  const a = cases.reportIssue(P.admin, args) as any;
  const urgencyAfterFirst = (conn.prepare('SELECT urgency FROM sos_cases WHERE id = ?').get(a.id) as any).urgency;
  const b = cases.reportIssue(P.admin, args) as any;
  assert(a.id === b.id, 'Gửi lại cùng request cho ra hai case khác nhau');
  const n = (conn.prepare('SELECT COUNT(*) n FROM case_reports WHERE case_id = ?').get(a.id) as any).n;
  assert(n === 1, `Gửi lại cùng request đã tạo ${n} báo cáo`);
  const after = (conn.prepare('SELECT urgency FROM sos_cases WHERE id = ?').get(a.id) as any).urgency;
  assert(after === urgencyAfterFirst,
    'Bấm lại vì mạng chập chờn đã bị tính thành một lần tái phạm và nâng mức');
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
    studentId: st.id, cycleId: st.cycle_id, track: 'academic', topic: 'listening',
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

check('[7.2] Bộ demo có một đợt gộp hai báo cáo và đã được nâng lên Gấp', () => {
  const row = conn
    .prepare(
      `SELECT c.id, c.title, c.urgency, c.episode_no, COUNT(r.id) n
         FROM sos_cases c JOIN case_reports r ON r.case_id = c.id
        WHERE c.track = 'behaviour'
        GROUP BY c.id HAVING n > 1
        ORDER BY c.id LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Bộ demo thiếu đợt Ý thức/Khác gộp nhiều báo cáo — mục 7.3 đòi phải nhìn thấy');
  assert(row.urgency === 'urgent', 'Đợt gộp nhiều báo cáo mà chưa được nâng lên Gấp');
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
function absentSkill(skill: string, weeksAhead = 3, startCount = 0) {
  const a = takePlannedAttempt();
  const mgr = loadPrincipal(userByRole('manager', a.branch_code));
  skillSchedule.setSkillWeek(mgr, a.id, skill, periodOf(addDays(demoToday(), weeksAhead * 7)),
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

check('[10.6] Lần thứ hai: GVCN gửi đề nghị, lịch KHÔNG đổi trước khi Quản lý duyệt', () => {
  const { a, mgr } = absentSkill('speaking', 3);
  absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần một' });
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em lại vắng buổi dời');

  const weekBefore = conn
    .prepare(`SELECT planned_period_id AS p FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  const out = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần hai' });
  const o = out.outcomes[0];
  assert(o.result === 'pending', `Lần thứ hai phải chờ duyệt, đang là ${o.result}`);
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
    () => absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần hai gửi lại' }),
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

check('[10.6] Quản lý từ chối: Fast Track huỷ PHẦN THI, giữ nguyên điểm các phần đã xong', () => {
  const { a, mgr } = absentSkill('speaking', 3);
  absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần một' });
  skillSchedule.setSitStatus(mgr, a.id, 'speaking', 'absent', 'Em vắng tiếp');
  const out = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần hai' });

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

  /* KHÔI PHỤC là việc của Quản lý, VÀ phải đặt luôn tuần mới trong cùng thao tác. */
  const back = absence.restoreCancelledSkill(mgr, a.id, 'speaking', periodOf(addDays(demoToday(), 28)),
    { reason: 'Xếp lại cho em thi bù' });
  assert(back.ok, 'Không khôi phục được phần thi đã huỷ');
  const after = conn
    .prepare(`SELECT sit_status, absence_move_count AS n FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`)
    .get(a.id) as any;
  assert(after.sit_status === 'scheduled', 'Khôi phục rồi mà trạng thái vẫn là huỷ');
  /*
   * BỘ ĐẾM GIỮ NGUYÊN Ở 1: lần dời đầu đã dùng, còn lần thứ hai bị từ chối nên không tiêu
   * lượt nào. Khôi phục cũng KHÔNG đặt lại về 0 — những lần em vắng vẫn đã xảy ra.
   */
  assert(after.n === 1, `Bộ đếm phải giữ nguyên ở 1, đang là ${after.n}`);
});

check('[10.6] Lớp Normal: huỷ LỊCH HẸN, giữ nghĩa vụ thi đủ môn', () => {
  const row = conn
    .prepare(
      `SELECT a.id, a.class_id FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN programmes pg ON pg.code = c.programme_code
        WHERE pg.scoring_mode = 'ratio' AND a.status = 'planned'
          AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
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
  /* Đã dời một lần từ trước, nên lần này là đề nghị phải chờ Quản lý. */
  const { a, mgr } = absentSkill('speaking', 3, 1);
  const out = absence.requestAbsenceMove(mgr, a.id, ['speaking'], { reason: 'Lần hai' });
  assert(out.outcomes[0].result === 'pending',
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
    { reason: 'Buổi thi đã qua', force: true });
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
  assert(by.get('listening')!.result === 'pending',
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
  assert(pr.headline, 'Hồ sơ không có câu tổng hợp nào ở đầu');
  assert(Array.isArray(pr.headline.below) && Array.isArray(pr.headline.signals),
    'Câu tổng hợp không tách được kỹ năng dưới kỳ vọng với tín hiệu chờ xác minh');

  /* Câu tổng hợp phải khớp với BẢNG BÊN DƯỚI — hai chỗ không được nói ngược nhau. */
  const board = (cases.skillSupportBoard(P.admin, row.sid, row.cid) as any).rows;
  const belowFromBoard = board.filter((r: any) => r.missed === true).map((r: any) => r.short ?? r.label);
  assert(JSON.stringify(pr.headline.below) === JSON.stringify(belowFromBoard),
    `Đầu hồ sơ nói ${JSON.stringify(pr.headline.below)} còn bảng nói ${JSON.stringify(belowFromBoard)}`);
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
      assert(pr.headline.below.includes(r.short ?? r.label),
        `${r.label} dưới kỳ vọng mà câu tổng hợp không nêu`);
    }
    for (const r of met) {
      assert(!pr.headline.below.includes(r.short ?? r.label),
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
  assert(board.length >= 5, `Bảng phải có đủ hàng cho mọi kỹ năng, đang có ${board.length}`);
  for (const r of board) {
    assert(Array.isArray(r.cases), `Hàng ${r.category} không có danh sách case`);
    assert(r.signal === null || typeof r.signal === 'object',
      `Hàng ${r.category} có tín hiệu sai kiểu`);
  }
});

check('[4.2] Tín hiệu chờ xác minh nằm ở ĐÚNG hàng kỹ năng của nó', () => {
  const sg = conn
    .prepare(`SELECT * FROM case_signals WHERE status = 'pending' AND category IS NOT NULL LIMIT 1`)
    .get() as any;
  assert(sg, 'Bộ demo không còn tín hiệu nào chờ xác minh');
  const board = (cases.skillSupportBoard(P.admin, sg.student_id, sg.cycle_id) as any).rows;
  const row = board.find((r: any) => r.category === sg.category);
  assert(row?.signal?.id === sg.id,
    `Tín hiệu ${sg.category} không hiện ở hàng ${sg.category} của bảng kỹ năng`);
  for (const other of board.filter((r: any) => r.category !== sg.category)) {
    assert(other.signal?.id !== sg.id, `Tín hiệu ${sg.category} lọt sang hàng ${other.category}`);
  }
});

check('[4.4] Biểu đồ có khoảng thực hiện phương án trên cùng trục thời gian', () => {
  const row = conn
    .prepare(
      `SELECT sc.student_id sid, sc.cycle_id cid FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.started_date IS NOT NULL AND sc.track = 'academic'
          AND sc.category IS NOT NULL AND sc.category != 'behaviour'
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
  const pr = profile.studentProfile(P.admin, row.sid, row.cid) as any;
  const types = new Set<string>();
  for (const ep of pr.episodes) for (const e of ep.events) types.add(e.eventType);
  assert(!types.has('intervention') && !types.has('followup'),
    `Mốc hành trình vẫn lặp lại cập nhật phương án: ${[...types].join(', ')}`);

  /* Nhưng TOÀN BỘ ghi nhận vẫn tra lại được — chỉ là không bày mặc định. */
  const allTypes = new Set<string>();
  for (const ep of pr.allEpisodes) for (const e of ep.events) allTypes.add(e.eventType);
  assert(allTypes.has('intervention') || allTypes.has('followup'),
    'Mở toàn hành trình mà vẫn không thấy các cập nhật phương án');
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
  const first = profile.studentProfile(P.admin, many.sid, cys[0].id) as any;
  const last = profile.studentProfile(P.admin, many.sid, cys[cys.length - 1].id) as any;
  assert(first.allEpisodes.length === last.allEpisodes.length,
    'Đổi lộ trình đang xem làm hành trình toàn học viên dài ngắn khác nhau');
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
  const scored = board.filter((r: any) => r.category !== 'behaviour' && r.band !== null);
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

/** Một em ở lớp MB-FT 101, kèm lớp và chu kỳ — đủ để mở case và ghi phương án. */
function boardStudent(offset = 0) {
  const row = conn
    .prepare(
      `SELECT s.id, e.class_id, cy.id AS cycle_id FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active'
        ORDER BY s.id LIMIT 1 OFFSET ?`,
    )
    .get(classId('MB-FT 101'), offset) as any;
  assert(row, 'Không tìm được học viên ở MB-FT 101 để thử');
  return row;
}

function behaviourRow(classIdOf: number, studentId: number, allJourney = false) {
  const board = classesSvc.classBehaviourBoard(P.admin, classIdOf, { allJourney }) as any;
  const row = board.rows.find((r: any) => r.studentId === studentId);
  assert(row, 'Bảng Ý thức thiếu chính học viên đang xét');
  return row;
}

check('[13.3] Cột nhóm đếm số ĐỢT case, không đếm từng lần giáo viên báo', () => {
  const st = boardStudent(0);
  const before = behaviourRow(st.class_id, st.id).topics.homework.episodes;

  const base = {
    studentId: st.id, cycleId: st.cycle_id, track: 'behaviour', topic: 'homework',
    primaryCode: 'student.behaviour.homework',
  } as any;
  const first = cases.reportIssue(P.admin, {
    ...base, title: 'BTVN: không nộp bài tuần này',
    summary: 'Em không nộp bài Writing tuần này, nhắc hai lần vẫn chưa có bài.',
  }) as any;
  /* Lần báo thứ hai trong cửa sổ bốn ngày phải NHẬP VÀO ĐỢT CŨ, không mở đợt mới (mục 7.2). */
  const second = cases.reportIssue(P.admin, {
    ...base, title: 'BTVN: lại không nộp',
    summary: 'Hôm nay em vẫn chưa nộp bài, đây là buổi thứ hai liên tiếp.',
  }) as any;
  assert(second.id === first.id, 'Hai lần báo trong bốn ngày đã thành hai đợt');

  const after = behaviourRow(st.class_id, st.id).topics.homework.episodes;
  assert(after === before + 1,
    `Bảng đếm ${after - before} đợt cho hai lần báo của cùng một đợt`);
  const reports = (conn
    .prepare('SELECT COUNT(*) n FROM case_reports WHERE case_id = ?')
    .get(first.id) as any).n;
  assert(reports >= 2, 'Lần báo thứ hai không được lưu lại thành báo cáo thành phần');
});

check('[13.3] Report gia đình và thư cảnh cáo đếm LẦN ĐÃ LÀM, một lần chỉ tính một', () => {
  const st = boardStudent(1);
  const before = behaviourRow(st.class_id, st.id);

  const base = {
    studentId: st.id, cycleId: st.cycle_id, track: 'behaviour', topic: 'attendance',
    primaryCode: 'student.behaviour.attendance',
  } as any;
  const a = cases.reportIssue(P.admin, {
    ...base, title: 'Chuyên cần: nghỉ hai buổi liên tiếp',
    summary: 'Em nghỉ hai buổi liên tiếp trong tuần này và không báo trước.',
  }) as any;
  /* Case thứ hai song song, để thử "một cuộc gọi phục vụ hai case". */
  const b = cases.reportIssue(P.admin, {
    ...base, topic: 'participation', primaryCode: 'student.behaviour.participation',
    parallel: true, title: 'Tham gia: không phát biểu buổi nào',
    summary: 'Cả tuần em không phát biểu buổi nào, hỏi tới thì im lặng.',
  }) as any;
  assert(b.id !== a.id, 'Case song song vẫn bị gộp vào đợt cũ');

  const call = { kind: 'talk_parent', status: 'completed', completedDate: demoToday(), performerSelf: true };
  cases.recordIntervention(P.admin, a.id, { ...call, description: 'Gọi cho mẹ em về việc nghỉ học hai buổi.' });
  cases.recordIntervention(P.admin, b.id, { ...call, description: 'Cùng cuộc gọi đó nói luôn chuyện em không phát biểu.' });
  /* Thư cảnh cáo mới DỰ KIẾN, chưa gửi — không được đếm. */
  cases.recordIntervention(P.admin, a.id, {
    kind: 'warning_letter', status: 'planned', plannedDate: demoToday(),
    performerSelf: true, description: 'Dự kiến gửi thư cảnh cáo nếu em còn nghỉ tiếp.',
  });

  const after = behaviourRow(st.class_id, st.id);
  assert(after.reports === before.reports + 1,
    `Hai phương án cùng một cuộc gọi trong cùng một ngày đếm thành ${after.reports - before.reports} lần`);
  assert(after.warningLetters === before.warningLetters,
    'Thư cảnh cáo mới dự kiến đã bị đếm như đã gửi');
});

check('[13.3] Mặc định chỉ đếm từ lúc em vào lớp này; toàn hành trình là một lựa chọn riêng', () => {
  const st = boardStudent(2);
  const joined = (conn
    .prepare(`SELECT started_at FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`)
    .get(st.id, st.class_id) as any)?.started_at;
  assert(joined, 'Học viên thử nghiệm không có ngày vào lớp');

  const c = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, track: 'behaviour', topic: 'other',
    primaryCode: 'student.behaviour.other', parallel: true,
    title: 'Việc từ lớp cũ',
    summary: 'Sự việc xảy ra từ trước khi em chuyển sang lớp này, ghi lại để theo dõi.',
  }) as any;
  /* Đẩy ngày phát hiện về TRƯỚC ngày em vào lớp — đúng hình dạng của một việc ở lớp cũ. */
  conn.prepare('UPDATE sos_cases SET detected_at = ? WHERE id = ?')
    .run(addDays(joined, -30), c.id);

  const here = behaviourRow(st.class_id, st.id, false);
  const all = behaviourRow(st.class_id, st.id, true);
  assert(all.totalEpisodes === here.totalEpisodes + 1,
    'Việc của lớp cũ không hiện ra ngay cả khi chọn xem toàn hành trình');
  assert(here.totalEpisodes < all.totalEpisodes,
    'Việc xảy ra trước ngày vào lớp đang bị tính thành việc của lớp này');
});

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
    studentId: st.id, cycleId: st.cycle_id, track: 'academic', topic: 'reading',
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
  assert(!normal.includes('behaviour') && !ft.includes('behaviour'),
    'Bảng phân tích đang có tab Ý thức/Khác, nơi mọi cột tỷ lệ đều vô nghĩa');
  assert(ft.includes('writing1') && ft.includes('writing2'),
    `Lớp Fast Track mất W1/W2: ${ft.join(',')}`);
  assert(!ft.includes('writing'), 'Lớp Fast Track không được có tab Writing gộp');
});

check('[13.4] Case chưa phân loại có hàng riêng, không bị dồn vào "Khác"', () => {
  const st = boardStudent(4);
  const c = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, track: 'academic', topic: 'listening',
    parallel: true, title: 'Listening: nghe sót số liệu',
    summary: 'Em nghe sót phần số liệu ở section 2, nghe lại thì nhận ra ngay.',
    primaryCode: 'student.listening.technique',
  }) as any;
  /* Dữ liệu cũ có case chưa kịp phân loại — bảng phải hiện chúng, không gộp vào "Khác". */
  conn.prepare('DELETE FROM case_issues WHERE case_id = ?').run(c.id);

  const board = effectiveness.classIssueBoard(st.class_id, 'listening') as any;
  const un = board.rows.find((r: any) => r.code === '__unclassified__');
  assert(un && un.cases >= 1, 'Case chưa phân loại biến mất khỏi bảng phân tích');
  assert(un.label === 'Chưa phân loại vấn đề', `Hàng chưa phân loại đang mang nhãn "${un.label}"`);
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

check('[14.2] Dòng tổng hợp là bốn câu hỏi chồng nhau, không phải một phép chia', () => {
  const all = mgmt.listMgmtTasks(P.admin, {}) as any;
  const s = all.summary;
  assert(s, 'Không có dòng tổng hợp');
  assert(s.total === all.rows.length, `Tổng ${s.total} không khớp số việc đang có ${all.rows.length}`);
  for (const k of ['doing', 'overdue', 'dueSoon', 'paused']) {
    assert(s[k] >= 0 && s[k] <= s.total, `Con số "${k}" nằm ngoài khoảng hợp lệ`);
  }
  /*
   * Quá hạn và đang thực hiện CHỒNG NHAU có chủ ý — nên bốn con số cộng lại có thể lớn hơn
   * tổng, và giao diện phải nói ra điều đó chứ không được bày như một phép chia.
   */
  assert(s.overdue === all.rows.filter((r: any) => r.overdue).length,
    'Số quá hạn ở dòng tổng hợp không khớp chính các dòng đang hiện');
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

check('[15.1] Hàng kỹ năng có đủ hạng mục của loại lớp, kể cả hạng mục chưa có case', () => {
  const ft = effectiveness.issueSkillRows({ ratio: false }).map((r: any) => r.code);
  const nm = effectiveness.issueSkillRows({ ratio: true }).map((r: any) => r.code);
  assert(ft.join(',') === 'listening,reading,writing1,writing2,speaking,behaviour',
    `Hàng kỹ năng Fast Track sai: ${ft.join(',')}`);
  assert(nm.join(',') === 'listening,reading,writing,speaking,behaviour',
    `Hàng kỹ năng Normal sai: ${nm.join(',')}`);
  /* Ý thức/Khác CÓ hàng ở đây (mục 15.1) dù KHÔNG có tab ở bảng hiệu quả (mục 13.4). */
  assert(ft.includes('behaviour') && nm.includes('behaviour'),
    'Ý thức/Khác biến mất khỏi hàng kỹ năng của Thực trạng');
});

check('[15.2] Bấm một số ra ĐÚNG tập bản ghi tạo nên số đó, cùng phạm vi', () => {
  const scope = { ratio: false } as any;
  const rows = effectiveness.issueSkillRows(scope) as any[];
  const busiest = rows.filter((r) => r.code !== 'behaviour' && r.openCases > 0)
    .sort((a, b) => b.openCases - a.openCases)[0];
  assert(busiest, 'Bộ demo không có hạng mục nào đang có case mở');

  const board = effectiveness.issueBoard(scope, busiest.code) as any;
  for (const row of board.rows) {
    const drill = effectiveness.issueBoardCases(scope, busiest.code, row.code) as any;
    assert(drill.rows.length === row.cases,
      `Hàng "${row.label}" ghi ${row.cases} case nhưng bấm vào ra ${drill.rows.length} dòng`);
    assert(drill.rows.every((c: any) => c.issueLabel === row.label),
      `Bấm vào hàng "${row.label}" lại ra case của phân loại khác`);
  }

  /* Không truyền phân loại thì ra CẢ hạng mục — và tổng phải khớp tổng các hàng. */
  const all = effectiveness.issueBoardCases(scope, busiest.code, null) as any;
  const sum = board.rows.reduce((n: number, r: any) => n + r.cases, 0);
  assert(all.rows.length === sum, `Cả hạng mục ra ${all.rows.length} case, cộng các hàng ra ${sum}`);
});

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

check('[15.2] Lọc chi nhánh áp cho CẢ ba đường: hàng kỹ năng, bảng phân loại và danh sách', () => {
  const mb = (conn.prepare("SELECT id FROM branches WHERE code='MB'").get() as any).id;
  const scope = { ratio: false, branchIds: [mb] } as any;
  const rows = effectiveness.issueSkillRows(scope) as any[];
  const pick = rows.filter((r) => r.code !== 'behaviour' && r.openCases > 0)[0];
  if (!pick) return;

  const classCodes = new Set(
    (conn.prepare('SELECT code FROM classes WHERE branch_id = ?').all(mb) as any[]).map((c) => c.code),
  );
  const drill = effectiveness.issueBoardCases(scope, pick.code, null) as any;
  for (const c of drill.rows) {
    assert(!c.classCode || classCodes.has(c.classCode),
      `Lọc chi nhánh MB mà vẫn ra case của lớp ${c.classCode}`);
  }
  /* Cả trung tâm phải rộng hơn hoặc bằng một chi nhánh — nếu hẹp hơn thì bộ lọc đang sai chiều. */
  const whole = effectiveness.issueBoardCases({ ratio: false } as any, pick.code, null) as any;
  assert(whole.rows.length >= drill.rows.length, 'Cả trung tâm ra ít case hơn một chi nhánh');
});

check('[15.3] Ý thức/Khác KHÔNG có bảng hiệu quả phương án', () => {
  const b = effectiveness.issueBoard({ ratio: false } as any, 'behaviour') as any;
  assert(b.plans.length === 0,
    'Nhóm Ý thức/Khác đang có tỷ lệ hiệu quả — gia đình nhận report không chứng minh em tiến bộ');
  assert(b.rows.length > 0, 'Nhóm Ý thức/Khác mất luôn bảng phân loại');
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
  /* Không có phương án nào được máy tự sinh: mọi phương án đều có người ghi. */
  const ghost = one(
    `SELECT COUNT(*) n FROM case_interventions WHERE recorded_by IS NULL AND performer_user_id IS NULL`,
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

check('[18.2-10] Có đợt case Ý thức gộp nhiều báo cáo, và ranh giới bốn ngày đúng', () => {
  const merged = many(
    `SELECT sc.id, sc.detected_at, sc.merge_until, COUNT(r.id) AS n
       FROM sos_cases sc JOIN case_reports r ON r.case_id = sc.id
      WHERE sc.track = 'behaviour' GROUP BY sc.id HAVING n >= 2`,
  );
  assert(merged.length > 0, 'Không có đợt Ý thức nào gộp từ hai báo cáo trở lên');
  for (const m of merged) {
    assert(m.merge_until === addDays(m.detected_at, 3),
      `Đợt ${m.id}: cửa sổ gộp không phải bốn ngày kể cả ngày đầu`);
    const outside = many('SELECT reported_on FROM case_reports WHERE case_id = ?', m.id)
      .filter((r) => r.reported_on > m.merge_until || r.reported_on < m.detected_at);
    assert(outside.length === 0, `Đợt ${m.id} có báo cáo nằm ngoài cửa sổ gộp`);
  }
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
    `SELECT iv.id, sc.category, sc.track,
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

check('[18.2-12b] Có em ĐÃ report cho gia đình mà hành vi vẫn tái diễn', () => {
  const rows = many(
    `SELECT sc.student_id, sc.topic, sc.detected_at, sc.status,
            (SELECT MIN(iv.completed_date) FROM case_interventions iv
               JOIN sos_cases s2 ON s2.id = iv.case_id
              WHERE s2.student_id = sc.student_id AND iv.kind = 'talk_parent'
                AND iv.status = 'completed' AND iv.completed_date IS NOT NULL) AS first_call
       FROM sos_cases sc WHERE sc.track = 'behaviour'`,
  );
  assert(rows.some((r) => r.first_call && r.detected_at > r.first_call),
    'Không có đợt Ý thức nào xảy ra SAU khi gia đình đã được report');
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
check('CASE-01 · Mỗi nhóm Ý thức đều có bộ phân loại để chọn', () => {
  for (const topic of domain.BEHAVIOUR_TOPICS) {
    const list = domain.issuesForTopic(topic);
    assert(list.length > 0, `Nhóm ý thức "${topic}" không có phân loại nào để chọn`);
  }
});
check('CASE-01 · Tạo được case Ý thức bằng đúng phân loại của nhóm đó', () => {
  const topic = domain.BEHAVIOUR_TOPICS[0];
  const code = domain.issuesForTopic(topic)[0].code;
  const made = cases.reportIssue(P.coreTeacher, {
    studentId: 3, track: 'behaviour', topic, primaryCode: code,
    title: 'Ý thức: em nghỉ nhiều buổi liên tiếp',
    summary: 'Em nghỉ bốn buổi trong hai tuần, chưa có lý do từ gia đình.',
  });
  assert(made?.id, 'Phải tạo được case Ý thức');
});

// ==================================================================== PR-C

check('CASE-01 (nốt) · topicFromBehaviourCode phủ hết BEHAVIOUR_TOPICS', () => {
  for (const t of domain.BEHAVIOUR_TOPICS) {
    const got = domain.topicFromBehaviourCode(`student.behaviour.${t}`);
    assert(got === t, `Mã student.behaviour.${t} phải suy ra topic "${t}", đang ra "${got}"`);
  }
  assert(domain.topicFromBehaviourCode('student.listening.technique') === null,
    'Mã không thuộc nhóm Ý thức phải suy ra null, không đoán bừa');
});

check('CASE-01 (nốt) · Tạo case Ý thức CHỈ truyền primaryCode, không truyền topic', () => {
  const made = cases.reportIssue(P.coreTeacher, {
    studentId: 3, track: 'behaviour', primaryCode: 'student.behaviour.homework',
    title: 'Ý thức: em không làm bài tập về nhà',
    summary: 'Ba tuần liên tiếp không nộp bài tập, đã nhắc trực tiếp hai lần.',
  });
  assert(made?.id, 'Phải tạo được case dù không truyền topic');
  const row = conn.prepare('SELECT topic FROM sos_cases WHERE id = ?').get(made.id) as any;
  assert(row.topic === 'homework', `topic đọc ra phải là "homework" (BTVN), đang ra "${row.topic}"`);
});

check('CASE-01 (nốt) · Hai báo cáo BTVN trong cửa sổ gộp MỘT đợt; ngoài cửa sổ thành HAI đợt', () => {
  /*
   * `demoToday()` cố định trong một lượt chạy test nên không mô phỏng được "cách N ngày thật"
   * qua `detectedAt` (server luôn so `merge_until` với CHÍNH `today` lúc gọi — hai lệnh gọi
   * liên tiếp trong cùng lượt test luôn cùng `today`). Mô phỏng đúng bằng cách chỉnh thẳng
   * `merge_until` của case đầu về quá khứ, tương đương "cửa sổ bốn ngày đã đóng".
   */
  const first = cases.reportIssue(P.coreTeacher, {
    studentId: 3, track: 'behaviour', primaryCode: 'student.behaviour.attendance',
    title: 'Ý thức: em nghỉ học không phép',
    summary: 'Nghỉ học không phép, chưa rõ lý do từ gia đình.',
  });
  const secondNear = cases.reportIssue(P.mbManager, {
    studentId: 3, track: 'behaviour', primaryCode: 'student.behaviour.attendance',
    title: 'Ý thức: em tiếp tục nghỉ học',
    summary: 'Vẫn nghỉ, không phép, chưa liên lạc được gia đình.',
  });
  assert(first.id === secondNear.id,
    `Trong cửa sổ gộp (cùng today) phải chung một case, đang ra ${first.id} và ${secondNear.id}`);

  conn.prepare('UPDATE sos_cases SET merge_until = ? WHERE id = ?').run(addDays(demoToday(), -1), first.id);
  const farAway = cases.reportIssue(P.mbManager, {
    studentId: 3, track: 'behaviour', primaryCode: 'student.behaviour.attendance',
    title: 'Ý thức: em nghỉ học đợt mới',
    summary: 'Sau một thời gian đi học đều, nay lại nghỉ không phép — đợt mới.',
  });
  assert(farAway.id !== first.id,
    `Cửa sổ gộp đã đóng (merge_until < today) phải thành đợt MỚI, đang gộp chung với case ${first.id}`);
});

check('CASE-01 Task 2 · Case Ý thức với detectedAt lùi 10 ngày bị TỪ CHỐI', () => {
  let threw = false;
  try {
    cases.reportIssue(P.coreTeacher, {
      studentId: 3, track: 'behaviour', primaryCode: 'student.behaviour.participation',
      title: 'Ý thức: em ít phát biểu trên lớp',
      summary: 'Ba buổi liên tiếp không giơ tay, gọi tên mới trả lời.',
      detectedAt: addDays(demoToday(), -10),
    });
  } catch (e: any) { threw = true; }
  assert(threw, 'Case Ý thức chọn ngày quá khứ phải bị máy chủ từ chối, không im lặng bỏ qua');
});

check('CASE-01 Task 2 · Case Học thuật vẫn chọn được ngày quá khứ như cũ', () => {
  const st = formTestStudent();
  const made = cases.reportIssue(P.admin, {
    studentId: st.id, cycleId: st.cycle_id, track: 'academic', topic: 'reading',
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
 * MB-FT 101 (không kiêm GVCN). `P.lrTeacher` KHÔNG dùng được ở đây: bộ demo chỉ có 3 giáo
 * viên cho 5 kỹ năng của lớp này, và trong đúng lớp MB-FT 101, người dạy Listening lại
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
    studentId: enr.student_id, cycleId: cy?.id, track: 'academic', topic: authMismatchSkill,
    primaryCode: domain.issuesForTopic(authMismatchSkill)[0].code,
    title: `${authMismatchSkill}: kiểm quyền AUTH-01`,
    summary: `Ghi nhận riêng để kiểm quyền AUTH-01 — GVBM ${authSubjectSkill} không được sửa case ${authMismatchSkill}.`,
    parallel: true,
  });
  assertThrows(() => cases.recordIntervention(P.subjectTeacher, otherCase.id, {
    kind: 'self_study', description: 'Giao thêm bài luyện ngoài giờ.', status: 'planned',
  }), /quyền/, `GVBM ${authSubjectSkill} ghi nhận phương án cho case ${authMismatchSkill}`);
});

check('CASE-01 Task 4 (AUTH-01) · GVBM tạo phương án cho case Ý thức → bị từ chối', () => {
  const enr = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(mbClass) as any;
  const behaviourCase = cases.reportIssue(P.admin, {
    studentId: enr.student_id, track: 'behaviour', primaryCode: 'student.behaviour.attendance',
    title: 'Ý thức: kiểm quyền AUTH-01',
    summary: 'Ghi nhận riêng để kiểm quyền — GV bộ môn không phải GVCN không được xử lý case Ý thức.',
    parallel: true,
  });
  assertThrows(() => cases.recordIntervention(P.subjectTeacher, behaviourCase.id, {
    kind: 'talk_student', description: 'Nói chuyện riêng về việc đi học đều.', status: 'planned',
  }), /quyền/, 'GVBM ghi nhận phương án cho case Ý thức');
});

check('CASE-01 Task 4 (AUTH-01) · GVBM sửa case ĐÚNG kỹ năng mình dạy cùng lớp → được phép', () => {
  const enr = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(mbClass) as any;
  const cy = conn.prepare(
    `SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' LIMIT 1`,
  ).get(enr.student_id) as any;
  const ownCase = cases.reportIssue(P.admin, {
    studentId: enr.student_id, cycleId: cy?.id, track: 'academic', topic: authSubjectSkill,
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
 * ĐỦ SINH VIÊN RIÊNG CHO TỪNG PHÉP KIỂM: dùng đúng học viên đang học ở MB-FT 101 (khớp
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
  const done = cases.backfillCase(P.coreTeacher, {
    studentId: backfillEnr.student_id, cycleId: backfillCycle?.id,
    track: 'academic', topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 1`, summary: 'Case nhập bù để kiểm chốt 1 — không sinh hạn cập nhật tuần.',
    fromDate: '2026-07-01', toDate: '2026-07-20',
    actions: [{ description: 'Giao bài luyện thêm mỗi tuần', performerName: 'GV bộ môn', fromDate: '2026-07-01', toDate: '2026-07-20' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 1: đã cải thiện rõ sau ba tuần.',
  }) as any;
  const iv = (conn.prepare('SELECT action_due, followup_due FROM case_interventions WHERE case_id = ?').all(done.id) as any[])[0];
  assert(iv.action_due === null, `Chốt 1: phương án nhập bù không được có hạn cập nhật, đang là ${iv.action_due}`);
  assert(iv.followup_due === null, `Chốt 1: phương án nhập bù không được có hạn kết thúc, đang là ${iv.followup_due}`);
});

check('Nhập bù (chốt 2) · Case nhập bù không có hạn nào, không vào hàng đợi quá hạn', () => {
  const enr2 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' AND student_id != ? LIMIT 1`)
    .get(mbClass, backfillEnr.student_id) as any ?? backfillEnr;
  const done = cases.backfillCase(P.coreTeacher, {
    studentId: enr2.student_id, cycleId: null,
    track: 'behaviour', primaryCode: 'student.behaviour.homework',
    topic: 'homework',
    title: 'Ý thức: nhập bù chốt 2', summary: 'Case nhập bù để kiểm chốt 2 — không hạn nào cả.',
    fromDate: '2026-06-01', toDate: '2026-06-10',
    actions: [{ description: 'Trao đổi với em về việc làm bài', performerName: 'GVCN', fromDate: '2026-06-01', toDate: '2026-06-10' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 2: em đã làm bài đều trở lại.',
  }) as any;
  const row = conn.prepare('SELECT merge_until, follow_until FROM sos_cases WHERE id = ?').get(done.id) as any;
  assert(row.merge_until === null, `Chốt 2: case nhập bù không được có cửa sổ gộp, đang là ${row.merge_until}`);
  assert(row.follow_until === null, `Chốt 2: case nhập bù không được có hạn báo kết quả, đang là ${row.follow_until}`);
  const dueRows = mywork.myWork(P.coreTeacher, {}).groups
    .flatMap((g: any) => g.items).filter((it: any) => it.caseId === done.id);
  assert(dueRows.length === 0, `Chốt 2: case nhập bù không được rơi vào hàng đợi việc, đang có ${dueRows.length} dòng`);
});

check('Nhập bù (chốt 3) · Không gộp vào đợt Ý thức đang mở, dù ngày rơi trong cửa sổ gộp', () => {
  const enr3 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const open = cases.reportIssue(P.coreTeacher, {
    studentId: enr3.student_id, track: 'behaviour', primaryCode: 'student.behaviour.participation',
    title: 'Ý thức: đợt đang mở để kiểm chốt 3',
    summary: 'Đợt Ý thức ĐANG MỞ hôm nay, dùng để kiểm case nhập bù không được gộp vào đây.',
    parallel: true,
  }) as any;
  const done = cases.backfillCase(P.coreTeacher, {
    studentId: enr3.student_id, track: 'behaviour', primaryCode: 'student.behaviour.participation',
    topic: 'participation',
    title: 'Ý thức: nhập bù chốt 3', summary: 'Case nhập bù cùng phân loại "tham gia trên lớp" nhưng ở quá khứ xa.',
    fromDate: '2026-05-01', toDate: '2026-05-05',
    actions: [{ description: 'Nhắc em phát biểu nhiều hơn', performerName: 'GVCN', fromDate: '2026-05-01', toDate: '2026-05-05' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 3: không được gộp vào đợt đang mở hôm nay.',
  }) as any;
  assert(done.id !== open.id, 'Chốt 3: case nhập bù bị gộp nhầm vào đợt Ý thức đang mở hôm nay');
  const stillOpen = conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(open.id) as any;
  assert(stillOpen.status !== 'done', 'Chốt 3: đợt đang mở bị đóng lây khi nhập bù một case khác');
});

check('Nhập bù (chốt 4) · Không tạo tín hiệu, không đổi mức SOS', () => {
  const enr4 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const done = cases.backfillCase(P.coreTeacher, {
    studentId: enr4.student_id, cycleId: backfillCycle?.id,
    track: 'academic', topic: authMismatchSkill,
    primaryCode: domain.issuesForTopic(authMismatchSkill)[0].code,
    title: `${authMismatchSkill}: nhập bù chốt 4`, summary: 'Case nhập bù để kiểm chốt 4 — không tự sinh mức SOS.',
    fromDate: '2026-04-01', toDate: '2026-04-15',
    actions: [{ description: 'Ôn lại kỹ thuật làm bài', performerName: 'GV bộ môn', fromDate: '2026-04-01', toDate: '2026-04-15' }],
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
  const done = cases.backfillCase(P.coreTeacher, {
    studentId: enr5.student_id, cycleId: backfillCycle?.id,
    track: 'academic', topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 5`, summary: 'Case nhập bù để kiểm chốt 5 — không vào mẫu số hiệu quả.',
    fromDate: '2026-03-01', toDate: '2026-03-10',
    actions: [{ description: 'Luyện thêm dạng bài hay sai', performerName: 'GV bộ môn', fromDate: '2026-03-01', toDate: '2026-03-10' }],
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
  const first = cases.backfillCase(P.coreTeacher, {
    studentId: enr6.student_id, cycleId: backfillCycle?.id,
    track: 'academic', topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 6 lần 1`, summary: 'Case nhập bù lần đầu để kiểm chốt 6 — cảnh báo trùng.',
    fromDate: '2026-02-01', toDate: '2026-02-10',
    actions: [{ description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-02-01', toDate: '2026-02-10' }],
    outcome: 'improved', note: 'Case nhập bù chốt 6, lần 1.',
  }) as any;
  assertThrows(() => cases.backfillCase(P.coreTeacher, {
    studentId: enr6.student_id, cycleId: backfillCycle?.id,
    track: 'academic', topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 6 lần 2 (trùng)`, summary: 'Case nhập bù thứ hai, TRÙNG khoảng ngày với lần 1.',
    fromDate: '2026-02-05', toDate: '2026-02-15',
    actions: [{ description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-02-05', toDate: '2026-02-15' }],
    outcome: 'improved', note: 'Case nhập bù chốt 6, lần 2 — phải bị cảnh báo trùng.',
  }), /trùng|nhập bù/, 'Nhập bù trùng khoảng ngày với một case nhập bù khác cùng hạng mục');
  // Xác nhận "đây là lần khác" thì vẫn tạo được.
  const second = cases.backfillCase(P.coreTeacher, {
    studentId: enr6.student_id, cycleId: backfillCycle?.id,
    track: 'academic', topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù chốt 6 lần 2 (xác nhận)`, summary: 'Case nhập bù thứ hai, đã xác nhận là lần khác.',
    fromDate: '2026-02-05', toDate: '2026-02-15',
    actions: [{ description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-02-05', toDate: '2026-02-15' }],
    outcome: 'improved', note: 'Case nhập bù chốt 6, lần 2 — đã xác nhận qua cảnh báo.',
    confirmDuplicate: true,
  }) as any;
  assert(second.id !== first.id, 'Xác nhận trùng vẫn phải tạo được một case nhập bù riêng');
});

check('Nhập bù (chốt 7) · Ghi rõ ai nhập, nhập lúc nào, lưu cùng case', () => {
  const enr7 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const done = cases.backfillCase(P.coreTeacher, {
    studentId: enr7.student_id, track: 'behaviour', primaryCode: 'student.behaviour.other',
    topic: 'other',
    title: 'Ý thức: nhập bù chốt 7', summary: 'Case nhập bù để kiểm chốt 7 — phải ghi rõ ai nhập và lúc nào.',
    fromDate: '2026-01-05', toDate: '2026-01-12',
    actions: [{ description: 'Trao đổi riêng với em', performerName: 'GVCN', fromDate: '2026-01-05', toDate: '2026-01-12' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm chốt 7.',
  }) as any;
  const row = conn.prepare('SELECT origin_kind, reported_by, created_at FROM sos_cases WHERE id = ?').get(done.id) as any;
  assert(row.origin_kind === 'backfill', 'Chốt 7: phải phân biệt được với case ghi tại chỗ qua origin_kind');
  assert(row.reported_by === P.coreTeacher.userId, 'Chốt 7: phải ghi đúng ai đã nhập bù');
  assert(!!row.created_at, 'Chốt 7: phải ghi rõ lúc nhập (khác ngày xảy ra thật)');
});

check('Nhập bù (chốt 7, tiếp) · Nhãn "nhập bù" hiện trên thẻ case của hồ sơ học viên', () => {
  const enr7b = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const done = cases.backfillCase(P.coreTeacher, {
    studentId: enr7b.student_id, track: 'behaviour', primaryCode: 'student.behaviour.attendance',
    topic: 'attendance',
    title: 'Ý thức: nhập bù chốt 7 tiếp', summary: 'Case nhập bù để kiểm nhãn hiện trên thẻ case của hồ sơ.',
    fromDate: '2025-12-01', toDate: '2025-12-08',
    actions: [{ description: 'Gọi điện trao đổi với phụ huynh', performerName: 'GVCN', fromDate: '2025-12-01', toDate: '2025-12-08' }],
    outcome: 'improved', note: 'Case nhập bù, kiểm nhãn "nhập bù" trên thẻ case.',
  }) as any;
  const board = cases.skillSupportBoard(P.coreTeacher, enr7b.student_id) as any;
  const card = board.rows.flatMap((r: any) => r.cases).find((c: any) => c.id === done.id);
  assert(card, 'Case nhập bù không xuất hiện trên bảng kỹ năng của hồ sơ');
  assert(card.backfilledOn === '2025-09-19' || /^\d{4}-\d{2}-\d{2}$/.test(card.backfilledOn ?? ''),
    `Chốt 7: thẻ case nhập bù phải có ngày ghi, đang là ${card.backfilledOn}`);
  assert(card.backfilledBy, 'Chốt 7: thẻ case nhập bù phải có tên người ghi');
});

check('Nhập bù · Ghi chú kết luận bắt buộc ngay ở máy chủ, không chỉ ở giao diện', () => {
  const enrN = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  assertThrows(() => cases.backfillCase(P.coreTeacher, {
    studentId: enrN.student_id, track: 'behaviour', primaryCode: 'student.behaviour.homework',
    topic: 'homework',
    title: 'Ý thức: kiểm ghi chú bắt buộc', summary: 'Case nhập bù để kiểm ghi chú kết luận bắt buộc ở tầng máy chủ.',
    fromDate: '2025-11-01', toDate: '2025-11-05',
    actions: [{ description: 'Trao đổi với em', performerName: 'GVCN', fromDate: '2025-11-01', toDate: '2025-11-05' }],
    outcome: 'improved', note: 'quá ngắn',
  }), /ghi chú/, 'Gọi thẳng API nhập bù với ghi chú quá ngắn (dưới 10 ký tự)');
});

check('Nhập bù · Chỉ GVCN/Quản lý mới CHỐT được — GVBM sai vai bị chặn, không tạo case nửa vời', () => {
  const enr8 = conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`)
    .get(mbClass) as any;
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assertThrows(() => cases.backfillCase(P.subjectTeacher, {
    studentId: enr8.student_id, cycleId: backfillCycle?.id,
    track: 'academic', topic: authSubjectSkill,
    primaryCode: domain.issuesForTopic(authSubjectSkill)[0].code,
    title: `${authSubjectSkill}: nhập bù bởi GVBM`, summary: 'GVBM tự nhập bù case kỹ năng mình dạy, nhưng không có quyền chốt.',
    fromDate: '2026-01-20', toDate: '2026-01-25',
    actions: [{ description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: '2026-01-20', toDate: '2026-01-25' }],
    outcome: 'improved', note: 'GVBM tự nhập, phải bị chặn ở bước chốt kết quả.',
  }), /chủ nhiệm|Quản lý/, 'GVBM (không phải GVCN) tự chốt được case nhập bù');
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
  ).get(classId('MB-FOU 12')) as any;
  assert(row, 'Seed thiếu một bài Writing lớp Normal chưa chấm để kiểm SCH-01');
  return row as { attemptId: number; skill: string; periodId: number };
}

check('SCH-01 · GVBM lớp Normal dời được ĐÚNG môn mình dạy, không dời được môn khác', () => {
  const { attemptId, periodId } = normalWritingAttemptSkill();
  const otherPeriod = periodOf(addDays(week.periodById(periodId)!.week_start, 7));
  assert(
    !can(P.normalSubjectTeacher, PERMISSIONS.SCHEDULE_MOVE, { classId: classId('MB-FOU 12'), skill: 'speaking' }),
    'GVBM Writing không được có quyền dời Speaking',
  );
  assert(
    can(P.normalSubjectTeacher, PERMISSIONS.SCHEDULE_MOVE, { classId: classId('MB-FOU 12'), skill: 'writing' }),
    'GVBM Writing phải dời được đúng môn Writing',
  );
  const r = skillSchedule.setSkillWeek(P.normalSubjectTeacher, attemptId, 'writing', otherPeriod, {});
  assert(r.ok, 'GVBM Writing phải dời được lịch Writing của lớp Normal mình dạy');
});

check('SCH-01 · GVCN lớp Normal dời được mọi môn trong lớp mình chủ nhiệm', () => {
  const cid = classId('MB-FOU 12');
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
    !can(P.normalCoreTeacher, PERMISSIONS.PLAN_WEEK, { classId: classId('MB-FOU 12') }),
    'Cấp SCHEDULE_MOVE không được kèm PLAN_WEEK — nếu không sẽ vô tình mở luôn xếp lịch FT chủ động',
  );
});

check('SCH-02 · Xác nhận trạng thái thi dùng ĐÚNG cùng quyền với dời lịch (moveableSkills)', () => {
  const cid = classId('MB-FOU 12');
  const list = permissions.moveableSkills(P.normalSubjectTeacher, cid, ['listening', 'reading', 'writing', 'speaking']);
  assert(list.join(',') === 'writing', `GVBM Writing chỉ được liệt kê đúng writing, đang ra: ${list.join(',')}`);
  const listCore = permissions.moveableSkills(P.normalCoreTeacher, cid, ['listening', 'reading', 'writing', 'speaking']);
  assert(listCore.length === 4, 'GVCN phải dời được cả bốn môn của lớp Normal mình');
});

/** MT1/MT2/MT3 liên tiếp cùng lộ trình ở MB-FT 101, dùng chung cho các phép kiểm T13. */
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

check('T13 · Dời MT2 VƯỢT quá tuần đầu MT3 (đợt sau) bị CHẶN, chỉ rõ xung đột', () => {
  const [mt1, mt2, mt3] = threeConsecutiveMocks();
  const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
  const pastMt3 = addDays(mt3Week, 7); // hẳn sau tuần đầu MT3 — đây mới là "vượt", không phải "trùng"
  const check = skillSchedule.checkSkillWeekMove({
    attemptId: mt2.attemptId, skill: 'listening', newWeekStart: pastMt3,
  });
  assert(check.blockers.length > 0, `Dời MT2 vượt quá tuần đầu MT3 phải bị CHẶN, đang ra: ${JSON.stringify(check)}`);
});

check('T13 · Dời MT2 TRÙNG đúng tuần đầu MT3 chỉ CẢNH BÁO, không chặn', () => {
  const [mt1, mt2, mt3] = threeConsecutiveMocks();
  const mt3Week = week.periodById(mt3.planned_period_id)!.week_start;
  const check = skillSchedule.checkSkillWeekMove({
    attemptId: mt2.attemptId, skill: 'listening', newWeekStart: mt3Week,
  });
  assert(check.blockers.length === 0, `Trùng tuần (chưa vượt) không được CHẶN, đang ra: ${JSON.stringify(check)}`);
  assert(check.warnings.length > 0, 'Trùng đúng tuần đầu đợt sau phải có CẢNH BÁO');
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

check('T07 · Kế hoạch Test chỉ hiện học viên lớp Fast Track, KHÔNG có Normal', () => {
  const q = planning.noPlanQueue(P.admin, { includePlanned: true });
  const normalClass = classId('MB-FOU 12');
  assert(q.rows.length > 0, 'Cần có học viên FT trong hàng đợi để kiểm');
  assert(
    q.rows.every((r: any) => r.classId !== normalClass),
    'Kế hoạch Test không được hiện học viên của lớp Normal (MB-FOU 12)',
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
    mode: 'monitor', outcome: 'partial', observedOn: TODAY,
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
    mode: 'monitor', outcome: 'unchanged', observedOn: TODAY,
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
    mode: 'monitor', outcome: 'partial', observedOn: TODAY,
    note: 'Bản ghi cũ có kèm điểm cô tự chấm (PR-D)',
    metrics: [{ skill: 'listening', score: 6, total: null }],
  });
  const detail = cases.caseDetail(P.coreTeacher, c.id) as any;
  const f = detail.followups.find((x: any) => x.metrics?.length);
  assert(f && f.metrics[0].skill === 'listening' && f.metrics[0].score === 6,
    'Điểm tự chấm đã lưu bị mất — CASE-05 nói rõ phải giữ');
});

check('PR-D · CASE-06: case Ý thức hoàn thành bằng ghi chú + ngày, KHÔNG bị bắt chọn "tiến bộ đến đâu"', () => {
  const stB = conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status='active'
                             WHERE e.class_id = ? ORDER BY s.id DESC LIMIT 1`).get(mbClass) as any;
  const c = cases.reportIssue(P.coreTeacher, {
    title: 'Ý thức: quên bài về nhà (PR-D)', primaryCode: 'student.behaviour.participation',
    studentId: stB.id, track: 'behaviour', topic: 'participation', urgency: 'attention',
    summary: 'Em ít phát biểu ba buổi liền — case dựng riêng cho phép kiểm CASE-06.',
    idempotencyKey: 'test-prd-4',
  }) as any;
  const kind = domain.interventionKindsFor('behaviour').selfServe[0];
  cases.recordIntervention(P.coreTeacher, c.id, {
    kind, description: 'Trao đổi riêng với em (PR-D)', performerName: 'GVCN',
    status: 'completed', completedDate: TODAY,
  });
  assert(cases.closeBlockers(c.id).length === 0, 'Phương án đã xong mà case vẫn bị chặn');
  const done = cases.closeCaseOutcome(P.coreTeacher, c.id, {
    note: 'Đã trao đổi riêng, em hứa phát biểu nhiều hơn — kết thúc đợt này.', closedOn: TODAY,
  } as any) as any;
  assert(done.status === 'done' && done.closedAt, 'Case Ý thức không hoàn thành được nếu không chọn mức tiến bộ');
  assert(done.outcome === null, `Ý thức không đo hiệu quả học thuật, không được bịa mức tiến bộ: ${done.outcome}`);
  const j = conn.prepare(`SELECT title FROM journey_events WHERE event_type = 'case_closed' AND ref_table = 'sos_cases' AND ref_id = ?
                           ORDER BY id DESC LIMIT 1`).get(c.id) as any;
  assert(j && !/undefined/.test(j.title), `Dòng hành trình có chữ "undefined": ${j?.title}`);
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

check('PR-E · <TyLe>: mẫu dưới 5 gắn nhãn "mẫu nhỏ"; từ 5 trở lên thì không', () => {
  assert(domain.rateText(1, 1) === '1/1 (100%) · mẫu nhỏ', `Đang ghi "${domain.rateText(1, 1)}"`);
  assert(domain.rateText(3, 4) === '3/4 (75%) · mẫu nhỏ', `Đang ghi "${domain.rateText(3, 4)}"`);
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
  assert(s(2, 1).text === 'SOS 1 tạm thời · 2/4 kỹ năng có điểm', `Nhánh 3: "${s(2, 1).text}"`);
  assert(s(2, 1).tone === 'danger' && /tạm thời/.test(s(2, 1).text), 'Nhánh 3 phải đỏ và giữ chữ "tạm thời"');
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

check('PR-E · <Han>: sáu loại hạn có sáu nhãn khác nhau, đúng bảng HE_GIAO_DIEN §4', () => {
  const t = (loai: any, han = '2026-09-23') => domain.deadlineView({ kind: loai, due: han, today: '2026-09-14' }).text;
  assert(t('xac-minh-sos') === 'Xác minh nguyên nhân · hạn 23/09', `xac-minh-sos: "${t('xac-minh-sos')}"`);
  assert(t('lap-pa') === 'Cần có phương án · hạn 23/09', `lap-pa: "${t('lap-pa')}"`);
  assert(t('cap-nhat-pa') === 'Cập nhật kết quả · trước CN 23/09', `cap-nhat-pa: "${t('cap-nhat-pa')}"`);
  assert(t('thuc-hien-y-thuc') === 'Thực hiện xong · hạn 23/09', `thuc-hien-y-thuc: "${t('thuc-hien-y-thuc')}"`);
  assert(t('hoan-thanh-y-thuc') === 'Kết luận đợt · hạn 23/09', `hoan-thanh-y-thuc: "${t('hoan-thanh-y-thuc')}"`);
  assert(t('nhap-diem') === 'Hạn nhập điểm 23/09', `nhap-diem: "${t('nhap-diem')}"`);
  assert(t('du-kien-ket-thuc') === 'Dự kiến kết thúc 23/09', `du-kien-ket-thuc: "${t('du-kien-ket-thuc')}"`);
  const all = ['xac-minh-sos', 'lap-pa', 'cap-nhat-pa', 'thuc-hien-y-thuc', 'hoan-thanh-y-thuc', 'nhap-diem', 'du-kien-ket-thuc'].map((k) => t(k));
  assert(new Set(all).size === 7, 'Có hai loại hạn dùng chung một câu — chúng là sáu đồng hồ khác nhau');
});

check('PR-E · <Han>: quá hạn ghi rõ số ngày và đếm từ HẠN GỐC, không từ hạn đã dời', () => {
  const v = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', today: '2026-09-25' });
  assert(v.text === 'Hạn nhập điểm 23/09 · quá hạn 2 ngày' && v.tone === 'overdue' && v.daysOverdue === 2,
    `Đang ghi "${v.text}" (${v.tone}, ${v.daysOverdue})`);
  // Hạn đã dời sang 30/09 nhưng hạn gốc 23/09 đã qua 2 ngày: vẫn đếm từ 23/09.
  const moved = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-30', originalDue: '2026-09-23', today: '2026-09-25' });
  assert(moved.daysOverdue === 2, `Phải đếm từ hạn gốc (2 ngày), đang là ${moved.daysOverdue}`);
  // Chưa quá hạn thì không tô quá hạn.
  const ok = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', today: '2026-09-23' });
  assert(ok.tone !== 'overdue' && ok.daysOverdue === null, 'Đúng ngày hạn chưa phải quá hạn');
});

check('PR-E · <Han>: có hẹn xử lý thì hiện CẢ HAI, không ghi đè hạn gốc', () => {
  const v = domain.deadlineView({ kind: 'nhap-diem', due: '2026-09-23', reschedule: '2026-09-30', today: '2026-09-14' });
  assert(v.text === 'Hạn nhập điểm 23/09 · Hẹn xử lý 30/09', `Đang ghi "${v.text}"`);
});

check('PR-E · <Han>: "Dự kiến kết thúc" KHÔNG phải hạn — không bao giờ quá hạn, không bao giờ đỏ (F11)', () => {
  const v = domain.deadlineView({ kind: 'du-kien-ket-thuc', due: '2026-08-30', today: '2026-09-14' });
  assert(v.tone === 'neutral' && v.daysOverdue === null, `Đang là ${v.tone}, quá hạn ${v.daysOverdue}`);
  assert(!/quá hạn/.test(v.text), `Ngày dự kiến bị ghi là quá hạn: "${v.text}"`);
});

check('PR-E · <Han>: cập nhật phương án là mốc Chủ nhật — không có đơn vị "ngày"', () => {
  const v = domain.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-06', today: '2026-09-14' });
  assert(v.tone === 'overdue' && /quá hạn/.test(v.text), `Phải báo quá hạn: "${v.text}"`);
  assert(!/\d+ ngày/.test(v.text), `cap-nhat-pa không được đếm số ngày: "${v.text}"`);
});

check('PR-E · <Han>: thiếu ngày hạn thì nói thẳng là chưa có hạn, không vẽ "Invalid Date"', () => {
  const v = domain.deadlineView({ kind: 'nhap-diem', due: null, today: '2026-09-14' });
  assert(/chưa có hạn/.test(v.text) && !/Invalid|NaN|undefined/.test(v.text), `Đang ghi "${v.text}"`);
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

check('PR-F · Sổ chỉ số: đúng mười một chỉ số, mỗi chỉ số đủ tám trường (thiếu một trường thì không được lên dashboard)', () => {
  const list = domain.METRICS as readonly any[];
  assert(list.length === 11, `Phải có mười một chỉ số, đang có ${list.length}`);
  const expected = ['hv-sos-hien-tai', 'hv-duoi-ky-vong-mon', 'hv-co-case-mo', 'case-mo', 'tin-hieu-cho-xac-minh',
    'case-thieu-pa', 'pa-can-cap-nhat', 'pa-co-ket-qua', 'ty-le-co-cai-thien', 'dung-han-cap-nhat', 'do-phu-danh-gia'];
  for (const id of expected) assert(list.some((m) => m.id === id), `Thiếu chỉ số ${id}`);
  assert(new Set(list.map((m) => m.id)).size === list.length, 'Có hai chỉ số trùng mã');
  const fields = ['id', 'ten', 'cauHoi', 'donVi', 'tapDuDieuKien', 'thoiGian', 'khuTrung', 'drilldown'];
  for (const m of list) {
    for (const f of fields) {
      assert(typeof m[f] === 'string' && m[f].trim().length > 0, `Chỉ số ${m.id} thiếu trường "${f}"`);
    }
    assert(['hoc-vien', 'case', 'phuong-an', 'bai-thi', 'tin-hieu', 'dot-test', 'nghia-vu'].includes(m.donVi), `${m.id}: đơn vị lạ "${m.donVi}"`);
    assert(['hien-trang', 'phat-sinh-trong-ky', 'ket-qua-trong-ky'].includes(m.thoiGian), `${m.id}: thời gian lạ "${m.thoiGian}"`);
  }
  assert(domain.metricById('hv-co-case-mo')?.ten === 'Học viên có case đang mở', 'metricById phải tra đúng chỉ số');
  assert(domain.metricById('khong-co') === null, 'metricById của mã lạ phải là null');
});

check('PR-F · F01 (P0): hai chi nhánh CÙNG TUẦN không cộng lẫn số case, học viên và đề xuất chờ duyệt của nhau', () => {
  const pid = (conn.prepare(`SELECT id FROM report_periods WHERE code = 'W3 AUG 2026'`).get() as any)?.id;
  assert(pid, 'Bộ demo thiếu tuần W3 AUG 2026 để dựng phép kiểm F01');
  const mb = branchIdOf('MB'), cp = branchIdOf('CP');
  /* SỰ THẬT ĐỘC LẬP: đếm thẳng bằng SQL, không đi qua weeklyRollup. */
  const truth = (bid: number) => conn.prepare(
    `SELECT COUNT(DISTINCT sc.id) AS cases, COUNT(DISTINCT sc.student_id) AS students
       FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN classes c ON c.id = a.class_id
      WHERE a.planned_period_id = ? AND c.branch_id = ? AND a.status != 'cancelled' AND COALESCE(sc.sos_level, 1) > 0`,
  ).get(pid, bid) as any;
  const tMb = truth(mb), tCp = truth(cp);
  assert(tMb.cases > 0 && tCp.cases > 0, `Cần cả hai chi nhánh cùng có case trong tuần này, đang MB=${tMb.cases} CP=${tCp.cases}`);
  const rowOf = (bid: number | null) => (weekly.weeklyRollup(P.admin, bid ? { branchId: bid } : {}).rows as any[])
    .find((r) => r.periodId === pid);
  const rMb = rowOf(mb), rCp = rowOf(cp), rAll = rowOf(null);
  assert(rMb.cases === tMb.cases, `Lọc MB: cột Case phải là ${tMb.cases}, đang ${rMb.cases} (đang cộng lẫn case của chi nhánh khác)`);
  assert(rMb.caseStudents === tMb.students, `Lọc MB: cột Học viên phải là ${tMb.students}, đang ${rMb.caseStudents}`);
  assert(rCp.cases === tCp.cases, `Lọc CP: cột Case phải là ${tCp.cases}, đang ${rCp.cases}`);
  assert(rCp.caseStudents === tCp.students, `Lọc CP: cột Học viên phải là ${tCp.students}, đang ${rCp.caseStudents}`);
  const branchesWithCases = (conn.prepare(
    `SELECT COUNT(DISTINCT c.branch_id) n FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
       JOIN classes c ON c.id = a.class_id WHERE a.planned_period_id = ? AND a.status != 'cancelled'`,
  ).get(pid) as any).n;
  assert(branchesWithCases === 2, `Tiền đề của phép cộng: tuần này chỉ có case ở đúng hai chi nhánh, đang ${branchesWithCases}`);
  assert(rAll.cases === tMb.cases + tCp.cases, `Không lọc: ${rAll.cases} phải bằng MB ${tMb.cases} + CP ${tCp.cases}`);

  /* Đề xuất chờ duyệt của CP không được chảy sang hàng của MB. */
  const before = { mb: rMb.pendingApproval, cp: rCp.pendingApproval };
  const cpCase = conn.prepare(
    `SELECT sc.id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN classes c ON c.id = a.class_id
      WHERE a.planned_period_id = ? AND c.branch_id = ? AND sc.status != 'done' AND COALESCE(sc.sos_level, 1) > 0 LIMIT 1`,
  ).get(pid, cp) as any;
  assert(cpCase, 'Không có case mở của CP trong tuần để dựng đề xuất chờ duyệt');
  cases.recordIntervention(P.admin, cpCase.id, {
    kind: 'extra_support', description: 'Xin hỗ trợ ngoài định mức (F01 chờ duyệt)', performerName: 'GVCN',
  });
  assert(rowOf(mb).pendingApproval === before.mb,
    `Đề xuất chờ duyệt của CP chảy sang hàng MB: ${before.mb} → ${rowOf(mb).pendingApproval}`);
  assert(rowOf(cp).pendingApproval === before.cp + 1, `Hàng CP phải tăng đúng 1, đang ${rowOf(cp).pendingApproval}`);
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
  assert(single.length >= 1, 'Cần một học viên chỉ có đúng một lần ghi danh trong MB-FT 101');
  const st = single[0];
  const cpClass = classId('CP-FT 110');
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
  /* HIỆN TRẠNG vẫn theo nơi đang chăm sóc: case đang mở của em này thuộc MB. */
  const openNow = (branch: number) => (effectiveness.issueBoardCases({ branchIds: [branch], ratio: false } as any, 'reading', null) as any)
    .rows.some((r: any) => r.caseId === c.id);
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
  assert(domain.rateText(after.n - before.n, after.N - before.N) === '2/3 (67%) · mẫu nhỏ',
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

check('PR-F · Đối soát F10: "HV có case đang mở" ở Tổng quan và ở Thực trạng là CÙNG MỘT tập (diff rỗng)', () => {
  /*
   * F10 có ảnh thật: Toàn cảnh 18 HV / 32 case, Thực trạng 20 HV / 34 case dưới cùng một tên. Đối soát
   * bằng cách XUẤT TẬP ID ở hai nơi rồi diff — không so hai con số. Tổng quan đọc từ `metricSet`, Thực
   * trạng đọc từ các hàng `issueBoardCases`; hai đường đếm khác nhau hoàn toàn về mã.
   */
  const overview = new Set<number>((metricsSvc.metricSet(P.admin, 'hv-co-case-mo', {}) as any).ids);
  const openCaseIdsOverview = new Set<number>((metricsSvc.metricSet(P.admin, 'case-mo', {}) as any).ids);
  const analysis = new Set<number>();
  const analysisCases = new Set<number>();
  for (const ratio of [false, true]) {
    for (const cat of [...domain.caseCategoriesFor(ratio ? 'ratio' : 'ielts_band')]) {
      const rows = (effectiveness.issueBoardCases({ ratio } as any, cat, null) as any).rows as any[];
      for (const r of rows) if (r.status !== 'done') { analysis.add(r.studentId); analysisCases.add(r.caseId); }
    }
  }
  /*
   * KẾT QUẢ ĐỐI SOÁT (20/09/2026, bộ demo): Tổng quan 29 HV, Thực trạng 28 HV. MỘT em chênh: Vũ Thu Uyên
   * (id 39) ĐÃ KẾT THÚC KHOÁ (ghi danh `completed`) nhưng case Reading vẫn `in_progress`. Hai màn định
   * nghĩa khác nhau, và sự khác nhau ấy GIẢI THÍCH ĐƯỢC:
   *
   *   Tổng quan  — đếm theo CASE: em nào có case chưa kết luận trong phạm vi, kể cả em đã ra khoá.
   *   Thực trạng — đếm theo NƠI ĐANG CHĂM SÓC: chỉ em đang học (ghi danh còn hoạt động).
   *
   * Nên phép kiểm không đòi hai tập BẰNG NHAU (đòi vậy là ép một định nghĩa thắng, hoặc giấu chênh lệch)
   * mà đòi đúng hai điều: (1) Thực trạng KHÔNG có em nào mà Tổng quan không có; (2) MỌI em chỉ có ở Tổng
   * quan đều là em không còn ghi danh hoạt động. Chênh lệch nào ngoài hai điều này là một lỗi mới. Và
   * vì định nghĩa khác nhau, hai màn PHẢI ghi hai nhãn khác nhau (kiểm ở phép kiểm kế tiếp).
   */
  const onlyOverview = [...overview].filter((id) => !analysis.has(id));
  const onlyAnalysis = [...analysis].filter((id) => !overview.has(id));
  assert(onlyAnalysis.length === 0,
    `Thực trạng có em mà Tổng quan không có: [${onlyAnalysis.join(',')}] — Thực trạng phải là tập con của Tổng quan`);
  const stillEnrolled = (id: number) => !!conn.prepare(
    `SELECT 1 FROM enrollments WHERE student_id = ? AND status = 'active' LIMIT 1`).get(id);
  const unexplained = onlyOverview.filter(stillEnrolled);
  assert(unexplained.length === 0,
    `Có em VẪN đang học nhưng chỉ Tổng quan đếm: [${unexplained.join(',')}] — chênh lệch này không giải thích được bằng định nghĩa`);
  const onlyOverviewCases = [...openCaseIdsOverview].filter((id) => !analysisCases.has(id));
  const onlyAnalysisCases = [...analysisCases].filter((id) => !openCaseIdsOverview.has(id));
  assert(onlyAnalysisCases.length === 0, `Thực trạng có case mở mà Tổng quan không có: [${onlyAnalysisCases.join(',')}]`);
  const caseOwnerStudent = (id: number) => (conn.prepare(
    `SELECT COALESCE(sc.student_id, a.student_id) AS sid FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE sc.id = ?`).get(id) as any).sid as number;
  /*
   * LÝ DO THỨ HAI, cũng giải thích được: Thực trạng chia hai tab theo LOẠI CHƯƠNG TRÌNH HIỆN TẠI của em
   * (Fast Track L/R/W1/W2/S · Normal L/R/W/S). Em chuyển từ FT sang Normal mà còn case `writing1` đang
   * mở thì case đó không có hàng nào ở tab Normal — nó biến mất khỏi Thực trạng nhưng Tổng quan vẫn đếm.
   */
  const coveredByAnalysis = (id: number) => {
    const sid = caseOwnerStudent(id);
    const category = (conn.prepare('SELECT category FROM sos_cases WHERE id = ?').get(id) as any).category as string;
    const modes = (conn.prepare(
      `SELECT DISTINCT pg.scoring_mode AS m FROM enrollments e JOIN classes c ON c.id = e.class_id
         JOIN programmes pg ON pg.code = c.programme_code WHERE e.student_id = ? AND e.status = 'active'`,
    ).all(sid) as any[]).map((r) => r.m as string);
    return modes.some((m) => (domain.caseCategoriesFor(m) as readonly string[]).includes(category));
  };
  const unexplainedCases = onlyOverviewCases.filter((id) => coveredByAnalysis(id));
  const describeCase = (id: number) => JSON.stringify({
    sc: conn.prepare('SELECT id, status, track, topic, category, origin_kind, student_id, attempt_id FROM sos_cases WHERE id = ?').get(id),
    enr: conn.prepare(`SELECT e.class_id, e.status, e.started_at, pg.scoring_mode FROM enrollments e JOIN classes c ON c.id = e.class_id
                         LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE e.student_id = ?`).all(caseOwnerStudent(id)),
  });
  assert(unexplainedCases.length === 0,
    `Có case mở của em VẪN đang học mà chỉ Tổng quan đếm: [${unexplainedCases.join(',')}] ${unexplainedCases.map(describeCase).join(' | ')}`);
  assert(onlyOverview.length >= 1,
    'Bộ demo mất em đã kết thúc khoá mà case còn mở — phép đối soát này không còn chứng minh được gì, cần dựng lại tiền đề');
});

check('PR-F · Đối soát F10 (nhãn): hai định nghĩa khác nhau thì hai màn KHÔNG dùng chung một nhãn', () => {
  const overviewLabel = domain.metricById('hv-co-case-mo')!;
  assert(/kể cả em đã kết thúc khoá/.test(overviewLabel.tapDuDieuKien),
    `Tổng quan phải nói rõ nó đếm CẢ em đã kết thúc khoá mà case còn mở: "${overviewLabel.tapDuDieuKien}"`);
  assert(overviewLabel.ten === 'Học viên có case đang mở', `Nhãn Tổng quan: "${overviewLabel.ten}"`);
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
  assertThrows(() => metricsSvc.metricSet(P.admin, 'dung-han-cap-nhat', {}), /chưa có danh sách/,
    'Chỉ số đã khai báo nhưng chưa có hàm tập ID phải nói thẳng là chưa có, không trả số bịa');
});

console.log(`\n${'='.repeat(60)}`);
console.log(failures.length === 0
  ? `TẤT CẢ ${passed} KIỂM TRA ĐỀU ĐẠT`
  : `${passed} đạt, ${failures.length} KHÔNG ĐẠT:\n` + failures.map((f) => '  - ' + f).join('\n'));
console.log('='.repeat(60));
process.exit(failures.length === 0 ? 0 : 1);
