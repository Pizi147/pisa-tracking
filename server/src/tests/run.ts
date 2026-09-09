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
const estimates = await import('../services/estimates.ts');
const sos = await import('../services/sos.ts');
const students = await import('../services/students.ts');
const meeting = await import('../services/meeting.ts');
const dashboard = await import('../services/dashboard.ts');
const classesSvc = await import('../services/classes.ts');
const intake = await import('../services/intake.ts');
const planning = await import('../services/planning.ts');
const signals = await import('../services/signals.ts');
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
check('Không đánh dấu gì thì phải CHỜ đủ bốn kỹ năng mới chốt SOS', () => {
  const partial = scoring.evaluateAttempt(6.5, 2, { listening: 7, reading: 7, writing1: 7, writing2: 7 });
  assert(partial.sosLevel === null, 'Thiếu Speaking mà đã chốt SOS');
  assert(partial.complete === false && partial.scoredRequired === 3, 'Tiến độ trên tập bắt buộc sai');
  assert(partial.required.length === 4, 'Mặc định phải là đủ bốn kỹ năng bắt buộc');
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

console.log('\n8. Đánh giá GV');
check('Đánh giá là dữ liệu riêng, không ghi đè điểm Mock', () => {
  const row = conn.prepare('SELECT * FROM teacher_estimates LIMIT 1').get() as any;
  assert(row, 'Seed thiếu đánh giá của giáo viên');
  const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE student_id = ? AND status='done' LIMIT 1`)
    .get(row.student_id) as any;
  if (a) {
    const before = conn.prepare('SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(a.id, row.skill) as any;
    const teacher = loadPrincipal(row.assessed_by);
    estimates.saveEstimate(teacher, { studentId: row.student_id, skill: row.skill, band: 8, assessedOn: TODAY });
    const after = conn.prepare('SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(a.id, row.skill) as any;
    assert(JSON.stringify(before) === JSON.stringify(after), 'Lưu đánh giá đã làm đổi điểm Mock');
  }
});
check('Mỗi lần cập nhật ghi thêm dòng mới nên có sẵn lịch sử', () => {
  const row = conn.prepare('SELECT * FROM teacher_estimates ORDER BY id DESC LIMIT 1') .get() as any;
  const hist = estimates.estimateHistory(P.admin, row.student_id, row.skill);
  assert(hist.length >= 2, 'Cập nhật đánh giá phải tạo dòng mới, không ghi đè');
  assert(hist[0].assessedOn >= hist[1].assessedOn, 'Lịch sử phải sắp theo ngày đánh giá');
  assert(hist[0].assessedByName, 'Thiếu người đánh giá');
});
check('So sánh ghi rõ ngày, nguồn và căn cứ của cả hai phía', () => {
  const row = conn.prepare('SELECT * FROM teacher_estimates ORDER BY id DESC LIMIT 1').get() as any;
  const cmp = estimates.compareEstimates(P.admin, row.student_id);
  const one = cmp.find((c) => c.estimate && c.mock);
  assert(one, 'Không tìm được cặp Đánh giá GV ↔ điểm Mock để so');
  assert(one!.estimate!.on && one!.mock!.source, 'Thiếu ngày đánh giá hoặc nguồn điểm Mock');
  /*
   * Δ đọc THEO HỌC VIÊN: dương = em đang thể hiện TỐT HƠN mức giáo viên đang đánh giá.
   * Đảo chiều thì màu xanh sẽ rơi vào đúng trường hợp đáng lo.
   */
  assert(one!.delta === Math.round((one!.mock!.band - one!.estimate!.band) * 10) / 10,
    'Chênh lệch phải là Mock trừ Đánh giá GV');
  // Nguồn điểm không nhắc lại lộ trình: cột Target ngay cạnh đã nói rồi.
  assert(!/LT[12]/.test(one!.mock!.source), `Nguồn Mock còn nhắc lại lộ trình: "${one!.mock!.source}"`);
});
check('Đánh giá GV nhập giống Mock: raw/40 cho L/R, bốn tiêu chí cho W/S', () => {
  const s = conn
    .prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id WHERE e.class_id=? LIMIT 1`)
    .get(mbClass) as any;
  // L/R: nhập số câu đúng, hệ thống tự quy ra band.
  const l = estimates.saveEstimate(P.lrTeacher, { studentId: s.id, skill: 'listening', raw: 30 }) as any;
  assert(l.raw_score === 30 && l.band === scoring.bandFromRaw('listening', 30),
    `Band phải quy từ raw, thực tế raw=${l.raw_score} band=${l.band}`);
  // W/S: nhập bốn tiêu chí, hệ thống tự tính band.
  const w = estimates.saveEstimate(P.w1Teacher, { studentId: s.id, skill: 'writing1', criteria: [6, 6, 5.5, 6] }) as any;
  assert(w.c1 === 6 && w.c4 === 6 && w.band === scoring.bandFromCriteria([6, 6, 5.5, 6]),
    `Band Writing phải tính từ bốn tiêu chí, thực tế band=${w.band}`);
  // Thiếu tiêu chí thì KHÔNG được đoán ra một band.
  assertThrows(() => estimates.saveEstimate(P.w1Teacher, { studentId: s.id, skill: 'writing1', criteria: [6, 6, null, null] }),
    /bốn tiêu chí/, 'Thiếu tiêu chí mà vẫn tính ra band');
  assertThrows(() => estimates.saveEstimate(P.lrTeacher, { studentId: s.id, skill: 'listening', raw: 45 }),
    /0 đến 40/, 'Raw ngoài thang 40');
});
check('Giáo viên chỉ đánh giá được kỹ năng mình phụ trách', () => {
  const s = conn
    .prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id WHERE e.class_id=? LIMIT 1`)
    .get(mbClass) as any;
  assertThrows(() => estimates.saveEstimate(P.w1Teacher, { studentId: s.id, skill: 'speaking', band: 7 }),
    /phân công/, 'GV W1 đánh giá Speaking');
  const ok = estimates.saveEstimate(P.w1Teacher, { studentId: s.id, skill: 'writing1', band: 6.5 }) as any;
  assert(ok.band === 6.5, 'GV W1 phải đánh giá được W1');
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
check('Nhập đủ kỹ năng bắt buộc mới mở case; sửa điểm giữ nguyên lịch sử xử lý', () => {
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
  attempts.setSchedule(P.cpAdmin, attempt.id, { lrwAt: '2026-11-09 18:00' });

  const exp = s.target_score;           // từ MT3 trở đi kỳ vọng bằng target
  const low = exp - 0.5;
  const t = (skill: string) => loadPrincipal(teacherOfSkill('CP-FT 111', skill));
  attempts.saveScore(t('listening'), attempt.id, 'listening', { rawScore: scoring.LISTENING_BY_RAW.indexOf(low) });
  assert(attempts.attemptDetail(P.cpManager, attempt.id).result.sosLevel === null, 'Mới một kỹ năng đã chốt SOS');

  attempts.saveScore(t('reading'), attempt.id, 'reading', { rawScore: scoring.READING_BY_RAW.indexOf(low) });
  attempts.saveScore(t('writing1'), attempt.id, 'writing1', { criteria: [low, low, low, low] });
  attempts.saveScore(t('writing2'), attempt.id, 'writing2', { criteria: [low, low, low, low] });
  assert(attempts.attemptDetail(P.cpManager, attempt.id).result.sosLevel === null, 'Thiếu Speaking mà đã chốt SOS');

  attempts.saveScore(t('speaking'), attempt.id, 'speaking', { criteria: [exp, exp, exp, exp] });
  const after = attempts.attemptDetail(P.cpManager, attempt.id);
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
  assert(students.studentDetail(P.admin, s.id).enrollments.length >= 2, 'Lịch sử lớp bị ghi đè');
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
check('Hành trình giữ đủ sự kiện lộ trình và chỉ có ba bộ lọc', () => {
  const s = conn.prepare(`SELECT student_id AS id FROM journey_events WHERE event_type='cycle_start' LIMIT 1`).get() as any;
  const all = students.journey(P.admin, s.id);
  assert(all.some((e) => e.eventType === 'cycle_start'), 'Thiếu sự kiện bắt đầu lộ trình');
  const t = conn.prepare(`SELECT student_id AS id FROM journey_events WHERE event_type='transfer' LIMIT 1`).get() as any;
  assert(students.journey(P.admin, t.id).some((e) => e.eventType === 'transfer'), 'Chuyển lớp phải nằm trong "Tất cả"');
  const w = conn.prepare(`SELECT student_id AS id FROM journey_events WHERE event_type='warning' LIMIT 1`).get() as any;
  const warn = students.journey(P.admin, w.id, 'warning');
  assert(warn.length > 0 && warn.every((e) => e.group === 'warning'), 'Bộ lọc Warning/WL sai');
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
check('Báo cáo tuần chỉ mở trong hai ngày cuối tuần, chặn ở máy chủ', () => {
  const cur = conn.prepare('SELECT * FROM report_periods WHERE week_start <= ? AND week_end >= ?')
    .get(demoToday(), demoToday()) as any;
  const w = week.reportEditWindow(cur, cur.week_start);          // thứ Hai
  assert(!w.open && /hai ngày cuối/.test(w.reason ?? ''), 'Đầu tuần vẫn mở cho nhập báo cáo');
  assert(week.reportEditWindow(cur, cur.week_end).open, 'Chủ nhật phải mở');
  assert(week.reportEditWindow(cur, addDays(cur.week_end, -1)).open, 'Thứ Bảy phải mở');
  // Tuần tương lai: đây chính là lỗi cũ — mở một tuần cuối năm và vẫn nhập bình thường.
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

console.log(`\n${'='.repeat(60)}`);
console.log(failures.length === 0
  ? `TẤT CẢ ${passed} KIỂM TRA ĐỀU ĐẠT`
  : `${passed} đạt, ${failures.length} KHÔNG ĐẠT:\n` + failures.map((f) => '  - ' + f).join('\n'));
console.log('='.repeat(60));
process.exit(failures.length === 0 ? 0 : 1);
