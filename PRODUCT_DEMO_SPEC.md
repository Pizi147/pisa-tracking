# PISA Progress — Product / Web Design

> **Trạng thái:** vòng overhaul **A — nền tảng** đã code và chạy (dữ liệu, quyền lịch, thuật ngữ, hệ màu).
> Vòng **B** (Học viên class-first, Tiến độ học viên, nhập nhanh) và vòng **C** (lớp thường FOU/BE/ELE,
> workflow Report/WL, Tiến trình công việc) chưa làm.
> Sổ quyết định đầy đủ nằm ở `PISA_Design_Master_Reference.md`.

Tài liệu thiết kế của bản demo local sau đợt overhaul lấy **Mock Test và xử lý SOS** làm trọng tâm.
Ba phần: **A. Current MVP** (đã build), **B. Simplify / Remove** (đã gộp hoặc bỏ),
**C. Future Design** (ghi lại, chưa build).

Trạng thái các câu cần chốt nằm ở `DEMO_ASSUMPTIONS.md`.

---

# A. CURRENT MVP

## A1. Kiến trúc thông tin

**Hai** mục nghiệp vụ trên thanh điều hướng, không hơn. Mọi thứ còn lại là lối vào phụ trong menu tài khoản.

| Mục | Nội dung | Thao tác trọng tâm |
|---|---|---|
| **Tổng quan** | Việc của **chính người đang xem**, nhóm theo loại việc | Bấm một dòng để làm đúng việc đó |
| **Học viên** | Lớp → học viên → tiến độ → nhập điểm, tất cả trong một mục | Mở lớp, nhập điểm, xếp lịch, phân công giáo viên, thêm học viên hàng loạt |
| *(tab)* Tình hình chung | Toàn bộ vấn đề trong phạm vi được xem | Chỉ hiện với Quản lý — xem A8f |
| *(phụ)* Tiến trình công việc | Tình hình từng đơn vị và công việc theo dõi | Cập nhật ngắn, phân công, cập nhật tiến độ |
| *(phụ)* Quản trị hệ thống | Ma trận quyền, đơn vị báo cáo, nhật ký, tài khoản | Chỉ xem, dành cho Quản trị hệ thống |

**Tổng quan** trả lời *"tôi phải làm gì bây giờ"*. **Học viên** trả lời *"lớp tôi đang thế nào"*.
Màn **Học thuật** cũ — *"em nào đang vướng gì"* — không còn là một mục riêng mà thành **tab thứ hai của
Tổng quan** cho Quản lý: cùng một câu hỏi, nhưng đặt cạnh việc của mình thay vì ở một góc khác của phần mềm.
Đường dẫn `/hoc-thuat` vẫn còn và vẫn mở đúng bản ghi.

### Màn Tổng quan: việc của CHÍNH người đang xem

Mỗi dòng là **một học viên**, một câu lý do, và **một nút mà chính người đang xem bấm được**. Việc nào
người xem không có quyền làm thì **không xuất hiện** — máy chủ lọc trước khi trả về, không phải giao diện
ẩn nút đi.

| Nhóm việc | Của ai | Nghĩa là |
|---|---|---|
| **Nhập điểm Test** | Giáo viên được phân công kỹ năng đó | Em đã làm bài rồi nhưng kỹ năng này chưa có điểm |
| **Chờ duyệt phương án** | Quản lý | Giáo viên đề xuất một phương án và đang chờ bạn quyết |
| **Kết quả sau hỗ trợ** | Người thực hiện; quá hạn thì Quản lý cũng thấy | Đã hỗ trợ và hẹn một ngày xem lại — ngày đó đã tới |
| **Phương án hỗ trợ** | Người **dạy** em, hoặc Quản lý | Em có vấn đề mở mà chưa ai chọn hướng xử lý |
| **Cập nhật ngày MT** | Admin chi nhánh (và Quản lý) | Tuần đã chốt nhưng chưa biết em thi ngày nào |
| **Chưa có tuần kế hoạch** | Quản lý | Bài MT chưa được xếp vào tuần nào |

Mỗi nhóm có **một dòng nói rõ nhóm đó nghĩa là gì**. Nhãn cộc lốc bắt người đọc tự đoán chuyện gì đã xảy
ra và mình phải làm gì; một dòng giải thích rẻ hơn nhiều so với việc mỗi người tự hiểu một kiểu.

Việc gấp **không tách thành một nhóm riêng**: "quá hạn nhập điểm" và "chưa ai bắt tay vào" là hai chuyện
khác hẳn nhau, gộp lại thì nhìn vào không biết cái nào là cái nào. Thay vào đó việc gấp xếp lên đầu
**trong nhóm của nó**, và nhóm nào có việc quá hạn thì xếp trước.

Nhãn quá hạn **nói rõ quá hạn cái gì** — *Quá hạn nhập điểm*, *Quá hạn hỗ trợ*, *Quá hạn duyệt*,
*Quá hạn cập nhật kết quả*, *Quá hạn cập nhật ngày MT*. Một chữ "Quá hạn" trơ trọi bắt người đọc đọc tiếp
cả dòng mới biết, trong khi cùng một màn hình đang có năm loại hạn khác nhau.

Dải ô đếm nằm **nguyên một hàng trên cùng**; cột "Lớp của bạn" hẹp hơn và nằm bên phải — đó là chỗ tra
cứu, không phải chỗ làm việc.

**Không có menu riêng cho báo cáo, sự việc, agenda, công việc — và từ vòng B, cũng không còn
menu riêng cho Mock test.** Chúng nằm tại nơi phát sinh: báo cáo và công việc trong Tiến trình công việc;
lịch và điểm trong chính lớp của học viên.

Đường dẫn cũ không bị bỏ rơi: `/mock-test` → `/hoc-vien`, `/mock-test/lop/:id` → màn nhập điểm của
lớp đó, `/hop-tuan` → `/tien-trinh`. Người đã lưu bookmark vẫn vào đúng chỗ.

Điểm mở đầu theo vai trò (chỉ đổi lối vào, không đổi quyền):

- Giáo viên → `Học viên` với bộ lọc **Cần nhập điểm** (xuyên tuần).
- Các vai trò còn lại → `Tổng quan` tuần hiện tại.

### A1a. Học viên lấy LỚP làm gốc

Giáo viên và Admin CN không nghĩ theo "danh sách 400 học viên", họ nghĩ theo lớp mình phụ trách.
Nên màn Học viên mở ra là **danh sách lớp**, mỗi lớp một dòng, mở ra tại chỗ để xem học viên.

Bốn cách xem của **cùng một màn hình**, không phải bốn module:

| Cách xem | Trả lời câu hỏi |
|---|---|
| **Theo lớp** *(mặc định)* | "Lớp tôi phụ trách đang thế nào?" |
| **Cần nhập điểm** | "Còn điểm nào tôi chưa nhập?" — xuyên tuần, xuyên lớp |
| **Cần xếp lịch** | "Lượt MT nào đã chốt tuần mà chưa có ngày giờ?" |
| **Case SOS** | "Case nào chưa xử lý xong?" |

Quy tắc tương tác trên dòng lớp — ba vùng bấm phải tách bạch:

- **Tên lớp** → mở Class Overview (trang riêng của lớp).
- **Badge** → mở đúng tập bản ghi tạo nên con số đó, đã lọc sẵn theo lớp.
- **Nền dòng / chevron** → đóng mở danh sách học viên ngay tại chỗ.

Badge và tên lớp phải chặn nổi bọt sự kiện, nếu không bấm badge sẽ đồng thời đóng mở roster.

**Badge kỹ năng của người đang xem.** Một giáo viên dạy nhiều lớp và ở mỗi lớp có thể ôm bộ kỹ năng
khác nhau. Mỗi dòng lớp ghi thẳng `L R` hay `R W1` — kỹ năng người **đang xem** phụ trách ở **chính
lớp đó** — kèm `GVCN` nếu là chủ nhiệm. Không có badge này thì phải mở từng lớp ra dò.
Dòng lớp là `role="button"` có `aria-expanded`, mở được bằng Enter và Space.

**Badge chỉ hiện khi có việc cần làm.** Không có việc thì ghi "Không có việc cần chú ý", không hiện
badge số 0. "Case SOS" đếm **case**, không phải học viên — một em có thể có nhiều case.
Badge "cần nhập điểm" đếm theo **phân công của chính người đang xem**, nên hai người mở cùng một lớp
có thể thấy hai con số khác nhau — đó là đúng, không phải lỗi.

**Nhiều lớp mở cùng lúc và độc lập nhau.** Mở lớp thứ hai không đóng lớp thứ nhất, vì việc thật là
đặt hai lớp cạnh nhau mà so. Danh sách lớp đang mở, ô tìm kiếm và bộ lọc chi nhánh đều nằm trên URL,
nên nút Back của trình duyệt khôi phục đúng ngữ cảnh cũ chứ không trả về màn hình trắng.

Roster **chỉ nạp khi mở lớp**, không nạp trước cho cả trang. Danh sách lớp dùng **một nhóm truy vấn**
cho toàn bộ số liệu badge, không hỏi lại theo từng lớp.

Tìm theo **tên học viên** trả về đúng **lớp chứa em đó** — người dùng gõ tên em, không gõ mã lớp.

### A1b. Tiến độ MT nằm trong lớp, không phải màn hình riêng

Mỗi dòng học viên trong roster hiện: target · **chuỗi tiến trình MT** (`MT1 ✓ · MT2 ✓ · MT3 W4 OCT`) ·
kết quả gần nhất · ước lượng của giáo viên · việc cần làm. Đó chính là phần "tiến độ / mock test"
trước đây tách riêng — nay gộp vào nơi người dùng đang đứng, không bắt họ nhảy màn hình.

Lớp thường (FOU/BE/ELE) hiện "Chưa có kế hoạch MT" — đó là **trung thực**, vì hình thức đánh giá của
lớp thường thuộc phạm vi vòng C, không phải MT bốn kỹ năng.

Bộ lọc mặc định là **tuần**. Bộ lọc chi nhánh **chỉ hiện khi tài khoản có nhiều hơn một chi nhánh**.
Bấm một KPI sẽ mở đúng danh sách bản ghi cấu thành số đó.

## A1b. Lịch MT: TUẦN và NGÀY là hai việc khác nhau

Đây là thay đổi lớn nhất của vòng A.

| Bước | Ai làm | Quyền | Ghi chú |
|---|---|---|---|
| Chốt **tuần kế hoạch** (`MT2 → W3 OCT`) | Quản lý | `plan.week` | Chốt sớm, có thể chưa có ngày. Hệ thống **không** tự điền thứ Hai làm ngày mock giả |
| Chốt **ngày giờ** buổi chính L/R/W | Admin chi nhánh | `schedule.date` | Chỉ trong tuần đã duyệt. Ngày ngoài tuần **bị từ chối** kèm gợi ý đề nghị Quản lý đổi tuần |
| Chốt **ngày giờ Speaking** | Admin chi nhánh, hoặc GV Speaking của lớp | `schedule.date` / `schedule.speaking` | Speaking khác ngày vẫn là **cùng một lượt MT**, không tách lượt mới |
| Huỷ lượt | Quản trị hệ thống · Admin CN · Quản lý | `attempt.cancel` | Giữ lý do và lịch sử, không đổi số MT |

- **GVCN chỉ đọc lịch.** Là chủ nhiệm không tự cấp quyền lịch, và cũng không cấp quyền sửa mọi kỹ năng.
- **Quyền nhập điểm không kèm quyền sửa lịch**: payload lưu điểm không có trường lịch nào, nên giáo viên
  L/R/W không thể đổi ngày qua đường nhập điểm.
- Đổi tuần khi ngày cũ nằm ngoài tuần mới: hệ thống **bỏ ngày để xếp lại**, không tự dịch bảy ngày.
  Điểm và lịch sử giữ nguyên.
- `Ngày giờ theo lịch` khác `ngày mock thực tế` khác `ngày thi IELTS chính thức` — ba trường riêng.

### Hạn nhập điểm

Mặc định là **thứ Tư của tuần kế tiếp** sau buổi mock **của chính kỹ năng đó** (LRW theo lịch chính,
Speaking theo lịch Speaking). Quản lý và Admin chi nhánh đặt được **hạn riêng** cho cả lượt, có ghi
người đặt, thời điểm và lý do, kèm thao tác *Dùng lại hạn mặc định*. Chỉ một hạn có hiệu lực tại một
thời điểm. **Chưa có lịch thì không có hạn** — hiển thị "Chưa có lịch", không dựng hạn giả. Hết ngày hạn
mới tính quá hạn.

## A1c. Quy tắc thuật ngữ

Trong toàn hệ thống **không dùng từ "thi" cho Mock Test**. Chỉ dùng `MT1…MTn`, `Mock`, `Mock Test`.
Từ "thi" dành riêng cho **kỳ thi IELTS chính thức**. Trạng thái một lượt là `Đã lên lịch · Đã xong · Đã huỷ`.

## A2. Tổ chức, lớp và quyền

Bốn nhóm tài khoản: **Quản trị hệ thống · Admin chi nhánh · Quản lý · Giáo viên**.
GVCN/GVBM là **phân công trong lớp**, không phải loại tài khoản riêng.

| Vai trò | Key | Là ai trong trung tâm |
|---|---|---|
| **Quản trị hệ thống** | `system_admin` | Người quản trị **phần mềm**: tài khoản, vai trò, cấu hình, nhật ký. Không phải một chức danh vận hành |
| **Admin chi nhánh** | `branch_admin` | Nhân sự **văn phòng** của chi nhánh: quản danh sách lớp và giáo viên, tổng hợp việc trung gian giữa các phòng ban |
| **Quản lý** | `manager` | Người điều hành chuyên môn của chi nhánh. **Chính là "Head"** trong quy trình SOS |
| **Giáo viên** | `teacher` | GVCN và/hoặc GVBM, quyền phụ thuộc phân công lớp và kỹ năng |

Hai vai trò đầu **không dùng chung chữ "Admin" trong nhãn hiển thị** để tránh gọi nhầm:
"Quản trị hệ thống" là người quản phần mềm, "Admin chi nhánh" là người làm văn phòng.

Chi nhánh: Monbay (MB) · Bãi Cháy (BC) · Cẩm Phả (CP) · Hải Dương (HD) · Uông Bí (UB).
Mỗi chi nhánh có 2–3 quản lý.

Mã lớp luôn bắt đầu bằng mã chi nhánh: `MB-FT 101`, `CP-FT 110`, `BC-ELE 01`, `MB-FOU 12`, `UB-FOUND 07`.
Loại lớp là **nhãn tự do do quản lý đặt** — không chia cứng FT5/FT10. Kỹ năng lớp học và số buổi
chính mỗi tuần được cấu hình trong `class_skills`, không suy từ tên lớp.

### Công thức quyền

```
Quyền = permission của vai trò
      × phạm vi chi nhánh của CHÍNH grant đó
      × phân công lớp / kỹ năng (chỉ áp dụng cho vai trò Giáo viên)
```

- **Không vai trò nào mặc định thấy toàn hệ thống.** Chỉ grant có `branch_id = NULL` mới phủ toàn bộ.
- Quyền của grant này không dùng được ở phạm vi của grant khác.
- Giáo viên **đọc** mọi kỹ năng của lớp mình dạy, nhưng chỉ **sửa** kỹ năng được phân công.
- GVCN được dời lịch Mock, nhưng việc là GVCN **không** tự cấp quyền sửa mọi kỹ năng.
- Kiểm tra quyền nằm ở API. Giao diện chỉ ẩn/hiện, không phải lớp bảo vệ.

| Permission | Quản trị hệ thống | Admin chi nhánh | Quản lý | Giáo viên |
|---|:--:|:--:|:--:|:--:|
| `attempt.view` | ✓ | ✓ | ✓ | ✓ (lớp được phân công) |
| `plan.week` — chốt tuần | ✓ | — | ✓ | — |
| `schedule.date` — chốt ngày giờ | ✓ | ✓ | — | — |
| `schedule.speaking` | ✓ | ✓ | — | ✓ (GV Speaking của lớp) |
| `attempt.cancel` | ✓ | ✓ | ✓ | — |
| `attempt.skip_skill` — đánh dấu không mock | ✓ | ✓ | ✓ | — |
| `deadline.override` | ✓ | ✓ | ✓ | — |
| `score.edit` — đúng phân công | — | — | — | ✓ (chỉ kỹ năng được giao) |
| `score.override` — nhập bù | ✓ | — | — | — |
| `estimate.edit` — ghi nhận nhanh | — | — | — | ✓ (chỉ kỹ năng được giao) |
| `sos.edit` — ghi nhận vấn đề và việc đã làm | ✓ | ✓ | ✓ | ✓ (lớp được phân công) |
| `case.close` — kết thúc theo dõi | ✓ | — | ✓ | ✓ (chỉ GVCN của chính lớp đó) |
| `case.approve` — duyệt phương án hỗ trợ | ✓ | — | ✓ | — |
| `class.assign` — phân công giáo viên vào lớp | ✓ | ✓ | ✓ | — |
| `student.view` / `student.edit` | ✓ | ✓ | ✓ | xem |
| `meeting.view` / `meeting.edit` | ✓ | — | ✓ | — |
| `admin.config` | ✓ | — | — | — |

Những điểm đáng chú ý:

- **Chốt tuần và chốt ngày là hai quyền khác nhau.** Quyền tuần không tự kéo theo quyền ngày và ngược lại.
- **Kết thúc theo dõi một vấn đề** chỉ dành cho GVCN của lớp và Quản lý. Giáo viên bộ môn báo được
  và ghi được việc đã làm, nhưng không tự kết luận là xong. (Bước "Head xác nhận" cũ đã bỏ hẳn.)
- **Nhập bù điểm** đi qua `score.override` riêng, ghi nhật ký riêng (`score.override` thay vì `score.edit`).
  **Chỉ Quản trị hệ thống** có quyền này *(owner chốt 10/09/2026)*: người không dạy kỹ năng đó thì không có
  căn cứ nào để chấm, nên giáo viên vắng là chuyện đổi phân công chứ không phải chuyện văn phòng gõ điểm hộ.
- **Đề xuất phương án hỗ trợ** là việc của người **dạy** em hoặc của Quản lý. Admin chi nhánh vẫn có
  `sos.edit` để ghi hộ việc CS gọi phụ huynh, nhưng màn việc không giao cho họ việc chuyên môn ấy —
  quyền ghi nhận và trách nhiệm quyết định là hai chuyện khác nhau.
- **Phân công giáo viên** mở cho cả Admin chi nhánh: họ tạo được lớp thì cũng phải xếp được người dạy.
  Bỏ phân công **không xoá lịch sử** — dòng cũ đóng lại bằng `effective_to`, nên báo cáo cũ đọc lại vẫn
  thấy đúng ai dạy lúc đó, và điểm đã nhập giữ nguyên tên người nhập.
- **Admin chi nhánh không vào Tiến trình công việc.** Họ theo dõi lịch và điểm qua Mock Test và Học viên.
- Trang mở đầu theo việc thường làm nhất: Giáo viên → *Điểm tôi cần nhập*; Admin chi nhánh → *Cần xếp lịch*;
  Quản lý và Quản trị hệ thống → *Tổng quan*. Chỉ đổi lối vào, không đổi quyền.

## A3. Tuần và kỳ báo cáo

- Tuần chạy **thứ Hai → Chủ nhật**.
- Tuần thuộc **tháng chứa thứ Năm** của tuần đó (tương đương "tháng có nhiều ngày hơn").
- Các tuần cùng tháng đánh số theo thứ tự thời gian, bắt đầu từ **W1**.
- Mã tuần (`W1 SEP`) chỉ là **nhãn**. Khoá thật luôn là **ngày thứ Hai kèm năm** (`report_periods.week_start UNIQUE`).

Ví dụ đã kiểm chứng: `28/09–04/10/2026 → W1 OCT`; `07/09–13/09/2026 → W2 SEP`;
`28/12/2026–03/01/2027 → W5 DEC` (không phải W1 JAN).

**Hạn nhập điểm = thứ Tư của tuần KẾ TIẾP sau tuần thi**, tính theo **ngày thi thực tế của từng kỹ năng**.
Hết ngày thứ Tư mới tính quá hạn: Mock 13/09/2026 → hạn 16/09; trong ngày 16 chưa quá hạn, sang 17 mới quá hạn.

Ngày nghiệp vụ tính theo `Asia/Ho_Chi_Minh`. Bản demo dùng **đồng hồ demo** cố định (mặc định `14/09/2026`)
để trạng thái quá hạn ổn định khi xem lại; đổi được trong **Công cụ demo**.

## A4. Lịch Mock và nhập điểm

- Mỗi học sinh có **2–5 lần Mock**, không ép đủ năm lần. Quản lý lập kế hoạch.
- Mốc tuần học FT chỉ để **gợi ý** (MT1→tuần 6, MT2→12, MT3→16, MT4→20, MT5→24).
  **Tuần học FT và mã tuần lịch là hai khái niệm khác nhau.** Ngày cụ thể do quản lý xác nhận.
- Một lần Mock có danh tính ổn định: `UNIQUE(student_id, attempt_no)`.
  **Dời lịch cập nhật chính lần Mock đó** — không tạo lượt mới, không tăng số MT, có ghi lịch sử.
- Huỷ giữ nguyên dấu vết (`cancel_reason`), cần lý do, và **không** tính vào "đã thi" hay "thiếu điểm".
- Ba trạng thái: `planned · completed · cancelled`. **"Đã thi" chỉ được đặt khi có điểm** —
  không suy ra từ việc ngày dự kiến đã trôi qua. "Dời lịch" là sự kiện lịch sử, không phải trạng thái.

### Bảng nhập điểm

Một dòng một học sinh, cột là kỹ năng, điều hướng bằng bàn phím (Enter/↓ xuống dòng dưới cùng cột, ↑ lên).

- **Listening / Reading**: nhập **số câu đúng nguyên 0–40**, quy đổi bằng bảng nội bộ của trung tâm
  (`Bang quy doi`, 41 phần tử mỗi bảng). Từ chối −1, 41 và số lẻ.
- **Writing Task 1 / Task 2 / Speaking**: mở **bốn tiêu chí** trong khung riêng.
  Bảng mặc định không bày 16 cột tiêu chí.
- **Ô trống KHÁC số 0.** Gửi rỗng là xoá về "chưa nhập", không bao giờ tự điền 0.
  Không có trạng thái "không áp dụng" để tự bỏ kỹ năng khỏi mẫu số SOS.
- Lưu lại **ai nhập, lúc nào, ngày thi và ngày có kết quả của từng kỹ năng**.

### Công thức điểm (đã chốt)

| Đại lượng | Công thức |
|---|---|
| Band L / R | Tra bảng quy đổi nội bộ theo số câu đúng |
| Band W1 / W2 / S | Trung bình **bốn tiêu chí**, làm tròn về mức 0.5 |
| **Band Writing** | `(W1 + W2 × 2) / 3`, làm tròn về 0.5 |
| Overall Mock | `ROUND(AVERAGE(L, R, W, S) × 2, 0) / 2` — **chỉ khi đủ bốn band** |
| Kỳ vọng | MT1 = cam kết − 1.0 · MT2 = cam kết − 0.5 · MT3–MT5 = cam kết |
| Mức SOS | Đếm kỹ năng **nhỏ hơn** kỳ vọng: 0 → Đạt · 1 → SOS 1 · 2 → SOS 2 · ≥3 → SOS 3 |

Làm tròn theo kiểu Excel (`.25`/`.75` lên), **không** làm tròn về số chẵn. Bằng kỳ vọng là **đạt**.

**Writing tách W1/W2 thành hai kỹ năng nhập điểm riêng** vì có giáo viên chỉ dạy một trong hai task;
phân công giáo viên theo từng task. Đánh giá vẫn theo **bốn kỹ năng** L/R/W/S.

### Kỹ năng không mock và điều kiện chốt SOS

**Mặc định mọi kỹ năng đánh giá đều bắt buộc.** Khi thực tế học viên không mock một kỹ năng,
Quản lý hoặc Admin chi nhánh **đánh dấu "không mock"** cho chính lượt đó; kỹ năng ấy rời khỏi mẫu số,
giữ nguyên ngưỡng 1/2/≥3, kèm nhãn *Đánh giá trên N kỹ năng*.

**SOS TÍNH NGAY trên phần điểm đang có** (owner chốt 09/09/2026). Chỉ cần **một** kỹ năng bắt buộc đã
chấm và đã biết mục tiêu là kết luận được. Chờ đủ bốn nghĩa là một giáo viên nhập muộn thì việc hỗ trợ
học viên cũng phải dừng theo. Mức SOS khi đó là **kết luận tạm thời** và có thể tăng khi các kỹ năng còn
lại vào — giao diện phải ghi rõ "mới có 2/4 kỹ năng", không để người đọc tưởng đây đã là con số cuối.

**Thiếu điểm vẫn KHÁC trượt**: kỹ năng chưa chấm không bị đếm vào số môn dưới kỳ vọng.

**Lớp thường KHÔNG có cơ chế miễn kỹ năng.** Dời lịch sang tuần khác thì được, nhưng bộ kỹ năng của
chương trình luôn đủ.

- `Missing` (đáng lẽ phải mock mà chưa có) khác `Không mock` (đã được quyết định là không cần) khác `0`.
- Đánh dấu sau khi đã có điểm thì **giữ nguyên điểm cũ** và ghi lịch sử; không dùng "không mock" như
  cách âm thầm xoá quá hạn.
- Lượt có kỹ năng bị loại thì **không có Overall IELTS** — lượt đó không còn là bài bốn kỹ năng.
  Band cũ của kỹ năng bị loại vẫn hiện để tra lại.
- Bỏ Writing là bỏ **cả W1 và W2**; chưa cho bỏ riêng một task.

### Sáu trạng thái của một ô kỹ năng

`Không mock` · `Chờ xếp lịch` · `Sắp tới` · `Chưa ghi nhận` · `Đã mock, chưa nhập điểm` · `Đã có điểm`.

**Ngày lịch trôi qua KHÔNG chứng minh đã mock**: một kỹ năng đến hạn mà chưa có ghi nhận nào thì là
*Chưa ghi nhận*, còn *Đã mock, chưa nhập điểm* chỉ khi có người ghi ngày mock thực tế.

### Lộ trình và số lần MT

Mỗi **lộ trình** (`learning_cycles`) có target và ngày thi IELTS riêng. Học tiếp hoặc học lại **trong cùng
lộ trình** thì số MT **tăng tiếp** (MT6, MT7…) và target giữ nguyên, nên kỳ vọng vẫn bằng target.
Sang **lộ trình mới** (LT1 → LT2) thì **đánh số lại từ MT1** vì đã có target mới.
Định danh là `học viên + lộ trình + lần thứ mấy`.

Kỳ vọng chỉ áp dụng cho lộ trình FT LT1/LT2. Lộ trình chưa có target thì vẫn nhập điểm và tính hoàn thành
bình thường, chỉ là chưa kết luận được SOS — không treo trạng thái nhập điểm vì thiếu target.

### Ghi nhận nhanh của giáo viên *(thay bảng "Đánh giá GV" cũ)*

Ghi nhận là **dữ liệu riêng**, không bao giờ ghi đè điểm chính thức. Giáo viên ghi **bất kỳ lúc nào** —
không phụ thuộc tuần MT, hạn nhập điểm hay cửa sổ sửa báo cáo tuần — và chỉ ghi được kỹ năng mình phụ
trách; W1/W2 giữ riêng theo task. Mỗi lần ghi là một dòng mới nên lịch sử có sẵn.

**Tối thiểu chỉ cần MỘT trong hai: một nhận định bằng lời, hoặc một điểm ước lượng.** Bảng cũ bắt buộc
phải có điểm, nên một nhận xét bình thường trên lớp — *"Part 2 nói đủ thời gian, còn ngập ngừng khi đổi
chủ đề"* — không có chỗ nào để ghi. Đó chính là loại thông tin hữu ích nhất mà hệ thống đang đánh rơi.

Ba **kiểu căn cứ**, luôn ghi rõ kiểu nào:

| Kiểu | Khi nào | Điểm |
|---|---|---|
| Nhận định bằng lời | Thường gặp nhất — quan sát trên lớp | Không có |
| Ước chừng một band | Giáo viên tự ước lượng | Có, **được đánh dấu là nhận định** |
| Có bài thật | L/R có số câu đúng; W/S có chấm bốn tiêu chí | Hệ thống tính, cùng công thức với điểm chính thức |

Không bịa số câu đúng hay tiêu chí để một cảm nhận trông giống một phép đo.

So sánh *ghi nhận mới nhất ↔ điểm chính thức mới nhất của chính kỹ năng đó*, **trong cùng một lộ trình**,
luôn kèm **ngày của cả hai** và **nguồn** của từng ô. Điểm từng kỹ năng có thể thuộc các lượt khác nhau
nên không được ghép thành một bài hay một Overall chung.

**Δ = điểm chính thức − ghi nhận**, và chỉ là **khoảng cách giữa hai con số** — không phải lời khen cũng
không phải cảnh báo, nên **không tô màu tốt/xấu** theo dấu của phép trừ. Hai thứ này khác hẳn nhau: một
bên là kết quả một bài làm trong một buổi, một bên là nhận định qua cả quá trình dạy. Ghi nhận bằng lời
**không có Δ** vì không có gì để trừ — và cũng không được quy ra một con số chỉ để lấp ô trống.

## A5. Chi tiết Mock và xử lý SOS

Một trang duy nhất, chia khối ngắn, không dùng tab:

1. Học sinh · lớp **tại lần thi** · lộ trình · cam kết chốt tại lần thi · MT · tuần · ngày dự kiến · kỳ vọng.
2. Điểm từng kỹ năng: ngày thi riêng, số câu / tiêu chí, band, hạn nhập, người nhập.
   Bên dưới là bốn kỹ năng đánh giá + Overall + kết luận.
3. **Vấn đề học vụ** — cùng một khung với hồ sơ học viên và tab Tình hình chung: vì sao đang theo dõi →
   đã làm gì → quan sát được gì → bước tiếp theo. Hiện cả khi điểm sau đó đã sửa lên thành đạt, vì
   giấu nó đi thì mọi việc đã làm để hỗ trợ em cũng biến mất khỏi màn hình.
4. **Quy trình gợi ý** theo MT × mức SOS — CHỈ ĐỌC, tách hẳn khỏi việc đã làm.
5. Lịch sử sửa lịch / sửa điểm / cập nhật xử lý trong phần phụ mở được.

### Bảng hành động (nguồn: `Quy trình phối hợp SOS Mock Test` + sheet `Quy trinh SOS`)

| MT | SOS | Học thuật | Vận hành | Meeting bổ sung |
|---|---|---|---|---|
| MT1 | 1–2 | Xếp tự học 1 tháng | — | — |
| MT1 | 3 | Tutor đến MT2 | — | GVCN gặp HS |
| MT2 | 1 | Xếp tự học 1 tháng | — | — |
| MT2 | 2 | Xếp tự học 1 tháng | — | GVCN gặp HS |
| MT2 | 3 | Ưu tiên tutor đến MT3 **HOẶC** đề xuất lùi lịch thi | — | CX / GĐCN gặp HS |
| MT3–MT4 | 1 | Tutor đến lúc thi | — | — |
| MT3–MT4 | 2 | Tutor đến lúc thi | Chính sách theo case | GVCN gặp HS |
| MT3–MT4 | 3 | Ưu tiên tutor đến lúc thi | Chính sách theo case | CX / GĐCN gặp HS |
| MT5 | 1 | Hỗ trợ chuyên môn (nguồn chưa quy định hình thức/thời lượng) | — | — |
| MT5 | 2 | như trên | Chính sách theo case | GVCN gặp HS |
| MT5 | 3 | như trên | Chính sách theo case | CX / GĐCN gặp HS |

Mọi mức SOS đều có: trao đổi HS · trao đổi PH · hỗ trợ học thuật · thông báo GVCN/GVBM.
Người trao đổi HS ở **SOS 2 từ MT2 trở đi là GVBM**; các trường hợp còn lại là GVCN + GVBM.

Ghi chú nguồn: dòng **MT2 SOS3** trong bảng DOCX không nhắc bước CS–PH, nhưng bước chung của DOCX và
dòng tương ứng trong sheet `Quy trinh SOS` thì có. Bản demo **giữ bước trao đổi PH ở mọi mức SOS**.

### Nguyên tắc ghi nhận

- Đây là **gợi ý phối hợp**, không phải việc hệ thống tự làm và cũng không phải việc đã làm. SOS
  **không** tự cấp buổi học, **không** tự lùi lịch thi thật, **không** tự kết thúc theo dõi.
- MT2 SOS3 là **hai phương án chọn một**, không phải hai việc đều bắt buộc.
- **Việc đã làm ghi ở chỗ khác**, dưới dạng bản ghi thật: loại việc, mô tả, người thực hiện, trạng thái
  (đã lên kế hoạch / đang thực hiện / đã xong / đã huỷ) và ngày tương ứng. Một vấn đề có **nhiều** việc,
  mỗi việc **nhiều lần** xem lại. Trước đây gợi ý và việc đã làm nằm chung năm ô cố định — điền tên vào ô
  là vấn đề trông như đã xử lý xong dù chưa ai làm gì.
- Ghi **"đã xong" phải có ngày thật**. Người nhập **không** mặc định là người thực hiện: khai "chính tôi
  làm" là một thao tác tường minh.
- Trao đổi PH do **CS thực hiện ngoài hệ thống** (Q4): giữ **tên người làm** và ghi rõ ai nhập hộ, ngày
  của việc và ngày nhập là hai mốc riêng. Không cần mở tài khoản cho CS.
  Người điều phối case, người thực hiện từng bước và tài khoản ghi nhận là ba thứ tách rời.
- Sửa điểm làm đổi mức SOS thì **cập nhật mức, giữ nguyên hành động và lịch sử**; không nhân đôi case,
  không tự đóng việc.
- Khi mở case, hệ thống tạo **thông báo trong ứng dụng** cho GVCN/GVBM của lớp. Không gửi email/Zalo.
- SOS học thuật **không** trở thành Warning/WL kỷ luật.

## A6. Tổng quan tuần

Bốn cụm số nhỏ + một danh sách ưu tiên (tên học sinh · lý do · hành động tiếp theo). Mỗi số mở được danh sách.

Hai lát cắt được tách rõ:

| Lát cắt | Nội dung |
|---|---|
| **Của tuần đang xem** | Lịch Mock trong tuần: số lượt có lịch / đã thi / đã huỷ / **số học sinh duy nhất** |
| **Còn tồn đến hôm nay** | Thiếu điểm, quá hạn, mức SOS, case chưa xong, việc quá hạn — **không mất khi đổi tuần** |

- Số lượt Mock **khác** số học sinh duy nhất.
- Lượt đã huỷ **không** tính là đã thi hay thiếu điểm.
- **Thiếu điểm khác quá hạn**: quá hạn phải dựa trên deadline của từng kỹ năng.
- Đổi tuần/tháng **không** làm đổi số lần MT.

Số liệu hỗ trợ (trao đổi HS/PH có ngày, hỗ trợ đã bắt đầu, thời gian trả kết quả, thời gian can thiệp)
nằm trong phần mở rộng, mặc định đóng. **Thời gian trả kết quả = ngày có điểm − ngày thi**, không phải
số ngày quá hạn. Không có dữ liệu thì hiện dấu `—`, không phải `0 ngày`.

## A7. Tiến trình công việc *(trước đây gọi là Họp tuần)*

Một màn hình, hai khối.

**Tình hình đơn vị** — mỗi dòng một đơn vị, mỗi ô một nhóm nội dung:
`Chưa báo cáo` (mặc định) · `Ổn` · `Cần theo dõi` · `Có vấn đề`, kèm ghi chú ngắn và người báo cáo.
Ô trống là **CHƯA BÁO CÁO**, không quy thành "Ổn".

Danh mục đang bật (Q3 = ba nhóm):

| Loại đơn vị | Nhóm nội dung |
|---|---|
| Chi nhánh (5) | Giáo viên · Học sinh · Giáo trình |
| Tutor part-time (1) | Số lượng tutor · Chất lượng dạy học · Các vấn đề khác |

`Tutor part-time` là **đơn vị báo cáo riêng, không phải chi nhánh thứ sáu**.
Mẫu số được **tính lại từ danh mục** (hiện tại 5×3 + 3 = 18), không hardcode 28.
Bộ năm nhóm cũ (Sĩ số & tình hình lớp · Chất lượng dạy học · Học viên & phụ huynh · Nhân sự giáo viên ·
Giáo trình) vẫn cấu hình được trong dữ liệu, nhưng UI chỉ dựng **một bộ** — không có hai bộ song song.

**Công việc** — nội dung · đơn vị · người phụ trách · hạn · tiến độ · ghi chú.

- Loại: `Trong kỳ` / `Dài hạn` — **do người dùng chọn**, không tự đổi theo tuổi của việc.
- Tiến độ: `Chưa bắt đầu` · `Đang làm` · `Hoàn thành` · `Tạm dừng`.
- Trạng thái hạn tính riêng: `Quá hạn` · `Sắp đến hạn` (≤3 ngày) · `Trong hạn` · `Chưa có hạn` · `Đã đóng`.
  Việc hoàn thành **không** bị gắn quá hạn. Thiếu hạn **không** dùng ngày 0. Việc tạm dừng vẫn tính quá hạn
  (chưa có quyết định nghiệp vụ miễn trừ).
- Việc chưa xong từ kỳ trước **giữ nguyên mã và lịch sử**, không clone sang tuần mới.
  Việc dài hạn chưa xong và việc quá hạn/sắp đến hạn được xét **xuyên kỳ**, vẫn giới hạn theo quyền.
- Tạo việc thẳng từ ghi chú báo cáo hoặc từ case SOS, **giữ liên kết nguồn** (`source_sos_case_id`).
  Không bắt buộc đi qua chuỗi "Ghi nhận sự việc → Issue → Agenda → Task". Nội dung "Có vấn đề"
  **không** tự sinh entity Issue.

## A8. Hồ sơ học viên và Hành trình học

Hồ sơ phải trả lời được trong khoảng **ba mươi giây**: em bắt đầu ở đâu, đang ở đâu, đích ở đâu, có đang
theo kịp không, đang vướng gì, ai đã làm gì, và bước tiếp theo là gì. Vì thế thứ tự các khối **không** ngẫu
nhiên:

| # | Khối | Trả lời câu hỏi |
|---|---|---|
| 1 | Điểm đầu vào → Hiện tại → Mục tiêu | Em đi từ đâu tới đâu, còn cách đích bao xa |
| 2 | So với mốc gần nhất · Đang cần chú ý | Có theo kịp không, và đang vướng gì |
| 3 | Đường đi từng kỹ năng | Kỹ năng nào đã tiến, kỹ năng nào đứng yên |
| 4 | Vấn đề học vụ | Ai phát hiện, đã làm gì, quan sát được gì |
| 5 | Các lần đánh giá | Bảng điểm chi tiết |
| 6 | Hành trình học | Toàn bộ câu chuyện theo thời gian |

**Toàn bộ dữ liệu thuộc về MỘT lộ trình.** Có bộ chọn lộ trình ở đầu trang, lựa chọn nằm trên đường dẫn.
Không bao giờ trộn hai lộ trình vào một khung nhìn, vì mục tiêu và thang điểm của chúng khác nhau.

### Ba mốc đầu trang

- **Điểm đầu vào** đến từ lộ trình, kèm **nguồn** (bài kiểm tra đầu vào · kết quả cuối lộ trình trước ·
  điểm bên ngoài · nhập tay có ghi chú). Không có căn cứ thì ghi **"chưa rõ"**. Hệ thống **không** lấy MT1
  làm điểm đầu vào — *"em vào học ở mức nào"* là câu hỏi khác hẳn *"bài Mock đầu tiên được mấy điểm"*.
- **Hiện tại** chỉ lấy Overall từ **một lượt** có đủ bốn kỹ năng. Không ghép bốn kỹ năng mới nhất của bốn
  lượt khác nhau — bốn buổi khác nhau cộng lại không phải một bài thi.
- **Mục tiêu** kèm ngày thi và số ngày còn lại. Đổi mục tiêu có **lịch sử**, phải có **lý do**, và chỉ có
  hiệu lực từ ngày ghi trở đi: các lượt đã chốt giữ nguyên kỳ vọng tính theo mục tiêu lúc đó.
- **Kết luận lộ trình** tách khỏi việc đóng lộ trình: *đạt mục tiêu · chưa đạt · chưa có căn cứ kết luận*.
  Đóng lộ trình chỉ nói "không học theo lộ trình này nữa".

Lớp thường không có band, mục tiêu IELTS hay ngày thi, nên có bộ ba riêng: **khoá học · bài đã làm ·
kết quả gần nhất**. Dựng ba con số IELTS cho một khoá Foundation là bịa ra thứ không tồn tại.

### Hai chuyện tách bạch, không gộp thành một nhãn

**Cố tình KHÔNG dựng nhãn tổng hợp** kiểu *"đang ổn / có nguy cơ / sắp trượt"*: chưa có quy tắc nào được
chốt cho một nhãn như thế, mà một nhãn sai còn tệ hơn không có nhãn.

- **So với mốc gần nhất** — từng kỹ năng đạt hay dưới **kỳ vọng đã chốt của chính mốc đó**. Không nội suy
  theo tuần: *"tuần này lẽ ra phải được 6.0"* là một con số bịa. Chưa đủ điểm thì ghi rõ *"mới có 2/4 kỹ năng"*.
- **Đang cần chú ý** — có vấn đề nào đang mở, ai báo, đã làm gì, hẹn xem lại khi nào. Không có cảnh báo
  **không** đồng nghĩa đang theo kịp; đó là hai điều khác nhau.

### Đường đi từng kỹ năng

Các mốc nối **trong cùng một lộ trình**, cùng một thang. Hai cột phép trừ — *đã tăng* (so điểm đầu vào) và
*còn cách đích* (so mục tiêu) — **không tô màu**, vì chúng là khoảng cách chứ không phải nhãn tốt/xấu.
Thiếu điểm đầu vào thì không tính được *đã tăng*, thiếu mục tiêu thì không tính được *còn cách đích* —
để trống chứ không điền số 0.

### Hành trình gom thành CHƯƠNG

Đọc theo dòng thời gian phẳng thì mỗi lần ghi là một dòng, và một vấn đề theo dõi ba tháng biến thành mười
lăm dòng rời rạc. Nay **mọi việc quanh một vấn đề nằm chung một chương**, **mọi ghi nhận trong một tuần nằm
chung một chương**. Chương nhiều mốc thì gấp lại, chỉ hiện dòng mở đầu và số mốc bên trong.

Chỉ giữ **sự kiện có ý nghĩa**: mở/kết thúc lộ trình, đổi mục tiêu, kết quả đánh giá, ghi nhận của giáo viên,
mở/kết thúc theo dõi vấn đề, việc đã làm, lần xem lại, chuyển lớp, tạm dừng, quay lại, đổi ngày thi. Bấm vào
một chương mở đúng bản ghi liên quan.

**Ngày sự việc và ngày nhập là hai mốc riêng**: ghi bù một buổi tuần trước thì hành trình hiển thị ngày
buổi ấy, không phải ngày gõ vào máy.

Lịch sử đánh giá giữ **lớp tại thời điểm đánh giá**. Chuyển lớp mở dòng enrollment mới, chuyển các lượt
**chưa xong** sang lớp mới và **giữ nguyên lớp cũ cho lượt đã xong**.

Vấn đề còn mở của **lộ trình trước** vẫn hiện ở phần cần chú ý, nhưng dán nhãn rõ *"thuộc LT1"* — không dời
sang lộ trình mới cho tiện hiển thị, vì như thế là viết lại lịch sử.

## A8b. Thêm học viên hàng loạt và tạo lớp

Danh sách lớp đến từ Excel hoặc Google Sheets. Bắt Admin CN gõ tay từng em là đẩy việc sai chỗ,
nên màn nhập là một **lưới kiểu bảng tính** dán thẳng vùng bảng vào được.

**Đọc dữ liệu dán vào**

- Nhận TSV có hoặc không có dòng tiêu đề — tự nhận ra dòng tiêu đề, không bắt khai báo.
- Ngày đọc theo **định dạng người dùng chọn** (`d/m/y` · `m/d/y` · ISO). `12/05/2008` là mơ hồ,
  hệ thống **không đoán**: chọn sai định dạng thì thà báo lỗi còn hơn ghi nhầm ngày sinh của học viên.
- Chuỗi không đọc được thì báo lỗi ngay tại ô, không âm thầm bỏ trống.

**Xem trước chạy tự động, không đợi bấm nút.** Người nhập phải thấy dòng nào hỏng ngay khi vừa dán
hoặc vừa gõ xong, chứ không phải đến lúc bấm Thêm mới biết.

**Nhãn nút nói đúng số dòng sẽ ghi.** Dán 40 dòng mà 2 dòng hỏng thì nút ghi "Thêm 38 học viên",
không phải 40. Còn dòng lỗi thì nút bị **khoá** — để không dòng nào âm thầm biến mất khỏi lô nhập —
nhưng gỡ được trong **một lần bấm** bằng "Bỏ qua N dòng lỗi".

**Trùng hồ sơ chỉ là GỢI Ý.** Trùng tên và ngày sinh thì nêu ra để người nhập tự quyết.
Hệ thống **không tự gộp hồ sơ**: gộp nhầm hai em trùng tên là hỏng dữ liệu học vụ của cả hai.

**Lộ trình kế thừa từ lớp.** Dòng không ghi lộ trình thì lấy lộ trình của lớp — học viên vào lớp LT1
thì đang học LT1, bắt gõ lại là thừa. Thiếu target vẫn nhập được, chỉ cảnh báo "chưa tính được
kỳ vọng"; hệ thống **không tự đoán target**.

**Quyền được kiểm ở máy chủ, không chỉ ở giao diện.** Dòng trỏ vào lớp ngoài phạm vi được cấp quyền
bị **bỏ qua và báo lý do**, không ghi gì — nhưng cũng **không làm hỏng cả lô**: một dòng sai không
được kéo theo 39 dòng đúng. Máy chủ kiểm hai lớp: khi xem trước và một lần nữa ngay trước khi ghi.

**Tuần MT đề xuất chỉ thành KẾ HOẠCH khi người nhập có quyền chốt tuần.** Người không có quyền vẫn
thêm được học viên, nhưng tuần đề xuất bị bỏ qua — để đường nhập hàng loạt không thành lối vượt
quyền lập kế hoạch. Tuần đề xuất lấy theo mốc **tuần HỌC** của chương trình (MT1 tuần 6, MT2 tuần 12,
MT3 tuần 16…), và là **đề xuất**, Quản lý sửa được.

**Bấm hai lần không tạo học viên trùng.** Mỗi lần mở lưới sinh một khoá idempotency giữ nguyên suốt
lần nhập đó, nên bấm đúp hoặc thử lại sau lỗi mạng đều trả về đúng kết quả lần đầu.

**Tạo lớp**: mã lớp phải bắt đầu bằng mã chi nhánh và không trùng — để mã lớp tự nó nói được lớp
thuộc chi nhánh nào, không phải tra bảng.

## A8c. Lịch MT: xếp TUẦN và cập nhật NGÀY là hai việc của hai người

| | Xếp tuần MT | Cập nhật ngày MT thực tế |
|---|---|---|
| **Ai** | Quản lý | Admin chi nhánh **và** Quản lý |
| **Quyết định gì** | Em sẽ MT vào tuần nào (`MT2 → W3 OCT`) | Em thực sự làm bài ngày nào (`LRW → 15/10`) |
| **Khi nào** | Từ trước, thường đã có kế hoạch mặc định | Khi đã đến tuần đó |
| **Thiếu thì ai lo** | Quản lý — *"3 học viên chưa có tuần MT"* | Admin chi nhánh — *"Cần cập nhật ngày MT"* |

Admin chi nhánh **không phải người "chốt lịch"**. Lịch buổi học do bộ phận xếp lịch bố trí từ Chủ nhật
tuần trước; việc ở đây là **ghi lại ngày em thực sự làm bài** theo lịch tổng của chi nhánh, và cập nhật
lại khi em nghỉ và được dời.

**Chỉ ngày, không giờ.** Giờ mock đã bỏ hoàn toàn — nó không giúp gì cho việc theo dõi tiến độ,
chỉ thêm một ô phải nhập.

**Quyền sửa ngày:**

- **L/R/W** — chỉ Admin chi nhánh và Quản lý.
- **Speaking** — thêm **giáo viên Speaking của chính học viên đó**, vì Speaking thường khác ngày với
  buổi L/R/W.
- Giáo viên L/R/W **không bao giờ** sửa được ngày. **GVCN cũng không** — chủ nhiệm không phải quyền lịch.

### Việc phụ thuộc THỜI ĐIỂM

"Cần cập nhật ngày" chỉ là việc khi **đã đến tuần MT đó**. Hôm nay W4 SEP mà MT3 xếp W2 OCT thì chưa
ai phải làm gì. Đưa nó vào danh sách chỉ tạo một con số lúc nào cũng đỏ, và người dùng học cách phớt lờ.

| Tình huống | Có phải việc không |
|---|---|
| MT3 = W2 OCT, hôm nay W4 SEP | **Không** — chưa đến lượt |
| MT2 = W4 SEP (tuần này), chưa có ngày | **Có** — Admin chi nhánh làm trong tuần |
| MT2 = W3 SEP (tuần trước), vẫn chưa có ngày | **Quá hạn** — nghĩa vụ tuần trước còn sót |

Vì thế badge **"Chưa có ngày" đã bỏ khỏi mọi nơi**. Chuyện thiếu ngày chỉ xuất hiện ở đúng một chỗ:
màn **Cần cập nhật ngày MT** trong Học viên, và nó là màn **thao tác hàng loạt** — chọn nhiều em,
một ngày, một lần bấm, không mở từng hồ sơ.

### Kỹ năng lượt này YÊU CẦU, chọn ngay khi lên kế hoạch

Panel **Lên kế hoạch MT** trượt từ phải, chọn nhiều em, đặt tuần, và tick kỹ năng lượt này yêu cầu
(mặc định đủ bốn). Bỏ tick Speaking nghĩa là lượt này **ngay từ đầu không yêu cầu Speaking**.

| | Không yêu cầu | Thiếu điểm |
|---|---|---|
| Nghĩa | Ngay từ đầu lượt này không có kỹ năng đó | Có yêu cầu nhưng chưa nhập |
| Lượt xong chưa | **Xong** khi đủ các kỹ năng được yêu cầu | **Chưa**, còn phải chờ |
| SOS | Tính trên các kỹ năng được yêu cầu | Chưa kết luận được |

Một lượt **không thể** không yêu cầu kỹ năng nào — không đánh giá được gì.

## A8d. Ghi nhận nhanh — giao diện

Xem quy tắc ở phần **Ghi nhận nhanh của giáo viên** (mục A4). Phần này chỉ nói cách hiển thị.

**Một bảng chung, không phải hai bảng rời.** Việc thật lúc nào cũng là đặt hai nguồn cạnh nhau; hai bảng
riêng bắt người đọc tự ghép từng dòng trong đầu.

| Kỹ năng | Điểm gần nhất | Giáo viên ghi nhận | Δ |
|---|---:|---|---:|
| Listening | 6.0 | *Bắt được ý chính, còn hụt ở phần nói nhanh cuối bài.* · 15/09 · Thu Trang | — |
| Reading | 6.5 | ước lượng 6.5 (nhận định) · 15/09 · Minh Khoa | 0 |

Cột giữa hiện **nguyên văn nhận xét** — đây thường là thứ hữu ích nhất trên cả bảng, vì một con số 6.0
không nói được *"mất điểm ở TRUE/FALSE/NOT GIVEN"*. Có điểm ước lượng thì thêm một dòng nhỏ bên dưới,
kèm chữ *(nhận định)* khi con số ấy là ước chừng chứ không phải đo từ một bài thật.

**Δ không tô màu tốt/xấu.** Chỉ dùng sắc trung tính, đậm hơn khi hai số lệch từ 1 band trở lên — đủ để
mắt bắt được chỗ chênh nhiều, không ngụ ý ai đúng ai sai. Dòng chỉ có nhận xét thì Δ để trống.

Bấm vào một ô điểm mở **căn cứ**: số câu đúng, hoặc bốn tiêu chí.

## A8e. Vấn đề học vụ: hai nguồn, một vòng đời

Trước đây vấn đề chỉ sinh ra từ điểm: đủ điểm bốn kỹ năng thì hệ thống mới biết em nào đang đuối. Nhưng
giáo viên nhìn thấy vấn đề trong lớp từ nhiều tuần trước đó, và tới lúc ấy thì đã muộn hai tháng.

**Hai nguồn:**

| Nguồn | Sinh ra khi nào | Mang gì |
|---|---|---|
| Từ điểm | Có ít nhất một kỹ năng bắt buộc đã chấm và đã biết mục tiêu | **Mức SOS 1/2/3** = số kỹ năng dưới kỳ vọng |
| Giáo viên báo | Bất kỳ lúc nào, không cần Mock, không tạo bài đánh giá giả | **Mức độ gấp** (bình thường / cần chú ý / gấp) — nhận định của người báo |

Hai nguồn dùng **chung một vòng đời**, chung một bảng, chung một khung hiển thị: *ghi nhận → phân loại →
tác động → xem lại → chốt hướng xử lý*. Mức SOS và mức độ gấp là hai loại thông tin **khác hẳn nhau** nên
không bao giờ dùng chung nhãn — vấn đề giáo viên báo có mức SOS để **trống**, không phải SOS 0.

**Bốn chiều tách bạch**, không gộp vào một enum:

| Chiều | Giá trị |
|---|---|
| Trạng thái | Chưa xử lý · Đang xử lý · Đã xong |
| Hướng xử lý | Chỉ theo dõi · Trao đổi ngoài hệ thống · Không cần can thiệp · Có kế hoạch hỗ trợ · Khác |
| Tiến độ từng việc | Đã lên kế hoạch · Đang thực hiện · Đã xong · Đã huỷ |
| Quan sát sau hỗ trợ | Có tiến bộ · Tiến bộ một phần · Chưa thay đổi · Kém hơn · Chưa đủ căn cứ |

**Kết thúc theo dõi** bắt buộc có hướng xử lý, và *"chỉ theo dõi"* **không phải** một cách kết thúc — nó
nghĩa là vấn đề vẫn còn mở. Chỉ **GVCN của lớp** và **Quản lý** kết thúc được.

**Quá hạn chỉ tính khi đã hẹn.** Theo dõi không hẹn ngày thì không bao giờ bị coi là quá hạn — biến mọi
việc không có deadline thành quá hạn chỉ tạo ra một danh sách đỏ mà không ai tin nữa.

**Phân loại ba nhóm gốc**: Học sinh · Quá trình dạy · Chương trình. Phụ huynh, sức khoẻ, gia đình, đi lại,
lịch cá nhân, áp lực bên ngoài là **bối cảnh kèm theo** — ghi chú, không phải nguyên nhân đã xác minh, và
không phải nhóm thứ tư. Vấn đề sinh từ điểm chỉ biết kỹ năng nào dưới kỳ vọng, nên **"chưa phân loại"** là
trạng thái hợp lệ cho tới khi có người dạy nhận định; hệ thống không tự chẩn đoán nguyên nhân.

**Sửa điểm không xoá lịch sử.** Điểm sửa lên thành đạt thì vấn đề và mọi việc đã làm **vẫn còn** — người có
quyền quyết định có kết thúc theo dõi hay không. Giấu nó đi thì công sức hỗ trợ em cũng biến mất khỏi màn hình.

### "Head xác nhận" — đã bỏ

Đối chiếu code: `confirmCase` chỉ ghi tên và ngày. Nó **không** khoá điểm, **không** là điều kiện để
đổi trạng thái, **không** mở khoá bước nào, và **không** gắn với một trách nhiệm riêng nào — tức là một
cửa duyệt không bảo vệ điều gì.

Dữ liệu xác nhận cũ được **giữ nguyên** để tra lại, chỉ không còn thao tác tạo mới.

## A8f. Tình hình chung — tab thứ hai của Tổng quan

Quản lý có hai câu hỏi khác nhau, và **không cần cả hai cùng lúc**:

| Tab | Câu hỏi |
|---|---|
| **Việc của tôi** | Tôi phải làm gì bây giờ? |
| **Tình hình chung** | Cả chi nhánh đang thế nào? |

Nhét chung một trang là cách chắc chắn nhất để việc của mình chìm trong số liệu của người khác. Tab nằm
trên đường dẫn (`?tab=tinh-hinh`) nên Back giữ đúng chỗ.

### Ba trạng thái, cộng lại đúng bằng tổng

| Trạng thái | Nghĩa là |
|---|---|
| Chưa có phương án hỗ trợ | Chưa có hướng xử lý và cũng chưa ai ghi việc nào |
| Đang xử lý | Đã có hướng xử lý, hoặc đã có ít nhất một phương án được ghi |
| Đã xong | Đã kết thúc theo dõi — **làm mờ và đẩy xuống cuối, không giấu đi** |

Đây là **một phép chia**: ba số cộng lại đúng bằng tổng số dòng bên dưới. Bản trước để bốn hàng đợi ở chỗ
này — bốn câu hỏi cố tình chồng nhau, nên bốn số không cộng thành gì cả và người đọc không biết mình đang
nhìn một phép chia hay một danh sách. Hai câu hỏi thật sự khác biệt còn lại xuống dưới, dưới nhãn
**Cần chú ý**, và nói rõ là câu hỏi:

- **Tới hạn xem lại** — đã hẹn xem lại và đã tới hạn.
- **Mức cao hoặc gấp** — SOS 3, hoặc người báo đánh dấu gấp.

### Số đếm ở mọi lựa chọn lọc

Mỗi chi nhánh, nhóm vấn đề và kỹ năng đều **kèm số ngay trên nút**, để đọc được `Học sinh 18 › Listening 6`
mà không phải bấm thử từng cái. Số được tính **chéo theo kiểu facet**: mỗi chiều đếm trên tập đã lọc bởi
các chiều *khác*, không phải bởi chính nó — nếu không thì chọn "Listening" xong mọi kỹ năng khác hiện 0 và
người dùng mất luôn đường đi tiếp.

Có riêng một lựa chọn **"Chưa phân loại"**, vì phần lớn vấn đề sinh từ điểm nằm ở đó cho tới khi có người
dạy nhận định. Thiếu nó thì `Học sinh 3` nằm cạnh một danh sách 34 dòng, và người đọc chỉ có thể kết luận
là hệ thống đếm sai.

Cột **Tình trạng** trong bảng dùng đúng ba trạng thái ở trên, không dùng trạng thái thô trong database:
một vấn đề đã có hai việc được ghi mà cột vẫn đề "Chưa xử lý" là số liệu tự mâu thuẫn.

Một vấn đề mở được **cả trong ngăn kéo lẫn ở trang riêng** — cùng một bản ghi, mở từ trang điểm, từ hồ sơ
học viên hay từ đây đều tới đúng nó.

**Quản lý không phải cửa duyệt mặc định**: chỉ những phương án mà **chính giáo viên** đánh dấu "cần duyệt"
mới phải chờ ý kiến Quản lý (xem A8g).

## A8g. Đề xuất phương án và duyệt

Bắt duyệt hết là biến phần mềm thành cửa xin phép; không duyệt gì thì việc tốn tiền lại không ai chịu
trách nhiệm. Nên **người đề xuất tự quyết**, theo từng phương án một:

| | |
|---|---|
| Trao đổi với em sau buổi học | Giáo viên tự làm, không gửi duyệt |
| Xếp tutor, lùi lịch thi | Gửi duyệt — có người phải chịu trách nhiệm về chi phí và lịch |

Chỉ **đề xuất** (trạng thái "Đã lên kế hoạch") mới gửi duyệt được: việc đã làm rồi thì không còn gì để
duyệt. Đã gửi duyệt thì **chờ** — chưa cập nhật kết quả được, vì việc thật sự chưa diễn ra.

Hạn trả lời tính lúc đề xuất: **3 ngày** với case SOS 3 hoặc mức gấp, **7 ngày** với các case còn lại.
Quá hạn thì đề xuất mang nhãn *"Quá hạn duyệt"* trong việc của Quản lý.

| Quản lý trả lời | Kết quả |
|---|---|
| **Duyệt** | Phương án chạy tiếp, mở khoá "Cập nhật kết quả" |
| **Không duyệt** | **Bắt buộc ghi lý do**; phương án chuyển sang *đã huỷ* |
| **Góp ý** | Ghi lại góp ý nhưng **KHÔNG kết thúc việc chờ** — Quản lý vẫn nợ một câu trả lời |

Đã trả lời rồi thì **không sửa đè**. Đổi ý là chuyện bình thường, nhưng ghi đè sẽ xoá mất lý do đã ghi và
giáo viên đọc lại không biết vì sao lúc đầu bị bác — nên đổi ý thì đề xuất lại, hồ sơ giữ cả hai lần.

`approval_state` để **NULL** nghĩa là *không cần duyệt*, khác hẳn `pending` là *đang chờ*. Các phương án
có từ trước khi có bước duyệt giữ nguyên NULL — không back-date một bước chưa từng tồn tại.

## A8j. Phân công giáo viên vào lớp

Đổi được: **Quản lý và Admin chi nhánh** trong đúng chi nhánh của lớp. Admin chi nhánh tạo được lớp nên
cũng phải xếp được người dạy. Giáo viên thì không.

- Mỗi kỹ năng là một **danh sách**, không phải một ô chọn — có lớp hai người cùng dạy một kỹ năng, và ô
  chọn một-người sẽ âm thầm đá mất người thứ hai (lỗi chỉ lộ ra khi ai đó không nhập được điểm).
- Màn hình gửi lên **nguyên bức tranh** đang hiển thị, không gửi từng thao tác thêm/bớt: hai người sửa
  cùng lúc thì kết quả vẫn là một trong hai bức tranh, không phải một trạng thái pha trộn không ai định.
- **Bỏ phân công không phải là xoá.** Dòng cũ đóng lại bằng `effective_to`; báo cáo cũ đọc lại vẫn thấy
  đúng ai dạy lúc đó, và điểm đã nhập giữ nguyên tên người nhập. Dòng không đổi **giữ nguyên**
  `effective_from` — đóng rồi mở lại là bịa ra một lần đổi người không có thật.
- Bỏ phân công thì **mất luôn quyền nhập điểm** kỹ năng đó, ngay lập tức.

## A8h. Tiến trình công việc: dữ kiện tự sinh + nhận định của quản lý

**Việc hệ thống nhìn ra** đọc thẳng từ dữ liệu và **tự hết khi nguồn được xử lý** — giáo viên nhập đủ
điểm thì *"thiếu điểm"* biến mất. Không có nút "Đã xong", vì đánh dấu chỉ che một con số vẫn đang đúng.
Mỗi tín hiệu ghi rõ **việc của ai** (xếp tuần MT là của Quản lý, cập nhật ngày là của Admin chi nhánh),
và bấm vào mở đúng những bản ghi tạo nên con số.

Đọc tín hiệu **không tạo bản ghi mới**. Mỗi tín hiệu có khoá ổn định theo nguồn.

**Việc quản lý đặc thù** (liên hệ phụ huynh, tổ chức bổ trợ…) mới nhập tay, vì không suy ra được từ dữ liệu.

### Chọn tuần

`← W2 SEP ▼ →`. Phần lớn thao tác là đi sang tuần liền kề — bắt mở dropdown rồi tìm đúng dòng là ba
thao tác cho một bước. Danh sách là **cửa sổ trượt** khoảng hai tháng lịch sử quanh tuần đang xem và
**một tuần tới**; chọn một tuần cũ thì cửa sổ dịch theo. Không có lý do mở báo cáo của nhiều tháng sau.

### Khoá thời gian cập nhật báo cáo tuần

Báo cáo tuần **chỉ cập nhật được trong hai ngày cuối của chính tuần đó**. Đầu tuần chưa có gì để báo cáo;
tuần tương lai lại càng không. Quy tắc này **enforce ở máy chủ**, không chỉ làm mờ nút — nút mờ chặn được
người dùng bình thường, không chặn được một request gửi thẳng.

### Công việc

- **Người phụ trách** là ô **gõ để tìm**, kèm vai trò và chi nhánh (`Nguyễn A · Admin CN · CP`) —
  một danh sách chỉ có tên là một danh sách chọn nhầm người.
- **Người theo dõi** (nhiều người): không phải người làm, không chịu trách nhiệm hoàn thành, nhưng được
  cập nhật khi tiến độ đổi. **Quản lý của chính chi nhánh được thêm sẵn** — đó là câu trả lời hệ thống
  đã biết.
- **Trường "Loại" đã bỏ.** Nó không đổi routing, quyền, hạn hay cách tổng hợp; chỗ duy nhất nó tác động
  là một nhánh lọc yếu ("việc dài hạn chưa xong" luôn được coi là cần chú ý), mà điều đó chính hạn của
  việc đã nói rồi. Cột cũ giữ nguyên giá trị lịch sử.

### Tutor part-time

Badge *"Đơn vị độc lập"* đã bỏ. Báo cáo của chi nhánh là **đầu vào**; **tutor mới là đơn vị được tổng hợp** —
nhiều chi nhánh cùng ghi nhận về một tutor thì đó vẫn là một tutor, không phải ba. Phần này giữ **nhẹ**,
không dựng một hệ quản lý nhân sự tutor.

## A8i. Lớp thường: Foundation · Beginner · Elementary

Ngoài lớp FT, trung tâm có ba chương trình dùng **bài kiểm tra riêng**, không dùng Mock Test.

| | FOUNDATION (`FOU`) | BEGINNER (`BE`) · ELEMENTARY (`ELE`) |
|---|---|---|
| Thời lượng | 8 tuần | 10 tuần |
| Bài giữa khoá | **tuần học 4** | **tuần học 5** |
| Bài cuối khoá | **tuần học 8** | **tuần học 10** |
| Kỹ năng | Listening · Reading · Prep-Writing · **Pronunciation** | Listening · Reading · Prep-Writing · **Speaking** |

"Tuần học 4" là **tuần thứ tư kể từ ngày khai giảng của lớp**, không phải "W4" của một tháng.
Lớp chưa có ngày khai giảng thì hệ thống **không đoán** — báo để điền vào trước.

### Cách chấm

Nhập **`số câu đúng / tổng số câu`** cho từng kỹ năng. Đạt từ **60%** trở lên.

Cả hai ô đều phải nhập: số câu **không cố định** giữa các kỹ năng và giữa các đề, nên tự điền
tổng là đoán bừa — mà đoán sai tổng thì đạt/trượt sai theo. Có thể đặt **tổng chung cho cả lớp**
một lần rồi sửa lại ở dòng có đề khác, vì cả lớp thường làm cùng một đề.

Hệ thống xét trên **tỷ lệ chính xác**, không làm tròn phần trăm rồi mới so:
`25/42` hiện ra "60%" nhưng thực tế là 59,5% nên vẫn là **chưa đạt**.

Ràng buộc kiểm ở **máy chủ**, không chỉ ở giao diện: tổng phải là số nguyên lớn hơn 0, số câu đúng
là số nguyên không âm và không lớn hơn tổng.

### Thiếu điểm ≠ Trượt

| | Thiếu điểm | Trượt |
|---|---|---|
| Nghĩa | Chưa nhập | Đã nhập, dưới 60% |
| Kết luận được chưa | **Chưa** | Có |
| Có sinh SOS không | **Không** | Có |

Phải **đủ điểm mọi kỹ năng** thì bài mới chuyển sang *đã xong* và mới kết luận. Đếm ô trống thành
một môn trượt là đẩy học viên lên SOS oan.

### SOS dùng chung hệ thống với lớp FT

Số môn chưa đạt ra mức SOS theo **đúng ngưỡng cũ**: 1 môn → SOS 1 · 2 môn → SOS 2 · từ 3 môn → SOS 3.
Case nằm trong **cùng bảng `sos_cases`**, nên hai card SOS ở Tổng quan đếm được cả lớp thường.
Sửa điểm làm đổi mức thì **giữ case và ghi lịch sử**, không xoá đi làm lại.

Lớp thường **không có** band IELTS, **không có** kỳ vọng theo target, **không có** Overall — vì bài
này không phải bài IELTS bốn kỹ năng. Để trống thay vì dựng một con số giả.

### Chương trình nằm trong dữ liệu

Bảng `programmes` + `programme_skills` + `programme_checkpoints`. Mở một chương trình mới là **thêm
dữ liệu**, không phải sửa mã nguồn — nhưng chỉ đến thế, không dựng công cụ thiết kế chương trình kéo thả.

Mã canonical là **`FOU`**; mã cũ **`FOUND`** chỉ được **ánh xạ khi đọc**. Cột `kind` của lớp giữ nguyên
chữ đã gõ, cột `programme_code` là mã chuẩn hoá mà mọi tính toán đọc vào — **không đổi mã lớp lịch sử**.

### Chuyển từ lớp FT sang lớp thường

Mở **khoá mới**, không mượn lộ trình IELTS đang có. Đó là một khoá khác: cách chấm khác, không có
target. Gắn bài Foundation vào lộ trình LT1 cũ thì lịch sử học thành một mớ lẫn lộn.
Lộ trình cũ vẫn giữ nguyên để tra lại.

## A9. Dữ liệu

Bảng chính: `branches` · `reporting_units` · `classes` · `class_skills` · `users` · `roles` ·
`permissions` · `role_permissions` · `user_roles` · `teacher_assignments` · `students` ·
**`programmes`** · **`programme_skills`** · **`programme_checkpoints`** · **`task_followers`** ·
**`learning_cycles`** · `enrollments` · `journey_events` · `report_periods` ·
**`assessment_attempts`** · **`attempt_schedule_history`** · **`attempt_skill_skips`** ·
**`assessment_scores`** · **`skill_checkins`** · `sos_cases` · `sos_case_history` ·
**`case_issues`** · **`case_interventions`** · **`case_followups`** · **`cycle_target_revisions`** ·
`unit_reports` · `tasks` · `task_history` · `notifications` · `audit_logs` · `demo_config` · `demo_sessions` ·
*(chỉ đọc, dữ liệu cũ)* `teacher_estimates`.

Nâng cấp database đang có: `npm run migrate` (giữ nguyên dữ liệu, chạy lại lần hai không làm gì thêm).
`npm run seed` là lệnh **xoá và tạo lại**, chỉ chạy khi bạn chủ động gọi.

Quyết định schema đáng chú ý:

- **Không có cột MT1…MT5 cố định** — mỗi lượt là một dòng `assessment_attempts`, khoá `UNIQUE(cycle_id, attempt_no)`.
- Target và ngày thi IELTS thuộc **`learning_cycles`**, không phải hồ sơ học viên.
- `assessment_scores` là **một dòng cho mỗi kỹ năng**, có `taken_on` (ngày mock thực tế) và `result_date` riêng.
  Có dòng với `taken_on` mà chưa có band nghĩa là **đã mock, chưa nhập điểm**.
- `attempt_skill_skips` chỉ ghi **ngoại lệ**; không có dòng nào nghĩa là phải đủ bốn kỹ năng.
- `assessment_attempts.target_at_attempt` chốt căn cứ kỳ vọng tại lượt đó; sửa lộ trình **không viết lại lịch sử**.
- `skill_checkins` chỉ thêm dòng, không sửa — lịch sử có sẵn. `band` được phép **NULL**: ghi nhận bằng lời
  là trường hợp thường gặp nhất, và `estimate_basis` nói con số (nếu có) dựa trên cái gì.
- `learning_cycles` giữ **điểm xuất phát** (`baseline_*`, luôn kèm nguồn) và **kết luận cuối** (`outcome_*`)
  tách khỏi `status`: đóng lộ trình về hành chính **khác** đạt mục tiêu.
- `cycle_target_revisions` lưu mỗi lần đổi mục tiêu kèm lý do và ngày hiệu lực. Các lượt đã chốt vẫn dùng
  `target_at_attempt` của chính nó, nên đổi mục tiêu **không chấm lại quá khứ**.
- `sos_cases.attempt_id` **được phép NULL** (vấn đề giáo viên báo không gắn bài nào), nhưng `student_id` và
  `cycle_id` thì **luôn có** — hồ sơ học viên tra theo học viên, không tra theo bài.
- `sos_cases.sos_level` **NULL** với vấn đề giáo viên báo; đó **không** phải SOS 0. Mức độ gấp nằm ở
  `urgency`, là một cột khác vì là một loại thông tin khác.
- `sos_cases.idempotency_key` và `journey_events.dedup_key` chống trùng ở **tầng database**: bấm hai lần,
  mạng chập chờn rồi thử lại đều chỉ để lại một bản ghi.
- Năm cột hỗ trợ cũ trong `sos_cases` (`talk_student_*`, `talk_parent_*`, `academic_*`, `ops_*`, `meeting_*`)
  **không còn đường ghi nào**; chúng chỉ tồn tại để dữ liệu cũ không mất và để bước nâng cấp đọc một lần.
  Việc đã làm nay nằm ở `case_interventions` — một vấn đề **nhiều** việc, mỗi việc **nhiều** lần xem lại.
- `unit_reports.status = NULL` nghĩa là **chưa báo cáo**, khác hẳn `'ok'`.
- `report_periods.week_start` là khoá thật; `code` chỉ là nhãn.
- `case_interventions.migration_key` là khoá **duy nhất** cho mỗi ô cũ được chuyển đổi, nên chạy lại bước
  nâng cấp không nhân đôi việc đã làm.

---

# B. SIMPLIFY / REMOVE

| Thành phần cũ | Xử lý trong bản này |
|---|---|
| Consultant / Consultant Manager | **Bỏ hẳn** khỏi tài khoản demo, navigation và UI. Bước trao đổi PH giữ nguyên, người thực hiện ghi bằng tên (Q4) |
| Vai trò "Head" riêng | Không tạo. **Head chính là Quản lý**. Bước "Head xác nhận" đã bỏ hẳn khỏi quy trình |
| Trang "Viết báo cáo" độc lập | Gộp trạng thái + ghi chú vào **Tiến trình công việc** |
| Ghi nhận sự việc / Issue Center | **Bỏ workflow độc lập**. Ghi chú báo cáo và case SOS liên kết thẳng tới công việc |
| Ghi nhận cảnh báo độc lập | SOS xuất hiện trong Mock. Lịch sử Warning/WL chỉ **đọc lại** trong hồ sơ, không phát hành mới |
| Menu SOS / agenda / công việc trùng nhau | Gộp vào **Chi tiết MT** và **Tiến trình công việc** |
| Menu **Mock test** riêng | Gộp vào **Học viên**: lớp → học viên → tiến độ MT → nhập điểm |
| Bảng tổng hợp hàng chục cột | KPI ít, danh sách hành động ngắn, số liệu hỗ trợ xuống phần mở rộng |
| Filter riêng từng loại sự kiện timeline | Còn **ba** lựa chọn |
| Nhãn "chỉ xem" rải ở từng kỹ năng | Thể hiện bằng khả năng tương tác; quyền kiểm ở API |
| Phân loại FT5/FT10 cố định | Cấu hình lớp gọn: loại lớp, lộ trình, kỹ năng, số buổi |
| Điểm danh / homework tổng quát, CRM, billing, LMS, trình dựng báo cáo, pipeline duyệt nhiều tầng | **Không đưa vào UI MVP** |
| 8 mục điều hướng | Còn **4** mục + 1 lối phụ |
| Demo Scene | Giữ nguyên cơ chế thử, cập nhật dữ liệu cho scope mới |

Các service đã xoá khỏi mã nguồn: `weekly` · `classes` · `tasks` (bản cũ) · `issues` · `reports` ·
`meetings` (bản cũ) · `assessments` · `import` · `admin`. Các trang đã xoá: `Dashboard` · `Classes` ·
`ClassDetail` · `Issues` · `Tasks` · `Reports` · `Meetings` (bản cũ) · `ImportWizard` · `WeeklyGrid`.

---

# C. FUTURE DESIGN

Ghi lại để bàn sau. **Chưa tạo menu trống, route mẫu hay schema lớn cho các ý này.**

- ~~Lớp thường FOU/BE/ELE~~ — **đã làm ở vòng C**.
- ~~Học viên class-first, nhập nhanh paste/Excel~~ — **đã làm ở vòng B**.
- ~~Tiến trình công việc sinh từ dữ liệu~~ — **đã làm ở vòng C**.
- **Tách Head khỏi Quản lý** nếu sau này trung tâm phân thêm cấp duyệt. Hiện tại Head và Quản lý là một,
  và quy trình **không có bước duyệt nào**: kết thúc theo dõi một vấn đề là quyền của GVCN lớp đó và
  Quản lý (`case.close`), không phải một cửa duyệt riêng.
- **Consultant / Consultant Manager có tài khoản riêng**, phối hợp CS / CX / Vận hành trong hệ thống;
  bước trao đổi PH khi đó chuyển từ "ghi tên" sang "giao việc cho tài khoản".
- **Nhiều chương trình / lộ trình**, quy tắc đánh giá riêng cho từng loại lớp (hiện kỳ vọng chỉ áp dụng FT LT1/LT2).
- **Attendance / homework**, bài kiểm tra ngoài Mock, nhập ước lượng giáo viên và phát hành Warning/WL
  khi có scope được xác nhận.
- **Quy trình xử lý sự việc tổng quát**, điều phối meeting, phê duyệt nhiều cấp — chỉ khi vận hành chứng minh cần.
- **Import dữ liệu hàng loạt**, xuất báo cáo theo mẫu, thông báo ngoài hệ thống (email/Zalo), phân tích xu hướng sâu.
- **Tổng hợp theo tháng** dùng lại chính `report_periods` (đã lưu `year`/`month`), không tách module riêng.

Nền tảng nhẹ đã chuẩn bị sẵn để mở rộng sau: ID ổn định · phân công nhiều người trên một lớp ·
lịch sử enrollment · kết quả theo từng attempt và từng kỹ năng · liên kết việc với nguồn ·
các hàm tính luật tập trung (`services/scoring.ts`, `services/week.ts`, `permissions.ts`).
**Không** dựng workflow engine hay hệ thống cấu hình mọi thứ.
