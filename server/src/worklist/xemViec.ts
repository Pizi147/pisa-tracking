import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, coVaiCx, type Principal } from '../permissions.ts';
import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';

/**
 * PR-OV2a — XEM VIỆC CỦA NGƯỜI KHÁC ("Tất cả trong phạm vi", "Của GV", Nhắc). `het`: QL / Quản trị (`case.approve`, như trước). `cham-diem`:
 * Admin (sửa điểm hộ `score.override`, không duyệt PA) — chỉ nhóm Chấm điểm + Nhắc (đặc tả OV mục 2). `null`: chỉ việc của mình.
 * QUYEN-RIENG (chủ SP 05/11): `cham-diem` chỉ từ VAI có `score.override` (Admin) — GV được cấp RIÊNG quyền này (nhập bù ngoài phân công) vẫn là GV;
 * trước đó GV bị coi là Admin nên Công việc "Của tôi" / "Của GV" chỉ còn Chấm điểm (mất PA, Case, Ý thức…).
 */
export function phamViXemViec(p: Principal): 'het' | 'cham-diem' | null {
  if (can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) return 'het';
  if (coVaiCx(p) && can(p, PERMISSIONS.WORK_VIEW, { anyScope: true })) return 'het';   // N52: CX xem mọi việc trong phạm vi (không là chủ việc nào)
  if (p.grants.some((g) => g.roleKey !== 'granted' && g.permissions.has(PERMISSIONS.SCORE_OVERRIDE))
    && can(p, PERMISSIONS.WORK_VIEW, { anyScope: true })) return 'cham-diem';
  return null;
}

/**
 * N52: "Tất cả" của CX = đúng danh sách Quản lý thấy trong phạm vi grant CX — grant CX mang quyền của vai Quản lý (đọc DB một câu, nhớ theo request) CHỈ để
 * dựng danh sách xem; mọi dòng không là việc của CX, làm thay tính bằng quyền thật (`lamThayCua` với người xem thật, máy chủ kiểm lại khi lưu).
 */
export function nhinNhuQl(p: Principal): Principal {
  const quyen = nho('n52:quyen-ql', () => new Set((db().prepare(
    `SELECT p.key AS k FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.key = 'manager'`,
  ).all() as any[]).map((r) => r.k as string)));
  return { ...p, roleKeys: [...new Set(p.roleKeys.map((k) => (k === 'cx' ? 'manager' : k)))],
    grants: p.grants.map((g) => (g.roleKey === 'cx' ? { ...g, roleKey: 'manager', permissions: quyen } : g)) };
}
