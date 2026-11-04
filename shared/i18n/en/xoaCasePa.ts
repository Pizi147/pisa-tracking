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
  'Xoá Case và {n} PA': (b) => `Delete case and ${soNhieu(b.n, 'plan', 'plans')}`,
} satisfies Record<string, Dich>;
