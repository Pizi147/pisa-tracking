# PISA Progress — Product / Web Design

Tài liệu thiết kế của bản demo local sau đợt overhaul lấy **Mock Test và xử lý SOS** làm trọng tâm.
Ba phần: **A. Current MVP** (đã build), **B. Simplify / Remove** (đã gộp hoặc bỏ),
**C. Future Design** (ghi lại, chưa build).

Trạng thái các câu cần chốt nằm ở `DEMO_ASSUMPTIONS.md`.

---

# A. CURRENT MVP

## A1. Kiến trúc thông tin

Bốn mục nghiệp vụ, không hơn. Quản trị là lối vào phụ trong menu tài khoản.

| Mục | Nội dung | Thao tác trọng tâm |
|---|---|---|
| **Tổng quan** | Tuần đang xem, tiến độ Mock, thiếu điểm/quá hạn, SOS cần xử lý | Bấm số liệu hoặc học sinh để mở đúng danh sách |
| **Mock Test** | Lịch và kết quả Mock trong cùng một danh sách | Lên lịch, dời lịch, nhập điểm, mở chi tiết, ghi nhận SOS |
| **Học viên** | Tìm học sinh, hồ sơ, lịch Mock, hành trình | Xem tiến trình và các lần Mock của một em |
| **Họp tuần** | Tình hình từng đơn vị và công việc theo dõi | Cập nhật ngắn, phân công, cập nhật tiến độ |
| *(phụ)* Quản trị | Ma trận quyền, đơn vị báo cáo, nhật ký, tài khoản | Chỉ xem, dành cho Admin |

**Không có menu riêng cho SOS, báo cáo, sự việc, agenda hay công việc.** Chúng nằm tại nơi phát sinh:
SOS trong chi tiết Mock; báo cáo và công việc trong Họp tuần.

Điểm mở đầu theo vai trò (chỉ đổi lối vào, không đổi quyền):

- Giáo viên → `Mock Test` với bộ lọc **Điểm tôi cần nhập** (xuyên tuần).
- Các vai trò còn lại → `Tổng quan` tuần hiện tại.

Bộ lọc mặc định là **tuần**. Bộ lọc chi nhánh **chỉ hiện khi tài khoản có nhiều hơn một chi nhánh**.
Bấm một KPI sẽ mở đúng danh sách bản ghi cấu thành số đó.

## A2. Tổ chức, lớp và quyền

Bốn nhóm tài khoản: **Admin · Admin chi nhánh · Quản lý · Giáo viên**.
GVCN/GVBM là **phân công trong lớp**, không phải loại tài khoản riêng.

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

| Permission | Admin | Admin chi nhánh | Quản lý | Giáo viên |
|---|:--:|:--:|:--:|:--:|
| `mock.view` | ✓ | ✓ | ✓ | ✓ (lớp được phân công) |
| `mock.schedule` | ✓ | ✓ | ✓ | ✓ (chỉ lớp mình chủ nhiệm) |
| `mock.cancel` | ✓ | ✓ | ✓ | — |
| `score.edit` | ✓ | ✓ | — | ✓ (chỉ kỹ năng được phân công) |
| `sos.edit` | ✓ | ✓ | ✓ | ✓ (lớp được phân công) |
| `sos.confirm` | ✓ | ✓ | ✓ | — |
| `student.view` / `student.edit` | ✓ | ✓ | ✓ | xem |
| `meeting.view` / `meeting.edit` | ✓ | ✓ | ✓ | — |
| `admin.config` | ✓ | — | — | — |

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

### Chờ đủ điểm (Q2)

**SOS chỉ được chốt khi có đủ cả bốn kỹ năng đánh giá.** Học sinh có thể thi Speaking một tuần và
ba kỹ năng còn lại tuần sau; trong lúc chờ, giao diện hiển thị tiến độ `n/4` và nhãn "Chờ k kỹ năng"
thay vì kết luận sớm là "Đạt kỳ vọng". Kỳ vọng chỉ áp dụng cho lộ trình **FT LT1/LT2** —
học sinh không có điểm cam kết thì không có kỳ vọng và không phát sinh SOS.

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

## A7. Họp tuần

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

## A9. Dữ liệu

Bảng chính: `branches` · `reporting_units` · `classes` · `class_skills` · `users` · `roles` ·
`permissions` · `role_permissions` · `user_roles` · `teacher_assignments` · `students` · `enrollments` ·
`journey_events` · `report_periods` · `mock_attempts` · `mock_schedule_history` · `mock_scores` ·
`sos_cases` · `sos_case_history` · `unit_reports` · `tasks` · `task_history` · `notifications` ·
`audit_logs` · `demo_config` · `demo_sessions`.

Quyết định schema đáng chú ý:

- **Không có cột MT1…MT5 cố định** trong bảng học sinh — mỗi lần Mock là một dòng `mock_attempts`.
- `mock_scores` là **một dòng cho mỗi kỹ năng**, có `test_date` và `result_date` **riêng của kỹ năng đó**.
- `mock_attempts.committed_score_at_test` chốt căn cứ kỳ vọng tại lần thi; sửa hồ sơ hiện tại
  **không viết lại lịch sử**.
- `unit_reports.status = NULL` nghĩa là **chưa báo cáo**, khác hẳn `'ok'`.
- `report_periods.week_start` là khoá thật; `code` chỉ là nhãn.
- `sos_cases` dùng **cột cố định** phản chiếu đúng các ô của `Nhap diem`, không phải bảng key–value tự do.

---

# B. SIMPLIFY / REMOVE

| Thành phần cũ | Xử lý trong bản này |
|---|---|
| Consultant / Consultant Manager | **Bỏ hẳn** khỏi tài khoản demo, navigation và UI. Bước trao đổi PH giữ nguyên, người thực hiện ghi bằng tên (Q4) |
| Trang "Viết báo cáo" độc lập | Gộp trạng thái + ghi chú vào **Họp tuần** |
| Ghi nhận sự việc / Issue Center | **Bỏ workflow độc lập**. Ghi chú báo cáo và case SOS liên kết thẳng tới công việc |
| Ghi nhận cảnh báo độc lập | SOS xuất hiện trong Mock. Lịch sử Warning/WL chỉ **đọc lại** trong hồ sơ, không phát hành mới |
| Menu SOS / agenda / công việc trùng nhau | Gộp vào **Chi tiết Mock** và **Họp tuần** |
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
