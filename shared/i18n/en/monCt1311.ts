/** MON-CT-1311 (chủ SP 13/11) — Quản trị sửa Môn mọi chương trình lớp thường. Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_MON_CT_1311 = {
  '{n} lớp đang học · {m} bài Test chưa có điểm sẽ đổi môn. Bài đã ghi giữ môn cũ. Lưu môn mới?':
    '{n} running classes · {m} unscored Tests will switch subjects. Recorded Tests keep the old subjects. Save the new subjects?',
  '{n} lớp đang học · {m} bài Test chưa có điểm sẽ đổi môn · phân công cần chọn lại ở {k} lớp. Bài đã ghi giữ môn cũ. Lưu môn mới?':
    '{n} running classes · {m} unscored Tests will switch subjects · teachers need reassigning in {k} classes. Recorded Tests keep the old subjects. Save the new subjects?',
  'Lưu môn mới': 'Save new subjects',
  'Fast Track giữ L · R · W1 · W2 · S.': 'Fast Track keeps L · R · W1 · W2 · S.',
  'Pre FOU một ô Tổng hợp, GVCN dạy luôn — không đổi môn.': 'Pre FOU has one Overall box taught by the homeroom teacher — subjects cannot change.',
  'Đưa {mon} lên trước': 'Move {mon} earlier',
} satisfies Record<string, Dich>;
