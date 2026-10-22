/**
 * UI-HO-SO-LOP: `/classes/:id/roster` không còn `viecTiepTheo` (việc của em ở hồ sơ lớp đọc `/classes/:id/viec-theo-em`). Phép kiểm cũ của luật
 * `viecTiepCuaEm` đọc cùng luật qua `viecHocVienTheoLop` — đúng cách `classOverview` (badge) và Học viên & Lớp dựng việc của em.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import type { Principal } from '../permissions.ts';
import { listCases } from '../cases/cases.ts';
import { programmeOfClass } from '../normal/regular.ts';
import { nhapDiemTheoEm, viecHocVienTheoLop } from '../classes/dongHocVien.ts';

/** Việc tiếp theo của từng em đang học lớp `classId`, theo người xem `p`. */
export function viecTiepLop(p: Principal, classId: number): Map<number, any[]> {
  const em = (db().prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(classId) as any[]).map((r) => r.student_id as number);
  const vl = viecHocVienTheoLop(p, {
    emTheoLop: new Map([[classId, em]]), cases: listCases(p, { classId }).rows, homNay: demoToday(),
    chuongTrinhTheoLop: new Map([[classId, programmeOfClass(classId)?.code ?? null]]),
    nhapDiemTheoEm: nhapDiemTheoEm(p, [classId], demoToday(), () => classId),
  });
  return new Map([...vl.theoEm].map(([id, v]) => [id, v.viec as any[]]));
}
