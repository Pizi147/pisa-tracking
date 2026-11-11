# TURSO-LOG-1311 — rà log Netlify 24 giờ (10/11 13:41 → 11/11 13:39, bản deploy 07/11)

Chủ SP 13/11 đưa log thật `D:\Github\netlify-api-24h.txt` (không commit). Phân tích bằng script ở scratchpad; so từng đường với main `da7cc83c1`
đo trên bản chép `D:\Github\pisa-mig\mig.sqlite` (cách đo như `2026-11-12-turso-toc-do/ra.md`: migrate, một lượt ấm chạy bù việc nền, rồi đo 400 lượt
tài khoản × trang + 85 lượt đường thêm; `PISA_IN_JSON=1` giữ JSON để so trước / sau).

## 1. Log nói gì

| | số |
|---|---|
| Request (dòng `Duration`) | 8 770 · p50 134 ms · p90 1,01 s · p99 4,48 s · 242 > 3 s · 8 timeout 30 s |
| Bỏ giờ 19h ngày 10/11 | 8 600 · p50 131 ms · **p90 0,90 s** · p99 3,71 s · 170 > 3 s · 0 timeout |
| Khởi động lạnh (`Init Duration`) | 218 lần (2,5 %) · Init p50 671 ms · p90 704 ms · request lạnh p50 337 ms (ấm 129 ms) |
| Mất luồng Turso (`[turso] mất kết nối`) | 284 lần · đã thử lại 280 (GET 263, POST 10, PUT 4, PATCH 3) · **KHÔNG thử lại 4 = 4 lần POST /auth/login lỗi** |
| ms / câu SQL ở request chậm (WARN) | giờ thường 21–62 ms · **giờ 19h 10/11: 491 ms** |

Dòng `WARN [cham]` chỉ có ở request ≥ 1 s (bản 07/11 chưa ghi `[t]` cho request nhanh — main đã có, GIAM-COMPUTE), nên số dòng đọc dưới đây là
**của request chậm**, không phải cả ngày.

### Cụm timeout 19:37–19:53 ngày 10/11 (mục f) — sự cố Turso, không sửa

- Mọi request ≥ 10 s (35) và cả 8 timeout 30 s đều nằm trong 16 phút này. Giờ đó ms / câu TB **491** (giờ khác 21–62): đường ít dòng như
  `/classes/:id/xoa-ket-thuc` 16 câu · 16 dòng mất 15 s, `/classes/:id/overview` 38 câu · 432 dòng mất 15–24 s.
- 8 timeout không có dòng `[cham]` (chưa kịp xong). Cùng giờ: 20 lần mất luồng, 3 lỗi `[health]` "stream not found".
- Kết luận: Turso chậm ~10 lần trong 16 phút. Ghi lại; không sửa mò. Các đường "rất chậm mà ít dòng" PTA liệt kê (overview 15 s, roster 11 s,
  `/attempts/:id` 14 s, `/giao-vien/:id/o` 15 s, `/yeu-cau/dem` 8,5 s, `/cham/lich-test/qua-han` 7 s) đều là request trong cụm này — ngoài cụm
  overview 2,1 s · roster 2,1 s (1 lần mỗi đường).

### Đường chậm ngoài cụm (≥ 1 s)

| đường | lần | ms TB | câu TB | dòng TB | ms / câu |
|---|---|---|---|---|---|
| GET /my-work | 455 | 2 403 | 51 | 8 168 | 49 |
| GET /hoc-vien-lop | 149 | 2 135 | 109 | 6 405 | 22 |
| GET /notifications | 33 | 2 624 | 28 | 4 423 | 98 |
| GET /classes/:id/viec-theo-em | 31 | 1 891 | 40 | 3 678 | 49 |
| GET /tong-quan/lop-toi-day/hai-khoi | 29 | 1 510 | 55 | 3 730 | 27 |
| GET /tong-quan/v5 | 20 | 1 332 | 67 | 7 024 | 25 |
| GET /phan-tich/giao-vien | 7 | 1 136 | 98 | 5 293 | 13 |
| GET /cham/lich-test | 6 | 1 736 | 18 | 4 272 | 95 |

Thời gian ≈ số câu × một vòng Turso (~25–50 ms) + câu nặng. `/my-work` 455 lần chậm / ngày là do bản 07/11 tải lại badge sau MỌI lần ghi.

### Câu nặng nhất (cộng dòng trả ở request chậm)

| dòng | câu |
|---|---|
| 1 789 377 | `WITH ids(id) AS (VALUES …)` — `loadSkillRows` |
| 653 989 | `SELECT s.*, u.full_name AS entered_by_name…` — điểm (`loadBundle`) |
| 297 409 | `SELECT a.*, (a.kind = 'mock' … NOT EXISTS …)` — lượt `listAttempts` (Công việc) |
| 105 600 | `SELECT ta.id, ta.class_id, ta.user_id…` — phân công |
| 96 960 | `SELECT a.*, lop.programme_code…` |

## 2. Đường trong log → main hiện tại (bản chép, TB một lần mở; "log" = request chậm ≥ 1 s ngoài cụm 19h)

| đường | log 07/11: câu · dòng | main `da7cc83c1`: câu · dòng · ms máy dev | đã sửa trên main bởi |
|---|---|---|---|
| /my-work | 51 · 8 168 (455 lần chậm / ngày) | GV 25 · 1 107 · QL 43 · 3 402 · QT 46 · 7 830 | GIAM-COMPUTE (#1320: badge không tải lại sau mỗi lần ghi), TL-VIEC, TD4 |
| /hoc-vien-lop | 109 · 6 405 | 33 · 2 981 (max 77 · 17 158 Admin / CX) | #1426 (SOS cùng request), TURSO-1211 |
| /notifications | 28 · 4 423 | 3 · 27 | chuông V2 (chỉ tin một chiều, tải khi mở hộp) |
| /classes/:id/viec-theo-em | 40 · 3 678 | 30 · 647 | |
| /tong-quan/lop-toi-day/hai-khoi | 55 · 3 730 | 29 · 2 092 | (gộp `/my-work` + hai-khoi chờ chủ SP — TURSO-1211 mục F) |
| /tong-quan/v5 | 67 · 7 024 | 34 · 8 380 (QT 12 061) | #1425 (thẻ GV v2) |
| /phan-tich/giao-vien | 98 · 5 293 | 28 · 2 420 | Phân tích V2, sổ nghĩa vụ |
| /cham/lich-test | 18 · 4 272 | 16 · 1 391 | |
| /cham/lich-test/qua-han | 10 · 2 258 | 8 · 1 756 | |
| /yeu-cau/dem | 13 · 754 | 4 · 69 | |
| /classes/:id/overview | 33 · 332 | 32 · 221 | — (ít dòng; chậm chỉ trong cụm 19h) |
| /classes/:id/roster | 26 · 761 | 23 · 521 | |
| /attempts/:id | 28 · 186 | 24 · 30 | |
| /students/:id | 48 · 74 | **58 · 94 (max 82)** | còn N+1 → PR này |

Cộng theo tần suất giả định của TURSO-1211 (400 lượt tài khoản × trang): main **6,45 triệu dòng trả / ngày** (cận dưới; Turso tính cả dòng chỉ mục),
97 700 câu / ngày. Câu nặng nhất main: `loadSkillRows` 1,76 triệu (27 %), điểm `SELECT s.*` 0,91 triệu (14 %), lượt Học viên 0,32 triệu.

## 3. Sửa trong PR này (đo trên bản chép, 1 028 lượt tài khoản × trang + 369 lượt đường thêm; **JSON 1 397 / 1 397 y hệt**)

Mốc "trước" cuối cùng = `origin/main` `b54ba2c47` (git archive, cùng bản chép đã migrate, cùng danh sách lượt) so với nhánh này (gồm chỉ mục + hai câu huỷ lượt):
JSON khác 0 / 1 028 và 0 / 369; câu 23 383 → 23 187; dòng trả 1 740 326 → 1 734 193; thời gian máy chủ cộng dồn 95,8 s → 86,2 s (máy dev, lượt đầu nóng ổ đĩa
khác nhau nên ms chỉ để tham khảo — so `json_each` riêng: 110,7 s → 80,1 s cùng điều kiện).

| # | việc | trước → sau | tệp |
|---|---|---|---|
| a | `loadSkillRows`: `WITH ids(id) AS (VALUES (?),(?)…)` → `WITH ids(id) AS (SELECT value FROM json_each(?))`, lô `LO_JSON` (10 000) thay 900. Cùng kế hoạch (SEARCH `attempt_skills` theo `attempt_id`, cả hai vế), cùng dòng. Trước: mỗi cỡ lô một văn bản câu mới (prepare mới trên Turso, rò ~4,9 KB / lần prepare — `db.ts` PR-BN), tới 900 tham số mỗi câu. | thời gian máy chủ cộng dồn 1 028 lượt **110,7 s → 80,1 s (−28 %)**; GV Công việc 193 → 127 ms, GV hai khối 299 → 190 ms, Admin Học viên 390 → 232 ms (máy dev); dòng không đổi | `fasttrack/skillSchedule.ts` |
| a | Công việc · GV Speaking: lớp CHỈ vào nhờ chấm S chéo (ngoài phạm vi phân công) chỉ đọc lượt Mock / MT0 mà ô S chưa có band (`listAttempts` `chiSCheoNgoai`) — trước đọc mọi lượt còn ô chờ của cả chi nhánh (lịch + điểm mọi môn) dù chỉ dùng ô S | GV Speaking không lớp (vd GV 10): 2 049 → 1 774 dòng; `/my-work` mọi GV TB 1 107 → 1 061 dòng | `fasttrack/attempts.ts`, `worklist/mywork.ts` |
| c | Hồ sơ HV `checkpointView` tính lại kết quả từng lượt (một câu lịch kỹ năng mỗi lượt) → dùng lại kết quả vừa tính cho danh sách lượt | `/students/:id` TB 58,4 → 54,0 câu (nặng nhất 82 → 68), 94 → 84 dòng | `students/profile.ts` |
| c | Tên Case SOS (`tenGiuaCua`) hai câu mỗi thẻ → một câu mỗi loại cho cả bảng (`napTenGiua`, nhớ trong request GET) | (gộp vào dòng trên) | `cases/sosAuto.ts`, `cases/cases.ts` |
| d | Mất luồng Turso ở POST / PUT / PATCH: trước chỉ thử lại khi lỗi ở bước kiểm phiên; nay **thử lại một lần cả khi đường API chưa ghi DB lần nào** (`Dem.ghi` — mọi `run` / `exec` và câu `… RETURNING` chạy qua `all()` / `get()` đều đếm — còn bằng lúc vào API) và không phải tải tệp (multipart). Đã ghi → giữ như cũ: không thử lại, 500 có mã. | 4 lần POST /auth/login lỗi / ngày → 0 (lỗi ở câu đọc đầu `phutConKhoa`) | `app.ts`, `auth.ts`, `platform/nguCanhRequest.ts` |

Rà `/code-review high`: câu ghi `… RETURNING` qua `all()` (taoPa, kyVong, cuoiKhoa, thungRac, mocHeThong, soNghiaVu) trước không được đếm là ghi → đã đếm (`demGhi`,
không đặt `coGhi` để giữ nhớ bảng tham chiếu như cũ) + phép kiểm. Còn biết: POST gọi dịch vụ ngoài trước lần ghi DB đầu (OpenAI `/dich`) mà câu sau mất luồng thì
chạy lại gọi ngoài lần hai — tốn một lần gọi, không ghi đôi dữ liệu.

Trần `tocDoDuong.ts`: `/students/1` 88 → 85 (GVCN 90 → 88), seed đo 65 / 67 câu.

**(b) câu điểm `SELECT s.*`**: Turso tính DÒNG, không tính cột — bớt cột không bớt dòng. Câu đã lọc theo đúng tập lượt (`attempt_id IN (json_each)`, chỉ mục
`idx_score_attempt`), mỗi lượt đọc đúng các ô của nó; dòng tỉ lệ với số lượt trang đọc (như `loadSkillRows`). Bớt được chỉ khi trang đọc ít lượt hơn (mục a
GV Speaking). Không đổi.

## 3b. Turso Top Queries 12/11 (chủ SP 13/11, `plan.md`) — DÒNG ĐỌC THẬT của Turso, ~20,6 triệu / ngày

Turso tính mọi dòng đi qua (chỉ mục, bảng tạm), nên số thật cao hơn "dòng trả" ở trên. Đo trước → sau bằng bước máy ảo SQLite (`sqlite3_stmt_status` VM_STEP,
tỉ lệ với dòng đi qua) trên bản chép, cùng tham số đã ghi ở lượt đo.

| câu (Top Queries) | lần · dòng / ngày | sửa | bước VM / lần trước → sau | ước sau / ngày |
|---|---|---|---|---|
| `lenh_chuyen_lop … boi_canh = 'cuoi-khoa'` (Xét lại `tinhTapXetLai`, 3 biến thể) | 894 · ~7,0 M (8 K / lần) | chỉ mục `ix_lenh_hv (student_id)`: câu con "lệnh sau của cùng em" trước quét mọi lệnh có id lớn hơn (theo rowid) cho từng lệnh | 28 956 → 7 319 (−75 %); 317 câu `lenh_chuyen_lop` khác: kết quả + thứ tự y hệt, 2 câu khác cũng nhẹ hơn (441 → 67, 59 → 26) | **~1,8 M (−5,2 M)** |
| `case_interventions iv JOIN sos_cases … EXISTS case_milestones … attempt_id` (`paGanLuot`, hệ quả huỷ lượt — cùng mẫu câu 5, không có trong ảnh) | (không có trong ảnh) | `EXISTS (mốc của Case = lượt)` → `sc.id IN (mốc của lượt)`: đi từ `idx_milestone_attempt`, trước SCAN mọi PA | 15 411 → 106 (360 lượt có mốc: kết quả y hệt) | — |
| cùng đường: `caseSinhRieng` (`sos_cases … EXISTS case_milestones`) | (cùng 40 lần) | như trên; kết quả xếp theo id (trước: thứ tự chỉ mục `idx_case_owner`, tình cờ — 72 / 360 lượt khác thứ tự; web không đọc `caseIds`) | 21 921 → 109 | nhỏ |
| `WITH ids(id) AS (VALUES …)` (`loadSkillRows`) | 774 · 4,78 M (6,2 K / lần, dòng trả ~2 K) | `json_each` (mục 3): bỏ bảng tạm `MATERIALIZE ids` + hai lượt quét nó; cùng kế hoạch trên bảng thật | máy chủ −28 % thời gian | chưa đo được phần bảng tạm Turso tính — xem Top Queries sau deploy |
| `SELECT a.*, (… NOT EXISTS …) AS la_mt_moi` (`listAttempts` còn ô chờ: Công việc, Lịch Test) | 970 · 4,39 M (4,5 K / lần) | GV Speaking (mục 3, −13 % dòng của họ) + PR (c): MT lịch sử FT bỏ khỏi cờ `o_cho_tu` | 43 810 → 31 213 TB (−29 %) | ~3,1 M |
| `SELECT sc.*, … FROM sos_cases` (`napCaseMo`, Công việc / việc theo em) | 641 · 2,94 M (4,6 K / lần) | PR (b): `current_class_id` lấy từ JOIN `cur` sẵn có thay câu con đọc lại `enrollments` mỗi dòng (PTA duyệt). Đã đọc đúng phạm vi (GV theo lớp, QL theo chi nhánh); phần còn lại là 6 JOIN + câu con cần thật (`iv_count`, `LA_CASE_SOS`…) — gộp lô không bớt dòng (cùng chỉ mục, cùng dòng) | 35 679 → 33 164 (−7 %) | ~2,74 M (−0,2 M) |
| `SELECT iv.id, … iv.preset = 1 AND iv.confirmed_by IS NULL … EXISTS case_milestones m.kind IN ('opened','repeat') AND m.attempt_id = ?` (`resyncUnconfirmedPresets`, đường ghi điểm) | 40 · 1,5 M (38,6 K / lần) | PR (b): `sc.id IN (mốc opened / repeat của lượt)` — trước quét mọi PA chờ xác nhận (main sau TURSO-1211 đi `idx_iv_cho_xac_nhan`, vẫn mọi PA chờ); xếp theo id như cũ | 8 660 → 109 (360 lượt: kết quả + thứ tự y hệt) | **~0 (−1,5 M)** |
| **Cộng** (ảnh có câu 5 là `resyncUnconfirmedPresets`; `paGanLuot` cùng mẫu không có trong ảnh — sửa cùng #1443) | **~20,6 M** | | | **~12,4 M (−8,2 M)** |

**PR (c) — `la_mt_moi` (chủ SP 13/11 "Không tính nữa")**: MT lịch sử ở chương trình chấm band (FT) không còn "chờ điểm" → `O_CHO_TU_SQL` = NULL cho chúng
(cùng vế loại của `CON_O_SQL`; lịch sử lớp tỷ lệ giữ). `tinhLaiMtCu` tính lại cờ khi đổi `lich_su`; DB cũ: bước TD7b của migrate tự tính lại cờ lệch (bản chép 648 lượt).
Nơi đọc cờ: `CON_O_SQL` (Công việc, Lịch Test, chuông, badge lớp) đã loại lịch sử band · Nợ điểm (`scoreDebt`) và `LOP_CON_VIEC_SQL`: ô lịch sử luôn
`progress = 'lich_su'` (không bao giờ nợ) · `LUOT_HIEN_TAI_SQL` chỉ xét cờ khi lộ trình không `route` (bản chép: 883 / 883 MT lịch sử là FT có `route`) · sổ nghĩa vụ
không tính `lich_su`. Bản chép: JSON 0 / 1 028 + 0 / 369 khác (số việc không đổi); bước VM `la_mt_moi` 43 810 → 31 213 / lần (−29 %, ước 4,39 → ~3,1 M / ngày),
Nợ điểm 28 727 → 27 310, câu lượt Lịch Test 9 656 → 7 754.

[XM] cho PTA (chưa làm — đổi luật cờ / cách tính, cần quyết):
1. ~~**`la_mt_moi`**~~ (đã làm ở PR c, trên): 646 / 1 206 lượt mang cờ "còn ô chờ" (`o_cho_tu`) trên bản chép là **MT lịch sử FT** — `CON_O_SQL` luôn loại chúng nhưng câu vẫn đi qua
   chỉ mục cờ rồi mới loại. Bỏ chúng khỏi cờ (`O_CHO_TU_SQL` = NULL khi `lich_su = 1` ở chương trình band) đo được −18 % bước VM câu này (~−0,8 M / ngày), nhưng
   cờ đang được `LUOT_HIEN_TAI_SQL` / `LOP_CON_VIEC_SQL` / Nợ điểm đọc → đổi nghĩa cờ, phải rà cả ba + tính lại cờ khi migrate. Phần lớn còn lại là câu con
   "MT mới nhất có band" theo TỪNG lượt — tính một lần mỗi em (gom theo em) ước −40 %.
2. **`napCaseMo`**: đã làm phần `current_class_id` (PR b, −7 %). `iv_count` + `LA_CASE_SOS` đọc PA theo `idx_intervention_case` — đổi sang lô vẫn đọc đúng các dòng đó, không bớt.

## 4. Khởi động lạnh (mục e) — đo, không sửa

- Không có migrate / kiểm bảng / nạp cấu hình lúc khởi tạo: `createApp` chỉ dựng route; kết nối Turso mở lười ở câu đầu (`db()` + `PRAGMA foreign_keys`).
- Gói hàm (esbuild như Netlify): **5,8 MB** JS. `require` trên máy dev 170 ms, trong đó V8 biên dịch 102 ms, express + phụ thuộc ~25 ms. Lớn nhất:
  `shared/i18n/en` 1,06 MB (từ điển tiếng Anh — máy chủ dịch câu lỗi / báo cáo), `iconv-lite` 0,53 MB, mã nghiệp vụ ~3 MB.
- Init Netlify p50 671 ms = khởi động runtime Netlify + nạp gói (CPU Lambda chậm hơn máy dev ~2–3 lần). 218 lần / ngày × ~0,5 s.
- Cách giảm được (chưa làm, cần PTA quyết): (1) minify gói — Netlify không có tuỳ chọn minify cho esbuild trong `netlify.toml`; phải tự build gói rồi trỏ
  `[functions]` vào → đổi đường deploy. (2) Tách từ điển `en` khỏi gói, đọc lười khi cần câu tiếng Anh → đổi `t()` / `dichSang` sang nạp lười. Lợi ước
  ~50–100 ms × 218 lần / ngày; rủi ro đường deploy. Khuyến nghị: chưa làm.
- Mất luồng (284 / ngày, 3 %): mỗi lần tốn một vòng hỏng + mở lại kết nối. Có thể mở lại kết nối chủ động khi nghỉ > ~10 s, nhưng ngưỡng hết hạn luồng
  Hrana không chắc → mở lại thừa mất kết nối HTTP còn tốt (bắt tay TLS mới). Không làm.

## 5. Còn lại (dòng trả, cận dưới, main + PR này: 6,42 triệu / ngày — Turso thật xem 3b)

| việc | ước | ghi chú |
|---|---|---|
| Tổng quan GV `/my-work` + `/hai-khoi` đọc 3 lần cùng tập lượt (Công việc · Nợ điểm `scoreDebtCells` · chỉ số hồ sơ GV) | ~−0,25 triệu | Đổi thiết kế (TURSO-1211 F) — chờ chủ SP |
| `loadSkillRows` + điểm vẫn 41 % dòng: tỉ lệ với số lượt trang đọc (Tổng quan QL / QT / CX 5–12 k dòng, Học viên Admin / CX 11–17 k) | — | Muốn bớt phải đổi trang đọc ít lượt (theo kỳ / theo lớp) — đổi bố cục số liệu, cần PTA |
| `/students/:id` vẫn 54 câu (mọi câu khác nhau, không lặp) — trên Turso ~2 s | — | gộp câu Case / PA của hồ sơ thành ít câu hơn: PR riêng nếu PTA muốn |
| `/classes/:id/overview` 32 câu, `viec-theo-em` 30, `roster` 23 | — | không còn câu lặp; bớt nữa = gộp câu khác nhau |

## Cách chạy lại

```bash
npm run build:server
cp D:/Github/pisa-mig/mig.sqlite <tạm>/a.sqlite && PISA_DB=<tạm>/a.sqlite node dist-server/server/src/migrate/run.js
python -I scripts/do-ban-chep-ds.py <tạm>/a.sqlite <tạm>/ds.json
node scripts/do-ban-chep.mjs <tạm>/a.sqlite <tạm>/ds.json <tạm>/w          # lượt ấm (chạy bù việc nền) — bỏ số
PISA_IN_JSON=1 node scripts/do-ban-chep.mjs <tạm>/w.sqlite <tạm>/ds.json <tạm>/truoc
```
