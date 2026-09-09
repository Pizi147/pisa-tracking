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
const { PERMISSIONS, expectationDelta } = await import('../../../shared/domain.ts');
const scoring = await import('../services/scoring.ts');
const week = await import('../services/week.ts');
const attempts = await import('../services/attempts.ts');
const cycles = await import('../services/cycles.ts');
const checkins = await import('../services/checkins.ts');
const profile = await import('../services/profile.ts');
const sos = await import('../services/sos.ts');
const students = await import('../services/students.ts');
const meeting = await import('../services/meeting.ts');
const dashboard = await import('../services/dashboard.ts');
const classesSvc = await import('../services/classes.ts');
const intake = await import('../services/intake.ts');
const planning = await import('../services/planning.ts');
const signals = await import('../services/signals.ts');
const regular = await import('../services/regular.ts');
const weekly = await import('../services/weekly.ts');
const cases = await import('../services/cases.ts');
const { ratioResult: domainRatio } = await import('../../../shared/domain.ts');
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
const periodOf = (weekStart: string) =>
  (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(weekStart) as any).id;

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
check('Seed có sẵn lượt đánh dấu không mock và lượt đã mock chưa nhập điểm', () => {
  const skip = conn.prepare('SELECT * FROM attempt_skill_skips LIMIT 1').get() as any;
  assert(skip, 'Seed thiếu trường hợp kỹ năng không mock');
  const d = attempts.attemptDetail(P.admin, skip.attempt_id);
  const cell = d.cells.find((c) => c.assessedSkill === skip.skill)!;
  assert(cell.progress === 'skipped' && !cell.required, 'Ô kỹ năng không mock hiển thị sai');
  assert(!cell.overdue && cell.deadline === null, 'Kỹ năng không mock không được tính thiếu điểm hay quá hạn');

  const performed = conn.prepare('SELECT * FROM assessment_scores WHERE taken_on IS NOT NULL AND band IS NULL LIMIT 1').get() as any;
  assert(performed, 'Seed thiếu trường hợp đã mock nhưng chưa nhập điểm');
  const d2 = attempts.attemptDetail(P.admin, performed.attempt_id);
  const c2 = d2.cells.find((c) => c.skill === performed.skill)!;
  assert(c2.progress === 'performed', `Đã mock chưa nhập điểm phải là "performed", đang là ${c2.progress}`);
  const notMocked = d2.cells.find((c) => c.required && c.band === null && !c.takenOn);
  assert(notMocked && notMocked.progress !== 'performed', 'Chưa mock phải khác đã mock chưa nhập điểm');
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
  assert(week.weekInfo('2026-09-28').code === 'W1 OCT', '28/09–04/10/2026 phải là W1 OCT');
  assert(week.weekInfo('2026-09-07').code === 'W2 SEP', '07/09–13/09/2026 phải là W2 SEP');
  assert(week.weekInfo('2027-01-01').code === 'W5 DEC', '01/01/2027 vẫn thuộc W5 DEC');
  assert(week.weekInfo('2027-01-04').code === 'W1 JAN', 'Tuần sau đó mới là W1 JAN');
});
check('Hạn mặc định là thứ Tư tuần kế tiếp, hết ngày mới quá hạn', () => {
  assert(week.defaultScoreDeadline('2026-09-13') === '2026-09-16', 'Mock 13/09 phải có hạn 16/09');
  assert(week.isOverdue('2026-09-16', '2026-09-16') === false, 'Trong ngày 16/09 chưa được tính quá hạn');
  assert(week.isOverdue('2026-09-16', '2026-09-17') === true, 'Sang 17/09 phải tính quá hạn');
});
check('Chưa có lịch thì KHÔNG có hạn, không dựng hạn giả', () => {
  assert(week.effectiveDeadline({ scheduledFor: null, override: null }).date === null, 'Chưa có lịch mà đã có hạn');
  assert(week.effectiveDeadline({ scheduledFor: null, override: null }).source === 'none', 'Nguồn hạn sai');
  const d = week.effectiveDeadline({ scheduledFor: '2026-09-13', override: null });
  assert(d.date === '2026-09-16' && d.source === 'default', 'Hạn mặc định sai');
});
check('Chỉ MỘT hạn có hiệu lực: hạn tự đặt thay hạn mặc định', () => {
  const d = week.effectiveDeadline({ scheduledFor: '2026-09-13', override: '2026-09-30' });
  assert(d.date === '2026-09-30' && d.source === 'override', 'Hạn tự đặt không được ưu tiên');
  const seeded = conn.prepare('SELECT * FROM assessment_attempts WHERE deadline_override IS NOT NULL LIMIT 1').get() as any;
  assert(seeded, 'Seed thiếu trường hợp hạn tự đặt');
  assert(seeded.deadline_override_by && seeded.deadline_override_reason, 'Hạn tự đặt phải ghi người đặt và lý do');
  const det = attempts.attemptDetail(P.admin, seeded.id);
  assert(det.cells.some((c) => c.deadlineSource === 'override'), 'Chi tiết không dùng hạn tự đặt');
});
check('Speaking khác ngày vẫn là CÙNG một lượt MT, hạn tính theo lịch của chính kỹ năng', () => {
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE speaking_scheduled_at IS NOT NULL LIMIT 1').get() as any;
  assert(a, 'Seed thiếu trường hợp Speaking khác ngày');
  const d = attempts.attemptDetail(P.admin, a.id);
  const s = d.cells.find((c) => c.skill === 'speaking')!;
  const l = d.cells.find((c) => c.skill === 'listening')!;
  assert(s.scheduledAt !== l.scheduledAt, 'Speaking phải có ngày riêng');
  assert(d.attemptNo && d.cells.length === 5, 'Không được tách thành hai lượt MT khác nhau');
});

// ==================================================================== 5

console.log('\n5. Quyền lịch: tuần và ngày là hai việc khác nhau');
const planned = conn
  .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='planned' AND lrw_scheduled_at IS NULL LIMIT 1`)
  .get(mbClass) as any;

check('Seed có lượt đã chốt tuần nhưng chưa có ngày', () => {
  assert(planned, 'Seed thiếu lượt đã có tuần mà chưa có ngày');
  assert(planned.planned_period_id, 'Lượt phải đã có tuần kế hoạch');
  assert(!planned.lrw_scheduled_at, 'Không được tự điền ngày khi mới chốt tuần');
});
check('Quản lý chốt tuần; Admin CN không chốt tuần được', () => {
  assert(can(P.mbManager, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'Quản lý phải chốt được tuần');
  assert(!can(P.mbAdmin, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'Admin chi nhánh không được tự chốt tuần');
  assertThrows(() => attempts.setPlanningWeek(P.mbAdmin, planned.id, periodOf('2026-10-12')), /Quản lý/,
    'Admin chi nhánh đổi tuần');
});
check('Admin CN và Quản lý đều cập nhật được ngày MT thực tế; lưu NGÀY, không lưu giờ', () => {
  // Lịch buổi học do bộ phận xếp lịch bố trí từ Chủ nhật tuần trước. Việc ở đây là ghi lại
  // ngày học viên thực sự làm bài — và khi em nghỉ phải dời thì Quản lý sửa được ngay.
  assert(can(P.mbAdmin, PERMISSIONS.SCHEDULE_DATE, { classId: mbClass }), 'Admin chi nhánh phải cập nhật được ngày');
  assert(can(P.mbManager, PERMISSIONS.SCHEDULE_DATE, { classId: mbClass }), 'Quản lý cũng phải cập nhật được ngày');
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(planned.planned_period_id) as any;
  attempts.setSchedule(P.mbAdmin, planned.id, { lrwAt: `${period.week_start} 18:00` });
  const after = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(planned.id) as any;
  assert(after.lrw_scheduled_at === period.week_start,
    `Giờ phải bị cắt bỏ, chỉ giữ ngày — thực tế lưu "${after.lrw_scheduled_at}"`);
  // Quản lý dời ngày khi học viên nghỉ.
  attempts.setSchedule(P.mbManager, planned.id, { lrwAt: period.week_end, reason: 'Học viên nghỉ, dời sang cuối tuần' });
  const moved = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(planned.id) as any;
  assert(moved.lrw_scheduled_at === period.week_end, 'Quản lý không dời được ngày');
  attempts.setSchedule(P.mbAdmin, planned.id, { lrwAt: period.week_start });
});
check('Ngày ngoài tuần đã duyệt bị từ chối, không âm thầm đổi tuần', () => {
  assertThrows(
    () => attempts.setSchedule(P.mbAdmin, planned.id, { lrwAt: '2026-12-25 18:00' }),
    /ngoài tuần/, 'Xếp ngày ngoài tuần kế hoạch',
  );
});
check('GVCN chỉ đọc lịch: API từ chối cả đổi tuần lẫn đổi ngày', () => {
  assert(!can(P.coreTeacher, PERMISSIONS.PLAN_WEEK, { classId: mbClass }), 'GVCN không được chốt tuần');
  assert(!can(P.coreTeacher, PERMISSIONS.SCHEDULE_DATE, { classId: mbClass }), 'GVCN không được chốt ngày');
  assertThrows(() => attempts.setPlanningWeek(P.coreTeacher, planned.id, periodOf('2026-10-12')), /quyền|Quản lý/, 'GVCN đổi tuần');
  assertThrows(() => attempts.setSchedule(P.coreTeacher, planned.id, { lrwAt: null }), /quyền|Admin/, 'GVCN đổi ngày');
  // Chủ nhiệm KHÔNG phải là quyền lịch: có phụ trách lớp cũng không đụng được ngày MT.
  assert(can(P.coreTeacher, PERMISSIONS.ATTEMPT_VIEW, { classId: mbClass }), 'GVCN vẫn phải xem được lịch');
});
check('GV Speaking cập nhật được ngày Speaking; GV L/R/W tuyệt đối không đụng ngày', () => {
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(planned.planned_period_id) as any;
  attempts.setSchedule(P.sTeacher, planned.id, { speakingAt: `${period.week_end} 09:00` });
  const after = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(planned.id) as any;
  assert(after.speaking_scheduled_at === period.week_end,
    `GV Speaking phải cập nhật được ngày Speaking, và chỉ lưu ngày — thực tế "${after.speaking_scheduled_at}"`);
  assertThrows(() => attempts.setSchedule(P.sTeacher, planned.id, { lrwAt: period.week_start }),
    /Admin chi nhánh|Quản lý/, 'GV Speaking đổi ngày buổi L/R/W');
  assertThrows(() => attempts.setSchedule(P.w1Teacher, planned.id, { speakingAt: period.week_end }),
    /Speaking/, 'GV Writing đổi ngày Speaking');
});
check('Nhập điểm KHÔNG kèm quyền sửa lịch: payload điểm không có trường lịch', () => {
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' LIMIT 1`).get(mbClass) as any;
  const before = conn.prepare('SELECT lrw_scheduled_at, speaking_scheduled_at FROM assessment_attempts WHERE id = ?').get(a.id) as any;
  attempts.saveScore(P.w1Teacher, a.id, 'writing1', { criteria: [6, 6, 6, 6] });
  const after = conn.prepare('SELECT lrw_scheduled_at, speaking_scheduled_at FROM assessment_attempts WHERE id = ?').get(a.id) as any;
  assert(before.lrw_scheduled_at === after.lrw_scheduled_at
      && before.speaking_scheduled_at === after.speaking_scheduled_at, 'Nhập điểm đã làm đổi lịch');
});
check('Đổi tuần khi ngày cũ nằm ngoài tuần mới thì bỏ ngày để xếp lại, không tự dịch bảy ngày', () => {
  const target = conn
    .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND lrw_scheduled_at IS NOT NULL AND status='planned' LIMIT 1`)
    .get(classId('HD-FT 302')) as any;
  assert(target, 'Seed thiếu lượt planned đã có ngày ở HD-FT 302');
  const hdManager = loadPrincipal(userByRole('manager', 'HD'));
  const r = attempts.setPlanningWeek(hdManager, target.id, periodOf('2026-11-02'), 'Dời sang tháng 11') as any;
  const after = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(target.id) as any;
  assert(r.droppedDates === true && after.lrw_scheduled_at === null, 'Ngày cũ ngoài tuần mới phải được bỏ để xếp lại');
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
check('Nhập bù ngoài phân công đi đường riêng và được ghi nhật ký khác', () => {
  assert(can(P.mbAdmin, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'Admin chi nhánh phải nhập bù được');
  assert(!can(P.mbManager, PERMISSIONS.SCORE_OVERRIDE, { classId: mbClass }), 'Quản lý không có đường nhập bù điểm');
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' LIMIT 1`).get(mbClass) as any;
  attempts.saveScore(P.mbAdmin, a.id, 'writing2', { criteria: [6, 6, 6, 6] });
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
  // Dữ liệu xác nhận cũ vẫn phải tra lại được, không bị xoá theo.
  const old = conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE head_confirmed_at IS NOT NULL').get() as any;
  assert(old.n > 0, 'Lịch sử xác nhận cũ phải được giữ lại để tra cứu');
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
    studentId: s.student_id, route: 'LT2', targetScore: 7.5, examDate: '2027-05-08', startedAt: '2026-09-23',
  }) as any;
  const a = attempts.createAttempt(P.admin, {
    studentId: s.student_id, cycleId: created.id, periodId: periodOf('2026-11-02'),
  }) as any;
  assert(a.attempt_no === 1, 'Lộ trình mới phải bắt đầu từ MT1 dù học viên đã có MT1 ở lộ trình cũ');
  assert(a.target_at_attempt === 7.5, 'Lượt mới phải chốt target của lộ trình mới');
  assert(!a.lrw_scheduled_at, 'Tạo lượt chỉ chốt tuần, chưa có ngày');
});

// ==================================================================== 8

console.log('\n8. Ghi nhận nhanh của giáo viên');
check('Ghi nhận là dữ liệu riêng, không ghi đè điểm chính thức', () => {
  const row = conn.prepare('SELECT * FROM skill_checkins LIMIT 1').get() as any;
  assert(row, 'Seed thiếu ghi nhận của giáo viên');
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE student_id = ? AND status='done' LIMIT 1`)
    .get(row.student_id) as any;
  if (a) {
    const before = conn.prepare('SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(a.id, row.skill) as any;
    const teacher = loadPrincipal(row.author_user_id);
    checkins.saveCheckin(teacher, {
      studentId: row.student_id, skill: row.skill, band: 8, basis: 'judgement', observedOn: TODAY,
    });
    const after = conn.prepare('SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(a.id, row.skill) as any;
    assert(JSON.stringify(before) === JSON.stringify(after), 'Lưu ghi nhận đã làm đổi điểm chính thức');
  }
});
check('Ghi nhận ĐỊNH TÍNH không cần điểm — nhận định bằng lời là đủ', () => {
  const s = conn
    .prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id WHERE e.class_id=? LIMIT 1`)
    .get(mbClass) as any;
  const k = checkins.saveCheckin(P.sTeacher, {
    studentId: s.id, skill: 'speaking',
    judgement: 'Part 2 nói đủ thời gian, còn ngập ngừng khi đổi chủ đề.',
  }) as any;
  assert(k.band === null, 'Ghi nhận bằng lời mà hệ thống lại tự dựng ra một band');
  assert(k.judgement, 'Mất nội dung nhận định');
  // Nhưng một dòng trống rỗng thì vô nghĩa: không nhận định, không điểm.
  assertThrows(() => checkins.saveCheckin(P.sTeacher, { studentId: s.id, skill: 'speaking' }),
    /nhận định|điểm ước lượng/, 'Ghi nhận rỗng vẫn lưu được');
});
check('Mỗi lần ghi nhận là một dòng mới nên có sẵn lịch sử', () => {
  const row = conn.prepare('SELECT * FROM skill_checkins ORDER BY id DESC LIMIT 1').get() as any;
  const hist = checkins.checkinHistory(P.admin, row.student_id, { skill: row.skill });
  assert(hist.length >= 2, 'Ghi nhận mới phải tạo dòng mới, không ghi đè');
  assert(hist[0].observedOn >= hist[1].observedOn, 'Lịch sử phải sắp theo ngày quan sát');
  assert(hist[0].authorName, 'Thiếu người ghi nhận');
});
check('So sánh ghi rõ ngày, nguồn và căn cứ của cả hai phía', () => {
  const row = conn.prepare('SELECT * FROM skill_checkins WHERE band IS NOT NULL ORDER BY id DESC LIMIT 1').get() as any;
  const cmp = checkins.compareCheckins(P.admin, row.student_id);
  const one = cmp.find((c) => c.checkin && c.checkin.band !== null && c.official);
  assert(one, 'Không tìm được cặp Ghi nhận ↔ điểm chính thức để so');
  assert(one!.checkin!.on && one!.official!.source, 'Thiếu ngày ghi nhận hoặc nguồn điểm chính thức');
  // Δ chỉ là khoảng cách hai con số, không phải một kết luận tốt/xấu.
  assert(one!.delta === Math.round((one!.official!.band - one!.checkin!.band!) * 10) / 10,
    'Chênh lệch phải là điểm chính thức trừ ghi nhận');
  // Nguồn điểm không nhắc lại lộ trình: cột Target ngay cạnh đã nói rồi.
  assert(!/LT[12]/.test(one!.official!.source), `Nguồn điểm còn nhắc lại lộ trình: "${one!.official!.source}"`);
  // Ghi nhận bằng lời KHÔNG bị quy ra số để trừ.
  for (const c of cmp) {
    if (c.checkin && c.checkin.band === null) assert(c.delta === null, 'Nhận định bằng lời bị quy ra số để so');
  }
});
check('Có căn cứ thì nhập giống điểm chính thức: raw/40 cho L/R, bốn tiêu chí cho W/S', () => {
  const s = conn
    .prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id WHERE e.class_id=? LIMIT 1`)
    .get(mbClass) as any;
  // L/R: nhập số câu đúng, hệ thống tự quy ra band.
  const l = checkins.saveCheckin(P.lrTeacher, { studentId: s.id, skill: 'listening', basis: 'raw', raw: 30 }) as any;
  assert(l.raw === 30 && l.band === scoring.bandFromRaw('listening', 30),
    `Band phải quy từ raw, thực tế raw=${l.raw} band=${l.band}`);
  assert(l.basis === 'raw', 'Phải ghi rõ căn cứ là bài làm, không phải nhận định');
  // W/S: nhập bốn tiêu chí, hệ thống tự tính band.
  const w = checkins.saveCheckin(P.w1Teacher, {
    studentId: s.id, skill: 'writing1', basis: 'criteria', criteria: [6, 6, 5.5, 6],
  }) as any;
  assert(w.criteria![0] === 6 && w.band === scoring.bandFromCriteria([6, 6, 5.5, 6]),
    `Band Writing phải tính từ bốn tiêu chí, thực tế band=${w.band}`);
  // Thiếu tiêu chí thì KHÔNG được đoán ra một band.
  assertThrows(() => checkins.saveCheckin(P.w1Teacher, {
    studentId: s.id, skill: 'writing1', basis: 'criteria', criteria: [6, 6, null, null],
  }), /bốn tiêu chí/, 'Thiếu tiêu chí mà vẫn tính ra band');
  assertThrows(() => checkins.saveCheckin(P.lrTeacher, { studentId: s.id, skill: 'listening', basis: 'raw', raw: 45 }),
    /0 đến 40/, 'Raw ngoài thang 40');
});
check('Giáo viên chỉ ghi nhận được kỹ năng mình phụ trách', () => {
  const s = conn
    .prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id WHERE e.class_id=? LIMIT 1`)
    .get(mbClass) as any;
  assertThrows(() => checkins.saveCheckin(P.w1Teacher, { studentId: s.id, skill: 'speaking', band: 7 }),
    /phân công/, 'GV W1 ghi nhận Speaking');
  const ok = checkins.saveCheckin(P.w1Teacher, { studentId: s.id, skill: 'writing1', band: 6.5 }) as any;
  assert(ok.band === 6.5, 'GV W1 phải ghi nhận được W1');
  assert(ok.basis === 'judgement', 'Band gõ thẳng phải được đánh dấu là NHẬN ĐỊNH, không phải số đo');
});
check('Ghi bù chọn đúng lộ trình của NGÀY QUAN SÁT, không phải lộ trình hôm nay', () => {
  const row = conn
    .prepare(
      `SELECT c1.student_id AS sid, c1.id AS old_id, c1.started_at AS old_start, c2.id AS new_id,
              (SELECT ta.user_id FROM enrollments e
                 JOIN teacher_assignments ta ON ta.class_id = e.class_id
                WHERE e.student_id = c1.student_id AND e.status='active'
                  AND ta.skill = 'listening' AND ta.status='active' LIMIT 1) AS teacher_id
         FROM learning_cycles c1 JOIN learning_cycles c2
              ON c2.student_id = c1.student_id AND c2.seq = c1.seq + 1
        WHERE c1.ended_at IS NOT NULL AND c1.started_at < c1.ended_at LIMIT 1`,
    )
    .get() as any;
  if (!row?.teacher_id) return;           // dữ liệu mẫu chưa có em nào sang lộ trình thứ hai
  const k = checkins.saveCheckin(loadPrincipal(row.teacher_id), {
    studentId: row.sid, skill: 'listening', judgement: 'Ghi bù buổi của lộ trình trước',
    observedOn: row.old_start,
  }) as any;
  assert(k.cycleId === row.old_id,
    `Ghi bù bị gán vào lộ trình ${k.cycleId}, đáng lẽ phải là lộ trình ${row.old_id} đang chạy hôm đó`);
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
check('Tuần kết quả là tuần KẾ HOẠCH, lượt lệch tuần không bị đếm hai lần', () => {
  const split = conn.prepare('SELECT * FROM assessment_attempts WHERE speaking_scheduled_at IS NOT NULL LIMIT 1').get() as any;
  const periods = week.listPeriods(40);
  let seen = 0;
  for (const per of periods) {
    if (attempts.listAttempts(P.admin, { periodId: per.id }).rows.some((r) => r.id === split.id)) seen += 1;
  }
  assert(seen === 1, `Lượt lệch tuần xuất hiện ở ${seen} tuần, phải đúng một tuần`);
  const rows = attempts.listAttempts(P.admin, { periodId: split.planned_period_id }).rows;
  assert(rows.some((r) => r.id === split.id), 'Lượt phải thuộc tuần kế hoạch của chính nó');
});
check('Phân biệt lịch, đã xong, học viên duy nhất và lượt chưa có ngày', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  assert(o.kpis.week.scheduled >= o.kpis.week.done, 'Số đã xong không thể lớn hơn số có lịch');
  assert(o.kpis.week.uniqueStudents <= o.kpis.week.scheduled, 'Học viên duy nhất phải ≤ số lượt');
  assert(typeof o.kpis.week.needsDate === 'number', 'Thiếu số lượt chưa có ngày');
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
  assert(attempts.listAttempts(P.admin, { need: 'needs_date', periodId: currentPeriod.id }).rows.length === o.kpis.week.needsDate,
    'Bộ lọc chưa có ngày lệch KPI');
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
    .get(classId('CP-FT 111')) as any;
  const cpPeriod = periodOf('2026-11-09');
  const attempt = attempts.createAttempt(P.cpManager, {
    studentId: s.id, cycleId: s.cycle_id, classId: classId('CP-FT 111'), periodId: cpPeriod,
  }) as any;
  attempts.setSchedule(P.cpAdmin, attempt.id, { lrwAt: '2026-11-09' });

  const exp = s.target_score;           // từ MT3 trở đi kỳ vọng bằng target
  const low = exp - 0.5;
  const t = (skill: string) => loadPrincipal(teacherOfSkill('CP-FT 111', skill));

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
  assert(three.sosCase.id === firstCaseId, 'Mức SOS tăng mà lại mở case thứ hai');

  attempts.saveScore(t('speaking'), attempt.id, 'speaking', { criteria: [exp, exp, exp, exp] });
  const after = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(!after.result.provisional, 'Đủ điểm rồi mà vẫn coi là tạm thời');
  assert(after.result.sosLevel === 3, `Ba kỹ năng dưới kỳ vọng phải là SOS 3, đang là ${after.result.sosLevel}`);
  assert(after.status === 'done', 'Đủ điểm mọi kỹ năng bắt buộc phải chuyển sang Đã xong');
  assert(after.sosCase, 'Chưa mở case SOS');

  sos.updateCase(P.cpManager, after.sosCase.id, {
    talk_student_person: 'GVCN Thu Trang', talk_student_date: '2026-11-12', status: 'in_progress',
  });
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: [exp, exp, exp, exp] });
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: [exp, exp, exp, exp] });
  const reread = attempts.attemptDetail(P.cpManager, attempt.id);
  assert(reread.result.sosLevel === 2, `Sau khi sửa Writing phải còn SOS 2, đang là ${reread.result.sosLevel}`);
  assert(reread.sosCase.id === after.sosCase.id, 'Sửa điểm đã nhân đôi case');
  assert(reread.sosCase.talk_student_date === '2026-11-12', 'Sửa điểm đã xoá ghi nhận xử lý');
  assert(reread.caseHistory.length > 0, 'Thiếu lịch sử thay đổi của case');
});
check('Đánh dấu không mock sau khi đã có điểm thì giữ điểm và tính lại kết quả', () => {
  const a = conn
    .prepare(`SELECT * FROM assessment_attempts WHERE class_id = ? AND status='done' ORDER BY id DESC LIMIT 1`)
    .get(classId('CP-FT 111')) as any;
  const beforeScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(a.id) as any).n;
  attempts.setSkillSkip(P.cpManager, a.id, 'speaking', true, 'Học viên vắng buổi Speaking');
  const afterScores = (conn.prepare('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?').get(a.id) as any).n;
  assert(afterScores === beforeScores, 'Đánh dấu không mock đã xoá điểm đã có');
  const d = attempts.attemptDetail(P.cpManager, a.id);
  assert(d.result.required.length === 3 && d.result.scopeNote === '3 kỹ năng', 'Chưa tính lại mẫu số');
  assert(d.result.overall === null, 'Không được giữ Overall bốn kỹ năng khi một kỹ năng không mock');
  assertThrows(() => attempts.saveScore(P.cpAdmin, a.id, 'speaking', { criteria: [6, 6, 6, 6] }),
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
  const target = classId('BC-BE 80');
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
    const dates = attempts.listAttempts(P.admin, { classId: c.id, need: 'needs_date' }).rows.length;
    assert(c.needsDate === dates, `Lớp ${c.code}: badge cần cập nhật ngày ${c.needsDate} khác danh sách ${dates}`);
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
  assert(!rows2[0].lrw_scheduled_at, 'Nhập hàng loạt chỉ chốt tuần, không tự điền ngày');
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
check('Cập nhật ngày MT hàng loạt: một dòng lỗi không làm hỏng cả lô', () => {
  const rows = conn
    .prepare(
      `SELECT a.id, rp.week_start FROM assessment_attempts a
         JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.class_id = ? AND a.status='planned' LIMIT 3`,
    )
    .all(mbClass) as any[];
  assert(rows.length >= 2, 'Cần ít nhất hai lượt đã có tuần để thử');
  const sameWeek = rows.filter((r) => r.week_start === rows[0].week_start);
  const r = planning.bulkSetDate(P.mbAdmin, {
    attemptIds: rows.map((x) => x.id), lrwAt: rows[0].week_start,
  });
  assert(r.done === sameWeek.length,
    `Chỉ những lượt có tuần chứa ngày đó mới được cập nhật: kỳ vọng ${sameWeek.length}, thực tế ${r.done}`);
  assert(r.done + r.failed.length === rows.length, 'Mọi dòng phải có kết quả rõ ràng');
  for (const f of r.failed) assert(/ngoài tuần/.test(f.message), `Lý do lỗi phải nói rõ: ${f.message}`);
  const saved = conn.prepare('SELECT lrw_scheduled_at FROM assessment_attempts WHERE id = ?').get(rows[0].id) as any;
  assert(saved.lrw_scheduled_at === rows[0].week_start, 'Ngày hàng loạt phải lưu đúng, và chỉ ngày');
});
check('Giáo viên không được cập nhật ngày hàng loạt', () => {
  const a = conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id=? AND status='planned' LIMIT 1`).get(mbClass) as any;
  const r = planning.bulkSetDate(P.w1Teacher, { attemptIds: [a.id], lrwAt: null });
  assert(r.done === 0 && r.failed.length === 1, 'Giáo viên W1 vẫn cập nhật được ngày hàng loạt');
});
check('"Cần cập nhật ngày" chỉ tính khi ĐÃ ĐẾN tuần MT, không tính MT còn xa', () => {
  const q = planning.dateDutyQueue(P.mbAdmin, {});
  const today = demoToday();
  // Dữ liệu mẫu phải có sẵn cả hai nhóm, nếu không màn này chỉ là một khung rỗng.
  assert(q.thisWeekCount > 0, 'Dữ liệu mẫu thiếu MT tuần này chưa có ngày');
  const wide = planning.dateDutyQueue(P.admin, {});
  assert(wide.overdueCount > 0, 'Dữ liệu mẫu thiếu MT tuần trước còn quá hạn');
  // MT của các tuần sau tuyệt đối không được lọt vào danh sách việc.
  const future = (conn.prepare(
    `SELECT COUNT(*) n FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
      WHERE a.status='planned' AND a.lrw_scheduled_at IS NULL AND rp.week_start > ?`,
  ).get(today) as any).n;
  assert(future > 0, 'Dữ liệu mẫu cần có MT tương lai chưa có ngày để chứng minh nó bị loại');
  assert(!wide.rows.some((r) => r.weekStart > today), 'MT tuần sau vẫn bị đưa vào việc cần làm');
  for (const r of q.rows) {
    assert(r.weekStart <= today, `MT ${r.periodCode} chưa tới tuần mà đã bị đưa vào việc cần làm`);
  }
  assert(q.rows.every((r) => r.overdue === (r.weekEnd < today)), 'Cờ quá hạn không khớp với tuần đã qua');
  assert(q.overdueCount + q.thisWeekCount === q.rows.length, 'Hai nhóm phải phủ hết danh sách');
});
check('Đường dẫn cố định của /attempts đứng TRƯỚC /attempts/:id', () => {
  /*
   * Express khớp route theo thứ tự khai báo. Đặt "no-plan" và "date-duty" sau `:id` thì
   * chúng bị nuốt và request đi vào hàm chi tiết với một id không phải số.
   */
  const src = fs.readFileSync(new URL('../routes/index.ts', import.meta.url).pathname.replace('/dist-server', ''), 'utf8');
  const byId = src.indexOf("api.get('/attempts/:id'");
  for (const fixed of ["api.get('/attempts/date-duty'", "api.get('/attempts/no-plan'"]) {
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
check('Tín hiệu chia đúng việc cho đúng vai: tuần MT là của Quản lý, ngày là của Admin CN', () => {
  const a = signals.signalsFor(P.admin, {});
  const noPlan = a.find((x) => x.kind === 'no_plan');
  const needDate = a.find((x) => x.kind === 'need_date' || x.kind === 'date_overdue');
  if (noPlan) assert(noPlan.owner === 'manager', 'Chưa có tuần MT phải là việc của Quản lý');
  if (needDate) assert(needDate.owner === 'branch_admin', 'Cập nhật ngày phải là việc của Admin chi nhánh');
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
const fouClass = (conn.prepare(`SELECT id, code, start_date FROM classes WHERE programme_code = 'FOU' LIMIT 1`).get() as any);
const beClass = (conn.prepare(`SELECT id, code, start_date FROM classes WHERE programme_code = 'BE' LIMIT 1`).get() as any);

check('Chương trình nằm trong dữ liệu, mã cũ FOUND ánh xạ về FOU mà không đổi mã lớp', () => {
  const fou = regular.programmeByCode('FOU');
  assert(fou && fou.weeks === 8, 'Foundation phải là khoá 8 tuần');
  assert(JSON.stringify(fou!.skills) === JSON.stringify(['listening', 'reading', 'prep_writing', 'pronunciation']),
    `Kỹ năng Foundation sai: ${fou!.skills.join(', ')}`);
  assert(JSON.stringify(fou!.checkpoints) === JSON.stringify([{ kind: 'progress', studyWeek: 4 }, { kind: 'final', studyWeek: 8 }]),
    'Mốc kiểm tra Foundation phải là tuần học 4 và 8');
  const be = regular.programmeByCode('BE');
  assert(be && be.weeks === 10 && be.skills.includes('speaking') && !be.skills.includes('pronunciation'),
    'Beginner phải 10 tuần và có Speaking thay cho Pronunciation');
  assert(JSON.stringify(be!.checkpoints.map((c: any) => c.studyWeek)) === '[5,10]', 'Mốc BE phải là tuần học 5 và 10');
  // Mã cũ chỉ được ÁNH XẠ khi đọc, không được viết đè lên mã lớp lịch sử.
  const cls = conn.prepare('SELECT kind, programme_code FROM classes WHERE id = ?').get(fouClass.id) as any;
  assert(cls.kind === 'FOUND' && cls.programme_code === 'FOU',
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
  const skills = ['listening', 'reading', 'prep_writing', 'pronunciation'];
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
  const skills = ['listening', 'reading', 'prep_writing', 'pronunciation'];
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
  assert(cases.length >= 3, 'Dữ liệu mẫu cần đủ cả ba mức SOS của lớp thường');
  for (const c of cases) assert(c.sos_level >= 1 && c.sos_level <= 3, `Mức SOS lạ: ${c.sos_level}`);
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
        WHERE a.kind != 'mock' AND sc.sos_level >= 2 LIMIT 1`,
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
        WHERE a.kind != 'mock' AND a.status = 'planned' AND a.lrw_scheduled_at IS NOT NULL LIMIT 1`,
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
    assert(row.onTarget + row.sos1 + row.sos2 + row.sos3 === row.attempts,
      `Tuần ${row.code}: ${row.onTarget}+${row.sos1}+${row.sos2}+${row.sos3} khác ${row.attempts} lượt`);
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
    primaryCode: 'student.behaviour.homework',
    contextCodes: ['context.family'],
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
  assert(r.issues.find((i: any) => i.role === 'primary')?.code === 'student.behaviour.homework',
    'Thiếu vấn đề chính');
  assert(r.issues.some((i: any) => i.role === 'context'), 'Hoàn cảnh phải ghi được kèm theo');
});

check('Bấm hai lần hoặc thử lại không tạo case trùng', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  const args = {
    studentId: someStudent.id, summary: 'Thử chống trùng', idempotencyKey: 'test-report-1',
  };
  const a = cases.reportIssue(P.coreTeacher, args) as any;
  const b = cases.reportIssue(P.coreTeacher, args) as any;
  const after = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
  assert(after === before + 1, `Gửi lại cùng khoá đã tạo thêm ${after - before - 1} case`);
  assert(a.id === b.id, 'Hai lần gửi cho ra hai case khác nhau');
});

check('Một case có NHIỀU tác động, mỗi tác động xem lại nhiều lần', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, summary: 'Thử nhiều tác động', idempotencyKey: 'test-report-2',
  }) as any;
  cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'talk_student', description: 'Gặp riêng sau buổi học',
    performerName: 'GVCN', status: 'completed', completedDate: TODAY,
  });
  const two = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'talk_parent', description: 'CS gọi phụ huynh',
    performerName: 'Chị Hương (CS)', status: 'completed', completedDate: TODAY,
  }) as any;
  assert(two.interventions.length === 2, `Phải có hai tác động, đang có ${two.interventions.length}`);
  // Người thực hiện ở ngoài hệ thống vẫn giữ được tên, và ghi rõ là người khác nhập hộ.
  const cs = two.interventions.find((i: any) => i.kind === 'talk_parent');
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
    studentId: someStudent.id, summary: 'Thử ràng buộc tác động', idempotencyKey: 'test-report-3',
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
});

check('Chỉ hẹn ngày xem lại mới có quá hạn; theo dõi không hẹn thì không bao giờ quá hạn', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, summary: 'Thử quá hạn', idempotencyKey: 'test-report-4',
  }) as any;
  // Có hẹn và đã qua ngày.
  const overdue = cases.recordIntervention(P.coreTeacher, c.id, {
    kind: 'tutor', description: 'Có hẹn xem lại', performerName: 'Tutor A',
    status: 'started', startedDate: addDays(TODAY, -20), followupDue: addDays(TODAY, -5),
  }) as any;
  assert(overdue.interventions.some((i: any) => i.overdue), 'Đã quá ngày hẹn mà không báo quá hạn');
  // Không hẹn: dù để rất lâu cũng không quá hạn.
  const c2 = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, summary: 'Chỉ theo dõi', idempotencyKey: 'test-report-5',
  }) as any;
  const monitor = cases.recordIntervention(P.coreTeacher, c2.id, {
    kind: 'teaching_adjust', description: 'Nhắc trong giờ chữa bài', performerName: 'GVBM',
    status: 'started', startedDate: addDays(TODAY, -60),
  }) as any;
  assert(!monitor.interventions.some((i: any) => i.overdue),
    'Theo dõi không hẹn ngày mà lại bị coi là quá hạn');
});

check('Đóng case bắt buộc có hướng xử lý, và "chỉ theo dõi" không phải là đóng', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, summary: 'Thử đóng case', idempotencyKey: 'test-report-6',
  }) as any;
  assertThrows(() => cases.setDisposition(P.mbManager, c.id, { status: 'done' }),
    /hướng xử lý/, 'Đóng case mà không có hướng xử lý');
  assertThrows(() => cases.setDisposition(P.mbManager, c.id, { status: 'done', disposition: 'monitor' }),
    /còn mở/, '"Chỉ theo dõi" mà vẫn đóng được');
  const done = cases.setDisposition(P.mbManager, c.id, {
    status: 'done', disposition: 'no_action', note: 'Đã trao đổi, em ổn định lại',
  }) as any;
  assert(done.status === 'done' && done.closedAt, 'Không đóng được case dù đã có hướng xử lý');
});

check('Chỉ GVCN của lớp và Quản lý mới đóng được case', () => {
  const c = cases.reportIssue(P.subjectTeacher, {
    studentId: someStudent.id, summary: 'Thử quyền đóng', idempotencyKey: 'test-report-7',
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
  assertThrows(() => cases.reportIssue(P.coreTeacher, { studentId: cp.id, summary: 'Ngoài phạm vi' }),
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

check('Lọc theo nhóm vấn đề và theo kỹ năng', () => {
  const all = cases.listCases(P.admin, {}).rows;
  assert(all.some((r) => r.group === 'student'), 'Không có case nào thuộc nhóm Học sinh');
  const student = cases.listCases(P.admin, { group: 'student' }).rows;
  for (const r of student) assert(r.group === 'student', 'Lọc nhóm sai');
  const listening = cases.listCases(P.admin, { skill: 'listening' }).rows;
  assert(listening.length > 0, 'Không lọc được theo kỹ năng');
});

check('Case sinh từ điểm và case giáo viên báo dùng CHUNG một vòng đời', () => {
  const fromMock = cases.listCases(P.admin, { origin: 'mock' }).rows;
  const fromTeacher = cases.listCases(P.admin, { origin: 'teacher_report' }).rows;
  assert(fromMock.length > 0 && fromTeacher.length > 0, 'Thiếu một trong hai nguồn case');
  // Cùng một bảng, cùng bộ trạng thái, nên đếm chung được.
  const total = cases.listCases(P.admin, {}).rows.length;
  assert(total === fromMock.length + fromTeacher.length, 'Hai nguồn không cộng lại thành tổng');
  // Case từ điểm có mức SOS; case giáo viên báo thì không.
  for (const r of fromTeacher) assert(r.sosLevel === null, `Case giáo viên báo ${r.id} lại có mức SOS`);
  assert(fromMock.some((r) => (r.sosLevel ?? 0) > 0), 'Case từ điểm phải có mức SOS');
});

check('Hành trình ghi ngày SỰ VIỆC XẢY RA, và lưu lại nhiều lần không nhân đôi', () => {
  const before = (conn.prepare('SELECT COUNT(*) n FROM journey_events').get() as any).n;
  const c = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, summary: 'Thử hành trình',
    detectedAt: addDays(TODAY, -10),          // ghi bù một việc của mười ngày trước
    idempotencyKey: 'test-report-8',
  }) as any;
  const ev = conn
    .prepare(`SELECT * FROM journey_events WHERE ref_table='sos_cases' AND ref_id = ?`)
    .get(c.id) as any;
  assert(ev, 'Báo vấn đề mà không ghi vào hành trình');
  assert(ev.event_date === addDays(TODAY, -10), 'Hành trình phải ghi ngày sự việc, không phải ngày nhập');
  // Không so `created_at` với TODAY: `created_at` là giờ thật của máy chủ, còn TODAY là ngày
  // demo cố định, hai mốc này không trùng nhau và cũng không cần trùng. Điều đáng kiểm là
  // hệ thống lưu HAI mốc TÁCH BIỆT — ngày sự việc do người báo khai, ngày nhập do máy ghi.
  assert(ev.created_at, 'Không ghi lại thời điểm nhập');
  assert(ev.event_date !== ev.created_at.slice(0, 10),
    'Ngày sự việc và ngày nhập bị gộp làm một, ghi bù sẽ mất dấu thời điểm thật');
  assert(ev.cycle_id !== null, 'Sự kiện phải gắn đúng lộ trình');
  // Gửi lại cùng khoá: không thêm case, nên cũng không thêm sự kiện.
  cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, summary: 'Thử hành trình', idempotencyKey: 'test-report-8',
  });
  const n = (conn.prepare(`SELECT COUNT(*) n FROM journey_events WHERE ref_table='sos_cases' AND ref_id = ?`)
    .get(c.id) as any).n;
  assert(n === 1, `Gửi lại tạo thêm sự kiện hành trình (${n} sự kiện)`);
  void before;
});

check('Bằng chứng phải thuộc đúng học viên của case', () => {
  const c = cases.reportIssue(P.coreTeacher, {
    studentId: someStudent.id, summary: 'Thử bằng chứng', idempotencyKey: 'test-report-9',
  }) as any;
  const other = conn
    .prepare('SELECT id FROM assessment_attempts WHERE student_id != ? LIMIT 1')
    .get(someStudent.id) as any;
  assertThrows(
    () => cases.recordFollowUp(P.coreTeacher, c.id, { evidenceAttemptId: other.id, outcome: 'improved' }),
    /không thuộc học viên/, 'Gắn bằng chứng của học viên khác',
  );
});

console.log(`\n${'='.repeat(60)}`);
console.log(failures.length === 0
  ? `TẤT CẢ ${passed} KIỂM TRA ĐỀU ĐẠT`
  : `${passed} đạt, ${failures.length} KHÔNG ĐẠT:\n` + failures.map((f) => '  - ' + f).join('\n'));
console.log('='.repeat(60));
process.exit(failures.length === 0 ? 0 : 1);
