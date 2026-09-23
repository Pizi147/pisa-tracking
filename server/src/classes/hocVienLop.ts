/**
 * TRANG HỌC VIÊN & LỚP (PR-Qa, đặc tả §3.6) — một request cho cả trang: các lớp trong phạm vi đang chọn, số đếm của từng chip lọc,
 * và cờ lọc của từng học viên để web lọc tại chỗ (lọc xong lớp nào không còn em thì ẩn).
 *
 * Danh sách lớp đi qua ĐÚNG `listClassSummaries`; phần thêm ở đây: phạm vi "Lớp tôi dạy", GVCN, số Case đang mở, tuần kết thúc khoá,
 * cờ nút theo quyền, và cờ lọc của học viên (Case: cùng `listCases`; SOS: cùng `standingFor`; thiếu thông tin: cùng `missingForStudent`).
 */
import { db } from '../db.ts';
import {
  ENTRY_SKILLS, LOC_HOC_VIEN, PERMISSIONS, phamViCoThe, phamViMacDinh, type LocHocVien, type PhamVi,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { can, editableSkills, scopeFor, type Principal } from '../permissions.ts';
import { listClassSummaries, type ClassSummary } from './classes.ts';
import { classProgressMany, missingForStudent } from './schedule.ts';
import { standingFor } from '../students/standing.ts';
import { listCases } from '../cases/cases.ts';
import { allProgrammes } from '../normal/regular.ts';
import { danhSachLuuTru } from './luuTru.ts';

export type LopHocVienLop = ClassSummary & {
  gvcn: { id: number; name: string } | null;
  soCaseMo: number;
  /** Thứ Hai của tuần học cuối — lớp thường; FT null. */
  tuanKetThuc: string | null;
  viewer: { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean; coTheChuyenTiep: boolean };
};

export type TrangHocVienLop = {
  rows: LopHocVienLop[];
  scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  hocVien: { id: number; classId: number; loc: LocHocVien[] }[];
  /** Người xem có tạo được lớp MỚI ở chi nhánh nào không — không gắn với lớp đã tồn tại nào (điểm a rà soát cuối). */
  coTheTaoLop: boolean;
  /** Số ở mục ⋯ "Lưu trữ" đầu trang (PR-LT, Q16) — cùng phạm vi, cùng hàm với `/hoc-vien-lop/luu-tru` (khớp G-10 theo cấu tạo). */
  demLuuTru: { lop: number; hv: number };
};

const demRong = (): Record<LocHocVien, number> =>
  Object.fromEntries(LOC_HOC_VIEN.map((k) => [k, 0])) as Record<LocHocVien, number>;

export function danhSachHocVienLop(
  p: Principal, f: { branchId?: number | null; q?: string | null; phamVi?: string | null } = {},
): TrangHocVienLop {
  const today = demoToday();
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const phanCong = p.assignments.filter((a) => a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today));
  const coThe = phamViCoThe({
    dayLop: phanCong.length > 0, capChiNhanh: scope.branchIds.length > 0,
    toanHeThong: scope.all, soChiNhanh: scope.branchIds.length,
  });
  /* Chi nhánh người xem CÓ THỂ THẤY — dùng lại cho cả "chọn chi nhánh đang xem" (dưới) lẫn "+ Lớp mới" (điểm a rà soát cuối). */
  const duocXemChiNhanh = scope.all
    ? (conn.prepare(`SELECT id FROM branches WHERE status = 'active' ORDER BY id`).all() as any[]).map((r) => r.id as number)
    : scope.branchIds;
  /*
   * "+ LỚP MỚI" đầu trang (điểm a rà soát cuối): không gắn với lớp đã tồn tại nào, nên không thể dùng cờ
   * `viewer.coTheSuaHocVien` của một lớp cụ thể — kiểm riêng `STUDENT_EDIT` theo TỪNG chi nhánh người xem thấy được.
   * Với GVCN/GVBM (`ctx.branchId` không đủ, `teacherAllows` đòi `ctx.classId` cho STUDENT_EDIT), luôn `false`.
   */
  const coTheTaoLop = duocXemChiNhanh.some((b) => can(p, PERMISSIONS.STUDENT_EDIT, { branchId: b }));
  /* Link cũ `/hoc-vien?branchId=` (bảng chi nhánh, báo cáo tuần) không ghi phạm vi → coi là xem MỘT chi nhánh. */
  const muon = f.phamVi ?? (f.branchId && coThe.includes('chi-nhanh') ? 'chi-nhanh' : null);
  const dangDung: PhamVi = (coThe as string[]).includes(muon ?? '') ? (muon as PhamVi) : phamViMacDinh(coThe);
  let chiNhanh: number | null = null;
  if (dangDung === 'chi-nhanh') {
    chiNhanh = f.branchId && duocXemChiNhanh.includes(f.branchId) ? f.branchId : duocXemChiNhanh[0] ?? null;
  }
  const phamVi = { coThe, dangDung, chiNhanh };
  const dl = danhSachLuuTru(p, {});
  const demLuuTru = { lop: dl.lop.length, hv: dl.hocVien.length };

  const base = listClassSummaries(p, {
    branchId: chiNhanh ?? undefined,
    q: f.q ?? undefined,
    /* Phạm vi quyết luôn badge chấm bài: "Lớp tôi dạy" đếm phần mình phải chấm (Q12 — thay cặp nút Tôi / Tất cả). */
    scope: dangDung === 'toi' ? 'mine' : 'managed',
  });
  if (base.scopeEmpty) return { rows: [], scopeEmpty: true, phamVi, dem: demRong(), hocVien: [], coTheTaoLop, demLuuTru };
  const lopToi = new Set(phanCong.map((a) => a.classId));
  const lops = dangDung === 'toi' ? base.rows.filter((r) => lopToi.has(r.id)) : base.rows;
  if (!lops.length) return { rows: [], scopeEmpty: false, phamVi, dem: demRong(), hocVien: [], coTheTaoLop, demLuuTru };

  const ids = lops.map((r) => r.id);
  const ph = ids.map(() => '?').join(',');

  const gvcn = new Map<number, { id: number; name: string }>();
  for (const r of conn.prepare(
    `SELECT ta.class_id, u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
      WHERE ta.class_id IN (${ph}) AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id`,
  ).all(...ids) as any[]) if (!gvcn.has(r.class_id)) gvcn.set(r.class_id, { id: r.id, name: r.full_name });

  /*
   * Học viên đang học, không tính em đã lưu trữ — đúng cách `studentCount` của lớp đếm (Q18).
   *
   * PR-Qa (17, sửa theo rà soát planning): dựng TRƯỚC bước tính Case — `hv` đã có sẵn `class_id`
   * HIỆN TẠI của từng em, dùng lại để gom Case về đúng lớp em đang học, thay vì tự viết thêm một
   * câu SQL enrollment→class riêng (như hàm dựng riêng cũ ở `dongHocVien.ts` từng làm).
   */
  const hv = conn.prepare(
    `SELECT e.class_id, s.id, s.full_name, s.normalized_name, s.student_code, s.dob, s.status,
            cy.id AS cycle_id, cy.start_period_id, cy.exam_month, cy.target_score, cy.baseline_attempt_id, cy.baseline_score,
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned') AS so_luot_ke_hoach
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE e.class_id IN (${ph}) AND e.status = 'active' AND s.archived_at IS NULL`,
  ).all(...ids) as any[];
  const lopCuaHv = new Map<number, number>(hv.map((h) => [h.id as number, h.class_id as number]));

  /*
   * Case của cả lô, đọc MỘT LẦN CHO MỖI CHI NHÁNH thực sự xuất hiện trong `lops` — không phải một lần
   * cho TOÀN BỘ hệ thống (`listCases(p, {})` không lọc phạm vi gì từng khiến hàm dựng riêng cũ quét
   * mọi Case rồi gọi `can()` từng dòng, chậm hàng chục giây trên Turso), và không gọi lần thứ hai cho
   * cùng việc (bản cũ gọi riêng một lần cho số Case từng lớp, một lần khác cho cờ lọc từng học viên).
   * Khi đang xem MỘT chi nhánh (`chiNhanh` đã set), `lops` chỉ có đúng một branchId nên đây gọn lại
   * thành đúng MỘT lời gọi — y hệt hành vi cũ.
   */
  const chiNhanhCuaLops = [...new Set(lops.map((r) => r.branchId))];
  const allCases = chiNhanhCuaLops.flatMap((b) => listCases(p, { branchId: b }).rows);

  /* Số Case đang mở của mỗi lớp — tra lớp HIỆN TẠI của học viên qua `lopCuaHv`, chỉ tính em đang học. */
  const soCaseByClass = new Map<number, number>();
  for (const c of allCases) {
    if (c.status === 'done' || c.studentId === null) continue;
    const classId = lopCuaHv.get(c.studentId);
    if (classId === undefined) continue;
    soCaseByClass.set(classId, (soCaseByClass.get(classId) ?? 0) + 1);
  }

  const tienDo = classProgressMany(ids);

  /*
   * KỸ NĂNG SỬA ĐƯỢC của từng lớp, đọc MỘT LẦN cho cả lô — cùng khuôn `classes.ts` dùng để dựng `mySkills`/`editableByClass`
   * (mục "Lớp FT và lớp thường có bộ kỹ năng khác nhau"). `editableSkills` tự gọi `can(p, SCORE_EDIT, {classId, skill})`
   * cho từng môn, kèm đường sửa hộ `SCORE_OVERRIDE` — nên "có nhập điểm được không" ở đây khớp đúng công thức
   * `viewer.canEnterScores` của `classOverview` (Task 6), không tự chế một logic quyền song song đọc thẳng `phanCong`.
   */
  const programmes = allProgrammes();
  const skillsByClass = new Map<number, string[]>();
  for (const r of lops) {
    const prog = r.programmeCode ? programmes.get(r.programmeCode) ?? null : null;
    skillsByClass.set(r.id, prog?.skills ?? [...ENTRY_SKILLS]);
  }

  const rows: LopHocVienLop[] = lops.map((r) => {
    const pr = tienDo.get(r.id);
    return {
      ...r,
      gvcn: gvcn.get(r.id) ?? null,
      soCaseMo: soCaseByClass.get(r.id) ?? 0,
      tuanKetThuc: pr?.startWeekStart && pr.totalWeeks ? addDays(pr.startWeekStart, (pr.totalWeeks - 1) * 7) : null,
      viewer: {
        coTheSuaHocVien: can(p, PERMISSIONS.STUDENT_EDIT, { classId: r.id }),
        coTheBaoCase: can(p, PERMISSIONS.SOS_REPORT, { classId: r.id }),
        coTheGhiViPham: can(p, PERMISSIONS.VIOLATION_RECORD, { classId: r.id }),
        coTheNhapDiem: editableSkills(p, r.id, skillsByClass.get(r.id) ?? [...ENTRY_SKILLS]).length > 0,
        /* PR-LT: badge "Hết khoá" bấm được — cùng luật với classOverview.viewer.coTheChuyenTiep (Q2). */
        coTheChuyenTiep: can(p, PERMISSIONS.CLASS_EDIT, { classId: r.id }),
      },
    };
  });

  /* Tìm theo tên/mã HỌC VIÊN thì chỉ em khớp được đếm và được hiện; tìm theo MÃ LỚP thì cả lớp. */
  const q = (f.q ?? '').trim();
  const ql = q.toLowerCase();
  const maLop = new Map(lops.map((r) => [r.id, r.code.toLowerCase()]));
  const khop = (h: any) => !q
    || (maLop.get(h.class_id) ?? '').includes(ql)
    || String(h.full_name ?? '').toLowerCase().includes(ql)
    || String(h.normalized_name ?? '').includes(ql)
    || String(h.student_code ?? '').toUpperCase().includes(q.toUpperCase());
  const hvKhop = hv.filter(khop);

  const standing = standingFor(hvKhop.map((h) => h.id));
  const idSet = new Set(hvKhop.map((h) => h.id as number));
  /* Cờ lọc từng học viên (case_working/case_no_plan/case_overdue) — CÙNG nguồn `allCases` ở trên, không gọi listCases() lần nữa. */
  const caseCua = new Map<number, { working: boolean; noPlan: boolean; overdue: boolean }>();
  for (const c of allCases) {
    if (c.status === 'done' || c.studentId === null || !idSet.has(c.studentId)) continue;
    const x = caseCua.get(c.studentId) ?? { working: false, noPlan: false, overdue: false };
    if (c.state === 'working') x.working = true;
    if (c.state === 'no_plan') x.noPlan = true;
    if (c.dueOverdue) x.overdue = true;
    caseCua.set(c.studentId, x);
  }

  const laFt = new Map(lops.map((r) => [r.id, r.programmeCode === 'FT']));
  const dem = demRong();
  const hocVien = hvKhop.map((h) => {
    const loc: LocHocVien[] = ['tat-ca'];
    if ((standing.get(h.id)?.sosLevel ?? 0) > 0) loc.push('sos');
    const c = caseCua.get(h.id);
    if (c?.working) loc.push('case_working');
    if (c?.noPlan) loc.push('case_no_plan');
    if (c?.overdue) loc.push('case_overdue');
    const thieu = missingForStudent({
      cycle: h.cycle_id
        ? { start_period_id: h.start_period_id, exam_month: h.exam_month, target_score: h.target_score,
            baseline: h.baseline_attempt_id !== null || h.baseline_score !== null }
        : null,
      student: { dob: h.dob },
      isFastTrack: !!laFt.get(h.class_id),
      hasNextMilestone: h.status === 'active' ? h.so_luot_ke_hoach > 0 : undefined,
    });
    if (thieu.length) loc.push('thieu_tt');
    for (const k of loc) dem[k] += 1;
    return { id: h.id as number, classId: h.class_id as number, loc };
  });

  return { rows, scopeEmpty: false, phamVi, dem, hocVien, coTheTaoLop, demLuuTru };
}
