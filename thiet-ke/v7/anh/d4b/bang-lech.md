# D4 bổ sung — bảng lệch mockup V5 | web (đo computed style, 1440, 27/10)

Đo: Playwright đọc `getComputedStyle` mọi phần tử có chữ trong `<main>` (web) / `#trang` (mockup), cùng màn, tối + sáng.
Token màu của mockup (`thiet-ke/v5/v5-nen.css`) và web (`web/src/index.css`) giờ cùng giá trị (D4: giảm độ rực cả hai).

| Vai trò | Mockup V5 | Web TRƯỚC | Web SAU (PR này) | Sửa ở |
|---|---|---|---|---|
| Tên mở hồ sơ (HV, lớp, GV) | màu chữ thường 600 + "↗", rê mới xanh + gạch (`.ten-ho-so`) | xanh link 600; lớp `.ten-ho-so` được dùng nhưng CHƯA định nghĩa | như mockup | `index.css` `.ten-ho-so` + 18 chỗ `link` → `ten-ho-so` |
| Chữ phụ bậc 2 (`slate-200`) tối | (không có bậc này; chu-2 #b7c2d8) | #d2dbec — sáng hơn mọi chữ phụ mockup | #c8d2e4 | token `--chu-2-rgb` |
| Chữ phụ `slate-300` / `text-dim` / `text-faint` tối | #b7c2d8 · #9aa8c2 | #bac6de · #bac6de · #9eacc8 | #b7c2d8 · #b7c2d8 · #9aa8c2 | token |
| Chữ phụ `slate-200/300` sáng | #4a536c · #5f6984 | #232a3f · #353d54 (gần đen, gắt) | #2c3348 · #4a536c | token |
| Tiêu đề khối (`Card`) | 17 / 700 chữ chính | 14 / 600 chữ phụ — khối và dòng cùng cỡ, không tầng | 17 / 700 chữ chính | `ui.tsx` `Card` |
| Độ đậm 800 | không dùng | 18 chỗ `font-extrabold` | 700 | `tailwind.config.js` `fontWeight` |
| Ô số (`OSo`) | xanh 700, gạch liền 1 px, offset 3 | giống | giữ (luật G6: ô số = mở tại chỗ) | — |
| Cỡ chữ, line-height, font-smoothing | 12/13/15 · 1,36–1,46 · antialiased | giống | giữ | — |
| Tỉ lệ chữ ≥ 600 | 39–72 % | 37–75 % | giữ (không lệch có hệ thống) | — |

Không sửa trong PR này (đã có PR / kế hoạch riêng):
- Lịch Test: thanh lớp xanh đặc `--cap-*` (D1 gỡ).
- HV & Lớp: cột Việc chữ xanh, thiếu hàng lớp (D2).
- Công việc: bố cục (D5b).
