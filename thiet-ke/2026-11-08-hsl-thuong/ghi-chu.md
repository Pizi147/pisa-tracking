# Mockup HSL-THUONG — ghi chú (08/11)

Tệp: `thiet-ke/2026-11-08-hsl-thuong.html` (mở bằng máy chủ tĩnh ở thư mục `thiet-ke/`). Ảnh TRƯỚC: `truoc/` — web main, seed 14/09/2026, GV Trần Ngọc Hà,
1440 + 375, sáng + tối: `fou22-*` (MB FOU 22, em Lâm Gia Bảo CT mở), `fou15-*` (MB FOU 15, em Lê Hoàng Anh mở), `ft101-*` (MB FT 101 để so dáng FT).

## Tự rà theo lời chủ SP 08/11

| Ý chủ SP / PTA | Đạt? |
|---|---|
| Khung Case khi bấm tên em "rất xấu" | Đạt — khu A: một khối, một hàng nhãn cột, mỗi Case một hàng lưới; cột phải hết trống |
| "Trường thông tin hơi chán" | Đạt — tách trường: viên trạng thái · PA một dòng ngắn (chi tiết khi rê) · người tách cột · việc là nút · hạn cột phải; bỏ chuỗi 5–6 trường nối "·", bỏ lặp "đến Cuối khoá" |
| FT nâng cấp gì thì lớp thường đồng bộ | Đạt — khu E liệt kê 15 mục: đồng bộ (KCK, mới vào, TVV, hàng mở, tách trường, hạn, thẻ 375, B11) / khác vì workflow (chip lọc, dải mở, Kết quả / Ngày thi, tiêu chí W/S) |
| Case theo kỹ năng | Đạt — cột "Môn" (tên môn của chương trình: L R G+V P) |
| Trạng thái là viên | Đạt — `NhanTrangThai` giữ tên, đổi dáng thành viên (chữ + màu, không chỉ màu) |
| PA một dòng ngắn, chi tiết khi rê / mở | Đạt — đoạn đầu tên PA + dòng phụ mốc mã tuần; nút ⓘ mở hộp nhỏ đủ đoạn (A hàng R, C 375) |
| Việc + hạn ở cột phải | Đạt |
| Nút "Hồ sơ HV ›" / "+ Case" | Đạt — giữ, đầu khối |
| Bảng Progress / Final đồng bộ dáng FT | Đạt — khu B |
| 1440 + 375, sáng + tối, đủ trạng thái | Đạt — A tối, B sáng, C 375 sáng + tối, D: quá hạn, Chờ duyệt, chưa có PA, chỉ đọc (TVV/CX), rỗng, đang tải, lỗi; nút "Đảo sáng / tối" |
| Bảng TRƯỚC \| SAU | Đạt — ảnh TRƯỚC cạnh khung SAU ở A, B, C |
| GIỮ thao tác (⋯, Lộ trình, nhập điểm, + Case…) | Đạt — khu F, không mất thao tác |
| Dòng đọc Turso | Không thêm request (khu F) |

## Câu hỏi [XM] cho PTA

1. Nhãn viên giữ chữ `NhanTrangThai` hiện có ("Đang làm / Cần làm / Chờ duyệt"), chữ đủ ở rê — hay đổi "Cần làm" thành "Chờ xác nhận"?
2. "nguyên nhân · mức" (vd "Từ vựng · Bình thường"): SAU chỉ giữ nguyên nhân dưới tên Case, mức vào hộp rê — được không?
3. Tên Case lớp thường dài ("Progress Test - Pronunciation dưới kỳ vọng"): giữ nguyên, kẹp 2 dòng — không tự rút gọn dữ liệu.

## Critique (cổng chất lượng 28/10)

- Vòng 1 — `impeccable critique` hai đánh giá tách biệt (A rà thiết kế · B bộ dò + đo trong trang): **27 / 40**.
  - P1 chi tiết PA chỉ rê được (không chạm / bàn phím) → thêm nút ⓘ sau PA ngắn (bấm / Enter / chạm, 44 px ở 375), bỏ gạch chấm; vẽ trạng thái mở ở 375.
  - P1 dòng Case 1440 và 375 lệch (SOS, nguyên nhân) → một mẫu: SOS cạnh tên, nguyên nhân dòng phụ, cả hai bề rộng.
  - P2 hạn quá hạn "⚠ 2 ngày" mơ hồ → "⚠ quá hạn 2 ngày". P2 "+ Case" nút chính lấn nút việc → "+ Case" trong khối thành nút thường.
  - B: vùng chạm tên em / ▾ ở 375 < 44 px → 44 px. Bộ dò: 45 mục, còn lại là báo nhầm (nền / chú thích của phần đọc mockup, viền đứt vàng, vạch trái 3 px hàng mở, Inter cho chữ số). Đo trong trang: không chữ < 11 px, không tương phản < 4,5 : 1, không tràn ngang 375.
  - Bổ sung F: "Điểm Test của lớp" giữ; QL thấy việc duyệt như nay; tên đọc màn của nút việc có môn.
- Vòng 2 (tự chấm sau sửa): **30 / 40**, không còn P0 / P1. Theo cổng: đã chạm 30 → chỉ cần không P0 / P1.
- Để chủ SP cân nhắc (P3, không làm): bốn Case cùng PA lặp chữ (MB FOU 22) — có thể gộp "cùng PA"; tên Case lặp tên môn — là dữ liệu, không tự rút gọn.
