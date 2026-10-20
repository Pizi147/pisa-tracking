import { db, theoLo } from '../db.ts';
import { PERMISSIONS, tachBaiId, tenMonNgan, soSanhLop, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { scopeFor } from '../permissions.ts';
import { metricSet, rowsFor, type MetricRow } from './metrics.ts';
import { tongQuanQuanLy } from './tongQuan.ts';
import { bangChiNhanh } from './bangChiNhanh.ts';
import { highlights } from './highlights.ts';
import { phamViXemViec } from './xemViec.ts';

/**
 * TỔNG QUAN QL — MỘT ĐƯỜNG (OV-15h1, ý của #471). Trang Tổng quan QL trước gọi 4 GET dữ liệu (`/tong-quan/quan-ly`, `/tong-quan/chi-nhanh`,
 * `/highlights`, `/giao-vien`); nay một GET gọi lại ĐÚNG các hàm đó trong một request — chỉ số dùng chung (`metricSet`, `latestAttempts`, nợ điểm)
 * tính một lần nhờ bộ nhớ request, số không đổi (phép kiểm H1-1 so từng phần với đường cũ chạy riêng). Không luật đếm mới.
 *  · `quanLy`: dải tóm tắt + Cần bạn quyết (gộp hai khung) · `bang`: Lớp cần chú ý (`chuY`) · `lich`: Tuần này · `tre`: Trễ chấm theo GV.
 */
export function tongQuanQl(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  const branchId = f.branchId ?? null;
  return {
    /* Cần bạn quyết là việc của Quản lý (xem việc người khác) — vai chỉ có `analysis.view` vẫn xem được phần số liệu của trang. */
    quanLy: phamViXemViec(p) === 'het' ? tongQuanQuanLy(p, { branchId }) : null,
    bang: bangChiNhanh(p, { branchId, ct: f.ct, chuY: true }),
    lich: highlights(p, { branchId, program: f.ct }),
    tre: treCham(p, branchId, f.ct).dong,
  };
}

/** Một GV của Trễ chấm. `khoa`: id người chấm · 0 = chưa phân công · -1 = Speaking chấm chéo (chưa ai chấm, T18). */
export type GvTre = { khoa: number; ten: string; bai: number; kyNang: string[]; lop: { code: string; n: number }[]; treNhat: number };

const NGAY_MS = 86_400_000;
const soNgay = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / NGAY_MS);

/**
 * TRỄ CHẤM THEO GV (mockup 3: tên · kỹ năng · số bài · lớp · trễ nhất) — chia CHÍNH tập "bài trễ chấm" (`bai-qua-han-nhap-diem`, người chấm của từng bài
 * trong `chiTiet`): Σ hàng = số ở dải tóm tắt; số mỗi GV = cột "Bài quá hạn" bảng GV (H1-3). Nhiều bài trước, rồi theo tên.
 */
function treCham(p: Principal, branchId: number | null, ct: ChuongTrinh) {
  if (scopeFor(p, PERMISSIONS.ANALYSIS_VIEW).none) return { dong: [] as GvTre[], baiCua: new Map<number, number[]>() };
  const r = metricSet(p, 'bai-qua-han-nhap-diem', { branchId, program: ct });
  const baiCua = new Map<number, number[]>();
  for (const b of r.ids) {
    const c = r.chiTiet?.get(b);
    const k = c?.nguoi.length ? c.nguoi[0] : c?.chamCheo ? -1 : 0;
    (baiCua.get(k) ?? baiCua.set(k, []).get(k)!).push(b);
  }
  const luot = new Map<number, { code: string | null; ct: string | null }>();
  theoLo([...new Set(r.ids.map((b) => tachBaiId(b).attemptId))], (lo, ph) => {
    for (const a of db().prepare(`SELECT a.id, c.code, c.programme_code FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id WHERE a.id IN (${ph})`)
      .all(...lo) as any[]) luot.set(a.id, { code: a.code ?? null, ct: a.programme_code ?? null });
  });
  const ten = new Map<number, string>();
  theoLo([...baiCua.keys()].filter((k) => k > 0), (lo, ph) => {
    for (const u of db().prepare(`SELECT id, full_name FROM users WHERE id IN (${ph})`).all(...lo) as any[]) ten.set(u.id, u.full_name);
  });
  const homNay = demoToday();
  const dong: GvTre[] = [...baiCua].map(([khoa, ds]) => {
    const lop = new Map<string, number>();
    for (const b of ds) { const c = luot.get(tachBaiId(b).attemptId)?.code ?? '—'; lop.set(c, (lop.get(c) ?? 0) + 1); }
    const han = ds.flatMap((b) => r.chiTiet?.get(b)?.han ?? []);
    return {
      khoa, ten: khoa > 0 ? ten.get(khoa) ?? `#${khoa}` : khoa < 0 ? 'Speaking chấm chéo' : 'Chưa phân công', bai: ds.length,
      kyNang: [...new Set(ds.map((b) => { const x = tachBaiId(b); return tenMonNgan(luot.get(x.attemptId)?.ct ?? null, x.skill); }))],
      lop: [...lop].map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n || soSanhLop({ code: a.code }, { code: b.code })),
      treNhat: Math.max(0, ...han.map((h) => soNgay(h, homNay))),
    };
  }).sort((a, b) => b.bai - a.bai || a.ten.localeCompare(b.ten, 'vi'));
  return { dong, baiCua };
}

/** Panel "n bài" của một GV ở Trễ chấm — tính lại bằng CHÍNH `treCham` nên số = số dòng. */
export function oTreCham(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; gv: number }): { n: number; tieuDe: string; rows: MetricRow[] } {
  const { dong, baiCua } = treCham(p, f.branchId ?? null, f.ct);
  const g = dong.find((x) => x.khoa === f.gv);
  if (!g) throw badRequest('Giáo viên này không còn bài trễ chấm — có thể vừa nhập xong hoặc bộ lọc vừa đổi.');
  const ids = [...baiCua.get(f.gv)!].sort((a, b) => a - b);
  return { n: ids.length, tieuDe: `${ids.length} bài trễ chấm · ${g.ten}`, rows: rowsFor('bai', ids, undefined, p) };
}
