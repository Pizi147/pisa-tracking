/**
 * NHÃN TIẾNG VIỆT CHO NHẬT KÝ THAY ĐỔI (PR-N1, UX-A A7): Quản trị › Nhật ký không hiện mã máy (`attempt.cancel_part`).
 * Mã mới chưa có nhãn → "Thao tác hệ thống" (mã thô vẫn ở `title` cho người cần tra). Phép kiểm N1 (11) quét mọi
 * `action: 'x.y'` ở máy chủ, nên thêm mã mới mà quên nhãn thì phép kiểm đỏ.
 */
const NHAN_NHAT_KY: Record<string, string> = {
  'attachment.add': 'Thêm bằng chứng', 'attachment.delete': 'Xoá bằng chứng',
  'attempt.absence_move': 'Dời lịch Test vì vắng', 'attempt.absence_auto_move': 'Máy tự dời do vắng lần 1', 'attempt.cancel': 'Huỷ lượt Test',
  'attempt.cancel_appointment': 'Huỷ lịch hẹn thi môn', 'attempt.cancel_part': 'Huỷ phần còn lại của lượt',
  'attempt.create': 'Tạo lượt Test', 'attempt.no_show_settled': 'Chốt vắng thi', 'attempt.recreate': 'Tạo lại lượt Test (số dùng lại)',
  'attempt.restore_part': 'Khôi phục phần đã huỷ', 'attempt.restore_skill': 'Khôi phục kỹ năng thi',
  'attempt.skip_skill': 'Bỏ kỹ năng không thi', 'attempt.sit_status': 'Ghi đã thi / vắng', 'attempt.skill_week': 'Đổi tuần thi kỹ năng',
  'case.auto_from_sos': 'Tạo Case từ SOS', 'case.backfill': 'Nhập bù Case đã xong', 'case.backfill.done': 'Nhập bù Case đã xong',
  'case.classify': 'Phân loại Case', 'case.close': 'Đóng Case', 'case.disposition': 'Kết luận Case', 'case.dismiss': 'Không cần theo dõi',
  'case.intervention': 'Thêm PA', 'case.intervention.complete': 'Kết thúc PA', 'case.outcome': 'Hoàn thành Case',
  'case.plan.approved': 'Duyệt đề xuất PA', 'case.plan.declined': 'Không duyệt đề xuất PA', 'case.plan.comment': 'Góp ý đề xuất PA',
  'case.preset.confirm': 'Xác nhận PA theo quy chế', 'case.preset.replace': 'Thay PA theo quy chế', 'case.confirm': 'Xác nhận Case', 'case.dismiss.request': 'Gửi Không cần theo dõi',
  'case.report': 'Tạo Case', 'case.report.merge': 'Ghi vào Case đang có', 'case.result.update': 'Ghi kết quả PA',
  'case.retired_score_fixed': 'Huỷ Case vì sửa điểm', 'case.system_close': 'Hệ thống đóng Case',
  'class.assign': 'Phân công giáo viên', 'class.create': 'Tạo lớp', 'class.delete': 'Xoá lớp', 'class.finished': 'Kết thúc lớp',
  'class.info': 'Sửa thông tin lớp', 'class.progress': 'Đổi tiến độ lớp', 'class.transition': 'Chuyển tiếp lớp',
  'cycle.baseline.clear': 'Xoá điểm đầu vào', 'cycle.baseline.set': 'Ghi điểm đầu vào', 'cycle.create': 'Mở lộ trình',
  'cycle.outcome': 'Kết luận lộ trình', 'cycle.target.revise': 'Đổi mục tiêu band', 'cycle.update': 'Sửa lộ trình',
  'discipline.acknowledge': 'Ghi nhận vi phạm (đã xem)', 'discipline.handle': 'Xác nhận xử lý vi phạm',
  'discipline.propose': 'Đề xuất QL duyệt xử lý Ý thức', 'discipline.performed': 'Đã thực hiện xử lý Ý thức',
  'discipline.declare_level': 'Khai bậc Ý thức trước khi dùng web', 'discipline.declare_level_edit': 'Sửa khai bậc Ý thức',
  'ke_hoach.hang_loat': 'Xếp lịch Test hàng loạt',
  'measure.add_violations': 'Gom thêm vi phạm vào PA', 'measure.confirm': 'Xác nhận đã xử lý vi phạm', 'measure.create': 'Tạo PA xử lý vi phạm',
  'measure.delete': 'Xoá PA xử lý vi phạm', 'measure.edit': 'Sửa PA xử lý vi phạm', 'measure.note': 'Ghi chú PA xử lý vi phạm',
  'measure.remove_violation': 'Bỏ vi phạm khỏi PA',
  'mgmt_task.create': 'Tạo công việc quản lý',
  'regular.no_show': 'Ghi vắng thi môn', 'regular.no_show_cleared': 'Bỏ ghi vắng thi môn', 'regular.plan': 'Xếp lịch bài lớp thường',
  'request.approve': 'Duyệt yêu cầu', 'request.decline': 'Từ chối yêu cầu', 'request.answer': 'Trả lời Xin ý kiến',
  'request.create': 'Gửi yêu cầu duyệt',
  'regular.score': 'Nhập điểm lớp thường', 'regular.score.override': 'Sửa điểm lớp thường',
  'score.lich_su': 'Nhập điểm MT lịch sử',
  'report.unlock': 'Mở khoá báo cáo', 'report.relock': 'Khoá lại báo cáo',
  'role.permission.grant': 'Cấp quyền cho vai', 'role.permission.revoke': 'Bỏ quyền của vai', 'role.retired': 'Bỏ vai cũ', 'rule.changed': 'Đổi luật',
  'schedule.autoplan': 'Tự xếp lịch Test',
  'score.edit': 'Nhập điểm', 'score.override': 'Sửa điểm', 'score.no_show': 'Ghi vắng thi', 'score.no_show_cleared': 'Bỏ ghi vắng thi',
  'signal.assign': 'Giao tín hiệu', 'signal.dismissed': 'Bỏ qua tín hiệu', 'signal.linked': 'Nối tín hiệu vào Case',
  'signal.raised': 'Tạo tín hiệu', 'signal.withdrawn': 'Rút tín hiệu', 'signal.withdrawn_batch': 'Rút tín hiệu hàng loạt',
  'sos_coordination.add': 'Thêm việc phối hợp SOS', 'sos_coordination.confirm': 'Xác nhận việc phối hợp SOS',
  'sos_coordination.remove': 'Bỏ việc phối hợp SOS', 'sos_coordination.sync': 'Cập nhật việc phối hợp SOS',
  'student.archive': 'Lưu trữ học viên', 'student.bulk_add': 'Thêm học viên hàng loạt', 'student.delete': 'Xoá học viên',
  'student.next_step': 'Ghi lộ trình tiếp theo', 'student.status': 'Đổi trạng thái học', 'student.transfer': 'Chuyển lớp',
  'student.unarchive': 'Bỏ lưu trữ học viên', 'student.update': 'Sửa thông tin học viên',
  'task.create': 'Tạo công việc', 'task.update': 'Cập nhật công việc',
  'unit_report.link_task': 'Nối công việc vào báo cáo', 'unit_report.save': 'Lưu báo cáo đơn vị', 'unit_report.unlink_task': 'Bỏ công việc khỏi báo cáo',
  'user.delete': 'Xoá tài khoản', 'user_approved': 'Duyệt tài khoản', 'user_declined': 'Từ chối tài khoản', 'user_created': 'Tạo tài khoản',
  'user_roles_set': 'Đổi vai tài khoản', 'user_permissions_set': 'Đổi quyền tài khoản', 'user_skills_set': 'Sửa kỹ năng tài khoản', 'password_reset': 'Đặt lại mật khẩu',
  'violation.delete': 'Xoá vi phạm', 'violation.edit': 'Sửa vi phạm', 'violation.record': 'Ghi vi phạm',
  'work.remind': 'Nhắc việc',
};

export function nhanHanhDongNhatKy(ma: string): string {
  return NHAN_NHAT_KY[ma] ?? 'Thao tác hệ thống';
}
