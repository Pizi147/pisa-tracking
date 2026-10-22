# UI-LICH-TUAN — bảng truy vết + KHỚP / KHÁC (khung `thiet-ke/v5/dieu-chinh-cuoi.html` khu a, phần Lịch Test tuần)

Ảnh (chụp lại theo rà PTA 22/10, DB demo cục bộ có thêm điểm mẫu + 4 lượt S Ex, không đổi seed):
- `cap-1440-sang` · `cap-1440-toi` · `cap-1280` · `cap-375` — **W3 AUG, MB FT 101 (15 em, đã có điểm)**: ✓ / ✗ theo kỳ vọng, Đạt, SOS 3, "Đủ điểm", "thiếu nhận xét", Đã kết thúc học, S Ex dòng phụ (có điểm + chưa chấm), **"+ 5 HV · Hiện tất cả 15"** (#31).
- `cap-1440-tuan-nay-vang` · `cap-375-tuan-nay-vang` — W3 SEP: ô vắng lần 1, "Vắng", SOS tạm, dời W4 SEP.
- `hop-lich-su-1440` — hộp sửa điểm R đang mở "Lịch sử" (3 lần hiệu chỉnh + lý do).
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
| 27 | S Ex | **dòng phụ** dưới em (`DongSExHv`) thay cột | KHỚP — chủ SP 22/10 (10 mục 6, mới hơn mockup) |
| 28 | Popover lịch sử khi bấm ô | "Lịch sử" trong hộp sửa điểm (cũng neo ô) | KHÁC chấp nhận (PTA) — lịch sử trong hộp sửa |
| 29 | "✓ Đã lưu · 2 lần sửa" dưới ô | ✓ góc ô (`DauO`) | KHÁC chấp nhận (PTA) — ✓ góc ô |
| 30 | (không có) | Thanh lưới "Dán từ Excel · ? · GV chấm S" | GIỮ (P11) — chức năng sẵn có (OV-15b, K4-24) |
| 31 | "+ 14 HV MT3 khác · Hiện tất cả 22" | "+ n HV · Hiện tất cả n" (> 12 em: 10 em đầu; mở từ việc / em thì hiện hết) | KHỚP — như Kế hoạch Test #534 |
| 32 | 375: tuần + Lịch thi thật, chip ẩn | chip / Xuất vào "Lọc" | KHỚP |
| 33 | 375: dải 3 số, số trên chữ dưới | `DaiSo` | KHỚP |
| 34 | 375: hàng lớp ▸ mã · x/y bài · hạn | `HangLop hep` | KHỚP |
| 35 | 375: thẻ HV 5 ô + "MT3 · kỳ vọng" + kết quả phải | `TheHv` | KHỚP |
| 36 | 375: chip "S Ex · 23/09" trong thẻ | `ChipSEx` | KHỚP |
| 37 | 375: (không có) | "Dán từ Excel · ? · Xem dạng bảng" | GIỮ (P11) — chức năng sẵn có |
| 38 | (không có) | Dòng "MT cũ chưa nhập" cuối trang | GIỮ (P11) — PR-MT K2-32, ngoài thẻ |
| — | BỎ | Khối "Test chấm tuần này" (tuần trước), hàng tiêu đề cột hàng lớp, nút "Tuần này" luôn hiện, ⓘ luật lưới lớp thường ở hàng lọc (đã có "?" trong lưới), trang `/nhap-diem/*` | BỎ |

**Đếm (sau rà PTA Plan 22/10):** 33 KHỚP · 2 KHÁC chấp nhận (PTA: #28, #29) · 3 GIỮ (P11: #30, #37, #38) → **38 / 38 đạt cổng** (KHỚP thuần 33 / 38 = 87 %; trên dòng không GIỮ 33 / 35 = 94 %). #31 thấy ở ảnh W3 AUG. 375: "thiếu nhận xét" xuống dòng, thẻ "Đã kết thúc học" gọn một dòng (tên cắt …).
