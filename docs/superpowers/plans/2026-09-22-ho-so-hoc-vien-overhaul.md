# Hồ sơ học viên + Ý thức & Phối hợp theo prototype v3 — Implementation Plan (PR-HV)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task,
> in order. Steps use checkbox (`- [ ]`) syntax — tick each one in THIS file as you finish it. Tasks marked 🛑 are
> **gates**: stop, report to the owner, and wait for an explicit answer before continuing.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Fable 5.1 · High** |
| Phương án B | **Opus 5 · High** |
| Người rà soát | Session planning (Opus 5) — **khác model người code**. Nếu người code là Opus (phương án B) thì người rà là Fable 5.1 hoặc Sonnet 5; ghi rõ vào Nhật ký |
| Số PR | **Một PR**, nhánh `pr-hv-ho-so-hoc-vien`, không draft, **không tự merge** |
| Vì sao không chia | (1) Thành phần dùng chung (`DongThoiGian`, `TheSos`, `OSoNho`, `HangTab`) dùng ở **cả** hồ sơ học viên lẫn hồ sơ lớp — chia PR thì PR đầu dựng thành phần mà chưa ai dùng, PR sau sửa lại. (2) Đổi chữ "biện pháp" → "phương án" phải vào **cùng lúc** trên mọi màn: tách ra là có một khoảng thời gian màn này ghi "biện pháp", màn kia ghi "phương án" cho cùng một thứ — đúng lỗi "một khái niệm hai chữ" mà `TU_DIEN_VA_CHU.md` cấm. (3) Chạy song song PR-Z2b: gộp một PR thì chỉ có một lần gộp `main` ở cuối (Task 9) |

**Goal:** Dựng lại hồ sơ học viên thành 3 tab (`Học thuật` mặc định · `Ý thức & Phối hợp` · `Hành trình`) dưới đầu
trang + 4 ô số mới (Q7); thẻ case học thuật kiểu thẻ SOS với mỗi phương án một khối 3 phần (Q8); tab Ý thức & Phối
hợp của hồ sơ học viên và hồ sơ lớp theo prototype v3 (dòng thời gian lưới, ô số nhỏ, thẻ Phối hợp SOS); đổi mọi chữ
"biện pháp (xử lý)" người dùng thấy thành "phương án (PA)" và bỏ "Hãy" ở đầu câu nhắc.

**Architecture:** Chỉ đổi **giao diện và chữ hiển thị**. Luật nghiệp vụ, quyền, API, tên trong mã và database giữ
nguyên (A1). Hai chỗ máy chủ được thêm **trường đọc** (không đổi luật): `attachmentCount` trên thẻ case của
`/students/:id/skill-board` (để nhãn `Bằng chứng (n)` không phải tải tệp) và `overdue` + câu có động từ cho
`headline.next` của `/students/:id` (ô `Việc cần làm tiếp`). Luật hiển thị thuần (tab từ địa chỉ, ô Test gần nhất,
tiến độ PA, việc tiếp theo của PA, đếm vi phạm theo nhóm) đặt ở **`shared/domain/hoSoHocVien.ts`** để kiểm được bằng
harness máy chủ — giao diện React chỉ vẽ (đúng cách `display.ts` + `<KetQuaDot>` đã làm ở PR-E).

**Tech Stack:** TypeScript · React 18 + Vite 5 · Tailwind 3.4 (lớp tuỳ ý phải là **chuỗi tĩnh**, không ghép chuỗi
động) · Express 4 · `libsql` · harness kiểm thử tự viết `server/src/tests/run.ts` (`check` / `assert` /
`assertThrows`, **không phải** Jest; web **không** có bộ kiểm thử riêng).

**Spec:** `docs/superpowers/specs/2026-09-22-ho-so-hoc-vien-overhaul-design.md` (nguồn sự thật: D1–D5, A1–A9, §4
bố cục, §5 chữ, §6 không làm, §7 nghiệm thu) · hình: `thiet-ke/tham-khao/ho-so-hoc-vien-v3.html`,
`thiet-ke/tham-khao/ho-so-lop-v3.html` · bộ chữ: `thiet-ke/TU_DIEN_VA_CHU.md` · việc gốc: `plan.md` §22.7 Q7, Q8 ·
`thiet-ke/BAN_DO_OVERHAUL.md` §7.

**Số dòng trong plan này** đã đo trên `main` @ `0f24805` (22/09/2026). Trước khi sửa một dòng, mở file xem lại —
lệch vài dòng là bình thường, lệch nội dung thì 🛑 hỏi.

---

## Global Constraints

- **🆕 22/09 (tối) — PR-Z2b đã xong (PR #49), có thể đã merge trước khi bạn bắt đầu.** Ở Task 0, chạy
  `gh pr view 49 --json state -q .state`:
  - **`MERGED`** → **bỏ đóng băng**: không dùng `CHO_Z2B` (để mảng rỗng ngay từ Task 1), làm luôn phần chữ của Task 9
    trong Task 1 (đọc Task 9 Step 3–5 để biết chỗ nào), rồi đánh dấu Task 9 "đã gộp vào Task 1" trong Nhật ký.
  - **`OPEN`** → làm đúng như kế hoạch (đóng băng tới Task 9).
  - Dù trường hợp nào: PR-Z2b đã thêm/sửa các file sau — kiểm lại số dòng trước khi sửa, và **đưa chúng vào phạm vi
    đổi chữ** (D3 "bỏ Hãy" áp cả câu báo lỗi của lệnh dòng lệnh, vì chủ sản phẩm đọc chúng khi chạy `TRIEN_KHAI.md`):
    `server/src/platform/accounts.ts` (8 chỗ "Hãy" — Z2b sửa 2 dòng khác trong file này, gộp `main` cẩn thận),
    `server/src/ops/initBanChinh.ts` dòng ~31 (`— hãy chọn mã khác.` → `— chọn mã khác.`) và ~80
    (`Hãy chọn mật khẩu mới.` → `Chọn mật khẩu mới.`). `server/src/seed/duLieuNen.ts` (mới, dữ liệu nền dùng chung
    cho seed và bản chính) **được quét** — hiện không có chữ cần đổi; đừng đưa nó vào danh sách loại trừ vĩnh viễn
    `server/src/seed/` của Task 9 Step 3 (loại trừ đó chỉ dành cho chuyện kể của bộ demo).

- **Không đổi luật nghiệp vụ.** Ai được làm gì, hạn, cách đếm, trạng thái — giữ nguyên. Mọi nút hiện nay ẩn/hiện
  theo quyền nào thì sau PR vẫn theo đúng quyền đó (`canEdit`, `canClose`, `canManageDiscipline`,
  `canRecordViolation`, `canAct`, `canManage`, `canRecord`). Thấy luật có vẻ sai → ghi `plan.md` mục 12, **không sửa**.
- **A1 — tên trong mã và database không đổi**: `measure`, `MeasureDetail`, `MEASURE_KIND*`, `discipline_measures`,
  `ownerType: 'discipline_measure'`, mã chỉ số `bien-phap-*`, route `/measures/*`, tên file `CreateMeasurePanel.tsx`,
  `ConfirmMeasurePanel.tsx`… **đều giữ**. Chỉ đổi **chuỗi người dùng thấy**. Chú thích trong mã (`//`, `/* */`) được
  giữ chữ cũ — không đi sửa chú thích hàng loạt.
- **Số phép kiểm chỉ tăng.** Ghi số sau mỗi task vào Nhật ký. Sửa một phép kiểm cũ **chỉ** được khi phép đó khẳng định
  đúng câu chữ mà D1/D3 đổi — và plan này liệt kê sẵn từng phép như vậy. Phép kiểm khác đỏ → `superpowers:systematic-debugging`,
  không sửa phép kiểm.
- **Chữ giao diện lấy từ spec §5 và `TU_DIEN_VA_CHU.md`** (đã cập nhật ở Task 1). Chữ tiếng Anh trong prototype
  (`Violation`, `Academic support`) → tiếng Việt (A9). Không tự đặt chữ mới ngoài các bảng trong plan này; cần chữ mới
  → thêm vào `TU_DIEN_VA_CHU.md` §8 trong cùng commit và ghi Nhật ký.
- **Không chép CSS của prototype.** Dùng nhãn có sẵn trong `web/src/ui/ui.tsx` (`Status`, `Level`, `Alert`, `Info`,
  `Outcome`, `Card`, `Empty`, `SectionNote`), lớp `btn btn-sm btn-primary btn-ghost field link`, biến màu
  `var(--line)`, `var(--surface)`, `var(--surface-2)`, `var(--accent*)`. **Luật màu của `ui.tsx` thắng màu của
  prototype:** xanh lá **chỉ** dành cho `<Outcome>` (kết quả học tập) — nên "Phương án đã thực hiện" dùng
  `Status kind="done"` (xám ✓), **không** xanh lá (xem Self-review, quyết định J1).
- **Khổ 375px:** không cuộn ngang cả trang; lưới tự xếp dọc dưới `md` (768px — gần nhất với ngưỡng 750px của prototype).
  Hàng tab được cuộn ngang **bên trong** chính nó (`overflow-x-auto`), không đẩy trang.
- **🧊 Đóng băng vì PR-Z2b chạy song song** — KHÔNG chạm các file sau cho tới **Task 9** (và Task 9 chỉ chạy sau khi
  PR-Z2b đã merge vào `main`): `server/src/db.ts`, `server/src/migrate.ts`, `server/src/migrate/run.ts`,
  `server/src/moiTruong.ts`, `server/src/platform/khoTep.ts`, `server/src/platform/attachments.ts`,
  `server/src/yThuc/measures.ts`, `server/src/ops/*`, `server/src/seed/*`, `server/src/tests/banChinh.tests.ts`,
  `TRIEN_KHAI.md`, `package.json`. **Đọc** và **import** các file này thì được; **sửa** thì không.
- **Máy chủ dev:** chủ sản phẩm có thể đang chạy demo (`npm run dev`, cổng **4000/5173** — `vite.config.ts` cố định
  proxy `/api` → 4000 nên không chạy được bản thứ hai ở cổng khác). **Hỏi trước** khi bật máy chủ dev. Worktree có
  database riêng (`data/pisa-demo.sqlite` trong thư mục worktree) — `npm run seed` ở worktree không đụng dữ liệu của
  chủ sản phẩm.
- **Không làm** (spec §6): ô số bấm được (PR-R) · Q9 Hành trình (PR-Q) · hồ sơ lớp 4 tab (PR-Q) · đổi tên trong
  mã/database · toast `Hoàn tác`, nút `Ghi vi phạm` ở `ClassRoster` và các việc K2-6 khác ngoài `[Mở]/[Xem]`.

## Hướng dẫn riêng cho model thực thi (Fable / Sonnet / Opus)

1. **Làm đúng thứ tự Task 0 → 10.** Mỗi task kết thúc bằng `npm run check` xanh và **một** commit (tiền tố
   `PR-HV (n):`). Không gộp task, không nhảy task. Task 9 là gate — nếu Z2b chưa merge thì làm Task 10 phần không phụ
   thuộc (xem Task 10 Step 1) rồi **dừng hỏi**, không mở PR.
2. **Đọc cả task trước khi gõ.** Mục *Interfaces* ghi tên hàm/prop mà task sau dựa vào — đặt **đúng tên đó**.
3. **Diff của mỗi task chỉ chạm file ở mục *Files*.** Cần chạm file khác → ghi lý do vào Nhật ký trước.
4. **Gặp tình huống plan không nói tới** (dữ liệu thiếu trường, luật có vẻ phải đổi, chữ chưa có trong bảng): dừng,
  ghi Nhật ký, hỏi. Không đoán. Riêng dữ liệu thiếu trường: **được** thêm trường đọc ở `server/src/cases/cases.ts`
  hoặc `server/src/students/profile.ts` (không đóng băng) theo TDD, ghi Nhật ký; **không** được thêm ở file đóng băng.
5. **Lệnh kiểm sau mỗi task:** `npm run check` (= build máy chủ + toàn bộ phép kiểm + typecheck web và máy chủ).
6. **Windows + PowerShell** trên máy chủ sản phẩm. `rg` (ripgrep) có sẵn qua công cụ Grep; lệnh grep trong plan viết
   theo cú pháp `rg`.
7. **Chủ sản phẩm không đọc code** — khi hỏi, nói theo "bấm vào đâu, thấy gì", tiếng Việt cơ bản.
8. **Skill theo từng loại việc:**

   | Lúc | Skill |
   |---|---|
   | Bắt đầu | `superpowers:using-git-worktrees` (nhánh **`pr-hv-ho-so-hoc-vien`** từ `main` mới nhất) → `superpowers:executing-plans` |
   | Mọi hàm thuần / trường máy chủ mới (Task 1 phép quét chữ, Task 2 `parseHoSoTab`, Task 3 `ketQuaTestGanNhat` + `headline.next`, Task 4 `demTheoNhomViPham`, Task 6 `tienDoCase` / `viecTiepPhuongAn` / `attachmentCount`) | `superpowers:test-driven-development`: viết phép kiểm → chạy thấy **đỏ** → viết mã → **xanh**. Luật ở `shared/domain/hoSoHocVien.ts`, phép kiểm ở `server/src/tests/hoSoHocVien.tests.ts` (web không có harness — đừng dựng Jest/Vitest) |
   | Quyết định hình ảnh **bên trong** khung của spec (khoảng cách, cỡ chữ, cột nào co) | `frontend-design` — **chỉ** để làm đẹp trong khung đã chốt, **không** đổi bố cục, không thêm khối, không đổi chữ |
   | Phép kiểm đỏ bất ngờ, màn trắng, lỗi console | `superpowers:systematic-debugging` |
   | Trước khi nói "xong" một task | `superpowers:verification-before-completion` — dán kết quả lệnh thật; với task giao diện: ảnh chụp desktop + 375px vào `thiet-ke/anh/pr-hv/` |
   | Sau Task 9 (hoặc sau Task 8 nếu Task 9 còn chờ), trước khi mở PR | `superpowers:requesting-code-review` (**một** agent rà diff theo plan này) → `superpowers:receiving-code-review` |
   | Cuối | `superpowers:finishing-a-development-branch` — PR **không draft**, **không tự merge** |

---

## File Structure

| File | Tạo / Sửa | Task | Trách nhiệm |
|---|---|---|---|
| `thiet-ke/TU_DIEN_VA_CHU.md` | Sửa | 1 | Luật D1 (Phương án/PA, màn trộn `PA xử lý`/`PA học thuật`), luật D3 (bỏ "Hãy"), §8 chữ mới của PR-HV |
| `shared/domain/hoSoHocVien.ts` | **Tạo** | 1–6 | Luật hiển thị thuần: `HO_SO_TABS`, `parseHoSoTab`, `ketQuaTestGanNhat`, `demTheoNhomViPham`, `dangChay`, `tienDoCase`, `viecTiepPhuongAn` |
| `shared/domain/index.ts` | Sửa | 1 | `export * from './hoSoHocVien.ts';` |
| `shared/domain/metrics.ts`, `yThuc.ts`, `people.ts`, `sos.ts` | Sửa | 1, 8 | Chữ hiển thị (bảng Task 1, Task 8) |
| `server/src/tests/hoSoHocVien.tests.ts` | **Tạo** | 1–6, 9 | Mọi phép kiểm của PR-HV, gồm phép quét chữ D1/D3 |
| `server/src/tests/run.ts` | Sửa | 1 | Đăng ký `runHoSoHocVienTests` (chèn **trước** khối `// ==== PR-J`, xa khối PR-Z2 để tránh xung đột với Z2b) |
| `server/src/tests/yThuc.tests.ts`, `sosV3.tests.ts` | Sửa | 1, 9 | Chỉ các phép khẳng định câu chữ bị đổi (liệt kê ở Task 1, Task 9) |
| `web/src/ui/HangTab.tsx` | **Tạo** | 2 | Hàng tab gạch chân (tab chính, tab con), số đếm và dấu ⚠ trên nhãn |
| `web/src/modules/students/StudentDetailPage.tsx` | Sửa | 1, 2, 3 | Khung 3 tab + `?tab=`, 4 ô số Q7 |
| `server/src/students/profile.ts` | Sửa | 3 | `headlineOf`: câu có động từ + `overdue` + ứng viên "Cập nhật PA" chưa quá hạn |
| `web/src/ui/OSoNho.tsx` | **Tạo** | 4 | Ô số nhỏ (nhãn + số) |
| `web/src/ui/DongThoiGian.tsx` | **Tạo** | 4 | Lưới dòng thời gian `ngày · cột 2 · nội dung · cuối`, biến thể `gon`, cột tick |
| `web/src/modules/yThuc/PhoiHopSosSection.tsx` | Sửa | 1, 4 | `TurnRow` → **`export function TheSos`** (thẻ 3 cột); prop `cot1` thay `showStudentName` |
| `web/src/modules/yThuc/StudentYThucSection.tsx` | Sửa | 1, 5 | Tab Ý thức & Phối hợp của hồ sơ HV theo §4.3 |
| `web/src/modules/yThuc/XemPhuongAnPanel.tsx` | **Tạo** | 5 | Hộp chỉ đọc một phương án xử lý (nút `Xem`, K2-6) |
| `web/src/modules/yThuc/RecordViolationPanel.tsx` | Sửa | 1, 5 | Tiêu đề `Ghi nhận vi phạm`; nút `Xoá vi phạm` trong form sửa (prop `onDelete`) |
| `web/src/modules/yThuc/ClassYThucCard.tsx` | Sửa | 1, 7 | Tab Ý thức & Phối hợp của hồ sơ lớp theo §4.5, giữ logic K2/K3 |
| `web/src/modules/yThuc/CreateMeasurePanel.tsx`, `ConfirmMeasurePanel.tsx`, `DeleteViolationConfirm.tsx`, `YThucAnalysisView.tsx`, `CaseSosControls.tsx` | Sửa | 1 | Chữ hiển thị |
| `web/src/modules/cases/SkillBoard.tsx` | Sửa | 6 | `CaseCardView` → `TheCase`, `PlanRow` → `KhoiPhuongAn` (§4.2, Q8) |
| `server/src/cases/cases.ts` | Sửa | 1, 6 | Bỏ "Hãy"; `caseCardOf` thêm `attachmentCount` |
| `web/src/modules/cases/QuickReport.tsx`, `CasePanel.tsx`, `web/src/modules/classes/ClassCreatePanel.tsx`, `web/src/modules/platform/WelcomePage.tsx` | Sửa | 1 | Bỏ "Hãy" |
| `server/src/{auth.ts, cases/sosAuto.ts, classes/classes.ts, fasttrack/attempts.ts, fasttrack/cycles.ts, fasttrack/skillSchedule.ts, normal/regular.ts, platform/accounts.ts, platform/sysconfig.ts, routes/helpers.ts, yThuc/access.ts, yThuc/phoiHop.ts, yThuc/violations.ts, yThuc/thongKe.ts}`, `scripts/check-node.mjs` | Sửa | 1 | Bỏ "Hãy" / đổi "biện pháp" trong câu báo |
| `server/src/worklist/mywork.ts`, `web/src/modules/worklist/BranchPulse.tsx`, `web/src/modules/cases/IssueAnalysis.tsx`, `web/src/modules/cases/CaseBoardPage.tsx` | Sửa | 8 | Màn trộn: `PA học thuật` |
| `server/src/yThuc/measures.ts`, `server/src/migrate.ts`, `server/src/seed/seed.ts` | Sửa | **9 🛑** | Chữ ở file đóng băng — chỉ sau khi Z2b merge |
| `thiet-ke/anh/pr-hv/*.png` | **Tạo** | 0, 10 | Ảnh trước/sau |
| `plan.md`, `thiet-ke/BAN_DO_OVERHAUL.md`, `CODE_MAP.md` | Sửa | 10 | Đánh dấu Q7/Q8/K2-6 xong ở PR-HV, lịch sử §14, bản đồ mã |

---

## Kiểu dữ liệu thật mà giao diện dùng (đã đọc mã — đừng đoán lại)

- **Thẻ case** (`web/src/modules/cases/SkillBoard.tsx:47–71`, `type CaseCard`, dựng ở `server/src/cases/cases.ts`
  `skillSupportBoard` ~1927 + `caseCardOf` ~2256): `id, title, status, topic, sos{fromSos, hasCause,
  unconfirmedPlanId, awaitingCause, dueOn, dismissed{code,label,text}|null}, urgency, sosLevel, carriedOver,
  parallel, openedOn, touchedOn, issueCode, issueLabel, summary, canEdit, canClose, closeBlockers[], plans[],
  attempts[{attemptNo, week}], followUntil, followOverdue, outcomeLabel, outcomeNote, closedOn, backfilledBy,
  backfilledOn`. **Thiếu:** số bằng chứng → Task 6 thêm `attachmentCount: number`.
- **Phương án học thuật** (`SkillBoard.tsx:29–46`, `type Plan`): `id, kind, kindLabel, name, preset, confirmedAt,
  performer, status ('planned'|'started'|'completed'…), statusLabel, startedOn, completedOn, actionDue,
  actionOverdue, followupDue, followupOverdue, pendingApproval, approvalDue, lastOutcome, lastOutcomeLabel,
  lastOutcomeOn, lastNote, updates[{on, outcome, label, by, note, cycleNo, late}]`. → `k/n PA có kết quả` tính được:
  `k = plans.filter(p => p.lastOutcome !== null).length`. **Không thiếu gì.**
- **Hàng kỹ năng** (`SkillBoard.tsx:72–99`, `type Row`): có `short`, `label`, `band`, `missed`, `ratio`, `cases[]`…
- **Hồ sơ** (`server/src/students/profile.ts` `studentProfile` 492–895): `attempts[]` (sắp **mới nhất trước**,
  `ORDER BY a.attempt_no DESC` dòng 522) mỗi lượt `{id, attemptNo, kind, status, classCode, periodCode, weekStart,
  mode ('ielts'|'ratio'), caseId, caseStatus, expectation, bands, overall, skills, scored, required, complete,
  provisional, sosLevel, scopeNote}` (dòng 535–560); `headline {below[], signals[], openCases, next {text, due} | null}`
  (dòng 439–489 — **thiếu `overdue`**, `HeaderStats` hiện đọc `next.overdue` nên màu quá hạn **chưa bao giờ** hiện →
  Task 3 thêm); `pendingSignals[]`; `viewer {canEdit, canPlanWeek, canReport, canClose, canRecordViolation,
  canManageDiscipline}`; `currentClass {id, code, kind, branchName, programme, coreTeacher}`; `cycle {…, ratio,
  target, targetRevisions[], outcome, baseline, endWeek}`; `episodes`, `allEpisodes`, `journeyStrip`, `progress`.
- **Vi phạm** (`GET /students/:id/violations`, `server/src/yThuc/violations.ts:38–56` `ViolationView`): `id, studentId,
  studentName, studentCode, classId, classCode, cycleId, category, categoryLabel, skill, skillLabel, occurredOn,
  reportedOn, reportedBy, reportedByName, description, state ('unhandled'|…), stateLabel, ageDays, ageLabel ('⚠9n'
  khi chưa xử lý quá 5 ngày, ngược lại ''), createdAt, updatedAt`.
- **Phương án xử lý** (`GET /students/:id/measures` và `GET /measures/:id`, `server/src/yThuc/measures.ts:32–57`
  `MeasureDetail`): `id, studentId, studentName, kind, kindLabel, customName, status ('preparing'|'done'),
  statusLabel, ownerName, note, performedOn, performedByName, performerName, participants, confirmedByName,
  confirmedAt, createdAt, violations: ViolationView[], violationCount, attachmentCount, evidenceHint, canManage`.
  → nút `Xem` (chỉ đọc) có đủ dữ liệu. **Không thiếu gì.**
- **Cảnh báo 5 ngày** (`GET /students/:id/violation-warning`): `{ message: string }` (rỗng khi không có).
- **Phối hợp SOS** (`GET /students/:id/phoi-hop-sos` → `{studentId, rows: CoordTurn[], pendingCount, canAct}`;
  `GET /classes/:id/phoi-hop-sos` → `{classId, rows, pendingCount}`); `CoordTurn` (`PhoiHopSosSection.tsx:20–25`):
  `attemptId, attemptNo, studentId, studentName, classCode, sosLevel, skillLabels[], summary{done, active, label:
  '2/3', complete}, actions[{id, kind, name, status: 'pending'|'done'|'removed', performedOn, performerName,
  removeReasonLabel, …}], canAct`.
- **Bảng Ý thức của lớp** (`GET /classes/:id/y-thuc`, `server/src/yThuc/board.ts:22–44`): `canManage, canRecord,
  warning{activeCount, message}, unhandled{students[{studentId, studentName, count, oldestAgeDays, warningActive,
  violations[]}]}, preparing: MeasureDetail[], history, recentByStudent`. **Thiếu:** mã và trạng thái học viên cho
  dòng phụ `FT · đang học` → dùng `/classes/:id/roster` **đã được tải sẵn** trong `ClassYThucCard` (mỗi dòng có
  `id, studentCode, fullName, status`) — không cần máy chủ.

---

### Task 0: Chuẩn bị

**Files:** chỉ đọc; tạo thư mục `thiet-ke/anh/pr-hv/`.

- [x] **Step 1:** Gọi `superpowers:using-git-worktrees`, tạo nhánh **`pr-hv-ho-so-hoc-vien`** từ `main` mới nhất
      (`git fetch origin` trước). Kiểm worktree **có** ba file: `docs/superpowers/specs/2026-09-22-ho-so-hoc-vien-overhaul-design.md`,
      `thiet-ke/tham-khao/ho-so-hoc-vien-v3.html`, `thiet-ke/tham-khao/ho-so-lop-v3.html` (và chính plan này).
      Thiếu → 🛑 dừng, báo session planning: "spec/prototype chưa được đưa lên `main`".
- [x] **Step 2:** `npm install` rồi `npm run check`. Ghi `N0` (số phép kiểm) vào Nhật ký. (Sau PR-Z2a: 597; có thể hơn.)
- [x] **Step 3:** Ghi vào Nhật ký: `git log origin/main --oneline -5` và PR-Z2b đã merge chưa (`gh pr list --state merged --search "Z2b"`
      hoặc hỏi). Chưa merge là **bình thường** — Task 9 sẽ chờ.
- [x] **Step 4:** Đọc hết spec; mở hai prototype bằng trình duyệt (file tĩnh, không cần máy chủ); đọc
      `StudentDetailPage.tsx`, `SkillBoard.tsx`, `StudentYThucSection.tsx`, `ClassYThucCard.tsx`, `PhoiHopSosSection.tsx`,
      `ui.tsx` (dòng 1–240), `KetQuaDot.tsx`.
- [x] **Step 5: 🛑 Hỏi chủ sản phẩm trước khi bật máy chủ dev** (câu mẫu: "Tôi cần chạy bản demo trên máy để chụp ảnh
      trước khi sửa. Anh/chị có đang mở bản demo không? Nếu có, xin tắt cửa sổ đó giúp tôi khoảng 30 phút."). Được phép thì:
      trong worktree `npm run seed`, rồi `preview_start` với cấu hình `dev` (`.claude/launch.json`).
- [x] **Step 6: Ảnh TRƯỚC** — lưu `thiet-ke/anh/pr-hv/truoc-<màn>-<vai>-<khổ>.png`, khổ `desktop` (1280 rộng) và `375`.
      Đổi vai ở thanh **Công cụ demo**. Tên học viên/giáo viên lấy từ bộ demo: GVCN **Trần Ngọc Hà**, GVBM **Phạm Thu
      Trang** (Speaking), Quản lý **Nguyễn Khánh Vy**. Sáu màn (spec §7):
      1. Hồ sơ **Lê Quang Huy** (`/hoc-vien/<id>` — tìm ở ô tìm kiếm đầu trang) — cả trang, cả ba khối tab hiện có.
      2. Một case có **≥ 2 phương án đang chạy**. Tìm bằng SQL trên database của worktree:
         `node -e "const D=require('libsql');const d=new D('data/pisa-demo.sqlite');console.log(d.prepare(\"SELECT c.id, c.student_id, s.full_name FROM sos_cases c JOIN students s ON s.id=c.student_id WHERE c.status!='done' AND (SELECT COUNT(*) FROM case_interventions i WHERE i.case_id=c.id AND i.status IN ('planned','started'))>=2 LIMIT 5\").all())"`.
         Không có → ghi Nhật ký, dùng case có ≥ 2 phương án bất kỳ.
      3. Case từ SOS **chờ xác định nguyên nhân** — học viên ở đầu `server/src/seed/sosV3Seed.ts` (ba em mới ở MB-FT 101).
      4. Tab Ý thức & Phối hợp của Lê Quang Huy (vai GVCN): `Vi phạm & xử lý` và `Phối hợp SOS`.
      5. Hồ sơ lớp **MB-FT 101** → khối Ý thức & Phối hợp: `Theo học sinh` (mở một em), `Theo thời gian`, `Phối hợp SOS`.
      6. Phân tích/Thực trạng của Quản lý (`/hoc-thuat`, góc `Ý thức & Phối hợp`) và `Việc cần làm` (Tổng quan).
      Ghi danh sách tệp ảnh vào Nhật ký. Tắt máy chủ dev (`preview_stop`) khi xong nếu chủ sản phẩm cần máy.

---

### Task 1: Bộ chữ trước — D1 (Phương án) + D3 (bỏ "Hãy") + phép quét chữ

**Files:**
- Modify: `thiet-ke/TU_DIEN_VA_CHU.md`
- Create: `shared/domain/hoSoHocVien.ts` (chỉ khung, xem Interfaces), `server/src/tests/hoSoHocVien.tests.ts`
- Modify: `shared/domain/index.ts`, `server/src/tests/run.ts`
- Modify (chữ): các file web/shared/server ở bảng 1A–1D; tests ở bảng 1E

**Interfaces:**
- Produces: `export async function runHoSoHocVienTests(t: YThucTestKit)` trong `server/src/tests/hoSoHocVien.tests.ts`
  (kiểu `YThucTestKit` import từ `./yThuc.tests.ts`, như `sosV3.tests.ts` đang làm).
- Produces: hằng `CHO_Z2B` trong file kiểm thử — danh sách file đóng băng được **tạm** loại khỏi phép quét, Task 9 xoá.

- [x] **Step 1: `TU_DIEN_VA_CHU.md`.**
  - Dòng 18 (bảng §1): cột "Chữ dùng trên web" thành `` `Phương án` (PA) — hỗ trợ học thuật; ở màn trộn: `PA học thuật` ``.
  - Dòng 135 (bảng §6): thay cả dòng bằng
    `| Việc GVCN làm để xử lý một nhóm vi phạm | `Phương án` (PA) trong tab Ý thức & Phối hợp · `PA xử lý` ở màn trộn · `phương án xử lý` trong câu báo từ máy chủ | "biện pháp", "BP", "phương án kỷ luật" |`
  - Dòng 136–140, 146, 154 (tiêu đề `### 6.2. Chín phương án xử lý — …`), 164, 176, 179, 183, 185, 187, 188, 195, 197,
    220, 226, 230: đổi "biện pháp" → "phương án" (câu trong tab Ý thức) hoặc "phương án xử lý" (câu báo máy chủ / tên
    chỉ số). Dòng 226: `Trùng với phương án xử lý khác`.
  - §4 "Nguyên tắc viết" (sau dòng 108): thêm gạch đầu dòng
    `- **Không mở đầu câu nhắc bằng "Hãy"** (chốt 22/09/2026, D3 — đảo K3-6): "Hãy chọn học viên." → "Chọn học viên."; "… Hãy bấm Tải lại." → "… Bấm Tải lại."; giữa câu "— hãy xác nhận …" → "— xác nhận …". Áp cho chữ giao diện và mọi câu báo từ máy chủ.`
  - Dòng 51, 53 (`Chưa có phương án hỗ trợ`): thêm ghi chú `*(màn trộn — bảng case của Quản lý: `Chưa có PA học thuật`)*`.
  - Thêm cuối file mục mới `## 8. PR-HV — 22/09/2026` với bảng **mọi chữ mới** của plan này (chép từ các bảng
    "Chữ" ở Task 2–8: tên tab, tên 4 ô số, `+ Ghi nhận vi phạm`, `Tạo phương án từ {n} vi phạm`, `{k}/{n} PA có kết quả`,
    `PA tiếp: hạn {ngày}`, `{a}/{b} việc hoàn thành`, `Hỗ trợ học thuật xem ở tab Học thuật`, `Học thuật theo dõi ở bảng
    kỹ năng`, `▸ {n} PA đã xong`, `▸ Bằng chứng ({n})`, `Chưa hoàn thành: …`, `Mở phương án`, `Tạo phương án`,
    `Không có cảnh báo`, `⚠ cũ nhất {k} ngày`, `⚠ đã {k} ngày`, `Lịch sử của riêng học viên này.`, `Tất cả thời gian`).
- [x] **Step 2: Khung `shared/domain/hoSoHocVien.ts`** — chỉ chú thích đầu file (vai trò: "luật hiển thị thuần của
      hồ sơ học viên PR-HV, giao diện chỉ vẽ") + `export {};` tạm; thêm `export * from './hoSoHocVien.ts';` vào cuối
      `shared/domain/index.ts`.
- [x] **Step 3: Phép quét chữ (TDD — viết trước, thấy đỏ).** Tạo `server/src/tests/hoSoHocVien.tests.ts`:
  ```ts
  /**
   * PHÉP KIỂM PR-HV — hồ sơ học viên 3 tab + Ý thức & Phối hợp theo prototype v3 (spec 2026-09-22).
   * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
   */
  import fs from 'node:fs';
  import path from 'node:path';
  import { fileURLToPath } from 'node:url';
  import type { YThucTestKit } from './yThuc.tests.ts';

  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
  // dist-server/server/src/tests → gốc repo. Kiểm lại bằng assert số file ở dưới; sai thì chỉnh số '..'.

  /** File đóng băng vì PR-Z2b — Task 9 XOÁ danh sách này. */
  const CHO_Z2B = ['server/src/yThuc/measures.ts', 'server/src/migrate.ts', 'server/src/seed/'];
  /** Dòng được phép giữ chữ cũ (không phải chữ người dùng thấy). Mỗi mục: [đường dẫn, chuỗi con của dòng]. */
  const CHO_PHEP: Array<[string, string]> = [];

  function boChuThich(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')          // /* … */ và {/* … */}
      .replace(/(^|[^:\\])\/\/.*$/gm, '$1');     // // … (không cắt 'http://')
  }
  const CHU_CU: Array<[string, RegExp]> = [
    ['biện pháp', /[Bb]iện pháp|BIỆN PHÁP/],
    ['BP', /(^|[^A-Za-z0-9_])BP([^A-Za-z0-9_]|$)/],
    ['Hãy', /(^|[^\p{L}])[Hh]ãy\s/u],
  ];

  export async function runHoSoHocVienTests(t: YThucTestKit) {
    const { check, assert } = t;
    console.log('\nPR-HV · Hồ sơ học viên 3 tab + Ý thức & Phối hợp v3');

    check('PR-HV · D1/D3 Chữ người dùng thấy không còn "biện pháp", "BP", "Hãy" (chú thích được giữ)', () => {
      const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return e.name === 'tests' || e.name === 'node_modules' ? [] : walk(p);
        return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
      });
      const files = ['web/src', 'shared', 'server/src'].flatMap((d) => walk(path.join(ROOT, d)))
        .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
        .filter((f) => !CHO_Z2B.some((z) => f.startsWith(z)));
      assert(files.length > 80, `Quét quá ít file (${files.length}) — sai ROOT?`);
      const hits: string[] = [];
      for (const f of files) {
        const lines = boChuThich(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n');
        lines.forEach((line, i) => {
          if (CHO_PHEP.some(([pf, s]) => pf === f && line.includes(s))) return;
          for (const [ten, re] of CHU_CU) if (re.test(line)) hits.push(`${f}:${i + 1} "${ten}": ${line.trim().slice(0, 90)}`);
        });
      }
      assert(hits.length === 0, `Còn ${hits.length} chỗ:\n    ${hits.join('\n    ')}`);
    });
  }
  ```
  (Số dòng báo ra là số dòng **sau khi bỏ chú thích khối** — lệch với file gốc; dùng đoạn chữ in kèm để tìm.)
  Đăng ký trong `server/src/tests/run.ts`: chèn **ngay trước** dòng `// ==================================================================== PR-J (Ý thức: Vi phạm và Biện pháp xử lý)` (~9415):
  ```ts
  // ==================================================================== PR-HV (hồ sơ học viên + Ý thức v3)
  const { runHoSoHocVienTests } = await import('./hoSoHocVien.tests.ts');
  await runHoSoHocVienTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
  ```
  `npm test` → phép này **đỏ** và liệt kê đúng các chỗ ở bảng 1A–1D. Dán số chỗ vào Nhật ký. Nếu nó báo chỗ **không**
  có trong bảng → sửa theo cùng luật và ghi Nhật ký; nếu báo một **tên trong mã** (không phải chữ hiển thị) → thêm vào
  `CHO_PHEP` kèm lý do, ghi Nhật ký.
- [x] **Step 4: Bảng 1A — web, D1 "biện pháp"/"BP" + A2.**

  | File:dòng | Cũ | Mới |
  |---|---|---|
  | `web/src/modules/yThuc/StudentYThucSection.tsx:71` | `` `${preparing} BP đang chuẩn bị` `` | `` `${preparing} PA đang chuẩn bị` `` (Task 5 thay cả khối này) |
  | `StudentYThucSection.tsx:78,81` | `kind: 'VP' \| 'BP'` · `kind: 'VP'` · `kind: 'BP'` | `'vp' \| 'pa'` · `'vp'` · `'pa'` (tên trong mã, đổi chỉ để phép quét khỏi nhầm; sửa cả chỗ so sánh `r.kind === 'VP'` dòng 133) |
  | `StudentYThucSection.tsx:103` | `+ Ghi vi phạm` | `+ Ghi nhận vi phạm` (A2) |
  | `StudentYThucSection.tsx:158` | `[BP]` | `[PA]` |
  | `StudentYThucSection.tsx:173` | `Tạo biện pháp từ {ticked.size} vi phạm đã chọn` | `Tạo phương án từ {ticked.size} vi phạm` |
  | `web/src/modules/yThuc/ClassYThucCard.tsx:126` | `+ Ghi vi phạm` | `+ Ghi nhận vi phạm` (A2) |
  | `ClassYThucCard.tsx:177` | `… BP đang chuẩn bị` | `… PA đang chuẩn bị` |
  | `ClassYThucCard.tsx:211` | `Tạo biện pháp từ {…} vi phạm đã chọn` | `Tạo phương án từ {…} vi phạm` |
  | `ClassYThucCard.tsx:219` | `Chưa có biện pháp đang chuẩn bị` | `Chưa có phương án đang chuẩn bị` |
  | `web/src/modules/yThuc/ConfirmMeasurePanel.tsx:103` | `` `${n} vi phạm được xử lý bằng biện pháp này` `` | `` `${n} vi phạm được xử lý bằng phương án này` `` |
  | `web/src/modules/yThuc/CreateMeasurePanel.tsx:47` | `Cần ít nhất một vi phạm để tạo biện pháp.` | `Cần ít nhất một vi phạm để tạo phương án.` |
  | `CreateMeasurePanel.tsx:48` | `Loại "Khác" cần ghi tên biện pháp.` | `Loại "Khác" cần ghi tên phương án.` |
  | `CreateMeasurePanel.tsx:71` | `` `Tạo biện pháp xử lý · ${studentName}` `` | `` `Tạo phương án · ${studentName}` `` |
  | `CreateMeasurePanel.tsx:98` | `Loại biện pháp` | `Loại phương án` |
  | `CreateMeasurePanel.tsx:116` | `Tên biện pháp` | `Tên phương án` |
  | `web/src/modules/yThuc/DeleteViolationConfirm.tsx:33` | `Nó sẽ bị gỡ khỏi ${n} biện pháp.` · `Vi phạm này chưa nằm trong biện pháp nào.` | `Nó sẽ bị gỡ khỏi ${n} phương án.` · `Vi phạm này chưa nằm trong phương án nào.` |
  | `web/src/modules/yThuc/YThucAnalysisView.tsx:66` | `Biện pháp đã thực hiện theo loại` | `Phương án xử lý đã thực hiện theo loại` (màn trộn) |
  | `web/src/modules/yThuc/RecordViolationPanel.tsx:95` | `` `Ghi vi phạm${…}` `` | `` `Ghi nhận vi phạm${…}` `` (cùng chữ với nút mở nó; nút gửi `Ghi vi phạm` dòng 100 **giữ**) |

- [x] **Step 5: Bảng 1B — web, D3 "Hãy".** Bỏ `Hãy ` và viết hoa chữ kế tiếp:

  | File:dòng | Mới |
  |---|---|
  | `web/src/modules/cases/CasePanel.tsx:826` | `Mô tả ngắn phương án — một câu đủ để người khác hiểu sẽ làm gì.` |
  | `web/src/modules/cases/QuickReport.tsx:140, 181` | `Đặt tên cho case.` |
  | `QuickReport.tsx:142` | `Mô tả cụ thể hơn: em sai ở đâu, sai như thế nào.` |
  | `QuickReport.tsx:145` | `Chọn kỹ năng em đang vướng.` |
  | `QuickReport.tsx:148, 189` | `Chọn phân loại vấn đề.` |
  | `QuickReport.tsx:183` | `Mô tả cụ thể hơn: khi đó em vướng gì.` |
  | `QuickReport.tsx:186` | `Chọn kỹ năng.` |
  | `QuickReport.tsx:193` | `Ghi từ ngày nào đến ngày nào.` |
  | `QuickReport.tsx:203` | `Chọn kết quả cuối.` |
  | `QuickReport.tsx:204` | `Ghi chú kết luận — ít nhất 10 ký tự.` |
  | `web/src/modules/classes/ClassCreatePanel.tsx:61` | `Chọn chi nhánh.` |
  | `ClassCreatePanel.tsx:62` | `Đặt tên lớp.` |
  | `web/src/modules/yThuc/CaseSosControls.tsx:24` | `Chọn phân loại vấn đề.` |
  | `CaseSosControls.tsx:168`, `PhoiHopSosSection.tsx:162` | `Chọn một lý do.` |
  | `web/src/modules/yThuc/PhoiHopSosSection.tsx:208` | `Chọn loại việc.` |
  | `web/src/modules/yThuc/RecordViolationPanel.tsx:69` | `Chọn học viên.` |
  | `web/src/modules/platform/WelcomePage.tsx:55` | `… Nếu hiện chữ đỏ, chụp màn hình lại.` |

- [x] **Step 6: Bảng 1C — shared/domain.** (Mã chỉ số, khoá, tên hằng **không đổi**.)

  | File:dòng | Cũ → Mới |
  |---|---|
  | `shared/domain/metrics.ts:144` | `cauHoi`: `…chưa nằm trong biện pháp nào?` → `…chưa nằm trong phương án xử lý nào?` |
  | `metrics.ts:146` | `tapDuDieuKien`: ba chữ "biện pháp" → "phương án xử lý" |
  | `metrics.ts:164` | `ten: 'Biện pháp đã thực hiện'` → `'Phương án xử lý đã thực hiện'` |
  | `metrics.ts:165, 167` | "biện pháp xử lý"/"biện pháp" → "phương án xử lý" (giữ nghĩa câu) |
  | `metrics.ts:171` | `'Biện pháp đang chuẩn bị'` → `'Phương án xử lý đang chuẩn bị'` |
  | `metrics.ts:172, 174` | "biện pháp" → "phương án xử lý"; `…Biện pháp không có hạn…` → `…Phương án xử lý không có hạn…` |
  | `metrics.ts:178` | `'Biện pháp theo loại'` → `'Phương án xử lý theo loại'` |
  | `metrics.ts:179, 181` | "biện pháp" → "phương án xử lý" |
  | `metrics.ts:218` | `'bien-phap': 'biện pháp'` → `'bien-phap': 'phương án xử lý'` |
  | `shared/domain/yThuc.ts:188` | `'Loại biện pháp không hợp lệ'` → `'Loại phương án xử lý không hợp lệ'` |
  | `yThuc.ts:189` | `'Cần ghi tên biện pháp'` → `'Cần ghi tên phương án xử lý'` (hàm dùng chung với máy chủ → luật câu báo máy chủ) |
  | `shared/domain/people.ts:145` | `…tạo và xác nhận biện pháp xử lý` → `…tạo và xác nhận phương án xử lý` |
  | `shared/domain/sos.ts:122` | `'Trùng với Biện pháp khác'` → `'Trùng với phương án xử lý khác'` |

- [x] **Step 7: Bảng 1D — máy chủ KHÔNG đóng băng + script.** D1 ở câu báo máy chủ: `phương án xử lý`. D3: bỏ "Hãy".

  | File:dòng | Mới |
  |---|---|
  | `server/src/yThuc/access.ts:100` | `Không tìm thấy phương án xử lý` |
  | `access.ts:105` | `Bạn không có quyền đính kèm hoặc gỡ bằng chứng của phương án xử lý này.` |
  | `access.ts:65` | `…đã được dùng cho một bản ghi khác — tạo một lần gửi mới.` |
  | `server/src/yThuc/thongKe.ts:116` | `Loại phương án xử lý không hợp lệ.` |
  | `server/src/auth.ts:58` | `Chưa chọn tài khoản demo. Chọn một tài khoản ở thanh Công cụ demo.` |
  | `server/src/cases/cases.ts:369` | `Đặt tên cho case — một câu ngắn nói đúng vấn đề, ví dụ ` (nối như cũ) |
  | `cases.ts:383` | `Chọn kỹ năng: Listening, Reading, Writing Task 1, Writing Task 2 hay Speaking.` |
  | `cases.ts:425` | `Chọn phân loại vấn đề — đây là căn cứ để tổng hợp về sau.` |
  | `cases.ts:916` | `Viết góp ý.` |
  | `cases.ts:1013, 1204, 2573` | `…chưa được xác nhận — xác nhận (hoặc sửa / thay) trước khi …` (giữ đuôi câu từng chỗ) |
  | `server/src/cases/sosAuto.ts:148` | `` `Xác định nguyên nhân và xác nhận PA học thuật. Hạn ${input.verifyDue}.` `` (thông báo = màn trộn) |
  | `sosAuto.ts:273` | `` `Chọn một lý do: ${…}.` `` |
  | `sosAuto.ts:282` | `…đang chạy — dùng "Chốt kết quả case" thay vì "Không cần theo dõi".` |
  | `server/src/classes/classes.ts:773` | `'Xếp cho người đó một kỹ năng, hoặc chọn người khác làm chủ nhiệm.'` |
  | `server/src/fasttrack/attempts.ts:900` | `…lộ trình nào. Mở lộ trình trước khi lên lịch MT.` |
  | `attempts.ts:910` | `` `Lộ trình này đã có MT${attemptNo}. Đổi tuần thay vì tạo mới.` `` |
  | `attempts.ts:959` | `Lượt này đã huỷ. Mở lại trước khi đổi tuần.` |
  | `attempts.ts:1159` | `'xem có cần theo tiếp không.'` |
  | `attempts.ts:1221` | `…đã bị huỷ. Khôi phục và đặt tuần mới trước khi nhập điểm.` |
  | `attempts.ts:1226` | `'sửa trạng thái thi trước rồi mới nhập điểm.'` |
  | `attempts.ts:1251` | `…Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do.` |
  | `server/src/fasttrack/cycles.ts:249` | `Chọn nguồn của điểm xuất phát.` |
  | `cycles.ts:261` | `Nhập điểm xuất phát hoặc chọn một bài đánh giá làm căn cứ.` |
  | `cycles.ts:364` | `Ghi lý do đổi mục tiêu.` |
  | `server/src/fasttrack/skillSchedule.ts:532` | `Đợt này đã huỷ. Mở lại trước khi đổi lịch.` |
  | `skillSchedule.ts:571` | `'Trả lời đề nghị đó thay vì đổi lịch ở đây — nếu không, em bị dời hai lần.'` |
  | `skillSchedule.ts:633` | `'xếp lại lịch hoặc huỷ phần thi, đợt vẫn là đợt chưa đủ kết quả.'` |
  | `server/src/normal/regular.ts:540` | `Lớp này không phải lớp thường. Dùng bảng điểm Mock Test.` |
  | `server/src/platform/accounts.ts:42` | `Nhập email.` |
  | `accounts.ts:134, 283` | `Nhập họ tên.` |
  | `accounts.ts:137` | `Email này đã có tài khoản. Đăng nhập, hoặc nhờ Quản trị hệ thống đặt lại mật khẩu.` |
  | `accounts.ts:142` | `Chọn ít nhất một chi nhánh bạn đang hoạt động.` |
  | `accounts.ts:200` | `Chọn ít nhất một chi nhánh cho tài khoản này.` |
  | `accounts.ts:221` | `Ghi lý do không duyệt — người đăng ký cần biết vì sao.` |
  | `accounts.ts:287` | `Cấp ít nhất một vai trò.` |
  | `server/src/platform/sysconfig.ts:43` | `Đặt tên cho lộ trình.` |
  | `sysconfig.ts:104` | `Đặt tên cho loại lớp.` |
  | `server/src/routes/helpers.ts:37` | `…Bản nháp của bạn vẫn được giữ — bấm Thử lại.` |
  | `helpers.ts:43` | `…(kịch bản demo đang bật). Bấm Tải lại.` |
  | `server/src/yThuc/phoiHop.ts:237` | `` `Chọn loại việc: ${…}.` `` |
  | `phoiHop.ts:303` | `` `Chọn một lý do: ${…}.` `` |
  | `server/src/yThuc/violations.ts:111` | `` `Chọn nhóm vi phạm: ${…}.` `` |
  | `scripts/check-node.mjs:30` | `` `Nếu gặp lỗi lạ, cài Node.js bản LTS từ https://nodejs.org rồi thử lại.\n` `` |
  | `check-node.mjs:42` | `  Chạy lệnh sau, rồi thử lại:` |

  **KHÔNG đụng ở task này** (đóng băng, Task 9): `server/src/migrate.ts:46` (Hãy), `server/src/yThuc/measures.ts:176`
  (Hãy + biện pháp) và mọi "biện pháp" khác trong `measures.ts`, `migrate.ts`, `seed/*`.
- [x] **Step 8: Bảng 1E — phép kiểm khẳng định câu chữ (đổi hợp lệ vì D1).**

  | File:dòng | Cũ → Mới |
  |---|---|
  | `server/src/tests/yThuc.tests.ts:253` | `need('other') === 'Cần ghi tên biện pháp'` → `=== 'Cần ghi tên phương án xử lý'` |
  | `server/src/tests/sosV3.tests.ts:98` | `=== 'Trùng với Biện pháp khác'` → `=== 'Trùng với phương án xử lý khác'` |

  Rồi quét tìm phép kiểm khác bám câu chữ đã đổi: `rg -n "Hãy|hãy|biện pháp|Biện pháp" server/src/tests` — với mỗi dòng
  là **regex/so sánh trên thông báo lỗi** của một câu vừa đổi ở bảng 1C/1D → sửa theo chữ mới, ghi Nhật ký. (Đã soát
  22/09: ngoài hai dòng trên, các dòng `/loại biện pháp/i` 616, `/tên biện pháp/i` 617, `/tên biện pháp/` 667 bám
  `measures.ts` — **để Task 9**.)
- [x] **Step 9:** `npm run check` → xanh, phép quét PR-HV **xanh**. Số phép kiểm = `N0 + 1`. Commit:
      `PR-HV (1): bộ chữ — "biện pháp" thành "phương án", bỏ "Hãy", phép quét chữ`.

---

### Task 2: Khung trang 3 tab + `?tab=` (D2, A6)

**Files:**
- Modify: `shared/domain/hoSoHocVien.ts`, `server/src/tests/hoSoHocVien.tests.ts`
- Create: `web/src/ui/HangTab.tsx`
- Modify: `web/src/modules/students/StudentDetailPage.tsx`, `web/src/modules/yThuc/StudentYThucSection.tsx` (chỉ thêm prop `onGoAcademic`, chưa dùng)

**Interfaces:**
- Produces (shared):
  ```ts
  export const HO_SO_TABS = ['hoc-thuat', 'y-thuc', 'hanh-trinh'] as const;
  export type HoSoTab = (typeof HO_SO_TABS)[number];
  export const HO_SO_TAB_LABEL: Record<HoSoTab, string> = {
    'hoc-thuat': 'Học thuật', 'y-thuc': 'Ý thức & Phối hợp', 'hanh-trinh': 'Hành trình',
  };
  /** Giá trị lạ, rỗng hay thiếu → 'hoc-thuat' (tab mặc định). Không nhớ bằng localStorage (A6). */
  export function parseHoSoTab(v: string | null | undefined): HoSoTab {
    return (HO_SO_TABS as readonly string[]).includes(v ?? '') ? (v as HoSoTab) : 'hoc-thuat';
  }
  ```
- Produces (web): `HangTab` —
  ```ts
  export type HangTabMuc<K extends string> = { key: K; label: string; so?: number | null; canhBao?: boolean };
  export function HangTab<K extends string>(props: {
    tabs: HangTabMuc<K>[]; value: K; onChange: (k: K) => void; ariaLabel: string;
    /** 'chinh' = hàng tab của trang (chữ text-sm), 'con' = tab con trong một khối (text-xs). */
    cap?: 'chinh' | 'con';
  }): JSX.Element;
  ```
- Produces: `StudentYThucSection` nhận thêm `onGoAcademic?: () => void` (Task 4–5 dùng).

- [x] **Step 1 (TDD):** Thêm vào `hoSoHocVien.tests.ts`:
  `check('PR-HV · A6 ?tab= đọc đúng ba giá trị, mọi giá trị khác về Học thuật', …)` — `parseHoSoTab('y-thuc') === 'y-thuc'`,
  `'hanh-trinh'`, `'hoc-thuat'`; `null`, `undefined`, `''`, `'Y-THUC'`, `'tong-quan'` → `'hoc-thuat'`. Dùng
  `const domain: any = await import('../../../shared/domain/index.ts');` như `sosV3.tests.ts`. Chạy → đỏ. Viết hàm → xanh.
- [x] **Step 2: `HangTab.tsx`.** Một `div role="tablist" aria-label={ariaLabel}` có
      `className="flex gap-1 overflow-x-auto border-b"` `style={{ borderColor: 'var(--line)' }}`; mỗi tab là
      `<button type="button" role="tab" aria-selected={active} onClick={() => onChange(t.key)}>` với lớp
      `whitespace-nowrap px-3 py-2 -mb-px border-b-2 font-semibold` + (`cap === 'con' ? 'text-xs' : 'text-sm'`) +
      (active ? `border-[color:var(--accent)] text-slate-100` : `border-transparent text-slate-400 hover:text-slate-200`).
      Trong nhãn: `{t.label}`; `t.canhBao` → `<span className="ml-1 text-amber-300" aria-label="có cảnh báo">⚠</span>`;
      `t.so` > 0 → `<span className="ml-1.5 rounded-full px-1.5 text-[10px] tabular-nums bg-sky-300/15 text-sky-200">{t.so}</span>`.
      Không có số / số 0 → không vẽ gì.
- [x] **Step 3: `StudentDetailPage.tsx` — state và địa chỉ.**
  - Xoá `tier3` (dòng 64). Thêm:
    ```ts
    const tab = parseHoSoTab(params.get('tab'));
    const setTab = (t: HoSoTab) => {
      const next = new URLSearchParams(params);          // giữ nguyên 'lo-trinh'
      if (t === 'hoc-thuat') next.delete('tab'); else next.set('tab', t);
      setParams(next, { replace: true });
    };
    /* A5: dấu ⚠ trên tab Ý thức. Cùng đường với khối bên trong — useApi tự tải lại khi '/students' bị vô hiệu. */
    const warn = useApi<{ message: string }>(id ? `/students/${id}/violation-warning` : null, [id]);
    ```
    (hooks đặt **trước** các `return` sớm ở dòng 84–85.)
  - Import `parseHoSoTab, HO_SO_TAB_LABEL, type HoSoTab` từ `@shared/domain/index.ts`; `HangTab` từ `../../ui/HangTab.tsx`.
- [x] **Step 4: Bố cục mới** (thay dòng 169–306; giữ nguyên đầu trang 108–167 và các hộp thoại 308–343):
  ```tsx
  {cy && <HeaderStats data={data} cy={cy} rows={skillRows} />}

  {/* Xác minh SOS: giữ chỗ cũ — dưới 4 ô số, trên hàng tab; tự ẩn khi không có tín hiệu. */}
  <PendingSignals signals={data.pendingSignals ?? []} onVerify={(sg) => setVerify(sg)} />

  <HangTab ariaLabel="Nội dung hồ sơ học viên" value={tab} onChange={setTab}
    tabs={[
      { key: 'hoc-thuat', label: HO_SO_TAB_LABEL['hoc-thuat'] },
      { key: 'y-thuc', label: HO_SO_TAB_LABEL['y-thuc'], canhBao: !!warn.data?.message },
      { key: 'hanh-trinh', label: HO_SO_TAB_LABEL['hanh-trinh'] },
    ]} />

  {tab === 'hoc-thuat' && (!cy ? <Empty title="Học viên chưa có lộ trình nào" hint="…(giữ chữ dòng 173)" /> : (
    <>
      <Card title="Tiến độ và hỗ trợ theo kỹ năng" action={…giữ dòng 189} bodyClass="p-0">
        <SkillBoard …giữ nguyên props dòng 191–196 />
      </Card>
      <Card title={cy.ratio ? 'Kết quả kiểm tra' : 'Mock Test'} bodyClass="p-0">
        {/* CHUYỂN NGUYÊN khối dòng 226–258 (bảng lượt + SectionNote + đổi mục tiêu + kết luận + điểm đầu vào) */}
      </Card>
    </>
  ))}

  {tab === 'y-thuc' && (
    <Card bodyClass="p-4">
      <StudentYThucSection studentId={data.id} studentName={data.fullName}
        canRecordViolation={!!data.viewer.canRecordViolation}
        canManageDiscipline={!!data.viewer.canManageDiscipline}
        onGoAcademic={() => setTab('hoc-thuat')} />
    </Card>
  )}

  {tab === 'hanh-trinh' && (
    <Card title="Hành trình học tập" bodyClass="p-4 space-y-4">
      {cy && <JourneyTimeline rows={skillRows} progress={data.progress ?? null} onOpenCase={setOpenCase} />}
      {/* CHUYỂN NGUYÊN khối dòng 274–301 (Các mốc đã qua / Toàn bộ ghi nhận + Episode + SectionNote) */}
    </Card>
  )}
  ```
  Ghi chú: trước đây **không có lộ trình thì không vào được tab Ý thức** (cả khối tab nằm trong nhánh `cy`) — nay tab
  Ý thức và Hành trình vẫn mở được khi `!cy`; chỉ tab Học thuật hiện `Empty`. Ghi điều này vào Nhật ký (sửa lỗi phụ,
  không đổi luật). Card `Tiến độ và hỗ trợ…` giữ tiêu đề cũ. Xoá chú thích "TẦNG 3" (dòng 199–208) và sửa chú thích
  đầu file (dòng 30–35) cho đúng bố cục mới (đầu trang · 4 ô số · 3 tab).
- [x] **Step 5:** `npm run check` xanh. Bật máy chủ dev (đã được phép ở Task 0; nếu đã tắt thì hỏi lại) — mở
      `/hoc-vien/<Huy>`, `…?tab=y-thuc`, `…?tab=hanh-trinh`, `…?tab=abc` (→ Học thuật), bấm qua lại tab: địa chỉ đổi,
      nút Quay lại của trình duyệt **không** phải bấm nhiều lần (replace). 375px: hàng tab không đẩy trang cuộn ngang.
      Commit: `PR-HV (2): hồ sơ học viên 3 tab, nhớ tab qua ?tab=`.

---

### Task 3: Q7 — 4 ô số đầu hồ sơ

**Files:**
- Modify: `shared/domain/hoSoHocVien.ts`, `server/src/tests/hoSoHocVien.tests.ts`, `server/src/students/profile.ts` (`headlineOf` 439–489), `web/src/modules/students/StudentDetailPage.tsx` (`HeaderStats` 361–407, `Stat` 409–422)

**Interfaces:**
- Produces (shared):
  ```ts
  export type LuotTomTat = {
    id: number; attemptNo: number; kind: string; status: string; periodCode: string | null;
    mode: string; scored: number; required: number; complete: boolean;
    overall: number | null; expectation: number | null; sosLevel: number | null;
  };
  export type KetQuaTestGanNhat = {
    attemptId: number; nhan: string; coDiem: number; yeuCau: number;
    dat: boolean | null; sos: number | null;
    /** `<KetQuaDot>` chỉ nhận 1–4 kỹ năng (ATTEMPT_SKILL_UNITS); ngoài khoảng đó giao diện ghi `{có}/{cần} phần có điểm`. */
    dungKetQuaDot: boolean;
  };
  export function ketQuaTestGanNhat(attempts: readonly LuotTomTat[]): KetQuaTestGanNhat | null;
  ```
  Luật: lấy lượt **số lớn nhất** (tự sắp, không tin thứ tự vào) có `status !== 'cancelled'` và `scored > 0`; không có
  → `null`. `nhan`: FT (`mode !== 'ratio'`) = `MT{attemptNo}` + (`periodCode` ? ` · {periodCode}` : ''); Normal
  (`mode === 'ratio'`) = (`kind === 'final'` ? `Cuối khoá` : `Giữa khoá`) + ` · {periodCode}` nếu có. `dat`: FT =
  `complete && overall !== null && expectation !== null ? overall >= expectation : null`; Normal = `complete ?
  sosLevel === 0 : null` (**không bịa Overall** — Normal không có Overall; "đạt" nghĩa là mọi phần đạt ngưỡng).
  `sos = sosLevel`. `dungKetQuaDot = required >= 1 && required <= ATTEMPT_SKILL_UNITS` (import từ `./display.ts`).
- Produces (server): `headline.next: { text: string; due: string | null; overdue: boolean } | null` với `text` **bắt
  đầu bằng động từ**.

- [x] **Step 1 (TDD, shared):** phép kiểm `PR-HV · Q7 Ô "Kết quả Test gần nhất"` với dữ liệu tự dựng (không cần DB):
  (a) FT đủ 4, overall 6.0 ≥ kỳ vọng 5.5 → `dat === true`, `nhan === 'MT3 · W2 SEP'`; (b) FT đủ, overall < kỳ vọng →
  `false`; (c) FT mới 2/4 → `dat === null`, `coDiem 2`, `yeuCau 4`; (d) lượt mới nhất bị huỷ → lấy lượt trước; (e) lượt
  mới nhất `scored 0` → lấy lượt trước; (f) không lượt nào có điểm → `null`; (g) Normal đủ, `sosLevel 0` → `dat true`,
  `nhan` bắt đầu `Giữa khoá`; (h) Normal thiếu → `dat null`; (i) `required 5` → `dungKetQuaDot false`; (j) thứ tự vào
  tăng dần vẫn lấy đúng lượt số lớn nhất. Đỏ → viết hàm → xanh.
- [x] **Step 2 (TDD, server):** phép kiểm `PR-HV · Q7 Ô "Việc cần làm tiếp": câu bắt đầu bằng động từ, có cờ quá hạn đúng`:
  duyệt các học viên có case đang mở (`SELECT DISTINCT student_id, cycle_id FROM sos_cases WHERE status != 'done' AND id <= ?`
  với `seedMax.sos_cases` nếu có khoá đó, không có thì bỏ điều kiện), gọi `profile.studentProfile(P.admin, sid, cid)`;
  với mọi `next` khác null: `typeof next.overdue === 'boolean'`; `next.overdue === (next.due !== null && next.due < TODAY)`;
  `/^(Xác minh SOS|Đề ra PA|Làm PA|Chờ Quản lý duyệt PA|Cập nhật PA) /.test(next.text)`. Và phải có **ít nhất một** học
  viên có `next` (không thì phép kiểm vô nghĩa). Đỏ.
- [x] **Step 3: sửa `headlineOf`** (`profile.ts:455–488`). Chỉ đổi câu, thêm một ứng viên, thêm `overdue` — **không** đổi
      thứ tự ưu tiên hiện có:
  ```ts
  const sk = (r: any) => r.short ?? r.label;
  for (const r of rows) {
    if (r.signal) cands.push({ text: `Xác minh SOS ${sk(r)}`, due: r.signal.verifyDue ?? null, rank: 0 });
    if (r.state === 'no_plan') cands.push({ text: `Đề ra PA cho ${sk(r)}`, due: null, rank: 1 });
    if (r.overdueActionDue) cands.push({ text: `Làm PA ${sk(r)}`, due: r.overdueActionDue, rank: 1 });
    if (r.pendingApproval) cands.push({ text: `Chờ Quản lý duyệt PA ${sk(r)}`, due: null, rank: 2 });
    if (r.followOverdue) cands.push({ text: `Cập nhật PA ${sk(r)}`, due: r.followUntil, rank: 1 });
    /* MỚI (PR-HV): việc cập nhật hằng tuần CHƯA quá hạn — để ô có "hạn 30/08" thay vì "Không có" khi mọi việc đang đúng hạn. */
    else if (r.followUntil && r.cases.some((c: any) => c.status !== 'done')) {
      cands.push({ text: `Cập nhật PA ${sk(r)}`, due: r.followUntil, rank: 3 });
    }
  }
  // … giữ nguyên cands.sort(…)
  return {
    below, signals, openCases: open,
    next: cands[0] ? { text: cands[0].text, due: cands[0].due, overdue: !!cands[0].due && cands[0].due < today } : null,
  };
  ```
  (`PA` ở đây đúng D1: đầu hồ sơ học viên là ngữ cảnh học thuật.) Xanh. **Kiểm ngược:** đổi `<` thành `<=` ở
  `overdue` → phép Step 2 phải đỏ; trả lại.
- [x] **Step 4: `HeaderStats` mới** — thay thân hàm (361–407). `Stat` thêm prop `nho?: boolean` (giá trị là chữ, dùng
      `text-sm font-semibold leading-snug` thay `text-lg`) và `sub?: ReactNode` (không chỉ string).

  | Ô (nhãn chính xác) | `value` | `tone` | `sub` | Nguồn |
  |---|---|---|---|---|
  | `Kết quả Test gần nhất` | `kq.nhan` hoặc `—` | — | `kq.dungKetQuaDot ? <KetQuaDot coDiem={kq.coDiem} yeuCau={kq.yeuCau} dat={kq.dat} sos={kq.sos} /> : `${kq.coDiem}/${kq.yeuCau} phần có điểm``; không có lượt: `chưa có điểm nào` | `ketQuaTestGanNhat(data.attempts)` |
  | `Kỹ năng cần hỗ trợ` | `String(below.length)` | `below.length ? 'danger' : scored.length ? 'ok' : undefined` | `below.map(r => r.short ?? r.label).join(' · ')`; 0 mà có điểm: `mọi môn đạt kỳ vọng`; chưa điểm: `chưa có điểm nào` | `rows.filter(r => r.band !== null && r.missed === true)` |
  | `Case đang mở` | `String(openCases.length)` | `openCases.length ? 'warn' : undefined` | `${runningPlans} PA đang theo dõi`; 0: `không có case nào đang mở` | giữ cách tính dòng 370–372 |
  | `Việc cần làm tiếp` (`nho`) | `next?.text ?? 'Không có'` | `next?.overdue ? 'danger' : undefined` | `next.due` ? `` `${next.overdue ? 'quá hạn' : 'hạn'} ${fmtDate(next.due)}` `` : next ? `chưa đặt hạn` : `không có việc nào đang chờ` | `data.headline.next` |

  Lưới giữ `grid gap-3 grid-cols-2 lg:grid-cols-4`. Ô **không** bấm được (PR-R). Import `KetQuaDot` từ
  `../../ui/KetQuaDot.tsx`, `ketQuaTestGanNhat` từ shared. Xoá biến `latestNo/latestRow/worst` không dùng nữa, sửa
  chú thích hàm (bốn câu hỏi mới). Lớp Normal: ô 1 ra `Giữa khoá · W3 SEP` + câu `KetQuaDot` kiểu `2/4 kỹ năng có điểm`.
- [x] **Step 5:** `npm run check` xanh (số = trước + 2). Mở hồ sơ một em FT và một em Normal (ví dụ học viên lớp FOU/BE
      trong bộ demo): ô 1 có câu `KetQuaDot`, Normal **không** có chữ Overall/OVR; ô 4 có động từ + `hạn dd/mm/yyyy`,
      quá hạn thì đỏ. 375px: 2 cột, chữ ô 4 xuống dòng, không tràn. Commit: `PR-HV (3): Q7 bốn ô số mới đầu hồ sơ`.

---

### Task 4: Thành phần dùng chung — `OSoNho`, `DongThoiGian`, `TheSos`

**Files:**
- Create: `web/src/ui/OSoNho.tsx`, `web/src/ui/DongThoiGian.tsx`
- Modify: `web/src/modules/yThuc/PhoiHopSosSection.tsx`, `web/src/modules/yThuc/StudentYThucSection.tsx` (dòng 178–179 — chỉ đổi prop), `web/src/modules/yThuc/ClassYThucCard.tsx` (dòng 285 — chỉ đổi prop)
- Modify: `shared/domain/hoSoHocVien.ts`, `server/src/tests/hoSoHocVien.tests.ts`

**Interfaces:**
- Produces (shared):
  ```ts
  /** Đếm vi phạm theo nhóm, ĐÚNG thứ tự VIOLATION_CATEGORIES, bỏ nhóm có 0 (A3). */
  export function demTheoNhomViPham(vs: readonly { category: string }[]):
    { tong: number; nhom: { category: string; label: string; n: number }[] };
  ```
- Produces (web):
  ```ts
  // web/src/ui/OSoNho.tsx
  export function OSoNho(props: { nhan: string; so: number | string; tone?: 'warn' | 'danger' }): JSX.Element;

  // web/src/ui/DongThoiGian.tsx
  export type DongThoiGianMuc = {
    key: string;
    /** Ngày nghiệp vụ ISO — hiện `dd/mm`, `title` là ngày đủ. */
    ngay: string;
    /** Ô tick (A4). `null`/thiếu = dòng không tick được nhưng VẪN giữ chỗ để thẳng cột (khi `coCotChon`). */
    chon?: { checked: boolean; onChange: () => void; nhanDoc: string } | null;
    /** Cột 2: nhãn màu (hồ sơ HV) hoặc tên học viên (lớp · Theo thời gian). Bỏ qua ở biến thể 'gon'. */
    cot2?: ReactNode;
    tieuDe: ReactNode;
    dongPhu?: ReactNode;
    /** Cột cuối: nút `Sửa`/`Mở`/`Xem`, hoặc nhãn nhóm. */
    cuoi?: ReactNode;
  };
  export function DongThoiGian(props: {
    muc: DongThoiGianMuc[];
    /** 'day-du' = ngày · cột 2 · nội dung · cuối; 'gon' = ngày · nội dung · cuối (thẻ "Vi phạm gần đây" của lớp). */
    bien?: 'day-du' | 'gon';
    coCotChon?: boolean;
    /** Vẽ khi `muc` rỗng. */
    rong: ReactNode;
  }): JSX.Element;

  // web/src/modules/yThuc/PhoiHopSosSection.tsx
  export function TheSos(props: {
    t: CoordTurn;
    /** 'luot' (hồ sơ HV): cột 1 = `MT2 · SOS 2` + kỹ năng. 'hocVien' (hồ sơ lớp): cột 1 = tên HV + `MT2 · SOS 2 · kỹ năng`. */
    cot1?: 'luot' | 'hocVien';
    onGoAcademic?: () => void;
    onChanged?: () => void;
  }): JSX.Element;
  export function PhoiHopSosSection(props: {
    turns: CoordTurn[] | null; loading?: boolean;
    cot1?: 'luot' | 'hocVien';           // THAY `showStudentName` (true ↔ 'hocVien')
    onGoAcademic?: () => void; onChanged?: () => void;
  }): JSX.Element;
  ```

- [x] **Step 1 (TDD):** phép kiểm `PR-HV · A3 Đếm vi phạm theo nhóm: đúng thứ tự năm nhóm, bỏ nhóm 0` — đầu vào
      `[{category:'attendance'},{category:'homework'},{category:'homework'}]` → `tong 3`, `nhom` = BTVN 2 rồi Chuyên cần 1
      **theo thứ tự `VIOLATION_CATEGORIES`** (đọc hằng này, đừng đoán mã nhóm — nếu mã khác `homework/attendance` thì dùng
      mã thật), nhãn lấy từ `VIOLATION_CATEGORY_LABEL`; rỗng → `{tong:0, nhom:[]}`. Đỏ → viết → xanh.
- [x] **Step 2: `OSoNho.tsx`** —
  ```tsx
  export function OSoNho({ nhan, so, tone }: { nhan: string; so: number | string; tone?: 'warn' | 'danger' }) {
    const mau = tone === 'danger' ? 'text-rose-200' : tone === 'warn' ? 'text-amber-200' : 'text-slate-100';
    return (
      <div className="rounded-lg border px-3 py-2 min-w-[7rem]" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
        <span className="block text-[11px] text-slate-500">{nhan}</span>
        <span className={`block text-base font-semibold tabular-nums leading-tight mt-0.5 ${mau}`}>{so}</span>
      </div>
    );
  }
  ```
  Nơi dùng bọc bằng `<div className="flex flex-wrap gap-2">`.
- [x] **Step 3: `DongThoiGian.tsx`.** Khung (lớp Tailwind **viết đủ, tĩnh**):
  ```tsx
  const LUOI = {
    'day-du': {
      khong: 'grid-cols-[3.25rem_5.5rem_minmax(0,1fr)] md:grid-cols-[4rem_8rem_minmax(0,1fr)_auto]',
      chon:  'grid-cols-[1.25rem_3.25rem_5.5rem_minmax(0,1fr)] md:grid-cols-[1.25rem_4rem_8rem_minmax(0,1fr)_auto]',
    },
    gon: {
      khong: 'grid-cols-[3.25rem_minmax(0,1fr)] md:grid-cols-[4rem_minmax(0,1fr)_auto]',
      chon:  'grid-cols-[1.25rem_3.25rem_minmax(0,1fr)] md:grid-cols-[1.25rem_4rem_minmax(0,1fr)_auto]',
    },
  } as const;
  /* Dưới md, cột cuối xuống hàng mới, thẳng mép trái của cột nội dung (đúng prototype @media 750px). */
  const CUOI = {
    'day-du': { khong: 'col-start-3 md:col-start-auto', chon: 'col-start-4 md:col-start-auto' },
    gon:      { khong: 'col-start-2 md:col-start-auto', chon: 'col-start-3 md:col-start-auto' },
  } as const;
  ```
  Mỗi dòng: `<li className={`grid gap-x-2 gap-y-1 py-2.5 items-start border-t first:border-t-0 ${LUOI[bien][k]}`} style={{ borderColor: 'var(--line)' }}>`
  gồm theo thứ tự: (ô tick nếu `coCotChon`: `<input type="checkbox" className="mt-0.5" aria-label={chon.nhanDoc} …/>` hoặc
  `<span />`) · ngày `<span className="text-[11px] text-slate-500 tabular-nums pt-0.5" title={fmtDate(ngay)}>{fmtDate(ngay).slice(0, 5)}</span>` ·
  (`day-du`: `<span className="min-w-0">{cot2}</span>`) · nội dung `<span className="min-w-0 break-words"><span className="block text-sm font-medium text-slate-100">{tieuDe}</span>{dongPhu && <span className="block text-[11px] text-slate-500 mt-0.5">{dongPhu}</span>}</span>` ·
  cuối `<span className={`flex flex-wrap gap-1.5 md:justify-end ${CUOI[bien][k]}`}>{cuoi}</span>`.
  Khung ngoài: `<ul className="list-none m-0 px-3 rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>`.
  `muc` rỗng → trả `rong`. Mô tả dài, tên GV dài: **không** `truncate` — `break-words` để xuống dòng.
- [x] **Step 4: `TheSos`** — đổi tên `TurnRow` (dòng 45–85) thành `export function TheSos`, giữ `ActionRow`, ba form con
      và mọi quyền (`t.canAct`). Đầu thẻ:
  ```tsx
  <div role="button" tabIndex={0} aria-expanded={open}
    onClick={() => setOpen((v) => !v)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
    className="grid gap-x-3 gap-y-1 items-center px-3 py-2.5 cursor-pointer row-hover
               grid-cols-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]">
    <div className="col-span-2 md:col-span-1 min-w-0">…cột 1…</div>
    <div className="min-w-0">…cột 2…</div>
    <div className="justify-self-end">…cột 3…</div>
  </div>
  ```
  (Dùng `div role="button"` vì cột 2 có một nút link bên trong — nút lồng trong `<button>` là HTML sai. Nút link gọi
  `e.stopPropagation()`.)

  | Cột | `cot1 = 'luot'` (hồ sơ HV) | `cot1 = 'hocVien'` (hồ sơ lớp) |
  |---|---|---|
  | 1 dòng chính (`text-sm font-semibold`) | `MT{attemptNo}` + (`sosLevel !== null` ? ` · ${sosLabel(sosLevel)}` : '') | `studentName` |
  | 1 dòng phụ (`text-[11px] text-slate-500`) | `skillLabels.join(' + ')` hoặc `—` | `MT{n}` + ` · ${sosLabel}` + (`skillLabels` ? ` · ${join(' + ')}` : '') |
  | 2 dòng chính (`text-sm font-semibold`) | `${summary.label} việc hoàn thành` | như trái |
  | 2 dòng phụ | `onGoAcademic` ? `<button type="button" className="link text-[11px]" onClick={(e) => { e.stopPropagation(); onGoAcademic(); }}>Hỗ trợ học thuật xem ở tab Học thuật</button>` : chữ trơn cùng câu | `Học thuật theo dõi ở bảng kỹ năng` |
  | 3 | `summary.complete ? <Status kind="done">Hoàn thành</Status> : <Status kind="doing">Đang xử lý</Status>` | như trái |

  `open` mặc định `!t.summary.complete` (giữ). Thân thẻ (`border-t px-3 pb-3`): mỗi việc một dòng lưới
  `grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2 border-t first:border-t-0` — trái: `a.name` (`text-sm`) + dòng phụ
  (`done`: `` `${fmtDate(a.performedOn)}${a.performerName ? ` · ${a.performerName}` : ''}` `` · `removed`:
  `` `Đã bỏ · ${a.removeReasonLabel}` `` · `pending`: `Cần xử lý`); phải: `done` → `<Status kind="done">Đã xong</Status>` ·
  `removed` → `<Info>Đã bỏ</Info>` · `pending && canAct` → `Xác nhận` (`btn btn-sm btn-primary`) + `Bỏ ▾` (`btn btn-sm btn-ghost`) ·
  `pending && !canAct` → `<Status kind="waiting">Cần xử lý</Status>`. Form Xác nhận/Bỏ mở ngay dưới dòng, rộng hết thẻ.
  Giữ `+ Thêm việc` (canAct) ở cuối thân thẻ. Bỏ dòng "Hỗ trợ học thuật xem ở bảng kỹ năng." cũ (dòng 68) — nay ở cột 2.
- [x] **Step 5:** `PhoiHopSosSection` map `turns` → `<TheSos key t cot1 onGoAcademic onChanged />` trong
      `<div className="space-y-2">`; bỏ prop `showStudentName`. Sửa hai nơi gọi: `StudentYThucSection.tsx:178`
      `showStudentName={false}` → `cot1="luot" onGoAcademic={onGoAcademic}`; `ClassYThucCard.tsx:285` → `cot1="hocVien"`.
- [x] **Step 6:** `npm run check` xanh. Bấm thử `Phối hợp SOS` ở hồ sơ Huy và lớp MB-FT 101: mở/đóng bằng chuột và
      phím Enter; bấm link đổi sang tab Học thuật **không** làm thẻ mở/đóng; `Xác nhận` một việc (GVCN) chạy như cũ. 375px:
      cột 1 một hàng, cột 2 + 3 hàng dưới. Commit: `PR-HV (4): thành phần dùng chung OSoNho, DongThoiGian, TheSos`.

---

### Task 5: Tab `Ý thức & Phối hợp` của hồ sơ học viên (§4.3, A2–A5, K2-6 `[Mở]/[Xem]`)

**Files:**
- Modify: `web/src/modules/yThuc/StudentYThucSection.tsx` (viết lại phần vẽ; giữ hooks tải dữ liệu, quyền, các panel)
- Create: `web/src/modules/yThuc/XemPhuongAnPanel.tsx`
- Modify: `web/src/modules/yThuc/RecordViolationPanel.tsx` (prop `onDelete`)

**Interfaces:**
- Consumes: `OSoNho`, `DongThoiGian`, `PhoiHopSosSection` (Task 4), `HangTab` (Task 2), `demTheoNhomViPham` (Task 4).
- Produces:
  ```ts
  // XemPhuongAnPanel.tsx — chỉ đọc; dữ liệu từ GET /measures/:id (MeasureDetail)
  export function XemPhuongAnPanel(props: { measureId: number | null; onClose: () => void }): JSX.Element | null;
  // RecordViolationPanel — thêm, không đổi prop cũ:
  onDelete?: (violationId: number) => void;   // chỉ hiện nút khi đang SỬA
  ```

- [x] **Step 1: `RecordViolationPanel`** — trong `footer` (dòng 96–102), khi `editing && violation && onDelete`: thêm
      bên trái `<button className="btn btn-ghost text-rose-200 mr-auto" onClick={() => { onClose(); onDelete(violation.id); }}>Xoá vi phạm</button>`.
      Hộp xác nhận một dòng (`DeleteViolationConfirm`) giữ nguyên, nơi gọi mở nó (spec §4.3: "xoá nằm trong form sửa").
- [x] **Step 2: `XemPhuongAnPanel.tsx`** — `useApi<any>(measureId ? `/measures/${measureId}` : null, [measureId])`;
      `Modal` (`../../ui/Drawer.tsx`) `open={measureId !== null}` tiêu đề `` `${d.kindLabel} · ${d.studentName}` ``, footer
      một nút `Đóng`. Thân (dùng `Field` của `ui.tsx`, `as="div"`, chữ `text-sm text-slate-200`):
      `Trạng thái` = `statusLabel` · `Ngày thực hiện` = `fmtDate(performedOn)` · `Người thực hiện` =
      `performerName ?? performedByName ?? '—'` · `Người tham gia` (chỉ khi có) · `Lý do / nội dung` = `note ?? '—'`
      (`whitespace-pre-wrap break-words`) · `` `${violations.length} vi phạm được xử lý bằng phương án này` `` = danh sách
      `fmtDate(occurredOn) · categoryLabel · description` · `Tệp hoặc liên kết` = `<BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={d.canManage} tieuDe="" />`
      (B10: đã thực hiện vẫn bổ sung được tệp — quyền do máy chủ kiểm) · dòng cuối `text-[11px] text-slate-500`:
      `` `Xác nhận bởi ${confirmedByName} · ${fmtDate(confirmedAt)}` `` nếu có. Đang tải: `<Skeleton rows={4} />`.
- [x] **Step 3: `StudentYThucSection` — dữ liệu.** Giữ `warn`, `violations`, `measures`, quyền `canEditViolation`,
      `ticked`, các state panel. Đổi:
  - `coord` tải **luôn** (bỏ điều kiện `sub === 'coordination'`) để có số trên nhãn tab con (A5):
    `useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/students/${studentId}/phoi-hop-sos`, [studentId])`.
  - `range` mặc định `'all'`; `RANGES` đổi thứ tự và chữ: `[{key:'all',label:'Tất cả thời gian'},{key:'7',label:'7 ngày'},{key:'30',label:'30 ngày'}]`.
  - Thêm `const [xemId, setXemId] = useState<number | null>(null);`
  - `reload` gọi thêm `coord.reload()`.
  - Lọc nhóm cho dòng **phương án**: hiện khi `!category || m.violations.some((v) => v.category === category)` (trước
    đây mọi phương án bị ẩn khi chọn một nhóm — nay phương án chứa vi phạm của nhóm đó vẫn hiện; ghi Nhật ký).
    Kiểu `MeasureDetail` cục bộ (dòng 18–21) thêm `violations: { category: string }[]`.
- [x] **Step 4: `StudentYThucSection` — bố cục** (thay toàn bộ JSX trả về, dòng 92–199):
  ```
  ┌ đầu khối ─────────────────────────────────────────────── [+ Ghi nhận vi phạm] ┐   (nút: canRecordViolation, btn btn-primary btn-sm)
  │ h2 "Ý thức & Phối hợp" (text-base font-semibold) · p "Lịch sử của riêng học viên này." (text-xs text-slate-500) │
  <HangTab cap="con" ariaLabel="Ý thức & Phối hợp" value={sub} onChange={setSub}
     tabs={[{key:'violations',label:'Vi phạm & xử lý'},{key:'coordination',label:'Phối hợp SOS',so:coord.data?.pendingCount ?? 0}]} />
  sub === 'violations':
    {warn.data?.message && <Alert tone="warn">{message bỏ '⚠ ' đầu}</Alert>}          (giữ như dòng 108)
    <div className="flex flex-wrap gap-2">                                                (A3 — ô số nhỏ)
      <OSoNho nhan="Vi phạm" so={dem.tong} />
      {dem.nhom.map(g => <OSoNho key={g.category} nhan={g.label} so={g.n} />)}
      {preparing > 0 && <OSoNho nhan="PA đang chuẩn bị" so={preparing} tone="warn" />}
      {lastWarning && <OSoNho nhan="Thư cảnh cáo" so={`lần ${lastWarning.slice(-1)}`} />}   (giữ thông tin cũ dòng 72–73)
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">                 (hai dãy nút lọc — giữ kiểu btn btn-sm / btn-primary)
      [Tất cả][{5 nhóm VIOLATION_CATEGORY_LABEL}]            [Tất cả thời gian][7 ngày][30 ngày]
    </div>
    <DongThoiGian coCotChon={canManageDiscipline} muc={…} rong={<Empty title="Chưa có gì trong khoảng này" />} />
    {canManageDiscipline && ticked.size > 0 && (
      <button className="btn btn-sm btn-primary" onClick={() => setMeasureOpen(true)}>Tạo phương án từ {ticked.size} vi phạm</button>)}
  sub === 'coordination':
    <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="luot"
      onGoAcademic={onGoAcademic} onChanged={() => coord.reload()} />
  ```
  `dem = demTheoNhomViPham(vRows)`; `preparing = mRows.filter(m => m.status === 'preparing').length`.
  Bảng ánh xạ một dòng thời gian (`DongThoiGianMuc`):

  | Trường | Dòng **vi phạm** (`v`) | Dòng **phương án** (`m`) |
  |---|---|---|
  | `key` | `` `v${v.id}` `` | `` `m${m.id}` `` |
  | `ngay` | `v.occurredOn` | `m.performedOn ?? m.createdAt.slice(0, 10)` (giữ luật dòng 81) |
  | `chon` | `canManageDiscipline && v.state === 'unhandled'` ? `{checked: ticked.has(v.id), onChange: toggle, nhanDoc: `Chọn vi phạm ${fmtDate(v.occurredOn)}`}` : `null` | `null` |
  | `cot2` | `v.ageLabel` ? `<Alert tone="danger">Vi phạm</Alert>` : `<Status kind="doing">Vi phạm</Status>` | `m.status === 'preparing'` ? `<Status kind="waiting">Phương án</Status>` : `<Status kind="done">Phương án</Status>` |
  | `tieuDe` | `v.description` | `m.kindLabel` |
  | `dongPhu` | `` [v.categoryLabel, v.skillLabel, v.reportedByName, v.state !== 'unhandled' ? v.stateLabel : null, v.ageLabel ? `⚠ đã ${v.ageDays} ngày` : null].filter(Boolean).join(' · ') `` | `` `${m.statusLabel} · gồm ${m.violationCount} vi phạm` `` |
  | `cuoi` | `canEditViolation(v)` ? `<button className="btn btn-sm" onClick={() => setEditViolation(v)}>Sửa</button>` : — | `preparing && canManageDiscipline` → `<button className="btn btn-sm btn-primary" onClick={() => setConfirmMeasureId(m.id)}>Mở</button>` (mở `ConfirmMeasurePanel`); còn lại (đã thực hiện, hoặc GVBM xem PA đang chuẩn bị) → `<button className="btn btn-sm" onClick={() => setXemId(m.id)}>Xem</button>` |

  (Nhãn `Vi phạm`/`Phương án` dùng `Status`/`Alert` có sẵn — **không** xanh lá, xem Global Constraints.) Xoá hai nút
  ✎/🗑 cũ; `RecordViolationPanel` (sửa) nhận `onDelete={(id) => setDeleteId(id)}`. Xoá `summary` chuỗi cũ (dòng
  62–75). Thêm `<XemPhuongAnPanel measureId={xemId} onClose={() => setXemId(null)} />` cạnh các panel.
  Sửa chú thích đầu hàm (dòng 29–32) theo bố cục v3 (ô số nhỏ thay câu một dòng — A3).
- [x] **Step 5:** `npm run check` xanh. Bấm thử (vai GVCN Trần Ngọc Hà, hồ sơ Lê Quang Huy): lọc nhóm + thời gian; tick 2
      vi phạm → nút `Tạo phương án từ 2 vi phạm` hiện → tạo (Lưu — Đang chuẩn bị) → dòng `Phương án` vàng + `Mở` → bấm
      `Mở` → xác nhận → dòng thành xám ✓ + `Xem` → bấm `Xem` thấy chi tiết chỉ đọc; `Sửa` một vi phạm → `Xoá vi phạm` →
      hộp xác nhận một dòng. Vai GVBM: không có ô tick, không có `Mở`, có `Xem`; nút `+ Ghi nhận vi phạm` còn nếu GVBM dạy
      lớp. Vai Quản lý: như GVCN. Tab chính có `⚠` khi em có vi phạm quá 5 ngày; tab con `Phối hợp SOS {n}`. 375px: dòng
      thời gian 3 cột + nút xuống hàng. Commit: `PR-HV (5): tab Ý thức & Phối hợp của hồ sơ học viên theo prototype v3`.

---

### Task 6: Thẻ case học thuật `TheCase` + khối phương án 3 phần `KhoiPhuongAn` (§4.2, Q8)

**Files:**
- Modify: `web/src/modules/cases/SkillBoard.tsx` (thay `CaseCardView` 242–416 và `PlanRow` 418–537; **giữ** `InlineResult`, `PlanDue`, `Chip`, `ScoreCell`, `Trend`, `nextStepOf`, `SkillRow` ngoài dòng gọi)
- Modify: `server/src/cases/cases.ts` (`caseCardOf` ~2256–2378: thêm `attachmentCount`)
- Modify: `shared/domain/hoSoHocVien.ts`, `server/src/tests/hoSoHocVien.tests.ts`

**Interfaces:**
- Produces (server): `CaseCard.attachmentCount: number` — số dòng `attachments` có `owner_type = 'sos_case' AND owner_id = case.id`.
  Thêm trường vào `type CaseCard` ở `SkillBoard.tsx`.
- Produces (shared):
  ```ts
  export type PhuongAnTomTat = {
    status: string; lastOutcome: string | null; preset: boolean; confirmedAt: string | null;
    pendingApproval: boolean; approvalDue: string | null;
    actionDue: string | null; actionOverdue: boolean; completedOn: string | null;
  };
  export const dangChay = (p: { status: string }) => p.status === 'planned' || p.status === 'started';

  /** Cột 2 đầu thẻ case. `tiep` = việc gần nhất có hạn. Hạn DỰ KIẾN XONG (followupDue) KHÔNG phải hạn (F11) — không dùng. */
  export function tienDoCase(plans: readonly PhuongAnTomTat[], c: { status: string; followUntil: string | null; followOverdue: boolean }): {
    coKetQua: number; tong: number; text: string;
    tiep: { text: string; due: string | null; overdue: boolean } | null;
  };
  /** Cột 3 của một khối phương án. */
  export function viecTiepPhuongAn(p: PhuongAnTomTat): {
    loai: 'goi-y' | 'cho-duyet' | 'ghi-ket-qua' | 'da-xong'; text: string; due: string | null; overdue: boolean;
  };
  ```
  Luật `tienDoCase`: `tong = plans.length`; `coKetQua = plans.filter(p => p.lastOutcome !== null).length`; `text =
  tong === 0 ? 'Chưa có phương án' : `${coKetQua}/${tong} PA có kết quả``. `tiep` (theo thứ tự, lấy cái đầu khớp, chỉ
  xét `chay = plans.filter(dangChay)`): case `done` → `null`; có PA gợi ý chưa xác nhận → `{text:'PA gợi ý chờ xác nhận',
  due:null, overdue:false}`; có PA chờ duyệt → `{text:'Chờ Quản lý trả lời', due: approvalDue của PA đó, overdue:false}`;
  có `actionDue` → sớm nhất: `{text:'PA tiếp', due, overdue: actionOverdue}`; còn `c.followUntil` → `{text:'Cập nhật PA',
  due: c.followUntil, overdue: c.followOverdue}`; không → `null`.
  Luật `viecTiepPhuongAn`: `preset && !confirmedAt` → `goi-y` / `Gợi ý tự động · chờ xác nhận`; `pendingApproval` →
  `cho-duyet` / `Chờ Quản lý trả lời`, `due = approvalDue`; `dangChay` → `ghi-ket-qua` / `Ghi kết quả`, `due =
  actionDue`, `overdue = actionOverdue`; còn lại → `da-xong` / `Đã kết thúc`, `due = completedOn`.

- [x] **Step 1 (TDD, shared):** `PR-HV · Q8 Tiến độ case "k/n PA có kết quả" và việc tiếp theo` — (a) 2 PA, 1 có
      `lastOutcome` → `'1/2 PA có kết quả'`; (b) 0 PA → `'Chưa có phương án'`, `tiep` theo `followUntil`; (c) PA gợi ý chưa
      xác nhận thắng PA có hạn; (d) hai PA đang chạy hạn 30/08 và 25/08 → `due '…-08-25'`; (e) PA chỉ có `followupDue`
      (không `actionDue`) → **không** lấy làm hạn; (f) case `done` → `tiep null`. `PR-HV · Q8 Việc tiếp theo của một PA` —
      bốn nhánh, mỗi nhánh một assert. Đỏ → viết → xanh.
- [x] **Step 2 (TDD, server):** `PR-HV · Q8 Thẻ case có số bằng chứng (attachmentCount) khớp bảng attachments` — lấy một
      học viên có case; đọc `cases.skillSupportBoard(P.admin, sid, cid).rows.flatMap(r => r.cases)`; mỗi case:
      `typeof c.attachmentCount === 'number'` và bằng `SELECT COUNT(*) n FROM attachments WHERE owner_type='sos_case' AND owner_id=?`.
      Để phép kiểm không chỉ so 0 với 0: nếu không case nào có tệp, chèn **một liên kết** bằng SQL vào `attachments` cho
      case đầu tiên (đọc cột bắt buộc trong `server/src/schema.sql`, bảng `attachments` — dùng `kind='link'`), kiểm số = 1,
      rồi `DELETE` dòng đó. Đỏ.
- [x] **Step 3: `caseCardOf`** — trong object trả về (sau `backfilledOn`), thêm:
  ```ts
  /* Số bằng chứng của case (PR-HV) — để nhãn "Bằng chứng (n)" thu gọn mà không phải tải danh sách tệp. */
  attachmentCount: (conn.prepare("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'sos_case' AND owner_id = ?")
    .get(caseId) as any).n as number,
  ```
  (SQL tại chỗ — **không** import từ `platform/attachments.ts` để không dính file đóng băng.) Xanh.
- [x] **Step 4: `TheCase`** (thay `CaseCardView`, giữ **mọi** state và hộp thoại: `adding`, `completing`, `causeOpen`,
      `dismissOpen`, `ActionDialog`, `OutcomeDialog`, `CauseDeterminationPanel`, `DismissCaseForm`). Thêm state
      `moXong` (mặc định `c.status === 'done'`), `moBangChung` (mặc định `false`). `open` mặc định `c.status !== 'done'` (giữ).
  - **Đầu thẻ** — `<button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full text-left appearance-none bg-transparent border-0 cursor-pointer">`
    bọc lưới `grid gap-x-3 gap-y-1 items-center px-3 py-2.5 grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]`:

    | Cột | Dòng chính | Dòng phụ (`text-[11px] text-slate-500`) |
    |---|---|---|
    | 1 (`col-span-2 md:col-span-1 min-w-0`) | mũi tên `›` xoay 90° khi mở (giữ kiểu dòng 269–270) + `` `${row.label} · ${c.title}` `` (`text-sm text-slate-100 break-words`) | `c.issueLabel ?? 'Chưa phân loại vấn đề'` + (`c.openedOn` ? ` · mở ${fmtDate(c.openedOn)}` : '') |
    | 2 (`min-w-0`) | `td.text` (`text-xs font-semibold text-slate-200`; `tong === 0` → `text-amber-200`) | `td.tiep` ? `` `${td.tiep.text}${td.tiep.due ? `: hạn ${fmtDate(td.tiep.due)}` : ''}${td.tiep.overdue ? ' · quá hạn' : ''}` `` (quá hạn → `text-rose-300`) : case done → `c.outcomeLabel ? `Kết luận: ${c.outcomeLabel}` : ''` |
    | 3 (`justify-self-end flex flex-col items-end gap-1`) | `c.sos.dismissed` → `<Status kind="done">Không cần theo dõi · {c.sos.dismissed.label}</Status>`; `c.status === 'done'` → `<Status kind="done">Đã hoàn thành</Status>`; còn lại: (`c.sosLevel > 0` → `<Level tone={sosTone(c.sosLevel)}>{sosLabel(c.sosLevel)}</Level>`) **và** `<Status kind="doing">Đang xử lý</Status>` | — |

    `td = tienDoCase(c.plans, c)`.
  - **Thân thẻ** (`px-3 pb-3 space-y-2.5`, chỉ khi `open`), đúng thứ tự:
    1. Khối `Chờ GVBM xác định nguyên nhân · hạn …` (giữ nguyên dòng 286–301).
    2. `c.sos.dismissed` → dòng `Không cần theo dõi · {text || label}` (giữ dòng 304–308 — chữ tự gõ của lý do Khác chỉ hiện ở đây).
    3. Dòng nhỏ các dấu: `từ lộ trình trước` · `case song song` · `nhập bù · {người} ghi ngày {ngày}` (gộp dòng 309–320 bỏ phần phân loại/ngày mở — đã ở đầu thẻ).
    4. `c.summary` → `<p className="text-sm text-slate-300 m-0 leading-relaxed break-words"><span className="text-slate-500">Mô tả: </span>{c.summary}</p>`.
    5. **Phương án:** `c.plans.length === 0` → giữ câu dòng 325. Ngược lại: hàng tiêu đề chỉ desktop
       `<div className="hidden md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 px-2.5 text-[10px] uppercase tracking-wide text-slate-500"><span>Phương án</span><span>Kết quả gần nhất</span><span>Việc tiếp theo</span></div>`;
       rồi mọi PA **đang chạy** (`dangChay`) → `<KhoiPhuongAn …/>` (**không bao giờ ẩn**); rồi nếu có PA đã xong:
       `<button type="button" className="btn btn-sm btn-ghost" aria-expanded={moXong} onClick={() => setMoXong(!moXong)}>{moXong ? '▾' : '▸'} {xong.length} PA đã xong</button>`
       và khi `moXong` vẽ các khối đó.
    6. **Bằng chứng:** `<button type="button" className="btn btn-sm btn-ghost" aria-expanded={moBangChung} onClick={…}>{moBangChung ? '▾' : '▸'} Bằng chứng ({c.attachmentCount})</button>`;
       mở → `<BangChung ownerType="sos_case" ownerId={c.id} canEdit={c.canEdit} tieuDe="" />`. (Số trên nhãn là số lúc
       tải bảng — sau khi thêm tệp, số cập nhật ở lần tải bảng kế tiếp; chấp nhận, ghi Nhật ký.)
    7. Kết luận case đã xong (giữ dòng 341–347).
    8. Dãy `MT{n} · {ngày}` + `<Han loai="cap-nhat-pa" …/>` (giữ dòng 349–357).
    9. **Chân thẻ — mọi nút gom ở đây** (`flex flex-wrap items-center gap-2`, chỉ khi `c.canEdit`): `+ Thêm phương án` ·
       (`c.status !== 'done'`) `Hoàn thành case` (`btn-primary`, `disabled={blocked || !c.canClose}`, `title` giữ) ·
       (`c.sos.awaitingCause && !dismissOpen`) `Không cần theo dõi` (`btn-ghost`) · rồi **cạnh nút mờ**, khi `blocked`:
       `<span className="text-xs text-slate-400">Chưa hoàn thành: {c.closeBlockers.join(' · ')}</span>`. Dưới dãy nút:
       `DismissCaseForm` khi mở (giữ) và câu `!c.canClose` (giữ nguyên chữ dòng 401–402). **Bỏ** câu "Case đang xử lý,
       chưa kết luận." (dòng 361–363) — cột 3 đầu thẻ đã nói; ghi Nhật ký.
- [x] **Step 5: `KhoiPhuongAn`** (thay `PlanRow`, giữ state `editing`, `showHistory`, lịch sử dòng 495–523, `BangChung`
      của phương án dòng 525–529, `InlineResult`). Khung: `<div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--line)' }}>`
      chứa lưới `grid gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]`:

      | Phần | Nội dung |
      |---|---|
      | 1 · Phương án | nút `▸/▾` mở lịch sử (giữ dòng 441–446, `aria-*` giữ) + `▶`/`✓` + `p.name` (`break-words`); dòng phụ: `p.performer ?? 'chưa có người thực hiện'` + ` · từ ${fmtDate(p.startedOn)}` + (`completedOn` → ` → …`) |
      | 2 · Kết quả gần nhất | nhãn mobile `<span className="md:hidden block text-[10px] uppercase text-slate-500">Kết quả gần nhất</span>`; `p.lastOutcomeLabel` → nhãn như dòng 477–483 (dấu `OUTCOME_MARK` + nhãn + ` · ngày`) và `p.lastNote` bên dưới (`text-xs text-slate-300 break-words`, **không** cắt); không có → `<span className="text-xs text-slate-500">Chưa có kết quả</span>` |
      | 3 · Việc tiếp theo | nhãn mobile `Việc tiếp theo`; `v = viecTiepPhuongAn(p)`: `goi-y` → chữ `text-amber-200/80` + (`canEdit` → `<PresetPlanActions interventionId={p.id} description={p.name} followupDue={p.followupDue} onDone={onChanged} />`) · `cho-duyet` → `Chờ Quản lý trả lời` (`text-sky-300`) + `hạn {approvalDue}` · `ghi-ket-qua` → `<PlanDue p={p} />` (hai mốc F11, giữ) + (`canEdit && !editing`) nút `Ghi kết quả` (`btn btn-sm`) · `da-xong` → `Đã kết thúc · {fmtDate(completedOn)}` (`text-xs text-slate-500`) |

      Lịch sử (khi `showHistory`) và `InlineResult` (khi `editing`) vẽ **dưới lưới, rộng hết khối** (bỏ `ml-5` của
      `InlineResult` dòng 624 nếu làm lệch trên 375px — chỉnh lớp, không đổi logic). `outcomeTone` giữ.
- [x] **Step 6:** `SkillRow` dòng 233–235: gọi `<TheCase key={c.id} c={c} row={row} onChanged={onChanged} />`. Sửa chú
      thích đầu hai hàm (thay chú thích "MỘT THẺ CASE … PR-D" và "MỘT PHƯƠNG ÁN — MỘT DÒNG") cho đúng bố cục v3.
- [x] **Step 7:** `npm run check` xanh (số = trước + 3). Bấm thử (ba vai) trên: case có 2 PA song song + ghi chú dài +
      tên GV dài (màn 2 Task 0) — không tràn, không cắt ở desktop và 375px; `Ghi kết quả` → lưu → cột 2 cập nhật, tiến độ
      `k/n` tăng; PA đã xong thu gọn và mở được; case từ SOS chờ nguyên nhân (màn 3): khối vàng, `Xác định nguyên nhân`,
      PA `Gợi ý tự động · chờ xác nhận` với `Xác nhận/Sửa/Thay` ở cột 3, `Không cần theo dõi` ở chân; case đã hoàn thành
      đóng mặc định, cột 3 `Đã hoàn thành`. GVBM không dạy kỹ năng đó: không thấy nút sửa (như cũ). Commit:
      `PR-HV (6): Q8 thẻ case kiểu SOS, mỗi phương án một khối ba phần`.

---

### Task 7: Hồ sơ lớp — tab `Ý thức & Phối hợp` theo prototype lớp (§4.5, A7)

**Files:**
- Modify: `web/src/modules/yThuc/ClassYThucCard.tsx` (phần vẽ; **giữ nguyên** `rowsForCategory` 77–100, `students` sắp xếp 102–106, `allCount` 108, `timeline` 110–114, `tickOf/toggleTick`, mọi panel)

**Interfaces:**
- Consumes: `DongThoiGian` (`day-du` cho Theo thời gian, `gon` cho thẻ "Vi phạm gần đây"), `TheSos` qua `PhoiHopSosSection cot1="hocVien"`, `HangTab`, `demTheoNhomViPham`, `XemPhuongAnPanel`, `RecordViolationPanel.onDelete`.

- [x] **Step 1: Dữ liệu phụ.** `const rosterById = new Map((roster.data ?? []).map((r: any) => [r.id, r]));` — dòng phụ
      cột 1: `` [r?.studentCode, r ? studentStatusLabel(r.status).toLowerCase() : null].filter(Boolean).join(' · ') ``
      (thay `FT · đang học` của prototype — cả lớp cùng chương trình nên chữ `FT` không phân biệt được ai; xem Self-review J4).
      `const prepOf = (sid: number) => d.preparing.filter((m) => m.studentId === sid);`
- [x] **Step 2: Đầu khối.** `Card title="Ý thức & Phối hợp"` giữ; `action` = nút `+ Ghi nhận vi phạm` (`btn btn-sm btn-primary`,
      `d.canRecord`). Cảnh báo lớp giữ (dòng 128–130). Tab con bằng `HangTab cap="con"`: `Vi phạm & xử lý` `so={allCount}`
      · `Phối hợp SOS` `so={coord.data?.pendingCount ?? 0}` (giữ ý nghĩa số K3-3).
- [x] **Step 3: Theo học sinh — dòng học viên.** Mỗi em: khung `rounded-lg border` + đầu dòng là `<button type="button" aria-expanded>`
      bọc lưới `grid gap-x-3 gap-y-1 items-center px-3 py-2.5 grid-cols-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,12rem)_auto]`:

      | Cột | Nội dung |
      |---|---|
      | 1 (`col-span-2 md:col-span-1`) | `studentName` (`text-sm font-semibold`) · dòng phụ Step 1 |
      | 2 | `` `${s.violations.length} vi phạm` `` (`text-sm font-semibold`) · dòng phụ `dem.nhom.map(g => `${g.n} ${g.label}`).join(' · ')` với `dem = demTheoNhomViPham(s.violations)` (thay `violationBreakdown` 316–322 — xoá hàm đó) |
      | 3 | `s.warningActive ? <Alert tone="warn">cũ nhất {s.oldestAgeDays} ngày</Alert> : <span className="text-xs text-slate-500">Không có cảnh báo</span>` · dòng phụ `` `${prepOf(s.studentId).length} PA đang chuẩn bị` `` |
      | 4 (`justify-self-end`) | `<span className="btn btn-sm" aria-hidden>{mở ? 'Đóng' : 'Mở'}</span>` (span, không phải button — tránh nút lồng nút) |

      Mở ra: `<div className="px-3 pb-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">` hai thẻ `rounded-lg border p-2.5`:
      - **`Vi phạm gần đây`** (tiêu đề `text-[11px] uppercase text-slate-500`): `<DongThoiGian bien="gon" coCotChon={d.canManage} …/>`
        mỗi vi phạm: `chon` (canManage) · `tieuDe = v.description` · `dongPhu = [v.categoryLabel, v.skillLabel, v.reportedByName, v.ageLabel ? `⚠ đã ${v.ageDays} ngày` : null].filter(Boolean).join(' · ')` ·
        `cuoi` = `<Info>{v.categoryLabel}</Info>` + (`canEditViolation(v)` → nút `Sửa`); `rong` = `<p className="text-xs text-slate-500 m-0">Không có vi phạm chưa xử lý ở nhóm này.</p>`.
        Dưới: `d.canManage && tickOf(sid).size > 0` → `Tạo phương án từ {n} vi phạm` (`btn btn-sm btn-primary mt-2`).
      - **`Xử lý`**: có `prepOf(sid)` → mỗi PA: `m.kindLabel` (`text-sm font-medium`) + `` `Đang chuẩn bị · ${m.violationCount} vi phạm` `` + nút
        (`d.canManage` → `Mở phương án` `btn-primary` mở `ConfirmMeasurePanel`; không → `Xem` mở `XemPhuongAnPanel`).
        Không có → `Chưa có phương án đang chuẩn bị` + (`d.canManage && s.violations.length > 0`) nút `Tạo phương án` —
        mở `CreateMeasurePanel` với vi phạm **đã tick**, chưa tick thì **mọi vi phạm đang hiện** của em (panel cho bỏ bớt
        từng dòng; ghi Nhật ký). Rồi `Gần đây: …` (giữ dòng 234–239) và `<Link className="link text-xs" to={`/hoc-vien/${sid}?tab=y-thuc`}>Hồ sơ học viên →</Link>` (A6 — mở thẳng tab).
- [x] **Step 4: Theo thời gian.** Thay bảng dòng 249–273 bằng `<DongThoiGian bien="day-du" muc={timeline.map(v => ({ key: `v${v.id}`, ngay: v.occurredOn, cot2: <span className="text-sm text-slate-200">{v.studentName}</span>, tieuDe: v.description, dongPhu: [v.categoryLabel, v.reportedByName].filter(Boolean).join(' · '), cuoi: <><Info>{v.categoryLabel}</Info>{canEditViolation(v) && <button className="btn btn-sm" onClick={() => setEditViolation(v)}>Sửa</button>}</> }))} rong={<Empty title="Không còn vi phạm nào chưa xử lý." />} />`.
- [x] **Step 5: Phối hợp SOS.** Giữ nút `Chỉ hiện lượt chưa xong / Hiện cả lượt đã xong`; `PhoiHopSosSection cot1="hocVien"` (Task 4).
- [x] **Step 6:** `RecordViolationPanel` (sửa) nhận `onDelete={(id) => setDeleteId(id)}`; xoá mọi nút ✎/🗑; thêm
      `XemPhuongAnPanel` + state `xemId`. `npm run check` xanh. Bấm thử MB-FT 101 (GVCN, GVBM, Quản lý): lọc từng nhóm —
      **số trên tab con không đổi theo nhóm** (K3-3), em chỉ có PA đang chuẩn bị ở nhóm khác không lọt vào nhóm đang chọn
      (K3-2) — so với ảnh trước; mở một em, tick, tạo, `Mở phương án`, xác nhận; Theo thời gian; Phối hợp SOS mở/xác nhận.
      375px. Commit: `PR-HV (7): hồ sơ lớp — tab Ý thức & Phối hợp theo prototype v3`.

---

### Task 8: Màn trộn — `PA học thuật` / `PA xử lý` (D1)

**Files:**
- Modify: `server/src/worklist/mywork.ts`, `web/src/modules/worklist/BranchPulse.tsx`, `web/src/modules/cases/IssueAnalysis.tsx`, `web/src/modules/cases/CaseBoardPage.tsx`, `shared/domain/metrics.ts`, `shared/domain/people.ts`

"Màn trộn" = màn có **cùng lúc** chữ của hai loại (hoặc có thể có): Tổng quan / Việc cần làm (`OverviewPage`: `WorkList`
+ `YThucReminders` + `BranchPulse` + `MetricTiles`), Phân tích/Thực trạng của Quản lý (`CaseBoardPage`: `IssueAnalysis`
+ `YThucAnalysisView`), chuông thông báo, danh sách quyền ở Quản trị. Phía Ý thức đã đổi ở Task 1 (`phương án xử lý`).
Ở đây đổi phía **học thuật** — **chỉ nhãn, tiêu đề cột, nút, câu ngắn**; chú giải dài (`hint`, `SectionNote`) giữ
"phương án" vì tiêu đề ngay trên đã phân biệt (Self-review J6).

- [x] **Step 1:** `rg -n "[Pp]hương án" server/src/worklist/mywork.ts web/src/modules/worklist/BranchPulse.tsx web/src/modules/cases/IssueAnalysis.tsx web/src/modules/cases/CaseBoardPage.tsx` — đối chiếu với bảng dưới (số dòng đo 22/09):

  | File:dòng | Cũ | Mới |
  |---|---|---|
  | `mywork.ts:132` | `…xác nhận, sửa hoặc thay phương án gợi ý — ` | `…xác nhận, sửa hoặc thay PA học thuật gợi ý — ` |
  | `mywork.ts:159` | `label: 'Thiếu phương án'` | `'Thiếu PA học thuật'` |
  | `mywork.ts:161` | `'Quá hạn đề xuất phương án'` | `'Quá hạn đề xuất PA học thuật'` |
  | `mywork.ts:172` | `'Đề xuất phương án cần bạn duyệt, …'` | `'Đề xuất PA học thuật cần bạn duyệt, …'` |
  | `mywork.ts:178` | `'Làm phương án đã hẹn'` | `'Làm PA học thuật đã hẹn'` |
  | `mywork.ts:179` | `'Phương án đã lên kế hoạch và tới ngày phải làm. …'` | `'PA học thuật đã lên kế hoạch và tới ngày phải làm. …'` |
  | `mywork.ts:411` | `'phương án hỗ trợ'` (tên dự phòng) | `'PA học thuật'` |
  | `mywork.ts:432` | `'Duyệt phương án'` | `'Duyệt PA học thuật'` |
  | `mywork.ts:739–740` | `— chưa có phương án hỗ trợ …` | `— chưa có PA học thuật …` |
  | `mywork.ts:743` | `actionLabel: 'Đề xuất phương án'` | `'Đề xuất PA học thuật'` |
  | `mywork.ts:747` | `statusLabel: 'Chưa có phương án'` | `'Chưa có PA học thuật'` |
  | `mywork.ts:790` | `'phương án gợi ý chưa được xác nhận'` | `'PA học thuật gợi ý chưa được xác nhận'` |
  | `BranchPulse.tsx:52, 64` | `label: 'Thiếu phương án'` | `'Thiếu PA học thuật'` |
  | `BranchPulse.tsx:54, 65` | `label: 'Phương án cần cập nhật'` | `'PA học thuật cần cập nhật'` |
  | `BranchPulse.tsx:184` | `{…} phương án cần cập nhật` | `{…} PA học thuật cần cập nhật` |
  | `IssueAnalysis.tsx:138` | `Thiếu phương án` | `Thiếu PA học thuật` |
  | `IssueAnalysis.tsx:250` | `>Phương án<` (tiêu đề cột) | `>PA học thuật<` |
  | `IssueAnalysis.tsx:262` | `{r.noPlan} case chưa có phương án` | `{r.noPlan} case chưa có PA học thuật` |
  | `IssueAnalysis.tsx:297` | `Ẩn/Xem hiệu quả từng loại phương án` | `Ẩn/Xem hiệu quả từng loại PA học thuật` |
  | `IssueAnalysis.tsx:303` | `Chưa có phương án nào kết thúc …` | `Chưa có PA học thuật nào kết thúc …` |
  | `IssueAnalysis.tsx:310` | `Loại phương án` | `Loại PA học thuật` |
  | `IssueAnalysis.tsx:375` | `` `${r.planCount} phương án` `` · `'chưa có phương án'` | `` `${r.planCount} PA học thuật` `` · `'chưa có PA học thuật'` |
  | `CaseBoardPage.tsx:49` | `no_plan: 'Chưa có phương án hỗ trợ'` | `'Chưa có PA học thuật'` |
  | `metrics.ts:82` | `ten: 'Case thiếu phương án'` | `'Case thiếu PA học thuật'` |
  | `metrics.ts:89` | `'Phương án cần cập nhật'` | `'PA học thuật cần cập nhật'` |
  | `metrics.ts:96` | `'Phương án chờ duyệt'` | `'PA học thuật chờ duyệt'` |
  | `metrics.ts:103` | `'Phương án có kết quả xác định'` | `'PA học thuật có kết quả xác định'` |
  | `metrics.ts:~216` (`METRIC_UNIT_LABEL`) | `'phuong-an': 'phương án'` | `'phuong-an': 'PA học thuật'` |
  | `people.ts:141` | `'case.approve': 'Duyệt phương án hỗ trợ'` | `'Duyệt phương án học thuật'` |

  Mã chỉ số (`case-thieu-pa`, `pa-*`) và khoá (`noPlan`, `overdueUpdate`) **không đổi**.
- [x] **Step 2: Thông báo.** `rg -n -A4 "notify\(" server/src --glob '!**/tests/**'` — thông báo nào có "phương án"
      (học thuật) trong `title`/`body` ở file **không đóng băng** → thêm "học thuật" (`PA học thuật`). Đã đổi ở Task 1:
      `sosAuto.ts:148`. Thông báo của `measures.ts:446` không chứa chữ cũ. Ghi danh sách đã đổi (hoặc "không có thêm") vào Nhật ký.
- [x] **Step 3:** `rg -n "Làm phương án đã hẹn|Thiếu phương án|Phương án cần cập nhật|Chưa có phương án hỗ trợ|Duyệt phương án hỗ trợ" server/src/tests shared web/src`
      — phép kiểm nào **so sánh** đúng chữ vừa đổi → sửa theo chữ mới (hợp lệ, D1), ghi Nhật ký. (Soát 22/09: chỉ có chú
      thích và câu báo lỗi của assert — không phải so sánh.) Cập nhật `TU_DIEN_VA_CHU.md` §8 các chữ màn trộn.
- [x] **Step 4:** `npm run check` xanh. Bấm thử Tổng quan (Quản lý, GVCN) và `/hoc-thuat` hai góc. Commit:
      `PR-HV (8): màn trộn ghi rõ PA học thuật / PA xử lý`.

---

### Task 9 🛑 GATE: Chữ ở file đóng băng — CHỈ sau khi PR-Z2b đã merge

**Files:**
- Modify: `server/src/yThuc/measures.ts`, `server/src/migrate.ts`, `server/src/seed/seed.ts`
- Modify: `server/src/tests/yThuc.tests.ts` (616, 617, 667 — số dòng có thể đổi sau khi gộp), `server/src/tests/hoSoHocVien.tests.ts`

- [x] **Step 1: 🛑 Kiểm điều kiện.** `git fetch origin` rồi xem PR-Z2b đã merge vào `origin/main` chưa (tìm commit merge
      "Z2b"/`pr-z2b-an-toan-du-lieu`, hoặc `gh pr view <số> --json state`). **Chưa merge → DỪNG task này**, làm Task 10
      Step 1–3 (phần không phụ thuộc), rồi báo chủ sản phẩm: "Phần giao diện xong. Còn một ít chữ trong 3 file máy chủ đang
      bị PR-Z2b sửa — tôi chờ PR-Z2b được gộp rồi làm nốt. Anh/chị báo tôi khi đã gộp PR-Z2b." **Không** mở PR khi Task 9 chưa xong.
- [x] **Step 2:** `git merge origin/main` vào nhánh (không rebase). Xung đột → giải quyết giữ **cả hai** bên, ghi Nhật
      ký. `npm run check` xanh (số ≥ trước + số phép Z2b thêm). Commit merge.
- [x] **Step 3 (TDD):** xoá hằng `CHO_Z2B` (để mảng rỗng) trong `hoSoHocVien.tests.ts`; thêm `'server/src/seed/'` vào một
      danh sách loại trừ **vĩnh viễn** có chú thích "dữ liệu kể chuyện của bộ demo, không phải chữ giao diện" — **trừ**
      `server/src/seed/seed.ts` và `server/src/seed/duLieuNen.ts` (vẫn quét — 🆕 22/09: `duLieuNen.ts` do PR-Z2b thêm là
      dữ liệu nền của **bản chính**, không phải chuyện kể demo). `npm test` → phép quét **đỏ**, liệt kê các chỗ dưới.
- [x] **Step 4: Đổi chữ** (tìm lại bằng `rg -n "[Bb]iện pháp|Hãy|hãy" server/src/yThuc/measures.ts server/src/migrate.ts server/src/seed/seed.ts` —
      Z2b có thể đã đẩy dòng):

  | Chỗ (dòng đo 22/09) | Mới |
  |---|---|
  | `measures.ts:69` | `Không tìm thấy phương án xử lý` |
  | `measures.ts:117` (`MANAGE_MESSAGE`) | `Chỉ giáo viên chủ nhiệm của lớp hoặc Quản lý trong phạm vi mới tạo và thực hiện được phương án xử lý — giáo viên bộ môn chỉ đọc.` |
  | `measures.ts:176` | `Chọn loại phương án xử lý trong danh sách.` |
  | `measures.ts:184` | `Loại "Khác" cần ghi tên phương án xử lý — GVCN tự đặt.` |
  | `measures.ts:211, 408` | `Phương án xử lý phải có ít nhất một vi phạm.` |
  | `measures.ts:215` | `Một phương án xử lý chỉ xử lý một học viên — không gom vi phạm của nhiều em vào cùng một phương án.` |
  | `measures.ts:222` | `` `Phương án xử lý này đã thực hiện — ${what} đã khóa. Chỉ bổ sung được ghi chú và tệp.` `` |
  | `measures.ts:302` | `Vi phạm này không nằm trong phương án xử lý.` |
  | `measures.ts:303` | `Phương án xử lý phải còn ít nhất một vi phạm — muốn bỏ hết thì xóa phương án.` |
  | `measures.ts:327` | `Phương án xử lý này đã thực hiện — loại và người phụ trách đã khóa. Chỉ bổ sung được ghi chú và tệp.` |
  | `measures.ts:360` | `Phương án xử lý này đã thực hiện — không xóa được, vì đó là việc đã làm thật.` |
  | `measures.ts:386` | `Phương án xử lý này đã thực hiện rồi.` |
  | `measures.ts:460` | `Cần chọn học viên hoặc lớp để xem danh sách phương án xử lý.` |
  | `migrate.ts:46` | `'Database chưa có bảng nào — chạy `npm run seed`.'` |
  | `migrate.ts:2469, 2594, 2772, 2878` (câu `applied.push`) | "biện pháp" → "phương án xử lý" (giữ nghĩa từng câu) |
  | `migrate.ts:2694` (tên lưu cho dữ liệu cũ) | `'Phương án xử lý (dữ liệu cũ)'` |
  | `migrate.ts:2525` (chú thích SQL trong chuỗi DDL `-- … tên biện pháp …`) | **Giữ** — thêm vào `CHO_PHEP` `['server/src/migrate.ts', "-- Chỉ dùng khi kind = 'other'"]` (đổi chuỗi DDL không đem lại gì, có rủi ro với phép so schema) |
  | `seed/seed.ts:299` | `'Phương án xử lý': yThuc.measures,` (khoá in ra màn hình lệnh seed) |

  **Không** đổi logic/SQL nào khác trong ba file này. Không đụng phần Z2b vừa sửa (`deleteMeasure` ngoài câu 360).
- [x] **Step 5: Phép kiểm bám câu chữ** (đổi hợp lệ, D1): `yThuc.tests.ts` ~616 `/loại biện pháp/i` → `/loại phương án/i`;
      ~617 và ~667 `/tên biện pháp/i`, `/tên biện pháp/` → `/tên phương án/i`, `/tên phương án/`. Rồi
      `rg -n "biện pháp" server/src/tests` tìm regex khác đang so với câu vừa đổi (ví dụ `/đã thực hiện/`, `/ít nhất một vi phạm/`
      vẫn khớp — không sửa). Ghi Nhật ký từng dòng đã sửa.
- [x] **Step 6:** `npm run check` xanh; phép quét PR-HV xanh **không còn** `CHO_Z2B`. `npm run migrate` trên database dev
      của worktree vẫn chạy (không lỗi). Commit: `PR-HV (9): chữ "phương án xử lý" ở measures/migrate/seed sau khi gộp Z2b`.

---

### Task 10: Nghiệm thu, tài liệu, rà soát, mở PR

**Files:**
- Create: `thiet-ke/anh/pr-hv/sau-*.png`
- Modify: `plan.md`, `thiet-ke/BAN_DO_OVERHAUL.md`, `CODE_MAP.md`, plan này (Nhật ký)

- [x] **Step 1: Quét chữ bằng tay** (bổ sung cho phép kiểm tự động):
  ```
  rg -n "[Bb]iện pháp|BIỆN PHÁP" web/src shared server/src --glob '!**/tests/**'
  rg -nw "BP" web/src shared server/src --glob '!**/tests/**'
  rg -n "[Hh]ãy " web/src shared server/src scripts --glob '!**/tests/**'
  ```
  **Chấp nhận được:** dòng nằm trong chú thích (`//`, `/* */`, `*` đầu dòng), chuỗi DDL đã ghi ở `CHO_PHEP`, dữ liệu kể
  chuyện trong `server/src/seed/` (trừ `seed.ts`), và (nếu Task 9 còn chờ) ba file đóng băng. **Không chấp nhận:** mọi
  chuỗi trong nháy/JSX mà người dùng thấy. Dán số dòng từng loại vào Nhật ký.
- [x] **Step 2: Nghiệm thu spec §7** — bật máy chủ dev (🛑 hỏi chủ sản phẩm như Task 0 Step 5), `npm run seed` mới, rồi
      bấm thử **ba vai** (GVCN Trần Ngọc Hà · GVBM Phạm Thu Trang · Quản lý Nguyễn Khánh Vy), **desktop và 375px**, chụp
      `thiet-ke/anh/pr-hv/sau-<màn>-<vai>-<khổ>.png` cho đúng sáu màn ở Task 0 Step 6, và ghi từng dòng vào Nhật ký
      (ĐẠT/HỎNG + ghi chú):
      1. Hồ sơ Lê Quang Huy ba tab; `?tab=` mở thẳng từng tab; ⚠ trên tab Ý thức khi có cảnh báo.
      2. Case 2 PA song song + ghi chú dài + tên GV dài — không tràn, không cắt.
      3. Case từ SOS chờ xác định nguyên nhân — khối vàng, nút, PA gợi ý ở cột 3.
      4. Tạo PA từ 2 vi phạm rồi xác nhận; `Xem` PA đã thực hiện.
      5. Phối hợp SOS: mở thẻ, xác nhận một việc; link về tab Học thuật.
      6. Hồ sơ lớp MB-FT 101: Theo học sinh (mở một em, tạo/mở PA), Theo thời gian, Phối hợp SOS.
      7. Màn trộn: Tổng quan/Việc cần làm và Phân tích của Quản lý ghi `PA học thuật` / `Phương án xử lý`.
      Kiểm console trình duyệt không có lỗi (`read_console_messages onlyErrors`). Mỗi màn: so với ảnh trước — mọi nút có
      trước đây vẫn còn (theo đúng vai). Thiếu nút nào → lỗi, sửa trước khi đi tiếp.
- [x] **Step 3: Tài liệu.**
  - `plan.md` §22.7: Q7 và Q8 đánh `[x]` kèm "→ làm ở **PR-HV** (D5, spec 2026-09-22)"; thêm một dòng dưới tiêu đề §22.7:
    "Q7, Q8 chuyển sang PR-HV (22/09/2026)". §12.15 (K2-6): đánh dấu nút `[Mở]/[Xem]` và số `Phối hợp SOS {n}` đã làm ở
    PR-HV. Ghi chú đảo K3-6 ("Hãy") theo D3.
  - `thiet-ke/BAN_DO_OVERHAUL.md` §7: các dòng "Bốn ô đầu…", "Ô Test ghi đợt…", "Ô việc có động từ…", "Mỗi PA một khối ba
    phần…", "PA đã xong thu gọn…" → `✅ Đã làm` · cột PR `**PR-HV ✅**`; dòng "Số `Phối hợp SOS {n}`…" (~222) và "Nút
    `[Mở]`/`[Xem]`…" (~223) → `✅ Đã làm` · `**PR-HV ✅**`. Dòng "Bốn ô số phải bấm được" **giữ** PR-R.
  - `CODE_MAP.md`: thêm dòng cho `shared/domain/hoSoHocVien.ts`, `web/src/ui/{HangTab,OSoNho,DongThoiGian}.tsx`,
    `TheSos` (trong `PhoiHopSosSection.tsx`), `XemPhuongAnPanel.tsx`; sửa dòng 86 `web/src/modules/yThuc/` *(chưa có)* → đã có.
  - `plan.md` §14: một dòng lịch sử `| 22/09/2026 (hoặc ngày thật) | Claude (session PR-HV, <model>) | … |` gồm: N0 → số cuối,
    số phép mới, dữ liệu đã thêm (`attachmentCount`, `headline.next.overdue`), các quyết định khi plan im lặng, việc chưa làm.
  Commit: `PR-HV (10): nghiệm thu, ảnh trước/sau, cập nhật plan và bản đồ`.
- [x] **Step 4:** `superpowers:requesting-code-review` — **một** agent rà toàn bộ diff nhánh theo plan này. Người rà là
      model **khác** người code (xem bảng đầu file). Câu hỏi cho người rà: (1) có nút/hành động nào **mất** hoặc đổi quyền
      so với `main`? (2) có chữ người dùng thấy nào còn "biện pháp"/"BP"/"Hãy", hoặc màn trộn ghi "phương án" trơn? (3) có
      luật nghiệp vụ nào bị đổi (đếm, hạn, trạng thái)? (4) 375px có chỗ nào tràn? (5) `TheSos` / dòng học viên lớp có nút
      lồng trong nút? Xử lý bằng `superpowers:receiving-code-review`; sửa mọi Critical/Important, ghi Nhật ký.
- [x] **Step 5:** `superpowers:verification-before-completion`: `npm run check` xanh (ghi số), phép quét PR-HV xanh,
      Task 9 đã xong.
- [x] **Step 6:** `superpowers:finishing-a-development-branch`: push, mở PR **không draft**, tiêu đề
      `PR-HV: hồ sơ học viên 3 tab + Ý thức & Phối hợp theo prototype v3, "biện pháp" thành "phương án"`. Thân PR: tóm tắt
      D1–D5; bảng ảnh trước/sau (đường dẫn `thiet-ke/anh/pr-hv/`); số phép kiểm `N0 → cuối`; hai trường máy chủ mới; kết
      quả 7 dòng nghiệm thu; các quyết định khi plan im lặng; việc để lại (PR-R ô bấm được, PR-Q Q9 / 4 tab lớp). Kết thúc
      bằng dòng attribution theo nhắc nhở của hệ thống. **Không tự merge.**
- [ ] **Step 7: Báo chủ sản phẩm** (tiếng Việt cơ bản): link PR; "hồ sơ học viên giờ có 3 tab ngay dưới đầu trang, chữ
      'biện pháp' đã đổi thành 'phương án' ở mọi màn"; nhắc: sau khi gộp PR này mới lên bản chính (D4).

---

## Self-review của người viết plan (22/09/2026, session planning)

**Bao phủ spec:**

| Spec | Task |
|---|---|
| D1 Phương án/PA; màn trộn `PA xử lý`/`PA học thuật`; câu máy chủ `phương án xử lý`; tên chỉ số | 1 (web, shared, máy chủ không đóng băng, TU_DIEN), 8 (màn trộn phía học thuật), 9 (file đóng băng) |
| D2 3 tab, đầu trang + 4 ô luôn trên tab | 2, 3 |
| D3 bỏ "Hãy" | 1 (web + máy chủ không đóng băng + script), 9 (`migrate.ts:46`, `measures.ts:176`) |
| D4 lên bản chính sau PR này | 10 Step 7 (nhắc) — không có việc mã |
| D5 nhận Q7, Q8 | 3 (Q7), 6 (Q8), 10 (đánh dấu plan.md/BAN_DO) |
| A1 chỉ đổi chữ hiển thị | Global Constraints; phép quét bỏ chú thích; `CHO_PHEP` cho tên trong mã |
| A2 `+ Ghi nhận vi phạm` | 1 (bảng 1A), 5, 7 |
| A3 ô số nhỏ | 4 (`OSoNho`, `demTheoNhomViPham`), 5 |
| A4 ô tick + `Tạo phương án từ {n} vi phạm` | 5 (hồ sơ HV), 7 (lớp) |
| A5 số trên tab con, ⚠ trên tab chính | 2 (`HangTab`, cảnh báo), 5 (`pendingCount`) |
| A6 `?tab=` | 2 (`parseHoSoTab`), 7 (link lớp → `?tab=y-thuc`) |
| A7 hồ sơ lớp chỉ tab Ý thức | 7 |
| A8 file Z2b sau khi merge | Global Constraints 🧊, 9 🛑 |
| A9 tiếng Anh prototype → Việt | 5, 4 (`Vi phạm`, `Hỗ trợ học thuật…`) |
| §4.1 khung, Q7, PendingSignals giữ chỗ, nút Lộ trình giữ | 2, 3 |
| §4.2 tab Học thuật, TheCase, KhoiPhuongAn, nút gom chân thẻ, PA xong thu gọn, bằng chứng thu gọn | 2, 6 |
| §4.3 tab Ý thức HV: lưới, nhãn màu, Sửa/Mở/Xem, xoá trong form sửa, tab con Phối hợp dạng thẻ | 4, 5 |
| §4.4 Hành trình chuyển nguyên | 2 |
| §4.5 hồ sơ lớp: dòng 4 cột, hai thẻ, Theo thời gian, Phối hợp thẻ | 7 |
| §4.6 thành phần dùng chung | 4 (`DongThoiGian`, `OSoNho`, `TheSos`), 6 (`TheCase`, `KhoiPhuongAn`), thêm `HangTab` (2) |
| §5 chữ | 1 (bảng 1A–1E), 8, 9; TU_DIEN §8 |
| §6 không làm | Global Constraints |
| §7 nghiệm thu (ba vai, desktop + 375, ảnh trước/sau, grep, số phép kiểm không giảm) | 0 Step 6, 10 Step 1–2, mọi task |

**Quyết định của người viết plan khi spec im lặng** (người thực thi làm theo; chủ sản phẩm có thể đổi sau):
- **J1 — màu nhãn:** spec nói `Phương án` "xanh lá = đã thực hiện", nhưng luật cứng của `ui.tsx` (dòng 63–65) cấm xanh
  lá ngoài `<Outcome>`, và spec cũng nói "dùng `Status`/`Level` có sẵn". Chọn: Vi phạm `Status doing` (xanh dương) /
  `Alert danger` (quá 5 ngày) · PA đang chuẩn bị `Status waiting` (vàng) · PA đã thực hiện `Status done` (xám ✓).
- **J2 — `Việc cần làm tiếp`:** câu có động từ dựng ở máy chủ (`headlineOf`), thêm ứng viên "Cập nhật PA · hạn" chưa
  quá hạn (trước đây ô ghi "Không có" khi mọi việc đúng hạn) và cờ `overdue` (trước đây giao diện đọc cờ không tồn tại).
  Thứ tự ưu tiên cũ giữ nguyên.
- **J3 — ô Test lớp Normal:** "đạt" = đủ điểm và SOS 0 (mọi phần đạt ngưỡng); không có Overall. Chương trình > 4 phần
  thì không dùng `<KetQuaDot>` (hàm luật từ chối), ghi `{có}/{cần} phần có điểm`.
- **J4 — dòng phụ học viên ở lớp:** `{mã HV} · {trạng thái}` từ roster đã tải, thay `FT · đang học` (cả lớp cùng chương
  trình nên `FT` không phân biệt được ai; máy chủ không trả chương trình theo em).
- **J5 — số trên tab con `Phối hợp SOS` của hồ sơ HV** = số **lượt** chưa hoàn thành (`pendingCount`), giống hồ sơ lớp
  (K3-3), không phải số việc lẻ — để hai màn cùng một nghĩa.
- **J6 — phạm vi "màn trộn"** giới hạn ở nhãn/tiêu đề/nút/câu ngắn; chú giải dài giữ "phương án". Câu báo lỗi máy chủ
  của **học thuật** (chỉ bật ra từ thao tác học thuật) giữ "phương án"; chỉ thông báo chuông (`sosAuto.ts:148`) thêm
  "học thuật". Hành trình (tiêu đề mốc đã lưu) không đổi.
- **J7 — lọc nhóm ở tab Ý thức HV:** dòng phương án hiện khi chứa ít nhất một vi phạm của nhóm đang lọc (trước đây mọi
  phương án biến mất khi chọn nhóm).
- **J8 — không lộ trình:** tab Ý thức và Hành trình vẫn mở được (trước đây cả khối tab ẩn); tab Học thuật hiện `Empty`.
- **J9 — tiêu đề panel ghi vi phạm** đổi `Ghi nhận vi phạm` cho khớp nút mở nó (A2); nút gửi giữ `Ghi vi phạm`.
- **J10 — nhãn `Bằng chứng (n)`** dùng số lúc tải bảng; thêm tệp xong số cập nhật ở lần tải bảng sau.
- **J11 — `Tạo phương án` ở thẻ Xử lý của lớp** khi chưa tick: mở panel với mọi vi phạm đang hiện của em (panel cho bỏ bớt).
- **J12 — `scripts/check-node.mjs`** (chữ cho người chạy lệnh) cũng bỏ "Hãy" — D3 nói "mọi chữ"; dữ liệu kể chuyện trong
  `server/src/seed/*` (không hiện trên giao diện) được loại khỏi phép quét vĩnh viễn.

**Dữ liệu thiếu đã tìm thấy:** (1) thẻ case không có số bằng chứng → Task 6 thêm `attachmentCount` (cases.ts, không
đóng băng, TDD); (2) `headline.next` không có `overdue` và câu không bắt đầu bằng động từ → Task 3 (profile.ts, TDD);
(3) bảng Ý thức của lớp không có mã/trạng thái học viên → dùng roster đã tải, không cần máy chủ. `k/n PA có kết quả`,
chi tiết phương án đã thực hiện (`Xem`), số lượt Phối hợp chưa xong — **đủ dữ liệu**, không cần thêm.

**Soát chỗ trống:** không có "TBD"/"tuỳ ý". Chỗ cố ý để người thực thi quyết khi gặp mã thật, có hướng dẫn: phép quét
báo chỗ ngoài bảng (Task 1 Step 3), phép kiểm bám câu ngoài danh sách (Task 1 Step 8, Task 9 Step 5), thông báo khác
(Task 8 Step 2), số `..` của `ROOT` trong file kiểm thử (Task 1 Step 3), mã nhóm vi phạm thật (Task 4 Step 1), cột bắt
buộc của bảng `attachments` (Task 6 Step 2). Mỗi chỗ đều bắt ghi Nhật ký.

**Tên nhất quán (dùng đúng ở mọi task):** `HO_SO_TABS`, `HoSoTab`, `HO_SO_TAB_LABEL`, `parseHoSoTab`, `LuotTomTat`,
`KetQuaTestGanNhat`, `ketQuaTestGanNhat`, `demTheoNhomViPham`, `PhuongAnTomTat`, `dangChay`, `tienDoCase`,
`viecTiepPhuongAn`, `HangTab`, `HangTabMuc`, `OSoNho`, `DongThoiGian`, `DongThoiGianMuc`, `TheSos`, `TheCase`,
`KhoiPhuongAn`, `XemPhuongAnPanel`, `runHoSoHocVienTests`, `CHO_Z2B`, `CHO_PHEP`, `attachmentCount`, prop `cot1`
(`'luot' | 'hocVien'`), prop `onGoAcademic`, prop `onDelete`.

---

## Nhật ký thực thi

*(Người thực thi ghi vào đây: số phép kiểm sau mỗi task, kết quả gate, mọi điều bất ngờ, mọi quyết định khi plan im lặng,
danh sách ảnh.)*

| Thời điểm | Task | Ghi chép |
|---|---|---|
| 22/09/2026 | 0 | Người code: **Fable 5.1** (model khuyến nghị). Worktree `.claude/worktrees/pr-hv-ho-so-hoc-vien`, nhánh `pr-hv-ho-so-hoc-vien` từ `main` @ `714739e` (đủ spec, hai prototype, plan). `N0` = **605** (npm run check xanh). `git log origin/main -5`: 714739e Merge #50 plan PR-HV · 9c12bc5 · b53c5d5 · 0f24805 Merge #48 (Z2a) · 8b3b476. PR-Z2b (#49) **OPEN** (`gh pr view 49`) → làm đúng kế hoạch, đóng băng tới Task 9. Step 5–6 (máy chủ dev, ảnh TRƯỚC) **hoãn**: chủ sản phẩm yêu cầu hỏi trước khi bật cổng 4000/5173; làm Task 1 trước (không cần máy chủ), ảnh TRƯỚC sẽ chụp từ commit gốc `714739e` (checkout tách rời tạm) khi được phép. |
| 22/09/2026 | 1 | Phép quét (TDD) đỏ **97 chỗ** — trùng đúng bảng 1A–1D, không có tên-trong-mã nào cần `CHO_PHEP` (mảng rỗng). `CHO_Z2B` thêm `server/src/ops/` (đóng băng theo Global Constraints; `ops/initBanChinh.ts` có 2 chỗ "hãy" — Task 9). `accounts.ts` (Z2b sửa 2 dòng khác) đã đổi 8 chỗ "Hãy". Phép kiểm cũ bám câu chữ D3: `run.ts` [6.3] `/đặt tên/` → `/[Đđ]ặt tên/` (câu "Hãy đặt tên cho case" nay viết hoa Đ) — ngoài hai dòng bảng 1E. `TU_DIEN_VA_CHU.md`: luật D1 §1/§6, luật D3 §4, thêm §8 bảng chữ PR-HV. Số phép kiểm: **606** (= N0 + 1). |
| 22/09/2026 | 0 (tiếp) | Chủ sản phẩm cho phép bật máy chủ dev (hai cổng đang rảnh). **Phát hiện:** `preview_start` (cấu hình `dev` trong `.claude/launch.json`) khởi động Vite/API từ **thư mục chính**, không phải worktree (API đọc database của thư mục chính; Vite trả mã của `main`) → tắt, bật lại bằng `npm run dev` chạy nền **trong worktree** (database riêng `data/pisa-demo.sqlite` của worktree, seed 04:49). Ảnh TRƯỚC chụp bằng Playwright (cài tạm `--no-save`, kênh Chrome có sẵn; script ở scratchpad, không vào repo) ở commit gốc `714739e` — 30 tệp `thiet-ke/anh/pr-hv/truoc-*.png`: `ho-so-huy` (gvcn/gvbm/ql) · `case-2pa` (admin — em Đinh Ngọc Quyên id 21, case 22 Writing Task 2 có 2 PA đang chạy, thuộc lớp CP-FT 110 nên GVCN Hà không xem được) · `case-sos-cho` (gvcn/gvbm — Đỗ Minh Khôi id 42, case 34) · `y-thuc-huy` + `-vi-pham` (gvcn/gvbm) · `lop-101` + `-theo-hs` (mở Nguyễn Minh An — Huy không có vi phạm chưa xử lý nên không nằm trong khối lớp) + `-theo-tg` (gvcn) · `phan-tich-ql` (ql) · `viec-can-lam` (ql/gvcn); mỗi tệp hai khổ desktop/375. Commit `c13fc7d`. |
| 22/09/2026 | 2 | `parseHoSoTab` TDD đỏ → xanh. `HangTab.tsx` mới; `StudentDetailPage` bỏ `tier3`, ba tab đọc từ `?tab=` (replace), `warn` tải ở trang cho dấu ⚠ (A5). Sửa lỗi phụ J8: không có lộ trình vẫn mở được tab Ý thức/Hành trình. Bấm thử (Playwright, GVCN, 1280 + 375): `?tab=` ba giá trị + giá trị lạ về Học thuật ✓; bấm tab đổi địa chỉ, `history.length` không tăng (replace) ✓; scrollWidth = khổ (không cuộn ngang) ✓; console không lỗi ✓; ⚠ hiện ở em có cảnh báo 5 ngày (Nguyễn Minh An), không hiện ở Huy ✓. Số phép kiểm: **607**. |
| 22/09/2026 | 3 | Hai phép TDD đỏ (`ketQuaTestGanNhat` chưa có; `next.overdue` chưa có, câu cũ "đề xuất L đang chờ…") → xanh. **Kiểm ngược `<`→`<=` KHÔNG đỏ**: bộ demo không có việc nào có hạn đúng bằng ngày demo nên hai phép so cho cùng kết quả → tách luật thành hàm thuần `quaHan(due, today)` ở `hoSoHocVien.ts` (profile.ts dùng nó) + phép kiểm biên riêng (hạn = hôm nay → chưa quá hạn) — thêm 1 phép ngoài kế hoạch. Thêm mục (k) "không có tuần → chỉ MT2". `HeaderStats` bốn ô mới, `Stat` có `nho`/`sub: ReactNode`. **Lưu ý vận hành:** API dev chỉ build lúc `npm run dev` khởi động — sửa máy chủ phải khởi động lại mới thấy (ô 4 lúc đầu vẫn chữ cũ). Bấm thử: Huy (FT, GVCN) ô 1 `MT2 · W3 AUG 2026` + KetQuaDot `Đã đủ điểm · SOS 1`; ô 4 `Làm PA L` · `quá hạn 30/08/2026` đỏ. Đỗ Gia Bảo (id 8, MB-FOU 12, Quản lý): ô 1 `Giữa khoá · W3 AUG 2026`, **không** có chữ Overall; ô 4 `Không có`. 375px: 2 cột, ô 4 xuống dòng, không tràn. Số phép kiểm: **610** (+3). |
| 22/09/2026 | 4 | `demTheoNhomViPham` TDD đỏ → xanh; thứ tự thật của `VIOLATION_CATEGORIES` là attendance (Chuyên cần) **trước** homework (BTVN) — phép kiểm viết theo hằng thật, không theo ví dụ của plan; mã nhóm lạ vẫn tính vào `tong`. `OSoNho`, `DongThoiGian` mới; `TurnRow` → `TheSos` (đầu thẻ 3 cột `div role=button`, thân thẻ lưới việc), `PhoiHopSosSection` prop `cot1` thay `showStudentName`; bỏ import `Level`/`sosTone` không dùng. **Huy không có lượt Phối hợp SOS nào** (như ảnh trước) → bấm thử trên Đỗ Minh Khôi (id 42, MT2 · SOS 2): mở/đóng bằng chuột và Enter ✓; link "Hỗ trợ học thuật xem ở tab Học thuật" → tab Học thuật, bỏ `?tab=`, thẻ không bị mở/đóng ✓ (lưu ý cho script kiểm: `getByRole('button', {name})` khớp cả đầu thẻ vì tên gồm chữ bên trong — phải chọn `button.link`); GVCN Xác nhận "Trao đổi với gia đình" → `Đã xong` 1 → 2 ✓ (đã ghi vào database worktree); lớp MB-FT 101: 2 thẻ, cột 1 tên HV, dòng phụ "Học thuật theo dõi ở bảng kỹ năng" ✓; 375px không cuộn ngang, cột 1 một hàng, cột 2+3 hàng dưới ✓; console không lỗi ✓. Số phép kiểm: **611**. |
| 22/09/2026 | 5 | `StudentYThucSection` viết lại phần vẽ theo §4.3 (đầu khối + nút, `HangTab cap="con"` với số lượt chưa xong, ô số nhỏ, hai dãy lọc, `DongThoiGian` có cột tick, nút Sửa/Mở/Xem); `coord` tải luôn (A5); `RANGES` đổi thứ tự/chữ; lọc nhóm giữ dòng PA chứa vi phạm của nhóm (J7); `XemPhuongAnPanel` mới; `RecordViolationPanel.onDelete` → nút `Xoá vi phạm` trong form sửa. **Huy không có vi phạm chưa xử lý** nên bấm thử luồng tạo PA trên **Nguyễn Minh An** (id 1, 4 vi phạm chưa xử lý, có ⚠): GVCN lọc BTVN 9→4 dòng, 7 ngày 5 dòng; tick 2 → `Tạo phương án từ 2 vi phạm` → panel `Tạo phương án · Nguyễn Minh An` → chọn GV trao đổi ngắn → `Lưu — Đang chuẩn bị` → dòng `◷ Phương án` + ô `PA đang chuẩn bị` + nút `Mở` → `Xác nhận đã thực hiện` → dòng `✓ Phương án` + nút `Xem` → hộp chỉ đọc đủ Trạng thái/Ngày/Người/Nội dung/2 vi phạm/Tệp/Xác nhận bởi ✓; `Sửa` → `Xoá vi phạm` → hộp `Xoá vi phạm này?` (Huỷ) ✓. GVBM (Trang): không ô tick, không `Mở`, có `Xem`, còn `+ Ghi nhận vi phạm` ✓. Quản lý (Vy, trên Khôi vì Minh An đã hết vi phạm chưa xử lý sau hai lần chạy script): ô tick 2, Sửa, Tạo phương án từ 1 vi phạm ✓. Khôi: tab con `Phối hợp SOS 1` ✓. 375px không cuộn ngang, dòng thời gian 3 cột + nút xuống hàng ✓. Console không lỗi ✓. (Script đã tạo + xác nhận 2 PA "GV trao đổi ngắn với HS" cho Minh An trong database worktree.) Số phép kiểm: **611** (không đổi — task giao diện). |
| 22/09/2026 | 6 | Ba phép TDD đỏ → xanh (`tienDoCase`, `viecTiepPhuongAn`, `dangChay`, `attachmentCount` — phép server dùng `checkAsync` + `await import` vì harness là ESM; chèn 1 liên kết `kind='link'` vào `attachments` rồi xoá). `caseCardOf` thêm `attachmentCount` (SQL tại chỗ). `CaseCardView`→`TheCase`, `PlanRow`→`KhoiPhuongAn`; `InlineResult` bỏ `ml-5`. Dấu ✓ của PA đã xong đổi từ `text-emerald-300` sang `text-slate-400` (luật ui.tsx: xanh lá chỉ cho `<Outcome>`). Bỏ câu "Case đang xử lý, chưa kết luận." (cột 3 đầu thẻ đã nói). Bấm thử: Quyên (id 21, admin) case 22 có 2 PA: đầu thẻ `1/2 PA có kết quả` + `Chờ Quản lý trả lời: hạn 14/09/2026`, hai khối 3 phần, ghi chú dài không cắt, `▸ Bằng chứng (0)` mở ra BangChung, chân thẻ `+ Thêm phương án · Hoàn thành case (mờ) · Chưa hoàn thành: …`; `Ghi kết quả` → lưu → phần 2 hiện ghi chú, tiến độ giữ 1/2 (PA đó đã có kết quả) ✓. Khôi (id 42) case 34 chờ nguyên nhân: khối vàng, cột 2 `PA gợi ý chờ xác nhận`, phần 3 `Gợi ý tự động · chờ xác nhận` ✓; GVCN Hà và GVBM Trang **không** thấy nút Xác định nguyên nhân/Không cần theo dõi/Xác nhận — **giống ảnh trước** (không dạy Writing Task 2); GVBM Writing Task 2 Cao Khánh Linh (id 10) thấy đủ Xác định nguyên nhân · Không cần theo dõi · Xác nhận/Sửa/Thay · + Thêm phương án · Hoàn thành case ✓. Huy: case Reading đã hoàn thành đóng mặc định, cột 3 `Đã hoàn thành`, mở ra thì khối PA đã xong mở sẵn (`moXong` mặc định = case done), bấm nút thu gọn ✓. 375px: ba phần xếp dọc, không cuộn ngang ✓. Console không lỗi ✓. (Script ghi thêm 1 kết quả "Tiến bộ một phần" cho PA của Quyên trong database worktree.) Số phép kiểm: **614** (+3). |
| 22/09/2026 | 7 | `ClassYThucCard` viết lại phần vẽ theo §4.5 (giữ nguyên `rowsForCategory`, sắp xếp, `allCount`, `timeline`, tick, panel). Dòng học viên lưới 4 cột (dòng phụ `{mã HV} · {trạng thái}` từ roster — J4), mở ra hai thẻ `Vi phạm gần đây` (`DongThoiGian bien="gon"` + tick + Sửa) | `Xử lý` (`Mở phương án` / `Xem` / `Tạo phương án` — J11: chưa tick thì đưa mọi vi phạm đang hiện; `measureFor` nay mang `violationIds`); `Theo thời gian` = `DongThoiGian bien="day-du"`; tab con `HangTab cap="con"` giữ nghĩa số K3-3; link `Hồ sơ học viên →` mở thẳng `?tab=y-thuc`; xoá `violationBreakdown` (dùng `demTheoNhomViPham`). Bấm thử MB-FT 101: không có nút lồng nút ✓; lọc BTVN — số trên tab con không đổi (3) ✓; dòng Khôi `PISA-000042 · đang học · 2 vi phạm · 1 Chuyên cần · 1 BTVN · Không có cảnh báo · 0 PA đang chuẩn bị · Mở` ✓; mở → hai thẻ, tick 1 → `Tạo phương án từ 1 vi phạm` → panel → Lưu — Đang chuẩn bị → `Mở phương án` + `1 PA đang chuẩn bị` → Xác nhận đã thực hiện ✓; Theo thời gian 2 dòng lưới có Sửa ✓; Phối hợp SOS thẻ + nút ẩn/hiện ✓. GVBM Trang: không tick, không Tạo/Mở, có + Ghi nhận vi phạm ✓. Quản lý ✓. 375 không cuộn ngang ✓. Console không lỗi ✓. (Script tạo + xác nhận 1 PA "GV meeting với HS" cho Khôi trong database worktree.) Số phép kiểm: **614**. |
| 22/09/2026 | 8 | Bảng Task 8 áp đủ (31 chỗ, 6 file — số dòng khớp). **Thông báo:** ngoài `sosAuto.ts:148` (Task 1), `cases.ts` ~971–973 ba tiêu đề chuông duyệt PA (`PA học thuật của bạn đã được duyệt` / `không được duyệt` / `Quản lý góp ý về PA học thuật của bạn`) — đổi; tiêu đề mốc Hành trình cùng chỗ (`Quản lý duyệt phương án hỗ trợ`…) **giữ** (J6). **Thêm ngoài bảng** (cùng luật D1 màn trộn, phát hiện khi bấm thử `/hoc-thuat`): tiêu đề cột `Thiếu phương án` ở `server/src/worklist/summary.ts:104` (bảng Tổng hợp theo lớp) và `WeeklyBoard.tsx:69` (Theo tuần) → `Thiếu PA học thuật`; nhãn trạng thái `no_plan` của bảng case ở `cases.ts:1590` → `Chưa có PA học thuật` (khớp `CaseBoardPage.tsx:49`). **Không đổi** (ngoài phạm vi J6, ghi để chủ sản phẩm biết): `people.ts:184` nhãn bộ lọc danh sách học viên `Case thiếu phương án`; `chu.ts` `CHUA_CO_PHUONG_AN` chỉ dùng trong `CasePanel` (màn học thuật); `cases.ts:793` `Đề xuất phương án mới`; chú giải dài ở `WeeklyBoard.tsx:249`, bảng Tổng hợp theo lớp. **Phép kiểm bám chữ** (hợp lệ D1, ngoài soát 22/09 của plan): `sosV3.tests.ts` 675 `/phương án/` → `/PA học thuật/` và 688 `/Phương án/i` → `/PA học thuật/i` (lý do dòng việc S04 in câu `mywork.ts:790`). Bấm thử: Tổng quan (QL) bốn ô `Case thiếu PA học thuật` · `PA học thuật cần cập nhật`, bảng Việc cần lưu ý cột `Thiếu PA học thuật` · `PA học thuật cần cập nhật` ✓; `/hoc-thuat` Phân tích vấn đề cột `Thiếu PA học thuật` ✓. Số phép kiểm: **614**. |
| 22/09/2026 | 9 🛑 | **Cửa mở:** `gh pr view 49` → MERGED 05:17Z (origin/main @ `25eec4c`, gồm cả PR #51 Z2b2). `git merge origin/main` **không xung đột** (commit `51caeab`); `npm run check` sau gộp **671** (Z2b/Z2b2 thêm 57). TDD: `CHO_Z2B = []`, thêm `LOAI_TRU` (seed/* trừ `seed.ts`, `duLieuNen.ts`), `CHO_PHEP` 4 chú thích SQL `-- …` trong chuỗi DDL của `migrate.ts` (plan ghi 1 dòng ~2525; ba dòng `--` kế bên cùng bản chất, cùng lý do) → quét đỏ **24 chỗ** (measures 13 dòng + 1 dòng trùng Hãy, migrate 6, seed.ts 1, initBanChinh 2) → đổi chữ đúng bảng Step 4 + hai dòng `initBanChinh.ts` (🆕 22/09) → xanh. `MANAGE_MESSAGE` theo chữ plan (`…tạo và thực hiện được phương án xử lý…`). `duLieuNen.ts` quét: không có chữ cần đổi. Phép kiểm bám chữ (D1): `yThuc.tests.ts` `/loại biện pháp/i` → `/loại phương án/i`, `/tên biện pháp/i` và `/tên biện pháp/` → `/tên phương án…/` (3 dòng, đúng plan; số dòng sau gộp: tìm bằng chuỗi). `npm run migrate` trên database worktree chạy không lỗi. Số phép kiểm: **671**. |
| 22/09/2026 | 10 (1–3) | **Quét tay:** "BP" 0 · "Hãy " 0 · "biện pháp" chỉ còn **84 dòng chú thích** (`//`, `*`, `--` DDL) + chuyện kể/lỗi nội bộ của `seed/students.ts` (3) và `seed/yThucSeed.ts` (18) — đúng diện chấp nhận; `board.ts:73` là chú thích. **Nghiệm thu §7** (seed mới 06:33, Playwright, ba vai GVCN Hà · GVBM Trang · Quản lý Vy (+ GVBM W2 Linh, admin cho em lớp CP), desktop 1280 + 375; ảnh `thiet-ke/anh/pr-hv/sau-*.png`, 48 tệp): (1) Huy ba tab, `?tab=` mở thẳng, ⚠ ở em có cảnh báo — **ĐẠT** (Task 2); (2) case 2 PA song song + ghi chú dài + tên GV dài không tràn/cắt — **ĐẠT** (Task 6, Quyên id 21); (3) case từ SOS chờ nguyên nhân: khối vàng, nút, PA gợi ý cột 3 — **ĐẠT** (Khôi; nút chỉ với GVBM đúng môn — như trước); (4) tạo PA từ 2 vi phạm → xác nhận → `Xem` — **ĐẠT** (Task 5, Minh An); (5) Phối hợp SOS mở thẻ, xác nhận một việc, link về tab Học thuật — **ĐẠT** (Task 4, Khôi); (6) lớp MB-FT 101 Theo học sinh / Theo thời gian / Phối hợp SOS — **ĐẠT** (Task 7); (7) màn trộn `PA học thuật` / `Phương án xử lý` — **ĐẠT** (Task 8). Console không lỗi ở mọi lần chạy. Mọi nút có trước đây vẫn còn theo đúng vai (so ảnh trước: `+ Case`, `⋮`, `Lộ trình`, `+ Ghi nhận vi phạm`, `Sửa` (thay ✎/🗑 — xoá trong form sửa), `Mở`/`Xác nhận`, `+ Thêm phương án`, `Hoàn thành case`, `Xác định nguyên nhân`, `Không cần theo dõi`, `Xác nhận/Sửa/Thay`, `+ Thêm việc`, `Bỏ ▾`, `Hiện cả lượt đã xong`). **Lỗi có sẵn, ngoài phạm vi:** tab Hành trình ở 375px — một nhãn `dự kiến dd/mm` đặt tuyệt đối trong `JourneyTimeline.tsx` (không đổi so với gốc) lòi 23px ra ngoài `main` (main.scrollWidth 398) nhưng `document.scrollWidth` = 375, trang không cuộn ngang; để PR-Q (Q9 Hành trình). **Tài liệu:** `plan.md` §22.7 Q7/Q8 [x] → PR-HV, §12.15 ghi đảo K3-6 + hai việc K2-6 đã làm, §14 một dòng; `BAN_DO_OVERHAUL.md` §7 bảy dòng → ✅ PR-HV (dòng "bấm được" giữ PR-R); `CODE_MAP.md` Ý thức, Dùng chung, `hoSoHocVien.ts`. |
| 22/09/2026 | 10 (4) rà soát | **Người rà: Opus 5** (một agent, đọc cả diff `25eec4c..e408c8d`, tự chạy `npm run check` 671 ✓). Kết luận: *With fixes* — 0 Critical, 2 Important, 9 Minor. **Đã sửa:** (I1) `headlineOf` — ứng viên mới "Cập nhật PA" chưa quá hạn CÓ hạn nên thắng ứng viên KHÔNG hạn (`Xác minh SOS` khi `verifyDue` null, `Đề ra PA`, `Chờ Quản lý duyệt`) ở `cands.sort` → đổi thành **dự phòng** `duPhong`, chỉ dùng khi `cands` rỗng (đây là lỗi trong đoạn mã mẫu của chính plan Step 3; thứ tự ưu tiên cũ nay giữ nguyên đúng nghĩa). Thêm bất biến vào phép kiểm Q7: ô ghi "Cập nhật PA" chưa quá hạn ⇒ bảng kỹ năng không còn việc ưu tiên hơn — **không đỏ trên dữ liệu demo** (không em nào vừa có việc dự phòng vừa có việc ưu tiên không hạn), sửa được xác nhận bằng đọc mã. (I2) nhãn `Không cần theo dõi · {lý do}` (nowrap) tràn cột ở 375px → tách: nhãn `Không cần theo dõi` + lý do ở dòng phụ xuống dòng. (M3) bỏ prop `cy` thừa của `HeaderStats`. (M4) `CODE_MAP.md` hai dòng còn `PlanRow`/`CaseCardView`. (M5) phép quét thêm `scripts/*.mjs`, "Hãy" trước dấu câu/cuối dòng. (M8) `XemPhuongAnPanel` hiện `ErrorState` khi tải lỗi. (M10) hai chú giải trích tên cột cũ (`WeeklyBoard.tsx:249`, `SummaryTable.tsx:232`) → `Thiếu PA học thuật` / `chưa có PA học thuật`. (M11) `TU_DIEN` §6: màn trộn ghi rõ `PA xử lý` (nhãn ngắn) hoặc `Phương án xử lý …` (tên chỉ số/tiêu đề — dạng PR-HV dùng). **Để lại, cần chủ sản phẩm quyết:** (M10b) `people.ts:184` bộ lọc danh sách học viên `Case thiếu phương án` (cùng khái niệm với `Case thiếu PA học thuật` ở Tổng quan); (M9) hai chỗ lặp chữ do bảng ánh xạ của plan (`Cần xử lý` dòng phụ + nhãn ở thẻ Phối hợp khi không có quyền; nhãn nhóm vừa ở dòng phụ vừa ở chip `Info` ở hồ sơ lớp); (M3b) bốn ô số vẫn ẩn khi không có lộ trình (plan `{cy && …}`, spec nói "luôn hiện"). **Để lại, ngoài phạm vi:** (M6) `HangTab` chưa đủ mẫu ARIA tab (aria-controls, phím mũi tên); (M7) link trong `div role=button` của `TheSos` (plan chọn có chủ đích). |
| 22/09/2026 | 10 (5–6) | Sau sửa rà soát: `npm run check` **671** đạt, phép quét PR-HV xanh (không còn `CHO_Z2B`), Task 9 đã xong. Kiểm lại nhãn `Không cần theo dõi` ở 375px trên Vũ Ngọc Lan (case 38): nhãn + lý do `Tình huống đơn lẻ` hai dòng, không đè (`sau-case-khong-can-theo-doi-gvcn-*`). Đẩy nhánh, mở PR không draft, **không tự merge**. |
