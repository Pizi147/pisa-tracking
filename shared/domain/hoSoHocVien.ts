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
