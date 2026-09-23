/**
 * PHẦN BỔ SUNG CHO DÒNG HỌC VIÊN CỦA LỚP (PR-Qa) — nhãn cảnh báo Ý thức 5 ngày (YT-8), các Case đang mở dùng dựng "Việc tiếp theo".
 * Tách khỏi classes.ts để không vòng import; mỗi thứ MỘT lần cho cả lớp, không hỏi từng em.
 *
 * (PR-Qa 17, sửa theo rà soát planning): số "Case đang mở" của lớp — trước ở đây qua một hàm dựng riêng — nay tính thẳng bằng
 * `listCases(p, { classId })` tại nơi dùng (`classes.ts`, `hocVienLop.ts`), vì hàm cũ tự viết một câu SQL enrollment→class
 * riêng rồi gọi `listCases(p, {})` KHÔNG lọc phạm vi gì để lấy Case — quét mọi Case trong hệ thống, chậm hàng chục giây
 * trên Turso. Xem `.superpowers/sdd/2026-09-22-pr-qa-hoc-vien-lop/task-17-planning-fix-report.md`.
 */
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
