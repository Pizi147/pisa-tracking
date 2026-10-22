/**
 * OVERALL THEO LỘ TRÌNH (SV-SO3) — MỘT hàm cho "so lượt trước": Xu hướng ở hàng HV của Học viên & Lớp (`hocVienLop.ts`) và So lượt trước ở
 * Kết quả MT (`phanTich/baoCao.ts`). Chấm bằng `resultOf` (cùng bộ máy mọi màn). 1 câu / lô 900 lộ trình + `loadBundle` (nhớ theo lượt trong request).
 */
import { theoLo, db } from '../db.ts';
import { loadBundle, resultOf } from './attempts.ts';

export type LuotLoTrinh = { attemptId: number; mt: number; tuan: string | null; ovr: number | null };

/** Mọi lượt MT0 / MT / Cuối khoá chưa huỷ của các lộ trình, theo lộ trình, xếp số MT tăng dần. */
export function luotTheoLoTrinh(cycleIds: readonly number[]): Map<number, LuotLoTrinh[]> {
  const luot: any[] = [];
  theoLo([...new Set(cycleIds)], (lo, ph) => {
    luot.push(...db().prepare(
      `SELECT a.*, rp.week_start, cy.route, cy.khong_cam_ket AS cy_kck FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.cycle_id IN (${ph}) AND a.status != 'cancelled' AND a.kind IN ('mock', 'mt0', 'final')`).all(...lo) as any[]);
  });
  const bd = loadBundle(luot.map((a) => a.id));
  const out = new Map<number, LuotLoTrinh[]>();
  for (const a of luot.sort((x, y) => x.attempt_no - y.attempt_no)) {
    const ovr = resultOf(a, bd.scores.get(a.id) ?? [], bd.skips.get(a.id) ?? [], bd.skillRows.get(a.id) ?? []).overall ?? null;
    out.set(a.cycle_id, [...(out.get(a.cycle_id) ?? []), { attemptId: a.id, mt: a.attempt_no, tuan: a.week_start ?? null, ovr }]);
  }
  return out;
}

/** Lượt có Overall gần nhất có số MT nhỏ hơn `mt` (`Infinity`: lượt cuối có Overall — Thi thật so MT cuối). */
export function luotTruocCoOverall(ds: readonly LuotLoTrinh[] | undefined, mt: number): (LuotLoTrinh & { ovr: number }) | null {
  const x = (ds ?? []).filter((l) => l.mt < mt && l.ovr !== null).at(-1);
  return x ? (x as LuotLoTrinh & { ovr: number }) : null;
}
