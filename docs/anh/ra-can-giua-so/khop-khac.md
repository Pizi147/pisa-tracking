# Rà căn giữa số + cân cột (chủ SP 24/11) — bảng rà

Đo 44 trang ở 1440 tối (script đo riêng, ảnh `truoc-*`). Cột "trạng thái": đạt / đã sửa (PR) / [XM] / không sửa (lý do).

| Trang · bảng | Vấn đề | Trạng thái |
|---|---|---|
| Tổng quan · Lớp cần chú ý | 4 cột số căn phải (#2055) | đã sửa PR 1 → giữa, 4 cột cách đều 147 px |
| Tổng quan · Giáo viên | — | đạt |
| Lớp · Tổng kết lớp (TabTongKetLop) | 9 cột số căn phải (th + td thô) | đã sửa PR 1 |
| Hồ sơ HV · Tổng kết (NganTongKet) | L R W1 W2 S OVR Kỳ vọng căn phải | đã sửa PR 1 |
| Hồ sơ HV · Mock Test (StudentDetailPage) | mã căn phải, CSS chung đã ép giữa | đã dọn mã PR 1 (hình không đổi) |
| Lớp · Case–PA (ClassIssueBoard), Quản trị · Catalog, hộp xoá HV / tài khoản | `text-right` trong mã | đã dọn PR 1 |
| Cuối khoá (QL) | 3 cột kết quả 100/100/124, 3 cột chọn 168/140/116 không đều; Tuần thừa ~87 px mép phải | đã sửa PR 2 (#2085) |
| Hồ sơ GV · Lớp đang dạy / chủ nhiệm | cột số 80/120/160/130/150 không đều; "Mini Test" ngày để trái | đã sửa PR 3 |
| Tutor | Chuẩn bị 96, Tài liệu 96, Feedback GV 116; "Kết luận" quá rộng | đã sửa PR 3 |
| Lớp thường · bảng điểm | cột % 64 vs 90 | đã sửa PR 3 |
| Lưu trữ | cột cuối là nút sát mép phải | đạt |
| Phân tích · Theo lớp, Thi thật, SOS, GV, Ý thức, Tổng hợp, Hiệu quả PA | ô số viền, chờ mockup số mới | chỉ ghi nhận, không sửa |
| Giữ căn phải | cột nút cuối dòng, hạn ngày cuối dòng, `chv-so` (đếm cạnh chip ở Công việc của tôi / Lớp của tôi) | có lý do |

## PR 1 — thao tác TRƯỚC → SAU
Không đổi thao tác, số liệu, thứ tự cột. Chỉ đổi căn lề. Phép kiểm nguồn `prS4f.tests.ts:288` (ô Tỷ lệ) đổi `text-right` → `text-center` theo luật mới.

## PR 3 — số đo (1440 tối, thừa = rộng cột − nội dung dài nhất, kể cả đầu cột)

- Tổng quan: hàng "Giáo viên | Chờ duyệt" chia 1.3fr từ 1200 px, hàng "Lớp cần chú ý | Tình hình" chia 1.45fr từ 1100 px → mép giữa 801/818 vs 838/856. Sau: cùng 1.45fr từ 1100 px; mép thẻ 20 / 839 / 855 / 1420 (1440) và 20 / 744 / 760 / 1260 (1280), hai hàng thẳng nhau.
- Hồ sơ GV · Lớp đang dạy: HV 80 → 100, Chưa nhập 120 → 100, Quá hạn 120 → 100 (ba cột số rộng đều 100); GVCN 220 → 160. Lớp co giãn 688 → 808. Thừa: Chưa nhập 30, Quá hạn 46, HV 81 (đầu cột "HV" + số 2 chữ số trong cột đều — chấp nhận, rộng đều ưu tiên hơn).
- Hồ sơ GV · Lớp chủ nhiệm (dùng chung LopToiDay): Dưới kỳ vọng 160 / Case 130 / Thi tháng 150 → cùng 150. Thừa 34–57.
- Hồ sơ GV · Em đang bổ trợ: cột Học viên co giãn (trước: cột "Bổ trợ" chiếm 1022 px, thừa 925); Bổ trợ 140, Mini Test 120 căn giữa, sát mép phải.
- Tutor: Chuẩn bị / Tài liệu / Feedback GV 96/96/116 → 112 đều; Buổi 72 và Đánh giá 92 → 96. Cột "Kết luận / lý do" (chữ, co giãn, có thể dài) giữ nguyên — khoảng trống bên phải khi trống là do cột chữ.
- Tổng quan · Lớp cần chú ý: 4 cột số 147 đều (`deu`), thừa 58–95 — cột đều do tỉ lệ khung; không thu thêm vì cột Lớp đã co giãn và khung cố định theo lưới hai hàng.
- Lớp thường · bảng điểm: cột % 64 vs 90 nằm trong lưới chấm (`modules/cham/Luoi*.tsx`, ngoài phạm vi) — ghi nhận, không sửa.

Thao tác TRƯỚC → SAU: không đổi (chỉ độ rộng cột / lưới).
