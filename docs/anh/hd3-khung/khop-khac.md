# HD3-1 KHUNG — Hướng dẫn V3 · ảnh cặp mockup ⑭ │ web

Nguồn: `docs/superpowers/specs/2026-11-13-overhaul-v6/15-huong-dan-v3.md` (mục 8 thắng mục 4) · mockup `thiet-ke/v21/huong-dan.html` (#1743) · lời 54–56.
Tên tab theo **lời 56**: "Trang này" · "Tôi muốn…" · "Trường hợp" — mockup còn "Ở đây" / "Khi gặp…" → mọi ảnh ghi **KHÁC theo lời 56**.
Chụp: tài khoản demo (GV Trần Ngọc Hà = 7, QL Nguyễn Khánh Vy = 2), ngày demo 14/09/2026, 1440 tối · 375 sáng; `document.fonts.check` Be Vietnam Pro = true mọi ảnh.
Nội dung thẻ: HD3-1 chỉ chuyển nội dung cũ sang kiểu mới ở mức chạy được + **một thẻ mẫu đủ bảy dòng (Nhập điểm) + một tình huống (Em vắng Test)**, chữ đúng mockup K1 / K6b (PTA đã rà nguồn luật). Thẻ khác còn chữ cũ (chỉ dòng "Làm") — HD3-2 … HD3-5 viết.

## Ảnh cặp và độ khớp

| Ảnh | Khung | Khớp | Khác (lý do) |
|---|---|---|---|
| `cap-k1.png` | K1 tầng 1 | ~95 % | tab KHÁC lời 56 · ô "Quy chế" đầu thẻ cả ở 1440 vì panel Nhập điểm có câu chi tiết (ⓘ không còn hộp chữ riêng → chi tiết phải có chỗ đọc; 15 mục 8.1 gộp `chiTiet` vào thẻ ở HD3-2) · "Cũng mở được từ" là lối tắt cũ của dữ liệu |
| `cap-k9.png` | K9 ⓘ quy chế | ~93 % | như K1; chưa tô bước khớp 2 giây ([XM-7] — chi tiết thêm ngoài đề bài, bỏ) |
| `cap-k3.png` | K3 tầng 2 | ~90 % | danh sách là thẻ cũ của tab (chưa có `viecWeb` nên chưa có số "n việc"; HD3-2 khai) · chưa có câu mô tả tab (HD3-2 viết `tabs.ds[k].cau`) |
| `cap-k4.png` | K4 tầng 3 | ~92 % | danh sách việc của màn là dữ liệu cũ (≤ 5 + "+ n việc khác" đúng mockup) |
| `cap-k5a.png` / `cap-k5b.png` | Tôi muốn… + lọc nhịp | ~92 % | tên nhịp là dữ liệu cũ ("Mỗi sáng", "Theo đợt", "Cuối khoá") — HD3-2 đổi theo 4.3 |
| `cap-k6b.png` | Trường hợp · Em vắng Test | ~96 % | chỉ một tình huống (HD3-2 viết đủ 11–12) |
| `cap-k7a.png` | tìm "vang" | ~92 % | ít kết quả hơn (nội dung) |
| `cap-k8d.png` | Có gì mới mở | ~94 % | 5 dòng nói về khung V3 (dòng của mockup là việc GD-19… chưa chắc đã lên web) |
| `cap-k2d.png` | QL làm thay | ~94 % | dải ghi "Việc của **Giáo viên**." (tên vai một nguồn `TEN_VAI_HD`, cùng chip đầu panel) thay "GV" |
| `cap-k10b.png` | trang /huong-dan | ~90 % | thẻ mở sẵn, lưới hai cột, Thẻ việc · Trường hợp · Luật và hạn · Thuật ngữ, In; ô tìm giữ chữ gợi ý cũ |
| `cap-k12a.png` / `cap-k12c.png` | 375 sáng | ~95 % | tab KHÁC lời 56 |
| `noi-tren-nen-mo-1440-toi.png` | "?" nổi trên nền mờ (15 mục 8.3) | — | mockup không vẽ: nút "?" cùng dáng thanh trên, sát mép trái panel nổi, bấm mở Hướng dẫn chồng lên |

Đo ✕ / chữ cắt: ✕ đóng Hướng dẫn và ✕ xoá chữ tìm giữ nguyên thành phần V2 (không đổi); không có chữ bị cắt "…" trong thẻ (chữ xuống dòng).

## Bảng truy vết khung → thành phần

| Khung | Thành phần | Mã | GIỮ / ĐỔI / BỎ |
|---|---|---|---|
| mọi | Nút "?" thanh trên, KhungPanel chồng `longTrong`, ✕ / Esc chỉ đóng Hướng dẫn | `Header.tsx`, `NutHuongDan.tsx` | GIỮ |
| mọi | Ba tab **Trang này · Tôi muốn… · Trường hợp** | `TEN_TAB` | ĐỔI (lời 56) |
| K1, K2 | Thẻ việc bảy dòng, dòng trống không hiện, dải vai | `TheViec`, `ViecHd.khiCo/xong/han/sai/khongDuoc/sau` | MỚI |
| K1 | "‹ Việc khác ở tab này / màn này" | `NUT_LEN`, `tang` | MỚI |
| K3 | Tầng 2 Công việc `?nhom=` (thiếu → suy từ `?loai=`), ≤ 5 + "+ n việc khác", số việc từ `/my-work` đã nạp | `tabDangDung`, `Tang2`, `DsGioiHan` | MỚI |
| K4 | Tầng 3 V2 (Bạn đang ở · Việc làm ở đây · Không làm ở đây), dòng mở ra thẻ | `TrangNay` | GIỮ dáng · ĐỔI dòng |
| K5 | Nhóm theo tên tab Công việc + Học viên & lớp + Khác; bộ lọc nhịp dính đầu (thay tab Tuần của tôi) | `DsNhom`, `THU_TAB_HD`, `tabCuaThe` | ĐỔI (lời 55) |
| K6 | Thẻ trường hợp ba dòng + "Thẻ việc: …" | `TheTinhHuong`, `HuongDan.tinhHuong` | MỚI |
| K7 | Tìm gộp thêm Trường hợp | `timHd` | GIỮ + mở rộng |
| K8 | Có gì mới: chấm "?" theo phiên bản, dải gập chỉ cho người đã xem bản cũ | `PHIEN_BAN_HD`, `CO_GI_MOI`, `useDaXemHd`, `users.da_xem_huong_dan` = số phiên bản | ĐỔI [XM-6] |
| K9 | ⓘ dòng quy chế mở panel "?" đúng thẻ (chồng, tầng 1) | `NutHdQuyChe`, `moHuongDan`, `ghiQuyCheMo` | ĐỔI |
| K10b | Trang: Thẻ việc (lưới thẻ mở sẵn) · Trường hợp · Luật và hạn · Thuật ngữ | `LuoiThe`, `HuongDanPage` | ĐỔI · BỎ "Theo màn", "Tuần của tôi" (mockup) |
| K11c | Việc chưa có thẻ → một câu + tầng 2 / 3 | nhánh `tang1.the` rỗng | MỚI |
| 8.3 | "?" nổi trên nền mờ panel nổi (≥ 640) | `KhungPanel nutHd` | MỚI |
| 8.2 | Mã chèn hạn `{han:ma}` / `{han:ma.truong}` từ Hạn mặc định; câu gợi ý nhóm việc máy chủ dùng chung | `chenHan` (`hanMacDinh.ts`), `GROUP_META` | MỚI |

## Bảng thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC (V2) | SAU (V3) | Mất? |
|---|---|---|---|
| Mở hướng dẫn đúng việc đang làm | "?" → mục panel + ~18 dòng | "?" → một thẻ đúng loại việc của dòng đang mở | không |
| Việc khác cùng chỗ | cuộn | "‹ Việc khác ở tab này / màn này" | không |
| Tìm | ô tìm | ô tìm (+ Trường hợp) | không |
| Xem theo nhịp | tab Tuần của tôi | bộ lọc nhịp ở Tôi muốn… | không (đổi chỗ) |
| Đi tới chỗ làm | "Đi tới ›" trong ô Lối chính | "Đi tới ›" chân thẻ (khi đang ở chỗ khác) | không |
| Chỉ cho tôi | nút trong dòng | nút chân thẻ | không |
| Lối tắt | "Lối tắt: …" | "Cũng mở được từ: …" | không |
| Xem vai khác (QL / QT) | ô Vai ▾ | ô Vai ▾ | không |
| Trang /huong-dan, In | chân panel | chân panel; trang có lưới thẻ | không |
| Chi tiết quy chế | ⓘ → hộp chữ | ⓘ → panel "?" đúng thẻ, chi tiết ở đầu thẻ | không |
| Mở "?" khi panel nổi đang mở | bị nền mờ che | "?" nổi trên nền mờ | thêm |
| Trang "Theo màn" | mục lục theo màn | tầng 3 của panel | bỏ mục trang (nội dung còn ở panel) |

## [XM] cần PTA Plan quyết

1. **[XM] "?" nổi trên nền mờ ở 375:** panel nổi ở 375 phủ toàn màn, không còn nền mờ → chưa có nút; mở Hướng dẫn từ panel ở 375 qua ⓘ quy chế. Thêm "?" trong đầu panel ở 375 thì phải sửa mọi kiểu đầu KhungPanel — để PR riêng nếu cần.
2. **[XM] ⓘ quy chế:** GD-20c (#1738) chốt "ⓘ chỉ khi có chi tiết"; HD3-1 giữ luật đó, chỉ đổi ⓘ thành mở thẻ. Panel không có chi tiết thì vào thẻ qua "?".
3. **[XM] Hạn ngoài cấu hình** (Tình hình học tập 3 ngày, Khai bậc 14 ngày, Báo cáo PH 7 ngày) chưa có mã chèn — câu gợi ý nhóm việc giữ số cũ; HD3-2/3 thêm hằng export khi viết thẻ đó.
4. **[XM] Head tutor / CX / Admin:** khung dùng chung, chưa có thẻ `viecWeb` → "?" ở dòng việc rơi về K11c (một câu + tầng 2/3). Nội dung HD3-2 … HD3-5.

## Turso

0 câu đọc thêm: nội dung tĩnh; "Bạn đang mở" lấy chữ từ dòng việc đã nạp; số việc tầng 2 từ `/my-work` thanh trên đã nạp; hạn từ phiên (`hanMacDinh`). Ghi "đã xem phiên bản" = một PATCH khi mở lần đầu mỗi phiên bản (như V2).

## Skill

`/ponytail lite` · `karpathy-guidelines` · impeccable `layout` + `polish` + `harden` + `adapt` (375) + **`audit`** (detector: 0 lỗi; 17 px là cỡ tiêu đề panel đã duyệt) · **`web-design-guidelines`** (sửa: dòng gập `scroll-mt` để bộ lọc dính không che dòng đang focus; còn lại đạt) · `/ponytail-review`.
