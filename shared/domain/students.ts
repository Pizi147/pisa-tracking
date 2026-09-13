/** HỌC VIÊN — trạng thái, lộ trình học và các mốc hành trình. */

// ---------------------------------------------------------------- Học viên

/** Chỉ ba trạng thái. LT1/LT2 là lộ trình, không phải trạng thái học viên. */
export const STUDENT_STATUSES = ['active', 'inactive', 'finished'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];
export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  active: 'Đang học', inactive: 'Tạm dừng', finished: 'Đã kết thúc',
};

/** Học viên kết thúc bao lâu thì đưa vào lưu trữ. Mốc chính xác còn chờ chốt — xem O08. */
export const ARCHIVE_AFTER_DAYS = 14;

// ---------------------------------------------------------------- Lộ trình học

/**
 * Một lộ trình (cycle) có target và ngày thi IELTS riêng.
 *
 * Học tiếp / học lại TRONG cùng một lộ trình thì số MT tăng tiếp và target giữ nguyên.
 * Chỉ khi sang lộ trình mới (LT1 → LT2) mới đánh số lại từ MT1, vì lúc đó đã có target mới.
 */
export const ROUTES = ['LT1', 'LT2'] as const;
export type Route = (typeof ROUTES)[number];

export const CYCLE_STATUSES = ['active', 'completed', 'abandoned'] as const;
export type CycleStatus = (typeof CYCLE_STATUSES)[number];
export const CYCLE_STATUS_LABEL: Record<CycleStatus, string> = {
  active: 'Đang học', completed: 'Đã hoàn thành', abandoned: 'Đã dừng',
};

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
  finish: 'Kết thúc học',
  cycle_start: 'Bắt đầu lộ trình',
  repeat: 'Học tiếp lộ trình',
  exam_date_changed: 'Đổi ngày thi IELTS',
  mock_scheduled: 'Lên kế hoạch MT',
  mock_rescheduled: 'Đổi lịch MT',
  mock_cancelled: 'Huỷ lượt MT',
  mock_result: 'Kết quả MT',
  estimate: 'Đánh giá GV',
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
