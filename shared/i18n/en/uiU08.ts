import type { Dich } from '../en.ts';

/** U08 Phân tích (audit 03/11, mockup `thiet-ke/v11/phan-tich.html`). */
export const EN_UI_U08 = {
  'So lượt trước · HV': 'vs previous attempt · students',
  'Trong kỳ {ky}': 'In period {ky}',
  '– chưa có dữ liệu': '– no data yet',
  '{n} HV · {m} đủ dữ liệu': '{n} students · {m} with full data',
  'lượt của từng HV trong kỳ · % trên HV đủ dữ liệu': "each student's attempt in the period · % of students with full data",
  'Case theo kỹ năng · {ten}': 'Cases by skill · {ten}',
  'CASE · KẾT QUẢ TEST': 'CASE · TEST RESULT',
  '{n} kỹ năng dưới kỳ vọng': '{n} skills below expectation',
  'Chưa có Case': 'No case yet',
  'Chưa có kỹ năng dưới kỳ vọng.': 'No skill below expectation.',
  'SỐ · TEST + SOS': 'NUMBER · TEST + SOS',
} satisfies Record<string, Dich>;
