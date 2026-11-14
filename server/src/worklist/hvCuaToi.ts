/**
 * TỔNG QUAN TVV / CX — ô đếm học viên bấm được (OV-10c, mockup vai 13/10 mục 6; thay khối "Học viên của tôi" của PR-OV2a).
 * Phạm vi: TVV = em có `students.consultant_user_id` = người xem ("HV của tôi"); vai khác (CX) = mọi em xem được, lọc chi nhánh nếu chọn.
 *
 * MỘT NGUỒN cho số ở Tổng quan và chip ở Học viên & Lớp (OV-10b dùng lại `chipHocVien`, không viết hàm đếm thứ hai):
 *  · `can-chu-y` — em đang học có SOS (MT gần nhất), Case mở trong 14 ngày, Ý thức trong 14 ngày, hoặc đang chờ QL chọn bước tiếp sau thi.
 *  · Tạm dừng — em Tạm dừng học. · Sắp thi — dự kiến thi từ hôm nay tới 6 tuần tới (OV-13q: ngày thi đã qua → không còn "sắp").
 *  · Đã thi · chờ kết quả (OV-13q) — cùng tập với việc GVCN / góc Cần làm TVV (`loTrinhChoKetQuaThi`). · Chờ chọn bước tiếp — cùng tập với việc QL / TVV (`choBuocTiep`).
 *  · Thiếu thông tin — chính cờ `thieu_tt` của danh sách Học viên & Lớp (`thieuThongTinHocVien`: cùng phạm vi, câu em, hàm cờ với `danhSachHocVienLop`).
 * Câu đọc không theo danh sách id (Turso ≤ 900 tham số): Case / Ý thức đọc khoảng 14 ngày rồi lọc theo tập em.
 */
import { CASE_THAT } from '../cases/sosState.ts';
import { db } from '../db.ts';
import { PERMISSIONS, VIOLATION_CATEGORY_LABEL, thangKeTiep } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { standingFor } from '../students/standing.ts';
import { thieuThongTinHocVien } from '../classes/hocVienLop.ts';
import { choBuocTiep } from '../loTrinh/buocTiep.ts';
import { loTrinhChoKetQuaThi } from '../loTrinh/thiThat.ts';
import { addDays, badRequest, forbidden } from '../util.ts';
import { tongQuanTvv } from './tongQuanV5.ts';

/** "Sắp thi" = dự kiến thi trong từng này tuần tới. "Mới" = trong 14 ngày gần nhất. */
const SAP_THI_TUAN = 6;
const MOI_NGAY = 14;

export const CHIP_HOC_VIEN = ['can-chu-y', 'tam-dung', 'sap-thi', 'thieu_tt', 'da-thi', 'cho-buoc-tiep'] as const;
export type ChipHocVien = (typeof CHIP_HOC_VIEN)[number];
export type SoHocVien = { phamVi: 'cua-toi' | 'chi-nhanh' | 'tat-ca'; tong: number; dem: Record<ChipHocVien, number> };
/** OV-10b: vì sao em vào chip `can-chu-y` — ghi NGAY trong vòng xếp chip (cột tương ứng của Học viên & Lớp TVV / CX đọc đúng lý do này). */
export type LyDoChuY = { sos?: number; caseMoi?: string[]; yThuc?: string; choBuocTiep?: true };

const laTvv = (p: Principal) => p.roleKeys.includes('consultant');

/**
 * Id học viên theo từng chip, trong phạm vi người xem (`student.view`). OV-10b: `phamVi` cho TVV xem "Cả chi nhánh" ở Học viên & Lớp (không truyền = như
 * Tổng quan: TVV "HV của tôi"); `tatCa` = mọi em trong phạm vi, `lyDo` = lý do chip `can-chu-y` của từng em.
 */
export function chipHocVien(p: Principal, f: { branchId?: number | null; phamVi?: SoHocVien['phamVi'] } = {}): {
  phamVi: SoHocVien['phamVi']; tong: number; ids: Record<ChipHocVien, number[]>; tatCa: number[]; lyDo: Map<number, LyDoChuY>;
  /** OV-13f: ô còn thiếu của em có chip `thieu_tt` (nhãn `missingForStudent`) — việc "Thiếu email" tách riêng ở Cần làm TVV. */
  thieu: Map<number, string[]>;
  /** Kết quả gần nhất của mọi em trong phạm vi (một lần `standingFor`) — cột Kết quả gần nhất của Học viên & Lớp TVV / CX dùng lại. */
  standing: ReturnType<typeof standingFor>;
} {
  const conn = db();
  const homNay = demoToday();
  const dauTuan = mondayOf(homNay);
  const tvv = f.phamVi ? f.phamVi === 'cua-toi' : laTvv(p);
  const phamVi: SoHocVien['phamVi'] = tvv ? 'cua-toi' : f.branchId ? 'chi-nhanh' : 'tat-ca';
  const dieuKien: string[] = ['s.archived_at IS NULL'];
  const thamSo: unknown[] = [];
  if (tvv) { dieuKien.push('s.consultant_user_id = ?'); thamSo.push(p.userId); }
  const rows = conn.prepare(
    `SELECT s.id, s.status, COALESCE(c.branch_id, s.branch_id) AS branch_id, cy.exam_date, cy.exam_month, cy.thi_that_ngay, rp.week_start AS tuan_thi
       FROM students s
       LEFT JOIN enrollments e ON e.student_id = s.id AND e.status IN ('active', 'paused')
       LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
      WHERE ${dieuKien.join(' AND ')}`,
  ).all(...thamSo) as any[];
  napTruocPhamVi(rows.map((r) => r.id));
  const em = new Map<number, any>();
  for (const r of rows) {
    if (em.has(r.id) || (!tvv && f.branchId && r.branch_id !== f.branchId)) continue;
    if (can(p, PERMISSIONS.STUDENT_VIEW, { studentId: r.id })) em.set(r.id, r);
  }
  const dangHoc = [...em.values()].filter((r) => r.status === 'active');
  const ids = Object.fromEntries(CHIP_HOC_VIEN.map((k) => [k, [] as number[]])) as Record<ChipHocVien, number[]>;

  ids['tam-dung'] = [...em.values()].filter((r) => r.status === 'inactive').map((r) => r.id);
  ids['cho-buoc-tiep'] = [...new Set(choBuocTiep().map((c) => c.student_id as number))].filter((id) => em.has(id));
  ids['da-thi'] = [...new Set(loTrinhChoKetQuaThi(homNay).map((x) => x.c.student_id as number))].filter((id) => em.has(id));

  const cuoiKhoang = addDays(dauTuan, SAP_THI_TUAN * 7 - 1);
  /* Khoảng thi dự kiến (ngày · tuần → Chủ nhật · tháng → ngày cuối) còn tới hôm nay; đầu khoảng (ngày / thứ Hai / mùng 1) chạm 6 tuần. Đã nhập ngày thi thật →
     không còn "sắp". LT-SV: cuối khoảng chỉ để lọc "sắp", KHÔNG phải ngày thi (`ngayThiSauThi` không bịa ngày từ tuần / tháng). */
  const sapThi = (r: any) => {
    const cuoi = r.exam_date ?? (r.tuan_thi ? addDays(r.tuan_thi, 6) : /^\d{4}-\d{2}$/.test(r.exam_month ?? '') ? addDays(`${thangKeTiep(`${r.exam_month}-01`)}-01`, -1) : null);
    const dau = r.exam_date ?? r.tuan_thi ?? (r.exam_month ? `${r.exam_month}-01` : null);
    return !r.thi_that_ngay && !!cuoi && !!dau && cuoi >= homNay && dau <= cuoiKhoang;
  };
  ids['sap-thi'] = dangHoc.filter(sapThi).map((r) => r.id);

  const tuNgay = addDays(homNay, -MOI_NGAY);
  const lyDo = new Map<number, LyDoChuY>();
  const ghi = (id: number, sua: (l: LyDoChuY) => void) => { const l = lyDo.get(id) ?? {}; sua(l); lyDo.set(id, l); };
  for (const id of ids['cho-buoc-tiep']) ghi(id, (l) => { l.choBuocTiep = true; });
  const laDangHoc = new Set(dangHoc.map((r) => r.id as number));
  const standing = standingFor([...em.keys()]);
  for (const id of laDangHoc) {
    const st = standing.get(id);
    if (st?.sosLevel && st.mode === 'ielts_band') ghi(id, (l) => { l.sos = st.sosLevel!; });
  }
  /* TURSO-1211: `created_at >= ngày` (= `substr(created_at, 1, 10) >= ngày` với chuỗi ISO) đi chỉ mục `idx_case_tao`; `ORDER BY sc.id` làm SQLite quay về SCAN
     cả bảng → xếp theo id trong JS (thứ tự nhãn `caseMoi` như cũ). */
  for (const c of (conn.prepare(
    `SELECT sc.id, COALESCE(sc.student_id, a.student_id) AS sid, sc.category FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE sc.status != 'done' AND ${CASE_THAT('sc')} AND sc.created_at >= ?`,
  ).all(tuNgay) as any[]).sort((x, y) => x.id - y.id)) {
    if (laDangHoc.has(c.sid)) ghi(c.sid, (l) => { l.caseMoi = [...new Set([...(l.caseMoi ?? []), c.category ?? 'tong_hop'])]; });
  }
  for (const v of conn.prepare('SELECT student_id AS sid, ten, category FROM violations WHERE occurred_on >= ? AND chi_nhac = 0 ORDER BY occurred_on DESC, id DESC').all(tuNgay) as any[]) {
    /* Vi phạm gần nhất làm nhãn ("Đi muộn"); không có tên ngắn thì tên nhóm. */
    if (laDangHoc.has(v.sid)) ghi(v.sid, (l) => { l.yThuc ??= v.ten || (VIOLATION_CATEGORY_LABEL as Record<string, string>)[v.category] || 'Ý thức'; });
  }
  ids['can-chu-y'] = [...lyDo.keys()];

  /* Thiếu thông tin: đúng cờ của danh sách Học viên & Lớp (cùng phạm vi trang đó mở ra) — GIAM-DOC-0611: chỉ tính cờ, không dựng cả danh sách. */
  const thieu = new Map<number, string[]>();
  if (dangHoc.length) {
    const ds = thieuThongTinHocVien(p, { phamVi, branchId: phamVi === 'chi-nhanh' ? f.branchId : null });
    ids.thieu_tt = [...new Set(ds.map((h) => h.id))];   // UX-1: em học hai lớp một lần, như chip
    for (const h of ds) if (!thieu.has(h.id)) thieu.set(h.id, h.thieu);
  }
  /* U04-3 / XM-4 (PTA 03/11): "Tất cả" = em đang học + tạm dừng — em Kết thúc học (chờ KQ thi thật) không trong danh sách nên không đếm; vẫn ở chip 'da-thi' / 'cho-buoc-tiep'. */
  const tatCa = [...em.values()].filter((r) => r.status !== 'finished').map((r) => r.id as number);
  return { phamVi, tong: tatCa.length, ids, tatCa, lyDo, standing, thieu };
}

export function soHocVien(p: Principal, f: { branchId?: number | null } = {}): SoHocVien {
  const { phamVi, tong, ids } = chipHocVien(p, f);
  return { phamVi, tong, dem: Object.fromEntries(CHIP_HOC_VIEN.map((k) => [k, ids[k].length])) as Record<ChipHocVien, number> };
}

/**
 * GD-8a (Overhaul V6, [XM-13]): trang đầu TVV MỘT GET — khung "HV của tôi" (em · lớp · tình trạng) + dải chỉ số (Báo PH đúng hạn · Thi tháng này của
 * `tongQuanTvv`); Chờ KQ thi thật / Chưa chốt LT tiếp = đếm cờ `choKq` / `choBuocTiep` của `em` (cùng hàm với chip `da-thi` / `cho-buoc-tiep`). Việc từng em
 * lấy từ `/my-work` đã nạp. Thay `/tong-quan/tvv` + `/tong-quan/hoc-vien` ở trang đầu: một câu em đi chỉ mục `idx_student_consultant` (~40 dòng),
 * không câu Case / Ý thức / Thiếu thông tin của `chipHocVien`.
 * Quyền: TVV chỉ em của chính mình (`tvv` khác mình → 403); Quản lý / Quản trị (`cycle.edit`) truyền `tvv` → em của TVV đó trong phạm vi `student.view`,
 * không kèm chỉ số. Lời 40: trường theo trạng thái — đã nhập ngày thi thật / Kết thúc học thì không còn lịch thi dự kiến; SOS chỉ em đang học.
 */
export type EmTvv = {
  id: number; ten: string; status: 'active' | 'inactive' | 'finished'; lop: { id: number; ma: string }[];
  /** Lịch thi chưa thi: ngày đã chốt, hoặc tuần / tháng dự kiến (đúng một khoá). */
  thi?: { ngay: string } | { tuan: string } | { thang: string };
  sos?: number; choKq?: true; choBuocTiep?: true;
};
export function emCuaTvv(p: Principal, f: { tvv?: number | null } = {}): { tvv: number; em: EmTvv[]; chiSo?: ReturnType<typeof tongQuanTvv> } {
  const tvv = f.tvv ?? (laTvv(p) ? p.userId : null);
  if (!tvv) throw badRequest('Thiếu TVV.');
  const minh = tvv === p.userId;
  if (!minh && !can(p, PERMISSIONS.CYCLE_EDIT, { anyScope: true })) throw forbidden('Chỉ xem được học viên của chính mình.');
  const rows = db().prepare(
    `SELECT s.id, s.full_name AS ten, s.status, c.id AS lop_id, c.code AS lop_ma, cy.exam_date, cy.exam_month, cy.thi_that_ngay, rp.week_start AS tuan_thi
       FROM students s
       LEFT JOIN enrollments e ON e.student_id = s.id AND e.status IN ('active', 'paused')
       LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
      WHERE s.consultant_user_id = ? AND s.archived_at IS NULL`,
  ).all(tvv) as any[];
  napTruocPhamVi(rows.map((r) => r.id));
  const em = new Map<number, EmTvv>();
  for (const r of rows) {
    let x = em.get(r.id);
    if (!x) {
      if (!can(p, PERMISSIONS.STUDENT_VIEW, { studentId: r.id })) continue;
      x = { id: r.id, ten: r.ten, status: r.status, lop: [] };
      /* Như chip `sap-thi`: dòng đầu của em mang lịch thi; ngày > tuần > tháng. */
      if (r.status !== 'finished' && !r.thi_that_ngay) {
        const thi = r.exam_date ? { ngay: r.exam_date } : r.tuan_thi ? { tuan: r.tuan_thi } : r.exam_month ? { thang: r.exam_month } : null;
        if (thi) x.thi = thi;
      }
      em.set(r.id, x);
    }
    if (r.lop_id && !x.lop.some((l) => l.id === r.lop_id)) x.lop.push({ id: r.lop_id, ma: r.lop_ma });
  }
  if (em.size) {
    const dangHoc = [...em.values()].filter((x) => x.status === 'active').map((x) => x.id);
    for (const [id, st] of standingFor(dangHoc)) if (st?.sosLevel && st.mode === 'ielts_band') em.get(id)!.sos = st.sosLevel;
    for (const { c } of loTrinhChoKetQuaThi(demoToday())) { const x = em.get(c.student_id); if (x) x.choKq = true; }
    for (const c of choBuocTiep()) { const x = em.get(c.student_id); if (x) x.choBuocTiep = true; }
  }
  const ds = [...em.values()].sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.id - b.id);
  return { tvv, em: ds, ...(minh && laTvv(p) ? { chiSo: tongQuanTvv(p) } : {}) };
}
