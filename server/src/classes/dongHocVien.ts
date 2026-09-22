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
 *
 * PR-Qa (17, điểm b rà soát cuối — Q5/G-10): tính DỰA TRÊN `listCases(p, ...)`, CÙNG NGUỒN mà "Cần hỗ trợ"
 * (`BangCanHoTro.tsx` → `GET /cases?classId=`) đang dùng — để badge và danh sách mở ra LUÔN KHỚP NHAU với BẤT KỲ người xem
 * nào. Bản đếm thô cũ trên `sos_cases` không lọc quyền, nên với một giáo viên không xem được một Case cụ thể (`listCases`
 * lọc quyền theo lớp LÚC ĐÁNH GIÁ — một quirk đã biết của `cases.ts`, ngoài phạm vi sửa ở đây, xem
 * `.superpowers/sdd/2026-09-22-pr-qa-hoc-vien-lop/task-17-fix-report.md`), badge từng đếm dư so với "Cần hỗ trợ" thấy được.
 */
export function soCaseMoTheoLop(p: Principal, classIds: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!classIds.length) return out;
  const conn = db();
  const ph = classIds.map(() => '?').join(',');
  /* Lớp HIỆN TẠI của từng em (đang học, không lưu trữ) trong đúng các lớp cần đếm — dùng để gom
     Case về ĐÚNG lớp em đang học, không phụ thuộc cách listCases() gán lớp cho Case (xem ghi chú
     ở trên về hạn chế đã biết của cases.ts, ngoài phạm vi sửa của PR-Qa). */
  const lopCuaHv = new Map<number, number>();
  for (const r of conn.prepare(
    `SELECT e.student_id, e.class_id FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id IN (${ph}) AND e.status = 'active' AND s.archived_at IS NULL`,
  ).all(...classIds) as any[]) lopCuaHv.set(r.student_id, r.class_id);
  /* MỘT lời gọi cho cả lô — đúng nguồn quyền mà BangCanHoTro (web) đang dùng qua GET /cases,
     nên badge và danh sách "Cần hỗ trợ" luôn khớp nhau với BẤT KỲ người xem nào. */
  for (const c of listCases(p, {}).rows) {
    if (c.status === 'done' || c.studentId === null) continue;
    const classId = lopCuaHv.get(c.studentId);
    if (classId === undefined) continue;
    out.set(classId, (out.get(classId) ?? 0) + 1);
  }
  return out;
}
