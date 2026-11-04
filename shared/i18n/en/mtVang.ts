/** PR-MT-VANG (N38, chủ SP 05/11) — luật vắng / dời / huỷ MT thống nhất, hộp kỹ năng 3 nút. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_MT_VANG = {
  'Dời': 'Move',
  'không dự thi': 'did not sit',
  'Không dự thi · Tuần {x}': 'Did not sit · Week {x}',
  'Đã ghi Không dự thi · {mon}{em}': 'Recorded did not sit · {mon}{em}',
  ' · huỷ (vắng 2 lần)': ' · cancelled (absent twice)',
  'huỷ {x} · vắng 2 lần': 'cancelled {x} · absent twice',
  '{x} đã huỷ — "Khôi phục và đặt tuần" trước.': '{x} is cancelled — use "Restore and set week" first.',
  'Đã huỷ · vắng 2 lần — Quản lý chọn tuần mới (Dời) để xếp lại.': 'Cancelled · absent twice — a manager picks a new week (Move) to reschedule.',
  '{mon} bỏ khỏi đợt này, không tính vào kết quả đợt. Muốn làm lại thì Dời — chọn tuần.': '{mon} leaves this round and does not count toward its result. To sit it again, Move — pick a week.',
  'Tuần Test đã qua 2 tuần: ghi Không dự thi cho {mon} — không dời, không tính lần vắng.': 'Test week is 2+ weeks past: record did not sit for {mon} — no move, no absence counted.',
  'Ghi "-" cho {mon}: lần đầu dời sang tuần sau tuần Test; vắng 2 lần thì huỷ.': 'Record "-" for {mon}: the first time it moves to the week after its test week; absent twice cancels it.',
  '{nhan} là MT cũ: nhập bù điểm; "-" là Không dự thi.': '{nhan} is an old MT: enter missing scores; "-" means did not sit.',
  'Gõ "-" = vắng, chốt ngay: lần 1 dời sang tuần sau tuần Test.':
    'Type "-" = absent, closed at once: the first time it moves to the week after its test week.',
  'MT vắng 2 lần thì huỷ (không thẻ, không nhắc); lớp thường dời tiếp. Tuần Test đã qua 2 tuần: "-" không dời, không tính lần vắng.':
    'An MT absent twice is cancelled (no card, no reminder); regular classes move again. Test week 2+ weeks past: "-" does not move it and is not counted as an absence.',
  'Chọn tuần cho kỹ năng (Dời) = xếp lại từ đầu. Gỡ vắng: xoá "-", lúc nào cũng được.':
    'Picking a week for a skill (Move) = reschedule from scratch. Undo absent: delete the "-", any time.',
  'Bấm ô MT: mỗi môn có <b>Dời</b> · <b>Vắng</b> · <b>Bỏ khỏi đợt</b>, rồi <b>Lưu</b>.':
    'Click an MT cell: each skill has <b>Move</b> · <b>Absent</b> · <b>Remove from round</b>, then <b>Save</b>.',
  '<b>Dời</b> = chọn tuần = xếp lại từ đầu — cả môn vắng, huỷ vắng 2 lần, bỏ khỏi đợt; chọn đúng tuần cũ cũng được.':
    '<b>Move</b> = pick a week = reschedule from scratch — also for absent, cancelled after two absences or skills removed from the round; the same week works too.',
  '<b>⋯</b>: <b>Dời hạn chấm</b> · <b>Huỷ điểm</b> · <b>Nhật ký</b>.':
    '<b>⋯</b>: <b>Extend marking due</b> · <b>Cancel score</b> · <b>Log</b>.',
  '<b>Dời lịch Test</b> (thẻ cũ, trước 05/11 — "-" nay không tạo thẻ): hết Chủ nhật tuần gửi; quá hạn thì kỹ năng bị huỷ.':
    '<b>Test reschedule</b> (old cards, before 05/11 — "-" no longer creates cards): until Sunday of the sending week; once overdue the skill is cancelled.',
  'Một kỹ năng: bấm ô MT — mỗi môn <b>Dời</b> · <b>Vắng</b>; <b>⋯</b> có <b>Huỷ điểm</b>, <b>Nhật ký</b>.':
    'One skill: click the MT cell — each skill <b>Move</b> · <b>Absent</b>; <b>⋯</b> has <b>Cancel score</b>, <b>Log</b>.',
  'Bấm ô MT: mỗi môn <b>Dời</b> (chọn tuần = xếp lại từ đầu) · <b>Vắng</b>, rồi <b>Lưu</b>.':
    'Click an MT cell: each skill <b>Move</b> (pick a week = reschedule from scratch) · <b>Absent</b>, then <b>Save</b>.',
  '<b>⋯</b>: <b>Huỷ điểm</b> · <b>Nhật ký</b>; mục ghi "Chỉ Quản lý" thì nhờ QL.':
    '<b>⋯</b>: <b>Cancel score</b> · <b>Log</b>; items marked "Managers only" — ask a manager.',
  'Đã có điểm / đã làm bài: mục mờ.': 'Already scored / taken: dimmed.',
  'Lần vắng về 0': 'Absence count reset to 0',
} satisfies Record<string, Dich>;
