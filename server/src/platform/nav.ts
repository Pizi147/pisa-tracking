/**
 * CỜ ĐIỀU HƯỚNG THEO QUYỀN (O6, spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.1).
 *
 * Chỉ đọc quyền đã cấu hình — không cấp thêm quyền nào. Khu vực/tab nào cờ false thì giao diện bỏ hẳn; API vẫn tự chặn.
 * Một hàm thuần để phép kiểm gọi thẳng được (server/src/tests/khung.tests.ts).
 */
import { PERMISSIONS, laVaiQuanLy, type NavQuyen } from '../../../shared/domain/index.ts';
import { activeAt, can, classScopeSql, lopFtChoGvSpeaking, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { db } from '../db.ts';
import { canSeeBoard } from '../worklist/mgmttasks.ts';
import { coPhamViXuat, phamViXuatMt } from '../phanTich/xuatMt.ts';
import { phamViXemViec } from '../worklist/xemViec.ts';

export function navOf(p: Principal): NavQuyen {
  const coPhamVi = (perm: string) => !scopeFor(p, perm).none;
  /* OV-14c: GV Speaking không phân công lớp nào (GV nước ngoài) vẫn có Test + Công việc — phạm vi chấm là lớp FT chấm chéo (`scopeXemLuotCham`). */
  const gvS = (perm: string) => lopFtChoGvSpeaking(p).length > 0 && can(p, perm, { anyScope: true });
  const attempt = coPhamVi(PERMISSIONS.ATTEMPT_VIEW) || gvS(PERMISSIONS.ATTEMPT_VIEW);
  const meeting = coPhamVi(PERMISSIONS.MEETING_VIEW);
  const plan = coPhamVi(PERMISSIONS.PLAN_WEEK);
  const board = canSeeBoard(p);
  /* PR-OV2a: Test và Công việc có quyền vào riêng — TVV, CX xem điểm / Case trong hồ sơ (`attempt.view`) mà không có hai khu này. */
  const test = attempt && (coPhamVi(PERMISSIONS.TEST_VIEW) || gvS(PERMISSIONS.TEST_VIEW));
  const viec = coPhamVi(PERMISSIONS.WORK_VIEW) || gvS(PERMISSIONS.WORK_VIEW);
  const support = viec && attempt;
  const chamDiem = phamViXemViec(p) === 'cham-diem';
  const analysis = coPhamVi(PERMISSIONS.ANALYSIS_VIEW);
  const hvCuaToi = p.roleKeys.includes('consultant') && !laVaiQuanLy(p.roleKeys);
  const tutor = coPhamVi(PERMISSIONS.TUTOR_VIEW);
  /* UI-CV-TVV (03 mục 3 "CẦN QUYỀN" 1, C05): TVV có Công việc — CHỈ việc của chính mình (`/my-work` lọc `NHOM_VIEC_TVV`), không Chấm điểm / Case / duyệt. */
  const viecTvv = !viec && p.roleKeys.includes('consultant');
  return {
    /* NEN-V5 (08 K10, 01 mục 2): mọi vai có Tổng quan (GV: trang đầu = Tổng quan, dữ liệu chỉ phạm vi của mình). AN-TUTOR: Head tutor cũng vậy. */
    overview: true,
    students: coPhamVi(PERMISSIONS.STUDENT_VIEW),
    admin: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    analysis,
    phanTichGv: coPhamVi(PERMISSIONS.ANALYSIS_VIEW_TEACHER),
    /* OV-11f (TQ-8): QL / Quản trị kiêm TVV ở vai gốc giữ Tổng quan QL; Học viên của tôi chỉ khi Góc nhìn = TVV (vai QL bị lọc khỏi `roleKeys`). */
    hvCuaToi,
    test, testGrade: test, testSchedule: test, testPlan: test && plan,
    /* Chủ SP 28/10: GV xem Kế hoạch Test lớp mình dạy (chỉ xem). */
    testPlanXem: test && (plan || p.assignments.some((a) => activeAt(a, demoToday())) || lopFtChoGvSpeaking(p).length > 0),
    work: (viec && (attempt || board || meeting)) || viecTvv,
    workSupport: support || viecTvv, workOps: viec && board, workReports: viec && meeting,
    /* Admin (chỉ nhóm Chấm điểm, `phamViXemViec`) không có Yêu cầu của tôi — không gửi yêu cầu nào. */
    workApprove: viec && can(p, PERMISSIONS.REQUEST_APPROVE, { anyScope: true }), workRequests: support && !chamDiem,
    workChamDiem: support && chamDiem,
    xuatMt: coPhamViXuat(phamViXuatMt(p)),
    tutor,
    tutorSua: tutor && can(p, PERMISSIONS.TUTOR_MANAGE, { anyScope: true }),
  };
}

/**
 * UX-2 (5, chủ SP 16/10): khung có lớp ĐANG MỞ trong phạm vi người xem (quyền xem học viên) — công tắc Fast Track / Lớp thường hiện theo đây,
 * không theo dữ liệu trang đang xem (khung rỗng ghi "· 0"). Một câu mỗi lần tải phiên.
 */
export function khungPhamVi(p: Principal): { ft: boolean; thuong: boolean } {
  const sc = scopeFor(p, PERMISSIONS.STUDENT_VIEW);
  if (sc.none) return { ft: false, thuong: false };
  const cs = classScopeSql(sc);
  const ms = (db().prepare(`SELECT DISTINCT COALESCE(pg.scoring_mode, '') AS m FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code
     WHERE ${cs.sql} AND c.status = 'active'`).all(...cs.params) as any[]).map((r) => r.m as string);
  return { ft: ms.some((m) => m !== 'ratio'), thuong: ms.includes('ratio') };
}
