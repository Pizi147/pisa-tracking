/**
 * SV-TVV-VIEC (luật 21/10-TVV, Q-A3, Q-D3 ①, Q-D4 ①) — bốn việc của TVV, MỘT người giữ = TVV của em (`students.consultant_user_id`);
 * em chưa có TVV → QL chi nhánh của em (`cycle.edit` trong phạm vi em). Người giữ suy khi đọc — đổi TVV thì việc theo người mới, hạn giữ.
 *   · Chốt ngày thi (không hạn) · Bổ sung hồ sơ thiếu (không hạn, một dòng tổng) — `viecHoSoTvv`, một câu cho cả hai;
 *   · Chọn bước tiếp sau thi (`viecBuocTiep`) · Cập nhật KQ thi thật (`viecThiThat`, không hạn) — dùng `chuViecTvv` của tệp này.
 */
import { db, theoLo } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { PERMISSIONS, nhanLichThi, soSanhLop, trangThaiLichThi } from '../../../shared/domain/index.ts';
import { can, laTvvCuaEm, laVaiThat, scopeFor, type Principal } from '../permissions.ts';
import { headCua } from './nguoiNhan.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { missingForStudent } from '../classes/schedule.ts';
import type { WorkItem } from './mywork.ts';
import { chuKhung, giaoChoNguoi } from './khungViec.ts';

/**
 * AUDIT-2111 (rà #1960): TVV của em CÒN vai TVV phủ chi nhánh em? Vai TVV đang hiệu lực của MỌI người — MỘT câu mỗi request (bảng vai nhỏ),
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
  /* VAI-0 (N76b): em chưa có TVV, chi nhánh em có Lead TVV → Lead TVV giữ (Head không). */
  const lead = laLeadTvv(p) || laQlNhanh(p) ? leadTvvCua(branchId !== undefined ? branchId : chiNhanh()) : null;
  if (lead === p.userId && !tvvHieuLuc(p, tvvGoc === p.userId ? null : tvvGoc, studentId, branchId, chiNhanh)) return { ownerId: p.userId, mine: true };
  if (!can(p, PERMISSIONS.CYCLE_EDIT, { studentId })) return null;
  const tvv = tvvGoc === p.userId ? null : tvvHieuLuc(p, tvvGoc, studentId, branchId, chiNhanh);
  if (!tvv && lead) return tatCa ? { ownerId: lead, mine: false } : null;
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
  const coLead = laLeadTvv(p) || !pv.none;
  return (branchId, tvvGoc, tatCa = false, studentId) => {
    /* chi nhánh em đã biết (null + có id em → lùi về `grantCovers` theo em); TVV hết hiệu lực → như chưa có TVV. */
    const hieuLuc = () => tvvHieuLuc(p, tvvGoc, studentId ?? 0, branchId === null && studentId ? undefined : branchId, () => branchId);
    if (tvvGoc === p.userId && hieuLuc() !== null) return { ownerId: p.userId, mine: true };
    /* VAI-0 (N76b): em chưa có TVV (hoặc TVV hết hiệu lực), chi nhánh em có Lead TVV → Lead TVV giữ; Head chỉ thấy ở "Tất cả". */
    const lead = coLead ? leadTvvCua(branchId) : null;
    if (lead === p.userId && (tvvGoc === p.userId || !hieuLuc())) return { ownerId: p.userId, mine: true };
    if (!ql(branchId)) return null;
    const tvv = tvvGoc === p.userId ? null : hieuLuc();
    if (!tvv && lead) return tatCa ? { ownerId: lead, mine: false } : null;
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
  /* VAI-0 (N74, rà PTA 26/11): MỘT người giữ — Head gán chi nhánh sớm nhất → Head toàn hệ thống → Quản trị (`headCua`, ổn định: Head mới vào không làm việc nhảy).
     GĐCN (roleKey Head, vai thật khác) không giữ; góc nhìn không phải Head / Quản trị không giữ. Người giữ vai đọc một câu mỗi request. */
  const co = p.grants.some((g) => laVaiThat(g, 'manager') || g.roleKey === 'system_admin');
  return (cn) => {
    if (!co) return false;
    const b = typeof cn === 'function' ? cn() : cn;
    return headCua(b) === p.userId;
  };
}
/** Chi nhánh của một em (lớp đang học, không có → hồ sơ) — chỉ `chuViecTvv` một em (hồ sơ HV) khi em chưa có TVV. */
/* rà #1960 vòng 2: nhớ theo request — hồ sơ HV gọi `chuViecTvv` hai lần (Sau thi, Bổ sung hồ sơ) cho cùng em → một câu. */
const chiNhanhCuaEm = (studentId: number): number | null => nho(`cn-em:${studentId}`, () => (db().prepare(
  `SELECT COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), s.branch_id) AS b
     FROM students s WHERE s.id = ?`).get(studentId) as any)?.b ?? null);

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
const laQlNhanh = (p: Principal) => p.grants.some((g) => g.permissions.has(PERMISSIONS.CYCLE_EDIT));
/** GV / GVCN không giữ việc TVV nào — khỏi tốn câu. VAI-0: + Lead TVV (giữ việc em chưa có TVV ở chi nhánh mình — N76b). */
/** VAI-1 XM-2: việc TVV không ở TVV của em — em chưa từng có TVV (`chua_co`) hay TVV đã hết vai / nghỉ (`da_nghi`). */
export const khongTvvCua = (tvvGoc: number | null | undefined): 'chua_co' | 'da_nghi' => (tvvGoc ? 'da_nghi' : 'chua_co');
/** VAI-1 XM-2: việc TVV (khung) có người giữ THEO LUẬT không phải TVV của em (Lead TVV / Head) → lý do trên dòng; việc đã giao tay thì không. 0 câu. */
export const khongTvvDong = (chu: { ownerId: number | null; giaoBoi?: string | null }, tvvGoc: number | null | undefined): 'chua_co' | 'da_nghi' | null =>
  (!chu.giaoBoi && chu.ownerId !== null && (!tvvGoc || chu.ownerId !== tvvGoc) ? khongTvvCua(tvvGoc) : null);
export const coTheGiuViecTvv = (p: Principal) => p.roleKeys.includes('consultant') || laLeadTvv(p) || laQl(p);

/**
 * VAI-0 (N76b, chủ SP 26/11): em chưa có TVV → việc TVV về Lead TVV gán ĐÚNG chi nhánh em (người được gán sớm nhất — tính lúc đọc, ổn định; em có TVV thì việc tự về
 * TVV đó), không có → Head như cũ. Lead TVV toàn hệ thống không giữ (lead chỉ theo dõi). MỘT câu mỗi request.
 */
const leadTvvTheoCn = (): Map<number, number> => nho('vai0:lead-tvv-cn', () => {
  const m = new Map<number, number>();
  for (const r of db().prepare(`SELECT ur.branch_id AS b, ur.user_id AS u FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'lead_consultant' AND ur.branch_id IS NOT NULL AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL ORDER BY ur.created_at, ur.id`).all() as any[]) {
    if (!m.has(r.b)) m.set(r.b, r.u);
  }
  return m;
});
export const leadTvvCua = (cn: number | null | undefined): number | null => (cn ? leadTvvTheoCn().get(cn) ?? null : null);
/** Người xem có grant Lead TVV gán chi nhánh (vai thật). */
export const laLeadTvv = (p: Principal): boolean => p.grants.some((g) => laVaiThat(g, 'lead_consultant') && g.branchId !== null);
/** Chi nhánh mà người xem là Lead TVV giữ việc (N76b) — 0 câu khi không phải Lead TVV. */
export const cnLeadTvvCuaToi = (p: Principal): number[] =>
  laLeadTvv(p) ? [...new Set(p.grants.filter((g) => laVaiThat(g, 'lead_consultant') && g.branchId !== null).map((g) => g.branchId as number))].filter((b) => leadTvvCua(b) === p.userId) : [];

/** Cột hồ sơ em đang học cho hai việc TVV (Chốt ngày thi · Bổ sung hồ sơ) — CÙNG câu cho Công việc (cả tập) và khung việc một em (`khungDoc`). */
export const SQL_HO_SO_TVV = `SELECT s.id, s.full_name, s.dob, s.email, s.status, s.archived_at, s.consultant_user_id AS tvv, e.class_id, c.code AS class_code, COALESCE(c.branch_id, s.branch_id) AS branch_id, c.is_fast_track,
            cy.id AS cycle_id, cy.route, cy.start_period_id, cy.target_score, cy.exam_month, cy.exam_date, cy.thi_that_ngay, cy.exam_period_id,
            cy.thi_that_khong_thi, cy.outcome_score, cy.outcome, rp.week_start AS exam_week_start, rp.code AS exam_week_code
       FROM students s
       /* rà #517: ghi danh mở ở lớp ĐANG HOẠT ĐỘNG — cùng tập với danh sách Học viên & Lớp (lopTrongPhamVi), số trên việc = số dòng */
       JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x JOIN classes cx ON cx.id = x.class_id WHERE x.student_id = s.id AND x.status = 'active' AND cx.status = 'active')
       JOIN classes c ON c.id = e.class_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id`;
/** "Chốt ngày thi" còn là việc của dòng `SQL_HO_SO_TVV` — lịch thi khi còn, null khi không (một nguồn: Công việc + khung). */
export function lichChotNgayThi(r: any, today: string): ReturnType<typeof trangThaiLichThi> | null {
  if (r.archived_at || !(r.status === 'active' && r.is_fast_track && r.cycle_id && r.route && !r.exam_date && !r.thi_that_ngay && (r.exam_month || r.exam_period_id)
      && !r.thi_that_khong_thi && r.outcome_score === null && (r.outcome ?? 'unknown') === 'unknown')) return null;
  const lich = trangThaiLichThi(r, examPlanOf(r), today);
  return lich.trangThai === 'chua-chot-ngay' ? lich : null;
}
/** Trường hồ sơ còn thiếu của dòng `SQL_HO_SO_TVV` (Ngày sinh · Email · Tuần bắt đầu · Target FT) — rỗng = không còn việc "Bổ sung hồ sơ thiếu". */
export const thieuHoSoEm = (r: any) => (r.archived_at ? [] : missingForStudent({
  cycle: r.cycle_id ? { start_period_id: r.start_period_id, target_score: r.target_score } : null,
  student: { dob: r.dob, email: r.email }, isFastTrack: !!r.is_fast_track,
}));

/**
 * Hai việc không hạn từ hồ sơ em đang học — MỘT câu cho cả hai (TD4-b):
 *  · "Chốt ngày thi": em FT đã tới tháng (tuần) dự kiến thi mà CHƯA có ngày (`trangThaiLichThi` = chưa chốt ngày — LT-SV Q-C3 ①). Hết việc khi có ngày /
 *    dời tháng / có kết quả / "Không thi" / em Tạm dừng, Lưu trữ.
 *  · "Bổ sung hồ sơ thiếu" (Q-D4 ①): MỘT dòng tổng mỗi người giữ — em thiếu một trong 4 trường (`missingForStudent`: Ngày sinh · Email · Tuần bắt đầu ·
 *    Target FT). Tập em = tập chip "Thiếu thông tin" (`danhSachHocVienLop`: em có lớp đang học) — số trên việc = số dòng danh sách khi mở link.
 */
export function viecHoSoTvv(p: Principal, o: { today: string; tatCa: boolean; branchId: number | null; chot: boolean; boSung: boolean; /** TD-VIEC: chỉ em đang học lớp này */ lop?: number | null }): WorkItem[] {
  if (!o.chot && !o.boSung) return [];
  /* LPB-1 (N73 ⑤): em có việc khung giao cho tôi (Chốt ngày thi · Bổ sung hồ sơ) vào tập dù tôi không phải người mặc định — người giữ xét ở `chuKhung`. */
  const emToi = giaoChoNguoi(p.userId, 'chot_ngay_thi', 'bo_sung_ho_so').map((g) => g.sid).filter((x): x is number => !!x);
  if (!coTheGiuViecTvv(p) && !emToi.length) return [];
  const ql = laQl(p);
  const giu = nguoiGiuTvv(p, o.today);
  /* S3: điều kiện dựng theo nhánh — `(x = ? OR ? = 1)` làm SQLite quét cả bảng students; TVV đi chỉ mục idx_student_consultant. */
  const dk = ['s.archived_at IS NULL'];
  const thamSo: unknown[] = [];
  /* LPB-1: lọc chi nhánh / lớp (không phải điều kiện người giữ) — tách để em được giao cho tôi vẫn qua điều kiện người giữ. */
  const dkLoc: string[] = [];
  const thamSoLoc: unknown[] = [];
  if (viecTvvCuKhiKiem.bat) { dk.push('(s.consultant_user_id = ? OR ? = 1)', '(? IS NULL OR COALESCE(c.branch_id, s.branch_id) = ?)'); thamSo.push(p.userId, ql ? 1 : 0, o.branchId, o.branchId); }
  else {
    const cnLead = cnLeadTvvCuaToi(p);
    if (!ql && cnLead.length) {
      /* VAI-0 (N76b): Lead TVV — em mình là TVV + em ở chi nhánh mình giữ (lọc chưa có TVV ở `giu`). */
      dk.push(`(s.consultant_user_id = ? OR COALESCE(c.branch_id, s.branch_id) IN (${cnLead.map(() => '?').join(',')}))`); thamSo.push(p.userId, ...cnLead);
    } else if (!ql) { dk.push('s.consultant_user_id = ?'); thamSo.push(p.userId); }
    else {
      /*
       * DOC-IT-6: QL không toàn hệ thống — `giu` chỉ giữ em mình là TVV hoặc thuộc chi nhánh mình quản lý (`nguoiGiuTvv`, CYCLE_EDIT). Trước SCAN cả `students`
       * cả hệ thống; nay tập cha trong SQL: em có ghi danh active ở lớp active của các chi nhánh đó (chi nhánh dòng = chi nhánh lớp, `classes.branch_id` NOT NULL) ∪ em mình là TVV.
       */
      const pv = scopeFor(p, PERMISSIONS.CYCLE_EDIT, o.today);
      if (!pv.all) {
        const goc = [...new Set([...pv.branchIds, ...cnLeadTvvCuaToi(p)])];   // VAI-0 (N76b): + chi nhánh tôi là Lead TVV giữ việc
        const cn = o.branchId != null ? goc.filter((b) => b === o.branchId) : goc;
        dk.push(`(s.consultant_user_id = ? OR s.id IN (SELECT x.student_id FROM classes cx JOIN enrollments x ON x.class_id = cx.id AND x.status = 'active'
                   WHERE cx.status = 'active' AND cx.branch_id IN (${cn.map(() => '?').join(',')})))`);
        thamSo.push(p.userId, ...cn);
      }
    }
    if (o.branchId != null) { dkLoc.push('COALESCE(c.branch_id, s.branch_id) = ?'); thamSoLoc.push(o.branchId); }
    if (o.lop) { dkLoc.push('e.class_id = ?'); thamSoLoc.push(o.lop); }
    /* AUDIT-1611 PR 5: QL "Của tôi" — `giu` chỉ nhận em mình là TVV hoặc em CHƯA có TVV (`nguoiGiuTvv`, không `tatCa`) → lọc ngay trong SQL, không đọc
       mọi em của các chi nhánh (QL 5 chi nhánh: ~820 dòng / lần). Kết quả không đổi. */
    /* AUDIT-2111 (rà #1960): + em có TVV HẾT hiệu lực ở chi nhánh em (như chưa có TVV → Head giữ) — so với vai TVV còn hiệu lực đã đọc (`tvvConVai`, 1 câu nhỏ / request). */
    if ((ql || cnLead.length) && !o.tatCa) {   // VAI-0: Lead TVV — chỉ em mình là TVV / chưa có TVV / TVV hết hiệu lực
      const vai = JSON.stringify([...vaiTvvConHieuLuc()]);
      dk.push(`(s.consultant_user_id = ? OR s.consultant_user_id IS NULL OR s.consultant_user_id = 0
        OR ((s.consultant_user_id || ':' || COALESCE(c.branch_id, s.branch_id)) NOT IN (SELECT value FROM json_each(?)) AND (s.consultant_user_id || ':0') NOT IN (SELECT value FROM json_each(?))))`);
      thamSo.push(p.userId, vai, vai);
    }
  }
  const dkGiu = dk.slice(1);
  const dkChung = [dk[0], ...dkLoc];
  const dieuKien = [...dkChung, ...(dkGiu.length ? [emToi.length ? `((${dkGiu.join(' AND ')}) OR s.id IN (SELECT value FROM json_each(?)))` : dkGiu.join(' AND ')] : [])];
  const ds = db().prepare(`${SQL_HO_SO_TVV} WHERE ${dieuKien.join(' AND ')}`,   /* em Tạm dừng: vẫn Bổ sung hồ sơ (như chip), không Chốt ngày thi */
  ).all(...thamSoLoc, ...thamSo, ...(dkGiu.length && emToi.length ? [JSON.stringify(emToi)] : [])) as any[];
  const out: WorkItem[] = [];
  /* [XM7] #2070 (Việc để sau 25/11): giữ từng em (lớp · tên · thiếu gì) để dòng gộp mở ra "lớp · em · Thiếu: …" — cùng câu đọc, 0 câu thêm. */
  const theoNguoi = new Map<number | null, { mine: boolean; em: Set<number>; truong: Map<string, number>; con: { r: any; thieu: string[] }[]; han: string | null; giaoBoi: string | null; kt: Set<string | null> }>();
  const daChot = new Set<number>();
  for (const r of ds.sort((x, y) => soSanhLop({ code: x.class_code }, { code: y.class_code }) || String(x.full_name).localeCompare(String(y.full_name), 'vi'))) {
    const goc = giu(r.branch_id ?? null, r.tvv ?? null, o.tatCa);
    const lich = o.chot && !daChot.has(r.cycle_id) ? lichChotNgayThi(r, o.today) : null;
    const chuChot = lich ? chuKhung(p, o.tatCa, 'chot_ngay_thi', r.cycle_id, goc) : null;
    if (lich && chuChot) {
      const chu = chuChot;
      {
        daChot.add(r.cycle_id);
        out.push({
          key: `chot-ngay-thi:${r.cycle_id}`, group: 'missing_data', urgency: 'normal',
          studentId: r.id, studentName: r.full_name, classId: r.class_id, classCode: r.class_code,
          attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: nhanLichThi(lich, o.today), count: null,
          reason: 'Đã tới tháng thi mà chưa có ngày thi',
          tieuDe: 'Chốt ngày thi', phu: 'Chốt ngày thi', actionLabel: 'Chốt ngày', href: `/hoc-vien?view=lich-thi&thang=${lich.thang}`,
          ownerId: chu.ownerId, owner: null, mine: chu.mine, due: chu.han ?? null, statusLabel: chu.han ? `hạn ${chu.han.slice(8, 10)}/${chu.han.slice(5, 7)}` : 'Không tính hạn',
          ...(chu.giaoBoi ? { giaoBoi: chu.giaoBoi } : {}), khungViec: { loai: 'chot_ngay_thi', id: r.cycle_id },
          /* VAI-1 XM-2: người giữ theo luật không phải TVV của em (Lead TVV / Head) → lý do trên dòng. */
          ...(khongTvvDong(chu, r.tvv) ? { khongTvv: khongTvvDong(chu, r.tvv)! } : {}),
          ...(chu.han ? { urgency: chu.han < o.today ? 'overdue' : chu.han === o.today ? 'today' : 'normal' } : {}),
        });
      }
    }
    if (!o.boSung) continue;
    const thieu = thieuHoSoEm(r);
    if (!thieu.length) continue;
    /* LPB-1: em đã giao (Bổ sung hồ sơ) rời nhóm của người mặc định, vào nhóm người được giao. */
    const chu = chuKhung(p, o.tatCa, 'bo_sung_ho_so', r.id, goc);
    if (!chu) continue;
    const g = theoNguoi.get(chu.ownerId) ?? { mine: chu.mine, em: new Set<number>(), truong: new Map<string, number>(), con: [], han: null, giaoBoi: null, kt: new Set<string | null>() };
    if (g.em.has(r.id)) continue;
    if (chu.han && (!g.han || chu.han < g.han)) g.han = chu.han;   // LPB-1: hạn đặt tay của em sớm nhất = hạn của dòng gộp
    g.giaoBoi ??= chu.giaoBoi ?? null;
    g.em.add(r.id);
    g.kt.add(khongTvvDong(chu, r.tvv));   // VAI-1 XM-2: dòng gộp mang lý do khi MỌI em cùng một lý do
    g.con.push({ r, thieu: thieu.map((m) => m.label) });
    for (const m of thieu) g.truong.set(m.label, (g.truong.get(m.label) ?? 0) + 1);
    theoNguoi.set(chu.ownerId, g);
  }
  for (const [ownerId, g] of theoNguoi) {
    const khoa = `bo-sung-ho-so:${ownerId ?? 'ql'}`;
    /* Rà #517: link mở đúng tập đếm — TVV: em của mình; QL: em CHƯA có TVV (`tvv=chua` của `/hoc-vien-lop`). Cùng tập với chip "Thiếu thông tin" (em có lớp đang học). */
    const href = ownerId === p.userId && !ql ? '/hoc-vien?phamVi=cua-toi&view=thieu_tt' : g.mine ? '/hoc-vien?view=thieu_tt&tvv=chua' : '/hoc-vien?view=thieu_tt';
    out.push({
      key: khoa, group: 'bo_sung_ho_so', urgency: 'normal',
      studentId: null, studentName: 'Hồ sơ học viên', classId: null, classCode: null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: null, count: g.em.size, emIds: [...g.em],
      reason: [...g.truong].map(([ten, n]) => `${ten} ${n}`).join(' · '),
      tieuDe: `Bổ sung hồ sơ thiếu · ${g.em.size} em`, actionLabel: 'Bổ sung',
      href, ownerId, owner: null, mine: g.mine, due: g.han, statusLabel: g.han ? `hạn ${g.han.slice(8, 10)}/${g.han.slice(5, 7)}` : 'Không tính hạn',
      ...(g.han ? { urgency: g.han < o.today ? 'overdue' : g.han === o.today ? 'today' : 'normal' } : {}), ...(g.giaoBoi ? { giaoBoi: g.giaoBoi } : {}),
      /* Từng em: lớp · tên · thiếu gì — dòng một em ghi thẳng lớp · tên; panel ghi tên + lớp từng em. Chỉ hiển thị: việc vẫn MỘT dòng mỗi người giữ
         (không `con` — `con` là việc thật, các đường đếm / gán việc theo em đọc nó). */
      ...(g.kt.size === 1 && [...g.kt][0] ? { khongTvv: [...g.kt][0] as 'chua_co' | 'da_nghi' } : {}),
      emBoSung: g.con.map(({ r, thieu }) => ({ id: r.id, ten: r.full_name, lop: r.class_code ?? null, thieu: thieu.join(' · ') })),
    });
  }
  return out;
}
