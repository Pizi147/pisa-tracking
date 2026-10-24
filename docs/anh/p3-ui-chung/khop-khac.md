# P3 UI-CHUNG — khớp / khác, thao tác trước → sau

Nguồn: `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` R6.2, R6.3a, R6.4a, R6.4b · plan `docs/superpowers/plans/2026-10-24-p3-ui-chung.md`.
Không đổi bố cục trang, luật, quyền.

## Thao tác TRƯỚC → SAU

| Nơi | Trước | Sau | Lý do |
|---|---|---|---|
| Hồ sơ lớp › Học viên › Cách xem | Tổng hợp · **Góp ý hàng tuần** · Cần hỗ trợ · … | Tổng hợp · Cần hỗ trợ · … | chủ SP bỏ Góp ý 24/10 (R6.2) |
| Ghi / sửa góp ý tuần | ô chữ trong cách xem Góp ý | **mất** | như trên; bảng `gop_y_tuan` + route GET/PUT giữ |
| Lịch sử góp ý của lớp | nút Lịch sử trong cách xem Góp ý | **⋯ › Lịch sử góp ý tuần** (ngay dưới Lịch sử, nhóm Công cụ), **chỉ khi lớp có góp ý** (cờ máy chủ `coGopY`), panel cũ chỉ đọc | GIỮ đường xem dữ liệu cũ — PTA Plan duyệt 25/10 |
| Link cũ `?che-do=gop-y` | mở Góp ý | mở Tổng hợp (không lỗi) | |
| Menu ⋯ (hồ sơ lớp, hồ sơ HV, mọi `Menu` / `MenuDong`) | nhãn nhóm 11–12 px mờ, mục sát | nhãn 12 / 600 + vạch trên mỗi nhóm, mục ≥ 36 px (≥ 44 px ở 375), vạch đỏ trước việc nguy hiểm, sáng: nền trắng | R6.3a; thứ tự mục giữ nguyên |
| Dải Tổng quan | "Mới dùng PISA?" | "Mới dùng PISA TRACKING?" (EN "New to PISA TRACKING?") | R6.4b |
| Hướng dẫn GV | việc "Ghi vi phạm + Góp ý hàng tuần", mục Góp ý ở Hồ sơ lớp + Luật | việc "Ghi vi phạm" (2 bước, vẫn 5 việc); bỏ mục Góp ý | R6.2 |

## Đầu cột dính (R6.4a) — đo 1440 / 1280, seed demo, vai QL

| Bảng | Cao (px) | Cuộn ngang 1280 / 1440 | Trước | Sau |
|---|---|---|---|---|
| Hồ sơ lớp FT › Học viên (`BangHoSoLop`) | 2006 | không (1238 / 1398 = khung) | — | `dinh` |
| Phân tích › Kết quả Test · Mock (`KetQuaThi`, minWidth 1180) | 447 (seed; Toàn bộ chi nhánh dài hơn) | không | — | `bang-dinh` |
| Phân tích › Kết quả Test · Thi thật (minWidth 1100) | — | không | — | `bang-dinh` |
| Phân tích › Ý thức · HV cần chú ý (minWidth 860) | 386 (seed) | không | — | `bang-dinh` |
| Hồ sơ lớp thường (`BangDiemLopThuong`), Tổng hợp Test + SOS, Lịch Test | — | — | đã có | giữ |
| Kế hoạch Test (`LuoiKeHoach`) | 40 / dải | lưới rộng, cuộn ngang | — | không gắn (luật `index.css`: bảng cuộn ngang không dính) |
| Phân tích GV | 519 | không | — | không gắn (có phân trang) |
| Hồ sơ GV (2 bảng) | 127 / 171 | 836 > 808 cuộn ngang | — | không gắn |
| Lưu trữ | trống ở seed | — | — | không gắn |

Kiểm dính (1440 × 400 và 1280 × 400, cuộn qua đầu bảng 150 px): đầu cột nằm đúng mép trên `<main>` (top 0), không đè thanh điều hướng.

## Ảnh

- Menu ⋯: `truoc-` / `sau-menu-lop-ql-{1440-toi,1440-sang,375-sang}.png`, `…-menu-hv-ql-…`, `…-menu-hv-gvcn-1440-toi.png`
- Góp ý: `truoc-gop-y-1440-toi.png` → `sau-link-cu-gop-y-1440-toi.png`, `sau-lich-su-gop-y-1440-toi.png`
- Đầu cột dính: `sau-dinh-ho-so-lop-1440-{toi,sang}.png`
