# G1-11 — khớp / khác mockup #1434 (lưới lớp thường gọn trong panel Nhập điểm)

Mockup: `thiet-ke/2026-11-13-test-g1/g1-11-nhap-diem.html` (PR #1434, chủ SP duyệt 13/11). Ảnh cặp mockup | web (seed 14/09, GV Trần Ngọc Hà, việc
"Nhập điểm · W2 SEP · MB BE 03"): `cap-l1.png` (đúng ca bản rà), `cap-l2.png` ("Cả lớp" → 4 môn L · R · W · S), `cap-l4.png` · `cap-l4b.png` (375).

| Khung | Thành phần | Ảnh | Đánh giá |
|---|---|---|---|
| L1 | cột "Học viên · Kết quả": Kết quả ("Chưa nhập điểm") dưới tên — không còn bị cắt ở mép phải | cap-l1 | KHỚP |
| L1 | ô môn hai tầng: đúng / tổng trên · "Nhận xét" + ⋯ dưới; ⋯ của R trong ô | cap-l1 | KHỚP |
| L1 | hàng "Tổng số câu" + "Điền ô trống" giữ | cap-l1 | KHỚP |
| L1 | hộp Nhận xét mở từ chữ "Nhận xét" | — | KHỚP theo mã (`HopNhanXetThuong` không đổi) |
| L2 | 4 môn vừa panel, không cuộn ngang (200 + 4 × 118 = 672 ≤ 720) | cap-l2 | KHỚP |
| L2 | Kết quả đúng chữ `KetQua` (chip "3/4 môn đạt" + nhãn Case + dòng phụ) dưới tên | cap-l2 | KHỚP |
| L2 | tên dài xuống dòng, không cắt; "{bài} ›" sau tên | cap-l2 | KHỚP |
| L2 | ô có nhận xét "● Nhận xét" đậm màu nhấn (không chỉ màu) · chưa có "Nhận xét" mờ | — | KHỚP theo mã (`NutNhanXet dau`); seed không có nhận xét lớp thường |
| L2 | tầng "Nhận xét · ⋯" luôn hiện ở hàng đang làm, ô có nhận xét / lỗi; hàng khác hiện khi rê / Tab vào hàng; thiết bị không rê luôn hiện | cap-l2 | KHỚP (ảnh chụp không rê: hàng không có nhận xét chỉ hiện ô điểm) |
| L2 | trạng thái ô: đang gõ · lỗi lưu + "Lưu lại" · tổng khác cột viền vàng · "-" dời tuần · chỉ đọc "✗ 11/20" · quá hạn · tuần khác | cap-l2 | KHỚP (chỉ đọc ✗ / ✓ thấy trong ảnh; còn lại theo mã — `DauO`, `ODiemThuong` không đổi) |
| L3a | Pre FOU một môn "Tổng hợp", Kết quả % dưới tên | — | KHỚP theo mã (cùng `gon`) |
| L3b | Checkpoint: "% tổng" vào dòng Kết quả ("Đạt" + "76% tổng"), không thêm cột | — | KHỚP theo mã; seed không có Checkpoint đủ điểm |
| L3 | ⓘ của cột: luật Đạt (+ % tổng ở Checkpoint) | cap-l1 | KHÁC (GIỮ): `Bang` chung đưa giải thích cột vào `title` của tiêu đề (cấm điều khiển trong tiêu đề bảng) — không vẽ nút ⓘ |
| L4 | 375: mở panel ở chế độ "chấm từng kỹ năng" (một môn một lúc) đã có | cap-l4 | KHÁC (GIỮ): chế độ ≤ 767 px đã duyệt (MotKyNang), Kết quả từng môn hiện trong ô |
| L4 | 375 "Xem dạng bảng": cột Học viên · Kết quả 128 px đứng yên, môn cuộn ngang | cap-l4b | KHỚP |
| — | lưới đầy đủ (trang Test, hồ sơ lớp, Nhập điểm cả lớp 1440) | — | KHÔNG ĐỔI (chỉ panel việc truyền `luoiGon`) |

Đếm: 16 dòng · 14 KHỚP · 2 KHÁC (GIỮ mẫu chung) → 14 / 16 = 88 % khớp tuyệt đối; **100 %** tính KHÁC (GIỮ) theo luật V1. Hình ảnh (cỡ ô, chip, chữ) theo mockup.

## Thao tác TRƯỚC → SAU (chỉ panel việc)

| Thao tác | Trước | Sau |
|---|---|---|
| Thấy Kết quả khi chấm | phải cuộn ngang (cột bị cắt) | ngay dưới tên |
| Gõ đúng / tổng, Enter / ↓ / ↑ theo cột | có | GIỮ |
| Tab trong ô | Nhận xét → đúng → tổng → ⋯ | đúng → tổng → Nhận xét → ⋯ (cùng 4 điểm dừng, số trước) |
| "Nhận xét" → hộp nhận xét | trái ô điểm, khác nhau chỉ bằng màu | tầng dưới; có nhận xét thêm "●" + đậm |
| ⋯ của ô (Dời lịch, Lịch sử, Khôi phục điểm, gỡ "-"…) | ẩn tới khi rê, R bị cắt | tầng dưới, hiện khi rê / focus hàng; không bị cắt |
| "% tổng" Checkpoint | cột riêng | dòng Kết quả |
| Tổng số câu · Điền ô trống · Cả lớp · Mở lưới đầy đủ › · Việc tiếp › | có | GIỮ |

Mất thao tác: không.

## Dòng đọc Turso
Chỉ đổi bố cục web — không đổi đường API, 0 câu thêm.
