/** UI-Y-THUC-HV — tab Ý thức & Phối hợp của hồ sơ học viên (mockup v7 `ho-so-hv-y-thuc.html`). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_UI_Y_THUC_HV = {
  'Vi phạm chưa xong': 'Open incidents',
  'Luật xử lý vi phạm': 'Incident rules',
  '≥ 3 vi phạm trong tuần này + tuần trước → bắt buộc xử lý, hạn 3 ngày. Vi phạm lẻ: Ghi nhận (đã xem, không cần xử lý) hoặc xử lý nếu nghiêm trọng.':
    '≥ 3 incidents this week + last week → action required within 3 days. A single incident: Note it (seen, no action needed) or act on it if serious.',
  'Ghi nhận tất cả ({n})': 'Note all ({n})',
  'Em không có vi phạm nào chưa xong. Lần gần nhất: {nhan} · {ngay}.': 'No open incidents. Last action: {nhan} · {ngay}.',
  'Em không có vi phạm nào chưa xong.': 'No open incidents.',
  'Nhật ký · {nhan} ({n})': 'Log · {nhan} ({n})',
  'Duyệt · thu hồi · Báo PH': 'Approval · withdrawal · Parent report',
  'Chưa có lần xử lý · chưa có gì cần báo PH': 'No action yet · nothing to report to parents',
  '— chưa có lần xử lý cần báo': '— no action to report yet',
  'QL đã duyệt {nhan} · chờ "Đã thực hiện"': 'Manager approved {nhan} · waiting for "Done"',
  'chưa tới mức bắt buộc': 'not yet required',
  'Xem lần xử lý {nhan}': 'View action {nhan}',
  'đề xuất chờ QL': 'proposed, awaiting manager',
  'QL đã duyệt': 'manager approved',
  '· kế tiếp': '· next',
  'Xác nhận hay Đề xuất?': 'Confirm or propose?',
  'Xác nhận xử lý: lưu ngay bậc lần này. Đề xuất QL duyệt: QL duyệt trước khi làm (WL, phương án khác).':
    'Confirm action: saves this step now. Propose for approval: the manager approves first (WL, other actions).',
} satisfies Record<string, Dich>;
