import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { boVaiBpxl, can, require_, type Principal } from '../permissions.ts';
import { forbidden, notFound } from '../util.ts';
import { conHieuLuc } from '../worklist/hieuLuc.ts';

/**
 * QUYỀN CỦA MODULE Ý THỨC — MỘT nơi (thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md mục 6).
 *
 * Áp ở MÁY CHỦ trước; giao diện chỉ ẩn nút cho gọn mắt. Module khác (kho tệp) hỏi quyền qua đây thay vì tự dựng lại
 * ngữ cảnh — đúng bài học AUTH-01: mỗi nơi tự viết `can(...)` một kiểu là cách sinh ra lỗi quyền.
 *
 *   Xem            mọi giáo viên dạy lớp đó · Quản lý trong phạm vi · Quản trị       → `student.view` (trừ vai BPXL — N63 ⑤, như Case)
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

/**
 * RKC-3b: lớp gắn với em khi em KHÔNG đang học — Tạm dừng (ghi danh `paused`) trước, rồi ghi danh mới nhất. Dùng cho việc vẫn làm được với em không
 * còn học (ghi vi phạm, đề xuất sửa): GV lớp đó có quyền như khi em còn học. `null` = em chưa từng xếp lớp.
 */
export function lopGanNhat(studentId: number): number | null {
  return activeClassOf(studentId) ?? ((db().prepare(
    `SELECT class_id FROM enrollments WHERE student_id = ? ORDER BY status = 'paused' DESC, started_at DESC, id DESC LIMIT 1`,
  ).get(studentId) as any)?.class_id ?? null);
}

/** Ngữ cảnh quyền của một học viên. */
export function studentCtx(studentId: number) {
  return { classId: activeClassOf(studentId), studentId };
}

/** Người này có xử lý được Ý thức của học viên không: GVCN của lớp em đang học, Quản lý trong phạm vi, Quản trị. */
export function canManageDiscipline(p: Principal, studentId: number): boolean {
  return can(p, PERMISSIONS.DISCIPLINE_MANAGE, studentCtx(studentId));
}

/** Xem một LỚP: giáo viên dạy lớp đó, Quản lý trong phạm vi, Quản trị. N63 ⑤: BPXL không xem Ý thức (grant BPXL bỏ ra — như Case). */
export function requireViewClass(p: Principal, classId: number) {
  require_(boVaiBpxl(p), PERMISSIONS.STUDENT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
}

export function requireViewStudent(p: Principal, studentId: number) {
  require_(boVaiBpxl(p), PERMISSIONS.STUDENT_VIEW, studentCtx(studentId), VIEW_MESSAGE);
}

/** N63 ⑤: người xem thấy Ý thức của em (hồ sơ HV gửi khối Ý thức chỉ khi có) — cùng cổng `requireViewStudent`. */
export const xemYThucHv = (p: Principal, studentId: number): boolean => can(boVaiBpxl(p), PERMISSIONS.STUDENT_VIEW, studentCtx(studentId));

export function requireRecordViolation(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.VIOLATION_RECORD, { classId: lopGanNhat(studentId), studentId },   // RKC-3b: GV lớp ghi danh gần nhất của em Tạm dừng / đã học xong
    'Bạn chỉ ghi được vi phạm của học viên thuộc phạm vi mình phụ trách.');
}

export function requireManageDiscipline(p: Principal, studentId: number, message: string) {
  require_(p, PERMISSIONS.DISCIPLINE_MANAGE, studentCtx(studentId), message);
}

/** Vi phạm này sửa/hủy được không: người ghi (vi phạm của chính mình), hoặc người xử lý Ý thức của học viên (V10). */
export function canEditViolation(p: Principal, v: { student_id: number; reported_by: number; id?: number }): boolean {
  if (v.reported_by === p.userId && can(p, PERMISSIONS.VIOLATION_RECORD, studentCtx(v.student_id))) return true;
  return canManageDiscipline(p, v.student_id) || (v.id != null && nguoiNhanTraLai(p.userId, v.id));
}

/**
 * TL-1 (N61): quyền THEO VIỆC — người đang giữ việc "Vi phạm bị trả lại" ĐANG MỞ của đúng vi phạm này (người được giao, hoặc người nhận theo luật khi chưa
 * giao ai) sửa / xoá được nó dù không còn là người ghi hợp lệ. Còn hoạt động + còn vai ở chi nhánh em (như `conHieuLuc`). Một câu, chỉ khi hai cửa trên đóng.
 */
function nguoiNhanTraLai(uid: number, violationId: number): boolean {
  return !!db().prepare(`SELECT 1 FROM vi_pham_tra_lai t JOIN users u ON u.id = ?1 AND u.status = 'active' AND u.deleted_at IS NULL
      WHERE t.violation_id = ?2 AND t.trang_thai = 'mo' AND (t.phu_trach_id = ?1 OR (t.phu_trach_id IS NULL AND t.nguoi_nhan = ?1))
        AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = ?1 AND ur.status = 'active' AND (ur.branch_id IS NULL OR ur.branch_id = COALESCE(
          (SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = t.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1),
          (SELECT s.branch_id FROM students s WHERE s.id = t.student_id))))`).get(uid, violationId);
}

/** Khoá gửi lại (idempotency) đã gắn với bản ghi của người khác hoặc của học viên khác — không phát lại, để khỏi lộ dữ liệu ngoài phạm vi. */
export const KEY_TAKEN_MESSAGE = 'Khoá gửi lại này đã được dùng cho một bản ghi khác — tạo một lần gửi mới.';

export const EDIT_VIOLATION_MESSAGE =
  'Bạn không có quyền sửa vi phạm này — chỉ người ghi (với vi phạm của chính mình), giáo viên chủ nhiệm của lớp '
  + 'hoặc Head trong phạm vi mới sửa được.';

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
      requireManageDiscipline(p, a.student_id, 'Bạn không có quyền đính kèm hoặc gỡ bằng chứng của việc phối hợp này — chỉ giáo viên chủ nhiệm và Head.');
    },
  };
}

/** Kho tệp: quyền của biện pháp làm chủ. Xem = quyền xem học viên; thêm/gỡ = quyền xử lý Ý thức (B10: vẫn bổ sung được khi đã thực hiện). */
export function measureOwner(measureId: number) {
  const m = db().prepare('SELECT student_id, status, created_by, phu_trach_id, confirmed_by FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy lần xử lý');
  return {
    requireView: (p: Principal) => { if (!lamXuLyDuocGiao(p, m)) requireViewStudent(p, m.student_id); },
    requireEdit: (p: Principal) => {
      if (lamXuLyDuocGiao(p, m)) return;   // BAOPH-0 (rà #2233 P1-6): người được giao đính kèm bằng chứng của lần xử lý mình lập / được giao
      requireViewStudent(p, m.student_id);
      requireManageDiscipline(p, m.student_id, 'Bạn không có quyền đính kèm hoặc gỡ bằng chứng của lần xử lý này.');
    },
  };
}

/**
 * BAOPH-0 (N72 ⑥, rà #2233 P1-6): người được giao việc Ý thức (Xử lý vi phạm / Đã thực hiện) KHÔNG quản lý Ý thức của em vẫn làm trọn việc của mình — lần xử lý do
 * chính họ lập (nháp, tệp bằng chứng, Hoàn tác, xem lại) hoặc lần được giao "Đã thực hiện". Chỉ khi còn hoạt động + còn vai ở chi nhánh em (như N58).
 */
export function lamXuLyDuocGiao(p: Principal, m: { student_id: number; status?: string; created_by?: number | null; phu_trach_id?: number | null; confirmed_by?: number | null }): boolean {
  if (canManageDiscipline(p, m.student_id)) return false;
  /* Rà #2233 vòng 2 P1-B: không mở theo "người lập" mãi mãi (GVCN cũ rời lớp không còn đụng bằng chứng — SUA-NO-RA). Chỉ:
     · "Đã thực hiện" được giao (`phu_trach_id`): lúc chờ thực hiện, hoặc lần chính mình đã ghi thực hiện;
     · lần xử lý mình lập: còn NHÁP, hoặc mình đang là người được giao Xử lý vi phạm của em ở đợt này (`viec_xu_ly` mo / xong — xong = vừa lưu, Hoàn tác / xem lại). */
  const giaoDth = m.phu_trach_id === p.userId && (m.status === 'da_duyet' || (m.status === 'done' && m.confirmed_by === p.userId));
  const tao = m.created_by === p.userId && (m.status === 'nhap'
    || !!db().prepare(`SELECT 1 FROM viec_xu_ly WHERE id = ? AND phu_trach_id = ? AND trang_thai IN ('mo', 'xong')`).get(m.student_id, p.userId));
  return (giaoDth || tao) && conHieuLuc(p.userId, m.student_id);
}

/** GVCN đang hiệu lực của lớp em đang học (không có → null). */
export function gvcnCuaEm(sid: number, homNay: string): { lopId: number | null; gvcn: number | null; branchId: number | null } {
  const lopId = activeClassOf(sid);
  if (!lopId) return { lopId: null, gvcn: null, branchId: null };
  const r = db().prepare(
    `SELECT c.branch_id, (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active'
        AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) ORDER BY ta.id LIMIT 1) AS gvcn FROM classes c WHERE c.id = ?`,
  ).get(homNay, homNay, lopId) as any;
  return { lopId, gvcn: r?.gvcn ?? null, branchId: r?.branch_id ?? null };
}
