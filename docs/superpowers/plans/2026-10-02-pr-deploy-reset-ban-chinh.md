# PR-DEPLOY · Chuẩn bị reset bản chính — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** PR mã **cuối cùng** trước khi chủ sản phẩm reset database bản chính và cho giáo viên dùng thật. Sau PR này:
(1) một database **mới tinh** dựng bằng `npm run init-ban-chinh` chạy `npm run migrate` bao nhiêu lần cũng **không đổi dòng nào** (DEP-1, DEP-2);
(2) mọi chốt an toàn của bản chính có phép kiểm: từ chối seed, "Vào nhanh" 404, không tài khoản nào mang mật khẩu demo, cron `chot-vang`
chốt vắng + thi hành lệnh chuyển lớp, giới hạn Turso (900 tham số, UNION ≤ 20 vế) đứng vững ở các đường lớn nhất;
(3) `TRIEN_KHAI.md` có mục **"Reset bản chính"** — danh sách bước tay đánh số, mỗi bước có lệnh, dấu hiệu đúng, cách xử lý khi hỏng (DEP-4);
(4) `DEMO.md`, `README.md` khớp bộ demo hiện tại (DEP-5);
(5) tập dượt init trên database **tạm** do chủ sản phẩm đặt tên, đo thời gian; đo tốc độ trang trên DB THỬ (VN22).

**Architecture:** Không bảng mới, không cột mới, `schema.sql` không đổi. Ba thay đổi mã nhỏ:
- `seed/duLieuNen.ts` ghi sẵn **khoá "đã chạy"** của các bước dữ liệu chạy-một-lần (`xoa_du_lieu_backfill_at` — DEP-1) và một **dấu DB mới**
  `khoi_tao_moi_at` (DEP-2). Cùng khuôn với dòng dấu `normal_pass_threshold` đã có (PR-Z2c-b).
- `migrate.ts` + `migrate/*.ts`: mỗi bước **chuyển dữ liệu cũ** có thể đổi dữ liệu do mã hiện hành ghi → bỏ qua khi có dấu DB mới. Mã chuyển dữ liệu cũ
  **giữ nguyên** (DB THỬ và máy dev cũ vẫn cần) — gỡ hẳn là việc sau deploy.
- Lệnh chỉ đọc `kiem-sau-init` **thay** `kiem-sau-xoa` (đã hết việc: dữ liệu thử đã dọn 24/09, DB sắp reset).

Phần còn lại là phép kiểm, tài liệu và hai buổi chạy thật trên database **thử/tạm**.
**Tech Stack:** TypeScript · Express · better-sqlite3/libsql (Turso) · Netlify Functions + CLI; harness `check()` của `run.ts`, chạy `npm run check`.
**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md` mục **B6** (DEP-1…DEP-5, TAY-1…TAY-7) và mục (c) dòng **PR-DEPLOY**; dòng **VN22**.
- Mục "Chuyển cho PR khác" ghi **PR-DEPLOY**:
  - kế hoạch S6F `plans/2026-10-01-pr-s6f-sua-sau-ra-dot-6.md:460` (`init-ban-chinh` có ba cột mới · DEMO.md D18 · seed D18 "PA GV thêm có kết quả");
  - kế hoạch Pb2 `plans/2026-10-01-pr-pb2-phan-tich-giao-vien.md:774`;
  - báo cáo rà `reviews/2026-10-01-ra-dot-6-luot-1/pb2-b.md:117-120, 165`;
  - thân PR #146 (Pb2-b), dòng 65; kế hoạch Dọn `plans/2026-10-01-pr-don-ma-thua-quyen.md:87` (DEP-1…5).
  - PR #145, #147–#157: đã quét, không có mục nào khác ghi PR-DEPLOY.
- `TRIEN_KHAI.md` (cả file), `DEMO.md`, `README.md`; `thiet-ke/ra-27-09/K5.md` §6 (bảng D1–D18) và §7 dòng `DEMO.md`.
- Mã: `server/src/ops/` (`runInit.ts`, `initBanChinh.ts`, `chotVangDinhKy.ts`, `saoLuu.ts`, `khoiPhuc.ts`, `kiemSauXoa.ts`), `seed/duLieuNen.ts`,
  `migrate.ts`, `migrate/*.ts`, `moiTruong.ts`, `db.ts` (`theoLo`, `THAM_SO_TOI_DA`), `netlify.toml`, `netlify/functions/`.
- Bài học bản chính (memory planning): tập dượt Z2c 23/09 (init 60 s, migrate ~165–220 s kể cả khi không có gì, khôi phục 101 s, sao lưu ~70 s, trang < 3 s);
  Turso bỏ qua tham số đặt tên, từ chối UNION dài, cần `BEGIN IMMEDIATE`; bản nháp Private, không có "Vào nhanh"; bản chính hiện chạy DB
  `pisatracking-pizi147`, 5 chi nhánh `MB, BC, CP, UB, HD`, quản trị `dovutuanphong95.pisa@gmail.com`.


> **Planning chốt 02/10 (chủ sản phẩm sắp hết token, planning tự quyết theo khuyến nghị):** giữ DB cũ **4 tuần** (Câu 1 = B) · tên DB mới **`pisatracking-v2`** (Câu 2 = A) · tập dượt init trên DB Turso tạm **`pisatracking-demo-thu-init`** do chủ sản phẩm tạo rồi tự đặt URL/token vào biến môi trường của phiên (Câu 3 = A). **Thứ tự:** PR-S3 merge trước; PR-Dọn-b **không bắt buộc** (lỗi phải sửa đã dồn vào Task 0b). Task 6–7 (tập dượt Turso, bản nháp Netlify) cần máy của chủ sản phẩm: nếu phiên chạy trên cloud thì làm Task 0b–5, 8–9, và **để Task 6–7 cho chủ sản phẩm làm theo Phụ lục A** (ghi rõ trong thân PR).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · lượt | **PR-DEPLOY** · đợt 6 **lượt 3 (cuối)** · một PR, không draft, **không tự merge** |
| Chờ | **PR-S3 và PR-Dọn-b đã merge.** Chưa merge thì chưa bắt đầu. Không chạy song song PR nào |
| Nhánh · worktree | `pr-deploy-reset` · `.claude/worktrees/pr-deploy-reset`, từ `origin/main` **sau** khi S3 + Dọn-b merge |
| Cổng thử | API **4197** · Vite **5397**. Không dùng 4000/5173 |
| Model | **CỰC KỲ KHUYẾN NGHỊ Opus 5.5 · High** — PR chạm dữ liệu thật, migrate, chốt an toàn bản chính và chuẩn bị reset. Phương án B: **Fable 5.1 · High** |
| Người rà | **Opus 5.5**, session riêng, rà cùng lượt cuối đợt 6 — **trước** khi chủ sản phẩm làm mục "Reset bản chính" |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không thêm bảng/cột.** `schema.sql` không đổi. Chỉ thêm điều kiện "bỏ qua trên DB mới" cho các bước chuyển dữ liệu cũ |
| Lệnh skill | Không có việc giao diện → **ponytail `full`** (mặc định), **không** chạy impeccable. Nếu Task 6 lộ lỗi ở màn trống phải sửa `web/`: gõ `/ponytail lite`, impeccable **`harden`** chỉ trên màn đó, **`audit`** trước khi mở PR. Trước PR: `/ponytail-review` |
| Database | Session **KHÔNG BAO GIỜ** chạm DB bản chính cũ (`pisatracking-…` không có `-demo`) hay DB bản chính mới. Chỉ dùng: file cục bộ, DB **tạm** đúng tên chủ sản phẩm đưa, DB **THỬ** (`pisatracking-demo-…`) **sau khi** chủ sản phẩm gõ "đồng ý" trong chat ở Task 7 |
| Không bao giờ | `netlify deploy --prod` · `netlify env:set … --context production` · đăng nhập bằng mật khẩu thật · tạo/chọn tên DB thay chủ sản phẩm. Đó là **bước tay của chủ sản phẩm** (mục "Reset bản chính") |
| Không làm | gỡ hẳn mã chuyển dữ liệu cũ, lệnh `chay-thu:*`, `kiem-lop-mo-coi` → **sau deploy** (sau TAY-7) · cột chống gửi đôi (`idempotency_key`) → sau deploy · chữ trên màn, tài liệu luật → đã ở PR-S3 · mã chết `web/` → đã ở PR-Dọn-b |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-deploy.log` (tên riêng — `$TEMP` dùng chung giữa các session);
  - xanh, số phép kiểm ≥ mốc B → commit `PR-DEPLOY (n): …`.
- Sập segfault → chạy lại **một** lần; sập lặp → chạy thẳng `tsc` + `node dist-server/server/src/tests/run.js` + `tocDo.run.js` không qua npm.
  Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Cửa sổ PowerShell có biến Turso: **dòng đầu luôn** `Set-PSReadLineOption -HistorySaveStyle SaveNothing`; **không bao giờ** in token/mật khẩu ra màn,
  Nhật ký, thân PR; xong việc **gỡ biến** (`Remove-Item Env:TURSO_*`) hoặc đóng cửa sổ. **Không** chạy `npm run check` trong cửa sổ còn biến Turso.
- Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4197/5397, quét `tests/run.js` treo, dọn file tạm (kể cả file DB tạm cục bộ, cấu hình Vite tạm).

### File chồng

PR-DEPLOY chạy **sau** S3 + Dọn-b nên không có PR song song. Task 0 vẫn kiểm `git log` các file dưới đây: PR nào merge **sau** khi PR-DEPLOY mở mà
chạm chúng → cổng gộp `git fetch origin && git merge origin/main` → `npm run check` → ghi Nhật ký.

| File | Có thể đã bị sửa bởi | PR-DEPLOY sửa |
|---|---|---|
| `server/src/schema.sql`, `migrate.ts`, `migrate/*.ts` | S3 (ít khả năng), Dọn-b | thêm điều kiện "DB mới" vào các bước dữ liệu (Task 2) |
| `server/src/seed/duLieuNen.ts`, `seed/pb2bSeed.ts` | Dọn-b (seed `action_due`) | hai khoá dấu (Task 1–2) · PA D18 (Task 5) |
| `server/src/ops/*`, `package.json` scripts | — | `kiem-sau-init` thay `kiem-sau-xoa` (Task 4) |
| `server/src/tests/run.ts`, `banChinh.tests.ts`, `tocDo.run.ts`, `tocDoDuong.ts` | S3, Dọn-b (khối cuối `run.ts`) | khối phép kiểm **cuối**; chỉ thêm dòng |
| `TRIEN_KHAI.md`, `DEMO.md`, `README.md`, `CODE_MAP.md` | S3 (tài liệu), Dọn-b | DEP-4, DEP-5 (Task 5, 8) |

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | DEP-1: khoá `xoa_du_lieu_backfill_at` ghi ở **`napDuLieuNen`** (init **và** seed cùng có) | một nguồn dữ liệu nền cho hai bên; cùng khuôn dòng `normal_pass_threshold` |
| Q2 | DEP-2: **khoá, không gỡ.** `napDuLieuNen` ghi thêm dấu `khoi_tao_moi_at`. Mọi bước chuyển dữ liệu cũ có thể đổi dữ liệu của mã hiện hành → `if (!dbMoi)`. Bước chỉ đổi giá trị **mã hiện hành không bao giờ ghi** (ví dụ `prep_writing`, `pronunciation`, `talk_student`) → để nguyên, ghi "an toàn lặp" vào bảng rà | DB THỬ và DB máy dev cũ vẫn cần các bước đó; gỡ 3.000 dòng ngay PR cuối là rủi ro lớn hơn lợi. Gỡ hẳn sau TAY-7 |
| Q3 | Phép kiểm "không đổi dòng nào" chạy migrate qua **nhánh Turso** (`TURSO_DATABASE_URL` = URL file, như phép `Z2c-b` `banChinh.tests.ts:548`) | đúng nhánh bản chính; nhánh máy dev **cố ý** tạo quản trị mặc định (`migrateAccounts`) |
| Q4 | Dấu `demo_config.case_engine_migrated_at` (ghi lại giờ mỗi lần migrate, `migrate.ts:507`) **được phép** đổi; mọi dòng khác phải giống từng byte | dấu thời gian có chủ ý, không phải dữ liệu |
| Q5 | `kiem-sau-xoa` **xoá** (file + script). Thay bằng `kiem-sau-init` **chỉ đọc**, dùng chung danh sách bảng được phép có dòng (`BANG_NEN_INIT`, export từ `initBanChinh.ts`) với phép kiểm `banChinh.tests.ts:531` | một danh sách cho phép kiểm và lệnh; chủ sản phẩm tự kiểm DB mới không cần session |
| Q6 | "Mật khẩu demo bị chặn" = **chặn ở mọi đường GHI vào DB bản chính**: init từ chối `pisa2026`; migrate nhánh Turso không đặt mật khẩu mặc định; seed từ chối tên bản chính; `kiem-sau-init` báo đỏ nếu có tài khoản mang mật khẩu demo. **Không** chặn đăng nhập `pisa2026` khi `BAN_CHINH=1` | bản nháp cũng chạy `BAN_CHINH=1` trên DB THỬ, nơi tài khoản demo **cần** `pisa2026` để chủ sản phẩm thử |
| Q7 | Giới hạn Turso: thêm **thước đo** vào `tocDo.run.ts` (sau khi nhân dữ liệu ×3): mọi câu SQL của mọi đường trong `DUONG_DO` + các đường ghi lô trong `TRAN_GHI_LO` (Thêm HV 35 em FT, 30 em lớp thường, chuyển cả lớp, xếp lịch MT cả lớp, xuất MT) có **≤ 900 tham số**, **≤ 20 vế UNION**, **0 tham số đặt tên**. Vượt → sửa bằng `theoLo` nếu cỡ S, không thì Nhật ký + báo planning | lỗi Turso chỉ lộ trên máy thật (23/09); thước đo bắt sớm trên file cục bộ |
| Q8 | DB THỬ lên schema mới bằng **`migrate`** (không seed lại) | đường đã quen (~220 s), giữ dữ liệu demo cũ đủ để thử bản nháp |
| Q9 | Kho tệp cũ (Netlify Blobs `bang-chung-pisatracking-pizi147`) **để nguyên**; bản chép nằm ở thư mục `…-tep` cạnh file sao lưu TAY-1 | DB mới tên mới → kho tệp mới, trống (`khoTep.ts:17`); xoá kho cũ không cần cho reset |
| Q10 | Quay lại sau `--prod`: "Publish deploy" bản cũ = **mã cũ + DB cũ** (biến Netlify gắn theo từng lần deploy) → DB cũ phải còn nguyên tới TAY-7 | đây là đường lùi duy nhất trong những ngày đầu |
| Q11 | Tập dượt: quản trị tập dượt `tapduot.pisa@gmail.com`, mật khẩu **session tự sinh** (≥ 16 ký tự), chỉ nằm trong biến môi trường, không ghi ra chat/Nhật ký/PR. `CHI_NHANH` tập dượt = danh sách đang có trên bản chính `MB=Monbay;BC=Bãi Cháy;CP=Cẩm Phả;UB=Uông Bí;HD=Hải Dương` | giá trị thử, không phải mật khẩu thật; thử đúng chữ có dấu |
| Q12 | 6 tài khoản thật trên bản chính cũ (Quản trị + Hằng, Yến, Thu Hà, Ánh, Tường Vi) và lớp `CP-FT 139` **không chép sang** — tạo lại ở bước nhập dữ liệu thật | chủ sản phẩm chốt reset, không chép dữ liệu cũ (29/09) |
| Q13 | Không thêm cột chống gửi đôi trước reset | không phải việc chuẩn bị reset; migrate thêm cột sau deploy vẫn rẻ |

## Global Constraints

- **An toàn dữ liệu — luật của PR:**
  - session **không** đọc/ghi DB bản chính (cũ hay mới), **không** `--prod`, **không** `env:set --context production`;
  - chỉ ghi vào DB tạm khi tên máy chủ bắt đầu `pisatracking-demo-` **và** đúng tên chủ sản phẩm đưa; dòng đầu lệnh phải in `Đích: database THỬ`;
    in `BẢN CHÍNH` hay `KHÔNG RÕ` → Ctrl+C, dừng, báo chủ sản phẩm;
  - DB THỬ chỉ sau câu "đồng ý" của chủ sản phẩm trong chat ở Task 7.
- **SQL (Turso):** chỉ `?`; `IN (…)` qua `theoLo` ≤ 900 tham số; UNION ≤ 20 vế; ghi trong `tx()` (`BEGIN IMMEDIATE`); không N+1.
- **Phép kiểm:**
  - khối mới `server/src/tests/prDeploy.tests.ts` (`runPrDeployTests(t)`), đăng ký **cuối** `run.ts` theo mẫu `prCt.tests.ts:4`; thước đo Turso nằm ở `tocDo.run.ts`;
  - phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá (`banChinh.tests.ts:531` thêm hai khoá dấu);
  - **tổng số phép kiểm không giảm** (xoá `kiem-sau-xoa` không kéo theo phép kiểm nào — kiểm lại);
  - mỗi phép kiểm phải **đỏ trên main** trước khi sửa (ghi dòng đỏ vào Nhật ký).
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập, chống mất dữ liệu, phân quyền, bảo mật. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Fable)

1. Không "dọn cho gọn" trong `migrate.ts`. Chỉ thêm điều kiện `dbMoi` ở các bước Task 2 liệt kê. Không xoá, không đổi thứ tự bước.
2. Không chạy lệnh nào có biến Turso trước khi đọc dòng `Đích:` mà lệnh in ra. Không đoán tên database.
3. Không viết token, mật khẩu, URL có `authToken` vào file trong repo, Nhật ký hay thân PR.
4. Phép kiểm "không đổi dòng nào" mà đỏ ở một bảng lạ → **ghi bảng + cột + bước migrate gây ra** vào Nhật ký trước khi sửa; không nới phép kiểm.

## Task 0 · Chuẩn bị

- [ ] Ghi **model thật** vào Nhật ký và thân PR.
- [ ] `gh pr list --state merged --search "PR-S3"` và `"PR-Dọn-b"`: cả hai đã merge. Chưa → dừng, báo planning.
- [ ] Worktree `.claude/worktrees/pr-deploy-reset` từ `origin/main`; `npm ci` (nếu cần).
- [ ] **Kiểm lại schema và migrate trên main lúc đó** (kế hoạch viết ở `df0d57cf`):
  - `git log --oneline df0d57cf..origin/main -- server/src/schema.sql server/src/migrate.ts server/src/migrate/ server/src/seed/duLieuNen.ts server/src/ops/ netlify.toml netlify/`;
  - mỗi bảng/cột mới từ `df0d57cf` → phải có phép kiểm "schema.sql → migrate không làm gì" + "cột giống hệt" theo mẫu `prPb2b.tests.ts:30-45`. Thiếu → thêm ở Task 2;
  - mỗi bước migrate dữ liệu mới → thêm vào bảng rà Task 2.
- [ ] `npm run check` → ghi **mốc B** (số phép kiểm chính + tốc độ) vào Nhật ký.
- [ ] Commit `PR-DEPLOY (0): kế hoạch + mốc {B}`.

## Task 0b · Sửa lỗi BẮT BUỘC trước deploy (từ rà lượt 2 — planning 02/10)

Báo cáo: `docs/superpowers/reviews/2026-10-02-ra-dot-6-luot-2/` (`don-a.md`, `uxf-b.md`, `tich-hop-uxd.md` nếu có). Mỗi mục: phép kiểm trước (phải đỏ) → sửa → `npm run check` → commit `PR-DEPLOY (0b-n): …`.

1. **[P0 an toàn] `POST /tasks` (giao việc GV) ghi Case + PA vào HV chi nhánh khác** (`server/src/worklist/meeting.ts:568-575`, `fanOutToStudents :513-528`). Máy chủ phải: suy chi nhánh từ lớp/HV thật (không tin `branchId` web gửi); kiểm quyền theo chi nhánh của **từng** lớp/HV; mọi `studentIds` thuộc `classId` và cùng chi nhánh; trần + chia lô ≤ 900; `followerIds` chỉ người trong phạm vi; bỏ `branchId` ≠ "Toàn hệ thống" trừ Quản trị. Phép kiểm phủ định: QL MB giao việc cho lớp CP → 403, không sinh Case/PA. Thêm vào bảng quét an toàn: `/ref/periods/resolve` kiểm quyền.
2. **[P1] Case của em đã chuyển lớp: thấy ở danh sách nhưng mở ra 403.** `loadCase`, `caseDetail`, đóng Case kiểm quyền theo **lớp hiện tại** giống `listCases` (Q5 Dọn-a); trả lại vế `MEETING_EDIT` ở `canCloseCase` hoặc ẩn nút khi không có quyền — nút và máy chủ cùng một luật. Phép kiểm: em MB FT 101 → 105, GVCN 105 mở + hoàn thành Case được; QL chi nhánh mới (em chuyển chi nhánh) cũng vậy; người ngoài phạm vi 403.
3. **[P1] Case của lớp trước phải nhớ lớp gốc** (rà UXF-b, R5-5):
   - thêm cột lớp + chương trình **gốc lúc mở Case** (migrate thêm cột; `schema.sql` = migrate; DB reset nên không chép dữ liệu cũ), ghi ở mọi đường mở Case (Mock/SOS tự động, Giữa khoá, QuickReport, mở tay);
   - **luật (planning):** lần trượt ở **chương trình mới mở Case mới** — `taoCaseGiuaKhoa` (`server/src/normal/regular.ts:814-820`) không nối lần trượt Writing ở BE vào Case G+V của FOU;
   - nhóm "Case bàn giao"/"Từ lớp trước", tên môn ở bảng kỹ năng, Ngăn Case (`caseDetail`, `cases.ts:1532-1579`), bộ nguyên nhân ở panel Xác nhận nguyên nhân đều dùng chương trình gốc;
   - phép kiểm: em FOU có Case G+V → lên BE → trượt Writing Giữa khoá BE ⇒ 2 Case, Case G+V ghi "G+V" ở mọi chỗ; Case tự báo G+V vào đúng nhóm; tổng Case Tổng quan/Phân tích không đổi nghĩa.
4. Mọi **P0/P1** trong `tich-hop-uxd.md` (rà tích hợp lượt 2), nếu báo cáo có.

## Task 1 · DEP-1 — khoá backfill trong `napDuLieuNen` + "init → migrate không làm gì"

**Files:** `server/src/seed/duLieuNen.ts` · `server/src/migrate.ts` (`migrateXoaDuLieu` :3317-3336, chỉ đọc lại) ·
tạo `server/src/tests/prDeploy.tests.ts` + đăng ký cuối `run.ts` · `server/src/tests/banChinh.tests.ts:531-546` (sửa kỳ vọng).

Hiện trạng: DB mới từ `init-ban-chinh` **không có** khoá `xoa_du_lieu_backfill_at`. Bản chính chạy vài tuần, QL "Bỏ lưu trữ" một em đã thôi học;
lần `npm run migrate` đầu tiên (khi có PR sau cần migrate) chạy bước backfill (`migrate.ts:3327-3333`) và **lưu trữ lại** em đó.

- [ ] **Phép kiểm trước** (khối DEPLOY-1, nhánh Turso như `Z2c-b`):
  - (1a) `initBanChinh` trên DB tạm → `demo_config` có `xoa_du_lieu_backfill_at`;
  - (1b) init → thêm một em `status='finished'`, `archived_at = NULL` (như sau "Bỏ lưu trữ") → `migrate()` → em đó **vẫn** `archived_at = NULL`;
  - (1c) **init → migrate không làm gì:** chụp mọi bảng (`SELECT * … ORDER BY rowid`) + `sqlite_master` trước và sau `migrate()` → `applied = []`
    **và** hai bản chụp giống hệt, trừ đúng dòng `case_engine_migrated_at` (Q4). Chạy migrate **hai lần** liền, lần hai cũng vậy.
- [ ] `napDuLieuNen`: thêm một dòng `INSERT INTO demo_config … ('xoa_du_lieu_backfill_at', now, now)` cạnh dòng `normal_pass_threshold`, chú thích một câu
  "DB mới chưa từng có em thôi học kiểu cũ — khoá trước để migrate không lưu trữ lại em QL đã Bỏ lưu trữ (DEP-1)".
- [ ] Sửa kỳ vọng `banChinh.tests.ts:543-544`: `demo_config` có **đúng** các khoá dấu (`normal_pass_threshold`, `xoa_du_lieu_backfill_at`, và `khoi_tao_moi_at` ở Task 2). Không ngày demo, không kịch bản.
- [ ] Phép kiểm `xoaDuLieu.tests.ts:107-125` (L4, L5) dựng DB từ `SCHEMA`, không qua `napDuLieuNen` → phải còn xanh. Kiểm.
- [ ] `npm run check` → commit `PR-DEPLOY (1): DEP-1 — DB mới khoá sẵn bước đưa em thôi học vào Lưu trữ; init → migrate không đổi gì`.

## Task 2 · DEP-2 — rà mọi bước dữ liệu chạy lại mỗi lần migrate; khoá trên DB mới; schema.sql = migrate

**Files:** `server/src/seed/duLieuNen.ts` · `server/src/migrate.ts` · `server/src/migrate/prN1.ts`, `prDuyet.ts`, `prMon.ts`, `prLop.ts` (và mọi file Task 0 tìm thêm) ·
`server/src/tests/prDeploy.tests.ts`.

**Bước 1 — bảng rà (ghi vào Nhật ký, chép vào thân PR).** Liệt kê **mọi** `UPDATE` / `DELETE` / `INSERT … SELECT` / `INSERT OR …` trong `migrate.ts`
(sau dòng 530) và `migrate/*.ts` **không** nằm sau một chốt "chỉ chạy khi thiếu cột/bảng/khoá". Mỗi dòng: chỗ · chạy lại mỗi lần? · có thể đổi dữ liệu
mã hiện hành ghi? · xử lý (`an toàn lặp` / `khoá dbMoi` / `khoá riêng`). Điểm bắt đầu (đã thấy ở `df0d57cf`, **chưa đủ** — session quét hết):

| Chỗ | Làm gì | Nghi ngờ trên DB mới |
|---|---|---|
| `migrate.ts:496-504` (`legacyClosed`) | Case `done` mà `disposition IS NULL` → ghi "Đóng theo hệ thống cũ" | **Cao** nếu còn đường đóng Case không ghi hướng xử lý (tự đóng, huỷ, đóng do chuyển lớp…) — kiểm `cases/*.ts` |
| `migrate/prN1.ts:44-47` (`migratePrN1`) | PA đang chạy có hạn Chủ nhật → +1 ngày | hạn đặt tay rơi Chủ nhật bị dời mỗi lần migrate |
| `migrate/prN1.ts:37-41` (`migrateTrangThaiCaseSos`) | tính lại Chưa xử lý/Đang xử lý Case SOS | thấp (cùng luật `dongBoTrangThaiCase`) — xác nhận |
| `migrate/prDuyet.ts:67-73` (`napYeuCauTuNguonCu`) | chép PA "chờ duyệt"/đề nghị dời `pending` thành thẻ, `ON CONFLICT DO NOTHING` | thẻ đã bị **từ chối/xoá** có thể sinh lại |
| `migrate/prMon.ts:38-47` | đổi kỹ năng `writing`/`prep_writing`/`pronunciation` của GV | an toàn lặp nếu mã hiện hành không ghi mã cũ — xác nhận |
| `migrate/prLop.ts:30, 57` | đổi tên lớp, cập nhật lớp | kiểm điều kiện |
| `migrate.ts:3015, 3023-3032, 3059` (`migrateCaseForm`) | `urgency 'normal'→'attention'`, `merge_until`, `episode_no` | kiểm mã hiện hành còn ghi các giá trị đó không |
| `migrate.ts:1272-1296` (`migrateAccounts`) | tài khoản/mật khẩu mặc định | đã chặn trên nhánh Turso (`banChinh.tests.ts:148`) — giữ |
| `migrate.ts:1429-1442, 1518, 1534, 1567, 1799, 1865, 2283, 2478, 3133, 3231, 3243` | lấp cột từ dữ liệu cũ | kiểm từng chốt |

- [ ] **Phép kiểm trước** (khối DEPLOY-2):
  - (2a) **mã hiện hành → migrate không đổi dòng nào:** `runSeed()` vào **file tạm** (tiến trình con, như `tocDo.run.ts`), chụp mọi bảng, `migrate()` qua **nhánh Turso**
    (Q3), chụp lại → giống hệt trừ `case_engine_migrated_at`. Bộ demo dựng bằng chính hàm nghiệp vụ, nên đỏ ở bảng nào = bước migrate đó đè dữ liệu của mã hiện hành;
  - (2b) thêm dữ liệu "bẫy" cho từng dòng **Cao/nghi ngờ** của bảng rà mà bộ demo chưa có (ví dụ: Case đóng theo đường hiện hành mà `disposition` NULL nếu có đường đó;
    PA đang chạy hạn đặt tay rơi Chủ nhật; thẻ Chờ duyệt đã từ chối của PA còn "chờ") → migrate → không đổi;
  - (2c) **schema.sql = migrate, toàn bộ:** DB dựng từ `schema.sql` → `migrate()` (nhánh Turso) → `sqlite_master` (bảng, cột theo `PRAGMA table_info`, chỉ mục) **không đổi**. Một phép
    cho **mọi** bảng, bổ sung cho các phép theo từng PR;
  - (2d) ba cột Pb2-b (`assessment_scores.nhap_dau_ngay`, `violations.han_xu_ly`, `violations.phan_hoi_ngay`) có trên DB dựng bằng `initBanChinh` (mục "init-ban-chinh
    có ba cột mới" — init đọc `schema.sql` nên phép này phải xanh ngay; giữ làm chốt). Cột/bảng mới Task 0 tìm thấy: thêm vào (2d).
- [ ] `napDuLieuNen`: thêm dòng dấu `khoi_tao_moi_at` (Q2).
- [ ] `migrate.ts`: `const dbMoi = !!conn.prepare("SELECT 1 FROM demo_config WHERE key = 'khoi_tao_moi_at'").get()` **một lần** ở `migrateCaseEngine`, truyền xuống các
  bước bảng rà ghi `khoá dbMoi` (tham số cuối, mặc định `false` để phép kiểm cũ gọi trực tiếp không đổi). Bước `prN1`, `prDuyet` gọi từ `migrateCaseEngine` cũng nhận cờ.
  Có `demo_config`? `has('demo_config')` trước (DB rất cũ).
- [ ] Mỗi bước bỏ qua trên DB mới có chú thích một dòng "DB mới (khoi_tao_moi_at) không có dữ liệu kiểu cũ — bỏ qua (DEP-2)".
- [ ] Phép kiểm cũ của từng bước (`prDuyet.tests.ts`, `prMon.tests.ts`, `run.ts` PR-N N1, `prLop.tests.ts`…) dựng DB cũ không có dấu → vẫn chạy bước → phải còn xanh.
- [ ] `npm run check` → commit `PR-DEPLOY (2): DEP-2 — bước chuyển dữ liệu cũ bỏ qua trên DB mới; mã hiện hành → migrate không đổi dòng nào; schema.sql = migrate`.

## Task 3 · An toàn phút chót — mỗi chốt một phép kiểm; thước đo giới hạn Turso

**Files:** `server/src/tests/prDeploy.tests.ts` · `server/src/tests/tocDo.run.ts` · `server/src/platform/nguCanhRequest.ts` hoặc `db.ts` (chỗ đếm câu, nếu cần móc thước đo).

**Bước 1 — bảng chốt.** Tra phép kiểm đã có, ghi tên vào bảng (Nhật ký + thân PR). Ô "chưa có" → thêm phép kiểm ở bước 2.

| Chốt | Phép kiểm đã có (ở `df0d57cf`) | Thiếu? |
|---|---|---|
| Bản chính từ chối seed | `banChinh.tests.ts:54-84, 425, 429, 435` | — |
| "Vào nhanh" 404 | `banChinh.tests.ts:332, 336, 341, 388` | — |
| Mật khẩu demo bị chặn (Q6) | init từ chối `:588`; init đặt đúng mật khẩu cho, khác `pisa2026` `:499`; migrate Turso không đặt mật khẩu mặc định `:148`; `/auth/info` không lộ `demoAdmin` `:388` | `kiem-sau-init` báo tài khoản mang mật khẩu demo → Task 4 |
| Cron `chot-vang`: lịch, hàm gọi đúng | `anToan.tests.ts:477-531` | — |
| Cron thi hành lệnh chuyển lớp; lỗi chuyển không làm hỏng chốt vắng | `prCt.tests.ts:526-537` (CT 4j) | **(3a)** cron trên DB **mới từ init** (chưa có lớp, chưa có lệnh) → `daChot 0, daChuyen 0, boQua null`, không ném lỗi |
| Giới hạn Turso ở đường lớn nhất | trần **số câu** `tocDoDuong.ts`; UNION ≤ 20 chỉ ở `xoaTaiKhoan` (`anToan.tests.ts:778`) | **(3b)** thước đo tham số/UNION/tham số đặt tên (Q7) |
| `BEGIN IMMEDIATE`, không tham số đặt tên | `db.ts:262`, PR #102 | kiểm có phép kiểm; thiếu → thêm một dòng |

- [ ] **Phép kiểm trước:**
  - (3a) `initBanChinh` trên DB tạm → `chotVangDinhKy({ ngay: <một Thứ Hai> })` với DB đó → kết quả như bảng, không ném;
  - (3b) trong `tocDo.run.ts`, **sau** `nhanDuLieu(3)`: móc vào chỗ đếm câu, ghi với mỗi câu: số tham số (`args.length`, trải mảng), số vế `UNION` (đếm chữ `UNION`
    ngoài chuỗi), có `:x`/`@x`/`$x` không. Chạy hết `DUONG_DO` × vai + các đường ghi lô `TRAN_GHI_LO`. Kỳ vọng: max tham số ≤ 900, max vế ≤ 20, 0 tham số đặt tên.
    In bảng 5 câu nặng nhất (đường · tham số · vế) vào log để Nhật ký chép lại.
- [ ] Sửa nếu đỏ: chia lô bằng `theoLo` (Q7). Không nâng trần câu quá 30 %; vượt → Nhật ký + planning.
- [ ] `npm run check` → commit `PR-DEPLOY (3): chốt an toàn bản chính — bảng phép kiểm, cron trên DB mới, thước đo 900 tham số / 20 vế UNION`.

## Task 4 · `kiem-sau-init` (chỉ đọc) thay `kiem-sau-xoa`

**Files:** `server/src/ops/kiemSauInit.ts` (mới) · xoá `server/src/ops/kiemSauXoa.ts` · `package.json` (script) · `server/src/ops/initBanChinh.ts`
(export `BANG_NEN_INIT`) · `banChinh.tests.ts:534-536` (dùng `BANG_NEN_INIT`) · `prDeploy.tests.ts`.

Lệnh in (chỉ `prepare(...).get/all`, không ghi câu nào):
1. dòng `Đích:` (`moTaDichDb`, như `runInit.ts:31`);
2. mỗi bảng nền: số dòng; mọi bảng **ngoài** `BANG_NEN_INIT` có dòng → liệt kê (DB vừa init phải rỗng — DB đã nhập dữ liệu thật thì chỉ để biết);
3. số tài khoản, số chi nhánh (mã · tên), các khoá `demo_config`;
4. tài khoản nào có `password_hash` = scrypt(`pisa2026`, salt của chính nó) → **ĐỎ** (Q6);
5. `PRAGMA foreign_key_check` → 0 dòng;
6. dòng cuối `[kiem-sau-init] Đạt.` hoặc `[kiem-sau-init] CÓ VẤN ĐỀ: …`, mã thoát 1.

- [ ] **Phép kiểm trước:** chạy lệnh (tiến trình con, nhánh Turso URL file) trên DB vừa init → mã 0, có `Đạt.`, có đủ chi nhánh, **không** in token; trên DB init rồi
  đặt một tài khoản mật khẩu `pisa2026` → mã 1, có `mật khẩu demo`; file DB giữ nguyên từng byte sau lệnh (chỉ đọc). Không có biến Turso → dùng DB cục bộ như lệnh cũ.
- [ ] Viết `kiemSauInit.ts` (dùng lại `cacBang`/`KHONG_NOI_BO` của `saoLuu.ts`, `hashPassword` của `accounts.ts` — không viết lại).
- [ ] Xoá `kiemSauXoa.ts` + script `kiem-sau-xoa`; grep `kiem-sau-xoa` toàn repo → 0 (trừ Nhật ký/kế hoạch cũ).
- [ ] `npm run check` → commit `PR-DEPLOY (4): lệnh chỉ đọc kiem-sau-init thay kiem-sau-xoa`.

## Task 5 · DEP-5 — seed D18 "PA GV thêm có kết quả"; DEMO.md, README

**Files:** `server/src/seed/pb2bSeed.ts` (:72-183) · `DEMO.md` · `README.md` · `prDeploy.tests.ts`.

- [ ] **Phép kiểm trước:**
  - (5a) bộ demo: Phân tích › Giáo viên (QL Monbay, FT, 09/2026) → hàng **Đỗ Thu Hương** và **Võ Mỹ Duyên** có ô "PA hiệu quả" **≥ 1** từ PA `preset = 0` có kết quả cuối trong W1–W3 SEP
    (không cần mở 13 tuần như phép `4k` cũ — `reviews/…/pb2-b.md:117-120`);
  - (5b) **tài liệu khớp lệnh:** mọi `npm run <x>` trong `TRIEN_KHAI.md`, `README.md`, `DEMO.md` có trong `package.json` scripts (bắt `kiem-sau-xoa` cũ);
  - (5c) **tên lớp mẫu mới:** `DEMO.md`, `README.md` không còn tên lớp kiểu cũ `/\b[A-Z]{2}-(FT|FOU|BE|ELE|Pre)\b/`, trừ đúng một câu nói về lớp giữ tên cũ để thử ô tìm (K5 §6 cuối) nếu bộ demo còn lớp đó.
- [ ] Seed: thêm 1–2 PA `preset = 0` có kết quả cuối W1–W3 SEP cho Hương/Duyên, dựng bằng hàm nghiệp vụ như phần còn lại của `buildPb2bDemo`. Không đổi số khác của D18 (phép kiểm Pb2b còn xanh).
- [ ] `DEMO.md`:
  - đầu file thêm **bảng mục lục D1–D18** (theo `thiet-ke/ra-27-09/K5.md` §6): mã · ở đâu trong file · em/lớp mở. D4 ghi "bỏ — DB reset, không có lệnh bổ sung MT cho dữ liệu cũ".
    D14 (Ý thức v4) trỏ mục 1, D17 (Chờ duyệt đủ 6 chip) trỏ đúng mục; D18 = **Phân tích giáo viên** (Pb2-b), không phải KPI (Q30-5 bỏ KPI);
  - mục 17 thêm dòng **PA hiệu quả** (Hương/Duyên);
  - mọi tên lớp `MB-FT 101` → `MB FT 101` (theo bộ demo thật — tra `seed/`);
  - **bỏ kịch bản v3:** mục 3 ghi chú "rulebook v3", mục 9 tiêu đề "SOS v3", B4 "rulebook v3", chỗ dẫn `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` bản v3 → viết theo v4 hiện hành hoặc xoá câu
    lịch sử; K5 §7 dòng `DEMO.md` (kịch bản 6, 7 biện pháp "đang chuẩn bị") → kiểm mục 1 đã theo YT4, còn sót thì sửa;
  - ngày, mã tuần theo luật trên màn (`W2 OCT`; ngày chỉ cho hạn cụ thể).
- [ ] `README.md`: tên lớp (dòng ~126), dòng ~262 mô tả `DEMO.md` (đúng các mục hiện có), mục 11 "Bản chính trên mạng" trỏ `TRIEN_KHAI.md` mục **Reset bản chính** (Task 8).
- [ ] `npm run check` → commit `PR-DEPLOY (5): DEP-5 — D18 có PA GV thêm có kết quả; DEMO.md mục lục D1–D18, tên lớp mới, bỏ v3; README`.

## Task 6 · Tập dượt init trên database TẠM (chủ sản phẩm đặt tên) — đo thời gian

**Không sửa mã** (trừ khi tập dượt lộ lỗi). Chờ chủ sản phẩm (Câu 3):
- **A (khuyên):** chủ sản phẩm tạo DB Turso **tạm** tên bắt đầu `pisatracking-demo-` (ví dụ `pisatracking-demo-thu-init`), vùng Ohio, rồi đưa URL + token
  cho session (token DB thử/tạm được phép đưa — `TRIEN_KHAI.md` §0.5). Đưa bằng tệp ngoài repo, không dán vào chat.
- **B:** file cục bộ `data/thu-init.sqlite` qua URL `file:` (không đo được thời gian Turso).

- [ ] Cửa sổ PowerShell mới, dòng đầu tắt lịch sử. Đặt `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (DB tạm), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (Q11 — tự sinh), `CHI_NHANH` (Q11).
- [ ] `npm run init-ban-chinh`, bấm giờ. Đúng: dòng đầu `Đích: database THỬ (pisatracking-demo-…)`, dòng cuối `Xong … 5 chi nhánh`, độ dài mật khẩu khớp.
  Tên chi nhánh có dấu hiện đúng khi đọc lại (bước `kiem-sau-init`).
- [ ] `npm run init-ban-chinh` **lần hai** → `TỪ CHỐI: Database đã có dữ liệu`, không ghi gì.
- [ ] `$env:PISA_CHO_PHEP_MIGRATE_TURSO='<tên máy chủ DB tạm>'; npm run migrate`, bấm giờ. Đúng: `Không có gì để nâng cấp` (DEP-1, DEP-2 trên Turso thật).
- [ ] `npm run kiem-sau-init` → `Đạt.` (không dữ liệu demo, không mật khẩu demo, khoá ngoại 0). Bấm giờ.
- [ ] `npm run seed` (không đặt `PISA_CHO_PHEP_SEED_TURSO`) → **TỪ CHỐI**, dừng trước khi kết nối.
- [ ] Chạy web trên máy nối DB tạm, chế độ bản chính: API `PORT=4197` (`BAN_CHINH=1`), Vite tạm 5397 (`VITE_BAN_CHINH=1`, cấu hình Vite tạm theo memory "máy chủ dev trong worktree").
  Đăng nhập quản trị tập dượt bằng giao diện (localhost — giá trị thử). Kiểm:
  - màn đăng nhập **không** có "Vào nhanh"; `POST /api/demo/session` → 404; `GET /api/demo/accounts` → 404;
  - ngày trên màn là **hôm nay**;
  - **màn trống của DB mới** không lỗi, 1440 + 375, sáng + tối: Tổng quan, Học viên & Lớp, Công việc, Test › Lịch Test, Phân tích, Quản trị › Tài khoản, Quản trị › Lớp
    (ảnh `thiet-ke/anh/pr-deploy/trong-{man}-{1440|375}-{sang|toi}.png`). Lỗi → sửa (luật skill ở Bảng điều hành), phép kiểm trước, commit riêng.
- [ ] Gỡ biến Turso, tắt 4197/5397. Báo chủ sản phẩm **xoá DB tạm** (bước tay — `TRIEN_KHAI.md` §7a bước 5).
- [ ] Nhật ký: thời gian init / migrate / kiem-sau-init, kết quả từng dòng. **Không** ghi URL đầy đủ, token, mật khẩu.
- [ ] (Chỉ khi có sửa mã) `npm run check` → commit `PR-DEPLOY (6): …`. Không sửa → ghi Nhật ký, không commit.

## Task 7 · DB THỬ lên schema đợt 6 → bản nháp → đo tốc độ (VN22)

**Hỏi chủ sản phẩm một câu trước khi ghi DB THỬ:** "Cho phép session chạy `npm run migrate` trên DB THỬ `pisatracking-demo-…` và gửi bản nháp
(`netlify deploy --build`, không `--prod`)?" Chờ "đồng ý" trong chat.

- [ ] Lấy biến DB THỬ không in token: `$env:TURSO_DATABASE_URL = netlify env:get TURSO_DATABASE_URL --context deploy-preview` (tương tự token). URL **phải** có `-demo-`; không có → dừng.
- [ ] `npm run sao-luu` DB THỬ vào thư mục tạm của session (đường lùi), rồi `PISA_CHO_PHEP_MIGRATE_TURSO` = tên máy chủ DB THỬ → `npm run migrate`. Đúng: `Hoàn tất` hoặc `Không có gì để nâng cấp`.
  Ghi thời gian. Gỡ biến.
- [ ] `netlify deploy --build` (**không** `--prod`) → ghi `Draft URL`.
- [ ] Nhờ chủ sản phẩm mở bản nháp trong khung trình duyệt: đăng nhập Netlify (bản nháp Private) rồi đăng nhập **tài khoản demo** đúng vai. Session chỉ bấm bằng giao diện,
  đọc `performance.getEntriesByType('navigation')` và thời gian gọi `/api/*` của trang (không chạy JS gọi API hàng loạt).
- [ ] Đo (lần đầu + lần hai mỗi trang), vai QL · GVCN · GVBM · Quản trị: Tổng quan, Học viên & Lớp, hồ sơ lớp FT, hồ sơ HV dày nhất (J03), Test › Lịch Test, Công việc, Phân tích › Giáo viên, Chờ duyệt.
  Mốc 23/09: mọi trang < 3 s, chậm nhất 2,3 s. Trang > 3 s → ghi đường + vai + số câu (`tocDoDuong`) vào Nhật ký, báo planning (không sửa trong PR này trừ khi cỡ S).
- [ ] `netlify logs` cửa sổ 4 phút (`--since/--until` ISO đầy đủ) → không có `Có lỗi · mã`, không `Hrana … stream not found` lặp, không lỗi tham số.
- [ ] Bảng đo vào Nhật ký + thân PR. Không commit (không đổi mã).

## Task 8 · DEP-4 — `TRIEN_KHAI.md`: mục "Reset bản chính" + sửa dòng lỗi thời

**Files:** `TRIEN_KHAI.md` · `CODE_MAP.md` (dòng lệnh ops) · `prDeploy.tests.ts` (phép 5b đã có; thêm (8a)).

- [ ] **Phép kiểm trước** (8a): `TRIEN_KHAI.md` có tiêu đề `Reset bản chính`; trong mục đó đủ các chữ khoá: `sao-luu`, `pisatracking-`, `init-ban-chinh`, `CHI_NHANH`,
  `--context production`, `netlify deploy --build`, `--prod`, `Vào nhanh`, `[chot-vang]`, `kiem-sau-init`; không còn chữ `PR-Z2a`, `PR-Z2c`, `Session Z2c` ở đầu file và bảng §1.
- [ ] Thêm mục **"1a. Reset bản chính — làm một lần, khi session PR-DEPLOY báo xong"** ngay sau §1, đúng nội dung ở **Phụ lục A** (điền thời gian đo ở Task 6–7).
- [ ] Sửa dòng lỗi thời (số dòng ở `df0d57cf` — tra lại theo chữ):
  - L6-7: bỏ ghi chú "Chưa merge PR-Z2a/Z2b";
  - L89-96: bảng "Khi nào / Làm mục nào" viết lại: lần này → mục 1a; mỗi lần deploy → §8; mỗi tuần → §10; khi session nói → §11.1; sự cố → §11.2;
  - L102, L110: tên database **mới** bắt đầu `pisatracking-` (ví dụ `pisatracking-v2`), **không** có chữ `demo`; tạo lại đúng tên cũ thì kho tệp (Netlify Blobs) dùng lại kho cũ (`khoTep.ts:17`) — không làm;
  - L247: "một lần duy nhất" → "một lần cho mỗi database mới";
  - L317-318: "chưa từng chạy trên Turso rỗng" → "đã chạy 23/09 (60 s) và <ngày Task 6> (<n> s)";
  - L382-386: bản nháp: DB THỬ phải lên schema mới (§11.1, làm trên DB THỬ) **trước** `netlify deploy --build`;
  - L407 (§9 bước 4): bỏ "xếp lịch MT" (lịch MT tự tạo khi thêm HV); thêm **email học viên bắt buộc**, bảng dán có dòng tiêu đề, ngày `dd/mm/yyyy`;
  - L508-579 (§11.1 lệnh chạy thử đợt 1–2): gom thành khối **"Lịch sử — chỉ cho database cũ trước reset"**, thu gọn, không xoá lệnh (DB THỬ còn dùng tới khi seed lại);
  - §12: thêm `PISA_CHO_PHEP_SEED_TURSO` (chỉ máy dev/DB thử; bản chính luôn từ chối) và `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`CHI_NHANH` trỏ mục 1a;
  - `package.json:22` `kiem-sau-xoa` → đã xoá ở Task 4; §11 bảng sự cố thêm dòng "`kiem-sau-init` báo CÓ VẤN ĐỀ → chụp màn hình gửi session".
- [ ] `CODE_MAP.md`: dòng `kiem-sau-init`, bỏ `kiem-sau-xoa`; ghi dấu `khoi_tao_moi_at`.
- [ ] Đọc lại cả file như người không biết code: mỗi khối lệnh có token/mật khẩu bắt đầu bằng `Set-PSReadLineOption …`; mỗi khối kết thúc "ĐÓNG cửa sổ PowerShell".
- [ ] `npm run check` → commit `PR-DEPLOY (8): DEP-4 — TRIEN_KHAI mục Reset bản chính, sửa dòng lỗi thời`.

## Task 9 · `/ponytail-review`, quét, mở PR

- [ ] Cổng gộp `origin/main` nếu có PR mới merge (bảng file chồng) → `npm run check`.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] Quét: không còn `npm run check` treo; 4197/5397 đã tắt; không còn biến Turso trong cửa sổ nào; không file DB tạm/cấu hình Vite tạm trong worktree;
  `git grep -n "authToken=\|eyJ"` → 0 dòng mới.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - model thật; mốc B → số phép kiểm cuối;
  - bảng rà DEP-2 (Task 2) và bảng chốt an toàn (Task 3), 5 câu nặng nhất theo tham số/UNION;
  - thời gian tập dượt (Task 6), bảng tốc độ bản nháp (Task 7);
  - dòng **"Tập dượt init: đạt, init … s, migrate … s, kiem-sau-init đạt — mã `<sha>`"** (bước 3 của Phụ lục A đọc dòng này);
  - "Chuyển cho PR khác / sau deploy"; `ponytail:`;
  - câu cuối cho chủ sản phẩm: "Merge xong thì làm `TRIEN_KHAI.md` mục 1a."

## Câu hỏi cho chủ sản phẩm (3)

1. **Giữ database bản chính CŨ bao lâu sau reset (TAY-7)?** Trong thời gian này, nếu bản mới hỏng thì "quay lại bản deploy cũ" vẫn chạy được trên dữ liệu cũ.
   - A. 2 tuần · B. **4 tuần** · C. Tới hết khoá học hiện tại.
   - **Khuyên B:** đủ một chu kỳ MT và vài lần sao lưu tuần của DB mới; file sao lưu cũ trên Drive vẫn giữ mãi.
2. **Tên database bản chính MỚI?** (phải bắt đầu `pisatracking-`, **không** chứa chữ `demo` — chữ đó làm máy hiểu là DB thử)
   - A. **`pisatracking-v2`** · B. `pisatracking-<ngày reset>`, ví dụ `pisatracking-1005` · C. Anh/chị tự đặt theo luật trên.
   - **Khuyên A:** ngắn, nhìn là biết bản thứ hai; tên file sao lưu sẽ là `pisa-pisatracking-v2-…`.
3. **Tập dượt init (Task 6) làm trên đâu?**
   - A. **DB tạm trên Turso** anh/chị tạo (tên `pisatracking-demo-thu-init`, vùng Ohio), đưa URL + token cho session qua một tệp; session tự chạy, báo thời gian, rồi anh/chị xoá DB tạm ·
     B. File trên máy, anh/chị không phải làm gì — nhưng không đo được thời gian thật qua mạng.
   - **Khuyên A:** schema đã lớn hơn nhiều so với lần tập dượt 23/09; cần biết init còn chạy gọn trong một giao dịch qua mạng không.

## Chuyển cho PR khác / sau deploy (ghi vào thân PR)

| Việc | Khi nào | Giao kèo PR-DEPLOY để lại |
|---|---|---|
| Gỡ hẳn mã chuyển dữ liệu cũ trong `migrate.ts`/`migrate/*.ts`, lệnh `chay-thu:*`, `kiem-lop-mo-coi`, khối "Lịch sử" §11.1 | sau TAY-7 (DB cũ đã xoá) **và** DB THỬ đã seed lại | dấu `khoi_tao_moi_at`; bảng rà DEP-2 trong thân PR |
| Cột chống gửi đôi (`idempotency_key`) cho PA, theo dõi, việc Vận hành | sau deploy (cần migrate) | — |
| Nhận định xu hướng ở Điểm đáng chú ý; xu hướng bảng Phân tích GV | sau 2–3 tháng dữ liệu thật | — |
| UX-D7 bảng quản trị trên điện thoại | sau deploy, khi QL cần | — |
| Trang > 3 s ở Task 7 (nếu có) | planning | bảng đo trong thân PR |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Làm | Mong đợi |
|---|---|---|---|---|
| 1 | session | PowerShell, DB tạm | `init-ban-chinh` | `Đích: database THỬ`; `Xong … 5 chi nhánh`; lần hai `TỪ CHỐI` |
| 2 | session | PowerShell, DB tạm | `migrate` ngay sau init | `Không có gì để nâng cấp` |
| 3 | session | PowerShell, DB tạm | `kiem-sau-init` | `Đạt.`; tên chi nhánh có dấu đúng |
| 4 | session | PowerShell, DB tạm | `seed` không biến cho phép | `TỪ CHỐI` trước khi kết nối |
| 5 | Quản trị tập dượt | `localhost:5397` (BAN_CHINH) | mở màn đăng nhập | không "Vào nhanh"; ngày hôm nay; `POST /api/demo/session` 404 |
| 6 | Quản trị tập dượt | 7 màn trống, 1440 + 375, sáng + tối | mở từng màn | không lỗi, không cuộn ngang, chữ "chưa có…" thay vì bảng vỡ |
| 7 | QL · GVCN · GVBM · QT demo | bản nháp (Private) | 8 trang × 2 lần | < 3 s; log không lỗi |

## Phụ lục A — nội dung mục "1a. Reset bản chính" trong `TRIEN_KHAI.md`

Session chép vào `TRIEN_KHAI.md`, điền `<…>` bằng số đo và quyết định Câu 1–2. Viết cho người không đọc code. **14 bước**, làm đúng thứ tự, một buổi
(~1–2 giờ, chưa tính bước 12–14). Mỗi khối lệnh có token: dòng đầu `Set-PSReadLineOption -HistorySaveStyle SaveNothing`; xong: **ĐÓNG cửa sổ PowerShell**.

> Reset = dựng một database **mới tinh** cho bản chính. Database cũ **không bị xoá** (giữ <4 tuần> làm đường lùi). Mọi tài khoản, lớp, học viên trên bản cũ
> **không** chuyển sang — tạo lại ở bước 11. Báo trước cho người đang có tài khoản (Hằng, Yến, Thu Hà, Ánh, Tường Vi).

| # | Việc | Lệnh / thao tác | Đúng khi | Hỏng thì |
|---|---|---|---|---|
| 1 | Lấy mã mới nhất | `git checkout main` · `git pull` · `npm install` | `Already up to date.` hoặc danh sách file; `npm install` không chữ đỏ `ERR!` | chụp màn hình gửi session, dừng |
| 2 | **Sao lưu DB CŨ + tệp** (TAY-1) | khối §10 với URL + token DB **CHÍNH CŨ**, thêm `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`; `npm run sao-luu` | dòng cuối `[sao-luu] Xong. Bản sao lưu của database libsql://pisatracking-<…>` (**không** `-demo`); có file `.sqlite` **và** thư mục `…-tep` trong Drive. Ghi tên file vào ghi chú | **dừng hẳn**, không làm bước nào sau; gửi session ảnh màn hình |
| 3 | Kiểm tập dượt init | mở thân PR-DEPLOY trên GitHub | có dòng "Tập dượt init: đạt …"; `git log --oneline <sha trong dòng đó>..main -- server/src/schema.sql server/src/seed server/src/ops` **không in gì** | có dòng in ra → làm lại §7a (tập dượt) trước khi qua bước 4 |
| 4 | DB THỬ lên schema mới (TAY-2) | §11.1 với URL/token/tên máy chủ DB **THỬ** — **bỏ qua** nếu Nhật ký PR-DEPLOY ghi đã migrate DB THỬ và sau đó không PR nào báo "cần migrate" | `Hoàn tất` hoặc `Không có gì để nâng cấp` | chụp gửi session; chưa làm bước 8 |
| 5 | **Tạo DB CHÍNH MỚI** (TAY-3) | Turso › Create Database, tên **`<pisatracking-v2>`**, vùng **Ohio** (như §2 bước 3–7); copy URL + token, ghi `CHÍNH MỚI` | URL dạng `libsql://pisatracking-v2-<…>.aws-us-east-2.turso.io`, **không** có `-demo` | tên đã có → thêm số (`pisatracking-v3`); **không** dùng tên có chữ `demo` |
| 6 | **Khởi tạo DB MỚI** (TAY-4) | khối §7.2 với URL + token **CHÍNH MỚI**; `ADMIN_EMAIL` = email quản trị thật (đuôi `.pisa@gmail.com`); `ADMIN_PASSWORD` = mật khẩu **mới**, chưa từng gửi ai, ≥ 10 ký tự; `CHI_NHANH='MB=Monbay;BC=Bãi Cháy;CP=Cẩm Phả;UB=Uông Bí;HD=Hải Dương'` (sửa nếu đổi); `npm run init-ban-chinh` | dòng đầu `Đích: database BẢN CHÍNH — dữ liệu thật (pisatracking-v2-…)`; dòng cuối `Xong. Đã tạo tài khoản quản trị … và 5 chi nhánh`; độ dài mật khẩu khớp. Mất khoảng <n> giây | dòng đầu có `THỬ`/`KHÔNG RÕ` → **Ctrl+C**, kiểm URL · `TỪ CHỐI: … đã có dữ liệu` → nhầm database, dừng · lỗi mạng → chạy lại đúng lệnh (đã ghi xong thì nó báo "đã có dữ liệu") |
| 7 | Kiểm DB mới | cùng cửa sổ: `npm run kiem-sau-init`, rồi **ĐÓNG cửa sổ** | dòng cuối `[kiem-sau-init] Đạt.`; thấy 5 chi nhánh, 1 tài khoản | `CÓ VẤN ĐỀ` → chụp gửi session, chưa làm bước 8 |
| 8 | Trỏ bản chính thức sang DB MỚI (TAY-5) | cửa sổ mới, khối §6 với URL + token **CHÍNH MỚI** (`--context production`, hỏi overwrite gõ `y`); rồi hai lệnh `netlify env:get` | `--context production` in `libsql://pisatracking-v2-…`; `--context deploy-preview` in `libsql://pisatracking-demo-…` | sai một trong hai → **dừng**, chụp gửi session |
| 9 | Bản nháp | `netlify deploy --build` (§8.1); mở Draft URL (đăng nhập Netlify), đăng nhập **tài khoản demo** | trang mở, bấm vài trang không lỗi (bản nháp dùng DB THỬ — chưa thấy DB mới, đúng như vậy) | đăng nhập demo thất bại → **dừng** (§8.1 cảnh báo), gửi session |
| 10 | **Lên chính thức** | `netlify deploy --build --prod` | dòng cuối `Website URL: https://<tên-site>.netlify.app` | web lỗi → §8 "Quay lại bản cũ" (Publish deploy bản trước — chạy mã cũ + DB cũ, dữ liệu cũ còn nguyên) |
| 11 | Kiểm bản chính thức + nhập dữ liệu thật (TAY-6) | mở `https://<tên-site>.netlify.app`, đăng nhập quản trị **mới**; mở `https://<tên-site>.netlify.app/api/demo/accounts`; rồi §9 | **không** có nút "Vào nhanh"; ngày là **hôm nay**; trang `/api/demo/accounts` báo `Không tìm thấy endpoint`; Quản trị thấy 5 chi nhánh. Rồi: tạo tài khoản QL/GV (email đuôi `.pisa@gmail.com`) → lớp + phân công → thêm học viên (**email bắt buộc**; lịch MT tự tạo) | có "Vào nhanh" hoặc ngày khác hôm nay → quay lại bản cũ (bước 10), gửi session |
| 12 | Sao lưu đầu tiên của DB MỚI | §10 với URL + token **CHÍNH MỚI**, sau khi nhập xong dữ liệu ngày đầu | file `pisa-pisatracking-v2-…sqlite` trong Drive | gửi session |
| 13 | **Thứ Hai đầu tiên** xem cron | Netlify › site › **Logs** › **Functions** › **chot-vang** | có dòng `[chot-vang] {"ngay":"<Thứ Hai đó>","daChot":…,"daChuyen":…,"boQua":null,…}` lúc ~00:05 và ~06:05 | không có dòng nào, hoặc `"boQua":"chua-khoi-tao"`, hoặc `[chot-vang] lỗi` → chụp gửi session |
| 14 | Sau **<4 tuần>**: dọn (TAY-7) | Turso: xoá DB **cũ** `pisatracking` (tên máy chủ `pisatracking-pizi147`) và mọi DB tạm `pisatracking-demo-thu-…`; **giữ** DB THỬ `pisatracking-demo` và mọi file sao lưu trên Drive | danh sách Turso còn: DB CHÍNH MỚI + DB THỬ | nhìn kỹ tên trước khi xoá; không chắc → hỏi session |

Đường lùi trong <4 tuần> đầu: §8 "Quay lại bản cũ" đưa web về **mã cũ + DB cũ**. Dữ liệu nhập vào DB mới sau reset **không** có ở DB cũ — chỉ dùng khi bản mới hỏng nặng.

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, dòng đỏ trên main, thời gian đo, lệch kế hoạch, cổng gộp) |
|---|---|---|
