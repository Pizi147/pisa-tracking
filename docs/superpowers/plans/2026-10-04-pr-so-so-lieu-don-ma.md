# PR-SO · Số liệu một nguồn & dọn mã máy chủ — Kế hoạch (04/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Số "PA cần ghi kết quả" khớp danh sách Công việc; luật quyền và lộ trình chỉ một nguồn; gỡ mã chết và mã chuyển dữ liệu cũ (DB cũ đã xoá).

**Architecture:** Chỉ máy chủ + `shared/domain`. Một hàm thuần chọn PA đại diện nhóm Bổ trợ dùng cho cả `metrics.ts` và `mywork.ts`. Luật cấm cấp riêng theo vai đưa vào `shared/domain/nhomQuyen.ts` (máy chủ chặn, web đọc cùng hàm để khoá ô). Xoá `completeIntervention` (không route nào gọi). Gỡ các nhánh chuyển dữ liệu cũ trong `migrate.ts` (chỉ chạy khi DB **không** có dấu `khoi_tao_moi_at`), các lệnh `chay-thu:*`, `kiem-lop-mo-coi`.

**Tech Stack:** Express + SQLite/Turso, TypeScript `tsc`, phép kiểm `server/src/tests/*.tests.ts`.

**Spec:** `plan.md` mục 3 (04/10: cấm `plan.week` cho người chỉ có vai GV; dọn `bulkclass:*`; DB cũ đã xoá) và mục 4 "PR-SO".

## Global Constraints
- Ponytail **full**. Không đổi số nào trên màn ngoài D2 (phép kiểm cũ phải xanh mà **không sửa**, trừ 4 phép của D4 ghi ở Task SO-3).
- Turso: không tham số đặt tên, `UNION` ≤ 20 vế, ≤ 900 tham số; đường đo ở `tocDoDuong.ts` không tăng số câu.
- DEP-gỡ **giữ**: dấu `khoi_tao_moi_at` (seed vẫn ghi), mọi bước tạo bảng/thêm cột (`CREATE … IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN` có kiểm cột), `migratePermissions`, mọi migrate của PR từ `prDeploy` trở đi (`prDeploy`, `prQu`, `prGva`, `prPhh` nếu đã merge).
- Phép kiểm mới `server/src/tests/prSo.tests.ts`, gọi ở **cuối** `run.ts`. Hàm mới ở `shared/domain/*` re-export qua `index.ts`.
- Chủ sản phẩm 04/10: chỉ deploy **một lần khi xong mọi PR** → không có bước deploy giữa chừng; DB THỬ không cần giữ tương thích.

## Review Focus
1. Nhóm Bổ trợ có PA id nhỏ **chưa** tới hạn và PA id lớn **quá hạn** → Tổng quan đếm 1 và Công việc hiện đúng dòng đó với nhãn quá hạn.
2. Nhóm Bổ trợ mà PA đại diện nằm ngoài phạm vi người xem (khác chi nhánh) → dòng khác của nhóm trong phạm vi vẫn hiện; số khớp.
3. Người có cả vai GV và vai Quản lý → vẫn cấp riêng `plan.week` được (chỉ cấm khi **mọi** vai đều cấm).
4. Sau DEP-gỡ: DB máy dev mới seed → `npm run migrate` hai lần, lần hai `applied` rỗng; DB `init-ban-chinh` tạm → như vậy.
5. Em đã kết thúc học (`finished`) có tín hiệu `withdrawn`, sửa điểm xuống dưới kỳ vọng → tín hiệu vẫn `withdrawn`.

---

### Task SO-1: D2 — một hàm chọn PA đại diện nhóm Bổ trợ

**Files:**
- Create: `shared/domain/daiDienBoTro.ts` (+ export ở `shared/domain/index.ts`)
- Modify: `server/src/worklist/metrics.ts:390-410` (bỏ subquery `MIN(i2.id)`), `server/src/worklist/mywork.ts:485-497` (bỏ `minNhom`)
- Test: `server/src/tests/prSo.tests.ts`

**Interfaces:**
- Produces: `daiDienNhomBoTro<T extends { id: number; kind: string; nhom_bo_tro: string | null; action_due: string | null }>(rows: readonly T[]): T[]` — giữ nguyên mọi dòng không thuộc nhóm; mỗi nhóm giữ **một** dòng: `action_due` sớm nhất (null xếp cuối), hoà thì `id` nhỏ nhất. Thứ tự đầu ra = thứ tự đầu vào.

- [x] **Step 1: Phép kiểm đỏ (thuần)** `SO-1a`: 3 dòng cùng nhóm `g1` (id 5 due 2026-09-20, id 6 due 2026-09-10, id 7 due null) + 1 dòng không nhóm → ra `[6, dòng lẻ]`; hai dòng cùng due → id nhỏ.
- [x] **Step 2: Phép kiểm đỏ (hành vi, DB test)** `SO-1b`: dựng một nhóm Bổ trợ 2 PA cùng em (đúng cách `boTro.ts` tạo nhóm), PA id nhỏ hạn ngày mai, PA id lớn quá hạn 3 ngày → `metricSet(QL, 'pa-qua-han'…)` (đọc tên chỉ số trong `metrics.ts` quanh :390) chứa id lớn, và `/my-work` của QL có dòng "Ghi kết quả PA" của id lớn, nhãn quá hạn; tổng đếm = số dòng.
- [x] **Step 3: Đỏ** → **Step 4: Viết hàm** + dùng ở cả hai nơi: SQL chỉ lọc điều kiện riêng của từng nơi, rồi gọi `daiDienNhomBoTro` **sau** khi lọc phạm vi/quyền (mywork: sau `f.branchId` và kiểm quyền; metrics: sau phạm vi chỉ số).
- [x] **Step 5:** `npm run check` xanh (phép cũ không sửa) → commit `"PR-SO (1): một hàm chọn PA đại diện nhóm Bổ trợ cho Tổng quan và Công việc (D2)"`.

### Task SO-2: Quyền — cấm cấp riêng `plan.week` cho người chỉ có vai GV; D5 cờ hồ sơ khớp route

**Files:**
- Modify: `shared/domain/nhomQuyen.ts:80-98`, `server/src/platform/accounts.ts:440-460`, khối cấp quyền riêng ở `web/src/modules/platform/AccountsAdmin.tsx` (ô tích)
- Modify (chỉ khi lệch): `server/src/classes/loTrinhTiep.ts:163-215` (`lopHocCua`)
- Test: `server/src/tests/prSo.tests.ts`

**Interfaces:**
- Produces: `lyDoCamCapRieng(roleKeys: readonly string[], quyen: string): string | null` — trả `CAM_CAP_VAI[vai].lyDo` khi `roleKeys` không rỗng và **mọi** vai đều cấm quyền đó; ngược lại null. `duocCapRieng` giữ nguyên.

- [x] **Step 1: Phép kiểm đỏ** `SO-2a` thuần: `lyDoCamCapRieng(['teacher'], 'plan.week')` có chữ `SCH-01`; `(['teacher','branch_manager'], 'plan.week')` → null; `([], 'plan.week')` → null.
- [x] **Step 2: Phép kiểm đỏ** `SO-2b`: admin lưu quyền riêng `plan.week` cho tài khoản demo chỉ có vai GV → 400, `user_permissions` không đổi; cho tài khoản QL → lưu được.
- [x] **Step 3: Phép kiểm đỏ** `SO-2c` (D5): với P.admin, P.mbManager, GVCN, GVBM trên một em đang học và một em `finished`: mỗi cờ `lopHocCua(...).quyen.{chuyenLop, tamDung, ketThuc, luuTru, ghiLoTrinhTiep}` = true **khi và chỉ khi** gọi hàm ghi tương ứng không ném lỗi quyền (gọi trong `tx` rồi rollback, hoặc `dryRun` nếu hàm có). Lệch thì sửa cờ gọi đúng hàm kiểm quyền của route.
- [x] **Step 4: Đỏ** → **Step 5: Sửa:** máy chủ đọc vai đang `active` của người được cấp (cùng bảng `user_roles` như `accounts.ts:161`), gọi `lyDoCamCapRieng` trong vòng kiểm trước khi xoá-ghi; câu lỗi = lý do. Web: ô tích `plan.week` của người chỉ có vai GV bị khoá, `title` = lý do (cùng hàm).
- [x] **Step 6:** `npm run check` → commit `"PR-SO (2): không cấp riêng quyền Kế hoạch tuần cho người chỉ có vai GV; cờ hồ sơ khớp quyền route (D5)"`.

### Task SO-3: D4 xoá `completeIntervention` + D3 + việc nhỏ máy chủ

**Files:**
- Modify: `server/src/cases/cases.ts:1059-1140` (xoá hàm + chú thích :412, :1134), `server/src/tests/dieuChinhPa.tests.ts:358-365`, `server/src/tests/prS3f.tests.ts:200-207`, `server/src/tests/run.ts:3703-3705`, `server/src/tests/sosV3.tests.ts:699`
- Modify: `server/src/students/profile.ts:781` (D3), `server/src/cases/signals.ts:87` (tín hiệu), `server/src/routes/index.ts:10` (gộp import), `server/src/classes/intake.ts:533,723` (dọn khoá)
- Test: `server/src/tests/prSo.tests.ts`

**Interfaces:**
- Produces: `donKhoaGuiCu(conn: any, now: string): void` trong `server/src/classes/intake.ts` — `DELETE FROM demo_config WHERE (key LIKE 'bulkclass:%' OR key LIKE 'intake:%') AND updated_at < ?` với mốc `now − 7 ngày`.

- [x] **Step 1: Phép kiểm đỏ** `SO-3a`: `cases.ts` không còn `export function completeIntervention`; `prS3f (8)` viết lại gọi `cases.updateResult(P.admin, iv.id, { outcome: 'improved', note: … })` với PA quy chế chưa tới mốc → phải ném lỗi như cũ (`/chưa tới mốc kết thúc/`). Nếu `updateResult` **không** chặn → đó là lỗ hổng thật: thêm chặn vào `updateResult`, ghi "tái hiện" trong mô tả PR.
- [x] **Step 2: Phép kiểm đỏ** `SO-3b`: em `finished`, tín hiệu `withdrawn`, gọi `raiseSignal` cùng khoá → vẫn `withdrawn`, `case_id` không đổi.
- [x] **Step 3: Phép kiểm đỏ** `SO-3c`: chèn `bulkclass:1:x` và `intake:1:2:y` với `updated_at` cũ 8 ngày + một khoá mới 1 ngày; tạo lớp hàng loạt một lần → hai khoá cũ mất, khoá mới còn; khoá `normal_pass_threshold`, `khoi_tao_moi_at` còn.
- [x] **Step 4: Đỏ** → **Step 5: Sửa:** xoá hàm; `dieuChinhPa` phép S2 xoá (hàm không còn, ghi lý do một dòng); `run.ts:3705` thay bằng cùng `UPDATE … status='completed'` như nhánh trên; `sosV3:699` bỏ dòng `completeIntervention` (dòng `updateResult` ngay dưới giữ). `raiseSignal`: em `finished` + `withdrawn` → trả `existing`. `donKhoaGuiCu` gọi ngay trước hai câu `INSERT OR REPLACE` khoá gửi. D3: `profile.ts:781` thay `allCycles.find(active)` bằng `loTrinhTinhTuan(allCycles, { dangHoc: true, ngayVao: today })` nếu cho cùng kết quả trên mọi phép cũ; câu SQL `cy.status = 'active'` ở `transition.ts`, `luatLoTrinh.ts` **giữ** (đúng nhánh `dangHoc`, đã chú thích ở `cycles.ts:36-41`). Gộp import `transferReasonText` vào khối import shared đầu `routes/index.ts`.
- [x] **Step 6:** `npm run check` → commit `"PR-SO (3): xoá completeIntervention, tín hiệu em đã kết thúc không mở lại, dọn khoá gửi cũ, D3"`.

### Task SO-4: DEP-gỡ — gỡ mã chuyển dữ liệu cũ

**Files:**
- Modify: `server/src/migrate.ts` (các nhánh `dbMoi ? … : <chuyển dữ liệu cũ>` :258, :392-393, :426-427, :443-449, :479-488, :511-512, :1366-1460, :1643-1715, :1850+, `legacyEra` :41 và nơi gọi), `server/src/migrate/{prN1,prLop,prDuyet,prMon}.ts` (tham số `dbMoi`)
- Delete: `server/src/migrate/chayThu{N1,Lop,Duyet,Mt,Mon}.ts`, `server/src/ops/kiemLopMoCoi.ts`; `package.json` scripts `chay-thu:*`, `kiem-lop-mo-coi`
- Modify: `TRIEN_KHAI.md` §11.1 (bỏ khối "Lịch sử"), `CODE_MAP.md`
- Test: `server/src/tests/prSo.tests.ts`, phép kiểm cũ nhắc tới các file đã xoá

- [x] **Step 1: Kê danh sách trước khi xoá 🛑** — liệt kê mọi hàm/nhánh định gỡ vào mô tả PR (bảng: tên · dòng · vì sao là chuyển dữ liệu cũ · chạy trên DB mới không). Chỉ gỡ thứ **không chạy trên DB có `khoi_tao_moi_at`** hoặc chỉ dùng cho DB trước PR-J (`legacyEra`). Không chắc → giữ, ghi "giữ" + lý do.
- [x] **Step 2: Phép kiểm đỏ** `SO-4a`: `package.json` không còn `chay-thu:` và `kiem-lop-mo-coi`; `server/src/migrate/` không còn `chayThu*.ts`. `SO-4b`: DB tạm dựng bằng đúng đường `init-ban-chinh` dùng trong `prDeploy.tests.ts` → `migrate()` hai lần, lần hai `applied` rỗng, đếm dòng mọi bảng không đổi.
- [x] **Step 3: Đỏ** → **Step 4: Gỡ** theo danh sách Step 1; bỏ biến `dbMoi` khi không còn nơi đọc (seed vẫn ghi dấu). Sửa/xoá phép kiểm chỉ kiểm mã đã gỡ (ghi từng phép vào mô tả PR).
- [x] **Step 5:** `npm run check` xanh; `npm run seed` rồi `npm run migrate` hai lần trên máy dev → lần hai không in bước nào. Phép `DEPLOY-5b` (mọi `npm run` trong tài liệu có trong `package.json`) xanh.
- [x] **Step 6:** commit `"PR-SO (4): gỡ mã chuyển dữ liệu cũ, chay-thu, kiem-lop-mo-coi (DB cũ đã xoá)"`.

### Task SO-5: Hoàn tất
- [x] `/ponytail-review` · `/security-review` trên diff (chạm quyền) · `CODE_MAP.md` · một dòng `plan.md` mục 11.
- [ ] `superpowers:requesting-code-review` → `superpowers:finishing-a-development-branch` (mở PR, không merge). Mô tả PR: từng ID (D2, D3, D4, D5, plan.week, bulkclass, tín hiệu, DEP-gỡ) tái hiện/bác bỏ, file, phép kiểm.
- [ ] Thứ tự merge đợt 2: sau PHH (merge `origin/main` vào nhánh, giữ `migratePrPhh`, chạy lại check), trước DH.

## Đã kiểm 04/10 — KHÔNG làm (bác bỏ, ghi vào mô tả PR)
- An toàn 12.15/12.16: giới hạn thử `/auth/login` và `/auth/register` (`platform/gioiHanThu.ts`, `routes/index.ts:2046`), lỗi 409/500 không lộ SQL (`app.ts:140-157`), `/api/health` rẻ + không lộ (`platform/suKhoe.ts`) — đã làm ở PR-AN.
- 12.18 đếm bằng chứng theo lô — đã làm (AN-8, `cases.ts:2707` `soBangChung`).
- `canRecordViolation` dùng `activeClassOf` — đã làm (K2-6e, `profile.ts:964-978`).
- `confirmMeasure` / `recentByStudent` — mã đã thay ở Ý thức v4, không còn.
- `ratioOfCycle` trùng `isRatioCycle` (`systemClose.ts:19`) — giữ (tránh vòng import, lệch an toàn).

## Tự quyết (chủ sản phẩm đổi được khi đọc PR)
- T1: Dọn cả khoá `intake:*` cũ hơn 7 ngày (cùng vấn đề với `bulkclass:*`, cùng một câu).
- T2: PA đại diện nhóm = PA hạn sớm nhất (gấp nhất), không phải id nhỏ nhất — để Tổng quan và Công việc cùng nói "quá hạn".
- T3: Cấm theo vai chỉ khi **mọi** vai của người đó đều cấm.
