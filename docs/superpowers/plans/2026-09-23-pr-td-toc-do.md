# PR-TD · Tốc độ trên Turso — Implementation Plan

| Mục | Chốt |
|---|---|
| Mã PR · đợt | **PR-TD** · **đợt 3 (trước deploy, bắt buộc)** — thêm theo đo đạc của người rà PR 23/09 |
| Nhánh · worktree | `pr-td-toc-do` · `.claude/worktrees/pr-td-toc-do` |
| Cổng thử | **API 4227 · Vite 5427** (không 4000/5173, không cổng PR khác) |
| Model khuyến nghị | **Opus 5.5 · High** |
| Phương án B | **Opus 5 · XHigh** |
| Người rà (session planning giao) | **Fable 5.1** (khác model người code) |
| Migrate | **KHÔNG.** Không đổi `schema.sql`, `migrate.ts`. Không đổi giao diện, không đổi luật nghiệp vụ |
| Phụ thuộc | **Merge SAU Pa (#68), Qa (#69), Rc1 (#70).** Task 1–3 làm được trên `main` hiện tại; **Task 4 trở đi chỉ làm sau khi cả ba đã merge** (rebase) |
| Chạy song song với | Form, Pb-gọn, Qb, Rc2 |
| File KHÔNG được chạm | **Form:** `CasePanel.tsx`, `SkillBoard.tsx`, `QuickReport.tsx`, `yThuc/measures.ts`, `cases.ts` **ngoài** `listCases` · **Pb:** `CaseBoardPage.tsx`, `IssueAnalysis.tsx`, `WeeklyBoard.tsx`, `worklist/metrics.ts`, `worklist/weekly.ts`, `phanTich/*` · **Qb:** `StudentDetailPage.tsx`, `JourneyTimeline.tsx`, `students/profile.ts`, `students/hanhTrinh.ts` · **Rc2:** `MockPlanPanel.tsx`, `fasttrack/skillSchedule.ts`, `fasttrack/planning.ts`, `permissions.ts` phần `scoreEditPath`, `attempts.ts` phần `saveScore`/`skillCells`, `regular.ts` phần `saveRegularScore`/`regularSheet` · **Mọi file `web/`** · `server/src/tests/run.ts` (PR này không cần sửa) |

## QUY TRÌNH NHANH (bắt buộc — thay mọi hướng dẫn "subagent-driven" cũ)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **không** rà từng Task bằng subagent. Session tự code từng
  Task, chạy `npm run check` sau mỗi Task (phải xanh, số phép kiểm **không giảm**), rồi commit. Nếu có dùng subagent:
  **cùng model**, **KHÔNG Haiku**.
- **Không** chụp ảnh từng Task. PR không đổi giao diện: bấm thử theo vai + 375px **một lần** ở Task cuối (ảnh lưu
  `thiet-ke/anh/pr-td/`) chỉ để chứng minh trang vẫn mở đúng.
- **Không** tự rà code cuối PR (planning rà bằng model khác). Cuối PR: push, mở PR, báo planning.
- Commit ghi đúng dòng `Co-Authored-By` của **model thật** đang chạy.
- **Không chạy lệnh nào vào database bản chính (Turso), không deploy.**

**Goal:** Mỗi request đọc của các trang chính ≤ ~100 câu SQL trên bộ demo và **không tăng theo số HV/Case**, để bản chính
trên Turso (mỗi câu một vòng mạng ~20–50 ms, hàm Netlify dừng sau 10 s) không chết khi có 200–300 HV và vài trăm Case.
Kết quả mọi đường trả về **giống hệt** trước PR.

**Architecture:** Một **ngữ cảnh request** bằng `AsyncLocalStorage` (cùng kiểu `platform/hanGio.ts`) giữ (a) bộ đếm câu
SQL và (b) bộ nhớ tạm — **chỉ bật cho GET**, tự xoá khi request chạy một lệnh ghi. Các tra cứu lặp trong quyền
(`permissions.ts`), ngày nghiệp vụ (`demoConfig.ts`) và vài hàm đọc nặng được gọi lặp (`listCases`, `danhGia.ts`,
`allProgrammes`, `scoresOf`) đọc qua bộ nhớ này. `listCases` nạp trước chi nhánh/lớp của mọi HV trong **một** lô rồi vẫn
gọi đúng `can()` như cũ — luật quyền không đổi một dòng, chỉ đổi nguồn dữ liệu. Phép kiểm ĐO chạy tiến trình riêng
(DB riêng), đếm câu SQL qua HTTP thật cho từng đường × vai, có trần và phép nhân dữ liệu.

**Nguồn:** prompt planning 23/09 (số đo người rà) · kiểm kê `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md`
AN-5, AN-8, Z2c-3 (Step 5–6 "đo 5 trang · gộp truy vấn trang > 3 s") · kế hoạch Pa/Qa/Rc1 (đường mới) · kế hoạch Pb dòng
234 (Pb tự lo `tongHop`), Qb dòng 183 (Qb tự đếm `/hanh-trinh`).

**Con trỏ mã** đo trên `main` @ `61ae2dd` (chưa có Pa/Qa/Rc1) — chỗ ghi *(Pa)*, *(Qa)*, *(Rc1)* là dòng trên nhánh đó.

---

## Số đo của planning (23/09) — dùng làm mốc "trước"

Planning dựng tạm **Pa + Qa + Rc1 gộp lại** (cây rời, đã xoá), bộ demo sạch (44 HV · 39 Case), gọi HTTP thật từng đường.
**Cách đếm:** mỗi lần chạy `get`/`run`/`iterate` của câu lệnh = 1 câu. **Không đếm `all`**: trong `libsql`, `all()` gọi lại
`iterate()` (`node_modules/libsql/index.js:400-403`) → đếm cả hai là đếm đôi. Số của người rà (951 cho `/tong-quan/quan-ly`)
đếm đôi như vậy; cùng đường, đếm đúng là **623**.

"Bản thử" = một bản sửa nhanh của planning theo đúng hướng kế hoạch này (Task 1–4, chưa làm `mywork.ts`) để biết đích tới.
"×4" = nhân HV, ghi danh và Case lên 4 lần (176 HV · 156 Case) trong cùng các lớp.

| Đường (GET) | Trước QL / GVCN / GVBM | Trước ×4 | Bản thử | Bản thử ×4 |
|---|---|---|---|---|
| `/tong-quan/quan-ly` *(Pa)* | **623** / 403 / 403 (GV bị 403, 9 câu) | 2010 | 56 | 57 |
| `/tong-quan/chi-nhanh` *(Pa)* | 200 | 560 | 33 | 33 |
| `/branch-pulse` | 544 | 1930 | 31 | 31 |
| `/metrics/case-mo` | 95 / 116 / 116 | 326 / 413 / 413 | 17 | 17 |
| `/tong-quan/hoc-vien-can-ho-tro` *(Pa)* | 196 / 238 / 238 | 658 / 832 / 832 | 31 | 31 |
| `/my-work` | 183 / **711** / **789** | 498 / 954 / 1014 | 69 | **132 — còn tăng** |
| `/hoc-vien-lop` *(Qa)* | 195 / 687 / **806** | 546 / 1281 / 1400 | 53–56 | 53–56 |
| `/classes` | 32 / 426 / 528 | như trước | 24–27 | 24–27 |
| `/classes/:ft/roster` | 75 / 454 / 454 | 171 / 598 / 598 | 41 | 41 |
| `/students/:id` | 168 / 185 / 179 | như trước | 88 | 88 |
| `/cham/can-cham` *(Rc1)* | 70 / 614 / 690 | như trước | 25–27 | 25–27 |
| `/classes/:ft/cham` *(Rc1)* | 28 / 398 / 398 | như trước | 24 | 24 |
| `/cases` | 93 / 114 / 114 | 324 / 411 / 411 | 17 | 17 |
| `/summary` | 107 / 128 / 128 | 338 / 425 / 425 | 29 | 29 |
| `/demo/session` | 14 / 24 / 22 | như trước | 10 / 20 / 18 | — |

Nguồn lặp chính (trước): `SELECT branch_id FROM classes WHERE id = ?` (`permissions.ts:141`), `SELECT value FROM
demo_config` (`demoConfig.ts:20`, qua `demoToday()` trong `hasAssignment` :178), `branchesOfStudent` (:151) — từ `can()`
từng dòng trong `listCases` (`cases.ts:1789`), `skillCells`/`editableSkills`/`mySkills` từng lượt × môn
(`classes.ts:157-158, :199`), và `listCases` bị gọi ~12 lần trong một lượt tính Tổng quan (`metrics.ts:458` *(Pa)* qua
`tongQuan.ts:27-49` *(Pa)*). Nền mỗi request: **9 câu** (phiên 2 + `loadPrincipal` 5 + `scenario_mode` + `demo_date`).

---

## Luật riêng của PR này

- **Kết quả không đổi.** Mọi đường trả JSON giống hệt trước PR (Task 6 so bằng máy). Luật quyền (`can`, `teacherAllows`,
  `grantCovers`, `hasAssignment`) **không sửa logic** — chỉ đổi chỗ các hàm tra cứu lấy dữ liệu.
- **Không đổi chữ ký hàm công khai** (`listCases`, `can`, `scopeFor`, `demoToday`, `getConfig`, `allProgrammes`,
  `scoresOf`, `skipsOf`, `studentsInScope`, `latestAttempts`…). Chỉ **thêm** export mới.
- **Bộ nhớ chỉ sống trong một request GET.** Ngoài request (phép kiểm gọi thẳng hàm, lệnh ops, hàm định kỳ) → không có
  bộ nhớ, mọi hàm đọc DB như cũ. Ngoại lệ có chủ đích: `listCases` tự mở một bộ nhớ **tạm** cho riêng lần gọi của nó
  (để nạp theo lô cả khi gọi ngoài request) và bỏ đi khi xong.
- **Có lệnh ghi thì xoá bộ nhớ** (mọi `run()` trong request). Không nhớ gì qua hai request.
- **Giá trị nhớ là dùng chung trong request** → nơi gọi **không được sửa** mảng/đối tượng nhận về. Khi chạy phép kiểm
  (`PISA_DONG_BANG_NHO=1`), giá trị nhớ bị `Object.freeze` để lộ chỗ sửa nhầm (lỗi ném ra → 500 → phép kiểm đỏ).
- Chạm file của PR song song: **chỉ** đúng các khối ghi ở Bản đồ file. Gặp chỗ chậm nằm trong file cấm → **không sửa**,
  ghi số đo vào "Chuyển cho PR khác".

## Bảng Q — session planning tự quyết (người rà kiểm lại)

| # | Câu hỏi | Quyết định | Lý do |
|---|---|---|---|
| Q1 | Bộ nhớ bật cho request nào | **Chỉ GET**, và xoá sạch mỗi khi request chạy `run()` (lệnh ghi) | Đơn giản và đúng. GET cũng có ghi lẻ (cập nhật phiên `auth.ts:61`, `ensurePeriod`) — xoá khi ghi che luôn các chỗ đó. POST/PUT/DELETE ít và không phải chỗ chậm |
| Q2 | Giữ bộ nhớ ở đâu | `AsyncLocalStorage` mới trong `server/src/platform/nguCanhRequest.ts`, **không** gắn vào `p` | `branchOfClass`, `demoToday`, `getConfig` không nhận `p`; gắn vào `p` buộc đổi chữ ký hàng trăm chỗ gọi |
| Q3 | Nạp trước bảng lớp hay từng lớp | **Bảng lớp: nạp cả bảng một câu** (`id, branch_id, is_fast_track`) lần đầu cần trong request. **HV: nạp theo lô** tại chỗ lặp (`napTruocPhamVi`) | Bảng lớp nhỏ (vài trăm dòng). Ghi danh cả trung tâm lớn dần theo năm — nạp cả bảng mỗi GET là phí băng thông Turso |
| Q4 | Đếm câu SQL thế nào | `get` + `run` + `iterate`; **không** `all` | Xem mục Số đo. Trần của PR này tính theo cách đếm này |
| Q5 | Phép kiểm ĐO chạy ở đâu | **Tiến trình riêng** `server/src/tests/tocDo.run.ts`, DB riêng `data/test-tocdo.sqlite`, nối vào `npm test` sau `run.js` | Cần bộ demo sạch và được nhân dữ liệu mà không làm hỏng dữ liệu các phép sau; không chạm đuôi `run.ts` (mọi PR song song đều sửa chỗ đó) |
| Q6 | Ngưỡng | Mỗi (đường × vai): trần = `max(sau + 10, ⌈sau × 1.3⌉)`, và **trần cứng 100** trên bộ demo. Nhân ×3 dữ liệu → mỗi đường ≤ số trước khi nhân **+ 5** | Chừa chỗ cho PR sau thêm vài câu hợp lý, nhưng một vòng lặp N+1 mới sẽ vượt ngay |
| Q7 | Sửa `metrics.ts` / `profile.ts` / `cases.ts` ngoài `listCases`? | **Không.** Tổng quan được lợi nhờ `listCases` tự nhớ (không cần sửa `metrics.ts:458`); hồ sơ HV được lợi nhờ `scoresOf`/`skipsOf` nhớ ở `attempts.ts` | Tránh chồng Pb (metrics), Qb (profile), Form (cases). `/students/:id` bản thử 88 câu — dưới trần |
| Q8 | Đóng băng giá trị nhớ | Chỉ khi `PISA_DONG_BANG_NHO=1` — `tocDo.run.ts` tự đặt trước khi import `db.ts`; `run.ts` không đặt (không sửa `run.ts`) | Lộ chỗ sửa nhầm dữ liệu dùng chung trong phép kiểm; không làm máy dev/bản chính ném lỗi bất ngờ |
| Q9 | Đường ghi phiên mỗi GET (`UPDATE demo_sessions SET last_seen_at`) | **Không đổi ở PR này**, chuyển Z2c | Là chuyện luật phiên (PR-Z2b2), không phải N+1; 1 câu/request |
| Q10 | "Quirk" `listCases` lọc quyền theo lớp **lúc đánh giá** (`dongHocVien.ts:37-41` *(Qa)*) | **Giữ nguyên** | PR này chỉ làm nhanh; đổi luật là việc khác |
| Q11 | Lớp có nhân lên trong phép nhân dữ liệu không | **Không** (chỉ HV, ghi danh, lộ trình, lượt, điểm, Case) | Số lớp đổi chậm; nhân lớp đòi sao chép phân công, lịch, chương trình — dễ sai. Ghi rõ trong phép kiểm |

---

## Bản đồ file

| File | Tạo/Sửa | Việc |
|---|---|---|
| `server/src/platform/nguCanhRequest.ts` | **Tạo** | Ngữ cảnh request: bộ nhớ + bộ đếm (Task 1). **Không import `db.ts`** |
| `server/src/db.ts` | Sửa khối vá prototype (:12-32) | `get`/`run`/`iterate` đếm câu; `run` xoá bộ nhớ |
| `server/src/app.ts` | +1 middleware sau `demGio` (:31) | Mở ngữ cảnh cho mỗi request; log `[sql]` khi `PISA_DEM_SQL=1` |
| `server/src/demoConfig.ts` | Sửa `getConfig` (:17) | Đọc qua bộ nhớ |
| `server/src/permissions.ts` | Sửa :140-165; **+ export `napTruocPhamVi` ngay sau `classesOfStudent`** | Tra cứu qua bộ nhớ; không đụng :320 trở xuống (vùng Rc2) |
| `server/src/cases/cases.ts` | Chỉ `listCases` (:1669-1897) | Tách phần SQL + lọc quyền thành hàm nhớ; nạp trước theo lô |
| `server/src/worklist/danhGia.ts` | `studentsInScope` (:77), `latestAttempts` (:123) | Nhớ trong request |
| `server/src/normal/regular.ts` | Chỉ `allProgrammes` (:45) | Nhớ trong request |
| `server/src/fasttrack/attempts.ts` | Chỉ `scoresOf` (:42), `skipsOf` (:57) | Nhớ trong request |
| `server/src/worklist/mywork.ts` *(sau Pa)* | Thêm lời gọi nạp trước trước các vòng lặp `can()` | Task 4 |
| `server/src/routes/index.ts` | Chỉ khối `/demo/session` (:114-117) | Một câu `IN` cho mã lớp của phân công |
| `server/src/tests/tocDo.run.ts` | **Tạo** | Mọi phép kiểm PR-TD (tiến trình riêng) |
| `server/src/tests/tocDoDuong.ts` | **Tạo** | Danh sách đường đo theo trang × vai (dùng chung phép kiểm + công cụ chụp) |
| `scripts/chup-api.mjs` | **Tạo** | Chụp JSON mọi đường đo của một cây mã đã build — so trước/sau |
| `package.json` | Sửa `test` | `… && node dist-server/server/src/tests/run.js && node dist-server/server/src/tests/tocDo.run.js` |
| `CODE_MAP.md` | Sửa | Task 6 |

**Chỗ chồng khi rebase** (sửa gọn, dễ gộp): `cases.ts` — Form sửa `recordIntervention`/`backfillCase`/`updateResult`,
thêm `caseTopicsOf`; PR này chỉ `listCases`. `permissions.ts` — Rc2 sửa `scoreEditPath` (:412); PR này chỉ :140-166.
`attempts.ts`/`regular.ts` — Rc2 sửa hàm ghi điểm; PR này chỉ hàm đọc đầu file. `routes/index.ts` — khối `/demo/session`.

---

### Task 0: Chuẩn bị

- [ ] **1. Worktree.** `git fetch origin`; tạo worktree `.claude/worktrees/pr-td-toc-do` nhánh `pr-td-toc-do` **từ
  `origin/main` mới nhất**. `npm ci` nếu thiếu `node_modules`. Ghi vào Nhật ký: `git log origin/main --oneline -8` và
  **PR nào trong #68 (Pa), #69 (Qa), #70 (Rc1) đã merge**.
- [ ] **2.** Chép file kế hoạch này vào nhánh, commit `PR-TD (0): ke hoach`.
- [ ] **3.** Không có biến Turso trong môi trường (`node -e "console.log(['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BAN_CHINH'].filter(k=>process.env[k]).join()||'sạch')"`
  → `sạch`). **Mốc:** `npm test 2>&1 | tail -3` → số **B** vào Nhật ký.

---

### Task 1: Ngữ cảnh request, bộ đếm câu SQL, khung phép kiểm ĐO

**Files:** tạo `server/src/platform/nguCanhRequest.ts`, `server/src/tests/tocDo.run.ts`, `server/src/tests/tocDoDuong.ts`;
sửa `db.ts`, `app.ts`, `package.json`.

1. **`nguCanhRequest.ts`** — một `AsyncLocalStorage<{ nho: Map<string, unknown> | null; dem: { n: number } }>`:
   - `chayTrongRequest(method, fn)`: `run({ nho: method === 'GET' ? new Map() : null, dem: { n: 0 } }, fn)`.
   - `nho<T>(khoa, tinh: () => T): T` — không có kho hoặc `nho === null` → `tinh()` (không nhớ). Có → trả giá trị đã
     nhớ hoặc tính rồi nhớ. `PISA_DONG_BANG_NHO === '1'` → đóng băng trước khi nhớ: mảng `Object.freeze` + từng phần
     tử là đối tượng thường cũng `freeze` (một tầng; `Map` không đóng băng được — ghi rõ ở chú thích).
   - `datNho(khoa, giaTri)`, `coNho()`, `xoaNho()` (xoá `Map`, không bỏ kho).
   - `trongBoNho<T>(fn)` — đã có `nho` → `fn()`; chưa có → `run({ nho: new Map(), dem: khoHienTai?.dem ?? { n: 0 } }, fn)`.
     **Dùng chung `dem`** với kho ngoài, nếu không câu SQL chạy trong kho tạm sẽ lọt khỏi bộ đếm của request.
   - `demCau()` — `kho.dem.n++` (nếu có) và `tongCau++` (biến module); `soCauSql()` trả `tongCau`.
   - Chú thích đầu file: vì sao chỉ GET, vì sao xoá khi ghi, "không import db.ts" (db.ts import file này — giống
     `hanGio.ts:10`).
2. **`db.ts` (khối vá :12-32):** `get`, `run`, `iterate` gọi `demCau()`; `run` gọi thêm `xoaNho()` **trước** khi chạy.
   **Không** bọc thêm `all` (đã đi qua `iterate` — ghi chú thích trích `libsql/index.js`). Giữ nguyên phần vá `motNull`
   và xoá `_metadata`.
3. **`app.ts`:** ngay sau `app.use(demGio)` (:31): middleware `(req, res, next) => chayTrongRequest(req.method, () => { … next(); })`.
   Phải đứng **sau** `express.json`/`cookieParser` (cùng lý do chú thích :48). Trong middleware: nếu
   `process.env.PISA_DEM_SQL === '1'` thì giữ tham chiếu `dem` và `res.on('finish')` in
   `[sql] ${req.method} ${req.originalUrl} ${dem.n} câu`. (Không in trên bản chính trừ khi đặt biến — biến không có trong
   `netlify.toml`.)
4. **`tocDoDuong.ts`** — `export const DUONG_DO: { trang: string; vai: Vai[]; url: string }[]`, url có chỗ thay
   `{lopFT}`, `{lopThuong}`, `{hv}`, `{case}`, `{cn}`. **Lập danh sách thật** bằng cách chạy app (Task 6 bước 2 có lệnh)
   với `PISA_DEM_SQL=1`, mở từng trang theo từng vai, chép **mọi** GET mà trang gọi. Tối thiểu phải có:
   - Chung: `/demo/session`, `/ref/branches` (và `/prefs` nếu trang gọi).
   - **Tổng quan QL:** các `/metrics/:id` của ô số, `/tong-quan/quan-ly`, `/highlights`, `/tong-quan/chi-nhanh`,
     `/tong-quan/chi-nhanh/o?…` (một ô), `/branch-pulse` (bảng Theo giáo viên). **Tổng quan GV:** `/my-work`,
     `/tong-quan/hoc-vien-can-ho-tro`, `/highlights`, `/y-thuc/my-warnings`, `/y-thuc/my-coordination`.
   - **Học viên & Lớp:** `/hoc-vien-lop` (mặc định và `?phamVi=chi-nhanh&branchId={cn}`), `/classes`.
   - **Hồ sơ lớp** (FT và thường): `/classes/{id}/overview`, `/classes/{id}/roster`, `/classes/{id}/phan-tich-lop`,
     `/classes/{id}/y-thuc`, `/cases?classId={id}`.
   - **Hồ sơ HV:** `/students/{hv}`, `/students/{hv}/skill-board?cycleId=…`, `/students/{hv}/violation-warning`,
     `/cases/{case}`.
   - **Cần chấm + lưới:** `/cham/can-cham`, `/classes/{lopFT}/cham`, `/classes/{lopThuong}/cham`, `/cham/lich-test`.
   - **Danh sách Case:** mọi GET của `CaseBoard` (ít nhất `/cases`, đếm hàng đợi nếu có). **Việc cần làm:** mọi GET của
     `/cong-viec`.
   Vai: `QL` (Quản lý MB), `GVCN` (chủ nhiệm MB-FT 101), `GVBM` (bộ môn thuần MB-FT 101 — cách chọn như
   `subjectOnlyTeacherOf`, `run.ts:154`), `GVCN_THUONG` (chủ nhiệm MB-FOU 12), `QT` (Quản trị hệ thống — phạm vi lớn nhất).
   Ghi chú đầu file: **"PR sau thêm đường mới vào đây"**.
5. **`tocDo.run.ts`** — khung như `run.ts:1-20` nhưng `PISA_DB = data/test-tocdo.sqlite`, gỡ biến Turso, đặt
   `PISA_DONG_BANG_NHO=1` **trước** khi import `db.ts`; `runSeed()`; `createApp().listen(0)` + `createSession` như
   `yThuc.tests.ts:1278-1289`; hàm `doSql(vai, url)` = `soCauSql()` trước/sau `await fetch` (gọi **tuần tự**), trả
   `{ n, status }`. Có `check`/`assert` và in `TỐC ĐỘ: n kiểm tra đều đạt` / thoát mã 1 khi có lỗi.
6. **Phép kiểm Task 1 (≥ 6):** (a) ngoài request `nho` không nhớ (gọi hai lần → `tinh` chạy hai lần); (b) trong
   `chayTrongRequest('GET')` nhớ đúng một lần; (c) `'POST'` không nhớ; (d) `run()` trong kho GET xoá bộ nhớ (nhớ → chạy
   một `UPDATE demo_config` vô hại → tính lại); (e) `trongBoNho` ngoài request tạo kho tạm, xong thì `coNho()` lại false;
   lồng trong GET thì dùng kho ngoài; câu SQL trong kho tạm vẫn cộng vào `dem` của request; (f) đếm: một `.all()` = 1
   câu, một `.get()` = 1 câu; (g) mọi đường trong `DUONG_DO` × vai của nó trả **200** hoặc đúng mã chủ đích (403 của GV ở
   `/tong-quan/quan-ly` ghi rõ trong danh sách).
7. **`scripts/chup-api.mjs`** — công cụ chụp **một cây mã bất kỳ đã build** (kể cả `origin/main` chưa có PR này):
   `node scripts/chup-api.mjs --cay <thư mục gốc cây> --ra <file.json>`. Tự đặt `PISA_DB` vào `os.tmpdir()`, gỡ biến
   Turso, **tự vá** prototype câu lệnh `libsql` của cây đó để đếm `get`/`run`/`iterate` (không dựa vào bộ đếm của PR này),
   `runSeed()` + `createApp()` + `createSession()` **của cây đó**, gọi mọi (đường × vai) trong `DUONG_DO` (import từ
   `dist-server` của **nhánh này**), ghi `{ vai, url, status, soCau, body }`. Có cờ `--so <file cũ>`: so `body` từng mục
   bằng `assert.deepStrictEqual`, in mục lệch và bảng `soCau` cũ → mới. File JSON **không commit** (để trong tmpdir).
8. **Đo "trước":** chạy `chup-api` trên cây hiện tại (chưa tối ưu) → giữ file làm mốc; dán bảng `url × vai → soCau` vào
   Nhật ký. Nếu Pa/Qa/Rc1 chưa merge, bảng chỉ có đường đang có — chụp lại mốc ở Task 4 sau rebase.

**Xong khi:** check xanh (B không giảm; `tocDo.run.js` in số riêng). Commit `PR-TD (1): ngu canh request, dem cau SQL`.

---

### Task 2: Tra cứu quyền và ngày nghiệp vụ qua bộ nhớ

**Files:** `permissions.ts` (:140-166), `demoConfig.ts` (:17-28), `tocDo.run.ts`.

1. `getConfig(key)` → `nho('cfg:' + key, () => <thân cũ>)`. `demoToday()`/`scenarioMode()` tự hưởng. `setConfig` không
   đổi (đi qua `run()` → xoá bộ nhớ).
2. `permissions.ts`:
   - `bangLop()` (không export) = `nho('bang-lop', …)`: `SELECT id, branch_id, is_fast_track FROM classes` → `Map`.
   - `branchOfClass(id)`: `coNho()` → `bangLop().get(id)?.branch_id ?? null`; không có kho → câu một dòng như cũ.
     `classIsFastTrack(id)` tương tự (`!!is_fast_track`; lớp không có → `false` như cũ).
   - `branchesOfStudent(id)` → `nho('hv-cn:' + id, <thân cũ>)`; `classesOfStudent(id)` → `nho('hv-lop:' + id, <thân cũ>)`.
   - **Thêm** `export function napTruocPhamVi(studentIds: readonly (number | null | undefined)[]): void` đặt **ngay sau
     `classesOfStudent`**. Không có kho → `return` (không tốn câu nào). Bỏ id rỗng, trùng, và id đã có trong bộ nhớ.
     Theo lô 400 id. **Phải cho ra ĐÚNG hai hàm cũ** (luật dễ sai):
     ```
     -- lớp của HV: MỌI ghi danh, mọi trạng thái (y như classesOfStudent :163 — không lọc status)
     -- chi nhánh của HV: chi nhánh các lớp đó (JOIN classes, bỏ NULL) ∪ students.branch_id (khác NULL) (y như :154-156)
     SELECT e.student_id, e.class_id, c.branch_id FROM enrollments e LEFT JOIN classes c ON c.id = e.class_id WHERE e.student_id IN (…)
     SELECT id, branch_id FROM students WHERE id IN (…) AND branch_id IS NOT NULL
     ```
     Mỗi id trong lô **đều** được `datNho` (kể cả em không có dòng nào → `[]`), không trùng phần tử. Thứ tự phần tử không
     quan trọng (nơi dùng là `every`/`includes`/`Set`) — ghi chú thích.
   - `hasAssignment`, `grantCovers`, `teacherAllows`, `can`, `scopeFor`: **không sửa**.
3. **Phép kiểm (≥ 5):** (a) **mọi tài khoản** × **mọi HV** × quyền `ATTEMPT_VIEW`, `STUDENT_VIEW`, `SOS_REPORT`,
   `STUDENT_EDIT`: `can(p, q, { studentId })` trong một kho GET sau `napTruocPhamVi(tấtCảId)` **bằng** ngoài kho (đường
   cũ); cũng vậy với `{ classId }` cho mọi lớp và `SCHEDULE_MOVE` (dùng `classIsFastTrack`); (b) HV có `students.branch_id`
   nhưng không ghi danh → vẫn đúng; (c) HV có ghi danh cũ ở chi nhánh khác → vẫn tính cả hai chi nhánh như cũ;
   (d) **qua HTTP, hai request liền nhau:** `PUT /demo/config` đổi `demoDate` rồi `GET /demo/config` thấy ngày mới (đặt
   lại ngày sau phép); (e) **qua HTTP:** Quản lý CP `GET /cases` không thấy Case của một HV MB → `POST
   /students/:id/transfer` sang một lớp CP (tài khoản có quyền cả hai chi nhánh, ví dụ QT) → Quản lý CP `GET /cases`
   **thấy** ngay (không dính bộ nhớ cũ). Phép (e) chạy **sau cùng** trong file hoặc trên HV tạo riêng cho phép kiểm.

**Xong khi:** check xanh; đo lại bảng (Nhật ký) — `/classes`, `/cham/*`, `/classes/:id/roster` của GV phải giảm mạnh.
Commit `PR-TD (2): tra cuu quyen qua bo nho request`.

---

### Task 3: `listCases` — nhớ trong request + kiểm quyền theo lô

**Files:** `cases.ts` (chỉ `listCases` :1669-1897), `tocDo.run.ts`.

1. Tách thân hiện tại thành hai phần, **giữ nguyên `export function listCases(p, f)`**:
   - `caseTrongPhamVi(p, fSql)` (không export): phần SQL (:1675-1786) + lọc quyền + dựng `MappedCase` (:1788-1863). Nhớ
     theo khoá `'ds-case:' + p.userId + ':' + JSON.stringify(fSql)` với `fSql` **chỉ gồm các bộ lọc đi vào SQL**
     (`studentId, classId, branchId, status, cycleId, origin, ownerUserId, noOwner`), bỏ giá trị `null/undefined/false`,
     sắp khoá theo tên. `queue`, `classKind`, `skill` **không** vào khoá (lọc trong bộ nhớ như cũ, :1870-1896).
   - `listCases` = `trongBoNho(() => { const all = caseTrongPhamVi(p, fSql); …queued/classKind/skill/facets như cũ… })`.
     Hệ quả: `caseQueueCounts` (:1948, gọi `listCases` 5 lần) và Tổng quan (`metricSet` gọi ~12 lần) chỉ chạy SQL một lần.
2. Trước `.filter((r) => can(…))` (:1789): `napTruocPhamVi(rows.map((r) => r.eff_student_id))`. Bảng lớp đã có từ Task 2.
   **`can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.eff_class_id, studentId: r.eff_student_id })` giữ nguyên từng chữ.**
3. `scopeFor(...).none` → `{ rows: [], scopeEmpty: true }` giữ nguyên (trả **mảng mới** mỗi lần, không nhớ đối tượng rỗng).
4. Soát **mọi** nơi gọi (`grep -rn "listCases(" server/src`): không nơi nào được sửa mảng `rows` hay đối tượng dòng
   (`sort` tại chỗ, `push`, gán thuộc tính). Gặp chỗ sửa → đổi thành bản sao **tại nơi gọi** (không đổi `listCases`).
   Ghi danh sách đã soát vào Nhật ký.
5. **Phép kiểm "giống hệt" (≥ 4):** hàm tham chiếu trong phép kiểm = chạy câu SQL lấy `sc.id, eff_class_id,
   eff_student_id` (cùng các JOIN của :1699-1728, chỉ lấy ba cột) rồi lọc bằng `can()` **ngoài mọi kho** (đường cũ:
   từng dòng hỏi DB). Với **mọi tài khoản đang hoạt động** của demo × bộ lọc `{}`, `{branchId}` từng chi nhánh,
   `{classId: lopFT}`, `{classId: lopThuong}`, `{studentId: hv}`, `{status:'done'}`: tập id của `listCases` (gọi ngoài
   request) **và** của `GET /cases?…` (qua HTTP) **bằng** tập tham chiếu, cùng số dòng; `facets` của hai đường bằng nhau.
   Thêm: trong một kho GET, gọi `listCases(p, {})` hai lần → lần hai **0 câu SQL**.

**Xong khi:** check xanh; bảng đo: `/cases`, `/metrics/case-mo`, `/summary`, `/branch-pulse` ≤ ~35. Commit
`PR-TD (3): listCases kiem quyen theo lo, nho trong request`.

---

### Task 4: Rebase lên Pa + Qa + Rc1, dọn chỗ lặp còn lại

**Bắt đầu khi `origin/main` đã có cả #68, #69, #70.** `git fetch origin && git rebase origin/main`; xung đột chỉ nên ở
`routes/index.ts`/`package.json` (giữ cả hai). `npm run check`. Cập nhật `DUONG_DO` với đường mới của Pa/Qa/Rc1 (đối
chiếu bước 4 Task 1). **Chụp lại mốc "trước"** bằng `scripts/chup-api.mjs` trên một cây `origin/main` tạm (worktree
`--detach` trong tmpdir, `npm run build:server`; `node_modules` nối bằng junction — **gỡ junction bằng `cmd /c rmdir`
trước khi xoá worktree**, không để lệnh xoá đi xuyên junction vào `node_modules` thật). So với bảng Số đo đầu kế hoạch
(lệch > 15% thì ghi lý do) → Nhật ký.

1. **Tổng quan** — xác nhận `/tong-quan/quan-ly` chạy SQL của `listCases` **một** lần (không sửa `metrics.ts`,
   `tongQuan.ts`). `danhGia.ts`: `studentsInScope(p, branchId)` → `nho('hv-pv:' + p.userId + ':' + branchId, …)`;
   `latestAttempts(ids, pick, today)` → `nho('luot-moi:' + pick + ':' + today + ':' + ids.join(','), …)`. Soát nơi gọi
   không sửa `Map`/mảng nhận về (`hvSosHienTai`, `hvDuoiKyVongMon`, `doPhuDanhGia`, `tongQuan.ts` *(Pa)*,
   `bangChiNhanh.ts` *(Pa)*).
2. **`allProgrammes()`** (`regular.ts:45`) → `nho('chuong-trinh', …)`. Soát nơi gọi chỉ đọc (`prog.skills` không bị `push`).
3. **`scoresOf` / `skipsOf`** (`attempts.ts:42, :57`) → `nho('diem:' + id)`, `nho('bo-mon:' + id)`. Soát nơi gọi chỉ đọc.
4. **`/my-work`** (`mywork.ts` *(Pa)*): mỗi khối đọc dòng rồi lặp `can(p, …, { classId, studentId })` — trên `main` ở
   :422, :484, :545-552, :660-663, :714-725, :797-800, :873 (tìm lại sau Pa bằng `grep -n "can(p, PERMISSIONS" mywork.ts`)
   — thêm **một** dòng `napTruocPhamVi(rows.map((r) => r.eff_student_id ?? r.student_id))` ngay trước vòng lặp. Không
   đổi điều kiện nào. Mục tiêu: `/my-work` không tăng khi nhân dữ liệu (bản thử 69 → 132 ở ×4).
5. **`/demo/session`** (`routes/index.ts:114-117`): mã lớp của phân công lấy bằng **một** câu `SELECT id, code FROM
   classes WHERE id IN (…)` (rỗng → không hỏi). Kết quả giữ đúng thứ tự `p.assignments`.
6. Chạy `tocDo.run.ts` (bảng đo) + phép nhân tạm (Task 5 bước 2 viết trước cũng được). Còn đường nào **> 100** hoặc
   **tăng khi nhân** → tìm câu lặp (`PISA_DEM_SQL=1` + tạm in câu SQL theo nhóm như bộ đo của planning), sửa bằng
   `napTruocPhamVi`/`nho` ở chỗ nhỏ nhất. Chỗ đó thuộc file cấm → **không sửa**, ghi "Chuyển cho PR khác" kèm số.
   Đường chỉ cần tra cứu phân công GV–lớp–kỹ năng lặp (đọc `teacher_assignments` theo từng lớp) → nhớ theo lớp trong
   `nho`; **chỉ làm nếu số đo cho thấy**.

**Phép kiểm (≥ 3):** hai lần `studentsInScope`/`latestAttempts`/`allProgrammes`/`scoresOf` trong một kho GET → lần hai
0 câu; một `run()` giữa hai lần → lần hai đọc lại DB và thấy giá trị mới (ví dụ `UPDATE assessment_scores` của một ô rồi
`scoresOf` thấy điểm mới). Commit `PR-TD (4): nho trong request cho Tong quan, ho so, viec cua toi`.

---

### Task 5: Phép kiểm ĐO — trần và nhân dữ liệu

**Files:** `tocDo.run.ts`, `tocDoDuong.ts`.

1. **Trần.** `TRAN: Record<string, number>` khoá `vai + ' ' + url` (url đã thay id), giá trị theo Q6 từ số đo sau
   Task 4. Phép kiểm: mỗi (đường × vai) `n ≤ TRAN` **và** `n ≤ 100`. Chú thích đầu bảng: cách đếm (Q4), cách tính trần,
   "PR làm tăng số phải nâng trần **kèm lý do** trong Nhật ký của PR đó". Một phép kiểm = một trang (gom các đường của
   trang), thông báo lỗi in đủ `vai url n > trần`.
2. **Nhân dữ liệu ×3** (`nhanDuLieu(3)` trong phép kiểm, chạy **sau** phép trần): với mỗi HV đang có, sao chép
   `students` (đổi `student_code` + hậu tố, `phone`/`email` → NULL nếu có ràng buộc duy nhất), `enrollments`,
   `learning_cycles` (`baseline_attempt_id` ánh xạ lại hoặc NULL), `assessment_attempts`, `attempt_skills`,
   `assessment_scores`, `sos_cases` (`dedup_key` NULL hoặc thêm hậu tố, `previous_case_id` ánh xạ hoặc NULL),
   `case_issues`, `case_interventions`. Viết một hàm chép dòng chung đọc cột bằng `PRAGMA table_info`, nhận bảng ánh xạ
   khoá ngoại. **Không** nhân lớp (Q11). In số HV/Case trước–sau. Đo lại **mọi** đường × vai: `n_sau ≤ n_trước + 5`.
   Thông báo lỗi in `vai url trước → sau`.
3. **Kiểm lại "giống hệt" sau nhân:** chạy lại phép so tập id của Task 3 cho 3 vai chính trên dữ liệu đã nhân (tham chiếu
   từng dòng vẫn đúng với dữ liệu lớn).

**Xong khi:** check xanh; bảng **trước / sau / sau ×3** cho mọi (đường × vai) dán vào Nhật ký (đúng yêu cầu "bảng
trước/sau"). Commit `PR-TD (5): phep kiem do — tran va nhan du lieu`.

---

### Task 6: Nghiệm thu — so JSON trước/sau, bấm thử một lần, PR

- [ ] **1. So JSON bằng máy.** Chụp lại mốc trên cây `origin/main` **mới nhất** (cách ở đầu Task 4), rồi
  `node scripts/chup-api.mjs --cay . --ra <mới.json> --so <mốc.json>` → mọi mục `body` **phải bằng hết**, mọi `status`
  bằng nhau. Mục khác nhau → dừng, tìm nguyên nhân (không "chấp nhận lệch"). Ghi số mục đã so + bảng `soCau` cũ → mới vào
  Nhật ký.
- [ ] **2. Không migrate, không chạm file cấm:** `git diff origin/main...HEAD --stat -- server/src/schema.sql
  server/src/migrate.ts web` → rỗng; `--stat` toàn nhánh chỉ có file trong Bản đồ file.
- [ ] **3. Chạy thử** (DB riêng, cổng 4227/5427, theo bộ nhớ "Máy chủ dev trong worktree"; **không** `preview_start`):
  `KIEM="$(node -e "console.log(require('os').tmpdir())")/pr-td-kiem.sqlite"`; `PISA_DB="$KIEM" npm run seed`;
  `vite.kiem.config.ts` tạm (port 5427, proxy `/api` → `http://127.0.0.1:4227`, **không commit**);
  `npm run build:server && PISA_DEM_SQL=1 PISA_DB="$KIEM" PORT=4227 npm run dev:api` + `npx vite --config vite.kiem.config.ts`.
  Playwright kênh Chrome. Tài khoản: `DEMO.md`.
- [ ] **4. Bấm thử một lượt** (Quản lý MB, GVCN MB-FT 101, GVBM, 1440px; Quản lý thêm 375px): Tổng quan · Học viên &
  Lớp · hồ sơ lớp FT · hồ sơ HV · Cần chấm → lưới · Danh sách Case · Việc cần làm. Mỗi trang mở không lỗi, số trên ô khớp
  danh sách khi bấm (G-10) như trước. Chép dòng `[sql]` của log API vào Nhật ký (tổng câu theo trang). Ảnh: mỗi vai một
  ảnh Tổng quan + Quản lý 375px → `thiet-ke/anh/pr-td/`. Xong: dừng tiến trình, xoá `vite.kiem.config.ts`.
- [ ] **5. `CODE_MAP.md`:** mục "Tốc độ": `nguCanhRequest.ts` (bộ nhớ chỉ GET, xoá khi ghi, không import db), cách đếm,
  `PISA_DEM_SQL=1`, `tocDo.run.ts` + `tocDoDuong.ts` ("thêm đường mới vào đây"), `scripts/chup-api.mjs`, luật "không sửa
  giá trị nhận từ `listCases`/hàm nhớ".
- [ ] **6. Rebase + PR.** `git fetch origin && git rebase origin/main` (PR song song đã merge → thêm đường của họ vào
  `DUONG_DO` nếu thiếu: Qb `/students/:id/hanh-trinh`, Pb `/phan-tich/*`, Rc2 `/ke-hoach-test/*`; vượt trần → ghi
  "Chuyển cho", **không** sửa file của họ), `npm run check`. `git push -u origin pr-td-toc-do`; `gh pr create` tiêu đề
  `PR-TD · Tốc độ trên Turso`, thân: tóm tắt theo Task, bảng Q1–Q11, **bảng trước/sau/×3**, kết quả so JSON, số phép kiểm
  B → B (+ số của `tocDo.run`), **"Không có migrate, không đổi giao diện"**, "Chuyển cho PR khác", dòng cuối
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. **Không tự merge.** Báo planning (tiếng Việt đơn
  giản): mở Tổng quan của Quản lý trước đây cần hơn 600 lần hỏi database, nay khoảng 60; thêm gấp ba học viên và Case thì
  số lần hỏi gần như không đổi; mọi con số trên màn giữ nguyên, máy đã so từng trang trước/sau.

---

## Chuyển cho PR khác

- **PR-Z2c:** đo thời gian thật trên Turso thử cho các trang trong `DUONG_DO` (bật `PISA_DEM_SQL=1` trên bản nháp nếu
  cần); `UPDATE demo_sessions SET last_seen_at` mỗi GET là một lệnh **ghi** lên Turso (Q9) — cân nhắc chỉ gia hạn khi
  mốc cũ hơn 1 giờ; bốn câu đọc cả bảng trong `listCases` (`case_milestones`, `case_interventions`, `case_followups`,
  `case_issues`, `cases.ts:1739-1786`) không tăng **số câu** nhưng tăng **dung lượng** theo tổng số Case toàn trung tâm;
  `loadPrincipal` 5 câu/request (`permissions.ts:51-135`) gộp được còn 2–3.
- **PR-Qb:** `/students/:id` còn N+1 theo lượt (bản thử 88 câu) và `/hanh-trinh` — thêm vào `DUONG_DO`, giữ dưới trần.
- **PR-Pb, PR-Rc2, PR-Form:** đường mới (`/phan-tich/*`, `/ke-hoach-test/*`, `/ref/nguoi`) phải vào `DUONG_DO` và qua
  trần + phép nhân. Không sửa giá trị nhận từ `listCases`/hàm nhớ.
- **Planning:** kiểm kê AN-5 (phần đo), Z2c-3 Step 5–6 — ghi "đã làm phần gộp truy vấn ở PR-TD"; nhắc người rà đếm
  câu theo Q4.

## Mâu thuẫn nguồn ↔ mã (đã xử lý)

| # | Mâu thuẫn | Xử lý |
|---|---|---|
| 1 | Số của người rà (951, 1.755…) ↔ đếm lại ra 623 | `libsql` `all()` gọi `iterate()` → bộ đếm bọc cả hai đếm đôi. Q4: đếm `get`/`run`/`iterate` |
| 2 | Prompt chỉ `tongQuan.ts:22-31`, `metrics.ts ~459` ↔ `main` @ `61ae2dd` chưa có Pa (#68 chưa merge lúc soạn) | Con trỏ ghi *(Pa)*; Task 4 chỉ làm sau rebase |
| 3 | "gắn vào đối tượng p" là một phương án ↔ tra cứu nóng (`branchOfClass`, `demoToday`) không nhận `p` | Q2: `AsyncLocalStorage` |
| 4 | "Tổng quan dùng lại danh sách Case đang mở" ↔ sửa `metrics.ts:458` chồng vùng Pb | Q7: `listCases` tự nhớ theo bộ lọc SQL → không cần sửa `metrics.ts` |
| 5 | Kiểm kê AN-8 để "các câu hỏi khác mỗi thẻ" cho Z2c Step 6 | PR-TD làm phần gộp truy vấn các trang chính; phần thẻ Case (`skillSupportBoard`, file của Form) đo trong `DUONG_DO`, vượt trần thì chuyển Form/Z2c |

## Nhật ký thực thi

| Ngày | Task | Ghi chú |
|---|---|---|
| 2026-09-23 | 0 | Worktree `.claude/worktrees/pr-td-toc-do`, nhánh `pr-td-toc-do` từ `origin/main` (HEAD `1b2856c`). `git log origin/main --oneline -8`: `1b2856c` Merge PR #71, `421f238` Đặc tả §7 (PR-TD), `d681bfb` Merge main, `729a9e2` ok, `49c8214` Merge PR #68 (Pa), `b94a4b1`/`d332570`/`e8f8767` PR-Pa. **#68 (Pa) đã merge.** `gh pr view 69/70`: cả hai **OPEN, chưa merge** (Qa #69, Rc1 #70) → dừng trước Task 4, báo planning, làm Task 1–3 trên `origin/main` hiện tại. File kế hoạch này **đã có sẵn** trong `origin/main` (commit `729a9e2`, nội dung giống hệt bản planning đưa, chỉ khác CRLF/LF) → không cần chép/commit riêng. Biến Turso trong môi trường: `sạch`. Mốc B (`npm test`): **801 kiểm tra đều đạt**. **Lệch model:** kế hoạch ghi Opus 5.5 High (dự phòng Opus 5 XHigh); phiên code thực tế chạy **Sonnet 5** — đã hỏi chủ sản phẩm, được xác nhận tiếp tục bằng Sonnet 5 (2026-09-23). `Co-Authored-By` từ Task 0 trở đi ghi đúng Sonnet 5. |
