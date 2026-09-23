# PR-Form · Case, chọn người, bằng chứng trong form — Kế hoạch

| Mục | Chốt |
|---|---|
| Mã PR | **PR-Form** · Đợt 3 (trước deploy 23/09) |
| Nhánh | `pr-form-chon-nguoi` (worktree `.claude/worktrees/pr-form-chon-nguoi`), một PR, không draft, **không tự merge** |
| Cổng thử | API **4167** · Vite **5367** (không dùng 4000/5173) |
| Model khuyến nghị | **Opus 5.5 · High** |
| Phương án B | **Opus 5 · High** |
| Người rà | **Fable 5.1** (khác model người code) |
| Migrate | **KHÔNG** — mọi cột ID người đã có sẵn (Q1). Không đổi `schema.sql`, `migrate.ts` |
| Phụ thuộc | **Merge sau PR-Pa** (Pa Task 11 sửa `QuickReport.tsx`). S2 (#64), S1 (#56) đã ở `main` |
| Chồng file | `server/src/routes/index.ts`, `server/src/tests/run.ts`: chỉ **thêm khối** (Qa, Pa, Rc1 cũng thêm — gỡ xung đột bằng giữ cả hai). `SkillBoard.tsx`: **chỉ Form** sửa (chữ lớp thường chuyển từ Qb sang đây — Qb không chạm file này) |
| File KHÔNG được chạm | `StudentDetailPage.tsx`, `JourneyTimeline.tsx` (Qb) · `StudentsPage.tsx`, `ClassOverviewPage.tsx`, `ClassRoster.tsx`, `modules/classes/*` (Qa) · `OverviewPage.tsx`, `WorkList.tsx`, `DongTinHieu.tsx`, `mywork.ts` (Pa) · `attempts.ts`, `RegularSheetPage.tsx`, `Mock*`, `ScoreEntry.tsx`, `permissions.ts`, `modules/cham/*`, `modules/test/*` (Rc1, Rc2) · `CaseBoardPage.tsx`, `IssueAnalysis.tsx`, `WeeklyBoard.tsx` (Pb) · `MgmtTasksPage.tsx`, `TeacherAssignPanel.tsx`, `StudentManagePanel.tsx` (ngoài phạm vi) · `schema.sql`, `migrate.ts` |

## Quy trình nhanh (chủ sản phẩm chốt 23/09 — bắt buộc)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **không** rà từng Task bằng subagent. Tự code từng Task, chạy
  `npm run check` sau mỗi Task (phải xanh, **số phép kiểm không giảm**), rồi commit. Nếu buộc dùng subagent: cùng model,
  **không Haiku**.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task 11 (ảnh vào `thiet-ke/anh/pr-form/`).
- Không tự rà code cuối PR (planning rà bằng Fable 5.1). Cuối PR: push, mở PR, báo planning.
- Commit ghi **đúng** dòng `Co-Authored-By` của model thật đang chạy.
- Gặp mã lệch hẳn với kế hoạch (không chỉ lệch số dòng) → dừng, hỏi planning.

## Mục tiêu

1. **F-2 · Chọn người có tìm kiếm, lưu ID.** Mọi ô "Người thực hiện" trong luồng Case/PA học thuật và PA xử lý Ý thức
   đổi từ ô chữ tự do sang **một ô chọn chung** `ChonNguoi`: gõ ≥ 3 ký tự để tìm (không dấu, không phân biệt hoa thường),
   có lựa chọn **Tôi** và **Người ngoài (gõ tên)**. Máy chủ kiểm ID (tồn tại, đang hoạt động, đúng tập người).
2. **F-1 · Lưu trước, đính kèm sau (quyết định 4.8).** Form tạo Case, tab nhập bù, bước xác minh tín hiệu: bấm lưu →
   panel **không đóng**, hiện "✓ Đã lưu" + khối **Bằng chứng** của chính Case vừa tạo + nút **Xong**.
3. **G-9 · Khối Bằng chứng** nhận **Ctrl+V ảnh chụp màn hình, kéo thả, chọn nhiều tệp, dán liên kết** (sửa `BangChung.tsx`
   — áp cho mọi nơi đang dùng).
4. **F-3 + S5 · Nhập bù:** thẻ phương án 3 dòng (§22.4), chọn người bằng ID, ô **Điểm chi tiết theo kỹ năng** (gửi `metrics`).
5. **F07 · Lớp thường tạo được Case Writing** ở form (máy chủ đã nhận `writing` từ S1).
6. **Nợ sau rà S2 (#64):** ô người thực hiện khi Điều chỉnh / Thay PA → `ChonNguoi`; nút **Sửa** gợi ý tự động có ô **lý
   do**; Điều chỉnh không đổi ngày trên PA `followup_due = NULL` phải có ngày mặc định như Giữ nguyên.
7. **Chữ lớp thường ở `SkillBoard.tsx`** (chuyển từ Qb): bỏ "Đạt kỳ vọng", "MT{n}" cho lớp thường.
8. **Ý thức nhỏ:** YT-4 (Môn tự điền), YT-5 (nút Xác nhận sáng sau khi tải thư), K2-6d (máy chủ tự lấy người đăng nhập khi
   trống người thực hiện), YT-9 (chọn/hiện Người phụ trách PA xử lý).

## Nguồn

- Đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md`: §1 (G-1, G-3, G-5, G-8, **G-9**, G-11),
  §2, **§3.13**, §3.11 (dòng "Loại + Phụ trách trên một hàng"), §6 (dòng F07, dòng SkillBoard), §7 dòng **Form**.
- Kiểm kê `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md`: §1.8 (F-1, F-2, F-3), S5, YT-4, YT-5, YT-9,
  K2-6d, §2 #8–9, §4 câu 4.7 và 4.8.
- Thiết kế `thiet-ke/PISA-Design-Plan-after-PR28.md` **§17.5** (CASE-ATTACH), **§22.4** (thẻ nhập bù), **§22.5** (ô chọn
  người: ≥ 3 ký tự, không dấu, bàn phím, "Không tìm thấy giáo viên phù hợp", API kiểm ID).
- Mockup `thiet-ke/mockup/09c-y-thuc-vua.html` dòng 41–68 (khối Bằng chứng: "Dán ảnh chụp màn hình (Ctrl + V) · kéo thả ·
  chọn tệp · dán liên kết"; "Loại … Phụ trách …" một hàng).
- Chữ `thiet-ke/THUAT_NGU_DA_CHOT.md`: g3-041 `+ Thêm phương án`, g3-130 `+ Đính kèm tệp`, g3-131 `+ Thêm liên kết`,
  g5-061 `Người thực hiện`, g7-039 `Phụ trách` (đầy đủ: Người phụ trách), g6-104 `Nhập bù`, g6-105 `Đã xong từ trước`,
  g6-106 `Đang gặp vấn đề`, g11-030 → **`Ghi lại Case đã xong`**. "Case" viết hoa. Không viết "Normal".
- Kế hoạch Pa `../pisa-pr-pa/docs/superpowers/plans/2026-09-22-pr-pa-tong-quan.md` Task 11 (giao kèo prop `signal` của
  `QuickReport`).

Số dòng đo trên `main` @ `37786fd` (779 phép kiểm, gọi là **B = 779**). Pa sẽ đổi vài dòng `QuickReport.tsx` — mở file xem lại.

## Bảng Q — quyết định đã tự chốt

| Q | Câu hỏi | Chốt | Lý do |
|---|---|---|---|
| Q1 | Có migrate thêm cột ID? | **Không.** `case_interventions.performer_user_id/performer_name` (schema.sql:946-947), `case_intervention_revisions.*_performer_*` (1117-1120), `discipline_measures.performed_by/performer_name/owner_user_id` (1580-1586), `sos_coordination_actions.performed_by/performer_name` (1656) đã có đủ | Chỉ đổi cách ghi. DB bản chính rỗng, không phải chuyển dữ liệu cũ |
| Q2 | Dùng `/ref/people` có sẵn? | **Không** — thêm `GET /ref/nguoi` | `/ref/people` đòi `MEETING_VIEW` (`meeting.ts:586`) → GV bị 403; lại không có ngưỡng 3 ký tự, không tìm không dấu |
| Q3 | Tập người của từng ô | PA **học thuật** (người thực hiện): **giáo viên** đang hoạt động (§22.5). PA **xử lý Ý thức** (người thực hiện, phụ trách): **mọi nhân viên** đang hoạt động (GV + QL) | Ý thức hay do QL/GĐCN làm (họp CX). Người ngoài (CS, tutor ngoài, phụ huynh) đi đường "Người ngoài (gõ tên)" |
| Q4 | Giá trị mặc định | **Tôi** ở mọi ô người thực hiện (giữ hành vi cũ "bỏ trống = bạn"). Ô Điều chỉnh mặc định **Không đổi**. Ô Phụ trách mặc định **trống = GVCN của lớp** (máy chủ tự điền như cũ) | Không đổi thói quen, không thêm một bấm |
| Q5 | Chọn ID mà vẫn gửi kèm tên | Máy chủ giữ **một trong hai**: có ID → `performer_name = NULL`. Người ngoài: tên 2–100 ký tự, `performer_user_id = NULL` | Hiện `recordIntervention` ghi cả hai (cases.ts:847-855) — hai nguồn sự thật |
| Q6 | Chưa gõ gì thì có gợi ý không? | Có: khi ô biết `studentId`, trả **GV đang dạy lớp của em** (≤ 6 người) trước khi gõ. Còn lại theo §22.5 (≥ 3 ký tự) | Trường hợp thường gặp nhất là GV cùng lớp; một bấm thay vì gõ tên |
| Q7 | F-1: khi nào gọi `onDone`? | Sau khi lưu, panel ở bước "Đã lưu"; `onClose()` rồi `onDone(id)` chỉ chạy khi bấm **Xong** hoặc đóng panel (✕, Esc, nền). **Props không đổi** | Nơi gọi (hồ sơ HV, trang lớp, dòng tín hiệu của Pa) đóng panel trong `onDone`; gọi sớm là panel đóng mất |
| Q8 | Lớp thường: bộ kỹ năng trên form | Form hiện **L · R · W · S** (`listening, reading, writing, speaking`). Máy chủ **vẫn nhận** W1/W2 cho lớp thường như hiện nay (không siết) | Đặc tả §2 "W không tách Task 1/2"; siết máy chủ có thể vỡ dữ liệu cũ, không cần cho deploy |
| Q9 | K2-6d trái với phép kiểm `yThuc.tests.ts:767` (đòi báo lỗi khi thiếu người) | **Sửa phép kiểm đó** thành: thiếu người → `performed_by = người xác nhận`. Không xoá, số phép kiểm không giảm | Kiểm kê K2-6d chốt hướng này |
| Q10 | Điều chỉnh trên PA `followup_due = NULL` | Ngày = `planEndDefault(observedOn)` (đúng như Giữ nguyên, cases.ts:2802-2811). Mặc định này **không tính là "có đổi"**; dòng lịch sử ghi thật `old NULL → new {ngày}` | Lịch sử phải đúng với dữ liệu; nhưng không được để "không đổi gì" lọt qua |
| Q11 | Ctrl+V bắt ở đâu? | Khi khối Bằng chứng **đang được chọn** (bấm vào khối rồi Ctrl+V); không bắt dán toàn trang | Dán chữ vào ô Mô tả không được biến thành tải tệp |
| Q12 | Không làm trong PR này | Công việc (`MgmtTasksPage`), `TeacherAssignPanel` (đã chọn theo ID), "Người tham gia" (nhiều người, chữ tự do), Phối hợp SOS (giao diện không có ô người), `StudentManagePanel` (Người tư vấn / Người tiếp nhận — thuộc LT), bằng chứng vi phạm K2-6f (YT2) | Ngoài phạm vi / sau deploy |
| Q13 | YT-4 sửa ở đâu | `/violations/similar` trả thêm `defaultSkill`; form điền sẵn Môn; chưa đụng ô Môn thì **không gửi** `skill` (máy chủ tự điền) | Người dùng thấy môn trước khi lưu; vẫn chọn được "để trống" có chủ ý |

## Cấu trúc file

| File | Việc |
|---|---|
| `shared/domain/nguoiThucHien.ts` (tạo) | Kiểu `NguoiChon`, `nguoiThanhPayload`, `nguoiThieu`, `NHOM_NGUOI` |
| `shared/domain/bangChung.ts` (tạo) | `tenAnhDan(now, mime)`, `laLienKet(text)`, `CHU_KHOI_BANG_CHUNG` |
| `shared/domain/cases.ts` | `caseTopicsFor(ratio)` |
| `server/src/platform/timNguoi.ts` (tạo) | `timNguoi(p, { q, nhom, studentId })` |
| `server/src/cases/nguoiThucHien.ts` (tạo) | `chuanHoaNguoiThucHien(p, input, opts)` |
| `server/src/cases/cases.ts` | `recordIntervention`, `backfillCase`, `updateResult` dùng hàm chuẩn hoá; `caseTopicsOf`; `attemptKind` cho SkillBoard |
| `server/src/cases/planRevisions.ts` | `chuanHoaDieuChinh`: ngày mặc định + người thực hiện qua hàm chuẩn hoá |
| `server/src/yThuc/measures.ts`, `violations.ts` | K2-6d, người thực hiện / phụ trách qua kiểm chung, `defaultSkill` |
| `server/src/routes/index.ts` | `GET /ref/nguoi`, `GET /students/:id/case-topics`, body mới của `/cases/backfill`, `/violations/similar` |
| `server/src/tests/form.tests.ts` (tạo) + `run.ts` | Phép kiểm của PR |
| `web/src/ui/PeoplePicker.tsx` | Thêm `ChonNguoi` (giữ nguyên `PersonPicker`, `FollowerPicker`) |
| `web/src/ui/BangChung.tsx` | Ctrl+V, kéo thả, nhiều tệp, dòng hướng dẫn |
| `web/src/modules/cases/QuickReport.tsx` | F07, F-1, F-3, S5 |
| `web/src/modules/cases/ChiTietKyNang.tsx` (tạo) | Tách `ComponentsField` + `componentsPayload` từ `CasePanel.tsx` để dùng chung |
| `web/src/modules/cases/CasePanel.tsx`, `CapNhatTuan.tsx`, `SkillBoard.tsx` | `ChonNguoi`; chữ lớp thường |
| `web/src/modules/yThuc/CaseSosControls.tsx`, `ConfirmMeasurePanel.tsx`, `CreateMeasurePanel.tsx`, `XemPhuongAnPanel.tsx`, `RecordViolationPanel.tsx` | `ChonNguoi`, lý do Sửa, YT-4/5/9 |

---

## Task 0 · Worktree, nhánh, mốc

- [x] `git fetch origin`; kiểm `git log origin/main --oneline | grep -i "PR-Pa"` đã có merge của Pa.
  **Chưa có** → vẫn làm Task 1–6 (không chạm `QuickReport.tsx`), rebase lên `origin/main` sau khi Pa merge rồi mới làm Task 7.
- [x] `git worktree add .claude/worktrees/pr-form-chon-nguoi -b pr-form-chon-nguoi origin/main`
- [x] Chép file kế hoạch này vào nhánh, `npm ci` nếu cần, `npm run check` → ghi mốc B (dự kiến 779 + phép kiểm của Pa/Qa/Rc1 đã merge).
- [x] Commit `PR-Form (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần dùng chung (shared)

**Files:** tạo `shared/domain/nguoiThucHien.ts`, `shared/domain/bangChung.ts`; sửa `shared/domain/cases.ts`,
`shared/domain/index.ts` (export); tạo `server/src/tests/form.tests.ts` (khung `runFormTests(t: YThucTestKit)`, chép cách
`dieuChinhPa.tests.ts:1-60`), thêm khối gọi ở cuối `run.ts` (trước dòng in tổng, sau khối PR-AN ~9462).

- `NguoiChon = { kieu: 'toi' } | { kieu: 'tai_khoan'; id: number; ten: string; phu?: string } | { kieu: 'ngoai'; ten: string }`.
- `nguoiThanhPayload(v: NguoiChon | null)` → `{}` (null = không đổi) · `{ performerSelf: true }` · `{ performerUserId }` ·
  `{ performerName }` (đã trim). Một hàm này dùng cho PA học thuật; Ý thức có `nguoiThanhPayloadYThuc` →
  `{ performedBy }` / `{ performerName }` (`toi` → gửi **không gì cả**, máy chủ tự lấy người đăng nhập — K2-6d).
- `nguoiThieu(v, batBuoc)` → câu thiếu gì hoặc `null`: `null` + bắt buộc → "Chọn người thực hiện."; `ngoai` tên < 2 ký tự →
  "Gõ tên người ngoài (ít nhất 2 ký tự)."
- `tenAnhDan(now: Date, mime)` → `anh-chup-DD-MM-HHmm.png` (đuôi theo mime: png/jpg/webp/gif; lạ → png). Giờ VN.
- `laLienKet(text)` → true với `http://`/`https://` một dòng, không khoảng trắng.
- `CHU_KHOI_BANG_CHUNG = 'Dán ảnh chụp màn hình (Ctrl + V) · kéo thả · chọn tệp · dán liên kết'` (09c dòng 41).
- `caseTopicsFor(ratio: boolean)`: `true` → `REGULAR_SKILLS` (L R W S, thứ tự này); `false` → `ENTRY_SKILLS`.

**Phép kiểm (≥ 5):** payload đủ 4 dạng + null; `nguoiThieu` 3 trường hợp; `tenAnhDan` đúng mẫu và đuôi; `laLienKet` đúng/sai
(có khoảng trắng, `ftp:`, hai dòng); `caseTopicsFor(true)` = 4 môn có `writing`, không `writing1`.

**Xong khi:** `npm run check` xanh, số phép kiểm = B + mới. Commit `PR-Form (1): luật thuần chọn người, bằng chứng, chủ đề Case`.

- [x] Task 1 xong — `npm run check` xanh, **785 = 779 + 6**.

## Task 2 · Máy chủ: tìm người `GET /ref/nguoi`

**Files:** tạo `server/src/platform/timNguoi.ts`; route trong `routes/index.ts` cạnh `/ref/people` (dòng 262-264).

- Tham số: `q`, `nhom` (`giao_vien` | `nhan_vien`, mặc định `giao_vien`), `studentId` (tuỳ chọn). `requireAuth`, không cần
  quyền riêng — chỉ trả `{ id, name, role, branches, cungLop: boolean, monDay: string[] }`, **không** trả gì về hồ sơ chuyên môn.
- Người hợp lệ: `users.status = 'active'` và có `user_roles` `status='active'` với `roles.key = 'teacher'` (nhóm `giao_vien`)
  hoặc `teacher | manager` (nhóm `nhan_vien`). Không trả `system_admin` thuần.
- Tìm: `q.trim()` < 3 ký tự → chỉ trả **người dạy lớp đang học của em** (`teacher_assignments` hiệu lực hôm nay của lớp
  `activeClassOf(studentId)`, xem mẫu truy vấn `measures.ts:196-205`), không có `studentId` → `[]`. ≥ 3 ký tự: nạp danh sách
  người hợp lệ rồi lọc bằng `normalizeName` (`util.ts:62`) trên tên và mã (danh bạ vài chục–vài trăm người, lọc bằng JS được).
  Xếp: `cungLop` trước, rồi A→Z. Giới hạn 12.
- Hàm dùng lại được: export `laNguoiHopLe(userId, nhom): boolean` (Task 3 dùng).

**Phép kiểm (HTTP, chép mẫu `yThuc.tests.ts:1278-1300`):** GV (không có `MEETING_VIEW`) gọi được (200); `q='tr'` không
`studentId` → `[]`; `q` không dấu "tran ngoc" tìm ra GV có tên "Trần Ngọc …"; nhóm `giao_vien` không có QL thuần, `nhan_vien`
có; tài khoản bị khoá (UPDATE `status` tạm, trả lại trong `finally`) không hiện; `studentId` của em MB-FOU 12 + `q=''` → đúng
các GV đang dạy lớp đó, `cungLop = true`.

Commit `PR-Form (2): GET /ref/nguoi — tìm người không dấu, ≥ 3 ký tự, gợi ý GV lớp của em`.

- [x] Task 2 xong — `npm run check` xanh, **791 = 785 + 6**.

## Task 3 · Máy chủ: người thực hiện lưu ID, kiểm ở một chỗ (F-2) + ngày Điều chỉnh (nợ S2)

**Files:** tạo `server/src/cases/nguoiThucHien.ts`; sửa `cases.ts` (`recordIntervention` 803-806 và 847-855,
`backfillCase` 1113-1200, `updateResult` 2773 và 2780-2813), `planRevisions.ts:30-63`, route `/cases/backfill`.

- `chuanHoaNguoiThucHien(p, { performerSelf, performerUserId, performerName }, { nhom, batBuoc })` →
  `{ userId, name } | null` (null = không gửi gì). Thứ tự: `performerUserId` → phải `laNguoiHopLe(id, nhom)`, sai thì 400
  "Người thực hiện phải là giáo viên đang làm việc. Người ngoài thì chọn 'Người ngoài' và gõ tên." (nhóm `nhan_vien`:
  "… phải là nhân viên đang làm việc …"); kết quả `{ userId: id, name: null }` → `performerName` không rỗng → 2–100 ký tự,
  `{ null, tên }` → `performerSelf` → `{ p.userId, null }` (người đang ghi, không kiểm vai — giữ hành vi cũ khi QL tự ghi).
  Không có gì và `batBuoc` → 400 giữ câu cũ "Cần ghi ai là người thực hiện — người nhập không mặc định là người làm."
- `recordIntervention`: thay khối 803-806 bằng hàm trên (`nhom: 'giao_vien'`, `batBuoc: status !== 'planned'`); INSERT ghi
  đúng cặp đã chuẩn hoá (không ghi cả hai). `addJourney.detail` (dòng 883) dùng tên đã chuẩn hoá (tài khoản thì lấy
  `full_name`).
- `backfillCase`: kiểu `actions[]` thêm `performerSelf?`, `performerUserId?`; kiểm từng dòng bằng hàm trên (`batBuoc: true`,
  thay dòng 1140) **trước** giao dịch; truyền nguyên ba trường xuống `recordIntervention` (dòng 1197-1200). Route
  `/cases/backfill` (routes 1062-1065) chuyển nguyên `req.body` — không phải sửa route.
- `updateResult`: dòng 2773 — chỉ khi body có một trong ba trường người thực hiện thì chuẩn hoá và ghi **cả hai cột** (bỏ
  `COALESCE(?, performer_name)` ở hai câu UPDATE 2780-2813 cho trường hợp đó); không gửi gì → giữ nguyên như cũ.
- `chuanHoaDieuChinh` (planRevisions.ts): người thực hiện đi qua hàm chuẩn hoá (thay 38-47, `nhom: 'giao_vien'`,
  `batBuoc: false`; null → giữ người cũ). **Ngày:** `const nenNgay = iv.followup_due ?? planEndDefault(observedOn)`
  (`planEndDefault` ở `shared/domain/cases.ts:751`); `followupDue` khởi từ `nenNgay`; phép so "không đổi gì" (dòng 54-57)
  so với `nenNgay`, không so với `iv.followup_due`. `ghiBanDieuChinh` vẫn nhận `iv` gốc → lịch sử ghi `NULL → ngày` (Q10).
- `replacePresetPlan` (`sosAuto.ts:245-253`) đi qua `recordIntervention` nên tự hưởng — không sửa.

**Phép kiểm (≥ 7):**
1. `recordIntervention` với `performerUserId` của QL thuần → 400; của GV đang khoá → 400; id không tồn tại → 400.
2. `performerUserId` GV + `performerName` cùng lúc → dòng lưu `performer_user_id = id`, `performer_name IS NULL`.
3. `performerName: 'Tutor ngoài Minh'` → `performer_user_id IS NULL`, tên đúng.
4. Nhập bù: một dòng `performerUserId`, một dòng `performerSelf`, một dòng tên ngoài → ba PA đúng; dòng không có ai → 400 câu cũ.
5. **Nợ S2:** PA có `followup_due` đặt NULL bằng SQL; `decision: 'adjust'` chỉ đổi mô tả → `followup_due = planEndDefault(observedOn)`
   (so bằng hàm, không so chuỗi cứng); dòng lịch sử `old_followup_due IS NULL`, `new_followup_due` = ngày đó.
6. Cùng PA NULL, `adjust: {}` (không đổi gì) → vẫn 400 "Điều chỉnh thì phải đổi ít nhất một thứ…".
7. `adjust.performerUserId` là QL thuần → 400; là GV → lịch sử `new_performer_user_id` đúng.
8. Các phép kiểm cũ dùng `performerName: 'GVCN'`, `'Tutor A'`… (run.ts 2295-2595, 7362-7525) **phải vẫn xanh**.

Commit `PR-Form (3): người thực hiện PA học thuật lưu ID, kiểm một chỗ; Điều chỉnh giữ ngày mặc định`.

- [x] Task 3 xong — `npm run check` xanh, **798 = 791 + 7**.

## Task 4 · Máy chủ: chủ đề Case theo chương trình (F07), SkillBoard lớp thường, Ý thức (K2-6d, YT-4)

**Files:** `cases.ts`, `measures.ts`, `violations.ts`, `routes/index.ts`, `tests/yThuc.tests.ts:767`.

- `caseTopicsOf(p, studentId, cycleId?)` trong `cases.ts`: kiểm quyền xem như `caseDetail` (`ATTEMPT_VIEW` theo
  `{ studentId }`), lấy lộ trình như `reportIssue` (dòng 420-423), trả `{ ratio, topics: caseTopicsFor(ratio) }`.
  `reportIssue` dòng 433 đổi thành `ratio ? [...new Set([...caseTopicsFor(true), ...ENTRY_SKILLS])] : ENTRY_SKILLS` — cùng
  tập như cũ, nhưng rút từ một hàm (Q8). Route `GET /students/:id/case-topics?cycleId=`.
- SkillBoard: điểm (`Point`, dòng 2026-2049) thêm `attemptKind: r.kind`; `attempts` của thẻ Case (2423-2432) thêm
  `a.kind AS attempt_kind` → `{ attemptNo, week, attemptKind }`. Chỉ **thêm** trường.
- `measures.ts`:
  - **K2-6d** `confirmMeasure` (392-394): không có `performedBy` lẫn `performerName` → `performedBy = p.userId`.
    `performedBy` được gửi → phải `laNguoiHopLe(id, 'nhan_vien')` (thay kiểm "tồn tại" ở 394). Có ID thì `performerName = null` (Q5).
  - `checkOwner` (188-193): thêm điều kiện `laNguoiHopLe(id, 'nhan_vien')`, câu "Người phụ trách phải là nhân viên đang làm việc."
- `violations.ts` + route `/violations/similar` (routes 769-774): trả thêm `defaultSkill: defaultSkillFor(p, lớp đang học của em)`
  (hàm có sẵn dòng 149). Giữ `rows` như cũ.
- Sửa phép kiểm `yThuc.tests.ts:767`: thay `assertThrows(... /người thực hiện/ ...)` bằng khẳng định xác nhận thành công và
  `performed_by = gvcn.userId` (Q9). Đếm: số phép kiểm không đổi ở chỗ này.

**Phép kiểm (≥ 6):** case-topics em MB-FOU 12 → `ratio: true`, 4 môn; em MB-FT 101 → 5 ô FT · `reportIssue` em lớp thường
`topic: 'writing'` thành công (nếu S1 đã có phép này thì chỉ gọi lại qua HTTP) · **S5:** `backfillCase` lớp thường topic
`writing` kèm `metrics: [{ skill: 'writing', score: 12, total: 20 }]` → `case_followups.metrics` có đúng một mục ·
`skillSupportBoard` em lớp thường có `attemptKind` `progress`/`final` ở điểm · `confirmMeasure` không người → `performed_by`
là người xác nhận · `performedBy` là tài khoản khoá → 400 · HTTP `POST /violations` **không có** trường `skill` bởi GV dạy
đúng một môn ở lớp → `skill` = môn đó; `/violations/similar` trả `defaultSkill` cùng giá trị.

Commit `PR-Form (4): chủ đề Case theo chương trình (F07), attemptKind cho SkillBoard, K2-6d, defaultSkill vi phạm`.

- [x] Task 4 xong — `npm run check` xanh, **804 = 798 + 6**.

## Task 5 · Web: ô chọn người `ChonNguoi`

**Files:** `web/src/ui/PeoplePicker.tsx` (thêm export `ChonNguoi`; `PersonPicker`/`FollowerPicker` giữ nguyên để
`MgmtTasksPage` không đổi).

- Props: `value: NguoiChon | null`, `onChange`, `nhom: 'giao_vien' | 'nhan_vien'`, `studentId?`, `choToi = true`,
  `choNgoai = true`, `khongDoi?: string` (ô Điều chỉnh: khi `value = null` hiện "Không đổi · hiện: {tên}"),
  `macDinhTrong?: string` (ô Phụ trách: khi null hiện "Mặc định: GVCN của lớp"), `ariaLabel`, `disabled`.
- Đã chọn → một dòng cao bằng `.field`: tên (chữ chính) + phần phụ mờ (`Tôi` → "Tôi · {tên của mình}" lấy từ
  `useSession`; tài khoản → vai · chi nhánh, hoặc "dạy L · R lớp này" khi `cungLop`; người ngoài → "người ngoài") + nút
  nhỏ **Đổi**. Không có nút "Bỏ" ở ô bắt buộc.
- Đang chọn → ô gõ + **danh sách xổ ngay dưới, nằm trong dòng chảy (không `absolute`)**, `max-h-56 overflow-y-auto` — tránh
  bị cắt trong `Modal` có `overflow-y-auto` (`Drawer.tsx:52`) và dễ dùng ở 375px. Thứ tự dòng: `Tôi` (nếu `choToi`) ·
  kết quả tìm · `Người ngoài: «{chữ đang gõ}»` (nếu `choNgoai` và ≥ 2 ký tự) · dòng trạng thái: < 3 ký tự "Nhập ít nhất 3 ký
  tự để tìm giáo viên" (`nhan_vien`: "…để tìm người") · "Đang tìm…" · "Không tìm thấy giáo viên phù hợp".
- Gọi `GET /ref/nguoi?q=&nhom=&studentId=` trễ 250 ms, bỏ kết quả của lượt gõ cũ (mẫu `usePeopleSearch` dòng 12-27).
- Bàn phím: ↑ ↓ di chuyển, Enter chọn, Esc đóng danh sách (không đóng Modal — `stopPropagation` ở Esc). ARIA:
  `role="combobox"` + `aria-expanded` + `aria-activedescendant`, danh sách `role="listbox"`, dòng `role="option"`.
- Không dùng màu/viền riêng; chỉ lớp có sẵn (`field`, `surface-2`, `text-slate-*`). Lớp Tailwind phải là chuỗi tĩnh.

**Xong khi:** `npm run check` xanh (typecheck). Không có phép kiểm máy chủ mới ở Task này (luật đã kiểm ở Task 1–2).
Commit `PR-Form (5): ChonNguoi — tìm người ≥ 3 ký tự, Tôi, Người ngoài, bàn phím`.

- [x] Task 5 xong — `npm run check` xanh (typecheck), 804 phép kiểm không đổi.

## Task 6 · Web: khối Bằng chứng G-9 + YT-5

**Files:** `web/src/ui/BangChung.tsx`, `web/src/modules/yThuc/ConfirmMeasurePanel.tsx`.

- `BangChung` khi `canEdit`:
  - Khung ngoài (`div` dòng 110) thêm `tabIndex={0}`, `onPaste`, `onDragOver`/`onDragLeave`/`onDrop`, viền nét đứt
    (`border-dashed`) sáng lên khi đang kéo tệp qua (`isDragging`), `aria-label="Bằng chứng — dán ảnh, kéo thả tệp"`.
  - Dòng hướng dẫn nhỏ `text-[11px] text-slate-500` = `CHU_KHOI_BANG_CHUNG`, thay câu "Chưa có bằng chứng nào…" (dòng 131-135)
    khi chưa có mục nào.
  - **Dán:** lấy `clipboardData.files` (hoặc `items` kiểu `image/*` → `getAsFile()`); ảnh không tên/tên `image.png` → đổi tên
    `tenAnhDan(new Date(), file.type)` bằng `new File([f], ten, { type })`; tải từng tệp. Không có tệp mà chữ dán `laLienKet`
    → mở ô liên kết, điền sẵn địa chỉ (không tự lưu). Chữ thường → bỏ qua (không `preventDefault`).
  - **Kéo thả / chọn tệp:** tải **mọi** tệp (sửa `pick` dòng 80-87 đang chỉ lấy `files[0]`); `<input type="file" multiple>`.
  - Giữ nguyên ba luật ở chú thích dòng 22-26 (lỗi từng dòng + Thử lại, không đụng form cha).
- **YT-5** `ConfirmMeasurePanel`: lấy `reload` từ `useApi` (dòng 30) và truyền `onChanged={reload}` cho `BangChung` (dòng 99),
  để `attachmentCount` cập nhật và nút "Xác nhận đã thực hiện" sáng ngay sau khi tải thư. (Người thực hiện ở Task 9.)

**Xong khi:** typecheck xanh; bấm thử ở Task 11. Commit `PR-Form (6): Bằng chứng nhận Ctrl+V, kéo thả, nhiều tệp; nút Xác nhận sáng sau khi tải thư (YT-5)`.

- [x] Task 6 xong — `npm run check` xanh, 804 phép kiểm không đổi. Bấm thử để Task 11.

## Task 7 · Web: `QuickReport` — F07, lưu trước đính kèm sau (F-1), thẻ nhập bù (F-3), điểm chi tiết (S5)

**Files:** `web/src/modules/cases/QuickReport.tsx`; tạo `web/src/modules/cases/ChiTietKyNang.tsx` (chuyển
`ComponentsField` `CasePanel.tsx:733` và `componentsPayload` `CasePanel.tsx:787` sang, `CasePanel` import lại — không đổi hành vi
`OutcomeDialog`).

**Giao kèo phải giữ (đọc bản sau Pa):** props `open, onClose, studentId, studentName, cycleId, onDone, signal, students,
onPickStudent` không đổi; `signal` có thể mang `kind`, `scoreText`, `contextLabel` (Pa). Giữ dòng điểm, tiêu đề
"Tạo Case · …" và `topics = signal?.skill ? [signal.skill] : …` Pa đã thêm.

1. **F07 — kỹ năng theo chương trình.** `useApi('/students/{id}/case-topics?cycleId=')` khi `open && studentId && !signal`.
   `topics = signal?.skill ? [signal.skill] : (chuDe.data?.topics ?? [])`; đang tải → "Đang tải…" nhỏ; chưa chọn học viên
   (trang lớp) → "Chọn học viên trước." Nhãn: `ENTRY_SKILL_LABEL[k] ?? REGULAR_SKILL_LABEL[k] ?? k`. Đổi học viên (trang lớp)
   → xoá `topic`, `primaryCode` nếu không còn trong bộ mới. `issuesForTopic('writing')` đã có sẵn.
2. **F-1 — bước "Đã lưu".** State `daLuu: { id; tieuDe; gop: boolean; canEdit: boolean } | null`.
   - `send`/`sendBackfill` thành công: `invalidate(...)` như cũ, toast như cũ, **không** gọi `reset/onClose/onDone`; đặt `daLuu`
     từ phản hồi (`res.id`, `res.title`, `res.viewer.canEdit`; `gop = !!extra.mergeIntoExisting`).
   - Hàm `dong()` dùng cho ✕/Esc/nền của `Modal` **và** nút Xong: nếu `daLuu` → `const id = daLuu.id; reset(); onClose(); onDone?.(id)`;
     nếu chưa lưu → `onClose()` như cũ. `useEffect` theo `open`: mở lại thì `daLuu = null`.
   - Khi `daLuu`: thân Modal chỉ còn dòng `✓ Đã lưu Case «{tieuDe}»` (✓ nhỏ, màu chữ phụ — G-1; gộp: "✓ Đã ghi vào Case đang có
     «…»"), rồi `<BangChung ownerType="sos_case" ownerId={id} canEdit={canEdit} tieuDe="Bằng chứng" />`; chân Modal chỉ một nút
     **Xong** (`btn-primary`). Tiêu đề Modal giữ nguyên.
   - Trước khi lưu: dưới ô Mô tả thêm một dòng mờ "Ảnh, tệp, liên kết: thêm ngay sau khi lưu." (không thêm khối rỗng).
   - Nút lưu tab thường giữ "Ghi nhận"; tab nhập bù đổi chữ **"Ghi lại Case đã xong"** (g11-030).
3. **F-3 — thẻ phương án nhập bù (§22.4).** Mỗi thẻ `surface-2 rounded-lg p-2.5`, ba dòng cố định:
   dòng 1 ô mô tả toàn chiều rộng; dòng 2 `ChonNguoi nhom="giao_vien" studentId={studentId}` toàn chiều rộng (mặc định `Tôi`);
   dòng 3 `grid grid-cols-2 gap-2` hai ô ngày có nhãn nhỏ "Từ ngày" / "Đến ngày" (bỏ mũi tên "→" đứng một mình). Nút
   **Xoá** nhỏ có chữ ở góc phải trên của thẻ (chỉ khi > 1 thẻ). Lỗi của thẻ hiện ngay dưới thẻ đó (một dòng
   `text-[11px] text-rose-300`), dùng `nguoiThieu` + kiểm ngày như `submitBackfill` dòng 197-202 — không đẩy lệch thẻ khác.
   Khoảng "Từ ngày → đến ngày" của Case (dòng 368-375) cũng thành hai ô bằng nhau có nhãn. State `bfActions[i].nguoi: NguoiChon`;
   gửi `...nguoiThanhPayload(a.nguoi)`. Nút "+ Thêm phương án" giữ.
4. **S5 — Điểm chi tiết theo kỹ năng.** Trong tab nhập bù, sau "Kết quả cuối": `ComponentsField` với
   `category = categoryOf(topic)`, `ratio = chuDe.data?.ratio`, nhãn nút "+ Điểm chi tiết theo kỹ năng (không bắt buộc)";
   gửi `metrics: componentsPayload(...)` trong `sendBackfill`. Không có thành phần cho kỹ năng đó → không hiện.
5. **G-5:** hai `SectionNote` (dòng 355-360, 425-429) → một ⓘ nhỏ cạnh nhãn tab tương ứng (`<span title=… aria-label=…>ⓘ</span>`,
   hoặc component ⓘ chung nếu Pa/Rc1 đã thêm khi rebase). Nội dung rút còn một câu mỗi cái.
6. Modal nhập bù rộng hơn: `width="max-w-xl"` khi `mode === 'backfill'`.

**Xong khi:** typecheck xanh; mở form từ hồ sơ HV FT, HV lớp thường, trang lớp (chưa chọn em), dòng tín hiệu của Pa đều chạy
đúng ở Task 11. Commit `PR-Form (7): form Case — lớp thường có Writing, lưu rồi đính kèm tại chỗ, thẻ nhập bù 3 dòng, điểm chi tiết`.

- [x] Task 7 xong — `npm run check` xanh, 826 phép kiểm không đổi (không có phép kiểm máy chủ mới ở Task này). Tách
  `ComponentsField`/`componentsPayload` sang `ChiTietKyNang.tsx`, `CasePanel.tsx` import lại — `OutcomeDialog` không đổi hành vi
  (thêm `buttonLabel?` tuỳ chọn, mặc định giữ nguyên chữ cũ). Ba caller (`ClassOverviewPage`, `StudentDetailPage` × 2,
  `DongTinHieu`) không cần sửa: `onClose` đã đóng panel trước khi `onDone` chạy (bên trong `dong()` mới), nơi gọi đóng lại
  trong `onDone` là vô hại (idempotent). Bấm thử để Task 11.

## Task 8 · Web: người thực hiện PA học thuật + nút Sửa có lý do (nợ S2)

**Files:** `CasePanel.tsx` (ActionDialog 819-980), `CapNhatTuan.tsx` (64, 70, 82, 104-120, 212-216, 248-252),
`yThuc/CaseSosControls.tsx` (PresetPlanActions 66-158).

- `ActionDialog`: ô "Người thực hiện" (959-962) → `ChonNguoi nhom="giao_vien"` (mặc định `Tôi`); body thay
  `performerSelf/performerName` (864-865) bằng `...nguoiThanhPayload(nguoi)`. Bỏ hint "Bỏ trống nếu chính bạn làm…".
  `ActionDialog` không có `studentId` → không gợi ý trước khi gõ (chấp nhận), trừ khi `CasePanel` có sẵn `studentId` trong
  `data` để truyền — nếu có thì truyền.
- `CapNhatTuan` Điều chỉnh: `performer` → `NguoiChon | null` (null = không đổi), `ChonNguoi khongDoi={pa.performer ?? 'chưa có'}`;
  `adjustChanged` dùng `nguoi !== null`; `body.adjust = { …, ...nguoiThanhPayload(nguoi) }` (không có `performerSelf` ở
  `adjust` — `toi` → gửi `performerUserId: session.user.id`). Thay: `newPerformer` → `ChonNguoi` mặc định `Tôi`, body
  `newPlan: { …, ...nguoiThanhPayload(newNguoi) }`.
- `PresetPlanActions`:
  - **Sửa** (115-131): thêm ô `Lý do sửa (không bắt buộc)` một dòng, `maxLength={300}`, gửi `reason` trong
    `confirmNow({ description, followupDue, reason })` (route `/interventions/:id/confirm` đã nhận, routes 1172-1179).
  - **Thay** (145-146): ô chữ → `ChonNguoi nhom="giao_vien"`, body `...nguoiThanhPayload(nguoi)` thay 96-97.

- **Giao kèo với PR-Qb (không đổi tên thuộc tính):** mỗi mục PA học thuật trên dòng thời gian của `CasePanel` mang
  `data-pa-id={iv.id}` để Hành trình (Qb) mở ngăn Case rồi cuộn tới đúng PA bằng
  `querySelector('[data-pa-id="…"]')`. Chỗ gắn: `<li key={ev.key}>` ở `CasePanel.tsx:196`. Mục PA được dựng ở dòng 395
  (`key: \`i${iv.id}\``) — thêm trường `paId: iv.id` vào mục đó (các mục khác không có) và render
  `data-pa-id={ev.paId ?? undefined}` trên `<li>`. Chỉ thêm thuộc tính, không đổi bố cục.
- **KIỂM:** mở một Case có 2 PA, trong trình duyệt `document.querySelectorAll('[data-pa-id]').length === 2` và
  `document.querySelector('[data-pa-id="{id PA thứ hai}"]')` trả đúng mục PA đó (làm ở Task 11, kịch bản 5).

**Xong khi:** typecheck xanh. Commit `PR-Form (8): chọn người thực hiện khi lập, Điều chỉnh, Thay PA; Sửa gợi ý có lý do; data-pa-id cho Qb`.

- [x] Task 8 xong — `npm run check` xanh, 826 phép kiểm không đổi. Lệch kế hoạch có chủ ý: `CapNhatTuan` Điều chỉnh dùng
  `...nguoiThanhPayload(nguoi)` cho cả `toi` (gửi `performerSelf: true`) thay vì gửi thẳng `performerUserId: session.user.id`
  như bản kế hoạch gợi ý — vì `performerUserId` bị `laNguoiHopLe(..., 'giao_vien')` kiểm, QL tự ghi PA học thuật (được phép
  qua `SOS_EDIT anyScope`) sẽ bị 400 nếu gửi ID của chính họ; `performerSelf` cố tình bỏ qua kiểm vai (Task 3, "giữ hành vi
  cũ khi QL tự ghi"). Ghi vào đây theo đúng chỉ dẫn khi thấy kế hoạch lệch mã thật.

## Task 9 · Web: Ý thức — người thực hiện, Phụ trách (YT-9), Môn tự điền (YT-4)

**Files:** `ConfirmMeasurePanel.tsx`, `CreateMeasurePanel.tsx`, `XemPhuongAnPanel.tsx`, `RecordViolationPanel.tsx`.

- `ConfirmMeasurePanel`: ô 83-86 → `ChonNguoi nhom="nhan_vien"` mặc định `Tôi`; body dùng `nguoiThanhPayloadYThuc` (thay
  55-57, bỏ việc gửi `session.user.id`); `measureMissing(... performer: nguoiThieu(nguoi, true) === null)`. Dưới tiêu đề hiện
  một dòng mờ "Phụ trách: {ownerName}" nếu có (thêm `ownerName` vào kiểu `MeasureDetail` dòng 13-17 — máy chủ đã trả).
- `CreateMeasurePanel` (**YT-9**): sau khối "Loại phương án" thêm Field **Phụ trách** = `ChonNguoi nhom="nhan_vien"
  choNgoai={false} macDinhTrong="Mặc định: GVCN của lớp"` (value null → không gửi `ownerUserId`, máy chủ tự điền như cũ).
  Máy tính: "Loại" và "Phụ trách" cùng hàng không khả thi vì Loại là danh sách radio (B05) — đặt Phụ trách ngay dưới, cùng
  cột. Bỏ câu SectionNote về người phụ trách mặc định (dòng 126) vì ô đã nói.
- `XemPhuongAnPanel` dòng 21: đổi thứ tự `d.performedByName ?? d.performerName ?? '—'`; thêm dòng "Phụ trách" (`d.ownerName`).
- `RecordViolationPanel` (**YT-4**): đọc `defaultSkill` từ `similar.data` (dòng 64); state `daChonMon` (người dùng đã đụng ô
  Môn chưa). Chưa đụng và có `defaultSkill` → hiện sẵn môn đó trong ô. Gửi: tạo mới + chưa đụng → **không gửi** `skill`
  (bỏ khỏi body, dòng 86); đã đụng → gửi đúng giá trị (rỗng = `null`, chủ ý để trống). Sửa vi phạm (dòng 80) giữ như cũ.
  Hint giữ "Tự điền theo môn bạn dạy lớp này; để trống được."

**Xong khi:** typecheck xanh. Commit `PR-Form (9): Ý thức — chọn người thực hiện, Phụ trách PA xử lý, Môn tự điền`.

- [x] Task 9 xong — `npm run check` xanh, 826 phép kiểm không đổi. `CreateMeasurePanel` giữ lại nửa sau của `SectionNote` cũ
  (câu về hai nút Lưu/Xác nhận — không liên quan phụ trách) thay vì xoá cả khối, chỉ bỏ đúng câu về người phụ trách mặc
  định như kế hoạch nói.

## Task 10 · Web: chữ lớp thường ở `SkillBoard.tsx`

**Files:** `web/src/modules/cases/SkillBoard.tsx` (chỉ thêm trường vào kiểu, không đổi tên kiểu `SkillBoardRow` —
`JourneyTimeline.tsx` của Qb import nó).

Dòng đo trên main (đặc tả §6 ghi 203/412/917 — lệch, xem mục mâu thuẫn):
- **207** `'Đạt kỳ vọng'` → lớp thường (`row.ratio`) ghi **"Đạt"**; FT giữ.
- **415** chip `MT{a.attemptNo}` → `a.attemptKind && a.attemptKind !== 'mock' ? ATTEMPT_KIND_SHORT[a.attemptKind] : \`MT${a.attemptNo}\``;
  ngày trong chip dùng `ngay()` (G-6) thay `fmtDate` nếu hàm chung đã có.
- **706** giữ (đã phân biệt `row.ratio`); **797** giữ; **808** `title` của điểm: lớp thường dùng `ATTEMPT_KIND_SHORT[pt.attemptKind]`
  và bỏ phần "kỳ vọng".
- Kiểu: `attempts: { attemptNo; week; attemptKind?: string | null }[]`, `points[]` thêm `attemptKind?: string | null`.
- Grep lại file tìm `kỳ vọng`/`MT\$\{` còn hiện cho lớp thường; FT không đổi chữ.
- "Số MT đánh lại từ 1" nằm ở `StudentDetailPage.tsx:234` (Qb) — **không** sửa ở đây.

Commit `PR-Form (10): SkillBoard lớp thường — Đạt, Giữa khoá/Cuối khoá thay MT{n}`.

- [x] Task 10 xong — `npm run check` xanh, 826 phép kiểm không đổi. Grep lại file: mọi `kỳ vọng`/`MT\$\{` còn hiện đều đã có
  điều kiện `row.ratio`/`attemptKind` bảo vệ, không lộ cho lớp thường; FT giữ nguyên chữ cũ.

## Task 11 · Bấm thử theo vai + 375px (một lần), đẩy PR

Máy chủ thử (theo ghi nhớ "máy chủ dev trong worktree"): trong worktree `npm run seed` → `PORT=4167 node
dist-server/server/src/index.js` (nền) → file cấu hình Vite **tạm** ở gốc worktree (`port: 5367, strictPort`, proxy `/api` →
`127.0.0.1:4167`, alias `@shared`) → `npx vite --config <file>`; xoá file tạm sau khi thử. Đăng nhập demo bằng
`fetch('/api/demo/session', { method: 'POST', body: { userId } })` (GVCN 7, GVBM 9, QL 2, GVBM W2 10). Chữ tiếng Việt gửi qua
`node -e "fetch(...)"`, không `curl -d`.

Kịch bản (mỗi kịch bản ≥ 1 ảnh `thiet-ke/anh/pr-form/NN-ten.png`):
1. GVBM (9) · hồ sơ HV FT · + Case → lưu → panel còn mở, "✓ Đã lưu", Ctrl+V một ảnh chụp màn hình → hiện `anh-chup-….png`;
   kéo thả 2 tệp; dán một liên kết → ô liên kết điền sẵn → Lưu; bấm Xong → Case mở ở ngăn phải, thấy 4 bằng chứng.
2. GVCN (7) · HV lớp thường MB-FOU 12 · + Case → thấy **L R W S**, chọn Writing → lưu được.
3. GVCN · tab "Đã xong từ trước": 2 thẻ phương án — một chọn GV (gõ "tra" → chưa tìm, gõ "tran" → có), một "Người ngoài";
   "+ Điểm chi tiết theo kỹ năng"; lưu → khối Bằng chứng hiện.
4. Dòng tín hiệu lớp thường ở Tổng quan (Pa) → Tạo Case → điền sẵn điểm còn, lưu → Bằng chứng → Xong → dòng biến mất.
5. GV · Case có PA đang chạy → Cập nhật tuần → Điều chỉnh: ô người "Không đổi · hiện: …", đổi sang GV khác; Thay: `Tôi` mặc định.
   Case SOS FT có PA gợi ý → Sửa → có ô "Lý do sửa". Case có 2 PA → kiểm `[data-pa-id]` như Task 8 (giao kèo Qb).
6. QL (2) · Ý thức: tạo PA xử lý Thư cảnh cáo 1 với **Phụ trách** chọn người → Xác nhận đã thực hiện: tải thư → nút sáng
   ngay (YT-5); người thực hiện mặc định "Tôi · …".
7. GVBM · Ghi nhận vi phạm → ô Môn đã điền sẵn môn mình dạy; lưu → vi phạm có môn.
8. Hồ sơ HV lớp thường → bảng kỹ năng không còn "Đạt kỳ vọng", chip ghi "Giữa khoá".
9. **375px:** kịch bản 1 và 3 — Modal không cuộn ngang, danh sách chọn người không bị cắt, thẻ nhập bù ba dòng không vỡ.

- [ ] `npm run check` xanh lần cuối, ghi số phép kiểm (≥ B + 25).
- [ ] Push, mở PR (tiêu đề `PR-Form: chọn người lưu ID, bằng chứng ngay trong form, Case Writing lớp thường`), mô tả gồm
  bảng Q, danh sách ảnh, và dòng "Không migrate". Báo planning (không tự merge, không tự rà).

---

## Mâu thuẫn nguồn ↔ mã thật (đã xử lý như trên)

1. Giao việc ghi "có migrate (thêm cột ID)" — **mã đã có đủ cột ID** ở cả bốn bảng (Q1) → không migrate, không cần phép kiểm
   migrate lặp.
2. Đặc tả §6: `SkillBoard.tsx:203,412,917` — thật là **207, 415, 808** (file chỉ 827 dòng); câu "Số MT đánh lại từ 1" ở
   `StudentDetailPage.tsx:234` (Qb), không ở SkillBoard.
3. Giao việc ghi `chuanHoaDieuChinh` trong `cases.ts` — thật ở `server/src/cases/planRevisions.ts:30`. Lỗi đúng như mô tả:
   Giữ nguyên dùng `COALESCE(followup_due, planEndDefault)` (cases.ts:2802-2811) nhưng Điều chỉnh ghi đè lại NULL qua
   `apDungDieuChinh` (planRevisions.ts:91).
4. Kiểm kê F-2 nói `PeoplePicker` có sẵn chỉ việc dùng — nhưng nó gọi `/ref/people` (đòi `MEETING_VIEW`, GV bị 403), không có
   ngưỡng 3 ký tự, không tìm không dấu, danh sách `absolute` bị cắt trong Modal → phải làm ô mới (Q2).
5. K2-6d trái với phép kiểm hiện có `yThuc.tests.ts:767` → sửa phép kiểm (Q9).
6. S5: máy chủ `backfillCase` đã nhận `metrics` (cases.ts:1120, 1205) — chỉ thiếu ở web.
7. F07: máy chủ đã nhận `writing` cho lớp thường (cases.ts:426-434, S1); form chỉ có `ENTRY_SKILLS` (QuickReport.tsx:91) và
   **không biết** em học chương trình nào (được mở từ trang lớp không có `cycleId`) → cần route `case-topics`.
8. `QuickReport.tsx` cũng bị Pa sửa (Task 11 của Pa) — kiểm kê §5.2 chưa ghi ✖ Pa cho file này.
9. §3.11 "Loại + Phụ trách trên một hàng" — Loại hiện là danh sách radio dọc (B05), không đặt cùng hàng được; Phụ trách đặt ngay dưới.
10. Ngoài phạm vi nhưng thấy khi soát: `StudentManagePanel.tsx:345` ô "Người tiếp nhận" (chuyển lớp) gọi `/ref/people` → GVCN
    nhận 403, ô rỗng. Xem mục "Chuyển cho PR khác".

## Chuyển cho PR khác

| Việc | Giao | Ghi chú |
|---|---|---|
| Ô "Người tiếp nhận" ở `StudentManagePanel.tsx:345` (panel chuyển lớp) gọi `/ref/people` → GVCN bị từ chối (403), ô rỗng | **PR-LT** (sau deploy) | LT nên dùng đường `/ref/nguoi` mới của PR-Form (nhóm `nhan_vien` hoặc `giao_vien` theo luật chuyển lớp) + ô `ChonNguoi`; PR-Form **không** chạm file này |

## Nhật ký

| Ngày | Task | Ghi chú (model người code · số phép kiểm · lệch plan · quyết định tại chỗ) |
|---|---|---|
| 23/09 | 0 | Sonnet 5 (session code). Worktree `.claude/worktrees/pr-form-chon-nguoi` từ `origin/main` 61ae2dd. PR-Pa **chưa merge** vào `origin/main` (chỉ mới kế hoạch #62; code Pa đang ở repo phụ `pisa-pr-pa` nhánh `pr-pa-tong-quan`, chưa vào `main`) → làm Task 1–6 trước, không chạm `QuickReport.tsx`; kiểm lại trước Task 7. `npm ci` xong, `npm run check` → **B = 779** đúng như dự kiến. |
| 23/09 | 1–6 | Sonnet 5. Task 1 (785=779+6), Task 2 (791=785+6), Task 3 (798=791+7), Task 4 (804=798+6), Task 5 (typecheck, không phép kiểm mới), Task 6 (typecheck, không phép kiểm mới) — tất cả xanh, mỗi Task một commit. Trước Task 7: `git fetch origin` lại — PR-Pa **vẫn chưa merge** (đầu `origin/main` vẫn là #67, không có commit merge Pa nào). **Dừng theo đúng chỉ dẫn, báo planning** — chưa làm Task 7 (đụng `QuickReport.tsx`). |
| 23/09 | 6→7 | Sonnet 5. Chủ sản phẩm báo Pa đã merge (PR #68). `git fetch origin` xác nhận; `git rebase origin/main` — xung đột duy nhất ở `shared/domain/index.ts` (thêm dòng export cạnh dòng Pa thêm) và `run.ts` (khối gọi test cạnh khối Pa thêm), cả hai giữ CẢ HAI khối, không mất gì. `npm run check` sau rebase → **826 = 804 + 22 (test Pa)** xanh, typecheck xanh. `origin/main` sau đó có thêm 2 commit đặc tả (không đụng code) — không rebase lại. Tiếp Task 7. |
