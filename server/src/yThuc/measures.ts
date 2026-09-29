import { db, tx } from '../db.ts';
import {
  MEASURE_KINDS_V3, MEASURE_KIND_LABEL_V3, MEASURE_STATUS_LABEL, MEASURE_REQUIRED_FIELDS,
  isWarningKind, kiemGhiRoKhac, measureMissing, measureNotifiesManager, warningPrerequisite,
  type MeasureKindV3, type MeasureStatusV3,
} from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { purgeAttachmentsOf, xoaTepSauGiaoDich } from '../platform/attachments.ts';
import { currentCycle } from '../fasttrack/cycles.ts';
import { KEY_TAKEN_MESSAGE, activeClassOf, canManageDiscipline, requireManageDiscipline, requireViewClass, requireViewStudent } from './access.ts';
import { noteMeasureChange, violationsByIds, type ViolationView } from './violations.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';

/**
 * BIỆN PHÁP XỬ LÝ — VIỆC GVCN LÀM ĐỂ XỬ LÝ MỘT NHÓM VI PHẠM (đặc tả §4.2–§4.3 và §5.3–§5.4, nguồn mục 17–28).
 *
 * BỐN ĐIỀU DỄ SAI, mỗi điều có phép kiểm riêng:
 *   1. NHIỀU–NHIỀU. Một biện pháp gom nhiều vi phạm (khác nhóm, khác môn, khác GV, khác ngày — nhưng cùng MỘT học viên, B02);
 *      một vi phạm gắn nhiều biện pháp. Quan hệ nằm ở `measure_violations`, không có khoá ngoại ở hai bảng chính.
 *   2. CHỈ MỘT NGOẠI LỆ VỀ TRÌNH TỰ: chuỗi Thư cảnh cáo 1 → 2 → 3, trong CÙNG MỘT LỘ TRÌNH (Y02), kiểm ở MÁY CHỦ — cả lúc tạo
 *      lẫn lúc xác nhận, cả lúc đổi loại. Mọi loại khác đi thẳng được (B05).
 *   3. HAI TRẠNG THÁI, KHÔNG BA. `preparing` sửa mọi thứ, không có hạn nào; `done` khóa danh sách vi phạm. Không có cửa Quản lý
 *      duyệt (Y01) — Quản lý chỉ nhận THÔNG BÁO.
 *   4. SỐ VI PHẠM CỦA MỘT BIỆN PHÁP LUÔN LÀ SỐ ĐANG GẮN (rulebook v3, V14′): xoá một vi phạm thì số này giảm theo, kể cả biện pháp đã thực hiện.
 *      Biện pháp đã thực hiện mất hết vi phạm vẫn được giữ (việc đã làm thật) và hiện 0 vi phạm. Cột `violation_count_at_confirm` (ảnh chụp
 *      của PR-J) NGỪNG DÙNG — không còn ghi, không còn đọc.
 */

export type MeasureDetail = {
  id: number;
  studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; cycleId: number | null;
  kind: MeasureKindV3; kindLabel: string; customName: string | null;
  status: MeasureStatusV3; statusLabel: string;
  ownerUserId: number | null; ownerName: string | null;
  note: string | null;
  performedOn: string | null; performedBy: number | null; performedByName: string | null; performerName: string | null;
  participants: string | null;
  confirmedBy: number | null; confirmedByName: string | null; confirmedAt: string | null;
  createdAt: string; createdBy: number; createdByName: string | null; updatedAt: string | null;
  violations: ViolationView[];
  /** SỐ VI PHẠM ĐANG GẮN (V14′) — không phải ảnh chụp: xoá một vi phạm thì số này giảm, kể cả biện pháp đã thực hiện. */
  violationCount: number;
  attachmentCount: number;
  /**
   * Câu nói TRƯỚC cần tệp gì khi biện pháp còn Đang chuẩn bị (đặc tả 7.3 điểm 6) — GVCN đi scan thư trước, không phải bấm
   * Xác nhận rồi mới biết thiếu. `null` khi không cần hoặc đã đủ.
   */
  evidenceHint: string | null;
  canManage: boolean;
};

const SELECT = `
  SELECT m.*, s.full_name AS student_name, s.student_code, c.code AS class_code,
         ou.full_name AS owner_name, pu.full_name AS performed_by_name,
         cf.full_name AS confirmed_by_name, cb.full_name AS created_by_name
    FROM discipline_measures m
    JOIN students s ON s.id = m.student_id
    LEFT JOIN classes c ON c.id = m.class_id
    LEFT JOIN users ou ON ou.id = m.owner_user_id
    LEFT JOIN users pu ON pu.id = m.performed_by
    LEFT JOIN users cf ON cf.id = m.confirmed_by
    LEFT JOIN users cb ON cb.id = m.created_by`;

function loadRow(id: number): any {
  const r = db().prepare(`${SELECT} WHERE m.id = ?`).get(id);
  if (!r) throw notFound('Không tìm thấy phương án xử lý');
  return r;
}

function kindLabelOf(kind: string, customName: string | null): string {
  return kind === 'other' && customName ? customName : MEASURE_KIND_LABEL_V3[kind as MeasureKindV3] ?? kind;
}

const attachmentCountOf = (measureId: number): number =>
  (db().prepare("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ?").get(measureId) as any).n;

function violationIdsOf(measureId: number): number[] {
  return (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id').all(measureId) as any[])
    .map((r) => r.violation_id as number);
}

/**
 * Q10 — DỰNG THEO LÔ cho `listMeasures`: MỘT câu `measure_violations … IN (…)` cho mọi PA (thay vì một câu mỗi PA),
 * MỘT `violationsByIds` cho cả tập, MỘT `SELECT … GROUP BY owner_id` cho số tệp, quyền `canManage` nhớ theo `studentId`.
 * JSON từng phần tử PHẢI giống hệt gọi `buildDetail` lẻ cho từng dòng — `buildDetail` chỉ là `buildDetailMany([r])[0]`.
 */
function buildDetailMany(p: Principal, rows: any[]): MeasureDetail[] {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id as number);

  const violationIdsOfMeasure = new Map<number, number[]>();
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    for (const r of db()
      .prepare(`SELECT measure_id, violation_id FROM measure_violations WHERE measure_id IN (${chunk.map(() => '?').join(',')}) ORDER BY violation_id`)
      .all(...chunk) as any[]) {
      const arr = violationIdsOfMeasure.get(r.measure_id) ?? [];
      arr.push(r.violation_id);
      violationIdsOfMeasure.set(r.measure_id, arr);
    }
  }
  const allViolationIds = [...new Set([...violationIdsOfMeasure.values()].flat())];
  const violationById = new Map(violationsByIds(allViolationIds).map((v) => [v.id, v]));

  const attachmentCountOfMeasure = new Map<number, number>();
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    for (const r of db()
      .prepare(`SELECT owner_id, COUNT(*) n FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id IN (${chunk.map(() => '?').join(',')}) GROUP BY owner_id`)
      .all(...chunk) as any[]) {
      attachmentCountOfMeasure.set(r.owner_id, r.n);
    }
  }

  const canManageOfStudent = new Map<number, boolean>();
  const canManageOf = (studentId: number): boolean => {
    if (!canManageOfStudent.has(studentId)) canManageOfStudent.set(studentId, canManageDiscipline(p, studentId));
    return canManageOfStudent.get(studentId)!;
  };

  /* Cùng thứ tự sắp xếp mà `violationsByIds` dùng, để mỗi PA ra ĐÚNG như gọi lẻ. */
  const sortViolations = (a: ViolationView, b: ViolationView) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id;

  return rows.map((r) => {
    const violations = (violationIdsOfMeasure.get(r.id) ?? [])
      .map((vid) => violationById.get(vid))
      .filter((v): v is ViolationView => !!v)
      .sort(sortViolations);
    const attachmentCount = attachmentCountOfMeasure.get(r.id) ?? 0;
    const spec = MEASURE_REQUIRED_FIELDS[r.kind as MeasureKindV3];
    const needsFile = r.status === 'preparing' && spec?.attachment === 'required' && attachmentCount < 1;
    return {
      id: r.id,
      studentId: r.student_id, studentName: r.student_name, studentCode: r.student_code,
      classId: r.class_id ?? null, classCode: r.class_code ?? null, cycleId: r.cycle_id ?? null,
      kind: r.kind, kindLabel: kindLabelOf(r.kind, r.custom_name ?? null), customName: r.custom_name ?? null,
      status: r.status, statusLabel: MEASURE_STATUS_LABEL[r.status as MeasureStatusV3] ?? r.status,
      ownerUserId: r.owner_user_id ?? null, ownerName: r.owner_name ?? null,
      note: r.note ?? null,
      performedOn: r.performed_on ?? null, performedBy: r.performed_by ?? null, performedByName: r.performed_by_name ?? null,
      performerName: r.performer_name ?? null, participants: r.participants ?? null,
      confirmedBy: r.confirmed_by ?? null, confirmedByName: r.confirmed_by_name ?? null, confirmedAt: r.confirmed_at ?? null,
      createdAt: r.created_at, createdBy: r.created_by, createdByName: r.created_by_name ?? null, updatedAt: r.updated_at ?? null,
      violations, violationCount: violations.length,
      attachmentCount,
      evidenceHint: needsFile
        ? (r.kind === 'suspension' ? 'Cần đính kèm tệp hoặc liên kết quyết định đình chỉ học' : 'Cần đính kèm tệp hoặc liên kết thư cảnh cáo')
        : null,
      canManage: canManageOf(r.student_id),
    };
  });
}

function buildDetail(p: Principal, r: any): MeasureDetail {
  return buildDetailMany(p, [r])[0];
}

export function measureDetail(p: Principal, id: number): MeasureDetail {
  const r = loadRow(id);
  requireViewStudent(p, r.student_id);
  return buildDetail(p, r);
}

const MANAGE_MESSAGE = 'Chỉ giáo viên chủ nhiệm của lớp hoặc Quản lý trong phạm vi mới tạo và thực hiện được phương án xử lý — giáo viên bộ môn chỉ đọc.';

// ---------------------------------------------------------------- chuỗi Thư cảnh cáo (B06–B08, Y02)

type ChainProblem = { reason: string; message: string };

/**
 * NGOẠI LỆ CỨNG DUY NHẤT VỀ TRÌNH TỰ. Trong CÙNG MỘT LỘ TRÌNH (Y02, `cycle_id`):
 *   · lần 2 cần lần 1 ĐÃ THỰC HIỆN, lần 3 cần lần 2 đã thực hiện (B06);
 *   · mỗi lộ trình chỉ có tối đa MỘT thư mỗi lần — muốn gửi thư thứ tư thì dùng `Khác` kèm tên (B08).
 * Sang lộ trình mới thì chuỗi reset (B07) vì phạm vi là `cycle_id`. `mode = 'confirm'` chỉ kiểm điều kiện đứng trước — biện
 * pháp đang được xác nhận chính là "một thư mỗi lần" của lộ trình.
 */
function chainProblem(studentId: number, cycleId: number | null, kind: MeasureKindV3, excludeId: number, mode: 'create' | 'confirm'): ChainProblem | null {
  if (!isWarningKind(kind)) return null;
  const label = MEASURE_KIND_LABEL_V3[kind];
  const need = warningPrerequisite(kind);
  if (need) {
    const has = db()
      .prepare(`SELECT 1 FROM discipline_measures WHERE student_id = ? AND cycle_id IS ? AND kind = ? AND status = 'done' AND id != ?`)
      .get(studentId, cycleId, need, excludeId);
    if (!has) {
      const reason = `Chưa gửi ${MEASURE_KIND_LABEL_V3[need]}`;
      return { reason, message: `Không tạo hoặc xác nhận được ${label}: trong lộ trình này em chưa có ${MEASURE_KIND_LABEL_V3[need]} đã thực hiện.` };
    }
  }
  if (mode === 'create') {
    const dup = db()
      .prepare(`SELECT 1 FROM discipline_measures WHERE student_id = ? AND cycle_id IS ? AND kind = ? AND id != ?`)
      .get(studentId, cycleId, kind, excludeId);
    if (dup) {
      return {
        reason: `Lộ trình này đã có ${label} — cần gửi thêm thì chọn "Khác" và ghi rõ tên`,
        message: `Lộ trình này đã có ${label}. Mỗi lộ trình chỉ có một — muốn gửi thêm thư thì chọn loại "Khác" và ghi rõ tên.`,
      };
    }
  }
  return null;
}

/**
 * CHÍN LOẠI KÈM TRẠNG THÁI KHÓA — để form khóa đúng dòng và NÓI LÝ DO NGAY TẠI DÒNG (đặc tả 7.4), không để bấm rồi mới báo lỗi.
 * Dùng chính `chainProblem` mà máy chủ dùng để từ chối, nên form và máy chủ không thể nói hai điều khác nhau.
 */
export function measureKindAvailability(p: Principal, studentId: number, opts: { excludeMeasureId?: number } = {}) {
  const st = db().prepare('SELECT id FROM students WHERE id = ?').get(studentId);
  if (!st) throw notFound('Không tìm thấy học viên');
  requireViewStudent(p, studentId);
  const cycleId = currentCycle(studentId)?.id ?? null;
  return MEASURE_KINDS_V3.map((kind) => {
    const problem = chainProblem(studentId, cycleId, kind, opts.excludeMeasureId ?? 0, 'create');
    return { kind, label: MEASURE_KIND_LABEL_V3[kind], available: !problem, reason: problem?.reason ?? null };
  });
}

// ---------------------------------------------------------------- kiểm dữ liệu vào

function checkKind(kind: unknown): MeasureKindV3 {
  if (typeof kind !== 'string' || !(MEASURE_KINDS_V3 as readonly string[]).includes(kind)) {
    throw badRequest('Chọn loại phương án xử lý trong danh sách.');
  }
  return kind as MeasureKindV3;
}

function checkCustomName(kind: MeasureKindV3, name: unknown): string | null {
  const text = String(name ?? '').trim();
  if (kind !== 'other') return null;
  /* T13: tên phương án của loại "Khác" (GVCN tự đặt) cần ≥ 3 ký tự. */
  const loi = kiemGhiRoKhac(text);
  if (loi) throw badRequest(`Loại "Khác" — tên phương án: ${loi}.`);
  return text.slice(0, 120);
}

function checkOwner(userId: unknown): number | null {
  if (userId === null || userId === undefined || userId === '') return null;
  const id = Number(userId);
  if (!laNguoiHopLe(id, 'nhan_vien')) throw badRequest('Người phụ trách phải là nhân viên đang làm việc.');
  return id;
}

/** GVCN đang phụ trách lớp của em; không có thì người tạo. */
function defaultOwner(classId: number | null, creator: number): number {
  if (!classId) return creator;
  const today = demoToday();
  const r = db()
    .prepare(
      `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'
          AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?) ORDER BY id LIMIT 1`,
    )
    .get(classId, today, today) as any;
  return r?.user_id ?? creator;
}

/** B02: ít nhất một vi phạm, của ĐÚNG MỘT học viên. Trả về danh sách đã khử trùng. */
function checkViolationSet(studentId: number, ids: unknown): number[] {
  const list = [...new Set((Array.isArray(ids) ? ids : []).map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))];
  if (!list.length) throw badRequest('Phương án xử lý phải có ít nhất một vi phạm.');
  const found = violationsByIds(list);
  if (found.length !== list.length) throw notFound('Không tìm thấy một trong các vi phạm đã chọn');
  if (found.some((v) => v.studentId !== studentId)) {
    throw badRequest('Một phương án xử lý chỉ xử lý một học viên — không gom vi phạm của nhiều em vào cùng một phương án.');
  }
  return list;
}

function requirePreparing(row: any, what: string) {
  if (row.status !== 'preparing') {
    throw badRequest(`Phương án xử lý này đã thực hiện — ${what} đã khóa. Chỉ bổ sung được ghi chú và tệp.`);
  }
}

// ---------------------------------------------------------------- tạo, sửa, xóa (B01–B05, B09–B12)

export function createMeasure(p: Principal, input: {
  studentId: number; kind?: string; customName?: string | null; violationIds?: number[];
  ownerUserId?: number | null; note?: string | null; idempotencyKey?: string | null;
}): MeasureDetail {
  const student = db().prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  requireManageDiscipline(p, input.studentId, MANAGE_MESSAGE);

  const key = input.idempotencyKey?.trim() || null;
  if (key) {
    const seen = db().prepare('SELECT id, student_id, created_by FROM discipline_measures WHERE idempotency_key = ?').get(key) as any;
    if (seen) {
      if (seen.student_id !== input.studentId || seen.created_by !== p.userId) throw badRequest(KEY_TAKEN_MESSAGE);
      return buildDetail(p, loadRow(seen.id));
    }
  }

  const kind = checkKind(input.kind);
  const customName = checkCustomName(kind, input.customName);
  const ids = checkViolationSet(input.studentId, input.violationIds);
  const classId = activeClassOf(input.studentId);
  const cycleId = currentCycle(input.studentId)?.id ?? null;
  const problem = chainProblem(input.studentId, cycleId, kind, 0, 'create');
  if (problem) throw badRequest(problem.message);
  const owner = checkOwner(input.ownerUserId) ?? defaultOwner(classId, p.userId);

  const id = tx(() => {
    const info = db()
      .prepare(
        `INSERT INTO discipline_measures (student_id, cycle_id, class_id, kind, custom_name, status, owner_user_id, note,
                                          idempotency_key, created_at, created_by)
         VALUES (?,?,?,?,?, 'preparing', ?,?,?,?,?)`,
      )
      .run(input.studentId, cycleId, classId, kind, customName, owner, (input.note ?? '').trim() || null, key, nowIso(), p.userId);
    const newId = Number(info.lastInsertRowid);
    const link = db().prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
    for (const v of ids) { link.run(newId, v, p.userId, nowIso()); noteMeasureChange(v, null, newId, p.userId); }
    writeAudit({
      actorUserId: p.userId, action: 'measure.create', entityType: 'discipline_measure', entityId: newId,
      entityLabel: `${student.student_code} · ${kindLabelOf(kind, customName)}`,
      after: { kind, violations: ids, cycleId },
    });
    return newId;
  });
  return buildDetail(p, loadRow(id));
}

/** B09: thêm vi phạm vào biện pháp Đang chuẩn bị (GVCN gộp thêm vi phạm mới phát sinh trong lúc chờ). */
export function addViolations(p: Principal, id: number, violationIds: number[]): MeasureDetail {
  const row = loadRow(id);
  requireManageDiscipline(p, row.student_id, MANAGE_MESSAGE);
  requirePreparing(row, 'danh sách vi phạm');
  const ids = checkViolationSet(row.student_id, violationIds);
  tx(() => {
    const has = db().prepare('SELECT 1 FROM measure_violations WHERE measure_id = ? AND violation_id = ?');
    const link = db().prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
    for (const v of ids) {
      if (has.get(id, v)) continue;
      link.run(id, v, p.userId, nowIso());
      noteMeasureChange(v, null, id, p.userId);
    }
    db().prepare('UPDATE discipline_measures SET updated_at = ? WHERE id = ?').run(nowIso(), id);
    writeAudit({ actorUserId: p.userId, action: 'measure.add_violations', entityType: 'discipline_measure', entityId: id,
      entityLabel: `${row.student_code} · ${kindLabelOf(row.kind, row.custom_name)}`, after: { violations: ids } });
  });
  return buildDetail(p, loadRow(id));
}

/** B09: bỏ một vi phạm khỏi biện pháp Đang chuẩn bị; vi phạm quay về Chưa xử lý (nếu không nằm ở biện pháp nào khác). Không bỏ được vi phạm cuối cùng. */
export function removeViolation(p: Principal, id: number, violationId: number): MeasureDetail {
  const row = loadRow(id);
  requireManageDiscipline(p, row.student_id, MANAGE_MESSAGE);
  requirePreparing(row, 'danh sách vi phạm');
  const inside = violationIdsOf(id);
  if (!inside.includes(violationId)) throw badRequest('Vi phạm này không nằm trong phương án xử lý.');
  if (inside.length === 1) throw badRequest('Phương án xử lý phải còn ít nhất một vi phạm — muốn bỏ hết thì xóa phương án.');
  tx(() => {
    db().prepare('DELETE FROM measure_violations WHERE measure_id = ? AND violation_id = ?').run(id, violationId);
    noteMeasureChange(violationId, id, null, p.userId);
    db().prepare('UPDATE discipline_measures SET updated_at = ? WHERE id = ?').run(nowIso(), id);
    writeAudit({ actorUserId: p.userId, action: 'measure.remove_violation', entityType: 'discipline_measure', entityId: id,
      entityLabel: `${row.student_code} · ${kindLabelOf(row.kind, row.custom_name)}`, before: { violationId } });
  });
  return buildDetail(p, loadRow(id));
}

/**
 * B09/B10/B11, Q1/Q2 — sửa. `preparing`: đổi loại (kiểm lại chuỗi Thư cảnh cáo với loại mới), tên, ghi chú, người phụ
 * trách VÀ danh sách vi phạm (`violationIds` — tập ĐẦY ĐỦ mong muốn, một giao dịch cùng loại/nội dung/phụ trách thay vì
 * gọi lẻ `addViolations`/`removeViolation` nhiều lần). `checkViolationSet` không lọc trạng thái nên gắn được cả vi phạm
 * đã nằm ở biện pháp khác (§3.11). `done`: chỉ sửa ghi chú (và tệp qua kho tệp), có audit — bổ sung bằng chứng, không
 * viết lại phạm vi. Không đổi gì (kể cả danh sách vi phạm) thì không ghi audit.
 */
export function updateMeasure(p: Principal, id: number, patch: {
  kind?: string; customName?: string | null; note?: string | null; ownerUserId?: number | null; violationIds?: number[];
}): MeasureDetail {
  const row = loadRow(id);
  requireManageDiscipline(p, row.student_id, MANAGE_MESSAGE);
  const label = `${row.student_code} · ${kindLabelOf(row.kind, row.custom_name)}`;

  if (row.status === 'done') {
    if (patch.kind !== undefined || patch.customName !== undefined || patch.ownerUserId !== undefined || patch.violationIds !== undefined) {
      requirePreparing(row, 'loại, người phụ trách và danh sách vi phạm');
    }
    if (patch.note !== undefined) {
      const note = String(patch.note ?? '').trim() || null;
      if (note !== (row.note ?? null)) {
        db().prepare('UPDATE discipline_measures SET note = ?, updated_at = ? WHERE id = ?').run(note, nowIso(), id);
        writeAudit({ actorUserId: p.userId, action: 'measure.note', entityType: 'discipline_measure', entityId: id, entityLabel: label,
          before: { note: row.note ?? null }, after: { note } });
      }
    }
    return buildDetail(p, loadRow(id));
  }

  const kind = patch.kind === undefined ? (row.kind as MeasureKindV3) : checkKind(patch.kind);
  const customName = checkCustomName(kind, patch.customName === undefined ? row.custom_name : patch.customName);
  if (kind !== row.kind) {
    const problem = chainProblem(row.student_id, row.cycle_id ?? null, kind, id, 'create');
    if (problem) throw badRequest(problem.message);
  }
  const note = patch.note === undefined ? row.note : (String(patch.note ?? '').trim() || null);
  const owner = patch.ownerUserId === undefined ? row.owner_user_id : checkOwner(patch.ownerUserId);

  const currentIds = violationIdsOf(id);
  let newIds: number[] | null = null;
  let toAdd: number[] = [];
  let toRemove: number[] = [];
  if (patch.violationIds !== undefined) {
    newIds = checkViolationSet(row.student_id, patch.violationIds);
    const next = new Set(newIds);
    const cur = new Set(currentIds);
    toAdd = newIds.filter((v) => !cur.has(v));
    toRemove = currentIds.filter((v) => !next.has(v));
  }

  const fieldsChanged = kind !== row.kind || customName !== (row.custom_name ?? null) || note !== (row.note ?? null)
    || (owner ?? null) !== (row.owner_user_id ?? null);
  if (!fieldsChanged && !toAdd.length && !toRemove.length) return buildDetail(p, row);

  tx(() => {
    db()
      .prepare('UPDATE discipline_measures SET kind = ?, custom_name = ?, note = ?, owner_user_id = ?, updated_at = ? WHERE id = ?')
      .run(kind, customName, note ?? null, owner ?? null, nowIso(), id);
    if (toAdd.length || toRemove.length) {
      const link = db().prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
      for (const v of toAdd) { link.run(id, v, p.userId, nowIso()); noteMeasureChange(v, null, id, p.userId); }
      const unlink = db().prepare('DELETE FROM measure_violations WHERE measure_id = ? AND violation_id = ?');
      for (const v of toRemove) { unlink.run(id, v); noteMeasureChange(v, id, null, p.userId); }
    }
    writeAudit({
      actorUserId: p.userId, action: 'measure.edit', entityType: 'discipline_measure', entityId: id, entityLabel: label,
      before: { kind: row.kind, note: row.note ?? null, owner: row.owner_user_id ?? null, violations: currentIds },
      after: { kind, note, owner, violations: newIds ?? currentIds },
    });
  });
  return buildDetail(p, loadRow(id));
}

/** B12 — xóa: chỉ khi Đang chuẩn bị. Vi phạm quay về Chưa xử lý, tệp đi theo, có audit. Biện pháp Đã thực hiện không xóa được — nó là việc đã làm thật. */
export function deleteMeasure(p: Principal, id: number): void {
  const row = loadRow(id);
  requireManageDiscipline(p, row.student_id, MANAGE_MESSAGE);
  if (row.status !== 'preparing') throw badRequest('Phương án xử lý này đã thực hiện — không xóa được, vì đó là việc đã làm thật.');
  const inside = violationIdsOf(id);
  /* Tệp trong kho chỉ xoá SAU KHI giao dịch chốt — giao dịch lui thì dòng còn mà tệp mất là không hoàn tác được. */
  const khoaTep: string[] = [];
  tx(() => {
    for (const v of inside) noteMeasureChange(v, id, null, p.userId);
    db().prepare('DELETE FROM measure_violations WHERE measure_id = ?').run(id);
    const files = purgeAttachmentsOf('discipline_measure', id, p.userId, khoaTep);
    db().prepare('DELETE FROM discipline_measures WHERE id = ?').run(id);
    writeAudit({ actorUserId: p.userId, action: 'measure.delete', entityType: 'discipline_measure', entityId: id,
      entityLabel: `${row.student_code} · ${kindLabelOf(row.kind, row.custom_name)}`,
      before: { kind: row.kind, status: row.status, violations: inside, attachments: files } });
  });
  xoaTepSauGiaoDich(khoaTep);
}

// ---------------------------------------------------------------- xác nhận đã thực hiện (B13–B16, Y01)

/**
 * XÁC NHẬN ĐÃ THỰC HIỆN. Bắt buộc ngày · người thực hiện · nội dung; tệp hoặc liên kết bắt buộc với ba Thư cảnh cáo và Đình chỉ
 * học (B13) — câu nói thiếu gì do CHÍNH `measureMissing` sinh, giao diện dùng cùng hàm nên nút mờ nói đúng câu máy chủ sẽ nói.
 * KHÔNG hỏi tiến bộ, KHÔNG có mức kết quả, KHÔNG mở vòng theo dõi hành vi (B15).
 */
export function confirmMeasure(p: Principal, id: number, input: {
  performedOn?: string | null; performedBy?: number | null; performerName?: string | null;
  note?: string | null; participants?: string | null;
}): MeasureDetail {
  const row = loadRow(id);
  requireManageDiscipline(p, row.student_id, MANAGE_MESSAGE);
  if (row.status !== 'preparing') throw badRequest('Phương án xử lý này đã thực hiện rồi.');

  const note = input.note === undefined ? (row.note ?? '') : String(input.note ?? '').trim();
  let performerName = String(input.performerName ?? '').trim() || null;
  let performedBy = input.performedBy ? Number(input.performedBy) : null;
  if (performedBy) {
    if (!laNguoiHopLe(performedBy, 'nhan_vien')) {
      throw badRequest('Người thực hiện phải là nhân viên đang làm việc. Người ngoài thì chọn "Người ngoài" và gõ tên.');
    }
    performerName = null; // Q5: có ID thì không ghi kèm tên tự do — một trong hai, không cả hai.
  } else if (!performerName) {
    /* K2-6d: thiếu người thực hiện thì máy chủ tự lấy người đang xác nhận — không còn báo lỗi. */
    performedBy = p.userId;
  }

  const missing = measureMissing(row.kind as MeasureKindV3, {
    performedOn: input.performedOn || null, content: note, attachments: attachmentCountOf(id),
    customName: row.custom_name, performer: !!(performedBy || performerName),
  });
  if (missing) throw badRequest(missing);

  const performedOn = String(input.performedOn);
  /* B14: cho ngày quá khứ (việc làm rồi mới vào ghi), không cho ngày tương lai. */
  if (!isIsoDate(performedOn)) throw badRequest('Ngày thực hiện không hợp lệ.');
  if (performedOn > demoToday()) throw badRequest('Ngày thực hiện không được ở tương lai.');

  const problem = chainProblem(row.student_id, row.cycle_id ?? null, row.kind, id, 'confirm');
  if (problem) throw badRequest(problem.message);

  const violations = violationsByIds(violationIdsOf(id));
  if (!violations.length) throw badRequest('Phương án xử lý phải có ít nhất một vi phạm.');

  tx(() => {
    db()
      .prepare(
        `UPDATE discipline_measures
            SET status = 'done', note = ?, performed_on = ?, performed_by = ?, performer_name = ?, participants = ?,
                confirmed_by = ?, confirmed_at = ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(note || null, performedOn, performedBy, performerName, String(input.participants ?? '').trim() || null,
           p.userId, nowIso(), nowIso(), id);
    writeAudit({
      actorUserId: p.userId, action: 'measure.confirm', entityType: 'discipline_measure', entityId: id,
      entityLabel: `${row.student_code} · ${kindLabelOf(row.kind, row.custom_name)}`,
      after: { performedOn, violations: violations.map((v) => v.id), count: violations.length },
    });
    if (measureNotifiesManager(row.kind)) notifyManagers(row, p.userId);
  });
  return buildDetail(p, loadRow(id));
}

/**
 * Y01 — Quản lý NHẬN THÔNG BÁO khi một Thư cảnh cáo hoặc Đình chỉ học được xác nhận, để biết chuyện nặng đã xảy ra trong chi
 * nhánh mình. Đây là tin để biết, KHÔNG phải cửa duyệt: biện pháp đã `done` từ lúc GVCN bấm xác nhận.
 */
function notifyManagers(row: any, actorId: number) {
  const branchId = row.class_id
    ? (db().prepare('SELECT branch_id FROM classes WHERE id = ?').get(row.class_id) as any)?.branch_id
    : (db().prepare('SELECT branch_id FROM students WHERE id = ?').get(row.student_id) as any)?.branch_id;
  const managers = db()
    .prepare(
      `SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE r.key IN ('manager', 'system_admin') AND ur.status = 'active' AND (ur.branch_id IS NULL OR ur.branch_id = ?)`,
    )
    .all(branchId ?? -1) as any[];
  for (const m of managers) {
    if (m.user_id === actorId) continue;
    notify({
      userId: m.user_id, kind: 'discipline',
      title: `${kindLabelOf(row.kind, row.custom_name)} — ${row.student_name}`,
      body: 'Đã được xác nhận thực hiện. Đây là thông báo để biết, không cần duyệt.',
      entityType: 'discipline_measure', entityId: row.id, dedupKey: `measure:${row.id}`,
    });
  }
}

// ---------------------------------------------------------------- đọc

export type MeasureFilter = { studentId?: number | null; classId?: number | null; status?: MeasureStatusV3 | null };

export function listMeasures(p: Principal, f: MeasureFilter): { rows: MeasureDetail[] } {
  if (!f.studentId && !f.classId) throw badRequest('Cần chọn học viên hoặc lớp để xem danh sách phương án xử lý.');
  if (f.studentId) requireViewStudent(p, f.studentId);
  else requireViewClass(p, f.classId!);
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.studentId) { where.push('m.student_id = ?'); args.push(f.studentId); }
  if (f.classId) {
    /* Biện pháp của học viên ĐANG HỌC ở lớp này, dù tạo ở lớp cũ — vấn đề Ý thức đi theo em (chủ sản phẩm chốt 21/09/2026). */
    where.push("m.student_id IN (SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active')"); args.push(f.classId);
  }
  if (f.status) { where.push('m.status = ?'); args.push(f.status); }
  const rows = db()
    .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY COALESCE(m.performed_on, m.created_at) DESC, m.id DESC`)
    .all(...args) as any[];
  /* Q10: quyền xem nhớ theo studentId — một lớp có nhiều PA của cùng học viên thì chỉ kiểm một lần. */
  const canViewOfStudent = new Map<number, boolean>();
  const canView = (studentId: number): boolean => {
    if (!canViewOfStudent.has(studentId)) {
      try { requireViewStudent(p, studentId); canViewOfStudent.set(studentId, true); }
      catch { canViewOfStudent.set(studentId, false); }
    }
    return canViewOfStudent.get(studentId)!;
  };
  return { rows: buildDetailMany(p, rows.filter((r) => canView(r.student_id))) };
}
