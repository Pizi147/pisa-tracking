# GIAM-COMPUTE-2 — compute Netlify, tốc độ, dòng đọc (log 24 h 20/11 20:42 → 21/11 20:4x)

Chủ SP 21/11: "… CÓ CHỖ NÀO GIẢM ĐƯỢC COMPUTE hay không … khoảng 3-4 credit mỗi ngày chỉ cho mỗi việc compute". Log thật `D:\Github\netlify-api-24h.txt`
(không commit) là **bản chính đang chạy = mã deploy 12/11** (#1478). Mọi PR từ 12/11 tới nay (TOC-DO-1711, BADGE-NHE, OV6-DOC-CHON, TD-GHI, sổ nghĩa vụ chia
chi nhánh, AUDIT-2111…) **chưa có trên bản chính**. Đo main bằng bản chép 12/11 (`pisa-pisatracking-261107-…-2026-11-12-0112.sqlite`, migrate bằng main
`06e98de98`), 10 vai × mọi GET = 1 752 lượt (`scripts/do-toan-bo-ds.mjs` + `do-ban-chep.mjs`, cách đo như `2026-11-17-toc-do/do-toan-bo.md` mục 1).

## 1. Compute tính thế nào

- Netlify gói credit: **compute = thời gian chạy hàm × bộ nhớ cấp, 10 credit / GB-giờ**; bộ nhớ mặc định **1 024 MB và KHÔNG hạ được** (chỉ tăng lên 2–4 GB ở gói
  Pro / Enterprise). Lệnh gọi hàm còn tính "web requests": **2 credit / 10 000 request** (cả tệp tĩnh không nằm trong cache trình duyệt).
- ⇒ **1 giây hàm = 0,0028 credit**; 100 s / ngày ≈ 0,28 credit / ngày ≈ 8 credit / tháng. Muốn giảm compute chỉ có cách **bớt giây chạy hàm** (bộ nhớ thật dùng
  140–460 MB, nhưng tính tiền theo 1 GB cấp).
- Log: Duration 4 339 lần · **1 258 s** + khởi động lạnh 262 lần · **149 s** = **1 407 s ≈ 3,9 credit / ngày** (3,5 nếu Netlify không tính Init — tài liệu không
  nói rõ) — khớp "3–4 credit". Web request của hàm: 4 339 × 2 / 10 000 ≈ **0,87 credit / ngày** nữa.
- Hàm và Turso cùng vùng Ohio (`aws-us-east-2`) — không lợi gì từ đổi vùng.

**Thời gian đi đâu** (hồi quy 3 892 GET của log, bỏ lượt mất kết nối): `ms ≈ 41 + 3,2 × câu + 0,20 × dòng` — 58 % thời gian GET là theo **dòng trả**, 26 % theo
**số câu**, 16 % phần cố định mỗi request (Lambda + Express + câu phiên). ⇒ giảm dòng đọc Turso cũng là giảm compute (1 000 dòng ≈ 0,2 s hàm).

## 2. Phân rã log (bản chính 12/11)

| nhóm | lần / ngày | giây / ngày | % | ghi chú |
|---|---:|---:|---:|---|
| `GET /my-work` | 386 | 372 (gồm Init 12) | 26 | 47 câu · 3 353 dòng TB; một lần 218 câu |
| `GET /students` (ô tìm thanh trên) | 61 | 75 | 5 | **331 câu TB, tới 3 237 câu / 10,7 s** — bản cũ đọc kết quả từng em khớp |
| `GET /classes/:id/cham` (lưới lớp) | 341 | 94 (Init 47) | 7 | **81 / 262 lần khởi động lạnh** — xem mục 4 |
| `GET /cham/lich-test/qua-han` | 114 | 70 | 5 | 10 câu nhưng 1 536 dòng |
| `/hoc-vien-lop` · `hai-khoi` · `viec-theo-em` · `/cases/:id` | 53 · 59 · 95 · 218 | 60 · 60 · 47 · 44 | 15 | |
| đường ghi (POST / PUT / PATCH / DELETE) | 437 | 125 | 9 | 55–110 câu / lần (lưu điểm, Kết quả PA, Case) |
| khởi động lạnh (Init) | 262 | 149 | 11 | Init TB 567 ms |
| cron `doi-chieu-so` | 5 | 30 | 2 | bản cũ: mỗi lượt cả 5 chi nhánh ("cn":5) — **5 lần / đêm, không phải mỗi giờ** |
| lần thử lại do mất luồng Turso | 300 | ~30 | 2 | "stream not found"; mỗi lần thêm ~100 ms (p50 có thử lại − không) |
| lượt quét nền (lệnh tới hạn, yêu cầu, đổi phân công) | ~114 | ~25 | 2 | ~21 câu + ~1 000 dòng mỗi lượt, tối đa 1 lượt / 60 s toàn hệ thống |

## 3. Sau khi deploy main (chưa đổi gì thêm)

Mô hình hồi quy × số câu / dòng đo trên bản chép (cùng tần suất log): **GET 1 052 → 917 s (−13 %)**; dòng trả / ngày **2,90 → 2,70 triệu**. Các đường đổi nhiều:

| đường | log 12/11 | main | đã sửa bởi |
|---|---|---|---|
| `GET /students` | 331 câu · 75 s / ngày | 4 câu · ~1 s | OV6-DOC-CHON (`gioiHan=6&gon=1`) |
| `GET /hoc-vien-lop` | 72 câu | 47 câu | TD-HVL |
| `GET /classes/:id/diem-theo-luot` · `/yeu-cau/dem` · `phoi-hop-sos` | 13 · 11 · 13 câu | 5 · 3 · 3 câu | TD-QUET, TD-CHAM |
| cron `doi-chieu-so` | 5 × ~6 s | 5 × một chi nhánh (~1/5 việc) | sổ nghĩa vụ chia lượt (`cnCuaLuot`) |
| `GET /my-work` | mỗi khối gắn > 10 s là gọi lại | dùng lại bản đã nạp 5 phút | BADGE-NHE (`f7c18f52a`, AUDIT-1611 17/11) — chưa đo được tần suất mới |
| hồ sơ lớp | 6–7 GET song song (overview, roster, điểm, Xét lại, việc…) | 2 GET gộp `/classes/:id/ho-so` | TD-QUET (đề xuất 2) — bớt khởi động lạnh của cụm hồ sơ lớp (78 / ngày) |

Ước tổng sau deploy: **~1 407 → ~1 150–1 200 s / ngày ≈ 3,2–3,3 credit** (chưa tính BADGE-NHE — mỗi 30 % lần gọi `/my-work` bớt ≈ −95 s ≈ −0,26 credit).
Deploy là bước lớn nhất còn lại; PR dưới và mục 5 là phần thêm.

## 4. Khởi động lạnh — đo, không sửa cấu hình

- Mỗi request ĐỒNG THỜI cần một máy Lambda riêng; máy mới = Init ~0,57 s. Gom request theo cụm 1,5 s: 262 lần lạnh = **88 cụm Lịch Test** (mở nhiều lưới lớp
  cùng lúc — "Mở tất cả lớp" được nhớ theo tuần, mỗi lần vào trang bắn ~8 GET `/classes/:id/cham` song song; 235 / 341 GET `/cham` nằm trong 29 cụm như vậy) ·
  **78 cụm hồ sơ lớp** (main đã gộp) · 30 lúc mở app · 66 khác.
- Gói hàm 5,11 MB (lớn nhất: `iconv-lite` 543 KB — body-parser cần; mã nghiệp vụ ~3,5 MB; từ điển `en` đã ra khỏi gói 13/11). **Minify** → 3,42 MB nhưng nạp chỉ
  nhanh hơn ~15 ms / lần (máy dev 170 → 155 ms) ≈ 10 s / ngày, mà phải tự gói hàm (đổi đường deploy) → **không làm**.
- Bộ nhớ hàm: không hạ dưới 1 024 MB được (mục 1) → **không có cấu hình nào giảm compute**.
- Mất luồng Turso: 300 lần / ngày × ~0,1 s ≈ 30 s. Mở lại chủ động khi rỗi chỉ bớt một vòng hỏng (~40 ms × 300 = 12 s), rủi ro mở lại thừa → không làm
  (như TURSO-LOG-1311 mục 4).

## 5. Làm ngay (không đổi hành vi / giao diện / luật)

| PR | việc | đo trên bản chép (JSON 1 752 / 1 752 y hệt) | ước / ngày |
|---|---|---|---|
| **GIAM-COMPUTE-2a** (máy chủ) | `/my-work` (và mọi nơi dùng `myWork`: hồ sơ lớp "việc của tôi", `/giao-vien/:id/viec`…): câu "Ghi kết quả PA" và câu "Báo PH qua TVV" **lọc trước trong SQL** đúng những dòng JS đã bỏ — trước MỌI người xem đọc PA tới hạn của CẢ hệ thống (292 dòng cho cả GV một lớp) và Báo PH chờ của cả hệ thống (53 dòng); kéo theo câu nạp phạm vi em (198 dòng). "Tất cả" của QL giữ nguyên (chỉ thêm lọc chi nhánh như JS) | GV `/my-work` **938 → 513 dòng**, GVCN 989 → 551, QL 1 CN 1 192 → 716; hồ sơ lớp `viec-theo-em` GV 503 → 162; câu không đổi | ~−116 nghìn dòng trả (~−3,5 triệu / tháng), ~−25 s hàm ≈ −0,07 credit |

Đã soát và **không còn câu lặp y hệt đáng kể** ở GET trên main (bộ nhớ request TD2 / TD-GHI làm rồi): lặp nhiều nhất `/cases/:id` 1 câu tên người / lần
(218 câu / ngày ≈ 1 s) — không đáng một PR. Quét nền ~2 % câu. Câu chậm `qua-han` / `lich-test` / `hoc-vien-lop` đọc đúng dữ liệu cần tính (TD-CHAM,
TD-HVL đã gọt) — bớt nữa phải đổi cách tính (mục 6).

## 6. Cần chủ SP chọn (đổi hành vi / giao diện — chưa làm)

| # | việc | khuyến nghị | tiết kiệm ước | đổi gì người dùng thấy |
|---|---|---|---|---|
| C1 | **Lịch Test tải lưới lớp khi cuộn tới** — hàng lớp đang mở mà nằm ngoài màn hình thì chưa gọi `/classes/:id/cham`, cuộn tới mới tải (khung chờ ngắn). Phương án khác: gộp N lưới một GET (một máy, chậm hơn ~1 s khi mở nhiều lớp) — không khuyên | **Làm** | ~160 GET + ~70 khởi động lạnh / ngày ≈ **−60 s ≈ −0,17 credit** (+ −0,03 credit web request) | lưới dưới màn hình hiện khung chờ khi cuộn tới |
| C2 | ~~Gộp `/my-work` + `/tong-quan/lop-toi-day/hai-khoi` ở trang đầu GV~~ — **không cần** (soát lại 21/11): trên main trang đầu GV chuyển thẳng sang Công việc (GD-1), `hai-khoi` chỉ còn ở hồ sơ GV của chính mình (`?gon=1`); 59 lần / ngày trong log là bản 12/11, deploy là hết | — | ~−40 s / ngày tự có khi deploy | — |
| C3 | Ô tìm khi gõ (`/tutors/chon` 255 lần, Ctrl K, ô chọn người): chờ 400 ms thay 250 ms | Không làm | ~−5 s, −0,02 credit | gợi ý hiện chậm hơn một chút |
| C4 | `/my-work` vẫn ~1/3 compute sau deploy (badge, Công việc, trang đầu, hồ sơ lớp; tải lại sau mỗi lần mình ghi để việc xong biến mất). Bớt thêm phải đổi luồng (vd sau khi ghi chỉ gỡ dòng tại chỗ, tải lại nền ≥ 5 phút) | **Chờ** — đo lại sau deploy (BADGE-NHE) rồi mới quyết | mỗi 10 % lần gọi ≈ −32 s | việc người khác giao hiện chậm hơn |

Tổng nếu deploy + 2a + C1: **~3,9 → ~2,9–3,0 credit / ngày** (thêm BADGE-NHE thật có thể còn ~2,7). Phần còn lại là thời gian chờ Turso của các trang
người dùng mở thật — giảm tiếp là bớt tính năng / số liệu trên trang, không còn đường "miễn phí".

## Cách chạy lại

```bash
npm run build:server
cp <bản chép 12/11> a.sqlite && PISA_DB=a.sqlite node dist-server/server/src/migrate/run.js
node scripts/do-toan-bo-ds.mjs a.sqlite ds.json      # DUONG_DO có vai mới (Head, BPXL): vai không có tài khoản đo thì bỏ qua
node scripts/do-ban-chep.mjs a.sqlite ds.json w       # lượt ấm
PISA_IN_JSON=1 node scripts/do-ban-chep.mjs w.sqlite ds.json truoc   # trước / sau: hai bản dựng, hai bản chép cùng gốc
python -I scripts/do-toan-bo-so.py truoc.json sau.json
python -I scripts/do-toan-bo-bang.py truoc.json <log 24h> bang.md
```
