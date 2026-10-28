# RA-UI-6 — nhóm màn Tổng quan · Công việc · Học viên & Lớp · Hồ sơ HV / lớp: lệch hình ảnh so mockup

Loại PR: **sửa nhỏ** (chữ, cỡ, màu link, ký hiệu; không đổi bố cục, không mất thao tác). Nguồn: critique 29/10 `docs/superpowers/specs/2026-10-29-ra-soat-dem/critique-a-tong-quan-cong-viec-hv.md` (điểm TRƯỚC 25–31/40; báo cáo nằm ở PR #682).

## Ảnh (Mockup | TRƯỚC | SAU)
`cong-viec-gv-1440-toi.png` · `ho-so-hv-1440-toi.png` · `tong-quan-tvv-375-sang.png` · `y-thuc-1440-toi.png`

## Sửa (số = mục trong báo cáo critique A)
| # | Chỗ | Trước | Sau |
|---|---|---|---|
| 3 | viên hạn `ChipHan` (Công việc mọi vai, đầu panel) | "Quá hạn 68 ngày", "Hạn 16/09" viết hoa đầu | "quá hạn 68 ngày", "hạn 16/09" chữ thường như mockup `v7/cong-viec-2` |
| 7 | dải chỉ số Tổng quan < 1024 (TVV 3 ô) | ô thứ 3 mồ côi nửa hàng | ô lẻ cuối chiếm cả hàng |
| 12 | Công việc ≥ 1024, chưa chọn việc | hộp 100 px trơ | khung cột phải cao (≤ 480 px), chữ giữa, dính khi cuộn — như mockup c1 |
| 17 | HV & Lớp 375 | "Xuất Excel · 70 HV" gãy 2 dòng | một dòng |
| 19 | hồ sơ HV — panel Case trong cột (`KhungPanel` `trongCot`) | tiêu đề 17 trong khối 15 (phân cấp ngược) | 15 |
| 20 | dải việc đầu hồ sơ HV | tên việc cắt "…tutor Li…" | tối đa 2 dòng |
| 25 | dòng mở tại chỗ ở Ý thức (vi phạm, GV chấm, Phối hợp — `MuiTenGap`) | "›" nét (dấu đổi trang — G6) | ▸ đặc, ▾ khi mở |
| 27 | "Vi phạm chưa xong" (tab Ý thức hồ sơ HV) | 14 / 700 | 15 / 700 (tầng nhóm) |
| 32 | tên GV (`TenGiaoVien` — GVCN đầu hồ sơ lớp, bảng GV) | xanh link 17 — link to nhất trang | `.ten-ho-so`: chữ thường, rê mới xanh + gạch |

## Thao tác TRƯỚC → SAU
Không đổi: mọi nút / link giữ nguyên chỗ và việc; tên GV vẫn là link hồ sơ GV.

## Đã thử, hoàn lại
- Mục 2 (thẻ bảng 375 nhãn trên / số dưới, `Bang.tsx`): làm thẻ "Lớp cần chú ý" lệch kiểu (ô điểm xếp chồng, ô SOS / Case vẫn nhãn | số) → hoàn lại; cần thiết kế lại cả thẻ (đề xuất).

## Không sửa đêm nay — chép vào Việc để sau
- 1 nút đoạn `BoLocDoan` 375 thành khối liền (trái OV-14b 17/10, mockup v7 mới hơn) — [XM] PTA quyết.
- 4, 5, 6 SOS ba kiểu vẽ / cột Lớp GV cắt chữ / SOS xếp 3 dòng (`LopToiDay` — độ rộng cột có phép kiểm TEN-CHI-SO / R1-EN-2) — PR riêng có đo EN.
- 10 [BỐ CỤC] "Chờ bạn duyệt" QL vào đầu cột trái · 11 hai "✓ Tất cả" · 14 [XM] QL mặc định "Của tôi".
- 15 HV & Lớp mở sẵn lớp đầu · 16 nút việc lặp tên em (chữ máy chủ) · 18 [BỐ CỤC] cột L · R · W · S.
- 21 nút "Sửa" / ⋯ Case 375 · 22 [XM] vạch đầu mục Case (M6 vs M5) · 23 màu ✓ vượt thẻ điểm · 24 tab 375 cắt chữ.
- 28, 29 Hồ sơ lớp 375 bảng tắt chế độ thẻ + kẻ hàng lệch cột dính (P1 — cần thử ô sửa tại chỗ) · 30, 31 [BỐ CỤC] đầu trang 380 px, hai hàng lọc · 33 Target "— · KCK" gãy.
