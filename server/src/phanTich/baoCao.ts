/**
 * BÁO CÁO (OV-15e, C24–C26, mockup 3 mục 3) — tab đầu của Phân tích. MỘT hàm `tinh()` giữ TẬP ID của từng số; `baoCao()` chỉ đọc `.size`,
 * `oBaoCao()` dựng dòng bằng CHÍNH tập đó (số = số dòng khi bấm). Số "tại lúc xem" (HV cần chú ý, Case / PA) đi qua chỉ số trong sổ (`metricSet`) —
 * cùng nguồn với Tổng quan; Kết quả Mock đếm bằng `mockTrongKhoang` của tab Kết quả thi.
 */
import { db, theoLo } from '../db.ts';
import {
  COT_KQ_MT, LUOT_KQ_MT, NHAN_COT_KQ_MT, NHAN_LUOT_KQ_MT, PERMISSIONS, addDaysIso, baiId, cotKqMt, khoangTruoc, luotKqMt, tachBaiId, tenMonNgan, tuanLich,
  type BaoCaoKq, type ChuongTrinh, type CotKqMt, type DongKqMt, type KetQuaMtKq, type DongMock, type DongSosBc, type GvQuaHanBc, type LuotKqMt,
} from '../../../shared/domain/index.ts';
import { badRequest } from '../util.ts';
import { t } from '../../../shared/i18n/index.ts';
import type { Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { mondayOf } from '../platform/week.ts';
import { metricSet, overdueScoreBai, rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { phamViPhanTich } from './phamVi.ts';
import { luotTrongKhoang } from './tongHop.ts';
import { ketQuaThiThatKq, mockTrongKhoang } from './ketQuaThi.ts';
import { kckCuaLuot } from '../fasttrack/attempts.ts';
import { luotTheoLoTrinh, luotTruocCoOverall } from '../fasttrack/overallLuot.ts';
import { tienBoTheoKyNang } from './giaoVien.ts';

/** `classId` (UI-TONG-QUAN): chỉ panel Đạt MT / Thi tháng này của MỘT lớp (Tổng quan › Lớp cần chú ý) — tập em theo lớp của lượt / lớp đang học. */
export type LocBaoCao = { branchId?: number | null; ct: ChuongTrinh; tu: string; den: string; classId?: number | null };

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

const THU_TU_KN = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];

/** K9: nhìn lùi tối đa ngần này tuần tìm lượt thi trước kỳ mà CHỐT (nhập xong) trong kỳ. */
const LUI_TUAN_CHOT = 12;

/**
 * ĐẠT MT (V5 `05` #1, K9, T11, T20) — đơn vị HỌC VIÊN. Mỗi em lấy lượt MT MỚI NHẤT CHỐT TRONG KỲ; ngày chốt = ngày nhập lần đầu MUỘN NHẤT trong các kỹ năng
 * có điểm của lượt (Overall chỉ có khi đủ), nên MT thi W3 AUG nhập xong W1 SEP thuộc kỳ W1 SEP. Đạt ⇔ Overall ≥ kỳ vọng của chính lượt (`ketQuaMock`).
 * Em không có lượt chốt trong kỳ mà có lượt thi trong kỳ chưa đủ Overall (hoặc KCK — không kỳ vọng) → "Chưa đủ dữ liệu", NGOÀI mẫu.
 * Tập theo em nên tổng nhiều chi nhánh / lớp = Σ tử / Σ mẫu (T20). Lượt huỷ không vào (`luotMockKhoang`).
 * shortcut: nhìn lùi `LUI_TUAN_CHOT` tuần; điểm không có `nhap_dau_ngay` (dữ liệu cũ) lấy Chủ nhật tuần thi.
 */
export function tapDatMt(p: Principal, f: LocBaoCao): { dat: Set<number>; mau: Set<number>; chuaDu: Set<number>; luot: Map<number, DongMock> } {
  const tuDau = mondayOf(f.tu), cuoi = addDaysIso(mondayOf(f.den), 6);
  const dong = mockTrongKhoang(p, { branchId: f.branchId, tu: addDaysIso(tuDau, -7 * LUI_TUAN_CHOT), den: f.den }, { boCase: true });
  const chot = new Map<number, string>();
  theoLo(dong.map((d) => d.attemptId), (lo, ph) => {
    for (const r of db().prepare(`SELECT attempt_id, MAX(nhap_dau_ngay) AS ngay, COUNT(*) - COUNT(nhap_dau_ngay) AS thieu FROM assessment_scores
        WHERE attempt_id IN (${ph}) AND band IS NOT NULL GROUP BY attempt_id`).all(...lo) as any[]) if (!r.thieu && r.ngay) chot.set(r.attempt_id, String(r.ngay).slice(0, 10));
  });
  const moiNhat = new Map<number, { d: DongMock; ngay: string }>();
  const chuaDu = new Set<number>();
  for (const d of dong) {
    if (d.ketQua === 'chua-du') { if (d.tuan >= tuDau && d.tuan <= f.den) chuaDu.add(d.studentId); continue; }
    const ngay = chot.get(d.attemptId) ?? addDaysIso(d.tuan, 6);
    if (ngay < tuDau || ngay > cuoi) continue;
    const cu = moiNhat.get(d.studentId);
    if (!cu || ngay > cu.ngay || (ngay === cu.ngay && d.mt > cu.d.mt)) moiNhat.set(d.studentId, { d, ngay });
  }
  const dat = new Set([...moiNhat].filter(([, x]) => x.d.ketQua === 'dat').map(([s]) => s));
  for (const s of moiNhat.keys()) chuaDu.delete(s);
  return { dat, mau: new Set(moiNhat.keys()), chuaDu, luot: new Map([...moiNhat].map(([s, x]) => [s, x.d])) };
}

/**
 * THI THÁNG NÀY (P4, 22/10 — thay "Thi tuần này"): HV có NGÀY THI THẬT đã chốt (`exam_date`; tháng dự kiến không tính) trong tháng của hôm nay, lớp em ĐANG HỌC
 * (ghi danh còn hiệu lực) trong phạm vi Phân tích + chi nhánh + khung đang xem. Số TẠI LÚC XEM (không theo kỳ). Lộ trình bỏ dở, HV lưu trữ không tính.
 */
export function tapThiThangNay(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; classId?: number | null }): Map<number, string> {
  return new Map([...tapThiThangNayLop(p, f)].filter(([, x]) => !f.classId || x.lop === f.classId).map(([s, x]) => [s, x.ngay]));
}

/** Như `tapThiThangNay` kèm LỚP em đang học (lớp nhỏ nhất nếu nhiều) — Tổng quan chia theo lớp / chi nhánh (UI-TONG-QUAN), cùng một câu. */
export function tapThiThangNayLop(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }): Map<number, { ngay: string; lop: number }> {
  const { cs } = phamViPhanTich(p, f.branchId ?? null, null);
  const thang = demoToday().slice(0, 7);
  const where = [cs.sql, 'c.is_fast_track = ?', `cy.exam_date BETWEEN ? AND ?`, `cy.status != 'abandoned'`, 's.archived_at IS NULL'];
  const args: unknown[] = [...cs.params, f.ct === 'ft' ? 1 : 0, `${thang}-01`, `${thang}-31`];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  const out = new Map<number, { ngay: string; lop: number }>();
  for (const r of db().prepare(
    `SELECT cy.student_id, MIN(cy.exam_date) AS ngay, MIN(c.id) AS lop FROM learning_cycles cy JOIN students s ON s.id = cy.student_id
       JOIN enrollments e ON e.student_id = cy.student_id AND e.status = 'active'   -- lớp em đang học (ghi danh còn hiệu lực)
       JOIN classes c ON c.id = e.class_id
      WHERE ${where.join(' AND ')} GROUP BY cy.student_id`).all(...args) as any[]) out.set(r.student_id, { ngay: r.ngay, lop: r.lop });
  return out;
}

type EmKqMt = { cot: CotKqMt; ovr: number | null; target: number | null; truoc: number | null; lop: string; nhan: string };

/**
 * KẾT QUẢ MT (SV-SO3, `10` mục 5) — hàng → em → kết quả. MT: lượt MT0 (lớp thường hoặc FT) / MT lớp FT có tuần thi trong kỳ, đã có ít nhất một band
 * (CHÍNH `mockTrongKhoang` của tab Kết quả thi), mỗi em lấy lượt mới nhất của hàng (MT3+ gộp MT3 trở đi); Target = Target lúc thi của lượt.
 * Thi thật: CHÍNH dòng `ketQuaThiThatKq` (đủ 4 kỹ năng, ngày thi trong kỳ; "Không thi" không vào); Đạt Target = `outcome` lúc nhập. Em KCK không vào.
 * Lượt trước: lượt có Overall số MT nhỏ hơn gần nhất trong cùng lộ trình (Thi thật: MT cuối có Overall).
 * Số câu cố định theo lô: lượt trong kỳ (1) + chấm + Thi thật (không hỏi quyền từng em) + Target lộ trình (1) + `luotTheoLoTrinh` (1 + `loadBundle` nhớ theo lượt).
 */
export function tapKqMt(p: Principal, f: LocBaoCao): Map<LuotKqMt, Map<number, EmKqMt>> {
  const { cs } = phamViPhanTich(p, f.branchId ?? null, null);
  const where = [cs.sql, `a.status != 'cancelled'`, `(a.kind = 'mt0' OR (a.kind = 'mock' AND c.is_fast_track = 1))`, 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const args: unknown[] = [...cs.params, mondayOf(f.tu), mondayOf(f.den)];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  const luot = luotTrongKhoang(where.join(' AND '), args);
  const thi = new Map<number, ReturnType<typeof ketQuaThiThatKq>['rows'][number]>();
  for (const r of ketQuaThiThatKq(p, { branchId: f.branchId, tu: mondayOf(f.tu), den: addDaysIso(mondayOf(f.den), 6) }, { boQuyen: true }).rows) {
    if (!r.khongThi && (!thi.has(r.studentId) || (r.ngayThi ?? '') > (thi.get(r.studentId)!.ngayThi ?? ''))) thi.set(r.studentId, r);
  }
  const conn = db();
  const loTrinh = new Map<number, { target: number | null; kck: boolean }>();
  theoLo([...thi.values()].map((r) => r.cycleId), (lo, ph) => {
    for (const c of conn.prepare(`SELECT id, target_score, khong_cam_ket FROM learning_cycles WHERE id IN (${ph})`).all(...lo) as any[]) {
      loTrinh.set(c.id, { target: c.target_score ?? null, kck: !!c.khong_cam_ket });
    }
  });
  for (const [s, r] of thi) if (loTrinh.get(r.cycleId)?.kck) thi.delete(s);

  const cua = new Map(luot.map((a) => [a.id as number, a]));
  const chon = new Map<LuotKqMt, Map<number, DongMock>>(LUOT_KQ_MT.map((l) => [l, new Map()]));
  for (const d of mockTrongKhoang(p, f, { luot, boCase: true })) {
    if (kckCuaLuot(cua.get(d.attemptId))) continue;
    const m = chon.get(luotKqMt(d.mt))!;
    const cu = m.get(d.studentId);
    if (!cu || d.mt > cu.mt || (d.mt === cu.mt && d.tuan > cu.tuan)) m.set(d.studentId, d);
  }
  /* "So lượt trước" — CÙNG hàm Xu hướng của hàng HV (`luotTruocCoOverall`). */
  const cycleCua = (d: DongMock) => cua.get(d.attemptId)!.cycle_id as number | null;
  const theoCy = luotTheoLoTrinh([...[...chon.values()].flatMap((m) => [...m.values()].map(cycleCua)), ...[...thi.values()].map((r) => r.cycleId)]
    .filter((x): x is number => x !== null));
  const truoc = (c: number | null, mt: number): number | null => (c === null ? null : luotTruocCoOverall(theoCy.get(c), mt)?.ovr ?? null);

  const out = new Map<LuotKqMt, Map<number, EmKqMt>>();
  for (const [l, m] of chon) {
    out.set(l, new Map([...m].map(([s, d]) => {
      const tg = cua.get(d.attemptId)!.target_at_attempt;
      const target = tg === null || tg === undefined ? null : Number(tg);
      return [s, { cot: cotKqMt(d.ovr, target), ovr: d.ovr, target, truoc: d.ovr === null ? null : truoc(cycleCua(d), d.mt), lop: d.lop, nhan: `MT${d.mt} · ${tuanLich(d.tuan)}` }];
    })));
  }
  out.set('thi', new Map([...thi].map(([s, r]) => {
    const target = loTrinh.get(r.cycleId)?.target ?? null;
    const ngay = r.ngayThi ? `${r.ngayThi.slice(8, 10)}/${r.ngayThi.slice(5, 7)}` : '';
    /* Đạt Target = kết luận lúc nhập (`outcome`, như tab Kết quả thi) — không so lại Target hiện tại; chưa đạt thì khoảng thiếu theo Target lộ trình. */
    const theoTarget = cotKqMt(r.ovr, target);
    const cot: CotKqMt = r.dat === true ? 'dat' : r.dat === false ? (theoTarget === 'dat' ? 'thieu-0.5' : theoTarget) : 'chua-du';
    return [s, { cot, ovr: r.ovr, target, truoc: r.ovr === null ? null : truoc(r.cycleId, Infinity), lop: r.lop ?? '', nhan: t('thi {ngay}', { ngay }) }];
  })));
  return out;
}

/** `GET /phan-tich/bao-cao/ket-qua-mt` — bảng Kết quả MT (đường riêng: Báo cáo giữ trần câu SQL của nó; web tải song song). Chỉ Fast Track. */
export function ketQuaMt(p: Principal, f: LocBaoCao): KetQuaMtKq {
  phamViPhanTich(p, f.branchId ?? null, null);   // không quyền → 403 trước 400
  if (f.ct !== 'ft') throw badRequest('Kết quả MT chỉ có ở Fast Track.');
  const k = tapKqMt(p, f);
  return { tu: f.tu, den: f.den, rows: LUOT_KQ_MT.map((l) => dongKqMt(l, k.get(l)!)) };
}

const dongKqMt = (l: LuotKqMt, m: Map<number, EmKqMt>): DongKqMt => {
  const em = [...m.values()];
  const coTruoc = em.filter((e) => e.ovr !== null && e.truoc !== null);
  return {
    luot: l, hv: em.length, mau: em.filter((e) => e.cot !== 'chua-du').length,
    dem: Object.fromEntries(COT_KQ_MT.map((c) => [c, em.filter((e) => e.cot === c).length])) as DongKqMt['dem'],
    soTruoc: { tang: coTruoc.filter((e) => e.ovr! > e.truoc!).length, bang: coTruoc.filter((e) => e.ovr === e.truoc).length, giam: coTruoc.filter((e) => e.ovr! < e.truoc!).length },
  };
};

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
    datMt: ft ? (() => { const d = tapDatMt(p, f); return { dat: d.dat.size, mau: d.mau.size, chuaDu: d.chuaDu.size }; })() : null,
    chuY: {
      /* SL2 (9.1-4, X-23): "SOS hiện tại" — CÙNG chỉ số Tổng quan · Đang SOS, số hôm nay (không theo kỳ). */
      sosHienTai: metricSet(p, 'hv-sos-hien-tai', loc).n,
      thiThangNay: tapThiThangNay(p, f).size,
      chuaDiemHv: hvBai.size, chuaDiemBai: chuaDiem.length, caseChuaChotHv: hvCase.size, caseChuaChot: caseChua.length,
    },
    casePa: {
      caseMo: metricSet(p, 'case-mo', loc).n,
      ...(({ n, numeratorIds }) => ({ paKetQua: n, paCaiThien: numeratorIds?.length ?? 0 }))(metricSet(p, 'pa-co-ket-qua', { ...loc, from: f.tu, to: f.den })),
      quaHanChotPa: metricSet(p, 'case-xac-dinh-nguyen-nhan-qua-han', loc).n,
      quaHanKetQuaPa: metricSet(p, 'pa-can-cap-nhat', loc).n,
    },
    tienBo: ft && f.branchId ? [...tienBoTheoKyNang(p, f.branchId, f)].map(([skill, x]) => ({ skill, dung: x.dung.length, tong: x.tong.length, ngoai: x.ngoai.length }))
      .sort((a, b) => THU_TU_KN.indexOf(a.skill) - THU_TU_KN.indexOf(b.skill)) : null,
  };
}

/**
 * Danh sách của MỘT số trong kỳ — `o`: `hv-da-thi` · `bai-da-cham` · `bai-qua-han` · `gv:<id>` (0 = chưa phân công) · `sos:<lớp | tong>:<1|2|3>`.
 * Tính lại bằng chính `tinh()` nên số = số dòng.
 */
export function oBaoCao(p: Principal, f: LocBaoCao & { o: string }): { n: number; tieuDe: string; rows: MetricRow[] } {
  const kq = /^kq-mt:(mt0|mt1|mt2|mt3\+|thi):(dat|thieu-0\.5|thieu-1\.0|thieu-1\.5|chua-du)$/.exec(f.o);
  if (kq) {
    /* Panel chỉ đọc Kết quả MT (C22): em của ô — lớp · lượt · Overall · Target · so lượt trước. */
    phamViPhanTich(p, f.branchId ?? null, null);   // không quyền → 403 trước 400
    if (f.ct !== 'ft') throw badRequest('Kết quả MT chỉ có ở Fast Track.');
    const l = kq[1] as LuotKqMt, cot = kq[2] as CotKqMt;
    const em = tapKqMt(p, f).get(l)!;
    const ids = [...em].filter(([, e]) => e.cot === cot).map(([s]) => s).sort((a, b) => a - b);
    const so = (x: number) => x.toFixed(1);
    const rows = rowsFor('hoc-vien', ids, undefined, p).map((row) => {
      const e = em.get(row.id)!;
      const lech = e.ovr !== null && e.truoc !== null ? e.ovr - e.truoc : null;
      return { ...row, sub: [e.lop, e.nhan, e.ovr === null ? t('chưa đủ điểm') : `Overall ${so(e.ovr)}`, e.target === null ? null : `Target ${so(e.target)}`,
        lech === null ? null : t('so lượt trước {d}', { d: lech > 0 ? `+${so(lech)}` : lech < 0 ? `−${so(-lech)}` : '=' })].filter(Boolean).join(' · ') };
    });
    return { n: ids.length, tieuDe: `${NHAN_LUOT_KQ_MT[l]} · ${NHAN_COT_KQ_MT[cot]} = ${ids.length} HV`, rows };
  }
  const r = tinh(p, f);
  const ra = (donVi: 'hoc-vien' | 'bai', ids: Iterable<number>, tieuDe: string) => {
    const ds = [...new Set(ids)].sort((a, b) => a - b);
    return { n: ds.length, tieuDe: `${ds.length} ${donVi === 'bai' ? 'bài' : 'HV'} — ${tieuDe}`, rows: rowsFor(donVi, ds, undefined, p) };
  };
  if (f.o === 'dat-mt' || f.o === 'dat-mt-chua-du') {
    /* Panel chỉ đọc Đạt MT (05 mục 4): mẫu — chưa đạt trước, dòng phụ lớp · lượt · tuần thi · Overall · kỳ vọng · kết quả; "Chưa đủ dữ liệu" là tập riêng. */
    if (f.ct !== 'ft') throw badRequest('Đạt MT chỉ có ở Fast Track.');
    const d0 = tapDatMt(p, f);
    const cuaLop = (s: number) => !f.classId || d0.luot.get(s)?.classId === f.classId;
    const d = f.classId ? { ...d0, mau: new Set([...d0.mau].filter(cuaLop)), dat: new Set([...d0.dat].filter(cuaLop)) } : d0;
    if (f.o === 'dat-mt-chua-du') return ra('hoc-vien', d.chuaDu, t('chưa đủ dữ liệu (ngoài mẫu Đạt MT)'));
    const ids = [...d.mau].sort((a, b) => Number(d.dat.has(a)) - Number(d.dat.has(b)) || a - b);
    const rows = rowsFor('hoc-vien', ids, undefined, p).map((row) => {
      const x = d.luot.get(row.id)!;
      return { ...row, sub: [x.lop, `MT${x.mt} · ${tuanLich(x.tuan)}`, `Overall ${x.ovr!.toFixed(1)}`, t('kỳ vọng {kv}', { kv: x.kyVong!.toFixed(1) }), d.dat.has(row.id) ? t('Đạt') : t('Chưa đạt')].join(' · ') };
    });
    return { n: ids.length, tieuDe: t('Đạt MT · {pt} % = {dat}/{mau} HV', { pt: d.mau.size ? Math.round((100 * d.dat.size) / d.mau.size) : 0, dat: d.dat.size, mau: d.mau.size }), rows };
  }
  if (f.o === 'thi-thang-nay') {
    const tap = tapThiThangNay(p, f);
    const ids = [...tap.keys()].sort((a, b) => tap.get(a)!.localeCompare(tap.get(b)!) || a - b);
    const rows = rowsFor('hoc-vien', ids, undefined, p).map((row) => ({ ...row, sub: [row.sub, t('thi {ngay}', { ngay: `${tap.get(row.id)!.slice(8, 10)}/${tap.get(row.id)!.slice(5, 7)}` })].filter(Boolean).join(' · ') }));
    return { n: ids.length, tieuDe: t('{n} HV — thi tháng này', { n: ids.length }), rows };
  }
  const tb = /^tien-bo:(\w+)$/.exec(f.o);
  if (tb) {
    /* Panel chỉ đọc Tiến bộ theo kỹ năng: mục của kỹ năng (bài), chưa tăng trước — cùng tập với số. */
    if (f.ct !== 'ft' || !f.branchId) throw badRequest('Tiến bộ theo kỹ năng cần Fast Track và một chi nhánh.');
    phamViPhanTich(p, f.branchId, null);
    const x = tienBoTheoKyNang(p, f.branchId, f).get(tb[1]);
    const dung = new Set(x?.dung ?? []);
    const ids = [...(x?.tong ?? [])].sort((a, b) => Number(dung.has(a)) - Number(dung.has(b)) || a - b);
    const rows = rowsFor('bai', ids, undefined, p).map((row) => ({ ...row, sub: [row.sub, dung.has(row.id) ? t('Tăng') : t('Không tăng')].filter(Boolean).join(' · ') }));
    return { n: ids.length, tieuDe: t('Tiến bộ {kn} · {dung}/{tong}', { kn: tenMonNgan(null, tb[1]), dung: dung.size, tong: ids.length }), rows };
  }
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
