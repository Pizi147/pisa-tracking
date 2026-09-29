import { db } from '../db.ts';
import { PERMISSIONS, fmtExamMonth, ketQuaGanNhat, nhanKetThucVi } from '../../../shared/domain/index.ts';
import { require_, type Principal } from '../permissions.ts';
import { isRatioCycle } from '../normal/regular.ts';
import { typedResult } from '../students/profile.ts';

/**
 * LỊCH SỬ LỚP — đầu tab Hành trình (mockup 11-4, §3.8 dòng cuối, Q18). Mỗi dòng một
 * enrollment (mới nhất trước): lớp · thời gian · kết thúc vì · kết quả. BA CÂU CỐ ĐỊNH,
 * không tăng theo số lớp em đã học.
 */
export function lichSuLop(p: Principal, studentId: number) {
  const s = db().prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) return [];
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const conn = db();

  // Câu 1: mọi enrollment + mã lớp.
  const enrollments = conn
    .prepare(
      `SELECT e.*, c.code AS class_code FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = ? ORDER BY e.started_at DESC, e.id DESC`,
    )
    .all(studentId) as any[];
  if (!enrollments.length) return [];

  // Câu 2: lượt Giữa/Cuối khoá ĐÃ CHẤM của CHÍNH EM NÀY ở các lớp đó — ưu tiên final, không có thì progress.
  const classIds = [...new Set(enrollments.map((e) => e.class_id))];
  const ph = classIds.map(() => '?').join(',');
  const attemptRows = conn
    .prepare(
      `SELECT * FROM assessment_attempts
        WHERE class_id IN (${ph}) AND student_id = ? AND kind IN ('final','progress') AND status = 'done'
        ORDER BY class_id, (kind = 'final') DESC, attempt_no DESC`,
    )
    .all(...classIds, studentId) as any[];
  const attemptOfClass = new Map<number, any>();
  for (const a of attemptRows) if (!attemptOfClass.has(a.class_id)) attemptOfClass.set(a.class_id, a);

  // Câu 3: lộ trình đang chạy (cho dòng đang học Fast Track).
  const activeCycle = conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(studentId) as any;

  return enrollments.map((e) => {
    const dangHoc = e.status === 'active';
    let ketQua: string | null = null;
    if (dangHoc) {
      if (activeCycle && !isRatioCycle(activeCycle)) {
        const parts = [`Mục tiêu ${activeCycle.target_score != null ? Number(activeCycle.target_score).toFixed(1) : '—'}`];
        if (activeCycle.exam_month) parts.push(`thi ${fmtExamMonth(activeCycle.exam_month)}`);
        ketQua = parts.join(' · ');
      }
    } else if (e.end_kind === 'chuyen_lop' || (!e.end_kind && e.status === 'transferred' && e.end_reason)) {
      // Chuyển lớp (không lên lớp) không có kết quả thi để nói — nói đúng LÝ DO đã ghi lúc chuyển.
      ketQua = e.end_reason ?? null;
    } else {
      const a = attemptOfClass.get(e.class_id);
      if (a) {
        const t = typedResult(a);
        if (t.mode === 'ratio' && t.ratio) {
          const r = t.ratio;
          const kv = {
            mode: 'ratio' as const, attemptLabel: a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá',
            sosLevel: r.sosLevel, provisional: r.provisional, scored: r.scored, required: r.required,
            failed: r.failedCount, overall: null, expectation: null, belowSkills: [],
            failedSkills: r.skills.filter((x: any) => x.outcome === 'fail')
              .map((x: any) => ({ skill: x.skill, score: x.score ?? 0, total: x.total ?? 0 })),
            khongChiaMon: r.skills.length === 1 && r.skills[0].skill === 'tong_hop', tyLeTong: r.tyLeTong,
          };
          const chinh = ketQuaGanNhat(kv).chinh;
          const nhanLuot = a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá';
          ketQua = `${nhanLuot} ${chinh.charAt(0).toLowerCase()}${chinh.slice(1)}`;
        }
      }
    }
    return {
      lop: { id: e.class_id, code: e.class_code }, tu: e.started_at, den: e.ended_at, dangHoc,
      ketThucVi: nhanKetThucVi(e.end_kind ?? null, e.status),
      ketQua,
    };
  });
}
