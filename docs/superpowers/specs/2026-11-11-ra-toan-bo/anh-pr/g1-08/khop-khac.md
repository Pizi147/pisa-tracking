# G1-08 — khớp / khác mockup #1434 (một nút "Xuất Excel…" + ngăn hai tab)

Mockup: `thiet-ke/2026-11-13-test-g1/g1-08-xuat.html` (PR #1434, chủ SP duyệt 13/11). Ảnh cặp mockup | web (seed 14/09, 1440 tối · 375 sáng): `cap-k1…k7c.png` cùng thư mục.

| Khung | Thành phần | Ảnh | Đánh giá |
|---|---|---|---|
| K1 | "Xuất Excel…" ở hàng tiêu đề "Test" (Lịch Test tuần) | cap-k1 | KHỚP |
| K1 | bỏ "Xuất Excel" ở hàng lọc (giữ Mở tất cả lớp · Lịch thi thật ›) | cap-k1 | KHỚP |
| K2 | ngăn "Xuất Excel" + tab Điểm Test · Lịch Test | cap-k2 | KHỚP |
| K2 | Phạm vi: Khung lớp (đoạn trải ngang) · Chi nhánh · Lớp (ô tìm) | cap-k2 | KHỚP |
| K2 | Thời gian: đoạn Theo tuần / tháng / đợt trải ngang; câu giải thích vào ⓘ | cap-k2 | KHỚP |
| K2 | Từ tuần / Đến tuần | cap-k2 | KHÁC (GIỮ): ô `ONgay` chung (ô gõ + nút lịch tách, dòng ngày dưới) — luật ô ngày mọi nơi |
| K2 | Lượt và cột ⓘ: Mọi lượt / Chỉ lượt đủ điểm · Gọn / Gọn + nhận xét / Đầy đủ · dòng "Cột trong tệp" | cap-k2 | KHỚP |
| K2 | Xem trước (số lượt · HV · lớp + 5 dòng đầu) | cap-k2 | KHỚP |
| K2 | chân: tên tệp · nút trái · "Xuất Excel · n lượt" | cap-k2 | KHỚP; nút trái "Đóng" (mockup "Huỷ") — KHÁC (GIỮ) chữ chân chung của `KhungPanel` (luật S3: chưa sửa = "Đóng") |
| K2 | tiêu đề khối (Phạm vi, Thời gian…) 12 px mờ | cap-k2 | KHÁC (GIỮ): `Khoi` chung của mọi ngăn — đổi là đổi mọi panel, ngoài phạm vi |
| K2 | bề rộng ngăn 480 (mockup 560) | cap-k2 | KHÁC (GIỮ): chuẩn ngăn `KhungPanel` (480 / 720) — 480 đủ cho mọi hàng, không cắt chữ |
| K3 | hàng tiêu đề Kế hoạch: "Xuất Excel…" · "Xếp nhiều MT…" (bỏ "Xuất Excel" + "Xuất điểm Test") | cap-k3 | KHỚP |
| K3 | tab Lịch Test mở sẵn; Khung lớp · Chi nhánh · Lớp "Mọi lớp Fast Track · 6 lớp · 51 HV" + "Thu hẹp: tìm lớp FT…" | cap-k3 | KHỚP |
| K3 | Xem trước sheet "Kế hoạch Test" (4 / 51 hàng) + ⓘ "Ô MT là tuần thi" · sheet "Thông tin xuất" | cap-k3 | KHỚP |
| K4 | GV: không tab, tiêu đề "Xuất Excel · Điểm Test", chỉ lớp GVCN | cap-k4 | KHỚP |
| K5a | Quản trị: chi nhánh nhiều, Lớp thường, Theo đợt Progress · Checkpoint · Final, Đầy đủ (không có Gọn + nhận xét) | cap-k5a | KHỚP; nút chọn chi nhánh / đợt là `NutChon` chung (✓ góc) — KHÁC (GIỮ) |
| K5b | Quản trị · Lịch Test: chi nhánh | cap-k5b | KHÁC (có lý do): chi nhánh theo bộ lọc trang (chữ), không chip chọn trong ngăn — đường máy chủ cũ nhận MỘT `branchId`; đổi chi nhánh ở bộ lọc trang như trước, không thêm việc máy chủ |
| K6 | lỗi thời gian tại ô + nút chính tắt · 0 lượt · lỗi xem trước + "Thử lại" | — | KHỚP theo mã (lỗi tại ô `useLoiForm` sẵn có; "Thử lại" mới) — không dựng lỗi mạng trên seed |
| K7a | 375 Kế hoạch: "Xuất Excel…" + "Xếp nhiều MT…" ở hàng tiêu đề, bỏ ⋯ một mục | cap-k7a | KHỚP |
| K7b–c | 375 ngăn toàn màn: tab, đoạn trải ngang, chân dính (tên tệp trên, Đóng · Xuất) | cap-k7b, cap-k7c | KHỚP; tab không chia đôi bề ngang — KHÁC (GIỮ) `HangTab` chung |
| K8 | mở từ hồ sơ lớp ⋮ / Phân tích: cùng ngăn, lớp đặt sẵn, MT1…MT10 | — | KHỚP theo mã (cùng ngăn K2) |
| K8 | cột Lớp "A → B" khi em đổi lớp | — | KHÁC (có lý do): mỗi hàng là một lượt, cột Lớp ghi lớp của lượt đó (em đổi lớp thấy qua các hàng). Ghép "A → B" thêm 2 câu SQL mỗi lần xem trước và lộ mã lớp ngoài phạm vi GVCN (phép kiểm PR-XUAT (2) chặn) |

Đếm: 22 dòng · 14 KHỚP · 6 KHÁC (GIỮ mẫu chung) · 2 KHÁC có lý do → 14 / 22 = 64 % khớp tuyệt đối; **91 %** tính KHÁC (GIỮ) theo luật V1 (giữ thao tác / mẫu sẵn có, 20 / 22). Hình ảnh của phần mới (đoạn trải ngang, tab, chân, ⓘ) theo mockup.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Xuất kết quả Test (GV lớp GVCN, QL, Quản trị) | Lịch Test › "Xuất Excel" (hàng lọc) | Hàng tiêu đề › "Xuất Excel…" › tab Điểm Test (mở sẵn, đúng tuần đang xem) |
| Xuất lịch MT1…MT10 (QL, Quản trị) | Kế hoạch › "Xuất Excel" | Hàng tiêu đề › "Xuất Excel…" › tab Lịch Test (mở sẵn, theo bộ lọc đang xem); thêm thu hẹp lớp trong ngăn |
| Xuất điểm + nhận xét (QL, Quản trị) | Kế hoạch › "Xuất điểm Test" › Điểm + nhận xét / Chỉ điểm · Theo tuần / Theo lớp (MT) / Lớp + khoảng tuần | Tab Điểm Test › Cột "Gọn + nhận xét" / "Gọn" (đã có W1 · W2 · Kết quả) · Theo tuần / Theo đợt MT1…MT10 + lớp / Theo tuần (khoảng) + lớp |
| Khung, chi nhánh, lớp, tuần / tháng / đợt, mọi lượt / đủ điểm, gọn / đầy đủ, xem trước | có | GIỮ |
| Hồ sơ lớp ⋮ "Xuất kết quả Test" · Phân tích › Tổng hợp Test | mở ngăn kết quả | GIỮ chỗ, mở ngăn chung (QL có thêm tab Lịch cho lớp FT) |
| 375 Kế hoạch | ⋯ "Thao tác trang" (3 mục) | hai nút thẳng ở hàng tiêu đề |
| 375 Lịch Test | "Xuất Excel" trong "Lọc" | hàng tiêu đề (bớt 1 bấm) |
| Xem trước lỗi máy chủ | đổi lọc để gọi lại | "Thử lại" tại dòng lỗi |
| Nhớ lựa chọn | không | Lượt + Cột nhớ trên máy (thời gian luôn theo nơi mở) |

Mất thao tác: không. Bỏ đường máy chủ chết `POST /ke-hoach-test/xuat-diem` (+ `xuatDiemTest`, ngăn `NganXuatDiem`) — nội dung đã ở `/xuat-mt`.

## Dòng đọc Turso (đo trên chính bộ kiểm)
- `GET /xuat-mt/xem-truoc` (QL, QT, GVCN, MT1–MT8): trần 21 câu ở `tocDoDuong.ts` — vẫn đạt, không thêm câu (cột Kết quả, W1 · W2, nhận xét đều từ `loadBundle` đã đọc).
- `POST /xuat-mt` cột đầy đủ, MB ×3 dữ liệu: 10 câu / 206 lượt (`[xuat-mt]` trong log tocDo) — như trước.
- `POST /ke-hoach-test/xuat` xem trước: thêm `lopCo` từ CÙNG câu phạm vi (`lopTrongPhamVi`) — 0 câu thêm.
- Bỏ `POST /ke-hoach-test/xuat-diem`: một đường đọc ít hơn.
