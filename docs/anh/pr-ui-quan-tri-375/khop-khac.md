# UI-TACH-TRUONG PR 2 — B14 Quản trị 375 (mockup `thiet-ke/2026-11-08-audit-ui-mockup.html` #b14)

Ảnh cặp (seed 14/09/2026, vai Quản trị): `quan-tri-375-{sang,toi}.png`, `quan-tri-375-sang-loc-mo.png` (tấm Lọc mở), `quan-tri-1440-{toi,sang}.png` (1440 giữ bố cục; mockup không vẽ 1440 — bên trái là khung 375).

## Truy vết khung → thành phần → ảnh

| Khung mockup 375 | Thành phần web | Ảnh | Khớp |
|---|---|---|---|
| Đang dùng / Đã xoá + "+ Tạo" một hàng | `AccountsAdmin` (điện thoại: ngoài thẻ, không tiêu đề thẻ) | quan-tri-375-* | KHỚP |
| Tìm + "Lọc ▾" một hàng | ô tìm + nút Lọc (số bộ lọc đang bật, viền nhấn) | quan-tri-375-* | KHỚP |
| Tấm Lọc: chi nhánh, vai trò, kỹ năng, nhóm | tấm mở ngay dưới (mẫu "Lọc" của Lịch Test), `ChonDangNut` | quan-tri-375-sang-loc-mo | mockup không vẽ tấm — theo mẫu web |
| Thẻ tài khoản: tên · mã · Sửa · ⋯ / email / vai · chi nhánh, kỹ năng, Chấm S | `TheTaiKhoan` + `NutTaiKhoan` (chung với hàng bảng) | quan-tri-375-* | KHỚP |
| GIỮ: số điện thoại sau mã, quyền cấp riêng, "Không duyệt" + lý do, Duyệt lại, Khôi phục, nhóm theo (đầu nhóm bấm gập) | thẻ | — | mockup không vẽ, giữ đủ |
| GIỮ: hàng chip phân loại + Xoá lọc; số "n / m tài khoản" khi đang lọc | trong thẻ | — | giữ |
| 1440: ô chọn `select` gốc → `ChonDangNut` (QT6) | hàng lọc | quan-tri-1440-* | đổi dáng ô chọn, bố cục giữ |

## Thao tác TRƯỚC → SAU (375)

| Thao tác | Trước | Sau |
|---|---|---|
| Đang dùng / Đã xoá | đoạn trong tiêu đề thẻ | đoạn đầu trang |
| + Tạo tài khoản | nút | nút "+ Tạo" (tên đủ cho trình đọc màn) |
| Lọc chi nhánh / vai trò / kỹ năng / nhóm | 3 select + đoạn kỹ năng luôn hiện | trong tấm "Lọc ▾" |
| Sửa, ⋯ (Sửa thông tin, Xoá), Duyệt lại, Khôi phục | hàng bảng cuộn ngang | trên thẻ |
| Duyệt đăng ký chờ | thẻ Đăng ký chờ duyệt | giữ |
| Chip phân loại, Xoá lọc | hàng chip | giữ |

Dòng đọc Turso: không đổi (cùng `/admin/accounts`, `/ref/branches`; không thêm request).
