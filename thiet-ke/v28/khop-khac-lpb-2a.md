# LPB-2a · panel Nhận thông tin — khớp / khác với mockup v28 (L3a · L3b · L3f; L4a phần Đổi GV)

Ảnh cặp cả màn (trái mockup · phải web, dữ liệu demo): `docs/anh/lpb-2a/{cvxl,head}-{1440,1280,375}.png` — CVXL lớp đích (Lương Thu Trang, đã "Nhận lớp" MB FT 104) và Head (Nguyễn Khánh Vy, MB BE 09).

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| L3a đầu panel "Nhận thông tin · Chuyển lớp · lớp · n em · vào tuần" | `KhungPanel` + `dauViec` (lớp · "Chuyển lớp · n em · vào {tuần}") | cvxl-1440, head-1440 | KHỚP (một tuần chung mới ghi "vào …") |
| L3a khối Phụ trách · Hạn · Theo dõi | `KhoiGiaoViec` sẵn có (ô bấm, HanBam, Theo dõi, Mô tả việc) | mọi ảnh | KHỚP (+ "Mô tả việc" của khối sẵn có — GIỮ) |
| L3a bảng `.bnt` 4 cột cân hết bề ngang, cột Tuyến mép phải | `BangEm` (lưới `minmax` 4 cột; không lịch Mock → 3 cột như ghi chú mục 3) | cvxl-1440 / 1280, head-1280 | KHỚP |
| L3a tên em + ˅ mở Tuyến của em dưới dòng (máy tính mở em đầu) | `MuiChev` + `KhayTuyen` (`GET /tuyen/chuyen_lop/:lệnh`, `KhoiTuyen` "Xong a/b") | cvxl-1440 | KHỚP |
| L3a lịch Mock "MTn · tuần · đi theo em / ở lại lớp cũ" | `lichMock` của máy chủ; "ở lại" màu `--soon` + chữ | cvxl-1440 | KHỚP |
| L3a chuỗi chấm Tuyến từng em | `ChuoiCham` (`chuoiTuyen` của GET panel) | mọi ảnh | KHỚP |
| L3a Việc con | `MucViecCon` sẵn có | mọi ảnh | KHỚP |
| L3a Lịch sử "n mục · Máy tạo …" | `LichSuGap` + `dongLichSuGiao` | (demo: 0 mục → ẩn) | KHỚP khi có lịch sử |
| L3a chân "Xác nhận đã nhận" | chân `KhungPanel`: Đóng · **Xác nhận đã nhận** | mọi ảnh | KHÁC nhỏ — thêm "Đóng" (luật A3-08 chân như mọi panel) |
| L3b 375: tên + chấm dòng 1, "→ lớp mới · từ tuần" dòng 2, lịch dòng 3 | lưới 2 cột ≤ 639 | cvxl-375, head-375 | KHỚP |
| L3c xong: "Đã xác nhận · ai · lúc" + Việc tiếp; toast "✓ Đã xác nhận … Hoàn tác" | chân trái `✓ Đã xác nhận · {người} · {lúc}` + toast `hanhDong` Hoàn tác (`/mo-lai`) | (bấm thử trên demo) | KHỚP |
| L3d lỗi lưu "· bấm lại", nút vẫn bấm được | chân trái `⚠ {lỗi} · bấm lại`, nút giữ | — | KHỚP |
| L3e rỗng tab | danh sách sẵn có | — | GIỮ (không đổi) |
| L4a Đổi GV: Tuyến + bảng 3 cột Môn · GV cũ → mới · Hiệu lực | `KhoiTuyen` (`tuyen` của GET) + `BangDoi` | (demo chưa có việc Đổi GV) | KHỚP theo mã; chưa có ảnh dữ liệu thật |
| L4b việc tự đóng (lịch đổi huỷ) | dải "Việc đã đóng · …" + khối chỉ đọc (`mo=false`) | — | KHỚP |
| Đầu panel ⓘ · ⋯ | — | — | **BỎ** ở PR này: ⋯ "Mở lại" sau khi đóng toast → [XM] PR sau; ⓘ cần mục trợ giúp `hd` mới |

Tỉ lệ khớp thuần (hàng có ảnh / mã): 13 KHỚP · 1 KHÁC nhỏ · 1 BỎ → **≈ 93 %**.

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm dòng tab "Nhận thông tin" (Head / CVXL / người được giao) | "Việc này đã xong hoặc đã đổi" — không mở được | mở panel tại chỗ |
| Xác nhận đã nhận | không làm được trên web | một nút, việc rời danh sách, Hoàn tác ở toast |
| Đổi người / hạn / theo dõi / Việc con | không làm được | khối sẵn có (máy chủ quyết quyền) |
| Xem Tuyến từng em | không có | ˅ cạnh tên em |

## [XM]
- ⋯ "Mở lại" việc đã xác nhận sau khi toast tắt (máy chủ có `/mo-lai`, cờ `coTheMoLai`) — chưa vẽ nút; đề xuất ⋯ ở đầu panel ở PR sau.
- Phụ trách chính của tuyến (ghi chú v28 mục 0): chưa có chữ "Phụ trách chính {tên}" ở đầu khối Tuyến — phần chung của `KhoiTuyen`, để PR TUYEN.
