/** XOA-MT (chủ SP 06/11) — một thao tác "Xoá" MT ở Kế hoạch Test và hồ sơ MT; ô "Đã xoá" + Khôi phục. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_XOA_MT = {
  'Xoá {dot}': 'Delete {dot}',
  'Khôi phục {dot}': 'Restore {dot}',
  'Xoá MT{attemptNo}': 'Delete MT{attemptNo}',
  '{dot}, đã xoá': '{dot}, deleted',
  'Đã xoá {dot} · {ten}': 'Deleted {dot} · {ten}',
  'Đã khôi phục {dot} · {ten}': 'Restored {dot} · {ten}',
  'Đã khôi phục {x}': 'Restored {x}',
  'Chưa xoá được — thử lại.': 'Not deleted — try again.',
  'Chưa khôi phục được — thử lại.': 'Not restored — try again.',
  'Đã có điểm — không xoá được': 'Already scored — cannot delete',
  'Đã làm bài — không xoá được': 'Already taken — cannot delete',
  'Ô vẫn hiện "Đã xoá", khôi phục được ngay': 'The cell stays as "Deleted" and can be restored at once',
  'Chỉ Quản lý khôi phục được MT đã xoá.': 'Only managers can restore a deleted MT.',
  '{mon} ra khỏi MT này, không tính vào kết quả. Khôi phục được ngay ở dòng {mon}.': '{mon} leaves this MT and is not counted in the result. Restore it any time from the {mon} row.',
  'Xoá cả điểm': 'Delete the score too',
  '{mon} đã có điểm. Xoá cả điểm?': '{mon} already has a score. Delete the score too?',
  'Xoá kỹ năng khỏi MT': 'Delete skill from MT',
  'Xoá MT': 'Delete MT',
  'Chỉ Quản lý mới xoá được MT.': 'Only managers can delete an MT.',
  'Chỉ Quản lý mới khôi phục được MT.': 'Only managers can restore an MT.',
  'Chỉ xoá được MT của lớp FT.': 'Only Fast Track MTs can be deleted.',
  '{nhan} đã xoá.': '{nhan} is already deleted.',
  '{nhan} đã có điểm — không xoá được.': '{nhan} already has scores — cannot delete.',
  '{nhan} đã làm bài — không xoá được.': '{nhan} has already been taken — cannot delete.',
} satisfies Record<string, Dich>;
