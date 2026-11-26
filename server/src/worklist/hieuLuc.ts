/**
 * Tệp LÁ (chỉ import db): tài khoản còn hoạt động + còn vai ở chi nhánh — tách khỏi `giaoViec.ts` (rà #2233 P1-6) để `yThuc/access.ts` dùng được mà không tạo vòng
 * import (access → giaoViec → phoiHop → metrics đọc hằng của phoiHop trước khi khởi tạo). `giaoViec.ts` xuất lại.
 */
import { db } from '../db.ts';

/** Câu SQL: tài khoản `uid` đang hoạt động + có vai đang hiệu lực ở chi nhánh `cn` (hoặc vai toàn hệ thống). */
export const HOAT_DONG_O = (uid: string, cn: string) => `EXISTS (SELECT 1 FROM users u_ JOIN user_roles ur_ ON ur_.user_id = u_.id WHERE u_.id = ${uid}
  AND u_.status = 'active' AND u_.deleted_at IS NULL AND ur_.status = 'active' AND (ur_.branch_id IS NULL OR ur_.branch_id = ${cn}))`;
/** Câu SQL: chi nhánh HIỆN TẠI của em `sid` (lớp đang học, không có → hồ sơ) — như `CHI_NHANH_EM`, theo biểu thức id em. */
export const CN_EM = (sid: string) => `COALESCE((SELECT c_.branch_id FROM enrollments e_ JOIN classes c_ ON c_.id = e_.class_id WHERE e_.student_id = ${sid} AND e_.status = 'active'
  ORDER BY e_.id DESC LIMIT 1), (SELECT s_.branch_id FROM students s_ WHERE s_.id = ${sid}))`;
/** (2) Người được giao `uid` của việc của em `studentId` còn hiệu lực (còn hoạt động + còn vai ở chi nhánh hiện tại của em) — quyền ghi theo việc. */
export const conHieuLuc = (uid: number, studentId: number) => (db().prepare(`SELECT ${HOAT_DONG_O('?', CN_EM('?'))} AS ok`).get(uid, studentId, studentId) as any).ok === 1;
