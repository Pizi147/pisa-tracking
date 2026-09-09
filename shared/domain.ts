/** Từ vựng nghiệp vụ dùng chung cho API và giao diện. */

// ---------------------------------------------------------------- Kỹ năng

/** Kỹ năng NHẬP ĐIỂM. Writing tách W1/W2 vì giáo viên được phân công riêng từng task. */
export const ENTRY_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'speaking'] as const;
export type EntrySkill = (typeof ENTRY_SKILLS)[number];

export const ENTRY_SKILL_LABEL: Record<EntrySkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing1: 'Writing Task 1',
  writing2: 'Writing Task 2',
  speaking: 'Speaking',
};
export const ENTRY_SKILL_SHORT: Record<EntrySkill, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S',
};

/** Kỹ năng ĐÁNH GIÁ dùng để xét kỳ vọng và SOS. Writing gộp từ W1 + W2. */
export const ASSESSED_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
export type AssessedSkill = (typeof ASSESSED_SKILLS)[number];

export const ASSESSED_SKILL_LABEL: Record<AssessedSkill, string> = {
  listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
};

/** Kỹ năng nhập bằng số câu đúng 0–40; các kỹ năng còn lại nhập theo 4 tiêu chí. */
export const RAW_SCORE_SKILLS: EntrySkill[] = ['listening', 'reading'];
export const CRITERIA_SKILLS: EntrySkill[] = ['writing1', 'writing2', 'speaking'];

/** Bốn tiêu chí IELTS theo từng kỹ năng. */
export const CRITERIA: Record<'writing' | 'speaking', [string, string, string, string]> = {
  writing: ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  speaking: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'],
};
export const CRITERIA_SHORT: Record<'writing' | 'speaking', [string, string, string, string]> = {
  writing: ['TA', 'CC', 'LR', 'GRA'],
  speaking: ['FC', 'LR', 'GRA', 'P'],
};

export function criteriaSetFor(skill: EntrySkill): 'writing' | 'speaking' | null {
  if (skill === 'writing1' || skill === 'writing2') return 'writing';
  if (skill === 'speaking') return 'speaking';
  return null;
}

// ---------------------------------------------------------------- Mock Test

export const MOCK_ATTEMPTS = [1, 2, 3, 4, 5] as const;
export const mockLabel = (n: number) => `MT${n}`;

/** Kỳ vọng = điểm cam kết − mức trừ theo lần MT (nguồn: Quy trình SOS mục 3). */
export const EXPECTATION_DELTA: Record<number, number> = { 1: 1.0, 2: 0.5, 3: 0, 4: 0, 5: 0 };
/** Tuần học FT dự kiến của từng lần Mock, dùng để gợi ý khi lập lịch. */
export const MOCK_FT_WEEK: Record<number, number> = { 1: 6, 2: 12, 3: 16, 4: 20, 5: 24 };

export const MOCK_STATUSES = ['planned', 'completed', 'cancelled'] as const;
export type MockStatus = (typeof MOCK_STATUSES)[number];
export const MOCK_STATUS_LABEL: Record<MockStatus, string> = {
  planned: 'Đã lên lịch', completed: 'Đã thi', cancelled: 'Đã huỷ',
};

export type SosLevel = 0 | 1 | 2 | 3;
export const SOS_LABEL: Record<SosLevel, string> = {
  0: 'Đạt kỳ vọng', 1: 'SOS 1', 2: 'SOS 2', 3: 'SOS 3',
};

export const ROUTES = ['LT1', 'LT2'] as const;
export type Route = (typeof ROUTES)[number];

// ---------------------------------------------------------------- Xử lý SOS

export const ACADEMIC_SUPPORTS = [
  'Xếp tự học 1 tháng',
  'Học tutor đến lần mock sau',
  'Học tutor đến lúc thi',
  'Đề xuất lùi lịch thi',
  'Khác',
] as const;

export const OPS_POLICIES = [
  'Buổi bổ trợ với tutor',
  'Buổi bổ trợ với GV fulltime',
  'Tặng thêm mock test',
  'Khác',
] as const;

export const MEETING_KINDS = ['Không cần', 'GVCN meeting HS', 'CX / GĐCN meeting HS'] as const;

export const CASE_STATUSES = ['open', 'in_progress', 'done'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];
export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Chưa xử lý', in_progress: 'Đang xử lý', done: 'Đã xong',
};

// ---------------------------------------------------------------- Họp tuần

/** Ba nhóm báo cáo cho chi nhánh (chốt theo DANH MỤC của workbook họp). */
export const BRANCH_REPORT_CATEGORIES = [
  { key: 'teachers', label: 'Giáo viên', hint: 'Thái độ làm việc, chất lượng giảng dạy' },
  { key: 'students', label: 'Học sinh', hint: 'Lịch học, thái độ, lực học' },
  { key: 'curriculum', label: 'Giáo trình', hint: 'Mức độ phù hợp, đề xuất điều chỉnh' },
] as const;

/** Tutor part-time là đơn vị báo cáo riêng, không phải chi nhánh thứ sáu. */
export const TUTOR_REPORT_CATEGORIES = [
  { key: 'tutor_count', label: 'Số lượng tutor', hint: '' },
  { key: 'tutor_quality', label: 'Chất lượng dạy học', hint: '' },
  { key: 'tutor_other', label: 'Các vấn đề khác', hint: '' },
] as const;

export const UNIT_STATUSES = ['ok', 'watch', 'problem'] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];
export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = {
  ok: 'Ổn', watch: 'Cần theo dõi', problem: 'Có vấn đề',
};

export const TASK_TYPES = ['in_period', 'long_term'] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  in_period: 'Trong kỳ', long_term: 'Dài hạn',
};

export const TASK_PROGRESS = ['not_started', 'doing', 'done', 'paused'] as const;
export type TaskProgress = (typeof TASK_PROGRESS)[number];
export const TASK_PROGRESS_LABEL: Record<TaskProgress, string> = {
  not_started: 'Chưa bắt đầu', doing: 'Đang làm', done: 'Hoàn thành', paused: 'Tạm dừng',
};

export type DueState = 'overdue' | 'due_soon' | 'on_track' | 'no_due' | 'closed';
export const DUE_LABEL: Record<DueState, string> = {
  overdue: 'Quá hạn', due_soon: 'Sắp đến hạn', on_track: 'Trong hạn',
  no_due: 'Chưa có hạn', closed: 'Đã đóng',
};

// ---------------------------------------------------------------- Quyền

/*
 * Bốn nhóm tài khoản.
 *
 * `system_admin` là người quản trị PHẦN MỀM (tài khoản, vai trò, cấu hình).
 * `branch_admin` là nhân sự VĂN PHÒNG của chi nhánh: quản danh sách lớp, giáo viên và
 * tổng hợp việc trung gian giữa các phòng ban. Hai vai trò này khác hẳn nhau nên không
 * dùng chung chữ "Admin" trong nhãn hiển thị.
 */
export const ROLES = ['system_admin', 'branch_admin', 'manager', 'teacher'] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  system_admin: 'Quản trị hệ thống', branch_admin: 'Admin chi nhánh',
  manager: 'Quản lý', teacher: 'Giáo viên',
};

export const PERMISSIONS = {
  MOCK_VIEW: 'mock.view',
  MOCK_SCHEDULE: 'mock.schedule',     // lập và dời lịch
  MOCK_CANCEL: 'mock.cancel',
  SCORE_EDIT: 'score.edit',           // nhập điểm — còn phải khớp phân công kỹ năng
  SOS_EDIT: 'sos.edit',               // ghi nhận xử lý sau Mock
  SOS_CONFIRM: 'sos.confirm',         // Head xác nhận — Head chính là Quản lý
  STUDENT_VIEW: 'student.view',
  STUDENT_EDIT: 'student.edit',
  MEETING_VIEW: 'meeting.view',
  MEETING_EDIT: 'meeting.edit',
  ADMIN_CONFIG: 'admin.config',
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABEL: Record<string, string> = {
  'mock.view': 'Xem lịch và kết quả Mock',
  'mock.schedule': 'Lập và dời lịch Mock',
  'mock.cancel': 'Huỷ lịch Mock',
  'score.edit': 'Nhập điểm Mock',
  'sos.edit': 'Ghi nhận xử lý sau Mock',
  'sos.confirm': 'Xác nhận case (Head)',
  'student.view': 'Xem hồ sơ học viên',
  'student.edit': 'Sửa hồ sơ học viên',
  'meeting.view': 'Xem họp tuần',
  'meeting.edit': 'Cập nhật báo cáo và công việc',
  'admin.config': 'Quản trị hệ thống',
};

/** Sự kiện hành trình học viên. Bộ lọc chỉ có 3 lựa chọn, xem JOURNEY_FILTERS. */
export const JOURNEY_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'warning', label: 'Warning / WL' },
] as const;

export const JOURNEY_EVENT_LABEL: Record<string, string> = {
  enrollment: 'Vào lớp',
  transfer: 'Chuyển lớp',
  pause: 'Tạm dừng học',
  resume: 'Quay lại học',
  mock_scheduled: 'Lên lịch Mock',
  mock_rescheduled: 'Dời lịch Mock',
  mock_cancelled: 'Huỷ Mock',
  mock_result: 'Kết quả Mock',
  estimate: 'Ước lượng giáo viên',
  warning: 'Cảnh báo',
  wl: 'Warning Letter',
};

/** Nhóm sự kiện theo bộ lọc — giữ đúng ba lựa chọn đã chốt. */
export const JOURNEY_GROUP: Record<string, 'assessment' | 'warning' | 'other'> = {
  mock_result: 'assessment',
  estimate: 'assessment',
  warning: 'warning',
  wl: 'warning',
};
