import { db } from '../db.ts';
import {
  CASE_CATEGORY_SHORT, ISSUE_TAXONOMY, LOI_CHUNG, NHAN_HO_KY_NANG, categoryOf, hoKyNang, issueBranchOf, issueLabel, khoaDot, nhanDot,
  tuDauKhoang,
  type CaseCategory, type ChuongTrinh, type DongVanDeHv, type HoKyNang, type VanDeHvKetQua,
} from '../../../shared/domain/index.ts';
import { ngay } from '../../../shared/domain/hienThiNgay.ts';
import { badRequest } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { phamViPhanTich } from './phamVi.ts';

/**
 * TỔNG HỢP VẤN ĐỀ HV (PR-UX4, Q3–Q8) — đếm HỌC VIÊN theo LOẠI LỖI (`ISSUE_TAXONOMY`, lỗi chính + phụ của Case). Cùng khuôn với
 * `tongHop.ts`: một hàm `tinh()` giữ TẬP theo từng khoá dòng, `vanDeHv()` chỉ đọc `.size`, `oVanDeHv()` mở danh sách bằng CHÍNH
 * `tinh()` — nên số và danh sách không thể lệch nhau (G-10). Số câu SQL không đổi theo số dòng (lô 400).
 */

export type FilterVanDeHv = {
  branchId?: number | null; ct: ChuongTrinh; classId?: number | null; soTuan: number; chiChinh: boolean; gop: boolean;
};

const HO_THU_TU: readonly HoKyNang[] = ['listening', 'reading', 'writing', 'speaking'];
const NHAN_HO = NHAN_HO_KY_NANG;
const GOI_Y_LANGUAGE = 'Reading/Listening chỉ có mục Từ vựng / ngữ pháp nên mục đó tính ở cả Ngữ pháp và Từ vựng.';
const HINT_CUA_MA = new Map<string, string>(ISSUE_TAXONOMY.flatMap((b) => b.items.filter((i) => i.hint).map((i) => [i.code, i.hint!] as const)));

type Vai = 'primary' | 'secondary';
type Lop = { hv: Set<number>; r1: Set<number>; r0: Set<number> };
type Muc = { hv: Map<number, { caseId: number; vai: Vai }>; lop: Map<number, Lop> };
type CaseInfo = {
  id: number; studentId: number; category: string | null; topic: string | null; attemptId: number | null;
  kind: string | null; attemptNo: number | null; owner: string | null; status: string; openedAt: string | null;
};

const mucMoi = (): Muc => ({ hv: new Map(), lop: new Map() });
function lopCua(m: Muc, classId: number): Lop {
  let l = m.lop.get(classId);
  if (!l) { l = { hv: new Set(), r1: new Set(), r0: new Set() }; m.lop.set(classId, l); }
  return l;
}
function chunks<T>(list: T[]): T[][] {
  return Array.from({ length: Math.ceil(list.length / 400) }, (_, i) => list.slice(i * 400, i * 400 + 400));
}
const marks = (n: number) => Array.from({ length: n }, () => '?').join(',');

/** Mã lỗi hiệu lực + họ kỹ năng của một dòng `case_issues` (Q5): mã lạ → "Khác" của kỹ năng theo hạng mục Case. */
function locHo(ma: string, c: CaseInfo): { ho: HoKyNang; ma: string } | null {
  const nhanh = issueBranchOf(ma);
  if (nhanh) { const ho = hoKyNang(nhanh); return ho ? { ho, ma } : null; }   // tong_hop (Pre FOU) → null
  const ho = hoKyNang(c.category ?? categoryOf(c.topic));
  return ho ? { ho, ma: `student.${ho}.other` } : null;
}

/** Các cặp (khoá hàng lớn, khoá hàng con) mà một lỗi thuộc về — chế độ kỹ năng một cặp, chế độ gộp có thể nhiều cặp (Q7). */
function khoaCuaLoi(gop: boolean, ho: HoKyNang, ma: string): { cha: string; con: string; chaLoai: 'ky-nang' | 'chung' | 'gom' }[] {
  if (!gop) return [{ cha: `kn:${ho}`, con: `kn:${ho}|${ma}`, chaLoai: 'ky-nang' }];
  const nhom = LOI_CHUNG.filter((g) => g.ma.includes(ma));
  if (nhom.length) return nhom.map((g) => ({ cha: `chung:${g.khoa}`, con: `chung:${g.khoa}|${ho}|${ma}`, chaLoai: 'chung' as const }));
  return [{ cha: 'gom:mot', con: `gom:mot|${issueLabel(ma) === 'Khác' ? 'khac' : ma}`, chaLoai: 'gom' }];
}

function tinh(p: Principal, f: FilterVanDeHv) {
  const { cs, scopeEmpty } = phamViPhanTich(p, f.branchId ?? null, f.classId ?? null);
  const conn = db();
  const today = demoToday();
  const soTuan = Math.min(Math.max(f.soTuan, 1), 52);
  const tuNgay = tuDauKhoang(today, soTuan);

  // 1) Ghi danh đang học trong phạm vi.
  const where = [cs.sql, `c.status = 'active'`, `e.status = 'active'`, 's.archived_at IS NULL'];
  const args: unknown[] = [...cs.params];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  if (f.classId) { where.push('c.id = ?'); args.push(f.classId); }
  if (f.ct !== 'ca-hai') { where.push('c.is_fast_track = ?'); args.push(f.ct === 'ft' ? 1 : 0); }
  const lopCuaHv = new Map<number, Set<number>>();
  const maLop = new Map<number, string>();
  for (const r of conn.prepare(
    `SELECT e.student_id, c.id AS class_id, c.code AS class_code
       FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
      WHERE ${where.join(' AND ')}`,
  ).all(...args) as any[]) {
    if (!lopCuaHv.has(r.student_id)) lopCuaHv.set(r.student_id, new Set());
    lopCuaHv.get(r.student_id)!.add(r.class_id);
    maLop.set(r.class_id, r.class_code ?? `#${r.class_id}`);
  }
  const hvIds = [...lopCuaHv.keys()];

  // 2) Case của các HV đó: đang mở, hoặc đóng trong khoảng (Q4).
  const cases = new Map<number, CaseInfo>();
  for (const chunk of chunks(hvIds)) {
    for (const r of conn.prepare(
      `SELECT sc.id, sc.student_id, sc.category, sc.topic, sc.attempt_id, sc.status, sc.detected_at, sc.created_at,
              a.kind, a.attempt_no, u.full_name AS owner
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN users u ON u.id = sc.owner_user_id
        WHERE sc.student_id IN (${marks(chunk.length)}) AND (sc.status != 'done' OR substr(sc.closed_at, 1, 10) >= ?)`,
    ).all(...chunk, tuNgay) as any[]) {
      cases.set(r.id, {
        id: r.id, studentId: r.student_id, category: r.category, topic: r.topic, attemptId: r.attempt_id,
        kind: r.kind, attemptNo: r.attempt_no, owner: r.owner, status: r.status,
        openedAt: (r.detected_at ?? r.created_at ?? '').slice(0, 10) || null,
      });
    }
  }

  // 3) Lỗi của các Case đó (cả hai vai; lọc vai theo công tắc ở bước ghi).
  const loiCua = new Map<number, { ma: string; vai: Vai }[]>();
  for (const chunk of chunks([...cases.keys()])) {
    for (const r of conn.prepare(
      `SELECT case_id, taxonomy_code, role FROM case_issues
        WHERE role IN ('primary', 'secondary') AND case_id IN (${marks(chunk.length)})`,
    ).all(...chunk) as any[]) {
      if (!loiCua.has(r.case_id)) loiCua.set(r.case_id, []);
      loiCua.get(r.case_id)!.push({ ma: r.taxonomy_code, vai: r.role });
    }
  }

  // 4) Hai đợt gần nhất có điểm của mỗi lớp (Q6).
  const lopIds = [...maLop.keys()];
  const dotCua = new Map<number, { khoa: string; tuan: string; luot: number[] }[]>();
  for (const chunk of chunks(lopIds)) {
    for (const r of conn.prepare(
      `SELECT a.id, a.class_id, a.kind, a.attempt_no, rp.week_start
         FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.class_id IN (${marks(chunk.length)}) AND a.status != 'cancelled'
          AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))`,
    ).all(...chunk) as any[]) {
      const ds = dotCua.get(r.class_id) ?? [];
      const khoa = khoaDot(r.kind, r.attempt_no);
      let d = ds.find((x) => x.khoa === khoa);
      if (!d) { d = { khoa, tuan: r.week_start, luot: [] }; ds.push(d); }
      if (r.week_start > d.tuan) d.tuan = r.week_start;
      d.luot.push(r.id);
      dotCua.set(r.class_id, ds);
    }
  }
  const soSanh = new Map<number, { lop: number; ky: 'r1' | 'r0' }>();   // lượt → (lớp, đợt mới / đợt liền trước)
  const lopDu2Dot = new Set<number>();
  for (const [classId, ds] of dotCua) {
    if (ds.length < 2) continue;
    ds.sort((a, b) => (a.tuan < b.tuan ? 1 : a.tuan > b.tuan ? -1 : 0));
    lopDu2Dot.add(classId);
    for (const id of ds[0].luot) soSanh.set(id, { lop: classId, ky: 'r1' });
    for (const id of ds[1].luot) soSanh.set(id, { lop: classId, ky: 'r0' });
  }

  // Ghi các tập.
  const tap = new Map<string, Muc>();
  const conCua = new Map<string, Set<string>>();           // khoá hàng lớn → các khoá hàng con
  const chaLoaiCua = new Map<string, 'ky-nang' | 'chung' | 'gom'>();
  const nhanCon = new Map<string, { ho: HoKyNang; ma: string }>();
  const muc = (khoa: string): Muc => { let m = tap.get(khoa); if (!m) { m = mucMoi(); tap.set(khoa, m); } return m; };
  const themHv = (m: Muc, hv: number, caseId: number, vai: Vai) => {
    const cu = m.hv.get(hv);
    if (!cu || (vai === 'primary' && cu.vai !== 'primary') || (vai === cu.vai && caseId < cu.caseId)) m.hv.set(hv, { caseId, vai });
    for (const k of lopCuaHv.get(hv) ?? []) lopCua(m, k).hv.add(hv);
  };
  const chuaPhanLoai = { cases: new Set<number>(), hv: new Set<number>(), lop: new Set<number>() };
  const caseCoDong = new Set<number>();
  const hvCoLoi = new Set<number>();
  const lopCoLoi = new Set<number>();

  for (const c of cases.values()) {
    const loi = loiCua.get(c.id);
    if (!loi?.length) {
      chuaPhanLoai.cases.add(c.id);
      chuaPhanLoai.hv.add(c.studentId);
      for (const k of lopCuaHv.get(c.studentId) ?? []) chuaPhanLoai.lop.add(k);
      continue;
    }
    for (const l of loi) {
      if (f.chiChinh && l.vai !== 'primary') continue;
      const x = locHo(l.ma, c);
      if (!x) continue;
      for (const kh of khoaCuaLoi(f.gop, x.ho, x.ma)) {
        themHv(muc(kh.cha), c.studentId, c.id, l.vai);
        themHv(muc(kh.con), c.studentId, c.id, l.vai);
        if (!conCua.has(kh.cha)) conCua.set(kh.cha, new Set());
        conCua.get(kh.cha)!.add(kh.con);
        chaLoaiCua.set(kh.cha, kh.chaLoai);
        if (!nhanCon.has(kh.con)) nhanCon.set(kh.con, x);
      }
      caseCoDong.add(c.id);
      hvCoLoi.add(c.studentId);
      for (const k of lopCuaHv.get(c.studentId) ?? []) lopCoLoi.add(k);
    }
  }

  // 5) Case sinh từ lượt của hai đợt gần nhất (không giới hạn khoảng) — chỉ để tính "so với lần Test trước".
  const luotSoSanh = [...soSanh.keys()];
  for (const chunk of chunks(luotSoSanh)) {
    for (const r of conn.prepare(
      `SELECT sc.id, sc.student_id, sc.attempt_id, sc.category, sc.topic, ci.taxonomy_code, ci.role
         FROM sos_cases sc JOIN case_issues ci ON ci.case_id = sc.id
        WHERE sc.attempt_id IN (${marks(chunk.length)}) AND ci.role IN ('primary', 'secondary')`,
    ).all(...chunk) as any[]) {
      if (!lopCuaHv.has(r.student_id)) continue;
      if (f.chiChinh && r.role !== 'primary') continue;
      const dot = soSanh.get(r.attempt_id)!;
      const x = locHo(r.taxonomy_code, { category: r.category, topic: r.topic } as CaseInfo);
      if (!x) continue;
      for (const kh of khoaCuaLoi(f.gop, x.ho, x.ma)) {
        for (const khoa of [kh.cha, kh.con]) lopCua(muc(khoa), dot.lop)[dot.ky].add(r.student_id);
      }
    }
  }

  return {
    tap, conCua, chaLoaiCua, nhanCon, maLop, lopCuaHv, lopDu2Dot, cases, chuaPhanLoai, scopeEmpty,
    tomTat: { hv: hvCoLoi.size, case: caseCoDong.size, lop: lopCoLoi.size },
  };
}

type Tinh = ReturnType<typeof tinh>;

function soVoiTruocCua(r: Tinh, m: Muc): number | null {
  if (!r.lopDu2Dot.size) return null;
  let d = 0;
  for (const [classId, l] of m.lop) if (r.lopDu2Dot.has(classId)) d += l.r1.size - l.r0.size;
  return d;
}

function top3Cua(r: Tinh, m: Muc) {
  return [...m.lop.entries()]
    .map(([classId, l]) => ({ classId, ma: r.maLop.get(classId) ?? `#${classId}`, n: l.hv.size }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.ma.localeCompare(b.ma))
    .slice(0, 3);
}

function dongCoBan(r: Tinh, khoa: string, nhan: string, loai: DongVanDeHv['loai']): DongVanDeHv {
  const m = r.tap.get(khoa)!;
  const soLop = [...m.lop.values()].filter((l) => l.hv.size > 0).length;   // lớp chỉ có mặt ở phép so sánh (r0/r1) thì không tính
  return { khoa, nhan, loai, soHv: m.hv.size, soLop, top3: top3Cua(r, m), soVoiTruoc: soVoiTruocCua(r, m) };
}

const laKhac = (ma: string) => issueLabel(ma) === 'Khác';

/** Nhãn hàng con: chế độ kỹ năng chỉ có tên loại lỗi (kỹ năng là hàng cha); chế độ gộp kèm kỹ năng ("Writing · Ngữ pháp"). */
function nhanConCua(gop: boolean, khoaCon: string, x: { ho: HoKyNang; ma: string }): string {
  if (!gop) return issueLabel(x.ma);
  if (khoaCon.endsWith('|khac')) return 'Khác';
  return `${NHAN_HO[x.ho]} · ${issueLabel(x.ma)}`;
}

function sapCon(a: DongVanDeHv, b: DongVanDeHv): number {
  const ka = a.nhan === 'Khác' || a.nhan.endsWith(' · Khác') ? 1 : 0;
  const kb = b.nhan === 'Khác' || b.nhan.endsWith(' · Khác') ? 1 : 0;
  return ka - kb || b.soHv - a.soHv || a.nhan.localeCompare(b.nhan);
}

export function vanDeHv(p: Principal, f: FilterVanDeHv): VanDeHvKetQua {
  const r = tinh(p, f);
  const hang: DongVanDeHv[] = [];

  for (const [cha, cons] of r.conCua) {
    const loai = r.chaLoaiCua.get(cha)!;
    const conRows = [...cons].map((k) => {
      const x = r.nhanCon.get(k)!;
      const d = dongCoBan(r, k, nhanConCua(f.gop, k, x), 'loi');
      if (HINT_CUA_MA.has(x.ma)) d.goiY = HINT_CUA_MA.get(x.ma);
      else if (f.gop && (x.ma.endsWith('.language'))) d.goiY = GOI_Y_LANGUAGE;
      return { d, x };
    });
    conRows.sort((a, b) => sapCon(a.d, b.d));

    let nhan: string; let phu: string | null = null; let goiY: string | undefined;
    if (loai === 'ky-nang') {
      const ho = cha.slice(3) as HoKyNang;
      nhan = NHAN_HO[ho];
      const ungVien = conRows.filter((c) => !laKhac(c.x.ma));
      const nhieuNhat = ungVien.length
        ? ungVien.reduce((best, c) => (c.d.soHv > best.d.soHv || (c.d.soHv === best.d.soHv && c.d.nhan.localeCompare(best.d.nhan) < 0) ? c : best))
        : null;
      phu = nhieuNhat ? nhieuNhat.d.nhan : null;
      if (nhieuNhat && HINT_CUA_MA.has(nhieuNhat.x.ma)) goiY = HINT_CUA_MA.get(nhieuNhat.x.ma);
    } else if (loai === 'chung') {
      const g = LOI_CHUNG.find((x) => `chung:${x.khoa}` === cha)!;
      nhan = g.nhan;
      const ungVien = conRows.filter((c) => !laKhac(c.x.ma));
      const nhieuNhat = ungVien.length
        ? ungVien.reduce((best, c) => (c.d.soHv > best.d.soHv || (c.d.soHv === best.d.soHv && NHAN_HO[c.x.ho].localeCompare(NHAN_HO[best.x.ho]) < 0) ? c : best))
        : null;
      phu = nhieuNhat ? NHAN_HO[nhieuNhat.x.ho] : null;
      if (g.khoa === 'ngu-phap' || g.khoa === 'tu-vung') goiY = GOI_Y_LANGUAGE;
    } else {
      nhan = `${conRows.length} loại lỗi chỉ có ở một kỹ năng`;
      const ungVien = conRows.filter((c) => c.d.nhan !== 'Khác');
      const nhieuNhat = ungVien.length ? ungVien.reduce((best, c) => (c.d.soHv > best.d.soHv ? c : best)) : null;
      phu = nhieuNhat ? NHAN_HO[nhieuNhat.x.ho] : null;
    }
    const d = dongCoBan(r, cha, nhan, loai);
    d.phu = phu;
    if (goiY) d.goiY = goiY;
    d.con = conRows.map((c) => c.d);
    hang.push(d);
  }
  const thuTuCha = (d: DongVanDeHv) => (d.loai === 'gom' ? 2 : 0);
  const thuTuHo = (d: DongVanDeHv) => (d.loai === 'ky-nang' ? HO_THU_TU.indexOf(d.khoa.slice(3) as HoKyNang) : 0);
  hang.sort((a, b) => thuTuCha(a) - thuTuCha(b) || b.soHv - a.soHv || thuTuHo(a) - thuTuHo(b));

  const cpl = r.chuaPhanLoai;
  /* PR-SOS (K1-22): Case chưa phân loại = Case chờ xác nhận nguyên nhân — đếm số đã quá hạn (lô ≤ 400). */
  const idCpl = [...cpl.cases];
  let quaHan = 0;
  for (let i = 0; i < idCpl.length; i += 400) {
    const lo = idCpl.slice(i, i + 400);
    quaHan += (db().prepare(`SELECT COUNT(*) n FROM sos_cases WHERE id IN (${lo.map(() => '?').join(',')}) AND han_xac_nhan < ?`).get(...lo, demoToday()) as any).n;
  }
  return {
    gop: f.gop, chiChinh: f.chiChinh, tomTat: r.tomTat, hang,
    chuaPhanLoai: { case: cpl.cases.size, hv: cpl.hv.size, lop: cpl.lop.size, quaHan },
    scopeEmpty: r.scopeEmpty,
  };
}

/** Nhãn đầy đủ của một khoá dòng — cho tiêu đề ngăn danh sách ("Writing · Ngữ pháp"). */
function nhanDayDu(r: Tinh, f: FilterVanDeHv, khoa: string): string {
  if (khoa.startsWith('kn:')) {
    const [cha, ma] = khoa.split('|');
    const ho = cha.slice(3) as HoKyNang;
    return ma ? `${NHAN_HO[ho]} · ${issueLabel(ma)}` : NHAN_HO[ho];
  }
  if (khoa.startsWith('chung:')) {
    const [cha] = khoa.split('|');
    const g = LOI_CHUNG.find((x) => `chung:${x.khoa}` === cha);
    const x = r.nhanCon.get(khoa);
    return x && khoa.includes('|') ? `${g?.nhan ?? ''} · ${NHAN_HO[x.ho]}` : (g?.nhan ?? khoa);
  }
  if (khoa.startsWith('gom:mot')) {
    const x = r.nhanCon.get(khoa);
    return khoa.includes('|') ? (x ? nhanConCua(f.gop, khoa, x) : 'Khác') : 'Loại lỗi chỉ có ở một kỹ năng';
  }
  return khoa;
}

function catNgan(c: CaseInfo): string {
  const cat = (c.category ?? categoryOf(c.topic)) as CaseCategory | null;
  return cat ? CASE_CATEGORY_SHORT[cat] : '—';
}

function catMotDong(s: string, max = 60): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`, nên số và danh sách luôn khớp (G-10). */
export function oVanDeHv(p: Principal, f: FilterVanDeHv & { dong: string; cot: string }):
  { n: number; tieuDe: string; rows: MetricRow[] } {
  const r = tinh(p, f);

  if (f.dong === 'chua-phan-loai') {
    const cpl = r.chuaPhanLoai;
    if (f.cot === 'case') {
      const ids = [...cpl.cases].sort((a, b) => a - b);
      const rows = rowsFor('case', ids).map((row) => {
        const c = r.cases.get(row.id)!;
        const lop = [...(r.lopCuaHv.get(c.studentId) ?? [])].map((k) => r.maLop.get(k)).filter(Boolean).sort()[0] ?? '—';
        const sub = [lop, catNgan(c), c.owner ?? 'chưa có người phụ trách', c.openedAt ? `mở ${ngay(c.openedAt, demoToday())}` : null].filter(Boolean).join(' · ');
        return { ...row, title: row.sub.split(' · ')[0] || row.title, sub: catMotDong(sub) };
      });
      return { n: ids.length, tieuDe: `Chưa phân loại · ${ids.length} Case`, rows };
    }
    if (f.cot === 'hv') {
      const ids = [...cpl.hv].sort((a, b) => a - b);
      return { n: ids.length, tieuDe: `Chưa phân loại · ${ids.length} HV`, rows: rowsFor('hoc-vien', ids) };
    }
    if (f.cot === 'lop') return dongLop(r, [...cpl.lop], 'Chưa phân loại', (k) => [...cpl.hv].filter((h) => r.lopCuaHv.get(h)?.has(k)).length);
    throw badRequest(`Cột "${f.cot}" không có ở dòng Chưa phân loại.`);
  }

  const m = r.tap.get(f.dong);
  if (!m) throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
  const nhan = nhanDayDu(r, f, f.dong);
  if (f.cot === 'hv') return dongHv(r, m, [...m.hv.keys()], nhan);
  if (f.cot === 'lop') return dongLop(r, [...m.lop.keys()], nhan, (k) => m.lop.get(k)!.hv.size);
  /* `dongLop` bỏ lớp không có HV (chỉ có mặt ở phép so sánh) — cùng luật với `soLop`. */
  if (f.cot.startsWith('lop:')) {
    const classId = Number(f.cot.slice(4));
    const l = m.lop.get(classId);
    if (!l) throw badRequest('Lớp này không có trong dòng đang mở.');
    return dongHv(r, m, [...l.hv], `${nhan} · ${r.maLop.get(classId) ?? `#${classId}`}`, classId);
  }
  throw badRequest(`Cột "${f.cot}" không hợp lệ.`);
}

function dongLop(r: Tinh, classIds: number[], nhan: string, demHv: (k: number) => number) {
  const ids = [...classIds].filter((k) => demHv(k) > 0).sort((a, b) => (r.maLop.get(a) ?? '').localeCompare(r.maLop.get(b) ?? ''));
  const rows: MetricRow[] = ids.map((k) => ({
    id: k, title: r.maLop.get(k) ?? `#${k}`, sub: `${demHv(k)} HV`, href: `/hoc-vien/lop/${k}`,
  }));
  return { n: ids.length, tieuDe: `${nhan} · ${ids.length} lớp`, rows };
}

function dongHv(r: Tinh, m: Muc, hvIds: number[], nhan: string, classId?: number) {
  const ids = [...hvIds].sort((a, b) => a - b);
  const rows = rowsFor('hoc-vien', ids).map((row) => {
    const gan = m.hv.get(row.id)!;
    const c = r.cases.get(gan.caseId);
    const lop = classId ? r.maLop.get(classId)
      : [...(r.lopCuaHv.get(row.id) ?? [])].map((k) => r.maLop.get(k)).filter(Boolean).sort()[0];
    const dot = c?.attemptId && c.kind ? nhanDot(c.kind, c.attemptNo) : 'GV báo';
    const sub = [gan.vai === 'primary' ? 'Lỗi chính' : 'Lỗi phụ', lop, c ? `Case ${catNgan(c)}` : null, dot, c?.owner ?? null]
      .filter(Boolean).join(' · ');
    return { ...row, href: `/hoc-vien/${row.id}`, sub: catMotDong(sub) };
  });
  return { n: ids.length, tieuDe: `${nhan} · ${ids.length} HV`, rows };
}
