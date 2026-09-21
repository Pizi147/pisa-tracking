import { db, tx } from '../db.ts';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_DESCRIPTION_MIN, VIOLATION_OTHER_DESCRIPTION_MIN,
  VIOLATION_SKILLS, VIOLATION_SKILL_LABEL, VIOLATION_STATE_LABEL, MEASURE_KIND_LABEL, MEASURE_STATUS_LABEL,
  violationAgeDays, violationAgeLabel, violationState,
  type ViolationCategory, type ViolationState,
} from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { badRequest, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { currentCycle } from '../fasttrack/cycles.ts';
import {
  EDIT_VIOLATION_MESSAGE, KEY_TAKEN_MESSAGE, activeClassOf, canEditViolation, requireRecordViolation, requireViewClass, requireViewStudent,
} from './access.ts';

/**
 * VI PHẠM — MỖI SỰ VIỆC MỘT DÒNG ĐỘC LẬP (đặc tả §4.1 và §5.1–§5.2, nguồn mục 13–16).
 *
 * Vi phạm KHÔNG phải case: không đợt, không hạn, không mức độ, không người phụ trách. Ghi một vi phạm không sinh
 * biện pháp, case, tín hiệu, việc hay thông báo (V08) — nó chỉ xuất hiện trong hồ sơ học viên để GVCN theo dõi.
 *
 * TRẠNG THÁI XỬ LÝ KHÔNG ĐƯỢC LƯU Ở ĐÂY. Bốn trạng thái người dùng thấy (`Chưa xử lý` · `Đang chuẩn bị xử lý` · `Đã xử lý` ·
 * `Không còn hiệu lực`) là SUY RA: ba cái đầu từ bảng nối `measure_violations`, cái thứ tư từ cột `valid`. Lưu ở hai nơi
 * là lệch ở hai nơi.
 */

export type ViolationView = {
  id: number;
  studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; cycleId: number | null;
  category: ViolationCategory; categoryLabel: string;
  skill: string | null; skillLabel: string | null;
  occurredOn: string; reportedOn: string;
  reportedBy: number; reportedByName: string | null;
  description: string;
  valid: boolean;
  invalidReason: string | null; invalidatedBy: number | null; invalidatedByName: string | null; invalidatedAt: string | null;
  state: ViolationState; stateLabel: string;
  /** Số ngày từ ngày xảy ra tới hôm nay — chỉ có nghĩa với vi phạm chưa xử lý (W06). */
  ageDays: number;
  /** `⚠9n` khi vi phạm CHƯA XỬ LÝ đã quá 5 ngày, ngược lại rỗng (W06). */
  ageLabel: string;
  createdAt: string; updatedAt: string | null;
};

const SELECT = `
  SELECT v.*, s.full_name AS student_name, s.student_code, c.code AS class_code,
         ru.full_name AS reported_by_name, iu.full_name AS invalidated_by_name,
         EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                  WHERE mv.violation_id = v.id AND m.status = 'done') AS in_done,
         EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                  WHERE mv.violation_id = v.id AND m.status = 'preparing') AS in_preparing
    FROM violations v
    JOIN students s ON s.id = v.student_id
    LEFT JOIN classes c ON c.id = v.class_id
    LEFT JOIN users ru ON ru.id = v.reported_by
    LEFT JOIN users iu ON iu.id = v.invalidated_by`;

export function shapeViolation(r: any, today = demoToday()): ViolationView {
  const state = violationState({ valid: r.valid === 1, inDone: !!r.in_done, inPreparing: !!r.in_preparing });
  const ageDays = violationAgeDays(r.occurred_on, today);
  return {
    id: r.id,
    studentId: r.student_id, studentName: r.student_name, studentCode: r.student_code,
    classId: r.class_id ?? null, classCode: r.class_code ?? null, cycleId: r.cycle_id ?? null,
    category: r.category, categoryLabel: VIOLATION_CATEGORY_LABEL[r.category as ViolationCategory] ?? r.category,
    skill: r.skill ?? null, skillLabel: r.skill ? VIOLATION_SKILL_LABEL[r.skill] ?? r.skill : null,
    occurredOn: r.occurred_on, reportedOn: r.reported_on,
    reportedBy: r.reported_by, reportedByName: r.reported_by_name ?? null,
    description: r.description,
    valid: r.valid === 1,
    invalidReason: r.invalid_reason ?? null, invalidatedBy: r.invalidated_by ?? null,
    invalidatedByName: r.invalidated_by_name ?? null, invalidatedAt: r.invalidated_at ?? null,
    state, stateLabel: VIOLATION_STATE_LABEL[state],
    ageDays, ageLabel: state === 'unhandled' ? violationAgeLabel(ageDays) : '',
    createdAt: r.created_at, updatedAt: r.updated_at ?? null,
  };
}

function loadRow(id: number): any {
  const r = db().prepare(`${SELECT} WHERE v.id = ?`).get(id);
  if (!r) throw notFound('Không tìm thấy vi phạm');
  return r;
}

export function loadViolation(id: number): ViolationView {
  return shapeViolation(loadRow(id));
}

/** Nhiều vi phạm theo mã, cũ trước mới sau. Mã không tồn tại thì bị bỏ qua — nơi gọi so độ dài để biết. */
export function violationsByIds(ids: number[]): ViolationView[] {
  const out: ViolationView[] = [];
  const today = demoToday();
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    out.push(...(db()
      .prepare(`${SELECT} WHERE v.id IN (${chunk.map(() => '?').join(',')})`)
      .all(...chunk) as any[]).map((r) => shapeViolation(r, today)));
  }
  return out.sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
}

function loadStudent(studentId: number): any {
  const s = db().prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!s) throw notFound('Không tìm thấy học viên');
  return s;
}

// ---------------------------------------------------------------- kiểm dữ liệu vào (V02–V05)

function checkCategory(category: unknown): ViolationCategory {
  if (typeof category !== 'string' || !(VIOLATION_CATEGORIES as readonly string[]).includes(category)) {
    throw badRequest(`Hãy chọn nhóm vi phạm: ${VIOLATION_CATEGORIES.map((c) => VIOLATION_CATEGORY_LABEL[c]).join(' · ')}.`);
  }
  return category as ViolationCategory;
}

function checkDescription(category: ViolationCategory, description: unknown): string {
  const text = String(description ?? '').trim();
  if (text.length < VIOLATION_DESCRIPTION_MIN) {
    throw badRequest(`Mô tả vi phạm cần từ ${VIOLATION_DESCRIPTION_MIN} ký tự — nói rõ em đã làm gì, ở buổi nào.`);
  }
  /* V05: nhóm `Khác` mà mô tả ngắn thì `Khác` thành đúng cái ô "chưa rõ" vô nghĩa. */
  if (category === 'other' && text.length < VIOLATION_OTHER_DESCRIPTION_MIN) {
    throw badRequest(`Chọn nhóm "Khác" thì mô tả phải từ ${VIOLATION_OTHER_DESCRIPTION_MIN} ký tự để nói rõ đó là việc gì.`);
  }
  return text;
}

function checkSkill(skill: unknown): string | null {
  if (skill === null || skill === undefined || skill === '') return null;
  if (typeof skill !== 'string' || !(VIOLATION_SKILLS as readonly string[]).includes(skill)) {
    throw badRequest('Môn không hợp lệ — chọn một môn của lớp hoặc để trống.');
  }
  return skill;
}

/** V03: mặc định hôm nay, cho chọn ngày quá khứ (GV nhớ ra sau), không cho ngày tương lai. */
function checkOccurredOn(value: unknown): string {
  const today = demoToday();
  if (value === undefined || value === null || value === '') return today;
  if (!isIsoDate(value)) throw badRequest('Ngày xảy ra không hợp lệ.');
  if (value > today) throw badRequest('Ngày xảy ra không được ở tương lai.');
  return value;
}

/**
 * V04: môn TỰ ĐIỀN theo phân công của giáo viên ở lớp đó. Dạy đúng một môn thì điền môn đó; dạy nhiều môn, hoặc không dạy
 * môn nào (GVCN thuần, Quản lý), thì để trống cho người ghi chọn — hệ thống không đoán.
 */
export function defaultSkillFor(p: Principal, classId: number | null): string | null {
  if (!classId) return null;
  const today = demoToday();
  const skills = new Set(
    p.assignments
      .filter((a) => a.classId === classId && a.skill && a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today))
      .map((a) => a.skill as string),
  );
  return skills.size === 1 ? [...skills][0] : null;
}

// ---------------------------------------------------------------- ghi (V01–V08)

/** V06 — CẢNH BÁO TRÙNG MỀM: cùng học viên, cùng nhóm, cùng ngày xảy ra, vi phạm còn hiệu lực. Chỉ trả bản đang có; KHÔNG chặn, KHÔNG gộp. */
export function similarViolations(
  p: Principal,
  q: { studentId: number; category: string; occurredOn?: string | null; excludeId?: number | null },
): ViolationView[] {
  loadStudent(q.studentId);
  requireViewStudent(p, q.studentId);
  const on = q.occurredOn || demoToday();
  return (db()
    .prepare(`${SELECT} WHERE v.student_id = ? AND v.category = ? AND v.occurred_on = ? AND v.valid = 1 AND v.id != ? ORDER BY v.id`)
    .all(q.studentId, q.category, on, q.excludeId ?? 0) as any[]).map((r) => shapeViolation(r));
}

export function recordViolation(p: Principal, input: {
  studentId: number;
  category?: string;
  description?: string;
  occurredOn?: string | null;
  /** `undefined` = tự điền theo phân công (V04); `null` hoặc rỗng = người ghi chủ động để trống. */
  skill?: string | null;
  idempotencyKey?: string | null;
}): { violation: ViolationView; similar: ViolationView[] } {
  const student = loadStudent(input.studentId);
  requireRecordViolation(p, input.studentId);
  const classId = activeClassOf(input.studentId);
  if (!classId) {
    throw badRequest('Học viên này chưa xếp lớp hoặc không còn đang học — chưa ghi được vi phạm.');
  }

  const key = input.idempotencyKey?.trim() || null;
  if (key) {
    /* V07: gửi lại cùng một request (bấm hai lần, thử lại sau lỗi mạng) không tạo dòng thứ hai và không ghi audit thêm. */
    const seen = db().prepare('SELECT id, student_id, reported_by FROM violations WHERE idempotency_key = ?').get(key) as any;
    if (seen) {
      /* Chỉ PHÁT LẠI cho đúng người ghi và đúng học viên. Khoá của bản ghi khác mà trả về là lộ vi phạm của em ngoài phạm vi. */
      if (seen.student_id !== input.studentId || seen.reported_by !== p.userId) throw badRequest(KEY_TAKEN_MESSAGE);
      return { violation: loadViolation(seen.id), similar: [] };
    }
  }

  const category = checkCategory(input.category);
  const description = checkDescription(category, input.description);
  const occurredOn = checkOccurredOn(input.occurredOn);
  const skill = input.skill === undefined ? defaultSkillFor(p, classId) : checkSkill(input.skill);
  const cycle = currentCycle(input.studentId);
  const today = demoToday();

  /* Tính bản trùng TRƯỚC khi ghi để không tự thấy chính mình. */
  const similar = similarViolations(p, { studentId: input.studentId, category, occurredOn });

  const id = tx(() => {
    const info = db()
      .prepare(
        `INSERT INTO violations (student_id, cycle_id, class_id, category, skill, occurred_on, reported_on, reported_by,
                                 description, valid, idempotency_key, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,1,?,?)`,
      )
      .run(input.studentId, cycle?.id ?? null, classId, category, skill, occurredOn, today, p.userId, description, key, nowIso());
    const newId = Number(info.lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: 'violation.record', entityType: 'violation', entityId: newId,
      entityLabel: `${student.student_code} · ${VIOLATION_CATEGORY_LABEL[category]}`,
      after: { category, skill, occurredOn, description },
    });
    return newId;
  });
  return { violation: loadViolation(id), similar };
}

// ---------------------------------------------------------------- sửa và hủy ghi nhận (V09–V14)

function addHistory(violationId: number, field: string, oldValue: string | null, newValue: string | null,
  actor: number | null, reason: string | null = null) {
  db()
    .prepare(
      `INSERT INTO violation_history (violation_id, field, old_value, new_value, reason, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(violationId, field, oldValue, newValue, reason, actor, nowIso());
}

/**
 * Ghi vào NHẬT KÝ SỬA VI PHẠM một lần thay đổi liên quan tới biện pháp (thêm hoặc bỏ vi phạm khỏi biện pháp). Đặc tả §10
 * tình huống 8: bỏ một vi phạm khỏi biện pháp `preparing` để lại một dòng lịch sử. Giá trị là mã biện pháp; `field = 'measure'`.
 */
export function noteMeasureChange(violationId: number, oldMeasureId: number | null, newMeasureId: number | null, actor: number | null) {
  addHistory(violationId, 'measure', oldMeasureId === null ? null : String(oldMeasureId), newMeasureId === null ? null : String(newMeasureId), actor);
}

/**
 * V09 — sửa mô tả · nhóm · môn · ngày xảy ra. Mỗi trường ĐỔI ghi một dòng lịch sử (cũ → mới); không đổi gì thì không ghi.
 * V10 — người sửa: người ghi (vi phạm của chính mình), GVCN của lớp, Quản lý trong phạm vi.
 */
export function editViolation(p: Principal, id: number, patch: {
  description?: string; category?: string; skill?: string | null; occurredOn?: string | null;
}): ViolationView {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  if (!canEditViolation(p, row)) throw forbidden(EDIT_VIOLATION_MESSAGE);
  if (row.valid !== 1) throw badRequest('Vi phạm này đã không còn hiệu lực — không sửa được nữa, chỉ xem lại.');

  const category = patch.category === undefined ? (row.category as ViolationCategory) : checkCategory(patch.category);
  const description = patch.description === undefined && patch.category === undefined
    ? row.description
    : checkDescription(category, patch.description === undefined ? row.description : patch.description);
  const skill = patch.skill === undefined ? row.skill : checkSkill(patch.skill);
  const occurredOn = patch.occurredOn === undefined ? row.occurred_on : checkOccurredOn(patch.occurredOn);

  const changes: Array<[string, string | null, string | null]> = [];
  if (description !== row.description) changes.push(['description', row.description, description]);
  if (category !== row.category) changes.push(['category', row.category, category]);
  if ((skill ?? null) !== (row.skill ?? null)) changes.push(['skill', row.skill ?? null, skill ?? null]);
  if (occurredOn !== row.occurred_on) changes.push(['occurred_on', row.occurred_on, occurredOn]);
  if (!changes.length) return shapeViolation(row);

  tx(() => {
    db()
      .prepare('UPDATE violations SET description = ?, category = ?, skill = ?, occurred_on = ?, updated_at = ? WHERE id = ?')
      .run(description, category, skill ?? null, occurredOn, nowIso(), id);
    for (const [field, from, to] of changes) addHistory(id, field, from, to, p.userId);
    writeAudit({
      actorUserId: p.userId, action: 'violation.edit', entityType: 'violation', entityId: id,
      entityLabel: `${row.student_code} · ${VIOLATION_CATEGORY_LABEL[category]}`,
      before: Object.fromEntries(changes.map(([f, from]) => [f, from])),
      after: Object.fromEntries(changes.map(([f, , to]) => [f, to])),
    });
  });
  return loadViolation(id);
}

/**
 * V11 — ĐÁNH DẤU KHÔNG CHÍNH XÁC. Lý do BẮT BUỘC; KHÔNG BAO GIỜ xóa vật lý (nguồn mục 15: báo cáo của GV có thể sai, nhưng
 * lịch sử phải còn). V12/V14: vi phạm `valid = 0` ra khỏi mọi thống kê và cảnh báo, nhưng vẫn nằm trong lịch sử của học viên.
 * V13: vi phạm đã nằm trong biện pháp `done` vẫn hủy được — biện pháp giữ nguyên số vi phạm lúc xác nhận, và KHÔNG gỡ khỏi
 * bảng nối, vì biện pháp đó đã thực sự được làm.
 */
export function invalidateViolation(p: Principal, id: number, reason: string): ViolationView {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  if (!canEditViolation(p, row)) throw forbidden(EDIT_VIOLATION_MESSAGE);
  if (row.valid !== 1) throw badRequest('Vi phạm này đã không còn hiệu lực rồi.');
  const why = String(reason ?? '').trim();
  if (!why) throw badRequest('Cần ghi lý do đánh dấu không chính xác — ví dụ "em đã nộp, tôi bỏ sót".');

  tx(() => {
    db()
      .prepare('UPDATE violations SET valid = 0, invalid_reason = ?, invalidated_by = ?, invalidated_at = ?, updated_at = ? WHERE id = ?')
      .run(why, p.userId, nowIso(), nowIso(), id);
    addHistory(id, 'valid', '1', '0', p.userId, why);
    writeAudit({
      actorUserId: p.userId, action: 'violation.invalidate', entityType: 'violation', entityId: id,
      entityLabel: `${row.student_code} · ${VIOLATION_CATEGORY_LABEL[row.category as ViolationCategory]}`,
      before: { valid: true }, after: { valid: false, reason: why },
    });
  });
  return loadViolation(id);
}

// ---------------------------------------------------------------- đọc

export type ViolationFilter = {
  studentId?: number | null;
  /** Nhật ký vi phạm GHI Ở LỚP NÀY (cột `class_id` lúc ghi). Khác với bảng Ý thức của lớp, nơi vấn đề chưa xử lý đi theo học viên sang lớp mới. */
  classId?: number | null;
  state?: ViolationState | null;
  category?: string | null;
  from?: string | null;
  to?: string | null;
};

/**
 * Danh sách vi phạm theo học viên hoặc theo lớp. Mặc định trả CẢ vi phạm đã hết hiệu lực (V14: chúng vẫn nằm trong lịch sử,
 * gạch ngang kèm lý do); người gọi lọc bằng `state`.
 */
export function listViolations(p: Principal, f: ViolationFilter): { rows: ViolationView[] } {
  if (!f.studentId && !f.classId) throw badRequest('Cần chọn học viên hoặc lớp để xem danh sách vi phạm.');
  if (f.studentId) {
    loadStudent(f.studentId);
    requireViewStudent(p, f.studentId);
  } else {
    const cls = db().prepare('SELECT id FROM classes WHERE id = ?').get(f.classId) as any;
    if (!cls) throw notFound('Không tìm thấy lớp');
    requireViewClass(p, f.classId!);
  }
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.studentId) { where.push('v.student_id = ?'); args.push(f.studentId); }
  if (f.classId) { where.push('v.class_id = ?'); args.push(f.classId); }
  if (f.category) { where.push('v.category = ?'); args.push(f.category); }
  if (f.from) { where.push('v.occurred_on >= ?'); args.push(f.from); }
  if (f.to) { where.push('v.occurred_on <= ?'); args.push(f.to); }
  const today = demoToday();
  const rows = (db()
    .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY v.occurred_on DESC, v.id DESC`)
    .all(...args) as any[]).map((r) => shapeViolation(r, today));
  return { rows: f.state ? rows.filter((r) => r.state === f.state) : rows };
}

export type ViolationDetail = ViolationView & {
  attachmentCount: number;
  canEdit: boolean;
  /** Các biện pháp liên quan (nguồn mục 32) — "Đã xử lý" KHÔNG có nghĩa là xóa hay ẩn khỏi lịch sử. */
  measures: Array<{
    id: number; kind: string; kindLabel: string; status: string; statusLabel: string;
    performedOn: string | null; createdAt: string;
  }>;
  history: Array<{
    id: number; field: string; oldValue: string | null; newValue: string | null; reason: string | null;
    actorUserId: number | null; actorName: string | null; createdAt: string;
  }>;
};

export function violationDetail(p: Principal, id: number): ViolationDetail {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  const v = shapeViolation(row);
  const measures = (db()
    .prepare(
      `SELECT m.id, m.kind, m.custom_name, m.status, m.performed_on, m.created_at
         FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
        WHERE mv.violation_id = ? ORDER BY COALESCE(m.performed_on, m.created_at), m.id`,
    )
    .all(id) as any[]).map((m) => ({
      id: m.id, kind: m.kind,
      kindLabel: m.kind === 'other' && m.custom_name ? m.custom_name : MEASURE_KIND_LABEL[m.kind as keyof typeof MEASURE_KIND_LABEL] ?? m.kind,
      status: m.status, statusLabel: MEASURE_STATUS_LABEL[m.status as keyof typeof MEASURE_STATUS_LABEL] ?? m.status,
      performedOn: m.performed_on ?? null, createdAt: m.created_at,
    }));
  const history = (db()
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM violation_history h LEFT JOIN users u ON u.id = h.actor_user_id
        WHERE h.violation_id = ? ORDER BY h.id`,
    )
    .all(id) as any[]).map((h) => ({
      id: h.id, field: h.field, oldValue: h.old_value ?? null, newValue: h.new_value ?? null, reason: h.reason ?? null,
      actorUserId: h.actor_user_id ?? null, actorName: h.actor_name ?? null, createdAt: h.created_at,
    }));
  const attachmentCount = (db()
    .prepare("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'violation' AND owner_id = ?")
    .get(id) as any).n as number;
  return { ...v, attachmentCount, canEdit: canEditViolation(p, row) && row.valid === 1, measures, history };
}
