# Mockup AUDIT-UI nhóm B — ghi chú (08/11)

Tệp: `thiet-ke/2026-11-08-audit-ui-mockup.html`. Ảnh TRƯỚC: `truoc/` (web main, seed 14/09/2026, cả sáng và tối, 1440 + 375). Nguồn phát hiện: `docs/superpowers/specs/2026-11-08-audit-ui/bao-cao.md` mục 6.2.

Mở bằng một máy chủ tĩnh ở thư mục `thiet-ke/`. Nút **"Đảo sáng / tối"** đảo cả khung vẽ lẫn ảnh TRƯỚC. Mặc định khung 1440 tối, khung 375 sáng.

## Tự rà theo yêu cầu (PTA 08/11 + chủ SP)

| Yêu cầu | Đạt? |
|---|---|
| Gom toàn bộ nhóm B vào MỘT mockup | Đạt — 14 khu B1–B14, bảng truy vết cuối tệp |
| Mỗi đề xuất có TRƯỚC (web hiện tại) \| SAU | Đạt — ảnh TRƯỚC chụp từ web thật, SAU vẽ bằng token web (CSS `audit-0311` đã duyệt) |
| Một dòng lý do + đánh dấu đụng luật nào | Đạt — dòng "Lý do", chip đỏ "Đụng: …", dòng "Giữ / Bỏ" |
| Câu hỏi chọn rõ ràng A / B | Đạt — dòng "Chủ SP chọn" ở mỗi khu, khuyến nghị đứng đầu |
| Đủ 1440 + 375, sáng và tối | Đạt — B3, B6, B10, B12 chỉ cần 1440 (màn rộng / báo cáo); B14 chỉ cần 375 (lỗi chỉ xảy ra ở 375) |
| Giữ thao tác cũ (V1) | Đạt — dòng "Giữ" ở mỗi khu; không khu nào bỏ thao tác. B7 gộp hai link thành một menu, cả hai thao tác vẫn còn |
| Không đổi luật nghiệp vụ | Đạt — chỉ đụng luật giao diện (V10, V13, V18, G8, G13, M10, S11 phần hiển thị) |
| Không đề xuất lại U02 | Đạt — khung phải trống ở Công việc giữ nguyên trong B4 |
| Dòng đọc Turso | Không khu nào thêm đọc. B6: link cũ chuyển hướng. B13: danh sách đã nạp một lần — kiểm lại khi làm |

## Critique (cổng chất lượng)

- Tự chấm (single-context, chưa chạy agent riêng) sau 2 vòng sửa: **34 / 40**.
- Vòng 1 sửa: thiếu `ro.css` và `.loc-1` nên tiêu đề gãy; ô số rỗng bị căn giữa (trùng tên lớp `.rong`).
- Vòng 2 sửa: dấu ⚠ thừa trước điểm ✗; dòng việc B4 bị dồn một hàng; B13 thiếu khung 375; ảnh chưa có `src` mặc định.
- Bộ dò impeccable trên tệp còn 65 mục, đều là báo nhầm: nền xám và phông của phần đọc mockup; viền đứt vàng đánh dấu chỗ đổi; vạch trái 3 px của dải nhóm (V18); cỡ 14 px và chữ số Inter (đều trong thang).
- Không còn P0 / P1. Theo cổng 28/10: đã chạm 30, đã đủ 2 vòng, nên chỉ cần không còn P0 / P1.

## Câu hỏi mở (ngoài A / B)

- **B1:** chip "Không cần theo dõi" ở cột hẹp — dùng nhãn ngắn "Không theo dõi" (tên đủ khi rê), hay để cột rộng 150 px?
- **B9:** "TVV" ở đầu hồ sơ lớp hiện lấy từ đâu? Seed ghi "Phan Mai" trong khi 25 / 33 em có TVV "Lê Thu".
