/** N70 (chủ SP 24/11) — Khai cấp bậc: ngày hoặc tháng · GVCN sửa bậc đã khai cần Head duyệt (thẻ `sua_khai_bac`). Khoá = chữ Việt trên web / câu lỗi máy chủ. */
import type { Dich } from '../en.ts';

export const EN_N70 = {
  'Ngày / tháng xử lý': 'Date / month handled',
  'Lý do sửa': 'Reason for the change',
  'Ví dụ: hồ sơ giấy chỉ có REPORT 1': 'E.g. the paper file only shows REPORT 1',
  'Lý do sửa — Head đọc để duyệt': 'Reason for the change — the Head reads it',
  'GVCN đã gửi duyệt': 'Core teacher sent for approval',
  'Mở Chờ duyệt': 'Open Approvals',
  'Gửi Head duyệt · việc tiếp ›': 'Send to Head · next task ›',
  'Gửi Head duyệt · {n} em': 'Send to Head · {n}',
  '{n} em gửi Head duyệt': '{n} sent to Head',
  '{m} em đã gửi Head duyệt': '{m} sent to Head',
  '{n} em đã lưu · {m} em gửi Head duyệt': '{n} saved · {m} sent to Head',
  'chờ duyệt {bac}': 'pending {bac}',
  'đã gửi duyệt {bac}': 'sent for approval: {bac}',
  'Đã gửi Head duyệt: {ten} · {cu} → {moi}. Bậc hiện tại giữ tới khi Head duyệt.': 'Sent to Head: {ten} · {cu} → {moi}. The current level stays until the Head approves.',
  'Ngày / tháng xử lý không hợp lệ — gõ dd/mm/yyyy hoặc mm/yyyy.': 'Invalid date / month handled — type dd/mm/yyyy or mm/yyyy.',
  'Ngày / tháng xử lý không được ở tương lai.': 'The date / month handled cannot be in the future.',
  'Ghi lý do sửa bậc ở ô Ghi chú — Head đọc để duyệt.': 'Give the reason for the change in the note — the Head reads it to approve.',
  'Yêu cầu sửa bậc của em không còn chờ Head — không hoàn tác em này.': 'This student’s level-change request is no longer pending — not undone.',
  'Sửa bậc đã khai cần Head duyệt — không hoàn tác em này.': 'Changing a declared level needs Head approval — not undone.',
  'Bậc đã đổi sau lúc gửi — gửi lại nếu vẫn cần sửa': 'The level changed after this was sent — send again if still needed',
  'Gửi Head duyệt sửa cấp bậc vi phạm': 'Sent incident-level change to Head',
  'Chưa đổi gì — chọn bậc hoặc ngày / tháng khác với bậc đã khai.': 'Nothing changed — pick a level or date / month different from the declared one.',
  'chờ Head duyệt {bac}': 'pending Head: {bac}',
  /* Hướng dẫn (GV: thẻ khai-bac · Head: thẻ duyet-y-thuc) */
  'Chọn <b>Bậc đã xử lý</b> và ngày hoặc tháng.': 'Pick the <b>Level handled</b> and a date or month.',
  'Sửa bậc đã khai: <b>Sửa cấp bậc</b>, ghi <b>Lý do sửa</b>, <b>Gửi Head duyệt</b>; bậc cũ giữ tới khi Head duyệt.': 'To change a declared level: <b>Edit level</b>, fill <b>Reason for the change</b>, <b>Send to Head</b>; the old level stays until approved.',
  'GVCN chọn cách khác Nâng 1 bậc, xin thu hồi xử lý, hoặc sửa bậc đã khai.': 'The core teacher picks an action other than Raise 1 level, asks to withdraw an action, or changes a declared level.',
  'Duyệt: GVCN ghi Đã thực hiện; thu hồi, sửa bậc thì bậc tính lại.': 'Approved: the core teacher records Done; a withdrawal or level change recounts the level.',
} satisfies Record<string, Dich>;
