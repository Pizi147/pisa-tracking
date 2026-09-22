/**
 * LUẬT HIỂN THỊ THUẦN CỦA HỒ SƠ HỌC VIÊN (PR-HV, spec 2026-09-22) — giao diện chỉ vẽ.
 *
 * Cùng cách với `display.ts` + `<KetQuaDot>` (PR-E): luật nằm ở một chỗ, kiểm được bằng harness máy chủ
 * (`server/src/tests/hoSoHocVien.tests.ts`), React không có luật riêng để sai khác đi.
 *
 *   tab từ địa chỉ `?tab=`            → `parseHoSoTab`        (Task 2)
 *   ô "Kết quả Test gần nhất"         → `ketQuaTestGanNhat`   (Task 3)
 *   đếm vi phạm theo nhóm             → `demTheoNhomViPham`   (Task 4)
 *   tiến độ case, việc tiếp của PA    → `tienDoCase`, `viecTiepPhuongAn` (Task 6)
 */
import { ATTEMPT_SKILL_UNITS } from './display.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, type ViolationCategory } from './yThuc.ts';

// ====================================================================== ba tab (D2, A6)

export const HO_SO_TABS = ['hoc-thuat', 'y-thuc', 'hanh-trinh'] as const;
export type HoSoTab = (typeof HO_SO_TABS)[number];
export const HO_SO_TAB_LABEL: Record<HoSoTab, string> = {
  'hoc-thuat': 'Học thuật', 'y-thuc': 'Ý thức & Phối hợp', 'hanh-trinh': 'Hành trình',
};
/** Giá trị lạ, rỗng hay thiếu → 'hoc-thuat' (tab mặc định). Không nhớ bằng localStorage (A6). */
export function parseHoSoTab(v: string | null | undefined): HoSoTab {
  return (HO_SO_TABS as readonly string[]).includes(v ?? '') ? (v as HoSoTab) : 'hoc-thuat';
}

// ====================================================================== ô số nhỏ của tab Ý thức (A3)

/**
 * Đếm vi phạm theo nhóm, ĐÚNG thứ tự `VIOLATION_CATEGORIES`, bỏ nhóm có 0 (A3). `tong` đếm mọi dòng — kể cả mã nhóm lạ
 * (dữ liệu cũ) — để ô "Vi phạm" không ít hơn số dòng người dùng thấy.
 */
export function demTheoNhomViPham(vs: readonly { category: string }[]): {
  tong: number; nhom: { category: string; label: string; n: number }[];
} {
  const dem = new Map<string, number>();
  for (const v of vs) dem.set(v.category, (dem.get(v.category) ?? 0) + 1);
  return {
    tong: vs.length,
    nhom: VIOLATION_CATEGORIES
      .map((c) => ({ category: c, label: VIOLATION_CATEGORY_LABEL[c as ViolationCategory], n: dem.get(c) ?? 0 }))
      .filter((g) => g.n > 0),
  };
}

// ====================================================================== thẻ case và khối phương án (Q8)

/** Một phương án học thuật như thẻ case trả về (`Plan` ở `SkillBoard.tsx`) — chỉ các trường luật này cần. */
export type PhuongAnTomTat = {
  status: string; lastOutcome: string | null; preset: boolean; confirmedAt: string | null;
  pendingApproval: boolean; approvalDue: string | null;
  actionDue: string | null; actionOverdue: boolean; completedOn: string | null;
};
export const dangChay = (p: { status: string }) => p.status === 'planned' || p.status === 'started';

/**
 * Cột 2 đầu thẻ case: `{k}/{n} PA có kết quả` + việc gần nhất có hạn (`tiep`). Chỉ xét PA ĐANG CHẠY; case đã xong → không
 * có việc tiếp. Thứ tự: PA đang chạy ĐÃ QUÁ HẠN (sớm nhất) → PA gợi ý chưa xác nhận → PA chờ Quản lý → PA có hạn làm sớm
 * nhất → nghĩa vụ cập nhật hằng tuần của case (chủ sản phẩm chốt 22/09: việc đã trễ nói trước việc đang chờ người khác).
 * Hạn DỰ KIẾN XONG (followupDue) KHÔNG phải hạn (F11) — không dùng.
 */
export function tienDoCase(plans: readonly PhuongAnTomTat[], c: { status: string; followUntil: string | null; followOverdue: boolean }): {
  coKetQua: number; tong: number; text: string;
  tiep: { text: string; due: string | null; overdue: boolean } | null;
} {
  const tong = plans.length;
  const coKetQua = plans.filter((p) => p.lastOutcome !== null).length;
  const text = tong === 0 ? 'Chưa có phương án' : `${coKetQua}/${tong} PA có kết quả`;
  let tiep: { text: string; due: string | null; overdue: boolean } | null = null;
  if (c.status !== 'done') {
    const chay = plans.filter(dangChay);
    const goiY = chay.find((p) => p.preset && !p.confirmedAt);
    const choDuyet = chay.find((p) => p.pendingApproval);
    const coHan = chay.filter((p) => p.actionDue).sort((a, b) => a.actionDue!.localeCompare(b.actionDue!))[0];
    const quaHanRoi = chay.filter((p) => p.actionDue && p.actionOverdue).sort((a, b) => a.actionDue!.localeCompare(b.actionDue!))[0];
    if (quaHanRoi) tiep = { text: 'PA tiếp', due: quaHanRoi.actionDue, overdue: true };
    else if (goiY) tiep = { text: 'PA gợi ý chờ xác nhận', due: null, overdue: false };
    else if (choDuyet) tiep = { text: 'Chờ Quản lý trả lời', due: choDuyet.approvalDue, overdue: false };
    else if (coHan) tiep = { text: 'PA tiếp', due: coHan.actionDue, overdue: coHan.actionOverdue };
    else if (c.followUntil) tiep = { text: 'Cập nhật PA', due: c.followUntil, overdue: c.followOverdue };
  }
  return { coKetQua, tong, text, tiep };
}

/** Phần 3 ("Việc tiếp theo") của một khối phương án. */
export function viecTiepPhuongAn(p: PhuongAnTomTat): {
  loai: 'goi-y' | 'cho-duyet' | 'ghi-ket-qua' | 'da-xong'; text: string; due: string | null; overdue: boolean;
} {
  if (p.preset && !p.confirmedAt) return { loai: 'goi-y', text: 'Gợi ý tự động · chờ xác nhận', due: null, overdue: false };
  if (p.pendingApproval) return { loai: 'cho-duyet', text: 'Chờ Quản lý trả lời', due: p.approvalDue, overdue: false };
  if (dangChay(p)) return { loai: 'ghi-ket-qua', text: 'Ghi kết quả', due: p.actionDue, overdue: p.actionOverdue };
  return { loai: 'da-xong', text: 'Đã kết thúc', due: p.completedOn, overdue: false };
}

// ====================================================================== ô "Việc cần làm tiếp" (Q7)

/** Quá hạn = hạn ĐÃ QUA (trước hôm nay). Hạn đúng hôm nay thì chưa quá hạn; không có hạn thì không bao giờ quá hạn. */
export const quaHan = (due: string | null | undefined, today: string): boolean => !!due && due < today;

// ====================================================================== ô "Kết quả Test gần nhất" (Q7)

/** Một lượt đánh giá như `studentProfile().attempts[]` trả về — chỉ các trường ô này cần. */
export type LuotTomTat = {
  id: number; attemptNo: number; kind: string; status: string; periodCode: string | null;
  mode: string; scored: number; required: number; complete: boolean;
  overall: number | null; expectation: number | null; sosLevel: number | null;
};
export type KetQuaTestGanNhat = {
  attemptId: number; nhan: string; coDiem: number; yeuCau: number;
  dat: boolean | null; sos: number | null;
  /** `<KetQuaDot>` chỉ nhận 1–4 kỹ năng (ATTEMPT_SKILL_UNITS); ngoài khoảng đó giao diện ghi `{có}/{cần} phần có điểm`. */
  dungKetQuaDot: boolean;
};

/**
 * Lượt SỐ LỚN NHẤT chưa huỷ và đã có ít nhất một điểm — tự sắp, không tin thứ tự vào. Không có → null.
 *
 *   Fast Track: nhãn `MT{n} · {tuần}`; "đạt" = đủ điểm và Overall ≥ kỳ vọng (thiếu một trong hai → null).
 *   Normal:     nhãn `Giữa khoá` / `Cuối khoá` (+ tuần); KHÔNG có Overall — "đạt" = đủ điểm và SOS 0
 *               (mọi phần đạt ngưỡng), chưa đủ điểm → null. Không bịa Overall (J3).
 */
export function ketQuaTestGanNhat(attempts: readonly LuotTomTat[]): KetQuaTestGanNhat | null {
  const a = [...attempts]
    .filter((x) => x.status !== 'cancelled' && x.scored > 0)
    .sort((x, y) => y.attemptNo - x.attemptNo)[0];
  if (!a) return null;
  const ratio = a.mode === 'ratio';
  const dau = ratio ? (a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá') : `MT${a.attemptNo}`;
  const nhan = a.periodCode ? `${dau} · ${a.periodCode}` : dau;
  const dat = ratio
    ? (a.complete ? a.sosLevel === 0 : null)
    : (a.complete && a.overall !== null && a.expectation !== null ? a.overall >= a.expectation : null);
  return {
    attemptId: a.id, nhan, coDiem: a.scored, yeuCau: a.required, dat, sos: a.sosLevel,
    dungKetQuaDot: a.required >= 1 && a.required <= ATTEMPT_SKILL_UNITS,
  };
}
