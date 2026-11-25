/** RA-2511 PR 1 (sua-quyen): quyền máy chủ + Case / PA / Tutor. Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_SUA_QUYEN_2511 = {
  'Bỏ chữ, sửa nhận xét này': 'Discard and edit this comment',
  'Em không còn học lớp nào — không hoàn tác được.': 'The student is no longer in a class — cannot undo.',
  'CX không đổi chương trình / lịch MT của lớp — nhờ Head.': 'CX cannot change the class programme / default MT schedule — ask the Head.',
  'Dòng PA {x}: nội dung ít nhất {n} ký tự.': (b) => `Plan line ${b.x}: content needs at least ${b.n} characters.`,
} satisfies Record<string, Dich>;
