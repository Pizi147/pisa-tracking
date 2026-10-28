# SUA-375-3 — [XM] g3 + hai lỗi do-khung có sẵn (PTA Plan 28/10)

| # | Chỗ | TRƯỚC (main 2afe00b2) | SAU | Nơi sửa |
|---|---|---|---|---|
| ⓪ | Bảng "Quá hạn chấm" (`gv-nhap-diem`) g3 cao hàng | 47–70 px (desktop) / thẻ 144–182 (375) | giữ nguyên; thêm dòng miễn g3 — PTA chọn (b): "T17: ô GV chấm / trạng thái xuống dòng, không cắt — hàng cao theo nội dung" | `scripts/mien-do.json` |
| ① | Hồ sơ HV 375 · Hành trình · khối Case — chip PA xuống dòng | `CHIP_VUONG` `leading-none` (cao dòng 12 = cỡ chữ) → mất 2 px chân chữ (g, y, ệ) | điện thoại cao dòng 16 | `ChuongLop.tsx` |
| ② | Trang đầu GV / GVBM · "Kỹ năng tôi dạy" — dòng phụ lớp «LT1 · MT1 · W3 SEP · tuần này» | cắt "…" không có cách xem đủ | vẫn cắt (thẻ nửa bề rộng), rê chuột xem đủ: `Bang` gắn `title` cho mọi dòng phụ dạng chữ (sửa một chỗ, mọi bảng dùng chung); `phuDay` trả chuỗi | `ui/Bang.tsx`, `LopToiDay.tsx` |
| ②b | Cùng thẻ · mã lớp dài «MB Pre FOU 03» (lỗi lộ ra khi đo `tong-quan-gv`) | ô bảng cắt mã, không title | link tự cắt "…" + `title`; mã ngắn ("MB FOU 22 ↗") hiện y như cũ | `LopToiDay.tsx` (`lopLink`) |

Ảnh TRƯỚC | SAU: `1-hanh-trinh-pa-375.png` · `2-gvbm-ky-nang-toi-day-1440.png` · `3-tong-quan-gv-1440.png`.

## do-khung (màn chạm)
nhap-diem (3 miễn), hv-hanh-trinh (14 → 0), gvbm (14 → 0), tong-quan / tong-quan-gv (16 → 0), gv-chuong, menu-tk, cv-gv, hv-* — xanh.

## Thao tác TRƯỚC → SAU
Không đổi: link mã lớp, chip PA, ô số, nút giữ nguyên vị trí, chữ, đích. Thêm tooltip (title) cho chữ bị cắt.
