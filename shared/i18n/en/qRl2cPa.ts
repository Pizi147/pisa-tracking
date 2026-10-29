/** Q-RL2c (Pa): chữ mới — Hoàn tác / Mở lại "Kết thúc PA". */
import type { Dich } from '../en.ts';

export const EN_Q_RL2C_PA = {
  'Mở lại PA': 'Reopen PA',
  'Đã mở lại PA': 'PA reopened',
  'Chỉ GVCN lớp em đang học hoặc Quản lý mở lại PA đã kết thúc.': 'Only the homeroom teacher of the student\'s current class or a manager can reopen an ended PA.',
  'Case đã hoàn thành — Mở lại Case trước khi mở lại PA.': 'Case is completed — reopen the Case before reopening the PA.',
  'PA này không có lần Kết thúc PA nào để hoàn tác.': 'This PA has no "End PA" action to undo.',
} satisfies Record<string, Dich>;
