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
