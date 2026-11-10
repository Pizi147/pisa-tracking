/**
 * BÁO CÁO CHI NHÁNH (Phân tích V2, đặc tả `2026-11-12-phan-tich-v2-design.md` mục 3, 9, 11, 12; mockup `thiet-ke/2026-11-12-phan-tich-v2/` A1–A6).
 * MỘT GET (`/tong-quan/v5?baoCao=chi-nhanh`) — chỉ tính phần báo cáo Chi nhánh cần (PTA chốt XM-2: không kéo Case, SOS, Trễ chấm của Tổng quan).
 * KHÔNG đếm lại: Đạt MT = `tapDatMt` (HV), Tiến bộ = `tienBoTheoKyNang` (lượt kỹ năng), lớp thường Đạt Test / Cuối khoá = CHÍNH ô của bảng Test
 * lớp thường (`tongHop`, bài), Thi thật = `thiThatTrongKhoang` (em, trừ KCK) — rồi chỉ CHIA theo lớp (một chi nhánh) hoặc chi nhánh (Tất cả).
 * Số mới: "vào · kết thúc" (em, 1 câu mỗi số) và "Chưa có KQ" (hiện tại, `sauThiTheoEm` → `da_thi_cho_kq`).
 */
import { DS_JSON, db, theoLo } from '../db.ts';
import { PERMISSIONS, coMucThi, mucThi, soSanhLop, type ChuongTrinh } from '../../../shared/domain/index.ts';
import type { ChiNhanhV2Kq, DongChiNhanhV2, TyLeCn } from '../../../shared/domain/index.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { badRequest, forbidden } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { studentsInScope } from '../worklist/danhGia.ts';
import { locTheoChuongTrinh } from '../worklist/chuongTrinh.ts';
import { sauThiTheoEm } from '../loTrinh/thiThat.ts';
import { tapDatMt } from './baoCao.ts';
import { tienBoTheoKyNang } from './giaoVien.ts';
import { thiThatTrongKhoang } from './ketQuaThi.ts';
import { tongHop } from './tongHop.ts';

export type LocChiNhanh = { branchId: number | null; ct: ChuongTrinh; tu: string; den: string };
const THU_TU_KN = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];

function phamVi(p: Principal, f: LocChiNhanh) {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW);
  if (scope.none) throw forbidden('Phân tích dành cho Quản lý.');
  if (f.branchId && !scope.all && !scope.branchIds.includes(f.branchId)) throw forbidden('Bạn không xem được chi nhánh này.');
  /* Một chi nhánh: đã chọn, hoặc phạm vi chỉ có một chi nhánh (như `bangChiNhanh`). */
  const branchId = f.branchId ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  return { scope, branchId };
}

/** Lớp đang hoạt động của khung trong phạm vi + HV đang học từng lớp — CÙNG câu với cột Học viên của `bangChiNhanh` (panel `/tong-quan/chi-nhanh/o`). */
function lopVaHv(p: Principal, f: LocChiNhanh, branchId: number | null) {
  const { scope } = phamVi(p, f);
  const where = [`c.status = 'active'`, 'c.is_fast_track = ?'];
  const args: unknown[] = [f.ct === 'ft' ? 1 : 0];
  if (!scope.all) { where.push(scope.branchIds.length ? `c.branch_id IN (${scope.branchIds.map(() => '?').join(',')})` : '1=0'); args.push(...scope.branchIds); }
  if (branchId) { where.push('c.branch_id = ?'); args.push(branchId); }
  const conn = db();
  const lop = conn.prepare(`SELECT c.id, c.code, c.branch_id, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE ${where.join(' AND ')}`).all(...args) as any[];
  lop.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));
  const hv = new Map<number, Set<number>>(lop.map((c) => [c.id, new Set<number>()]));
  if (lop.length) {
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.status = 'active' AND s.archived_at IS NULL AND e.class_id IN (${DS_JSON})`,
    ).all(JSON.stringify(lop.map((c) => c.id))) as any[]) hv.get(r.class_id)!.add(r.student_id);
  }
  return { lop, hv };
}

/**
 * Vào · kết thúc (đặc tả 9.3) — đếm EM. Vào = lần ghi danh ĐẦU TIÊN của em ở chi nhánh có ngày trong kỳ (chuyển lớp, học lại không tính), em có lớp của khung
 * ở chi nhánh đó. Kết thúc = `students.finished_at` trong kỳ, em thuộc chi nhánh và có lớp của khung. Một câu mỗi số.
 */
export function tapVaoKetThuc(p: Principal, f: LocChiNhanh): { vao: Map<number, number>; ketThuc: Map<number, number> } {
  const { scope, branchId } = phamVi(p, f);
  const bs = branchId ? [branchId] : scope.all ? null : scope.branchIds;
  const loc = bs ? `c.branch_id IN (${bs.map(() => '?').join(',') || 'NULL'})` : '1=1';
  const ft = f.ct === 'ft' ? 1 : 0;
  const conn = db();
  const vao = new Map<number, number>();   // em → chi nhánh
  for (const r of conn.prepare(
    `SELECT e.student_id AS sid, c.branch_id AS cn FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE ${loc} GROUP BY e.student_id, c.branch_id
     HAVING substr(MIN(e.started_at), 1, 10) BETWEEN ? AND ? AND SUM(c.is_fast_track = ?) > 0`,
  ).all(...(bs ?? []), f.tu, f.den, ft) as any[]) vao.set(r.sid, r.cn);
  const ketThuc = new Map<number, number>();
  for (const r of conn.prepare(
    `SELECT s.id AS sid, s.branch_id AS cn FROM students s
      WHERE substr(s.finished_at, 1, 10) BETWEEN ? AND ? ${bs ? `AND s.branch_id IN (${bs.map(() => '?').join(',') || 'NULL'})` : ''}
        AND EXISTS (SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND c.branch_id = s.branch_id AND c.is_fast_track = ?)`,
  ).all(f.tu, f.den, ...(bs ?? []), ft) as any[]) ketThuc.set(r.sid, r.cn);
  return { vao, ketThuc };
}

/** Chưa có KQ (đặc tả 9.9) — HIỆN TẠI, không lọc kỳ: em FT trong phạm vi đã qua ngày thi, chưa có KQ, chưa đánh Không thi. */
export function tapChuaCoKq(p: Principal, f: LocChiNhanh): number[] {
  const { branchId } = phamVi(p, f);
  const em = locTheoChuongTrinh('hoc-vien', studentsInScope(p, branchId), 'ft');
  return [...sauThiTheoEm(em, demoToday())].filter(([, x]) => x.giaiDoan === 'da_thi_cho_kq').map(([sid]) => sid);
}

const tyLe = (dat: number, mau: number): TyLeCn => ({ dat, mau });

export function chiNhanhV2(p: Principal, f: LocChiNhanh): ChiNhanhV2Kq {
  const { branchId } = phamVi(p, f);
  const ft = f.ct === 'ft';
  const { lop, hv } = lopVaHv(p, f, branchId);
  const cheDo: ChiNhanhV2Kq['cheDo'] = branchId ? 'lop' : 'chi-nhanh';
  const cnCua = new Map<number, number>(lop.map((c) => [c.id, c.branch_id]));
  /* Hàng: lớp (một chi nhánh) hoặc chi nhánh (Tất cả) — chi nhánh theo thứ tự xuất hiện của lớp đã sắp. */
  const hang = new Map<number, DongChiNhanhV2>();
  const moi = (id: number, ten: string, khoa: string): DongChiNhanhV2 => ({ id, khoa, ten, hv: 0, datMt: null, tienBo: null, datTest: null, cuoiKhoa: null, thi: null });
  for (const c of lop) {
    if (cheDo === 'lop') hang.set(c.id, moi(c.id, c.code, `lop:${c.id}`));
    else if (!hang.has(c.branch_id)) hang.set(c.branch_id, moi(c.branch_id, c.branch_name, `cn:${c.branch_id}`));
  }
  const khoaHang = (classId: number | null | undefined): number | undefined => (classId == null ? undefined : cheDo === 'lop' ? classId : cnCua.get(classId));
  const tong = moi(0, '', 'tong');

  /* Học viên đang học: hàng = em ghi danh active của lớp (chi nhánh = hợp các lớp); tổng = dân số chỉ số (`studentsInScope` + khung) — như Tổng quan. */
  const hvHang = new Map<number, Set<number>>();
  for (const [classId, set] of hv) { const k = khoaHang(classId)!; const s = hvHang.get(k) ?? hvHang.set(k, new Set()).get(k)!; for (const x of set) s.add(x); }
  for (const [k, s] of hvHang) if (hang.has(k)) hang.get(k)!.hv = s.size;
  tong.hv = new Set(locTheoChuongTrinh('hoc-vien', studentsInScope(p, branchId), f.ct)).size;
  const vk = tapVaoKetThuc(p, f);

  const loc = { branchId, ct: f.ct, tu: f.tu, den: f.den };
  let datMt: ChiNhanhV2Kq['datMt'] = null;
  let tienBo: TyLeCn | null = null;
  let tienBoKn: ChiNhanhV2Kq['tienBoKn'] = null;
  let datTest: TyLeCn | null = null;
  let cuoiKhoa: ChiNhanhV2Kq['cuoiKhoa'] = null;
  let thiThat: ChiNhanhV2Kq['thiThat'] = null;
  if (ft) {
    /* Đạt MT (9.2): em theo lớp của lượt chốt. */
    const dm = tapDatMt(p, loc);
    const mau = new Map<number, number>(), dat = new Map<number, number>();
    for (const s of dm.mau) { const k = khoaHang(dm.luot.get(s)?.classId); if (k === undefined) continue; mau.set(k, (mau.get(k) ?? 0) + 1); if (dm.dat.has(s)) dat.set(k, (dat.get(k) ?? 0) + 1); }
    for (const [k, h] of hang) h.datMt = tyLe(dat.get(k) ?? 0, mau.get(k) ?? 0);
    datMt = { dat: dm.dat.size, mau: dm.mau.size, chuaDu: dm.chuaDu.size };
    tong.datMt = tyLe(dm.dat.size, dm.mau.size);

    /* Tiến bộ: lượt kỹ năng có band tăng so mốc MT trước — theo chi nhánh (hàm cần một chi nhánh), chia theo lớp của bài. */
    const cns = branchId ? [branchId] : [...new Set(lop.map((c) => c.branch_id as number))];
    const kn = new Map<string, { tang: number; giam: number; tong: number }>();
    const tbT = new Map<number, number>(), tbM = new Map<number, number>();
    for (const cn of cns) {
      for (const [skill, x] of tienBoTheoKyNang(p, cn, f)) {
        const g = kn.get(skill) ?? kn.set(skill, { tang: 0, giam: 0, tong: 0 }).get(skill)!;
        g.tang += x.dung.length; g.giam += x.giam.length; g.tong += x.tong.length;
        const tang = new Set(x.dung);
        for (const id of x.tong) {
          const k = cheDo === 'lop' ? x.lop.get(id) : cn;
          if (k === undefined) continue;
          tbM.set(k, (tbM.get(k) ?? 0) + 1); if (tang.has(id)) tbT.set(k, (tbT.get(k) ?? 0) + 1);
        }
      }
    }
    for (const [k, h] of hang) h.tienBo = tyLe(tbT.get(k) ?? 0, tbM.get(k) ?? 0);
    tienBoKn = [...kn].map(([skill, x]) => ({ skill, ...x })).sort((a, b) => THU_TU_KN.indexOf(a.skill) - THU_TU_KN.indexOf(b.skill));
    tienBo = tyLe(tienBoKn.reduce((a, x) => a + x.tang, 0), tienBoKn.reduce((a, x) => a + x.tong, 0));
    tong.tienBo = tienBo;

    /* Thi thật (12): Vượt · Đạt · Chưa đạt trừ KCK, em theo lớp lúc thi; ô trái thêm Em thi (em có KQ, gồm KCK — = panel `tong:thi`) và Chưa có KQ (hiện tại). */
    const ds = thiThatTrongKhoang(p, { branchId, tu: f.tu, den: f.den }, { boQuyen: true });
    const lopNgoai = [...new Set(ds.map((x) => x.dong.classId).filter((id): id is number => id != null && !cnCua.has(id)))];
    theoLo(lopNgoai, (lo, ph) => { for (const r of db().prepare(`SELECT id, branch_id FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) cnCua.set(r.id, r.branch_id); });
    const dem = (h: DongChiNhanhV2) => (h.thi ??= { vuot: 0, dat: 0, chuaDat: 0 });
    for (const x of ds) {
      if (!coMucThi(x.kq) || x.kq.ovr === null) continue;
      const m = mucThi(x.kq.ovr, x.kq.target!);
      const key = m === 'exceed' ? 'vuot' : m === 'dat' ? 'dat' : 'chuaDat';
      dem(tong)[key]++;
      const k = khoaHang(x.dong.classId);
      if (k !== undefined && hang.has(k)) dem(hang.get(k)!)[key]++;
    }
    thiThat = { ...(tong.thi ?? { vuot: 0, dat: 0, chuaDat: 0 }), emThi: ds.filter((x) => !x.kq.khongThi).length, chuaCoKq: tapChuaCoKq(p, f).length };
  } else {
    /* Lớp thường (9.2, 3): CHÍNH ô bảng Test lớp thường — Đạt Test = bài Progress "Đạt hết" + Final "Từ 70%" trên bài đủ điểm; Cuối khoá = 4 dải Final. */
    const th = tongHop(p, { branchId, ct: 'thuong', soTuan: 8, theo: cheDo === 'lop' ? 'lop' : 'cn', tu: f.tu, den: f.den });
    const tach = (o: Record<string, number>) => {
      const dat = (o['gk-dat'] ?? 0) + (o['ck-dat'] ?? 0);
      const mau = dat + (o['gk-1'] ?? 0) + (o['gk-2'] ?? 0) + (o['ck-60'] ?? 0) + (o['ck-50'] ?? 0) + (o['ck-duoi50'] ?? 0);
      const ck: [number, number, number, number] = [o['ck-dat'] ?? 0, o['ck-60'] ?? 0, o['ck-50'] ?? 0, o['ck-duoi50'] ?? 0];
      return { datTest: tyLe(dat, mau), cuoiKhoa: ck.some(Boolean) ? ck : null };
    };
    for (const r of th.hang) {
      const id = Number(r.khoa.split(':')[1]);
      if (hang.has(id)) Object.assign(hang.get(id)!, tach(r.o));
    }
    const t = tach(th.tong);
    datTest = t.datTest; cuoiKhoa = t.cuoiKhoa ?? [0, 0, 0, 0];
    Object.assign(tong, t);
  }

  return {
    tu: f.tu, den: f.den, ct: f.ct, branchId, cheDo,
    tenChiNhanh: branchId ? (lop[0]?.branch_name ?? (db().prepare('SELECT name FROM branches WHERE id = ?').get(branchId) as any)?.name ?? null) : null,
    hv: { dangHoc: tong.hv, vao: vk.vao.size, ketThuc: vk.ketThuc.size },
    datMt, tienBo, tienBoKn, datTest, cuoiKhoa, thiThat,
    hang: [...hang.values()], tong: { ...tong, ten: cheDo === 'lop' ? '' : 'Toàn hệ thống' },
  };
}

/** Panel ô mới của Chi nhánh: `vao` · `ket-thuc` · `chua-co-kq` (em). Các ô khác mở panel sẵn có (bảng chi nhánh, Báo cáo, Thi thật, Test). */
export function oChiNhanh(p: Principal, f: LocChiNhanh & { o: string; khoa?: string | null }): { n: number; tieuDe: string; ids: number[] } {
  if (f.o === 'chua-co-kq') { const ids = tapChuaCoKq(p, f); return { n: ids.length, tieuDe: `${ids.length} em — đã thi, chưa có KQ`, ids }; }
  if (f.o === 'vao' || f.o === 'ket-thuc') {
    const m = tapVaoKetThuc(p, f)[f.o === 'vao' ? 'vao' : 'ketThuc'];
    const ids = [...m.keys()].sort((a, b) => a - b);
    return { n: ids.length, tieuDe: `${ids.length} em — ${f.o === 'vao' ? 'vào học trong kỳ' : 'kết thúc học trong kỳ'}`, ids };
  }
  throw badRequest('Số này không có ở báo cáo Chi nhánh — có thể bộ lọc vừa đổi.');
}
