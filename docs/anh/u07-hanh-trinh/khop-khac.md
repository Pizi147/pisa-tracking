# UI-HO-SO-HV U07 — Hành trình theo kỹ năng (tab Lộ trình & lớp) theo mockup audit 03/11

Mockup: `thiet-ke/audit-0311/u07-hanh-trinh.html` (bảng ý `13-ra-ux-a.md`: UA-14, UA-15, UA-16, 6b dòng U07). Ảnh cặp mockup | web (`scripts/anh-cap.mjs`, DB demo cục bộ,
ngày demo 14/09, phông Be Vietnam Pro đã kiểm `document.fonts.check` = true). Em demo: **Vũ Ngọc Lan** (id 47, MB FT 101) — Case Listening / Reading mở (1 PA chờ xác nhận),
Case Speaking **đã huỷ** (không cần theo dõi); ngày demo chỉ có MT1 nên xu hướng một mốc ("MT1 5.0").
- `a1-tat-ca-ky-nang-1440-toi.png` — QL (vai 2) · Tất cả kỹ năng · bấm khung Case Speaking (đã huỷ) → hộp nổi
- `b1-danh-sach-375-sang.png` — 375 · mặc định Danh sách sự kiện theo kỹ năng

## Truy vết khung → thành phần → ảnh

| # | Ý mockup | Thành phần web | Kết quả | Ảnh |
|---|---|---|---|---|
| 1 | Xu hướng **hai mốc có tên** "MT1 5.0 → MT2 4.5 · giảm 0.5" (UA-16); mốc thật, mốc mở hồ sơ Mock | `XuHuong` (`chuoiDiem` mang `nhan`) | KHỚP | a1, b1 |
| 2 | Trục: **tuần lịch** "W2 OCT" dòng chính 13 / 600, tuần học số nhỏ dưới; tuần này nền nhấn + "· nay"; nhãn "Tuần lịch · tuần học" | lưới `HanhTrinh` (`xepHangLuoi` `coThang: false`) | KHỚP | a1 |
| 3 | Trạng thái Case ở **cột nhãn trái** ("● Đang làm · 3 tuần", "⚠ Quá hạn · …", "– Huỷ W3 SEP") — không trên vùng thời gian | `TrangThaiCase` + `trangThai` từng Case (máy chủ, `trangThaiHop`) | KHỚP | a1 |
| 4 | PA **một nguồn**: "1 PA chờ xác nhận" ở dòng phụ Case, hàng PA và khối trên trục (UA-14) | `chuSoPa` (dongPhuVanDe · chuHangPa · khoiCho + tên PA chờ) | KHỚP | a1 |
| 5 | Case huỷ: "– Huỷ W3 SEP" xám, khung viền xám, không ✓, không SOS, PA gạch; không khối chờ (UA-15) | `huy` (máy chủ) · `VanDeHang` · `KhoiPa huy` · `trangThaiHop` "Huỷ {tuan}" | KHỚP | a1, b1 |
| 6 | Bấm / Enter khung Case → **hộp nổi** (tên · ✗ điểm / kỳ vọng · mở · phụ trách · PA · trạng thái · Mở Case › · Hồ sơ MTn ›), không bị cắt; 375 khay đáy | `HopCase` (portal, lật / dịch, Esc, bấm ngoài) | KHỚP | a1 |
| 7 | 375: mặc định **Danh sách** sự kiện theo kỹ năng (xu hướng → sự kiện tuần lịch, mới nhất trên), "Biểu đồ" vẫn mở | `DanhSachSuKien` · `BoLocDoan` Danh sách / Biểu đồ | KHỚP | b1 |
| 8 | Một thẻ "Hành trình · Fast Track · lớp" — chọn kỹ năng + "3 tháng gần nhất" ở đầu thẻ; cột nhãn 330 px nền phụ kẻ phải; kẻ ngang giữa nhóm; chú giải ở chân | `HanhTrinh`, `CotGhim`, `ChuGiai` | KHỚP | a1 |
| 9 | Hàng Lớp "MB FT 101 · GVCN …" nền phụ; Đợt Test chip một dòng "MT1 5.5 · SOS 3" | `HanhTrinh` | KHỚP | a1 |
| 10 | Rỗng: trục vẫn vẽ, mỗi kỹ năng "chưa có điểm" · lỗi trong thẻ + Thử lại | `XuHuong`, nhánh `error` (thẻ "Hành trình" + `ErrorState` Thử lại) | KHỚP | — (cần làm hỏng API; kiểm bằng mã) |

KHỚP 10 / 10.

## Thao tác TRƯỚC → SAU

| Trước (main) | Sau | Giữ / đổi — vì sao |
|---|---|---|
| Chọn kỹ năng (Tất cả · L · R · W1 · W2 · S) · "3 tháng gần nhất / Cả giai đoạn" · chương theo lớp (bấm → trục) · mốc điểm mở hồ sơ Mock · ghim Đợt Test mở lượt · "+n vấn đề cũ hơn" · bấm tên Case / khối PA mở Case | như cũ | GIỮ |
| Bấm khung Case trên trục = mở Case ngay | mở **hộp nổi** (Mở Case › · Hồ sơ MTn ›); bấm tên Case ở cột trái vẫn mở Case ngay | ĐỔI — U07 #6 (F07); thêm một bấm chỉ ở khung, lối nhanh vẫn ở tên |
| "Xem gọn" luôn hiện | hiện khi "Cả giai đoạn" hoặc màn hẹp (Biểu đồ) | ĐỔI chỗ hiện — 3 tháng ở 1440 vừa khung, nút thừa |
| Chuỗi 5 mốc "5.0 Giảm 0.5 4.5 ?" | hai mốc có tên; chuỗi đủ ở tooltip | ĐỔI chữ — UA-16 |
| Hàng tháng + hàng Tuần + hàng Tuần học (chip Tạm dừng ở hàng Tuần học) | một hàng tuần lịch + tuần học nhỏ; tháng chỉ khi cột hẹp (Xem gọn); Tạm dừng = dải sọc + "–" ở tuần học + chú giải | ĐỔI — U07 #2 |
| Chip trạng thái đầu hộp kỹ năng (trên trục) | trạng thái từng Case ở cột trái; hộp không Case mở ghi "Không có Case mở" | ĐỔI vị trí — U07 #3 |
| 375: "Xem gọn" kéo ngang | Danh sách mặc định; Biểu đồ (Xem gọn bật sẵn) | ĐỔI mặc định — U07 #7 |
| Chú giải 9 mục trên trục | 6 mục ở chân thẻ (+ kết quả PA / tạm dừng khi có) | ĐỔI — mockup |

## Turso
Không đường mới, không câu mới. `/students/:id/hanh-trinh`: câu Case thêm một cột con `owner_name` (users theo khoá chính) — **+1 dòng / Case** (em 3–5 Case → +3–5 dòng / lần mở);
trạng thái, cờ huỷ, tên PA chờ tính từ dữ liệu đã nạp. Hộp nổi / danh sách 375 không gọi thêm.
