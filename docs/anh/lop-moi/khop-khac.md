# LOP-MOI + CUOI-KHOA (AU-LUI · gói 3 audit 16/11 + N47) — khớp / khác + thao tác TRƯỚC → SAU

Không mockup mới (audit: "không cần mockup"); ảnh cặp **trước (main) | sau (PR)**, demo, tối, 1440 + 375. Hình theo khuôn sẵn có (KhungPanel, ChonLop, thanh "Áp cho n em").

## Thao tác TRƯỚC → SAU

| Mã | Màn / vai | TRƯỚC | SAU | Mất thao tác? |
|---|---|---|---|---|
| N47 (B3-04 = A2-22) | Hồ sơ lớp › ⋯ › + Học viên · HV & Lớp › + Thêm học viên (dán Excel / gõ tay) · QL | Ô "Tuần bắt đầu" mặc định = tuần khai giảng → em vào lớp đang ở tuần 8 có "4 MT cũ chưa có điểm" + việc "Nhập điểm MT cũ" cho GV; chip lớp sau lưu vẫn đếm số em cũ | Lớp đã chạy: mặc định **tuần này** (lớp chưa khai giảng: tuần khai giảng); lịch MT từ tuần đó, không MT cũ; vẫn đổi được tuần; cột "Tuần bắt đầu" dán từ Excel thắng; chip lớp đếm lại sau lưu | Không |
| P1-16 | HV & Lớp › ⋯ › + Lớp mới · QL | Tạo lớp → toast "Đã tạo lớp" nhưng hộp không đóng: ô Số lớp đỏ "Đã có lớp …", hỏi "Bỏ chữ đang gõ?" | Tạo lớp → đánh dấu đã lưu ngay, mở hồ sơ lớp mới (hoặc đóng hộp ở Cuối khoá), không hỏi, không báo trùng với chính lớp vừa tạo | Không — bớt 1 hộp |
| B3-17 | + Lớp mới › Phân công · QL | Chọn GVCN → chặn "GVCN phải dạy ít nhất một kỹ năng" dù hồ sơ GV có kỹ năng; phải gõ + chọn từng ô môn | Chọn GVCN → các ô môn CÒN TRỐNG người đó dạy được hết điền sẵn (sửa / bỏ được); ô đã chọn người khác giữ | Không — bớt ~2 bấm |
| B3-13 | Cuối khoá › ô "Lớp cho cả nhóm" › + Mở lớp mới… · QL | Hộp "Mở lớp mới · cho 0 em"; tạo xong ô nhóm vẫn trống, phải gõ + chọn lại | Hộp đếm đúng số em của nhóm ("cho 3 em"); tạo xong lớp mới điền vào ô nhóm và áp cho cả nhóm | Không — bớt 2 bấm |
| B3-14 | Cuối khoá › ô "Lớp cho cả nhóm" · QL | Chỉ áp cho em trong nhóm gợi ý — em QL bấm tay cùng bước vẫn "chờ chọn lớp" | Áp cho MỌI em đang chọn đúng bước của nhóm (dòng không nhảy chỗ); em đã "Đổi lớp" riêng giữ | Không |
| B3-16 | Hồ sơ lớp › ⋯ › Sửa thông tin học viên · QL | Thanh áp chung chỉ "Môn học" (chỉ khi lớp có môn học, chỉ chọn được em FT); đổi TVV / Target 5 em = sửa từng dòng | Thanh áp chung luôn có: chọn em (mọi em) · Môn học (chỉ áp em FT) · TVV (mọi em) · Target (em có lộ trình, khi được đổi Target) — mỗi ô một nút "Áp cho n em" | Không — đổi TVV 5 em 13 → ~9 bấm |

## KHÁC (có lý do)

- Seed demo (7 tệp) và phép kiểm chuỗi ghi tuần khai giảng TƯỜNG MINH khi thêm em — giữ dữ liệu demo / phép kiểm dựa vào; không đổi hành vi người dùng.
- Kiểm "cận năm" của ô tuần (VN21) nay miễn cả tuần khai giảng (trước chỉ miễn tuần mặc định — nay mặc định là tuần này).

## Ảnh

`cap-*.png` — trước (main) | sau (PR). Xem bảng ảnh ở mô tả PR.
