import { db, tx } from '../db.ts';
import {
  COORDINATION_KINDS, COORDINATION_KIND_LABEL, COORDINATION_REMOVE_REASON_LABEL, COORDINATION_STATUS_LABEL,
  COORDINATION_USER_REMOVE_REASONS, ENTRY_SKILL_LABEL, coordinationSummary, reasonNeedsText, sosCoordinationFor,
  type CoordinationKind, type CoordinationRemoveReason, type CoordinationStatus, type EntrySkill,
} from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { countAttachments } from '../platform/attachments.ts';
import { resultOf } from '../fasttrack/attempts.ts';
import { branchSql, statScope } from './thongKe.ts';
import { canManageDiscipline, requireManageDiscipline, requireViewClass, requireViewStudent } from './access.ts';

/**
 * PHỐI HỢP SOS — việc của GVCN sau một lượt Mock Test Fast Track có SOS (rulebook v3, PR-T; `thiet-ke/SOS_VA_PHOI_HOP_V3.md` §5).
 *
 * BA LUỒNG TÁCH RIÊNG, KHÔNG DÙNG CHUNG BẢNG: Case học thuật · Vi phạm + Biện pháp · Phối hợp SOS. Hoàn thành cái này không đóng cái kia (P08).
 * Không có hạn cứng, không vào "đúng hạn cập nhật", không vào bảng hiệu quả (P10) — cố ý không có cột hạn nào.
 *
 * SOS Event là chính lượt Mock (`assessment_attempts`) có `sos_level ≥ 1`; `attempt_id` là mỏ neo. Trạng thái "Hoàn thành" của một lượt là SUY RA
 * (mọi việc `done` hoặc `removed`), không lưu.
 *
 * Quyền (P04): xem = quyền xem học viên (GVBM xem được); thêm / xác nhận / bỏ = GVCN của lớp em ĐANG học + Quản lý trong phạm vi (`discipline.manage`).
 */

const ACT_MESSAGE = 'Chỉ giáo viên chủ nhiệm của lớp em đang học và Quản lý trong phạm vi mới xử lý được Phối hợp SOS — giáo viên bộ môn chỉ xem.';

// ---------------------------------------------------------------- điền sẵn và đồng bộ theo mức SOS (P01–P03)

/**
 * ĐỒNG BỘ VIỆC PHỐI HỢP ĐIỀN SẴN với mức SOS hiện tại của lượt. Gọi từ CÙNG điểm với việc tự tạo case (`cases/sos.ts`), mỗi lần điểm của lượt đổi.
 * Hàm của điểm nhập, nên cho ra cùng kết quả dù gọi bao nhiêu lần (P01):
 *
 *   · việc còn thiếu trong bảng §5.3 → THÊM (P01 lần đầu, P02 khi mức SOS tăng). Khoá duy nhất (lượt, loại, tên) chặn nhân đôi;
 *   · việc bị HỆ THỐNG bỏ trước đó (`system_sos_changed`) mà bảng lại cần → HỒI LẠI `pending` (điểm sửa qua sửa lại thì việc theo mức SOS thật);
 *   · việc điền sẵn `pending` mà bảng mới không còn → tự `removed · system_sos_changed` (P03). Việc `done` GIỮ NGUYÊN — việc đã làm thật không bị xoá;
 *     việc GVCN tự thêm (`preset = 0`) và việc GVCN đã tự bỏ không bao giờ bị máy đụng.
 */
export function syncSosCoordination(attempt: { id: number; student_id: number; attempt_no: number }, sosLevel: number | null) {
  if (sosLevel === null) return;
  const conn = db();
  const want = sosCoordinationFor(attempt.attempt_no, sosLevel);
  const existing = conn.prepare('SELECT * FROM sos_coordination_actions WHERE attempt_id = ?').all(attempt.id) as any[];
  const now = nowIso();
  let added = 0, revived = 0, removed = 0;

  for (const kind of want) {
    const row = existing.find((r) => r.kind === kind && !(r.custom_name ?? '').length);
    if (!row) {
      conn
        .prepare(
          `INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at)
           VALUES (?,?,?, NULL, 1, 'pending', ?)`,
        )
        .run(attempt.id, attempt.student_id, kind, now);
      added += 1;
    } else if (row.status === 'removed' && row.remove_reason_code === 'system_sos_changed') {
      conn
        .prepare(
          `UPDATE sos_coordination_actions SET status = 'pending', remove_reason_code = NULL, remove_reason_text = NULL,
                  removed_by = NULL, removed_at = NULL, updated_at = ? WHERE id = ?`,
        )
        .run(now, row.id);
      revived += 1;
    }
  }
  for (const row of existing) {
    if (row.preset === 1 && row.status === 'pending' && !want.includes(row.kind)) {
      conn
        .prepare(
          `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_sos_changed',
                  removed_by = NULL, removed_at = ?, updated_at = ? WHERE id = ?`,
        )
        .run(now, now, row.id);
      removed += 1;
    }
  }
  if (added || revived || removed) {
    writeAudit({
      actorUserId: null, action: 'sos_coordination.sync', entityType: 'assessment_attempt', entityId: attempt.id,
      entityLabel: `MT${attempt.attempt_no} SOS ${sosLevel}`, after: { added, revived, removed },
    });
  }
}

// ---------------------------------------------------------------- đọc

export type CoordinationAction = {
  id: number; kind: CoordinationKind; kindLabel: string; customName: string | null; name: string;
  preset: boolean; status: CoordinationStatus; statusLabel: string;
  performedOn: string | null; performedBy: number | null; performerName: string | null; note: string | null;
  removeReasonCode: string | null; removeReasonLabel: string | null; removeReasonText: string | null; removedAt: string | null;
  attachmentCount: number;
};

export type CoordinationTurn = {
  attemptId: number; attemptNo: number; studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null;
  /** Mức SOS hiện tại của lượt (tính lại từ điểm). */
  sosLevel: number | null;
  /** Kỹ năng đang trượt ở lượt này (từ tín hiệu còn hiệu lực). */
  skills: string[]; skillLabels: string[];
  summary: ReturnType<typeof coordinationSummary>;
  actions: CoordinationAction[];
  canAct: boolean;
};

function shapeAction(r: any, attachments: Map<number, number>): CoordinationAction {
  return {
    id: r.id, kind: r.kind, kindLabel: COORDINATION_KIND_LABEL[r.kind as CoordinationKind] ?? r.kind,
    customName: r.custom_name ?? null,
    name: r.kind === 'other' && r.custom_name ? r.custom_name : COORDINATION_KIND_LABEL[r.kind as CoordinationKind] ?? r.kind,
    preset: r.preset === 1, status: r.status, statusLabel: COORDINATION_STATUS_LABEL[r.status as CoordinationStatus] ?? r.status,
    performedOn: r.performed_on ?? null, performedBy: r.performed_by ?? null, performerName: r.performer_name ?? null, note: r.note ?? null,
    removeReasonCode: r.remove_reason_code ?? null,
    removeReasonLabel: r.remove_reason_code ? COORDINATION_REMOVE_REASON_LABEL[r.remove_reason_code as CoordinationRemoveReason] ?? r.remove_reason_code : null,
    removeReasonText: r.remove_reason_text ?? null, removedAt: r.removed_at ?? null,
    attachmentCount: attachments.get(r.id) ?? 0,
  };
}

/** Dựng các "lượt" (một lượt = một SOS Event) từ một tập việc phối hợp đã lọc quyền. */
function turnsOf(p: Principal, rows: any[]): CoordinationTurn[] {
  if (!rows.length) return [];
  const conn = db();
  const attachments = countAttachments('sos_coordination_action', rows.map((r) => r.id));
  const byAttempt = new Map<number, any[]>();
  for (const r of rows) byAttempt.set(r.attempt_id, [...(byAttempt.get(r.attempt_id) ?? []), r]);
  const out: CoordinationTurn[] = [];
  for (const [attemptId, list] of byAttempt) {
    const a = conn
      .prepare(
        `SELECT a.*, s.full_name, s.student_code, c.code AS class_code FROM assessment_attempts a
           JOIN students s ON s.id = a.student_id LEFT JOIN classes c ON c.id = a.class_id WHERE a.id = ?`,
      )
      .get(attemptId) as any;
    if (!a) continue;
    const skills = (conn
      .prepare(`SELECT DISTINCT skill FROM case_signals WHERE attempt_id = ? AND status != 'withdrawn' AND skill IS NOT NULL ORDER BY id`)
      .all(attemptId) as any[]).map((r) => r.skill as string);
    out.push({
      attemptId, attemptNo: a.attempt_no, studentId: a.student_id, studentName: a.full_name, studentCode: a.student_code,
      classId: a.class_id ?? null, classCode: a.class_code ?? null,
      sosLevel: resultOf(a).sosLevel,
      skills, skillLabels: skills.map((s) => ENTRY_SKILL_LABEL[s as EntrySkill] ?? s),
      summary: coordinationSummary(list.map((r) => r.status)),
      actions: list.map((r) => shapeAction(r, attachments)),
      canAct: canManageDiscipline(p, a.student_id),
    });
  }
  return out;
}

/**
 * Sub-tab `Phối hợp SOS` của HỒ SƠ LỚP (§7.2): các lượt của học viên ĐANG học lớp này. Mặc định chỉ lượt CHƯA hoàn thành; `includeDone` hiện cả lượt đã xong.
 * `pendingCount` là số lượt chưa hoàn thành — con số trên nút sub-tab, không phụ thuộc `includeDone`.
 */
export function coordinationOfClass(p: Principal, classId: number, opts: { includeDone?: boolean } = {}) {
  const cls = db().prepare('SELECT id FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  requireViewClass(p, classId);
  const rows = db()
    .prepare(
      `SELECT x.* FROM sos_coordination_actions x
         JOIN enrollments e ON e.student_id = x.student_id AND e.class_id = ? AND e.status = 'active'
        ORDER BY x.attempt_id, x.id`,
    )
    .all(classId) as any[];
  const all = turnsOf(p, rows).sort((a, b) => a.studentName.localeCompare(b.studentName, 'vi') || a.attemptNo - b.attemptNo);
  const pending = all.filter((t) => !t.summary.complete);
  return { classId, rows: opts.includeDone ? all : pending, pendingCount: pending.length };
}

/** Sub-tab `Phối hợp SOS` của HỒ SƠ HỌC VIÊN (§7.3): mọi lượt của em, mới nhất trước. */
export function coordinationOfStudent(p: Principal, studentId: number) {
  const st = db().prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!st) throw notFound('Không tìm thấy học viên');
  requireViewStudent(p, studentId);
  const rows = db()
    .prepare('SELECT * FROM sos_coordination_actions WHERE student_id = ? ORDER BY attempt_id, id')
    .all(studentId) as any[];
  const turns = turnsOf(p, rows).sort((a, b) => b.attemptNo - a.attemptNo);
  return { studentId, rows: turns, pendingCount: turns.filter((t) => !t.summary.complete).length, canAct: canManageDiscipline(p, studentId) };
}

// ---------------------------------------------------------------- ghi (P05–P07)

function loadAction(id: number): any {
  const r = db().prepare('SELECT * FROM sos_coordination_actions WHERE id = ?').get(id) as any;
  if (!r) throw notFound('Không tìm thấy việc phối hợp');
  return r;
}

function viewOf(id: number): CoordinationAction {
  return shapeAction(loadAction(id), countAttachments('sos_coordination_action', [id]));
}

/** P05 — GVCN THÊM một việc bất kỳ trong sáu loại. `Khác` bắt buộc có tên. Khoá (lượt, loại, tên) duy nhất — kể cả việc đã bỏ (không hồi sinh ngầm). */
export function addCoordination(p: Principal, attemptId: number, input: { kind?: string | null; customName?: string | null }): CoordinationAction {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt Mock Test');
  requireManageDiscipline(p, a.student_id, ACT_MESSAGE);
  const kind = String(input.kind ?? '');
  if (!(COORDINATION_KINDS as readonly string[]).includes(kind)) {
    throw badRequest(`Hãy chọn loại việc: ${COORDINATION_KINDS.map((k) => COORDINATION_KIND_LABEL[k]).join(' · ')}.`);
  }
  const name = (input.customName ?? '').trim();
  if (kind === 'other' && !name) throw badRequest('Việc loại "Khác" cần ghi tên việc.');
  if (kind !== 'other' && name) throw badRequest('Chỉ việc loại "Khác" mới có tên riêng.');
  if ((a.kind ?? 'mock') !== 'mock' || !(resultOf(a).sosLevel && resultOf(a).sosLevel! >= 1)) {
    throw badRequest('Chỉ lượt Mock Test Fast Track có SOS mới có Phối hợp SOS.');
  }
  const dup = db()
    .prepare(`SELECT id FROM sos_coordination_actions WHERE attempt_id = ? AND kind = ? AND COALESCE(custom_name, '') = ?`)
    .get(attemptId, kind, name) as any;
  if (dup) throw badRequest('Việc này đã có ở lượt này (kể cả khi đã xong hoặc đã bỏ).');
  const id = tx(() => {
    const info = db()
      .prepare(
        `INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at)
         VALUES (?,?,?,?, 0, 'pending', ?)`,
      )
      .run(attemptId, a.student_id, kind, name || null, nowIso());
    const newId = Number(info.lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: 'sos_coordination.add', entityType: 'sos_coordination_action', entityId: newId,
      entityLabel: `MT${a.attempt_no} · ${name || COORDINATION_KIND_LABEL[kind as CoordinationKind]}`, after: { kind, name: name || null },
    });
    return newId;
  });
  return viewOf(id);
}

/**
 * P07 — XÁC NHẬN ĐÃ XONG. Bắt buộc NGÀY THỰC HIỆN (không cho ngày tương lai); ghi chú và tệp tuỳ chọn; không hỏi tiến bộ (đó là chuyện của Case
 * học thuật, không phải của Phối hợp). Người thực hiện mặc định là người xác nhận; ghi `performerName` khi việc do người khác làm (CS, GĐCN…).
 */
export function confirmCoordination(p: Principal, id: number, input: { performedOn?: string | null; note?: string | null; performerName?: string | null }): CoordinationAction {
  const r = loadAction(id);
  requireManageDiscipline(p, r.student_id, ACT_MESSAGE);
  if (r.status !== 'pending') throw badRequest('Việc này không còn ở trạng thái "Cần xử lý" — việc đã xong hoặc đã bỏ thì không xác nhận nữa.');
  if (!input.performedOn) throw badRequest('Cần chọn ngày thực hiện.');
  if (!isIsoDate(input.performedOn)) throw badRequest('Ngày thực hiện không hợp lệ.');
  if (input.performedOn > demoToday()) throw badRequest('Ngày thực hiện không được ở tương lai.');
  const who = (input.performerName ?? '').trim();
  tx(() => {
    db()
      .prepare(
        `UPDATE sos_coordination_actions SET status = 'done', performed_on = ?, performed_by = ?, performer_name = ?, note = ?, updated_at = ? WHERE id = ?`,
      )
      .run(input.performedOn, who ? null : p.userId, who || null, (input.note ?? '').trim() || null, nowIso(), id);
    writeAudit({
      actorUserId: p.userId, action: 'sos_coordination.confirm', entityType: 'sos_coordination_action', entityId: id,
      entityLabel: `${r.kind}${r.custom_name ? ` · ${r.custom_name}` : ''}`, before: { status: r.status }, after: { status: 'done', performedOn: input.performedOn },
    });
  });
  return viewOf(id);
}

/**
 * P05+P06 — BỎ một việc `pending` kèm LÝ DO CHỌN NHANH ngay tại dòng. Chỉ `Khác` cần chữ. `system_sos_changed` là lý do của HỆ THỐNG — người dùng không chọn
 * được. Lưu vết vào lịch sử (`audit_logs`). Việc đã bỏ tính khỏi mẫu số `{done}/{chưa bỏ}`.
 */
export function removeCoordination(p: Principal, id: number, input: { reasonCode?: string | null; reasonText?: string | null }): CoordinationAction {
  const r = loadAction(id);
  requireManageDiscipline(p, r.student_id, ACT_MESSAGE);
  if (r.status !== 'pending') throw badRequest('Chỉ bỏ được việc đang ở trạng thái Cần xử lý — việc đã xong hoặc đã bỏ thì không bỏ nữa.');
  const code = String(input.reasonCode ?? '');
  if (!(COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(code)) {
    throw badRequest(`Hãy chọn một lý do: ${COORDINATION_USER_REMOVE_REASONS.map((c) => COORDINATION_REMOVE_REASON_LABEL[c]).join(' · ')}.`);
  }
  const text = (input.reasonText ?? '').trim();
  if (reasonNeedsText(code) && !text) throw badRequest('Chọn "Khác" thì phải ghi rõ lý do bằng chữ.');
  tx(() => {
    db()
      .prepare(
        `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = ?, remove_reason_text = ?, removed_by = ?, removed_at = ?, updated_at = ? WHERE id = ?`,
      )
      .run(code, reasonNeedsText(code) ? text : null, p.userId, nowIso(), nowIso(), id);
    writeAudit({
      actorUserId: p.userId, action: 'sos_coordination.remove', entityType: 'sos_coordination_action', entityId: id,
      entityLabel: `${r.kind}${r.custom_name ? ` · ${r.custom_name}` : ''}`, before: { status: r.status }, after: { status: 'removed', reason: code, text: text || null },
    });
  });
  return viewOf(id);
}

// ---------------------------------------------------------------- chỉ số (đặc tả §8)

export const PHOI_HOP_METRIC_IDS = ['phoi-hop-luot-sos', 'phoi-hop-dang-xu-ly', 'phoi-hop-hoan-thanh'] as const;
export const isPhoiHopMetric = (id: string): boolean => (PHOI_HOP_METRIC_IDS as readonly string[]).includes(id);

/**
 * BA CHỈ SỐ PHỐI HỢP SOS — đơn vị LƯỢT (một lượt Mock FT có SOS), mỗi chỉ số một hàm trả TẬP ID lượt.
 *
 *   phoi-hop-luot-sos      lượt có `sos_level ≥ 1` (tính lại từ điểm — SOS hết thì lượt thôi là SOS Event) và có việc phối hợp
 *   phoi-hop-dang-xu-ly    trong đó, lượt có ≥1 việc `pending`
 *   phoi-hop-hoan-thanh    trong đó, lượt có ≥1 việc và mọi việc `done` hoặc `removed`
 *
 * Phạm vi xem như thống kê Ý thức: chỉ Quản lý (chi nhánh của họ) và Quản trị; GVBM/GVCN nhận tập rỗng có nhãn. Kỳ (`from`/`to`) tính theo TUẦN của lượt.
 */
export function phoiHopMetric(p: Principal, id: string, f: { branchId?: number | null; from?: string | null; to?: string | null } = {}): { none: boolean; ids: number[] } {
  const scope = statScope(p, f.branchId ?? null);
  if (scope.none) return { none: true, ids: [] };
  const b = branchSql('c.branch_id', scope.branchIds);
  const period = `${f.from ? ' AND rp.week_start >= ?' : ''}${f.to ? ' AND rp.week_start <= ?' : ''}`;
  const args = [...b.args, ...(f.from ? [f.from] : []), ...(f.to ? [f.to] : [])];
  const attempts = db()
    .prepare(
      `SELECT DISTINCT a.* FROM assessment_attempts a
         JOIN sos_coordination_actions x ON x.attempt_id = a.id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.status != 'cancelled' AND ${b.sql}${period} ORDER BY a.id`,
    )
    .all(...args) as any[];
  const ids: number[] = [];
  for (const a of attempts) {
    const level = resultOf(a).sosLevel;
    if (level === null || level < 1) continue;
    const st = (db().prepare('SELECT status FROM sos_coordination_actions WHERE attempt_id = ?').all(a.id) as any[]).map((r) => r.status as string);
    const sum = coordinationSummary(st);
    if (id === 'phoi-hop-luot-sos' || (id === 'phoi-hop-dang-xu-ly' && sum.pending > 0) || (id === 'phoi-hop-hoan-thanh' && sum.complete)) ids.push(a.id);
  }
  return { none: false, ids };
}
