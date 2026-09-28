/** HỌC VIÊN — trạng thái, lộ trình học và các mốc hành trình. */

// ---------------------------------------------------------------- Học viên

/** Chỉ ba trạng thái. LT1/LT2 là lộ trình, không phải trạng thái học viên. */
export const STUDENT_STATUSES = ['active', 'inactive', 'finished'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];
export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  active: 'Đang học', inactive: 'Tạm dừng', finished: 'Đã kết thúc',
};

/**
 * LÝ DO CHUYỂN LỚP — chọn nhanh, BẮT BUỘC (RB-3, rule book §10, quyết định 4.16; đặc tả §3.9 mục 3).
 * Lưu thành chữ vào `enrollments.end_reason` và hành trình. "Khác" phải ghi rõ.
 */
export const TRANSFER_REASONS = ['doi_chi_nhanh', 'doi_lich_hoc', 'xep_lai_trinh_do', 'khac'] as const;
export type TransferReason = (typeof TRANSFER_REASONS)[number];
export const TRANSFER_REASON_LABEL: Record<TransferReason, string> = {
  doi_chi_nhanh: 'Đổi chi nhánh', doi_lich_hoc: 'Đổi lịch học', xep_lai_trinh_do: 'Xếp lại trình độ', khac: 'Khác',
};
/** Lựa chọn rõ ràng khi không có gì cần dặn người nhận lớp (rule book §10). */
export const NO_HANDOVER_NOTE = 'Không có lưu ý';

/** Chữ lý do từ mã + ghi chú. `null` khi mã không hợp lệ hoặc "Khác" mà không ghi gì. */
export function transferReasonText(code: unknown, note?: unknown): string | null {
  if (!(TRANSFER_REASONS as readonly string[]).includes(String(code))) return null;
  const extra = String(note ?? '').trim();
  if (code === 'khac' && !extra) return null;
  const label = TRANSFER_REASON_LABEL[code as TransferReason];
  return extra ? `${label} — ${extra}` : label;
}

// ---------------------------------------------------------------- Lộ trình học

/**
 * Một lộ trình (cycle) có target và ngày thi IELTS riêng.
 *
 * Học tiếp / học lại TRONG cùng một lộ trình thì số MT tăng tiếp và target giữ nguyên.
 * Chỉ khi sang lộ trình mới (LT1 → LT2) mới đánh số lại từ MT1, vì lúc đó đã có target mới.
 */
export const ROUTES = ['LT1', 'LT2', 'RF'] as const;
export type Route = (typeof ROUTES)[number];
export const ROUTE_NAME: Record<Route, string> = { LT1: 'Lộ trình 1', LT2: 'Lộ trình 2', RF: 'Refire' };

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
  /* Kỳ thi IELTS THẬT — khác hẳn một lượt Mock Test, nên có nhãn riêng. */
  exam_result: 'Kết quả thi IELTS',
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
