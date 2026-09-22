# PR-AN · An toàn trước người dùng thật — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task, in order. Steps use checkbox (`- [ ]`) syntax — tick
> each one in THIS file as you finish it. Tasks marked 🛑 are **gates**: stop, report to the owner, wait for an explicit answer.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Opus 5 · High** |
| Phương án B | **Fable 5.1 · High** |
| Người rà soát | **Fable 5.1** (khác model người code). Nếu người code là Fable (phương án B) thì người rà là Opus 5 hoặc Sonnet 5 — ghi rõ vào Nhật ký |
| Subagent | Nếu dùng subagent-driven-development: **subagent cùng model với session** (Opus 5, hoặc Fable 5.1 nếu chạy phương án B). **Không giao cho Haiku.** Dòng `Co-Authored-By` của commit phải ghi đúng model thật |
| Số PR | **Một PR**, nhánh `pr-an-an-toan`, không draft, **không tự merge** |
| Đợt | **Đợt 1**, code **song song PR-O** (nhánh `pr-o-khung-4-khu-vuc`) và **PR-S1** (nhánh `pr-s1-luat-may-chu`) |
| Thứ tự merge | **Merge SAU PR-O và PR-S1.** Trước khi mở PR: `git fetch && git rebase origin/main`. Xung đột ở `server/src/tests/run.ts` và `server/src/routes/index.ts` → **giữ cả hai khối**. Cách gỡ từng file: Task 13 |

**Goal:** Chặn các lỗ an toàn trước khi giáo viên thật dùng bản chính: giới hạn số lần thử đăng nhập/đăng ký (AN-1), không lộ
câu SQL/thông điệp nội bộ trong lỗi 409/500 (AN-3), `/api/health` rẻ và không lộ gì (AN-4), không mở giao dịch Turso khi hàm
Netlify sắp hết 10 giây (AN-5), khoá chắc luồng đăng ký phải Quản trị hệ thống duyệt (AN-6), màn đăng nhập bản chính báo đúng
khi máy chủ hỏng (AN-7), bỏ N+1 đếm bằng chứng trên thẻ Case (AN-8), và chốt dấu "-" tự chạy đầu thứ Hai kể cả khi không ai
mở web (RB-1).

**Architecture:** Mỗi việc một mô-đun nhỏ, có hàm thuần kiểm được: `server/src/platform/gioiHanThu.ts` (đếm lần thử trong
bảng mới `auth_attempts` — bộ nhớ trong hàm Netlify không bền giữa các lần gọi), `server/src/platform/hanGio.ts` (hạn giờ mỗi
lời gọi qua `AsyncLocalStorage`, `tx()` hỏi trước khi mở giao dịch), `server/src/platform/suKhoe.ts` (`/api/health` có nhớ
kết quả), `server/src/ops/chotVangDinhKy.ts` (một hàm gọi `settleNoShows(ngày)` — **không sửa** `settleNoShows`) được một
Netlify Scheduled Function mới `netlify/functions/chot-vang.ts` gọi theo lịch trong `netlify.toml`. `app.ts` giữ bộ xử lý
lỗi (`traLoiLoi`) và middleware `demGio`. Web chỉ sửa `WelcomePage.tsx`.

**Tech Stack:** TypeScript 5.9 · Express 4 · `libsql` 0.5.29 (SQLite khi dev, Turso khi bản chính) · Netlify Functions (v1
`handler`, gói bằng esbuild) · harness tự viết `server/src/tests/run.ts` (`check` / `checkAsync` / `assert` / `assertThrows` —
**không phải** Jest, **không có bộ lọc**: luôn chạy cả bộ, tìm tên phép kiểm trong kết quả) · React 18 (một màn).

**Spec:** `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` (§5 quyết định **4.6** "Netlify Scheduled
Function chốt '-' đầu thứ Hai", **4.11** "Giữ `/auth/register`, tài khoản phải QTHT duyệt; thêm giới hạn số lần thử"; §7 dòng
**AN**). Việc gốc: `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.9 (AN-1…AN-8), §1.7 (RB-1), §4 (câu 4.6,
4.11), §5.2 (ma trận chồng file). Hạ tầng: `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md` (Task 5, 6, 6b; Task
10–11 thuộc **PR-Z2c**, không thuộc PR này) · `TRIEN_KHAI.md`. Chữ: `thiet-ke/THUAT_NGU_DA_CHOT.md` (g14-054, g14-103).

**Số dòng trong plan này** đo trên `main` @ `9ed8db7` (22/09/2026) — mã giống hệt `d7a061c` mà PR-O/PR-S1 đo. Trước khi sửa,
mở file xem lại — lệch vài dòng là bình thường; **lệch nội dung** thì 🛑 hỏi.

---

## Global Constraints

- **An toàn dữ liệu.** Bản chính (Turso `pisatracking-…`) **đang rỗng** và **không bao giờ** được chạm trong PR này. Không đặt
  `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `PISA_CHO_PHEP_MIGRATE_TURSO`, `PISA_CHO_PHEP_SEED_TURSO`, `BAN_CHINH` trong cửa sổ
  làm việc. **Không** `netlify deploy --prod`, **không** `netlify deploy` gì cả (deploy là việc PR-Z2c). `npm test` tự gỡ biến
  Turso và chạy trên `data/test.sqlite`; `npm run migrate` chỉ chạy trên **bản sao** database dev (Task 13).
- **Migration idempotent, chạy lặp được** (luật repo, mẫu PR-S1): chỉ tạo bảng khi chưa có; chạy lần hai `applied` rỗng. Bảng mới
  phải có ở **cả** `schema.sql` (bản chính dựng từ đây ở PR-Z2c `init-ban-chinh`) **lẫn** `migrate.ts` (database dev đang có).
- **Không sửa (thuộc PR chạy song song):** `web/src/App.tsx`, `web/src/modules/worklist/OverviewPage.tsx`, khối `nav` và
  `/demo/session` của `server/src/routes/index.ts` (~dòng 66–170), `server/src/fasttrack/absence.ts`,
  `server/src/worklist/branchpulse.ts`, `server/src/worklist/signals.ts`, `server/src/cases/signals.ts`, `reportIssue` và
  `canCloseCase` trong `server/src/cases/cases.ts`, dòng `canClose:` (~2234) của `skillSupportBoard`, mọi cột/bảng PR-S1 thêm ở
  `schema.sql`/`migrate.ts`, `web/src/lib/session.tsx` (PR-O đổi kiểu). **Chỉ gọi** `settleNoShows(ngày)`, không sửa nó.
- **Được sửa trong `routes/index.ts`:** chỉ khối `/auth` (~dòng 1561–1600) + một dòng import ở đầu file.
- **Phép kiểm mới** nằm ở file mới `server/src/tests/anToan.tests.ts`, nối vào `run.ts` bằng **3 dòng** ngay trước khối in tổng
  kết (sau khối PR-Z2). PR-O cũng nối ở đó, PR-S1 nối trước khối PR-Z2 → khi rebase giữ cả ba khối.
- **Không đổi luật nghiệp vụ.** Thấy luật khác có vẻ sai → ghi `plan.md` mục 12, **không sửa**.
- **Chữ người dùng thấy:** không mở đầu câu bằng "Hãy"; không dùng "biện pháp", `BP` đứng riêng, `Việc của tôi`, `Kế hoạch MT`,
  `Cả phạm vi quản lý`, `Tiến độ lớp` — kể cả trong chú thích (phép quét `run.ts:8698-8708` và `hoSoHocVien.tests.ts:34-38`).
  Câu lỗi hệ thống theo THUAT_NGU g14-054 → **"Có lỗi · mã {mã}"**; màn mất kết nối theo g14-103 → **"Chưa kết nối được hệ
  thống dữ liệu"**.
- **Không lưu email/IP thô** vào bảng mới — chỉ mã băm. **Không ghi thân yêu cầu (mật khẩu) vào log.**
- **Số phép kiểm chỉ tăng.** Mốc đầu trên `main` @ `9ed8db7`: **672** (Task 0 kiểm lại). PR này thêm **27** → 699 trước rebase.
- Mỗi commit kết thúc bằng dòng Co-Authored-By theo hướng dẫn phiên. Không `--no-verify`.

---

## Quyết định session planning tự chốt khi đặc tả im lặng (ghi lại để người rà soát kiểm)

| # | Chỗ im lặng | Chốt | Vì sao |
|---|---|---|---|
| Q1 | AN-1 lưu số lần thử ở đâu | Bảng mới `auth_attempts (id, kind, key_hash, at)` trong database; migrate idempotent | Bộ nhớ trong hàm Netlify mất sau mỗi lần nguội và mỗi bản hàm chạy song song có bộ nhớ riêng — đếm trong RAM là không đếm |
| Q2 | Ngưỡng | Đăng nhập sai **5 lần / 15 phút / email**; **30 lần / 15 phút / IP**; đăng ký **10 lần / 60 phút / IP** | 5/15' chặn dò mật khẩu mà người gõ nhầm vẫn chịu được; IP để 30 và đăng ký để 10 vì cả chi nhánh dùng chung một wifi (một IP) — ngày mở tài khoản cả nhóm GV đăng ký cùng lúc |
| Q3 | Email không tồn tại có bị khoá không | **Có**, như email có thật (đếm theo mã băm email đã chuẩn hoá) | Khoá chỉ email có thật là nói cho người dò biết email nào có thật |
| Q4 | Đang khoá mà gõ đúng mật khẩu | **Vẫn từ chối (429)** cho tới khi hết khoá; lần thử lúc đang khoá **không** được đếm thêm | Không thì kẻ dò chỉ cần thử tiếp; không đếm thêm để khoá không kéo dài mãi |
| Q5 | Đăng nhập đúng thì sao | Xoá đếm theo **email** đó; **không** xoá đếm theo IP | Một người đúng mật khẩu không được "rửa" IP đang bị dùng để dò email khác |
| Q6 | Lấy IP thế nào | Bản chính: header `x-nf-client-connection-ip` (Netlify đặt); máy dev: địa chỉ socket. **Không** tin `x-forwarded-for` | Header Netlify do Netlify ghi; `x-forwarded-for` người gửi tự đặt được |
| Q7 | Dữ liệu trong bảng | `key_hash = sha256('pisa-an1:' + giá trị)`; dòng cũ hơn **24 giờ** bị xoá mỗi lần ghi lần thử mới | Không giữ email/IP thô; bảng không phình |
| Q8 | QTHT có nút mở khoá không | **Không** — khoá tự hết sau ≤ 15 phút; ghi vào `TRIEN_KHAI.md` §11 | YAGNI; không có màn nào để đặt nút mà không đụng file PR khác |
| Q9 | Sao lưu có chép `auth_attempts` không | **Có chép** (không thêm vào `BANG_KHONG_CHEP_DONG`) | Chỉ là mã băm, sống ≤ 24 giờ; thêm vào danh sách thì phải sửa `saoLuu.ts` + phép kiểm sao lưu vốn so "mọi bảng trừ `demo_sessions`" |
| Q10 | AN-3: câu 500 | `"Có lỗi · mã {8 ký tự}. Thử lại sau ít phút; nếu vẫn lỗi, báo Quản trị hệ thống kèm mã này."` + `details.ma`; chi tiết lỗi chỉ ở log máy chủ cùng mã. **Máy dev cũng vậy** (một hành vi) | Người dùng có mã để báo; người sửa tìm đúng dòng log. Dev đọc lỗi ở cửa sổ lệnh |
| Q11 | AN-3: câu 409 | Giữ câu cũ `Dữ liệu bị trùng hoặc vi phạm ràng buộc.`, **bỏ** `details.raw`; ghi log `console.warn` | Web không đọc `details.raw` (đã grep) |
| Q12 | AN-3: thân JSON hỏng / quá lớn | 400 `Dữ liệu gửi lên không đọc được. Tải lại trang rồi thử lại.` · 413 `Dữ liệu gửi lên quá lớn.` | Hiện đang thành 500 kèm câu tiếng Anh của thư viện |
| Q13 | AN-4 | Giữ **công khai** (màn đăng nhập cần), giữ đúng hình `{ ok, seeded }`; đã khởi tạo thì **không hỏi DB nữa** trong đời bản hàm; chưa khởi tạo thì hỏi lại tối đa 30 giây/lần; DB lỗi → **503 `{ ok: false, seeded: false }`** không kèm lỗi; `Cache-Control: no-store`; route đặt **trước** `attachPrincipal` | Không ai spam được để tốn lượt đọc Turso; `thu-goi` vẫn thấy 200 |
| Q14 | AN-5: làm gì khi không đổi được 10 giây | Netlify không cho đặt thời hạn hàm đồng bộ trong `netlify.toml`. Làm 3 việc: (a) mỗi lời gọi ở **bản chính** có hạn 10 s; `tx()` **từ chối mở giao dịch mới** khi còn < 2,5 s (503 `Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.`); (b) đầu mỗi lời gọi, còn giao dịch treo trên kết nối thì cuộn lại; (c) log `[cham]` mọi lời gọi ≥ 3 s để PR-Z2c đo | Không thể cắt một giao dịch đang chạy (libsql đồng bộ); chỉ có thể không bắt đầu nó. Số đo thật thuộc Z2c |
| Q15 | AN-6: câu "Email này đã có tài khoản" ở đăng ký lộ email tồn tại | **Giữ** | GV cần biết để đăng nhập thay vì đăng ký lại; giới hạn 10/giờ/IP làm việc dò chậm |
| Q16 | AN-6: siết thêm | `resolveSession` từ chối (và xoá) phiên của tài khoản **chưa duyệt / bị từ chối / không `active`** | Phòng thủ hai lớp: hôm nay chỉ đăng nhập mới phát phiên, nhưng một đường phát phiên mới sau này sẽ không mở cửa cho tài khoản chờ duyệt |
| Q17 | AN-7 | Bản chính hỏi `/api/health`: lỗi → thẻ **"Chưa kết nối được hệ thống dữ liệu"** + nút Thử lại (không có lệnh `npm`); `seeded: false` → **"Hệ thống chưa được khởi tạo"**; bấm Đăng nhập/Gửi đăng ký gặp lỗi mạng hoặc ≥ 500 (trừ câu "Có lỗi · mã …") → câu dễ đọc, **không** in HTML của trang lỗi Netlify. Máy dev giữ nguyên | `/demo/accounts` tắt ở bản chính nên không suy được gì từ nó |
| Q18 | AN-8 làm tới đâu | Chỉ đếm bằng chứng: **một** câu hỏi cho mọi thẻ Case của bảng. Các câu hỏi khác mỗi thẻ (`sosCaseState`, `lastTouch`, `closeBlockers`…) để PR-Z2c Step 6 xử lý theo số đo | Đúng phạm vi kiểm kê ("PR-AN chỉ hàm đếm"); tránh đụng vùng S1/S2/Form sửa |
| Q19 | RB-1: giờ chạy | Cron `5 17,23 * * 0` (UTC) = **00:05 và 06:05 sáng thứ Hai giờ Việt Nam**; lần 06:05 là lưới an toàn (chốt lặp vô hại) | "Đầu thứ Hai" theo 4.6; `settleNoShows` chốt khi `week_end < hôm nay` nên phải chạy sau nửa đêm giờ VN |
| Q20 | RB-1: kiểu hàm | Hàm v1 (`export const handler`) + `[functions."chot-vang"] schedule` trong `netlify.toml` — cùng kiểu `api.ts`; không thêm gói `@netlify/functions` | Không thêm phụ thuộc; gói thử được bằng `npm run thu-goi` như `api.ts` |
| Q21 | RB-1: có gọi `sweepExpiredMoves` không | **Không** — chỉ `settleNoShows` | 4.6 chỉ nói chốt "-"; `sweepExpiredMoves` vẫn chạy ở đường đọc như cũ |
| Q22 | Đợt | Đợt 1 (song song O, S1) theo người giao việc và kiểm kê §5.3 — đặc tả §7 ghi Đợt 2 | Người giao việc chốt; PR này merge sau O và S1 nên không vi phạm luật "hai PR có migrate không merge cùng lúc" |

---

## File Structure

| File | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `server/src/schema.sql` (sau bảng `demo_sessions`, ~dòng 1421) | Sửa | + bảng `auth_attempts` + chỉ mục |
| `server/src/migrate.ts` (gọi ~dòng 440; hàm cuối file) | Sửa | + `export function migrateAuthAttempts(conn, applied)` |
| `server/src/platform/gioiHanThu.ts` | Tạo | AN-1: `GIOI_HAN`, `bam`, `ipCua`, `phutConKhoa`, `ghiLanThu`, `xoaLanThu`, `chanNeuBiKhoa`, hai câu báo khoá |
| `server/src/routes/index.ts` (import đầu file; `/auth/login` ~1570, `/auth/register` ~1578) | Sửa | AN-1 gắn giới hạn |
| `server/src/auth.ts:41-53` | Sửa | AN-6: `resolveSession` chỉ nhận tài khoản đã duyệt, đang hoạt động |
| `server/src/app.ts` | Sửa | AN-3 `traLoiLoi`; AN-4 route health đặt trước `attachPrincipal`; AN-5 `demGio` |
| `server/src/platform/suKhoe.ts` | Tạo | AN-4: `taoSuKhoe(hoi?, bayGio?)` |
| `server/src/platform/hanGio.ts` | Tạo | AN-5: `HAN_HAM_NETLIFY_MS`, `KHONG_MO_GIAO_DICH_KHI_CON_MS`, `LOG_CHAM_MS`, `chayVoiHan`, `conLaiMs`, `chanGiaoDichNeuSapHetGio` |
| `server/src/db.ts:151-167` | Sửa | AN-5: `tx()` hỏi hạn trước khi mở giao dịch; + `donGiaoDichTreo()` |
| `server/src/cases/cases.ts` (~2017 sau `caseRows`; ~2237 lời gọi; `caseCardOf` ~2263, ~2377) | Sửa | AN-8: + `demBangChungCase(caseIds)`; `caseCardOf` nhận bản đếm |
| `server/src/ops/chotVangDinhKy.ts` | Tạo | RB-1: `LICH_CHOT_VANG`, `chotVangDinhKy(o?)` |
| `netlify/functions/chot-vang.ts` | Tạo | RB-1: hàm định kỳ gọi `chotVangDinhKy()` |
| `netlify.toml` | Sửa | RB-1: `[functions."chot-vang"] schedule` |
| `scripts/thu-goi-function.mjs` | Sửa | RB-1: gói thử `chot-vang` như Netlify, chạy trên bản sao database dev |
| `web/src/modules/platform/WelcomePage.tsx` | Sửa | AN-7 |
| `server/src/tests/anToan.tests.ts` | Tạo | 27 phép kiểm của PR này |
| `server/src/tests/run.ts` (cuối file, trước khối in tổng kết) | Sửa | 3 dòng nối |
| `TRIEN_KHAI.md` §11 | Sửa | 3 dòng bảng sự cố + mục 11.3 chốt "-" tự động |
| `CODE_MAP.md` (khối bản chính ~dòng 283–292) | Sửa | 5 dòng mới |
| `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md` Task 10 | Sửa | Một ghi chú 🆕 PR-AN cho Z2c (kiểm hàm `chot-vang`, đọc log `[cham]`) |

**Kiểm với mã thật (22/09, `main` @ `9ed8db7`):**

| Mã | Tình trạng thật | PR này làm |
|---|---|---|
| AN-1 | ❌ Không có giới hạn nào (`routes/index.ts:1570-1587`) | Task 1–3 |
| AN-3 | ❌ `app.ts:48` trả `details: { raw: message }` (câu SQL); `app.ts:52` trả `'Lỗi hệ thống: ' + message`; thân JSON hỏng thành 500 | Task 5 |
| AN-4 | 🟡 `app.ts:29-31` chỉ trả `{ ok, seeded }` (không lộ gì) nhưng mỗi lần gọi hỏi `sqlite_master` (một lượt Turso), và đứng sau `attachPrincipal` | Task 6 |
| AN-5 | ❌ Không có gì; `netlify.toml` cũng **không đặt được** thời hạn | Task 7 |
| AN-6 | ✅ **Đã có**: `register` ghi `approval_state='pending'`, không cấp vai (`accounts.ts:144-157`); `login` từ chối `pending`/`declined` (`accounts.ts:99-104`); duyệt chỉ QTHT (`accounts.ts:194`); phép kiểm cấp dịch vụ có (`run.ts:4383-4424`). Thiếu: phép kiểm qua HTTP, và phiên không kiểm trạng thái tài khoản | Task 4: **đã có, chỉ thêm phép kiểm** + siết `resolveSession` (Q16) |
| AN-7 | ❌ Bản chính: `WelcomePage.tsx:89` không gọi `/demo/accounts` → `noData` luôn sai → máy chủ hỏng vẫn hiện form, bấm vào thì hiện nguyên câu lỗi (có thể là HTML 502 của Netlify) | Task 10 |
| AN-8 | ❌ `cases.ts:2378` một `COUNT(*)` cho mỗi thẻ | Task 8 |
| RB-1 | 🟡 `settleNoShows` chạy lặp vô hại, gọi ở đường đọc (`attempts.ts:761, 1207, 1283, 1404`, `mywork.ts:452`); không có tác vụ định kỳ | Task 9 |

---

### Task 0: Chuẩn bị

**Files:** không sửa mã.

- [x] **Step 1: Nhánh.** Dùng `superpowers:using-git-worktrees`: `git fetch origin && git worktree add ../pisa-pr-an -b pr-an-an-toan origin/main`.
  Mọi lệnh sau chạy trong worktree. Máy chủ dev trong worktree: `npm run dev` **trong chính worktree** (không dùng `preview_start` — nó
  chạy mã của thư mục chính).
- [x] **Step 2: Kiểm môi trường không có biến Turso.**

```bash
node -e "for (const k of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BAN_CHINH','PISA_CHO_PHEP_MIGRATE_TURSO','PISA_CHO_PHEP_SEED_TURSO']) if (process.env[k]) { console.error('CÓ BIẾN', k); process.exit(1) } ; console.log('sạch')"
```
Expected: `sạch`. Có biến → đóng cửa sổ, mở cửa sổ mới.

- [x] **Step 3: Mốc.** `npm ci` rồi `npm test 2>&1 | tail -3` — Expected: `TẤT CẢ 672 KIỂM TRA ĐỀU ĐẠT`. Ghi số vào Nhật ký. Đỏ ngay từ đầu → 🛑.
- [x] **Step 4:** Đọc Global Constraints + bảng Q1–Q22 + bảng "Kiểm với mã thật". Q nào bạn thấy sai với đặc tả → 🛑 hỏi trước khi code.

---

### Task 1: Bảng `auth_attempts` + bước nâng cấp idempotent + file phép kiểm

**Files:**
- Modify: `server/src/schema.sql` (ngay sau bảng `demo_sessions`, ~dòng 1421)
- Modify: `server/src/migrate.ts:440` (gọi), cuối file (hàm mới)
- Create: `server/src/tests/anToan.tests.ts`
- Modify: `server/src/tests/run.ts` (ngay sau khối PR-Z2 ~dòng 9432, trước dòng in `'='.repeat(60)`)

**Interfaces:**
- Produces: bảng `auth_attempts (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, key_hash TEXT NOT NULL, at TEXT NOT NULL)` + chỉ mục
  `idx_auth_attempts_key (kind, key_hash, at)`; `export function migrateAuthAttempts(conn: any, applied: string[]): void`; trong file test:
  `load`, `REPO`, `batLog`, `demCauHoi`, `giaRes` — task sau dùng lại.

- [x] **Step 1: Tạo file phép kiểm (đỏ).** `server/src/tests/anToan.tests.ts`:

```ts
/**
 * PHÉP KIỂM PR-AN — an toàn trước người dùng thật (đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md`
 * §5 quyết định 4.6, 4.11, §7 dòng AN; kiểm kê §1.9 AN-1…AN-8, §1.7 RB-1). Tên mỗi phép kiểm bắt đầu bằng mã việc.
 *
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Tài khoản dùng ở đây do CHÍNH file này tạo (email
 * bắt đầu bằng "an"); mọi lần thử đăng nhập/đăng ký qua HTTP dùng một IP giả riêng (dải 203.0.113.x, dành cho tài liệu); cuối file
 * xoá sạch bảng `auth_attempts` — không ảnh hưởng file khác chạy trước hay sau.
 */
import type { Principal } from '../permissions.ts';

export type AnToanTestKit = {
  check: (name: string, fn: () => void) => void;
  checkAsync: (name: string, fn: () => Promise<void>) => Promise<void>;
  assert: (cond: unknown, msg: string) => void;
  assertThrows: (fn: () => unknown, match: RegExp, msg: string) => void;
  conn: any;
  TODAY: string;
  P: Record<string, Principal>;
};

export async function runAnToanTests(t: AnToanTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, TODAY, P } = t;
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  /** Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (mẫu PR-S1). */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => { throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`); } }));
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

  /** Bắt console.error/warn trong lúc chạy fn — để kiểm log máy chủ mà không làm bẩn kết quả. */
  const batLog = async <T>(fn: () => T | Promise<T>): Promise<{ kq: T; log: string }> => {
    const goc = { e: console.error, w: console.warn };
    let log = '';
    const ghi = (...a: unknown[]) => { log += a.map((x) => (x instanceof Error ? `${x.name}: ${x.message}` : String(x))).join(' ') + '\n'; };
    console.error = ghi; console.warn = ghi;
    try { const kq = await fn(); return { kq, log }; } finally { console.error = goc.e; console.warn = goc.w; }
  };
  /** Đếm số câu SQL khớp `mau` được chuẩn bị trên kết nối chung (`db()` — cùng đối tượng với `conn`) trong lúc chạy fn. */
  const demCauHoi = async (mau: RegExp, fn: () => unknown): Promise<number> => {
    const coRieng = Object.prototype.hasOwnProperty.call(conn, 'prepare');
    const goc = conn.prepare;
    let n = 0;
    conn.prepare = function (this: unknown, sql: string, ...r: unknown[]) { if (mau.test(sql)) n += 1; return goc.call(this, sql, ...r); };
    try { await fn(); } finally { if (coRieng) conn.prepare = goc; else delete conn.prepare; }
    return n;
  };
  /** Đối tượng `res` giả cho middleware / bộ xử lý lỗi của Express. */
  const giaRes = () => {
    const o: any = { code: 200, body: undefined as unknown, headers: {} as Record<string, string> };
    o.status = (c: number) => { o.code = c; return o; };
    o.json = (b: unknown) => { o.body = b; return o; };
    o.set = (k: string, v: string) => { o.headers[k.toLowerCase()] = v; return o; };
    o.on = () => o;
    return o;
  };

  // ================================================================== 1. Bảng auth_attempts (AN-1)

  console.log('\nPR-AN · 1. Bảng đếm lần thử đăng nhập/đăng ký');

  check('AN-1 · Bảng auth_attempts có ở database dựng từ schema.sql, đủ cột và chỉ mục; migrate() trên database này không làm gì', () => {
    const cot = (conn.prepare('PRAGMA table_info(auth_attempts)').all() as any[]).map((c) => c.name).join(',');
    assert(cot === 'id,kind,key_hash,at', `Cột: "${cot}"`);
    const cm = (conn.prepare('PRAGMA index_list(auth_attempts)').all() as any[]).map((c) => c.name);
    assert(cm.includes('idx_auth_attempts_key'), `Chỉ mục: ${cm.join(',')}`);
    const r = migrateMod.migrate();
    assert(!r.applied.some((x: string) => /PR-AN/.test(x)), `Database mới mà migrate vẫn áp PR-AN: ${r.applied.join(' | ')}`);
  });

  check('AN-1 · migrateAuthAttempts trên database cũ (chưa có bảng): lần 1 tạo, lần 2 không làm gì; cấu trúc giống hệt schema.sql', () => {
    const mem = new SqliteDb(':memory:');
    try {
      const a1: string[] = []; migrateMod.migrateAuthAttempts(mem, a1);
      const a2: string[] = []; migrateMod.migrateAuthAttempts(mem, a2);
      assert(a1.length === 1 && /PR-AN/.test(a1[0]) && a2.length === 0, `Lần 1: ${a1.join('|')} · lần 2: ${a2.join('|')}`);
      const cot = (c: any) => JSON.stringify((c.prepare('PRAGMA table_info(auth_attempts)').all() as any[]).map((x) => [x.name, x.type, x.notnull, x.pk]));
      assert(cot(mem) === cot(conn), `Cột khác schema.sql: ${cot(mem)} ≠ ${cot(conn)}`);
      const cm = (c: any) => JSON.stringify((c.prepare('PRAGMA index_info(idx_auth_attempts_key)').all() as any[]).map((x) => x.name));
      assert(cm(mem) === cm(conn), `Chỉ mục khác schema.sql: ${cm(mem)} ≠ ${cm(conn)}`);
    } finally { mem.close(); }
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----

  /* Dọn: không để lại lần thử nào cho file khác (bảng chưa có thì bỏ qua — chỉ xảy ra ở bước đỏ của Task 1). */
  try { conn.prepare('DELETE FROM auth_attempts').run(); } catch { /* bảng chưa có */ }
}
```

(`fsMod`, `REPO`, `assertThrows`, `TODAY`, `P`, `checkAsync`, `load`, `batLog`, `demCauHoi`, `giaRes` chưa dùng ở Task 1 — `tsconfig`
không bật `noUnusedLocals`, không lỗi build.)

Nối vào `server/src/tests/run.ts` — ngay **sau** khối PR-Z2 (`await runBanChinhTests(...)`, ~dòng 9432) và **trước** dòng in tổng kết
`console.log(` + dấu `=` lặp 60 lần:

```ts
// ==================================================================== PR-AN (an toàn trước người dùng thật)
const { runAnToanTests } = await import('./anToan.tests.ts');
await runAnToanTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test 2>&1 | grep -E "AN-1|KIỂM TRA|KHÔNG ĐẠT"` — Expected: hai phép `AN-1 ·` **✗** (`no such table: auth_attempts`,
  `migrateAuthAttempts is not a function`).
- [x] **Step 3: `schema.sql`** — ngay sau khối `CREATE TABLE demo_sessions (...);` (~dòng 1421):

```sql
/*
 * GIỚI HẠN SỐ LẦN THỬ (PR-AN, AN-1, 22/09/2026): đăng nhập sai và gửi đăng ký. Bộ nhớ trong hàm Netlify không bền giữa các lần
 * gọi (và mỗi bản hàm chạy song song có bộ nhớ riêng) nên đếm ở database. `kind`: dang_nhap_email | dang_nhap_ip | dang_ky_ip.
 * `key_hash` = sha256 của email đã chuẩn hoá hoặc địa chỉ IP — KHÔNG lưu email/IP thô. Dòng quá 24 giờ bị xoá mỗi khi ghi lần
 * thử mới (`platform/gioiHanThu.ts`).
 */
CREATE TABLE auth_attempts (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX idx_auth_attempts_key ON auth_attempts(kind, key_hash, at);
```

- [x] **Step 4: `migrate.ts`** — hàm mới ở **cuối file**:

```ts
/**
 * PR-AN (AN-1, 22/09/2026): bảng đếm lần thử đăng nhập/đăng ký. Chỉ tạo khi chưa có — chạy lặp không làm gì. Không có dữ liệu cũ
 * nào để chuyển. Bản chính dựng từ `schema.sql` nên không đi qua bước này. Câu tạo bảng phải GIỐNG `schema.sql` (phép kiểm so cột).
 */
export function migrateAuthAttempts(conn: any, applied: string[]) {
  if (conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'auth_attempts'").get()) return;
  conn.exec(`CREATE TABLE auth_attempts (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX idx_auth_attempts_key ON auth_attempts(kind, key_hash, at);`);
  applied.push('PR-AN: thêm bảng auth_attempts (giới hạn số lần thử đăng nhập/đăng ký). Dữ liệu cũ giữ nguyên.');
}
```

Gọi trong `migrateCaseEngine`, ngay sau `migrateDeleteInvalidViolations(conn, applied);` (dòng 440):

```ts
    migrateDeleteInvalidViolations(conn, applied);
    /* PR-AN: bảng giới hạn số lần thử (AN-1). */
    migrateAuthAttempts(conn, applied);
```
(Sau khi rebase lên PR-S1, dòng này nằm **sau** `migrateLuatMayChu(conn, applied);` — giữ cả hai.)

- [x] **Step 5: Chạy, xanh.** `npm test 2>&1 | grep -E "AN-1|KIỂM TRA"` — Expected: 2 phép `AN-1 ·` ✓, `TẤT CẢ 674 …`.
- [x] **Step 6: Commit.**

```bash
git add server/src/schema.sql server/src/migrate.ts server/src/tests/anToan.tests.ts server/src/tests/run.ts
git commit -m "PR-AN (1): bảng auth_attempts + bước nâng cấp idempotent + file phép kiểm"
```

---

### Task 2: Mô-đun giới hạn số lần thử (AN-1, phần thuần)

**Files:**
- Create: `server/src/platform/gioiHanThu.ts`
- Test: `server/src/tests/anToan.tests.ts`

**Interfaces:**
- Produces:
  - `export type LoaiThu = 'dang_nhap_email' | 'dang_nhap_ip' | 'dang_ky_ip'`
  - `export const GIOI_HAN: Record<LoaiThu, { soLan: number; phut: number }>`, `export const GIU_DONG_GIO = 24`
  - `export const cauKhoaDangNhap: (phut: number) => string`, `export const cauKhoaDangKy: (phut: number) => string`
  - `export function bam(giaTri: string): string` (64 ký tự hex)
  - `export function ipCua(req: Request): string`
  - `export function phutConKhoa(loai: LoaiThu, giaTri: string, bayGio?: number): number | null`
  - `export function ghiLanThu(loai: LoaiThu, giaTri: string, bayGio?: number): void`
  - `export function xoaLanThu(loai: LoaiThu, giaTri: string): void`
  - `export function chanNeuBiKhoa(loai: LoaiThu, giaTri: string, cau: (phut: number) => string, bayGio?: number): void` (ném `HttpError(429, …)`)

- [x] **Step 1: Phép kiểm (đỏ)** — thêm trên dòng `// ---- các task sau …`:

```ts
  // ================================================================== 2. Hàm giới hạn (AN-1)

  console.log('\nPR-AN · 2. Giới hạn số lần thử — hàm thuần theo database');
  const gh = await load('../platform/gioiHanThu.ts');

  check('AN-1 · Đếm theo cửa sổ: lần sai cũ hơn 15 phút không tính; đủ 5 lần trong 15 phút thì khoá, báo đúng số phút còn lại; hết cửa sổ thì mở', () => {
    const t0 = Date.now();
    const phut = 60_000;
    const e = 'an1-cua-so.pisa@gmail.com';
    for (let i = 0; i < 5; i++) gh.ghiLanThu('dang_nhap_email', e, t0 - 20 * phut);
    assert(gh.phutConKhoa('dang_nhap_email', e, t0) === null, 'Lần sai 20 phút trước vẫn bị tính');
    for (let i = 0; i < 4; i++) gh.ghiLanThu('dang_nhap_email', e, t0 - 1 * phut);
    assert(gh.phutConKhoa('dang_nhap_email', e, t0) === null, '4 lần sai đã bị khoá');
    gh.ghiLanThu('dang_nhap_email', e, t0 - 1 * phut);
    const con = gh.phutConKhoa('dang_nhap_email', e, t0);
    assert(con === 14, `Phải còn 14 phút, nhận ${con}`);
    assert(gh.phutConKhoa('dang_nhap_email', e, t0 + 15 * phut) === null, 'Hết 15 phút mà vẫn khoá');
    assert(gh.phutConKhoa('dang_nhap_ip', e, t0) === null, 'Khoá loại này lan sang loại khác');
    assertThrows(() => gh.chanNeuBiKhoa('dang_nhap_email', e, gh.cauKhoaDangNhap, t0), /quá nhiều lần.*14 phút/, 'Đang khoá mà không chặn');
  });

  check('AN-1 · Bảng chỉ giữ mã băm: không có email hay IP thô trong auth_attempts', () => {
    gh.ghiLanThu('dang_nhap_email', 'an1-bam.pisa@gmail.com');
    gh.ghiLanThu('dang_nhap_ip', '198.51.100.7');
    const rows = conn.prepare('SELECT kind, key_hash FROM auth_attempts').all() as any[];
    assert(rows.length > 0 && rows.every((r) => /^[0-9a-f]{64}$/.test(r.key_hash)), 'key_hash phải là sha256 dạng hex');
    const tho = JSON.stringify(rows);
    assert(!tho.includes('@') && !tho.includes('an1-bam') && !tho.includes('198.51.100.7'), 'Bảng có email/IP thô');
    assert(gh.bam('a') === gh.bam('a') && gh.bam('a') !== gh.bam('b'), 'bam phải ổn định và phân biệt');
  });

  check('AN-1 · Dòng cũ hơn 24 giờ bị xoá mỗi khi ghi lần thử mới — bảng không phình', () => {
    const cu = new Date(Date.now() - 25 * 3_600_000).toISOString();
    conn.prepare('INSERT INTO auth_attempts (kind, key_hash, at) VALUES (?,?,?)').run('dang_ky_ip', 'f'.repeat(64), cu);
    gh.ghiLanThu('dang_ky_ip', '198.51.100.8');
    assert(!conn.prepare('SELECT 1 FROM auth_attempts WHERE at = ?').get(cu), 'Dòng 25 giờ trước vẫn còn');
  });
```

(Phép đầu dùng `t0 = Date.now()` chứ không một ngày cố định: `ghiLanThu` xoá dòng quá 24 giờ **tính theo `bayGio` truyền vào**, dùng
ngày cố định trong quá khứ vẫn đúng, nhưng giờ thật an toàn hơn cho phép dọn ở phép thứ ba.)

- [x] **Step 2: Chạy, đỏ.** Expected: 3 phép `AN-1 ·` mới ✗ ("Chưa có mô-đun ../platform/gioiHanThu.ts").
- [x] **Step 3: Tạo `server/src/platform/gioiHanThu.ts`.**

```ts
import crypto from 'node:crypto';
import type { Request } from 'express';
import { db } from '../db.ts';
import { laBanChinh } from '../moiTruong.ts';
import { HttpError } from '../util.ts';

/**
 * GIỚI HẠN SỐ LẦN THỬ — AN-1 (quyết định 4.11, 22/09/2026: giữ `/auth/register`, tài khoản phải QTHT duyệt, thêm giới hạn).
 *
 * Đếm ở database (bảng `auth_attempts`), không đếm trong bộ nhớ: trên Netlify mỗi lần gọi có thể là một bản hàm khác, và bản hàm
 * nguội là mất sạch. Chỉ lưu MÃ BĂM của email/IP, dòng quá 24 giờ bị xoá mỗi khi ghi lần mới.
 *
 * Ngưỡng (plan PR-AN Q2): IP để rộng vì cả một chi nhánh dùng chung một wifi — ngày mở tài khoản cả nhóm giáo viên đăng ký cùng lúc.
 */
export type LoaiThu = 'dang_nhap_email' | 'dang_nhap_ip' | 'dang_ky_ip';

export const GIOI_HAN: Record<LoaiThu, { soLan: number; phut: number }> = {
  dang_nhap_email: { soLan: 5, phut: 15 },
  dang_nhap_ip: { soLan: 30, phut: 15 },
  dang_ky_ip: { soLan: 10, phut: 60 },
};
export const GIU_DONG_GIO = 24;

export const cauKhoaDangNhap = (phut: number) => `Đăng nhập sai quá nhiều lần. Thử lại sau ${phut} phút.`;
export const cauKhoaDangKy = (phut: number) => `Đã gửi quá nhiều đăng ký trong một giờ. Thử lại sau ${phut} phút.`;

/** Mã băm cố định của một email (đã chuẩn hoá) hoặc một IP. Không đảo ngược được; cùng đầu vào cho cùng mã. */
export function bam(giaTri: string): string {
  return crypto.createHash('sha256').update('pisa-an1:' + giaTri).digest('hex');
}

/**
 * IP người gửi. Bản chính: header `x-nf-client-connection-ip` do Netlify ghi. KHÔNG tin `x-forwarded-for` — người gửi tự đặt được.
 * Máy dev: địa chỉ socket.
 */
export function ipCua(req: Request): string {
  if (laBanChinh()) {
    const h = req.headers['x-nf-client-connection-ip'];
    const v = Array.isArray(h) ? h[0] : h;
    if (v && v.trim()) return v.trim();
  }
  return req.socket?.remoteAddress ?? 'khong-ro';
}

/** Còn bị khoá bao nhiêu phút (làm tròn lên, ít nhất 1); `null` = không bị khoá. */
export function phutConKhoa(loai: LoaiThu, giaTri: string, bayGio: number = Date.now()): number | null {
  const { soLan, phut } = GIOI_HAN[loai];
  const tu = new Date(bayGio - phut * 60_000).toISOString();
  const r = db()
    .prepare('SELECT COUNT(*) AS n, MIN(at) AS dau FROM auth_attempts WHERE kind = ? AND key_hash = ? AND at > ?')
    .get(loai, bam(giaTri), tu) as any;
  if (!r || Number(r.n) < soLan) return null;
  const hetKhoa = Date.parse(r.dau) + phut * 60_000;
  return Math.max(1, Math.ceil((hetKhoa - bayGio) / 60_000));
}

/** Ghi một lần thử; tiện tay xoá mọi dòng quá GIU_DONG_GIO giờ. */
export function ghiLanThu(loai: LoaiThu, giaTri: string, bayGio: number = Date.now()): void {
  const conn = db();
  conn.prepare('DELETE FROM auth_attempts WHERE at < ?').run(new Date(bayGio - GIU_DONG_GIO * 3_600_000).toISOString());
  conn.prepare('INSERT INTO auth_attempts (kind, key_hash, at) VALUES (?,?,?)').run(loai, bam(giaTri), new Date(bayGio).toISOString());
}

export function xoaLanThu(loai: LoaiThu, giaTri: string): void {
  db().prepare('DELETE FROM auth_attempts WHERE kind = ? AND key_hash = ?').run(loai, bam(giaTri));
}

/** Đang bị khoá → ném 429 với câu `cau(số phút)`. Lần thử lúc đang khoá KHÔNG được ghi (khoá không tự kéo dài). */
export function chanNeuBiKhoa(loai: LoaiThu, giaTri: string, cau: (phut: number) => string, bayGio: number = Date.now()): void {
  const p = phutConKhoa(loai, giaTri, bayGio);
  if (p !== null) throw new HttpError(429, cau(p));
}
```

- [x] **Step 4: Chạy, xanh.** Expected `TẤT CẢ 677 …`.
- [x] **Step 5: Commit.** `git add server/src/platform/gioiHanThu.ts server/src/tests/anToan.tests.ts && git commit -m "PR-AN (2): mô-đun giới hạn số lần thử (đếm ở database, chỉ lưu mã băm)"`

---

### Task 3: Gắn giới hạn vào `/auth/login` và `/auth/register` (AN-1)

**Files:**
- Modify: `server/src/routes/index.ts` — import (ngay dưới `import * as accountSvc from '../platform/accounts.ts';`, dòng 54);
  `/auth/login` (1570-1576); `/auth/register` (1578-1587)
- Test: `server/src/tests/anToan.tests.ts`

**Interfaces:**
- Consumes: mọi hàm của Task 2; `accountSvc.normalizeEmail`, `accountSvc.login`, `accountSvc.register`, `accountSvc.createAccount`,
  `accountSvc.EMAIL_SUFFIX`, kiểu `accountSvc.LoginResult` (`accounts.ts:82`).
- Produces (trong file test): `may`, `goi(method, url, o)`, `taoTaiKhoan(ten)`, `dangNhap(tk, ip, sai?)` — Task 4, 5, 6 dùng lại.
  `may.close()` gọi ở **cuối file** (ngay trên khối dọn), không ở đây.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 3. Đăng nhập / đăng ký qua HTTP (AN-1)

  console.log('\nPR-AN · 3. Giới hạn số lần thử trên đường HTTP thật');
  const accounts: any = await import('../platform/accounts.ts');
  const { createApp } = await import('../app.ts');
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  /**
   * Gọi đường HTTP thật. Có `ip` → bật BAN_CHINH trong lúc gọi và gửi header IP của Netlify, để mỗi phép kiểm có IP riêng
   * (không khoá lẫn nhau). `tho` = thân gửi nguyên văn (kiểm JSON hỏng).
   */
  const goi = async (method: string, url: string, o: { body?: unknown; ip?: string; tho?: string; cookie?: string } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (o.ip) headers['x-nf-client-connection-ip'] = o.ip;
    if (o.cookie) headers.cookie = o.cookie;
    if (o.ip) process.env.BAN_CHINH = '1';
    try {
      const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
        method, headers, body: o.tho ?? (o.body === undefined ? undefined : JSON.stringify(o.body)),
      });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân JSON */ }
      return { status: res.status, json, setCookie: res.headers.get('set-cookie'), cacheControl: res.headers.get('cache-control') };
    } finally { if (o.ip) delete process.env.BAN_CHINH; }
  };
  const taoTaiKhoan = (ten: string) => {
    const email = `${ten}${accounts.EMAIL_SUFFIX}`;
    const password = 'matkhau-an1';
    accounts.createAccount(P.admin, { email, password, fullName: `Thử ${ten}`, roles: [{ role: 'teacher', branches: ['MB'] }] });
    return { email, password };
  };
  const dangNhap = (tk: { email: string; password: string }, ip: string, sai = false) =>
    goi('POST', '/auth/login', { ip, body: { email: tk.email, password: sai ? 'sai-mat-khau' : tk.password } });

  await checkAsync('AN-1 · 5 lần sai cùng email → lần 6 bị 429 KỂ CẢ mật khẩu đúng, không phát cookie; IP khác cũng bị (khoá theo email)', async () => {
    const tk = taoTaiKhoan('an1.khoa');
    for (let i = 0; i < 5; i++) {
      const r = await dangNhap(tk, '203.0.113.11', true);
      assert(r.status === 400, `Lần sai ${i + 1}: ${r.status}`);
    }
    const r6 = await dangNhap(tk, '203.0.113.11');
    assert(r6.status === 429 && /quá nhiều lần/.test(r6.json?.error ?? '') && /\d+ phút/.test(r6.json?.error ?? ''), `Lần 6: ${r6.status} ${JSON.stringify(r6.json)}`);
    assert(!r6.setCookie, 'Đang khoá mà vẫn phát cookie phiên');
    const r7 = await dangNhap(tk, '203.0.113.12');
    assert(r7.status === 429, `IP khác vẫn vào được: ${r7.status}`);
  });

  await checkAsync('AN-1 · Đăng nhập đúng xoá đếm của email: 4 sai → 1 đúng → 4 sai → vẫn vào được', async () => {
    const tk = taoTaiKhoan('an1.xoa');
    for (let i = 0; i < 4; i++) await dangNhap(tk, '203.0.113.13', true);
    assert((await dangNhap(tk, '203.0.113.13')).status === 200, 'Lần đúng phải vào được');
    for (let i = 0; i < 4; i++) await dangNhap(tk, '203.0.113.13', true);
    const r = await dangNhap(tk, '203.0.113.13');
    assert(r.status === 200 && r.setCookie, `Đếm cũ không được xoá: ${r.status}`);
  });

  await checkAsync('AN-1 · 30 lần sai từ một IP (mỗi lần một email) → IP đó bị khoá cả với tài khoản đúng; IP khác không bị', async () => {
    const tk = taoTaiKhoan('an1.ip');
    for (let i = 0; i < 30; i++) {
      await goi('POST', '/auth/login', { ip: '203.0.113.21', body: { email: `an1.do${i}${accounts.EMAIL_SUFFIX}`, password: 'x' } });
    }
    const bi = await dangNhap(tk, '203.0.113.21');
    assert(bi.status === 429, `IP đã dò 30 lần vẫn đăng nhập được: ${bi.status}`);
    const khac = await dangNhap(tk, '203.0.113.22');
    assert(khac.status === 200, `IP khác bị vạ lây: ${khac.status}`);
  });

  await checkAsync('AN-1 · Email KHÔNG tồn tại cũng bị khoá sau 5 lần, cùng câu báo như email có thật (không lộ email nào có thật)', async () => {
    const la = { email: `an1.khongco${accounts.EMAIL_SUFFIX}`, password: 'x' };
    for (let i = 0; i < 5; i++) await dangNhap(la, '203.0.113.23', true);
    const r = await dangNhap(la, '203.0.113.23');
    assert(r.status === 429, `Email lạ không bị khoá: ${r.status}`);
    const boSo = (s: string) => String(s).replace(/\d+/g, 'N');
    assert(boSo(r.json?.error) === boSo(gh.cauKhoaDangNhap(1)), `Câu khác câu của email có thật: ${r.json?.error}`);
  });

  await checkAsync('AN-1 · Đăng ký: 10 lần/giờ/IP (tính cả lần hỏng) → lần 11 bị 429 dù thân hợp lệ, không tạo tài khoản; IP khác vẫn đăng ký được', async () => {
    for (let i = 0; i < 10; i++) {
      const r = await goi('POST', '/auth/register', { ip: '203.0.113.31', body: { email: 'thieu' } });
      assert(r.status === 400, `Đăng ký hỏng lần ${i + 1}: ${r.status}`);
    }
    const hopLe = { email: `an1.dangky${accounts.EMAIL_SUFFIX}`, password: 'matkhau123', fullName: 'AN1 Đăng Ký', branches: ['MB'] };
    const r11 = await goi('POST', '/auth/register', { ip: '203.0.113.31', body: hopLe });
    assert(r11.status === 429 && /quá nhiều đăng ký/.test(r11.json?.error ?? ''), `Lần 11: ${r11.status} ${JSON.stringify(r11.json)}`);
    assert(!conn.prepare('SELECT 1 FROM users WHERE email = ?').get(hopLe.email), 'Bị khoá mà vẫn tạo tài khoản');
    const khac = await goi('POST', '/auth/register', { ip: '203.0.113.32', body: hopLe });
    assert(khac.status === 200 && khac.json?.pending === true, `IP khác: ${khac.status}`);
  });
```

Và **ngay trên** khối dọn cuối file (`try { conn.prepare('DELETE FROM auth_attempts')…`), thêm một dòng: `may.close();`
(các task sau thêm phép kiểm phía trên dòng `// ---- các task sau …`, vẫn nằm trước `may.close()`).

- [x] **Step 2: Chạy, đỏ.** Expected: 5 phép mới ✗ (lần 6 nhận 200/400 thay vì 429).
- [x] **Step 3: Sửa route.** Import (ngay dưới `import * as accountSvc …`, dòng 54):

```ts
import * as gioiHan from '../platform/gioiHanThu.ts';
```

Thay nguyên hai route `/auth/login` và `/auth/register` (1570-1587), **giữ** khối chú thích đăng nhập ở trên:

```ts
api.post('/auth/login', wrap((req, res) => {
  /*
   * AN-1 (PR-AN): khoá theo email VÀ theo IP, kiểm TRƯỚC khi so mật khẩu — đang khoá thì mật khẩu đúng cũng không vào.
   * Chỉ lần sai mật khẩu/email (400) mới được đếm; tài khoản chờ duyệt/bị từ chối (403) là đúng mật khẩu, không đếm.
   */
  const email = accountSvc.normalizeEmail(String(req.body?.email ?? ''));
  const ip = gioiHan.ipCua(req);
  gioiHan.chanNeuBiKhoa('dang_nhap_email', email, gioiHan.cauKhoaDangNhap);
  gioiHan.chanNeuBiKhoa('dang_nhap_ip', ip, gioiHan.cauKhoaDangNhap);
  let r: accountSvc.LoginResult;
  try {
    r = accountSvc.login(email, String(req.body?.password ?? ''));
  } catch (e) {
    if (e instanceof HttpError && e.status === 400) {
      gioiHan.ghiLanThu('dang_nhap_email', email);
      gioiHan.ghiLanThu('dang_nhap_ip', ip);
    }
    throw e;
  }
  gioiHan.xoaLanThu('dang_nhap_email', email);
  if (req.sessionToken) destroySession(req.sessionToken);
  const token = createSession(r.userId);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', secure: laBanChinh() });
  return { ok: true, userId: r.userId, fullName: r.fullName };
}));

api.post('/auth/register', wrap((req) => {
  /* AN-1: mọi lần gửi đăng ký đều đếm theo IP (kể cả lần hỏng) — chặn tạo hàng loạt tài khoản chờ duyệt. */
  const ip = gioiHan.ipCua(req);
  gioiHan.chanNeuBiKhoa('dang_ky_ip', ip, gioiHan.cauKhoaDangKy);
  gioiHan.ghiLanThu('dang_ky_ip', ip);
  const b = req.body ?? {};
  const r = accountSvc.register({
    email: String(b.email ?? ''), password: String(b.password ?? ''), fullName: String(b.fullName ?? ''),
    phone: b.phone ?? null, branches: Array.isArray(b.branches) ? b.branches : [],
    note: b.note ?? null, skills: Array.isArray(b.skills) ? b.skills : [],
  });
  return { ...r, pending: true };
}));
```
(`HttpError` đã import ở dòng 11.)

- [x] **Step 4: Chạy, xanh.** Expected `TẤT CẢ 682 …`. Phép cũ `PR-Z2 · Bản chính: cookie phiên…` (`banChinh.tests.ts:350`) và
  `Đăng nhập đúng thì vào, sai email và sai mật khẩu nói CÙNG một câu` (`run.ts:4359`, gọi thẳng dịch vụ) vẫn ✓.
- [x] **Step 5: Commit.** `git commit -am "PR-AN (3): AN-1 giới hạn số lần thử đăng nhập và đăng ký"`

---

### Task 4: AN-6 — đăng ký phải QTHT duyệt (đã có; thêm phép kiểm HTTP + siết phiên)

**Kết luận kiểm mã:** luồng duyệt **đã đúng** (xem bảng "Kiểm với mã thật"). Task này chỉ (a) khoá hành vi bằng phép kiểm qua HTTP
thật và (b) thêm một lớp phòng thủ ở `resolveSession` (Q16).

**Files:**
- Modify: `server/src/auth.ts:41-53` (`resolveSession`)
- Test: `server/src/tests/anToan.tests.ts`

**Interfaces:**
- Consumes: `goi`, `accounts` (Task 3); `createSession`, `resolveSession` (`auth.ts`).
- Produces: `resolveSession(token)` trả `null` và xoá dòng phiên khi tài khoản có `approval_state != 'approved'` hoặc `status != 'active'`.

- [x] **Step 1: Phép kiểm.**

```ts
  // ================================================================== 4. AN-6 — đăng ký phải QTHT duyệt

  console.log('\nPR-AN · 4. Đăng ký tự do nhưng phải Quản trị hệ thống duyệt (4.11)');
  const auth: any = await import('../auth.ts');

  await checkAsync('AN-6 · Đăng ký qua HTTP: tài khoản ở trạng thái chờ duyệt, KHÔNG có vai nào; trường lạ (role, approval_state, status) bị bỏ qua', async () => {
    const email = `an6.moi${accounts.EMAIL_SUFFIX}`;
    const r = await goi('POST', '/auth/register', { ip: '203.0.113.41', body: {
      email, password: 'matkhau123', fullName: 'AN6 Mới', branches: ['MB'],
      role: 'system_admin', roles: [{ role: 'system_admin', branches: [] }], approval_state: 'approved', approvalState: 'approved', status: 'active',
    } });
    assert(r.status === 200 && r.json?.pending === true, `Đăng ký: ${r.status} ${JSON.stringify(r.json)}`);
    const u = conn.prepare('SELECT id, approval_state FROM users WHERE email = ?').get(email) as any;
    assert(u && u.approval_state === 'pending', `Trạng thái: ${u?.approval_state}`);
    const vai = (conn.prepare("SELECT COUNT(*) n FROM user_roles WHERE user_id = ? AND status = 'active'").get(u.id) as any).n;
    assert(vai === 0, `Chưa duyệt mà đã có ${vai} vai`);
  });

  await checkAsync('AN-6 · Chờ duyệt → đăng nhập 403 "chờ", không cookie; bị từ chối → 403 kèm lý do; QTHT duyệt rồi mới vào được', async () => {
    const email = `an6.cho${accounts.EMAIL_SUFFIX}`;
    const { userId } = accounts.register({ email, password: 'matkhau123', fullName: 'AN6 Chờ', branches: ['MB'] });
    const cho = await goi('POST', '/auth/login', { ip: '203.0.113.42', body: { email, password: 'matkhau123' } });
    assert(cho.status === 403 && /chờ/.test(cho.json?.error ?? '') && !cho.setCookie, `Chờ duyệt: ${cho.status} ${cho.setCookie}`);
    const email2 = `an6.tuchoi${accounts.EMAIL_SUFFIX}`;
    const r2 = accounts.register({ email: email2, password: 'matkhau123', fullName: 'AN6 Từ Chối', branches: ['MB'] });
    accounts.decline(P.admin, r2.userId, 'Không phải giáo viên của trung tâm');
    const tc = await goi('POST', '/auth/login', { ip: '203.0.113.42', body: { email: email2, password: 'matkhau123' } });
    assert(tc.status === 403 && /Không phải giáo viên/.test(tc.json?.error ?? '') && !tc.setCookie, `Bị từ chối: ${tc.status}`);
    accounts.approve(P.admin, userId, { role: 'teacher', branches: ['MB'] });
    const vao = await goi('POST', '/auth/login', { ip: '203.0.113.42', body: { email, password: 'matkhau123' } });
    assert(vao.status === 200 && vao.setCookie, `Đã duyệt mà không vào được: ${vao.status}`);
  });

  check('AN-6 · Phiên của tài khoản chờ duyệt / bị từ chối / không hoạt động không dùng được (và bị xoá); tài khoản đã duyệt thì dùng được', () => {
    const mk = (ten: string) => accounts.register({ email: `${ten}${accounts.EMAIL_SUFFIX}`, password: 'matkhau123', fullName: ten, branches: ['MB'] }).userId as number;
    const cho = mk('an6.phien.cho');
    const tuChoi = mk('an6.phien.tuchoi');
    accounts.decline(P.admin, tuChoi, 'Thử phiên');
    const khoa = mk('an6.phien.khoa');
    accounts.approve(P.admin, khoa, { role: 'teacher', branches: ['MB'] });
    conn.prepare("UPDATE users SET status = 'locked' WHERE id = ?").run(khoa);
    for (const [ten, id] of [['chờ duyệt', cho], ['bị từ chối', tuChoi], ['không hoạt động', khoa]] as const) {
      const ma = auth.createSession(id);
      assert(auth.resolveSession(ma) === null, `Phiên của tài khoản ${ten} vẫn dùng được`);
      assert(!conn.prepare('SELECT 1 FROM demo_sessions WHERE token = ?').get(ma), `Phiên của tài khoản ${ten} không bị xoá`);
    }
    const ok = auth.resolveSession(auth.createSession(P.admin.userId));
    assert(ok && ok.userId === P.admin.userId, 'Tài khoản đã duyệt phải dùng được phiên');
  });
```

- [x] **Step 2: Chạy.** Expected: hai phép HTTP **✓ ngay** (hành vi đã có — nếu ✗ thì 🛑, mã khác kiểm kê); phép phiên **✗**
  ("Phiên của tài khoản chờ duyệt vẫn dùng được").
- [x] **Step 3: Sửa `resolveSession`** (`auth.ts:41-53`):

```ts
export function resolveSession(token: string | undefined): Principal | null {
  if (!token) return null;
  /*
   * AN-6 (PR-AN, quyết định 4.11): phiên chỉ có hiệu lực cho tài khoản ĐÃ DUYỆT và đang hoạt động. Hôm nay chỉ đường đăng nhập
   * phát phiên và nó đã từ chối tài khoản chờ duyệt — lớp này để một đường phát phiên thêm sau này không mở cửa cho họ.
   * Một câu JOIN, không thêm lượt hỏi database.
   */
  const row = db()
    .prepare(
      `SELECT s.*, u.approval_state, u.status AS user_status FROM demo_sessions s
         JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as any;
  if (!row) return null;
  const hetHan = !(Date.now() - Date.parse(row.last_seen_at ?? row.created_at) <= PHIEN_HET_HAN_SAU_NGAY * 86_400_000);
  /* Quá hạn, hoặc tài khoản không còn được vào → coi như chưa đăng nhập, và xoá luôn dòng phiên (mã đó không dùng lại được). */
  if (hetHan || row.approval_state !== 'approved' || row.user_status !== 'active') {
    db().prepare('DELETE FROM demo_sessions WHERE token = ?').run(token);
    return null;
  }
  db().prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE token = ?').run(nowIso(), token);
  return loadPrincipal(row.user_id);
}
```
Giữ nguyên khối chú thích `PHIEN_HET_HAN_SAU_NGAY` ở trên.

- [x] **Step 4: Chạy, xanh.** Expected `TẤT CẢ 685 …`. Phép cũ về phiên hết hạn (`banChinh.tests.ts:1110-1130`) và khôi phục (`:1040-1070`)
  vẫn ✓ (tài khoản của bộ demo đều `approved`/`active`). Ghi Nhật ký: ở máy dev, "Vào nhanh" vào một tài khoản **chờ duyệt** nay bị
  đẩy ra ngay — đúng ý (dev không có tài khoản chờ duyệt trong bộ demo).
- [x] **Step 5: Commit.** `git commit -am "PR-AN (4): AN-6 phép kiểm HTTP luồng duyệt; phiên chỉ nhận tài khoản đã duyệt, đang hoạt động"`

---

### Task 5: AN-3 — lỗi 409/500 không lộ SQL, có mã lỗi

**Files:**
- Modify: `server/src/app.ts:39-53` (bộ xử lý lỗi → hàm có tên `traLoiLoi`, export)
- Test: `server/src/tests/anToan.tests.ts`

**Interfaces:**
- Produces: `export function traLoiLoi(err: unknown, req: Request, res: Response, _next: NextFunction): void`.
  500 → `{ error: 'Có lỗi · mã {ma}. …', details: { ma } }` (`ma` = 8 ký tự hex); 409 → `{ error: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc.' }`;
  thân JSON hỏng → 400; quá lớn → 413; `HttpError` giữ nguyên như cũ.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 5. AN-3 — câu lỗi không lộ nội bộ

  console.log('\nPR-AN · 5. Lỗi 409/500 không lộ câu SQL hay thông điệp nội bộ');
  const appMod: any = await import('../app.ts');
  const reqGia = { method: 'POST', path: '/api/thu-loi' } as any;

  await checkAsync('AN-3 · 409 (vi phạm ràng buộc): câu chung, KHÔNG có details.raw hay câu SQL; chi tiết chỉ ở log máy chủ', async () => {
    const loi = Object.assign(new Error('UNIQUE constraint failed: users.email (INSERT INTO users (code, email) VALUES …)'), { code: 'SQLITE_CONSTRAINT_UNIQUE' });
    const res = giaRes();
    const { log } = await batLog(() => appMod.traLoiLoi(loi, reqGia, res, () => {}));
    assert(res.code === 409 && res.body?.error === 'Dữ liệu bị trùng hoặc vi phạm ràng buộc.', `Nhận ${res.code} ${JSON.stringify(res.body)}`);
    const tho = JSON.stringify(res.body);
    assert(!/raw|UNIQUE|INSERT|users\.email/.test(tho), `Câu trả lời còn lộ: ${tho}`);
    assert(/UNIQUE constraint failed/.test(log), 'Log máy chủ phải giữ chi tiết để người sửa đọc');
  });

  await checkAsync('AN-3 · 500: câu "Có lỗi · mã …" không lộ thông điệp gốc; cùng mã đó có trong log máy chủ kèm chi tiết', async () => {
    const res = giaRes();
    const { log } = await batLog(() => appMod.traLoiLoi(new Error('no such table: bang_bi_mat (SELECT * FROM bang_bi_mat)'), reqGia, res, () => {}));
    const ma = res.body?.details?.ma as string;
    assert(res.code === 500 && /^[0-9a-f]{8}$/.test(ma ?? ''), `Nhận ${res.code} ${JSON.stringify(res.body)}`);
    assert(res.body.error.startsWith(`Có lỗi · mã ${ma}.`) && !/Hãy/.test(res.body.error), `Câu: ${res.body.error}`);
    assert(!/bang_bi_mat|SELECT|no such table/.test(JSON.stringify(res.body)), 'Câu trả lời lộ thông điệp gốc');
    assert(log.includes(ma) && /bang_bi_mat/.test(log), `Log phải có mã ${ma} và chi tiết: ${log}`);
  });

  await checkAsync('AN-3 · Thân JSON hỏng → 400 câu tiếng Việt (không phải 500 kèm câu tiếng Anh của thư viện)', async () => {
    const r = await goi('POST', '/auth/login', { tho: '{hong' });
    assert(r.status === 400 && /không đọc được/.test(r.json?.error ?? ''), `Nhận ${r.status} ${JSON.stringify(r.json)}`);
    assert(!/Unexpected|JSON|token/i.test(r.json?.error ?? ''), `Còn câu của thư viện: ${r.json?.error}`);
  });

  const { HttpError: LoiHttp } = await import('../util.ts');
  check('AN-3 · HttpError giữ nguyên câu và details như cũ (không đổi hành vi các lỗi có chủ đích)', () => {
    const res = giaRes();
    appMod.traLoiLoi(new LoiHttp(503, 'Chưa có dữ liệu demo trong máy.', { needsSeed: true }), reqGia, res, () => {});
    assert(res.code === 503 && res.body?.error === 'Chưa có dữ liệu demo trong máy.' && res.body?.details?.needsSeed === true, `Nhận ${res.code} ${JSON.stringify(res.body)}`);
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: 3 phép đầu ✗ (`traLoiLoi is not a function`; JSON hỏng nhận 500), phép HttpError ✗ theo cùng lý do.
- [x] **Step 3: Sửa `app.ts`.** Thêm import đầu file: `import crypto from 'node:crypto';`. Thay khối `app.use((err: unknown, …) => {…})` (39-53) bằng
  `app.use(traLoiLoi);` và thêm hàm export **bên ngoài** `createApp`:

```ts
/**
 * BỘ XỬ LÝ LỖI CUỐI (AN-3, PR-AN). Người dùng KHÔNG BAO GIỜ thấy câu SQL, tên bảng hay thông điệp nội bộ:
 *   · HttpError       — câu có chủ đích của nghiệp vụ, trả nguyên như cũ.
 *   · thân JSON hỏng  — 400 / quá lớn 413, câu tiếng Việt.
 *   · vi phạm ràng buộc — 409 câu chung; chi tiết vào log.
 *   · còn lại         — 500 "Có lỗi · mã {mã}" (THUAT_NGU g14-054). Cùng mã in vào log kèm lỗi gốc: người dùng báo mã, người sửa
 *                       tìm đúng dòng (Netlify › Logs › Functions › api). Log KHÔNG in thân yêu cầu (có mật khẩu).
 * Máy dev cũng vậy — lỗi gốc đọc ở cửa sổ lệnh đang chạy `npm run dev`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function traLoiLoi(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details ?? undefined });
    return;
  }
  const e = (err ?? {}) as { type?: unknown; code?: unknown };
  if (e.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Dữ liệu gửi lên không đọc được. Tải lại trang rồi thử lại.' });
    return;
  }
  if (e.type === 'entity.too.large') {
    res.status(413).json({ error: 'Dữ liệu gửi lên quá lớn.' });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/SQLITE_CONSTRAINT|constraint failed/i.test(message) || (typeof e.code === 'string' && e.code.startsWith('SQLITE_CONSTRAINT'))) {
    console.warn('[api] 409', req.method, req.path, message);
    res.status(409).json({ error: 'Dữ liệu bị trùng hoặc vi phạm ràng buộc.' });
    return;
  }
  const ma = crypto.randomBytes(4).toString('hex');
  console.error(`[api] mã ${ma}`, req.method, req.path, err);
  res.status(500).json({
    error: `Có lỗi · mã ${ma}. Thử lại sau ít phút; nếu vẫn lỗi, báo Quản trị hệ thống kèm mã này.`,
    details: { ma },
  });
}
```

- [x] **Step 4: Chạy, xanh.** Expected `TẤT CẢ 689 …`. Soát: `grep -rn "Lỗi hệ thống: \|details.raw\|details?.raw" server/src web/src` → rỗng.
- [x] **Step 5: Commit.** `git commit -am "PR-AN (5): AN-3 lỗi 409/500 không lộ SQL; 500 có mã lỗi; JSON hỏng thành 400"`

---

### Task 6: AN-4 — `/api/health` rẻ, không lộ gì

**Files:**
- Create: `server/src/platform/suKhoe.ts`
- Modify: `server/src/app.ts:25-31` (route health đặt **trước** `app.use(attachPrincipal)`)
- Test: `server/src/tests/anToan.tests.ts`

**Interfaces:**
- Produces: `export function taoSuKhoe(hoi?: () => boolean, bayGio?: () => number): (req: Request, res: Response) => void`;
  `export const HOI_LAI_SAU_MS = 30_000`. Hình trả lời giữ nguyên `{ ok: boolean, seeded: boolean }` (web AN-7 và `npm run thu-goi` dùng).

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 6. AN-4 — /api/health

  console.log('\nPR-AN · 6. /api/health công khai nhưng rẻ và không lộ gì');

  await checkAsync('AN-4 · /api/health trả đúng {ok, seeded} + no-store; 5 lần gọi liền chỉ hỏi database tối đa 1 lần', async () => {
    const may2 = createApp().listen(0);
    const cong2 = (may2.address() as any).port as number;
    try {
      const traLoi: any[] = [];
      const n = await demCauHoi(/sqlite_master/, async () => {
        for (let i = 0; i < 5; i++) {
          const r = await fetch(`http://127.0.0.1:${cong2}/api/health`);
          traLoi.push({ status: r.status, cc: r.headers.get('cache-control'), json: await r.json() });
        }
      });
      assert(traLoi.every((x) => x.status === 200 && JSON.stringify(x.json) === '{"ok":true,"seeded":true}'), JSON.stringify(traLoi[0]));
      assert(traLoi.every((x) => /no-store/.test(x.cc ?? '')), `Cache-Control: ${traLoi[0].cc}`);
      assert(n <= 1, `Hỏi database ${n} lần cho 5 lần gọi`);
    } finally { may2.close(); }
  });


  /* Hàm `taoSuKhoe` nhận `hoi`/`bayGio` giả nên phép dưới không cần database thật. */
  const suKhoeMod = await load('../platform/suKhoe.ts');
  check('AN-4 · Database lỗi → 503 {ok:false, seeded:false}, không kèm lỗi; chưa khởi tạo thì hỏi lại sau 30 giây, không phải mỗi lần', () => {
    const hong = suKhoeMod.taoSuKhoe(() => { throw new Error('libsql: mất kết nối tới pisatracking-xxx.turso.io'); }, () => 0);
    const r1 = giaRes();
    const gocLoi = console.error; console.error = () => {};   // nuốt dòng log [health] của phép này
    try { hong({} as any, r1); } finally { console.error = gocLoi; }
    assert(r1.code === 503 && JSON.stringify(r1.body) === '{"ok":false,"seeded":false}', `Nhận ${r1.code} ${JSON.stringify(r1.body)}`);
    let gio = 0; let soLanHoi = 0;
    const chuaCo = suKhoeMod.taoSuKhoe(() => { soLanHoi += 1; return false; }, () => gio);
    for (const g of [0, 1_000, 29_999]) { gio = g; chuaCo({} as any, giaRes()); }
    assert(soLanHoi === 1, `Trong 30 giây hỏi ${soLanHoi} lần`);
    gio = 30_000; const r2 = giaRes(); chuaCo({} as any, r2);
    assert(soLanHoi === 2 && r2.body?.seeded === false, `Sau 30 giây: hỏi ${soLanHoi} lần, ${JSON.stringify(r2.body)}`);
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: phép 1 ✗ (hỏi 5 lần, thiếu `no-store`), phép 2 ✗ (chưa có mô-đun).
- [x] **Step 3: Tạo `server/src/platform/suKhoe.ts`.**

```ts
import type { Request, Response } from 'express';
import { isInitialised } from '../db.ts';

/**
 * /api/health (AN-4, PR-AN). Công khai vì màn đăng nhập bản chính cần biết máy chủ còn sống (AN-7). Hai thứ phải đúng:
 *   · RẺ: hỏi database một lần rồi nhớ trong đời bản hàm. Đã khởi tạo thì không bao giờ hỏi lại; chưa khởi tạo thì hỏi lại
 *     tối đa HOI_LAI_SAU_MS một lần — ai gọi dồn dập cũng không tốn thêm lượt đọc Turso.
 *   · KHÔNG LỘ GÌ: chỉ `{ ok, seeded }`. Database lỗi → 503 `{ ok: false, seeded: false }`, lỗi gốc chỉ vào log.
 */
export const HOI_LAI_SAU_MS = 30_000;

export function taoSuKhoe(hoi: () => boolean = isInitialised, bayGio: () => number = Date.now) {
  let daKhoiTao = false;
  let lanHoi = Number.NEGATIVE_INFINITY;
  return (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (!daKhoiTao && bayGio() - lanHoi >= HOI_LAI_SAU_MS) {
        lanHoi = bayGio();
        daKhoiTao = hoi();
      }
      res.json({ ok: true, seeded: daKhoiTao });
    } catch (e) {
      lanHoi = Number.NEGATIVE_INFINITY;   // lần sau hỏi lại ngay
      console.error('[health]', e);
      res.status(503).json({ ok: false, seeded: false });
    }
  };
}
```

- [x] **Step 4: Sửa `app.ts`.** Import `import { taoSuKhoe } from './platform/suKhoe.ts';`. Xoá route health cũ (29-31); thêm **ngay sau**
  `app.use(cookieParser());` và **trước** `app.use(attachPrincipal);`:

```ts
  /* AN-4: đặt trước attachPrincipal — gọi health kèm cookie cũ cũng không tốn một lượt hỏi phiên. */
  app.get('/api/health', taoSuKhoe());
```
(Mỗi `createApp()` một bộ nhớ riêng — phép kiểm dựng app mới là đếm từ đầu.) Bỏ import `isInitialised` khỏi `app.ts` nếu không còn dùng.

- [x] **Step 5: Chạy, xanh.** Expected `TẤT CẢ 691 …`. Chạy thêm `npm run thu-goi` — Expected: ba dòng `ĐẠT` như cũ (hình trả lời không đổi).
- [x] **Step 6: Commit.** `git add server/src/platform/suKhoe.ts && git commit -am "PR-AN (6): AN-4 /api/health nhớ kết quả, no-store, 503 khi database lỗi"`

---

### Task 7: AN-5 — hạn 10 giây của hàm Netlify

**Bối cảnh (đọc trước):** Netlify cắt hàm đồng bộ sau **10 giây** và **không** cho đặt thời hạn này trong `netlify.toml` (kiểm kê AN-5
ghi "không có cấu hình timeout" — đó không phải cách sửa). `libsql` chạy đồng bộ nên không cắt được một giao dịch đang chạy. Việc làm
được: không **bắt đầu** giao dịch khi sắp hết giờ; dọn giao dịch treo; ghi log lời gọi chậm để PR-Z2c đo (Task 10 Step 5–6 của plan
bản chính). Số đo trên Netlify (plan bản chính, Nhật ký 6b Step 7): trang nặng nhất 3,4 s — còn xa 10 s, nên đây là lưới an toàn.

**Files:**
- Create: `server/src/platform/hanGio.ts`
- Modify: `server/src/db.ts:151-167` (`tx`; + `donGiaoDichTreo`)
- Modify: `server/src/app.ts` (+ `export function demGio`, gắn sau `cookieParser`, trước `attachPrincipal`)
- Test: `server/src/tests/anToan.tests.ts`

**Interfaces:**
- Produces (`hanGio.ts`): `HAN_HAM_NETLIFY_MS = 10_000`, `KHONG_MO_GIAO_DICH_KHI_CON_MS = 2_500`, `LOG_CHAM_MS = 3_000`,
  `chayVoiHan<T>(hetLuc: number, fn: () => T): T`, `conLaiMs(bayGio?: number): number | null`, `chanGiaoDichNeuSapHetGio(bayGio?: number): void`
  (ném `HttpError(503, 'Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.')`).
- Produces (`db.ts`): `export function donGiaoDichTreo(): boolean`. (`app.ts`): `export function demGio(req, res, next): void`.
- `hanGio.ts` **không** import `db.ts` (tránh vòng import: `db.ts` import `hanGio.ts`).

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 7. AN-5 — hạn 10 giây

  console.log('\nPR-AN · 7. Không mở giao dịch Turso khi hàm Netlify sắp hết 10 giây');
  const hg = await load('../platform/hanGio.ts');
  const dbMod: any = await import('../db.ts');
  const coKhoa = (k: string) => !!conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(k);
  const ghiThu = (k: string) => conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(k, 'x', new Date().toISOString());

  check('AN-5 · Còn < 2,5 giây: tx() từ chối mở giao dịch (503 "chưa lưu gì"), không ghi gì; còn nhiều giờ thì chạy bình thường', () => {
    assertThrows(() => hg.chayVoiHan(Date.now() + 1_000, () => dbMod.tx(() => ghiThu('an5_sap_het'))), /bận.*chưa lưu gì/, 'Sắp hết giờ mà vẫn mở giao dịch');
    assert(!coKhoa('an5_sap_het'), 'Bị từ chối mà vẫn ghi');
    hg.chayVoiHan(Date.now() + 60_000, () => dbMod.tx(() => ghiThu('an5_con_gio')));
    assert(coKhoa('an5_con_gio'), 'Còn giờ mà không ghi được');
    conn.prepare("DELETE FROM demo_config WHERE key LIKE 'an5_%'").run();
  });

  check('AN-5 · Ngoài một lời gọi có hạn (máy dev, lệnh, phép kiểm): không chặn gì; giao dịch LỒNG không bị hỏi lại', () => {
    assert(hg.conLaiMs() === null, 'Ngoài lời gọi mà có hạn');
    dbMod.tx(() => ghiThu('an5_ngoai'));
    assert(coKhoa('an5_ngoai'), 'Máy dev bị chặn');
    /* Giao dịch ngoài mở lúc còn giờ; giao dịch trong (savepoint) chạy dù đồng hồ đã qua ngưỡng — cắt giữa chừng mới là điều cần tránh. */
    hg.chayVoiHan(Date.now() + 2_600, () => dbMod.tx(() => {
      const cho = Date.now() + 200; while (Date.now() < cho) { /* đẩy đồng hồ qua ngưỡng 2,5 giây trong lúc giao dịch ngoài đang mở */ }
      dbMod.tx(() => ghiThu('an5_long'));
    }));
    assert(coKhoa('an5_long'), 'Savepoint trong giao dịch đã mở bị chặn');
    conn.prepare("DELETE FROM demo_config WHERE key LIKE 'an5_%'").run();
  });

  check('AN-5 · donGiaoDichTreo(): còn giao dịch bỏ dở trên kết nối thì cuộn lại, trả true; không có thì trả false', () => {
    conn.exec('BEGIN');
    ghiThu('an5_treo');
    assert(dbMod.donGiaoDichTreo() === true && !conn.inTransaction, 'Không dọn được giao dịch treo');
    assert(!coKhoa('an5_treo'), 'Dòng của giao dịch treo vẫn còn');
    assert(dbMod.donGiaoDichTreo() === false, 'Không có gì mà vẫn báo dọn');
  });

  check('AN-5 · demGio: bản chính gắn hạn 10 giây cho cả lời gọi; máy dev không gắn', () => {
    let trongHan: number | null = null;
    process.env.BAN_CHINH = '1';
    try { appMod.demGio({ method: 'GET', path: '/api/x' } as any, giaRes(), () => { trongHan = hg.conLaiMs(); }); }
    finally { delete process.env.BAN_CHINH; }
    assert(trongHan !== null && trongHan > 9_000 && trongHan <= 10_000, `Bản chính: còn ${trongHan} ms`);
    let dev: number | null = 0;
    appMod.demGio({ method: 'GET', path: '/api/x' } as any, giaRes(), () => { dev = hg.conLaiMs(); });
    assert(dev === null, `Máy dev có hạn: ${dev}`);
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: 4 phép ✗ (thiếu mô-đun / `donGiaoDichTreo is not a function` / `demGio is not a function`).
- [x] **Step 3: Tạo `server/src/platform/hanGio.ts`.**

```ts
import { AsyncLocalStorage } from 'node:async_hooks';
import { HttpError } from '../util.ts';

/**
 * HẠN GIỜ MỖI LỜI GỌI (AN-5, PR-AN). Netlify cắt hàm đồng bộ sau 10 giây — và không đặt khác được trong netlify.toml. Bị cắt
 * giữa một giao dịch Turso là giữ khoá ghi cho tới khi Turso tự huỷ phiên đó. `libsql` chạy đồng bộ nên KHÔNG dừng được một
 * giao dịch đang chạy; chỉ có thể KHÔNG BẮT ĐẦU nó khi còn quá ít giờ. `tx()` (db.ts) hỏi hàm dưới đây trước khi mở giao dịch ngoài.
 *
 * Hạn chỉ gắn ở bản chính (middleware `demGio` trong app.ts). Ngoài một lời gọi có hạn (máy dev, lệnh ops, phép kiểm, hàm định kỳ)
 * `conLaiMs()` là null và không chặn gì. Không import db.ts (db.ts import file này).
 */
export const HAN_HAM_NETLIFY_MS = 10_000;
export const KHONG_MO_GIAO_DICH_KHI_CON_MS = 2_500;
export const LOG_CHAM_MS = 3_000;

const kho = new AsyncLocalStorage<{ hetLuc: number }>();

export function chayVoiHan<T>(hetLuc: number, fn: () => T): T {
  return kho.run({ hetLuc }, fn);
}

export function conLaiMs(bayGio: number = Date.now()): number | null {
  const s = kho.getStore();
  return s ? s.hetLuc - bayGio : null;
}

export function chanGiaoDichNeuSapHetGio(bayGio: number = Date.now()): void {
  const con = conLaiMs(bayGio);
  if (con !== null && con < KHONG_MO_GIAO_DICH_KHI_CON_MS) {
    throw new HttpError(503, 'Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.');
  }
}
```

- [x] **Step 4: Sửa `db.ts`.** Import `import { chanGiaoDichNeuSapHetGio } from './platform/hanGio.ts';`. Trong `tx`, thay dòng
  `if (!conn.inTransaction) return conn.transaction(fn)();` bằng:

```ts
  if (!conn.inTransaction) {
    /* AN-5: giao dịch NGOÀI chỉ mở khi lời gọi còn đủ giờ; savepoint bên trong một giao dịch đã mở thì không hỏi lại. */
    chanGiaoDichNeuSapHetGio();
    return conn.transaction(fn)();
  }
```
Thêm cuối file:

```ts
/**
 * AN-5: đầu mỗi lời gọi API, nếu kết nối còn một giao dịch bỏ dở (lần gọi trước trên cùng bản hàm bị cắt) thì cuộn lại. Không mở
 * kết nối mới nếu chưa có (`instance` rỗng → không có gì để dọn, không tốn lượt mạng). Trả true khi đã dọn.
 */
export function donGiaoDichTreo(): boolean {
  if (!instance || !instance.inTransaction) return false;
  try { instance.exec('ROLLBACK'); } catch { /* kết nối đã hỏng — giao dịch cũng mất theo */ }
  savepointDepth = 0;
  return true;
}
```

- [x] **Step 5: Sửa `app.ts`.** Import `import { HAN_HAM_NETLIFY_MS, LOG_CHAM_MS, chayVoiHan } from './platform/hanGio.ts';`,
  `import { donGiaoDichTreo } from './db.ts';`, `import { laBanChinh } from './moiTruong.ts';`. Hàm export bên ngoài `createApp`:

```ts
/**
 * ĐẾM GIỜ MỖI LỜI GỌI (AN-5). Đặt SAU express.json/cookieParser: ngữ cảnh AsyncLocalStorage không đi qua sự kiện luồng của bộ đọc
 * thân yêu cầu. Đường tải tệp (multer) có thể mất hạn — khi đó chỉ là không chặn (an toàn như trước PR này).
 *   · Dọn giao dịch treo của lần gọi trước.
 *   · Log `[cham]` mọi lời gọi ≥ LOG_CHAM_MS — PR-Z2c đọc để biết trang nào cần gộp truy vấn.
 *   · Bản chính: gắn hạn HAN_HAM_NETLIFY_MS cho cả lời gọi.
 */
export function demGio(req: Request, res: Response, next: NextFunction): void {
  const batDau = Date.now();
  if (donGiaoDichTreo()) console.error('[api] đã cuộn lại một giao dịch bỏ dở từ lần gọi trước');
  res.on('finish', () => {
    const ms = Date.now() - batDau;
    if (ms >= LOG_CHAM_MS) console.warn(`[cham] ${req.method} ${req.path} ${ms} ms`);
  });
  if (!laBanChinh()) { next(); return; }
  chayVoiHan(batDau + HAN_HAM_NETLIFY_MS, next);
}
```
Trong `createApp`, thứ tự middleware thành: đổi đường Netlify → `express.json` → `cookieParser` → **`app.use(demGio)`** → route health (Task 6)
→ `attachPrincipal` → `api` → 404 → `traLoiLoi`. (Health đặt sau `demGio` cũng được — nó không mở giao dịch.)

- [x] **Step 6: Chạy, xanh.** Expected `TẤT CẢ 695 …`. Kiểm thêm: `npm run thu-goi` vẫn ĐẠT (đường gói Netlify có `demGio`).
- [x] **Step 7: Commit.** `git add server/src/platform/hanGio.ts && git commit -am "PR-AN (7): AN-5 không mở giao dịch khi sắp hết 10 giây, dọn giao dịch treo, log lời gọi chậm"`

---

### Task 8: AN-8 — đếm bằng chứng một câu cho cả bảng

**Files:**
- Modify: `server/src/cases/cases.ts` — ngay sau khối `const caseRows = …` trong `skillSupportBoard` (~dòng 2010-2017); dòng
  `...caseCardOf(c.id, c),` (~2237); `function caseCardOf(caseId: number, c: any)` (~2263); khối `attachmentCount:` (~2377-2379);
  hàm mới ngay **trên** `caseCardOf`.
- Test: `server/src/tests/anToan.tests.ts`

**Không** chạm dòng `canClose:` (~2234, PR-S1 sửa) và hai dòng chú thích giữa nó với `...caseCardOf` — sửa đúng một dòng `...caseCardOf`.

**Interfaces:**
- Produces: `export function demBangChungCase(caseIds: number[]): Map<number, number>`; `caseCardOf(caseId, c, soBangChung: Map<number, number>)`.
  Hình dữ liệu trả ra không đổi (`attachmentCount: number`); phép kiểm cũ `PR-HV · Q8` (`hoSoHocVien.tests.ts:236`) khoá tính đúng.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 8. AN-8 — N+1 đếm bằng chứng

  console.log('\nPR-AN · 8. Bảng kỹ năng đếm bằng chứng một lần cho mọi thẻ Case');
  const casesMod: any = await import('../cases/cases.ts');

  await checkAsync('AN-8 · skillSupportBoard của một em có ≥ 2 Case: đúng MỘT câu hỏi bảng attachments; số trên từng thẻ vẫn đúng', async () => {
    const cap = conn.prepare(
      `SELECT student_id, cycle_id FROM sos_cases GROUP BY student_id, cycle_id HAVING COUNT(*) >= 2 ORDER BY student_id LIMIT 1`,
    ).get() as any;
    assert(cap, 'Bộ demo phải có một em có ít nhất hai Case');
    let bang: any = null;
    const n = await demCauHoi(/FROM attachments/, () => { bang = casesMod.skillSupportBoard(P.admin, cap.student_id, cap.cycle_id); });
    const the = bang.rows.flatMap((r: any) => r.cases) as any[];
    assert(the.length >= 2, `Bảng chỉ có ${the.length} thẻ`);
    assert(n === 1, `Đếm bằng chứng ${n} câu cho ${the.length} thẻ`);
    const dem = (id: number) => (conn.prepare("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'sos_case' AND owner_id = ?").get(id) as any).n;
    for (const c of the) assert(c.attachmentCount === dem(c.id), `Case ${c.id}: ${c.attachmentCount} ≠ ${dem(c.id)}`);
    assert(casesMod.demBangChungCase([]).size === 0, 'Danh sách rỗng phải trả bản đếm rỗng, không hỏi database');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected ✗ ("Đếm bằng chứng N câu cho N thẻ").
- [x] **Step 3: Sửa `cases.ts`.** Hàm mới ngay trên `function caseCardOf`:

```ts
/**
 * SỐ BẰNG CHỨNG CỦA NHIỀU CASE MỘT LƯỢT (AN-8, PR-AN). Trước đây mỗi thẻ Case một câu `COUNT(*)` — một em năm Case là năm lượt
 * mạng Turso chỉ để in "Bằng chứng (n)". Case không có dòng nào → không có trong bản đếm (đọc bằng `?? 0`).
 */
export function demBangChungCase(caseIds: number[]): Map<number, number> {
  const ra = new Map<number, number>();
  if (!caseIds.length) return ra;
  const rows = db()
    .prepare(
      `SELECT owner_id AS id, COUNT(*) AS n FROM attachments
        WHERE owner_type = 'sos_case' AND owner_id IN (SELECT value FROM json_each(?))
        GROUP BY owner_id`,
    )
    .all(JSON.stringify(caseIds)) as any[];
  for (const r of rows) ra.set(Number(r.id), Number(r.n));
  return ra;
}
```
Trong `skillSupportBoard`, ngay sau câu `const caseRows = conn.prepare(…).all(…) as any[];`:

```ts
  /* AN-8: số bằng chứng của MỌI Case trên bảng — một câu hỏi, không phải một câu cho mỗi thẻ. */
  const soBangChung = demBangChungCase(caseRows.map((c) => c.id as number));
```
Dòng `...caseCardOf(c.id, c),` → `...caseCardOf(c.id, c, soBangChung),`. Chữ ký `function caseCardOf(caseId: number, c: any, soBangChung: Map<number, number>)`.
Khối `attachmentCount:` (2377-2379) →

```ts
    /* Số bằng chứng của Case (PR-HV) — để nhãn "Bằng chứng (n)" thu gọn mà không phải tải danh sách tệp. Đếm sẵn cả bảng (AN-8). */
    attachmentCount: soBangChung.get(caseId) ?? 0,
```
`grep -n "caseCardOf(" server/src/cases/cases.ts` → đúng 2 dòng (định nghĩa + một lời gọi). Có thêm lời gọi → 🛑.

- [x] **Step 4: Chạy, xanh.** Expected `TẤT CẢ 696 …`; `PR-HV · Q8 Thẻ case có số bằng chứng` vẫn ✓.
- [x] **Step 5: Commit.** `git commit -am "PR-AN (8): AN-8 bảng kỹ năng đếm bằng chứng một câu cho mọi thẻ Case"`

---

### Task 9: RB-1 — chốt "-" tự chạy đầu thứ Hai (Netlify Scheduled Function, quyết định 4.6)

**Bối cảnh:** `settleNoShows(today)` (`absence.ts:609`) đã chạy lặp vô hại (chạy mười lần chỉ chốt một lần — phép kiểm `run.ts:8446`), chỉ
thiếu người gọi khi không ai mở web. PR này **chỉ gọi** nó, **không sửa** `absence.ts` (PR-S1 đang sửa file đó). Theo tài liệu Netlify:
hàm định kỳ chạy tối đa **30 giây**, chỉ chạy trên bản **đã publish (production)**, không chạy trên bản nháp — kiểm thật là việc của
PR-Z2c (Task 11 Step 3 ghi chú sang plan bản chính).

**Files:**
- Create: `server/src/ops/chotVangDinhKy.ts`
- Create: `netlify/functions/chot-vang.ts`
- Modify: `netlify.toml` (thêm khối sau `[functions]`)
- Modify: `scripts/thu-goi-function.mjs` (gói thử hàm mới)
- Test: `server/src/tests/anToan.tests.ts`

**Interfaces:**
- Produces: `export const LICH_CHOT_VANG = '5 17,23 * * 0'`; `export type KetQuaChotVang = { ngay: string; daChot: number; boQua: 'chua-khoi-tao' | null; ms: number }`;
  `export function chotVangDinhKy(o?: { ngay?: string; chot?: (ngay: string) => number; daKhoiTao?: () => boolean }): KetQuaChotVang`.
  Hàm Netlify `chot-vang`: `export const handler = async () => ({ statusCode, body })`.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 9. RB-1 — chốt "-" định kỳ

  console.log('\nPR-AN · 9. Chốt "-" tự chạy đầu thứ Hai kể cả khi không ai mở web (4.6)');
  const cv = await load('../ops/chotVangDinhKy.ts');
  const utilMod: any = await import('../util.ts');

  check('RB-1 · chotVangDinhKy gọi đúng settleNoShows(ngày); không truyền ngày thì dùng NGÀY THẬT giờ Việt Nam; database chưa khởi tạo thì bỏ qua, không gọi', () => {
    let nhan: string | null = null;
    const a = cv.chotVangDinhKy({ ngay: '2026-09-21', chot: (d: string) => { nhan = d; return 3; }, daKhoiTao: () => true });
    assert(nhan === '2026-09-21' && a.daChot === 3 && a.boQua === null && a.ngay === '2026-09-21', JSON.stringify(a));
    nhan = null;
    cv.chotVangDinhKy({ chot: (d: string) => { nhan = d; return 0; }, daKhoiTao: () => true });
    assert(nhan === utilMod.todayInBusinessTz(), `Ngày mặc định ${nhan}, ngày thật ${utilMod.todayInBusinessTz()}`);
    let goi = 0;
    const b = cv.chotVangDinhKy({ chot: () => { goi += 1; return 0; }, daKhoiTao: () => false });
    assert(goi === 0 && b.boQua === 'chua-khoi-tao' && b.daChot === 0, JSON.stringify(b));
  });

  check('RB-1 · Chạy thật trên database: lần hai cùng ngày không chốt thêm gì (lịch chạy 2 lần mỗi sáng thứ Hai là vô hại)', () => {
    const lan1 = cv.chotVangDinhKy({ ngay: TODAY });
    const lan2 = cv.chotVangDinhKy({ ngay: TODAY });
    assert(lan1.boQua === null && typeof lan1.daChot === 'number', JSON.stringify(lan1));
    assert(lan2.daChot === 0, `Lần hai chốt thêm ${lan2.daChot}`);
  });

  check('RB-1 · netlify.toml hẹn hàm chot-vang đúng lịch 00:05 và 06:05 sáng thứ Hai giờ VN; hàm tự bật chế độ bản chính và chỉ gọi chotVangDinhKy', () => {
    const toml = fsMod.readFileSync(pathMod.join(REPO, 'netlify.toml'), 'utf8');
    const khoi = /\[functions\."chot-vang"\][^[]*schedule\s*=\s*"([^"]+)"/.exec(toml);
    assert(khoi && khoi[1] === cv.LICH_CHOT_VANG && cv.LICH_CHOT_VANG === '5 17,23 * * 0', `Lịch trong toml: ${khoi?.[1]}`);
    const ham = fsMod.readFileSync(pathMod.join(REPO, 'netlify/functions/chot-vang.ts'), 'utf8');
    assert(/process\.env\.BAN_CHINH\s*=\s*'1'/.test(ham) && /chotVangDinhKy\(\)/.test(ham), 'Hàm chot-vang phải đặt BAN_CHINH=1 và gọi chotVangDinhKy()');
    assert(!/settleNoShows/.test(ham), 'Hàm Netlify không gọi thẳng settleNoShows — đi qua chotVangDinhKy');
  });
```

- [x] **Step 2: Chạy, đỏ.** Expected: 3 phép `RB-1 ·` ✗.
- [x] **Step 3: Tạo `server/src/ops/chotVangDinhKy.ts`.**

```ts
import { isInitialised } from '../db.ts';
import { settleNoShows } from '../fasttrack/absence.ts';
import { todayInBusinessTz } from '../util.ts';

/**
 * CHỐT DẤU "-" ĐỊNH KỲ (RB-1, quyết định 4.6, PR-AN). Trước đây chỉ chốt khi có người mở trang (attempts, Việc cần làm) — tuần không
 * ai mở web thì số liệu còn "-" chưa chốt. Netlify gọi hàm `chot-vang` theo LICH_CHOT_VANG; hàm đó gọi đúng hàm này.
 *
 * `settleNoShows` chạy lặp vô hại (một buổi chỉ chốt một lần) nên lịch chạy HAI lần mỗi sáng thứ Hai: lần 06:05 là lưới an toàn khi
 * lần 00:05 lỗi. Ngày dùng là NGÀY THẬT giờ Việt Nam — `settleNoShows` chốt tuần có `week_end < ngày`, nên phải chạy SAU nửa đêm VN.
 *
 * Cron của Netlify tính giờ UTC: 17:05 và 23:05 Chủ nhật UTC = 00:05 và 06:05 thứ Hai giờ Việt Nam (UTC+7).
 * Đổi lịch thì sửa CẢ hằng số này lẫn `netlify.toml` (phép kiểm so hai chỗ).
 */
export const LICH_CHOT_VANG = '5 17,23 * * 0';

export type KetQuaChotVang = { ngay: string; daChot: number; boQua: 'chua-khoi-tao' | null; ms: number };

export function chotVangDinhKy(o: {
  ngay?: string; chot?: (ngay: string) => number; daKhoiTao?: () => boolean;
} = {}): KetQuaChotVang {
  const batDau = Date.now();
  const ngay = o.ngay ?? todayInBusinessTz();
  if (!(o.daKhoiTao ?? isInitialised)()) return { ngay, daChot: 0, boQua: 'chua-khoi-tao', ms: Date.now() - batDau };
  const daChot = (o.chot ?? settleNoShows)(ngay);
  return { ngay, daChot, boQua: null, ms: Date.now() - batDau };
}
```

- [x] **Step 4: Tạo `netlify/functions/chot-vang.ts`.**

```ts
/**
 * HÀM ĐỊNH KỲ CỦA BẢN CHÍNH — chốt dấu "-" đầu thứ Hai (RB-1). Lịch ở `netlify.toml` (`[functions."chot-vang"]`). Không có logic
 * nghiệp vụ ở đây: mọi thứ ở `server/src/ops/chotVangDinhKy.ts`. Kết quả in ra log (Netlify › Logs › Functions › chot-vang).
 */
import { chotVangDinhKy } from '../../server/src/ops/chotVangDinhKy.ts';

/* File này CHỈ chạy trên Netlify — luôn là bản chính (cùng lý do `api.ts`). */
process.env.BAN_CHINH = '1';

export const handler = async () => {
  try {
    const kq = chotVangDinhKy();
    console.log('[chot-vang]', JSON.stringify(kq));
    return { statusCode: 200, body: JSON.stringify(kq) };
  } catch (e) {
    console.error('[chot-vang] lỗi', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};
```

- [x] **Step 5: `netlify.toml`** — thêm ngay sau khối `[functions]` (sau dòng `external_node_modules = …`):

```toml
# Chốt dấu "-" đầu thứ Hai kể cả khi không ai mở web (RB-1). Giờ UTC: 00:05 và 06:05 sáng thứ Hai giờ Việt Nam.
# Đổi lịch thì sửa cả LICH_CHOT_VANG trong server/src/ops/chotVangDinhKy.ts.
[functions."chot-vang"]
  schedule = "5 17,23 * * 0"
```

- [x] **Step 6: Chạy, xanh.** Expected `TẤT CẢ 699 …`.
- [x] **Step 7: Gói thử như Netlify.** Sửa `scripts/thu-goi-function.mjs`: sau khối kiểm ba đường của `api` (trước `process.chdir(repo)`),
  thêm đoạn gói và gọi `chot-vang` trên **bản sao** database dev (không bao giờ chạm file gốc, không bao giờ chạm Turso — biến Turso đã bị
  xoá ở đầu script):

```js
/* RB-1 (PR-AN): hàm định kỳ chot-vang — gói y như Netlify rồi gọi trên BẢN SAO database dev (hàm này GHI: chốt dấu "-"). */
const outCv = path.join(tam, 'chot-vang.cjs');
await build({
  entryPoints: [path.join(repo, 'netlify/functions/chot-vang.ts')],
  bundle: true, platform: 'node', target: 'node22', format: 'cjs', outfile: outCv,
  external: ['libsql', '@libsql/*'], logLevel: 'warning',
});
const banSao = path.join(tam, 'ban-sao-chot-vang.sqlite');
{
  const Db = require('libsql');
  const goc = new Db(path.join(repo, 'data', 'pisa-demo.sqlite'));
  goc.exec(`VACUUM INTO '${banSao.replace(/\\/g, '/').replace(/'/g, "''")}'`);
  goc.close();
}
process.env.PISA_DB = banSao;              // bản gói chot-vang đọc biến này lúc nạp — đặt TRƯỚC require
const { handler: chotVang } = require(outCv);
for (const lan of [1, 2]) {
  const r = await chotVang({}, {});
  const kq = JSON.parse(r.body ?? '{}');
  const ok = r.statusCode === 200 && typeof kq.daChot === 'number' && kq.boQua === null && (lan === 1 || kq.daChot === 0);
  if (!ok) hong++;
  console.log(`${ok ? 'ĐẠT' : 'HỎNG'}  chot-vang lần ${lan}  → ${r.statusCode}  ${String(r.body).slice(0, 120)}`);
}
```
Chạy `npm run thu-goi` (cần `data/pisa-demo.sqlite` — chưa có thì `npm run seed` trước). Expected: ba dòng `ĐẠT` cũ + hai dòng
`ĐẠT  chot-vang lần 1/2`, lần 2 có `"daChot":0`. Ghi số `daChot` lần 1 và `ms` vào Nhật ký. `data/pisa-demo.sqlite` gốc **không đổi**
(`git status` sạch với thư mục `data/` — file này không nằm trong git; kiểm bằng thời điểm sửa file trước/sau).

- [x] **Step 8: Commit.**

```bash
git add server/src/ops/chotVangDinhKy.ts netlify/functions/chot-vang.ts netlify.toml scripts/thu-goi-function.mjs server/src/tests/anToan.tests.ts
git commit -m "PR-AN (9): RB-1 hàm định kỳ Netlify chốt dấu '-' 00:05 và 06:05 sáng thứ Hai"
```

---

### Task 10: AN-7 — màn đăng nhập bản chính báo đúng khi máy chủ hỏng

**Files:**
- Modify: `web/src/modules/platform/WelcomePage.tsx` (import dòng 4; `WelcomePage` 88-126; `LoginForm` catch dòng 154; `RegisterForm` catch dòng 214; thêm hai hàm/khối nhỏ)

**Interfaces:**
- Consumes: `GET /api/health` → `{ ok, seeded }` hoặc 503 (Task 6); `ApiError` (`web/src/lib/api.ts`).
- Web không có bộ phép kiểm — nghiệm thu bằng `npm run typecheck` + KIỂM Task 12.

- [x] **Step 1: Import.** Dòng 4 `import { api } from '../../lib/api.ts';` → `import { ApiError, api } from '../../lib/api.ts';`
- [x] **Step 2: Hai hàm nhỏ** ngay trên `export default function WelcomePage()`:

```tsx
type SucKhoe = { ok: boolean; seeded: boolean };

/**
 * BẢN CHÍNH KHÔNG VÀO ĐƯỢC (AN-7). Bản chính tắt `/demo/accounts`, nên không suy "máy chủ chưa chạy" từ đó được như máy dev —
 * hỏi `/api/health`. Không có hướng dẫn gõ lệnh: người đọc là giáo viên, không phải người chạy máy.
 */
function BanChinhChuaVaoDuoc({ chuaKhoiTao, onRetry }: { chuaKhoiTao: boolean; onRetry: () => void }) {
  return (
    <div className="card p-5 border-amber-300/40">
      <h2 className="text-base font-semibold text-amber-200">
        {chuaKhoiTao ? 'Hệ thống chưa được khởi tạo' : 'Chưa kết nối được hệ thống dữ liệu'}
      </h2>
      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
        {chuaKhoiTao
          ? 'Chưa có tài khoản nào để đăng nhập. Báo Quản trị hệ thống.'
          : 'Hệ thống tạm thời không phản hồi. Thử lại sau ít phút; nếu vẫn không vào được, báo Quản trị hệ thống.'}
      </p>
      <button className="btn btn-primary mt-4" onClick={onRetry}>Thử lại</button>
    </div>
  );
}

/**
 * Câu lỗi đọc được khi bấm Đăng nhập / Gửi đăng ký. Lỗi mạng hoặc ≥ 500 (trang lỗi của Netlify là HTML — không in ra) → một câu
 * chung; câu "Có lỗi · mã …" của máy chủ (AN-3) thì giữ để người dùng báo được mã.
 */
function cauLoiDeDoc(x: unknown): string {
  if (x instanceof ApiError && (x.status < 500 || x.details?.ma)) return x.message;
  return 'Chưa kết nối được hệ thống dữ liệu. Thử lại sau ít phút.';
}
```

- [x] **Step 3: `WelcomePage`.** Ngay dưới `const info = useApi<AuthInfo>('/auth/info');` thêm:

```tsx
  /* AN-7: bản chính hỏi /api/health (máy dev vẫn suy từ /demo/accounts như cũ). */
  const suKhoe = useApi<SucKhoe>(LA_BAN_CHINH ? '/health' : null);
  const banChinhHong = LA_BAN_CHINH && (!!suKhoe.error || suKhoe.data?.seeded === false);
```
Đổi `{noData ? (` thành một nhánh thêm ở trước:

```tsx
        {banChinhHong ? (
          <div className="mt-4">
            <BanChinhChuaVaoDuoc chuaKhoiTao={!suKhoe.error && suKhoe.data?.seeded === false} onRetry={suKhoe.reload} />
          </div>
        ) : noData ? (
```
(phần còn lại giữ nguyên; nhớ không thừa/thiếu ngoặc — `typecheck` bắt.)

- [x] **Step 4: Hai chỗ `catch`.** `LoginForm` (dòng 154) và `RegisterForm` (dòng 214): `setErr(x.message)` → `setErr(cauLoiDeDoc(x))`;
  đổi `catch (x: any)` → `catch (x: unknown)`.
- [x] **Step 5:** `npm run typecheck` — Expected sạch. Soát chữ: `grep -n "Hãy\|npm run" web/src/modules/platform/WelcomePage.tsx` —
  `npm run` chỉ còn trong `SetupHelp` (máy dev).
- [x] **Step 6: Commit.** `git commit -am "PR-AN (10): AN-7 màn đăng nhập bản chính hỏi /api/health, câu lỗi dễ đọc"`

---

### Task 11: Tài liệu — `TRIEN_KHAI.md`, `CODE_MAP.md`, ghi chú cho PR-Z2c

**Files:** `TRIEN_KHAI.md` §11 (bảng ~dòng 452-461; mục mới sau 11.2) · `CODE_MAP.md` (khối bản chính ~dòng 283-292) ·
`docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md` Task 10.

- [x] **Step 1: `TRIEN_KHAI.md` §11** — thêm ba dòng vào bảng "Triệu chứng | Làm gì" (tiếng Việt cơ bản, cho chủ sản phẩm):

```markdown
| Web báo **"Có lỗi · mã …"** | Ghi lại mã (8 chữ/số) và việc đang làm → gửi session thiết kế. Mã giúp tìm đúng dòng trong nhật ký máy chủ |
| Web báo **"Máy chủ đang bận, chưa lưu gì"** | Bấm lại sau ít phút — dữ liệu chưa bị đổi. Lặp lại nhiều lần ở cùng một trang → gửi session thiết kế tên trang |
| Giáo viên báo **"Đăng nhập sai quá nhiều lần"** | Chờ tối đa 15 phút rồi thử lại (hệ thống tự mở). Quên mật khẩu thì Quản trị hệ thống đặt lại, nhưng vẫn phải chờ hết 15 phút |
```
Thêm mục mới **sau** mục 11.2:

```markdown
### 11.3. Chốt dấu "-" tự động mỗi sáng thứ Hai

Bạn **không cần làm gì**. Mỗi sáng thứ Hai lúc 00:05 và 06:05, máy chủ tự chốt các bài còn dấu "-" của tuần trước thành
"Không dự thi" — kể cả khi không ai mở web. Muốn xem nó có chạy không: trang Netlify của site › **Logs** › **Functions** ›
**chot-vang** — mỗi lần chạy có một dòng bắt đầu bằng `[chot-vang]`. Không thấy dòng nào sau một sáng thứ Hai → gửi session thiết kế.
```

- [x] **Step 2: `CODE_MAP.md`** — thêm vào bảng của khối bản chính (cạnh dòng `Phiên đăng nhập (cookie)…`), đúng định dạng hai cột:

```markdown
| Giới hạn số lần thử đăng nhập/đăng ký (AN-1), bảng `auth_attempts` | `server/src/platform/gioiHanThu.ts` · khối `/auth` trong `server/src/routes/index.ts` |
| Câu lỗi 409/500 trả người dùng, mã lỗi trong log (AN-3) | `server/src/app.ts` → `traLoiLoi` |
| `/api/health` công khai, nhớ kết quả (AN-4) | `server/src/platform/suKhoe.ts` |
| Hạn 10 giây của hàm Netlify: không mở giao dịch khi sắp hết giờ, log `[cham]` (AN-5) | `server/src/platform/hanGio.ts` · `server/src/db.ts` → `tx`, `donGiaoDichTreo` · `server/src/app.ts` → `demGio` |
| Hàm định kỳ chốt "-" 00:05 + 06:05 sáng thứ Hai (RB-1) | `netlify/functions/chot-vang.ts` → `server/src/ops/chotVangDinhKy.ts` · lịch ở `netlify.toml` |
```
Chạy lệnh kiểm đường chết ở đầu `CODE_MAP.md` — Expected: không có dòng `CHET:`.

- [x] **Step 3: Ghi chú cho PR-Z2c** — trong `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`, ngay dưới dòng Step 5 của
  Task 10 (`- [ ] **Step 5: Đo thời gian** …`), thêm một khối trích:

```markdown
  > **🆕 22/09 (PR-AN):** (1) Sau Step 3b: Netlify › Logs › Functions phải có **hai** hàm `api` và `chot-vang`; `chot-vang` hiện
  > lịch chạy kế tiếp (00:05 hoặc 06:05 sáng thứ Hai giờ VN). Sáng thứ Hai đầu tiên sau khi lên: log `chot-vang` có dòng
  > `[chot-vang] {"ngay":…,"daChot":…,"boQua":null,…}` — ghi vào Nhật ký. (2) Khi đo Step 5: tìm dòng `[cham]` trong log `api`
  > (mọi lời gọi ≥ 3 giây) — đưa vào bảng đo và Step 6. (3) Bản chính dựng từ `schema.sql` nên đã có bảng `auth_attempts`, không cần
  > migrate. (4) Kiểm AN-1 trên địa chỉ chính thức: 6 lần đăng nhập sai một email thử → lần 6 báo "Đăng nhập sai quá nhiều lần".
```

- [x] **Step 4: Commit.** `git commit -am "PR-AN (11): TRIEN_KHAI §11 (mã lỗi, máy chủ bận, khoá đăng nhập, chốt '-' tự động), CODE_MAP, ghi chú Z2c"`

---

### Task 12: KIỂM — bấm thử (máy dev, desktop)

**Files:** không sửa mã. Ảnh (nếu chụp): `thiet-ke/anh/pr-an/`.

- [x] **Step 1: 🛑 Hỏi chủ sản phẩm trước khi bật máy.** Nhắn: "Cần dùng cổng 4000, 5173 và 5174 để bấm thử PR-AN. Anh/chị đang mở bản
  demo ở thư mục chính không? Nếu có, tắt giúp em." Chờ trả lời.
- [x] **Step 2:** Trong worktree: `npm run seed` rồi chạy nền `npm run dev` (**không** `preview_start`). Bấm bằng trình duyệt hoặc Playwright
  kênh Chrome (`npm i --no-save playwright`, `chromium.launch({ channel: 'chrome' })`; chạy script từ Git Bash với `MSYS_NO_PATHCONV=1`).
  Mở `http://localhost:5173` (chưa đăng nhập).
- [x] **Step 3: KIỂM — đăng nhập sai nhiều lần** (ghi ✓/✗ vào Nhật ký):
  1. Tab **Đăng nhập**, email `dovutuanphong95.pisa@gmail.com`, mật khẩu sai → câu `Email hoặc mật khẩu không đúng.` Lặp tới lần 5.
  2. Lần 6 gõ **đúng** mật khẩu `pisa2026` → câu `Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.` (hoặc 14), **không** vào được.
  3. Email khác có thật (ví dụ một tài khoản giáo viên của bộ demo, mật khẩu `pisa2026`) → vào được (khoá theo email, IP chưa tới 30).
  4. Mở khoá để bấm tiếp: dừng dev, `npm run seed` (dựng lại database, bảng `auth_attempts` rỗng), bật lại `npm run dev`.
  5. Đăng nhập đúng một lần giữa chừng: 4 sai → 1 đúng → đăng xuất → 4 sai → đúng → vào được.
- [x] **Step 4: KIỂM — đăng ký:**
  1. Tab **Giáo viên đăng ký**: điền đủ, email `thu.an.pisa@gmail.com`, chọn MB → màn **Đã gửi đăng ký**.
  2. Đăng nhập bằng email đó → câu có chữ **chờ Quản trị hệ thống duyệt**, không vào được.
  3. Đăng nhập Quản trị → màn Quản trị › tài khoản chờ duyệt thấy người này → Duyệt (vai Giáo viên, MB) → đăng xuất → đăng nhập bằng
     email đó → vào được.
  4. Gửi đăng ký hỏng (bỏ trống mật khẩu) liên tiếp 10 lần → lần 11 (điền đủ) báo `Đã gửi quá nhiều đăng ký trong một giờ…`.
     Dọn: dừng dev, `npm run seed`, bật lại.
- [x] **Step 5: KIỂM — lỗi hệ thống (AN-3):**
  1. Bash: `curl -s -X POST http://localhost:4000/api/auth/login -H 'content-type: application/json' -d '{hong'` → `400` và câu
     `Dữ liệu gửi lên không đọc được…`, không có chữ `Unexpected`/`JSON`.
  2. Tạo lỗi 500 thật trên **bản sao**: dừng dev; tạo bản sao `data/pisa-demo.sqlite` bằng `VACUUM INTO` ra thư mục tạm (như Task 13 Step 2),
     trên bản sao chạy `DROP TABLE auth_attempts`; chạy API với bản sao: `PISA_DB="<bản sao>" npm run dev`. Đăng nhập bất kỳ → màn hiện
     **`Có lỗi · mã xxxxxxxx. Thử lại sau ít phút; nếu vẫn lỗi, báo Quản trị hệ thống kèm mã này.`** — **không** có chữ `no such table`,
     `SELECT`, `auth_attempts`. Cửa sổ lệnh có dòng `[api] mã xxxxxxxx … no such table: auth_attempts` **cùng mã**. Dừng, xoá bản sao,
     bật lại `npm run dev` thường.
- [x] **Step 6: KIỂM — màn đăng nhập bản chính (AN-7), cổng 5174:**
  1. Để API dev chạy. Cửa sổ khác trong worktree: `VITE_BAN_CHINH=1 npx vite --port 5174` → mở `http://localhost:5174` → form đăng nhập
     bình thường, **không** có tab "Vào nhanh", **không** có dòng mật khẩu mặc định.
  2. Dừng API (giữ vite 5174), tải lại trang → thẻ **"Chưa kết nối được hệ thống dữ liệu"** + nút **Thử lại**; **không** có hướng dẫn
     `npm run seed`. Bật lại API, bấm **Thử lại** → form đăng nhập hiện lại.
  3. API tắt, đang ở form (mở form trước rồi mới tắt API) → bấm Đăng nhập → câu `Chưa kết nối được hệ thống dữ liệu. Thử lại sau ít phút.`
     (không in HTML, không in `Failed to fetch`).
  4. Database rỗng: dừng API; `PISA_DB="<thư mục tạm>/rong.sqlite" npm run dev:api` (file chưa có) → tải lại 5174 → thẻ
     **"Hệ thống chưa được khởi tạo"**. Dừng, xoá file tạm, bật lại `npm run dev`.
- [x] **Step 7: KIỂM — máy dev không đổi:** `http://localhost:5173` khi API tắt vẫn hiện hướng dẫn cũ (`Chưa kết nối được máy chủ dữ liệu`
  + các bước `npm run seed`) — đúng, chữ màn dev để PR-S3.
- [x] **Step 8: KIỂM — gói Netlify:** `npm run thu-goi` → 5 dòng `ĐẠT` (Task 9 Step 7).
- [x] **Step 9:** Tắt mọi máy chủ đã bật. `npm run check` xanh; ghi số (≥ 699) vào Nhật ký.

---

### Task 13: Rebase sau PR-O và PR-S1, migrate lặp trên bản sao, rà soát, mở PR

- [x] **Step 1: Chờ và rebase.** PR-O **và** PR-S1 phải đã merge vào `main` (kiểm `git log --oneline origin/main`). Chưa merge → 🛑 báo
  chủ sản phẩm "PR-AN xong, chờ O và S1", dừng. Đã merge: `git fetch && git rebase origin/main`. Gỡ xung đột:
  - `server/src/tests/run.ts` → **giữ cả hai/ba khối** (S1 `runLuatMayChuTests` trước PR-Z2; O `runKhungTests` và AN `runAnToanTests`
    sau PR-Z2, thứ tự giữa O và AN không quan trọng).
  - `server/src/routes/index.ts` → **giữ cả hai khối**: import của S1/O + import `gioiHan`; khối `/demo/session` của O; route mới của S1;
    khối `/auth` của AN.
  - `server/src/migrate.ts` → giữ cả hai lời gọi (`migrateLuatMayChu(conn, applied);` rồi `migrateAuthAttempts(conn, applied);`) và cả hai
    hàm ở cuối file.
  - `server/src/schema.sql` → giữ mọi cột S1 và bảng `auth_attempts`.
  - `server/src/cases/cases.ts` → dòng `canClose:` theo S1 (có `topic: c.topic`) **và** dòng `...caseCardOf(c.id, c, soBangChung),` theo AN.
  - `CODE_MAP.md` → giữ mọi dòng mới của cả ba PR.
  Sau rebase: `npm run check` xanh. Số phép kiểm = (số của `origin/main` mới) + 27. Ghi cả hai số vào Nhật ký.
- [x] **Step 2: Migrate lặp trên BẢN SAO database dev** (không bao giờ file gốc, không bao giờ Turso). Bash:

```bash
SCR="$(node -e "console.log(require('os').tmpdir())")/pr-an-migrate"
mkdir -p "$SCR"
node -e "const d=require('libsql'); const db=new d('data/pisa-demo.sqlite'); db.exec(\"VACUUM INTO '\" + process.argv[1].replace(/\\\\/g,'/') + \"'\")" "$SCR/ban-sao.sqlite"
node -e "const d=require('libsql'); const db=new d(process.argv[1]); db.exec('DROP TABLE IF EXISTS auth_attempts')" "$SCR/ban-sao.sqlite"
PISA_DB="$SCR/ban-sao.sqlite" npm run migrate
PISA_DB="$SCR/ban-sao.sqlite" npm run migrate
```
Expected: lần một có dòng `✓ PR-AN: thêm bảng auth_attempts …` (dòng PR-S1 có hoặc không tuỳ bản sao); lần hai **không** có dòng PR-AN
lẫn PR-S1. (`VACUUM INTO` vì libsql trên Windows giữ khoá file — bài học PR-Z2b. Bước `DROP` để chắc chắn bản sao giống database cũ.)
- [x] **Step 3: Rà soát code.** REQUIRED SUB-SKILL: `superpowers:requesting-code-review`. Người rà: **Fable 5.1** (khác model người code;
  người code là Fable → người rà Opus 5 hoặc Sonnet 5). Đưa cho người rà: plan này, đặc tả §5 (4.6, 4.11) + §7 dòng AN, kiểm kê §1.9 +
  RB-1, bảng Q1–Q22, `git diff origin/main...HEAD`. Yêu cầu soi riêng:
  (a) có đường nào đăng nhập/đăng ký **không** qua `gioiHanThu` (grep `accountSvc.login(`, `accountSvc.register(`);
  (b) câu 429 có lộ email nào có thật không; bảng `auth_attempts` có dữ liệu thô không;
  (c) còn chỗ nào trả `err.message` của lỗi không phải `HttpError` ra người dùng (grep `message` trong `app.ts`, `routes/helpers.ts`, route tải tệp `index.ts:702`);
  (d) `AsyncLocalStorage` có mất ngữ cảnh ở đường nào làm **chặn nhầm** (không phải chỉ "không chặn");
  (e) `chot-vang` có thể chạy vào database **thử** không (bản nháp Netlify không chạy hàm định kỳ — xác nhận theo tài liệu Netlify);
  (f) `resolveSession` đổi có làm ai đang đăng nhập hợp lệ bị đẩy ra không.
  Xử lý phản hồi theo `superpowers:receiving-code-review`. Sửa xong: `npm run check` xanh.
- [ ] **Step 4: PR.** `superpowers:finishing-a-development-branch` — `git push -u origin pr-an-an-toan` (sau rebase: `--force-with-lease`);
  `gh pr create` **không draft**, tiêu đề `PR-AN · An toàn trước người dùng thật (AN-1, 3, 4, 5, 6, 7, 8, RB-1)`. Thân PR: tóm tắt theo
  Task; bảng "Kiểm với mã thật" (AN-6 đã có, chỉ thêm phép kiểm); bảng Q1–Q22; **có migrate** (bảng `auth_attempts`, idempotent, đã chạy
  lặp trên bản sao); số phép kiểm trước → sau; kết quả KIỂM Task 12; "việc chuyển cho PR khác": đo `[cham]` và kiểm `chot-vang` thật →
  Z2c; các câu hỏi DB khác mỗi thẻ Case → Z2c Step 6; màn dev `SetupHelp` chữ cũ → S3. Dòng cuối:
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. **Không tự merge.**
- [ ] **Step 5: Báo chủ sản phẩm** (tiếng Việt cơ bản, không thuật ngữ): link PR; từ nay đăng nhập sai 5 lần phải chờ 15 phút; lỗi hệ thống
  hiện một mã ngắn để báo lại; mỗi sáng thứ Hai máy tự chốt "-" dù không ai mở web; PR này cần merge **sau** PR-O và PR-S1.

---

## Self-review của người viết plan (22/09/2026, session planning)

**Phủ đặc tả:** AN-1 → Task 1, 2, 3 (đăng nhập **và** đăng ký, như người giao việc yêu cầu) · AN-3 → Task 5 · AN-4 → Task 6 · AN-5 →
Task 7 (+ đo ở Z2c qua ghi chú Task 11) · AN-6 (4.11) → Task 4 (đã có, thêm phép kiểm + Q16) · AN-7 → Task 10 + KIỂM Task 12 Step 6 ·
AN-8 → Task 8 · RB-1 (4.6) → Task 9. Ngoài phạm vi, không làm: AN-2 (đã ✅), AN-9/10 (Qb), AN-11/12 (Z2c), AN-13 (S1), AN-14 (tuỳ chọn).

**Kiểu thống nhất:** `LoaiThu`, `GIOI_HAN`, `cauKhoaDangNhap`/`cauKhoaDangKy`, `chanNeuBiKhoa`, `ghiLanThu`, `xoaLanThu`, `ipCua` (T2) dùng
ở T3; `traLoiLoi`, `demGio` (T5, T7) ở `app.ts`; `taoSuKhoe` (T6); `chayVoiHan`, `conLaiMs`, `chanGiaoDichNeuSapHetGio` (T7) dùng ở `db.ts`
và phép kiểm; `donGiaoDichTreo` (T7) dùng ở `demGio`; `demBangChungCase` + `caseCardOf(…, soBangChung)` (T8); `LICH_CHOT_VANG`,
`chotVangDinhKy` (T9) dùng ở hàm Netlify và phép kiểm. Trong file test: `goi`, `taoTaiKhoan`, `dangNhap`, `may` (T3) dùng ở T4, T5, T6;
`appMod` (T5) dùng ở T7; `createApp` (T3) dùng ở T6.

**Số phép kiểm dự kiến:** 672 + 2 (T1) + 3 (T2) + 5 (T3) + 3 (T4) + 4 (T5) + 2 (T6) + 4 (T7) + 1 (T8) + 3 (T9) = **699** trước rebase.

**Rủi ro đã biết:** (1) AsyncLocalStorage mất ngữ cảnh qua sự kiện luồng — đã đặt `demGio` sau bộ đọc JSON; đường tải tệp chỉ "không chặn".
(2) `phutConKhoa` báo số phút theo lần sai **cũ nhất** trong cửa sổ — khi có hơn ngưỡng (hai lời gọi song song) con số có thể ngắn hơn thực
tế một chút; chấp nhận. (3) Hàm định kỳ bị Netlify cắt ở 30 giây: `settleNoShows` gói mọi buổi trong **một** giao dịch — nếu một tuần có
rất nhiều "-" mà vượt 30 giây thì lần nào cũng cuộn lại; số đo `ms` ở Task 9 Step 7 và log Z2c sẽ cho biết; nếu xảy ra, đường đọc vẫn chốt
như trước (không tệ hơn hôm nay). (4) Phép kiểm HTTP bật `BAN_CHINH` trong lúc gọi (cùng khuôn `banChinh.tests.ts`) — một phép khác chạy
song song trong cùng tiến trình sẽ thấy cờ; harness chạy tuần tự nên không xảy ra.

---

## Nhật ký thực thi

| Ngày | Task | Ghi chú (model người code · số phép kiểm · lệch plan · quyết định tại chỗ) |
|---|---|---|
| 22/09 | Task 0 | Opus 5 · worktree .claude/worktrees/pr-an-an-toan (nhánh pr-an-an-toan từ origin/main 79fd4e7) · sạch biến Turso · mốc **672** ✓ · Task 12 dùng cổng khác 4000/5173 theo lệnh người giao việc |
| 22/09 | Task 1 | Opus 5 · 672 → 674 (2 phép `AN-1 ·` mới, đỏ rồi xanh) · lệch nhỏ: ở bước đỏ, phép đầu báo `Cột: ""` chứ không phải `no such table` (PRAGMA trên bảng chưa có trả rỗng, không ném) — không đổi gì · code chép nguyên văn từ plan |
| 22/09 | Task 2 | Opus 5 · 674 → 677 (3 phép `AN-1 ·` mới, đỏ rồi xanh) · lệch nhỏ: ở bước đỏ cả bộ SẬP thay vì 3 ✗ — Proxy của `load` (Task 1) ném cả khi `await` hỏi `.then`; sửa `load` trả `undefined` cho `then` rồi mới đỏ đúng 3 ✗ · `gioiHanThu.ts` chép nguyên văn từ plan |
| 22/09 | Task 3 | Opus 5 · 677 → 682 (5 phép `AN-1 ·` HTTP mới) · lệch nhỏ: ở bước đỏ chỉ 4 ✗ chứ không phải 5 — phép "đăng nhập đúng xoá đếm" tự đạt khi chưa có giới hạn (không có khoá thì lần đúng nào cũng vào); sau khi sửa route cả 5 ✓ · phép cũ cookie Secure (banChinh.tests) và "CÙNG một câu" (run.ts) vẫn ✓ · route chép nguyên văn từ plan |
| 22/09 | Task 4 | Opus 5 · 682 → 685 (3 phép `AN-6 ·` mới) · đúng plan: hai phép HTTP ✓ ngay (luồng duyệt đã có), phép phiên ✗ "Phiên của tài khoản chờ duyệt vẫn dùng được" rồi ✓ sau khi sửa `resolveSession` (một câu JOIN users) · phép cũ phiên hết hạn / khôi phục (banChinh.tests) vẫn ✓ · ghi chú: ở máy dev, "Vào nhanh" vào một tài khoản **chờ duyệt** nay bị đẩy ra ngay — đúng ý (bộ demo không có tài khoản chờ duyệt) · code chép nguyên văn từ plan |
| 22/09 | Task 5 | Opus 5 · 685 → 689 (4 phép `AN-3 ·` mới, cả 4 ✗ rồi ✓: 3 phép `traLoiLoi is not a function`, JSON hỏng nhận 500 kèm câu tiếng Anh) · `traLoiLoi` chép nguyên văn từ plan; import `Request/Response/NextFunction`, `HttpError` đã có sẵn · lệch nhỏ: grep soát không rỗng hẳn — còn 1 dòng là chính tên phép kiểm mới ("KHÔNG có details.raw"), không phải code; `web/src` không dùng `details.raw` · typecheck ✓ |
| 22/09 | Task 6 | Opus 5 · 689 → 691 (2 phép `AN-4 ·` mới, cả 2 ✗ rồi ✓: phép HTTP `Cache-Control: null`, phép hàm "Chưa có mô-đun suKhoe.ts") · `suKhoe.ts` chép nguyên văn từ plan; health dời lên trước `attachPrincipal`, bỏ import `isInitialised` khỏi `app.ts` · `npm run thu-goi` ba dòng ĐẠT (worktree chưa có data/ nên chạy `npm run seed` trước — chỉ ghi data/pisa-demo.sqlite, không có biến Turso) |
| 22/09 | Task 7 | Opus 5 · 691 → 695 (4 phép `AN-5 ·` mới, cả 4 ✗ rồi ✓: 2 phép "Chưa có mô-đun hanGio.ts", `donGiaoDichTreo is not a function`, `demGio is not a function`) · `hanGio.ts`, `tx()`/`donGiaoDichTreo` và `demGio` chép nguyên văn từ plan; `app.use(demGio)` ngay sau `cookieParser`, trước health · typecheck ✓ · `npm run thu-goi` ba dòng ĐẠT |
| 22/09 | Task 8 | Opus 5 · 695 → 696 (1 phép `AN-8 ·` mới, ✗ "Đếm bằng chứng 18 câu cho 18 thẻ" rồi ✓) · `demBangChungCase` chép nguyên văn từ plan; `caseCardOf(` đúng 2 dòng (định nghĩa + một lời gọi); không chạm `canClose:` · phép cũ `PR-HV · Q8 Thẻ case có số bằng chứng` vẫn ✓ · typecheck ✓ |
| 22/09 | Task 9 | Opus 5 · 696 → 699 (3 phép `RB-1 ·` mới, cả 3 ✗ rồi ✓: 2 phép "Chưa có mô-đun chotVangDinhKy.ts", phép toml "Lịch trong toml: undefined") · `chotVangDinhKy.ts`, `chot-vang.ts`, khối toml chép nguyên văn từ plan; không chạm `absence.ts` · typecheck ✓ · `npm run thu-goi` 3 dòng ĐẠT cũ + `chot-vang lần 1` **daChot 0, ms 23** (database dev đã chốt sẵn tới hôm nay), lần 2 daChot 0, ms 1 · chạy trên bản sao VACUUM INTO trong thư mục tạm; `data/pisa-demo.sqlite` giữ nguyên thời điểm sửa (20:53:46.399 trước và sau) · lệch nhỏ: sửa lỗi gõ `/\/g` bị mất một dấu gạch khi chép vào script (SyntaxError lần chạy đầu) |
| 22/09 | Task 10 | Opus 5 · 699 → 699 (web không có bộ phép kiểm; `npm test` vẫn 699 ĐẠT) · `BanChinhChuaVaoDuoc`, `cauLoiDeDoc`, nhánh `banChinhHong` và hai `catch (x: unknown)` chép nguyên văn từ plan; `ApiError.details` kiểu `any` nên `x.details?.ma` typecheck được không cần ép kiểu · typecheck ✓ · grep: không còn "Hãy"; `npm run` chỉ còn 2 dòng trong `SetupHelp` (dòng 52, 60) · giữ CRLF của WelcomePage.tsx |
| 22/09 | Task 11 | Opus 5 · 699 → 699 (chỉ tài liệu; `npm test` 699 ĐẠT, phép quét từ cấm không báo gì) · 3 dòng bảng §11, mục 11.3, 5 dòng CODE_MAP, khối 🆕 PR-AN dưới Task 10 Step 5 plan bản chính — chép nguyên văn từ plan · **thêm theo phán quyết người điều phối (rà soát Task 9):** mục (5) trong khối ghi chú Z2c — kiểm `chot-vang` nạp được libsql (khối `[functions]` chung + `[functions."chot-vang"]` chỉ thêm lịch) và chạy dưới 30 giây qua `ms` · lệnh kiểm đường chết CODE_MAP: không dòng `CHET:` mới do task này (7 dòng có sẵn từ HEAD 31c23aa — tên `.tsx` trần không kèm thư mục như `OSoNho.tsx`, dương tính giả của lệnh; để nguyên) · giữ nguyên kiểu xuống dòng (CRLF: TRIEN_KHAI, CODE_MAP, plan bản chính; LF: plan này) |
| 22/09 | Sửa sau rà từng task | Opus 5 · 699 · (1) phép AN-5 lồng: hạn +3 000 ms, chờ bận 600 ms (dư 500 ms trước khi giao dịch ngoài kiểm) · (2) phép `donGiaoDichTreo` bọc try/finally ROLLBACK · (3) `cauLoiDeDoc` không in câu lỗi dạng HTML (404 Netlify) · (4) `banChinhHong` coi trả lời thiếu `ok === true` là chưa kết nối; `chuaKhoiTao` đòi `ok === true` |
| 22/09 | Task 12 | Opus 5 · KIỂM: S1 bỏ qua theo lệnh người giao việc (không hỏi cổng) · S2 ✓ seed + API 4100 + web 5180, Playwright kênh Chrome · S3 ✓ 5 lần sai "Email hoặc mật khẩu không đúng." → lần 6 đúng mật khẩu "Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút." không vào; GV ha.tran vào được; seed lại; 4 sai → đúng → thoát → 4 sai → đúng vào được · S4 ✓ đăng ký thu.an → "Đã gửi đăng ký"; đăng nhập "Tài khoản đang chờ Quản trị hệ thống duyệt…"; Quản trị › Duyệt (Giáo viên, MB) → vào được; 10 lần hỏng → lần 11 "Đã gửi quá nhiều đăng ký trong một giờ. Thử lại sau 60 phút." (lệch: nút Gửi khoá khi trống mật khẩu nên lần hỏng dùng mật khẩu 2 ký tự, máy chủ báo "Mật khẩu cần ít nhất 6 ký tự.") · S5 ✓ JSON hỏng 400 "Dữ liệu gửi lên không đọc được…"; bản sao DROP auth_attempts → "Có lỗi · mã a345ddca…", log `[api] mã a345ddca POST /api/auth/login SqliteError: no such table: auth_attempts` · S6 ✗ 6.1: 5181 không có "Vào nhanh" nhưng VẪN hiện dòng "Tài khoản Quản trị hệ thống mặc định … mật khẩu pisa2026" (API dev gửi `demoAdmin`, web chỉ ẩn khi máy chủ không gửi; gói Netlify `thu-goi` không gửi) · 6.2 ✓ 6.3 ✓ 6.4 ✓ · S7 ✓ · S8 ✓ 5 dòng ĐẠT · S9 ✓ tắt 4100/5180/5181 · cổng 4100/5180/5181 thay 4000/5173/5174 (lệnh người giao việc) · npm run check 699 |
| 22/09 | Task 12 · phán quyết 6.1 | Session điều phối · 6.1 ✗ chỉ do cách dựng thử: web bản chính (5181) nối API **máy dev**, mà API dev luôn gửi `demoAdmin` → hiện dòng mật khẩu mặc định. Bản chính thật: API chạy BAN_CHINH nên `/auth/info` không có `demoAdmin` (`routes/index.ts:1621`, phép kiểm cũ `PR-Z2 · Bản chính: GET /auth/info không có khoá demoAdmin` ✓). Không sửa mã; tick Step 6 |
| 22/09 | Task 13 · rebase | Opus 5 · main 730 (origin/main 526ffec) → nhánh 757 (+27 ✓) · rebase 17 commit lên 526ffec · xung đột chỉ ở commit (1): `run.ts` giữ cả khối PR-O `runKhungTests` rồi khối AN `runAnToanTests` (sau PR-Z2; S1 đã ở trước PR-Z2, không xung đột); `migrate.ts` giữ `migrateLuatMayChu` rồi `migrateAuthAttempts`, cả hai hàm ở cuối file (thêm tay `}` đóng hàm S1 và `/**` mở chú thích AN do hai bên chung dòng) · `schema.sql`, `routes/index.ts`, `cases.ts` (`canClose:` theo S1 có `topic: c.topic` + `...caseCardOf(c.id, c, soBangChung),`), `CODE_MAP.md`, plan tự gộp không xung đột · `npm run check` ✓ (757, typecheck ✓) · `npm run thu-goi` 5 dòng ĐẠT · migrate lặp trên bản sao VACUUM INTO (thư mục tạm, DROP auth_attempts): lần 1 có dòng PR-S1 (2 cột, đánh cờ 0) và PR-AN (thêm bảng auth_attempts); lần 2 không có dòng PR-AN lẫn PR-S1 (chỉ còn dòng cũ "3 case giữ khoá cũ…" lặp mỗi lần — có từ 58adcd7, không thuộc PR này) · `data/pisa-demo.sqlite` giữ nguyên thời điểm sửa · lệch nhỏ: lệnh `node -e` của plan mất dấu `\` khi chạy qua Bash → dùng script với `String.fromCharCode(92)` |
| 22/09 | Task 13 · rà soát cuối | Fable 5.1 rà: sẵn sàng merge; 0 Critical · 1 Important (tài liệu: database THỬ và bản khôi phục cũ thiếu bảng auth_attempts → thêm bước chạy migrate) · 8 Minor không chặn · Opus 5 sửa tài liệu |
