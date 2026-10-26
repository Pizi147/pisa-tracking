/**
 * HỌC VIÊN & LỚP CỦA TVV / CX (OV-10b, mockup vai 13/10 mục 1 + 5) — một request cho cả trang: mỗi em một dòng theo việc của vai (trạng thái chữ,
 * lớp, Target · Dự kiến thi, kết quả gần nhất, lý do chip `can-chu-y`, phụ huynh, TVV, chi nhánh), web nhóm theo lớp và lọc chip tại chỗ.
 * Tập em và chip = `chipHocVien` (OV-10c, cùng số ô Tổng quan) — không hàm đếm thứ hai; em Tạm dừng / Kết thúc học (chưa lưu trữ) vẫn có dòng.
 * QL / Quản trị / GV / Admin dùng bảng cũ (`danhSachHocVienLop`) — đường này 403.
 */
import { db, theoLo } from '../db.ts';
import { PERMISSIONS, kyThiCuaChuongTrinh, trangThaiSauThi, vaiXemHocVien, type ExamPlan, type GiaiDoanSauThi, type LienHe } from '../../../shared/domain/index.ts';
import { forbidden } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { chipHocVien, type ChipHocVien, type LyDoChuY, type SoHocVien } from '../worklist/hvCuaToi.ts';
import type { Standing } from '../students/standing.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { classProgressMany } from './schedule.ts';
import { choBuocTiep, hanBuocTiep } from '../loTrinh/buocTiep.ts';
import { tvvCuaEm } from '../worklist/viecTvv.ts';
import { cotSauThi, loTrinhChoKetQuaThi } from '../loTrinh/thiThat.ts';
import { demoToday } from '../demoConfig.ts';
import { chiNhanhTaoLop } from './hocVienLop.ts';

export type DongHocVienVai = {
  id: number; ten: string; ma: string; status: string;
  /** OV-13f: ô còn thiếu (`missingForStudent`, trống = đủ) — Cần làm TVV tách "Thiếu email" khỏi "Thiếu thông tin". */
  thieu: string[];
  /** Ngày bắt đầu Tạm dừng (em đang Tạm dừng). */
  tamDungTu: string | null;
  /** Lớp đang học / đang giữ chỗ (Tạm dừng); em đã kết thúc học → lớp cuối, `daRoi`. null = chưa xếp lớp. */
  lop: { id: number; code: string; ft: boolean; tuan: number | null; tongTuan: number | null; daRoi: boolean } | null;
  chiNhanh: string | null; tvv: string | null;
  target: number | null; kck: boolean; duKienThi: ExamPlan;
  /** OV-13q: lộ trình FT đã thi chưa xong — nhãn "Đã thi · chờ kết quả · hạn …" / "Đã xong · chờ bước tiếp · hạn …" ở cột Target · Dự kiến thi. */
  sauThi: { giaiDoan: GiaiDoanSauThi; han: string | null; quaHan: boolean; daGiaHan: boolean } | null;
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
  /**
   * OV-12f: việc của góc Cần làm (TVV) — Chọn bước tiếp sau thi (lộ trình + hạn, cùng `choBuocTiep` / `viecBuocTiep`) · Kết quả thi thật chưa có
   * (cùng `loTrinhChoKetQuaThi` của việc GVCN). Thiếu thông tin = `ids.thieu_tt`. Chỉ em trong phạm vi đang xem.
   */
  viec: { buocTiep: Record<number, { cycleId: number; han: string }>; ketQuaThi: Record<number, { han: string | null; thi: string | null }> };
  /** OV-13p: nút đầu trang "+ Lớp mới" (`class.create` ở ít nhất một chi nhánh) · "+ Học viên" (`student.add` trong phạm vi grant) — máy chủ kiểm lại khi lưu. */
  coTheTaoLop: boolean; coTheThemHocVien: boolean;
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
              cy.target_score, cy.khong_cam_ket, cy.exam_period_id, cy.exam_month, cy.exam_date, rp.code AS exam_week_code, rp.week_start AS exam_week_start,
              cy.id AS cy_id, cy.route AS cy_route, cy.programme_code AS cy_ct, cy.seq AS cy_seq, cy.status AS cy_status, (SELECT MAX(x.seq) FROM learning_cycles x WHERE x.student_id = s.id) AS seq_cuoi, ${cotSauThi('cy', 'rp')}
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
  const homNay = demoToday();
  const tamDung = khoangTamDung(ids.filter((id) => hs.get(id)?.status === 'inactive'));

  const rows: DongHocVienVai[] = ids.flatMap((id) => {
    const s = hs.get(id);
    if (!s) return [];
    const td = s.lop_id != null ? tienDo.get(s.lop_id) : undefined;
    /* Cùng hàm với việc Công việc (lộ trình FT mới nhất; em chưa Lưu trữ đã lọc ở `chipHocVien`). */
    const st = s.cy_route && s.cy_seq === s.seq_cuoi ? trangThaiSauThi(s, homNay) : null;
    /* Cùng luật `LO_TRINH_MOI_NHAT`: em Kết thúc học / lộ trình bỏ dở chưa có kết quả → không "chờ kết quả". */
    const thoiHoc = st?.giaiDoan === 'da_thi_cho_kq' && (s.status === 'finished' || s.cy_status === 'abandoned');
    const sauThi = st && !thoiHoc && (st.giaiDoan === 'da_thi_cho_kq' || st.giaiDoan === 'cho_buoc_tiep') ? { giaiDoan: st.giaiDoan, han: st.han, quaHan: st.quaHan, daGiaHan: st.daGiaHan } : null;
    return [{
      id, ten: s.full_name, ma: s.student_code, status: s.status, thieu: chip.thieu.get(id) ?? [],
      tamDungTu: s.status === 'inactive' ? tamDung[id]?.find((k) => k.den === null)?.tu ?? null : null,
      lop: s.lop_id != null ? {
        id: s.lop_id, code: s.lop_code, ft: !!s.is_fast_track, tuan: td?.currentWeek ?? null, tongTuan: td?.totalWeeks ?? null,
        daRoi: s.enr_status !== 'active' && s.enr_status !== 'paused',
      } : null,
      chiNhanh: s.chi_nhanh ?? null, tvv: s.tvv ?? null,
      target: s.target_score ?? null, kck: !!s.khong_cam_ket, duKienThi: examPlanOf(s), sauThi,
      /** P13: khoá KET / PET — ⋯ dòng có "Kết quả thi thật" (thang Cambridge) như hồ sơ. */
      kyThi: !s.cy_route && !!kyThiCuaChuongTrinh(s.cy_ct),
      standing: chip.standing.get(id) ?? null,
      chuY: chip.lyDo.get(id) ?? null,
      lienHe: { phone: s.phone ?? null, parentName: s.parent_name ?? null, parentRelation: s.parent_relation ?? null, parentPhone: s.parent_phone ?? null },
      viewer: { suaThongTin: can(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId: id }), suaThem: can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId: id }) },
    }];
  });
  /* SV-TVV-VIEC: góc Cần làm chỉ có việc TVV đang xem GIỮ (em của mình) — em của TVV khác trong "Cả chi nhánh" không vào. */
  const tvvEm = vai === 'tvv' ? tvvCuaEm(ids) : new Map<number, number | null>();
  const coEm = new Set(ids.filter((id) => tvvEm.get(id) === p.userId));
  const buocTiep: TrangHocVienVai['viec']['buocTiep'] = {};
  /* Chỉ TVV có góc Cần làm — CX không chạy hai câu này. */
  if (vai === 'tvv') for (const c of choBuocTiep()) if (coEm.has(c.student_id)) buocTiep[c.student_id] = { cycleId: c.id, han: hanBuocTiep(c, homNay) };
  const ketQuaThi: TrangHocVienVai['viec']['ketQuaThi'] = {};
  if (vai === 'tvv') for (const { c, s } of loTrinhChoKetQuaThi(homNay)) if (coEm.has(c.student_id)) ketQuaThi[c.student_id] = { han: s.han, thi: s.ngayThi };
  return {
    vai, phamVi: { coThe: vai === 'tvv' ? ['cua-toi', 'chi-nhanh'] : ['tat-ca', 'chi-nhanh'], dangDung, chiNhanh },
    ids: chip.ids, rows, viec: { buocTiep, ketQuaThi },
    coTheTaoLop: chiNhanhTaoLop(p).length > 0, coTheThemHocVien: !scopeFor(p, PERMISSIONS.STUDENT_ADD).none,
  };
}
