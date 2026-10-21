# Truy vết — `mockup-v4-hoc-vien-lop.html` (M4 Học viên & Lớp)

MOCKUP-V4b · PTA vẽ 21/10/2026 (Opus 5.5) · chủ SP duyệt sáng 22/10. Ảnh: `thiet-ke/anh/mockup-v4-hoc-vien-lop-<khung>.png`.
Nguồn: 07 M4 · 05 mục 1.5, 7.2, 7.4 · 04 mục 6, 10, 13 (ngoại lệ tháng), 15 · 02 mục 2.9 (Q-A4, Q-C3 ①, Q-C4 ①, Q-E2 ①) · tài liệu đánh giá 11.2 (V2A-02, V2A-04…08) · 06 mục 3 (m1 §2b GIỮ + sửa thời gian, m1 §3 GIỮ trừ cột tick, m5 §1 / §2 SỬA, m6 §1 §7 GIỮ).
Demo: 14/09/2026 · QL 2 Lê Thu Hằng · Monbay 129 em / 15 lớp · GV 7 Trần Ngọc Hà (khung v3).

## Quyết định → khung → thành phần

| Mã quyết định | Nội dung | Khung | Thành phần (04) |
|---|---|---|---|
| 05 1.5 | 3 góc Tất cả · Đang SOS · Lịch thi (nút đoạn có số) | v1, v2, v5, v9 | nút đoạn HTT-5 |
| Q-A4 ① (21/10) | "Cần làm" = chip lọc trong bảng Tất cả, giữ tên; bật → cột Việc · Người phụ trách · Hạn + nút động từ, quá hạn trước; việc cấp lớp trên hàng lớp; cùng hàm đếm với Công việc / Tổng quan | v2, v3, v4, v9 | chip lọc `BoLocDoan`, `Bang` |
| 11.2 | chip "⚠ n quá hạn" trên hàng lớp = bật "Cần làm" cho lớp đó | v1 | `OSo` |
| C10 · m1 §2b | dải lọc dính: Chi nhánh · Chương trình · Bộ lọc thêm · Đang lọc [chip ✕] · Bỏ lọc | v1, v2, v5 | dải lọc (M0) |
| X-36 · m1 §3 | hàng lớp tóm tắt (em · GVCN · SOS 1/2/3 · Đã thi · Case · ⚠), lớp đầu mở | v1 | hàng nhóm 52 px |
| 11.2 | cột "Thi thật" (gộp Dự kiến thi + Sắp tới) dùng chip A / B | v1, v5 | chip lịch thi (MỚI — cùng ho-so h3) |
| Q-E2 ① · 05 7.4 | bỏ cột tick; panel Xuất 560 có khối "Học viên · n" gom theo lớp, chọn sẵn, tìm, tick bỏ; từ điển cột; "Xuất 16 HV"; nhật ký | v8 | vỏ "Khung việc", ô tích |
| Q-C3 ① · Q-C4 ① · 05 7.2 | Lịch thi lọc "Tháng dự kiến 09/2026 → 10/2026" (ngoại lệ tháng) · nhóm theo trạng thái · 2 nút Chốt ngày · Dời tháng · bỏ "Cần xác nhận" / "Giữ tháng" → "Chưa kết luận" · có tuần chưa ngày = B · mở dưới hàng | v5 | `Bang`, mở dưới hàng 2b, hộp neo 2a |
| 05 7.2 | "Chốt ngày thi" hộp neo `ONgay` (cho ngày đã qua → "Em đã thi 28/08?" → việc TVV Cập nhật KQ thi thật); "Dời tháng" mặc định tháng sau; người giữ TVV (QL khi thiếu); không hạn | v5, v6, v7, v10 | hộp neo 2a / tấm dưới đáy 375 |
| 05 1.3 (quyền) | QL ở "Cần làm" thấy việc GV với nút "Làm thay" (Case); việc của QL nút chính | v2, v9 | — |
| 13/10-VAI | GV bật "Cần làm" chỉ thấy việc của mình (không Chờ duyệt, Thiếu thông tin) | v3 | — |
| HTT-9 | rỗng "Cần làm" một câu + bước tiếp | v4 | — |
| 04 6.4 · m4 §5 | 375: thẻ; hộp neo = tấm dưới đáy; ô ngày 16 px, nút 44 | v9, v10 | `TheDong` |
| 04 15 | thứ tự menu; đầu trang một hàng (Xuất · + Thêm học viên chính) | mọi khung 1440 | — |

## Đích đo

| Khung | Đích |
|---|---|
| v1 | "lớp 101 còn việc gì?" 1 bấm · hàng 44 · cột điểm 80 căn giữa |
| v2 | "em nào cả chi nhánh có việc quá hạn?" 1 bấm · số chip "Cần làm" = số việc trong bảng = cùng hàm Công việc |
| v5 | 10 hàng ≈ 1 màn · 2 nút / hàng · Chốt ngày 2 bấm |
| v8 | cả chi nhánh bỏ 2 em ≤ 6 bấm |

## BỎ

- Góc riêng "Cần làm" (bảng 5 cột "Cả lớp · n em", "Người giữ", "Hạn" 2 dòng, nút "Mở") · đếm theo trang.
- Cột tick + "Chọn tất cả HV đang hiện ở trang này" (bảng) · đổi bộ lọc mất chọn.
- "Mọi lúc ✕", "Chọn khoảng", tiền tố "Phạm vi: / Loại lớp: / Xếp:" · dòng "W1 · W2" 11 px dưới điểm.
- Lịch thi: 4 nút Kết luận ("Cần xác nhận", "Giữ tháng"…) · 12 nút tháng · ô "Tháng dự kiến thi ▾" mỗi hàng · "Gồm HV chưa có dự kiến thi · 41" trộn bảng · dải đếm cộng sai · chặn ngày đã qua · "Ghi chú họp" · "Lịch hiện tại" · lấy cuối tháng làm ngày thi (LT-SV).

## GIỮ

- m1 §2b dải lọc dính (Bộ lọc thêm › Thời gian: trống = không lọc, không "Toàn bộ") · m1 §3 hàng lớp · m6 §1 Đang SOS (không bộ lọc thời gian) · m6 §7 · "Chọn nhiều" ở hồ sơ lớp · dữ liệu "Cần xác nhận" cũ giữ trong DB (không migrate).

## Cần chủ SP chọn

1. "Chưa kết luận" (Q-C4 ①) đặt ở cột Ghi chú khi chưa có ghi chú — không thêm cột.
2. Đã chốt ngày vẫn có "Sửa ngày" (luật 3, có lịch sử).
3. "Cần làm" của QL: việc Case của GV nút "Làm thay"; việc nhập điểm không hiện ở đây (ở Công việc › Việc của GV).
