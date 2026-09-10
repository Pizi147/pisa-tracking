import { db, tx } from '../db.ts';
import {
  ENTRY_SKILLS, PERMISSIONS, type EntrySkill,
} from '../../../shared/domain.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit, addJourney } from './audit.ts';
import { cycleForDate } from './cycles.ts';
import { entryBandsOf, scoresOf } from './attempts.ts';
import { bandFromCriteria, bandFromRaw, isRawSkill } from './scoring.ts';

/**
 * GHI NHẬN NHANH của giáo viên về một kỹ năng.
 *
 * Đây là nhận định trong quá trình dạy, KHÔNG bao giờ ghi đè điểm chính thức. Giáo viên
 * ghi bất kỳ lúc nào, không đợi tuần MT và không đợi hạn nhập điểm.
 *
 * ĐIỀU KIỆN TỐI THIỂU: có NHẬN ĐỊNH hoặc có ĐIỂM ƯỚC LƯỢNG. Không bắt điền đủ nhận định
 * + điểm + điểm mạnh + điểm yếu — form dài thì giáo viên bỏ qua, và một ô trống thành
 * ra tốn công hơn là hữu ích.
 *
 * BA KIỂU CĂN CỨ, ghi rõ kiểu nào:
 *   - `judgement`: chỉ nhận định bằng lời, KHÔNG có điểm. Đây là kiểu thường gặp nhất.
 *   - `raw`: có làm một bài L/R nên có số câu đúng, hệ thống quy ra band.
 *   - `criteria`: có chấm bốn tiêu chí W/S, hệ thống tính band.
 * Không bịa raw/tiêu chí để một nhận định trông như một phép đo.
 */
export type CheckinInput = {
  studentId: number;
  skill: string;
  observedOn?: string;
  classId?: number | null;
  cycleId?: number | null;
  judgement?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  /** Kiểu căn cứ. Không gửi thì hiểu là chỉ có nhận định. */
  basis?: 'judgement' | 'raw' | 'criteria';
  band?: number | null;
  raw?: number | null;
  criteria?: (number | null)[] | null;
};

export type CheckinRow = {
  id: number; skill: EntrySkill; observedOn: string;
  cycleId: number | null; classCode: string | null;
  authorName: string | null;
  judgement: string | null; strengths: string | null; weaknesses: string | null;
  band: number | null; raw: number | null; criteria: (number | null)[] | null;
  basis: string | null;
  recordedAt: string;
};

function mapRow(r: any): CheckinRow {
  const crit = [r.c1, r.c2, r.c3, r.c4];
  return {
    id: r.id, skill: r.skill, observedOn: r.observed_on,
    cycleId: r.cycle_id ?? null, classCode: r.class_code ?? null,
    authorName: r.author_name ?? null,
    judgement: r.judgement ?? null, strengths: r.strengths ?? null, weaknesses: r.weaknesses ?? null,
    band: r.band ?? null, raw: r.raw_score ?? null,
    criteria: crit.some((c) => c !== null && c !== undefined) ? crit : null,
    basis: r.estimate_basis ?? null,
    recordedAt: r.created_at,
  };
}

const SELECT_CHECKIN = `SELECT k.*, u.full_name AS author_name, c.code AS class_code
                          FROM skill_checkins k
                          LEFT JOIN users u ON u.id = k.author_user_id
                          LEFT JOIN classes c ON c.id = k.class_id`;

export function checkinHistory(
  p: Principal, studentId: number, f: { skill?: string; cycleId?: number | null } = {},
): CheckinRow[] {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId });
  const params: unknown[] = [studentId];
  let sql = `${SELECT_CHECKIN} WHERE k.student_id = ?`;
  if (f.skill) { sql += ' AND k.skill = ?'; params.push(f.skill); }
  if (f.cycleId) { sql += ' AND k.cycle_id = ?'; params.push(f.cycleId); }
  sql += ' ORDER BY k.observed_on DESC, k.id DESC';
  return (db().prepare(sql).all(...params) as any[]).map(mapRow);
}

/**
 * Ghi nhận mới nhất của từng kỹ năng.
 *
 * Giới hạn theo lộ trình khi được truyền vào: nhận định của lộ trình trước không nói gì
 * về trình độ hiện tại ở lộ trình sau, nên trộn hai lộ trình là so sai.
 */
export function latestCheckins(studentId: number, cycleId?: number | null): Partial<Record<EntrySkill, CheckinRow>> {
  const params: unknown[] = [studentId];
  let sql = `${SELECT_CHECKIN} WHERE k.student_id = ?`;
  if (cycleId) { sql += ' AND k.cycle_id = ?'; params.push(cycleId); }
  sql += ' ORDER BY k.observed_on DESC, k.id DESC';
  const out: Partial<Record<EntrySkill, CheckinRow>> = {};
  for (const r of db().prepare(sql).all(...params) as any[]) {
    if (out[r.skill as EntrySkill]) continue;      // đã có dòng mới hơn
    out[r.skill as EntrySkill] = mapRow(r);
  }
  return out;
}

/** Kỹ năng người đang xem được ghi nhận ở lớp này. */
export function checkinSkillsFor(p: Principal, studentId: number, classId: number | null): EntrySkill[] {
  return ENTRY_SKILLS.filter((k) => can(p, PERMISSIONS.ESTIMATE_EDIT, { classId, studentId, skill: k }));
}

export function saveCheckin(p: Principal, input: CheckinInput) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  if (!(ENTRY_SKILLS as readonly string[]).includes(input.skill)) throw badRequest('Kỹ năng không hợp lệ.');

  const classId = input.classId
    ?? (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
        .get(input.studentId) as any)?.class_id
    ?? null;
  require_(p, PERMISSIONS.ESTIMATE_EDIT, { classId, studentId: input.studentId, skill: input.skill },
    'Bạn chỉ ghi nhận được kỹ năng mình được phân công.');

  const observedOn = input.observedOn ?? demoToday();
  if (!isIsoDate(observedOn)) throw badRequest('Ngày quan sát không hợp lệ.');
  if (observedOn > demoToday()) throw badRequest('Không ghi nhận cho một ngày chưa tới.');

  const judgement = (input.judgement ?? '').trim() || null;
  const strengths = (input.strengths ?? '').trim() || null;
  const weaknesses = (input.weaknesses ?? '').trim() || null;

  /*
   * Tính điểm từ CĂN CỨ, cùng công thức với điểm chính thức, để hai cột nằm trên cùng một
   * thang và trừ nhau có nghĩa. Không có căn cứ thì chấp nhận band nhận định — nhưng phải
   * được đánh dấu là nhận định, không đội lốt số đo.
   */
  let raw: number | null = null;
  let criteria: (number | null)[] = [null, null, null, null];
  let band: number | null = null;
  let basis: string | null = null;

  if (input.basis === 'raw' || (input.basis === undefined && input.raw !== undefined && input.raw !== null)) {
    if (!isRawSkill(input.skill)) throw badRequest('Chỉ Listening và Reading mới nhập theo số câu đúng.');
    if (input.raw === undefined || input.raw === null || input.raw === ('' as any)) {
      throw badRequest('Hãy nhập số câu đúng (0–40).');
    }
    raw = Number(input.raw);
    if (!Number.isInteger(raw) || raw < 0 || raw > 40) throw badRequest('Số câu đúng phải là số nguyên từ 0 đến 40.');
    band = bandFromRaw(input.skill, raw);
    basis = 'raw';
  } else if (input.basis === 'criteria' || (input.basis === undefined && input.criteria)) {
    if (isRawSkill(input.skill)) throw badRequest('Listening và Reading không chấm theo bốn tiêu chí.');
    const c = (input.criteria ?? []).slice(0, 4)
      .map((v) => (v === null || v === undefined || v === ('' as any) ? null : Number(v)));
    while (c.length < 4) c.push(null);
    for (const v of c) {
      if (v !== null && (!Number.isFinite(v) || v < 0 || v > 9)) throw badRequest('Mỗi tiêu chí phải nằm trong khoảng 0–9.');
    }
    band = bandFromCriteria(c);
    if (band === null) throw badRequest('Phải nhập đủ bốn tiêu chí thì mới tính được band.');
    criteria = c;
    basis = 'criteria';
  } else if (input.band !== undefined && input.band !== null && input.band !== ('' as any)) {
    band = Number(input.band);
    if (!Number.isFinite(band) || band < 0 || band > 9) throw badRequest('Band ước lượng phải nằm trong khoảng 0–9.');
    basis = 'judgement';
  }

  /*
   * TỐI THIỂU MỘT TRONG HAI. Một dòng không có nhận định và cũng không có điểm thì người
   * đọc sau này không rút ra được gì, chỉ làm dài lịch sử.
   */
  if (!judgement && !strengths && !weaknesses && band === null) {
    throw badRequest('Hãy viết một nhận định ngắn, hoặc nhập điểm ước lượng.');
  }

  /*
   * LỘ TRÌNH LẤY THEO NGÀY QUAN SÁT, không lấy lộ trình hiện tại một cách vô điều kiện.
   * Ghi bù một buổi của lộ trình trước mà gán vào lộ trình đang chạy là làm sai lịch sử.
   */
  const cycleId = input.cycleId ?? cycleForDate(input.studentId, observedOn)?.id ?? null;

  return tx(() => {
    const info = conn
      .prepare(
        `INSERT INTO skill_checkins (student_id, cycle_id, class_id, skill, observed_on, author_user_id,
                                     judgement, strengths, weaknesses, band, raw_score, raw_total,
                                     c1, c2, c3, c4, estimate_basis, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(input.studentId, cycleId, classId, input.skill, observedOn, p.userId,
           judgement, strengths, weaknesses, band, raw, null,
           criteria[0], criteria[1], criteria[2], criteria[3], basis, nowIso());
    const id = Number(info.lastInsertRowid);

    /*
     * Vào hành trình vì đây là một quan sát có nội dung, không phải một lần bấm lưu. Khoá
     * chống trùng theo chính dòng ghi nhận nên gửi lại cùng một dòng không nhân đôi.
     */
    addJourney({
      studentId: input.studentId, cycleId, eventType: 'checkin', eventDate: observedOn,
      title: `Ghi nhận ${input.skill}`,
      detail: judgement ?? (band !== null ? `Ước lượng ${band}` : null),
      refTable: 'skill_checkins', refId: id, createdBy: p.userId,
      dedupKey: `checkin:${id}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'checkin.save', entityType: 'skill_checkin', entityId: id,
      entityLabel: `${student.student_code} · ${input.skill}`,
      after: { skill: input.skill, observedOn, band, basis } });
    return { ...mapRow(conn.prepare(`${SELECT_CHECKIN} WHERE k.id = ?`).get(id)), cycleId };
  });
}

export type Comparison = {
  skill: EntrySkill;
  checkin: {
    band: number | null; on: string; by: string | null; basis: string | null;
    judgement: string | null; raw: number | null; criteria: (number | null)[] | null;
  } | null;
  official: {
    band: number; on: string | null; attemptNo: number; source: string;
    raw: number | null; criteria: (number | null)[] | null;
  } | null;
  /**
   * Δ = ĐIỂM CHÍNH THỨC − GHI NHẬN CỦA GIÁO VIÊN. Chỉ là KHOẢNG CÁCH giữa hai con số.
   *
   * KHÔNG phải một kết luận tốt/xấu: điểm chính thức là kết quả một bài làm trong một
   * buổi, còn ghi nhận là nhận định của giáo viên qua cả quá trình dạy. Bên nào cao hơn
   * cũng không tự nó nói lên điều gì đáng khen hay đáng lo.
   */
  delta: number | null;
};

/**
 * So GHI NHẬN mới nhất với ĐIỂM CHÍNH THỨC MỚI NHẤT CỦA CHÍNH KỸ NĂNG ĐÓ, TRONG CÙNG
 * MỘT LỘ TRÌNH.
 *
 * Hai giá trị đến từ hai thời điểm khác nhau nên luôn kèm ngày của cả hai. Chỉ trừ được
 * khi ghi nhận có điểm; ghi nhận bằng lời thì hiện lời, không quy ra số.
 */
export function compareCheckins(p: Principal, studentId: number, cycleId?: number | null): Comparison[] {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId });
  const conn = db();
  const checkins = latestCheckins(studentId, cycleId);
  const params: unknown[] = [studentId];
  let sql = `SELECT a.*, cy.seq AS cycle_seq, cy.route FROM assessment_attempts a
               JOIN learning_cycles cy ON cy.id = a.cycle_id
              WHERE a.student_id = ? AND a.status != 'cancelled'`;
  if (cycleId) { sql += ' AND a.cycle_id = ?'; params.push(cycleId); }
  sql += ' ORDER BY cy.seq DESC, a.attempt_no DESC';
  const attempts = conn.prepare(sql).all(...params) as any[];

  return ENTRY_SKILLS.map((skill) => {
    const k = checkins[skill] ?? null;
    let official: Comparison['official'] = null;
    for (const a of attempts) {
      const band = entryBandsOf(scoresOf(a.id))[skill];
      if (band === null || band === undefined) continue;
      const row = conn
        .prepare('SELECT taken_on, raw_score, c1, c2, c3, c4 FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
        .get(a.id, skill) as any;
      const crit = row ? [row.c1, row.c2, row.c3, row.c4] : [];
      official = {
        band, on: row?.taken_on ?? null, attemptNo: a.attempt_no, source: `MT${a.attempt_no}`,
        raw: row?.raw_score ?? null,
        criteria: crit.some((c: any) => c !== null && c !== undefined) ? crit : null,
      };
      break;
    }
    return {
      skill,
      checkin: k
        ? { band: k.band, on: k.observedOn, by: k.authorName, basis: k.basis,
            judgement: k.judgement, raw: k.raw, criteria: k.criteria }
        : null,
      official,
      delta: k && k.band !== null && official ? Math.round((official.band - k.band) * 10) / 10 : null,
    };
  });
}
