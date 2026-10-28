# KHAI-BAC-LO — khớp / khác mockup

Nguồn: `thiet-ke/v7/khai-bac-lo.html` (chủ SP duyệt 28/10), khung `#w1440` / `#w375`, `?tt=sua|da-luu&vai=gvcn|ql&theme=…`.
Web: `KhaiBacLoPanel` (mở từ nút "Khai / sửa cấp bậc" ở đầu thẻ Ý thức lớp, `?mo=cap-bac`, Chọn nhiều → Xác nhận cấp bậc, việc Công việc theo lớp —
mọi lối vào `LoYThucPanel viec="cap-bac"` đi qua panel này). Máy chủ `loCapBac` (+ tháng, ghi chú chung, `truoc` / `bac`) và `loHoanTacCapBac`.

Ảnh cặp bố cục (trái mockup `tt=sua` | phải web lúc mở, dữ liệu demo MB FT 101 — 33 em, 27 chọn được với GVCN): `cap-1440-toi.png`, `cap-375.png` (sáng).
Ảnh web CÙNG trạng thái mockup (bấm thật): `web-sua-1440.png` / `web-sua-375.png` (tick 4 em + Áp WL 1 + sửa riêng Report 2: nhãn Khai mới / sửa riêng, ô viền nhấn, chân "5 em đổi bậc") · `web-da-luu-1440.png` / `web-da-luu-375.png` (dải "✓ Đã lưu 5 em · Hoàn tác", dòng "✓ Đã lưu", panel dùng tiếp).
Bấm thử (GVCN): Chọn tất cả → Áp WL 1 cho 27 em → sửa riêng 1 em Report 2 → Lưu 27 em → "✓ Đã lưu 27 em: WL 1 (26 em) · Report 2 (1 em) · Hoàn tác"
→ Hoàn tác → cả 27 em về "Chưa khai".

| # | Khung mockup | Web | Kết quả |
|---|---|---|---|
| K1 | Panel phải rộng, đầu "Khai / sửa cấp bậc vi phạm" + lớp · số HV · "bậc cao nhất em đã bị xử lý trước khi dùng web" | `KhungPanel rong` + `dau` | KHỚP |
| K2 | Thanh công cụ nền `surface-2`: "Chọn tất cả (n)" (gạch khi chọn một phần) · "Áp bậc [ô] Áp cho n em" | thanh công cụ | KHỚP |
| K3 | Hàng 2: Tháng (ô gõ + lịch, mặc định tháng này) · Ghi chú (tuỳ chọn, chung cả lô) | `ONgay kieu="thang"` + ô ghi chú | KHỚP |
| K4 | Bảng: Áp cho · Học viên · Bậc hiện tại · Bậc mới (ô chọn, "— giữ nguyên —") · nhãn | lưới `@container 600` | KHỚP |
| K5 | Dòng tick nền nhấn nhạt; ô bậc đã đổi viền nhấn | `accent-soft`, viền `accent` | KHỚP |
| K6 | Nhãn chữ: Khai mới · Nâng từ … · ↓ Hạ từ … (vàng) · "· sửa riêng" | `nhanDoi` | KHỚP |
| K7 | Dòng khoá: không ô tick, chữ mờ, lý do ("đã có xử lý trên web", "chỉ QL sửa") | `capBac.lyDo` máy chủ | KHỚP |
| K8 | Chân: "n em đổi bậc · n em khoá (chỉ QL sửa)" + Huỷ · Lưu n em (nút chính) | `chan.trai` + `chinh`; nút trái theo khung panel ("Huỷ thay đổi" / "Đóng", luật S3) | KHỚP — nút trái nằm đầu chân theo khung panel chung (một vị trí cho mọi panel); ở 375 chân xếp Huỷ · dòng đếm · Lưu theo khung panel chung (mọi panel 375 như vậy) |
| K9 | Sau lưu: dải xanh "✓ Đã lưu n em: … · Hoàn tác · n em chưa lưu", panel dùng tiếp, dòng đã lưu "✓ Đã lưu" | dải `ok-bg` + Hoàn tác cả lô | KHỚP |
| K10 | Em lỗi riêng dòng: "Chưa lưu: …" (đỏ); GVCN gặp em vừa có xử lý trên web → dòng khoá | `kq` + dữ liệu mới (`reload`) khoá dòng | KHỚP |
| K11 | 375: mỗi em một khối (tick · tên · "Hiện tại: …" · ô bậc rộng · nhãn), công cụ xuống dòng | lưới một cột dưới 600 px | KHỚP |
| K12 | Lưu lại khi lỗi mạng (một nút Lưu) | lỗi chung ở `chan.trai`, nút Lưu gửi lại em còn đổi | KHỚP |
| K13 | "VIỆC" đầu panel | chỉ khi mở từ một việc (có hạn) — mở từ nút đầu thẻ không có | KHỚP |

**Đếm:** 13/13 KHỚP = 100 %.

**Tháng (rà 28/10):** ô tháng mặc định tháng này áp cho em KHAI MỚI; em đã khai giữ tháng cũ trừ khi người dùng chạm ô tháng; bậc 0 không gắn tháng.
**Hoàn tác (bảo mật):** chỉ trả lần lưu của chính người bấm trong hôm nay (người ghi cuối dòng khai + ngày), so bậc trong giao dịch; nhật ký `discipline.declare_level_undo`.

## Thao tác TRƯỚC → SAU

| Trước (OV-13d cap-bac) | Sau |
|---|---|
| Chỉ mở qua Chọn nhiều → Xác nhận cấp bậc / việc Công việc (em chưa khai) | + nút "Khai / sửa cấp bậc" ở đầu thẻ (mọi em của lớp, không cần Chọn nhiều) · `?mo=cap-bac` không kèm `em` = cả lớp |
| Mỗi em một hàng 7 chip, bấm từng em | "Chọn tất cả" + "Áp cho n em" + ô Bậc mới mỗi dòng |
| Không tháng / ghi chú (tự điền "Xác nhận theo lớp …") | Tháng chung (mặc định tháng này) + ghi chú chung tuỳ chọn (trống → như cũ) |
| Không Hoàn tác | Hoàn tác cả lô (đúng các em vừa lưu, chỉ khi bậc chưa bị đổi tiếp) |
| Khai từng em: ghi chú ≥ 3 ký tự | Ghi chú tuỳ chọn (chủ SP 28/10) |
| Em lỗi giữ lại kèm lý do | Giữ |

Không mất thao tác nào.
