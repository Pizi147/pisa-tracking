/**
 * LỚP EM HỌC LÚC THI THẬT (P12, E7) — MỘT luật cho Phân tích GV (`giaoVien.ts` mucThiThat) và Kết quả thi (`ketQuaThi.ts`):
 *   ghi danh hiệu lực ở ngày thi (bắt đầu ≤ ngày ≤ kết thúc / chưa kết thúc), nhiều dòng → bắt đầu muộn nhất (cùng ngày: dòng mới hơn);
 *   không có → lớp của lượt MT cuối của lộ trình (không MT0); không có nữa → ghi danh cuối của em (giữ hàng Kết quả thi như trước).
 * Theo lô (hai câu mỗi 400 lộ trình), trả Map<cycleId, classId>. Bản chụp lộ trình đã đóng (`banChup.ts`) giữ lớp đóng băng của nó.
 */
import { db } from '../db.ts';

const LO = 400;
const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');

export function lopLucThiThat(ds: readonly { id: number; student_id: number; ngay: string | null }[]): Map<number, number> {
  const conn = db();
  const out = new Map<number, number>();
  for (let i = 0; i < ds.length; i += LO) {
    const lo = ds.slice(i, i + LO);
    const ghiDanh = new Map<number, { lop: number; tu: string; den: string | null; id: number }[]>();
    const hv = [...new Set(lo.map((c) => c.student_id))];
    for (const e of conn.prepare(
      `SELECT id, student_id, class_id, substr(started_at, 1, 10) AS tu, substr(ended_at, 1, 10) AS den FROM enrollments WHERE student_id IN (${cho(hv.length)})`,
    ).all(...hv) as any[]) (ghiDanh.get(e.student_id) ?? ghiDanh.set(e.student_id, []).get(e.student_id)!).push({ lop: e.class_id, tu: e.tu, den: e.den, id: e.id });
    const mtCuoi = new Map<number, number>();
    for (const r of conn.prepare(
      `SELECT cycle_id, class_id FROM assessment_attempts WHERE id IN (SELECT MAX(id) FROM assessment_attempts
        WHERE cycle_id IN (${cho(lo.length)}) AND class_id IS NOT NULL AND kind != 'mt0' GROUP BY cycle_id)`,
    ).all(...lo.map((c) => c.id)) as any[]) mtCuoi.set(r.cycle_id, r.class_id);
    const moiHon = <T extends { tu: string; id: number }>(x: T, y: T): T => (y.tu > x.tu || (y.tu === x.tu && y.id > x.id) ? y : x);
    for (const c of lo) {
      const cua = ghiDanh.get(c.student_id) ?? [];
      const hl = c.ngay ? cua.filter((e) => e.tu && e.tu <= c.ngay! && (!e.den || e.den >= c.ngay!)) : [];
      const lop = hl.length ? hl.reduce(moiHon).lop : mtCuoi.get(c.id) ?? (cua.length ? cua.reduce((x, y) => (y.id > x.id ? y : x)).lop : null);
      if (lop != null) out.set(c.id, lop);
    }
  }
  return out;
}
