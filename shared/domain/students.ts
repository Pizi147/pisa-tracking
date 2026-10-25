/** HỌC VIÊN — trạng thái, lộ trình học và các mốc hành trình. */
import { t } from '../i18n/index.ts';

// ---------------------------------------------------------------- Học viên

/** Chỉ ba trạng thái. LT1/LT2 là lộ trình, không phải trạng thái học viên. */
export const STUDENT_STATUSES = ['active', 'inactive', 'finished'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];
/** "Tạm dừng học từ 12/10" (chỗ rộng) · "Tạm dừng từ 12/10" (chip hẹp). */
export const chuTamDung = (tu: string, hep = false) => (hep ? t('Tạm dừng từ {tu}', { tu }) : t('Tạm dừng học từ {tu}', { tu }));

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  active: t('Đang học'), inactive: t('Tạm dừng học'), finished: t('Đã kết thúc'),
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
export const ROUTES = ['LT1', 'LT2', 'RF', 'KHAC'] as const;
export type Route = (typeof ROUTES)[number];
export const ROUTE_NAME: Record<Route, string> = { LT1: t('Lộ trình 1'), LT2: t('Lộ trình 2'), RF: 'Refire', KHAC: t('Khác') };
/** P7 (N12, Q3): lộ trình "Khác" — chỉ của lộ trình (`learning_cycles.route`), không mở lớp; tên do người dùng ghi (`route_ten`), 0 MT, Target tuỳ chọn. */
export const ROUTE_KHAC = 'KHAC';
/** Lộ trình mở được ở Bước tiếp › Lộ trình mới (thứ tự nút). */
export const ROUTE_LO_TRINH_MOI = ['LT1', 'LT2', 'RF', 'KHAC'] as const;
/** Lộ trình gợi ý ở panel Lộ trình mới: LT1 xong → LT2; còn lại giữ lộ trình cũ (không có → LT1). */
export const routeGoiYLoTrinhMoi = (cu: string | null | undefined): string => (cu === 'LT1' ? 'LT2' : cu && (ROUTE_LO_TRINH_MOI as readonly string[]).includes(cu) ? cu : 'LT1');
/** P7 (N12): lớp đích hợp loại lộ trình — LT1 / LT2 → lớp FT lộ trình LT; RF → lớp RF; Khác → lớp FT bất kỳ. Sai → câu lỗi (web báo sớm + làm mờ, máy chủ 400 cùng câu). */
export function kiemLopLoTrinhMoi(route: string, lop: { code: string; ft: boolean; route?: string | null }): string | null {
  const loai = !lop.ft ? 'thường' : lop.route === 'RF' ? 'RF' : 'LT';
  if (route === ROUTE_KHAC) return lop.ft ? null : `${lop.code} là lớp thường — lộ trình Khác cần lớp FT. Chọn "Lớp khác".`;
  const can = route === 'RF' ? 'RF' : 'LT';
  return loai === can ? null : `${lop.code} là lớp ${loai} — lộ trình ${route} cần lớp ${can}. Chọn "Lớp khác".`;
}
/** Tên hiển thị của mã lộ trình: "Khác" → tên đã ghi (không có thì "Khác"); mã khác giữ nguyên ("LT2"). */
export const tenRoute = (c: { route?: string | null; route_ten?: string | null; routeTen?: string | null }): string | null =>
  c.route === ROUTE_KHAC ? (c.route_ten ?? c.routeTen ?? '').trim() || t('Khác') : c.route ?? null;

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
  handover: 'Bàn giao',   // PR-CT: GVCN xác nhận bàn giao (mở lại phiếu từ Hành trình)
  pause: 'Tạm dừng học',
  resume: 'Quay lại học',
  finish: 'Kết thúc học',
  cycle_start: 'Bắt đầu lộ trình',
  repeat: 'Học tiếp lộ trình',
  exam_date_changed: 'Đổi ngày thi IELTS',
  mock_scheduled: 'Lên kế hoạch MT',
  mock_rescheduled: 'Đổi lịch MT',
  mock_cancelled: 'Huỷ cả lượt MT',
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
