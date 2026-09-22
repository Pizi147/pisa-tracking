import { db, tx } from '../db.ts';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, academicSupportFor, reasonNeedsText, sosPlanEndDate, weeklyUpdateDue,
  type AcademicSupportPreset, type CaseDismissReason,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { suggestCaseOwner } from './owner.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { caseAccess, caseDetail, recordIntervention } from './cases.ts';
import { UNCONFIRMED_PRESET, sosCaseState } from './sosState.ts';

export { UNCONFIRMED_PRESET, NOT_UNCONFIRMED_PRESET } from './sosState.ts';

/**
 * SOS TỰ TẠO CASE — PHẦN GHI DỮ LIỆU (rulebook v3, PR-T; `thiet-ke/SOS_VA_PHOI_HOP_V3.md` mục 3–4).
 *
 * Chỉ lượt Mock Test FAST TRACK mới đi qua đây (Q-V3-1). Lớp Normal giữ mô hình tín hiệu cũ — không case tự tạo, không phương án điền
 * sẵn, không Phối hợp SOS.
 *
 * `cases/sos.ts` (nơi sở hữu `raiseSignalsForResult`) quyết định KHI NÀO tạo hay gắn case; file này lo phần "phương án điền sẵn":
 *   · dựng phương án theo bảng MT × mức SOS (`shared/domain/sos.ts`),
 *   · đồng bộ phương án CHƯA xác nhận khi mức SOS của lượt đổi,
 *   · xác nhận / thay / đóng case (S04–S07) — phần dưới.
 *
 * PHƯƠNG ÁN ĐIỀN SẴN CHƯA XÁC NHẬN chỉ là gợi ý (Q-V3-3): không vào hiệu quả, không sinh nghĩa vụ cập nhật tuần. Điều kiện SQL nhận diện nó
 * nằm ở MỘT chỗ — `UNCONFIRMED_PRESET` trong `sosState.ts`.
 */

/**
 * Lượt này có phải Mock Test Fast Track không. Chỉ lượt Mock của lớp chấm theo band mới tự tạo case / phối hợp; Progress/Final Test của
 * lớp Normal (chấm theo tỷ lệ) thì không.
 */
export function isFastTrackMock(attempt: { kind?: string | null }, scoringMode: 'band' | 'ratio'): boolean {
  return (attempt.kind ?? 'mock') === 'mock' && scoringMode === 'band';
}

/**
 * NGÀY THI DỰ KIẾN của lộ trình, chỉ khi ĐÃ CHỐT TUẦN (`examPlanOf` mức `week`): hết Chủ nhật của tuần thi. Mới biết tháng thì để TRỐNG —
 * bịa một ngày là tạo hạn giả. (Đặc tả §4: "ngày thi dự kiến nếu có".)
 */
function examDateOf(cycleId: number | null | undefined): string | null {
  if (!cycleId) return null;
  const c = db().prepare('SELECT exam_period_id, exam_month FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  const plan = examPlanOf(c);
  return plan.confidence === 'week' && plan.weekStart ? addDays(plan.weekStart, 6) : null;
}

/** Loại + mô tả + ngày dự kiến của phương án điền sẵn cho một lượt ở mức SOS đó. `null` khi không có gì để điền. */
export function presetFor(
  attempt: { attempt_no: number; cycle_id?: number | null },
  sosLevel: number | null | undefined,
  followUntil: string | null,
  /** Ngày case ra đời (mặc định hôm nay). Đồng bộ lại về sau PHẢI truyền ngày gốc — không thì "1 tháng" trôi theo ngày bấm lưu. */
  createdOn: string = demoToday(),
): (AcademicSupportPreset & { followupDue: string | null }) | null {
  const rule = academicSupportFor(attempt.attempt_no, sosLevel);
  if (!rule) return null;
  const followupDue = sosPlanEndDate(rule.span, {
    createdOn, nextMtSunday: followUntil, examDate: examDateOf(attempt.cycle_id),
  });
  return { ...rule, followupDue };
}

/**
 * DỰNG PHƯƠNG ÁN ĐIỀN SẴN CHO MỘT CASE VỪA TẠO (S03). Người thực hiện mặc định là GVBM đúng kỹ năng ở lớp em đang học.
 *
 * `action_due` để NULL và không có ngày bắt đầu: phương án chưa chạy nên chưa có nghĩa vụ cập nhật tuần (Q-V3-3); chúng chỉ có khi GVBM
 * xác nhận.
 */
export function createPresetPlan(input: {
  caseId: number;
  attempt: { attempt_no: number; cycle_id?: number | null; class_id?: number | null };
  category: string; sosLevel: number | null;
  followUntil: string | null;
}): number | null {
  const p = presetFor(input.attempt, input.sosLevel, input.followUntil);
  if (!p) return null;
  const performer = suggestCaseOwner({ classId: input.attempt.class_id ?? null, category: input.category });
  const info = db()
    .prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status,
                                       followup_due, cycle_no, needs_approval, preset, created_at)
       VALUES (?,?,?,?, NULL, 'planned', ?, 1, 0, 1, ?)`,
    )
    .run(input.caseId, p.kind, p.description, performer, p.followupDue, nowIso());
  return Number(info.lastInsertRowid);
}

/**
 * ĐỒNG BỘ PHƯƠNG ÁN ĐIỀN SẴN CHƯA XÁC NHẬN với mức SOS hiện tại của lượt đã MỞ chúng.
 *
 * Điểm thường được nhập từng kỹ năng, bởi từng GVBM, vào những lúc khác nhau — nên case đầu tiên ra đời khi lượt mới ở SOS1, trước khi
 * SOS3 xuất hiện. Đặc tả §4 nói phương án theo MỨC SOS CỦA CẢ LƯỢT, nên phần gợi ý chưa ai xác nhận phải theo mức mới nhất. Phương án ĐÃ
 * xác nhận thì không bao giờ bị đụng: đó là quyết định của một người.
 *
 * Chỉ áp cho case do CHÍNH lượt này mở (mốc `opened` của lượt) — case cũ được lượt sau "gắn" thêm mốc thì giữ nguyên phương án của nó.
 */
export function resyncUnconfirmedPresets(
  attempt: { id: number; attempt_no: number; cycle_id?: number | null },
  sosLevel: number | null,
  followUntil: string | null,
) {
  if (!presetFor(attempt, sosLevel, followUntil)) return;
  const rows = db()
    .prepare(
      `SELECT iv.id, iv.kind, iv.description, iv.followup_due,
              (SELECT MIN(g.raised_on) FROM case_signals g WHERE g.case_id = sc.id) AS raised_on
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sc.id AND m.kind = 'opened' AND m.attempt_id = ?)`,
    )
    .all(attempt.id) as any[];
  for (const iv of rows) {
    /* Ngày gốc = ngày tín hiệu nối case được ghi nhận (= ngày case ra đời), để "1 tháng" đứng yên khi lưu lại điểm sau này. */
    const p = presetFor(attempt, sosLevel, followUntil, iv.raised_on ?? demoToday())!;
    if (iv.kind === p.kind && iv.description === p.description && (iv.followup_due ?? null) === p.followupDue) continue;
    db()
      .prepare('UPDATE case_interventions SET kind = ?, description = ?, followup_due = ?, updated_at = ? WHERE id = ?')
      .run(p.kind, p.description, p.followupDue, nowIso(), iv.id);
  }
}

/** Ghi hành trình + audit + báo GVBM cho một case vừa được SOS tự tạo. */
export function announceAutoCase(input: {
  caseId: number; studentId: number; cycleId: number | null; skillLabel: string; attemptNo: number;
  sosLevel: number | null; ownerUserId: number | null; detectedOn: string; verifyDue: string; actorUserId: number | null;
}) {
  const st = db().prepare('SELECT full_name FROM students WHERE id = ?').get(input.studentId) as any;
  addJourney({
    studentId: input.studentId, cycleId: input.cycleId, eventType: 'case_opened', eventDate: input.detectedOn,
    title: `MT${input.attemptNo}: SOS tự tạo case ${input.skillLabel}`,
    detail: 'Phương án điền sẵn đang chờ GVBM xác nhận.',
    refTable: 'sos_cases', refId: input.caseId, createdBy: input.actorUserId,
    dedupKey: `case_open:${input.caseId}`,
  });
  writeAudit({
    actorUserId: input.actorUserId, action: 'case.auto_from_sos', entityType: 'sos_case', entityId: input.caseId,
    entityLabel: `${st?.full_name ?? ''} · ${input.skillLabel}`, after: { attemptNo: input.attemptNo, sosLevel: input.sosLevel },
  });
  if (input.ownerUserId) {
    notify({
      userId: input.ownerUserId, kind: 'sos',
      title: `Case mới từ SOS: ${input.skillLabel} — ${st?.full_name ?? ''}`,
      body: `Xác định nguyên nhân và xác nhận PA học thuật. Hạn ${input.verifyDue}.`,
      entityType: 'sos_case', entityId: input.caseId, dedupKey: `sos-case:${input.caseId}`,
    });
  }
}

// ---------------------------------------------------------------- xác nhận · thay · đóng (S04–S07)

const EDIT_MESSAGE = 'Bạn chỉ xử lý được case của kỹ năng mình được phân công (hoặc là Quản lý trong phạm vi).';

/** Phương án điền sẵn CHƯA xác nhận và còn xử lý được (chưa huỷ, chưa bị thay). Đã kiểm quyền theo ĐÚNG kỹ năng của case (C02). */
function loadUnconfirmedPreset(p: Principal, interventionId: number, doing: string) {
  const iv = db()
    .prepare(
      `SELECT iv.*, sc.status AS case_status FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id = ?`,
    )
    .get(interventionId) as any;
  if (!iv) throw notFound('Không tìm thấy phương án.');
  caseAccess(iv.case_id).requireEdit(p, EDIT_MESSAGE);
  if (!iv.preset) throw badRequest(`Phương án này không phải phương án điền sẵn từ SOS — không cần ${doing}.`);
  if (iv.confirmed_at) throw badRequest('Phương án này đã được xác nhận rồi.');
  if (iv.status !== 'planned' || iv.case_status === 'done') {
    throw badRequest('Phương án này đã bị huỷ hoặc case đã đóng — không còn xác nhận / thay được.');
  }
  return iv;
}

/**
 * XÁC NHẬN PHƯƠNG ÁN ĐIỀN SẴN (S04) — kèm CHỈNH nếu muốn (sửa mô tả, ngày dự kiến kết thúc).
 *
 * Từ đây case đi ĐÚNG workflow học thuật thường (S07): phương án chạy (đang thực hiện), có hạn cập nhật Chủ nhật hằng tuần, có bằng chứng,
 * điều chỉnh, đóng khi xong. Không có lớp "tiến trình SOS" riêng. Phương án ĐÃ xác nhận được coi là căn cứ độc lập khi sửa điểm (S08) —
 * xem `caseHasIndependentBasis`.
 *
 * Quyền: GVBM ĐÚNG kỹ năng của case (C02) + Quản lý trong phạm vi. Người thực hiện giữ nguyên (GVBM đúng kỹ năng); người xác nhận ghi ở `confirmed_by`.
 */
export function confirmPresetPlan(p: Principal, interventionId: number, patch: { description?: string | null; followupDue?: string | null } = {}) {
  const iv = loadUnconfirmedPreset(p, interventionId, 'xác nhận');
  let description = iv.description as string;
  if (patch.description !== undefined && patch.description !== null) {
    description = patch.description.trim();
    if (description.length < 8) throw badRequest('Mô tả ngắn phải nói rõ làm gì cho em — ít nhất 8 ký tự.');
  }
  let followupDue: string | null = iv.followup_due ?? null;
  if (patch.followupDue !== undefined) {
    if (patch.followupDue && !isIsoDate(patch.followupDue)) throw badRequest('Dự kiến kết thúc phương án không hợp lệ.');
    followupDue = patch.followupDue || null;
  }
  const today = demoToday();
  return tx(() => {
    db()
      .prepare(
        `UPDATE case_interventions
            SET description = ?, followup_due = ?, status = 'started', started_date = ?,
                cycle_no = 1, cycle_started_on = ?, action_due = ?,
                confirmed_by = ?, confirmed_at = ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(description, followupDue, today, today, weeklyUpdateDue(today), p.userId, nowIso(), nowIso(), interventionId);
    db().prepare("UPDATE sos_cases SET status = 'in_progress', updated_at = ? WHERE id = ? AND status = 'open'").run(nowIso(), iv.case_id);
    const c = db().prepare('SELECT student_id, cycle_id FROM sos_cases WHERE id = ?').get(iv.case_id) as any;
    addJourney({
      studentId: c.student_id, cycleId: c.cycle_id ?? null, eventType: 'intervention', eventDate: today,
      title: `Xác nhận phương án: ${description.slice(0, 60)}`, detail: null,
      refTable: 'case_interventions', refId: interventionId, createdBy: p.userId, dedupKey: `preset-confirm:${interventionId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.preset.confirm', entityType: 'case_intervention', entityId: interventionId,
      entityLabel: `Case ${iv.case_id} · ${iv.kind}`, before: { description: iv.description, followupDue: iv.followup_due }, after: { description, followupDue },
    });
    return caseDetail(p, iv.case_id);
  });
}

/**
 * THAY PHƯƠNG ÁN ĐIỀN SẴN bằng một phương án khác (S06): phương án cũ khép lại `superseded` + phương án mới (đã xác nhận, đang thực hiện) ra
 * đời trong MỘT giao dịch. Mới lỗi thì cũ nguyên vẹn — không bao giờ để case 0 phương án đang hoạt động.
 *
 * Phương án cũ CHƯA từng chạy nên khép bằng `cancelled` (không phải `completed`): nó không thành công cũng không thất bại, không vào hiệu quả.
 */
export function replacePresetPlan(p: Principal, interventionId: number, plan: {
  kind: string; description?: string | null;
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
  followupDue?: string | null; rescheduleTarget?: string | null;
}) {
  const iv = loadUnconfirmedPreset(p, interventionId, 'thay');
  const today = demoToday();
  return tx(() => {
    recordIntervention(p, iv.case_id, {
      kind: plan.kind, description: plan.description ?? null,
      performerSelf: plan.performerSelf, performerUserId: plan.performerUserId ?? null, performerName: plan.performerName ?? null,
      status: 'started', startedDate: today, followupDue: plan.followupDue ?? null, rescheduleTarget: plan.rescheduleTarget ?? null,
    });
    const created = (db().prepare('SELECT id FROM case_interventions WHERE case_id = ? ORDER BY id DESC LIMIT 1').get(iv.case_id) as any).id as number;
    db().prepare('UPDATE case_interventions SET confirmed_by = ?, confirmed_at = ? WHERE id = ?').run(p.userId, nowIso(), created);
    db()
      .prepare(`UPDATE case_interventions SET status = 'cancelled', closed_reason = 'superseded', superseded_by = ?, updated_at = ? WHERE id = ?`)
      .run(created, nowIso(), interventionId);
    writeAudit({
      actorUserId: p.userId, action: 'case.preset.replace', entityType: 'case_intervention', entityId: interventionId,
      entityLabel: `Case ${iv.case_id}`, before: { kind: iv.kind, description: iv.description }, after: { newInterventionId: created, kind: plan.kind },
    });
    return caseDetail(p, iv.case_id);
  });
}

/**
 * `KHÔNG CẦN THEO DÕI` (S05, Q-V3-4): GVBM đóng NGAY một case tự tạo từ SOS kèm lý do chọn nhanh. Case đóng, giữ lịch sử; phương án điền sẵn
 * HUỶ (không tính thất bại); không có `outcome` nên không vào bất kỳ thống kê hiệu quả nào.
 *
 * Chỉ áp cho case TỰ TẠO TỪ SOS còn chưa có việc thật: đã xác nhận phương án hoặc đã ghi việc/kết quả thì việc đã bắt đầu — kết thúc bằng
 * `Chốt kết quả case` như mọi case thường. Không khoá theo ngày: "3 ngày" của S04 là HẠN để làm, không phải cửa sổ hết hạn thì mất quyền.
 * Trượt lại ở MT sau thì SOS mở case mới NỐI vào case này (không mở lại).
 */
export function dismissSosCase(p: Principal, caseId: number, input: { reasonCode?: string | null; reasonText?: string | null }) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy case');
  caseAccess(caseId).requireEdit(p, EDIT_MESSAGE);
  if (c.status === 'done') throw badRequest('Case này đã đóng rồi.');
  if (!sosCaseState(caseId).fromSos) {
    throw badRequest('Chỉ đóng "Không cần theo dõi" được với case tự tạo từ SOS — case này không phải case tự tạo từ SOS.');
  }
  const code = String(input.reasonCode ?? '');
  if (!(CASE_DISMISS_REASONS as readonly string[]).includes(code)) {
    throw badRequest(`Chọn một lý do: ${CASE_DISMISS_REASONS.map((r) => CASE_DISMISS_REASON_LABEL[r]).join(' · ')}.`);
  }
  const text = (input.reasonText ?? '').trim();
  if (reasonNeedsText(code) && !text) throw badRequest('Chọn "Khác" thì phải ghi rõ lý do bằng chữ.');
  const started = conn
    .prepare(`SELECT COUNT(*) n FROM case_interventions iv WHERE iv.case_id = ? AND iv.status != 'cancelled' AND NOT ${UNCONFIRMED_PRESET('iv')}`)
    .get(caseId) as any;
  const followed = conn.prepare('SELECT COUNT(*) n FROM case_followups WHERE case_id = ?').get(caseId) as any;
  if (started.n > 0 || followed.n > 0) {
    throw badRequest('Case này đã có phương án được xác nhận hoặc đang chạy — dùng "Chốt kết quả case" thay vì "Không cần theo dõi".');
  }
  const label = CASE_DISMISS_REASON_LABEL[code as CaseDismissReason];
  const note = `Không cần theo dõi · ${label}${reasonNeedsText(code) ? ` — ${text}` : ''}`;
  const today = demoToday();
  return tx(() => {
    const cancelled = conn
      .prepare(
        `UPDATE case_interventions SET status = 'cancelled', closed_reason = 'dismissed', updated_at = ?
          WHERE case_id = ? AND ${UNCONFIRMED_PRESET('case_interventions')} AND status = 'planned'`,
      )
      .run(nowIso(), caseId).changes;
    conn
      .prepare(
        `UPDATE sos_cases SET status = 'done', closed_at = ?, closed_by = ?, dismiss_reason_code = ?, dismiss_reason_text = ?,
                disposition = COALESCE(disposition, 'no_action'), outcome_note = ?, updated_at = ? WHERE id = ?`,
      )
      .run(today, p.userId, code, reasonNeedsText(code) ? text : null, note, nowIso(), caseId);
    conn
      .prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'status', ?, 'done', ?, ?)`)
      .run(caseId, c.status, p.userId, nowIso());
    conn
      .prepare(
        `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key) VALUES (?, 'closed', ?, ?, ?, ?, ?)
         ON CONFLICT(dedup_key) DO NOTHING`,
      )
      .run(caseId, today, note, p.userId, nowIso(), `dismiss:${caseId}`);
    addJourney({
      studentId: c.student_id, cycleId: c.cycle_id ?? null, eventType: 'case_closed', eventDate: today,
      title: 'Không cần theo dõi', detail: note, refTable: 'sos_cases', refId: caseId, createdBy: p.userId, dedupKey: `case_dismiss:${caseId}`,
    });
    writeAudit({
      actorUserId: p.userId, action: 'case.dismiss', entityType: 'sos_case', entityId: caseId, entityLabel: note,
      before: { status: c.status }, after: { status: 'done', reason: code, cancelledPlans: cancelled },
    });
    return caseDetail(p, caseId);
  });
}
