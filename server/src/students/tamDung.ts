import { db, theoLo } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { CO_DIEM_SQL } from '../../../shared/domain/index.ts';

/** PR-Dọn (Task 9b): dòng `students` của một em, nhớ trong request GET — hồ sơ HV đọc ba lần (đầu hồ sơ, bảng kỹ năng, khối lớp học). */
export const dongHocVien = (id: number): any => nho(`hv:${id}`, () => db().prepare('SELECT * FROM students WHERE id = ?').get(id) ?? null);

/**
 * PR-S6F-a (Q2): MỘT điều kiện SQL "em ĐANG HỌC" cho nợ điểm và các số tính cho giáo viên — Tạm dừng, Kết thúc học, đã lưu trữ đều
 * không sinh nợ, không vào badge "n bài chờ chấm", Lịch Test, bảng Phân tích GV (Chấm điểm, Xử lý vi phạm). `s` là bí danh `students`.
 */
export const HV_DANG_HOC_SQL = (s: string) => `${s}.status = 'active' AND ${s}.archived_at IS NULL`;

/**
 * Lỗi chủ SP 28/10: MỘT điều kiện SQL "LƯỢT HIỆN TẠI" cho mọi danh sách hiện tại (bảng điểm lớp, Lịch / Chấm / Kế hoạch Test, Công việc, Tổng quan…):
 *   · em đang học (`HV_DANG_HOC_SQL` — Kết thúc học, Lưu trữ ẩn hết; `kemTamDung`: bảng điểm lớp giữ em Tạm dừng như cũ, PTA Plan 28/10);
 *   · lượt thuộc lộ trình MỚI NHẤT của em CÙNG LOẠI (học lại = mọi thứ reset; FT `route` có giá trị và khoá lớp thường `route IS NULL` chạy song song được);
 *   · lượt còn là kế hoạch (`LUOT_CON_KE_HOACH_SQL`: MT chưa làm của lộ trình đã có kết quả thi thật không còn).
 * Lượt cũ, em ngừng học chỉ còn ở hồ sơ HV, Lưu trữ, Báo cáo — không xoá / huỷ gì; quay lại học là hiện lại.
 * `a` bí danh `assessment_attempts`, `s` bí danh `students` (cùng em).
 */
export const LUOT_HIEN_TAI_SQL = (a: string, s: string, kemTamDung = false) =>
  `${kemTamDung ? `(${HV_DANG_HOC_SQL(s)} OR ${s}.status = 'inactive')` : HV_DANG_HOC_SQL(s)} AND ${LUOT_LO_TRINH_CUOI_SQL(a)} AND ${LUOT_CON_KE_HOACH_SQL(a)}`;
/** Phần "lộ trình mới nhất" của `LUOT_HIEN_TAI_SQL` — cho câu đã lọc em đang học bằng ghi danh (LEFT JOIN lượt, không có `students`).
 *  Lượt bị thay khi em có lộ trình `seq` lớn hơn CÙNG LOẠI (FT / lớp thường — em học FT vẫn có thể có khoá lớp thường mở song song, `regular.ts`). */
export const LUOT_LO_TRINH_CUOI_SQL = (a: string) =>
  `NOT EXISTS (SELECT 1 FROM learning_cycles cyo JOIN learning_cycles cyn ON cyn.student_id = cyo.student_id AND cyn.seq > cyo.seq
     AND (cyn.route IS NULL) = (cyo.route IS NULL) WHERE cyo.id = ${a}.cycle_id)`;
/** Lộ trình đã có kết quả thi thật (luật "thi thật là kết thúc", PTA Plan 28/10) — `cy` bí danh `learning_cycles`. Không tự đóng lộ trình. */
export const DA_THI_THAT_SQL = (cy: string) => `(${cy}.thi_that_ngay IS NOT NULL OR ${cy}.thi_that_khong_thi = 1)`;
/** Phần "còn là kế hoạch" của `LUOT_HIEN_TAI_SQL`: lượt chưa làm (planned, chưa có điểm) của lộ trình đã thi thật thì không còn — MT đã làm giữ. */
export const LUOT_CON_KE_HOACH_SQL = (a: string) =>
  `(${a}.status != 'planned' OR NOT EXISTS (SELECT 1 FROM learning_cycles cyt WHERE cyt.id = ${a}.cycle_id AND ${DA_THI_THAT_SQL('cyt')}) OR ${CO_DIEM_SQL(a)})`;

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
