# Bản đồ overhaul — design plan đối chiếu mã nguồn

Phiên bản 1.0 · 21/09/2026 · **Sổ tra cứu, không phải sổ giao việc.** Giao việc ở `plan.md`.

> **File này sinh ra để đóng một lỗ hổng thật.**
>
> `PISA-Design-Plan-after-PR28.md` mục 4–10 và 18–22 đặc tả overhaul **bảy trang chính**.
> Nhưng `plan.md` chỉ chép mục 18 vào **đúng một PR** (PR-I — hồ sơ Test). Bảy trang còn lại
> chưa bao giờ trở thành việc. Hậu quả: đọc `plan.md` thì tưởng chỉ còn vài việc dọn; đọc
> design plan thì thấy còn cả một overhaul chưa bắt đầu. Hai tài liệu nói hai chuyện khác nhau
> và **không ai nối chúng lại**.
>
> File này là tầng nối đó: mỗi yêu cầu của design plan → tình trạng mã nguồn đã kiểm → PR nào làm.
>
> Cột "Tình trạng" chỉ được ghi khi **đã đọc mã nguồn hoặc đã bấm thử**, không suy từ tài liệu.

---

## 1. Cách đọc bảng

| Nhãn | Nghĩa |
|---|---|
| ✅ **Đã làm** | Đã kiểm bằng mã nguồn hoặc bấm thử. Đừng làm lại |
| 🟡 **Một phần** | Có nền nhưng chưa đủ yêu cầu. Cột bên phải nói còn thiếu gì |
| ❌ **Chưa làm** | Không có dòng mã nào |
| ⚰️ **Hết hiệu lực** | Yêu cầu cũ bị rule mới thay. **Đừng triển khai** |

---

## 2. Điều hướng và khung — design plan §3, §17.1 (D01)

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Bốn khu vực cấp chính: `Tổng quan / Học viên & Lớp / Test / Công việc` | ❌ Chưa làm | `web/src/App.tsx` → `NAV` có **3 mục**: `Tổng quan`, `Học viên`, `Tiến độ công việc`. **Không có khu vực Test** | **PR-O** |
| Phân tích là **tab** trong Tổng quan, có URL riêng | 🟡 Một phần | Tổng quan đã có cơ chế tab (`tab === 'work'`), nhưng Phân tích vẫn là route riêng `/hoc-thuat` trỏ vào `CaseBoardPage` cũ | **PR-O** + PR-P |
| Hiển thị theo capability và scope, không theo tên vai | ✅ Đã làm | `session.nav` lọc mục theo quyền; `permissions.ts` là cửa duy nhất | — |
| Một thanh điều hướng ngang, không thêm sidebar thứ hai | ✅ Đã làm | `App.tsx` dùng một `<nav>` ngang, bản mobile cùng dữ liệu | — |
| Mọi link cũ phải còn sống sau khi đổi điều hướng | 🟡 Một phần | Đã có tiền lệ tốt: `LegacySheetRedirect`, `/hop-tuan → /tien-trinh`. Đổi 4 khu vực phải thêm redirect tương tự | **PR-O** |

---

## 3. Tổng quan — design plan §4, §18.2

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Bốn ô số: `Học viên dưới kỳ vọng` · `HV có case đang mở` · `Chờ xác minh quá hạn` · `Phương án cần cập nhật` | 🟡 Một phần | `MetricTiles.tsx` có ba trong bốn ô. Hàm tập ID của `hv-duoi-ky-vong-mon` và `hv-sos-hien-tai` **đã có** (PR-N, `danhGia.ts`, 4 phép kiểm + kiểm ngược); còn thiếu chính ô số ở giao diện | PR-P |
| Khối `Cần xử lý` — 5–8 dòng, mỗi dòng có đối tượng + việc + người + hạn + một nút | ❌ Chưa làm | Không có khối nào tên vậy | **PR-P** |
| Khối `Điểm đáng chú ý` — tối đa 3 nhận định có số và link nguồn | ❌ Chưa làm | Không có | **PR-P** |
| **Bỏ** hàng đợi việc đầy đủ khỏi màn chính, chỉ giữ preview | ❌ Chưa làm | `OverviewPage.tsx` vẫn render `<WorkList>` đầy đủ kèm bộ lọc và phân trang | **PR-P** |
| **Bỏ** khối `Sự kiện nổi bật` lớn khỏi màn đầu | ❌ Chưa làm | `OverviewPage.tsx` vẫn render `<Highlights>` ở vị trí cao | **PR-P** |
| Bảng `Theo chi nhánh` mở tới lớp, tên cột dễ hiểu, số có đơn vị | 🟡 Một phần | **Phần số: ✅ PR-N.** `branchPulse` lấy năm tập ID từ `metricSet` (cùng hàm với `<SoLieu>`), hàng tổng là chính tập gốc, mỗi hàng kèm `ids`; bấm thử: bảng và ô số cùng 22/7/15, thêm một case thì cùng lên 23/8. Cột "quá hạn cập nhật" đổi sang đơn vị phương án. **Còn thiếu:** ô của bảng chưa mở panel `<SoLieu>`; bố cục, tên cột cuối cùng | PR-P |
| `Lịch sắp tới` — ba tab tuần, mỗi sự kiện một dòng, không hiện nhóm 0 | 🟡 Một phần | `Highlights.tsx` có ba tuần nhưng chiếm diện tích lớn và chưa thu gọn khi ít sự kiện | **PR-P** |
| Thay `13/4` bằng hai cột `13 case mở` và `4 chưa có PA` | ❌ Chưa làm | — | **PR-P** |
| GV không thấy bảng chi nhánh; màn đầu là `Việc cần làm` + `Học viên cần hỗ trợ` | 🟡 Một phần | Đã lọc theo quyền, nhưng chưa có khối `Học viên cần hỗ trợ` riêng | **PR-P** |
| Thứ tự ưu tiên việc: quá hạn xác minh/duyệt → thiếu chủ trách nhiệm → thiếu PA → thiếu kết quả → lịch gần | ❌ Chưa làm | `mywork.ts` xếp theo chín nhóm, không theo thứ tự này | **PR-P** |
| Không thêm risk score tổng hợp | ✅ Đã làm | Không có điểm tổng hợp nào | — |

---

## 4. Phân tích — design plan §5, §18.3

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Bốn góc nhìn: `Vấn đề học viên \| Kết quả hỗ trợ \| Giáo viên \| Theo tuần` | ❌ Chưa làm | `/hoc-thuat` vẫn là màn `CaseBoardPage` cũ với bộ lọc phẳng | **PR-P** |
| Bỏ tên mơ hồ `Thực trạng` | 🟡 Một phần | Chữ đã đổi ở một số chỗ trong PR-H, nhưng cấu trúc trang chưa đổi | **PR-P** |
| Bỏ danh sách `Việc đã giao` ở cuối khu phân tích | ❌ Chưa làm | — | **PR-P** |
| Ma trận: hàng là vấn đề cụ thể, cột là CN hoặc lớp; ô là `n HV / N HV thuộc phạm vi kỹ năng` | 🟡 Một phần | `IssueAnalysis.tsx` + `effectiveness.ts` → `issueSkillRows`/`issueBoard` có bảng hàng kỹ năng, chưa phải ma trận vấn đề × lớp | **PR-P** |
| Bấm số mở panel `{n} học viên — {vấn đề}` với tên, lớp, case, PA, cập nhật gần nhất | 🟡 Một phần | `issueBoardCases` mở được danh sách case, chưa phải panel học viên theo đặc tả | **PR-P** |
| Không dùng một panel case cho cả số HV lẫn số PA | ❌ Chưa làm | Hiện dùng chung một đường | **PR-P** |
| `Kết quả hỗ trợ`: tiêu đề ngữ cảnh `Listening · {phân loại} · {kỳ}`, bảng loại PA + cỡ mẫu + mức cải thiện | 🟡 Một phần | `effectiveness.ts` có phép tính đúng (D03 đã áp: `Có cải thiện` gồm hai mức, `Chưa đủ dữ liệu` ngoài mẫu số). Thiếu bố cục và thanh tỷ lệ trong ô | **PR-P** |
| Nhóm `chưa xác định nguồn` (F03) hiện ra ở giao diện | ❌ Chưa làm | `planOutcomesUnattributed` đã có hàm, **chưa màn nào gọi** (`plan.md` 12.8) | **PR-P** |
| Liên kết `Cần bổ sung đánh giá` ngoài bảng hiệu quả | ❌ Chưa làm | — | **PR-P** |
| Góc nhìn **`Giáo viên`** (§6 đầy đủ) | ❌ Chưa làm | Không có màn nào. Chốt 21/09: **hoãn sau deploy bản chính** — xem mục 10 | *hoãn* |
| `Theo tuần`: bảng tháng, hàng tuần mở/thu, nhóm cột `Kết quả Test` và `Tình trạng xử lý hiện nay` | 🟡 Một phần | `WeeklyBoard.tsx` + `weekly.ts` có bảng tuần. **DATA-01 đã đóng từ PR-F; PR-N thêm** danh sách khi bấm số (`weeklyDrill`, `GET /weekly-rollup/ids`) và "HV có case" đếm duy nhất theo tháng/cả bảng (demo: 20, không phải 22). Thiếu: nhóm cột phân cách, chọn cột, nối ô vào panel | PR-P |
| Không gọi cột trạng thái hiện tại là "tại cuối tuần trước" | ✅ Đã làm | Rule book §11 đã áp trong PR-H | — |
| Cột kỹ năng gồm `Ý thức/Khác` | ⚰️ Hết hiệu lực | Rule mới 21/09: Ý thức không còn là vấn đề theo kỹ năng. Thành **góc nhìn riêng** | **PR-K** |

---

## 5. Công việc — design plan §7, §18.4

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Ba tab `Hỗ trợ học viên / Vận hành / Báo cáo đơn vị` | 🟡 Một phần | Có `MgmtTasksPage` (vận hành) và `MeetingPage` (tình hình đơn vị) nhưng là **hai route riêng**, không phải ba tab một nơi | **PR-R** |
| Tên tab dùng bản §18.4, **không** dùng bản §7.1 (`Việc học viên / Việc vận hành / Tình hình đơn vị`) | ❌ Chưa làm | Đây là lỗi "một khái niệm hai chữ" — hai mục của cùng design plan gọi khác nhau | **PR-R** |
| `Hỗ trợ học viên`: bốn bộ lọc nhanh `Tất cả / Quá hạn / Đến hạn / Chờ duyệt` | 🟡 Một phần | `WorkList.tsx` có bộ lọc nhưng nhiều hơn bốn và bày thành chuỗi nút dài | **PR-R** |
| `Vận hành`: bảng năm cột `Công việc / Người phụ trách / Hạn hoàn thành / Trạng thái / Cập nhật gần nhất` | 🟡 Một phần | `MgmtTasksPage.tsx` có bảng, chưa đúng năm cột và còn lặp ghi chú ở cả Trạng thái lẫn Cập nhật | **PR-R** |
| Bỏ chuỗi hơn mười nút lọc ngang trên một hàng | ❌ Chưa làm | — | **PR-R** |
| `Tạm ngưng` phải có lý do, người cần hỗ trợ, ngày xem lại; không xoá quá hạn gốc | ❌ Chưa làm | `mgmttasks.ts` có lý do bắt buộc cho một số chuyển trạng thái, chưa đủ ba thứ | **PR-R** |
| Dời hạn lưu ngày cũ và lý do; độ trễ không reset khi sửa deadline | ❌ Chưa làm | — | **PR-R** |
| Việc con quá hạn hiện **tên việc con**, không chỉ badge | ❌ Chưa làm | — | **PR-R** |
| Không mặc định thêm Kanban hay Gantt | ✅ Đã làm | Chỉ có bảng | — |
| `Báo cáo đơn vị` thứ tự mới: tuần+kỳ → số đã nộp/còn thiếu → ma trận → cần quyết định | ❌ Chưa làm | `MeetingPage.tsx` vẫn đặt hai danh sách dài trước bảng — đúng lỗi §7.3 mô tả | **PR-R** |
| Ba trạng thái tách bạch `Nháp / Đã nộp / Chưa báo cáo`; nháp không tính đã báo cáo (D04) | ❌ Chưa làm | Bảng `unit_reports` + `unit_report_history` đã có chỗ lưu, luồng nháp chưa dựng | **PR-R** |
| `Chưa báo cáo` không được viết là `Ổn` | ✅ Đã làm | Đã đổi chữ trong PR-H, có ghi ở `TU_DIEN_VA_CHU.md` §3 | — |
| Liên kết báo cáo ↔ task **thật** (F06) | ❌ Chưa làm | `meetingBoard` vẫn gợi ý theo "cùng nhóm + cùng CN", không phải quan hệ tường minh. Nếu giữ gợi ý thì phải gọi `Việc cùng nhóm` | **PR-R** |
| Hai nhóm việc Ý thức trong hàng công việc | ⚰️ Hết hiệu lực | Rule mới: thay bằng **một dòng nhắc** `N học viên có vi phạm chưa xử lý quá 5 ngày` | **PR-K** |

---

## 6. Học viên & Lớp — design plan §8.3, §8.4, §18.5, §18.6, §22.2

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Tiêu đề khu vực đổi thành `Học viên & Lớp` | ❌ Chưa làm | `NAV` ghi `Học viên` | **PR-O** |
| Một ô tìm kiếm dùng được tên HV / mã HV / mã lớp | 🟡 Một phần | `StudentsPage.tsx` có tìm kiếm, chưa xác nhận đủ ba loại | **PR-Q** |
| Lọc chi nhánh dùng dropdown khi nhiều CN, **không** bày đồng thời dropdown và dải tab CN | ❌ Chưa làm | — | **PR-Q** |
| Hàng lớp chỉ 2–3 thông tin quan trọng: bài cần chấm, case mở, mốc sắp tới | 🟡 Một phần | `StudentsPage.tsx` có badge nhưng còn cả chùm | **PR-Q** |
| Đổi badge `case SOS` thành nhãn chính xác với tập đếm | ❌ Chưa làm | Vẫn còn cách gọi cũ; case còn mở **không** đồng nghĩa em hiện vẫn SOS | **PR-Q** |
| Bỏ dòng hướng dẫn `Lớp là gốc…` và chân trang `badge chỉ xuất hiện…` | 🟡 Một phần | Đã ghi vào `TU_DIEN_VA_CHU.md` §2 để bỏ; `plan.md` 12.11 nói chưa quét từng màn | **PR-S** |
| Lớp mặc định thu gọn khi danh sách dài; tìm kiếm tự mở lớp chứa kết quả | ❌ Chưa làm | — | **PR-Q** |
| **Hồ sơ lớp: 4 tab** `Học viên \| Ý thức \| Phân tích lớp \| Giáo viên` (chốt 21/09) | ❌ Chưa làm | `ClassOverviewPage.tsx` có **2 tab** `Học thuật \| Ý thức`, và đó là hai *dạng xem bảng học viên*, không phải 4 tab | **PR-Q** |
| `Lộ trình` và `Chuyển tiếp lớp` là **nút ở header**, không phải tab (chốt 21/09) | ❌ Chưa làm | Hiện là mục menu riêng. §22.2 đòi bỏ màn trung gian `Thông tin lớp` | **PR-Q** |
| Danh sách HV là nội dung chính mặc định; phân tích lớp không chiếm màn đầu | 🟡 Một phần | Cần kiểm lại sau khi dựng 4 tab | **PR-Q** |
| Tab Giáo viên dùng chung form Phân công, không hai bộ form | ❌ Chưa làm | `TeacherAssignPanel.tsx` tồn tại; chưa nối thành tab | **PR-Q** |
| Bỏ chân bảng dài về `năm cột số… đừng chia chung` | ❌ Chưa làm | `ClassIssueBoard.tsx` còn `SectionNote` giải thích mô hình | **PR-S** |
| FT ghi `Lịch Mock Test được xếp riêng cho từng học viên`; Normal ghi `Các mốc kiểm tra được tính từ tuần khai giảng` | 🟡 Một phần | Đã có trong bảng chữ; chưa xác nhận đã áp đúng ngữ cảnh FT/Normal | **PR-S** |
| Ba luật phân công GV kiểm ở máy chủ | ✅ Đã làm | `classes.ts:690–760`, đã kiểm (`plan.md` 2.2). **Đừng viết lại** | — |
| Combobox chọn GV có tìm kiếm từ 3 ký tự (§22.5) | 🟡 Một phần | `PeoplePicker.tsx` đã có. `plan.md` 12.11: ô `Chọn giáo viên` trong `Người phụ trách` **chưa làm** (cần lọc theo GV ở máy chủ) | **PR-Q** |

---

## 7. Hồ sơ học viên và hành trình — design plan §8.1, §8.2, §18.7

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Giữ hồ sơ A: header không sticky, điểm theo kỳ vọng, case mở tại chỗ | ✅ Đã làm | Quyết định 17/09 giữ hồ sơ A; PR18 + PR-D đã làm | — |
| Bốn ô đầu đổi thành `Kết quả Test gần nhất / Kỹ năng cần hỗ trợ / Case đang mở / Việc cần làm tiếp` | ❌ Chưa làm | `StudentDetailPage.tsx` → `HeaderStats` còn bộ ô cũ | **PR-Q** |
| Ô Test ghi đợt và ngày, OVR nếu đủ; Normal ghi đủ/thiếu bao nhiêu môn, **không bịa OVR** | 🟡 Một phần | `<KetQuaDot>` đã có luật và phép kiểm đúng, nhưng `plan.md` 12.7: **chưa màn thật nào dùng nó** | **PR-Q** |
| Ô việc có động từ và hạn, không dùng một ngày cũ làm nội dung chính | ❌ Chưa làm | — | **PR-Q** |
| Bốn ô số phải **bấm được** để mở tab đợt | ❌ Chưa làm | `HeaderStats`/`Stat` là `<div>` tĩnh (`plan.md` 12.5) | **PR-R** |
| Mỗi PA một khối ba phần: `Nội dung và người làm \| Kết quả gần nhất và ngày \| Việc tiếp theo và hạn` | 🟡 Một phần | PR-D đã gộp thành một khối case, mỗi PA một dòng, ghi kết quả tại dòng. Chưa đúng bố cục ba phần | **PR-Q** |
| PA đã xong thu gọn phía dưới; không giấu PA đang chạy sau `và một việc nữa` | 🟡 Một phần | Case đóng/mở đã tách; cần kiểm lại ở mức PA | **PR-Q** |
| Bỏ khung `CasePanel` thứ hai lặp case | ✅ Đã làm | PR-D (chặng 0, commit `b5a48ad`) đã gộp hai khối lồng nhau | — |
| Bỏ nút `Mở trang riêng`, **giữ** route `/hoc-thuat/case/:id` | ✅ Đã làm | Quyết định 19/09, đã áp | — |
| Bỏ ô điểm tự chấm khỏi cập nhật PA (CASE-05) | ✅ Đã làm | `MetricsField` đã gỡ; hình dạng cuối là `ComponentsField` ở màn Hoàn thành case | — |
| Ô `Điểm chi tiết theo kỹ năng` của tab nhập bù chưa nối dây | ❌ Chưa làm | `backfillCase` (máy chủ) đã nhận `metrics` và validate; thiếu component UI. Nối theo hình `ComponentsField` (`plan.md` 12.2) | **PR-S** |
| Hành trình: chọn `Toàn bộ / một kỹ năng / Ý thức`, mặc định 6–8 tuần | ❌ Chưa làm | `JourneyTimeline.tsx` mở toàn bộ mọi kỹ năng | **PR-Q** |
| Thanh chặng gọn: vào lớp → Test → hỗ trợ → chuyển tiếp | ❌ Chưa làm | — | **PR-Q** |
| `Các mốc đã qua` đổi thành `Mốc học tập` | 🟡 Một phần | Trong bảng chữ; chưa xác nhận đã áp | **PR-S** |
| Mốc Test trên hành trình bấm được | ❌ Chưa làm | Mốc chỉ có `title` tooltip, không có `onClick` (`plan.md` 12.5) | **PR-R** |
| Bỏ ô điểm cho Ý thức/Khác, thay bằng nguồn báo cáo và tình trạng xử lý | ⚰️ Hết hiệu lực | Rule mới: Ý thức thành **tab riêng** với dòng thời gian vi phạm + biện pháp | **PR-K** |
| Ý thức hiện `đợt xử lý/tái diễn`, `deadline`, `kết luận` | ⚰️ Hết hiệu lực | Không còn đợt, không còn deadline, không còn kết luận | **PR-K** |
| **CASE-04** — đính kèm tệp / liên kết bằng chứng cho case và phương án học thuật | ✅ Đã làm | PR-N N5–N6. Một bảng `attachments` dùng chung, khối `BangChung` gắn ở thẻ case và lịch sử phương án. Quyền xem = quyền xem bản ghi chủ ở mọi đường (danh sách, tải, gỡ); thêm/gỡ = quyền sửa case (C02); thêm và gỡ có audit; lỗi tải tệp hiện ở dòng tệp, không mất mô tả đang gõ. 9/10 lần cố ý làm hỏng bị bắt, lần còn lại là lớp phòng thủ thừa (đã thêm phép khoá tính chất an toàn). Bấm thử ở ba vai (Quản trị, Quản lý, GV bộ môn) + màn 375px. **Đường multer/tải về không có phép kiểm HTTP** — chỉ kiểm bằng trình duyệt thật | — |
| Đính kèm tệp/liên kết cho **vi phạm** và **biện pháp xử lý** (Thư cảnh cáo, Đình chỉ học bắt buộc có) | 🟡 Một phần | Kho và khối `BangChung` đã sẵn, hai loại chủ đã được khai tên nhưng **bị từ chối cho tới khi có bản ghi chủ** (có phép kiểm khoá). PR-J chỉ phải thêm dòng quyền chủ + gắn khối; không dựng kho thứ hai | **PR-J**, **PR-K** |

---

## 8. Test — design plan §9, §18.8, §20, §22.1

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Hồ sơ Test **bỏ hẳn** khối case, phương án, timeline case, form hoàn thành case (§22.1) | ✅ Đã làm | PR-I (chặng 4, commit `4fae005`) | — |
| Một bảng theo kỹ năng, W1/W2 mở tiêu chí ngay dòng, lịch và hạn cạnh điểm | ✅ Đã làm | PR-I | — |
| Overall thiếu điểm thì ghi `Chưa đủ điểm`, **cấm** badge đạt | ✅ Đã làm | `<KetQuaDot>` + phép kiểm; đóng lỗi MT-P01/P02 | — |
| Một hành động chính, ngoại lệ vào menu đúng quyền | ✅ Đã làm | PR-I: `Xử lý vắng` cho GVCN, `Trả lời đề nghị` cho QL | — |
| Dấu `-` → còn đến hết Chủ nhật thì chốt `Không dự thi` | ✅ Đã làm | PR-G (chặng 3, commit `4970016`), 16 phép kiểm | — |
| Writing chỉ chốt vắng khi **cả hai** W1 và W2 là `-` | ✅ Đã làm | Chốt 20/09, đã áp và có phép kiểm | — |
| Bộ chọn tuần một hàng `Trước \| tuần \| Sau \| Tuần này`, popover lịch (§22.3) | 🟡 Một phần | PR2a + PR-E đã làm component. Chưa kiểm ở panel 600px, modal rộng và mobile (§22.8 điểm 3) | **PR-R** |
| Panel Kế hoạch Test bố cục mới 5 phần: `Lớp và HV → Lượt và lịch hiện tại → Lịch mới → Kiểm tra thay đổi → Lưu` | ❌ Chưa làm | `MockPlanPanel.tsx` vẫn là `một tuần chung + bốn checkbox + dãy MT1–MT7` | **PR-R** |
| Hai hàng lịch nhanh RLW / Speaking tách riêng | ❌ Chưa làm | `plan.md` 12.6 — cần thiết kế lại khối `Kỹ năng lượt này yêu cầu` | **PR-R** |
| Ô đã có lịch mở **chỉnh sửa** với tuần cũ → mới, không chọn rồi báo lỗi trùng | ❌ Chưa làm | Panel chỉ gọi `bulkPlan` → `createAttempt` (luôn INSERT). Sửa thật phải gọi `setSkillWeek` từng kỹ năng | **PR-R** |
| Ô đã hoàn tất chỉ xem lịch | ❌ Chưa làm | `assessment_attempts.status` không có giá trị riêng cho "hoàn tất" — đang SUY ra. **Cần định nghĩa ở tầng dữ liệu trước khi chặn** (`plan.md` 12.6) | **PR-R** |
| **Nút dời lịch một kỹ năng cho lớp Normal** | ❌ Chưa làm | Quyền `schedule.move` đã mở ở máy chủ (12 phép kiểm), nhưng nút chỉ tồn tại ở `MockDetailPage.tsx`, mà file đó điều hướng **mọi** lượt Normal sang `RegularSheetPage.tsx` — nơi không có nút nào | **PR-R** |
| Deep-link đến đúng đợt và kỹ năng: một quy ước URL duy nhất | ❌ Chưa làm | Cần chốt `?attempt=<id>` hoặc `?focus=<attemptId>:<skill>` trên `StudentDetailPage` **trước**, rồi mới nối bốn đường vào | **PR-R** |
| Bốn đường vào nhập điểm còn lại | ❌ Chưa làm | (a) badge lớp mở hàng đợi lọc chứ không mở lưới chấm · (b) nhãn MT2/MT3 ở bảng lớp trỏ vào màn chấm, không phải hồ sơ · (c) bốn ô số đầu hồ sơ không bấm được · (d) mốc Test trên hành trình không bấm được | **PR-R** |
| Thông báo trỏ đúng hồ sơ | ❌ Chưa làm | Bảng `notifications` không có `studentId`; cần JOIN ở `GET /notifications` theo `entity_type`, **không đổi schema** | **PR-R** |
| Không bắt bấm `Đã thi` trước khi chấm | ✅ Đã làm | MT-P03 đã đóng trong PR-I | — |
| Normal không có Hủy Test / Hủy kỹ năng | ✅ Đã làm | Quyết định 17/09, đã áp | — |
| Không có nút cho QL hiệu chỉnh dấu `-` của tuần đã qua | ✅ Không cần nữa | C10 chốt `chốt ngay` → hàm `resolveLateNoShow` không còn dùng. Sau cuối tuần QL sửa qua đường sửa trạng thái thi có sẵn (`plan.md` 12.13) | — |

---

## 9. Số liệu — design plan §10, `HOP_DONG_SO_LIEU.md`

| Yêu cầu | Tình trạng | Bằng chứng / còn thiếu | PR |
|---|---|---|---|
| Một chỉ số = một hàm trả về tập ID; số là `tap.length` | ✅ Đã làm | PR-F (chặng 2, commit `012d9f8`), `shared/domain/metrics.ts` | — |
| Drill-down áp đúng quyền của số tổng | ✅ Đã làm | PR-F | — |
| Phạm vi rỗng trả rỗng | ✅ Đã làm | PR-F sửa `issueScopeOf` + `studentsOf` (lỗi có sẵn, sửa nhân tiện) | — |
| **Bốn chỉ số trả lỗi 501** — `hv-sos-hien-tai`, `hv-duoi-ky-vong-mon`, `dung-han-cap-nhat`, `do-phu-danh-gia` | ✅ Đã làm | PR-N. Cả bốn trả tập ID, số = độ dài tập, mỗi hàm một phép kiểm so với sự thật độc lập; 9 lần cố ý làm hỏng đều bị bắt. Sổ nay có 12 chỉ số (thêm `pa-cho-duyet`). Định nghĩa còn để ngỏ trong hợp đồng đã chọn và ghi ở `plan.md` 22.2 N1 | — |
| Mọi số trên Tổng quan đi qua `<SoLieu>` | 🟡 Một phần | **Tập ID: ✅ PR-N** — `Việc cần lưu ý`, `Theo chi nhánh`, bảng phân tích theo kỹ năng và bảng tuần nay đều đếm bằng độ dài của một tập ID lấy từ cùng hàm với ô số (chúng từng LỆCH thật: 79/28/27/6 so với 81/29/28/31). "Thiếu phương án" còn MỘT định nghĩa (`isNoPlanCase`). **Còn thiếu:** các ô đó chưa được vẽ bằng `<SoLieu>` (chưa bấm ra panel) | PR-P |
| **DATA-01 (P0)** — `weekly.ts` lọc scope ở tập đợt thi, nhưng phép đếm case/HV sau đó chỉ lọc `planned_period_id` | ✅ Đã làm | **Đã đóng từ PR-F** (chặng 2, commit `012d9f8`, phép kiểm F01) — bảng này từng ghi nhầm "chưa làm". PR-N khoá thêm ở tầng danh sách: 2 phép kiểm (số = độ dài tập; danh sách của Quản lý MB không chứa bản ghi CP) | — |
| `<KetQuaDot>` và `<TyLe>` được màn thật dùng | ❌ Chưa làm | Có luật, có phép kiểm, có trang thử — **chưa màn nào dùng**. Các màn cũ còn tự vẽ câu riêng | **PR-P**, **PR-Q** |
| `GET /metrics/:id` không trả `ids` khi không xin `rows=1` | ✅ Đã làm | PR-N N4: `metricResponse`; phép kiểm chạy đủ 12 chỉ số, và cố ý làm hỏng (trả `ids` khi không xin) thì gãy | — |
| Chỉ số `Tái diễn Ý thức` | ⚰️ Hết hiệu lực | Không còn đợt. Thay bằng **tám chỉ số mới** ở `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §8 | **PR-J** |
| Ba chỉ số `hv-co-case-mo`, `case-mo`, `case-thieu-pa` phải sửa định nghĩa thành "chỉ case học thuật" | ❌ Chưa làm | — | **PR-J** |

---

## 10. Việc hoãn sau deploy bản chính — chốt 21/09/2026

Hai khối dưới đây **không** nằm trong 8 PR. Ghi lại để không ai đề xuất lại như việc mới.

| Khối | Nội dung | Vì sao hoãn |
|---|---|---|
| **§6 · §18.3 góc nhìn `Giáo viên`** | Bảng GV của QL (`GV \| lớp/môn \| HV phụ trách \| có kết quả gần nhất \| HV dưới kỳ vọng của môn \| vấn đề phổ biến \| case thiếu PA \| cập nhật đúng hạn \| PA có kết quả`); hồ sơ chuyên môn ba mục `Giảng dạy / Case phụ trách / Phương án thực hiện`; `Hồ sơ chuyên môn của tôi` cho GV; toàn bộ điều kiện so sánh §6.3 | Một tính năng mới hoàn toàn, quy mô bằng 2 PR. Cần D02 áp ở **API, tìm kiếm, drill-down và xuất dữ liệu** — không chỉ ẩn menu. Và cần hai chỉ số `dung-han-cap-nhat` + `do-phu-danh-gia` mà `<PR-N>` mới tạo. Không chặn việc hằng ngày của GV |
| **§11 kho ý tưởng mở rộng** · **`plan.md` §20 kho ý tưởng thiết kế** | Mọi mục có nhãn `Đề xuất, chưa duyệt` | Chưa duyệt. `plan.md` §20.1 đã ghi ba ý tưởng bị loại — đừng đề xuất lại |

**Khi quay lại làm §6, đọc theo thứ tự:** design plan §6 (yêu cầu) → §17.2 D02 (quyền) → §18.3 mục `Giáo viên` (bố cục) → `HOP_DONG_SO_LIEU.md` (hai chỉ số).

---

## 11. Bốn chỉ số 501 đang chặn hai trang lớn nhất

Đây là phát hiện quan trọng nhất của file này, và `plan.md` không nói ra.

```
4 hàm chỉ số trả lỗi 501 (plan.md 12.8)
  │
  ├─ hv-duoi-ky-vong-mon  ──► CHẶN §18.2  ô số 1 của Tổng quan mới
  ├─ hv-sos-hien-tai      ──► CHẶN §18.2 và §18.3
  ├─ dung-han-cap-nhat    ──► CHẶN §6     cột "cập nhật đúng hạn"
  └─ do-phu-danh-gia      ──► CHẶN §6     cột "độ phủ đánh giá" (§6.3 bắt buộc có)
```

**Hệ quả nếu làm sai thứ tự:** session coding cầm §18.2 mà chưa có bốn hàm này sẽ **tự viết
phép đếm thứ hai** cho cùng một khái niệm — đúng cái lỗi "badge ghi 28, bấm vào ra 0" mà PR-F
vừa sinh ra để dập, và lần này còn khó thấy hơn vì hai số sẽ khớp nhau trên dữ liệu demo.

Vì vậy **PR-N đứng đầu**, trước cả Ý thức. **Cập nhật 21/09/2026: bốn hàm đã có (PR-N)** — chốt chặn này hết; người dựng Tổng quan mới ở PR-P phải GỌI chúng, không viết phép đếm thứ hai.

---

## 12. Quy tắc cập nhật file này

- Đổi một dòng ở đây thì ghi một dòng vào `plan.md` mục 14 trong **cùng commit**.
- Cột `Tình trạng` chỉ đổi khi **đã đọc mã nguồn hoặc đã bấm thử**. Không suy từ tài liệu,
  không suy từ việc một PR đã được tick.
- Làm xong một dòng thì đổi nhãn thành ✅ và ghi **bằng chứng** (commit hoặc "bấm thử vai nào").
  Một dòng ✅ không có bằng chứng đắt hơn là để 🟡.
- File này **không** thay `plan.md`. Nó trả lời *"yêu cầu này đã có chưa"*; `plan.md` trả lời
  *"làm gì trước"*.
