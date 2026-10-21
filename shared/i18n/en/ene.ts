/** EN-e — chữ EN còn sót: trang Học viên & Lớp của TVV / CX (khung Đang SOS), panel một em. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_ENE = {
  'Mọi học viên trong phạm vi đang xem (chưa lưu trữ).': 'All students in the current scope (not archived).',
  'SOS ở MT gần nhất, Case mới hoặc Ý thức trong 14 ngày, chờ chọn bước tiếp sau thi.': 'SOS at latest MT, new Case or conduct in 14 days, or next step pending after exam.',
  'Đang Tạm dừng học.': 'Currently paused.',
  'Dự kiến thi IELTS trong 6 tuần tới.': 'IELTS exam planned in the next 6 weeks.',
  'Đã qua ngày thi, chưa có kết quả thi thật — hạn 1 tuần sau ngày thi.': 'Exam date passed, no real result yet — due 1 week after the exam.',
  'Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi (không tính liên hệ).': 'Profile is missing info needed for scheduling and tracking (contacts not counted).',
  'Đã có kết quả thi thật, chờ chọn bước tiếp.': 'Real exam result in, next step pending.',
  'Tạm dừng · từ {ngay}': 'Paused · from {ngay}',
  'Một chi nhánh': 'One branch',
  '{n} em của tôi': (b) => `${so(b.n, 'student', 'students')} of mine`,
  'Tìm học viên, mã, lớp…': 'Search student, ID, class…',
  'Chưa có học viên nào của bạn': 'No students assigned to you yet',
  'Học viên có TVV là bạn sẽ hiện ở đây.': 'Students with you as counsellor show here.',
  'Xem cả chi nhánh': 'View whole branch',
  'Không có học viên nào khớp': 'No matching students',
  'Đổi chip lọc, bỏ bớt từ khoá hoặc đổi phạm vi.': 'Change the filter chip, shorten the search or change scope.',
  'Target · thi': 'Target · exam',
  'Học viên theo lớp': 'Students by class',
  'nhóm chưa xếp lớp': 'group without class',
  /* 'Tutor' là tên PA (panel một em, Đang SOS, hồ sơ lớp) VÀ nhãn ô Ghi kết quả — giữ "Tutor" (luật thuật ngữ 3). Đè 'Tutor name' của ov12e (file này nạp sau). */
  'Tutor': 'Tutor',
  /* Tên việc thống nhất (EN-e): "Kết quả PA" ở Công việc, tiêu đề panel, Tổng quan. */
  'Kết quả PA · {ky}': 'PA result · {ky}',
  'Kết quả PA · {ky} (ghi bù {soKy} kỳ)': 'PA result · {ky} (catching up {soKy} periods)',
  /* Meeting CX một tên (EN-e). */
  'Meeting CX/GĐCN (sau Mock): ghi chú nói rõ kết quả buổi gặp, ít nhất {n} ký tự.': 'Meeting CX/BD (after Mock): the note must state the meeting outcome, at least {n} characters.',
  'SOS 3 từ MT2 thêm <b>Meeting CX/GĐCN (sau Mock)</b> (MT3 có phụ huynh); GVCN xác nhận, hạn 5 ngày.': 'SOS 3 from MT2 adds <b>Meeting CX/BD (after Mock)</b> (MT3 with parents); the core teacher confirms, within 5 days.',
  'lượt có Meeting CX/GĐCN (sau Mock) quá hạn xác nhận': 'Meeting CX/BD (after Mock) overdue for confirmation',
  /* Lỗi máy chủ của Đang SOS / panel một em (`hocVienSos.ts`) — web dịch bằng `dich` ở `api.ts`. */
  'Đang SOS dành cho người theo dõi Case.': 'In SOS is only for Case followers.',
  'Tuần Test không hợp lệ.': 'Invalid test week.',
  'Bạn không xem được học viên này.': 'You cannot view this student.',
  /* Công việc của QL — dòng phụ "Chốt lộ trình" (`chuViecChotLoTrinh`, máy chủ ghép) + Xác nhận PA (`mywork.ts`): web dịch theo mẫu từng đoạn. */
  '{n} em chưa chọn': (b) => `${so(b.n, 'student', 'students')} not chosen`,
  '{n} nháp': (b) => so(b.n, 'draft', 'drafts'),
  '{n} em · đủ nháp, chưa chốt': (b) => `${so(b.n, 'student', 'students')} · all drafted, not confirmed`,
  '{n} em chưa chốt': (b) => `${so(b.n, 'student', 'students')} not confirmed`,
  '{n} em chờ duyệt đề xuất': (b) => `${so(b.n, 'student', 'students')} awaiting proposal approval`,
  'PA theo quy chế chưa bắt đầu': 'rule-based PA not started',
} satisfies Record<string, Dich>;
