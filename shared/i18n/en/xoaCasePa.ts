/** XOA-CASE-PA (N37, chủ SP 05/11) — xoá Case / PA, gửi QL duyệt xoá (PA theo quy chế, Case hệ thống). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const soNhieu = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_XOA_CASE_PA = {
  'Đã gửi QL duyệt xoá PA': 'Sent to manager to approve deleting the plan',
  'Đã gửi QL duyệt xoá Case': 'Sent to manager to approve deleting the case',
  'Đang chờ QL duyệt xoá': 'Waiting for manager to approve deletion',
  'Gửi QL duyệt xoá PA?': 'Ask manager to delete this plan?',
  'Gửi QL duyệt xoá Case?': 'Ask manager to delete this case?',
  'Gửi QL duyệt': 'Send to manager',
  'PA theo quy chế — QL duyệt mới xoá.': 'Regulation plan — deleted after manager approval.',
  'Case hệ thống hoặc có PA theo quy chế — QL duyệt mới xoá.': 'System case or has a regulation plan — deleted after manager approval.',
  '{n} kết quả PA': (b) => soNhieu(b.n, 'plan result', 'plan results'),
  'Xoá Case và {n} PA': (b) => `Delete case and ${soNhieu(b.n, 'plan', 'plans')}`,
  'xoá cả {kem}': 'also deletes {kem}',
} satisfies Record<string, Dich>;
