/** XOA-CASE-PA (N37, chủ SP 05/11) — xoá Case / PA, gửi QL duyệt xoá (PA theo quy chế, Case hệ thống). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const soNhieu = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_XOA_CASE_PA = {
  'Xin xoá': 'Delete request',
  'Đã gửi QL duyệt xoá — đang chờ.': 'Already sent to the manager to approve deletion — waiting.',
  'Bạn không có quyền xoá Case này.': 'You do not have permission to delete this case.',
  'Bạn không có quyền xoá PA này.': 'You do not have permission to delete this plan.',
  'Đã gửi QL duyệt xoá PA': 'Sent to manager to approve deleting the plan',
  'Đã gửi QL duyệt xoá Case': 'Sent to manager to approve deleting the case',
  'Đang chờ QL duyệt xoá': 'Waiting for manager to approve deletion',
  /* VIEC-SAU-LOGIC: xoá MỘT kết quả PA (⋯ ở Lịch sử Case). */
  'Đã xoá kết quả PA': 'PA result deleted',
  'Xoá kết quả': 'Delete result',
  'Đã gửi QL duyệt xoá kết quả PA': 'Sent to manager to approve deleting the PA result',
  'Thao tác khác · {ten}': 'More actions · {ten}',
  'Không tìm thấy kết quả PA.': 'PA result not found.',
  'Bạn không có quyền xoá kết quả PA này.': 'You do not have permission to delete this PA result.',
  'Chỉ Quản lý xoá được kết quả PA.': 'Only a manager can delete PA results.',
  'Case đã hoàn thành — Mở lại Case trước khi xoá kết quả gần nhất.': 'The case is complete — reopen it before deleting the latest result.',
  'Lần ghi này đã Thay PA — dùng Sửa kết quả để bỏ Thay PA.': 'This entry replaced the plan — use Edit result to undo the replacement.',
  'Lần ghi này có Mini Test — dùng Sửa kết quả.': 'This entry has a Mini Test — use Edit result.',
  'PA đang chờ QL trả lời — rút thẻ Chờ duyệt trước khi xoá kết quả.': 'The plan is waiting for a manager reply — withdraw the approval card before deleting the result.',
  'Chỉ Quản lý hoặc người xoá được kết quả PA này mới khôi phục được.': 'Only a manager or someone who can delete this PA result can restore it.',
  'PA đã có kết quả ghi sau — không khôi phục được kết quả cũ này.': 'The plan has a newer result — this old result can no longer be restored.',
  'Xoá Case và {n} PA': (b) => `Delete case and ${soNhieu(b.n, 'plan', 'plans')}`,
} satisfies Record<string, Dich>;
