/** LUAT-5 — thu hồi lần xử lý Ý thức qua QL (lý do bắt buộc), xử lý không tăng bậc. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_LUAT5 = {
  'Thu hồi xử lý Ý thức': 'Revoke conduct action',
  'Thu hồi…': 'Revoke…',
  'Thu hồi': 'Revoke',
  'Gửi QL': 'Send to manager',
  'Thu hồi lần xử lý này?': 'Revoke this action?',
  'Gửi QL thu hồi?': 'Ask manager to revoke?',
  'Rút yêu cầu thu hồi': 'Withdraw revoke request',
  'Đã thu hồi {nhan}': (b) => `${b.nhan} revoked`,
  'Đã gửi QL thu hồi {nhan}': (b) => `Revoke request for ${b.nhan} sent to manager`,
  'Đã rút yêu cầu thu hồi {nhan}': (b) => `Revoke request for ${b.nhan} withdrawn`,
  'Chờ QL duyệt thu hồi · gửi {ngay}: “{lyDo}”': (b) => `Awaiting manager to revoke · sent ${b.ngay}: “${b.lyDo}”`,
  '{x} từ chối thu hồi {ngay}: “{lyDo}”': (b) => `${b.x} declined the revoke ${b.ngay}: “${b.lyDo}”`,
  'Đã thu hồi {ngay} · {x} duyệt: “{lyDo}”': (b) => `Revoked ${b.ngay} · approved by ${b.x}: “${b.lyDo}”`,
  'Không tăng bậc': 'Keep level',
  'Cần xử lý nặng hơn (Meeting CX/GĐCN, WL 3, Đình chỉ…) hoặc không tăng bậc': 'Needs a heavier action (CX/Branch Director meeting, WL 3, Suspension…) or keeping the level',
} satisfies Record<string, Dich>;
