# PISA Progress — Pre-launch UX/UI audit (every page)

Auditor: senior UX/UI review · Date: 22/09/2026 · Demo "today" 14/09/2026 · Build: main @ 5fc8a88 (after PR #52 / PR-HV)
Method: I walked the live demo at localhost:5173 using the in-app browser (DOM text, accessibility tree, screenshots) at 1280×800 desktop and 375×812 mobile. Roles covered: Quản trị hệ thống (Đỗ Vũ Tuấn Phong), Quản lý Monbay (Nguyễn Khánh Vy), GVCN who also teaches L/R (Trần Ngọc Hà, i.e. the "both" case), and GVBM for Speaking across two branches (Phạm Thu Trang). Intent was checked against Design Plan §17–§22, plan.md §22.4–22.9 (PR-O/P/Q/R/S), TU_DIEN_VA_CHU.md and the v3 prototypes.
Note: screenshots in the pane were flaky (hidden pane), so most evidence below is DOM text quoted verbatim. Nothing in the repo was modified.

Legend for fix tags: **[O]/[P]/[Q]/[R]/[S] n** = matches an existing planned item; **[NEW]** = not in any plan.

---

## 0. The five problems that matter most

1. **Explanations for the developer are shown to users on almost every page.** Pages carry paragraphs such as "Ô dạng 12/5 nghĩa là…", "Bốn nhóm này chồng nhau…", "Một công việc có MỘT định danh…", "Lớp ghi ở đây là lớp TẠI LÚC ĐÁNH GIÁ…", "Không có cột 'tỷ lệ cải thiện'…", four paragraphs under the Normal score sheet, and a paragraph under Phân công GV. They make pages long, make the product feel unsure of itself, and they break TU_DIEN §4 and plan S8. This is the single cheapest large win.
2. **The same data is reached by several routes and appears under different names.**
   - The weekly table appears as Thực trạng › Theo tuần and again as `/tong-hop-tuan`.
   - The unit report appears as Tiến độ công việc › Tình hình đơn vị and again as `/tien-trinh` titled "Báo cáo tuần chi nhánh".
   - The case list appears as Thực trạng › Danh sách case and again as the Học viên views.
   - The class roster appears in the Học viên list and again in Hồ sơ lớp.
   - "Việc đã giao" appears at the bottom of every Thực trạng view and again in Tình hình đơn vị.
3. **Counts disagree between screens and badges contradict each other.** This destroys trust, and the owner will notice it first. See §C.4, for example:
   - 10 vs 9 students with open cases.
   - "6 case SOS" vs 10 open cases in the same class.
   - A list titled "11 case đang xử lý" that contains "Chưa xử lý" rows.
   - "Overall 6.0 · Chưa đạt kỳ vọng" when the expectation is 6.0.
4. **Nesting is too deep and there is no single place for Test.** Thực trạng has four stacked tab rows: Toàn cảnh/Thực trạng → Theo tuần/Theo lớp → Phân tích/Danh sách case/Ý thức → Vấn đề/Mức SOS/Theo kỹ năng/Tất cả, plus Fast Track/Normal and a period picker.
   - Score entry has no home: FT and Normal use two different sheet pages with different layouts and titles.
   - A class-level "Nhập điểm" task opens a single student's Mock page.
   - Lộ trình lớp is three clicks deep: ⋮ → Thông tin lớp → Lộ trình.
5. **Status is not visible at a glance.**
   - ⚠ is used for at least five meanings: overdue, missing profile data ("⚠2"), priority "Bình thường", old violation, and the Ý thức tab.
   - Raw ISO dates leak into the UI ("2026-10-18", "Hạn 2026-09-16", "mở từ 2026-09-19").
   - Mixed English appears ("Chưa có follow-up", "OVR", "Target", "Final Test").
   - Skill names appear in lowercase ("writing", "listening, reading").

---

## A. Page-by-page findings

### A1. Welcome / Đăng nhập / Giáo viên đăng ký / Vào nhanh bằng tài khoản demo

**Purpose and users.** Everyone, once per session. In production only Đăng nhập and Đăng ký exist.

**Top tasks and clicks.**
- Log in: 2 fields + 1 click.
- Demo login: 2 clicks (tab, then account card).

**Problems**
- The helper text under the form puts the admin password in plain sight ("…dovutuanphong95.pisa@gmail.com · mật khẩu pisa2026"). That is fine for the demo, but it must be gated by `LA_BAN_CHINH`. Check that the production build removes it.
- The demo tab says "Bốn nhóm: Quản trị hệ thống…, Admin chi nhánh…, Quản lý… và Giáo viên", but only three groups are listed; Admin chi nhánh has 0 accounts.
- Teacher cards all say only "Giáo viên". The owner cannot tell who is GVCN, GVBM or both, which is the main reason to switch accounts.
- The admin card repeats "Quản trị hệ thống" twice (title and chip).
- The page-level "Dữ liệu demo" badge plus the grey paragraph make three warnings about demo data on one screen.

**Fixes**
- Demo cards: show the role in teaching terms, e.g. "GVCN MB-FT 101 · dạy L, R" or "GVBM Speaking · 2 chi nhánh". Drop the empty group and the "Bốn nhóm" sentence. [NEW, demo-only]
- Production: make sure the password hint is removed. The copy "quên thì Quản trị hệ thống đặt lại hộ" is fine to keep. [NEW]

### A2. Global chrome (all pages)

**Problems**
- **Vertical space.**
  - Desktop: the demo bar and header take about 100px.
  - Mobile 375px: the demo bar is 69px and the header 99px, so **168px of 812 is chrome** before any content.
  - At narrow widths the demo bar wraps to two rows and clips "Đổi tài khoản de…".
- **Only three nav items**: "Tổng quan · Học viên · Tiến độ công việc" (the third is QL/Admin only). There is no Test area (O1/O2) and no Công việc area for teachers.
  - The App.tsx comment still says "HAI MỤC, KHÔNG HƠN" and "Tổng hợp tuần, báo cáo tuần… chuyển vào menu tài khoản". The account menu actually contains only "Hồ sơ cá nhân · (Quản trị hệ thống) · Thoát tài khoản demo", so `/tong-hop-tuan` and `/tien-trinh` are orphan routes.
- **Two searches on Học viên**: the header "Tìm học viên…" and the page "Tìm — Mã lớp hoặc tên / mã học viên".
- **Account button has no accessible name** (read as `button [ref_17]`). Page tabs have no `role=tab` or `aria-selected`.
- **Thông báo**
  - QL Nguyễn Khánh Vy: "Không có thông báo nào." even though a "Duyệt dời lịch" request is waiting for her.
  - GVCN Trần Ngọc Hà: **25** unread; GVBM: 20.
  - The list has no timestamps, no "Đánh dấu đã đọc tất cả", and raw ISO dates ("Hạn 2026-09-16").
  - Items from 2025 never expire ("Cần xác minh: Reading — Nguyễn Minh An · Hạn 2025-12-24").
  - One student escalating gives three separate items: "SOS 1 — Vũ Ngọc Lan", "SOS 2 — Vũ Ngọc Lan", "SOS 3 — Vũ Ngọc Lan".
  - Items say "Tín hiệu từ điểm, chưa phải case" while the teacher's work list button says "Mở case" for the same thing.

**Fixes**
- Production: remove the demo bar. Demo: collapse it to one 32px line with a single "Đổi tài khoản" button. [NEW]
- Mobile: make the header one 48px row with the logo, a search icon, the bell and an avatar. Nav becomes a 4-item bottom bar, or a single row under the header. [O, acceptance 375px]
- One search, in the header, with scopes: student name, student ID or class code. Remove the page-level search box (it should prefill the header). [Q1]
- Notifications: group by student and case (keep only the latest SOS level). Auto-expire when the source item is resolved. Add relative time ("2 ngày trước") and "Đánh dấu đã đọc". Use dd/mm/yyyy. QL must get notifications for requests addressed to them. [NEW]

### A3. Tổng quan — Quản lý / Admin ("Toàn cảnh")

**Purpose.** A branch manager's morning check: what is wrong in my branch and what is waiting for me.

**Top tasks and clicks.**
- Answer a reschedule request: 1 click ("Trả lời đề nghị").
- Find cases with no PA and add one: tile (1) → list (2, click student) → profile → expand the skill row (3) → "+ Thêm phương án" (4) → form → Lưu (5). **5 clicks and 2 page loads.**
- Check a branch's numbers: the table is already visible (0 clicks), but clicking the branch name leaves the page.

**What's there, top to bottom**
- Tabs "Toàn cảnh / Thực trạng".
- Four tiles, each with "Cách tính": "HỌC VIÊN CÓ CASE ĐANG MỞ 10", "CASE THIẾU PA HỌC THUẬT 4", "TÍN HIỆU CẦN XÁC MINH 1", "PA HỌC THUẬT CẦN CẬP NHẬT 6".
- A collapsed "Sự kiện nổi bật".
- An expanded "Việc cần lưu ý" branch table.
- "Việc cần làm 4 / 15 việc" with filter chips (Tất cả/Quá hạn/Đến hạn/Chờ duyệt + Mọi loại việc/Công việc được giao/Duyệt dời lịch do vắng).

**Problems**
- The QL has one branch, yet the branch table shows "Monbay 14 10 15 4 6 0" **and** "Tất cả chi nhánh 14 10 15 4 6 0", an identical duplicate row.
- The tiles' labels do not match §18.2 (D01): the plan has "Học viên dưới kỳ vọng" and "Chờ xác minh quá hạn". The dotted-underlined numbers look like hyperlinks but give no hint of where they go.
- "Việc cần lưu ý" (table) and "Việc cần làm" (list) sound like the same thing.
- The column "HV CẦN HỖ TRỢ" and the tile "HỌC VIÊN CÓ CASE ĐANG MỞ" hold the same number (10) under two labels.
- Admin sees 33 work items across all branches, and the Monbay reschedule request appears for **both** Admin and QL Monbay. It is unclear who is supposed to answer.
- Items of type "Công việc quản lý" (e.g. "Đổi phần mềm chấm Speaking … Tạm ngưng — quá hạn 3 ngày") mix with student work. A paused task is flagged "Quá hạn hoàn thành", so it nags forever.
- Chips use internal type names: "Công việc được giao", "Duyệt dời lịch do vắng".

**Fixes**
- Hide the "Tất cả chi nhánh" row when scope is 1 branch. Rename the table "Theo chi nhánh", let rows expand to classes, and write cells as "15 case mở · 4 chưa có PA". [P5]
- Tiles: use the plan's four labels. Each tile opens a right-side panel with the list and inline actions ("+ PA", "Xác minh"), so the manager stays on the page. [P1, P8 panels]
- Replace the full list with "Cần xử lý" (5–8 rows, sorted overdue → no owner → no PA → no result → upcoming) plus "Xem tất cả" to Công việc. Move "Công việc quản lý" out to the Công việc area. [P2, P4]
- A paused task ("Tạm ngưng") must not count as overdue. Show "xem lại 05/10" instead. [R3]
- Route approvals to exactly one owner (the branch QL). Admin sees them only in "Tất cả trong phạm vi". [NEW]

### A4. Tổng quan — Giáo viên (GVCN Trần Ngọc Hà; GVBM Phạm Thu Trang)

**Purpose.** "What must I do today?"

**Top tasks and clicks.**
- Enter scores for a class: the task "Lớp MB-FT 101 · MT3 · 2 học viên · Nhập điểm Speaking" (1) opens **one student's Mock page** (`/mock-test/13`, Lê Quang Huy), then "Nhập điểm cả lớp" (2) opens the sheet. That is **2 clicks plus a context switch**; it should be 1.
- Mark a PA done: 1 click ("Đánh dấu đã làm"), done in place. Good.
- Verify an SOS signal: "Mở case" (1) opens a drawer.

**What's there.** "Sự kiện nổi bật" (collapsed), two dashed alert lines ("Lớp MB-FT 101 — 1 học viên có vi phạm chưa xử lý quá 5 ngày", "…2 lượt Phối hợp SOS cần xử lý"), and "Việc cần làm 8 / 11 việc" with 7–8 chips (Tất cả 8, Quá hạn 3, Đến hạn 1, Chờ duyệt 0, Mọi loại việc, Nhập điểm Test 3, Làm PA học thuật đã hẹn 2, Xác định nguyên nhân 2, Cập nhật kết quả 1).

**Problems**
- **Mobile**: the chips wrap onto **5 rows**, so the first task appears roughly 690px down on a 812px screen.
- A Normal-class task is labelled "Dương Ngọc Ánh · MB-FOU 12 · **MT1**". Normal classes have no Mock Test; this should say "Giữa khoá". The same mislabel appears in the Thực trạng "Nguồn" column ("Điểm · MT1" for MB-FOU 12).
- "Xác minh SOS" task → button "**Mở case**". A signal is not a case (TU_DIEN §1).
- Deadline mismatch: the work list shows the MB-FT 101 L/R entry as "Hạn 16/09/2026", while the sheet shows "Hạn nhập điểm 23/09" on every row.
- There is no "Học viên cần hỗ trợ" block (§18.2 GV view), no week context, and no quick link to "my classes".
- "Chờ duyệt 0" chip is visible even though teachers never approve anything.

**Fixes**
- Class-level score task → deep link `/nhap-diem/:classId?attempt=…&skill=S`, which opens the sheet already filtered to the teacher's skill. [R7, R8]
- Chips: keep 4 quick filters (Tất cả/Quá hạn/Hôm nay/Tuần này). Put the type filter into one dropdown "Loại việc". Hide chips with a count of 0 for roles that can't act on them. [R2]
- Add a second block, "Học viên của tôi cần hỗ trợ" (max 5, SOS level + next step). [P6]
- Fix the "MT1" label on Normal and the "Mở case" label on signals. Show one deadline, and keep it the same between the work list and the sheet. [S9, S10]

### A5. Tổng quan › Thực trạng (QL) — also reachable standalone at `/hoc-thuat`

**Purpose.** Analytics: where students are weak, how well support works, and discipline.

**Top tasks and clicks.**
- See which skill problem is biggest: 1 (Thực trạng) + 1 (Theo lớp) + 1 (Phân tích vấn đề) + 1 (pick FT/Normal) = **4 clicks**.
- Find overdue cases: 2–3 clicks, then a 21-row table with no pagination or grouping.

**Problems**
- **Four stacked tab rows.**
  1. Toàn cảnh / Thực trạng.
  2. Theo tuần / Theo lớp.
  3. Phân tích vấn đề / Danh sách case / Ý thức & Phối hợp. These are rendered as small chips, a third different style.
  4. Inside the table: Vấn đề / Mức SOS / Theo kỹ năng / Tất cả, plus Fast Track / Normal, plus "Khoảng báo cáo hiệu quả".
- "Tổng hợp theo lớp" stays pinned above **every** sub-view, including Ý thức & Phối hợp, where it is irrelevant.
- The "Tuần giao việc ‹ 14/09 – 20/09 › Tuần này + Giao việc" picker sits in an analytics page. The "Việc đã giao (0) — Chưa giao việc nào trong tuần này" footer repeats on every view.
- Explanation paragraphs:
  - "Ô dạng 12/5 nghĩa là…Môn W của lớp Normal có cột riêng, KHÔNG gộp vào W2…"
  - "Hiện trạng vấn đề là hiện tại. Hai cột kết quả…"
  - "Mỗi học viên có nhiều nhất một case cho mỗi hạng mục…"
  - Three paragraphs under Theo tuần.
- Numbers disagree with Toàn cảnh: 9 HV / 14 case / 3 thiếu PA here vs 10 / 15 / 4 on Toàn cảnh.
- **Danh sách case** (21 rows)
  - Priority "⚠ Bình thường" puts a warning icon on the *normal* level.
  - Skill "writing" appears in lowercase.
  - Normal-class cases show "Điểm · MT1".
  - "chưa rõ nguyên nhân" appears as a cause.
  - Filter "Loại lớp: Tất cả / Normal · 5 / Fast Track · 16".
  - The three status tiles above the table (CHƯA CÓ PA 4 / ĐANG XỬ LÝ 11 / ĐÃ XONG 6) are not clickable filters.
- **Ý thức & Phối hợp view**
  - **17 metric tiles**, each with its own "Cách tính". The label "PHƯƠNG ÁN XỬ LÝ THEO LOẠI" repeats 9 times, and zero tiles print "Không có mục nào".
  - It uses internal abbreviations "CX / GĐCN meeting với HS / PH", "GV trao đổi ngắn với HS".
  - Meta sentences: "Chín loại tách riêng, ba thư cảnh cáo (lần 1/2/3) không gộp thành một." and "Không có cột 'tỷ lệ cải thiện'…".
- **Theo tuần**
  - 12 columns, including "LƯỢT TEST/MT", "TẠM THỜI" and "CHƯA ĐỦ ĐIỂM".
  - The cell links go to generic `/hoc-vien?view=sos` and lose the week, so clicking "SOS 1 = 3" in W3 AUG shows all SOS, not that week's.
- Analytics tables on mobile are wide, and there is no chart anywhere.

**Fixes (align with P7–P12)**
- Rename to **Phân tích**, give it its own URL, and use ONE view bar: **Vấn đề học viên | Kết quả hỗ trợ | Theo tuần | Ý thức**. FT/Normal and skill become filter dropdowns in one filter row. [P7, O3]
- Remove "Việc đã giao" and the Giao việc week picker from analytics. [P11]
- Remove the pinned "Tổng hợp theo lớp". Put that table inside "Vấn đề học viên" as the default matrix (issue × class), where each cell opens a right panel "{n} học viên — {vấn đề}". [P8]
- Ý thức: replace the 17 tiles with 4 KPI tiles (Vi phạm / Chưa xử lý / Học viên có vi phạm / Cần xử lý) and one horizontal bar list of the 9 measures in order nhẹ → nặng, showing counts. Spell out CX/GĐCN/HS/PH. [NEW; TU_DIEN §6]
- Danh sách case: make the three status tiles the filter. Group rows by student (the v3 expandable-row pattern). Priority "Bình thường" gets no icon; only "Gấp" is red. Capitalise skills. [S3, NEW]
- Move every explanatory paragraph into the existing "Cách tính / Cách đọc" popover. [S8]
- Theo tuần cells must carry the week in the link (`&week=`). [NEW]

### A6. Tiến độ công việc (QL/Admin) — tabs "Công việc" / "Tình hình đơn vị"; duplicate routes `/tien-trinh`, `/tong-hop-tuan`

**Purpose.** Management tasks (Công việc) plus the weekly unit report (Tình hình đơn vị).

**Top tasks and clicks.**
- Update a task: 1 click in Tổng quan ("Cập nhật tiến độ"), or open this page and click the row.
- Submit the weekly report: Tiến độ công việc → Tình hình đơn vị → expand a unit (▼) → set statuses. 3+ clicks.

**Problems**
- **Công việc tab**
  - The counters "1 đang thực hiện · 1 quá hạn · 0 đến hạn trong ba ngày · 1 tạm ngưng" come with a disclaimer ("Bốn nhóm này chồng nhau…không cộng thành 4 việc").
  - Two chip rows: groups "Học sinh / Phụ huynh 0 · Giáo trình 0 · Giáo viên 2 · Tutor 2", then statuses "Chưa bắt đầu 1 · Tiếp tục xử lý 1 · Đã hoàn thành 1 · Tạm ngưng 1 · Dừng hẳn 0".
  - The last-update note prints twice in one row (under Trạng thái and under Cập nhật gần nhất).
  - Footer: "Một công việc có MỘT định danh xuyên nhiều tuần…".
  - "Học sinh / Phụ huynh" conflicts with the product-wide term "học viên".
- **Tình hình đơn vị**
  - Repeats "Việc đã giao (3)" (the same 3 tasks as the Công việc tab), now with IDs "CV-0008".
  - Shows **ISO date** "Báo cáo tuần mở từ 2026-09-19".
  - Status sentence "Chưa/không còn cập nhật được báo cáo tuần này" uses a slash.
  - "Việc đang tồn" (14 case SOS… / 17 bài MT còn thiếu điểm / 1 học viên chưa có tuần MT tiếp theo) is useful, but its paragraph is too long.
- `/tien-trinh` shows the same content under a different title, "Báo cáo tuần chi nhánh". `/tong-hop-tuan` is identical to Thực trạng › Theo tuần and repeats its title twice ("Tổng hợp theo tuần" H1 + card title).
- "Tổng hợp theo tuần" button inside the report links to an orphan page.
- "Việc đang tồn: 17 bài MT còn thiếu điểm" disagrees with the class badges (9+28+1 = 38 "bài chưa nhập điểm") and with the view "Cần nhập điểm Test → 38 bài cần chấm".

**Fixes**
- One **Công việc** area with three tabs: **Hỗ trợ học viên | Vận hành | Báo cáo đơn vị**. Retire `/tien-trinh` and `/tong-hop-tuan` as redirects. [R1, O5]
- Vận hành: 4 quick filters (Tất cả/Quá hạn/Đến hạn/Tạm ngưng) plus a "Nhóm" dropdown. Use the 5-column table. Print the last note once. [R2, R3]
- Báo cáo đơn vị: week → "4/6 đơn vị đã báo cáo" → unit matrix → decisions needed. Use "Lưu nháp" / "Nộp báo cáo" and the statuses "Nháp / Đã nộp / Chưa báo cáo". Show dd/mm/yyyy. [R4, R5]
- Define "bài chưa nhập điểm" once (per skill-score or per attempt) and use it everywhere. [S9]

### A7. Học viên (list) — views: Theo lớp · SOS · Case đang xử lý · Case thiếu PA học thuật · Case quá hạn cập nhật · Cần nhập điểm Test · Chưa có tuần MT

**Purpose.** Find a student or class and see who needs attention.

**Top tasks and clicks.**
- Open a student: header search, 1–2 clicks. Via the list: expand the class ▸ (1) → name (2).
- Open a class: 1 click (class code).
- Schedule next MTs: "Kế hoạch Test" (1) → pick student and MT → save (3+).

**Problems**
- **Toolbar overload.** 8 view chips + a "Tôi / Tất cả trong phạm vi" toggle (styled as plain text) + 3 actions ("Kế hoạch Test", "Tạo lớp", "Thêm học viên"). The row wraps at 1280px ("Thêm học viên" drops to line 2).
  - When a view other than Theo lớp is active, the Tôi/Tất cả toggle and "Tạo lớp/Thêm học viên" vanish, so the toolbar jumps around.
- The class row line "Monbay · **FOU** · tuần 8/8 · Final Test tuần này · 4 **HV**" uses jargon (FOU, LT1, HV). "Final Test tuần này" appears twice (subtitle and badge).
- **"2 case SOS" / "6 case SOS"** badges count *SOS students*, while the roster shows 10 open cases for MB-FT 101 and the class page says "6 case chưa xong". [Q2]
- Roster (expanded class)
  - "OVR", "Target", "Mốc"; "MT3 1/4" (meaning 1 of 4 skills scored) is unlabeled.
  - "Dự kiến thi" mixes "FEB 2027" and "W2 FEB 2027".
  - "⚠2" next to a name actually means "2 profile fields missing: Tháng/năm dự kiến thi · Điểm đầu vào". It is tooltip-only and indistinguishable from the overdue icon.
  - "1 case bàn giao" is jargon. The "▶ Đang theo dõi" pill looks like a button but isn't.
- **SOS view**
  - Title "10 lượt đang ở mức SOS".
  - Contradictory rows: "Đỗ Minh Khôi … SOS 2 · Chưa xử lý · Đã hỗ trợ · 14/09".
  - English: "Chưa có follow-up".
  - Nguyễn Minh An is listed under the *old* class MB-BE 08 from April.
- **Case đang xử lý view**
  - Titled "11 case đang xử lý", yet 3 rows show "Chưa xử lý".
  - "Hạn xem lại" shows raw "2026-10-18", "2026-09-14", or an empty cell.
  - "Chỉ theo dõi, không hẹn" repeats down the column.
- **Case thiếu PA view**: "Vũ Thu Uyên … ▶ Đang xử lý" appears in a list of cases with *no* PA. There is no inline "+ PA" button, so the user must open the profile.
- **Cần nhập điểm Test (QL)**
  - "38 bài cần chấm". Each row repeats "listening: Trần Ngọc Hà · reading: Trần Ngọc Hà — bạn không phụ trách bài này, nhập sẽ được ghi là sửa hộ".
  - Skills are in lowercase.
  - "Nợ từ tuần W3 SEP 2026" sits next to "Tuần W1 OCT 2026", which is confusing.
  - The label suggests the QL can enter scores, but the class sheet says "Bạn được nhập: không kỹ năng nào".
- **Chưa có tuần MT**: shows **no list**, only a paragraph ("Đây là việc của Quản lý…") and a button. The one student (Chu Minh Hiếu) is visible only after opening Kế hoạch Test.
- **Case quá hạn cập nhật**: empty state "Đổi bộ lọc hoặc bỏ từ khoá tìm để xem tiếp." is wrong advice when there are simply no overdue cases.

**Fixes**
- Page title "Học viên & Lớp". One header search. A branch dropdown (multi-branch roles only). [O4, Q1]
- Replace the 8 chips with a **"Cần chú ý" dropdown** (SOS / Case chưa có PA / Case quá hạn / Chưa nhập điểm / Chưa có lịch MT) and a scope toggle styled as a segmented control. Actions go into one primary "+ Thêm" menu (Học viên / Lớp) plus "Kế hoạch Test" (which moves to the Test area). [Q1, R9]
- Class row: at most 3 facts, e.g. "MB-FOU 12 · Foundation · Tuần 8/8 · 4 học viên" + 2 badges ("Còn 9 bài chưa nhập điểm", "4 em SOS"). Collapsed by default; search auto-expands. [Q1–Q3]
- Roster column set (desktop): Học viên (+ status badge) · Mục tiêu · Lần test gần nhất (MT2 · 4/4) · L R W S (latest only; previous as a small grey number) · Việc tiếp theo. Replace "⚠2" with a small grey text chip "Thiếu 2 thông tin". Standardise dates to "Tháng 2/2027" or "W2 · 02/2027". [NEW]
- Every list view gets one inline primary action per row ("+ PA", "Xác minh", "Nhập điểm", "Xếp lịch"), and the drawer opens in place. [NEW, "do it in place"]
- Fix the contradictions: filter "đang xử lý" = has PA and not closed. Remove "Chỉ theo dõi, không hẹn" (show "—"). Show dd/mm/yyyy. [S7, NEW]
- "Chưa có tuần MT" must list the students with a checkbox and a "Xếp lịch" bulk action. [R9]

### A8. Kế hoạch Test (drawer from Học viên)

**Purpose.** A QL sets the next MT week for many FT students.

**Clicks.** Open (1) → select week (1–2) → tick skills (0–4) → choose student + MT chip (2) → save (1). About 5–7 clicks.

**Problems**
- The order is week → skills → students. §18.8/R9 wants students → attempt/current schedule → new schedule → review → save.
- One week for all skills. There is no separate RLW / S week, even though the product elsewhere schedules per skill ("W1 · đợt này thi 2 tuần").
- "Chỉ em chưa có: — không lọc — / Chưa có MT1 … Chưa có MT7" (7 options) and 7 MT chips per row, though "đa số em chỉ thi ba lượt".
- A long rules paragraph at the bottom ("Ô xám đậm là lượt đã làm xong…").
- The save button reads "Chưa chọn em nào" while disabled. Good. Normal classes are absent with no explanation. [R12]

**Fixes.** Rebuild per R9/R10:
1. Class/student pick (defaults to "chưa có lịch").
2. Show MT1–MT3 only, plus "Thêm lượt dự phòng".
3. Two week pickers (L/R/W and S).
4. An "old → new" diff.
5. Save.

Move it into the Test area. [R9, R10, R12]

### A9. Hồ sơ lớp (`/hoc-vien/lop/:id`) — FT (MB-FT 101) and Normal (MB-FOU 12)

**Purpose.** A GVCN or QL manages one class: roster, discipline, analysis, teachers, schedule.

**Top tasks and clicks.**
- Enter scores: 1 ("Nhập điểm test").
- Record a violation: scroll + 1 ("+ Ghi nhận vi phạm").
- Open Lộ trình lớp: **3** (⋮ → Thông tin lớp → Lộ trình), with drawers stacked twice.
- Transfer class (Normal): 2 (⋮ → Chuyển tiếp lên lớp sau).
- Change teachers: 1 ("Sửa phân công"). It is also reachable via ⋮ → Thông tin lớp → Phân công giáo viên, a duplicate path.

**What's there.** One long page (2,370px on mobile), in this order: header actions ("Nhập điểm test", "+ Case", "Thêm học viên", "⋮") → badges ("Lớp còn 28 bài chưa nhập điểm", "6 case chưa xong") → "Phân tích vấn đề của lớp" (collapsed) → Học viên roster → Ý thức & Phối hợp → Phân công giáo viên.

**Problems**
- No tabs. Q4 and the v3 prototype specify **Học viên | Ý thức & Phối hợp | Phân tích lớp | Giáo viên**, with Lộ trình as a header button.
- The roster is an exact duplicate of the one in the Học viên list, with the same issues ("⚠2", OVR, MT3 1/4, mixed exam-date formats).
- The badge "Lớp còn 28 bài chưa nhập điểm" links to `/hoc-vien?view=my_scores…` (leaves the class). R8 wants it to open the grading grid. "6 case chưa xong" goes to a list titled "11 case đang xử lý".
- "Nhập điểm test" as a QL leads to a read-only sheet ("Bạn được nhập: không kỹ năng nào"). The primary button should not be primary for someone who cannot enter scores.
- Phân tích lớp uses skill sub-tabs "L R W1 W2 S" (abbreviations; the rest of the page spells skills out) and has an 80-word disclaimer ("Năm cột số là năm đơn vị khác nhau…Cách đếm ở đây dùng chung một bộ với trang Thực trạng…").
- Ý thức block: "4 vi phạm" for Nguyễn Minh An, while the profile shows 7 (4 = unresolved, but the label doesn't say so). "Theo học sinh" says học sinh while the rest of the product says học viên.
- Phân công block ends with rules text ("Mỗi kỹ năng đúng một giáo viên…GVCN phải dạy ít nhất một kỹ năng…").
- **Lộ trình dialog (FT)**
  - The only field is "Tuần khai giảng". It prints "Tuần này là tuần học thứ 1 của lớp" while today is study week 16: the sentence describes the *selected* week but starts with "Tuần này".
  - It tells users to press "**Kế hoạch học**" in the student profile. That button does not exist (it is called "Lộ trình").
- ⋮ drawer has one item ("Thông tin lớp") plus a paragraph for FT. It is an empty intermediate screen (§22.2 says remove).
- **Normal class**
  - Header says "Final Test tuần này", while the Normal sheet shows "Bài kiểm tra cuối khoá · W1 OCT 2026" and L/R deadline 20/09. Three names for one thing ("Final Test", "Bài kiểm tra cuối khoá", "Cuối khoá") and two different weeks.
  - Roster shows "Bùi Khánh Linh · SOS 2 · tạm thời", but the sheet shows her "Chưa đủ điểm để kết luận".
  - "Chuyển tiếp lên lớp sau" lets you move the class before the Final Test is scored (9 bài missing) with no warning.

**Fixes**
- Adopt the v3 layout.
  - Hero: "MB-FT 101 · Fast Track", "GVCN Trần Ngọc Hà · 8 học viên · Tuần học 16", the next milestone, and header buttons "Nhập điểm" (only if allowed), "Lộ trình", "⋮ (Chuyển tiếp lớp · Thêm học viên)".
  - Four tabs as in Q4, defaulting to Học viên. [Q4, §22.2]
- Delete "Thông tin lớp". ⋮ opens Lộ trình / Phân công / Chuyển tiếp directly. [§22.2, Q4]
- Badges deep-link inside the class (Học viên tab filtered, or the sheet). [R8]
- Lộ trình copy: "W1 JUN 2026 là tuần học thứ 1 · Hôm nay: tuần 16". Fix the "Kế hoạch học" reference. [S10]
- Chuyển tiếp: warn "Còn 9 bài cuối khoá chưa nhập điểm — chuyển bây giờ thì kết quả cuối khoá sẽ thiếu." [NEW]
- One name for Normal milestones: "Giữa khoá / Cuối khoá" (§19.1). "Final Test" only if the owner insists, and then everywhere. [S10]

### A10. Hồ sơ học viên (`/hoc-vien/:id`) — tabs Học thuật · Ý thức & Phối hợp · Hành trình

**Purpose.** Everything about one student; the place where PAs and violations are handled.

**Top tasks and clicks.**
- Add a PA to an open case: expand the skill row (1) → "+ Thêm phương án" (2) → form → Lưu (3). Good.
- Record a result: expand (1) → "Ghi kết quả" (2) → save (3).
- Add a case: "+ Case" (1) → form (5 required fields) → "Ghi nhận" (2).
- Change target or exam date: ⋮ (1) → Lộ trình (2) → edit → Lưu (3).
- Record a violation: tab (1) → "+ Ghi nhận vi phạm" (2) → form → save (3).

**Problems**
- **Header actions differ between students**: Nguyễn Minh An shows "Lộ trình · + Case · ⋮", Lê Quang Huy only "+ Case · ⋮". This is unpredictable.
- **Tiles are static** (R8).
  - "Kết quả Test gần nhất: MT2 · W3 AUG 2026 · ● Đã đủ điểm · SOS 1" (a green-ish dot next to SOS). MT3 is scheduled this week, but the tile doesn't say so.
  - "Kỹ năng cần hỗ trợ 1 Listening" while "Case đang mở 3" (Listening, W2, Speaking). For Nguyễn Minh An: "Đạt kỳ vọng" + "Kỹ năng cần hỗ trợ 1 Writing Task 1" + next task "Làm PA Reading · quá hạn 10/05/2026" (from the previous programme).
  - "Làm PA Listening" is vague; the tile should say the action ("Ghi kết quả: Thêm một buổi tutor Listening").
- **Skill rows**
  - "5.0 → 5.5 · 5.5 thiếu 0.5 · MT2 · kỳ vọng 6.0 · Tăng 0.5 so với MT1" prints the same score 3 times.
  - The red "Cập nhật PA · 30/08/2026" does not say it is overdue.
  - W1 for Nguyễn Minh An shows "◷ Đang theo dõi" with "Không có case đang mở".
- **Expanded case card**
  - Title "Listening · Listening mất điểm ở Section 3" repeats the skill.
  - "Đang xử lý" appears twice.
  - Overdue appears 3 times ("PA tiếp: hạn 30/08/2026 · quá hạn", "⚠ Thực hiện xong · hạn 30/08 · quá hạn 15 ngày", plus the tile).
  - "Thực hiện xong · hạn" is an unclear label.
  - Dates mix "30/08" and "30/08/2026".
  - "Hoàn thành case" looks enabled while the text below says "Chưa hoàn thành: …".
- **Mock Test table** on the Học thuật tab uses "W" (single), while the roster uses W1/W2. It says "OVERALL", while the roster says "OVR". Plus a footer: "Lớp ghi ở đây là lớp TẠI LÚC ĐÁNH GIÁ…".
- **Ý thức & Phối hợp tab**
  - A good match to v3 (sub-tabs, counts, category chips, time chips, timeline rows).
  - Violation rows only offer "Sửa". There is no "Tạo phương án xử lý" from a selected violation, so the user must know the flow.
  - The ⚠ on the tab label is unexplained.
- **Hành trình**
  - Only one skill lane (Reading) is shown, with no skill picker ("Toàn bộ / một kỹ năng / Ý thức").
  - "Các mốc đã qua" should be "Mốc học tập" (Q9).
  - It needs a click on "Hiện 1 case đã hoàn thành" and carries a long causality disclaimer.
- **+ Case form**
  - Every field has a 1–2 line hint.
  - The footer: "Ghi nhận này KHÔNG tạo ra một bài đánh giá và cũng không có mức SOS…".
  - No "Nguyên nhân" field, even though the case list shows a cause column.
- **PA form**
  - The hint refers to a status "**Đã lên kế hoạch**" that is not among the two options ("Đang theo dõi / Đã xong").
  - "Người thực hiện" says "Bỏ trống nếu chính bạn làm". The PeoplePicker is not yet used (§22.5).
- **⋮ drawer**: 4 items (Thông tin học viên, Lộ trình, Chuyển lớp, Kết luận lộ trình). Fine.
- **Lộ trình dialog**: "Tuần này là TUẦN HỌC THỨ 1 của em" has the same bug as the class version, plus a note ("Hệ thống chỉ đề xuất ba lượt đầu…").
- **Mobile**: the 4 tiles become a horizontal strip with the second tile cut off; the subtitle "MB-FT 101 · Fast Track · GVCN Trần N…" is clipped.

**Fixes**
- Header always shows the same buttons: "+ Case", "Lộ trình", "⋮". [NEW]
- Tiles clickable (scroll to or open the relevant card or test), with plain labels:
  - "MT3 đang diễn ra · 0/4 kỹ năng", or "MT2: SOS 1 (Listening)".
  - "3 case đang mở · 1 chưa có PA".
  - "Việc tiếp theo: Ghi kết quả PA Listening — quá hạn 15 ngày".

  Use a red badge only for SOS. [Q7 follow-up, R8]
- Skill row: "Listening 5.5 (↑0.5) · kỳ vọng 6.0 · thiếu 0.5". Show once, in one line. [NEW]
- Case card: the title is the case name only. Status appears once. Overdue appears once, as a red chip in "Việc tiếp theo". "Hoàn thành case" is visibly disabled, with a tooltip or line explaining why. [Q8 follow-up]
- Ý thức: selecting violations enables "Tạo phương án xử lý (n vi phạm)" (v3 "Tạo Biện pháp"). [NEW, v3]
- Hành trình: add a skill/Ý thức selector, default 8 weeks, and rename the heading. [Q9]
- Fix the PA form reference, add the PeoplePicker, and add "Nguyên nhân" to +Case (optional). [Q6, §22.4–22.5]

### A11. Case drawer / page (`/hoc-thuat/case/:id`, drawer "Vấn đề - Case")

**Problems**
- The drawer title "Vấn đề - Case" is a hyphenated bilingual label.
- "Chưa có phương án hỗ trợ" appears **3 times** (heading, subtext, empty state).
- "Hoàn thành case" plus 2 lines explaining why it can't be done.
- The PA form opens as a second layer on top of the drawer (stacked panels; §18.1 says panels never stack).

**Fixes.**
- Title the drawer with the case name and make student · skill the subtitle.
- Show one empty state with one button, "+ Thêm phương án".
- Open the PA form *inline* inside the drawer (like the v3 "Xác nhận" rows).

[§18.1, S7]

### A12. Mock Test detail (`/mock-test/:id`)

**Purpose.** One student's single test attempt: scores and schedule per skill.

**Problems**
- "Overall 6.0 · **Chưa đạt kỳ vọng**" while "Kỳ vọng 6.0". Either the rule is "any skill below means not met" (then say "1 kỹ năng dưới kỳ vọng") or it is a bug.
- Criterion scores are unlabeled: "Band 6.0 · 6 · 5.5 · 6 · 6.5". The entry form uses FC/LR/GRA/P, but the display drops the labels.
- Each row has two ambiguous actions, "Chỉ xem" and "Thêm ▾".
- The collapsed "Thông tin đợt Mock Test" sits above "Điểm và lịch kiểm tra"; a one-row header would do.
- As the entry point for a class task (A4), this page is the wrong destination.
- Good: "Nhập - nếu học viên không làm bài" hint (§22.1), inline entry, "Lịch sử thay đổi" collapsed.

**Fixes.**
- Label the criteria ("FC 6 · LR 5.5 · GRA 6 · P 6.5").
- Replace "Chỉ xem / Thêm ▾" with a single "⋯" menu (Đổi lịch, Đánh dấu không dự thi, Sửa điểm if allowed).
- Clarify the Overall verdict.

[§22.1, NEW]

### A13. Nhập điểm FT (`/nhap-diem/:classId`) and Bảng điểm Normal (`/bang-diem-thuong/:classId`)

**Purpose.** Teachers enter scores for their skill, fast, often on a phone.

**Top task and clicks.**
- From the class page: 1 click + typing.
- From Tổng quan: 2 clicks (via the Mock page).

**Problems**
- **Two different pages for one task.**

  | | FT | Normal |
  |---|---|---|
  | Title | "Nhập điểm · MB-FT 101" | "Bảng điểm MB-FOU 12" |
  | Back link | "← Danh sách lớp" (goes to the list, not the class) | "← Quay lại" |
  | Scoping | week picker | "Bài: Tất cả / giữa khoá / cuối khoá" filter plus "Tạo bài kiểm tra theo chương trình" |

- **FT sheet** shows only students with an attempt in the selected week: 5 of 8. The class badge says "28 bài chưa nhập điểm", but the sheet does not show where those 28 are.
- QL view: "Bạn được nhập: không kỹ năng nào", yet the W1/W2/S cells render as input boxes (false affordance).
- "Hạn nhập điểm 23/09" repeated on every row. "Chờ 2 kỹ năng" is blue-highlighted for no clear reason.
- A 90-word keyboard/rules paragraph sits under the table.
- **Normal sheet** has **four** rule paragraphs (70% rule, rounding, missing ≠ fail, per-skill deadlines). Each cell stacks score, arrow, %, verdict and deadline ("27/40 ↓ 67.5% · Chưa đạt").
- **Mobile**: the tables are 1,150px (FT) and 1,026px (Normal) wide. The name column is sticky but wraps to 3 lines ("Lê / Quang / Huy"). MT, Trạng thái and Hạn nhập take the first 300px, so **the score inputs are off-screen**.

**Fixes**
- One **Test** area route, `/test/:classId?attempt=&skill=`, with one component for both programmes. The header is the same ("Nhập điểm · MB-FT 101 · Mock Test 3" / "… · Cuối khoá"). Keep a week picker for FT and a milestone picker for Normal in the same slot. [O2, R7, R8]
- Default filter "Việc của tôi": only the skills I'm assigned, and only students still missing a score. Toggle "Cả lớp". [NEW]
- Mobile layout: one card per student with only *my* skill inputs (e.g. "Speaking: FC LR GRA P"). Move Trạng thái/Hạn into a single chip above the list ("Hạn 23/09 · còn 9 bài"). [R13, NEW]
- Read-only users see plain text, not input boxes. [NEW]
- Move the rules into "Cách nhập" (a popover) and keep the one line "Nhập - nếu học viên không làm bài". [S8]

### A14. Admin — Quản trị hệ thống (`/quan-tri`)

**Tabs.** Tài khoản · Lộ trình và loại lớp · Quyền và nhật ký.

**Problems**
- **Tài khoản**
  - The "Chờ duyệt — Không có đăng ký nào đang chờ" empty block sits permanently above the accounts table.
  - The table has two all-"—" columns ("QUYỀN CẤP RIÊNG", "KỸ NĂNG"), no search or role filter, and 16 rows sorted by first name.
- **Lộ trình và loại lớp**: the "gốc" chip concatenates into "BEgốc", "FTgốc". Long notes.
- **Quyền và nhật ký** mixes four unrelated things: system counts ("HỌC VIÊN 44 · LỚP 13 · LƯỢT MOCK 118 · CASE SOS 39"), the permission matrix, "Đơn vị báo cáo", and the audit log.
  - The matrix shows code keys next to labels ("Chốt tuần MT plan.week", "Xem tiến trình công việc meeting.view") and includes the stale "Cập nhật Đánh giá GV estimate.edit".
  - Footer uses the word "grant".
  - The audit log shows raw codes ("sos_coordination.confirm · talk_family"), and its timestamps (22/09) are later than the demo "today" (14/09).
- Admin is reachable only from the account menu, which is OK for a rare task.

**Fixes.**
- Tabs become **Tài khoản · Danh mục (Lộ trình, Loại lớp, Đơn vị báo cáo) · Quyền · Nhật ký**.
- Show "Chờ duyệt" only when the count is above 0, as a badge on the tab.
- Hide empty columns. Add a search box and a role/branch filter.
- Show code keys only in a tooltip.
- Map audit codes to Vietnamese sentences ("Trần Ngọc Hà xác nhận: Trao đổi với gia đình").

[NEW]

### A15. Hồ sơ cá nhân (`/ho-so-ca-nhan`)

**Problems**
- The skills list shows "Writing" in addition to "Writing Task 1 / Writing Task 2" (a duplicate concept).
- The Admin is told "Đổi email đăng nhập…việc đó của Quản trị hệ thống" (he is the admin).
- The text "Nhãn màu vàng là quyền cấp riêng" appears when no yellow label exists.

**Fix.** Show only the skills that apply to the programmes (FT: 5; Normal: L/R/W/S) and hide irrelevant hints. [NEW, low]

---

## B. Cross-cutting

### B1. Navigation / IA — against the planned 4 areas (D01: Tổng quan / Học viên & Lớp / Test / Công việc)

**Current vs planned**

| Planned area | Today | Gap |
|---|---|---|
| Tổng quan (+ Phân tích tab) | "Tổng quan" with "Toàn cảnh/Thực trạng" (QL); `/hoc-thuat` duplicates Thực trạng with no nav highlight | Rename to Tổng quan / Phân tích with own URL; retire `/hoc-thuat` as redirect (O3, O5) |
| Học viên & Lớp | "Học viên" | Rename; single search; class tabs (O4, Q1, Q4) |
| Test | **missing**; Kế hoạch Test lives in Học viên; sheets are orphan routes reached from class page or Mock page | Create (O2, R7–R10). This is the biggest IA gap for teachers, whose #1 weekly task is entering scores |
| Công việc | "Tiến độ công việc" for QL/Admin only; teachers have no Công việc area (their list is only in Tổng quan); `/tien-trinh`, `/tong-hop-tuan` orphaned | One area, 3 tabs, visible to everyone by capability (R1). Teachers get "Hỗ trợ học viên" |

**Assessment.** The 4-area model is right, and it fixes most of the "same data in three places" problem. Two cautions:
1. Keep Tổng quan as *previews with links* (§17.1). Today it holds full queues, which is why Công việc feels redundant.
2. Every area must have exactly one row of tabs (§18.1). Today Thực trạng has four rows.

On mobile, use a bottom bar with the 4 area icons and labels.

### B2. Consistency inventory (what to standardise)

- **Tab styles.** At least four are in use: pill tabs (Toàn cảnh/Thực trạng), plain text toggles (Theo tuần/Theo lớp, Tôi/Tất cả), small chip tabs (Phân tích vấn đề/Danh sách case), and `btn-sm` segmented buttons (Cả hai/Normal/Fast Track). Use v3: **underline tabs (3px blue bar)** for page sections, a **segmented control** for mutually exclusive filters, and **pill chips** only for multi-select filters.
- **Primary buttons.** Several pages have 2–3 visually strong buttons (class header: "Nhập điểm test" primary and "Thêm học viên" also prominent). Rule: one primary per area (§18.1).
- **Badges.**
  - The ⚠ glyph must mean *overdue/at risk* only.
  - Priority: "Gấp" is a red badge; "Bình thường" gets no badge.
  - SOS 1/2/3: yellow / orange / red.
  - "Đạt kỳ vọng": green only when it really is met (not "Tăng 0.5" while below).
  - "Tạm thời": outlined.
  - Missing data: grey text chip.
  - Status pills with ▶ ◷ ✓ · glyphs look like play buttons ("▶ Đang theo dõi"). Use coloured dots or plain text instead.
- **Tables vs cards.** Desktop uses tables. Mobile (<640px) must switch rosters, work lists, sheets and case lists to cards. Today every table just scrolls sideways (705–1,150px wide).
- **Dates.**
  - Found ISO dates: "2026-10-18", "Hạn 2026-09-16", "2026-09-19".
  - Found mixed formats: "30/08" vs "30/08/2026"; "FEB 2027" vs "W2 FEB 2027".
  - Rule: dd/mm/yyyy for dates; dd/mm inside a week context; weeks as "W3 SEP 2026 · 14–20/09"; months as "02/2027" or "Tháng 2/2027"; relative time for notifications.
- **Terminology** (TU_DIEN plus §19.1).
  - HV/HS/học sinh/học viên: use "học viên" everywhere in labels, including "Theo học viên" and "Học viên / Phụ huynh".
  - Case vs signal: "Mở case" on a signal is wrong; use "Xác minh".
  - "Final Test / Bài kiểm tra cuối khoá / Cuối khoá": pick one.
  - "Nhập điểm test / Nhập điểm Test / Bảng điểm": use "Nhập điểm".
  - English: "follow-up", "OVR", "Target", "Overall" (acceptable for IELTS; keep "Overall", drop "OVR").
  - Lowercase skills: "writing", "listening, reading".
  - Abbreviations in headers: "L R W1 W2 S", "PA", "HV", "FOU", "LT1", "CX/GĐCN".
  - "Việc cần lưu ý" vs "Việc cần làm".
  - "6 case SOS" vs "6 case chưa xong" for the same number.
- **Back links.** "← Quay lại" vs "← Danh sách lớp" (which goes to the wrong place). Use a breadcrumb "Học viên & Lớp › MB-FT 101 › Nhập điểm".
- **Empty states.** "Không có mục nào" under zero-value tiles is noise. The advice "Đổi bộ lọc hoặc bỏ từ khoá tìm" is wrong when no filter is set. Per S7: say what is missing, who fills it, and which button.

### B3. Density rules (proposed, enforceable in review)

1. No explanatory paragraph over 1 line on a page. Longer text goes into "Cách tính / Cách đọc".
2. At most 4 KPI tiles per view, and every tile is clickable.
3. At most 1 row of tabs per page and at most 1 filter row (search + ≤3 controls). More filters go into a "Bộ lọc" popover.
4. At most 5 quick-filter chips. Hide chips with a count of 0 that the role cannot act on.
5. Each fact appears once per card (no status or overdue printed 2–3 times).
6. Tables ≤ 8 columns on desktop; card view below 640px.
7. Numbers are right-aligned and never dotted-underlined unless clickable, and clickable numbers get a hover state and a chevron.

### B4. Global workflow improvements

- **Do it in place.**
  - Every list row gets its one next action inline: + PA, Xác minh, Ghi kết quả, Nhập điểm, Xếp lịch, Trả lời đề nghị.
  - Details open in a right-side panel that *replaces* rather than stacks.
  - The PA form becomes inline inside the case card or drawer.
- **Deep links with state.** One parameter scheme: `?tab=`, `?attempt=`, `?skill=`, `?week=`, `?case=`. Class badges, tiles, analytics cells, notifications and work-list items all land on the exact record, filtered (R7).
- **Role-aware defaults.**
  - A teacher's sheet opens on "my skill, missing only".
  - A QL's Học viên opens on "Cần chú ý".
  - A single-branch QL never sees branch pickers or "Tất cả chi nhánh" rows.
- **Fewer confirmations, more undo.** "Đánh dấu đã làm" already works in one click; extend it (Ghi kết quả quick choices, mark a violation as handled) and offer a 5-second "Hoàn tác" toast instead of dialogs. Keep explicit confirmation only for Chuyển tiếp lớp, Kết luận lộ trình, and deletes.
- **Bulk actions.** Kế hoạch Test (select many, one week), "Xử lý n vi phạm", "Nhập điểm cả lớp".
- **One source of counts.** A single shared definition service for "case mở", "bài chưa nhập điểm" and "em SOS". Every badge and tile must quote the same function (the Phân tích disclaimer claims this already, but the numbers still diverge).

---

## C. Evidence of data or label contradictions (must fix before launch)

1. Toàn cảnh "HỌC VIÊN CÓ CASE ĐANG MỞ 10 · CASE 15 · THIẾU PA 4" vs Thực trạng "Cả chi nhánh 9 · 14/3 · 3" (same QL, same day).
2. Class MB-FT 101: list badge "6 case SOS", class page "6 case chưa xong", roster total 10 cases, and the linked list is titled "11 case đang xử lý".
3. "11 case đang xử lý" list contains "Chưa xử lý" rows. The "Case thiếu PA" list contains a case marked "Đang xử lý".
4. SOS view: "SOS 2 · Chưa xử lý · Đã hỗ trợ · 14/09" on one row.
5. Bài chưa nhập điểm: "17 bài MT còn thiếu điểm" (Việc đang tồn) vs "38 bài cần chấm" vs 9+28+1 = 38 on the badges.
6. Mock detail: "Kỳ vọng 6.0 · Overall 6.0 · Chưa đạt kỳ vọng".
7. Profile (Nguyễn Minh An): "Đạt kỳ vọng" + "Kỹ năng cần hỗ trợ 1 Writing Task 1"; the W1 row says "Đang theo dõi" with "Không có case đang mở".
8. Normal MB-FOU 12: "Final Test tuần này" (header) vs "Bài kiểm tra cuối khoá W1 OCT 2026" (sheet). Roster "Bùi Khánh Linh SOS 2 · tạm thời" vs sheet "Chưa đủ điểm để kết luận".
9. Deadlines: GVCN work list "MB-FT 101 MT3 L,R — Hạn 16/09/2026" vs sheet "Hạn nhập điểm 23/09".
10. Lộ trình dialogs: "Tuần này là tuần học thứ 1" when today is study week 16. The dialog refers to a nonexistent "Kế hoạch học" button.
11. PA form refers to status "Đã lên kế hoạch", which is not offered.
12. QL "Cần nhập điểm Test" says "nhập sẽ được ghi là sửa hộ", but the sheet says "Bạn được nhập: không kỹ năng nào".
13. QL Thông báo empty while a request addressed to QL is pending.

---

## D. Prioritised top-20 (impact × effort)

I = impact (1–5), E = effort (1 = hours, 5 = weeks). Sorted by impact÷effort, with launch blockers first.

| # | Change | Pages | I | E | Plan |
|---|---|---|---|---|---|
| 1 | Fix the 13 contradictions in §C (shared count definitions, labels, Lộ trình copy, PA-form ref, Normal "MT1") | all | 5 | 2 | S9, S10 + NEW |
| 2 | Strip explanatory paragraphs into "Cách tính/Cách đọc" popovers (≈25 blocks listed above) | all | 5 | 1 | S8 |
| 3 | Standardise dates (no ISO), capitalised skill names, no English leftovers ("follow-up", "OVR") | all | 4 | 1 | NEW |
| 4 | ⚠ reserved for overdue; "Bình thường" loses its icon; "⚠2" becomes "Thiếu 2 thông tin" | lists, roster, cases | 4 | 1 | S3 + NEW |
| 5 | Class-level score tasks and class badges deep-link to the sheet with `?attempt&skill` (not the Mock page / Học viên list) | Tổng quan, Hồ sơ lớp | 5 | 2 | R7, R8 |
| 6 | 4-area nav (Tổng quan / Học viên & Lớp / Test / Công việc); redirect `/hoc-thuat`, `/tien-trinh`, `/tong-hop-tuan` | global | 5 | 3 | O1–O6 |
| 7 | Hồ sơ lớp: 4 tabs (Học viên / Ý thức & Phối hợp / Phân tích lớp / Giáo viên); remove "Thông tin lớp" step; Lộ trình as header button | Hồ sơ lớp | 5 | 3 | Q4, §22.2 |
| 8 | One score-entry component for FT + Normal; "my skill, missing only" default; mobile card layout; no fake inputs for read-only | Test | 5 | 4 | O2, R8, R13 |
| 9 | Phân tích: one view bar (Vấn đề học viên / Kết quả hỗ trợ / Theo tuần / Ý thức); drop pinned "Tổng hợp theo lớp", "Việc đã giao", Giao-việc picker | Tổng quan › Phân tích | 4 | 3 | P7, P11 |
| 10 | Inline row actions in every Học viên view (+ PA, Xác minh, Nhập điểm, Xếp lịch) opening a replace-not-stack panel | Học viên & Lớp | 5 | 3 | P8 + NEW |
| 11 | Học viên toolbar: one search, "Cần chú ý" dropdown instead of 8 chips, segmented scope, 3-fact class rows, rename "case SOS" badge | Học viên & Lớp | 4 | 2 | Q1–Q3 |
| 12 | Tổng quan QL: plan tiles (clickable), "Cần xử lý" 5–8 rows + "Xem tất cả", hide duplicate "Tất cả chi nhánh" row for 1-branch QL | Tổng quan | 4 | 2 | P1, P2, P4, P5 |
| 13 | Tổng quan GV: 4 quick filters + type dropdown (fix 5-row chip wall on mobile); add "Học viên của tôi cần hỗ trợ" | Tổng quan | 4 | 2 | P6, R2 |
| 14 | Mobile chrome: single 48px header + bottom nav; slim or remove demo bar (168px → ~56px) | global | 4 | 2 | O acceptance |
| 15 | Ý thức analytics: 17 tiles → 4 KPIs + one ordered bar list; spell out CX/GĐCN/HS/PH | Phân tích › Ý thức | 3 | 1 | TU_DIEN §6 + NEW |
| 16 | Case card or drawer de-duplication (status once, overdue once, title without repeated skill; inline PA form; clear disabled "Hoàn thành case") | Hồ sơ học viên, drawer | 4 | 2 | Q8 follow-up, S7 |
| 17 | Student profile: consistent header buttons; clickable tiles with plain next-action text; one-line skill rows | Hồ sơ học viên | 4 | 2 | R8 + NEW |
| 18 | Công việc area: merge Tiến độ công việc + Tình hình đơn vị + teacher "Hỗ trợ học viên"; 4 quick filters; Tạm ngưng not overdue; Nháp/Đã nộp | Công việc | 4 | 3 | R1–R5 |
| 19 | Kế hoạch Test rebuild (students first, MT1–3 + dự phòng, RLW/S week pickers, diff) inside Test area; list students in "Chưa có tuần MT" | Test | 4 | 4 | R9, R10, R12 |
| 20 | Notifications: group by student/case, auto-expire on resolve, timestamps, mark-all-read, QL receives requests addressed to QL | global | 3 | 2 | NEW |

Also worth a quick pass (low effort, not top-20): Admin tabs and hidden empty columns and readable audit log. Also accessible names for the account button and tabs (`role=tab`, `aria-selected`), the Hành trình skill selector and "Mốc học tập" rename (Q9), the Chuyển tiếp lớp warning when Final Test scores are missing, and demo cards showing GVCN/GVBM roles.

---

## E. Suggested sequencing into the existing PRs

- **PR-S, pulled forward as "PR-S0 · Chữ & số" before O.** Items 1–4, 15. These are low risk, touch copy and count functions only, and give the biggest immediate clarity gain. Also add a lint or test that fails on ISO dates in rendered text.
- **PR-O.** Item 6 plus 14 (mobile chrome belongs to the frame).
- **PR-P.** Items 9, 12, 13, 20.
- **PR-Q.** Items 7, 10, 11, 16, 17.
- **PR-R.** Items 5, 8, 18, 19.

Each PR's acceptance should include desktop and 375px screenshots for QL, GVCN+GVBM (Trần Ngọc Hà) and GVBM-only (Phạm Thu Trang), plus a re-check of the §C contradictions list.
