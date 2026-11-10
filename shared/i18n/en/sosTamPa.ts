/** SOS-TAM-PA (chủ SP 11/11) — SOS tạm: GV ghi mô tả + PA trước khi chốt; "Chọn PA" khi PA của GV khác PA quy chế. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_SOS_TAM_PA = {
  'PA khác quy chế': 'PA other than rule-based',
  'Chọn PA': 'Choose PA',
  'Chờ chọn PA': 'Awaiting PA choice',
  'Chọn PA · {kn}': (b) => `Choose PA · ${b.kn}`,
  'Theo PA quy chế': 'Use rule-based PA',
  'Đã chọn PA quy chế': 'Rule-based PA chosen',
  'PA của GV': 'Teacher’s PA',
  'khác PA quy chế ({loai}). Chọn một:': (b) => `differs from the rule-based PA (${b.loai}). Choose one:`,
  'Theo PA quy chế: PA của GV dừng. Giữ PA của tôi: QL duyệt, quá 3 ngày chưa trả lời thì chốt theo PA của bạn.':
    'Use rule-based PA: the teacher’s PA stops. Keep my PA: the manager approves; with no answer after 3 days your PA is kept.',
  'Giữ PA của tôi': 'Keep my PA',
  'PA của GV dừng': 'teacher’s PA stopped',
  'Case đã đóng — không còn chọn PA được.': 'The case is closed — PA can no longer be chosen.',
  'PA quy chế này không còn chờ chọn.': 'This rule-based PA is no longer awaiting a choice.',
  'Đang chờ Quản lý duyệt — Rút trước nếu muốn chọn lại.': 'Awaiting manager approval — withdraw first to choose again.',
  'Case không có PA của GV khác PA quy chế — Xác nhận PA quy chế.': 'The case has no teacher PA different from the rule-based PA — confirm the rule-based PA.',
  'Đã gửi Quản lý duyệt rồi.': 'Already sent to the manager.',
  'Case có PA của GV khác PA quy chế — mở "Chọn PA" cho em này.': 'The case has a teacher PA different from the rule-based PA — open "Choose PA" for this student.',
  'Giữ {gv} · quá 3 ngày chưa trả lời: chốt theo PA của bạn': (b) => `Keep ${b.gv} · no answer after 3 days: your PA is kept`,
  'Chờ QL duyệt PA của GV': 'Awaiting manager · teacher’s PA',
  'PA của GV vẫn chạy': 'teacher’s PA still running',
  'quá {ngay} tự chốt theo GV': (b) => `after ${b.ngay} kept automatically`,
} satisfies Record<string, Dich>;
