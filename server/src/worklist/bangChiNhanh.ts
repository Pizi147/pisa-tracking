import { db } from '../db.ts';
import {
  COT_BANG, COT_BANG_DON_VI, METRIC_UNIT_LABEL, PERMISSIONS, soSanhLop, type ChuongTrinh, type CotBang,
} from '../../../shared/domain/index.ts';
import { forbidden, badRequest } from '../util.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { studentsInScope } from './danhGia.ts';
import { locTheoChuongTrinh, lopCuaTap } from './chuongTrinh.ts';
import { metricSet, rowsFor, type MetricRow } from './metrics.ts';

/**
 * BẢNG "THEO CHI NHÁNH" (§3.2, mockup 02 phương án A; kiểm kê P5) — Học viên · Dưới kỳ vọng · SOS · Case mở · Thiếu PA học
 * thuật · Đủ dữ liệu đánh giá.
 *
 * KHÔNG ĐẾM LẠI. Năm tập gốc lấy từ `metricSet` (cùng hàm, cùng quyền, cùng chương trình với ô số); bảng chỉ CHIA chúng về
 * lớp: học viên theo lớp ĐANG học, Case theo LỚP CỦA LƯỢT TEST sinh ra Case (`lopCuaTap('case')` — CÙNG hàm bộ lọc khung dùng; PR-UXF-a:
 * Case từ lượt FT của em nay học lớp thường vẫn ở hàng lớp FT của lượt, nên Σ hàng = ô khung FT). Hàng tổng
 * là TẬP GỐC, không phải tổng các hàng — một em ở hai lớp có mặt ở cả hai hàng nhưng một lần ở tổng (HĐSL luật 4).
 * Học viên ở hàng tổng = DÂN SỐ của các chỉ số (`studentsInScope`, cùng bộ lọc chương trình), nên mọi cột học viên của
 * hàng tổng đều là tập con của nó; em mà lớp đang học không còn active có ở hàng tổng nhưng không ở hàng nào.
 * Case mà lớp đang học không nằm trong danh sách lớp của bảng (đã đóng, hoặc khác chương trình đang lọc) chỉ có ở hàng tổng.
 * Mỗi ô mở được danh sách qua `oBangChiNhanh`, tính lại bằng CHÍNH hàm này — số và danh sách không thể lệch.
 */
export type OBang = { n: number; mau?: number };
export type HangBang = {
  khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null;
  o: Record<CotBang, OBang>; lop?: HangBang[];
};
type Tap = Record<CotBang, Set<number>> & { duDuLieuMau: Set<number> };
const tapRong = (): Tap => ({
  hocVien: new Set(), duoiKyVong: new Set(), sos: new Set(), caseMo: new Set(), thieuPa: new Set(), duDuLieu: new Set(), duDuLieuMau: new Set(),
});
const gop = (a: Tap, b: Tap) => { for (const k of Object.keys(a) as (keyof Tap)[]) for (const x of b[k]) a[k].add(x); };
const soCua = (t: Tap): Record<CotBang, OBang> => {
  const o = {} as Record<CotBang, OBang>;
  for (const c of COT_BANG) o[c] = { n: t[c].size };
  o.duDuLieu.mau = t.duDuLieuMau.size;
  return o;
};
const NHAN_COT: Record<CotBang, string> = {
  hocVien: 'Học viên', duoiKyVong: 'Dưới kỳ vọng', sos: 'SOS', caseMo: 'Case đang mở', thieuPa: 'Thiếu PA học thuật', duDuLieu: 'Đủ dữ liệu đánh giá',
};

function tinh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Bảng này dành cho Quản lý.');
  const conn = db();
  /* Một chi nhánh: đã chọn, hoặc phạm vi chỉ có một chi nhánh (P5 "1 CN thì ưu tiên bảng lớp"). */
  const branchId = f.branchId ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  const base = { branchId, program: f.ct };
  const duoi = metricSet(p, 'hv-duoi-ky-vong-mon', base);
  const sos = metricSet(p, 'hv-sos-hien-tai', base);
  const caseMo = metricSet(p, 'case-mo', base);
  const thieu = metricSet(p, 'case-thieu-pa', base);
  const phu = metricSet(p, 'do-phu-danh-gia', base);

  const where = [`c.status = 'active'`];
  const args: unknown[] = [];
  if (!scope.all) {
    where.push(scope.branchIds.length ? `c.branch_id IN (${scope.branchIds.map(() => '?').join(',')})` : '1=0');
    args.push(...scope.branchIds);
  }
  if (branchId) { where.push('c.branch_id = ?'); args.push(branchId); }
  where.push('c.is_fast_track = ?'); args.push(f.ct === 'ft' ? 1 : 0);
  const lop = conn.prepare(
    `SELECT c.id, c.code, c.branch_id, c.is_fast_track, b.name AS branch_name FROM classes c
       JOIN branches b ON b.id = c.branch_id WHERE ${where.join(' AND ')}`,
  ).all(...args) as any[];
  lop.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));   // PR-UXF-a U1

  const tapLop = new Map<number, Tap>();
  for (const c of lop) tapLop.set(c.id, tapRong());
  if (lop.length) {
    const ph = lop.map(() => '?').join(',');
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.status = 'active' AND s.archived_at IS NULL AND e.class_id IN (${ph})`,
    ).all(...lop.map((c) => c.id)) as any[]) tapLop.get(r.class_id)!.hocVien.add(r.student_id);
  }
  const hvSet = (xs?: number[]) => new Set(xs ?? []);
  const sDuoi = hvSet(duoi.ids), sSos = hvSet(sos.ids), sDu = hvSet(phu.numeratorIds), sMau = hvSet(phu.ids);
  for (const t of tapLop.values()) {
    for (const sid of t.hocVien) {
      if (sDuoi.has(sid)) t.duoiKyVong.add(sid);
      if (sSos.has(sid)) t.sos.add(sid);
      if (sDu.has(sid)) t.duDuLieu.add(sid);
      if (sMau.has(sid)) t.duDuLieuMau.add(sid);
    }
  }
  const lopCuaCase = lopCuaTap('case', [...new Set([...caseMo.ids, ...thieu.ids])]);
  for (const id of caseMo.ids) { const l = lopCuaCase.get(id)?.classId; if (l && tapLop.has(l)) tapLop.get(l)!.caseMo.add(id); }
  for (const id of thieu.ids) { const l = lopCuaCase.get(id)?.classId; if (l && tapLop.has(l)) tapLop.get(l)!.thieuPa.add(id); }

  const tongTap = tapRong();
  const danSo = new Set(locTheoChuongTrinh('hoc-vien', studentsInScope(p, branchId), f.ct));
  danSo.forEach((x) => tongTap.hocVien.add(x));
  sDuoi.forEach((x) => tongTap.duoiKyVong.add(x)); sSos.forEach((x) => tongTap.sos.add(x));
  caseMo.ids.forEach((x) => tongTap.caseMo.add(x)); thieu.ids.forEach((x) => tongTap.thieuPa.add(x));
  sDu.forEach((x) => tongTap.duDuLieu.add(x)); sMau.forEach((x) => tongTap.duDuLieuMau.add(x));

  const hangLop = (c: any) => ({ khoa: `lop:${c.id}`, id: c.id, loai: 'lop' as const, nhan: c.code, laFt: !!c.is_fast_track, tap: tapLop.get(c.id)! });
  let cheDo: 'chi-nhanh' | 'lop';
  let hang: { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null; tap: Tap; lop?: ReturnType<typeof hangLop>[] }[];
  if (branchId) {
    cheDo = 'lop';
    hang = lop.map(hangLop);
  } else {
    cheDo = 'chi-nhanh';
    const theoCn = new Map<number, { nhan: string; lop: ReturnType<typeof hangLop>[] }>();
    for (const c of lop) {
      if (!theoCn.has(c.branch_id)) theoCn.set(c.branch_id, { nhan: c.branch_name, lop: [] });
      theoCn.get(c.branch_id)!.lop.push(hangLop(c));
    }
    hang = [...theoCn.entries()].map(([id, x]) => {
      const t = tapRong();
      for (const l of x.lop) gop(t, l.tap);
      return { khoa: `cn:${id}`, id, loai: 'chi-nhanh' as const, nhan: x.nhan, laFt: null, tap: t, lop: x.lop };
    });
  }
  const tenChiNhanh = branchId ? (lop[0]?.branch_name ?? (conn.prepare('SELECT name FROM branches WHERE id = ?').get(branchId) as any)?.name ?? null) : null;
  return { cheDo, hang, tongTap, tenChiNhanh, branchId };
}

/** `branchId` là chi nhánh ĐÃ GIẢI (đã chọn, hoặc QL một chi nhánh được server tự khoanh) — web dùng nó cho bảng Theo giáo viên. */
export function bangChiNhanh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }): {
  cheDo: 'chi-nhanh' | 'lop'; hang: HangBang[]; tong: Record<CotBang, OBang>; tenChiNhanh: string | null; branchId: number | null;
} {
  const r = tinh(p, f);
  const gon = (h: any): HangBang => ({
    khoa: h.khoa, id: h.id, loai: h.loai, nhan: h.nhan, laFt: h.laFt, o: soCua(h.tap), lop: h.lop?.map(gon),
  });
  return { cheDo: r.cheDo, hang: r.hang.map(gon), tong: soCua(r.tongTap), tenChiNhanh: r.tenChiNhanh, branchId: r.branchId };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`, nên danh sách luôn đúng bằng con số (G-10). */
export function oBangChiNhanh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; cot: string; khoa: string }):
  { n: number; unit: string; tieuDe: string; rows: MetricRow[] } {
  if (!(COT_BANG as readonly string[]).includes(f.cot)) throw badRequest(`Cột "${f.cot}" không có trong bảng.`);
  const cot = f.cot as CotBang;
  const r = tinh(p, f);
  let tap: Tap | null = null; let noi = '';
  if (f.khoa === 'tong') { tap = r.tongTap; noi = r.tenChiNhanh ? `cả ${r.tenChiNhanh}` : 'tất cả chi nhánh'; }
  for (const h of r.hang) {
    if (h.khoa === f.khoa) { tap = h.tap; noi = h.nhan; }
    for (const l of h.lop ?? []) if (l.khoa === f.khoa) { tap = l.tap; noi = l.nhan; }
  }
  if (!tap) throw badRequest('Không tìm thấy hàng này trong bảng — có thể bộ lọc vừa đổi.');
  const ids = [...tap[cot]].sort((a, b) => a - b);
  const unit = COT_BANG_DON_VI[cot];
  return { n: ids.length, unit, tieuDe: `${ids.length} ${METRIC_UNIT_LABEL[unit]} — ${NHAN_COT[cot]} · ${noi}`, rows: rowsFor(unit, ids) };
}
