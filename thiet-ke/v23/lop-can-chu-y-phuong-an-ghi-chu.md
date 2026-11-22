# v23 · Lớp cần chú ý — 3 phương án (A · B · C)

Mockup: [`lop-can-chu-y-phuong-an.html`](lop-can-chu-y-phuong-an.html) · ảnh `anh/lop-can-chu-y-A|B|C-1440-toi.png`, `-375-sang.png`.
Lý do: chủ SP 22/11 xem ma trận "cũng chưa được… đổi tiếp" → PTA giao vẽ 3 cách, **cùng dữ liệu** (Admin Monbay, 8 việc / 5 lớp, hôm nay 23/11/2026), cùng khung Tổng quan Admin 1440 / 375. Ô "Cần xử lý" khớp dữ liệu (Điểm 25 bài · 4 lớp = 6 + 2 + 6 + 11; Báo cáo PH 2 lớp; Lịch thi 2 em; Hồ sơ 0).

| | Cách thể hiện | Bấm → mở | Ưu | Nhược |
|---|---|---|---|---|
| **A · Việc gấp nhất** | danh sách phẳng ≤ 6 hàng, mỗi hàng một việc: hạn (màu) · lớp · việc + số + chip kỹ năng · người phụ trách nhỏ (mỗi người một dòng); xếp theo hạn; "Xem hết ›" | hàng → panel việc; lớp → hồ sơ lớp; "Xem hết ›" → Công việc | trả lời thẳng "làm gì trước", không ô trống, đủ chỗ chip + người | mất góc "lớp nào tệ nhất"; gần trùng trang Công việc |
| **B · Thẻ lớp** | lưới 3 cột thẻ, mỗi thẻ: lớp · n việc + ≤ 3 dòng (chấm màu · loại · số · hạn dd/mm/yyyy); có quá hạn → viền trái đỏ | thẻ → panel lớp (đủ hạn, người, chip kỹ năng) | nhìn theo lớp, gọn, 375 thành một cột tự nhiên | dòng trong thẻ cắt ngắn (người + chip chỉ trong panel); 5 thẻ để trống 1 ô |
| **C · Ma trận gọn** | ma trận không viền ô, chấm màu + số, hàng 36 px, chiếm ~60 %; Tình hình đứng cạnh (4 số dọc) | ô → panel lớp + loại | thấp nhất, giữ so sánh lớp × loại, trang ngắn lại | vẫn là bảng số, cần chú giải chấm; nhiều ô trống; hạn / người chỉ trong panel |

- Theo 60-30-10 (màu chỉ ở hạn / chấm), luật hạn (dd/mm/yyyy — B cũng ghi đủ năm dù PTA gợi ý "hạn ngắn", vì luật hạn chủ SP "đổi hết thành ngày tháng năm"), chip kỹ năng (A; B / C trong panel).
- Sửa kèm: `tong-quan.html` ma trận Admin bỏ ô "MB FOU 12 × Hồ sơ" cho khớp ô "Hồ sơ thiếu ✓ không có" (trước lệch).
- PTA khuyến nghị (ghi khi chủ SP xem): ___

## Skill thiết kế đã chạy (chủ SP "sử dụng các skills thiết kế đi")

| Skill (gọi thật) | Gợi ý chính nhận được | Áp | Bỏ (lý do) |
|---|---|---|---|
| `ui-ux-pro-max` — tra `chart` "status table comparison categories", `product` "operations admin dashboard" | so sánh ≤ 15 hạng mục: xếp **giảm dần / gấp nhất trước**; bản dự phòng chính là **bảng dữ liệu**; không dựa màu một mình; kiểu dashboard "Drill-Down" | xếp lớp / việc gấp nhất lên đầu (A, B, C); bấm → panel chi tiết (drill-down); dấu hình + chữ ngoài màu | gợi ý "Heat Map / gradient lạnh → nóng" (trái 60-30-10, chỉ đỏ / vàng cho hạn); truy vấn `ux` "danh sách ưu tiên" **không có kết quả** — dùng mặc định |
| `impeccable` — `shape` (brief), `layout` + máy quét `detect` | brief: người xem = Admin vận hành, việc cần = biết lớp / việc nào trễ để nhắc người phụ trách; thành công = 1 cái nhìn thấy việc trễ nhất. Máy quét: **side-tab** (vạch trái 3 px) · chữ **11 px** dưới thang · cramped-padding · màu / phông ngoài DESIGN.md | B bỏ vạch trái đỏ → viền nhạt + chip "n quá hạn"; chữ 11 → 12 px (chip kỹ năng, tiêu đề ma trận 375) | side-tab còn lại là **đầu nhóm `.ds-dau`** (vạch trái nhấn = luật V18 / V21 đã duyệt) · "màu / phông ngoài DESIGN.md" = token v21 + Be Vietnam Pro / Inter đã khoá (CLAUDE.md) · cramped-padding ở thanh menu / đầu nhóm là dải liền mép có chủ ý |
| `impeccable` — `distill` / `quieter` | một mục tiêu chính; bớt viền, bớt hộp, màu chỉ là điểm nhấn 10 % | C bỏ viền ô / pill → chấm + số; B bỏ vạch màu; A không chip màu, chỉ chữ hạn tô màu | — |
| `dataviz` — chạy `validate_palette.js` với đỏ / vàng của dự án | **tối:** ΔE thường 11,9 (< 15) · **sáng:** ΔE mù đỏ-lục **1,4** → hai màu gần như không phân biệt; trạng thái phải kèm **dấu / chữ**, không chỉ màu; có chú giải | chấm **quá hạn = đặc**, **sắp đến = vòng rỗng** (khác hình); chú giải dưới khối B, C; A ghi ngày (chữ) | không đổi màu token (đã khoá) — giải bằng hình |
| `web-design-guidelines` (bản mới) | số cột so sánh dùng `tabular-nums`; nút có nhãn đọc màn; chấm trang trí `aria-hidden`; không lồng link trong nút; ngày qua `Intl.DateTimeFormat`; có trạng thái rỗng | `tabular-nums`; `aria-label` ô ma trận ("lớp · loại · số · quá hạn ngày"); `aria-hidden` cho chấm; A bỏ "bấm lớp → hồ sơ" trong hàng (hồ sơ mở từ panel) | ngày định dạng dd/mm/yyyy cố định trong mockup — PR code dùng `Intl` với vi-VN; trạng thái rỗng ("✓ Không lớp nào cần chú ý") ghi cho PR, chưa vẽ |

## Critique (impeccable, 10 nguyên tắc Nielsen, sau khi sửa)

| | Điểm | P0 / P1 | Ghi chú chính |
|---|---|---|---|
| A · Việc gấp nhất | **35 / 40** | không | đọc nhanh nhất, đủ người + chip; trừ: mất góc nhìn lớp |
| B · Thẻ lớp | **33 / 40** | không | gọn theo lớp; trừ: dòng cắt ngắn, ô trống cuối lưới |
| C · Ma trận gọn | **32 / 40** | không | thấp nhất; trừ: phải đọc chú giải, nhiều ô trống, hạn chỉ trong panel |
