/** BO-QUA-XEP-MT — Bỏ qua việc Xếp lịch MT ở Công việc (chủ SP 03/11). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_BO_QUA_MOC = {
  'Bỏ qua: {viec}': 'Skip: {viec}',
  'Ẩn việc này. Lịch, PA, Case giữ nguyên.': 'Hide this task. Schedule, plan and case stay unchanged.',
  'Đã bỏ qua: {viec}': 'Skipped: {viec}',
  'Chưa bỏ qua được — thử lại.': 'Could not skip — try again.',
  'Bỏ qua bởi {ai} · {ngay}': 'Skipped by {ai} · {ngay}',
  'Khôi phục: {viec}': 'Restore: {viec}',
  'Việc đã bỏ qua không còn nhắc ai trong phạm vi. Lịch, PA, Case giữ nguyên; thiếu mốc khác thì việc mới hiện lại.':
    'Skipped tasks no longer remind anyone in scope. Schedule, plan and case stay unchanged; a different missing milestone shows a new task.',
  /* Câu lỗi máy chủ của POST /my-work/bo-qua. */
  'Việc này không bỏ qua được.': 'This task cannot be skipped.',
  'Chỉ Quản lý trong phạm vi bỏ qua được việc này.': 'Only a manager in scope can skip this task.',
  'Việc này không còn — có thể đã xếp lịch.': 'This task is gone — it may already be scheduled.',
  'Học viên này ngoài phạm vi của bạn.': 'This student is outside your scope.',
} satisfies Record<string, Dich>;
