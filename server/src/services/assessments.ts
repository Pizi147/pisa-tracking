import { db, tx } from '../db.ts';
import { ASSESSMENT_SKILLS, PERMISSIONS, TEACHING_SKILLS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso, weekStartOf } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourneyEvent, writeAudit } from './audit.ts';

/** Điểm chính thức: mỗi bài là một record độc lập, không ghi đè lịch sử. */
export function createAssessment(p: Principal, input: any) {
  require_(p, PERMISSIONS.OFFICIAL_SCORE_EDIT, { studentId: input.studentId },
    'Bạn không có quyền nhập điểm kiểm tra chính thức cho học viên này.');
  if (!['entrance', 'mock', 'progress', 'final'].includes(input.testType)) throw badRequest('Loại bài kiểm tra không hợp lệ.');
  if (!input.testDate) throw badRequest('Cần nhập ngày kiểm tra.');
  const scale = input.scale ?? (['entrance', 'mock'].includes(input.testType) ? 'ielts' : 'score10');

  return tx(() => {
    const conn = db();
    const info = conn
      .prepare(
        `INSERT INTO assessments (student_id, enrollment_id, test_type, scale, test_date, title, note, entered_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(input.studentId, input.enrollmentId ?? null, input.testType, scale, input.testDate,
           input.title ?? null, input.note ?? null, p.userId, nowIso());
    const id = Number(info.lastInsertRowid);

    const scores = input.scores ?? {};
    for (const skill of ASSESSMENT_SKILLS) {
      const raw = scores[skill];
      if (raw === undefined || raw === null || raw === '') continue;   // skill thiếu = "Chưa có", không tạo dòng
      const value = Number(raw);
      if (!Number.isFinite(value)) throw badRequest(`Điểm ${skill} không hợp lệ.`);
      validateScale(scale, value);
      conn.prepare('INSERT INTO assessment_scores (assessment_id, skill, score) VALUES (?,?,?)').run(id, skill, value);
    }

    addJourneyEvent({
      studentId: input.studentId, enrollmentId: input.enrollmentId ?? null,
      eventType: 'assessment', eventDate: input.testDate,
      title: `${testTypeLabel(input.testType)}${input.title ? ' — ' + input.title : ''}`,
      detail: describeScores(id), refTable: 'assessments', refId: id, createdBy: p.userId,
    });
    writeAudit({
      actorUserId: p.userId, action: 'assessment.create', entityType: 'assessment', entityId: id,
      entityLabel: `${input.testType} ${input.testDate}`, studentId: input.studentId,
      after: { testType: input.testType, testDate: input.testDate, scores },
    });
    return conn.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
  });
}

function validateScale(scale: string, value: number) {
  if (scale === 'ielts' && (value < 0 || value > 9)) throw badRequest('Điểm IELTS phải trong khoảng 0–9.');
  if (scale === 'score10' && (value < 0 || value > 10)) throw badRequest('Điểm thang 10 phải trong khoảng 0–10.');
  if (scale === 'score100' && (value < 0 || value > 100)) throw badRequest('Điểm thang 100 phải trong khoảng 0–100.');
}

function testTypeLabel(t: string) {
  return { entrance: 'Entrance Test', mock: 'Mock Test', progress: 'Progress Test', final: 'Final Test' }[t] ?? t;
}

function describeScores(assessmentId: number) {
  const rows = db().prepare('SELECT skill, score FROM assessment_scores WHERE assessment_id = ?').all(assessmentId) as any[];
  if (!rows.length) return null;
  return rows.map((r) => `${r.skill}: ${r.score}`).join(' · ');
}

/** Ước lượng của giáo viên gắn với skill GIẢNG DẠY (có writing1/writing2 riêng). */
export function createEstimate(p: Principal, input: any) {
  const enr = db().prepare('SELECT * FROM enrollments WHERE id = ?').get(input.enrollmentId) as any;
  if (!enr) throw notFound('Không tìm thấy lần đăng ký học');
  if (!TEACHING_SKILLS.includes(input.teachingSkill)) throw badRequest('Skill giảng dạy không hợp lệ.');
  require_(p, PERMISSIONS.ESTIMATE_EDIT, { classId: enr.class_id, studentId: enr.student_id, skill: input.teachingSkill },
    'Bạn chỉ được nhập ước lượng cho skill mình được phân công.');
  const band = Number(input.band);
  if (!Number.isFinite(band) || band < 0 || band > 9) throw badRequest('Band ước lượng phải trong khoảng 0–9.');

  const date = input.estimateDate ?? demoToday();
  const info = db()
    .prepare(
      `INSERT INTO teacher_estimates
        (student_id, enrollment_id, teaching_skill, band, week_start, estimate_date, teacher_user_id, note, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(enr.student_id, enr.id, input.teachingSkill, band, input.weekStart ?? weekStartOf(date), date, p.userId, input.note ?? null, nowIso());
  const id = Number(info.lastInsertRowid);
  addJourneyEvent({
    studentId: enr.student_id, enrollmentId: enr.id, eventType: 'estimate', eventDate: date,
    title: `Ước lượng ${input.teachingSkill}: ${band}`, refTable: 'teacher_estimates', refId: id, createdBy: p.userId,
  });
  return id;
}

export function createWarningReference(p: Principal, input: any) {
  require_(p, PERMISSIONS.SUMMARY_EDIT, { studentId: input.studentId },
    'Chỉ GVCN của lớp hoặc quản lý trong phạm vi mới ghi nhận được cảnh báo.');
  if (!input.reason?.trim()) throw badRequest('Cần ghi lý do.');
  return tx(() => {
    const conn = db();
    const info = conn
      .prepare(
        `INSERT INTO warning_references (student_id, issued_date, level, reason, description, status, follow_up, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(input.studentId, input.issuedDate ?? demoToday(), input.level ?? 'warning',
           input.reason.trim(), input.description ?? null, input.status ?? 'open', input.followUp ?? null, p.userId, nowIso());
    const id = Number(info.lastInsertRowid);
    addJourneyEvent({
      studentId: input.studentId, eventType: 'warning_reference', eventDate: input.issuedDate ?? demoToday(),
      title: `Ghi nhận cảnh báo: ${input.reason.trim()}`, refTable: 'warning_references', refId: id, createdBy: p.userId,
    });
    writeAudit({
      actorUserId: p.userId, action: 'warning_reference.create', entityType: 'warning_reference', entityId: id,
      studentId: input.studentId, after: { level: input.level, reason: input.reason }, sensitivity: 'restricted',
    });
    return conn.prepare('SELECT * FROM warning_references WHERE id = ?').get(id);
  });
}

export function createIncidentReference(p: Principal, input: any) {
  require_(p, PERMISSIONS.SUMMARY_EDIT, { studentId: input.studentId });
  if (!input.reason?.trim()) throw badRequest('Cần ghi lý do.');
  const info = db()
    .prepare(
      `INSERT INTO incident_references (student_id, incident_date, type, reason, description, status, follow_up, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(input.studentId, input.incidentDate ?? demoToday(), input.type ?? 'other', input.reason.trim(),
         input.description ?? null, input.status ?? 'open', input.followUp ?? null, p.userId, nowIso());
  const id = Number(info.lastInsertRowid);
  addJourneyEvent({
    studentId: input.studentId, eventType: 'incident_reference', eventDate: input.incidentDate ?? demoToday(),
    title: `Ghi nhận sự việc: ${input.reason.trim()}`, refTable: 'incident_references', refId: id,
    visibility: 'internal', createdBy: p.userId,
  });
  return id;
}

export function updateWarningReference(p: Principal, id: number, patch: any) {
  const w = db().prepare('SELECT * FROM warning_references WHERE id = ?').get(id) as any;
  if (!w) throw notFound();
  require_(p, PERMISSIONS.SUMMARY_EDIT, { studentId: w.student_id });
  const map: Record<string, string> = { status: 'status', followUp: 'follow_up', description: 'description', level: 'level' };
  const sets: string[] = []; const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) { if (map[k]) { sets.push(`${map[k]} = ?`); params.push(v); } }
  if (!sets.length) return w;
  params.push(id);
  db().prepare(`UPDATE warning_references SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  writeAudit({
    actorUserId: p.userId, action: 'warning_reference.update', entityType: 'warning_reference', entityId: id,
    studentId: w.student_id, before: w, after: db().prepare('SELECT * FROM warning_references WHERE id = ?').get(id),
    sensitivity: 'restricted',
  });
  return db().prepare('SELECT * FROM warning_references WHERE id = ?').get(id);
}
