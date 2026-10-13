/**
 * HỌC VIÊN & LỚP CỦA TVV / CX (OV-10b, mockup vai 13/10 mục 1 + 5) — một request cho cả trang: mỗi em một dòng theo việc của vai (trạng thái chữ,
 * lớp, Target · Dự kiến thi, kết quả gần nhất, lý do chip `can-chu-y`, phụ huynh, TVV, chi nhánh), web nhóm theo lớp và lọc chip tại chỗ.
 * Tập em và chip = `chipHocVien` (OV-10c, cùng số ô Tổng quan) — không hàm đếm thứ hai; em Tạm dừng / Kết thúc học (chưa lưu trữ) vẫn có dòng.
 * QL / Quản trị / GV / Admin dùng bảng cũ (`danhSachHocVienLop`) — đường này 403.
 */
import { db, theoLo } from '../db.ts';
import { PERMISSIONS, vaiXemHocVien, type ExamPlan, type LienHe } from '../../../shared/domain/index.ts';
import { forbidden } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { chipHocVien, type ChipHocVien, type LyDoChuY, type SoHocVien } from '../worklist/hvCuaToi.ts';
import type { Standing } from '../students/standing.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { classProgressMany } from './schedule.ts';

export type DongHocVienVai = {
  id: number; ten: string; ma: string; status: string;
  /** Ngày bắt đầu Tạm dừng (em đang Tạm dừng). */
  tamDungTu: string | null;
  /** Lớp đang học / đang giữ chỗ (Tạm dừng); em đã kết thúc học → lớp cuối, `daRoi`. null = chưa xếp lớp. */
  lop: { id: number; code: string; ft: boolean; tuan: number | null; tongTuan: number | null; daRoi: boolean } | null;
  chiNhanh: string | null; tvv: string | null;
  target: number | null; kck: boolean; duKienThi: ExamPlan;
  standing: Standing | null;
  chuY: LyDoChuY | null;
  lienHe: LienHe;
  viewer: { suaThongTin: boolean; suaThem: boolean };
};
export type TrangHocVienVai = {
  vai: 'tvv' | 'cx';
  phamVi: { coThe: SoHocVien['phamVi'][]; dangDung: SoHocVien['phamVi']; chiNhanh: number | null };
  ids: Record<ChipHocVien, number[]>;
  rows: DongHocVienVai[];
};

export function hocVienTheoVai(p: Principal, f: { phamVi?: string | null; branchId?: number | null } = {}): TrangHocVienVai {
  const vai = vaiXemHocVien(p.roleKeys);
  if (vai !== 'tvv' && vai !== 'cx') throw forbidden('Danh sách học viên theo vai chỉ dành cho TVV / CX.');
  const scope = scopeFor(p, PERMISSIONS.STUDENT_VIEW);
  const hopLe = (b: number | null | undefined): b is number => !!b && (scope.all || scope.branchIds.includes(b));
  /* TVV: "HV của tôi" (mặc định) · "Cả chi nhánh" (chi nhánh của TVV). CX: tất cả chi nhánh (mặc định) · một chi nhánh. */
  const dangDung: SoHocVien['phamVi'] = vai === 'tvv' ? (f.phamVi === 'chi-nhanh' ? 'chi-nhanh' : 'cua-toi') : hopLe(f.branchId) ? 'chi-nhanh' : 'tat-ca';
  const chiNhanh = dangDung !== 'chi-nhanh' ? null : hopLe(f.branchId) ? f.branchId : scope.branchIds[0] ?? null;
  const chip = chipHocVien(p, { phamVi: dangDung, branchId: chiNhanh });
  const ids = chip.tatCa;

  /*
   * MỘT câu cho mỗi lô em (trần câu SQL — CX đọc mọi chi nhánh): học viên + TVV · lớp đang học / đang giữ chỗ (Tạm dừng), không có thì lớp cuối
   * (đã kết thúc học) · lộ trình đang chạy, không có thì lộ trình cuối (Target / Dự kiến thi vẫn đọc được) · tên chi nhánh.
   */
  const hs = new Map<number, any>();
  theoLo(ids, (lo, ph) => {
    for (const s of db().prepare(
      `SELECT s.id, s.full_name, s.student_code, s.status, s.phone, s.parent_name, s.parent_relation, s.parent_phone, u.full_name AS tvv,
              e.status AS enr_status, c.id AS lop_id, c.code AS lop_code, c.is_fast_track, b.name AS chi_nhanh,
              cy.target_score, cy.khong_cam_ket, cy.exam_period_id, cy.exam_month, cy.exam_date, rp.code AS exam_week_code, rp.week_start AS exam_week_start
         FROM students s
         LEFT JOIN users u ON u.id = s.consultant_user_id
         LEFT JOIN enrollments e ON e.id = (SELECT x.id FROM enrollments x WHERE x.student_id = s.id ORDER BY x.status IN ('active', 'paused') DESC, x.id DESC LIMIT 1)
         LEFT JOIN classes c ON c.id = e.class_id
         LEFT JOIN branches b ON b.id = COALESCE(c.branch_id, s.branch_id)
         LEFT JOIN learning_cycles cy ON cy.id = (SELECT x.id FROM learning_cycles x WHERE x.student_id = s.id ORDER BY x.status = 'active' DESC, x.seq DESC LIMIT 1)
         LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
        WHERE s.id IN (${ph})`,
    ).all(...lo) as any[]) hs.set(s.id, s);
  });
  const tienDo = classProgressMany([...new Set([...hs.values()].map((s) => s.lop_id as number | null).filter((v): v is number => v != null))]);
  const tamDung = khoangTamDung(ids.filter((id) => hs.get(id)?.status === 'inactive'));

  const rows: DongHocVienVai[] = ids.flatMap((id) => {
    const s = hs.get(id);
    if (!s) return [];
    const td = s.lop_id != null ? tienDo.get(s.lop_id) : undefined;
    return [{
      id, ten: s.full_name, ma: s.student_code, status: s.status,
      tamDungTu: s.status === 'inactive' ? tamDung[id]?.find((k) => k.den === null)?.tu ?? null : null,
      lop: s.lop_id != null ? {
        id: s.lop_id, code: s.lop_code, ft: !!s.is_fast_track, tuan: td?.currentWeek ?? null, tongTuan: td?.totalWeeks ?? null,
        daRoi: s.enr_status !== 'active' && s.enr_status !== 'paused',
      } : null,
      chiNhanh: s.chi_nhanh ?? null, tvv: s.tvv ?? null,
      target: s.target_score ?? null, kck: !!s.khong_cam_ket, duKienThi: examPlanOf(s),
      standing: chip.standing.get(id) ?? null,
      chuY: chip.lyDo.get(id) ?? null,
      lienHe: { phone: s.phone ?? null, parentName: s.parent_name ?? null, parentRelation: s.parent_relation ?? null, parentPhone: s.parent_phone ?? null },
      viewer: { suaThongTin: can(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId: id }), suaThem: can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId: id }) },
    }];
  });
  return {
    vai, phamVi: { coThe: vai === 'tvv' ? ['cua-toi', 'chi-nhanh'] : ['tat-ca', 'chi-nhanh'], dangDung, chiNhanh },
    ids: chip.ids, rows,
  };
}
