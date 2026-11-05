# THI-THAT — so số thi thật theo GV: luật C10 (trước) → luật 2F (sau), bản sao 29/10

Nguồn: `pisa-pisatracking-261028-pizi147-2026-10-29-2255.sqlite` (chép vào scratchpad, migrate cục bộ cho có cột `thi_that_lay_lai`), **chỉ đọc**.
Lệnh: `PISA_DB=<bản sao> node docs/anh/thi-that/so-sanh.mjs <thư mục repo>` (sau `npm run build:server`). Khoảng: toàn bộ.

- Kết quả thi thật đủ 4 kỹ năng: **20** (10/10 – 25/10), KCK 0.
- Phân công thiếu `effective_to`: **416** dòng kỹ năng + 88 GVCN — **đều `active`** (đang dạy); dòng `ended` thiếu ngày: **0**. Luật mới tính tới ngày thi → không cần rơi về "mỗi GV từng dạy = 1 em".
- Trước: Pass Target theo LẦN THI, chỉ GV lớp lúc thi, OVR đạt → mọi kỹ năng Đạt. Sau: mục = em × kỹ năng GV từng dạy (W1 / W2 riêng), kỹ năng so Target overall, % theo tuần dạy.
- **10 / 23 dòng GV đổi %** (ví dụ Thea Marie Gemino 38 % → 0 %: em đạt OVR nhưng kỹ năng cô dạy dưới Target; Đoàn Thị Thanh Phương MB 0 % → 100 %: OVR trượt nhưng kỹ năng cô dạy đạt). Weighted ≈ không trọng số vì bản sao hầu như một GV / kỹ năng / em.

| Chi nhánh | GV | Trước (C10: Pass Target theo lần thi) | Sau (2F: mục em × kỹ năng, % theo tuần dạy) |
|---|---|---|---|
| BC | Đinh Nguyễn Bảo Phúc | 1/1 lần thi · 100 % | 1/2 mục · 50 % (tuần dạy) |
| BC | Tô Trần Quốc Thắng | 1/1 lần thi · 100 % | 1/1 mục · 100 % (tuần dạy) |
| BC | Trần Đoàn Lâm | 1/1 lần thi · 100 % | 2/2 mục · 100 % (tuần dạy) |
| CP | Đỗ Vũ Tuấn Phong | 3/5 lần thi · 60 % | 5/9 mục · 56 % (tuần dạy) |
| CP | Hoàng Thị Thu Hà | 3/4 lần thi · 75 % | 4/8 mục · 50 % (tuần dạy) |
| CP | Miguel Stichini | 0/1 lần thi · 0 % | 0/1 mục · 0 % (tuần dạy) |
| CP | Nguyễn Duy Anh | 0/3 lần thi · 0 % | 0/3 mục · 0 % (tuần dạy) |
| CP | Nguyễn Hoàng Dũng | 0/5 lần thi · 0 % | 3/10 mục · 30 % (tuần dạy) |
| CP | Nguyễn Thị Bảo Châu | 0/7 lần thi · 0 % | 4/14 mục · 29 % (tuần dạy) |
| CP | Thea Marie Gemino | 3/8 lần thi · 38 % | 0/8 mục · 0 % (tuần dạy) |
| CP | Trần Thị Thanh Hằng | 0/1 lần thi · 0 % | 0/1 mục · 0 % (tuần dạy) |
| CP | Vũ Hương Liên | 0/3 lần thi · 0 % | 1/6 mục · 17 % (tuần dạy) |
| MB | Deo Lumogdang | 0/2 lần thi · 0 % | 0/2 mục · 0 % (tuần dạy) |
| MB | Đặng Thái Hà | 0/2 lần thi · 0 % | 0/2 mục · 0 % (tuần dạy) |
| MB | Đoàn Thị Thanh Phương | 0/2 lần thi · 0 % | 2/2 mục · 100 % (tuần dạy) |
| MB | Đỗ Hà Thu | 0/1 lần thi · 0 % | 2/2 mục · 100 % (tuần dạy) |
| MB | Lê Trần Huy | 0/1 lần thi · 0 % | 0/2 mục · 0 % (tuần dạy) |
| MB | Nguyễn Tường Vi | 0/1 lần thi · 0 % | 0/1 mục · 0 % (tuần dạy) |
| MB | Trần Đoàn Lâm | 0/2 lần thi · 0 % | 0/4 mục · 0 % (tuần dạy) |
| UB | Bùi Huy Thành | 0/1 lần thi · 0 % | 0/2 mục · 0 % (tuần dạy) |
| UB | Đoàn Thị Thanh Phương | 0/1 lần thi · 0 % | 1/1 mục · 100 % (tuần dạy) |
| UB | Tạ Hồng Liên | 0/1 lần thi · 0 % | 0/1 mục · 0 % (tuần dạy) |
| UB | Trần Doãn Đạt | 0/1 lần thi · 0 % | 0/1 mục · 0 % (tuần dạy) |
