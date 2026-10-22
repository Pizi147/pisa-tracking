# UI-HV-LOP — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (khung `thiet-ke/v5/dieu-chinh-cuoi.html` khu d · Lịch thi theo V4 `mockup-v4-hoc-vien-lop.html` khung 3 + trường `mockup-ov14-5`)

Ảnh (vai QL Vy · MB, DB demo cục bộ: seed nguyên + 8 em được chốt ngày / dời tháng qua chính màn Lịch thi để có đủ trạng thái A / B / Dự kiến; không đổi seed):
- `cap-1440-sang` · `cap-1440-toi` · `cap-1280` · `cap-375` — Tất cả (SOS 1 / 2, PA quá hạn, Report 1, Thi 17/09, Chưa chốt · 09/2026, Dự kiến 10/2026, Chưa có lịch, việc quá hạn ⚠ dd/mm, KCK).
- `cap-sos-1440-toi` — Đang SOS (SOS 3 / 2 / 1, Chưa có PA, Quá hạn, Đang làm). `cap-lich-thi-1440-toi` · `cap-lich-thi-mo-1440-sang` — Lịch thi: nhóm A / B / Dự kiến / Chưa có tháng thi (gập), hàng mở chi tiết + hộp Chốt ngày.
- `cap-xuat-1440-sang` — Xuất theo bộ lọc "Thi tháng này". `cap-lop-loc-them-1440-sang` — lọc một lớp (dải lớp + badge) + Bộ lọc thêm mở.

| # | Khung mockup (khu d) | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Tiêu đề "Học viên & Lớp" | `StudentsPage` | KHỚP |
| 2 | Xuất · + Thêm học viên (phải) | đầu trang | KHỚP |
| 3 | Tab Tất cả n · Đang SOS n · Lịch thi n (không "Cần làm") | `HangTab` | KHỚP |
| 4 | Một thẻ: dải lọc trên, bảng dưới | `.card` | KHỚP |
| 5 | Ô "Tìm học viên, lớp" · chi nhánh · chương trình | `locChung` (chi nhánh chỉ khi > 1, chương trình khi có cả FT + thường) | KHỚP |
| 6 | Chip "Thi tháng này · n" | `thiThangNay` (ngày thi thật trong tháng — P4) | KHỚP |
| 7 | Chip "Có việc quá hạn · n" | `/my-work` (cùng nguồn Công việc) | KHỚP |
| 8 | "47 HV · 6 lớp" phải | `{n} HV · {m} lớp` | KHỚP |
| 9 | Cột Học viên: tên + "lớp · TVV …" / "chưa có TVV" | `TenEm` (máy chủ thêm `tvv`) | KHỚP |
| 10 | Lộ trình MT3/3 + Target | `hang.loTrinh` | KHỚP |
| 11 | MT gần nhất: ✓/✗ Overall / KV · tuần + L R W1 W2 S (đỏ dưới KV) | `OMtGan` + `MiniKn` | KHỚP |
| 12 | Xu hướng ↑ / ↓ / = + "so MTn" | `hang.xuHuong` | KHỚP |
| 13 | Hỗ trợ: chip SOS + "n Case · m PA" / "PA quá hạn" / "Không có Case" | `OHoTro` | KHỚP |
| 14 | Ý thức: chấm + bậc | `Nhan tone="doing"` | KHỚP |
| 15 | Lịch thi chip: Thi dd/mm · Chưa có lịch · Chưa chốt · mm/yyyy · Dự kiến mm/yyyy | `ChipLichThi` (máy chủ thêm `lich` = `trangThaiLichThi`) | KHỚP |
| 16 | Việc: việc + hạn dd/mm, ⚠ đỏ khi quá hạn | `OViec` (+ "+n việc") | KHỚP |
| 17 | Hộp Xuất: "Theo bộ lọc: … · n HV" · Phạm vi Bộ lọc hiện tại / Cả chi nhánh · Cột · "Ghi vào nhật ký xuất" · Xuất n HV | `NganXuatDs` | KHÁC — panel phải chuẩn NEN-PANEL (không hộp neo); 18 cột thật của tệp xuất thay 8 cột gộp của mockup ("Việc đang mở", "SĐT phụ huynh" chưa có ở máy chủ) |
| 18 | 375: thẻ em (tên · lớp · chip) + dòng việc / Target · Overall | `TheHvGon` | KHỚP |
| 19 | Đang SOS: chip Tất cả · SOS 3 · SOS 2 · SOS 1 · PA quá hạn | `?muc=` | KHỚP |
| 20 | Đang SOS: Học viên · Mức · kỹ năng · Từ · Overall / kỳ vọng · Case · PA (+ trạng thái) · Việc tiếp | `BangSosGon` | KHỚP |
| 21 | Overall "→ MT3 6.0" (kỳ vọng MT kế) | — | KHÁC — chưa có số kỳ vọng MT kế trên dòng SOS (xem [XM-3]) |
| 22 | Việc tiếp "· cô Hà" (người làm) | `ViecTiepDong` (chữ + hạn) | KHÁC — dòng SOS máy chủ chưa gửi người làm việc tiếp |
| 23 | Lịch thi: Tháng dự kiến [từ] → [đến] + chi nhánh + đếm "n chưa chốt · n đã chốt · n dự kiến" | `GocLichThi` (`ONgay kieu="thang"`) | KHỚP |
| 24 | Nhóm: Chưa chốt ngày — đã tới tháng · Đã chốt ngày · Dự kiến · ▸ Chưa có tháng thi (gập) | `NHOM` | KHỚP |
| 25 | Hàng: Học viên · MT gần nhất · Target · Lịch thi · Ghi chú (ai · ngày) · Chốt ngày / Dời tháng (B nhấn) · Sửa ngày (A) · ▸ | `DongLichThi` | KHỚP |
| 26 | Mở dưới hàng: MT 5 ô · Test sắp tới · Case · GVCN · Lịch sử lịch thi | `ChiTietDuoiHang` (máy chủ `chiTiet`) | KHỚP |
| 27 | V4: Chốt ngày / Dời tháng = hộp neo (ngày / tháng + ghi chú) | `HopLich` dưới hàng | KHỚP |
| 28 | Ghi chú "Chưa kết luận" khi trống | ô ghi chú (placeholder) | KHỚP |
| — | BỎ | "Cần làm" (chủ SP 22/10), cột tick + "Xuất các HV đã chọn", 4 nút Kết luận / "Giữ tháng" / "Cần xác nhận" / 12 nút tháng / "Gồm HV chưa có dự kiến" (V4 Q-C3 ①), hàng lớp gập + bảng điểm theo lớp | BỎ |

**Đếm:** 25 KHỚP · 3 KHÁC (#17 panel chuẩn + cột thật; #21, #22 dữ liệu máy chủ chưa có) → 25 / 28 = **89 %** (KHÁC chờ chủ SP / PTA đồng ý lý do; #21–#22 có thể thêm ở máy chủ nếu cần → 96 %).

## Thao tác TRƯỚC → SAU (luật 8b, `10` mục 8)

| Thao tác trước PR | Sau PR | Ghi chú |
|---|---|---|
| + Học viên (đầu trang) | **GIỮ** "+ Thêm học viên" (đầu trang; ⋯ ở 375) | |
| + Lớp mới (đầu trang) | **GIỮ** trong ⋯ đầu trang | V4 / mockup đầu trang chỉ Xuất + Thêm HV |
| ⋯ Lưu trữ | **GIỮ** | |
| Xuất Excel · n HV | **GIỮ** "Xuất" (theo bộ lọc + chọn cột, phạm vi rộng "Cả chi nhánh") | Lịch thi: nút Xuất riêng → nút đầu trang (TVV / CX cũng vậy) |
| Hàng lớp: mở / gập, ⋯ Hồ sơ lớp · Nhập điểm · + Học viên, badge (bài chờ chấm → Lịch Test, chờ duyệt, quá hạn, xếp lớp, lộ trình…) | **GIỮ** qua ô chọn "Lớp" → **dải lớp** (badge cùng `badgeLop`, cùng đích bấm; ⋯ Hồ sơ lớp · Nhập điểm (panel) · + Học viên); mã lớp dưới tên em mở Hồ sơ lớp | [XM-1] vị trí |
| ⋯ cuối dòng em (Báo Case, Ghi vi phạm, Xử lý Ý thức, Sửa thông tin, Chuyển lớp / đề xuất, Lưu trữ / Học lại, Mở hồ sơ) | **GIỮ** cột ⋯ (cùng `useThaoTacDongHocVien`, quyền theo lớp của em) | "Nhập điểm" theo từng em → dùng Nhập điểm của lớp (dải lớp) — [XM-2] |
| Việc tiếp theo (bấm → đích) | **GIỮ** ô Việc bấm = làm tại chỗ (Case → panel một em; việc làm được trong panel → PanelViec; còn lại → trang việc) | |
| Góc "Cần làm" + lọc phụ Quá hạn / Chờ duyệt / Thiếu thông tin | Quá hạn → chip "Có việc quá hạn"; Chờ duyệt → badge dải lớp + Công việc; Thiếu thông tin → ⋯ Sửa thông tin + Công việc | Bỏ góc theo chủ SP 22/10; link cũ `view=can-lam / qua-han` mở Tất cả + chip quá hạn |
| Chip "Đã thi · chờ kết quả" | **GIỮ** | |
| Bộ lọc thêm (Case / PA · kỹ năng · kết quả · thời gian) | **GIỮ** | |
| Xếp: Tên / Cần chú ý trước | **GIỮ** "Xếp: Lớp · tên / Cần chú ý trước" | danh sách phẳng nên mặc định theo lớp rồi tên |
| Loại lớp (Tất cả · FT · thường) | **GIỮ** ô "chương trình" | |
| Phạm vi · Chi nhánh | **GIỮ** | |
| Phân trang | **GIỮ** | |
| Ô tick + thanh "Xuất các HV đã chọn" | **BỎ** (chủ SP: Xuất theo bộ lọc) | |
| Đang SOS: Mở (panel một em), Nguyên nhân / Phương án / Kết quả / Trạng thái | Panel một em: bấm "n Case · m PA"; cột theo khu d (Case · PA + trạng thái, Việc tiếp) | nguyên nhân / PA chi tiết ở panel |
| Lịch thi: Chốt ngày, Chuyển tháng, ghi chú tại hàng | **GIỮ** Chốt ngày · Dời tháng · ghi chú sửa tại chỗ · Sửa ngày (đã chốt) | Giữ tháng / Cần xác nhận bỏ theo V4 Q-C3 ① |
| Admin: cột Lượt MT gần nhất · Ô chưa nhập | Danh sách chung (MT gần nhất, Lịch thi) | [XM-4] |

## [XM] — hỏi PTA Plan trước khi chốt
1. **Thao tác lớp**: thay hàng lớp bằng ô "Lớp" + dải lớp (badge + ⋯). Đồng ý vị trí này, hay muốn thêm ⋯ lớp ngay trên dòng em?
2. **Nhập điểm theo em** trong ⋯ dòng em (trước có khi em có ô chờ nhập của người xem): nay vào Nhập điểm của lớp. Cần thêm lại (máy chủ gửi `nhapDiem` theo em)?
3. Đang SOS: thêm "→ MT kế · kỳ vọng" và người làm việc tiếp như mockup (cần máy chủ gửi thêm 2 trường)?
4. Admin MT: giữ cột "Ô chưa nhập" riêng như trước hay dùng danh sách chung?
