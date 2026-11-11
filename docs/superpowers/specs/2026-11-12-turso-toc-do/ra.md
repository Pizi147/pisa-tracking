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

## Bảng trang × vai (bản chép thật, TB một lần mở trên các tài khoản của vai)

| vai · trang | TK × lần/ngày | câu | dòng trả | quét cả bảng (trước → sau PR-A) | triệu dòng / ngày (trước → sau PR-A) |
|---|---|---|---|---|---|
| GV · Tổng quan | 46 × 8 = 368 | 68 | 3 329 | 2 081 → 1 108 | 1,99 → 1,63 |
| QL · Tổng quan | 9 × 6 = 54 | 145 | 15 597 | 9 078 → 4 637 | 1,33 → 1,09 |
| Quản trị · Tổng quan | 5 × 3 = 15 | 147 | 33 388 | 18 971 → 13 370 | 0,79 → 0,70 |
| TVV · Học viên | 12 × 4 = 48 | 93 | 11 563 | 4 388 → 2 909 | 0,77 → 0,69 |
| GV · Công việc | 46 × 6 = 276 | 25 | 1 107 | 1 375 → 728 | 0,69 → 0,51 |
| GV · hồ sơ lớp | 36 × 4 = 144 | 101 | 1 838 | 1 782 → 1 057 | 0,52 → 0,42 |
| Admin · Tổng quan | 9 × 5 = 45 | 51 | 9 025 | 1 517 | 0,47 |
| Admin · Học viên | 9 × 3 = 27 | 60 | 11 717 | 1 822 → 1 264 | 0,37 → 0,35 |
| GV · Test | 46 × 3 = 138 | 23 | 2 026 | 476 | 0,35 |
| CX · Tổng quan | 4 × 3 = 12 | 58 | 21 125 | 5 152 → 4 260 | 0,32 → 0,30 |
| TVV · Tổng quan | 12 × 5 = 60 | 30 | 1 914 | 2 832 → 1 259 | 0,28 → 0,19 |
| CX · Học viên | 4 × 2 = 8 | 111 | 29 076 | 6 280 → 4 801 | 0,28 → 0,27 |
| QL · Công việc | 9 × 4 = 36 | 46 | 3 620 | 3 914 → 1 925 | 0,27 → 0,20 |
| GV · Học viên | 46 × 2 = 92 | 57 | 2 049 | 801 → 267 | 0,26 → 0,21 |
| QL · Học viên | 9 × 3 = 27 | 72 | 7 829 | 1 575 → 893 | 0,25 → 0,24 |
| Admin · Test | 9 × 4 = 36 | 27 | 5 838 | 1 160 | 0,25 |
| (9 dòng còn lại) | | | | | 0,68 → 0,64 |
| **Tổng (cận dưới)** | | | | | **9,87 → 8,52** |

Tốc độ máy chủ (máy dev, file cục bộ — Turso cộng thêm ~1 vòng mạng mỗi câu): TB 14–250 ms một đường; chậm nhất Công việc "Tất cả" QL / Quản trị 186–201 ms,
Học viên Quản trị 250 ms. Trên Turso thời gian ≈ số câu × vòng mạng → **bớt câu = nhanh hơn + bớt compute Netlify**.

## Phát hiện — xếp mục to trước

| # | Việc | Tiết kiệm ước / ngày | Rủi ro | Tệp |
|---|---|---|---|---|
| A | **7 chỉ mục** cho các câu quét cả bảng (bảng dưới) — không đổi câu, JSON y hệt (1 019 / 1 019 lượt gọi, bản chép thật) | **−1,35 triệu** (quét 2,50 → 1,15 triệu); 9 958 câu khác nhau chạy lại: 0 câu tăng | Thấp: chỉ `CREATE INDEX IF NOT EXISTS`; ba chỉ mục PA khoá `id` và `loTrinhChoKetQuaThi` xếp lại theo (em, lộ trình) để GIỮ thứ tự dòng cũ | `server/src/migrate/prTurso1211.ts` (mới), `migrate.ts`, `schema.sql`, `loTrinh/thiThat.ts` |
| B | **Tổng quan QL · thẻ Giáo viên** đọc đủ `/phan-tich/giao-vien` (41–85 câu, 4,5 k trả + 2–10 k quét) dù thẻ chỉ dùng Việc · Chấm · Đạt kỳ vọng (+ Tiến bộ ở tab Học thuật FT) → gọi `v2=1` (15 câu, ~1,4 k trả) trừ tab Học thuật FT | ~−0,4–0,5 triệu; Tổng quan QL −26–70 câu (nhanh hơn rõ) | Thấp: cùng hàm, cùng số; chỉ bỏ phần thẻ không đọc | `web/src/modules/worklist/TongQuanV5.tsx` |
| C | **Học viên & Lớp · tab "Đang SOS"** tải cả danh sách SOS (17–35 câu, 0,8–14 k dòng) chỉ để hiện SỐ trên tab, ở mọi lần mở trang (trừ Admin) | ~−0,3–0,5 triệu nếu tính số trong cùng request `/hoc-vien-lop` (dùng lại phần nạp lượt đã nhớ) | Vừa: đổi API trang, cần phép kiểm số = danh sách | `server/src/classes/hocVienLop.ts`, `hocVienSos.ts`, `StudentsPage.tsx` |
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
3. **PR-C** số "Đang SOS" trong cùng request (đo trước, làm nếu lợi ≥ 0,2 triệu / ngày).
4. Mục D, E, G: ghi [XM] cho PTA, không làm trong đợt này.

## Cách chạy lại

```bash
npm run build:server
cp D:/Github/pisa-mig/mig.sqlite <tạm>/a.sqlite && PISA_DB=<tạm>/a.sqlite node dist-server/server/src/migrate/run.js
python -I scripts/do-ban-chep-ds.py <tạm>/a.sqlite <tạm>/ds.json    # mọi tài khoản đang hoạt động × bộ đường từng trang
node scripts/do-ban-chep.mjs <tạm>/a.sqlite <tạm>/ds.json <tạm>/ra
python -I scripts/do-it.py <tạm>/ra
```
