# PR-1 PT-PANEL-FT — khớp / khác mockup v13 A1 · A1m · A2

Ảnh cặp (trái trước = main · phải sau = PR): `cap-a1-…` (SOS 3, hộp tiêu chí S mở), `cap-a1m-…` (Dưới kỳ vọng · L, 375, hộp W1 mở), `cap-a2-…` (Tiến bộ W1 · Tăng),
`cap-gv-dat-…` (Phân tích GV · Đạt kỳ vọng Test), `cap-tq-gv-…` (Tổng quan GV · HV tiến bộ, 1440 + 375). 1440 tối, 375 sáng. Dữ liệu demo Monbay (QL Nguyễn Khánh Vy; GV Trần Ngọc Hà).

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Ảnh | Kết quả |
|---|---|---|---|
| A1 | panel 820, đầu "SỐ · TEST + SOS" · tiêu đề ô · "chi nhánh · Fast Track · dữ liệu đến" | cap-a1 | KHỚP |
| A1 | "n lượt · m HV" | cap-a1 | KHỚP |
| A1 | Học viên · Lớp · MT (+ tuần) · L R W1 W2 S · OVR (vạch trái) · Kỳ vọng | cap-a1 | KHỚP |
| A1 | ô ✓ / ✗ trước số, màu vượt xanh lá · bằng xanh dương · dưới đỏ | cap-a1 | KHỚP (`ODiem`) |
| A1 | ô có tiêu chí / số câu bấm → hộp "FC 5 · LR 5 · GRA 5 · P 5 → 5.0" dưới ô, viền nhấn khi mở | cap-a1 | KHỚP |
| A1 | ô chỉ có band: không bấm | — | KHỚP |
| A1 | khối Cách tính | cap-a1 | KHỚP |
| A1m | thẻ 375: tên + "Kỳ vọng x" phải · lớp · MT · lưới 6 ô | cap-a1m | KHỚP |
| A1m | tiêu đề "Dưới kỳ vọng · L · tuần", cột L nền nhấn | cap-a1m | KHỚP |
| A1m | hộp "17/40 câu" (L / R) | — | KHỚP (dữ liệu demo ô L chỉ có band nên ảnh mở hộp W1) |
| A1m | nút "‹ Phân tích" đầu panel 375 | — | GIỮ như web (panel 375 hiện có nút ✕, không "‹" — mockup vẽ, web chưa có ở mọi panel số; không đổi trong PR này) |
| A2 | "SỐ · BÁO CÁO HV" · "Tiến bộ W1 · ↑ Tăng" · "chi nhánh · Fast Track · so mốc MT trước" | cap-a2 | KHỚP (bỏ khoảng "W3 OCT – W1 NOV": panel không biết khoảng; đã ở hàng lọc) |
| A2 | Học viên · Lớp · Trước (MTn · điểm) · Sau (MTn · ✓ / ✗ điểm) · Chênh · Kỳ vọng | cap-a2 | KHỚP |
| A2 | "MT1" ở cột Trước là link | cap-a2 | KHÁC: chữ mờ, không link — mục Tiến bộ chỉ giữ số MT lượt trước (không id lượt); link MT ở cột Sau có |
| — | Phân tích GV · Đạt kỳ vọng Test → P-FT, kỹ năng GV phụ trách viền nhấn, tab Chưa đạt · Đạt | cap-gv-dat | THÊM theo kiểm kê mục 2b (mockup không vẽ) |
| — | Tổng quan GV · HV tiến bộ + ô Tiến bộ Lớp tôi dạy → kiểu Tăng / Giữ / Giảm, thêm cột Kỹ năng (nhiều kỹ năng), giữ tab + phân trang | cap-tq-gv | THÊM (chủ SP 05/11) |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước (main) | Sau | |
|---|---|---|---|
| Bấm ô số FT (Test + SOS, Báo cáo HV, Phân tích GV) → panel | danh sách tên + dòng điểm (lượt hiện tại / sai lượt ở ô đếm HV) | bảng có điểm đúng lượt làm em vào ô | ĐỔI nội dung |
| Bấm ô điểm → c1–c4 / số câu | không có | có (P-FT) | THÊM |
| Tên em → hồ sơ · mã lớp → hồ sơ lớp · MTn → đợt test | tên / "Hồ sơ" | tên, lớp, MTn đều là link | GIỮ (+ link lớp, MT) |
| Tab Chưa đạt · Đạt | có (panel kết quả) | có | GIỮ |
| Phân trang 10 / 20 / 50 | có | có | GIỮ |
| Link "Hồ sơ" cuối dòng | có | tên em là link hồ sơ (như `BangLuotPanel` đã duyệt U08-2) | ĐỔI chỗ, không mất |
| Panel Case (ô Case, Chưa chốt PA, Đang xử lý), `PanelChamDiem` | có | không đổi | GIỮ |
| Hàng "Thi" của Kết quả MT, "Thi trong kỳ", ô thi thật GV | panel cũ | không đổi trong PR này | để PR-4 THI-THAT (`kieu: 'thi-that'`) |
| Ô PA / vi phạm / Việc đúng hạn | panel cũ | không đổi | để PR-3 |

## Kiểm kê ô FT (ghi chú mockup mục 2b)

| Tab | Ô | Sau PR |
|---|---|---|
| Test + SOS · FT | Lượt MT · Đạt · SOS 1/2/3 · Thiếu điểm (bảng + thẻ, mọi hàng / hàng con) | P-FT chính lượt |
| Test + SOS · FT | Dưới kỳ vọng · L R W1 W2 S | P-FT lượt mới nhất làm em vào ô, cột kỹ năng nền nhấn |
| Test + SOS · FT | HV - Case (số trước) | P-FT lượt sinh Case (mới nhất) |
| Test + SOS · FT | HV - Case (số sau) · Chưa chốt PA · Đang xử lý | giữ panel Case |
| Báo cáo HV | Đạt MT · Chưa đủ dữ liệu | P-FT (lượt dùng tính % · lượt chưa đủ mới nhất) |
| Báo cáo HV | Kết quả MT: MT0 · MT1 · MT2 · MT3+ | P-FT |
| Báo cáo HV | Tiến bộ theo kỹ năng · Tăng / Giữ / Giảm | P-TG |
| Phân tích GV | Đạt kỳ vọng Test (FT) | P-FT, `knCua` viền nhấn |
| Phân tích GV | Tiến bộ (FT) | P-TG (+ cột Kỹ năng) |
| Phân tích GV | HV cần chú ý | P-FT lượt Mock có điểm gần nhất |
| Tổng quan GV / Lớp tôi dạy | HV tiến bộ · Tiến bộ lớp | P-TG |

Mọi ô trên: `n === rows.length` (phép kiểm `prPtPanel` vòng mọi cột FT × hàng Tổng + 2 hàng + 1 hàng con).

## Turso

Panel chỉ tải khi bấm. Phần thêm = một câu lượt theo id + tên em thiếu band (điểm dùng lại `loadBundle` trong request): đo `bao-cao/o?o=dat-mt` 911 → 915 dòng.
Đo (QL, demo): Test + SOS ô kỹ năng 12 câu / 834 dòng · ô Lượt 11 / 893 · Báo cáo Tiến bộ 28 / 1 596 · Phân tích GV 15 / 687–1 289 · hồ sơ GV Tiến bộ 21 / 912.
Lưu ý: QT `bao-cao/o?o=dat-mt` khoảng 6 tháng mọi chi nhánh 2 219 dòng (> 2 000) — phần lớn là tính Đạt MT có sẵn (`tapDatMt`), không do PR này.

## Tự rà (`web-design-guidelines`, impeccable `audit`)

- Ô điểm bấm được là `button aria-expanded aria-controls`; hộp `role="dialog"`; Esc / bấm ra ngoài / cuộn đóng; Esc không đóng panel.
- 375: vùng bấm ô điểm nới ≥ 44 px bằng `::after` (không đổi bố cục). Màu qua token (`ODiem`, `--accent-soft`, `--line-strong`); ✓ / ✗ kèm ký hiệu, không chỉ màu.
- `KhungPanel` thêm `rong="bang"` = 820 px (mockup "panel bảng điểm rộng 820").
