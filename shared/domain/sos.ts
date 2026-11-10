/**
 * SOS TỰ TẠO CASE · PHỐI HỢP SOS (rulebook v3, chốt tối 21/09/2026).
 *
 * Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md` mục 3–5. Luật: rule book mục 19.
 *
 * File này chỉ có BẢNG TRA và LUẬT THUẦN (không đụng database) để máy chủ và giao diện đọc cùng một nơi. Hai bảng tra là hai
 * MẢNG DỮ LIỆU — không phải chuỗi `if` rải rác — nên đổi luật là đổi một dòng ở đây, và phép kiểm đọc đúng bảng đó.
 *
 * SOS Event KHÔNG có bảng riêng: nó là chính lượt Mock Test Fast Track (`assessment_attempts`) có `sos_level ≥ 1` (đặc tả §2).
 * Lớp thường không có gì trong file này (Q-V3-1): Normal giữ mô hình tín hiệu cũ.
 */
import { hanTai } from './hanMacDinh.ts';
import type { InterventionKind } from './cases.ts';
import { ngayTheoGioVN } from './display.ts';
import { dich, t } from '../i18n/index.ts';
import { cauHinhPb, tenHien, type MocSos, type Viec } from './cauHinhCaseSos.ts';
import { tenLoaiPa } from './cases.ts';

export function addDaysIso(date: string, n: number): string {
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
 *   until_exam    "đến lúc thi"      → dự kiến thi, nếu có
 * PR-SOS: bỏ `expert` (MT5+ "Khác") — chủ sản phẩm chốt 29/09 Câu 1 = A.
 */
export const ACADEMIC_SUPPORT_SPANS = ['one_month', 'until_next_mt', 'until_exam'] as const;
export type AcademicSupportSpan = (typeof ACADEMIC_SUPPORT_SPANS)[number];

export type AcademicSupportRule = { kind: InterventionKind; span: AcademicSupportSpan };

/** Ba mức SOS trong bảng tra. */
export type SosLevelKey = 1 | 2 | 3;

const SELF_1M: AcademicSupportRule = { kind: 'self_study', span: 'one_month' };
const TUTOR_NEXT: AcademicSupportRule = { kind: 'tutor', span: 'until_next_mt' };
const TUTOR_EXAM: AcademicSupportRule = { kind: 'tutor', span: 'until_exam' };

/**
 * BẢNG §4 — theo SỐ MT của lượt (hàng, MT5 trở đi dùng chung hàng 5) và MỨC SOS CỦA CẢ LƯỢT (cột).
 * SOS1 và SOS2 cùng một cột trong đặc tả; tách ra ba cột để bảng đọc thẳng được và đổi được riêng từng ô.
 */
export const DEFAULT_ACADEMIC_SUPPORT: Record<1 | 2 | 3 | 4 | 5, Record<SosLevelKey, AcademicSupportRule>> = {
  1: { 1: SELF_1M, 2: SELF_1M, 3: TUTOR_NEXT },
  2: { 1: SELF_1M, 2: SELF_1M, 3: TUTOR_NEXT },
  3: { 1: TUTOR_EXAM, 2: TUTOR_EXAM, 3: TUTOR_EXAM },
  4: { 1: TUTOR_EXAM, 2: TUTOR_EXAM, 3: TUTOR_EXAM },
  5: { 1: TUTOR_EXAM, 2: TUTOR_EXAM, 3: TUTOR_EXAM },   // PR-SOS Câu 1 = A (29/09): MT5+ như MT3/MT4
};

export type AcademicSupportPreset = AcademicSupportRule & { description: string };

/** CAU-HINH-CASE-SOS: ô mốc FT của một lượt — hàng `rf` cho lộ trình RF (mã cũ: PA hàng MT3+, việc hàng MT4 — bản gốc chép đúng), còn lại MT1…MT5+. */
export function oMocFt(attemptNo: number, sosLevel: 1 | 2 | 3, route?: string | null, pb?: number | null) {
  const hang = route === 'RF' ? 'rf' : (`mt${Math.min(attemptNo, 5)}` as 'mt1');
  return cauHinhPb('moc_sos', pb).du_lieu.ft[hang][String(sosLevel) as '1'];
}

/** Ô của bảng §4 cho một lượt. `null` khi mức SOS không phải 1–3 (không có gì để điền) hoặc ô không có PA quy chế. MT < 1 là lỗi gọi hàm.
 *  RF (T4): hàng RF — `route` là lộ trình CỦA LƯỢT (K5-49). CAU-HINH-CASE-SOS: đọc ô của bản `pb` (bản của lượt; null → đang dùng). */
export function academicSupportFor(attemptNo: number, sosLevel: number | null | undefined, route?: string | null, pb?: number | null): AcademicSupportPreset | null {
  if (!Number.isInteger(attemptNo) || attemptNo < 1) throw new Error(t('Số MT không hợp lệ: {attemptNo}', { attemptNo }));
  if (sosLevel !== 1 && sosLevel !== 2 && sosLevel !== 3) return null;
  const pa = oMocFt(attemptNo, sosLevel, route, pb).pa;
  if (!pa) return null;
  const rule = { kind: pa.loai as InterventionKind, span: pa.den };
  const description =
    rule.kind === 'self_study' && rule.span === 'one_month' ? t('Tự học · 1 tháng')
    : rule.kind === 'tutor' && rule.span === 'until_next_mt' ? t('Tutor · đến MT{x}', { x: attemptNo + 1 })
    : rule.kind === 'tutor' && rule.span === 'until_exam' ? t('Tutor · đến lúc thi')
    : `${tenLoaiPa(rule.kind)} · ${rule.span === 'one_month' ? dich('1 tháng') : rule.span === 'until_next_mt' ? dich('đến MT{x}', { x: attemptNo + 1 }) : dich('đến lúc thi')}`;
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
    case 'one_month': return chuNhatCuaTuan(addDaysIso(ctx.createdOn, hanTai('ket_thuc_pa', ctx.createdOn).ngay));   // QTV2-HAN (gốc 31)
    case 'until_next_mt': return ctx.nextMtSunday ?? null;
    case 'until_exam': return ctx.examDate ?? null;
  }
}

// ---------------------------------------------------------------- phối hợp SOS (đặc tả §5)

/** SÁU LOẠI việc phối hợp (§5.2). `Report cho gia đình` KHÔNG ở đây — đó là biện pháp xử lý vi phạm. */
export const COORDINATION_KINDS = [
  'talk_student', 'talk_family', 'gvcn_meeting', 'cx_meeting_student', 'cx_meeting_family', 'other',
  /* PR-LT2a (N3, T45): chỉ MÁY tạo (Giữa khoá lớp thường) — danh sách chọn "+ Thêm việc" lọc bỏ. */
  'bao_ph_tvv',
] as const;
export type CoordinationKind = (typeof COORDINATION_KINDS)[number];
/** Nhãn GỐC — bản gốc của danh mục việc (cấu hình); nơi hiển thị đọc `COORDINATION_KIND_LABEL` / `tenViec`. */
export const NHAN_VIEC_GOC: Record<CoordinationKind, string> = {
  talk_student: t('Trao đổi ngắn với HV'),
  talk_family: t('Trao đổi với gia đình'),
  gvcn_meeting: t('GVCN meeting với HV'),
  /* EN-e: cùng tên ở Công việc (K3-38: "sau Mock" tách khỏi Meeting CX/GĐCN của Ý thức). */
  cx_meeting_student: t('Meeting CX/GĐCN (sau Mock) · {x}', { x: 'HV' }),
  cx_meeting_family: t('Meeting CX/GĐCN (sau Mock) · {x}', { x: 'HV / PH' }),
  other: t('Khác'),
  bao_ph_tvv: t('Báo phụ huynh qua TVV'),
};

/** CAU-HINH-CASE-SOS: việc trong danh mục của bản `pb` (dòng việc chụp lúc sinh; null → đang dùng). */
export const viecCua = (kind: string, pb?: number | null): Viec | null => cauHinhPb('moc_sos', pb).du_lieu.viec.find((v) => v.ma === kind) ?? null;
export function tenViec(kind: string, pb?: number | null): string {
  const v = viecCua(kind, pb);
  return v ? tenHien(v) : NHAN_VIEC_GOC[kind as CoordinationKind] ?? kind;
}
/** ponytail: Proxy để ~10 chỗ đọc `COORDINATION_KIND_LABEL[kind]` giữ nguyên mà ra tên cấu hình đang dùng; tên theo bản dòng → `tenViec(kind, pb)`. */
export const COORDINATION_KIND_LABEL: Record<CoordinationKind, string> = new Proxy(NHAN_VIEC_GOC, {
  get: (goc, k) => (typeof k === 'string' ? tenViec(k) : Reflect.get(goc, k)),
});
/**
 * NGƯỜI LÀM của một dòng việc phối hợp (CAU-HINH-CASE-SOS + PHOI-HOP-SOS-V2) — theo bản chụp của dòng (`pb_moc`). Bản gốc: mọi việc GVCN; QL luôn làm thẳng.
 * `buocTvv` ≠ null: GVCN xác nhận xong thì sinh việc TVV (báo gia đình, sắp xếp họp, ghi kết quả).
 */
export function aiLamViec(dong: { kind: string; pb_moc?: number | null }): { aiLam: Viec['aiLam']; buocTvv: NonNullable<Viec['buocTvv']> | null } {
  const v = viecCua(dong.kind, dong.pb_moc);
  return { aiLam: v?.aiLam ?? 'gvcn', buocTvv: v?.buocTvv ?? null };
}
/** Mã việc CÓ HẠN ở bản gốc hoặc bản đang dùng — lọc SQL trước (`kind IN (…)`), `hanPhoiHop(…, pb)` của từng dòng quyết sau.
 *  ponytail: bản giữa (có hạn rồi bỏ) không vào lọc — thêm hợp mọi phiên bản nếu Quản trị hay đổi qua lại. */
export function maViecCoHan(): string[] {
  const r = new Set<string>(['cx_meeting_student', 'cx_meeting_family']);
  for (const v of cauHinhPb('moc_sos', undefined).du_lieu.viec) if (v.hanNgay != null) r.add(v.ma);
  return [...r];
}
/** Hạn dài nhất (ngày) trong danh mục việc đang dùng — cửa sổ đọc của số liệu "việc đúng hạn". */
export const hanViecLonNhat = (): number => Math.max(HAN_MEETING_CX_NGAY, ...cauHinhPb('moc_sos', undefined).du_lieu.viec.map((v) => v.hanNgay ?? 0));
/** Ghi chú tối thiểu khi xác nhận việc (0 = không bắt buộc) — theo bản chụp của dòng. */
export const toiThieuGhiChu = (kind: string, pb?: number | null): number => {
  const v = viecCua(kind, pb);
  return v ? (v.ghiChu === 'bat_buoc' ? v.toiThieu ?? 1 : 0) : laMeetingCx(kind) ? GHI_CHU_MEETING_TOI_THIEU : 0;
};

/**
 * OV-12h (chủ SP 14/10): "CX / GĐCN meeting với HV" và "… với HV / PH" phải XÁC NHẬN trong 5 ngày kể từ lúc tạo việc — hạn = ngày tạo (giờ VN) + 5,
 * quá hạn khi hôm nay > hạn. Xác nhận cần Ghi chú ≥ 10 ký tự. Việc phối hợp khác giữ không hạn (P10).
 */
export const HAN_MEETING_CX_NGAY = 5;
export const GHI_CHU_MEETING_TOI_THIEU = 10;
export const laMeetingCx = (kind: string): boolean => kind === 'cx_meeting_student' || kind === 'cx_meeting_family';
/** HAN-BAO-PH (chủ SP 03/11, 17.2): `hanChon` (cột `han_chon`) thắng hạn mặc định — chỉ việc meeting CX (việc khác không hạn, P10). */
export const hanPhoiHop = (kind: string, taoLuc: string | null | undefined, hanChon?: string | null, pb?: number | null): string | null => {
  /* CAU-HINH-CASE-SOS: hạn n ngày của việc theo bản chụp của dòng; mã không có trong cấu hình → luật cũ (chỉ Meeting CX, 5 ngày). */
  const v = viecCua(kind, pb);
  const so = v ? v.hanNgay : laMeetingCx(kind) ? HAN_MEETING_CX_NGAY : null;
  if (so == null) return null;
  if (hanChon) return hanChon;
  const ngay = ngayTheoGioVN(taoLuc);
  return ngay ? addDaysIso(ngay, so) : null;
};

export const COORDINATION_STATUSES = ['pending', 'done', 'removed'] as const;
export type CoordinationStatus = (typeof COORDINATION_STATUSES)[number];
export const COORDINATION_STATUS_LABEL: Record<CoordinationStatus, string> = {
  pending: t('Cần xử lý'), done: t('Xong'), removed: t('Đã bỏ'),
};

/** BỐN lý do người dùng chọn nhanh khi bỏ một việc (P06) — chỉ `Khác` hiện ô chữ. */
export const COORDINATION_USER_REMOVE_REASONS = ['not_needed', 'handled_otherwise', 'duplicate_measure', 'other'] as const;
/** Mã chỉ HỆ THỐNG ghi: sửa điểm làm mức SOS đổi (P03) · lượt bị "Huỷ cả lượt" (PR-MT, T67) · kết quả MT huỷ do dời vượt (PR-MTa T2) · bảng §5.3 đổi (migrate OV-13n). */
export const COORDINATION_REMOVE_REASONS = [...COORDINATION_USER_REMOVE_REASONS, 'system_sos_changed', 'system_luot_huy', 'system_ket_qua_huy', 'system_bang_doi', 'system_ket_thuc_lo_trinh'] as const;
/** Lý do hệ thống mà `syncSosCoordination` được HỒI LẠI khi bảng lại cần việc đó (mức SOS đổi). */
export const COORDINATION_SYNC_REVIVE_REASONS: readonly string[] = ['system_sos_changed', 'system_bang_doi'];
export type CoordinationRemoveReason = (typeof COORDINATION_REMOVE_REASONS)[number];
export const COORDINATION_REMOVE_REASON_LABEL: Record<CoordinationRemoveReason, string> = {
  not_needed: t('Không cần trong trường hợp này'),
  handled_otherwise: t('Đã xử lý theo cách khác'),
  duplicate_measure: t('Trùng với lần xử lý khác'),
  other: t('Khác'),
  system_sos_changed: t('Điểm được sửa — mức SOS không còn cần việc này'),
  system_luot_huy: t('Lượt Test đã huỷ'),
  system_ket_qua_huy: t('Kết quả MT đã huỷ'),
  system_bang_doi: t('Luật mới: SOS 2–3 không còn việc này'),
  system_ket_thuc_lo_trinh: t('Kết thúc lộ trình'),   // Q-RL3
};

/** BA lý do chọn nhanh khi GVBM bấm `Không cần theo dõi` (S05). */
export const CASE_DISMISS_REASONS = ['special_circumstance', 'single_incident', 'other'] as const;
export type CaseDismissReason = (typeof CASE_DISMISS_REASONS)[number];
export const CASE_DISMISS_REASON_LABEL: Record<CaseDismissReason, string> = {
  special_circumstance: t('Học viên có lý do đặc biệt'),
  single_incident: t('Tình huống đơn lẻ'),
  other: t('Khác'),
};

/** Lý do nào cần ô chữ đi kèm: chỉ `Khác` (P06, S05). Dùng chung cho cả hai nơi — một luật, một hàm. */
export function reasonNeedsText(code: string): boolean {
  return code === 'other';
}

const HS_GD: readonly CoordinationKind[] = ['talk_student', 'talk_family'];
const GD: readonly CoordinationKind[] = ['talk_family'];
const GD_GVCN: readonly CoordinationKind[] = [...GD, 'gvcn_meeting'];

/**
 * BẢNG §5.3 — hàng là SỐ MT (MT4 và MT5 trở đi dùng chung hàng 4), cột là mức SOS. Dấu `+` của đặc tả là CỘNG THÊM vào cột bên trái.
 * Chủ SP 16/10 (OV-13n): SOS2 / SOS3 KHÔNG điền sẵn "Trao đổi ngắn với HV" (GVCN vẫn tự thêm được); SOS1 giữ HV + gia đình.
 * MT3 SOS3 là ngoại lệ DUY NHẤT dùng meeting có phụ huynh.
 */
export const DEFAULT_SOS_COORDINATION: Record<1 | 2 | 3 | 4, Record<SosLevelKey, readonly CoordinationKind[]>> = {
  1: { 1: HS_GD, 2: GD, 3: GD_GVCN },
  2: { 1: HS_GD, 2: GD_GVCN, 3: [...GD_GVCN, 'cx_meeting_student'] },
  3: { 1: HS_GD, 2: GD_GVCN, 3: [...GD_GVCN, 'cx_meeting_family'] },
  4: { 1: HS_GD, 2: GD_GVCN, 3: [...GD_GVCN, 'cx_meeting_student'] },
};

/**
 * PHOI-HOP-V2 (rà PTA 1–2): toast Hoàn tác sau "Lưu" ở ô ② chỉ khi lần lưu đó chuyển việc Cần xử lý → Xong (Hoàn tác = Đưa lại Cần xử lý).
 * "Sửa" việc đã xong và lần TVV ghi kết quả không có Hoàn tác kiểu này — đưa lại sẽ xoá ngày / người làm hoặc trả Meeting về Cần xử lý.
 */
export const hoanTacXacNhanDuoc = (truoc: string, laGhiTvv: boolean): boolean => !laGhiTvv && truoc === 'pending';

/** Các việc điền sẵn cho một lượt Mock có SOS. Mức 0 (hoặc không xác định) thì không có việc nào. RF (T4): hàng RF.
 *  CAU-HINH-CASE-SOS: ô của bản `pb` (bản của lượt). */
export function sosCoordinationFor(attemptNo: number, sosLevel: number | null | undefined, route?: string | null, pb?: number | null): readonly CoordinationKind[] {
  if (!Number.isInteger(attemptNo) || attemptNo < 1) throw new Error(t('Số MT không hợp lệ: {attemptNo}', { attemptNo }));
  if (sosLevel !== 1 && sosLevel !== 2 && sosLevel !== 3) return [];
  return oMocFt(attemptNo, sosLevel, route, pb).viec as CoordinationKind[];
}
/** Mốc lớp thường của bản `pb` (số buổi Bổ trợ, Tutor, việc phối hợp). */
export const mocThuong = (pb?: number | null): MocSos['thuong'] => cauHinhPb('moc_sos', pb).du_lieu.thuong;

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
