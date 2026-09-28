---
name: Pisa Tracking
description: Sổ theo dõi học viên IELTS của Pisa — nền xanh mực, màu chỉ mang nghĩa, việc tiếp theo luôn trong tầm tay.
colors:
  bg: "#0c1220"
  surface: "#141d2f"
  surface-2: "#1a2437"
  surface-hover: "#24304a"
  field-bg: "#0e1727"
  field-disabled: "#0b1322"
  line: "rgba(160, 178, 214, 0.14)"
  line-strong: "rgba(160, 178, 214, 0.26)"
  accent: "#7db3f0"
  accent-strong: "#a9cdf7"
  accent-ink: "#0b1626"
  accent-soft: "rgba(125, 179, 240, 0.14)"
  accent-line: "rgba(125, 179, 240, 0.38)"
  text: "#dde5f2"
  text-dim: "rgb(147 163 192)"
  text-faint: "rgb(130 146 174)"
  ink-800: "#13212d"
  teal-600: "#0d9488"
  teal-300: "#5eead4"
  ok: "rgb(111 220 159)"
  ok-bg: "rgb(18 53 38)"
  ok-line: "rgb(43 112 80)"
  bad: "rgb(255 154 162)"
  bad-bg: "rgb(60 29 36)"
  bad-line: "rgb(136 64 74)"
  late: "rgb(255 145 102)"
  late-bg: "rgb(62 31 19)"
  late-line: "rgb(154 74 42)"
  soon: "rgb(242 196 80)"
  soon-bg: "rgb(53 43 16)"
  soon-line: "rgb(122 98 34)"
  doing: "rgb(128 184 255)"
  doing-bg: "rgb(19 44 77)"
  doing-line: "rgb(47 93 149)"
  done: "rgb(169 181 200)"
  done-bg: "rgb(26 36 54)"
  done-line: "rgb(52 68 95)"
  wait: "rgb(196 169 255)"
  wait-bg: "rgb(39 32 67)"
  wait-line: "rgb(87 74 138)"
  muted: "rgb(201 212 230)"
  muted-bg: "rgb(29 42 64)"
  muted-line: "rgb(52 68 95)"
  sos1: "rgb(242 196 80)"
  sos1-bg: "rgb(53 43 16)"
  sos1-line: "rgb(122 98 34)"
  sos2: "rgb(255 145 102)"
  sos2-bg: "rgb(62 31 19)"
  sos2-line: "rgb(154 74 42)"
  sos3: "rgb(255 154 162)"
  sos3-bg: "rgb(60 29 36)"
  sos3-line: "rgb(136 64 74)"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    fontFeature: "tnum"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "28px"
  title:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  title-panel:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: "20px"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  label-field:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "11.5px"
    fontWeight: 700
  label-table:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.04em"
  label-section:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    letterSpacing: "0.06em"
  badge:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    lineHeight: "16px"
  button:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  button-strong:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
components:
  button:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0.45rem 0.85rem"
  button-hover:
    backgroundColor: "{colors.surface-hover}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button-strong}"
    rounded: "{rounded.lg}"
    padding: "0.45rem 0.85rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.accent-ink}"
  button-danger:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.bad}"
    rounded: "{rounded.lg}"
    padding: "0.45rem 0.85rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  button-sm:
    typography: "{typography.label}"
    rounded: "0.4rem"
    padding: "0.25rem 0.6rem"
  button-chon:
    backgroundColor: "{colors.ink-800}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "0.45rem 0.85rem"
  field:
    backgroundColor: "{colors.field-bg}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0.45rem 0.6rem"
    width: "100%"
  field-disabled:
    backgroundColor: "{colors.field-disabled}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    width: "560px"
  panel-rong:
    backgroundColor: "{colors.surface}"
    width: "720px"
  panel-header:
    typography: "{typography.title-panel}"
    height: "52px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  table-header:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-dim}"
    typography: "{typography.label-table}"
    padding: "0.6rem 0.75rem"
  badge:
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: "0 7px"
---

# Design System: Pisa Tracking

<!-- Nguồn: impeccable `document` (scan mode) trên web/src/index.css + tailwind.config.js + thiet-ke/HE_GIAO_DIEN.md;
     câu chữ định tính lấy từ HE_GIAO_DIEN §1 và đặc tả 2026-09-27 §7.1–7.5 (chủ sản phẩm duyệt 27/09). Chỉ ghi giá trị đang
     chạy thật; chế độ sáng và font mới là việc của PR-SANG, chưa có ở đây. -->

## Overview

**Creative North Star: "Sổ trực mực xanh"**

Một cuốn sổ trực ban trên nền xanh mực: yên, đều, đọc nhanh giữa hai tiết học. Mặt giấy chỉ có ba lớp nền và một màu nhấn
xanh pastel cho việc cần bấm; mọi màu mạnh khác đều là **nghĩa** — điểm so với kỳ vọng, mức SOS, quá hạn, chờ duyệt — và luôn đi
kèm chữ. Không có gì trang trí: không chuyển động cho vui, không gradient, không card lồng card.

Mật độ cao nhưng không ngợp: bảng trải hết bề rộng, chữ nhiều thì chia cột (tối đa 78ch mỗi cột); mỗi màn có ba tầng thông tin —
tầng 1 là con số / quyết định (điểm, mức SOS, việc quá hạn, việc tiếp theo), tầng 2 là tên và mô tả, tầng 3 là metadata nhỏ,
ẩn được trên điện thoại. Cột và hàng thẳng: số căn phải, mọi số và ngày dùng chữ số đều bề rộng (`tabular-nums`), hàng cao đều.

Hệ này là **tinh chỉnh thế giới đang có**, không thiết kế lại. Thêm thành phần mới thì bổ sung vào bộ `web/src/ui/`, không dựng hệ
thứ hai.

**Key Characteristics:**
- Nền tối xanh mực, ba mức bề mặt, viền mảnh màu xanh xám trong suốt.
- Một màu nhấn (xanh pastel) cho nút chính, liên kết, focus và hàng đang xem.
- Tám màu nghĩa, mỗi màu có bộ ba chữ · nền · viền; thang SOS vàng / cam / đỏ.
- Chữ nhỏ, đậm vừa, số đều bề rộng; nhãn nhỏ viết hoa có giãn chữ.
- Một khung panel bên (`KhungPanel`) cho mọi form; bo góc vừa phải, phẳng.

## Colors

Bảng màu tối lạnh: nền xanh mực, một nhấn xanh pastel, và các màu nghĩa dịu trên nền sẫm cùng họ — chữ nghĩa đạt ≥ 4.5:1 trên
nền riêng và mọi nền trang (phép kiểm `server/src/tests/nenGiaoDien.tests.ts` đọc chính khối `:root`).

### Primary
- **Xanh pastel nhấn** (`accent`): nút chính (chữ `accent-ink` trên nền nhấn), liên kết, viền focus 2 px, gạch chân tab đang mở,
  vạch trái hàng đang xem. `accent-strong` là trạng thái rê chuột của nút chính; `accent-soft` / `accent-line` là nền và viền nhạt
  của hàng đang xem, việc phải làm (`Task`).

### Secondary
- **Nền mực chọn** (`ink-800`) + **viền teal** (`teal-600`) + **✓ teal nhạt** (`teal-300`): chỉ cho trạng thái **Đang chọn** của
  lựa chọn trong form và bộ lọc (`NutChon`, `BoLocDoan` — dựng ở PR-NEN Task 4). Khác hẳn nút chính (nền xanh đặc = Lưu).

### Tertiary — màu nghĩa
- **Xanh lá** (`ok`): đạt, tiến bộ, ổn. Trên ô điểm chỉ có một nghĩa: vượt kỳ vọng.
- **Hồng đỏ** (`bad`): chưa đạt, dưới kỳ vọng, SOS 3.
- **Cam** (`late`): quá hạn — luôn kèm ⚠; SOS 2.
- **Vàng** (`soon`): sắp tới hạn, hôm nay, đang chờ; SOS 1.
- **Xanh dương** (`doing`): bằng kỳ vọng ở ô điểm; số đếm trên tab. Trạng thái quy trình không mượn màu này (PR-NEN Task 4 đưa
  `Status` "đang làm" về trung tính).
- **Xám xanh** (`done`): đã xong.
- **Tím nhạt** (`wait`): chờ người khác (chờ duyệt).
- **Trung tính** (`muted`): thông tin, chip, chưa đủ dữ liệu (viền đứt = số tạm).
- **Thang SOS** (`sos1` vàng · `sos2` cam · `sos3` đỏ): trong `index.css` là bí danh của `soon` · `late` · `bad` — cùng giá trị, tên
  riêng để đọc đúng nghĩa. SOS tạm thời giữ đúng màu mức đó, thêm viền đứt và chữ "tạm thời".

Mỗi màu nghĩa có ba vai: chữ (`x`), nền badge (`x-bg`), viền (`x-line`). Khai báo một chỗ ở `web/src/index.css :root` dạng bộ ba
RGB để ghép độ trong (`bg-bad/15`); `tailwind.config.js` ánh xạ tên (`text-ok`, `bg-bad-bg`, `border-late-line`).

### Neutral
- **Nền trang** (`bg`): `body`.
- **Bề mặt** (`surface`): card, panel, đầu trang, thanh điều hướng dưới, cột dính.
- **Bề mặt 2** (`surface-2`): nút thường, đầu bảng, khối chỉ xem. `surface-hover` là nền nút khi rê chuột.
- **Ô nhập** (`field-bg`, khoá: `field-disabled`).
- **Viền** (`line`, đậm hơn: `line-strong`): đường kẻ bảng, viền card, viền nút và ô.
- **Chữ** (`text`), **chữ phụ quan trọng** (`text-dim`), **chữ phụ nhỏ** (`text-faint`).

### Named Rules
**The Meaning-Only Rule.** Màu mạnh chỉ dành cho nghĩa; không khu nào có màu riêng. Thấy một sắc nền thứ tư trong màn là lỗi cần gỡ.

**The Grayscale Rule.** Màu không bao giờ là tín hiệu duy nhất: chụp màn hình chuyển sang xám vẫn đọc được mọi trạng thái.

**The Score-Color Rule.** Bốn màu điểm (dưới · bằng · vượt kỳ vọng · chưa đủ dữ liệu) chỉ dùng cho điểm; trạng thái quy trình dùng
tone trung tính + nhãn chữ. SOS không bao giờ rơi về xanh dương.

## Typography

**Body Font:** Inter (với system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif)
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, monospace (hiếm dùng)

**Character:** Một họ chữ không chân, cỡ nhỏ và đậm vừa phải — công cụ làm việc, không phải trang quảng cáo. `Inter` được khai báo
nhưng chưa nạp tệp font, nên máy người dùng thường hiện font hệ thống; đổi sang một font thật là việc của PR-SANG.

### Hierarchy
- **Display** (600, 24px, 32px): số lớn ở ô KPI; luôn `tabular-nums`.
- **Headline** (600, 18px, 28px): tiêu đề trang.
- **Title** (600, 14px, 20px): tiêu đề card; tiêu đề panel đậm hơn (800).
- **Body** (400, 14px, 1.5): nội dung, số trong bảng. Cỡ nền của `body`.
- **Body nhỏ** (400, 12px, 16px): chữ phụ, ghi chú. Không dùng cho kết quả, hạn, người phụ trách.
- **Label** (500, 12px): nhãn ô (`.label`); nhãn trường trong panel 11.5px, 700.
- **Label bảng** (600, 11px, giãn 0.04em, VIẾT HOA): đầu cột bảng.
- **Label khối** (800, 10px, giãn 0.06em, VIẾT HOA): tiêu đề khối trong panel (`Khoi`).
- **Badge** (700, 10.5px, 16px): nhãn trạng thái ngắn, bo tròn hết.

### Named Rules
**The Tabular Rule.** Mọi số và ngày dùng `tabular-nums`; số căn phải, chữ căn trái.

**The Small-Print Rule.** Cỡ 12px trở xuống chỉ cho metadata (tầng 3) — không bao giờ cho kết quả, hạn hay người phụ trách.

## Layout

- Khung ứng dụng: đầu trang cao 56px trên nền bề mặt; thân cuộn riêng, đệm 16px (20px từ `md`). Dưới `md` điều hướng chính chuyển
  xuống thanh cố định ở đáy.
- Bảng và bảng số trải **hết chiều rộng** (`.page`); khối nhiều chữ đặt trần 78ch mỗi cột (`.prose-col`) và chia cột ở màn rộng.
- Bảng rộng hơn màn hình cuộn **trong chính nó** (`.table-scroll`), không để cả trang trượt ngang. Hộp tra cứu cuộn riêng.
- Đổi bảng theo bề rộng: ≥ 1024px bảng đầy đủ · 640–1023px cuộn ngang trong vùng bảng, cột đầu dính · < 640px mỗi bản ghi một thẻ,
  thứ tự thông tin giống thứ tự cột.
- Nhịp khoảng cách: 8px giữa phần tử cùng nhóm, 12–16px trong một khối, 20–24px giữa hai khu lớn.
- Hàng lớn / hàng con của bảng: hàng lớn cao 38px, chữ 12.5px đậm, vạch trái 3px xanh trung tính; hàng con cao tối thiểu 32px, chữ
  11.5px, thụt 32px.
- Ô bấm tối thiểu 44px trên điện thoại (`min-h-[44px] sm:min-h-…`).

## Elevation & Depth

Hệ phẳng, phân lớp bằng tông nền: nền trang → bề mặt → bề mặt 2, cộng viền mảnh trong suốt. Bóng đổ chỉ xuất hiện ở lớp **nổi
lên trên** trang — panel bên, modal, menu thả — kèm lớp phủ đen 60% phía sau panel. Card và bảng không có bóng.

### Named Rules
**The Flat-Surface Rule.** Card, bảng, ô nhập phẳng; độ sâu chỉ dành cho thứ đè lên trang (panel, modal, menu).

## Shapes

Bo góc vừa phải, không tròn trịa: ô điểm 6px (`md`), nút và ô nhập 8px (`lg`, nút nhỏ 0.4rem), card 12px (`xl`), badge và số đếm
bo tròn hết (`full`). Viền 1px ở mọi nơi; viền đứt chỉ mang nghĩa "tạm / chưa bắt đầu / chưa đủ". Vạch trái 3px là dấu của hàng
lớn và việc phải làm.

## Components

### Buttons
Gọn, rõ, một nút chính mỗi vùng.
- **Shape:** bo 8px (`lg`); nút nhỏ 0.4rem, chữ 12px.
- **Thường:** nền bề mặt 2, viền `line-strong`, chữ 500.
- **Chính:** nền nhấn, chữ `accent-ink` 600. Mỗi vùng chỉ một; thao tác phá huỷ không bao giờ là nút chính.
- **Nguy hiểm:** viền đỏ nhạt, chữ `bad`, rê chuột nền đỏ 12%.
- **Ma:** trong suốt, rê chuột nền xám xanh 10% — cho ✕ và thao tác phụ.
- **Hover / Focus:** đổi nền và viền trong 120ms; focus viền nhấn 2px cách 2px, luôn thấy được. Tắt: mờ 45%.

### Chips (lựa chọn đang chọn)
- **Style (`NutChon`, `BoLocDoan`):** chưa chọn giống nút thường; **đang chọn** nền `ink-800` + viền `teal-600` + ✓ 10px `teal-300`
  + `aria-pressed`. Chỗ của ✓ luôn giữ sẵn để chữ không nhảy. Tab trang vẫn là `HangTab` gạch chân, không dùng kiểu này.

### Cards / Containers
- **Corner Style:** 12px (`xl`).
- **Background:** bề mặt; khối chỉ xem dùng bề mặt 2 bo 6px.
- **Shadow Strategy:** không bóng (xem Elevation & Depth).
- **Border:** 1px `line`.
- **Internal Padding:** 16px; đầu card 12px × 16px có vạch dưới.

### Inputs / Fields
- **Style:** nền `field-bg`, viền 1px `line-strong`, bo 8px, đệm 0.45rem × 0.6rem, rộng hết cột.
- **Focus:** viền đổi sang màu nhấn. Ô điểm sửa được (`.o-sua`) có viền và nền riêng, focus thêm quầng xanh 3px; ô chỉ đọc không viền.
- **Error / Disabled:** lỗi là một dòng chữ cam 11px dưới ô, chỉ hiện sau khi bấm Lưu / rời ô; khoá mờ 60% trên `field-disabled`.
- Nhãn luôn ở **trên** ô; `*` đỏ khi bắt buộc; chữ phụ tối đa một dòng; chữ mẫu bắt đầu "Ví dụ:".

### Navigation
- **Đầu trang:** cao 56px, nền bề mặt, vạch dưới; mục điều hướng chữ 14px bo 8px.
- **Tab (`HangTab`):** chữ 600, đang mở gạch chân 2px màu nhấn + chữ sáng; số đếm trong viên tròn nhỏ; hàng tab cuộn ngang trong
  chính nó ở 375px.
- **Điện thoại:** điều hướng chính thành thanh cố định ở đáy, chữ 11px.

### Panel bên (`KhungPanel`) — thành phần đặc trưng
Một khung cho mọi form: ngăn phải 560px (form dạng bảng 720px), toàn màn ở 375px. Đầu 52px một dòng: tiêu đề · tên HV · lớp (mờ,
cắt "…") · ✕. Thân chia khối có tiêu đề nhỏ viết hoa, tối đa hai ô một hàng. Chân cố định: trái Huỷ / Xoá, phải nút phụ + **một**
nút chính; "Còn thiếu: …" canh phải trên chân. Chỉ thân cuộn; mở việc khác thì thay nội dung, không chồng panel. Esc đóng.

### Badge (`Nhan`, `Level`, `Status`)
Một badge = một trạng thái ngắn (≤ 3 từ + số): bo tròn hết, chữ 10.5–11px đậm, nền `x-bg` + chữ `x`. Viền đứt = số tạm. Có hành
động thì cao ≥ 28px.

## Do's and Don'ts

### Do:
- **Do** lấy mọi màu qua biến CSS ở `web/src/index.css :root` và tên Tailwind trong `tailwind.config.js` (`text-ok`, `bg-bad-bg`).
- **Do** kèm nhãn chữ cho mọi trạng thái có màu.
- **Do** dùng `tabular-nums` cho mọi số và ngày; số căn phải.
- **Do** giữ thang SOS vàng (`sos1`) · cam (`sos2`) · đỏ (`sos3`) ở mọi màn; SOS tạm thời cùng màu, viền đứt, chữ "tạm thời".
- **Do** dùng `KhungPanel` cho form mới; panel bên trước modal.
- **Do** giữ ô bấm ≥ 44px trên điện thoại và focus nhìn thấy được.
- **Do** dùng dấu nhỏ nét mảnh: ✓ 10px, ▾, biểu tượng SVG nét 1.5px cỡ 14px.

### Don't:
- **Don't** thêm chuyển động trang trí hay gradient (ngoại lệ duy nhất: vệt sáng của khung đang tải `.skel`).
- **Don't** đặt card trong card.
- **Don't** mở modal khi panel bên là đủ.
- **Don't** thêm màu mới cho từng khu, hay một sắc nền thứ tư.
- **Don't** dùng bốn màu điểm cho trạng thái quy trình; không để SOS hiện xanh dương.
- **Don't** hiện ngày ISO, mã nội bộ hay chữ kỹ thuật trên giao diện.
- **Don't** dùng emoji to làm biểu tượng.
- **Don't** để thao tác chỉ hiện khi rê chuột.
