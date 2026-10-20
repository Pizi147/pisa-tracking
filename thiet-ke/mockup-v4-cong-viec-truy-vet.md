# Truy vết — `mockup-v4-cong-viec.html` (M2 Công việc + hộp "Nhắc việc")

MOCKUP-V4b · PTA vẽ 21/10/2026 (Opus 5.5) · chủ SP duyệt sáng 22/10. Ảnh: `thiet-ke/anh/mockup-v4-cong-viec-<khung>.png`.
Nguồn: 07 M2 · 05 mục 1.2, 1.3, 2.1–2.7, 3.2, 3.4 · 04 mục 3, 4, 8, 9, 11, 12, 15 · 02 mục 2.9 (Q-A1 ①, Q-A2 ①, luật S chéo 21/10) · 06 mục 3 (m2 §1 "Sau", §2, §2b, §3 SỬA; OV-13 §1 SỬA) · v4a V4A-01…06.
Demo: 14/09/2026 (T2), tuần này W3 SEP; bài thi W2 SEP hạn 16/09. Vai: GV 7 Trần Ngọc Hà (GVCN MB FT 101, dạy L R), QL 2 Lê Thu Hằng (Monbay), GV S Hoàng Văn Nam (không dạy lớp).

## Quyết định → khung → thành phần

| Mã quyết định | Nội dung | Khung | Thành phần (04) |
|---|---|---|---|
| 05 2.2 A (PTA, gói 21/10) | dòng 3 vùng Hạn · Việc + đối tượng · vùng mở; nhóm cố định theo vai | k1, k2, k3, k14, k16 | `DongViec`, `HangDoiViec` |
| 05 2.2 | GV: Chấm điểm (vạch Quá hạn · Tuần này · Sau gập) · Case học thuật · Ý thức & Phối hợp · Lớp & hồ sơ | k1, k2, k3 | hàng nhóm 40 px (04 6.3) |
| 05 2.2 · 04 4.4 | nợ chấm cũ ≥ 14 ngày cùng lớp × môn gom một dòng | k1, k3, k17, k18 | `DongViec` gom |
| 05 3.2 B | nhãn bài chấm "MT5 · thi W2 SEP" + hạn ở vùng 1 (không thứ) | k1–k3, k13 | một hàm nhãn |
| 05 2.2 | "Bị từ chối" thành việc "Sửa đề xuất · bị từ chối" trong nhóm | k1, k2 | `DongViec` |
| 04 15 · 05 2.2 | vào trang chọn sẵn dòng đầu chỉ khi là việc của chính người xem | k1 (GV: chọn) · k14 (QL: chọn GV đầu, không mở việc) | `HangDoiViec` |
| 04 9.1 (khuôn 6 phần) | đầu dính · bối cảnh TRƯỚC form · cần làm nền nhấn · lịch sử gập · chân (trạng thái trái, MỘT nút chính phải) · sau lưu | k2, k4, k5–k8, k10 | `DauViec`, `KhoiDoiTuong`, `BoiCanh`, `CanLam`, `LichSu`, `TrangThaiLuu`, `NutChinh` |
| 05 2.6 | Nhập điểm trong panel: "Còn n bài" + công tắc "Hiện cả lớp"; bỏ Excel / ? / ↗ | k1, k13 | `ODiem sua` (trống viền đứt) |
| 05 2.3 A (đảo OV-13 §1) | Kết quả PA mở khung phải như mọi việc; "Điều chỉnh / Kết thúc…" trong cùng panel | k2, k4 | — |
| 04 12 HTT-1, 3, 6 | rê chuột phủ 8 %; focus vòng 2 px; đang chọn = nền nhấn + vạch trái 3 px | k2 | `.bam`, `.dang-mo` |
| 04 12 HTT-10 | Đang lưu · ✓ Đã lưu · Hoàn tác · lỗi lưu giữ chữ · Thử lại | k5, k6, k7, k10 | `TrangThaiLuu` |
| 04 12 HTT-11 | dòng vừa xong mờ + gạch + "✓ Xong · Hoàn tác" | k9 | `HangDoiViec` |
| 04 12 HTT-12 | "Việc này đã được … làm lúc …" — Xem · Việc kế | k8 | — |
| 04 12 HTT-9 · V4A-01 | rỗng theo vai (1 câu + bước tiếp) · lỗi tải chỉ che vùng danh sách | k11, k12 | — |
| 02 2.9 luật S 21/10 · 05 3.4 | GV có kỹ năng S không dạy lớp: nhóm "Chấm Speaking chéo · không tính nợ"; "Người chấm" = chính GV | k13 | `ODiem sua` |
| 02 2.9 Q-A1 ① · 05 1.3 P1 | Công việc QL = theo dõi & giao việc: Việc của GV theo GV · Vận hành + "+ Giao việc" · Hộp duyệt (link chữ) · một dòng dẫn "Cần bạn quyết · 23 · ⚠ 12 — Tổng quan ›"; không nhóm Chờ duyệt; menu Công việc QL không số | k14, k16 | `HangDoiViec`, chữ + "›" |
| 05 1.3 (quyền) | QL không `score.edit` → Nhập điểm "chỉ xem"; Case "Làm thay" | k14 | — |
| 05 2.5 (sửa gốc) | lớp thật thiếu GV môn → hộp neo "Phân công GV P…" chỉ ô môn thiếu; Case thiếu chủ tự gán (không còn "Chọn người phụ trách") | k15 | hộp neo bậc 2a |
| 05 2.7 N2 (02 4.7 C22) | chuông = hộp "Nhắc việc": Cần làm ≤ 8 dòng cùng thứ tự Công việc + "Xem đủ … ›"; Để biết + chấm + "Đánh dấu đã đọc"; số = số việc Cần làm | k17, k18, k19, k20 | `DongViec`, hộp nổi |
| luật 5 (02 2.1) | QL thấy "Duyệt · Thu hồi xử lý vi phạm" / "Duyệt · Không tăng bậc" ở Cần làm | k20 | thẻ duyệt sẵn có (vẽ ở Tổng quan B — V4a) |
| 04 15 | đầu trang một hàng: tiêu đề = tên menu 22 · tóm tắt · công tắc Chương trình · một nút chính | k1, k2, k14 | — |
| 04 15 | thứ tự menu Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor; 375 thanh dưới ≤ 5 nút ("Thêm") | k14, k16, k3 | — |
| 04 2 · 3 | thang chữ 22 / 17 / 15 / 13 / 12; dòng việc 56 (375: 64); hàng bảng 44 / 64 | mọi khung | — |

## Đích đo (để nghiệm thu web)

| Khung | Đích |
|---|---|
| k1 GV 1440 | dòng việc đầu y ≤ 200 px · trang ≤ 1 800 px · khung nhìn đầu ≤ 30 phần tử bấm · số "⚠" ≤ số dòng quá hạn đang hiện + số nhóm |
| k3 GV 375 | dòng việc đầu y ≤ 420 px · trang ≤ 4 màn · mọi vùng bấm ≥ 44 |
| k4 chi tiết 375 | nút chính dính đáy luôn thấy · "‹ Quay lại" về đúng nhóm + vị trí cuộn |
| k14 QL | "GV nào đang nợ gì": 1 bấm · không tự mở việc / tự cuộn |
| k17 chuông | từ trang khác tới việc quá hạn lâu nhất: 2 bấm · id dòng Cần làm = id dòng trang Công việc · số trên chuông = số dòng Cần làm |

## BỎ (khối / dáng cũ phải xoá khi code)

- Đầu trang 2 hàng lọc 8 lựa chọn + ô Chi nhánh có nhãn trên (GV) · câu "10 chờ bạn duyệt" + khối "Chờ bạn duyệt" thẻ to ở Công việc (mọi vai).
- Mở danh sách em dưới dòng · ghi nhanh Kết quả PA dưới dòng (lưới `0px 494px`) · ngăn phủ chồng (Phân công, Gia hạn) · đổi trang cho việc làm được tại chỗ.
- Chip "Bình thường" · dòng phụ gộp 4–5 thứ · "Chưa có người" bị cắt · tên việc nhiều dạng cho cùng loại.
- Panel Nhập điểm: "Dán từ Excel", "?", "Mở lưới đầy đủ ↗", "1 lớp · 2 bài ↗", "Điền cả cột".
- "Xong hết hôm nay ✓ · Việc mới sẽ hiện ở đây khi có." · nút "Xem việc của: một GV ▾" (QL / Admin) · lỗi tải thay cả trang.
- QL: tự mở lưới điểm GV + tự cuộn ~470 px · "Việc quản lý" chứa việc của GV · việc "Chọn người phụ trách" · ngăn "Thông tin lớp" cả lớp cho "Phân công…".
- Chuông: chữ "Thông báo 30" · số = chưa đọc · tiêu đề nhóm IN HOA · "SOS n · em" (tin GVCN) ở Cần làm · một Case hai dòng · `thongBaoTuDong.ts`.
- "✓ Đã lưu" xanh lá · `window.confirm` · tự nhảy việc kế khi còn chữ đang gõ.

## GIỮ

- Thanh trên (logo · menu · ô tìm · chuông · tài khoản), khung phải tại chỗ (OV-5a), tự sang việc kế cùng nhóm của chính tôi (m2 §1e), Hoàn tác 10 s (m1 §1f), chip SOS chỉ viền (C08), quá hạn = chữ cam + ⚠ (17/10-PL).
- Luật nghiệp vụ: loại việc, hạn, luật quá hạn, T18 (chấm chéo không tính nợ), luật duyệt — không đổi (gom nợ cũ chỉ đổi cách trình bày).

## Không vẽ ở đây (đã có nơi khác)

- Tổng quan QL bố cục B + thẻ Chờ duyệt (Thu hồi / Không tăng bậc) + việc TVV → MOCKUP-V4a (M1, M1b).
- Hộp chấm một mẫu, Chấm Test theo hạn, lưới gọn → MOCKUP-V4a (M5a); khung k1 / k13 chỉ dùng cùng `ODiem sua` + nhãn bài chấm.

## Cần chủ SP chọn

1. Vùng 3 của dòng ở trang Công việc: **trống** (04 mục 8.2 — "›" chỉ cho đổi trang; mockup vẽ vậy) hay "›" như chữ 07 M2. Hộp Nhắc việc giữ "›" (bấm là sang trang).
2. Số trên menu "Công việc" của GV = 19 (= chuông = đầu trang, 05 mục 2.7) thay "quá hạn + hôm nay" (04 mục 10).
3. Nhập điểm trong khung phải không có nút chính (ô tự lưu khi rời ô) — chân chỉ "Việc kế".
