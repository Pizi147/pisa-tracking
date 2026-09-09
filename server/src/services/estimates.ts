import { db } from '../db.ts';
import { ENTRY_SKILLS, PERMISSIONS, type EntrySkill } from '../../../shared/domain.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from './audit.ts';
import { currentCycle } from './cycles.ts';
import { entryBandsOf, scoresOf } from './attempts.ts';

/**
 * Ước lượng của giáo viên.
 *
 * Đây là dữ liệu RIÊNG, không bao giờ ghi đè điểm Mock. Mỗi lần cập nhật ghi thêm một dòng
 * nên lịch sử có sẵn; "ước lượng mới nhất" là dòng có ngày đánh giá gần nhất.
 */
export type EstimateRow = {
  id: number; skill: EntrySkill; band: number; assessedOn: string;
  assessedByName: string | null; classCode: string | null; note: string | null;
};

export function estimateHistory(p: Principal, studentId: number, skill?: string): EstimateRow[] {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId });
  const params: unknown[] = [studentId];
  let sql = `SELECT e.*, u.full_name AS by_name, c.code AS class_code
               FROM teacher_estimates e
               LEFT JOIN users u ON u.id = e.assessed_by
               LEFT JOIN classes c ON c.id = e.class_id
              WHERE e.student_id = ?`;
  if (skill) { sql += ' AND e.skill = ?'; params.push(skill); }
  sql += ' ORDER BY e.assessed_on DESC, e.id DESC';
  return (db().prepare(sql).all(...params) as any[]).map((r) => ({
    id: r.id, skill: r.skill, band: r.band, assessedOn: r.assessed_on,
    assessedByName: r.by_name ?? null, classCode: r.class_code ?? null, note: r.note ?? null,
  }));
}

/** Ước lượng mới nhất của từng kỹ năng nhập điểm. */
export function latestEstimates(studentId: number): Partial<Record<EntrySkill, EstimateRow>> {
  const rows = db()
    .prepare(
      `SELECT e.*, u.full_name AS by_name, c.code AS class_code FROM teacher_estimates e
         LEFT JOIN users u ON u.id = e.assessed_by
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = ? ORDER BY e.assessed_on DESC, e.id DESC`,
    )
    .all(studentId) as any[];
  const out: Partial<Record<EntrySkill, EstimateRow>> = {};
  for (const r of rows) {
    if (out[r.skill as EntrySkill]) continue;    // đã có dòng mới hơn
    out[r.skill as EntrySkill] = {
      id: r.id, skill: r.skill, band: r.band, assessedOn: r.assessed_on,
      assessedByName: r.by_name ?? null, classCode: r.class_code ?? null, note: r.note ?? null,
    };
  }
  return out;
}

export function saveEstimate(p: Principal, input: {
  studentId: number; skill: string; band: number; assessedOn?: string; classId?: number | null; note?: string | null;
}) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  if (!(ENTRY_SKILLS as readonly string[]).includes(input.skill)) throw badRequest('Kỹ năng không hợp lệ.');

  const classId = input.classId
    ?? (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
        .get(input.studentId) as any)?.class_id
    ?? null;
  require_(p, PERMISSIONS.ESTIMATE_EDIT, { classId, studentId: input.studentId, skill: input.skill },
    'Bạn chỉ ước lượng được kỹ năng mình được phân công.');

  const band = Number(input.band);
  if (!Number.isFinite(band) || band < 0 || band > 9) throw badRequest('Ước lượng phải nằm trong khoảng 0–9.');
  const assessedOn = input.assessedOn ?? demoToday();
  if (!isIsoDate(assessedOn)) throw badRequest('Ngày đánh giá không hợp lệ.');

  const cycle = currentCycle(input.studentId);
  const info = conn
    .prepare(
      `INSERT INTO teacher_estimates (student_id, cycle_id, skill, band, assessed_on, assessed_by, class_id, note, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(input.studentId, cycle?.id ?? null, input.skill, band, assessedOn, p.userId, classId, input.note ?? null, nowIso());
  writeAudit({ actorUserId: p.userId, action: 'estimate.save', entityType: 'teacher_estimate',
    entityId: Number(info.lastInsertRowid), entityLabel: `${student.student_code} · ${input.skill}`,
    after: { skill: input.skill, band, assessedOn } });
  return conn.prepare('SELECT * FROM teacher_estimates WHERE id = ?').get(Number(info.lastInsertRowid));
}

export type Comparison = {
  skill: EntrySkill;
  estimate: { band: number; on: string; by: string | null } | null;
  mock: { band: number; on: string | null; attemptNo: number; source: string } | null;
  delta: number | null;
};

/**
 * So ước lượng mới nhất với ĐIỂM MOCK MỚI NHẤT CỦA CHÍNH KỸ NĂNG ĐÓ.
 *
 * Hai giá trị có thể đến từ hai thời điểm khác nhau nên luôn kèm ngày của cả hai, và
 * điểm từng kỹ năng có thể thuộc các lượt khác nhau — vì vậy ghi rõ nguồn từng ô thay vì
 * ghép lại thành một bài Mock hay một Overall giả.
 */
export function compareEstimates(p: Principal, studentId: number): Comparison[] {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId });
  const conn = db();
  const estimates = latestEstimates(studentId);
  const attempts = conn
    .prepare(
      `SELECT a.*, cy.seq AS cycle_seq, cy.route FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE a.student_id = ? AND a.status != 'cancelled'
        ORDER BY cy.seq DESC, a.attempt_no DESC`,
    )
    .all(studentId) as any[];

  return ENTRY_SKILLS.map((skill) => {
    const est = estimates[skill] ?? null;
    let mock: Comparison['mock'] = null;
    for (const a of attempts) {
      const band = entryBandsOf(scoresOf(a.id))[skill];
      if (band === null || band === undefined) continue;
      const row = conn.prepare('SELECT taken_on FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
        .get(a.id, skill) as any;
      mock = {
        band, on: row?.taken_on ?? null, attemptNo: a.attempt_no,
        source: `${a.route ? `${a.route} · ` : ''}MT${a.attempt_no}`,
      };
      break;
    }
    return {
      skill,
      estimate: est ? { band: est.band, on: est.assessedOn, by: est.assessedByName } : null,
      mock,
      delta: est && mock ? Math.round((est.band - mock.band) * 10) / 10 : null,
    };
  });
}
