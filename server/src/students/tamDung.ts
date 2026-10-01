import { db, theoLo } from '../db.ts';

/**
 * PR-S6F-a (Q2): MỘT điều kiện SQL "em ĐANG HỌC" cho nợ điểm và các số tính cho giáo viên — Tạm dừng, Kết thúc học, đã lưu trữ đều
 * không sinh nợ, không vào badge "n bài chờ chấm", Lịch Test, bảng Phân tích GV (Chấm điểm, Xử lý vi phạm). `s` là bí danh `students`.
 */
export const HV_DANG_HOC_SQL = (s: string) => `${s}.status = 'active' AND ${s}.archived_at IS NULL`;

export type KhoangTamDung = { tu: string; den: string | null; lyDo: string | null; boiId: number | null };

/**
 * KHOẢNG TẠM DỪNG của nhiều em — MỘT câu (≤ 900 em) trên nhật ký `pause`/`resume` (`setStudentStatus`), ghép cặp theo ngày.
 * Em chưa từng Tạm dừng thì không có khoá. Khoảng đang dừng có `den: null`. Cùng thân với PR-UXF-a (giao kèo đếm tuần học FT, Q1).
 */
export function khoangTamDung(ids: readonly number[]): Record<number, KhoangTamDung[]> {
  const kq: Record<number, KhoangTamDung[]> = {};
  theoLo([...new Set(ids)], (lo, ph) => {
    const rows = db().prepare(
      `SELECT student_id, event_type, event_date, detail, created_by FROM journey_events
        WHERE event_type IN ('pause', 'resume') AND student_id IN (${ph}) ORDER BY student_id, event_date, id`,
    ).all(...lo) as any[];
    for (const r of rows) {
      const cuoi = kq[r.student_id]?.at(-1);
      if (r.event_type === 'pause') {
        if (!cuoi || cuoi.den !== null) (kq[r.student_id] ??= []).push({ tu: r.event_date, den: null, lyDo: r.detail ?? null, boiId: r.created_by ?? null });
      } else if (cuoi && cuoi.den === null) cuoi.den = r.event_date;
    }
  });
  return kq;
}
