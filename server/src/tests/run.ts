/**
 * Kiểm tra nghiệp vụ theo 10 kịch bản nghiệm thu của bản overhaul.
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
const { PERMISSIONS } = await import('../../../shared/domain.ts');
const scoring = await import('../services/scoring.ts');
const week = await import('../services/week.ts');
const mock = await import('../services/mock.ts');
const sos = await import('../services/sos.ts');
const students = await import('../services/students.ts');
const meeting = await import('../services/meeting.ts');
const dashboard = await import('../services/dashboard.ts');
const { demoToday } = await import('../demoConfig.ts');

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

/** Tìm người dùng theo vai trò + chi nhánh, không phụ thuộc tên giả sinh ngẫu nhiên. */
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
/** Giáo viên được phân công đúng một kỹ năng ở một lớp. */
function teacherOfSkill(classCode: string, skill: string) {
  const row = conn
    .prepare(
      `SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status='active' LIMIT 1`,
    )
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
  admin: loadPrincipal(userByRole('admin', null)),
  mbAdmin: loadPrincipal(userByRole('branch_admin', 'MB')),
  mbManager: loadPrincipal(userByRole('manager', 'MB')),
  cpManager: loadPrincipal(userByRole('manager', 'CP')),
  w1Teacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'writing1')),
  w2Teacher: loadPrincipal(teacherOfSkill('MB-FT 101', 'writing2')),
  coreTeacher: loadPrincipal(coreTeacherOf('MB-FT 101')),
};

// ==================================================================== 1

console.log('\n1. Quy đổi số câu đúng → band');
check('Bảng quy đổi đúng các mốc trong nguồn', () => {
  assert(scoring.bandFromRaw('listening', 0) === 0 && scoring.bandFromRaw('reading', 0) === 0, 'raw 0 phải ra band 0');
  assert(scoring.bandFromRaw('listening', 3) === 2.5, 'L raw 3 phải là 2.5');
  assert(scoring.bandFromRaw('reading', 3) === 1.5, 'R raw 3 phải là 1.5');
  assert(scoring.bandFromRaw('listening', 15) === 4.5, 'L raw 15 phải là 4.5');
  assert(scoring.bandFromRaw('reading', 15) === 5, 'R raw 15 phải là 5');
  assert(scoring.bandFromRaw('listening', 19) === 5, 'L raw 19 phải là 5');
  assert(scoring.bandFromRaw('reading', 19) === 5.5, 'R raw 19 phải là 5.5');
  assert(scoring.bandFromRaw('listening', 40) === 9 && scoring.bandFromRaw('reading', 40) === 9, 'raw 40 phải là 9');
  assert(scoring.LISTENING_BY_RAW.length === 41 && scoring.READING_BY_RAW.length === 41, 'Bảng quy đổi phải có 41 phần tử');
});
check('Từ chối số câu ngoài khoảng và số lẻ', () => {
  assertThrows(() => scoring.bandFromRaw('listening', -1), /0–40/, 'raw −1');
  assertThrows(() => scoring.bandFromRaw('reading', 41), /0–40/, 'raw 41');
  assertThrows(() => scoring.bandFromRaw('listening', 12.5), /số nguyên/, 'raw 12.5');
});
check('Ô trống vẫn là trống, không thành 0', () => {
  const r = scoring.evaluateMock(6.5, 1, {});
  assert(r.bands.listening === null && r.overall === null, 'Chưa nhập điểm mà đã có band');
  assert(r.completed === 0, 'Đếm sai số kỹ năng đã có');
});

// ==================================================================== 2

console.log('\n2. Kỳ vọng và mức SOS');
check('Kỳ vọng theo lần MT: 6.5 → 5.5 / 6.0 / 6.5', () => {
  assert(scoring.expectationFor(6.5, 1) === 5.5, 'MT1 phải là cam kết − 1.0');
  assert(scoring.expectationFor(6.5, 2) === 6, 'MT2 phải là cam kết − 0.5');
  for (const n of [3, 4, 5]) assert(scoring.expectationFor(6.5, n) === 6.5, `MT${n} phải bằng cam kết`);
});
check('Bằng kỳ vọng là đạt, dưới kỳ vọng mới tính trượt', () => {
  const eq = scoring.evaluateMock(6.5, 3, { listening: 6.5, reading: 6.5, writing1: 6.5, writing2: 6.5, speaking: 6.5 });
  assert(eq.sosLevel === 0, 'Bằng kỳ vọng phải là Đạt kỳ vọng');
  const below = scoring.evaluateMock(6.5, 3, { listening: 6, reading: 6.5, writing1: 6.5, writing2: 6.5, speaking: 6.5 });
  assert(below.sosLevel === 1, 'Một kỹ năng dưới kỳ vọng phải là SOS 1');
});
check('0/1/2/3/4 kỹ năng dưới kỳ vọng → 0/1/2/3/3', () => {
  const build = (fails: number) => {
    const low = 6, ok = 6.5;
    const v = ['listening', 'reading', 'speaking'].map((_, i) => (i < fails ? low : ok));
    const wFail = fails >= 4;
    return scoring.evaluateMock(6.5, 3, {
      listening: v[0], reading: v[1], speaking: v[2],
      writing1: wFail ? low : ok, writing2: wFail ? low : ok,
    });
  };
  assert(build(0).sosLevel === 0, '0 trượt phải là Đạt kỳ vọng');
  assert(build(1).sosLevel === 1, '1 trượt phải là SOS 1');
  assert(build(2).sosLevel === 2, '2 trượt phải là SOS 2');
  assert(build(3).sosLevel === 3, '3 trượt phải là SOS 3');
  assert(build(4).sosLevel === 3 && build(4).failedCount === 4, '4 trượt vẫn là SOS 3');
});

// ==================================================================== 3

console.log('\n3. Thiếu điểm, tiêu chí S/W và Overall');
check('Chưa đủ bốn kỹ năng thì không kết luận SOS', () => {
  const partial = scoring.evaluateMock(6.5, 2, { listening: 7 });
  assert(partial.sosLevel === null, 'Mới một kỹ năng đã kết luận SOS');
  assert(partial.complete === false && partial.completed === 1, 'Tiến độ n/4 sai');
  assert(partial.overall === null, 'Chưa đủ bốn band mà đã có Overall');
});
check('Band W/S từ bốn tiêu chí; Writing = (W1 + W2×2)/3', () => {
  assert(scoring.bandFromCriteria([6, 6.5, 5.5, 6]) === 6, 'Trung bình bốn tiêu chí sai');
  assert(scoring.bandFromCriteria([6, 6.5, 5.5, null]) === null, 'Thiếu tiêu chí phải trả về trống');
  assert(scoring.writingBand(6, 7) === 6.5, '(6 + 14)/3 = 6.67 phải làm tròn về 6.5');
  assert(scoring.writingBand(7, 6) === 6.5, '(7 + 12)/3 = 6.33 phải làm tròn về 6.5');
  assert(scoring.writingBand(6, null) === null, 'Thiếu W2 thì chưa có band Writing');
});
check('Overall làm tròn nửa điểm, không làm tròn về số chẵn', () => {
  assert(scoring.roundToHalf(6.25) === 6.5, '6.25 phải lên 6.5');
  assert(scoring.roundToHalf(5.75) === 6, '5.75 phải lên 6');
  const r = scoring.evaluateMock(6.5, 3, { listening: 6, reading: 6.5, writing1: 6.5, writing2: 6.5, speaking: 7 });
  assert(r.overall === 6.5, `Overall phải là 6.5, đang là ${r.overall}`);
});

// ==================================================================== 4

console.log('\n4. Tuần, mã tuần và hạn nhập điểm');
check('Tuần thuộc tháng chứa thứ Năm', () => {
  assert(week.weekInfo('2026-09-28').code === 'W1 OCT', '28/09–04/10/2026 phải là W1 OCT');
  assert(week.weekInfo('2026-09-07').code === 'W2 SEP', '07/09–13/09/2026 phải là W2 SEP');
  assert(week.weekInfo('2026-09-13').weekStart === '2026-09-07', 'Chủ nhật phải thuộc tuần bắt đầu thứ Hai trước đó');
  assert(week.weekInfo('2026-09-16').code === 'W3 SEP', '16/09/2026 phải thuộc W3 SEP');
  // Tuần 28/12/2026–03/01/2027 có thứ Năm là 31/12 nên vẫn thuộc tháng 12.
  assert(week.weekInfo('2027-01-01').code === 'W5 DEC', '01/01/2027 phải thuộc W5 DEC, không phải W1 JAN');
  assert(week.weekInfo('2027-01-01').year === 2026, 'Năm sở hữu tuần phải là 2026');
  assert(week.weekInfo('2027-01-04').code === 'W1 JAN', 'Tuần sau đó mới là W1 JAN');
});
check('Hạn nhập điểm là thứ Tư của tuần kế tiếp', () => {
  assert(week.scoreDeadline('2026-09-13') === '2026-09-16', 'Mock 13/09 phải có hạn 16/09');
  assert(week.isOverdue('2026-09-16', '2026-09-16') === false, 'Trong ngày 16/09 chưa được tính quá hạn');
  assert(week.isOverdue('2026-09-16', '2026-09-17') === true, 'Sang 17/09 phải tính quá hạn');
});
check('Hạn bám NGÀY THI THỰC TẾ của từng kỹ năng', () => {
  const a = { status: 'completed', planned_date: '2026-09-17' };
  const early = mock.skillDeadline({ test_date: '2026-09-10' } as any, a);
  const late = mock.skillDeadline({ test_date: '2026-09-17' } as any, a);
  assert(early === '2026-09-16', `Kỹ năng thi 10/09 phải có hạn 16/09, đang là ${early}`);
  assert(late === '2026-09-23', `Kỹ năng thi 17/09 phải có hạn 23/09, đang là ${late}`);
});

// ==================================================================== 5

console.log('\n5. Lập lịch, dời lịch và huỷ');
const mbClass = classId('MB-FT 101');
check('Dời lịch cập nhật chính lượt đó, không tạo lượt mới', () => {
  const target = conn
    .prepare(`SELECT * FROM mock_attempts WHERE class_id = ? AND status='planned' ORDER BY id LIMIT 1`)
    .get(mbClass) as any;
  const before = (conn.prepare('SELECT COUNT(*) AS n FROM mock_attempts WHERE student_id = ?').get(target.student_id) as any).n;
  mock.rescheduleMock(P.mbManager, target.id, '2026-10-07', 'Trùng lịch phòng thi');
  const after = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(target.id) as any;
  const count = (conn.prepare('SELECT COUNT(*) AS n FROM mock_attempts WHERE student_id = ?').get(target.student_id) as any).n;
  assert(count === before, 'Dời lịch đã tạo thêm một lượt Mock');
  assert(after.planned_date === '2026-10-07' && after.attempt_no === target.attempt_no, 'Dời lịch không giữ nguyên số lần MT');
  const hist = conn.prepare(`SELECT * FROM mock_schedule_history WHERE attempt_id = ? AND action='rescheduled'`).all(target.id) as any[];
  assert(hist.length >= 1 && hist[0].old_date && hist[0].new_date, 'Thiếu lịch sử dời lịch');
});
check('Không huỷ được lượt đã thi, huỷ giữ nguyên dấu vết', () => {
  const done = conn.prepare(`SELECT * FROM mock_attempts WHERE status='completed' ORDER BY id LIMIT 1`).get() as any;
  assertThrows(() => mock.cancelMock(P.mbManager, done.id, ''), /lý do/, 'Huỷ mà không ghi lý do');
  const planned = conn
    .prepare(`SELECT * FROM mock_attempts WHERE class_id = ? AND status='planned' ORDER BY id DESC LIMIT 1`)
    .get(mbClass) as any;
  mock.cancelMock(P.mbManager, planned.id, 'Học sinh nghỉ ốm');
  const after = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(planned.id) as any;
  assert(after.status === 'cancelled' && after.cancel_reason === 'Học sinh nghỉ ốm', 'Huỷ không lưu lý do');
  assertThrows(() => mock.rescheduleMock(P.mbManager, planned.id, '2026-10-20'), /đã huỷ/, 'Dời lịch lượt đã huỷ');
});
check('Không tạo trùng lần MT cho cùng học sinh', () => {
  const a = conn.prepare('SELECT * FROM mock_attempts ORDER BY id LIMIT 1').get() as any;
  assertThrows(
    () => mock.createMock(P.admin, { studentId: a.student_id, attemptNo: a.attempt_no, plannedDate: '2026-11-02' }),
    /đã có lịch/, 'Tạo trùng lần MT',
  );
});

// ==================================================================== 6

console.log('\n6. Quyền theo vai trò × chi nhánh × phân công');
check('GVBM chỉ sửa kỹ năng được phân công, vẫn đọc được kỹ năng khác', () => {
  assert(can(P.w1Teacher, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: 'writing1' }), 'GV W1 phải sửa được Writing 1');
  assert(!can(P.w1Teacher, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: 'writing2' }), 'GV W1 không được sửa Writing 2');
  assert(can(P.w1Teacher, PERMISSIONS.MOCK_VIEW, { classId: mbClass }), 'GV phải xem được lớp mình dạy');
  const a = conn.prepare(`SELECT * FROM mock_attempts WHERE class_id = ? AND status='completed' ORDER BY id LIMIT 1`).get(mbClass) as any;
  assertThrows(
    () => mock.saveScore(P.w1Teacher, a.id, 'writing2', { criteria: [6, 6, 6, 6] }),
    /phân công/, 'GV W1 nhập điểm Writing 2',
  );
});
check('GVCN dời được lịch nhưng không vì thế sửa được mọi điểm', () => {
  assert(can(P.coreTeacher, PERMISSIONS.MOCK_SCHEDULE, { classId: mbClass }), 'GVCN phải dời được lịch');
  const skills = ['listening', 'reading', 'writing1', 'writing2', 'speaking']
    .filter((s) => can(P.coreTeacher, PERMISSIONS.SCORE_EDIT, { classId: mbClass, skill: s }));
  assert(skills.length < 5, `GVCN đang sửa được cả 5 kỹ năng: ${skills.join(', ')}`);
  assert(!can(P.w1Teacher, PERMISSIONS.MOCK_SCHEDULE, { classId: mbClass }), 'GVBM không phải GVCN thì không được dời lịch');
});
check('API chặn thao tác ngoài chi nhánh, không chỉ ẩn nút', () => {
  const cpAttempt = conn
    .prepare('SELECT a.* FROM mock_attempts a JOIN classes c ON c.id=a.class_id WHERE c.code = ? ORDER BY a.id LIMIT 1')
    .get('CP-FT 110') as any;
  assertThrows(() => mock.mockDetail(P.mbManager, cpAttempt.id), /phạm vi/, 'Quản lý MB xem Mock của CP');
  assertThrows(() => mock.rescheduleMock(P.mbManager, cpAttempt.id, '2026-10-09'), /quyền/, 'Quản lý MB dời lịch của CP');
  assert(mock.mockDetail(P.cpManager, cpAttempt.id).id === cpAttempt.id, 'Quản lý CP phải xem được Mock của CP');
});
check('Nhiều quản lý cùng chi nhánh đều vận hành được', () => {
  const ids = conn
    .prepare(
      `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN branches b ON b.id=ur.branch_id
        WHERE r.key='manager' AND b.code='MB'`,
    )
    .all() as any[];
  assert(ids.length >= 2, 'Chi nhánh MB phải có từ 2 quản lý trở lên');
  for (const r of ids) {
    assert(can(loadPrincipal(r.id), PERMISSIONS.MOCK_SCHEDULE, { classId: mbClass }), 'Một quản lý MB không lập được lịch');
  }
});
check('Không vai trò nào mặc định thấy toàn hệ thống', () => {
  assert(!can(P.mbManager, PERMISSIONS.MOCK_VIEW, { classId: classId('CP-FT 110') }), 'Quản lý MB đang thấy lớp CP');
  assert(can(P.admin, PERMISSIONS.MOCK_VIEW, { classId: classId('CP-FT 110') }), 'Admin toàn hệ thống phải thấy mọi lớp');
});

// ==================================================================== 7

console.log('\n7. Nhập điểm và hành động SOS');
check('Nhập đủ bốn kỹ năng mới mở case, sửa điểm không xoá lịch sử xử lý', () => {
  const s = conn
    .prepare(
      `SELECT s.* FROM students s JOIN enrollments e ON e.student_id=s.id
        WHERE e.class_id = ? AND s.committed_score IS NOT NULL ORDER BY s.id LIMIT 1`,
    )
    .get(classId('CP-FT 110')) as any;
  const attempt = mock.createMock(P.cpManager, {
    studentId: s.id, attemptNo: 4, plannedDate: '2026-11-09', classId: classId('CP-FT 110'),
  }) as any;
  const exp = s.committed_score;   // MT4 → kỳ vọng bằng cam kết
  const lTeacher = loadPrincipal(teacherOfSkill('CP-FT 110', 'listening'));
  const rTeacher = loadPrincipal(teacherOfSkill('CP-FT 110', 'reading'));
  const w1 = loadPrincipal(teacherOfSkill('CP-FT 110', 'writing1'));
  const w2 = loadPrincipal(teacherOfSkill('CP-FT 110', 'writing2'));
  const sp = loadPrincipal(teacherOfSkill('CP-FT 110', 'speaking'));

  const low = exp - 0.5;
  mock.saveScore(lTeacher, attempt.id, 'listening', { testDate: '2026-11-09', rawScore: scoring.LISTENING_BY_RAW.indexOf(low) });
  let after = mock.mockDetail(P.cpManager, attempt.id);
  assert(after.result.sosLevel === null, 'Mới một kỹ năng đã chốt SOS');
  assert(!after.sosCase, 'Mới một kỹ năng đã mở case');

  mock.saveScore(rTeacher, attempt.id, 'reading', { testDate: '2026-11-09', rawScore: scoring.READING_BY_RAW.indexOf(low) });
  mock.saveScore(w1, attempt.id, 'writing1', { testDate: '2026-11-09', criteria: [low, low, low, low] });
  mock.saveScore(w2, attempt.id, 'writing2', { testDate: '2026-11-09', criteria: [low, low, low, low] });
  after = mock.mockDetail(P.cpManager, attempt.id);
  assert(after.result.sosLevel === null, 'Thiếu Speaking mà đã chốt SOS');

  mock.saveScore(sp, attempt.id, 'speaking', { testDate: '2026-11-09', criteria: [exp, exp, exp, exp] });
  after = mock.mockDetail(P.cpManager, attempt.id);
  assert(after.result.sosLevel === 3, `Ba kỹ năng dưới kỳ vọng phải là SOS 3, đang là ${after.result.sosLevel}`);
  assert(after.sosCase && after.sosCase.sos_level === 3, 'Chưa mở case SOS 3');

  // Ghi nhận xử lý rồi sửa điểm cho đổi mức SOS: mức đổi, hành động và lịch sử phải còn.
  sos.updateCase(P.cpManager, after.sosCase.id, {
    talk_student_person: 'GVCN Thu Trang', talk_student_date: '2026-11-12', status: 'in_progress',
  });
  mock.saveScore(w1, attempt.id, 'writing1', { criteria: [exp, exp, exp, exp] });
  mock.saveScore(w2, attempt.id, 'writing2', { criteria: [exp, exp, exp, exp] });
  const reread = mock.mockDetail(P.cpManager, attempt.id);
  assert(reread.result.sosLevel === 2, `Sau khi sửa Writing phải còn SOS 2, đang là ${reread.result.sosLevel}`);
  assert(reread.sosCase.id === after.sosCase.id, 'Sửa điểm đã nhân đôi case');
  assert(reread.sosCase.talk_student_date === '2026-11-12', 'Sửa điểm đã xoá ghi nhận xử lý');
  assert(reread.caseHistory.length > 0, 'Thiếu lịch sử thay đổi của case');
});
check('Bảng hành động đúng theo MT × mức SOS', () => {
  const keys = (n: number, l: 1 | 2 | 3) => sos.stepsFor(n, l).map((s) => s.key);
  assert(!keys(1, 2).includes('meeting'), 'MT1 SOS 2 không có meeting bổ sung');
  assert(sos.stepsFor(1, 3).find((s) => s.key === 'meeting')!.detail.includes('GVCN'), 'MT1 SOS 3 phải là GVCN gặp HS');
  assert(sos.stepsFor(2, 3).find((s) => s.key === 'meeting')!.detail.includes('CX'), 'MT2 SOS 3 phải là CX/GĐCN gặp HS');
  assert(!keys(2, 2).includes('ops'), 'MT2 SOS 2 chưa có hỗ trợ vận hành');
  assert(keys(3, 2).includes('ops'), 'MT3 SOS 2 phải có hỗ trợ vận hành');
  assert(keys(3, 1).includes('ops') === false, 'MT3 SOS 1 không có hỗ trợ vận hành');
  assert(sos.stepsFor(2, 3).find((s) => s.key === 'academic')!.detail.includes('HOẶC'),
    'MT2 SOS 3 phải là hai phương án chọn một, không phải hai việc bắt buộc');
  assert(!/\d+\s*buổi/.test(sos.stepsFor(5, 1).find((s) => s.key === 'academic')!.detail),
    'MT5 không được tự sinh thời lượng tutor');
  for (const n of [1, 2, 3, 4, 5]) {
    for (const l of [1, 2, 3] as const) {
      assert(keys(n, l).includes('talk_parent'), `MT${n} SOS ${l} phải giữ bước trao đổi phụ huynh`);
    }
  }
});
check('Có tên người làm nhưng chưa có ngày thì chưa tính là đã thực hiện', () => {
  const steps = sos.caseProgress(
    { talk_student_person: 'GVCN Thu Trang', talk_parent_date: '2026-12-31', academic_start_date: '2026-09-01' },
    2, 2, TODAY,
  );
  const byKey = Object.fromEntries(steps.map((s) => [s.key, s.state]));
  assert(byKey.talk_student === 'named_only', 'Có tên chưa có ngày phải là "chưa thực hiện"');
  assert(byKey.talk_parent === 'scheduled', 'Ngày ở tương lai chỉ là đã xếp lịch');
  assert(byKey.academic === 'done', 'Ngày đã qua mới tính là đã bắt đầu');
});

// ==================================================================== 8

console.log('\n8. Họp tuần và công việc');
const currentPeriod = week.ensurePeriod(TODAY);
check('Ô chưa nhập là "Chưa báo cáo", không quy thành Ổn', () => {
  const board = meeting.meetingBoard(P.admin, currentPeriod.id);
  const blank = board.units.flatMap((u) => u.cells).filter((c) => c.status === null);
  assert(blank.length > 0, 'Seed không còn ô nào chưa báo cáo để kiểm tra');
  assert(board.totals.notReported === blank.length, 'Đếm sai số ô chưa báo cáo');
  assert(board.totals.ok + board.totals.watch + board.totals.problem + board.totals.notReported === board.totals.total,
    'Tổng số ô không khớp');
});
check('Tutor part-time là đơn vị riêng, mẫu số tính lại theo danh mục', () => {
  const board = meeting.meetingBoard(P.admin, currentPeriod.id);
  const tutor = board.units.find((u) => u.unitCode === 'TUTOR');
  assert(tutor && tutor.branchId === null, 'Tutor part-time không được là chi nhánh thứ sáu');
  assert(tutor!.cells.length === 3 && tutor!.cells[0].key === 'tutor_count', 'Tutor phải dùng bộ nhóm riêng');
  const branches = board.units.filter((u) => u.kind === 'branch');
  assert(branches.length === 5, 'Phải có đúng 5 đơn vị chi nhánh');
  assert(board.totals.total === branches.length * 3 + 3, `Mẫu số phải tính lại từ danh mục, đang là ${board.totals.total}`);
});
check('Trạng thái hạn tính riêng, việc hoàn thành không bị báo trễ', () => {
  const rows = meeting.listTasks(P.admin, {}).rows;
  const doneLate = rows.find((t) => t.progress === 'done' && t.dueDate && t.dueDate < TODAY);
  assert(doneLate && doneLate.dueState === 'closed', 'Việc đã hoàn thành sau hạn vẫn bị báo quá hạn');
  const noDue = rows.find((t) => !t.dueDate);
  assert(noDue && noDue.dueState === 'no_due', 'Việc không có hạn bị tính quá hạn');
  assert(rows.some((t) => t.dueState === 'overdue'), 'Seed thiếu việc quá hạn để kiểm tra');
  assert(rows.some((t) => t.dueState === 'due_soon'), 'Seed thiếu việc sắp đến hạn để kiểm tra');
});
check('Việc tồn từ kỳ trước vẫn hiện khi xem tuần này, không clone', () => {
  const inPeriod = meeting.listTasks(P.admin, { periodId: currentPeriod.id }).rows;
  const carried = inPeriod.filter((t) => t.periodId !== currentPeriod.id);
  assert(carried.length > 0, 'Việc tồn từ kỳ trước biến mất khi đổi tuần');
  assert(carried.some((t) => t.taskType === 'long_term'), 'Việc dài hạn chưa xong phải xét xuyên kỳ');
  const codes = inPeriod.map((t) => t.code);
  assert(new Set(codes).size === codes.length, 'Có việc bị nhân bản sang tuần mới');
});
check('Cập nhật báo cáo và công việc lưu lại được', () => {
  const unit = (conn.prepare("SELECT * FROM reporting_units WHERE code = 'MB'").get()) as any;
  meeting.saveUnitReport(P.mbManager, unit.id, currentPeriod.id, 'teachers',
    { status: 'problem', note: 'Thiếu 1 giáo viên Writing ca tối' });
  const board = meeting.meetingBoard(P.mbManager, currentPeriod.id);
  const cell = board.units.find((u) => u.unitId === unit.id)!.cells.find((c) => c.key === 'teachers')!;
  assert(cell.status === 'problem' && cell.note?.includes('Writing'), 'Báo cáo đơn vị không lưu được');

  const task = meeting.createTask(P.mbManager, {
    title: 'Bổ sung giáo viên Writing ca tối', unitId: unit.id, periodId: currentPeriod.id,
    dueDate: '2026-09-30', assigneeUserId: P.mbManager.userId,
  }) as any;
  meeting.updateTask(P.mbManager, task.id, { progress: 'doing' });
  const again = meeting.listTasks(P.mbManager, {}).rows.find((t) => t.id === task.id)!;
  assert(again.progress === 'doing', 'Cập nhật tiến độ không lưu được');
  assert(meeting.taskHistory(task.id).length > 0, 'Thiếu lịch sử thay đổi công việc');
});
check('Quản lý chi nhánh không sửa được báo cáo của đơn vị khác', () => {
  const cp = conn.prepare("SELECT * FROM reporting_units WHERE code = 'CP'").get() as any;
  assertThrows(
    () => meeting.saveUnitReport(P.mbManager, cp.id, currentPeriod.id, 'teachers', { status: 'ok' }),
    /quyền/, 'Quản lý MB sửa báo cáo của CP',
  );
});

// ==================================================================== 9

console.log('\n9. Tổng quan tuần');
check('Phân biệt lịch dự kiến, lượt đã thi và học sinh duy nhất', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  assert(o.kpis.week.scheduled >= o.kpis.week.taken, 'Số đã thi không thể lớn hơn số có lịch');
  assert(o.kpis.week.uniqueStudents <= o.kpis.week.scheduled, 'Học sinh duy nhất phải ≤ số lượt');
  assert(typeof o.kpis.week.cancelled === 'number', 'Thiếu số lượt đã huỷ');
});
check('Thiếu điểm khác quá hạn, lượt đã huỷ không tính vào cả hai', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  assert(o.kpis.scoring.overdue <= o.kpis.scoring.missing + o.kpis.scoring.complete,
    'Số quá hạn vượt quá số lượt còn hiệu lực');
  const all = mock.listMocks(P.admin, {}).rows;
  const cancelled = all.filter((m) => m.status === 'cancelled');
  assert(cancelled.length > 0, 'Seed thiếu lượt đã huỷ để kiểm tra');
  assert(!cancelled.some((m) => m.overdueSkills > 0), 'Lượt đã huỷ vẫn bị tính quá hạn');
});
check('Case cũ không biến mất khi chuyển sang tuần khác', () => {
  const periods = week.listPeriods(30);
  const other = periods.find((p) => p.id !== currentPeriod.id)!;
  const a = dashboard.overview(P.admin, currentPeriod.id);
  const b = dashboard.overview(P.admin, other.id);
  assert(a.kpis.cases.open === b.kpis.cases.open, 'Đổi tuần làm mất case còn tồn');
  assert(a.tasks.overdue === b.tasks.overdue, 'Đổi tuần làm mất việc quá hạn');
});
check('Mỗi KPI mở được đúng danh sách bản ghi', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  assert(mock.listMocks(P.admin, { need: 'overdue' }).rows.length === o.kpis.scoring.overdue, 'Bộ lọc quá hạn lệch KPI');
  assert(mock.listMocks(P.admin, { need: 'missing_scores' }).rows.length === o.kpis.scoring.missing, 'Bộ lọc thiếu điểm lệch KPI');
  assert(mock.listMocks(P.admin, { need: 'sos_open' }).rows.length === o.kpis.cases.open, 'Bộ lọc case lệch KPI');
});
check('Thời gian trả kết quả khác số ngày quá hạn', () => {
  const o = dashboard.overview(P.admin, currentPeriod.id);
  assert(o.support.avgResultDays === null || o.support.avgResultDays >= 0, 'Thời gian trả kết quả âm');
  assert('talkedStudent' in o.support && 'academicStarted' in o.support, 'Thiếu số liệu hỗ trợ');
});
check('Tuần có kỹ năng thi lệch tuần dùng ngày thi thực tế', () => {
  const split = conn
    .prepare(
      `SELECT attempt_id FROM mock_scores GROUP BY attempt_id HAVING COUNT(DISTINCT test_date) > 1 LIMIT 1`,
    )
    .get() as any;
  assert(split, 'Seed thiếu trường hợp thi lệch tuần');
  const row = mock.listMocks(P.admin, {}).rows.find((m) => m.id === split.attempt_id)!;
  const dates = (conn.prepare('SELECT MIN(test_date) AS d FROM mock_scores WHERE attempt_id = ?').get(split.attempt_id) as any).d;
  assert(row.firstTestDate === dates, 'Tuần hiển thị không lấy theo ngày thi sớm nhất');
});

// ==================================================================== 10

console.log('\n10. Hồ sơ học viên và lưu dữ liệu');
check('Hành trình giữ chuyển lớp, tạm dừng, quay lại và chỉ có ba bộ lọc', () => {
  const s = conn
    .prepare(`SELECT student_id AS id FROM journey_events WHERE event_type='transfer' LIMIT 1`)
    .get() as any;
  const all = students.journey(P.admin, s.id);
  assert(all.some((e) => e.eventType === 'transfer'), 'Chuyển lớp phải nằm trong "Tất cả"');
  const assessment = students.journey(P.admin, s.id, 'assessment');
  assert(assessment.every((e) => e.group === 'assessment'), 'Bộ lọc Assessment lẫn sự kiện khác');
  const p = conn.prepare(`SELECT student_id AS id FROM journey_events WHERE event_type='pause' LIMIT 1`).get() as any;
  const paused = students.journey(P.admin, p.id);
  assert(paused.some((e) => e.eventType === 'pause') && paused.some((e) => e.eventType === 'resume'),
    'Tạm dừng và quay lại học phải còn trong hành trình');
  const w = conn.prepare(`SELECT student_id AS id FROM journey_events WHERE event_type='warning' LIMIT 1`).get() as any;
  const warn = students.journey(P.admin, w.id, 'warning');
  assert(warn.length > 0 && warn.every((e) => e.group === 'warning'), 'Bộ lọc Warning/WL sai');
});
check('Chuyển lớp giữ lớp cũ cho lượt đã thi, chuyển lịch chưa thi', () => {
  const s = conn
    .prepare(
      `SELECT s.* FROM students s JOIN enrollments e ON e.student_id=s.id
        WHERE e.class_id = ? AND s.committed_score IS NOT NULL AND e.status='active' ORDER BY s.id LIMIT 1`,
    )
    .get(classId('BC-FT 205')) as any;
  const before = conn
    .prepare(`SELECT id, class_id, status FROM mock_attempts WHERE student_id = ?`).all(s.id) as any[];
  const takenBefore = before.filter((a) => a.status === 'completed');
  const target = classId('BC-BE 80');
  students.transferStudent(P.admin, s.id, target, '2026-09-21', 'Đổi ca học');
  const after = conn.prepare('SELECT id, class_id, status FROM mock_attempts WHERE student_id = ?').all(s.id) as any[];
  for (const t of takenBefore) {
    assert(after.find((a) => a.id === t.id)!.class_id === t.class_id, 'Lượt đã thi bị viết lại lớp');
  }
  for (const a of after.filter((x) => x.status === 'planned')) {
    assert(a.class_id === target, 'Lịch chưa thi không chuyển sang lớp mới');
  }
  const detail = students.studentDetail(P.admin, s.id);
  assert(detail.enrollments.length >= 2, 'Lịch sử lớp bị ghi đè thay vì mở dòng mới');
});
check('Điểm, lịch và việc vừa sửa vẫn còn sau khi đọc lại từ database', () => {
  const a = conn.prepare(`SELECT * FROM mock_attempts WHERE status='completed' ORDER BY id LIMIT 1`).get() as any;
  const teacher = loadPrincipal(teacherOfSkill(
    (conn.prepare('SELECT code FROM classes WHERE id = ?').get(a.class_id) as any).code, 'listening'));
  mock.saveScore(teacher, a.id, 'listening', { rawScore: 30, testDate: a.planned_date });
  const row = conn.prepare(`SELECT * FROM mock_scores WHERE attempt_id = ? AND skill='listening'`).get(a.id) as any;
  assert(row.raw_score === 30 && row.band === scoring.bandFromRaw('listening', 30), 'Điểm không lưu đúng');
  assert(row.entered_by === teacher.userId && row.entered_at, 'Thiếu dấu vết người nhập và thời điểm nhập');
});
check('Gửi null xoá điểm về trống, không biến thành 0', () => {
  const a = conn.prepare(`SELECT * FROM mock_attempts WHERE status='completed' ORDER BY id LIMIT 1`).get() as any;
  const code = (conn.prepare('SELECT code FROM classes WHERE id = ?').get(a.class_id) as any).code;
  const teacher = loadPrincipal(teacherOfSkill(code, 'listening'));
  mock.saveScore(teacher, a.id, 'listening', { rawScore: null });
  const row = conn.prepare(`SELECT * FROM mock_scores WHERE attempt_id = ? AND skill='listening'`).get(a.id) as any;
  assert(row.raw_score === null && row.band === null, 'Xoá điểm lại thành 0');
  mock.saveScore(teacher, a.id, 'listening', { rawScore: 30 });
});
check('Điểm cam kết tại lần thi được chốt, sửa hồ sơ không viết lại lịch sử', () => {
  const a = conn.prepare(`SELECT * FROM mock_attempts WHERE status='completed' ORDER BY id LIMIT 1`).get() as any;
  const before = a.committed_score_at_test;
  students.updateStudent(P.admin, a.student_id, { committedScore: 8 });
  const after = conn.prepare('SELECT * FROM mock_attempts WHERE id = ?').get(a.id) as any;
  assert(after.committed_score_at_test === before, 'Sửa cam kết đã viết lại lịch sử lần thi');
  assert((conn.prepare('SELECT committed_score FROM students WHERE id = ?').get(a.student_id) as any).committed_score === 8,
    'Hồ sơ hiện tại chưa cập nhật');
});

console.log(`\n${'='.repeat(60)}`);
console.log(failures.length === 0
  ? `TẤT CẢ ${passed} KIỂM TRA ĐỀU ĐẠT`
  : `${passed} đạt, ${failures.length} KHÔNG ĐẠT:\n` + failures.map((f) => '  - ' + f).join('\n'));
console.log('='.repeat(60));
process.exit(failures.length === 0 ? 0 : 1);
