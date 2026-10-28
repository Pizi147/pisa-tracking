# RA-UI-1 — khung panel 375 · Kế hoạch Test (375 + "+ MT") · vùng chạm 44 px

Loại PR: **sửa nhỏ** (không đổi bố cục màn, không thêm / bớt thao tác). Nguồn: `docs/superpowers/specs/2026-10-29-ra-soat-dem/ra-ui.md` mục 2 (a1, a2) + PTA Plan 29/10 (chân panel #672, rà #673).

## Ảnh
| Tệp | Nội dung |
|---|---|
| `chan-panel-375.png` | Mockup `v7/khai-bac-lo.html` #w375 + web TRƯỚC (ảnh #672) \| SAU — chân panel |
| `kht-375.png` | TRƯỚC \| mockup `v7/ke-hoach-test.html` 375 \| SAU — hàng công cụ Kế hoạch Test |
| `kht-them-mt-1440.png` | TRƯỚC \| SAU — "+ MT ▾" lớp ít cột MT (MB FT RF 12) |

## KHỚP / KHÁC
| # | Chỗ | Mockup | Web SAU | |
|---|---|---|---|---|
| 1 | Chân panel 375 (khung chung `KhungPanel`, mọi panel có chân thường) | dòng đếm trên, Huỷ \| Lưu cùng hàng, chia đều | dòng đếm / trạng thái lưu lên đầu chân, mọi nút chia đều một hàng | KHỚP |
| 2 | Hàng công cụ KHT 375 | `FT 4 · Lớp thường 9 · Lọc ▾ · ⓘ` một hàng | `✓ Fast Track 6 · Lớp thường 16 · Lọc ▾ · ⓘ` một hàng (bỏ chữ "lớp" sau số ở 375, giữ dáng công tắc — [XM] chủ SP còn chọn) | KHỚP (tên khung giữ "Fast Track") |
| 3 | ô tìm, Xuất ▾, Xếp nhiều MT… ở 375 | dòng sau | dòng sau; "51 học viên" giữ (đếm sẵn có) | KHỚP |
| 4 | "+ MT ▾" 1440 | ngay sau cột MT cuối | ngay sau cột MT cuối; khoảng dư dồn về cuối hàng | KHỚP |
| 5 | Vùng chạm ≥ 44 px ở 375 | — (DESIGN Layout) | ✕ Bỏ lọc lớp (HV & Lớp), "‹ Học viên & Lớp" (Lưu trữ), Sửa / Xoá / Đóng / Xoá (chi tiết vi phạm), Xác nhận / Đánh dấu đã làm / Bỏ ▾ (Phối hợp SOS) | — |

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Màn | TRƯỚC | SAU |
|---|---|---|
| Mọi panel có chân thường | Huỷ / Đóng · Xoá · trạng thái · phụ · chính | giữ đủ, chỉ đổi vị trí ở 375 |
| Kế hoạch Test | công tắc khung · Tuần · Cần xếp lại · chi nhánh (Lọc ▾ ở 375) · tìm · ⓘ · Xuất Excel / Xuất điểm Test (Xuất ▾ ở 375) · Xếp nhiều MT… · "+ MT ▾" (MT kế · S Ex) | giữ đủ |
| HV & Lớp, Lưu trữ, Ý thức, Phối hợp SOS | các nút nêu ở dòng 5 | giữ đủ, chỉ cao hơn ở 375 |

## Công cụ
- `scripts/mien-do.json`: thêm miễn `do-khung` cho dấu « · » đầu dòng 2 đầu panel — cố ý nằm ngoài vùng cắt (#641 XM-3), máy đo báo nhầm "chữ bị cắt" ở 7 kịch bản (panel-pa, cham-test-gv, cham-test-s, gv-diem-lop, cv-tvv-bao-ph, cv-tvv-sau-thi, panel-mot-em).
- `do-khung.mjs` toàn bộ (1440 / 375 × tối / sáng) trên bản này: ngoài dấu « · » trên, không có chữ cắt / nút tràn / trang trượt ngang. Các dòng "kịch bản không mở được" của lần chạy là do máy chủ dev tải lại khi chụp ảnh trước / sau, không phải lỗi màn.

## Để sau ([XM] / ngoài PR)
- Không đổi 3 điểm [XM] chủ SP còn chọn ở KHT: màu nút "Xếp nhiều MT…" tối, dáng `CongTacKhung`, nút Xoá của `HopKyNang`.
- Mockup 375 để "Xuất ▾ · Xếp nhiều MT…" sát trái, không có "51 học viên"; web giữ số đếm và canh phải — chưa đổi.
