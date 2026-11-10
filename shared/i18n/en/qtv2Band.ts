/** QTV2-BAND (chủ SP 11/11, PTA XM-1) — Quản trị › Band & ngưỡng: kỳ vọng MT Fast Track, ngưỡng lớp thường; nhãn dải Cuối khoá theo bản ngưỡng. */
import type { Dich } from '../en.ts';

export const EN_QTV2_BAND = {
  'Band & ngưỡng': 'Bands & thresholds',
  'Kỳ vọng MT Fast Track': 'Fast Track MT expectation',
  'Ngưỡng lớp thường': 'Regular-class thresholds',
  'Áp cho lượt MT tạo sau': 'Applies to MTs created later',
  'Áp cho Final nhập điểm sau': 'Applies to Finals scored later',
  'Kỳ vọng của một lượt = Target − mức trừ theo lần MT trong lộ trình. Lượt đã tạo giữ mức lúc tạo — sửa điểm sau vẫn theo mức đó. SOS = số kỹ năng dưới kỳ vọng.':
    'An MT\'s expectation = Target − the deduction for that MT number in the route. MTs already created keep the value they were created with — later score edits still use it. SOS = number of skills below expectation.',
  'Em đã có điểm Final giữ dải cũ; Final nhập điểm đầu từ ngày lưu theo ngưỡng mới. Xét lại, gợi ý Cuối khoá dùng cùng bản.':
    'Students with Final scores keep their old band; Finals first scored from the save date use the new thresholds. Route review and end-of-course suggestions use the same version.',
  'MT3 trở đi': 'MT3 onwards',
  'Lộ trình RF (mọi MT)': 'RF route (every MT)',
  'Học lại trong cùng lộ trình làm số MT tăng tiếp (MT6, MT7…) — cùng mức này.': 'Repeating within the same route keeps counting MTs (MT6, MT7…) — same value.',
  'Học lại dưới': 'Repeat below',
  'Lên từ': 'Move up from',
  'Mini Test đạt từ': 'Mini Test passes from',
  'Cân nhắc': 'Manager decides',
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
  'Dưới {n}%': 'Under {n}%',
  'Bài Final Test đủ điểm, % tổng dưới {n}% — gợi ý học lại.': 'Final Test fully scored, total under {n}% — suggest repeating.',
  'Bài Final Test đủ điểm, % tổng {k} — Quản lý cân nhắc.': 'Final Test fully scored, total {k} — manager decides.',
  'Bài Final Test đủ điểm, % tổng {k} — lên lớp kèm bổ trợ.': 'Final Test fully scored, total {k} — move up with extra support.',
} satisfies Record<string, Dich>;
