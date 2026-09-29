/**
 * PHẦN BỔ SUNG CHO DÒNG HỌC VIÊN CỦA LỚP (PR-Qa) — nhãn cảnh báo Ý thức 5 ngày (YT-8), các Case đang mở dùng dựng "Việc tiếp theo".
 * Tách khỏi classes.ts để không vòng import; mỗi thứ MỘT lần cho cả lớp, không hỏi từng em.
 *
 * (PR-Qa 17, sửa theo rà soát planning): số "Case đang mở" của lớp — trước ở đây qua một hàm dựng riêng — nay tính thẳng bằng
 * `listCases(p, { classId })` tại nơi dùng (`classes.ts`, `hocVienLop.ts`), vì hàm cũ tự viết một câu SQL enrollment→class
 * riêng rồi gọi `listCases(p, {})` KHÔNG lọc phạm vi gì để lấy Case — quét mọi Case trong hệ thống, chậm hàng chục giây
 * trên Turso. Xem `.superpowers/sdd/2026-09-22-pr-qa-hoc-vien-lop/task-17-planning-fix-report.md`.
 */
import { PERMISSIONS, type CaseViec, type NhanYThucEm } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { emCuaLop, nhanNhomEm, trangThaiYThuc } from '../yThuc/trangThai.ts';
import { listCases } from '../cases/cases.ts';
import { chiTietCaseMo } from '../cases/caseLop.ts';

/**
 * PR-YT4: nhãn Ý thức ở dòng em — `Quá hạn` / `Cần xử lý` (nhóm `qua_han` | `bat_buoc` của `trangThaiYThuc`), không còn "{n} vi phạm".
 * Người không được xem hồ sơ học viên của lớp thì không có nhãn — ẩn chứ không làm hỏng cả bảng.
 */
export function canhBaoTheoHocVien(p: Principal, classId: number): Map<number, NhanYThucEm> {
  const out = new Map<number, NhanYThucEm>();
  if (!can(p, PERMISSIONS.STUDENT_VIEW, { classId })) return out;
  for (const [id, em] of trangThaiYThuc(emCuaLop(classId))) {
    /* PR-S3F #12: em Tạm dừng không tính (T65) — cùng tập với chỉ số `hv-can-xu-ly` (ghi danh `active`), nên huy hiệu lớp và chỉ số không lệch. */
    if (em.tamDung) continue;
    const n = nhanNhomEm(em);
    if (n) out.set(id, n);
  }
  return out;
}

/** Số em cần hành động Ý thức (Quá hạn + Bắt buộc) của lớp — huy hiệu ⚠ của tab. */
export function soEmCanXuLyYThuc(p: Principal, classId: number): number {
  return canhBaoTheoHocVien(p, classId).size;
}

/**
 * Việc tiếp của Case chưa xong của từng em trong lớp (lớp em ĐANG học), theo đúng phạm vi người xem — cùng tập với `/cases?classId=`.
 * Đọc theo LÔ (`chiTietCaseMo`, số câu SQL cố định) — dùng `viecTiepCuaEm` dựng cột Việc tiếp theo / Theo dõi.
 */
export function caseViecTheoHocVien(p: Principal, classId: number): Map<number, CaseViec[]> {
  const out = new Map<number, CaseViec[]>();
  const mo = listCases(p, { classId }).rows.filter((c) => c.status !== 'done' && c.studentId !== null);
  const ct = chiTietCaseMo(mo);
  for (const c of mo) {
    const x = ct.get(c.id);
    if (!x) continue;
    out.set(x.studentId, [...(out.get(x.studentId) ?? []), { caseId: c.id, topic: c.topic, viecTiep: x.viecTiep }]);
  }
  return out;
}
