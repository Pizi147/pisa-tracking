import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { boVaiCx, can, type Principal } from '../permissions.ts';

/**
 * QUYỀN CỦA LỆNH CHUYỂN LỚP + BÀN GIAO (PR-CT) — một nơi, không rải `can()` khắp nơi. Không quyền mới: ra lệnh = `class.edit` ở LỚP NGUỒN
 * (Head, Quản trị; CX có `class.edit` để chuyển lớp lẻ — N52 — nhưng KHÔNG chốt lộ trình: `coTheChotLoTrinh`, N63 ①), kiểm theo phân công Ở LỚP NGUỒN của lệnh, không theo ghi danh hiện tại (em đã chuyển rồi
 * GVCN cũ vẫn xác nhận được).
 */
export const coTheRaLenh = (p: Principal, lopNguonId: number): boolean => can(p, PERMISSIONS.CLASS_EDIT, { classId: lopNguonId });
/** N63 ①: chốt lộ trình Cuối khoá / Xét lại (Lộ trình tiếp theo, nháp, Chốt cả lớp, quyết Xét lại) — người ra lệnh trừ vai CX (CX chỉ xem). */
export const coTheChotLoTrinh = (p: Principal, lopNguonId: number): boolean => coTheRaLenh(boVaiCx(p), lopNguonId);

/** Phân công ĐANG hiệu lực của một người ở một lớp — không dùng `student.edit` (Quản lý cũng có). Một câu. */
export function phanCongO(conn: any, userId: number, classId: number): { gvcn: boolean; kyNang: Set<string> } {
  const rows = conn.prepare(
    `SELECT is_core, skill FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND status = 'active'`,
  ).all(userId, classId) as { is_core: number; skill: string | null }[];
  return { gvcn: rows.some((r) => !!r.is_core), kyNang: new Set(rows.map((r) => r.skill).filter((s): s is string => !!s)) };
}
