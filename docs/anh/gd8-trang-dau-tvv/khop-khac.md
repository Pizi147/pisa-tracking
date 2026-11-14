# GD-8 — Trang đầu TVV theo mockup ④ (`thiet-ke/v21/trang-dau-tvv.html`, chủ SP duyệt 15/11 lời 29)

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/09-plan-giao-dien-dot-2.md` dòng GD-8. Máy chủ đã có từ GD-8a (#1651): `GET /tong-quan/tvv/em` (`hvCuaToi.ts` `emCuaTvv` — em + chỉ số).
Luật áp: V22 (hạn chỉ màu), lời 24 (dòng việc "Lớp · tên việc"), 35 / 36 (tên bậc), 40 (hiện theo trạng thái). Cơ chế trang đầu theo vai như GD-1 (#1566).
Ảnh cặp (trái mockup · phải web, seed demo 14/09, TVV Phan Mai — vai 27, Monbay; phông Be Vietnam Pro + Inter đã nạp):
- `cap-1440-toi.png` — K1 ↔ `/cong-viec` (TVV mở `/` tự chuyển tới đây)
- `cap-375-viec-sang.png` — K7a ↔ 375 sáng, đoạn "Việc" · `cap-375-hv-sang.png` — K7b ↔ 375 sáng, đoạn "HV của tôi"
- `zoom-nut-x.png` — hàng nút đầu trang (Mọi hạn · Lọc thêm · + Task) + ✕ panel việc (zoom)
- `truoc-tong-quan-1440.png`, `truoc-cong-viec-1440.png` — TRƯỚC PR (mockup │ Tổng quan TVV cũ / Công việc TVV cũ)

Dữ liệu demo của TVV Phan Mai ít việc hơn mockup (1 Báo PH · 1 Bổ sung hồ sơ; không em thi trong tháng) — không tính lệch.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | K1 menu TVV: **Công việc** (đầu, badge) · Học viên & Lớp · Phân tích; bỏ Tổng quan | `nav.ts` `overview` false khi `hvCuaToi` → `khuVucHienThi` đưa Công việc lên đầu | cap-1440-toi | KHỚP |
| 2 | R4.1 trang đầu = Công việc; link cũ `/` chạy | `OverviewPage` vai `tvv` → `<Navigate /cong-viec>` (giữ tham số) | bấm thử | KHỚP |
| 3 | K1 đầu trang "Công việc · Monbay" + Mọi hạn + **+ Task**; số việc sang ô "Việc" ([XM-1]) | `HoTroHocVienTab` (TVV: chỉ tên chi nhánh) | cap-1440-toi | KHỚP (Lọc thêm GIỮ — [XM-11]) |
| 4 | K1 **dải mỏng 5 chỉ số**: Việc · Báo PH đúng hạn ⓘ · Thi tháng này ⓘ › · Chờ KQ › · Chưa chốt lộ trình tiếp › | `DaiChiSoTvv` (`DaiChiSo` chung) — một nguồn `/tong-quan/tvv/em` | cap-1440-toi | KHỚP (KHÁC theo V22: không ⚠) |
| 5 | Ô Việc không bấm (đang ở Công việc) | `OViecCuaToi dai khongBam` | cap-1440-toi | KHỚP |
| 6 | Ô Báo PH đúng hạn → panel số tại chỗ (K5) | `PhanTram nguon="/tong-quan/tvv/o?o=bao-ph"` (giữ) | — (TVV demo chưa có Báo PH trong kỳ: "—") | KHỚP (mã) |
| 7 | Ba ô "›" đổi trang Học viên & Lớp đúng nhóm em ([XM-2]); 0 không bấm | `SoDen` (giữ đích cũ) | cap-1440-toi | KHỚP |
| 8 | K1 tab Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ; tab rỗng ẩn; badge đỏ = quá hạn | `NHOM_CV_TVV` + `HangTab` (giữ) | cap-1440-toi | KHỚP |
| 9 | K1 danh sách trái: dòng việc "Lớp · tên việc" + thẻ phụ tên em (lời 24) | `DanhSachViec` (giữ, GD-1b) | cap-1440-toi | KHỚP |
| 10 | K1 **HV của tôi** (khung phải khi chưa chọn việc): Học viên · Lớp · Tình trạng (web: "Trạng thái" — KHÁC) · Việc cần làm | `HvCuaToi` (mới, cùng dáng "Lớp của tôi" GD-1) | cap-1440-toi | KHỚP |
| 11 | Tình trạng: Thi dd/mm (ngày chốt trong tháng) · Đã thi · chờ KQ · SOS n ([XM-9], lời 40) | `tinhTrangCua` (`NhanLich`, `ChipSos`) | cap-1440-toi | KHỚP |
| 12 | Việc cần làm = nút-chip không biểu tượng "{nhóm} · {số}", quá hạn đỏ; thứ tự tab ([XM-5]); "Bổ sung hồ sơ ›" không số, đổi trang ([XM-4]) | `dungHvCuaToi` (việc từ `/my-work` đã nạp) | cap-1440-toi | KHỚP (KHÁC theo V22: không ⚠) |
| 13 | Em có việc trên → em chỉ có tình trạng (vạch) → "n em khác" gập ([XM-3]) | `HvCuaToi` | cap-1440-toi | KHỚP |
| 14 | Ô "Tìm em" (lọc cả nhóm gập; không thấy → câu rỗng — K6b / K6c) | `HvCuaToi` lọc tại máy | bấm thử | KHỚP |
| 15 | Bấm chip → panel việc ở khung phải; ✕ trả lại HV của tôi | `onMo` = `mo()` sẵn có | bấm thử (Báo PH · 1 → panel Báo PH) | KHỚP |
| 16 | K2 / K3 panel Báo PH · Sau thi · Chốt ngày thi + **dòng quy chế** | `PanelBaoPhTvv` · `PanelSauThi` · `PanelChotNgayThi` · `PanelLoTrinhMoi` — đã có `quyChe` (GD-4b) | — | KHỚP (GIỮ) |
| 17 | K4 **+ Task** một mục "Hỏi tình hình học tập" → chọn em (HV của tôi) → hộp Hỏi tình hình (GVCN) | `NutTask muc=['tinh-hinh'] hoi dsHoi` → `HopTinhHinh` chế độ `hoi` (ô chọn có tìm trên danh sách em đã nạp, không `lop=toi`) | bấm thử | KHỚP ([XM-7]: chỉ em của tôi) |
| 18 | K6d TVV mới chưa có em: HV của tôi rỗng đúng chữ; "+ Task" vẫn có | `HvCuaToi` "Chưa có học viên nào do bạn phụ trách." | — | KHỚP (mã) |
| 19 | K6e / K6f đang tải · lỗi riêng từng phần | `Skeleton` / `ErrorState onRetry` của `/tong-quan/tvv/em` riêng khung phải; dải số "…" | — | KHỚP (mã) |
| 20 | K7 375: dải số 2 cột · công tắc "Việc · HV của tôi" · nút tròn "+ Task" · thanh dưới 3 mục · thẻ em chip cao 44 | công tắc chung GD-1 (nhãn TVV) · `NutTask noi="noi"` · `HvCuaToi` `max-sm:` | cap-375-viec-sang, cap-375-hv-sang | KHỚP |
| 21 | Link "HV của tôi ›" đầu Tổng quan TVV / ô rỗng Công việc | BỎ (khung HV của tôi đã ở trang đầu; menu Học viên & Lớp vẫn mặc định HV của tôi) | — | KHỚP |
| 22 | Hướng dẫn "?" (TVV) | `shared/huongDan/tvv.ts`: bỏ màn Tổng quan; Công việc có dải số, HV của tôi, + Task; bản Anh `en/gd8.ts` | — | KHỚP |

**KHỚP 22 / 22 = 100 %** thành phần.

## 2. KHÁC (có lý do)
- **KHÁC theo V22** (lời 43, 44): mockup còn "⚠ 2 quá hạn", "⚠ Báo PH · 1", "⚠ quá hạn 2 ngày" → web chỉ màu đỏ.
- **Cột "Trạng thái"** (mockup ghi "Tình trạng"): phép kiểm S3 "một khái niệm một tên" (THUAT_NGU) cấm "Tình trạng" — dùng tên chuẩn "Trạng thái".
- **[XM-11] "Lọc thêm"** (mockup không vẽ) GIỮ ở 1440 và 375 — thao tác cũ.
- **375 hàng lọc** "Mọi hạn · Lọc thêm" vẫn hiện như Công việc GV (mockup K7a không vẽ) — thao tác cũ GIỮ.
- **Dải nhóm "Báo PH"** ở danh sách trái không có biểu tượng như mockup — `DanhSachViec` dùng chung (GD-4), ngoài phạm vi.
- **Ô "Chưa chốt"** ở 375 (mockup "Chưa chốt LT tiếp") — chữ ngắn có sẵn của dải; `title` đủ.

## 3. Thao tác TRƯỚC → SAU (Tổng quan TVV + Công việc TVV)

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Mở trang đầu | Tổng quan TVV | Công việc (link `/` chuyển) | ĐỔI (R4.1) |
| Menu | Tổng quan · Học viên & Lớp · Công việc · Phân tích | Công việc · Học viên & Lớp · Phân tích | ĐỔI |
| Ô "Việc ›" | Tổng quan (đổi trang Công việc) | ô "Việc" của dải — đang ở Công việc nên không bấm | ĐỔI ([XM-1]) |
| Ô Báo PH đúng hạn → panel số | Tổng quan | cùng panel, mở tại Công việc | GIỮ đích |
| Thi tháng này / Chờ KQ / Chưa chốt lộ trình tiếp → Học viên & Lớp | Tổng quan | giữ đích, "›" | GIỮ |
| ⓘ Báo PH đúng hạn, Thi tháng này | Tổng quan | trong dải | GIỮ |
| Link "HV của tôi ›" | Tổng quan / ô rỗng Công việc | khung HV của tôi ở trang đầu + menu Học viên & Lớp | BỎ / CHUYỂN |
| Tab, badge, Mọi hạn, Lọc thêm, bấm dòng → panel, Việc tiếp ›, Gia hạn, Bổ sung hồ sơ | Công việc | giữ | GIỮ |
| Mọi thao tác trong panel Báo PH · Sau thi · Chốt ngày thi | panel | giữ | GIỮ |
| Hỏi tình hình học tập | hồ sơ HV (tab Ý thức, "+ Task") | + "+ Task" ở trang đầu (chọn em của tôi) | THÊM |
| Xem em của mình: lớp, SOS, lịch thi, việc | Học viên & Lớp | + khung HV của tôi ở trang đầu (trang HV & Lớp giữ) | THÊM |

Không thao tác nào bị mất.

## 4. Đo
- **Turso** (mở trang đầu, TVV): TRƯỚC Tổng quan TVV = `/my-work` + `/tong-quan/tvv` + `/tong-quan/hoc-vien` (3 GET; phép đo `TVV trang Tổng quan` 33 câu) · SAU Công việc = `/my-work` + `/tong-quan/tvv/em` + `/ref/branches` (tên chi nhánh — có sẵn ở Công việc TVV) — phép đo `TVV trang đầu Công việc` 26 câu / trần 36 (GD-8a). `/my-work` gọi hai lần là chuyện có từ trước ở Công việc (badge App + danh sách), không do PR này. Việc từng em lấy từ `/my-work` đã nạp — 0 request thêm.
- **Gỡ `/tong-quan/tvv`** (không còn ai gọi): route, dòng đo `tocDoDuong.ts`, phép quét JSON (`prS5JsonEach` → `/tong-quan/tvv/em`), `scripts/do-ban-chep-ds.py`. Hàm `tongQuanTvv` giữ (= `chiSo` của `/tong-quan/tvv/em`); `/tong-quan/hoc-vien` giữ (CX dùng); `/tong-quan/tvv/o` giữ (panel Báo PH đúng hạn).
- **Nút / ✕** (`getBoundingClientRect`, 1440): Mọi hạn · Lọc thêm · + Task cùng top 117.7, cùng cao 32 (trước: + Task cao 34 — đã chỉnh mặt nút, áp cả trang đầu GV, lệch 0 px). ✕ panel việc: cao 36, mép phải cách mép panel 21 px — `KhungPanel` chung (không đổi).
- `npm run check` đầy đủ: xem mô tả PR.

## 5. Thành phần chung đã sửa (bắt buộc)
- `congViec/NutTask.tsx`: prop `dsHoi` (TVV chọn em từ danh sách đã nạp cho Hỏi tình hình); mặt nút đầu trang cao 30 + viền = 32 (bằng nút lọc cạnh) — áp cả trang đầu GV.
- `worklist/TongQuanV5.tsx`: `TongQuanTvvV5` → `DaiChiSoTvv` (một nguồn); `OViecCuaToi` thêm `khongBam`; bỏ `lienKetTq('tvv')`.
- `server/src/platform/nav.ts`: `overview` false cho TVV.
