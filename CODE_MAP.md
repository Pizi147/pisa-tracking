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
| **Fast Track** | Lịch Mock Test, điểm band, mức SOS | `server/src/fasttrack/` | `web/src/modules/fasttrack/` |
| **Normal** | FOU/BE/ELE, Progress Test, Final Test, điểm đạt/tổng | `server/src/normal/` | `web/src/modules/normal/` |
| **Case** | Vấn đề của em, phương án, phê duyệt, kết quả | `server/src/cases/` | `web/src/modules/cases/` |
| **Tổng quan và công việc** | Ai phải làm gì, cả chi nhánh đang thế nào | `server/src/worklist/` | `web/src/modules/worklist/` |
| **Nền tảng** | Tài khoản, quyền, tuần, danh mục, nhật ký thay đổi | `server/src/platform/` | `web/src/modules/platform/` |
| **Dùng chung** | Badge, nút, panel, bảng, chọn tuần | — | `web/src/ui/` |

Từ vựng nghiệp vụ (nhãn, hằng số, luật thuần) nằm ở `shared/domain/`, chia theo **đúng tám
module trên**. Cả máy chủ lẫn giao diện đọc chung một bộ, nên không có chuyện hai bên gọi
cùng một thứ bằng hai cái tên.

---

## Tra nhanh theo việc muốn sửa

### Học viên

| Muốn sửa | Mở file |
|---|---|
| Cột trong bảng học viên của một lớp | `web/src/modules/students/ClassRoster.tsx` |
| Dữ liệu đổ vào bảng đó | `server/src/classes/classes.ts` → `classRoster` |
| Trang hồ sơ một em | `web/src/modules/students/StudentDetailPage.tsx` |
| Dữ liệu hồ sơ | `server/src/students/profile.ts` |
| Danh sách lớp và tám bộ lọc | `web/src/modules/students/StudentsPage.tsx` |
| Tên và điều kiện của tám bộ lọc | `shared/domain/people.ts` → `STUDENT_FILTERS` |
| Thêm học viên, nhập Excel | `web/src/modules/students/IntakePanel.tsx` · `server/src/classes/intake.ts` |
| Badge "Thiếu thông tin" | `web/src/modules/students/MissingBadge.tsx` · `server/src/classes/schedule.ts` → `missingForStudent` |
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
| Lịch MT tự đề xuất | `server/src/classes/schedule.ts` → `suggestedMockWeeks` |
| Lộ trình học của một em, target, dự kiến thi | `server/src/fasttrack/cycles.ts` |

### Normal

| Muốn sửa | Mở file |
|---|---|
| Bốn môn của Normal | `shared/domain/skills.ts` → `REGULAR_SKILLS` |
| Số tuần và mốc kiểm tra từng chương trình | `shared/domain/normal.ts` → `PROGRAMME_TEMPLATES` |
| Ngưỡng đạt (60%) và cách chấm theo tỷ lệ | `shared/domain/normal.ts` → `ratioResult` |
| Bảng nhập điểm Progress/Final Test | `web/src/modules/normal/RegularSheetPage.tsx` |
| Xử lý điểm và sinh case của Normal | `server/src/normal/regular.ts` |

### Case

| Muốn sửa | Mở file |
|---|---|
| Sáu hạng mục case | `shared/domain/cases.ts` → `CASE_CATEGORIES` |
| Tên case tự sinh | `shared/domain/cases.ts` → `caseTitle` |
| Bảng phân loại nguyên nhân | `shared/domain/cases.ts` → `ISSUE_TAXONOMY` |
| Danh sách phương án, nhóm tự làm / cần duyệt | `shared/domain/cases.ts` → `INTERVENTION_KINDS` |
| Luật sinh case sau mỗi đợt MT | `server/src/cases/sos.ts` |
| Vòng đời case, phương án, phê duyệt, kết quả | `server/src/cases/cases.ts` |
| Màn một case | `web/src/modules/cases/CasePanel.tsx` |
| Bảng theo dõi sáu hạng mục ở hồ sơ | `web/src/modules/cases/SkillBoard.tsx` |
| Bảng "Vấn đề - Case" và bộ lọc | `web/src/modules/cases/CaseBoardPage.tsx` |

### Tổng quan và công việc

| Muốn sửa | Mở file |
|---|---|
| Danh sách việc của người đang xem | `server/src/worklist/mywork.ts` |
| Màn Tổng quan | `web/src/modules/worklist/OverviewPage.tsx` |
| Bảng "Việc cần lưu ý" | `web/src/modules/worklist/BranchPulse.tsx` · `server/src/worklist/branchpulse.ts` |
| Bảng tổng hợp chi nhánh/lớp | `web/src/modules/worklist/SummaryTable.tsx` · `server/src/worklist/summary.ts` |
| Bảng tổng hợp theo tuần | `web/src/modules/worklist/WeeklyBoard.tsx` · `server/src/worklist/weekly.ts` |
| Quản lý giao việc cho giáo viên | `web/src/modules/worklist/ManagerTasks.tsx` · `server/src/worklist/meeting.ts` |

### Nền tảng

| Muốn sửa | Mở file |
|---|---|
| Đăng nhập, đăng ký, duyệt tài khoản | `server/src/platform/accounts.ts` · `web/src/modules/platform/WelcomePage.tsx` |
| Vai trò và quyền | `shared/domain/people.ts` → `ROLES`, `PERMISSIONS` |
| Ai được làm gì ở đâu | `server/src/permissions.ts` |
| Lộ trình và loại lớp (danh mục) | `server/src/platform/sysconfig.ts` · `web/src/modules/platform/CatalogAdmin.tsx` |
| Hồ sơ cá nhân | `web/src/modules/platform/ProfilePage.tsx` |
| Quy ước tuần, mã tuần (W2 SEP 2026) | `server/src/platform/week.ts` |
| Nhật ký thay đổi | `server/src/platform/audit.ts` |

### Dùng chung

| Muốn sửa | Mở file |
|---|---|
| Badge, nút, thẻ, bảng, tooltip tiêu đề cột | `web/src/ui/ui.tsx` |
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
Năm). Lịch MT, hạn nhập điểm, chu kỳ case và bảng theo tuần đều đếm từ đây.

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
- **Case học thuật và Ý thức/Khác** dùng chung phần lưu lịch sử, người phụ trách và ghi chú;
  tách riêng quy tắc thời hạn và cách cập nhật kết quả.
- **Hành trình học viên** tổng hợp từ dữ liệu nguồn, không giữ một bộ điểm hay trạng thái
  riêng — hai bộ số song song là hai bộ số sớm muộn lệch nhau.
