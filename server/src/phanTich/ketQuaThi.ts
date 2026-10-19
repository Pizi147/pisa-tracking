/**
 * KẾT QUẢ THI (OV-15e, C27 + thiết kế OV-14 mục 6, mockup 6 khung 6) — Phân tích › Kết quả thi. Một hàng = một LƯỢT (em thi 2 lần = 2 hàng).
 *   Mock Test: lượt MT (lớp FT) có tuần thi trong khoảng và đã có ít nhất một điểm — chấm bằng `resultOf` (cùng bộ máy mọi màn); Case / PA + việc tiếp
 *   theo `tomTatCase` của Đang SOS (một luật trạng thái V4).
 *   Thi thật: lộ trình FT có kết quả thi thật (đủ 4 kỹ năng hoặc Không thi) với ngày thi trong khoảng; Bước tiếp đọc / chọn bằng `buocTiep.ts`.
 * Báo cáo (`baoCao.ts`) đếm Mock bằng CHÍNH `mockTrongKhoang` → số Đạt / Chưa đạt / Chưa đủ điểm = số hàng khi bấm.
 */
import { db, theoLo } from '../db.ts';
import {
  KN_THI, NHAN_SAU_THI, PERMISSIONS, chuTargetKck, ketQuaMock, xepDongMock,
  type DongMock, type DongThiThat, type KetQuaMock, type KetQuaMockKq, type KetQuaThiThatKq, type LuaChonSauThi, type XepMock,
} from '../../../shared/domain/index.ts';
import { forbidden } from '../util.ts';
import { classScopeSql, coQuyenBuocTiep, scopeFor, type Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { loadBundle, resultOf } from '../fasttrack/attempts.ts';
import { listCases } from '../cases/cases.ts';
import { tomTatCase } from '../classes/hocVienSos.ts';
import { luotTrongKhoang } from './tongHop.ts';

export type LocKetQuaThi = { branchId?: number | null; classId?: number | null; tu: string; den: string };

function phamVi(p: Principal) {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW);
  if (scope.none) throw forbidden('Phân tích dành cho Quản lý.');
  return scope;
}

const NHAN_KN_NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

/** Lượt Mock (lớp FT) trong khoảng đã có ít nhất một band, trong phạm vi Phân tích — tập chung của tab Kết quả thi và khối Mock của Báo cáo. */
export function luotMockKhoang(p: Principal, f: LocKetQuaThi): any[] {
  const cs = classScopeSql(phamVi(p));
  const where = [cs.sql, `a.status != 'cancelled'`, `a.kind = 'mock'`, 'c.is_fast_track = 1', 'rp.week_start >= ?', 'rp.week_start <= ?',
    `EXISTS (SELECT 1 FROM assessment_scores sx WHERE sx.attempt_id = a.id AND sx.band IS NOT NULL)`];
  const args: unknown[] = [...cs.params, mondayOf(f.tu), mondayOf(f.den)];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  if (f.classId) { where.push('c.id = ?'); args.push(f.classId); }
  return luotTrongKhoang(where.join(' AND '), args);
}

/** Chấm các lượt Mock thành dòng Kết quả thi. `luot` truyền sẵn (Báo cáo) thì không đọc lại; `boCase`: chỉ đếm kết quả, không nạp Case / PA. */
export function mockTrongKhoang(p: Principal, f: LocKetQuaThi, o: { luot?: any[]; boCase?: boolean } = {}): DongMock[] {
  const luot = o.luot ?? luotMockKhoang(p, f);
  if (!luot.length) return [];
  const conn = db();
  const ten = new Map<number, string>();
  theoLo([...new Set(luot.map((a) => a.student_id as number))], (lo, ph) => {
    for (const s of conn.prepare(`SELECT id, full_name FROM students WHERE id IN (${ph})`).all(...lo) as any[]) ten.set(s.id, s.full_name);
  });
  const bundle = loadBundle(luot.map((a) => a.id));
  const kq = new Map(luot.map((a) => [a.id as number, resultOf(a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], bundle.skillRows.get(a.id) ?? [])]));

  /* Case của lượt (sinh từ lượt) — chỉ chi nhánh có lượt SOS, một `listCases` mỗi chi nhánh như Đang SOS. */
  const coSos = o.boCase ? [] : luot.filter((a) => (kq.get(a.id)!.sosLevel ?? 0) > 0 || kq.get(a.id)!.kckDuoi);
  const idLuot = new Set(coSos.map((a) => a.id as number));
  const cases = [...new Set(coSos.map((a) => a.branch_id as number))]
    .flatMap((b) => listCases(p, { branchId: b }).rows).filter((c) => c.attemptId !== null && idLuot.has(c.attemptId));
  const tt = tomTatCase(cases);
  const caseCua = new Map<number, (typeof cases)[number]>();
  for (const c of cases) if (!caseCua.has(c.attemptId!) || c.status !== 'done') caseCua.set(c.attemptId!, c);

  return luot.map((a): DongMock => {
    const r = kq.get(a.id)!;
    const ket: KetQuaMock = ketQuaMock(r.overall, r.expectation);
    const c = caseCua.get(a.id);
    const t = c ? tt.get(c.id) : undefined;
    const thieu = r.verdicts.filter((v) => v.required && v.band === null).map((v) => NHAN_KN_NGAN[v.skill] ?? v.skill);
    const viecTiep = t?.viecTiep ? [t.viecTiep.chu, c?.ownerName].filter(Boolean).join(' · ')
      : ket === 'chua-du' && thieu.length ? `Nhập điểm ${thieu.join(', ')}` : null;
    return {
      attemptId: a.id, studentId: a.student_id, ten: ten.get(a.student_id) ?? '', classId: a.class_id, lop: a.class_code ?? '', mt: a.attempt_no, tuan: a.week_start,
      ovr: r.overall, kyVong: r.expectation,
      kn: Object.fromEntries(KN_THI.map((k) => {
        const v = r.verdicts.find((x) => x.skill === k);
        return [k, { band: v?.band ?? null, dat: v?.passed ?? null }];
      })) as DongMock['kn'],
      ketQua: ket, sos: r.sosLevel && r.sosLevel > 0 ? r.sosLevel : null, sosTam: !!r.provisional && (r.sosLevel ?? 0) > 0,
      casePa: t?.trangThai ?? null, caseId: c?.id ?? null, viecTiep,
    };
  });
}

export function ketQuaMockKq(p: Principal, f: LocKetQuaThi & { xep?: XepMock; kq?: KetQuaMock | null }): KetQuaMockKq {
  const tat = mockTrongKhoang(p, f);
  const dem = (k: KetQuaMock) => tat.filter((r) => r.ketQua === k).length;
  const sos = (n: number) => tat.filter((r) => r.sos === n).length;
  const rows = xepDongMock(f.kq ? tat.filter((r) => r.ketQua === f.kq) : tat, f.xep ?? 'lop');
  return {
    loai: 'mock', tu: f.tu, den: f.den, rows,
    tong: { luot: tat.length, hv: new Set(tat.map((r) => r.studentId)).size, dat: dem('dat'), chuaDat: dem('chua-dat'), chuaDu: dem('chua-du'), sos1: sos(1), sos2: sos(2), sos3: sos(3) },
  };
}

/**
 * Thi thật: lộ trình FT có kết quả (đủ 4 kỹ năng / Không thi) với ngày thi trong khoảng; lớp = lớp của lượt MT cuối của lộ trình (một câu theo lô),
 * không có lượt → ghi danh cuối. Phạm vi: lớp trong `classScopeSql` của quyền Phân tích.
 * ponytail: `coQuyenBuocTiep` hỏi quyền theo từng em — bảng thi thật một khoảng chỉ vài chục hàng.
 */
export function ketQuaThiThatKq(p: Principal, f: LocKetQuaThi): KetQuaThiThatKq {
  const scope = phamVi(p);
  const conn = db();
  const ds = conn.prepare(
    `SELECT c.id, c.student_id, s.full_name AS ten, c.thi_that_ngay, c.thi_that_l, c.thi_that_r, c.thi_that_w, c.thi_that_s, c.thi_that_khong_thi,
            c.outcome, c.outcome_score, c.target_score, c.khong_cam_ket, c.buoc_tiep, c.buoc_tiep_luc, c.buoc_tiep_json, u.full_name AS nguoi_chon
       FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN users u ON u.id = c.buoc_tiep_boi
      WHERE c.route IS NOT NULL AND c.thi_that_ngay BETWEEN ? AND ?
        AND (c.thi_that_khong_thi = 1 OR (c.thi_that_l IS NOT NULL AND c.thi_that_r IS NOT NULL AND c.thi_that_w IS NOT NULL AND c.thi_that_s IS NOT NULL))`,
  ).all(f.tu, f.den) as any[];
  /* Lớp: lượt cuối của lộ trình, không có thì ghi danh cuối của em — hai câu theo lô. */
  const lopCua = new Map<number, number>();
  theoLo(ds.map((c) => c.id as number), (lo, ph) => {
    for (const r of conn.prepare(`SELECT cycle_id, class_id FROM assessment_attempts WHERE id IN (SELECT MAX(id) FROM assessment_attempts WHERE cycle_id IN (${ph}) GROUP BY cycle_id)`).all(...lo) as any[]) lopCua.set(r.cycle_id, r.class_id);
  });
  const thieu = ds.filter((c) => !lopCua.has(c.id));
  theoLo([...new Set(thieu.map((c) => c.student_id as number))], (lo, ph) => {
    const cuoi = new Map<number, number>();
    for (const r of conn.prepare(`SELECT student_id, class_id FROM enrollments WHERE id IN (SELECT MAX(id) FROM enrollments WHERE student_id IN (${ph}) GROUP BY student_id)`).all(...lo) as any[]) cuoi.set(r.student_id, r.class_id);
    for (const c of thieu) if (cuoi.has(c.student_id)) lopCua.set(c.id, cuoi.get(c.student_id)!);
  });
  const lop = new Map<number, { code: string; branch: number }>();
  theoLo([...new Set(lopCua.values())], (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, code, branch_id FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) lop.set(r.id, { code: r.code, branch: r.branch_id });
  });
  const rows: DongThiThat[] = ds.filter((c) => {
    const l = lopCua.get(c.id);
    const x = l ? lop.get(l) : undefined;
    if (!x) return false;
    if (f.branchId && x.branch !== f.branchId) return false;
    if (f.classId && l !== f.classId) return false;
    return scope.all || scope.branchIds.includes(x.branch) || scope.classIds.includes(l!);
  }).map((c) => {
    const l = lopCua.get(c.id)!;
    const g = JSON.parse(c.buoc_tiep_json ?? '{}');
    const chon = (c.buoc_tiep ?? null) as LuaChonSauThi | null;
    return {
      cycleId: c.id, studentId: c.student_id, ten: c.ten, classId: l, lop: lop.get(l)!.code, ngayThi: c.thi_that_ngay ?? null, khongThi: !!c.thi_that_khong_thi,
      ovr: c.outcome_score ?? null, l: c.thi_that_l ?? null, r: c.thi_that_r ?? null, w: c.thi_that_w ?? null, s: c.thi_that_s ?? null,
      target: chuTargetKck(c.target_score ?? null, !!c.khong_cam_ket),
      dat: c.thi_that_khong_thi ? null : c.outcome === 'reached' ? true : c.outcome === 'not_reached' ? false : null,
      buocTiep: chon, buocTiepChu: chon ? NHAN_SAU_THI[chon] : null, buocTiepPhu: g.lopMoiCode ? `lớp ${g.lopMoiCode}` : null,
      nguoiChon: chon ? c.nguoi_chon ?? null : null, ngayChon: chon ? c.buoc_tiep_luc ?? null : null,
      coTheChon: coQuyenBuocTiep(p, c.student_id),
    };
  }).sort((a, b) => (a.lop ?? '').localeCompare(b.lop ?? '', 'vi', { numeric: true }) || (a.ngayThi ?? '').localeCompare(b.ngayThi ?? '') || a.ten.localeCompare(b.ten, 'vi'));
  return {
    loai: 'thi-that', tu: f.tu, den: f.den, rows,
    tong: {
      luot: rows.length, hv: new Set(rows.map((r) => r.studentId)).size, dat: rows.filter((r) => r.dat === true).length,
      chuaDat: rows.filter((r) => r.dat === false).length, chuaChon: rows.filter((r) => !r.buocTiep).length,
    },
  };
}
