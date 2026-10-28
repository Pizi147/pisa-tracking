# SUA-DO-KHUNG — đo toàn bộ màn (PTA Plan 28/10)

`node scripts/do-khung.mjs` (gồm do-bang; 1440 / 1280 / 375, tối + sáng; thanh, ngon-ngu, hd-chi, lich) trên main ec96f40d:
**75 lỗi → 58 lỗi**; 58 còn lại đều thuộc hai nhóm "để sau" bên dưới.

## Đã sửa
| Lỗi | Nguyên nhân | Sửa | Tệp |
|---|---|---|---|
| gv-ho-so-thi 1440 / 1280 g1 "Kỹ năng 2.1" | chip kỹ năng canh giữa trong ô tối thiểu 24 px → chữ lùi ~8 px, ô chỉ bù 6 px | bù 8 px | `HoSoGiaoVienPage.tsx` |
| gv-bang-diem-thuong g3 (59 / 182) | cùng bảng "Quá hạn chấm" #650: Đợt lớp thường «Progress Test · W3 AUG» xuống dòng theo CA3-11 | mở rộng dòng miễn g3 SUA-375-3 sang `gv-bang-diem-thuong` (PTA đã chọn miễn cho bảng này) | `mien-do.json` |
| lich (8 kịch bản dừng) | công cụ cũ: bộ chọn thời gian không còn hộp "Khoảng thời gian" (UI-PHAN-TICH vòng 2); `/tutor` đã chuyển về trang chủ (Tutor hoãn) | kịch bản chờ ô tuần hiện thẳng; bỏ 2 kịch bản `/tutor` | `do-khung.mjs` |
| ngon-ngu (E-NHO bước 4) | công cụ cũ: nút VI \| EN đã vào menu Tài khoản (OV-15a) | mở menu Tài khoản trước khi bấm VI | `do-khung.mjs` |
| 3 dòng miễn thừa | lỗi đã hết | gỡ: M6 phan-tich g1–5 · M2 gvbm cuộn lồng · M2 cv-van-hanh-375 «Mọi người» | `mien-do.json` |

Ảnh TRƯỚC | SAU: `1-ho-so-gv-theo-ky-nang-1440.png` (phóng 2×). Các sửa còn lại là công cụ đo / danh sách miễn — không đổi giao diện.

## Để sau (chạm tệp nhánh đang chờ hoặc cần quyết định)
1. **cv-cho-duyet 375** (19 dòng × tối / sáng = 38 lỗi): thẻ Chờ duyệt cắt "…" tên việc và câu đề xuất (`B.block truncate`, ví dụ «Không cần theo dõi · Reading · Vũ Ngọc Lan · MB FT 101»). Tệp `web/src/modules/duyet/TheYeuCau.tsx` thuộc nhánh **panel-6c2** → sửa sau khi nhánh đó merge (cách sửa đề xuất: điện thoại cho xuống dòng như #647 `OViec` / #649 `DauHoSo`).
2. **hd-chi** (20 lỗi): "Chỉ cho tôi" của hướng dẫn trỏ tới phần tử không thấy / đang trống —
   v7 (GV) `vi-pham`, `cong-viec›tq-lop` (`tq-lop-toi-day` không còn ở `/cong-viec`): "phần tử ngoài màn";
   v1 (Quản trị) `tong-quan›ql-tq-can-xu-ly`, `ql-tq-so-lieu`, v1 + v2 `cong-viec›tq-lop`: khoanh vào khối "Chưa có việc".
   Nguồn: `shared/huongDan/gv.ts` (thuộc nhánh **hsl-lt**) + `shared/huongDan/ql.ts` — cần chọn lại đích / đường của từng bước hướng dẫn (nội dung, không phải lỗi khung) → để sau nhánh hsl-lt merge.

## Thao tác TRƯỚC → SAU
Không đổi.
