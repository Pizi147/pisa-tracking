import { suggestCaseOwner } from './owner.ts';
import { db, tx } from '../db.ts';
import {
  ENTRY_SKILL_LABEL,
  SOS_LABEL, caseDedupKey, categoryOf,
  type CaseCategory, type EntrySkill, type MilestoneKind, type SosLevel,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, nowIso } from '../util.ts';
import { type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { raiseSignal, labelOf } from './signals.ts';
import { failingEntrySkills, type AttemptResult, type EntryBands } from '../fasttrack/scoring.ts';
import { weekStartOf } from '../fasttrack/attempts.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { announceAutoCase, createPresetPlan, isFastTrackMock, resyncUnconfirmedPresets } from './sosAuto.ts';
import { syncSosCoordination } from '../yThuc/phoiHop.ts';
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
 *   repeat      case đang mở mà lại trượt   → "phương án cũ chưa đạt kết quả"
 *   recurrence  case đã CHỐT KẾT THÚC mà lại trượt → "tưởng xong rồi mà hỏng lại"
 */
export function upsertCategoryCase(
  p: Principal, attempt: any, category: CaseCategory, topic: string,
  sosLevel: number | null, detectedAt: string,
): { id: number; kind: MilestoneKind } {
  const conn = db();
  const key = caseDedupKey({
    category, studentId: attempt.student_id, cycleId: attempt.cycle_id,
  });
  const existing = key
    ? (conn.prepare('SELECT * FROM sos_cases WHERE dedup_key = ?').get(key) as any)
    : null;

  const followUntil = followUntilAfter(attempt);

  if (!existing) {
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category,
                                origin_kind, detected_at, sos_level, status, dedup_key,
                                follow_until, owner_user_id, created_at)
         VALUES (?,?,?, ?,?, 'mock', ?,?, 'open', ?,?,?,?)`,
      )
      .run(attempt.id, attempt.student_id, attempt.cycle_id, topic, category,
           detectedAt, sosLevel, key, followUntil,
           /* Gợi ý người phụ trách theo phân công; không tìm được thì để trống, không gán bừa. */
           suggestCaseOwner({ classId: attempt.class_id ?? null, category }),
           nowIso());
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
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category,
                                origin_kind, detected_at, sos_level, status, dedup_key,
                                follow_until, previous_case_id, owner_user_id, created_at)
         VALUES (?,?,?, ?,?, 'mock', ?,?, 'open', ?,?,?,?,?)`,
      )
      .run(attempt.id, attempt.student_id, attempt.cycle_id, topic, category,
           detectedAt, sosLevel, key, followUntil, existing.id,
           /* Case tái phát thừa kế người phụ trách của case cũ nếu người đó còn dạy lớp. */
           existing.owner_user_id
             ?? suggestCaseOwner({ classId: attempt.class_id ?? null, category }),
           nowIso());
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
 * KẾT QUẢ MỘT ĐỢT ĐÁNH GIÁ SINH RA TÍN HIỆU — KHÔNG SINH CASE, KHÔNG SINH PHƯƠNG ÁN.
 *
 * Đây là thay đổi lớn nhất của vòng 7 trong luồng SOS (mục 6.2). Trước đây hàm này tự mở
 * case hoàn chỉnh cho từng môn trượt, và tự sinh một phương án "xếp tự học" hoặc "học tutor".
 * Tất cả đã bị bỏ. (SOS chỉ sinh từ Mock Test và chỉ thuộc Học thuật — từ 21/09/2026 không còn
 * tín hiệu Ý thức/Khác nào.)
 *
 * Lý do bỏ, nói gọn: máy đọc được "band 5.5 < kỳ vọng 6.0", nhưng nó không biết VÌ SAO và
 * không xếp được tutor thay người. Những case và phương án tự sinh ấy làm bảng tổng hợp đầy
 * số mà không có một việc thật nào đứng sau.
 *
 * Nay hàm làm đúng hai việc:
 *
 *   1. Ghi mốc "đã đạt kỳ vọng" vào case đang mở của hạng mục lần này đã đạt, hạ mức về 0 —
 *      nhưng KHÔNG tự đóng case. Một lần đạt chưa chứng minh vấn đề đã hết.
 *   2. Với môn dưới kỳ vọng: nếu hạng mục ĐÃ CÓ case đang mở thì thêm một mốc vào chính case
 *      đó và gắn tín hiệu vào nó — "không mặc định thêm case/phương án mới". Nếu chưa có
 *      case nào thì ghi một TÍN HIỆU CHỜ XÁC MINH, giao cho giáo viên bộ môn, hạn ba ngày.

 * Case đã ĐÓNG mà trượt lại cũng chỉ ra tín hiệu: mở case mới nối vào case cũ là một quyết
 * định có chủ đích của người dạy, không phải phản xạ của máy.
 */
export function raiseSignalsForResult(p: Principal, attempt: any, result: AttemptResult) {
  if (result.sosLevel === null) return null;
  const conn = db();
  const rows = conn
    .prepare('SELECT skill, band FROM assessment_scores WHERE attempt_id = ?')
    .all(attempt.id) as any[];
  const entry: EntryBands = {};
  for (const r of rows) entry[r.skill as EntrySkill] = r.band;
  const failing = failingEntrySkills(result.expectation, entry, result.skipped);

  /*
   * NGÀY PHÁT HIỆN = thứ Hai của TUẦN THI. Đây là ngày NGHIỆP VỤ của kết quả.
   * Nó KHÁC ngày ghi nhận tín hiệu (hôm nay) — và hạn ba ngày đếm từ ngày ghi nhận, không
   * từ ngày này, để điểm nhập muộn không làm giáo viên quá hạn ngay lúc điểm vừa công bố.
   */
  const detectedAt = weekStartOf(attempt) ?? demoToday();

  /*
   * PHỐI HỢP SOS (rulebook v3, P01–P03) — CHỈ Mock Test FT. Đồng bộ TRƯỚC các lối thoát sớm bên dưới: SOS hết (mức 0) cũng phải tự bỏ những việc
   * điền sẵn chưa làm (P03). Điểm sửa qua sửa lại thì việc theo mức SOS thật; việc đã xong không bao giờ bị xoá.
   */
  if (isFastTrackMock(attempt, scoringModeOf(attempt))) syncSosCoordination(attempt, result.sosLevel);

  /*
   * HẠNG MỤC ĐÃ ĐẠT LẦN NÀY: ghi mốc "đã đạt kỳ vọng" và hạ mức, nhưng KHÔNG tự đóng case.
   *
   * Một lần đạt chưa chứng minh vấn đề đã hết, và đóng hộ người ta thì mất luôn cơ hội ghi
   * lại phương án nào đã ăn thua. Người có thẩm quyền chốt kết quả, máy chỉ đưa tin.
   */
  const failingCats = new Set(failing.map((sk) => categoryOf(sk)).filter(Boolean) as string[]);
  const openHere = conn
    .prepare(
      `SELECT * FROM sos_cases
        WHERE student_id = ? AND COALESCE(cycle_id, 0) = ? AND status != 'done'`,
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
    return null;
  }

  /*
   * RULEBOOK v3 (21/09/2026 tối, S01): CHỈ lượt Mock Test FAST TRACK mới TỰ TẠO case cho kỹ năng trượt mà chưa có case đang mở. Lớp Normal
   * (Progress/Final, chấm theo tỷ lệ) giữ nguyên mô hình tín hiệu cũ — Q-V3-1. Đây là cái công tắc duy nhất giữa hai mô hình.
   */
  const autoCases = isFastTrackMock(attempt, scoringModeOf(attempt));
  const followUntil = followUntilAfter(attempt);

  const raised: { skill: string; signalId: number; linkedCaseId: number | null }[] = [];
  for (const skill of failing) {
    const category = categoryOf(skill);
    if (!category) continue;
    const band = entry[skill] ?? null;

    /*
     * CASE ĐANG MỞ CHO HẠNG MỤC NÀY thì tín hiệu về thẳng case đó — không mở case thứ hai,
     * không sinh phương án. Vấn đề vẫn là vấn đề cũ; cái mới chỉ là một bằng chứng nữa.
     */
    let open = openHere.find((c) => c.category === category) ?? null;
    const signal = raiseSignal({
      actorUserId: p.userId,
      studentId: attempt.student_id, cycleId: attempt.cycle_id ?? null,
      attemptId: attempt.id, classId: attempt.class_id ?? null,
      skill, category,
      band, expectation: result.expectation, sosLevel: result.sosLevel,
      detectedOn: detectedAt,
      /* Mock FT: tín hiệu được gắn NGAY vào một case, nên không có gì để "xác minh" — không báo. */
      silent: autoCases,
    });

    /*
     * CHƯA CÓ CASE ĐANG MỞ → SOS TỰ TẠO (S01), mỗi kỹ năng trượt một case, W1/W2 tách (S02 — `failing` đã là kết quả của luật hai tầng nên
     * không bao giờ có case "Writing tổng"). Case đã ĐÓNG mà trượt lại thì `upsertCategoryCase` mở case mới NỐI vào case cũ.
     * Case mới có sẵn phương án theo bảng MT × mức SOS, chờ GVBM xác nhận (S03).
     */
    let created = false;
    if (!open && autoCases) {
      const up = upsertCategoryCase(p, attempt, category, skill, result.sosLevel, detectedAt);
      open = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(up.id) as any;
      openHere.push(open);
      created = true;
      addMilestone({
        caseId: up.id, kind: 'opened', attemptId: attempt.id, attemptNo: attempt.attempt_no,
        band, expectation: result.expectation, sosLevel: result.sosLevel,
        occurredOn: detectedAt, note: 'SOS tự tạo case từ kết quả Mock Test', createdBy: p.userId,
        dedupKey: `mt:${attempt.id}:${up.id}:opened`,
      });
      createPresetPlan({ caseId: up.id, attempt, category, sosLevel: result.sosLevel, followUntil });
      /* Dây nối SOS ↔ Case (Q-V3-2): tín hiệu `linked`, giữ nguyên `verify_due` 3 ngày (S04) — thu hồi khi sửa điểm (S08) dùng lại nguyên vẹn. */
      conn
        .prepare(
          `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = NULL, resolved_at = ?,
                  resolution_note = ?, updated_at = ? WHERE id = ?`,
        )
        .run(up.id, nowIso(), 'Mock Test có SOS đã tự tạo case cho kỹ năng này — chờ GVBM xác nhận.', nowIso(), signal.id);
      announceAutoCase({
        caseId: up.id, studentId: attempt.student_id, cycleId: attempt.cycle_id ?? null, skillLabel: labelOf({ skill }),
        attemptNo: attempt.attempt_no, sosLevel: result.sosLevel, ownerUserId: open.owner_user_id ?? null,
        detectedOn: detectedAt, verifyDue: signal.verify_due, actorUserId: p.userId,
      });
    } else if (open) {
      /*
       * TÍN HIỆU ĐÃ NỐI VÀO CHÍNH CASE NÀY (chạy lặp: lưu lại điểm, nhập thêm kỹ năng khác, chấm lại) thì KHÔNG ghi thêm mốc "Trượt lại" — lượt
       * này vừa mở hoặc đã được ghi vào case rồi. Chỉ mức SOS của cả lượt là có thể đổi, và chỉ khi case còn đang theo lượt này.
       */
      const already = signal.status === 'linked' && signal.case_id === open.id;
      if (already) {
        if (open.attempt_id === attempt.id && open.sos_level !== result.sosLevel) {
          conn.prepare('UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE id = ?').run(result.sosLevel, nowIso(), open.id);
          recordChange(open.id, 'sos_level', String(open.sos_level), String(result.sosLevel), p.userId);
        }
      } else {
        addMilestone({
          caseId: open.id, kind: 'repeat', attemptId: attempt.id, attemptNo: attempt.attempt_no,
          band, expectation: result.expectation, sosLevel: result.sosLevel,
          occurredOn: detectedAt, createdBy: p.userId,
          dedupKey: `mt:${attempt.id}:${open.id}:repeat`,
        });
        conn
          .prepare(
            `UPDATE sos_cases SET attempt_id = ?, sos_level = ?,
                    follow_until = COALESCE(?, follow_until), updated_at = ? WHERE id = ?`,
          )
          .run(attempt.id, result.sosLevel, followUntil, nowIso(), open.id);
        if (open.sos_level !== result.sosLevel) {
          recordChange(open.id, 'sos_level', String(open.sos_level), String(result.sosLevel), p.userId);
        }
        /* Gắn thẳng, không qua tay người: case này đã có người phụ trách và đang chạy. */
        if (signal.status === 'pending') {
          conn
            .prepare(
              `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = ?, resolved_at = ?,
                      resolution_note = ?, updated_at = ? WHERE id = ?`,
            )
            .run(open.id, p.userId, nowIso(),
                 'Nối vào case đang mở của hạng mục này — cùng một vấn đề, thêm một bằng chứng.',
                 nowIso(), signal.id);
        }
      }
    }
    void created;
    raised.push({ skill, signalId: signal.id, linkedCaseId: open?.id ?? null });
  }

  /* Mức SOS của cả lượt có thể đã đổi: gợi ý điền sẵn CHƯA xác nhận đi theo mức mới nhất (đặc tả §4). Cái đã xác nhận không bị đụng. */
  if (autoCases) resyncUnconfirmedPresets(attempt, result.sosLevel, followUntil);

  if (raised.length) {
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
    writeAudit({ actorUserId: p.userId, action: 'signal.raised', entityType: 'assessment_attempt',
      entityId: attempt.id, entityLabel: `MT${attempt.attempt_no} SOS ${result.sosLevel}`,
      after: { level: result.sosLevel, skills: failing, signals: raised.length } });
  }
  return raised;
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
