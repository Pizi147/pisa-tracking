/** TỔNG QUAN VÀ CÔNG VIỆC — báo cáo đơn vị, loại việc và nhãn thời hạn. */

// ---------------------------------------------------------------- Họp tuần

/** Ba nhóm báo cáo cho chi nhánh (chốt theo DANH MỤC của workbook họp). */
export const BRANCH_REPORT_CATEGORIES = [
  { key: 'teachers', label: 'Giáo viên', hint: 'Thái độ làm việc, chất lượng giảng dạy' },
  // Vấn đề vận hành đến từ cả hai phía, nên một nhóm chung thay vì tách hai module.
  { key: 'students', label: 'Học viên / Phụ huynh', hint: 'Lịch học, thái độ, lực học, phản hồi từ phụ huynh' },
  { key: 'curriculum', label: 'Giáo trình', hint: 'Mức độ phù hợp, đề xuất điều chỉnh' },
] as const;

/** Tutor part-time là đơn vị báo cáo riêng, không phải chi nhánh thứ sáu. */
export const TUTOR_REPORT_CATEGORIES = [
  { key: 'tutor_count', label: 'Số lượng Tutor', hint: '' },
  { key: 'tutor_quality', label: 'Chất lượng dạy học', hint: '' },
  { key: 'tutor_other', label: 'Vấn đề khác', hint: '' },
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

/**
 * BỐN NHÓM CÔNG VIỆC QUẢN LÝ (mục 8.1) — và chỉ bốn.
 *
 * Đây là hạng mục quản lý vận hành, KHÔNG phải một hệ CRM: giới hạn bốn nhóm là để nó không
 * phình thành nơi chứa mọi việc của trung tâm. Việc nào không thuộc bốn nhóm này thì hoặc là
 * một Case của học viên, hoặc là chuyện ngoài phạm vi phần mềm.
 */
export const TASK_GROUPS = ['student_parent', 'curriculum', 'teacher', 'tutor'] as const;
export type TaskGroup = (typeof TASK_GROUPS)[number];
export const TASK_GROUP_LABEL: Record<TaskGroup, string> = {
  student_parent: 'Học viên / Phụ huynh',
  curriculum: 'Giáo trình',
  teacher: 'Giáo viên',
  tutor: 'Tutor',
};

/**
 * NĂM TRẠNG THÁI CÔNG VIỆC (mục 8.5).
 *
 * `paused` và `stopped` là hai chuyện KHÁC HẲN nhau, và gộp lại là mất thông tin:
 *   · TẠM NGƯNG — còn sống, tiếp tục được bất kỳ lúc nào, chỉ là bây giờ chưa làm
 *   · DỪNG HẲN  — đã quyết định không làm nữa
 *
 * Cả hai đều BẮT BUỘC ghi lý do: một việc tự nhiên im lặng mà không ai biết vì sao là thứ
 * ba tháng sau không ai giải thích được.
 */
export const TASK_PROGRESS = ['not_started', 'doing', 'done', 'paused', 'stopped'] as const;
export type TaskProgress = (typeof TASK_PROGRESS)[number];
export const TASK_PROGRESS_LABEL: Record<TaskProgress, string> = {
  not_started: 'Chưa bắt đầu',
  doing: 'Đang xử lý',
  done: 'Xong',
  paused: 'Tạm ngưng',
  stopped: 'Dừng hẳn',
};
/** Hai trạng thái này bắt buộc có lý do — xem giải thích ở trên. */
export const TASK_PROGRESS_NEEDS_REASON: TaskProgress[] = ['paused', 'stopped'];
/** Việc đã khép lại: không còn nhắc cập nhật, nhưng vẫn tra cứu được. */
export const TASK_PROGRESS_CLOSED: TaskProgress[] = ['done', 'stopped'];

export type DueState = 'overdue' | 'due_soon' | 'on_track' | 'no_due' | 'closed';
export const DUE_LABEL: Record<DueState, string> = {
  overdue: 'Quá hạn', due_soon: 'Sắp đến hạn', on_track: 'Trong hạn',
  no_due: 'Chưa có hạn', closed: 'Đã đóng',
};
