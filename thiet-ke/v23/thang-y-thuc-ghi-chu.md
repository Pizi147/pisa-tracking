# v23 ⑧ Thang Ý thức — ghi chú

Mockup: [`thang-y-thuc.html`](thang-y-thuc.html) · ảnh `anh/thang-y-thuc-*.png`. Đặc tả mục 3 "Thang Ý thức" · ý chủ SP 6.

## Truy vết

| Ý / mục | Khung | Thành phần web |
|---|---|---|
| Thanh bước ngang không xuống dòng: chấm + tên ngắn R1 · R2 · WL1 · R4+M · R5 · WL2 · R7 | Y1–Y4 | `ThangYThuc.tsx`: `<ol>` grid 7 ô bằng nhau (thay chip nối "→" + mask mờ) |
| Bậc đang ở nổi; đã qua ✓ | Y1 | `trangThai` `qua` / `khai` / `lan-nay` (giữ dữ liệu `dongThang`) |
| Tên đầy đủ khi rê / ⓘ | Y1 (title), Y2c (ⓘ mở) | `title` + `NutLuat` |
| Hộp thang + khối Phối hợp SOS hồ sơ HV | Y1, Y2 | `StudentYThucSection.tsx`, hộp thang; Phối hợp SOS dùng cùng thanh bước 3 ô |
| Không bị cắt (ý 7) | Y2c | hộp ⓘ neo dưới nút, trong khung |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Xác nhận xử lý · Đề xuất QL duyệt | giữ, cùng cỡ |
| Xác nhận cấp bậc vi phạm / Sửa cấp bậc | giữ (link đầu khối) |
| Phối hợp SOS: Xác nhận · Xem · + Thêm việc · Học thuật › | giữ |
| Thang dài sau WL 2 gộp "…" | giữ (Y4) |
| 375: bậc đã qua thu thành ✓ | bỏ thu — 7 ô vẫn đủ chỗ ở 375 |

## Tự rà

- Một hàng ở 1440, hộp 560, 375: đạt. Đang ở nổi, đã qua ✓, kế tiếp viền đứt: đạt. Tên đầy đủ: đạt.
- Trạng thái: chưa xử lý · khai trước · sau WL 2 · đề xuất chờ (Y4, tối + sáng) · chỉ xem (Y2b).

## [XM]

- [XM-9] "Bậc đang ở" hiểu = bậc đã xử lý gần nhất (R2); bậc kế (`lan-nay`) viền đứt nhấn "kế tiếp". Nếu chủ SP muốn nổi bậc kế thay vì bậc hiện tại thì đổi lớp CSS, không đổi dữ liệu.
- [XM-10] Phối hợp SOS dùng lại thanh bước (3 ô) thay ô ①②③ rời của mockup PHOI-HOP-SOS-V2 — đổi dáng ngoài phạm vi đặc tả (nhất quán "tiến trình"); bỏ được nếu chủ SP muốn giữ ①②③.

Critique: **36 / 40**, không P0 / P1.
