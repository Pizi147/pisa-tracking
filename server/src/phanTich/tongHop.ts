import { db } from '../db.ts';
import {
  LEGACY_REGULAR_SKILL_MAP, nhanDonVi, NGUONG_MINI_TEST, NHAN_NHOM_CON, PERMISSIONS, daiCuoiKhoa, isNoPlanCase, khoaDot,
  nhanDot, soSanhLop, thuTuDot, tuDauKhoang, type ChuongTrinh, type CotTongHop, type DongTongHop, type TheoDong, type TongHopKetQua,
} from '../../../shared/domain/index.ts';
import { cotSoLieu, cotTongHopFor } from '../../../shared/domain/phanTich.ts';
import { ngay, tuanLich } from '../../../shared/domain/hienThiNgay.ts';
import { badRequest, forbidden } from '../util.ts';
import { classScopeSql, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { mondayOf } from '../platform/week.ts';
import { entryBandsOf, loadBundle, type AttemptBundle } from '../fasttrack/attempts.ts';
import { expectationFor, failingEntrySkills } from '../fasttrack/scoring.ts';
import { allProgrammes, type ProgrammeInfo } from '../normal/regular.ts';
import { evaluateAttemptRow, luotKck } from '../worklist/danhGia.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { CASE_THAT, XU_LY_COT_SQL, xuLyCuaDong } from '../cases/sosState.ts';

/**
 * TỔNG HỢP TEST + SOS (P10, §3.3) — góc nhìn mặc định của Phân tích. Đi đúng đường `nguon` như bảng chi nhánh của
 * Pa (`bangChiNhanh.ts`): một hàm `tinh()` giữ TẬP ID theo từng ô, `tongHop()` chỉ đọc `.size`, `oTongHop()` tính lại
 * bằng CHÍNH `tinh()` nên số và danh sách không thể lệch nhau (G-10).
 *
 * KHÔNG THÊM CHỈ SỐ MỚI VÀO SỔ (ranh giới PR-Pb): bảng này là một BẢNG, không phải một `metricSet`.
 */

// ------------------------------------------------------------------ Q17: hai hàm thuần, cùng luật với weekly.ts

export type PhanLoaiLuot = 'dat' | 'sos1' | 'sos2' | 'sos3' | 'chuaDu';

/** Chưa CHỐT → `chuaDu` (cột "Thiếu điểm", kể cả lượt đã tạm có mức SOS — PR-HK2 bỏ cột Tạm thời); đã chốt (OV-1c: đủ điểm hoặc kỹ năng
 *  thiếu đã dời / huỷ / Không dự thi) → đạt/sos1/2/3. `chot` thiếu (lớp thường) = `complete`. */
export function phanLoaiLuot(ev: { sosLevel: number | null; complete: boolean; chot?: boolean }): PhanLoaiLuot {
  if (!(ev.chot ?? ev.complete)) return 'chuaDu';
  if (ev.sosLevel === null) return 'chuaDu';
  if (ev.sosLevel === 0) return 'dat';
  if (ev.sosLevel === 1) return 'sos1';
  if (ev.sosLevel === 2) return 'sos2';
  return 'sos3';
}

/**
 * PR-Pb2-a (P4, K1-19, Q12): một bài lớp thường rơi ĐÚNG MỘT cột — chưa đủ điểm → `chuaDu`; Giữa khoá đếm MÔN trượt (đọc`ev.skills`, cùng
 * luật chấm đã sinh Case); Cuối khoá theo dải % tổng (`daiCuoiKhoa` — một nơi ra 50/60/70).
 */
const DAI_COT: Record<string, string> = { duoi_50: 'ck-duoi50', '50_59': 'ck-50', '60_69': 'ck-60', dat: 'ck-dat' };
export function phanLoaiBaiThuong(kind: string, ev: { complete: boolean; skills: Record<string, { under: boolean }>; tyLeTong?: number | null; nguong?: number }): string {
  if (!ev.complete) return 'chuaDu';
  if (kind === 'final') return ev.tyLeTong == null ? 'chuaDu' : DAI_COT[daiCuoiKhoa(ev.tyLeTong, ev.nguong)];
  const truot = Object.values(ev.skills).filter((s) => s.under).length;
  const nhom = kind === 'checkpoint' ? 'cp' : 'gk';   // OV-11h (PT-1): Checkpoint PET / KET nhóm riêng, không dưới Progress Test
  return truot === 0 ? `${nhom}-dat` : truot === 1 ? `${nhom}-1` : `${nhom}-2`;
}

export type TrangThaiXuLy = 'dangXuLy' | 'thieuPa' | null;

/**
 * Đúng luật của `weekly.ts`: đã có hỗ trợ thực sự diễn ra → đang xử lý; không thì thiếu PA nếu đủ điều kiện
 * `isNoPlanCase`. GIỮ NGUYÊN hệt `weekly.ts` (dùng chung hàm này, không sửa `weekly.ts`) — kể cả việc `dangXuLy`
 * không tự loại Case đã `status = 'done'`. Bảng Tổng hợp cần đúng "tình trạng hiện tại" hơn (nhóm Xử lý), nên tự
 * lọc thêm `status` ở nơi gọi (`tinh()` dưới đây) thay vì đổi hàm thuần này.
 */
export function trangThaiXuLy(
  c: { supportDone: string | null; status: string; disposition: string | null; ivCount: number },
  today: string,
): TrangThaiXuLy {
  if (c.supportDone && c.supportDone <= today) return 'dangXuLy';
  if (isNoPlanCase({ status: c.status, disposition: c.disposition, interventionCount: c.ivCount })) return 'thieuPa';
  return null;
}

// ------------------------------------------------------------------ lõi tập ID

type Tap = Map<string, Set<number>>;
function them(tap: Tap, khoa: string, id: number | null | undefined) {
  if (id === null || id === undefined) return;
  let s = tap.get(khoa);
  if (!s) { s = new Set(); tap.set(khoa, s); }
  s.add(id);
}
function coDuLieu(tap: Tap): boolean {
  return (tap.get('luot')?.size ?? 0) > 0 || (tap.get('case')?.size ?? 0) > 0;
}
function cmpKey(a: readonly unknown[], b: readonly unknown[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i], y = b[i];
    if (x === y) continue;
    return (x as any) < (y as any) ? -1 : 1;
  }
  return 0;
}

/** Cột của một lượt mà `phanLoaiCacLuot` (chấm lại bằng `evaluateAttemptRow`) và bảng cần — MỘT câu cho Tổng hợp và "Đang SOS" (OV-12f). */
export function luotTrongKhoang(where: string, args: readonly unknown[]): any[] {
  return db()
    .prepare(
      `SELECT a.id, a.status, a.kind, a.attempt_no, a.class_id, a.planned_period_id, a.target_at_attempt, a.kck_at_attempt, a.student_id,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route, (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS cy_kck,
              (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS kck,
              c.programme_code, c.code AS class_code, c.branch_id, c.is_fast_track,
              b.name AS branch_name,
              rp.id AS period_id, rp.week_start, rp.week_end
         FROM assessment_attempts a
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN branches b ON b.id = c.branch_id
        WHERE ${where}`,
    )
    .all(...args) as any[];
}

export type LuotPhanLoai = { loai: string; sosLevel: number | null; kyNangDuoi: string[] };

/**
 * PHÂN LOẠI LƯỢT — MỘT hàm cho bảng Tổng hợp (`tinh`) và góc "Đang SOS" của Học viên & Lớp (OV-12f): số em Đang SOS tuần X = số lượt có SOS ở
 * Tổng hợp cùng tuần theo cấu tạo. Lượt chưa có điểm nào, hoặc của em KCK (Q29-1, ngoài mẫu số), không có trong kết quả. Fast Track theo
 * `phanLoaiLuot`, lớp thường theo `phanLoaiBaiThuong`.
 */
export function phanLoaiCacLuot(attempts: readonly any[]): Map<number, LuotPhanLoai> {
  const conn = db();
  const out = new Map<number, LuotPhanLoai>();
  if (!attempts.length) return out;
  const bundle: AttemptBundle = loadBundle(attempts.map((a) => a.id));
  const programmes: Map<string, ProgrammeInfo> = allProgrammes();
  const scored = new Set<number>();
  for (let i = 0; i < attempts.length; i += 400) {
    const chunk = attempts.slice(i, i + 400).map((a) => a.id);
    for (const r of conn
      .prepare(
        `SELECT DISTINCT attempt_id FROM assessment_scores
          WHERE attempt_id IN (${chunk.map(() => '?').join(',')}) AND (band IS NOT NULL OR raw_score IS NOT NULL)`,
      )
      .all(...chunk) as any[]) scored.add(r.attempt_id);
  }
  for (const a of attempts) {
    if (!scored.has(a.id) || luotKck(a)) continue;
    const ev = evaluateAttemptRow(a, bundle, programmes);
    const thuong = !a.is_fast_track;
    /*
     * Q8 — KỸ NĂNG DƯỚI KỲ VỌNG dùng CÙNG LUẬT VỚI NƠI SINH CASE, không phải bốn kỹ năng có band:
     * Fast Track cần `failingEntrySkills` (cổng Writing hai tầng, W1/W2 tách riêng); lớp thường thì
     * `evaluateAttemptRow` đã tự gọi `evaluateRegular` với đúng `scores` này rồi — đọc lại `ev.skills`
     * (outcome fail ↔ `.under`) cho ra CÙNG kết quả mà không phải chấm lần hai.
     */
    const prog = a.programme_code ? programmes.get(a.programme_code) : null;
    const kyNangDuoi: string[] = prog?.scoringMode === 'ratio'
      ? Object.entries(ev.skills).filter(([, v]) => (v as { under: boolean }).under).map(([k]) => LEGACY_REGULAR_SKILL_MAP[k] ?? k)
      : failingEntrySkills(
          expectationFor(a.target_at_attempt, a.attempt_no, a.route),
          entryBandsOf(bundle.scores.get(a.id) ?? []),
          bundle.skips.get(a.id) ?? [],
        );
    out.set(a.id, { loai: thuong ? phanLoaiBaiThuong(a.kind, ev) : phanLoaiLuot(ev), sosLevel: ev.sosLevel ?? null, kyNangDuoi });
  }
  return out;
}

type CoDot = { giua: boolean; cuoi: boolean; checkpoint: boolean };
type DongRaw = { khoa: string; nhan: string; phu?: string; tuanNay?: boolean; tap: Tap; sortKey: readonly unknown[]; con: Map<string, DongRaw>; coDot: CoDot };
const coDotMoi = (): CoDot => ({ giua: false, cuoi: false, checkpoint: false });

/** OV-15e (C29): `tu`/`den` (ngày, bộ chọn thời gian chung) thắng `soTuan` — tuần thi có Thứ Hai trong [Thứ Hai của `tu`, Thứ Hai của `den`]. */
export type FilterTongHop = { branchId?: number | null; ct: ChuongTrinh; soTuan: number; classId?: number | null; theo: TheoDong; tu?: string | null; den?: string | null };

function tinh(p: Principal, f: FilterTongHop) {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW);
  if (scope.none) throw forbidden('Phân tích dành cho Quản lý.');
  const conn = db();
  const today = demoToday();
  const soTuan = Math.min(Math.max(f.soTuan, 1), 52);
  const tu = f.tu && f.den ? mondayOf(f.tu) : tuDauKhoang(today, soTuan);
  const den = f.tu && f.den ? mondayOf(f.den) : mondayOf(today);

  const cs = classScopeSql(scope);
  const where = [cs.sql, `a.status != 'cancelled'`, 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const args: unknown[] = [...cs.params, tu, den];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  if (f.classId) { where.push('c.id = ?'); args.push(f.classId); }
  where.push('c.is_fast_track = ?'); args.push(f.ct === 'ft' ? 1 : 0);

  const attempts = luotTrongKhoang(where.join(' AND '), args);
  const phanLoai = phanLoaiCacLuot(attempts);

  /** Xem nhiều hơn một chi nhánh thì dòng lớp cần thêm tên chi nhánh mới phân biệt được (không chọn một chi nhánh cụ thể). */
  const manyBranches = !f.branchId;

  const hangMap = new Map<string, DongRaw>();
  const dongCua = new Map<number, { cha: string; con: string }>();

  const chaCua = (a: any): { khoa: string; nhan: string; phu?: string; tuanNay?: boolean; sortKey: readonly unknown[] } => {
    if (f.theo === 'tuan') {
      const trongTuanNay = a.week_start <= today && a.week_end >= today;
      return {
        khoa: `tuan:${a.period_id}`, nhan: tuanLich(a.week_start, today),
        phu: `${ngay(a.week_start, today)}–${ngay(a.week_end, today)}${trongTuanNay ? ' · tuần này' : ''}`,
        tuanNay: trongTuanNay,
        sortKey: [a.week_start],
      };
    }
    if (f.theo === 'lop') {
      return {
        khoa: `lop:${a.class_id}`, nhan: a.class_code ?? `#${a.class_id}`,
        phu: manyBranches ? (a.branch_name ?? undefined) : undefined,
        sortKey: [a.branch_id ?? 0, a.class_code ?? ''],
      };
    }
    if (f.theo === 'dot') {
      const kd = khoaDot(a.kind, a.attempt_no);
      return { khoa: `dot:${kd}`, nhan: nhanDot(a.kind, a.attempt_no), sortKey: [thuTuDot(kd)] };
    }
    return { khoa: `cn:${a.branch_id}`, nhan: a.branch_name ?? `#${a.branch_id}`, sortKey: [a.branch_id ?? 0] };
  };
  const conCua = (a: any): { khoa: string; nhan: string; sortKey: readonly unknown[] } => {
    if (f.theo === 'lop') {
      const kd = khoaDot(a.kind, a.attempt_no);
      return { khoa: `dot:${kd}`, nhan: nhanDot(a.kind, a.attempt_no), sortKey: [thuTuDot(kd)] };
    }
    if (f.theo === 'dot') return { khoa: `lop:${a.class_id}`, nhan: a.class_code ?? `#${a.class_id}`, sortKey: [a.branch_id ?? 0, a.class_code ?? ''] };
    return { khoa: `lop:${a.class_id}`, nhan: a.class_code ?? `#${a.class_id}`, sortKey: [a.class_code ?? ''] };
  };

  const dongOf = (a: any): { cha: DongRaw; con: DongRaw } => {
    const par = chaCua(a);
    let cha = hangMap.get(par.khoa);
    if (!cha) { cha = { khoa: par.khoa, nhan: par.nhan, phu: par.phu, tuanNay: par.tuanNay, tap: new Map(), sortKey: par.sortKey, con: new Map(), coDot: coDotMoi() }; hangMap.set(par.khoa, cha); }
    const chi = conCua(a);
    const khoaChi = `${par.khoa}|${chi.khoa}`;
    let con = cha.con.get(khoaChi);
    if (!con) { con = { khoa: khoaChi, nhan: chi.nhan, tap: new Map(), sortKey: chi.sortKey, con: new Map(), coDot: coDotMoi() }; cha.con.set(khoaChi, con); }
    dongCua.set(a.id, { cha: par.khoa, con: khoaChi });
    return { cha, con };
  };

  const tongTap: Tap = new Map();
  const tongCoDot = coDotMoi();
  const laThuong = f.ct === 'thuong';
  const cuoiDaDem: number[] = [];   // bài Final Test đã vào bảng → Mini Test gắn đúng dòng của nó
  for (const a of attempts) {
    const { cha, con } = dongOf(a);
    if (laThuong) for (const x of [cha.coDot, con.coDot, tongCoDot]) { if (a.kind === 'final') x.cuoi = true; else if (a.kind === 'checkpoint') x.checkpoint = true; else x.giua = true; }
    const pl = phanLoai.get(a.id);
    if (!pl) continue;   // chưa chấm · Q29-1: em KCK ngoài mẫu số
    if (laThuong && a.kind === 'final') cuoiDaDem.push(a.id);
    for (const tap of [cha.tap, con.tap, tongTap]) { them(tap, 'luot', a.id); them(tap, pl.loai, a.id); }
    for (const kn of pl.kyNangDuoi) for (const tap of [cha.tap, con.tap, tongTap]) them(tap, `kn:${kn}`, a.student_id);
  }

  /*
   * CASE VÀO DÒNG CỦA LƯỢT SINH RA NÓ — một câu (lô 400), như `weekly.ts`, nhưng khoá bằng `a.id` thay
   * `planned_period_id` vì Tổng hợp còn xếp theo lớp/đợt/chi nhánh, không chỉ theo tuần.
   */
  for (let i = 0; i < attempts.length; i += 400) {
    const chunk = attempts.slice(i, i + 400).map((a) => a.id);
    if (!chunk.length) continue;
    for (const r of conn.prepare(
      `SELECT a.id AS attempt_id, sc.student_id, ${XU_LY_COT_SQL}
         FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE a.id IN (${chunk.map(() => '?').join(',')}) AND COALESCE(sc.sos_level, 1) > 0 AND ${CASE_THAT('sc')}`,
    ).all(...chunk) as any[]) {
      const dong = dongCua.get(r.attempt_id);
      if (!dong) continue;
      const cha = hangMap.get(dong.cha)!, con = cha.con.get(dong.con)!;
      /* OV-12d: nhóm Xử lý theo MỘT luật với Tổng quan (`xuLyCuaDong`) — tình trạng HÔM NAY (Q18); xong / huỷ chỉ nằm trong tổng HV - Case. */
      const x = xuLyCuaDong(r, today);
      for (const tap of [cha.tap, con.tap, tongTap]) {
        them(tap, 'case', r.id);
        if (r.student_id) them(tap, 'hvCoCase', r.student_id);
        if (x.cot !== 'xongHuy') them(tap, x.cot, r.id);
        if (x.quaHan) them(tap, 'choDuyetQuaHan', r.id);
      }
    }
  }

  /* PR-Pb2-a: Mini Test (đếm HỌC VIÊN) vào dòng của bài Cuối khoá sinh ra nó — MỘT câu theo lô 400, ngưỡng `NGUONG_MINI_TEST`. */
  for (let i = 0; i < cuoiDaDem.length; i += 400) {
    const chunk = cuoiDaDem.slice(i, i + 400);
    for (const r of conn.prepare(
      `SELECT tu_attempt_id, student_id, ty_le FROM mini_test WHERE tu_attempt_id IN (${chunk.map(() => '?').join(',')}) AND ty_le IS NOT NULL`,
    ).all(...chunk) as any[]) {
      const dong = dongCua.get(r.tu_attempt_id)!;
      const cha = hangMap.get(dong.cha)!, con = cha.con.get(dong.con)!;
      for (const tap of [cha.tap, con.tap, tongTap]) them(tap, r.ty_le >= NGUONG_MINI_TEST ? 'mini-dat' : 'mini-truot', r.student_id);
    }
  }

  // Chỉ giữ dòng (và dòng con) có dữ liệu thật (luật "không in dòng toàn số 0", như WeeklyBoard).
  const hang = [...hangMap.values()].filter((r) => coDuLieu(r.tap));
  hang.sort((a, b) => (f.theo === 'tuan' ? -cmpKey(a.sortKey, b.sortKey) : cmpKey(a.sortKey, b.sortKey)));
  for (const h of hang) {
    const conList = [...h.con.values()].filter((r) => coDuLieu(r.tap));
    conList.sort((a, b) => cmpKey(a.sortKey, b.sortKey));
    (h as any).conSorted = conList;
  }

  const scopeEmpty = !scope.all && scope.branchIds.length === 0 && scope.classIds.length === 0;
  return { theo: f.theo, ct: f.ct, hang, tongTap, tongCoDot: laThuong ? tongCoDot : undefined, scopeEmpty };
}

const soCuaTap = (tap: Tap, cols: readonly string[]): Record<string, number> =>
  Object.fromEntries(cols.map((k) => [k, tap.get(k)?.size ?? 0]));

/**
 * OV-11h (PT-10): lớp ĐÃ KẾT THÚC có lượt (không huỷ) trong khoảng `soTuan` tuần — ô Lớp của Phân tích, nhóm "Đã kết thúc" (bảng "Theo lớp" đã có hàng
 * của chúng). Cùng phạm vi `ATTEMPT_VIEW` và cùng cột như `/ref/classes`; `ket_thuc: true` để web xếp nhóm.
 */
export function lopKetThucCoLuot(p: Principal, soTuan: number, branchId: number | null, khoang?: { tu: string; den: string }): any[] {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return [];
  const today = demoToday();
  const rows = db().prepare(
    `SELECT c.id, c.code, c.kind, c.route, c.branch_id, c.start_date, c.programme_code, pg.name AS programme_name, pg.scoring_mode
       FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code
      WHERE c.status IN ('finished', 'ended') AND EXISTS (SELECT 1 FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
             WHERE a.class_id = c.id AND a.status != 'cancelled' AND rp.week_start >= ? AND rp.week_start <= ?)`,
  ).all(khoang ? mondayOf(khoang.tu) : tuDauKhoang(today, Math.min(Math.max(soTuan, 1), 52)), khoang ? mondayOf(khoang.den) : mondayOf(today)) as any[];
  return rows
    .filter((c) => (scope.all || scope.branchIds.includes(c.branch_id) || scope.classIds.includes(c.id)) && (!branchId || c.branch_id === branchId))
    .sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }))
    .map((c) => ({ ...c, ket_thuc: true }));
}

export function tongHop(p: Principal, f: FilterTongHop): TongHopKetQua {
  const r = tinh(p, f);
  /* OV-12d: `choDuyetQuaHan` đi kèm (⚠ n của cột Chờ duyệt), không phải cột riêng. */
  const cols = cotTongHopFor(r.ct).map((c) => c.khoa);
  const oCols = [...cotSoLieu(r.ct).map((c) => c.khoa), 'choDuyetQuaHan'];   // cột ghép "HV - Case" mang hai số: hvCoCase và case
  const gon = (d: DongRaw): DongTongHop => ({
    khoa: d.khoa, nhan: d.nhan, phu: d.phu, ...(d.tuanNay !== undefined ? { tuanNay: d.tuanNay } : {}), o: soCuaTap(d.tap, oCols), ...(r.ct === 'thuong' ? { coDot: d.coDot } : {}),
    con: (d as any).conSorted?.length ? (d as any).conSorted.map(gon) : undefined,
  });
  return { theo: r.theo, ct: r.ct, cot: cols, hang: r.hang.map(gon), tong: soCuaTap(r.tongTap, oCols), tongCoDot: r.tongCoDot, scopeEmpty: r.scopeEmpty };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`, nên danh sách luôn đúng bằng con số (G-10). */
export function oTongHop(p: Principal, f: FilterTongHop & { khoa: string; cot: string }):
  { n: number; tieuDe: string; rows: MetricRow[] } {
  const cotDef = (cotSoLieu(f.ct) as CotTongHop[]).find((c) => c.khoa === f.cot);
  if (!cotDef) throw badRequest(`Cột "${f.cot}" không có trong bảng.`);
  const r = tinh(p, f);
  let tap: Tap | null = null; let nhanDong = '';
  if (f.khoa === 'tong') { tap = r.tongTap; nhanDong = 'Tổng'; }
  else {
    for (const h of r.hang) {
      if (h.khoa === f.khoa) { tap = h.tap; nhanDong = h.nhan; break; }
      const con = ((h as any).conSorted as DongRaw[] | undefined)?.find((c) => c.khoa === f.khoa);
      if (con) { tap = con.tap; nhanDong = `${h.nhan} · ${con.nhan}`; break; }
    }
  }
  if (!tap) throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
  const ids = [...(tap.get(f.cot) ?? new Set<number>())].sort((a, b) => a - b);
  return {
    n: ids.length,
    tieuDe: `${ids.length} ${nhanDonVi(cotDef.donVi, f.ct)} — ${cotDef.nhomCon ? `${NHAN_NHOM_CON[cotDef.nhomCon]} · ` : ''}${cotDef.nhan(f.ct)} · ${nhanDong}`,
    rows: rowsFor(cotDef.donVi, ids),
  };
}
