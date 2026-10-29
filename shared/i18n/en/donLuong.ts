/** DON-LUONG (kế hoạch 2026-10-30-don.md): luồng còn sót ra-luong + OV-11. Khoá = chữ Việt. */
import type { Dich } from '../en.ts';

export const EN_DON_LUONG = {
  /* K23 — câu chặn ghi vi phạm có bước tiếp */
  'Em chưa xếp lớp — xếp lớp trước khi ghi vi phạm.': 'The student has no class yet — assign a class before logging an incident.',
  'Em đang tạm dừng — Quay lại học trước khi ghi vi phạm.': 'The student is paused — use Back to class before logging an incident.',
  'Em đã chuyển khỏi {lop} — ghi ở lớp em đang học.': 'The student has moved out of {lop} — log it in their current class.',
  'Em đã thôi học ở {lop} — không ghi vi phạm mới.': 'The student has left {lop} — no new incidents can be logged.',
  /* K39b */
  'QL đã quyết {buoc} lúc {ngay} — nhận xét không còn cần.': 'The manager already decided {buoc} on {ngay} — the note is no longer needed.',
} satisfies Record<string, Dich>;
