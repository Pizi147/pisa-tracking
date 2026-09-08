/** Từ vựng nghiệp vụ dùng chung cho API và giao diện. */

export const TEACHING_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'speaking'] as const;
export type TeachingSkill = (typeof TEACHING_SKILLS)[number];

export const TEACHING_SKILL_LABEL: Record<TeachingSkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing1: 'Writing 1',
  writing2: 'Writing 2',
  speaking: 'Speaking',
};

/** Skill của bài thi chính thức — khác với skill giảng dạy. */
export const ASSESSMENT_SKILLS = ['listening', 'reading', 'writing', 'speaking', 'overall'] as const;
export type AssessmentSkill = (typeof ASSESSMENT_SKILLS)[number];

export const ASSESSMENT_SKILL_LABEL: Record<AssessmentSkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  overall: 'Overall',
};

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Đi muộn',
  excused: 'Vắng có phép',
};
/** Giả định demo: Present và Late tính là đã tham dự. Excused hiển thị riêng. */
export const ATTENDED_STATUSES: AttendanceStatus[] = ['present', 'late'];

export const HOMEWORK_STATUSES = ['completed', 'incomplete', 'missing', 'late'] as const;
export type HomeworkStatus = (typeof HOMEWORK_STATUSES)[number];
export const HOMEWORK_LABEL: Record<HomeworkStatus, string> = {
  completed: 'Đã hoàn thành',
  incomplete: 'Làm chưa xong',
  missing: 'Chưa nộp',
  late: 'Nộp muộn',
};

export const TASK_STATUSES = ['not_started', 'in_progress', 'paused', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: 'Chưa bắt đầu',
  in_progress: 'Đang làm',
  paused: 'Tạm dừng',
  completed: 'Hoàn thành',
};

export type DeadlineState = 'overdue' | 'due_soon' | 'on_track' | 'no_deadline' | 'closed';
export const DEADLINE_LABEL: Record<DeadlineState, string> = {
  overdue: 'Quá hạn',
  due_soon: 'Sắp đến hạn',
  on_track: 'Trong hạn',
  no_deadline: 'Chưa có hạn',
  closed: 'Đã đóng',
};

export const ISSUE_STATUSES = ['open', 'discussing', 'in_progress', 'resolved'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  open: 'Mới mở',
  discussing: 'Đang thảo luận',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
};

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export const RISK_LABEL: Record<RiskLevel, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };

export const PRIORITIES = ['low', 'normal', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = { low: 'Thấp', normal: 'Bình thường', high: 'Cao' };

export const BRANCH_REPORT_STATUSES = ['ok', 'watch', 'problem', 'not_reported'] as const;
export type BranchReportStatus = (typeof BRANCH_REPORT_STATUSES)[number];
export const BRANCH_REPORT_STATUS_LABEL: Record<BranchReportStatus, string> = {
  ok: 'Ổn',
  watch: 'Cần theo dõi',
  problem: 'Có vấn đề',
  not_reported: 'Chưa báo cáo',
};

export const ENROLLMENT_STATUSES = ['active', 'paused', 'completed', 'transferred', 'withdrawn'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];
export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  active: 'Đang học',
  paused: 'Tạm dừng',
  completed: 'Đã hoàn thành',
  transferred: 'Đã chuyển lớp',
  withdrawn: 'Đã nghỉ',
};

export const PERMISSIONS = {
  ACADEMIC_VIEW: 'academic.view',
  WEEKLY_EDIT: 'academic.weekly.edit',
  SUMMARY_EDIT: 'academic.summary.edit',
  OFFICIAL_SCORE_EDIT: 'academic.official_score.edit',
  ESTIMATE_EDIT: 'academic.estimate.edit',
  NOTE_INTERNAL_VIEW: 'academic.note_internal.view',
  STUDENT_TRANSFER: 'student.transfer',
  STUDENT_IMPORT: 'student.import',
  CLASS_PROGRESS_EDIT: 'class.progress.edit',
  CLASS_OVERRIDE_EDIT: 'class.override.edit',
  ISSUE_VIEW: 'issue.view',
  ISSUE_MANAGE: 'issue.manage',
  TASK_VIEW: 'task.view',
  TASK_MANAGE: 'task.manage',
  TASK_UPDATE_ASSIGNED: 'task.update_assigned',
  BRANCH_REPORT_VIEW: 'ops.branch_report.view',
  BRANCH_REPORT_MANAGE: 'ops.branch_report.manage',
  MEETING_VIEW: 'ops.meeting.view',
  MEETING_MANAGE: 'ops.meeting.manage',
  ADMIN_CONFIG: 'admin.config',
  ADMIN_USERS: 'admin.users',
  AUDIT_VIEW: 'audit.view',
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABEL: Record<string, string> = {
  'academic.view': 'Xem dữ liệu học vụ',
  'academic.weekly.edit': 'Sửa dữ liệu học tập theo tuần',
  'academic.summary.edit': 'Tổng hợp thái độ / báo cáo tiến độ / ghi nhận cảnh báo',
  'academic.official_score.edit': 'Nhập điểm kiểm tra chính thức',
  'academic.estimate.edit': 'Nhập ước lượng của giáo viên',
  'academic.note_internal.view': 'Xem ghi chú nội bộ của giáo viên',
  'student.transfer': 'Chuyển lớp học viên',
  'student.import': 'Nhập học viên từ Excel/CSV',
  'class.progress.edit': 'Cập nhật tiến độ chương trình thực tế',
  'class.override.edit': 'Điều chỉnh chương trình riêng cho lớp',
  'issue.view': 'Xem vấn đề',
  'issue.manage': 'Tạo và xử lý vấn đề',
  'task.view': 'Xem công việc',
  'task.manage': 'Quản lý công việc',
  'task.update_assigned': 'Cập nhật công việc được giao',
  'ops.branch_report.view': 'Xem báo cáo chi nhánh',
  'ops.branch_report.manage': 'Nhập báo cáo chi nhánh',
  'ops.meeting.view': 'Xem cuộc họp',
  'ops.meeting.manage': 'Quản lý cuộc họp',
  'admin.config': 'Quản trị cấu hình hệ thống',
  'admin.users': 'Quản trị người dùng và phân quyền',
  'audit.view': 'Xem nhật ký thay đổi',
};

export type ScopeType =
  | 'global'
  | 'branch'
  | 'reporting_unit'
  | 'assignment'
  | 'consultant_caseload'
  | 'consultant_team';

export const SCOPE_LABEL: Record<ScopeType, string> = {
  global: 'Toàn hệ thống',
  branch: 'Theo chi nhánh',
  reporting_unit: 'Theo đơn vị báo cáo',
  assignment: 'Theo lớp/skill được phân công',
  consultant_caseload: 'Theo học viên được phân công',
  consultant_team: 'Theo nhóm tư vấn được cấp',
};

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý / Head',
  teacher: 'Giáo viên',
  consultant: 'Tư vấn viên',
  consultant_manager: 'Quản lý tư vấn',
};

export const REPORT_CATEGORY_KEYS = [
  'enrollment_class',
  'teaching_quality',
  'students_parents',
  'teacher_staffing',
  'curriculum',
] as const;
export type ReportCategoryKey = (typeof REPORT_CATEGORY_KEYS)[number];

export const JOURNEY_EVENT_LABEL: Record<string, string> = {
  enrollment_start: 'Bắt đầu học',
  enrollment_end: 'Kết thúc lần học',
  transfer: 'Chuyển lớp',
  pause: 'Tạm dừng',
  resume: 'Quay lại học',
  repeat: 'Học lại',
  assessment: 'Bài kiểm tra',
  estimate: 'Ước lượng của giáo viên',
  progress_report: 'Báo cáo tiến độ',
  warning_reference: 'Ghi nhận cảnh báo',
  incident_reference: 'Ghi nhận sự việc',
  milestone: 'Mốc chương trình',
  note: 'Ghi chú giáo viên',
  exam_date: 'Lịch thi',
  import: 'Nhập dữ liệu',
};

export const ACTIVITY_KINDS = ['joint_class', 'tutor', 'one_to_one'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
  joint_class: 'Học ghép lớp khác',
  tutor: 'Học tutor',
  one_to_one: 'Học 1-1',
};
