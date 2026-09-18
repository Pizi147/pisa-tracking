/** CON NGƯỜI — vai trò, quyền và bộ lọc học viên theo vai. */

// ---------------------------------------------------------------- Quyền

/*
 * BA nhóm tài khoản giao được.
 *
 * `system_admin` là người quản trị PHẦN MỀM (tài khoản, vai trò, cấu hình) — giữ nguyên.
 * `manager` điều hành chuyên môn của chi nhánh. `teacher` là GVCN và/hoặc GVBM.
 *
 * ADMIN CHI NHÁNH ĐÃ BỎ (owner chốt sau PR15). Nhân sự văn phòng từng giữ vai này làm
 * những việc mà người quyết định thật sự là Quản lý hoặc GVCN — huỷ lượt MT, bỏ một kỹ
 * năng, đặt hạn nhập điểm riêng — nên một vai trung gian chỉ làm chậm việc và làm mờ
 * trách nhiệm. Nhiệm vụ đã chuyển về Quản lý và GVCN theo ma trận nghiệp vụ.
 */
export const ROLES = ['system_admin', 'manager', 'teacher'] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  system_admin: 'Quản trị hệ thống', manager: 'Quản lý', teacher: 'Giáo viên',
};

/**
 * VAI TRÒ ĐÃ BỎ — chỉ để ĐỌC lịch sử, không bao giờ để giao mới.
 *
 * Dữ liệu cũ vẫn còn những dòng phân quyền mang mã này, và nhật ký vẫn ghi "ai đã làm gì"
 * dưới vai đó. Xoá mã đi thì các màn lịch sử hiện ra một chuỗi trống không ai hiểu, nên mã
 * được giữ kèm nhãn nói rõ nó đã bỏ.
 */
export const RETIRED_ROLE_LABEL: Record<string, string> = {
  branch_admin: 'Admin chi nhánh (vai trò đã bỏ)',
};

/** Nhãn của một mã vai trò bất kỳ, kể cả mã đã bỏ. Dùng ở mọi nơi hiển thị lịch sử. */
export function roleLabel(key: string): string {
  return (ROLE_LABEL as Record<string, string>)[key] ?? RETIRED_ROLE_LABEL[key] ?? key;
}

export const PERMISSIONS = {
  /*
   * --- Lịch: CHỈ CÒN TUẦN ---
   *
   * Một lượt MT được xác định bằng đúng một TUẦN. Không còn quyền "chốt ngày giờ" và "đổi
   * lịch Speaking" — hai quyền đó tồn tại chỉ để phục vụ một đầu việc đã bỏ.
   */
  /** Chốt và đổi TUẦN của một lượt MT. Việc của Quản lý. */
  PLAN_WEEK: 'plan.week',
  /**
   * DỜI LỊCH MỘT KỸ NĂNG — sổ SCH-01/SCH-02. Tách khỏi `PLAN_WEEK` vì `PLAN_WEEK` còn kèm
   * theo xếp lịch Fast Track chủ động (`bulkPlan`), việc vẫn của riêng Quản lý. Quyền này chỉ
   * mở cho GVCN (lớp Normal mình chủ nhiệm) và GVBM (đúng môn mình dạy, lớp Normal) — xem
   * `teacherAllows` ở `server/src/permissions.ts`. Cấp thẳng `PLAN_WEEK` cho giáo viên để
   * "chữa tạm" sẽ vô tình mở luôn quyền xếp lịch Fast Track — sổ cấm rõ.
   */
  SCHEDULE_MOVE: 'schedule.move',
  ATTEMPT_CANCEL: 'attempt.cancel',
  /** Đánh dấu một kỹ năng là KHÔNG MOCK cho chính lượt đó. */
  ATTEMPT_SKIP_SKILL: 'attempt.skip_skill',
  /** Đặt hạn nhập điểm khác mặc định. */
  DEADLINE_OVERRIDE: 'deadline.override',

  // --- Điểm và đánh giá ---
  ATTEMPT_VIEW: 'attempt.view',
  /** Nhập điểm ĐÚNG kỹ năng được phân công. Không kèm quyền sửa lịch. */
  SCORE_EDIT: 'score.edit',
  /** Nhập bù / sửa điểm NGOÀI phân công. Tách riêng để còn siết lại được — xem O05. */
  SCORE_OVERRIDE: 'score.override',
  /** Giáo viên cập nhật đánh giá của kỹ năng mình phụ trách. */
  ESTIMATE_EDIT: 'estimate.edit',

  // --- Sau đánh giá ---
  /**
   * XEM DANH SÁCH CASE của học viên.
   *
   * Tách riêng khỏi `sos.edit` vì hai việc khác nhau, và bảng bộ lọc ở mục 6 tài liệu chốt
   * vòng 4 nói thẳng điều đó: Admin chi nhánh VẪN ghi nhận được xử lý (họ ghi hộ việc CS đã
   * gọi phụ huynh) nhưng KHÔNG có bốn bộ lọc case — hồ sơ chuyên môn của từng em không phải
   * việc của văn phòng. Gộp hai quyền làm một thì không thể nói được câu đó.
   */
  CASE_VIEW: 'case.view',
  /**
   * BÁO MỘT VẤN ĐỀ MỚI (AUTH-01) — tách khỏi `SOS_EDIT`. Bất kỳ giáo viên nào có phân công
   * trong lớp đều báo được, kể cả trái môn: sổ §13.12 nói rõ "GV trong lớp có thể báo vấn
   * đề". Báo được KHÔNG có nghĩa được sửa/xử lý — đó là `SOS_EDIT`, siết theo đúng kỹ năng
   * (Học thuật) hoặc GVCN (Ý thức). Gộp chung hai quyền là đúng lỗ hổng AUTH-01: GV Listening
   * "báo được" thì cũng "sửa được" case Reading trái môn.
   */
  SOS_REPORT: 'sos.report',
  /** Sửa/xử lý một case ĐÃ CÓ — đúng kỹ năng mình dạy (Học thuật) hoặc GVCN (Ý thức). */
  SOS_EDIT: 'sos.edit',
  /** Kết thúc theo dõi một case. GVCN của lớp và Quản lý — không phải mọi giáo viên. */
  CASE_CLOSE: 'case.close',
  /** Duyệt phương án hỗ trợ giáo viên đề xuất. Chỉ Quản lý và Quản trị hệ thống. */
  CASE_APPROVE: 'case.approve',
  /** Phân công giáo viên dạy kỹ năng nào ở lớp nào. */
  CLASS_ASSIGN: 'class.assign',
  /**
   * Sửa TIẾN ĐỘ của lớp: tuần bắt đầu, tuần Progress Test, tuần Final Test.
   *
   * Tách khỏi `class.assign` vì hai việc khác hẳn nhau: phân công là chuyện nhân sự, tiến độ
   * là chuyện lịch học của cả lớp. Owner giao cho Admin CN và Quản lý CN (mục 7.6).
   */
  CLASS_EDIT: 'class.edit',

  // --- Hồ sơ và vận hành ---
  STUDENT_VIEW: 'student.view',
  STUDENT_EDIT: 'student.edit',
  MEETING_VIEW: 'meeting.view',
  MEETING_EDIT: 'meeting.edit',
  ADMIN_CONFIG: 'admin.config',
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABEL: Record<string, string> = {
  'plan.week': 'Chốt tuần MT',
  'schedule.move': 'Dời lịch một kỹ năng (lớp Normal, đúng phần phụ trách)',
  'attempt.cancel': 'Huỷ lượt MT',
  'attempt.skip_skill': 'Đánh dấu kỹ năng không mock',
  'deadline.override': 'Đặt hạn nhập điểm riêng',
  'attempt.view': 'Xem lịch và kết quả MT',
  'score.edit': 'Nhập điểm kỹ năng được phân công',
  'score.override': 'Nhập bù điểm ngoài phân công',
  'estimate.edit': 'Cập nhật Đánh giá GV',
  'case.view': 'Xem danh sách case học vụ',
  'sos.report': 'Báo vấn đề mới',
  'sos.edit': 'Sửa và xử lý case học vụ (đúng kỹ năng hoặc GVCN)',
  'case.close': 'Đóng case học vụ',
  'case.approve': 'Duyệt phương án hỗ trợ',
  'class.assign': 'Phân công giáo viên vào lớp',
  'class.edit': 'Sửa tiến độ lớp (tuần bắt đầu, tuần kiểm tra)',
  'student.view': 'Xem hồ sơ học viên',
  'student.edit': 'Sửa hồ sơ học viên',
  'meeting.view': 'Xem tiến trình công việc',
  'meeting.edit': 'Cập nhật báo cáo và ghi chú',
  'admin.config': 'Quản trị hệ thống',
};

/** Sự kiện hành trình học viên. Bộ lọc chỉ có 3 lựa chọn, xem JOURNEY_FILTERS. */

// ==================================================================== bộ lọc học viên

/**
 * BỘ LỌC HỌC VIÊN — mục 6 tài liệu chốt vòng 4.
 *
 * Định nghĩa ở ĐÂY, một chỗ duy nhất, vì owner yêu cầu "cách gọi phải giống hệt nhau ở mọi
 * trang". Mỗi trang tự viết lấy nhãn của mình là cách chắc chắn nhất để cùng một việc mang
 * ba cái tên khác nhau ở ba màn hình.
 *
 * `needs` là quyền TỐI THIỂU để bộ lọc có nghĩa với người đang xem. Admin CN vẫn thấy
 * "Cần nhập điểm Test" dù họ không nhập — họ dùng nó để ĐÔN ĐỐC giáo viên (owner xác nhận Q9),
 * nên cờ `readOnly` nói rõ điều đó trên giao diện thay vì giấu bộ lọc đi.
 */
export type StudentFilterKey =
  | 'classes' | 'sos' | 'case_working' | 'case_no_plan' | 'case_overdue'
  | 'my_scores' | 'no_plan';

export const STUDENT_FILTERS: {
  key: StudentFilterKey; label: string; hint: string;
  /** Quyền tối thiểu; `null` = ai xem được lớp thì thấy. */
  needs: string | null;
}[] = [
  { key: 'classes', label: 'Theo lớp', needs: null,
    hint: 'Danh sách lớp trong phạm vi bạn được xem. Mở một lớp để thấy học viên.' },
  { key: 'sos', label: 'SOS', needs: 'case.view',
    hint: 'Học viên đang ở mức SOS 1, 2 hoặc 3 theo lượt MT gần nhất.' },
  { key: 'case_working', label: 'Case đang xử lý', needs: 'case.view',
    hint: 'Case đã có phương án và đang trong thời gian theo dõi.' },
  { key: 'case_no_plan', label: 'Case thiếu phương án', needs: 'case.view',
    hint: 'Case đã mở nhưng chưa ai ghi sẽ làm gì cho em.' },
  { key: 'case_overdue', label: 'Case quá hạn cập nhật', needs: 'case.view',
    hint: 'Đã qua hẹn xem lại mà chưa ai cập nhật kết quả sau hỗ trợ.' },
  { key: 'my_scores', label: 'Cần nhập điểm Test', needs: 'attempt.view',
    hint: 'Lượt MT đã thi mà còn ô điểm để trống.' },
  { key: 'no_plan', label: 'Chưa có tuần MT', needs: 'plan.week',
    hint: 'Học viên chưa được chốt tuần cho lượt MT tiếp theo. Việc của Quản lý.' },
];

/** Bộ lọc nào hiện ra với người mang bộ quyền này. */
export function studentFiltersFor(has: (key: string) => boolean): StudentFilterKey[] {
  return STUDENT_FILTERS
    .filter((f) => !f.needs || has(f.needs))
    .map((f) => f.key);
}

/**
 * HAI PHẠM VI CÔNG VIỆC — đặt tên ở ĐÂY vì cùng lý do với `STUDENT_FILTERS`: chủ sản phẩm
 * yêu cầu "cách gọi phải giống hệt nhau ở mọi trang". Mỗi màn tự viết nhãn của mình là cách
 * chắc chắn nhất để cùng một việc mang hai cái tên.
 *
 * Cố ý để hai vai thấy HAI CON SỐ KHÁC NHAU ở cùng một lớp: GVBM Listening thấy 2, Quản lý
 * thấy 8. Họ hỏi hai câu khác nhau. Vì thế badge BẮT BUỘC ghi kèm phạm vi, không để trơ
 * một con số rồi ai đoán nấy.
 */
export const WORK_SCOPES = ['mine', 'managed'] as const;
export type WorkScope = (typeof WORK_SCOPES)[number];
export const WORK_SCOPE_LABEL: Record<WorkScope, string> = {
  mine: 'Việc của tôi',
  managed: 'Trong phạm vi quản lý',
};
export const WORK_SCOPE_HINT: Record<WorkScope, string> = {
  mine: 'Kỹ năng bạn được phân công dạy.',
  managed: 'Mọi bài chưa chấm trong phạm vi bạn được xem, kèm tên giáo viên phụ trách.',
};
