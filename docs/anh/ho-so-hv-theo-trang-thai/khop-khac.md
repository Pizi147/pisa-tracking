# HO-SO-HV-THEO-TRANG-THAI (audit 16/11 gói 14) — khớp / khác

Mockup: ③ `thiet-ke/v21/ho-so-hv.html#k9` (chủ SP duyệt #1781). Ảnh cặp MOCKUP | WEB (demo 14/09, tối, phông Be Vietnam Pro đã nạp):
`cap-k9a-1440.png` · `cap-k9a-375.png` (TVV Nguyễn Thu Hương · Đinh Ngọc Quyên #21, đã có KQ thi thật) ·
`cap-k9b-1440.png` · `cap-k9b-375.png` (QL Nguyễn Khánh Vy · Ngô Thanh Tùng #96, Kết thúc học 14/09) ·
`cap-k9cd-1440.png` · `cap-k9cd-375.png` (GVCN Trần Ngọc Hà · Lương Gia Bảo #90: chưa điểm MT + WL 2 chờ QL) ·
`cap-k9e-1440.png` · `cap-k9e-375.png` (QL · Đỗ Minh Khôi #46, cột Case).
K9f (GV lớp cũ chỉ xem, N48) KHÔNG trong PR này — AU-VIEC làm quyền trước.

## Bảng truy vết khung → thành phần → kết quả

| Khung | Ý | Thành phần (tệp) | Mockup | Ghi chú |
|---|---|---|---|---|
| K9a | A3-21 · ẩn lượt MT chưa điểm từ ngày thi trở đi | `KhoiMockTest` (`StudentDetailPage.tsx`) | KHỚP | MT4 W1 OCT ẩn; lọc dữ liệu đã nạp |
| K9a | ngày thi ghi một lần ở đầu | ô "Thi thật IELTS" (`HanhTrinhKyNang.tsx` `DiemDau`) | KHỚP | bỏ ngày ở góc ô (ô "Thi thật · Đã thi 12/09" ở dòng thông tin giữ) |
| K9a | Case: "Đã có KQ thi thật · không còn việc Case / PA", ô hạn trống | `CotCaseHv.tsx` (`daThi`) | KHỚP | việc thật do máy chủ ẩn (N46 — AU-VIEC) |
| K9a | 6 ô điểm | `DiemDau` | KHÁC (GIỮ) | web đã có ô Thi thật IELTS + L R W S thi thật (chủ SP 27/10, thi thật nổi nhất) — mockup vẽ ô MT gần nhất; giữ tính năng cũ |
| K9a | hàng "Thi thật" cuối bảng MT có ngày 12/09 | `IeltsAttempts` | KHÁC (GIỮ) | cột Tuần của bảng — mockup chưa vẽ hàng này (đã duyệt 27/10) |
| K9b | bỏ dải "Học viên đã lưu trữ …" khi Kết thúc học | `StudentDetailPage.tsx` | KHỚP | em Tạm dừng ở Lưu trữ vẫn có dải "Tạm dừng · ở Lưu trữ" |
| K9b | ngày kết thúc chỉ ở chip | `TomTatLuuTru` (bỏ ô "Kết thúc" khi chip có ngày) | KHỚP | |
| K9b | ẩn MT chưa điểm sau ngày kết thúc · ẩn Tiến độ rỗng, Case cả hàng | `KhoiMockTest`, `TienDoTrenLop` (`anKhiRong`) | KHỚP | MT3 W3 SEP ẩn |
| K9b | dòng tóm tắt lưu trữ (Lộ trình gần nhất · Target · nhãn KQ) | `TomTatLuuTru` | KHÁC (GIỮ) | dáng P7 đã duyệt; mockup vẽ o-tin |
| K9c | A3-11 · một dòng "Chưa có điểm Mock Test · MT1 W4 SEP" thay 6 ô "—" | `DiemDau` | KHỚP | có ≥ 1 điểm thì giữ 6 ô |
| K9d | A3-12 · ô "Ý thức: WL 2 · chờ QL" / "REPORT 1" cuối dòng thông tin, bấm = tab Ý thức | `DongThongTin` (`DauHoSo.tsx`) | KHỚP | WL đỏ; "chờ QL" chữ mờ; 375 vùng chạm 44 |
| K9e | A3-09 · hàng Case lưới cố định: kỹ năng · tên + SOS · trạng thái · PA (dài xuống dòng trong cột, không cắt) · người · hạn — thẳng cột | `CotCaseHv.tsx` | KHỚP | cột 34 · 172 · 128 · 1fr · 140 · 76 · 24; chip trạng thái chấm màu theo trạng thái (vàng chờ · xanh dương Đang làm · xanh lá ✓ xong), đỏ chỉ ở hạn quá hạn; chip kỹ năng nền đặc (`.the-kn.dac`, cả dòng Tiến độ); 375 chip kỹ năng căn đầu hàng |

Khớp: 11 / 12 dòng có mockup (2 dòng KHÁC là GIỮ tính năng đã duyệt) → ≥ 90 %.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Xem bậc Ý thức của em | bấm tab Ý thức & Phối hợp | thấy ngay ở dòng thông tin; bấm ô → tab Ý thức (thêm lối, không bỏ lối cũ) |
| Bấm ô điểm đổi kỹ năng (em chưa có điểm nào) | 6 ô "—" bấm được nhưng không có gì để xem | không còn ô (không có dữ liệu); khi có điểm đầu tiên ô hiện lại |
| Bấm hàng Case mở / gập · nút việc | như cũ | như cũ |
| Quay lại học · + Task · ⋯ (lưu trữ) | như cũ | như cũ |
| MT › mở hồ sơ lượt | mọi lượt | lượt chưa điểm sau ngày thi / kết thúc không còn hàng (không có gì để mở) |

Không mất thao tác nào có dữ liệu.

## Dòng đọc Turso
Không đổi: 0 câu thêm, 0 request thêm. Ô Ý thức đọc `/students/:id/y-thuc` vốn đã gọi khi mở hồ sơ (bậc, đề xuất); ẩn MT và Tiến độ rỗng là lọc dữ liệu đã nạp. Máy chủ không đổi.
