/**
 * LPB-1 (N73 ⑤): đọc MỘT việc khung (panel giao việc, đường ghi giao / hạn / theo dõi, Đang theo dõi, quét ngày) — người theo luật, còn việc không, hạn luật.
 * MỌI điều kiện "còn việc" / người mặc định gọi CÙNG hàm với Công việc (một nguồn): `lichChotNgayThi` · `thieuHoSoEm` · `choBuocTiep` · `loTrinhChoKetQuaThi` ·
 * `viecBanGiao` · `lopChotLoTrinhMo` · `tapXetLai` · `conXepLichMt`. Vài câu mỗi lần — chỉ ở đường một việc, không ở `/my-work`.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { notFound } from '../util.ts';
import { kyNangPhuTrach, tenMonNgan, trangThaiSauThi } from '../../../shared/domain/index.ts';
import { headCua } from './nguoiNhan.ts';
import { CN_EM } from './hieuLuc.ts';
import { BANG_KHUNG, NHAN_KHUNG, type LoaiKhung } from './khungViec.ts';
import { SQL_HO_SO_TVV, leadTvvCua, lichChotNgayThi, thieuHoSoEm, tvvConVai } from './viecTvv.ts';
import { SQL_MOC, conXepLichMt, viecMoc } from './mocQuyChe.ts';
import { choBuocTiep } from '../loTrinh/buocTiep.ts';
import { loTrinhChoKetQuaThi } from '../loTrinh/thiThat.ts';
import { viecBanGiao } from '../classes/banGiao.ts';
import { lopChotLoTrinhMo } from '../classes/lenhChuyen.ts';
import { tapXetLai } from '../normal/xetLai.ts';

export type ViecKhung = {
  row: any; studentId: number | null; tenEm: string; tvv: number | null; gvcn: number | null; branchId: number | null; mo: boolean; tieuDe: string; macDinh: number[];
};

const ql = (cn: number | null): number[] => { const h = headCua(cn); return h ? [h] : []; };
/** N6 + N76b: TVV của em (còn vai ở chi nhánh em) → Lead TVV gán chi nhánh em → Head — như `chuViecTvv` / `nguoiGiuTvv`. */
const macDinhTvv = (tvv: number | null, cn: number | null): number[] => {
  if (tvv && tvvConVai(tvv, cn)) return [tvv];
  const lead = leadTvvCua(cn);
  return lead ? [lead] : ql(cn);
};
const gvcnLop = (lop: number): number | null => {
  const h = demoToday();
  return (db().prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'
      AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?) ORDER BY id LIMIT 1`).get(lop, h, h) as any)?.user_id ?? null;
};

/** Dòng bảng phụ (không có / đợt trước — không 'mo' — đọc như chưa giao: người giao / hạn rỗng). */
function dongPhu(loai: LoaiKhung, id: number): any {
  const r = db().prepare(`SELECT * FROM ${BANG_KHUNG[loai]} WHERE id = ?`).get(id) as any;
  if (loai === 'ban_giao_gv') return r;
  if (loai === 'ban_giao_mon') return r && r.trang_thai !== 'mo' ? { ...r, han_chon: null, phu_trach_id: null, giao_boi: null, giao_luc: null } : r;
  return r?.trang_thai === 'mo' ? r : { id, trang_thai: r?.trang_thai ?? null, han_chon: null, phu_trach_id: null, giao_boi: null, giao_luc: null };
}

export function docViecKhung(loai: LoaiKhung, id: number): ViecKhung {
  const today = demoToday();
  const phu = dongPhu(loai, id);
  if (loai === 'chot_ngay_thi' || loai === 'buoc_tiep' || loai === 'thi_that' || loai === 'bo_sung_ho_so') {
    const em = loai === 'bo_sung_ho_so'
      ? db().prepare(`SELECT s.id AS student_id, NULL AS cycle_id, s.full_name, s.consultant_user_id AS tvv, ${CN_EM('s.id')} AS em_branch FROM students s WHERE s.id = ?`).get(id) as any
      : db().prepare(`SELECT lc.student_id, lc.id AS cycle_id, s.full_name, s.consultant_user_id AS tvv, ${CN_EM('s.id')} AS em_branch
          FROM learning_cycles lc JOIN students s ON s.id = lc.student_id WHERE lc.id = ?`).get(id) as any;
    if (!em) throw notFound('Không tìm thấy việc.');
    const sid = em.student_id as number;
    const cn: number | null = em.em_branch ?? null;
    let mo = false; let hanLuat: string | null = null;
    if (loai === 'chot_ngay_thi' || loai === 'bo_sung_ho_so') {
      const hs = db().prepare(`${SQL_HO_SO_TVV} WHERE s.id = ?`).get(sid) as any;
      mo = !!hs && (loai === 'bo_sung_ho_so' ? thieuHoSoEm(hs).length > 0 : hs.cycle_id === id && !!lichChotNgayThi(hs, today));
    } else if (loai === 'buoc_tiep') {
      const c = choBuocTiep(sid).find((x) => x.id === id);
      mo = !!c;
      if (c) hanLuat = trangThaiSauThi(c, today).han ?? null;
    } else {
      mo = loTrinhChoKetQuaThi(today).some((x) => x.c.id === id);
    }
    return { row: { ...phu, student_id: sid, em_branch: cn, han_luat: hanLuat }, studentId: sid, tenEm: em.full_name, tvv: em.tvv ?? null, gvcn: null, branchId: cn, mo,
      tieuDe: `${NHAN_KHUNG[loai]} · ${em.full_name}`, macDinh: macDinhTvv(em.tvv ?? null, cn) };
  }
  if (loai === 'xep_lich_mt') {
    const r = db().prepare(`${SQL_MOC} AND iv.id = ?`).get(id) as any;
    if (!r) {
      const iv = db().prepare(`SELECT iv.id FROM case_interventions iv WHERE iv.id = ?`).get(id);
      if (!iv) throw notFound('Không tìm thấy việc.');
    }
    const cn: number | null = r?.branch_id ?? null;
    return { row: { ...phu, student_id: r?.sid ?? null, em_branch: cn, han_luat: null, class_id: r?.class_id ?? null, branch_id: cn, khung: true }, studentId: r?.sid ?? null, tenEm: r?.full_name ?? '',
      tvv: null, gvcn: null, branchId: cn, mo: !!r && conXepLichMt(r), tieuDe: r ? viecMoc(r).tieuDe : NHAN_KHUNG[loai], macDinh: ql(cn) };
  }
  /* Việc của lớp. */
  if (loai === 'ban_giao_gv') {
    if (!phu) throw notFound('Không tìm thấy việc.');
    const l = db().prepare('SELECT code, branch_id FROM classes WHERE id = ?').get(phu.class_id) as any;
    const cn: number | null = l?.branch_id ?? null;
    return { row: { ...phu, han_luat: phu.han, branch_id: cn, khung: true }, studentId: null, tenEm: l?.code ?? '', tvv: null, gvcn: null, branchId: cn, mo: phu.trang_thai === 'mo',
      tieuDe: `${NHAN_KHUNG[loai]} · ${l?.code ?? ''}`, macDinh: phu.nguoi_lam ? [phu.nguoi_lam] : ql(cn) };
  }
  const lopId = loai === 'ban_giao_mon' ? phu?.lop_id : id;
  if (!lopId) throw notFound('Không tìm thấy việc.');
  const l = db().prepare('SELECT id, code, branch_id, programme_code AS ct FROM classes WHERE id = ?').get(lopId) as any;
  if (!l) throw notFound('Không tìm thấy việc.');
  const cn: number | null = l.branch_id ?? null;
  const chung = { studentId: null, tenEm: l.code as string, tvv: null, branchId: cn };
  const hang = (mo: boolean, hanLuat: string | null, macDinh: number[], tieuDe: string, gvcn: number | null = null): ViecKhung =>
    ({ ...chung, gvcn, mo, tieuDe, macDinh, row: { ...(phu ?? { id }), class_id: lopId, han_luat: hanLuat, branch_id: cn, khung: true } });
  if (loai === 'chot_lo_trinh') {
    const x = lopChotLoTrinhMo(lopId, today);
    return hang(!!x, x?.han ?? null, ql(cn), `${NHAN_KHUNG[loai]} · ${l.code}`);
  }
  if (loai === 'xet_lai') {
    const em = tapXetLai(today, cn ? [cn] : null).filter((e) => !e.quyetDinh && e.lopHienTai.id === lopId);
    return hang(em.length > 0, em.map((e) => e.han).sort()[0] ?? null, ql(cn), `${NHAN_KHUNG[loai]} · ${l.code}`);
  }
  const gv = gvcnLop(lopId);
  if (loai === 'ban_giao') {
    const v = db().prepare(`SELECT MIN(han_gvcn) AS han, COUNT(*) AS n FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai != 'huy' AND huong != 'dung_hoc'
        AND xac_nhan_luc IS NULL`).get(lopId) as any;
    return hang(Number(v?.n) > 0, v?.han ?? null, gv ? [gv] : ql(cn), `${NHAN_KHUNG[loai]} · ${l.code}`, gv);
  }
  /* ban_giao_mon: còn việc khi Công việc còn dòng GVBM của môn đó ở lớp (cùng hàm). Người mặc định: GV dạy môn → GVCN → Head. */
  const mon = phu.mon as string;
  const it = viecBanGiao(null, null, lopId).find((v) => v.loai === 'gvbm' && v.mon.split(',').includes(mon));
  const gvMon = (db().prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND skill IN (SELECT value FROM json_each(?)) ORDER BY id LIMIT 1`)
    .get(lopId, JSON.stringify(kyNangPhuTrach(l.ct ?? null, mon))) as any)?.user_id ?? null;
  return hang(!!it, it?.han || null, gvMon ? [gvMon] : gv ? [gv] : ql(cn), `${NHAN_KHUNG[loai]} ${tenMonNgan(l.ct ?? null, mon)} · ${l.code}`, gv);
}
