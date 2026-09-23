import { db } from '../db.ts';
import {
  METRIC_UNIT_LABEL, PERMISSIONS, categoryOf, issueLabel, kyNangTheoCt,
  type CaseCategory, type ChuongTrinh, type DongLoiVanDe, type HangKyNangVanDe, type MaTranVanDe,
} from '../../../shared/domain/index.ts';
import { caseCategoriesFor } from '../../../shared/domain/cases.ts';
import { badRequest, forbidden } from '../util.ts';
import { classScopeSql, scopeFor, type Principal } from '../permissions.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';

/**
 * VẤN ĐỀ HỌC VIÊN (P8, §3.3) — ma trận nhiệt kỹ năng × lớp/chi nhánh. Cùng luật quyền và cùng cách "một hàm tính,
 * một hàm mở danh sách" với Tổng hợp Test + SOS (`tongHop.ts`). Ba câu SQL, không có câu nào lặp theo học viên/case.
 */

const CHUA_PHAN_LOAI = '__chua-phan-loai__';

export type FilterVanDe = { branchId?: number | null; ct: ChuongTrinh; classId?: number | null; cot: 'lop' | 'cn' };

type ONhiet = { n: Set<number>; N: Set<number> };
function tapMoi(): ONhiet { return { n: new Set(), N: new Set() }; }

function tinh(p: Principal, f: FilterVanDe) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Phân tích dành cho Quản lý.');
  const conn = db();

  const cs = classScopeSql(scope);
  const where = [cs.sql, `c.status = 'active'`, `e.status = 'active'`, `s.archived_at IS NULL`];
  const args: unknown[] = [...cs.params];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  if (f.classId) { where.push('c.id = ?'); args.push(f.classId); }
  if (f.ct !== 'ca-hai') { where.push('c.is_fast_track = ?'); args.push(f.ct === 'ft' ? 1 : 0); }

  const enrollments = conn
    .prepare(
      `SELECT e.student_id, c.id AS class_id, c.code AS class_code, c.branch_id, b.name AS branch_name,
              c.is_fast_track, pg.scoring_mode
         FROM enrollments e
         JOIN classes c ON c.id = e.class_id
         JOIN students s ON s.id = e.student_id
         JOIN branches b ON b.id = c.branch_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${where.join(' AND ')}`,
    )
    .all(...args) as any[];

  const colLabel = new Map<string, string>();
  const colsOfStudent = new Map<number, Set<string>>();
  const N = new Map<string, ONhiet>();   // khoá `${skill}|${colKey}`
  const khoaCua = (skill: string, colKey: string) => `${skill}|${colKey}`;
  const oCua = (skill: string, colKey: string): ONhiet => {
    const k = khoaCua(skill, colKey);
    let o = N.get(k);
    if (!o) { o = tapMoi(); N.set(k, o); }
    return o;
  };

  for (const r of enrollments) {
    const colKey = f.cot === 'lop' ? `lop:${r.class_id}` : `cn:${r.branch_id}`;
    if (!colLabel.has(colKey)) colLabel.set(colKey, f.cot === 'lop' ? (r.class_code ?? `#${r.class_id}`) : (r.branch_name ?? `#${r.branch_id}`));
    if (!colsOfStudent.has(r.student_id)) colsOfStudent.set(r.student_id, new Set());
    colsOfStudent.get(r.student_id)!.add(colKey);
    for (const skill of caseCategoriesFor(r.scoring_mode)) oCua(skill, colKey).N.add(r.student_id);
  }

  const studentIds = [...colsOfStudent.keys()];
  /** `caseId → {studentId, hangMuc, colKeys}` — chỉ giữ case KHỚP một (kỹ năng, cột) thật (Q11: "không áp dụng" thì bỏ qua). */
  const caseValid = new Map<number, { studentId: number; hangMuc: CaseCategory; colKeys: string[] }>();
  for (let i = 0; i < studentIds.length; i += 400) {
    const chunk = studentIds.slice(i, i + 400);
    if (!chunk.length) continue;
    for (const r of conn
      .prepare(
        `SELECT id, student_id, category, topic FROM sos_cases
          WHERE status != 'done' AND student_id IN (${chunk.map(() => '?').join(',')})`,
      )
      .all(...chunk) as any[]) {
      const hangMuc = (r.category ?? categoryOf(r.topic)) as CaseCategory | null;
      if (!hangMuc) continue;
      const cols = [...(colsOfStudent.get(r.student_id) ?? [])].filter((colKey) => N.get(khoaCua(hangMuc, colKey))?.N.has(r.student_id));
      if (!cols.length) continue;
      for (const colKey of cols) oCua(hangMuc, colKey).n.add(r.student_id);
      caseValid.set(r.id, { studentId: r.student_id, hangMuc, colKeys: cols });
    }
  }

  /** Dòng loại lỗi — khoá `${skill}|${colKey}|${taxonomy_code hoặc "chưa phân loại"}` → tập học viên (một em có thể gặp 2 lỗi, Q11). */
  const loi = new Map<string, Set<number>>();
  const themLoi = (skill: string, colKey: string, ma: string, studentId: number) => {
    const k = `${skill}|${colKey}|${ma}`;
    if (!loi.has(k)) loi.set(k, new Set());
    loi.get(k)!.add(studentId);
  };
  const caseIds = [...caseValid.keys()];
  const coMa = new Set<number>();
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    if (!chunk.length) continue;
    for (const r of conn
      .prepare(
        `SELECT case_id, taxonomy_code FROM case_issues
          WHERE role IN ('primary','secondary') AND case_id IN (${chunk.map(() => '?').join(',')})`,
      )
      .all(...chunk) as any[]) {
      const info = caseValid.get(r.case_id);
      if (!info) continue;
      coMa.add(r.case_id);
      for (const colKey of info.colKeys) themLoi(info.hangMuc, colKey, r.taxonomy_code, info.studentId);
    }
  }
  for (const [caseId, info] of caseValid) {
    if (coMa.has(caseId)) continue;
    for (const colKey of info.colKeys) themLoi(info.hangMuc, colKey, CHUA_PHAN_LOAI, info.studentId);
  }

  const cotDs = [...colLabel.entries()].map(([khoa, nhan]) => ({ khoa, nhan })).sort((a, b) => a.khoa.localeCompare(b.khoa));
  return { skills: kyNangTheoCt(f.ct), cotDs, N, loi, scopeEmpty: !scope.all && scope.branchIds.length === 0 && scope.classIds.length === 0 };
}

export function maTranVanDe(p: Principal, f: FilterVanDe): MaTranVanDe {
  const r = tinh(p, f);
  const hang: HangKyNangVanDe[] = r.skills.map((skill) => {
    const o: Record<string, { n: number; N: number } | null> = {};
    const nTong = new Set<number>(), NTong = new Set<number>();
    for (const colKey of r.cotDs.map((c) => c.khoa)) {
      const cell = r.N.get(`${skill}|${colKey}`);
      o[colKey] = cell ? { n: cell.n.size, N: cell.N.size } : null;
      cell?.n.forEach((x) => nTong.add(x));
      cell?.N.forEach((x) => NTong.add(x));
    }
    const tongCell = { n: nTong.size, N: NTong.size };

    // Gom loại lỗi của kỹ năng này trên khắp các cột (để dựng dòng con và cột Tổng).
    const maSet = new Set<string>();
    const maTapTong = new Map<string, Set<number>>();
    for (const [k, tap] of r.loi) {
      const [sk, , ma] = k.split('|');
      if (sk !== skill) continue;
      maSet.add(ma);
      if (!maTapTong.has(ma)) maTapTong.set(ma, new Set());
      tap.forEach((x) => maTapTong.get(ma)!.add(x));
    }
    const con: DongLoiVanDe[] = [...maSet].map((ma) => {
      const oCon: Record<string, number | null> = {};
      for (const colKey of r.cotDs.map((c) => c.khoa)) oCon[colKey] = r.loi.get(`${skill}|${colKey}|${ma}`)?.size ?? (r.N.get(`${skill}|${colKey}`) ? 0 : null);
      const tong = maTapTong.get(ma)?.size ?? 0;
      return { ma, nhan: ma === CHUA_PHAN_LOAI ? 'Chưa phân loại' : issueLabel(ma), o: oCon, tong };
    }).sort((a, b) => (a.ma === CHUA_PHAN_LOAI ? 1 : b.ma === CHUA_PHAN_LOAI ? -1 : b.tong - a.tong));

    const ungVien = con.filter((c) => c.ma !== CHUA_PHAN_LOAI);
    const nhieuNhat = ungVien.length
      ? ungVien.reduce((best, c) => (c.tong > best.tong || (c.tong === best.tong && c.nhan.localeCompare(best.nhan) < 0) ? c : best))
      : null;

    return {
      kn: skill, nhan: nhanKyNangDayDu(skill),
      o, tong: tongCell,
      loiNhieuNhat: nhieuNhat && nhieuNhat.tong > 0 ? { code: nhieuNhat.ma, nhan: nhieuNhat.nhan, n: nhieuNhat.tong } : null,
      con,
    };
  });
  return { cot: f.cot, cotDs: r.cotDs, hang, scopeEmpty: r.scopeEmpty };
}

function nhanKyNangDayDu(skill: string): string {
  const nhan: Record<string, string> = {
    listening: 'Listening', reading: 'Reading', writing1: 'Writing Task 1', writing2: 'Writing Task 2',
    writing: 'Writing', speaking: 'Speaking',
  };
  return nhan[skill] ?? skill;
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`, nên số và danh sách không thể lệch nhau (G-10). */
export function oVanDe(p: Principal, f: FilterVanDe & { kn: string; ma?: string | null; khoaCot: string }):
  { n: number; tieuDe: string; rows: MetricRow[] } {
  const r = tinh(p, f);
  if (!(r.skills as readonly string[]).includes(f.kn)) throw badRequest(`Kỹ năng "${f.kn}" không có trong ma trận.`);
  const cotHople = [...r.cotDs.map((c) => c.khoa), 'tong'];
  if (!cotHople.includes(f.khoaCot)) throw badRequest(`Cột "${f.khoaCot}" không có trong ma trận.`);
  const nhanCot = f.khoaCot === 'tong' ? 'Tổng' : (r.cotDs.find((c) => c.khoa === f.khoaCot)?.nhan ?? f.khoaCot);

  let ids: number[];
  let vanDe: string;
  if (f.ma) {
    if (f.khoaCot === 'tong') {
      const s = new Set<number>();
      for (const colKey of r.cotDs.map((c) => c.khoa)) r.loi.get(`${f.kn}|${colKey}|${f.ma}`)?.forEach((x) => s.add(x));
      ids = [...s];
    } else {
      ids = [...(r.loi.get(`${f.kn}|${f.khoaCot}|${f.ma}`) ?? new Set<number>())];
    }
    vanDe = f.ma === CHUA_PHAN_LOAI ? 'Chưa phân loại' : issueLabel(f.ma);
  } else {
    if (f.khoaCot === 'tong') {
      const s = new Set<number>();
      for (const colKey of r.cotDs.map((c) => c.khoa)) r.N.get(`${f.kn}|${colKey}`)?.n.forEach((x) => s.add(x));
      ids = [...s];
    } else {
      ids = [...(r.N.get(`${f.kn}|${f.khoaCot}`)?.n ?? new Set<number>())];
    }
    vanDe = nhanKyNangDayDu(f.kn);
  }
  ids.sort((a, b) => a - b);
  return { n: ids.length, tieuDe: `${ids.length} ${METRIC_UNIT_LABEL['hoc-vien']} — ${vanDe} · ${nhanCot}`, rows: rowsFor('hoc-vien', ids) };
}
