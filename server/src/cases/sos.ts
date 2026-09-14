import { db, tx } from '../db.ts';
import {
  CONTACT_KINDS, CONTACT_KIND_LABEL, ENTRY_SKILL_LABEL, INTERVENTION_KIND_LABEL, PERMISSIONS,
  SOS_LABEL, autoSupportKind, caseDedupKey, categoryOf, cycleDeadline,
  type CaseCategory, type EntrySkill, type MilestoneKind, type SosLevel,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { failingEntrySkills, type AttemptResult, type EntryBands } from '../fasttrack/scoring.ts';
import { weekStartOf } from '../fasttrack/attempts.ts';
import { mondayOf } from '../platform/week.ts';

/**
 * Hành động phối hợp theo Lần MT × mức SOS, lấy nguyên từ 'Quy trinh SOS' của trung tâm.
 *
 * Đây là CHECKLIST cần phối hợp, không phải thứ hệ thống tự làm: SOS không tự cấp buổi học,
 * không tự lùi lịch thi, không tự đóng case và không tự xác nhận Head.
 */
export type SosStep = {
  key: 'talk_student' | 'talk_parent' | 'academic' | 'ops' | 'meeting';
  label: string;
  detail: string;
  required: boolean;
};

export function stepsFor(attemptNo: number, level: SosLevel): SosStep[] {
  if (level === 0) return [];
  const steps: SosStep[] = [];

  // Ai trao đổi với học viên: SOS 2 từ MT2 trở đi là GVBM, còn lại GVCN + GVBM.
  const byGvbmOnly = level === 2 && attemptNo >= 2;
  steps.push({
    key: 'talk_student', label: 'Trao đổi với học viên',
    detail: byGvbmOnly ? 'GVBM trao đổi ngắn với HS' : 'GVCN + GVBM trao đổi ngắn với HS',
    required: true,
  });

  // Bảng DOCX bỏ sót bước này ở MT2 SOS3, nhưng sheet 'Quy trinh SOS' đang vận hành thì có.
  steps.push({
    key: 'talk_parent', label: 'Trao đổi với phụ huynh',
    detail: 'CS trao đổi ngắn với PH (thực hiện ngoài hệ thống, ghi lại người và ngày)',
    required: true,
  });

  let academic: string;
  if (attemptNo === 1) academic = level === 3 ? 'Học tutor cho đến lần mock 2' : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 2)
    academic = level === 3
      ? 'Học tutor cho đến lần mock 3 (ưu tiên) HOẶC đề xuất lùi lịch thi kèm phương án — chọn một'
      : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 5) academic = 'Bổ sung hành động chuyên môn (nguồn chưa quy định hình thức/thời lượng)';
  else academic = level === 3 ? 'Học tutor cho đến lúc thi (ưu tiên lịch này)' : 'Học tutor cho đến lúc thi';
  steps.push({ key: 'academic', label: 'Hỗ trợ học thuật', detail: academic, required: true });

  if (attemptNo >= 3 && level >= 2) {
    steps.push({
      key: 'ops', label: 'Chính sách vận hành',
      detail: 'P. Vận hành đưa chính sách hỗ trợ (buổi bổ trợ với tutor / GV cơ hữu) — quyết định theo từng case',
      required: false,
    });
  }

  let meeting: string | null = null;
  if (attemptNo === 1 && level === 3) meeting = 'GVCN meeting HS';
  else if (attemptNo >= 2 && level === 3) meeting = 'CX / GĐCN meeting HS';
  else if (attemptNo >= 2 && level === 2) meeting = 'GVCN meeting HS';
  if (meeting) {
    steps.push({ key: 'meeting', label: 'Meeting bổ sung', detail: `${meeting}: động viên, tìm hiểu nguyên nhân`, required: true });
  }
  return steps;
}

/*
 * NĂM CỘT HỖ TRỢ CŨ (trao đổi HS / trao đổi PH / hỗ trợ học thuật / chính sách / meeting)
 * KHÔNG CÒN ĐƯỜNG GHI NÀO.
 *
 * Chúng chỉ còn tồn tại trong bảng để dữ liệu cũ của trung tâm không mất, và bước nâng cấp
 * đọc chúng một lần để dựng lại thành các bản ghi tác động. Mọi việc đã làm từ nay ghi qua
 * `cases.recordIntervention` — có người thực hiện, ngày thật, trạng thái và lần xem lại,
 * là những thứ năm cột kia không tả được.
 */

/**
 * HẠN BÁO KẾT QUẢ CỦA CẢ CASE — hết CHỦ NHẬT của tuần có MT KẾ TIẾP.
 *
 * Đây là mốc thứ hai trong hai mốc owner giữ (xác nhận 13/09/2026): mốc kia là hạn LÀM từng
 * phương án (3/5/7 ngày theo mức SOS), mốc này là hạn BÁO KẾT QUẢ của cả case.
 *
 * Vì sao neo vào MT kế tiếp chứ không phải một số ngày cố định: câu hỏi "phương án vừa rồi
 * có ăn thua không" chỉ trả lời được khi có điểm mới. Ép báo trước đó thì giáo viên chỉ có
 * thể đoán.
 *
 * Chưa xếp MT kế tiếp thì KHÔNG đặt hạn — để trống là đúng sự thật, còn bịa ra một ngày thì
 * hệ thống sẽ báo quá hạn cho một việc chưa đến lúc làm được.
 */
export function followUntilAfter(attempt: any): string | null {
  const conn = db();
  const next = conn
    .prepare(
      `SELECT a.id, p.week_start
         FROM assessment_attempts a
         LEFT JOIN report_periods p ON p.id = a.planned_period_id
        WHERE a.cycle_id = ? AND a.attempt_no > ? AND a.status != 'cancelled'
        ORDER BY a.attempt_no
        LIMIT 1`,
    )
    .get(attempt.cycle_id, attempt.attempt_no) as any;
  if (!next) return null;
  const anchor = next.week_start;
  if (!anchor) return null;
  return addDays(mondayOf(anchor), 6);   // hết Chủ nhật của tuần đó
}

/**
 * TÌM HOẶC MỞ CASE CHO MỘT HẠNG MỤC — và đây là chỗ vòng 4 khác hẳn vòng 3.
 *
 * Khoá gộp là `(học viên, lộ trình, hạng mục)`, KHÔNG có lượt MT trong đó. Nên MT2 trượt lại
 * Listening thì hàm này trả về ĐÚNG cái case Listening đang có, kèm một mốc mới — chứ không
 * mở case thứ hai. Đó chính là điều owner muốn: mở case ra là thấy phương án cũ đã làm gì
 * và có ăn thua không.
 *
 * Ba tình huống, ba loại mốc khác nhau, vì ba thứ này người đọc cần phân biệt:
 *   opened      lần đầu
 *   repeat      case đang mở mà lại trượt   → "phương án cũ chưa ăn thua"
 *   recurrence  case đã CHỐT KẾT THÚC mà lại trượt → "tưởng xong rồi mà hỏng lại"
 */
export function upsertCategoryCase(
  p: Principal, attempt: any, category: CaseCategory, topic: string,
  sosLevel: number | null, detectedAt: string,
): { id: number; kind: MilestoneKind } {
  const conn = db();
  const key = caseDedupKey({
    track: 'academic', category, originKind: 'mock',
    studentId: attempt.student_id, cycleId: attempt.cycle_id, attemptId: attempt.id,
  });
  const existing = key
    ? (conn.prepare('SELECT * FROM sos_cases WHERE dedup_key = ?').get(key) as any)
    : null;

  const followUntil = followUntilAfter(attempt);

  if (!existing) {
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                                origin_kind, detected_at, sos_level, status, dedup_key,
                                follow_until, created_at)
         VALUES (?,?,?, 'academic', ?,?, 'mock', ?,?, 'open', ?,?,?)`,
      )
      .run(attempt.id, attempt.student_id, attempt.cycle_id, topic, category,
           detectedAt, sosLevel, key, followUntil, nowIso());
    return { id: Number(info.lastInsertRowid), kind: 'opened' };
  }

  /*
   * CASE ĐÃ ĐÓNG MÀ TRƯỢT LẠI → MỞ CASE MỚI, NỐI VÀO CASE CŨ (mục 7.5, vòng 5).
   *
   * ĐÂY LÀ ĐẢO LẠI QUYẾT ĐỊNH CỦA VÒNG 4, và lý do đảo rất cụ thể: mở lại case cũ thì phải
   * xoá kết luận đã chốt của nó, mà kết luận ấy là một quyết định có thật của một người có
   * thật, ở một thời điểm mà lúc đó nó đúng. Đè lên nó là làm hồ sơ nói dối.
   *
   * Case mới thừa kế khoá chống trùng (vì nó mới là case đang mở của hạng mục này), còn
   * case cũ nhả khoá ra và giữ nguyên mọi thứ nó đã có.
   *
   * Case cũ CÒN MỞ thì KHÔNG mở case thứ hai — chỉ cập nhật mức và ghi thêm một mốc, đúng
   * như bảng ở mục 7.5.
   */
  if (existing.status === 'done') {
    conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?')
      .run(nowIso(), existing.id);
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                                origin_kind, detected_at, sos_level, status, dedup_key,
                                follow_until, previous_case_id, created_at)
         VALUES (?,?,?, 'academic', ?,?, 'mock', ?,?, 'open', ?,?,?,?)`,
      )
      .run(attempt.id, attempt.student_id, attempt.cycle_id, topic, category,
           detectedAt, sosLevel, key, followUntil, existing.id, nowIso());
    const id = Number(info.lastInsertRowid);
    /* Ghi vào CASE CŨ một mốc nói rõ chuyện chưa dừng ở đó — để đọc hồ sơ là ra một mạch. */
    addMilestone({
      caseId: existing.id, kind: 'recurrence', attemptId: attempt.id,
      attemptNo: attempt.attempt_no, sosLevel, occurredOn: detectedAt,
      note: 'Tái diễn sau khi case này đã đóng — đã mở case mới nối tiếp',
      createdBy: p.userId, dedupKey: `recur-link:${existing.id}:${attempt.id}`,
    });
    return { id, kind: 'recurrence' };
  }

  conn
    .prepare(
      `UPDATE sos_cases
          SET attempt_id = ?, sos_level = ?, status = ?,
              closed_at = NULL, closed_by = NULL,
              outcome = NULL, outcome_note = NULL, outcome_decision = NULL,
              outcome_by = NULL, outcome_at = NULL,
              follow_until = COALESCE(?, follow_until),
              updated_at = ?
        WHERE id = ?`,
    )
    .run(attempt.id, sosLevel, existing.status, followUntil, nowIso(), existing.id);
  if (existing.sos_level !== sosLevel) {
    recordChange(existing.id, 'sos_level', String(existing.sos_level), String(sosLevel), p.userId);
  }
  return { id: existing.id, kind: 'repeat' };
}

/** Ghi một mốc. Chấm lại hay sửa điểm không nhân đôi nhờ khoá chống trùng. */
export function addMilestone(input: {
  caseId: number; kind: MilestoneKind; attemptId?: number | null; attemptNo?: number | null;
  band?: number | null; expectation?: number | null; sosLevel?: number | null;
  occurredOn: string; note?: string | null; createdBy?: number | null; dedupKey?: string | null;
}) {
  db()
    .prepare(
      `INSERT OR IGNORE INTO case_milestones
         (case_id, kind, attempt_id, attempt_no, band, expectation, sos_level,
          occurred_on, note, created_by, created_at, dedup_key)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(input.caseId, input.kind, input.attemptId ?? null, input.attemptNo ?? null,
         input.band ?? null, input.expectation ?? null, input.sosLevel ?? null,
         input.occurredOn, input.note ?? null, input.createdBy ?? null, nowIso(),
         input.dedupKey ?? null);
}

/**
 * MỞ / CẬP NHẬT CASE TỪ KẾT QUẢ MỘT LƯỢT ĐÁNH GIÁ.
 *
 * VÒNG 4 ĐỔI ĐƠN VỊ: một case = một HỌC VIÊN × một HẠNG MỤC, sống xuyên suốt khoá học.
 * Một lượt MT không còn "đẻ" ra case; nó chỉ THÊM MỐC vào những case đã có và mở case mới
 * cho hạng mục chưa từng có vấn đề.
 *
 * Writing xét hai tầng (xem `failingEntrySkills`): band W tổng hợp đạt thì không mở case
 * nào, kể cả khi riêng W1 dưới kỳ vọng.
 *
 * Kèm theo, mỗi lượt có SOS sinh đúng MỘT case Ý thức/Khác chứa hai việc trao đổi — đây là
 * ngoại lệ duy nhất còn gắn với một lượt MT cụ thể, vì nó là việc THÔNG BÁO cho lượt đó.
 *
 * Kết luận sinh NGAY trên phần điểm đang có, không chờ đủ mọi kỹ năng: chờ đủ nghĩa là một
 * giáo viên nhập muộn thì việc hỗ trợ học viên dừng theo.
 */
export function upsertCaseForResult(p: Principal, attempt: any, result: AttemptResult) {
  if (result.sosLevel === null) return null;
  const conn = db();
  const rows = conn
    .prepare('SELECT skill, band FROM assessment_scores WHERE attempt_id = ?')
    .all(attempt.id) as any[];
  const entry: EntryBands = {};
  for (const r of rows) entry[r.skill as EntrySkill] = r.band;
  const failing = failingEntrySkills(result.expectation, entry, result.skipped);

  /*
   * NGÀY PHÁT HIỆN = thứ Hai của TUẦN MT. Không còn ngày thi cụ thể để bám vào, và tuần
   * là đơn vị đúng: case sinh ra từ kết quả của cả một tuần MT, không của một buổi.
   */
  const detectedAt = weekStartOf(attempt) ?? demoToday();

  /*
   * HẠNG MỤC ĐÃ ĐẠT LẦN NÀY: ghi mốc "đã đạt kỳ vọng" và hạ mức, nhưng KHÔNG tự đóng case.
   *
   * Một lần đạt chưa chứng minh vấn đề đã hết, và đóng hộ người ta thì mất luôn cơ hội ghi
   * lại phương án nào đã ăn thua. Người có thẩm quyền chốt kết quả, máy chỉ đưa tin.
   */
  const failingCats = new Set(failing.map((sk) => categoryOf('academic', sk)).filter(Boolean) as string[]);
  const openHere = conn
    .prepare(
      `SELECT * FROM sos_cases
        WHERE student_id = ? AND COALESCE(cycle_id, 0) = ? AND track = 'academic' AND status != 'done'`,
    )
    .all(attempt.student_id, attempt.cycle_id ?? 0) as any[];
  for (const c of openHere) {
    if (!c.category || failingCats.has(c.category)) continue;
    const cat = c.category as CaseCategory;
    const band = entry[cat as EntrySkill] ?? null;
    if (band === null || result.expectation === null) continue;
    addMilestone({
      caseId: c.id, kind: 'passed', attemptId: attempt.id, attemptNo: attempt.attempt_no,
      band, expectation: result.expectation, sosLevel: result.sosLevel,
      occurredOn: detectedAt, createdBy: p.userId,
      dedupKey: `mt:${attempt.id}:${c.id}:passed`,
    });
    if (c.sos_level !== 0) {
      conn.prepare('UPDATE sos_cases SET sos_level = 0, updated_at = ? WHERE id = ?').run(nowIso(), c.id);
      recordChange(c.id, 'sos_level', String(c.sos_level), '0', p.userId);
    }
  }

  if (result.sosLevel === 0 || !failing.length) {
    ensureBehaviourCase(p, attempt, result.sosLevel, detectedAt);
    return null;
  }

  const touched: any[] = [];
  for (const skill of failing) {
    const category = categoryOf('academic', skill);
    if (!category) continue;
    const band = entry[skill] ?? null;
    const { id, kind } = upsertCategoryCase(p, attempt, category, skill, result.sosLevel, detectedAt);
    addMilestone({
      caseId: id, kind, attemptId: attempt.id, attemptNo: attempt.attempt_no,
      band, expectation: result.expectation, sosLevel: result.sosLevel,
      occurredOn: detectedAt, createdBy: p.userId,
      dedupKey: `mt:${attempt.id}:${id}:${kind}`,
    });
    /*
     * PHƯƠNG ÁN TỰ SINH CHO LẦN TRƯỢT NÀY. Case sống suốt khoá nên mỗi lần trượt lại phải
     * có một phương án MỚI — phương án cũ đã có kết quả rồi, và rõ ràng là chưa đủ.
     */
    autoSupportPlan(id, attempt, result.sosLevel, skill, detectedAt);
    touched.push(conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(id));
  }

  if (touched.length) {
    addJourney({
      studentId: attempt.student_id, cycleId: attempt.cycle_id,
      eventType: 'mock_result', eventDate: detectedAt,
      title: `MT${attempt.attempt_no}: ${SOS_LABEL[result.sosLevel]}`,
      detail: [
        result.overall !== null ? `Overall ${result.overall}` : null,
        `kỳ vọng ${result.expectation ?? '—'}`,
        failing.map((s) => ENTRY_SKILL_LABEL[s]).join(', '),
        result.provisional ? `mới có ${result.scoredRequired}/${result.required.length} kỹ năng` : null,
      ].filter(Boolean).join(' · '),
      refTable: 'assessment_attempts', refId: attempt.id, createdBy: p.userId,
      dedupKey: `mock_result:${attempt.id}`,
    });
    notifyTeachers(attempt, result.sosLevel);
    writeAudit({ actorUserId: p.userId, action: 'sos.open', entityType: 'sos_case',
      entityId: touched[0].id, entityLabel: `MT${attempt.attempt_no} SOS ${result.sosLevel}`,
      after: { level: result.sosLevel, skills: failing } });
  }

  ensureBehaviourCase(p, attempt, result.sosLevel, detectedAt);
  return touched[0] ?? null;
}

/**
 * CASE Ý THỨC/KHÁC TỰ SINH SAU MỘT ĐỢT MT CÓ SOS — ngoại lệ duy nhất còn gắn với một lượt.
 *
 * Nó là một case THÔNG BÁO: "em này vừa có SOS, phải cho em và phụ huynh biết". Xong cả hai
 * việc trao đổi là đóng. MT sau lại có SOS thì sinh case Ý thức/Khác MỚI — khác hẳn case
 * học thuật sống suốt khoá, vì mỗi lần trượt là một lần phải báo lại, không phải một vấn đề
 * kéo dài.
 *
 * Hai việc trao đổi nay là hai PHƯƠNG ÁN nằm ngay trong case (vòng 3a để chúng ở bảng riêng;
 * vòng 4 đảo lại). Chúng ở trạng thái đã lên kế hoạch, chưa có người thực hiện.
 */
export function ensureBehaviourCase(p: Principal, attempt: any, sosLevel: number, detectedAt: string) {
  if (!sosLevel || !attempt.student_id) return;
  const conn = db();
  const key = caseDedupKey({
    track: 'behaviour', category: 'behaviour', originKind: 'mock',
    studentId: attempt.student_id, cycleId: attempt.cycle_id, attemptId: attempt.id,
  });
  if (!key) return;

  let row = conn.prepare('SELECT * FROM sos_cases WHERE dedup_key = ?').get(key) as any;
  if (!row) {
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                                origin_kind, detected_at, sos_level, status, dedup_key,
                                follow_until, created_at)
         VALUES (?,?,?, 'behaviour', 'other', 'behaviour', 'mock', ?,?, 'open', ?,?,?)`,
      )
      .run(attempt.id, attempt.student_id, attempt.cycle_id, detectedAt, sosLevel,
           key, followUntilAfter(attempt), nowIso());
    row = { id: Number(info.lastInsertRowid) };
    addMilestone({
      caseId: row.id, kind: 'opened', attemptId: attempt.id, attemptNo: attempt.attempt_no,
      sosLevel, occurredOn: detectedAt, createdBy: p.userId,
      dedupKey: `mt:${attempt.id}:${row.id}:opened`,
    });
  } else if (row.sos_level !== sosLevel) {
    conn.prepare('UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE id = ?')
      .run(sosLevel, nowIso(), row.id);
  }

  /*
   * HẠN LÀM hai việc trao đổi: MỘT TUẦN kể từ lúc phương án bắt đầu — luật của case
   * Ý thức/Khác (mục 7.8). Việc gặp em hay gọi phụ huynh làm xong trong vài ngày; bắt chờ
   * đến Chủ nhật tuần sau mới phải báo lại là kéo dài một việc ngắn một cách vô ích.
   */
  const due = cycleDeadline(detectedAt, 'behaviour');
  for (const kind of CONTACT_KINDS) {
    conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, status, action_due,
                                         migration_key, created_at)
         VALUES (?,?,?, 'planned', ?,?,?)
         ON CONFLICT(migration_key) DO NOTHING`,
      )
      .run(row.id, kind, CONTACT_KIND_LABEL[kind], due, `auto:${attempt.id}:${kind}`, nowIso());
  }
}

/**
 * PHƯƠNG ÁN TỰ SINH THEO QUY ĐỊNH CŨ — xếp tự học, hoặc tutor từ SOS 3 và từ MT3 trở đi.
 *
 * Sinh ở trạng thái ĐÃ LÊN KẾ HOẠCH, KHÔNG có người thực hiện và KHÔNG gửi duyệt. Máy không
 * đặt tutor thay người: nó chỉ nói "theo quy định em này phải có cái này", còn ai làm và có
 * đúng là cái đó không thì GVCN xác nhận hoặc đổi.
 *
 * Mỗi LƯỢT MT một phương án riêng, khoá theo `(lượt, case)`: case sống suốt khoá nên lần
 * trượt thứ hai phải có phương án của riêng nó, còn chấm lại hay sửa điểm thì không nhân đôi.
 */
function autoSupportPlan(caseId: number, attempt: any, level: number, skill: string, detectedAt: string) {
  const kind = autoSupportKind(level, attempt.attempt_no);
  db()
    .prepare(
      `INSERT INTO case_interventions (case_id, kind, description, status, action_due,
                                       migration_key, created_at)
       VALUES (?,?,?, 'planned', ?,?,?)
       ON CONFLICT(migration_key) DO NOTHING`,
    )
    .run(caseId, kind,
         `${INTERVENTION_KIND_LABEL[kind]} cho ${ENTRY_SKILL_LABEL[skill as EntrySkill] ?? skill}`
         + ` — theo quy định khi ${SOS_LABEL[level as SosLevel]}`,
         cycleDeadline(detectedAt, 'academic'),
         `auto:${attempt.id}:${caseId}:${skill}`, nowIso());
}

function recordChange(caseId: number, field: string, oldValue: string | null, newValue: string | null, actor: number | null) {
  db()
    .prepare(
      `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?)`,
    )
    .run(caseId, field, oldValue, newValue, actor, nowIso());
}

/** Thông báo trong ứng dụng cho GVCN + GVBM của lớp. Không gửi email/Zalo ở bản demo. */
function notifyTeachers(attempt: any, level: SosLevel) {
  if (!attempt.class_id) return;
  const teachers = db()
    .prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active'`)
    .all(attempt.class_id) as any[];
  const student = db().prepare('SELECT full_name, student_code FROM students WHERE id = ?').get(attempt.student_id) as any;
  for (const t of teachers) {
    notify({
      userId: t.user_id, kind: 'sos', title: `${SOS_LABEL[level]} — ${student.full_name}`,
      body: `MT${attempt.attempt_no} · ${student.student_code}`,
      entityType: 'assessment_attempt', entityId: attempt.id, dedupKey: `sos:${attempt.id}:${level}`,
    });
  }
}


/*
 * "Head xác nhận" ĐÃ BỎ khỏi luồng xử lý case.
 *
 * Đối chiếu code cũ: `confirmCase` chỉ ghi tên và ngày; nó không khoá điểm, không là điều
 * kiện để đổi trạng thái case, không mở khoá bước nào và không gắn với một trách nhiệm
 * riêng nào. Tức là một bước duyệt không bảo vệ điều gì. Case kết thúc dựa trên chính
 * TRẠNG THÁI XỬ LÝ (chưa xử lý / đang xử lý / đã xử lý), không cần thêm một người bấm nút.
 *
 * Dữ liệu xác nhận cũ (`head_confirmed_by/at` và các dòng lịch sử) được GIỮ NGUYÊN để tra
 * lại, chỉ không còn thao tác tạo mới.
 */
