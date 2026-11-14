/** PR-MT-VANG (N38, chủ SP 05/11) — luật vắng / dời / huỷ MT thống nhất, hộp kỹ năng 3 nút. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_MT_VANG = {
  /* LG-9: Huỷ tay bài lớp thường / MT0 lớp thường. */
  /* NHAP-DIEM-a (chủ SP 14/11): Huỷ điểm / Khôi phục một kỹ năng — mọi loại bài. */
  'Đã xoá điểm {mon}{ai}': 'Score cleared: {mon}{ai}',
  'Chỉ người nhập được ô này, GVCN lớp hoặc Quản lý huỷ / khôi phục được điểm.': 'Only whoever can enter this cell, the homeroom teacher or a manager can cancel / restore this score.',
  'Lượt này đã huỷ — khôi phục lượt trước.': 'This attempt is cancelled — restore the attempt first.',
  'Chỉ người nhập được ô này, GVCN của lớp và Quản lý báo vắng được.': 'Only whoever can enter this cell, the homeroom teacher and managers can report an absence.',
  'Đã huỷ {mon}{ai}': 'Cancelled {mon}{ai}',
  'Huỷ môn': 'Cancel subject',
  '{x} đã huỷ': '{x} cancelled',
  'trên {n} môn · {x} đã huỷ': 'over {n} subjects · {x} cancelled',
  '{x}: đã huỷ (vắng).': '{x}: cancelled (absent).',
  'Chỉ Progress / Final lớp thường có Huỷ môn — MT vắng 2 lần tự huỷ.': 'Only regular-class Progress / Final tests have Cancel subject — an MT cancels itself after 2 absences.',
  'Chỉ GV của môn, GVCN lớp hoặc Quản lý huỷ được bài này.': 'Only the subject teacher, homeroom teacher or a manager can cancel this test.',
  'Đã khôi phục {mon}{ai}': 'Restored {mon}{ai}',
  '{skill} không nằm trong bài này.': '{skill} is not part of this test.',
  '{skill} đã có điểm — không huỷ được.': '{skill} already has a score — it cannot be cancelled.',
  '{skill} chưa vắng lần nào — chưa cần huỷ.': '{skill} has not been absent yet — no need to cancel.',
  'Dời': 'Move',
  'Đã huỷ · vắng': 'Cancelled · absent',
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
  'Ghi "-" cho {mon}: dời sang {x}; vắng mấy lần cũng không tự huỷ — cần thì ⋯ › Huỷ điểm.': 'Record "-" for {mon}: it moves to {x}; never auto-cancelled — if needed, ⋯ › Cancel score.',
  '{nhan} là MT cũ: nhập bù điểm; "-" là Không dự thi.': '{nhan} is an old MT: enter missing scores; "-" means did not sit.',
  'Gõ "-" = vắng, chốt ngay: lần 1 dời sang tuần sau tuần Test.':
    'Type "-" = absent, closed at once: the first time it moves to the week after its test week.',
  'MT, MT0 vắng 2 lần thì huỷ (không thẻ, không nhắc). Progress / Final lớp thường không tự huỷ — cần dừng thì ⋯ › Huỷ điểm (Hoàn tác / Khôi phục được). Gõ "-" trước tuần Test = báo trước, ghi đúng tuần Test đó. Tuần Test đã qua 2 tuần: "-" không dời, không tính lần vắng.':
    'An MT or MT0 absent twice is cancelled (no card, no reminder). Regular-class Progress / Final tests never auto-cancel — to stop, ⋯ › Cancel score (undo / restore possible). "-" typed before the Test week = advance notice, recorded for that Test week. Test week 2+ weeks past: "-" does not move it and is not counted as an absence.',
  'Chọn tuần cho kỹ năng (Dời) = xếp lại từ đầu. Gỡ vắng: xoá "-", lúc nào cũng được.':
    'Picking a week for a skill (Move) = reschedule from scratch. Undo absent: delete the "-", any time.',
  'Bấm ô MT: mỗi môn có <b>Dời</b> · <b>Vắng</b> · <b>Bỏ khỏi đợt</b>, rồi <b>Lưu</b>.':
    'Click an MT cell: each skill has <b>Move</b> · <b>Absent</b> · <b>Remove from round</b>, then <b>Save</b>.',
  '<b>Dời</b> = chọn tuần = xếp lại từ đầu — cả môn vắng, huỷ vắng 2 lần, bỏ khỏi đợt; chọn đúng tuần cũ cũng được.':
    '<b>Move</b> = pick a week = reschedule from scratch — also for absent, cancelled after two absences or skills removed from the round; the same week works too.',
  '<b>⋯</b>: <b>Dời hạn chấm</b> · <b>Huỷ điểm</b> · <b>Lịch sử</b>.':
    '<b>⋯</b>: <b>Extend marking due</b> · <b>Cancel score</b> · <b>Log</b>.',
  '<b>Dời lịch Test</b> (thẻ cũ, trước 05/11 — "-" nay không tạo thẻ): hết Chủ nhật tuần gửi; quá hạn thì kỹ năng bị huỷ.':
    '<b>Test reschedule</b> (old cards, before 05/11 — "-" no longer creates cards): until Sunday of the sending week; once overdue the skill is cancelled.',
  'Một kỹ năng: bấm ô MT — mỗi môn <b>Dời</b> · <b>Vắng</b>; <b>⋯</b> có <b>Huỷ điểm</b>, <b>Lịch sử</b>.':
    'One skill: click the MT cell — each skill <b>Move</b> · <b>Absent</b>; <b>⋯</b> has <b>Cancel score</b>, <b>Log</b>.',
  'Bấm ô MT: mỗi môn <b>Dời</b> (chọn tuần = xếp lại từ đầu) · <b>Vắng</b>, rồi <b>Lưu</b>.':
    'Click an MT cell: each skill <b>Move</b> (pick a week = reschedule from scratch) · <b>Absent</b>, then <b>Save</b>.',
  '<b>⋯</b>: <b>Huỷ điểm</b> · <b>Nhật ký</b>; mục ghi "Chỉ Quản lý" thì nhờ QL.':
    '<b>⋯</b>: <b>Cancel score</b> · <b>Log</b>; items marked "Managers only" — ask a manager.',
  'Đã có điểm / đã làm bài: mục mờ.': 'Already scored / taken: dimmed.',
  'Lần vắng về 0': 'Absence count reset to 0',
} satisfies Record<string, Dich>;
