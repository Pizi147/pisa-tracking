import { suggestCaseOwner } from './owner.ts';
import { db, tx } from '../db.ts';
import {
  ENTRY_SKILL_LABEL,
  DUOI_KY_VONG_KCK, SOS_LABEL, SYSTEM_CLOSE_REASON_LABEL, caseDedupKey, categoryOf, hanXacNhan, laMt0, luotSinhViec,
  type CaseCategory, type EntrySkill, type MilestoneKind, type SosLevel,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, nowIso } from '../util.ts';
import { type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { caseDongDoXoaSql, raiseSignal, labelOf } from './signals.ts';
import { failingEntrySkills, type AttemptResult, type EntryBands } from '../fasttrack/scoring.ts';
import { weekStartOf } from '../fasttrack/attempts.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { announceAutoCase, createPresetPlan, isFastTrackMock, resyncUnconfirmedPresets } from './sosAuto.ts';
import { CO_THE_KHONG_THEO_DOI, PA_QUY_CHE_CHUA_GHI, UNCONFIRMED_PRESET, sosCaseState } from './sosState.ts';
import { closeCasesBySystem } from './systemClose.ts';
import { syncSosCoordination } from '../yThuc/phoiHop.ts';
import { mondayOf } from '../platform/week.ts';
import { ngayTaoLuot } from '../classes/schedule.ts';
import { taoPaBoTro } from './boTro.ts';
import { soThuTuLuot, tenCaseThuong, tenMonNgan } from '../../../shared/domain/index.ts';

/**
 * Hành động phối hợp theo Lần MT × mức SOS, lấy nguyên từ 'Quy trinh SOS' của trung tâm.
 *
 * Đây là CHECKLIST cần phối hợp, không phải thứ hệ thống tự làm: SOS không tự cấp buổi học,
 * không tự lùi lịch thi, không tự đóng Case và không tự xác nhận Head.
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
    detail: byGvbmOnly ? 'GVBM trao đổi ngắn với HV' : 'GVCN + GVBM trao đổi ngắn với HV',
    required: true,
  });

  // Bảng DOCX bỏ sót bước này ở MT2 SOS3, nhưng sheet 'Quy trinh SOS' đang vận hành thì có.
  steps.push({
    key: 'talk_parent', label: 'Trao đổi với phụ huynh',
    detail: 'CS trao đổi ngắn với PH (thực hiện ngoài hệ thống, ghi lại người và ngày)',
    required: true,
  });

  let academic: string;
  if (attemptNo === 1) academic = level === 3 ? 'Học Tutor cho đến lần mock 2' : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 2)
    academic = level === 3
      ? 'Học Tutor cho đến lần mock 3 (ưu tiên) HOẶC đề xuất lùi lịch thi kèm phương án — chọn một'
      : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 5) academic = 'Bổ sung hành động chuyên môn (nguồn chưa quy định hình thức/thời lượng)';
  else academic = level === 3 ? 'Học Tutor cho đến lúc thi (ưu tiên lịch này)' : 'Học Tutor cho đến lúc thi';
  steps.push({ key: 'academic', label: 'Hỗ trợ học thuật', detail: academic, required: true });

  if (attemptNo >= 3 && level >= 2) {
    steps.push({
      key: 'ops', label: 'Chính sách vận hành',
      detail: 'P. Vận hành đưa chính sách hỗ trợ (buổi bổ trợ với Tutor / GV cơ hữu) — quyết định theo từng Case',
      required: false,
    });
  }

  let meeting: string | null = null;
  if (attemptNo === 1 && level === 3) meeting = 'GVCN meeting với HV';
  else if (attemptNo >= 2 && level === 3) meeting = 'CX / GĐCN meeting với HV';
  else if (attemptNo >= 2 && level === 2) meeting = 'GVCN meeting với HV';
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
  /* Lượt kế theo `soThuTuLuot`: lớp thường Progress → Final theo loại (Final tự tạo có thể mang attempt_no nhỏ hơn); FT theo attempt_no như cũ. */
  const next = (conn
    .prepare(
      `SELECT a.id, a.kind, a.attempt_no, p.week_start, cy.route
         FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
         LEFT JOIN report_periods p ON p.id = a.planned_period_id
        WHERE a.cycle_id = ? AND a.id != ? AND a.status != 'cancelled'`,
    )
    .all(attempt.cycle_id, attempt.id ?? -1) as any[])
    .filter((x) => (x.route || x.kind !== 'mt0') && soThuTuLuot(x, attempt) > 0)
    .sort(soThuTuLuot)[0];   // khoá lớp thường: MT0 không là lượt kế (Case Final giữ follow_until null)
  if (!next) return null;
  const anchor = next.week_start;
  if (!anchor) return null;
  return addDays(mondayOf(anchor), 6);   // hết Chủ nhật của tuần đó
}

/**
 * PR-DEPLOY (0b-3 · R5-5): Case đang mở có CHƯƠNG TRÌNH GỐC (`goc_programme_code`, ghi lúc Case mở, không đổi khi em chuyển lớp) KHÁC chương trình em đang học
 * thì lần trượt mới ở chương trình mới KHÔNG nối vào Case đó — mở Case mới. Chỉ so khi cả hai đều biết (lớp Fast Track không có mã chương trình → không đổi gì).
 */
export function caseKhacChuongTrinh(c: { goc_programme_code?: string | null }, ctMoi: string | null | undefined): boolean {
  return !!c.goc_programme_code && !!ctMoi && c.goc_programme_code !== ctMoi;
}

/** Mã chương trình của lớp (null: lớp không có mã — Fast Track — hoặc không có lớp). */
export function chuongTrinhCuaLop(classId: number | null | undefined): string | null {
  if (!classId) return null;
  return ((db().prepare('SELECT programme_code FROM classes WHERE id = ?').get(classId) as any)?.programme_code ?? null) as string | null;
}

/**
 * TÌM HOẶC MỞ CASE CHO MỘT HẠNG MỤC — và đây là chỗ vòng 4 khác hẳn vòng 3.
 *
 * Khoá gộp là `(học viên, lộ trình, hạng mục)`, KHÔNG có lượt MT trong đó. Nên MT2 trượt lại
 * Listening thì hàm này trả về ĐÚNG cái Case Listening đang có, kèm một mốc mới — chứ không
 * mở Case thứ hai. Đó chính là điều owner muốn: mở Case ra là thấy phương án cũ đã làm gì
 * và có ăn thua không.
 *
 * Ba tình huống, ba loại mốc khác nhau, vì ba thứ này người đọc cần phân biệt:
 *   opened      lần đầu
 *   repeat      Case đang mở mà lại trượt   → "phương án cũ chưa đạt kết quả"
 *   recurrence  Case đã CHỐT KẾT THÚC mà lại trượt → "tưởng xong rồi mà hỏng lại"
 */
export function upsertCategoryCase(
  p: Principal, attempt: any, category: CaseCategory, topic: string,
  sosLevel: number | null, detectedAt: string,
): { id: number; kind: MilestoneKind | 'reopened' } {
  const conn = db();
  const key = caseDedupKey({
    category, studentId: attempt.student_id, cycleId: attempt.cycle_id,
  });
  const existing = key
    ? (conn.prepare('SELECT * FROM sos_cases WHERE dedup_key = ?').get(key) as any)
    : null;

  const followUntil = followUntilAfter(attempt);

  /* PR-DEPLOY (0b-3): Case MỞ của chương trình khác (FOU "G+V" → BE "Writing") nhả khoá cho Case mới; Case cũ giữ nguyên mọi thứ, vẫn là Case "Từ lớp trước". */
  const cuaChuongTrinhKhac = !!existing && existing.status !== 'done' && caseKhacChuongTrinh(existing, chuongTrinhCuaLop(attempt.class_id));
  if (cuaChuongTrinhKhac) conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?').run(nowIso(), existing.id);

  /*
   * PR-BV (G5): NHẬP LẠI ĐIỂM SAU KHI XOÁ — Case mà lần xoá đó đóng (cùng lượt + cùng kỹ năng) MỞ LẠI, không tạo Case mới: PA bị huỷ lúc
   * xoá về trạng thái cũ, lịch sử giữ cả hai lần. Sửa thành đạt / thi lại / lượt khác vẫn theo luật dưới.
   */
  if (!existing || cuaChuongTrinhKhac || existing.status === 'done') {
    const cu = conn.prepare(
      `SELECT * FROM sos_cases sc WHERE sc.student_id = ? AND COALESCE(sc.cycle_id, 0) = ? AND sc.category = ?
          AND ${caseDongDoXoaSql('sc')} ORDER BY sc.id DESC LIMIT 1`,
    ).get(attempt.student_id, attempt.cycle_id ?? 0, category, `${attempt.id}:${topic}`) as any;
    if (cu) {
      if (existing && existing.status === 'done') conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?').run(nowIso(), existing.id);
      const truoc = (conn.prepare(`SELECT old_value FROM sos_case_history WHERE case_id = ? AND field = 'status' AND new_value = 'done' ORDER BY id DESC LIMIT 1`)
        .get(cu.id) as any)?.old_value ?? 'open';
      conn.prepare(
        `UPDATE sos_cases SET status = ?, closed_at = NULL, closed_by = NULL, outcome_note = NULL, dedup_key = ?, sos_level = ?, updated_at = ? WHERE id = ?`,
      ).run(truoc, key, sosLevel, nowIso(), cu.id);
      const paLai = conn.prepare(
        `UPDATE case_interventions SET status = substr(closed_reason, 15), closed_reason = NULL, updated_at = ?
          WHERE case_id = ? AND status = 'cancelled' AND closed_reason LIKE 'score_cleared:%'`,
      ).run(nowIso(), cu.id).changes;
      recordChange(cu.id, 'status', 'done', truoc, p.userId);
      if (cu.sos_level !== sosLevel) recordChange(cu.id, 'sos_level', String(cu.sos_level), String(sosLevel), p.userId);
      writeAudit({
        actorUserId: p.userId, action: 'case.mo_lai_xoa_diem', entityType: 'sos_case', entityId: cu.id, entityLabel: topic,
        before: { status: 'done' }, after: { status: truoc, attemptId: attempt.id, paMoLai: paLai },
      });
      return { id: cu.id, kind: 'reopened' };
    }
  }

  if (!existing || cuaChuongTrinhKhac) {
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
   * ĐÂY LÀ ĐẢO LẠI QUYẾT ĐỊNH CỦA VÒNG 4, và lý do đảo rất cụ thể: mở lại Case cũ thì phải
   * xoá kết luận đã chốt của nó, mà kết luận ấy là một quyết định có thật của một người có
   * thật, ở một thời điểm mà lúc đó nó đúng. Đè lên nó là làm hồ sơ nói dối.
   *
   * Case mới thừa kế khoá chống trùng (vì nó mới là Case đang mở của hạng mục này), còn
   * Case cũ nhả khoá ra và giữ nguyên mọi thứ nó đã có.
   *
   * Case cũ CÒN MỞ thì KHÔNG mở Case thứ hai — chỉ cập nhật mức và ghi thêm một mốc, đúng
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
           /* Case tái phát thừa kế người phụ trách của Case cũ nếu người đó còn dạy lớp. */
           existing.owner_user_id
             ?? suggestCaseOwner({ classId: attempt.class_id ?? null, category }),
           nowIso());
    const id = Number(info.lastInsertRowid);
    /* Ghi vào CASE CŨ một mốc nói rõ chuyện chưa dừng ở đó — để đọc hồ sơ là ra một mạch. */
    addMilestone({
      caseId: existing.id, kind: 'recurrence', attemptId: attempt.id,
      attemptNo: attempt.attempt_no, sosLevel, occurredOn: detectedAt,
      note: 'Tái diễn sau khi Case này đã đóng — đã mở Case mới nối tiếp',
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
 * Case hoàn chỉnh cho từng môn trượt, và tự sinh một phương án "xếp tự học" hoặc "học tutor".
 * Tất cả đã bị bỏ. (SOS chỉ sinh từ Mock Test và chỉ thuộc Học thuật — từ 21/09/2026 không còn
 * tín hiệu Ý thức/Khác nào.)
 *
 * Lý do bỏ, nói gọn: máy đọc được "band 5.5 < kỳ vọng 6.0", nhưng nó không biết VÌ SAO và
 * không xếp được tutor thay người. Những Case và phương án tự sinh ấy làm bảng tổng hợp đầy
 * số mà không có một việc thật nào đứng sau.
 *
 * Nay hàm làm đúng hai việc:
 *
 *   1. Ghi mốc "đã đạt kỳ vọng" vào Case đang mở của hạng mục lần này đã đạt, hạ mức về 0 —
 *      nhưng KHÔNG tự đóng case. Một lần đạt chưa chứng minh vấn đề đã hết.
 *   2. Với môn dưới kỳ vọng: nếu hạng mục ĐÃ CÓ Case đang mở thì thêm một mốc vào chính Case
 *      đó và gắn tín hiệu vào nó — "không mặc định thêm Case/phương án mới". Nếu chưa có
 *      Case nào thì ghi một TÍN HIỆU CHỜ XÁC MINH, giao cho giáo viên bộ môn, hạn ba ngày.

 * Case đã ĐÓNG mà trượt lại cũng chỉ ra tín hiệu: mở Case mới nối vào Case cũ là một quyết
 * định có chủ đích của người dạy, không phải phản xạ của máy.
 */
export function raiseSignalsForResult(p: Principal, attempt: any, result: AttemptResult) {
  /* OV-9: em KCK dưới kỳ vọng không có mức SOS (`sosLevel` null) nhưng vẫn mở Case nhẹ — `kck` đi suốt hàm. */
  const kck = result.kckDuoi;
  if (result.sosLevel === null && !kck) return null;
  if (laMt0(attempt)) return null;   // MT0: SOS chỉ hiển thị (T5) — không tín hiệu / Case / PA / Phối hợp / thông báo
  /*
   * OV-1c (đặc tả 3.2): Mock FT CHƯA CHỐT = "SOS tạm thời" — không tín hiệu, Case, PA, Phối hợp, hạn, chuông. Lần xét đầu tiên lượt chốt
   * (cùng giao dịch với thao tác làm lượt chốt) mới chạy phần dưới → hạn xác nhận tính từ ngày chốt. Hết chốt (Bỏ vắng, khôi phục phần
   * thi) không gỡ gì đã sinh; chốt lại đi qua đúng nhánh "tín hiệu đã nối" nên không Case trùng.
   */
  if (!result.chot && isFastTrackMock(attempt, scoringModeOf(attempt))) return null;
  const conn = db();
  /*
   * PR-S3F #3 → OV-9: lộ trình HIỆN TẠI của em có dấu KCK (`kckCuaLuot` trong `resultOf`) thì lượt — kể cả lượt đã có điểm một phần — không sinh
   * SOS / PA quy chế / Phối hợp / chuông mới: kỹ năng dưới kỳ vọng chỉ mở Case nhẹ (`kck`). Lịch sử đã có giữ nguyên.
   */
  /*
   * PR-MT (M4, M-14, K5-15): MT LỊCH SỬ chỉ sinh Case / PA quy chế / Phối hợp / thông báo khi tuần thi nằm trong 4 tuần trước ngày tạo
   * lượt. Chặn ĐÚNG MỘT CHỖ ở đầu hàm — không để tín hiệu `pending` rơi vào nhánh "silent" bên dưới.
   */
  const lichSu = !!attempt.lich_su;
  if (lichSu) {
    const tuanKetThuc = attempt.planned_period_id
      ? (conn.prepare('SELECT week_end FROM report_periods WHERE id = ?').get(attempt.planned_period_id) as any)?.week_end ?? null
      : null;
    if (!luotSinhViec({ lich_su: 1, tuanKetThuc, created_at: ngayTaoLuot(attempt.created_at) })) return null;
  }
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
  /* Q7: MT lịch sử trong cửa sổ → phát hiện HÔM NAY (thứ Hai tuần thi đã qua lâu thì hạn 3 ngày quá hạn ngay lúc nhập). */
  const detectedAt = lichSu ? demoToday() : weekStartOf(attempt) ?? demoToday();

  /*
   * PHỐI HỢP SOS (rulebook v3, P01–P03) — CHỈ Mock Test FT. Đồng bộ TRƯỚC các lối thoát sớm bên dưới: SOS hết (mức 0) cũng phải tự bỏ những việc
   * điền sẵn chưa làm (P03). Điểm sửa qua sửa lại thì việc theo mức SOS thật; việc đã xong không bao giờ bị xoá.
   */
  if (isFastTrackMock(attempt, scoringModeOf(attempt))) syncSosCoordination(attempt, kck ? 0 : result.sosLevel);   // OV-9: KCK = không Phối hợp

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

  /* OV-1c: còn kỹ năng dưới kỳ vọng mà mức 0 = Overall ≥ kỳ vọng → xoá SOS của chính lượt này. */
  if (result.sosLevel === 0 && failing.length) xoaSosOverallDat(p.userId, attempt, result, failing);
  if (result.sosLevel === 0 || !failing.length) {
    return null;
  }

  /*
   * RULEBOOK v3 (21/09/2026 tối, S01): CHỈ lượt Mock Test FAST TRACK mới TỰ TẠO Case cho kỹ năng trượt mà chưa có Case đang mở. Lớp thường
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
     * CASE ĐANG MỞ CHO HẠNG MỤC NÀY thì tín hiệu về thẳng Case đó — không mở Case thứ hai,
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
      /* Mock FT: tín hiệu được gắn NGAY vào một Case, nên không có gì để "xác minh" — không báo. */
      silent: autoCases,
    });

    /*
     * TÍN HIỆU ĐÃ NỐI VÀO MỘT CASE rồi (kể cả Case đó nay đã ĐÓNG — `Không cần theo dõi`, hay chốt kết quả thường) thì KHÔNG tạo Case mới cho chính
     * lượt này: chạy lặp (lưu lại điểm, nhập kỹ năng khác, chấm lại) không được đảo quyết định của GVBM. Case chỉ được tạo lại khi tín hiệu được MỞ LẠI
     * (bị thu hồi rồi trượt lại — `raiseSignal` xoá `case_id`), hoặc ở MỘT LƯỢT SAU (tín hiệu của lượt đó là dòng khác).
     */
    const alreadyLinked = signal.status === 'linked' && signal.case_id != null;
    if (!open && autoCases && !alreadyLinked) {
      open = taoCaseTuDong(p, {
        attempt, category, skill, sosLevel: result.sosLevel, detectedAt, band, expectation: result.expectation, signalId: signal.id, kck,
      });
      openHere.push(open);
    } else if (open) {
      /*
       * TÍN HIỆU ĐÃ NỐI VÀO CHÍNH CASE NÀY (chạy lặp: lưu lại điểm, nhập thêm kỹ năng khác, chấm lại) thì KHÔNG ghi thêm mốc "Trượt lại" — lượt
       * này vừa mở hoặc đã được ghi vào Case rồi. Chỉ mức SOS của cả lượt là có thể đổi, và chỉ khi Case còn đang theo lượt này.
       */
      const already = signal.status === 'linked' && signal.case_id === open.id;
      if (already) {
        if (!kck && open.attempt_id === attempt.id && open.sos_level !== result.sosLevel) {
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
          .run(attempt.id, kck ? open.sos_level : result.sosLevel, followUntil, nowIso(), open.id);   // OV-9: lượt KCK không đổi mức SOS của Case
        if (!kck && open.sos_level !== result.sosLevel) {
          recordChange(open.id, 'sos_level', String(open.sos_level), String(result.sosLevel), p.userId);
        }
        /* OV-9: Case nhẹ (KCK) mà lượt sau trượt theo luật SOS thường (đã bỏ KCK) → thành Case SOS: hạn xác nhận + PA quy chế chờ xác nhận. */
        if (autoCases && open.kck && !kck) {
          conn.prepare('UPDATE sos_cases SET kck = 0, han_xac_nhan = ?, updated_at = ? WHERE id = ?')
            .run(hanXacNhan(demoToday(), { sosLevel: result.sosLevel, urgency: open.urgency }), nowIso(), open.id);
          recordChange(open.id, 'kck', '1', '0', p.userId);
          createPresetPlan({ caseId: open.id, attempt, category, sosLevel: result.sosLevel });
          open.kck = 0;
        }
        /*
         * PR-SOS Q6 (S4-1, K3-16): Case FT ĐÃ có nguyên nhân mà trượt lại → thêm PA quy chế mới (chờ xác nhận) theo hàng lượt này + đặt lại
         * hạn xác nhận. Không bắt xác nhận lại nguyên nhân. Chưa có nguyên nhân → PA chờ xác nhận cũ đi theo lượt mới (`resyncUnconfirmedPresets`).
         * Đã có một PA quy chế còn chờ xác nhận → không thêm cái thứ hai (resync đưa nó theo hàng mới).
         */
        if (autoCases && !kck && sosCaseState(open.id).hasCause
            && !conn.prepare(`SELECT 1 FROM case_interventions iv WHERE iv.case_id = ? AND ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned'`).get(open.id)) {
          if (createPresetPlan({ caseId: open.id, attempt, category, sosLevel: result.sosLevel })) {
            conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(hanXacNhan(demoToday(), { sosLevel: result.sosLevel, urgency: open.urgency }), open.id);
          }
        }
        /* Gắn thẳng, không qua tay người: Case này đã có người phụ trách và đang chạy. */
        if (signal.status === 'pending') {
          conn
            .prepare(
              `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = ?, resolved_at = ?,
                      resolution_note = ?, updated_at = ? WHERE id = ?`,
            )
            .run(open.id, p.userId, nowIso(),
                 'Nối vào Case đang mở của hạng mục này — cùng một vấn đề, thêm một bằng chứng.',
                 nowIso(), signal.id);
        }
      }
    }
    raised.push({ skill, signalId: signal.id, linkedCaseId: open?.id ?? null });
  }

  /* Mức SOS của cả lượt có thể đã đổi: gợi ý điền sẵn CHƯA xác nhận đi theo mức mới nhất (đặc tả §4). Cái đã xác nhận không bị đụng. */
  if (autoCases && !kck) resyncUnconfirmedPresets(attempt, result.sosLevel);

  if (raised.length) {
    addJourney({
      studentId: attempt.student_id, cycleId: attempt.cycle_id,
      eventType: 'mock_result', eventDate: detectedAt,
      title: `MT${attempt.attempt_no}: ${kck ? DUOI_KY_VONG_KCK : SOS_LABEL[result.sosLevel!]}`,
      detail: [
        result.overall !== null ? `Overall ${result.overall}` : null,
        `kỳ vọng ${result.expectation ?? '—'}`,
        failing.map((s) => ENTRY_SKILL_LABEL[s]).join(', '),
        result.provisional ? `mới có ${result.scoredRequired}/${result.required.length} kỹ năng` : null,
      ].filter(Boolean).join(' · '),
      refTable: 'assessment_attempts', refId: attempt.id, createdBy: p.userId,
      dedupKey: `mock_result:${attempt.id}`,
    });
    if (!kck) notifyTeachers(attempt, result.sosLevel!);   // OV-9: Case nhẹ không chuông SOS cho GVCN
    writeAudit({ actorUserId: p.userId, action: 'signal.raised', entityType: 'assessment_attempt',
      entityId: attempt.id, entityLabel: `MT${attempt.attempt_no} ${kck ? 'KCK' : `SOS ${result.sosLevel}`}`,
      after: { level: result.sosLevel, skills: failing, signals: raised.length } });
  }
  return raised;
}

/**
 * Case TỰ TẠO chưa ai đụng (OV-1c, mục 8 kế hoạch): chính lượt `attemptSql` mở (mốc `opened`), chưa nguyên nhân, không thẻ "Không cần theo
 * dõi" chờ duyệt, mọi PA còn sống là PA quy chế máy gán chưa ghi gì. `sc` là bí danh `sos_cases`. Dùng chung xoá SOS và migrate `prOv1c`.
 */
export const CASE_CHUA_DUNG = (sc = 'sc', attemptSql = '?') => `(${sc}.status != 'done'
  AND EXISTS (SELECT 1 FROM case_milestones m_o WHERE m_o.case_id = ${sc}.id AND m_o.kind = 'opened' AND m_o.attempt_id = ${attemptSql})
  AND NOT EXISTS (SELECT 1 FROM case_issues ci_o WHERE ci_o.case_id = ${sc}.id AND ci_o.role = 'primary')
  AND NOT ${CO_THE_KHONG_THEO_DOI(sc)}
  AND NOT EXISTS (SELECT 1 FROM case_interventions iv_o WHERE iv_o.case_id = ${sc}.id AND iv_o.status != 'cancelled' AND NOT ${PA_QUY_CHE_CHUA_GHI('iv_o')}))`;

/** Case đang mở của các kỹ năng `failing` đang theo lượt này (`attempt_id`, nối tín hiệu của lượt — CHỈ ĐỌC): `dong` = chưa ai đụng, `giu` = đã có người làm. Dùng chung với `kiem-truoc-ov1c`. */
export function caseXoaSos(attemptId: number, failing: readonly string[]): { dong: number[]; giu: number[] } {
  const cats = [...new Set(failing.map((k) => categoryOf(k)).filter(Boolean))] as string[];
  if (!cats.length) return { dong: [], giu: [] };
  const ds = db().prepare(
    `SELECT DISTINCT sc.id, ${CASE_CHUA_DUNG('sc', '?')} AS chua_dung FROM case_signals g JOIN sos_cases sc ON sc.id = g.case_id
      WHERE g.attempt_id = ? AND g.status = 'linked' AND sc.status != 'done' AND sc.attempt_id = g.attempt_id
        AND sc.category IN (${cats.map(() => '?').join(',')}) ORDER BY sc.id`,
  ).all(attemptId, attemptId, ...cats) as { id: number; chua_dung: number }[];
  return { dong: ds.filter((c) => c.chua_dung).map((c) => c.id), giu: ds.filter((c) => !c.chua_dung).map((c) => c.id) };
}

/**
 * XOÁ SOS (OV-1c, đặc tả 3.2.3): lượt đã chốt có Case, rồi kỹ năng dời có điểm và Overall thành ≥ kỳ vọng. Case của các kỹ năng còn dưới
 * kỳ vọng nối với lượt này: chưa ai đụng → hệ thống đóng "Overall đạt" + thu hồi tín hiệu (trượt lại thì tín hiệu mở lại, sinh Case mới);
 * đã có người làm → GIỮ, ghi mốc "Overall đã đạt" để GV tự đóng. Phối hợp còn chờ do `syncSosCoordination(…, 0)` bỏ. Chạy lặp vô hại.
 * Gọi trong giao dịch của nơi gọi (`refreshOutcome`, migrate).
 */
export function xoaSosOverallDat(actor: number | null, attempt: any, result: AttemptResult, failing: readonly string[]) {
  const conn = db();
  const { dong, giu } = caseXoaSos(attempt.id, failing);
  const on = demoToday();
  if (dong.length) {
    closeCasesBySystem({ actorUserId: actor, studentId: attempt.student_id, reason: 'overall_dat', on, caseIds: dong });
    conn.prepare(
      `UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ?
        WHERE attempt_id = ? AND status = 'linked' AND case_id IN (${dong.map(() => '?').join(',')})`,
    ).run(SYSTEM_CLOSE_REASON_LABEL.overall_dat, nowIso(), attempt.id, ...dong);
  }
  for (const id of giu) {
    addMilestone({
      caseId: id, kind: 'overall_dat', attemptId: attempt.id, attemptNo: attempt.attempt_no, band: result.overall, expectation: result.expectation,
      occurredOn: on, note: `Overall ${result.overall} ≥ kỳ vọng ${result.expectation} — GV xem và tự đóng Case`, createdBy: actor,
      dedupKey: `mt:${attempt.id}:${id}:overall_dat`,
    });
  }
  return { dong, giu };
}

function recordChange(caseId: number, field: string, oldValue: string | null, newValue: string | null, actor: number | null) {
  db()
    .prepare(
      `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?)`,
    )
    .run(caseId, field, oldValue, newValue, actor, nowIso());
}

/**
 * CASE TỰ TẠO TỪ SOS (S01, S4-1) — mỗi kỹ năng trượt một Case, W1/W2 tách (S02 — `failing` đã là kết quả của luật hai tầng nên không bao giờ
 * có case "Writing tổng"). Case đã ĐÓNG mà trượt lại thì `upsertCategoryCase` mở Case mới NỐI vào Case cũ. Case mới có PA theo quy chế
 * CHỜ XÁC NHẬN (Q28-3) + hạn xác nhận 5 ngày (SOS 3: 3 ngày — `hanXacNhan`) tính từ NGÀY CASE RA ĐỜI (không phải tuần thi — K5 §4 #6).
 * Tách hàm (Q15) để PR-LT2a gọi lại với PA Bổ trợ — không đổi luật FT. Trả dòng `sos_cases`.
 * PR-LT2a: `pa: 'bo_tro'` = Giữa khoá lớp thường — PA Bổ trợ thay PA quy chế, tên `[Giữa khoá] G+V không đạt`, không nhãn SOS (`sosLevel` null).
 */
export function taoCaseTuDong(p: Principal, x: {
  attempt: any; category: CaseCategory; skill: string; sosLevel: number | null; detectedAt: string;
  band: number | null; expectation: number | null; signalId: number;
  pa?: 'quy_che' | 'bo_tro';
  /** OV-9: em KCK — Case NHẸ: không PA (quy chế / bổ trợ), không hạn xác nhận; GV vẫn xác nhận nguyên nhân (không hạn), tự thêm PA nếu cần. */
  kck?: boolean;
}): any {
  const conn = db();
  const { attempt } = x;
  const up = upsertCategoryCase(p, attempt, x.category, x.skill, x.sosLevel, x.detectedAt);
  const boTro = x.pa === 'bo_tro';
  /* PR-BV: Case mở lại sau khi nhập lại điểm — giữ hạn, mốc, PA cũ, không báo lại; chỉ nối tín hiệu vừa mở lại vào đúng Case đó. */
  if (up.kind === 'reopened') {
    conn.prepare(`UPDATE case_signals SET status = 'linked', case_id = ?, resolved_at = ?, resolution_note = ?, updated_at = ? WHERE id = ?`)
      .run(up.id, nowIso(), 'Nhập lại điểm sau khi xoá — mở lại Case cũ.', nowIso(), x.signalId);
    return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(up.id);
  }
  const han = x.kck ? null : hanXacNhan(demoToday(), { sosLevel: x.sosLevel });
  const ct = boTro ? (conn.prepare('SELECT programme_code FROM classes WHERE id = ?').get(attempt.class_id ?? 0) as any)?.programme_code ?? null : null;
  conn.prepare('UPDATE sos_cases SET han_xac_nhan = ?, kck = ? WHERE id = ?').run(han, x.kck ? 1 : 0, up.id);
  const open = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(up.id) as any;
  addMilestone({
    caseId: up.id, kind: 'opened', attemptId: attempt.id, attemptNo: attempt.attempt_no,
    band: x.band, expectation: x.expectation, sosLevel: x.sosLevel,
    occurredOn: x.detectedAt, note: x.kck ? `${boTro ? 'Progress Test' : 'Mock Test'}: em KCK dưới kỳ vọng — Case nhẹ, không PA quy chế, không hạn`
      : boTro ? 'Progress Test tự tạo Case' : 'SOS tự tạo Case từ kết quả Mock Test', createdBy: p.userId,
    dedupKey: `mt:${attempt.id}:${up.id}:opened`,
  });
  if (x.kck) { /* OV-9: Case nhẹ — không PA tự sinh */ }
  else if (boTro) taoPaBoTro(conn, { caseId: up.id, attempt, skill: x.skill, category: x.category, ct });
  else createPresetPlan({ caseId: up.id, attempt, category: x.category, sosLevel: x.sosLevel });
  /* Dây nối SOS ↔ Case (Q-V3-2): tín hiệu `linked` — thu hồi khi sửa điểm (S08) dùng lại nguyên vẹn. Hạn xác nhận ở `sos_cases.han_xac_nhan`. */
  conn
    .prepare(
      `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = NULL, resolved_at = ?,
              resolution_note = ?, updated_at = ? WHERE id = ?`,
    )
    .run(up.id, nowIso(), x.kck ? 'Em KCK dưới kỳ vọng — đã mở Case nhẹ (không PA quy chế, không hạn), chờ GVBM xác nhận nguyên nhân.'
      : boTro ? 'Progress Test đã tự tạo Case và PA Bổ trợ cho môn này — chờ GVBM xác nhận nguyên nhân.'
      : 'Mock Test có SOS đã tự tạo Case và PA theo quy chế cho kỹ năng này — chờ GVBM xác nhận nguyên nhân.', nowIso(), x.signalId);
  announceAutoCase({
    caseId: up.id, studentId: attempt.student_id, cycleId: attempt.cycle_id ?? null, skillLabel: labelOf({ skill: x.skill, programme_code: ct }),
    attemptNo: attempt.attempt_no, sosLevel: x.sosLevel, ownerUserId: open.owner_user_id ?? null,
    ...(boTro ? { ten: tenCaseThuong({ dot: 'progress', giua: `${tenMonNgan(ct, x.skill)} không đạt` }), dot: 'giua-khoa' as const } : {}),
    detectedOn: x.detectedAt, hanXacNhan: han, actorUserId: p.userId, kck: x.kck,
  });
  return open;
}

/**
 * Thông báo trong ứng dụng cho GVCN của lớp (PR-SOS K1-38, K5-15: GVBM kỹ năng trượt đã nhận thông báo Case — không gửi kép).
 * Không gửi email/Zalo ở bản demo.
 */
function notifyTeachers(attempt: any, level: SosLevel) {
  if (!attempt.class_id) return;
  const teachers = db()
    .prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND is_core = 1`)
    .all(attempt.class_id) as any[];
  const student = db().prepare('SELECT full_name, student_code FROM students WHERE id = ?').get(attempt.student_id) as any;
  for (const t of teachers) {
    notify({
      userId: t.user_id, kind: 'sos', title: `${SOS_LABEL[level]} · ${student.full_name}`,
      body: `MT${attempt.attempt_no} · ${student.student_code}`,
      entityType: 'assessment_attempt', entityId: attempt.id, dedupKey: `sos:${attempt.id}:${level}`,
    });
  }
}


/*
 * "Head xác nhận" ĐÃ BỎ khỏi luồng xử lý case.
 *
 * Đối chiếu code cũ: `confirmCase` chỉ ghi tên và ngày; nó không khoá điểm, không là điều
 * kiện để đổi trạng thái Case, không mở khoá bước nào và không gắn với một trách nhiệm
 * riêng nào. Tức là một bước duyệt không bảo vệ điều gì. Case kết thúc dựa trên chính
 * TRẠNG THÁI XỬ LÝ (chưa xử lý / đang xử lý / đã xử lý), không cần thêm một người bấm nút.
 *
 * Dữ liệu xác nhận cũ (`head_confirmed_by/at` và các dòng lịch sử) được GIỮ NGUYÊN để tra
 * lại, chỉ không còn thao tác tạo mới.
 */
