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
/** #9: mã lộ trình ngắn trên bảng / dòng em ("RF", "LT2"; mã KHAC ghi "Khác"). */
export const maLoTrinhNgan = (route: string): string => (route === ROUTE_KHAC ? ROUTE_NAME.KHAC : route);
/** Lộ trình mở được ở Bước tiếp › Lộ trình mới (thứ tự nút). */
export const ROUTE_LO_TRINH_MOI = ['LT1', 'LT2', 'RF', 'KHAC'] as const;
/** Lộ trình gợi ý ở panel Lộ trình mới: LT1 xong → LT2; còn lại giữ lộ trình cũ (không có → LT1). */
export const routeGoiYLoTrinhMoi = (cu: string | null | undefined): string => (cu === 'LT1' ? 'LT2' : cu && (ROUTE_LO_TRINH_MOI as readonly string[]).includes(cu) ? cu : 'LT1');
/**
 * P7 (N12): lớp đích của Lộ trình mới phải là lớp FT. LO-TRINH-THEO-HV (chủ SP 11/11): lộ trình theo EM — LT1 / LT2 / RF / Khác học được ở
 * lớp FT bất kỳ (em RF trong lớp LT và ngược lại). Sai → câu lỗi (web báo sớm + làm mờ, máy chủ 400 cùng câu).
 */
export function kiemLopLoTrinhMoi(route: string, lop: { code: string; ft: boolean; route?: string | null }): string | null {
  return lop.ft ? null : `${lop.code} là lớp thường — lộ trình ${route === ROUTE_KHAC ? 'Khác' : route} cần lớp FT. Chọn "Lớp khác".`;
}
/** Lớp đích của ô "Lớp khác" (Lộ trình mới) — cùng dạng `/students/:id/hoc-lai/lop-dich`. */
export type LopLoTrinhMoi = { id: number; code: string; ft: boolean; route: string | null; branchCode: string; siSo?: number | null };
/**
 * SUA-NHO-UI U4 (mockup v6 lo-trinh-moi khung 1–2): danh sách ô "Lớp khác" — lớp thường không bao giờ hiện. LO-TRINH-THEO-HV: mọi lớp FT chọn được;
 * lớp cùng loại lộ trình (RF ↔ lớp RF, LT ↔ lớp LT) lên trước, giữ thứ tự vào.
 */
export function lopChonLoTrinhMoi(route: string, lop: readonly LopLoTrinhMoi[]): { id: number; ma: string; phu: string; tat?: string }[] {
  const ft = lop.filter((l) => l.ft);
  const cungLoai = (l: LopLoTrinhMoi) => (l.route === 'RF') === (route === 'RF');
  return [...ft.filter(cungLoai), ...ft.filter((l) => !cungLoai(l))]
    .map((l) => ({ id: l.id, ma: l.code, phu: [`FT ${l.route ?? ''}`.trim(), l.branchCode, l.siSo != null ? t('{n} em', { n: l.siSo }) : null].filter(Boolean).join(' · ') }));
}
/** Tên hiển thị của mã lộ trình: "Khác" → tên đã ghi (không có thì "Khác"); mã khác giữ nguyên ("LT2"). */
export const tenRoute = (c: { route?: string | null; route_ten?: string | null; routeTen?: string | null }): string | null =>
  c.route === ROUTE_KHAC ? (c.route_ten ?? c.routeTen ?? '').trim() || t('Khác') : c.route ?? null;

export const CYCLE_STATUSES = ['active', 'completed', 'abandoned'] as const;





/** Nhóm sự kiện theo bộ lọc — giữ đúng ba lựa chọn đã chốt. */
export const JOURNEY_GROUP: Record<string, 'assessment' | 'warning' | 'other'> = {
  mock_result: 'assessment',
  estimate: 'assessment',
  warning: 'warning',
  wl: 'warning',
};
