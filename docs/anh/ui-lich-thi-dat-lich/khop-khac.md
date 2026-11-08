# UI-LICH-THI-DAT-LICH (B7 · HL3) — khớp / khác

Mockup: `thiet-ke/2026-11-08-audit-ui-mockup.html#b7` (chủ SP duyệt 08/11, phương án A + "bấm thanh vẫn mở rộng thông tin HV như nay").

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết luận |
|---|---|---|---|
| Nút "Đặt lịch ▾" (`.nut.nut-nho` cao 30, 13 / 600) hiện ở dòng đang rê | `HangLichThi.tsx` `CotViec` + `index.css .lt-dat` | b7-1440-*, b7-1440-toi-menu-mo | KHỚP. Áp cho mọi dòng không có nút chính mà có ≥ 2 việc phụ (Chưa có lịch: Đặt tháng · Chốt ngày; Dự kiến / Chưa chốt (LT): Chốt ngày · Dời tháng) |
| Menu "Đặt tháng dự kiến · Chốt ngày thi" | `MenuDong` (portal) | b7-1440-toi-menu-mo | KHỚP. Dùng `MenuDong` (vẽ ra ngoài bảng) để dòng cuối thẻ không bị cắt |
| Vị trí nút: bên phải dòng | cột "Việc tiếp", nay dồn mép phải | b7-1440-* | KHỚP — chủ SP 08/11: thứ tự cột Học viên · MT gần nhất · Target (thông tin em sát tên, Target cột giãn) · Lịch thi · Việc tiếp ("Đặt lịch ▾") · Ghi chú · ⌄ dồn mép phải; dải mở giữ đủ thông tin chi tiết; 375 giữ thẻ |
| Dòng đang rê nền nhấn | `tr.lt-h:hover` (có sẵn) | b7-1440-toi-menu-mo | KHỚP |
| 375: nút luôn hiện ở hàng tên | thẻ `.lt-the-1` (tên · Đặt lịch ▾ · ⌄) | b7-375-* | KHỚP; GIỮ ⌄ và "+ Ghi chú" (mockup không vẽ) |
| Hai link "Đặt tháng · Chốt ngày" luôn hiện | — | — | BỎ (gộp vào menu) |
| Bấm dòng → dải thông tin HV | `GocLichThi.tsx` `bamDong` | — (thử tay) | THÊM theo lời chủ SP 08/11: bấm thanh / thẻ mở dải; bấm link, nút, ô, menu không mở |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Link "Đặt tháng" / "Chốt ngày" (luôn hiện) → hộp dưới dòng | "Đặt lịch ▾" → "Đặt tháng dự kiến" / "Chốt ngày thi" → cùng hộp |
| "Chốt ngày" · "Dời tháng" (Dự kiến) | "Đặt lịch ▾" → "Chốt ngày thi" / "Dời tháng" |
| Nút chính (Chốt ngày FT đã tới tháng, Ghi KQ, Bước tiếp) + link phụ | Như cũ |
| ⌄ mở dải | Như cũ + bấm chỗ trống của dòng / thẻ cũng mở |
| Bàn phím: Tab tới link | Tab tới "Đặt lịch ▾" (nút hiện khi focus), Enter mở menu, ↑↓ chọn, Esc đóng; ⌄ vẫn Enter mở dải |
| Đang lưu / lỗi + Thử lại / ✓ Đã lưu · Hoàn tác | Như cũ |

## Dòng đọc Turso

Không đổi API, không thêm request (menu + mở dải dùng dữ liệu đã nạp): 0 → 0.
