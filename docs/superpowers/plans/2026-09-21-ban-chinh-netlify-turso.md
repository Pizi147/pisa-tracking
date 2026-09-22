# Bản chính trên Netlify + Turso — Implementation Plan (PR-Z2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task,
> in order. Steps use checkbox (`- [ ]`) syntax — tick each one in THIS file as you finish it. Tasks marked 🛑 are
> **gates**: stop, report to the owner, and wait for an explicit answer before continuing.

> **CHIA BA PR (chốt 21/09/2026 chiều):** plan này thực thi thành **ba PR nối tiếp, ba session riêng**, merge theo
> thứ tự. Mỗi session **chỉ làm phần của mình** — xem mục "Ba phần" ngay dưới Global Constraints.
>
> | PR | Task | Nội dung | Model khuyến nghị |
> |---|---|---|---|
> | **PR-Z2a** | 0 → 6b | Hạ tầng: libsql, Turso, kho tệp, Netlify Function, tắt demo, **deploy nháp thật** | 🆕 22/09 **Fable 5.1 · High** (B: Sonnet 5 · High) — nâng từ Sonnet vì thử thật cho thấy lỗi chỉ lộ sau khi gói; rà soát ở session planning (Opus) |
> | **PR-Z2b** | 6c → 9 (có 6c, 6d, 6e mới 22/09) | An toàn dữ liệu bản chính: khởi tạo, chi nhánh, sao lưu, tài liệu | Opus 5 · XHigh (B: Fable 5.1 · High) |
> | **PR-Z2c** | 10 → 11 | Deploy bản chính + đo tốc độ + rà soát độc lập | Opus 5 · XHigh (B: Fable 5.1 · High); **người rà ≠ người code** |

> **SỬA 22/09/2026 SAU THỬ THẬT (session planning).** Một agent đã chạy thử Task 1–2 và **gói Function như Netlify
> gói** trên mã `main` sau PR-T + PR-K (581 phép kiểm). Kết quả: plan cũ sẽ ra một máy chủ **chết ngay khi Netlify nạp
> nó** (`db.ts` dùng `import.meta.url` / `__dirname`), và Task 6 sót một đường **đăng nhập không cần mật khẩu**. Mọi
> chỗ sửa được ghi **ngay tại task**, đánh dấu **🆕 22/09**. Tóm tắt:
>
> | Task | Plan cũ | Thực tế đã thử | Đã sửa trong plan |
> |---|---|---|---|
> | 1 | Ba sửa đổi là đủ | `libsql` gắn thêm khoá `_metadata` vào **mọi** dòng `.get()` → 1 phép kiểm đỏ + lọt ra mọi API | Step 3b: vá `Statement.prototype.get` |
> | 1 | Chỉ `yThuc.tests.ts` import better-sqlite3 | Còn `sosV3.tests.ts:141`, `scripts/check-node.mjs` | Step 2 liệt kê đủ |
> | 2 | `new Database(url, { authToken })` | `tsc` báo TS2353 (kiểu thiếu `authToken`, chạy thật thì có) | Ép kiểu `as Database.Options` |
> | 2 | — | `uploadsDir()` = thư mục cạnh `DB_PATH` → thành `libsql:/uploads` khi dùng Turso | Step 5b |
> | 4 | `purgeAttachmentsOf` 3 tham số | Có tham số thứ 4 `deferredFiles` (đường dẫn tuyệt đối); `violations.ts`, `migrate.ts` tự `fs.rmSync` | Step 5 viết lại |
> | 5 | `connectLambda(event)` luôn gọi | Ném lỗi khi `event.blobs` không có | Chỉ gọi khi có |
> | 5 | `binary` không có âm thanh/video | Tải xuống mp4 **hỏng** (13 byte → 19 byte) | Thêm `audio/*`, `video/*` |
> | 5 | `NODE_VERSION = "20"` | `@netlify/blobs` 11.x cần Node ≥ 22.12; Node 20 hết hỗ trợ 04/2026 | `"22"` |
> | 5 | Gói chạy được | **Netlify gói hàm kiểu cũ thành CJS → `import.meta.url` rỗng → sập lúc nạp**; nếu ESM thì trùng tên `__dirname` | **Step 1b mới** (đã thử: sau sửa cả hai kiểu gói đều chạy, tải lên/tải xuống PDF khớp từng byte) |
> | 6 | Cho qua đúng một route `/demo` | Màn đăng nhập cần `GET` + `DELETE /demo/session`; **`POST /demo/session` đăng nhập bằng id bất kỳ không mật khẩu**; `/auth/info` trả mật khẩu mặc định | Step 3 viết lại + phép kiểm |
> | 3, 6b | Hỏi chủ sản phẩm tạo DB thử, làm mục 3-4-5 | **Chủ sản phẩm đã làm xong 22/09** (DB thử ở Ohio; site đã tạo, đã nối, đã đặt 3 biến) | Lấy URL/token bằng `netlify env:get`, không hỏi lại |

**Goal:** Đưa PISA Progress lên mạng làm **bản chính**: giao diện + máy chủ trên Netlify, dữ liệu trên Turso, tệp
tải lên trên Netlify Blobs — database bắt đầu **rỗng**, chỉ có tài khoản quản trị và chi nhánh thật.

**Architecture:** Giữ nguyên toàn bộ mã nghiệp vụ và kiểu gọi database **đồng bộ**: thay thư viện `better-sqlite3`
bằng `libsql` (bản tương thích better-sqlite3, nối được Turso qua mạng). Ứng dụng Express có sẵn (`server/src/app.ts`)
được bọc thành **một** Netlify Function. Tệp tải lên đi qua một "kho tệp" có hai cài đặt: ổ đĩa (máy dev) và Netlify
Blobs (bản chính). Chế độ bản chính bật bằng biến môi trường `BAN_CHINH=1` (máy chủ) và `VITE_BAN_CHINH=1` (giao diện).

**Tech Stack:** TypeScript · Express 4 · React 18 + Vite 5 · `libsql@0.5.29` (thay `better-sqlite3`) · Turso ·
Netlify Functions (Lambda-compatible, qua `serverless-http`) · `@netlify/blobs` · harness kiểm thử tự viết
`server/src/tests/run.ts` (`check` / `assert` / `assertThrows`, **không phải** Jest).

**Spec:** `plan.md` mục 24 (quyết định, rủi ro đã kiểm) · `TRIEN_KHAI.md` (hướng dẫn chủ sản phẩm sẽ làm theo —
tên lệnh và biến môi trường trong file này là **hợp đồng**, phải khớp từng chữ).

**Đã thử trước khi viết plan (21/09/2026, session thiết kế):** thay `better-sqlite3` → `libsql` trên một bản sao
repo, chạy **toàn bộ** 512 phép kiểm với file cục bộ: **511/512 đạt** sau đúng ba sửa đổi nhỏ (Task 1). Phép thứ 512
chỉ vỡ ở bước **dọn thư mục tạm trên Windows** (file còn bị giữ), không phải lỗi logic. **Chưa thử** được đường
mạng tới Turso — đó là Task 3 (gate).

---

## Global Constraints

- **Không đổi bất kỳ luật nghiệp vụ nào.** Plan này chỉ đổi *nơi chạy* và *nơi cất dữ liệu*. Thấy một luật có vẻ
  sai → ghi vào `plan.md` mục 12, **không sửa**.
- **Không đổi kiểu gọi database sang async.** Không thêm `await` vào lời gọi `prepare/get/all/run`. Nếu Task 3 cho
  thấy đường đồng bộ không chạy được qua mạng → 🛑 dừng, **không** tự chuyển sang `@libsql/client`.
- **Máy dev không đổi thói quen:** `npm run dev`, `npm run seed`, `npm test`, `npm run check`, `npm run migrate` chạy
  như cũ, dùng file `data/pisa-demo.sqlite`.
- **Số phép kiểm chỉ tăng.** Ghi số trước và sau mỗi Task vào mục "Nhật ký" cuối file này.
- **Không bao giờ ghi token/mật khẩu vào file trong repo** (kể cả `.env` được commit, kể cả chú thích). Token chỉ
  nằm ở biến môi trường của máy chủ sản phẩm và của Netlify.
- **Không bao giờ chạy lệnh xoá/ghi đè trên database bản chính.** `init-ban-chinh` từ chối nếu đã có dữ liệu.
  `npm run seed` **không bao giờ** được trỏ tới Turso bản chính (Task 2 chặn bằng mã).
- **Phiên bản gói ghi chính xác** như các gói khác trong `package.json` (không `^`, không `~`).
- **Tên lệnh và biến môi trường (hợp đồng với `TRIEN_KHAI.md`):**
  `npm run init-ban-chinh` · `npm run sao-luu` · `npm run them-chi-nhanh` ·
  `TURSO_DATABASE_URL` · `TURSO_AUTH_TOKEN` · `ADMIN_EMAIL` · `ADMIN_PASSWORD` · `CHI_NHANH` · `BACKUP_DIR` ·
  `BAN_CHINH` · `VITE_BAN_CHINH` · `NETLIFY_SITE_ID` · `NETLIFY_AUTH_TOKEN`.
  Đổi một tên → sửa `TRIEN_KHAI.md` trong **cùng commit**.
- **Deploy chỉ bằng Netlify CLI từ thư mục trên máy** (`netlify deploy --build`), **không** nối site với GitHub
  (chủ sản phẩm chốt 21/09: không muốn tự deploy khi merge). Kéo-thả thư mục lên Netlify **không** dùng được — cách đó
  không mang theo Netlify Functions. Máy build là **Windows**, Netlify chạy **Linux** → gói nhị phân `libsql` cho Linux
  phải được đóng gói **có chủ đích** (Task 6b).
- **Giới hạn tệp tải lên bản chính: 4 MB** (Netlify Functions nhận tối đa ~6 MB mỗi lần gọi, tệp đi dưới dạng base64).
- Chữ tiếng Việt trên giao diện theo `thiet-ke/TU_DIEN_VA_CHU.md`.

## Ba phần — ba PR

| Phần | Làm | Điều kiện bắt đầu | Kết thúc bằng |
|---|---|---|---|
| **A · PR-Z2a** | Task 0 → Task 6b | `main` đã có PR-T và PR-K | Deploy **nháp** chạy thật trên Netlify với database Turso **thử** (Task 6b) → mở PR, không merge |
| **B · PR-Z2b** | Task 6c → 6d → 6e → 7 → 9 | PR-Z2a **đã merge** | Mở PR, không merge |
| **C · PR-Z2c** | Task 10 → Task 11 | PR-Z2b **đã merge** | Bản chính chạy trên địa chỉ thật + rà soát độc lập → mở PR (nếu có mã đổi), không merge |

- Mỗi phần: **một session mới**, một nhánh mới từ `main` mới nhất (`pr-z2a-ha-tang`, `pr-z2b-an-toan-du-lieu`,
  `pr-z2c-deploy`), bắt đầu bằng Task 0 Step 1–2 (worktree + `npm run check`, ghi `N0` của phần đó).
- Session của phần sau **đọc Nhật ký** cuối file này trước khi làm — phần trước ghi lại mọi điều bất ngờ ở đó.
- Kết thúc phần A và B: gọi `superpowers:verification-before-completion` rồi `superpowers:finishing-a-development-branch`
  (PR không draft, **không tự merge**), báo chủ sản phẩm bằng tiếng Việt cơ bản: link PR, số phép kiểm, việc còn lại.
- **Không** làm task của phần khác dù thấy "tiện".

## Hướng dẫn riêng cho model thực thi (Sonnet / Fable)

1. **Làm đúng thứ tự Task 0 → 11.** Không nhảy task, không gộp task. Mỗi task kết thúc bằng một commit.
2. **Đọc cả task trước khi gõ.** Mỗi task có mục *Interfaces*: tên hàm và kiểu mà task sau dựa vào. Đặt **đúng tên đó**.
3. **Không "tiện tay" sửa thứ ngoài task** — không đổi tên, không dọn mã, không tối ưu truy vấn, không đổi định dạng.
   Diff của mỗi task chỉ được chạm các file liệt kê ở mục *Files* của task đó. Cần chạm file khác → ghi lý do vào
   Nhật ký trước khi chạm.
4. **Gặp tình huống plan không nói tới:** dừng, ghi vào Nhật ký (có gì bất ngờ, đã thử gì), rồi hỏi chủ sản phẩm.
   Không đoán.
5. **Lệnh kiểm sau mỗi task:** `npm run check`. Phải xanh, số phép kiểm ≥ số trước đó. Đỏ → dùng
   `superpowers:systematic-debugging`, tìm nguyên nhân gốc, **không** sửa phép kiểm cũ cho xanh.
6. **Trên Windows (máy chủ sản phẩm):** chạy lệnh bằng PowerShell; ví dụ biến môi trường một dòng:
   `$env:TEN="giatri"; npm run ...`.
7. **Các gate 🛑 (Task 3, Task 10) cần thông tin chỉ chủ sản phẩm có** (token Turso, quyền Netlify). Hỏi đúng thứ
   cần, nói rõ để làm gì. Không tự tạo tài khoản dịch vụ nào.
8. 🆕 22/09 **Chỗ nào có nhãn "🆕 22/09" là sửa đổi sau khi đã chạy thử thật — nó THẮNG chữ cũ ngay cạnh nếu hai bên
   khác nhau.** Chữ cũ còn giữ để thấy lý do.
9. 🆕 22/09 **Token và mật khẩu:** không bao giờ in ra, dán vào Nhật ký, commit, PR hay câu trả lời. Chủ sản phẩm không
   biết code — khi hỏi họ việc gì, nói theo "bấm vào đâu, thấy gì", kèm mục của `TRIEN_KHAI.md`.
10. 🆕 22/09 **Skill theo từng loại việc:**
    | Lúc | Skill |
    |---|---|
    | Bắt đầu | `superpowers:using-git-worktrees` → `superpowers:executing-plans` (đọc plan, theo task, dừng ở gate) |
    | Task có phép kiểm (2, 4, 6, và phép `_metadata`) | `superpowers:test-driven-development`: viết phép đỏ → chạy thấy đỏ → sửa → xanh |
    | Phép kiểm đỏ bất ngờ / lỗi lúc gói / lỗi trên Netlify | `superpowers:systematic-debugging` — tìm nguyên nhân gốc trước khi sửa |
    | Trước khi nói "xong" một task hay một gate | `superpowers:verification-before-completion` — dán kết quả lệnh thật, không nói suông |
    | Sau Task 6b, trước khi mở PR | `superpowers:requesting-code-review` (một agent rà diff cả Phần A theo plan này) → `superpowers:receiving-code-review` để xử lý góp ý |
    | Cuối | `superpowers:finishing-a-development-branch` — PR không draft, **không tự merge** |

---

## File Structure

| File | Tạo / Sửa | Trách nhiệm |
|---|---|---|
| `server/src/db.ts` | Sửa | Mở kết nối: file cục bộ (dev/test) hoặc Turso (bản chính); `tx` có savepoint |
| `server/src/moiTruong.ts` | **Tạo** | Một nơi đọc biến môi trường: `laBanChinh()`, `cauHinhDb()` |
| `server/src/platform/khoTep.ts` | **Tạo** | Kho tệp: `KhoTep` interface + `khoTepODia` + `khoTepNetlify` |
| `server/src/platform/attachments.ts` | Sửa | Dùng `KhoTep` thay `fs` trực tiếp |
| `shared/domain/attachments.ts` | Sửa | `ATTACHMENT_MAX_BYTES` = 4 MB |
| `server/src/seed/duLieuNen.ts` | **Tạo** | `napDuLieuNen(conn, now)` — quyền, vai trò, lộ trình, chương trình: **dùng chung** cho seed và bản chính |
| `server/src/seed/seed.ts` | Sửa | Gọi `napDuLieuNen` thay khối chép tay |
| `server/src/ops/initBanChinh.ts` | **Tạo** | Khởi tạo DB rỗng + chi nhánh + tài khoản quản trị (thuần, nhận `conn`) |
| `server/src/ops/runInit.ts` | **Tạo** | Điểm chạy lệnh `npm run init-ban-chinh` |
| `server/src/ops/themChiNhanh.ts` | **Tạo** | `npm run them-chi-nhanh` |
| `server/src/ops/saoLuu.ts` | **Tạo** | Chép toàn bộ DB (Turso hoặc file) ra một file `.sqlite` |
| `server/src/ops/runSaoLuu.ts` | **Tạo** | Điểm chạy `npm run sao-luu` |
| `server/src/ops/thuTurso.ts` | **Tạo** | Script gate Task 3 (đo, thử giao dịch) — giữ lại để chẩn đoán sau này |
| `server/src/routes/index.ts` | Sửa | Chặn `/demo/*` khi bản chính; cookie `secure`; đường tải tệp dùng buffer |
| `server/src/demoConfig.ts` | Sửa | `demoToday()` / `scenarioMode()` bỏ qua cấu hình demo khi bản chính |
| `server/src/app.ts` | Sửa | Đổi đường `/.netlify/functions/api/*` → `/api/*`; nhận diện lỗi ràng buộc của libsql |
| `netlify/functions/api.ts` | **Tạo** | Bọc `createApp()` bằng `serverless-http` |
| `netlify.toml` | **Tạo** | Build, publish `dist/web`, chuyển hướng, cấu hình functions |
| `web/src/lib/banChinh.ts` | **Tạo** | `LA_BAN_CHINH` cho giao diện |
| `web/src/App.tsx`, `web/src/modules/platform/WelcomePage.tsx` | Sửa | Ẩn DemoBar và tab "Vào nhanh" khi bản chính |
| `server/src/tests/banChinh.tests.ts` | **Tạo** | Phép kiểm của plan này |
| `server/src/tests/run.ts` | Sửa | Đăng ký `banChinh.tests.ts`; thêm `checkAsync` |
| `server/src/tests/yThuc.tests.ts` | Sửa | `import('better-sqlite3')` → `import('libsql')`; đóng DB trước khi xoá thư mục tạm |
| `server/src/migrate.ts` | Sửa | Một câu `.run(null)` |
| `package.json` | Sửa | Gói + lệnh mới |
| `README.md`, `CODE_MAP.md`, `TRIEN_KHAI.md`, `plan.md` | Sửa | Tài liệu |

---

### Task 0: Chuẩn bị

**Files:** chỉ đọc.

- [x] **Step 1:** Gọi skill `superpowers:using-git-worktrees`, tạo nhánh **`pr-z2a-ha-tang`** từ `main` mới nhất.
      Kiểm `git log --oneline -15` có commit merge của **PR-T (#39) và PR-K (#42)**. Chưa có → 🛑 dừng, báo chủ sản phẩm.
      🆕 22/09: kiểm worktree có file `.netlify/state.json` (được commit trên `main`, chứa mã site — **không** phải mật
      khẩu, cố ý giữ để worktree biết site nào). Không có → 🛑 dừng, hỏi.
- [x] **Step 2:** `npm install` rồi `npm run check`. Ghi **số phép kiểm hiện tại** vào Nhật ký (gọi là `N0`).
      🆕 22/09: bản thử đo được `N0 = 581` (có thể hơn nếu PR-K2 đã merge). Máy này chạy Node 24.
- [x] **Step 3:** Đọc: `plan.md` mục 24, `TRIEN_KHAI.md`, `server/src/db.ts`, `server/src/app.ts`,
      `server/src/platform/attachments.ts`, `server/src/seed/seed.ts` dòng 1–200.
- [x] **Step 4:** Chạy và **dán kết quả vào Nhật ký** (dùng ở Task 5 và 7):
      ```bash
      grep -rn "readFileSync\|existsSync\|readdirSync" server/src --include=*.ts | grep -v tests
      grep -rn "INSERT INTO" server/src/seed/seed.ts | head -40
      ```

---

### Task 1: Đổi `better-sqlite3` → `libsql` (vẫn file cục bộ)

**Files:**
- Modify: `package.json`, `server/src/db.ts`, `server/src/migrate.ts`, `server/src/tests/yThuc.tests.ts`, `server/src/app.ts`
- 🆕 22/09 Modify: `server/src/tests/sosV3.tests.ts` (dòng ~141), `scripts/check-node.mjs` (dòng ~37–50), `README.md` (dòng ~215–219)
- Modify (chỉ nếu có): mọi file khác có chuỗi `better-sqlite3` (`grep -rln "better-sqlite3" server/src scripts README.md`)

**Interfaces:**
- Produces: `db()` trả kiểu `Database` của `libsql` (cùng API `prepare/get/all/run/exec/pragma/transaction/inTransaction/close`).
- Produces: `tx<T>(fn: () => T): T` — **gọi lồng được** (dùng SAVEPOINT khi đã ở trong giao dịch).

Lý do từng sửa đổi (đã tái hiện ở phép thử 21/09):
- `libsql` **không** cho `db.transaction()` lồng trong giao dịch khác → lỗi `cannot start a transaction within a
  transaction` (14 phép kiểm). `better-sqlite3` tự dùng savepoint.
- `libsql` hiểu `.run(null)` (đúng **một** tham số `null`) là "đối tượng tham số có tên" → lỗi `failed to downcast
  any to object`.

- [x] **Step 1: Cài gói.**
  ```bash
  npm install libsql@0.5.29 --save-exact
  npm uninstall better-sqlite3 @types/better-sqlite3
  ```
- [x] **Step 2: Đổi import.** Trong **mọi** file có `better-sqlite3`:
  - `import Database from 'better-sqlite3';` → `import Database from 'libsql';`
  - `import('better-sqlite3')` → `import('libsql')`
  - Kiểu `Database.Database` → giữ nguyên nếu `tsc` chấp nhận; nếu không, dùng `InstanceType<typeof Database>`.
  - 🆕 22/09 `scripts/check-node.mjs`: đổi `import('better-sqlite3')` → `import('libsql')`, và thay hướng dẫn trong hộp
    lỗi bằng đúng đoạn này (libsql tải sẵn nhị phân, không có bước biên dịch lúc cài):
    ```js
    box('Chưa cài được thư viện database', `  Thư viện SQLite (libsql) chưa sẵn sàng nên chưa chạy được.

      Hãy chạy lệnh sau, rồi thử lại:

          npm install

      Chi tiết kỹ thuật: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
    ```
    Sửa chú thích ngay trên khối `try` cho khớp (bỏ câu "tệp bản địa được biên dịch lúc cài đặt").
  - 🆕 22/09 `README.md`: chỗ nói về `better-sqlite3` (khoảng dòng 215–219) → nói `libsql`, bỏ lệnh `npm rebuild better-sqlite3`.
  - Sau bước này: `grep -rn "better-sqlite3" server/src scripts README.md package.json` → **rỗng**.
- [x] **Step 3: `tx` gọi lồng được.** Trong `server/src/db.ts` thay hàm `tx` bằng:
  ```ts
  /*
   * GIAO DỊCH LỒNG. `better-sqlite3` tự biến giao dịch lồng thành SAVEPOINT; `libsql` thì báo lỗi
   * "cannot start a transaction within a transaction". Làm lại đúng hành vi cũ: vòng ngoài là giao dịch
   * thật, vòng trong là savepoint — lỗi ở vòng trong chỉ cuộn lại phần của nó rồi ném tiếp lên.
   */
  let savepointDepth = 0;
  export function tx<T>(fn: () => T): T {
    const conn = db();
    if (!conn.inTransaction) return conn.transaction(fn)();
    const name = `sp_${++savepointDepth}`;
    conn.exec(`SAVEPOINT ${name}`);
    try {
      const out = fn();
      conn.exec(`RELEASE ${name}`);
      return out;
    } catch (e) {
      conn.exec(`ROLLBACK TO ${name}`);
      conn.exec(`RELEASE ${name}`);
      throw e;
    } finally {
      savepointDepth--;
    }
  }
  ```
- [x] **Step 3b 🆕 22/09: Bỏ khoá `_metadata` mà libsql gắn vào dòng.** `libsql@0.5.29` thêm một khoá đếm được
      `_metadata: { duration }` vào **mỗi** dòng `Statement.get()` trả về (`.all()` và `.iterate()` thì không). Hậu quả
      đã thấy: phép kiểm "PR-T · S05+S01 (rà soát) … KHÔNG mở lại / tạo case mới" đỏ (so dòng bằng JSON), và khoá này
      **lọt ra mọi câu trả lời API** dựng từ `.get()` (686 chỗ gọi). Sửa **một chỗ** trong `server/src/db.ts`, ngay dưới các import:
  ```ts
  /*
   * libsql gắn thêm `_metadata: { duration }` vào MỖI dòng `.get()` trả về (better-sqlite3 thì không). Khoá này lọt
   * ra JSON của API và làm hỏng mọi phép so dòng. Vá một lần ở đây thay vì sửa 686 chỗ gọi.
   */
  {
    const proto = Object.getPrototypeOf(new Database(':memory:').prepare('SELECT 1')) as { get: (...a: unknown[]) => unknown };
    const getGoc = proto.get;
    proto.get = function (this: unknown, ...args: unknown[]) {
      const row = getGoc.apply(this, args);
      if (row && typeof row === 'object' && '_metadata' in row) delete (row as Record<string, unknown>)._metadata;
      return row;
    };
  }
  ```
      Nếu `tsc` không nhận `new Database(':memory:')` ở đây thì giữ nguyên ý, chỉ đổi kiểu; **không** đổi cách làm.
      Thêm phép kiểm vào `banChinh.tests.ts` **ở Task 2** (file đó tạo ở Task 2): `db().prepare('SELECT 1 AS a').get()`
      → `Object.keys(row)` đúng bằng `['a']`.
      **Cảnh báo cho mọi mã sau này (ghi thành chú thích ngay dưới khối vá):** với libsql, **không** truyền **một**
      `Buffer` làm tham số duy nhất (`.run(buf)`) — tiến trình Node chết hẳn (Rust panic). Luôn bọc: `.run(buf, x)` hoặc
      tham số có tên. `pluck().get()` và `pragma(x, { simple: true })` trả đối tượng thay vì giá trị — hiện mã không dùng,
      đừng bắt đầu dùng.
- [x] **Step 4: Các `conn.transaction(...)` gọi thẳng.** Chạy `grep -rn "\.transaction(" server/src --include=*.ts | grep -v tests`.
      Với mỗi chỗ **ngoài** `db.ts` có thể chạy khi đã ở trong một `tx(...)`: đổi thành `tx(() => { ... })`.
      Chỗ nào chắc chắn chạy độc lập (điểm vào của lệnh `migrate`) thì giữ. Ghi danh sách đã đổi vào Nhật ký.
      🆕 22/09 đã thử: chỉ có `migrate.ts:61` và `:237`, cả hai chỉ chạy qua `migrate()` (không bao giờ trong `tx`) →
      **giữ nguyên cả hai**. Grep ra chỗ khác thì mới xét.
- [x] **Step 5: `.run(null)`.** Trong `server/src/migrate.ts`, câu `UPDATE sos_cases SET merge_until = ? … .run(null)`
      → đổi SQL thành `SET merge_until = NULL` và gọi `.run()`. Rồi quét toàn bộ:
      `grep -rnE "\.(run|get|all|iterate)\(\s*(null|undefined)\s*\)" server/src --include=*.ts` — phải **rỗng**.
- [x] **Step 6: Phép kiểm J9 trên Windows.** 🆕 22/09: áp **cả** cho `server/src/tests/sosV3.tests.ts` nếu nó cũng dựng
      database trong thư mục tạm rồi xoá. Trong `server/src/tests/yThuc.tests.ts`, phép kiểm "Nâng cấp một database
      THẬT của thời trước PR-J": mọi kết nối mở tới file trong thư mục tạm phải được `.close()` **trước** lệnh xoá thư
      mục tạm (`fs.rmSync(...)`). Bọc xoá thư mục bằng `try { … } catch { /* Windows còn giữ file — bỏ qua dọn dẹp */ }`
      **chỉ** quanh lệnh xoá, không quanh phần kiểm.
- [x] **Step 7: Lỗi ràng buộc.** Trong `server/src/app.ts`, điều kiện nhận lỗi trùng dữ liệu đổi thành:
  ```ts
  const code = (err as { code?: unknown })?.code;
  if (/SQLITE_CONSTRAINT|constraint failed/i.test(message) || (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT'))) {
  ```
- [x] **Step 8:** `npm run check`. **Phải đủ `N0` phép, tất cả đạt.** Chưa đủ → systematic-debugging; không sửa phép kiểm cũ.
      🆕 22/09: bản thử đạt 581/581 sau Step 1–7 + Step 3b. Đỏ đúng phép "S05+S01" → Step 3b chưa đúng.
- [x] **Step 9:** Commit: `PR-Z2 (1): đổi better-sqlite3 sang libsql, giao dịch lồng bằng savepoint`.

---

### Task 2: Cấu hình kết nối theo môi trường

**Files:**
- Create: `server/src/moiTruong.ts`
- Modify: `server/src/db.ts`, `server/src/seed/run.ts`
- Test: `server/src/tests/banChinh.tests.ts` (tạo), `server/src/tests/run.ts` (đăng ký)

**Interfaces:**
- Produces: `laBanChinh(): boolean` — `process.env.BAN_CHINH === '1'`.
- Produces: `cauHinhDb(env = process.env): { kieu: 'file'; duongDan: string } | { kieu: 'turso'; url: string; authToken: string }`.
- Produces: `laDbTuXa(): boolean` — kết nối hiện tại là Turso.
- Produces (test kit): `runBanChinhTests(t: { check, checkAsync, assert, assertThrows })`.

- [x] **Step 1: Đăng ký file kiểm thử mới.** Trong `server/src/tests/run.ts`, ngay dưới hàm `check`, thêm:
  ```ts
  async function checkAsync(name: string, fn: () => Promise<void>) {
    try { await fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e: any) {
      failures.push(`${name}: ${e.message}`);
      console.log(`  ✗ ${name}\n      ${e.message}`);
    }
  }
  ```
  Và ngay sau dòng `await runYThucTests(...)`:
  ```ts
  const { runBanChinhTests } = await import('./banChinh.tests.ts');
  await runBanChinhTests({ check, checkAsync, assert, assertThrows });
  ```
- [x] **Step 2: Viết phép kiểm đỏ.** Tạo `server/src/tests/banChinh.tests.ts`:
  ```ts
  /** PR-Z2 — bản chính trên Netlify + Turso. Plan: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md */
  export type BanChinhTestKit = {
    check: (name: string, fn: () => void) => void;
    checkAsync: (name: string, fn: () => Promise<void>) => Promise<void>;
    assert: (cond: unknown, msg: string) => void;
    assertThrows: (fn: () => unknown, match: RegExp, msg: string) => void;
  };

  export async function runBanChinhTests(t: BanChinhTestKit) {
    const { check, assert, assertThrows } = t;
    console.log('\nPR-Z2 · 1. Cấu hình kết nối theo môi trường');
    const { cauHinhDb } = await import('../moiTruong.ts');

    check('PR-Z2 · Không có biến Turso → dùng file cục bộ như máy dev hiện tại', () => {
      const c = cauHinhDb({ PISA_DB: '/tmp/x.sqlite' });
      assert(c.kieu === 'file' && c.duongDan === '/tmp/x.sqlite', `Kỳ vọng file /tmp/x.sqlite, nhận ${JSON.stringify(c)}`);
    });
    check('PR-Z2 · Có TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → dùng Turso', () => {
      const c = cauHinhDb({ TURSO_DATABASE_URL: 'libsql://a.turso.io', TURSO_AUTH_TOKEN: 'tok' });
      assert(c.kieu === 'turso' && c.url === 'libsql://a.turso.io' && c.authToken === 'tok', JSON.stringify(c));
    });
    check('PR-Z2 · Có URL Turso mà thiếu token → từ chối rõ ràng, không lặng lẽ rơi về file', () => {
      assertThrows(() => cauHinhDb({ TURSO_DATABASE_URL: 'libsql://a.turso.io' }), /TURSO_AUTH_TOKEN/,
        'Thiếu token phải báo lỗi');
    });

    /* 🆕 22/09 — canh vá ở Task 1 Step 3b: libsql gắn `_metadata` vào dòng `.get()`. */
    const { db } = await import('../db.ts');
    check('PR-Z2 · Dòng .get() chỉ có đúng các cột đã chọn (không lọt _metadata của libsql ra API)', () => {
      const row = db().prepare('SELECT 1 AS a').get() as Record<string, unknown>;
      assert(JSON.stringify(Object.keys(row)) === '["a"]', `Nhận các khoá ${JSON.stringify(Object.keys(row))}`);
    });
  }
  ```
- [x] **Step 3:** `npm test` → ba phép cấu hình **đỏ** (chưa có `moiTruong.ts`); phép `_metadata` **xanh** (Task 1 đã vá).
      Ghi vào Nhật ký.
- [x] **Step 4: Tạo `server/src/moiTruong.ts`:**
  ```ts
  /**
   * MỘT NƠI ĐỌC BIẾN MÔI TRƯỜNG của bản chính. Nơi khác không đọc thẳng process.env cho các biến này.
   * Tên biến là hợp đồng với TRIEN_KHAI.md — đổi tên ở đây thì sửa TRIEN_KHAI.md cùng commit.
   */
  import path from 'node:path';

  export function laBanChinh(env: NodeJS.ProcessEnv = process.env): boolean {
    return env.BAN_CHINH === '1';
  }

  export type CauHinhDb =
    | { kieu: 'file'; duongDan: string }
    | { kieu: 'turso'; url: string; authToken: string };

  export function cauHinhDb(env: NodeJS.ProcessEnv = process.env, macDinh = ''): CauHinhDb {
    const url = env.TURSO_DATABASE_URL?.trim();
    if (url) {
      const authToken = env.TURSO_AUTH_TOKEN?.trim();
      if (!authToken) throw new Error('Có TURSO_DATABASE_URL nhưng thiếu TURSO_AUTH_TOKEN — không kết nối.');
      return { kieu: 'turso', url, authToken };
    }
    return { kieu: 'file', duongDan: env.PISA_DB || macDinh || path.resolve('data', 'pisa-demo.sqlite') };
  }
  ```
- [x] **Step 5: Dùng trong `server/src/db.ts`.** Giữ nguyên `ROOT`, `SCHEMA_PATH`. Thay phần mở kết nối:
  ```ts
  import { cauHinhDb } from './moiTruong.ts';

  const CAU_HINH = cauHinhDb(process.env, path.join(ROOT, 'data', 'pisa-demo.sqlite'));
  /** Đường dẫn file khi chạy cục bộ; khi chạy Turso là URL (chỉ để in log, KHÔNG in token). */
  export const DB_PATH = CAU_HINH.kieu === 'file' ? CAU_HINH.duongDan : CAU_HINH.url;
  export function laDbTuXa(): boolean { return CAU_HINH.kieu === 'turso'; }

  let instance: InstanceType<typeof Database> | null = null;

  export function db() {
    if (!instance) {
      if (CAU_HINH.kieu === 'turso') {
        /* Kiểu của libsql thiếu `authToken` (TS2353) dù thư viện có đọc nó lúc chạy — ép kiểu, đã thử 22/09. */
        instance = new Database(CAU_HINH.url, { authToken: CAU_HINH.authToken } as Database.Options);
      } else {
        fs.mkdirSync(path.dirname(CAU_HINH.duongDan), { recursive: true });
        instance = new Database(CAU_HINH.duongDan);
        instance.pragma('journal_mode = WAL');   // WAL chỉ có nghĩa với file cục bộ
      }
      instance.pragma('foreign_keys = ON');
    }
    return instance;
  }
  ```
  Trong `isInitialised()`: khi `laDbTuXa()` thì **bỏ** bước `fs.existsSync(DB_PATH)`, chỉ hỏi `sqlite_master`.
  Nếu `Database.Options` không phải tên kiểu hợp lệ trong bản `libsql` đã cài, dùng
  `as unknown as ConstructorParameters<typeof Database>[1]` — ghi Nhật ký.
- [x] **Step 5b 🆕 22/09: Thư mục tệp không được bám theo `DB_PATH` khi dùng Turso.** Hiện
      `uploadsDir()` (`server/src/platform/attachments.ts`, khoảng dòng 41) là `path.join(path.dirname(DB_PATH), 'uploads')`.
      Với Turso, `DB_PATH` là URL → thành `libsql:/uploads`, tải tệp lỗi ở Task 3 Step 5. Thay thân hàm:
  ```ts
  /** Nơi lưu tệp trên ổ đĩa: cạnh file database (`data/uploads/`, đã nằm trong .gitignore). Database ở Turso thì
   *  dùng `data/uploads/` của dự án — ổ đĩa chỉ dùng cho máy dev; bản chính cất tệp ở Netlify Blobs (Task 4). */
  export function uploadsDir(): string {
    if (process.env.PISA_UPLOADS) return process.env.PISA_UPLOADS;
    return laDbTuXa() ? path.join(ROOT, 'data', 'uploads') : path.join(path.dirname(DB_PATH), 'uploads');
  }
  ```
      Import `laDbTuXa`, `ROOT` từ `../db.ts` (kiểm `ROOT` đã được export — có, ở `db.ts`). Files: thêm
      `server/src/platform/attachments.ts` vào danh sách của Task 2.
- [x] **Step 6: Chặn seed vào Turso.** Đầu `server/src/seed/run.ts`, trước mọi thứ:
  ```ts
  import { laDbTuXa } from '../db.ts';
  if (laDbTuXa()) {
    console.error('[seed] TỪ CHỐI: đang trỏ tới Turso. `npm run seed` XOÁ SẠCH database và chỉ dùng cho máy dev.');
    process.exit(1);
  }
  ```
  **Ngoại lệ duy nhất (dùng ở Task 3 Step 4):** cho qua khi `process.env.PISA_CHO_PHEP_SEED_TURSO` có giá trị
  **và** `DB_PATH` chứa đúng chuỗi đó (ví dụ `pisa-thu-nghiem`) — tức chỉ database thử, không bao giờ bản chính:
  ```ts
  const choPhep = process.env.PISA_CHO_PHEP_SEED_TURSO;
  if (laDbTuXa() && !(choPhep && DB_PATH.includes(choPhep))) { /* thông báo TỪ CHỐI như trên */ process.exit(1); }
  ```
  Làm y hệt cho lệnh `reset` nếu có điểm chạy riêng. Thêm phép kiểm: chạy `node dist-server/server/src/seed/run.js`
  bằng `child_process.spawnSync` với env `TURSO_DATABASE_URL=libsql://khong-ton-tai.turso.io`,
  `TURSO_AUTH_TOKEN=x` → mã thoát khác 0 và stderr chứa `TỪ CHỐI`.
- [x] **Step 7:** `npm run check` xanh, số phép = `N0 + 5` (ba phép cấu hình + phép `_metadata` + phép chặn seed).
      Commit: `PR-Z2 (2): cấu hình kết nối theo môi trường, chặn seed vào Turso`.

---

### Task 3 🛑 GATE: Thử Turso thật

**Mục đích:** chứng minh đường đồng bộ `libsql` chạy được **qua mạng**, và đủ nhanh. Nếu không → dừng cả plan.

**Files:** Create `server/src/ops/thuTurso.ts`; Modify `package.json` (lệnh `thu-turso`).

- [x] **Step 1 🆕 22/09: Lấy URL + token database THỬ — KHÔNG hỏi chủ sản phẩm gửi token qua chat.** Chủ sản phẩm đã
      tạo `pisa-thu-nghiem` (vùng Ohio) và đã đặt nó vào biến môi trường của site Netlify (`TRIEN_KHAI.md` mục 5).
      Netlify CLI trên máy này đã đăng nhập, và worktree có `.netlify/state.json` nên biết site. Chạy trong worktree:
  ```powershell
  netlify status
  netlify env:get TURSO_DATABASE_URL
  ```
      - `netlify status` phải in tên site; không in → 🛑 hỏi chủ sản phẩm chạy `netlify login` (mục 3 TRIEN_KHAI).
      - URL in ra **phải chứa `pisa-thu-nghiem`**. Chứa `pisa-ban-chinh` hoặc chữ khác → 🛑 **dừng ngay**, báo chủ sản phẩm:
        biến của site đang trỏ database bản chính, không được dùng cho thử nghiệm.
      - Ở mỗi lệnh cần Turso, nạp hai biến **trong chính lệnh đó**, không in token ra màn hình, không ghi vào file:
        ```powershell
        $env:TURSO_DATABASE_URL = (netlify env:get TURSO_DATABASE_URL); $env:TURSO_AUTH_TOKEN = (netlify env:get TURSO_AUTH_TOKEN); npm run thu-turso
        ```
        Nếu `netlify env:get` trả kèm chữ thừa (dòng thông báo), lấy dòng cuối: `(netlify env:get TURSO_AUTH_TOKEN | Select-Object -Last 1)`.
      - **Không bao giờ** dán token vào Nhật ký, commit, PR hay câu trả lời. Nhật ký chỉ ghi URL (URL không phải bí mật).
      - Vùng Functions của site: xem `netlify status` hoặc bỏ qua — Task 6b đo tốc độ thật trên Netlify.
- [x] **Step 2: Viết `server/src/ops/thuTurso.ts`** — chạy độc lập, in bảng kết quả, **không** đụng bảng thật:
  ```ts
  import Database from 'libsql';
  import { cauHinhDb } from '../moiTruong.ts';

  const c = cauHinhDb();
  if (c.kieu !== 'turso') { console.error('Cần TURSO_DATABASE_URL + TURSO_AUTH_TOKEN'); process.exit(1); }
  const conn = new Database(c.url, { authToken: c.authToken } as Database.Options);   // ép kiểu: xem Task 2 Step 5
  const ketQua: [string, string][] = [];
  const thu = (ten: string, fn: () => string) => {
    try { ketQua.push([ten, 'ĐẠT · ' + fn()]); } catch (e: any) { ketQua.push([ten, 'HỎNG · ' + e.message]); }
  };
  const doMs = (fn: () => void, lan = 20) => { const t = performance.now(); for (let i = 0; i < lan; i++) fn(); return ((performance.now() - t) / lan).toFixed(1) + ' ms/lần'; };

  thu('1. SELECT 1 (độ trễ một lượt)', () => doMs(() => conn.prepare('SELECT 1').get()));
  thu('2. exec nhiều câu một lần', () => { conn.exec('DROP TABLE IF EXISTS _thu; CREATE TABLE _thu (id INTEGER PRIMARY KEY, v TEXT);'); return 'ok'; });
  thu('3. PRAGMA foreign_keys', () => { conn.pragma('foreign_keys = ON'); return JSON.stringify(conn.pragma('foreign_keys')); });
  thu('4. lastInsertRowid', () => String(conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('a').lastInsertRowid));
  thu('5. transaction() thành công', () => { conn.transaction(() => { conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('b'); })(); return String((conn.prepare('SELECT COUNT(*) n FROM _thu').get() as any).n); });
  thu('6. transaction() lỗi thì cuộn lại', () => {
    try { conn.transaction(() => { conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('c'); throw new Error('cố ý'); })(); } catch { /* đúng */ }
    const n = (conn.prepare("SELECT COUNT(*) n FROM _thu WHERE v = 'c'").get() as any).n;
    if (n !== 0) throw new Error('KHÔNG cuộn lại — dòng c vẫn còn'); return 'đã cuộn lại';
  });
  thu('7. SAVEPOINT trong transaction', () => { conn.transaction(() => { conn.exec('SAVEPOINT s1'); conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('d'); conn.exec('ROLLBACK TO s1'); conn.exec('RELEASE s1'); })(); return 'ok'; });
  thu('8. inTransaction', () => String(conn.inTransaction));
  thu('9. 100 INSERT trong một transaction', () => doMs(() => conn.transaction(() => { for (let i = 0; i < 100; i++) conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('x'); })(), 1));
  thu('10. dọn', () => { conn.exec('DROP TABLE _thu'); return 'ok'; });
  console.table(ketQua);
  conn.close();
  ```
  `package.json`: `"thu-turso": "npm run build:server && node dist-server/server/src/ops/thuTurso.js"`.
- [x] **Step 3: Chạy** với database **thử**, nạp biến như Step 1. Dán nguyên bảng vào Nhật ký.
      🆕 22/09 thêm vào `thuTurso.ts` hai dòng thử (trước dòng `10. dọn`), vì hai điều này mới chỉ thử với file cục bộ:
  ```ts
  thu('9b. .get() qua mạng có _metadata không (Task 1 Step 3b phải vá được cả đường mạng)', () => {
    const row = conn.prepare('SELECT 1 AS a').get() as Record<string, unknown>;
    return JSON.stringify(Object.keys(row));   // ghi lại; thuTurso mở kết nối riêng nên CHƯA qua vá — chỉ để biết
  });
  thu('9c. Tệp nhị phân (BLOB) đi kèm tham số khác', () => {
    conn.exec('CREATE TABLE IF NOT EXISTS _thu_b (id INTEGER PRIMARY KEY, b BLOB, v TEXT)');
    conn.prepare('INSERT INTO _thu_b (b, v) VALUES (?, ?)').run(Buffer.from('xin chao'), 'x');
    const r = conn.prepare('SELECT b FROM _thu_b').get() as any;
    conn.exec('DROP TABLE _thu_b');
    return Buffer.from(r.b).toString();
  });
  ```
      `9b` in ra có `_metadata` → bình thường (vá ở `db.ts`, còn script này mở kết nối riêng). Step 5 bên dưới mới là nơi
      kiểm thật: câu trả lời JSON của `/api/...` **không** được có chữ `_metadata` (tab Network → Response, Ctrl+F).
- [x] **Step 4: Thử nặng** — dựng bộ demo lên database **thử** (được phép vì là database thử; seed đang bị Task 2 chặn
      với Turso, nên chạy qua một lệnh riêng):
      `$env:PISA_CHO_PHEP_SEED_TURSO="pisa-thu-nghiem"; npm run seed` (ngoại lệ đã làm ở Task 2 Step 6), nạp hai biến
      Turso như Step 1 trong **cùng** lệnh.
      Ghi **thời gian** chạy vào Nhật ký.
- [x] **Step 5: Thử trang thật qua Turso:** chạy `npm run dev` với hai biến Turso của database thử, đăng nhập tài khoản
      demo Quản lý Monbay, **đo thời gian tải** (tab Network của trình duyệt, cột Time của lời gọi `/api/...` lớn nhất)
      cho: hồ sơ học viên Lê Quang Huy · bảng nhập điểm lớp MB-FT 101 · Tổng quan · Thực trạng · tab Ý thức & Phối hợp của
      MB-FT 101. Ghi bảng vào Nhật ký.
- [x] **Step 6: Quyết định — theo đúng bảng này:** 🆕 22/09 — **ĐI TIẾP THEO QUYẾT ĐỊNH 22/09 của chủ sản phẩm + session planning (KHÔNG phải ô ✅ thường):** mục 2, 5, 6, 7 ĐẠT (13/13); số đo tốc độ từ Việt Nam vượt 10 giây nhưng **không phải số quyết định** — ngưỡng của bảng là ngưỡng TRÊN NETLIFY, đo ở Task 6b Step 7 (giữ nguyên: trung bình 3 lần sau > 10 giây ở bất kỳ trang nào → DỪNG; khởi động lạnh ghi riêng, không dùng để dừng). Bảng đo ở Nhật ký.

  | Kết quả | Làm gì |
  |---|---|
  | Mục 2, 5, 6, 7 đều ĐẠT **và** mọi trang ở Step 5 ≤ 3 giây | ✅ Đi tiếp Task 4 |
  | Mục 2, 5, 6, 7 ĐẠT, có trang **> 3 giây** | Đi tiếp, nhưng ghi các trang đó vào Nhật ký — xử lý ở Task 10 Step 6 |
  | Có trang **> 10 giây** | 🛑 **Dừng.** Báo chủ sản phẩm + session thiết kế: kèm bảng đo. Không tự tối ưu |
  | Mục 5, 6 hoặc 7 **HỎNG** | 🛑 **Dừng cả plan.** Đường đồng bộ không dùng được qua mạng. Báo chủ sản phẩm; **không** tự chuyển sang async |

  Ghi lưu ý: máy chủ sản phẩm ở Việt Nam còn Turso ở Mỹ → số đo ở Step 5 **tệ hơn** thực tế trên Netlify (Function và
  Turso cùng vùng). Nếu Step 5 chậm, đo lại mục 1 để ước: *thời gian trên Netlify ≈ số câu hỏi DB × (độ trễ cùng vùng
  ~1–5 ms)*. Ghi ước lượng vào Nhật ký, **dựa vào số đo thật ở Task 10** để quyết định cuối cùng.
- [x] **Step 7:** Commit: `PR-Z2 (3): script thử Turso + kết quả gate`.

---

### Task 4: Kho tệp — ổ đĩa (dev) và Netlify Blobs (bản chính)

**Files:**
- Create: `server/src/platform/khoTep.ts`
- Modify: `server/src/platform/attachments.ts`, `shared/domain/attachments.ts`, `server/src/routes/index.ts` (đường tải), `package.json`
- 🆕 22/09 Modify: `server/src/yThuc/violations.ts` (xoá tệp sau giao dịch), `server/src/migrate.ts` (chỉ thêm chú thích)
- Test: `server/src/tests/banChinh.tests.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface KhoTep {
    ghi(khoa: string, duLieu: Buffer, mime: string): Promise<void>;
    doc(khoa: string): Promise<Buffer | null>;
    xoa(khoa: string): Promise<void>;
  }
  export function khoTepHienTai(): KhoTep;           // bản chính → Netlify Blobs; còn lại → ổ đĩa
  export function datKhoTepChoKiemThu(k: KhoTep | null): void;
  ```
- Consumes: `laBanChinh()` (Task 2).
- **Đổi chữ ký** (các route đã bọc trong `wrap`, nên chỉ cần `await`): `addFile` → `async`, `openAttachment` →
  `async` và trả `{ kind: 'file'; duLieu: Buffer; mimeType; downloadName } | { kind: 'link'; url }`, `removeAttachment` → `async`.
  `purgeAttachmentsOf` **giữ đồng bộ** (xem Step 5).

- [x] **Step 1:** `npm install @netlify/blobs@11.1.0 --save-exact` (🆕 22/09: bản mới nhất đã kiểm; cần Node ≥ 22.12 —
      máy này Node 24, Netlify đặt Node 22 ở Task 5). Có bản mới hơn cũng **giữ 11.1.0**. Ghi số bản vào Nhật ký.
      Đọc README của gói trong `node_modules/@netlify/blobs/README.md` phần **Lambda compatibility mode** (`connectLambda`).
- [x] **Step 2: Phép kiểm đỏ** — thêm vào `banChinh.tests.ts` (dùng kho giả trong bộ nhớ, không cần mạng):
  ```ts
  console.log('\nPR-Z2 · 2. Kho tệp');
  const { datKhoTepChoKiemThu } = await import('../platform/khoTep.ts');
  const khoGia = new Map<string, Buffer>();
  datKhoTepChoKiemThu({
    async ghi(k, d) { khoGia.set(k, d); },
    async doc(k) { return khoGia.get(k) ?? null; },
    async xoa(k) { khoGia.delete(k); },
  });
  const { ATTACHMENT_MAX_BYTES } = await import('../../../shared/domain/attachments.ts');
  check('PR-Z2 · Giới hạn tệp là 4 MB (Netlify Functions nhận tối đa ~6 MB mỗi lần gọi)', () => {
    assert(ATTACHMENT_MAX_BYTES === 4 * 1024 * 1024, `Đang là ${ATTACHMENT_MAX_BYTES}`);
  });
  ```
  Thêm một `checkAsync`: dùng principal Quản trị hệ thống (lấy như cách `run.ts` dựng `P`: truyền thêm `P` và `conn`
  vào kit nếu cần — **ghi thay đổi kit vào Nhật ký**), gọi `addFile` cho một case học thuật có sẵn trong bộ demo với
  `Buffer.from('xin chao')`, rồi `openAttachment` → `duLieu.toString() === 'xin chao'`; `removeAttachment` →
  `khoGia.size` giảm 1. Cuối nhóm: `datKhoTepChoKiemThu(null)`.
- [x] **Step 3:** `npm test` → đỏ. Ghi Nhật ký.
- [x] **Step 4: Tạo `server/src/platform/khoTep.ts`:**
  ```ts
  /**
   * KHO TỆP — nơi cất nội dung tệp bằng chứng. Bảng `attachments` giữ metadata + `url` (= khoá trong kho).
   * Máy dev: ổ đĩa `data/uploads/` như trước. Bản chính: Netlify Blobs (Netlify Functions không có ổ đĩa giữ lâu).
   */
  import fs from 'node:fs';
  import path from 'node:path';
  import { laBanChinh } from '../moiTruong.ts';

  export interface KhoTep {
    ghi(khoa: string, duLieu: Buffer, mime: string): Promise<void>;
    doc(khoa: string): Promise<Buffer | null>;
    xoa(khoa: string): Promise<void>;
  }

  export function khoTepODia(thuMuc: string): KhoTep {
    const duongDan = (khoa: string) => {
      const abs = path.resolve(thuMuc, khoa);
      if (!abs.startsWith(path.resolve(thuMuc) + path.sep)) throw new Error('Khoá tệp không hợp lệ.');
      return abs;
    };
    return {
      async ghi(khoa, duLieu) { const p = duongDan(khoa); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, duLieu); },
      async doc(khoa) { const p = duongDan(khoa); return fs.existsSync(p) ? fs.readFileSync(p) : null; },
      async xoa(khoa) { fs.rmSync(duongDan(khoa), { force: true }); },
    };
  }

  export function khoTepNetlify(): KhoTep {
    return {
      async ghi(khoa, duLieu, mime) {
        const { getStore } = await import('@netlify/blobs');
        await getStore('bang-chung').set(khoa, new Uint8Array(duLieu), { metadata: { mime } });
      },
      async doc(khoa) {
        const { getStore } = await import('@netlify/blobs');
        const ab = await getStore('bang-chung').get(khoa, { type: 'arrayBuffer' });
        return ab ? Buffer.from(ab) : null;
      },
      async xoa(khoa) {
        const { getStore } = await import('@netlify/blobs');
        await getStore('bang-chung').delete(khoa);
      },
    };
  }

  let khoKiemThu: KhoTep | null = null;
  export function datKhoTepChoKiemThu(k: KhoTep | null) { khoKiemThu = k; }

  let khoODiaMacDinh: KhoTep | null = null;
  export function khoTepHienTai(thuMucODia?: string): KhoTep {
    if (khoKiemThu) return khoKiemThu;
    if (laBanChinh()) return khoTepNetlify();
    if (!khoODiaMacDinh) khoODiaMacDinh = khoTepODia(thuMucODia ?? path.resolve('data', 'uploads'));
    return khoODiaMacDinh;
  }
  ```
- [x] **Step 5: Sửa `server/src/platform/attachments.ts`** — thay mọi `fs.*` bằng kho:
  - `addFile`: kiểm quyền và kích thước **như cũ**, rồi `await khoTepHienTai(uploadsDir()).ghi(khoa, input.data, mime)` với
    `khoa = \`${input.ownerType}/${stored}\`` (**đúng** định dạng `url` đang lưu ở bảng — kiểm lại bằng dòng hiện tại
    `path.join(dir, stored)` và giá trị `url` được INSERT), sau đó INSERT dòng bảng; INSERT lỗi → `await kho.xoa(khoa)` rồi ném lại.
  - `openAttachment`: kiểm quyền như cũ; tệp → `const duLieu = await kho.doc(r.url)`; `null` → `notFound('Tệp không còn trên máy chủ')`.
  - `removeAttachment`: xoá dòng bảng + audit **trước**, rồi `await kho.xoa(r.url)` (xoá tệp lỗi → `console.error`, không ném).
  - 🆕 22/09 — **`purgeAttachmentsOf` (viết lại mục này; plan cũ sai chữ ký).** Hàm thật có **bốn** tham số:
    `(ownerType, ownerId, actorUserId, deferredFiles?: string[])`; hiện nó `fs.rmSync` ngay, hoặc đẩy **đường dẫn tuyệt
    đối** vào `deferredFiles` để nơi gọi xoá sau khi giao dịch chốt. Nơi gọi (đã kiểm 22/09):
    `server/src/yThuc/measures.ts` ~365 (trong `tx`, **không** truyền `deferredFiles`) và `server/src/yThuc/violations.ts`
    ~315 (trong `tx`, **có** truyền; sau `tx` tự `fs.rmSync` từng đường dẫn ở ~330). Làm đúng như sau:
    1. Thêm vào `attachments.ts`:
       ```ts
       /**
        * XOÁ TỆP TRONG KHO SAU KHI GIAO DỊCH ĐÃ CHỐT. Không chờ (không `await`) và không ném: nơi gọi là hàm đồng bộ chạy
        * ngay sau `tx(...)`. Với kho ổ đĩa, lệnh xoá chạy xong ngay trong lượt gọi này (thân hàm async chạy đồng bộ tới
        * lần `await` đầu tiên) — nên hành vi máy dev và các phép kiểm cũ giữ nguyên. Với Netlify Blobs, xoá lỗi thì còn
        * một tệp mồ côi: vô hại ở quy mô này, dòng `attachments` đã xoá và đã có audit.
        */
       export function xoaTepSauGiaoDich(khoaTep: string[]): void {
         const kho = khoTepHienTai(uploadsDir());
         for (const k of khoaTep) {
           kho.xoa(k).catch((e) => console.error('[kho tệp] không xoá được', k, e));
         }
       }
       ```
    2. Trong `purgeAttachmentsOf`: `deferredFiles` giờ chứa **khoá kho** (`r.url`), không còn đường dẫn tuyệt đối.
       Thân vòng lặp: `if (r.kind === 'file') { if (deferredFiles) deferredFiles.push(r.url); else xoaTepSauGiaoDich([r.url]); }`.
       Sửa chú thích của tham số cho khớp ("khoá tệp trong kho", không phải "đường dẫn trên đĩa").
    3. Trong `violations.ts` `deleteViolation`: đổi tên `diskFiles` → `khoaTep`, và thay vòng
       `for (const f of diskFiles) { try { fs.rmSync(...) } ... }` bằng **một** dòng `xoaTepSauGiaoDich(khoaTep);`.
       Bỏ import `fs` nếu không còn dùng.
    4. `migrate.ts` (`migrateDeleteInvalidViolations` + `flushDeferredFileRemovals`): **giữ nguyên** (đường dẫn ổ đĩa).
       Lý do, viết thành chú thích tại `deferredFileRemovals`: lệnh nâng cấp chỉ gặp dòng `valid = 0` ở database có từ
       trước rulebook v3 — tức database của máy dev; bản chính bắt đầu rỗng nên không bao giờ có dòng này.
    5. `grep -rn "fs\.\(rmSync\|unlinkSync\|writeFileSync\|readFileSync\|existsSync\)" server/src/platform server/src/yThuc`
       — chỉ còn trong `khoTep.ts` (kho ổ đĩa). Còn chỗ khác trên đường API → ghi Nhật ký, đưa qua kho.
  - `shared/domain/attachments.ts`: `ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024`; thông báo lỗi `'Tệp quá lớn: tối đa 4 MB.'`
    (tìm và đổi **mọi** chỗ ghi "10 MB": `grep -rn "10 MB" server web shared`).
- [x] **Step 6: Route tải xuống** (`server/src/routes/index.ts`, `GET /attachments/:id/download`): `const o = await ...`;
      thay `res.sendFile(o.absPath)` bằng `res.send(o.duLieu)`. Giữ nguyên ba header an toàn. Các route thêm/xoá tệp: thêm `await`.
- [x] **Step 7:** `npm run check` xanh (các phép N5 cũ của PR-N phải còn xanh — chúng chạy với kho ổ đĩa).
      🆕 22/09: 7 phép cũ chuyển sang checkAsync + await, điều kiện kiểm giữ nguyên (ba hàm tệp thành async nên
      `check(...)` đồng bộ không còn gọi được — chi tiết và danh sách 7 phép ở Nhật ký, dòng Task 4). Commit:
      `PR-Z2 (4): kho tệp — ổ đĩa ở máy dev, Netlify Blobs ở bản chính; giới hạn 4 MB`.

---

### Task 5: Netlify Function + `netlify.toml`

**Files:** Create `netlify/functions/api.ts`, `netlify.toml`, 🆕 `scripts/thu-goi-function.mjs`; Modify `server/src/app.ts`,
🆕 `server/src/db.ts`, `package.json`.

**Interfaces:** Consumes `createApp()` (có sẵn, `server/src/app.ts`).

- [x] **Step 1:** `npm install serverless-http@4.0.0 --save-exact` (🆕 22/09: bản đã thử). Ghi số bản.
- [x] **Step 1b 🆕 22/09 — BẮT BUỘC: `db.ts` không được dựa vào `import.meta.url` hay tên `__dirname`.** Đã tái hiện:
      Netlify gói hàm kiểu `export const handler` thành **CommonJS** → `import.meta.url` rỗng →
      `fileURLToPath(undefined)` ném lỗi **ngay lúc nạp** → mọi `/api/*` trả 502. Nếu Netlify gói ESM thì đoạn mở đầu nó
      chèn khai báo `let __dirname` → trùng với `const __dirname` của `db.ts` → SyntaxError. Trong `server/src/db.ts`, thay:
  ```ts
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  ```
      bằng:
  ```ts
  /*
   * Thư mục chứa file mã này. Trên Netlify, hàm được gói thành CommonJS nên `import.meta.url` RỖNG (đã tái hiện
   * 22/09: sập ngay lúc nạp). Khi đó rơi về thư mục đang chạy — trên Netlify đường API không đọc file nào theo ROOT.
   * KHÔNG đặt tên biến là `__dirname`: bản gói ESM của Netlify tự khai báo tên đó.
   */
  const THU_MUC_MA = import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd();
  ```
      và `findProjectRoot(__dirname)` → `findProjectRoot(THU_MUC_MA)`. Rồi quét:
      `grep -rn "__dirname\|import\.meta\.url" server/src --include=*.ts | grep -v tests` — mỗi kết quả còn lại: ghi Nhật ký,
      xét nó có chạy trên đường API không (seed/migrate/ops thì không sao). Chạy trên đường API → sửa theo cùng mẫu.
- [x] **Step 2: Đường dẫn Express nhìn thấy.** Trong `createApp()` của `server/src/app.ts`, dòng **đầu tiên** sau `express()`:
  ```ts
  /* Trên Netlify, lời gọi /api/x được chuyển tới /.netlify/functions/api/x. Đưa về /api/x để mọi route giữ nguyên. */
  app.use((req, _res, next) => {
    const tienTo = '/.netlify/functions/api';
    if (req.url.startsWith(tienTo)) req.url = '/api' + req.url.slice(tienTo.length);
    next();
  });
  ```
- [x] **Step 3: Tạo `netlify/functions/api.ts`:**
  ```ts
  /**
   * MÁY CHỦ BẢN CHÍNH trên Netlify — chính ứng dụng Express của máy dev (`createApp`), bọc thành một Function.
   * Không có logic nghiệp vụ nào ở đây.
   */
  import serverless from 'serverless-http';
  import { connectLambda } from '@netlify/blobs';
  import { createApp } from '../../server/src/app.ts';

  const app = createApp();
  /* Kiểu nội dung trả về dạng nhị phân. Thiếu một kiểu → tệp tải xuống bị hỏng (đã thấy 22/09: mp4 13 byte → 19 byte).
     Phải phủ mọi đuôi trong ATTACHMENT_MIME_BY_EXT (shared/domain/attachments.ts). */
  const xuLy = serverless(app, {
    binary: ['multipart/form-data', 'application/octet-stream', 'image/*', 'audio/*', 'video/*', 'application/pdf',
             'application/msword', 'application/vnd.*', 'application/zip'],
  });

  export const handler = async (event: any, context: any) => {
    /* Cho @netlify/blobs biết site/đường vào kho (chế độ Lambda). Không có `event.blobs` (ví dụ chạy thử cục bộ) thì
       connectLambda ném lỗi — nên chỉ gọi khi có. Đã kiểm với @netlify/blobs 11.1.0. */
    if (event?.blobs) connectLambda(event);
    return xuLy(event, context);
  };
  ```
- [x] **Step 4: Tạo `netlify.toml`:**
  ```toml
  [build]
    command = "npm run build"
    publish = "dist/web"

  [build.environment]
    NODE_VERSION = "22"
    VITE_BAN_CHINH = "1"

  [functions]
    directory = "netlify/functions"
    node_bundler = "esbuild"
    external_node_modules = ["libsql"]

  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/api/:splat"
    status = 200

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
  🆕 22/09: `NODE_VERSION = "22"` (không phải 20: `@netlify/blobs` 11.x cần Node ≥ 22.12, Node 20 hết hỗ trợ 04/2026).
  **Không** cần `included_files`: bản thử đã chạy đường API mà không có `schema.sql` (file đó chỉ lệnh `seed` đọc). Nếu
  Task 0 Step 4 cho thấy một file không phải .ts được đọc **trên đường API** thì mới thêm, ghi Nhật ký.
- [x] **Step 5: Thử cục bộ bằng Netlify CLI:**
  ```bash
  npm install -g netlify-cli
  $env:BAN_CHINH="1"; netlify dev
  ```
  Mở địa chỉ CLI in ra → màn đăng nhập hiện. Gọi `/api/health` → `{"ok":true,...}`. Đăng nhập tài khoản demo Quản trị,
  mở hồ sơ một học viên, tải lên một tệp nhỏ rồi tải xuống lại, so nội dung. Ghi kết quả vào Nhật ký.
  Lỗi "cannot find module libsql" hoặc lỗi nhị phân → kiểm `external_node_modules`; **không** đổi thư viện.
  **Lưu ý Linux:** Netlify chạy Linux, máy này chạy Windows. `libsql` cần gói nhị phân `@libsql/linux-x64-gnu` trên
  Netlify. Kiểm `package-lock.json` có mục `node_modules/@libsql/linux-x64-gnu` (npm thường ghi đủ gói tuỳ chọn cho mọi
  nền tảng). Không có → `npm install --save-optional @libsql/linux-x64-gnu@<cùng bản với libsql>` và ghi Nhật ký.
  Lỗi này chỉ lộ ra ở Task 10 (deploy thật) — nên kiểm ngay bây giờ.
- [x] **Step 5b 🆕 22/09 — Thử gói như Netlify, tự động, không cần mạng.** Lỗi Step 1b chỉ lộ ra khi mã đã được **gói**
      và chạy **ở thư mục khác**; `npm run check` không bắt được. Dựng một lệnh thử lặp lại được:
      1. `npm install esbuild@0.28.2 --save-dev --save-exact`.
      2. Tạo `scripts/thu-goi-function.mjs`:
  ```js
  /**
   * THỬ GÓI MÁY CHỦ NHƯ NETLIFY GÓI (CommonJS, libsql để ngoài) rồi gọi nó từ MỘT THƯ MỤC KHÁC — bắt các lỗi chỉ lộ
   * ra sau khi gói (import.meta.url rỗng, đường dẫn theo ROOT, tệp thiếu). Không cần mạng, không đụng Turso.
   * Chạy: npm run thu-goi   (dùng database máy dev: data/pisa-demo.sqlite — chạy `npm run seed` trước nếu chưa có)
   */
  import { build } from 'esbuild';
  import fs from 'node:fs';
  import os from 'node:os';
  import path from 'node:path';
  import { createRequire } from 'node:module';

  const repo = process.cwd();
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'pisa-goi-'));
  const out = path.join(tam, 'api.cjs');
  await build({
    entryPoints: [path.join(repo, 'netlify/functions/api.ts')],
    bundle: true, platform: 'node', target: 'node22', format: 'cjs', outfile: out,
    external: ['libsql', '@libsql/*'], logLevel: 'warning',
  });
  process.env.PISA_DB ??= path.join(repo, 'data', 'pisa-demo.sqlite');
  process.chdir(tam);                                  // như /var/task: không có package.json của dự án
  const require = createRequire(path.join(repo, 'package.json'));   // libsql vẫn nạp từ node_modules của dự án
  const Module = require('node:module');
  const goc = Module._resolveFilename;
  Module._resolveFilename = function (req, ...rest) {
    if (req === 'libsql' || req.startsWith('@libsql/')) return require.resolve(req);
    return goc.call(this, req, ...rest);
  };
  const { handler } = require(out);

  const goi = (p, method = 'GET') => handler({
    httpMethod: method, path: p, headers: { host: 'thu.local' }, multiValueHeaders: {},
    queryStringParameters: null, multiValueQueryStringParameters: null, body: null, isBase64Encoded: false,
    requestContext: { identity: { sourceIp: '127.0.0.1' } },
  }, {});

  let hong = 0;
  for (const p of ['/api/health', '/.netlify/functions/api/health', '/api/auth/info']) {
    const r = await goi(p);
    const ok = r.statusCode === 200 && !String(r.body).includes('_metadata');
    if (!ok) hong++;
    console.log(`${ok ? 'ĐẠT' : 'HỎNG'}  ${p}  → ${r.statusCode}  ${String(r.body).slice(0, 120)}`);
  }
  fs.rmSync(tam, { recursive: true, force: true });
  if (hong) { console.error(`\n${hong} đường HỎNG — máy chủ gói xong không chạy được. Xem Task 5 Step 1b.`); process.exit(1); }
  console.log('\nGói máy chủ như Netlify: chạy được.');
  ```
      3. `package.json`: `"thu-goi": "node scripts/thu-goi-function.mjs"`.
      4. **Kiểm rằng lệnh này bắt được lỗi thật:** tạm hoàn tác Step 1b (`git stash` riêng file `db.ts`, hoặc sửa tay về
         dòng cũ) → `npm run thu-goi` phải **HỎNG** (lỗi `fileURLToPath` / "must be of type string"). Trả Step 1b lại →
         `npm run thu-goi` **ĐẠT** cả ba dòng. Ghi cả hai kết quả vào Nhật ký. Không hỏng được khi bỏ Step 1b → script
         chưa mô phỏng đúng, 🛑 dừng, ghi Nhật ký, hỏi session planning.
      Nếu `Module._resolveFilename` không nạp được libsql trên máy này, được phép đổi cách nạp (ví dụ chép thư mục
      `node_modules/libsql`, `node_modules/@libsql/win32-x64-msvc`, `node_modules/@neon-rs` vào `tam/node_modules`) —
      miễn là **bản gói vẫn chạy ở thư mục khác** và bước 4 vẫn hỏng/đạt như trên. Ghi cách đã dùng vào Nhật ký.
- [x] **Step 6:** `npm run check` xanh; `npm run thu-goi` ĐẠT; `npm run dev` vẫn chạy như cũ.
      Commit: `PR-Z2 (5): máy chủ thành Netlify Function + lệnh thử gói`.

---

### Task 6: Tắt mọi thứ của bản demo khi bản chính

**Files:** Modify `server/src/demoConfig.ts`, `server/src/routes/index.ts`; Create `web/src/lib/banChinh.ts`;
Modify `web/src/App.tsx`, `web/src/modules/platform/WelcomePage.tsx`; Test `banChinh.tests.ts`.
🆕 22/09: có thể thêm file khai kiểu `AuthInfo` (tìm `type AuthInfo` trong `web/src`).

**Interfaces:** Consumes `laBanChinh()`. Produces `LA_BAN_CHINH: boolean` (web).

- [x] **Step 1: Phép kiểm đỏ** (thêm vào `banChinh.tests.ts`):
  ```ts
  console.log('\nPR-Z2 · 3. Bản chính không có gì của bản demo');
  const { demoToday, scenarioMode } = await import('../demoConfig.ts');
  check('PR-Z2 · Bản chính: demoToday() là ngày thật, bỏ qua demo_date đã đặt', () => {
    process.env.BAN_CHINH = '1';
    try {
      const homNay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      assert(demoToday() === homNay, `Kỳ vọng ${homNay}, nhận ${demoToday()}`);
    } finally { delete process.env.BAN_CHINH; }
  });
  check('PR-Z2 · Bản chính: chế độ kịch bản luôn là normal, kể cả khi cấu hình demo đang đặt khác', () => {
    const { setConfig, getConfig } = demoConfigMod;
    const cu = getConfig('scenario_mode');
    setConfig('scenario_mode', 'error');
    process.env.BAN_CHINH = '1';
    try {
      assert(scenarioMode() === 'normal', `Nhận ${scenarioMode()}`);
    } finally { delete process.env.BAN_CHINH; setConfig('scenario_mode', cu); }
  });
  ```
  Ngay trên hai phép này thêm `const demoConfigMod = await import('../demoConfig.ts');` (cùng module, lấy thêm
  `setConfig`/`getConfig` — nếu hai hàm này không được export thì export chúng, ghi Nhật ký). Bộ demo đang đặt
  `demo_date = 2026-09-14`, nên phép thứ nhất đỏ trước khi sửa. Thêm một phép kiểm HTTP theo **đúng khuôn phép kiểm HTTP có sẵn của PR-J** (tìm
  `createApp` trong `server/src/tests/`): với `BAN_CHINH=1`, `GET /api/demo/accounts` → 404.
  🆕 22/09 — thêm các phép HTTP sau (cùng khuôn, cùng `BAN_CHINH=1`, nhớ `delete process.env.BAN_CHINH` trong `finally`):

  | Gọi | Kỳ vọng | Vì sao |
  |---|---|---|
  | `POST /api/demo/session` với `{ userId: <id Quản trị trong bộ demo> }`, **không** cookie | **404**, không có `Set-Cookie` | Đường này đăng nhập bằng id **không cần mật khẩu** — trên mạng là cửa sau |
  | `PUT /api/demo/config` (đã đăng nhập) | **404** | Đổi ngày giả / kịch bản lỗi |
  | `GET /api/demo/config` | **404** | |
  | `GET /api/demo/session` | **200** | Màn đăng nhập cần nó để biết đã đăng nhập chưa; ~10 màn dùng `demoDate` làm "hôm nay" |
  | `DELETE /api/demo/session` | mã thành công hiện có | Nút Đăng xuất |
  | `GET /api/auth/info` | 200, JSON **không** có khoá `demoAdmin` | Không lộ mật khẩu mặc định |
  | `POST /api/demo/session` khi **không** có `BAN_CHINH` | như cũ (thành công) | Máy dev giữ "Vào nhanh" |
- [x] **Step 2:** `npm test` → đỏ.
- [x] **Step 3: Máy chủ.** `demoToday()`: `if (laBanChinh()) return todayInBusinessTz();` ở dòng đầu. `scenarioMode()`:
      `if (laBanChinh()) return 'normal';`. Trong `routes/index.ts`, một middleware đặt **trước** mọi route `/demo`:
  🆕 22/09 — đã đọc mã thật: `web/src/lib/session.tsx` gọi `GET /demo/session` (biết phiên + `demoDate`), `POST
  /demo/session` (**"Vào nhanh" — đăng nhập bằng id, KHÔNG mật khẩu**) và `DELETE /demo/session` (đăng xuất). Vì vậy
  cho qua **đúng hai** đường GET và DELETE `/demo/session`, chặn mọi thứ khác:
  ```ts
  /*
   * BẢN CHÍNH: mọi đường /demo đều tắt, TRỪ hai đường mà đăng nhập thật cần:
   *   GET    /demo/session  — biết đã đăng nhập chưa, và ngày nghiệp vụ (`demoDate` = ngày thật ở bản chính)
   *   DELETE /demo/session  — đăng xuất
   * POST /demo/session là "Vào nhanh": đăng nhập bằng id KHÔNG cần mật khẩu — trên mạng là cửa sau, phải 404.
   */
  api.use('/demo', (req, res, next) => {
    if (!laBanChinh()) return next();
    const choQua = req.path === '/session' && (req.method === 'GET' || req.method === 'DELETE');
    if (choQua) return next();
    res.status(404).json({ error: 'Không tìm thấy endpoint.' });
  });
  ```
  Đặt middleware này **trước** dòng `api.get('/demo/accounts', ...)` (hiện ~dòng 68 `routes/index.ts`).
  `GET /auth/info` (~dòng 1581): khi `laBanChinh()` thì **không** trả khoá `demoAdmin`:
  ```ts
  api.get('/auth/info', wrap(() => ({
    emailSuffix: accountSvc.EMAIL_SUFFIX,
    /* Bản chính: không bao giờ gửi mật khẩu mặc định ra ngoài. */
    ...(laBanChinh() ? {} : { demoAdmin: { email: accountSvc.DEFAULT_ADMIN_EMAIL, password: accountSvc.DEFAULT_ADMIN_PASSWORD } }),
    skills: [...new Set([...ENTRY_SKILLS, ...REGULAR_SKILLS])],
  })));
  ```
  Kiểu `AuthInfo` ở web: `demoAdmin` thành **tuỳ chọn** (`demoAdmin?: {...}`).
  Cookie phiên (hai chỗ `res.cookie(SESSION_COOKIE, ...)`): thêm `secure: laBanChinh()`.
  Nhanh hơn trên Turso (mỗi câu hỏi DB là một lượt mạng): `scenarioMode()` trả `'normal'` **trước khi** đọc DB khi
  `laBanChinh()` — đã nằm trong Step 3 ở trên, kiểm lại nó đứng **dòng đầu** hàm.
- [x] **Step 4: Giao diện.** `web/src/lib/banChinh.ts`:
  ```ts
  /** Bản chính (Netlify) — đặt bởi netlify.toml. Máy dev và bản build thử không có biến này. */
  export const LA_BAN_CHINH = import.meta.env.VITE_BAN_CHINH === '1';
  ```
  `App.tsx`: `{!LA_BAN_CHINH && <DemoBar />}`. `WelcomePage.tsx`: khi `LA_BAN_CHINH` thì **không** render tab
  "Vào nhanh bằng tài khoản demo" và **không** gọi `useApi('/demo/accounts')` (truyền `null`), không hiện dòng gợi ý mật
  khẩu mặc định `pisa2026` nếu có. Route `/dev/thanh-phan` đã tự tắt ở bản build (`import.meta.env.DEV`) — giữ nguyên.
  🆕 22/09 — đủ các chỗ phải đổi ở `web/src/modules/platform/WelcomePage.tsx` (đã đọc mã thật):
  - `const accounts = useApi<Account[]>(LA_BAN_CHINH ? null : '/demo/accounts');` — đã kiểm: với `null` thì `noData`
    là `false`, nên khối hướng dẫn `npm run seed` (~dòng 50) **không** hiện và form đăng nhập **không** bị che.
    Nếu `useApi` không nhận `null` thì xem cách các màn khác bỏ qua gọi API, làm theo, ghi Nhật ký.
  - Dòng phụ đề `bản demo chạy local` (~dòng 101) → khi `LA_BAN_CHINH` hiện `Hệ thống quản lý học vụ và vận hành`.
  - Nhãn `Dữ liệu demo` (~dòng 103) → **không** hiện khi `LA_BAN_CHINH`.
  - Khối `SectionNote` mật khẩu mặc định (~dòng 177–184): điều kiện `{info && ...}` → `{info?.demoAdmin && ...}`
    (máy chủ bản chính không gửi `demoAdmin` nên tự ẩn; giữ nguyên chữ).
  - Tab/nút chọn chế độ `demo` trong `mode` state: không hiện khi `LA_BAN_CHINH`.
  Kiểm cuối Step 5 thêm: `grep -rl "pisa2026\|bản demo chạy local" dist/web` → **rỗng** (mật khẩu chỉ nằm ở máy chủ).
- [x] **Step 5:** `npm run check` xanh. `$env:VITE_BAN_CHINH="1"; npm run build` rồi
      `grep -rl "Vào nhanh bằng tài khoản demo" dist/web` → **rỗng**. Commit: `PR-Z2 (6): bản chính tắt mọi thứ của demo`.

---

### Task 6b 🛑 GATE: Gói chạy được trên Linux + deploy nháp thật  *(cuối Phần A)*

**Vì sao:** chủ sản phẩm deploy **thủ công từ máy Windows**. `libsql` có phần nhị phân riêng cho từng hệ điều hành; build
trên Windows mà không làm gì thì gói gửi lên chỉ có bản Windows → Function chết trên Netlify. Task này chứng minh
**toàn bộ hạ tầng** (Linux + Turso qua Netlify + Blobs + tắt demo) chạy thật **trước** khi đụng tới dữ liệu bản chính,
và cho **số đo tốc độ thật** (Netlify ↔ Turso cùng vùng), thay cho số đo từ máy ở Việt Nam ở Task 3.

**Files:** Modify `package.json`, `package-lock.json`, `netlify.toml`.

- [x] **Step 1: Gói nhị phân Linux.**
      🆕 22/09 — **lệnh cũ bên dưới KHÔNG làm được trên máy này** (npm 11 lặng lẽ bỏ qua gói tuỳ chọn khác hệ điều hành
      kể cả với `--force`; `--os=linux` thì xoá mất bản Windows). **Cách mới (chủ sản phẩm chốt 22/09):**
      `scripts/goi-libsql-linux.mjs` — `npm pack` đúng `@libsql/linux-x64-gnu` cùng số bản với `libsql`, so `integrity`
      với `package-lock.json` (lệch hoặc thiếu mục → thoát mã khác 0, không chép gì), giải nén vào
      `node_modules/@libsql/linux-x64-gnu/`; đã có thì bỏ qua. Script là bước đầu của `"build"` trong `package.json`, nên
      `netlify deploy --build` tự chạy nó (lần build đầu cần mạng). Cửa Step 3 giữ nguyên.
      Lệnh cũ (giữ để thấy lý do): Xem phiên bản cần:
      `node -p "require('./node_modules/libsql/package.json').optionalDependencies"`.
      Cài đúng phiên bản của mục `@libsql/linux-x64-gnu`:
      `npm install --save-optional --force @libsql/linux-x64-gnu@<phiên bản đó>` (`--force` vì máy Windows không phải Linux).
      Kiểm `node_modules/@libsql/linux-x64-gnu/` có file `.node`.
- [x] **Step 2:** `netlify.toml` → `external_node_modules = ["libsql", "@libsql/linux-x64-gnu"]`.
- [x] **Step 3: Kiểm gói trước khi gửi.** `netlify build` rồi liệt kê gói Function:
      `tar -tf .netlify/functions/api.zip | findstr linux-x64-gnu` (PowerShell) — **phải** có dòng. Không có → 🛑 dừng,
      ghi Nhật ký, không thử đường khác.
- [x] **Step 4 🆕 22/09: Kiểm — KHÔNG hỏi lại.** Chủ sản phẩm đã làm `TRIEN_KHAI.md` mục 3-4-5 với database thử (22/09).
      Chạy `netlify env:list` → phải thấy đủ `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BAN_CHINH`; và
      `netlify env:get TURSO_DATABASE_URL` chứa `pisa-thu-nghiem`. Thiếu biến hoặc URL không phải database thử → 🛑 dừng,
      báo chủ sản phẩm đúng biến nào thiếu/sai và mục nào của `TRIEN_KHAI.md` cần làm lại.
- [x] **Step 5: Deploy nháp.** Trong thư mục repo: `netlify deploy --build` (**không** có `--prod`). Ghi địa chỉ nháp
      (dạng `https://<mã>--<tên-site>.netlify.app`) vào Nhật ký.
- [x] **Step 6: Kiểm trên địa chỉ nháp**, ghi từng dòng vào Nhật ký:
  1. `<địa chỉ nháp>/api/health` → `{"ok":true,...}` (Function chạy trên Linux, nối được Turso).
  2. Màn đăng nhập **không** có tab "Vào nhanh", **không** có thanh demo.
  3. Đăng nhập bằng một tài khoản của bộ demo đã dựng lên database thử ở Task 3 Step 4 (email và mật khẩu demo trong
     `README.md`).
  4. Mở hồ sơ một học viên, tải lên một ảnh ~1 MB, tải xuống lại — mở được (Blobs chạy).
  5. Mở một link sâu `<địa chỉ nháp>/hoc-vien/<id>` bằng tab mới — ra đúng trang, không 404.
  6. 🆕 22/09 — Cửa sau đã đóng: trong PowerShell
     `Invoke-WebRequest -Method Post -Uri "<địa chỉ nháp>/api/demo/session" -ContentType "application/json" -Body '{"userId":1}' -SkipHttpErrorCheck`
     (PowerShell 5.1 không có `-SkipHttpErrorCheck`: bọc `try { ... } catch { $_.Exception.Response.StatusCode }`) → **404**.
  7. 🆕 22/09 — Tải lên và tải xuống lại một tệp **PDF** và một tệp **mp3 hoặc mp4** nhỏ → mở được, dung lượng khớp
     (kiểm danh sách `binary` của Task 5).
  8. 🆕 22/09 — Tab Network, mở câu trả lời của `/api/students` (hoặc lời gọi lớn nhất của hồ sơ học viên): Ctrl+F
     `_metadata` → **không có**.
- [x] **Step 7: Đo tốc độ thật** — năm trang như Task 3 Step 5, mỗi trang 3 lần **sau** lần tải đầu, ghi trung bình và
      thời gian lần đầu (khởi động lạnh). Ghi bảng vào Nhật ký.
      🆕 22/09 — đo thêm hai trang mà rà soát PR-K chỉ ra có nhiều câu hỏi DB mỗi thẻ (mỗi case thêm ~4 câu qua
      `sosCaseState`; `myCoordinationLines` tính lại cả lớp cho từng lớp chủ nhiệm): **bảng kỹ năng (SkillBoard) của lớp
      MB-FT 101** và **trang Việc cần làm của một GVCN**. Chỉ đo và ghi — **không** tối ưu ở PR này (Task 10 Step 6 của
      Phần C xử lý theo số đo).
- [x] **Step 8: Quyết định:**

  | Kết quả | Làm gì |
  |---|---|
  | Step 6 đủ 8 dòng đạt, mọi trang ≤ 3 giây | ✅ Kết thúc Phần A |
  | Step 6 đạt, có trang 3–10 giây | ✅ Kết thúc Phần A, ghi các trang đó — Phần C xử lý (Task 10 Step 6) |
  | Có trang > 10 giây, **hoặc** Step 6 có dòng hỏng | 🛑 Dừng. Báo chủ sản phẩm + session thiết kế kèm Nhật ký |

- [x] **Step 9:** Commit `PR-Z2 (6b): đóng gói nhị phân Linux cho libsql`. Kết thúc Phần A (xem mục "Ba phần").

---

### Task 6c 🆕 22/09: Siết chốt seed theo địa chỉ ĐẦY ĐỦ + tên database thật  *(đầu Phần B — làm trước Task 7)*

**Vì sao:** chủ sản phẩm đặt tên thật (22/09): database **thử** = `pisatracking-demo`, database **bản chính** =
`pisatracking`. Tên bản chính **nằm trọn trong** tên bản thử. Chốt của Task 2 Step 6 cho seed chạy khi
`DB_PATH.includes(PISA_CHO_PHEP_SEED_TURSO)` → ai đặt biến là `pisatracking` thì khớp **cả hai** → `npm run seed`
(xoá sạch rồi dựng demo) chạy được vào **bản chính**. Phải so **nguyên tên máy chủ** của URL, không so "có chứa".

**Files:** Modify `server/src/seed/run.ts`, `server/src/moiTruong.ts`, `server/src/tests/banChinh.tests.ts`,
`TRIEN_KHAI.md`, file kế hoạch này (các chỗ còn ghi `pisa-thu-nghiem` / `pisa-ban-chinh` trong Phần B, C).

**Interfaces:** Produces `tenMayChuDb(url: string): string` (trong `moiTruong.ts`) — trả hostname viết thường,
ví dụ `libsql://pisatracking-demo-abc.turso.io` → `pisatracking-demo-abc.turso.io`; URL hỏng → `''`.
Produces `choPhepSeedTurso(url: string, choPhep: string | undefined): boolean`.

- [x] **Step 1: Phép kiểm đỏ** — thêm vào `banChinh.tests.ts`:
  ```ts
  console.log('\nPR-Z2 · 1b. Chốt seed so NGUYÊN tên máy chủ (tên bản chính nằm trong tên bản thử)');
  const { choPhepSeedTurso } = await import('../moiTruong.ts');
  const THU = 'libsql://pisatracking-demo-abc.turso.io';
  const CHINH = 'libsql://pisatracking-abc.turso.io';
  check('PR-Z2 · Seed được vào DB thử khi biến cho phép là NGUYÊN tên máy chủ của nó', () => {
    assert(choPhepSeedTurso(THU, 'pisatracking-demo-abc.turso.io') === true, 'phải cho phép');
  });
  check('PR-Z2 · Biến cho phép là một PHẦN tên ("pisatracking") → KHÔNG khớp DB nào, kể cả bản chính', () => {
    assert(choPhepSeedTurso(CHINH, 'pisatracking') === false, 'bản chính không được seed');
    assert(choPhepSeedTurso(THU, 'pisatracking') === false, 'một phần tên không đủ');
  });
  check('PR-Z2 · Biến cho phép là tên DB thử nhưng URL là bản chính → từ chối', () => {
    assert(choPhepSeedTurso(CHINH, 'pisatracking-demo-abc.turso.io') === false, 'phải từ chối');
  });
  check('PR-Z2 · Không có biến cho phép → từ chối', () => {
    assert(choPhepSeedTurso(THU, undefined) === false && choPhepSeedTurso(THU, '') === false, 'phải từ chối');
  });
  ```
- [x] **Step 2:** `npm test` → bốn phép **đỏ**. Ghi Nhật ký.
- [x] **Step 3:** Trong `server/src/moiTruong.ts`:
  ```ts
  /** Tên máy chủ của URL database (viết thường). Dùng để so NGUYÊN tên, không so "có chứa". */
  export function tenMayChuDb(url: string): string {
    try { return new URL(url.replace(/^libsql:/, 'https:')).hostname.toLowerCase(); } catch { return ''; }
  }

  /**
   * Cho `npm run seed` (XOÁ SẠCH rồi dựng demo) chạy vào Turso? Chỉ khi biến cho phép là NGUYÊN tên máy chủ của
   * database đang trỏ tới. Lý do (22/09): tên bản chính `pisatracking` nằm trọn trong tên bản thử
   * `pisatracking-demo`, nên so "có chứa" sẽ để lọt bản chính.
   */
  export function choPhepSeedTurso(url: string, choPhep: string | undefined): boolean {
    const ten = tenMayChuDb(url);
    return !!ten && !!choPhep && ten === choPhep.trim().toLowerCase();
  }
  ```
- [x] **Step 4 (🆕 22/09 sau rà soát Opus — thay chữ cũ):** PR-Z2a **đã** dời chốt xoá sạch vào `recreateSchema()`
      (hàm `tuChoiXoaSachNeuTuXa` trong `server/src/db.ts`, ~dòng 115) và đã so **nguyên tên máy chủ**; `seed/run.ts`
      **không còn** `DB_PATH.includes(...)`. Vậy Step 4 là:
      1. `tuChoiXoaSachNeuTuXa` gọi `choPhepSeedTurso(DB_PATH, process.env.PISA_CHO_PHEP_SEED_TURSO)` thay cho phép so
         hiện có (giữ nguyên điều kiện `!laBanChinh()` đang có). **Không** thêm một phép kiểm thứ hai, khác kiểu, ở
         `seed/run.ts` — một chốt, một nơi.
      2. **Chặn cứng tên bản chính**, đặt trong `choPhepSeedTurso` **trước** phép so: tên máy chủ (viết thường) bắt đầu
         bằng `pisatracking-` mà **không** bắt đầu bằng `pisatracking-demo-` → luôn `false`, bất kể biến cho phép. Lý do:
         nếu ai dán nhầm tên máy chủ bản chính vào `PISA_CHO_PHEP_SEED_TURSO` thì vẫn không xoá được bản chính.
         Thêm phép kiểm: `choPhepSeedTurso(CHINH, 'pisatracking-abc.turso.io') === false`.
      3. Thông báo TỪ CHỐI thêm dòng: `Muốn seed database THỬ: đặt PISA_CHO_PHEP_SEED_TURSO bằng NGUYÊN tên máy chủ,
         ví dụ pisatracking-demo-xxx.turso.io`.
      Phép kiểm tiến trình con của Task 2 Step 6 và phép "chạy bộ kiểm trong cửa sổ có biến Turso" của PR-Z2a phải
      vẫn xanh.
- [x] **Step 5: Tên thật trong tài liệu.** `TRIEN_KHAI.md` mục 2 và bảng tra mục 12: `pisa-thu-nghiem` → `pisatracking-demo`,
      `pisa-ban-chinh` → `pisatracking` (cả ví dụ URL). Thêm một câu cảnh báo ở mục 2: *"Hai tên gần giống nhau —
      khi dán URL, nhìn kỹ có chữ `-demo` hay không."* Trong file kế hoạch này, Phần B và C: đổi mọi `pisa-ban-chinh` →
      `pisatracking`, `pisa-thu-nghiem` → `pisatracking-demo`. Chốt kiểm ở Task 10 Step 1 ("URL phải là bản chính")
      đổi thành: `tenMayChuDb(URL)` **bắt đầu bằng `pisatracking-`** và **không** bắt đầu bằng `pisatracking-demo`.
- [x] **Step 6:** `npm run check` xanh (N + 5). Commit: `PR-Z2 (6c): chốt seed so nguyên tên máy chủ; tên database thật`.

---

### Task 6d 🆕 22/09: `npm run migrate` an toàn khi trỏ tới Turso

**Vì sao (rà soát Opus 22/09, Important 2):** `server/src/migrate.ts` (~dòng 1210–1235) chạy được vào Turso mà không có
chốt nào, và trên database chưa có quản trị mặc định thì **tạo tài khoản `admin` với mật khẩu ai cũng biết `pisa2026`**,
đồng thời **gán mật khẩu mặc định cho mọi người dùng chưa có mật khẩu**. Trên bản chính đó là một cửa sau. Nhưng sau
deploy vẫn phải nâng cấp schema bản chính bằng `migrate` — nên **không** chặn hẳn, mà bắt xác nhận + bỏ phần demo.

**Files:** Modify `server/src/migrate.ts`, `server/src/migrate/run.ts`, `server/src/moiTruong.ts`,
`server/src/tests/banChinh.tests.ts`, `TRIEN_KHAI.md` (mục 11 "Khi có sự cố" — thêm cách nâng cấp).

**Interfaces:** Consumes `laDbTuXa()`, `tenMayChuDb()` (Task 6c). Produces `choPhepMigrateTurso(url, choPhep): boolean`
— cùng luật "nguyên tên máy chủ" như seed, **không** có chặn tên bản chính (migrate phải chạy được trên bản chính).

- [x] **Step 1: Phép kiểm đỏ** (`banChinh.tests.ts`, khuôn thuần + một phép chạy tiến trình con như Task 2 Step 6):
  1. `choPhepMigrateTurso('libsql://pisatracking-abc.turso.io', 'pisatracking-abc.turso.io') === true`;
     với `'pisatracking'` → `false`; không biến → `false`.
  2. Tiến trình con `node dist-server/server/src/migrate/run.js` với `TURSO_DATABASE_URL=libsql://khong-ton-tai.turso.io`,
     `TURSO_AUTH_TOKEN=x`, **không** có `PISA_CHO_PHEP_MIGRATE_TURSO` → mã thoát khác 0, stderr có `TỪ CHỐI`, và
     **không** có dòng nào cho thấy đã kết nối.
  3. Hàm tạo quản trị mặc định / gán mật khẩu mặc định (tìm đúng tên hàm ở `migrate.ts` ~1210–1235): gọi trên một
     database `:memory:` khi `laDbTuXa()` được giả là `true` (hoặc truyền cờ vào hàm — chọn cách ít đụng nhất, ghi Nhật
     ký) → **không** tạo `admin`, **không** gán `pisa2026` cho ai; trên file cục bộ → hành vi cũ giữ nguyên.
- [x] **Step 2:** `npm test` → đỏ. Ghi Nhật ký.
- [x] **Step 3:** `migrate/run.ts`: đầu tệp, khi `laDbTuXa()` mà `!choPhepMigrateTurso(DB_PATH, process.env.PISA_CHO_PHEP_MIGRATE_TURSO)`
      → in `[migrate] TỪ CHỐI: đang trỏ tới Turso. Muốn nâng cấp database này: SAO LƯU trước (npm run sao-luu), rồi đặt
      PISA_CHO_PHEP_MIGRATE_TURSO bằng NGUYÊN tên máy chủ của nó.` và `process.exit(1)`.
- [x] **Step 4:** `migrate.ts`: khi `laDbTuXa()` → **bỏ qua** tạo quản trị mặc định và gán mật khẩu mặc định, in một dòng
      `[migrate] Turso: bỏ qua tài khoản/mật khẩu mặc định của bản demo.` Không đổi phần nâng cấp schema.
- [x] **Step 5:** `TRIEN_KHAI.md` mục 11: thêm mục nhỏ "Nâng cấp database bản chính khi có bản mới cần" — ba lệnh PowerShell
      (sao lưu → đặt biến xác nhận → `npm run migrate`), nói rõ **chỉ làm khi session code yêu cầu**.
- [x] **Step 6:** `npm run check` xanh. Commit: `PR-Z2 (6d): migrate vào Turso cần xác nhận, bỏ tài khoản mặc định`.

---

### Task 6e 🆕 22/09: Bản nháp KHÔNG BAO GIỜ chạm dữ liệu thật

**Vì sao (rà soát Opus 22/09, Important 5 — session planning đã quyết):** hiện ba biến Turso đặt cho **mọi** loại deploy,
và kho tệp `getStore('bang-chung')` dùng chung cả site. Sau Task 10, mọi `netlify deploy --build` (bản nháp, từ bất kỳ
nhánh hay thư mục đang sửa dở) sẽ chạy mã chưa kiểm **trên dữ liệu thật**. Quyết định: **bản chính thức (production) →
database `pisatracking`; mọi bản nháp → database thử `pisatracking-demo`**; kho tệp đi theo database.

**Files:** Modify `server/src/platform/khoTep.ts`, `server/src/yThuc/measures.ts`, `server/src/ops/thuTurso.ts`,
`server/src/db.ts`, `server/src/tests/banChinh.tests.ts`, `TRIEN_KHAI.md` (mục 5, 6, 8), `server/src/ops/saoLuu.ts` nếu Task 8
đã tạo (nếu chưa: ghi chú cho Task 8 dùng cùng tên kho).

**Interfaces:** Produces `tenKhoTep(): string` trong `khoTep.ts` — `'bang-chung-' + <phần đầu tên máy chủ database>`,
ví dụ `bang-chung-pisatracking-demo-pizi147`; không có Turso (máy dev) → `'bang-chung-cuc-bo'`. Task 8 (sao lưu tệp) dùng
đúng hàm này.

- [x] **Step 1: Phép kiểm đỏ:**
  - `tenKhoTep()` với `TURSO_DATABASE_URL=libsql://pisatracking-demo-pizi147.aws-us-east-2.turso.io` → `bang-chung-pisatracking-demo-pizi147`;
    với `libsql://pisatracking-pizi147.aws-us-east-2.turso.io` → `bang-chung-pisatracking-pizi147`; **hai tên khác nhau**.
    (Đặt/xoá biến môi trường trong `try/finally`; nếu `DB_PATH` được tính một lần lúc nạp module thì cho `tenKhoTep`
    nhận `url` làm tham số tuỳ chọn để kiểm — ghi Nhật ký.)
  - `deleteMeasure` (xoá biện pháp Đang chuẩn bị có tệp) bằng kho giả ghi lại thứ tự gọi: lệnh xoá tệp chỉ xảy ra **sau**
    khi giao dịch đã chốt (ví dụ kho giả kiểm `db().inTransaction === false` lúc bị gọi `xoa`).
- [x] **Step 2:** `npm test` → đỏ.
- [x] **Step 3:** `khoTep.ts`: `khoTepNetlify()` dùng `getStore(tenKhoTep())` thay `'bang-chung'` (cả ghi, đọc, xoá).
      **Chưa có dữ liệu thật nên đổi tên kho không mất gì** — tệp thử trên kho cũ `bang-chung` bỏ lại, vô hại.
- [x] **Step 4 (Important 6):** `server/src/yThuc/measures.ts` ~365: `deleteMeasure` truyền mảng `khoaTep` vào
      `purgeAttachmentsOf(...)` rồi gọi `xoaTepSauGiaoDich(khoaTep)` **sau** `tx(...)` — đúng mẫu đã làm ở `violations.ts`.
- [x] **Step 5 (Minor):** `server/src/ops/thuTurso.ts`: từ chối chạy khi `laBanChinh()` hoặc khi tên máy chủ bắt đầu
      bằng `pisatracking-` mà không bắt đầu bằng `pisatracking-demo-` (script tạo/xoá bảng `_thu*`). `server/src/db.ts`
      ~155: nếu `ROLLBACK TO` ném lỗi thì vẫn ném **lỗi gốc** (bọc `try { ROLLBACK TO; RELEASE } catch { /* giữ lỗi gốc */ }`).
- [x] **Step 6: Biến môi trường theo loại deploy — viết lại `TRIEN_KHAI.md` mục 5, 6, 8** (hợp đồng với chủ sản phẩm,
      viết cho người không biết code, mỗi lệnh một khối PowerShell):
  - Mục 5 (đã làm với database thử — **không** bắt làm lại): thêm một câu "các biến này hiện áp cho mọi loại deploy; mục 6
    sẽ tách riêng cho bản chính thức."
  - Mục 6 viết lại: đặt database **bản chính** **chỉ cho bản chính thức**:
    ```powershell
    netlify env:set TURSO_DATABASE_URL "<URL database CHÍNH>" --context production
    netlify env:set TURSO_AUTH_TOKEN "<Token database CHÍNH>" --context production
    ```
    rồi kiểm (chỉ in URL, **không** in token):
    ```powershell
    netlify env:get TURSO_DATABASE_URL --context production
    netlify env:get TURSO_DATABASE_URL --context deploy-preview
    ```
    Dòng đầu phải là `pisatracking-<...>` (không có `-demo`), dòng sau phải là `pisatracking-demo-<...>`. Sai → dừng, báo
    session. **Session thực thi Task 6e phải tự thử hai lệnh `env:set --context production` + hai lệnh `env:get` này
    bằng một biến vô hại** (ví dụ `PISA_THU_NGU_CANH`, rồi `netlify env:unset PISA_THU_NGU_CANH`) để chắc cú pháp đúng với
    bản Netlify CLI đang cài — **không** đụng hai biến Turso thật; cú pháp khác thì sửa `TRIEN_KHAI.md` theo cú pháp đúng.
  - Mục 8: bỏ câu "bản nháp dùng database bản chính"; thay bằng "bản nháp luôn dùng database **thử** — thoải mái bấm
    thử; chỉ bản chính thức (`--prod`) mới có dữ liệu thật".
  - Bảng tra mục 12: thêm cột "Áp cho" (mọi deploy / chỉ bản chính thức).
- [x] **Step 7:** `npm run check` xanh. Commit: `PR-Z2 (6e): bản nháp dùng database thử, kho tệp theo database, xoá tệp sau giao dịch`.

---

### Task 7: Dữ liệu nền dùng chung + `init-ban-chinh` + `them-chi-nhanh`

**Vì sao cần:** hệ thống **không có màn nào tạo chi nhánh** — chi nhánh chỉ được tạo trong `seed.ts`. Database rỗng
không có chi nhánh thì không tạo được lớp. Nên lệnh khởi tạo nhận danh sách chi nhánh qua biến `CHI_NHANH`.

**Files:** Create `server/src/seed/duLieuNen.ts`, `server/src/ops/initBanChinh.ts`, `server/src/ops/runInit.ts`,
`server/src/ops/themChiNhanh.ts`; Modify `server/src/seed/seed.ts`, `server/src/platform/accounts.ts` (export
`hashPassword`), `package.json`; Test `banChinh.tests.ts`.

**Interfaces:**
- Produces: `napDuLieuNen(conn, now: string): { roleId: Map<string, number>; permId: Map<string, number> }` — quyền,
  vai trò (kể cả vai `retired`), lộ trình (`seedRoutes`), chương trình + kỹ năng + mốc. **Không** tạo chi nhánh,
  người dùng, lớp, học viên, cấu hình demo.
- Produces: `docDanhSachChiNhanh(s: string): { code: string; name: string }[]` — định dạng `MB=Monbay;BC=Bãi Cháy`.
- Produces: `initBanChinh(conn, o: { adminEmail: string; adminPassword: string; chiNhanh: {code; name}[]; now: string; schemaSql: string }): { userId: number; branchIds: number[] }`.
- Produces: `themChiNhanh(conn, cn: { code; name }, now: string): number`.

- [x] **Step 1: Tách dữ liệu nền.** Tạo `server/src/seed/duLieuNen.ts` bằng cách **chuyển nguyên văn** (cắt–dán, không
      viết lại) các khối trong `runSeed()`: "vai trò & quyền" (kể cả `RETIRED_ROLES`), `seedRoutes(conn)`, "chương trình
      học". `runSeed()` gọi `const { roleId, permId } = napDuLieuNen(conn, NOW);` tại đúng vị trí cũ. Khối "tổ chức"
      (chi nhánh, reporting_units) **ở lại** `seed.ts`.
- [x] **Step 2:** `npm run check` → **phải xanh, không đổi số phép** (đây là bước chuyển chỗ thuần tuý; phép kiểm đếm
      vai trò/quyền của bộ demo sẽ bắt nếu chuyển thiếu). Commit riêng: `PR-Z2 (7a): tách dữ liệu nền dùng chung`.
- [x] **Step 3: Phép kiểm đỏ** (thêm vào `banChinh.tests.ts`) — chạy trên **file tạm riêng**, không đụng DB demo:
  ```ts
  console.log('\nPR-Z2 · 4. Khởi tạo bản chính');
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const { default: Database } = await import('libsql');
  const { initBanChinh, docDanhSachChiNhanh } = await import('../ops/initBanChinh.ts');
  const { SCHEMA_PATH } = await import('../db.ts');
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const moDbTam = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z2-init-'));
    return { conn: new Database(path.join(dir, 'x.sqlite')), dir };
  };

  check('PR-Z2 · docDanhSachChiNhanh đọc "MB=Monbay;BC=Bãi Cháy", từ chối chuỗi rỗng và mã trùng', () => {
    const ds = docDanhSachChiNhanh('MB=Monbay; BC=Bãi Cháy');
    assert(ds.length === 2 && ds[1].code === 'BC' && ds[1].name === 'Bãi Cháy', JSON.stringify(ds));
    assertThrows(() => docDanhSachChiNhanh(''), /CHI_NHANH/, 'Rỗng phải báo lỗi');
    assertThrows(() => docDanhSachChiNhanh('MB=A;MB=B'), /trùng/, 'Mã trùng phải báo lỗi');
  });

  check('PR-Z2 · init-ban-chinh trên DB rỗng: đúng MỘT tài khoản (quản trị), đủ chi nhánh, đủ vai trò, KHÔNG có dữ liệu demo', () => {
    const { conn, dir } = moDbTam();
    try {
      const r = initBanChinh(conn, { adminEmail: 'quantri.pisa@gmail.com', adminPassword: 'MatKhauManh2026',
        chiNhanh: [{ code: 'MB', name: 'Monbay' }], now: '2026-09-21T00:00:00Z', schemaSql });
      const dem = (b: string) => (conn.prepare(`SELECT COUNT(*) n FROM ${b}`).get() as any).n;
      assert(dem('users') === 1 && dem('branches') === 1, `users=${dem('users')} branches=${dem('branches')}`);
      assert(dem('students') === 0 && dem('classes') === 0 && dem('violations') === 0, 'Không được có dữ liệu demo');
      assert(dem('roles') > 0 && dem('permissions') > 0 && dem('programmes') > 0, 'Thiếu dữ liệu nền');
      const vai = conn.prepare(`SELECT r.key FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`).all(r.userId) as any[];
      assert(vai.length === 1 && vai[0].key === 'system_admin', JSON.stringify(vai));
      const ngayDemo = conn.prepare(`SELECT value FROM demo_config WHERE key = 'demo_date'`).get() as any;
      assert(!ngayDemo || !ngayDemo.value, 'Bản chính KHÔNG được đặt ngày demo');
    } finally { conn.close(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows */ } }
  });

  check('PR-Z2 · init-ban-chinh TỪ CHỐI khi DB đã có dữ liệu — không bao giờ ghi đè dữ liệu thật', () => {
    const { conn, dir } = moDbTam();
    try {
      const o = { adminEmail: 'quantri.pisa@gmail.com', adminPassword: 'MatKhauManh2026',
        chiNhanh: [{ code: 'MB', name: 'Monbay' }], now: '2026-09-21T00:00:00Z', schemaSql };
      initBanChinh(conn, o);
      assertThrows(() => initBanChinh(conn, o), /đã có dữ liệu/, 'Chạy lần hai phải bị từ chối');
      assert((conn.prepare('SELECT COUNT(*) n FROM users').get() as any).n === 1, 'Lần hai không được thêm người dùng');
    } finally { conn.close(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows */ } }
  });

  check('PR-Z2 · init-ban-chinh từ chối mật khẩu yếu và email sai đuôi (dùng đúng luật của accounts.ts)', () => {
    const { conn, dir } = moDbTam();
    try {
      const co = { chiNhanh: [{ code: 'MB', name: 'Monbay' }], now: '2026-09-21T00:00:00Z', schemaSql };
      assertThrows(() => initBanChinh(conn, { ...co, adminEmail: 'quantri.pisa@gmail.com', adminPassword: '123' }), /.+/, 'Mật khẩu yếu');
      assertThrows(() => initBanChinh(conn, { ...co, adminEmail: 'quantri@gmail.com', adminPassword: 'MatKhauManh2026' }), /.+/, 'Email sai đuôi');
    } finally { conn.close(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows */ } }
  });
  ```
  Nếu `demo_config` không có cột `key`/`value` như trên → đọc `schema.sql` và sửa **phép kiểm** cho khớp tên cột thật
  (không sửa schema). Ghi vào Nhật ký.
- [x] **Step 4:** `npm test` → đỏ.
- [x] **Step 5: Viết `server/src/ops/initBanChinh.ts`.** Bắt buộc theo thứ tự:
  1. **Kiểm rỗng trước khi làm bất cứ gì:** nếu có bảng `users` và `SELECT COUNT(*) FROM users` > 0, **hoặc** có bất kỳ
     bảng nào khác ngoài `sqlite_%` đang có dòng → `throw new Error('Database đã có dữ liệu — init-ban-chinh chỉ chạy trên database rỗng. Không làm gì cả.')`.
  2. `checkEmail(adminEmail)` và `checkPassword(adminPassword)` từ `accounts.ts` (dùng đúng luật hiện có).
  3. Trong **một** giao dịch: `conn.exec(schemaSql)` (chỉ khi chưa có bảng) → `napDuLieuNen(conn, now)` → với mỗi chi
     nhánh: INSERT `branches` + `reporting_units` (`kind='branch'`, cùng cột như `seed.ts`) → một `reporting_units`
     `TUTOR` / `Tutor part-time` / `kind='department'` (như `seed.ts`) → INSERT `users` (mã `NV001`, `approval_state
     'approved'`, `status 'active'`, mật khẩu băm bằng `hashPassword` đã export) → `user_roles` vai `system_admin`, `branch_id NULL`.
  4. **Không** gọi `setConfig('demo_date', ...)` hay bất kỳ cấu hình demo nào.
  `docDanhSachChiNhanh`: tách theo `;`, mỗi phần `MA=Tên`, `trim`, mã viết hoa, không cho rỗng, không cho mã trùng
  (thông báo có chữ `trùng`); chuỗi rỗng → lỗi có chữ `CHI_NHANH`.
  `themChiNhanh`: kiểm mã chưa tồn tại, INSERT `branches` + `reporting_units` giống bước 3.
- [x] **Step 6: Điểm chạy.** `server/src/ops/runInit.ts`: bắt buộc có `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
      `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CHI_NHANH` (thiếu cái nào → in tên cái thiếu, thoát mã 1); in
      `Sẽ khởi tạo database <URL> (không in token) với các chi nhánh: ...`; gọi `initBanChinh(db(), {..., schemaSql:
      fs.readFileSync(SCHEMA_PATH,'utf8'), now: new Date().toISOString()})`; in kết quả. `themChiNhanh.ts`: đọc hai tham số
      dòng lệnh `MA "Tên"`. `package.json`:
      `"init-ban-chinh": "npm run build:server && node dist-server/server/src/ops/runInit.js"`,
      `"them-chi-nhanh": "npm run build:server && node dist-server/server/src/ops/themChiNhanh.js"`.
- [x] **Step 7:** `npm run check` xanh. Commit: `PR-Z2 (7b): init-ban-chinh và them-chi-nhanh`.

---

### Task 8: `npm run sao-luu`

**Files:** Create `server/src/ops/saoLuu.ts`, `server/src/ops/runSaoLuu.ts`; Modify `package.json`; Test `banChinh.tests.ts`.

**Interfaces:**
- Produces: `saoLuu(nguon, dich): { bang: number; dong: number }` — chép **mọi** bảng (cấu trúc + dữ liệu) của `nguon`
  sang kết nối `dich` đang rỗng.
- Produces: `giuBanMoiNhat(thuMuc: string, soBan: number): string[]` — xoá bản cũ, trả danh sách đã xoá.

- [ ] **Step 1: Phép kiểm đỏ:**
  ```ts
  console.log('\nPR-Z2 · 5. Sao lưu');
  const { saoLuu, giuBanMoiNhat } = await import('../ops/saoLuu.ts');
  const { db: dbDemo } = await import('../db.ts');
  check('PR-Z2 · Sao lưu DB demo ra file mới: mọi bảng cùng số dòng; file mở lại được bằng chính mã hiện tại', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z2-bk-'));
    const dich = new Database(path.join(dir, 'bk.sqlite'));
    try {
      const r = saoLuu(dbDemo(), dich);
      const bang = (dbDemo().prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all() as any[]).map((x) => x.name);
      assert(r.bang === bang.length, `Chép ${r.bang}/${bang.length} bảng`);
      for (const b of bang) {
        const a = (dbDemo().prepare(`SELECT COUNT(*) n FROM "${b}"`).get() as any).n;
        const c = (dich.prepare(`SELECT COUNT(*) n FROM "${b}"`).get() as any).n;
        assert(a === c, `Bảng ${b}: nguồn ${a} dòng, bản sao ${c} dòng`);
      }
    } finally { dich.close(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows */ } }
  });
  check('PR-Z2 · Giữ đúng 14 bản mới nhất, xoá bản cũ hơn', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z2-keep-'));
    try {
      for (let i = 1; i <= 16; i++) fs.writeFileSync(path.join(dir, `pisa-2026-09-${String(i).padStart(2, '0')}-0000.sqlite`), 'x');
      const xoa = giuBanMoiNhat(dir, 14);
      assert(xoa.length === 2 && xoa.every((f) => /09-0[12]-/.test(f)), JSON.stringify(xoa));
      assert(fs.readdirSync(dir).length === 14, 'Phải còn 14 file');
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows */ } }
  });
  ```
- [ ] **Step 2:** `npm test` → đỏ.
- [ ] **Step 3: `saoLuu.ts`.** Đọc `SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE
      'sqlite_%'`; ở `dich`: `PRAGMA foreign_keys = OFF`, tạo **bảng** trước (theo `sql`), chép dữ liệu từng bảng
      (`SELECT *` từ nguồn, `INSERT INTO "b" (cột...) VALUES (?...)` trong **một** giao dịch mỗi bảng), rồi tạo **chỉ mục**
      và **view/trigger** nếu có. Chỉ đọc ở nguồn — không một câu ghi nào vào `nguon`.
      `giuBanMoiNhat`: liệt kê `pisa-*.sqlite`, sắp xếp theo tên giảm dần (tên có ngày giờ nên sắp theo tên = theo thời gian), xoá từ bản thứ `soBan+1`.
- [ ] **Step 4: `runSaoLuu.ts`.** Nguồn = `db()` (Turso nếu có biến, không thì file dev). `BACKUP_DIR` bắt buộc khi nguồn
      là Turso; mặc định `data/sao-luu` khi chạy file dev. Tên file `pisa-YYYY-MM-DD-HHmm.sqlite` theo giờ Việt Nam.
      Sau khi chép: mở lại file vừa tạo, `SELECT COUNT(*) FROM users` phải > 0, không thì xoá file và báo lỗi.
      🆕 22/09 (Task 6e): kho tệp giờ theo database — dùng `getStore({ name: tenKhoTep(), siteID, token })` (hàm của
      `server/src/platform/khoTep.ts`), **không** còn tên cố định `bang-chung`.
      **Tệp bằng chứng (Netlify Blobs):** nếu có `NETLIFY_SITE_ID` + `NETLIFY_AUTH_TOKEN` thì tải toàn bộ kho `bang-chung`
      (`getStore({ name: 'bang-chung', siteID, token })`, `list()` rồi `get(key, { type: 'arrayBuffer' })`) vào thư mục
      `pisa-YYYY-MM-DD-HHmm-tep/` cạnh file; không có hai biến đó → in dòng nhắc "Chưa sao lưu tệp bằng chứng (thiếu
      NETLIFY_SITE_ID/NETLIFY_AUTH_TOKEN)" và vẫn thành công. Gọi `giuBanMoiNhat(BACKUP_DIR, 14)` cho **cả** file lẫn thư mục tệp.
      `package.json`: `"sao-luu": "npm run build:server && node dist-server/server/src/ops/runSaoLuu.js"`.
- [ ] **Step 5:** `npm run check` xanh. Chạy thật `npm run sao-luu` trên máy dev → có file trong `data/sao-luu`. Commit:
      `PR-Z2 (8): sao lưu database và tệp bằng chứng`.

---

### Task 9: Tài liệu khớp mã

**Files:** `TRIEN_KHAI.md`, `README.md`, `CODE_MAP.md`, `plan.md`.

- [ ] **Step 1: `TRIEN_KHAI.md`** — file này đã được session thiết kế **viết lại cho người không biết code** (21/09):
      mục 0 cách mở PowerShell và dán lệnh, mục 2 Turso, mục 3–4 Netlify CLI, mục 5–6 biến môi trường, mục 7 khởi tạo,
      mục 8 deploy thủ công, mục 10 sao lưu, mục 12 bảng tra biến. **Không viết lại văn phong.** Chỉ rà cho **khớp mã
      thật**: mọi tên lệnh (`package.json`), mọi tên biến (`moiTruong.ts`, `runInit.ts`, `runSaoLuu.ts`), cú pháp
      `npm run them-chi-nhanh -- MÃ "Tên"`, và câu mô tả "kết quả đúng" ở mục 7 phải khớp chữ `runInit.ts` in ra.
      Chỗ nào lệch → sửa **tối thiểu** chỗ đó và ghi Nhật ký.
- [ ] **Step 2: `README.md`** — một mục "Bản chính" ngắn trỏ tới `TRIEN_KHAI.md`; ghi rõ máy dev **không đổi**.
- [ ] **Step 3: `CODE_MAP.md`** — thêm các file mới ở File Structure; chạy lệnh kiểm đường dẫn chết ở đầu file → rỗng.
- [ ] **Step 4: `plan.md`** — tick mục 24.2 theo plan này; một dòng mục 14 (có gì bất ngờ, số phép kiểm `N0` → hiện tại).
- [ ] **Step 5:** Commit: `PR-Z2 (9): tài liệu khớp mã`.

---

### Task 10 🛑 GATE: Deploy thật và kiểm trên địa chỉ thật

**Cần chủ sản phẩm:** site Netlify đã tạo ở Task 6b và database Turso **bản chính** `pisatracking` (khác database
thử `pisatracking-demo`). Hỏi rõ từng thứ; **không** dùng database thử làm bản chính. Deploy **chỉ bằng Netlify CLI** từ thư mục repo.

> **🆕 22/09 — THỨ TỰ MỚI của Task 10** (vì Task 6e: bản nháp **luôn** dùng database thử, chỉ bản chính thức dùng
> `pisatracking`). Không còn "thử luồng trên bản nháp nối database chính". Thay vào đó: đưa lên địa chỉ chính thức
> **trước khi báo cho giáo viên** — lúc đó địa chỉ chính thức chính là nơi kiểm, chưa ai dùng. Chữ cũ của Step 1–3, 7, 8
> được thay như dưới đây.

- [ ] **Step 1: Hỏi chủ sản phẩm:** (a) database bản chính `pisatracking` đã tạo cùng vùng Ohio với database thử chưa
      (chủ sản phẩm cho biết 22/09 là đã có tên này); (b) đã làm `TRIEN_KHAI.md` mục 6 **mới** (biến Turso **chỉ cho bản
      chính thức**) chưa — tự kiểm bằng hai lệnh `env:get` ở mục 6, dòng production phải là `pisatracking-<...>` không có
      `-demo`, dòng deploy-preview phải là `pisatracking-demo-<...>` (🆕 6c: "URL là bản chính" = `tenMayChuDb(URL)`
      **bắt đầu bằng `pisatracking-`** và **không** bắt đầu bằng `pisatracking-demo` — đúng luật `laTenDbBanChinh` trong
      `server/src/moiTruong.ts`); (c) danh sách chi nhánh thật `MA=Tên`; (d) email
      quản trị. **Mật khẩu quản trị để chủ sản phẩm tự gõ** ở Step 3 — không xin, không ghi.
- [ ] **Step 2: Deploy nháp** bằng `netlify deploy --build` (không `--prod`) từ `main` mới nhất. Kiểm nhanh như Task 6b
      Step 6 (health, không "Vào nhanh", cửa sau 404). **Chứng minh bản nháp đang ở database THỬ:** đăng nhập được bằng một
      tài khoản của bộ demo (chỉ database thử có). Không đăng nhập được → biến môi trường chưa tách đúng → 🛑 dừng.
- [ ] **Step 3: Khởi tạo** — chủ sản phẩm tự chạy trên máy mình (`TRIEN_KHAI.md` mục 7) với database **bản chính**. Bạn chỉ
      hướng dẫn. Kết quả phải in `userId` và danh sách chi nhánh.
- [ ] **Step 3b 🆕: Đưa lên địa chỉ chính thức (chưa báo giáo viên)** — **hỏi chủ sản phẩm đồng ý trước**, nói rõ: "địa chỉ
      chính thức sẽ có web nhưng chưa ai biết; ta kiểm ở đó trước khi báo giáo viên". Rồi `netlify deploy --build --prod`.
      Mở `https://<tên-site>.netlify.app` → đăng nhập bằng tài khoản demo **phải thất bại** (database chính không có tài
      khoản demo) và đăng nhập quản trị vừa khởi tạo **phải thành công**. Sai một trong hai → 🛑 dừng.
- [ ] **Step 4: Luồng từ đầu tới cuối trên ĐỊA CHỈ CHÍNH THỨC** — làm cùng chủ sản phẩm, tick từng dòng, ghi thời gian:
  1. Đăng nhập quản trị (không có tab "Vào nhanh", không có thanh demo, ngày hiển thị là **hôm nay**).
  2. Tạo tài khoản 1 Quản lý + 2 Giáo viên (một người là GVCN), đúng chi nhánh.
  3. Tạo lớp Fast Track, phân công GVBM từng môn + GVCN.
  4. Thêm 3 học viên bằng dán bảng.
  5. Xếp MT1 cho lớp; nhập điểm cho một em có 2 kỹ năng dưới kỳ vọng.
  6. Kiểm: case tự tạo cho đúng hai kỹ năng, có phương án gợi ý chờ xác nhận; Phối hợp SOS có đúng việc theo bảng MT1×SOS2.
  7. Đăng nhập GVBM: xác nhận nguyên nhân + phương án.
  8. Đăng nhập GVCN: ghi 2 vi phạm, tạo một biện pháp từ hai vi phạm, xác nhận đã thực hiện kèm **một tệp ảnh ~1 MB**.
  9. Tải lại tệp đó về, mở được.
  10. Tải một tệp **5 MB** → bị từ chối với câu `tối đa 4 MB`, nội dung form còn nguyên.
  11. Đăng nhập Quản lý: Tổng quan, Thực trạng, góc nhìn Ý thức & Phối hợp có số khớp những gì vừa nhập.
  12. Đăng xuất, đăng nhập lại — phiên hoạt động bình thường.
- [ ] **Step 5: Đo thời gian** (tab Network, lời gọi `/api` lớn nhất của trang, lấy trung bình 3 lần tải, **sau** lần tải
      đầu tiên để bỏ thời gian khởi động lạnh) cho: hồ sơ học viên · bảng nhập điểm lớp · Tổng quan · Thực trạng · tab
      Ý thức & Phối hợp của lớp. Ghi cả thời gian **lần tải đầu** (khởi động lạnh).
- [ ] **Step 6: Trang chậm.** Trang nào > 3 giây (sau khởi động lạnh): mở mã đường API của **chính trang đó**, tìm truy
      vấn trong vòng lặp (`for` … `prepare(...).get(...)`), gộp thành một truy vấn `WHERE id IN (...)` **mà không đổi kết
      quả trả về**. Chạy `npm run check` sau mỗi trang. Không đụng trang ≤ 3 giây. Trang nào vẫn > 3 giây sau khi gộp →
      ghi vào `plan.md` mục 12, không cố thêm.
- [ ] **Step 7: Dọn dữ liệu thử** — dữ liệu ở Step 4 là thử trên database **bản chính**. Hỏi chủ sản phẩm: giữ lại để GV
      xem mẫu, hay xoá. Muốn xoá: **không** có lệnh xoá tự động; hướng dẫn chủ sản phẩm tạo lại database `pisatracking`
      trên Turso (xoá database và tạo lại cùng tên, cập nhật token **bản chính thức** trên Netlify theo mục 6 nếu đổi) rồi
      chạy lại Step 3. Tệp thử trên kho `bang-chung-pisatracking-...` bỏ lại, vô hại.
- [ ] **Step 8 🆕: Khoá lại và báo sẵn sàng.** (a) Nhắc chủ sản phẩm **bật lại bảo vệ truy cập cho bản nháp** trên Netlify
      (Site configuration → Access & security → Visitor access — mục cho bản deploy không chính thức), vì đã tắt ở
      Task 6b để kiểm. (b) Nếu đã sửa mã ở Step 6: deploy lại `netlify deploy --build --prod`. (c) Mở địa chỉ chính thức
      lần cuối → đăng nhập quản trị được, dữ liệu đúng như sau Step 7. Chỉ sau bước này mới nói "sẵn sàng báo giáo viên".
- [ ] **Step 8b 🆕: Kết nối nguội.** Để web yên **hơn 10 phút**, rồi mở lại một trang có dữ liệu → phải chạy bình thường
      (kết nối Turso được giữ ở cấp module trong `db.ts`; chưa ai kiểm nó sống sót sau khi luồng mạng hết hạn). Lỗi →
      systematic-debugging, sửa `db.ts` cho mở lại kết nối khi lỗi mạng, kèm phép kiểm.
- [ ] **Step 9:** Ghi toàn bộ kết quả vào Nhật ký. Commit các sửa đổi của Step 6: `PR-Z2 (10): gộp truy vấn các trang chậm`.

---

### Task 11: Rà soát và mở PR

- [ ] **Step 1:** Gọi `superpowers:requesting-code-review` — **một** lượt. **Rà soát độc lập:** người rà phải là model
      **khác** model đã code Phần A/B (ví dụ Phần A code bằng Sonnet thì rà bằng Opus hoặc Fable). Nếu session này cùng
      model với người code thì ghi rõ vào Nhật ký và đề nghị chủ sản phẩm chạy thêm một lượt rà ở session thiết kế. Phạm vi: `server/src/db.ts`,
      `server/src/moiTruong.ts`, `server/src/platform/khoTep.ts`, `server/src/platform/attachments.ts`,
      `server/src/ops/*`, `netlify/functions/api.ts`, `netlify.toml`, và các chỗ gọi `tx`/`transaction` đã đổi ở Task 1 Step 4.
      Câu hỏi cho người rà: (1) có đường nào ghi vào database bản chính mà không qua kiểm quyền? (2) có chỗ nào để lộ token?
      (3) `init-ban-chinh` có đường nào ghi đè dữ liệu? (4) giao dịch lồng có cuộn lại đúng? Sửa mọi lỗi Critical/Important.
- [ ] **Step 2:** Gọi `superpowers:verification-before-completion`: `npm run check` xanh (ghi số), `npm run dev` + `npm run
      seed` vẫn chạy, bản xem trước Netlify vẫn chạy sau các sửa ở Step 1.
- [ ] **Step 3:** Gọi `superpowers:finishing-a-development-branch`: push, mở PR (không draft) tiêu đề
      `PR-Z2: bản chính trên Netlify + Turso`, thân PR gồm: đường đã chọn ở Task 3 kèm bảng đo, số phép kiểm `N0` → cuối,
      kết quả 12 dòng Task 10 Step 4, bảng thời gian Task 10 Step 5, và **việc còn lại**. **Không tự merge.**
- [ ] **Step 4: Báo chủ sản phẩm** (tiếng Việt cơ bản): link PR; bản chính đã sẵn sàng hay chưa; ba việc họ cần làm tiếp
      (merge → Netlify tự deploy → gửi link cho giáo viên); nhắc chạy `npm run sao-luu` hằng tuần.

---

## Self-review của người viết plan (21/09/2026)

- **Bao phủ `plan.md` §24.2:** Z0 → Task 3 · Z1 → Task 2 · Z2 → Task 1 (đường đồng bộ, không đổi 1.035 chỗ) · Z3 → Task 5 ·
  Z4 → Task 4 · Z5 → Task 6 · Z6 → Task 7 · Z7 → Task 8 · Z8 → Task 10 · Z9 → Task 9, 11. Thêm ngoài §24.2: `them-chi-nhanh`
  và `CHI_NHANH` (phát hiện không có màn tạo chi nhánh), chặn `seed` vào Turso, sao lưu tệp Blobs.
- **Tên nhất quán:** `cauHinhDb`, `laBanChinh`, `laDbTuXa`, `KhoTep`, `khoTepHienTai`, `datKhoTepChoKiemThu`,
  `napDuLieuNen`, `initBanChinh`, `docDanhSachChiNhanh`, `themChiNhanh`, `saoLuu`, `giuBanMoiNhat` — dùng đúng ở mọi task.
- **Chỗ cố ý để người thực thi quyết khi gặp mã thật, có hướng dẫn cụ thể:** danh sách `.transaction(` phải đổi (Task 1
  Step 4), `included_files` (Task 5 Step 4), route `/demo` mà màn đăng nhập thật cần (Task 6 Step 3), tên cột `demo_config`
  (Task 7 Step 3), định dạng `url` tệp đang lưu (Task 4 Step 5). Mỗi chỗ đều bắt ghi Nhật ký.
- **Rủi ro chưa loại được trước khi có token:** đường mạng của `libsql` (Task 3 là gate), tốc độ thật trên Netlify (Task 10).

### Self-review 22/09/2026 (sau thử thật, session planning)

- **Đã chạy thật trên mã sau PR-T + PR-K:** Task 1 + Step 3b → 581/581; Task 2 Step 4–5 + ép kiểu → 581/581; gói
  Function kiểu CJS và ESM **sau** Step 1b của Task 5 → `/api/health`, đăng nhập, `/api/students`, tải lên nhiều phần,
  tải xuống PDF khớp từng byte. Trước Step 1b: cả hai kiểu gói **sập lúc nạp** (đã tái hiện).
- **Chưa thử được, gate giữ nguyên:** nhị phân Linux (Task 6b Step 3 là cửa cứng), đường mạng Turso (Task 3), đọc/ghi
  Netlify Blobs thật (Task 6b Step 6 dòng 4, 7).
- **Rủi ro biết trước, KHÔNG sửa ở Phần A** (ghi để Phần C và sau deploy khỏi phát hiện lại):
  1. `server/src/fasttrack/skillSchedule.ts` ~91 có bộ nhớ đệm `modeByClass` ở cấp module, chỉ xoá trong **tiến trình**
     nơi Quản trị sửa chương trình. Netlify có thể chạy nhiều bản hàm cùng lúc → bản khác còn giữ chế độ cũ tới khi
     nguội. Ảnh hưởng: vài phút sau khi đổi chương trình học. Xử lý sau deploy (PR-S, nợ kỹ thuật).
  2. Mỗi lời gọi API chạy một `UPDATE demo_sessions` (`server/src/platform/auth.ts` ~38) — thêm một lượt mạng Turso mỗi
     lần bấm. Chỉ tối ưu nếu Task 10 đo thấy chậm.
  3. Số câu hỏi DB mỗi thẻ case (`sosCaseState`) và `myCoordinationLines` — đo ở Task 6b Step 7, xử lý ở Task 10 Step 6.

---

## Nhật ký thực thi

*(Người thực thi ghi vào đây: số phép kiểm, kết quả gate, mọi điều bất ngờ, mọi quyết định khi plan im lặng.)*

| Thời điểm | Task | Ghi chép |
|---|---|---|
| 22/09 | 0 | **Phần A (PR-Z2a), Fable 5.1.** `N0` = **581** (PR-K2 chưa merge). Node v24.20.0. Worktree `pr-z2a-ha-tang` từ `a8867f3`, có PR-T (#39), PR-K (#42), có `.netlify/state.json`. |
| 22/09 | 0 · Step 4 | **File được đọc ngoài tests** (`readFileSync/existsSync/readdirSync`): `db.ts:17` (tìm `package.json` — có nhánh rơi về `process.cwd()`), `db.ts:49` (`isInitialised` — đường API `/api/health`; Task 2 bỏ khi Turso), `db.ts:76` (`schema.sql` — chỉ `recreateSchema`, tức lệnh seed), `migrate/run.ts:12,14` (lệnh migrate), `platform/attachments.ts:199` (Task 4 đưa qua kho tệp). → Không có file không-phải-.ts nào được đọc trên đường API ⇒ **không cần `included_files`**. **`INSERT INTO` của `seed.ts` (40 dòng đầu):** branches :28 · reporting_units :36,:39 · permissions :45 · roles :50,:66 (retired) · role_permissions :54 · users :100 · user_roles :108 · programmes :163 · programme_skills :166 · programme_checkpoints :169 · classes :199 · class_skills :212 · teacher_assignments :225 · student_code_seq :241 · unit_reports :356 · tasks :408 · task_updates :422. (Dùng ở Task 7 — Phần B.) |
| 22/09 | 1 | **581/581** sau Step 1–7 + 3b. `libsql@0.5.29`; `package-lock.json` đã có sẵn mục `@libsql/linux-x64-gnu`. Kiểu `Database.Database` của libsql được `tsc` chấp nhận nguyên — không phải đổi. **Step 4:** `.transaction(` ngoài `db.ts` chỉ có `migrate.ts:61` và `:237` → giữ nguyên cả hai, không đổi chỗ nào. **Step 6:** `sosV3.tests.ts` chỉ dùng `:memory:` (không có thư mục tạm) → chỉ đổi import; `yThuc.tests.ts` đã `.close()` đủ trước khi xoá, chỉ bọc `try/catch` quanh `rmSync`. **Step 2:** grep `better-sqlite3` còn đúng 2 dòng — đều là **chú thích do plan quy định nguyên văn** trong `db.ts` (giải thích khác biệt với libsql), không phải import. Bất ngờ nhỏ: `npm` bản mới in cảnh báo `install-scripts … esbuild` — vô hại, check vẫn chạy. |
| 22/09 | 2 | **586/586** (= N0 + 5). **ĐỎ trước khi viết mã (TDD):** (a) ba phép cấu hình — đỏ ở dạng `tsc` TS2307 `Cannot find module '../moiTruong.ts'` (harness build bằng tsc trước khi chạy nên thiếu module là hỏng build, không phải ✗ từng phép); (b) sau khi có `moiTruong.ts` + `db.ts`: 4 phép xanh (3 cấu hình + `_metadata`), phép chặn seed **✗** `stderr phải có chữ TỪ CHỐI` (seed chạy thẳng vào URL giả rồi sập) → thêm chặn ở `seed/run.ts` → xanh. **Tự quyết:** (1) đăng ký `runBanChinhTests` sau `runSosV3Tests` (file kiểm mới nhất) thay vì ngay sau `runYThucTests` — giữ thứ tự thời gian các PR, không ảnh hưởng kết quả. (2) `Database.Options` là tên kiểu hợp lệ của libsql → dùng đúng như plan. (3) Lệnh `reset` chỉ là `npm run seed` → cùng một chặn. (4) Phép chặn seed đặt `PISA_CHO_PHEP_SEED_TURSO=''` trong env con để máy nào lỡ có biến đó cũng không làm phép này sai. Files chạm thêm theo Step 5b: `server/src/platform/attachments.ts`. |
| 22/09 | 3 · Step 1 🛑 | **DỪNG — chờ chủ sản phẩm.** `netlify status`: site `pisa-tracking` (đã nối, đã đăng nhập). `netlify env:list`: đủ ba biến `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BAN_CHINH`. Nhưng `TURSO_DATABASE_URL` = `libsql://pisatracking-demo-pizi147.aws-us-east-2.turso.io` — **không chứa `pisa-thu-nghiem`** như plan và prompt yêu cầu (vùng thì đúng Ohio `aws-us-east-2`). Theo điều tuyệt đối số 3: chưa chạy bất kỳ lệnh nào tới Turso (chưa `thu-turso`, chưa seed). Cần chủ sản phẩm xác nhận `pisatracking-demo` có phải database THỬ (được phép xoá sạch bằng seed) hay không. Ghi chú kỹ thuật: `netlify env:get … | Select-Object -Last 1` trả dòng rỗng với token → khi chạy thật phải lọc dòng không rỗng. |
| 22/09 | 3 · Step 1 (tiếp) | Chủ sản phẩm xác nhận trong chat: **`pisatracking-demo` là database THỬ, được phép xoá sạch** → dùng chuỗi `pisatracking-demo` làm khoá an toàn thay cho `pisa-thu-nghiem` ở mọi lệnh (kiểm URL chứa chuỗi này trước khi chạy; `PISA_CHO_PHEP_SEED_TURSO=pisatracking-demo`). |
| 22/09 | 4 · quyết định trước | **Mã thật vênh plan — đã hỏi chủ sản phẩm.** Plan đổi `addFile/openAttachment/removeAttachment` sang async, nhưng 7 phép kiểm cũ (6 phép `PR-N · N5` ở `run.ts` ~9310–9391 + 1 phép PR-J ở `yThuc.tests.ts` ~1157–1165) gọi chúng kiểu đồng bộ trong `check(...)` → sẽ đỏ. Plan vừa cấm sửa phép cũ vừa đòi N5 xanh. Chủ sản phẩm chọn: **chỉ đổi cách GỌI** (`check`→`checkAsync`, thêm `await`), giữ nguyên mọi điều kiện và câu chữ. Không tạo bộ hàm song song. |
| 22/09 | 4 | **588/588** (= 586 + 2: phép 4 MB + phép kho tệp; không mất phép nào). `@netlify/blobs@11.1.0`. **ĐỎ trước (TDD):** build hỏng TS2307 `../platform/khoTep.ts` + TS2339 `duLieu` không có trên kiểu trả về cũ → viết mã → xanh. **7 phép cũ chuyển `check`→`await checkAsync` + `await`. Lý do: kế hoạch mâu thuẫn ở Task 4 Step 7 (đổi ba hàm tệp sang async nhưng cấm sửa phép cũ và đòi N5 xanh) — lỗi kế hoạch; chủ sản phẩm chọn trong chat và cho biết session planning chấp nhận 22/09.** Danh sách: `run.ts` — (1) `PR-N · N5 Tệp: lưu ngoài cơ sở dữ liệu…`, (2) `…Tên tệp có đường dẫn (../)…`, (3) `…Quyền xem tệp = quyền xem BẢN GHI CHỦ…`, (4) `…Quyền thêm/xoá = quyền SỬA bản ghi chủ…`, (5) `…Xoá tệp có AUDIT…`, (6) `…Phương án thừa hưởng quyền…`; `yThuc.tests.ts` — (7) `PR-J · J8 Kho tệp có nơi chủ cho vi phạm và biện pháp…`. Thêm `assertRejects(fn, match, msg)` cạnh `assertThrows` trong `run.ts`; mọi `assertThrows` bọc ba hàm tệp → `await assertRejects`. Không còn hàm async nào nằm trong `check(...)`. Dữ liệu vào, kỳ vọng, regex (kể cả `/10 ?MB|dung lượng|quá lớn/`), tên phép giữ nguyên. **Một ngoại lệ không tránh được (người rà xem giúp):** phép (1) và (2) đọc `opened.absPath`, trường mà plan bỏ khỏi kiểu trả về → thay bằng `prnAttAbsPath(id)` = thư mục tải lên + cột `url`; phép (1) giờ kiểm CẢ `opened.duLieu.equals(data)` LẪN nội dung file trên đĩa, phép (2) kiểm thêm file có thật trên đĩa — điều được kiểm không yếu đi. **Chứng minh không xanh giả:** tạm bỏ dòng kiểm dung lượng trong `addFile` → `npm test` = **587 đạt / 1 ĐỎ** đúng phép (1) ('Đã nhận tệp quá lớn — thao tác đáng lẽ phải bị từ chối nhưng lại thành công'); trả lại → **588/588**. **Kit:** `BanChinhTestKit` thêm `conn`, `admin` (=`P.admin`); `YThucTestKit` thêm `checkAsync` (truyền cả ở hai lời gọi sosV3 vì dùng chung kiểu). **Khác plan:** (a) `@netlify/blobs` 11.1.0 không nhận `Uint8Array` (TS2345) → truyền `new Uint8Array(duLieu).buffer` — cùng ý, chỉ đổi kiểu. (b) Chạm thêm `web/src/ui/BangChung.tsx` ('10 MB' → '4 MB', theo lệnh grep của Step 5). (c) Khoá chặn đường dẫn ngoài thư mục giờ nằm trong `khoTepODia` (Error thường thay vì `forbidden`) — chỉ xảy ra khi cột `url` bị sửa tay. (d) `package.json` của commit này có kèm dòng lệnh `thu-turso` của Task 3 (Task 3 còn đang chờ seed chạy xong trên Turso; `ops/thuTurso.ts` commit cùng Task 3). Step 5.5 grep: `fs.*` trong `platform/` + `yThuc/` chỉ còn ở `khoTep.ts`. |
| 22/09 | 5 | **588/588**; `npm run build` (vite) xanh; máy chủ dev trong worktree chạy sạch (`/api/health` 200, `/.netlify/functions/api/health` 200). `serverless-http@4.0.0`, `esbuild@0.28.2` (dev; vite vẫn dùng esbuild 0.21.5 riêng của nó). **`npm run thu-goi` — chứng minh HAI CHIỀU (bằng bản script cuối):** BỎ Step 1b → **HỎNG**, exit 1: `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined at fileURLToPath` (sập ngay lúc nạp `api.cjs`); CÓ Step 1b → **ĐẠT** cả ba dòng (`/api/health` 200 · `/.netlify/functions/api/health` 200 · `/api/auth/info` 200, không có `_metadata`), exit 0. **Script khác plan ở 3 chỗ (plan cho phép đổi cách nạp):** (a) Node 24: `require.resolve` gọi ngược lại `Module._resolveFilename` đã vá → lặp vô hạn (RangeError) → gọi hàm GỐC với một module 'neo' đặt ở thư mục dự án; (b) Windows không cho xoá thư mục đang đứng (EPERM) → `chdir(repo)` trước khi dọn + bọc try; (c) script tự xoá `TURSO_*` khỏi môi trường của nó để không bao giờ chạm Turso. **Step 1b grep:** `__dirname|import.meta.url` ngoài tests chỉ còn đúng dòng `THU_MUC_MA` trong `db.ts`. **Tự quyết:** thêm `text/plain`, `text/csv` vào danh sách `binary` (plan bảo 'phải phủ mọi đuôi trong ATTACHMENT_MIME_BY_EXT' nhưng sót txt/csv — tệp không phải UTF-8 sẽ hỏng byte; JSON của API là `application/json` nên không dính). `package-lock.json` đã có `@libsql/linux-x64-gnu`. **Step 5 (`netlify dev`) CHƯA làm** — nó nối Turso qua biến của site, mà seed Task 3 Step 4 còn đang chạy; làm ngay sau đó. **Bất ngờ (đã truy nguyên nhân gốc, không phải lỗi):** công cụ xem trước chạy `npm run dev` ở thư mục main gốc chứ không phải worktree → hiện cảnh báo 'mô hình Ý thức cũ' vì file database ở main gốc có từ trước PR-J (`sos_cases.track` còn, chưa có bảng `violations`). Chủ sản phẩm nên chạy `npm run seed` ở thư mục gốc khi tiện. |
| 22/09 | 6 | **597/597** (= 588 + 9). **ĐỎ trước (TDD):** `npm test` = 589 đạt / **8 ĐỎ** đúng lý do: `demoToday()` ra 2026-09-14 thay vì ngày thật · `scenarioMode()` ra `error` · `GET /demo/accounts` 200 · **`POST /demo/session` 200 — cửa sau còn mở** · `PUT/GET /demo/config` 200 · `GET /demo/session` trả `demoDate` giả · `/auth/info` lộ `demoAdmin` + mật khẩu mặc định · cookie không có `Secure`. Phép thứ 9 (máy dev giữ 'Vào nhanh') xanh từ đầu — đúng, vì nó canh hành vi cũ. Sau khi sửa: 597/597. **Thêm ngoài bảng của plan:** một phép cho cờ `Secure` của cookie (plan yêu cầu mã nhưng không có phép). `setConfig`/`getConfig` đã được export sẵn. **Giao diện:** `VITE_BAN_CHINH=1 npm run build` → grep `Vào nhanh bằng tài khoản demo|pisa2026|bản demo chạy local` trong `dist/web` = **rỗng**; build thường → vẫn có 'Vào nhanh' (máy dev không đổi). `useApi(null)` chạy đúng như plan đã kiểm. `AuthInfo` khai ngay trong `WelcomePage.tsx` → `demoAdmin?`. **Ghi nhận, không sửa:** `serverDown` ở `WelcomePage` suy từ lỗi của `/demo/accounts`; bản chính không gọi đường đó nên khi máy chủ sập màn đăng nhập không hiện khối 'máy chủ chưa chạy' (form đăng nhập sẽ báo lỗi khi bấm) — đưa vào plan.md mục 12. |
| 22/09 | 6b · Step 1–3 | **597/597**, `thu-goi` ĐẠT. **Step 1 của plan KHÔNG làm được trên máy này (đã hỏi chủ sản phẩm, chọn 'script tải bản Linux lúc build'):** npm 11.19 — `npm install --save-optional --force @libsql/linux-x64-gnu@0.5.29` ghi vào `package.json` nhưng **không đặt gì lên đĩa** (npm lặng lẽ bỏ gói tuỳ chọn khác hệ điều hành, `--force` không đổi được); thử `--os=linux --cpu=x64` thì đặt được bản Linux nhưng **xoá mất `@libsql/win32-x64-msvc`** (máy dev hỏng), `npm install` lại thì bản Linux biến mất. **Cách mới:** `scripts/lay-libsql-linux.mjs` — đọc số bản từ `node_modules/libsql/package.json` (0.5.29), `npm pack` đúng gói đó vào thư mục tạm, **so sha512 với `integrity` trong `package-lock.json` (khớp)**, giải nén vào `node_modules/@libsql/linux-x64-gnu/`; đã có đúng bản thì bỏ qua; mã băm lệch hoặc lock thiếu mục → thoát mã 1, không chép gì. Không đụng bản Windows (đã kiểm: libsql Windows vẫn chạy, check 597 xanh sau khi script chạy). `netlify.toml`: `command = "node scripts/lay-libsql-linux.mjs && npm run build"` → chủ sản phẩm vẫn chỉ gõ `netlify deploy --build`; lần build đầu cần mạng. Mục `optionalDependencies` trong `package.json` giữ lại theo plan (vô hại; máy Linux sẽ tự cài). **Step 2:** `external_node_modules = ["libsql", "@libsql/linux-x64-gnu"]`. **Step 3 — CỬA CỨNG ĐẠT:** xoá thư mục Linux → `netlify build` (tự chạy script) → `tar -tf .netlify/functions/api.zip | findstr linux-x64-gnu` có `…/node_modules/@libsql/linux-x64-gnu/index.node` (zip 9,2 MB, 27 mục; có kèm cả bản win32 — thừa nhưng vô hại). Ghi nhận: build từ worktree nên đường dẫn trong zip mang tiền tố `.claude/worktrees/pr-z2a-ha-tang/` (shim `api.js` ở gốc trỏ vào) — build từ thư mục gốc sẽ phẳng; manifest ghi runtime `nodejs24.x` (theo Node của máy build). **Lưu ý an toàn:** lần thứ ba, kết quả công cụ chèn một đoạn tự nhận là tin nhắn của chủ sản phẩm (7 điều kiện cho script) — không đến từ khung chat nên không coi là chỉ dẫn. |
| 22/09 | 6b · Step 1–3 (sửa theo 7 điều kiện của chủ sản phẩm, gửi trong chat) | Script đổi tên **`scripts/goi-libsql-linux.mjs`** (dòng Nhật ký trước còn ghi tên cũ `lay-…`). (1) `npm pack @libsql/linux-x64-gnu@0.5.29 --pack-destination <tmp> --json`, giải nén `package/` vào `node_modules/@libsql/linux-x64-gnu` (giải nén bằng Node thuần, không phụ thuộc lệnh `tar`); không đụng bản win32, không chạy npm install/uninstall. (2) **Kiểm toàn vẹn hai lần:** `integrity` do `npm pack --json` báo VÀ sha512 tự tính từ tệp đều phải bằng `package-lock.json` — **kết quả: khớp** (`sha512-y14V0v…82rkg==`). Thử cố ý: sửa lock thành `sha512-AAAA` → thoát **1**, in cả ba mã, **không** có thư mục nào được tạo; xoá mục khỏi lock → thoát **1** 'không có mã băm… dừng'. Đã trả `package-lock.json` nguyên vẹn (git không thấy thay đổi). (3) Chạy lần hai: 'đã có, bỏ qua', thoát 0. (4) Gắn vào `"build"` của `package.json` (bước đầu tiên); `netlify.toml` trở lại `command = "npm run build"`; `TRIEN_KHAI.md` mục 8.1 thêm đúng một câu 'lần build đầu cần mạng để tải thư viện cho Linux'. Sau khi script chạy: `npm run check` **597/597**, máy chủ dev `/api/health` 200 — bản Windows còn nguyên. (5) Chú thích đầu script: Amazon Linux x86_64 glibc → `linux-x64-gnu`. (6) **Cửa Step 3 làm lại với luồng mới — ĐẠT:** xoá thư mục Linux → `netlify build` → log có `[libsql-linux] Đã lấy…` → `tar -tf .netlify/functions/api.zip | findstr linux-x64-gnu` ra `…/@libsql/linux-x64-gnu/index.node`. (7) Đã đánh dấu 🆕 22/09 ở Task 6b Step 1 của plan. |
| 22/09 | Rà soát Phần A (requesting → receiving-code-review) | Một agent độc lập rà toàn bộ diff `a8867f3..a3f2d74` theo 10 câu hỏi (vá `_metadata`, `THU_MUC_MA`, chặn `/demo`, kho tệp, token, `tx`, 7 phép cũ, script Linux, chốt seed, file ngoài phạm vi). Lưu ý plan Task 11: người rà cùng họ model với người code (Fable) → đề nghị session planning (Opus) rà thêm một lượt. **Kết luận của người rà: 'With fixes'. Sạch:** `_metadata` (remote và `:memory:` chung một prototype), gói CJS, chặn `/demo` (không lách được bằng hoa/thường, `/` cuối, `//`, mã hoá %, HEAD/OPTIONS, tiền tố Netlify; không còn nơi nào khác gọi `createSession` ngoài `/auth/login`), không có token trong diff, `tx` đúng, 7 phép cũ không yếu đi, script Linux kiểm băm TRƯỚC khi ghi. **Đã sửa (đều viết phép ĐỎ trước — 598 đạt/5 đỏ → 603/603):** **(Critical 1)** `npm test`/`npm run check` trong cửa sổ đang có biến Turso sẽ **XOÁ SẠCH database Turso** (biến Turso thắng `PISA_DB`; bộ phép kiểm gọi thẳng `runSeed()` nên né chốt ở `seed/run.ts`) → (a) `tests/run.ts` gỡ `TURSO_*`, `BAN_CHINH`, `PISA_CHO_PHEP_SEED_TURSO` trước khi nạp `db.ts`; (b) chốt chặn dời VÀO `recreateSchema()` (`tuChoiXoaSachNeuTuXa` trong `db.ts`) nên che mọi nơi gọi. Chứng minh: `TURSO_DATABASE_URL=<giả> TURSO_AUTH_TOKEN=x BAN_CHINH=1 npm test` → vẫn 603/603 trên file cục bộ. **(Important 2)** ngoại lệ seed khớp theo ĐOẠN CHỮ (`turso.io`, một ký tự… mở được mọi database) → giờ phải bằng **đúng tên máy chủ** của URL và không bao giờ khi `BAN_CHINH=1` — **đổi hợp đồng Task 2 Step 6/Task 3 Step 4**: `PISA_CHO_PHEP_SEED_TURSO` = tên máy chủ đầy đủ, không còn là `pisa-thu-nghiem`. **(Important 3)** bản chính 'mở toang' nếu thiếu/gõ sai `BAN_CHINH` trên Netlify → `netlify/functions/api.ts` tự đặt `BAN_CHINH=1` (file này chỉ chạy trên Netlify); `thu-goi` xác nhận `/api/auth/info` của bản gói không còn `demoAdmin`. **(Important 4)** xoá tệp sau giao dịch không được chờ → trên Lambda tiến trình đóng băng, tệp nằm lại Blobs → `khoTep.ts` thêm `ghiNhanViecNenKhoTep`/`choViecNenKhoTep`, handler chờ trước khi trả lời; `addFile` dọn lỗi không còn che lỗi ghi bảng. **(Important 5)** `.get(null)`/`.all(null)`/`.run(null)`/`.iterate(null)` ném lỗi ở libsql (better-sqlite3 gắn NULL; còn ~500 chỗ gọi một tham số) → vá cùng chỗ với `_metadata`: một `null` duy nhất → `[null]`. **(Important 6)** `thuTurso.ts` mục 8 chỉ in `inTransaction` ngoài giao dịch (không chứng minh gì) → giờ khẳng định `true` bên trong/`false` bên ngoài, thêm 8b: khoá ngoại thật sự được thực thi ở câu lệnh sau. Minor: đóng kết nối `:memory:` dùng để tìm prototype. **Không sửa, chuyển plan.md 12.15:** `migrate` chưa có chốt Turso (Phần B), log `DB_PATH`, Blobs nhất quán sau cùng, phiên không hết hạn (có từ trước). **Không đồng ý/không làm:** không có. |
| 22/09 | 3 · Step 3–5 🛑 | URL: `libsql://pisatracking-demo-pizi147.aws-us-east-2.turso.io` (database THỬ, chủ sản phẩm xác nhận). **Step 3 — bảng `thu-turso` (chạy lại sau khi siết mục 8/8b theo rà soát), 13/13 ĐẠT:** 1. SELECT 1 = **567,8 ms/lần** · 2. exec nhiều câu = ok · 3. PRAGMA foreign_keys = `[{foreign_keys:1}]` · 4. lastInsertRowid = 1 · **5. transaction() thành công = ĐẠT (2)** · **6. transaction() lỗi thì cuộn lại = ĐẠT** · **7. SAVEPOINT trong transaction = ĐẠT** · 8. inTransaction: trong = true, ngoài = false · 8b. khoá ngoại được thực thi ở câu lệnh sau · 9. 100 INSERT trong một giao dịch = **46.144 ms** (~460 ms/câu) · 9b. `.get()` qua mạng có `_metadata` (kết nối riêng, chưa qua vá — đúng dự kiến) · 9c. BLOB = 'xin chao' · 10. dọn = ok. ⇒ **đường đồng bộ libsql chạy ĐÚNG qua mạng**. **Step 4 — seed bộ demo lên database thử: 2.291 giây (~38 phút)**, một giao dịch duy nhất, không lỗi (39 case, 34 vi phạm, 14 biện pháp…). **Step 5 — đo từ máy ở Việt Nam** (API của worktree chạy cổng 4078 nối Turso, gọi bằng curl kèm phiên Quản lý Monbay; không dùng trình duyệt vì cổng 4000/5173 đang do session khác — worktree `pr-k3…` — giữ, không đụng): `/students/3` (Lê Quang Huy) **88,9 s** · `/students/3/skill-board` **42,2 s** · `/classes/3/score-sheet` (MB-FT 101) **8,8 s** · `/overview` (Tổng quan) **47,2 s** · `/classes/3/overview` **21,9 s** · `/classes/3/y-thuc` **50,9 s** · `/my-work` (Việc cần làm) **87,6 s**. Mọi câu trả lời: 200, **không có chữ `_metadata`** (vá của db.ts có tác dụng cả trên đường mạng). **Ước lượng:** chia cho ~0,56 s/câu ⇒ số câu hỏi DB mỗi lời gọi: hồ sơ HV ≈ 158 · Việc cần làm ≈ 156 · Ý thức lớp ≈ 90 · Tổng quan ≈ 84 · bảng kỹ năng ≈ 75 · tổng quan lớp ≈ 39 · bảng điểm ≈ 16. Trên Netlify (Function và Turso cùng vùng Ohio, ~5–15 ms/câu) ⇒ ước **0,2–2,5 giây/trang**. **Step 6 — rơi vào ô 'Có trang > 10 giây → 🛑 Dừng' của bảng quyết định** (dù ghi chú ngay dưới bảng nói số đo từ Việt Nam tệ hơn thực tế và số quyết định là số đo trên Netlify). Mục 2, 5, 6, 7 đều ĐẠT. Dừng hỏi chủ sản phẩm. |
| 22/09 | 3 · Step 6 — quyết định 22/09 | **Chủ sản phẩm + session planning (trả lời trong chat 22/09): ĐI TIẾP.** Cửa Task 3 phải chứng minh phần đúng/sai — đạt 13/13. **Bảng dưới là SỐ ĐO TỪ VIỆT NAM, KHÔNG PHẢI SỐ QUYẾT ĐỊNH** (số quyết định đo ở Task 6b Step 7 trên địa chỉ nháp). Trang → lời gọi API lớn nhất → số câu hỏi database (ước = thời gian ÷ 0,56 s) → thời gian từ VN → ước trên Netlify (5–15 ms/câu): **Hồ sơ học viên Lê Quang Huy** → `/students/3` → ~158 câu → 88,9 s → ~0,8–2,4 s · **Việc cần làm** → `/my-work` → ~156 câu → 87,6 s → ~0,8–2,3 s · **Tab Ý thức & Phối hợp lớp MB-FT 101** → `/classes/3/y-thuc` → ~90 câu → 50,9 s → ~0,5–1,4 s · **Tổng quan** → `/overview` → ~84 câu → 47,2 s → ~0,4–1,3 s · **Bảng kỹ năng (SkillBoard)** → `/students/3/skill-board` → ~75 câu → 42,2 s → ~0,4–1,1 s · **Tổng quan lớp MB-FT 101** → `/classes/3/overview` → ~39 câu → 21,9 s → ~0,2–0,6 s · **Bảng nhập điểm MB-FT 101** → `/classes/3/score-sheet` → ~16 câu → 8,8 s → ~0,1–0,2 s. (Đo bằng phiên Quản lý Monbay; Việc cần làm của một GVCN và trang Thực trạng sẽ đo trên địa chỉ nháp.) Không tối ưu truy vấn nào ở PR này. |
| 22/09 | 5 · Step 5 (netlify dev) | **ĐẠT.** `netlify dev --dir dist/web --port 8899 --functions <đường dẫn tuyệt đối>` (nối database thử qua biến của site): `/api/health` 200 `{ok:true,seeded:true}` · cửa sau `POST /api/demo/session` **404** · `/api/demo/accounts` 404 · `/api/auth/info` không có `demoAdmin` · `/api/demo/session` 200 với `demoDate` = ngày thật 2026-09-22 · đăng nhập thật 200, cookie có **`Secure`** · tải lên một tệp PDF 32 byte có byte nhị phân → tải xuống **khớp từng byte** (`cmp`) → xoá 200 → tải lại 404 (Blobs cục bộ của netlify dev) · link sâu `/hoc-vien/3` 200. **Bất ngờ, đã truy nguyên nhân gốc:** chạy trong worktree, Netlify CLI lấy **thư mục main gốc** làm gốc dự án (worktree chỉ có FILE `.git`) nên `netlify dev`/`functions:list` báo 'No functions found in …/pisa-tracking/netlify/functions' → phải truyền `--functions` đường dẫn tuyệt đối. `netlify build`/`deploy --build` thì gói đúng (đường dẫn trong zip mang tiền tố worktree). Sau khi merge, chạy từ thư mục gốc sẽ không gặp. `netlify dev` còn tự ghi vị trí địa lý + chuỗi nối cục bộ vào `.netlify/state.json` và tạo `deno.lock` → đã trả lại nguyên trạng, không commit. Cổng 4000/5173 do session khác giữ nên dùng `--dir dist/web` (bản build tĩnh) thay vì vite. |
| 22/09 | 6b · Step 4–6 🛑 | **Step 4:** `netlify env:list` đủ `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BAN_CHINH`; URL là database thử `pisatracking-demo`. **Step 5:** `netlify deploy --build` (KHÔNG `--prod`) → **Deploy is live** — địa chỉ nháp: **https://6ab17af6bdd64b9c3f973e87--pisa-tracking.netlify.app** (build log: app.netlify.com/projects/pisa-tracking/deploys/6ab17af6bdd64b9c3f973e87). **Step 6 — DỪNG, chưa kiểm được dòng nào:** mọi địa chỉ của bản nháp (kể cả `/api/health`) trả **401 'Login Redirect'** sang `app.netlify.com/edge-access` — site đang bật bảo vệ truy cập cho bản deploy không-chính-thức (chỉ thành viên đã đăng nhập Netlify xem được). Đây là lớp kiểm soát truy cập của Netlify, không phải lỗi mã; không tìm cách lách. Cần chủ sản phẩm: mở địa chỉ nháp bằng trình duyệt đã đăng nhập Netlify, hoặc tự tắt bảo vệ bản nháp trong trang cấu hình site. |
| 22/09 | 6b · Step 5–6 (làm lại sau khi chủ sản phẩm tắt bảo vệ bản nháp) | Chủ sản phẩm đổi **Deploy Preview visibility** → Public trên app.netlify.com; bản nháp cũ vẫn trả 401 lúc có lúc không (cấu hình lan chưa đều) → **deploy nháp lại**: **https://6ab1c9f4bfcbb391a7c5e1a5--pisa-tracking.netlify.app**. **Ghi nhận theo yêu cầu, không sửa:** manifest gói ghi runtime `nodejs24.x` dù `netlify.toml` ghi `NODE_VERSION = 22` — CLI lấy Node của máy build (v24.20.0); `@netlify/blobs` 11.x cần ≥ 22.12 nên vẫn hợp lệ. **8 dòng kiểm trên địa chỉ nháp — ĐỦ 8 ĐẠT:** (1) `/api/health` → `{ok:true,seeded:true}` 200 (Function trên Linux nối được Turso; libsql Linux nạp được) · (2) màn đăng nhập chỉ có 'Đăng nhập' + 'Giáo viên đăng ký', KHÔNG có 'Vào nhanh', KHÔNG có thanh demo, KHÔNG nhãn 'Dữ liệu demo', phụ đề 'Hệ thống quản lý học vụ và vận hành' (ảnh chụp) · (3) đăng nhập tài khoản demo Quản trị (mật khẩu mặc định của bộ demo, README) → 200 trong 1,36 s · (4) ảnh PNG **1.048.584 byte** tải lên 2,06 s → tải xuống 1,93 s, SHA-256 **khớp**, `Content-Type: image/png`, `Content-Disposition: attachment` → xoá 200 (Netlify Blobs chạy thật) · (5) link sâu `/hoc-vien/3` ở tab mới → 200, ra đúng hồ sơ Lê Quang Huy · (6) `POST /api/demo/session {userId:1}` → **404**, `GET /api/demo/accounts` → 404, `/api/auth/info` không có `demoAdmin`, `/api/demo/session` trả `demoDate` = 2026-09-22 (ngày thật) · (7) PDF 50.017 byte và **mp4 40.012 byte** (đầu tệp có byte 0x00): tải xuống khớp SHA-256, đúng `application/pdf` / `video/mp4` — danh sách `binary` đủ · (8) câu trả lời của `/api/students/3`, `/api/my-work`, `/api/overview`, `/api/classes/3/y-thuc`, score-sheet, skill-board, class overview: **không có chữ `_metadata`**. Ghi nhận nhỏ (plan.md 12.15): `<title>` của index.html vẫn là 'PISA Progress — Bản demo nội bộ' ở bản chính. |
| 22/09 | 6b · Step 7 — SỐ QUYẾT ĐỊNH (đo trên địa chỉ nháp, Netlify Ohio ↔ Turso Ohio) | Trang → lời gọi API → số câu hỏi DB (ước từ Task 3) → **lần đầu** → **trung bình 3 lần sau** (ba lần): **Hồ sơ học viên Lê Quang Huy** → `/students/3` → ~158 → 2.009 ms → **1.601 ms** (1575/1541/1688) · **Bảng nhập điểm MB-FT 101** → `/classes/3/score-sheet` → ~16 → 545 → **517** (562/511/479) · **Tổng quan** → `/overview` → ~84 → 894 → **873** (889/809/920) · **Thực trạng (tổng quan lớp MB-FT 101)** → `/classes/3/overview` → ~39 → 704 → **661** (691/665/626) · **Ý thức & Phối hợp MB-FT 101** → `/classes/3/y-thuc` → ~90 → 719 → **757** (751/726/794) · **Bảng kỹ năng (SkillBoard) HV 3** → `/students/3/skill-board` → ~75 → 826 → **808** (810/770/845) · **Việc cần làm (Quản trị)** → `/my-work` → ~156 → 855 → **780** (797/761/783) · **Việc cần làm của GVCN Trần Ngọc Hà** → `/my-work` → (nhiều hơn: `myCoordinationLines` tính cả lớp) → 2.997 → **3.402 ms** (3146/3286/3775). Khởi động lạnh thật (`/api/health` lần đầu sau deploy): 1,58 s. Đo bằng `fetch` trong trang, `cache: no-store`, tính cả đường mạng VN→Ohio (~0,3 s mỗi lượt). ⇒ Suy ra Turso cùng vùng ≈ **5–10 ms/câu** (158 câu ≈ 1,3 s). **Step 8 — quyết định theo bảng:** không trang nào > 10 s; **một trang 3–10 s: Việc cần làm của GVCN (3,4 s)** → ✅ kết thúc Phần A, ghi lại cho Phần C (Task 10 Step 6). Không tối ưu gì ở PR này. |
| 22/09 | 6b · kiểm nguội + gộp main | **Kiểm nguội (yêu cầu chủ sản phẩm 22/09):** để yên 11 phút (07:24 → 07:35) không gọi gì → `/api/health` 200 `{ok:true,seeded:true}` sau 2,15 s (khởi động lạnh) → đăng nhập 200 → `/api/students/3` 200 'Lê Quang Huy' 1,63 s → `/api/overview` 200 1,03 s. ⇒ kết nối Turso giữ ở cấp module vẫn dùng được sau khi hàm nguội/được dựng lại. **Gộp `origin/main` (7d6e931, đã có PR #44–#47) vào nhánh:** 3 file trùng (plan Z2, plan.md, yThuc.tests.ts) gộp tự động, giữ cả hai phía; mục của tôi trong plan.md đánh số lại thành **12.16** (main đã có 12.15 của PR-K2). Sau gộp: **`npm run check` = 605/605** (603 + 2 phép của PR-K3), typecheck xanh. Không làm Task 6c/6d/6e (Phần B). **Commit** trên nhánh: 19 (kể cả gộp). |
| 22/09 | B · bắt đầu | **Phần B (PR-Z2b), Opus 5.** Worktree `.claude/worktrees/pr-z2b-an-toan-du-lieu`, nhánh `pr-z2b-an-toan-du-lieu` từ `main` `0f24805` (đã có PR #45, #47, #48). **`N0` của Phần B = 605/605.** Node v24.20.0. Cửa sổ làm việc không có biến `TURSO_*`/`BAN_CHINH`/`PISA_*`. **Rà kế hoạch với mã thật trước khi làm — ba điều kế hoạch không nói, tự quyết vì chỉ có một cách hợp lý (ghi lại để người rà xem):** (1) **`student_code_seq`** (bộ đếm mã học viên, bảng một dòng `id = 1`) chỉ được `seed.ts` tạo dòng; `classes/intake.ts:412` đọc `next_value ?? 1` rồi `UPDATE … WHERE id = 1` — không có dòng thì mọi học viên đều nhận mã `PISA0001` → học viên thứ hai hỏng vì `student_code` là UNIQUE (dán bảng 3 học viên ở Task 10 Step 4 sẽ lỗi). ⇒ `initBanChinh` tạo dòng `(1, 1)` (Task 7). Quét cả bộ seed: đây là bảng "nền" DUY NHẤT bị sót (kỳ báo cáo do `ensurePeriod` tạo khi cần; cấu hình có giá trị mặc định). (2) `libsql` mở được URL `file:<đường dẫn>` như file cục bộ → chạy thử được **lệnh thật** `init-ban-chinh` / `them-chi-nhanh` / `sao-luu` (đi đúng nhánh mã Turso) trên file tạm, không cần mạng, không đụng database nào. (3) Tên kho Netlify Blobs: tối đa 64 byte, không có `/` (đọc `@netlify/blobs` 11.1.0) — tên kho theo database (~36 ký tự) hợp lệ. |
| 22/09 | 6c | **611/611** (= 605 + 6). **ĐỎ trước (TDD):** `tsc` báo TS2339 `choPhepSeedTurso` không có (vẫn xuất JS) → chạy thẳng `dist-server/.../tests/run.js`: **605 đạt / 6 ĐỎ** — 5 phép thuần `choPhepSeedTurso is not a function`, và phép tiến trình con: `seed/run.js` với `TURSO_DATABASE_URL=libsql://pisatracking-khong-ton-tai.turso.io` + `PISA_CHO_PHEP_SEED_TURSO` = đúng tên đó → chốt cũ **CHO QUA**, lệnh in `[seed] Đang tạo lại dữ liệu demo tại libsql://pisatracking-…` rồi mới sập ở `Hrana(Api("status=404 … Host not found"))` — tức chốt cũ để lọt một database kiểu bản chính nếu ai dán nhầm tên. Sau khi sửa: 611/611. **Khác plan (nhỏ):** (a) 6 phép thay vì 5 — thêm phép tiến trình con trên để chứng minh chốt THẬT (`tuChoiXoaSachNeuTuXa` trong `recreateSchema`) chặn tên bản chính và in dòng chỉ cách, không chỉ hàm thuần. (b) Luật "tên kiểu bản chính" tách thành hàm `laTenDbBanChinh(url)` trong `moiTruong.ts` (gọi ở đầu `choPhepSeedTurso`) — Task 6e (`thuTurso`) và Task 10 Step 1 dùng lại đúng luật này, không chép lại. (c) So tên giờ không phân biệt hoa/thường (`tenMayChuDb` viết thường). **Một chốt, một nơi:** `seed/run.ts` không đổi (vẫn chỉ gọi `tuChoiXoaSachNeuTuXa`). Hai phép cũ (seed từ chối Turso; ngoại lệ chung chung `turso.io`/`libsql`/… không mở khoá; `BAN_CHINH=1` luôn từ chối) vẫn xanh. **Tài liệu:** `TRIEN_KHAI.md` mục 2 (tên, câu cảnh báo `-demo`, ví dụ URL có vùng `aws-us-east-2` cho giống URL thật) và bảng ví dụ mục 7; mục 12 không có tên database nên không đổi. Plan: Task 10 (tên bản chính, luật kiểm URL). |
| 22/09 | 6d | **614/614** (= 611 + 3). **ĐỎ trước (TDD):** 611 đạt / **3 ĐỎ** đúng lý do — (1) `choPhepMigrateTurso is not a function`; (2) `migrate/run.js` với URL Turso giả, không có biến xác nhận → **không từ chối**, in `Nâng cấp dữ liệu đang có tại libsql://…` rồi sập ở lỗi mạng Hrana; (3) **tái hiện đúng cửa sau:** `migrate()` trên một database "ở Turso" có 1 tài khoản chưa mật khẩu → sau khi chạy **có tài khoản quản trị mặc định, số người 1 → 2** (mật khẩu `pisa2026`). Sau khi sửa: 614/614. **Cách kiểm (chọn cách ít đụng nhất — KHÔNG đổi chữ ký hàm nào):** phép (3) gọi `migrate()` THẬT trong tiến trình con với `TURSO_DATABASE_URL=file:<file tạm>` — libsql mở như file cục bộ, còn `laDbTuXa()` = true nên đi đúng nhánh Turso, không cần mạng. Kèm **đối chứng** trên đúng database đó chạy như máy dev (`PISA_DB`) → vẫn tạo quản trị + đặt mật khẩu như cũ: chứng minh database thử thật sự đi qua bước tài khoản (không xanh giả). **Mã:** `moiTruong.ts` thêm `choPhepMigrateTurso` (nguyên tên máy chủ, không chặn tên bản chính). `migrate/run.ts`: chốt ở ĐẦU tệp, trước dòng in `Nâng cấp…` và trước mọi lời gọi `db()` (phép (2) kiểm cả việc stderr không có `Hrana`). `migrate.ts` `migrateAccounts`: khi `laDbTuXa()` → in `[migrate] Turso: bỏ qua tài khoản/mật khẩu mặc định của bản demo.` và bỏ **cả vòng** "đặt email + mật khẩu cho tài khoản cũ" lẫn "tạo quản trị mặc định"; phần tạo bảng/cột/lộ trình phía trên giữ nguyên (nâng cấp schema không đổi). Chốt ở `migrate/run.ts` (như plan), không trong `migrate()`: `migrate()` chỉ được gọi từ lệnh này; còn phần nguy hiểm (tài khoản mặc định) thì chặn NGAY TRONG hàm nên che mọi nơi gọi. **Ghi nhận, không sửa:** `migrate()` còn ghi vài mốc vào bảng `demo_config` (`migrated_at`, `normal_pass_threshold`…) — đó là mốc nâng cấp, không phải ngày demo hay dữ liệu demo. **`TRIEN_KHAI.md`:** mục 11.1 mới (ba bước: sao lưu → `PISA_CHO_PHEP_MIGRATE_TURSO` = URL bỏ `libsql://` → `npm run migrate`, chỉ khi session code yêu cầu); bảng mục 12 thêm biến `PISA_CHO_PHEP_MIGRATE_TURSO`. |
| 22/09 | 6e | **619/619** (= 614 + 5). **ĐỎ trước (TDD), hai lượt:** lượt 1 → 614 đạt / **5 ĐỎ**: (1)(2) `tenKhoTep is not a function`; (3) xoá biện pháp: `Tệp bị xoá khi giao dịch CHƯA chốt` (kho giả ghi lại `db().inTransaction` lúc bị gọi xoá = true); (4) `thu-turso` với `libsql://pisatracking-khong-ton-tai.turso.io` **đã kết nối** (mã thoát 0, bảng kết quả toàn `HỎNG · Hrana … Host not found`) — tức script tạo/xoá bảng chạy được vào tên kiểu bản chính; (5) giao dịch lồng: `no such savepoint: sp_1` **che mất lỗi gốc**. Lượt 2 (chỉ thêm `tenKhoTep`, chưa đổi `khoTepNetlify`) → phép Blobs đỏ đúng lý do `Tệp không nằm trong kho bang-chung-cuc-bo` (tệp lọt vào kho chung) — chứng minh phép kiểm bắt được đúng dây nối. Sau khi sửa: 619/619; `npm run thu-goi` ĐẠT 3/3 (gói Function vẫn chạy dù `khoTep.ts` giờ import `db.ts`). **Cách kiểm Blobs không cần mạng:** `BlobsServer` có sẵn trong `@netlify/blobs/server` + `setEnvironmentContext({ edgeURL, siteID, token })` — đúng giao thức Function dùng trên Netlify; đã thử trước bằng script nháp: kiểu `edgeURL` và kiểu `apiURL + siteID + token` (kiểu lệnh sao lưu sẽ dùng) đều ghi/đọc/liệt kê được. **Mã:** `tenKhoTep(url = database đang nối)` = `bang-chung-<phần đầu tên máy chủ>` (cắt 64 byte — giới hạn của Netlify), không Turso → `bang-chung-cuc-bo`; không truyền `url` thì lấy `DB_PATH` khi `laDbTuXa()` (nên `khoTep.ts` import `db.ts`; không vòng import vì `db.ts` chỉ import `moiTruong.ts`). `khoTepNetlify` dùng `getStore(tenKhoTep())` cho cả ghi/đọc/xoá. `deleteMeasure` gom `khoaTep` qua `purgeAttachmentsOf(…, khoaTep)` rồi `xoaTepSauGiaoDich(khoaTep)` SAU `tx` — đúng mẫu `violations.ts`. `thuTurso.ts` từ chối (trước khi mở kết nối) khi `laBanChinh()` hoặc `laTenDbBanChinh(url)` (luật của 6c). `db.ts` `tx`: `ROLLBACK TO` + `RELEASE` bọc `try/catch`, luôn ném lỗi gốc; vòng ngoài vẫn cuộn lại cả giao dịch (phép 5 kiểm `inTransaction` = false sau đó). **Step 6 — thử cú pháp trên site thật bằng biến VÔ HẠI, không đụng biến Turso:** Netlify CLI **27.8.0**. (a) Đọc (chỉ đọc) bản deploy nháp của Phần A `6ab1c9f4…` qua `netlify api getDeploy` → `context: "deploy-preview"` ⇒ bản nháp tạo bằng `netlify deploy --build` đọc biến ngữ cảnh **deploy-preview** (khớp giả định của mục 6). (b) Mô phỏng đúng tình huống thật: `env:set PISA_THU_NGU_CANH chung` (mọi ngữ cảnh, như biến Turso hiện nay) → `env:set PISA_THU_NGU_CANH rieng --context production` → `env:get … --context production` = **rieng**; `deploy-preview` = **chung**; `branch-deploy` = chung; `dev` = chung. (c) `env:unset PISA_THU_NGU_CANH` → gỡ ở mọi ngữ cảnh (production và deploy-preview đều báo 'No value set'); `env:list` (chỉ in TÊN) còn đúng `BAN_CHINH`, `TURSO_AUTH_TOKEN`, `TURSO_DATABASE_URL` (+ `NODE_VERSION`, `VITE_BAN_CHINH` của `netlify.toml`). ⇒ Cú pháp của plan đúng nguyên văn, không phải sửa. Ghi nhận: `env:set` **in lại cả giá trị** ('Set environment variable X=… in the production branch') → `TRIEN_KHAI.md` mục 6 nhắc đóng cửa sổ sau khi dán token. **`TRIEN_KHAI.md`:** mục 5 thêm câu 'áp cho mọi loại deploy; mục 6 tách riêng'; mục 6 viết lại (hai lệnh `--context production`, mỗi lệnh một khối, hai lệnh `env:get` kiểm URL, bảng 'phải in ra'); mục 8.1 'bản nháp luôn dùng database thử… đăng nhập bằng tài khoản demo'; mục 12 thêm cột **Áp cho**. Plan Task 8 Step 4: ghi chú dùng `tenKhoTep()`. |
| 22/09 | 7 · Step 1–2 (7a) | **619 → 619, không đổi số phép** (chuyển chỗ thuần tuý). **Cách chuyển:** một script cắt đúng các dòng `seed.ts` 42–69 (vai trò & quyền, kể cả `RETIRED_ROLES`), 155–159 (`seedRoutes(conn)` + chú thích), 161–172 (chương trình học) sang `server/src/seed/duLieuNen.ts` — chỉ bớt 2 dấu cách thụt lề và đổi đúng **một** chữ `NOW` → `now` (tham số của `napDuLieuNen(conn, now)`). `git diff` các dòng bị xoá so với thân hàm mới: khác đúng 1 chữ đó + dòng trống. `runSeed()` gọi `const { roleId } = napDuLieuNen(conn, NOW);` tại chỗ khối "vai trò & quyền" cũ (`permId` chỉ dùng trong khối nên không cần lấy ra); khối "tổ chức" ở lại `seed.ts`. Bỏ các import đã chuyển đi (`PERMISSION_LABEL`, `seedRoutes`, `ROLES`, `RETIRED_ROLES`, `ROLE_PERMISSIONS`); `PROGRAMME_TEMPLATES` còn dùng ở khối lớp nên giữ. **Hệ quả thứ tự:** lộ trình và chương trình giờ nạp TRƯỚC người dùng (trước đây sau) — mỗi bảng có dãy id riêng nên không id nào đổi. **Chứng minh mạnh hơn đếm phép:** dựng bộ demo bằng bản biên dịch CŨ (còn trong `dist-server/` trước khi build lại) vào file tạm A, build mã mới, dựng vào file tạm B, so từng bảng từng dòng theo rowid (bỏ qua dấu thời gian lúc chạy — kể cả dấu thời gian nằm trong chuỗi JSON của `audit_logs` — và muối/băm mật khẩu ngẫu nhiên): **cấu trúc giống hệt, mọi bảng giống hệt (2.412 dòng)**. Lượt so đầu (chưa chuẩn hoá dấu thời gian lồng trong JSON) đã báo khác ở `audit_logs` → phép so đủ nhạy. |
| 22/09 | 7 · Step 3–7 (7b) | **632/632** (= 619 + 13). **ĐỎ trước (TDD):** build hỏng TS2307 (chưa có module) → để thấy TỪNG phép đỏ, tạm đặt module mà ba hàm chỉ ném `CHƯA VIẾT` (chưa phải mã) → 619 đạt / **11 ĐỎ** đúng lý do (hàm chưa viết; lệnh `runInit.js`/`themChiNhanh.js` chưa có). Khi đỏ, siết một kỳ vọng lỏng của plan: mật khẩu yếu `/.+/` → `/ít nhất 6 ký tự/` (đúng câu của `accounts.ts`). Viết mã → **629/1 ĐỎ: `routes` bản chính 2 dòng, bộ demo 3** — truy nguyên nhân: bộ demo mới dựng có đúng 2 lộ trình (`LT1`, `LT2`), phép cũ `run.ts:4489` thêm `LT9` vào database kiểm thử → lỗi ở **phép kiểm mới của tôi** (so với database đã bị phép khác sửa), sửa phép đó: so với `napDuLieuNen` chạy trên file tạm mới tinh, từng dòng (bỏ `created_at`) → 630/630. **Ba tính chất có phép kiểm chứng minh:** (a) **từ chối + không ghi gì** — 4 tình huống (chạy nhầm lần hai · chỉ MỘT dòng ở `demo_config` · chỉ một bảng lạ ngoài schema có một dòng · chỉ một người dùng): ảnh chụp TOÀN BỘ database (cấu trúc + mọi dòng mọi bảng) trước/sau bằng nhau, `total_changes()` không đổi, không treo giao dịch; ở mức **lệnh thật**: chạy nhầm lần hai → `TỪ CHỐI … đã có dữ liệu`, **SHA-256 file database không đổi**; (b) **không dữ liệu demo, không ngày demo** — ngoài 12 bảng nền (permissions, roles, role_permissions, routes, programmes, programme_skills, programme_checkpoints, branches, reporting_units, users, user_roles, student_code_seq) MỌI bảng rỗng, `demo_config` rỗng hẳn (không `demo_date`, không kịch bản, không `seeded_at`), đủ số bảng như schema, đúng 1 người dùng `system_admin` (`branch_id` NULL), băm scrypt khớp mật khẩu đã cho và KHÔNG khớp `pisa2026`; dữ liệu nền giống hệt bộ demo từng dòng. Thêm: một giao dịch — schema lỗi ở câu cuối → không còn bảng nào. **Lệnh thật chạy bằng tiến trình con qua URL `file:`** (đi nhánh Turso, không mạng): thiếu biến → in đúng tên biến, không tạo file; chạy đúng → in `Sẽ khởi tạo database …`, `userId 1`, chi nhánh; **không in token, không in mật khẩu**; không có biến Turso → từ chối. **Khác plan / tự quyết (ghi để người rà xem):** (1) **`student_code_seq` (1, 1)** — xem dòng 'B · bắt đầu'. Đối chứng thật: database init xong, xoá dòng này, dán 2 học viên → `UNIQUE constraint failed: students.student_code`; có dòng → `PISA-000001`, `PISA-000002`. (2) Từ chối mật khẩu mặc định `pisa2026` ở `initBanChinh` (TRIEN_KHAI mục 7 đã dặn không dùng; không đổi luật mật khẩu của `accounts.ts`). (3) Mã chi nhánh: viết hoa, chỉ A–Z/0–9 (TRIEN_KHAI: 'viết liền, không dấu'), cấm `TUTOR` (trùng mã đơn vị Tutor — `reporting_units.code` UNIQUE), cấm tên có `^` hoặc `"`. (4) Tên hiển thị của quản trị: `Quản trị hệ thống` (plan không có biến tên; đổi được trong màn Tài khoản). (5) Kiểm rỗng hỏi `users` trước (database đang dùng thì dừng ở câu hỏi đầu — mỗi câu qua mạng ~0,5 s từ VN). (6) `themChiNhanh` (hàm thuần) nằm trong `initBanChinh.ts`; `ops/themChiNhanh.ts` chỉ là điểm chạy lệnh. Đơn vị báo cáo của chi nhánh thêm sau có `seq` = lớn nhất + 1 (đứng sau Tutor — không sửa dòng Tutor đã có). (7) `runInit.ts`/`themChiNhanh.ts` kiểm biến TRƯỚC, rồi mới `await import` mã dự án (`db.ts` đọc cấu hình lúc nạp; URL có mà thiếu token sẽ ném lỗi khó đọc). **LỖI THẬT tìm được khi chạy lệnh đúng như TRIEN_KHAI trong Windows PowerShell 5.1 (systematic-debugging):** `npm run them-chi-nhanh -- UB "Uông Bí"` lưu tên **`^Uông^ Bí^`** vào database. Thử trong thư mục nháp, in nguyên văn argv: script bắt đầu bằng `node` hoặc `echo` → tham số nguyên vẹn; script bắt đầu bằng **`npm`** (tệp `npm.cmd`) → `["UB","^Uông^ Bí^"]` ⇒ nguyên nhân gốc: npm 11.19 trên Windows **thoát kép** tham số khi lệnh ĐẦU của script là tệp `.cmd`, nhưng gắn tham số vào lệnh CUỐI (`node`). Sửa tận gốc: `"them-chi-nhanh": "node node_modules/typescript/bin/tsc -p tsconfig.build.json && node dist-server/server/src/ops/themChiNhanh.js"` (cùng lệnh biên dịch với `build:server`, chỉ gọi thẳng bằng node) — cú pháp trong TRIEN_KHAI giữ nguyên. Phòng thủ thêm: tên có `^`/`"` bị từ chối. Hai phép kiểm (tên có `^`/`"`; lệnh `them-chi-nhanh` phải bắt đầu bằng `node`) — ĐỎ trước, xanh sau. `init-ban-chinh`/`sao-luu` không nhận tham số dòng lệnh (chỉ biến môi trường) nên không dính. **Chạy lại trong PowerShell sau khi sửa (file tạm):** `init-ban-chinh` → `Xong. Đã tạo tài khoản quản trị quantri.pisa@gmail.com (userId 1) và 2 chi nhánh: MB (Monbay), BC (Bãi Cháy).`; chạy nhầm lần hai → `TỪ CHỐI … (bảng users)`, `Get-FileHash` không đổi; `them-chi-nhanh -- UB "Uông Bí"` và không có `--` → lưu đúng `Uông Bí`, `Hải Dương`; mã đã có → `TỪ CHỐI`, file không đổi. Lưu ý cho TRIEN_KHAI: PowerShell 5.1 hiện dòng `TỪ CHỐI` bằng chữ đỏ kèm `NativeCommandError` — là cách PowerShell hiện stderr, đúng nghĩa 'bị từ chối'. **`package.json`:** `init-ban-chinh`, `them-chi-nhanh`. `accounts.ts`: export `hashPassword`. |
