# PISA Progress — đặc tả bản demo

Tài liệu mô tả **cái đã được xây trong bản demo**: cấu trúc thông tin, quyết định giao diện,
ma trận quyền, quan hệ dữ liệu chính và phần nằm ngoài phạm vi.

Nguồn sự thật về business decision là file context bàn giao. Các giả định thử nghiệm nằm ở
`DEMO_ASSUMPTIONS.md`.

---

## 1. Hai luồng chính

```
Học vụ:    Student → Enrollment → WeeklyLearningRecord → Signal ─┐
                                                                 ├→ Issue → Task → Follow-up
Vận hành:  ReportingUnit → BranchReport → MeetingDecision ───────┘
```

Hai luồng hội tụ tại **Trung tâm Vấn đề** và **Trung tâm Công việc**. Tín hiệu học tập
*không* tự tạo Vấn đề — con người quyết định.

---

## 2. Kiến trúc

```
Trình duyệt (React + TypeScript + Vite, Tailwind)
        │  gọi /api, cookie phiên do máy chủ cấp
        ▼
Express  ├─ routes/      xác thực đầu vào, ánh xạ HTTP
         ├─ permissions  Permission × Scope × Assignment
         ├─ services/    toàn bộ business rule và phép tính
         └─ db.ts        SQLite (better-sqlite3), transaction
        ▼
data/pisa-demo.sqlite   một tệp trên máy, giữ dữ liệu qua restart
```

**Nguyên tắc đã áp dụng**

- Business rule và phép tính nằm ở `services/`, **không** nằm trong component React.
  Ví dụ: tỷ lệ chuyên cần, trạng thái hạn, tín hiệu cần chú ý, tiến độ chương trình
  đều tính một lần ở máy chủ và dùng chung cho mọi màn hình.
- Một bộ trang/component dùng chung cho **mọi chi nhánh, lớp và loại lớp**.
  Không có `if (className === 'FT5')` ở bất kỳ đâu — khác biệt do **dữ liệu và cấu hình** quyết định.
- Validate hai lớp: giao diện chặn sớm cho dễ dùng, **máy chủ luôn kiểm tra lại** trước khi ghi.
- Mọi mutation chạm nhiều bảng đều nằm trong **transaction** (chuyển lớp, import, tạo version…).
- `localStorage` **không** được dùng làm nơi lưu dữ liệu học vụ hay để kiểm tra quyền.

---

## 3. Cấu trúc thông tin (IA)

Sidebar tối đa **8 mục**, tự lọc theo quyền thực tế:

| Mục | Đường dẫn | Ai thấy |
|---|---|---|
| Tổng quan | `/` | mọi tài khoản (nội dung khác nhau theo vai trò) |
| Học viên | `/hoc-vien` | có quyền xem học vụ |
| Lớp học | `/lop-hoc` | có quyền xem học vụ, trừ tài khoản chỉ tư vấn |
| Vấn đề | `/van-de` | có quyền xem vấn đề |
| Công việc | `/cong-viec` | có quyền xem công việc |
| Báo cáo | `/bao-cao` | có quyền xem báo cáo hoặc học vụ |
| Cuộc họp | `/cuoc-hop` | có quyền xem cuộc họp |
| Quản trị | `/quan-tri` | có quyền quản trị |

**Không** có menu riêng cho Attendance, Homework, Mock Test, Warning hay Teacher Notes —
các dữ liệu này nằm trong Học viên và Lớp học. **Branch Overview** nằm trong Tổng quan,
không phải một mục menu riêng.

Mẫu điều hướng chung: **danh sách → drawer xem nhanh → trang chi tiết**.
Bộ lọc, sắp xếp và vị trí cuộn được giữ trong URL nên quay lại không mất.

---

## 4. Ma trận quyền đã cài đặt

Quyền = **Permission của vai trò** × **Scope của chính grant đó** × **Assignment**.
Không có `switch(role)` nào quyết định quyền.

### 4.1. Các loại phạm vi (scope)

| Scope | Ý nghĩa |
|---|---|
| `global` | Toàn hệ thống |
| `branch` | Đúng một chi nhánh |
| `reporting_unit` | Đúng một đơn vị báo cáo (kể cả đơn vị ngoài chi nhánh) |
| `assignment` | Chỉ các lớp/skill người đó được phân công, **còn hiệu lực theo thời gian** |
| `consultant_caseload` | Chỉ học viên được phân công |
| `consultant_team` | Học viên của nhóm tư vấn được cấp (có thể giới hạn thêm theo chi nhánh) |

**Quy tắc bất biến:** mỗi grant chỉ mở permission của vai trò trong grant đó, và chỉ trong
scope của chính grant đó. Một người vừa là Quản lý chi nhánh A vừa là GV Speaking một lớp ở
chi nhánh B thì **không** dùng được quyền quản lý ở B, và **không** dùng được quyền giáo viên ở A.

### 4.2. Ma trận

| Tác vụ | Admin | Manager/Head | Teacher (GVBM) | Consultant | Consultant Manager |
|---|---|---|---|---|---|
| Xem học vụ | Scope được cấp | Chi nhánh/đơn vị được cấp | **Toàn bộ dữ liệu của lớp được giao** | HV được giao, view đã lọc | Nhóm/chi nhánh được cấp, view đã lọc |
| Sửa dữ liệu tuần theo skill | Có | Trong scope | **Chỉ skill + lớp + thời gian phân công** | Không | Không |
| Tổng hợp thái độ, báo cáo tiến độ, ghi nhận cảnh báo | Có | Trong scope | **Chỉ lớp có phân công GVCN** | Không | Không |
| Nhập điểm official, chuyển lớp | Có | Trong scope | Mặc định không | Không | Không |
| Tạo/quản lý vấn đề, báo cáo vận hành | Có | Trong scope | Chỉ xem phần được giao | Không | Không |
| Công việc | Quản lý theo grant | Quản lý trong scope | Cập nhật việc được giao, field được phép | Việc được giao | Việc được giao |
| Chi nhánh, người dùng, phân quyền, template | Có | Chỉ override lớp nếu được cấp | Không | Không | Không |

### 4.3. Chi tiết đã thực thi ở API

- **GVBM xem toàn bộ, sửa một phần.** `academic.view` với scope `assignment` mở **cả lớp**;
  `academic.weekly.edit` yêu cầu **khớp đúng skill**. Ẩn nút ở giao diện *không* phải cơ chế bảo vệ —
  API từ chối độc lập và trả về câu giải thích để hiển thị tại chỗ.
- **GVCN không phải role.** `academic.summary.edit` với scope `assignment` yêu cầu
  phân công có cờ `is_core` tại **đúng lớp đó**.
- **Phân công có thời gian hiệu lực.** Phân công hết hạn thì mất quyền ngay.
  Việc được ghi tên trong buổi bổ trợ **không** cấp quyền.
- **Tư vấn viên nhận projection riêng**, không phải bản đầy đủ bị ẩn bớt ở giao diện:
  ghi chú nội bộ, nguyên văn ghi nhận sự việc, và nhật ký trước/sau **không có trong response**.
- **Người được giao công việc** chỉ sửa được `status`, `note`, `pausedReason`; các field khác bị API từ chối.
- **Đổi "Góc nhìn"** chỉ đổi menu và trang mở đầu, không đổi quyền.

### 4.4. Xác thực của bản demo

Máy chủ cấp cookie phiên trỏ tới một tài khoản mẫu. **Request không thể tự khai báo vai trò
hay quyền** — mọi quyền đọc lại từ database theo `user_id` của phiên.
Đổi tài khoản sẽ huỷ phiên cũ, **xoá toàn bộ bộ nhớ đệm phía trình duyệt**, tải lại phạm vi mới
và điều hướng về trang được phép.

> Đây **không phải** xác thực dùng cho production. Auth thật nằm ngoài phạm vi bản demo.

---

## 5. Quan hệ dữ liệu chính

### 5.1. Định danh và phân quyền

```
User ──< UserRoleGrant >── Role ──< RolePermission >── Permission
 │         (scope_type, scope_id — phạm vi riêng của từng grant)
 ├──< TeacherAssignment (class_id, skill | is_core, effective_from/to)
 ├──< ConsultantAssignment (student_id, effective_from/to)
 └──< ConsultantTeamMember
```

### 5.2. Tổ chức và chương trình

```
Branch ──< ReportingUnit          (Tutor Part-time: đơn vị không thuộc chi nhánh nào)
Branch ──< Class >── ClassType    (FT | NORMAL)
Class  ──< ClassSkillConfig       (số buổi kỳ vọng theo skill — nguồn của mọi phép tính)
Class  ──> CourseTemplateVersion  (bất biến sau khi phát hành)
             └──< TemplateStage   (stage | milestone | checkpoint | week; due_offset_days có thể NULL)
Class  ──< ClassStageOverride     (chỉ ảnh hưởng đúng lớp này)
Class  ──< ClassStageProgress     (tiến độ thực tế do người nhập)
```

Chương trình thực dùng của một lớp = **TemplateVersion + Override của lớp**, gộp lúc đọc.
Cùng một renderer cho FT (stage/milestone) và Normal (timeline/checkpoint) — khác nhau ở dữ liệu.

### 5.3. Học viên và học tập

```
Student (student_code PISA-000001, UNIQUE)
   └──< Enrollment (nhiều lần học theo thời gian, có attempt_no, liên kết chuyển lớp hai chiều)
          ├──< EnrollmentSkill        (registered = 0 → "Không áp dụng")
          ├──< WeeklyLearningRecord   UNIQUE (enrollment, skill, week_start)
          │       ├──< AttendanceRecord      (nguồn chi tiết cho chuyên cần)
          │       ├──< HomeworkAssignment    (nguồn chi tiết cho bài tập, có cờ completed riêng)
          │       └──< LearningActivity      (buổi bổ trợ: học ghép | tutor | 1-1)
          ├──< TeacherEstimate        (theo skill GIẢNG DẠY, có writing1 và writing2 riêng)
          └──< Assessment >──< AssessmentScore  (theo skill BÀI THI, có scale riêng)
Student ──< JourneyEvent · TeacherNote(visibility) · StudentProgressReport
        ──< WarningReference · IncidentReference
```

Ràng buộc quan trọng đã cài đặt:

- Không có dòng tuần trùng `(enrollment, skill, week)` — ràng buộc UNIQUE ở database.
- **Không dùng tên học viên làm khoá ngoại** ở bất kỳ đâu.
- `student_code` sinh **ở máy chủ trong transaction**, kể cả import hàng loạt.
- Chuyển lớp đóng lần học cũ và mở lần học mới **trong cùng transaction**, ghi journey event.
- Lần học tương lai hoặc đã kết thúc **không** làm sai sĩ số đang hoạt động —
  bảng nhập tuần lọc theo khoảng thời gian thực của lần học.

### 5.4. Vận hành

```
ReportPeriod ─┬─ BranchReport ──< BranchReportCategory (snapshot nhãn + version)
              └─ MeetingPeriod ──< MeetingAgendaItem
                                ──< MeetingDecision ──> Issue
Issue ──< IssueNote · IssueMeetingLink · Task
Task  ──> Issue | MeetingPeriod | BranchReport | Student | Class   (liên kết bằng ID)
Task  ──< TaskHistory (đổi hạn, đổi trạng thái, lý do)
```

**Carry-over là truy vấn, không phải bản sao.** Kỳ họp hiện tại tìm các Task có
`source_meeting_period_id` thuộc kỳ trước và chưa hoàn thành. Task giữ nguyên mã, ngày tạo,
hạn gốc và kỳ họp gốc.

### 5.5. Hỗ trợ

```
AuditLog (actor, action, entity, before, after, sensitivity)
Notification (dedup_key UNIQUE theo user — render lại không tạo bản sao)
SignalPolicy (versioned, gắn nhãn thử nghiệm)
DemoConfig (ngày demo, kịch bản giao diện)
```

Nhật ký được **lọc theo quyền khi đọc**: người không có quyền xem nội bộ không nhận được
giá trị trước/sau; bản ghi nhạy cảm đánh dấu `restricted`.

---

## 6. Quyết định giao diện

### 6.1. Phong cách

Dashboard tối chuyên nghiệp: nền xanh đen (`#080f16`), bề mặt tương phản vừa đủ, accent teal,
viền mảnh, bo góc vừa. **Màu chỉ hỗ trợ trạng thái và luôn đi kèm nhãn chữ** — người dùng
không phải đoán ý nghĩa của một chấm màu. Wordmark chữ đơn giản, không giả nhận diện chính thức.

Desktop-first ở 1440px, dùng tốt ở 1280px. Dưới 1100px sidebar tự thu về dạng icon;
bảng cuộn ngang **trong khung của chính nó**, không co toàn bộ thành chữ nhỏ và không làm
trang bị cuộn ngang.

### 6.2. Bảng

Tiêu đề dính khi cuộn, **cột danh tính cố định** khi cuộn ngang, chiều cao dòng đủ thao tác,
và tuỳ chọn **"Hiện cột bổ sung"** để bạn tự thử mật độ thông tin.

### 6.3. Autosave

- Debounce **700ms** cho ô số, **900ms** cho ghi chú; lưu theo từng ô, không reload trang.
- Trạng thái hiển thị: **Đang lưu… / Đã lưu / Lưu lỗi — Thử lại**.
- **Chống ghi đè theo thứ tự:** mỗi ô gửi `clientSeq` tăng dần; máy chủ lưu `last_client_seq`
  và **bỏ qua request cũ đến sau**, trả về bản hiện tại thay vì ghi đè.
- **Lỗi giữ nguyên bản nháp** của người dùng và hiện nút Thử lại — không bao giờ báo "đã lưu" giả.

### 6.4. Thao tác cần xác nhận (không autosave)

Chuyển lớp · Ghi nhận cảnh báo · Import · Cấp/gỡ quyền · Lưu trữ dữ liệu ·
Gửi báo cáo chi nhánh. Mỗi hộp thoại tóm tắt lại **chính xác điều gì sẽ xảy ra** trước khi ghi.

### 6.5. Bulk update

Chọn nhiều dòng → xem trước **số dòng bị ảnh hưởng và danh sách tên** → áp dụng.
Chỉ áp dụng cho **các dòng đã chọn**, không đụng dòng đang bị bộ lọc ẩn.
**Mỗi dòng vẫn được kiểm tra quyền riêng ở máy chủ**; kết quả báo rõ dòng nào thành công,
dòng nào thất bại và vì sao — không có trạng thái "nửa lưu" im lặng.
Mặc định **không** đánh dấu cả lớp đã đi học hay đã làm bài.

### 6.6. Trạng thái màn hình

Mỗi màn có đủ: **đang tải** (skeleton) · **rỗng** (kèm hướng dẫn) · **lỗi** (kèm nút Thử lại) ·
**không có quyền** (kèm lý do cụ thể, ví dụ *"Bạn chỉ được sửa skill mình được phân công tại lớp này"*) ·
**chưa có dữ liệu** (phân biệt với số 0 và với "không áp dụng").

Không có nút trang trí không hoạt động. Tính năng ngoài phạm vi thì không đặt CTA gây hiểu nhầm.

### 6.7. Ngôn ngữ

Giao diện tiếng Việt có dấu, dùng thuật ngữ quen thuộc: **GVCN, GVBM, Điểm kiểm tra,
Ước lượng của giáo viên, Buổi chính, Buổi bổ trợ**. Tên skill giữ tiếng Anh.
**Không** đưa tên bảng database hay mã permission vào luồng người dùng — thông báo lỗi
được viết lại thành câu người dùng hiểu được.

---

## 7. Các màn hình đã xây

| Màn | Nội dung chính |
|---|---|
| **Tổng quan — Quản lý** | 6 KPI việc-cần-xử-lý (mỗi KPI mở danh sách đã lọc đúng đối tượng) + 12 số liệu mở rộng; bảng Tình hình chi nhánh theo 5 nhóm; danh sách việc cần xử lý có owner/hạn/nguồn; học viên cần chú ý kèm số thực và lý do; lớp chậm theo mốc có căn cứ. Bộ lọc chi nhánh / FT-Normal / giáo viên cập nhật **cả KPI lẫn danh sách**. |
| **Tổng quan — Giáo viên** | Lớp của tôi (badge GVCN, skill được giao, tình trạng cập nhật tuần) → Học viên cần chú ý → Dữ liệu cần cập nhật. Một click từ lớp tới đúng bảng nhập skill/tuần. |
| **Tổng quan — Tư vấn viên** | Danh sách học viên phụ trách với view đã lọc. |
| **Học viên** | Bảng mặc định: họ tên/mã · lớp hiện tại · chi nhánh · target · điểm official gần nhất kèm ngày · tín hiệu · tư vấn viên. Tìm có/không dấu và theo mã. Lọc theo phạm vi, loại lớp, lớp, tình trạng. Nút Import ở đây. |
| **Hồ sơ học viên** | Header trả lời ngay: ai · đang học đâu · target · lịch thi · điểm official · ước lượng (nhãn riêng) · điều cần chú ý · bước tiếp theo. 5 tab: Tổng quan · Hành trình (lọc theo loại sự kiện) · Học tập theo tuần · Điểm & đánh giá · Báo cáo & ghi nhận. |
| **Lớp học** | Tên · loại · chi nhánh · GVCN · sĩ số · giai đoạn/tuần · tiến độ · tình trạng cập nhật · phân công của tôi. |
| **Chi tiết lớp** | 4 tab: Tổng quan · **Cập nhật tuần** · Tiến độ chương trình · Phân công. Giáo viên vào thẳng Cập nhật tuần; quản lý vào Tổng quan. |
| **Vấn đề** | List gọn + drawer: ghi chú, liên kết nguồn, lịch sử, công việc. Tạo từ màn Vấn đề hoặc từ học viên/lớp/báo cáo với liên kết điền sẵn. |
| **Công việc** | Bảng và bố cục cột trạng thái. 8 view: Tất cả · Của tôi · Quá hạn · Sắp đến hạn · Đang làm · Tạm dừng · Hoàn thành · Kéo dài. |
| **Báo cáo** | Hai tab tách biệt: Báo cáo chi nhánh (5 nhóm, xem kỳ trước, tạo vấn đề/công việc) và Báo cáo tiến độ học viên. |
| **Cuộc họp** | Báo cáo liên quan · chương trình họp · vấn đề thảo luận · quyết định · công việc mới · **việc chưa xong từ kỳ trước (cùng mã)** · việc đã hoàn thành kỳ trước. |
| **Quản trị** | 6 tab: Chi nhánh & đơn vị · Chương trình & phiên bản · Người dùng & phân quyền · Phân công · Ngưỡng tín hiệu · Nhật ký. |
| **Công cụ demo** | Tách hẳn khỏi nghiệp vụ: đổi tài khoản, xem/đổi ngày demo, chuyển kịch bản giao diện, hướng dẫn nạp lại dữ liệu. |

---

## 8. Bảng nhập tuần — màn ưu tiên cao nhất

Bộ chọn **tuần** (điều hướng ← →) và **skill** (skill không được giao có nhãn *"chỉ xem"*).

Mỗi dòng là một học viên: danh tính · buổi chính đã học/kỳ vọng · bổ trợ ·
bài hoàn thành/được giao · ước lượng · ghi chú ngắn · trạng thái lưu · nút mở chi tiết.

- Dòng tổng cuối bảng chỉ tính trên **dòng đã nhập**.
- Skill không đăng ký hiển thị **"Không áp dụng"**, ô bị khoá, không tính là thiếu dữ liệu.
- Drawer chi tiết là **tuỳ chọn** — nhập nhanh không bắt buộc đi qua drawer.
- Trong drawer: buổi học chi tiết, danh sách bài tập, buổi bổ trợ. Khi bật chi tiết,
  hệ thống cảnh báo chênh lệch, chuyển nguồn và **khoá ô tổng hợp tương ứng** —
  không bao giờ cộng cả hai.

---

## 9. Đã kiểm tra tự động

`npm test` chạy **39 kiểm tra** trên database riêng, nhắm đúng các rủi ro:

GVBM sửa được skill khác · lớp ngoài phân công · phân công hết hạn · GVCN mở nhầm lớp ·
multi-role rò scope · tư vấn viên sửa được dữ liệu · ghi chú nội bộ lọt response và hành trình ·
tìm kiếm vượt phạm vi · request cũ ghi đè bản mới · bulk update bỏ qua kiểm tra quyền ·
nhập vượt số buổi/số bài · chuyển lớp làm mất lần học cũ · điểm thang 10 bị quy đổi ·
version mới sửa lớp cũ · override lan sang lớp khác · FT bị đánh chậm oan ·
carry-over nhân bản task · bổ trợ đếm trùng · chưa nhập bị coi là 0 ·
Writing 1/2 bị gộp · bài official thiếu skill bị lấp · import lỗi/trùng/bấm hai lần ·
Student ID trùng hoặc sai định dạng · liên kết import ghi đè lịch sử ·
nhật ký thiếu before/after · xoá cứng thay vì lưu trữ.

---

## 10. Ngoài phạm vi

**Không xây** (và không đặt CTA gây hiểu nhầm): CRM · học phí · tuyển sinh · cổng phụ huynh ·
thời khóa biểu đầy đủ · gửi tin nhắn · tóm tắt bằng AI · phát hành văn bản Warning Letter.

**Chưa có trong bản demo, kiến trúc không chặn:** import điểm số lịch sử ·
chuyển hàng loạt lớp sang version chương trình mới · quy trình duyệt báo cáo nhiều cấp.

**Thuộc giai đoạn sản phẩm thật:** xác thực và quản lý mật khẩu · database dùng chung ·
triển khai online · sao lưu và giám sát · di chuyển dữ liệu thật.
