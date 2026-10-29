# GON-MA — gọn mã + check nhanh (29/10 đêm)

Trạng thái: **kế hoạch, chờ PTA Plan nhắn "BẮT ĐẦU"** (sau đợt #672–#674). Chưa sửa mã.

## 1. Hiện trạng đã đo (29/10, chỉ đọc)

### Thời gian `npm run check` (log PTA `pta-dot1-check.log`, ô check-3, máy đang có session khác chạy tsc)
| Bước | Từ → đến | Thời gian | Ghi chú |
|---|---|---|---|
| build:server (tsc máy chủ) | 01:06:23 → 01:06:42 | ~19 s | |
| run.js | 01:06:42 → ~01:33:05 | **~26,4 phút (93 %)** | 4 578 phép kiểm, 1 tiến trình, 1 DB, tuần tự |
| tocDo.run.js | ~01:33:05 → ~01:34:30 | ~1,5 phút | 58 phép kiểm, DB riêng |
| sqld.run.js | | ~1 s | Windows: BỎ QUA |
| tsc web | ~01:34:30 → ~01:34:46 | ~16 s | |
| kiem-esbuild | | ~3 s | |
| **Tổng** | | **~28,5 phút** | |

→ Chỉ có **run.js** đáng kể. Bỏ tsc lặp đã làm ở #636. Mục tiêu ≤ 50 % (≤ ~14 phút) chỉ đạt được bằng cách rút run.js.
Máy: 20 nhân, 16 GB RAM → CPU dư, RAM là giới hạn.

### Dòng mã (tệp .ts/.tsx/.mjs theo git)
| Thư mục | Tệp | Dòng |
|---|---|---|
| web/src | 266 | 56 519 |
| server/src (không tests) | 289 | 72 393 |
| server/src/tests | 275 | **87 335 (36 %)** |
| shared (i18n 8 044) | 194 | 24 176 |
| scripts | 15 | 1 826 |
| **Tổng** | | **~242 000** |

Tệp lớn nhất: `tests/run.ts` 9 694 · `cases/cases.ts` 4 553 · `routes/index.ts` 3 038 · `fasttrack/attempts.ts` 2 709 · `migrate.ts` 2 055 · `seed/students.ts` 1 919 · `i18n/en/b.ts` 1 830 · `tests/tocDo.run.ts` 1 630 · `worklist/mywork.ts` 1 580 · `keHoach/keHoachTest.ts` 1 541 (30 tệp đầu ≈ 43 400 dòng).

### Cấu trúc run.ts
- Đầu tệp (dòng 1–241): seed, `check`/`assert`, `P`, `classId`, `TODAY`, `SEED_MAX`, `DEMO_Y_THUC`.
- 291 mục: phần viết thẳng (dòng 242 → ~8 850, 379 phép kiểm, 374 `const` cấp đầu dùng chéo nhau) + 273 lời gọi `runXxxTests(ctx)` của tệp `*.tests.ts` (~4 200 phép kiểm).
- 25 lời `spawnSync` node con (banChinh 13, prDeploy 5…), 103 tệp đọc mã nguồn web dạng chuỗi, 289 phép kiểm "không còn / đã xoá / đã bỏ".

### CODE_MAP.md
- 202 KB, 696 dòng; nhiều hàng bảng > 1 500 ký tự, kể lịch sử PR (PR-OV12e, #550…).
- Lệnh kiểm đầu tệp báo sai: coi tên trần (`App.tsx`) và đường tương đối (`cases/cases.ts`) là chết. Kiểm đúng (khớp đuôi đường): **31 tên tệp không còn**, hầu hết trong câu "đã xoá / đã bỏ" (lịch sử) — thật sự trỏ sai: `PROMPT_BAN_GIAO_PLANNING.md`, `PROMPT_SESSION_CODE.md`, `web/src/modules/cham/ChamDiemPage.tsx`, `giaoVien/BangGiaoVienChiNhanh.tsx`, `worklist/TongQuanQl.tsx`, `worklist/KhoiCanXuLy.tsx`.
- **125 tệp nguồn chưa nhắc tên**: i18n/en 49 · migrate 16 · ui 7 · seed 7 · domain 6 · ops 6 · students 6 · còn lại lẻ.

### Mã chết (ước lượng bằng grep, sẽ kiểm lại bằng tsc trước khi xoá)
- **77 export không ai nhắc tới** (kể cả phép kiểm, kể cả chính tệp): 37 const, 36 function, 4 type — vd `cases.ts CASE_STATE_LABEL`, `util.ts toNum/formatBand`, `shared/domain/cases.ts` 7 nhãn `LEGACY_*`/`*_LABEL`.
- Script một lần, **đều đã deploy** (tệp thêm trước `6d2eecc6`): 13 `server/src/ops/kiemTruoc*.ts` + 13 lệnh npm `kiem-truoc-*` + 4 `scripts/kiem-truoc-*.mjs`. 9 tệp phép kiểm có ca riêng cho chúng (prKetPet, prOv13a, prOv13f, sosV3, prOv13q, prOv15c, prOv1b, prOv1c, prOv3b, prSvNxCase).
- Tệp không ai import ngoài entry point: chỉ `web/src/modules/tutor/TutorPage.tsx` — **không đụng** (Tutor hoãn).

## 2. Thứ tự PR (một PR một việc, mỗi PR gộp `origin/main` mới nhất trước)

### GON-MA-1: CODE_MAP (chỉ tài liệu) — làm trước
1. Viết lại theo khung: **Màn → tệp web chính → API → tệp máy chủ** (một hàng ≤ ~300 ký tự, tên 1–3 hàm chính), mục module giữ dạng gạch đầu dòng ngắn.
2. Bỏ chữ kể lịch sử PR ("PR-OV12e", "đã xoá ở #539", "thay … cũ"); tên tệp đã xoá không còn nhắc.
3. Thêm 125 tệp thiếu theo nhóm (i18n, migrate, seed: một dòng mô tả cả thư mục, không liệt kê từng tệp).
4. Hai lệnh đầu tệp (thay lệnh cũ báo sai):
   - đường chết: tên có `/` phải tồn tại hoặc khớp đuôi một tệp git; tên trần phải có tệp cùng tên;
   - tệp chính chưa có: `git ls-files 'web/src/modules/**/*.tsx' 'server/src/**/*.ts' 'shared/domain/*.ts'` trừ tests / i18n / migrate / seed, tên không xuất hiện trong CODE_MAP.
- Đạt khi: 2 lệnh in rỗng; tệp ≤ ~60 KB (từ 202 KB); mọi màn ở bảng "Tra theo MÀN HÌNH" cũ vẫn có hàng.
- Kiểm: chỉ chạy 2 lệnh (không đụng mã → không cần typecheck).

### GON-MA-2: check nhanh (ưu tiên số 1)
**Bước 0 — đo từng mục** (thay đổi nhỏ, giữ luôn): `run.ts` bọc mỗi lời gọi `runXxxTests` và mỗi mục viết thẳng bằng đồng hồ; cuối log in 20 mục chậm nhất. Chạy một lần check đầy đủ trong ô check-1/2 → bảng 20 mục chậm nhất + thời gian phần viết thẳng vs phần tệp.

**Bước 1 — chia run.js thành N nhóm song song (mặc định 3, biến `PISA_SO_NHOM`)** — hướng lợi nhất vì run.js là 93 % và CPU dư:
- Mỗi nhóm là một tiến trình `run.js` riêng, DB riêng (`data/test-<k>.sqlite`). Seed MỘT lần ở tiến trình cha, `wal_checkpoint` rồi chép tệp DB cho từng nhóm (đầu `run.ts` bỏ qua seed khi có biến báo DB đã sẵn — `SEED_MAX`, `DEMO_Y_THUC` vẫn tính ngay sau đó).
- Phần viết thẳng (dòng 242 → ~8 850, `const` dùng chéo, không tách được rẻ) **chạy ở mọi nhóm** nhưng chỉ nhóm 1 in và đếm; 273 lời gọi `runXxxTests` chia cho các nhóm theo bảng thời gian của Bước 0 (cân bằng tham lam, bảng là một hằng số trong `run.ts`; tệp mới chưa có trong bảng → nhóm 1).
- Tiến trình cha giữ nguyên đầu ra quen thuộc: in log từng nhóm theo thứ tự, dòng cuối `TẤT CẢ <tổng> KIỂM TRA ĐỀU ĐẠT` / danh sách không đạt; mã thoát ≠ 0 khi một nhóm đỏ hoặc chết (OOM).
- Nếu Bước 0 cho thấy phần viết thẳng > ~35 % thời gian: tách nó thành nhóm riêng (chuyển nguyên khối sang tệp `.tests.ts` như các tệp khác) thay vì chạy lặp — quyết sau khi đo.
- Phép kiểm phụ thuộc trạng thái do tệp TRƯỚC ghi vào DB sẽ đỏ khi khác nhóm → xếp chúng chung nhóm theo đúng thứ tự cũ (ghi trong bảng), không sửa nội dung phép kiểm.

**Bước 2 — chạy song song tocDo + tsc web + esbuild với run.js** (tocDo đã có DB riêng): `check` = `build:server` rồi một lệnh `concurrently --group` (đã là devDependency, không thêm thư viện). Tiết kiệm ~1,8 phút.

**Bước 3 — điểm nóng** từ bảng Bước 0 (vd 13 `spawnSync` node con trong banChinh, seed lặp): chỉ sửa cách dựng (dùng chung DB tạm, bỏ spawn trùng), không bớt điều được kiểm.

**Gộp / xoá phép kiểm** — chỉ khi trùng nội dung hoặc kiểm tính năng đã gỡ; liệt kê từng cái trong mô tả PR. KHÔNG đụng phép kiểm luật nghiệp vụ, quyền, bảo mật, chống mất dữ liệu, luật giao diện (prNenTypoMau, prSang, prS4f, prEn, prBang0, suaLoiNong).

- RAM: hiện ~1,9 GB / check. Ước 3 nhóm ngắn hơn + tocDo + tsc ≈ 4–5 GB / check trong ~10 phút → **cần PTA đổi luật ô: tối đa 2 check toàn máy** (thay 3). Đo đỉnh RAM thật và ghi vào PR.
- Đạt khi: check đầy đủ ≤ 50 % lần đo trước (cùng máy, cùng ô); tổng số phép kiểm = 4 578 + 58 (trừ cái đã liệt kê); không phép nào đổi nội dung.
- Kiểm: 1 check đầy đủ trước + 1 sau trong ô check-1/2; typecheck + esbuild.

### GON-MA-3: xoá mã chết
1. 13 `ops/kiemTruoc*.ts` + 13 lệnh npm + 4 `scripts/kiem-truoc-*.mjs` (đã deploy; xác nhận lại với `DEPLOY_2026-10.md` + `git log`) cùng ca kiểm riêng của chúng trong 10 tệp phép kiểm; hàm đếm trong `migrate/*` chỉ script đó dùng → xoá theo. **GIỮ** script deploy, sao lưu, khôi phục, migrate, init, `kiem-sau-init`, `thuTurso`, `xoaKhoTep`, các lệnh đếm dùng lại (`kiem-o-lop`, `kiem-du-lieu-mt`, `kiem-tieu-chi-le`, `dem-*`).
2. 77 export không ai nhắc: xoá từng cái, `npm run typecheck` sau mỗi lô; export chỉ dùng trong chính tệp → không đụng (đổi vô ích).
3. Component / route / khoá i18n không dùng: khoá i18n = chuỗi tiếng Việt không còn xuất hiện trong web/ và server/ (một lệnh grep, xoá theo lô, chạy prEn).
4. Xoá tệp → sửa CODE_MAP cùng commit.
- Đạt khi: typecheck + esbuild xanh; phép kiểm của các tệp đã sửa + 6 tệp luật giao diện xanh; số dòng trước → sau trong mô tả PR.

### Báo cáo cuối (mục 3 tệp này)
Trước / sau: dòng mã, thời gian check, RAM đỉnh. Đề xuất khối lớn cần chủ SP chốt (không tự làm qua đêm), dự kiến:
- 289 phép kiểm "không còn / đã xoá" + 103 tệp đọc mã nguồn web dạng chuỗi → luật Q-7 đã cho gỡ khi làm lại màn; đề xuất gỡ dần theo màn.
- Migration đã deploy trong `migrate.ts` / `migrate/*` (2 000+ dòng) → gộp thành schema gốc một lần (cần chủ SP chốt: mất khả năng nâng cấp sao lưu rất cũ).
- `run.ts` phần viết thẳng 8 600 dòng → chuyển thành các tệp `.tests.ts` như phần còn lại.

## 3. Kết quả (29/10 sáng)

### PR
| PR | Việc | Trạng thái |
|---|---|---|
| #677 GON-MA-1 | CODE_MAP 202 KB → 56 KB, 2 lệnh kiểm (đường chết, tệp thiếu) in rỗng | đã merge |
| #689 GON-MA-3 | xoá 13 `ops/kiemTruoc*` + 13 lệnh npm + 4 `scripts/kiem-truoc-*`, ~90 export, 131 khoá i18n — 102 tệp, +69 / −1 663 | đã merge |
| GON-MA-2 | check: run.js chia 2 nhóm song song + tocDo cùng lúc | PR mở (xem dưới) |

### Check — đo được gì (máy 20 nhân, 16 GB)
- Gốc: run.js một tiến trình 1 497 s (một mình), cả check ~25–28 phút; đỉnh 5,0 GB.
- **Chậm vì DB phình dần**, không phải vì từng tệp: cuối bộ, nhóm tuần tự có ~9× dòng so với DB vừa seed (3 470 vs 397 lượt). 18 tệp "nặng" chạy ở DB nhỏ chỉ mất ~47 s cộng lại (tuần tự: hàng trăm giây). Tệp làm phình nhiều nhất lại chạy rất nhanh (prGva 5 024 dòng / 1 s, prDonB, prKv, prCt, prLt2b…).
- **Không chia đều được**: nhiều tệp dựa vào dữ liệu tệp trước để lại. Có phép kiểm "bất biến" quét cả DB, có bảng do migrate của tệp khác tạo, có câu SQL còn mở làm `table is locked`. DL-2 (`prDl`, vị trí 80) còn so **mã băm cố định** của trạng thái tuần tự. Chia 3 nhóm đều (theo thời gian) nhanh ~5× nhưng 63 phép đỏ; bộ tìm tự động (chia đôi) không hội tụ sau 216 thí nghiệm.
- Cách đang dùng: nhóm 1 chạy mọi tệp theo thứ tự cũ trừ `TACH` (18 tệp đã thử: đứng sau `prDl`, xanh ở nhóm 2, bỏ khỏi nhóm 1 không làm tệp sau đỏ); nhóm 2 chạy `TACH`. Đã thử 9 cấu hình (nhóm 1: 556–1 095 s): mọi cấu hình nhanh hơn đều làm đỏ phép kiểm.
- **Số phép kiểm**: chia nhóm 4 597 = tuần tự 4 597 trên cùng mã, khớp TỪNG tệp (272 mục) + tốc độ 58 = 58.

### Đề xuất (cần chủ SP / PTA chốt — không tự làm qua đêm)
1. **Phép kiểm tự dựng dữ liệu** (lợi lớn nhất): sửa các tệp đang dựa vào dữ liệu tệp khác để lại (danh sách đỏ khi chia đều ở log GON-MA-2) cho tự tạo dữ liệu của mình, và bỏ mã băm cố định của DL-2 (so hai đường tính với nhau là đủ). Khi đó chia 3–4 nhóm đều được: phần phép kiểm ~5–6 phút (đo: 3 nhóm đều 234–361 s), RAM ~1,3–2 GB mỗi nhóm.
2. Tệp làm phình DB (prGva, prDonB, prKv, prCt, prLt2b, prLc, prK26, prMta) dọn dữ liệu sau khi kiểm (ROLLBACK như `r1NoCu.thu`) → mọi tệp sau nhanh lên, kể cả khi chạy tuần tự.
3. 289 phép kiểm "không còn / đã xoá" + 103 tệp quét chuỗi mã nguồn web: gỡ dần theo màn (Q-7).
4. Migration đã deploy (`migrate.ts` + `migrate/*`, 2 000+ dòng) gộp vào schema gốc — mất khả năng nâng cấp bản sao lưu rất cũ.
