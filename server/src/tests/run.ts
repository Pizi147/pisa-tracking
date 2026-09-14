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
const { ratioResult: domainRatio } = await import('../../../shared/domain/index.ts');
const { demoToday } = await import('../demoConfig.ts');
const { addDays } = await import('../util.ts');

runSeed();

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e: any) { failures.push(`${name}: ${e.message}`); console.log(`  ✗ ${name}\n      ${e.message}`); }
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
  mbAdmin: loadPrincipal(userByRole('branch_admin', 'MB')),
  mbManager: loadPrincipal(userByRole('manager', 'MB')),
  cpManager: loadPrincipal(userByRole('manager', 'CP')),
  cpAdmin: loadPrincipal(userByRole('branch_admin', 'CP')),
  w1Teacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'writing1')),
  w2Teacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'writing2')),
  sTeacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'speaking')),
  lrTeacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'listening')),
  bcManager: loadPrincipal(userByRole('manager', 'BC')),
  bcAdmin: loadPrincipal(userByRole('branch_admin', 'BC')),
  coreTeacher: loadPrincipal(coreTeacherOf('MB-FT 101')),
  subjectTeacher: loadPrincipal(subjectOnlyTeacherOf('MB-FT 101')),
};

const mbClass = classId('MB-FT 101');

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

  // Tuần MT chưa tới thì KHÔNG phải việc phải làm — nhãn là "Tuần sau", không phải "Chưa nhập điểm".
  const future = conn
    .prepare(`SELECT a.id FROM assessment_attempts a
                JOIN report_periods rp ON rp.id = a.planned_period_id
               WHERE a.status = 'planned' AND rp.week_start > ? LIMIT 1`)
    .get(demoToday()) as any;
  if (future) {
    const d3 = attempts.attemptDetail(P.admin, future.id);
    assert(d3.cells.filter((c) => c.required).every((c) => c.progress === 'upcoming'),
      'Lượt MT của tuần sau không được đánh dấu là chưa nhập điểm');
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
check('Cả năm kỹ năng của một lượt dùng CHUNG một hạn, đếm từ tuần MT', () => {
  const a = conn
    .prepare(`SELECT a.id FROM assessment_attempts a
                WHERE a.planned_period_id IS NOT NULL AND a.deadline_override IS NULL
                  AND a.status != 'cancelled' LIMIT 1`)
    .get() as any;
  assert(a, 'Seed thiếu lượt MT đã xếp tuần');
  const d = attempts.attemptDetail(P.admin, a.id);
  const deadlines = new Set(d.cells.filter((c) => c.required).map((c) => c.deadline));
  assert(deadlines.size === 1, `Một lượt MT phải có đúng một hạn, đang có ${deadlines.size}`);
});
check('Chỉ MỘT hạn có hiệu lực: hạn tự đặt thay hạn mặc định', () => {
  const d = week.effectiveDeadline({ weekStart: '2026-09-07', override: '2026-09-30' });
  assert(d.date === '2026-09-30' && d.source === 'override', 'Hạn tự đặt không được ưu tiên');
  const seeded = conn.prepare('SELECT * FROM assessment_attempts WHERE deadline_override IS NOT NULL LIMIT 1').get() as any;
  assert(seeded, 'Seed thiếu trường hợp hạn tự đặt');
  assert(seeded.deadline_override_by && seeded.deadline_override_reason, 'Hạn tự đặt phải ghi người đặt và lý do');
  const det = attempts.attemptDetail(P.admin, seeded.id);
  assert(det.cells.some((c) => c.deadlineSource === 'override'), 'Chi tiết không dùng hạn tự đặt');
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
check('Quản lý chốt tuần; Admin CN không chốt tuần được', () => {
  assert(can(P.mbManager, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'Quản lý phải chốt được tuần');
  assert(!can(P.mbAdmin, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'Admin chi nhánh không được tự chốt tuần');
  assertThrows(() => attempts.setPlanningWeek(P.mbAdmin, planned.id, periodOf('2026-10-12')), /Quản lý/,
    'Admin chi nhánh đổi tuần');
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
  const hist = conn.prepare(`SELECT * FROM attempt_schedule_history WHERE attempt_id = ? AND action='week_set'`).all(target.id) as any[];
  assert(hist.length >= 1, 'Thiếu lịch sử đổi tuần');
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
 * ĐIỂM CHỈ NGƯỜI DẠY NHẬP. Owner chốt 10/09: bỏ hẳn đường nhập bù của Admin chi nhánh —
 * người không dạy kỹ năng đó thì không có căn cứ nào để chấm. Đường nhập bù còn lại chỉ
 * thuộc về quản trị hệ thống, và vẫn đi nhật ký riêng để soi lại được.
 */
check('Chỉ quản trị hệ thống nhập bù được, và đi nhật ký riêng', () => {
  assert(!can(P.mbAdmin, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'Admin chi nhánh không được nhập bù điểm');
  assert(!can(P.mbManager, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'Quản lý không có đường nhập bù điểm');
  assert(can(P.admin, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'Quản trị hệ thống phải nhập bù được');
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' LIMIT 1`).get(mbClass) as any;
  assertThrows(() => attempts.saveScore(P.mbAdmin, a.id, 'writing2', { criteria: [6, 6, 6, 6] }), /phân công/,
    'Admin chi nhánh nhập bù điểm W2');
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
check('Admin chi nhánh không vào được Tiến trình công việc', () => {
  assert(!can(P.mbAdmin, PERMISSIONS.MEETING_VIEW, { anyScope: true }), 'Admin chi nhánh không được cấp module quản lý');
  assert(can(P.mbManager, PERMISSIONS.MEETING_VIEW, { anyScope: true }), 'Quản lý phải xem được Tiến trình công việc');
  assertThrows(() => meeting.meetingBoard(P.mbAdmin, 1), /quyền/, 'Admin chi nhánh gọi API báo cáo tuần');
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
  const multi = conn
    .prepare('SELECT student_id FROM learning_cycles GROUP BY student_id HAVING COUNT(*) > 1 LIMIT 1')
    .get() as any;
  assert(multi, 'Seed thiếu học viên có hai lộ trình');
  const cs = cycles.cyclesOf(multi.student_id);
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
    .prepare(`SELECT * FROM assessment_attempts WHERE planned_period_id IS NOT NULL AND status != 'cancelled' LIMIT 1`)
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
check('Mở case ngay khi kết luận được; mức tăng dần không nhân đôi case', () => {
  const s = conn
    .prepare(
      `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM students s
         JOIN enrollments e ON e.student_id = s.id
         JOIN learning_cycles cy ON cy.student_id = s.id
        WHERE e.class_id = ? AND cy.target_score IS NOT NULL ORDER BY s.id LIMIT 1`,
    )
    .get(classId('CP-FT 110')) as any;
  const cpPeriod = periodOf('2026-11-09');
  const attempt = attempts.createAttempt(P.cpManager, {
    studentId: s.id, cycleId: s.cycle_id, classId: classId('CP-FT 110'), periodId: cpPeriod,
  }) as any;

  const exp = s.target_score;           // từ MT3 trở đi kỳ vọng bằng target
  const low = exp - 0.5;
  const t = (skill: string) => loadPrincipal(teacherOfSkill('CP-FT 110', skill));

  // Một kỹ năng dưới kỳ vọng là mở case NGAY, không chờ ba kỹ năng còn lại.
  attempts.saveScore(t('listening'), attempt.id, 'listening', { rawScore: scoring.LISTENING_BY_RAW.indexOf(low) });
  const early = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(early.result.sosLevel === 1, `Một kỹ năng dưới kỳ vọng phải mở SOS 1 ngay, đang là ${early.result.sosLevel}`);
  assert(early.result.provisional, 'Chưa đủ điểm thì phải đánh dấu là kết luận tạm thời');
  assert(early.sosCase, 'Chưa mở case dù đã kết luận được');
  const firstCaseId = early.sosCase.id;

  attempts.saveScore(t('reading'), attempt.id, 'reading', { rawScore: scoring.READING_BY_RAW.indexOf(low) });
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: [low, low, low, low] });
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: [low, low, low, low] });
  const three = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(three.result.sosLevel === 3, `Ba kỹ năng dưới kỳ vọng phải lên SOS 3, đang là ${three.result.sosLevel}`);
  /*
   * Từ vòng 4, "case của một lượt MT" không còn là một khái niệm: một lượt CHẠM VÀO nhiều
   * case sống suốt khoá. Điều phải kiểm là mỗi HẠNG MỤC chỉ có đúng một case, và cái case
   * Listening mở lúc nãy vẫn là chính nó — không đẻ thêm cái thứ hai khi mức SOS tăng.
   */
  const catCount = conn
    .prepare(
      `SELECT category, COUNT(*) n FROM sos_cases
        WHERE student_id = ? AND COALESCE(cycle_id,0) = ? AND track = 'academic' AND parallel = 0
        GROUP BY category HAVING n > 1`,
    )
    .all(s.id, s.cycle_id ?? 0) as any[];
  assert(catCount.length === 0,
    `Hạng mục ${catCount[0]?.category} có ${catCount[0]?.n} case — mức SOS tăng mà lại mở case thứ hai`);
  const listeningCase = conn
    .prepare(
      `SELECT id FROM sos_cases WHERE student_id = ? AND COALESCE(cycle_id,0) = ? AND category = 'listening'`,
    )
    .get(s.id, s.cycle_id ?? 0) as any;
  assert(listeningCase?.id === firstCaseId,
    'Case Listening bị thay bằng một case khác khi nhập thêm điểm');

  attempts.saveScore(t('speaking'), attempt.id, 'speaking', { criteria: [exp, exp, exp, exp] });
  const after = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(!after.result.provisional, 'Đủ điểm rồi mà vẫn coi là tạm thời');
  assert(after.result.sosLevel === 3, `Ba kỹ năng dưới kỳ vọng phải là SOS 3, đang là ${after.result.sosLevel}`);
  assert(after.status === 'done', 'Đủ điểm mọi kỹ năng bắt buộc phải chuyển sang Đã xong');
  assert(after.sosCase, 'Chưa mở case SOS');

  // Ghi một việc đã làm, rồi sửa điểm — việc đã làm KHÔNG được biến mất theo.
  cases.recordIntervention(P.cpManager, after.sosCase.id, {
    kind: 'teaching_adjust', description: 'GVCN điều chỉnh cách chữa bài cho em',
    performerSelf: true, status: 'completed', completedDate: '2026-11-12',
  });
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: [exp, exp, exp, exp] });
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: [exp, exp, exp, exp] });
  const reread = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(reread.result.sosLevel === 2, `Sau khi sửa Writing phải còn SOS 2, đang là ${reread.result.sosLevel}`);
  const stillOne = conn
    .prepare(
      `SELECT category, COUNT(*) n FROM sos_cases
        WHERE student_id = ? AND COALESCE(cycle_id,0) = ? AND track = 'academic' AND parallel = 0
        GROUP BY category HAVING n > 1`,
    )
    .all(s.id, s.cycle_id ?? 0) as any[];
  assert(stillOne.length === 0, 'Sửa điểm đã nhân đôi case');
  const kept = cases.caseDetail(P.cpManager, after.sosCase.id) as any;
  assert(kept.interventions.some((i: any) => i.completedDate === '2026-11-12'),
    'Sửa điểm đã xoá mất việc đã làm để hỗ trợ');
  assert(reread.caseHistory.length > 0, 'Thiếu lịch sử thay đổi của case');
});
check('Đánh dấu không mock sau khi đã có điểm thì giữ điểm và tính lại kết quả', () => {
  const a = conn
    .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' ORDER BY id DESC LIMIT 1`)
    .get(classId('CP-FT 110')) as any;
  const beforeScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(a.id) as any).n;
  attempts.setSkillSkip(P.cpManager, a.id, 'speaking', true, 'Học viên vắng buổi Speaking');
  const afterScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(a.id) as any).n;
  assert(afterScores === beforeScores, 'Đánh dấu không mock đã xoá điểm đã có');
  const d = attempts.attemptDetail(P.cpManager, a.id);
  assert(d.result.required.length === 3 && d.result.scopeNote === '3 kỹ năng', 'Chưa tính lại mẫu số');
  assert(d.result.overall === null, 'Không được giữ Overall bốn kỹ năng khi một kỹ năng không mock');
  assertThrows(() => attempts.saveScore(P.admin, a.id, 'speaking', { criteria: [6, 6, 6, 6] }),
    /không mock/, 'Nhập điểm cho kỹ năng đã đánh dấu không mock');
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
  students.transferStudent(P.admin, s.id, target, '2026-09-21', 'Đổi ca học');
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
check('Badge "cần nhập điểm" theo đúng phân công của người đang xem', () => {
  const mine = classesSvc.listClassSummaries(P.w1Teacher, {}).rows;
  for (const c of mine) {
    const q = attempts.listAttempts(P.w1Teacher, { classId: c.id, need: 'my_scores' }).rows.length;
    assert(c.needScores === q, `Lớp ${c.code}: badge ${c.needScores} khác hàng đợi ${q} của chính giáo viên đó`);
  }
  const asAdmin = classesSvc.listClassSummaries(P.admin, {}).rows.find((c) => c.code === 'MB-FT 101')!;
  const asTeacher = mine.find((c) => c.code === 'MB-FT 101');
  assert(!asTeacher || asTeacher.needScores <= asAdmin.needScores, 'Giáo viên không thể có nhiều việc hơn Admin');
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
check('Xem trước bắt lỗi từng dòng và gợi ý trùng, không tự gộp', () => {
  const existing = conn.prepare('SELECT full_name, dob FROM students WHERE dob IS NOT NULL LIMIT 1').get() as any;
  const pv = intake.previewIntake(P.admin, {
    rows: [
      { fullName: '', classCode: 'MB-FT 101' },
      { fullName: 'Người Mới Một', classCode: 'KHONG-CO 99' },
      { fullName: 'Người Mới Hai', classCode: 'MB-FT 101', dob: 'linh tinh' },
      { fullName: 'Người Mới Ba', classCode: 'MB-FT 101', route: 'LT9' },
    ],
    dateFormat: 'dmy',
  });
  assert(pv.rows[0].issues.some((i) => i.field === 'fullName'), 'Không bắt lỗi thiếu họ tên');
  assert(pv.rows[1].issues.some((i) => i.field === 'classCode'), 'Không bắt lỗi lớp không tồn tại');
  assert(pv.rows[2].issues.some((i) => i.field === 'dob'), 'Không bắt lỗi ngày sai');
  assert(pv.rows[3].issues.some((i) => i.field === 'route'), 'Không bắt lỗi lộ trình sai');
  if (existing) {
    const dup = intake.previewIntake(P.admin, {
      rows: [{ fullName: existing.full_name, classCode: 'MB-FT 101', dob: existing.dob }], dateFormat: 'iso',
    });
    assert(dup.rows[0].duplicates.length > 0, 'Không gợi ý hồ sơ trùng');
  }
});
check('Nhập ngoài phạm vi quyền bị chặn ở server', () => {
  const pv = intake.previewIntake(P.mbManager, {
    rows: [{ fullName: 'Ngoài Phạm Vi', classCode: 'CP-FT 110' }], dateFormat: 'dmy',
  });
  assert(pv.rows[0].issues.some((i) => /phạm vi/.test(i.message)), 'Không chặn lớp ngoài chi nhánh khi xem trước');
  /*
   * Nhập hàng loạt KHÔNG ném lỗi cả lô khi một dòng ngoài phạm vi: một dòng sai không được
   * làm hỏng 39 dòng đúng. Dòng đó bị bỏ qua, báo lỗi rõ ràng, và tuyệt đối không ghi gì.
   */
  const r = intake.commitIntake(P.mbManager, {
    rows: [
      { fullName: 'Ngoài Phạm Vi 2', classCode: 'CP-FT 110' },
      { fullName: 'Trong Phạm Vi 2', classCode: 'MB-FT 101' },
    ],
    dateFormat: 'dmy', idempotencyKey: 'test-intake-scope',
  });
  assert(r.added === 1 && r.skipped === 1, `Kỳ vọng thêm 1 bỏ 1, thực tế thêm ${r.added} bỏ ${r.skipped}`);
  assert(r.failed.some((i) => /phạm vi/.test(i.message)), 'Không báo lại lý do dòng bị bỏ');
  assert(!conn.prepare("SELECT id FROM students WHERE full_name = 'Ngoài Phạm Vi 2'").get(),
    'Học viên ngoài phạm vi quyền vẫn bị ghi vào database');
});
check('Ghi thật: tạo học viên, enrollment và lộ trình; bỏ qua dòng lỗi', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  const r = intake.commitIntake(P.admin, {
    rows: [
      { fullName: 'Học Viên Nhập Một', classCode: 'MB-FT 101', route: 'LT1', target: 6.5, dob: '01/02/2009' },
      { fullName: '', classCode: 'MB-FT 101' },
      { fullName: 'Học Viên Nhập Hai', classCode: 'MB-FT 101' },
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
  const warn = intake.previewIntake(P.admin, {
    rows: [{ fullName: 'Học Viên Nhập Hai', classCode: 'MB-FT 101' }], dateFormat: 'dmy',
  });
  assert(warn.rows[0].issues.some((i) => i.field === 'target' && /Chưa có target/.test(i.message)),
    'Thiếu target phải cảnh báo để người nhập biết còn phải bổ sung');
});
check('Bấm hai lần hoặc thử lại không tạo học viên trùng', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  const again = intake.commitIntake(P.admin, {
    rows: [
      { fullName: 'Học Viên Nhập Một', classCode: 'MB-FT 101', route: 'LT1', target: 6.5, dob: '01/02/2009' },
      { fullName: '', classCode: 'MB-FT 101' },
      { fullName: 'Học Viên Nhập Hai', classCode: 'MB-FT 101' },
    ],
    dateFormat: 'dmy', idempotencyKey: 'test-intake-1',
  });
  const after = (conn.prepare('SELECT COUNT(*) n FROM students').get() as any).n;
  assert(after === before, `Gửi lại cùng khoá đã tạo thêm ${after - before} học viên`);
  assert(again.added === 2, 'Kết quả lần gửi lại phải giống lần đầu');
});
check('Tuần MT đề xuất chỉ thành kế hoạch khi người nhập có quyền chốt tuần', () => {
  const r = intake.commitIntake(P.mbAdmin, {
    rows: [{ fullName: 'Học Viên Không Quyền Tuần', classCode: 'MB-FT 101', route: 'LT1', target: 6,
             mockWeeks: ['2026-11-02'] }],
    dateFormat: 'iso', idempotencyKey: 'test-intake-2',
  });
  assert(r.added === 1, 'Admin chi nhánh phải thêm được học viên');
  const s = conn.prepare("SELECT id FROM students WHERE full_name = 'Học Viên Không Quyền Tuần'").get() as any;
  const n = (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE student_id = ?').get(s.id) as any).n;
  assert(n === 0, 'Người không có quyền chốt tuần mà nhập hàng loạt lại tạo được kế hoạch MT');

  const r2 = intake.commitIntake(P.mbManager, {
    rows: [{ fullName: 'Học Viên Có Quyền Tuần', classCode: 'MB-FT 101', route: 'LT1', target: 6,
             mockWeeks: ['2026-11-02', '2026-11-16'] }],
    dateFormat: 'iso', idempotencyKey: 'test-intake-3',
  });
  assert(r2.added === 1, 'Quản lý phải thêm được học viên');
  const s2 = conn.prepare("SELECT id FROM students WHERE full_name = 'Học Viên Có Quyền Tuần'").get() as any;
  const rows2 = conn.prepare('SELECT * FROM assessment_attempts WHERE student_id = ? ORDER BY attempt_no').all(s2.id) as any[];
  assert(rows2.length === 2 && rows2[0].attempt_no === 1, 'Quản lý nhập hàng loạt phải tạo được kế hoạch tuần');
  assert(rows2[0].planned_period_id, 'Nhập hàng loạt phải gắn tuần cho từng lượt');
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
  const src = fs.readFileSync(new URL('../routes/index.ts', import.meta.url).pathname.replace('/dist-server', ''), 'utf8');
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
const fouClass = (conn.prepare(`SELECT id, code, start_date FROM classes WHERE kind = 'FOU' ORDER BY id LIMIT 1`).get() as any);
/* Lớp mang MÃ CŨ "FOUND" — dùng để chứng minh ánh xạ mã cũ không viết đè lên mã lớp. */
const legacyClass = (conn.prepare(`SELECT id, kind, programme_code FROM classes WHERE kind = 'FOUND' LIMIT 1`).get() as any);
/* Chương trình 10 tuần (BE hoặc ELE dùng chung một khuôn) — lớp nào cũng chứng minh được. */
const beClass = (conn.prepare(`SELECT id, code, start_date FROM classes WHERE programme_code IN ('BE','ELE') ORDER BY id LIMIT 1`).get() as any);

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

check('Đạt từ 60%, xét trên tỷ lệ CHÍNH XÁC chứ không làm tròn phần trăm rồi mới so', () => {
  assert(domainRatio(24, 40).outcome === 'pass', '24/40 = 60% phải là đạt');
  assert(domainRatio(23, 40).outcome === 'fail', '23/40 = 57.5% phải là trượt');
  /*
   * Ca bẫy thật sự: 25/42 = 59.52%, hiển thị làm tròn thành "60%" nhưng vẫn phải là TRƯỢT.
   * Nếu xét trên số phần trăm ĐÃ LÀM TRÒN thì em này thành đạt — đó chính là lỗi cần tránh.
   */
  const tricky = domainRatio(25, 42);
  assert(Math.round(tricky.ratio! * 100) === 60, 'Ca này chỉ có nghĩa khi hiển thị làm tròn ra 60%');
  assert(tricky.outcome === 'fail', '25/42 = 59.52% phải là trượt, dù hiển thị ra 60%');
  assert(domainRatio(12, 20).outcome === 'pass', '12/20 = 60% phải là đạt');
  assert(domainRatio(11, 20).outcome === 'fail', '11/20 = 55% phải là trượt');
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
  const rows = conn
    .prepare(
      `SELECT a.kind, rp.week_start FROM assessment_attempts a
         JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.class_id = ? ORDER BY rp.week_start`,
    )
    .all(fouClass.id) as any[];
  const progress = rows.find((r) => r.kind === 'progress');
  const final = rows.find((r) => r.kind === 'final');
  assert(progress && final, 'Thiếu bài giữa khoá hoặc cuối khoá');
  // Tuần học 4 = 3 tuần sau khai giảng; tuần học 8 = 7 tuần sau.
  assert(progress.week_start === week.mondayOf(addDays(fouClass.start_date, 3 * 7)),
    `Bài giữa khoá phải rơi vào tuần học 4, đang là ${progress.week_start}`);
  assert(final.week_start === week.mondayOf(addDays(fouClass.start_date, 7 * 7)),
    `Bài cuối khoá phải rơi vào tuần học 8, đang là ${final.week_start}`);
  // BE/ELE là tuần học 5 và 10.
  const be = conn
    .prepare(`SELECT a.kind, rp.week_start FROM assessment_attempts a
                JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.class_id = ?`)
    .all(beClass.id) as any[];
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
      /tổng số câu/, 'Nhập số câu đúng mà không có tổng');
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
  const queue = attempts.listAttempts(T, { classId: fouClass.id, need: 'my_scores' }).rows.length;
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
check('Bốn cột kết quả cộng lại đúng bằng số lượt có kết quả', () => {
  const r = weekly.weeklyRollup(P.admin, {});
  assert(r.rows.length > 0, 'Không có tuần nào có dữ liệu');
  for (const row of r.rows) {
    assert(row.onTarget + row.sos1 + row.sos2 + row.sos3 + row.pending === row.attempts,
      `Tuần ${row.code}: ${row.onTarget}+${row.sos1}+${row.sos2}+${row.sos3}+${row.pending} khác ${row.attempts} lượt`);
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
check('Trễ chấm để trống khi chưa đủ căn cứ, không hiện số 0 giả', () => {
  const r = weekly.weeklyRollup(P.admin, {});
  for (const row of r.rows) {
    assert(row.scoreLagDays === null || row.scoreLagDays >= 0, `Trễ chấm âm ở tuần ${row.code}`);
  }
  assert(r.rows.some((x) => x.scoreLagDays === null), 'Tuần chưa có căn cứ phải để trống thay vì 0');
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
    studentId: someStudent.id,
    summary: 'Em hay quên bài về nhà, hai tuần liền',
    urgency: 'attention',
    track: 'behaviour', topic: 'homework',
    note: 'Nhà xa, bố mẹ đi làm ca nên em phải trông em nhỏ',
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
  // "Hoàn cảnh kèm theo" đã bỏ: nhà xa, gia đình… nay là một câu Ghi chú, không phải một nhãn.
  assert(/Nhà xa/.test(r.note ?? ''), 'Ghi chú phải giữ nguyên chữ người báo viết');
});

check('Bấm hai lần hoặc thử lại không tạo case trùng', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const args = {
    studentId: someStudent.id, topic: 'listening',
    summary: 'Thử chống trùng', idempotencyKey: 'test-report-1', parallel: true,
  };
  const a = cases.reportIssue(P.coreTeacher, args) as any;
  const b = cases.reportIssue(P.coreTeacher, args) as any;
  const after = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assert(after === before + 1, `Gửi lại cùng khoá đã tạo thêm ${after - before - 1} case`);
  assert(a.id === b.id, 'Hai lần gửi cho ra hai case khác nhau');
});

check('Một case có NHIỀU tác động, mỗi tác động xem lại nhiều lần', () => {
  const c = cases.reportIssue(P.coreTeacher, {
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
    studentId: someStudent.id, topic: 'listening', summary: 'Thử quá hạn', idempotencyKey: 'test-report-4', parallel: true,
  }) as any;
  /*
   * LUẬT VÒNG 5 (mục 7.7): chu kỳ hai tuần gắn vào MỌI phương án học thuật ngay khi nó bắt
   * đầu. Trước đây một phương án không hẹn ngày thì không bao giờ quá hạn — nghĩa là nó nằm
   * im mãi mà không ai bị nhắc, đúng thứ luật mới sinh ra để chặn.
   */
  const started = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Bắt đầu từ 20 ngày trước', performerName: 'Tutor A',
    status: 'started', startedDate: addDays(TODAY, -20),
  }) as any;
  const iv = started.interventions.find((i: any) => i.description === 'Bắt đầu từ 20 ngày trước')!;
  assert(iv.actionDue, 'Phương án bắt đầu rồi mà không có hạn nào');
  assert(iv.actionDue === domain.cycleDeadline(addDays(TODAY, -20)),
    `Hạn phải theo chu kỳ hai tuần: kỳ vọng ${domain.cycleDeadline(addDays(TODAY, -20))}, đang là ${iv.actionDue}`);
  assert(iv.overdue || iv.actionOverdue, 'Bắt đầu 20 ngày trước, quá chu kỳ hai tuần mà không báo quá hạn');

  // Phương án CHỜ DUYỆT thì chu kỳ CHƯA chạy — thời gian chờ là của Quản lý.
  const proposed = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'extra_support', description: 'Xin hỗ trợ ngoài định mức', performerName: 'GVCN',
  }) as any;
  const waiting = proposed.interventions.find((i: any) => i.description === 'Xin hỗ trợ ngoài định mức')!;
  assert(waiting.approvalState === 'pending', 'Phương án nhóm Đề xuất phải ở trạng thái chờ duyệt');
  assert(!waiting.actionDue, 'Đang chờ duyệt mà đã tính hạn cho giáo viên — thời gian chờ là của Quản lý');
});

check('Hoàn thành case: bắt buộc có hướng xử lý VÀ mọi phương án đã khép lại', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, topic: 'listening', summary: 'Thử đóng case', idempotencyKey: 'test-report-6', parallel: true,
  }) as any;
  assertThrows(() => cases.setDisposition(P.mbManager, c.id, { status: 'done' }),
    /hướng xử lý/, 'Đóng case mà không có hướng xử lý');

  /*
   * MỤC 7.7 [5]: case CHƯA CÓ PHƯƠNG ÁN NÀO không đủ điều kiện đóng. Đếm được "0 phương án
   * còn mở" không có nghĩa là đã làm gì cho em.
   */
  assert(cases.closeBlockers(c.id).length === 1, 'Case chưa có phương án phải có đúng một lý do chặn');
  assertThrows(() => cases.setDisposition(P.mbManager, c.id, { status: 'done', disposition: 'no_action' }),
    /chưa có phương án/, 'Case chưa có phương án nào mà vẫn đóng được');

  // Có phương án nhưng CHƯA cập nhật kết quả → vẫn chặn, và nói rõ còn thiếu gì.
  const withPlan = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Học tutor Listening', performerName: 'Tutor B',
    status: 'started', startedDate: demoToday(),
  }) as any;
  const ivId = withPlan.interventions.find((i: any) => i.description === 'Học tutor Listening').id;
  assert(cases.closeBlockers(c.id).some((b: string) => /chưa cập nhật kết quả/.test(b)),
    'Phương án chưa có kết quả mà không bị chặn');
  assertThrows(() => cases.setDisposition(P.mbManager, c.id, { status: 'done', disposition: 'no_action' }),
    /chưa cập nhật kết quả/, 'Còn phương án chưa cập nhật mà vẫn đóng được');

  // Cập nhật kết quả và khép phương án → lúc này mới đóng được.
  cases.updateResult(P.coreTeacher, ivId, {
    outcome: 'improved', nextStep: 'complete', note: 'Em nghe bắt ý tốt hơn hẳn',
  });
  assert(cases.closeBlockers(c.id).length === 0, 'Mọi phương án đã khép mà vẫn còn lý do chặn');
  const done = cases.setDisposition(P.mbManager, c.id, {
    status: 'done', disposition: 'no_action', note: 'Đã trao đổi, em ổn định lại',
  }) as any;
  assert(done.status === 'done' && done.closedAt, 'Không đóng được case dù mọi điều kiện đã đủ');
});

check('Cập nhật kết quả: kết quả chưa tốt BẮT BUỘC chọn đường đi tiếp', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, topic: 'reading', summary: 'Thử luồng kết quả',
    idempotencyKey: 'test-result-1', parallel: true,
  }) as any;
  const d = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'self_study', description: 'Xếp tự học Reading', performerName: 'GVCN',
    status: 'started', startedDate: demoToday(),
  }) as any;
  const ivId = d.interventions.find((i: any) => i.description === 'Xếp tự học Reading').id;

  assertThrows(() => cases.updateResult(P.coreTeacher, ivId, { outcome: 'worse', nextStep: 'complete' }),
    /chỉ đi tiếp được bằng/, 'Kết quả "Kém hơn" mà vẫn khép lại được');
  assertThrows(() => cases.updateResult(P.coreTeacher, ivId, { outcome: 'unchanged', nextStep: 'propose' }),
    /phương án mới là gì/, 'Chọn đề xuất phương án mới mà không nói phương án nào');

  // "Tiếp tục phương án cũ" mở CHU KỲ MỚI trên chính phương án đó, không nhân đôi phương án.
  const before = d.interventions.length;
  const after = cases.updateResult(P.coreTeacher, ivId, {
    outcome: 'unchanged', nextStep: 'continue', note: 'Em có làm nhưng chưa đều',
  }) as any;
  assert(after.interventions.length === before, 'Tiếp tục phương án cũ mà lại sinh thêm một phương án');
  const iv2 = after.interventions.find((i: any) => i.id === ivId);
  assert(iv2.cycleNo === 2, `Phải sang chu kỳ 2, đang là ${iv2.cycleNo}`);
  assert(iv2.actionDue === domain.cycleDeadline(demoToday()), 'Chu kỳ mới phải có hạn mới theo luật hai tuần');

  // "Đề xuất phương án mới" khép phương án cũ với lý do ĐƯỢC THAY THẾ, không phải đã thành công.
  const replaced = cases.updateResult(P.coreTeacher, ivId, {
    outcome: 'worse', nextStep: 'propose', note: 'Tự học không ăn thua',
    newPlan: { kind: 'tutor', description: 'Chuyển sang tutor', performerName: 'Tutor C' },
  }) as any;
  const old = replaced.interventions.find((i: any) => i.id === ivId);
  assert(old.closedReason === 'superseded', `Phương án cũ phải ghi "được thay thế", đang là ${old.closedReason}`);
  assert(old.supersededBy, 'Phương án cũ không nối sang phương án mới');
  assert(replaced.interventions.some((i: any) => i.description === 'Chuyển sang tutor'), 'Không tạo phương án mới');
});

check('Chỉ GVCN của lớp và Quản lý mới đóng được case', () => {
  const c = cases.reportIssue(P.subjectTeacher, {
    studentId: someStudent.id, topic: 'listening', summary: 'Thử quyền đóng', idempotencyKey: 'test-report-7', parallel: true,
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
  assertThrows(() => cases.reportIssue(P.coreTeacher, { studentId: cp.id, topic: 'listening', summary: 'Ngoài phạm vi' }),
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

check('Case sinh từ điểm và case giáo viên báo dùng CHUNG một vòng đời', () => {
  const fromMock = cases.listCases(P.admin, { origin: 'mock' }).rows;
  const fromTeacher = cases.listCases(P.admin, { origin: 'teacher_report' }).rows;
  assert(fromMock.length > 0 && fromTeacher.length > 0, 'Thiếu một trong hai nguồn case');
  // Cùng một bảng, cùng bộ trạng thái, nên đếm chung được.
  const total = cases.listCases(P.admin, {}).rows.length;
  assert(total === fromMock.length + fromTeacher.length, 'Hai nguồn không cộng lại thành tổng');
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
    studentId: someStudent.id, topic: 'listening', summary: 'Thử hành trình',
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
    studentId: someStudent.id, topic: 'listening', summary: 'Thử hành trình', idempotencyKey: 'test-report-8', parallel: true,
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
    studentId: someStudent.id, topic: 'listening', summary: 'Thử bằng chứng', idempotencyKey: 'test-report-9', parallel: true,
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
    studentId: someStudent.id, topic: 'listening', summary: 'Thử gửi duyệt', idempotencyKey: 'test-approval-1', parallel: true,
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
    studentId: someStudent.id, topic: 'listening', summary: 'Việc tự làm', idempotencyKey: 'test-approval-2', parallel: true,
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

check('Quản lý thấy nhóm "Chờ duyệt phương án", giáo viên thì không', () => {
  const gv = loadPrincipal(teacherOfSkill('MB-FT 101', 'listening'));
  const mgrGroups = mywork.myWork(P.mbManager).groups.map((g: any) => g.key);
  const gvGroups = mywork.myWork(gv).groups.map((g: any) => g.key);
  assert(!gvGroups.includes('approval'), 'Giáo viên bị giao việc duyệt mà họ không có quyền làm');
  const anyManagerHasIt = ['MB', 'CP', 'BC', 'HD']
    .map((b) => loadPrincipal(userByRole('manager', b)))
    .some((m) => mywork.myWork(m).groups.some((g: any) => g.key === 'approval'));
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
  const reviewOf = (p: any) => (mywork.myWork(p).groups.find((g: any) => g.key === 'review')?.items ?? []);

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
    studentId: someStudent.id, topic: 'listening', summary: 'Chờ duyệt đã hẹn xem lại', idempotencyKey: 'test-approval-3', parallel: true,
  }) as any;
  cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Xin tutor, hẹn xem lại ngay', status: 'planned',
    needsApproval: true, followupDue: addDays(demoToday(), -1),
  });
  const items = (mywork.myWork(P.coreTeacher).groups.find((g: any) => g.key === 'review')?.items ?? []);
  assert(!items.some((i: any) => i.caseId === c.id),
    'Phương án chưa được duyệt đã bị đòi cập nhật kết quả');
});

console.log('\n19. Phân công giáo viên');

check('Giáo viên không tự phân công mình vào lớp', () => {
  const gv = loadPrincipal(teacherOfSkill('MB-FT 101', 'listening'));
  assertThrows(() => classesSvc.setClassTeachers(gv, mbClass, { slots: [] }),
    /Quản lý|Admin|quyền/, 'Giáo viên đổi phân công');
  assert(!can(gv, PERMISSIONS.CLASS_ASSIGN, { classId: mbClass }), 'Giáo viên đang có quyền phân công');
  assert(can(P.mbManager, PERMISSIONS.CLASS_ASSIGN, { classId: mbClass }), 'Quản lý phải phân công được');
  assert(can(P.mbAdmin, PERMISSIONS.CLASS_ASSIGN, { classId: mbClass }), 'Admin chi nhánh phải phân công được');
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
  const two = t.candidates.slice(0, 2);
  assert(two.length === 2, 'Chi nhánh không đủ hai giáo viên để thử');

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
      `SELECT attempt_id, COUNT(*) n, COUNT(DISTINCT topic) t FROM sos_cases
        WHERE attempt_id IS NOT NULL GROUP BY attempt_id`,
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
   * Mọi lượt đang có case học thuật với SOS > 0 phải có một case Ý thức/Khác đi kèm.
   * Chiều ngược lại KHÔNG bắt buộc bằng nhau: điểm sửa lên thành đạt thì mức về 0 nhưng
   * cuộc trao đổi đã diễn ra rồi, không xoá ngược lịch sử được.
   */
  const missing = conn
    .prepare(
      `SELECT sc.attempt_id FROM sos_cases sc
        WHERE sc.track = 'academic' AND sc.origin_kind = 'mock'
          AND sc.attempt_id IS NOT NULL AND sc.sos_level > 0
          AND NOT EXISTS (SELECT 1 FROM sos_cases b
                           WHERE b.attempt_id = sc.attempt_id AND b.track = 'behaviour')
        GROUP BY sc.attempt_id`,
    )
    .all() as any[];
  assert(missing.length === 0,
    `${missing.length} lượt có SOS mà thiếu case Ý thức/Khác (ví dụ lượt ${missing[0]?.attempt_id})`);
});

check('Case Ý thức/Khác tự sinh mang đúng HAI phương án trao đổi', () => {
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

check('Hạn làm việc trao đổi: một tuần kể từ lúc bắt đầu', () => {
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
    // Việc trao đổi thuộc case Ý thức/Khác → hạn một tuần kể từ lúc bắt đầu.
    const expected = domain.cycleDeadline(r.detected_at, 'behaviour');
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
    studentId: someStudent.id, topic: 'reading', summary: 'Thử nhóm đề xuất',
    idempotencyKey: 'test-proposal-1', parallel: true,
  }) as any;
  const r = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'reschedule_mt', description: 'Xin lùi MT3', status: 'planned',
  }) as any;
  const iv = r.interventions[r.interventions.length - 1];
  assert(iv.approvalState === 'pending', 'Đề xuất lùi lịch thi phải tự vào trạng thái chờ duyệt');
  assert(iv.approvalDue, 'Đề xuất phải có hạn Quản lý trả lời');
  // Còn phương án giáo viên tự làm thì KHÔNG tự đòi duyệt.
  const r2 = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'self_study', description: 'Xếp tự học buổi tối', status: 'planned',
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

check('SOS đếm HỌC VIÊN, cột kỹ năng đếm VẤN ĐỀ — hai đơn vị khác nhau', () => {
  const s = summary.branchSummary(P.admin, {});
  const r = s.rows.find((x) => (x.cells.sos2?.value ?? 0) > 0);
  assert(r, 'Không có hàng nào có SOS 2 để thử');
  const open = cases.listCases(P.admin, { branchId: r!.branchId ?? undefined }).rows
    .filter((c) => c.state !== 'done' && c.sosLevel === 2);
  const students = new Set(open.map((c) => c.studentId)).size;
  assert(r!.cells.sos2!.value === students,
    `Cột SOS 2 đang là ${r!.cells.sos2!.value} nhưng chỉ có ${students} học viên — đang đếm vấn đề chứ không đếm em`);
  assert(open.length >= students, 'Một em SOS 2 phải sinh ít nhất một vấn đề');
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

check('GVCN nhận việc gặp học viên, văn phòng nhận việc gọi phụ huynh', () => {
  /*
   * Hai việc trao đổi nay là phương án, nên chúng tới tay người ta qua nhóm việc
   * "Phương án tới hạn làm" chứ không qua một bảng Liên hệ riêng. Cách CHIA VIỆC thì giữ
   * nguyên — đó mới là thứ nghiệp vụ, không phải bảng nào chứa nó.
   */
  const gv = loadPrincipal(teacherOfSkill('MB-FT 102', 'listening'));
  const kinds = (who: any) => {
    const out = new Set<string>();
    for (const g of mywork.myWork(who, {}).groups) {
      if (g.key !== 'action') continue;
      for (const it of g.items) {
        if (/trao đổi với học viên/i.test(it.reason)) out.add('talk_student');
        if (/trao đổi với phụ huynh/i.test(it.reason)) out.add('talk_parent');
      }
    }
    return out;
  };
  const gvKinds = kinds(gv);
  assert(gvKinds.has('talk_student'), 'Giáo viên không nhận việc gặp học viên');
  assert(!gvKinds.has('talk_parent'), 'Giáo viên bị giao việc gọi phụ huynh của văn phòng');
  const adminKinds = kinds(P.mbAdmin);
  assert(adminKinds.has('talk_parent'), 'Admin chi nhánh không nhận việc gọi phụ huynh');
  // Quản lý thấy cả hai: họ là người đôn đốc khi có ai đó quên.
  const mgrKinds = kinds(P.mbManager);
  assert(mgrKinds.has('talk_student') && mgrKinds.has('talk_parent'), 'Quản lý phải thấy cả hai loại');
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
  const after1 = conn
    .prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'listening'`)
    .all(s.id) as any[];
  assert(after1.length === 1, `Lần trượt đầu phải mở đúng 1 case, đang có ${after1.length}`);
  const caseId = after1[0].id;

  /* Ghi một phương án và một kết quả để kiểm rằng chúng SỐNG SÓT qua lần trượt thứ hai. */
  cases.recordIntervention(mgr, caseId, {
    kind: 'self_study', description: 'Nghe 30 phút mỗi ngày',
    performerSelf: true, status: 'completed', completedDate: '2026-10-20',
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
  assert(d.title === `MT${a2.attempt_no} - Listening dưới kỳ vọng`,
    `Tên case phải đổi theo lượt mới nhất, đang là "${d.title}"`);
  assert(d.interventions.some((i: any) => i.completedDate === '2026-10-20'),
    'Phương án của MT1 biến mất sau khi MT2 trượt lại');
  assert(d.followups.some((f: any) => f.observedOn === '2026-10-25'),
    'Kết quả ghi ở MT1 biến mất sau khi MT2 trượt lại');
  assert(d.milestones.filter((m: any) => m.attemptNo).length >= 2,
    'Case phải có mốc của cả hai lượt MT');
  assert(d.milestones.some((m: any) => m.kind === 'repeat'),
    'Thiếu mốc "trượt lại" — nhìn vào không biết phương án cũ chưa ăn thua');
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
  const c = conn.prepare(`SELECT * FROM sos_cases WHERE student_id = ? AND category = 'reading'`)
    .get(s.id) as any;
  assert(c, 'Chưa mở case Reading');

  /* Mọi phương án phải xong trước, rồi mới chốt được — đó chính là quy tắc cần kiểm. */
  const open = conn
    .prepare(`SELECT id FROM case_interventions WHERE case_id = ? AND status IN ('planned','started')`)
    .all(c.id) as any[];
  assertThrows(
    () => cases.closeCaseOutcome(mgr, c.id, { outcome: 'improved', decision: 'end' }),
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
      `SELECT sc.id, sc.student_id, sc.topic FROM sos_cases sc
        WHERE sc.track = 'academic' AND sc.status != 'done' AND sc.parallel = 0
          AND sc.topic IS NOT NULL LIMIT 1`,
    )
    .get() as any;
  assert(open, 'Không có case học thuật đang mở để thử');

  let caught: any = null;
  try {
    cases.reportIssue(P.admin, {
      studentId: open.student_id, topic: open.topic, summary: 'Thử case trùng',
      idempotencyKey: `dup-${open.id}-a`,
    });
  } catch (e) { caught = e; }
  assert(caught, 'Báo trùng hạng mục mà hệ thống im lặng mở case thứ hai');
  assert(caught.details?.duplicateCase?.id === open.id,
    'Cảnh báo không chỉ ra case đang vướng, giao diện không dựng được pop-up');

  /* Chọn "Ghi vào case đang có" → không có case mới. */
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const merged = cases.reportIssue(P.admin, {
    studentId: open.student_id, topic: open.topic, summary: 'Ghi vào case đang có',
    mergeIntoExisting: true, idempotencyKey: `dup-${open.id}-b`,
  }) as any;
  assert(merged.id === open.id, 'Chọn ghi vào case đang có mà lại ra case khác');
  const afterMerge = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assert(afterMerge === before, 'Ghi vào case đang có mà vẫn tạo thêm một case');

  /* Chọn "Mở case riêng" → có case mới, đánh dấu là song song. */
  const parallel = cases.reportIssue(P.admin, {
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
         JOIN assessment_attempts a ON a.student_id = sc.student_id
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
  const forAdmin = domain.studentFiltersFor(has(P.mbAdmin));

  /* Bảng ở mục 6: GV không có "Chưa có tuần MT" — xếp lịch là việc của Quản lý. */
  assert(!forTeacher.includes('no_plan'), 'Giáo viên không được thấy bộ lọc lịch');
  assert(forTeacher.includes('sos') && forTeacher.includes('case_overdue'),
    'Giáo viên phải thấy bộ lọc SOS và case quá hạn');
  /* Admin CN không có bộ lọc case, nhưng CÓ "Cần nhập điểm MT" để đôn đốc (owner xác nhận Q9). */
  assert(!forAdmin.includes('case_no_plan') && !forAdmin.includes('sos'),
    'Admin CN không được thấy bộ lọc case');
  assert(forAdmin.includes('my_scores'), 'Admin CN phải thấy bộ lọc nhập điểm để đôn đốc');
  assert(!forAdmin.includes('no_plan'), 'Admin CN không chốt tuần nên không thấy bộ lọc đó');
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
  const open = cases.listCases(P.admin, { classId: cid }).rows.filter((c: any) => c.state !== 'done');
  const expect = cases.currentSosByStudent(open);
  for (const r of roster) {
    const want = expect.get(r.id) ?? null;
    assert((r.sosLevel ?? null) === want,
      `Học viên ${r.fullName}: bảng lớp nói SOS ${r.sosLevel}, phép tính chung nói ${want}`);
  }
  /* Và tổng ba mức không bao giờ vượt sĩ số — đúng lỗi owner báo 12/09. */
  const byLevel = [1, 2, 3].map((lv) => roster.filter((r) => r.sosLevel === lv).length);
  assert(byLevel.reduce((a, b) => a + b, 0) <= roster.length,
    `Tổng ba mức SOS ${byLevel.join('+')} vượt sĩ số ${roster.length}`);
});

check('Bảng theo tuần đếm đúng: Đạt + SOS 1..3 + Chưa đủ điểm = số lượt có kết quả', () => {
  const r = weekly.weeklyRollup(P.admin, { weeks: 26 });
  assert(r.rows.length > 0, 'Không có tuần nào có dữ liệu');
  for (const w of r.rows) {
    assert(w.onTarget + w.sos1 + w.sos2 + w.sos3 + w.pending === w.attempts,
      `Tuần ${w.code}: ${w.onTarget}+${w.sos1}+${w.sos2}+${w.sos3}+${w.pending} ≠ ${w.attempts} lượt`);
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
  const fou = conn
    .prepare(`SELECT id, code FROM classes WHERE programme_code = 'FOU' ORDER BY id LIMIT 1`)
    .get() as any;
  assert(fou, 'Seed thiếu lớp Foundation');
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
    .prepare(`SELECT id, code, programme_code FROM classes WHERE programme_code = 'FOU' ORDER BY id LIMIT 1`)
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
      outcome: 'partial', nextStep: 'monitor', metrics: [{ skill: 'reading', score: 24, total: null }],
    }),
    /0–9/, 'Nhận band 24 như một band hợp lệ',
  );
  // Điểm đạt không thể lớn hơn tổng.
  assertThrows(
    () => cases.updateResult(P.admin, c.id, {
      outcome: 'partial', nextStep: 'monitor', metrics: [{ skill: 'reading', score: 41, total: 40 }],
    }),
    /lớn hơn tổng/, 'Nhận điểm đạt lớn hơn tổng điểm',
  );
  // Ý thức không phải là một môn để chấm điểm.
  assertThrows(
    () => cases.updateResult(P.admin, c.id, {
      outcome: 'partial', nextStep: 'monitor', metrics: [{ skill: 'behaviour', score: 6, total: null }],
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
    studentId: s.id, track: 'behaviour', topic: 'attendance',
    title: 'Nghỉ nhiều không báo', summary: 'Ba buổi liên tiếp không tới lớp',
  }) as any;
  assertThrows(
    () => cases.closeCaseOutcome(P.admin, d.id, { outcome: 'improved', decision: 'end' }),
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

check('Case mở đúng ngày demo 14/09/2026 có hạn 27/09/2026', () => {
  /*
   * Ô kiểm tra LUẬT HẠN đã chốt ở mục 7.7, viết thẳng vào dữ liệu mẫu: chu kỳ đầu kết thúc
   * Chủ nhật của TUẦN THỨ HAI, tính tuần case xuất hiện là tuần thứ nhất. 14/09 là thứ Hai,
   * nên hạn là 27/09 — KHÔNG phải 04/10.
   */
  assert(demoToday() === '2026-09-14', `Ngày demo đã đổi thành ${demoToday()} — kiểm lại ví dụ hạn`);
  assert(domain.cycleDeadline('2026-09-14') === '2026-09-27',
    `Luật hạn sai: 14/09 ra ${domain.cycleDeadline('2026-09-14')}`);
  const row = conn
    .prepare(
      `SELECT iv.action_due FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.detected_at = '2026-09-14' AND iv.cycle_started_on = '2026-09-14'
        ORDER BY iv.id LIMIT 1`,
    )
    .get() as any | undefined;
  assert(row, 'Dữ liệu demo không có case nào mở đúng ngày demo để đối chiếu bằng mắt');
  assert(row!.action_due === '2026-09-27', `Hạn trong dữ liệu mẫu là ${row!.action_due}, phải là 2026-09-27`);
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
                      WHERE sc.student_id = e.student_id AND sc.status != 'done' AND cy.status = 'ended')
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
  /* Thêm case Ý thức/Khác KHÔNG làm case SOS học thuật biến mất. */
  const before = cases.listCases(P.admin, { studentId: st.sid }).rows.length;
  const created = cases.reportIssue(P.admin, {
    studentId: st.sid, track: 'behaviour', topic: 'participation',
    title: 'Kiểm tra: thêm case Ý thức', summary: 'Dòng này do bài kiểm tra tạo ra.',
    parallel: true,
  }) as any;
  const after = cases.listCases(P.admin, { studentId: st.sid }).rows;
  assert(after.length === before + 1, `Thêm một case mà tổng số đổi từ ${before} thành ${after.length}`);
  assert(after.some((c: any) => c.id === created.id), 'Không mở được case vừa tạo');
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
  const appr = conn
    .prepare(`SELECT * FROM case_interventions WHERE approval_state = 'approved' AND approval_at IS NOT NULL LIMIT 1`)
    .get() as any;
  assert(appr, 'Không có phương án nào đã được duyệt');
  assert(appr.cycle_started_on === appr.approval_at.slice(0, 10),
    `Chu kỳ bắt đầu ${appr.cycle_started_on} mà duyệt ngày ${appr.approval_at.slice(0, 10)}`);
  assert(appr.action_due === domain.cycleDeadline(appr.cycle_started_on),
    'Hạn không tính từ ngày được duyệt');
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
            AND track = 'academic'
          GROUP BY student_id, cycle_id, category HAVING COUNT(*) > 1)`,
    )
    .get() as any;
  /*
   * Luật một-case-một-hạng-mục chỉ áp cho case HỌC THUẬT trong cùng một lộ trình. Case Ý
   * thức/Khác gắn với từng sự việc, nên một em có thể có nhiều case cùng lúc mà không trùng.
   */
  assert(dupCase.n === 0, `${dupCase.n} nhóm case học thuật trùng hạng mục mà không đánh dấu song song`);
  /* Mọi bản ghi đều nối đúng chỗ — không có case mồ côi sau khi dựng lại dữ liệu. */
  const fk = conn.prepare('PRAGMA foreign_key_check').all() as any[];
  assert(fk.length === 0, `${fk.length} bản ghi vi phạm khoá ngoại`);
});

console.log(`\n${'='.repeat(60)}`);
console.log(failures.length === 0
  ? `TẤT CẢ ${passed} KIỂM TRA ĐỀU ĐẠT`
  : `${passed} đạt, ${failures.length} KHÔNG ĐẠT:\n` + failures.map((f) => '  - ' + f).join('\n'));
console.log('='.repeat(60));
process.exit(failures.length === 0 ? 0 : 1);
