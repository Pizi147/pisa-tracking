import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { forbidden } from '../util.ts';
import { classScopeSql, scopeFor, type Principal } from '../permissions.ts';

/**
 * QUYỀN CHUNG CỦA MỌI ĐƯỜNG PHÂN TÍCH MỚI (PR-UX4, Q20) — một chỗ, để bốn dịch vụ (`vanDeHv`, `hieuQuaPa`,
 * `yThucPhanTich`) không mỗi nơi tự viết lại một phiên bản hơi khác.
 *
 * - Không có `meeting.view` (giáo viên) → 403.
 * - Quản lý hỏi một chi nhánh / một lớp NGOÀI phạm vi của mình → 403 (khác `tongHop.ts` cũ vốn trả rỗng —
 *   phép kiểm Pb đang đòi hành vi đó nên `tongHop.ts` không đổi).
 */
export function phamViPhanTich(p: Principal, branchId: number | null, classId: number | null) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Phân tích dành cho Quản lý.');
  if (branchId && !scope.all && !scope.branchIds.includes(branchId)) {
    throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
  }
  const cs = classScopeSql(scope);
  if (classId) {
    const trongPhamVi = db().prepare(`SELECT 1 FROM classes c WHERE c.id = ? AND ${cs.sql}`).get(classId, ...cs.params);
    if (!trongPhamVi) throw forbidden('Lớp này nằm ngoài phạm vi bạn được xem.');
  }
  const scopeEmpty = !scope.all && scope.branchIds.length === 0 && scope.classIds.length === 0;
  return { scope, cs, scopeEmpty };
}
