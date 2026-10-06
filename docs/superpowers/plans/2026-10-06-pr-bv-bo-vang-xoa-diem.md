# PR-BV · Xoá "-" trả lại như cũ + đường lui điểm (bản 2) — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Mockup bản 2 ĐÃ DUYỆT 06/10.**
>
> **Chủ sản phẩm chốt 06/10 (bản 2 — thay hẳn bản 1):** bản 1 (nút "Bỏ vắng", kho khôi phục `diem_da_xoa`, xoá hàng loạt, màn xem
> trước) **không duyệt vì quá phức tạp**. Làm gọn:
> - **Vắng:** gõ `-` = vắng, **xoá `-` = hết vắng**. Không nút mới. Xoá `-` (kể cả đã chốt) thì máy chủ **tự trả lại như trước khi gõ**.
> - **Ai xoá `-`:** người được nhập ô đó (GV chấm, **GVCN**) trong **khung chấm** (tuần thi → hết thứ Tư tuần sau); QL / Quản trị mọi lúc.
> - **Điểm:** tẩy ô + Lưu = xoá (đã có, MTa T22). **Không** kho khôi phục, **không** xoá hàng loạt. Nhầm thì nhập lại; điểm cũ xem ở Lịch sử.
>   Xoá điểm đóng Case rồi nhập lại → **mở lại đúng Case đó** (không tạo Case mới, không mất PA).
>
> **Chạy sau PR-MTa (đã merge #212) VÀ PR-MTb** (chung `HopThaoTacMt.tsx`, `MockDetailPage.tsx`, `HopKyNang.tsx`, `ScoreEntry.tsx`,
> `thaoTacMt.ts`). **Task 0 = đối chiếu lại mã** trên `origin/main` lúc bắt đầu. Code chỉ sau khi chủ sản phẩm duyệt mockup
> `thiet-ke/mockup-bo-vang-xoa-diem-2026-10-06.html` (bản 2).

**Goal:** Xoá dấu `-` đã chốt trả đúng trạng thái trước khi gõ (lịch, số lần vắng, đề nghị dời chưa xử lý, kỹ năng huỷ do vắng lần 2);
nhập lại điểm sau khi xoá mở lại đúng Case mà lần xoá đã đóng; Lịch sử ô lớp thường hiện điểm cũ; bài lớp thường xoá điểm về "chưa xong".

**Architecture:** Không thêm route, không thêm bảng. Sửa **đường ghi `-` sẵn có**: `saveScore` (FT, nhánh `noShow:false`) gọi hàm nội bộ
mới `goVangDaChot` ở `absence.ts` khi dấu đã chốt; `reportRegularNoShow` (lớp thường) sửa nhánh gỡ dấu. Một hàm kiểm quyền gỡ dấu
dùng chung (`duocGoDau`). Mở lại Case: `retireCaseForCorrectedScore` đánh dấu Case đóng **do xoá điểm**; `upsertCategoryCase` gặp đúng
Case đó (cùng lượt, cùng kỹ năng) thì mở lại thay vì tạo Case mới. Web gần như không đổi: ô FT đã chốt **vẫn hiện `-`** để xoá được.

**Tech Stack:** TypeScript (`tsc`, import có đuôi `.ts`), Express + SQLite/Turso, React; phép kiểm `server/src/tests/prBv.tests.ts` gọi ở
**cuối** `run.ts`; `npm run check`.

**Nguồn:** tin planning 06/10 (chủ sản phẩm chốt bản 2) · `plan.md` mục 4 "PR-BV", mục 2c (T7, T19–T23) ·
`docs/superpowers/specs/2026-10-06-ra-soat-duong-lui.md` A2, A3 #2–#4, #8–#9 · kế hoạch MTa Task 12–13 (**không làm lại** T19–T23).

## Global Constraints
- **Không** nút mới, **không** route mới, **không** bảng mới, **không** migrate. Chữ mới chỉ ở toast và nhật ký.
- Quyền xoá `-`: `PLAN_WEEK` theo lớp (QL / Quản trị) **mọi lúc**; người khác phải (a) được nhập ô đó (`scoreEditPath(...) !== null`) **hoặc**
  là GVCN lớp đó, **và** (b) `today <= skillScoreDeadline(mode, tuần thi GỐC)` (thứ Tư sau tuần thi gốc). Sai → 403 `Quá hạn chấm — nhờ Quản lý.`
- Mỗi rủi ro (1)–(5) của chủ sản phẩm có **một phép kiểm đỏ trước** (bảng Task 4–5).
- Không thu hồi chuông đã gửi, không gửi chuông mới khi xoá `-`. Nhật ký ghi đủ ai / lúc nào / cũ → mới.
- Quyết định của người (duyệt, từ chối, Khôi phục và đặt tuần, Không mock lại, Xếp lại bài vắng) **không bị đảo**.
- Chữ trên màn đúng mockup bản 2, ngắn; tuần dùng mã `W2 OCT`, ngày giờ chỉ ở nhật ký.
- Turso: không tham số đặt tên; ≤ 900 tham số. Phép kiểm cũ chỉ sửa khi khẳng định luật bị thay — ghi `// PR-BV thay <mã cũ>`.
- Ponytail `full` Task 0–5; `/ponytail lite` trước Task 6 (web).

## Review Focus
1. Xoá `-` của bài **đã tự dời** → tuần gốc, lần vắng −1; gõ `-` lại → vẫn **vắng lần 1** (không thành "huỷ vắng 2 lần" oan). (V1, V2)
2. Thẻ Chờ duyệt **đã** duyệt / từ chối → quyết định giữ nguyên, thẻ có thêm "vắng đã gỡ". (V5)
3. Xoá điểm (Case đóng) → nhập lại điểm vẫn trượt → **cùng `sos_cases.id`** mở lại, PA bị huỷ lúc xoá trở lại "đã lên kế hoạch". (C1)
4. GVBM / GVCN quá thứ Tư sau tuần thi gốc xoá `-` → 403, không đổi gì. (V7)

---

## Interfaces
```ts
// server/src/fasttrack/absence.ts (MỚI, nội bộ — không route)
/** Quyền gỡ dấu "-" (FT + lớp thường). null = được; chuỗi = câu lỗi 403. */
export function duocGoDau(p: Principal, o: { classId: number; skill: string; mode: ScoringMode; tuanGocStart: string; today: string }): string | null;
/** Gỡ "-" ĐÃ CHỐT của FT: trả như trước khi gõ. Gọi trong tx của saveScore. */
export function goVangDaChot(p: Principal, attemptId: number, skill: string, today: string):
  { tuanVe: string | null; lanVang: number; giuLich: boolean };   // giuLich = có quyết định của người → lịch giữ
// server/src/cases/signals.ts
//   retireCaseForCorrectedScore(..., huy = true) đặt thêm sos_cases.system_close_reason = 'xoa_diem'
// server/src/cases/sos.ts
//   upsertCategoryCase: existing.status='done' && system_close_reason='xoa_diem' && Case nối tín hiệu đã rút của CÙNG (attempt, skill)
//   → moCaseXoaDiem(existing) thay cho INSERT Case mới
```
Dữ liệu đọc đổi: ô FT đã chốt (`attempts.ts` ~355-375) trả `noShow.state = 'da-chot'` (mới) kèm `doiSang: 'W3 SEP' | null` và
`editableUntil` = hạn gỡ của người xem (`null` = QL). Toast web dùng `tuanVe` / `giuLich` trả về từ `PUT /attempts/:id/scores/:skill`.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `superpowers:subagent-driven-development`; ponytail `full` |
| Mỗi task | `superpowers:test-driven-development` (đỏ trên DB test trước) · `superpowers:verification-before-completion` (`npm run check`, một lần một lúc) |
| Lỗi lạ | `superpowers:systematic-debugging` |
| Task 6 (web) | `/ponytail lite` · `/impeccable clarify` (chữ toast) · `/impeccable adapt` (375) |
| Trước mở PR | `/impeccable audit` (ô `-`, toast) · `/ponytail-review` · `superpowers:requesting-code-review` · `superpowers:finishing-a-development-branch` (mở PR vào `main`, **không merge**) |

---

### Task 0: Đối chiếu mã (không sửa mã)
Số dòng đo trên `ec6d7afe`; mã đổi thì tìm theo tên hàm, ghi số dòng mới vào mô tả PR.
- [x] `git log --oneline origin/main -20`: **MTb đã merge?** Chưa → **dừng, báo planning**. Đọc diff MTb ở các file trong "File chồng".
- [x] Xác nhận (grep), ghi vào mô tả PR:
  1. `saveScore` nhánh noShow (`server/src/fasttrack/attempts.ts:1546-1612`): ghi `no_show_period_id` = tuần gốc; gỡ dấu (`:1600-1611`) chỉ xoá cột `no_show_*`; nhập điểm xoá dấu (`:1718-1728`).
  2. `settleNoShows` / `settleGroup` / `xuLyVangMotKyNang` / `applyMove` / `insertRequest` / `huyVangNoi` / `xinDoi` / `rutDeNghiDoi`
     (`server/src/fasttrack/absence.ts:108, 251-451, 322-370, 737-845`). Dấu `-` của Writing nằm ở `writing1`, `writing2` hay cả hai?
  3. Hiển thị ô đã chốt (`attempts.ts:355-375`): sau tự dời trả `state:'none'` + `NO_SHOW_OVERRIDDEN_NOTE` → ô **không** còn `-`.
  4. `reportRegularNoShow` (`server/src/normal/regular.ts:591-739`): chặn gỡ khi đã có điểm (`:636-640`); "lần vắng" = đếm audit `regular.no_show` (`:699-700`).
  5. `scoreHistoryOf` (`attempts.ts:825-874`) chỉ đọc `entity_type='assessment_attempt'` + `score.*` → audit `regular.score(.override)`
     (`entityType 'assessment_score'`, `regular.ts:562-565`) **không** hiện ở Lịch sử lớp thường (`NganLichSuBai.tsx`).
  6. Case: `gomTinHieu` → `retireCaseForCorrectedScore` (`server/src/cases/signals.ts:287-336, 344-378`) đóng Case + huỷ PA `planned`
     (`closed_reason='score_fixed'`); `upsertCategoryCase` (`server/src/cases/sos.ts:152-215`) gặp Case `done` → **tạo Case mới** nối
     `previous_case_id`. Lớp thường (Case Giữa khoá) có đi qua `upsertCategoryCase` không? Không → ghi đường thật, Task 3 sửa ở đó.
  7. `MockDetailPage.tsx:436-438`, `HopKyNang.tsx:151` có truyền `huyVang` vào `trangThaiTT` chưa (MTb)?
  8. `sos_cases.system_close_reason` có sẵn (grep `schema.sql`)? Không có → Task 3 dùng `outcome_note` tiền tố cố định thay vì thêm cột (không migrate).
- [x] Lệch lớn so với kế hoạch → **dừng, báo planning**.

### Task 1: Bài lớp thường xoá điểm vẫn "đã xong"
**Files:** `server/src/normal/regular.ts:752-756` · Test `server/src/tests/prBv.tests.ts` (tạo) + `server/src/tests/run.ts` (gọi cuối)
- [x] **Đỏ:** R1 bài Giữa khoá đủ môn (`done`) → xoá một môn → `status` phải `planned`; R2 nhập lại đủ → `done`; bài `cancelled` không đổi.
- [x] **Xanh** (đúng mẫu FT `attempts.ts:1406-1410`):
```ts
const next = r.complete ? 'done' : 'planned';
if (a.status !== 'cancelled' && a.status !== next) conn.prepare('UPDATE assessment_attempts SET status = ? WHERE id = ?').run(next, attemptId);
```
- [x] Grep nơi đếm bài lớp thường theo `status` (`server/src/normal`, `phanTich`, `cham`) → ghi vào mô tả PR số nào có thể đổi.
- [x] `npm run check` xanh; commit `fix(bv): bài lớp thường xoá điểm thì về chưa xong`.

### Task 2: Lịch sử ô lớp thường hiện điểm cũ
**Files:** `server/src/fasttrack/attempts.ts` `scoreHistoryOf` · Test `prBv.tests.ts`
- [x] **Đỏ (thử thật qua hàm đọc của màn):** S1 lớp thường nhập Nghe 16/20 → sửa 15/20 → xoá (tẩy ô) → `attemptDetail(...).scoreHistory`
  (đúng dữ liệu `NganLichSuBai` đọc ở `/attempts/:id`) có 3 dòng skill `listening`: `— → 16/20`, `16/20 → 15/20`, `15/20 → Trống`, kèm người và giờ.
  S2 dấu `-` lớp thường (`regular.no_show`, `regular.no_show_cleared`) hiện kind `no_show`. S3 FT không đổi (phép kiểm cũ xanh).
- [x] **Xanh:** `scoreHistoryOf` đọc thêm `(entity_type='assessment_score' AND entity_id IN (id dòng điểm của lượt) AND action IN ('regular.score','regular.score.override'))`
  và `regular.no_show*` của lượt; chuẩn hoá `before/after` ra chữ như FT (`16/20`, `Trống`). Giữ điều kiện `created_at >= a.created_at` (PR-XOA).
- [x] `npm run check` xanh; commit `fix(bv): Lịch sử ô lớp thường hiện điểm cũ`.

### Task 3: Nhập lại điểm sau khi xoá → mở lại đúng Case
**Files:** `server/src/cases/signals.ts` (`retireCaseForCorrectedScore`), `server/src/cases/sos.ts` (`upsertCategoryCase`), đường tạo Case lớp thường nếu khác (Task 0 mục 6) · Test `prBv.tests.ts`
- [x] **Đỏ:**
  - C1 FT: MT2 L trượt → Case `open` + PA `planned` → xoá L (tẩy ô) → Case `done`, PA `cancelled` → nhập lại L vẫn trượt → **cùng id
    Case**, `status` về giá trị trước khi đóng (đọc `sos_case_history` dòng `status → done` mới nhất), `closed_*`/`outcome_note` về NULL,
    `dedup_key` lấy lại, PA bị huỷ lúc đó về `planned`; không có Case mới `previous_case_id = id cũ`; `sos_case_history` thêm dòng `done → open`;
    audit `case.mo_lai_xoa_diem`.
  - C2 nhập lại **đạt** → Case giữ đóng (không mở lại, không tạo mới).
  - C3 Case đóng vì **sửa thành đạt** (không phải xoá) rồi sửa lại trượt → hành vi cũ (Case mới nối Case cũ).
  - C4 Case đóng do xoá L của **MT2**, sau đó **MT3** L trượt → hành vi cũ (Case mới) — chỉ mở lại khi cùng lượt + cùng kỹ năng.
  - C5 lớp thường: như C1 với bài Giữa khoá.
  - C6 PA đã bắt đầu / đã xong lúc xoá (không bị huỷ) → giữ nguyên khi mở lại.
- [x] **Xanh:** `retireCaseForCorrectedScore(..., huy=true)` đặt `system_close_reason='xoa_diem'` (Task 0 mục 8) và ghi `closed_reason='score_cleared'`
  cho PA bị huỷ (sửa thành đạt giữ `'score_fixed'`). `upsertCategoryCase`: trước nhánh `existing.status === 'done'`, nếu
  `existing.system_close_reason === 'xoa_diem'` và có `case_signals` `withdrawn` (`SIGNAL_WITHDRAW_SCORE_FIXED`) của Case đó với **cùng
  `attempt_id` + `skill`** → mở lại (UPDATE như C1, PA `score_cleared` → `planned`) và trả `{ id: existing.id, kind: 'reopened' }`
  (thêm `'reopened'` vào `MilestoneKind` nếu nơi gọi cần; mốc ghi "Mở lại — nhập lại điểm"). Tín hiệu mới gắn vào Case cũ như nhánh Case mở.
- [x] `npm run check` xanh; commit `feat(bv): nhập lại điểm sau khi xoá thì mở lại đúng Case`.

### Task 4: Xoá `-` đã chốt — Mock (máy chủ)
**Files:** `server/src/fasttrack/absence.ts` (`duocGoDau`, `goVangDaChot`), `attempts.ts` (nhánh `noShow:false`; hiển thị ô `:355-375`), `server/src/duyet/yeuCau.ts` (ghi chú thẻ) · Test `prBv.tests.ts`

Trạng thái sau một lần chốt (dòng dấu: `no_show_settled_at` khác NULL, `no_show_cu = 0`) và việc `goVangDaChot` làm:

| Sau chốt (máy làm, chưa ai quyết) | Xoá `-` |
|---|---|
| **Tự dời** (vắng lần 1): `scheduled` ở tuần gốc+1 | về tuần gốc, lần vắng −1 |
| **Vắng chờ duyệt** (lần 1 trễ / vướng thứ tự đợt): `absent` + đề nghị `pending` | về `scheduled` tuần gốc, đề nghị `withdrawn`, thẻ chốt `tu_dong` |
| **Huỷ vắng 2 lần** (T3): `cancelled` + `huy_vang=1`, có / không thẻ Xin dời `pending` | về `scheduled` tuần gốc, `huy_vang=0`, thẻ Xin dời rút |
| **Đã có quyết định của người** sau lần chốt (duyệt / từ chối thẻ, Khôi phục và đặt tuần, Không mock lại, Xếp lại bài vắng) | **giữ** lịch + trạng thái; chỉ gỡ dấu, lần vắng −1 nếu lần chốt đó đã được cộng; thẻ thêm ghi chú `vắng đã gỡ` |

"Lần chốt đã được cộng" = có dòng `attempt_schedule_history` `skill_week_moved_absence` của kỹ năng đó **sau** `no_show_settled_at`.

- [x] **Đỏ** (mỗi rủi ro một phép kiểm):

| ID | Tình huống | Phải ra |
|---|---|---|
| V1 | QL gõ `-` L MT2 tuần trước → chốt ngay, tự dời W+1, đếm 1 → QL xoá `-` | L ở tuần gốc, đếm 0, `scheduled`, ô hết `-`; nhập L 6.5 ngay → 200 |
| V2 | sau V1 gõ `-` lại | vẫn **vắng lần 1** (tự dời, đếm 1), không "huỷ vắng 2 lần" |
| V3 | vắng chờ duyệt → xoá `-` | đề nghị `withdrawn`, thẻ `yeu_cau_duyet` chốt `tu_dong`, mất khỏi Chờ duyệt |
| V4 | huỷ vắng 2 lần + thẻ Xin dời `pending` → xoá `-` | `scheduled` tuần gốc, `huy_vang=0`, thẻ rút, đếm giữ 1 |
| V5 **(2)** | thẻ **đã duyệt** (đã dời, đếm +1) / **đã từ chối** (Không mock lại) → xoá `-` | lịch + trạng thái giữ; duyệt: đếm −1; thẻ giữ quyết định, `ghi_chu` thêm `vắng đã gỡ`; không đổi `status` thẻ |
| V6 **(1)** | tự dời rồi nhập điểm ở tuần mới (dấu tự xoá khi nhập điểm, `attempts.ts:1718`) | lịch tuần mới + đếm 1 **giữ** (em vắng thật rồi thi bù) — phép kiểm canh, không có `-` để xoá |
| V7 | GVBM L / GVCN: ≤ thứ Tư sau tuần gốc → 200; thứ Năm → 403 `Quá hạn chấm — nhờ Quản lý.`, không đổi gì; GVBM kỹ năng khác → 403; QL 3 tuần sau → 200 | |
| V8 **(3)** | xoá `-` sau tự dời | `notifications` không thêm dòng; chuông `tu_doi_lich` cũ còn nguyên |
| V9 **(4)** | nhật ký | `attempt_schedule_history` `skill_absence_undone` (cũ → mới mã tuần, người); audit `score.no_show_cleared` before/after `{week, moveCount, sitStatus, huyVang}` |
| V10 **(5)** | MT cũ: `-` (`no_show_cu=1`) → xoá | chỉ gỡ dấu (như nay); không đụng lịch / đếm |
| V11 | `-` chưa chốt (trong tuần thi) → xoá | như nay (không đổi lịch) |
| V12 | Writing `-` chốt → xoá | gỡ dấu đúng dòng (Task 0 mục 2), trả như V1 |

- [x] **Xanh:** trong `saveScore` nhánh `noShow:false`: dòng dấu đã chốt và `!no_show_cu` → `duocGoDau` (403 nếu sai) → `goVangDaChot` (UPDATE
  `attempt_skills` theo bảng trên; xoá cột `no_show_*`; `rutDeNghiDoi` mở rộng cho thẻ Xin dời; `logSchedule` + `writeAudit`;
  `recomputeCompletionWeek`; `refreshOutcome`; **không** `tinhLaiMtCu`, **không** `notify`). Ghi chú thẻ đã quyết: cột ghi chú sẵn có của
  `yeu_cau_duyet` (Task 0 tìm tên cột; không có thì ghi vào nhật ký của thẻ).
- [x] **Hiển thị:** ô đã chốt (`attempts.ts:355-375`) trả `state:'da-chot'` khi dòng dấu còn (thay cho `'none'` sau tự dời), `doiSang` = mã tuần
  hiện tại nếu khác tuần gốc, `editableUntil` theo `duocGoDau` của người xem. Bỏ `NO_SHOW_OVERRIDDEN_NOTE` khi không còn dùng.
- [x] `npm run check` xanh; commit `feat(bv): xoá "-" đã chốt trả lại lịch, số lần vắng, đề nghị dời (Mock)`.

### Task 5: Xoá `-` — lớp thường
**Files:** `server/src/normal/regular.ts` (`reportRegularNoShow` gỡ dấu `:720-737`, chặn `:636-640`, đếm `:699-700`) · Test `prBv.tests.ts`
- [x] **Đỏ:** L1 `-` Nghe → dời tuần sau; xoá `-` → tuần cũ **và** lần `-` kế tiếp vẫn là lần 1 (không chuông `sos` "lần 2" oan).
  L2 **(1)** tuần mới đã có điểm → xoá `-` (ở ô tuần cũ) → 200: dấu gỡ, lần vắng −1, **lịch giữ tuần có điểm** (nay: 400 "không gỡ được").
  L3 khung chấm: GVBM / GVCN ≤ thứ Tư sau tuần gốc → 200, sau → 403; QL mọi lúc → 200. L4 nhật ký `regular.no_show_cleared` có `giuLich`.
- [x] **Xanh:** lần vắng = số audit `regular.no_show` − số audit `regular.no_show_cleared` của (lượt, môn); bỏ chặn `:639` cho gỡ dấu (giữ chặn
  **ghi** `-` lên ô có điểm); có điểm → không `setSkillWeek`; dùng `duocGoDau`.
- [x] `npm run check` xanh; commit `feat(bv): lớp thường — xoá "-" trả đúng số lần vắng, giữ lịch khi tuần mới đã có điểm`.

### Task 6: Web (`/ponytail lite`)
**Files:** `web/src/modules/fasttrack/ScoreEntry.tsx`, `web/src/modules/cham/LuoiFT.tsx`, `LuoiThuong.tsx`, `MockDetailPage.tsx`, `web/src/modules/test/keHoach/HopKyNang.tsx`
- [x] Ô FT `state:'da-chot'`: hiện `-` như ô vắng hiện nay, thêm chữ nhỏ `→ W3 SEP` khi `doiSang`; xoá được khi `editableUntil` cho phép
  (tẩy ô + Lưu / Delete như ô `-` chưa chốt); hết hạn: ô khoá như ô hoàn tất. Gõ số vào ô vẫn như cũ (điểm thắng `-`, T19 chặn khi tuần mới chưa tới).
- [x] Toast sau khi xoá `-` (dùng `toast` sẵn có): `Đã gỡ vắng Listening · Lê Hà Vy · về W2 SEP` · khi `giuLich`: `Đã gỡ vắng Nghe · Vũ Gia Bảo · giữ W3 SEP`.
  403: toast lỗi `Quá hạn chấm — nhờ Quản lý.`
- [x] Lớp thường xem tuần cũ: ô `-` vẫn xoá được khi tuần mới đã có điểm (Task 5 L2).
- [x] Truyền `huyVang` vào `trangThaiTT` ở `MockDetailPage` / `HopKyNang` nếu MTb chưa sửa (Task 0 mục 7).
- [x] Ảnh 375/1440, sáng/tối: QL, GVBM trong khung, GVBM quá hạn, GVCN; lớp thường. `npm run check` xanh; commit `feat(bv): ô "-" đã chốt hiện và xoá được; toast gỡ vắng`.

### Task 7: Tài liệu + khép PR
- [x] Rulebook §20: 3 dòng (xoá `-` = hết vắng, trả lại như cũ trừ quyết định của người; khung gỡ `-`; nhập lại điểm mở lại Case do xoá).
- [x] `CODE_MAP.md` (`tests/prBv.tests.ts`); `plan.md` mục 11 một dòng; `[x]` các task; ảnh sổ tay lệch ghi vào mô tả PR.
- [x] `npm run check` xanh → `/impeccable audit` → `/ponytail-review` → `requesting-code-review` → `finishing-a-development-branch` (PR vào `main`, **không merge**).

## Nghiệm thu
1. GV gõ `-` nhầm cho bài tuần trước → bài tự dời, "vắng lần 1". Trước hết thứ Tư, GV (hoặc QL bất cứ lúc nào) xoá `-` → bài về tuần cũ,
   không còn vắng, nhập điểm được ngay; lần vắng thật sau đó vẫn là lần 1.
2. Bài "vắng · chờ Quản lý duyệt dời" / "huỷ (vắng 2 lần)": xoá `-` → thẻ chưa xử lý biến khỏi Chờ duyệt; thẻ đã xử lý giữ, có "vắng đã gỡ".
3. Lớp thường: xoá `-` trả tuần cũ; nếu tuần mới đã có điểm thì chỉ trừ lần vắng.
4. Tẩy điểm L (Case đóng) rồi nhập lại vẫn trượt → Case cũ mở lại, PA cũ còn.
5. Ngăn Lịch sử ô lớp thường thấy `16/20 → Trống`. Bài lớp thường xoá một môn → "Chờ điểm".
6. Không nút mới. `npm run check` xanh; ảnh 375/1440 sáng/tối ≥ 3 vai.

## Prompt cho session code (dán nguyên khối)
```
Repo pisa-tracking. Chỉ bắt đầu khi: chủ sản phẩm đã duyệt mockup thiet-ke/mockup-bo-vang-xoa-diem-2026-10-06.html (bản 2),
PR-MTa (#212) VÀ PR-MTb đã merge vào main.
Nhánh pr-bv-xoa-vang từ origin/main mới nhất (worktree .claude/worktrees/pr-bv-xoa-vang).
Model: Opus 5.5 · High (thay thế: Sonnet 5.5 · High). Không dùng Fable, kể cả subagent.
Đọc CLAUDE.md, plan.md mục 1 và mục 4 "PR-BV", rồi làm đúng docs/superpowers/plans/2026-10-06-pr-bv-bo-vang-xoa-diem.md (bản 2),
Task 0 → 7 theo thứ tự. Task 0 là đối chiếu mã: lệch lớn hoặc MTb chưa merge thì DỪNG, báo planning.
Ponytail full cho Task 0–5; /ponytail lite trước Task 6 (web).
superpowers:subagent-driven-development; mỗi task test-driven-development (đỏ trên DB test trước, file
server/src/tests/prBv.tests.ts gọi ở cuối run.ts), verification-before-completion (npm run check, một lần một lúc).
KHÔNG thêm nút, route, bảng, migrate. Không đảo quyết định của người; không chuông mới khi xoá "-".
Web: /impeccable clarify (toast), adapt (375); trước mở PR /impeccable audit. Cuối: /ponytail-review, requesting-code-review,
finishing-a-development-branch (mở PR vào main, KHÔNG merge). Mô tả PR: từng mục (xoá "-" FT, lớp thường, mở lại Case, Lịch sử
lớp thường, lỗi regular.ts), phép kiểm V1–V12 / L1–L4 / C1–C6 / S1–S3 / R1–R2, ảnh 375/1440 sáng/tối, chú thích ponytail:.
```

## Tự quyết (planning, 06/10, bản 2)
| # | Tự quyết | Vì sao |
|---|---|---|
| G1 | Rủi ro (1) ở FT không xảy ra: nhập điểm ở tuần mới đã tự xoá `-` (`attempts.ts:1718`) → lịch + lần vắng giữ (em vắng thật, thi bù). Chỉ lớp thường còn `-` cạnh điểm → Task 5 L2 | Đúng mã hiện có; một phép kiểm canh V6 |
| G2 | "Đã có quyết định của người" sau lần chốt → giữ lịch + trạng thái, chỉ gỡ dấu + trừ lần vắng nếu đã cộng | Rủi ro (2) "không đảo quyết định" áp cho mọi quyết định, không chỉ thẻ |
| G3 | Ô FT đã chốt **vẫn hiện `-`** (kèm `→ W3 SEP` nếu đã dời) tới khi có điểm | Không có `-` thì không "xoá `-`" được — điều kiện của luật chủ sản phẩm |
| G4 | Khung gỡ dấu tính theo **tuần thi gốc** (tuần có `-`) | Tuần mới là tuần của lần dời, không phải tuần em vắng |
| G5 | Mở lại Case chỉ khi Case đóng **do xoá điểm** và điểm nhập lại cùng **lượt + kỹ năng**; sửa thành đạt / lượt khác giữ luật cũ (Case mới) | Đúng "mở lại Case mà lần xoá đó đóng"; không đè kết luận thật của người |
| G6 | Không mở lại Case đóng do MTa T2 (dời vượt, `ket_qua_huy`) | Ngoài phạm vi; MTa G9 đã chốt |
| G7 | Không `tinhLaiMtCu` khi trả lịch | Trả về đúng lịch đã có, không phải xếp mới |

## Câu hỏi cho chủ sản phẩm — ĐÃ TRẢ LỜI 06/10
- **Q1 — Lịch sử ô ở lưới Mock Test (FT):** lưới FT không có ⋯ từng ô; điểm cũ hiện xem ở **hồ sơ Mock › Lịch sử** (bấm tên em). (A) Giữ
  như vậy. (B) Thêm mục "Lịch sử" khi bấm vào ô (thêm giao diện). **Chủ sản phẩm chọn A (06/10).**

## Migrate
Không. (Task 0 mục 8: nếu thiếu cột `system_close_reason` thì dùng tiền tố `outcome_note`, vẫn không migrate.)

## File chồng với PR khác
| PR | File chung | Cách gộp |
|---|---|---|
| PR-MTb (merge trước BV) | `ScoreEntry.tsx`, `MockDetailPage.tsx`, `HopKyNang.tsx`, `thaoTacMt.ts` | BV dựng trên bản MTb |
| PR-MT0 | `absence.ts`, `attempts.ts` | MT0 vào luồng vắng thì luật xoá `-` tự áp; thêm một phép kiểm |
| PR-LT3 | `canCham.ts` (ô lưới khối 1) | BV chỉ đổi trạng thái ô `-` đã chốt |
| PR-LUI-a | `cases/signals.ts`, `cases/sos.ts`, `duyet/yeuCau.ts` | Khác hàm; ai sau rebase, giữ cả hai |
