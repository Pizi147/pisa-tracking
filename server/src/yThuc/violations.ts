import { db, tx } from '../db.ts';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_DESCRIPTION_MIN, ghepKhac, kiemGhiRoKhac,
  VIOLATION_SKILLS, VIOLATION_SKILL_LABEL, VIOLATION_STATE_LABEL, MEASURE_KIND_LABEL, MEASURE_STATUS_LABEL,
  violationAgeDays, violationAgeLabel, violationState,
  type ViolationCategory, type ViolationState, type MeasureKind,
} from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { badRequest, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { currentCycle } from '../fasttrack/cycles.ts';
import { purgeAttachmentsOf, xoaTepSauGiaoDich } from '../platform/attachments.ts';
import {
  EDIT_VIOLATION_MESSAGE, KEY_TAKEN_MESSAGE, activeClassOf, canEditViolation, requireRecordViolation, requireViewClass, requireViewStudent,
} from './access.ts';

/**
 * VI PHẠM — MỖI SỰ VIỆC MỘT DÒNG ĐỘC LẬP (đặc tả §4.1 và §5.1–§5.2, nguồn mục 13–16).
 *
 * Vi phạm KHÔNG phải case: không đợt, không hạn, không mức độ, không người phụ trách. Ghi một vi phạm không sinh
 * biện pháp, case, tín hiệu, việc hay thông báo (V08) — nó chỉ xuất hiện trong hồ sơ học viên để GVCN theo dõi.
 *
 * TRẠNG THÁI XỬ LÝ KHÔNG ĐƯỢC LƯU Ở ĐÂY. Ba trạng thái người dùng thấy (`Chưa xử lý` · `Đang chuẩn bị xử lý` · `Đã xử lý`) là SUY RA từ bảng nối
 * `measure_violations`. Lưu ở hai nơi là lệch ở hai nơi.
 *
 * GHI SAI THÌ SỬA HOẶC XOÁ THẲNG (rulebook v3, V11′–V14′ — thay "đánh dấu không chính xác" của PR-J): không còn trạng thái `Không còn hiệu lực`.
 * Các cột `valid`/`invalid_*` của bảng `violations` NGỪNG DÙNG (giữ trong schema để `migrate` an toàn; mọi dòng cũ `valid = 0` đã được xoá khi nâng cấp).
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
  state: ViolationState; stateLabel: string;
  /** Số ngày từ ngày xảy ra tới hôm nay — chỉ có nghĩa với vi phạm chưa xử lý (W06). */
  ageDays: number;
  /** `9 ngày` khi vi phạm CHƯA XỬ LÝ đã quá 5 ngày, ngược lại rỗng (W06). */
  ageLabel: string;
  createdAt: string; updatedAt: string | null;
};

const SELECT = `
  SELECT v.*, s.full_name AS student_name, s.student_code, c.code AS class_code,
         ru.full_name AS reported_by_name,
         EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                  WHERE mv.violation_id = v.id AND m.status = 'done') AS in_done,
         EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                  WHERE mv.violation_id = v.id AND m.status = 'preparing') AS in_preparing
    FROM violations v
    JOIN students s ON s.id = v.student_id
    LEFT JOIN classes c ON c.id = v.class_id
    LEFT JOIN users ru ON ru.id = v.reported_by`;

export function shapeViolation(r: any, today = demoToday()): ViolationView {
  const state = violationState({ inDone: !!r.in_done, inPreparing: !!r.in_preparing });
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
    throw badRequest(`Chọn nhóm vi phạm: ${VIOLATION_CATEGORIES.map((c) => VIOLATION_CATEGORY_LABEL[c]).join(' · ')}.`);
  }
  return category as ViolationCategory;
}

function checkDescription(category: ViolationCategory, description: unknown, ghiRoKhac?: string | null): string {
  const text = String(description ?? '').trim();
  if (text.length < VIOLATION_DESCRIPTION_MIN) {
    throw badRequest(`Mô tả vi phạm cần từ ${VIOLATION_DESCRIPTION_MIN} ký tự — nói rõ em đã làm gì, ở buổi nào.`);
  }
  if (category !== 'other') return text;
  /*
   * V05 (bản T13): nhóm Khác cần ô Ghi rõ ≥ 3 ký tự. Vi phạm không có cột riêng cho chữ đó (Q9) nên ghép vào đầu mô tả
   * `{ghi rõ} — {mô tả}`. Sửa lại mà không gửi `ghiRoKhac`: phần trước " — " của mô tả đang lưu chính là chữ Ghi rõ cũ.
   */
  const loi = kiemGhiRoKhac(ghiRoKhac ?? (text.includes(' — ') ? text.split(' — ')[0] : ''));
  if (loi) throw badRequest(`Chọn nhóm "Khác": ${loi}.`);
  return ghepKhac(ghiRoKhac ?? '', text);
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

/** V06 — CẢNH BÁO TRÙNG MỀM: cùng học viên, cùng nhóm, cùng ngày xảy ra. Chỉ trả bản đang có; KHÔNG chặn, KHÔNG gộp. */
export function similarViolations(
  p: Principal,
  q: { studentId: number; category: string; occurredOn?: string | null; excludeId?: number | null },
): ViolationView[] {
  loadStudent(q.studentId);
  requireViewStudent(p, q.studentId);
  const on = q.occurredOn || demoToday();
  return (db()
    .prepare(`${SELECT} WHERE v.student_id = ? AND v.category = ? AND v.occurred_on = ? AND v.id != ? ORDER BY v.id`)
    .all(q.studentId, q.category, on, q.excludeId ?? 0) as any[]).map((r) => shapeViolation(r));
}

export function recordViolation(p: Principal, input: {
  studentId: number;
  category?: string;
  description?: string;
  /** Nhóm `Khác` (T13): chữ ô Ghi rõ, ≥ 3 ký tự — ghép vào đầu mô tả. */
  ghiRoKhac?: string | null;
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
  const description = checkDescription(category, input.description, input.ghiRoKhac);
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
                                 description, idempotency_key, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
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

// ---------------------------------------------------------------- sửa và xoá (V09–V10, V11′–V14′)

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
  /** Nhóm `Khác` (T13): chữ ô Ghi rõ. Không gửi thì lấy phần trước " — " của mô tả đang lưu. */
  ghiRoKhac?: string | null;
}): ViolationView {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  if (!canEditViolation(p, row)) throw forbidden(EDIT_VIOLATION_MESSAGE);

  const category = patch.category === undefined ? (row.category as ViolationCategory) : checkCategory(patch.category);
  const description = patch.description === undefined && patch.category === undefined
    ? row.description
    : checkDescription(category, patch.description === undefined ? row.description : patch.description, patch.ghiRoKhac);
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
 * V11′–V14′ — XOÁ THẲNG (rulebook v3, thay "đánh dấu không chính xác" của PR-J). Không lý do, không hộp thoại nhập chữ: giao diện chỉ hỏi một dòng
 * `Xoá vi phạm này? Nó sẽ bị gỡ khỏi {n} biện pháp.`
 *
 *   V11′  không còn trạng thái `Không còn hiệu lực`.
 *   V12′  xoá được ở mọi nơi — kể cả vi phạm đang nằm trong biện pháp ĐÃ THỰC HIỆN.
 *   V13′  xoá dòng `violations`, các dòng `measure_violations`, lịch sử sửa và tệp gắn với nó; mọi số liệu tự cập nhật (không có gì lưu sẵn để lệch);
 *         ghi MỘT dòng `audit_logs` (ai · lúc nào · nội dung đã xoá) — chỉ để truy vết, không hiện trên giao diện.
 *   V14′  biện pháp ĐÃ THỰC HIỆN mất hết vi phạm do xoá vẫn được giữ (việc đã làm thật), hiện `0 vi phạm`: số của biện pháp luôn là số ĐANG GẮN.
 *   V10   người xoá: người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi — cùng quyền với sửa.
 *
 * Trả về số biện pháp đã bị gỡ vi phạm (để giao diện nói "đã gỡ khỏi n biện pháp").
 */
export function deleteViolation(p: Principal, id: number): { ok: true; removedFromMeasures: number } {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  if (!canEditViolation(p, row)) throw forbidden(EDIT_VIOLATION_MESSAGE);

  /*
   * Q15 — B02 đòi PA phải có ít nhất một vi phạm: PA ĐANG CHUẨN BỊ mà vi phạm này là DUY NHẤT thì chặn xoá (xoá phương án
   * trước, hoặc thêm vi phạm khác). PA ĐÃ THỰC HIỆN không chặn — V14′ giữ việc đã làm thật, hiện 0 vi phạm nếu xoá hết.
   */
  const soleOfPreparing = db()
    .prepare(
      `SELECT m.kind, m.custom_name
         FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
        WHERE mv.violation_id = ? AND m.status = 'preparing'
          AND (SELECT COUNT(*) FROM measure_violations WHERE measure_id = m.id) = 1`,
    )
    .get(id) as any;
  if (soleOfPreparing) {
    const label = soleOfPreparing.kind === 'other' && soleOfPreparing.custom_name
      ? soleOfPreparing.custom_name
      : MEASURE_KIND_LABEL[soleOfPreparing.kind as MeasureKind] ?? soleOfPreparing.kind;
    throw badRequest(`Đây là vi phạm duy nhất của phương án «${label}» đang chuẩn bị — xoá phương án trước, hoặc thêm vi phạm khác vào phương án.`);
  }

  /* Tệp trong kho chỉ xoá SAU KHI giao dịch chốt — giao dịch lui thì dòng còn mà tệp mất là không hoàn tác được. */
  const khoaTep: string[] = [];
  const result = tx(() => {
    const measureIds = (db().prepare('SELECT measure_id FROM measure_violations WHERE violation_id = ? ORDER BY measure_id').all(id) as any[])
      .map((r) => r.measure_id as number);
    const files = purgeAttachmentsOf('violation', id, p.userId, khoaTep);
    db().prepare('DELETE FROM measure_violations WHERE violation_id = ?').run(id);
    db().prepare('DELETE FROM violation_history WHERE violation_id = ?').run(id);
    db().prepare('DELETE FROM violations WHERE id = ?').run(id);
    writeAudit({
      actorUserId: p.userId, action: 'violation.delete', entityType: 'violation', entityId: id,
      entityLabel: `${row.student_code} · ${VIOLATION_CATEGORY_LABEL[row.category as ViolationCategory]}`,
      before: {
        studentId: row.student_id, studentCode: row.student_code, classId: row.class_id ?? null, category: row.category, skill: row.skill ?? null,
        occurredOn: row.occurred_on, reportedOn: row.reported_on, reportedBy: row.reported_by, description: row.description,
        measureIds, attachments: files,
      },
    });
    return { ok: true as const, removedFromMeasures: measureIds.length };
  });
  xoaTepSauGiaoDich(khoaTep);
  return result;
}

// ---------------------------------------------------------------- đọc

export type ViolationFilter = {
  studentId?: number | null;
  /** Nhật ký vi phạm GHI Ở LỚP NÀY (cột `class_id` lúc ghi). Khác với bảng Ý thức của lớp, nơi vấn đề chưa xử lý đi theo học viên sang lớp mới. */
  classId?: number | null;
  /** YT-6 "Theo thời gian" — HV ĐANG HỌC ở lớp này, MỌI trạng thái (không phải "ghi ở lớp lúc đó" như `classId`). */
  activeInClassId?: number | null;
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
  const classId = f.classId ?? f.activeInClassId ?? null;
  if (!f.studentId && !classId) throw badRequest('Cần chọn học viên hoặc lớp để xem danh sách vi phạm.');
  if (f.studentId) {
    loadStudent(f.studentId);
    requireViewStudent(p, f.studentId);
  } else {
    const cls = db().prepare('SELECT id FROM classes WHERE id = ?').get(classId) as any;
    if (!cls) throw notFound('Không tìm thấy lớp');
    requireViewClass(p, classId!);
  }
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.studentId) { where.push('v.student_id = ?'); args.push(f.studentId); }
  if (f.classId) { where.push('v.class_id = ?'); args.push(f.classId); }
  if (f.activeInClassId) { where.push(`v.student_id IN (SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active')`); args.push(f.activeInClassId); }
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
  return { ...v, attachmentCount, canEdit: canEditViolation(p, row), measures, history };
}
