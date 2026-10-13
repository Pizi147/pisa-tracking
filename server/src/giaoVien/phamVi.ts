import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { forbidden, notFound } from '../util.ts';

/**
 * Ai xem được hồ sơ GV (PR-GV Q9). Trả phạm vi chi nhánh của SỐ LIỆU: null = mọi chi nhánh. Ném 404 / 403.
 * Tệp riêng (không nằm trong hoSo.ts) để `mywork.ts` dùng được mà không vòng import.
 * GV thuần (và CX, TVV — PR-OV2a) không có `analysis.view_teacher` (seed/data.ts) nên `scopeFor` trả `none` → chỉ xem được chính mình.
 */
export function phamViHoSoGv(p: Principal, gvId: number): { branchIds: number[] | null; laChinhMinh: boolean } {
  const conn = db();
  if (!conn.prepare(`SELECT 1 FROM users WHERE id = ? AND status = 'active'`).get(gvId)) throw notFound('Không tìm thấy giáo viên này.');
  if (p.userId === gvId) return { branchIds: null, laChinhMinh: true };
  /* PR-S5F-b: hồ sơ GV của NGƯỜI KHÁC chỉ mở cho tài khoản có vai giáo viên đang hoạt động (không mở hồ sơ QL/QT qua đường này). */
  if (!conn.prepare(
    `SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND ur.status = 'active' AND r.key = 'teacher' LIMIT 1`,
  ).get(gvId)) throw notFound('Không tìm thấy giáo viên này.');
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW_TEACHER);
  /* OV-11h (PT-11): câu theo vai — GV được xem hồ sơ của chính mình; TVV / CX / Admin không có phần GV. */
  if (scope.none) throw forbidden(p.roleKeys.includes('teacher') ? 'Bạn chỉ xem được hồ sơ giáo viên của chính mình.' : 'Hồ sơ giáo viên dành cho Quản lý.');
  if (scope.all) return { branchIds: null, laChinhMinh: false };
  if (!scope.branchIds.length) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  const ph = scope.branchIds.map(() => '?').join(',');
  const homNay = demoToday();
  const thuoc = conn.prepare(
    `SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher'
      WHERE ur.user_id = ? AND ur.status = 'active' AND ur.branch_id IN (${ph})
     UNION ALL
     SELECT 1 FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        AND c.branch_id IN (${ph})
     LIMIT 1`).get(gvId, ...scope.branchIds, gvId, homNay, homNay, ...scope.branchIds);
  if (!thuoc) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  return { branchIds: scope.branchIds, laChinhMinh: false };
}
