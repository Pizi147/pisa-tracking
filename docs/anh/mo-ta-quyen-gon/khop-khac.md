# MO-TA-QUYEN-GON — mô tả quyền không lặp tên (M3)

PTA Plan 05/11 (sau #955, quyết câu hỏi để ngỏ): mô tả quyền nào gần lặp tên quyền thì bỏ dòng mô tả, chỉ giữ dòng phạm vi ("GV: …") nếu có;
mô tả nào thêm nghĩa thật thì giữ. Một nguồn `MO_TA_QUYEN` (`shared/domain/nhomQuyen.ts`) → hai nơi hiện cùng đổi: panel **Sửa tài khoản › Quyền cấp riêng**
(`CapQuyenRieng`) và **Quản trị › Quyền & nhật ký › Quyền theo vai trò** (`AdminPage`). Hướng dẫn không dùng các câu này (đã kiểm).

## Ảnh

| Màn | Ảnh |
|---|---|
| Sửa tài khoản · mở Lịch & Test + Case/SOS · 1440 tối | `truoc-sau-sua-mo-1440-toi.png` |
| Sửa tài khoản · mở Lịch & Test + Case/SOS · 375 sáng | `truoc-sau-sua-mo-375-sang.png` |
| Sau: Quyền theo vai trò · 1440 tối (cùng nguồn) | `sau-quyen-theo-vai-1440-toi.png` |

## Đo (panel, hai nhóm mở)

| Màn | Từ cả panel | Từ màn đầu |
|---|---|---|
| 1440 | 276 → **223** | 206 → 201 |
| 375 | 276 → **223** | 206 → **171** |

## Bỏ (25 / 38 — câu lặp tên, giữ phạm vi)

| Quyền (tên) | Câu đã bỏ |
|---|---|
| Dời lịch Test (lớp thường, đúng phần phụ trách) | Dời lịch Test một kỹ năng của lớp thường. |
| Huỷ cả lượt MT | Huỷ cả một lượt Mock Test. |
| Đặt hạn nhập điểm riêng | Đặt hạn nhập điểm khác hạn mặc định. |
| Xem lịch và kết quả MT | Xem lịch và kết quả Mock Test. |
| Nhập điểm kỹ năng được phân công | Nhập điểm kỹ năng mình được phân công. |
| Cập nhật Đánh giá GV | … cho kỹ năng mình phụ trách. (phạm vi đã nói "môn mình dạy") |
| Xem danh sách Case học vụ | Xem danh sách Case và bốn bộ lọc Case. |
| Báo vấn đề mới | Báo một vấn đề mới của học viên. |
| Sửa và xử lý Case học vụ (đúng kỹ năng hoặc GVCN) | Sửa và xử lý một Case đã có. |
| Đóng Case học vụ | Hoàn thành (đóng) một Case. |
| Duyệt phương án học thuật | Duyệt phương án hỗ trợ học thuật giáo viên đề xuất. |
| Ghi vi phạm của học viên trong lớp mình dạy | Ghi vi phạm của học viên. |
| Xử lý Ý thức: sửa vi phạm của người khác, tạo và xác nhận lần xử lý | (trùng nguyên văn) |
| Xem thống kê Ý thức cả chi nhánh | Xem thống kê Ý thức của cả chi nhánh. |
| Tạo lớp | Tạo lớp mới, một lớp hoặc nhiều lớp một lần. |
| Phân công GV bộ môn lớp mình chủ nhiệm | Phân công giáo viên bộ môn cho lớp mình chủ nhiệm. |
| Sửa tiến độ lớp (tuần bắt đầu, tuần kiểm tra) | Sửa tiến độ lớp: tuần bắt đầu, tuần Progress Test, tuần Final Test. |
| Xem hồ sơ học viên | Xem hồ sơ học viên. |
| Thêm học viên vào lớp | … một em hoặc nhập danh sách / Excel. |
| Sửa Target, lộ trình học viên | Sửa Target và lộ trình của học viên. |
| Duyệt yêu cầu trong hộp Chờ duyệt | Duyệt thẻ trong hộp Chờ duyệt. |
| Cập nhật báo cáo và ghi chú | Cập nhật báo cáo và ghi chú công việc. |
| Vào Công việc | Vào Công việc. |
| Xem Tổng quan số liệu và Phân tích | (trùng nguyên văn) |
| Xem phần giáo viên (Phân tích theo GV, hồ sơ GV) | Xem Phân tích theo giáo viên và hồ sơ giáo viên khác. |

## Giữ (13 — thêm nghĩa thật)

Chốt tuần MT (đổi tuần, xếp lịch Fast Track) · Đánh dấu kỹ năng không mock (nghĩa "không mock") · Nhập bù điểm (cả sửa, khi GV vắng) · Phân công GV
vào lớp (kể cả đổi GVCN) · Sửa hồ sơ HV (chuyển lớp) · Sửa thông tin HV (liệt kê ô — phân biệt với quyền sửa thêm) · Sửa Target, ghi chú… (Không mở việc học
thuật) · Vào Test (ba trang) · Xem tiến trình công việc (và báo cáo) · Xem trang Tutor (tutor, buổi dạy, nhận xét) · Quản lý tutor (gộp tên gõ tay) ·
Quản trị hệ thống (tài khoản, vai trò, quyền, cấu hình). Mọi dòng phạm vi "GV: …" / "QL: …" giữ nguyên.

## Mã

- `nhomQuyen.ts`: `moTa` thành tuỳ chọn (có thì phải thêm nghĩa); bỏ 25 câu. EN: bỏ 25 khoá không còn dùng (`shared/i18n/en/sotQuanTri.ts`).
- `CapQuyenRieng.tsx`, `AdminPage.tsx`: không có `moTa` thì không vẽ dòng.
- Kiểm `prQu` QU-1: mô tả (nếu có) là một câu và **không trùng tên quyền**.
- Không đổi máy chủ, không thêm request. Thao tác không đổi.
