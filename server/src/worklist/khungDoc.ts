/**
 * LPB-1 (N73 ⑤): đọc việc khung THEO LÔ (một loại, nhiều id — panel giao việc, đường ghi, Đang theo dõi, quét ngày) — người theo luật, còn việc không, hạn luật.
 * MỌI điều kiện "còn việc" / người mặc định gọi CÙNG hàm với Công việc (một nguồn): `lichChotNgayThi` · `thieuHoSoEm` · `choBuocTiep` · `loTrinhChoKetQuaThi` ·
 * `viecBanGiao` · `tinh chốt lộ trình` · `tapXetLai` · `conXepLichMt`. Rà PTA #2280: câu theo LOẠI (không theo dòng) — tập lớn (`choBuocTiep`, `SQL_MOC`, Xét lại,
 * Chốt lộ trình) đọc một lần mỗi request rồi lọc; còn lại một câu `IN (…)` cho cả lô.
 */
import { DS_JSON, db, docNho } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { notFound } from '../util.ts';
import { kyNangPhuTrach, tenMonNgan, trangThaiSauThi } from '../../../shared/domain/index.ts';
import { headCua } from './nguoiNhan.ts';
import { CN_EM } from './hieuLuc.ts';
import { BANG_KHUNG, NHAN_KHUNG, datConMo, type LoaiKhung } from './khungViec.ts';
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
const ds = (sql: string, ids: readonly number[]) => db().prepare(sql).all(JSON.stringify(ids)) as any[];
const theoId = <T extends { id: number }>(rs: T[]) => new Map(rs.map((r) => [r.id, r]));

/** Dòng bảng phụ (không có / đợt trước — không 'mo' — đọc như chưa giao: người giao / hạn rỗng). */
function dongPhuLo(loai: LoaiKhung, ids: readonly number[]): Map<number, any> {
  const m = theoId(ds(`SELECT * FROM ${BANG_KHUNG[loai]} WHERE id IN (${DS_JSON})`, ids));
  const out = new Map<number, any>();
  for (const id of ids) {
    const r = m.get(id);
    if (loai === 'ban_giao_gv') { if (r) out.set(id, r); continue; }
    if (loai === 'ban_giao_mon') { if (r) out.set(id, r.trang_thai !== 'mo' ? { ...r, han_chon: null, phu_trach_id: null, giao_boi: null, giao_luc: null } : r); continue; }
    out.set(id, r?.trang_thai === 'mo' ? r : { id, trang_thai: r?.trang_thai ?? null, han_chon: null, phu_trach_id: null, giao_boi: null, giao_luc: null });
  }
  return out;
}

/** Nhiều việc cùng loại — id không có (đơn vị đã xoá) không vào Map. */
export function docViecKhungLo(loai: LoaiKhung, ids: readonly number[]): Map<number, ViecKhung> {
  const out = new Map<number, ViecKhung>();
  if (!ids.length) return out;
  const today = demoToday();
  const phu = dongPhuLo(loai, ids);
  if (loai === 'chot_ngay_thi' || loai === 'buoc_tiep' || loai === 'thi_that' || loai === 'bo_sung_ho_so') {
    const em = theoId(loai === 'bo_sung_ho_so'
      ? ds(`SELECT s.id AS id, s.id AS student_id, s.full_name, s.consultant_user_id AS tvv, ${CN_EM('s.id')} AS em_branch FROM students s WHERE s.id IN (${DS_JSON})`, ids)
      : ds(`SELECT lc.id AS id, lc.student_id, s.full_name, s.consultant_user_id AS tvv, ${CN_EM('s.id')} AS em_branch
          FROM learning_cycles lc JOIN students s ON s.id = lc.student_id WHERE lc.id IN (${DS_JSON})`, ids));
    const hs = loai === 'chot_ngay_thi' || loai === 'bo_sung_ho_so'
      ? new Map(ds(`${SQL_HO_SO_TVV} WHERE s.id IN (${DS_JSON})`, [...new Set([...em.values()].map((e) => e.student_id as number))]).map((r) => [r.id as number, r])) : null;
    const bt = loai === 'buoc_tiep' ? theoId(choBuocTiep()) : null;
    const tt = loai === 'thi_that' ? new Set(loTrinhChoKetQuaThi(today).map((x) => x.c.id as number)) : null;
    for (const [id, e] of em) {
      const sid = e.student_id as number;
      const cn: number | null = e.em_branch ?? null;
      const h = hs?.get(sid);
      const c = bt?.get(id);
      const mo = loai === 'bo_sung_ho_so' ? !!h && thieuHoSoEm(h).length > 0 : loai === 'chot_ngay_thi' ? !!h && h.cycle_id === id && !!lichChotNgayThi(h, today)
        : loai === 'buoc_tiep' ? !!c : tt!.has(id);
      out.set(id, { row: { ...phu.get(id), student_id: sid, em_branch: cn, han_luat: c ? trangThaiSauThi(c, today).han ?? null : null }, studentId: sid, tenEm: e.full_name,
        tvv: e.tvv ?? null, gvcn: null, branchId: cn, mo, tieuDe: `${NHAN_KHUNG[loai]} · ${e.full_name}`, macDinh: macDinhTvv(e.tvv ?? null, cn) });
    }
    return out;
  }
  if (loai === 'xep_lich_mt') {
    const moc = new Map(docNho(SQL_MOC).filter((r: any) => ids.includes(r.id)).map((r: any) => [r.id as number, r]));
    const co = new Set(ds(`SELECT id FROM case_interventions WHERE id IN (${DS_JSON})`, ids).map((r) => r.id as number));
    for (const id of ids) {
      if (!co.has(id)) continue;
      const r = moc.get(id);
      const cn: number | null = r?.branch_id ?? null;
      out.set(id, { row: { ...phu.get(id), student_id: r?.sid ?? null, em_branch: cn, han_luat: null, class_id: r?.class_id ?? null, branch_id: cn, khung: true },
        studentId: r?.sid ?? null, tenEm: r?.full_name ?? '', tvv: null, gvcn: null, branchId: cn, mo: !!r && conXepLichMt(r), tieuDe: r ? viecMoc(r).tieuDe : NHAN_KHUNG[loai], macDinh: ql(cn) });
    }
    return out;
  }
  /* Việc của lớp. */
  const lopCua = (id: number): number | null => (loai === 'ban_giao_gv' ? phu.get(id)?.class_id : loai === 'ban_giao_mon' ? phu.get(id)?.lop_id : id) ?? null;
  const lopIds = [...new Set(ids.map(lopCua).filter((x): x is number => !!x))];
  const lop = theoId(ds(`SELECT id, code, branch_id, programme_code AS ct FROM classes WHERE id IN (${DS_JSON})`, lopIds));
  const h = today;
  const gv = new Map<number, number>();   // GVCN đang hiệu lực từng lớp (một câu)
  for (const r of db().prepare(`SELECT class_id, user_id FROM teacher_assignments WHERE class_id IN (SELECT value FROM json_each(?)) AND is_core = 1 AND status = 'active'
      AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?) ORDER BY id`).all(JSON.stringify(lopIds), h, h) as any[]) if (!gv.has(r.class_id)) gv.set(r.class_id, r.user_id);
  const bg = loai === 'ban_giao' ? new Map(ds(`SELECT lop_nguon_id AS id, MIN(han_gvcn) AS han, COUNT(*) AS n FROM lenh_chuyen_lop WHERE lop_nguon_id IN (${DS_JSON})
      AND trang_thai != 'huy' AND huong != 'dung_hoc' AND xac_nhan_luc IS NULL GROUP BY lop_nguon_id`, lopIds).map((r) => [r.id as number, r])) : null;
  const xl = loai === 'xet_lai' ? tapXetLai(today, null).filter((e) => !e.quyetDinh) : null;
  for (const id of ids) {
    const lopId = lopCua(id);
    const l = lopId ? lop.get(lopId) : null;
    if (!l || (loai === 'ban_giao_gv' && !phu.get(id))) continue;
    const cn: number | null = l.branch_id ?? null;
    const g = gv.get(lopId!) ?? null;
    const hang = (mo: boolean, hanLuat: string | null, macDinh: number[], tieuDe: string, gvcn: number | null = null) =>
      out.set(id, { studentId: null, tenEm: l.code, tvv: null, branchId: cn, gvcn, mo, tieuDe, macDinh,
        row: { ...(phu.get(id) ?? { id }), class_id: lopId, han_luat: hanLuat, branch_id: cn, khung: true } });
    if (loai === 'ban_giao_gv') { const b = phu.get(id); hang(b.trang_thai === 'mo', b.han, b.nguoi_lam ? [b.nguoi_lam] : ql(cn), `${NHAN_KHUNG[loai]} · ${l.code}`); continue; }
    if (loai === 'chot_lo_trinh') { const x = lopChotLoTrinhMo(lopId!, today); hang(!!x, x?.han ?? null, ql(cn), `${NHAN_KHUNG[loai]} · ${l.code}`); continue; }
    if (loai === 'xet_lai') {
      const em = xl!.filter((e) => e.lopHienTai.id === lopId);
      hang(em.length > 0, em.map((e) => e.han).sort()[0] ?? null, ql(cn), `${NHAN_KHUNG[loai]} · ${l.code}`); continue;
    }
    if (loai === 'ban_giao') { const v = bg!.get(lopId!); hang(Number(v?.n) > 0, v?.han ?? null, g ? [g] : ql(cn), `${NHAN_KHUNG[loai]} · ${l.code}`, g); continue; }
    /* ban_giao_mon: còn việc khi Công việc còn dòng GVBM của môn đó ở lớp (cùng hàm). Người mặc định: GV dạy môn → GVCN → Head. */
    const mon = phu.get(id).mon as string;
    const it = viecBanGiao(null, null, lopId).find((v) => v.loai === 'gvbm' && v.mon.split(',').includes(mon));
    const gvMon = (db().prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND skill IN (SELECT value FROM json_each(?)) ORDER BY id LIMIT 1`)
      .get(lopId, JSON.stringify(kyNangPhuTrach(l.ct ?? null, mon))) as any)?.user_id ?? null;
    hang(!!it, it?.han || null, gvMon ? [gvMon] : g ? [g] : ql(cn), `${NHAN_KHUNG[loai]} ${tenMonNgan(l.ct ?? null, mon)} · ${l.code}`, g);
  }
  return out;
}

export function docViecKhung(loai: LoaiKhung, id: number): ViecKhung {
  const v = docViecKhungLo(loai, [id]).get(id);
  if (!v) throw notFound('Không tìm thấy việc.');
  return v;
}

/* Rà PTA #2280 (bảo mật 1): `duocGiao` hỏi việc còn mở bằng đúng hàm đọc việc này. */
datConMo((loai, id) => { try { return docViecKhung(loai, id).mo; } catch { return false; } });
