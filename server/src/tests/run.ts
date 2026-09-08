/**
 * Kiểm tra ít nhưng nhắm đúng rủi ro của bản demo.
 * Chạy trên một database riêng (data/test.sqlite) để không đụng dữ liệu bạn đang thử.
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

const { db, tx } = await import('../db.ts');
const { runSeed } = await import('../seed/seed.ts');
const { loadPrincipal, can, viewScope } = await import('../permissions.ts');
const { PERMISSIONS } = await import('../../../shared/domain.ts');
const weekly = await import('../services/weekly.ts');
const students = await import('../services/students.ts');
const classes = await import('../services/classes.ts');
const meetings = await import('../services/meetings.ts');
const admin = await import('../services/admin.ts');
const importSvc = await import('../services/import.ts');
const assessments = await import('../services/assessments.ts');
const { demoToday } = await import('../demoConfig.ts');
const { weekStartOf } = await import('../util.ts');

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
  try { fn(); } catch (e: any) { threw = true; assert(match.test(e.message), `${msg} — thông báo lỗi không khớp: "${e.message}"`); }
  assert(threw, `${msg} — thao tác đáng lẽ phải bị từ chối nhưng lại thành công`);
}

const conn = db();
const userId = (code: string) => (conn.prepare('SELECT id FROM users WHERE code = ?').get(code) as any).id;
const classId = (code: string) => (conn.prepare('SELECT id FROM classes WHERE code = ?').get(code) as any).id;
const studentByName = (name: string) => conn.prepare('SELECT * FROM students WHERE full_name = ? ORDER BY id').get(name) as any;
const WEEK = weekStartOf(demoToday());

const P = {
  admin: loadPrincipal(userId('U001')),
  managerA: loadPrincipal(userId('U002')),      // Manager chỉ Cầu Giấy
  multi: loadPrincipal(userId('U003')),         // Manager CG + GV Speaking lớp Hà Đông
  lisTeacher: loadPrincipal(userId('U004')),    // Chỉ Listening FT-A01
  coreTeacher: loadPrincipal(userId('U005')),   // GVCN FT-A01, Speaking FT-A01 + FT-B01
  consultant: loadPrincipal(userId('U006')),
  consultantMgr: loadPrincipal(userId('U007')),
  substitute: loadPrincipal(userId('U018')),    // phân công đã hết hiệu lực
};

console.log('\n1. GVBM: xem được mọi skill, chỉ sửa skill được giao');
check('GVBM xem được dữ liệu skill không phụ trách', () => {
  assert(can(P.lisTeacher, PERMISSIONS.ACADEMIC_VIEW, { classId: classId('FT-A01'), skill: 'speaking' }),
    'GVBM phải xem được toàn bộ dữ liệu học vụ của lớp mình');
});
check('API từ chối sửa skill không được giao', () => {
  const rec = weekly.ensureWeeklyRecord(
    (conn.prepare('SELECT id FROM enrollments WHERE class_id = ? LIMIT 1').get(classId('FT-A01')) as any).id,
    'speaking', WEEK);
  assertThrows(() => weekly.saveWeeklyRecord(P.lisTeacher, rec.id, { attended: 1 }, 1),
    /không có quyền/i, 'GVBM Listening sửa được Speaking');
});
check('API từ chối lớp ngoài phân công', () => {
  assert(!can(P.lisTeacher, PERMISSIONS.WEEKLY_EDIT, { classId: classId('FT-C01'), skill: 'listening' }),
    'GVBM sửa được lớp mình không dạy');
  assert(!can(P.lisTeacher, PERMISSIONS.ACADEMIC_VIEW, { classId: classId('FT-C01') }),
    'GVBM xem được lớp mình không được giao');
});
check('Phân công hết hiệu lực thì mất quyền sửa', () => {
  assert(!can(P.substitute, PERMISSIONS.WEEKLY_EDIT, { classId: classId('FT-A01'), skill: 'reading' }),
    'Giáo viên dạy thay hết hạn vẫn sửa được dữ liệu');
});

console.log('\n2. GVCN và multi-role không làm rò scope');
check('GVCN chỉ mở quyền tổng hợp đúng lớp chủ nhiệm', () => {
  assert(can(P.coreTeacher, PERMISSIONS.SUMMARY_EDIT, { classId: classId('FT-A01') }),
    'GVCN không tổng hợp được lớp mình chủ nhiệm');
  assert(!can(P.coreTeacher, PERMISSIONS.SUMMARY_EDIT, { classId: classId('FT-B01') }),
    'GVCN của lớp này lại tổng hợp được lớp chỉ dạy Speaking');
});
check('Quyền chủ nhiệm không tự cấp quyền sửa mọi skill', () => {
  assert(can(P.coreTeacher, PERMISSIONS.WEEKLY_EDIT, { classId: classId('FT-A01'), skill: 'speaking' }),
    'GVCN không sửa được skill mình dạy');
  assert(!can(P.coreTeacher, PERMISSIONS.WEEKLY_EDIT, { classId: classId('FT-A01'), skill: 'reading' }),
    'GVCN sửa được cả skill mình không dạy');
});
check('Multi-role: quyền quản lý không tràn sang chi nhánh khác', () => {
  assert(can(P.multi, PERMISSIONS.WEEKLY_EDIT, { classId: classId('FT-A01'), skill: 'reading' }),
    'Quản lý không sửa được lớp trong chi nhánh của mình');
  assert(!can(P.multi, PERMISSIONS.WEEKLY_EDIT, { classId: classId('FT-B01'), skill: 'reading' }),
    'Quyền quản lý Cầu Giấy tràn sang lớp Hà Đông');
  assert(can(P.multi, PERMISSIONS.WEEKLY_EDIT, { classId: classId('FT-B01'), skill: 'speaking' }),
    'Không dùng được quyền giáo viên tại lớp được phân công');
  assert(!can(P.multi, PERMISSIONS.STUDENT_TRANSFER, { classId: classId('FT-B01') }),
    'Quyền chuyển lớp của quản lý tràn sang chi nhánh khác');
});
check('Manager chi nhánh A không thấy lớp chi nhánh B', () => {
  const codes = classes.listClasses(P.managerA, {}).map((c: any) => c.code);
  assert(codes.every((c: string) => c.includes('-A')), `Manager A thấy lớp ngoài phạm vi: ${codes.join(', ')}`);
});

console.log('\n3. Tư vấn viên: chỉ đọc, không nhận ghi chú nội bộ');
check('Tư vấn viên không sửa được học vụ', () => {
  const rec = conn.prepare('SELECT id FROM weekly_learning_records LIMIT 1').get() as any;
  assertThrows(() => weekly.saveWeeklyRecord(P.consultant, rec.id, { attended: 0 }, 1),
    /không có quyền/i, 'Tư vấn viên sửa được dữ liệu học tập');
});
check('API không trả ghi chú nội bộ cho tư vấn viên', () => {
  const sid = [...P.consultant.consultantStudentIds][0];
  conn.prepare(`INSERT INTO teacher_notes (student_id, body, visibility, author_user_id, created_at)
                VALUES (?, 'BÍ MẬT NỘI BỘ', 'internal', ?, datetime())`).run(sid, userId('U005'));
  const detail = students.getStudentDetail(P.consultant, sid);
  assert(!JSON.stringify(detail).includes('BÍ MẬT NỘI BỘ'), 'Ghi chú nội bộ lọt vào response của tư vấn viên');
  const journey = students.getJourney(P.consultant, sid);
  assert(!JSON.stringify(journey).includes('BÍ MẬT NỘI BỘ'), 'Ghi chú nội bộ lọt vào hành trình của tư vấn viên');
  const forTeacher = students.getStudentDetail(P.admin, sid);
  assert(JSON.stringify(forTeacher).includes('BÍ MẬT NỘI BỘ'), 'Người có quyền lại không xem được ghi chú nội bộ');
});
check('Tìm kiếm không trả học viên ngoài phạm vi tư vấn viên', () => {
  const all = students.listStudents(P.consultant, { limit: 500 });
  assert(all.total === P.consultant.consultantStudentIds.size,
    `Tư vấn viên thấy ${all.total} học viên nhưng chỉ được phân công ${P.consultant.consultantStudentIds.size}`);
});
check('Quản lý tư vấn có scope rộng hơn nhưng không phải toàn hệ thống', () => {
  const scope = viewScope(P.consultantMgr, PERMISSIONS.ACADEMIC_VIEW);
  const total = (conn.prepare('SELECT COUNT(*) AS n FROM students').get() as any).n;
  assert(!scope.all, 'Quản lý tư vấn được cấp quyền toàn hệ thống');
  assert(scope.studentIds.length > P.consultant.consultantStudentIds.size, 'Quản lý tư vấn không rộng hơn tư vấn viên');
  assert(scope.studentIds.length < total, 'Quản lý tư vấn thấy toàn bộ học viên');
});

console.log('\n4. Autosave, bulk update và thứ tự request');
check('Ghi rồi đọc lại vẫn còn dữ liệu', () => {
  const rec = weekly.ensureWeeklyRecord(
    (conn.prepare('SELECT id FROM enrollments WHERE class_id = ? LIMIT 1').get(classId('FT-A01')) as any).id,
    'listening', WEEK);
  tx(() => weekly.saveWeeklyRecord(P.lisTeacher, rec.id, { attended: 1, note: 'ghi chú kiểm tra' }, 10));
  const again = conn.prepare('SELECT * FROM weekly_learning_records WHERE id = ?').get(rec.id) as any;
  assert(again.attended_main_sessions === 1 && again.note_short === 'ghi chú kiểm tra', 'Dữ liệu không được lưu');
});
check('Request cũ không ghi đè request mới', () => {
  const rec = conn.prepare(`SELECT * FROM weekly_learning_records WHERE class_id = ? AND skill = 'listening' AND week_start = ? LIMIT 1`)
    .get(classId('FT-A01'), WEEK) as any;
  tx(() => weekly.saveWeeklyRecord(P.lisTeacher, rec.id, { attended: 1 }, 50));
  const stale = tx(() => weekly.saveWeeklyRecord(P.lisTeacher, rec.id, { attended: 0 }, 20));
  assert(stale.stale === true, 'Request cũ không bị đánh dấu là lỗi thời');
  const after = conn.prepare('SELECT attended_main_sessions FROM weekly_learning_records WHERE id = ?').get(rec.id) as any;
  assert(after.attended_main_sessions === 1, 'Request cũ đã ghi đè giá trị mới');
});
check('Bulk update kiểm tra quyền theo từng dòng', () => {
  const ids = (conn.prepare(`SELECT id FROM weekly_learning_records WHERE class_id = ? AND skill = 'speaking' AND week_start = ? LIMIT 3`)
    .all(classId('FT-A01'), WEEK) as any[]).map((r) => r.id);
  const res = weekly.bulkApply(P.lisTeacher, ids, { attended: 1 });
  assert(res.applied.length === 0 && res.failed.length === ids.length,
    'Bulk update bỏ qua kiểm tra quyền cho skill không được giao');
  const ok = weekly.bulkApply(P.coreTeacher, ids, { attended: 1 });
  assert(ok.applied.length === ids.length, 'GVBM Speaking không bulk update được skill của mình');
});
check('Không cho nhập vượt số buổi kỳ vọng hoặc số bài được giao', () => {
  const rec = conn.prepare(`SELECT * FROM weekly_learning_records WHERE class_id = ? AND skill = 'listening' AND week_start = ? LIMIT 1`)
    .get(classId('FT-A01'), WEEK) as any;
  assertThrows(() => weekly.saveWeeklyRecord(P.lisTeacher, rec.id, { attended: (rec.expected_main_sessions ?? 1) + 3 }, 100),
    /không được vượt/i, 'Cho phép buổi đã học vượt số buổi kỳ vọng');
  assertThrows(() => weekly.saveWeeklyRecord(P.lisTeacher, rec.id, { homeworkAssigned: 1, homeworkCompleted: 5 }, 101),
    /không được vượt/i, 'Cho phép số bài hoàn thành vượt số bài được giao');
});

console.log('\n5. Chuyển lớp, template version, carry-over');
check('Chuyển lớp giữ nguyên enrollment cũ', () => {
  const s = studentByName('Nguyễn Minh Anh');
  const before = conn.prepare('SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ?').get(s.id) as any;
  const res = students.transferStudent(P.admin, s.id, { toClassId: classId('FT-A02'), effectiveDate: demoToday(), reason: 'kiểm tra' });
  const after = conn.prepare('SELECT * FROM enrollments WHERE student_id = ? ORDER BY id').all(s.id) as any[];
  assert(after.length === before.n + 1, 'Chuyển lớp không tạo lần học mới');
  const old = after.find((e) => e.id === res.closedEnrollmentId);
  assert(old && old.status === 'transferred' && old.transferred_to_enrollment_id === res.newEnrollmentId,
    'Lần học cũ bị mất hoặc không liên kết tới lần học mới');
  const kept = conn.prepare('SELECT COUNT(*) AS n FROM weekly_learning_records WHERE enrollment_id = ?').get(old.id) as any;
  assert(kept.n > 0, 'Dữ liệu học tập của lần học cũ bị mất sau khi chuyển lớp');
});
check('Học viên chuyển từ Normal lên FT giữ cả hai lần học và điểm cũ', () => {
  const s = studentByName('Hoàng Diệu Linh');
  const enr = conn.prepare('SELECT * FROM enrollments WHERE student_id = ? ORDER BY id').all(s.id) as any[];
  assert(enr.length >= 2, 'Không giữ đủ hai lần học');
  const scores = conn.prepare(`SELECT scale FROM assessments WHERE student_id = ?`).all(s.id) as any[];
  assert(scores.some((x) => x.scale === 'score10'), 'Điểm thang 10 của lớp Normal bị mất');
  assert(scores.some((x) => x.scale === 'ielts'), 'Điểm IELTS của lớp FT bị mất');
});
check('Tạo version mới không sửa lớp đang dùng version cũ', () => {
  const cls = conn.prepare('SELECT * FROM classes WHERE code = ?').get('NM-A01') as any;
  const versionBefore = cls.template_version_id;
  const stagesBefore = classes.resolveClassStages(cls.id).length;
  const tpl = conn.prepare("SELECT id FROM course_templates WHERE code = 'NM-FOUND'").get() as any;
  admin.createTemplateVersion(P.admin, tpl.id, { basedOnVersionId: versionBefore, notes: 'v3 kiểm tra' });
  const clsAfter = conn.prepare('SELECT * FROM classes WHERE id = ?').get(cls.id) as any;
  assert(clsAfter.template_version_id === versionBefore, 'Lớp bị đổi sang phiên bản mới ngoài ý muốn');
  assert(classes.resolveClassStages(cls.id).length === stagesBefore, 'Chương trình của lớp cũ bị thay đổi');
});
check('Override chỉ ảnh hưởng đúng lớp được chọn', () => {
  const a = classes.classProgress(classId('NM-A01')).stages.find((s) => s.stageKey === 'f1-w4')!;
  const b = classes.classProgress(classId('NM-B01')).stages.find((s) => s.stageKey === 'f1-w4')!;
  assert(a.dueDate !== null, 'Lớp không override lại mất hạn');
  assert(b.dueDate === null, 'Override bỏ hạn không có tác dụng ở lớp được chọn');
});
check('Lớp FT không có mốc kèm hạn thì không bị đánh giá chậm', () => {
  const p = classes.classProgress(classId('FT-A01'));
  assert(p.summary.hasDeadlines === false, 'Lớp FT linh hoạt lại có mốc kèm hạn');
  assert(p.summary.delayed === false, 'Lớp FT không có hạn vẫn bị đánh dấu chậm');
});
check('Carry-over dùng lại chính task cũ, không nhân bản', () => {
  const periods = meetings.listMeetingPeriods();
  const latest = periods[0];
  const before = (conn.prepare('SELECT COUNT(*) AS n FROM tasks').get() as any).n;
  const detail = meetings.meetingDetail(P.admin, latest.id);
  const after = (conn.prepare('SELECT COUNT(*) AS n FROM tasks').get() as any).n;
  assert(before === after, 'Xem kỳ họp lại tạo thêm bản ghi công việc');
  assert(detail.carryOverTasks.length > 0, 'Không có việc tồn nào để kiểm tra');
  for (const t of detail.carryOverTasks) {
    assert(t.originMeeting !== latest.label, `Task ${t.code} bị gán sai kỳ họp gốc`);
    const row = conn.prepare('SELECT source_meeting_period_id FROM tasks WHERE id = ?').get(t.id) as any;
    assert(row.source_meeting_period_id !== latest.id, `Task ${t.code} bị chuyển nguồn sang kỳ hiện tại`);
  }
});

console.log('\n6. Buổi bổ trợ, dữ liệu thiếu, Writing 1/2');
check('Buổi bổ trợ không làm tỷ lệ chuyên cần vượt 100%', () => {
  const s = studentByName('Bùi Hà My');
  const rows = students.getStudentWeekly(P.admin, s.id, 2).filter((r: any) => r.weekStart === WEEK && r.supplemental > 0);
  assert(rows.length > 0, 'Không tìm thấy tuần có buổi bổ trợ');
  for (const r of rows) {
    assert(r.attendanceRate === null || r.attendanceRate <= 100, `Tỷ lệ chuyên cần ${r.attendanceRate}% vượt 100%`);
    assert(r.totalSessions === (r.attended ?? 0) + (r.supplemental ?? 0), 'Tổng buổi tính sai');
  }
  const total = rows.reduce((n: number, r: any) => n + r.supplemental, 0);
  assert(total === 7, `Kịch bản cần đúng 7 buổi bổ trợ trong tuần, đang có ${total}`);
});
check('Chưa nhập khác với nhập 0', () => {
  const notUpdated = studentByName('Trịnh Bảo Trâm');
  const zero = studentByName('Cao Minh Quang');
  const nu = weekly.computeSignals([notUpdated.id]).get(notUpdated.id)!;
  const z = weekly.computeSignals([zero.id]).get(zero.id)!;
  assert(nu.missingUpdates > 0, 'Học viên chưa cập nhật không được đưa vào diện cần cập nhật');
  const nuRows = students.getStudentWeekly(P.admin, notUpdated.id, 2);
  assert(nuRows.some((r: any) => r.dataState === 'not_updated'), 'Dòng chưa nhập không được đánh dấu đúng');
  assert(z.attendance.rate === 0, 'Học viên nhập 0 buổi lại không tính ra 0%');
  assert(z.concern === true, 'Học viên nhập 0 buổi không sinh tín hiệu cần chú ý');
});
check('Skill không đăng ký hiển thị "không áp dụng", không tính là thiếu dữ liệu', () => {
  const s = studentByName('Ngô Tuấn Kiệt');
  const rows = students.getStudentWeekly(P.admin, s.id, 2);
  const na = rows.filter((r: any) => !r.applicable);
  assert(na.length > 0, 'Học viên chỉ học 2 skill nhưng không có dòng "không áp dụng"');
  assert(na.every((r: any) => r.dataState === 'not_applicable'), 'Dòng không áp dụng bị coi là thiếu dữ liệu');
  const sig = weekly.computeSignals([s.id]).get(s.id)!;
  assert(sig.missingUpdates === 0, 'Skill không áp dụng bị tính vào diện chưa cập nhật');
});
check('Writing 1 và Writing 2 giữ riêng, không thành điểm Writing chính thức', () => {
  const s = studentByName('Dương Quốc Việt');
  const d = students.getStudentDetail(P.admin, s.id);
  const w1 = d.estimates.find((e: any) => e.teachingSkill === 'writing1');
  const w2 = d.estimates.find((e: any) => e.teachingSkill === 'writing2');
  assert(w1 && w2 && w1.band !== w2.band, 'Không có hai ước lượng Writing khác nhau');
  const official = d.officialScore!.scores.writing;
  assert(official !== (w1!.band + w2!.band) / 2, 'Điểm Writing chính thức bị lấy trung bình từ ước lượng');
  assert(!d.estimates.some((e: any) => e.teachingSkill === 'writing'), 'Xuất hiện skill "writing" gộp trong ước lượng');
});
check('Bài official thiếu skill hiển thị "chưa có", không tự ghép từ bài khác', () => {
  const s = studentByName('Đinh Gia Huy');
  const o = students.latestOfficialAssessment(s.id)!;
  assert(o.scores.speaking === null, 'Skill thiếu bị điền bằng điểm của bài khác');
  assert(o.missingSkills.includes('speaking'), 'Không báo skill còn thiếu');
});
check('Học viên chưa có bài official chỉ hiện ước lượng', () => {
  const s = studentByName('Lý Thảo Nguyên');
  const d = students.getStudentDetail(P.admin, s.id);
  assert(d.officialScore === null, 'Học viên chưa thi lại có điểm official');
  assert(d.estimates.length > 0, 'Không có ước lượng nào để hiển thị');
});
check('Điểm thang 10 của lớp Normal không bị quy đổi sang band IELTS', () => {
  const s = studentByName('Hoàng Diệu Linh');
  const d = students.getStudentDetail(P.admin, s.id);
  const progress = d.assessments.find((a: any) => a.testType === 'progress')!;
  assert(progress.scale === 'score10', 'Progress Test bị đổi thang điểm');
  assert(progress.scores.some((x: any) => x.score > 9), 'Không còn điểm nào vượt thang IELTS để chứng minh không quy đổi');
});
check('Hệ thống không tự tạo ghi nhận cảnh báo từ tín hiệu', () => {
  const s = studentByName('Trần Bảo Long');
  const sig = weekly.computeSignals([s.id]).get(s.id)!;
  const warnings = conn.prepare('SELECT COUNT(*) AS n FROM warning_references WHERE student_id = ?').get(s.id) as any;
  assert(sig.concern === true, 'Học viên chuyên cần thấp không sinh tín hiệu');
  assert(warnings.n === 0, 'Hệ thống tự tạo ghi nhận cảnh báo từ tín hiệu học tập');
});
check('Ghi nhận cảnh báo chỉ do người có quyền tạo', () => {
  const s = studentByName('Trần Bảo Long');
  assertThrows(() => assessments.createWarningReference(P.lisTeacher, { studentId: s.id, reason: 'thử' }),
    /không có quyền|GVCN/i, 'GVBM không chủ nhiệm vẫn ghi nhận được cảnh báo');
  const ok = assessments.createWarningReference(P.coreTeacher, { studentId: s.id, reason: 'kiểm tra' });
  assert(ok, 'GVCN không ghi nhận được cảnh báo cho lớp mình');
});

console.log('\n7. Import Excel/CSV');
const mapping = { className: 'Lớp', fullName: 'Họ tên', dob: 'Ngày sinh', targetBand: 'Target', consultant: 'Tư vấn viên', skills: 'Skill' };
const rowsOk = [
  { 'Lớp': 'FT-A01', 'Họ tên': 'Nguyễn Test Một', 'Ngày sinh': '14/03/2007', 'Target': '6.5', 'Tư vấn viên': '', 'Skill': '' },
  { 'Lớp': 'FT-A01', 'Họ tên': 'Nguyễn Test Hai', 'Ngày sinh': '02/11/2006', 'Target': '7.0', 'Tư vấn viên': '', 'Skill': '' },
];
check('Báo lỗi rõ ràng cho dòng hỏng, không nhập âm thầm', () => {
  const bad = [
    { 'Lớp': 'FT-A01', 'Họ tên': '', 'Ngày sinh': '11/01/2007', 'Target': '', 'Tư vấn viên': '', 'Skill': '' },
    { 'Lớp': 'KHONG-CO', 'Họ tên': 'Đỗ Test Ba', 'Ngày sinh': '19/04/2006', 'Target': '', 'Tư vấn viên': '', 'Skill': '' },
    { 'Lớp': 'FT-A01', 'Họ tên': 'Vũ Test Bốn', 'Ngày sinh': '30/13/2007', 'Target': '', 'Tư vấn viên': '', 'Skill': '' },
    { 'Lớp': 'FT-A01', 'Họ tên': 'Vũ Test Năm', 'Ngày sinh': '01/02/2007', 'Target': '', 'Tư vấn viên': 'Không Có Thật', 'Skill': '' },
  ];
  const res = importSvc.validateStudentImport(P.admin, bad, mapping);
  assert(res.summary.errors === 4, `Cần bắt 4 dòng lỗi, chỉ bắt được ${res.summary.errors}`);
  assert(/Thiếu họ tên/.test(res.rows[0].errors.join()), 'Không báo lỗi thiếu họ tên');
  assert(/không tồn tại/.test(res.rows[1].errors.join()), 'Không báo lỗi lớp không tồn tại');
  assert(/Ngày sinh/.test(res.rows[2].errors.join()), 'Không báo lỗi ngày sinh không hợp lệ');
  assert(/Tư vấn viên/.test(res.rows[3].errors.join()), 'Không báo lỗi tư vấn viên không hợp lệ');
});
check('Import ngoài phạm vi quyền bị chặn', () => {
  const res = importSvc.validateStudentImport(P.managerA, [
    { 'Lớp': 'FT-B01', 'Họ tên': 'Trần Test Sáu', 'Ngày sinh': '01/02/2007', 'Target': '', 'Tư vấn viên': '', 'Skill': '' },
  ], mapping);
  assert(/ngoài phạm vi/.test(res.rows[0].errors.join()), 'Manager nhập được học viên vào chi nhánh khác');
});
check('Trùng tên + ngày sinh chỉ tạo candidate, không tự gộp', () => {
  const dup = conn.prepare("SELECT full_name, dob, COUNT(*) AS n FROM students GROUP BY normalized_name, dob HAVING n > 1").all() as any[];
  assert(dup.length > 0, 'Seed không có cặp trùng tên + ngày sinh để kiểm tra');
  const res = importSvc.validateStudentImport(P.admin, [
    { 'Lớp': 'FT-A01', 'Họ tên': dup[0].full_name, 'Ngày sinh': dup[0].dob.slice(8, 10) + '/' + dup[0].dob.slice(5, 7) + '/' + dup[0].dob.slice(0, 4), 'Target': '', 'Tư vấn viên': '', 'Skill': '' },
  ], mapping);
  assert(res.rows[0].duplicates.length >= 2, 'Không phát hiện được hồ sơ trùng');
  assert(res.rows[0].duplicates[0].matchOn.includes('Ngày sinh'), 'Không nêu rõ tiêu chí trùng khớp');
  assert(res.rows[0].decision !== 'create', 'Dòng nghi trùng bị mặc định tạo mới');
});
check('Bấm xác nhận hai lần không tạo dữ liệu trùng', () => {
  const before = (conn.prepare('SELECT COUNT(*) AS n FROM students').get() as any).n;
  const token = 'test-token-idempotency';
  const first = importSvc.commitStudentImport(P.admin, { token, fileName: 't.xlsx', rows: rowsOk, mapping, decisions: [] });
  const mid = (conn.prepare('SELECT COUNT(*) AS n FROM students').get() as any).n;
  const second = importSvc.commitStudentImport(P.admin, { token, fileName: 't.xlsx', rows: rowsOk, mapping, decisions: [] });
  const after = (conn.prepare('SELECT COUNT(*) AS n FROM students').get() as any).n;
  assert(first.created === 2, `Lần nhập đầu tạo ${first.created} học viên, cần 2`);
  assert(mid === before + 2, 'Số học viên sau lần nhập đầu không đúng');
  assert(after === mid, 'Bấm lần hai tạo thêm dữ liệu trùng');
  assert(second.alreadyCommitted === true, 'Không nhận ra phiên nhập đã được ghi');
});
check('Student ID sinh ở server, duy nhất và đúng định dạng', () => {
  const codes = (conn.prepare('SELECT student_code FROM students').all() as any[]).map((r) => r.student_code);
  assert(new Set(codes).size === codes.length, 'Có mã học viên bị trùng');
  assert(codes.every((c: string) => /^PISA-\d{6}$/.test(c)), 'Có mã học viên sai định dạng');
});
check('Liên kết vào hồ sơ có sẵn chỉ thêm lần học, không ghi đè', () => {
  const target = studentByName('Nguyễn Test Một');
  const nameBefore = target.full_name, dobBefore = target.dob;
  const enrBefore = (conn.prepare('SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ?').get(target.id) as any).n;
  importSvc.commitStudentImport(P.admin, {
    token: 'test-token-link', fileName: 't2.xlsx',
    rows: [{ 'Lớp': 'FT-A02', 'Họ tên': 'Nguyễn Test Một', 'Ngày sinh': '14/03/2007', 'Target': '8.0', 'Tư vấn viên': '', 'Skill': '' }],
    mapping, decisions: [{ rowIndex: 0, decision: 'link', linkStudentId: target.id }],
  });
  const after = conn.prepare('SELECT * FROM students WHERE id = ?').get(target.id) as any;
  const enrAfter = (conn.prepare('SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ?').get(target.id) as any).n;
  assert(after.full_name === nameBefore && after.dob === dobBefore, 'Liên kết đã ghi đè tên hoặc ngày sinh gốc');
  assert(enrAfter === enrBefore + 1, 'Liên kết không thêm lần học mới');
});

console.log('\n8. Nhật ký và lưu trữ');
check('Thay đổi quan trọng được ghi nhật ký kèm giá trị trước/sau', () => {
  const rows = conn.prepare("SELECT * FROM audit_logs WHERE action = 'student.transfer' ORDER BY id DESC LIMIT 1").get() as any;
  assert(rows, 'Chuyển lớp không được ghi nhật ký');
  assert(rows.before_json && rows.after_json, 'Nhật ký thiếu giá trị trước/sau');
  assert(rows.actor_user_id && rows.created_at, 'Nhật ký thiếu người thực hiện hoặc thời điểm');
});
check('Lưu trữ thay vì xoá cứng', () => {
  const b = conn.prepare("SELECT id FROM branches WHERE code = 'VI'").get() as any;
  admin.archiveEntity(P.admin, 'branches', b.id);
  const after = conn.prepare('SELECT status, archived_at FROM branches WHERE id = ?').get(b.id) as any;
  assert(after && after.status === 'archived' && after.archived_at, 'Bản ghi bị xoá cứng thay vì lưu trữ');
});

console.log(`\n${'='.repeat(60)}`);
console.log(failures.length === 0
  ? `TẤT CẢ ${passed} KIỂM TRA ĐỀU ĐẠT`
  : `${passed} đạt, ${failures.length} KHÔNG ĐẠT:\n` + failures.map((f) => '  - ' + f).join('\n'));
console.log('='.repeat(60));
process.exit(failures.length === 0 ? 0 : 1);
