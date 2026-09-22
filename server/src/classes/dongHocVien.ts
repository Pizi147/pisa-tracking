/**
 * PHẦN BỔ SUNG CHO DÒNG HỌC VIÊN CỦA LỚP (PR-Qa) — nhãn cảnh báo Ý thức 5 ngày (YT-8), các Case đang mở dùng dựng "Việc tiếp theo",
 * và số Case đang mở của lớp. Tách khỏi classes.ts để không vòng import; mỗi thứ MỘT lần cho cả lớp, không hỏi từng em.
 */
import { db } from '../db.ts';
import { PERMISSIONS, type CaseChoViec } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { rosterWarnings } from '../yThuc/canhBao.ts';
import { listCases } from '../cases/cases.ts';

export type CanhBaoDong = { count: number; oldestAgeDays: number; message: string };

/** Người không được xem hồ sơ học viên của lớp thì không có nhãn — ẩn chứ không làm hỏng cả bảng. */
export function canhBaoTheoHocVien(p: Principal, classId: number): Map<number, CanhBaoDong> {
  const out = new Map<number, CanhBaoDong>();
  if (!can(p, PERMISSIONS.STUDENT_VIEW, { classId })) return out;
  for (const [id, w] of rosterWarnings(p, classId)) out.set(id, { count: w.count, oldestAgeDays: w.oldestAgeDays, message: w.message });
  return out;
}

/** Case chưa xong của từng em trong lớp (lớp em ĐANG học), theo đúng phạm vi người xem — cùng tập với `/cases?classId=`. */
export function caseMoTheoHocVien(p: Principal, classId: number): Map<number, CaseChoViec[]> {
  const out = new Map<number, CaseChoViec[]>();
  for (const c of listCases(p, { classId }).rows) {
    if (c.status === 'done' || c.studentId === null) continue;
    const ds = out.get(c.studentId) ?? [];
    ds.push({ id: c.id, topic: c.topic, state: c.state, nextDue: c.nextDue, dueOverdue: c.dueOverdue, sosLevel: c.sosLevel });
    out.set(c.studentId, ds);
  }
  return out;
}

/**
 * "n Case đang mở" của lớp = tổng Case chưa xong của các em ĐANG HỌC, không lưu trữ — đúng bằng tổng cột Case của danh sách lớp
 * (`classRoster.openCases`), nên bấm vào không ra một con số khác (Q2 kiểm kê).
 */
export function soCaseMoTheoLop(classIds: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!classIds.length) return out;
  const ph = classIds.map(() => '?').join(',');
  for (const r of db().prepare(
    `SELECT e.class_id, COUNT(*) AS n FROM sos_cases sc
       JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
       JOIN students s ON s.id = sc.student_id
      WHERE e.class_id IN (${ph}) AND sc.status != 'done' AND s.archived_at IS NULL
      GROUP BY e.class_id`,
  ).all(...classIds) as any[]) out.set(r.class_id, r.n);
  return out;
}
