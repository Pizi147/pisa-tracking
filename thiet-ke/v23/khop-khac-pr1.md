# NHẸ HƠN · PR-1 KHUNG-CHUNG — khớp / khác mockup v23

Mockup: `khung-panel.html` P1 / P3 (+ khung chung `v23.css`), `cong-viec-gv.html` G1 / G3, `lich-test.html` L1 / L2. Kế hoạch: `docs/superpowers/plans/2026-11-22-nhe-hon.md` mục PR-1.
Ảnh cặp mockup | web (seed, ngày demo 14/09/2026, Playwright Edge, phông Be Vietnam Pro đã nạp): `docs/anh/nh-pr1/`.
PR này chỉ đổi KHUNG DÙNG CHUNG — thân từng màn (khối Phụ trách, dòng việc, bảng lớp…) là việc của PR-2a … PR-6, nên cổng "≥ 90 % KHỚP" chấm trên phần khung.

## Bảng truy vết khung → thành phần → ảnh
| Khung mockup (v23) | Thành phần web | Ảnh | |
|---|---|---|---|
| Thang chữ 12 · 13 · 14 · 16 · 20 · 26, chữ thường 14 | `index.css` (body 14, mọi `font-size` 15/17/22/28 → 14/16/20/26) · `tailwind.config.js` (`base` 14 · `lg` 16 · `xl` 20 · `2xl` 26) · mọi `text-[15/17/22/28px]` trong `web/src` (287 chỗ, 102 tệp) | mọi ảnh | KHỚP |
| Luật hạn: ngày LUÔN dd/mm/yyyy | `shortDate` (gốc mọi chữ ngày / hạn) + `ngay()` · các chỗ ghép "dd/mm" tự viết ở web / shared → `ngay()` | p1, cong-viec-gv, lich-test | KHỚP |
| Luật hạn: chữ thường (xa) · vàng (hôm nay → ≤ 2 ngày) · đỏ (quá hạn) + dấu khác màu | `mucHan()` (`hienThiNgay.ts`) · `HAN_GAN_NGAY` 3 → 2 (cùng ngưỡng `deadlineView`, máy chủ) · `<Han>` tô theo `mucHan`, quá hạn có ⚠ (`DauQuaHan`) · `ChipHan`: sắp hạn = CHỮ vàng (không còn viên), quá hạn = chip có nền "quá hạn n ngày" | cong-viec-gv (cột hạn) | KHỚP — dấu chọn: ⚠ trước ngày (chữ thường / vàng không có) |
| `.chip` một dáng: cao 22 · 12 / 600 · bo 4 · viền mảnh, không nền | `CHIP_VUONG` (px 7, `.chip-vuong`: viền `--line-strong`, không nền, chữ phụ — lớp màu chỗ gọi đè được) | — | KHỚP dáng; 8 chỗ gọi còn tự thêm nền (soon / ok / muted) → PR màn bỏ khi làm màn đó |
| `.chip.qua` / SOS 2–3 có nền | `CHIP_NHAN` (mới) · `BadgeHan muc="qua"` dùng `CHIP_NHAN` (bo 4, viền đỏ nhạt) | cong-viec-gv | KHỚP |
| `.pn` cao từ dưới thanh menu tới đáy, không hở | `KhungPanel`: khung nổi `top` = đáy `header.thanh-xanh` (đo, `useDayThanhTren`) · panel tại chỗ Công việc ≥ 1024 `fixed` cùng `top`, bám mép phải | p1 · hvp | KHỚP |
| Rộng 58 % (việc) / 75 % (bảng) / 375 toàn màn | `rong` 'viec' (mặc định; 'hep' 'rong' 'nguoi-day' cùng nghĩa) = max(480 px, 58 %) · 'bang' ('vua' 'so') = max(720 px, 75 %) · 'toan' giữ | p1 (835 px ở 1440) | KHỚP |
| Cột trái = min(556 px, 42 % − 48 px) | `HoTroHocVienTab` lưới Công việc + đầu trang / lọc / tab trong cột trái (panel không che nút lọc, + Task) | p1, cong-viec-gv | KHỚP (1280: 489 px, panel từ 538 px — không đè) |
| `.pn-dau` một dòng 52: tên 16 / 700 · em · lớp · hạn · ⓘ · ⋯ · ✕ | `KhungPanel` đầu mới (`phu` mới; `dau.dong2` / `dau.han` / `dau.su` / ‹ Quay lại cùng dòng) · bỏ dòng loại "Việc · …" | p1 · p3 | KHỚP — đo 1280: đầu 52 px, tâm ⓘ / ⋯ / ✕ / tên = 122,5 px (lệch 0) |
| ⋯ · ✕ cùng ô 36 × 36 | `NUT_DONG` cho ✕ · ⓘ quy chế · ⋯ của panel Báo PH (`lopNut={NUT_DONG}`) | p1 | KHỚP |
| Bỏ hàng "Quy chế …", luật vào ⓘ | prop `quyChe` → ⓘ ở góc đầu panel (rê thấy câu, bấm mở Hướng dẫn đúng thẻ việc — cùng đường ⓘ cũ) | p1 · hvp | KHỚP |
| `.pn-chan` một hàng mỏng 52 | chân `min-h 52`, đệm 8 / 20 | p1 · hvp (chân 57 = nút 40 + đệm) | KHỚP |
| Khối phụ (Lịch sử) gập sẵn | `LichSuGap` đã gập sẵn — không đổi | p3 | GIỮ |
| Khối Phụ trách · Hạn · Theo dõi lên trên, thoáng, "+n người" | `KhoiGiaoViec.tsx` | — | **BỎ ở PR này → PR-2b** (tệp của PR-2b; khung không buộc đổi) |
| Luật bảng: tên không cắt, số hẹp đều, kết quả có trần | `.bang td[data-kieu="ten"]` xuống dòng, không "…" (N55) · số / điểm `tabular-nums` giữa cột (đã có) · `chip` 140 (đã có) · cột ngày dd/mm/yyyy nới 104 px (`BangLuotPanel`, `PanelTutor`) | lich-test | KHỚP |
| Ngày có năm không bị cắt | cột ngày vi phạm 48 → 84 px (`TraLai.tsx` `DsViPhamBaoPh`, `DongViPham`), Lịch sử 92 → 120 px, ô tuần Báo cáo đơn vị rộng hơn | p1 · p3 | KHỚP |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| ✕ đóng · Esc · bấm nền · ‹ Quay lại · hỏi "Bỏ chữ đang gõ?" | có | như cũ (‹ cùng dòng đầu) | GIỮ |
| ⋯ thao tác phụ (panel Báo PH) | nút 28 viền | ô 36 không viền cạnh ✕ | GIỮ |
| Dòng "Quy chế … ⓘ" (mở Hướng dẫn đúng thẻ) | hàng trên chân | ⓘ ở góc đầu panel, cùng đường mở | GIỮ (đổi chỗ) |
| Lưu · Lưu · việc tiếp › · Hoàn tác · Đóng · Huỷ · Xoá | chân | chân (mỏng hơn) | GIỮ |
| Bấm dòng khác trong danh sách khi panel mở (đổi việc) | có | có — danh sách vẫn thấy bên trái | GIỮ |
| Lọc / Mọi hạn / Lọc thêm / + Task / + Giao việc khi panel mở | thấy | thấy (đầu trang trong cột trái) | GIỮ |
| "?" Hướng dẫn nổi cạnh panel | có | có | GIỮ |
| Dòng loại "Việc · …" trên tên panel | có | bỏ (đặc tả mục 2) | BỎ — không phải thao tác |

## [XM] / để sau (đã chép vào báo cáo cho PTA)
- Prop `quyChe` GIỮ (vẽ thành ⓘ) thay vì xoá như kế hoạch ghi — xoá phải sửa 37 chỗ gọi trong 26 tệp của các PR sau; ý của kế hoạch (bỏ hàng, luật vào ⓘ) đã đạt.
- `DongQuyChe` vẽ thẳng trong thân form (CapNhatTuan, CasePanel, ThaoTacCase, CuoiKhoaLop, XacNhanPaLo, CaseSosControls ×2, LoYThucPanel, TinhHinh) — chưa đổi; PR màn của tệp đó bỏ / đổi sang ⓘ.
- Chuỗi ngày "dd/mm" do MÁY CHỦ ghép (tiêu đề việc / tin: `cases.ts`, `yeuCau.ts`, `xetLai.ts`, `phanTich/*`, `attempts.ts`, `luatLoTrinh.ts`, `week.ts`) — chưa đổi (PR khung không đụng máy chủ); đề xuất một PR nhỏ riêng.
- `ChipHan vien` không còn khác (hạn không còn là viên) — prop giữ cho 20 chỗ gọi, PR màn bỏ dần.
- Nhóm badge khác (`Nhan` viên tròn chấm, `NhanLich`, `ChipCham`, `NhanKetPa`, `NhanVienCase`) chưa gom về một dáng — kế hoạch PR-1 chỉ ghi `CHIP_VUONG` + `CHIP_NHAN`.
