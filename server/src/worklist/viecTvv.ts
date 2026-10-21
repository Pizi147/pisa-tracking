/**
 * SV-TVV-VIEC (luật 21/10-TVV, Q-A3, Q-D3 ①, Q-D4 ①) — bốn việc của TVV, MỘT người giữ = TVV của em (`students.consultant_user_id`);
 * em chưa có TVV → QL chi nhánh của em (`cycle.edit` trong phạm vi em). Người giữ suy khi đọc — đổi TVV thì việc theo người mới, hạn giữ.
 *   · Chốt ngày thi (không hạn) · Bổ sung hồ sơ thiếu (không hạn, một dòng tổng) — ở đây;
 *   · Chọn bước tiếp sau thi (`viecBuocTiep`) · Cập nhật KQ thi thật (`viecThiThat`, không hạn) — dùng `chuViecTvv` của tệp này.
 */
import { db, theoLo } from '../db.ts';
import { PERMISSIONS, nhanLichThi, soSanhLop, trangThaiLichThi } from '../../../shared/domain/index.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { missingForStudent } from '../classes/schedule.ts';
import type { WorkItem } from './mywork.ts';

/**
 * Người giữ việc TVV của một em đối với người xem: chính TVV của em → của tôi; em chưa có TVV và người xem là QL của em → của tôi;
 * em có TVV khác: QL xem "Của GV" (`tatCa`) thấy việc của TVV đó, còn lại không thấy. GV / GVCN không bao giờ giữ.
 */
export function chuViecTvv(p: Principal, studentId: number, tvv: number | null, tatCa = false): { ownerId: number; mine: boolean } | null {
  if (tvv === p.userId) return { ownerId: p.userId, mine: true };
  if (!can(p, PERMISSIONS.CYCLE_EDIT, { studentId })) return null;
  if (!tvv) return { ownerId: p.userId, mine: true };
  return tatCa ? { ownerId: tvv, mine: false } : null;
}

/** TVV của nhiều em — một câu mỗi lô (Turso ≤ 900 tham số). */
export function tvvCuaEm(ids: readonly number[]): Map<number, number | null> {
  const out = new Map<number, number | null>();
  theoLo([...new Set(ids)], (lo, ph) => {
    for (const r of db().prepare(`SELECT id, consultant_user_id FROM students WHERE id IN (${ph})`).all(...lo) as any[]) out.set(r.id, r.consultant_user_id ?? null);
  });
  return out;
}

/** Người xem có thể giữ việc TVV nào không — TVV giữ em của mình; QL / Quản trị giữ em chưa có TVV. Không thì khỏi đọc. */
const laQl = (p: Principal) => can(p, PERMISSIONS.CYCLE_EDIT, { anyScope: true });
/** GV / GVCN không giữ việc TVV nào — khỏi tốn câu. */
export const coTheGiuViecTvv = (p: Principal) => p.roleKeys.includes('consultant') || laQl(p);

/**
 * Em FT đang học đã tới tháng (tuần) dự kiến thi mà CHƯA có ngày (`trangThaiLichThi` = chưa chốt ngày) → "Chốt ngày thi", KHÔNG hạn (LT-SV Q-C3 ①).
 * Hết việc khi có ngày / dời tháng / có kết quả / "Không thi" / em Tạm dừng, Lưu trữ. Một câu.
 */
export function viecChotNgayThi(p: Principal, o: { today: string; tatCa: boolean; branchId: number | null }): WorkItem[] {
  if (!coTheGiuViecTvv(p)) return [];
  const ql = laQl(p);
  const ds = db().prepare(
    `SELECT s.id, s.full_name, s.consultant_user_id AS tvv, e.class_id, c.code AS class_code, c.branch_id, cy.id AS cycle_id,
            cy.exam_month, cy.exam_date, cy.thi_that_ngay, cy.exam_period_id, rp.week_start AS exam_week_start, rp.code AS exam_week_code
       FROM learning_cycles cy
       JOIN students s ON s.id = cy.student_id AND ${HV_DANG_HOC_SQL('s')}
       JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
       JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
       LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
      WHERE cy.status = 'active' AND cy.route IS NOT NULL AND cy.exam_date IS NULL AND cy.thi_that_ngay IS NULL
        AND (cy.exam_month IS NOT NULL OR cy.exam_period_id IS NOT NULL)
        AND COALESCE(cy.thi_that_khong_thi, 0) = 0 AND cy.outcome_score IS NULL AND COALESCE(cy.outcome, 'unknown') = 'unknown'
        AND (s.consultant_user_id = ? OR ? = 1) AND (? IS NULL OR c.branch_id = ?)`,
  ).all(p.userId, ql ? 1 : 0, o.branchId, o.branchId) as any[];
  napTruocPhamVi(ds.map((r) => r.id));
  const out: WorkItem[] = [];
  const da = new Set<number>();
  for (const r of ds.sort((x, y) => soSanhLop({ code: x.class_code }, { code: y.class_code }) || String(x.full_name).localeCompare(String(y.full_name), 'vi'))) {
    if (da.has(r.cycle_id)) continue;   // em học hai lớp: một việc
    const lich = trangThaiLichThi(r, examPlanOf(r), o.today);
    if (lich.trangThai !== 'chua-chot-ngay') continue;
    const chu = chuViecTvv(p, r.id, r.tvv, o.tatCa);
    if (!chu) continue;
    da.add(r.cycle_id);
    out.push({
      key: `chot-ngay-thi:${r.cycle_id}`, group: 'missing_data', urgency: 'normal',
      studentId: r.id, studentName: r.full_name, classId: r.class_id, classCode: r.class_code,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: nhanLichThi(lich, o.today), count: null,
      reason: 'Đã tới tháng thi mà chưa có ngày thi',
      tieuDe: 'Chốt ngày thi', phu: 'Chốt ngày thi', actionLabel: 'Chốt ngày', href: `/hoc-vien?view=lich-thi&thang=${lich.thang}`,
      ownerId: chu.ownerId, owner: null, mine: chu.mine, due: null, statusLabel: 'Không tính hạn',
    });
  }
  return out;
}

/**
 * "Bổ sung hồ sơ thiếu" — MỘT dòng tổng mỗi người giữ (Q-D4 ①): em đang học thiếu một trong 4 trường (`missingForStudent`: Ngày sinh · Email ·
 * Tuần bắt đầu · Target FT). Không hạn. Mở danh sách Học viên chip "Thiếu thông tin". Một câu.
 */
export function viecBoSungHoSo(p: Principal, o: { tatCa: boolean; branchId: number | null }): WorkItem[] {
  if (!coTheGiuViecTvv(p)) return [];
  const ql = laQl(p);
  const ds = db().prepare(
    `SELECT s.id, s.dob, s.email, s.consultant_user_id AS tvv, c.branch_id, c.is_fast_track, cy.id AS cycle_id, cy.start_period_id, cy.target_score
       FROM students s
       JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id AND x.status = 'active')
       JOIN classes c ON c.id = e.class_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE ${HV_DANG_HOC_SQL('s')} AND (s.consultant_user_id = ? OR ? = 1) AND (? IS NULL OR c.branch_id = ?)`,
  ).all(p.userId, ql ? 1 : 0, o.branchId, o.branchId) as any[];
  napTruocPhamVi(ds.map((r) => r.id));
  const theoNguoi = new Map<number, { mine: boolean; em: Set<number>; truong: Map<string, number> }>();
  for (const r of ds) {
    const thieu = missingForStudent({
      cycle: r.cycle_id ? { start_period_id: r.start_period_id, target_score: r.target_score } : null,
      student: { dob: r.dob, email: r.email }, isFastTrack: !!r.is_fast_track,
    });
    if (!thieu.length) continue;
    const chu = chuViecTvv(p, r.id, r.tvv, o.tatCa);
    if (!chu) continue;
    const g = theoNguoi.get(chu.ownerId) ?? { mine: chu.mine, em: new Set<number>(), truong: new Map<string, number>() };
    if (g.em.has(r.id)) continue;
    g.em.add(r.id);
    for (const m of thieu) g.truong.set(m.label, (g.truong.get(m.label) ?? 0) + 1);
    theoNguoi.set(chu.ownerId, g);
  }
  return [...theoNguoi].map(([ownerId, g]) => ({
    key: `bo-sung-ho-so:${ownerId}`, group: 'bo_sung_ho_so', urgency: 'normal',
    studentId: null, studentName: 'Hồ sơ học viên', classId: null, classCode: null,
    attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: null, count: g.em.size, emIds: [...g.em],
    reason: [...g.truong].map(([ten, n]) => `${ten} ${n}`).join(' · '),
    tieuDe: `Bổ sung hồ sơ thiếu · ${g.em.size} em`, actionLabel: 'Bổ sung',
    href: g.mine && !ql ? '/hoc-vien?phamVi=cua-toi&view=thieu_tt' : '/hoc-vien?view=thieu_tt',
    ownerId, owner: null, mine: g.mine, due: null, statusLabel: 'Không tính hạn',
  }));
}
