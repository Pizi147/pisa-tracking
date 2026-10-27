/** M6 6b-2 PILOT-CASE — panel "Case chưa chốt PA" theo nhóm, khối Case A, Case tiếp, câu "ai làm được". Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_PILOT_CASE = {
  'SỐ LIỆU · TỔNG QUAN': 'DATA · OVERVIEW',
  'Bạn': 'You',
  '{n} Case còn chờ': (b) => `${b.n} ${Number(b.n) === 1 ? 'case' : 'cases'} waiting`,
  'Đã xử lý hết': 'All handled',
  '{n} vừa xử lý': '{n} just handled',
  'Chưa có PA.': 'No plan yet.',
  'Chờ duyệt · xác nhận': 'Awaiting approval · confirmation',
  'Chưa có · ghi khi mọi PA đã khép': 'None yet · written once every plan is closed',
  'Case tiếp ›': 'Next case ›',
  'Hết Case chờ trong danh sách': 'No more cases waiting in this list',
  'Chỉ {ten} (phụ trách) hoặc Quản lý làm được việc ở Case này.': 'Only {ten} (owner) or a Manager can act on this case.',
  'Chỉ Quản lý làm được việc ở Case này (Case chưa có người phụ trách).': 'Only a Manager can act on this case (it has no owner yet).',
} satisfies Record<string, Dich>;
