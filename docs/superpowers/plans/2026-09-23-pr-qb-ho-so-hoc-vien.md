# PR-Qb · Hồ sơ học viên — Hành trình theo lịch, mở đúng đợt, chữ lớp thường — Kế hoạch

| Mục | Chốt |
|---|---|
| Mã PR | **Qb** · Hồ sơ học viên |
| Đợt | **3 — trước deploy** (quyết định 23/09 01:30) |
| Nhánh | `pr-qb-ho-so-hoc-vien` (worktree `.claude/worktrees/pr-qb-ho-so-hoc-vien`) |
| Cổng thử | **API 4157 · Vite 5357** (không 4000/5173, không cổng PR khác) |
| Model khuyến nghị | **Fable 5.1 · High** |
| Phương án B | **Sonnet 5 · High** |
| Người rà | **Opus 5.5** (khác model người code) |
| Migrate | **KHÔNG** (không đổi `schema.sql`, `migrate.ts`) |
| Phụ thuộc | **Bắt đầu code SAU KHI PR-Qa merge** (dùng `hocVienLop.ts`, `thaoTacDongHocVien.tsx`, `ClassRoster` chỉ-FT, `hienThiNgay.ts` giờ VN). Không phụ thuộc Rc1/Form để merge; hai chỗ dùng chung ghi ở "Chuyển cho PR khác" |
| File KHÔNG được chạm | `web/src/modules/cases/SkillBoard.tsx`, `CasePanel.tsx`, `QuickReport.tsx`, `server/src/cases/cases.ts`, `server/src/yThuc/measures.ts` (PR-Form) · `CaseBoardPage.tsx`, `IssueAnalysis.tsx`, `WeeklyBoard*` (Pb) · `server/src/fasttrack/attempts.ts`, `web/src/modules/normal/RegularSheetPage.tsx`, `web/src/modules/fasttrack/Mock*`, `ScoreEntry*`, `MockPlanPanel.tsx`, `server/src/permissions.ts` (Rc1, Rc2) · `OverviewPage.tsx`, `WorkList.tsx` (Pa) · `shared/domain/hienThiNgay.ts` (Qa — **chỉ dùng**) |

## QUY TRÌNH NHANH (bắt buộc, chủ sản phẩm chốt 23/09)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **KHÔNG** rà từng task bằng subagent. Tự code từng Task,
  chạy `npm run check` sau mỗi Task (phải xanh, **số phép kiểm không giảm**), rồi commit. Nếu có dùng subagent: **cùng
  model**, **KHÔNG Haiku**.
- **Không chụp ảnh từng Task.** Bấm thử theo vai + 375px **MỘT lần** ở Task cuối; ảnh lưu `thiet-ke/anh/pr-qb/`.
- **Không tự rà code cuối PR** (planning rà bằng model khác). Cuối PR: push, mở PR (không draft, không tự merge), báo planning.
- **Task 0:** tạo worktree + nhánh từ `origin/main` mới nhất, chép file kế hoạch này vào nhánh và commit.
- Commit ghi **đúng** dòng `Co-Authored-By` của model thật đang chạy (Fable 5.1 hoặc Sonnet 5 nếu chạy phương án B).
- Không chạy lệnh nào vào database bản chính (Turso), không deploy. Ngày trên màn: chỉ qua `ngay` / `tuanLich` / `tuanKhoa`
  (`shared/domain/hienThiNgay.ts`). Chữ cấm (quét cả chú thích): `biện pháp`, `BP` đứng riêng, `Hãy`, `Việc của tôi`,
  `Kế hoạch MT`… (xem `server/src/tests/hoSoHocVien.tests.ts` khối `CHU_CU` và khối quét chữ cuối `run.ts`).

**Nguồn** (thứ tự thắng: đặc tả > mockup > THUAT_NGU > kiểm kê > mã cũ):
`docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 (G-1…G-12), §2, **§3.8** (trừ "Lịch sử lớp"),
§4, §5 (4.3, 4.12), §6 (dòng "Đạt kỳ vọng… Qb"), §7 dòng Qb · kiểm kê `…kiem-ke-truoc-deploy.md` **Q9, R7, R8, AN-9,
AN-10** · mockup `thiet-ke/mockup/08e-hanh-trinh-lich.html`, `10b-lop-thuong-v2.html` §3, `11-chuyen-lop.html` §4 (chỉ
để biết chỗ chừa) · chữ `thiet-ke/THUAT_NGU_DA_CHOT.md` (g4-033, g4-038, g5-035, g5-036, g6-148, g8-102, g8-105, g8-133,
g10-079, g14-015, g14-105, g14-106, g3-144/145) · `plan.md` §12.5 (bốn đường vào), §12.18.

**Mốc số dòng:** `StudentDetailPage.tsx`, `JourneyTimeline.tsx`, `profile.ts`, `Header.tsx` đo trên `main` @ `37786fd`
(Qa không sửa các file này). `routes/index.ts`, `ClassRoster.tsx`, `StudentsPage.tsx`, `display.ts` **đã bị Qa sửa** →
tìm theo **nội dung** ghi trong Task, không theo số dòng.

---

## Quyết định session planning tự chốt (người rà kiểm lại)

| # | Câu hỏi | Chốt | Vì sao |
|---|---|---|---|
| Q1 | "Giai đoạn" là gì trong dữ liệu? | **Lớp thường** = mọi `learning_cycles` chấm tỷ lệ (`isRatioCycle`), **FT** = mọi lộ trình còn lại. Có cả hai mới hiện **hai nút** ở đầu tab. Mặc định = giai đoạn của lộ trình đang xem ở đầu hồ sơ; nhớ qua `?giai-doan=thuong\|ft` (`replace`) | §3.8 "mỗi giai đoạn một trục riêng, không trộn". Demo: HV 1 (FOU→BE→FT), HV 30 (BE→FT) |
| Q2 | Trục: mockup 08e "Tháng 7 · W1–W4" ↔ G-6 | Hàng tháng ghi mã **`JUL` `AUG` `SEP`**; hàng tuần **W1…W5 theo lịch thật** (tuần thuộc tháng chứa thứ Năm, `week.ts`). Một cột = một tuần | G-6 + `tuanLich` là luật chung; ép 4 tuần/tháng là lệch lịch |
| Q3 | Khoảng mặc định (kiểm kê Q9 "6–8 tuần" ↔ mockup "3 tháng gần nhất") | **"3 tháng gần nhất"** (13 tuần, kết thúc tuần sau tuần này) + lựa chọn **"Cả giai đoạn"**. Giai đoạn đã kết thúc: 3 tháng cuối của giai đoạn đó | Mockup + THUAT_NGU g4-033 thắng kiểm kê |
| Q4 | Khối PA dài tới đâu? | Tuần bắt đầu (`startedOn`) → tuần kết thúc (`completedOn`); **còn chạy thì kéo tới tuần này**. **Không** vẽ đuôi "dự kiến" | Mockup 08e ghi chú; bỏ luôn nhãn `dự kiến dd/mm` gây lòi 23px (AN-10) |
| Q5 | PA song song | Xếp tầng tham lam theo ngày bắt đầu: khối chồng thời gian với khối đang ở tầng 1 thì xuống tầng 2, rồi 3… Không ghi chữ "chạy song song". PA được thay (`supersededBy`) nối tiếp trên **cùng** tầng | §3.8 + `cases.ts` chú thích "Hành trình (PR-Qb) nối các khối PA theo chuỗi này" |
| Q6 | Badge hộp kỹ năng (spec chỉ nêu 2 ví dụ) | Theo thứ tự: có Case mở **chưa có PA** → `Chưa có PA · {n} tuần` (vàng) · có Case mở và điểm gần nhất chưa đạt → `Cần hỗ trợ · {n} tuần` (đỏ) · có Case mở còn lại → `Đang theo dõi · {n} tuần` (vàng) · hết Case mở mà từng có → `Đã ổn · xong {dd/mm}` (xanh) · chưa từng có Case → chữ mờ `Không có Case`. `n` = số tuần từ Case mở sớm nhất tới hôm nay (làm tròn lên) | Spec §2 "chưa ổn → Cần hỗ trợ"; mockup có đủ 4 trạng thái; THUAT_NGU g8-102, g6-073, g14-106 |
| Q7 | Bỏ gì của Hành trình cũ? | Bỏ chế độ **"Dòng sự kiện"**, nút **"Hiện n Case đã hoàn thành"**, làn đường điểm SVG, mọi `SectionNote`. Case đã xong vẫn là một hàng nếu nằm trong khoảng đang xem | Mockup 08e là một hình duy nhất; điện thoại dùng cuộn ngang trong thẻ (G-11); G-5 |
| Q8 | Danh sách mốc dưới trục | Giữ, đổi tên **"Các mốc đã qua" → "Mốc học tập"** (kiểm kê Q9), giữ nút `Mở toàn hành trình` / `Chỉ xem mốc chính`. **Máy chủ bỏ sự kiện Ý thức** (`warning`, `wl`) khỏi `episodes` và `allEpisodes` | Quyết định 4.12: Hành trình không có Ý thức. "Lịch sử lớp" (PR-LT) sau này đặt ở ĐẦU tab |
| Q9 | Bấm khối PA / tên vấn đề | Mở ngăn trượt phải `Case` (đúng `CasePanel` đang dùng), **không đổi tab**, rồi cuộn tới phần tử `[data-pa-id="{id}"]` trong ngăn + viền sáng 2 giây. `CasePanel` là file PR-Form → **Form thêm thuộc tính** (xem "Chuyển cho PR-Form"); chưa có thì ngăn vẫn mở, chỉ không cuộn | Không chạm file Form; không đoán theo chữ |
| Q10 | R7 — quy ước URL "mở đúng đợt" (quyết định 4.3) | `/hoc-vien/:id?dot=<attemptId>` → tab Học thuật, **lộ trình chứa đợt đó**, dòng đợt tô sáng + cuộn tới + link phụ **"Hồ sơ đợt ›"** (khu Test, `attemptHref`). `&kn=<skill>` → chọn hàng kỹ năng đó ở bảng kỹ năng (prop `selected` có sẵn) và cuộn tới bảng. Thêm `?case=<id>[&pa=<id>]` mở ngăn Case (dùng cho thông báo). Một hàm dựng + một hàm đọc ở `shared/domain/duongHoSo.ts`; **mọi** nơi tạo link dùng hàm đó | plan.md §12.5 "một quy ước duy nhất" |
| Q11 | R8c — bốn ô số bấm được | `Kết quả Test gần nhất` → `?dot=` của đợt đó · `Kỹ năng cần hỗ trợ` → chọn kỹ năng chưa đạt đầu tiên + cuộn tới bảng · `Case đang mở` → chọn kỹ năng của Case mở đầu tiên + cuộn · `Việc cần làm tiếp` → chọn `headline.next.category` + cuộn. Ô giá trị `—`/`0` không bấm được. Bấm khi đang ở tab khác thì chuyển về Học thuật | Mỗi ô dẫn đúng chỗ tạo ra số (tinh thần G-10) |
| Q12 | Thông báo mở đâu (R8 + JOIN) | `sos_case` → `/hoc-vien/{sid}?case={id}` · `case_signal` → `/hoc-vien/{sid}` · `assessment_attempt` kind `sos` → `?dot={id}`; kind `schedule_move` → giữ `/mock-test/{id}` (thao tác dời lịch nằm ở hồ sơ đợt) · `skill_move_requests` → `/mock-test/{attemptId}` · `discipline_measure` → `/hoc-vien/{sid}?tab=y-thuc` · không tra được → không điều hướng | Mỗi loại về chỗ **làm được việc** của nó |
| Q13 | R8a — đã làm tới đâu? | Qa đã: badge bài chưa chấm → `/test/can-cham?classId=`; nút `Nhập điểm Test` hồ sơ lớp mang `periodId`; ⋯ hộp lớp và ⋯ dòng HV có Nhập điểm. Rc1 hợp nhất lưới. **Qb chỉ thêm `&scope=mine`** vào link badge khi Phạm vi = `Lớp tôi dạy` và kiểm lại cả 4 đường | Không làm trùng Qa/Rc1 |
| Q14 | R8b — nhãn đợt ở bảng HV lớp | Chỉ `ClassRoster` (sau Qa chỉ còn FT): nhãn `MT{n}` → `duongHoSoHocVien(s.id, { dot: h.id })`. Bảng lớp thường của Qa (`BangDiemLopThuong`) không có nhãn đợt theo dòng → không đổi | Kiểm kê viết trước khi Qa tách bảng |
| Q15 | Giai đoạn FT có ≥ 2 lộ trình (HV 40: LT1 → LT2) | Thêm hàng **"Lộ trình"** (đoạn LT1, LT2) như hàng "Khoá" của lớp thường; ghim `MT{n}` đánh số theo lộ trình của chính nó | MT đánh lại từ 1 mỗi lộ trình — thiếu hàng này ghim đọc nhầm |
| Q16 | Chuỗi điểm | FT: band từng **bài nhập** (W1, W2 riêng), đỏ nếu dưới kỳ vọng của chính đợt; lớp thường: **%** (làm tròn), đỏ nếu `outcome` của `evaluateRegular` là chưa đạt (không tự tính lại 70%). Tối đa 5 mốc gần nhất; có đợt đã lên lịch chưa có điểm môn đó thì thêm `?` | Mockup 08e, 10b §3 |
| Q17 | §6 `display.ts` "Đã đủ điểm · Đạt kỳ vọng" dùng chung với FT | Thêm tham số tuỳ chọn `cheDo?: 'ielts' \| 'ratio'` cho `attemptProgressView` và `<KetQuaDot>`; `ratio`: `Đạt {k}/{n} môn` · `Chưa đạt {m} môn · SOS {s}` · `Đạt {k}/{c} môn đã chấm · còn {r} môn`; đơn vị "môn" thay "kỹ năng". Mặc định `ielts` → mọi nơi gọi cũ không đổi | Sửa đúng chữ lớp thường mà không đụng FT |
| Q18 | Đầu hồ sơ lớp thường | Dòng phụ: `{mã lớp} · GVCN {tên} · {khoaLopThuong().chinh}` + ` · {phu}` (vd `MB-FOU 12 · GVCN Trần Ngọc Hà · FOU · W8/8 · kết thúc W4 SEP`). **Không** Mục tiêu, **không** Dự kiến thi. Gọi `khoaLopThuong({… tiepTheo: null })` — PR-LT truyền nhãn Lộ trình tiếp theo khi có dữ liệu | §3.8 dòng cuối; dùng lại hàm của Qa (cùng chữ với cột Khoá) |
| Q19 | Khối "Xác minh vấn đề SOS" trên hồ sơ | Lớp thường: dòng `{Kỹ năng} {đúng}/{tổng} · Giữa khoá` (không `MT{n}`, không "so với kỳ vọng"); nút `Tạo Case` (thay "Mở case") + `Bỏ qua` khi `actions` có `dismiss` (route S1 `POST /signals/pending/:id/dismiss`, lý do không bắt buộc). Khối `SectionNote` → ⓘ một câu | §3.10, S1 đã có dữ liệu `kind/score/total/actions` |
| Q20 | Tuần hiện tại trên trục | Cột tuần này tô nền nhạt suốt chiều cao + nhãn tuần đậm màu nhấn, tooltip `W3 · hôm nay` | Cột 40px không đủ chỗ cho chữ g6-148 |
| Q21 | Hộp kỹ năng không có Case | Vẫn hiện (tên + chuỗi điểm + `Không có Case`), chỉ không có hàng vấn đề. Chip lọc `Tất cả kỹ năng · L · R · W1 · W2 · S` (lớp thường `L · R · W · S`) | Mockup 08e hộp Writing Task 1 |
| Q22 | Vấn đề nằm ngoài khoảng đang xem | Ẩn hàng; cuối hộp một dòng mờ `+{n} vấn đề cũ hơn — chọn "Cả giai đoạn"` | Khoảng 3 tháng không được làm "mất" Case cũ |

---

## Bản đồ file

| File | Việc |
|---|---|
| `shared/domain/duongHoSo.ts` (**mới**) | `duongHoSoHocVien`, `docThamSoHoSo`, `duongThongBao` (R7, Q10, Q12) |
| `shared/domain/hanhTrinh.ts` (**mới**) | Luật thuần trục/tầng/badge/chuỗi/nhãn khối (Q2–Q6, Q15, Q16, Q22) |
| `shared/domain/index.ts` | +2 dòng `export *` |
| `shared/domain/display.ts` | `attemptProgressView` thêm `cheDo` (Q17) |
| `shared/domain/hoSoHocVien.ts` | `ketQuaTestGanNhat`: nhãn dùng `tuanLich(weekStart)` thay `periodCode` (có năm, G-6) |
| `server/src/students/hanhTrinh.ts` (**mới**) | `hanhTrinhHocVien(p, studentId, giaiDoan)` |
| `server/src/platform/thongBao.ts` (**mới**) | `thongBaoCua(userId)` — SELECT có JOIN `studentId`/`attemptId` |
| `server/src/students/profile.ts` | chọn lộ trình theo `attemptId`; `currentClass.khoa`; `headline.next.category`; lọc Ý thức khỏi mốc |
| `server/src/routes/index.ts` | `GET /students/:id/hanh-trinh`; `/students/:id` nhận `attemptId`; `/notifications` gọi `thongBaoCua` |
| `server/src/tests/hanhTrinh.tests.ts` (**mới**) + `run.ts` (+2 dòng trước khối in tổng kết) | Phép kiểm PR-Qb |
| `web/src/modules/students/HanhTrinh.tsx` (**mới**, thay `JourneyTimeline.tsx` — **xoá** file cũ) | Tab Hành trình |
| `web/src/modules/students/NganCase.tsx` (**mới**) | Ngăn Case + cuộn tới PA (Q9) |
| `web/src/modules/students/StudentDetailPage.tsx` | R7, R8c, đầu hồ sơ lớp thường, chữ §6, AN-9, G-5 |
| `web/src/ui/KetQuaDot.tsx` | prop `cheDo` |
| `web/src/modules/yThuc/StudentYThucSection.tsx` | AN-9: nhận `canhBao` từ trang |
| `web/src/modules/students/ClassRoster.tsx` | R8b |
| `web/src/modules/students/StudentsPage.tsx` | R8a `&scope=mine` |
| `web/src/modules/platform/Header.tsx` | thông báo điều hướng bằng `duongThongBao` |
| `CODE_MAP.md`, `plan.md`, spec §4, kiểm kê | Tài liệu (Task 8) |

---

### Task 0: Worktree, mốc xuất phát

- [ ] Kiểm Qa **đã merge**: `git fetch origin && git log origin/main --oneline | grep -i "pr-qa\|PR-Qa" | head -3` có
  commit merge; `git show origin/main:shared/domain/hocVienLop.ts | grep -c khoaLopThuong` ≥ 1;
  `git show origin/main:web/src/modules/students/ClassRoster.tsx | grep -c "isRatio"` = 0. Chưa có → 🛑 dừng, báo planning.
- [ ] Tạo worktree `.claude/worktrees/pr-qb-ho-so-hoc-vien`, nhánh `pr-qb-ho-so-hoc-vien` từ `origin/main`; `npm ci` nếu
  thiếu `node_modules`. Không checkout nhánh khác ở thư mục chính.
- [ ] Kiểm không có biến Turso (lệnh `node -e …` như Task 0 Step 2 của plan Rc1). Ra `sạch`.
- [ ] `npm test 2>&1 | tail -3` → ghi **B** (số phép kiểm) vào Nhật ký.
- [ ] Chép file kế hoạch này vào `docs/superpowers/plans/` của nhánh, commit
  `PR-Qb (0): kế hoạch hồ sơ học viên`.

### Task 1: Luật thuần — `duongHoSo.ts` + `hanhTrinh.ts` (viết phép kiểm trước)

**Files:** tạo `shared/domain/duongHoSo.ts`, `shared/domain/hanhTrinh.ts`, `server/src/tests/hanhTrinh.tests.ts`;
sửa `shared/domain/index.ts` (+2 dòng), `server/src/tests/run.ts` (+2 dòng, sau khối PR cuối cùng, trước
`console.log(\`\n${'='.repeat(60)}\`)`), kiểu kit `YThucTestKit` như `khung.tests.ts`.

**`duongHoSo.ts`:**
- `type ThamSoHoSo = { tab?: HoSoTab; dot?: number; kn?: string; caseId?: number; paId?: number; giaiDoan?: 'thuong' | 'ft'; loTrinh?: number }`.
- `duongHoSoHocVien(studentId, o = {})` → `/hoc-vien/{id}` + query theo thứ tự cố định `lo-trinh, tab, dot, kn, case, pa, giai-doan`;
  bỏ `tab=hoc-thuat` (mặc định); có `dot`/`kn` thì **không** ghi `tab` (luôn Học thuật).
- `docThamSoHoSo(get: (k: string) => string | null): ThamSoHoSo` — số nguyên dương mới nhận; `kn` chỉ nhận
  `listening|reading|writing|writing1|writing2|speaking`; `giai-doan` chỉ `thuong|ft`; sai → bỏ qua (không ném lỗi).
- `duongThongBao(n: { entity_type; entity_id; kind; student_id; attempt_id }): string | null` — đúng bảng Q12.

**`hanhTrinh.ts`** (chỉ nhận chuỗi ISO `yyyy-mm-dd`; dùng `mondayOfDate`, `owningMonthOf`, `weekNumberInMonthOf` của
`week.ts`, `addDays`):
- `khoangTruc(gd: { tu: string; den: string | null }, homNay, cheDo: '3-thang' | 'ca-giai-doan') → { tu, den }` (thứ Hai
  đầu, thứ Hai cuối). `3-thang`: `den` = tuần sau tuần này (giai đoạn đã kết thúc: tuần kết thúc giai đoạn), `tu` = `den` −
  12 tuần nhưng không trước tuần bắt đầu giai đoạn. `ca-giai-doan`: tuần bắt đầu → `den` như trên.
- `trucTuan(tu, den, homNay) → { tuan: { thuHai; nhan: 'W3'; dauThang: boolean; homNay: boolean }[]; thang: { nhan: 'SEP'; tu: number; so: number }[] }`
  (Q2; tháng lấy theo `owningMonthOf`).
- `cotCua(ngay, truc) → number` — chỉ số cột của tuần chứa ngày, kẹp trong `[0, soTuan-1]`; ngoài trục trả thêm cờ `cat`.
- `xepTang<T extends { id; tu; den; noiTiepTu?: number | null }>(khoi: T[]) → Map<id, tang>` (Q5; hai khối **chạm**
  nhau ở cùng một tuần cũng tính là chồng, trừ cặp nối tiếp `supersededBy`).
- `nhanKhoiPa(pa: { ten; status; lastOutcome; followupOverdue }) → { chu: string; tone: 'ok'|'part'|'bad'|'run'|'late' }`:
  xong + `improved` → `{ten} · ✓ Tiến bộ rõ` (ok) · `partial` → `◐ Tiến bộ một phần` (part) · `unchanged`/`worse` → `✗ Không
  tiến bộ` / `✗ Kém hơn` (bad) · xong không kết quả → `{ten} · Đã kết thúc` (part) · đang chạy → `{ten} · Đang thực hiện`
  (run), quá hạn cập nhật thêm ` · Quá hạn cập nhật` (late). Nhãn kết quả lấy từ `outcomeLabelFor` (không gõ lại).
- `trangThaiHop(i: { caseMo: { mo: string; soPa: number }[]; coTungCase: boolean; diemCuoiChuaDat: boolean | null; xongGanNhat: string | null }, homNay) → { chu; tone } | null` (Q6).
- `chuoiDiem(diem: { gt: number; tong?: number | null; chuaDat: boolean }[], cheDo: 'ielts'|'ratio', conCho: boolean) → { chu; xau }[]`
  (Q16: `5.5` / `75%`; tối đa 5 mốc cuối; `conCho` thêm `{ chu: '?', xau: false }`).
- `nhanGhim(a: { cheDo; attemptNo; kind; overall; sosLevel; soDat; soYeuCau; soCoDiem; status }) → { ngan; day; tone }`:
  FT `MT1 · 5.5`, `MT2 · 6.0 · SOS 1`, `MT3 · đang chấm` (có điểm chưa đủ), `MT4` (chưa có điểm); lớp thường ngắn `Giữa`
  / `Cuối`, đầy đủ (tooltip) `Giữa khoá · Đạt 3/4 môn`. **Không** có chữ `MT` ở lớp thường.
- `nhanGiaiDoan(gd: { loai; tu; den }, homNay)` → `Lớp thường · W2 JUN – W4 SEP` / `Fast Track · từ W1 OCT` (dùng `tuanLich`).

**Phép kiểm (≥ 16, pure):** URL dựng ↔ đọc khứ hồi; `kn=abc`, `dot=-3`, `dot=1.5` bị bỏ; `duongThongBao` đủ 6 nhánh Q12;
tháng 5 tuần (vd `2026-10`) ra `W5`; `homNay` đánh dấu đúng một cột; trục vắt năm (DEC→JAN) không lặp tháng;
`khoangTruc` 3 tháng của giai đoạn đang chạy và đã kết thúc; `xepTang`: 2 khối chồng → tầng 0/1, 3 khối chồng → 0/1/2,
chuỗi `supersededBy` giữ tầng 0; `trangThaiHop` đủ 5 nhánh Q6 (kể cả `n` tuần làm tròn lên); `chuoiDiem` FT/lớp thường +
`?`; `nhanGhim` lớp thường không chứa `MT`; `nhanKhoiPa` đủ 6 nhánh.

**Xong khi:** `npm run check` xanh, **B + ≥16**. Commit `PR-Qb (1): luật thuần hành trình và quy ước đường dẫn hồ sơ`.

### Task 2: Máy chủ — `GET /students/:id/hanh-trinh`

**Files:** tạo `server/src/students/hanhTrinh.ts`; sửa `server/src/routes/index.ts` (một khối ngay sau route
`api.get('/students/:id/skill-board'…)`); thêm phép kiểm vào `hanhTrinh.tests.ts`.

`hanhTrinhHocVien(p, studentId, giaiDoan: 'thuong'|'ft'|null)`:
- Quyền: `require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, …)` y như `studentProfile` (`profile.ts:505`).
- **≤ 6 truy vấn cố định + mỗi đợt một `typedResult`** (Turso): (1) `cyclesOf`; (2) lượt của các lộ trình trong giai đoạn
  JOIN `report_periods` (`week_start`) + `classes.code`; (3) điểm các lượt đó (`assessment_scores`, một câu `IN`); (4)
  `sos_cases` của HV thuộc các lộ trình đó (`cycle_id IN …`; `cycle_id` NULL → xếp theo `detected_at` vào giai đoạn chứa
  ngày đó); (5) `case_interventions` của các Case đó, `status != 'cancelled'`; (6) `case_followups` có `outcome` của các
  Case đó (lấy lần mới nhất mỗi PA). Tên vấn đề: `caseTitleOf` (import từ `cases.ts`, **không sửa** file đó).
- Kết quả (ngày ISO, web tự định dạng):
  `{ giaiDoan, cacGiaiDoan: [{ loai, tu, den }], homNay, doan: [{ loai: 'khoa'|'lo-trinh', nhan, tu, den }], ghim: [{ attemptId, tuan, ...nhanGhim-input }], hop: [{ kyNang, nhan, cheDo, diem: [...], conCho, caseMo, coTungCase, diemCuoiChuaDat, xongGanNhat, vanDe: [{ caseId, ten, mo, dong, soPa, pa: [{ id, ten, tu, den, status, lastOutcome, followupOverdue, supersededBy }] }] }] }`.
  - Hộp: `caseCategoriesFor(ratio ? 'ratio' : 'ielts_band')` — FT 5 hộp, lớp thường 4 hộp, đúng thứ tự L R W(1 W2) S.
    Case có `category` ngoài bộ hộp: `writing1/2` ↔ `writing` ghép theo kỹ năng gốc; vẫn không khớp thì bỏ (không vỡ).
  - `doan` lớp thường: mỗi lộ trình tỷ lệ một đoạn, **xếp theo `started_at`**, nhãn `{mã lớp} · {n} tuần` (lớp lấy từ
    `enrollments` trùng thời gian, không có → mã chương trình); kết thúc = `ended_at` ?? tuần cuối theo chương trình ?? hôm
    nay. FT chỉ có `doan` khi ≥ 2 lộ trình (Q15), nhãn `cycleLabel`.
  - Điểm FT theo **bài nhập** (`entryBandsOf(scoresOf(id))` — W1, W2 riêng), kỳ vọng từ `typedResult(a).ft.expectation`;
    lớp thường từ `typedResult(a).ratio.skills` (`score/total/outcome`).
  - PA `tu` = `started_date ?? planned_date`; `den` = `completed_date` (đang chạy → `null`, web kéo tới tuần này).
- `giaiDoan` null → giai đoạn của `currentCycle`; HV chưa có lộ trình → `{ cacGiaiDoan: [], hop: [] … }`.
- Route: `api.get('/students/:id/hanh-trinh', requireAuth, wrap((req) => hanhTrinhHocVien(principalOf(req), pInt(req,'id'), qStr(req,'giai-doan') as any)))`
  + `maybeSimulateReadError()` như các route bên cạnh.

**Phép kiểm (≥ 8):** HV 1 (seed: FOU→BE→FT): `cacGiaiDoan` có cả hai, mặc định `ft`; `thuong` có 2 đoạn đúng thứ tự
FOU→BE, 4 hộp, không chuỗi nào chứa `MT`, Case 1 (reading, lộ trình BE) nằm ở hộp Reading của `thuong` và **không** có ở
`ft`; `ft` có 5 hộp L R W1 W2 S; HV 40 (LT1→LT2) có `doan` 2 lộ trình; không hộp nào có hạng mục ngoài kỹ năng (không Ý
thức); GV ngoài phạm vi (vd `P.cpManager` với HV chi nhánh MB) → ném lỗi quyền; một Case có 2 PA chồng thời gian (tạo
bằng SQL trong phép kiểm, dọn sau) → dữ liệu đủ để `xepTang` ra 2 tầng; đếm truy vấn không phụ thuộc số Case (bọc
`conn.prepare` đếm, 1 Case vs 3 Case chênh ≤ số đợt).

**Xong khi:** check xanh, **+≥8**. Commit `PR-Qb (2): máy chủ hành trình theo giai đoạn`.

### Task 3: Máy chủ — hồ sơ và thông báo

**Files:** `server/src/students/profile.ts`, tạo `server/src/platform/thongBao.ts`, `server/src/routes/index.ts`, phép kiểm.

1. **Chọn lộ trình theo đợt (R7):** `studentProfile(p, studentId, wantCycleId?, attemptId?)` — không có `wantCycleId` mà
   có `attemptId` thuộc HV này thì `selected` = lộ trình của lượt đó; lượt của HV khác → bỏ qua (không lộ dữ liệu).
   Route `/students/:id` (tìm `profileSvc.studentProfile(`) truyền `qInt(req, 'attemptId')`.
2. **Khoá đang học (Q18):** `currentClass` thêm `khoa: { ma, tuanHienTai, tongTuan, tuanKetThuc } | null` —
   `classProgressMany([classId])` (`server/src/classes/schedule.ts:222`), `tuanKetThuc = addDays(startWeekStart,
   (totalWeeks-1)*7)` giống `hocVienLop.ts` của Qa; FT → `null`.
3. **`headline.next.category`** (Q11): `headlineOf` (`profile.ts:439`) — thêm `category: r.category` vào từng ứng viên,
   trả trong `next`.
4. **Bỏ Ý thức khỏi mốc (Q8):** `profile.ts:703-707` `JOURNEY_MILESTONES` bỏ `'warning', 'wl'`; `allEpisodes` lọc bỏ hai
   loại đó trước `episodesOf`.
5. **Thông báo (R8):** `thongBaoCua(userId)` — câu SELECT `notifications` LEFT JOIN `sos_cases` / `case_signals` /
   `assessment_attempts` / `skill_move_requests`→`assessment_attempts` / `discipline_measures`, **mỗi JOIN có điều kiện
   `n.entity_type = '…'`**, trả `student_id` (COALESCE) và `attempt_id`; giữ `ORDER BY id DESC LIMIT 30`, giữ các cột cũ
   (Header đang đọc `entity_type`, `entity_id`, `read_at`, `title`, `body`). Route `/notifications` gọi hàm này. Không đổi schema.

**Phép kiểm (≥ 6):** `attemptId` của lộ trình cũ → `cycle.id` đúng; `attemptId` của HV khác → lộ trình đang chạy;
HV lớp thường MB-FOU 12 có `currentClass.khoa.ma === 'FOU'`, FT → `null`; `headline.next.category` thuộc bộ hạng mục;
chèn một journey_event `warning` → không có trong `episodes`/`allEpisodes`; chèn 1 thông báo mỗi loại (sos_case,
case_signal, assessment_attempt, discipline_measure) cho `P.admin` → `thongBaoCua` trả đúng `student_id`, và
`duongThongBao` ra đúng đường (dọn dữ liệu chèn sau khi kiểm).

**Xong khi:** check xanh. Commit `PR-Qb (3): hồ sơ mở đúng đợt, khoá đang học, thông báo mang học viên`.

### Task 4: Web — tab Hành trình theo lịch (`HanhTrinh.tsx`, `NganCase.tsx`)

**Files:** tạo `web/src/modules/students/HanhTrinh.tsx`, `NganCase.tsx`; **xoá** `JourneyTimeline.tsx`; sửa
`StudentDetailPage.tsx:271-314` (khối `tab === 'hanh-trinh'`).

- `useApi('/students/{id}/hanh-trinh?giai-doan=…')` **chỉ khi** đang ở tab Hành trình (URL `null` khi khác tab).
- **Hàng điều khiển** (một hàng, xuống dòng được): hai nút giai đoạn (chỉ khi `cacGiaiDoan.length === 2`, nhãn
  `nhanGiaiDoan`, nút đang chọn `btn-primary`) · chip kỹ năng `Tất cả kỹ năng · L · R · W1 · W2 · S` (G-7 tooltip tên đầy
  đủ) · ô chọn `3 tháng gần nhất ▾ / Cả giai đoạn` (state cục bộ).
- **Lưới** (mockup 08e): một khung `overflow-x-auto` **trong thẻ**; bên trong CSS grid
  `grid-template-columns: var(--cot-ten) repeat(N, minmax(40px, 1fr))` với `--cot-ten` 200px (≥ 640px) / 128px (< 640px);
  cột tên `sticky left-0` có nền `var(--surface)` (điện thoại: cột tên đứng yên, trục cuộn). Mọi hàng dùng **cùng** khuôn cột
  → thẳng cột (G-2), số `tabular-nums`.
  - Hàng `Tháng / tuần` (g5-035): tháng `span` đúng số tuần; tuần `W1…W5`; cột tuần này tô nền nhạt suốt chiều cao +
    nhãn đậm màu nhấn, tooltip `W3 · hôm nay` (Q20).
  - Hàng `Khoá` (lớp thường) / `Lộ trình` (FT ≥ 2 lộ trình): đoạn `grid-column: a / b+1`, chữ cắt `truncate`, tooltip đủ.
  - Hàng `Đợt Test` (g5-036): ghim nhỏ bo góc tại cột tuần của đợt, chữ `nhanGhim().ngan`, tooltip `.day`, màu theo tone
    (đạt xanh · SOS/chưa đạt vàng-đỏ · đang chấm xanh dương · chưa có điểm mờ). **Bấm ghim** →
    `navigate(duongHoSoHocVien(id, { dot }))` (push, để Back về lại Hành trình) — R8d.
  - **Hộp kỹ năng** (lọc theo chip): đầu hộp `tên đầy đủ` · chuỗi điểm (`chuoiDiem`, mốc chưa đạt chữ đỏ, `→` mờ) · badge
    `trangThaiHop` bên phải (hoặc chữ mờ `Không có Case`). Mỗi **vấn đề** một nhóm hàng: ô tên (tên vấn đề, bấm → mở Case;
    dòng phụ ≤ 60 ký tự `từ 12/07 · 4 PA` hoặc `12/07 → 30/08 · 6 tuần`) + các tầng khối PA (`xepTang`). Khối: bo góc, cao
    20px, chữ `nhanKhoiPa().chu` cắt gọn, `title` = tên + kết quả + `ngay(tu) → ngay(den)`; màu theo tone bằng biến có sẵn
    (`--ok`, `--warn`, `--danger`, `--accent`; `late` = nền `run` + viền `--danger`). Case không có PA → một khối viền đứt
    `Chưa có phương án nào — cần đề ra` (g14-105) từ tuần mở tới tuần này. Vấn đề ngoài khoảng → Q22.
  - **Chú thích** một dòng (g8-133): `✓ Tiến bộ rõ · ◐ Tiến bộ một phần · ✗ Không tiến bộ / Kém hơn · Đang thực hiện (viền
    đỏ = quá hạn cập nhật) · Chưa có PA · tuần này`. Không `SectionNote`.
  - Rỗng: không có lộ trình → `Empty` `Chưa có Case nào để hiển thị trong hành trình` (g14-015 bản đã sửa).
- **`NganCase.tsx`** (Q9): `NganCase({ caseId, paId, studentName, onClose })` bọc `Drawer` + `CasePanel compact` (giữ tiêu đề
  hiện có). Sau khi mở: `MutationObserver` trên khung ngăn (tối đa 3 giây) tìm `[data-pa-id="{paId}"]` → `scrollIntoView({
  block: 'center' })` + `outline` 2 giây; không thấy thì thôi (không báo lỗi). Thay `Drawer` ở `StudentDetailPage.tsx:338-341`
  bằng `NganCase`; state `openCase` thành `{ caseId, paId? } | null`.
- **Mốc học tập** (Q8): khối dưới lưới, tiêu đề `Mốc học tập`, nút `Mở toàn hành trình` / `Chỉ xem mốc chính`, dùng lại
  `Episode` (`StudentDetailPage.tsx:530-583`), **bỏ** `SectionNote` dòng 308-311; ngày qua `ngay()`.
- Chữ trong file mới: không `case` viết thường (viết `Case`), không `biện pháp`, không `Hãy`.

**Xong khi:** `npm run check` xanh (typecheck bắt được `JourneyTimeline` còn bị import). Phép kiểm quét nguồn (thêm vào
`hanhTrinh.tests.ts`, ≥ 3): `JourneyTimeline.tsx` không còn; `HanhTrinh.tsx` không chứa `dự kiến`, `SectionNote`,
`weekCodeOf`; `StudentDetailPage.tsx` không chứa `Các mốc đã qua`. Commit `PR-Qb (4): tab Hành trình theo lịch, mỗi kỹ năng một hộp, ngăn Case cuộn tới PA`.

### Task 5: Web — R7/R8c: mở đúng đợt, bốn ô bấm được

**File:** `web/src/modules/students/StudentDetailPage.tsx`.

- Đọc tham số bằng `docThamSoHoSo(params.get)` (thay đọc lẻ `lo-trinh`, `tab` ở dòng 53, 86). Có `dot` mà không có
  `lo-trinh` → gọi `/students/{id}?attemptId={dot}` (Task 3.1). Có `dot`/`kn` → tab Học thuật.
- `dot`: bảng `IeltsAttempts`/`RatioAttempts` (dòng 426, 480) nhận `dotId`; dòng khớp có `id="dot-{id}"`, nền nhấn nhạt,
  và ô cuối thêm link chữ nhỏ **`Hồ sơ đợt ›`** → `attemptHref(a)` (dòng khác giữ bấm cả dòng như cũ). Sau khi dữ liệu có,
  `scrollIntoView({ block: 'center' })` **một lần**.
- `kn`: `setSkillPick(category)` (map `writing` ↔ `writing1` theo bộ hạng mục của lộ trình; không khớp thì bỏ) và cuộn tới
  khung bao `Card "Tiến độ và hỗ trợ theo kỹ năng"` (đặt `id="bang-ky-nang"` ở thẻ bao **trong** StudentDetailPage — không sửa
  `SkillBoard`). Có `kn` thì cuộn tới bảng kỹ năng thay vì dòng đợt.
- `case` (+`pa`): mở `NganCase` khi tải xong; đóng ngăn thì xoá `case`/`pa` khỏi URL (`replace`).
- **R8c** (Q11): `Stat` (dòng 409-424) nhận `onClick?`; có thì vẽ `<button type="button">` cùng khung, `hover` gạch chân giá
  trị, `title` nói sẽ mở gì. Bốn hành vi đúng Q11; bấm khi đang ở tab khác → về Học thuật rồi cuộn.
- Mọi link hồ sơ trong trang (nếu có) dùng `duongHoSoHocVien`.

**Xong khi:** check xanh; phép kiểm quét nguồn (≥ 2): `StudentDetailPage.tsx` gọi `docThamSoHoSo`, không còn
`params.get('lo-trinh')`. Commit `PR-Qb (5): mở đúng đợt ?dot=&kn=, bốn ô số bấm được`.

### Task 6: Web — đầu hồ sơ lớp thường, chữ §6, khối SOS, G-5

**Files:** `StudentDetailPage.tsx`, `shared/domain/display.ts`, `web/src/ui/KetQuaDot.tsx`, `shared/domain/hoSoHocVien.ts`.

1. **Đầu hồ sơ** (dòng 134-141, Q18): FT giữ `· mục tiêu {band}`; lớp thường (`cy?.ratio` hoặc `currentClass.khoa`) ghi
   `{mã lớp} · GVCN {tên} · {chinh}{phu ? ' · ' + phu : ''}` từ `khoaLopThuong({ maChuongTrinh: khoa.ma, tuanHienTai,
   tongTuan, tuanKetThuc, tiepTheo: null, homNay })` — bỏ tên chương trình, bỏ `kết thúc {endWeek.code}` (có năm).
   Chú thích một dòng: PR-LT truyền `tiepTheo`.
2. **`attemptProgressView` + `KetQuaDot`** (Q17): thêm `cheDo`; HeaderStats (dòng 379-385) truyền `cheDo` theo `kq`/lộ trình.
   `ketQuaTestGanNhat` (`hoSoHocVien.ts:122`): nhãn `{Giữa khoá|MT n} · {tuanLich(weekStart, homNay)}` — thêm `weekStart`
   vào `LuotTomTat` (profile đã trả `weekStart`), bỏ `periodCode` có năm; nhận `homNay` tuỳ chọn.
3. **HeaderStats** dòng 390-392: lớp thường `mọi môn đạt` thay `mọi môn đạt kỳ vọng`.
4. **Bảng lượt** (dòng 426-522): cột Tuần = `tuanLich(a.weekStart, homNay)` (G-6). `RatioAttempts`: hint cột Bài `Giữa khoá
   hay Cuối khoá của khoá học`; hint Điểm `Số câu đúng / tổng số câu từng môn. Đạt khi từ 70% trở lên.`; hint Kết quả `Số
   môn chưa đạt — chính là mức SOS. Môn chưa có điểm không tính là chưa đạt.`; `Chờ {n} môn`, `mới {k}/{n} môn`. Nhãn môn
   `L R W S` (G-7 tooltip).
5. **G-5:** xoá `SectionNote` dòng 232-235 (`Số MT đánh lại từ 1…`), 251-256 (thay bằng một dòng chữ mờ `Chưa ghi điểm đầu
   vào.` chỉ cho FT), 640-646 (thay ⓘ `Info`/`Th hint` cạnh tiêu đề: một câu "Tín hiệu chờ người dạy xem bài; hạn 3 ngày.").
   Bỏ import `SectionNote` nếu không còn dùng.
6. **Khối SOS** (Q19, dòng 601-651): lớp thường (`sg.kind === 'normal'`) ghi `{sg.label} {score}/{total} · {Giữa khoá|Cuối
   khoá}` (theo `sg.attemptKind`); FT giữ band + `MT{n}`. Nút `Tạo Case` (thay `Mở case`); thêm `Bỏ qua` khi
   `sg.actions.includes('dismiss')` → `api.post('/signals/pending/{id}/dismiss', {})`, toast, `reload()`. Bỏ câu "Hệ thống mới chỉ
   đọc được con số…".
7. Chú thích đầu file (dòng 26-48) sửa cho khớp (3 tab, Hành trình theo giai đoạn) — ngắn.

**Phép kiểm (≥ 4):** `attemptProgressView({…, cheDo: 'ratio'})` đủ điểm đạt hết → `Đạt 4/4 môn`, không chứa `kỳ vọng`;
một phần → chứa `môn đã chấm`; gọi cũ không `cheDo` → chữ FT không đổi; quét `StudentDetailPage.tsx`: không `Số MT đánh
lại`, `Progress Test`, `Final Test`, `Lớp Normal`, `Mở case`. Commit `PR-Qb (6): đầu hồ sơ lớp thường, chữ lớp thường, khối tín hiệu SOS`.

### Task 7: AN-9, R8a, R8b, thông báo trên thanh đầu

1. **AN-9:** `StudentYThucSection.tsx:47-52` thêm prop `canhBao?: { message: string } | null`; khi prop **được truyền**
   (kể cả `null`) thì `useApi` cảnh báo nhận URL `null` (không gọi). `StudentDetailPage.tsx:264` truyền `canhBao={warn.data ?? null}`.
   Khi `warn.loading` vẫn truyền `null` (banner tự hiện khi có). Kiểm bằng tab mạng ở Task 9: mở hồ sơ + tab Ý thức → **1**
   lần `/violation-warning`.
2. **R8b** (`ClassRoster.tsx`, khối "các cột điểm"): `Link to={h.kind === 'mock' ? '/mock-test/…' : …}` →
   `to={duongHoSoHocVien(s.id, { dot: h.id })}`; `title` `Mở hồ sơ {tên} ở {h.label}`.
3. **R8a** (`StudentsPage.tsx`, dòng `x.key === 'cham' ? \`/test/can-cham?classId=${lop.id}\``): thêm `&scope=mine` khi Phạm
   vi đang chọn là `toi`. Tên tham số: đọc `qScope` trong `routes/index.ts` (Rc1) — nếu Rc1 chưa merge, dùng giá trị
   `mine` như `WorkScope` hiện có và ghi Nhật ký.
4. **Header** (`web/src/modules/platform/Header.tsx:86-99`): thay `if (n.entity_type === 'assessment_attempt') navigate(…)`
   bằng `const den = duongThongBao(n); if (den) navigate(den);`, xoá khối chú thích cũ 89-97 (giữ một dòng).

**Phép kiểm (≥ 3, quét nguồn):** `StudentYThucSection.tsx` có `canhBao`; `ClassRoster.tsx` không còn `/mock-test/` ở nhãn
đợt và có `duongHoSoHocVien`; `Header.tsx` dùng `duongThongBao`. Commit `PR-Qb (7): một lần gọi cảnh báo, nhãn đợt mở hồ sơ, thông báo mở đúng chỗ`.

### Task 8: AN-10 + tài liệu

1. **AN-10:** ở 375px không phần tử nào của hồ sơ HV (3 tab) và hồ sơ lớp làm trang cuộn ngang: bảng lượt (`IeltsAttempts`,
   `RatioAttempts`) nằm trong `overflow-x-auto` của thẻ, thêm `min-w-[640px]` cho bảng để cột không bị ép vỡ chữ; lưới Hành
   trình như Task 4. Không còn nhãn `dự kiến` nào tuyệt đối vị trí. (Đo ở Task 9.)
2. **Spec §4** (`…ux-toan-web-truoc-deploy-design.md`, bảng định vị) thêm dòng:
   `| Hồ sơ HV mở đúng đợt (?dot=&kn=) | nhãn MT ở tab Học viên của Hồ sơ lớp · ghim Đợt Test ở Hành trình · ô Kết quả Test gần nhất · thông báo | trong phạm vi |` (G-12).
3. `CODE_MAP.md`: dòng Hồ sơ HV → `HanhTrinh.tsx`, `NganCase.tsx`, `server/src/students/hanhTrinh.ts`,
   `shared/domain/hanhTrinh.ts`, `duongHoSo.ts`, `platform/thongBao.ts`; xoá dòng `JourneyTimeline`.
4. `plan.md`: tick R7, R8 (ghi rõ a–d + notifications), mục 12.5, 12.18 (AN-9, AN-10); kiểm kê: Q9, R7, R8, AN-9, AN-10 →
   ✅ kèm "PR-Qb".

Commit `PR-Qb (8): 375px hồ sơ học viên, bảng định vị, CODE_MAP, đánh dấu việc đã xong`.

### Task 9: Bấm thử một lần, push, mở PR

- [ ] `npm run check` → ghi số (≥ **B + 40**). `git diff origin/main...HEAD --stat -- server/src/schema.sql server/src/migrate.ts`
  → **rỗng**.
- [ ] Máy chủ thử trong worktree (bộ nhớ "Máy chủ dev trong worktree"): DB riêng `PISA_DB=<tmp>/pr-qb-kiem.sqlite npm run seed`;
  `PORT=4157 PISA_DB=… npm run dev:api` (nền); file Vite tạm ở gốc worktree (cổng **5357**, proxy `/api` → `127.0.0.1:4157`,
  **không commit, xoá sau**). Trình duyệt: Playwright kênh Chrome hoặc khung Browser; đăng nhập `POST /api/demo/session`.
- [ ] **KIỂM** (ghi từng ý vào Nhật ký; ảnh `thiet-ke/anh/pr-qb/NN-ten-1440.png` / `-375.png`):
  1. **QL, HV 1 (Nguyễn Minh An)** · tab Hành trình: hai nút `Lớp thường · …` / `Fast Track · …`; FT: trục 13 tuần (tới `W4 SEP`, ngày demo 14/09) + `W1…`,
     tuần này tô sáng; ghim `MT{n} · …`; 5 hộp L R W1 W2 S; chip lọc chạy; `Cả giai đoạn` rộng ra và cuộn ngang **trong thẻ**.
  2. Chọn `Lớp thường`: hàng `Khoá` hai đoạn FOU → BE đúng thứ tự; ghim `Giữa`/`Cuối`; chuỗi `%`; 4 hộp; **không** chữ `MT`.
     Hộp Reading có vấn đề (Case 1) + khối PA.
  3. Bấm một khối PA → ngăn Case bên phải mở, tab không đổi; (nếu Form đã có `data-pa-id`) cuộn tới đúng PA. Bấm tên vấn đề
     → cùng ngăn. Bấm ghim → sang Học thuật, dòng đợt tô sáng, có `Hồ sơ đợt ›`; Back → về Hành trình.
  4. Bốn ô số: mỗi ô bấm dẫn đúng chỗ (Q11). `?dot=` của một đợt lộ trình cũ (FOU) → đầu trang chuyển đúng lộ trình.
  5. **GVCN lớp thường MB-FOU 12**, hồ sơ một em: đầu hồ sơ `MB-FOU 12 · GVCN … · FOU · W{n}/8 · kết thúc W… …`, không mục
     tiêu; ô Kết quả `Đạt k/n môn`; bảng `Kết quả kiểm tra` tuần dạng `W3 SEP`; khối SOS (nếu có) `Tạo Case` · `Bỏ qua`.
  6. **GV Listening MB-FT 101**: tab Học viên của hồ sơ lớp → bấm nhãn `MT{n}` → hồ sơ em đúng đợt. Chuông thông báo: bấm
     một thông báo SOS/Case → đúng hồ sơ + ngăn Case.
  7. Tab mạng: mở hồ sơ rồi tab Ý thức → `/violation-warning` **1** lần (AN-9).
  8. **375px** (hồ sơ HV 3 tab + hồ sơ lớp): `document.documentElement.scrollWidth <= 375` và `main.scrollWidth <= main.clientWidth`
     ở mọi tab; lưới Hành trình cột tên đứng yên, trục cuộn; không nhãn lòi (AN-10).
  9. Chữ: không thấy `Đạt kỳ vọng` ở màn lớp thường của PR này, không ngày ISO, không `W3 SEP 2026` khi cùng năm.
- [ ] Xoá file Vite tạm; `git status` sạch trừ ảnh + Nhật ký.
- [ ] `git fetch origin && git rebase origin/main` (xung đột ở file "chỉ thêm khối" `routes/index.ts`, `shared/domain/index.ts`,
  `run.ts` → giữ cả hai); `npm run check` lại.
- [ ] Push, mở PR `PR-Qb · Hồ sơ học viên: Hành trình theo lịch, mở đúng đợt, chữ lớp thường` — mô tả: phạm vi, bảng Q
  (tóm tắt), số phép kiểm B → cuối, kết quả KIỂM, việc chuyển PR khác. Cuối mô tả dòng attribution theo quy ước. Báo planning.

---

## Chuyển cho PR khác

- **PR-Form (`CasePanel.tsx`) — cần 1 dòng:** trong `timeline.map` (`CasePanel.tsx:~195`), thẻ `<li>` của mục phương án (khoá
  `i${iv.id}`) thêm `data-pa-id={iv.id}` (có thể lấy từ `ev.key` hoặc thêm trường `paId` vào `TimelineItem`). Qb đã đọc
  thuộc tính này để cuộn tới PA (Q9). Chưa có thì ngăn Case vẫn mở đúng, chỉ không cuộn.
- **PR-LT:** (1) bảng **Lịch sử lớp** (11 §4) đặt ở **đầu** tab Hành trình, trên hàng nút giai đoạn; (2) truyền nhãn Lộ
  trình tiếp theo vào `khoaLopThuong({ tiepTheo })` ở đầu hồ sơ (`StudentDetailPage`) — hiện truyền `null`; (3) nhãn
  `systemCloseLabel` cho Case hệ thống đóng hiện được ở tooltip khối vấn đề nếu cần.
- **PR-S3:** tiêu đề sự kiện hành trình do máy chủ ghi (`mock_scheduled` "Lên kế hoạch MT", `mock_result` "Kết quả MT"…,
  `JOURNEY_EVENT_LABEL` `shared/domain/students.ts:56`) còn chữ `MT` cho lượt lớp thường trong danh sách "Mốc học tập" chế
  độ toàn bộ; tiêu đề ngăn `Vấn đề - Case`.
- **PR-Rc1/Rc2:** không có việc chuyển. `Hồ sơ đợt ›` dùng `attemptHref` — Rc1 hợp nhất lưới nên đường lớp thường tự đúng.

## Mâu thuẫn nguồn ↔ mã (đã xử lý)

| # | Mâu thuẫn | Xử lý |
|---|---|---|
| 1 | Mockup 08e "Tháng 7 · W1–W4" ↔ G-6 + `week.ts` (tháng 4–5 tuần, mã `SEP`) | Q2 |
| 2 | Kiểm kê Q9 "mặc định 6–8 tuần, lựa chọn Ý thức" ↔ mockup "3 tháng" + quyết định 4.12 | Q3, Q8 |
| 3 | Mockup 08e badge "chưa ổn" ↔ spec §2 "Cần hỗ trợ" | spec thắng (Q6) |
| 4 | Kiểm kê R8a "nút lớp không mang scope, badge mở hàng đợi" ↔ mã sau Qa (badge → Cần chấm, nút mang `periodId`) | Q13: chỉ còn `scope` |
| 5 | Kiểm kê R8b "nhãn Final ở ClassRoster" ↔ sau Qa `ClassRoster` chỉ FT | Q14 |
| 6 | Spec "cuộn tới đúng PA" ↔ `CasePanel` (file Form) không có mốc DOM cho PA | Q9 + chuyển Form |
| 7 | plan.md 12.18 coi "bảng cuộn ngang trong thẻ" là lỗi ↔ G-11 coi đó là hành vi đúng | AN-10 = kiểm trang không cuộn ngang + bỏ nhãn lòi |
| 8 | Spec §6 `display.ts:152` "Đạt kỳ vọng" ↔ hàm dùng chung cho FT | Q17 thêm `cheDo` |
| 9 | `JourneyTimeline` dùng `weekCodeOf`; `ketQuaTestGanNhat` dùng `periodCode` ("W3 SEP 2026") | G-6: `tuanLich` |
| 10 | Hành trình cũ đọc `skill-board` theo **một** lộ trình ↔ §3.8 giai đoạn gồm nhiều lộ trình (FOU→BE) | endpoint mới Task 2 |

## Nhật ký thực thi

*(Người code ghi: model thật, B và số phép kiểm mỗi Task, kết quả KIỂM từng ý, chỗ tự quyết thêm.)*

- **Task 0:** Model thật = Sonnet 5. Qa (#69) đã merge trên `origin/main` (69910fd) — 3 điều kiện kiểm đều đạt. Worktree
  `.claude/worktrees/pr-qb-ho-so-hoc-vien` tạo từ `origin/main`, `npm ci` xong. Biến Turso: sạch. `npm test` → **B = 837**
  kiểm tra đạt. File kế hoạch đã có sẵn trên `main` (không cần chép thêm) — không có gì khác để commit ở bước này.
- **Task 1:** `duongHoSo.ts` + `hanhTrinh.ts` tạo đúng bản đồ file. Hai chỗ tự quyết vì kế hoạch không nói rõ mã thật:
  (1) `caseTitleOf` không tồn tại trong `cases.ts` — hàm đúng tên là `caseTitle`; Task 2 sẽ dùng tên này.
  (2) `cotCua` — kế hoạch ghi "ngoài trục trả thêm cờ `cat`" nhưng cũng ghi kiểu trả về là `number`; hai câu mâu
  thuẫn nhau. Giữ đúng kiểu trả về đã ghi (`number`, kẹp `[0, soTuan-1]`), bỏ phần "cờ cắt" — việc phát hiện Case
  nằm ngoài khoảng đang xem (Q22, "+{n} vấn đề cũ hơn") để Task 2 tự so ngày ở máy chủ, không phụ thuộc `cotCua`.
  `npm run check` xanh, **853 = 837 + 16** (đủ ≥16). Commit `PR-Qb (1)`.
- **Task 2:** `server/src/students/hanhTrinh.ts` + route `GET /students/:id/hanh-trinh`. Ba chỗ tự quyết:
  (1) Kế hoạch liệt kê "lớp lấy từ `enrollments` trùng thời gian" cho nhãn đoạn lớp thường, nhưng bảng
  `enrollments` KHÔNG nằm trong danh sách 6 truy vấn cố định của chính kế hoạch — thêm một truy vấn riêng cho
  việc này phá vỡ ngân sách. Chọn: lấy mã lớp từ `class_code` của lượt gần nhất trong lộ trình đó (đã có sẵn ở
  truy vấn (2)), không có lượt nào thì lấy tên chương trình — không cần truy vấn thêm.
  (2) "Tuần cuối theo chương trình" (`den` của đoạn lớp thường khi lộ trình chưa có `ended_at`) cần một truy vấn
  `report_periods` theo TỪNG lộ trình — đây là chi phí phụ thêm ngoài 6 câu cố định, nhưng bị chặn bởi SỐ LỘ
  TRÌNH (luôn nhỏ, 1–3), không bởi số Case, nên không phạm tinh thần "không N+1 theo Case" mà phép kiểm hiệu năng
  đang bắt.
  (3) `caseTitleOf` trong bản đặc tả không tồn tại (đã ghi ở Task 1) — dùng `caseTitle`.
  `npm run check` xanh, **861 = 853 + 8** (đủ ≥8). Commit `PR-Qb (2)`.
- **Task 3:** `profile.ts` (R7 chọn lộ trình theo `attemptId`, `currentClass.khoa`, `headline.next.category`, bỏ
  Ý thức khỏi mốc + toàn bộ sự kiện), `platform/thongBao.ts` (mới), route `/students/:id` nhận `attemptId`,
  `/notifications` gọi `thongBaoCua`. Không có chỗ mâu thuẫn kế hoạch/mã cần tự quyết ở Task này — khớp đúng bản
  đồ file. `npm run check` xanh, **867 = 861 + 6** (đủ ≥6). Commit `PR-Qb (3)`.
- **Task 4:** `HanhTrinh.tsx` (mới, thay `JourneyTimeline.tsx` — đã xoá), `NganCase.tsx` (mới); sửa
  `StudentDetailPage.tsx` (khối tab Hành trình, `openCase` đổi sang `{caseId; paId?}|null`, export `Episode` +
  đổi `fmtDate`→`ngay`). Tự quyết: (1) lưới dùng CSS Grid với số hàng CỐ ĐỊNH gán tay (`gridRow` tường minh)
  thay vì để trình duyệt tự xếp (`grid-auto-flow`) — nhiều khối PA dùng chung cột nhưng khác tầng nếu không ghim
  `gridRow` tay sẽ bị trình duyệt tự đẩy sai hàng; mỗi vấn đề vẽ thành MỘT lưới con riêng (không gộp chung một
  lưới khổng lồ với cả hộp) để không phải cộng dồn số hàng giữa nhiều Case. (2) "Mốc học tập" (Q8) chuyển hẳn
  vào `HanhTrinh.tsx`, nhận `episodes`/`allEpisodes` làm prop từ `StudentDetailPage` (dữ liệu đó nằm ở hồ sơ
  chính `/students/:id`, không phải endpoint `/hanh-trinh`); `HanhTrinh.tsx` import `Episode` ngược lại từ
  `StudentDetailPage.tsx` (import vòng an toàn vì chỉ gọi trong JSX, không gọi lúc nạp module). `npm run check`
  xanh, **870 = 867 + 3** (đủ ≥3). Chưa bấm thử trên trình duyệt — để dành đúng một lần ở Task 9 theo quy trình
  nhanh. Commit `PR-Qb (4)`.
- **Task 5:** `StudentDetailPage.tsx` — đọc mọi tham số qua `docThamSoHoSo`; `?dot=` không có `lo-trinh` gọi
  `attemptId`; `?dot=`/`?kn=` ép tab Học thuật + cuộn một lần (hiệu ứng khoá theo `[!!data, p.dot, p.kn]`, không
  khoá theo tham chiếu `data` để tránh cuộn lại mỗi lần tải nền); bảng lượt thêm `id="dot-{id}"` + nền nhấn +
  link "Hồ sơ đợt ›"; bốn ô số (`Stat`) nhận `onClick` thành nút thật; `?case=`/`?pa=` mở `NganCase`, đóng thì
  xoá khỏi URL. Tự quyết: `kn` ↔ hạng mục bảng kỹ năng dùng hàm `anhXaKyNang` cục bộ trong file (ghép
  writing↔writing1 khi lệch bộ lớp thường/FT) — không đưa vào `shared/domain` vì đây thuần là quyết định vẽ
  UI, không phải luật máy chủ cần kiểm bằng harness. `npm run check` xanh, **872 = 870 + 2** (đủ ≥2). Commit
  `PR-Qb (5)`.
- **Task 6:** Đầu hồ sơ lớp thường dùng `khoaLopThuong` (bỏ tên chương trình, bỏ "kết thúc {endWeek.code}" có
  năm); `attemptProgressView`/`KetQuaDot` thêm `cheDo` (mặc định `ielts`, gọi cũ không đổi); `ketQuaTestGanNhat`
  đổi `periodCode` → `weekStart` + `tuanLich` (G-6, không còn năm khi cùng năm hôm nay) — cập nhật fixture của
  phép kiểm CŨ `hoSoHocVien.tests.ts` cho khớp field mới (bắt buộc phải sửa, không phải tự ý đổi phép kiểm PR
  khác: `LuotTomTat` đổi kiểu thì test cũ dùng field cũ không biên dịch được nữa); bảng lượt lớp thường đổi
  "phần" → "môn", nhãn môn rút gọn L/R/W/S kèm tooltip; ba `SectionNote` bỏ (một xoá hẳn, hai thay bằng dòng chữ
  mờ / icon ⓘ cạnh tiêu đề); khối SOS "Mở case" → "Tạo Case" + nút "Bỏ qua" (gọi route dismiss có sẵn, không
  cần sửa server). Tiện thể đổi hai chữ "Lớp Normal"/"Mở case" còn sót trong CHÚ THÍCH mã (không phải chữ người
  dùng thấy) để khớp phép kiểm quét chữ cấm — quét cả file thay vì phải bỏ qua chú thích cho đơn giản.
  `npm run check` xanh, **876 = 872 + 4** (đủ ≥4). Commit `PR-Qb (6)`.
- **Task 7:** `StudentYThucSection.tsx` nhận `canhBao?` (AN-9 — chỉ `StudentDetailPage` gọi `/violation-warning`,
  component con dùng lại qua prop, `undefined` thì vẫn tự tải như cũ cho chỗ khác chưa kịp gom lại không vỡ);
  `ClassRoster.tsx` nhãn đợt dùng `duongHoSoHocVien` (R8b); `StudentsPage.tsx` (`HopLop`/`denBadge`) thêm
  `&scope=mine` khi Phạm vi đang chọn là `toi` (R8a — xác nhận `qScope`/`WORK_SCOPES` của Rc1 ĐÃ có sẵn trong
  `routes/index.ts`, không phải tự dựng giá trị dự phòng như kế hoạch tính trước cho trường hợp Rc1 chưa merge);
  `Header.tsx` thông báo điều hướng bằng `duongThongBao` (bỏ khối chú thích cũ về SOS/mock_attempt). `npm run
  check` xanh, **879 = 876 + 3** (đủ ≥3). Commit `PR-Qb (7)`.
- **Task 8:** AN-10: `IeltsAttempts`/`RatioAttempts` thêm `min-w-[640px]` cho `<table>` trong khung `overflow-x-auto`
  sẵn có. Tài liệu: spec §4 thêm dòng "Hồ sơ HV mở đúng đợt"; `CODE_MAP.md` ba dòng `JourneyTimeline` →
  `HanhTrinh.tsx`/`NganCase.tsx`/`hanhTrinh.ts`; `plan.md` tick R7/R8 (a–d + notifications), đánh dấu ✅ hai dòng
  AN-9/AN-10 ở mục 12.18, ghi chú mục 12.5 đã xong (giữ bảng khảo sát cũ để đọc lịch sử); kiểm kê
  `2026-09-22-kiem-ke-truoc-deploy.md` đổi Q9/R7/R8/AN-9/AN-10 từ ❌ sang ✅ kèm "PR-Qb". `npm run check` xanh,
  **879** (không đổi số phép kiểm — Task này chỉ có một dòng CSS + tài liệu, không thêm luật mới). Commit
  `PR-Qb (8)`.
- **Task 9:** `npm run check` cuối cùng: **879 = B(837) + 42** (đủ ≥ B+40). `git diff origin/main...HEAD --stat --
  server/src/schema.sql server/src/migrate.ts` → rỗng (không đổi schema/migrate).

  **Máy chủ thử:** DB riêng seed ở thư mục scratch (`PISA_DB=…/pr-qb-kiem.sqlite npm run seed`), `PORT=4157
  npm run dev:api` nền, Vite tạm `vite.pr-qb.config.ts` ở gốc worktree (cổng **5357**, proxy `/api` →
  `127.0.0.1:4157`) — đã xoá sau khi xong, không commit. Dùng khung Browser (không có Playwright cài trong repo)
  qua `POST /api/demo/session`.

  **KIỂM** (vai admin = HV1, vai GVCN/GV Trần Ngọc Hà = MB-FOU 12 & MB-FT 101):
  1. HV1: hai nút giai đoạn hiện đúng (`Lớp thường · W1 DEC 2025 – W4 APR` / `Fast Track · từ W1 JUN`); FT trục
     13 tuần JUL–SEP, cột tuần này (W3 SEP) tô sáng; ghim `MT1 · 5.5 · SOS 1`, `MT2 · 6.0`, `MT3` (chưa điểm);
     5 hộp L R W1 W2 S đúng thứ tự. ĐẠT.
  2. Chọn "Lớp thường": hàng Khoá `MB-FOU 03 · 8 tuần` → `MB-BE 08 · 10 tuần` đúng thứ tự; ghim `Giữa`/`Cuối`
     (không "MT"); chuỗi `%` (`65% → 68% → 63% → 55%`); 4 hộp; hộp Reading có vấn đề "Cuối khoá - Reading dưới
     kỳ vọng" + khối PA `Xếp tự học · Đang thực hiện · Quá hạn cập nhật`. ĐẠT.
  3. Bấm khối PA → ngăn Case mở (`NganCase`), tab Hành trình không đổi, case đúng ("Reading cuối khoá Beginner
     còn dưới ngưỡng"). Bấm ghim (qua ô "Kết quả Test gần nhất") → sang Học thuật, dòng `dot-6` (MT2) tô nền
     `--accent-soft`, có link "Hồ sơ đợt ›". ĐẠT — không kiểm riêng nút Back (logic tham số URL đối xứng, không
     có state ẩn).
  4. Bốn ô số: "Kết quả Test gần nhất" → `?dot=6` + tô đúng dòng; "Kỹ năng cần hỗ trợ" → `?kn=writing1` + mở
     đúng hàng Writing Task 1; "Case đang mở" → `?kn=reading`; "Việc cần làm tiếp" → `?kn=reading`. ĐẠT cả 4.
     (`attemptId` của lộ trình cũ → chọn đúng lộ trình đã có phép kiểm tự động ở Task 3, không lặp lại bằng tay.)
  5. GVCN lớp thường MB-FOU 12 (HV9): đầu hồ sơ `MB-FOU 12 · GVCN Trần Ngọc Hà · FOU · W8/8 · kết thúc W3 SEP`
     (không "mục tiêu"); ô Kết quả `Chưa đạt 3/4 môn · SOS 3`; bảng "Kết quả kiểm tra" tuần dạng `W3 AUG`/
     `W1 OCT` (không năm, không ISO); chèn tạm một tín hiệu lớp thường (dữ liệu demo không sẵn có tín hiệu nào
     kiểu lớp thường — DB tạm, không ảnh hưởng bản chính) → khối SOS đúng `Listening 26/40 · Giữa khoá`, hai nút
     `Bỏ qua`/`Tạo Case`; bấm `Bỏ qua` → khối biến mất (route dismiss có sẵn chạy đúng). ĐẠT.
  6. GV Listening MB-FT 101 (Trần Ngọc Hà): hồ sơ lớp tab Học viên, nhãn `MT2` của Nguyễn Minh An có href
     `/hoc-vien/1?dot=6` — đúng `duongHoSoHocVien`. Chuông thông báo: bấm "SOS 1 — Bùi Thảo Vy" (loại
     `assessment_attempt`, `kind=sos`) → điều hướng đúng `/hoc-vien/44?dot=118`. `GET /notifications` trả kèm
     `student_id`/`attempt_id` cho mọi dòng (xác nhận JOIN của Task 3). Badge "Bạn cần chấm: N bài" ở
     `StudentsPage` mang `&scope=mine` đúng khi Phạm vi = "Lớp tôi dạy". ĐẠT.
  7. Tab mạng: mỗi lần điều hướng đầy đủ trang gọi `/violation-warning` đúng **một lần về mặt logic** (React
     StrictMode của môi trường dev nhân đôi mọi hiệu ứng — 2 lần quan sát được mỗi lượt điều hướng, ĐÚNG bằng
     một nửa so với trước khi sửa AN-9 vốn sẽ ra 4 lần/lượt do gọi ở cả `StudentDetailPage` lẫn
     `StudentYThucSection`). ĐẠT theo đúng tinh thần AN-9.
  8. 375px: đo `document.documentElement.scrollWidth` và `main.scrollWidth <= main.clientWidth` ở cả ba tab
     (Học thuật/Ý thức/Hành trình) của hồ sơ HV1 và ở hồ sơ lớp MB-FT 101 — cả bốn đều **không cuộn ngang**
     (`scrollWidth` khớp `375`/`365`). Lưới Hành trình cuộn ngang ĐÚNG BÊN TRONG khung thẻ (cột tên đứng yên).
     ĐẠT.
  9. Chữ: không thấy "Đạt kỳ vọng" ở màn lớp thường của PR này (chỉ "Đạt X/Y môn"/"Chưa đạt"); không ngày ISO;
     mọi mã tuần hiện không kèm năm khi cùng năm 2026 (`W3 SEP`, `W1 OCT`…). ĐẠT.

  **Chưa làm:** ảnh chụp `thiet-ke/anh/pr-qb/*-1440.png`/`-375.png` — khung Browser trong môi trường này không
  có primitive lưu ảnh ra đĩa (Playwright không có sẵn trong repo); đã xác nhận đúng bằng đọc DOM/mạng thay vì
  bằng mắt, planning xem lại nếu cần ảnh thật.

  `git status` sạch (file Vite tạm và sửa `launch.json` tạm thời đã bỏ, không commit). `git fetch origin &&
  git rebase origin/main` — [ghi kết quả rebase thực tế bên dưới].
