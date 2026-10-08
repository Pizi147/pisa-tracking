import { chenNhieuDong, db, theoLo, tx } from '../db.ts';
import { SYSTEM_CLOSE_REASON_LABEL, caseDedupKey, categoryOf, type SystemCloseReason } from '../../../shared/domain/index.ts';
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
  /** PR-MT (T67): chỉ đúng các Case này (huỷ lượt) — không thu hồi tín hiệu nào khác. */
  caseIds?: number[] | null;
}): { closedCaseIds: number[]; withdrawnSignalIds: number[]; chup: ChupCaseDong[] } {
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
    .all(input.studentId) as any[]).filter((c) => inScope(c.eff_cycle_id ?? null, c) && (!input.caseIds || input.caseIds.includes(c.id)));
  const pendingSignals = input.caseIds ? [] : (conn
    .prepare(`SELECT * FROM case_signals WHERE student_id = ? AND status = 'pending' ORDER BY id`)
    .all(input.studentId) as any[]).filter((s) => inScope(s.cycle_id ?? null, { category: s.category, topic: s.skill, attempt_id: s.attempt_id }));

  if (!open.length && !pendingSignals.length) return { closedCaseIds: [], withdrawnSignalIds: [], chup: [] };

  return tx(() => {
    const closed: number[] = [];
    const chup: ChupCaseDong[] = [];
    /* PR-LUI-b: chụp trạng thái PA TRƯỚC khi đóng (một câu cho cả lô Case) — Hoàn tác Kết thúc học mở lại đúng Case / PA này (`moLaiCaseHeThongDong`). */
    const paTheoCase = new Map<number, { id: number; status: string }[]>();
    theoLo(open.map((c) => c.id as number), (lo, ph) => {
      for (const r of conn.prepare(`SELECT id, case_id, status FROM case_interventions WHERE case_id IN (${ph}) AND status IN ('planned', 'started')`).all(...lo) as any[]) {
        paTheoCase.set(r.case_id, [...(paTheoCase.get(r.case_id) ?? []), { id: r.id, status: r.status }]);
      }
    });
    for (const c of open) {
      const truocPa = paTheoCase.get(c.id) ?? [];
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
        .run(input.on, input.reason, label, `Hệ thống đóng · ${label}`, nowIso(), c.id).changes;
      if (!changed) continue;
      conn
        .prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'status', ?, 'done', ?, ?)`)
        .run(c.id, c.status, input.actorUserId, nowIso());
      conn
        .prepare(
          `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
           VALUES (?, 'closed', ?, ?, ?, ?, ?) ON CONFLICT(dedup_key) DO NOTHING`,
        )
        .run(c.id, input.on, `Hệ thống đóng · ${label}`, input.actorUserId, nowIso(), `system_close:${c.id}`);
      addJourney({
        studentId: input.studentId, cycleId: c.eff_cycle_id ?? null, eventType: 'case_closed', eventDate: input.on,
        title: `Hệ thống đóng Case · ${label}`, detail: null,
        refTable: 'sos_cases', refId: c.id, createdBy: input.actorUserId, dedupKey: `case_system_close:${c.id}`,
      });
      writeAudit({
        actorUserId: input.actorUserId, action: 'case.system_close', entityType: 'sos_case', entityId: c.id, entityLabel: label,
        before: { status: c.status }, after: { status: 'done', reason: input.reason, cancelledPlans: cancelled },
      });
      closed.push(c.id);
      chup.push({
        id: c.id, status: c.status, disposition: c.disposition ?? null, disposition_note: c.disposition_note ?? null, outcome_note: c.outcome_note ?? null,
        dedup_key: c.dedup_key ?? null, closed_at: c.closed_at ?? null, closed_by: c.closed_by ?? null, pa: truocPa,
      });
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
    return { closedCaseIds: closed, withdrawnSignalIds: pendingSignals.map((s) => s.id as number), chup };
  });
}

/**
 * PR-CT2 (§8): như `closeCasesBySystem({ caseIds })` nhưng THEO LÔ cho nhiều em — số câu cố định mỗi lô, không theo số Case (Turso ≤ 200 câu mỗi lần ghi).
 * Cùng hiệu ứng mỗi Case: PA mở → `cancelled`/`system_closed`, Case `done` + lý do, lịch sử, mốc "đóng", Hành trình, nhật ký. Không thu hồi tín hiệu
 * (như nhánh `caseIds`), không chụp để mở lại. Gọi trong giao dịch của nơi gọi.
 */
export function dongCaseHeThongLo(input: { actorUserId: number | null; reason: SystemCloseReason; on: string; caseIds: readonly number[] }): number[] {
  if (!input.caseIds.length) return [];
  const conn = db();
  const label = SYSTEM_CLOSE_REASON_LABEL[input.reason];
  const open: any[] = [];
  theoLo([...new Set(input.caseIds)], (lo, ph) => {
    open.push(...conn.prepare(
      `SELECT sc.id, sc.status, COALESCE(sc.student_id, a.student_id) AS sid, COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id
         FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.id IN (${ph}) AND sc.status != 'done'`,
    ).all(...lo) as any[]);
  });
  if (!open.length) return [];
  const ids = open.map((c) => c.id as number), luc = nowIso();
  theoLo(ids, (lo, ph) => {
    conn.prepare(`UPDATE case_interventions SET status = 'cancelled', closed_reason = 'system_closed', updated_at = ? WHERE case_id IN (${ph}) AND status IN ('planned', 'started')`)
      .run(luc, ...lo);
    conn.prepare(
      `UPDATE sos_cases SET status = 'done', closed_at = ?, closed_by = NULL, system_close_reason = ?, disposition = COALESCE(disposition, 'other'),
              disposition_note = COALESCE(disposition_note, ?), outcome_note = ?, dedup_key = NULL, updated_at = ? WHERE id IN (${ph}) AND status != 'done'`,
    ).run(input.on, input.reason, label, `Hệ thống đóng · ${label}`, luc, ...lo);
  }, 900 - 5);
  chenNhieuDong('INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)',
    open.map((c) => [c.id, 'status', c.status, 'done', input.actorUserId, luc]));
  chenNhieuDong('INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)',
    open.map((c) => [c.id, 'closed', input.on, `Hệ thống đóng · ${label}`, input.actorUserId, luc, `system_close:${c.id}`]), ' ON CONFLICT(dedup_key) DO NOTHING');
  chenNhieuDong('INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail, ref_table, ref_id, dedup_key, created_by, created_at)',
    open.map((c) => [c.sid, c.eff_cycle_id ?? null, 'case_closed', input.on, `Hệ thống đóng Case · ${label}`, null, 'sos_cases', c.id, `case_system_close:${c.id}`, input.actorUserId, luc]),
    ' ON CONFLICT(dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING');
  chenNhieuDong('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)',
    open.map((c) => [input.actorUserId, 'case.system_close', 'sos_case', c.id, label, JSON.stringify({ status: c.status }), JSON.stringify({ status: 'done', reason: input.reason }), luc]));
  return ids;
}

/** Trạng thái của MỘT Case trước khi hệ thống đóng (đủ để mở lại đúng như cũ). */
export type ChupCaseDong = {
  id: number; status: string; disposition: string | null; disposition_note: string | null; outcome_note: string | null;
  dedup_key: string | null; closed_at: string | null; closed_by: number | null; pa: { id: number; status: string }[];
};

/**
 * MỞ LẠI ĐÚNG CÁC CASE / PA / TÍN HIỆU mà MỘT lần hệ thống đóng (PR-LUI-b, chủ sản phẩm 06/10 — Hoàn tác Kết thúc học). `chup` + `tinHieu` là kết quả của
 * `closeCasesBySystem` lần đó. Case đóng từ trước (không nằm trong `chup`) giữ đóng. Case đã bị người sửa / đóng lại theo cách khác (không còn
 * `system_close_reason = reason`), hoặc đã có Case MỚI cùng khoá chống trùng thì bỏ qua và báo `boQua`. Gọi trong giao dịch của nơi gọi.
 */
export function moLaiCaseHeThongDong(input: {
  actorUserId: number | null; studentId: number; reason: SystemCloseReason; chup: ChupCaseDong[]; tinHieu: number[];
}): { moLai: number[]; boQua: number[] } {
  const conn = db();
  const moLai: number[] = [];
  const boQua: number[] = [];
  for (const c of input.chup) {
    const nay = conn.prepare('SELECT status, system_close_reason FROM sos_cases WHERE id = ?').get(c.id) as any;
    const trung = c.dedup_key ? conn.prepare('SELECT 1 FROM sos_cases WHERE dedup_key = ? AND id != ?').get(c.dedup_key, c.id) : null;
    if (!nay || nay.status !== 'done' || nay.system_close_reason !== input.reason || trung) { boQua.push(c.id); continue; }
    conn.prepare(
      `UPDATE sos_cases SET status = ?, closed_at = ?, closed_by = ?, system_close_reason = NULL, disposition = ?, disposition_note = ?, outcome_note = ?,
              dedup_key = ?, updated_at = ? WHERE id = ?`,
    ).run(c.status, c.closed_at, c.closed_by, c.disposition, c.disposition_note, c.outcome_note, c.dedup_key, nowIso(), c.id);
    for (const pa of c.pa) {
      conn.prepare(`UPDATE case_interventions SET status = ?, closed_reason = NULL, updated_at = ? WHERE id = ? AND status = 'cancelled' AND closed_reason = 'system_closed'`)
        .run(pa.status, nowIso(), pa.id);
    }
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'status', 'done', ?, ?, ?)`)
      .run(c.id, c.status, input.actorUserId, nowIso());
    conn.prepare('DELETE FROM case_milestones WHERE dedup_key = ?').run(`system_close:${c.id}`);
    conn.prepare('DELETE FROM journey_events WHERE dedup_key = ?').run(`case_system_close:${c.id}`);
    writeAudit({
      actorUserId: input.actorUserId, action: 'case.system_reopen', entityType: 'sos_case', entityId: c.id, entityLabel: SYSTEM_CLOSE_REASON_LABEL[input.reason],
      before: { status: 'done' }, after: { status: c.status, lyDo: 'Hoàn tác Kết thúc học' },
    });
    moLai.push(c.id);
  }
  for (const id of input.tinHieu) {
    conn.prepare(`UPDATE case_signals SET status = 'pending', withdrawn_reason = NULL, updated_at = ? WHERE id = ? AND status = 'withdrawn'`).run(nowIso(), id);
  }
  return { moLai, boQua };
}

/** S17 + chiều ngược của §3.9: em sang lớp thường → đóng Case FT; em sang FT → đóng Case lớp thường. PR-LT gọi hàm này. */
export function closeCasesOnProgrammeSwitch(actorUserId: number | null, studentId: number, to: 'normal' | 'ft', on: string) {
  return closeCasesBySystem({
    actorUserId, studentId, on,
    reason: to === 'normal' ? 'moved_to_normal' : 'moved_to_ft',
    programme: to === 'normal' ? 'band' : 'ratio',
  });
}

/**
 * K5-60: đổi LT ↔ RF = lộ trình mới, Case đang mở ĐI THEO em — đổi `cycle_id` + khoá chống trùng (dựng bằng `caseDedupKey`, không ghép
 * chuỗi SQL) và ghi mốc "Sang lộ trình …". Lượt `planned` của lộ trình cũ ở lại lộ trình cũ (Q12 của PR-LOP). Gọi trong tx của nơi chuyển.
 */
export function chuyenCaseSangLoTrinh(actorUserId: number | null, studentId: number, tuCycleId: number, denCycleId: number,
  route: string | null, on: string): number {
  const conn = db();
  const ds = conn.prepare(`SELECT id, category, dedup_key FROM sos_cases WHERE student_id = ? AND cycle_id = ? AND status != 'done'`)
    .all(studentId, tuCycleId) as any[];
  for (const c of ds) {
    const khoa = c.dedup_key ? caseDedupKey({ category: c.category, studentId, cycleId: denCycleId }) : null;
    conn.prepare('UPDATE sos_cases SET cycle_id = ?, dedup_key = ?, updated_at = ? WHERE id = ?').run(denCycleId, khoa, nowIso(), c.id);
    conn.prepare(
      `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
       VALUES (?, 'route_changed', ?, ?, ?, ?, ?) ON CONFLICT(dedup_key) DO NOTHING`)
      .run(c.id, on, `Sang lộ trình ${route ?? 'mới'}`, actorUserId, nowIso(), `lo-trinh:${c.id}:${denCycleId}`);
  }
  return ds.length;
}
