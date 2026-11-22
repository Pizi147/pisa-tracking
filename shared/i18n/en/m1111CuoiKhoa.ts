/** MOCKUP-1111 màn 3 (chủ SP duyệt 11/11 — `thiet-ke/2026-11-11-mockup-1111/3-chuyen-tiep-lop-thuong.html`): Cuối khoá lớp thường. */
import type { Dich } from '../en.ts';

export const EN_M1111_CUOI_KHOA = {
  'Kết quả · {ten}': 'Result · {ten}',
  'Gợi ý theo Final': 'Suggested by the Final',
  '+ bổ trợ {n} buổi · {tuan} tuần': '+ {n} support sessions · {tuan} weeks',
  'Không chuyển lớp': 'No class move',
  'Đổi lớp': 'Change class',
  'Head thấy dưới Kết quả; nhận xét đi kèm việc Báo PH kết quả Test': 'Heads see it under Result; the comment goes with the Test-result report to parents',
  'Chọn cả nhóm {nhom}': 'Select the whole {nhom} group',
  'Chốt trước Final được. Bổ trợ Final và Xét lại lộ trình tự sinh khi có Final.': 'You can confirm before the Final. Final support and pathway review are created automatically once the Final is in.',
  'Lớp cho cả nhóm': 'Class for the whole group',
  'Lớp cho cả nhóm {nhom}': 'Class for the whole {nhom} group',
  'Tuần cho cả nhóm {nhom}': 'Week for the whole {nhom} group',
  'Lớp mới': 'New class',
  'từ {tuan}': 'from {tuan}',
  'Nhận xét chung cho các em đã chọn': 'Shared comment for the selected students',
  'Ghi cho {n} em': 'Write for {n} students',
  /* NHẸ HƠN PR-5 (khung v23 Cuối khoá) */
  'Final {d} — xem điểm từng kỹ năng': ({ d }) => `Final ${d} — see each skill`,
  'MT0 {d} — xem điểm từng kỹ năng': ({ d }) => `MT0 ${d} — see each skill`,
  'MT0 đang chấm — xem điểm từng kỹ năng': 'MT0 being marked — see each skill',
  'đang chấm': 'marking',
  'mốc {n}': ({ n }) => `pass mark ${n}`,
  'Tuần · {ten}': ({ ten }) => `Week · ${ten}`,
  'hạn chốt {ngay}': ({ ngay }) => `confirm by ${ngay}`,
  'Luật Kỳ vọng FT': 'FT expectation rule',
  '{kv}: MT0 Overall ≥ {moc} là Đạt (mỗi kỹ năng tô theo cùng mốc). Không đạt do Trung tâm → Case + Tutor {n} buổi/kỹ năng; do Học viên → ghi phương án, không Case. Chỉ Head chốt.':
    ({ kv, moc, n }) => `${kv}: MT0 Overall ≥ ${moc} is Met (each skill is coloured against the same mark). Not met due to the Centre → Case + Tutor ${n} sessions/skill; due to the student → record a plan, no Case. Only the Head confirms.`,
  '{n} em đạt': ({ n }) => `${n} met`,
  '{n} em không đạt': ({ n }) => `${n} not met`,
  '{n} em chờ MT0': ({ n }) => `${n} awaiting MT0`,
  'Điểm từng kỹ năng · {ten}': ({ ten }) => `Scores by skill · ${ten}`,
} satisfies Record<string, Dich>;
