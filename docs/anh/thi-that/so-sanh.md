# THI-THAT — so số thi thật theo GV: luật C10 (trước) → luật mới (sau), bản sao 29/10

Nguồn: bản sao Turso 29/10 (chép vào scratchpad, migrate cục bộ cho có cột `thi_that_lay_lai`), **chỉ đọc**. GV ghi bằng mã (`users.id`) — dữ liệu thật, không ghi tên vào repo; bảng có tên: chạy lại với `CO_TEN=1`.
Lệnh: `PISA_DB=<bản sao> node docs/anh/thi-that/so-sanh.mjs <thư mục repo>` (sau `npm run build:server`). Khoảng: toàn bộ.

- Kết quả thi thật đủ 4 kỹ năng: **20** (10/10 – 25/10), KCK 0.
- Phân công thiếu `effective_to`: **416** dòng kỹ năng + 88 GVCN — **đều `active`**; dòng `ended` thiếu ngày: **0** → tính tới ngày thi, không cần rơi về "mỗi GV từng dạy = 1 em".
- Trước (C10): Pass Target theo LẦN THI, chỉ GV lớp lúc thi. Sau (chủ SP 05/11, sửa #978): mục = em × kỹ năng GV từng dạy (W1 / W2 riêng), **OVR quyết Đạt / Fail** (OVR đạt → Đạt; Exceed khi kỹ năng GV dạy > Target), % theo tuần dạy; cột riêng **KN dưới Target** (kỹ năng < Target, kể cả em OVR đạt).
- **% Pass đổi: 1 / 23 dòng GV** (GV #1 · CP: 60 % → 67 % — tính thêm em GV từng dạy ở lớp trước). KN dưới Target là số mới (không có ở C10).

| Chi nhánh | GV | Trước (C10: Pass theo lần thi) | Sau (Pass theo OVR · mục em × kỹ năng · % tuần dạy) | KN dưới Target (% tuần dạy) | % Pass |
|---|---|---|---|---|---|
| BC | GV #18 | 1/1 lần thi · 100 % | 2/2 mục · 100 % | 0 % |  |
| BC | GV #31 | 1/1 lần thi · 100 % | 1/1 mục · 100 % | 0 % |  |
| BC | GV #41 | 1/1 lần thi · 100 % | 2/2 mục · 100 % | 50 % |  |
| CP | GV #1 | 3/5 lần thi · 60 % | 6/9 mục · 67 % | 44 % | đổi |
| CP | GV #16 | 0/7 lần thi · 0 % | 0/14 mục · 0 % | 71 % |  |
| CP | GV #17 | 0/3 lần thi · 0 % | 0/3 mục · 0 % | 100 % |  |
| CP | GV #21 | 0/5 lần thi · 0 % | 0/10 mục · 0 % | 70 % |  |
| CP | GV #29 | 3/4 lần thi · 75 % | 6/8 mục · 75 % | 50 % |  |
| CP | GV #30 | 0/3 lần thi · 0 % | 0/6 mục · 0 % | 83 % |  |
| CP | GV #42 | 3/8 lần thi · 38 % | 3/8 mục · 38 % | 100 % |  |
| CP | GV #43 | 0/1 lần thi · 0 % | 0/1 mục · 0 % | 100 % |  |
| CP | GV #6 | 0/1 lần thi · 0 % | 0/1 mục · 0 % | 100 % |  |
| MB | GV #13 | 0/1 lần thi · 0 % | 0/2 mục · 0 % | 0 % |  |
| MB | GV #18 | 0/2 lần thi · 0 % | 0/4 mục · 0 % | 100 % |  |
| MB | GV #24 | 0/1 lần thi · 0 % | 0/2 mục · 0 % | 100 % |  |
| MB | GV #35 | 0/1 lần thi · 0 % | 0/1 mục · 0 % | 100 % |  |
| MB | GV #5 | 0/2 lần thi · 0 % | 0/2 mục · 0 % | 100 % |  |
| MB | GV #53 | 0/2 lần thi · 0 % | 0/2 mục · 0 % | 100 % |  |
| MB | GV #8 | 0/2 lần thi · 0 % | 0/2 mục · 0 % | 0 % |  |
| UB | GV #26 | 0/1 lần thi · 0 % | 0/1 mục · 0 % | 100 % |  |
| UB | GV #40 | 0/1 lần thi · 0 % | 0/1 mục · 0 % | 100 % |  |
| UB | GV #54 | 0/1 lần thi · 0 % | 0/2 mục · 0 % | 100 % |  |
| UB | GV #8 | 0/1 lần thi · 0 % | 0/1 mục · 0 % | 0 % |  |
