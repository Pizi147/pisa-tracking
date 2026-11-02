# DOC-IT 02/11 — đo dòng đọc Turso ở máy chủ

Turso tính **dòng quét**, không chỉ dòng trả về: câu `SCAN` cả bảng tính cả bảng. `TRAN_DONG` của `tocDo.run` chỉ đếm dòng trả, nên đợt này đo thêm
dòng quét thật của từng câu.

## Cách đo (chạy lại được)

```bash
npm run build:server
PISA_DO_IT=<thư mục>/x3 node dist-server/server/src/tests/tocDo.run.js
python -I scripts/do-it.py <thư mục>/x3 "<lọc khoá vai × đường>"
python -I scripts/do-it.py <thư mục>/x3 --top "QL /my-work"
```

- `PISA_DO_IT` ghi mọi câu SQL + tham số của từng (vai × đường) trong `DUONG_DO` ở lượt **×3** (nhân dữ liệu của `tocDo.run`), thêm 5 đường khi
  lượt quét nền chạy (khoá `QUET …`), rồi chép DB ×3. `do-it.py` chạy lại từng câu SELECT trên bản chép, đếm bằng `sqlite3_stmt_status`:
  **quét cả bảng** (FULLSCAN_STEP — dòng đi qua khi quét cả bảng), **tự dựng** (AUTOINDEX — thiếu chỉ mục, SQLite dựng tạm mỗi lần),
  **bước VM** (bước máy ảo — tỉ lệ với số dòng đọc qua chỉ mục; dùng để xếp hạng, không phải số dòng Turso).
- Cỡ bảng: DB ×3 gần bằng bản chép bản chính 29/10 (chỉ đếm dòng, `D:\pisa-mig\mig.sqlite`): HV 447 / 844 · Case 327 / 573 · ghi danh 498 / 893 ·
  lộ trình 489 / 891 · PA 330 / 467 · lượt 1 026 / 2 572 · ô kỹ năng 4 059 / 10 288 · `sqlite_master` 304 / 271. Số đo ×3 ≈ 0,5–1 lần bản chính.

## Tải trang đầu (×3, trước DOC-IT)

| Trang | GET | câu | dòng trả | bước VM | quét cả bảng | nặng nhất |
|---|---|---|---|---|---|---|
| GV Tổng quan (GVCN) | 7 | 125 | 8 435 | 840 k | 3 882 | `hai-khoi` 554 k (đọc MỌI Case cả hệ thống) · `/my-work` 190 k (SCAN Case, PA, ghi danh) |
| QL Tổng quan | 8 | 95 | 13 303 | 988 k | 2 415 | `/tong-quan/v5` 514 k · `/phan-tich/giao-vien` 462 k |
| TVV Tổng quan | 6 | — | — | — | ≥ 1 224 | `/tong-quan/hoc-vien` SCAN HV, Case, lộ trình |

## Đường chính (×3) — trước → sau

| Đường | Vai | câu | dòng trả | bước VM | quét cả bảng | SCAN bảng lớn | Việc |
|---|---|---|---|---|---|---|---|
| `/demo/session` (mỗi lần mở app) | mọi vai | 4–5 → 3–4 | 4–23 | 1,9 k → 0,8 k | 307 → 3 | `sqlite_master` | **DOC-IT-1** |
| `/tong-quan/lop-toi-day/hai-khoi` | GVCN · GVBM | 57 | 5 640 · 6 363 | 554 k · 614 k | 1 566 · 1 638 | `sos_cases` (mọi Case cả hệ thống) | DOC-IT-3 |
| `/my-work` | GVCN · GVBM | 33 · 32 | 1 671 · 1 704 | 190 k → 184 k · 188 k → 182 k | 2 000 → 1 507 · 2 012 → 1 519 | `sos_cases`, `case_interventions` (~~`enrollments`~~) | DOC-IT-2 ✓ |
| `/my-work` | QL · QT | 39 | 2 365 · 2 813 | 252 k → 247 k · 288 k → 283 k | 3 458 → 2 965 · 3 602 → 3 109 | + `students` (việc TVV), `learning_cycles` | DOC-IT-2 ✓, -4 |
| `/tong-quan/v5?ct=ft` | QL | 40 | 6 970 | 514 k | 761 | — (đọc theo chi nhánh qua chỉ mục) | > 30 câu |
| `/tong-quan/v5?ct=ft` | QT · CX | 36 · 35 | 9 267 · 9 033 | 675 k · 649 k | 2 469 | `enrollments`, `sos_cases` | DOC-IT-4 |
| `/hoc-vien-lop` | QL · GVCN | 48 · 50 | 6 821 · 5 177 | 658 k · 525 k | 1 420 · 1 240 | `students` | DOC-IT-4 |
| `/tong-quan/hoc-vien` | TVV · QT | 48 · 64 | 1 048 · 12 752 | 78 k · 1,18 M | 1 221 · 2 878 | `students`, `sos_cases` | DOC-IT-4 |
| `/classes/{lopFT}/overview` | QL · GVCN | 33 · 35 | 1 621 · 1 692 | 149 k · 167 k | 133 | — | — |
| `/students/{hv}` | QL | 77 | 144 | 11 k | 136 | — | > 30 câu, đọc ít |
| `/highlights` | QL · GVCN | 9 | 85 · 44 | 66 k · 47 k | 3 | — | — |
| `/yeu-cau/dem` · `/ref/branches` · `/notifications` | mọi vai | 3–5 | ≤ 46 | ≤ 11 k | ≤ 7 | — | — |
| quét nền (≤ 1 lần / 60 s hoặc sau ghi), đo qua QL `/my-work` | QL | +13 | +20 | 260 k → 253 k | 4 389 → 3 408 | `sos_cases` (~~`learning_cycles`~~) | DOC-IT-2 ✓ |

## Phát hiện (xếp theo lợi: dòng quét × tần suất mở)

1. **`/demo/session` SCAN `sqlite_master`** (`db.ts` `isInitialised`) mỗi lần mở app — ~270 dòng bản chính / lần, không đổi được gì. → DOC-IT-1: nhớ theo kết nối.
2. **`sc.status != 'done'`** (Case chưa xong) không chỉ mục nào dùng được → SCAN cả `sos_cases` (kể cả Case đã đóng, tăng mãi) ở Công việc mọi vai
   (`napCaseMo`), quét nền, TVV/CX. Cùng kiểu: `case_interventions` lọc `status IN ('planned','started')` / PA mặc định chưa xác nhận, `mini_test` chưa có tỉ lệ
   (đi ngược từ MỌI ghi danh active). → DOC-IT-2: chỉ mục một phần `mini_test` + hẹn Lộ trình mới (#800). **Bỏ** chỉ mục `sos_cases … != 'done'` và
   `case_interventions(status)`: SQLite đổi kế hoạch câu khác cho tệ hơn (TD7a 21 → 1 642 bước; `case_id IN (…)` +3 k); bản chính Case đóng mới 12 % → lợi nhỏ.
3. **Tổng quan GV đọc MỌI Case cả hệ thống** rồi lọc quyền trong mã: `metricSet('case-mo')` của GV không có chi nhánh → `listCases(p, {})` (4 câu con mỗi Case).
   → DOC-IT-3: GV chỉ có quyền theo lớp → lọc tập cha theo lớp được phân công ngay trong SQL (bộ lọc quyền cũ giữ nguyên phía sau, kết quả không đổi).
4. `/ref/classes` (TAI-NHANH báo): đọc MỌI lớp active cả hệ thống + đếm ghi danh từng lớp rồi lọc phạm vi bằng JS. `students` SCAN ở `/hoc-vien-lop`, việc TVV của Công việc QL, `/tong-quan/hoc-vien`; `enrollments` SCAN ở Tổng quan QT / CX (cả hệ thống — đúng phạm vi, ít người mở).
   → DOC-IT-4 (xem lại sau 1–3).
5. Đường > 30 câu (`/my-work` QL 39, `/hoc-vien-lop` 48, `/tong-quan/v5` QL 40, `viec-theo-em` QL 46, `kemBaoCao=1` QL 58): câu nhiều nhưng phần lớn
   đọc theo chỉ mục — lợi dòng nhỏ hơn 1–3; để sau.

## Ước dòng / ngày (giả định ghi rõ)

Giả định: ~60 người dùng, mỗi người ~10 lần mở app / ngày (F5, tab mới, đăng nhập) = 600 lần `/demo/session`; GV mở Tổng quan ~8 lần, Công việc ~6 lần / ngày.

| PR | Giảm mỗi lần | Ước giảm / ngày |
|---|---|---|
| DOC-IT-1 (#797) | ~270 dòng / lần mở app | ~160 nghìn (~5 triệu / tháng) |
| DOC-IT-2 (#800) | ~890 dòng / lần mở Công việc / Tổng quan GV + ~890 / lượt quét nền (860 lần mở + ~600 lượt quét) | ~1,3 triệu |

## DOC-IT-4 — `/ref/classes` (#PR sau DOC-IT-3)

Ô chọn lớp (IntakePanel, LuoiTaoLop, bộ lọc Phân tích…) đọc MỌI lớp active cả hệ thống + đếm ghi danh active từng lớp, rồi lọc phạm vi / chi nhánh trong mã.
Nay lọc trong SQL (`classScopeSql`). Dòng trả ×1: GV 33 → 11 · GVBM 33 → 18 · QL 33 → 23 (mọi vai trước 33); 3 câu như cũ; JSON trùng mọi vai × 4 kiểu tham số.
Bản chính: ~88 lớp + ~800 ghi danh active được đếm mỗi lần gọi → GV ~5 lớp / ~60 dòng.
