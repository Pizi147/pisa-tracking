# PR-TD3 · Tốc độ đợt 2: đọc ít dòng — kế hoạch 09/10/2026

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (một session code làm hết, theo thứ tự task). Bước dùng `- [ ]`.

**Goal:** Lịch Test ≤ 0,8 s, Học viên & Lớp và hồ sơ lớp ≤ 1,5 s, huỷ một lượt ≤ 200 câu SQL trên bản chính.

**Architecture:** TD2 (a–d, #253 #254 #258, đã deploy) đã bỏ đọc lặp và bớt câu. Log bản chính 09/10 cho thấy giờ chậm vì **số dòng
đọc từ Turso**, không vì số câu: các màn danh sách vẫn nạp MỌI lượt (cả lượt đã chấm xong từ lâu) rồi lọc bằng JS. TD3 lọc trước
bằng SQL (tập cha an toàn), giữ nguyên lọc JS phía sau → kết quả trùng từng byte.

**Tech Stack:** Node/Express, libsql (Turso), SQLite cục bộ, `server/src/tests/run.ts` + `tocDo.run.ts`, `scripts/chup-api.mjs`.

**Spec:** chủ sản phẩm 09/10 gửi 5 ảnh log Netlify (dưới đây) + kế hoạch cũ `2026-10-07-pr-toc-do-chuyen-trang.md` (TD2-e/f "để sau, đo lại rồi quyết").

## 0. Số đo bản chính 09/10 (16:00–16:27, sau deploy #285)

| Đường | ms | câu | dòng | Ghi chú |
|---|---|---|---|---|
| `GET /cham/lich-test` | **1 660–2 554** (13 lần / 30 phút, có lúc mỗi 8 s) | 20 (một lần 30) | **3 761–3 801** | màn GV mở nhiều nhất; dòng tăng dần khi nhập điểm |
| `GET /hoc-vien-lop` | **2 886–3 659** | 60–69 | **5 961** | không đổi sau TD2 (trước 3,2–3,5 s) |
| `GET /classes/9/overview` | 2 522 | 83 | **7 243** | MỘT lớp mà 7 243 dòng |
| `POST /attempts/165/cancel` | 1 877 | **329** | 618 | **vượt luật ≤ 200 câu mỗi lần ghi** |
| Turso "connection closed…" | — | — | — | 2 lần, đã tự mở lại (thử lại #277 chạy đúng) — không làm gì |

Mô hình mới (khớp 3 đường GET): **`ms ≈ 40 + 8 × câu + 0,42 × dòng`**. Lịch Test: 40 + 160 + 1 580 ≈ 1,78 s (đo 1,66–1,83 ✓).
→ Dòng chiếm 80–90 %. Bớt câu không còn lợi; phải **bớt dòng**.

Gốc đã thấy khi đọc mã (TD3-0 phải xác nhận bằng số):
- `noQuaHan` (`server/src/cham/canCham.ts:232`) gọi `listAttempts(p, { scope: 'managed', chiDangHoc: true, phamViCham: true })` cho
  **toàn phạm vi, mọi tuần** rồi `conBaiCanCham(a)` lọc bằng JS → nạp bundle (ô kỹ năng + điểm) của mọi lượt đã chấm xong.
- `/hoc-vien-lop`, `/classes/:id/overview`: nạp bundle mọi lượt của lớp để đếm/huy hiệu (gốc TD2-f).
- `huyLuot` (`server/src/fasttrack/attempts.ts:1368`): số câu theo số em/ô/Case — cần đo xem chỗ nào lặp.

## Global Constraints

- CLAUDE.md "Bộ nhớ khi chạy kiểm": KHÔNG gỡ / đi vòng bộ nhớ câu lệnh `prepare` ở `server/src/db.ts`.
- Turso: không tham số đặt tên; `UNION` ≤ 20 vế và mỗi vế có `AS`; ≤ 900 tham số mỗi câu (chia lô 400 như `theoLo`); ≤ 200 câu mỗi lần ghi.
- Không đổi giao diện, không đổi JSON trả về: `scripts/chup-api.mjs` trước/sau **trùng từng byte** mọi (đường × vai) — trừ đúng các đường TD3-0 thêm trường log (không có).
- Đường đọc có trần câu `TRAN` (giữ, hạ theo đo mới) và trần dòng `TRAN_DONG` ở `server/src/tests/tocDoDuong.ts`: max(đo+50, ⌈đo×1,3⌉).
- Không deploy, không chạm Turso/Netlify/DB bản chính.

## Review Focus

1. Lượt có ô "-" (không dự thi) đã dời sang tuần khác: vẫn phải hiện ở Nợ/Chấm tuần này — lọc SQL không được bỏ lượt này.
2. Lượt Writing (ô `writing1` + `writing2`): chỉ một ô có điểm vẫn là còn bài.
3. Ô kỹ năng đã huỷ (`sit_status = 'cancelled'`) và lượt đã huỷ: không sinh nợ — như cũ.
4. GV Speaking chấm chéo (`phamViCham`) thấy S Mock quá hạn lớp FT cùng chi nhánh — như cũ.
5. Em Tạm dừng / lớp lưu trữ: không sinh nợ — như cũ.

Mỗi mục có phép kiểm ở Task 2 (so trước/sau trên seed ×3 có đủ năm loại dữ liệu này).

---

### Task 1: TD3-0 · Biết câu nào đọc nhiều dòng (S)

**Files:**
- Modify: `server/src/db.ts` (chỉ chỗ đếm `demCau`/`dong`, KHÔNG đụng bộ nhớ câu lệnh), `server/src/platform/nguCanhRequest.ts`, `server/src/app.ts:58-84`
- Test: `server/src/tests/prTd3.tests.ts` (mới, gọi ở cuối `run.ts`)

**Interfaces:**
- Produces: `res.locals.dem.top: Array<{ sql: string; dong: number }>` — 3 câu nhiều dòng nhất của request (`sql` = 80 ký tự đầu, gộp khoảng trắng).

- [ ] **Step 1:** Phép kiểm `TD3-0-1`: gọi `GET /cham/lich-test` (QL) trong ngữ cảnh request → `dem.top.length` ≤ 3, sắp giảm theo `dong`, tổng `dong` của top ≤ `dem.dong`.
- [ ] **Step 2:** Chạy `npm run test:server` (hoặc lệnh test của repo) → đỏ.
- [ ] **Step 3:** Ở chỗ cộng `dong` trong `db.ts`, giữ top 3 theo số dòng (mảng 3 phần tử, không lưu tham số). `[cham]` in thêm `· top: <dòng> <sql> | …`.
- [ ] **Step 4:** Test xanh. Chạy seed ×3 (cách đo của TD2, mục 5 kế hoạch cũ) và ghi bảng **đường × top 3 câu × dòng** cho 4 đường ở mục 0 vào mô tả PR. Đây là căn cứ cho Task 2–4: nếu top khác dự đoán ở mục 0, sửa đúng câu top, không sửa theo dự đoán.
- [ ] **Step 5:** Commit `PR-TD3-0: log [cham] kèm 3 câu đọc nhiều dòng nhất`.

### Task 2: TD3-a · Lịch Test chỉ nạp lượt còn ô chưa có điểm (M) — lợi lớn nhất

**Files:**
- Modify: `server/src/fasttrack/attempts.ts:597-623` (`listAttempts`), `server/src/cham/canCham.ts:232` (`noQuaHan`)
- Test: `server/src/tests/prTd3.tests.ts`, `server/src/tests/tocDoDuong.ts`

**Interfaces:**
- Produces: tuỳ chọn `listAttempts(p, { …, chiConO?: boolean })` — thêm vào `where` một điều kiện SQL: `a.status != 'cancelled'` VÀ tồn tại ô `attempt_skills` `required = 1`, `sit_status != 'cancelled'` mà **chưa có điểm thật** (`band`/`raw_score` NULL; Writing cần đủ 2 ô `writing1`/`writing2`). Ô chỉ có "-" (`no_show_period_id`) **vẫn tính là chưa có điểm** (tập cha: dời "-" phải còn hiện). Mẫu SQL: câu `EXISTS` trong `mtLichSuChuaNhap` (`canCham.ts:124-129`) bỏ vế `no_show_period_id`.
- `noQuaHan` gọi `listAttempts` với `chiConO: true`; vòng lọc JS `conBaiCanCham(a)` **giữ nguyên**.

- [ ] **Step 1:** Phép kiểm `TD3-a-1`: trên seed ×3, với mọi vai (QL, QT, GVCN, GVBM, GV Speaking), `noQuaHan(p, …)` với và không `chiConO` trả **cùng JSON** (deepStrictEqual) — tạm cho phép gọi hai cách qua tham số thử. Seed phải có: ô "-" đã dời, Writing một ô, ô kỹ năng huỷ, lượt huỷ, em Tạm dừng (Review Focus 1–5; thiếu thì thêm dữ liệu trong phép kiểm).
- [ ] **Step 2:** `TD3-a-2`: `GET /cham/lich-test` (QL, seed ×3) số dòng ≤ 40 % số đo trước sửa (ghi số đo trước vào chú thích).
- [ ] **Step 3:** Chạy → `TD3-a-2` đỏ.
- [ ] **Step 4:** Thêm `chiConO` vào `listAttempts`, bật ở `noQuaHan`. Nếu Task 1 cho thấy `hangLopTuan`/`mtLichSuChuaNhap` cũng trong top 3 thì lọc tương tự (tập cha + giữ lọc JS).
- [ ] **Step 5:** Test xanh; `chup-api` trước/sau trùng byte. Đặt `TRAN_DONG` cho 3 URL Lịch Test × mọi vai; hạ `TRAN` nếu giảm.
- [ ] **Step 6:** Commit `PR-TD3-a: Lịch Test chỉ nạp lượt còn ô chưa có điểm`.

### Task 3: TD3-b · Học viên & Lớp, hồ sơ lớp: đếm không nạp cả bundle (M)

**Files:** theo top 3 của Task 1 cho `/hoc-vien-lop` và `/classes/:id/overview` (dự đoán: `server/src/classes/hocVienLop.ts`, `server/src/classes/classes.ts`, `loadBundle` ở `attempts.ts:99`).

**Interfaces:**
- Consumes: `chiConO` (Task 2) nếu số đếm/huy hiệu chỉ cần lượt còn ô trống.
- Produces: không đổi chữ ký route.

- [ ] **Step 1:** Với từng câu top của hai đường, ghi lại nơi gọi dùng KẾT QUẢ để làm gì (đếm, huy hiệu, bảng). Câu chỉ để đếm/huy hiệu → thay bằng `COUNT`/`EXISTS` hoặc lọc `chiConO`; câu cần cho bảng hiển thị → chỉ đọc đúng cột (như TD2-a), không đổi.
- [ ] **Step 2:** Phép kiểm `TD3-b-1`: `/hoc-vien-lop` (5 vai) và `/classes/{lopFT}/overview` (QL, GVCN) trên seed ×3 — JSON trùng trước/sau; `TD3-b-2`: số dòng `/hoc-vien-lop` QL ≤ 50 % số đo trước, overview ≤ 50 %.
- [ ] **Step 3:** Đỏ → sửa → xanh; `chup-api` trùng byte; đặt `TRAN_DONG`.
- [ ] **Step 4:** Commit `PR-TD3-b: Học viên & Lớp, hồ sơ lớp đếm bằng SQL`.
- Không đạt ≤ 50 % mà không đổi luật nghiệp vụ → dừng, ghi lý do + số vào mô tả PR, KHÔNG đổi luật.

### Task 4: TD3-c · Huỷ một lượt ≤ 200 câu (S)

**Files:** `server/src/fasttrack/attempts.ts:1368` (`huyLuot`) và hàm nó gọi; `server/src/tests/tocDoDuong.ts` (`TRAN_GHI_LO`).

- [ ] **Step 1:** Phép kiểm `TD3-c-1`: dựng lượt nặng nhất có thể trên seed (lượt MT đủ 4 kỹ năng, Writing 2 ô, có Case/việc liên quan, lớp 40 em nếu huỷ kéo cả lớp) → `POST /attempts/:id/cancel` ≤ 120 câu SQL; dữ liệu sau huỷ trùng với cách cũ (so bảng `attempt_skills`, `assessment_scores`, `cases`, lịch sử).
- [ ] **Step 2:** Đỏ (đo bản chính 329).
- [ ] **Step 3:** Đếm câu theo hàm (log `[sql]` cục bộ), gom các câu lặp theo em/ô thành câu `IN (…)` chia lô 400. Không đổi thứ tự ghi, không bỏ bước nào.
- [ ] **Step 4:** Xanh; thêm `huyLuot` vào `TRAN_GHI_LO`. Commit `PR-TD3-c: huỷ lượt gom câu ghi (≤ 200 câu)`.

### Task 5: Kiểm và mở PR

- [ ] `npm run check` một lần (song song tối đa 3 trên máy; OOM/exit 127 → chạy từng bước).
- [ ] Bấm thử Playwright QL (2), GVCN (7), GVBM (9): Lịch Test (Nợ, Chấm tuần này, Lịch), Học viên & Lớp, hồ sơ lớp FT, huỷ một lượt — số liệu trên màn như trước.
- [ ] `/ponytail-review`; PR vào main, KHÔNG merge. Mô tả: bảng trước/sau (câu, dòng, ms ước theo mô hình mục 0), top 3 câu từng đường, chú thích `ponytail:`.

## Sau khi deploy

Đọc log `[cham]` 1–2 ngày (giờ có top 3 câu). Còn đường > 1,5 s → đường đó thành TD3-d riêng, căn cứ top 3 thật trên bản chính.
TD2-e (gom ô Tổng quan QL) vẫn để sau: log 09/10 không thấy `/metrics/*` chậm.

## Prompt session code

```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High). Fable hoặc model khác thì dừng. /ponytail full (logic máy chủ, không giao diện).

Repo Pizi147/pisa-tracking. Đọc CLAUDE.md, plan.md mục 1.4 + 1.5, CODE_MAP.md mục "Tốc độ (PR-TD)",
docs/superpowers/plans/2026-10-07-pr-toc-do-chuyen-trang.md (mục 1.3, 5 — cách đo), rồi làm ĐÚNG
docs/superpowers/plans/2026-10-09-pr-td3-toc-do-doc-it-dong.md, Task 1 → 5 theo thứ tự.
Nhánh pr-td3 từ origin/main. Không deploy, không chạm Turso/DB bản chính. KHÔNG gỡ bộ nhớ câu lệnh ở server/src/db.ts.
Task 1 là căn cứ: top 3 câu khác dự đoán thì sửa đúng câu top. JSON trước/sau phải trùng byte; khác thì dừng tìm nguyên nhân.
Xong: PR vào main, không merge. Báo ≤ 15 dòng: số PR, bảng trước/sau (câu, dòng), việc còn lại.
```
