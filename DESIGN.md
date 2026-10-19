---
name: PISA Progress
description: Bàn làm việc của giáo viên — theo dõi Test, điểm, Case cho trung tâm IELTS
colors:
  bg: "#080d18"
  surface: "#162033"
  surface-2: "#1d2840"
  text: "#dde5f2"
  accent: "#7db3f0"
  accent-strong: "#a9cdf7"
  ok: "rgb(111 220 159)"
  bad: "rgb(255 154 162)"
  late: "rgb(255 145 102)"
  soon: "rgb(242 196 80)"
  doing: "rgb(128 184 255)"
  done: "rgb(169 181 200)"
  muted: "rgb(201 212 230)"
  text-dim: "rgb(174 188 211)"
  text-faint: "rgb(168 182 208)"
  sos1: "rgb(214 184 40)"
  sos2: "rgb(232 112 42)"
  sos3: "rgb(230 74 160)"
  da-thi-bg: "rgb(22 64 42)"
  light-bg: "#f1f3f7"
  light-surface: "#ffffff"
  light-surface-2: "#f4f6f9"
  light-text: "#0f172a"
  light-accent: "#1d5fbf"
typography:
  body:
    fontFamily: "'Be Vietnam Pro', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  table-head:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  table-cell:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  page-title:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "20px"
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
    fontSize: "11.5px"
    fontWeight: 700
    lineHeight: "18px"
rounded:
  chip-square: "0.375rem"
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
    textColor: "#0b1626"
    rounded: "{rounded.field}"
    padding: "{spacing.btn}"
  field:
    backgroundColor: "#0e1727"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "{spacing.field}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  chip-tron:
    rounded: "{rounded.pill}"
    typography: "{typography.chip}"
    height: "18px"
  chip-vuong:
    rounded: "{rounded.chip-square}"
    typography: "{typography.chip}"
    height: "18px"
---

# Design System: PISA Progress

> Bản ghi hệ giao diện **đang có** (nguồn: `web/src/index.css`, `web/src/ui/`), không phải thiết kế mới. Token gốc nằm trong
> `index.css` — khi lệch, `index.css` đúng. Đổi phông, bảng màu, bố cục phải qua kế hoạch PR + mockup duyệt (CLAUDE.md).

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

Nền xanh than tối, một màu nhấn xanh pastel, và một bộ màu trạng thái cố định.

- **Nền / bề mặt**: `bg` → `surface` (thẻ, panel) → `surface-2` (nút, ô phụ). Vạch kẻ `--line` mảnh, `--line-strong` khi cần rõ.
- **Nền tách lớp** (OV-15a, chủ SP 19/10): trang tối hơn (`bg`), thẻ / bảng sáng hơn một bậc (`surface`), viền rõ hơn (`--line` 0.18, `--line-strong` 0.32).
- **Nhấn** (`accent`, sáng `#1d5fbf`): nút chính, focus ô nhập, **đang chọn = viền khung 2 px quanh cả hàng** (`row-active`), không tô nền; thắng mọi nền.
- **5 nghĩa — dáng / ký hiệu mang nghĩa, màu chỉ phụ** (mockup OV-14 1 §1a):
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
- **Thang 12 / 13 / 14 / 16 / 20** (OV-15a, C09): đầu cột · chip · chữ phụ 12 — ô bảng · chữ phụ quan trọng 13 — chữ thường · nút · số điểm 14 —
  ô nhập ở 375 = 16 (Safari không tự phóng to) — tiêu đề trang 20. Thêm 17 (tiêu đề panel) và 28 (số lớn). Đầu cột **không in hoa**.
- Hàng nhóm 12.5 px đậm 800, hàng con 12 px.
- **Số căn giữa** + `tabular-nums` (`td.tabular-nums`, đầu cột số); tên / chữ dài căn trái (C06).
- Đối tượng trong khối **Cần làm** của panel v3 (tên PA, mức kỷ luật, loại meeting): **15 px đậm 700** (OV-12e, chủ SP 14/10).
- **Không chữ < 11 px** ở bất kỳ đâu.
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
- Hai họ chip, cùng cỡ chữ 11.5 px, cao 18 px: **chip tròn** (`CHIP_TRON`, bo tròn) cho số đếm / trạng thái; **chip vuông** (`CHIP_VUONG`, bo 0.375rem, có viền) cho mã (kỹ năng, tuần, điểm).
- Nút lọc nhanh dạng viên (rounded-full, cao 32 px).

## Components

- **Nút** `.btn`: nền `surface-2`, viền mảnh; hover đổi nền + viền nhấn. `.btn-primary` nền nhấn, chữ tối. `.btn-danger` chữ `bad`. `.btn-ghost` trong suốt. Tắt = mờ 45 %.
- **Ô nhập** `.field`: nền `--o-nhap-nen`, viền `--o-nhap-vien`, focus viền nhấn. Ô ngày luôn là `ONgay` (gõ được + nút lịch).
- **Ô sửa trong lưới điểm** `.o-sua`: viền xanh nhạt, focus vòng nhấn.
- **Hàng nhóm / con** (`.hang-lon`, `.hang-con`, `.khoi-nhom-*`): nhóm đậm có vạch trái 3 px màu nhấn, khi thu gọn vạch xám.
- **Chip trạng thái** (`Nhan`): màu theo bảng trạng thái, chữ luôn có nghĩa khi bỏ màu. Tone `late` = chữ cam + ⚠, không chip.
- **Chip SOS** (`ChipSos`, MỘT component mọi màn): "SOS 2 · R, W" / "SOS 3 tạm"; bấm chip = hộp "Vì sao SOS n" (tiêu đề → kết luận đậm → số → việc), không nút `?` cạnh.
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
- Không đổi phông, bảng màu, bố cục đã khoá khi kế hoạch PR không ghi rõ.
- Không dùng màu trạng thái để trang trí; không dùng màu nhấn cho thông tin thường.
- Không chữ < 11 px; không câu giải thích dưới nút/ô.
- Không hàng nút "Hôm nay · Hôm qua · 2 ngày trước" cho ô ngày.
- Không gradient, glassmorphism, đổ bóng lớn, minh hoạ trang trí.
