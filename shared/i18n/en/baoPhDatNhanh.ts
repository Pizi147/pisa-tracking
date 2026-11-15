/** BAO-PH-DAT-NHANH (chủ SP 15/11) — tab Báo cáo PH: nút + hộp "Đặt nhanh" (một mức cho mọi tiêu chí còn trống của một phần). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_BAO_PH_DAT_NHANH = {
  'Đặt nhanh': 'Quick fill',
  '<b>Đặt nhanh</b> (thanh trên bảng): chọn phần + mức → <b>Áp cho n ô trống</b> — chỉ điền ô trống, ô đã chấm giữ. Trong panel một em: <b>Cả n tiêu chí</b> đặt mọi tiêu chí một mức rồi sửa lẻ. <b>Hoàn tác</b> ở thông báo.': '<b>Quick fill</b> (bar above the table): pick a section + level → <b>Apply to n empty cells</b> — only empty cells are filled, rated cells stay. In one student’s panel: <b>All n criteria</b> sets every criterion to one level, then fix the odd ones. <b>Undo</b> in the notice.',
  'Phần còn thiếu của GV: bạn viết hộ — nút <b>Viết …</b> từng phần (chữ tự lưu khi rời ô), hoặc <b>Đặt nhanh</b> một mức cho mọi ô trống của một phần; trong panel một em <b>Cả n tiêu chí</b> rồi sửa lẻ (<b>Hoàn tác</b> ở thông báo).': 'The teacher’s missing parts: you write for them — the <b>Write …</b> button for each part (text saves when you leave the cell), or <b>Quick fill</b> one level into every empty cell of a part; in one student’s panel <b>All n criteria</b>, then fix the odd ones (<b>Undo</b> in the notice).',
  'Áp cho {n} ô trống': 'Apply to {n} empty cells',
  'Không còn ô trống': 'No empty cells',
  'ô trống': 'empty cells',
  'em chưa đủ': 'students not complete',
  'Ô đã chấm giữ nguyên.': 'Cells already rated stay as they are.',
  '{n} em còn thiếu {o} — viết từng em sau': '{n} students still need the {o} — write them one by one',
  '{n} em còn thiếu {o}': '{n} students still need the {o}',
  'Cả {n} tiêu chí': 'All {n} criteria',
  'Đã đặt cả {n} tiêu chí {muc} · {ten}': 'Set all {n} criteria to {muc} · {ten}',
  'Mọi em đã có mức ở phần này.': 'Every student already has levels in this section.',
  'Chưa ô nào được lưu.': 'Nothing was saved.',
  'viết hộ': 'on behalf',
  'Đã đặt {muc} cho {n} ô': 'Set {muc} on {n} cells',
  '{n} ô vừa có người chấm — giữ nguyên': '{n} cells were just rated by someone else — kept',
  '{n} ô đã có người sửa — giữ nguyên': '{n} cells were changed since — kept',
  'Chưa đặt được: {ds}': 'Not set: {ds}',
  'Chưa có ô nào để đặt': 'No cells to fill',
  'Danh sách ô không hợp lệ': 'Invalid cell list',
  'Quá nhiều học viên một lần': 'Too many students at once',
} satisfies Record<string, Dich>;
