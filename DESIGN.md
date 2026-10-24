---
name: PISA Progress
description: Bàn làm việc của giáo viên — theo dõi Test, điểm, Case cho trung tâm IELTS
colors:
  bg: "#050a16"
  surface: "#111c33"
  surface-2: "#172440"
  line: "#22324f"
  line-strong: "#33496f"
  text: "#e7edf7"
  accent: "#94bdf2"
  accent-strong: "#b8d3f7"
  hong: "#f57aae"
  dieu-huong-nen: "#0a1a3a"
  ok: "rgb(116 217 163)"
  bad: "rgb(255 154 143)"
  late: "rgb(255 154 143)"
  soon: "rgb(242 196 80)"
  doing: "rgb(148 189 242)"
  done: "rgb(158 172 200)"
  muted: "rgb(186 198 222)"
  text-dim: "rgb(186 198 222)"
  text-faint: "rgb(158 172 200)"
  sos1: "rgb(214 184 40)"
  sos2: "rgb(232 112 42)"
  sos2-nen: "#3a2410"
  sos3: "rgb(240 100 90)"
  sos3-nen: "#9c201c"
  da-thi-bg: "rgb(15 35 53)"
  light-bg: "#f3f5f9"
  light-surface: "#ffffff"
  light-surface-2: "#f2f4f9"
  light-text: "#141a2b"
  light-accent: "#273c8f"
  light-hong: "#f25a98"
typography:
  body:
    fontFamily: "'Be Vietnam Pro', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  table-head:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  table-cell:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  page-title:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
  group-row:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 800
  work-object:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  chip:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "22px"
rounded:
  chip-square: "0.25rem"
  field: "0.5rem"
  card: "0.75rem"
  pill: "9999px"
spacing:
  btn: "0.45rem 0.85rem"
  btn-sm: "0.25rem 0.6rem"
  field: "0.45rem 0.6rem"
components:
  button:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "{spacing.btn}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#060c1a"
    rounded: "{rounded.field}"
    padding: "{spacing.btn}"
  field:
    backgroundColor: "#0b1427"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "{spacing.field}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  chip-tron:
    rounded: "{rounded.pill}"
    typography: "{typography.chip}"
    height: "22px"
  chip-vuong:
    rounded: "{rounded.chip-square}"
    typography: "{typography.chip}"
    height: "22px"
---

# Design System: PISA Progress

> Bản ghi hệ giao diện **đang có** (nguồn: `web/src/index.css`, `web/src/ui/`), không phải thiết kế mới. Token gốc nằm trong
> `index.css` — khi lệch, `index.css` đúng. Đổi phông, bảng màu, bố cục phải qua kế hoạch PR + mockup duyệt (CLAUDE.md).
> **Thứ tự đọc (TL-V5, 24/10):** mục "Luật V5" (mới nhất, thắng khi khác) → "Luật 21/10" → phần mô tả bên dưới. Bảng mẫu sống: `/dev/thanh-phan`
> (`web/src/modules/dev/BangMauV5.tsx`, theo `thiet-ke/v5/bang-mau.html`).

## Luật V5 (22–24/10 — mockup `thiet-ke/v5/` #507–#510 + `docs/superpowers/specs/2026-10-22-overhaul-v5/` `04`, `10`; đã vào mã #528–#561)

| # | Luật | Nguồn |
|---|---|---|
| V1 | **Nâng cấp, không chép mockup:** giữ mọi thao tác V4 (Nhập điểm, + Case, ⋯, Xuất, Dán Excel…), sửa đồng bộ cả phần mockup không vẽ (panel, hộp, popover, chân lưu, rỗng / lỗi); xung đột → [XM] | `10` mục 8; CLAUDE.md |
| V2 | **Màu PISA từ logo:** xanh `#273C8F` (cấu trúc: thanh điều hướng `--dieu-huong-*`, nút chính sáng) · hồng `--hong` chỉ để **nhận diện** (logo, chữ khớp khi tìm) — hồng KHÔNG mang nghĩa lỗi / SOS. Tối: xanh bớt ngả tím, nền `#050a16` (P3) | `04` M19; `10` P3 |
| V3 | **Logo:** chữ "PISA" hồng đậm + "TRACKING" mảnh giãn chữ, không ảnh logo trung tâm; "TRACKING" trắng cả ở chế độ sáng vì thanh vẫn nền xanh (chữ đen 2,1 : 1 — [XM] #545) | `10` mục 8; #545 |
| V4 | **Bốn nhóm badge, một cỡ** (cao 22, chữ 12 / 600, `ui/Nhan.tsx`): ① kết quả học tập `NhanKq` — góc 4 px, viền 1 px màu nghĩa, ✓ ✗ – đứng đầu · ② lịch thi `NhanLich` — nền xanh lơ đặc, góc 2 px ("Đã thi · chờ KQ" không nhầm Đạt) · ③ tiến độ xử lý `Nhan` — viên tròn nền xám + chấm màu; sắp hạn / quá hạn nền nhạt + ⚠ · ④ mức SOS `ChipSos` / `lopSos` | `04` M12 (C23); #528 NEN-V5 |
| V5 | **SOS 1 · 2 · 3 khác hẳn, đọc được không cần màu:** SOS 1 viền mảnh vàng trên nền thẻ · SOS 2 viền 2 px cam + nền cam nhạt · SOS 3 nền đỏ đặc `--sos3-nen` chữ trắng (không hồng, bớt chói #545) · tạm = viền đứt | `10` P6, mục 8 |
| V6 | **Ít chữ (P1):** không câu giải thích luật / cách tính trên màn chính → dấu **"?"** (`NutLuat`) hoặc ⓘ; chú thích trong mockup không lên web | `10` P1 |
| V7 | **Phân cấp (P2):** nhãn nhỏ xám / giá trị đậm (`NhanGt`, dòng thông tin đầu hồ sơ), chính trước phụ, dữ liệu tách thao tác; không lạm dụng badge | `10` P2 |
| V8 | **Hạn = ngày thật** `hạn 28/10` (P7), không thứ, không "tuần này / tuần sau"; tháng thi dự kiến luôn kèm năm `Dự kiến 02/2027` (P5); "Thi tháng này" thay "Thi tuần này" (P4) | `10` P4, P5, P7 |
| V9 | **Thời gian tự do (P9):** Từ tuần → Đến tuần; Phân tích thêm **Toàn bộ** · **Chọn khoảng tuần**, không trần 52 tuần (#558); hồ sơ GV mặc định 4 tuần; ô chọn một tuần `‹ W3 SEP ›` + **Tuần này** (#560) | `10` P9 |
| V10 | **Trang đầu mọi vai = Tổng quan tình hình** (3–4 chỉ số + khối theo vai + cột "Chờ bạn duyệt" / **Điều hướng**), không form làm việc; việc làm ở **Công việc** (GV, TVV có Công việc riêng, Admin, QL). Thay G3 | `04` M1, M2 (C04, C05); #551 |
| V11 | **Số → panel chỉ đọc (C22):** định nghĩa, phạm vi, tử / mẫu, danh sách đúng tập tạo nên số — không form / nút làm việc trong panel báo cáo. Số theo **lượt của từng HV** (P8), không "MT gần nhất của lớp" | `04` M3; `10` P8 |
| V12 | **Sau lưu:** **Lưu** ở lại · **Lưu và tiếp** chuyển khi đã lưu xong · lỗi → ở lại, giữ chữ; không tự chuyển theo giờ; việc xong rời danh sách | `04` M16 |
| V13 | **Đơn vị luôn ghi** (việc / bài / HV / lượt / Case); badge Công việc = số **việc của chính người xem** (`mine`), chuông = tin chưa đọc, khác dáng badge | `04` M15; #560 (nợ #528) |
| V14 | **Tìm kiếm thanh trên:** `/` hoặc `Ctrl K`; nhóm Học viên · Lớp · GV, chỉ trong phạm vi quyền máy chủ; chữ khớp tô hồng | #560 k1 |
| V15 | **Ô MT thiếu nhận xét:** chỉ MT mới nhất của em, ô **viền vàng** + nhắc ở tooltip / tên đọc màn — không chữ dưới ô, không chặn lưu (LUAT-NX-MT, N8) | `10` mục 7; #549, #560 |
| V16 | **Tiêu đề trang 22 / 700** (`text-xl` = 22 trong thang Tailwind; mockup `.h-trang`). Còn lệch 17 px (`text-lg`) ở 11 trang — CHAM-LAI sửa (`plan.md` mục 4) | `04` mục 2.2; mockup V5 |

## Luật 21/10 (overhaul — chủ SP duyệt #486; thắng phần mô tả bên dưới khi khác)

Nguồn: `docs/superpowers/specs/2026-10-20-ke-hoach-overhaul/` — `02` quyết định, `04` hệ thiết kế (chi tiết từng thành phần), `05` workflow.
Phần bên dưới mục này là **bản ghi mã hiện tại**; dòng ghi "→ Luật 21/10" sẽ đổi ở PR nền (NEN-TYPO-MAU, NEN-BANG, NEN-SO-PANEL, NEN-TUAN — `07` mục 6).

| # | Luật | Nguồn |
|---|---|---|
| G1 | **Khung mockup đã duyệt thắng** file này và luật giao diện cũ hơn ngày duyệt (trừ nghiệp vụ, quyền, chống mất dữ liệu) | 02 mục 2.3 (9.1-1); 04 mục 1.8 |
| G2 | **Thi** = kỳ thi thật (IELTS…) · **Test** = MT, Progress, Final, Mini…; gọi chung "Test". Chữ trạng thái Test theo bảng thuật ngữ Rulebook ("Đã làm bài", "Vắng", "Đã huỷ · vắng 2 lần", nút "Bỏ khỏi đợt") | 02 mục 2.5 (V2 I.5), 4.7 A8 |
| G3 | ~~Việc của tôi ở trang đầu vai; TVV không thêm mục Công việc~~ → **thay bằng V10** (trang đầu = Tổng quan tình hình, việc ở Công việc, TVV có Công việc) | 02 mục 2.9 (Q-A1 ①); V5 `04` M1, M2 |
| G4 | **Một danh sách một kiểu mở:** danh sách có khung phải → mọi dòng mở ở khung phải; bảng rộng không khung phải → mở dưới hàng; danh sách hẹp không mở rộng tại dòng; mở cái mới thay cái cũ, không panel chồng | 04 mục 9.2; 02 4.7 C5, A12, A14 |
| G5 | **Thang làm tại chỗ 0–5**, chọn bậc thấp nhất đủ dùng: 0 chỉ xem · 1 một bấm + Hoàn tác 10 s · 2 hộp neo / mở dưới hàng · 3 khung chi tiết phải (375 toàn màn + "‹ Quay lại") · 4 panel rộng · 5 trang riêng (xem hồ sơ, cần không gian lớn); modal chỉ để xác nhận hậu quả lớn | 04 mục 9.2; 02 4.1 (10.7-6) |
| G6 | **Một nghĩa một dáng:** ô số (`OSo`) = mở tại chỗ / panel · chữ + "›" = đổi trang (không "›" trong nút) · "↗" sau tên = mở hồ sơ · **ⓘ** = giải thích (thay "?") · bỏ gạch chấm chấm dưới chỉ số · số 0 không bấm | 04 mục 8; 02 2.5 (V3 II.1.1, II.1.3) |
| G7 | **Số trên trang = số dòng panel** (cùng hàm, đúng tập tạo nên con số); một phạm vi số cho cả trang | 04 mục 1.6, 9.3; 02 2.3 (9.1-4) |
| G8 | **Báo cáo thuần:** báo cáo / Phân tích không lồng việc, không cột quá hạn; chỉ bảng theo dõi việc mới có quá hạn | 02 2.5 (V3 II.3) |
| G9 | **Cấm điều khiển trong tiêu đề bảng** (`th` không chứa ô nhập / nút / select); công cụ bảng ở một hàng ngoài khung; căn tiêu đề = căn ô theo kiểu cột (`Bang`) | 04 mục 6.2–6.3; 02 2.5 (V2 I.7, V3 I.3) |
| G10 | **Thời gian:** bộ lọc chỉ Từ tuần – Đến tuần (`Khoảng tuần`); **"Toàn bộ" chỉ ở 6 tab Phân tích**; thi thật giữ tháng / ngày; không hàng nút / chip "Tuần này · Tuần trước", "Ngay hôm nay · W4 SEP" (V5: khoảng tự do, không trần — V9; ô một tuần có nút **Tuần này** cạnh ‹ › — #560) | 02 2.5 (V2 I.1, V3 II.5), 4.7 B12, B13 (X-06) |
| G11 | Thứ tự menu: Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor | 02 2.4 (V1 I.2) |
| G12 | Màu kết quả tô **chính con số điểm** (✓ / ✗ trước số), mọi chỗ có điểm; không % trong ô ("✗ 17/25") | 02 2.4 (V1 I.3), 4.7 A6 |
| G13 | Thang chữ **12 · 13 · 14 · 15 · 17 · 22 · 28** (ô bảng / ô nhập 15, lưới điểm 14, nhãn 13, tối thiểu 12); không in hoa | 02 4.7 A4; 04 mục 2.2 |
| G14 | **Đang chọn** = nền nhấn nhạt + vạch trái 3 px, khác hẳn vòng focus 2 px; vạch trái hàng nhóm màu trung tính | 02 4.7 A11; 04 mục 6.3 |

## Overview

**Creative North Star: "Bàn làm việc của giáo viên"**

Gọn, rõ, yên tĩnh. Người dùng mở PISA để làm việc — nhập điểm, xếp lịch, xử lý Case — nên màn nào cũng phải cho thấy ngay
việc còn thiếu và làm được tại chỗ. Mật độ cao kiểu bảng dữ liệu, nhưng cột hàng thẳng, không dồn chữ. Màu không dùng để
trang trí: màu chỉ báo **trạng thái**. Giao diện mặc định **theo máy** (`prefers-color-scheme`), chọn Sáng / Tối trong menu tài khoản; chế độ sáng
`:root[data-theme="light"]` cùng bộ token.

**Key Characteristics:**
- Bảng và danh sách là chính; hàng nhóm (lớp) đậm có vạch trái, hàng con nhạt hơn.
- Một màu nhấn xanh (`accent`) cho hành động chính và mục đang chọn.
- Trạng thái bằng chip nhỏ có màu + chữ.
- Thời gian ghi bằng mã tuần `W2 OCT`; con số dùng chữ số Inter, `tabular-nums`.
- Thao tác phụ gom vào menu ⋯; sửa trong hộp / panel nổi, không chuyển trang.

## Colors

Nền xanh than tối, một màu nhấn xanh pastel, và một bộ màu trạng thái cố định. **V5 (NEN-V5 #528):** giá trị theo `thiet-ke/v5/v5-nen.css` (màu PISA từ logo — V2),
tên biến cũ giữ nguyên; bốn nhóm badge thay "5 nghĩa" dưới (V4, V5). Đo tương phản: `thiet-ke/v5/kiem-tuong-phan.py`, phép kiểm `nenGiaoDien.tests.ts`.

- **Nền / bề mặt**: `bg` → `surface` (thẻ, panel) → `surface-2` (nút, ô phụ). Vạch kẻ `--line` mảnh, `--line-strong` khi cần rõ.
- **Nền tách lớp** (OV-15a, chủ SP 19/10): trang tối hơn (`bg`), thẻ / bảng sáng hơn một bậc (`surface`), viền rõ hơn (`--line` 0.18, `--line-strong` 0.32).
- **Nhấn** (`accent`, sáng `#1d5fbf`): nút chính, focus ô nhập, **đang chọn = viền khung 2 px quanh cả hàng** (`row-active`), không tô nền; thắng mọi nền. → Luật 21/10 G14.
- **5 nghĩa — dáng / ký hiệu mang nghĩa, màu chỉ phụ** (mockup OV-14 1 §1a; → **V5 thay bằng bốn nhóm badge V4–V5**, dòng 2 "chip SOS chỉ viền" và tím / magenta đã bỏ; quá hạn nay cùng màu lỗi `bad`, luôn kèm ⚠):
  1. Nhấn — đang chọn, nút chính, focus.
  2. Kết quả — chỉ trong ô điểm và chip SOS: ✓ xanh lá vượt kỳ vọng · ✓ xanh dương (`doing`) bằng · ✗ đỏ (`bad`) dưới (SVG nét trơn, không vòng tròn);
     "Chưa đủ điểm" chỉ chữ. Chip SOS chỉ VIỀN (`--sosN-rgb`) + chữ (`--sosN-chu-rgb`), không nền: vàng 1 px · cam 1,5 px · đỏ 2,5 px + viền đôi; tạm = viền đứt.
  3. Đã thi — nền cả hàng `--da-thi-bg-rgb` + vạch trái 3 px `ok` + chip "Đã thi · chờ KQ" / "Có KQ · chờ bước tiếp". Nền hàng CHỈ cho nghĩa này.
  4. Hạn — chỉ chữ: quá hạn cam `late` **luôn kèm ⚠** (không chip, không nền, không tô hàng); sắp hạn / hôm nay vàng `soon`. Hạn ghi ngày `hạn 18/09`, không thứ.
  5. Trung tính `muted` — mọi trạng thái khác (chờ duyệt, chờ chấm, Chưa chốt PA…). Đã bỏ tím `wait` và teal `chon-*` (OV-15a).
- Đạt = `ok`; `bad` còn cho thao tác nguy hiểm.
- Chữ phụ: `text-dim` (quan trọng), `text-faint` (nhỏ) — cả hai ≥ 7:1 trên `bg`, `surface`, `surface-2` ở sáng lẫn tối (`prOv15a`).

## Typography

- **Be Vietnam Pro** cho mọi chữ; **chữ số lấy từ Inter** (khai báo `@font-face` cùng tên, `unicode-range` 0–9) để số thẳng hàng.
- **Thang 12 · 13 · 14 · 15 · 17 · 22 · 28** (NEN-TYPO-MAU #497; `tailwind.config.js` đặt `fontSize`, không extend): `xs` 12 badge / dòng phụ · 13 (`text-[13px]`) đầu cột,
  nhãn, `btn-sm` · `sm` 14 lưới dày, giá trị panel · `base` 15 chữ thường, ô bảng, nút · `lg` 17 tiêu đề khối / panel · `xl` 22 tiêu đề trang · `2xl` 28 số lớn.
  Ô nhập ở 375 = 16 (Safari không tự phóng to). Đầu cột **không in hoa**. Line-height Việt ≥ 1,45 (nhiều dòng), tiêu đề ≥ 1,3.
- Hàng nhóm đậm, hàng con nhạt hơn (cỡ theo thang trên).
- **Số căn giữa** + `tabular-nums` (`td.tabular-nums`, đầu cột số); tên / chữ dài căn trái (C06).
- Đối tượng trong khối **Cần làm** của panel v3 (tên PA, mức kỷ luật, loại meeting): **15 px đậm 700** (OV-12e, chủ SP 14/10).
- **Không chữ < 11 px** ở bất kỳ đâu (→ Luật 21/10 G13: tối thiểu 12).
- Số liệu, điểm, mã tuần: `tabular-nums`.

## Layout

- Chỉ `<main>` cuộn (một thanh cuộn); không cắt chữ, nút không tràn (PR-KHUNG).
- Kiểm ở **375** và **1440**, cả sáng và tối.
- Bảng rộng: `.table-scroll` cuộn ngang trong bảng, trang không trượt ngang. Điện thoại (< 640 px): bảng chuyển thành thẻ, mỗi em một thẻ.
- Trên điện thoại: nút và ô nhập cao tối thiểu 44 px (`max-sm:min-h-[44px]`); máy tính 40 px.
- Thao tác: menu ⋯ ở đầu dòng / đầu hộp; hộp nổi neo vào chỗ bấm (`HopKyNang`, `HopThaoTacMt`); panel trượt (`KhungPanel`) cho form dài.

## Elevation & Depth

Phẳng, phân lớp bằng tông nền (`bg` → `surface` → `surface-2`) và viền mảnh, không đổ bóng trang trí. Bóng chỉ dùng cho vạch
trái (inset) của hàng nhóm / hàng chọn và vòng focus `0 0 0 3px var(--accent-soft)`.

## Shapes

- Thẻ / panel bo 0.75rem; nút và ô nhập 0.5rem (`btn-sm` 0.4rem); ô sửa trong lưới 0.375rem.
- Hai họ chip, cùng cỡ chữ 12 / 600, cao 22 px (NEN-V5): **chip tròn** (`CHIP_TRON`, bo tròn) cho tiến độ xử lý; **chip vuông** (`CHIP_VUONG`, bo 4 px, có viền) cho kết quả / mã (kỹ năng, tuần, điểm). Chip SOS `CHIP_SOS` cùng cỡ.
- Nút lọc nhanh dạng viên (rounded-full, cao 32 px).

## Components

- **Nút** `.btn`: nền `surface-2`, viền mảnh; hover đổi nền + viền nhấn. `.btn-primary` nền nhấn, chữ tối. `.btn-danger` chữ `bad`. `.btn-ghost` trong suốt. Tắt = mờ 45 %.
- **Ô nhập** `.field`: nền `--o-nhap-nen`, viền `--o-nhap-vien`, focus viền nhấn. Ô ngày luôn là `ONgay` (gõ được + nút lịch).
- **Ô sửa trong lưới điểm** `.o-sua`: viền xanh nhạt, focus vòng nhấn.
- **Hàng nhóm / con** (`.hang-lon`, `.hang-con`, `.khoi-nhom-*`): nhóm đậm có vạch trái 3 px màu nhấn, khi thu gọn vạch xám (→ Luật 21/10 G14: vạch trung tính).
- **Chip trạng thái** (`Nhan`): màu theo bảng trạng thái, chữ luôn có nghĩa khi bỏ màu. Tone `late` = chữ cam + ⚠, không chip.
- **Chip SOS** (`ChipSos`, MỘT component mọi màn; dáng V5 ở `lopSos` — V5): "SOS 2 · R, W" / "SOS 3 tạm"; bấm chip = hộp "Vì sao SOS n" (tiêu đề → kết luận đậm → số → việc), không nút `?` cạnh (nút giải thích khác: ⓘ — G6).
- **V5 thêm:** `KhungPanel` (khung panel chung NEN-PANEL: dòng loại, hộp "Bỏ chữ đang gõ?", nháp theo việc, chân lưu thống nhất, 375 toàn màn + bàn phím) ·
  `Bang` (một mẫu bảng, kiểu cột, thẻ ở 375) · `OSo` (ô số mở panel chỉ đọc) · `ChiSo` / `DaiChiSo` (dải chỉ số Tổng quan) · `NhanGt` (nhãn / giá trị) ·
  `LichNho` (chọn tuần theo tháng) · `SaveState` + `KhoiXungDot` ("Bản đã lưu / Bạn đang sửa") · `LichSuThayDoi` (lịch sử trước → sau).
- **Ký hiệu điểm** (`DauKetQua` ✓ / ✗, `MuiTenKyVong` ▲ / ▼ chỉ ở hộp điểm lẻ không có cột kỳ vọng); xu hướng ở Hành trình bằng chữ "Tăng 0.5 / Giảm 0.5 / Không đổi".
- **Thẻ** `.card`: nền `surface`, viền `--line`, bo 0.75rem.
- **Đang tải**: `.skel` shimmer theo khung của nội dung.
- **Toast** báo kết quả lưu; lỗi máy chủ hiện ngay trong hộp/panel (`role="alert"`).

## Do's and Don'ts

**Do**
- Dùng token CSS (`var(--…)`) và lớp sẵn có (`btn`, `field`, `card`, `CHIP_*`, `KhungPanel`, `Menu`); thêm biến thể vào chỗ chung, không rải giá trị.
- Ghi tuần bằng `W2 OCT`; chữ nhãn 1–3 từ.
- Giữ cùng chữ cho cùng thao tác ở mọi màn (`CHU_THAO_TAC`, `CHU_MUC_HOP`).
- Làm thao tác tại chỗ (hộp, panel, ⋯) thay vì chuyển trang.

**Don't**
- Không đổi phông, bảng màu, bố cục đã khoá khi kế hoạch PR không ghi rõ và màn không có mockup mới đã duyệt.
- Không dùng màu trạng thái để trang trí; không dùng màu nhấn cho thông tin thường.
- Không chữ < 12 px (G13); không câu giải thích dưới nút/ô.
- Không hàng nút "Hôm nay · Hôm qua · 2 ngày trước" cho ô ngày.
- Không gradient, glassmorphism, đổ bóng lớn, minh hoạ trang trí.
