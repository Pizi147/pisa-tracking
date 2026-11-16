# TD-QUET — đo toàn bộ đường máy chủ (17/11, đợt TOC-DO-1711)

Mục tiêu: đo MỌI đường API trên bản chép DB thật, xếp theo dòng đọc × tần suất 24 h bản chính, sửa những đường không thuộc 4 session TD khác
(TD-VIEC · TD-HVL · TD-CHAM · TD-NGUOI) mà vượt ~30 câu / ~2 000 dòng / quét cả bảng / N+1.

## 1. Cách đo

- **Bản chép:** sao lưu `pisa-pisatracking-261107-pizi147-2026-11-12-0112.sqlite` (mới nhất trong `H:\My Drive\PISA TRACKING\back-up`), chép ra tạm,
  migrate bằng mã main `f45622918` (`node dist-server/server/src/migrate/run.js`, không biến Turso). Ngày thật (`BAN_CHINH=1`, 17/11).
- **Tài khoản thật chi nhánh CP (3)** — lớp FT lớn nhất CN: `CP FT 141` (12, 16 em); lớp thường lớn nhất: `CP BE 71` (18, 16 em); em nhiều dữ liệu nhất lớp 12: id 62.

  | Vai | id | ghi chú |
  |---|---:|---|
  | QL 1 CN | 59 | CP |
  | QL 5 CN | 33 | 5 chi nhánh (kiêm GV W1 lớp 12) |
  | GVCN | 29 | GVCN lớp 12 |
  | GV (bộ môn) | 27 | Reading lớp 12 |
  | GV Speaking | 43 | Speaking lớp 12 (đo bằng đúng url của GV bộ môn) |
  | GVCN lớp thường | 30 | GVCN lớp 18 |
  | QT | 6 | Quản trị hệ thống |
  | Admin | 75 | Admin CP |
  | TVV | 68 | CP |
  | CX | 72 | 5 chi nhánh |

- **Danh sách đường:** 184 GET + 239 POST / PUT / PATCH / DELETE trong `server/src/routes/index.ts` (cả `/api/health` ở `app.ts`). GET: mọi mục `DUONG_DO`
  (`tocDoDuong.ts`, chỗ thay `{lopFT}` … đổi sang id thật) × vai của mục + 41 GET chưa có trong `DUONG_DO` × cả 10 vai = **1 659 lượt**.
  Đường ghi chính (điểm FT 5 môn, điểm lớp thường 4 môn, sửa điểm, Xếp lịch một môn, Ghi vi phạm nhiều em, Xác nhận Case, Báo cáo PH, Duyệt, Chuyển lớp)
  đo trên bản chép tạm rồi bỏ.
- **Bỏ quét nền:** một lượt khởi động không ghi + trước mỗi lượt đặt mốc quét còn hạn (như `tocDo.run`) — số là của chính đường đó.
- **Số:** "câu" / "dòng" = câu SQL và dòng TRẢ VỀ (như log `[t]` bản chính); "quét cả bảng" = dòng đi qua khi SCAN cả bảng (`scripts/do-it.py`, Turso tính hết).
  "dòng / ngày" = dòng TB của các vai đo × số lần trong log 24 h (`D:\Github\netlify-api-24h.txt`, 4 980 request). Tổng ước 3,74 triệu / ngày — log thật 3,93 triệu
  (log là mã 12/11, các đợt sau đã giảm một phần) → bảng khớp tầm.
- **Lệnh (tái lập):**
  ```
  npm run build:server
  node scripts/do-toan-bo-ds.mjs <bản chép đã migrate> ds.json
  PISA_IN_JSON=1 node scripts/do-ban-chep.mjs <bản chép> ds.json ra
  python -I scripts/do-it.py ra > doit.txt
  DOIT=doit.txt CHI_TIET=chi-tiet.md python -I scripts/do-toan-bo-bang.py ra.json <log 24h> bang.md
  python -I scripts/do-toan-bo-so.py truoc.json sau.json      (so JSON từng khoá hai bản dựng chạy SONG SONG)
  ```

## 2. Theo khu (dòng / ngày ước)

| Khu | dòng / ngày | ghi chú |
|---|---:|---|
| TD-VIEC (`/my-work*`) | 1 361 000 | `/my-work` 46 % |
| TD-HVL (`/hoc-vien-lop`, Tổng quan v5, hai-khoi, Phân tích GV) | 977 000 | |
| TD-CHAM (lịch Test, yêu cầu đếm, viec-theo-em) | 709 000 | |
| **TD-QUET (mọi đường còn lại)** | **690 000** | 188 đường; lớn nhất: hồ sơ lớp `roster` 106 K · `cham` 104 K · `diem-theo-luot/:luot` 87 K · `overview` 76 K |

## 3. Đã sửa (PR TD-QUET-1)

JSON trùng nguyên chuỗi trước / sau trên cả 1 659 lượt (hai bản dựng chạy song song trên hai bản chép; 6 khoá lệch chỉ do giờ tạo thông báo / mã lỗi ngẫu nhiên
của `/attachments/:id/download` — không đổi ở mã sửa).

| Sửa | Đường | Trước → sau (một lần mở) | Lần / 24 h | Tiết kiệm / ngày |
|---|---|---|---:|---:|
| Quét Checkpoint dừng trước giao dịch khi lớp không liên tục (`quetCheckpoint`, bảng lớp đã nhớ) | `GET /classes/:id/diem-theo-luot` | 8 → 6 câu (+ bỏ `BEGIN IMMEDIATE` / `COMMIT` — khoá ghi Turso trong một GET) · 416 → 312 dòng · quét 226 → 124 | 209 | ~22 K dòng · ~840 lượt khứ hồi |
| như trên | `GET /ke-hoach-test/thuong/:id` | 19 → 17 câu · 445 → 341 dòng | hiếm | |
| Bản huỷ điểm còn mở lọc theo lượt của bảng (`diemHuyMo(attemptIds)`, chỉ mục `idx_ket_qua_huy_attempt`) | lưới lớp thường `GET /classes/:id/cham`, `/regular/classes/:id/sheet`, `/regular/attempts/:id` | 392 → 345 dòng · quét 83 → 10 (trước đọc MỌI bản mở cả hệ thống — tăng theo thời gian) | ≤ 287 | ≤ 13 K dòng |
| Tên Case của thẻ Chờ duyệt nạp một câu (`napTenCase`) | `GET /yeu-cau?hop=cho-duyet&xem=da-xu-ly` | 31–32 → 22–23 câu | ≤ 41 | ~ −9 câu / lần |
| Ô tìm thanh trên: lớp + Case mở của mọi em một câu mỗi loại | `GET /students?q=…&gioiHan=6&gon=1` | 14 → 4 câu | 12 | −120 câu |
| Chỉ mục `sos_case_history(case_id)` | `GET /cases/:id` (+ câu con `caseDongDoXoaSql`) | quét cả bảng 1 103 → 10 | 168 | **~184 K dòng quét** |
| Chỉ mục `case_signals(class_id)` | `GET /classes/:id/xoa-ket-thuc` | quét cả bảng 1 311 → 207 | 47 | ~52 K dòng quét |

Cộng: ~ **270 K dòng đọc Turso / ngày** (≈ 8 triệu / tháng), ~ 900 lượt khứ hồi / ngày, và bỏ khoá ghi trong một GET hay gọi.

## 4. Chưa sửa — lý do / đề xuất

- **Đường ghi 55–183 câu (lưu điểm, Xếp lịch, Xác nhận Case):** câu đọc LẶP trong cùng request (vd lưu W2 làm xong lượt có 4 môn dưới kỳ vọng:
  `SELECT route FROM learning_cycles WHERE id = ?` ×15, phân công lớp ×9, `sos_coordination_actions` theo lượt ×11; lưu điểm thường: lượt ×3, tuần ×4, lịch môn ×4,
  chương trình ×2). Gốc: `nho()` TẮT ở request ghi theo thiết kế (dữ liệu có thể đổi giữa chừng). Bật nhớ cho request ghi (xoá khi `run`) là đổi hạ tầng
  dùng chung → **[XM] hỏi PTA Plan**, không tự làm. Ước: lưu điểm 62 → ~45 câu, lưu tạo Case 183 → ~140 (~ −80–200 ms trên Turso).
  Phần sổ nghĩa vụ trong lưu điểm (INSERT / UPDATE `nghia_vu` + đọc cả bảng lớp 97 dòng vì request đã ghi) thuộc TD-CHAM.
- **Phân tích / Tổng quan cũ cho QL 5 CN, QT (10–21 K dòng một lần mở):** `/phan-tich/bao-cao`, `/tong-quan/ql`, `/tong-quan/chi-nhanh(/o)`, `/xuat-mt/xem-truoc`,
  `/metrics/*`, `/signals`, `/tong-quan/quan-ly`, `/tong-quan/hoc-vien`, `/hoc-vien-lop/theo-vai` — **0 lần trong 24 h** (QL 1 CN 5–7 K). Dòng thật theo phạm vi
  (mọi lượt / Case của 5 chi nhánh); giảm phải đổi cách tính (bảng tổng hợp sẵn) → để đợt riêng nếu chủ SP thấy chậm. Trần đã khoá (không tăng âm thầm).
- **Hồ sơ HV `GET /students/:id` 78 câu · 131 dòng:** 78 câu khác nhau (mỗi khối một câu, không N+1). Gộp = viết lại hồ sơ, rủi ro JSON → để sau; trần 84 giữ.
- **Hồ sơ lớp `roster` / `overview` / `diem-theo-luot/:luot` (23–43 câu, 400–800 dòng):** đã gộp lô theo lớp; dòng ~ 45 / em là dữ liệu cần vẽ. Ba đường cùng
  đọc lượt + điểm của lớp → đề xuất gộp ở web (một GET hồ sơ lớp) — đổi bố cục / luồng, ngoài phạm vi.
- **`GET /giao-vien/:id/chi-so` 184 câu (QL 5 CN):** dựng lại sổ việc của 4 chi nhánh trong một GET (`nghia_vu`) — TD-CHAM. 1 lần / ngày.
- **`GET /giao-vien/:id/o?cot=viec` quét 510** (`case_interventions`, `violations` < 400 dòng) — dùng hàm Công việc (TD-VIEC).
- **N+1 nhỏ hiếm:** `/admin/programmes` (7 × 2 câu, Quản trị), `/classes/:id/bao-cao-ph/xuat` (5 ×), `/cases` của QT quét `sos_cases` 1 015 (web luôn gửi `classId`).
- **Tham số đo lại riêng:** `/attachments?ownerType=sos_case&ownerId=578` 3–5 câu · 2–4 dòng; `/meeting/tutor-rollup?periodId=51` 3 câu · 2 dòng (GV 403 đúng quyền)
  — lượt đo chính gửi sai tham số (400), script đã sửa. Chưa ra 200: `/attachments/:id/download` (kho tệp Netlify), `/y-thuc/bao-ph/:id`,
  `/cycles/:id/lo-trinh-moi/xem-truoc`, `/students/:id/quay-lai` (trạng thái em không hợp) — đều ≤ 7 câu, hiếm.

## 5. Trần mới (`server/src/tests/tocDoDuong.ts`)

- 25 GET chưa có trong `DUONG_DO` thêm vào bảng đo (seed).
- Mọi (vai × đường) của `DUONG_DO` chưa có trần: thêm `TRAN` = max(đo + 10, ⌈đo × 1,3⌉) và `TRAN_DONG` = max(đo + 50, ⌈đo × 1,3⌉) theo số đo seed — khoá không cho tăng.

## 6. Bảng đường (xếp theo dòng / ngày, rồi dòng max)

Cột: lượt đo (số vai × biến thể url ra 200) · câu max · dòng max · dòng TB · quét cả bảng max (`do-it.py`) · vai · url có dòng max · lần / 24 h (log) ·
ms TB (log bản chính, mã 12/11) · dòng / ngày (ước) · vượt (câu > 30 / dòng > 2 000 / quét > 1 000). Đường ghi: một lượt đo, cột quét = 0 (`do-it.py` chỉ chạy SELECT).
Bảng từng (vai × url) — 1 679 dòng: [`do-toan-bo-chi-tiet.md`](do-toan-bo-chi-tiet.md).

| Đường | khu | lượt đo | câu max | dòng max | dòng TB | quét cả bảng max | vai · url dòng max | lần / 24 h | ms TB (log) | dòng / ngày (ước) | vượt |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---|
| `GET /my-work` | TD-VIEC | 17 | 55 | 9429 | 3218 | 2517 | QT `/my-work?nguoi=tat-ca` | 422 | 1109 | 1358070 | câu dòng quét |
| `GET /hoc-vien-lop` | TD-HVL | 36 | 88 | 27629 | 6107 | 93 | CX `/hoc-vien-lop?kem=sos` | 75 | 1188 | 458017 | câu dòng |
| `GET /classes/:id/viec-theo-em` | TD-CHAM | 6 | 48 | 2113 | 1483 | 2517 | QT `/classes/12/viec-theo-em?chi=toi` | 194 | 510 | 287767 | câu dòng quét |
| `GET /cham/lich-test/qua-han` | TD-CHAM | 3 | 9 | 4458 | 2254 | 10 | QL5 `/cham/lich-test/qua-han` | 121 | 662 | 272694 | dòng |
| `GET /tong-quan/v5` | TD-HVL | 21 | 64 | 25517 | 12300 | 8040 | QL5 `/tong-quan/v5?ct=ft&kemBaoCao=1` | 22 | 865 | 270601 | câu dòng quét |
| `GET /tong-quan/lop-toi-day/hai-khoi` | TD-HVL | 4 | 46 | 4609 | 2938 | 10 | GVCN_TH `/tong-quan/lop-toi-day/hai-khoi` | 57 | 937 | 167438 | câu dòng |
| `GET /cham/lich-test` | TD-CHAM | 20 | 22 | 4663 | 1482 | 78 | QL5 `/cham/lich-test` | 96 | 308 | 142243 | dòng |
| `GET /classes/:id/roster` | TD-QUET | 16 | 27 | 732 | 427 | 10 | QL1 `/classes/12/roster` | 249 | 215 | 106339 |  |
| `GET /classes/:id/cham` | TD-QUET | 10 | 16 | 392 | 362 | 83 | QL1 `/classes/18/cham` | 287 | 98 | 103779 |  |
| `GET /classes/:id/diem-theo-luot/:luot` | TD-QUET | 6 | 19 | 427 | 427 | 124 | QL1 `/classes/12/diem-theo-luot/mt:2` | 203 | 125 | 86681 |  |
| `GET /phan-tich/giao-vien` | TD-HVL | 16 | 88 | 9043 | 3360 | 2503 | QL1 `/phan-tich/giao-vien?cn=3&ct=ft` | 24 | 544 | 80638 | câu dòng quét |
| `GET /classes/:id/overview` | TD-QUET | 10 | 43 | 809 | 392 | 100 | GVCN_TH `/classes/18/overview` | 194 | 281 | 75970 | câu |
| `GET /classes/:id/diem-theo-luot` | TD-QUET | 9 | 8 | 416 | 291 | 226 | QL1 `/classes/12/diem-theo-luot` | 209 | 117 | 60842 |  |
| `GET /giao-vien/:id/o` | TD-QUET | 12 | 39 | 1395 | 983 | 510 | QL1 `/giao-vien/29/o?cot=chua-nhap` | 57 | 168 | 56040 | câu |
| `GET /cases` | TD-QUET | 18 | 4 | 2461 | 416 | 1015 | QL5 `/cases` | 63 | 36 | 26212 | dòng quét |
| `GET /ke-hoach-test/lop` | TD-QUET | 7 | 9 | 624 | 419 | 10 | QL1 `/ke-hoach-test/lop?branchId=3` | 37 | 86 | 15498 |  |
| `GET /students/:id` | TD-QUET | 8 | 78 | 131 | 126 | 400 | GVCN `/students/62` | 98 | 347 | 12336 | câu |
| `PUT /attempts/:id/scores/writing2` | TD-QUET | 1 | 183 | 348 | 348 | 0 | GV1 `/attempts/217/scores/writing2` | 28 | 435 | 9744 | câu |
| `GET /ke-hoach-test/ft/:id` | TD-QUET | 6 | 12 | 342 | 342 | 10 | QL1 `/ke-hoach-test/ft/12` | 24 | 85 | 8208 |  |
| `GET /phan-tich/thi-that` | TD-QUET | 5 | 8 | 2394 | 1618 | 1700 | QL5 `/phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20` | 5 | 26 | 8088 | dòng quét |
| `GET /phan-tich/tong-hop` | TD-QUET | 6 | 10 | 5763 | 3494 | 10 | QL5 `/phan-tich/tong-hop?ct=ft` | 2 | 100 | 6989 | dòng |
| `GET /yeu-cau/dem` | TD-CHAM | 10 | 4 | 106 | 64 | 10 | QL1 `/yeu-cau/dem?branchId=3` | 104 | 100 | 6656 |  |
| `GET /yeu-cau` | TD-QUET | 15 | 32 | 552 | 162 | 281 | QL5 `/yeu-cau?hop=cho-duyet&xem=da-xu-ly` | 41 | 49 | 6631 | câu |
| `GET /hoc-vien-lop/lich-thi` | TD-QUET | 8 | 29 | 4785 | 1282 | 14 | CX `/hoc-vien-lop/lich-thi?thang=2026-10,2026-11` | 5 | 227 | 6412 | dòng |
| `GET /tong-quan/mock-test` | TD-QUET | 1 | 28 | 2069 | 2069 | 10 | ADMIN `/tong-quan/mock-test` | 3 | 635 | 6207 | dòng |
| `GET /classes/:id/xet-lai` | TD-QUET | 10 | 7 | 72 | 30 | 10 | QL1 `/classes/12/xet-lai` | 199 | 33 | 5970 |  |
| `GET /tong-quan/lop-toi-day` | TD-QUET | 5 | 22 | 3849 | 2663 | 10 | GVCN_TH `/tong-quan/lop-toi-day?ct=ft` | 2 | 664 | 5325 | dòng |
| `POST /ke-hoach-test/dot` | TD-QUET | 1 | 69 | 233 | 233 | 0 | QL1 `/ke-hoach-test/dot` | 22 | 473 | 5126 | câu |
| `PUT /attempts/:id/scores/writing1` | TD-QUET | 1 | 65 | 186 | 186 | 0 | GV21 `/attempts/217/scores/writing1` | 27 | 319 | 5022 | câu |
| `GET /classes/:id/y-thuc` | TD-QUET | 10 | 26 | 165 | 140 | 10 | GVCN `/classes/12/y-thuc` | 36 | 124 | 5022 |  |
| `PUT /regular/attempts/:id/scores/listening` | TD-QUET | 1 | 55 | 93 | 93 | 0 | GV17 `/regular/attempts/367/scores/listening` | 50 | 301 | 4650 | câu |
| `GET /cases/:id` | TD-QUET | 6 | 32 | 27 | 27 | 1103 | QL1 `/cases/578` | 168 | 182 | 4480 | câu quét |
| `GET /tong-quan/lop-toi-day/o` | TD-QUET | 3 | 22 | 2180 | 2177 | 10 | GVCN `/tong-quan/lop-toi-day/o?ct=ft&classId=12&cot=thi-thang-nay` | 2 | 862 | 4355 | dòng |
| `PUT /regular/attempts/:id/scores/speaking` | TD-QUET | 1 | 55 | 97 | 97 | 0 | GV17 `/regular/attempts/367/scores/speaking` | 36 | 248 | 3492 | câu |
| `GET /demo/session` | TD-QUET | 7 | 11 | 109 | 22 | 469 | QL1 `/demo/session` | 151 | 84 | 3365 |  |
| `GET /my-work/cham-speaking` | TD-VIEC | 10 | 12 | 2045 | 292 | 10 | GVS `/my-work/cham-speaking` | 11 | 588 | 3209 | dòng |
| `GET /students/:id/y-thuc` | TD-QUET | 12 | 19 | 24 | 24 | 10 | QL1 `/students/62/y-thuc` | 120 | 91 | 2840 |  |
| `GET /giao-vien/:id/chi-so` | TD-QUET | 10 | 184 | 6861 | 2659 | 10766 | QL5 `/giao-vien/9/chi-so` | 1 | 1247 | 2659 | câu dòng quét |
| `GET /classes/:id/transition` | TD-QUET | 4 | 40 | 553 | 530 | 106 | QL1 `/classes/18/transition` | 5 | 173 | 2652 | câu |
| `PUT /regular/attempts/:id/scores/writing` | TD-QUET | 1 | 66 | 124 | 124 | 0 | GV30 `/regular/attempts/367/scores/writing` | 21 | 312 | 2604 | câu |
| `GET /phan-tich/giao-vien/o` | TD-QUET | 25 | 15 | 1554 | 573 | 986 | QL1 `/phan-tich/giao-vien/o?cn=3&ct=ft&gv=29&cot=ghi-pa` | 4 | 62 | 2294 |  |
| `GET /ref/nguoi` | TD-QUET | 27 | 7 | 68 | 31 | 316 | QL5 `/ref/nguoi?nhom=giao_vien&studentId=62` | 73 | 28 | 2268 |  |
| `GET /phan-tich/hieu-qua-pa` | TD-QUET | 9 | 11 | 1469 | 1072 | 2036 | QL5 `/phan-tich/hieu-qua-pa` | 2 | 50 | 2143 | quét |
| `PUT /attempts/:id/scores/reading` | TD-QUET | 1 | 79 | 210 | 210 | 0 | GV6 `/attempts/217/scores/reading` | 10 | 326 | 2100 | câu |
| `GET /students/:id/skill-board` | TD-QUET | 6 | 26 | 23 | 23 | 10 | QL1 `/students/62/skill-board` | 90 | 166 | 2040 |  |
| `PUT /attempts/:id/scores/listening` | TD-QUET | 1 | 62 | 189 | 189 | 0 | GV21 `/attempts/217/scores/listening` | 9 | 367 | 1701 | câu |
| `GET /classes/:id/can-ho-tro` | TD-QUET | 10 | 9 | 148 | 70 | 10 | QL1 `/classes/18/can-ho-tro` | 24 | 64 | 1678 |  |
| `PUT /classes/:id/bao-cao-ph` | TD-QUET | 1 | 11 | 28 | 28 | 0 | GVCN29 `/classes/12/bao-cao-ph` | 59 | 92 | 1652 |  |
| `GET /notifications` | TD-QUET | 7 | 7 | 128 | 70 | 10 | GVCN `/notifications` | 23 | 58 | 1613 |  |
| `PUT /regular/attempts/:id/scores/reading` | TD-QUET | 1 | 59 | 105 | 105 | 0 | GV30 `/regular/attempts/367/scores/reading` | 14 | 294 | 1470 | câu |
| `GET /giao-vien/:id` | TD-QUET | 4 | 29 | 1468 | 1460 | 281 | QL5 `/giao-vien/29` | 1 | 1047 | 1460 |  |
| `GET /giao-vien/:id/viec` | TD-QUET | 4 | 39 | 1230 | 1229 | 510 | QL1 `/giao-vien/29/viec` | 1 | 1115 | 1229 | câu |
| `GET /students/:id/bai-tren-lop` | TD-QUET | 6 | 11 | 18 | 17 | 10 | GVCN `/students/62/bai-tren-lop` | 72 | 50 | 1200 |  |
| `PUT /attempts/:id/scores/speaking` | TD-QUET | 1 | 63 | 203 | 203 | 0 | GVS43 `/attempts/217/scores/speaking` | 5 | 540 | 1015 | câu |
| `GET /attempts/:id` | TD-QUET | 9 | 26 | 42 | 41 | 10 | QL1 `/attempts/1602` | 24 | 156 | 981 |  |
| `GET /ref/periods` | TD-QUET | 7 | 3 | 28 | 28 | 35 | QL1 `/ref/periods` | 34 | 40 | 952 |  |
| `GET /hoc-vien-lop/ids` | TD-QUET | 7 | 3 | 37 | 17 | 14 | QT `/hoc-vien-lop/ids` | 49 | 24 | 854 |  |
| `GET /attempts` | TD-QUET | 10 | 9 | 49 | 37 | 10 | QL1 `/attempts?studentId=62` | 23 | 53 | 851 |  |
| `GET /classes/:id/y-thuc/lo` | TD-QUET | 3 | 7 | 100 | 100 | 10 | QL1 `/classes/12/y-thuc/lo` | 8 | 83 | 800 |  |
| `GET /ref/period-window` | TD-QUET | 10 | 3 | 13 | 13 | 10 | QL1 `/ref/period-window` | 61 | 30 | 793 |  |
| `GET /classes/:id/xoa-ket-thuc` | TD-QUET | 3 | 16 | 16 | 16 | 1311 | QL1 `/classes/12/xoa-ket-thuc` | 47 | 110 | 752 | quét |
| `GET /classes/:id/bao-cao-ph` | TD-QUET | 12 | 7 | 25 | 25 | 10 | QL1 `/classes/12/bao-cao-ph` | 29 | 56 | 725 |  |
| `GET /classes/:id/phan-tich-lop` | TD-QUET | 10 | 8 | 342 | 334 | 10 | QL1 `/classes/12/phan-tich-lop` | 2 | 100 | 669 |  |
| `GET /ref/classes` | TD-QUET | 10 | 2 | 87 | 30 | 10 | QL5 `/ref/classes` | 20 | 28 | 592 |  |
| `POST /cases/:id/xac-nhan` | TD-QUET | 1 | 88 | 87 | 87 | 0 | GV27 `/cases/903/xac-nhan` | 6 | 362 | 522 | câu |
| `GET /cycles/:id/suggested-mocks` | TD-QUET | 3 | 22 | 48 | 47 | 10 | GVCN `/cycles/564/suggested-mocks` | 11 | 92 | 513 |  |
| `GET /regular/attempts/:id` | TD-QUET | 4 | 22 | 79 | 78 | 83 | QL1 `/regular/attempts/366` | 6 | 127 | 468 |  |
| `GET /highlights` | TD-QUET | 8 | 8 | 389 | 146 | 10 | QL5 `/highlights` | 3 | 74 | 437 |  |
| `GET /lenh-chuyen/ban-giao` | TD-QUET | 4 | 18 | 134 | 132 | 10 | GVCN_TH `/lenh-chuyen/ban-giao?lop=18` | 3 | 99 | 395 |  |
| `POST /violations/nhieu` | TD-QUET | 1 | 37 | 64 | 64 | 0 | QL1 `/violations/nhieu` | 5 | 464 | 320 | câu |
| `GET /ref/branches` | TD-QUET | 7 | 3 | 8 | 7 | 14 | GVCN_TH `/ref/branches` | 43 | 34 | 289 |  |
| `GET /classes/:id/bao-cao-ph/phan` | TD-QUET | 10 | 7 | 20 | 19 | 10 | QL1 `/classes/18/bao-cao-ph/phan?phan=writing` | 14 | 41 | 272 |  |
| `GET /students` | TD-QUET | 7 | 14 | 15 | 14 | 890 | GVCN_TH `/students?q=ng&gioiHan=6&gon=1` | 12 | 608 | 165 |  |
| `GET /tim/giao-vien` | TD-QUET | 10 | 2 | 59 | 16 | 94 | QL5 `/tim/giao-vien?q=ng` | 10 | 13 | 160 |  |
| `GET /ke-hoach-test/tim` | TD-QUET | 4 | 3 | 49 | 49 | 10 | QL1 `/ke-hoach-test/tim?q=minh&branchId=3` | 3 | 15 | 147 |  |
| `GET /classes/:id/phoi-hop-sos` | TD-QUET | 6 | 3 | 2 | 2 | 10 | QL1 `/classes/12/phoi-hop-sos` | 61 | 99 | 122 |  |
| `GET /violations/similar` | TD-QUET | 9 | 7 | 6 | 6 | 10 | QL1 `/violations/similar?studentId=62&category=hoc_tap` | 21 | 36 | 121 |  |
| `GET /violations/:id` | TD-QUET | 9 | 11 | 17 | 17 | 10 | QL1 `/violations/245` | 7 | 90 | 117 |  |
| `GET /ref/teachers` | TD-QUET | 6 | 2 | 61 | 34 | 94 | QL5 `/ref/teachers` | 2 | 16 | 67 |  |
| `GET /tutors/chon` | TD-QUET | 9 | 8 | 7 | 6 | 10 | GVCN `/tutors/chon?studentId=62` | 10 | 30 | 56 |  |
| `GET /cycles/:id` | TD-QUET | 3 | 5 | 4 | 3 | 10 | QL1 `/cycles/894` | 16 | 34 | 53 |  |
| `GET /y-thuc/xu-ly/:id` | TD-QUET | 9 | 13 | 11 | 11 | 10 | QL1 `/y-thuc/xu-ly/65` | 4 | 135 | 43 |  |
| `GET /students/:id/phoi-hop-sos` | TD-QUET | 6 | 6 | 5 | 5 | 10 | QL1 `/students/62/phoi-hop-sos` | 9 | 68 | 42 |  |
| `GET /ref/bang-quy-doi` | TD-QUET | 10 | 2 | 2 | 2 | 10 | QL1 `/ref/bang-quy-doi` | 16 | 25 | 32 |  |
| `GET /cycles/:id/han-sau-thi` | TD-QUET | 9 | 6 | 7 | 5 | 10 | GVCN `/cycles/564/han-sau-thi` | 4 | 41 | 22 |  |
| `GET /auth/info` | TD-QUET | 10 | 1 | 1 | 1 | 10 | QL1 `/auth/info` | 22 | 4 | 22 |  |
| `GET /students/:id/case-topics` | TD-QUET | 9 | 10 | 15 | 15 | 10 | QL1 `/students/62/case-topics` | 1 | 168 | 15 |  |
| `GET /classes/:id/progress` | TD-QUET | 6 | 5 | 5 | 5 | 10 | QL1 `/classes/12/progress` | 3 | 25 | 15 |  |
| `GET /cycles/:id/buoc-tiep` | TD-QUET | 3 | 6 | 5 | 4 | 10 | QL1 `/cycles/894/buoc-tiep` | 3 | 68 | 13 |  |
| `GET /students/:id/lo-trinh` | TD-QUET | 6 | 10 | 13 | 12 | 10 | GVCN `/students/62/lo-trinh` | 1 | 23 | 12 |  |
| `GET /students/:id/s-expert` | TD-QUET | 6 | 5 | 5 | 4 | 10 | GVCN `/students/62/s-expert` | 3 | 27 | 11 |  |
| `GET /ref/routes` | TD-QUET | 10 | 2 | 4 | 4 | 13 | QL1 `/ref/routes` | 2 | 24 | 8 |  |
| `GET /lich-su` | TD-QUET | 44 | 10 | 20 | 7 | 10 | QL1 `/lich-su?loai=o&id=1602` | 1 | 135 | 7 |  |
| `GET /ke-hoach-test/ghi-chu/lich-su` | TD-QUET | 3 | 3 | 2 | 2 | 10 | QL1 `/ke-hoach-test/ghi-chu/lich-su?classId=12` | 2 | 60 | 4 |  |
| `GET /ref/programmes` | TD-QUET | 10 | 1 | 1 | 1 | 10 | QL1 `/ref/programmes` | 2 | 20 | 2 |  |
| `GET /phan-tich/bao-cao` | TD-QUET | 9 | 50 | 21200 | 14908 | 7027 | QL5 `/phan-tich/bao-cao?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09` | 0 |  | 0 | câu dòng quét |
| `GET /tong-quan/chi-nhanh/o` | TD-QUET | 3 | 38 | 20937 | 16093 | 2028 | QL5 `/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong` | 0 |  | 0 | câu dòng quét |
| `GET /tong-quan/ql` | TD-QUET | 6 | 34 | 20649 | 14794 | 5001 | QL5 `/tong-quan/ql?ct=ft` | 0 |  | 0 | câu dòng quét |
| `GET /tong-quan/chi-nhanh` | TD-QUET | 3 | 18 | 16812 | 12679 | 2028 | QL5 `/tong-quan/chi-nhanh` | 0 |  | 0 | dòng quét |
| `GET /xuat-mt/xem-truoc` | TD-QUET | 5 | 8 | 14478 | 6760 | 3083 | QL5 `/xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,` | 0 |  | 0 | dòng quét |
| `GET /hoc-vien-lop/theo-vai` | TD-QUET | 4 | 25 | 12508 | 5925 | 909 | CX `/hoc-vien-lop/theo-vai` | 0 |  | 0 | dòng |
| `GET /tong-quan/hoc-vien` | TD-QUET | 4 | 21 | 11575 | 7281 | 909 | QT `/tong-quan/hoc-vien` | 0 |  | 0 | dòng |
| `GET /phan-tich/bao-cao/o` | TD-QUET | 25 | 74 | 11274 | 5815 | 3996 | QL5 `/phan-tich/bao-cao/o?ct=ft&o=tien-bo:tat-ca&kieu=tuan&tu=202` | 0 |  | 0 | câu dòng quét |
| `GET /tong-quan/quan-ly` | TD-QUET | 3 | 49 | 10705 | 8189 | 4000 | QL5 `/tong-quan/quan-ly` | 0 |  | 0 | câu dòng quét |
| `GET /metrics/do-phu-danh-gia` | TD-QUET | 3 | 22 | 10664 | 7889 | 1023 | QL5 `/metrics/do-phu-danh-gia` | 0 |  | 0 | dòng quét |
| `GET /metrics/hv-sos-hien-tai` | TD-QUET | 6 | 9 | 9878 | 7262 | 1023 | QL5 `/metrics/hv-sos-hien-tai?rows=1` | 0 |  | 0 | dòng quét |
| `GET /metrics/hv-duoi-ky-vong-mon` | TD-QUET | 6 | 9 | 9769 | 7222 | 1023 | QL5 `/metrics/hv-duoi-ky-vong-mon?rows=1&skill=reading` | 0 |  | 0 | dòng quét |
| `GET /signals` | TD-QUET | 3 | 17 | 7823 | 5993 | 3992 | QL5 `/signals` | 0 |  | 0 | dòng quét |
| `GET /phan-tich/tong-hop/o` | TD-QUET | 12 | 17 | 6056 | 2360 | 10 | QL5 `/phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026` | 0 |  | 0 | dòng |
| `GET /metrics/bai-qua-han-nhap-diem` | TD-QUET | 3 | 13 | 6041 | 4509 | 2983 | QL5 `/metrics/bai-qua-han-nhap-diem?rows=1` | 0 |  | 0 | dòng quét |
| `GET /phan-tich/ket-qua-thi` | TD-QUET | 6 | 28 | 5988 | 2425 | 10 | QL5 `/phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-0` | 0 |  | 0 | dòng |
| `GET /tong-quan/gv-tre` | TD-QUET | 4 | 16 | 4978 | 3123 | 2983 | QL5 `/tong-quan/gv-tre?gv=29` | 0 |  | 0 | dòng quét |
| `GET /phan-tich/bao-cao/ket-qua-mt` | TD-QUET | 3 | 11 | 4518 | 3801 | 10 | QL5 `/phan-tich/bao-cao/ket-qua-mt?ct=ft&kieu=tuan&tu=2026-03-02&` | 0 |  | 0 | dòng |
| `GET /classes` | TD-QUET | 13 | 14 | 4241 | 1085 | 10 | QL5 `/classes` | 0 |  | 0 | dòng |
| `GET /giao-vien` | TD-QUET | 6 | 19 | 3571 | 3050 | 10 | QL1 `/giao-vien?cn=3&ct=ft` | 0 |  | 0 | dòng |
| `GET /phan-tich/y-thuc/o` | TD-QUET | 6 | 15 | 3418 | 2554 | 74 | QL5 `/phan-tich/y-thuc/o?dong=tong&cot=vi-pham` | 0 |  | 0 | dòng |
| `GET /phan-tich/y-thuc` | TD-QUET | 3 | 14 | 3182 | 2450 | 74 | QL5 `/phan-tich/y-thuc` | 0 |  | 0 | dòng |
| `GET /metrics/case-xac-dinh-nguyen-nhan-qua-han` | TD-QUET | 3 | 5 | 3049 | 2406 | 1015 | QL5 `/metrics/case-xac-dinh-nguyen-nhan-qua-han` | 0 |  | 0 | dòng quét |
| `GET /phan-tich/thi-that/o` | TD-QUET | 14 | 8 | 2553 | 620 | 1023 | QL5 `/phan-tich/thi-that/o?o=sap-thi&kieu=tuan&tu=2026-07-06&den=` | 0 |  | 0 | dòng quét |
| `GET /phan-tich/ket-qua-thi/o` | TD-QUET | 6 | 6 | 2504 | 1042 | 10 | QL5 `/phan-tich/ket-qua-thi/o?loai=mock&o=dat&kieu=tuan&tu=2026-0` | 0 |  | 0 | dòng |
| `GET /metrics/case-mo` | TD-QUET | 3 | 4 | 2461 | 1931 | 1015 | QL5 `/metrics/case-mo` | 0 |  | 0 | dòng quét |
| `GET /metrics/hv-co-case-mo` | TD-QUET | 3 | 4 | 2461 | 1931 | 1015 | QL5 `/metrics/hv-co-case-mo` | 0 |  | 0 | dòng quét |
| `GET /tong-quan/chi-nhanh-v2/o` | TD-QUET | 9 | 8 | 2062 | 687 | 1903 | QL5 `/tong-quan/chi-nhanh-v2/o?ct=ft&o=vao&kieu=tuan&tu=2026-08-3` | 0 |  | 0 | dòng quét |
| `GET /phan-tich/hieu-qua-pa/o` | TD-QUET | 3 | 11 | 1488 | 1118 | 2036 | QL5 `/phan-tich/hieu-qua-pa/o?dong=tong&cot=pa` | 0 |  | 0 | quét |
| `GET /tong-quan/tvv/em` | TD-QUET | 1 | 18 | 1177 | 1177 | 22 | TVV `/tong-quan/tvv/em` | 0 |  | 0 |  |
| `GET /phan-tich/giao-vien/danh-sach` | TD-QUET | 4 | 9 | 983 | 619 | 990 | QT `/phan-tich/giao-vien/danh-sach?ct=ft` | 0 |  | 0 |  |
| `GET /metrics/vi-pham-theo-nhom` | TD-QUET | 3 | 5 | 903 | 780 | 255 | QL5 `/metrics/vi-pham-theo-nhom` | 0 |  | 0 |  |
| `GET /giao-vien/:id/chi-so/o` | TD-QUET | 12 | 17 | 826 | 549 | 890 | QL1 `/giao-vien/29/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09` | 0 |  | 0 |  |
| `GET /metrics/lop-thieu-gv-mon` | TD-QUET | 3 | 3 | 570 | 425 | 10 | QL5 `/metrics/lop-thieu-gv-mon` | 0 |  | 0 |  |
| `GET /admin/accounts` | TD-QUET | 1 | 8 | 483 | 483 | 1227 | QT `/admin/accounts` | 0 |  | 0 | quét |
| `GET /ke-hoach-test/thuong/:id` | TD-QUET | 8 | 21 | 446 | 321 | 112 | GVS `/ke-hoach-test/thuong/18` | 0 |  | 0 |  |
| `GET /regular/classes/:id/sheet` | TD-QUET | 7 | 15 | 391 | 390 | 83 | QL1 `/regular/classes/18/sheet` | 0 |  | 0 |  |
| `GET /tong-quan/chi-nhanh/sos23` | TD-QUET | 4 | 8 | 349 | 349 | 10 | QL1 `/tong-quan/chi-nhanh/sos23?branchId=3&ids=2,3,4,5,6,7,8,11,3` | 0 |  | 0 |  |
| `GET /students/:id/hoc-lai/lop-dich` | TD-QUET | 3 | 11 | 292 | 291 | 1027 | QL1 `/students/62/hoc-lai/lop-dich` | 0 |  | 0 | quét |
| `GET /chuyen-lop/lop-dich` | TD-QUET | 4 | 7 | 288 | 267 | 1027 | QL1 `/chuyen-lop/lop-dich?studentId=62` | 0 |  | 0 | quét |
| `GET /hoc-vien-lop/luu-tru` | TD-QUET | 14 | 6 | 245 | 160 | 10 | QL5 `/hoc-vien-lop/luu-tru` | 0 |  | 0 |  |
| `GET /hoc-vien-lop/phan-cong` | TD-QUET | 4 | 9 | 190 | 190 | 316 | QL1 `/hoc-vien-lop/phan-cong?branchId=3` | 0 |  | 0 |  |
| `GET /admin/permissions/matrix` | TD-QUET | 1 | 11 | 160 | 160 | 2302 | QT `/admin/permissions/matrix` | 0 |  | 0 | quét |
| `GET /classes/:id/transition/lop-khac` | TD-QUET | 3 | 5 | 155 | 155 | 10 | QL1 `/classes/18/transition/lop-khac` | 0 |  | 0 |  |
| `GET /admin/accounts/:id/xoa` | TD-QUET | 1 | 11 | 124 | 124 | 118618 | QT `/admin/accounts/29/xoa` | 0 |  | 0 | quét |
| `GET /classes/:id/tong-ket` | TD-QUET | 3 | 5 | 119 | 119 | 10 | QL1 `/classes/6/tong-ket` | 0 |  | 0 |  |
| `GET /classes/:id/sua-ca-lop` | TD-QUET | 3 | 8 | 103 | 86 | 316 | QL5 `/classes/12/sua-ca-lop` | 0 |  | 0 |  |
| `GET /classes/:id/issue-board/o` | TD-QUET | 12 | 8 | 99 | 68 | 10 | QL1 `/classes/12/issue-board/o?category=overall&cot=overall&kind=` | 0 |  | 0 |  |
| `GET /ref/users` | TD-QUET | 10 | 2 | 86 | 22 | 94 | QL5 `/ref/users` | 0 |  | 0 |  |
| `GET /classes/:id/ket-qua-dau-ra` | TD-QUET | 6 | 7 | 81 | 81 | 10 | QL1 `/classes/12/ket-qua-dau-ra` | 0 |  | 0 |  |
| `GET /classes/:id/violations` | TD-QUET | 6 | 6 | 62 | 62 | 10 | QL1 `/classes/12/violations` | 0 |  | 0 |  |
| `GET /tutors/go-tay` | TD-QUET | 1 | 2 | 60 | 60 | 10 | QT `/tutors/go-tay` | 0 |  | 0 |  |
| `GET /admin/nhat-ky` | TD-QUET | 15 | 3 | 53 | 6 | 10 | QT `/admin/nhat-ky` | 0 |  | 0 |  |
| `GET /students/:id/hanh-trinh` | TD-QUET | 12 | 20 | 51 | 50 | 10 | GVCN `/students/62/hanh-trinh` | 0 |  | 0 |  |
| `GET /admin/programmes` | TD-QUET | 3 | 30 | 50 | 41 | 318 | QT `/admin/programmes` | 0 |  | 0 |  |
| `GET /tim/hoc-vien` | TD-QUET | 10 | 2 | 41 | 40 | 10 | QL1 `/tim/hoc-vien?q=ng` | 0 |  | 0 |  |
| `GET /ban-giao-gv/:id` | TD-QUET | 2 | 5 | 41 | 41 | 10 | QL5 `/ban-giao-gv/2` | 0 |  | 0 |  |
| `GET /classes/:id/issue-board` | TD-QUET | 6 | 5 | 36 | 36 | 10 | QL1 `/classes/12/issue-board?category=listening` | 0 |  | 0 |  |
| `GET /tutors` | TD-QUET | 3 | 6 | 34 | 15 | 14 | QT `/tutors` | 0 |  | 0 |  |
| `GET /classes/:id/chu-da-ghi` | TD-QUET | 10 | 5 | 33 | 24 | 10 | QL1 `/classes/18/chu-da-ghi?tu=2026-06-01&den=2026-09-28` | 0 |  | 0 |  |
| `GET /classes/:id/teachers` | TD-QUET | 3 | 6 | 27 | 27 | 316 | QL1 `/classes/12/teachers` | 0 |  | 0 |  |
| `GET /classes/:id/bao-cao-ph/xuat` | TD-QUET | 8 | 14 | 26 | 26 | 10 | QL1 `/classes/12/bao-cao-ph/xuat?kieu=pdf` | 0 |  | 0 |  |
| `GET /lenh-chuyen/:id/ban-giao` | TD-QUET | 3 | 8 | 25 | 25 | 10 | QL1 `/lenh-chuyen/138/ban-giao` | 0 |  | 0 |  |
| `GET /hoc-vien-lop/em/:id` | TD-QUET | 6 | 20 | 24 | 22 | 10 | GVCN `/hoc-vien-lop/em/62` | 0 |  | 0 |  |
| `POST /students/:id/transfer` | TD-QUET | 1 | 15 | 24 | 24 | 0 | QL1 `/students/62/transfer` | 0 |  | 0 |  |
| `GET /ref/people` | TD-QUET | 3 | 2 | 21 | 21 | 94 | QL1 `/ref/people` | 0 |  | 0 |  |
| `GET /students/:id/violations` | TD-QUET | 9 | 10 | 19 | 19 | 10 | QL1 `/students/62/violations` | 0 |  | 0 |  |
| `GET /metrics/vi-pham-tong` | TD-QUET | 3 | 3 | 18 | 18 | 10 | QL1 `/metrics/vi-pham-tong?classId=12` | 0 |  | 0 |  |
| `POST /yeu-cau/:id/duyet` | TD-QUET | 1 | 30 | 18 | 18 | 0 | QL40 `/yeu-cau/233/duyet` | 0 |  | 0 |  |
| `GET /classes/:id/issue-board/needs-evaluation` | TD-QUET | 9 | 3 | 17 | 17 | 10 | QL1 `/classes/12/issue-board/needs-evaluation?category=academic` | 0 |  | 0 |  |
| `GET /admin/routes` | TD-QUET | 3 | 14 | 17 | 9 | 4313 | QT `/admin/routes` | 0 |  | 0 | quét |
| `GET /students/:id/chuyen-lop` | TD-QUET | 6 | 12 | 16 | 10 | 10 | QL1 `/students/62/chuyen-lop?toClassId=18` | 0 |  | 0 |  |
| `GET /lo-trinh/:id/tong-ket` | TD-QUET | 3 | 9 | 14 | 13 | 10 | QL1 `/lo-trinh/894/tong-ket` | 0 |  | 0 |  |
| `GET /cycles/:id/tuan-day` | TD-QUET | 4 | 8 | 12 | 11 | 10 | GVS `/cycles/1003/tuan-day` | 0 |  | 0 |  |
| `GET /followups/:id/sua` | TD-QUET | 3 | 14 | 12 | 11 | 331 | QL1 `/followups/179/sua` | 0 |  | 0 |  |
| `GET /students/:id/lich-su-sua` | TD-QUET | 4 | 9 | 11 | 8 | 10 | GVCN `/students/62/lich-su-sua` | 0 |  | 0 |  |
| `GET /meeting/board` | TD-QUET | 3 | 6 | 9 | 9 | 15 | QL1 `/meeting/board` | 0 |  | 0 |  |
| `GET /interventions/luoi-ket-qua` | TD-QUET | 5 | 3 | 8 | 8 | 10 | QL1 `/interventions/luoi-ket-qua?ids=496,497,498` | 0 |  | 0 |  |
| `GET /students/:id/trang-thai/xem-truoc` | TD-QUET | 6 | 8 | 8 | 7 | 1763 | GVCN `/students/62/trang-thai/xem-truoc?ketThuc=1` | 0 |  | 0 | quét |
| `GET /tong-quan/tvv/o` | TD-QUET | 1 | 3 | 8 | 8 | 10 | TVV `/tong-quan/tvv/o?o=bao-ph` | 0 |  | 0 |  |
| `GET /classes/:id/gop-y` | TD-QUET | 10 | 5 | 7 | 7 | 10 | QL1 `/classes/12/gop-y` | 0 |  | 0 |  |
| `GET /admin/don-vi` | TD-QUET | 3 | 2 | 7 | 7 | 15 | QL1 `/admin/don-vi` | 0 |  | 0 |  |
| `GET /students/:id/cycles` | TD-QUET | 9 | 5 | 7 | 5 | 10 | GVCN `/students/62/cycles` | 0 |  | 0 |  |
| `GET /classes/:id/ky-vong` | TD-QUET | 3 | 4 | 6 | 6 | 10 | QL1 `/classes/33/ky-vong` | 0 |  | 0 |  |
| `GET /hoc-vien-lop/lich-thi/:id/lich-su` | TD-QUET | 3 | 7 | 6 | 5 | 10 | GVCN `/hoc-vien-lop/lich-thi/564/lich-su` | 0 |  | 0 |  |
| `GET /students/:id/handover` | TD-QUET | 9 | 5 | 6 | 4 | 10 | GVCN `/students/62/handover` | 0 |  | 0 |  |
| `GET /auth/branches` | TD-QUET | 10 | 2 | 6 | 6 | 14 | QL1 `/auth/branches` | 0 |  | 0 |  |
| `GET /me/profile` | TD-QUET | 10 | 4 | 6 | 4 | 10 | QL1 `/me/profile` | 0 |  | 0 |  |
| `GET /admin/chi-nhanh` | TD-QUET | 3 | 2 | 6 | 6 | 14 | QL1 `/admin/chi-nhanh` | 0 |  | 0 |  |
| `GET /students/:id/xoa` | TD-QUET | 3 | 5 | 5 | 4 | 7209 | QL1 `/students/62/xoa` | 0 |  | 0 | quét |
| `GET /admin/bang-quy-doi` | TD-QUET | 3 | 2 | 5 | 5 | 13 | QL1 `/admin/bang-quy-doi` | 0 |  | 0 |  |
| `GET /thung-rac/dem` | TD-QUET | 7 | 2 | 2 | 2 | 10 | QL1 `/thung-rac/dem?loai=hoc_vien` | 0 |  | 0 |  |
| `GET /thung-rac` | TD-QUET | 7 | 2 | 2 | 2 | 10 | QL1 `/thung-rac?loai=hoc_vien` | 0 |  | 0 |  |
| `GET /classes/:id/danh-gia-dau-ra` | TD-QUET | 4 | 4 | 2 | 2 | 10 | QL1 `/classes/18/danh-gia-dau-ra` | 0 |  | 0 |  |
| `GET /tasks` | TD-QUET | 7 | 3 | 1 | 1 | 10 | QL1 `/tasks` | 0 |  | 0 |  |
| `GET /mgmt-tasks` | TD-QUET | 7 | 2 | 1 | 1 | 10 | QL1 `/mgmt-tasks` | 0 |  | 0 |  |
| `GET /bao-cao-ph/lop` | TD-QUET | 3 | 1 | 1 | 1 | 10 | QL1 `/bao-cao-ph/lop?branchId=3` | 0 |  | 0 |  |
| `GET /admin/cau-hinh-case-sos` | TD-QUET | 3 | 3 | 1 | 1 | 10 | QL1 `/admin/cau-hinh-case-sos` | 0 |  | 0 |  |
| `GET /admin/cau-hinh/han` | TD-QUET | 3 | 2 | 1 | 1 | 10 | QL1 `/admin/cau-hinh/han` | 0 |  | 0 |  |
| `GET /admin/cau-hinh/ky-vong-ft` | TD-QUET | 3 | 2 | 1 | 1 | 10 | QL1 `/admin/cau-hinh/ky-vong-ft` | 0 |  | 0 |  |
| `GET /admin/cau-hinh/nguong-thuong` | TD-QUET | 3 | 2 | 1 | 1 | 10 | QL1 `/admin/cau-hinh/nguong-thuong` | 0 |  | 0 |  |
| `GET /tutors/dem` | TD-QUET | 1 | 2 | 1 | 1 | 10 | QT `/tutors/dem` | 0 |  | 0 |  |
| `GET /admin/mo-sua-lich-test` | TD-QUET | 1 | 1 | 1 | 1 | 10 | QT `/admin/mo-sua-lich-test` | 0 |  | 0 |  |
