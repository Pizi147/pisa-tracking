import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { forbidden, notFound } from '../util.ts';

/**
 * Ai xem được hồ sơ GV (PR-GV Q9). Trả phạm vi chi nhánh của SỐ LIỆU: null = mọi chi nhánh. Ném 404 / 403.
 * Tệp riêng (không nằm trong hoSo.ts) để `mywork.ts` dùng được mà không vòng import.
 * GV thuần không có `meeting.view` (seed/data.ts) nên `scopeFor` trả `none` → chỉ xem được chính mình.
 */
export function phamViHoSoGv(p: Principal, gvId: number): { branchIds: number[] | null; laChinhMinh: boolean } {
  const conn = db();
  if (!conn.prepare(`SELECT 1 FROM users WHERE id = ? AND status = 'active'`).get(gvId)) throw notFound('Không tìm thấy giáo viên này.');
  if (p.userId === gvId) return { branchIds: null, laChinhMinh: true };
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Bạn chỉ xem được hồ sơ giáo viên của chính mình.');
  if (scope.all) return { branchIds: null, laChinhMinh: false };
  if (!scope.branchIds.length) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  const ph = scope.branchIds.map(() => '?').join(',');
  const homNay = demoToday();
  const thuoc = conn.prepare(
    `SELECT 1 FROM user_roles WHERE user_id = ? AND status = 'active' AND branch_id IN (${ph})
     UNION ALL
     SELECT 1 FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        AND c.branch_id IN (${ph})
     LIMIT 1`).get(gvId, ...scope.branchIds, gvId, homNay, homNay, ...scope.branchIds);
  if (!thuoc) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  return { branchIds: scope.branchIds, laChinhMinh: false };
}
