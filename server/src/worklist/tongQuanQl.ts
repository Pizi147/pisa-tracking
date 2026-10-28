import { db, theoLo } from '../db.ts';
import { PERMISSIONS, tachBaiId, tenMonNgan, soSanhLop, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import type { Principal } from '../permissions.ts';
import { scopeFor } from '../permissions.ts';
import { metricSet } from './metrics.ts';
import { bangChiNhanh } from './bangChiNhanh.ts';
import { highlights } from './highlights.ts';

/**
 * TỔNG QUAN QL — PHẦN THEO KHUNG MỘT ĐƯỜNG (OV-15h1, ý của #471). Trang trước gọi 4 GET dữ liệu (`/tong-quan/quan-ly`, `/tong-quan/chi-nhanh`, `/highlights`,
 * `/giao-vien`); nay Cần bạn quyết giữ `/tong-quan/quan-ly` (gộp hai khung — đổi khung không tải lại; riêng nó ~70 câu nên không gộp được dưới trần 100 câu / đường),
 * còn Lớp cần chú ý + Tuần này + Trễ chấm là MỘT GET gọi lại ĐÚNG các hàm cũ — chỉ số dùng chung tính một lần nhờ bộ nhớ request, số không đổi (H1-1).
 */
export function tongQuanQl(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  const branchId = f.branchId ?? null;
  return {
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
export function treCham(p: Principal, branchId: number | null, ct: ChuongTrinh) {
  if (scopeFor(p, PERMISSIONS.ANALYSIS_VIEW).none) return { dong: [] as GvTre[], baiCua: new Map<number, number[]>(), hanCua: new Map<number, string[]>() };
  const r = metricSet(p, 'bai-qua-han-nhap-diem', { branchId, program: ct });
  const baiCua = new Map<number, number[]>();
  for (const b of r.ids) {
    const c = r.chiTiet?.get(b);
    /* Bài có hai người chấm (W1 · W2 cùng ô?) tính cho CẢ hai — như cột "Bài quá hạn" bảng GV; Σ hàng có thể > số bài, tập bài thì bằng. */
    for (const k of c?.nguoi.length ? c.nguoi : [c?.chamCheo ? -1 : 0]) (baiCua.get(k) ?? baiCua.set(k, []).get(k)!).push(b);
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
  /* 6b-4: hạn từng bài — panel GV trễ chấm (`gvTre`) ghi hạn + quá hạn bao lâu của từng dòng lớp · lượt · kỹ năng. */
  const hanCua = new Map(r.ids.map((b) => [b, r.chiTiet?.get(b)?.han ?? []]));
  return { dong, baiCua, hanCua };
}

