import { db, theoLo } from '../db.ts';

/** Một khoảng Tạm dừng của em: `tu` = ngày Tạm dừng, `den` = ngày Quay lại (null = đang dừng). */
export type KhoangTamDung = { tu: string; den: string | null; lyDo: string | null; boiId: number | null };

/**
 * Q31-11: các khoảng Tạm dừng theo em — MỘT câu SQL cho cả lô (`journey_events` pause/resume, `students.ts` ghi), ghép cặp theo thứ tự ngày.
 * Em không từng dừng thì không có khoá. Cùng chữ ký, cùng thân với PR-VAI-b Task 1 — PR merge sau xoá bản trùng.
 */
export function khoangTamDung(ids: readonly number[]): Record<number, KhoangTamDung[]> {
  const out: Record<number, KhoangTamDung[]> = {};
  theoLo([...new Set(ids)], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT student_id, event_type, event_date, detail, created_by FROM journey_events
        WHERE event_type IN ('pause', 'resume') AND student_id IN (${ph}) ORDER BY student_id, event_date, id`,
    ).all(...lo) as any[]) {
      const ds = (out[r.student_id] ??= []);
      const cuoi = ds[ds.length - 1];
      if (r.event_type === 'pause') {
        if (!cuoi || cuoi.den !== null) ds.push({ tu: r.event_date, den: null, lyDo: r.detail ?? null, boiId: r.created_by ?? null });
      } else if (cuoi && cuoi.den === null) cuoi.den = r.event_date;
    }
  });
  return out;
}
