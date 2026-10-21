# PR NEN-TYPO-MAU — thang chữ · 3 token kết quả · hệ trạng thái HTT · sân mẫu

Nguồn: `docs/superpowers/specs/2026-10-20-ke-hoach-overhaul/07-pr-plan.md` mục 6 dòng NEN-TYPO-MAU · `04-design-system.md`
mục 2 (chữ), 4–5 (màu, điểm), 12 (HTT), 18 (sân mẫu), 19 (phép kiểm 4, 7–8, 10, 12–15). Model: Opus 5.5.
Ngoài phạm vi (PTA chuyển sang KHUNG-LOI): thứ tự menu, thanh trên < 1440, thanh dưới 375 — KHÔNG chạm điều hướng,
bố cục `Header.tsx`, thanh dưới. `Bang` / `ODiem` = PR BANG-0.

## Giả định (ghi vào "Cần chủ SP xác nhận")
1. Thang chữ áp **toàn web một lần** ở lớp nền (body, `.td`, `.th`, `.btn-sm`, `.label`, chip, hàng nhóm) + đổi cơ học mọi cỡ
   ngoài thang lên bậc gần nhất (11 / 11,5 → 12 · 12,5 → 13 · 13,5 → 14 · 16 → 15 · 20 → 22). Trang dài thêm vài %: bù ở
   BANG-1 / PR màn (04 mục 2.2). Lưới điểm 14 px làm ở BANG-1 (đổi lưới sang `Bang`).
2. `text-xs` (12 px, ~1 000 chỗ) giữ — 12 là bậc của thang; nâng chữ dữ liệu lên 13 làm theo từng màn (phép đo DOM của CONG-CU).
3. Hover: `.row-hover` (hàng không bấm được) → nghĩa "dò hàng" 3,5 %; hàng / nút bấm được dùng `.bam` (phủ 8 / 9 %).
   Gỡ hẳn dò hàng ở bảng nhỏ không bấm được = BANG-1 (khi bảng vào `Bang`).
4. "Đang chọn" mới (nền nhấn nhạt + vạch trái 3 px) thay `.row-active` ngay trong CSS → mọi chỗ đang dùng đổi theo.
5. Sân mẫu mở cho dev **và** tài khoản admin ở bản dựng thật (route lazy, chỉ admin).

## Task 1 — Token màu (index.css + tailwind.config.js)
- `--kq-vuot-rgb / --kq-bang-rgb / --kq-duoi-rgb` hai chế độ (04 mục 5.1: tối #86efac #a5b4fc #ff8282 · sáng #166534
  #1e40af #c81e1e); Tailwind `kq-vuot`, `kq-bang`, `kq-duoi`.
- `--phu-re` (tối trắng 8 %, sáng mực 9 %), `--phu-do` 3,5 %; sáng `--ok-rgb` → `22 101 52`.
- Vạch trái hàng nhóm trung tính (`--hang-lon-vach`) — 04 mục 6.3.

## Task 2 — Thang chữ
- `tailwind.config.js`: `theme.fontSize` (thay, không extend) chỉ `xs` 12/1.4 · `sm` 14/1.45 · `base` 15/1.5 · `lg` 17/1.35 ·
  `xl` 22/1.3 · `2xl` 28/1.1 → lớp ngoài thang không sinh được.
- `index.css`: body 15 · `.btn-sm` 13 · `.label` 13 / 600 · `.th` 13 · `.td` 15 · `.hang-lon` / `.khoi-nhom-dau` 15 / 700 cao 40 ·
  `.hang-con`, `.khoi-nhom-con`, `.muc-con th` 13 · `.nut-loc` 13.
- Chip `CHIP_TRON` / `CHIP_VUONG` 13 / 600 cao 24; `CHIP_SOS` 13 cao 24 (04 mục 10).
- Đổi cơ học cỡ ngoài thang (giả định 1) trong `web/src/**` + `style={{ fontSize }}`.
- Bỏ `uppercase` (+ `tracking-*` đi kèm) ở chữ tiếng Việt; giữ ô nhập mã (`CatalogAdmin`), `first-letter:uppercase`.
- Bỏ `leading-tight` / `leading-snug` cạnh `truncate` (2 chỗ).
- Phép kiểm `prNenTypoMau.tests.ts`: K-CHU-1 cỡ `text-[Npx]` / `font-size` / `fontSize` ∈ thang; K-CHU-2 `fontSize` của
  Tailwind ∈ thang, lớp `text-3xl…` không dùng; K-CHU-3 không `uppercase` ngoài danh sách miễn; K-CHU-4 không
  `leading-none|tight|snug` cùng `truncate`. Sửa phép kiểm chuỗi cũ khẳng định cỡ cũ (prHk2 C1/C8, prSang S8, prS4f…).

## Task 3 — Màu điểm
- `DauKetQua` ký hiệu 14 px, màu `text-kq-*`; `MuiTenKyVong` theo `kq`; `ODiemLon` số tô `kq` (một hàm `lopKq(kq)` ở `BieuTuong`).
- Phép kiểm: K-MAU-1 kq + `text` + `text-dim` ≥ 4,5 : 1 trên 9 nền (trang, thẻ, surface-2, nút rê, hàng nhóm, hàng con, hàng đã
  thi, cột nổi bật = accent-soft trên thẻ, hàng rê = phu-re trên thẻ), cả hai chế độ; K-MAU-2 deutan ΔE76(vượt, dưới) ≥ 10 hai
  chế độ (Machado 2009, mức 1.0); K-MAU-3 thành phần điểm không dùng `text-ok|bad|doing|rose|emerald`.

## Task 4 — Hệ trạng thái HTT
- CSS: `.bam` (HTT-1: phủ `background-image` lên chính phần tử / từng `td`, `cursor: pointer`, `:active` cùng phủ) · `.do-hang`
  (HTT-2, 3,5 %) · `.dang-mo` (HTT-6: nền `--accent-soft` + vạch trái 3 px `--accent-strong`; hàng đã thi giữ nền, vạch đổi màu).
  `.row-active` = `.dang-mo`; `.row-hover` = `.do-hang` (bí danh tới BANG-1).
- `hover:bg-white/5|10` (23 chỗ, đều bấm được) → `bam`; hàng `row-hover` có `onClick` (6 chỗ) → `bam`.
- HTT-10 một cách báo lưu: "Đã lưu" / dấu lưu ô **xám** — `LuoiFT` (2), `GhiNhanh`, `DanExcel`.
- Phép kiểm: K-HTT-1 không còn `hover:bg-white`; K-HTT-2 `.dang-mo`/`.row-active` có vạch trái 3 px + nền nhấn, không viền
  2 px; K-HTT-3 "Đã lưu" không đi cùng `text-ok` / `text-emerald`.

## Task 5 — Sân mẫu `/dev/thanh-phan`
- Đầu trang thêm 4 khối: (1) thang chữ 7 bậc + vai + chuỗi kiểm "Nguyễn Thị Phương Thảo · Đỗ Vũ Tuấn Phong · ỖNG ẶC ỮA ẪN ỄNH ·
  khuỷu, nghiễm, chuyện, quyết · 6.5 7.0 · W2 OCT · 18/09"; (2) 3 token kết quả + bảng tương phản đo thật trên 9 nền
  (`getComputedStyle` + `tuongPhan`); (3) HTT: hàng bấm được / không / đang chọn / đang chọn + đã thi / focus / tắt;
  (4) báo lưu: đang lưu · đã lưu · lỗi · "✓ Đã lưu 14:32 · Hoàn tác".
- Route: dev hoặc vai admin. Bấm thử 1440 tối + 375 sáng; ảnh `docs/anh/pr-nen-typo-mau/`.

## Xong
- [x] Task 1 · [x] Task 2 · [x] Task 3 · [x] Task 4 · [x] Task 5 · `npm run check` · audit · ponytail-review · PR (không merge).
