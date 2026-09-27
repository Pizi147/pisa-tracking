# Prompt gửi Claude — Brainstorm sâu từ external feedback cho PISA Tracking

Dưới đây là tổng hợp **feedback từ những người khác sau khi xem/trải nghiệm website PISA Tracking hiện tại**.

## Trước hết: đừng coi đây là requirement

Đây **KHÔNG phải quyết định sản phẩm đã chốt**.

Đây cũng **KHÔNG phải danh sách chức năng cần triển khai**.

Hãy coi toàn bộ nội dung dưới đây là một tập hợp:

- user reactions;
- pain points;
- dấu hiệu UX chưa rõ;
- mental model của người sử dụng;
- và một số solution họ tự nghĩ ra.

Một feedback có thể:

- đúng hoàn toàn;
- đúng về vấn đề nhưng sai về giải pháp;
- xuất phát từ việc họ chưa hiểu workflow hiện tại;
- conflict với business rules đã chốt;
- hoặc vô tình chỉ ra một vấn đề lớn hơn mà chính người feedback chưa diễn đạt được.

Tôi muốn bạn **brainstorm mạnh**, không chỉ tick từng feedback rồi trả lời “nên/không nên”.

---

# 1. MỤC TIÊU CỦA VÒNG NÀY

**CHƯA CODE.**

Tôi muốn bạn dùng feedback này để thực hiện một vòng **product + UX rethink** cho website hiện tại.

Hãy chủ động:

- đọc lại website/repo/design decisions/business rules hiện có;
- hiểu workflow thực tế của GVBM, GVCN, Quản lý;
- đối chiếu feedback;
- tìm underlying problems;
- phát hiện conflict;
- tìm những phần đang quá phức tạp;
- tìm những phần đang expose quá nhiều data model ra UI;
- tìm những workflow có thể rút ngắn;
- và brainstorm các hướng thiết kế tốt hơn.

Bạn được khuyến khích **challenge cả website hiện tại lẫn feedback này**.

Nếu thấy một quyết định cũ technically đúng nhưng UX không tốt, hãy nói.

Nếu thấy feedback hợp lý nhưng solution họ đề xuất sẽ làm hệ thống tệ hơn, hãy nói.

Nếu thấy cả hai phía đều chưa tối ưu, hãy đưa phương án thứ ba.

---

# 2. CÂU HỎI LỚN NHẤT CẦN TRẢ LỜI

Hãy xem toàn bộ website dưới một câu hỏi:

> **Website có đang bắt người dùng phải hiểu cách hệ thống được xây dựng, thay vì phản ánh cách họ thực sự làm việc không?**

Người dùng thực tế thường nghĩ theo kiểu:

`Học sinh này đang thế nào?`

→ `Có gì bất thường?`

→ `Có cần xử lý không?`

→ `Ai xử lý?`

→ `Đã làm gì?`

→ `Kết quả thế nào?`

→ `Tiếp theo cần làm gì?`

Trong khi hệ thống có thể đang bắt họ suy nghĩ theo:

`Incident → Warning → Case → Priority → Task → Status → Attempt → Report...`

Hãy đánh giá xem khoảng cách giữa hai mental model này lớn đến đâu.

---

# 3. TINH THẦN CHUNG TỪ FEEDBACK

Những người feedback không thực sự đòi thêm nhiều chức năng.

Cảm giác chung là:

- quá nhiều khái niệm;
- nhiều badge/status;
- nhiều tầng điều hướng;
- thông tin quan trọng chưa nổi bật;
- một số trang giống database hơn là công cụ làm việc;
- nhiều nơi click chưa đi đúng context;
- có những thông tin lặp lại ở nhiều khu vực;
- role khác nhau nhưng đôi khi vẫn nhìn cùng một logic UI;
- người dùng chưa luôn biết “việc tiếp theo tôi phải làm là gì”.

Hãy xem đây là **symptoms**, không phải kết luận.

Tôi muốn bạn chủ động tìm root cause.

---

# 4. FEEDBACK: INCIDENT / WARNING / ISSUE / CASE / TASK

Người feedback cảm thấy có quá nhiều khái niệm liên quan đến “một học sinh đang có vấn đề”.

Mental model hiện tại có nguy cơ giống:

`Ghi nhận → Incident → Warning → Issue/Case → Task → xử lý`

Trong khi họ nghĩ tự nhiên hơn theo kiểu:

`Có chuyện xảy ra → Có cần xử lý không? → Xử lý → Kết quả`

Ví dụ:

Học sinh không làm BTVN.

Người dùng chỉ muốn ghi:

`Không làm BTVN`

Sau đó mới xác định:

- đây chỉ là một lần;
- đang lặp lại;
- có cần GVCN can thiệp;
- hay cần tạo một luồng xử lý rõ ràng.

## Đừng chỉ hỏi “có nên gộp không?”

Hãy brainstorm rộng hơn:

### Option A

Giữ toàn bộ data model backend hiện tại nhưng **UI chỉ expose một mental model đơn giản**.

### Option B

Gộp một số khái niệm thật sự.

### Option C

Giữ entity nhưng thay navigation / visual hierarchy.

### Option D

Biến Warning thành state/flag thay vì destination riêng.

### Option E

Không dùng một workflow chung cho mọi loại vấn đề.

Ví dụ:

- Attendance/BTVN = event stream;
- Academic SOS = intervention workflow;
- Vi phạm = discipline workflow;
- Task = execution layer.

Hoặc nếu bạn có cách tốt hơn, hãy đề xuất.

Tôi muốn bạn trả lời:

- Entity nào thực sự cần thiết?
- Entity nào chỉ cần backend biết?
- Entity nào nên biến mất khỏi UI?
- Entity nào nên đổi tên?
- Entity nào nên gộp visually nhưng không gộp database?
- Người dùng thực sự cần hiểu bao nhiêu trạng thái?

---

# 5. STUDENT DETAIL — HÃY RETHINK TỪ ĐẦU

Feedback mạnh rằng Student Detail nên giúp người dùng:

> **Hiểu một học sinh trong khoảng 20–30 giây.**

Không nên chỉ là nơi chứa tất cả dữ liệu của học sinh.

Hãy rethink Student Detail như một **Student Journey / Student Command Center**.

Nhưng đừng mặc định layout tôi đưa ra là đúng.

Hãy tự brainstorm.

Các nhóm thông tin có thể gồm:

- current state;
- academic progress;
- Test history;
- attendance/homework;
- behaviour;
- active support;
- recent changes;
- timeline;
- upcoming events;
- ownership;
- risk/attention signals.

## Hãy thử ít nhất 3 concept khác nhau

Ví dụ:

### Concept 1 — Journey-first

Timeline làm trung tâm.

### Concept 2 — Current-state-first

“Hiện tại em này thế nào?” nằm trên cùng, lịch sử xuống dưới.

### Concept 3 — Action-first

Trang mở ra ưu tiên những việc người dùng cần làm với học sinh này.

Hoặc concept khác tốt hơn.

Với mỗi concept, cân nhắc:

- GVBM dùng có hợp lý không?
- GVCN?
- Quản lý?
- mobile?
- desktop?
- dữ liệu nhiều sau 1–2 năm thì sao?
- học sinh có nhiều learning cycles thì sao?

Đừng cố nhét mọi thứ lên một trang.

Hãy nghĩ:

- tab nào cần;
- tab nào thừa;
- phần nào collapse;
- phần nào context panel;
- phần nào drawer;
- phần nào chỉ hiện khi có vấn đề.

---

# 6. CLASS VIEW VS STUDENT VIEW

Feedback cho thấy giáo viên thường làm việc theo **lớp**, không phải từng học sinh.

Hãy kiểm tra xem website đã phân biệt rõ hai use case chưa:

## Class View

Tối ưu cho:

- nhập điểm;
- attendance;
- homework;
- ghi nhận nhanh;
- scan cả lớp;
- thao tác hàng loạt;
- tìm outlier.

## Student View

Tối ưu cho:

- xem lịch sử;
- hiểu một case phức tạp;
- xem nhiều môn;
- xem support;
- xem timeline;
- điều tra một vấn đề.

Brainstorm:

- thao tác nào nên inline?
- thao tác nào bulk?
- thao tác nào click row mở side panel?
- thao tác nào mới cần full page?
- liệu có quá nhiều full-page transitions hiện tại không?
- có thể dùng split-view không?
- có nên giữ context lớp trong khi xem Student Detail không?

---

# 7. MOCK TEST / TEST / SCORE — CONTEXT PHẢI ĐƯỢC GIỮ

Feedback khá rõ:

> “Thấy cái gì thì click phải vào đúng cái đó.”

Ví dụ:

`Nguyễn A · MT2 · thiếu Speaking`

click →

`Nguyễn A / MT2 / Speaking`

không phải →

`Trang Test chung → tìm lại lớp → tìm lại học sinh → tìm lại MT2`

Hãy audit toàn bộ các đường vào Test từ:

- Dashboard;
- Class View;
- Student Detail;
- score cell;
- timeline;
- notification;
- task/worklist;
- badge;
- report.

Brainstorm một navigation contract thống nhất cho:

`Student + Attempt + Skill + Context`

Có thể là:

- route;
- drawer;
- modal;
- side panel;
- contextual detail page;

nhưng phải nhất quán.

Ngoài ra hãy rethink cách hiển thị score.

Ví dụ:

`5.5`

có thể không đủ context.

Nhưng cũng không nhất thiết lúc nào cũng phải hiện:

`Speaking 5.5 · MT2 · 18/09`

Hãy xác định:

- context nào cần full metadata;
- context nào chỉ cần score;
- hover/click có thể bổ sung gì;
- latest score nghĩa là gì;
- target nên đứng cạnh score hay không.

---

# 8. ROLE-BASED UX — ĐỪNG CHỈ NGHĨ PERMISSION

Feedback cho thấy:

### GVBM

Mental model:

> “Hôm nay tôi dạy gì và cần cập nhật gì?”

### GVCN

Mental model:

> “Lớp tôi đang có học sinh nào cần quan tâm?”

### Quản lý

Mental model:

> “Ở đâu đang có vấn đề và tôi cần can thiệp vào đâu?”

Đây không chỉ là permission.

Có thể cần **role-specific information architecture**.

Brainstorm:

- cùng một page nhưng adaptive content?
- dashboard riêng?
- same data, different default view?
- same route, different prioritisation?
- saved views?
- role preset?
- “My work” vs “Managed scope”?

Đồng thời tránh:

- quá nhiều component disabled;
- card khóa;
- button greyed out;
- UI giải thích quyền thay vì cho người dùng làm việc.

Nguyên tắc có thể là:

> Không có quyền + không cần biết → ẩn.

Nhưng cũng hãy nghĩ về:

- discoverability;
- deep links;
- audit;
- cross-role collaboration.

---

# 9. ATTENDANCE / HOMEWORK / VI PHẠM

Feedback có xu hướng nhìn những thứ như:

- vắng học;
- không làm bài;
- hành vi đơn lẻ;

trước hết như **facts/events**, chưa chắc là “case”.

Ví dụ:

`24/09 · Reading · Vắng`

hoặc:

`24/09 · Listening · Không làm BTVN`

Sau đó pattern mới đáng chú ý.

Tuy nhiên phần này có thể conflict trực tiếp với design Ý thức hiện tại.

Hãy đặc biệt phân tích:

- Attendance có phải event riêng không?
- Homework?
- Vi phạm?
- Warning?
- Biện pháp?
- khi nào một event trở thành actionable problem?
- hệ thống có nên tự escalate hay chỉ highlight?
- GVCN xác nhận ở đâu?
- có nên có một unified activity stream?

Brainstorm cả phương án:

### Event stream

Tất cả facts đi vào timeline.

### Signal layer

Hệ thống chỉ highlight pattern.

### Intervention layer

Case/biện pháp chỉ xuất hiện khi thực sự cần hành động.

Nhưng nếu business rule hiện tại không cho phép như vậy, hãy chỉ ra.

---

# 10. DASHBOARD — RETHINK “OVERVIEW”

Feedback thiên về:

> Dashboard phải giúp tôi biết “cái gì cần quan tâm”.

Không phải:

> Dashboard phải show tất cả metric đang có.

Hãy brainstorm nhiều loại Dashboard architecture.

Ví dụ:

### Model A — Exception-first

Ưu tiên vấn đề.

### Model B — Role-based

GV / GVCN / QL có dashboard khác nhau.

### Model C — Work-first

Deadline + task + student requiring attention.

### Model D — Operational pulse

KPI + trend + exception.

### Model E — Hybrid

Top = actionable, bottom = analytics.

Hãy đánh giá cái nào phù hợp PISA nhất.

Review mọi KPI/card hiện tại:

- có dẫn đến action không?
- có drill-down được không?
- nếu bấm vào, người dùng có thấy đúng dataset tạo ra con số không?
- có metric nào nhìn “hay” nhưng không hỗ trợ quyết định không?

Nếu một KPI không actionable nhưng vẫn cần cho quản lý, hãy đề xuất vị trí khác.

---

# 11. FILTER — ĐỪNG ĐỂ FILTER PHẢN ÁNH DATABASE

Review toàn bộ filter hiện tại.

Phân loại:

- filter người dùng dùng hàng ngày;
- filter dùng thi thoảng;
- filter chỉ có vì backend có field đó;
- filter nên auto infer từ context;
- filter nên nằm trong Advanced.

Có thể cân nhắc pattern:

`Chi nhánh | Lớp | Người phụ trách | Trạng thái | Thời gian`

nhưng đừng bị giới hạn bởi danh sách này.

Brainstorm:

- quick filter chips;
- saved views;
- role defaults;
- sticky filters;
- filter memory;
- URL-state;
- search + filter;
- context-aware filter.

---

# 12. BADGE / STATUS / COLOR SYSTEM

Feedback có cảm giác website có quá nhiều badge.

Hãy thực hiện một **status-system rethink**.

Ví dụ một record không nên khiến người dùng phải đọc:

`SOS · Warning · Open · High Priority · Overdue · Needs Attention`

nếu mental meaning chỉ là:

`Cần xử lý · quá hạn 2 ngày`

Hãy brainstorm một design system:

### Primary state

Điều quan trọng nhất.

### Secondary metadata

Những thứ bổ sung.

### Severity / urgency

Có thật sự cần riêng?

### Deadline state

Có thể hiện bằng text thay vì badge?

### Ownership

Avatar/name hay badge?

### Color

Màu dùng cho:

- status?
- urgency?
- category?
- role?
- loại Test?

Tránh một màn hình trở thành “rainbow dashboard”.

Hãy chỉ ra:

- badge nào nên bỏ;
- badge nào nên thành text;
- badge nào chỉ xuất hiện khi abnormal.

---

# 13. WEEKLY OPS / REPORT / TASK / ISSUE

Feedback lo ngại dữ liệu bị duplicate qua nhiều layer.

Ví dụ cùng một vấn đề có thể xuất hiện thành:

- ghi nhận;
- issue;
- warning;
- weekly report item;
- task;
- meeting action.

Hãy xác định rõ:

### Source of truth

Record gốc.

### Derived view

Chỉ là cách nhìn.

### Action object

Thứ có owner/deadline.

### Report snapshot

Ảnh chụp theo thời điểm.

### Audit/history

Lịch sử.

Brainstorm kiến trúc hợp lý hơn nếu hiện tại chưa rõ.

Một nguyên tắc có thể là:

> Report không tạo lại vấn đề; report chỉ tham chiếu/tóm tắt vấn đề.

Nhưng hãy kiểm tra xem rule thực tế có phù hợp không.

---

# 14. WORKLIST / “VIỆC CỦA TÔI”

Hãy review sâu phần này.

Câu hỏi:

- Người dùng có hiểu tại sao một item xuất hiện không?
- Một item có đủ context không?
- Click có đến đúng nơi xử lý không?
- Task có thực sự cần tạo hay chỉ là derived reminder?
- Khi vấn đề được giải quyết, task biến mất thế nào?
- Có duplicate giữa notification và task không?
- GVBM/GVCN/QL có cần cùng một kiểu worklist không?

Brainstorm:

### Option A

Unified inbox.

### Option B

Worklist theo role.

### Option C

Task chỉ dành cho việc có owner/deadline; mọi signal khác không phải task.

### Option D

Student-centric queue.

### Option E

Class-centric queue.

---

# 15. NAVIGATION / INFORMATION ARCHITECTURE

Đừng chỉ sửa component.

Hãy kiểm tra lại toàn bộ architecture.

Câu hỏi:

- top-level navigation hiện tại có phản ánh mental model không?
- có page nào nên biến thành tab?
- tab nào nên thành action?
- action nào không nên là tab?
- page nào tồn tại chỉ vì technical entity?
- có route nào người dùng không bao giờ chủ động đi vào?
- có page nào nên trở thành drawer/panel?
- có page nào nên merge?

Hãy sẵn sàng đề xuất:

- rename;
- merge;
- remove;
- relocate;
- demote;
- promote.

---

# 16. MICRO-UX / DAILY SPEED

Ngoài redesign lớn, hãy tìm các cải tiến nhỏ có giá trị cao:

- inline editing;
- keyboard navigation;
- bulk entry;
- sticky header;
- preserve filter;
- preserve expanded rows;
- optimistic save;
- undo;
- quick add;
- “save and next”;
- default focus;
- smart defaults;
- last-used context;
- clear empty state;
- fast search;
- recent classes;
- recent students.

Hãy nghĩ như một giáo viên phải dùng hệ thống **mỗi ngày trong nhiều tháng**.

Một thao tác thừa 2 click nhưng làm 100 lần/tuần là vấn đề lớn.

---

# 17. HÃY TÌM CẢ NHỮNG VẤN ĐỀ KHÔNG CÓ TRONG FEEDBACK

Đây là phần tôi muốn bạn chủ động nhất.

Sau khi hiểu feedback, đừng dừng ở đó.

Hãy tự audit và tìm thêm:

- UX inconsistency;
- terminology inconsistency;
- hidden duplicated workflows;
- dead-end pages;
- confusing empty states;
- weak navigation;
- hidden actions;
- unexpected back behaviour;
- mobile issues;
- accessibility;
- too many confirmation modals;
- slow repetitive entry;
- information density;
- poor hierarchy;
- unclear ownership;
- unclear deadlines;
- ambiguous latest/current/history.

Nếu phát hiện vấn đề mới:

- ghi rõ **“Claude phát hiện thêm”**;
- không trộn với feedback gốc.

---

# 18. BRAINSTORM THEO NHIỀU MỨC ĐỘ

Tôi muốn bạn đưa ý tưởng theo 3 tầng.

## Tầng A — Low-risk UX wins

Không đổi business logic.

Ví dụ:

- rename;
- layout;
- navigation;
- deep-link;
- hide complexity;
- bulk action;
- status cleanup.

## Tầng B — Structural UX changes

Có thể đụng:

- page architecture;
- workflow presentation;
- information hierarchy;
- role-specific views.

Nhưng vẫn cố giữ backend/business logic.

## Tầng C — Product/workflow rethink

Có thể yêu cầu thay đổi:

- entity;
- workflow;
- automation;
- escalation;
- source of truth;
- responsibility model.

Những ý này **không được coi là yêu cầu triển khai**, chỉ là brainstorm đáng cân nhắc.

---

# 19. VỚI MỖI VẤN ĐỀ, ĐỪNG CHỈ ĐƯA 1 SOLUTION

Khi vấn đề đủ lớn, hãy đưa:

- phương án bảo thủ;
- phương án cân bằng;
- phương án mạnh tay.

Ví dụ:

**Vấn đề:** quá nhiều Warning/Issue/Case.

**A — Bảo thủ:** chỉ đổi UI labels.

**B — Cân bằng:** unify presentation, backend giữ nguyên.

**C — Mạnh:** thiết kế lại event → signal → intervention.

Sau đó phân tích:

- lợi ích;
- trade-off;
- risk;
- conflict;
- độ khó.

Không cần lúc nào cũng chọn một phương án thắng.

---

# 20. OUTPUT TÔI MUỐN

Hãy trả kết quả theo structure sau.

## A. Executive diagnosis

5–10 vấn đề UX/product lớn nhất bạn nhìn thấy.

Không kể lại feedback.

Hãy nói root cause.

---

## B. Feedback assessment

Với từng nhóm feedback:

- vấn đề thực sự là gì;
- feedback có đúng không;
- solution feedback có hợp lý không;
- conflict gì;
- nên xử lý ở UI hay business logic.

---

## C. Mental model đề xuất

Mô tả mental model mới nếu cần.

Ví dụ:

`Fact → Signal → Intervention → Action → Outcome`

hoặc một model khác phù hợp hơn.

Giải thích entity nào người dùng cần thấy và entity nào nên ẩn.

---

## D. Information architecture options

Đưa **ít nhất 2–3 phương án architecture** nếu có giá trị.

So sánh:

- simplicity;
- scalability;
- role fit;
- implementation risk.

---

## E. Key screen redesign ideas

Brainstorm cho:

- Dashboard;
- Class View;
- Student Detail;
- Test;
- Worklist;
- Weekly Ops;
- Ý thức;
- Academic SOS.

Không cần pixel-perfect.

Tập trung:

- hierarchy;
- workflow;
- interaction.

---

## F. Workflow redesign ideas

Với workflow phức tạp, vẽ flow.

Đánh dấu:

**UI simplification only**

hoặc:

**Business logic change**

---

## G. Quick wins

Những thay đổi nhỏ nhưng impact cao.

---

## H. Bold ideas

Một section riêng:

> **“Nếu không bị giới hạn bởi thiết kế hiện tại, tôi sẽ cân nhắc…”**

Đây là chỗ bạn được brainstorm mạnh nhất.

Có thể bao gồm:

- bỏ page;
- gộp page;
- unified inbox;
- student activity stream;
- class workspace;
- role homepage;
- command palette;
- timeline;
- contextual side panel;
- saved views;
- workflow automation;
- new navigation model.

Không cần đảm bảo sẽ làm.

---

## I. Things we should NOT do

Từ feedback này, chỉ ra những reaction dễ mắc phải nhưng không nên làm.

Ví dụ:

- thêm dashboard card cho mọi vấn đề;
- thêm badge mới để giải thích badge cũ;
- tạo thêm entity;
- tạo thêm tab;
- duplicate report data;
- đưa mọi feature lên màn chính.

---

## J. Conflict list

Danh sách conflict với business rule/design hiện tại.

Không được âm thầm resolve.

---

## K. Prioritisation

### P0

Pain hiện tại ảnh hưởng workflow hàng ngày.

### P1

UX improvements lớn.

### P2

Polish.

### Exploratory

Ý tưởng lớn cần brainstorm/chốt thêm.

---

# 21. NGUYÊN TẮC CUỐI

Đừng cố “thỏa mãn feedback”.

Hãy **giải quyết vấn đề đằng sau feedback**.

Đừng mặc định:

- feedback đúng;
- website đúng;
- design cũ đúng;
- solution trong prompt đúng.

Tôi muốn bạn đóng vai **product designer + UX architect + system thinker**, không chỉ reviewer.

Ưu tiên:

- practical;
- intuitive;
- ít click;
- ít khái niệm;
- strong information hierarchy;
- đúng context;
- đúng role;
- dễ học;
- dễ vận hành;
- dễ mở rộng;
- không duplicate dữ liệu;
- không phá business logic nếu không cần.

Và đặc biệt:

> **Nếu bạn thấy có một cách tổ chức toàn bộ trải nghiệm tốt hơn những gì cả tôi lẫn người feedback đang nghĩ tới, hãy chủ động đề xuất.**

Đây là vòng **brainstorm**, không phải vòng chốt solution.
