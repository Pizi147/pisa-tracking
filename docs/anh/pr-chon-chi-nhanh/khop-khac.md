# D3 CHON-CHI-NHANH — ô chọn chi nhánh gọn (chủ SP 27/10, lời 4)

Nguồn: `docs/superpowers/plans/2026-10-27-sua-toi.md` mục D3. Không đổi bố cục trang, không mockup mới (đổi một ô theo mẫu sẵn có — plan.md 1.3b).

## Nguyên nhân (đã kiểm)
- `BranchFilter` / `WeekBranchFilter` vẽ nhãn "Chi nhánh" (`.label`) chồng trên ô `field w-44`: ô cao ~38 px, chữ 16 px, cả khối cao ~60 px trong khi nút / công tắc cùng hàng cao 32 px, chữ 13 px → lệch hàng, đẩy hàng cao lên (Tổng quan, Lịch Test, Công việc, Phân tích, Vận hành, Chờ duyệt, Kế hoạch Test).
- Lưu trữ tự vẽ một `<select>` riêng ("Mọi chi nhánh").

## Sửa
- Một ô chung `OChiNhanh` (`web/src/ui/Filters.tsx`), cả `BranchFilter` và `WeekBranchFilter` dùng: nhãn "Chi nhánh" nằm TRONG ô bên trái, cao 32 (điện thoại 44), chữ 13 / 600, viền / nền theo token ô nhập, viền accent khi focus. Lựa chọn rỗng ghi "Tất cả" (nhãn đã nói "Chi nhánh").
- Lưu trữ dùng `BranchFilter` (bỏ select riêng).
- Phân tích: hàng tiêu đề căn giữa thay căn đáy (trước đây căn đáy vì ô có nhãn chồng).
- Ô "Mọi hạn" ở Công việc (cùng hàng): cao 36 → 32, chữ 13 / 600 cho thẳng hàng với ô chi nhánh (chủ SP 27/10 chỉ ảnh lệch hàng).
- GIỮ: tự ẩn khi tài khoản một chi nhánh / hệ thống một chi nhánh; nhớ chi nhánh (`nhoChiNhanh`); vị trí ô ở từng trang như cũ.

## Bảng thao tác TRƯỚC → SAU
| Trang | Thao tác | TRƯỚC | SAU |
|---|---|---|---|
| Tổng quan, Phân tích, Lịch Test, Kế hoạch Test (+ ngăn Xếp lịch MT), Công việc, Chờ duyệt, Vận hành | Chọn chi nhánh / Tất cả | select có nhãn trên | cùng select, nhãn trong ô — không mất thao tác |
| Lưu trữ | Chọn chi nhánh / Mọi chi nhánh | select riêng, hiện khi hệ thống > 1 chi nhánh | `BranchFilter`: thêm luật cũ "ẩn khi tài khoản chỉ một chi nhánh"; chọn vẫn nhớ |
| Mọi trang | Nhớ lựa chọn giữa các trang | có | có |

## Không làm (ghi rõ)
- HV & Lớp (`StudentsPage`) — session D2 sửa thân trang; D2 dùng `BranchFilter` thì tự nhận mẫu mới.
- Báo cáo đơn vị / form Giao việc / Tạo lớp: chọn chi nhánh là ô form trong panel, không phải bộ lọc — giữ.

## Ảnh TRƯỚC | SAU (vai Quản trị, 1440 tối · 375 sáng, phần đầu trang)
tong-quan, phan-tich, lich-test, ke-hoach-test, cong-viec, cho-duyet, van-hanh, luu-tru — mỗi trang `-1440.png` + `-375.png` trong thư mục này.
375 Lịch Test / Kế hoạch Test: ô chi nhánh nằm trong "Lọc" (gập) như cũ.
