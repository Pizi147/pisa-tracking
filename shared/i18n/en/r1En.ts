/** R1-EN-2 — chữ màn GV còn thiếu bản Anh (spec 2026-10-26 mục 4.3, D11). Chỉ khoá MỚI; theo thiet-ke/THUAT_NGU_EN.md. */
import type { Dich } from '../en.ts';

const so = (n: unknown, mot: string, nhieu: string) => `${n} ${Number(n) === 1 ? mot : nhieu}`;

export const EN_R1_EN = {
  /* Tổng quan › Lịch sắp tới */
  'Hết khoá': 'Course ends',
  'Lịch sắp tới': 'Upcoming schedule',
  'Xem toàn bộ lịch ›': 'See full schedule ›',
  'Không có đợt Test nào trong tuần này.': 'No Test rounds this week.',
  'Dự kiến thi IELTS': 'Expected IELTS exam',
  'Chưa xác định tuần': 'Week not set',
  'tháng {m}/{y}': '{m}/{y}',
  /* Test › tìm lớp, chọn tuần */
  'Tìm lớp…': 'Search class…',
  'Tìm lớp': 'Search class',
  'Lớp gợi ý': 'Suggested classes',
  '{khoang} · bấm để chọn tuần khác': '{khoang} · click to pick another week',
  'Chọn tuần khác': 'Pick another week',
  'đã có điểm': 'scored',
  'đã làm bài': 'sat',
  /* Cuối khoá lớp */
  '{n} em chưa lưu — xem lý do ở dòng': (b) => `${so(b.n, 'student', 'students')} not saved — see the reason on the row`,
  'Chọn nguyên nhân': 'Pick a cause',
  'Chọn kỹ năng': 'Pick skills',
  'Ghi phương án': 'Write the plan',
  'Chọn lớp chuyển đến': 'Pick the target class',
  'chờ KQ thi thật': 'awaiting real exam result',
  'Buổi {n}: {x}': 'Session {n}: {x}',
  /* Hồ sơ HV › Lộ trình (lịch MT) */
  'Mở hồ sơ MT': 'Open MT profile',
  'kỳ vọng {band}': 'expected {band}',
  'Ngoài lịch mặc định — Quản lý xếp tay': 'Outside the default schedule — set by a manager',
  'xếp tay': 'set manually',
  'Chưa có, sẽ tạo': 'None yet, will be created',
  'Quản lý đã xếp': 'Scheduled by a manager',
  'Đã làm xong, giữ nguyên': 'Done, kept as is',
  'Quản lý đã chốt, giữ nguyên': 'Locked by a manager, kept as is',
  'Sẽ dời sang tuần đề xuất': 'Will move to the suggested week',
  'Đã đúng': 'Already correct',
  'Đang ở {tuan}': 'Now in {tuan}',
  'Chỉ Quản lý khôi phục được': 'Only a manager can restore',
  'Áp lịch để tạo': 'Apply schedule to create',
  'Thao tác khác · MT{n}': 'More actions · MT{n}',
  'Đóng dải điểm': 'Close score strip',
  'Đã lên lịch: thêm {them} lượt, dời {doi} lượt': (b) => `Scheduled: ${so(b.them, 'attempt', 'attempts')} added, ${so(b.doi, 'attempt', 'attempts')} moved`,
  ', giữ nguyên {n} lượt đã chốt tay': (b) => `, ${so(b.n, 'manually locked attempt', 'manually locked attempts')} kept`,
  'Đây là lớp thường nên không có lịch MT riêng từng em — cả lớp làm bài Progress Test và Final Test cùng tuần theo chương trình. Xem và sửa hai mốc đó ở trang lớp.':
    'This is a normal class, so there is no per-student MT schedule — the whole class sits the Progress Test and Final Test in the same week, per the programme. View and edit both dates on the class page.',
  'Lịch MT hệ thống đề xuất': 'Suggested MT schedule',
  'Quản lý xếp lịch MT': 'Managers schedule MTs',
  'Áp lịch cho {n} lượt': (b) => `Apply schedule to ${so(b.n, 'attempt', 'attempts')}`,
  'Lịch đã đúng': 'Schedule is up to date',
  'Chưa có Tuần bắt đầu': 'No start week yet',
  'Điền Tuần bắt đầu ở Sửa thông tin — lịch MT đề xuất hiện ngay ở đây.': 'Set the start week in Edit details — the suggested MT schedule appears here right away.',
  'Số thứ tự lượt Mock Test trong lộ trình này, kèm kỳ vọng của lượt. Sang lộ trình mới thì đánh lại từ 1.':
    'Mock Test attempt number in this pathway, with its expected band. A new pathway starts again from 1.',
  'Tuần thứ mấy kể từ tuần em bắt đầu học. Mốc mặc định của Fast Track là tuần 6 · 12 · 16 · 20 · 24.':
    'Week number counted from the student\'s start week. Fast Track defaults are weeks 6 · 12 · 16 · 20 · 24.',
  'Tuần hệ thống tính ra từ tuần bắt đầu học. Chỉ là đề xuất — bấm Áp lịch mới thật sự đổi.':
    'Week calculated from the start week. Only a suggestion — nothing changes until you click Apply schedule.',
  'Tuần đề xuất': 'Suggested week',
  'Lượt đang ở tuần nào, và bấm Áp lịch thì lượt này ra sao. Lượt Quản lý đã chốt tay và lượt đã làm xong thì đứng yên.':
    'Which week the attempt is in now, and what Apply schedule does to it. Attempts locked by a manager or already done stay put.',
  'Hiện tại': 'Current',
  '+ Thêm MT{n}': '+ Add MT{n}',
  'Hệ thống chỉ đề xuất ba lượt đầu — đa số em chỉ làm ba lượt, MT4 và MT5 là dự phòng, thêm bằng "+ Thêm MT" (tuần cách ≥ 2 tuần = MT cũ). Lượt nào Quản lý đã chốt tay hoặc em đã làm xong thì đứng yên, kể cả khi đổi lại tuần bắt đầu học.':
    'Only the first three attempts are suggested — most students sit three; MT4 and MT5 are spare, added with "+ Add MT" (≥ 2 weeks back = past MT). Attempts locked by a manager or already done stay put, even if the start week changes.',
  /* Hồ sơ lớp › Phân công */
  '{nhan}: người khác vừa đổi ô này — kiểm lại rồi lưu.': '{nhan}: someone else just changed this — check, then save.',
  'Ô này đang có {n} người — chọn lại một người': (b) => `This slot has ${so(b.n, 'person', 'people')} — pick one`,
  'Đã lưu phân công': 'Assignment saved',
  'Lưu phân công': 'Save assignment',
  'Không đọc được phân công': 'Could not load the assignment',
  'Chỉ xem: đổi phân công là việc của Quản lý chi nhánh.': 'View only: the branch manager changes assignments.',
  'Đổi GVCN: nhờ Quản lý chi nhánh.': 'To change the core teacher, ask the branch manager.',
  'Lớp Pre FOU không chia môn — GVCN dạy luôn.': 'Pre FOU classes are not split by subject — the core teacher teaches all.',
  'Mỗi ô một người. Một người nhận nhiều ô được.': 'One person per slot. One person can take several slots.',
  'Chỉ nhập được điểm môn mình được phân công. Bỏ phân công KHÔNG xoá lịch sử: dòng cũ được đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn thấy đúng ai dạy lúc đó; điểm đã nhập giữ nguyên tên người nhập.':
    'You can only enter scores for your assigned subjects. Removing an assignment does NOT erase history: the old line is closed with a date, so past reports still show who taught then; entered scores keep the name of whoever entered them.',
  'Lớp đang không có giáo viên nào': 'This class has no teachers',
  'Đã từng dạy lớp này ({n})': 'Taught this class before ({n})',
  /* Xoá học viên */
  'Gõ {chu}': 'Type {chu}',
  'Chưa khớp': 'Does not match',
  'Đã xoá học viên {ten}': 'Deleted student {ten}',
  'Xoá vĩnh viễn': 'Delete permanently',
  'Chưa có email': 'No email yet',
  'Những gì sẽ mất': 'What will be lost',
  'Chưa có dữ liệu nào ngoài hồ sơ.': 'No data besides the profile.',
  '{n} công việc giữ lại, bỏ liên kết với em.': (b) => `${so(b.n, 'task', 'tasks')} kept, unlinked from the student.`,
  'Không khôi phục được (trừ từ bản sao lưu).': 'This cannot be undone (except from a backup).',
  'Nên nhờ Quản trị sao lưu trước lần xoá đầu.': 'Ask the system admin for a backup before your first delete.',
  'Gõ {chu} để xác nhận': 'Type {chu} to confirm',
} satisfies Record<string, Dich>;
