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
import { resultOf, weekStartOf } from '../fasttrack/attempts.ts';
import { laLopKetThuc } from '../fasttrack/hoanTat.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { announceAutoCase, createPresetPlan, isFastTrackMock, paSangKetQuaCuoi, resyncUnconfirmedPresets } from './sosAuto.ts';
import { CO_THE_KHONG_THEO_DOI, PA_QUY_CHE_CHUA_GHI, UNCONFIRMED_PRESET, dongBoTrangThaiCase, sosCaseState } from './sosState.ts';
import { closeCasesBySystem } from './systemClose.ts';
import { xoaCaseHeThong } from './cases.ts';
import { syncSosCoordination } from '../yThuc/phoiHop.ts';
import { mondayOf } from '../platform/week.ts';
import { ngayTaoLuot } from '../classes/schedule.ts';
import { taoPaBoTro } from './boTro.ts';
import { dongBoNguyenNhanMt } from './nguyenNhanO.ts';
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
  if (result.sosLevel === null && !kck) {
    /* OV-13a: lượt không còn điểm dưới kỳ vọng nào để xét (xoá hết điểm) — Case tạm của lượt xoá theo. */
    if (isFastTrackMock(attempt, scoringModeOf(attempt))) xoaCaseTamThua(p.userId, attempt.id, keHoachCaseTam(attempt, []).xoa);
    return null;
  }
  if (laMt0(attempt)) return null;   // MT0: SOS chỉ hiển thị (T5) — không tín hiệu / Case / PA / Phối hợp / thông báo
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
   * OV-1c → OV-13a (chủ SP 15/10, Q2): Mock FT CHƯA CHỐT = "SOS tạm thời" — không tín hiệu chờ, PA, Phối hợp, hạn, chuông; ô dưới kỳ vọng có điểm +
   * nhận xét thì có CASE TẠM ("Chờ chốt SOS", hiện + sửa được). Lần xét đầu tiên lượt chốt (cùng giao dịch với thao tác làm lượt chốt) chạy phần dưới:
   * Case tạm thành Case thật (hạn xác nhận từ ngày chốt) hoặc xoá hẳn (Overall đạt / kỹ năng hết dưới). Hết chốt (Bỏ vắng, khôi phục phần thi) không
   * gỡ gì đã sinh; chốt lại đi qua nhánh "tín hiệu đã nối" nên không Case trùng.
   */
  if (isFastTrackMock(attempt, scoringModeOf(attempt))) {
    if (!result.chot) { dongBoCaseTam(p.userId, attempt, result, failing, entry, detectedAt); return null; }
    xoaCaseTamThua(p.userId, attempt.id, keHoachCaseTam(attempt, failing).xoa);
  }

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
    paSangKetQuaCuoi([c.id], detectedAt, p.userId);   // OV-13a (A): kỹ năng đạt ở lượt sau → PA quy chế sang "Kết quả cuối"
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
    /* OV-13a: Case tạm của chính lượt này → lượt vừa chốt dưới kỳ vọng: thành Case thật ("Chờ xác nhận PA", hạn từ hôm nay). */
    if (open?.tam && autoCases) { chotCaseTam(p.userId, open, attempt, result.sosLevel, kck); open.tam = 0; }
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
        /* OV-12c: Case theo lượt mới → nguyên nhân = nhận xét + nhóm của ô lượt mới (lượt cũ giữ nhận xét của nó — `nguyenNhanTheoLuot`). */
        if (autoCases) dongBoNguyenNhanMt({ caseIds: [open.id] });
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
         * hạn xác nhận. OV-12c: nguyên nhân là nhận xét của ô lượt mới (đồng bộ ngay trên). Ô chưa có nhận xét (MT cũ) → PA chờ xác nhận cũ đi
         * theo lượt mới (`resyncUnconfirmedPresets`).
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
 * Case TỰ TẠO chưa có PA được xác nhận (OV-1c → OV-12c, chủ SP 14/10): chính lượt `attemptSql` mở (mốc `opened`), không thẻ "Không cần theo
 * dõi" chờ duyệt, không tệp (của Case hay PA — xoá không để mất bằng chứng), mọi PA còn sống là PA quy chế máy gán chưa ghi gì (chưa xác nhận, chưa PA GV thêm). Nguyên nhân KHÔNG còn là dấu
 * "đã đụng" — Case MT có nguyên nhân từ nhận xét ngay khi ra đời. `sc` là bí danh `sos_cases`. Dùng cho xoá SOS (em đạt lại → xoá hẳn).
 * Migrate `prOv1c` giữ luật cũ (`CASE_CHUA_DUNG_OV1C`, có điều kiện chưa nguyên nhân) — chạy lại không đổi kết quả đã ra.
 */
export const CASE_CHUA_DUNG = (sc = 'sc', attemptSql = '?') => `(${sc}.status != 'done'
  AND EXISTS (SELECT 1 FROM case_milestones m_o WHERE m_o.case_id = ${sc}.id AND m_o.kind = 'opened' AND m_o.attempt_id = ${attemptSql})
  AND NOT ${CO_THE_KHONG_THEO_DOI(sc)}
  AND NOT EXISTS (SELECT 1 FROM attachments t_o WHERE (t_o.owner_type = 'sos_case' AND t_o.owner_id = ${sc}.id)
    OR (t_o.owner_type = 'case_intervention' AND t_o.owner_id IN (SELECT iv_t.id FROM case_interventions iv_t WHERE iv_t.case_id = ${sc}.id)))
  AND NOT EXISTS (SELECT 1 FROM case_interventions iv_o WHERE iv_o.case_id = ${sc}.id AND iv_o.status != 'cancelled' AND NOT ${PA_QUY_CHE_CHUA_GHI('iv_o')}))`;
/** Luật OV-1c nguyên bản (thêm "chưa nguyên nhân") — chỉ cho migrate `prOv1c` / `kiem-truoc-ov1c`. */
export const CASE_CHUA_DUNG_OV1C = (sc = 'sc', attemptSql = '?') => `(${CASE_CHUA_DUNG(sc, attemptSql)}
  AND NOT EXISTS (SELECT 1 FROM case_issues ci_o WHERE ci_o.case_id = ${sc}.id AND ci_o.role = 'primary'))`;

/** Case đang mở của các kỹ năng `failing` đang theo lượt này (`attempt_id`, nối tín hiệu của lượt — CHỈ ĐỌC): `dong` = chưa ai đụng, `giu` = đã có người làm. Dùng chung với `kiem-truoc-ov1c`. */
export function caseXoaSos(attemptId: number, failing: readonly string[], dieuKien = CASE_CHUA_DUNG): { dong: number[]; giu: number[] } {
  const cats = [...new Set(failing.map((k) => categoryOf(k)).filter(Boolean))] as string[];
  if (!cats.length) return { dong: [], giu: [] };
  const ds = db().prepare(
    `SELECT DISTINCT sc.id, ${dieuKien('sc', '?')} AS chua_dung FROM case_signals g JOIN sos_cases sc ON sc.id = g.case_id
      WHERE g.attempt_id = ? AND g.status = 'linked' AND sc.status != 'done' AND sc.attempt_id = g.attempt_id
        AND sc.category IN (${cats.map(() => '?').join(',')}) ORDER BY sc.id`,
  ).all(attemptId, attemptId, ...cats) as { id: number; chua_dung: number }[];
  return { dong: ds.filter((c) => c.chua_dung).map((c) => c.id), giu: ds.filter((c) => !c.chua_dung).map((c) => c.id) };
}

/**
 * XOÁ SOS (OV-1c, đặc tả 3.2.3): lượt đã chốt có Case, rồi kỹ năng dời có điểm và Overall thành ≥ kỳ vọng. Case của các kỹ năng còn dưới
 * kỳ vọng nối với lượt này: OV-12c (chủ SP 14/10) chưa có PA được xác nhận → XOÁ HẲN (thu hồi tín hiệu trước; trượt lại thì tín hiệu mở lại,
 * sinh Case mới; GV muốn theo dõi thì + Case tay); đã có PA được xác nhận / GV thêm → GIỮ, ghi mốc "Overall đã đạt" để GV tự đóng. Phối hợp còn
 * chờ do `syncSosCoordination(…, 0)` bỏ. Chạy lặp vô hại. Gọi trong giao dịch của nơi gọi (`refreshOutcome`, migrate).
 * `luatOv1c`: migrate `prOv1c` chạy lại — luật cũ (chưa nguyên nhân mới là "chưa đụng") và ĐÓNG "Overall đạt" thay xoá.
 */
export function xoaSosOverallDat(actor: number | null, attempt: any, result: AttemptResult, failing: readonly string[], luatOv1c = false) {
  const conn = db();
  const { dong, giu } = caseXoaSos(attempt.id, failing, luatOv1c ? CASE_CHUA_DUNG_OV1C : CASE_CHUA_DUNG);
  const on = demoToday();
  if (dong.length) {
    conn.prepare(
      `UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ?
        WHERE attempt_id = ? AND status = 'linked' AND case_id IN (${dong.map(() => '?').join(',')})`,
    ).run(SYSTEM_CLOSE_REASON_LABEL.overall_dat, nowIso(), attempt.id, ...dong);
    if (luatOv1c) closeCasesBySystem({ actorUserId: actor, studentId: attempt.student_id, reason: 'overall_dat', on, caseIds: dong });
    else for (const id of dong) xoaCaseHeThong(conn, id, actor, `${SYSTEM_CLOSE_REASON_LABEL.overall_dat} — em đạt lại, Case chưa có PA được xác nhận`);
  }
  if (!luatOv1c && giu.length) {
    paSangKetQuaCuoi(giu, on, actor);   // OV-13a (A): Overall đạt mà Case đã có PA → PA quy chế sang "Kết quả cuối" → Hoàn thành được
    /* Case tạm "giữ" chỉ vì có tệp → đóng (không thành việc). */
    for (const r of conn.prepare(`SELECT id FROM sos_cases WHERE tam = 1 AND id IN (${giu.map(() => '?').join(',')})`).all(...giu) as any[]) dongCaseTamCoTep(actor, r.id);
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
  /** OV-13a (Q2): Case TẠM của lượt chưa chốt — chỉ Case + nguyên nhân từ ô; không hạn / PA / chuông / hành trình (lúc chốt: `chotCaseTam`). */
  tam?: boolean;
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
  if (x.tam) {
    conn.prepare('UPDATE sos_cases SET tam = 1, han_xac_nhan = NULL, kck = ?, updated_at = ? WHERE id = ?').run(x.kck ? 1 : 0, nowIso(), up.id);
    addMilestone({
      caseId: up.id, kind: 'opened', attemptId: attempt.id, attemptNo: attempt.attempt_no, band: x.band, expectation: x.expectation, sosLevel: x.sosLevel,
      occurredOn: x.detectedAt, note: 'Case tạm — chờ chốt SOS (lượt chưa đủ điểm)', createdBy: p.userId, dedupKey: `mt:${attempt.id}:${up.id}:opened`,
    });
    dongBoNguyenNhanMt({ caseIds: [up.id] });
    conn.prepare(`UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = NULL, resolved_at = ?, resolution_note = ?, updated_at = ? WHERE id = ?`)
      .run(up.id, nowIso(), 'Case tạm — lượt Mock Test chưa chốt SOS: không hạn, không PA.', nowIso(), x.signalId);
    writeAudit({ actorUserId: p.userId, action: 'case.tam', entityType: 'sos_case', entityId: up.id, entityLabel: x.skill, after: { attemptId: attempt.id, sosLevel: x.sosLevel } });
    return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(up.id);
  }
  const han = x.kck ? null : hanXacNhan(demoToday(), { sosLevel: x.sosLevel, thuong: boTro });   // OV-12c: Progress 5 ngày cố định
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
  /* OV-12c: Case MT ra đời đã có nguyên nhân = nhận xét + nhóm của ô → thẳng "Chờ xác nhận PA" (không việc / chuông / thẻ nguyên nhân). */
  if (!boTro) dongBoNguyenNhanMt({ caseIds: [up.id] });
  /* Dây nối SOS ↔ Case (Q-V3-2): tín hiệu `linked` — thu hồi khi sửa điểm (S08) dùng lại nguyên vẹn. Hạn xác nhận ở `sos_cases.han_xac_nhan`. */
  conn
    .prepare(
      `UPDATE case_signals SET status = 'linked', case_id = ?, resolved_by = NULL, resolved_at = ?,
              resolution_note = ?, updated_at = ? WHERE id = ?`,
    )
    .run(up.id, nowIso(), x.kck ? (boTro ? 'Em KCK dưới kỳ vọng — đã mở Case nhẹ (không PA Bổ trợ, không hạn), chờ GV xác nhận Case.'
        : 'Em KCK dưới kỳ vọng — đã mở Case nhẹ (không PA quy chế, không hạn), nguyên nhân từ nhận xét MT.')
      : boTro ? 'Progress Test đã tự tạo Case và PA Bổ trợ cho môn này — chờ GV xác nhận Case.'
      : 'Mock Test có SOS đã tự tạo Case và PA theo quy chế cho kỹ năng này (nguyên nhân từ nhận xét MT) — chờ xác nhận PA.', nowIso(), x.signalId);
  announceAutoCase({
    caseId: up.id, studentId: attempt.student_id, cycleId: attempt.cycle_id ?? null, skillLabel: labelOf({ skill: x.skill, programme_code: ct }),
    attemptNo: attempt.attempt_no, sosLevel: x.sosLevel, ownerUserId: open.owner_user_id ?? null,
    ...(boTro ? { ten: tenCaseThuong({ dot: 'progress', giua: `${tenMonNgan(ct, x.skill)} không đạt`, sos: x.sosLevel }), dot: 'giua-khoa' as const } : {}),
    detectedOn: x.detectedAt, hanXacNhan: han, actorUserId: p.userId, kck: x.kck,
  });
  return open;
}

// ---------------------------------------------------------------- OV-13a (chủ SP 15/10, Q2): Case tạm khi lượt chưa chốt

/**
 * KẾ HOẠCH CASE TẠM của một lượt Mock FT — CHỈ ĐỌC (lệnh `kiem-truoc-ov13a` dùng chung). `tao` = kỹ năng dưới kỳ vọng mà ô có điểm + nhận xét, chưa có Case
 * đang mở cùng hạng mục, tín hiệu chưa nối Case nào (vd Case đã "Không cần theo dõi"). `xoa` = Case tạm của lượt mà kỹ năng không còn thế (đạt, xoá điểm,
 * bỏ nhận xét) — lượt chưa chốt; lượt đã chốt cũng dọn đúng tập này (Case tạm còn lại thành Case thật ở `chotCaseTam`).
 */
export function keHoachCaseTam(attempt: { id: number; student_id: number; cycle_id?: number | null }, failing: readonly string[]): { tao: string[]; xoa: number[] } {
  const conn = db();
  const coNx = new Set((conn.prepare(`SELECT skill FROM assessment_scores WHERE attempt_id = ? AND TRIM(COALESCE(comment, '')) != ''
      AND (band IS NOT NULL OR raw_score IS NOT NULL)`).all(attempt.id) as any[]).map((r) => r.skill as string));
  const muon = failing.filter((s) => coNx.has(s) && !!categoryOf(s));
  /* `kiem-truoc-ov13a` chạy trên DB CHƯA migrate (chưa có cột `tam`) → chưa có Case tạm nào để xoá. */
  const coCot = nho('co_cot_tam', () => !!conn.prepare(`SELECT 1 FROM pragma_table_info('sos_cases') WHERE name = 'tam'`).get());
  const xoa = !coCot ? [] : (conn.prepare(`SELECT id, topic FROM sos_cases WHERE attempt_id = ? AND tam = 1 AND status != 'done'`).all(attempt.id) as any[])
    .filter((c) => !muon.includes(c.topic)).map((c) => c.id as number);
  const mo = new Set((conn.prepare(`SELECT id, category FROM sos_cases WHERE student_id = ? AND COALESCE(cycle_id, 0) = ? AND status != 'done'`)
    .all(attempt.student_id, attempt.cycle_id ?? 0) as any[]).filter((c) => !xoa.includes(c.id)).map((c) => c.category as string));
  const noi = new Set((conn.prepare(`SELECT skill FROM case_signals WHERE attempt_id = ? AND status = 'linked' AND case_id IS NOT NULL`).all(attempt.id) as any[])
    .map((r) => r.skill as string));
  return { tao: muon.filter((s) => !mo.has(categoryOf(s) as string) && !noi.has(s)), xoa };
}

/** Case tạm có tệp mà hết lý do tồn tại: KHÔNG xoá (giữ bằng chứng) — đóng lại, nhả khoá, không thành việc. */
function dongCaseTamCoTep(actor: number | null, id: number) {
  db().prepare(`UPDATE sos_cases SET tam = 0, status = 'done', closed_at = ?, dedup_key = NULL, outcome_note = ?, updated_at = ? WHERE id = ?`)
    .run(demoToday(), 'Case tạm — không còn dưới kỳ vọng khi chốt SOS; giữ vì có tệp.', nowIso(), id);
  recordChange(id, 'status', 'open', 'done', actor);
}

/** Xoá hẳn Case tạm (thu hồi tín hiệu, gỡ mốc "Tái diễn" đã ghi vào Case cũ). Case tạm có tệp → đóng, không xoá (`dongCaseTamCoTep`). */
function xoaCaseTamThua(actor: number | null, attemptId: number, ids: readonly number[]) {
  const conn = db();
  for (const id of ids) {
    if (conn.prepare(`SELECT 1 FROM attachments WHERE owner_type = 'sos_case' AND owner_id = ?`).get(id)) {
      conn.prepare(`UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ? WHERE attempt_id = ? AND case_id = ? AND status = 'linked'`)
        .run('Case tạm — kỹ năng không còn dưới kỳ vọng trước khi lượt chốt', nowIso(), attemptId, id);
      dongCaseTamCoTep(actor, id);
      continue;
    }
    conn.prepare(`UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ? WHERE attempt_id = ? AND case_id = ? AND status = 'linked'`)
      .run('Case tạm — kỹ năng không còn dưới kỳ vọng trước khi lượt chốt', nowIso(), attemptId, id);
    conn.prepare(`DELETE FROM case_milestones WHERE kind = 'recurrence' AND attempt_id = ? AND case_id = (SELECT previous_case_id FROM sos_cases WHERE id = ?)`)
      .run(attemptId, id);
    xoaCaseHeThong(conn, id, actor, 'Case tạm — kỹ năng không còn dưới kỳ vọng / chưa có nhận xét trước khi lượt chốt', 'case.xoa_tam');
  }
}

/** Đồng bộ Case tạm của lượt chưa chốt (gọi từ `raiseSignalsForResult`): xoá Case tạm thừa, sinh Case tạm còn thiếu. Trả số Case tạm vừa sinh. */
function dongBoCaseTam(actor: number | null, attempt: any, result: AttemptResult, failing: readonly string[], entry: EntryBands, detectedAt: string): string[] {
  const k = keHoachCaseTam(attempt, failing);
  xoaCaseTamThua(actor, attempt.id, k.xoa);
  for (const skill of k.tao) {
    const category = categoryOf(skill) as CaseCategory;
    const band = entry[skill as EntrySkill] ?? null;
    const signal = raiseSignal({
      actorUserId: actor, studentId: attempt.student_id, cycleId: attempt.cycle_id ?? null, attemptId: attempt.id, classId: attempt.class_id ?? null,
      skill, category, band, expectation: result.expectation, sosLevel: result.sosLevel, detectedOn: detectedAt, silent: true,
    });
    taoCaseTuDong({ userId: actor } as Principal, {
      attempt, category, skill, sosLevel: result.sosLevel, detectedAt, band, expectation: result.expectation, signalId: signal.id, kck: result.kckDuoi, tam: true,
    });
  }
  return k.tao.map((s) => `${attempt.id}:${s}`);
}

/** Lượt có thuộc luật Case tạm không (Mock FT, chưa chốt, không MT0, MT cũ trong cửa sổ, lớp chưa kết thúc) + dữ liệu cần — CHỈ ĐỌC. */
function luotCaseTam(attemptId: number): { attempt: any; result: AttemptResult; failing: string[]; entry: EntryBands; detectedAt: string } | null {
  const conn = db();
  const attempt = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!attempt || attempt.status === 'cancelled' || laMt0(attempt) || !isFastTrackMock(attempt, scoringModeOf(attempt)) || laLopKetThuc(attempt.class_id)) return null;
  const result = resultOf(attempt);
  if (result.chot || (result.sosLevel === null && !result.kckDuoi)) return null;
  if (attempt.lich_su) {
    const tuanKetThuc = attempt.planned_period_id ? (conn.prepare('SELECT week_end FROM report_periods WHERE id = ?').get(attempt.planned_period_id) as any)?.week_end ?? null : null;
    if (!luotSinhViec({ lich_su: 1, tuanKetThuc, created_at: ngayTaoLuot(attempt.created_at) })) return null;
  }
  const entry: EntryBands = {};
  for (const r of conn.prepare('SELECT skill, band FROM assessment_scores WHERE attempt_id = ?').all(attempt.id) as any[]) entry[r.skill as EntrySkill] = r.band;
  const failing = failingEntrySkills(result.expectation, entry, result.skipped) as string[];
  return { attempt, result, failing, entry, detectedAt: attempt.lich_su ? demoToday() : weekStartOf(attempt) ?? demoToday() };
}
/** Migrate `prOv13a` (e) / `kiem-truoc-ov13a`: Case tạm còn thiếu của một lượt (`ghi` = sinh luôn). Trả khoá `lượt:kỹ năng`. */
export function caseTamCuaLuot(attemptId: number, ghi: boolean): string[] {
  const l = luotCaseTam(attemptId);
  if (!l) return [];
  if (!ghi) return keHoachCaseTam(l.attempt, l.failing).tao.map((s) => `${attemptId}:${s}`);
  return dongBoCaseTam(null, l.attempt, l.result, l.failing, l.entry, l.detectedAt);
}

/**
 * Lượt CHỐT dưới kỳ vọng: Case tạm thành Case thật — hết tạm, hạn xác nhận từ HÔM NAY (`hanXacNhan`, theo mức SOS + mức gấp đã sửa), PA quy chế chờ
 * xác nhận (KCK: không), hành trình + nhật ký "Tạo Case từ SOS" như Case mới. Chuông SOS của lượt do nơi gọi gửi (`notifyTeachers`).
 */
function chotCaseTam(actor: number | null, c: any, attempt: any, sosLevel: number | null, kck: boolean) {
  const conn = db();
  const han = kck ? null : hanXacNhan(demoToday(), { sosLevel, urgency: c.urgency });
  conn.prepare('UPDATE sos_cases SET tam = 0, kck = ?, han_xac_nhan = ?, sos_level = ?, updated_at = ? WHERE id = ?').run(kck ? 1 : 0, han, sosLevel, nowIso(), c.id);
  recordChange(c.id, 'tam', '1', '0', actor);
  if (!kck) createPresetPlan({ caseId: c.id, attempt, category: c.category, sosLevel });
  dongBoNguyenNhanMt({ caseIds: [c.id] });
  dongBoTrangThaiCase(c.id);   // có PA quy chế chờ xác nhận → "Chưa xử lý" (Q28-5), như Case mới
  announceAutoCase({
    caseId: c.id, studentId: attempt.student_id, cycleId: attempt.cycle_id ?? null, skillLabel: labelOf({ skill: c.topic }),
    attemptNo: attempt.attempt_no, sosLevel, ownerUserId: c.owner_user_id ?? null, detectedOn: c.detected_at ?? demoToday(), hanXacNhan: han, actorUserId: actor, kck,
  });
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
