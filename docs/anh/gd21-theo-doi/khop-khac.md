# GD-21 SAP-TOI + CASE-THEO-BUOC + SAO-CHEP — mockup ⑬ `thiet-ke/v21/theo-doi.html` (lời 51, 52)

Ảnh cặp (trái mockup │ phải web; demo 14/09, GV Trần Ngọc Hà id 7, QL Nguyễn Khánh Vy id 2; Playwright, 1:1): `cap-1440-toi-a1.png` (Sắp tới) · `cap-1440-toi-b1.png` (panel Case, mở từ ô 38) · `cap-1440-toi-c3.png` (Sao chép, panel một GV) · `cap-375-sang-a5.png` (Sắp tới 375).
Số liệu seed khác mockup (vd Sắp tới "Test tuần tới 4", bước 27 / 9 / 0 / 2) — dữ liệu vẽ tay của mockup, không phải lỗi.

## Trung thực về cổng ≥ 90 %
- **A (Sắp tới): KHỚP** dải, nhãn, cụm, số gạch chân, ⓘ; hộp nhỏ có `role="dialog"`, Esc trả tiêu điểm (XM-8).
- **C (Sao chép): KHỚP** biểu tượng hai tờ giấy 36 px (375: 44), không chữ, không khung; ✓ xanh 2 giây; chữ chép ra đúng mẫu XM-6.
- **B (panel Case): CHƯA đạt 90 %.** Dải bước + ngoặc + lọc + tiêu đề theo nguồn đã làm; **dòng Case vẫn dáng cũ** (em · Case · lớp · điểm ✗ / kỳ vọng · GV · "Hồ sơ"), chưa đổi sang bảng chuẩn `.bang` (Học viên · Case · Phụ trách · Hạn) như mockup B1. [KHÁC — để PR sau, đã ghi Việc để sau].

## [XM] hỏi PTA Plan
1. **Ô 38 ≠ hai bước đầu (XM-1):** trên seed, ô "Case chưa có PA" = 38 Case gồm 36 ở Chờ mô tả + Chờ chọn PA và **2 ở Chờ kết quả cuối** (nhóm "PA xong · chờ đóng Case"). Vì vậy web KHÔNG bật sẵn hai bước đầu (sẽ hiện 36 ≠ 38) mà hiện đủ 38, ngoặc "Chưa có PA · 36" bấm để lọc. Hai tập khác nhau → theo XM-1 giữ hai tên + ⓘ; chưa đổi nhãn "Chưa chốt PA" ở Phân tích. Quyết: đưa 2 Case đó ra khỏi ô 38, hay giữ như nay?
2. **Hộp "Kết quả PA" của Sắp tới** chỉ có số + kỳ, chưa có em · lớp · kỹ năng từng PA (`sapToi` LG-13 chỉ trả số + hạn; 0 câu thêm theo yêu cầu). Cần LG trả danh sách nếu muốn đúng mockup A2.
3. Bước "Đang chạy" của nguồn "chưa có PA" luôn 0 (đúng định nghĩa); chỉ có số ở nguồn "Case đang mở 45".

## Bảng thao tác TRƯỚC → SAU
| Việc | TRƯỚC | SAU | Mất? |
|---|---|---|---|
| GV biết 7 ngày tới có gì | tự nhớ / mở Lịch Test | dòng Sắp tới trang đầu; bấm số → hộp → link lớp / Lịch Test / tab Báo cáo PH | — |
| QL bấm ô 38 / số 45 | 38: nhóm 6 loại; 45: danh sách phẳng | cùng panel, dải 4 bước, nhóm theo bước (vạch trung tính, "n quá hạn" đỏ ở đầu nhóm) | không |
| QL lọc theo bước | không có | bấm bước / ngoặc; "Bỏ lọc bước"; "Đang lọc: … · n" | — |
| Mở Case, Xác nhận PA tại chỗ, Case tiếp ›, Hoàn tác, Hồ sơ | có | giữ y nguyên | không |
| Nhắc GV quá hạn | chụp màn / gõ tay | biểu tượng sao chép ở panel "Bài quá hạn" (một GV, nhiều GV) và panel "Chưa làm" (Phân tích) → dán Zalo | — |

## Turso
0 câu thêm: Sắp tới dùng `sapToi` + `testSapToi` đã có trong `/my-work`; dải bước đếm trên dòng đã nạp; Sao chép ghép chữ từ dữ liệu panel. (Đo `/my-work` GV không đổi — chưa thêm trường nào.)

## ponytail:
`SapToi.tsx` hộp PA chỉ số + kỳ (xem [XM] 2). Skill đã chạy: karpathy-guidelines, web-design-guidelines (không phát hiện lỗi ở tệp mới), ponytail-review (không có gì đáng cắt). `impeccable audit` chạy ở mức đọc tay (aria-label, tiêu điểm, 44 px 375, V22 không ⚠ ở hạn).
