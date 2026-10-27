/** SV-NX-CASE (plan.md 1.6 N8, chủ SP 23/10): nhắc chỉ MT mới nhất, bỏ chữ "cũ", mô tả Case theo nhận xét, Xác nhận Case S chấm chéo. */
import type { Dich } from '../en.ts';

export const EN_SV_NX_CASE = {
  'Chỉ nhập bù': 'Catch-up entry only',
  'Chờ nhập bù': 'Awaiting catch-up entry',
  'Mô tả Case cần ít nhất {n} ký tự — vấn đề học thuật của kỹ năng.': 'The Case description needs at least {n} characters — the academic issue in this skill.',
  'Đang theo nhận xét {mt} — sửa ở đây thì mô tả tách khỏi nhận xét.': 'Following the {mt} comment — editing here detaches the description from the comment.',
  'Mô tả đã sửa riêng — nhận xét của bài không đè.': 'Description edited separately — test comments no longer overwrite it.',
  'Nhận xét chấm chéo': 'Cross-marker comment',
  'Chưa có nhận xét': 'No comment yet',
  'Mô tả Case': 'Describe Case',   // D8: nút / việc (động từ); ô nhập = 'Mô tả' → Description
  'Dùng làm mô tả': 'Use as description',
  'Giữ mô tả đang có': 'Keep current description',
  'Viết mô tả khác': 'Write another description',
  'Case này không có nhận xét Speaking chấm chéo chờ xác nhận.': "This Case has no cross-marked Speaking comment awaiting confirmation.",
  'Nhận xét Speaking chấm chéo đã được xác nhận.': "The cross-marked Speaking comment has already been confirmed.",
  'Chỉ GV phụ trách Speaking của lớp, GVCN hoặc Quản lý xác nhận được Case này.': "Only the class's Speaking teacher, the homeroom teacher or a manager can confirm this Case.",
  'Chọn: dùng nhận xét chấm chéo, giữ mô tả, hoặc viết mô tả khác.': "Choose: use the cross-marker comment, keep the description, or write another one.",
  'Bài chưa có nhận xét chấm chéo — viết mô tả khác.': "The test has no cross-marker comment — write another description.",
  'Case chưa có mô tả — dùng nhận xét chấm chéo hoặc viết mô tả khác.': "The Case has no description yet — use the cross-marker comment or write another one.",
  'Dùng làm mô tả (thay mô tả đang có)': 'Use as description (replaces the current one)',
  'Mô tả đang có — sẽ thay bằng nhận xét chấm chéo (cả nhóm nguyên nhân theo bài)': 'Current description — will be replaced by the cross-marker comment (cause groups from the test too)',
  'Mô tả đang có': 'Current description',
  'Case vừa được cập nhật lúc {luc} — xem lại rồi bấm Lưu lần nữa để ghi đè': 'The Case was just updated at {luc} — review it, then press Save again to overwrite',
} satisfies Record<string, Dich>;
