/**
 * CỜ ĐIỀU HƯỚNG THEO QUYỀN (O6, spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.1).
 *
 * Chỉ đọc quyền đã cấu hình — không cấp thêm quyền nào. Khu vực/tab nào cờ false thì giao diện bỏ hẳn; API vẫn tự chặn.
 * Một hàm thuần để phép kiểm gọi thẳng được (server/src/tests/khung.tests.ts).
 */
import { PERMISSIONS, type NavQuyen } from '../../../shared/domain/index.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { canSeeBoard } from '../worklist/mgmttasks.ts';
import { coPhamViXuat, phamViXuatMt } from '../phanTich/xuatMt.ts';
import { phamViXemViec } from '../worklist/xemViec.ts';

export function navOf(p: Principal): NavQuyen {
  const coPhamVi = (perm: string) => !scopeFor(p, perm).none;
  const attempt = coPhamVi(PERMISSIONS.ATTEMPT_VIEW);
  const meeting = coPhamVi(PERMISSIONS.MEETING_VIEW);
  const plan = coPhamVi(PERMISSIONS.PLAN_WEEK);
  const board = canSeeBoard(p);
  /* PR-OV2a: Test và Công việc có quyền vào riêng — TVV, CX xem điểm / Case trong hồ sơ (`attempt.view`) mà không có hai khu này. */
  const test = attempt && coPhamVi(PERMISSIONS.TEST_VIEW);
  const viec = coPhamVi(PERMISSIONS.WORK_VIEW);
  const support = viec && attempt;
  return {
    overview: true,
    students: coPhamVi(PERMISSIONS.STUDENT_VIEW),
    admin: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    analysis: coPhamVi(PERMISSIONS.ANALYSIS_VIEW),
    phanTichGv: coPhamVi(PERMISSIONS.ANALYSIS_VIEW_TEACHER),
    hvCuaToi: p.roleKeys.includes('consultant'),
    test, testGrade: test, testSchedule: test, testPlan: test && plan,
    work: viec && (attempt || board || meeting),
    workSupport: support, workOps: viec && board, workReports: viec && meeting,
    /* Admin (chỉ nhóm Chấm điểm, `phamViXemViec`) không có Yêu cầu của tôi — không gửi yêu cầu nào. */
    workApprove: viec && can(p, PERMISSIONS.REQUEST_APPROVE, { anyScope: true }), workRequests: support && phamViXemViec(p) !== 'cham-diem',
    xuatMt: coPhamViXuat(phamViXuatMt(p)),
  };
}
