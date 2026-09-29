import { db } from '../db.ts';
import {
  LEGACY_REGULAR_SKILL_MAP, METRIC_UNIT_LABEL, PERMISSIONS, isNoPlanCase, khoaDot,
  nhanDot, thuTuDot, tuDauKhoang, type ChuongTrinh, type CotTongHop, type DongTongHop, type TheoDong, type TongHopKetQua,
} from '../../../shared/domain/index.ts';
import { cotTongHopFor } from '../../../shared/domain/phanTich.ts';
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

/**
 * TỔNG HỢP TEST + SOS (P10, §3.3) — góc nhìn mặc định của Phân tích. Đi đúng đường `nguon` như bảng chi nhánh của
 * Pa (`bangChiNhanh.ts`): một hàm `tinh()` giữ TẬP ID theo từng ô, `tongHop()` chỉ đọc `.size`, `oTongHop()` tính lại
 * bằng CHÍNH `tinh()` nên số và danh sách không thể lệch nhau (G-10).
 *
 * KHÔNG THÊM CHỈ SỐ MỚI VÀO SỔ (ranh giới PR-Pb): bảng này là một BẢNG, không phải một `metricSet`.
 */

// ------------------------------------------------------------------ Q17: hai hàm thuần, cùng luật với weekly.ts

export type PhanLoaiLuot = 'dat' | 'sos1' | 'sos2' | 'sos3' | 'tamThoi' | 'chuaDu';

/** Đúng thứ tự xét của `weekly.ts` (chưa đủ điểm → tạm thời/chưa đủ; đủ điểm → đạt/sos1/2/3). */
export function phanLoaiLuot(ev: { sosLevel: number | null; complete: boolean }): PhanLoaiLuot {
  if (!ev.complete) return ev.sosLevel === null ? 'chuaDu' : 'tamThoi';
  if (ev.sosLevel === null) return 'chuaDu';
  if (ev.sosLevel === 0) return 'dat';
  if (ev.sosLevel === 1) return 'sos1';
  if (ev.sosLevel === 2) return 'sos2';
  return 'sos3';
}

export type TrangThaiXuLy = 'dangXuLy' | 'thieuPa' | null;

/**
 * Đúng luật của `weekly.ts`: đã có hỗ trợ thực sự diễn ra → đang xử lý; không thì thiếu PA nếu đủ điều kiện
 * `isNoPlanCase`. GIỮ NGUYÊN hệt `weekly.ts` (dùng chung hàm này, không sửa `weekly.ts`) — kể cả việc `dangXuLy`
 * không tự loại case đã `status = 'done'`. Bảng Tổng hợp cần đúng "tình trạng hiện tại" hơn (nhóm Xử lý), nên tự
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

type DongRaw = { khoa: string; nhan: string; phu?: string; tap: Tap; sortKey: readonly unknown[]; con: Map<string, DongRaw> };

export type FilterTongHop = { branchId?: number | null; ct: ChuongTrinh; soTuan: number; classId?: number | null; theo: TheoDong };

function tinh(p: Principal, f: FilterTongHop) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Phân tích dành cho Quản lý.');
  const conn = db();
  const today = demoToday();
  const soTuan = Math.min(Math.max(f.soTuan, 1), 52);
  const tu = tuDauKhoang(today, soTuan);
  const den = mondayOf(today);

  const cs = classScopeSql(scope);
  const where = [cs.sql, `a.status != 'cancelled'`, 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const args: unknown[] = [...cs.params, tu, den];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  if (f.classId) { where.push('c.id = ?'); args.push(f.classId); }
  if (f.ct !== 'ca-hai') { where.push('c.is_fast_track = ?'); args.push(f.ct === 'ft' ? 1 : 0); }

  const attempts = conn
    .prepare(
      `SELECT a.id, a.status, a.kind, a.attempt_no, a.class_id, a.planned_period_id, a.target_at_attempt, a.student_id,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route,
              (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS kck,
              c.programme_code, c.code AS class_code, c.branch_id, c.is_fast_track,
              b.name AS branch_name,
              rp.id AS period_id, rp.week_start, rp.week_end
         FROM assessment_attempts a
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN branches b ON b.id = c.branch_id
        WHERE ${where.join(' AND ')}`,
    )
    .all(...args) as any[];

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

  /** Xem nhiều hơn một chi nhánh thì dòng lớp cần thêm tên chi nhánh mới phân biệt được (không chọn một chi nhánh cụ thể). */
  const manyBranches = !f.branchId;

  const hangMap = new Map<string, DongRaw>();
  const dongCua = new Map<number, { cha: string; con: string }>();

  const chaCua = (a: any): { khoa: string; nhan: string; phu?: string; sortKey: readonly unknown[] } => {
    if (f.theo === 'tuan') {
      const trongTuanNay = a.week_start <= today && a.week_end >= today;
      return {
        khoa: `tuan:${a.period_id}`, nhan: tuanLich(a.week_start, today),
        phu: `${ngay(a.week_start, today)}–${ngay(a.week_end, today)}${trongTuanNay ? ' · tuần này' : ''}`,
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
    if (!cha) { cha = { khoa: par.khoa, nhan: par.nhan, phu: par.phu, tap: new Map(), sortKey: par.sortKey, con: new Map() }; hangMap.set(par.khoa, cha); }
    const chi = conCua(a);
    const khoaChi = `${par.khoa}|${chi.khoa}`;
    let con = cha.con.get(khoaChi);
    if (!con) { con = { khoa: khoaChi, nhan: chi.nhan, tap: new Map(), sortKey: chi.sortKey, con: new Map() }; cha.con.set(khoaChi, con); }
    dongCua.set(a.id, { cha: par.khoa, con: khoaChi });
    return { cha, con };
  };

  const tongTap: Tap = new Map();
  for (const a of attempts) {
    const { cha, con } = dongOf(a);
    if (!scored.has(a.id) || luotKck(a)) continue;   // Q29-1: em KCK ngoài mẫu số

    const ev = evaluateAttemptRow(a, bundle, programmes);
    const loai = phanLoaiLuot(ev);
    for (const tap of [cha.tap, con.tap, tongTap]) { them(tap, 'luot', a.id); them(tap, loai, a.id); }

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
    for (const kn of kyNangDuoi) for (const tap of [cha.tap, con.tap, tongTap]) them(tap, `kn:${kn}`, a.student_id);
  }

  /*
   * CASE VÀO DÒNG CỦA LƯỢT SINH RA NÓ — một câu (lô 400), như `weekly.ts`, nhưng khoá bằng `a.id` thay
   * `planned_period_id` vì Tổng hợp còn xếp theo lớp/đợt/chi nhánh, không chỉ theo tuần.
   */
  for (let i = 0; i < attempts.length; i += 400) {
    const chunk = attempts.slice(i, i + 400).map((a) => a.id);
    if (!chunk.length) continue;
    for (const r of conn
      .prepare(
        `SELECT a.id AS attempt_id, sc.id AS case_id, sc.student_id, sc.status, sc.disposition,
                (SELECT MAX(COALESCE(i.completed_date, i.started_date))
                   FROM case_interventions i WHERE i.case_id = sc.id AND i.status != 'cancelled') AS support_done,
                (SELECT COUNT(*) FROM case_interventions i2 WHERE i2.case_id = sc.id) AS iv_count
           FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE a.id IN (${chunk.map(() => '?').join(',')}) AND COALESCE(sc.sos_level, 1) > 0`,
      )
      .all(...chunk) as any[]) {
      const dong = dongCua.get(r.attempt_id);
      if (!dong) continue;
      const cha = hangMap.get(dong.cha)!, con = cha.con.get(dong.con)!;
      const trang = trangThaiXuLy({ supportDone: r.support_done, status: r.status, disposition: r.disposition, ivCount: r.iv_count }, today);
      /* Nhóm Xử lý là "tình trạng HIỆN TẠI" (Q18) — Case đã status='done' không còn "đang xử lý" dù từng có hỗ trợ. */
      const dangXuLyThat = trang === 'dangXuLy' && r.status !== 'done';
      for (const tap of [cha.tap, con.tap, tongTap]) {
        them(tap, 'case', r.case_id);
        if (r.student_id) them(tap, 'hvCoCase', r.student_id);
        if (dangXuLyThat) them(tap, 'dangXuLy', r.case_id);
        else if (trang === 'thieuPa') them(tap, 'thieuPa', r.case_id);
      }
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
  return { theo: f.theo, ct: f.ct, hang, tongTap, scopeEmpty };
}

const soCuaTap = (tap: Tap, cols: readonly string[]): Record<string, number> =>
  Object.fromEntries(cols.map((k) => [k, tap.get(k)?.size ?? 0]));

export function tongHop(p: Principal, f: FilterTongHop): TongHopKetQua {
  const r = tinh(p, f);
  const cols = cotTongHopFor(r.ct).map((c) => c.khoa);
  const gon = (d: DongRaw): DongTongHop => ({
    khoa: d.khoa, nhan: d.nhan, phu: d.phu, o: soCuaTap(d.tap, cols),
    con: (d as any).conSorted?.length ? (d as any).conSorted.map(gon) : undefined,
  });
  return { theo: r.theo, ct: r.ct, cot: cols, hang: r.hang.map(gon), tong: soCuaTap(r.tongTap, cols), scopeEmpty: r.scopeEmpty };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`, nên danh sách luôn đúng bằng con số (G-10). */
export function oTongHop(p: Principal, f: FilterTongHop & { khoa: string; cot: string }):
  { n: number; tieuDe: string; rows: MetricRow[] } {
  const cotDef = (cotTongHopFor(f.ct) as CotTongHop[]).find((c) => c.khoa === f.cot);
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
    tieuDe: `${ids.length} ${METRIC_UNIT_LABEL[cotDef.donVi]} — ${cotDef.nhan(f.ct)} · ${nhanDong}`,
    rows: rowsFor(cotDef.donVi, ids),
  };
}
