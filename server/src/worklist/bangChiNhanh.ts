import { db, theoLo } from '../db.ts';
import {
  COT_BANG, COT_BANG_DON_VI, METRIC_UNIT_LABEL, PERMISSIONS, soSanhLop, tachBaiId, type ChuongTrinh, type CotBang,
} from '../../../shared/domain/index.ts';
import { forbidden, badRequest } from '../util.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { latestAttempts, studentsInScope } from './danhGia.ts';
import { sauThiTheoEm } from '../loTrinh/thiThat.ts';
import { demoToday } from '../demoConfig.ts';
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
 * hàng tổng đều là tập con của nó; em mà lớp đang học không còn active nằm ở hàng "Lớp đã kết thúc" (UX-1).
 * Case mà lớp của lượt không nằm trong danh sách lớp của bảng (đã đóng) cũng ở hàng "Lớp đã kết thúc" — Σ hàng Case = hàng tổng.
 * Mỗi ô mở được danh sách qua `oBangChiNhanh`, tính lại bằng CHÍNH hàm này — số và danh sách không thể lệch.
 */
export type OBang = { n: number; mau?: number };
export type HangBang = {
  khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null;
  o: Record<CotBang, OBang>; lop?: HangBang[];
  /** OV-15h1: GVCN đang hiệu lực của lớp — chỉ hàng lớp ở chế độ "Lớp cần chú ý". */
  gvcn?: string | null;
};
type Tap = Record<CotBang, Set<number>> & { duDuLieuMau: Set<number> };
const tapRong = (): Tap => ({
  hocVien: new Set(), duoiKyVong: new Set(), sos: new Set(), caseMo: new Set(), thieuPa: new Set(), duDuLieu: new Set(), duDuLieuMau: new Set(),
  caseChuaChotHv: new Set(), caseChuaChot: new Set(),
  chuaDiem: new Set(), sos1: new Set(), sos2: new Set(), sos3: new Set(), daThiChoKq: new Set(),
});
const gop = (a: Tap, b: Tap) => { for (const k of Object.keys(a) as (keyof Tap)[]) for (const x of b[k]) a[k].add(x); };
const soCua = (t: Tap): Record<CotBang, OBang> => {
  const o = {} as Record<CotBang, OBang>;
  for (const c of COT_BANG) o[c] = { n: t[c].size };
  o.duDuLieu.mau = t.duDuLieuMau.size;
  return o;
};
const NHAN_COT: Record<CotBang, string> = {
  hocVien: 'Học viên', duoiKyVong: 'Dưới kỳ vọng', sos: 'SOS hiện tại', caseMo: 'Case đang mở', thieuPa: 'Case chưa có PA', duDuLieu: 'Tỷ lệ đủ dữ liệu',
  caseChuaChotHv: 'HV có Case chưa chốt PA', caseChuaChot: 'Case chưa chốt PA',
  chuaDiem: 'chưa điểm', sos1: 'SOS 1', sos2: 'SOS 2', sos3: 'SOS 3', daThiChoKq: 'Đã thi · chờ KQ',
};


function tinh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; chuY?: boolean }) {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW);
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
  /* OV-15d: Case chưa chốt PA — CÙNG tập ô số Tổng quan (`case-cho-xac-dinh-nguyen-nhan`); HV = em của các Case đó (một câu). */
  const chot = metricSet(p, 'case-cho-xac-dinh-nguyen-nhan', base);

  const where = [`c.status = 'active'`];
  const args: unknown[] = [];
  if (!scope.all) {
    where.push(scope.branchIds.length ? `c.branch_id IN (${scope.branchIds.map(() => '?').join(',')})` : '1=0');
    args.push(...scope.branchIds);
  }
  if (branchId) { where.push('c.branch_id = ?'); args.push(branchId); }
  where.push('c.is_fast_track = ?'); args.push(f.ct === 'ft' ? 1 : 0);
  /* OV-15h1: GVCN đang hiệu lực (cùng câu, như cột GVCN của Học viên & Lớp) — chỉ khi chú ý. */
  const today = demoToday();
  const lop = conn.prepare(
    `SELECT c.id, c.code, c.branch_id, c.is_fast_track, b.name AS branch_name${f.chuY ? `,
            (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
              WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
              ORDER BY ta.id LIMIT 1) AS gvcn` : ''} FROM classes c
       JOIN branches b ON b.id = c.branch_id WHERE ${where.join(' AND ')}`,
  ).all(...(f.chuY ? [today, today] : []), ...args) as any[];
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
  const lopCuaCase = lopCuaTap('case', [...new Set([...caseMo.ids, ...thieu.ids, ...chot.ids])]);
  for (const id of caseMo.ids) { const l = lopCuaCase.get(id)?.classId; if (l && tapLop.has(l)) tapLop.get(l)!.caseMo.add(id); }
  for (const id of thieu.ids) { const l = lopCuaCase.get(id)?.classId; if (l && tapLop.has(l)) tapLop.get(l)!.thieuPa.add(id); }
  const emCase = new Map<number, number>();
  theoLo(chot.ids, (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, student_id FROM sos_cases WHERE id IN (${ph})`).all(...lo) as any[]) emCase.set(r.id, r.student_id);
  });
  for (const id of chot.ids) {
    const l = lopCuaCase.get(id)?.classId;
    if (!l || !tapLop.has(l)) continue;
    tapLop.get(l)!.caseChuaChot.add(id);
    if (emCase.get(id)) tapLop.get(l)!.caseChuaChotHv.add(emCase.get(id)!);
  }

  const tongTap = tapRong();
  const danSo = new Set(locTheoChuongTrinh('hoc-vien', studentsInScope(p, branchId), f.ct));
  danSo.forEach((x) => tongTap.hocVien.add(x));
  sDuoi.forEach((x) => tongTap.duoiKyVong.add(x)); sSos.forEach((x) => tongTap.sos.add(x));
  caseMo.ids.forEach((x) => tongTap.caseMo.add(x)); thieu.ids.forEach((x) => tongTap.thieuPa.add(x));
  sDu.forEach((x) => tongTap.duDuLieu.add(x)); sMau.forEach((x) => tongTap.duDuLieuMau.add(x));
  chot.ids.forEach((x) => { tongTap.caseChuaChot.add(x); if (emCase.get(x)) tongTap.caseChuaChotHv.add(emCase.get(x)!); });
  if (f.chuY) chiaCotChuY(p, base, f.ct === 'ft', tapLop, tongTap, sSos, today);

  /* UX-1: phần của tập gốc không rơi vào hàng lớp nào (Case / em của lớp đã kết thúc) gom vào MỘT hàng — Σ hàng = hàng tổng. */
  const conLai = tapRong();
  for (const k of Object.keys(conLai) as (keyof Tap)[]) {
    const coHang = new Set<number>();
    for (const t of tapLop.values()) for (const x of t[k]) coHang.add(x);
    for (const x of tongTap[k]) if (!coHang.has(x)) conLai[k].add(x);
  }
  const hangConLai = Object.values(conLai).some((x) => x.size > 0)
    ? { khoa: 'ket-thuc', id: 0, loai: 'lop' as const, nhan: 'Lớp đã kết thúc', laFt: null, tap: conLai } : null;
  /* UX-1: lớp không có em và không có số nào — không hiện hàng toàn 0. */
  const lopHien = lop.filter((c) => Object.values(tapLop.get(c.id)!).some((x) => x.size > 0));

  const hangLop = (c: any) => ({ khoa: `lop:${c.id}`, id: c.id, loai: 'lop' as const, nhan: c.code, laFt: !!c.is_fast_track, tap: tapLop.get(c.id)!,
    ...(f.chuY ? { gvcn: (c.gvcn ?? null) as string | null } : {}) });
  let cheDo: 'chi-nhanh' | 'lop';
  let hang: { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null; tap: Tap; lop?: ReturnType<typeof hangLop>[] }[];
  if (branchId) {
    cheDo = 'lop';
    hang = lopHien.map(hangLop);
  } else {
    cheDo = 'chi-nhanh';
    const theoCn = new Map<number, { nhan: string; lop: ReturnType<typeof hangLop>[] }>();
    for (const c of lopHien) {
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
  /* OV-15h1 (C23): phân rã Case chưa chốt PA của hàng tổng — cùng tập `chot` (nhóm của chỉ số, đã lọc khung). */
  const phanRa = f.chuY ? Object.fromEntries(Object.entries(chot.byKind ?? {}).map(([k, v]) => [k, v.length])) : null;
  return { cheDo, hang, hangConLai, tongTap, tenChiNhanh, branchId, phanRa };
}

/** `branchId` là chi nhánh ĐÃ GIẢI (đã chọn, hoặc QL một chi nhánh được server tự khoanh) — web dùng nó cho bảng Theo giáo viên. */
export function bangChiNhanh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; chuY?: boolean }): {
  cheDo: 'chi-nhanh' | 'lop'; hang: HangBang[]; conLai: HangBang | null; tong: Record<CotBang, OBang>; tenChiNhanh: string | null; branchId: number | null;
  /** OV-15h1: chỉ ở chế độ chú ý — số Case mỗi nhóm `NHOM_CASE_CHUA_CHOT`, cộng = `tong.caseChuaChot`. */
  phanRa?: Record<string, number> | null;
} {
  const r = tinh(p, f);
  const gon = (h: any): HangBang => ({
    khoa: h.khoa, id: h.id, loai: h.loai, nhan: h.nhan, laFt: h.laFt, o: soCua(h.tap), lop: h.lop?.map(gon), ...('gvcn' in h ? { gvcn: h.gvcn } : {}),
  });
  return { cheDo: r.cheDo, hang: r.hang.map(gon), conLai: r.hangConLai && gon(r.hangConLai), tong: soCua(r.tongTap), tenChiNhanh: r.tenChiNhanh, branchId: r.branchId,
    ...(f.chuY ? { phanRa: r.phanRa } : {}) };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`, nên danh sách luôn đúng bằng con số (G-10). */
export function oBangChiNhanh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; cot: string; khoa: string;
  /** OV-15h1: ô của bảng "Lớp cần chú ý" (`chuY=1`) — cùng chế độ bảng đã vẽ, số = số dòng ở cả hai bảng. */ chuY?: boolean }):
  { n: number; unit: string; tieuDe: string; rows: MetricRow[] } {
  if (!(COT_BANG as readonly string[]).includes(f.cot)) throw badRequest(`Cột "${f.cot}" không có trong bảng.`);
  const cot = f.cot as CotBang;
  const r = tinh(p, f);
  let tap: Tap | null = null; let noi = '';
  if (f.khoa === 'tong') { tap = r.tongTap; noi = r.tenChiNhanh ? `cả ${r.tenChiNhanh}` : 'tất cả chi nhánh'; }
  if (f.khoa === 'ket-thuc' && r.hangConLai) { tap = r.hangConLai.tap; noi = r.hangConLai.nhan; }
  for (const h of r.hang) {
    if (h.khoa === f.khoa) { tap = h.tap; noi = h.nhan; }
    for (const l of h.lop ?? []) if (l.khoa === f.khoa) { tap = l.tap; noi = l.nhan; }
  }
  if (!tap) throw badRequest('Không tìm thấy hàng này trong bảng — có thể bộ lọc vừa đổi.');
  const ids = [...tap[cot]].sort((a, b) => a - b);
  const unit = COT_BANG_DON_VI[cot];
  return { n: ids.length, unit, tieuDe: `${ids.length} ${METRIC_UNIT_LABEL[unit]} — ${NHAN_COT[cot]} · ${noi}`, rows: rowsFor(unit, ids, undefined, p) };
}

/**
 * OV-15h1 — cột "Lớp cần chú ý" (mockup 3), mỗi cột là tập của một hàm sẵn có, chia về lớp như cột cũ:
 *  · Chưa điểm: HV có bài trong `bai-qua-han-nhap-diem` (= "bài trễ chấm") — theo LỚP CỦA LƯỢT (nơi nợ điểm, như Trễ chấm theo GV);
 *  · SOS 1 / 2 / 3: mức của lượt mới nhất hợp lệ — cùng `latestAttempts` của `hv-sos-hien-tai` (nhớ trong request), Σ = cột SOS;
 *  · Đã thi · chờ KQ (FT): `sauThiTheoEm` (cùng nhãn bảng lớp Học viên & Lớp, OV-14b) trên dân số của bảng.
 */
function chiaCotChuY(p: Principal, base: { branchId: number | null; program: ChuongTrinh }, ft: boolean, tapLop: Map<number, Tap>, tong: Tap, sSos: Set<number>, today: string) {
  const theoHv = (cot: CotBang, hv: Iterable<number>) => {
    const s = new Set(hv);
    for (const x of s) tong[cot].add(x);
    for (const t of tapLop.values()) for (const sid of t.hocVien) if (s.has(sid)) t[cot].add(sid);
  };
  const ev = latestAttempts(studentsInScope(p, base.branchId), 'valid', today);   // cùng lời gọi của `hvSosHienTai` → trúng bộ nhớ request
  for (const [cot, muc] of [['sos1', 1], ['sos2', 2], ['sos3', 3]] as const) {
    theoHv(cot, [...sSos].filter((sid) => Math.min(3, ev.get(sid)?.sosLevel ?? 0) === muc));
  }
  if (ft) {
    theoHv('daThiChoKq', [...sauThiTheoEm([...tong.hocVien], today)].filter(([, x]) => x.giaiDoan === 'da_thi_cho_kq').map(([sid]) => sid));
  }
  const bai = metricSet(p, 'bai-qua-han-nhap-diem', base).ids;
  theoLo([...new Set(bai.map((b) => tachBaiId(b).attemptId))], (lo, ph) => {
    for (const a of db().prepare(`SELECT student_id, class_id FROM assessment_attempts WHERE id IN (${ph})`).all(...lo) as any[]) {
      tong.chuaDiem.add(a.student_id);
      tapLop.get(a.class_id)?.chuaDiem.add(a.student_id);
    }
  });
}
