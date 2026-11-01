/**
 * KẾT QUẢ THI (OV-15e, C27 + thiết kế OV-14 mục 6, mockup 6 khung 6) — Phân tích › Kết quả thi. Một hàng = một LƯỢT (em thi 2 lần = 2 hàng).
 *   Mock Test: lượt MT (lớp FT) có tuần thi trong khoảng và đã có ít nhất một điểm — chấm bằng `resultOf` (cùng bộ máy mọi màn); Case / PA + việc tiếp
 *   theo `tomTatCase` của Đang SOS (một luật trạng thái V4).
 *   Thi thật: lộ trình FT có kết quả thi thật (đủ 4 kỹ năng hoặc Không thi) với ngày thi trong khoảng; Bước tiếp đọc / chọn bằng `buocTiep.ts`.
 * Báo cáo (`baoCao.ts`) đếm Mock bằng CHÍNH `mockTrongKhoang` → số Đạt / Chưa đạt / Chưa đủ điểm = số hàng khi bấm.
 */
import { DS_JSON, db, theoLo, theoLoJson } from '../db.ts';
import {
  KN_THI, NHAN_SAU_THI, kyNangDaBo, boMonDaBo, PERMISSIONS, chuTargetKck, ketQuaMock, tuanLich, xepDongMock,
  type DongMock, type DongThiThat, type KetQuaMock, type KetQuaMockKq, type KetQuaThiThatKq, type LoaiThi, type LuaChonSauThi, type XepMock,
} from '../../../shared/domain/index.ts';
import { t as tl } from '../../../shared/i18n/index.ts';
import { badRequest, forbidden } from '../util.ts';
import { diemTuMock } from '../worklist/diemDong.ts';
import type { MetricRow } from '../worklist/metrics.ts';
import { nhoTheoId } from '../platform/nguCanhRequest.ts';
import { classScopeSql, coQuyenBuocTiep, scopeFor, type Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { diemCuaLuot, loadBundle, resultOf } from '../fasttrack/attempts.ts';
import { listCases } from '../cases/cases.ts';
import { tomTatCase } from '../classes/hocVienSos.ts';
import { luotTrongKhoang } from './tongHop.ts';
import { lopLucThiThat } from './lopLucThi.ts';

export type LocKetQuaThi = { branchId?: number | null; classId?: number | null; tu: string; den: string };

function phamVi(p: Principal) {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW);
  if (scope.none) throw forbidden('Phân tích dành cho Quản lý.');
  return scope;
}

const NHAN_KN_NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

/**
 * Lượt Mock (lớp FT) trong khoảng, trong phạm vi Phân tích. "Đã có ít nhất một band" lọc ở `mockTrongKhoang` sau khi nạp điểm (không EXISTS theo từng lượt).
 * `kemMt0` (TL-TQ): thêm MT0 mọi lớp — tập của Kết quả MT, Tổng quan đọc chung một lần với Đạt MT.
 */
export function luotMockKhoang(p: Principal, f: LocKetQuaThi, kemMt0 = false): any[] {
  const cs = classScopeSql(phamVi(p));
  const where = [cs.sql, `a.status != 'cancelled'`, kemMt0 ? `(a.kind = 'mt0' OR (a.kind = 'mock' AND c.is_fast_track = 1))` : `a.kind = 'mock' AND c.is_fast_track = 1`, 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const args: unknown[] = [...cs.params, mondayOf(f.tu), mondayOf(f.den)];
  if (f.branchId) { where.push('c.branch_id = ?'); args.push(f.branchId); }
  if (f.classId) { where.push('c.id = ?'); args.push(f.classId); }
  return luotTrongKhoang(where.join(' AND '), args);
}

/**
 * Chấm các lượt Mock ĐÃ CÓ ÍT NHẤT MỘT BAND thành dòng Kết quả thi. `luot` truyền sẵn (Báo cáo) thì không đọc lại; `boCase`: chỉ đếm kết quả, không nạp Case / PA.
 * Điểm nạp một lần (`diemCuaLuot`, nhớ theo lượt trong request — `loadBundle` dưới dùng lại).
 */
export function mockTrongKhoang(p: Principal, f: LocKetQuaThi, o: { luot?: any[]; boCase?: boolean } = {}): DongMock[] {
  const tat = o.luot ?? luotMockKhoang(p, f);
  const diem = diemCuaLuot(tat.map((a) => a.id));
  const luot = tat.filter((a) => diem.get(a.id)?.some((s) => s.band !== null));
  if (!luot.length) return [];
  /* TL-TQ: tên nhớ theo em trong request — Đạt MT, Kết quả MT, Báo cáo hỏi lại cùng các em. */
  const ten = nhoTheoId('ten-hv:', [...new Set(luot.map((a) => a.student_id as number))], (thieu) => {
    const m = new Map<number, { full_name: string }[]>();
    theoLoJson(thieu, (json) => {
      for (const s of db().prepare(`SELECT id, full_name FROM students WHERE id IN (${DS_JSON})`).all(json) as any[]) m.set(s.id, [s]);
    });
    return m;
  });
  const bundle = loadBundle(luot.map((a) => a.id), { boCase: true });   // TL-TQ: Case đọc riêng qua `listCases` bên dưới
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
      attemptId: a.id, studentId: a.student_id, ten: ten.get(a.student_id)?.[0].full_name ?? '', classId: a.class_id, lop: a.class_code ?? '', mt: a.attempt_no, tuan: a.week_start,
      ovr: r.overall, kyVong: r.expectation,
      /* PANEL-MC: môn em đã bỏ (P8, `kyNangDaBo` — cùng luật mức SOS) không ✓ / ✗. */
      kn: Object.fromEntries(KN_THI.map((k) => {
        const v = r.verdicts.find((x) => x.skill === k);
        return [k, { band: v?.band ?? null, dat: kyNangDaBo(boMonDaBo(bundle.skips.get(a.id) ?? []), k) ? null : v?.passed ?? null }];
      })) as DongMock['kn'],
      ketQua: ket, sos: r.sosLevel && r.sosLevel > 0 ? r.sosLevel : null, sosTam: !!r.provisional && (r.sosLevel ?? 0) > 0, chot: r.chot,
      casePa: t?.trangThai ?? null, caseId: c?.id ?? null, viecTiep,
    };
  });
}

/** "05/09" từ ISO ngày thi (thẻ / panel thi thật). */
const ngayNgan = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
const dongMockPanel = (d: DongMock): MetricRow => ({
  id: d.attemptId, title: d.ten, sub: `${d.lop} · MT${d.mt} · ${tuanLich(d.tuan)}`, href: `/hoc-vien/${d.studentId}`, diemHv: diemTuMock(d),
});
export const dongThiPanel = (d: DongThiThat): MetricRow => {
  const target = d.target === null ? null : Number(d.target);
  return {
    id: d.cycleId, title: d.ten, sub: [d.lop, d.khongThi ? tl('Không thi') : ngayNgan(d.ngayThi), d.buocTiepChu ?? tl('Bước tiếp chưa chọn')].filter(Boolean).join(' · '), href: `/hoc-vien/${d.studentId}`,
    diemHv: {
      luot: tl('Thi thật'), tuan: d.ngayThi, tam: false, overall: d.ovr, soVoi: target === null || Number.isNaN(target) ? null : { nhan: 'Target', v: target },
      kn: ([['L', d.l], ['R', d.r], ['W', d.w], ['S', d.s]] as const).map(([k, v]) => ({ k, v, dat: null })),
    },
  };
};
const CHON_MOCK: Record<string, (d: DongMock) => boolean> = {
  luot: () => true, dat: (d) => d.ketQua === 'dat', 'chua-dat': (d) => d.ketQua === 'chua-dat', 'chua-du': (d) => d.ketQua === 'chua-du',
  sos1: (d) => d.sos === 1, sos2: (d) => d.sos === 2, sos3: (d) => d.sos === 3,
};
const CHON_THI: Record<string, (d: DongThiThat) => boolean> = {
  luot: () => true, dat: (d) => d.dat === true, 'chua-dat': (d) => d.dat === false, 'chua-chon': (d) => !d.buocTiep,
};

/**
 * V8-PT-2: danh sách của MỘT thẻ chỉ số Kết quả Test (chạy khi MỞ, 0 câu khi vẽ) — lọc CHÍNH dòng sinh ra `tong` nên số = số dòng (G-10), một dòng một lượt
 * như thẻ đếm. Mock bỏ nạp Case (`boCase` — thẻ chỉ cần kết quả, SOS); Thi thật bỏ hỏi quyền chọn bước.
 */
export function oKetQuaThi(p: Principal, f: LocKetQuaThi & { loai: LoaiThi; o: string }): { n: number; tieuDe: string; unit: 'luot-sos'; rows: MetricRow[] } {
  const thi = f.loai === 'thi-that';
  const chon = (thi ? CHON_THI : CHON_MOCK)[f.o];
  if (!chon) throw badRequest('Số này không có trong Kết quả Test — có thể bộ lọc vừa đổi.');
  const rows = thi ? ketQuaThiThatKq(p, f, { boQuyen: true }).rows.filter(chon as (d: DongThiThat) => boolean).map(dongThiPanel)
    : xepDongMock(mockTrongKhoang(p, f, { boCase: true }).filter(chon as (d: DongMock) => boolean), 'lop').map(dongMockPanel);
  return { n: rows.length, tieuDe: `${rows.length} lượt`, unit: 'luot-sos', rows };
}

export function ketQuaMockKq(p: Principal, f: LocKetQuaThi & { xep?: XepMock; kq?: KetQuaMock | null }): KetQuaMockKq {
  const tat = mockTrongKhoang(p, f);
  const dem = (k: KetQuaMock) => tat.filter((r) => r.ketQua === k).length;
  const sos = (n: number) => tat.filter((r) => r.sos === n).length;
  const rows = xepDongMock(f.kq ? tat.filter((r) => r.ketQua === f.kq) : tat, f.xep ?? 'lop');
  return {
    loai: 'mock', tu: f.tu, den: f.den, rows,
    tong: { luot: tat.length, hv: new Set(tat.map((r) => r.studentId)).size, dat: dem('dat'), chuaDat: dem('chua-dat'), chuaDu: dem('chua-du'), sos1: sos(1), sos2: sos(2), sos3: sos(3), sosTam: tat.filter((r) => r.sosTam).length },
  };
}

/**
 * Lộ trình FT có kết quả thi thật trong khoảng (4 tham số: tu, den, tu, den). Có điểm → ngày thi thật; "Không thi" không có ngày thi thật
 * (`thi_that_ngay` NULL) → ngày thi dự kiến (`exam_date`). Hai vế OR, mỗi vế một chỉ mục một phần (`idx_cycle_thi_that_ngay`, `idx_cycle_khong_thi`).
 */
export const SQL_THI_THAT = `SELECT c.id, c.student_id, s.full_name AS ten, COALESCE(c.thi_that_ngay, c.exam_date) AS ngay_thi, c.thi_that_l, c.thi_that_r, c.thi_that_w, c.thi_that_s,
            c.thi_that_khong_thi, c.outcome, c.outcome_score, COALESCE(c.thi_that_target, c.target_score) AS target_score, c.khong_cam_ket, c.buoc_tiep, c.buoc_tiep_luc, c.buoc_tiep_json, u.full_name AS nguoi_chon
       FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN users u ON u.id = c.buoc_tiep_boi
      WHERE c.route IS NOT NULL
        AND ((c.thi_that_ngay BETWEEN ? AND ? AND c.thi_that_l IS NOT NULL AND c.thi_that_r IS NOT NULL AND c.thi_that_w IS NOT NULL AND c.thi_that_s IS NOT NULL)
          OR (c.thi_that_khong_thi = 1 AND c.exam_date BETWEEN ? AND ?))`;

/**
 * Thi thật: lộ trình FT có kết quả (đủ 4 kỹ năng / Không thi) với ngày thi trong khoảng; lớp = lớp LÚC THI (`lopLucThiThat`, P12); Target = Target lúc
 * nhập KQ (`thi_that_target`, NULL → hiện tại). Phạm vi: lớp trong `classScopeSql` của quyền Phân tích.
 * ponytail: `coQuyenBuocTiep` hỏi quyền theo từng em — bảng thi thật một khoảng chỉ vài chục hàng. `boQuyen` (Kết quả MT chỉ đếm): không hỏi, `coTheChon` false.
 */
export function ketQuaThiThatKq(p: Principal, f: LocKetQuaThi, o: { boQuyen?: boolean } = {}): KetQuaThiThatKq {
  const scope = phamVi(p);
  const conn = db();
  const ds = conn.prepare(SQL_THI_THAT).all(f.tu, f.den, f.tu, f.den) as any[];
  /* P12 (E7): lớp LÚC THI — cùng luật Phân tích GV (`lopLucThiThat`). */
  const lopCua = lopLucThiThat(ds.map((c) => ({ id: c.id, student_id: c.student_id, ngay: c.ngay_thi ?? null })));
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
      cycleId: c.id, studentId: c.student_id, ten: c.ten, classId: l, lop: lop.get(l)!.code, ngayThi: c.ngay_thi ?? null, khongThi: !!c.thi_that_khong_thi,
      ovr: c.outcome_score ?? null, l: c.thi_that_l ?? null, r: c.thi_that_r ?? null, w: c.thi_that_w ?? null, s: c.thi_that_s ?? null,
      target: chuTargetKck(c.target_score == null ? null : Number(c.target_score).toFixed(1), !!c.khong_cam_ket),   // một chữ số lẻ như OVR: 6 → "6.0"
      dat: c.thi_that_khong_thi ? null : c.outcome === 'reached' ? true : c.outcome === 'not_reached' ? false : null,
      buocTiep: chon, buocTiepChu: chon ? NHAN_SAU_THI[chon] : null, buocTiepPhu: g.lopMoiCode ? `lớp ${g.lopMoiCode}` : null,
      nguoiChon: chon ? c.nguoi_chon ?? null : null, ngayChon: chon ? c.buoc_tiep_luc ?? null : null,
      coTheChon: !o.boQuyen && coQuyenBuocTiep(p, c.student_id),
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
