/** QTV2-BAND (chủ SP 11/11, PTA XM-1) — Quản trị › Band & ngưỡng: kỳ vọng MT Fast Track, ngưỡng lớp thường; nhãn dải Cuối khoá theo bản ngưỡng. */
import type { Dich } from '../en.ts';

export const EN_QTV2_BAND = {
  'Band & ngưỡng': 'Bands & thresholds',
  'Kỳ vọng MT Fast Track': 'Fast Track MT expectation',
  'Ngưỡng lớp thường': 'Regular-class thresholds',
  'Áp cho lộ trình mở từ nay': 'Applies to routes opened from now',
  'Áp cho lớp mở từ nay': 'Applies to classes opened from now',
  'Kỳ vọng của một lượt = Target − mức trừ theo lần MT trong lộ trình. Lượt MT tạo một lần khi mở lộ trình, nên mức mới chỉ áp cho lộ trình mở từ lúc lưu; MT sắp tới của lộ trình đang chạy giữ mức cũ, sửa điểm sau cũng vậy. SOS = số kỹ năng dưới kỳ vọng.':
    'An MT’s expectation = Target − the deduction for that MT number in the route. MTs are created once when a route opens, so a new value only applies to routes opened after saving; upcoming MTs of running routes keep the old value, including later score edits. SOS = number of skills below expectation.',
  'Bài Final tạo một lần khi mở lớp, nên ngưỡng mới chỉ áp cho lớp mở từ lúc lưu; lớp đang học giữ ngưỡng cũ. Mini Test theo ngày làm. Xét lại và gợi ý sau Final dùng cùng bản.':
    'The Final is created once when a class opens, so new thresholds only apply to classes opened after saving; running classes keep the old ones. Mini Tests follow the test date. Route review and post-Final suggestions use the same version.',
  'MT3 trở đi': 'MT3 onwards',
  'Lộ trình RF (mọi MT)': 'RF route (every MT)',
  'Học lại trong cùng lộ trình làm số MT tăng tiếp (MT6, MT7…) — cùng mức này.': 'Repeating within the same route keeps counting MTs (MT6, MT7…) — same value.',
  'Học lại dưới': 'Repeat below',
  'Lên từ': 'Move up from',
  'Mini Test đạt từ': 'Mini Test passes from',
  'Cân nhắc': 'Manager decides',
  'Lên + bổ trợ': 'Move up + support',
  'theo chương trình': 'per programme',
  'Final lớp thường, % tổng chưa làm tròn. Dưới mức này: gợi ý học lại, Báo PH qua TVV.': 'Regular-class Final, unrounded total %. Below this: suggest repeating, tell parents via the consultant.',
  'Từ mức này tới dưới "Đạt từ": lên lớp kèm bổ trợ miễn phí. Giữa "Học lại dưới" và mức này: Quản lý cân nhắc.':
    'From this level up to "Pass from": move up with free extra support. Between "Repeat below" and this level: the manager decides.',
  'Mini Test sau bổ trợ Final: đạt thì Case tự Hoàn thành; chưa đạt thì Xét lại lộ trình.': 'Mini Test after Final support: passing completes the Case; otherwise the route is reviewed.',
  'KET 100–150 · PET 120–170 (thang Cambridge)': 'KET 100–150 · PET 120–170 (Cambridge scale)',
  'Thang Cambridge': 'Cambridge scale',
  'Thang điểm và mốc grade / CEFR của Cambridge — không phải luật của trung tâm, nên không sửa ở đây.': 'Cambridge\'s score scale and grade / CEFR marks — not a centre rule, so it is not edited here.',
  'Số nguyên từ {a} đến {b}': 'Whole number {a}–{b}',
  'Từ {a} đến {b}, bước {s}': 'From {a} to {b}, step {s}',
  'Đã lưu {ten}: {gia}': 'Saved {ten}: {gia}',
  'Bài Final Test đủ điểm, % tổng dưới mức "Học lại dưới" — gợi ý học lại.': 'Final Test fully scored, total below "Repeat below" — suggest repeating.',
  'Bài Final Test đủ điểm, % tổng từ "Học lại dưới" tới dưới "Lên từ" — Quản lý cân nhắc.': 'Final Test fully scored, total from "Repeat below" up to "Move up from" — manager decides.',
  'Bài Final Test đủ điểm, % tổng từ "Lên từ" tới dưới "Đạt từ" — lên lớp kèm bổ trợ.': 'Final Test fully scored, total from "Move up from" up to "Pass from" — move up with extra support.',
} satisfies Record<string, Dich>;
