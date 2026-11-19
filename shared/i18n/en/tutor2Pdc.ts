/** TU2-4 PA-DANG-CHAY (chủ SP 19/11, mockup Ⓣ1 D, E): khối "PA đang chạy" ở Công việc + dòng Tutor trong lưới Ghi kết quả PA. */
import type { Dich } from '../en.ts';

export const EN_TUTOR2_PDC = {
  'Ghi nháp': 'Save draft',
  'Mỗi dòng: chọn <b>Tiến triển (2 tuần)</b>, gõ <b>Nhận xét</b>; Tutor thêm <b>đã học / dự kiến</b>, <b>Tutor</b>.': 'On each grid row: pick <b>Progress (2 weeks)</b>, type a <b>Comment</b>; Tutor plans add <b>attended / planned</b>, <b>Tutor</b>.',
  'Còn lại: <b>Mở đầy đủ</b>.': 'Everything else: <b>Open in full</b>.',
  'Tab <b>Case học thuật</b>, dưới <b>Kết quả PA</b>: mọi PA bạn giữ mà chưa tới hạn ghi kết quả. <b>Không tính</b> vào số việc, huy hiệu, chuông.': 'Tab <b>Academic cases</b>, under <b>Plan results</b>: every plan you hold that is not due yet. <b>Not counted</b> in the task count, badges or the bell.',
  'Bấm một em (hoặc <b>Ghi nháp</b> / nhãn <b>nháp</b>) để ghi kết quả tạm, <b>Lưu nháp</b> giữ tới hạn; bấm dòng lớp mở lưới cả lớp. Tới hạn − 2 ngày PA tự lên nhóm Kết quả PA.': 'Click a student (or <b>Save draft</b> / the <b>draft</b> tag) to write a provisional result; <b>Save draft</b> keeps it until the deadline; click a class row for the class grid. Two days before the deadline the plan moves up to Plan results on its own.',
  'đã học {da}': (b) => `attended ${b.da}`,
  'Lưu nháp giữ tới hạn · Lưu là chốt, đổi bằng Sửa': 'Draft is kept until the deadline · Save finalises the period, change it with Edit',
  'Ghi nháp: {ten}': (b) => `Write draft: ${b.ten}`,
  'Mở nháp: {ten}': (b) => `Open draft: ${b.ten}`,
  'Giải thích PA đang chạy': 'About running plans',
  'PA bạn đang giữ, chưa tới hạn ghi kết quả. Tới hạn − 2 ngày PA chuyển lên nhóm Kết quả PA. Không tính vào số việc.': 'Plans you hold that are not due yet. Two days before the deadline a plan moves up to Plan results. Not counted in your task count.',
  'Thiếu số buổi đã học': 'Sessions attended missing',
  'Thiếu số buổi dự kiến': 'Planned sessions missing',
  'Thiếu Tutor': 'Tutor missing',
  'Buổi: đã học / dự kiến': 'Sessions: attended / planned',
  'Số buổi · {ten}': (b) => `Sessions · ${b.ten}`,
  'Tutor · {ten}': (b) => `Tutor for ${b.ten}`,
  '{n} PA · {lop}': (b) => `${b.n} plans · ${b.lop}`,
  'PA đang chạy · {lop}': (b) => `Running plans · ${b.lop}`,
} satisfies Record<string, Dich>;
