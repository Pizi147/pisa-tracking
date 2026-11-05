import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';

/**
 * PR-OV2a — XEM VIỆC CỦA NGƯỜI KHÁC ("Tất cả trong phạm vi", "Của GV", Nhắc). `het`: QL / Quản trị (`case.approve`, như trước). `cham-diem`:
 * Admin (sửa điểm hộ `score.override`, không duyệt PA) — chỉ nhóm Chấm điểm + Nhắc (đặc tả OV mục 2). `null`: chỉ việc của mình.
 * QUYEN-RIENG (chủ SP 05/11): `cham-diem` chỉ từ VAI có `score.override` (Admin) — GV được cấp RIÊNG quyền này (nhập bù ngoài phân công) vẫn là GV;
 * trước đó GV bị coi là Admin nên Công việc "Của tôi" / "Của GV" chỉ còn Chấm điểm (mất PA, Case, Ý thức…).
 */
export function phamViXemViec(p: Principal): 'het' | 'cham-diem' | null {
  if (can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) return 'het';
  if (p.grants.some((g) => g.roleKey !== 'granted' && g.permissions.has(PERMISSIONS.SCORE_OVERRIDE))
    && can(p, PERMISSIONS.WORK_VIEW, { anyScope: true })) return 'cham-diem';
  return null;
}
