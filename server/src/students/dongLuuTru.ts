/**
 * LƯU TRỮ ĐÓNG HẲN VIỆC (chủ SP 26/11): em vào Lưu trữ (Tạm dừng / Kết thúc học) → việc còn mở của em ĐÓNG — Phối hợp SOS (+ phần Meeting), Báo PH, Tình hình
 * học tập, Trả lại vi phạm; Tạm dừng đóng cả Case / PA (Kết thúc học đã đóng Case "Học viên kết thúc khoá" ở `setStudentStatus`). Mã hệ thống `system_luu_tru` /
 * lý do Case `luu_tru`, dòng giữ nguyên. Quay lại học KHÔNG mở lại (chỉ việc mới); Hoàn tác Tạm dừng / Kết thúc học trả ĐÚNG các dòng lần đó đóng
 * (`moLaiViecLuuTru`, chỉ dòng còn mang dấu hệ thống). Id lưu ở nhật ký `student.status` của lần đó. Gọi trong giao dịch của nơi gọi.
 * Không đóng (luật / dữ liệu): ghi KQ thi thật (chủ SP giữ); vi phạm chưa xử lý và Mini Test chưa có trạng thái để đóng — ẩn khỏi việc khi em Lưu trữ như cũ.
 */
import { db, theoLo } from '../db.ts';
import { nowIso } from '../util.ts';
import { closeCasesBySystem, moLaiCaseHeThongDong, type ChupCaseDong } from '../cases/systemClose.ts';

export type DongLuuTru = { case: ChupCaseDong[]; tinHieu: number[]; phoiHop: number[]; meeting: number[]; baoPh: number[]; tinhHinh: number[]; traLai: number[] };
const MA = 'system_luu_tru';

const idCua = (sql: string, ...a: unknown[]) => (db().prepare(sql).all(...a) as any[]).map((r) => r.id as number);
const capNhat = (ids: readonly number[], sql: (ph: string) => string, ...truoc: unknown[]) =>
  theoLo([...ids], (lo, ph) => { db().prepare(sql(ph)).run(...truoc, ...lo); });

/** Đóng việc còn mở của em. `dongCase`: Tạm dừng (Kết thúc học đóng Case ở đường riêng). */
export function dongViecLuuTru(actorUserId: number | null, studentId: number, ngay: string, dongCase: boolean): DongLuuTru {
  const luc = nowIso();
  const cs = dongCase ? closeCasesBySystem({ actorUserId, studentId, reason: 'luu_tru', on: ngay }) : null;
  const phoiHop = idCua(`SELECT id FROM sos_coordination_actions WHERE student_id = ? AND status = 'pending'`, studentId);
  const meeting = phoiHop.length ? idCua(`SELECT id FROM meeting_phan WHERE trang_thai = 'mo' AND phoi_hop_id IN (SELECT value FROM json_each(?))`, JSON.stringify(phoiHop)) : [];
  const baoPh = idCua(`SELECT id FROM viec_bao_ph WHERE student_id = ? AND trang_thai = 'mo'`, studentId);
  const tinhHinh = idCua(`SELECT id FROM tinh_hinh_hoc_tap WHERE student_id = ? AND trang_thai = 'mo'`, studentId);
  const traLai = idCua(`SELECT id FROM vi_pham_tra_lai WHERE student_id = ? AND trang_thai = 'mo'`, studentId);
  capNhat(phoiHop, (ph) => `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = '${MA}', removed_by = NULL, removed_at = ?, updated_at = ? WHERE id IN (${ph})`, ngay, luc);
  capNhat(meeting, (ph) => `UPDATE meeting_phan SET trang_thai = 'bo' WHERE id IN (${ph})`);
  capNhat(baoPh, (ph) => `UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = '${MA}', bo_boi = NULL, bo_luc = ? WHERE id IN (${ph})`, luc);
  /* Tình hình / Trả lại không có cột lý do: "rút" với người rút / người xong trống = hệ thống (người dùng rút luôn ghi người). */
  capNhat(tinhHinh, (ph) => `UPDATE tinh_hinh_hoc_tap SET trang_thai = 'rut', rut_boi = NULL, rut_luc = ? WHERE id IN (${ph})`, luc);
  capNhat(traLai, (ph) => `UPDATE vi_pham_tra_lai SET trang_thai = 'rut', xong_boi = NULL, xong_luc = ? WHERE id IN (${ph})`, luc);
  return { case: cs?.chup ?? [], tinHieu: cs?.withdrawnSignalIds ?? [], phoiHop, meeting, baoPh, tinhHinh, traLai };
}

/** Hoàn tác: trả đúng các dòng lần đóng đó — chỉ dòng còn mang dấu hệ thống (người đã sửa sau thì giữ). */
export function moLaiViecLuuTru(actorUserId: number | null, studentId: number, d: Partial<DongLuuTru> | null | undefined): void {
  if (!d) return;
  const luc = nowIso();
  if (d.case?.length || d.tinHieu?.length) moLaiCaseHeThongDong({ actorUserId, studentId, reason: 'luu_tru', chup: d.case ?? [], tinHieu: d.tinHieu ?? [], lyDo: 'Hoàn tác Tạm dừng' });
  capNhat(d.phoiHop ?? [], (ph) => `UPDATE sos_coordination_actions SET status = 'pending', remove_reason_code = NULL, removed_by = NULL, removed_at = NULL, updated_at = ?
    WHERE id IN (${ph}) AND status = 'removed' AND remove_reason_code = '${MA}'`, luc);
  capNhat(d.meeting ?? [], (ph) => `UPDATE meeting_phan SET trang_thai = 'mo' WHERE id IN (${ph}) AND trang_thai = 'bo'`);
  capNhat(d.baoPh ?? [], (ph) => `UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_boi = NULL, bo_luc = NULL WHERE id IN (${ph}) AND trang_thai = 'bo' AND bo_ly_do = '${MA}'`);
  capNhat(d.tinhHinh ?? [], (ph) => `UPDATE tinh_hinh_hoc_tap SET trang_thai = 'mo', rut_luc = NULL WHERE id IN (${ph}) AND trang_thai = 'rut' AND rut_boi IS NULL`);
  capNhat(d.traLai ?? [], (ph) => `UPDATE vi_pham_tra_lai SET trang_thai = 'mo', xong_luc = NULL WHERE id IN (${ph}) AND trang_thai = 'rut' AND xong_boi IS NULL`);
}
