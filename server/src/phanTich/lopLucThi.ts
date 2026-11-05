/**
 * LỚP EM HỌC LÚC THI THẬT (P12, E7) — MỘT luật cho Phân tích GV (`giaoVien.ts` mucThiThat) và Kết quả thi (`ketQuaThi.ts`):
 *   ghi danh hiệu lực ở ngày thi (bắt đầu ≤ ngày ≤ kết thúc / chưa kết thúc), nhiều dòng → bắt đầu muộn nhất (cùng ngày: dòng mới hơn);
 *   không có → ghi danh bắt đầu muộn nhất TRƯỚC / BẰNG ngày thi (luật cũ Phân tích GV) → lớp của lượt MT cuối của lộ trình (không MT0) →
 *   ghi danh mới nhất của em (giữ hàng Kết quả thi như trước).
 * Theo lô (`theoLo`, hai câu mỗi lô), trả Map<cycleId, classId>. Bản chụp lộ trình đã đóng (`banChup.ts`) giữ lớp đóng băng của nó.
 */
import { db, theoLo } from '../db.ts';
import { nhoTheoId } from '../platform/nguCanhRequest.ts';

export type GhiDanhEm = { id: number; lop: number; tu: string; den: string | null };
/** Mọi ghi danh của các em (ngày `yyyy-mm-dd`) — nhớ theo em trong request: lớp lúc thi và tuần dạy (Theo GV, `thiThatThongKe.ts`) đọc chung một lần. */
export function ghiDanhCuaEm(hv: readonly number[]): Map<number, GhiDanhEm[]> {
  return nhoTheoId('ghi-danh-em:', [...hv], (thieu) => {
    const m = new Map<number, GhiDanhEm[]>();
    theoLo(thieu, (lo, ph) => {
      for (const e of db().prepare(`SELECT id, student_id, class_id, substr(started_at, 1, 10) AS tu, substr(ended_at, 1, 10) AS den FROM enrollments WHERE student_id IN (${ph})`).all(...lo) as any[])
        (m.get(e.student_id) ?? m.set(e.student_id, []).get(e.student_id)!).push({ id: e.id, lop: e.class_id, tu: e.tu, den: e.den ?? null });
    });
    return m;
  });
}

export function lopLucThiThat(ds: readonly { id: number; student_id: number; ngay: string | null }[]): Map<number, number> {
  const conn = db();
  const out = new Map<number, number>();
  theoLo(ds, (lo, ph) => {
    const ghiDanh = ghiDanhCuaEm([...new Set(lo.map((c) => c.student_id))]);
    const mtCuoi = new Map<number, number>();
    for (const r of conn.prepare(
      `SELECT cycle_id, class_id FROM assessment_attempts WHERE id IN (SELECT MAX(id) FROM assessment_attempts
        WHERE cycle_id IN (${ph}) AND class_id IS NOT NULL AND kind != 'mt0' GROUP BY cycle_id)`,
    ).all(...lo.map((c) => c.id)) as any[]) mtCuoi.set(r.cycle_id, r.class_id);
    const moiHon = <T extends { tu: string; id: number }>(x: T, y: T): T => (y.tu > x.tu || (y.tu === x.tu && y.id > x.id) ? y : x);
    for (const c of lo) {
      const cua = ghiDanh.get(c.student_id) ?? [];
      const truoc = c.ngay ? cua.filter((e) => e.tu && e.tu <= c.ngay!) : [];
      const hl = truoc.filter((e) => !e.den || e.den >= c.ngay!);
      const lop = hl.length ? hl.reduce(moiHon).lop : truoc.length ? truoc.reduce(moiHon).lop
        : mtCuoi.get(c.id) ?? (cua.length ? cua.reduce((x, y) => (y.id > x.id ? y : x)).lop : null);
      if (lop != null) out.set(c.id, lop);
    }
  });
  return out;
}
