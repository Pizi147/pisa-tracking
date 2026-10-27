# MAU-MUC — 3 mức SOS dễ phân biệt (chủ SP 28/10)

Lời chủ SP: "3 level ở thanh điểm màu vẫn rất khó phân biệt, 2 mốc ở trang HV & Lớp cũng vẫn rất khó phân biệt".
Mockup: `thiet-ke/v7/mau-muc.html` (PTA Plan duyệt thay chủ SP 28/10). Đo: `python thiet-ke/v7/kiem-mau-muc.py` (exit 0).

## Chỗ hiện mức SOS · vì sao khó phân biệt (đã kiểm trên web, QL id 2)
| Chỗ | Hiện trạng TRƯỚC | Vì sao khó |
|---|---|---|
| Ô đếm hàng lớp "SOS [4][2][5]" (HV & Lớp, `OSosLop`) | SOS 1 rỗng viền 1 px · SOS 2 viền 2 px + nền `#35261a` | nền SOS 2 cách nền thẻ ΔL 0,05 → cả hai đều trông **rỗng**, chỉ khác 1 px viền = "2 mốc" |
| Chip "SOS n · W, S" (cột Hỗ trợ, Bảng SOS, panel, Case…, `ChipSos`) | như trên | như trên; sáng: nền `#f8ece1` gần trắng (ΔE deutan 0,08) |
| Chip "SOS n" Tổng quan · Lớp cần chú ý / Lớp tôi dạy | như trên | như trên |
| Làn Case biểu đồ D hồ sơ HV (`BieuDoD`) | SOS 2 và SOS 3 vẽ **cùng một kiểu** (`s2 = sos ≥ 2`) | 3 mức chỉ còn 2 dáng = "3 level ở thanh" |
| Chip tạm | SOS 2 / 3 tạm đều rỗng viền đứt | mất bậc nền, chỉ còn sắc viền cam / đỏ gần nhau |
| Rê chuột chip SOS | nền đổi sang `accent-soft` | SOS 3 chữ trắng gần như mất chữ ở giao diện sáng; SOS 2 mất nền |
| Ô ✓ / ✗, chip hạn (quá hạn ⚠ / hôm nay / còn lại) | đã có ký hiệu + chữ khác nhau | không đổi trong PR này |

## Trước → sau (một chỗ: `lopSos` + token `index.css`; làn Case `MAU_THANH_SOS`)
| Thành phần | TRƯỚC | SAU |
|---|---|---|
| SOS 1 | rỗng, viền vàng 1 px | giữ nguyên |
| SOS 2 | viền cam 2 px, nền gần như vô hình | **nền cam vừa** (tối `#5a320f` chữ `#f3c79c` · sáng `#f6d8b8` chữ `#7c4316`), viền 1 px |
| SOS 3 | nền đỏ đặc chữ trắng 700 (tối `#873c34`) | nền đỏ đặc chữ trắng **600** (tối `#a33d2d` để tách SOS 2; sáng giữ `#862e27`) |
| Tạm | rỗng viền đứt | giữ nền của mức + viền đứt (2 px, khe hở lộ nền thẻ) + chữ "tạm" như cũ |
| Làn Case biểu đồ | SOS 3 = SOS 2 | 3 dáng như chip |
| Rê chuột chip | đổi nền `accent-soft` | SOS 1 như cũ; SOS 2 / 3 `brightness-110` (giữ nền mức) |

## Đo (ngưỡng: chữ / nền chip ≥ 4,5 · mép / nền thẻ ≥ 3 · ΔL nền hai mức liền ≥ 0,10)
| Cặp | Tối TRƯỚC → SAU | Sáng TRƯỚC → SAU |
|---|---|---|
| SOS 1↔2 ΔL nền | **0,053** → 0,132 | **0,050** → 0,101 |
| SOS 2↔3 ΔL nền | 0,171 → 0,138 | 0,520 → 0,469 |
| SOS 1↔2 ΔE deutan · protan | 0,176 · 0,185 → 0,215 · 0,176 | **0,080 · 0,067** → 0,151 · 0,192 |
| Chữ / nền chip SOS 1 · 2 · 3 | 10,2 · 6,5 · 7,7 → 10,2 · 7,1 · 6,4 | 6,4 · 5,1 · 8,6 → 6,4 · 5,8 · 8,6 |

## Critique (impeccable, 2 agent) — luật 28/10
Vòng 1 mockup 28/40 (P1: SOS 2↔3 tối gần; tạm rỗng) → vòng 2 mockup 31/40, hết P0/P1 → vòng 3 web thật 31/40, không P0/P1.
P2 còn lại cho chủ SP xem ảnh: làn SOS 3 đỏ đặc là mảng đậm nhất biểu đồ tối (hạ `#8f362a` thì ΔL 2↔3 còn 0,095 → giữ); SOS 1 rỗng hơi giống chip lọc chưa chọn.

## Ảnh TRƯỚC | SAU
`1-hv-lop-1440.png` · `1-hv-lop-375.png` · `2-ho-so-hv-1440.png` · `2-ho-so-hv-375.png` · `3-tong-quan-1440.png` · `3-tong-quan-375.png` (1440 tối, 375 sáng)
· `4-ho-so-hv-sos3-sau-1440.png` (làn Case SOS 3) · `0-mockup-*.png`.

## Thao tác TRƯỚC → SAU
Không đổi: mọi chip SOS vẫn bấm mở hộp "Vì sao SOS n", ô đếm vẫn có chú thích / đọc màn, link, lọc, panel giữ nguyên. Chỉ đổi màu nền / viền / độ đậm chữ và hiệu ứng rê chuột.
