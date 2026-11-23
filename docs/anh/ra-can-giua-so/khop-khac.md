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
| Cuối khoá (QL) | 3 cột kết quả 100/100/124, 3 cột chọn 168/140/116 không đều; Tuần thừa ~87 px mép phải | PR 2 |
| Hồ sơ GV · Lớp đang dạy / chủ nhiệm | cột số 80/120/160/130/150 không đều; "Mini Test" ngày để trái | PR 3 |
| Tutor | Chuẩn bị 96, Tài liệu 96, Feedback GV 116; "Kết luận" quá rộng | PR 3 |
| Lớp thường · bảng điểm | cột % 64 vs 90 | PR 3 |
| Lưu trữ | cột cuối là nút sát mép phải | đạt |
| Phân tích · Theo lớp, Thi thật, SOS, GV, Ý thức, Tổng hợp, Hiệu quả PA | ô số viền, chờ mockup số mới | chỉ ghi nhận, không sửa |
| Giữ căn phải | cột nút cuối dòng, hạn ngày cuối dòng, `chv-so` (đếm cạnh chip ở Công việc của tôi / Lớp của tôi) | có lý do |

## PR 1 — thao tác TRƯỚC → SAU
Không đổi thao tác, số liệu, thứ tự cột. Chỉ đổi căn lề. Phép kiểm nguồn `prS4f.tests.ts:288` (ô Tỷ lệ) đổi `text-right` → `text-center` theo luật mới.
