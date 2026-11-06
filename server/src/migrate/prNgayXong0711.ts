/**
 * XM-VIEC-DUNG-HAN b (chủ SP 07/11, plan.md mục 4 "07/11 đêm" mục 6): NGÀY XONG của việc tuyến Case "Xác nhận Case" / "Mô tả Case" / "Xác nhận Case S" —
 * `sos_cases.mo_ta_luc` = ngày nghiệp vụ Case lần đầu có nguyên nhân chính (`case_issues` role primary — chính điều kiện hết việc của `sosCaseStateMany`).
 * Chỉ thêm cột (chạy lại không làm gì); dữ liệu cũ để NULL (không đoán ngày) — "Việc đúng hạn" không tính việc đã xong mà không có ngày xong.
 */
import { demoToday } from '../demoConfig.ts';

export function migratePrNgayXong0711(conn: any, applied: string[]) {
  if (conn.prepare(`SELECT 1 FROM pragma_table_info('sos_cases') WHERE name = 'mo_ta_luc'`).get()) return;
  conn.exec('ALTER TABLE sos_cases ADD COLUMN mo_ta_luc TEXT');
  applied.push('XM-VIEC-DUNG-HAN b: thêm cột sos_cases.mo_ta_luc (ngày Case có mô tả / nguyên nhân chính; NULL = chưa có hoặc dữ liệu cũ).');
}

/**
 * Gọi sau mọi câu đổi `case_issues` của một Case: có nguyên nhân chính mà chưa có ngày → ngày nghiệp vụ hôm nay; mất nguyên nhân chính (hoàn tác) → NULL.
 * Một câu, chỉ ghi khi đổi.
 */
export function capNhatMoTaLuc(conn: any, caseId: number): void {
  conn.prepare(`UPDATE sos_cases SET mo_ta_luc = CASE WHEN mo_ta_luc IS NULL THEN ? END WHERE id = ?
      AND (mo_ta_luc IS NULL) = EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sos_cases.id AND ci.role = 'primary')`).run(demoToday(), caseId);
}
