# PR-TD2 · Tốc độ chuyển trang (bản chính) — kế hoạch 07/10/2026

> Chủ sản phẩm 07/10 (sau deploy): "tốc độ chuyển giữa các trang khá chậm". Đo trước: Học viên & Lớp ~3,3 s.
> Kế hoạch soạn bởi session planning (Opus 5.5). **Không** đụng giao diện trừ mục "Chỉ đề xuất" cuối (cần mockup).
> Luật nền: CLAUDE.md (libsql `prepare` / bộ nhớ câu lệnh `db.ts` — KHÔNG gỡ), plan.md 1.4 (Turso: không tham số đặt tên,
> UNION ≤ 20 vế, ≤ 900 tham số, đường mới có trần ở `tocDoDuong.ts`).

## 1. Đo hiện trạng

### 1.1. Nhật ký bản chính (`netlify logs --function api`, 06/10 13:47 → 07/10 13:25, ~1 420 lượt lấy mẫu theo cửa sổ 20 phút)

| Chỉ số | Giá trị |
|---|---|
| Thời gian một lượt (Duration) | p50 **154 ms** · p75 276 · p90 628 · p99 **2,5 s** · max 4,3 s |
| Cold start | **16 %** lượt (226/1 416), Init p50 **514 ms** (max 605). Lượt cold dồn theo cụm: giây có cold trung bình 4,4 lượt, 2,2 cold → mỗi lần đổi trang bắn nhiều request song song, Netlify mở thêm bản hàm mới |
| `[cham]` (≥ 3 s) | chỉ hai đường: `GET /hoc-vien-lop` **3,2–3,5 s** (8 lần, rất đều) · `GET /my-work` **3,1–4,3 s** (3 lần) |
| Mất kết nối Turso | 6 lỗi 500 `Hrana(Http("connection closed…"))` trước 09:41 (trước bản sửa thử lại 07/10); sau đó 4 lần **thử lại thành công** — không còn là nguồn chậm đáng kể |
| Vùng | Hàm `us-east-2` (đọc `getSite`), Turso Ohio — cùng vùng, đúng |
| Gói hàm | `api.zip` 9,6 MB (có libsql native) |

### 1.2. Đo cục bộ (origin/main 09223024, `npm run seed`, `vite build` + `vite preview`, Playwright Chrome 1440, chuyển trang bằng router)

Cột: **req** = số request API · **sâu** = số tầng nối tiếp (waterfall) · **câu** = tổng câu SQL (đếm `PISA_DEM_SQL`) ·
**KB đọc** = tổng dữ liệu DB các câu trả về (JSON hoá từng dòng) · **ms ước** = mô hình bản chính (mục 1.3), theo tầng nối tiếp.
Máy cục bộ (SQLite file) mọi trang < 0,35 s — chậm là chuyện riêng của Turso.

| Trang (QL id 2) | req | sâu | câu | KB đọc | ms cục bộ | **ms ước bản chính** |
|---|---|---|---|---|---|---|
| Tổng quan (12 request song song) | 12 | 1 | 360 | 4 200 | 194 | **2 500** (+0,5 s nếu cold) |
| Học viên & Lớp | 3 | 1 | 111 | 1 667 | 126 | **3 000** (đo thật 3,3 s ✓) |
| Hồ sơ lớp › Học viên | 7 | 2 | 298 | 3 288 | 232 | **4 700** |
| Hồ sơ lớp › Ý thức | 2 | 1 | 81 | 854 | 63 | 1 650 |
| Hồ sơ lớp › Phân tích | 1 | 1 | 21 | 295 | 21 | 640 |
| Hồ sơ HV | 6 | 3 | 271 | 911 | 90 | **2 750** |
| Test › Lịch Test | 6 | 3 | 160 | 920 | 152 | 2 200 |
| Test › Kế hoạch Test | 3 | 2 | 68 | 549 | 49 | 1 200 |
| Test › Điểm theo lớp | 4 | 2 | 105 | 367 | 49 | 980 |
| Case (link `/hoc-thuat/case/:id`) | 10 | 3 | 383 | 236 | 70 | 1 750 |
| Công việc (Tất cả GV) | 3 | 1 | 117 | 1 731 | 125 | **3 150** (đo thật 3,1–4,3 s ✓) |
| Công việc › Chờ duyệt | 3 | 1 | 73 | 69 | 48 | 400 |
| Phân tích | 6 | 1 | 101 | 467 | 46 | 520 |

| Trang (GVCN id 7) | req | sâu | câu | KB đọc | ms ước |
|---|---|---|---|---|---|
| Tổng quan GV | 4 | 1 | 175 | 1 597 | 1 700 |
| Học viên & Lớp | 2 | 1 | 94 | 1 740 | **3 200** |
| Hồ sơ lớp › Học viên | 5 | 2 | 253 | 3 847 | **5 150** |
| Hồ sơ HV | 4 | 2 | 232 | 1 198 | 3 050 |
| Lịch Test / Kế hoạch Test | 4 | 2 | 99 | 657 | 1 400–1 600 |
| Công việc | 2 | 1 | 86 | 729 | 1 700 |

Admin (id 1) giống QL, nặng hơn ở Công việc (2,4 MB → ~4,2 s) và Tổng quan (5,6 MB → ~3,5 s).
JS: đã tách theo trang (`lazy`), gói chính 112 KB gzip, mỗi trang 10–32 KB gzip → **không** phải gốc chậm.
Vào lại trang đã xem: `useApi` (`daXem`, d48054c2) hiện ngay bản cũ rồi tải nền — đã ổn; chậm là ở **lần đầu** mở mỗi trang/lớp/HV.

### 1.3. Mô hình thời gian một request trên bản chính

`ms ≈ 40 + 8 × số câu + 1,45 × KB đọc` — khớp ba điểm thật: `/hoc-vien-lop` (77 câu, 1,6 MB → 3,0 s, đo 3,2–3,5),
`/my-work?nguoi=tat-ca` (82 câu, 1,7 MB → 3,1 s, đo 3,1–4,3), `/ref/branches` (8 câu, ~0 KB → 0,1 s ≈ p50 154 ms).
Kết luận: **khối dữ liệu đọc từ Turso** (dòng/cột thừa, đọc lặp) chiếm ~80 % thời gian các trang chậm; số câu nối tiếp chiếm phần còn lại.
Một câu Turso cùng vùng ~5–8 ms; mỗi dòng rộng qua Hrana (JSON) tốn đáng kể. Phỏng đoán này **phải được xác nhận** bằng log ở TD2-0.

## 2. Gốc chậm (xếp theo mức lợi)

1. **`loadBundle` / `loadSkillRows` đọc rộng và đọc lặp** (`server/src/fasttrack/attempts.ts:99`, `skillSchedule.ts:83`).
   `SELECT ask.* … attempt_skills` (0,4–0,9 MB) và `SELECT s.* … assessment_scores` (0,1–0,35 MB) chạy **2–3 lần trong cùng một
   request** cho cùng tập lượt (QL `/hoc-vien-lop`: 825 KB ×2 + 317 KB ×2; `/tong-quan/chi-nhanh`: 867 + 348 ×2; `/my-work`,
   `/classes/:id/roster`, `/cham/lich-test`, `/tong-quan/lop-toi-day`, `/tong-quan/diem-chu-y`, `/metrics/hv-duoi-ky-vong-mon` đều dính).
   Trần câu SQL hiện có (`TRAN`) không bắt được vì số câu ít — **dữ liệu** mới là cái lớn.
2. **Danh sách dự phòng của Trước/Sau tải cả trang danh sách** (`web/src/ui/ThanhTruocSau.tsx`, `dsDuPhong`):
   hồ sơ lớp gọi `api.get('/hoc-vien-lop')` (1,6 MB, **3 s**, `DauTrangLop.tsx:161`, không qua `getChung` nên không dùng chung);
   hồ sơ HV gọi `/classes/:id/roster` (0,8 MB, ~1,6 s, `StudentDetailPage.tsx:186`) — chỉ để lấy danh sách id.
3. **Waterfall hồ sơ lớp / hồ sơ HV**: `/classes/:id/overview` xong mới bắt đầu `roster` + `diem-theo-luot` (tầng 2, ~1,6 s);
   hồ sơ HV: `/students/:id` xong mới gọi `skill-board?cycleId=` (tầng 2) rồi tầng 3.
4. **Nhiều request song song mỗi trang → cold start**: Tổng quan QL 12 request (7 ô `/metrics/*` mỗi ô đọc lại bundle riêng);
   mỗi bản hàm mới +0,5 s Init. `/yeu-cau/dem` (21 câu) gọi lại **mỗi lần đổi đường dẫn** (`App.tsx:100`, deps `[location.pathname]`),
   trang Case gọi nó và `/cases/:id` hai lần.
5. **Phiên mỗi request 6 câu nối tiếp** (`auth.ts` `resolveSession` + `permissions.ts` `loadPrincipal`: phiên JOIN user, `users`,
   `role_permissions` cả bảng 60 dòng, `user_roles`, `user_permissions`, `teacher_assignments`) ≈ 40–50 ms mỗi request;
   `demo_config` đọc 2–4 lần mỗi request.

## 3. Các PR đề xuất

### TD2-0 · Log đo trên bản chính (S) — gộp vào TD2-a, làm đầu tiên
- Việc: trong `demGio` (`server/src/app.ts`) khi lượt ≥ 1 000 ms in `[cham]` kèm `n câu, d dòng` (đếm dòng ở khối vá `db.ts` cạnh `demCau`,
  chỉ cộng `length` — không JSON hoá). Giữ ngưỡng 3 s cũ cho chữ `[cham]` hay đổi thành 1 s: **1 s** (để thấy trang 1–3 s).
- File: `server/src/app.ts`, `server/src/db.ts` (chỉ thêm đếm, KHÔNG đụng bộ nhớ câu lệnh), `server/src/platform/nguCanhRequest.ts`, `hanGio.ts`.
- Lợi: xác nhận mô hình 1.3 sau deploy; rủi ro ~0.

### TD2-a · Đọc lượt một lần, đúng cột (M) — lợi lớn nhất
- Việc:
  1. Nhớ theo request **theo từng id lượt**: `loadSkillRows(ids)` và câu điểm của `loadBundle(ids)` giữ `Map<attemptId, rows>` trong
     ngữ cảnh request (`nguCanhRequest.ts`, cùng cơ chế `nho`); chỉ hỏi DB các id chưa có. Ghi (`run`) đã tự xoá bộ nhớ — giữ nguyên luật đó.
     Giá trị nhớ là dùng chung: không sửa tại chỗ (`PISA_DONG_BANG_NHO=1` trong `tocDo.run.ts` lộ chỗ sửa nhầm).
  2. Bỏ `ask.*` / `s.*`: liệt kê đúng cột các nơi gọi dùng (rà kiểu `SkillRow` / dòng điểm; cột văn bản dài như `note`, `comment`,
     `scope_reason`, `sit_note`, `deadline_override_reason` chỉ đọc ở màn chi tiết cần chúng — tách hàm đọc đầy đủ cho các màn đó).
  3. `demo_config` đọc qua `nho` (một lần mỗi request).
- File: `server/src/fasttrack/attempts.ts`, `server/src/fasttrack/skillSchedule.ts`, `server/src/students/profile.ts:579` (câu điểm thứ ba),
  `server/src/platform/nguCanhRequest.ts`, nơi đọc `demo_config`.
- Lợi ước: KB đọc giảm 50–70 % ở `/hoc-vien-lop`, `/my-work`, roster, lịch Test, Tổng quan → Học viên & Lớp **3,0 → 1,0–1,5 s**,
  Công việc QL 3,1 → ~1,3 s, Hồ sơ lớp 4,7 → ~2 s (cùng TD2-b, c còn thấp hơn).
- Rủi ro: trung bình — sai cột thì một màn thiếu dữ liệu. Chặn bằng `scripts/chup-api.mjs` so JSON mọi (đường × vai) trước/sau: **phải trùng từng byte**.

### TD2-b · Trước/Sau không tải cả danh sách (S)
- Việc: `dsDuPhong` dùng đường nhẹ: lớp → `/ref/classes` (đã có, 8 câu, đã trả `scoring_mode`) nếu cùng phạm vi + thứ tự với
  `/hoc-vien-lop` mặc định; khác thì thêm `GET /hoc-vien-lop/ids` (chỉ id + scoringMode, cùng luật phạm vi, không nạp bundle); HV → đường mới `GET /classes/:id/hoc-vien-ids` (id + tên, sắp A→Z như roster) hoặc thêm `?chiId=1` cho roster.
  Không đổi cách Trước/Sau hiện (đọc `location.state`/bộ nhớ trước, dự phòng sau — giữ nguyên thứ tự).
- File: `web/src/ui/ThanhTruocSau.tsx` (không đổi), `web/src/modules/classes/DauTrangLop.tsx:158-163`,
  `web/src/modules/students/StudentDetailPage.tsx:186`, `server/src/routes/index.ts` (+ `tocDoDuong.ts` đường mới).
- Lợi ước: hồ sơ lớp mở bằng link **−3 s** (một request 1,6 MB biến mất), hồ sơ HV **−1,5 s**; bớt một bản hàm song song.
- Rủi ro: thấp — thứ tự danh sách dự phòng phải giữ đúng như cũ (phép kiểm so thứ tự id).

### TD2-c · Bớt request trùng và waterfall phía web (S)
- Việc:
  1. `/yeu-cau/dem` (`App.tsx:100`): bỏ deps `[location.pathname]`; tải lại khi `invalidate('/yeu-cau')` (đã có) và khi đổi trang nếu bản
     cũ > 60 s (một biến thời điểm, không thêm thư viện).
  2. Tải trước song song: `ClassOverviewPage` bắt đầu `/classes/:id/roster` và `duongDiemTheoLuot(classId)` cùng lúc với `/overview`
     (hàm `taiTruoc(path)` ở `useApi.ts` = `getChung` + `nhoBanXem`, component con dùng lại nhờ `dangBay`/`daXem`). Chỉ khi tab là
     `hoc-vien` (tab mặc định của lớp đang chạy).
  3. Hồ sơ HV: cho `/students/:id/skill-board` không kèm `cycleId` = lộ trình đang chạy (máy chủ tự chọn), web gọi song song với `/students/:id`
     khi URL không chỉ định lộ trình/đợt.
  4. `CaseRoutePage`: dùng lại `/cases/:id` đã có (`daXem`) — không gọi lần hai sau khi chuyển.
  5. `/ref/branches`, `/ref/periods` (gần như tĩnh): dùng `cachedGet` (đã có ở `api.ts`, xoá khi đổi tài khoản).
- File: `web/src/App.tsx`, `web/src/lib/useApi.ts`, `web/src/modules/classes/ClassOverviewPage.tsx`, `web/src/modules/students/StudentDetailPage.tsx`,
  `web/src/modules/cases/CaseBoardPage.tsx`, `server/src/routes/index.ts` (skill-board mặc định).
- Lợi ước: hồ sơ lớp −1 tầng (**−1,5 s**), hồ sơ HV −1 tầng (−0,3–1 s), mỗi lần đổi trang bớt 1 request (bớt cold start).
- Rủi ro: thấp; huy hiệu Chờ duyệt có thể trễ tối đa 60 s khi người khác gửi yêu cầu (lần ghi của chính mình vẫn xoá ngay).

### TD2-d · Phiên 6 câu → 1 câu (S)
- Việc: `resolveSession` + `loadPrincipal` gộp thành MỘT câu (phiên JOIN user + `json_group_array` cho grants, quyền cấp riêng, phân công;
  quyền theo vai lấy trong cùng câu bằng JOIN). Không nhớ quyền giữa các request (thu quyền phải có hiệu lực ngay). Không tham số đặt tên.
- File: `server/src/auth.ts`, `server/src/permissions.ts` (`loadPrincipal` giữ chữ ký; `/demo/session` dùng chung).
- Lợi ước: −5 câu mỗi request ≈ **−40 ms mọi request** (mọi trang, mọi lần ghi); trần `TRAN` mọi đường hạ ~5.
- Rủi ro: thấp–trung bình (phân quyền) — phép kiểm hiện có về quyền phải xanh nguyên; so `chup-api` trùng byte.

### TD2-e · Tổng quan QL một lượt gọi (M) — làm SAU khi đo lại a–d
- Việc: các ô `/metrics/*?ct=` của Tổng quan QL gom thành `GET /tong-quan/quan-ly/o-so?ct=` trả mọi số một lần (cùng request → bộ nhớ
  bundle dùng chung từ TD2-a). Giữ các đường cũ (danh sách bấm ra vẫn dùng).
- Lợi ước: 12 → ~5 request, KB đọc Tổng quan 4,2 MB → ~1 MB, bớt cold start → **2,5 → ~1 s**.
- Rủi ro: trung bình — ô nào lỗi thì cả khối lỗi (nay từng ô riêng). Chỉ làm nếu sau a–d Tổng quan QL vẫn > 1,5 s.

### TD2-f · (để sau, L) Tính số đếm bằng SQL thay vì nạp cả bundle
`/hoc-vien-lop`, `/my-work`, `/tong-quan/chi-nhanh` nạp mọi lượt của mọi lớp trong phạm vi chỉ để đếm/huy hiệu. Viết lại bằng `COUNT`/`EXISTS`
là đổi luật nghiệp vụ ở nhiều chỗ — chỉ làm nếu sau TD2-a log TD2-0 vẫn thấy > 1,5 s. Không lập kế hoạch chi tiết bây giờ.

### Chỉ đề xuất (giao diện — **cần mockup**, không làm trong TD2)
- Khi đổi trang chưa có dữ liệu: giữ khung trang (đầu trang, tab) và skeleton cho từng bảng thay vì một skeleton cả trang
  (`App.tsx` `Suspense` + `loading` từng trang). Cần mockup 375/1440 sáng/tối trước khi làm.

## 4. Thứ tự

1. **TD2-a (+ TD2-0)** — lợi lớn nhất, một session.
2. **TD2-b + TD2-c** — cùng một session (đều nhỏ, chạm web; chạy song song với TD2-a được: không chung file trừ `routes/index.ts`, `tocDoDuong.ts` — rebase nhẹ).
3. **TD2-d** — sau a (cùng chạm trần `TRAN`).
4. Deploy, đọc log `[cham]` mới 1–2 ngày → quyết TD2-e / TD2-f.

Mục tiêu sau 1–3: mọi trang chính lần đầu ≤ **1,5 s** (ước), Học viên & Lớp ≤ 1,5 s, Hồ sơ lớp ≤ 2 s.

## 5. Phép kiểm

- `server/src/tests/tocDo.run.ts`: thêm **trần dòng đọc** — đếm số dòng mọi câu trả về trong request (cùng chỗ đếm của TD2-0) và
  `TRAN_DONG` ở `tocDoDuong.ts` cho các đường nặng (đo sau khi sửa, trần = max(đo+50, ⌈đo×1,3⌉)): `/hoc-vien-lop`, `/my-work`,
  `/my-work?nguoi=tat-ca`, `/classes/{lopFT}/overview`, `/classes/{lopFT}/roster`, `/cham/lich-test`, `/tong-quan/chi-nhanh`,
  `/tong-quan/diem-chu-y?ct=ft`, `/tong-quan/lop-toi-day?ct=ft`, `/metrics/hv-duoi-ky-vong-mon`. Đo cả sau nhân dữ liệu ×3.
- Phép kiểm "không đọc lặp": trong một request GET, cùng câu `attempt_skills`/`assessment_scores` không trả lại cùng một `attempt_id` hai lần.
- `TRAN` (câu SQL): hạ theo số đo mới sau TD2-a, d (trần = max(đo+10, ⌈đo×1,3⌉) như luật cũ); đường mới của TD2-b, e thêm vào `DUONG_DO`.
- `scripts/chup-api.mjs` trước/sau (dùng chung một lần seed `--db`/`--khong-seed`): JSON mọi (đường × vai) **trùng hoàn toàn** cho TD2-a, d.
- Web: phép kiểm nguồn `prTd2.tests.ts` — `App.tsx` không còn `[location.pathname]` cho `/yeu-cau/dem`; `DauTrangLop`/`StudentDetailPage`
  không gọi `/hoc-vien-lop` / `roster` trong `dsDuPhong`.
- Bấm thử Playwright như đo này (QL, GVCN, Quản trị; 1440 + 375): ghi bảng req/sâu/câu/KB trước–sau vào mô tả PR.

## 6. Prompt session code

```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng.
/ponytail full (TD2-a, TD2-d là logic máy chủ). TD2-b+c chạm web nhưng KHÔNG đổi giao diện → vẫn full; không chạy impeccable.

Repo D:\Github\Pisa-tracking. Đọc CLAUDE.md, plan.md mục 1.4 + 1.5, CODE_MAP.md mục "Tốc độ (PR-TD)", rồi
docs/superpowers/plans/2026-10-07-pr-toc-do-chuyen-trang.md — làm đúng PR <TD2-a (+TD2-0) | TD2-b+c | TD2-d>.

Worktree: git worktree add .claude/worktrees/<nhánh> -b <nhánh> origin/main (nhánh: pr-td2-a | pr-td2-bc | pr-td2-d).
Cổng riêng: PORT=43xx WEB_PORT=53xx (khác 4000/5173 và khác session khác). Không deploy, không chạm Turso/DB bản chính.
KHÔNG gỡ / đi vòng bộ nhớ câu lệnh `prepare` trong server/src/db.ts (CLAUDE.md "Bộ nhớ khi chạy kiểm"); đếm dòng chỉ cộng length.
Turso: không tham số đặt tên, UNION ≤ 20 vế, ≤ 900 tham số/câu (chia lô như loadBundle).

Cách làm:
1. Trước khi sửa: build:server, chụp JSON mốc `node scripts/chup-api.mjs --db <file> ...` và đo bảng req/câu/KB (mục 1.2 kế hoạch).
2. Phép kiểm đỏ trước (mục 5 kế hoạch), rồi sửa.
3. Sau sửa: chụp lại cùng DB → so trùng hoàn toàn (TD2-a, d). Khác byte nào thì dừng, tìm nguyên nhân, không hạ phép so.
4. Hạ TRAN / đặt TRAN_DONG theo số đo mới (trần = max(đo+10, ⌈đo×1,3⌉) với câu; max(đo+50, ⌈đo×1,3⌉) với dòng).
5. npm run check (song song TỐI ĐA 3 lần trên máy; OOM/exit 127 thì chạy lại từng bước).
6. Bấm thử Playwright QL (2), GVCN (7), Quản trị (1), 1440 + 375: các trang chính mở được, Trước/Sau đúng thứ tự.
7. /ponytail-review; commit (Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> — hoặc Sonnet 5.5 nếu chạy B), push,
   PR vào main KHÔNG merge; mô tả PR: bảng trước/sau, các chú thích `ponytail:`; kết "🤖 Generated with [Claude Code](https://claude.com/claude-code)".
8. Dọn: tắt mọi tiến trình mình mở (theo PID, không taskkill hàng loạt), xoá file Vite tạm, gỡ worktree đo.
Báo lại ≤ 20 dòng: số PR, bảng trước/sau, việc còn lại.
```

## 7. Câu hỏi cho chủ sản phẩm

**Chủ sản phẩm 07/10: ĐỒNG Ý cả hai — (1) Chờ duyệt trễ tối đa 60 s: có; (2) TD2-e/f: để sau, đo lại sau a–d rồi quyết.**

1. Huy hiệu "Chờ duyệt" được phép trễ tối đa 60 s khi **người khác** gửi yêu cầu mới (đổi lại mỗi lần chuyển trang bớt một lượt gọi)? Mặc định kế hoạch: **có**.
2. Sau TD2-a…d, nếu Tổng quan QL vẫn > 1,5 s: gom các ô số thành một lượt gọi (TD2-e) — chấp nhận "một ô lỗi thì cả khối báo lỗi"? Mặc định: hỏi lại sau khi có log.
