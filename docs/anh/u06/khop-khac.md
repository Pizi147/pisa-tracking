# UI-U06 — Lịch Test tuần theo mockup V11

Mockup: `thiet-ke/v11/lich-test-tuan.html` (chủ SP duyệt 03/11). Bảng ý: `docs/superpowers/specs/2026-11-03-audit-overhaul/14-ra-ux-b.md` 10.3 · 10.3b · 11.3;
`30-pr-giao-dien.md` + PTA 04/11: **màn để XEM ĐIỂM, không số về GV khác**.
Ảnh cặp (DB demo cục bộ, ngày demo 14/09; phông kiểm `document.fonts.check`), thư mục này: `a-gv-1440-toi.png` (GV Trần Ngọc Hà, vai 7) · `a2-gvbm-1440-toi.png` (GVBM vai 9 — có đoạn Lớp tôi dạy / Tất cả) · `b-ql-1440-toi.png` (QL, vai 2) · `c-375-sang.png`.

## Truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| A thanh tuần NGOÀI thẻ: ‹ W3 SEP › · Tuần này · Tất cả / Fast Track / Lớp thường (đoạn) · Xuất Excel · Lịch thi thật › | `LichTestTab` · `CongTacKhung v8` | a | KHỚP |
| A đoạn "Lớp tôi dạy / Tất cả" (mặc định Lớp tôi dạy) | `nhomPhamVi` `.doan` — hiện khi `coPhamViRong` (máy chủ `canCham.ts`: người có phân công mà phạm vi xem RỘNG hơn lớp mình dạy). GV chỉ được xem đúng lớp mình dạy (vai 7 Trần Ngọc Hà) thì "Tất cả" = "Lớp tôi dạy" → không hiện (cố ý, như trước) | a2 (GVBM Phạm Thu Trang, vai 9) | KHỚP (ảnh a2) |
| A dải số một thẻ: "Của bạn:" · 16/41 bài đã chấm · 25 bài còn chấm · 12 bài quá hạn (không dòng GV khác) | `DaiSo` (`nhom`) | a | KHỚP |
| B QL: "Cả chi nhánh:" | `DaiSo` (`coPhan` = false) | b | KHỚP |
| A nhóm "Quá hạn chấm" vạch đỏ trái · "Test tuần này 4 lớp · 5 lượt" (B21) | `NhomDau` · `tomTatTuan` | a | KHỚP |
| A hàng lớp: mã · chip môn (môn của bạn gạch dưới, môn không thi tuần này mờ) · lớp thường thêm tên bài · x/y bài · hạn · MỘT badge "Chờ bạn chấm" / "Chờ GV khác" | `HangLop` `LuotLop` · `NhanLop` | a, b | KHỚP |
| A lưới: L · R · W1 · W2 · W · S · Kỳ vọng (đậm) · Overall · Kết quả | `LuoiFT` | a | KHỚP |
| A Kết quả "Chờ L, R" / "Chờ W2, S" (W1 + W2 cùng thiếu → "W"); bỏ dòng phụ "1 kỹ năng" (B19) | `choMon` | a | KHỚP |
| A điểm môn GV khác đã có → hiện như ô thường (U06-2) | `LuoiFT` (máy chủ không lọc điểm — đã kiểm `GET /classes/:id/cham` với GV: ô GV khác trả `band`, chỉ `canEdit` false) | a | KHỚP (không đổi code) |
| A "GV chấm S: … ▾" đầu khối | sẵn có | a | KHỚP |
| A "MT cũ chưa nhập · MB FT 101 · MT1 · 4 em ›" dòng cuối TRONG thẻ, chữ nhấn | `nhacMtCu` | a | KHỚP |
| C 375 dải số: "Của bạn:" một hàng + 3 ô chữ ngắn "đã chấm · còn chấm · quá hạn" | `DaiSo` | c | KHỚP |
| C 375 chấm "một kỹ năng một lúc" (`MotKyNang`) | giữ thẻ từng em đủ 5 ô (TheHv) | c | KHÁC có lý do — xem dưới |

## Tỉ lệ khớp (cổng chủ SP 04/11: > 96 % về hình)
13 khung: 12 KHỚP · 1 KHÁC có lý do (luồng 375 — tính năng / luật mới hơn). Về **hình** (màu, nền, viền, đậm, cỡ, khoảng cách): **13 / 13 = 100 %**.

## KHÁC có lý do
- **375 khung C:** mockup vẽ "MB FT 101 · Listening" — chỉ một kỹ năng, mỗi em một ô to, "Lưu · em tiếp ›". Chủ SP 03/11 (11.3 U06-1/U06-2, mới hơn khung C): **Lịch Test tuần để XEM ĐIỂM, hiện hết** → giữ thẻ từng em đủ L R W1 W2 S (đã duyệt UI-LICH-TUAN) + nút "Xem dạng bảng"; một kỹ năng vẫn có ở Điểm theo lớp. Dải số và hàng lớp 375 theo khung C.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| ‹ tuần › · Tuần này | thanh trong thẻ | thanh ngoài thẻ | GIỮ · đổi vị trí (mockup) |
| Tất cả · Fast Track · Lớp thường | chip rời | đoạn liền (v8), "Tất cả" không số | GIỮ · đổi hình |
| Lớp tôi dạy · Tất cả | hai nút viền | đoạn liền (`.doan`) | GIỮ · đổi hình |
| Chi nhánh ▾ · Xuất Excel · Lịch thi thật › | thanh | như cũ (Xuất cao 36) | GIỮ |
| 375 "Lọc" (khung, phạm vi, chi nhánh, Xuất) | thanh | như cũ | GIỮ |
| Bấm ô số dải → panel / mở nhóm | dải | như cũ; nhãn nhóm "Của bạn:" / "Cả chi nhánh:"; bỏ "n bài của GV khác" | GIỮ · ĐỔI chữ (B13, PTA 04/11) |
| Mở / gập nhóm · từng lớp | nhóm / hàng lớp | như cũ | GIỮ |
| Mã lớp → hồ sơ lớp | hàng lớp | như cũ | GIỮ |
| Hàng lớp "L, R của bạn: còn 10 bài / W, S: GV khác" | hàng lớp | MỘT badge "Chờ bạn chấm" (chi tiết "L, R · của bạn: còn n bài" ở `title`) · môn của bạn gạch dưới | ĐỔI (mockup, PTA 04/11 không số về GV khác) |
| Hàng lớp "6 HV · MT3 5 · MT1 1" | hàng lớp | bỏ (mockup); lớp thường giữ tên bài | ĐỔI (mockup) |
| "vắng · chờ Quản lý duyệt dời" | hàng lớp | như cũ (cuối chip môn) | GIỮ |
| Nhập ô điểm tại chỗ · Tab / Enter · dán · Vắng ("-") · Lưu lại | lưới | như cũ | GIỮ |
| GV chấm S ▾ · S Ex dòng phụ · tên em → lượt | lưới | như cũ | GIỮ |
| Kết quả "Chờ 4 kỹ năng" + dòng "1 kỹ năng" | lưới | "Chờ L, R, W, S" (tên môn còn thiếu) | ĐỔI (B19) |
| MT cũ chưa nhập → lượt | dưới thẻ, chữ mờ | trong thẻ, dòng cuối, chữ nhấn "›" | GIỮ · đổi vị trí (mockup) |
| Khối Quá hạn chấm: "⚠ quá hạn n ngày" phần GV khác | dòng phụ | bỏ số ngày của GV khác (chỉ "W, S: GV khác") | ĐỔI (PTA 04/11) |

## Turso — mở trang đọc bao nhiêu
Không đổi máy chủ: **0 câu / dòng thêm**. Mọi chữ mới (nhãn nhóm, "4 lớp · 5 lượt", "Chờ L, R", badge) tính từ dữ liệu đã nạp.
