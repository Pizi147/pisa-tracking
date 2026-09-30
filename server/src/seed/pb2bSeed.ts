import { batBuocTu, hanTheoNgay, HAN_Y_THUC_NGAY, type ViPhamVao } from '../../../shared/domain/index.ts';
import { chotHanXuLy } from '../yThuc/trangThai.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * PR-Pb2-b (Task 1) — BÙ ba cột ngày nghiệp vụ cho dữ liệu seed dựng thẳng bằng SQL (không qua `saveScore` / `recordViolation` / xử lý).
 * CHỈ seed: migrate không chép dữ liệu cũ (DB reset trước bản chính). Chạy CUỐI `runSeed`, sau mọi bộ demo.
 *   · `nhap_dau_ngay` = ngày có kết quả (hoặc ngày nhập) của ô có điểm, không quá ngày demo.
 *   · `phan_hoi_ngay` = lần xử lý / đề xuất sớm nhất có vi phạm đó.
 *   · `han_xu_ly`: vi phạm đang bắt buộc → `chotHanXuLy` (đúng luật); vi phạm đã xử lý → hạn nó CÓ LÚC chưa xử lý = cùng `batBuocTu` bỏ các lần
 *     xử lý đã đóng. ponytail: bỏ qua mốc vào lớp / Quay lại học và Tạm dừng ở bước dựng lại này — dữ liệu seed không có ca đó.
 */
export function buNgayPb2b(conn: any): void {
  conn.prepare(
    `UPDATE assessment_scores SET nhap_dau_ngay = MIN(COALESCE(result_date, substr(entered_at, 1, 10), ?), ?)
      WHERE nhap_dau_ngay IS NULL
        AND (raw_score IS NOT NULL OR band IS NOT NULL OR c1 IS NOT NULL OR c2 IS NOT NULL OR c3 IS NOT NULL OR c4 IS NOT NULL)`,
  ).run(DEMO_DATE, DEMO_DATE);
  conn.prepare(
    `UPDATE violations SET phan_hoi_ngay = (
       SELECT MIN(MIN(COALESCE(m.performed_on, substr(m.created_at, 1, 10)), ?))
         FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
        WHERE mv.violation_id = violations.id AND m.status != 'nhap')
      WHERE phan_hoi_ngay IS NULL`,
  ).run(DEMO_DATE);

  const rows = conn.prepare(
    `SELECT v.id, v.student_id, v.occurred_on, v.reported_on, v.ghi_nhan_luc, m.status, m.quyet_luc
       FROM violations v LEFT JOIN measure_violations mv ON mv.violation_id = v.id
       LEFT JOIN discipline_measures m ON m.id = mv.measure_id AND m.status = 'tu_choi'
      ORDER BY v.student_id, v.id`,
  ).all() as any[];
  const theoEm = new Map<number, Map<number, ViPhamVao>>();
  for (const r of rows) {
    const em = theoEm.get(r.student_id) ?? new Map<number, ViPhamVao>(); theoEm.set(r.student_id, em);
    const v: ViPhamVao = em.get(r.id) ?? { id: r.id, occurredOn: r.occurred_on, reportedOn: r.reported_on, ghiNhanLuc: r.ghi_nhan_luc ?? null, xuLy: [] };
    em.set(r.id, v);
    if (r.status) v.xuLy.push({ id: 0, kind: 'report_1', status: 'tu_choi', performedOn: null, quyetLuc: r.quyet_luc });
  }
  chotHanXuLy([...theoEm.keys()]);
  const dat = conn.prepare('UPDATE violations SET han_xu_ly = ? WHERE id = ? AND han_xu_ly IS NULL AND phan_hoi_ngay IS NOT NULL');
  for (const em of theoEm.values()) {
    for (const [id, tu] of batBuocTu([...em.values()])) dat.run(hanTheoNgay(tu, HAN_Y_THUC_NGAY), id);
  }
}
