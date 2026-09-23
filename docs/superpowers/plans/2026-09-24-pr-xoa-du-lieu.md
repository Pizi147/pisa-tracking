# PR-XOA · Xoá học viên, xoá tài khoản, lưu trữ tự động (chỉ Quản trị hệ thống) — Kế hoạch

> **For agentic workers:** KHÔNG dùng `superpowers:subagent-driven-development` — làm theo khối **Quy trình nhanh** bên dưới.
> PR này **xoá dữ liệu thật** trên bản chính (Turso). Mọi luật dưới đây là luật cứng; lệch → dừng, hỏi planning.

**Goal:** Quản trị hệ thống (QT) xoá hẳn được một học viên (mọi dòng gắn em, trực tiếp và gián tiếp, trong **một** giao dịch)
và xoá được một tài khoản (xoá hẳn nếu chưa có dấu vết, xoá mềm nếu có). Học viên thôi học tự vào Lưu trữ. Đủ để dọn dữ liệu
thử trên bản chính trước khi báo GV (Task 8 — chỉ viết kịch bản, không chạy).
**Architecture:** Hai module máy chủ mới `server/src/students/xoaHocVien.ts`, `server/src/platform/xoaTaiKhoan.ts`, khuôn kiểm
quyền + gõ lại mã của `server/src/classes/xoaKetThucLop.ts` (UX3 #98). Danh sách bảng/cột **viết cứng trong mã** (không chạy
`PRAGMA` lúc chạy — tốn câu Turso) và **phép kiểm so với `PRAGMA foreign_key_list`** để bảng mới quên là đỏ. Xoá gom theo tập
(`WHERE … IN (SELECT …)`), tham số có tên `@s` — số câu SQL cố định, không theo số dòng. Tệp Blobs xoá **sau** khi giao dịch chốt.
**Tech Stack:** TypeScript · React 18 + Vite · Express · libsql/better-sqlite3 · Tailwind; phép kiểm `server/src/tests/*` harness
`check()`, chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-24-xoa-du-lieu-design.md` (§1–§4); luật chung `2026-09-22-ux-toan-web-truoc-deploy-design.md`
§1 G-1…G-12, §2, §4; `2026-09-23-overhaul-giao-dien-design.md` N-1…N-4; `thiet-ke/THUAT_NGU_DA_CHOT.md`.

| Mục | Chốt |
|---|---|
| Mã PR | **PR-XOA** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-xoa-du-lieu` · `.claude/worktrees/pr-xoa-du-lieu` |
| Cổng thử | API **4507** · Vite **5707** |
| Model | **Opus 5.5 · XHigh** · phương án B: **Fable 5.1 · High** |
| Người rà | **Fable 5.1** (code bằng Fable thì rà bằng Opus 5.5) |
| Migrate | **CÓ** — cột `users.deleted_at` + backfill `students.archived_at` (chạy **một lần**). Deploy: migrate DB THỬ rồi DB CHÍNH |
| Phụ thuộc | **Merge SAU UX3 #98** (dùng `KhungPanel`, menu thả ⋮ Hồ sơ HV `mucQuanLyHocVien`, `xoaKetThucLop.ts`). #93 (Z2c-e) độc lập |
| File KHÔNG được chạm | `server/src/db.ts`, `server/src/auth.ts` (#93) · `server/src/classes/xoaKetThucLop.ts`, `XoaKetThucLopPanel.tsx` (UX3 — chỉ đọc) · `web/src/ui/KhungPanel.tsx` · `web/src/modules/test/*`, `server/src/cham/*` (UX1) · `web/src/modules/phanTich/*`, `server/src/phanTich/*` (UX4) · `TRIEN_KHAI.md` (#99) |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `server/src/routes/index.ts`, `server/src/tests/run.ts`, `server/src/tests/tocDoDuong.ts`, `CODE_MAP.md`, `plan.md` | UX1 #92, UX3 #98, UX4 #96 | Chỉ **thêm** dòng (route mới cạnh route cùng nhóm; đăng ký test cuối `run.ts`). Rebase lên main trước khi mở PR |
| `web/src/modules/students/StudentDetailPage.tsx`, `StudentManagePanel.tsx`, `shared/domain/quanLyHocVien.ts`, `server/src/students/profile.ts` | UX3 #98 (chủ) | Chỉ thêm mục `xoa-hoc-vien` + cờ `coTheXoa`; không đổi mục có sẵn |
| `web/src/ui/Menu.tsx`, `web/src/ui/MenuDong.tsx` | UX0 (chủ), UX3 | Chỉ **thêm prop tuỳ chọn** (`keTruoc` cho Menu, `nguyHiem` cho MenuDong) |
| `web/src/modules/platform/AccountsAdmin.tsx` | #93 (một dòng `hint` ~dòng 400) | PR-XOA sửa bảng dòng 52-128 — khác dòng, rebase giữ cả hai |
| `server/src/students/students.ts:265`, `server/src/migrate.ts:450`, `server/src/schema.sql:131-149`, `server/src/seed/build.ts:88-100` | — | Sửa tại chỗ |

## Global Constraints

- **Quyền:** mọi đường xoá chỉ QT — `require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, '…')` ở **máy chủ** (khuôn
  `xoaKetThucLop.ts:17-18`). QL chi nhánh, GV: không thấy mục, gọi API → 403. Gõ lại mã HV / email mới bật nút đỏ; máy chủ kiểm lại.
- **Một giao dịch:** xoá HV / xoá tài khoản chạy trong **một** `tx()` (`db.ts:242`, BEGIN IMMEDIATE). Lỗi giữa chừng → cuộn lại,
  **không** dòng nào mất, **không** tệp nào mất. Tệp Blobs chỉ xoá sau `COMMIT` bằng `xoaTepSauGiaoDich` (`attachments.ts:228`,
  khuôn Task 6e); lỗi xoá tệp chỉ ghi log.
- **Tốc độ Turso:** xoá HV ≤ **42 câu** SQL, **không đổi** theo số lượt/Case của em (không vòng lặp theo dòng). Xem trước ≤ 3 câu.
  Xoá tài khoản ≤ 15 câu, xem trước ≤ 8 câu. Hàm Netlify 10 s: trong `tx`, còn < **6 000 ms** (`conLaiMs()`) → 503 "Máy chủ đang
  bận, chưa xoá gì." trước câu ghi đầu tiên.
- **N-4 khuôn panel:** `KhungPanel` 560px (`rong="hep"`), 375px toàn màn; đầu `Tiêu đề · Tên · Mã`; thân chia `Khoi`; nhãn trên ô
  (`Truong`); chân: trái Huỷ, phải **một** nút chính (đỏ `btn-danger`). Không panel chồng panel (G-8).
- **G liên quan:** G-2 bảng "những gì sẽ mất" hai cột thẳng, số `tabular-nums` canh phải · G-3 một dòng phụ · G-5 không
  `SectionNote` · G-6 ngày qua `ngay()` (`hienThiNgay.ts`), không ISO · G-7 tooltip ⋮ ⋯ · G-11 375px không cuộn ngang ·
  G-12 mục mới vào bảng định vị §4 (Task 6).
- **Chữ:** `Xoá học viên`, `Xoá vĩnh viễn`, `Xoá tài khoản`, `(đã xoá)`, `Đã xoá`; "HV" không "HS"; "PA học thuật" / "PA xử lý";
  `Case` viết hoa; không mở câu bằng "Hãy". Dòng nhắc **nguyên văn** đặc tả: `Nên sao lưu trước lần xoá đầu (npm run sao-luu)`.
- **Giữ hành vi:** mọi phép kiểm cũ xanh; phép kiểm đổi vì luật mới (lưu trữ tự động) sửa **kỳ vọng**, cùng điều kiện, không xoá.
  Số phép kiểm không giảm.

## Quy trình nhanh (bắt buộc)

- Không rà từng Task bằng subagent. Tự code, `npm run check` sau **mỗi** Task (xanh, số phép kiểm ≥ mốc B), commit
  `PR-XOA (n): …`. **Chỉ một** `npm run check` chạy một lúc; treo → quét, tắt `run.js` cũ rồi chạy lại.
- Subagent (nếu buộc dùng): cùng model, **không Haiku**. Commit ghi đúng `Co-Authored-By` của **model thật** đang chạy.
- Không chụp ảnh từng Task. Bấm thử theo vai (QT=1, QL=2, GVCN=7, GVBM=9) + 375px **một lần** ở Task 7, **ảnh thật**
  Playwright kênh Chrome, lưu `thiet-ke/anh/pr-xoa/`. Tắt mọi node/vite (4507/5707) trước khi kết thúc.
- **Không chạm Turso, không deploy, không chạy Task 8.** Cuối PR: push, mở PR, báo planning.

## Bảng tham chiếu (dựng từ `PRAGMA foreign_key_list` trên `schema.sql` — 62 bảng, 170 FK)

**Học viên.** 12 bảng trỏ thẳng `students.id`; bao đóng theo FK = **29 bảng**, **52 cạnh** trỏ vào bao đóng. Tập (SQL con):

| Tập | Định nghĩa (tham số `@s`) |
|---|---|
| `Y` lộ trình | `SELECT id FROM learning_cycles WHERE student_id = @s` |
| `A` lượt Test | `SELECT id FROM assessment_attempts WHERE student_id = @s OR cycle_id IN (Y)` |
| `C` Case | `SELECT id FROM sos_cases WHERE student_id = @s OR attempt_id IN (A) OR cycle_id IN (Y)` |
| `I` PA học thuật | `SELECT id FROM case_interventions WHERE case_id IN (C)` |
| `F` ghi kết quả | `SELECT id FROM case_followups WHERE case_id IN (C) OR intervention_id IN (I)` |
| `G` tín hiệu | `SELECT id FROM case_signals WHERE student_id = @s OR case_id IN (C) OR attempt_id IN (A) OR cycle_id IN (Y)` |
| `V` vi phạm | `SELECT id FROM violations WHERE student_id = @s OR cycle_id IN (Y)` |
| `M` PA xử lý | `SELECT id FROM discipline_measures WHERE student_id = @s OR cycle_id IN (Y)` |
| `X` Phối hợp SOS | `SELECT id FROM sos_coordination_actions WHERE student_id = @s OR attempt_id IN (A)` |
| `R` xin dời lịch | `SELECT id FROM skill_move_requests WHERE attempt_id IN (A)` |

**Thứ tự câu trong `tx` (con → cha) — mảng `CAU_XOA_HOC_VIEN`, mỗi phần tử `{ bang, sql }`:**

| # | Câu | Cạnh FK/liên kết mềm được phủ |
|---|---|---|
| 1 | `UPDATE learning_cycles SET baseline_attempt_id = NULL, outcome_attempt_id = NULL WHERE student_id = @s` | cắt vòng `learning_cycles ↔ assessment_attempts` |
| 2 | `UPDATE sos_cases SET previous_case_id = NULL WHERE previous_case_id IN (C) AND id NOT IN (C)` | `sos_cases.previous_case_id` của em khác (Q5) |
| 3 | `UPDATE case_followups SET evidence_attempt_id = NULL WHERE evidence_attempt_id IN (A) AND id NOT IN (F)` | `case_followups.evidence_attempt_id` của em khác (Q5) |
| 4 | `UPDATE tasks SET source_sos_case_id = NULL WHERE source_sos_case_id IN (C)` | `tasks.source_sos_case_id` (Q3) |
| 5 | `SELECT url FROM attachments WHERE kind = 'file' AND (<ĐK tệp>)` — phần tử `bang: 'attachments#tep'` (đọc, không ghi) | khoá tệp để xoá sau commit |
| 6 | `DELETE FROM attachments WHERE <ĐK tệp>` — `(owner_type='sos_case' AND owner_id IN (C)) OR ('case_intervention', I) OR ('violation', V) OR ('discipline_measure', M) OR ('sos_coordination_action', X)` | liên kết mềm `owner_type/owner_id` |
| 7 | `DELETE FROM notifications WHERE (entity_type='student' AND entity_id=@s) OR ('assessment_attempt', A) OR ('sos_case', C) OR ('case_signal', G) OR ('discipline_measure', M) OR ('skill_move_requests', R) OR ('case_intervention', I) OR ('violation', V) OR ('sos_coordination_action', X)` | liên kết mềm `entity_type/entity_id` (Q2) |
| 8 | `DELETE FROM task_case_links WHERE case_id IN (C)` | `task_case_links.case_id` |
| 9 | `DELETE FROM task_students WHERE student_id = @s OR case_id IN (C) OR intervention_id IN (I)` | 3 cạnh |
| 10 | `DELETE FROM case_intervention_revisions WHERE case_id IN (C) OR intervention_id IN (I) OR followup_id IN (F)` | 3 cạnh |
| 11 | `DELETE FROM case_followups WHERE id IN (F)` | `case_id`, `intervention_id` |
| 12 | `DELETE FROM case_interventions WHERE case_id IN (C)` | `case_id`, `superseded_by` (cùng Case) |
| 13–16 | `DELETE FROM case_issues / case_sources / sos_case_history WHERE case_id IN (C)`; `case_milestones WHERE case_id IN (C) OR attempt_id IN (A)` | 5 cạnh |
| 17 | `DELETE FROM case_signals WHERE id IN (G)` | 4 cạnh |
| 18 | `DELETE FROM sos_cases WHERE id IN (C)` | `student_id`, `attempt_id`, `cycle_id` |
| 19 | `DELETE FROM measure_violations WHERE violation_id IN (V) OR measure_id IN (M)` | bảng nối nhiều–nhiều (Q4) |
| 20 | `DELETE FROM violation_history WHERE violation_id IN (V)` | |
| 21–22 | `DELETE FROM discipline_measures WHERE id IN (M)`; `DELETE FROM violations WHERE id IN (V)` | `student_id`, `cycle_id` |
| 23 | `DELETE FROM sos_coordination_actions WHERE id IN (X)` | 2 cạnh |
| 24–28 | `DELETE FROM skill_move_requests / assessment_scores / attempt_skills / attempt_skill_skips / attempt_schedule_history WHERE attempt_id IN (A)` | 5 cạnh |
| 29–30 | `DELETE FROM teacher_estimates / journey_events WHERE student_id = @s OR cycle_id IN (Y)` | 4 cạnh |
| 31 | `DELETE FROM assessment_attempts WHERE id IN (A)` | `student_id`, `cycle_id` |
| 32 | `DELETE FROM cycle_target_revisions WHERE cycle_id IN (Y)` | |
| 33–34 | `DELETE FROM lo_trinh_tiep_theo / enrollments WHERE student_id = @s` | |
| 35 | `DELETE FROM learning_cycles WHERE student_id = @s` | |
| 36 | `DELETE FROM students WHERE id = @s` | |
| 37 | `writeAudit(student.delete)` | |

**Số câu:** đọc trước 2 (em + lớp · một câu đếm) + 37 trong `tx` = **39** (BEGIN/COMMIT là `exec`, không đếm). Trần phép kiểm: 42.
Giữ lại, không xoá: `audit_logs` cũ (Q1), `tasks` (chỉ gỡ liên kết, Q3), `classes`, `teacher_assignments`, `student_code_seq` (Q8).

**Tài khoản.** 68 cột FK trỏ `users.id`:
- **Thiết lập (9)** — xoá hẳn thì xoá theo; xoá mềm xử lý ở Task 4: `user_roles.user_id`, `user_permissions.user_id`,
  `user_emails.user_id`, `user_skills.user_id`, `user_prefs.user_id`, `demo_sessions.user_id` (phiên), `teacher_assignments.user_id`,
  `notifications.user_id` (thông báo **tới** người đó), `task_followers.user_id`.
- **Dấu vết (59)** — có ≥ 1 dòng → xoá mềm: `assessment_attempts.{created_by, deadline_override_by}` · `assessment_scores.{entered_by,
  no_show_by}` · `attachments.uploaded_by` · `attempt_schedule_history.actor_user_id` · `attempt_skill_skips.created_by` ·
  `attempt_skills.{scope_by, sit_by, deadline_override_by}` · `audit_logs.actor_user_id` · `case_followups.observer_user_id` ·
  `case_intervention_revisions.{actor_user_id, old_performer_user_id, new_performer_user_id}` · `case_interventions.{performer_user_id,
  recorded_by, approval_by, confirmed_by}` · `case_issues.created_by` · `case_milestones.created_by` · `case_signals.{owner_user_id,
  resolved_by}` · `case_sources.created_by` · `cycle_target_revisions.actor_user_id` · `discipline_measures.{owner_user_id,
  performed_by, confirmed_by, created_by}` · `journey_events.created_by` · `lo_trinh_tiep_theo.updated_by` · `measure_violations.added_by`
  · `skill_move_requests.{requested_by, decided_by}` · `sos_case_history.actor_user_id` · `sos_cases.{outcome_by, owner_user_id,
  reported_by, closed_by, acknowledged_by, head_confirmed_by}` · `sos_coordination_actions.{performed_by, removed_by}` ·
  `task_history.actor_user_id` · `task_updates.actor_user_id` · `tasks.{assignee_user_id, watcher_user_id, created_by, help_user_id}` ·
  `teacher_estimates.assessed_by` · `unit_report_history.actor_user_id` · `unit_report_task_links.created_by` ·
  `unit_reports.{reporter_user_id, submitted_by}` · `user_permissions.granted_by` · `users.approved_by` · `violation_history.actor_user_id`
  · `violations.{reported_by, invalidated_by}` (Q10).

## Bảng Q — tự quyết

| Q | Câu hỏi | Chốt | Lý do |
|---|---|---|---|
| Q1 | `audit_logs` cũ về em (entity 'student'/'sos_case'/…) | **Giữ**. Thêm một dòng `student.delete` (ai, lúc nào, `entity_label` = `{tên} · {mã}`, `after_json` = số dòng từng loại) | Nhật ký là bằng chứng việc người dùng đã làm; không có FK nên không treo; xoá nhật ký là xoá dấu vết của chính việc xoá |
| Q2 | `notifications` | Xoá theo `(entity_type, entity_id)` 9 loại (câu 7). `nhac_viec` (`entity_id` NULL, chỉ có chữ) **giữ** | Không trỏ dữ liệu nào; hết tác dụng khi việc biến mất |
| Q3 | `tasks` (Công việc của QL) nối tới Case/em | **Giữ việc**, gỡ liên kết: `source_sos_case_id` = NULL, xoá `task_students`, `task_case_links`. Panel nói "n công việc giữ lại, bỏ liên kết" | Việc có lịch sử cập nhật, nối báo cáo đơn vị, của người khác; xoá dây chuyền 6 bảng không đáng |
| Q4 | Vi phạm ↔ PA xử lý | `discipline_measures` có `student_id` và `checkViolationSet` (`measures.ts:331`) chỉ nối vi phạm **cùng em** → PA xử lý của em **xoá**. PA của em khác lỡ nối vi phạm của em (dữ liệu lỗi) → **chỉ xoá dòng nối** `measure_violations`, giữ PA | Đúng yêu cầu "gắn cả em khác → chỉ gỡ liên kết"; phép kiểm dựng đúng ca này |
| Q5 | Dòng của em khác trỏ vào dữ liệu của em | `sos_cases.previous_case_id`, `case_followups.evidence_attempt_id`, `tasks.source_sos_case_id` → **NULL** (cả 3 cho phép NULL). Mọi cạnh khác là "thuộc em" | Không xoá dữ liệu của em khác |
| Q6 | Dựng danh sách từ `PRAGMA` lúc chạy? | **Không** (62 câu PRAGMA/lần trên Turso). Danh sách cứng + phép kiểm so `PRAGMA` (X1, T1) | Tốc độ; bảng mới quên vẫn đỏ |
| Q7 | Hàm Netlify 10 s | Trong `tx`, trước câu 1: `conLaiMs() !== null && < XOA_CAN_CON_MS (6 000)` → `HttpError(503, 'Máy chủ đang bận, chưa xoá gì. Thử lại sau ít phút.')` | 39 câu × ≤ 100 ms ≈ 4 s; `tx` tự chặn ở 2,5 s là chưa đủ |
| Q8 | Mã HV đã xoá | Không tái dùng (`student_code_seq` giữ) | Mã ổn định, tránh nhầm với bản sao lưu |
| Q9 | Lớp của em sau khi xoá | Không tự kết thúc/xoá lớp (không gọi `dongLopNeuHet`) | QT dùng Xoá lớp / Kết thúc lớp (UX3) |
| Q10 | `users.approved_by`, `user_permissions.granted_by`, `task_followers` | Hai cột đầu **là dấu vết** (lịch sử duyệt/cấp quyền của người khác); `task_followers` **là thiết lập** | Xoá hẳn người đã duyệt ai đó là mất căn cứ "ai duyệt" |
| Q11 | Xoá mềm cụ thể | `status='deleted'` (giá trị mới), `deleted_at` (cột mới), `full_name = full_name || ' (đã xoá)'`, `email = 'da-xoa-' || id || '@invalid'`, `password_hash/salt = NULL`; xoá `demo_sessions`, `user_emails`, `user_permissions` (user_id), `user_prefs`, `task_followers`, `notifications` tới người đó; `user_roles` đang active → `'ended'`; `teacher_assignments` active → `status='ended', effective_to = hôm nay`; `user_skills` giữ | `user_roles` **không có** `effective_to` — dùng `'ended'` như `setRoles` (`accounts.ts:320`) |
| Q12 | Việc đang mở giao cho người bị xoá (Case `owner_user_id` chưa `done`, tín hiệu chờ, PA xử lý `preparing`, công việc chưa xong) | **Cảnh báo** trong panel ("Còn n Case/việc đang giao cho người này — đổi người phụ trách sau"), không chặn | Đặc tả chỉ chặn GVCN; không để việc rơi im lặng |
| Q13 | Ẩn khỏi ô chọn | **Không sửa** các đường chọn người: cả 9 chỗ đã lọc `u.status = 'active'` (xem Task 4) — `'deleted'` tự ẩn. Chỉ thêm phép kiểm | Ít chạm mã |
| Q14 | Backfill lưu trữ chạy lại mỗi lần migrate? | **Một lần**: đánh dấu `demo_config.key = 'xoa_du_lieu_backfill_at'`; có khoá rồi thì bỏ qua | Không lưu trữ lại em QL đã "Bỏ lưu trữ" |
| Q15 | Bộ demo (seed) | Em `finished` có `archived_at = finishedAt` (`build.ts:88-100`) | Seed phải theo luật mới |
| Q16 | Xoá HV đang học? | Cho phép mọi trạng thái; panel thêm dòng vàng "Em đang học lớp {mã}" | QT, gõ mã, có sao lưu |
| Q17 | Audit tệp | Một dòng `student.delete` có `soTep`; **không** dùng `purgeAttachmentsOf` (một câu audit mỗi tệp) | Trần câu SQL |
| Q18 | Tài khoản `pending` | Không có Xoá (đã có Từ chối) | Ngoài phạm vi |

## Task 0 · Worktree, mốc

- [ ] `git fetch origin`; kiểm UX3 đã merge: `git log origin/main --oneline | grep -i "ux3"` **và** `git show origin/main:server/src/classes/xoaKetThucLop.ts`
  chạy được. Chưa → **dừng**, báo planning.
- [ ] `git worktree add .claude/worktrees/pr-xoa-du-lieu -b pr-xoa-du-lieu origin/main`; chép kế hoạch này vào nhánh.
- [ ] Đối chiếu dòng thật (UX3 đã dời dòng): `StudentDetailPage.tsx` (khối `<Menu label="⋮"`), `StudentManagePanel.tsx` (switch `viec`),
  `quanLyHocVien.ts`, `profile.ts` (khối `viewer`), `routes/index.ts` (`/students/:id/status`, `/admin/accounts`). Ghi vào Nhật ký.
- [ ] Chạy lại script đồ thị (Task 2 X1) một lần trên `schema.sql` của main: vẫn 29 bảng / 52 cạnh / 68 cột users? Khác → cập nhật
  bảng tham chiếu, ghi Nhật ký.
- [ ] `npm run check` → mốc **B**. Commit `PR-XOA (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Lưu trữ tự động (§2) + migrate

**Files:** `server/src/students/students.ts:265`; `server/src/schema.sql:131-149` (thêm `deleted_at TEXT` sau `status` của `users`);
`server/src/migrate.ts` (hàm mới `migrateXoaDuLieu`, gọi ngay sau `migrateLenLop` ở dòng ~450); `server/src/seed/build.ts:88-100`;
`web/src/modules/students/StudentManagePanel.tsx` (luật khối `ket-thuc`); tạo `server/src/tests/xoaDuLieu.tests.ts`
(`runXoaDuLieuTests(t: YThucTestKit)`, khung như `lenLop.tests.ts`), đăng ký **cuối** `run.ts`.

```ts
// students.ts:265 — thôi học (finished) tự vào Lưu trữ; bảo lưu/quay lại thì không
conn.prepare('UPDATE students SET status = ?, finished_at = ?, archived_at = ? WHERE id = ?')
  .run(status, status === 'finished' ? date : null, status === 'finished' ? date : null, studentId);
// writeAudit(student.status).after thêm archivedAt

// migrate.ts
export function migrateXoaDuLieu(conn: any, applied: string[]) {
  /* hasTable/cols như migrateLenLop */
  if (!hasTable('users') || !hasTable('students')) return;
  const done: string[] = [];
  if (!cols('users').includes('deleted_at')) { conn.exec('ALTER TABLE users ADD COLUMN deleted_at TEXT'); done.push('users.deleted_at'); }
  const KHOA = 'xoa_du_lieu_backfill_at';
  if (hasTable('demo_config') && !conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA)) {
    const r = conn.prepare(`UPDATE students SET archived_at = COALESCE(finished_at, substr(created_at, 1, 10))
                             WHERE status = 'finished' AND archived_at IS NULL`).run();
    conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA, nowIso(), nowIso());
    if (r.changes) done.push(`đưa ${r.changes} học viên đã thôi học vào Lưu trữ`);
  }
  if (done.length) applied.push(`PR-XOA: ${done.join(', ')}.`);
}
```
- Nơi gọi `setStudentStatus(…,'finished')` tự theo: `transition.ts:311` (Dừng học), route `/students/:id/status` (Kết thúc học ở ⋮).
  `luatLoTrinh.ts:469` (bảo lưu → `inactive`) **không** đổi. `setOutcome` (`cycles.ts:301`) không đổi trạng thái em → không liên quan.
- `StudentManagePanel` khối `ket-thuc`, `luat`: `Case còn mở sẽ được hệ thống đóng “Học viên kết thúc khoá”. Hồ sơ vào khu Lưu trữ (chỉ xem).`
- Seed: `archived_at` = `s.status === 'finished' ? (s.finishedAt ?? null) : null` trong **cùng** câu INSERT (bỏ UPDATE riêng nếu gộp được).

**Phép kiểm (≥ 7):** L1 `setStudentStatus(finished, d)` → `archived_at = d`, có ở `danhSachLuuTru().hocVien` · L2 `inactive` →
`archived_at` NULL · L3 `applyTransition` Dừng học → em có `archived_at` · L4 `migrateXoaDuLieu` trên DB kiểu cũ (bảng `users` không
`deleted_at`, 2 em finished/NULL): thêm cột + 2 em lưu trữ + `applied` có dòng · L5 chạy lại sau khi `unarchiveStudent` một em →
em đó **vẫn** NULL, `applied` rỗng · L6 DB mới dựng từ `schema.sql` + seed: không em nào `finished` mà `archived_at IS NULL` ·
L7 `lopHocCua` em vừa Kết thúc học → `chiXem = true`, chỉ còn `boLuuTru`.
**Sửa kỳ vọng:** `luatMayChu.tests.ts:744-755` (RB-9): sau Kết thúc học em **đã** lưu trữ → `unarchiveStudent` rồi `archiveStudent`
→ `auditN('student.archive') === 1`; giữ các khẳng định GV không được, em đang học không lưu trữ được. `lenLop.tests.ts:966-1030`
chỉ sửa nếu đỏ (ghi Nhật ký). Commit `PR-XOA (1): học viên thôi học tự vào Lưu trữ + migrate deleted_at/backfill`.

## Task 2 · Máy chủ: xoá học viên + phép kiểm "không sót"

**Files:** tạo `server/src/students/xoaHocVien.ts`; `server/src/routes/index.ts` (cạnh `/students/:id/status`);
`server/src/students/profile.ts` (`viewer`); `server/src/tests/tocDoDuong.ts`; `xoaDuLieu.tests.ts`.

**Produces:**
```ts
export const BANG_CUA_HOC_VIEN: readonly string[];   // 29 bảng (bao đóng), để phép kiểm so
export const CANH_NULL: readonly string[] = ['sos_cases.previous_case_id', 'case_followups.evidence_attempt_id', 'tasks.source_sos_case_id'];
export const CAU_XOA_HOC_VIEN: readonly { bang: string; sql: string }[];  // đúng thứ tự bảng trên, tập Y/A/C/… ghép bằng template
export const XOA_CAN_CON_MS = 6_000;
export type XemXoaHocVien = { id: number; ma: string; ten: string; lop: string | null; dangHoc: boolean;
  mat: { khoa: string; nhan: string; so: number }[];  // chỉ loại > 0, thứ tự: Lượt Test · Điểm · Case học thuật · PA học thuật · Ghi kết quả PA · Tín hiệu · Vi phạm · PA xử lý · Phối hợp SOS · Tệp · Thông báo · Lớp từng học
  congViecGoLienKet: number };
export function xemXoaHocVien(p: Principal, studentId: number): XemXoaHocVien;       // GET  /students/:id/xoa   (2 câu)
export function xoaHocVien(p: Principal, studentId: number, input: { maXacNhan?: unknown }): { ok: true; ma: string; soDong: Record<string, number> };
                                                                                       // POST /students/:id/xoa
```
- Cả hai: `require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống mới xoá được học viên.')` **trước** mọi đọc.
  Không có em → 404. `String(input.maXacNhan ?? '').trim() !== student_code` → 400 `Gõ lại đúng mã học viên để xác nhận xoá.`
- Câu đếm (xem trước và `soDong` cho audit) là **một** `SELECT (SELECT COUNT(*) FROM … WHERE id IN (A)) AS luotTest, …` dùng
  cùng tập. Đọc em + lớp đang học: một câu `LEFT JOIN enrollments … status IN ('active','paused')`.
- `xoaHocVien`:
```ts
const khoaTep: string[] = [];
tx(() => {
  const con = conLaiMs();
  if (con !== null && con < XOA_CAN_CON_MS) throw new HttpError(503, 'Máy chủ đang bận, chưa xoá gì. Thử lại sau ít phút.');
  const conn = db();
  for (const c of CAU_XOA_HOC_VIEN) {
    if (c.bang === 'attachments#tep') { for (const r of conn.prepare(c.sql).all({ s: sid }) as { url: string }[]) khoaTep.push(r.url); continue; }
    conn.prepare(c.sql).run({ s: sid });
  }
  writeAudit({ actorUserId: p.userId, action: 'student.delete', entityType: 'student', entityId: sid,
    entityLabel: `${s.full_name} · ${s.student_code}`, before: { ma: s.student_code, ten: s.full_name, lop: s.lop }, after: { soDong, soTep: khoaTep.length } });
});
xoaTepSauGiaoDich(khoaTep);   // SAU tx — khuôn violations.ts:333-348
```
  Tham số có tên `{ s: sid }` (một lần gắn cho mọi `@s`). Task 0 thử nhanh `db().prepare('SELECT @s AS x').get({ s: 1 })` trên libsql.
- `profile.ts` `viewer`: thêm `coTheXoa: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })`.
- `tocDoDuong.ts`: `{ trang: 'Hồ sơ HV', vai: ['QT', 'QL', 'GVCN'], url: '/students/{hv}/xoa', maChuDich: { QL: 403, GVCN: 403 } }`.

**Fixture** (trong test, bằng SQL thẳng, mỗi bảng một INSERT tối thiểu theo cột NOT NULL của `schema.sql`): `taoHocVienDuDuLieu(ma)`
tạo em mới trong lớp `MB-FT 101` có **≥ 1 dòng ở mỗi bảng của `BANG_CUA_HOC_VIEN`** (2 lộ trình, 2 lượt Test, Case có PA + ghi kết
quả + điều chỉnh PA + mốc + tín hiệu, vi phạm + PA xử lý + dòng nối + lịch sử, Phối hợp SOS, xin dời lịch, ước lượng, hành trình,
Lộ trình tiếp theo, `task_students`, `task_case_links`), **5 tệp** (`kind='file'`, mỗi `owner_type` một tệp, đặt sẵn vào kho giả
`datKhoTepChoKiemThu`), **9 thông báo** (mỗi `entity_type` một). Tạo **em T** cùng lớp bằng cùng hàm, rồi nối chéo: Case của T
`previous_case_id` = Case của S; ghi kết quả của T `evidence_attempt_id` = lượt của S; PA xử lý của T nối vi phạm của S
(`measure_violations`); một `tasks` có `source_sos_case_id` = Case của S và `task_students` cho cả S và T.

**Thuật toán "không sót" (hàm trong test):**
```ts
// 1) Đồ thị: canh = SELECT m.name bang, f."from" cot, f."table" toi FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) f WHERE m.type='table'
// 2) Bao đóng lược đồ: bắt đầu {students}; lặp: cạnh (bang.cot → toi) không thuộc CANH_NULL, toi ∈ tập → thêm bang. Dừng khi không đổi.
// 3) Dòng của em (dữ liệu): so = Map<bang, Set<rowid>>, so.students = {sid}; lặp theo cạnh như (2):
//      SELECT rowid FROM bang WHERE cot IN (<id của toi đã có>) → thêm; dừng khi không bảng nào thêm dòng.
// 4) Liên kết mềm: attachments theo 5 owner_type ↔ tập tương ứng; notifications theo 9 entity_type ↔ tập tương ứng.
```
**Phép kiểm (≥ 12):**
- **X1** tập bảng (2) **bằng đúng** `BANG_CUA_HOC_VIEN` (29) — lệch in tên bảng thừa/thiếu: "Bảng X trỏ tới học viên mà `xoaHocVien` chưa xoá".
- **X2** mỗi cạnh (bang.cot → toi ∈ bao đóng, 52 cạnh): có câu trong `CAU_XOA_HOC_VIEN` với `bang` đó mà `sql` chứa `cot`, hoặc
  cạnh thuộc `CANH_NULL` và có câu `UPDATE bang SET cot = NULL`. Mọi `owner_type` trong `OWNER_TYPES` trừ `unit_report` có trong câu 6.
- **X3** fixture phủ: mỗi bảng của bao đóng có ≥ 1 dòng thuộc S (3); đủ 5 tệp, 9 thông báo.
- **X4** sau `xoaHocVien(P.admin, S, { maXacNhan: mã })`: mọi dòng ở (3) và (4) = 0; `PRAGMA foreign_key_check` không thêm dòng nào so với trước.
- **X5** em T: bao đóng của T đếm theo từng bảng **bằng** trước khi xoá; Case của T còn, `previous_case_id` NULL; ghi kết quả của T
  còn, `evidence_attempt_id` NULL; PA xử lý của T còn, dòng nối tới vi phạm của S mất; `tasks` còn, `source_sos_case_id` NULL,
  `task_students` của T còn.
- **X6** tổng: mỗi bảng `sau = trước − |dòng của S|`; riêng `audit_logs` +1, `tasks` bằng nhau.
- **X7** kho giả: 5 khoá tệp bị xoá, lúc bị gọi `db().inTransaction === false`; `choViecNenKhoTep()` xong.
- **X8** tất cả hoặc không: `CREATE TEMP TRIGGER chan BEFORE DELETE ON students BEGIN SELECT RAISE(ABORT,'thu'); END` → `xoaHocVien`
  ném; mọi bảng đếm như trước; kho giả **không** bị gọi; `DROP TRIGGER`.
- **X9** quyền: `P.mbManager`, `P.coreTeacher` → 403 ở cả `xemXoaHocVien` và `xoaHocVien`; mã sai → 400, không dòng nào mất; id lạ → 404.
- **X10** đếm câu (khuôn `demTruyVan5`, `lenLop.tests.ts:725`): xoá em đủ dữ liệu ≤ 42; em có 1 lượt Test và em có 6 lượt → **cùng số câu**; xem trước ≤ 3.
- **X11** hạn giờ: `chayVoiHan(Date.now() + 5_000, () => xoaHocVien(...))` → 503 `chưa xoá gì`, đếm bảng như trước.
- **X12** audit `student.delete` đúng một dòng, `entity_label` = `{tên} · {mã}`, `after_json.soDong.luotTest === 2`.
- **X13** `xemXoaHocVien` khớp fixture (lượt Test 2, tệp 5, thông báo 9, …); `studentProfile(P.admin).viewer.coTheXoa === true`, QL/GV `false`.
Commit `PR-XOA (2): máy chủ xoá học viên + phép kiểm không sót`.

## Task 3 · Giao diện: ⋮ Hồ sơ HV › Xoá học viên

**Files:** `shared/domain/quanLyHocVien.ts` (UX3); `web/src/ui/Menu.tsx`; `web/src/modules/students/StudentDetailPage.tsx`
(khối `<Menu label="⋮"`); `StudentManagePanel.tsx` (switch); tạo `web/src/modules/students/XoaHocVienPanel.tsx`.

- `ViecQuanLy` thêm `'xoa-hoc-vien'`, `NHAN_VIEC_QUAN_LY['xoa-hoc-vien'] = 'Xoá học viên'`; `mucQuanLyHocVien({ …, coTheXoa })`
  push `'xoa-hoc-vien'` **cuối cùng** khi `coTheXoa`. Kiểu trả thêm `nguyHiem?: boolean; keTruoc?: boolean` (chỉ mục này `true`).
- `Menu.tsx`: `MenuItem` thêm `keTruoc?: boolean` → `borderTop: 1px solid var(--line)`, `mt-1 pt-2` (như `MenuDong.tsx:72-73`).
  Key dùng `it.label` giữ nguyên. `danger` đã có → chữ `text-rose-200`.
- `StudentDetailPage`: truyền `coTheXoa: data.viewer.coTheXoa`; map `danger: m.nguyHiem, keTruoc: m.keTruoc`.
- `XoaHocVienPanel({ studentId, studentName, lop, onClose })`: `useApi<XemXoaHocVien>(\`/students/${id}/xoa\`)`.
```tsx
<KhungPanel tieuDe="Xoá học viên" hocVien={ten} lop={lop} onDong={onClose}
  chan={{ chinh: <button className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy || go.trim() !== d.ma} onClick={xoa}>Xoá vĩnh viễn</button> }}>
  <Khoi tieuDe="Học viên">{ten} · {ma} · {lop ?? 'Chưa xếp lớp'}{dangHoc && <span className="text-soon"> · đang học</span>}</Khoi>
  <Khoi tieuDe="Những gì sẽ mất"><table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>…nhãn | số (tabular-nums, phải)…</table>
    {congViecGoLienKet > 0 && <p className="text-xs text-slate-400">{n} công việc giữ lại, bỏ liên kết với em.</p>}</Khoi>
  <Khoi tieuDe="Xác nhận"><p className="text-sm text-soon">Không khôi phục được (trừ từ bản sao lưu).</p>
    <p className="text-xs text-slate-400">Nên sao lưu trước lần xoá đầu (npm run sao-luu)</p>
    <Truong nhan="Gõ lại mã học viên" batBuoc phu={`Mã: ${ma}`}><input className="field w-full" autoComplete="off" … /></Truong></Khoi>
</KhungPanel>
```
  Sau xoá: `invalidate('/students'); invalidate('/hoc-vien-lop'); invalidate('/classes'); invalidate('/overview'); invalidate('/my-work'); invalidate('/cases')`,
  toast `Đã xoá học viên {mã}`, `navigate('/hoc-vien', { replace: true })`. Lỗi → toast, giữ panel.

**Phép kiểm (≥ 3, shared):** `mucQuanLyHocVien` với `coTheXoa` → mục cuối `xoa-hoc-vien`, `nguyHiem && keTruoc`; không cờ → không
có; GVBM (không mục nào) + `coTheXoa: false` → rỗng. Quét nguồn `XoaHocVienPanel.tsx`: có `KhungPanel`, không `SectionNote`,
`fmtDate(`, `<Modal`. Commit `PR-XOA (3): ⋮ Hồ sơ HV › Xoá học viên`.

## Task 4 · Máy chủ: xoá tài khoản

**Files:** tạo `server/src/platform/xoaTaiKhoan.ts`; `server/src/platform/accounts.ts` (`listAccounts` 455-484 thêm `deletedAt`;
`setRoles` 310, `resetPassword` 332, `setUserPermissions` 417: `status === 'deleted'` → 400 `Tài khoản đã xoá.`);
`server/src/routes/index.ts` (cạnh `/admin/accounts/:id/password` ~2046); `xoaDuLieu.tests.ts`.

**Produces:**
```ts
export const COT_TRO_TAI_KHOAN: readonly { bang: string; cot: string; loai: 'dau_vet' | 'thiet_lap'; nhan: string }[]; // 68 dòng — bảng tham chiếu
export type XemXoaTaiKhoan = { id: number; ten: string; email: string | null; vai: string[]; chiNhanh: string[];
  soDauVet: number; chiTiet: { nhan: string; so: number }[];     // gộp theo nhan (vd "điểm đã nhập", "Case", "nhật ký thao tác"), > 0, giảm dần
  cach: 'han' | 'mem'; chan: string | null; canhBao: string[] };
export function xemXoaTaiKhoan(p: Principal, userId: number): XemXoaTaiKhoan;          // GET  /admin/accounts/:id/xoa
export function xoaTaiKhoan(p: Principal, userId: number, input: { emailXacNhan?: unknown }): { ok: true; cach: 'han' | 'mem' };
                                                                                        // POST /admin/accounts/:id/xoa
```
- Quyền `ADMIN_CONFIG anyScope` ('Chỉ Quản trị hệ thống mới xoá được tài khoản.'). Không có / `approval_state='pending'` → 404.
  `status === 'deleted'` → 400 `Tài khoản đã xoá.`
- **Dấu vết:** **một** câu `SELECT k, n FROM (SELECT 'bang.cot' AS k, COUNT(*) AS n FROM bang WHERE cot = @u UNION ALL …)` trên 59
  cột `dau_vet`. `soDauVet` = tổng.
- **Chặn** (theo thứ tự, câu đầu trúng là `chan`): `userId === p.userId` → `Không tự xoá tài khoản của chính mình.` · người này là QT
  đang hoạt động và `SELECT COUNT(DISTINCT u.id) … r.key='system_admin' AND ur.status='active' AND u.status='active' AND u.id != @u` = 0
  → `Đây là Quản trị hệ thống cuối cùng.` · `teacher_assignments` `is_core=1 AND status='active' AND (effective_to IS NULL OR effective_to >= hôm nay)`
  nối `classes.status='active'` → `Đổi GVCN lớp {mã, mã} trước.`
- **Cảnh báo:** GVBM đang dạy (`skill IS NOT NULL`, lớp active) → `Lớp {mã} sẽ thiếu GV môn {kỹ năng}`; việc đang mở (Q12, một câu
  đếm: `sos_cases.owner_user_id` chưa `done`, `case_signals.owner_user_id` chờ, `discipline_measures.owner_user_id` `preparing`,
  `tasks.assignee_user_id` chưa `completed_at`) → `Còn {n} Case/việc đang giao cho người này — đổi người phụ trách sau khi xoá.`
- `xoaTaiKhoan`: `String(input.emailXacNhan ?? '').trim().toLowerCase() !== email` → 400 `Gõ lại đúng email để xác nhận xoá.`;
  `chan` → 400 nguyên câu chặn. Tính lại `soDauVet` **trong** `tx` (hai QT bấm cùng lúc):
  - `0` → **xoá hẳn**: `DELETE` 9 bảng thiết lập `WHERE <cột> = @u` rồi `DELETE FROM users WHERE id = @u`.
  - `> 0` → **xoá mềm** (Q11): một `UPDATE users SET status='deleted', deleted_at=@nay, full_name = full_name || ' (đã xoá)',
    email = 'da-xoa-' || id || '@invalid', password_hash = NULL, password_salt = NULL WHERE id = @u`; `DELETE` `demo_sessions`,
    `user_emails`, `user_permissions` (user_id), `user_prefs`, `task_followers`, `notifications` (user_id); `UPDATE user_roles SET
    status='ended' WHERE user_id=@u AND status='active'`; `UPDATE teacher_assignments SET status='ended', effective_to=@homNay WHERE user_id=@u AND status='active'`.
  - `writeAudit({ action: 'user.delete', entityType: 'users', entityId, entityLabel: tên cũ, before: { email, vai }, after: { cach, soDauVet } })`.
- **Chín đường chọn người đã lọc `u.status='active'`** (không sửa, chỉ kiểm): `/ref/nguoi` → `timNguoi.ts:78-95` + `laNguoiHopLe:31`;
  `/ref/people` → `meeting.ts:726`; `/ref/users` (ChonPhuTrach) → `routes/index.ts:313`; `/ref/teachers` (Tạo lớp) → `routes/index.ts:335-341`;
  `/classes/:id/teachers` (TeacherAssignPanel) → `teacherCandidates` `classes.ts:753-760`; `meeting.ts:646`; `cases.ts:2596`;
  `/demo/accounts` `routes/index.ts:106`; phiên `auth.ts:55-61`.

**Phép kiểm (≥ 12):**
- **T1** `COT_TRO_TAI_KHOAN` (68) **bằng đúng** tập `(bang, cot)` có `table = 'users'` từ `pragma_foreign_key_list`; `thiet_lap` đúng 9
  cột đã liệt kê. Cột mới trỏ `users` → đỏ "Phân loại cột X.Y (dấu vết hay thiết lập)".
- **T2** tài khoản mới tạo (`createAccount`), chưa làm gì → `cach='han'`; sau xoá: không dòng nào ở 68 cột trỏ id đó, dòng `users` mất.
- **T3** GVBM seed có điểm đã nhập → `cach='mem'`, `soDauVet > 0`; sau xoá: `status='deleted'`, `deleted_at`, tên kết thúc ` (đã xoá)`,
  email `da-xoa-{id}@invalid`, không mật khẩu, 0 phiên, 0 `user_roles` active, 0 `teacher_assignments` active và `effective_to` = hôm nay;
  số dòng dấu vết **không đổi**.
- **T4** `createAccount` lại **đúng email cũ** thành công; `login(email cũ, mật khẩu cũ)` → `Email hoặc mật khẩu không đúng.`
- **T5** ẩn: `timNguoi` (q ≥ 3 ký tự theo tên), `searchPeople`, `/ref/users` (gọi hàm route hoặc câu tương đương), `/ref/teachers`,
  `classTeachers(...).candidates` đều không có id đó; `resolveSession(token cũ)` → null.
- **T6** lịch sử: `caseDetail` của Case người đó báo → tên người báo kết thúc ` (đã xoá)`.
- **T7** chặn: tự xoá; QT cuối (dựng DB chỉ một QT: đổi vai QT khác thành `ended` trong savepoint rồi cuộn lại); GVCN lớp active
  → câu `Đổi GVCN lớp MB-FOU 12 trước.` và không gì đổi.
- **T8** cảnh báo GVBM `Lớp … sẽ thiếu GV môn …`; việc đang mở có số.
- **T9** quyền: `P.mbManager` → 403 cả hai hàm; email sai → 400; xoá lần hai → 400 `Tài khoản đã xoá.`
- **T10** `listAccounts` có dòng `status='deleted'`, `deletedAt`; `setRoles`/`resetPassword` trên tài khoản đã xoá → 400.
- **T11** đếm câu: xem trước ≤ 8, xoá mềm ≤ 15, xoá hẳn ≤ 15.
- **T12** audit `user.delete` đúng một dòng.
Commit `PR-XOA (4): máy chủ xoá tài khoản (xoá hẳn / xoá mềm), chặn và cảnh báo`.

## Task 5 · Giao diện: Quản trị hệ thống › Tài khoản › ⋯ › Xoá tài khoản

**Files:** `web/src/ui/MenuDong.tsx` (`MucMenu` thêm `nguyHiem?: boolean` → chữ `text-rose-200`); `web/src/modules/platform/AccountsAdmin.tsx`
(dòng 11-17 kiểu `Account` thêm `deletedAt`; 52-128 bảng); tạo `web/src/modules/platform/XoaTaiKhoanPanel.tsx`.

- Trên bảng (trong `action` của Card, cạnh `+ Tạo tài khoản`): hai nút lọc `Đang dùng ({n})` · `Đã xoá ({m})` (`btn btn-sm`, nút đang
  chọn `btn-primary`); mặc định `Đang dùng`. Tiêu đề Card `Tài khoản ({số đang hiện})`.
- Dòng đang dùng: `Sửa` + `<MenuDong muc={[{ key: 'xoa', nhan: 'Xoá tài khoản', nguyHiem: true, onChon }]} nhan="Thêm thao tác" />`.
  Dòng đã xoá: chữ mờ, cột cuối `Đã xoá {ngay(deletedAt)}`, **không** Sửa/⋯.
- `XoaTaiKhoanPanel({ userId, onClose, onDone })` — KhungPanel `tieuDe="Xoá tài khoản"` `hocVien={ten}`:
  Khối `Tài khoản` (email · vai · chi nhánh, một dòng) → Khối `Cách xoá`: `chan` → một dòng `text-late`, nút tắt; `cach='mem'` →
  `Có dấu vết ({soDauVet} dòng) → tài khoản bị khoá và ẩn, lịch sử giữ tên kèm (đã xoá)` + tối đa 4 dòng `chiTiet` hai cột thẳng;
  `cach='han'` → `Chưa có dấu vết → xoá hẳn`. `canhBao` mỗi dòng một câu `text-soon` → Khối `Xác nhận`: dòng sao lưu (nguyên văn)
  + `Truong nhan="Gõ lại email"` (so khớp không phân biệt hoa thường). Nút `Xoá tài khoản` (`btn-danger`).
  Sau xoá: `invalidate('/admin/accounts'); invalidate('/demo/accounts')`, toast `Đã xoá tài khoản {tên}`.

**Phép kiểm (≥ 2, quét nguồn):** `XoaTaiKhoanPanel.tsx` có `KhungPanel`, không `SectionNote`/`fmtDate(`/`<Modal`; `AccountsAdmin.tsx` có
`Đã xoá` và `Xoá tài khoản`. Commit `PR-XOA (5): Tài khoản › ⋯ › Xoá tài khoản, lọc Đã xoá`.

## Task 6 · Lệnh kiểm chỉ đọc + tài liệu

**Files:** tạo `server/src/ops/kiemSauXoa.ts`; `package.json` script `"kiem-sau-xoa": "npm run build:server && node dist-server/server/src/ops/kiemSauXoa.js"`;
`docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §4; `CODE_MAP.md`; `plan.md`.

- `kiemSauXoa.ts` (**chỉ đọc**, chỉ `.prepare(...).all/get` — không `run`, không `exec`): in `DB_PATH` (không token) rồi bảng:
  (1) `students` có `student_code IN ('PISA-000001','PISA-000002','PISA-000003')` · (2) lớp `MB-FT THU 01` còn không, `status` ·
  (3) mọi `users`: `id · full_name · email · status · deleted_at` · (4) `PRAGMA foreign_key_check` — số dòng · (5) tệp mồ côi:
  `attachments` có `owner_id` không còn ở bảng chủ theo 5 `owner_type` · (6) `users` có cột `deleted_at` chưa (migrate đã chạy chưa).
- Bảng định vị §4 thêm dòng: `Xoá học viên | ⋮ Hồ sơ HV → cuối menu, sau đường kẻ (chữ đỏ) | Quản trị hệ thống` · `Xoá tài khoản |
  Quản trị hệ thống › Tài khoản → ⋯ dòng | Quản trị hệ thống` · `Tài khoản đã xoá | Quản trị hệ thống › Tài khoản → nút lọc Đã xoá |
  Quản trị hệ thống` · `Xoá lớp / Kết thúc lớp | ⋮ Hồ sơ lớp → cuối menu | Quản trị hệ thống` (nếu UX3 chưa thêm). Dòng `Lưu trữ`
  thêm `· HV thôi học (Kết thúc học, Dừng học) tự vào`.
- `CODE_MAP.md`: `xoaHocVien.ts`, `xoaTaiKhoan.ts`, `XoaHocVienPanel.tsx`, `XoaTaiKhoanPanel.tsx`, `kiemSauXoa.ts`, `xoaDuLieu.tests.ts`.
  `plan.md`: mục PR-XOA (một dòng).

**Phép kiểm (1):** quét nguồn `kiemSauXoa.ts` sau khi bỏ chú thích: không `.run(`, `.exec(`, `INSERT`, `UPDATE`, `DELETE`.
Commit `PR-XOA (6): lệnh kiem-sau-xoa chỉ đọc, bảng định vị, CODE_MAP`.

## Task 7 · Bấm thử theo vai + 375px (một lần), đẩy PR

- [ ] Máy chủ thử (nhớ "máy chủ dev trong worktree"): trong worktree `npm run seed` → `PORT=4507 node dist-server/server/src/index.js`
  (nền) → file Vite **tạm** ở gốc worktree (`port: 5707, strictPort`, proxy `/api` → `127.0.0.1:4507`, alias `@shared`) →
  `npx vite --config <file>`; Playwright kênh Chrome; đăng nhập `POST /api/demo/session { userId }`.
- [ ] Kịch bản (ảnh `thiet-ke/anh/pr-xoa/NN-ten-{1440|375}.png`):
  1. **QT (1)** · Hồ sơ HV một em có Case + vi phạm: ⋮ → `Xoá học viên` cuối menu, sau đường kẻ, chữ đỏ. Panel: bảng số thẳng cột,
     nút đỏ tắt tới khi gõ đúng mã → xoá → về Học viên & Lớp; tìm mã → không thấy; khu Lưu trữ → không thấy.
  2. **QT** · ⋮ Hồ sơ HV khác → `Kết thúc học` → hồ sơ thành chỉ xem, có ở Lưu trữ; `Bỏ lưu trữ` vẫn chạy.
  3. **QL (2)**, **GVCN (7)**: ⋮ Hồ sơ HV **không** có `Xoá học viên`; gọi `GET /api/students/{id}/xoa` → 403. **GVBM (9)**: không ⋮.
  4. **QT** · Tài khoản: ⋯ một GV có điểm → `Có dấu vết (n dòng)…` → gõ email → xoá → dòng rời `Đang dùng`, có ở `Đã xoá`.
     Mở Hồ sơ lớp của GV đó → ⋮ `Sửa phân công`: ô chọn không có người đó; Case người đó từng báo → tên có `(đã xoá)`.
  5. **QT** · tài khoản mới tạo → `Chưa có dấu vết → xoá hẳn`; tài khoản GVCN lớp đang học → dòng chặn `Đổi GVCN lớp … trước`, nút tắt;
     chính mình → chặn.
  6. **375px:** kịch bản 1, 4 — toàn màn, đầu/chân dính, không cuộn ngang.
- [ ] Sửa lỗi bắt được (commit `PR-XOA (7a): …`). Dọn file Playwright/Vite tạm; tắt 4507/5707; quét `run.js` treo.
- [ ] Rebase `origin/main` nếu UX1/UX4 đã merge (gỡ theo bảng Chồng file). `npm run check` cuối (≥ B + 40).
- [ ] Push, mở PR `PR-XOA: xoá học viên, xoá tài khoản, lưu trữ tự động (chỉ Quản trị hệ thống)` — thân: tóm tắt theo Task, bảng Q,
  bảng tham chiếu, ảnh, **"CÓ MIGRATE: users.deleted_at + backfill lưu trữ (một lần) — migrate DB THỬ trước bản nháp, DB CHÍNH trước
  bản chính thức"**, chép nguyên **Task 8** vào thân PR, dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  Báo planning (không tự merge, không tự rà).

## Task 8 · Kịch bản dọn dữ liệu thử trên bản chính — **CHỈ VIẾT, KHÔNG CHẠY**

Cho session deploy (Opus 5.5 · High, B: Fable 5.1 · High) sau khi PR-XOA đã merge, trong đợt deploy gộp. Chủ sản phẩm đăng nhập
tài khoản quản trị (`dovutuanphong95.pisa@gmail.com`, userId 1) trong khung trình duyệt; session thao tác bằng phiên đó, **không**
gõ mật khẩu. DB CHÍNH `pisatracking-pizi147`. **Không đụng:** tài khoản quản trị, **Hằng, Yến, Thu Hà**. Sau **mỗi** bước chạy
`npm run kiem-sau-xoa` (biến môi trường DB CHÍNH như TRIEN_KHAI.md §11.1) và dán kết quả vào nhật ký; bước nào lệch → **dừng**, báo planning.

| Bước | Làm | Kiểm (phải thấy) |
|---|---|---|
| 1 | Sao lưu DB CHÍNH (TRIEN_KHAI.md §10) | dòng `[sao-luu] Xong…` đúng `pisatracking-pizi147`; file có trong Drive |
| 2 | Migrate DB THỬ, rồi DB CHÍNH (§11.1) | `kiem-sau-xoa` mục (6) `deleted_at: có`; (4) `foreign_key_check: 0` |
| 3 | Deploy bản chính thức (§8) | trang chủ mở, đăng nhập quản trị được |
| 4 | Ghi lại trước khi xoá: `kiem-sau-xoa` (1)(2)(3) | đúng 3 HV `PISA-000001..3` thuộc `MB-FT THU 01`; tài khoản `thu.quanly/thu.gvcn/thu.gvbm.pisa@gmail.com` + 4 tài khoản thật đang `active`. Khác → **dừng** |
| 5 | Từng em `PISA-000001`, `…002`, `…003`: Hồ sơ HV → ⋮ → `Xoá học viên` → chụp bảng "Những gì sẽ mất" → gõ mã → `Xoá vĩnh viễn` | sau mỗi em: (1) bớt đúng em đó; (4) `0`; (5) `0`; tìm mã ở Học viên & Lớp và Lưu trữ → không thấy |
| 6 | Hồ sơ lớp `MB-FT THU 01` → ⋮ → `Xoá lớp` → gõ mã lớp | (2) không còn lớp. Panel báo "Lớp đã có dữ liệu (…)" → **dừng**, không dùng Kết thúc lớp thay, báo planning |
| 7 | Quản trị hệ thống › Tài khoản: `thu.gvbm` → ⋯ → `Xoá tài khoản` → đọc "Có dấu vết / Chưa có dấu vết" → gõ email → xoá. Lặp `thu.gvcn`, `thu.quanly`. Trước mỗi lần: **so email từng chữ** | (3): 3 tài khoản thử `deleted` (tên `… (đã xoá)`, email `da-xoa-…@invalid`) **hoặc** biến mất (xoá hẳn); quản trị + Hằng + Yến + Thu Hà vẫn `active`, email không đổi; (4) `0` |
| 8 | Kiểm cuối: Tài khoản › `Đang dùng` = 4; mở Tổng quan, Học viên & Lớp, Test bằng tài khoản quản trị | không lỗi; không còn `MB-FT THU 01`, `PISA-00000{1,2,3}` |
| 9 | Hỏng ở bất kỳ bước nào sau bước 4 mà không sửa được bằng giao diện | Khôi phục từ bản sao lưu bước 1 (TRIEN_KHAI.md §11.2), báo planning |

Ghi chú: tài khoản thử có nhật ký thao tác (`audit_logs`) nên gần như chắc thành **xoá mềm** — đúng luật (Q10/Q11), chúng ẩn khỏi mọi
ô chọn. Sau đợt này nhắc chủ sản phẩm **đổi token DB CHÍNH + mật khẩu quản trị** trước khi báo GV (nhớ 23/09).

---

## Mâu thuẫn nguồn ↔ mã thật

1. Đặc tả §3 "kết thúc user_roles (`effective_to`)": `user_roles` **không có** `effective_to` (`schema.sql:227-234`) → `status='ended'`
   như `setRoles` (`accounts.ts:320`); `teacher_assignments` mới có `effective_to` (Q11).
2. Đặc tả §2 "Kết luận lộ trình FT khi em thôi học" là nơi gọi `setStudentStatus`: mã thật `setOutcome` (`cycles.ts:301-352`) **không**
   đổi trạng thái em, chỉ đóng Case khi có cờ → không sửa; lưu trữ chỉ qua `setStudentStatus`.
3. Đặc tả §3 `deleted_at`: bảng `users` chưa có cột → migrate (Task 1).
4. Đặc tả §1 "biện pháp gắn cả em khác": `discipline_measures.student_id` + `checkViolationSet` → PA xử lý luôn của một em; ca "em khác"
   chỉ có ở dữ liệu lỗi (Q4).
5. Đặc tả §1 nêu "lịch sử điều chỉnh PA", "journey", "milestones": tên thật `case_intervention_revisions`, `journey_events`, `case_milestones`.
6. Đặc tả §3 "ChonNguoi, TeacherAssign, bộ lọc Người phụ trách": đều đã lọc `u.status='active'` (9 chỗ, Task 4) → không sửa mã.
7. `purgeAttachmentsOf` (`attachments.ts:239`) ghi audit mỗi tệp → không dùng cho xoá HV (Q17).
8. `Menu.tsx` (⋮ Hồ sơ HV) chưa có đường kẻ nhóm → thêm `keTruoc` (Task 3).
9. Đặc tả nói "68 cột": khớp `PRAGMA` (170 FK, 68 → `users`); `skill_move_requests.decide_by` là ngày, không phải người.

## Chuyển cho (ghi vào thân PR)

- **Planning:** xoá hẳn `tasks` chỉ gắn một HV đã xoá (hiện giữ, bỏ liên kết — Q3).
- **Planning:** thông báo `nhac_viec` có tên HV trong chữ (Q2) — cần `entity_type` khi tạo nếu muốn xoá theo.
- **Session deploy:** Task 8.

## Nhật ký

| Ngày | Task | Kết quả · số phép kiểm · khác kế hoạch |
|---|---|---|
| 24/09 | 0 | UX3 #98 merge (5fc80d6), `xoaKetThucLop.ts` có trên main. Kế hoạch đã có sẵn trên main (#100) — không phải chép. Dòng thật: `StudentDetailPage.tsx:234-235` (`<Menu label="⋮"`), `StudentManagePanel.tsx:41-52` (switch `viec`), `quanLyHocVien.ts:29-50`, `profile.ts:930` (`viewer`), `routes/index.ts:1742` (`/students/:id/status`), `:2019-2036` (`/admin/accounts`, kế hoạch ghi ~2046). Đồ thị trên `schema.sql` main: 62 bảng, 170 FK, bao đóng **29 bảng / 52 cạnh**, **68 cột** trỏ `users` — khớp bảng tham chiếu. Liên kết mềm không FK chỉ có `attachments.owner_*`, `notifications.entity_*`, `audit_logs.entity_*`. libsql nhận `@s` + `.get({ s: 1 })`. `notify` hiện dùng 6/9 `entity_type` (student, assessment_attempt, sos_case, case_signal, discipline_measure, skill_move_requests) — giữ đủ 9 cho chắc. Mốc **B = 1325** (+ 20 tốc độ). |
| 24/09 | 1 | 1332 (+7: L1–L7). Sửa kỳ vọng RB-9 (`luatMayChu.tests.ts`) như kế hoạch; `lenLop.tests.ts` xanh, không sửa. Thêm `students` vào `SEED_MAX` (run.ts) để L6 chỉ soi em của bộ demo. Seed: `finished_at` + `archived_at` gộp vào câu INSERT (bỏ UPDATE riêng). |
| 24/09 | 2 | 1345 (+13: X1–X13). Chạy ĐỎ trước với khung rỗng (X1/X2/X4–X13 đỏ, X3 fixture xanh) rồi mới viết mã. Khác kế hoạch: câu 12 thành `DELETE FROM case_interventions WHERE case_id IN (C) OR superseded_by IN (I)` — X2 đòi câu nhắc `superseded_by`, và theo luật bao đóng PA trỏ vào PA của em là thuộc em (dữ liệu thật luôn cùng Case). Câu đếm chạy **trong** `tx` (số liệu audit đúng lúc xoá). Tổng 39 câu (1 đọc em + 1 đếm + 36 + audit), xem trước 2. Thêm `students` vào `SEED_MAX` từ Task 1. |
