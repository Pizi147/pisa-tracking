# Bản chính trên Netlify + Turso — Implementation Plan (PR-Z2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task,
> in order. Steps use checkbox (`- [ ]`) syntax — tick each one in THIS file as you finish it. Tasks marked 🛑 are
> **gates**: stop, report to the owner, and wait for an explicit answer before continuing.

> **CHIA BA PR (chốt 21/09/2026 chiều):** plan này thực thi thành **ba PR nối tiếp, ba session riêng**, merge theo
> thứ tự. Mỗi session **chỉ làm phần của mình** — xem mục "Ba phần" ngay dưới Global Constraints.
>
> | PR | Task | Nội dung | Model khuyến nghị |
> |---|---|---|---|
> | **PR-Z2a** | 0 → 6b | Hạ tầng: libsql, Turso, kho tệp, Netlify Function, tắt demo, **deploy nháp thật** | Sonnet 5 · High |
> | **PR-Z2b** | 7 → 9 | An toàn dữ liệu bản chính: khởi tạo, chi nhánh, sao lưu, tài liệu | Opus 5 · XHigh (B: Fable 5.1 · High) |
> | **PR-Z2c** | 10 → 11 | Deploy bản chính + đo tốc độ + rà soát độc lập | Opus 5 · XHigh (B: Fable 5.1 · High); **người rà ≠ người code** |

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
| **B · PR-Z2b** | Task 7 → Task 9 | PR-Z2a **đã merge** | Mở PR, không merge |
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

- [ ] **Step 1:** Gọi skill `superpowers:using-git-worktrees`, tạo nhánh `pr-z2-netlify-turso` từ `main` mới nhất.
      Kiểm `git log --oneline -3` có commit merge của **PR-T và PR-K**. Chưa có → 🛑 dừng, báo chủ sản phẩm.
- [ ] **Step 2:** `npm install` rồi `npm run check`. Ghi **số phép kiểm hiện tại** vào Nhật ký (gọi là `N0`).
- [ ] **Step 3:** Đọc: `plan.md` mục 24, `TRIEN_KHAI.md`, `server/src/db.ts`, `server/src/app.ts`,
      `server/src/platform/attachments.ts`, `server/src/seed/seed.ts` dòng 1–200.
- [ ] **Step 4:** Chạy và **dán kết quả vào Nhật ký** (dùng ở Task 5 và 7):
      ```bash
      grep -rn "readFileSync\|existsSync\|readdirSync" server/src --include=*.ts | grep -v tests
      grep -rn "INSERT INTO" server/src/seed/seed.ts | head -40
      ```

---

### Task 1: Đổi `better-sqlite3` → `libsql` (vẫn file cục bộ)

**Files:**
- Modify: `package.json`, `server/src/db.ts`, `server/src/migrate.ts`, `server/src/tests/yThuc.tests.ts`, `server/src/app.ts`
- Modify (chỉ nếu có): mọi file khác có chuỗi `better-sqlite3` (`grep -rln "better-sqlite3" server/src scripts`)

**Interfaces:**
- Produces: `db()` trả kiểu `Database` của `libsql` (cùng API `prepare/get/all/run/exec/pragma/transaction/inTransaction/close`).
- Produces: `tx<T>(fn: () => T): T` — **gọi lồng được** (dùng SAVEPOINT khi đã ở trong giao dịch).

Lý do từng sửa đổi (đã tái hiện ở phép thử 21/09):
- `libsql` **không** cho `db.transaction()` lồng trong giao dịch khác → lỗi `cannot start a transaction within a
  transaction` (14 phép kiểm). `better-sqlite3` tự dùng savepoint.
- `libsql` hiểu `.run(null)` (đúng **một** tham số `null`) là "đối tượng tham số có tên" → lỗi `failed to downcast
  any to object`.

- [ ] **Step 1: Cài gói.**
  ```bash
  npm install libsql@0.5.29 --save-exact
  npm uninstall better-sqlite3 @types/better-sqlite3
  ```
- [ ] **Step 2: Đổi import.** Trong **mọi** file có `better-sqlite3`:
  - `import Database from 'better-sqlite3';` → `import Database from 'libsql';`
  - `import('better-sqlite3')` → `import('libsql')`
  - Kiểu `Database.Database` → giữ nguyên nếu `tsc` chấp nhận; nếu không, dùng `InstanceType<typeof Database>`.
- [ ] **Step 3: `tx` gọi lồng được.** Trong `server/src/db.ts` thay hàm `tx` bằng:
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
- [ ] **Step 4: Các `conn.transaction(...)` gọi thẳng.** Chạy `grep -rn "\.transaction(" server/src --include=*.ts | grep -v tests`.
      Với mỗi chỗ **ngoài** `db.ts` có thể chạy khi đã ở trong một `tx(...)`: đổi thành `tx(() => { ... })`.
      Chỗ nào chắc chắn chạy độc lập (điểm vào của lệnh `migrate`) thì giữ. Ghi danh sách đã đổi vào Nhật ký.
- [ ] **Step 5: `.run(null)`.** Trong `server/src/migrate.ts`, câu `UPDATE sos_cases SET merge_until = ? … .run(null)`
      → đổi SQL thành `SET merge_until = NULL` và gọi `.run()`. Rồi quét toàn bộ:
      `grep -rnE "\.(run|get|all|iterate)\(\s*(null|undefined)\s*\)" server/src --include=*.ts` — phải **rỗng**.
- [ ] **Step 6: Phép kiểm J9 trên Windows.** Trong `server/src/tests/yThuc.tests.ts`, phép kiểm "Nâng cấp một database
      THẬT của thời trước PR-J": mọi kết nối mở tới file trong thư mục tạm phải được `.close()` **trước** lệnh xoá thư
      mục tạm (`fs.rmSync(...)`). Bọc xoá thư mục bằng `try { … } catch { /* Windows còn giữ file — bỏ qua dọn dẹp */ }`
      **chỉ** quanh lệnh xoá, không quanh phần kiểm.
- [ ] **Step 7: Lỗi ràng buộc.** Trong `server/src/app.ts`, điều kiện nhận lỗi trùng dữ liệu đổi thành:
  ```ts
  const code = (err as { code?: unknown })?.code;
  if (/SQLITE_CONSTRAINT|constraint failed/i.test(message) || (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT'))) {
  ```
- [ ] **Step 8:** `npm run check`. **Phải đủ `N0` phép, tất cả đạt.** Chưa đủ → systematic-debugging; không sửa phép kiểm cũ.
- [ ] **Step 9:** Commit: `PR-Z2 (1): đổi better-sqlite3 sang libsql, giao dịch lồng bằng savepoint`.

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

- [ ] **Step 1: Đăng ký file kiểm thử mới.** Trong `server/src/tests/run.ts`, ngay dưới hàm `check`, thêm:
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
- [ ] **Step 2: Viết phép kiểm đỏ.** Tạo `server/src/tests/banChinh.tests.ts`:
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
  }
  ```
- [ ] **Step 3:** `npm test` → ba phép mới **đỏ** (chưa có `moiTruong.ts`). Ghi vào Nhật ký.
- [ ] **Step 4: Tạo `server/src/moiTruong.ts`:**
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
- [ ] **Step 5: Dùng trong `server/src/db.ts`.** Giữ nguyên `ROOT`, `SCHEMA_PATH`. Thay phần mở kết nối:
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
        instance = new Database(CAU_HINH.url, { authToken: CAU_HINH.authToken });
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
- [ ] **Step 6: Chặn seed vào Turso.** Đầu `server/src/seed/run.ts`, trước mọi thứ:
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
- [ ] **Step 7:** `npm run check` xanh, số phép = `N0 + 4`. Commit: `PR-Z2 (2): cấu hình kết nối theo môi trường, chặn seed vào Turso`.

---

### Task 3 🛑 GATE: Thử Turso thật

**Mục đích:** chứng minh đường đồng bộ `libsql` chạy được **qua mạng**, và đủ nhanh. Nếu không → dừng cả plan.

**Files:** Create `server/src/ops/thuTurso.ts`; Modify `package.json` (lệnh `thu-turso`).

- [ ] **Step 1: Hỏi chủ sản phẩm** (đúng nguyên văn):
  > Cần một database Turso **để thử** (không phải bản chính): tạo database tên `pisa-thu-nghiem` theo `TRIEN_KHAI.md`
  > mục 2, chọn vùng **AWS US East (Ohio) — `aws-us-east-2`** nếu có, rồi gửi tôi URL và token của database thử này.
  > Đồng thời cho tôi biết vùng Functions của site Netlify (Netlify → Site configuration → Functions → Region) nếu đã tạo site.
- [ ] **Step 2: Viết `server/src/ops/thuTurso.ts`** — chạy độc lập, in bảng kết quả, **không** đụng bảng thật:
  ```ts
  import Database from 'libsql';
  import { cauHinhDb } from '../moiTruong.ts';

  const c = cauHinhDb();
  if (c.kieu !== 'turso') { console.error('Cần TURSO_DATABASE_URL + TURSO_AUTH_TOKEN'); process.exit(1); }
  const conn = new Database(c.url, { authToken: c.authToken });
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
- [ ] **Step 3: Chạy** với token của database **thử**: `$env:TURSO_DATABASE_URL="..."; $env:TURSO_AUTH_TOKEN="..."; npm run thu-turso`.
      Dán nguyên bảng vào Nhật ký.
- [ ] **Step 4: Thử nặng** — dựng bộ demo lên database **thử** (được phép vì là database thử; seed đang bị Task 2 chặn
      với Turso, nên chạy qua một lệnh riêng):
      `$env:PISA_CHO_PHEP_SEED_TURSO="pisa-thu-nghiem"; npm run seed` (ngoại lệ đã làm ở Task 2 Step 6).
      Ghi **thời gian** chạy vào Nhật ký.
- [ ] **Step 5: Thử trang thật qua Turso:** chạy `npm run dev` với hai biến Turso của database thử, đăng nhập tài khoản
      demo Quản lý Monbay, **đo thời gian tải** (tab Network của trình duyệt, cột Time của lời gọi `/api/...` lớn nhất)
      cho: hồ sơ học viên Lê Quang Huy · bảng nhập điểm lớp MB-FT 101 · Tổng quan · Thực trạng · tab Ý thức & Phối hợp của
      MB-FT 101. Ghi bảng vào Nhật ký.
- [ ] **Step 6: Quyết định — theo đúng bảng này:**

  | Kết quả | Làm gì |
  |---|---|
  | Mục 2, 5, 6, 7 đều ĐẠT **và** mọi trang ở Step 5 ≤ 3 giây | ✅ Đi tiếp Task 4 |
  | Mục 2, 5, 6, 7 ĐẠT, có trang **> 3 giây** | Đi tiếp, nhưng ghi các trang đó vào Nhật ký — xử lý ở Task 10 Step 6 |
  | Có trang **> 10 giây** | 🛑 **Dừng.** Báo chủ sản phẩm + session thiết kế: kèm bảng đo. Không tự tối ưu |
  | Mục 5, 6 hoặc 7 **HỎNG** | 🛑 **Dừng cả plan.** Đường đồng bộ không dùng được qua mạng. Báo chủ sản phẩm; **không** tự chuyển sang async |

  Ghi lưu ý: máy chủ sản phẩm ở Việt Nam còn Turso ở Mỹ → số đo ở Step 5 **tệ hơn** thực tế trên Netlify (Function và
  Turso cùng vùng). Nếu Step 5 chậm, đo lại mục 1 để ước: *thời gian trên Netlify ≈ số câu hỏi DB × (độ trễ cùng vùng
  ~1–5 ms)*. Ghi ước lượng vào Nhật ký, **dựa vào số đo thật ở Task 10** để quyết định cuối cùng.
- [ ] **Step 7:** Commit: `PR-Z2 (3): script thử Turso + kết quả gate`.

---

### Task 4: Kho tệp — ổ đĩa (dev) và Netlify Blobs (bản chính)

**Files:**
- Create: `server/src/platform/khoTep.ts`
- Modify: `server/src/platform/attachments.ts`, `shared/domain/attachments.ts`, `server/src/routes/index.ts` (đường tải), `package.json`
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

- [ ] **Step 1:** `npm install @netlify/blobs@<bản mới nhất> --save-exact` (ghi số bản vào Nhật ký).
      Đọc README của gói trong `node_modules/@netlify/blobs/README.md` phần **Lambda compatibility mode** (`connectLambda`).
- [ ] **Step 2: Phép kiểm đỏ** — thêm vào `banChinh.tests.ts` (dùng kho giả trong bộ nhớ, không cần mạng):
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
- [ ] **Step 3:** `npm test` → đỏ. Ghi Nhật ký.
- [ ] **Step 4: Tạo `server/src/platform/khoTep.ts`:**
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
- [ ] **Step 5: Sửa `server/src/platform/attachments.ts`** — thay mọi `fs.*` bằng kho:
  - `addFile`: kiểm quyền và kích thước **như cũ**, rồi `await khoTepHienTai(uploadsDir()).ghi(khoa, input.data, mime)` với
    `khoa = \`${input.ownerType}/${stored}\`` (**đúng** định dạng `url` đang lưu ở bảng — kiểm lại bằng dòng hiện tại
    `path.join(dir, stored)` và giá trị `url` được INSERT), sau đó INSERT dòng bảng; INSERT lỗi → `await kho.xoa(khoa)` rồi ném lại.
  - `openAttachment`: kiểm quyền như cũ; tệp → `const duLieu = await kho.doc(r.url)`; `null` → `notFound('Tệp không còn trên máy chủ')`.
  - `removeAttachment`: xoá dòng bảng + audit **trước**, rồi `await kho.xoa(r.url)` (xoá tệp lỗi → `console.error`, không ném).
  - `purgeAttachmentsOf`: **giữ đồng bộ**, chỉ xoá dòng bảng + audit, **không** xoá tệp trong kho. Lý do: hàm này chạy
    bên trong `tx(...)` (xoá vi phạm); xoá tệp là việc bất đồng bộ không cuộn lại được. Tệp mồ côi vô hại ở quy mô này.
    Viết đúng lý do này thành chú thích tại hàm.
  - `shared/domain/attachments.ts`: `ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024`; thông báo lỗi `'Tệp quá lớn: tối đa 4 MB.'`
    (tìm và đổi **mọi** chỗ ghi "10 MB": `grep -rn "10 MB" server web shared`).
- [ ] **Step 6: Route tải xuống** (`server/src/routes/index.ts`, `GET /attachments/:id/download`): `const o = await ...`;
      thay `res.sendFile(o.absPath)` bằng `res.send(o.duLieu)`. Giữ nguyên ba header an toàn. Các route thêm/xoá tệp: thêm `await`.
- [ ] **Step 7:** `npm run check` xanh (các phép N5 cũ của PR-N phải còn xanh — chúng chạy với kho ổ đĩa). Commit:
      `PR-Z2 (4): kho tệp — ổ đĩa ở máy dev, Netlify Blobs ở bản chính; giới hạn 4 MB`.

---

### Task 5: Netlify Function + `netlify.toml`

**Files:** Create `netlify/functions/api.ts`, `netlify.toml`; Modify `server/src/app.ts`, `package.json`.

**Interfaces:** Consumes `createApp()` (có sẵn, `server/src/app.ts`).

- [ ] **Step 1:** `npm install serverless-http@<bản mới nhất> --save-exact`. Ghi số bản.
- [ ] **Step 2: Đường dẫn Express nhìn thấy.** Trong `createApp()` của `server/src/app.ts`, dòng **đầu tiên** sau `express()`:
  ```ts
  /* Trên Netlify, lời gọi /api/x được chuyển tới /.netlify/functions/api/x. Đưa về /api/x để mọi route giữ nguyên. */
  app.use((req, _res, next) => {
    const tienTo = '/.netlify/functions/api';
    if (req.url.startsWith(tienTo)) req.url = '/api' + req.url.slice(tienTo.length);
    next();
  });
  ```
- [ ] **Step 3: Tạo `netlify/functions/api.ts`:**
  ```ts
  /**
   * MÁY CHỦ BẢN CHÍNH trên Netlify — chính ứng dụng Express của máy dev (`createApp`), bọc thành một Function.
   * Không có logic nghiệp vụ nào ở đây.
   */
  import serverless from 'serverless-http';
  import { connectLambda } from '@netlify/blobs';
  import { createApp } from '../../server/src/app.ts';

  const app = createApp();
  const xuLy = serverless(app, {
    binary: ['multipart/form-data', 'application/octet-stream', 'image/*', 'application/pdf',
             'application/msword', 'application/vnd.*'],
  });

  export const handler = async (event: any, context: any) => {
    connectLambda(event);           // cho @netlify/blobs biết site/đường vào kho trong chế độ Lambda
    return xuLy(event, context);
  };
  ```
- [ ] **Step 4: Tạo `netlify.toml`:**
  ```toml
  [build]
    command = "npm run build"
    publish = "dist/web"

  [build.environment]
    NODE_VERSION = "20"
    VITE_BAN_CHINH = "1"

  [functions]
    directory = "netlify/functions"
    node_bundler = "esbuild"
    external_node_modules = ["libsql"]
    included_files = ["server/src/schema.sql"]

  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/api/:splat"
    status = 200

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
  Thêm vào `included_files` mọi file **không phải .ts** mà Task 0 Step 4 cho thấy được đọc lúc chạy **trong đường API**
  (không tính seed/migrate). Ghi quyết định vào Nhật ký.
- [ ] **Step 5: Thử cục bộ bằng Netlify CLI:**
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
- [ ] **Step 6:** `npm run check` xanh; `npm run dev` vẫn chạy như cũ. Commit: `PR-Z2 (5): máy chủ thành Netlify Function`.

---

### Task 6: Tắt mọi thứ của bản demo khi bản chính

**Files:** Modify `server/src/demoConfig.ts`, `server/src/routes/index.ts`; Create `web/src/lib/banChinh.ts`;
Modify `web/src/App.tsx`, `web/src/modules/platform/WelcomePage.tsx`; Test `banChinh.tests.ts`.

**Interfaces:** Consumes `laBanChinh()`. Produces `LA_BAN_CHINH: boolean` (web).

- [ ] **Step 1: Phép kiểm đỏ** (thêm vào `banChinh.tests.ts`):
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
- [ ] **Step 2:** `npm test` → đỏ.
- [ ] **Step 3: Máy chủ.** `demoToday()`: `if (laBanChinh()) return todayInBusinessTz();` ở dòng đầu. `scenarioMode()`:
      `if (laBanChinh()) return 'normal';`. Trong `routes/index.ts`, một middleware đặt **trước** mọi route `/demo`:
  ```ts
  api.use('/demo', (req, res, next) => {
    if (!laBanChinh()) return next();
    res.status(404).json({ error: 'Không tìm thấy endpoint.' });
  });
  ```
  Nếu màn đăng nhập thật đang gọi một route dưới `/demo` (ví dụ `GET /demo/session` để biết đã đăng nhập chưa) — kiểm
  bằng cách đọc `WelcomePage.tsx` và `web/src/lib/session.tsx` — thì **cho qua đúng route đó** và ghi vào Nhật ký.
  Cookie phiên (hai chỗ `res.cookie(SESSION_COOKIE, ...)`): thêm `secure: laBanChinh()`.
- [ ] **Step 4: Giao diện.** `web/src/lib/banChinh.ts`:
  ```ts
  /** Bản chính (Netlify) — đặt bởi netlify.toml. Máy dev và bản build thử không có biến này. */
  export const LA_BAN_CHINH = import.meta.env.VITE_BAN_CHINH === '1';
  ```
  `App.tsx`: `{!LA_BAN_CHINH && <DemoBar />}`. `WelcomePage.tsx`: khi `LA_BAN_CHINH` thì **không** render tab
  "Vào nhanh bằng tài khoản demo" và **không** gọi `useApi('/demo/accounts')` (truyền `null`), không hiện dòng gợi ý mật
  khẩu mặc định `pisa2026` nếu có. Route `/dev/thanh-phan` đã tự tắt ở bản build (`import.meta.env.DEV`) — giữ nguyên.
- [ ] **Step 5:** `npm run check` xanh. `$env:VITE_BAN_CHINH="1"; npm run build` rồi
      `grep -rl "Vào nhanh bằng tài khoản demo" dist/web` → **rỗng**. Commit: `PR-Z2 (6): bản chính tắt mọi thứ của demo`.

---

### Task 6b 🛑 GATE: Gói chạy được trên Linux + deploy nháp thật  *(cuối Phần A)*

**Vì sao:** chủ sản phẩm deploy **thủ công từ máy Windows**. `libsql` có phần nhị phân riêng cho từng hệ điều hành; build
trên Windows mà không làm gì thì gói gửi lên chỉ có bản Windows → Function chết trên Netlify. Task này chứng minh
**toàn bộ hạ tầng** (Linux + Turso qua Netlify + Blobs + tắt demo) chạy thật **trước** khi đụng tới dữ liệu bản chính,
và cho **số đo tốc độ thật** (Netlify ↔ Turso cùng vùng), thay cho số đo từ máy ở Việt Nam ở Task 3.

**Files:** Modify `package.json`, `package-lock.json`, `netlify.toml`.

- [ ] **Step 1: Gói nhị phân Linux.** Xem phiên bản cần:
      `node -p "require('./node_modules/libsql/package.json').optionalDependencies"`.
      Cài đúng phiên bản của mục `@libsql/linux-x64-gnu`:
      `npm install --save-optional --force @libsql/linux-x64-gnu@<phiên bản đó>` (`--force` vì máy Windows không phải Linux).
      Kiểm `node_modules/@libsql/linux-x64-gnu/` có file `.node`.
- [ ] **Step 2:** `netlify.toml` → `external_node_modules = ["libsql", "@libsql/linux-x64-gnu"]`.
- [ ] **Step 3: Kiểm gói trước khi gửi.** `netlify build` rồi liệt kê gói Function:
      `tar -tf .netlify/functions/api.zip | findstr linux-x64-gnu` (PowerShell) — **phải** có dòng. Không có → 🛑 dừng,
      ghi Nhật ký, không thử đường khác.
- [ ] **Step 4: Hỏi chủ sản phẩm** (nguyên văn):
      > Tôi cần deploy **nháp** (địa chỉ riêng, chưa phải bản chính) để kiểm hạ tầng. Bạn làm giúp theo `TRIEN_KHAI.md`
      > mục 3 (cài và đăng nhập Netlify CLI), mục 4 (tạo site) và mục 5 với database **thử** `pisa-thu-nghiem`
      > (không phải bản chính). Xong báo tôi một câu "đã xong mục 3-4-5 với database thử".
- [ ] **Step 5: Deploy nháp.** Trong thư mục repo: `netlify deploy --build` (**không** có `--prod`). Ghi địa chỉ nháp
      (dạng `https://<mã>--<tên-site>.netlify.app`) vào Nhật ký.
- [ ] **Step 6: Kiểm trên địa chỉ nháp**, ghi từng dòng vào Nhật ký:
  1. `<địa chỉ nháp>/api/health` → `{"ok":true,...}` (Function chạy trên Linux, nối được Turso).
  2. Màn đăng nhập **không** có tab "Vào nhanh", **không** có thanh demo.
  3. Đăng nhập bằng một tài khoản của bộ demo đã dựng lên database thử ở Task 3 Step 4 (email và mật khẩu demo trong
     `README.md`).
  4. Mở hồ sơ một học viên, tải lên một ảnh ~1 MB, tải xuống lại — mở được (Blobs chạy).
  5. Mở một link sâu `<địa chỉ nháp>/hoc-vien/<id>` bằng tab mới — ra đúng trang, không 404.
- [ ] **Step 7: Đo tốc độ thật** — năm trang như Task 3 Step 5, mỗi trang 3 lần **sau** lần tải đầu, ghi trung bình và
      thời gian lần đầu (khởi động lạnh). Ghi bảng vào Nhật ký.
- [ ] **Step 8: Quyết định:**

  | Kết quả | Làm gì |
  |---|---|
  | Step 6 đủ 5 dòng đạt, mọi trang ≤ 3 giây | ✅ Kết thúc Phần A |
  | Step 6 đạt, có trang 3–10 giây | ✅ Kết thúc Phần A, ghi các trang đó — Phần C xử lý (Task 10 Step 6) |
  | Có trang > 10 giây, **hoặc** Step 6 có dòng hỏng | 🛑 Dừng. Báo chủ sản phẩm + session thiết kế kèm Nhật ký |

- [ ] **Step 9:** Commit `PR-Z2 (6b): đóng gói nhị phân Linux cho libsql`. Kết thúc Phần A (xem mục "Ba phần").

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

- [ ] **Step 1: Tách dữ liệu nền.** Tạo `server/src/seed/duLieuNen.ts` bằng cách **chuyển nguyên văn** (cắt–dán, không
      viết lại) các khối trong `runSeed()`: "vai trò & quyền" (kể cả `RETIRED_ROLES`), `seedRoutes(conn)`, "chương trình
      học". `runSeed()` gọi `const { roleId, permId } = napDuLieuNen(conn, NOW);` tại đúng vị trí cũ. Khối "tổ chức"
      (chi nhánh, reporting_units) **ở lại** `seed.ts`.
- [ ] **Step 2:** `npm run check` → **phải xanh, không đổi số phép** (đây là bước chuyển chỗ thuần tuý; phép kiểm đếm
      vai trò/quyền của bộ demo sẽ bắt nếu chuyển thiếu). Commit riêng: `PR-Z2 (7a): tách dữ liệu nền dùng chung`.
- [ ] **Step 3: Phép kiểm đỏ** (thêm vào `banChinh.tests.ts`) — chạy trên **file tạm riêng**, không đụng DB demo:
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
- [ ] **Step 4:** `npm test` → đỏ.
- [ ] **Step 5: Viết `server/src/ops/initBanChinh.ts`.** Bắt buộc theo thứ tự:
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
- [ ] **Step 6: Điểm chạy.** `server/src/ops/runInit.ts`: bắt buộc có `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
      `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CHI_NHANH` (thiếu cái nào → in tên cái thiếu, thoát mã 1); in
      `Sẽ khởi tạo database <URL> (không in token) với các chi nhánh: ...`; gọi `initBanChinh(db(), {..., schemaSql:
      fs.readFileSync(SCHEMA_PATH,'utf8'), now: new Date().toISOString()})`; in kết quả. `themChiNhanh.ts`: đọc hai tham số
      dòng lệnh `MA "Tên"`. `package.json`:
      `"init-ban-chinh": "npm run build:server && node dist-server/server/src/ops/runInit.js"`,
      `"them-chi-nhanh": "npm run build:server && node dist-server/server/src/ops/themChiNhanh.js"`.
- [ ] **Step 7:** `npm run check` xanh. Commit: `PR-Z2 (7b): init-ban-chinh và them-chi-nhanh`.

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

**Cần chủ sản phẩm:** site Netlify đã tạo ở Task 6b và database Turso **bản chính** `pisa-ban-chinh` (khác database
thử). Hỏi rõ từng thứ; **không** dùng database thử làm bản chính. Deploy **chỉ bằng Netlify CLI** từ thư mục repo.

- [ ] **Step 1: Hỏi chủ sản phẩm:** (a) đã tạo `pisa-ban-chinh` cùng vùng với database thử chưa; (b) đã **đổi** hai biến
      Turso của site sang database bản chính theo `TRIEN_KHAI.md` mục 6 chưa (từ giờ mọi bản nháp cũng trỏ vào bản
      chính); (c) danh sách chi nhánh thật `MA=Tên`; (d) email quản trị. **Mật khẩu quản trị để chủ sản phẩm tự gõ** ở
      Step 3 — không xin, không ghi.
- [ ] **Step 2: Deploy nháp** bằng `netlify deploy --build` (không `--prod`) từ `main` mới nhất. Ghi địa chỉ nháp.
- [ ] **Step 3: Khởi tạo** — chủ sản phẩm tự chạy trên máy mình (`TRIEN_KHAI.md` mục 7) với database **bản chính**. Bạn chỉ
      hướng dẫn. Kết quả phải in `userId` và danh sách chi nhánh.
- [ ] **Step 4: Luồng từ đầu tới cuối trên bản xem trước** — làm cùng chủ sản phẩm, tick từng dòng, ghi thời gian:
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
      xem mẫu, hay xoá. Muốn xoá: **không** có lệnh xoá tự động; hướng dẫn chủ sản phẩm tạo lại database `pisa-ban-chinh`
      trên Turso (xoá database và tạo lại cùng tên, cập nhật token trên Netlify nếu đổi) rồi chạy lại Step 3.
- [ ] **Step 8: Đưa lên địa chỉ chính thức** — **hỏi chủ sản phẩm đồng ý trước**, rồi `netlify deploy --build --prod`.
      Mở `https://<tên-site>.netlify.app` → đăng nhập được, dữ liệu Step 4 còn (hoặc rỗng nếu đã dọn ở Step 7).
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

---

## Nhật ký thực thi

*(Người thực thi ghi vào đây: số phép kiểm, kết quả gate, mọi điều bất ngờ, mọi quyết định khi plan im lặng.)*

| Thời điểm | Task | Ghi chép |
|---|---|---|
| | 0 | `N0` = |
