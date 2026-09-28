/**
 * SOS TỰ TẠO CASE · PHỐI HỢP SOS (rulebook v3, chốt tối 21/09/2026).
 *
 * Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md` mục 3–5. Luật: rule book mục 19.
 *
 * File này chỉ có BẢNG TRA và LUẬT THUẦN (không đụng database) để máy chủ và giao diện đọc cùng một nơi. Hai bảng tra là hai
 * MẢNG DỮ LIỆU — không phải chuỗi `if` rải rác — nên đổi luật là đổi một dòng ở đây, và phép kiểm đọc đúng bảng đó.
 *
 * SOS Event KHÔNG có bảng riêng: nó là chính lượt Mock Test Fast Track (`assessment_attempts`) có `sos_level ≥ 1` (đặc tả §2).
 * Lớp Normal không có gì trong file này (Q-V3-1): Normal giữ mô hình tín hiệu cũ.
 */
import type { InterventionKind } from './cases.ts';

function addDaysIso(date: string, n: number): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Chủ nhật của tuần (T2→CN) chứa ngày này — chính ngày đó nếu là Chủ nhật. PR-N1: trước đây mượn `weeklyUpdateDue`, nhưng hạn
 * ghi kết quả tuần đã sang Thứ Hai (R-PA1) còn "dự kiến kết thúc 1 tháng" vẫn là Chủ nhật — nên tách riêng, kết quả không đổi.
 */
function chuNhatCuaTuan(date: string): string {
  const dow = new Date(`${date.slice(0, 10)}T00:00:00Z`).getUTCDay();   // 0 = Chủ nhật
  return addDaysIso(date, dow === 0 ? 0 : 7 - dow);
}

// ---------------------------------------------------------------- phương án học thuật điền sẵn (đặc tả §4)

/**
 * ĐẾN KHI NÀO của một phương án điền sẵn — quyết định cách tính ngày dự kiến kết thúc (`followup_due`).
 *   one_month     "1 tháng"          → Chủ nhật đầu tiên SAU (ngày tạo + 30 ngày)
 *   until_next_mt "đến MT{n+1}"      → Chủ nhật của tuần kỹ năng muộn nhất của lượt MT kế tiếp, nếu đã có lịch
 *   until_exam    "đến lúc thi"      → ngày thi dự kiến, nếu có
 *   expert        "Hỗ trợ chuyên môn" → không có hạn tự tính (người xác nhận đặt)
 */
export const ACADEMIC_SUPPORT_SPANS = ['one_month', 'until_next_mt', 'until_exam', 'expert'] as const;
export type AcademicSupportSpan = (typeof ACADEMIC_SUPPORT_SPANS)[number];

export type AcademicSupportRule = { kind: InterventionKind; span: AcademicSupportSpan };

/** Ba mức SOS trong bảng tra. */
export type SosLevelKey = 1 | 2 | 3;

const SELF_1M: AcademicSupportRule = { kind: 'self_study', span: 'one_month' };
const TUTOR_NEXT: AcademicSupportRule = { kind: 'tutor', span: 'until_next_mt' };
const TUTOR_EXAM: AcademicSupportRule = { kind: 'tutor', span: 'until_exam' };
/** MT5 trở đi: `Khác` — chưa có quy định hình thức/thời lượng, nên chỉ là chỗ giữ chờ GVBM / P. Học thuật xác nhận. */
const EXPERT: AcademicSupportRule = { kind: 'other_proposal', span: 'expert' };

/**
 * BẢNG §4 — theo SỐ MT của lượt (hàng, MT5 trở đi dùng chung hàng 5) và MỨC SOS CỦA CẢ LƯỢT (cột).
 * SOS1 và SOS2 cùng một cột trong đặc tả; tách ra ba cột để bảng đọc thẳng được và đổi được riêng từng ô.
 */
export const DEFAULT_ACADEMIC_SUPPORT: Record<1 | 2 | 3 | 4 | 5, Record<SosLevelKey, AcademicSupportRule>> = {
  1: { 1: SELF_1M, 2: SELF_1M, 3: TUTOR_NEXT },
  2: { 1: SELF_1M, 2: SELF_1M, 3: TUTOR_NEXT },
  3: { 1: TUTOR_EXAM, 2: TUTOR_EXAM, 3: TUTOR_EXAM },
  4: { 1: TUTOR_EXAM, 2: TUTOR_EXAM, 3: TUTOR_EXAM },
  5: { 1: EXPERT, 2: EXPERT, 3: EXPERT },
};

export const ACADEMIC_SUPPORT_EXPERT_TEXT = 'Hỗ trợ chuyên môn — cần GVBM/P. Học thuật xác nhận';

export type AcademicSupportPreset = AcademicSupportRule & { description: string };

/** Ô của bảng §4 cho một lượt. `null` khi mức SOS không phải 1–3 (không có gì để điền). MT < 1 là lỗi gọi hàm. */
export function academicSupportFor(attemptNo: number, sosLevel: number | null | undefined): AcademicSupportPreset | null {
  if (!Number.isInteger(attemptNo) || attemptNo < 1) throw new Error(`Số MT không hợp lệ: ${attemptNo}`);
  if (sosLevel !== 1 && sosLevel !== 2 && sosLevel !== 3) return null;
  const rule = DEFAULT_ACADEMIC_SUPPORT[Math.min(attemptNo, 5) as 1 | 2 | 3 | 4 | 5][sosLevel];
  const description =
    rule.span === 'one_month' ? 'Tự học · 1 tháng'
    : rule.span === 'until_next_mt' ? `Tutor · đến MT${attemptNo + 1}`
    : rule.span === 'until_exam' ? 'Tutor · đến lúc thi'
    : ACADEMIC_SUPPORT_EXPERT_TEXT;
  return { ...rule, description };
}

/**
 * NGÀY DỰ KIẾN KẾT THÚC của phương án điền sẵn (đặc tả §4). Chưa có lịch / ngày thi thì để TRỐNG — bịa một ngày là tạo ra một
 * hạn quá hạn giả cho việc chưa tới lúc làm.
 *
 * "1 tháng" đọc theo nghĩa đen: lấy ngày tạo + 30 ngày, rồi Chủ nhật đầu tiên SAU ngày đó. Rơi đúng Chủ nhật thì sang Chủ nhật kế
 * tiếp (không phải chính ngày ấy).
 */
export function sosPlanEndDate(
  span: AcademicSupportSpan,
  ctx: { createdOn: string; nextMtSunday?: string | null; examDate?: string | null },
): string | null {
  switch (span) {
    case 'one_month': return chuNhatCuaTuan(addDaysIso(ctx.createdOn, 31));
    case 'until_next_mt': return ctx.nextMtSunday ?? null;
    case 'until_exam': return ctx.examDate ?? null;
    case 'expert': return null;
  }
}

// ---------------------------------------------------------------- phối hợp SOS (đặc tả §5)

/** SÁU LOẠI việc phối hợp (§5.2). `Report cho gia đình` KHÔNG ở đây — đó là biện pháp xử lý vi phạm. */
export const COORDINATION_KINDS = [
  'talk_student', 'talk_family', 'gvcn_meeting', 'cx_meeting_student', 'cx_meeting_family', 'other',
] as const;
export type CoordinationKind = (typeof COORDINATION_KINDS)[number];
export const COORDINATION_KIND_LABEL: Record<CoordinationKind, string> = {
  talk_student: 'Trao đổi ngắn với HS',
  talk_family: 'Trao đổi với gia đình',
  gvcn_meeting: 'GVCN meeting với HS',
  cx_meeting_student: 'CX / GĐCN meeting với HS',
  cx_meeting_family: 'CX / GĐCN meeting với HS / PH',
  other: 'Khác',
};

export const COORDINATION_STATUSES = ['pending', 'done', 'removed'] as const;
export type CoordinationStatus = (typeof COORDINATION_STATUSES)[number];
export const COORDINATION_STATUS_LABEL: Record<CoordinationStatus, string> = {
  pending: 'Cần xử lý', done: 'Đã xong', removed: 'Đã bỏ',
};

/** BỐN lý do người dùng chọn nhanh khi bỏ một việc (P06) — chỉ `Khác` hiện ô chữ. */
export const COORDINATION_USER_REMOVE_REASONS = ['not_needed', 'handled_otherwise', 'duplicate_measure', 'other'] as const;
/** Thêm `system_sos_changed` — chỉ HỆ THỐNG ghi khi sửa điểm làm mức SOS đổi (P03). Người dùng không chọn được mã này. */
export const COORDINATION_REMOVE_REASONS = [...COORDINATION_USER_REMOVE_REASONS, 'system_sos_changed'] as const;
export type CoordinationRemoveReason = (typeof COORDINATION_REMOVE_REASONS)[number];
export const COORDINATION_REMOVE_REASON_LABEL: Record<CoordinationRemoveReason, string> = {
  not_needed: 'Không cần trong trường hợp này',
  handled_otherwise: 'Đã xử lý theo cách khác',
  duplicate_measure: 'Trùng với phương án xử lý khác',
  other: 'Khác',
  system_sos_changed: 'Điểm được sửa — mức SOS không còn cần việc này',
};

/** BA lý do chọn nhanh khi GVBM bấm `Không cần theo dõi` (S05). */
export const CASE_DISMISS_REASONS = ['special_circumstance', 'single_incident', 'other'] as const;
export type CaseDismissReason = (typeof CASE_DISMISS_REASONS)[number];
export const CASE_DISMISS_REASON_LABEL: Record<CaseDismissReason, string> = {
  special_circumstance: 'Học sinh có lý do đặc biệt',
  single_incident: 'Tình huống đơn lẻ',
  other: 'Khác',
};

/** Lý do nào cần ô chữ đi kèm: chỉ `Khác` (P06, S05). Dùng chung cho cả hai nơi — một luật, một hàm. */
export function reasonNeedsText(code: string): boolean {
  return code === 'other';
}

const HS_GD: readonly CoordinationKind[] = ['talk_student', 'talk_family'];
const HS_GD_GVCN: readonly CoordinationKind[] = [...HS_GD, 'gvcn_meeting'];

/**
 * BẢNG §5.3 — hàng là SỐ MT (MT4 và MT5 trở đi dùng chung hàng 4), cột là mức SOS. Dấu `+` của đặc tả là CỘNG THÊM vào cột bên trái.
 * MT3 SOS3 là ngoại lệ DUY NHẤT dùng meeting có phụ huynh.
 */
export const DEFAULT_SOS_COORDINATION: Record<1 | 2 | 3 | 4, Record<SosLevelKey, readonly CoordinationKind[]>> = {
  1: { 1: HS_GD, 2: HS_GD, 3: HS_GD_GVCN },
  2: { 1: HS_GD, 2: HS_GD_GVCN, 3: [...HS_GD_GVCN, 'cx_meeting_student'] },
  3: { 1: HS_GD, 2: HS_GD_GVCN, 3: [...HS_GD_GVCN, 'cx_meeting_family'] },
  4: { 1: HS_GD, 2: HS_GD_GVCN, 3: [...HS_GD_GVCN, 'cx_meeting_student'] },
};

/** Các việc điền sẵn cho một lượt Mock có SOS. Mức 0 (hoặc không xác định) thì không có việc nào. */
export function sosCoordinationFor(attemptNo: number, sosLevel: number | null | undefined): readonly CoordinationKind[] {
  if (!Number.isInteger(attemptNo) || attemptNo < 1) throw new Error(`Số MT không hợp lệ: ${attemptNo}`);
  if (sosLevel !== 1 && sosLevel !== 2 && sosLevel !== 3) return [];
  return DEFAULT_SOS_COORDINATION[Math.min(attemptNo, 4) as 1 | 2 | 3 | 4][sosLevel];
}

/**
 * TÓM TẮT MỘT LƯỢT PHỐI HỢP — SUY RA, không lưu (§5.1). Hiện `{số done}/{số việc chưa bị bỏ}`.
 * "Hoàn thành" = có ít nhất một việc và mọi việc đều `done` hoặc `removed` (chỉ số `phoi-hop-hoan-thanh`).
 */
export function coordinationSummary(statuses: readonly string[]): {
  done: number; active: number; pending: number; total: number; complete: boolean; label: string;
} {
  const done = statuses.filter((s) => s === 'done').length;
  const pending = statuses.filter((s) => s === 'pending').length;
  const active = statuses.filter((s) => s !== 'removed').length;
  return { done, active, pending, total: statuses.length, complete: statuses.length > 0 && pending === 0, label: `${done}/${active}` };
}
