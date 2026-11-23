# PR khuôn A — danh sách việc bên trái trang Công việc (mockup v24 `cong-viec-gon`)

Nguồn: `thiet-ke/v24/cong-viec-gon.html` + `cong-viec-gon-ghi-chu.md` (khung A1–A5, V1–V4). Phạm vi: MỌI tab trừ "Chờ bạn duyệt" — Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành / Việc quản lý · Đang theo dõi, mọi vai (GV, GVCN, TVV, Head / QL, Quản trị). Chỉ đổi HÌNH ẢNH; tính năng / luật / quyền giữ.

Ảnh cặp (trái mockup · phải web, toàn trang, dữ liệu demo): `gv-1440-*.png` (4 tab; Đang theo dõi chỉ web — mockup không vẽ) · `gv-1440-panel.png` · `gv-1280-chua-mo.png` · `gv-1280-panel.png` · `gv-375-sang.png` · `tvv-1440.png` · `head-1440-viec-quan-ly.png` · `admin-1440.png`.
Tên nhóm / dữ liệu khác mockup vì web dùng dữ liệu demo thật; so cấu trúc, cột, cỡ chữ, màu.

## 1. Bảng truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần | Web (`index.css` `.cvA*`, `DanhSachViec.tsx`) | Ảnh | |
|---|---|---|---|---|
| A1 | Bốn ô lớp · ai · chi tiết · hạn, không cột nút | `DongA`, `DongCon` | gv-1440-* | KHỚP |
| A1 | Cột 4fr · 5fr · 4fr · max-content, khoảng 20, subgrid xuyên nhóm | `.cvA` / `.cvA-sub` | gv-1440-* | KHỚP |
| A1 | Lớp đậm 700 · tên em 500 · chi tiết mờ · hạn 13 / 500 | `.cvA-lop/.cvA-ai/.cvA-ct/.cvA-hn` | gv-1440-* | KHỚP |
| A1 | Dòng cao 48 px, kẻ trên 1 px, rê = nền nhấn nhạt, đang chọn = nền + vạch trái 3 px | `.cvA-v` | gv-1440-panel | KHỚP |
| A1 | Hạn = ngày dd/mm/yyyy, tô màu chữ đỏ / vàng / thường; không "quá n ngày", không nền | `HanA` (`mucHan`) | mọi ảnh | KHỚP |
| A1 | "n em" + mũi tên → mở ra từng em thẳng cột "ai"; không mũi tên → mở panel | `DongA` (`con`) | gv-1440-case-hoc-thuat | KHỚP |
| A1 | Chip duy nhất = SOS / mức, sau tên em | `chipMucA` | gv-1440-case-hoc-thuat | KHỚP |
| A1 | "›" đổi trang nằm trong lề phải, không đẩy hạn | `MuiDi` | head-1440 · gv-1440-van-hanh | KHỚP |
| A1 | Dải tên nhóm + "n việc · m quá hạn" | `DaiNhom` (giữ) | mọi ảnh | KHỚP |
| A1 | Bỏ dòng chia "Quá hạn / Hạn đến… / Hạn sau…" | bỏ vạch trong `DanhSachViec` / `TabTheoDoi` | mọi ảnh | **BỎ** |
| A1 | Việc không lớp: tên việc chiếm ô lớp + ô em | `.cvA-kl` | head-1440 | KHỚP |
| A1 | Khối "Lớp của tôi" 420 px bên phải, chưa mở panel danh sách rộng hết phần còn lại | `HoTroHocVienTab` (`lg:grid-cols-[1fr_420px]`) | gv-1440-* | KHỚP |
| A2 / A3 | Mở panel: danh sách không đổi bề rộng, min(680, 100vw − 784) | `HoTroHocVienTab` (bỏ luật cũ "thu về 330 px" khi panel lưới) | gv-1440-panel · gv-1280-panel | KHỚP (xem [XM3]) |
| A3 / A4 / A5 | < 600 px: dòng hai tầng (lớp + hạn · tên + chi tiết), 375 vùng bấm ≥ 44 px | `@container (max-width:599px)` | gv-1280-* · gv-375-sang | KHỚP |
| V1 | TVV: lớp · em · Báo PH REPORT n · hạn | cùng `DongA` | tvv-1440 | KHỚP |
| V2 / V4 | Head: Lộ trình · Bổ sung hồ sơ · Việc được giao; "Tất cả việc đã giao ›" ở đầu nhóm | cùng `DongA` | head-1440-viec-quan-ly | KHỚP |
| V3 | Quản trị: Điểm chưa nhập, dòng không ghi người | cùng `DongA` (`anNguoi`) | admin-1440 | KHỚP |
| V5 | Head chưa mở panel: danh sách rộng hết khung, không ô "Chọn một việc" | `HoTroHocVienTab` | head-1440-viec-quan-ly | KHỚP |
| (không vẽ) | Tab Đang theo dõi | `TabTheoDoi` dùng cùng dòng A | — | GIỮ thao tác, đổi hình |
| (không vẽ) | Dòng giữ chỗ "✓ Đã lưu · Hoàn tác" | `VeDong` phủ đúng dòng (subgrid) | — | GIỮ |
| (không vẽ) | "PA đang chạy" · "Đã bỏ qua" · "Yêu cầu của tôi" | **chưa đổi** — [XM4] | — | — |

Tỉ lệ KHỚP ước tính: 20 / 21 thành phần có trong mockup (không tính hai dòng GIỮ / BỎ) ≈ **95 %**. Phần lệch: tên nhóm và dữ liệu demo; nhóm gộp nhiều loại (Phương án…) ghi tên loại ở đầu chi tiết thay vì tách nhóm ([XM1]).

## 2. Thao tác TRƯỚC → SAU (mỗi thao tác đang có trên dòng)

| Thao tác | Trước | Sau |
|---|---|---|
| Mở việc một em | nút động từ cột phải | bấm cả dòng (hoặc tên em bằng bàn phím) → panel |
| Mở việc nhiều em | nút "n em ▾" mở khay | bấm dòng → mở ra từng em, bấm em → panel; dòng làm chung một lưới (Nhập điểm, Ghi kết quả PA, Bàn giao…) bấm = mở panel |
| Viết Báo cáo PH · Chốt lộ trình | nút "Viết ›" · "Cuối khoá ›" | bấm dòng (có "›") → trang |
| Gia hạn (Chọn bước tiếp) | nút trên dòng | **PanelSauThi** — link "Gia hạn" sẵn có (khối hạn) |
| Không thi (Cập nhật KQ thi thật) | nút trên dòng | **PanelSauThi** — nút "Không thi" cùng hàng Lưu KQ (sẵn có) |
| Hoàn thành Xếp lịch họp | nút trên dòng (1 bấm + Hoàn tác) | **PanelMeeting** — nút "Hoàn thành" (mở dòng → Hoàn thành: 2 bấm; Hoàn tác giữ khi panel báo xong) |
| Hoàn thành việc Vận hành giao cho tôi | nút trên dòng (1 bấm + Hoàn tác) | **panel Vận hành** — chọn tiến độ "Hoàn thành" (sẵn có) |
| Bỏ qua (Xếp MT / việc máy chủ báo bỏ qua được) | nút trên dòng | **GIỮ** hàng nút nhỏ dưới dòng — panel chưa có chỗ ([XM2]) |
| Xuất lớp (Báo cáo PH đủ, không hạn) | nút trên dòng | **GIỮ** hàng nút nhỏ dưới dòng — dòng không có panel ([XM2]) |
| Hoàn tác sau Lưu | dải "✓ Đã lưu · Hoàn tác" thay dòng | giữ, vẽ cùng bộ cột |
| Link hồ sơ em (tên em trên dòng) | link trên dòng | tên em là nút mở panel (cả dòng một nút, không lồng link); link hồ sơ ở panel — theo ghi chú v24 mục 6 |
| Xem lại (lọc "Xong hôm nay") | link "Xem lại" | bấm dòng (tên có nhãn "Xem lại") |
| Nhớ gập / mở nhóm · Xem thêm · lọc · bàn phím · `?viec=` | có | giữ |
| Người phụ trách (QL "Tất cả") | đầu dòng phụ | cuối ô chi tiết, chữ mờ |
| Vạch hạn trong nhóm | có | bỏ — quá hạn lên đầu nhóm + ngày đỏ |

## 3. Số đo lệch cột (Playwright, `getBoundingClientRect`, 1440 và 1280; mở hết dòng gộp)

Đo mọi dòng + dòng con của từng tab / vai: lệch trái cột lớp · ai · chi tiết, lệch mép phải cột hạn, khoảng từ hạn tới mép dòng.

| Trang | Số dòng | Lệch lớp · ai · chi tiết · hạn | Hạn cách mép |
|---|---|---|---|
| GV Chấm điểm / Case / Ý thức / Vận hành (1440, danh sách 956) | 10 · 21 · 12 · 6 | 0 · 0 · 0 · 0 px | 20 px |
| TVV (1440) | 2 | 0 | 20 px |
| Head Việc quản lý (1440, danh sách 1400) | 12 | 0 | 20 px |
| Head Tất cả · Case (1440) | 34 | 0 | 20 px |
| Quản trị Chấm điểm Tất cả (1440) | 22 | 0 | 20 px |
| Cùng các trang ở 1280 (danh sách 796 / 1240) | như trên | 0 | 20 px |

Không dòng nào xuống dòng ở ô lớp / ai, không tràn ngang trang. Chi tiết dài hơn ô (vài dòng Ý thức / Phương án) cắt bằng "…", đủ chữ ở `title`.

## 4. [XM] chờ PTA Plan quyết

- **[XM1] Nhóm = động từ việc — làm ở mức hiển thị.** Mục gộp (Mô tả Case · Phương án · Kết quả PA · Lộ trình · Vi phạm) tách thành Mô tả Case · Xác nhận Case · Thêm PA · Xác nhận PA · Ghi Mini Test · Ghi kết quả PA · Chốt lộ trình · Xét lại lộ trình · Xử lý vi phạm · Đã thực hiện · Khai cấp bậc (`tachNhom` trong `DanhSachViec.tsx`). Số tab / badge / `tongQuan.ts` không đổi; số ở đầu nhóm con đếm lại từ dòng (cùng luật `dem`). Khoá gập / mở = khoá nhóm con (nhóm "Mô tả Case" giữ khoá cũ `mo-ta`; nhóm Phương án / Lộ trình / Vi phạm cũ mất trạng thái gập đã nhớ, về mặc định mở).
- **[XM2] Nút còn lại trên dòng.** Chỉ **Bỏ qua** và **Xuất lớp** (không có chỗ trong panel): giữ hàng nút nhỏ dưới dòng, chỉ dòng có nút. Đề xuất: Bỏ qua → ⋯ đầu panel (panel-gon); Xuất lớp → bấm dòng tải luôn hoặc nút trong trang lớp.
- **[XM7] Bổ sung hồ sơ có lớp.** Việc `bo_sung_ho_so` là MỘT dòng gộp theo người giữ (`viecTvv.ts`): máy chủ không trả lớp / tên em / `con`, chỉ `emIds` + `reason` ("Email 1 · Target 1"). Web hiện tên việc chiếm ô lớp + ô em (không ô trống) và chi tiết = thiếu gì. Muốn "lớp · em · Thiếu Target" và mở ra từng em có lớp thì cần máy chủ thêm `con` từng em (lớp, tên, thiếu gì) — PR riêng, đụng đếm việc.
- **[XM3] Panel.** Khung panel 720 (`KhungPanel`, session panel-gon) chưa vào `main` lúc chụp: ảnh `gv-1440-panel` còn panel 58 % che mép phải danh sách; danh sách đã đúng min(680, 100vw − 784) và không co. Chụp lại khi panel-gon merge.
- **[XM4] "PA đang chạy", "Đã bỏ qua", "Yêu cầu của tôi", "Lớp của tôi"** không có trong khung → giữ nguyên dáng cũ, dưới danh sách. Muốn đồng bộ thì PR sau.
- **[XM5] Danh sách rộng 656 px (1440 + panel)** thay vì 680: trang thật có lề 20 hai bên, panel 720 + khoảng 24.
- **[XM6] Chi tiết lấy từ chữ máy chủ** (không thêm câu SQL / trường mới): bỏ động từ đầu, lớp, tên em, số em, "SOS n"; tối đa 2 mẩu.

## 5. Tự soi

Chữ không đè, không xuống dòng lạ ở ô lớp / tên em, mã tuần một dòng, không thừa khoảng cột cuối (hạn sát lề 20). 375: dòng hai tầng như A5, không tràn ngang.

## 6. Dòng "Việc con của: …" (báo từ bang-giao-viec-cot) — không đè cột hạn

Chi tiết (`.cvA-ct`) là một dòng, `min-width: 0` + cắt "…" nên không bao giờ chạm cột hạn; ≤ 599 px chi tiết nằm tầng hai. Thử chèn chuỗi "Việc con của: Kiểm kê giáo trình tháng 9 và chuẩn bị đề thi cuối kỳ" vào mọi dòng (1440 / 1280 panel mở, 1440 chưa mở, 375): 0 dòng đè hạn, không tràn ngang.  (Chỉ là phép thử bằng DOM, KHÔNG phải giao diện thật — không có ảnh kèm.)

## 7. Chưa làm: dải tab "Thêm n ▾" ở 1280 khi mở panel (mockup đợt ba)

Là dải tab (`HangTab`), không thuộc danh sách việc — PTA Plan quyết giao cho PR này hay PR riêng.

## 8. Khoảng trống thừa từng cột (PTA Plan bổ sung)

Đo = bề rộng ô − nội dung dài nhất của cột trong trang (px), 1440, mở hết dòng gộp.

| Trang | Ô ai thừa: trước → sau | Ô lớp thừa: trước → sau |
|---|---|---|
| Head Việc quản lý (danh sách 1400) | **443 → 82** (cột 476 → 115; nội dung "1 em" 33) | 255 → 82 (ô lớp rộng hơn nội dung vì dòng việc không lớp chiếm ô lớp + ô ai) |
| Quản trị · Chấm điểm Tất cả (1400) | 335 → **0** | 255 → 0 |
| Head · Case Tất cả (1400) | 286 → **0** | 275 → 0 |
| GV / TVV (danh sách 956, có khối phải) | 115–219 (giữ 4·5·4 như mockup) | 118–156 |

Cách làm: trang rộng ≥ 1100 px (vai không có "Lớp của tôi") ô lớp và ô ai theo nội dung (`max-content`), ô chi tiết ăn phần dư; dưới 1100 px giữ 4·5·4 như mockup. Phần dư chuyển sang giữa ô chi tiết và hạn (chữ chi tiết sát trái, hạn sát phải) — không còn khoảng trống giữa lớp / ai / chi tiết. Lệch cột vẫn 0 px ở 16 trang.
