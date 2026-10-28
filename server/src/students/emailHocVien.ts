import { db, theoLo } from '../db.ts';

/**
 * OV-13f (chủ SP 15/10, Q8): email học viên KHÔNG TRÙNG giữa các em — so sau cắt khoảng trắng + chữ thường. Ràng buộc ở mã, không UNIQUE DB
 * (dữ liệu cũ có thể trùng). Mọi em còn trong DB đều tính (Lưu trữ / Kết thúc cũng tính; xoá học viên là
 * xoá hẳn). Chỉ kiểm khi email ĐỔI: em cũ đang trùng vẫn sửa được các ô khác.
 */
export type EmDungEmail = { id: number; ten: string; lop: string | null };

/** Email (đã chuẩn hoá) → em đang dùng (id nhỏ nhất), bỏ qua em trong `tru`. Lớp = lớp đang học / tạm dừng, không có thì lớp cuối. */
export function emailDangDung(emails: readonly string[], tru: readonly number[] = []): Map<string, EmDungEmail> {
  const out = new Map<string, EmDungEmail>();
  const bo = new Set(tru);
  theoLo([...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT s.id, s.full_name, lower(trim(s.email)) AS e,
              (SELECT c.code FROM enrollments x JOIN classes c ON c.id = x.class_id WHERE x.student_id = s.id
                ORDER BY x.status IN ('active', 'paused') DESC, x.id DESC LIMIT 1) AS lop
         FROM students s WHERE lower(trim(s.email)) IN (${ph}) ORDER BY s.id`).all(...lo) as any[]) {
      if (!bo.has(r.id) && !out.has(r.e)) out.set(r.e, { id: r.id, ten: r.full_name, lop: r.lop ?? null });
    }
  });
  return out;
}

/** Câu lỗi chung (thêm một em, nhập lô, sửa một em, sửa cả lớp): "Email đã dùng cho {tên} · {lớp}". */
export const cauEmailTrung = (em: { ten: string; lop: string | null }) => `Email đã dùng cho ${em.ten}${em.lop ? ` · ${em.lop}` : ''}`;
