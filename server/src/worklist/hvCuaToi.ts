/**
 * TỔNG QUAN TVV / CX — ô đếm học viên bấm được (OV-10c, mockup vai 13/10 mục 6; thay khối "Học viên của tôi" của PR-OV2a).
 * Phạm vi: TVV = em có `students.consultant_user_id` = người xem ("HV của tôi"); vai khác (CX) = mọi em xem được, lọc chi nhánh nếu chọn.
 *
 * MỘT NGUỒN cho số ở Tổng quan và chip ở Học viên & Lớp (OV-10b dùng lại `chipHocVien`, không viết hàm đếm thứ hai):
 *  · `can-chu-y` — em đang học có SOS (MT gần nhất), Case mở trong 14 ngày, Ý thức trong 14 ngày, hoặc đang chờ QL chọn bước tiếp sau thi.
 *  · Tạm dừng — em Tạm dừng học. · Sắp thi — dự kiến thi trong 6 tuần tới. · Chờ chọn bước tiếp — cùng tập với việc QL / TVV (`choBuocTiep`).
 *  · Thiếu thông tin — chính cờ `thieu_tt` của danh sách Học viên & Lớp (`danhSachHocVienLop`), chip đó đã có sẵn.
 * Câu đọc không theo danh sách id (Turso ≤ 900 tham số): Case / Ý thức đọc khoảng 14 ngày rồi lọc theo tập em.
 */
import { db } from '../db.ts';
import { PERMISSIONS, VIOLATION_CATEGORY_LABEL } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { standingFor } from '../students/standing.ts';
import { danhSachHocVienLop } from '../classes/hocVienLop.ts';
import { choBuocTiep } from '../loTrinh/buocTiep.ts';

/** "Sắp thi" = dự kiến thi trong từng này tuần tới. "Mới" = trong 14 ngày gần nhất. */
const SAP_THI_TUAN = 6;
const MOI_NGAY = 14;

export const CHIP_HOC_VIEN = ['can-chu-y', 'tam-dung', 'sap-thi', 'thieu_tt', 'cho-buoc-tiep'] as const;
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
    `SELECT s.id, s.status, COALESCE(c.branch_id, s.branch_id) AS branch_id, cy.exam_date, cy.exam_month, rp.week_start AS tuan_thi
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

  const cuoiKhoang = addDays(dauTuan, SAP_THI_TUAN * 7 - 1);
  /* Chỉ ghi tháng thi → sắp thi khi tháng đó chạm khoảng 6 tuần. */
  const sapThi = (r: any) => {
    if (!r.exam_date && !r.tuan_thi && r.exam_month) return `${r.exam_month}-01` <= cuoiKhoang && `${r.exam_month}-31` >= dauTuan;
    const d = r.exam_date ?? r.tuan_thi;
    return !!d && d >= dauTuan && d <= cuoiKhoang;
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
  for (const c of conn.prepare(
    `SELECT COALESCE(sc.student_id, a.student_id) AS sid, sc.category FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE sc.status != 'done' AND substr(sc.created_at, 1, 10) >= ? ORDER BY sc.id`,
  ).all(tuNgay) as any[]) {
    if (laDangHoc.has(c.sid)) ghi(c.sid, (l) => { l.caseMoi = [...new Set([...(l.caseMoi ?? []), c.category ?? 'tong_hop'])]; });
  }
  for (const v of conn.prepare('SELECT student_id AS sid, ten, category FROM violations WHERE occurred_on >= ? ORDER BY occurred_on DESC, id DESC').all(tuNgay) as any[]) {
    /* Vi phạm gần nhất làm nhãn ("Đi muộn"); không có tên ngắn thì tên nhóm. */
    if (laDangHoc.has(v.sid)) ghi(v.sid, (l) => { l.yThuc ??= v.ten || (VIOLATION_CATEGORY_LABEL as Record<string, string>)[v.category] || 'Ý thức'; });
  }
  ids['can-chu-y'] = [...lyDo.keys()];

  /* Thiếu thông tin: đúng cờ của danh sách Học viên & Lớp (cùng phạm vi trang đó mở ra). */
  if (dangHoc.length) {
    const ds = danhSachHocVienLop(p, { phamVi, branchId: phamVi === 'chi-nhanh' ? f.branchId : null });
    ids.thieu_tt = ds.hocVien.filter((h) => h.loc.includes('thieu_tt')).map((h) => h.id);
  }
  return { phamVi, tong: em.size, ids, tatCa: [...em.keys()], lyDo, standing };
}

export function soHocVien(p: Principal, f: { branchId?: number | null } = {}): SoHocVien {
  const { phamVi, tong, ids } = chipHocVien(p, f);
  return { phamVi, tong, dem: Object.fromEntries(CHIP_HOC_VIEN.map((k) => [k, ids[k].length])) as Record<ChipHocVien, number> };
}
