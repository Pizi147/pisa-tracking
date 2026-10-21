# Truy vết — `mockup-v4-tong-quan.html` (M1 · Tổng quan bố cục B + việc của tôi theo vai) · 21/10/2026

Mockup: [`mockup-v4-tong-quan.html`](mockup-v4-tong-quan.html) · ảnh: `anh/mockup-v4-tong-quan-<khung>.png` (k1–k7 = 1440 tối; a–d = 375 sáng).
Nguồn: 02 mục 2.9 (Q-A1 ①, Q-A2 ①) · 05 mục 1.2, 1.3, 1.4, 2.1, 2.2 · 04 mục 3, 8, 9, 12, 15 · 07 M1 · 06 mục 3 (m3 §1 sửa), mục 4 (M1, M1b) · phụ lục v1-tong-quan Phần 4.

## 1. Quyết định → khung → thành phần

| Mã | Nội dung | Khung | Thành phần |
|---|---|---|---|
| Q-A2 ① (05 2.1) | Bố cục B: một hàng đợi trái 540 · chi tiết phải; Chờ duyệt là nhóm đầu, luôn mở, ≤ 5 dòng + "Xem thêm" | k1–k4, a | `HangDoiViec` |
| v1 4.4 | Nhóm thứ tự cố định, chỉ nhóm có việc; nhóm có ⚠ mở ≤ 3 dòng, nhóm khác gập; trong nhóm quá hạn lâu nhất trước | k1, k3, k4 | `HangDoiViec` |
| 05 2.2 | Dòng 3 vùng: Hạn · Việc + đối tượng (một hàm tên dòng = tên đầu khung) · vào | k1–k7 | `DongViec` |
| 04 15 | Vào trang chọn sẵn dòng đầu khi là việc của chính người xem; không đặt con trỏ, không cuộn | k1, k5, k7 | — |
| 04 9.1 | Khung phải 6 phần: đầu (tên + 1 chip hạn + đối tượng ↗) · bối cảnh trước form · cần làm (nền nhấn nhạt) · lịch sử gập · chân (trạng thái trái, một nút chính phải) | k1, k3 | `KhungViec` |
| v1 4.5 #6 | "Chọn nhiều" ở đầu nhóm Chờ duyệt; ô tích chỉ dòng duyệt hàng loạt được; thanh "Đã chọn n · Duyệt n"; lô lỗi một phần | k2 | `HangDoiViec` |
| HTT-11, 04 12 | Dòng vừa duyệt mờ + "Hoàn tác 8 s", tự sang việc kế cùng nhóm | k2 | HTT-11 |
| HTT-12 | Người khác đã xử lý (đề xuất bị rút) | k2 | HTT-12 |
| 06 m3 §1 sửa | Lớp cần chú ý: hàng tổng chỉ xem (số trơn); hàng lớp mở dưới hàng (2b); dòng em + Thêm PA dưới dòng (≤ 4 ô) | k1–k4 | `Bang` + mở dưới hàng |
| 04 8 | Số bấm được = `OSo`; chip SOS là nút; số 0 trơn; chỉ xem trơn | k1–k6 | `OSo`, `ChipSos` |
| 06 m3 §1 | "Tuần này" một hàng ô tuần | k1–k6 | `TuanNay` (MỚI) |
| 9.1-4 | Một phạm vi số cho cả trang (Chi nhánh + Chương trình); QT "Tất cả chi nhánh" — hàng chi nhánh chỉ xem | k4 | khung trang |
| Q-A1 ① (05 1.2) | Việc của tôi ở trang đầu vai: QL / QT "Cần bạn quyết"; Admin VP "Việc của bạn" (lượt MT chưa xếp lịch); CX không nhận việc; TVV "Việc của bạn" (không thêm Công việc) | k5, k6, k7, c, d | cùng `HangDoiViec` |
| 04 15 | Tiêu đề = tên menu "Tổng quan" mọi vai; đầu trang một hàng; "Báo cáo ›" là link chữ đổi trang | mọi khung | khung trang |
| 04 16 | 375: danh sách → chi tiết toàn màn, "‹ Tổng quan", "Việc 1 / 10", nút dính đáy; QL thanh dưới 5 nút (Thêm) | a, b | khung 375 |

## 2. GIỮ
Nhóm việc QL theo mockup 3 (Chờ duyệt → Case quá hạn chốt PA → Sau thi · Bước tiếp → Lộ trình lớp → Phân công → Lịch Test → Vận hành) · m3 1c, 1d giữ ý · quyền không đổi (QL có quyền Case → làm thay; QL không `score.edit` → nhập điểm chỉ xem ở Công việc).

## 3. BỎ (web hiện tại)

| Bỏ | Tệp / nguồn |
|---|---|
| Tiêu đề "Việc hôm nay" / "Mock Test" / "Số liệu" / "Học viên của tôi" | trang Tổng quan theo vai |
| Đầu trang 3–4 hàng; dải "Mới dùng PISA?" | Tổng quan |
| Dải "HV cần chú ý" (X-24) | Tổng quan QL |
| Khối Trễ chấm (V1 II.4) | m3 §1 cột phải — HẾT HIỆU LỰC |
| Chờ duyệt dạng thẻ to / hộp riêng trên (`HopChoDuyet`) | `KhoiCanQuyet.tsx` |
| Mở việc bằng ngăn phủ; "Mở" → đổi trang hồ sơ để duyệt | Tổng quan |
| Số gạch chấm, bấm ra panel chỉ tên | `SoLieuO` |
| "Tuần này" dùng lại `LichSapToi` | Tổng quan |
| Nhóm Chờ duyệt ở Công việc QL (→ "Theo dõi & giao việc", M2) | `HoTroHocVienTab.tsx:337-348` |
| m6 §10 (Báo cáo thay Tổng quan) | HẾT HIỆU LỰC |

## 4. Đích đo
k1: dòng việc đầu y ≤ 200 px; trang ≈ 1,7 màn 1440 / ≈ 2,5 màn 375; khung nhìn đầu ≤ 30 phần tử bấm · duyệt 10 thẻ có bối cảnh: 31 bấm · 20 đổi trang → 11 · 0 · Thêm PA 5 Case quá hạn: 25–30 · 5 ngăn phủ → 11–16 · 0 · "lớp nào SOS 3, em nào, có PA chưa": 3 bấm + 1 đổi trang → 1 · số menu "Tổng quan 23" = số "Cần bạn quyết".

## 5. Cần chủ SP chọn
1. Tên khu: "Cần bạn quyết" (QL / QT) và "Việc của bạn" (Admin VP / TVV).
2. Hàng tổng chỉ xem.
3. Ô "Trước · ⚠ n bài quá hạn chấm" trong "Tuần này" — giữ hay bỏ.
4. CX: câu "Không có việc của bạn" hay bỏ hẳn khu việc.

## 6. Seed cần thêm (SEED-UX)
Tài khoản Admin VP, CX, TVV có dữ liệu cho Monbay; 10 thẻ Chờ duyệt đủ loại (PA, WL 3, Target, dời lịch Test, thu hồi).
