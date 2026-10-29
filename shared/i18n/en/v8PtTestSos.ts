/** V8-PT (mockup `thiet-ke/v8/phan-tich.html`, chủ SP duyệt 29/10): chữ mới của Phân tích.
 *  Mẫu: 'Chữ Việt': 'English' · có số: '{n} lượt': (b) => `${b.n} …` */
import type { Dich } from '../en.ts';

const soNhieu = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_V8_PT_TEST_SOS = {
  'Theo đợt Test': 'By test round',
  'Theo chi nhánh': 'By branch',
  '{n} chi nhánh': (b) => soNhieu(b.n, 'branch', 'branches'),
  '{n} lượt MT': (b) => soNhieu(b.n, 'MT attempt', 'MT attempts'),
  'trên {n} lượt': (b) => `of ${soNhieu(b.n, 'attempt', 'attempts')}`,
  'trên {n} Case': (b) => `of ${soNhieu(b.n, 'Case', 'Cases')}`,
  'SOS': 'SOS',
  'Thiếu điểm': 'Missing scores',
  'gồm SOS tạm': 'incl. provisional SOS',
  'Dưới kỳ vọng · HV': 'Below expectation · students',
  'Chưa có lượt nào có điểm': 'No scored attempts yet',
  'trong {ky}': 'in {ky}',
  'Xem Toàn bộ': 'View all time',
  'Cột hiện': 'Visible columns',
  '⤓ Xuất bảng này': '⤓ Export this table',
  'Xuất kết quả từng lượt': 'Export results per attempt',
  'Cột hiện · Xuất kết quả từng lượt': 'Visible columns · Export per attempt',
  'Chưa có dữ liệu để xuất': 'No data to export',
} satisfies Record<string, Dich>;
