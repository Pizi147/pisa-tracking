import { db, tx } from '../db.ts';
import { SYSTEM_CLOSE_REASON_LABEL, categoryOf, type SystemCloseReason } from '../../../shared/domain/index.ts';
import { nowIso } from '../util.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';

/**
 * HỆ THỐNG TỰ ĐÓNG CASE — nơi DUY NHẤT (S16, S17; bảng luật lộ trình §3.9).
 *
 * Gọi từ (S16 — CHỈ khi em THÔI HỌC): `setStudentStatus(…, 'finished')`; `setOutcome` ("Kết luận lộ trình" FT) và `updateCycle` rời
 * `active` — hai đường này CHỈ khi nơi gọi truyền cờ `dongCaseKhiKetThuc: true`. Luồng "Lên lớp thường tiếp" của PR-LT hoàn tất khoá cũ
 * KHÔNG truyền cờ → Case đi theo em (§3.9). S17: các luồng chuyển lớp khác chương trình của PR-LT gọi `closeCasesOnProgrammeSwitch`.
 *
 * Mỗi Case: đóng (`status = 'done'`, `system_close_reason`), KHÔNG có `outcome`; PA `planned`/`started` → `cancelled` với
 * `closed_reason = 'system_closed'` (không có kết quả → không vào thống kê hiệu quả); PA đã xong giữ nguyên và VẪN tính hiệu quả (Q7);
 * ghi lịch sử, mốc "đóng", hành trình và audit. Tín hiệu còn chờ của cùng phạm vi bị thu hồi với cùng lý do. Chạy lại không làm gì thêm.
 */

/** Không import `normal/regular.ts` ở đây để khỏi vòng import cycles → systemClose → regular → attempts → cycles. */
function ratioOfCycle(cycleId: number | null | undefined): boolean | null {
  if (!cycleId) return null;
  const cy = db()
    .prepare(
      `SELECT cy.route, pg.scoring_mode AS m,
              (SELECT pg2.scoring_mode FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
                 JOIN programmes pg2 ON pg2.code = c.programme_code WHERE a.cycle_id = cy.id LIMIT 1) AS m2
         FROM learning_cycles cy LEFT JOIN programmes pg ON pg.code = cy.programme_code WHERE cy.id = ?`,
    )
    .get(cycleId) as any;
  if (!cy) return null;
  if (cy.route) return false;
  const m = cy.m ?? cy.m2 ?? null;
  return m === null ? null : m === 'ratio';
}

/** Case thuộc chương trình nào: 'ratio' (lớp thường) · 'band' (Fast Track) · null khi không đủ căn cứ — KHÔNG đoán. */
export function programmeOfCase(c: { cycle_id?: number | null; category?: string | null; topic?: string | null; attempt_id?: number | null }): 'ratio' | 'band' | null {
  const byCycle = ratioOfCycle(c.cycle_id);
  if (byCycle !== null) return byCycle ? 'ratio' : 'band';
  const cat = c.category ?? categoryOf(c.topic);
  if (cat === 'writing1' || cat === 'writing2') return 'band';
  if (cat === 'writing') return 'ratio';
  if (c.attempt_id) {
    const r = db()
      .prepare(`SELECT pg.scoring_mode AS m FROM assessment_attempts a JOIN classes cl ON cl.id = a.class_id
                  LEFT JOIN programmes pg ON pg.code = cl.programme_code WHERE a.id = ?`)
      .get(c.attempt_id) as any;
    if (r) return r.m === 'ratio' ? 'ratio' : 'band';
  }
  return null;
}

export function closeCasesBySystem(input: {
  actorUserId: number | null; studentId: number; reason: SystemCloseReason; on: string;
  /** Chỉ Case/tín hiệu của các lộ trình này. Bỏ trống = mọi lộ trình của em. */
  cycleIds?: number[] | null;
  /** Chỉ Case/tín hiệu của chương trình này (S17). Bỏ trống = mọi chương trình. */
  programme?: 'ratio' | 'band' | null;
}): { closedCaseIds: number[]; withdrawnSignalIds: number[] } {
  const conn = db();
  const label = SYSTEM_CLOSE_REASON_LABEL[input.reason];
  const inScope = (cycleId: number | null, row: any) =>
    (!input.cycleIds?.length || (cycleId !== null && input.cycleIds.includes(cycleId)))
    && (!input.programme || programmeOfCase({ ...row, cycle_id: cycleId }) === input.programme);

  const open = (conn
    .prepare(
      `SELECT sc.*, COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE COALESCE(sc.student_id, a.student_id) = ? AND sc.status != 'done' ORDER BY sc.id`,
    )
    .all(input.studentId) as any[]).filter((c) => inScope(c.eff_cycle_id ?? null, c));
  const pendingSignals = (conn
    .prepare(`SELECT * FROM case_signals WHERE student_id = ? AND status = 'pending' ORDER BY id`)
    .all(input.studentId) as any[]).filter((s) => inScope(s.cycle_id ?? null, { category: s.category, topic: s.skill, attempt_id: s.attempt_id }));

  if (!open.length && !pendingSignals.length) return { closedCaseIds: [], withdrawnSignalIds: [] };

  return tx(() => {
    const closed: number[] = [];
    for (const c of open) {
      const cancelled = conn
        .prepare(
          `UPDATE case_interventions SET status = 'cancelled', closed_reason = 'system_closed', updated_at = ?
            WHERE case_id = ? AND status IN ('planned', 'started')`,
        )
        .run(nowIso(), c.id).changes;
      const changed = conn
        .prepare(
          `UPDATE sos_cases SET status = 'done', closed_at = ?, closed_by = NULL, system_close_reason = ?,
                  disposition = COALESCE(disposition, 'other'), disposition_note = COALESCE(disposition_note, ?),
                  outcome_note = ?, dedup_key = NULL, updated_at = ?
            WHERE id = ? AND status != 'done'`,
        )
        .run(input.on, input.reason, label, `Hệ thống tự đóng · ${label}`, nowIso(), c.id).changes;
      if (!changed) continue;
      conn
        .prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'status', ?, 'done', ?, ?)`)
        .run(c.id, c.status, input.actorUserId, nowIso());
      conn
        .prepare(
          `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
           VALUES (?, 'closed', ?, ?, ?, ?, ?) ON CONFLICT(dedup_key) DO NOTHING`,
        )
        .run(c.id, input.on, `Hệ thống tự đóng · ${label}`, input.actorUserId, nowIso(), `system_close:${c.id}`);
      addJourney({
        studentId: input.studentId, cycleId: c.eff_cycle_id ?? null, eventType: 'case_closed', eventDate: input.on,
        title: `Hệ thống tự đóng Case · ${label}`, detail: null,
        refTable: 'sos_cases', refId: c.id, createdBy: input.actorUserId, dedupKey: `case_system_close:${c.id}`,
      });
      writeAudit({
        actorUserId: input.actorUserId, action: 'case.system_close', entityType: 'sos_case', entityId: c.id, entityLabel: label,
        before: { status: c.status }, after: { status: 'done', reason: input.reason, cancelledPlans: cancelled },
      });
      closed.push(c.id);
    }
    for (const s of pendingSignals) {
      conn
        .prepare(`UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ? WHERE id = ? AND status = 'pending'`)
        .run(label, nowIso(), s.id);
      writeAudit({
        actorUserId: input.actorUserId, action: 'signal.withdrawn', entityType: 'case_signal', entityId: s.id, entityLabel: label,
        before: { status: 'pending' }, after: { status: 'withdrawn', reason: label },
      });
    }
    return { closedCaseIds: closed, withdrawnSignalIds: pendingSignals.map((s) => s.id as number) };
  });
}

/** S17 + chiều ngược của §3.9: em sang lớp thường → đóng Case FT; em sang FT → đóng Case lớp thường. PR-LT gọi hàm này. */
export function closeCasesOnProgrammeSwitch(actorUserId: number | null, studentId: number, to: 'normal' | 'ft', on: string) {
  return closeCasesBySystem({
    actorUserId, studentId, on,
    reason: to === 'normal' ? 'moved_to_normal' : 'moved_to_ft',
    programme: to === 'normal' ? 'band' : 'ratio',
  });
}
