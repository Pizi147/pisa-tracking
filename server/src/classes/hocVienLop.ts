/**
 * TRANG HỌC VIÊN & LỚP (PR-Qa, đặc tả §3.6) — một request cho cả trang: các lớp trong phạm vi đang chọn, số đếm của từng chip lọc,
 * và cờ lọc của từng học viên để web lọc tại chỗ (lọc xong lớp nào không còn em thì ẩn).
 *
 * Danh sách lớp đi qua ĐÚNG `listClassSummaries`; phần thêm ở đây: phạm vi "Lớp tôi dạy", GVCN, số Case đang mở, tuần kết thúc khoá,
 * cờ nút theo quyền, và cờ lọc của học viên (Case: cùng `listCases`; SOS: cùng `standingFor`; thiếu thông tin: cùng `missingForStudent`).
 */
import { db } from '../db.ts';
import {
  LOC_HOC_VIEN, PERMISSIONS, phamViCoThe, phamViMacDinh, type LocHocVien, type PhamVi,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listClassSummaries, type ClassSummary } from './classes.ts';
import { classProgressMany, missingForStudent } from './schedule.ts';
import { standingFor } from '../students/standing.ts';
import { listCases } from '../cases/cases.ts';
import { soCaseMoTheoLop } from './dongHocVien.ts';

export type LopHocVienLop = ClassSummary & {
  gvcn: { id: number; name: string } | null;
  soCaseMo: number;
  /** Thứ Hai của tuần học cuối — lớp thường; FT null. */
  tuanKetThuc: string | null;
  viewer: { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean };
};

export type TrangHocVienLop = {
  rows: LopHocVienLop[];
  scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  hocVien: { id: number; classId: number; loc: LocHocVien[] }[];
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
  /* Link cũ `/hoc-vien?branchId=` (bảng chi nhánh, báo cáo tuần) không ghi phạm vi → coi là xem MỘT chi nhánh. */
  const muon = f.phamVi ?? (f.branchId && coThe.includes('chi-nhanh') ? 'chi-nhanh' : null);
  const dangDung: PhamVi = (coThe as string[]).includes(muon ?? '') ? (muon as PhamVi) : phamViMacDinh(coThe);
  let chiNhanh: number | null = null;
  if (dangDung === 'chi-nhanh') {
    const duocXem = scope.all
      ? (conn.prepare(`SELECT id FROM branches WHERE status = 'active' ORDER BY id`).all() as any[]).map((r) => r.id as number)
      : scope.branchIds;
    chiNhanh = f.branchId && duocXem.includes(f.branchId) ? f.branchId : duocXem[0] ?? null;
  }
  const phamVi = { coThe, dangDung, chiNhanh };

  const base = listClassSummaries(p, {
    branchId: chiNhanh ?? undefined,
    q: f.q ?? undefined,
    /* Phạm vi quyết luôn badge chấm bài: "Lớp tôi dạy" đếm phần mình phải chấm (Q12 — thay cặp nút Tôi / Tất cả). */
    scope: dangDung === 'toi' ? 'mine' : 'managed',
  });
  if (base.scopeEmpty) return { rows: [], scopeEmpty: true, phamVi, dem: demRong(), hocVien: [] };
  const lopToi = new Set(phanCong.map((a) => a.classId));
  const lops = dangDung === 'toi' ? base.rows.filter((r) => lopToi.has(r.id)) : base.rows;
  if (!lops.length) return { rows: [], scopeEmpty: false, phamVi, dem: demRong(), hocVien: [] };

  const ids = lops.map((r) => r.id);
  const ph = ids.map(() => '?').join(',');

  const gvcn = new Map<number, { id: number; name: string }>();
  for (const r of conn.prepare(
    `SELECT ta.class_id, u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
      WHERE ta.class_id IN (${ph}) AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id`,
  ).all(...ids) as any[]) if (!gvcn.has(r.class_id)) gvcn.set(r.class_id, { id: r.id, name: r.full_name });

  const soCase = soCaseMoTheoLop(ids);
  const tienDo = classProgressMany(ids);

  const rows: LopHocVienLop[] = lops.map((r) => {
    const pr = tienDo.get(r.id);
    return {
      ...r,
      gvcn: gvcn.get(r.id) ?? null,
      soCaseMo: soCase.get(r.id) ?? 0,
      tuanKetThuc: pr?.startWeekStart && pr.totalWeeks ? addDays(pr.startWeekStart, (pr.totalWeeks - 1) * 7) : null,
      viewer: {
        coTheSuaHocVien: can(p, PERMISSIONS.STUDENT_EDIT, { classId: r.id }),
        coTheBaoCase: can(p, PERMISSIONS.SOS_REPORT, { classId: r.id }),
        coTheGhiViPham: can(p, PERMISSIONS.VIOLATION_RECORD, { classId: r.id }),
        coTheNhapDiem: can(p, PERMISSIONS.SCORE_OVERRIDE, { classId: r.id }) || phanCong.some((a) => a.classId === r.id && !!a.skill),
      },
    };
  });

  /* Học viên đang học, không tính em đã lưu trữ — đúng cách `studentCount` của lớp đếm (Q18). */
  const hv = conn.prepare(
    `SELECT e.class_id, s.id, s.full_name, s.normalized_name, s.student_code, s.dob, s.status,
            cy.id AS cycle_id, cy.start_period_id, cy.exam_month, cy.target_score, cy.baseline_attempt_id, cy.baseline_score,
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned') AS so_luot_ke_hoach
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE e.class_id IN (${ph}) AND e.status = 'active' AND s.archived_at IS NULL`,
  ).all(...ids) as any[];

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
  const caseCua = new Map<number, { working: boolean; noPlan: boolean; overdue: boolean }>();
  for (const c of listCases(p, { branchId: chiNhanh }).rows) {
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

  return { rows, scopeEmpty: false, phamVi, dem, hocVien };
}
