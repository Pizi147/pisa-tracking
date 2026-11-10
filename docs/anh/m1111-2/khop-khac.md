# M1111-2 · Khai / sửa cấp bậc vi phạm — khớp / khác mockup

Mockup đã duyệt: `thiet-ke/2026-11-11-mockup-1111/2-khai-cap-bac.html` (#1326, chủ SP duyệt 11/11). Ảnh cặp (seed, GVCN Trần Ngọc Hà · MB FT 101):
`cap-mo-1440.png` (K1 vừa mở) · `cap-1440.png` (K2: Chọn tất cả → "Đặt bậc · Không" → Bùi Thảo Vy R1) · `cap-375.png` (K6a) · `cap-mot-em-1440.png` (K5 một em).

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Mã | Kết quả |
|---|---|---|---|
| K1 | mỗi em một dòng 44 px, cột cố định: ô tick · Học viên · Hiện tại (một dòng) · Bậc khai (7 chip) | `KhaiBacLoPanel.tsx` | KHỚP |
| K1 | chip: chưa chọn = chữ (viền khi rê / focus dòng; 375 viền mảnh) · bậc đang có = nền nhạt · vừa chọn = nền đặc; tên đủ ở `title` + tên đọc màn | `ChipBac` | KHỚP |
| K1 | dòng khoá: tên mờ + khoá + "Nhờ QL sửa" / "Chỉ QL sửa" tại chỗ chọn (lý do đủ ở `title`) | `IconKhoa` (BieuTuong) | KHỚP |
| K1 | tháng + ghi chú chung một hàng đầu panel; lọc Tất cả · Chưa khai · Đã có xử lý; ⓘ giải thích bậc khai ở dòng đầu panel | `KhaiBacLoPanel.tsx`, `NutLuat` | KHỚP |
| K2 | có tick → "n em đã chọn · Đặt bậc [chip] · Bỏ chọn" — bấm chip là áp ngay, thanh không giữ chip sáng | `datBac` | KHỚP |
| K2 | chân: "Đổi n em" · chia theo bậc · "n em hạ bậc" (vàng) · nút "Lưu · n em" | `chan` | KHỚP |
| K3 | sau lưu: dải ✓ + Hoàn tác (giữ), dòng vừa lưu "✓" + chip dáng "đang có"; em lỗi một dòng đỏ (đủ chữ ở `title`) | giữ logic cũ | KHỚP theo mã (chưa chụp — cần lưu thật trên seed) |
| K4 | QL: mọi em sửa được (máy chủ `capBac.duoc`), lọc "Đã có xử lý" | giữ quyền cũ | KHỚP theo mã |
| K5 | một em: cùng hàng chip cỡ lớn (luôn viền mảnh), tháng, ghi chú, "Lần xử lý kế tiếp" | `KhaiBacPanel.tsx` | KHỚP |
| — | chân: mockup có nút "Bỏ thay đổi" riêng | — | KHÁC có lý do: `KhungPanel` đã có "Huỷ thay đổi" (luật S3), không thêm nút trùng |
| — | mockup: chưa đổi gì thì nút Lưu tắt | — | KHÁC có lý do: luật N1 (bấm Lưu khi chưa đổi → báo còn thiếu "Bậc mới", không tắt nút im lặng) — [XM] nếu chủ SP muốn tắt |
| — | K5 mở từ Công việc: "Lưu · việc tiếp ›" (V12) | — | [XM] chưa làm — panel một em hiện vẫn "Đã lưu" + Đóng tại chỗ như trước; cần nối `onTiep` qua `PanelViec` (PR riêng nếu chủ SP cần) |
| — | mockup K6a 375: thanh "Bỏ chọn" cùng hàng | web xuống dòng | KHÁC nhỏ (chiều ngang 375) |

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Chọn bậc một em | ô thả "— giữ nguyên —" (2 bấm) | bấm chip (1 bấm) |
| Bỏ đổi một em | chọn lại "— giữ nguyên —" | bấm lại chip đang chọn |
| Áp nhiều em | tick → "Chọn bậc…" → "Áp cho n em" | tick → bấm chip "Đặt bậc" |
| Chọn tất cả | "Chọn tất cả (n)" | "Chọn tất cả" / "Chọn n em đang lọc" (theo lọc) |
| Tháng · ghi chú chung | hàng 2 khối công cụ | hàng đầu panel |
| Biết đã đổi gì | chữ "Khai mới / Nâng từ / ↓ Hạ từ" cột cuối | chip nền đặc; em đã có bậc "R2 → R1 ↓" ở Hiện tại; chân chia theo bậc + "n em hạ bậc" |
| Lưu theo lô · Hoàn tác cả lô · lỗi từng em | có | GIỮ (logic không đổi) |
| Em khoá + lý do | cột cuối, 2 dòng | một dòng tại chỗ chọn + khoá |
| Lọc em | không có | THÊM nhỏ: Tất cả · Chưa khai · Đã có xử lý |
| Một em (hồ sơ HV / Công việc) | lưới nút 2 cột | hàng chip cỡ lớn |

## Đọc Turso / tốc độ

0 request thêm — cùng `GET /classes/:id/y-thuc/lo` (một lần khi mở), `POST …/lo/cap-bac` theo lô; lọc trên dữ liệu đã nạp.
