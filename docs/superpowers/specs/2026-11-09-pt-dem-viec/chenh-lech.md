# Bảng chênh lệch: cách đếm cũ ↔ sổ nghĩa vụ (PR-1, 09/11/2026)

Bản chép `D:\pisa-mig\mig.sqlite` (bản chính 07/11 09:24) → `npm run migrate` → `npm run nap-so` → `npm run so-sanh-so`. Hôm nay = 09/11. Chỉ đọc bản chép.
Không tên thật (GV #mã). Giao diện CHƯA đổi — đây là số sổ sẽ hiện ở PR-2 nếu chủ SP duyệt.

## Đọc nhanh cho chủ SP

| Khoảng 19/10 → 15/11 (mặc định) | Cũ | Sổ |
|---|---|---|
| Chấm Test đúng hạn (mọi GV) | 358/898 (40 %) | 674/2 684 (25 %) |
| Việc đúng hạn (mọi người) | 100/181 (55 %) | 337/505 (67 %) |

| Khoảng 31/08 → 15/11 | Cũ | Sổ |
|---|---|---|
| Chấm Test đúng hạn | 746/1 683 (44 %) | 1 246/4 358 (29 %) |
| Việc đúng hạn | 140/268 (52 %) | 778/946 (82 %) |

**Vì sao khác (theo cột "Lý do"):**
1. **Speaking chấm chéo chưa ai chấm tính cho CẢ NHÓM GV có kỹ năng S** (chủ SP 09/11): một bài S chưa chấm vào "Chưa làm" của MỌI GV S chi nhánh. Đây là phần tăng lớn nhất
   (vd GV #5: 68 bài S chéo quá hạn trong khoảng mặc định). 24/56 GV có dòng này.
2. **Bài chưa chấm quá hạn không còn rơi:** không có phân công ở ngày hạn → lấy phân công kế tiếp (cờ "phân công nhập sau", vd GV #60: 7 bài); bài quá hạn từ kỳ trước vẫn nằm trong kỳ của hạn.
3. **Mốc W4 OCT:** hạn gốc (bài: tuần thi) trước 19/10/2026 mà đã làm = đúng hạn, dù làm muộn (vd GV #60: 17 bài).
4. **Việc đếm TỪNG việc**, không gộp dòng như Công việc (nhiều em một dòng): mẫu số việc tăng. Việc của TVV / QL (Báo PH, bước tiếp…) có dòng riêng (GV #66, #68…).
5. **Kỳ:** cũ lấy bài theo tuần thi trong khoảng; sổ lấy theo HẠN trong khoảng (hạn bài = mốc trễ: thứ Tư tuần sau).

**Chưa phân công** (lớp + kỹ năng chưa từng có phân công; hiện cho QL): MB 28 (6 chưa làm) · BC 18 (18 chưa làm) · CP 14 · UB 22 (8 chưa làm).

**Đặt lại hạn 07/11** (việc quá hạn lúc đặt lại, nay tính theo hạn mới, `han_goc` giữ hạn cũ): Mô tả Case 36 (đã làm 10, chưa tới hạn mới 26) · Xác nhận PA 21 · Xác nhận Case 15 ·
Kết quả PA 14 (đã ghi cả 14) · Thêm PA 3. Kết quả PA đặt lại sang 21/11 mà chưa ghi chưa thành nghĩa vụ (chưa tới hạn) nên chưa có dòng.

## Bảng từng GV — khoảng mặc định 19/10 → 15/11

| GV | Chấm Test cũ | Chấm Test sổ (đúng · muộn · chưa làm) | Việc cũ | Việc sổ (đúng · muộn · chưa làm) | Lý do chênh (dòng sổ) |
|---|---|---|---|---|---|
| GV #1 | 10/10 (100 %) | 24/29 (83 %) · 0 · 5 | 13/17 (76 %) | 48/59 (81 %) · 11 · 0 | S chéo chưa ai chấm (cả nhóm) 5 |
| GV #2 | 0/9 (0 %) | 0/9 (0 %) · 9 · 0 | 2/4 (50 %) | 2/4 (50 %) · 0 · 2 |  |
| GV #3 | 2/4 (50 %) | 11/13 (85 %) · 2 · 0 | 3/9 (33 %) | 4/13 (31 %) · 5 · 4 | mốc W4 OCT (xong muộn → đúng) 1 |
| GV #4 | 2/8 (25 %) | 2/10 (20 %) · 0 · 8 | 0/1 (0 %) | 0/2 (0 %) · 0 · 2 | chưa làm 8 |
| GV #5 | 2/11 (18 %) | 3/80 (4 %) · 7 · 70 | 1/2 (50 %) | 1/2 (50 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 68 · chưa làm 2 |
| GV #6 | 12/14 (86 %) | 30/32 (94 %) · 2 · 0 | 2/2 (100 %) | 2/2 (100 %) · 0 · 0 | mốc W4 OCT (xong muộn → đúng) 1 |
| GV #7 | 8/54 (15 %) | 8/54 (15 %) · 12 · 34 | — | — | chưa làm 34 |
| GV #8 | 1/55 (2 %) | 2/56 (4 %) · 5 · 49 | 0/1 (0 %) | 0/4 (0 %) · 0 · 4 | chưa làm 49 |
| GV #10 | — | 1/91 (1 %) · 0 · 90 | — | — | S chéo chưa ai chấm (cả nhóm) 90 |
| GV #11 | 10/10 (100 %) | 38/38 (100 %) · 0 · 0 | 2/6 (33 %) | 3/9 (33 %) · 6 · 0 |  |
| GV #12 | 18/39 (46 %) | 18/64 (28 %) · 7 · 39 | 1/8 (13 %) | 20/30 (67 %) · 3 · 7 | S chéo chưa ai chấm (cả nhóm) 25 · chưa làm 14 |
| GV #13 | 4/4 (100 %) | 12/12 (100 %) · 0 · 0 | 1/2 (50 %) | 12/13 (92 %) · 1 · 0 | mốc W4 OCT (xong muộn → đúng) 8 |
| GV #14 | 22/22 (100 %) | 22/44 (50 %) · 0 · 22 | 3/3 (100 %) | 5/5 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 22 |
| GV #15 | — | 0/68 (0 %) · 0 · 68 | — | — | S chéo chưa ai chấm (cả nhóm) 68 |
| GV #16 | 4/4 (100 %) | 10/10 (100 %) · 0 · 0 | 2/6 (33 %) | 20/27 (74 %) · 5 · 2 | mốc W4 OCT (xong muộn → đúng) 6 |
| GV #17 | 10/11 (91 %) | 54/60 (90 %) · 1 · 5 | 4/7 (57 %) | 11/15 (73 %) · 3 · 1 | S chéo chưa ai chấm (cả nhóm) 5 |
| GV #18 | 0/26 (0 %) | 4/32 (13 %) · 0 · 28 | — | — | mốc W4 OCT (xong muộn → đúng) 4 · chưa làm 28 |
| GV #19 | 9/9 (100 %) | 9/9 (100 %) · 0 · 0 | 0/3 (0 %) | 0/4 (0 %) · 2 · 2 |  |
| GV #20 | 15/40 (38 %) | 15/27 (56 %) · 1 · 11 | — | — | chưa làm 11 |
| GV #21 | 21/23 (91 %) | 35/110 (32 %) · 2 · 73 | 10/23 (43 %) | 39/64 (61 %) · 20 · 5 | S chéo chưa ai chấm (cả nhóm) 73 |
| GV #23 | 6/9 (67 %) | 6/9 (67 %) · 0 · 3 | 0/1 (0 %) | 0/1 (0 %) · 0 · 1 | chưa làm 3 |
| GV #24 | 0/3 (0 %) | 3/95 (3 %) · 0 · 92 | 0/1 (0 %) | 0/2 (0 %) · 0 · 2 | S chéo chưa ai chấm (cả nhóm) 88 · mốc W4 OCT (xong muộn → đúng) 3 · chưa làm 4 |
| GV #25 | 5/32 (16 %) | 5/32 (16 %) · 25 · 2 | — | — | chưa làm 2 |
| GV #26 | 3/5 (60 %) | 3/95 (3 %) · 2 · 90 | 2/3 (67 %) | 2/6 (33 %) · 0 · 4 | S chéo chưa ai chấm (cả nhóm) 90 |
| GV #27 | 10/10 (100 %) | 12/12 (100 %) · 0 · 0 | 6/10 (60 %) | 18/26 (69 %) · 6 · 2 |  |
| GV #29 | 6/6 (100 %) | 13/13 (100 %) · 0 · 0 | 2/3 (67 %) | 8/9 (89 %) · 1 · 0 | mốc W4 OCT (xong muộn → đúng) 6 |
| GV #30 | 8/8 (100 %) | 42/42 (100 %) · 0 · 0 | 7/8 (88 %) | 21/22 (95 %) · 1 · 0 | mốc W4 OCT (xong muộn → đúng) 4 |
| GV #31 | 26/48 (54 %) | 26/65 (40 %) · 21 · 18 | 4/5 (80 %) | 13/14 (93 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 17 · chưa làm 1 |
| GV #32 | 9/18 (50 %) | 13/107 (12 %) · 4 · 90 | — | — | S chéo chưa ai chấm (cả nhóm) 85 · mốc W4 OCT (xong muộn → đúng) 4 · chưa làm 5 |
| GV #33 | — | 1/1 (100 %) · 0 · 0 | — | — | mốc W4 OCT (xong muộn → đúng) 1 |
| GV #34 | 15/42 (36 %) | 15/33 (45 %) · 18 · 0 | 1/1 (100 %) | 1/1 (100 %) · 0 · 0 |  |
| GV #35 | 6/72 (8 %) | 8/160 (5 %) · 51 · 101 | — | — | S chéo chưa ai chấm (cả nhóm) 85 · mốc W4 OCT (xong muộn → đúng) 2 · chưa làm 16 |
| GV #39 | 4/16 (25 %) | 4/16 (25 %) · 2 · 10 | — | — | chưa làm 10 |
| GV #40 | 15/45 (33 %) | 15/67 (22 %) · 30 · 22 | 0/2 (0 %) | 0/5 (0 %) · 0 · 5 | S chéo chưa ai chấm (cả nhóm) 22 |
| GV #41 | 13/17 (76 %) | 13/34 (38 %) · 0 · 21 | 1/1 (100 %) | 1/1 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 17 · chưa làm 4 |
| GV #42 | 1/1 (100 %) | 2/75 (3 %) · 0 · 73 | — | 9/9 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 73 · mốc W4 OCT (xong muộn → đúng) 1 |
| GV #43 | 7/7 (100 %) | 8/81 (10 %) · 0 · 73 | 18/18 (100 %) | 42/42 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 73 |
| GV #44 | 0/26 (0 %) | 44/70 (63 %) · 26 · 0 | 0/2 (0 %) | 2/16 (13 %) · 14 · 0 | phân công nhập sau 26 · mốc W4 OCT (xong muộn → đúng) 30 |
| GV #45 | — | 0/68 (0 %) · 0 · 68 | — | — | S chéo chưa ai chấm (cả nhóm) 68 |
| GV #46 | 19/19 (100 %) | 27/27 (100 %) · 0 · 0 | 0/2 (0 %) | 1/3 (33 %) · 1 · 1 | mốc W4 OCT (xong muộn → đúng) 8 |
| GV #48 | 6/10 (60 %) | 6/95 (6 %) · 1 · 88 | 1/1 (100 %) | 1/1 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 85 · chưa làm 3 |
| GV #49 | 16/18 (89 %) | 16/18 (89 %) · 2 · 0 | 2/8 (25 %) | 5/13 (38 %) · 2 · 6 |  |
| GV #50 | 8/8 (100 %) | 9/9 (100 %) · 0 · 0 | — | — | mốc W4 OCT (xong muộn → đúng) 1 |
| GV #51 | 1/2 (50 %) | 34/105 (32 %) · 1 · 70 | 1/1 (100 %) | 3/3 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 68 · phân công nhập sau 26 · mốc W4 OCT (xong muộn → đúng) 33 · chưa làm 2 |
| GV #52 | — | 1/108 (1 %) · 0 · 107 | 1/2 (50 %) | 2/3 (67 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 107 |
| GV #53 | — | 0/85 (0 %) · 0 · 85 | 1/2 (50 %) | 1/2 (50 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 85 |
| GV #54 | 5/19 (26 %) | 5/19 (26 %) · 4 · 10 | 6/8 (75 %) | 12/21 (57 %) · 0 · 9 | chưa làm 10 |
| GV #57 | 4/4 (100 %) | 6/91 (7 %) · 0 · 85 | — | — | S chéo chưa ai chấm (cả nhóm) 85 · mốc W4 OCT (xong muộn → đúng) 2 |
| GV #58 | — | 15/15 (100 %) · 0 · 0 | — | — |  |
| GV #60 | 5/20 (25 %) | 14/29 (48 %) · 3 · 12 | 2/6 (33 %) | 3/7 (43 %) · 4 · 0 | mốc W4 OCT (xong muộn → đúng) 8 · chưa làm 12 |
| GV #61 | 10/80 (13 %) | 10/160 (6 %) · 46 · 104 | 1/2 (50 %) | 7/10 (70 %) · 0 · 3 | S chéo chưa ai chấm (cả nhóm) 90 · chưa làm 14 |
| GV #66 | — | — | — | 0/7 (0 %) · 0 · 7 |  |
| GV #68 | — | — | — | 4/10 (40 %) · 4 · 2 |  |
| GV #73 | — | — | — | 12/14 (86 %) · 0 · 2 |  |
| GV #78 | — | — | — | 2/4 (50 %) · 0 · 2 |  |
| **Tổng** | 358/898 (40 %) | 674/2684 (25 %) | 100/181 (55 %) | 337/505 (67 %) | |

## Khoảng 31/08 → 15/11 (từng GV)

| GV | Chấm Test cũ | Chấm Test sổ (đúng · muộn · chưa làm) | Việc cũ | Việc sổ (đúng · muộn · chưa làm) | Lý do chênh (dòng sổ) |
|---|---|---|---|---|---|
| GV #1 | 35/55 (64 %) | 55/60 (92 %) · 0 · 5 | 16/30 (53 %) | 101/112 (90 %) · 11 · 0 | S chéo chưa ai chấm (cả nhóm) 5 · mốc W4 OCT (xong muộn → đúng) 20 |
| GV #2 | 0/9 (0 %) | 0/9 (0 %) · 9 · 0 | 2/4 (50 %) | 2/4 (50 %) · 0 · 2 |  |
| GV #3 | 10/13 (77 %) | 15/17 (88 %) · 2 · 0 | 7/13 (54 %) | 8/17 (47 %) · 5 · 4 | phân công nhập sau 4 · mốc W4 OCT (xong muộn → đúng) 5 |
| GV #4 | 2/22 (9 %) | 2/44 (5 %) · 0 · 42 | 0/1 (0 %) | 0/2 (0 %) · 0 · 2 | phân công nhập sau 22 · chưa làm 42 |
| GV #5 | 8/36 (22 %) | 23/159 (14 %) · 7 · 129 | 1/2 (50 %) | 1/2 (50 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 123 · mốc W4 OCT (xong muộn → đúng) 15 · chưa làm 6 |
| GV #6 | 79/85 (93 %) | 83/85 (98 %) · 2 · 0 | 4/9 (44 %) | 43/43 (100 %) · 0 · 0 | mốc W4 OCT (xong muộn → đúng) 4 |
| GV #7 | 26/96 (27 %) | 48/96 (50 %) · 12 · 36 | — | — | mốc W4 OCT (xong muộn → đúng) 22 · chưa làm 36 |
| GV #8 | 9/68 (13 %) | 14/68 (21 %) · 5 · 49 | 1/2 (50 %) | 4/8 (50 %) · 0 · 4 | mốc W4 OCT (xong muộn → đúng) 5 · chưa làm 49 |
| GV #10 | — | 1/146 (1 %) · 0 · 145 | — | — | S chéo chưa ai chấm (cả nhóm) 145 |
| GV #11 | 72/81 (89 %) | 110/110 (100 %) · 0 · 0 | 18/24 (75 %) | 100/106 (94 %) · 6 · 0 | phân công nhập sau 33 · mốc W4 OCT (xong muộn → đúng) 35 |
| GV #12 | 18/39 (46 %) | 36/82 (44 %) · 7 · 39 | 1/9 (11 %) | 26/36 (72 %) · 3 · 7 | S chéo chưa ai chấm (cả nhóm) 25 · phân công nhập sau 18 · mốc W4 OCT (xong muộn → đúng) 18 · chưa làm 14 |
| GV #13 | 6/20 (30 %) | 20/20 (100 %) · 0 · 0 | 5/6 (83 %) | 26/27 (96 %) · 1 · 0 | mốc W4 OCT (xong muộn → đúng) 14 |
| GV #14 | 22/22 (100 %) | 22/44 (50 %) · 0 · 22 | 3/3 (100 %) | 5/5 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 22 |
| GV #15 | — | 0/123 (0 %) · 0 · 123 | — | — | S chéo chưa ai chấm (cả nhóm) 123 |
| GV #16 | 16/30 (53 %) | 30/30 (100 %) · 0 · 0 | 3/11 (27 %) | 35/42 (83 %) · 5 · 2 | mốc W4 OCT (xong muộn → đúng) 14 |
| GV #17 | 83/99 (84 %) | 99/105 (94 %) · 1 · 5 | 4/11 (36 %) | 52/56 (93 %) · 3 · 1 | S chéo chưa ai chấm (cả nhóm) 5 · mốc W4 OCT (xong muộn → đúng) 15 |
| GV #18 | 0/48 (0 %) | 9/48 (19 %) · 0 · 39 | — | — | mốc W4 OCT (xong muộn → đúng) 9 · chưa làm 39 |
| GV #19 | 9/9 (100 %) | 9/9 (100 %) · 0 · 0 | 0/3 (0 %) | 0/4 (0 %) · 2 · 2 |  |
| GV #20 | 15/49 (31 %) | 27/49 (55 %) · 1 · 21 | — | — | phân công nhập sau 13 · mốc W4 OCT (xong muộn → đúng) 12 · chưa làm 21 |
| GV #21 | 42/53 (79 %) | 51/181 (28 %) · 2 · 128 | 12/25 (48 %) | 67/92 (73 %) · 20 · 5 | S chéo chưa ai chấm (cả nhóm) 128 · mốc W4 OCT (xong muộn → đúng) 9 |
| GV #23 | 6/9 (67 %) | 6/9 (67 %) · 0 · 3 | 0/1 (0 %) | 0/1 (0 %) · 0 · 1 | chưa làm 3 |
| GV #24 | 0/20 (0 %) | 21/186 (11 %) · 0 · 165 | 0/1 (0 %) | 0/2 (0 %) · 0 · 2 | S chéo chưa ai chấm (cả nhóm) 146 · phân công nhập sau 20 · mốc W4 OCT (xong muộn → đúng) 21 · chưa làm 19 |
| GV #25 | 5/32 (16 %) | 5/32 (16 %) · 25 · 2 | — | — | chưa làm 2 |
| GV #26 | 3/19 (16 %) | 16/164 (10 %) · 2 · 146 | 2/3 (67 %) | 2/6 (33 %) · 0 · 4 | S chéo chưa ai chấm (cả nhóm) 145 · mốc W4 OCT (xong muộn → đúng) 13 · chưa làm 1 |
| GV #27 | 13/32 (41 %) | 32/32 (100 %) · 0 · 0 | 5/17 (29 %) | 56/64 (88 %) · 6 · 2 | mốc W4 OCT (xong muộn → đúng) 19 |
| GV #29 | 13/38 (34 %) | 39/39 (100 %) · 0 · 0 | 8/10 (80 %) | 46/47 (98 %) · 1 · 0 | mốc W4 OCT (xong muộn → đúng) 25 |
| GV #30 | 40/57 (70 %) | 57/57 (100 %) · 0 · 0 | 9/11 (82 %) | 39/40 (98 %) · 1 · 0 | mốc W4 OCT (xong muộn → đúng) 17 |
| GV #31 | 26/52 (50 %) | 30/72 (42 %) · 21 · 21 | 4/5 (80 %) | 13/14 (93 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 20 · mốc W4 OCT (xong muộn → đúng) 4 · chưa làm 1 |
| GV #32 | 9/25 (36 %) | 15/168 (9 %) · 4 · 149 | — | — | S chéo chưa ai chấm (cả nhóm) 143 · mốc W4 OCT (xong muộn → đúng) 6 · chưa làm 6 |
| GV #33 | 0/2 (0 %) | 2/2 (100 %) · 0 · 0 | — | 1/1 (100 %) · 0 · 0 | mốc W4 OCT (xong muộn → đúng) 2 |
| GV #34 | 15/57 (26 %) | 30/48 (63 %) · 18 · 0 | 1/1 (100 %) | 1/1 (100 %) · 0 · 0 | mốc W4 OCT (xong muộn → đúng) 15 |
| GV #35 | 10/83 (12 %) | 14/253 (6 %) · 51 · 188 | 1/3 (33 %) | 3/3 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 143 · phân công nhập sau 27 · mốc W4 OCT (xong muộn → đúng) 4 · chưa làm 45 |
| GV #39 | 4/29 (14 %) | 17/29 (59 %) · 2 · 10 | — | — | mốc W4 OCT (xong muộn → đúng) 13 · chưa làm 10 |
| GV #40 | 15/45 (33 %) | 16/68 (24 %) · 30 · 22 | 0/2 (0 %) | 0/5 (0 %) · 0 · 5 | S chéo chưa ai chấm (cả nhóm) 22 · phân công nhập sau 1 · mốc W4 OCT (xong muộn → đúng) 1 |
| GV #41 | 13/17 (76 %) | 13/37 (35 %) · 0 · 24 | 1/1 (100 %) | 1/1 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 20 · chưa làm 4 |
| GV #42 | 1/13 (8 %) | 2/152 (1 %) · 0 · 150 | — | 11/11 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 128 · phân công nhập sau 11 · mốc W4 OCT (xong muộn → đúng) 1 · chưa làm 22 |
| GV #43 | 9/14 (64 %) | 14/142 (10 %) · 0 · 128 | 15/21 (71 %) | 61/61 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 128 · mốc W4 OCT (xong muộn → đúng) 5 |
| GV #44 | 14/44 (32 %) | 57/83 (69 %) · 26 · 0 | 0/2 (0 %) | 2/16 (13 %) · 14 · 0 | phân công nhập sau 39 · mốc W4 OCT (xong muộn → đúng) 43 |
| GV #45 | — | 0/123 (0 %) · 0 · 123 | — | — | S chéo chưa ai chấm (cả nhóm) 123 |
| GV #46 | 26/39 (67 %) | 37/39 (95 %) · 0 · 2 | 0/2 (0 %) | 1/3 (33 %) · 1 · 1 | mốc W4 OCT (xong muộn → đúng) 11 · chưa làm 2 |
| GV #48 | 6/21 (29 %) | 16/164 (10 %) · 1 · 147 | 1/1 (100 %) | 1/1 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 143 · mốc W4 OCT (xong muộn → đúng) 10 · chưa làm 4 |
| GV #49 | 16/18 (89 %) | 24/26 (92 %) · 2 · 0 | 2/8 (25 %) | 5/13 (38 %) · 2 · 6 | phân công nhập sau 8 · mốc W4 OCT (xong muộn → đúng) 8 |
| GV #50 | 8/9 (89 %) | 9/9 (100 %) · 0 · 0 | — | — | mốc W4 OCT (xong muộn → đúng) 1 |
| GV #51 | 1/12 (8 %) | 35/161 (22 %) · 1 · 125 | 1/1 (100 %) | 3/3 (100 %) · 0 · 0 | S chéo chưa ai chấm (cả nhóm) 123 · phân công nhập sau 26 · mốc W4 OCT (xong muộn → đúng) 34 · chưa làm 2 |
| GV #52 | — | 1/166 (1 %) · 0 · 165 | 1/2 (50 %) | 2/3 (67 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 165 |
| GV #53 | — | 2/145 (1 %) · 0 · 143 | 1/2 (50 %) | 1/2 (50 %) · 1 · 0 | S chéo chưa ai chấm (cả nhóm) 143 · mốc W4 OCT (xong muộn → đúng) 2 |
| GV #54 | 5/19 (26 %) | 5/19 (26 %) · 4 · 10 | 5/8 (63 %) | 14/23 (61 %) · 0 · 9 | chưa làm 10 |
| GV #57 | 4/8 (50 %) | 8/151 (5 %) · 0 · 143 | — | — | S chéo chưa ai chấm (cả nhóm) 143 · mốc W4 OCT (xong muộn → đúng) 4 |
| GV #58 | 15/15 (100 %) | 15/15 (100 %) · 0 · 0 | 0/1 (0 %) | 8/8 (100 %) · 0 · 0 |  |
| GV #60 | 7/40 (18 %) | 24/47 (51 %) · 3 · 20 | 5/10 (50 %) | 12/16 (75 %) · 4 · 0 | phân công nhập sau 7 · mốc W4 OCT (xong muộn → đúng) 17 · chưa làm 20 |
| GV #61 | 10/80 (13 %) | 30/235 (13 %) · 46 · 159 | 1/2 (50 %) | 7/10 (70 %) · 0 · 3 | S chéo chưa ai chấm (cả nhóm) 145 · phân công nhập sau 20 · mốc W4 OCT (xong muộn → đúng) 20 · chưa làm 14 |
| GV #66 | — | — | — | 0/7 (0 %) · 0 · 7 |  |
| GV #68 | — | — | — | 4/10 (40 %) · 4 · 2 |  |
| GV #73 | — | — | — | 12/14 (86 %) · 0 · 2 |  |
| GV #78 | — | — | — | 2/4 (50 %) · 0 · 2 |  |
| **Tổng** | 746/1683 (44 %) | 1246/4358 (29 %) | 140/268 (52 %) | 778/946 (82 %) | |

## Dòng đọc (bản chép, đếm ở máy — Turso đọc ≥ số này)

| Việc | Câu | Dòng trả về |
|---|---:|---:|
| Nạp sổ một lần (`npm run nap-so`) | 3 403 | 60 071 |
| Đếm một chi nhánh, một kỳ (`demTheoNguoi`) | 2 | 798 |
| Đếm tổng mọi chi nhánh | 2 | 2 174 |
| Panel một người (`dongCuaNguoi`) | 2 | 798 |
| Đối chiếu đêm (cả 5 chi nhánh) | 3 169 | 76 765 |
| — trong đó việc (một lượt Công việc mỗi chi nhánh): MB · BC · CP · UB · HD | 363 · 347 · 893 · 1 329 · 140 | 5 641 · 4 720 · 11 049 · 13 404 · 2 250 |
| Ghi sổ một thao tác ghi bài (một lô trước COMMIT) | ~11 – 12 | vài chục |

Đối chiếu đêm chạy 5 lần (02:20 – 06:20 giờ VN), mỗi lần bài cả trung tâm + việc của một chi nhánh, để không quá giờ hàm định kỳ. Ước 0,1 – 0,3 triệu dòng Turso mỗi đêm (dòng quét ≥ dòng trả về) — dưới trần spec 0,5 triệu.
