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
export {};
