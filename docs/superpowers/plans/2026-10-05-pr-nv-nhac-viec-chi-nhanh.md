# PR-NV · Nhắc việc nhanh, chi nhánh mặc định, "Nợ tuần trước" thu gọn — Kế hoạch (05/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (T8) "Để QL biết" thành **Nhắc việc**, không còn số nổi ở đầu Tổng quan, "Nhắc tất cả" 50 thẻ xong dưới 10 giây (hết 502), nhắc một người nhanh hơn. (T9) Chi nhánh mặc định theo người xem, không ép vào MB, ở **mọi** màn có ô chi nhánh. "Nợ tuần trước" ở Lịch Test thu gọn mặc định.

**Architecture:** Máy chủ: `worklist/nhacViec.ts` có một lõi `nhacViecNhieu` — đọc "đã nhắc hôm nay" **một câu**, gom việc theo người được nhắc, dựng `myWork` **một lần mỗi người** trong `trongBoNho` (POST hiện không có bộ nhớ nên mỗi lần dựng chạy lại cả quét thẻ), ghi chuông + nhật ký bằng **một** câu INSERT nhiều dòng trong một `tx`, dừng sớm khi sắp hết 10 giây của Netlify. `nhacViec` (một dòng) và `nhacNhieu` (thẻ) đều đi qua lõi này, giữ nguyên mọi kiểm quyền. Chi nhánh: hàm thuần `chiNhanhMacDinh` ở `shared/domain/chiNhanhMacDinh.ts`; máy chủ tính gợi ý (vai Quản lý → lớp mình dạy) đưa vào phiên và dùng ở `hocVienLop.ts:74`; web đọc "lần chọn trước" (localStorage, try/catch) qua `useChiNhanhMacDinh()` ở `web/src/ui/Filters.tsx`, mọi màn dùng `cn` trên URL ?? mặc định.

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso libsql đồng bộ (server/), phép kiểm `server/src/tests/*.tests.ts` qua `run.ts`; `npm run check` = build + test + typecheck.

**Spec:** `docs/superpowers/specs/2026-10-05-test-mock-test-design.md` (T8, T9, mục 2 "Nợ tuần trước") · `plan.md` mục 2c (T8, T9, T13) · nguồn gốc `D:\Download\Pisa tracking web\PISA-tracking-test-mocktest-review-final.md` mục 2, 3, 4.8.

**Phụ thuộc / thứ tự:** chạy **sau khi DL, K26, SL merge** (đợt 4, cùng lúc PR-MTa và PR-CHU). Nhánh `pr-nv-nhac-viec-chi-nhanh` từ `origin/main` mới nhất. Không có migrate.

## Chủ sản phẩm chốt 05/10 (sau khi soạn) — ĐÈ lên phần dưới nếu khác
- Q1: tab "Nhắc việc" **giữ số xám nhỏ** trên tab (không số nổi đầu trang).
- Q2: Quản trị không vai Quản lý, không dạy lớp → **"Tất cả"** ở màn có lựa chọn đó; Học viên & Lớp lấy chi nhánh đầu.
- Q3: **không đổi** chữ "Báo QL" (là loại thẻ GV báo lên); chỉ đổi tên tab "Để QL biết" → "Nhắc việc".
- Lỗi khoá `mini_test:` / `cuoi_khoa:` (Nhắc ra 404): sửa trong NV-1 như kế hoạch.
- Chữ trên màn ngắn.

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại. Giữ Be Vietnam Pro (chữ số Inter), bảng màu, bố cục. Thời gian trên màn: mã tuần.
- **Chữ ngắn** (chủ sản phẩm 05/10): nhãn 1–3 từ, **không thêm câu giải thích** dưới nút/ô; việc của PR này là **bớt** câu giải thích, không thêm.
- **Không nới quyền.** Mọi kiểm hiện có của `nhacViec` giữ nguyên thứ tự ý nghĩa: `CASE_APPROVE` anyScope → không tự nhắc mình → người được nhắc thuộc chi nhánh trong phạm vi → dòng việc còn trong `myWork` của **chính** người đó → `can(ATTEMPT_VIEW, { classId, studentId })` của **từng dòng**. `nhacNhieu`: kiểm `P_DUYET` theo **từng thẻ** (`ctxThe`) như hôm nay.
- Không mất dữ liệu / không gửi lặp: một chuông mỗi (người, việc, ngày) — khoá `nhac:{key}:{ngày}` không đổi; khoá URL `?xem=de-biet` và mã nhóm `'de-biet'` **không đổi** (link cũ, chuông cũ vẫn mở đúng tab) — chỉ đổi **chữ**.
- Turso: không tham số đặt tên, ≤ 900 tham số mỗi câu (`theoLo`), `UNION` ≤ 20 vế, `tx()` cho mọi ghi nhiều câu. Netlify cắt hàm sau **10 s** (`platform/hanGio.ts:11`, `tx()` từ chối mở khi còn < 2,5 s).
- localStorage: mọi đọc/ghi bọc `try/catch`, hỏng thì chạy như chưa nhớ gì. Một khoá chung cho mọi màn: `pisa.chiNhanh` (giá trị: id chi nhánh hoặc `tat-ca`).
- Hàm mới ở `shared/domain/*` re-export qua `shared/domain/index.ts`. File kiểm mới `server/src/tests/prNv.tests.ts`, import và gọi ở **cuối** `server/src/tests/run.ts` (ngay trước khối in tổng kết), cùng kiểu `runPrU12Tests`.
- File mới → `CODE_MAP.md` cùng commit (`shared/domain/chiNhanhMacDinh.ts`, `server/src/tests/prNv.tests.ts`). Xong: `[x]` ở đây, một dòng mục 11 `plan.md`, mở PR (không merge), liệt kê mọi chú thích `ponytail:`.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `superpowers:subagent-driven-development` · gõ `/ponytail lite` (PR có sửa giao diện) |
| Mỗi task | `superpowers:test-driven-development` (kiểm **đỏ trên DB test trước**) · lỗi lạ → `superpowers:systematic-debugging` |
| NV-3 (tên Nhắc việc, bỏ số nổi) | `/impeccable clarify` (chỉ chữ: tab, ô trống, dòng thẻ, chuông) |
| Trước khi báo xong mỗi task | `superpowers:verification-before-completion` · `npm run check` **một lần một lúc, foreground** |
| Cuối PR | `/impeccable audit` · `/ponytail-review` · `superpowers:requesting-code-review` · `superpowers:finishing-a-development-branch` (mở PR, không merge) |

Model đề xuất: **Opus 5.5 · High** (phương án B: Sonnet 5.5 · High). Lý do: đường ghi có kiểm quyền từng dòng + tối ưu SQL đo bằng số; sai là nhắc nhầm người hoặc lộ việc ngoài phạm vi.

## Review Focus
1. **Nhắc nhiều người trong một lần** (thẻ của 5 GV khác nhau): mỗi chuông về đúng người, đúng dòng; bộ nhớ dùng chung trong `trongBoNho` không được làm `myWork` của GV B lẫn dữ liệu của GV A — các khoá `nho()` phụ thuộc người phải có `userId` (đã rà: `worklist/danhGia.ts:99` có; các khoá khác theo id dữ liệu). Phép kiểm NV-1 so kết quả gom với gọi lẻ.
2. **Hết giờ giữa chừng** (Turso chậm, 50 thẻ): không 502, không ghi nửa vời; thẻ chưa kịp → lỗi riêng mã 503 "Chưa kịp nhắc — bấm lại", thẻ đã xử lý vẫn ghi. Phép kiểm NV-1 giả hạn giờ bằng `chayVoiHan`.
3. **Thẻ có khoá việc không khớp `myWork`**: `mini_test:{id}` (`normal/cuoiKhoa.ts:449`) trong khi `myWork` dùng `minitest:{id}` (`worklist/mywork.ts:853`); `cuoi_khoa:{id}` (`normal/cuoiKhoa.ts:572`) không có dòng nào trong `myWork` → hôm nay bấm Nhắc **luôn 404**. Phép kiểm NV-1 tái hiện rồi sửa.
4. **Chi nhánh đã nhớ không còn hợp lệ** (bị gỡ vai, chi nhánh ngừng): không 403 cả trang, không trang rỗng khó hiểu — bỏ giá trị nhớ, dùng luật kế. Phép kiểm NV-4 (máy chủ bỏ `cnNho` ngoài phạm vi) + bấm thử NV-5.
5. **GV dạy hai chi nhánh** (ô chi nhánh hiện vì `branchCount > 1`): không bị tự lọc mất nửa số lớp khi chưa từng chọn — luật 2–3 chỉ cho Quản lý/Quản trị (tự quyết 1). Phép kiểm NV-4.

---

### Task NV-1: "Nhắc tất cả" không 502, nhắc một người nhanh hơn (máy chủ)
Skill: test-driven-development

**Gốc chậm (đọc mã, chưa đo — bước 2 đo thật):** `duyet/yeuCau.ts:476` `nhacNhieu` lặp **từng thẻ**: `docThe` (1 câu) + đọc đã nhắc (1 câu) + `nhacViec` (`worklist/nhacViec.ts:19`) = `loadPrincipal` + kiểm chi nhánh + **`myWork(target)` cả trang Công việc** + đọc đã nhắc + `notify` + `writeAudit` + đọc lại `created_at`. Request POST **không có bộ nhớ** (`platform/nguCanhRequest.ts:28`: chỉ GET), nên mỗi `myWork` chạy lại từ đầu cả `quetYeuCau` (`mywork.ts:281`, quét mọi loại thẻ), `sweepExpiredMoves` + `settleNoShows` (`mywork.ts:449-450`), `bangLop`, `allProgrammes`, hai lần `listAttempts`, ~25 câu trực tiếp và ~10 hàm con. Ước tính **~100 câu/thẻ** (khớp 3–5 s × 20–50 ms/câu chủ sản phẩm thấy khi nhắc một người) → 50 thẻ ≈ 5 000 câu ≈ 100–250 s → Netlify cắt ở 10 s → **502**.

**Files:**
- Modify: `server/src/worklist/nhacViec.ts` (viết lại thân, giữ chữ lỗi cũ)
- Modify: `server/src/duyet/yeuCau.ts:472-499` (chỉ thân `nhacNhieu`)
- Modify: `server/src/normal/cuoiKhoa.ts:449` (khoá `minitest:`)
- Create: `server/src/tests/prNv.tests.ts`; Modify: cuối `server/src/tests/run.ts`

**Interfaces:**
- Produces (`worklist/nhacViec.ts`):
```ts
export type ViecCanNhac = { the: number | null; key: string; ownerId: number };   // the = id thẻ (Nhắc tất cả) | null (nút Nhắc một dòng)
export type KetQuaNhac = {
  ok: { the: number | null; key: string; daNhacLuc: string; moi: boolean }[];
  loi: { the: number | null; key: string; loi: string; ma: number }[];
};
export function nhacViecNhieu(p: Principal, ds: readonly ViecCanNhac[], o: { boQuaDaNhacTruoc: boolean }): KetQuaNhac;
export function nhacViec(p: Principal, i: { key: string; ownerId: number }): { daNhacLuc: string };   // chữ ký cũ, ném HttpError như cũ
```
- `yeuCau.nhacNhieu(p, ids)` giữ chữ ký và hình dạng trả về `{ ok: { id, daNhacLuc, moi }[], loi: { id, loi, ma }[] }` (web `HopChoDuyet.tsx:118` không đổi).

**Luật lõi `nhacViecNhieu` (thứ tự là yêu cầu, không phải gợi ý):**
1. `can(p, CASE_APPROVE, { anyScope: true })` sai → ném 403 cả lô (như cũ). Việc có `ownerId === p.userId` → lỗi 403 "Không tự nhắc chính mình." (đơn lẻ: ném **trước** mọi tra khoá — phép kiểm `congViec.tests.ts:577` giữ xanh).
2. Mọi phần đọc chạy trong `trongBoNho(() => …)`.
3. Một câu đọc đã nhắc hôm nay: mẫu `mywork.ts:1188-1195` (`kind = 'nhac_viec' AND dedup_key LIKE 'nhac:%:{ngày}'`), tra theo `(user_id, dedup_key)`.
4. `boQuaDaNhacTruoc = true` (chỉ `nhacNhieu`, vì khoá/ownerId lấy từ thẻ máy chủ đã kiểm phạm vi thẻ): việc đã nhắc hôm nay → `ok` với `moi: false`, **không** dựng `myWork`. `false` (nút một dòng, khoá do web gửi): giữ thứ tự cũ — kiểm dòng xong mới trả "đã nhắc" (không cho dò khoá ngoài phạm vi qua giờ đã nhắc).
5. Gom việc còn lại theo `ownerId` (giữ thứ tự xuất hiện). Mỗi người: kiểm giờ — `conLaiMs() !== null && conLaiMs() < 4000` → mọi việc chưa xử lý thành lỗi `{ ma: 503, loi: 'Chưa kịp nhắc — bấm lại.' }`, thoát vòng; kiểm nhanh chi nhánh (`nhacViec.ts:24-39`, nguyên văn, lỗi cho **mọi** việc của người đó); `loadPrincipal(ownerId)`; `myWork(target)` **một lần**; `Map` khoá → dòng.
6. Từng việc: chuẩn hoá khoá cũ `mini_test:` → `minitest:` (thẻ đã có trong DB trước PR); không có dòng → 404 `Việc này không còn trong danh sách của {tên}.`; `can(p, ATTEMPT_VIEW, { classId: row.classId, studentId: row.studentId })` sai → 403 (câu cũ); `boQuaDaNhacTruoc = false` và đã nhắc → `ok moi:false` giờ cũ.
7. Ghi: nếu có việc cần gửi → **một** `tx()`: một câu `INSERT INTO notifications … VALUES (…),(…) ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body` (cột, `kind = 'nhac_viec'`, `entity_type = 'nhac_viec'`, tiêu đề, thân `catThanBao`, `duong = row.href` đúng như `nhacViec.ts:55-61`) và **một** câu `INSERT INTO audit_logs …` nhiều dòng (`action = 'work.remind'`, như `nhacViec.ts:62`); chia lô bằng `theoLo` theo số cột (≤ 900 tham số). `created_at` = **một** `nowIso()` lấy trước câu ghi, trả làm `daNhacLuc` (không đọc lại). `// ponytail: hai QL nhắc cùng việc cùng giây → daNhacLuc trả về lệch vài ms so với dòng đã có; đọc lại bằng RETURNING nếu cần chính xác`.

**Thẻ "Cuối khoá dời quá hạn"** (`cuoi_khoa:{attemptId}`, không có dòng `myWork`): `nhacNhieu` không gọi lõi cho loại `bao_len_cuoi_khoa`; tự kiểm người nhận **còn là GVCN đang hiệu lực** của lớp thẻ (một câu `teacher_assignments … is_core = 1 AND status = 'active'` cho mọi thẻ loại này, theo lô), rồi đưa vào bước 7 với tiêu đề `{meta.nhan} · {học viên} · {p.fullName} nhắc`, `duong` = đường "Mở" của thẻ (`theRa` → `mo`). Không còn là GVCN → 404 "Việc này không còn…".

**`nhacNhieu` (thân mới, `yeuCau.ts:476`):** `require_` + kiểm mảng như cũ → `trongBoNho`: `quetYeuCau(homNay)` (thẻ chết tự đóng trước khi đọc), **một** câu `SELECT * FROM yeu_cau_duyet WHERE id IN (…)`, `napTruocPhamVi(hoc_vien_id…)`, từng thẻ giữ đủ kiểm cũ (404 không tìm thấy · `require_(P_DUYET, ctxThe)` 403 · không `cho` 400 · không `kieuNut 'nhac'` 400 · thiếu ownerId/viecKey 400 `nhanKhongNguoiNhac`) → `nhacViecNhieu(p, …, { boQuaDaNhacTruoc: true })` → đổi `the` về `id`.

- [ ] **Step 1: Viết kiểm đỏ** trong `prNv.tests.ts` (`export async function runPrNvTests(k: YThucTestKit & { soCauSql: () => number })`), dùng `conn`, `P` của `run.ts`:
  - `NV-1 (a) nhắc thẻ Mini Test chưa đạt không 404`: tạo/tìm thẻ `bao_len_mini_test` có ownerId → `nhacNhieu(P.mbManager,[id]).ok.length === 1`, chuông có `dedup_key = 'nhac:minitest:{id}:{ngày}'`.
  - `NV-1 (b) nhắc thẻ Cuối khoá dời quá hạn tới đúng GVCN`; đổi GVCN lớp (UPDATE trên DB test) → lỗi 404.
  - `NV-1 (c) gom = gọi lẻ`: thẻ của ≥ 2 người (seed thiếu thì lùi `sos_cases.han_xac_nhan` của Case đang chờ nguyên nhân về trước hôm nay rồi `quetYeuCau`) — xoá chuông `nhac:%` hôm nay, nhắc cả lô; xoá lại, nhắc từng thẻ; cùng tập `(user_id, dedup_key, title, duong)`.
  - `NV-1 (d) số câu không tăng theo số thẻ của cùng một người`: `dem(1 thẻ) === dem(m thẻ)` (± 0) với m ≥ 2; `dem(thẻ của 2 người) ≤ 2 × dem(1 người)`. Đo bằng `soCauSql()` trước/sau (mẫu `prHvl.tests.ts:214`). In số đo ra log (`console.log('NV-1 số câu', …)`).
  - `NV-1 (e) nhắc lần hai trong ngày`: 0 chuông mới, mọi `ok.moi === false`, và **không** gọi `myWork` (số câu ≤ 6).
  - `NV-1 (f) hết giờ`: `chayVoiHan(Date.now() + 3000, () => yc.nhacNhieu(…))` → mọi thẻ lỗi `ma 503`, không chuông nào được ghi.
  - `NV-1 (g) quyền không nới`: QL MB nhắc thẻ chi nhánh khác → 403; GV → 403; khoá bịa qua `nhacViec` → 404; nhắc chính mình → 403 trước khi tra khoá.
- [ ] **Step 2: Chạy** `npm test` — mong đợi (a), (b), (d), (e), (f) ĐỎ; ghi số câu đo được (1 thẻ, m thẻ, 2 người) vào chú thích đầu `prNv.tests.ts` làm **số gốc**.
- [ ] **Step 3: Viết** `nhacViecNhieu`, `nhacViec` (gọi lõi một việc, ném lỗi đầu tiên thành `HttpError(ma)` giữ đúng câu cũ), thân `nhacNhieu`, sửa khoá ở `cuoiKhoa.ts:449`.
- [ ] **Step 4: Chạy** `npm test` — mọi kiểm NV-1 và kiểm cũ `prGvb (3)`, `congViec` Q5, `prDuyet:316-342`, `prCt:881`, `prYt4:739` xanh **không sửa**.
- [ ] **Step 5: Thêm trần tuyệt đối** vào (d): 50 thẻ (hoặc hết thẻ seed) của ≥ 5 người ≤ **200 câu** (≈ 7 s ở 35 ms/câu — còn ≥ 2,5 s cho `tx`). Đạt → bỏ qua NV-2 (đánh dấu "không cần", ghi số đo vào mô tả PR). Không đạt → làm NV-2.
- [ ] **Step 6: Commit** `PR-NV (1): Nhắc tất cả gom theo người, một lần ghi, dừng trước 10 s; sửa khoá Mini Test / Cuối khoá`.

### Task NV-2 (chỉ khi NV-1 Step 5 chưa đạt): `myWork` chỉ dựng nhóm cần
Skill: test-driven-development

**Files:** `server/src/worklist/mywork.ts:275` (tuỳ chọn mới), `server/src/worklist/nhacViec.ts`.

**Interfaces:** `myWork(p, f: { branchId?; nguoi?; chiNhom?: ReadonlySet<WorkGroupKey> })` — không truyền `chiNhom` thì **y hệt** hôm nay. Có `chiNhom` → bỏ qua phần dựng nhóm không có trong tập (bọc từng khối `// ---- n.` bằng `if (co('…'))`; `listAttempts` ở dòng 298/425 chỉ gọi khi có nhóm nhập điểm). Lõi NV-1 truyền tập nhóm suy từ tiền tố khoá: `score|week|target|lich-su|moc → missing_data/score`, `cause|xnpa → cause/xac_nhan_pa`, `yt_xu_ly|yt_xem|yt_thuc_hien`, `ban_giao|ban_giao_mon`, `minitest → mini_test`, … (một bảng hằng trong `nhacViec.ts`, tiền tố lạ → không lọc).

- [ ] Kiểm đỏ: với mỗi GV trong seed, `myWork(gv, { chiNhom: G })` trả **đúng** các dòng của `myWork(gv)` có `group ∈ G` (so khoá + tiêu đề); trần (d) của NV-1 đạt.
- [ ] Sửa, chạy `npm test`, mọi kiểm `congViec`, `tongQuan`, `prS6fB` xanh không sửa. Commit `PR-NV (2): myWork chỉ dựng nhóm cần khi nhắc`.

### Task NV-3: Tên "Nhắc việc", bỏ số nổi đầu Tổng quan
Skill: test-driven-development · `/impeccable clarify`

**Hiện trạng đã kiểm:** badge mục Công việc (`App.tsx:41`), số "chờ duyệt" ở lớp (`classes/dongHocVien.ts:136`), dải hồ sơ HV (`DauHoSo.tsx:289`, `/yeu-cau?studentId=` mặc định `xem=cho`) **đã** chỉ đếm thẻ phải quyết. Chỗ còn "nổi": dải Chờ duyệt đầu **Tổng quan QL** (`KhoiCanXuLy.tsx:117` vẫn hiện khi chỉ có thẻ Để QL biết, thành "0 chờ duyệt" + chip "Để QL biết n") và chip `de-biet` của `chipChoDuyet` (`shared/domain/yeuCauDuyet.ts:230`).

**Files:**
- `shared/domain/yeuCauDuyet.ts:223-231` (`chipChoDuyet` bỏ chip `de-biet`; sửa chú thích 85, 96, 157-159, 214 sang "Nhắc việc")
- `web/src/modules/worklist/KhoiCanXuLy.tsx:117` (`if (!d?.cho) return null`; bỏ nhánh tone `de-biet` dòng 127)
- `web/src/modules/duyet/HopChoDuyet.tsx:151` (nhãn tab **"Nhắc việc"**; số theo Câu hỏi 1), `:164-175` (bỏ câu "Không cần duyệt — để bạn biết và nhắc giáo viên."; nút giữ "Nhắc tất cả (n)"), `:191` ô trống **"Không có việc cần nhắc"**, chú thích 34-36, 43, 56, 87
- `server/src/duyet/loaiYeuCau.ts:300, 410, 482, 593, 612` — bỏ câu "Không cần duyệt — để QL biết và nhắc." (dòng 482 giữ phần "{n} em chưa được xác nhận bàn giao (hạn hết …)."; 593 giữ câu Mini Test)
- Theo Câu hỏi 3: `shared/domain/yeuCauDuyet.ts:13` (`'bao-len': 'Báo QL'`) và `server/src/duyet/yeuCau.ts:110` (chuông `Báo QL · …`)
- `thiet-ke/TU_DIEN_VA_CHU.md` — thêm một dòng: "Để QL biết → **Nhắc việc**"
- `server/src/tests/prGvb.tests.ts:137` — kiểm cũ GVb (6) khẳng định chip `de-biet`: **luật đã đổi** (T8) → sửa thành khẳng định không có chip đó, ghi trong mô tả PR

- [ ] **Step 1: Kiểm đỏ** (`prNv.tests.ts`): `NV-3 chipChoDuyet không còn chip Nhắc việc` (`d.chipChoDuyet({ …, cho: 0, deBiet: 3 })` rỗng; có `cho` thì không có khoá `de-biet`); `NV-3 dem.cho chỉ thẻ phải quyết` (`demYeuCau(P.mbManager).cho === hopChoDuyet(P.mbManager).dem['tat-ca']` và không đổi khi thêm một thẻ `bao_len_*`); `NV-3 dòng thẻ Nhắc việc không còn câu "để QL biết"` (mọi thẻ `xem: 'de-biet'` có `dong` không chứa `để QL biết`).
- [ ] **Step 2:** `npm test` → đỏ. **Step 3:** sửa các file trên; `/impeccable clarify` chỉ trên chữ tab, nút, ô trống, dòng thẻ, chuông (không thêm câu). **Step 4:** `npm test` xanh.
- [ ] **Step 5: Commit** `PR-NV (3): Để QL biết → Nhắc việc; Tổng quan không hiện dải khi không có việc phải quyết`.

### Task NV-4: Luật chi nhánh mặc định (thuần + máy chủ)
Skill: test-driven-development

**Files:**
- Create: `shared/domain/chiNhanhMacDinh.ts`; Modify: `shared/domain/index.ts`
- Modify: `server/src/classes/hocVienLop.ts:49-75` (+ hàm `goiYChiNhanh`), `server/src/routes/index.ts:1089-1094` (đọc `cnNho`), `:144-176` (phiên thêm `chiNhanhGoiY`), `web/src/lib/session.tsx` (kiểu phiên)

**Interfaces:**
```ts
// shared/domain/chiNhanhMacDinh.ts
export type DauVaoChiNhanh = {
  daChon: number | 'tat-ca' | null;   // lần chọn trước (web) — nơi gọi chỉ truyền giá trị còn hợp lệ
  quanLy: readonly number[];           // chi nhánh người xem có vai 'manager' (grant có branchId, không tính grant toàn hệ thống)
  lopDay: readonly number[];           // chi nhánh của MỖI lớp đang dạy / chủ nhiệm (có lặp — đếm số lớp)
  cuoi: number | null;                 // luật 4: null = "Tất cả" (theo Câu hỏi 2), hoặc chi nhánh đầu
};
export function chiNhanhMacDinh(i: DauVaoChiNhanh): number | null;
// server/src/classes/hocVienLop.ts
export function goiYChiNhanh(p: Principal, homNay: string): number | null;   // chỉ Quản lý/Quản trị (laVaiQuanLy); còn lại null
```
Luật `chiNhanhMacDinh`: (1) `daChon === 'tat-ca'` → `null`; số → số đó. (2) `quanLy` có một → nó; nhiều → chi nhánh trong `quanLy` có nhiều lớp ở `lopDay` nhất, hoà → id nhỏ nhất. (3) `lopDay` khác rỗng → chi nhánh xuất hiện nhiều nhất, hoà → id nhỏ nhất. (4) `cuoi`.
`goiYChiNhanh`: `quanLy` từ `p.grants` (`roleKey === 'manager' && branchId !== null`), `lopDay` từ `p.assignments` đang hiệu lực (`effectiveFrom ≤ homNay ≤ effectiveTo|null`, mẫu `hocVienLop.ts:55`) → `bangLop().get(classId)?.branchId`; gọi `chiNhanhMacDinh({ daChon: null, quanLy, lopDay, cuoi: null })`.
`danhSachHocVienLop`: tham số mới `cnNho?: number | null`; dòng 74 thành: `f.branchId` hợp lệ → nó; không thì `cnNho` thuộc `duocXemChiNhanh` → nó; không thì `goiYChiNhanh(p)` thuộc `duocXemChiNhanh` → nó; không thì `duocXemChiNhanh[0]` (màn này không có "Tất cả" trong ô chi nhánh — "Tất cả" là Phạm vi riêng). `cnNho` **không** làm đổi Phạm vi (khác `branchId`, dòng 69).
Phiên `/demo/session`: thêm `chiNhanhGoiY: goiYChiNhanh(p, demoToday())`. Không thêm câu SQL ngoài `bangLop()` (đã nhớ trong GET); nếu trần `/demo/session` ở `tocDo.run.ts` vượt → thêm `branch_id` vào câu `SELECT … FROM classes WHERE id IN` sẵn có ở `routes/index.ts:139` và dùng nó thay `bangLop()`.

- [ ] **Step 1: Kiểm đỏ** (`prNv.tests.ts`):
```ts
const m = (o: Partial<DauVaoChiNhanh>) => chiNhanhMacDinh({ daChon: null, quanLy: [], lopDay: [], cuoi: null, ...o });
assert(m({ daChon: 3, quanLy: [1] }) === 3 && m({ daChon: 'tat-ca', quanLy: [1] }) === null, 'luật 1 thắng');
assert(m({ quanLy: [2] , lopDay: [1, 1] }) === 2, 'luật 2 trước luật 3');
assert(m({ quanLy: [1, 2], lopDay: [2, 2, 1] }) === 2 && m({ quanLy: [2, 1] }) === 1, 'QL hai chi nhánh: nhiều lớp hơn, hoà → id nhỏ');
assert(m({ lopDay: [3, 2, 3] }) === 3 && m({ lopDay: [3, 2] }) === 2, 'luật 3');
assert(m({}) === null && m({ cuoi: 1 }) === 1, 'luật 4');
```
  Và máy chủ: `goiYChiNhanh` với Principal dựng tay (QL một chi nhánh 2 → 2; QL hai chi nhánh + dạy lớp ở chi nhánh 2 → 2; Quản trị không vai chi nhánh, dạy 2 lớp ở chi nhánh 3 → 3; Quản trị không dạy → null; GV dạy hai chi nhánh → null); `danhSachHocVienLop(P.admin, {})` **không** còn là id nhỏ nhất khi admin dạy lớp ở chi nhánh khác (seed thiếu thì thêm `teacher_assignments` trên DB test); `cnNho` ngoài phạm vi bị bỏ qua (không 403); `cnNho` không đổi `phamVi.dangDung`.
- [ ] **Step 2:** `npm test` đỏ. **Step 3:** viết hàm, sửa `hocVienLop.ts`, route, phiên, kiểu phiên. **Step 4:** `npm test` xanh (gồm `hocVienLop.tests.ts`, `prDh`, `prHvl` không sửa; nếu kiểm cũ khẳng định "id nhỏ nhất" thì đó là luật đã đổi — sửa và ghi vào mô tả PR).
- [ ] **Step 5: Commit** `PR-NV (4): luật chi nhánh mặc định (vai Quản lý → lớp mình dạy), Học viên & Lớp hết mặc định MB`.

### Task NV-5: Chi nhánh mặc định ở mọi màn có ô chi nhánh (web)
Skill: test-driven-development (phần thuần đã kiểm ở NV-4) · bấm thử bằng ảnh

**Interfaces** (`web/src/ui/Filters.tsx`, cạnh `BranchFilter`):
```ts
export function docChiNhanhDaNho(): number | 'tat-ca' | null;   // localStorage 'pisa.chiNhanh', try/catch → null
export function nhoChiNhanh(id: number | null): void;            // null → 'tat-ca'; try/catch, lỗi thì bỏ qua
export function useChiNhanhMacDinh(o?: { cuoi?: number | null }): number | null;
// branchCount ≤ 1 → null (ô ẩn, giữ như nay); còn lại chiNhanhMacDinh({ daChon: docChiNhanhDaNho() hợp lệ theo session,
//   quanLy: [], lopDay: [], cuoi: session.chiNhanhGoiY ?? o?.cuoi ?? null })
```
"Hợp lệ theo session": người có grant toàn hệ thống → mọi id; còn lại id thuộc `session.grants[].branchId`. (`// ponytail: chi nhánh ngừng hoạt động vẫn qua kiểm này — người dùng chọn lại một lần; kiểm theo /ref/branches nếu gặp`.) `BranchFilter.onChange` gọi `nhoChiNhanh` trước `onBranch` → mọi màn dùng `BranchFilter` tự nhớ. Mỗi màn: `const branchId = cnUrl ? Number(cnUrl) : macDinh` — **URL thắng**, mặc định **không** ghi vào URL, **không** ghi vào localStorage (chỉ lần người dùng tự chọn mới nhớ).

**Các màn (đã đọc mã):**

| Màn | Ô chi nhánh · file:dòng | Mặc định hiện tại | Đổi |
|---|---|---|---|
| Tổng quan (QL) + tab Phân tích | `BranchFilter` · `worklist/OverviewPage.tsx:37,76`; Phân tích đọc `cn` riêng ở `phanTich/PhanTich.tsx:26` (tự đặt `cn` khi chỉ 1 chi nhánh, :60-68) | Tất cả chi nhánh | Cả hai dòng đọc `cn ?? useChiNhanhMacDinh()` (cùng một giá trị) |
| Học viên & Lớp | `select` riêng · `students/StudentsPage.tsx:68-69,195-199` | QL/QT: **chi nhánh id nhỏ nhất = MB** (máy chủ `hocVienLop.ts:74`) | Gửi `cnNho` = `docChiNhanhDaNho()` khi số; `onChange` gọi `nhoChiNhanh`; máy chủ theo NV-4 |
| Lưu trữ (⋯ Học viên & Lớp) | `select` riêng · `students/LuuTruPage.tsx:33-34,86-91` ("Mọi chi nhánh") | Mọi chi nhánh | `cn ?? macDinh`; `onChange` gọi `nhoChiNhanh` |
| Test › Kế hoạch Test | `BranchFilter` (hai chỗ, máy/điện thoại) · `test/KeHoachTestTab.tsx:25-26,119,127` | Tất cả | `cn ?? macDinh` |
| Kế hoạch Test › panel Xếp lịch MT | `BranchFilter` · `test/keHoach/NganXepLichMt.tsx:56,224` (state riêng) | Tất cả (dù trang đang lọc một chi nhánh) | Nhận `branchId` của trang làm giá trị đầu (prop mới `chiNhanhDau`) |
| Test › Lịch Test | `BranchFilter` · `test/LichTestTab.tsx:61,228` | Tất cả | `so('cn') ?? so('branchId') ?? macDinh` |
| Công việc › Chờ duyệt / Nhắc việc | `BranchFilter` · `duyet/HopChoDuyet.tsx:44,153` | Tất cả | `cn ?? macDinh` |
| Công việc › Hỗ trợ học viên | `BranchFilter` · `congViec/HoTroHocVienTab.tsx:43,146` | Tất cả | `cn ?? macDinh` |
| Công việc › Vận hành | `BranchFilter` · `worklist/MgmtTasksPage.tsx:71,167` | Tất cả | `cn ?? macDinh` |
| Báo cáo đơn vị | `BoLocDoan` · `worklist/MeetingPage.tsx:62,117,150-155` (có thêm lựa chọn Tutor) | Tất cả (`'tat-ca'`) | `cn ?? String(macDinh ?? 'tat-ca')`; chọn số / Tất cả thì `nhoChiNhanh`, chọn Tutor không nhớ |
| Xuất Excel MT (ngăn) | `test/NganXuatMt.tsx:41` | Theo trang mở nó | Không đổi (tự theo trang) |
| Không phải bộ lọc xem — không đổi | `classes/ClassCreatePanel.tsx:43,62` · `worklist/MgmtTasksPage.tsx:654` (form Giao việc, theo trang) · `platform/AccountsAdmin.tsx:44` (gán vai) | — | Không đổi |

`WeekBranchFilter` (`ui/Filters.tsx:232`) không còn nơi dùng: không sửa, ghi vào mô tả PR là mã chết (xoá thuộc PR khác).
Sau khi PR-DL merge: nếu tab "Điểm theo lớp" (`test/TabDiemLop.tsx`) có ô chi nhánh → thêm một dòng `cn ?? macDinh` như trên.

- [ ] **Step 1:** Viết `docChiNhanhDaNho` / `nhoChiNhanh` / `useChiNhanhMacDinh`; nối `BranchFilter`.
- [ ] **Step 2:** Sửa từng màn ở bảng. `npm run check` xanh.
- [ ] **Step 3: Bấm thử bằng ảnh** (DB thử local; mỗi vai mở Tổng quan, Học viên & Lớp, Kế hoạch Test, Lịch Test, Chờ duyệt, Báo cáo đơn vị): Quản trị (user 1) — chưa chọn gì → theo luật (không MB nếu dạy chi nhánh khác); chọn Bãi Cháy ở Tổng quan → mở Lịch Test thấy Bãi Cháy; chọn "Tất cả" → mọi màn Tất cả. QL một chi nhánh (user 2) — ô ẩn, dữ liệu đúng chi nhánh. **QL hai chi nhánh** — seed không có thì cấp thêm vai `manager` chi nhánh thứ hai cho một QL bằng câu SQL trên **DB test** (ghi câu vào mô tả PR); mặc định = chi nhánh có nhiều lớp mình dạy hơn. GVCN (user 7) — không đổi gì so với hôm nay. Xoá localStorage / cửa sổ ẩn danh → vẫn chạy.
- [ ] **Step 4: Commit** `PR-NV (5): mọi ô chi nhánh nhớ lần chọn trước, mặc định theo vai Quản lý / lớp mình dạy`.

### Task NV-6: "Nợ tuần trước" thu gọn mặc định
**Files:** `web/src/modules/test/LichTestTab.tsx:93` (`useState(true)` → `useState(false)`). Giữ mọi chỗ **tự mở** khi người dùng muốn thấy: link có lớp trỏ đúng dòng Nợ (`:125`), bấm ô số "Nợ tuần trước" / "Quá hạn" ở dải số (`DaiSo.tsx:22,26` → `LichTestTab.tsx:175,177`). `KhoiNo.tsx` không sửa (đã có `aria-expanded`, nút mở/thu).

- [ ] Sửa; bấm thử Lịch Test của GVBM (user 9) có Nợ: mở trang → khối thu gọn, chỉ hàng tiêu đề + số; bấm ô "Nợ tuần trước" → mở và cuộn tới; mở từ Công việc › Chấm (có `classId`+`kn`) → mở đúng dòng. 375 + 1440, sáng + tối.
- [ ] Commit `PR-NV (6): Nợ tuần trước thu gọn mặc định`.

### Task NV-7: Kiểm cuối, tài liệu, mở PR
- [ ] `npm run check` một lần, foreground, xanh. Quét tiến trình node/vite còn chạy, tắt.
- [ ] `/impeccable audit` trên các màn đã sửa (Tổng quan dải Chờ duyệt, hộp Chờ duyệt tab Nhắc việc, Học viên & Lớp đầu trang, Lịch Test khối Nợ). Ảnh thật 375 / 1440 × sáng / tối × Quản trị, QL một chi nhánh, QL hai chi nhánh, GVCN.
- [ ] Đo trên **DB thử Turso** nếu chủ sản phẩm cho dùng (không chạm DB bản chính): "Nhắc tất cả" với số thẻ thật → ghi giây vào mô tả PR. Không có quyền → ghi số câu đo được × 20–50 ms.
- [ ] `/ponytail-review`; liệt kê mọi chú thích `ponytail:` trong mô tả PR.
- [ ] `CODE_MAP.md` (2 file mới), `[x]` ở kế hoạch này, một dòng mục 11 `plan.md`. Ảnh sổ tay `docs/so-tay/` có chữ "Để QL biết" → ghi vào mô tả PR (chụp lại ở PR-HK2).
- [ ] Mô tả PR báo từng ID (T8 tên · T8 số nổi · T8 502 · T8 Mini Test/Cuối khoá 404 · T9 · Nợ tuần trước): tái hiện, file sửa, phép kiểm bảo vệ, số câu trước/sau, ảnh. `superpowers:requesting-code-review`, `superpowers:finishing-a-development-branch` (mở PR vào `main`, **không merge**).

---

## Tôi đã tự quyết (đổi được nếu chủ sản phẩm muốn)
1. Luật 2–3 (vai Quản lý, lớp mình dạy) chỉ áp cho **Quản lý / Quản trị** — đúng phàn nàn gốc ("Quản trị viên / Quản lý … mặc định ưu tiên chi nhánh đó"). GV có ô chi nhánh (dạy hai chi nhánh) giữ "Tất cả" như hôm nay, chỉ nhớ lần mình tự chọn — tránh GV bị giấu mất bài cần chấm ở chi nhánh kia.
2. **Một** giá trị nhớ cho mọi màn (chọn Bãi Cháy ở Tổng quan thì Lịch Test cũng Bãi Cháy). Link có `cn=` luôn thắng giá trị nhớ.
3. Nút Nhắc **một dòng** (khoá do web gửi) giữ thứ tự cũ: kiểm dòng trong phạm vi rồi mới trả "đã nhắc lúc…" — bỏ qua sớm chỉ áp cho "Nhắc tất cả", nơi khoá lấy từ thẻ máy chủ đã kiểm phạm vi.
4. Phép đo số câu đặt ở `prNv.tests.ts` (đếm `soCauSql()` quanh lời gọi), không thêm vào `tocDoDuong.ts` — danh sách đó chỉ đo đường GET.
5. Mã nội bộ `de-biet`, `?xem=de-biet`, loại thẻ `bao_len_*` giữ nguyên — chỉ đổi chữ hiện trên màn.

## Câu hỏi (cần chủ sản phẩm quyết trước NV-3 / NV-4)
1. **Tab "Nhắc việc" trong hộp Chờ duyệt có hiện số không?** (Tổng quan sẽ không còn số Nhắc việc nào.) A — giữ số xám nhỏ trên tab, chỉ thấy khi đã mở hộp (QL biết còn bao nhiêu việc để nhắc) · B — bỏ hẳn số. **Khuyến nghị A.**
2. **Quản trị / Quản lý không có vai chi nhánh và không dạy lớp nào** (luật 2–3 không chọn được): A — màn có "Tất cả chi nhánh" thì để **Tất cả** như hôm nay; Học viên & Lớp (không có "Tất cả" trong ô chi nhánh) lấy chi nhánh đầu · B — mọi màn lấy chi nhánh đầu (đúng chữ đặc tả, nhưng lại là MB). **Khuyến nghị A** (không ép ai vào MB).
3. **Chữ "Báo QL"** (nhãn nhỏ trên mỗi thẻ trong tab, chuông "Báo QL · …") có đổi luôn thành "Nhắc việc"? A — đổi (một việc một tên; Rulebook mục chữ "Báo lên → Báo QL" sửa theo) · B — giữ "Báo QL", chỉ đổi tên tab. **Khuyến nghị A.**

## File chồng với PR khác
| PR | File chung | Cách tránh |
|---|---|---|
| DL (chưa push, `pr-dl-diem-theo-lop`) | `server/src/tests/run.ts`, `shared/domain/index.ts`, `CODE_MAP.md` | Chỉ thêm dòng, giữ cả hai |
| K26 (#196) | `server/src/routes/index.ts` (K26 sửa chỗ khác; NV: khối phiên :144-176 + `/hoc-vien-lop` :1089), `run.ts`, `CODE_MAP.md`, `thiet-ke/TU_DIEN_VA_CHU.md` | Chỉ thêm dòng |
| SL (`pr-sl-sua-ca-lop`) | `web/src/modules/duyet/TheYeuCau.tsx` (SL :243; NV chỉ chạm nếu Câu hỏi 3 = A và cần ẩn nhãn — nhãn đến từ `PHAN_LOAI_LABEL`, nên thường **không** chạm), `web/src/modules/worklist/MgmtTasksPage.tsx` (SL :726; NV :71), `routes/index.ts`, `run.ts` | Khác đoạn; rebase sau SL |
| MT0 (đợt 5, sau NV) | `server/src/worklist/mywork.ts` (MT0 thêm nhóm `chot_len_ft` ~:202, :546; NV chỉ chạm khi làm NV-2), `server/src/classes/hocVienLop.ts` (MT0 :111-116; NV :49-75 + hàm mới cuối file), `routes/index.ts`, `normal/cuoiKhoa.ts` (MT0 chỉ kiểm) | Khác đoạn; NV merge trước. Nếu NV-2 có làm: MT0 thêm nhóm mới phải khai báo vào bảng tiền tố khoá → nhóm của NV-2 |
| MTb (đợt 5) | `server/src/routes/index.ts:485-498` | Khác đoạn |
| MTa (cùng đợt; kế hoạch `2026-10-05-pr-mta-luat-mock-test.md` chỉ nêu chung `routes/index.ts`) | Dễ chạm: `server/src/duyet/yeuCau.ts` (T7 bỏ ép độ dài lý do — `DO_DAI_LY_DO` :26, `tuChoiYeuCau`/`traLoiYeuCau` ~:420-445; NV chỉ thân `nhacNhieu` :472-499), `server/src/duyet/loaiYeuCau.ts` (T3 "Xin dời" — thẻ `lich_thi`; NV chỉ chữ `moTa` của 5 loại `bao_len_*`), `server/src/normal/cuoiKhoa.ts` (NV một dòng :449). **NV không chạm** `fasttrack/absence.ts`, `fasttrack/attempts.ts`, `keHoach/*`, `normal/regular.ts`, `shared/domain/chamDiem.ts`, `platform/audit.ts` | Khác hàm → git tự ghép; ai merge sau chạy lại `npm run check` |
| CHU | Chỉ thêm file `.md` | Không chồng |
