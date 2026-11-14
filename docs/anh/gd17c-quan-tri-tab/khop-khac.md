# GD-17c — Quản trị: Tài khoản · Case & SOS · Mở sửa lịch Test · Đã xoá (mockup v21 ⑩ K1, K6, K7, K9, K11)

Plan `12-plan-giao-dien-dot-3.md` dòng GD-17 — phần đổi nhỏ còn lại từng tab (17a #1673 phần chung · 17b #1675 Chương trình). Seed 14/09, Quản trị (1). Phông Be Vietnam Pro đã nạp.

## Ảnh

| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-k1-1440-toi.png` | K1 | Tài khoản: Chi nhánh / Vai trò / Nhóm theo — một dáng ô chọn thường |
| `cap-k6-1440-toi.png` | K6 | Case & SOS: tên nhóm ô có viền; "Ẩn", "+ Thêm nhóm" là nút |
| `cap-k7-1440-toi.png` | K7 | Mở sửa lịch Test là công tắc (vừa bật, toast Hoàn tác) |
| `cap-k9-1440-toi.png` | K9 | Đã xoá: đầu "Đã xoá · n" + ⓘ (câu 30 ngày) |
| `cap-k11-375-sang.png` | K11a | 375 Tài khoản |

## 1. Truy vết

| # | Khung | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | K1 lọc Chi nhánh / Vai trò / Nhóm theo, ô Vai trò khi duyệt, ô vai trong hộp sửa vai → ô chọn thường A6 (thay `ChonDangNut`, `select.field w-36`, `w-44`) | `OChonThuong` (= `OChon` Phân tích) ở `AccountsAdmin`, `SuaVaiChiNhanh` | KHỚP |
| 2 | K1 badge "Đăng ký chờ duyệt" → badge viên mờ (chỉ đếm, không hạn — [XM-9]) | `BadgeMo` | KHỚP |
| 3 | K6 tên nhóm: ô có viền (thay chữ + ✎); "Ẩn", "+ Thêm nhóm" là nút (luật G2 "nút là nút"); Hiện lại / Xoá cùng dáng nút | `BangDanhSach` | KHỚP |
| 4 | K7 Mở sửa lịch Test: nút Bật / Tắt + chip → công tắc cùng dáng Quyền; bấm là có hiệu lực, toast "… · Hoàn tác" (= bấm lại); ai bật lúc nào giữ; lưu lỗi → công tắc về vị trí cũ + toast lỗi | `MoSuaLichTest` (`role="switch"`, `toast.hoanTac`, chặn bấm lặp bằng ref) | KHỚP |
| 5 | K9 Đã xoá (Quản trị): câu "Giữ 30 ngày…" (chú thích tĩnh) → ⓘ ở đầu bảng "Đã xoá · n" | `DaXoaAdmin` | KHỚP |
| 6 | K11 375: giữ thẻ, ô chọn cao 44 | `OChonThuong` (`max-sm:h-11`) | KHỚP |

**KHỚP 6 / 6 = 100 %.**

Bấm thử (DB seed cục bộ): công tắc Mở sửa lịch Test tắt → bật (máy chủ `bat: true`) → Hoàn tác → tắt (`bat: false`).

## 2. GIỮ / ghi chú
- Nút ↑ ↓ trong nhóm đổi thứ tự (khi đang sửa dòng Case & SOS) giữ `btn-ghost` (nhóm nút liền, không phải nút đứng riêng).
- "Đăng ký chờ duyệt 0" (khi rỗng) giữ một dòng chữ như cũ.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Lọc / nhóm Tài khoản · duyệt đăng ký chọn vai · sửa vai tại chip | có | giữ (chỉ đổi dáng ô) |
| Case & SOS: sửa tên · Ẩn · Hiện lại · Xoá · + Thêm nhóm · kéo thả | có | giữ (dáng nút / ô) |
| Mở sửa lịch Test | nút Bật / Tắt | công tắc + Hoàn tác |
| Đã xoá: Khôi phục | có | giữ |

Không thao tác nào bị mất.

## 4. Turso — 0
Không đường mới, không đọc thêm.

## Sửa sau rà (PTA 14/11)
- Ảnh chụp lại bằng tài khoản Quản trị demo tên giả; nhánh gộp một commit, không còn ảnh cũ trong lịch sử.
- K1: 0 đăng ký chờ duyệt thì không hiện khối / dòng (lời 40); có đăng ký thì hiện thẻ như mockup. Hướng dẫn "?" chỉ tới khối này khi 0 thì báo "Chưa có việc nào ở đây".
- K6: nút kéo là một "⠿" gọn (bỏ đệm trái làm cột 32 px cắt thành "⠿…"), căn giữa dọc với ô tên — đo lệch tâm 0 px (3 dòng đầu).
