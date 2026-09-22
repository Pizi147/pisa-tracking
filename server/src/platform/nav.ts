/**
 * CỜ ĐIỀU HƯỚNG THEO QUYỀN (O6, spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.1).
 *
 * Chỉ đọc quyền đã cấu hình — không cấp thêm quyền nào. Khu vực/tab nào cờ false thì giao diện bỏ hẳn; API vẫn tự chặn.
 * Một hàm thuần để phép kiểm gọi thẳng được (server/src/tests/khung.tests.ts).
 */
import { PERMISSIONS, type NavQuyen } from '../../../shared/domain/index.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { canSeeBoard } from '../worklist/mgmttasks.ts';

export function navOf(p: Principal): NavQuyen {
  const coPhamVi = (perm: string) => !scopeFor(p, perm).none;
  const attempt = coPhamVi(PERMISSIONS.ATTEMPT_VIEW);
  const meeting = coPhamVi(PERMISSIONS.MEETING_VIEW);
  const plan = coPhamVi(PERMISSIONS.PLAN_WEEK);
  const board = canSeeBoard(p);
  return {
    overview: true,
    students: coPhamVi(PERMISSIONS.STUDENT_VIEW),
    admin: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    analysis: meeting,
    test: attempt, testGrade: attempt, testSchedule: attempt, testPlan: plan,
    work: attempt || board || meeting,
    workSupport: attempt, workOps: board, workReports: meeting,
    mocks: attempt, meeting, academic: meeting, mgmtTasks: board,
  };
}
