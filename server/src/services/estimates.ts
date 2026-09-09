import { db } from '../db.ts';
import { ENTRY_SKILLS, PERMISSIONS, type EntrySkill } from '../../../shared/domain.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from './audit.ts';
import { currentCycle } from './cycles.ts';
import { entryBandsOf, scoresOf } from './attempts.ts';
import { bandFromCriteria, bandFromRaw, isRawSkill } from './scoring.ts';

/**
 * ĐÁNH GIÁ CỦA GIÁO VIÊN về trình độ hiện tại của học viên ở kỹ năng mình phụ trách.
 *
 * Đây là dữ liệu RIÊNG, không bao giờ ghi đè điểm Mock. Mỗi lần cập nhật ghi thêm một dòng
 * nên lịch sử có sẵn; "đánh giá mới nhất" là dòng có ngày đánh giá gần nhất.
 *
 * Giáo viên cập nhật BẤT KỲ LÚC NÀO — không phụ thuộc tuần MT, hạn nhập điểm hay lịch
 * assessment. Đây là nhận định liên tục trong quá trình dạy, không phải một ô phải điền
 * theo kỳ.
 *
 * Cách nhập GIỐNG Mock (raw/40 cho L/R, bốn tiêu chí cho W/S) nên band của hai bên cùng
 * một thang và so được với nhau, thay vì một con số band trơ trọi không có căn cứ.
 */
export type EstimateRow = {
  id: number; skill: EntrySkill; band: number; assessedOn: string;
  raw: number | null; criteria: (number | null)[] | null;
  assessedByName: string | null; classCode: string | null; note: string | null;
};

/** Đọc phần căn cứ (raw hoặc bốn tiêu chí) của một dòng đánh giá. */
function detailOf(r: any): Pick<EstimateRow, 'raw' | 'criteria'> {
  const criteria = [r.c1, r.c2, r.c3, r.c4];
  return {
    raw: r.raw_score ?? null,
    criteria: criteria.some((c) => c !== null && c !== undefined) ? criteria : null,
  };
}

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
    id: r.id, skill: r.skill, band: r.band, assessedOn: r.assessed_on, ...detailOf(r),
    assessedByName: r.by_name ?? null, classCode: r.class_code ?? null, note: r.note ?? null,
  }));
}

/** Đánh giá mới nhất của từng kỹ năng nhập điểm. */
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
      id: r.id, skill: r.skill, band: r.band, assessedOn: r.assessed_on, ...detailOf(r),
      assessedByName: r.by_name ?? null, classCode: r.class_code ?? null, note: r.note ?? null,
    };
  }
  return out;
}

/**
 * Ghi một đánh giá mới.
 *
 * Nhận CĂN CỨ, không nhận band gõ tay: L/R gửi `raw` (số câu đúng trên 40), W/S gửi
 * `criteria` (bốn tiêu chí). Band do hệ thống tính, đúng cùng công thức với điểm Mock —
 * nhờ vậy cột "Đánh giá GV" và cột "Mock" nằm trên cùng một thang và trừ nhau có nghĩa.
 *
 * `band` gửi thẳng chỉ còn dùng cho dữ liệu cũ và cho việc nhập nhanh khi không có căn cứ.
 */
export function saveEstimate(p: Principal, input: {
  studentId: number; skill: string;
  raw?: number | null; criteria?: (number | null)[] | null; band?: number;
  assessedOn?: string; classId?: number | null; note?: string | null;
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
    'Bạn chỉ đánh giá được kỹ năng mình được phân công.');

  // Tính band từ căn cứ, đúng cùng công thức với điểm Mock.
  let raw: number | null = null;
  let criteria: (number | null)[] = [null, null, null, null];
  let band: number | null = null;

  if (isRawSkill(input.skill)) {
    if (input.raw !== undefined && input.raw !== null) {
      raw = Number(input.raw);
      if (!Number.isInteger(raw) || raw < 0 || raw > 40) {
        throw badRequest('Số câu đúng phải là số nguyên từ 0 đến 40.');
      }
      band = bandFromRaw(input.skill, raw);
    }
  } else if (input.criteria) {
    const c = input.criteria.slice(0, 4).map((v) => (v === null || v === undefined || v === '' as any ? null : Number(v)));
    while (c.length < 4) c.push(null);
    for (const v of c) {
      if (v !== null && (!Number.isFinite(v) || v < 0 || v > 9)) throw badRequest('Mỗi tiêu chí phải nằm trong khoảng 0–9.');
    }
    criteria = c;
    band = bandFromCriteria(c);
    if (band === null) throw badRequest('Phải nhập đủ bốn tiêu chí thì mới tính được band.');
  }

  if (band === null) {
    // Không có căn cứ thì chấp nhận band gửi thẳng, nhưng phải là band hợp lệ.
    band = Number(input.band);
    if (!Number.isFinite(band) || band < 0 || band > 9) {
      throw badRequest(isRawSkill(input.skill)
        ? 'Hãy nhập số câu đúng (0–40) để hệ thống quy ra band.'
        : 'Hãy nhập đủ bốn tiêu chí để hệ thống tính band.');
    }
  }

  const assessedOn = input.assessedOn ?? demoToday();
  if (!isIsoDate(assessedOn)) throw badRequest('Ngày đánh giá không hợp lệ.');

  const cycle = currentCycle(input.studentId);
  const info = conn
    .prepare(
      `INSERT INTO teacher_estimates (student_id, cycle_id, skill, raw_score, c1, c2, c3, c4,
                                      band, assessed_on, assessed_by, class_id, note, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(input.studentId, cycle?.id ?? null, input.skill, raw,
         criteria[0], criteria[1], criteria[2], criteria[3],
         band, assessedOn, p.userId, classId, input.note ?? null, nowIso());
  writeAudit({ actorUserId: p.userId, action: 'estimate.save', entityType: 'teacher_estimate',
    entityId: Number(info.lastInsertRowid), entityLabel: `${student.student_code} · ${input.skill}`,
    after: { skill: input.skill, band, assessedOn } });
  return conn.prepare('SELECT * FROM teacher_estimates WHERE id = ?').get(Number(info.lastInsertRowid));
}

export type Comparison = {
  skill: EntrySkill;
  estimate: {
    band: number; on: string; by: string | null;
    raw: number | null; criteria: (number | null)[] | null;
  } | null;
  mock: {
    band: number; on: string | null; attemptNo: number; source: string;
    raw: number | null; criteria: (number | null)[] | null;
  } | null;
  /**
   * Δ = ĐIỂM MOCK − ĐÁNH GIÁ GV.
   *
   * Chiều này đọc theo học viên, không theo giáo viên: dương nghĩa là em ĐANG THỂ HIỆN
   * TỐT HƠN mức giáo viên đang đánh giá; âm nghĩa là thấp hơn, tức là cần chú ý.
   * Đảo chiều lại thì màu xanh sẽ rơi vào đúng trường hợp đáng lo, nên chiều này là chiều
   * duy nhất khớp với ý nghĩa cần đọc ra.
   */
  delta: number | null;
};

/**
 * So ĐÁNH GIÁ GV mới nhất với ĐIỂM MOCK MỚI NHẤT CỦA CHÍNH KỸ NĂNG ĐÓ.
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
      const row = conn
        .prepare('SELECT taken_on, raw_score, c1, c2, c3, c4 FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
        .get(a.id, skill) as any;
      const crit = row ? [row.c1, row.c2, row.c3, row.c4] : [];
      mock = {
        band, on: row?.taken_on ?? null, attemptNo: a.attempt_no,
        // Lộ trình đã hiện ngay cạnh cột Target, nhắc lại ở đây chỉ là chữ thừa.
        source: `MT${a.attempt_no}`,
        raw: row?.raw_score ?? null,
        criteria: crit.some((c: any) => c !== null && c !== undefined) ? crit : null,
      };
      break;
    }
    return {
      skill,
      estimate: est
        ? { band: est.band, on: est.assessedOn, by: est.assessedByName, raw: est.raw, criteria: est.criteria }
        : null,
      mock,
      delta: est && mock ? Math.round((mock.band - est.band) * 10) / 10 : null,
    };
  });
}
