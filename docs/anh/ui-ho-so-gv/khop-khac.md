# UI-HO-SO-GV — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU

Khung: `thiet-ke/v5/dieu-chinh-cuoi.html` khu **e** (V5-D, mới nhất — thắng phần trùng của `ho-so-gv.html` phương án C) + `ho-so-gv.html` C (trạng thái tải / lỗi / rỗng, panel chỉ đọc, 375) · `ho-so-gv-truy-vet.md`.
Màn: `/giao-vien/:id` (`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx`). Seed nguyên, ngày demo 14/09/2026, ảnh `scripts/anh-cap.mjs`.

## Kế hoạch (loại PR: làm lại màn)

| Bước | Việc |
|---|---|
| 1 | Khung truy vết này + PR nháp |
| 2 | Máy chủ: `chiSoHoSoGv` thêm `theoLop` (lượt trong kỳ theo bài, Đạt kỳ vọng, Tiến bộ theo lớp em học lúc thi); hồ sơ: `laGvcn`, `gvcn` từng lớp, `coPa` từng Case; panel `ket-qua-lop:<lớp>` · `tien-bo-lop:<lớp>`; xoá `ketQuaHoSoGv` + đường `/ket-qua` (nợ #521) |
| 3 | Web: đầu gọn (tên · Vai · Kỹ năng · GVCN) + kỳ Từ tuần – Đến tuần (mặc định 4 tuần, P9) + "?" + dải 6 chỉ số (số → panel chỉ đọc) |
| 4 | Web: khối Lớp đang dạy (thẻ) + bảng Học thuật theo lớp (hàng Cộng) |
| 5 | Web: khối V4 giữ (Việc đang có, Case đang phụ trách, Yêu cầu đã gửi) theo luật V5; rỗng / lỗi / 375 |
| 6 | Ảnh cặp + bảng KHỚP / KHÁC (dưới) |
| 7 | `npm run check` · `/ponytail-review` · impeccable `audit` + `web-design-guidelines` |

## Truy vết khung → thành phần

(điền ở bước 6)

## Thao tác TRƯỚC → SAU

(điền ở bước 6)
