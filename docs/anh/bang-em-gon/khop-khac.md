# BANG-EM-GON — khớp / khác mockup `thiet-ke/v10/panel-thong-tin.html` `#be`

Chỉnh của chủ SP / PTA thắng mockup (plan.md mục 4 "30/10 (tối)" + "PTA duyệt" Q1): điểm kỹ năng **✓ / ✗ trước số** (không ▼); kỹ năng đạt **✓ cùng màu Overall đạt** (`text-kq-bang`), hụt **✗ + `text-kq-duoi` đậm 700**; TVV **11 px** (mockup 12, ngoại lệ G13 đã ghi `DESIGN.md`).
Ảnh cặp (trái mockup, phải web): `be-1440-gvcn.png` (GVCN 7) · `be-1440-ql.png` (QL 2) · `be-1440-tvv.png` (TVV 23, lớp 10 — cột Phụ huynh) · `be-375-gvcn.png` (375 sáng).
Cách chụp: `KHUNG_BASE=http://localhost:5611 node scripts/anh-cap.mjs thiet-ke/v10/panel-thong-tin.html "#be figure >> nth=0" hoc-vien/lop/3 7 1440 docs/anh/bang-em-gon/be-1440-gvcn.png` (375: `nth=1`, bề rộng 375).

## Bảng truy vết khung → thành phần → ảnh

| Khung / thành phần mockup | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| `#be` 0 · cột Học viên · Target · MT · L R W S · Overall · Kết quả · Ngày thi · Case + PA · ⋯ | `BangHoSoLop` `cotCua` (bề rộng theo tỉ lệ mockup) | `be-1440-*` | KHỚP. KHÁC nhỏ: tên 240 (mockup 300) để tổng bề rộng giữ như cũ — 1280 không tràn (`do-khung` lop-ft 1280 xanh); S 80 cho "vắng W1 SEP" |
| ô điểm `.dg-o` 15 px / 500, hụt 700 đỏ | `ODiem kieu="gon" chiToHut` (kiểu mới `gon`) | `be-1440-*` | KHỚP cỡ / độ đậm. KHÁC theo chỉnh chủ SP: ✗ thay ▼; đạt có ✓ màu Overall đạt |
| Overall "✓ 6.0" / "✗ 5.5" | cùng `ODiem gon chiToHut` | `be-1440-*` | KHỚP |
| dòng phụ W1 · W2 / "vắng …" | `phuCua` (GIỮ) | `be-1440-*` | KHỚP |
| Kết quả: chip SOS nhỏ không "· R, W" (`.cs.nho` cao 20, đệm 6) | `ChipSos hienKyNang={false} nho` (prop mới `nho`) | `be-1440-*` | KHỚP; bấm chip vẫn mở hộp Vì sao SOS (đếm kỹ năng) |
| "✓ Đạt" · "– Chưa đủ dữ liệu" chữ 13 px | `OKetQua` chữ `text-dim` / `text-faint` (bỏ `NhanKq` viền) | `be-1440-*` | KHỚP; lý do "chưa đủ" giữ ở tooltip + sr-only (Đ4) |
| Ngày thi "Thi **17/11**" · "Dự kiến **02/2027**" | `OLichThi` chữ 13 px (bỏ chip `NhanLich`); "Đã thi" chữ | `be-1440-*` | KHỚP |
| TVV dưới tên, chip việc cùng hàng | `.tvv` 11 px `text-faint` + `nhanPhu` (mới vào · Thiếu · Ý thức) cùng hàng | `be-1440-*` | KHỚP (11 px theo chủ SP) |
| "mới vào W1 OCT" chữ 12 px mờ | `nhanPhu`: `mới vào {tuần hôm nay}` (bỏ chip `MoiVao` ở bảng này) | `be-1440-gvcn` (Phạm Khánh Linh) | KHỚP |
| `#be` 1 · thẻ 375: tên + TVV · chip SOS nhỏ · ⋯ | `theEm` đầu thẻ | `be-375-gvcn` | KHỚP |
| `#be` 1 · thẻ 375: dòng điểm `DongDiem` (lượt · 4 kỹ năng · Overall) | **GIỮ** lưới 5 ô L R W S Overall (v8 `.the-em`, chủ SP duyệt 29/10) với ô `gon chiToHut` | `be-375-gvcn` | **KHÁC [XM-BE-1]**: `DongDiem` không có W1 · W2, "vắng …" và không bấm được W / S → điểm thành phần (thao tác cũ phải GIỮ). Ký hiệu ✓ / ✗ / màu đã theo luật mới |
| `#be` 1 · chân thẻ Target · ngày thi · Case + PA | chân thẻ GIỮ (Target · MT · ngày thi · Phụ huynh · Case + PA) | `be-375-gvcn` | KHỚP (thêm MT link lượt — GIỮ) |
| khung "1440 · TRƯỚC" | — | — | BỎ (chỉ để so) |
| Cách xem · lọc Tất cả / SOS / Chưa đủ · "Lượt của từng HV" · Chọn nhiều · MT link lượt · Case + PA mở dưới hàng · ⋯ · Nhập điểm / + Case đầu trang | như nay | `be-1440-*` | GIỮ |
| ô "Không đủ bộ môn" (P8, ngoài mockup) | `NhanKq thieu` | — | GIỮ |

Tỉ lệ KHỚP: 14 / 15 dòng thành phần (≈ 93 %, ≥ 90 %); khác duy nhất là dòng điểm thẻ 375 [XM-BE-1] (giữ thao tác).

## Thao tác TRƯỚC → SAU — Bảng em hồ sơ lớp

| Thao tác | Trước | Sau |
|---|---|---|
| Lọc Tất cả · SOS · Chưa đủ dữ liệu | có | GIỮ (bấm thử GVCN / QL / CX: SOS 11) |
| Chọn nhiều (QL) | có | GIỮ (chỉ QL thấy) |
| Bấm chip SOS → hộp Vì sao SOS | có | GIỮ (chip nhỏ, hộp vẫn liệt kê kỹ năng) |
| Bấm W / S → điểm thành phần (popover) | có | GIỮ (1440 + 375) |
| MT → hồ sơ lượt | có | GIỮ |
| Case + PA → mở Case dưới hàng · Ghi KQ PA · Sửa · Lịch sử | có | GIỮ |
| ⋯ từng dòng (4 mục MENU-DONG) | có | GIỮ (GVCN, QL, TVV, CX) |
| Cột Phụ huynh (TVV / CX) | có | GIỮ |
| Tên → hồ sơ HV (Trước / Sau theo bảng) | có | GIỮ |
| Xem TVV của em | không có trên bảng | MỚI: chữ nhỏ dưới tên (mọi vai; em chưa có TVV không ghi gì) |

Không mất thao tác nào.

## Kiểm

- `do-khung.mjs lop-ft` + `lop-thuong` (gồm `do-bang`) 1440 / 1280 / 375 tối + sáng: **Không lỗi** (ngoài miễn sẵn có).
- Bấm thử (Playwright) GVCN 7, QL 2, CX 24 lớp 3 · TVV 23 lớp 10, 1440 + 375: lọc SOS, hộp SOS, Case dưới hàng, popover W, ⋯ 4 mục, Chọn nhiều — đạt, không lỗi trang.
- Turso: 0 câu thêm (TVV đã có trong `classRoster`, `tvv_ten` đọc cùng câu).
