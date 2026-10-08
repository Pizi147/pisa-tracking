import { db } from '../db.ts';
import {
  INTERVENTION_KIND_LABEL, NGUONG_IT_DU_LIEU, NHAN_HO_KY_NANG, hoKyNang, issueBranchOf, issueLabel, loiKhoangTuan, mondayOfDate, nenDung,
  tuDauKhoang, tuanTrungVi,
  type ChuongTrinh, type DongHieuQuaPa, type HieuQuaPaKetQua, type HoKyNang, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, HttpError } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { planOutcomes, planOutcomesUnattributed } from '../cases/effectiveness.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { phamViHoSoGv } from '../giaoVien/phamVi.ts';
import { phamViPhanTich } from './phamVi.ts';

/**
 * HIỆU QUẢ PA (PR-UX4, Q9–Q13; PR-Pb2-a T61, K1-23, P9, P9b) — hai phần:
 *   - PA DO GIÁO VIÊN THÊM (`preset = 0`): với từng VẤN ĐỀ (mã lỗi chính của Case), loại PA nào giúp em cải thiện; giữ "Nên dùng".
 *   - PA THEO QUY CHẾ (`preset = 1`, gồm Bổ trợ): FT theo SOS 1·2·3 → loại PA; lớp thường Bổ trợ Giữa khoá / sau Cuối khoá. Không xếp hạng.
 * Khuôn như `tongHop.ts`: `tinh()` giữ tập PA, bảng đọc độ dài, `oHieuQuaPa()` mở danh sách bằng chính `tinh()` — số và danh sách không lệch (G-10).
 */

/** CHỮ KÝ CHỐT (Hợp đồng a↔b): Pb2-b gọi `paCoKetQua` cho cột "PA hiệu quả". Không đổi tên/trường. */
export type LocPa = {
  branchIds: number[] | null; ct: ChuongTrinh; classId?: number | null;
  /** Thứ Hai tuần đầu / tuần cuối (gồm cả tuần `den`); `den = null` = tới hôm nay. */
  tu: string; den: string | null;
  /** Chỉ PA của Case do người này phụ trách (`sos_cases.owner_user_id`). */
  gv?: number | null;
};
type Plan = ReturnType<typeof planOutcomes>[number];
export type PaHieuQua = Plan & { quyChe: boolean; chuCase: number | null; sos: number | null; boTroSau: boolean };

/** Mọi PA đã kết thúc trong khoảng (theo ngày kết thúc PA — luật `planOutcomes`, Q16), gán theo nơi em học lúc làm PA (F03). */
function paTrongKhoang(l: LocPa): Plan[] {
  const all = planOutcomes({
    branchIds: l.branchIds, ratio: l.ct === 'thuong', classId: l.classId ?? null,
    fromDate: l.tu, toDate: l.den ? addDays(l.den, 6) : null,
  });
  return l.gv ? all.filter((r) => r.chuCase === l.gv) : all;
}

/** PA CÓ KẾT QUẢ (tiến bộ / không) trong phạm vi — MỘT hàm cho Hiệu quả PA lọc `gv` và cột "PA hiệu quả" của bảng giáo viên. */
export function paCoKetQua(l: LocPa): PaHieuQua[] {
  return paTrongKhoang(l).filter((r) => r.group !== 'undetermined').map((r) => ({ ...r, boTroSau: !!r.nhomBoTro?.startsWith('mt:') }));
}

export type FilterHieuQuaPa = {
  branchId?: number | null; ct: ChuongTrinh; classId?: number | null; soTuan: number;
  /** Tham số URL thô (Hợp đồng): `gv` = id người dùng; `tu`/`den` thắng `tg`. */
  gv?: string | number | null; tu?: string | null; den?: string | null;
};

function chunks<T>(list: T[]): T[][] {
  return Array.from({ length: Math.ceil(list.length / 400) }, (_, i) => list.slice(i * 400, i * 400 + 400));
}
const ngayGiua = (tu: string, den: string) =>
  Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86400000);

/**
 * "Chạy cùng PA khác" (P9b): PA có khoảng [bắt đầu, kết thúc] chồng lên một PA khác của CÙNG Case.
 * ponytail: chỉ xét PA có kết quả trong phạm vi đang xem (PA ngoài khoảng / chưa ghi kết quả không đếm) — đủ để đọc "k PA chạy cùng PA khác".
 */
function dongThoiCua(pa: Plan[]): Set<number> {
  const theoCase = new Map<number, Plan[]>();
  for (const x of pa) (theoCase.get(x.caseId) ?? theoCase.set(x.caseId, []).get(x.caseId)!).push(x);
  const out = new Set<number>();
  for (const ds of theoCase.values()) {
    for (const a of ds) for (const b of ds) {
      if (a.id >= b.id) continue;
      const [a0, a1, b0, b1] = [a.startedOn ?? a.day, a.day, b.startedOn ?? b.day, b.day].map((s) => s.slice(0, 10));
      if (a0 <= b1 && b0 <= a1) { out.add(a.id); out.add(b.id); }
    }
  }
  return out;
}

/** Đọc + kiểm bộ lọc (400 khi `gv`/`tu`/`den` sai). `gv` ngoài phạm vi người xem → rỗng, không lộ số (phủ định). */
function docLoc(p: Principal, f: FilterHieuQuaPa) {
  const pv = phamViPhanTich(p, f.branchId ?? null, f.classId ?? null);
  const today = demoToday();
  let tu: string; let den: string | null = null; let theoKhoang = false;
  if (f.tu || f.den) {
    if (!f.tu) throw badRequest('Thiếu tuần đầu của khoảng.');
    den = f.den || null;
    const loi = loiKhoangTuan(f.tu, den ?? mondayOfDate(today));
    if (loi) throw badRequest(loi);
    tu = f.tu; theoKhoang = true;
  } else tu = tuDauKhoang(today, Math.min(Math.max(f.soTuan, 1), 52));

  let gv: { id: number; ten: string } | null = null; let rong = false;
  if (f.gv !== undefined && f.gv !== null && f.gv !== '') {
    const id = Number(f.gv);
    if (!Number.isInteger(id) || id <= 0) throw badRequest('Giáo viên không hợp lệ.');
    try {
      phamViHoSoGv(p, id);
      gv = { id, ten: (db().prepare(`SELECT full_name FROM users WHERE id = ?`).get(id) as any).full_name as string };
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      rong = true;   // GV không tồn tại / ngoài chi nhánh người xem được → bảng rỗng
    }
  }
  const l: LocPa = {
    branchIds: f.branchId ? [f.branchId] : (pv.scope.all ? null : pv.scope.branchIds),
    ct: f.ct, classId: f.classId ?? null, tu, den, gv: gv?.id ?? null,
  };
  return { l, rong, scopeEmpty: pv.scopeEmpty, loc: { gv, tu, den, theoKhoang } };
}

const NHAN_QUY_CHE: Record<string, string> = {
  'qc:sos1': 'SOS 1', 'qc:sos2': 'SOS 2', 'qc:sos3': 'SOS 3',
  'qc:gk': 'Bổ trợ Progress Test', 'qc:mt': 'Bổ trợ sau Final Test', 'qc:khac': 'PA theo quy chế khác',
};
const THU_TU_QUY_CHE = Object.keys(NHAN_QUY_CHE);
/** PR-S6F-a Q8: hàng con (loại PA) của khối quy chế theo thứ tự cố định — không xếp theo số PA. */
const THU_TU_LOAI = Object.keys(INTERVENTION_KIND_LABEL);
/** PR-S6F-a Q20: PA GV thêm của Case chưa có lỗi chính — một hàng riêng để Σ hàng = tóm tắt = `paCoKetQua` (cột "PA hiệu quả" bảng GV). */
const KHOA_CHUA_PHAN_LOAI = 'chua-phan-loai';
/* ponytail: FT xếp theo mức SOS HIỆN TẠI của Case (Q22) — Case trượt lại thì PA cũ hiện ở hàng mức mới; ghi mức vào PA lúc sinh nếu cần mức lúc chạy. */
function khoaQuyChe(r: Plan, ct: ChuongTrinh): string {
  if (ct === 'ft') return r.sos && r.sos > 0 ? `qc:sos${Math.min(r.sos, 3)}` : 'qc:khac';
  if (r.nhomBoTro?.startsWith('gk:')) return 'qc:gk';
  if (r.nhomBoTro?.startsWith('mt:')) return 'qc:mt';
  return 'qc:khac';
}
const nhanKind = (kind: string) => INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind;

function tinh(p: Principal, f: FilterHieuQuaPa) {
  const d = docLoc(p, f);
  const tap = new Map<string, Plan[]>();
  const nhan = new Map<string, string>();
  const conCua = new Map<string, Set<string>>();
  const maCua = new Map<string, { ma: string; ho: HoKyNang }>();
  const caseChuaPhanLoai = new Set<number>();
  const them = (khoa: string, ten: string, r: Plan, cha?: string) => {
    (tap.get(khoa) ?? tap.set(khoa, []).get(khoa)!).push(r);
    nhan.set(khoa, ten);
    if (cha) (conCua.get(cha) ?? conCua.set(cha, new Set()).get(cha)!).add(khoa);
  };
  if (d.rong) return { ...d, tap, nhan, conCua, maCua, caseChuaPhanLoai, chuaGhiIds: [] as number[], chuaRoNguonIds: [] as number[], dongThoi: new Set<number>() };

  const tatCa = paTrongKhoang(d.l);
  const rows = tatCa.filter((r) => r.group !== 'undetermined');
  /* Đúng luật của `plansNeedingEvaluation` (PA đã bị thay không tính) nhưng dùng lại CÙNG kết quả `planOutcomes` — không truy vấn lần hai. */
  const chuaGhiIds = tatCa.filter((r) => r.group === 'undetermined' && !r.supersededBy).map((r) => r.id);
  const gvThem = rows.filter((r) => !r.quyChe);

  // Lỗi chính của các Case (PA GV thêm) — MỘT câu theo lô 400, lấy dòng có id nhỏ nhất.
  const loiChinh = new Map<number, string>();
  for (const chunk of chunks([...new Set(gvThem.map((r) => r.caseId))])) {
    for (const r of db().prepare(
      `SELECT case_id, taxonomy_code FROM case_issues
        WHERE role = 'primary' AND case_id IN (${chunk.map(() => '?').join(',')}) ORDER BY id DESC`,
    ).all(...chunk) as any[]) loiChinh.set(r.case_id, r.taxonomy_code);   // id giảm dần → dòng cuối ghi đè = id nhỏ nhất
  }
  for (const r of gvThem) {
    const ma0 = loiChinh.get(r.caseId);
    const ho = hoKyNang(ma0 ? issueBranchOf(ma0) : null) ?? hoKyNang(r.category);
    if (!ho && (r.category === 'tong_hop' || issueBranchOf(ma0) === 'tong_hop')) continue;   // Pre FOU không thuộc họ kỹ năng
    const ma = ma0 && issueBranchOf(ma0) ? ma0 : ho && ma0 ? `student.${ho}.other` : null;
    if (!ma || !ho) { caseChuaPhanLoai.add(r.caseId); them(KHOA_CHUA_PHAN_LOAI, 'Case chưa chọn nhóm nguyên nhân', r); continue; }
    const cha = `vd:${ma}`;
    them(cha, `${NHAN_HO_KY_NANG[ho]} · ${issueLabel(ma)}`, r);
    them(`${cha}|${r.kind}`, nhanKind(r.kind), r, cha);
    maCua.set(cha, { ma, ho });
  }
  for (const r of rows.filter((x) => x.quyChe)) {
    const cha = khoaQuyChe(r, d.l.ct);
    them(cha, NHAN_QUY_CHE[cha], r);
    if (d.l.ct === 'ft') them(`${cha}|${r.kind}`, nhanKind(r.kind), r, cha);   // lớp thường: một loại PA mỗi hàng, không tách con
  }

  /* P9: PA có kết quả mà không biết em học ở đâu lúc đó — không vào bảng nào, chỉ ở chân bảng. */
  const chuaRoNguonIds = planOutcomesUnattributed({
    branchIds: d.l.branchIds, ratio: d.l.ct === 'thuong', classId: d.l.classId ?? null, fromDate: d.l.tu, toDate: d.l.den ? addDays(d.l.den, 6) : null,
  }).filter((r) => r.group !== 'undetermined' && (!d.l.gv || r.chuCase === d.l.gv)).map((r) => r.id);

  return { ...d, tap, nhan, conCua, maCua, caseChuaPhanLoai, chuaGhiIds, chuaRoNguonIds, dongThoi: dongThoiCua(rows) };
}

type Tinh = ReturnType<typeof tinh>;

function dongOf(r: Tinh, khoa: string): DongHieuQuaPa {
  const pa = r.tap.get(khoa)!;
  const cai = pa.filter((x) => x.group === 'success');
  const soPa = pa.length;
  const itDuLieu = soPa < NGUONG_IT_DU_LIEU;
  const ngay = cai.filter((x) => x.startedOn && x.outcomeOn).map((x) => Math.max(0, ngayGiua(x.startedOn!, x.outcomeOn!)));
  return {
    khoa, nhan: r.nhan.get(khoa)!, soPa, caiThien: cai.length, hocVien: new Set(pa.map((x) => x.studentId)).size,
    itDuLieu, tvTuan: itDuLieu ? null : tuanTrungVi(ngay), dongThoi: pa.filter((x) => r.dongThoi.has(x.id)).length, nenDung: false,
  };
}
const xepSo = (a: DongHieuQuaPa, b: DongHieuQuaPa) => b.soPa - a.soPa || a.nhan.localeCompare(b.nhan);

export function hieuQuaPa(p: Principal, f: FilterHieuQuaPa): HieuQuaPaKetQua {
  const r = tinh(p, f);
  const lon: DongHieuQuaPa[] = [];
  const quyChe: DongHieuQuaPa[] = [];
  for (const khoa of r.tap.keys()) {
    if (khoa.includes('|') || khoa === KHOA_CHUA_PHAN_LOAI) continue;
    const con = [...(r.conCua.get(khoa) ?? [])].map((k) => dongOf(r, k));
    if (khoa.startsWith('vd:')) {
      con.sort(xepSo);
      for (const c of con) c.nenDung = nenDung(c, con.filter((x) => x !== c));
      lon.push({ ...dongOf(r, khoa), con });
    } else {
      con.sort((a, b) => THU_TU_LOAI.indexOf(a.khoa.split('|')[1]) - THU_TU_LOAI.indexOf(b.khoa.split('|')[1]));
      quyChe.push({ ...dongOf(r, khoa), ...(con.length ? { con } : {}) });
    }
  }
  lon.sort(xepSo);
  quyChe.sort((a, b) => THU_TU_QUY_CHE.indexOf(a.khoa) - THU_TU_QUY_CHE.indexOf(b.khoa));
  const cong = (ds: DongHieuQuaPa[], k: 'soPa' | 'caiThien') => ds.reduce((s, x) => s + x[k], 0);
  const chinh = lon.filter((d) => d.soPa > 2);
  const it = lon.filter((d) => d.soPa <= 2);
  /* Q20: hàng "Case chưa chọn nhóm nguyên nhân" luôn đứng cuối bảng chính (không vào nhóm "vấn đề khác"), vào tóm tắt — không có "Nên dùng". */
  const chuaPhanLoai = r.tap.has(KHOA_CHUA_PHAN_LOAI) ? [dongOf(r, KHOA_CHUA_PHAN_LOAI)] : [];
  const tatCa = [...lon, ...chuaPhanLoai];
  return {
    gvThem: {
      tomTat: { paCoKetQua: cong(tatCa, 'soPa'), caiThien: cong(tatCa, 'caiThien'), vanDeDuDuLieu: lon.filter((d) => d.soPa >= NGUONG_IT_DU_LIEU).length },
      hang: [...chinh, ...chuaPhanLoai],
      gom: it.length ? { soVanDe: it.length, hang: it } : null,
    },
    quyChe: { tomTat: { paCoKetQua: cong(quyChe, 'soPa'), caiThien: cong(quyChe, 'caiThien') }, hang: quyChe },
    chuaGhiKetQua: r.chuaGhiIds.length,
    caseChuaPhanLoai: r.caseChuaPhanLoai.size,
    chuaRoNguon: r.chuaRoNguonIds.length,
    loc: r.loc,
    scopeEmpty: r.scopeEmpty,
  };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`. `dong` = khoá hàng; `cot` = `pa` | `cai-thien` | `hv`; hoặc `dong` đặc biệt. */
export function oHieuQuaPa(p: Principal, f: FilterHieuQuaPa & { dong: string; cot: string }):
  { n: number; tieuDe: string; rows: MetricRow[] } {
  const r = tinh(p, f);
  const sx = (xs: Iterable<number>) => [...xs].sort((a, b) => a - b);
  if (f.dong === 'chua-ghi-ket-qua') {
    const ids = sx(r.chuaGhiIds);
    return { n: ids.length, tieuDe: `${ids.length} PA chờ kết quả`, rows: rowsFor('phuong-an', ids) };
  }
  if (f.dong === 'case-chua-phan-loai') {
    const ids = sx(r.caseChuaPhanLoai);
    return { n: ids.length, tieuDe: `${ids.length} Case chưa chọn nhóm nguyên nhân`, rows: rowsFor('case', ids) };
  }
  if (f.dong === 'chua-ro-nguon') {
    const ids = sx(r.chuaRoNguonIds);
    return { n: ids.length, tieuDe: `${ids.length} PA chưa rõ nơi học lúc làm PA`, rows: rowsFor('phuong-an', ids) };
  }
  const t = r.tap.get(f.dong);
  if (!t) throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
  if (f.cot !== 'pa' && f.cot !== 'cai-thien' && f.cot !== 'hv') throw badRequest(`Cột "${f.cot}" không hợp lệ.`);
  const [cha] = f.dong.split('|');
  const nhan = cha === f.dong ? r.nhan.get(f.dong)! : `${r.nhan.get(cha)} · ${r.nhan.get(f.dong)}`;
  if (f.cot === 'hv') {
    const ids = sx(new Set(t.map((x) => x.studentId)));
    return { n: ids.length, tieuDe: `${nhan} · ${ids.length} học viên`, rows: rowsFor('hoc-vien', ids) };
  }
  const ids = sx(t.filter((x) => f.cot === 'pa' || x.group === 'success').map((x) => x.id));
  return { n: ids.length, tieuDe: `${nhan} · ${ids.length} PA${f.cot === 'cai-thien' ? ' có cải thiện' : ''}`, rows: rowsFor('phuong-an', ids) };
}
