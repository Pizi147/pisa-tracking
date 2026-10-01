import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { forbidden, notFound } from '../util.ts';

/**
 * QUYỀN CỦA MODULE Ý THỨC — MỘT nơi (thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md mục 6).
 *
 * Áp ở MÁY CHỦ trước; giao diện chỉ ẩn nút cho gọn mắt. Module khác (kho tệp) hỏi quyền qua đây thay vì tự dựng lại
 * ngữ cảnh — đúng bài học AUTH-01: mỗi nơi tự viết `can(...)` một kiểu là cách sinh ra lỗi quyền.
 *
 *   Xem            mọi giáo viên dạy lớp đó · Quản lý trong phạm vi · Quản trị       → `student.view`
 *   Ghi vi phạm    mọi giáo viên dạy lớp đó (kể cả trái môn — C02 KHÔNG áp cho Ý thức)  → `violation.record`
 *   Sửa/hủy của mình   người đã ghi (nếu còn được ghi vi phạm của lớp đó)
 *   Xử lý          GVCN của lớp · Quản lý trong phạm vi · Quản trị                     → `discipline.manage`
 *
 * "Lớp" ở đây là lớp em ĐANG học: người đang chịu trách nhiệm về em là GVCN hiện tại, không phải GVCN của lớp em đã rời.
 */

export const VIEW_MESSAGE = 'Bản ghi này nằm ngoài phạm vi bạn được xem.';

/** Lớp em đang học (ghi danh còn hiệu lực gần nhất), hoặc null nếu em không còn học ở lớp nào. */
export function activeClassOf(studentId: number): number | null {
  /* PR-Dọn (Task 9c): nhớ trong request GET — hồ sơ HV hỏi lại nhiều lần (bảng kỹ năng, Cuối khoá, khối lớp học). */
  return nho(`lop-dang-hoc:${studentId}`, () => (db()
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`)
    .get(studentId) as any)?.class_id ?? null);
}

/** Ngữ cảnh quyền của một học viên. */
export function studentCtx(studentId: number) {
  return { classId: activeClassOf(studentId), studentId };
}

/** Người này có xử lý được Ý thức của học viên không: GVCN của lớp em đang học, Quản lý trong phạm vi, Quản trị. */
export function canManageDiscipline(p: Principal, studentId: number): boolean {
  return can(p, PERMISSIONS.DISCIPLINE_MANAGE, studentCtx(studentId));
}

/** Xem một LỚP: giáo viên dạy lớp đó, Quản lý trong phạm vi, Quản trị. */
export function requireViewClass(p: Principal, classId: number) {
  require_(p, PERMISSIONS.STUDENT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
}

export function requireViewStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.STUDENT_VIEW, studentCtx(studentId), VIEW_MESSAGE);
}

export function requireRecordViolation(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.VIOLATION_RECORD, studentCtx(studentId),
    'Bạn chỉ ghi được vi phạm của học viên thuộc phạm vi mình phụ trách.');
}

export function requireManageDiscipline(p: Principal, studentId: number, message: string) {
  require_(p, PERMISSIONS.DISCIPLINE_MANAGE, studentCtx(studentId), message);
}

/** Vi phạm này sửa/hủy được không: người ghi (vi phạm của chính mình), hoặc người xử lý Ý thức của học viên (V10). */
export function canEditViolation(p: Principal, v: { student_id: number; reported_by: number }): boolean {
  if (v.reported_by === p.userId && can(p, PERMISSIONS.VIOLATION_RECORD, studentCtx(v.student_id))) return true;
  return canManageDiscipline(p, v.student_id);
}

/** Khoá gửi lại (idempotency) đã gắn với bản ghi của người khác hoặc của học viên khác — không phát lại, để khỏi lộ dữ liệu ngoài phạm vi. */
export const KEY_TAKEN_MESSAGE = 'Khoá gửi lại này đã được dùng cho một bản ghi khác — tạo một lần gửi mới.';

export const EDIT_VIOLATION_MESSAGE =
  'Bạn không có quyền sửa vi phạm này — chỉ người ghi (với vi phạm của chính mình), giáo viên chủ nhiệm của lớp '
  + 'hoặc Quản lý trong phạm vi mới sửa được.';

/** Kho tệp: quyền của vi phạm làm chủ. Xem = quyền xem học viên; thêm/gỡ = quyền sửa vi phạm đó. */
export function violationOwner(violationId: number) {
  const v = db().prepare('SELECT student_id, reported_by FROM violations WHERE id = ?').get(violationId) as any;
  if (!v) throw notFound('Không tìm thấy vi phạm');
  return {
    requireView: (p: Principal) => requireViewStudent(p, v.student_id),
    requireEdit: (p: Principal) => {
      requireViewStudent(p, v.student_id);
      if (!canEditViolation(p, v)) throw forbidden('Bạn không có quyền đính kèm hoặc gỡ bằng chứng của vi phạm này.');
    },
  };
}

/** Kho tệp: quyền của việc Phối hợp SOS làm chủ (PR-T). Xem = quyền xem học viên (GVBM xem được); thêm/gỡ = GVCN của lớp em đang học + Quản lý (P04). */
export function coordinationOwner(actionId: number) {
  const a = db().prepare('SELECT student_id FROM sos_coordination_actions WHERE id = ?').get(actionId) as any;
  if (!a) throw notFound('Không tìm thấy việc phối hợp');
  return {
    requireView: (p: Principal) => requireViewStudent(p, a.student_id),
    requireEdit: (p: Principal) => {
      requireViewStudent(p, a.student_id);
      requireManageDiscipline(p, a.student_id, 'Bạn không có quyền đính kèm hoặc gỡ bằng chứng của việc phối hợp này — chỉ giáo viên chủ nhiệm và Quản lý.');
    },
  };
}

/** Kho tệp: quyền của biện pháp làm chủ. Xem = quyền xem học viên; thêm/gỡ = quyền xử lý Ý thức (B10: vẫn bổ sung được khi đã thực hiện). */
export function measureOwner(measureId: number) {
  const m = db().prepare('SELECT student_id FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy lần xử lý');
  return {
    requireView: (p: Principal) => requireViewStudent(p, m.student_id),
    requireEdit: (p: Principal) => {
      requireViewStudent(p, m.student_id);
      requireManageDiscipline(p, m.student_id, 'Bạn không có quyền đính kèm hoặc gỡ bằng chứng của lần xử lý này.');
    },
  };
}
