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
  /* A6 */
  'Danh sách thông báo không hợp lệ (tối đa {n} dòng).': 'Invalid notification list (at most {n} rows).',
  /* A8 */
  'Lớp thường chỉ có đợt Progress Test, Checkpoint và Final Test.': 'Regular classes only have Progress Test, Checkpoint and Final Test rounds.',
  /* Chủ SP 30/10 câu 1 — hồ sơ lượt */
  'đã vắng {tuan} · khôi phục {ngay}': 'absent {tuan} · restored {ngay}',
  'khôi phục {ngay}': 'restored {ngay}',
} satisfies Record<string, Dich>;
