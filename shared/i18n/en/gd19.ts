/** GD-19 CHUONG + VI-PHAM (mockup ⑪): form công tắc "Yêu cầu GVCN xử lý", panel Xử lý vi phạm (Không xử lý), tab Ý thức. Khoá = chữ Việt trên web. */
import type { Dich } from '../en.ts';

export const EN_GD19 = {
  'Không tính vào bậc · GVCN nhận tin ở chuông': 'Not counted toward the ladder · homeroom teacher gets an update',
  'GVCN {gvcn} có việc Xử lý vi phạm, hạn {han}': 'Homeroom teacher {gvcn} gets a "Handle incident" task, due {han}',
  'GVCN xác nhận xử lý, hoặc ghi "Không xử lý" kèm lý do — bạn nhận tin. Vi phạm vẫn tính vào 3 vi phạm / 2 tuần.': 'The homeroom teacher confirms an action, or records "Not handled" with a reason — you get an update. The incident still counts toward 3 incidents / 2 weeks.',
  'GVCN nhận tin ở chuông · đủ 3 trong 2 tuần thì phải xử lý': 'Homeroom teacher gets an update · 3 within 2 weeks must be handled',
  'Yêu cầu GVCN xử lý': 'Ask homeroom teacher to handle',
  'Yêu cầu xử lý': 'Action requested',
  'Trong 2 tuần:': 'Within 2 weeks:',
  'Đã lưu · Không xử lý · {ten}': 'Saved · Not handled · {ten}',
  '{x} yêu cầu': 'requested by {x}',
  'Người ghi nhận lý do · vi phạm vẫn tính vào luật 3 vi phạm / 2 tuần': 'The recorder gets the reason · the incident still counts toward 3 incidents / 2 weeks',
  'GVCN đổi ý thì vẫn Xác nhận xử lý được ở tab Ý thức.': 'The homeroom teacher can still confirm an action later in the Conduct tab.',
  'Lưu không xử lý': 'Save as not handled',
  'gửi {x}': 'sent to {x}',
  'người ghi': 'the recorder',
  'Không xử lý · {ngay}': 'Not handled · {ngay}',
  '{n} vi phạm trong 2 tuần': (b) => `${b.n} incident(s) in 2 weeks`,
  /* Hướng dẫn "?" (GV). */
  'Ô <b>Môn</b>: dạy một môn ở lớp thì tự điền; dạy từ 2 môn thì phải chọn. Cần GVCN xử lý ngay thì bật <b>Yêu cầu GVCN xử lý</b>: GVCN có việc, hạn 5 ngày; GVCN không xử lý thì bạn nhận tin kèm lý do.': '<b>Subject</b>: filled in if you teach one subject in the class; choose if you teach 2 or more. Need the homeroom teacher to act now? Turn on <b>Ask homeroom teacher to handle</b>: they get a task due in 5 days; if they decline, you get an update with the reason.',
  '<b>Lưu</b>. GVCN nhận tin ở chuông; đủ 3 vi phạm trong 2 tuần thì GVCN phải xử lý.': '<b>Save</b>. The homeroom teacher gets an update; 3 incidents within 2 weeks must be handled.',
  'Vi phạm <b>được yêu cầu xử lý</b>: <b>Xác nhận xử lý</b>, hoặc <b>Không xử lý</b> kèm lý do (người ghi nhận tin; vi phạm vẫn tính vào 3 vi phạm / 2 tuần). QL đã duyệt đề xuất xử lý: <b>Lưu · Đã thực hiện</b>.': 'Incident <b>flagged for action</b>: <b>Confirm action</b>, or <b>Not handled</b> with a reason (the recorder gets an update; the incident still counts toward 3 incidents / 2 weeks). Manager approved the proposed action: <b>Save · Done</b>.',
  'Bấm chuông: <b>Việc cần làm</b> — mỗi tab Công việc một thanh, số việc, quá hạn tô đỏ; bấm thanh mở <b>Công việc</b> đúng tab.': 'Click the bell: <b>To do</b> — one bar per Tasks tab, task count, overdue in red; click a bar to open that tab in <b>Tasks</b>.',
  'Bấm <b>⌄</b> cuối thanh: 3 việc gấp nhất hiện tại chỗ, bấm một việc mở thẳng việc đó.': 'Click <b>⌄</b> at the end of a bar: the 3 most urgent tasks show in place; click one to open it directly.',
  '<b>Cập nhật</b>: tin một chiều (vi phạm mới, nhắc nhở…); <b>✓</b> = đã xem, <b>Đã xem hết</b> (Hoàn tác 10 giây), <b>Xem tất cả</b>.': '<b>Updates</b>: one-way news (new incidents, reminders…); <b>✓</b> = seen, <b>Mark all seen</b> (10-second undo), <b>See all</b>.',
} satisfies Record<string, Dich>;
