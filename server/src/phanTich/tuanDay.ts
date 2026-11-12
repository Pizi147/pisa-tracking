/**
 * TUẦN DẠY (TL-GV, mockup v20 `thiet-ke/v20/ti-le-gv.html`, chủ SP duyệt #1496) — MỘT lõi đếm cho Theo GV (Phân tích / hồ sơ GV, `tuanDay`) và hộp
 * "Tuần dạy" khi bấm điểm thi thật của MỘT em (`tuanDayLoTrinh`, GET /cycles/:id/tuan-day).
 *   Khoảng: Thứ Hai tuần bắt đầu lộ trình (`started_at`) → tuần thi. Tuần em học = Thứ Hai em có ghi danh lớp FT (chỉ FT — XM-8).
 *   Mỗi tuần × kỹ năng: GV được phân công kỹ năng đó ở lớp em đang học tuần ấy (`effective_from` → `effective_to`, trống = tới ngày thi).
 *   Tuần k GV cùng phân công → mỗi người 1/k tuần (PTA chốt XM-7: % cộng đúng 100 %). Không ai → "Chưa phân công".
 *   "writing" chung (dữ liệu cũ) → cả W1 và W2.
 */
import { PERMISSIONS, docLayLai, kyNangThiLai, type DoanDay, type GvTuanDay, type KhoangTuanDay, type KnDay, type KnTuanDay, type TuanDayKq } from '../../../shared/domain/index.ts';
import { db, theoLo } from '../db.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { addDays, badRequest, notFound } from '../util.ts';
import { mondayOf } from '../platform/week.ts';
import { ghiDanhCuaEm, type GhiDanhEm } from './lopLucThi.ts';

/** Kỹ năng phân công (FT) → kỹ năng dạy. */
const KN_PC: Record<string, KnDay[]> = { listening: ['l'], reading: ['r'], writing1: ['w1'], writing2: ['w2'], writing: ['w1', 'w2'], speaking: ['s'] };
type PcLop = { user: number; kn: KnDay[]; tu: string; den: string | null };
type Ghi = { lop: number; tu: string; den: string };

/** Phân công kỹ năng ở các lớp FT (kèm tên GV) — 1 câu mỗi lô lớp. */
function phanCongLop(lops: readonly number[]): { pc: Map<number, PcLop[]>; ten: Map<number, string> } {
  const pc = new Map<number, PcLop[]>();
  const ten = new Map<number, string>();
  theoLo([...new Set(lops)], (lo, ph) => {
    for (const a of db().prepare(
      `SELECT ta.user_id, ta.class_id, ta.skill, substr(ta.effective_from, 1, 10) AS tu, substr(ta.effective_to, 1, 10) AS den, u.full_name
         FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id LEFT JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id IN (${ph}) AND c.is_fast_track = 1 AND ta.status IN ('active', 'ended') AND ta.is_core = 0 AND ta.skill IS NOT NULL`,
    ).all(...lo) as any[]) {
      const kn = KN_PC[a.skill];
      if (!kn) continue;
      (pc.get(a.class_id) ?? pc.set(a.class_id, []).get(a.class_id)!).push({ user: a.user_id, kn, tu: a.tu, den: a.den ?? null });
      ten.set(a.user_id, a.full_name ?? '');
    }
  });
  return { pc, ten };
}

/** Ghi danh của em cắt vào [tu, ngày thi]. */
const catGhi = (gd: readonly GhiDanhEm[], tu: string, ngay: string): Ghi[] =>
  gd.filter((e) => e.tu <= ngay && (e.den ?? ngay) >= tu).map((e) => ({ lop: e.lop, tu: e.tu > tu ? e.tu : tu, den: e.den && e.den < ngay ? e.den : ngay }));

const thuHai = (tu: string, den: string): string[] => {
  const ds: string[] = [];
  for (let m = mondayOf(tu), cuoi = mondayOf(den); m <= cuoi; m = addDays(m, 7)) ds.push(m);
  return ds;
};

/** Kỹ năng → Thứ Hai → GV → lớp (GV được phân công kỹ năng ở lớp em học tuần đó). */
function giaoTuan(ghi: readonly Ghi[], pc: ReadonlyMap<number, readonly PcLop[]>, ngay: string): Map<KnDay, Map<string, Map<number, number>>> {
  const out = new Map<KnDay, Map<string, Map<number, number>>>();
  for (const e of ghi) for (const a of pc.get(e.lop) ?? []) {
    const s = e.tu > a.tu ? e.tu : a.tu;
    const k = (a.den ?? ngay) < e.den ? a.den ?? ngay : e.den;
    if (s > k) continue;
    for (const kn of a.kn) {
      const theoTuan = out.get(kn) ?? out.set(kn, new Map()).get(kn)!;
      for (const m of thuHai(s, k)) (theoTuan.get(m) ?? theoTuan.set(m, new Map()).get(m)!).set(a.user, e.lop);
    }
  }
  return out;
}
/** Tuần của mỗi GV = Σ 1/k (k = số GV cùng tuần). */
function chiaTuan(theoTuan: ReadonlyMap<string, ReadonlyMap<number, number>>): Map<number, number> {
  const gv = new Map<number, number>();
  for (const ai of theoTuan.values()) for (const u of ai.keys()) gv.set(u, (gv.get(u) ?? 0) + 1 / ai.size);
  return gv;
}
const lamTron = (x: number) => Math.round(x * 100) / 100;

/** Theo GV (tab Thi thật, Phân tích GV, hồ sơ GV): mỗi lộ trình → GV × kỹ năng × tuần (chia đều tuần dạy chung). 1 câu ghi danh (nhớ chung) + 1 câu phân công. */
export function tuanDayChung(ds: readonly { kq: { studentId: number; cycleId: number; ngay: string | null }; batDau: string | null }[]): { day: Map<number, DoanDay[]>; ten: Map<number, string> } {
  const cos = ds.filter((x) => x.kq.ngay);
  const gd = ghiDanhCuaEm([...new Set(cos.map((x) => x.kq.studentId))]);
  const doan = cos.map((x) => {
    const ngay = x.kq.ngay!.slice(0, 10);
    return { x, ngay, ghi: catGhi(gd.get(x.kq.studentId) ?? [], x.batDau ?? '0000-00-00', ngay) };
  });
  const { pc, ten } = phanCongLop(doan.flatMap((d) => d.ghi.map((e) => e.lop)));
  const day = new Map<number, DoanDay[]>();
  for (const { x, ngay, ghi } of doan) {
    const ra: DoanDay[] = [];
    for (const [kn, theoTuan] of giaoTuan(ghi, pc, ngay)) for (const [userId, tuan] of chiaTuan(theoTuan)) ra.push({ userId, kn, tuan: lamTron(tuan) });
    day.set(x.kq.cycleId, ra);
  }
  return { day, ten };
}

/* ------------------------------------------------------------------ hộp Tuần dạy của MỘT em */

type CyTho = { id: number; started_at: string; thi_that_ngay: string | null };
function khoang(cy: CyTho, gd: readonly GhiDanhEm[], lopFt: ReadonlyMap<number, string>): KhoangTuanDay & { ghi: Ghi[] } {
  const ngay = String(cy.thi_that_ngay).slice(0, 10);
  const ghi = catGhi(gd, String(cy.started_at).slice(0, 10), ngay).filter((e) => lopFt.has(e.lop));
  return { cycleId: cy.id, ngayThi: ngay, tu: mondayOf(String(cy.started_at).slice(0, 10)), den: mondayOf(ngay), tong: 0, lop: [], kn: {} as Record<KnDay, KnTuanDay>, ghi };
}

/**
 * GET /cycles/:id/tuan-day — ai xem được em (`student.view`) xem được (XM-6). Một request cho cả 5 kỹ năng. Câu: lộ trình 1 · lần thi trước 0–1 ·
 * ghi danh 1 · lớp 1 · phân công 1 (+ quyền theo lớp, nhớ trong request).
 */
export function tuanDayLoTrinh(p: Principal, cycleId: number): TuanDayKq {
  const conn = db();
  /* Ngày thi: KQ thi thật; chưa nhập → ngày thi dự kiến (Không thi, dữ liệu cũ). */
  const c = conn.prepare('SELECT id, student_id, seq, route, started_at, COALESCE(thi_that_ngay, exam_date) AS thi_that_ngay, thi_that_lay_lai, thi_that_l, thi_that_r, thi_that_w, thi_that_s, outcome_score, COALESCE(thi_that_target, target_score) AS target FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  if (!c.route || !c.thi_that_ngay) throw badRequest('Lộ trình Fast Track chưa có ngày thi.');
  const ll = docLayLai(c.thi_that_lay_lai);
  const layLai = ll ? (['l', 'r', 'w', 's'] as const).filter((k) => !kyNangThiLai(ll).includes(k)) : [];
  const truoc = layLai.length ? conn.prepare(`SELECT id, started_at, thi_that_ngay FROM learning_cycles
      WHERE student_id = ? AND seq < ? AND route IS NOT NULL AND thi_that_ngay IS NOT NULL ORDER BY seq DESC LIMIT 1`).get(c.student_id, c.seq) as CyTho | undefined : undefined;
  const gd = ghiDanhCuaEm([c.student_id]).get(c.student_id) ?? [];
  const lopFt = new Map<number, string>();
  theoLo([...new Set(gd.map((e) => e.lop))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, code FROM classes WHERE id IN (${ph}) AND is_fast_track = 1`).all(...lo) as any[]) lopFt.set(r.id, r.code);
  });
  const ks = [khoang(c, gd, lopFt), ...(truoc ? [khoang(truoc, gd, lopFt)] : [])];
  const { pc, ten } = phanCongLop(ks.flatMap((k) => k.ghi.map((e) => e.lop)));
  const ra = ks.map(({ ghi, ...k }): KhoangTuanDay => {
    /* Tuần em học = Thứ Hai có ghi danh FT; lớp của tuần = lớp ghi danh muộn nhất tuần đó. */
    const lopTuan = new Map<string, number>();
    for (const e of ghi) for (const m of thuHai(e.tu, e.den)) lopTuan.set(m, e.lop);
    const theoLop = new Map<number, string[]>();
    for (const [m, l] of [...lopTuan].sort()) (theoLop.get(l) ?? theoLop.set(l, []).get(l)!).push(m);
    const giao = giaoTuan(ghi, pc, k.ngayThi);
    const kn = Object.fromEntries((['l', 'r', 'w1', 'w2', 's'] as const).map((x): [KnDay, KnTuanDay] => {
      const theoTuan = giao.get(x) ?? new Map<string, Map<number, number>>();
      const gv = [...chiaTuan(theoTuan)].map(([userId, tuan]): GvTuanDay => {
        const cua = [...theoTuan].filter(([, ai]) => ai.has(userId));
        return {
          userId, ten: ten.get(userId) ?? '', tuan: lamTron(tuan),
          lop: [...new Set(cua.map(([, ai]) => lopFt.get(ai.get(userId)!) ?? ''))],
          chung: cua.filter(([, ai]) => ai.size > 1).map(([m]) => m).sort(),
        };
      }).sort((a, b) => b.tuan - a.tuan || a.ten.localeCompare(b.ten, 'vi'));
      const trong = [...lopTuan.keys()].filter((m) => !theoTuan.get(m)?.size).sort();
      return [x, { gv, trong: trong.length ? { tuan: trong.length, tu: trong[0], lop: [...new Set(trong.map((m) => lopFt.get(lopTuan.get(m)!)!))] } : null }];
    })) as Record<KnDay, KnTuanDay>;
    return {
      ...k, tong: lopTuan.size, kn,
      lop: [...theoLop].map(([id, ms]) => ({ id, ma: lopFt.get(id)!, tu: ms[0], den: ms[ms.length - 1], tuan: ms.length })).sort((a, b) => a.tu.localeCompare(b.tu)),
    };
  });
  const lops = [...new Set(ra.flatMap((k) => k.lop.map((l) => l.id)))];
  return {
    chinh: ra[0], truoc: ra[1] ?? null, layLai,
    diem: { l: c.thi_that_l ?? null, r: c.thi_that_r ?? null, w: c.thi_that_w ?? null, s: c.thi_that_s ?? null, ovr: c.outcome_score ?? null }, target: c.target == null ? null : Number(c.target),
    phanCong: lops.filter((id) => can(p, PERMISSIONS.CLASS_ASSIGN, { classId: id })),   // XM-6: link chỉ QL / QT (GVCN phân công môn lớp thường không tính)
  };
}
