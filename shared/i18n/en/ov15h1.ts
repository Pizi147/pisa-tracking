/** OV-15h1 — Công việc + Tổng quan QL (Lớp cần chú ý, Trễ chấm, Cần bạn quyết, Chốt lộ trình tại chỗ). Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_OV15H1 = {
  'Case trống PA': 'Case without PA',
  'Chờ nhận xét / nguyên nhân': 'Awaiting comment / cause',
  'PA chờ xác nhận': 'PA awaiting confirmation',
  'PA chờ duyệt': 'PA awaiting approval',
  'PA chờ duyệt đổi': 'PA change awaiting approval',   // OV-15i1: tên trong ? của Case chưa chốt PA (mockup OV-14 3)
  'PA xong · chờ đóng Case': 'PA done · Case to close',
  'Chờ duyệt không theo dõi': 'Awaiting approval · no follow-up',
  'Bấm số HV hoặc Case để xử lý.': 'Press the student or Case number to act.',
  'Bấm số để xem danh sách': 'Press a number to see the list',
  'Chưa lịch': 'No date',
  'Chưa điểm': 'No score',
  'Cả chi nhánh': 'Whole branch',
  'Cả {ten}': (b) => `All ${b.ten}`,
  'GV đã nhận thông báo tự động': 'Teachers got automatic notifications',
  'HV chưa lịch Test': 'Students without a Test date',
  'HV chưa điểm': 'Students without scores',
  'Hiện': 'Show',
  'Lớp cần chú ý': 'Classes needing attention',
  'Mỗi Case chỉ ở một trạng thái, không đếm trùng.': 'Each Case is in one state only, no double counting.',
  'Mở hồ sơ lớp ›': 'Open class profile ›',
  'SOS hiện tại': 'Current SOS',
  'Trễ chấm · {ten}': (b) => `Late marking · ${b.ten}`,
  'trễ nhất {n} ngày': (b) => `oldest ${b.n} days late`,
  '{n} Case của {hv} HV chưa có PA đang chạy.': (b) => `${b.n} Cases of ${b.hv} students have no running PA.`,
  '{n} bài': (b) => `${b.n} items`,
  'Ẩn {n} lớp không có việc': (b) => `${b.n} classes with nothing to do hidden`,
  'Lớp thường: Tổng quan › <b>Cần bạn quyết</b> › <b>Chốt lộ trình</b> (hạn trong 7 ngày; có thông báo) → nút <b>Chốt lộ trình</b> mở bảng lộ trình cả lớp ngay tại chỗ.':
    'Normal classes: Overview › <b>Needs your decision</b> › <b>Finalise pathway</b> (due within 7 days; you get a notification) → <b>Finalise pathway</b> opens the whole-class pathway table in place.',
  'Dải đầu trang: <b>chưa lịch Test</b> · <b>chưa điểm</b> · <b>HV · Case chưa chốt PA</b> (⚠ quá hạn) · <b>bài trễ chấm · n GV</b>.':
    'Top strip: <b>no Test date</b> · <b>no score</b> · <b>students · Cases without a set PA</b> (⚠ overdue) · <b>late marking · n teachers</b>.',
  'Bấm một số để mở đúng danh sách.': 'Press a number to open its exact list.',
  '<b>Lớp cần chú ý</b>: Chưa lịch, Chưa điểm, SOS 1 · 2 · 3, <b>Case chưa chốt PA</b> (HV / Case; <b>?</b> chia theo trạng thái), Đã thi · chờ KQ; mặc định <b>Chỉ lớp có vấn đề</b>.':
    '<b>Classes needing attention</b>: No date, No score, SOS 1 · 2 · 3, <b>Cases without a set PA</b> (students / Cases; <b>?</b> splits by state), Sat · awaiting results; default <b>Only classes with issues</b>.',
  'Mỗi lớp một hàng; bấm số để xử lý.': 'One row per class; press a number to act.',
} satisfies Record<string, Dich>;
