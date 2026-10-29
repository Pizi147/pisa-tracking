# NEN-V8 — token chung theo mockup v8 (chủ SP duyệt 29/10: "màu, shading, giữa background, nền và các thành phần")

Loại PR: **sửa nhỏ** — token / quy tắc chung, không đổi bố cục, không đổi thao tác. Kế hoạch: `docs/superpowers/plans/2026-10-29-v8-trien-khai.md` PR 0.

## Đo (getComputedStyle, mockup v8 tối 1440 + sáng 375 ↔ web, 4 màn)
Nền trang, nền khối, ô phụ, viền mảnh / rõ, thanh trên, nút chính / phụ, ô nhập, nền đầu bảng, ô bảng, chip, chữ chính / phụ / mờ: **trùng tuyệt đối (ΔE 0)** — mockup v8 dùng đúng hex của `index.css`. Bậc nền: tối bg → khối 1,17 : 1, khối → ô phụ 1,10 : 1; sáng bg → khối 1,09 : 1. Chỗ "shading" lệch nằm ở 3 quy tắc thành phần:

| # | Chỗ | Mockup v8 | Web TRƯỚC | Web SAU |
|---|---|---|---|---|
| 1 | vạch đáy đầu bảng `.th` (mọi bảng) | `--line` (mảnh) | `--line-strong` (ΔE 11 tối / 15 sáng) | `--line` |
| 2 | nền hộp menu ⋯ (`.menu-hop`, tối) | nền khối `--surface` | `--surface-2` (ΔE 5) | `--surface` (sáng vốn đã đúng) |
| 3 | bóng nổi menu / panel / hộp / toast / ô tìm (Tailwind `shadow-lg/xl/2xl`, ~30 chỗ) | `--bong-noi`: tối `0 8px 24px` đen 50 % + `0 1px 3px` đen 40 % · sáng xanh than 14 % / 10 % | mặc định Tailwind (đen 10–25 %) — gần như không thấy trên nền tối | `--bong-noi` qua `tailwind.config.js` `boxShadow` (một chỗ, mọi nơi dùng) |

Giữ (ΔE < 2, mắt không thấy): `--text-dim`, `--text-faint`. Không đổi màu nền / chữ nào → tương phản không đổi (nenGiaoDien, prOv15a đạt).

## Ảnh (trái TRƯỚC — cùng trang, gán lại lớp cũ; phải SAU)
`menu-1440-toi.png` (⋯ đầu hồ sơ lớp + bảng) · `panel-1440-toi.png` (panel + Case) · `menu-375-sang.png` · mockup tham chiếu `mockup-ho-so-lop-toi.png`.

## Thao tác TRƯỚC → SAU
Không đổi.

## Ngoài PR (báo PTA)
- DESIGN.md dòng 198 còn ghi chữ phụ "≥ 7:1" — phép kiểm đã hạ 4,5 : 1 từ NEN-V5; chữ mờ sáng hiện 4,97–5,01 : 1. Sửa DESIGN.md là việc planning.
- Lệch còn lại ở Hồ sơ lớp / Công việc là bố cục (thẻ lồng thẻ, khung trống) → PR màn V8-HSL, V8-CV.
