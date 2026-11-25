# Công việc — nhiều tuần chỉ ghi tuần xa nhất + "+" (chủ SP 26/11)

Lời chủ SP: "ở bảng làm việc bên trái, nếu có 2 tuần trở lên thì chỉ cần ghi tuần xa nhất thêm dấu '+' … không phải liệt kê ra".

Ca thử: GV Phạm Thu Trang (vai demo 9) · Công việc › Chấm Speaking. Ảnh `cap-<bề rộng>-ds.png` (danh sách), `cap-<bề rộng>-panel.png` (mở lớp MB FT 101) — TRƯỚC (origin/main 171c8390b) | SAU; 1440 · 1280 tối, 375 sáng.

## Đã quét

Script quét mọi tab danh sách Công việc của Quản trị, QL, GVCN, GVBM, TVV (Của tôi + Của GV): chỉ một chỗ liệt kê nhiều tuần — dòng lớp Chấm Speaking
("W1 JUL, W4 JUL, W2 AUG, W1 SEP, W2 SEP, W3 SEP · 13 bài · 8 quá hạn", xuống hai dòng). Thẻ kỳ Case "Kỳ W4 SEP – W1 OCT" là một khoảng, không phải liệt kê → giữ.

## Đổi

| Chỗ | Trước | Sau |
|---|---|---|
| Dòng lớp Chấm Speaking (danh sách trái) | W1 JUL, W4 JUL, W2 AUG, W1 SEP, W2 SEP, W3 SEP · 13 bài · 8 quá hạn | **W1 JUL+** · 13 bài · 8 quá hạn (một dòng) |
| Đầu panel Chấm Speaking (cùng hàm) | MB FT 101 · W1 JUL, W4 JUL, … · 13 bài | MB FT 101 · W1 JUL+ · 13 bài |
| Một tuần | W1 SEP | W1 SEP (không "+") |

- "Tuần xa nhất" = tuần cũ nhất còn bài chờ (cũng là tuần của hạn sớm nhất ở cột hạn).
- Đủ danh sách tuần vẫn xem được: rê chuột lên ô thông tin của dòng (`title`). Bài từng tuần ở panel (mỗi em một dòng tuần).
- Hàm chung `tuanCuaLop` (`congViec/chamSpeakingChung.ts`) → `tuanGon`: danh sách và đầu panel cùng một nguồn.

Không đổi thao tác, không thêm request.
