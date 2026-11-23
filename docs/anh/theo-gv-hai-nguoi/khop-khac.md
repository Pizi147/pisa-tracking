# Theo GV — 2 GV nhiều tuần nhất mỗi kỹ năng (chủ SP 24/11)

Ảnh cả màn Phân tích › Thi thật: `theo-gv-{1440 tối,375 sáng}-{gap,mo}.png`. Bản demo chưa có KQ thi thật nên ảnh chụp bằng dữ liệu GV GIẢ chèn ở trình duyệt (chỉ để chụp, không có trong code).

- Mỗi kỹ năng hiện 2 GV có tổng tuần dạy (`tuan`) nhiều nhất, bằng nhau theo thứ tự hiện có. Bảng vẫn xếp theo GV × kỹ năng; dòng (GV, kỹ năng) ngoài 2 người đầu của kỹ năng đó gập sau "+ n GV" (n = số GV có dòng bị gập). Bấm mở tại chỗ, "Thu gọn" để gập. Không ngưỡng, số liệu không đổi; "n GV" ở đầu thẻ vẫn là tổng GV.
- 375 (thẻ theo GV) cùng luật, thay "3 GV đầu + Xem n GV còn lại".
- Hộp Tuần dạy (`TuanDayGv.tsx`): danh sách GV mỗi kỹ năng 2 người + "+ n GV" / "Thu gọn"; % vẫn tính trên toàn bộ GV.
- Luật cột: bảng Theo GV đã chia cân (Giáo viên / Kỹ năng / HV / Điểm TB cố định, ba cột mức chia đều, vừa khung). Hồ sơ GV không dùng bảng này (không có nơi dùng chung khác).
