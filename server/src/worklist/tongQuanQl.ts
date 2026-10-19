/**
 * TỔNG QUAN QUẢN LÝ — phương án A (OV-15d, mockup 3 mục 1; C02, C23, Q5, Q6a). File này KHÔNG có luật đếm mới: mọi tập lấy từ chỉ số trong sổ
 * (`metricSet` — cùng Báo cáo › HV cần chú ý, panel số liệu), chỉ CHIA về lớp / tuần / GV. MỘT hàm `tinh()` giữ tập ID; `tongQuanQlA()` đọc
 * `.size`, `oTongQuanQlA()` dựng dòng panel bằng CHÍNH tập đó — số trên trang = số dòng khi bấm.
 *   · Dải tóm tắt "HV cần chú ý": chưa lịch Test · chưa điểm · Case chưa chốt PA (HV · Case, ⚠ quá hạn) · bài trễ chấm · số GV.
 *   · Lớp cần chú ý: HV · Chưa lịch · Chưa điểm · SOS 1/2/3 · Case chưa chốt PA (HV / Case) · Đã thi · chờ KQ; hàng tổng là TẬP GỐC.
 *   · Tuần này: 2 tuần trước · tuần này · 2 tuần tới (lượt theo tuần thi của lượt), bảng Test tuần này, Trễ chấm theo GV.
 * "Cần bạn quyết" (`canBanQuyet`) gộp hai khung: Case chưa chốt PA quá hạn · Chọn bước tiếp sau thi · Chốt lộ trình (chỉ khi có).
 */
import { db, theoLo } from '../db.ts';
import {
  ATTEMPT_KIND_SHORT, COT_LOP_QL, PERMISSIONS, chuViecChotLoTrinh, soSanhLop, tachBaiId, tenMonNgan,
  type AttemptKind, type CanBanQuyet, type ChuongTrinh, type CotLopQl, type GvTreQl, type HangLopQl, type TongQuanQlA, type TuanQl,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, forbidden } from '../util.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { metricSet, phamViNoDiem, rowsFor, type MetricRow } from './metrics.ts';
import { lopCuaTap } from './chuongTrinh.ts';
import { phamViXemViec } from './xemViec.ts';
import { latestAttempts } from './danhGia.ts';
import { scoreDebtCells } from './scoreDebt.ts';
import { phamViPhanTich } from '../phanTich/phamVi.ts';
import { luotTrongKhoang } from '../phanTich/tongHop.ts';
import { sauThiTheoEm } from '../loTrinh/thiThat.ts';
import { viecBuocTiep } from '../loTrinh/buocTiep.ts';
import { lopChoChotLoTrinh } from '../classes/lenhChuyen.ts';

/** Việc của Quản lý (xem việc người khác, `phamViXemViec` = 'het') — như Cần xử lý cũ (OV-11f TQ-9). */
function laViecQuanLy(p: Principal) {
  if (scopeFor(p, PERMISSIONS.ANALYSIS_VIEW).none || phamViXemViec(p) !== 'het') throw forbidden('Khối này dành cho Quản lý.');
}

type TapLop = Record<CotLopQl, Set<number>>;
const tapRong = (): TapLop => Object.fromEntries(COT_LOP_QL.map((c) => [c, new Set<number>()])) as TapLop;
const NGAY_MS = 86_400_000;
const soNgay = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / NGAY_MS);

function tinh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  laViecQuanLy(p);
  const today = demoToday();
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW);
  /* Một chi nhánh: đã chọn, hoặc phạm vi chỉ có một chi nhánh (như bảng chi nhánh cũ). */
  const branchId = f.branchId ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  const ft = f.ct === 'ft';
  const loc = { branchId, program: f.ct };
  const { cs } = phamViPhanTich(p, branchId, null);

  /* Lớp đang mở của khung + GVCN đang hiệu lực + HV đang học (một câu mỗi thứ). */
  const lop = conn.prepare(
    `SELECT c.id, c.code, c.branch_id, b.name AS branch_name,
            (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
              WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
              ORDER BY ta.id LIMIT 1) AS gvcn
       FROM classes c JOIN branches b ON b.id = c.branch_id
      WHERE c.status = 'active' AND c.is_fast_track = ? AND ${cs.sql}${branchId ? ' AND c.branch_id = ?' : ''}`,
  ).all(today, today, ft ? 1 : 0, ...cs.params, ...(branchId ? [branchId] : [])) as any[];
  lop.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));
  const tapLop = new Map<number, TapLop>(lop.map((c) => [c.id as number, tapRong()]));
  const lopCuaHv = new Map<number, number[]>();
  theoLo(lop.map((c) => c.id as number), (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.status = 'active' AND s.archived_at IS NULL AND e.class_id IN (${ph})`,
    ).all(...lo) as any[]) {
      tapLop.get(r.class_id)!.hv.add(r.student_id);
      (lopCuaHv.get(r.student_id) ?? lopCuaHv.set(r.student_id, []).get(r.student_id)!).push(r.class_id);
    }
  });
  const tong = tapRong();
  const vaoLop = (cot: CotLopQl, hv: number, id = hv) => {
    tong[cot].add(id);
    for (const l of lopCuaHv.get(hv) ?? []) tapLop.get(l)![cot].add(id);
  };
  for (const hv of lopCuaHv.keys()) tong.hv.add(hv);

  /* Chưa lịch Test (FT): em xong MT cuối, chưa có MT kế / ngày thi — chỉ số của Cần xử lý cũ, Báo cáo. */
  const chuaLich = ft ? metricSet(p, 'hv-ft-xong-mt-cuoi-chua-mt-ke', loc).ids : [];
  for (const hv of chuaLich) vaoLop('chuaLich', hv);

  /* Bài trễ chấm (= "Chưa điểm" theo HV, Trễ chấm theo GV): `bai-qua-han-nhap-diem`. Lớp của bài = lớp của lượt. */
  const bai = metricSet(p, 'bai-qua-han-nhap-diem', loc);
  const luot = new Map<number, any>();
  theoLo([...new Set(bai.ids.map((b) => tachBaiId(b).attemptId))], (lo, ph) => {
    for (const a of conn.prepare(
      `SELECT a.id, a.student_id, a.class_id, a.kind, a.attempt_no, c.code AS class_code, c.programme_code, rp.week_start
         FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.id IN (${ph})`,
    ).all(...lo) as any[]) luot.set(a.id, a);
  });
  const hvChuaDiem = new Set<number>();
  for (const b of bai.ids) {
    const a = luot.get(tachBaiId(b).attemptId);
    if (!a) continue;
    hvChuaDiem.add(a.student_id);
    tong.chuaDiem.add(a.student_id);
    if (a.class_id && tapLop.has(a.class_id)) tapLop.get(a.class_id)!.chuaDiem.add(a.student_id);
  }

  /* SOS hiện tại (FT): mức của đợt mới nhất hợp lệ — cùng `latestAttempts` của chỉ số (nhớ trong request). */
  if (ft) {
    const sos = metricSet(p, 'hv-sos-hien-tai', loc).ids;
    const ev = latestAttempts(sos, 'valid', today);
    for (const hv of sos) {
      const m = ev.get(hv)?.sosLevel ?? 0;
      if (m >= 1) vaoLop(m >= 3 ? 'sos3' : m === 2 ? 'sos2' : 'sos1', hv);
    }
  }

  /* Case chưa chốt PA (C23): lớp của Case = lớp của lượt sinh Case (`lopCuaTap`, cùng bảng chi nhánh / bộ lọc khung). */
  const caseChua = metricSet(p, 'case-cho-xac-dinh-nguyen-nhan', loc).ids;
  const lopCase = lopCuaTap('case', caseChua);
  const hvCase = new Map<number, number>();
  theoLo(caseChua, (lo, ph) => {
    for (const x of conn.prepare(`SELECT id, student_id FROM sos_cases WHERE id IN (${ph})`).all(...lo) as any[]) if (x.student_id) hvCase.set(x.id, x.student_id);
  });
  for (const id of caseChua) {
    tong.caseN.add(id);
    const hv = hvCase.get(id);
    if (hv) tong.caseHv.add(hv);
    const l = lopCase.get(id)?.classId;
    if (l && tapLop.has(l)) { tapLop.get(l)!.caseN.add(id); if (hv) tapLop.get(l)!.caseHv.add(hv); }
  }
  const caseQuaHan = metricSet(p, 'case-xac-dinh-nguyen-nhan-qua-han', loc).n;

  /* Đã thi · chờ kết quả (FT): cùng `sauThiTheoEm` của bảng lớp Học viên & Lớp (OV-14b). */
  if (ft) for (const [hv, st] of sauThiTheoEm([...tong.hv], today)) if (st.giaiDoan === 'da_thi_cho_kq') vaoLop('daThiChoKq', hv);

  return { today, branchId, ft, lop, tapLop, tong, chuaLich, bai, luot, hvChuaDiem, caseQuaHan, cs };
}

const ten = (ids: number[]) => {
  const m = new Map<number, string>();
  theoLo(ids, (lo, ph) => { for (const u of db().prepare(`SELECT id, full_name FROM users WHERE id IN (${ph})`).all(...lo) as any[]) m.set(u.id, u.full_name); });
  return m;
};
/** Khoá GV của một bài trễ: id người chấm · 0 = chưa phân công · -1 = Speaking chấm chéo (như Báo cáo › Quá hạn theo GV). */
const khoaGv = (ct: { nguoi: number[]; chamCheo?: boolean } | undefined) => (ct?.nguoi.length ? ct.nguoi : [ct?.chamCheo ? -1 : 0]);

export function tongQuanQlA(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }): TongQuanQlA {
  const r = tinh(p, f);
  const conn = db();
  const hang = (classId: number | null, nhan: string, gvcn: string | null, t: TapLop): HangLopQl => ({
    classId, lop: nhan, gvcn, hv: t.hv.size, chuaLich: r.ft ? t.chuaLich.size : null, chuaDiem: t.chuaDiem.size,
    sos1: t.sos1.size, sos2: t.sos2.size, sos3: t.sos3.size, caseHv: t.caseHv.size, caseN: t.caseN.size, daThiChoKq: r.ft ? t.daThiChoKq.size : null,
  });
  const tenCn = r.branchId ? (r.lop[0]?.branch_name ?? (conn.prepare('SELECT name FROM branches WHERE id = ?').get(r.branchId) as any)?.name ?? null) : null;

  /* Trễ chấm theo GV. */
  const theoGv = new Map<number, number[]>();
  for (const b of r.bai.ids) for (const gv of khoaGv(r.bai.chiTiet?.get(b))) theoGv.set(gv, [...(theoGv.get(gv) ?? []), b]);
  const tenGv = ten([...theoGv.keys()].filter((x) => x > 0));
  const tre: GvTreQl[] = [...theoGv].map(([gv, ds]) => {
    const lopN = new Map<string, number>();
    for (const b of ds) { const c = r.luot.get(tachBaiId(b).attemptId)?.class_code ?? '—'; lopN.set(c, (lopN.get(c) ?? 0) + 1); }
    const han = ds.flatMap((b) => r.bai.chiTiet?.get(b)?.han ?? []);
    return {
      khoa: gv, gvId: gv > 0 ? gv : null, ten: gv > 0 ? tenGv.get(gv) ?? `#${gv}` : gv < 0 ? 'Speaking chấm chéo' : 'Chưa phân công', bai: ds.length,
      kyNang: [...new Set(ds.map((b) => { const x = tachBaiId(b); return tenMonNgan(r.luot.get(x.attemptId)?.programme_code ?? null, x.skill); }))],
      lop: [...lopN].map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n || a.code.localeCompare(b.code, 'vi', { numeric: true })),
      treNhat: Math.max(0, ...han.map((h) => soNgay(h, r.today))),
    };
  }).sort((a, b) => b.bai - a.bai || a.ten.localeCompare(b.ten, 'vi'));

  /* Tuần: 2 tuần trước · tuần này · 2 tuần tới — lượt của khung theo tuần thi của lượt; chấm a/b = ô đã có điểm / (đã có + còn nợ). */
  const t2 = mondayOf(r.today);
  const tuanDs = [-14, -7, 0, 7, 14].map((d) => addDays(t2, d));
  const dsLuot = luotTrongKhoang([r.cs.sql, `a.status != 'cancelled'`, r.ft ? `a.kind = 'mock'` : `a.kind IN ('progress', 'final', 'checkpoint')`,
    'c.is_fast_track = ?', 'rp.week_start >= ?', 'rp.week_start <= ?', ...(r.branchId ? ['c.branch_id = ?'] : [])].join(' AND '),
  [...r.cs.params, r.ft ? 1 : 0, tuanDs[0], tuanDs[4], ...(r.branchId ? [r.branchId] : [])]);
  const idLuot = new Set(dsLuot.map((a) => a.id as number));
  const daCham = new Map<number, number>();
  theoLo([...idLuot], (lo, ph) => {
    for (const x of conn.prepare(`SELECT attempt_id, COUNT(*) n FROM assessment_scores WHERE attempt_id IN (${ph}) AND (band IS NOT NULL OR raw_score IS NOT NULL) GROUP BY attempt_id`)
      .all(...lo) as any[]) daCham.set(x.attempt_id, x.n);
  });
  /* Ô còn nợ của các lượt này — cùng `scoreDebtCells` của chỉ số (nhớ trong request, không đọc lại). */
  const no = new Map<number, { n: number; quaHan: number; han: string | null }>();
  for (const c of idLuot.size ? scoreDebtCells(p, r.today, phamViNoDiem(p, r.branchId)) : []) {
    if (!idLuot.has(c.attemptId)) continue;
    const x = no.get(c.attemptId) ?? no.set(c.attemptId, { n: 0, quaHan: 0, han: null }).get(c.attemptId)!;
    x.n += 1;
    if (c.overdue) x.quaHan += 1;
    if (c.han && (!x.han || c.han < x.han)) x.han = c.han;
  }
  const tuan: TuanQl[] = tuanDs.map((w) => {
    const ds = dsLuot.filter((a) => a.week_start === w);
    const dc = ds.reduce((s, a) => s + (daCham.get(a.id) ?? 0), 0);
    return {
      weekStart: w, periodId: ds[0]?.period_id ?? null, laTuanNay: w === t2, tuongLai: w > t2,
      lop: new Set(ds.map((a) => a.class_id)).size, hv: new Set(ds.map((a) => a.student_id)).size,
      daCham: dc, tong: dc + ds.reduce((s, a) => s + (no.get(a.id)?.n ?? 0), 0), quaHan: ds.reduce((s, a) => s + (no.get(a.id)?.quaHan ?? 0), 0),
    };
  });
  const truoc = r.bai.ids.filter((b) => { const w = r.luot.get(tachBaiId(b).attemptId)?.week_start; return !w || w < tuanDs[0]; }).length;
  const lopNay = new Map<number, any[]>();
  for (const a of dsLuot.filter((x) => x.week_start === t2 && x.class_id)) (lopNay.get(a.class_id) ?? lopNay.set(a.class_id, []).get(a.class_id)!).push(a);
  const testTuanNay = [...lopNay].map(([classId, ds]) => {
    const dot = [...new Set(ds.map((a) => (a.kind === 'mock' ? `MT${a.attempt_no}` : ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? a.kind)))].sort().join(', ');
    const dc = ds.reduce((s, a) => s + (daCham.get(a.id) ?? 0), 0);
    const han = ds.map((a) => no.get(a.id)?.han).filter((h): h is string => !!h).sort()[0] ?? null;
    return { classId, lop: ds[0].class_code as string, dot, hv: new Set(ds.map((a) => a.student_id)).size, daCham: dc,
      tong: dc + ds.reduce((s, a) => s + (no.get(a.id)?.n ?? 0), 0), han, periodId: ds[0].period_id ?? null };
  }).sort((a, b) => soSanhLop({ code: a.lop }, { code: b.lop }));

  const soLop = { ft: 0, thuong: 0 };
  for (const x of conn.prepare(`SELECT c.is_fast_track AS ft, COUNT(*) n FROM classes c WHERE c.status = 'active' AND ${r.cs.sql}${r.branchId ? ' AND c.branch_id = ?' : ''} GROUP BY c.is_fast_track`)
    .all(...r.cs.params, ...(r.branchId ? [r.branchId] : [])) as any[]) soLop[x.ft ? 'ft' : 'thuong'] = x.n;
  return {
    ct: f.ct, homNay: r.today, soLop,
    tomTat: {
      chuaLich: r.ft ? r.chuaLich.length : null, chuaDiemHv: r.hvChuaDiem.size, caseChuaChotHv: r.tong.caseHv.size, caseChuaChot: r.tong.caseN.size,
      caseQuaHan: r.caseQuaHan, baiTre: r.bai.ids.length, gvTre: tre.length,
    },
    lop: { hang: r.lop.map((c) => hang(c.id, c.code, c.gvcn ?? null, r.tapLop.get(c.id)!)), tong: hang(null, tenCn ? `Cả ${tenCn}` : 'Tất cả chi nhánh', null, r.tong), tenChiNhanh: tenCn },
    tuan: { truoc, tuan, testTuanNay, tre },
  };
}

/**
 * Danh sách của MỘT số — `o`: `chua-diem` · `case-chua-chot-hv` (dải tóm tắt) · `lop:<id | tong>:<cột>` (bảng lớp) · `gv:<id | 0 | -1>` (Trễ chấm).
 * Tính lại bằng chính `tinh()` nên số = số dòng.
 */
export function oTongQuanQlA(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; o: string }): { n: number; tieuDe: string; rows: MetricRow[] } {
  const r = tinh(p, f);
  const ra = (donVi: 'hoc-vien' | 'case' | 'bai', ids: Iterable<number>, tieuDe: string) => {
    const ds = [...new Set(ids)].sort((a, b) => a - b);
    return { n: ds.length, tieuDe: `${ds.length} ${donVi === 'bai' ? 'bài' : donVi === 'case' ? 'Case' : 'HV'} — ${tieuDe}`, rows: rowsFor(donVi, ds, undefined, p) };
  };
  if (f.o === 'chua-diem') return ra('hoc-vien', r.hvChuaDiem, 'chưa điểm (bài quá hạn chấm)');
  if (f.o === 'case-chua-chot-hv') return ra('hoc-vien', r.tong.caseHv, 'có Case chưa chốt PA');
  const l = /^lop:(\d+|tong):([a-zA-Z0-9]+)$/.exec(f.o);
  if (l && (COT_LOP_QL as readonly string[]).includes(l[2])) {
    const tap = l[1] === 'tong' ? r.tong : r.tapLop.get(Number(l[1]));
    if (!tap) throw badRequest('Lớp này không có trong bảng — có thể bộ lọc vừa đổi.');
    const cot = l[2] as CotLopQl;
    const nhan: Record<CotLopQl, string> = {
      hv: 'học viên', chuaLich: 'chưa lịch Test', chuaDiem: 'chưa điểm', sos1: 'SOS 1', sos2: 'SOS 2', sos3: 'SOS 3',
      caseHv: 'có Case chưa chốt PA', caseN: 'Case chưa chốt PA', daThiChoKq: 'đã thi · chờ kết quả',
    };
    const lopTen = l[1] === 'tong' ? '' : ` · ${r.lop.find((c) => c.id === Number(l[1]))?.code ?? ''}`;
    return ra(cot === 'caseN' ? 'case' : 'hoc-vien', tap[cot], `${nhan[cot]}${lopTen}`);
  }
  const g = /^gv:(-?\d+)$/.exec(f.o);
  if (g) {
    const k = Number(g[1]);
    return ra('bai', r.bai.ids.filter((b) => khoaGv(r.bai.chiTiet?.get(b)).includes(k)), 'quá hạn chấm');
  }
  throw badRequest('Số này không có trên Tổng quan — có thể bộ lọc vừa đổi.');
}

/** CẦN BẠN QUYẾT — gộp hai khung (không nhận `ct`). Chờ duyệt: hộp duyệt ở web (`/yeu-cau`). */
export function canBanQuyet(p: Principal, f: { branchId?: number | null }): CanBanQuyet {
  laViecQuanLy(p);
  const today = demoToday();
  const branchId = f.branchId ?? null;
  const q = metricSet(p, 'case-xac-dinh-nguyen-nhan-qua-han', { branchId });
  const dong = new Map(rowsFor('case', q.ids, undefined, p).map((x) => [x.id, x]));
  const sos = new Map<number, number | null>();
  theoLo(q.ids, (lo, ph) => { for (const x of db().prepare(`SELECT id, sos_level FROM sos_cases WHERE id IN (${ph})`).all(...lo) as any[]) sos.set(x.id, x.sos_level ?? null); });
  const caseQuaHan = q.ids.map((id) => {
    const x = dong.get(id);
    const han = q.chiTiet?.get(id)?.han ?? [];
    return { caseId: id, em: x?.em ?? null, lop: x?.lop ?? null, nguoi: x?.nguoi ?? null, tinhTrang: x?.tinhTrang ?? x?.sub ?? null,
      soNgay: Math.max(1, ...han.map((h) => soNgay(h, today))), sos: sos.get(id) ?? null };
  }).sort((a, b) => b.soNgay - a.soNgay);
  const buocTiep = viecBuocTiep(p, { today, branchId }).map((x) => ({
    key: x.key as string, cycleId: x.cycleId as number, em: { id: x.studentId as number, ten: x.studentName as string }, lop: x.classCode ?? null,
    ketQua: x.reason as string, han: x.due as string, quaHan: x.urgency === 'overdue',
  })).sort((a, b) => Number(b.quaHan) - Number(a.quaHan) || a.han.localeCompare(b.han));
  const chotLoTrinh = lopChoChotLoTrinh(p, branchId, today).map((x) => ({
    classId: x.classId, lop: x.code, chu: chuViecChotLoTrinh(x), han: x.han, quaHan: !!x.han && x.han < today,
  })).sort((a, b) => (a.han ?? '9999').localeCompare(b.han ?? '9999'));
  return { caseQuaHan, buocTiep, chotLoTrinh };
}

