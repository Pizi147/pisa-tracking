# GD-21 SAP-TOI + CASE-THEO-BUOC + SAO-CHEP — mockup ⑬ `thiet-ke/v21/theo-doi.html` (lời 51, 52)

Ảnh cặp (trái mockup │ phải web; demo 14/09, GV Trần Ngọc Hà id 7, QL Nguyễn Khánh Vy id 2; Playwright, 1:1): `cap-1440-toi-a1.png` (Sắp tới) · `cap-1440-toi-b1.png` (panel Case, mở từ ô 38) · `cap-1440-toi-c3.png` (Sao chép, panel một GV) · `cap-375-sang-a5.png` (Sắp tới 375) · `cap-375-sang-b6.png` (panel Case 375).
Số liệu seed khác mockup (vd Sắp tới "Test tuần tới 4", bước 27 / 9 / 0 / 2) — dữ liệu vẽ tay của mockup, không phải lỗi.

## Cổng ≥ 90 % KHỚP (tự chấm; chủ SP duyệt ảnh)
- **A (Sắp tới): KHỚP** dải, nhãn, cụm, số gạch chân, ⓘ; hộp nhỏ `role="dialog"`, Esc trả tiêu điểm (XM-8). Hộp "Kết quả PA": số + kỳ + link "Công việc ›" (PTA chốt).
- **C (Sao chép): KHỚP** biểu tượng hai tờ giấy 36 px (375: 44), không chữ, không khung; ✓ xanh 2 giây; chữ chép đúng XM-6.
- **B (panel Case): ≈ 90–92 %.** Dòng Case nay là bảng chuẩn `Bang` (Học viên · Case · Phụ trách · Hạn), dải nhóm theo bước, dải bước liền khối + ngoặc "Chưa có PA", tiêu đề "Case chưa có PA · 38", ⓘ, thẻ 375. Cột Case như mockup (lượt · kỹ năng · SOS / "5.5 · kỳ vọng 6.5"), ngoặc "Chưa có PA" trùm hai bước đầu, dòng "Fast Track · hiện tại", nhóm hiện vài dòng + "+ n Case". Còn KHÁC: tên Case dài / số bước khác mockup do dữ liệu seed; chưa có tên chi nhánh trong tiêu đề (cần thêm một lần đọc tên chi nhánh).

## [XM] PTA Plan đã chốt
1. Panel mở từ ô nào = ĐÚNG tập Case của ô đó (38 = 38 dòng); dải bước chỉ đếm tập đó, không bật sẵn bước nào; 2 Case "PA xong · chờ đóng" ở "Chờ kết quả cuối". Ngoặc "Chưa có PA · 36" là nút lọc.
2. Hộp "Kết quả PA" chỉ số + kỳ + link Công việc.

## Bảng thao tác TRƯỚC → SAU
| Việc | TRƯỚC | SAU | Mất? |
|---|---|---|---|
| GV biết 7 ngày tới có gì | tự nhớ / mở Lịch Test | dòng Sắp tới trang đầu; bấm số → hộp → link lớp / Lịch Test / tab Báo cáo PH | — |
| QL bấm ô 38 / số 45 | 38: nhóm 6 loại; 45: danh sách phẳng | cùng panel, dải 4 bước, nhóm theo bước (vạch trung tính, "n quá hạn" đỏ ở đầu nhóm) | không |
| QL lọc theo bước | không có | bấm bước / ngoặc; "Bỏ lọc bước"; "Đang lọc: … · n" | — |
| Mở Case, Xác nhận PA tại chỗ, Case tiếp ›, Hoàn tác | có | giữ y nguyên | không |
| Mở hồ sơ HV từ dòng Case | link "Hồ sơ" cuối dòng | tên HV là link (mockup bỏ chữ "Hồ sơ") | đổi chỗ bấm |
| Nhắc GV quá hạn | chụp màn / gõ tay | biểu tượng sao chép ở panel "Bài quá hạn" (một GV, nhiều GV) và panel "Chưa làm" (Phân tích) → dán Zalo | — |

## Turso
0 câu thêm: Sắp tới dùng `sapToi` + `testSapToi` đã có trong `/my-work`; dải bước đếm trên dòng đã nạp; Sao chép ghép chữ từ dữ liệu panel. (Đo `/my-work` GV không đổi — chưa thêm trường nào.)

## ponytail:
`SapToi.tsx` hộp PA chỉ số + kỳ (xem [XM] 2). Skill đã chạy: karpathy-guidelines, web-design-guidelines (không phát hiện lỗi ở tệp mới), ponytail-review (không có gì đáng cắt). `impeccable audit` chạy ở mức đọc tay (aria-label, tiêu điểm, 44 px 375, V22 không ⚠ ở hạn).

## Đề mục Case chỉ khi GV sửa — kiểm trên BẢN CHÉP THẬT (`pisa-pisatracking-261107-…-2026-11-12-0112.sqlite`, chép ra thư mục tạm, chỉ đọc)
`deMucRieng` (`shared/domain/deMucCase.ts`) so sau khi bỏ "[…]" (MTn · SOS n · KCK · Progress / Final Test), tiền tố "MTn - " / "Progress Test - ", đuôi "không đạt" / "chưa đạt" / "dưới kỳ vọng", với tên môn dài · ngắn · theo chương trình · nhãn nhóm.
Kết quả: 892 Case, 329 có `title`, **83 coi là tên riêng**, TẤT CẢ là Case `teacher_report` (GV tự gõ; 0 Case `mock`). 246 `title` còn lại là tên tự sinh ("Listening không đạt", "G+V không đạt", "P không đạt"…) → ẩn.
10 mẫu tên riêng: #4 "Vấn đề về phát triển nội dung" · #5 "Listening + Reading - Thiếu từ vựng, học lực yếu" · #6 "Học sinh biết cách làm bài nhưng khả năng đọc hiểu tổng thể…" · #7 "Cần hỗ trợ W2 đến lúc thi" · #8 "Học sinh mock" · #37 "Reading - làm passage 3 còn sai nhiều" · #379 "Listening and Speaking chưa theo được lớp" · #380 / #381 / #382 "Bổ trợ Lis".
