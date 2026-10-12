import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';

/**
 * PR-OV2a — XEM VIỆC CỦA NGƯỜI KHÁC ("Tất cả trong phạm vi", "Của GV", Nhắc). `het`: QL / Quản trị (`case.approve`, như trước). `cham-diem`:
 * Admin (sửa điểm hộ `score.override`, không duyệt PA) — chỉ nhóm Chấm điểm + Nhắc (đặc tả OV mục 2). `null`: chỉ việc của mình.
 */
export function phamViXemViec(p: Principal): 'het' | 'cham-diem' | null {
  if (can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) return 'het';
  if (can(p, PERMISSIONS.SCORE_OVERRIDE, { anyScope: true }) && can(p, PERMISSIONS.WORK_VIEW, { anyScope: true })) return 'cham-diem';
  return null;
}
