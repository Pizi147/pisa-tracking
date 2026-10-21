/** CASE-NHIEU — Tạo Case nhiều kỹ năng một lần (panel Tạo Case, câu lỗi máy chủ của lô). Khoá = chữ Việt trên web / máy chủ. */
import type { Dich } from '../en.ts';

export const EN_CASE_NHIEU = {
  'Tạo {n} Case': 'Create {n} cases',
  'Tạo {n} Case · ghi thêm {g}': 'Create {n} · add to {g}',
  'Ghi thêm {g}': 'Add to {g}',
  'Đã tạo {n} Case · {ten}': 'Created {n} cases · {ten}',
  'Đã tạo {n} Case · ghi thêm {g} · {ten}': 'Created {n} · added to {g} · {ten}',
  'Đã ghi thêm {g} Case · {ten}': 'Added to {g} cases · {ten}',
  '{mon} · phụ trách: {ten}': '{mon} · owner: {ten}',
  'Case đang có': 'Existing case',
  'Chọn từ 1 đến 5 kỹ năng.': 'Pick 1 to 5 skills.',
  'Mỗi kỹ năng chỉ một thẻ.': 'One card per skill.',
} satisfies Record<string, Dich>;
