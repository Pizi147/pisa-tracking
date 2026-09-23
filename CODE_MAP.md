# Muốn sửa chức năng X thì tìm ở đâu?

Tài liệu này để trả lời đúng một câu hỏi: *"tôi muốn đổi chỗ này, phải mở file nào."*

> **BẮT BUỘC CẬP NHẬT.** Xoá hoặc đổi tên một file thì sửa file này **trong cùng commit**.
> Một đường dẫn chết ở đây đắt hơn là không có dòng nào: người đọc tin nó, mở ra không thấy,
> rồi đi tìm tay — mất đúng cái thời gian mà tài liệu này sinh ra để tiết kiệm.
>
> Kiểm nhanh mọi đường dẫn trong file này còn sống hay không:
>
> ```bash
> grep -oE '`[a-zA-Z0-9_./-]+\.(ts|tsx|sql|md)`' CODE_MAP.md | tr -d '`' | sort -u | while read -r f; do [ -e "$f" ] || echo "CHET: $f"; done
> ```

---

## Tra theo MÀN HÌNH — dành cho người không đọc code

Nếu bạn nghĩ theo "cái tôi thấy trên màn hình" chứ không theo tên module, bắt đầu từ bảng này.

| Trên màn hình | File chính | Dữ liệu từ |
|---|---|---|
| Danh sách lớp, các bộ lọc, badge "n bài cần chấm" | `web/src/modules/students/StudentsPage.tsx` | `server/src/classes/classes.ts` → `listClassSummaries` |
| Test › **Cần chấm** (bọc hàng đợi chấm) | `web/src/modules/test/CanChamTab.tsx` → `StudentsPage.tsx` → `WorkQueue` | `server/src/fasttrack/attempts.ts` → `listAttempts` |
| **Khung 4 khu vực**, thanh dưới điện thoại, chuyển hướng đường dẫn cũ | `web/src/App.tsx` + `shared/domain/dieuHuong.ts` | `server/src/platform/nav.ts` → `navOf` |
| Test › Lịch Test · Kế hoạch Test | `web/src/modules/test/` | `/attempts?periodId=` · `/attempts/no-plan` |
| Trang một lớp | `web/src/modules/classes/ClassOverviewPage.tsx` | `server/src/classes/classes.ts` |
| **Hồ sơ một học viên** (đầu hồ sơ, bốn ô số, hai tab dưới) | `web/src/modules/students/StudentDetailPage.tsx` | `server/src/students/profile.ts` |
| Bảng kỹ năng trong hồ sơ · **ô điểm bốn màu** | `web/src/modules/cases/SkillBoard.tsx` → `ScoreCell` | `server/src/cases/cases.ts` → `skillSupportBoard` |
| **Thẻ case** và từng khối phương án ba phần trong hồ sơ (PR-HV Q8) | `web/src/modules/cases/SkillBoard.tsx` → `TheCase` · `KhoiPhuongAn` | `server/src/cases/cases.ts` → `caseCardOf` |
| **Ghi kết quả PA** (cập nhật tuần 5 mục; Giữ nguyên / Điều chỉnh / Thay / Kết thúc) | `web/src/modules/cases/CapNhatTuan.tsx` → `CapNhatTuanForm` | `server/src/cases/cases.ts` → `updateResult` |
| **Lịch sử điều chỉnh PA** (bản cũ · khi nào · ai · vì sao) | `web/src/modules/cases/CapNhatTuan.tsx` → `LichSuDieuChinh` | `server/src/cases/planRevisions.ts` |
| Tab **Hành trình học tập** — hai cách đọc | `web/src/modules/students/JourneyTimeline.tsx` | `server/src/students/profile.ts` + bảng kỹ năng |
| Màn một lượt Test | `web/src/modules/fasttrack/MockDetailPage.tsx` | `server/src/fasttrack/attempts.ts` → `attemptDetail` |
| **Bảng nhập điểm cả lớp** | `web/src/modules/fasttrack/ScoreSheetPage.tsx` | `server/src/fasttrack/attempts.ts` → `classScoreSheet` |
| Bảng nhập điểm lớp Normal | `web/src/modules/normal/RegularSheetPage.tsx` | `server/src/normal/regular.ts` |
| **Công việc** › Hỗ trợ học viên · Vận hành · Báo cáo đơn vị | `web/src/modules/congViec/CongViecPage.tsx` (bọc `WorkList` · `TasksBoard` · `MeetingBoard`) | `mywork.ts` · `mgmttasks.ts` · `meeting.ts` |
| **Tổng quan** (QL: 4 ô · Cần xử lý · Điểm đáng chú ý · Lịch sắp tới · Theo chi nhánh; GV: Việc cần làm của tôi · Học viên cần hỗ trợ) | `web/src/modules/worklist/OverviewPage.tsx` | `server/src/worklist/tongQuan.ts` · `bangChiNhanh.ts` · `metrics.ts` (metricSet + chương trình) |
| Dòng tín hiệu SOS lớp thường (Tạo Case / Bỏ qua) | `web/src/modules/worklist/DongTinHieu.tsx` → `QuickReport.tsx` | `/signals/pending/:id/dismiss` · `/cases/report` |
| Lọc chương trình Lớp thường / FT cho mọi chỉ số | `shared/domain/tongQuan.ts` | `server/src/worklist/chuongTrinh.ts` |
| Tổng quan › **Phân tích** (`/phan-tich`) — phân tích vấn đề | `web/src/modules/cases/IssueAnalysis.tsx` | `server/src/cases/effectiveness.ts` |
| Hàm chung ngày/tuần G-6 (`ngay`, `tuanLich`, `tuanKhoa`) | `shared/domain/hienThiNgay.ts` | — |
| Form **+ Case** | `web/src/modules/cases/QuickReport.tsx` | `server/src/cases/cases.ts` → `reportIssue` |
| Màn một case đầy đủ | `web/src/modules/cases/CasePanel.tsx` | `server/src/cases/cases.ts` → `caseDetail` |
| Trang đăng nhập và vào nhanh bằng tài khoản demo | `web/src/modules/platform/WelcomePage.tsx` | `server/src/platform/accounts.ts` |

## Tài liệu nào để làm gì

| File | Dùng khi nào |
|---|---|
| **`plan.md`** | **Kế hoạch đang chạy.** Đọc trước khi code. File sống, có quy tắc bắt buộc cập nhật ở mục 0.2 |
| `CODE_MAP.md` | File này — muốn sửa chỗ nào thì mở file nào |
| `DEMO.md` | Mở hồ sơ nào để xem tình huống nào (mười tám tình huống Ý thức + kịch bản học thuật) và những điều đã chốt / còn treo |
| `vong7/BRIEF_OVERHAUL_SAU_PR15.md` | Đề bài nghiệp vụ gốc |
| *(bốn nhóm file bàn giao và tham chiếu cũ)* | **ĐÃ XOÁ 21/09/2026:** BAN\_GIAO (bốn file), PISA\_Design\_Master\_Reference, PRODUCT\_DEMO\_SPEC, thư mục vong4. Đã bị `thiet-ke/` thay hẳn. `plan.md` mục 1.2 đã cảnh báo chúng là "lịch sử, không phải luật" — giữ lại chỉ tạo rủi ro đọc phải luật cũ. Cần tra lại thì dùng `git log` |
| `thiet-ke/PISA-Rulebook-2026-09-19.md` | **Luật sản phẩm** do chủ sản phẩm chốt. **Mục 18 (21/09) ưu tiên hơn mục 17**; mục 17 ưu tiên hơn mọi mô tả cũ mâu thuẫn |
| `thiet-ke/SOS_VA_PHOI_HOP_V3.md` | **Mới nhất (tối 21/09).** SOS tự tạo case + điền sẵn phương án, Phối hợp SOS, xoá vi phạm, bố cục `Ý thức & Phối hợp`. Thắng `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` ở chỗ khác nhau |
| `TRIEN_KHAI.md` | Đưa bản chính lên Netlify + Turso (miễn phí), sao lưu, quay lại bản cũ |
| `PROMPT_SESSION_CODE.md` | Prompt copy-dán cho session coding — **mục 0 là bảng model + effort cho từng PR** |
| `PROMPT_BAN_GIAO_PLANNING.md` | Prompt bàn giao cho một session planning mới + tình trạng hiện tại |
| `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md` | Kế hoạch chi tiết bản chính, chia PR-Z2a/b/c |
| `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` | **Nguồn mới nhất** do chủ sản phẩm gửi 21/09/2026: bỏ hẳn mô hình Case Ý thức |
| `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | **Đặc tả phần Ý thức mới** — Vi phạm và Biện pháp xử lý. Đọc trước khi chạm bất kỳ thứ gì có chữ `behaviour` |
| `thiet-ke/BAN_DO_OVERHAUL.md` | **Yêu cầu nào của design plan đã có, cái nào chưa, PR nào làm.** Đọc trước khi tưởng "chỉ còn vài việc dọn" |
| `thiet-ke/PISA-Design-Plan-after-PR28.md` | **Đặc tả thiết kế** sau PR28; mục 17–22 là bản mới nhất. Đọc kèm `thiet-ke/BAN_DO_OVERHAUL.md` để biết mục nào hết hiệu lực |
| `thiet-ke/HE_GIAO_DIEN.md` | Trước khi dựng bất kỳ màn nào — token, component dùng chung, bốn trạng thái dữ liệu, mobile, bàn phím |
| `thiet-ke/HOP_DONG_SO_LIEU.md` | Khi code một con số trên dashboard/báo cáo — chỉ số đó nghĩa là gì, bấm vào ra tập nào |
| `thiet-ke/TU_DIEN_VA_CHU.md` | Khi viết hoặc sửa chữ tiếng Việt trên giao diện |
| `thiet-ke/LUAT_CHO_CHOT.md` | Khi chạm một luật mà chủ sản phẩm chưa trả lời (C01–C09) |

Hệ thống chia theo **nghiệp vụ**, không chia theo kỹ thuật. Cùng một module thì cả phần dữ
liệu, phần giao diện và phần kiểm thử nằm cạnh nhau, để sửa một chức năng không phải đi tìm
ba nơi.

---

## Chín module

> **Module thứ chín — `Ý thức` — CÓ MÁY CHỦ TỪ PR-J (21/09/2026), giao diện là PR-K.** Đặc tả ở
> `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. Nó thay hẳn phần Ý thức từng nằm nhờ trong module
> **Case** (mô hình "Case Ý thức" đã gỡ). Lý do tách: `server/src/cases/cases.ts` đã **3033 dòng**;
> nhồi thêm hai vòng đời nữa vào đó là cách chắc chắn nhất để không ai sửa được nó nữa.

| Module | Trả lời câu hỏi | Máy chủ | Giao diện |
|---|---|---|---|
| **Học viên** | Em này là ai, đang học gì, đã đi qua những đâu | `server/src/students/` | `web/src/modules/students/` |
| **Lớp học** | Lớp nào, ai dạy, ai đang học, chuyển lớp thế nào | `server/src/classes/` | `web/src/modules/classes/` |
| **Fast Track** | Tuần Mock Test, điểm band, mức SOS, dự kiến thi | `server/src/fasttrack/` | `web/src/modules/fasttrack/` |
| **Normal** | FOU/BE/ELE, bốn môn L/R/W/S, điểm đạt/tổng điểm, chuyển tiếp lớp | `server/src/normal/` | `web/src/modules/normal/` |
| **Case** | Vấn đề **học thuật** của em, phương án, phê duyệt, kết quả | `server/src/cases/` | `web/src/modules/cases/` |
| **Ý thức** | Em vi phạm gì, đã xử lý bằng phương án xử lý nào, bằng chứng đâu; **Phối hợp SOS** của GVCN sau Mock có SOS (`server/src/yThuc/phoiHop.ts`, PR-T) | `server/src/yThuc/` | `web/src/modules/yThuc/` — tab Ý thức & Phối hợp của hồ sơ học viên (`StudentYThucSection.tsx`) và hồ sơ lớp (`ClassYThucCard.tsx`); thẻ lượt Phối hợp `TheSos` (trong `PhoiHopSosSection.tsx`); hộp chỉ đọc một phương án `XemPhuongAnPanel.tsx` |
| **Tổng quan và công việc** | Ai phải làm gì, cả chi nhánh đang thế nào | `server/src/worklist/` | `web/src/modules/worklist/` |
| **Nền tảng** | Tài khoản, quyền, tuần, danh mục, nhật ký thay đổi | `server/src/platform/` | `web/src/modules/platform/` |
| **Dùng chung** | Badge, nút, panel, bảng, chọn tuần; hàng tab gạch chân `HangTab.tsx`, ô số nhỏ `OSoNho.tsx`, dòng thời gian lưới `DongThoiGian.tsx` (PR-HV) | — | `web/src/ui/` |

Từ vựng nghiệp vụ (nhãn, hằng số, luật thuần) nằm ở `shared/domain/`, chia theo **đúng chín
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

Muốn **đổi một câu chuyện** thì sửa `server/src/seed/students.ts` rồi chạy `npm run seed`. Muốn **thêm một
loại dữ liệu mới** vào kịch bản thì thêm trường ở `server/src/seed/journeys.ts` và xử lý ở `server/src/seed/build.ts`.

---

## Tra nhanh theo việc muốn sửa

### Học viên

| Muốn sửa | Mở file |
|---|---|
| Cột trong bảng học viên của một lớp | `web/src/modules/students/ClassRoster.tsx` |
| Dữ liệu đổ vào bảng đó | `server/src/classes/classes.ts` → `classRoster` |
| Trang hồ sơ một em | `web/src/modules/students/StudentDetailPage.tsx` |
| Panel "Quản lý học viên" (kế hoạch · đầu vào · mục tiêu · kết luận · chuyển lớp) | `web/src/modules/students/StudentManagePanel.tsx` |
| Tab Hành trình học tập — **hai cách đọc**: "Điểm và can thiệp" · "Dòng sự kiện" | `web/src/modules/students/JourneyTimeline.tsx` · `server/src/students/profile.ts` → `progressOf` |
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
| Tab **Ý thức** của lớp — ba khu vực (Vi phạm chưa xử lý · Biện pháp đang chuẩn bị · Lịch sử) | dữ liệu `server/src/yThuc/board.ts` → `classViolationBoard` (`GET /classes/:id/y-thuc`); giao diện PR-K |
| **Bảng phân tích vấn đề** của lớp (tab kỹ năng, năm con số mỗi hàng) | `web/src/modules/classes/ClassIssueBoard.tsx` · `server/src/cases/effectiveness.ts` → `classIssueBoard` |

### Fast Track

| Muốn sửa | Mở file |
|---|---|
| Mốc lịch MT mặc định (tuần học 6/12/16/20/24) | `shared/domain/fasttrack.ts` → `MOCK_FT_STUDY_WEEK` |
| Kỳ vọng của từng lượt MT | `shared/domain/fasttrack.ts` → `expectationDelta` |
| **Ô điểm: số ± là khoảng cách tới kỳ vọng** (`gap`), xu hướng so lượt trước là chữ trung tính (`trend`) | `server/src/cases/cases.ts` → `skillSupportBoard` · `web/src/modules/cases/SkillBoard.tsx` → `ScoreCell`, `gapText` |
| Bốn màu của ô điểm (dưới đỏ · bằng xanh dương · vượt xanh lá · thiếu xám) | `web/src/modules/cases/SkillBoard.tsx` → `scoreTone` |
| Bảng quy đổi số câu đúng → band | `server/src/fasttrack/scoring.ts` |
| Cách tính mức SOS | `server/src/fasttrack/scoring.ts` → `resultOf` |
| Màn một lượt MT | `web/src/modules/fasttrack/MockDetailPage.tsx` |
| Bảng nhập điểm cả lớp | `web/src/modules/fasttrack/ScoreSheetPage.tsx` · `server/src/fasttrack/attempts.ts` → `classScoreSheet` |
| **Hàng nào hiện ra ở bảng chấm của một tuần** — lọc theo lịch TỪNG KỸ NĂNG, không theo tuần cả đợt | `server/src/fasttrack/attempts.ts` → `classScoreSheet` |
| **Luật đếm "bài cần chấm"** — badge và danh sách đều gọi vào đây | `shared/domain/fasttrack.ts` → `pendingSkillsOf` |
| Hai phạm vi công việc và nhãn của chúng | `shared/domain/people.ts` → `WORK_SCOPES`, `WORK_SCOPE_LABEL`, `WORK_SCOPE_HINT` |
| Phạm vi mở ra mặc định theo vai | `server/src/permissions.ts` → `defaultWorkScope` |
| Ai phụ trách từng bài còn thiếu (cột GV ở hàng đợi) | `server/src/fasttrack/attempts.ts` → `ownersOf` |
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

> **Từ 21/09/2026 (PR-J) module này CHỈ có case học thuật.** Mô hình Case Ý thức đã gỡ khỏi mã: không còn
> cột `track`, `episode_no`, `merge_until`, bảng `case_reports`, `CONTACT_KINDS`, `BEHAVIOUR_*`, bảng ý thức của
> lớp. Ý thức là module riêng — xem mục "Ý thức" bên dưới. Bảng `sos_cases` là bảng **case học thuật**
> (KHÔNG đổi tên, KHÔNG gộp vi phạm vào đây). Hằng số `C03_*`/`C04_*` ở `shared/domain/policy.ts` còn đó,
> ghi "hết hiệu lực 21/09/2026".

| Muốn sửa | Mở file |
|---|---|
| **Tín hiệu từ điểm** (điểm dưới kỳ vọng sinh gì) | `server/src/cases/signals.ts` |
| Hạn xác minh tín hiệu (3 ngày, tính cả ngày đầu) | `shared/domain/cases.ts` → `signalVerifyDue` |
| Thu hồi tín hiệu và case khi sửa điểm (mục 9.4) | `server/src/cases/signals.ts` → `withdrawSignalsNoLongerValid` · `caseHasIndependentBasis` |
| Đối soát sau sửa điểm — MỘT hàm cho FT và lớp thường (RB-8) | `server/src/cases/signals.ts` → `reconcileCorrectedSignals` |
| **Tạo Case · Bỏ qua** một tín hiệu lớp thường, ai xử lý được tín hiệu (S1) | `server/src/cases/signals.ts` → `dismissSignal`, `canResolveSignal` · Tạo Case: `server/src/cases/cases.ts` → `reportIssue` (`fromSignalId`) |
| **Hệ thống tự đóng Case** — em kết thúc khoá (S16) / đổi chương trình (S17) | `server/src/cases/systemClose.ts` → `closeCasesBySystem`, `closeCasesOnProgrammeSwitch` |
| Thẻ "Tín hiệu chờ xác minh" ở hồ sơ học viên | `web/src/modules/students/StudentDetailPage.tsx` → `PendingSignals` |
| Năm hạng mục case | `shared/domain/cases.ts` → `CASE_CATEGORIES` |
| Tên case tự sinh | `shared/domain/cases.ts` → `caseTitle` |
| Bảng phân loại nguyên nhân | `shared/domain/cases.ts` → `ISSUE_TAXONOMY` |
| Danh sách phương án, nhóm tự làm / cần duyệt | `shared/domain/cases.ts` → `INTERVENTION_KINDS` |
| Luật sinh case sau mỗi đợt MT | `server/src/cases/sos.ts` |
| Vòng đời case, phương án, phê duyệt, kết quả | `server/src/cases/cases.ts` |
| Màn một case | `web/src/modules/cases/CasePanel.tsx` |
| Bảng theo dõi năm hạng mục ở hồ sơ | `web/src/modules/cases/SkillBoard.tsx` |
| Case của em ở hồ sơ — **nằm ngay dưới hàng kỹ năng**, không còn khối danh sách riêng | `web/src/modules/cases/SkillBoard.tsx` → `TheCase` |
| Luật hạn chu kỳ hai tuần / một tuần | `shared/domain/cases.ts` → `cycleDeadline` |
| Năm kết quả và sáu bước tiếp theo (PR-S2 thêm `adjust` = Điều chỉnh, lịch sử ở bảng `case_intervention_revisions`) | `shared/domain/cases.ts` → `FOLLOWUP_OUTCOMES`, `NEXT_STEPS`, `nextStepsFor` |
| Luật hiển thị thuần của hồ sơ học viên: tab từ `?tab=`, ô Test gần nhất, quá hạn, tiến độ case `k/n PA có kết quả`, việc tiếp của một PA, đếm vi phạm theo nhóm (PR-HV) | `shared/domain/hoSoHocVien.ts` → `parseHoSoTab`, `ketQuaTestGanNhat`, `quaHan`, `tienDoCase`, `viecTiepPhuongAn`, `demTheoNhomViPham` |
| Một chu kỳ khép lại (gộp ba nút cũ) | `server/src/cases/cases.ts` → `updateResult` |
| Điều kiện được hoàn thành case | `server/src/cases/cases.ts` → `closeBlockers` |
| Điểm giáo viên tự chấm | `server/src/cases/cases.ts` → `normalizeMetrics`, `parseMetrics` |
| **Cách đếm hiệu quả phương án** — thành công/thất bại/chưa xác định, n/N, mẫu nhỏ | `server/src/cases/effectiveness.ts` (nơi sở hữu duy nhất; bảng của lớp và trang Thực trạng đều gọi vào đây) |
| **Phân tích vấn đề ở Thực trạng** — tab Normal/FT, hàng kỹ năng, bấm số ra case | `web/src/modules/cases/IssueAnalysis.tsx` · `server/src/cases/effectiveness.ts` → `issueSkillRows`, `issueBoard`, `issueBoardCases` |
| **Làn thời gian phương án** ở tab Hành trình (thanh theo tuần, màu theo kết quả) | `web/src/modules/students/JourneyTimeline.tsx` → `PlanLane` · dữ liệu ở `server/src/cases/cases.ts` → `caseCardOf` |
| Bảng "Vấn đề - Case" và bộ lọc | `web/src/modules/cases/CaseBoardPage.tsx` |

### Ý thức

| Muốn sửa | Mở file |
|---|---|
| Từ vựng: năm nhóm vi phạm, chín loại biện pháp, ô bắt buộc, chuỗi Thư cảnh cáo, `CANH_BAO_NGAY` | `shared/domain/yThuc.ts` |
| Ghi · sửa · đánh dấu không chính xác một vi phạm (V01–V14) | `server/src/yThuc/violations.ts` |
| Tạo · sửa · xác nhận · xóa biện pháp, chuỗi Thư cảnh cáo ở máy chủ (B01–B16) | `server/src/yThuc/measures.ts` |
| **Cảnh báo 5 ngày** — MỘT hàm cho tab lớp, dòng học viên và Việc cần làm (W01–W06) | `server/src/yThuc/canhBao.ts` → `warningsFor` |
| Tám chỉ số Ý thức, mỗi chỉ số một hàm trả tập ID | `server/src/yThuc/thongKe.ts` |
| Ba khu vực của tab Ý thức trong lớp | `server/src/yThuc/board.ts` |
| Ai được ghi / xử lý / xem thống kê | `server/src/yThuc/access.ts` · `server/src/permissions.ts` (`violation.record`, `discipline.manage`, `discipline.stats`) |
| Bốn bảng và DDL | `server/src/schema.sql` (chép nguyên văn từ đặc tả §4) |
| Nâng cấp database còn mô hình Case Ý thức | `server/src/migrate.ts` → `migrateLegacyDisciplineCases` |
| Bằng chứng (tệp / liên kết) của biện pháp và vi phạm | `server/src/platform/attachments.ts` |
| Dữ liệu demo Ý thức (mười tám tình huống) | `server/src/seed/yThucSeed.ts` |
| Phép kiểm | `server/src/tests/yThuc.tests.ts` (kể cả phép gọi thẳng HTTP qua `server/src/app.ts`) |

### Tổng quan và công việc

| Muốn sửa | Mở file |
|---|---|
| Danh sách việc của người đang xem | `server/src/worklist/mywork.ts` |
| Màn Tổng quan (QL: 4 ô · Cần xử lý · Điểm đáng chú ý · Lịch sắp tới · Theo chi nhánh; GV: Việc cần làm của tôi · Học viên cần hỗ trợ) | `web/src/modules/worklist/OverviewPage.tsx` · `server/src/worklist/tongQuan.ts` · `metrics.ts` (metricSet + chương trình) |
| Dòng tín hiệu SOS lớp thường (Tạo Case / Bỏ qua) | `web/src/modules/worklist/DongTinHieu.tsx` → `QuickReport.tsx` · `/signals/pending/:id/dismiss` · `/cases/report` |
| Lọc chương trình Lớp thường / FT cho mọi chỉ số | `shared/domain/tongQuan.ts` · `server/src/worklist/chuongTrinh.ts` |
| Khu "Việc cần làm" — bộ lọc, phân trang, năm ô của một dòng | `web/src/modules/worklist/WorkList.tsx` |
| Bảng "Theo chi nhánh" / "Theo lớp" (Việc cần lưu ý) | `web/src/modules/worklist/BranchPulse.tsx` · `server/src/worklist/bangChiNhanh.ts` (bảng **Theo giáo viên** vẫn ở `branchpulse.ts`) |
| **Ô điểm còn nợ** của bảng chi nhánh — đi qua đúng hàm của bảng chấm (S12, §6) | `server/src/worklist/scoreDebt.ts` → `scoreDebtCells` |
| Bảng tổng hợp chi nhánh/lớp | `web/src/modules/worklist/SummaryTable.tsx` · `server/src/worklist/summary.ts` |
| Bảng tổng hợp theo tuần | `web/src/modules/worklist/WeeklyBoard.tsx` · `server/src/worklist/weekly.ts` |
| Quản lý giao việc cho giáo viên | `web/src/modules/worklist/ManagerTasks.tsx` · `server/src/worklist/meeting.ts` |
| Khối "Lịch sắp tới" (tuần này · tuần tới · tuần nữa; cột Lớp thường / Fast Track) | `web/src/modules/worklist/Highlights.tsx` · `server/src/worklist/highlights.ts` |
| Bảng "Phương án và kết quả" của tab Thực trạng | `web/src/modules/cases/IssueAnalysis.tsx` · `server/src/cases/effectiveness.ts` |
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

### Bản chính (Netlify + Turso, PR-Z2)

Hướng dẫn cho chủ sản phẩm: `TRIEN_KHAI.md`. Kế hoạch: `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`.

| Muốn sửa | Mở file |
|---|---|
| Đọc biến môi trường (Turso, `BAN_CHINH`), luật "nguyên tên máy chủ" cho seed/migrate, nhận tên database bản chính | `server/src/moiTruong.ts` |
| Mở kết nối (file cục bộ hay Turso), vá khác biệt của libsql, giao dịch lồng (savepoint), **chốt chặn xoá sạch database ở Turso** | `server/src/db.ts` → `db`, `tx`, `tuChoiXoaSachNeuTuXa` |
| Nơi cất nội dung tệp: ổ đĩa (máy dev) hay Netlify Blobs (bản chính), tên kho theo database | `server/src/platform/khoTep.ts` → `khoTepHienTai`, `tenKhoTep` |
| Tệp bằng chứng (thêm/mở/xoá, xoá SAU giao dịch) | `server/src/platform/attachments.ts` |
| Máy chủ trên Netlify (bọc Express thành một Function) | `netlify/functions/api.ts` · `netlify.toml` |
| Tắt mọi thứ của bản demo ở bản chính (giao diện) | `web/src/lib/banChinh.ts` |
| Dữ liệu nền dùng chung cho bộ demo và bản chính (quyền, vai trò, lộ trình, chương trình) | `server/src/seed/duLieuNen.ts` → `napDuLieuNen` |
| `npm run init-ban-chinh` — khởi tạo database rỗng; `npm run them-chi-nhanh` | `server/src/ops/initBanChinh.ts` (luật) · `server/src/ops/runInit.ts` · `server/src/ops/themChiNhanh.ts` (điểm chạy) |
| `npm run sao-luu` — chép database + tải kho tệp, giữ 14 bản | `server/src/ops/saoLuu.ts` (luật) · `server/src/ops/runSaoLuu.ts` (điểm chạy) |
| `npm run khoi-phuc` — chép một bản sao lưu vào database rỗng | `server/src/ops/khoiPhuc.ts` (luật) · `server/src/ops/runKhoiPhuc.ts` (điểm chạy) |
| `npm run thu-turso` — thử đường mạng tới database THỬ | `server/src/ops/thuTurso.ts` |
| `npm run migrate` vào Turso (xác nhận, bỏ tài khoản mặc định) | `server/src/migrate/run.ts` · `server/src/migrate.ts` → `migrateAccounts` |
| Phiên đăng nhập (cookie), **hết hạn sau 30 ngày không dùng** (`PHIEN_HET_HAN_SAU_NGAY`) | `server/src/auth.ts` |
| Giới hạn số lần thử đăng nhập/đăng ký (AN-1), bảng `auth_attempts` | `server/src/platform/gioiHanThu.ts` · khối `/auth` trong `server/src/routes/index.ts` |
| Câu lỗi 409/500 trả người dùng, mã lỗi trong log (AN-3) | `server/src/app.ts` → `traLoiLoi` |
| `/api/health` công khai, nhớ kết quả (AN-4) | `server/src/platform/suKhoe.ts` |
| Hạn 10 giây của hàm Netlify: không mở giao dịch khi sắp hết giờ, log `[cham]` (AN-5) | `server/src/platform/hanGio.ts` · `server/src/db.ts` → `tx`, `donGiaoDichTreo` · `server/src/app.ts` → `demGio` |
| Hàm định kỳ chốt "-" 00:05 + 06:05 sáng thứ Hai (RB-1) | `netlify/functions/chot-vang.ts` → `server/src/ops/chotVangDinhKy.ts` · lịch ở `netlify.toml` |
| Bảng không chép dòng khi sao lưu/khôi phục (`demo_sessions` — mã đăng nhập) | `server/src/ops/saoLuu.ts` → `BANG_KHONG_CHEP_DONG` |
| Phép kiểm của bản chính | `server/src/tests/banChinh.tests.ts` |

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

**`shared/domain/fasttrack.ts` → `pendingSkillsOf`** — từ PR1, "bài cần chấm" được đếm ở
ĐÚNG MỘT CHỖ, và badge ở danh sách lớp lẫn hàng đợi việc đều gọi vào đó. Trước PR1 mỗi bên
đếm một kiểu: badge đếm theo "kỹ năng tôi ĐƯỢC PHÉP SỬA", danh sách lọc theo "kỹ năng tôi
ĐƯỢC PHÂN CÔNG" — nên Quản trị hệ thống thấy badge 28 rồi bấm vào ra danh sách rỗng, còn Quản
lý thấy 0 ở mọi lớp. Hai phép đếm riêng thì dù sửa cho khớp hôm nay, lần sửa sau chúng lệch
lại. Thêm một màn cần con số này thì gọi hàm đó, đừng viết phép đếm thứ hai.

Kèm theo: `Cell.required` (`server/src/fasttrack/attempts.ts`) cố ý **độc lập với quyền người
xem**. `canEdit` và `mine` đều đã nhân `required` vào rồi, nên đếm phạm vi quản lý bằng
`canEdit` sẽ luôn ra 0 với Quản lý — đó đúng là lỗi cũ.

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

**`shared/domain/cases.ts`** — từ vựng của case: năm hạng mục, năm kết quả, sáu bước tiếp theo,
và `cycleDeadline`. Từ vòng 5, HẠN của một chu kỳ tính ở ĐÚNG MỘT CHỖ này (Chủ nhật của tuần thứ
hai; Ý thức không còn hạn nào) — luật cũ suy hạn từ mức gấp `7 · 5 · 3 ngày`
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
5. Thêm một dòng vào bảng "Chín module" ở đầu file này.

## Nguyên tắc giữ ranh giới

- **Fast Track và Normal có form, kiểm tra dữ liệu và workflow RIÊNG.** Dùng chung thành phần
  giao diện cơ bản thì được; tái dùng form nghiệp vụ của bên này cho bên kia bằng cách ẩn vài
  ô thì không — đó là cách chắc chắn nhất để một sửa đổi bên này làm hỏng bên kia.
  Cụ thể: Fast Track có W1/W2 và chấm theo band; Normal có một môn W và chấm theo điểm
  đạt/tổng điểm. Hai môn ĐÓ KHÔNG GỘP VÀO NHAU ở bất kỳ bảng nào. Mọi đường dẫn tới điểm đi
  qua `attemptHref` để mở đúng màn theo loại bài.
- **Case học thuật và Ý thức** là HAI module, hai vòng đời (từ 21/09/2026): case có phương án, duyệt, chu kỳ và
  kết quả; Ý thức có vi phạm độc lập, biện pháp và cảnh báo — không hạn, không đợt, không duyệt. Đừng đưa
  vi phạm vào `sos_cases` và đừng đưa hạn vào vi phạm.
- **Hành trình học viên** tổng hợp từ dữ liệu nguồn, không giữ một bộ điểm hay trạng thái
  riêng — hai bộ số song song là hai bộ số sớm muộn lệch nhau.
