/**
 * SV-TVV-VIEC (luật 21/10-TVV, Q-A3, Q-D3 ①, Q-D4 ①) — bốn việc của TVV, MỘT người giữ = TVV của em (`students.consultant_user_id`);
 * em chưa có TVV → QL chi nhánh của em (`cycle.edit` trong phạm vi em). Người giữ suy khi đọc — đổi TVV thì việc theo người mới, hạn giữ.
 *   · Chốt ngày thi (không hạn) · Bổ sung hồ sơ thiếu (không hạn, một dòng tổng) — `viecHoSoTvv`, một câu cho cả hai;
 *   · Chọn bước tiếp sau thi (`viecBuocTiep`) · Cập nhật KQ thi thật (`viecThiThat`, không hạn) — dùng `chuViecTvv` của tệp này.
 */
import { db, theoLo } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { PERMISSIONS, nhanLichThi, soSanhLop, trangThaiLichThi } from '../../../shared/domain/index.ts';
import { can, laTvvCuaEm, scopeFor, type Principal } from '../permissions.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { missingForStudent } from '../classes/schedule.ts';
import type { WorkItem } from './mywork.ts';

/**
 * AUDIT-2111 (rà #1960): TVV của em CÒN vai TVV phủ chi nhánh em? Vai TVV đang hiệu lực của MỌI người — MỘT câu mỗi request (bảng vai nhỏ, như `chiNhanhCoQl`),
 * chỉ đọc khi có em mà TVV không phải người xem. TVV hết hiệu lực = "chưa có TVV" → Head chi nhánh giữ việc (không mồ côi).
 */
const vaiTvvConHieuLuc = (): Set<string> => nho('tvv-con-vai', () => new Set((db().prepare(
  `SELECT DISTINCT ur.user_id AS u, COALESCE(ur.branch_id, 0) AS b FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
    WHERE r.key = 'consultant' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL`).all() as any[]).map((r) => `${r.u}:${r.b}`)));
/** `branch` null (không tìm ra chi nhánh em): còn vai TVV ở đâu đó là đủ — không làm TVV mất việc vì thiếu dữ liệu. */
export const tvvConVai = (tvv: number, branch: number | null): boolean => {
  const s = vaiTvvConHieuLuc();
  return s.has(`${tvv}:0`) || (branch !== null ? s.has(`${tvv}:${branch}`) : [...s].some((k) => k.startsWith(`${tvv}:`)));
};
/** TVV có hiệu lực của em đối với người xem: chính người xem → grant đã nạp (`laTvvCuaEm`, 0 câu); người khác → `tvvConVai`; hết hiệu lực → null. */
export const tvvHieuLuc = (p: Principal, tvv: number | null, studentId: number, branch: number | null | undefined, chiNhanh: () => number | null): number | null => {
  if (!tvv) return null;
  if (tvv !== p.userId) return tvvConVai(tvv, branch !== undefined ? branch : chiNhanh()) ? tvv : null;
  /* chi nhánh em null → lùi về `grantCovers` theo em (rà #1960 mục 2); danh sách không có id em → còn vai TVV là đủ. */
  if (branch == null && !studentId) return p.grants.some((g) => g.roleKey === 'consultant') ? tvv : null;
  return laTvvCuaEm(p, { consultant_user_id: tvv, student_id: studentId, em_branch: branch ?? undefined }) ? tvv : null;
};

/**
 * Người giữ việc TVV của một em đối với người xem: chính TVV của em → của tôi; em chưa có TVV và người xem là QL của em → của tôi;
 * em có TVV khác: QL xem "Của GV" (`tatCa`) thấy việc của TVV đó, còn lại không thấy. GV / GVCN không bao giờ giữ.
 * AUDIT-2111 (sau #1948 + rà #1960): TVV chỉ giữ việc khi vai TVV còn phủ chi nhánh em — hết hiệu lực thì như em chưa có TVV (Head giữ).
 * Vai của TVV KHÁC chỉ đọc khi người xem giữ thay được (QL) — TVV / GV: 0 câu.
 */
export function chuViecTvv(p: Principal, studentId: number, tvvGoc: number | null, tatCa = false, branchId?: number | null): { ownerId: number | null; mine: boolean } | null {
  const chiNhanh = () => chiNhanhCuaEm(studentId);
  if (tvvGoc === p.userId && tvvHieuLuc(p, tvvGoc, studentId, branchId, chiNhanh) !== null) return { ownerId: p.userId, mine: true };
  if (!can(p, PERMISSIONS.CYCLE_EDIT, { studentId })) return null;
  const tvv = tvvGoc === p.userId ? null : tvvHieuLuc(p, tvvGoc, studentId, branchId, chiNhanh);
  if (!tvv) return giuViecQl(p)(branchId !== undefined ? branchId : () => chiNhanhCuaEm(studentId)) ? { ownerId: p.userId, mine: true } : tatCa ? { ownerId: null, mine: false } : null;
  return tatCa ? { ownerId: tvv, mine: false } : null;
}

/**
 * Như `chuViecTvv` cho DANH SÁCH, không thêm câu SQL (TD4-b): phạm vi QL theo chi nhánh của em, tính một lần từ quyền đã nạp (`scopeFor`).
 * Em không có chi nhánh (chưa lớp, chưa hồ sơ chi nhánh) thì chỉ QL toàn hệ thống giữ.
 */
export function nguoiGiuTvv(p: Principal, today: string): (branchId: number | null, tvv: number | null, tatCa?: boolean, studentId?: number) => { ownerId: number | null; mine: boolean } | null {
  const pv = scopeFor(p, PERMISSIONS.CYCLE_EDIT, today);
  const ql = (b: number | null) => pv.all || (b !== null && pv.branchIds.includes(b));
  const giu = giuViecQl(p);
  return (branchId, tvvGoc, tatCa = false, studentId) => {
    /* chi nhánh em đã biết (null + có id em → lùi về `grantCovers` theo em); TVV hết hiệu lực → như chưa có TVV. */
    const hieuLuc = () => tvvHieuLuc(p, tvvGoc, studentId ?? 0, branchId === null && studentId ? undefined : branchId, () => branchId);
    if (tvvGoc === p.userId && hieuLuc() !== null) return { ownerId: p.userId, mine: true };
    if (!ql(branchId)) return null;
    const tvv = tvvGoc === p.userId ? null : hieuLuc();
    if (!tvv) return giu(branchId) ? { ownerId: p.userId, mine: true } : tatCa ? { ownerId: null, mine: false } : null;
    return tatCa ? { ownerId: tvv, mine: false } : null;
  };
}

/**
 * DEM-VIEC (chủ SP 18/11 "thấy ghi có việc quá hạn nhưng vào xem không thấy gì"): việc của QL CHI NHÁNH (em chưa có TVV, Chốt lộ trình, Kỳ vọng, Xét lại,
 * Xếp lịch MT, Phân công người phụ trách…) là việc của người có vai QL ở chi nhánh đó (hoặc QL toàn hệ thống). Quản trị chỉ GIỮ việc đó khi chi nhánh
 * không có QL nào — có QL thì Quản trị chỉ làm thay ("Tất cả"), không vào "Của tôi", badge, ô Tổng quan. Góc nhìn đang chọn quyết vai (`apGocNhin` lọc grant).
 */
export function giuViecQl(p: Principal): (branchId: number | null | (() => number | null)) => boolean {
  const ql = p.grants.filter((g) => g.roleKey === 'manager').map((g) => g.branchId);
  const qt = p.grants.some((g) => g.roleKey === 'system_admin');
  return (cn) => {
    if (ql.includes(null)) return true;
    if (!ql.length && !qt) return false;
    const b = typeof cn === 'function' ? cn() : cn;   // chi nhánh đọc lười — QL toàn hệ thống / người không giữ: 0 câu
    return (b !== null && ql.includes(b)) || (qt && (b === null || !chiNhanhCoQl().has(b)));
  };
}
/** Chi nhánh có ít nhất một QL còn hoạt động (QL toàn hệ thống → mọi chi nhánh, khoá 0). Một câu mỗi request, chỉ khi người xem là Quản trị. */
const chiNhanhCoQl = (): { has(b: number): boolean } => nho('chi-nhanh-co-ql', () => {
  const ds = new Set((db().prepare(`SELECT DISTINCT COALESCE(ur.branch_id, 0) AS b FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'manager' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL`).all() as any[]).map((r) => r.b as number));
  return { has: (b: number) => ds.has(0) || ds.has(b) };
});
/** Chi nhánh của một em (lớp đang học, không có → hồ sơ) — chỉ `chuViecTvv` một em (hồ sơ HV) khi em chưa có TVV. */
const chiNhanhCuaEm = (studentId: number): number | null => (db().prepare(
  `SELECT COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), s.branch_id) AS b
     FROM students s WHERE s.id = ?`).get(studentId) as any)?.b ?? null;

/** TVV của nhiều em — một câu mỗi lô (Turso ≤ 900 tham số). */
export function tvvCuaEm(ids: readonly number[]): Map<number, number | null> {
  const out = new Map<number, number | null>();
  theoLo([...new Set(ids)], (lo, ph) => {
    for (const r of db().prepare(`SELECT id, consultant_user_id FROM students WHERE id IN (${ph})`).all(...lo) as any[]) out.set(r.id, r.consultant_user_id ?? null);
  });
  return out;
}

/** S3: chỉ phép kiểm bật — chạy câu cũ (điều kiện OR) để so với câu mới. */
export const viecTvvCuKhiKiem = { bat: false };

const laQl = (p: Principal) => can(p, PERMISSIONS.CYCLE_EDIT, { anyScope: true });
/** GV / GVCN không giữ việc TVV nào — khỏi tốn câu. */
export const coTheGiuViecTvv = (p: Principal) => p.roleKeys.includes('consultant') || laQl(p);

/**
 * Hai việc không hạn từ hồ sơ em đang học — MỘT câu cho cả hai (TD4-b):
 *  · "Chốt ngày thi": em FT đã tới tháng (tuần) dự kiến thi mà CHƯA có ngày (`trangThaiLichThi` = chưa chốt ngày — LT-SV Q-C3 ①). Hết việc khi có ngày /
 *    dời tháng / có kết quả / "Không thi" / em Tạm dừng, Lưu trữ.
 *  · "Bổ sung hồ sơ thiếu" (Q-D4 ①): MỘT dòng tổng mỗi người giữ — em thiếu một trong 4 trường (`missingForStudent`: Ngày sinh · Email · Tuần bắt đầu ·
 *    Target FT). Tập em = tập chip "Thiếu thông tin" (`danhSachHocVienLop`: em có lớp đang học) — số trên việc = số dòng danh sách khi mở link.
 */
export function viecHoSoTvv(p: Principal, o: { today: string; tatCa: boolean; branchId: number | null; chot: boolean; boSung: boolean; /** TD-VIEC: chỉ em đang học lớp này */ lop?: number | null }): WorkItem[] {
  if ((!o.chot && !o.boSung) || !coTheGiuViecTvv(p)) return [];
  const ql = laQl(p);
  const giu = nguoiGiuTvv(p, o.today);
  /* S3: điều kiện dựng theo nhánh — `(x = ? OR ? = 1)` làm SQLite quét cả bảng students; TVV đi chỉ mục idx_student_consultant. */
  const dk = ['s.archived_at IS NULL'];
  const thamSo: unknown[] = [];
  if (viecTvvCuKhiKiem.bat) { dk.push('(s.consultant_user_id = ? OR ? = 1)', '(? IS NULL OR COALESCE(c.branch_id, s.branch_id) = ?)'); thamSo.push(p.userId, ql ? 1 : 0, o.branchId, o.branchId); }
  else {
    if (!ql) { dk.push('s.consultant_user_id = ?'); thamSo.push(p.userId); }
    else {
      /*
       * DOC-IT-6: QL không toàn hệ thống — `giu` chỉ giữ em mình là TVV hoặc thuộc chi nhánh mình quản lý (`nguoiGiuTvv`, CYCLE_EDIT). Trước SCAN cả `students`
       * cả hệ thống; nay tập cha trong SQL: em có ghi danh active ở lớp active của các chi nhánh đó (chi nhánh dòng = chi nhánh lớp, `classes.branch_id` NOT NULL) ∪ em mình là TVV.
       */
      const pv = scopeFor(p, PERMISSIONS.CYCLE_EDIT, o.today);
      if (!pv.all) {
        const cn = o.branchId != null ? pv.branchIds.filter((b) => b === o.branchId) : pv.branchIds;
        dk.push(`(s.consultant_user_id = ? OR s.id IN (SELECT x.student_id FROM classes cx JOIN enrollments x ON x.class_id = cx.id AND x.status = 'active'
                   WHERE cx.status = 'active' AND cx.branch_id IN (${cn.map(() => '?').join(',')})))`);
        thamSo.push(p.userId, ...cn);
      }
    }
    if (o.branchId != null) { dk.push('COALESCE(c.branch_id, s.branch_id) = ?'); thamSo.push(o.branchId); }
    if (o.lop) { dk.push('e.class_id = ?'); thamSo.push(o.lop); }
    /* AUDIT-1611 PR 5: QL "Của tôi" — `giu` chỉ nhận em mình là TVV hoặc em CHƯA có TVV (`nguoiGiuTvv`, không `tatCa`) → lọc ngay trong SQL, không đọc
       mọi em của các chi nhánh (QL 5 chi nhánh: ~820 dòng / lần). Kết quả không đổi. */
    /* AUDIT-2111 (rà #1960): + em có TVV HẾT hiệu lực ở chi nhánh em (như chưa có TVV → Head giữ) — so với vai TVV còn hiệu lực đã đọc (`tvvConVai`, 1 câu nhỏ / request). */
    if (ql && !o.tatCa) {
      const vai = JSON.stringify([...vaiTvvConHieuLuc()]);
      dk.push(`(s.consultant_user_id = ? OR s.consultant_user_id IS NULL OR s.consultant_user_id = 0
        OR ((s.consultant_user_id || ':' || COALESCE(c.branch_id, s.branch_id)) NOT IN (SELECT value FROM json_each(?)) AND (s.consultant_user_id || ':0') NOT IN (SELECT value FROM json_each(?))))`);
      thamSo.push(p.userId, vai, vai);
    }
  }
  const ds = db().prepare(
    `SELECT s.id, s.full_name, s.dob, s.email, s.status, s.consultant_user_id AS tvv, e.class_id, c.code AS class_code, COALESCE(c.branch_id, s.branch_id) AS branch_id, c.is_fast_track,
            cy.id AS cycle_id, cy.route, cy.start_period_id, cy.target_score, cy.exam_month, cy.exam_date, cy.thi_that_ngay, cy.exam_period_id,
            cy.thi_that_khong_thi, cy.outcome_score, cy.outcome, rp.week_start AS exam_week_start, rp.code AS exam_week_code
       FROM students s
       /* rà #517: ghi danh mở ở lớp ĐANG HOẠT ĐỘNG — cùng tập với danh sách Học viên & Lớp (lopTrongPhamVi), số trên việc = số dòng */
       JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x JOIN classes cx ON cx.id = x.class_id WHERE x.student_id = s.id AND x.status = 'active' AND cx.status = 'active')
       JOIN classes c ON c.id = e.class_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
      WHERE ${dk.join(' AND ')}`,   /* em Tạm dừng: vẫn Bổ sung hồ sơ (như chip), không Chốt ngày thi */
  ).all(...thamSo) as any[];
  const out: WorkItem[] = [];
  const theoNguoi = new Map<number | null, { mine: boolean; em: Set<number>; truong: Map<string, number> }>();
  const daChot = new Set<number>();
  for (const r of ds.sort((x, y) => soSanhLop({ code: x.class_code }, { code: y.class_code }) || String(x.full_name).localeCompare(String(y.full_name), 'vi'))) {
    const chu = giu(r.branch_id ?? null, r.tvv ?? null, o.tatCa);
    if (!chu) continue;
    if (o.chot && r.status === 'active' && r.is_fast_track && r.cycle_id && r.route && !daChot.has(r.cycle_id) && !r.exam_date && !r.thi_that_ngay && (r.exam_month || r.exam_period_id)
        && !r.thi_that_khong_thi && r.outcome_score === null && (r.outcome ?? 'unknown') === 'unknown') {
      const lich = trangThaiLichThi(r, examPlanOf(r), o.today);
      if (lich.trangThai === 'chua-chot-ngay') {
        daChot.add(r.cycle_id);
        out.push({
          key: `chot-ngay-thi:${r.cycle_id}`, group: 'missing_data', urgency: 'normal',
          studentId: r.id, studentName: r.full_name, classId: r.class_id, classCode: r.class_code,
          attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: nhanLichThi(lich, o.today), count: null,
          reason: 'Đã tới tháng thi mà chưa có ngày thi',
          tieuDe: 'Chốt ngày thi', phu: 'Chốt ngày thi', actionLabel: 'Chốt ngày', href: `/hoc-vien?view=lich-thi&thang=${lich.thang}`,
          ownerId: chu.ownerId, owner: null, mine: chu.mine, due: null, statusLabel: 'Không tính hạn',
        });
      }
    }
    if (!o.boSung) continue;
    const thieu = missingForStudent({
      cycle: r.cycle_id ? { start_period_id: r.start_period_id, target_score: r.target_score } : null,
      student: { dob: r.dob, email: r.email }, isFastTrack: !!r.is_fast_track,
    });
    if (!thieu.length) continue;
    const g = theoNguoi.get(chu.ownerId) ?? { mine: chu.mine, em: new Set<number>(), truong: new Map<string, number>() };
    if (g.em.has(r.id)) continue;
    g.em.add(r.id);
    for (const m of thieu) g.truong.set(m.label, (g.truong.get(m.label) ?? 0) + 1);
    theoNguoi.set(chu.ownerId, g);
  }
  for (const [ownerId, g] of theoNguoi) {
    out.push({
      key: `bo-sung-ho-so:${ownerId ?? 'ql'}`, group: 'bo_sung_ho_so', urgency: 'normal',
      studentId: null, studentName: 'Hồ sơ học viên', classId: null, classCode: null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: null, count: g.em.size, emIds: [...g.em],
      reason: [...g.truong].map(([ten, n]) => `${ten} ${n}`).join(' · '),
      tieuDe: `Bổ sung hồ sơ thiếu · ${g.em.size} em`, actionLabel: 'Bổ sung',
      /* Rà #517: link mở đúng tập đếm — TVV: em của mình; QL: em CHƯA có TVV (`tvv=chua` của `/hoc-vien-lop`). Cùng tập với chip "Thiếu thông tin" (em có lớp đang học). */
      href: ownerId === p.userId && !ql ? '/hoc-vien?phamVi=cua-toi&view=thieu_tt' : g.mine ? '/hoc-vien?view=thieu_tt&tvv=chua' : '/hoc-vien?view=thieu_tt',
      ownerId, owner: null, mine: g.mine, due: null, statusLabel: 'Không tính hạn',
    });
  }
  return out;
}
