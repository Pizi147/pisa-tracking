import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';

/**
 * QUYỀN CỦA LỆNH CHUYỂN LỚP + BÀN GIAO (PR-CT) — một nơi, không rải `can()` khắp nơi. Không quyền mới: ra lệnh = `class.edit` ở LỚP NGUỒN
 * (chỉ Quản lý, Quản trị có — `seed/data.ts`), kiểm theo phân công Ở LỚP NGUỒN của lệnh, không theo ghi danh hiện tại (em đã chuyển rồi
 * GVCN cũ vẫn xác nhận được).
 */
export const coTheRaLenh = (p: Principal, lopNguonId: number): boolean => can(p, PERMISSIONS.CLASS_EDIT, { classId: lopNguonId });

/** Phân công ĐANG hiệu lực của một người ở một lớp — không dùng `student.edit` (Quản lý cũng có). Một câu. */
export function phanCongO(conn: any, userId: number, classId: number): { gvcn: boolean; kyNang: Set<string> } {
  const rows = conn.prepare(
    `SELECT is_core, skill FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND status = 'active'`,
  ).all(userId, classId) as { is_core: number; skill: string | null }[];
  return { gvcn: rows.some((r) => !!r.is_core), kyNang: new Set(rows.map((r) => r.skill).filter((s): s is string => !!s)) };
}
