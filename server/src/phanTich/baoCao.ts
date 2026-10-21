/**
 * BÁO CÁO (OV-15e, C24–C26, mockup 3 mục 3) — tab đầu của Phân tích. MỘT hàm `tinh()` giữ TẬP ID của từng số; `baoCao()` chỉ đọc `.size`,
 * `oBaoCao()` dựng dòng bằng CHÍNH tập đó (số = số dòng khi bấm). Số "tại lúc xem" (HV cần chú ý, Case / PA) đi qua chỉ số trong sổ (`metricSet`) —
 * cùng nguồn với Tổng quan; Kết quả Mock đếm bằng `mockTrongKhoang` của tab Kết quả thi.
 */
import { db, theoLo } from '../db.ts';
import {
  PERMISSIONS, baiId, khoangTruoc, tachBaiId, tenMonNgan,
  type BaoCaoKq, type ChuongTrinh, type DongMock, type DongSosBc, type GvQuaHanBc,
} from '../../../shared/domain/index.ts';
import { badRequest } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { mondayOf } from '../platform/week.ts';
import { metricSet, overdueScoreBai, rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { phamViPhanTich } from './phamVi.ts';
import { luotTrongKhoang } from './tongHop.ts';
import { mockTrongKhoang } from './ketQuaThi.ts';

export type LocBaoCao = { branchId?: number | null; ct: ChuongTrinh; tu: string; den: string };

const LOAI_LUOT: Record<ChuongTrinh, string> = { ft: `a.kind = 'mock'`, thuong: `a.kind IN ('progress', 'final', 'checkpoint')` };

/** Lượt của khung trong khoảng (theo tuần thi của lượt), trong phạm vi Phân tích. */
function luotKhoang(p: Principal, f: LocBaoCao, tu: string, den: string) {
  const { cs } = phamViPhanTich(p, f.branchId ?? null, null);
  const where = [cs.sql, `a.status != 'cancelled'`, LOAI_LUOT[f.ct], 'c.is_fast_track = ?', 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const args: unknown[] = [...cs.params, f.ct === 'ft' ? 1 : 0, mondayOf(tu), mondayOf(den)];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  return luotTrongKhoang(where.join(' AND '), args);
}

type SosLop = { lop: string; muc: Map<number, number>; chot: Set<number> };
/**
 * HV có SOS TRONG KỲ theo lớp: lớp → em → mức cao nhất của em trong khoảng ở lớp đó. SL2 (a7 dòng 8, 9.2-28): đếm từ CHÍNH dòng tab Kết quả thi
 * (`mockTrongKhoang`, gồm SOS tạm) — hai nơi một luật; `chot` = em có ít nhất một lượt SOS đã chốt (còn lại là "tạm").
 */
function sosTheoLop(dong: DongMock[]): Map<number, SosLop> {
  const out = new Map<number, SosLop>();
  for (const a of dong) {
    if (!a.sos) continue;
    const l = out.get(a.classId) ?? out.set(a.classId, { lop: a.lop || `#${a.classId}`, muc: new Map(), chot: new Set() }).get(a.classId)!;
    l.muc.set(a.studentId, Math.max(l.muc.get(a.studentId) ?? 0, Math.min(3, a.sos)));
    if (!a.sosTam) l.chot.add(a.studentId);
  }
  return out;
}

function tinh(p: Principal, f: LocBaoCao) {
  const homNay = demoToday();
  const conn = db();
  const luot = luotKhoang(p, f, f.tu, f.den);
  const ids = luot.map((a) => a.id as number);
  const cua = new Map(luot.map((a) => [a.id as number, a]));

  /* Bài đã chấm = ô có điểm của lượt trong khoảng; bài quá hạn = CHÍNH tập "Trễ chấm" của Tổng quan (`overdueScoreBai`) giới hạn ở lượt trong khoảng. */
  const daCham = new Set<number>();
  theoLo(ids, (lo, ph) => {
    for (const r of conn.prepare(`SELECT attempt_id, skill FROM assessment_scores WHERE attempt_id IN (${ph}) AND (band IS NOT NULL OR raw_score IS NOT NULL)`).all(...lo) as any[]) {
      try { daCham.add(baiId(r.attempt_id, r.skill)); } catch { /* kỹ năng ngoài bộ ô điểm (dữ liệu cũ) — không phải một bài */ }
    }
  });
  const hvDaThi = new Set([...daCham].map((b) => cua.get(tachBaiId(b).attemptId)!.student_id as number));
  const coDiem = new Set([...daCham].map((b) => tachBaiId(b).attemptId));
  const luotLop = new Set(luot.filter((a) => coDiem.has(a.id)).map((a) => `${a.class_id}|${a.week_start}`));
  const tre = overdueScoreBai(p, f.branchId ?? null, homNay);
  const quaHan = tre.ids.filter((b) => cua.has(tachBaiId(b).attemptId));
  const theoGv = new Map<number, number[]>();
  for (const b of quaHan) {
    const ct = tre.chiTiet.get(b);
    for (const gv of ct?.nguoi.length ? ct.nguoi : [ct?.chamCheo ? -1 : 0]) theoGv.set(gv, [...(theoGv.get(gv) ?? []), b]);
  }

  /* Cùng hàm chấm của tab Kết quả thi, trên chính các lượt đã nạp (lượt có điểm) — không đọc lại, không nạp Case. SOS theo lớp (FT): kỳ này + kỳ trước. */
  const mk = f.ct === 'ft' ? mockTrongKhoang(p, { branchId: f.branchId, tu: f.tu, den: f.den }, { luot: luot.filter((a) => coDiem.has(a.id)), boCase: true }) : null;
  const sos = mk ? sosTheoLop(mk) : null;
  const truoc = mk ? (() => { const k = khoangTruoc(f); return sosTheoLop(mockTrongKhoang(p, { branchId: f.branchId, tu: k.tu, den: k.den }, { boCase: true })); })() : null;

  return { homNay, luot, cua, daCham, coDiem, hvDaThi, luotLop, quaHan, theoGv, mk, sos, truoc };
}

const dongSos = (classId: number, lop: string, nay: SosLop | undefined, truoc: Map<number, number> | undefined): DongSosBc => {
  const m = [...(nay?.muc.values() ?? [])];
  return { classId, lop, sos1: m.filter((x) => x === 1).length, sos2: m.filter((x) => x === 2).length, sos3: m.filter((x) => x === 3).length, nay: m.length,
    tam: [...(nay?.muc.keys() ?? [])].filter((s) => !nay!.chot.has(s)).length, truoc: truoc?.size ?? 0 };
};
const gop = (ds: Map<number, SosLop>): SosLop => {
  const all: SosLop = { lop: '', muc: new Map(), chot: new Set() };
  for (const l of ds.values()) {
    for (const [s, m] of l.muc) all.muc.set(s, Math.max(all.muc.get(s) ?? 0, m));
    for (const s of l.chot) all.chot.add(s);
  }
  return all;
};

export function baoCao(p: Principal, f: LocBaoCao): BaoCaoKq {
  const r = tinh(p, f);
  const ft = f.ct === 'ft';
  const conn = db();
  const ten = new Map<number, string>();
  theoLo([...r.theoGv.keys()].filter((x) => x > 0), (lo, ph) => {
    for (const u of conn.prepare(`SELECT id, full_name FROM users WHERE id IN (${ph})`).all(...lo) as any[]) ten.set(u.id, u.full_name);
  });
  const gvQuaHan: GvQuaHanBc[] = [...r.theoGv].map(([gv, bai]) => ({
    khoa: gv, gvId: gv > 0 ? gv : null, ten: gv > 0 ? ten.get(gv) ?? `#${gv}` : gv < 0 ? 'Speaking chấm chéo' : 'Chưa phân công', bai: bai.length,
    kyNang: [...new Set(bai.map((b) => { const x = tachBaiId(b); return tenMonNgan(r.cua.get(x.attemptId)?.programme_code ?? null, x.skill); }))],
    lop: [...new Set(bai.map((b) => r.cua.get(tachBaiId(b).attemptId)?.class_code as string))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })),
  })).sort((a, b) => b.bai - a.bai || a.ten.localeCompare(b.ten, 'vi'));

  let sos: BaoCaoKq['sos'] = null;
  if (ft && r.sos && r.truoc) {
    const lop = new Set([...r.sos.keys(), ...r.truoc.keys()]);
    const hang = [...lop].map((id) => dongSos(id, r.sos!.get(id)?.lop ?? r.truoc!.get(id)!.lop, r.sos!.get(id), r.truoc!.get(id)?.muc))
      .sort((a, b) => b.nay - a.nay || a.lop.localeCompare(b.lop, 'vi', { numeric: true }));
    sos = { hang, tong: dongSos(0, '', gop(r.sos), gop(r.truoc).muc) };
  }
  const mk = r.mk;

  /* Tại lúc xem — chỉ số trong sổ, cùng phạm vi Tổng quan (chi nhánh + khung). */
  const loc = { branchId: f.branchId ?? null, program: f.ct };
  const chuaDiem = metricSet(p, 'bai-qua-han-nhap-diem', loc).ids;
  const caseChua = metricSet(p, 'case-cho-xac-dinh-nguyen-nhan', loc).ids;
  const hvBai = new Set<number>();
  theoLo([...new Set(chuaDiem.map((b) => tachBaiId(b).attemptId))], (lo, ph) => {
    for (const x of conn.prepare(`SELECT student_id FROM assessment_attempts WHERE id IN (${ph})`).all(...lo) as any[]) hvBai.add(x.student_id);
  });
  const hvCase = new Set<number>();
  theoLo(caseChua, (lo, ph) => {
    for (const x of conn.prepare(`SELECT student_id FROM sos_cases WHERE id IN (${ph})`).all(...lo) as any[]) if (x.student_id) hvCase.add(x.student_id);
  });

  return {
    tu: f.tu, den: f.den, ct: f.ct, homNay: r.homNay,
    test: { hvDaThi: r.hvDaThi.size, luotLop: r.luotLop.size, baiDaCham: r.daCham.size, baiTong: r.daCham.size + r.quaHan.length, quaHan: r.quaHan.length, gvQuaHan },
    sos,
    mock: mk ? { dat: mk.filter((x) => x.ketQua === 'dat').length, chuaDat: mk.filter((x) => x.ketQua === 'chua-dat').length, chuaDu: mk.filter((x) => x.ketQua === 'chua-du').length } : null,
    chuY: {
      chuaLich: ft ? metricSet(p, 'hv-ft-xong-mt-cuoi-chua-mt-ke', loc).n : null,
      /* SL2 (9.1-4, X-23): "SOS hiện tại" — CÙNG chỉ số Tổng quan · Đang SOS, số hôm nay (không theo kỳ). */
      sosHienTai: metricSet(p, 'hv-sos-hien-tai', loc).n,
      chuaDiemHv: hvBai.size, chuaDiemBai: chuaDiem.length, caseChuaChotHv: hvCase.size, caseChuaChot: caseChua.length,
    },
    casePa: {
      caseMo: metricSet(p, 'case-mo', loc).n,
      paKetQua: metricSet(p, 'pa-co-ket-qua', { ...loc, from: f.tu, to: f.den }).n,
      quaHanChotPa: metricSet(p, 'case-xac-dinh-nguyen-nhan-qua-han', loc).n,
      quaHanKetQuaPa: metricSet(p, 'pa-can-cap-nhat', loc).n,
    },
  };
}

/**
 * Danh sách của MỘT số trong kỳ — `o`: `hv-da-thi` · `bai-da-cham` · `bai-qua-han` · `gv:<id>` (0 = chưa phân công) · `sos:<lớp | tong>:<1|2|3>`.
 * Tính lại bằng chính `tinh()` nên số = số dòng.
 */
export function oBaoCao(p: Principal, f: LocBaoCao & { o: string }): { n: number; tieuDe: string; rows: MetricRow[] } {
  const r = tinh(p, f);
  const ra = (donVi: 'hoc-vien' | 'bai', ids: Iterable<number>, tieuDe: string) => {
    const ds = [...new Set(ids)].sort((a, b) => a - b);
    return { n: ds.length, tieuDe: `${ds.length} ${donVi === 'bai' ? 'bài' : 'HV'} — ${tieuDe}`, rows: rowsFor(donVi, ds, undefined, p) };
  };
  if (f.o === 'hv-da-thi') return ra('hoc-vien', r.hvDaThi, 'đã làm bài');
  if (f.o === 'bai-da-cham') return ra('bai', r.daCham, 'đã chấm');
  if (f.o === 'bai-qua-han') return ra('bai', r.quaHan, 'quá hạn chấm');
  const gv = /^gv:(-?\d+)$/.exec(f.o);
  if (gv) return ra('bai', r.theoGv.get(Number(gv[1])) ?? [], 'quá hạn chấm');
  const s = /^sos:(\d+|tong):([123])$/.exec(f.o);
  if (s && r.sos) {
    const muc = Number(s[2]);
    const tap = s[1] === 'tong' ? gop(r.sos).muc : r.sos.get(Number(s[1]))?.muc ?? new Map<number, number>();
    return ra('hoc-vien', [...tap].filter(([, m]) => m === muc).map(([id]) => id), `SOS ${muc}`);
  }
  throw badRequest('Số này không có trong Báo cáo — có thể bộ lọc vừa đổi.');
}
