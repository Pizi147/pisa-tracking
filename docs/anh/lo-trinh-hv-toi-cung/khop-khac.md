# Lộ trình theo HV tới cùng — bản rà 11/11 mục 3 #9 + [XM 2]

Chủ SP 11/11: "Theo hết 10 đề xuất" + [XM 2] "Ok" (Admin đổi được lộ trình). Chỉnh nhỏ theo mẫu sẵn có (một cột lưới, một dòng chữ mờ dưới tên, đổi nhãn, một mục ⋯) — không cần mockup.
Ảnh "trước": `docs/superpowers/specs/2026-11-11-ra-toan-bo/anh/` (G4-01, G4-08, G4-09, G4-10, G4-16, G4-57…59, G4-71, G4-72). Ảnh "sau": `sau-*.png` (seed 14/09, em Bùi Thảo Vy MB FT 101 đổi LT1 → RF).

## Thao tác TRƯỚC → SAU

| Chỗ | Trước | Sau | Gốc |
|---|---|---|---|
| + Thêm học viên › lớp FT | không có cột Lộ trình; dán cột "Lộ trình" khác lớp → "Bỏ qua — lộ trình theo lớp" | cột **Lộ trình** (LT1 · LT2 · RF, mặc định lộ trình lớp); dán nhận LT2 / rf; mã lạ / "Khác" → lưu ý, theo lớp; lịch MT tạo theo lộ trình em | G4-01 |
| Học viên & Lớp · ô Lộ trình | "MT 2/3 · Target 7.0" (em RF trong lớp LT1 không nhận ra) | "**RF** · MT 2/3" khi khác lộ trình lớp (0 câu thêm) | G4-02 |
| Hồ sơ lớp · dưới tên em | — | "Lộ trình RF" (chữ mờ như TVV) khi khác lộ trình lớp; 375 cùng chỗ | G4-02 |
| Hồ sơ HV › ⋯ | "Lộ trình" (mở Lịch MT hệ thống đề xuất) | "**Lịch MT**" (tiêu đề panel cũng "Lịch MT"); đổi LT1 · LT2 · RF vẫn ở Sửa thông tin | G4-03 |
| Hồ sơ HV › ⋯ sau khi đã chọn Bước tiếp | không có lối; tab › Tổng kết › Xem (4 bấm) | "**Bước tiếp…**" mở thẳng panel Bước tiếp (xem / đổi / Hoàn tác) — chỉ khi đã chọn + người xem đổi được | G4-10 |
| Sửa thông tin (người đổi thẳng được lộ trình) | nút "Đề xuất sửa lộ trình / thông tin khác…" → form có lựa chọn Lộ trình | "Đề xuất sửa **Target** / thông tin khác…"; form bỏ lựa chọn Lộ trình (người không đổi được — GV bộ môn — giữ như cũ) | G4-12 |
| Tạo lớp FT · Thông tin lớp | nhãn "Lộ trình" | "**Lịch MT mặc định**" (giữ LT1 · LT2 · RF) | G4-16 |
| Sửa thông tin · Admin (`office_admin`) | "Lộ trình đang học · LT1" chỉ đọc | ô LT1 · LT2 · RF đổi được + Hoàn tác (máy chủ `duocDoiLoTrinh`, chi nhánh em); Admin KHÔNG đổi Môn học | G4-13 [XM 2] |

Không mất thao tác nào. Phân công GV vẫn ghi "LT1 · 33 HV" (dòng phụ gọn — không đổi).

## Hình ảnh
- Lưới Thêm học viên FT: thêm cột 80 px; Họ tên 170 → 160, Email 190 → 176, Dự kiến thi / Đã thi tới MT 104 → 96, Tuần bắt đầu 172 → 150, Trạng thái 120 → 100 để cả lưới vừa 1440 (trước đó cột Trạng thái bị cắt). Ô Lộ trình là `<select class="field">` như ô sẵn có.
- Không đổi màu, cỡ chữ.

## Đọc Turso
0 câu thêm khi mở trang (cột `cy.route`, `c.route` đã có trong câu danh sách; ô chọn dùng danh mục tĩnh `ROUTE_LO_TRINH_MOI`). Thêm học viên: +1 câu đọc danh mục lộ trình mỗi lần xem trước lớp FT.
