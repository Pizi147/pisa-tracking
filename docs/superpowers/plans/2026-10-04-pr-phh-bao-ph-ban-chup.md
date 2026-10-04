# PR-PHH · Báo phụ huynh lưu bản chụp nội dung — Kế hoạch (04/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Việc "Báo phụ huynh qua TVV" đã đánh dấu xong luôn hiện **đúng 4 nội dung lúc bấm xác nhận**, không đổi theo điểm/Case/PA sửa sau đó.

**Architecture:** Thêm một cột `noi_dung_luc_bao TEXT` (JSON mảng 4 chuỗi) vào `sos_coordination_actions`. `confirmCoordination` tính nội dung bằng **cùng** hàm `turnsOf` đang dùng để hiển thị, rồi ghi vào cột trong cùng giao dịch. Khi đọc: việc `done` có cột → trả bản đã lưu; việc `done` không có cột (xác nhận trước PR này) → trả nội dung hiện tại kèm cờ `noiDungLaHienTai: true`; việc `pending` → nội dung hiện tại như hôm nay. Không có đường "mở lại" việc đã xong (`confirmCoordination`/`removeCoordination` chỉ nhận `pending`), nên **không cần quy tắc phiên bản**: một việc chỉ có tối đa một bản chụp.

**Tech Stack:** Express + SQLite/Turso (`server/`), React + Tailwind (`web/`), phép kiểm `server/src/tests/*.tests.ts` qua `run.ts`.

**Spec:** `plan.md` mục 3 (F02, 03/10) và mục 4 "PR-PHH".

## Global Constraints
- Không điền ngược: dòng `done` cũ giữ `noi_dung_luc_bao = NULL`.
- Câu cho dòng cũ, đúng nguyên văn: `Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại`.
- Migrate riêng `server/src/migrate/prPhh.ts`, chỉ thêm cột, chạy lặp được; gọi trong `migrate.ts` ngay sau `migratePrGva`. `schema.sql` thêm cột cùng PR.
- Turso: không tham số đặt tên; ghi trong `tx()` đang có.
- Phép kiểm mới `server/src/tests/prPhh.tests.ts`, gọi ở **cuối** `run.ts`. `/ponytail lite` (có sửa giao diện nhỏ).
- Không đổi luật `monTinhBaoPh` (vẫn dùng cho việc `pending` và dòng cũ).

## Review Focus
1. Xác nhận rồi QL duyệt "Không cần theo dõi" một môn → bản chụp vẫn còn môn đó.
2. Xác nhận rồi sửa điểm (môn hết trượt) → bản chụp không đổi; việc `pending` khác của em vẫn tính lại.
3. Việc không phải `bao_ph_tvv` (6 loại khác) → cột luôn NULL, `noiDung` vẫn null như hôm nay.
4. Chạy `npm run migrate` hai lần → lần hai không đổi gì.
5. Lượt bị huỷ cả lượt sau khi đã xác nhận → việc `done` giữ bản chụp (lượt huỷ chỉ bỏ việc `pending`, `attempts.ts:1266`).

---

### Task PHH-1: Cột + migrate + ghi bản chụp lúc xác nhận

**Files:**
- Create: `server/src/migrate/prPhh.ts`
- Modify: `server/src/schema.sql:1762-1778` (bảng `sos_coordination_actions`), `server/src/migrate.ts:28,500`
- Modify: `server/src/yThuc/phoiHop.ts` (`turnsOf` :232-307, `shapeAction` :216-229, `confirmCoordination` :443-464)
- Test: `server/src/tests/prPhh.tests.ts`, `server/src/tests/run.ts` (cuối file)

**Interfaces:**
- Produces: `migratePrPhh(conn: any, applied: string[]): void` (mẫu `migratePrGva`).
- Produces: `CoordinationAction` thêm `noiDungLaHienTai: boolean` (true chỉ khi `kind = 'bao_ph_tvv'`, `status = 'done'`, cột NULL).
- Produces: hàm nội bộ `noiDungHienTai(p: Principal, actionId: number): string[] | null` — dựng `turnsOf` cho đúng một dòng và trả `noiDung` của việc đó.

- [ ] **Step 1: Viết phép kiểm đỏ** `prPhh.tests.ts` (kit `YThucTestKit`), dựng dữ liệu bằng một bài Giữa khoá lớp thường có trong demo (`kind = 'progress'`) và `dongBoBaoPh(attempt, [mon])`:
  - `PHH-1a` migrate: `pragma_table_info('sos_coordination_actions')` có `noi_dung_luc_bao`; gọi `migratePrPhh` lần hai → `applied` rỗng.
  - `PHH-1b` xác nhận việc `bao_ph_tvv` (GVCN, `performedOn = TODAY`) → cột là JSON 4 chuỗi, `JSON.parse(cột)` bằng `noiDung` đọc ngay trước khi xác nhận.
  - `PHH-1c` sau xác nhận: đóng Case của môn đó bằng "Không cần theo dõi" (`dismiss_reason_code`) và sửa `sos_cases.summary` (nguyên nhân) → `coordinationOfStudent(...).rows[..].actions[..].noiDung` vẫn bằng bản lúc xác nhận; `noiDungLaHienTai === false`.
  - `PHH-1d` việc `done` có cột NULL (UPDATE tay trong phép kiểm) → `noiDungLaHienTai === true`, `noiDung` = nội dung hiện tại.
  - `PHH-1e` xác nhận việc loại khác (`talk_family`) → cột NULL, `noiDung === null`, `noiDungLaHienTai === false`.
- [ ] **Step 2: Chạy, thấy đỏ** — `npm test 2>&1 | grep -A3 "PHH-1"` → FAIL (thiếu cột / thiếu trường).
- [ ] **Step 3: Thêm cột + `migratePrPhh`** (chỉ `ALTER TABLE … ADD COLUMN noi_dung_luc_bao TEXT` khi chưa có), `schema.sql` thêm cột có chú thích một dòng.
- [ ] **Step 4: Ghi bản chụp** — trong `confirmCoordination`, khi `r.kind === 'bao_ph_tvv'`: gọi `noiDungHienTai` **trước** `UPDATE` (với `daLamNgay = input.performedOn` để môn tính đúng như sau khi xong), ghi `JSON.stringify` vào cột trong cùng `tx`; thêm `noiDungLuu: true` vào `after` của audit.
- [ ] **Step 5: Đọc bản chụp** — trong `turnsOf` dòng :301-302: `done` + cột có → `JSON.parse(cột)`; `done` + NULL → hàm hiện tại + `noiDungLaHienTai: true`; còn lại như cũ. JSON hỏng → coi như NULL (không làm sập trang).
- [ ] **Step 6: Chạy** `npm run check` → xanh.
- [ ] **Step 7: Commit** — `git commit -m "PR-PHH (1): lưu 4 nội dung Báo PH lúc xác nhận, đọc lại bản đã lưu"`.

### Task PHH-2: Web — "đã báo" và dòng cũ

**Files:**
- Modify: `web/src/modules/yThuc/PhoiHopSosSection.tsx:23` (kiểu), `:150-157` (khối `<details>`)
- Test: `server/src/tests/prPhh.tests.ts` (quét nguồn)

**Interfaces:**
- Consumes: `noiDungLaHienTai` từ PHH-1.

Skill: `/impeccable clarify` cho hai câu dưới, rồi `/impeccable audit` khối này.

- [ ] **Step 1: Phép kiểm đỏ (quét nguồn)** `PHH-2`: `PhoiHopSosSection.tsx` chứa đúng câu `Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại` và đọc `noiDungLaHienTai`.
- [ ] **Step 2: Đỏ** → **Step 3: Sửa:** tiêu đề `<summary>`: việc `done` → `Nội dung đã báo TVV (4)`; `pending` → giữ `Nội dung gửi TVV (4)`. `noiDungLaHienTai` → dòng chữ nhỏ (tone phụ có sẵn, không màu mới) ngay dưới `<summary>` với câu trên. Không đổi bố cục dòng.
- [ ] **Step 4:** `npm run check`; `npm run seed && npm run dev`; ảnh 1440/375 sáng/tối của hồ sơ HV lớp thường › Ý thức & Phối hợp: việc chờ, việc đã xong có bản chụp, việc đã xong dòng cũ (UPDATE tay trên DB máy dev). Vai GVCN, QL, GVBM.
- [ ] **Step 5: Commit** — `git commit -m "PR-PHH (2): web hiện nội dung đã báo, ghi rõ dòng chưa lưu bản chụp"`.

### Task PHH-3: Hoàn tất
- [ ] `/impeccable audit` (khối Phối hợp) · `/ponytail-review` · `CODE_MAP.md` (thêm `migrate/prPhh.ts`, `tests/prPhh.tests.ts`) · một dòng `plan.md` mục 11.
- [ ] `superpowers:requesting-code-review` → `superpowers:finishing-a-development-branch` (mở PR vào main, không merge). Mô tả PR: F02 tái hiện (trước/sau), migrate, ảnh, chú thích `ponytail:`.

## Nghiệm thu
1. Việc Báo PH xác nhận xong: sửa điểm / nguyên nhân / đóng Case / thay PA → 4 nội dung không đổi.
2. Việc xác nhận trước PR: hiện câu "Chưa lưu nội dung lúc báo…" + nội dung hiện tại; không có dòng nào bị điền ngược.
3. `npm run migrate` hai lần không đổi dòng nào; `npm run check` xanh.

## Tự quyết (chủ sản phẩm đổi được khi đọc PR)
- T1: Không làm "quy tắc phiên bản" — hệ thống không có đường mở lại việc đã xong; nếu sau này thêm "Huỷ xác nhận" thì xoá cột cùng lúc.
- T2: Bản chụp chỉ cho `bao_ph_tvv` (loại duy nhất có `noiDung`).
- T3: Môn tính trong bản chụp theo ngày thực hiện (`performedOn`), cùng luật `monTinhBaoPh` đang dùng cho việc đã làm.
