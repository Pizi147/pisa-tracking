/**
 * CHU-THI (Rulebook §21.4) — khoá mới của PR và khoá CŨ còn cần: chữ máy chủ đã lưu trước PR (ghi chú vắng, lý do, thông báo) vẫn dịch được;
 * "Đã thi" (Lịch thi — thi thật) và "Dời lịch thi" (SOS: dời thi thật hoặc MT) giữ chữ thi.
 */
export const EN_CHU_THI = {
  'Dời lịch': 'Reschedule',
  'Chưa kết luận': 'Not concluded',
  'chưa kết luận': 'not concluded',
  'không dời': 'not moved',
  'Làm bài {tuan}': 'Test {tuan}',
  '{khongDay} Làm bài {tuan}.': '{khongDay} Test {tuan}.',
  'Đã thi': 'Exam taken',
  'Dời lịch thi': 'Reschedule test',
  'Không dự thi': 'Absent',
  'Vắng — dấu "-" trong tuần thi': 'Absent — "-" in the test week',
  'Hết hạn duyệt — phần thi bị huỷ': 'Approval deadline passed — skill cancelled',
  'Xếp lại lịch thi': 'Reschedule test',
  'Đã huỷ phần thi (vắng 2 lần) — Quản lý khôi phục phần thi.': 'Cancelled · absent twice — a manager restores it.',
  'em vắng buổi thi': 'student missed the test',
  'Tuần thi': 'Test week',
  'tuần thi {tuan}': 'test week {tuan}',
  'một tuần thi': 'one test week',
} as const;
