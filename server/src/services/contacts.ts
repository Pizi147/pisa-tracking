import { db } from '../db.ts';
import {
  CONTACT_KINDS, CONTACT_KIND_LABEL, PERMISSIONS, type ContactKind,
} from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, require_, scopeFor, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from './audit.ts';

/**
 * LIÊN HỆ — hai việc trao đổi bắt buộc khi có SOS, và những lần giáo viên chủ động gọi.
 *
 * Cố ý KHÔNG phải phương án hỗ trợ: chúng không tạo ra can thiệp học thuật nào, nên không
 * duyệt, không hẹn xem lại, không có kết quả chuyên môn để ghi. Chỉ cần xác nhận đã diễn ra.
 *
 * Nếu để chung bảng phương án thì mọi truy vấn "phương án nào chưa cập nhật kết quả" đều
 * phải viết thêm một câu "trừ hai loại này ra" — và sẽ có chỗ quên, rồi GVCN nhận một danh
 * sách đòi họ báo cáo kết quả chuyên môn của một cuộc gọi cho phụ huynh.
 */

function loadContact(id: number) {
  const row = db()
    .prepare(
      `SELECT c.*, s.full_name, s.student_code,
              (SELECT e.class_id FROM enrollments e
                WHERE e.student_id = c.student_id AND e.status = 'active'
                ORDER BY e.id DESC LIMIT 1) AS class_id
         FROM student_contacts c JOIN students s ON s.id = c.student_id
        WHERE c.id = ?`,
    )
    .get(id) as any;
  if (!row) throw notFound('Không tìm thấy việc trao đổi');
  return row;
}

/** Danh sách việc trao đổi của một học viên, mới nhất trước. */
export function contactsOfStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này ngoài phạm vi bạn được xem.');
  const rows = db()
    .prepare(
      `SELECT c.*, u.full_name AS done_by_name, a.attempt_no
         FROM student_contacts c
         LEFT JOIN users u ON u.id = c.done_by
         LEFT JOIN assessment_attempts a ON a.id = c.attempt_id
        WHERE c.student_id = ?
        ORDER BY COALESCE(c.done_on, c.due_date) DESC, c.id DESC`,
    )
    .all(studentId) as any[];
  const today = demoToday();
  return rows.map((r) => ({
    id: r.id, kind: r.kind as ContactKind, label: CONTACT_KIND_LABEL[r.kind as ContactKind] ?? r.kind,
    attemptId: r.attempt_id, attemptNo: r.attempt_no,
    dueDate: r.due_date, doneOn: r.done_on,
    doneByName: r.done_by_name ?? r.performer_name ?? null,
    note: r.note, auto: !!r.auto,
    /* Chỉ quá hạn khi CÓ hạn và chưa làm. Việc giáo viên tự thêm không có hạn nên không bao giờ đỏ. */
    overdue: !r.done_on && !!r.due_date && r.due_date < today,
  }));
}

/**
 * Xác nhận đã trao đổi. Ngày là bắt buộc — "đã làm rồi" mà không có ngày thì sau này không
 * ai biết đã làm lúc nào, và cũng không tính được có kịp hạn hay không.
 */
export function completeContact(p: Principal, contactId: number, input: {
  doneOn?: string | null; note?: string | null; performerName?: string | null;
}) {
  const c = loadContact(contactId);
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.student_id },
    'Bạn chỉ xác nhận được việc trao đổi của học viên trong phạm vi mình phụ trách.');
  const doneOn = input.doneOn || demoToday();
  if (!isIsoDate(doneOn)) throw badRequest('Ngày trao đổi không hợp lệ.');
  if (doneOn > demoToday()) throw badRequest('Không ghi được ngày trao đổi ở tương lai.');

  const conn = db();
  const performer = (input.performerName ?? '').trim() || null;
  conn
    .prepare(
      `UPDATE student_contacts SET done_on = ?, done_by = ?, performer_name = COALESCE(?, performer_name),
              note = ?, updated_at = ? WHERE id = ?`.replace(', updated_at = ?', ''),
    )
    .run(doneOn, performer ? null : p.userId, performer, (input.note ?? '').trim() || null, contactId);

  addJourney({
    studentId: c.student_id, cycleId: c.cycle_id,
    eventType: 'contact', eventDate: doneOn,
    title: CONTACT_KIND_LABEL[c.kind as ContactKind] ?? 'Trao đổi',
    detail: (input.note ?? '').trim() || null,
    refTable: 'student_contacts', refId: contactId, createdBy: p.userId,
    dedupKey: `contact:${contactId}`,
  });
  writeAudit({ actorUserId: p.userId, action: 'contact.done', entityType: 'student_contact',
    entityId: contactId, entityLabel: `${c.student_code} · ${c.kind}`, after: { doneOn } });
  return contactsOfStudent(p, c.student_id);
}

/** Giáo viên chủ động thêm một lần trao đổi ngoài SOS. Không có hạn nên không bao giờ quá hạn. */
export function addContact(p: Principal, input: {
  studentId: number; kind: string; doneOn?: string | null;
  note?: string | null; performerName?: string | null;
}) {
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  const enr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
    .get(input.studentId) as any;
  require_(p, PERMISSIONS.SOS_EDIT, { classId: enr?.class_id ?? null, studentId: input.studentId },
    'Bạn chỉ ghi được việc trao đổi của học viên trong phạm vi mình phụ trách.');
  if (!(CONTACT_KINDS as readonly string[]).includes(input.kind)) throw badRequest('Loại trao đổi không hợp lệ.');
  const doneOn = input.doneOn || demoToday();
  if (!isIsoDate(doneOn)) throw badRequest('Ngày trao đổi không hợp lệ.');

  const cycle = conn
    .prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
    .get(input.studentId) as any;
  const performer = (input.performerName ?? '').trim() || null;
  conn
    .prepare(
      `INSERT INTO student_contacts (student_id, cycle_id, attempt_id, kind, done_on, done_by,
                                     performer_name, note, auto, created_at)
       VALUES (?,?, NULL, ?,?,?,?,?, 0, ?)`,
    )
    .run(input.studentId, cycle?.id ?? null, input.kind, doneOn,
         performer ? null : p.userId, performer, (input.note ?? '').trim() || null, nowIso());
  return contactsOfStudent(p, input.studentId);
}

/**
 * Việc trao đổi đang chờ, trong phạm vi người xem — dùng cho màn Tổng quan.
 * Chỉ trả về việc người xem THỰC SỰ xác nhận được, không phải mọi việc họ nhìn thấy.
 */
export function pendingContacts(p: Principal, f: { branchId?: number | null } = {}) {
  const scope = scopeFor(p, PERMISSIONS.SOS_EDIT);
  if (scope.none) return [];
  const rows = db()
    .prepare(
      `SELECT c.*, s.full_name, cl.id AS class_id, cl.code AS class_code, cl.branch_id, a.attempt_no
         FROM student_contacts c
         JOIN students s ON s.id = c.student_id
         LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         LEFT JOIN classes cl ON cl.id = e.class_id
         LEFT JOIN assessment_attempts a ON a.id = c.attempt_id
        WHERE c.done_on IS NULL AND c.due_date IS NOT NULL AND s.archived_at IS NULL`,
    )
    .all() as any[];
  return rows
    .filter((r) => !f.branchId || r.branch_id === f.branchId)
    .filter((r) => can(p, PERMISSIONS.SOS_EDIT, { classId: r.class_id, studentId: r.student_id }));
}
