/** BAND-QUY-DOI — lối vào Bảng quy đổi của Quản lý + nhãn nhật ký. Màn Quản trị viết chữ Việt như các tab Quản trị khác. */
import type { Dich } from '../en.ts';

export const EN_BAND_QUY_DOI = {
  'Bảng quy đổi band': 'Band conversion table',
  'Sửa bảng quy đổi band': 'Edit band conversion table',
  'Khôi phục bảng quy đổi band': 'Restore band conversion table',
  /* Kiểm bảng (`kiemBangQuyDoi`, máy chủ trả câu này khi 400). */
  '{ten}: cần đủ 41 ô (0–40 câu).': (b) => `${b.ten}: all 41 cells (0–40 correct) are required.`,
  'thiếu ô': 'missing cells',
  '{ten} {n} câu: chưa có band.': (b) => `${b.ten} ${b.n} correct: no band yet.`,
  'trống': 'empty',
  '{ten} {n} câu: band từ 0 đến 9, bậc 0.5 (đang là {v}).': (b) => `${b.ten} ${b.n} correct: band must be 0–9 in steps of 0.5 (now ${b.v}).`,
  'bậc 0.5': 'step 0.5',
  '{ten} {n} câu: {a} thấp hơn {m} câu ({b}) — band không giảm khi số câu tăng.': (b) => `${b.ten} ${b.n} correct: ${b.a} is lower than ${b.m} correct (${b.b}) — band cannot drop as the count rises.`,
  '≥ {b}': (b) => `≥ ${b.b}`,
} satisfies Record<string, Dich>;
