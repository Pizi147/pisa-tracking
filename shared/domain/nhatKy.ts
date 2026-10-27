import { tenMonNgan } from './normal.ts';

/**
 * NHÃN TIẾNG VIỆT CHO NHẬT KÝ THAY ĐỔI (PR-N1, UX-A A7): Quản trị › Nhật ký không hiện mã máy (`attempt.cancel_part`).
 * Mã mới chưa có nhãn → "Thao tác hệ thống" (mã thô vẫn ở `title` cho người cần tra). Phép kiểm N1 (11) quét mọi
 * `action: 'x.y'` ở máy chủ, nên thêm mã mới mà quên nhãn thì phép kiểm đỏ.
 */
const NHAN_NHAT_KY: Record<string, string> = {
  'attachment.add': 'Thêm bằng chứng', 'attachment.delete': 'Xoá bằng chứng',
  'attempt.absence_move': 'Dời lịch Test vì vắng', 'attempt.absence_auto_move': 'Hệ thống tự dời do vắng lần 1', 'attempt.cancel': 'Huỷ cả lượt MT',
  'attempt.cancel_appointment': 'Huỷ lịch Test môn', 'attempt.cancel_part': 'Huỷ phần còn lại của lượt',
  'attempt.unschedule': 'Huỷ lịch lượt (bỏ tuần, giữ lượt)',
  'attempt.huy_vang': 'Huỷ kỹ năng (vắng 2 lần)',
  'attempt.create': 'Tạo lượt Test', 'attempt.no_show_settled': 'Chốt vắng', 'attempt.recreate': 'Tạo lại lượt Test (số dùng lại)',
  'attempt.restore_part': 'Khôi phục phần đã huỷ', 'attempt.restore_skill': 'Khôi phục kỹ năng', 'attempt.khoi_phuc': 'Khôi phục lượt MT',
  'attempt.skip_skill': 'Bỏ khỏi đợt', 'attempt.sit_status': 'Ghi đã làm bài / vắng', 'attempt.skill_week': 'Dời lịch Test',
  'case.auto_from_sos': 'Tạo Case từ SOS', 'case.auto_from_giua_khoa': 'Tạo Case từ Progress Test', 'case.bo_tro.nop_ke_hoach': 'Nộp kế hoạch bổ trợ', 'case.backfill': 'Nhập bù Case đã xong', 'case.backfill.done': 'Nhập bù Case đã xong',
  'case.classify': 'Phân loại Case', 'case.close': 'Đóng Case', 'case.disposition': 'Kết luận Case', 'case.dismiss': 'Không cần theo dõi',
  'case.intervention': 'Thêm PA', 'case.intervention.complete': 'Kết thúc PA', 'case.outcome': 'Hoàn thành Case',
  'case.reopen': 'Mở lại Case', 'case.edit': 'Sửa Case', 'case.xac_nhan_s': 'Xác nhận Case Speaking', 'case.delete': 'Xoá Case', 'case.follow_until': 'Đổi hạn theo dõi Case', 'intervention.delete': 'Xoá PA', 'intervention.undo_add': 'Hoàn tác thêm PA',
  'case.plan.approved': 'Duyệt đề xuất PA', 'case.plan.declined': 'Từ chối đề xuất PA', 'case.plan.comment': 'Góp ý đề xuất PA',
  'case.preset.confirm': 'Xác nhận PA theo quy chế', 'case.preset.replace': 'Thay PA theo quy chế', 'case.confirm': 'Xác nhận Case',
  'case.preset.confirm_undo': 'Hoàn tác xác nhận PA', 'case.confirm_undo': 'Hoàn tác xác nhận Case', 'case.xac_nhan_s_undo': 'Hoàn tác xác nhận Case Speaking',   // HOAN-TAC-XN
  'case.dismiss.request': 'Gửi Không cần theo dõi',
  'case.report': 'Tạo Case', 'case.report.merge': 'Ghi vào Case đang có', 'case.result.update': 'Kết quả PA', 'case.result.edit': 'Sửa kết quả PA', 'case.result.undo': 'Hoàn tác kết quả PA', 'case.plan.doi_pa': 'Đề xuất PA khác', 'case.followup.edit': 'Sửa xem lại', 'intervention.edit': 'Sửa PA',
  'case.retired_score_fixed': 'Huỷ Case vì sửa điểm', 'case.xoa_overall_dat': 'Xoá Case vì em đạt lại (chưa có PA xác nhận)', 'case.system_close': 'Hệ thống đóng Case', 'case.system_reopen': 'Mở lại Case hệ thống đã đóng', 'case.mo_lai_xoa_diem': 'Mở lại Case (nhập lại điểm)',
  'case.tam': 'Tạo Case tạm (chờ chốt SOS)', 'case.xoa_tam': 'Xoá Case tạm (trước khi chốt SOS)', 'case.xoa_cho_chot_sos': 'Xoá Case "Chờ chốt SOS" cũ (đổi luật)',
  'class.assign': 'Phân công giáo viên', 'class.create': 'Tạo lớp', 'class.bulk_create': 'Tạo nhiều lớp', 'class.delete': 'Xoá lớp', 'class.finished': 'Kết thúc lớp', 'class.reopened': 'Mở lại lớp',
  'xet_lai.quyet': 'Xét lại lộ trình', 'xet_lai.hoan_tac': 'Hoàn tác xét lại lộ trình', 'xet_lai.nhan_xet': 'Nhận xét xét lại (GVCN lớp mới)',
  'lenh_chuyen.tao': 'Quyết định chuyển lớp', 'lenh_chuyen.sua': 'Sửa quyết định chuyển lớp', 'lenh_chuyen.huy': 'Huỷ quyết định chuyển lớp', 'lenh_chuyen.khoi_phuc': 'Khôi phục quyết định chuyển lớp',
  'lenh_chuyen.thi_hanh': 'Thi hành quyết định chuyển lớp', 'ban_giao.ghi_mon': 'Ghi bàn giao môn', 'ban_giao.xac_nhan': 'GVCN xác nhận bàn giao', 'ban_giao.sua': 'Sửa bàn giao đã xác nhận',
  'class.info': 'Sửa thông tin lớp', 'class.progress': 'Đổi tiến độ lớp', 'class.progress.doi_bai': 'Dời bài theo mốc lớp', 'class.transition': 'Chuyển tiếp lớp',
  'class.sua_ca_lop': 'Sửa thông tin cả lớp',   // OV-15i1: một mục cho cả lô (Lịch sử lớp)
  'cycle.baseline.clear': 'Xoá điểm đầu vào', 'cycle.baseline.set': 'Ghi điểm đầu vào', 'cycle.create': 'Mở lộ trình',
  'cycle.outcome': 'Kết luận lộ trình', 'cycle.thi_that': 'Kết quả thi thật', 'cycle.buoc_tiep': 'Bước tiếp sau thi', 'cycle.han_sau_thi': 'Gia hạn sau thi', 'cycle.mon_dang_ky': 'Đổi môn học', 'cycle.target.revise': 'Đổi Target', 'cycle.update': 'Sửa lộ trình',
  'discipline.acknowledge': 'Ghi nhận vi phạm (đã xem)', 'discipline.handle': 'Xác nhận xử lý vi phạm', 'discipline.edit': 'Sửa vi phạm của lần xử lý', 'discipline.delete': 'Xoá lần xử lý',
  'discipline.propose': 'Đề xuất QL duyệt xử lý Ý thức', 'discipline.performed': 'Đã thực hiện xử lý Ý thức',
  'discipline.not_performed': 'Đưa lần xử lý về Chưa thực hiện', 'discipline.edit_info': 'Sửa ngày / người / mô tả lần xử lý', 'discipline.unacknowledge': 'Bỏ ghi nhận vi phạm',
  'discipline.declare_level': 'Xác nhận cấp bậc vi phạm từ trước', 'discipline.declare_level_edit': 'Sửa cấp bậc vi phạm',
  'discipline.revoke_request': 'Xin thu hồi lần xử lý', 'discipline.revoke': 'Thu hồi lần xử lý', 'discipline.revoke_undo': 'Huỷ thu hồi lần xử lý',   // LUAT-5
  'case.owner_assign': 'Gán người phụ trách Case',   // SUA-NO-RA (migrate prCvLoi)
  'case.owner_change': 'Đổi người phụ trách Case',   // R1-NO-CU (D17)
  'discipline.bao_ph': 'Ghi kết quả báo phụ huynh', 'discipline.bao_ph_bo': 'Bỏ việc báo phụ huynh',   // SV-YT-TVV
  'ke_hoach.hang_loat': 'Xếp lịch Test hàng loạt',
  'measure.add_violations': 'Gom thêm vi phạm vào lần xử lý', 'measure.confirm': 'Xác nhận đã xử lý vi phạm', 'measure.create': 'Tạo lần xử lý vi phạm',
  'measure.delete': 'Xoá lần xử lý vi phạm', 'measure.edit': 'Sửa lần xử lý vi phạm', 'measure.note': 'Ghi chú lần xử lý vi phạm',
  'measure.remove_violation': 'Bỏ vi phạm khỏi PA',
  'mgmt_task.create': 'Tạo công việc quản lý', 'mt.xuat_excel': 'Xuất Excel kết quả Test', 'ke_hoach.xuat_excel': 'Xuất Excel Kế hoạch Test', 'lich_thi.luu': 'Lưu kết luận lịch thi', 'hoc_vien.xuat_excel': 'Xuất Excel danh sách học viên', 'ke_hoach.xuat_diem': 'Xuất điểm Test',
  'regular.no_show': 'Báo vắng', 'regular.no_show_cleared': 'Bỏ báo vắng', 'regular.plan': 'Xếp lịch bài lớp thường',
  'request.approve': 'Duyệt yêu cầu', 'request.decline': 'Từ chối yêu cầu', 'request.answer': 'Trả lời Xin ý kiến', 'request.undo': 'Huỷ quyết định duyệt',
  'request.create': 'Gửi yêu cầu duyệt', 'request.edit': 'Người gửi sửa yêu cầu', 'request.withdraw': 'Người gửi rút yêu cầu', 'request.answer_edit': 'Sửa câu trả lời Xin ý kiến',
  'cuoi_khoa.quyet': 'Quản lý quyết hướng Final Test', 'cuoi_khoa.bo_tro_tao': 'Tạo bổ trợ miễn phí sau Final Test', 'cuoi_khoa.bo_tro_huy': 'Huỷ bổ trợ miễn phí (đổi quyết định)', 'cuoi_khoa.mini_test_dong': 'Đóng Mini Test (em chuyển Fast Track)',
  'cuoi_khoa.mini_test': 'Ghi Mini Test', 'cuoi_khoa.ket_luan_ft': 'Chốt Kết quả đầu ra lên FT', 'cuoi_khoa.ky_vong_lop': 'Kết quả đầu ra cả lớp', 'cuoi_khoa.de_xuat_kq': 'GVCN đề xuất Kết quả đầu ra', 'lo_trinh.nhap': 'Lưu nháp lộ trình', 'ban_giao.lam_lai': 'Bàn giao cần làm lại',
  'regular.score': 'Nhập điểm lớp thường', 'regular.score.override': 'Sửa điểm lớp thường',
  'score.lich_su': 'Nhập điểm MT cũ',
  'score.huy_vuot': 'Huỷ điểm do dời vượt',
  'ket_qua_huy.bo': 'Bỏ kết quả đã huỷ khi xếp lại lượt',
  'score.khoi_phuc': 'Khôi phục điểm',
  'report.unlock': 'Mở khoá báo cáo', 'report.relock': 'Khoá lại báo cáo',
  'role.permission.grant': 'Cấp quyền cho vai', 'role.permission.revoke': 'Bỏ quyền của vai', 'role.retired': 'Bỏ vai cũ', 'rule.changed': 'Đổi luật',
  'schedule.autoplan': 'Tự xếp lịch Test',
  'gop_y_tuan.ghi': 'Ghi góp ý hàng tuần', 'gop_y_tuan.xoa': 'Xoá góp ý hàng tuần',
  'bai_tren_lop.them': 'Ghi tiến độ trên lớp', 'bai_tren_lop.sua': 'Sửa tiến độ trên lớp', 'bai_tren_lop.xoa': 'Xoá tiến độ trên lớp',
  's_expert.them': 'Thêm S Expert', 's_expert.sua': 'Sửa S Expert', 's_expert.cham': 'Chấm S Expert', 's_expert.xoa': 'Xoá S Expert',
  'dau_ra.ghi': 'Ghi đánh giá đầu ra',   // UI-HO-SO-LOP (C17)
  'score.edit': 'Nhập điểm', 'score.override': 'Sửa điểm', 'score.no_show': 'Báo vắng', 'score.no_show_cleared': 'Bỏ báo vắng',
  'score.nhan_xet': 'Sửa nhận xét',
  'score.nhan_xet_phu_trach': 'Nhận xét GV phụ trách',   // OV-13k
  'score.dan_excel': 'Dán điểm từ Excel',   // OV-15b
  'score.dan_excel_hoan_tac': 'Hoàn tác dán điểm từ Excel',   // OV-15b
  'signal.assign': 'Giao xác nhận nguyên nhân', 'signal.dismissed': 'Bỏ qua, không lập Case', 'signal.linked': 'Nối vào Case',
  'signal.raised': 'Có Case chờ xác nhận nguyên nhân', 'signal.withdrawn': 'Rút Case chờ xác nhận nguyên nhân', 'signal.withdrawn_batch': 'Rút Case chờ xác nhận nguyên nhân hàng loạt',
  'sos_coordination.add': 'Thêm việc phối hợp SOS', 'sos_coordination.confirm': 'Xác nhận việc phối hợp SOS',
  'sos_coordination.remove': 'Bỏ việc phối hợp SOS', 'sos_coordination.reopen': 'Đưa lại / khôi phục việc phối hợp', 'sos_coordination.sync': 'Cập nhật việc phối hợp SOS',
  'student.archive': 'Lưu trữ học viên', 'student.create': 'Thêm học viên', 'student.bulk_add': 'Thêm học viên hàng loạt', 'student.delete': 'Xoá học viên',
  'student.hang_loat': 'Làm nhiều học viên một lần', 'student.next_step': 'Ghi lộ trình tiếp theo', 'student.rejoin': 'Học lại', 'student.rejoin_undo': 'Hoàn tác Học lại', 'student.finish_undo': 'Hoàn tác Kết thúc học', 'student.pause_undo': 'Hoàn tác Tạm dừng', 'student.resume_undo': 'Hoàn tác Quay lại học', 'student.status': 'Đổi trạng thái học', 'student.transfer': 'Chuyển lớp',
  'student.unarchive': 'Bỏ lưu trữ học viên', 'student.update': 'Sửa thông tin học viên',
  'task.create': 'Tạo công việc', 'task.update': 'Cập nhật công việc',
  'unit_report.link_task': 'Nối công việc vào báo cáo', 'unit_report.save': 'Lưu họp đơn vị', 'unit_report.unlink_task': 'Bỏ công việc khỏi báo cáo',
  'user.delete': 'Xoá tài khoản', 'user_approved': 'Duyệt tài khoản', 'user_declined': 'Từ chối tài khoản', 'user_created': 'Tạo tài khoản',
  'user_info_set': 'Sửa thông tin tài khoản', 'programme_created': 'Thêm chương trình', 'programme_updated': 'Sửa chương trình', 'route_updated': 'Sửa lộ trình FT',
  'user_roles_set': 'Đổi vai tài khoản', 'user_permissions_set': 'Đổi quyền tài khoản', 'user_skills_set': 'Sửa kỹ năng tài khoản', 'password_reset': 'Đặt lại mật khẩu',
  'violation.delete': 'Xoá vi phạm', 'violation.edit': 'Sửa vi phạm', 'violation.record': 'Ghi vi phạm',
  'work.remind': 'Nhắc việc',
  /* TU-b: trang Tutor. */
  'tutor.them': 'Thêm tutor', 'tutor.sua': 'Sửa tutor', 'tutor.xoa': 'Xoá tutor', 'tutor.tai_len': 'Tải danh sách tutor',
  'tutor.nhan_xet': 'Ghi nhận xét về tutor', 'tutor.nhan_xet_sua': 'Sửa nhận xét về tutor', 'tutor.nhan_xet_xoa': 'Xoá nhận xét về tutor',
  'tutor.gop_ten': 'Gộp tên tutor gõ tay', 'tutor.gop_hoan_tac': 'Hoàn tác gộp tên tutor',
};

export function nhanHanhDongNhatKy(ma: string): string {
  return NHAN_NHAT_KY[ma] ?? 'Thao tác hệ thống';
}

/** OV-11b (QT-5): đối tượng "PET · reading_writing" (mã môn thô, ghi ở đường điểm lớp thường) → "PET · R+W"; nhãn khác giữ nguyên. */
export function nhanDoiTuongNhatKy(nhan: string): string {
  const m = /^(\S+) · ([a-z][a-z0-9_]*)$/.exec(nhan);
  return m ? `${m[1]} · ${tenMonNgan(m[1], m[2])}` : nhan;
}
