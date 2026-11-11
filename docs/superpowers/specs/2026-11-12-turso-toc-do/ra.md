# TURSO-1211 — rà dòng đọc Turso + tốc độ (12/11)

Chủ SP 12/11: rà lại toàn bộ chuyện giảm dòng đọc Turso và tốc độ website, rồi làm luôn. Main `3c6196810` (sau #1424).

## Cách đo

- **Bản chép thật**: `D:\Github\pisa-mig\mig.sqlite` (07/11) chép ra thư mục tạm, `npm run migrate` lên main. Lần gọi đầu sau migrate chạy bù 4 ngày việc nền
  (lệnh chuyển lớp tới hạn, dời lịch hết hạn, chuông) — 1 700 câu một lần, không tính vào bảng.
- **Phía web** (bản build thật, `vite preview`, không StrictMode): 6 tài khoản thật (GVCN, QL, TVV, CX, Admin, Quản trị) mở lần lượt các trang chính, ghi mọi request
  (`PISA_DEM_SQL=1`). Ra bộ đường mỗi trang gọi lúc mở.
- **Phía máy chủ**: `scripts/do-ban-chep.mjs` (mới, PR này) — mọi tài khoản đang hoạt động (85; vai theo quyền cao nhất, góc nhìn đúng vai) gọi HTTP thật đúng bộ đường đó,
  `BAN_CHINH=1`; ghi mọi câu SQL + tham số. `scripts/do-it.py` chạy lại từng câu trên bản chép: **dòng trả**, **dòng quét cả bảng** (FULLSCAN_STEP), bước máy ảo.
- Turso tính MỌI dòng đi qua (cả dòng chỉ mục) — "dòng trả + dòng quét cả bảng" là **cận dưới**; Turso thật cao hơn (06/11: ước ~10 triệu ↔ thật ~40 triệu / ngày).
- **Tần suất / ngày (giả định, chưa có log thật)**: GV mở Tổng quan 8, Công việc 6, hồ sơ lớp 4, hồ sơ HV 4, Test 3, Học viên 2 · QL Tổng quan 6, Công việc 4, Học viên 3,
  Test 2, Phân tích 2 · Quản trị một nửa QL · Admin Tổng quan 5, Test 4, Công việc 3, Học viên 3 · TVV Tổng quan 5, Học viên 4 · CX Tổng quan 3, Học viên 2, Phân tích 1.

## Bảng trang × vai (bản chép thật, TB một lần mở trên các tài khoản của vai; trước → sau PR-A + PR-B)

| vai · trang | TK × lần/ngày | câu | dòng trả | quét cả bảng | triệu dòng / ngày |
|---|---|---|---|---|---|
| GV · Tổng quan | 46 × 8 = 368 | 68 → 68 | 3 329 → 3 329 | 2 081 → 841 | 1,99 → 1,53 |
| QL · Tổng quan | 9 × 6 = 54 | 145 → 120 | 15 597 → 12 990 | 9 078 → 3 949 | 1,33 → 0,91 |
| Quản trị · Tổng quan | 5 × 3 = 15 | 147 → 122 | 33 388 → 30 133 | 18 971 → 12 689 | 0,79 → 0,64 |
| TVV · Học viên | 12 × 4 = 48 | 94 → 93 | 11 609 → 11 563 | 4 482 → 2 909 | 0,77 → 0,69 |
| GV · Công việc | 46 × 6 = 276 | 25 → 25 | 1 107 → 1 107 | 1 375 → 461 | 0,69 → 0,43 |
| GV · hồ sơ lớp | 36 × 4 = 144 | 101 → 101 | 1 838 → 1 838 | 1 782 → 757 | 0,52 → 0,37 |
| Admin · Tổng quan | 9 × 5 = 45 | 51 → 51 | 9 025 → 9 025 | 1 517 → 1 517 | 0,47 → 0,47 |
| Admin · Học viên | 9 × 3 = 27 | 60 → 60 | 11 717 → 11 717 | 1 822 → 1 140 | 0,37 → 0,35 |
| GV · Test | 46 × 3 = 138 | 23 → 23 | 2 026 → 2 026 | 476 → 476 | 0,35 → 0,35 |
| CX · Tổng quan | 4 × 3 = 12 | 58 → 58 | 21 125 → 21 125 | 5 152 → 4 260 | 0,32 → 0,30 |
| CX · Học viên | 4 × 2 = 8 | 111 → 111 | 29 076 → 29 076 | 6 280 → 4 801 | 0,28 → 0,27 |
| TVV · Tổng quan | 12 × 5 = 60 | 29 → 30 | 1 868 → 1 914 | 2 738 → 1 352 | 0,28 → 0,20 |
| QL · Công việc | 9 × 4 = 36 | 46 → 46 | 3 620 → 3 620 | 3 914 → 1 625 | 0,27 → 0,19 |
| GV · Học viên | 46 × 2 = 92 | 57 → 57 | 2 049 → 2 049 | 801 → 267 | 0,26 → 0,21 |
| QL · Học viên | 9 × 3 = 27 | 72 → 72 | 7 829 → 7 829 | 1 575 → 893 | 0,25 → 0,24 |
| Admin · Test | 9 × 4 = 36 | 27 → 27 | 5 838 → 5 838 | 1 160 → 1 160 | 0,25 → 0,25 |
| Quản trị · Công việc | 5 × 2 = 10 | 47 → 47 | 8 019 → 8 019 | 5 441 → 3 152 | 0,13 → 0,11 |
| Admin · Công việc | 9 × 3 = 27 | 15 → 15 | 3 271 → 3 271 | 754 → 754 | 0,11 → 0,11 |
| GV · hồ sơ HV | 36 × 4 = 144 | 98 → 98 | 137 → 137 | 509 → 353 | 0,09 → 0,07 |
| QL · Phân tích | 9 × 2 = 18 | 41 → 41 | 3 745 → 3 745 | 1 378 → 1 378 | 0,09 → 0,09 |
| QL · Test | 9 × 2 = 18 | 26 → 26 | 3 205 → 3 205 | 640 → 640 | 0,07 → 0,07 |
| Quản trị · Test | 5 × 1 = 5 | 28 → 28 | 8 504 → 8 504 | 4 497 → 4 497 | 0,07 → 0,07 |
| Quản trị · Học viên | 5 × 1 = 5 | 71 → 71 | 8 954 → 8 954 | 1 917 → 1 235 | 0,05 → 0,05 |
| CX · Phân tích | 4 × 1 = 4 | 44 → 44 | 7 195 → 7 195 | 1 744 → 1 744 | 0,04 → 0,04 |
| Quản trị · Phân tích | 5 × 1 = 5 | 41 → 41 | 4 902 → 4 902 | 1 668 → 1 668 | 0,03 → 0,03 |
| **Tổng (cận dưới)** | | | | | **9,87 → 8,06** |

Tốc độ máy chủ (máy dev, file cục bộ — Turso cộng thêm ~1 vòng mạng mỗi câu): TB 14–250 ms một đường; chậm nhất Công việc "Tất cả" QL / Quản trị 186–201 ms,
Học viên Quản trị 250 ms. Trên Turso thời gian ≈ số câu × vòng mạng → **bớt câu = nhanh hơn + bớt compute Netlify**.

## Phát hiện — xếp mục to trước

| # | Việc | Tiết kiệm ước / ngày | Rủi ro | Tệp |
|---|---|---|---|---|
| A | **7 chỉ mục** cho các câu quét cả bảng (bảng dưới) — không đổi câu, JSON y hệt (1 019 / 1 019 lượt gọi, bản chép thật) | **−1,6 triệu** (quét 2,50 → 0,89 triệu); 9 958 câu khác nhau chạy lại: 0 câu tăng | Thấp: chỉ `CREATE INDEX IF NOT EXISTS`; ba chỉ mục PA khoá `id` và `loTrinhChoKetQuaThi` xếp lại theo (em, lộ trình) để GIỮ thứ tự dòng cũ | `server/src/migrate/prTurso1211.ts` (mới), `migrate.ts`, `schema.sql`, `loTrinh/thiThat.ts` |
| B | **Tổng quan QL · thẻ Giáo viên** đọc đủ `/phan-tich/giao-vien` (41–85 câu, 4,5 k trả + 2–10 k quét) dù thẻ chỉ dùng Việc · Chấm · Đạt kỳ vọng (+ Tiến bộ ở tab Học thuật FT) → gọi `v2=1` (15 câu, ~1,4 k trả) trừ tab Học thuật FT | **−0,2 triệu** (đo: Tổng quan QL 1,07 → 0,91, Quản trị 0,70 → 0,64 sau A); Tổng quan QL TB 145 → 120 câu, CP 88 → 15 câu cho thẻ | Thấp: cùng hàm, cùng số; chỉ bỏ phần thẻ không đọc | `web/src/modules/worklist/TongQuanV5.tsx` |
| C | **Học viên & Lớp** mở trang gọi 2–3 request cùng phạm vi: danh sách + "Đang SOS" (chỉ để hiện SỐ trên tab) + (TVV / CX) `theo-vai` — mỗi request tính lại lượt / điểm | **PR mục C** (SOS cùng request, `kem=sos`): Học viên mọi vai 1,06 → 0,84 triệu (**−0,22 triệu**), bớt 1 request / lần mở; JSON 76 / 76 tài khoản y hệt. Gộp thêm `theo-vai` (TVV / CX, ~−0,2 triệu) chưa làm: `theo-vai` không theo ô tìm, gộp thì mỗi lần gõ tìm tính lại | Vừa: đổi API trang, cần phép kiểm số = danh sách | `server/src/classes/hocVienLop.ts`, `hocVienSos.ts`, `StudentsPage.tsx` |
| D | **Câu phiên** (mỗi request 1 câu: quyền + phân công + mốc) — ~700 bước máy ảo / lần, GV nhiều phân công đọc ~100–500 dòng chỉ mục | ~0,5–1 triệu (×15–20 k request) — chưa đo được dòng chỉ mục | Cao (quyền) → **chỉ ghi, không làm**: nhớ principal theo tiến trình cần khoá phiên bản quyền | `server/src/auth.ts` |
| E | `hvCuaToi` (Tổng quan TVV / CX, Học viên TVV / CX): `sos_cases` SCAN (`substr(created_at,1,10) >= ?`), `students` SCAN rồi lọc chi nhánh trong JS | ~−0,15 triệu | Vừa: chỉ mục `!= 'done'` làm câu khác đổi kế hoạch xấu đi (đã thử, bỏ) — cần viết lại câu | `server/src/worklist/hvCuaToi.ts` |
| F | Tổng quan GV `hai-khoi` (2 k dòng trả / lần × 368) — đã rà GIAM-DOC-0711: mọi câu đi chỉ mục, giảm nữa phải đổi thiết kế | 0 (giữ) | — | — |
| G | `WITH ids(id) AS (VALUES …)` (`loadSkillRows`, ~0,85 triệu bước "quét" trên CTE hằng) — chưa rõ Turso có tính dòng CTE không | ? | — | chờ Top Queries sau deploy |

### A — 7 chỉ mục (đo từng câu trên bản chép)

| chỉ mục | câu được lợi | quét / ngày trước |
|---|---|---|
| `idx_iv_ghi_kq` `case_interventions(action_due) WHERE status IN ('planned','started') AND action_due IS NOT NULL` (xếp lại theo id trong JS) | Công việc · Ghi kết quả PA (`mywork.ts`) — SCAN 583 PA mỗi lần | 0,50 triệu |
| `idx_iv_cho_xac_nhan` `case_interventions(id) WHERE preset = 1 AND confirmed_at IS NULL AND status = 'planned'` | Công việc · Xác nhận PA — SCAN 583 PA mỗi lần | 0,38 triệu |
| `idx_iv_moc_cho` `case_interventions(id) WHERE preset = 1 AND status = 'started' AND followup_due IS NULL` | Công việc · Mốc PA quy chế (`SQL_MOC`) | 0,07 triệu |
| `idx_cycle_cho_kq_ngay` `learning_cycles(COALESCE(thi_that_ngay, exam_date, ended_at)) WHERE <như idx_cycle_cho_kq>` | `SQL_CHO_KET_QUA_THI` (Công việc, Học viên, Tổng quan TVV / CX): đọc 683 lộ trình chờ kết quả, 591 chưa có ngày → chỉ đọc 67 đã qua ngày thi | 0,34 triệu |
| `idx_followup_iv` `case_followups(intervention_id)` | kết quả PA cuối (`effectiveness.ts`, hồ sơ HV, Hiệu quả PA): câu con SCAN `case_followups` mỗi PA | 0,17 triệu |
| `idx_dm_cycle` `discipline_measures(cycle_id)` | `SQL_THI_THAT` (Tổng quan GV / QL, Phân tích GV): câu con WL2 SCAN mỗi lộ trình | 0,13 triệu |
| `idx_violation_ngay` `violations(occurred_on)` | `hvCuaToi`: vi phạm 7 ngày | 0,02 triệu |

### Không làm / đã thử

- Chỉ mục PA khoá `case_id` ĐỔI THỨ TỰ dòng (câu Công việc không ORDER BY → gộp "Xác nhận PA" khác thứ tự, TD4-a đỏ) → hai chỉ mục không lọc khoảng khoá `id`;
  câu lọc khoảng (Ghi kết quả PA, `SQL_CHO_KET_QUA_THI`) xếp lại theo id trong JS — thêm `ORDER BY` vào câu làm SQLite quay về chỉ mục cũ.
- Phát hiện phụ: chạy lại `npm run migrate` trên bản chép (đã migrate + đã chạy app một lượt) → bước OV-12a vẫn đổi hạn 10 PA đang chạy (24/11 → 01/12), tức
  migrate không "chạy lặp không đổi" ở bước này — có sẵn trên main, ngoài phạm vi, báo PTA.

- Chỉ mục `sos_cases(created_at) WHERE status != 'done'`: planner dùng nó cho câu khác (SCAN chỉ mục + tra từng dòng) → tổng quét TĂNG 0,26 triệu. Bỏ.
- Chỉ mục `user_roles(role_id)`: tổng quét tăng. Bỏ.
- Lượt quét nền toàn hệ thống (`quetTheoMoc`, 60 s / 15 s sau ghi): ổn định ~17 câu / lượt; chỉ nặng khi chạy bù nhiều ngày (sau deploy) — không sửa.

## Phía web

- **Request trùng**: bản build thật KHÔNG có request trùng trong một trang (trùng thấy ở `npm run dev` là do React StrictMode). `/my-work` gọi lại khi vào Học viên & Lớp
  (cột "Việc của tôi", bản nhớ 10 s) — đúng thiết kế.
- **Gọi chỉ để đếm**: tab "Đang SOS" (mục C).
- **Gói JS**: trang đầu 182 KB gzip (`index`) + CSS 36 KB gzip; trang ít dùng đã tách lười (Quản trị 48 KB, Phân tích 33 KB, PDF / xlsx / fontkit chỉ tải khi xuất).
  Phông Be Vietnam Pro 5 độ đậm tự phục vụ (unicode-range). Không thấy việc lớn — TAI-NHANH 02/11, 06/11, 07/11 đã làm.
- **Vẽ lại nặng**: không đo được bất thường ở các trang đã mở (bảng ≤ vài trăm dòng, phân trang).

## Thứ tự làm (Pha 2)

1. **PR-A** chỉ mục (mục A) + `scripts/do-ban-chep.mjs` + tài liệu này.
2. **PR-B** Tổng quan QL thẻ Giáo viên `v2=1`.
3. **PR-C** "Đang SOS" trong cùng request `/hoc-vien-lop?kem=sos` (−0,22 triệu / ngày).
4. Mục D, E, G: ghi [XM] cho PTA, không làm trong đợt này.

## Cách chạy lại

```bash
npm run build:server
cp D:/Github/pisa-mig/mig.sqlite <tạm>/a.sqlite && PISA_DB=<tạm>/a.sqlite node dist-server/server/src/migrate/run.js
python -I scripts/do-ban-chep-ds.py <tạm>/a.sqlite <tạm>/ds.json    # mọi tài khoản đang hoạt động × bộ đường từng trang
node scripts/do-ban-chep.mjs <tạm>/a.sqlite <tạm>/ds.json <tạm>/ra
python -I scripts/do-it.py <tạm>/ra
```

## Đợt 2 (PTA quyết 12/11)

| Mục | Kết quả |
|---|---|
| **OV-12a** (#1427) | Bước dữ liệu PR-OV12a chạy ở MỌI lần migrate, kéo hạn PA app đặt hợp lệ về lịch kỳ (bản chép: 10 PA 24/11 → 01/12). Bỏ khỏi migrate (seed vẫn gọi). Migrate 2 lần trên bản chép: 0 dòng đổi. Các bước dữ liệu khác: chỉ PR-OV13a (b) đổi `followup_due` — CHÍNH luật đường đọc `dienMocQuyChe`, đúng thiết kế. |
| **E · hvCuaToi** | Case mới 7 ngày: `substr(created_at, 1, 10) >= ?` → `created_at >= ?` + chỉ mục `idx_case_tao` (xếp theo id trong JS — `ORDER BY` làm SQLite quay về SCAN). TVV / CX / Quản trị Tổng quan + Học viên: quét 0,30 → 0,20 triệu / ngày; JSON 127 / 127 y hệt. `students` SCAN còn lại là CX / Quản trị xem MỌI chi nhánh (cần mọi em; chi nhánh = `COALESCE(lớp, em)` nên không đi chỉ mục được) — giữ. |
| **D · câu phiên** | Đã là MỘT câu / request (TD2-d). Phần lặp duy nhất: quyền của vai đọc theo từng dòng grant (TB 2,1 grant, 1,2 vai / người → ~18 dòng thừa / request). Lợi nhỏ, đụng mã quyền → không làm. |
| **F · Tổng quan GV** (chờ chủ SP) | Đo cùng một request: `/my-work` + `/hai-khoi` gộp bớt 18 % dòng (8 GV: 43,1 k → 35,3 k), ~−0,25 triệu / ngày. Nhưng `/my-work` còn là nguồn badge Công việc (App) → gộp phải đổi cách badge nhận dữ liệu; cùng lúc bỏ một kiểu lịch `valid` / `due` trong `loadSkillRows` (GIAM-DOC-0711). Đổi thiết kế → PTA đưa chủ SP. |
| G · CTE VALUES | Chờ Turso Top Queries sau deploy. |
| Gộp `theo-vai` TVV / CX | Bỏ (PTA). |
