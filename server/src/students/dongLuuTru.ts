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

export type DongLuuTru = { lyDoCase?: 'luu_tru' | 'course_ended'; case: ChupCaseDong[]; tinHieu: number[]; phoiHop: number[]; meeting: number[]; baoPh: number[]; tinhHinh: number[]; traLai: number[];
  /** Rà #2223 P2-3: đề xuất xử lý Ý thức chờ duyệt / đã duyệt chờ thực hiện → `thu_hoi` (không vào số nào, giữ dòng) + thẻ duyệt chờ đóng. */
  xuLy?: { id: number; status: string }[]; theDuyet?: number[];
  /** BAOPH-0 (4.6): khối giao việc "Xử lý vi phạm" của em (`viec_xu_ly`, id = em) → `bo`; Hoàn tác trả `mo`. */
  giaoXuLy?: number[];
  /** LPB-1 (N73 ⑤): khung việc của em (Chốt ngày thi · Bổ sung hồ sơ · Xếp lịch MT) → `bo`; Hoàn tác trả `mo`. KQ thi thật giữ (chủ SP); Bước tiếp `bo` khi chưa ai được giao làm
   *  (`lam_boi` NULL) — người được giao ĐÃ CHỌN (Tạm dừng / Kết thúc chính là lựa chọn) giữ dòng để Hoàn tác ngắn (rà #2280 v3); lượt quét ngày đóng `xong`. */
  khung?: { bang: string; id: number }[] };
const MA = 'system_luu_tru';
const LY_DO_THE = 'Học viên vào Lưu trữ';

const idCua = (sql: string, ...a: unknown[]) => (db().prepare(sql).all(...a) as any[]).map((r) => r.id as number);
const capNhat = (ids: readonly number[], sql: (ph: string) => string, ...truoc: unknown[]) =>
  theoLo([...ids], (lo, ph) => { db().prepare(sql(ph)).run(...truoc, ...lo); });

/** Đóng việc còn mở của em. `lyDoCase`: đóng cả Case — 'luu_tru' (Tạm dừng), 'course_ended' (migrate: em đã Kết thúc học); null = không (Kết thúc học đóng Case ở đường riêng). */
export function dongViecLuuTru(actorUserId: number | null, studentId: number, ngay: string, lyDoCase: 'luu_tru' | 'course_ended' | null): DongLuuTru {
  const luc = nowIso();
  const cs = lyDoCase ? closeCasesBySystem({ actorUserId, studentId, reason: lyDoCase, on: ngay }) : null;
  const phoiHop = idCua(`SELECT id FROM sos_coordination_actions WHERE student_id = ? AND status = 'pending'`, studentId);
  const meeting = phoiHop.length ? idCua(`SELECT id FROM meeting_phan WHERE trang_thai = 'mo' AND phoi_hop_id IN (SELECT value FROM json_each(?))`, JSON.stringify(phoiHop)) : [];
  const baoPh = idCua(`SELECT id FROM viec_bao_ph WHERE student_id = ? AND trang_thai = 'mo'`, studentId);
  const tinhHinh = idCua(`SELECT id FROM tinh_hinh_hoc_tap WHERE student_id = ? AND trang_thai = 'mo'`, studentId);
  const traLai = idCua(`SELECT id FROM vi_pham_tra_lai WHERE student_id = ? AND trang_thai = 'mo'`, studentId);
  const giaoXuLy = idCua(`SELECT id FROM viec_xu_ly WHERE id = ? AND trang_thai = 'mo'`, studentId);
  const khung = db().prepare(`SELECT 'viec_chot_ngay_thi' AS bang, id AS id FROM viec_chot_ngay_thi WHERE trang_thai = 'mo' AND id IN (SELECT id FROM learning_cycles WHERE student_id = ?1)
      UNION ALL SELECT 'viec_buoc_tiep', id FROM viec_buoc_tiep WHERE trang_thai = 'mo' AND lam_boi IS NULL AND id IN (SELECT id FROM learning_cycles WHERE student_id = ?1)   -- rà #2280 v3
      UNION ALL SELECT 'viec_bo_sung_ho_so', id FROM viec_bo_sung_ho_so WHERE trang_thai = 'mo' AND id = ?1
      UNION ALL SELECT 'viec_xep_lich_mt', id FROM viec_xep_lich_mt WHERE trang_thai = 'mo' AND id IN (SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.student_id = ?1)`).all(studentId) as { bang: string; id: number }[];
  const xuLy = db().prepare(`SELECT id, status FROM discipline_measures WHERE student_id = ? AND status IN ('cho_duyet', 'da_duyet')`).all(studentId) as { id: number; status: string }[];
  const theDuyet = xuLy.length ? idCua(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND trang_thai = 'cho' AND doi_tuong_loai = 'discipline_measure'
      AND doi_tuong_id IN (SELECT value FROM json_each(?))`, JSON.stringify(xuLy.map((m) => m.id))) : [];
  capNhat(phoiHop, (ph) => `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = '${MA}', removed_by = NULL, removed_at = ?, updated_at = ? WHERE id IN (${ph})`, ngay, luc);
  capNhat(meeting, (ph) => `UPDATE meeting_phan SET trang_thai = 'bo' WHERE id IN (${ph})`);
  capNhat(baoPh, (ph) => `UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = '${MA}', bo_boi = NULL, bo_luc = ? WHERE id IN (${ph})`, luc);
  /* Tình hình / Trả lại không có cột lý do: "rút" với người rút / người xong trống = hệ thống (người dùng rút luôn ghi người). */
  capNhat(tinhHinh, (ph) => `UPDATE tinh_hinh_hoc_tap SET trang_thai = 'rut', rut_boi = NULL, rut_luc = ? WHERE id IN (${ph})`, luc);
  capNhat(traLai, (ph) => `UPDATE vi_pham_tra_lai SET trang_thai = 'rut', xong_boi = NULL, xong_luc = ? WHERE id IN (${ph})`, luc);
  capNhat(giaoXuLy, (ph) => `UPDATE viec_xu_ly SET trang_thai = 'bo' WHERE id IN (${ph})`);
  for (const k of khung) db().prepare(`UPDATE ${k.bang} SET trang_thai = 'bo', xong_luc = ? WHERE id = ?`).run(luc, k.id);
  capNhat(xuLy.map((m) => m.id), (ph) => `UPDATE discipline_measures SET status = 'thu_hoi', updated_at = ? WHERE id IN (${ph})`, luc);
  capNhat(theDuyet, (ph) => `UPDATE yeu_cau_duyet SET trang_thai = 'tu_dong', ly_do_dong = '${LY_DO_THE}', xu_ly_luc = ? WHERE id IN (${ph}) AND trang_thai = 'cho'`, luc);
  return { ...(lyDoCase ? { lyDoCase } : {}), case: cs?.chup ?? [], tinHieu: cs?.withdrawnSignalIds ?? [], phoiHop, meeting, baoPh, tinhHinh, traLai,
    ...(xuLy.length ? { xuLy, theDuyet } : {}), ...(giaoXuLy.length ? { giaoXuLy } : {}), ...(khung.length ? { khung } : {}) };
}

/** Hoàn tác: trả đúng các dòng lần đóng đó — chỉ dòng còn mang dấu hệ thống (người đã sửa sau thì giữ). */
export function moLaiViecLuuTru(actorUserId: number | null, studentId: number, d: Partial<DongLuuTru> | null | undefined, lyDo = 'Hoàn tác Tạm dừng'): void {
  if (!d) return;
  const luc = nowIso();
  if (d.case?.length || d.tinHieu?.length) moLaiCaseHeThongDong({ actorUserId, studentId, reason: d.lyDoCase ?? 'luu_tru', chup: d.case ?? [], tinHieu: d.tinHieu ?? [], lyDo });
  capNhat(d.phoiHop ?? [], (ph) => `UPDATE sos_coordination_actions SET status = 'pending', remove_reason_code = NULL, removed_by = NULL, removed_at = NULL, updated_at = ?
    WHERE id IN (${ph}) AND status = 'removed' AND remove_reason_code = '${MA}'`, luc);
  capNhat(d.meeting ?? [], (ph) => `UPDATE meeting_phan SET trang_thai = 'mo' WHERE id IN (${ph}) AND trang_thai = 'bo'`);
  capNhat(d.baoPh ?? [], (ph) => `UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_boi = NULL, bo_luc = NULL WHERE id IN (${ph}) AND trang_thai = 'bo' AND bo_ly_do = '${MA}'`);
  capNhat(d.tinhHinh ?? [], (ph) => `UPDATE tinh_hinh_hoc_tap SET trang_thai = 'mo', rut_luc = NULL WHERE id IN (${ph}) AND trang_thai = 'rut' AND rut_boi IS NULL`);
  capNhat(d.traLai ?? [], (ph) => `UPDATE vi_pham_tra_lai SET trang_thai = 'mo', xong_luc = NULL WHERE id IN (${ph}) AND trang_thai = 'rut' AND xong_boi IS NULL`);
  capNhat(d.giaoXuLy ?? [], (ph) => `UPDATE viec_xu_ly SET trang_thai = 'mo' WHERE id IN (${ph}) AND trang_thai = 'bo'`);
  for (const k of d.khung ?? []) if (/^viec_[a-z_]+$/.test(k.bang)) db().prepare(`UPDATE ${k.bang} SET trang_thai = 'mo', xong_luc = NULL WHERE id = ? AND trang_thai = 'bo'`).run(k.id);
  for (const m of d.xuLy ?? []) db().prepare(`UPDATE discipline_measures SET status = ?, updated_at = ? WHERE id = ? AND status = 'thu_hoi'`).run(m.status, luc, m.id);
  capNhat(d.theDuyet ?? [], (ph) => `UPDATE yeu_cau_duyet SET trang_thai = 'cho', ly_do_dong = NULL, xu_ly_luc = NULL WHERE id IN (${ph}) AND trang_thai = 'tu_dong' AND ly_do_dong = '${LY_DO_THE}'`);
}
