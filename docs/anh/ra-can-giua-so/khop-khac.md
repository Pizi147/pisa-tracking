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

## PR 3 — bổ sung theo rà PTA Plan (1440 tối)

- Hồ sơ GV · Lớp đang dạy / Lớp chủ nhiệm / Việc đang tồn / Yêu cầu đã gửi + LopToiDay: bỏ vùng `.o-so-hop` → số TRƠN căn giữa (bấm được xanh nhấn, quá hạn > 0 đỏ, 0 mờ), không còn ô viền. SOS hiện tại: chip mức + số trơn liền sau (giữ `SosDem`), ba mẩu cách đều 14 px.
- Cột tên không nuốt bề ngang: `deu` + rộng cơ sở (Lớp 260, Ký năng 130, HV/Chưa nhập/Quá hạn 100, GVCN 160) → phần dư chia theo tỉ lệ. Đo sau: Lớp đang dạy Lớp 428, HV / Chưa nhập / Quá hạn đều 164,5; Lớp chủ nhiệm Lớp 272, ba cột số đều 231, SOS 434 (nội dung ba chip + số cần ~330 — còn gấp ~1,9 cột khác, chấp nhận vì chứa ba mẩu); Em đang bổ trợ thu khung 720 px: Học viên 316, Bổ trợ 230, Mini Test 172.
- Khoảng thừa sau (rộng cột − nội dung dài nhất, 1440): cột tên 24–164; cột số 95–146 (cột số rộng đều ưu tiên; nội dung 1–2 chữ số); GVCN 153–173. Vượt 40 px ở cột số là hệ quả của "phần dư chia đều" — ghi nhận, không thu thêm vì bảng 6 cột phải kín 1398 px khung.
- Học viên & Lớp · Lưu trữ: cột "Kết thúc" co giãn 478 px (thừa 394) → `deu`, Lớp 274 / Trình độ 219 / GVCN 274 / HV 164 / Kết thúc 192; nút sát mép phải.

### Trang rà nốt (1440 tối, thừa = rộng cột − nội dung dài nhất)

| Trang · bảng | Số đo | Trạng thái |
|---|---|---|
| Học viên & Lớp (danh sách `/hoc-vien`) | không có `<table>`: lưới / thẻ riêng; không cột số lệch | đạt (ảnh `truoc-hvl`) |
| Hồ sơ lớp FT · Học viên | Học viên 276 / thừa 122; cột điểm đều; cao dòng chỉ lỗi đã biết M3 (mien-do.json) | đạt |
| Hồ sơ lớp FT · Phân tích lớp (MT1–MT5 235 đều) | 5 cột đều, thừa ~207 (số 3–5 ký tự) — họ bảng Phân tích, chờ mockup số mới | chỉ ghi nhận |
| Hồ sơ lớp thường · bảng điểm | cột R 90 vs % 64: lưới chấm `Luoi*.tsx` ngoài phạm vi | chỉ ghi nhận |
| Hồ sơ HV · Mock Test / Tổng kết | số căn giữa (PR 1); Lớp lúc đánh giá 181 / thừa 74, Tuần 191 / 77, Kết quả 280 / 101 | đạt (thừa ≤ 120) |
| Hồ sơ HV · Lộ trình & lớp | Lộ trình 545 / thừa 348 (cột tên, chữ), Lớp 203, Thời gian 265, Kết quả 260; cột cuối là link "Học thuật ›" sát mép phải | đạt (cột chữ, không số) |
| Test · Lịch Test, Điểm theo lớp, Kế hoạch lớp, Bảng điểm lớp thường, Nhập điểm | lưới chấm (`modules/cham/Luoi*.tsx`) — ngoài phạm vi | chỉ ghi nhận |
| Quản trị · bảng người dùng | Email 302 / thừa 93; 5 cột kín khung | đạt |
| Tutor | xem trên (PR 3); Tài liệu 112 / thừa 66 | đạt |

Thao tác TRƯỚC → SAU: không đổi (chỉ kiểu hiển thị số + độ rộng cột). Ô số vẫn bấm → panel như cũ.
