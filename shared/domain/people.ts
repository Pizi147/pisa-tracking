import { t } from '../i18n/index.ts';
/** CON NGƯỜI — vai trò, quyền và bộ lọc học viên theo vai. */

// ---------------------------------------------------------------- Quyền

/*
 * SÁU nhóm tài khoản giao được.
 *
 * `system_admin` là người quản trị PHẦN MỀM (tài khoản, vai trò, cấu hình) — giữ nguyên.
 * `manager` điều hành chuyên môn của chi nhánh. `teacher` là GVCN và/hoặc GVBM.
 * PR-OV2a (đặc tả OV mục 2): `office_admin` = "Admin" lo Mock Test của chi nhánh (xếp/dời lịch, sửa điểm có lý do; KHÔNG huỷ /
 * khôi phục lượt, không Target, không lộ trình) · `consultant` = Tư vấn viên (xem HV chi nhánh, mặc định "HV của tôi") · `cx` = CX
 * (như TVV nhưng mọi chi nhánh, không phần giáo viên). TVV, CX, Admin chỉ sửa được THÔNG TIN HV (`student.edit_info`).
 *
 * Vai "Admin" mới KHÁC vai `branch_admin` cũ (Admin chi nhánh, đã bỏ sau PR15 — từng huỷ lượt MT, bỏ kỹ năng, đặt hạn nhập điểm):
 * mã cũ giữ để đọc lịch sử, không dùng lại.
 */
export const ROLES = ['system_admin', 'manager', 'teacher', 'office_admin', 'consultant', 'cx'] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  system_admin: t('Quản trị hệ thống'), manager: t('Quản lý'), teacher: t('Giáo viên'),
  office_admin: 'Admin', consultant: t('Tư vấn viên'), cx: 'CX',
};
/** PR-OV2a: câu 403 khi Admin / TVV / CX gửi trường ngoài "thông tin HV". */
export const CHI_SUA_THONG_TIN = 'Bạn chỉ sửa được thông tin học viên: họ tên, ngày sinh, email, TVV, liên hệ, dự kiến thi, điểm đầu vào.';
/** Vai đổi được góc nhìn (đặc tả OV mục 2): QL hoặc Quản trị nắm từ hai vai trở lên. */
export function coTheDoiGocNhin(roleKeys: readonly string[]): boolean {
  return roleKeys.length >= 2 && roleKeys.some((k) => k === 'manager' || k === 'system_admin');
}

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
   * mở cho GVCN (lớp thường mình chủ nhiệm) và GVBM (đúng môn mình dạy, lớp thường) — xem
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
   * gọi phụ huynh) nhưng KHÔNG có bốn bộ lọc Case — hồ sơ chuyên môn của từng em không phải
   * việc của văn phòng. Gộp hai quyền làm một thì không thể nói được câu đó.
   */
  CASE_VIEW: 'case.view',
  /**
   * BÁO MỘT VẤN ĐỀ MỚI (AUTH-01) — tách khỏi `SOS_EDIT`. Bất kỳ giáo viên nào có phân công
   * trong lớp đều báo được, kể cả trái môn: sổ §13.12 nói rõ "GV trong lớp có thể báo vấn
   * đề". Báo được KHÔNG có nghĩa được sửa/xử lý — đó là `SOS_EDIT`, siết theo đúng kỹ năng
   * (Học thuật) hoặc GVCN (Ý thức). Gộp chung hai quyền là đúng lỗ hổng AUTH-01: GV Listening
   * "báo được" thì cũng "sửa được" Case Reading trái môn.
   */
  SOS_REPORT: 'sos.report',
  /** Sửa/xử lý một Case ĐÃ CÓ — đúng kỹ năng mình dạy (Học thuật) hoặc GVCN (Ý thức). */
  SOS_EDIT: 'sos.edit',
  /**
   * Hoàn thành (đóng) một Case. Quản lý / Quản trị: mọi Case trong phạm vi. Giáo viên (PR-QU, chủ sản phẩm 04/10): Case học thuật
   * thì GV dạy ĐÚNG kỹ năng đó ở lớp của em (GVCN cũng chỉ khi chính mình dạy kỹ năng đó — C02); Case Ý thức (không kỹ năng) thì
   * GVCN lớp em đang học. Siết ở `teacherAllows`; GV đóng xong thì báo Quản lý chi nhánh.
   */
  CASE_CLOSE: 'case.close',
  /** Duyệt phương án hỗ trợ giáo viên đề xuất. Chỉ Quản lý và Quản trị hệ thống. */
  CASE_APPROVE: 'case.approve',
  /** Phân công giáo viên dạy kỹ năng nào ở lớp nào. */
  CLASS_ASSIGN: 'class.assign',
  /**
   * PR-QU (B): TẠO LỚP — tách khỏi `student.edit`. Quản lý và Quản trị hệ thống có mặc định; cấp riêng được theo người và chi nhánh.
   */
  CLASS_CREATE: 'class.create',
  /**
   * PR-QU (A): GVCN phân công GV BỘ MÔN (L/R/W/S) cho lớp mình chủ nhiệm — KHÔNG đổi ô GVCN. Quyền SUY RA (GV có `is_core=1` ở lớp
   * đó), không cấp theo vai, không cấp riêng — xem `can` ở `server/src/permissions.ts` và `QUYEN_CHI_SUY_RA` ở `nhomQuyen.ts`.
   */
  CLASS_ASSIGN_SUBJECT: 'class.assign_subject',
  /**
   * Sửa TIẾN ĐỘ của lớp: tuần bắt đầu, tuần Progress Test, tuần Final Test.
   *
   * Tách khỏi `class.assign` vì hai việc khác hẳn nhau: phân công là chuyện nhân sự, tiến độ
   * là chuyện lịch học của cả lớp. Owner giao cho Admin CN và Quản lý CN (mục 7.6).
   */
  CLASS_EDIT: 'class.edit',

  // --- Ý thức: vi phạm và biện pháp xử lý (PR-J, thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md mục 6) ---
  /**
   * GHI VI PHẠM (V01) — MỌI giáo viên có phân công dạy lớp đó, kể cả trái môn: cô dạy Writing thấy em đi muộn thì ghi được nhóm
   * Chuyên cần. C02 KHÔNG áp cho Ý thức: C02 là luật của Case học thuật, vi phạm không thuộc kỹ năng nào.
   */
  VIOLATION_RECORD: 'violation.record',
  /**
   * XỬ LÝ Ý THỨC — sửa/hủy vi phạm của NGƯỜI KHÁC, và tạo · sửa · xác nhận · xóa biện pháp (V10, B01). Giáo viên chỉ có khi là
   * GVCN của chính lớp đó; GVBM đọc được nhưng không tạo biện pháp. Không có cửa Quản lý duyệt (Y01).
   */
  DISCIPLINE_MANAGE: 'discipline.manage',
  /** Xem thống kê Ý thức cả chi nhánh — chỉ Quản lý và Quản trị. GVBM và GVCN xem trong phạm vi lớp qua bảng của lớp. */
  DISCIPLINE_STATS: 'discipline.stats',

  // --- Hồ sơ và vận hành ---
  STUDENT_VIEW: 'student.view',
  STUDENT_EDIT: 'student.edit',
  /** PR-OV2a: sửa THÔNG TIN HV — họ tên, ngày sinh, email, TVV, dự kiến thi, điểm đầu vào. Không ghi chú, không lộ trình, không chuyển lớp. */
  STUDENT_EDIT_INFO: 'student.edit_info',
  /**
   * PR-OV8b (chủ SP 13/10): phần thông tin HV còn lại của TVV / CX — Target (sửa thẳng, có lý do), ghi chú, Tạm dừng / Quay lại học / Thôi học
   * (+ Hoàn tác), kết quả thi thật. Quyền HẸP: không mở `student.edit` / `cycle.edit` (lộ trình tiếp theo, chuyển lớp, lưu trữ, học lại).
   */
  STUDENT_EDIT_MORE: 'student.edit_more',
  /** PR-OV2a: vào Test (Lịch Test, Điểm theo lớp, Kế hoạch Test). Xem điểm trong hồ sơ vẫn là `attempt.view`. */
  TEST_VIEW: 'test.view',
  /** PR-OV2a: vào Công việc. */
  WORK_VIEW: 'work.view',
  /** PR-OV2a: Tổng quan số liệu + Phân tích (trước đây đi chung `meeting.view`). */
  ANALYSIS_VIEW: 'analysis.view',
  /** PR-OV2a: phần giáo viên — Phân tích › Theo giáo viên, hồ sơ giáo viên của người khác. CX không có. */
  ANALYSIS_VIEW_TEACHER: 'analysis.view_teacher',
  MEETING_VIEW: 'meeting.view',
  MEETING_EDIT: 'meeting.edit',
  ADMIN_CONFIG: 'admin.config',

  // --- PR-DUYET ---
  /** Duyệt thẻ trong hộp Chờ duyệt — Quản lý (chi nhánh mình) và Quản trị. GVCN không bao giờ duyệt (T69). */
  REQUEST_APPROVE: 'request.approve',
  /** Sửa target, lộ trình của học viên (T44). GVCN gửi "Đề xuất sửa" thay vì tự sửa. Chuyển lớp vẫn `student.edit` (Câu 1 = B). */
  CYCLE_EDIT: 'cycle.edit',
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABEL: Record<string, string> = {
  'plan.week': 'Chốt tuần MT',
  'schedule.move': 'Dời lịch thi (lớp thường, đúng phần phụ trách)',
  'attempt.cancel': 'Huỷ cả lượt MT',
  'attempt.skip_skill': 'Đánh dấu kỹ năng không mock',
  'deadline.override': 'Đặt hạn nhập điểm riêng',
  'attempt.view': 'Xem lịch và kết quả MT',
  'score.edit': 'Nhập điểm kỹ năng được phân công',
  'score.override': 'Nhập bù điểm ngoài phân công',
  'estimate.edit': 'Cập nhật Đánh giá GV',
  'case.view': 'Xem danh sách Case học vụ',
  'sos.report': 'Báo vấn đề mới',
  'sos.edit': 'Sửa và xử lý Case học vụ (đúng kỹ năng hoặc GVCN)',
  'case.close': 'Đóng Case học vụ',
  'case.approve': 'Duyệt phương án học thuật',
  'class.assign': 'Phân công giáo viên vào lớp',
  'class.create': 'Tạo lớp',
  'class.assign_subject': 'Phân công GV bộ môn lớp mình chủ nhiệm',
  'class.edit': 'Sửa tiến độ lớp (tuần bắt đầu, tuần kiểm tra)',
  'violation.record': 'Ghi vi phạm của học viên trong lớp mình dạy',
  'discipline.manage': 'Xử lý Ý thức: sửa vi phạm của người khác, tạo và xác nhận lần xử lý',
  'discipline.stats': 'Xem thống kê Ý thức cả chi nhánh',
  'student.view': 'Xem hồ sơ học viên',
  'student.edit': 'Sửa hồ sơ học viên',
  'student.edit_info': 'Sửa thông tin học viên',
  'student.edit_more': 'Sửa Target, ghi chú, trạng thái học và kết quả thi thật của học viên',
  'test.view': 'Vào Test',
  'work.view': 'Vào Công việc',
  'analysis.view': 'Xem Tổng quan số liệu và Phân tích',
  'analysis.view_teacher': 'Xem phần giáo viên (Phân tích theo GV, hồ sơ GV)',
  'meeting.view': 'Xem tiến trình công việc',
  'meeting.edit': 'Cập nhật báo cáo và ghi chú',
  'admin.config': 'Quản trị hệ thống',
  'request.approve': 'Duyệt yêu cầu trong hộp Chờ duyệt',
  'cycle.edit': 'Sửa Target, lộ trình học viên',
};

/**
 * OV-11b (QT-6): chip "Phạm vi được cấp" — menu Tài khoản và Hồ sơ cá nhân dùng chung. Quyền cấp riêng (grant `granted`, máy chủ
 * `permissions.ts` gộp vào `grants`) → "Cấp riêng: {tên quyền} · {phạm vi}"; vai → "{vai} · {phạm vi}".
 */
export function nhanPhamVi(g: { role: string; permissions: readonly string[]; branchName: string | null }): string {
  const phamVi = g.branchName ?? t('Toàn hệ thống');
  if (g.role !== 'granted') return `${roleLabel(g.role)} · ${phamVi}`;
  return t('Cấp riêng: {quyen} · {phamVi}', { quyen: g.permissions.map((k) => PERMISSION_LABEL[k] ?? k).join(', '), phamVi });
}

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
  { key: 'case_no_plan', label: 'Case chưa có PA', needs: 'case.view',
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
/** Tên hai phạm vi trong ô chọn `Người phụ trách` (TU_DIEN_VA_CHU §2). */
export const WORK_SCOPE_LABEL: Record<WorkScope, string> = {
  mine: 'Tôi',
  managed: 'Tất cả trong phạm vi',
};

/**
 * BADGE ĐẾM NÓI RÕ ĐẾM CỦA AI (TU_DIEN_VA_CHU §2, RB 17.4). Cùng một lớp: GV chỉ thấy phần mình phải làm, Quản lý thấy cả
 * lớp — hai con số khác nhau cho hai câu hỏi khác nhau, nên chữ phải khác. Không bao giờ vừa nói "cả lớp" vừa dẫn tới việc riêng.
 */
export function needScoresText(scope: WorkScope | null, n: number): string {
  return scope === 'mine' ? `Cần chấm: ${n} bài` : `Lớp còn ${n} bài chưa nhập điểm`;
}
export const WORK_SCOPE_HINT: Record<WorkScope, string> = {
  mine: 'Kỹ năng bạn được phân công dạy.',
  managed: 'Mọi bài chưa chấm trong phạm vi bạn được xem, kèm tên giáo viên phụ trách.',
};
