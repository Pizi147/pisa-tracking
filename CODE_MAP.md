# Muốn sửa chức năng X thì tìm ở đâu?

Tài liệu này để trả lời đúng một câu hỏi: *"tôi muốn đổi chỗ này, phải mở file nào."*

Hệ thống chia theo **nghiệp vụ**, không chia theo kỹ thuật. Cùng một module thì cả phần dữ
liệu, phần giao diện và phần kiểm thử nằm cạnh nhau, để sửa một chức năng không phải đi tìm
ba nơi.

---

## Tám module

| Module | Trả lời câu hỏi | Máy chủ | Giao diện |
|---|---|---|---|
| **Học viên** | Em này là ai, đang học gì, đã đi qua những đâu | `server/src/students/` | `web/src/modules/students/` |
| **Lớp học** | Lớp nào, ai dạy, ai đang học, chuyển lớp thế nào | `server/src/classes/` | `web/src/modules/classes/` |
| **Fast Track** | Tuần Mock Test, điểm band, mức SOS, dự kiến thi | `server/src/fasttrack/` | `web/src/modules/fasttrack/` |
| **Normal** | FOU/BE/ELE, bốn môn L/R/W/S, điểm đạt/tổng điểm, chuyển tiếp lớp | `server/src/normal/` | `web/src/modules/normal/` |
| **Case** | Vấn đề của em, phương án, phê duyệt, kết quả | `server/src/cases/` | `web/src/modules/cases/` |
| **Tổng quan và công việc** | Ai phải làm gì, cả chi nhánh đang thế nào | `server/src/worklist/` | `web/src/modules/worklist/` |
| **Nền tảng** | Tài khoản, quyền, tuần, danh mục, nhật ký thay đổi | `server/src/platform/` | `web/src/modules/platform/` |
| **Dùng chung** | Badge, nút, panel, bảng, chọn tuần | — | `web/src/ui/` |

Từ vựng nghiệp vụ (nhãn, hằng số, luật thuần) nằm ở `shared/domain/`, chia theo **đúng tám
module trên**. Cả máy chủ lẫn giao diện đọc chung một bộ, nên không có chuyện hai bên gọi
cùng một thứ bằng hai cái tên.

---

## Bộ dữ liệu demo nằm ở đâu

Bộ demo được dựng **từ hành trình học viên**, không phải sinh ngẫu nhiên rồi ghép lại. Bốn
file, mỗi file một việc:

| File | Chứa gì |
|---|---|
| `server/src/seed/journeys.ts` | Kiểu dữ liệu kịch bản · 10 giáo viên · 13 lớp và phân công |
| `server/src/seed/students.ts` | **Toàn bộ hành trình của 41 học viên**, viết tay từng con số |
| `server/src/seed/build.ts` | Đọc kịch bản rồi ghi xuống đúng các bảng, theo đúng thứ tự đời thật |
| `server/src/seed/seed.ts` | Chi nhánh, vai trò, quyền, tài khoản, chương trình, tuần, công việc quản lý |

Muốn **đổi một câu chuyện** thì sửa `students.ts` rồi chạy `npm run seed`. Muốn **thêm một
loại dữ liệu mới** vào kịch bản thì thêm trường ở `journeys.ts` và xử lý ở `build.ts`.

---

## Tra nhanh theo việc muốn sửa

### Học viên

| Muốn sửa | Mở file |
|---|---|
| Cột trong bảng học viên của một lớp | `web/src/modules/students/ClassRoster.tsx` |
| Dữ liệu đổ vào bảng đó | `server/src/classes/classes.ts` → `classRoster` |
| Trang hồ sơ một em | `web/src/modules/students/StudentDetailPage.tsx` |
| Panel "Quản lý học viên" (kế hoạch · đầu vào · mục tiêu · kết luận · chuyển lớp) | `web/src/modules/students/StudentManagePanel.tsx` |
| Biểu đồ tiến bộ theo kỹ năng | `web/src/modules/students/ProgressChart.tsx` · `server/src/students/profile.ts` → `progressOf` |
| Dữ liệu hồ sơ | `server/src/students/profile.ts` |
| Danh sách lớp và tám bộ lọc | `web/src/modules/students/StudentsPage.tsx` |
| Tên và điều kiện của tám bộ lọc | `shared/domain/people.ts` → `STUDENT_FILTERS` |
| Thêm học viên, nhập Excel | `web/src/modules/students/IntakePanel.tsx` · `server/src/classes/intake.ts` |
| Badge "Thiếu thông tin" (chỉ thiếu sót CẢN TRỞ chuyên môn) | `web/src/modules/students/MissingBadge.tsx` · `server/src/classes/schedule.ts` → `missingForStudent` |
| Câu tình trạng đầu hồ sơ ("MT2 đạt kỳ vọng · còn 2 case…") | `server/src/students/standing.ts` |
| Lịch sử điểm 2–3 mốc trên bảng lớp | `web/src/modules/students/ClassRoster.tsx` · `server/src/classes/classes.ts` → `classRoster` (`history`) |
| Chuyển lớp | `server/src/students/students.ts` → `transferStudent` |

### Lớp học

| Muốn sửa | Mở file |
|---|---|
| Trang một lớp | `web/src/modules/classes/ClassOverviewPage.tsx` |
| Tạo lớp | `web/src/modules/classes/ClassCreatePanel.tsx` · `server/src/classes/intake.ts` → `createClass` |
| Phân công giáo viên, ba luật phân công | `server/src/classes/classes.ts` → `setClassTeachers` |
| Tuần khai giảng, tuần Progress/Final Test | `web/src/modules/classes/ClassProgressPanel.tsx` · `server/src/classes/schedule.ts` |
| Lớp đang ở tuần thứ mấy, sắp thi gì | `server/src/classes/schedule.ts` → `classProgress` |

### Fast Track

| Muốn sửa | Mở file |
|---|---|
| Mốc lịch MT mặc định (tuần học 6/12/16/20/24) | `shared/domain/fasttrack.ts` → `MOCK_FT_STUDY_WEEK` |
| Kỳ vọng của từng lượt MT | `shared/domain/fasttrack.ts` → `expectationDelta` |
| Bảng quy đổi số câu đúng → band | `server/src/fasttrack/scoring.ts` |
| Cách tính mức SOS | `server/src/fasttrack/scoring.ts` → `resultOf` |
| Màn một lượt MT | `web/src/modules/fasttrack/MockDetailPage.tsx` |
| Bảng nhập điểm cả lớp | `web/src/modules/fasttrack/ScoreSheetPage.tsx` |
| Panel "Lên kế hoạch MT" | `web/src/modules/fasttrack/MockPlanPanel.tsx` · `server/src/fasttrack/planning.ts` |
| Nhãn "Dự kiến thi" (tuần / chỉ tháng / chưa biết) | `server/src/fasttrack/cycles.ts` → `examPlanOf` · `web/src/ui/ui.tsx` → `ExamPlanText` |
| **Lịch thi, phạm vi, trạng thái thi và hạn chấm CỦA TỪNG KỸ NĂNG** | `server/src/fasttrack/skillSchedule.ts` |
| Hạn chấm của một kỹ năng (FT thứ Tư tuần sau · Normal Chủ nhật cùng tuần) | `server/src/platform/week.ts` → `skillScoreDeadline` · `effectiveSkillDeadline` |
| Tuần kế hoạch hoàn tất của một đợt | `server/src/fasttrack/skillSchedule.ts` → `completionWeekOf` · `recomputeCompletionWeek` |
| Ràng buộc thứ tự đợt khi đổi lịch một kỹ năng | `server/src/fasttrack/skillSchedule.ts` → `checkSkillWeekMove` |
| Bảng "Lịch thi theo kỹ năng" trong màn một lượt MT | `web/src/modules/fasttrack/MockDetailPage.tsx` → `SkillScheduleCard` |
| Lịch MT tự đề xuất | `server/src/classes/schedule.ts` → `suggestedMockWeeks` |
| Lộ trình học của một em, target, dự kiến thi | `server/src/fasttrack/cycles.ts` |

### Normal

| Muốn sửa | Mở file |
|---|---|
| Bốn môn của Normal (L/R/W/S) | `shared/domain/normal.ts` → `REGULAR_SKILLS` |
| Số tuần và mốc kiểm tra từng chương trình | `shared/domain/normal.ts` → `PROGRAMME_TEMPLATES` |
| Ngưỡng đạt (70%) và cách chấm theo tỷ lệ | `shared/domain/normal.ts` → `ratioResult` · `RATIO_PASS_THRESHOLD` |
| Bảng nhập điểm Progress/Final Test | `web/src/modules/normal/RegularSheetPage.tsx` |
| Xử lý điểm và sinh case của Normal | `server/src/normal/regular.ts` |
| Chuyển tiếp lớp FOU → BE → Fast Track | `server/src/classes/transition.ts` · `web/src/modules/classes/TransitionPanel.tsx` |
| Bài nào mở màn nào (Mock Test hay bảng điểm Normal) | `server/src/fasttrack/attempts.ts` → `attemptHref` · `web/src/lib/format.ts` |

### Case

| Muốn sửa | Mở file |
|---|---|
| **Tín hiệu từ điểm** (điểm dưới kỳ vọng sinh gì) | `server/src/cases/signals.ts` |
| Hạn xác minh tín hiệu (3 ngày, tính cả ngày đầu) | `shared/domain/cases.ts` → `signalVerifyDue` |
| Thu hồi tín hiệu và case khi sửa điểm (mục 9.4) | `server/src/cases/signals.ts` → `withdrawSignalsNoLongerValid` · `caseHasIndependentBasis` |
| Thẻ "Tín hiệu chờ xác minh" ở hồ sơ học viên | `web/src/modules/students/StudentDetailPage.tsx` → `PendingSignals` |
| Sáu hạng mục case | `shared/domain/cases.ts` → `CASE_CATEGORIES` |
| Tên case tự sinh | `shared/domain/cases.ts` → `caseTitle` |
| Bảng phân loại nguyên nhân | `shared/domain/cases.ts` → `ISSUE_TAXONOMY` |
| Danh sách phương án, nhóm tự làm / cần duyệt | `shared/domain/cases.ts` → `INTERVENTION_KINDS` |
| Luật sinh case sau mỗi đợt MT | `server/src/cases/sos.ts` |
| Vòng đời case, phương án, phê duyệt, kết quả | `server/src/cases/cases.ts` |
| Màn một case | `web/src/modules/cases/CasePanel.tsx` |
| Bảng theo dõi sáu hạng mục ở hồ sơ | `web/src/modules/cases/SkillBoard.tsx` |
| Khối "Các case của em" ở hồ sơ | `web/src/modules/cases/StudentCases.tsx` |
| Luật hạn chu kỳ hai tuần / một tuần | `shared/domain/cases.ts` → `cycleDeadline` |
| Năm kết quả và năm bước tiếp theo | `shared/domain/cases.ts` → `FOLLOWUP_OUTCOMES`, `nextStepsFor` |
| Một chu kỳ khép lại (gộp ba nút cũ) | `server/src/cases/cases.ts` → `updateResult` |
| Điều kiện được hoàn thành case | `server/src/cases/cases.ts` → `closeBlockers` |
| Điểm giáo viên tự chấm | `server/src/cases/cases.ts` → `normalizeMetrics`, `parseMetrics` |
| Bảng "Vấn đề - Case" và bộ lọc | `web/src/modules/cases/CaseBoardPage.tsx` |

### Tổng quan và công việc

| Muốn sửa | Mở file |
|---|---|
| Danh sách việc của người đang xem | `server/src/worklist/mywork.ts` |
| Màn Tổng quan | `web/src/modules/worklist/OverviewPage.tsx` |
| Khu "Việc cần làm" — bộ lọc, phân trang, năm ô của một dòng | `web/src/modules/worklist/WorkList.tsx` |
| Bảng "Việc cần lưu ý" | `web/src/modules/worklist/BranchPulse.tsx` · `server/src/worklist/branchpulse.ts` |
| Bảng tổng hợp chi nhánh/lớp | `web/src/modules/worklist/SummaryTable.tsx` · `server/src/worklist/summary.ts` |
| Bảng tổng hợp theo tuần | `web/src/modules/worklist/WeeklyBoard.tsx` · `server/src/worklist/weekly.ts` |
| Quản lý giao việc cho giáo viên | `web/src/modules/worklist/ManagerTasks.tsx` · `server/src/worklist/meeting.ts` |
| Khối "Sự kiện nổi bật" (tuần này · tuần tới · tuần nữa) | `web/src/modules/worklist/Highlights.tsx` · `server/src/worklist/highlights.ts` |
| Bảng "Phương án & kết quả" của tab Thực trạng | `web/src/modules/cases/OutcomeTable.tsx` · `server/src/worklist/outcomes.ts` |
| Tên và ý nghĩa của chín nhóm việc | `server/src/worklist/mywork.ts` → `GROUP_META` |
| "Việc của tôi" khác "tôi sửa được" | `server/src/permissions.ts` → `mySkills` vs `editableSkills` |

### Tiến độ công việc

| Muốn sửa | Mở file |
|---|---|
| Bảng Tiến độ công việc | `web/src/modules/worklist/MgmtTasksPage.tsx` |
| Luật của bảng đó: việc con một tầng, lý do bắt buộc, đóng việc cha | `server/src/worklist/mgmttasks.ts` |
| Bốn nhóm công việc và năm trạng thái | `shared/domain/worklist.ts` → `TASK_GROUPS`, `TASK_PROGRESS` |

### Nền tảng

| Muốn sửa | Mở file |
|---|---|
| Đăng nhập, đăng ký, duyệt tài khoản | `server/src/platform/accounts.ts` · `web/src/modules/platform/WelcomePage.tsx` |
| Vai trò và quyền | `shared/domain/people.ts` → `ROLES`, `PERMISSIONS` |
| Sửa bảng quyền theo vai | `server/src/platform/sysconfig.ts` → `setRolePermission` · `web/src/modules/platform/AdminPage.tsx` |
| Ai được làm gì ở đâu | `server/src/permissions.ts` |
| Lộ trình và loại lớp (danh mục) | `server/src/platform/sysconfig.ts` · `web/src/modules/platform/CatalogAdmin.tsx` |
| Hồ sơ cá nhân | `web/src/modules/platform/ProfilePage.tsx` |
| Quy ước tuần, mã tuần (W2 SEP 2026) | `server/src/platform/week.ts` |
| Nhật ký thay đổi | `server/src/platform/audit.ts` |

### Dùng chung

| Muốn sửa | Mở file |
|---|---|
| Sáu họ nhãn (`Level` · `Status` · `Task` · `Alert` · `Outcome` · `Info`), nút, thẻ, bảng | `web/src/ui/ui.tsx` |
| Panel trượt bên phải | `web/src/ui/Drawer.tsx` |
| Ô chọn tuần, bộ lọc chi nhánh | `web/src/ui/Filters.tsx` |
| Thông báo nổi | `web/src/ui/Toast.tsx` |
| Tên hiển thị của mọi mã máy | `web/src/lib/format.ts` |

---

## Điểm kết nối cần biết

Ba chỗ này nối các module với nhau. Sửa một chỗ là ảnh hưởng nhiều màn, nên đọc trước khi đụng.

**`server/src/fasttrack/attempts.ts`** — danh sách và chi tiết một *lượt đánh giá*. Cả Fast
Track lẫn Normal cùng dùng bảng `assessment_attempts`, nên file này rẽ nhánh theo chương
trình của lớp. Đây là chỗ dễ làm hỏng cả hai bên nhất.

**`server/src/permissions.ts`** — mọi câu hỏi "người này có được làm việc kia không" đều đi
qua đây. Quyền = quyền của vai × chi nhánh của chính grant đó × phân công lớp/kỹ năng, cộng
thêm quyền cấp riêng cho cá nhân.

**`server/src/platform/week.ts`** — quy ước tuần (thứ Hai → Chủ nhật, thuộc tháng chứa thứ
Năm; mã tuần LUÔN kèm năm). Lịch MT, hạn chấm, chu kỳ case và bảng theo tuần đều đếm từ đây.
Không có ngày thi cụ thể ở bất kỳ đâu trong luồng MT: đơn vị nhỏ nhất là TUẦN.

**`server/src/fasttrack/skillSchedule.ts`** — từ vòng 7, mỗi KỸ NĂNG trong một đợt có lịch,
phạm vi yêu cầu, trạng thái thi và hạn chấm của RIÊNG nó (bảng `attempt_skills`). Đây là nơi
sở hữu duy nhất của bốn thứ đó; màn nào tự đọc bảng rồi tính lấy hạn là màn sớm muộn nói một
con số khác. Hai điều dễ hiểu nhầm nhất:

- `assessment_attempts.planned_period_id` KHÔNG còn là "tuần thi của đợt". Nó là **tuần kế
  hoạch hoàn tất** — tuần muộn nhất trong các kỹ năng bắt buộc — và được tính lại mỗi khi một
  kỹ năng đổi tuần. Nhờ vậy bảng kết quả theo tuần vẫn đếm mỗi đợt đúng một lần.
- Điểm vẫn thuộc **một đợt duy nhất**. Tách tuần không tạo đợt mới, không đổi số MT, không
  ghép điểm từ đợt khác.

**`server/src/cases/signals.ts`** — từ vòng 7, điểm dưới kỳ vọng **không tự mở case và không
tự sinh phương án hỗ trợ** (mục 6.2). Nó sinh một TÍN HIỆU, giao cho đúng một người, kèm hạn
ba ngày. Lý do: máy đọc được "band 5.5 < kỳ vọng 6.0" nhưng không biết VÌ SAO, và không xếp
được tutor thay người — nên case và phương án tự sinh chỉ làm bảng tổng hợp đầy số mà không
có việc thật nào đứng sau.

Ba chỗ dễ hiểu nhầm:

- Tín hiệu **không phải case** và không được đếm chung. Nó đi ra ở khoá riêng (`pendingSignals`
  trên hồ sơ, `/signals/pending` ở API, nhóm `verify` ở hàng việc).
- Hạn ba ngày đếm từ `raised_on` — NGÀY GHI NHẬN, không phải thứ Hai của tuần thi. Điểm nhập
  muộn vì thế không làm giáo viên quá hạn ngay lúc điểm vừa công bố.
- Hạng mục ĐÃ CÓ case đang mở thì tín hiệu tự nối vào case đó (thêm một mốc, không mở case
  thứ hai). Chỉ khi chưa có case nào thì nó mới nằm chờ người xác minh.

**`shared/domain/cases.ts`** — từ vựng của case: sáu hạng mục, năm kết quả, năm bước tiếp theo,
và `cycleDeadline`. Từ vòng 5, HẠN của một chu kỳ tính ở ĐÚNG MỘT CHỖ này (Chủ nhật của tuần thứ
hai với case học thuật, một tuần với Ý thức/Khác) — luật cũ suy hạn từ mức gấp `7 · 5 · 3 ngày`
đã bị thay hẳn. Màn hình nào tự tính hạn lấy là màn hình sớm muộn nói một con số khác.

**`server/src/cases/cases.ts` → `listCases`** — lọc theo lớp đi theo **lớp em ĐANG học**
(`homeClassId`), trong khi cột hiển thị vẫn là **lớp lúc đánh giá** (`classId`). Bảng tổng hợp
gom theo cùng ô đó, nên bấm một con số ra đúng danh sách tạo nên nó. Đổi một trong hai mà quên
chỗ kia là cách tạo ra "bảng nói 19 case, bấm vào ra danh sách rỗng".

---

## Thêm một module mới thì làm gì

1. Tạo `server/src/<tên>/` và `web/src/modules/<tên>/`.
2. Nếu có từ vựng riêng, thêm `shared/domain/<tên>.ts` và khai báo ở `shared/domain/index.ts`.
3. Thêm đường dẫn API trong `server/src/routes/index.ts`.
4. Thêm một mục kiểm thử trong `server/src/tests/run.ts`.
5. Thêm một dòng vào bảng "Tám module" ở đầu file này.

## Nguyên tắc giữ ranh giới

- **Fast Track và Normal có form, kiểm tra dữ liệu và workflow RIÊNG.** Dùng chung thành phần
  giao diện cơ bản thì được; tái dùng form nghiệp vụ của bên này cho bên kia bằng cách ẩn vài
  ô thì không — đó là cách chắc chắn nhất để một sửa đổi bên này làm hỏng bên kia.
  Cụ thể: Fast Track có W1/W2 và chấm theo band; Normal có một môn W và chấm theo điểm
  đạt/tổng điểm. Hai môn ĐÓ KHÔNG GỘP VÀO NHAU ở bất kỳ bảng nào. Mọi đường dẫn tới điểm đi
  qua `attemptHref` để mở đúng màn theo loại bài.
- **Case học thuật và Ý thức/Khác** dùng chung phần lưu lịch sử, người phụ trách và ghi chú;
  tách riêng quy tắc thời hạn và cách cập nhật kết quả.
- **Hành trình học viên** tổng hợp từ dữ liệu nguồn, không giữ một bộ điểm hay trạng thái
  riêng — hai bộ số song song là hai bộ số sớm muộn lệch nhau.
