/** OV-15a — nền giao diện: chip SOS, ký hiệu điểm, menu tài khoản, hạn. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15A = {
  'SOS {n} tạm': 'SOS {n} prov.',   // R1-EN-2b: chip ngắn (375: tên em không bị cắt); chữ đủ ở 'Vì sao SOS {n} tạm'
  'Vì sao SOS {n}': 'Why SOS {n}',
  'Vì sao SOS {n} tạm': 'Why SOS {n} provisional',
  '{n} môn chưa đạt ở {dot}': '{n} subjects not passed in {dot}',
  '{n} môn chưa đạt': '{n} subjects not passed',
  '{n} kỹ năng dưới kỳ vọng ở {dot}': '{n} skills below expectation in {dot}',
  'Có {n} kỹ năng dưới kỳ vọng': '{n} skills below expectation',
  'Tạm thời: đợt chưa đủ điểm, mức SOS còn đổi khi nhập đủ.': 'Provisional: not all scores are in; the SOS level may change.',
  'SOS 1 = 1 môn · SOS 2 = 2 · SOS 3 = 3 môn trở lên chưa đạt ở Progress Test.': 'SOS 1 = 1 subject · SOS 2 = 2 · SOS 3 = 3 or more subjects not passed in the Progress Test.',
  'SOS 1 = 1 kỹ năng · SOS 2 = 2 · SOS 3 = 3–4 kỹ năng dưới kỳ vọng. Lấy đợt gần nhất có kết quả.': 'SOS 1 = 1 skill · SOS 2 = 2 · SOS 3 = 3–4 skills below expectation. Uses the latest test with results.',
  'Kỳ vọng {dot}': 'Expected {dot}',
  'Mở hồ sơ {dot} ›': 'Open {dot} ›',
  'Tăng {so}': 'Up {so}',
  'Giảm {so}': 'Down {so}',
  'Bằng kỳ vọng': 'Meets expectation',
  'Vượt kỳ vọng': 'Above expectation',
  'Quá hạn (hết {ngay}) — vẫn nộp được, ghi "nộp muộn".': 'Overdue (closed {ngay}) — you can still submit; it is marked late.',
  'Đã thi · chờ KQ': 'Sat · awaiting result',
  'Có KQ · chờ bước tiếp': 'Result in · next step pending',
  'Theo máy': 'System',
  // Hướng dẫn (shared/huongDan/gv.ts) sửa theo OV-15a
  'Ngôn ngữ: menu Tài khoản › <b>VI | EN</b>, nhớ theo tài khoản. Giao diện: <b>Theo máy · Sáng · Tối</b> ở cùng menu.': 'Language: Account menu › <b>VI | EN</b>, remembered per account. Display: <b>System · Light · Dark</b> in the same menu.',
  'Menu Tài khoản › <b>Hướng dẫn</b> ở mọi màn mở đúng mục của màn đó.': 'Account menu › <b>Guide</b> on every screen opens the section for that screen.',
  'Bấm tên bạn › <b>Hướng dẫn</b>.': 'Click your name › <b>Guide</b>.',
  'Bấm <b>chip SOS</b> ở mọi màn: hộp "Vì sao SOS n" — kỹ năng dưới kỳ vọng, điểm từng kỹ năng, lối mở hồ sơ MT.': 'Click an <b>SOS chip</b> anywhere: the "Why SOS n" box — skills below expected, each skill\'s score, and a link to the MT record.',
  'Theo số kỹ năng dưới kỳ vọng: 1, 2, hoặc 3–4. Chip chỉ có viền vàng / cam / đỏ, dày dần; SOS tạm viền đứt.': 'By number of skills below expected: 1, 2, or 3–4. The chip has only a yellow / orange / red border, getting thicker; provisional SOS has a dashed border.',
  '✓ / ✗ cạnh điểm': '✓ / ✗ next to a score',
  '✓ xanh lá vượt kỳ vọng · ✓ xanh dương bằng · ✗ đỏ dưới. Hộp nhập điểm: ▲ / ▼ so kỳ vọng.': 'Green ✓ above expected · blue ✓ meets · red ✗ below. Score box: ▲ / ▼ against expected.',
} satisfies Record<string, Dich>;
