import { db } from '../db.ts';
import {
  academicSupportFor, sosPlanEndDate,
  type AcademicSupportPreset,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, nowIso } from '../util.ts';
import { addJourney, notify, writeAudit } from '../platform/audit.ts';
import { suggestCaseOwner } from './owner.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';

/**
 * SOS TỰ TẠO CASE — PHẦN DỮ LIỆU (rulebook v3, PR-T; `thiet-ke/SOS_VA_PHOI_HOP_V3.md` mục 3–4).
 *
 * Chỉ lượt Mock Test FAST TRACK mới đi qua đây (Q-V3-1). Lớp Normal giữ mô hình tín hiệu cũ — không case tự tạo, không phương án điền
 * sẵn, không Phối hợp SOS.
 *
 * `cases/sos.ts` (nơi sở hữu `raiseSignalsForResult`) quyết định KHI NÀO tạo hay gắn case; file này lo phần "phương án điền sẵn":
 *   · dựng phương án theo bảng MT × mức SOS (`shared/domain/sos.ts`),
 *   · đồng bộ phương án CHƯA xác nhận khi mức SOS của lượt đổi,
 *   · xác nhận / thay / đóng case (S04–S07) — xem phần dưới.
 *
 * PHƯƠNG ÁN ĐIỀN SẴN CHƯA XÁC NHẬN chỉ là gợi ý (Q-V3-3): không vào hiệu quả, không sinh nghĩa vụ cập nhật tuần. Hai lời hứa đó được giữ ở
 * MỘT chỗ — `UNCONFIRMED_PRESET` — để mọi truy vấn loại chúng bằng cùng một điều kiện thay vì mỗi nơi tự viết một kiểu.
 */

/** Điều kiện SQL "phương án điền sẵn mà chưa ai xác nhận". `alias` là bí danh của `case_interventions` trong truy vấn. */
export const UNCONFIRMED_PRESET = (alias = 'iv') => `(${alias}.preset = 1 AND ${alias}.confirmed_at IS NULL)`;
/** Phủ định — dùng thẳng trong `WHERE`. */
export const NOT_UNCONFIRMED_PRESET = (alias = 'iv') => `NOT ${UNCONFIRMED_PRESET(alias)}`;

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
): (AcademicSupportPreset & { followupDue: string | null }) | null {
  const rule = academicSupportFor(attempt.attempt_no, sosLevel);
  if (!rule) return null;
  const followupDue = sosPlanEndDate(rule.span, {
    createdOn: demoToday(), nextMtSunday: followUntil, examDate: examDateOf(attempt.cycle_id),
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
  const p = presetFor(attempt, sosLevel, followUntil);
  if (!p) return;
  const rows = db()
    .prepare(
      `SELECT iv.id, iv.kind, iv.description, iv.followup_due FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_milestones m WHERE m.case_id = sc.id AND m.kind = 'opened' AND m.attempt_id = ?)`,
    )
    .all(attempt.id) as any[];
  for (const iv of rows) {
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
      body: `Hãy xác định nguyên nhân và xác nhận phương án. Hạn ${input.verifyDue}.`,
      entityType: 'sos_case', entityId: input.caseId, dedupKey: `sos-case:${input.caseId}`,
    });
  }
}
