# UI-LICH-TUAN — bảng truy vết + KHỚP / KHÁC (khung `thiet-ke/v5/dieu-chinh-cuoi.html` khu a, phần Lịch Test tuần)

Ảnh: `cap-1440-sang.png` · `cap-1440-toi.png` · `cap-1280.png` · `cap-375.png` (trái mockup `?khu=a`, phải web, QL Vy, seed nguyên + 2 lượt S Ex).
Nửa dưới mockup khu a (Kế hoạch Test) là tab khác — UI-CHAM-TEST #534, không chấm ở đây. Thanh điều hướng trên cùng: khung chung NEN-V5, không chấm.

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Tiêu đề "Test" | `TestPage` | KHỚP |
| 2 | Tab "Lịch Test tuần · Kế hoạch Test" | `TAB_TEST_LABEL.lich` | KHỚP |
| 3 | Một thẻ bao cả Lịch | `LichTestTab` `.card` | KHỚP |
| 4 | `‹ W3 SEP 14/09 – 20/09 ›` | `WeekPicker gon` | KHỚP |
| 5 | Chip Tất cả · Fast Track · n · Lớp thường · n | `CongTacKhung kieu="chip"` | KHỚP |
| 6 | Xuất Excel + Lịch thi thật › bên phải | `LichTestTab` | KHỚP |
| 7 | Dải 3 số: số to + chữ sau, vạch ngăn | `DaiSo` | KHỚP |
| 8 | "bài quá hạn" số đỏ | `DaiSo` | KHỚP |
| 9 | Nhóm "Quá hạn chấm" chữ đỏ, thu, tóm tắt | `KhoiNo` + `NhomDau` | KHỚP |
| 10 | Nhóm "Test tuần này · n lớp · x đã chấm xong" | `NhomDau` | KHỚP |
| 11 | Hàng lớp: mã đậm | `HangLop` | KHỚP |
| 12 | "22 HV · MT3 20 · MT2 1" | `LuotLop` (`soHv`, `luot`) | KHỚP |
| 13 | Chip kỹ năng L R W S | `LuotLop` | KHỚP |
| 14 | Tiến độ "64/86 bài" | `TienDo` | KHỚP |
| 15 | "hạn 23/09" | `HanHang` (`Han`) | KHỚP |
| 16 | Badge Đang chấm / Chưa chấm / Đã chấm | `NhanLop` | KHỚP |
| 17 | ↗ cuối hàng | Link hồ sơ lớp | KHỚP |
| 18 | Hàng đang mở: nền nhấn + vạch trái | `HangNhom dang-mo` | KHỚP |
| 19 | Hàng lớp không có hàng tiêu đề cột | `HangLop` (bỏ thead) | KHỚP |
| 20 | Bảng HV: Học viên · MT · L R W1 W2 W S · Kỳ vọng · Overall · Kết quả | `LuoiFT` | KHỚP |
| 21 | Cột MT luôn có (MT2 / MT1 khác lượt) | `LuoiFT cot.mt` | KHỚP |
| 22 | Tên HV chữ đậm + ↗ | `SheetRow` (`lich`) | KHỚP |
| 23 | Kỳ vọng / Overall cột thường | `LuoiFT` (`lich`) | KHỚP |
| 24 | Ô điểm ✓ / ✗ màu theo kỳ vọng | `ODiemMt` | KHỚP |
| 25 | Kết quả SOS 1 / 2 / 3 + ✓ Đạt | `SosLuot` / `ChipSos` | KHỚP |
| 26 | Ô trống viền đứt + "vắng lần 1" | `ODiemMt` | KHỚP |
| 27 | S Ex | **dòng phụ** dưới em (`DongSExHv`) thay cột | KHÁC — chủ SP 22/10 (10 mục 6, mới hơn mockup) |
| 28 | Popover lịch sử khi bấm ô | "Lịch sử" trong hộp sửa điểm (cũng neo ô) | KHÁC — vị trí trong hộp, cùng nội dung |
| 29 | "✓ Đã lưu · 2 lần sửa" dưới ô | ✓ góc ô (`DauO`) | KHÁC — không đếm số lần sửa |
| 30 | (không có) | Thanh lưới "Dán từ Excel · ? · GV chấm S" | GIỮ — chức năng sẵn có (OV-15b, K4-24) |
| 31 | "+ 14 HV MT3 khác · Hiện tất cả 22" | hiện đủ HV | KHÁC — mockup rút gọn; web không ẩn em |
| 32 | 375: tuần + Lịch thi thật, chip ẩn | chip / Xuất vào "Lọc" | KHỚP |
| 33 | 375: dải 3 số, số trên chữ dưới | `DaiSo` | KHỚP |
| 34 | 375: hàng lớp ▸ mã · x/y bài · hạn | `HangLop hep` | KHỚP |
| 35 | 375: thẻ HV 5 ô + "MT3 · kỳ vọng" + kết quả phải | `TheHv` | KHỚP |
| 36 | 375: chip "S Ex · 23/09" trong thẻ | `ChipSEx` | KHỚP |
| 37 | 375: (không có) | "Dán từ Excel · ? · Xem dạng bảng" | GIỮ — chức năng sẵn có |
| 38 | (không có) | Dòng "MT cũ chưa nhập" cuối trang | GIỮ — PR-MT K2-32, ngoài thẻ |
| — | BỎ | Khối "Test chấm tuần này" (tuần trước), hàng tiêu đề cột hàng lớp, nút "Tuần này" luôn hiện, ⓘ luật lưới lớp thường ở hàng lọc (đã có "?" trong lưới), trang `/nhap-diem/*` | BỎ |

**Đếm:** 31 KHỚP / 38 = **82 %** · KHÁC có lý do chủ SP đã chốt: #27 → 32 / 38 = **84 %**. Chưa qua cổng 90 % — #28, #29, #31 (lệch nhỏ) và #30, #37, #38 (GIỮ chức năng) cần chủ SP đồng ý lý do.
