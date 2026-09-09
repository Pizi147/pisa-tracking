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

**Ba** mục nghiệp vụ, không hơn. Quản trị là lối vào phụ trong menu tài khoản.

| Mục | Nội dung | Thao tác trọng tâm |
|---|---|---|
| **Tổng quan** | Tuần đang xem, tiến độ MT, thiếu điểm/quá hạn, SOS cần xử lý | Bấm số liệu hoặc học sinh để mở đúng danh sách |
| **Tiến trình công việc** | Tình hình từng đơn vị và công việc theo dõi | Cập nhật ngắn, phân công, cập nhật tiến độ |
| **Học viên** | Lớp → học viên → tiến độ MT → nhập điểm, tất cả trong một mục | Mở lớp, nhập điểm, xếp lịch, thêm học viên hàng loạt |
| *(phụ)* Quản trị hệ thống | Ma trận quyền, đơn vị báo cáo, nhật ký, tài khoản | Chỉ xem, dành cho Quản trị hệ thống |

**Không có menu riêng cho SOS, báo cáo, sự việc, agenda, công việc — và từ vòng B, cũng không còn
menu riêng cho Mock test.** Chúng nằm tại nơi phát sinh: SOS trong chi tiết MT; báo cáo và công việc
trong Tiến trình công việc; lịch và điểm MT trong chính lớp của học viên.

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

Mã lớp luôn bắt đầu bằng mã chi nhánh: `MB-FT 101`, `CP-FT 110`, `BC-BE 80`, `HD-ELE 01`, `MB-FOUND 12`.
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
| `score.override` — nhập bù | ✓ | ✓ | — | — |
| `estimate.edit` | — | — | — | ✓ (chỉ kỹ năng được giao) |
| `sos.edit` | ✓ | ✓ | ✓ | ✓ (lớp được phân công) |
| `sos.confirm` — **Head** | ✓ | — | ✓ | — |
| `student.view` / `student.edit` | ✓ | ✓ | ✓ | xem |
| `meeting.view` / `meeting.edit` | ✓ | — | ✓ | — |
| `admin.config` | ✓ | — | — | — |

Những điểm đáng chú ý:

- **Chốt tuần và chốt ngày là hai quyền khác nhau.** Quyền tuần không tự kéo theo quyền ngày và ngược lại.
- **Xác nhận Head**: Head chính là Quản lý, không tách thêm vai trò riêng.
- **Nhập bù điểm** đi qua `score.override` riêng, ghi nhật ký riêng (`score.override` thay vì `score.edit`),
  nên siết lại chỉ là một dòng dữ liệu — ai được nhập bù vẫn chờ bạn chốt (O05).
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

Ngày nghiệp vụ tính theo `Asia/Ho_Chi_Minh`. Bản demo dùng **đồng hồ demo** cố định (mặc định `23/09/2026`)
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
Quản lý hoặc Admin chi nhánh **đánh dấu "không mock"** cho chính lượt đó; SOS khi ấy tính trên các kỹ
năng còn lại, giữ nguyên ngưỡng 1/2/≥3, kèm nhãn *Đánh giá trên N kỹ năng*.
**Không ai đánh dấu thì hệ thống chờ đủ bốn**, không tự suy.

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

### Teacher Estimate

Ước lượng của giáo viên là **dữ liệu riêng**, không bao giờ ghi đè điểm Mock. Mỗi lần cập nhật ghi thêm một
dòng nên có sẵn lịch sử. Giáo viên chỉ ước lượng được kỹ năng mình phụ trách; W1/W2 giữ riêng theo task.

So sánh *ước lượng mới nhất ↔ điểm Mock mới nhất của chính kỹ năng đó* đặt ở Hồ sơ học viên, luôn kèm
**ngày của cả hai** và **nguồn** của từng ô điểm. Điểm từng kỹ năng có thể thuộc các lượt khác nhau nên
không được ghép thành một bài Mock hay một Overall chung. Chênh lệch chỉ là khoảng cách hai con số,
không tự nó chứng minh tiến bộ.

## A5. Chi tiết Mock và xử lý SOS

Một trang duy nhất, chia khối ngắn, không dùng tab:

1. Học sinh · lớp **tại lần thi** · lộ trình · cam kết chốt tại lần thi · MT · tuần · ngày dự kiến · kỳ vọng.
2. Điểm từng kỹ năng: ngày thi riêng, số câu / tiêu chí, band, hạn nhập, người nhập.
   Bên dưới là bốn kỹ năng đánh giá + Overall + kết luận.
3. SOS và **checklist hành động theo đúng MT × mức SOS**.
4. Người thực hiện, ngày, nội dung hỗ trợ, meeting, ghi chú, trạng thái xử lý, Head xác nhận.
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

- Đây là **checklist cần phối hợp**, không phải việc hệ thống tự làm. SOS **không** tự cấp buổi học,
  **không** tự lùi lịch thi thật, **không** tự đóng case, **không** tự xác nhận Head.
- MT2 SOS3 là **hai phương án chọn một**, không phải hai việc đều bắt buộc.
- Bốn trạng thái mỗi bước: `Chưa ghi nhận` · `Có tên, chưa có ngày` · `Đã xếp lịch` (ngày ở tương lai) ·
  `Đã thực hiện` (ngày đã qua). **Có tên người làm mà chưa có ngày thì chưa tính là đã làm.**
- Trao đổi PH do **CS thực hiện ngoài hệ thống** (Q4): ghi lại **tên người làm và ngày**, không cần tài khoản CS.
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

## A8. Hồ sơ và Student Journey

Đầu hồ sơ: nhận diện · lớp hiện tại · lộ trình/cam kết · Mock tiếp theo · case và việc đang mở.

Lịch sử Mock giữ **lớp tại thời điểm thi**. Chuyển lớp mở dòng enrollment mới, chuyển các lượt
**chưa thi** sang lớp mới và **giữ nguyên lớp cũ cho lượt đã thi**.

Hành trình giữ chuyển lớp, tạm dừng, quay lại học. **Chỉ ba bộ lọc**: `Tất cả` ·
`Assessment` (kết quả Mock + ước lượng giáo viên) · `Warning / WL` (cảnh báo + WL).
Không có filter riêng cho từng loại sự kiện. Nhấp sự kiện mở đúng bản ghi liên quan.

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

## A8d. Đánh giá GV *(trước gọi là Ước lượng GV)*

Đây là **nhận định chủ quan hiện tại** của giáo viên về trình độ học viên ở kỹ năng mình phụ trách.
Giáo viên cập nhật **bất kỳ lúc nào** — không phụ thuộc tuần MT, hạn nhập điểm hay lịch assessment.
Chỉ sửa được kỹ năng mình phụ trách.

**Nhập giống hệt Mock**, để hai con số nằm cùng một thang:

- **L / R** → nhập `số câu đúng / 40`, hệ thống quy ra band.
- **W / S** → nhập đủ **bốn tiêu chí IELTS**, hệ thống tính band.

Band là kết quả **tính ra**, không phải con số gõ tay — một band trơ trọi không có căn cứ thì không so
được với gì.

**Một bảng chung, không phải hai bảng rời.** Việc thật lúc nào cũng là so hai con số ấy; hai bảng riêng
bắt người đọc tự ghép từng dòng trong đầu.

| Kỹ năng | Mock gần nhất | Đánh giá GV | Δ |
|---|---:|---:|---:|
| Listening | 6.0 | 6.5 | −0.5 |
| Reading | 6.5 | 6.5 | 0 |

**Δ = Mock − Đánh giá GV**, đọc **theo học viên**: dương là em **đang thể hiện tốt hơn** mức giáo viên
đánh giá (màu tích cực), âm là **thấp hơn** (màu cảnh báo), bằng nhau là trung tính.

> Bảng ví dụ trong prompt ghi Δ = +0.5 khi Đánh giá GV cao hơn Mock, nhưng quy tắc màu ngay dưới lại
> nói "Mock < Đánh giá GV → warning". Hai điều đó ngược nhau. Đã theo **quy tắc màu**, vì nó nói rõ ý
> nghĩa cần đọc ra; nếu anh/chị muốn chiều ngược lại thì đổi một dòng.

Bấm vào một ô điểm mở **căn cứ**: số câu đúng, hoặc bốn tiêu chí.

## A8e. Case SOS: nhìn là biết đã làm tới đâu

Ba trạng thái, ba màu khác nhau ngay ở danh sách: **Chưa xử lý** · **Đang xử lý** · **Đã xử lý**.
Kèm một dòng ngữ cảnh — mốc follow-up gần nhất, hoặc *"Chưa có follow-up"*. Không phải mở chi tiết
mới biết case đã được làm hay chưa. Số liệu trên Tổng quan lấy từ chính trạng thái này.

"GVCN đã nhận" là **metadata**, không phải trạng thái thứ tư: nhận tài liệu không tự nó nghĩa là đã xử lý.

### "Head xác nhận" — đã bỏ

Đối chiếu code: `confirmCase` chỉ ghi tên và ngày. Nó **không** khoá điểm, **không** là điều kiện để
đổi trạng thái case, **không** mở khoá bước nào, và **không** gắn với một trách nhiệm riêng nào —
tức là một cửa duyệt không bảo vệ điều gì. Case kết thúc bằng chính **trạng thái xử lý**.

Dữ liệu xác nhận cũ được **giữ nguyên** để tra lại, chỉ không còn thao tác tạo mới.

## A8f. Tiến trình công việc: dữ kiện tự sinh + nhận định của quản lý

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

## A8g. Lớp thường: Foundation · Beginner · Elementary

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
**`assessment_scores`** · **`teacher_estimates`** · `sos_cases` · `sos_case_history` ·
`unit_reports` · `tasks` · `task_history` · `notifications` · `audit_logs` · `demo_config` · `demo_sessions`.

Nâng cấp database đang có: `npm run migrate` (giữ nguyên dữ liệu, chạy lại lần hai không làm gì thêm).
`npm run seed` là lệnh **xoá và tạo lại**, chỉ chạy khi bạn chủ động gọi.

Quyết định schema đáng chú ý:

- **Không có cột MT1…MT5 cố định** — mỗi lượt là một dòng `assessment_attempts`, khoá `UNIQUE(cycle_id, attempt_no)`.
- Target và ngày thi IELTS thuộc **`learning_cycles`**, không phải hồ sơ học viên.
- `assessment_scores` là **một dòng cho mỗi kỹ năng**, có `taken_on` (ngày mock thực tế) và `result_date` riêng.
  Có dòng với `taken_on` mà chưa có band nghĩa là **đã mock, chưa nhập điểm**.
- `attempt_skill_skips` chỉ ghi **ngoại lệ**; không có dòng nào nghĩa là phải đủ bốn kỹ năng.
- `assessment_attempts.target_at_attempt` chốt căn cứ kỳ vọng tại lượt đó; sửa lộ trình **không viết lại lịch sử**.
- `teacher_estimates` chỉ thêm dòng, không sửa — lịch sử có sẵn.
- `unit_reports.status = NULL` nghĩa là **chưa báo cáo**, khác hẳn `'ok'`.
- `report_periods.week_start` là khoá thật; `code` chỉ là nhãn.
- `sos_cases` dùng **cột cố định** phản chiếu đúng các ô của `Nhap diem`, không phải bảng key–value tự do.

---

# B. SIMPLIFY / REMOVE

| Thành phần cũ | Xử lý trong bản này |
|---|---|
| Consultant / Consultant Manager | **Bỏ hẳn** khỏi tài khoản demo, navigation và UI. Bước trao đổi PH giữ nguyên, người thực hiện ghi bằng tên (Q4) |
| Vai trò "Head" riêng | Không tạo. **Head chính là Quản lý** |
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

- **Lớp thường FOU/BE/ELE** dùng chung engine assessment với scoring policy riêng (score/total, ≥60% đạt) — vòng C.
- **Học viên class-first**, Tiến độ học viên, nhập nhanh paste/Excel — vòng B.
- **Workflow Report/WL** và Tiến trình công việc sinh từ dữ liệu — vòng C.
- **Tách Head khỏi Quản lý** nếu sau này trung tâm phân thêm cấp duyệt. Hiện tại Head và Quản lý
  là một, `sos.confirm` gắn thẳng vào vai trò Quản lý.
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
