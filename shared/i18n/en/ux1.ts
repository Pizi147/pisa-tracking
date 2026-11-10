/** UX-1 — sửa gấp từ "Đánh giá UX – Toàn hệ thống" (chủ SP 16/10). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_UX1 = {
  '{n} lớp còn bài': (b) => `${so(b.n, 'class', 'classes')} with work left`,
  '{n} xong': (b) => `${b.n} done`,
  '{n} lớp xong': (b) => `${so(b.n, 'class', 'classes')} done`,
  'bài Test {tuan}': (b) => `test ${b.tuan}`,
  'Chưa tải được · bấm để thử lại': 'Could not load · click to retry',
  /* Hướng dẫn · thuật ngữ */
  'Case tạm / SOS tạm': 'Provisional case / provisional SOS',
  'Lượt MT chưa chốt: SOS và Case chỉ tạm ("Chờ chốt SOS") — ghi mô tả, thêm PA được; chưa hạn, chưa việc, chưa vào số đếm. Chốt: PA của GV cùng loại PA quy chế thì giữ, khác thì "Chọn PA".':
    'MT round not finalised: SOS and Case are provisional ("Awaiting SOS finalisation") — description and PAs can be added; no deadline, no task, not counted. On finalising: a teacher PA of the same type as the rule-based PA is kept, a different one means "Choose PA".',
  'KCK': 'KCK (no commitment)',
  'Không cam kết Target: không kỳ vọng MT, không SOS tự động; vẫn có lịch MT, nhập điểm, Case tay, Ý thức.':
    'No Target commitment: no MT expectations, no automatic SOS; MT schedule, score entry, manual cases and Conduct still apply.',
} satisfies Record<string, Dich>;
