import { db } from '../db.ts';
import {
  INTERVENTION_KIND_LABEL, NGUONG_IT_DU_LIEU, NHAN_HO_KY_NANG, hoKyNang, issueBranchOf, issueLabel, nenDung, tuDauKhoang,
  tuanTrungBinh,
  type ChuongTrinh, type DongHieuQuaPa, type HieuQuaPaKetQua, type HoKyNang, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { badRequest } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { planOutcomes } from '../cases/effectiveness.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { phamViPhanTich } from './phamVi.ts';

/**
 * HIỆU QUẢ PA (PR-UX4, Q9–Q13) — với từng VẤN ĐỀ (mã lỗi chính của Case), loại PA nào giúp em cải thiện. Đếm PA đã kết thúc có kết
 * quả xác định, nên không có cột "Không cải thiện" (chỉ cần "n/N"). Khuôn như `tongHop.ts`: `tinh()` giữ tập ID, bảng đọc `.size`,
 * `oHieuQuaPa()` mở danh sách bằng chính `tinh()` — số và danh sách không thể lệch (G-10). Không lặp truy vấn theo từng dòng.
 */

export type FilterHieuQuaPa = { branchId?: number | null; ct: ChuongTrinh; classId?: number | null; soTuan: number };

type Plan = ReturnType<typeof planOutcomes>[number];

function chunks<T>(list: T[]): T[][] {
  return Array.from({ length: Math.ceil(list.length / 400) }, (_, i) => list.slice(i * 400, i * 400 + 400));
}

const ngayGiua = (tu: string, den: string) =>
  Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86400000);

function tinh(p: Principal, f: FilterHieuQuaPa) {
  const pv = phamViPhanTich(p, f.branchId ?? null, f.classId ?? null);
  const today = demoToday();
  const soTuan = Math.min(Math.max(f.soTuan, 1), 52);
  /* Kết quả theo NƠI EM HỌC LÚC LÀM PA (F03, có sẵn trong `planOutcomes`) — không phải lớp hiện tại. */
  const scope = {
    branchIds: f.branchId ? [f.branchId] : (pv.scope.all ? null : pv.scope.branchIds),
    ratio: f.ct === 'thuong' ? true : f.ct === 'ft' ? false : null,
    classId: f.classId ?? null,
    fromDate: tuDauKhoang(today, soTuan),
  };
  const tatCa = planOutcomes(scope);
  const rows = tatCa.filter((r) => r.group !== 'undetermined');
  /* Đúng luật của `plansNeedingEvaluation` (PA đã bị thay không tính) nhưng dùng lại CÙNG kết quả `planOutcomes` — không truy vấn lần hai. */
  const chuaGhiIds = tatCa.filter((r) => r.group === 'undetermined' && !r.supersededBy).map((r) => r.id);

  // Lỗi chính của các Case đó — MỘT câu theo lô 400, lấy dòng có id nhỏ nhất.
  const loiChinh = new Map<number, string>();
  const caseIds = [...new Set(rows.map((r) => r.caseId))];
  for (const chunk of chunks(caseIds)) {
    for (const r of db().prepare(
      `SELECT case_id, taxonomy_code FROM case_issues
        WHERE role = 'primary' AND case_id IN (${chunk.map(() => '?').join(',')}) ORDER BY id DESC`,
    ).all(...chunk) as any[]) loiChinh.set(r.case_id, r.taxonomy_code);   // id giảm dần → dòng cuối ghi đè = id nhỏ nhất
  }

  type Tap = { pa: Plan[] };
  const tap = new Map<string, Tap>();
  const conCua = new Map<string, Set<string>>();
  const maCua = new Map<string, { ma: string; ho: HoKyNang }>();
  const caseChuaPhanLoai = new Set<number>();
  const themTap = (khoa: string, r: Plan) => { let t = tap.get(khoa); if (!t) { t = { pa: [] }; tap.set(khoa, t); } t.pa.push(r); };

  for (const r of rows) {
    const ma0 = loiChinh.get(r.caseId);
    const ho = hoKyNang(ma0 ? issueBranchOf(ma0) : null) ?? hoKyNang(r.category);
    if (!ho && (r.category === 'tong_hop' || issueBranchOf(ma0) === 'tong_hop')) continue;   // Pre FOU không thuộc họ kỹ năng
    const ma = ma0 && issueBranchOf(ma0) ? ma0 : ho && ma0 ? `student.${ho}.other` : null;
    if (!ma || !ho) { caseChuaPhanLoai.add(r.caseId); continue; }
    const cha = `vd:${ma}`, con = `vd:${ma}|${r.kind}`;
    themTap(cha, r); themTap(con, r);
    if (!conCua.has(cha)) conCua.set(cha, new Set());
    conCua.get(cha)!.add(con);
    maCua.set(cha, { ma, ho });
  }

  return { tap, conCua, maCua, caseChuaPhanLoai, chuaGhiIds, scopeEmpty: pv.scopeEmpty };
}

type Tinh = ReturnType<typeof tinh>;

function dongOf(khoa: string, nhan: string, pa: Plan[]): Omit<DongHieuQuaPa, 'nenDung' | 'con'> {
  const cai = pa.filter((x) => x.group === 'success');
  const soPa = pa.length;
  const itDuLieu = soPa < NGUONG_IT_DU_LIEU;
  const ngay = cai.filter((x) => x.startedOn && x.outcomeOn).map((x) => Math.max(0, ngayGiua(x.startedOn!, x.outcomeOn!)));
  return { khoa, nhan, soPa, caiThien: cai.length, itDuLieu, tbTuan: itDuLieu ? null : tuanTrungBinh(ngay) };
}

export function hieuQuaPa(p: Principal, f: FilterHieuQuaPa): HieuQuaPaKetQua {
  const r = tinh(p, f);
  const lon: DongHieuQuaPa[] = [];
  for (const [cha, cons] of r.conCua) {
    const { ma, ho } = r.maCua.get(cha)!;
    const conRows = [...cons].map((k) => {
      const kind = k.slice(cha.length + 1);
      return { ...dongOf(k, INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind, r.tap.get(k)!.pa), nenDung: false };
    }).sort((a, b) => b.soPa - a.soPa || a.nhan.localeCompare(b.nhan));
    for (const c of conRows) c.nenDung = nenDung(c, conRows.filter((x) => x !== c));
    lon.push({ ...dongOf(cha, `${NHAN_HO_KY_NANG[ho]} · ${issueLabel(ma)}`, r.tap.get(cha)!.pa), nenDung: false, con: conRows });
  }
  lon.sort((a, b) => b.soPa - a.soPa || a.nhan.localeCompare(b.nhan));

  const chinh = lon.filter((d) => d.soPa > 2);
  const it = lon.filter((d) => d.soPa <= 2);
  return {
    tomTat: {
      paCoKetQua: lon.reduce((s, d) => s + d.soPa, 0), caiThien: lon.reduce((s, d) => s + d.caiThien, 0),
      vanDeDuDuLieu: lon.filter((d) => d.soPa >= NGUONG_IT_DU_LIEU).length,
    },
    hang: chinh,
    gom: it.length ? { soVanDe: it.length, hang: it } : null,
    chuaGhiKetQua: r.chuaGhiIds.length,
    caseChuaPhanLoai: r.caseChuaPhanLoai.size,
    scopeEmpty: r.scopeEmpty,
  };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`. `dong` = khoá hàng; `cot` = `pa` | `cai-thien`; hoặc `dong` đặc biệt. */
export function oHieuQuaPa(p: Principal, f: FilterHieuQuaPa & { dong: string; cot: string }):
  { n: number; tieuDe: string; rows: MetricRow[] } {
  const r = tinh(p, f);
  if (f.dong === 'chua-ghi-ket-qua') {
    const ids = [...r.chuaGhiIds].sort((a, b) => a - b);
    return { n: ids.length, tieuDe: `${ids.length} PA đã xong, chưa ghi kết quả`, rows: rowsFor('phuong-an', ids) };
  }
  if (f.dong === 'case-chua-phan-loai') {
    const ids = [...r.caseChuaPhanLoai].sort((a, b) => a - b);
    return { n: ids.length, tieuDe: `${ids.length} Case chưa phân loại lỗi`, rows: rowsFor('case', ids) };
  }
  const t = r.tap.get(f.dong);
  if (!t) throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
  if (f.cot !== 'pa' && f.cot !== 'cai-thien') throw badRequest(`Cột "${f.cot}" không hợp lệ.`);
  const ids = t.pa.filter((x) => f.cot === 'pa' || x.group === 'success').map((x) => x.id).sort((a, b) => a - b);
  const [cha, kind] = f.dong.split('|');
  const cd = r.maCua.get(cha)!;
  const nhan = `${NHAN_HO_KY_NANG[cd.ho]} · ${issueLabel(cd.ma)}${kind ? ` · ${INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind}` : ''}`;
  return { n: ids.length, tieuDe: `${nhan} · ${ids.length} PA${f.cot === 'cai-thien' ? ' có cải thiện' : ''}`, rows: rowsFor('phuong-an', ids) };
}
