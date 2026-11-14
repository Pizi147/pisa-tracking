# GD-17a — Quản trị: nhật ký một dáng · panel nhật ký QL · dải chỉ xem (mockup v21 ⑩ K2–K8)

Plan `12-plan-giao-dien-dot-3.md` dòng GD-17 ("mỗi tab có đổi một PR nhỏ") — PR này là phần CHUNG nhiều tab: cột Nhật ký, panel "Xem tất cả" của QL, dải chỉ-xem, Nhật ký chung. Phần riêng từng tab: **17b** Chương trình sửa tại ô · **17c** Tài khoản (ô chọn), Case & SOS (nút), Mở sửa lịch Test (công tắc), Đã xoá (ⓘ).
Mockup `thiet-ke/v21/quan-tri.html` + `quan-tri-ghi-chu.md`. Seed 14/09: Quản trị (1), Quản lý (2) — tên bịa của bộ demo. Để có dòng nhật ký: sửa SĐT chi nhánh CP hai lần trên DB seed cục bộ (giá trị về như cũ). Phông Be Vietnam Pro đã nạp.

## Ảnh

| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-k3-1440-toi.png` | K3 | QL tab Chi nhánh: dải chỉ xem · cột "Nhật ký · 2" dáng mới · "Xem tất cả" |
| `cap-k5-1440-toi.png` | K5 | QL tab Hạn mặc định: dải chỉ xem dưới hàng tab (bỏ câu lặp trong thẻ) |
| `cap-k7-1440-toi.png` | K7 | Quản trị › Quyền & nhật ký: Nhật ký chung — Mục ô chọn thường, Người ô có tìm, dòng dáng chung + nhãn mục |
| `cap-k8-1440-toi.png` | K8 | QL bấm "Xem tất cả" → panel nhật ký tại chỗ (Mục: Tất cả · Người · chân Đóng) |
| `web-k5-375-sang.png` | — | 375 sáng (mockup không vẽ K5 ở 375) |

## 1. Truy vết

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | K2–K6 cột Nhật ký một dáng ⑤ H4 (người đậm · việc · cũ gạch → mới · giờ), đầu "Nhật ký n"; cột hẹp giờ trên dòng [XM-7] | `NhatKyMuc` → `DsLichSu` (LichSuThayDoi) + `BadgeMo` số; `.ls-hep` | k3, k5 | KHỚP |
| 2 | K5, K8: QL "Xem tất cả" (không "›") → panel 736 tại chỗ, lọc Mục + Người, dòng H4 có nhãn mục, Xem thêm, chân Đóng; QL vẫn 6 tab (XM-1) | `NhatKyMuc` nút → `KhungPanel rong="rong"` bọc `NhatKyDs` (cùng phần thân Nhật ký chung); `/admin/nhat-ky` chỉ nạp khi bấm | k8 | KHỚP |
| 3 | Quản trị giữ link "Xem tất cả ›" sang Nhật ký chung lọc sẵn mục | giữ | — | KHỚP |
| 4 | K5 một câu chỉ-xem, một chỗ: dải "Chỉ xem · Quản trị hệ thống sửa" dưới hàng tab, mọi tab cấu hình QL xem; bỏ câu dưới tiêu đề + câu lặp trong thẻ Hạn | `DaiChiXem lon` ở `AdminPage`; bỏ câu ở `HanMacDinhAdmin`, nhãn "🔒 Chỉ xem" ở `CauHinhCaseSos` | k3, k5 | KHỚP |
| 5 | K7 Nhật ký chung: "Mục" ô chọn thường A6 (8 mục cố định); "Người" ô chọn có tìm mẫu A (nhóm "Có trong nhật ký"); Từ / Đến ô tuần; Xoá lọc là nút; dòng dáng cột phải + nhãn mục | `OChonThuong` (chuyển từ Phân tích sang `ui/` dùng chung), `ChonLoc`, `ONgay`, `DsLichSu` | k7 | KHỚP |

**KHỚP 5 / 5 = 100 %.**

## 2. GIỮ / [XM]
- Bề rộng panel: `KhungPanel rong="rong"` = 720 (mockup 736 — dáng chung các panel rộng của web).
- Đo ✕ / ⋯: panel dùng ✕ chung `KhungPanel` (`NUT_DONG`, đã đo ≤ 1 px ở GD-4); PR này không thêm ✕ / ⋯ mới.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| QL xem nhật ký cấu hình | 8 dòng ở cột phải, không "Xem tất cả" | 8 dòng + nút "Xem tất cả" → panel tại chỗ (lọc Mục, Người, Xem thêm) |
| Quản trị "Xem tất cả ›" · Nhật ký chung: lọc Mục / Người / Từ / Đến · Xoá lọc · Xem thêm | có | giữ |

Không thao tác nào bị mất.

## 4. Lời 40
Badge "Nhật ký n" chỉ khi có dòng; rỗng → một câu ("Chưa đổi lần nào."); dải chỉ-xem chỉ với QL, không ở tab Đã xoá.

## 5. Hướng dẫn "?"
`ql.ts` (Xem cấu hình hệ thống): "Cột Nhật ký mỗi tab: Xem tất cả mở nhật ký cấu hình ngay tại trang (lọc Mục, Người)"; khoá dịch `shared/i18n/en/gd17QuanTri.ts`.

## 6. Turso — 0 khi mở trang
Cột phải dùng đường cũ (`/admin/nhat-ky?muc=&gioi-han=8`). Panel QL: `/admin/nhat-ky` chỉ khi bấm (50 dòng, như Nhật ký chung).

## 7. Sửa sau rà (PTA 14/11)
- Ảnh chụp lại bằng tài khoản Quản trị demo tên giả; nhánh đã gộp một commit, không còn ảnh cũ trong lịch sử.
- Nhật ký hiện chữ người đọc, sửa ở hàm dựng chung `nhatKyQuanTri.ts` (`giaTriDoc`): "Đạt từ: 65 % → 70 %", "Còn dùng: Không → Có", "Mở: Không → Có", "Số tuần: 10 tuần", "Cách chấm: Đúng / tổng". Phép kiểm `GD-17a-NK`.
