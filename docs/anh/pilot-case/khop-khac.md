# 6b-2 PILOT-CASE — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (mockup `thiet-ke/v7/panel-pilot.html` khu ①, Case A, "Vòng 2 · chữ", K)

Ảnh cặp mockup | web (seed nguyên, ngày demo 14/09/2026, `scripts/anh-cap.mjs`, vai QL Monbay = Nguyễn Khánh Vy):
`cap-ds-1440-toi.png` (danh sách nhóm) · `cap-case-1440-toi.png` (view Case, Case A) · `cap-ds-375.png` · `cap-case-375.png`.
Ảnh luồng (chỉ web, sau khi bấm thật): `web-vua-them-pa-1440-toi.png` / `-375.png` (Thêm PA lưu xong → tự về Case, viền PA + "✓ Đã thêm PA · Hoàn tác",
chân "Case tiếp ›") · `web-ve-danh-sach-1440-toi.png` / `-375.png` (‹ về danh sách: dòng vừa mở được tô, "✓ Đã lưu", đầu panel "n Case · 1 vừa xử lý").
Số trên web là dữ liệu seed (khác số demo của mockup) — so khung, thứ tự, tên, kiểu chữ.

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Đầu panel: dòng loại "SỐ LIỆU · TỔNG QUAN" · tiêu đề 17 · "n Case" · chip quá hạn | `NganDanhSach` (`SoLieu.tsx`) nhánh `nhomCase` | KHỚP |
| 2 | Danh sách theo **6 nhóm máy chủ** (rỗng không vẽ, quá hạn lên đầu nhóm) | máy chủ `oBangChiNhanh` trả `nhom` (`nhomCaseChuaChot`, cùng hàm `phanRa`) + `xepNhomCase` | KHỚP |
| 3 | Dải nhóm: nền surface-2, vạch 3 px theo bước, 15 / 700, chip đếm (còn chờ; hết → ✓), dính khi cuộn | `veNhom` (`VACH_NHOM` token sẵn có) | KHỚP |
| 4 | Dòng = MỘT nút: tên em 15 / 500 · cột phải người giữ việc ("Bạn") + hạn | `veDongCase` | KHỚP |
| 5 | Dòng 2: "✗ 5.0 · kỳ vọng 6.0 · thiếu 1.0" | dòng 2 = lớp · việc tiếp ("Thêm PA", "Mô tả Case"…); điểm hiện ở view Case | KHÁC — [XM-1] |
| 6 | Bấm dòng → view Case trong CÙNG panel (không panel chồng), một chuỗi một bề rộng 720 | `xem.vao('case', …, { dong })` + `LamDongSoLieu` → `NganCase`; `XemCha.rong` | KHỚP |
| 7 | Đầu view Case: "‹ n Case chưa chốt PA" cùng hàng ✕ · tiêu đề "Case Listening" · em ↗ · lớp · **chip hạn** | `KhungPanel` (6b-1) + `dauViec({ han })` | KHỚP |
| 8 | Vùng A: trạng thái · mở W.. · phụ trách · Sửa | dải đầu Ngăn Case có sẵn (thêm "Đổi người…", khoá điều kiện hoàn thành) | GIỮ |
| 9 | Đầu mục **Case** (B): chip lượt · Điểm · Nguyên nhân · Mô tả | `ThanCase` → `DauMuc` "Case" (tên Case + chip MT / SOS) · Điểm (`ketQuaGanNhat`) · Nguyên nhân = **chỉ nhóm** (1 = chính, phụ) · **Mô tả** = câu nhận xét / mô tả của nguyên nhân chính (cùng nguồn #626: "— theo nhận xét MT1" hoặc người · ngày); không có → "Chưa có" + nút "Mô tả Case" (PTA rà #632, N8) | KHỚP |
| 10 | Lượt "MT2 · W4 AUG ↗" là link hồ sơ lượt | chip "MT2" không link (trang lượt M4 chưa có đường) | KHÁC — [XM-2] |
| 11 | Đầu mục **Phương án** (C): chip đếm · nhóm Chờ duyệt · xác nhận / Đang theo dõi (chỉ ghi khi có cả hai) · Đã kết thúc gập · việc của PA trong thẻ PA | `ThanCase` (`paCho` / `paChay` / `paKhep`) + `TheKhoiPa` / `DongPaGon` (giữ Duyệt / Từ chối, Xác nhận PA, Ghi kết quả, ghi nhanh, ⋯) | KHỚP |
| 12 | Kết quả kỳ trong từng thẻ PA | giữ cách đang có (Kết quả · hạn kế; Nhật ký PA) | GIỮ |
| 13 | Đầu mục **Kết luận** (D): "Chưa có · ghi khi mọi PA đã khép" | `DauMuc` "Kết luận" | KHỚP |
| 14 | Đầu mục **Lịch sử** (E) gập, chip đếm | `<details>` + `TieuDeMuc` (đổi từ "Nhật ký · n") | KHỚP |
| 15 | (mockup không vẽ) Bằng chứng | `DauMuc` "Bằng chứng" + `BangChung` | GIỮ |
| 16 | Luật chữ: đầu mục 15 / 700 vạch 3 × 18 nhấn, khoảng trên 22 + đường kẻ; tên thẻ PA 15 / 600; nhãn 13 / 500; giá trị 15 | `DauMuc`, `TieuDeMuc`, thẻ PA, `dl` cột 7.5rem (375: nhãn trên giá trị) | KHỚP |
| 17 | Thêm PA lưu xong → **tự về Case**, PA mới viền nhấn + "✓ Vừa thêm · Hoàn tác" (Q1) | `xongLuu` (view dưới là Case) → `xem.lui()` + `VuaDoiPa` / `DaiVuaDoi`; Hoàn tác = `POST /interventions/:id/hoan-tac-them` (#623) | KHỚP |
| 18 | Ghi kết quả trong chuỗi Case cũng tự về Case | cùng đường, Hoàn tác = đường đảo sẵn có của Ghi kết quả | KHỚP |
| 19 | Chân: việc của Case; xong → "Case tiếp ›" (Q7) / "Hết Case chờ trong danh sách" | `caseTiep` (shared) qua `XemCha.caseTiep`; Case còn việc của nó → việc đó vẫn là nút chính, "Case tiếp ›" nút phụ | KHỚP |
| 20 | ‹ về danh sách: dòng vừa mở tô "đang chọn" + cuộn tới, dòng xử lý giữ chỗ "✓" | `setMo` (replace) trước khi push view; `giu` giữ nhóm gốc | KHỚP |
| 21 | Người không quyền: một câu "ai làm được" (form khoá, không 403 trống) | `chuAiLamDuoc(owner)` ở đầu mục Phương án, Ngăn Case chỉ đọc, view Thêm PA mở thẳng | KHỚP |
| 22 | Lưu lỗi: ở lại form, giữ chữ, Thử lại | giữ như hiện có (form Thêm PA / Ghi kết quả) | GIỮ |
| 23 | 375: panel toàn màn, dòng một cột, nhãn trên giá trị, nút 44 | `KhungPanel` + lớp `max-sm:` | KHỚP |
| — | BỎ: thẻ khối "Vấn đề / Phương án / Bằng chứng" có viền (`The`) | thay bằng đầu mục (luật chữ) | BỎ |
| — | BỎ: chữ "Vấn đề" → "Case"; "Ghi nhận" → "Mô tả" (N8) | | BỎ |
| — | GIỮ (mockup không vẽ): phân trang 10 / 20 / 50, "Cách tính", Đóng ở chân, dòng loại "VIỆC" ở view Case | | GIỮ |

**Đếm:** 23 dòng có khung — 18 KHỚP · 2 KHÁC ([XM-1], [XM-2]) · 4 GIỮ (không tính) → 18 / 20 = **90 % — đạt cổng 90 %**.

## Thao tác TRƯỚC → SAU (đo bằng bấm thật 27/10, Playwright)

| Luồng | TRƯỚC (main 27/10) | SAU (PR này) | Bấm | Đổi trang | Mất / thêm |
|---|---|---|---|---|---|
| QL thêm PA cho một Case từ Tổng quan, xem lại, về danh sách | Số → panel CHỈ ĐỌC (dòng không việc) → dòng mở rộng → "Mở trang ↗" (hồ sơ HV) → + Thêm PA → Thêm PA → "✓ Đã lưu" → Xem Case → ‹ Tổng quan | Số → dòng → + Thêm PA → Thêm PA (tự về Case, viền + Hoàn tác) → ‹ | 7 → **4** | 2 → **0** | Thêm: Hoàn tác Thêm PA, Case tiếp ›. Giữ: đủ loại PA, "Ghi một PA đã làm trước đây", hồ sơ HV mở bằng tên ↗ |
| QL xử lý Case kế tiếp | đóng panel, bấm số lại, tìm dòng | "Case tiếp ›" | ≥ 3 → **1** | 0 → 0 | Thêm |
| Duyệt PA đề xuất (QL) | dòng → Mở trang ↗ → Duyệt → ‹ | dòng → Duyệt (thẻ dưới PA) → ‹ | 4 → **3** | 1 → **0** | Giữ khối "Chờ bạn duyệt" ở Tổng quan |
| Người không quyền mở Case | nút ẩn, không lý do | câu "Chỉ {phụ trách} hoặc Quản lý làm được việc ở Case này." | — | — | Thêm câu |
| Mô tả Case / Xác nhận PA từ panel số | (dòng chỉ đọc — không làm được trong panel) | dòng → nút chính ở chân view Case | — → 2 | 0 → 0 | Thêm |

Không mất thao tác nào: mọi việc của Ngăn Case (Xác nhận Case, Mô tả Case, Xác nhận PA, Sửa PA, Đề xuất PA khác, Duyệt / Từ chối, Ghi kết quả + Điều chỉnh, Sửa kết quả,
Hoàn thành, Mở lại, Sửa Case, Đổi người…, Phụ huynh, Bằng chứng) giữ nguyên. Các panel số khác (không có `nhom`) giữ dáng cũ — áp dần ở 6c.

## [XM] — hỏi PTA Plan

- **XM-1** dòng danh sách chưa có điểm "✗ 5.0 · kỳ vọng 6.0 · thiếu 1.0": máy chủ `rowsFor('case')` chưa trả điểm lượt mở Case. Thêm được ở `rowsFor` (một câu SQL theo lô) — đề xuất làm ở 6c hoặc PR nhỏ sau, vì PR này đã đổi đường máy chủ của ô.
- **XM-2** chip lượt "MT2" chưa là link ↗ hồ sơ lượt: đường trang lượt thuộc M4 (HSL); khi M4 có route thì gắn link trong `DauMuc` "Case".

## Critique (impeccable, một lần, agent độc lập): **30 / 40**

Đã sửa sau critique: đếm "n Case · k vừa xử lý" khớp số dòng · chip hạn ở đầu view Case · "Bạn" chỉ khi người xem là người phụ trách · dòng vừa xử lý giữ lớp ·
không lặp "✓ Đã lưu" ở chân · tên Case trong đầu mục nhẹ hơn. Chưa sửa (ngoài phạm vi, thành phần sẵn có): phân trang chiếm chỗ ở 375, khung Bằng chứng,
"Sửa" xuống dòng ở 375, dòng meta thẻ PA lặp "đến MT2" — ghi cho 6c.
