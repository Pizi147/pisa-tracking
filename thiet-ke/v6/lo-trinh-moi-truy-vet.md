# Truy vết — `lo-trinh-moi.html` (V6 · Lộ trình mới · Môn học)

> **MOCKUP-V6 · CHỜ CHỦ SP DUYỆT** (25/10). Mở khoá P7 (lộ trình mới) + P8 (môn học). Nguồn: spec 24/10 mục 3.3, 3.4, GPT 5, 6; Q2–Q5 (chủ SP chọn khuyến nghị 25/10).
> Ảnh: `anh/lo-trinh-moi-{1440-toi,375}.png`, từng khung `anh/lo-trinh-moi-k1…k7-*.png` (+ `-375`). Dữ liệu demo T2 14/09/2026.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh) | Thành phần |
|---|---|---|
| R2.3 panel một luồng | k1 `-k1-panel` | ‹ Bước tiếp · 1 Lộ trình LT1/LT2/RF/Khác · 2 Môn học 5 nút bật L R W1 W2 S · 3 Target giữ + Sửa · 4 Bắt đầu Ngay / Thứ Hai · 5 Lớp Giữ / Lớp khác (ô gõ lớp, lớp sai loại mờ) · "Khi lưu, web sẽ" (MT theo lịch lớp, đầu vào = KQ thi thật, Case / PA đóng "Kết thúc lộ trình") · toast Hoàn tác · lỗi giữ lựa chọn |
| Review Focus 4 lớp sai loại | k2 `-k2-rf-sai-loai` | lỗi tại ô Lớp + lý do cạnh nút tắt "Chọn lớp RF để lưu"; sau khi chọn lớp RF → tóm tắt MT1–MT2 |
| Q3 lộ trình Khác | k3 `-k3-khac` | ô Tên lộ trình (bắt buộc, lỗi tại ô), Target không bắt buộc + "Bỏ Target", 0 MT ("+ MT" ở Kế hoạch Test) |
| R3 Sửa thông tin HV · Q5 đổi môn giữa lộ trình | k4 `-k4-sua-thong-tin-doi-mon` | hàng "Môn học · FT LT1"; tóm tắt: bỏ khỏi MT chưa thi, giữ bài đã chấm, đóng Case "Không còn học môn", Writing = W2, Overall Không đủ bộ môn; bật lại; Lịch sử trước → sau |
| R3 Sửa cả lớp | k5 `-k5-sua-ca-lop` | cột Môn học (nút nhỏ trong ô, không trong tiêu đề), "Áp cho n em" ở thanh chọn, chân "1 em đã sửa … · Lưu 1 em" |
| R3 bảng lớp | k6 `-k6-bang-khong-hoc` | ô "Không học" (nghiêng, nhạt, nền sọc) ≠ "-" vắng ≠ "—" chưa điểm; chú giải ở hàng công cụ; Overall "– Không đủ bộ môn" |
| R3 hồ sơ chỉ môn học · Q4 | k7 `-k7-ho-so-hv` | dòng "Môn học L · R · W2 · S" (chỉ khi thiếu môn); tab W chỉ W2; W = W2; badge "MT3 · Không đủ bộ môn" |

## 2. Thao tác TRƯỚC → SAU (bảng 10.3)

| Tình huống | Trước | Sau | Ghi |
|---|---|---|---|
| Mở LT2 sau LT1 | Bước tiếp › Lộ trình mới › (Lớp này / Lớp khác + Bắt đầu) › Lưu — không chọn LT2 rõ, ngày thi cũ bị chép (E1), đầu vào trống (E3), lớp cũ đã kết thúc → lỗi 400 (E2) | Bước tiếp › Lộ trình mới › (LT2 chọn sẵn) › Mở lộ trình LT2: **3 bấm** | sửa E1–E3 |
| Mở RF hoặc Khác | không có "Khác"; RF chỉ khi lớp đích là lớp RF | chọn RF / Khác (+ tên) › lớp (nếu cần) › Mở: 4–5 bấm, lớp sai loại báo ngay | Q3 |
| Bỏ riêng W1 hoặc W2 | không làm được (phạm vi lượt chỉ QL, Writing một dòng) | ⋯ › Sửa thông tin › tắt W1 › Lưu (4) | Q4, cột `bo_task` |
| Đổi môn khi đã có bài / điểm | — | cùng 4 bấm; tóm tắt nói bài nào bỏ khỏi đợt, bài nào giữ, Case nào đóng | Q5 |
| Cả lớp không học S | — | Sửa cả lớp › Chọn tất cả › tắt S › Áp › Lưu (5) | |
| GIỮ | Hoàn tác Bước tiếp, Huỷ hẹn, Gia hạn, Target giữ + Sửa, Lịch sử | như cũ | V1 |

## 3. Giả định · cần xác minh

- Tuần MT1–MT3 trong tóm tắt tính theo tuần học 6 / 12 / 16 từ 14/09 (RF 4 / 8) — P7 lấy từ cùng hàm máy chủ.
- Ô môn học ở Lộ trình mới mặc định = môn của lộ trình cũ; Khác mặc định cũng vậy (ảnh k3 đã tắt bớt để minh hoạ).
- "Không đủ bộ môn" dùng nhóm badge kết quả, viền đứt như "Chưa đủ dữ liệu" — khác chữ, không thêm màu.
- [XM] Thêm HV / Dán Excel không có ô Môn học (spec 3.4) — chủ SP muốn khác thì thêm cột ở P8.
- Dữ liệu demo V6: CP FT 112 / 115 / RF 05, Case + PA S của Đinh Ngọc Quyên, MT3 W1–W2 của Lê Quang Huy.
