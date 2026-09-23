# Kiểm kê việc còn lại trước khi deploy bản chính — PISA Progress

**Ngày:** 22/09/2026 · **Mã nguồn đối chiếu:** `main` @ `5fc8a88` (sau PR-HV #52, PR-K2 #44, PR-K3 #46, PR-Z2a/b) · **Chỉ đọc, không sửa repo.**
**Quyết định chủ sản phẩm 22/09:** làm HẾT việc chưa làm (lộ trình sau deploy PR-O → Q → P → R → S và mọi việc tồn), rồi mới deploy (PR-Z2c).

**Cách làm:** đối chiếu (A) tài liệu gốc của chủ sản phẩm (hai file `NGUON-*`, design plan, 4 prototype, rule book, `LUAT_CHO_CHOT`, `SOS_VA_PHOI_HOP_V3`, `Y_THUC_VI_PHAM_VA_BIEN_PHAP`, `TU_DIEN_VA_CHU`, `HE_GIAO_DIEN`, `HOP_DONG_SO_LIEU`, `vong7/`) và (B) tài liệu kế hoạch (`plan.md` §3, §12, §20, §22–24, `BAN_DO_OVERHAUL.md`, spec/plan PR-HV, `PROMPT_SESSION_CODE.md`) với (C) **mã thật**. Trạng thái lấy từ việc đọc mã, không lấy từ ô tick.

Ký hiệu: ✅ đã có · 🟡 một phần · ❌ chưa có · ⚰️ hết hiệu lực/đã bị thay · ❓ chưa kiểm được bằng đọc mã (phải bấm thử). Cỡ: S (≤ nửa ngày) · M (1–2 ngày) · L (≥ 3 ngày).

**Con số tóm tắt:** 58 mục của PR-O/P/Q/R/S: 4 ✅ · ~17 🟡 · 2 ⚰️ hoặc cần viết lại · còn lại ❌. Thêm **khoảng 45 việc không nằm trong bước nào của PR-O…S** (từ nguồn A và backlog §12). Trong đó **khoảng 25 việc chưa từng được ghi thành việc ở đâu** (bảng 2).

---

## 1. Bảng kiểm kê

### 1.1. PR-O — Điều hướng bốn khu vực (plan.md §22.4)

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| O1 | Menu chính có 4 mục: Tổng quan / Học viên & Lớp / Test / Công việc | §22.4 · design §17.1 · D01 | ❌ | `web/src/App.tsx:44-52` vẫn 3 mục | PR-O | S | – |
| O2 | Khu vực Test mới (hàng đợi chấm, lịch, Kế hoạch Test, hồ sơ đợt), gom các route Test | §22.4 | ❌ | Route rải ở `App.tsx:130-135`; hàng đợi chấm nằm ở `/hoc-vien?view=my_scores` (`StudentsPage.tsx:206`) | PR-O | M | O1 |
| O2b | Test mở mặc định khác nhau theo vai (QL: lịch/chấm; GV: bài của mình) | design §17.1, §17.6.3 | ❌ | không tìm thấy; O2 không chép ý này | PR-O | S | O2 |
| O3 | Tổng quan có tab `Tổng quan | Phân tích`, URL riêng | §22.4 · design §18.3 | 🟡 | Đã có tab `Toàn cảnh | Thực trạng`, URL `?tab=tinh-hinh` (`OverviewPage.tsx:52-107`). Còn route riêng `/hoc-thuat` (`App.tsx:128`) | PR-O | S | – |
| O4 | Đổi nhãn `Học viên` → `Học viên & Lớp` | §22.4 · §18.5 | ❌ | `App.tsx:46` | PR-O | S | – |
| O5 | Redirect mọi link cũ | §22.4 | 🟡 | Có tiền lệ `App.tsx:54-58, 159-161`; chưa có redirect cho route mới | PR-O | S | O2, O3 |
| O6 | Hiện theo quyền (capability), phần không có quyền bỏ hẳn | §22.4 · §17.1 | 🟡 | `session.nav` tính ở máy chủ (`server/src/routes/index.ts:143-149`); chưa có cờ cho Test, Công việc | PR-O | S | O1 |
| O7 | Bảng chi nhánh bấm vào ra link hỏng `/tong-quan?cn=` (route không tồn tại, rơi về `/`, mất bộ lọc) | phát hiện khi đối chiếu design §18.2 | ❌ lỗi | `web/src/modules/worklist/BranchPulse.tsx:231` | PR-O (sửa cùng redirect) | S | – |

### 1.2. PR-Q — Học viên & Lớp, hồ sơ lớp, hành trình (plan.md §22.7)

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| Q1 | Một ô tìm (tên/mã HV/mã lớp); chi nhánh dùng dropdown; hàng lớp 2–3 thông tin | §22.7 · §18.5 | 🟡 | Có ô tìm (`StudentsPage.tsx:124-127`); còn dải tab chi nhánh (`:142-150`); hàng lớp nhiều badge (`:340-385`) | Q-a | M | O |
| Q2 | Badge `case SOS` → nhãn đúng tập đếm | §22.7 | ❌ | `StudentsPage.tsx:383` | Q-a | S | – |
| Q3 | Lớp thu gọn khi dài; tìm thì tự mở lớp chứa kết quả | §22.7 | ❌ | `open` chỉ đọc từ URL (`StudentsPage.tsx:80-83`) | Q-a | S | Q1 |
| Q4 | Hồ sơ lớp 4 tab `Học viên | Ý thức & Phối hợp | Phân tích lớp | Giáo viên`; Lộ trình / Chuyển tiếp là nút ở header; bỏ màn trung gian `Thông tin lớp` nhưng vẫn sửa được tên/mã/chương trình | §22.7 · §3 21/09 · v3 | ❌ | Vẫn là các Card xếp dọc, menu "Quản lý lớp"/"Thông tin lớp" (`ClassOverviewPage.tsx:205-340`) | Q-a | M | O |
| Q5 | Tab Giáo viên dùng chung form Phân công | §22.7 | 🟡 | Đã dùng chung `TeacherAssignDialog` (`ClassOverviewPage.tsx:12, 265`); chỉ cần đưa vào tab | Q-a | S | Q4 |
| Q6 | Ô `Chọn giáo viên` trong dropdown `Người phụ trách` (lọc ở máy chủ) | §22.7 · 12.11 | ❌ | `WorkList.tsx:111-115` chỉ có mine/managed; `PeoplePicker` chưa màn nào dùng | R-a (cùng file WorkList) | M | – |
| Q7/Q8 | Bốn ô hồ sơ HV · khối PA 3 phần | §22.7 | ✅ | PR-HV: `StudentDetailPage.tsx:181-198`, `SkillBoard.tsx` | – | – | – |
| Q9 | Hành trình: chọn Toàn bộ / kỹ năng / (Ý thức?), mặc định 6–8 tuần, thanh chặng, `Mốc học tập` | §22.7 · §8.2 · §18.7 | ✅ | **PR-Qb (23/09):** `HanhTrinh.tsx` — chip kỹ năng + khoảng "3 tháng gần nhất/Cả giai đoạn" (không phải 6–8 tuần cố định, spec §3.8 thắng); không có Ý thức (câu hỏi 4.12 chốt (b)); mục "Mốc học tập" thay "Các mốc đã qua" | Q-b | – | câu hỏi 4.12 |
| Q10 | Đầu hồ sơ lớp: tóm tắt GVBM, bài chờ chấm, case mở/thiếu PA; "2 vấn đề nổi bật" trên bảng HV; chế độ Điểm / Cần hỗ trợ | design §8.3 | ❌ | không tìm thấy — **Q4 chỉ dựng khung tab** | Q-a | M | Q4 |
| Q11 | Nút `Nhập điểm` trên hàng lớp của danh sách | design §18.5 | ❌ | không tìm thấy (R8a chỉ một phần) | Q-a | S | – |
| Q12 | Bỏ cặp nút phạm vi `Tôi / Tất cả`, thay bằng dropdown `Người phụ trách` | §3 20/09 · design §22.7 | 🟡 | `StudentsPage.tsx:171-181` còn 2 nút (chỉ đổi chữ) | Q-a | S | – |
| Q13 | Thêm HV hàng loạt: modal rộng ~1440px, bỏ chữ "mặc định cho cả lô" | design §22.6 | 🟡 | `IntakePanel.tsx:178` `max-w-5xl`; `:211` còn chữ cũ | Q-a | S | – |

### 1.3. PR-P — Tổng quan và Phân tích (plan.md §22.6)

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| P1 | Bốn ô số: HV dưới kỳ vọng · HV có case mở · Chờ xác minh quá hạn · PA cần cập nhật | §22.6 · §18.2 | 🟡 | `MetricTiles.tsx:15` dùng hv-co-case-mo · case-thieu-pa · tin-hieu-cho-xac-minh · pa-can-cap-nhat; `hv-duoi-ky-vong-mon` có (`shared/domain/metrics.ts:47`) nhưng chưa dùng | P-a | S | **câu hỏi 4.1** |
| P2 | Khối `Cần xử lý` 5–8 dòng, thứ tự ưu tiên §4.1 | §22.6 | ❌ | không tìm thấy; `mywork.ts` xếp theo 9 nhóm | P-a | M | P1 |
| P3 | Khối `Điểm đáng chú ý` ≤ 3 nhận định có số + link | §22.6 | ❌ | không tìm thấy | P-a | M | – |
| P4 | Bỏ WorkList đầy đủ + Highlights lớn khỏi màn chính; `Lịch sắp tới` gọn | §22.6 | ❌ | `OverviewPage.tsx:128, 155` | P-a | S | R1 (đích "Xem tất cả") |
| P5 | Bảng Theo chi nhánh: cột rõ, hàng mở tới lớp; 1 CN thì ưu tiên bảng lớp | §22.6 | 🟡 | Đã tách 2 cột (`BranchPulse.tsx:47-56`); ô chưa mở panel `<SoLieu>` | P-a | S | O7 |
| P6 | Màn đầu của GV: Việc cần làm + Học viên cần hỗ trợ | §22.6 | 🟡 | GV không thấy BranchPulse (`OverviewPage.tsx:134`); chưa có khối HV cần hỗ trợ | P-a | S | – |
| P6b | Thanh ngữ cảnh: chọn Normal/FT/Cả hai + dòng "Dữ liệu đến {ngày}" | design §4.1(1), §18.2(1) | ❌ | chỉ có chọn chi nhánh | P-a | M | – |
| P6c | Mọi số ở BranchPulse, Highlights, badge lớp đi qua `<SoLieu>` (bấm ra đúng tập) | HĐSL luật 1 · HE_GIAO_DIEN | 🟡 | `<SoLieu>` mới ở OverviewPage, MetricTiles, YThucAnalysisView | P-a | M | – |
| P7 | Phân tích 4 góc nhìn `Vấn đề học viên | Kết quả hỗ trợ | Theo tuần | Ý thức & Phối hợp` | §22.6 | 🟡 | Đang là mode + chip (`CaseBoardPage.tsx:211-219`) | P-b | M | O3 |
| P8 | Ma trận vấn đề × CN/lớp; panel `{n} học viên — {vấn đề}` | §22.6 · §5.1 | ❌ | Drill ra danh sách case (`IssueAnalysis.tsx:341-393`) | P-b | M | – |
| P8b | Dạng danh sách trên mobile + cột thao tác (chưa có PA / đang hỗ trợ / thiếu cập nhật / cần đánh giá) | design §5.1 | ❌ | không tìm thấy; P8 không chép | P-b | M | P8 |
| P9 | Kết quả hỗ trợ: tiêu đề ngữ cảnh, thanh tỷ lệ trong ô, nhóm "chưa xác định nguồn" (F03), link `Cần bổ sung đánh giá` | §22.6 | ❌ | `planOutcomesUnattributed` (`effectiveness.ts:280`) chưa ai gọi | P-b | M | P7 |
| P9b | Máy chủ: so loại PA trong **một vấn đề cụ thể**; HV duy nhất vs số PA; thời gian trung vị; nhãn "hỗ trợ đồng thời" (F04) | design §5.3 | 🟡 | `planEffectiveness` chỉ lọc theo category (`effectiveness.ts:333-335`) | P-b | M | – |
| P10 | Theo tuần: nhóm cột, bộ chọn cột | §22.6 | ❌ | `WeeklyBoard.tsx` | P-b | S–M | – |
| P11 | Bỏ `Việc đã giao` và tên `Thực trạng` | §22.6 | ❌ | `CaseBoardPage.tsx:58, 483` | P-b | S | – |
| P12 | Nối `<KetQuaDot>` / `<TyLe>` vào màn thật | §22.6 · 12.7 | 🟡 | Đã dùng: `MockDetailPage.tsx:166`, `StudentDetailPage.tsx:383`, `IssueAnalysis.tsx:323`, `ClassIssueBoard.tsx:200`; màn khác chưa | P-b | M | – |
| P13 | Bảng Vi phạm theo 5 nhóm × 4 trạng thái (cần chỉ số cắt theo nhóm) | 12.14 · K2-6 · SOS_V3 §7.6 | ❌ | `yThucMetric` chỉ đếm tổng | P-b | M | – |
| P14 | Lọc theo **lớp** ở góc nhìn Ý thức & Phối hợp (`classId` cho `yThucMetric`/`phoiHopMetric`) | 12.14 · K2-6 | ❌ | chỉ nhận `branchId/from/to` | P-b | S | – |
| P15 | Số Phối hợp SOS chia SOS1/2/3 | 12.15 · §7.6 bảng 3 | ❌ | `phoiHopMetric` đếm gộp | P-b | S | – |

> P13–P15 được §12 gắn "PR-P" nhưng **không có trong danh sách bước P1–P12** — đúng kiểu "không chép thành việc thì không tồn tại".

### 1.4. PR-R — Công việc, Kế hoạch Test, đường vào nhập điểm (plan.md §22.8)

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| R1 | Ba tab một nơi `Hỗ trợ học viên / Vận hành / Báo cáo đơn vị` | §22.8 · §3 21/09 | ❌ | Hai route riêng `/tien-do-cong-viec`, `/tien-trinh` (`App.tsx:136, 141`) | **PR-O** (dựng khung) | M | O1, câu hỏi 4.2 |
| R2 | 4 bộ lọc nhanh; loại việc/người phụ trách là dropdown có tìm kiếm | §22.8 | 🟡 | 4 bộ lọc hạn có (`WorkList.tsx:25-28`); loại việc còn chuỗi nút (`:135-146`) | R-a | S | R1 |
| R3 | Vận hành 5 cột; Tạm ngưng có lý do + người cần hỗ trợ + ngày xem lại; dời hạn lưu ngày cũ + lý do; việc con quá hạn hiện tên; bỏ ghi chú lặp | §22.8 · design §7.2 | 🟡 | Đủ 5 cột, có lý do + `review_on` (`MgmtTasksPage.tsx:219-268, 460`, `mgmttasks.ts:395-399`); thiếu người cần hỗ trợ; dời hạn ghi đè không lưu `task_history` (`mgmttasks.ts:445-452`); việc con chỉ badge (`MgmtTasksPage.tsx:238`) | R-a | M | – |
| R3b | Vận hành: dòng số đầu trang (chờ người khác / cần quyết định / vừa xong); số facet tính trước khi áp chính facet đó; điều kiện hoàn tất việc cha khi còn việc con | design §7.2 | ❌ | không tìm thấy; R3 không chép | R-a | S | – |
| R4 | Báo cáo đơn vị đảo thứ tự, bảng hiện ngay màn đầu | §22.8 · WORK-02 | ❌ | `ManagerTaskList` đứng trước ma trận (`MeetingPage.tsx:110-113`) | R-a | S | R1 |
| R5 | `Nháp / Đã nộp / Chưa báo cáo`; lưu nháp cả tuần; chỉ khoá nút Nộp | §22.8 · D04 | ❌ | `unit_reports.status` không có nháp (`schema.sql:1206-1217`); `editWindow` khoá cả form (`MeetingPage.tsx:125`) | R-a | L | migrate |
| R6 | Liên kết báo cáo ↔ task thật (F06, WORK-03) | §22.8 | ❌ | `meeting.ts:103-111` gợi ý cùng nhóm + CN, `LIMIT 6` | R-a | S–M | – |
| R7 | Một quy ước URL "mở đúng đợt" | §22.8 · 12.5 · DS05 | ✅ | **PR-Qb (23/09):** `shared/domain/duongHoSo.ts` (`duongHoSoHocVien`, `docThamSoHoSo`) — `?dot=&kn=`, `StudentDetailPage.tsx` đọc qua đó, không còn đọc lẻ `lo-trinh`/`tab` | Q-b | – | câu hỏi 4.3 |
| R8 | Bốn đường vào nhập điểm + `GET /notifications` JOIN `studentId` | §22.8 · 12.5 | ✅ | **PR-Qb (23/09):** (a) badge lớp mang `&scope=mine` (`StudentsPage.tsx`); (b) nhãn MT ở `ClassRoster.tsx` mở `duongHoSoHocVien(s.id,{dot})`; (c) `Stat` nhận `onClick`, vẽ `<button>` (`StudentDetailPage.tsx`); (d) ghim Đợt Test ở `HanhTrinh.tsx` có `onClick`; `server/src/platform/thongBao.ts` JOIN `student_id`/`attempt_id` theo `entity_type`, `Header.tsx` dùng `duongThongBao` | Q-b | – | R7 |
| R9 | Panel Kế hoạch Test mới 5 phần; hai hàng RLW / Speaking; tách cấu hình kỹ năng bắt buộc khỏi sửa lịch | §22.8 · 12.6 | ❌ | `MockPlanPanel.tsx:101` bulk-plan, checkbox `:154`, dãy MT1–MT7 `:271` | R-c | L | – |
| R9b | Tiêu đề `Kế hoạch Mock Test` khi chỉ có FT; lưu một phần thì giữ hàng lỗi để sửa | design §18.8, §9 | ❌ | `MockPlanPanel.tsx:120` | R-c | S | R9 |
| R10 | Ô đã có lịch mở modal sửa (tuần cũ → mới) | §22.8 | ❌ | `SkillWeekModal` chỉ ở `MockDetailPage.tsx:583` | R-c | M | R9 |
| R11 | Đợt hoàn tất (đủ điểm hoặc `-` + hết CN) thì chỉ QL sửa, có audit | §22.8 · §3 21/09 đêm | ❌ | `permissions.ts:412-416` `scoreEditPath` không xét; `attempts.ts:1195-1225` không chặn | R-c | M | R14 |
| R12 | Nút dời lịch một kỹ năng cho lớp Normal | §22.8 · SCH-01 · 12.6 | ❌ | RegularSheetPage không dùng `moveableSkills` (`permissions.ts:397`, `skillSchedule.ts:25`) | R-c | M | – |
| R13 | Bộ chọn tuần ở 600px / modal / mobile | §22.8 | ❓ | Phải bấm thử (`ui/Filters.tsx`, dùng ở 9 file) | R-c | S | – |
| R14 | Normal dùng `-` (GV ghi) → kỹ năng tự dời sang tuần sau (C08) | §22.8 · §3 21/09 đêm | ❌ | `attempts.ts:1195` còn từ chối "Lớp Normal không dùng dấu '-'"; `policy.ts:79` "C08 CHƯA NỐI DÂY" | R-c | M | R12 |
| R15 | Hồ sơ Test: menu chọn đợt khác ngay trên trang | design §22.1(1) | ❌ | không tìm thấy | R-c | S | – |
| R16 | Nút `Nhập điểm` cả lớp trên hồ sơ Test mang theo đợt/tuần | design §20.3 | ❌ | `MockDetailPage.tsx:156` `/nhap-diem/${classId}` không kèm period | R-c | S | – |

### 1.5. PR-S — Học thuật theo rule mới, chữ, nợ kỹ thuật (plan.md §22.9)

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| S1 | Đóng SOS không tạo case phải có lý do | §22.9 · RB §18.2 | ⚰️/🟡 | FT: đã có qua "Không cần theo dõi" bắt lý do (`sosAuto.ts:273-276`). **Normal: không có đường nào đóng tín hiệu mà không tạo case** — `noted` chỉ seed dùng (`seed/build.ts:535`) | S-luật | S–M | **câu hỏi 4.4** |
| S2 | Lịch sử điều chỉnh PA (bản cũ · khi nào · vì sao · hiện tại) | §22.9 · RB §18.2 | ❌ | Ghi đè `description` ở `cases.ts:1034`, `sosAuto.ts:122, 201`; không có bảng lịch sử; PA đã xác nhận không sửa được chút nào | S-PA | M | – |
| S3 | `Cần chú ý` → `Bình thường` | §22.9 | ✅ | PR-T T7 + PR-K K6b (`cases.ts:445`) | – | – | – |
| S4 | Cập nhật tuần rút gọn (kết quả · tiến triển · vấn đề còn tồn · giữ/điều chỉnh/thay · ghi chú) | §22.9 · RB §18.2 | ❌ | `recordFollowUp` chỉ nhận outcome/note (`cases.ts:1187-1190`); form cũ `CasePanel.tsx:1139`, `SkillBoard.tsx:744` | S-PA (gộp với S2) | M | S2 |
| S5 | Ô `Điểm chi tiết theo kỹ năng` ở tab nhập bù | §22.9 · 12.2 | ❌ | `QuickReport.tsx:158-171` không gửi `metrics` | PR-Form | S | – |
| S6 | Nhập bù chỉ còn Học thuật | §22.9 | ✅ | `QuickReport.tsx:26` | – | – | – |
| S7 | Quét từng màn: một khái niệm một chữ; mọi `<Empty>` nói "thiếu gì + ai điền + nút nào"; bỏ `SectionNote` giải thích mô hình | §22.9 · 12.11 | ❌ | 84 `SectionNote`, 36 `<Empty>` chưa rà | S-chữ | L | làm cuối |
| S8 | Bỏ 3 câu chú thích dài | §22.9 | ✅ | grep không còn (BAN_DO §6 ghi 🟡 — nhãn cũ) | – | – | – |
| S9 | `Chờ nhập điểm` đứng cạnh `Hạn nhập điểm` | §22.9 · 12.10 | 🟡/❓ | ScoreEntry đã tách hai mốc (`ScoreEntry.tsx:357-360`); cần bấm thử | S-chữ | S | – |
| S10 | Câu FT / Normal đúng ngữ cảnh | §22.9 | ✅ | `ui/chu.ts:13-14`, `ClassProgressPanel.tsx:92` | – | – | – |
| S11 | Cột riêng thay chuỗi `sit_note` làm cờ `fromNoShow` | §22.9 · 12.12 | ❌ | `absence.ts:239` `startsWith('Không dự thi')` | S-luật | S–M | migrate |
| S12 | branchpulse đếm `-` theo cặp W1/W2 như bảng chấm | §22.9 · 12.12 | ❌ | `branchpulse.ts:305-308` ghi "ước lượng thô" | S-luật | S | – |
| S13 | Báo lại `-` sau khi QL đảo kết luận: quyết định hành vi | §22.9 · 12.12 | ❌ | chưa quyết | S-luật | S | **câu hỏi 4.5** |
| S14 | Phép kiểm `resolveLateNoShow` nhánh Writing | §22.9 | ❌ | chỉ 1 phép gọi listening (`server/src/tests/run.ts:8567`) | S-luật | S | – |
| S15 | Phép kiểm trường `workScope` máy chủ trả về | §22.9 | ❌ | không có trong `server/src/tests` | S-luật | S | – |
| S16 | Lộ trình kết thúc mà còn case mở → tự đóng "Học viên kết thúc khoá", audit, ngoài thống kê hiệu quả | §22.9 · §3 21/09 đêm | ❌ | không tìm thấy; chỗ gắn `cycles.ts:102, 159` | S-luật | M | – |
| S17 | Case FT mở mà em chuyển sang Normal → tự đóng "Chuyển sang lớp Normal" | §22.9 · §3 21/09 đêm | ❌ | không tìm thấy; chỗ gắn `transition.ts` | S-luật | M | S16 |

### 1.6. Ý thức & Phối hợp — việc tồn (K2-6, 12.14, 12.15) và thiếu hụt so với NGUON

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| K2-1…K2-5 | Số/danh sách khớp khi lọc ngày; PA đang chuẩn bị không biến khỏi tab lớp; nút mờ + câu thiếu gì; nhãn "Không cần theo dõi"; việc nhỏ | §23.3b | ✅ | PR-K2 #44 + PR-K3 #46; ví dụ `YThucAnalysisView.tsx:58-68` truyền `extra={period}`, `SkillBoard.tsx:297-301` vẽ `dismissed` (ô tick trong plan.md chưa đánh — nên tick) | – | – | – |
| K2-6a | Nút `Ghi vi phạm` ở từng dòng HV của bảng lớp | 12.14 · Y_THUC §7.2 · SOS_V3 §7.4 · proto lớp | ❌ | `ClassRoster.tsx` không có | Q-a | S | Q4 |
| K2-6b | Link `Xem vi phạm đó` ở cảnh báo trùng V06 | 12.14 · Y_THUC §12#2 | ❌ | chỉ còn `Vẫn ghi vi phạm mới` | YT2 | S | YT-1 |
| K2-6c | Toast `Hoàn tác` 10 giây sau khi ghi vi phạm | 12.15 · Y_THUC §7.2 | ❌ | `RecordViolationPanel.tsx` chỉ báo đã ghi | YT2 | S | – |
| K2-6d | Máy chủ tự lấy người đăng nhập làm `performedBy` khi trống | 12.15 | 🟡 | `measures.ts:393` còn đòi tường minh; giao diện vá tạm | YT2 | S | – |
| K2-6e | `canRecordViolation` dùng `activeClassOf` (một nguồn "lớp đang học") | 12.15 | 🟡 | `profile.ts:521` (biến `current`) | YT2 | S | – |
| K2-6f | Tệp bằng chứng cho vi phạm (lúc ghi mới **và** sau khi lưu) | 12.14 · v1 §13 · v3 §18 | ❌ hoàn toàn | Không chỗ nào dùng `ownerType="violation"`; `RecordViolationPanel` không có `BangChung` kể cả khi sửa. **12.14 ghi "lưu xong vẫn đính kèm được" — sai với mã** | YT2 | S | câu hỏi 4.8 |
| YT-1 | Panel chi tiết vi phạm: thấy các PA liên quan + lịch sử sửa | NGUON v1 §32 · Y_THUC §7.7, §12#11 | ❌ | Máy chủ có `violationDetail` (`violations.ts:387`); web không gọi `GET /violations/:id` | YT2 | M | – |
| YT-2 | Sửa PA đang chuẩn bị: thêm/bỏ vi phạm, sửa loại/ghi chú/người phụ trách, xoá PA | NGUON v1 §25–26, §33.2 · v3 §22, §26 · Y_THUC §12#12–13 | ❌ | Route có sẵn (`routes/index.ts:827, 835, 840, 852`), web không gọi; "Mở phương án" mở thẳng `ConfirmMeasurePanel` | YT2 | M | – |
| YT-3 | Sửa/xoá vi phạm ngay trong PA đang chuẩn bị | NGUON v3 §19 · V12′ | ❌ | `ConfirmMeasurePanel.tsx:~105` chỉ liệt kê chữ | YT2 | S | YT-2 |
| YT-4 | Ô Môn tự điền theo môn GV dạy (V04) — **lỗi** | Y_THUC V04 · §12#1 | 🟡 lỗi | Máy chủ chỉ tự điền khi không gửi `skill` (`violations.ts:205`); web luôn gửi `skill: skill || null` (`RecordViolationPanel.tsx:86`) | YT2 | S | – |
| YT-5 | Tải thư cảnh cáo/đình chỉ xong nút Xác nhận có thể vẫn mờ (không tải lại `attachmentCount`) — **nghi lỗi** | B13 | 🟡 ❓ | `ConfirmMeasurePanel.tsx:46` đọc `/measures/:id`; `BangChung.tsx:74` chỉ làm mới `/attachments`, không `onChanged` | YT2 | S | bấm thử |
| YT-6 | "Theo thời gian" ở hồ sơ lớp là danh sách tra cứu **mọi** vi phạm, có lọc ngày; sửa được vi phạm đã xử lý | NGUON v3 §16, §19, §42 | 🟡 | `ClassYThucCard` chỉ lấy vi phạm chưa xử lý; `yThuc/board.ts` chỉ trả `unhandled` | YT2 | M | – |
| YT-7 | Mở một HV ở tab lớp: thấy vi phạm kèm trạng thái xử lý + tên PA đang chuẩn bị | NGUON v3 §14 | 🟡 | Dòng chỉ ghi "{n} PA đang chuẩn bị" | YT2 | S | – |
| YT-8 | Nhãn cảnh báo 5 ngày ở dòng HV của danh sách lớp (nơi thứ 3 của W05) | Y_THUC W05 · §12#16 | ❌ | `ClassRoster.tsx` không có | Q-a | S | – |
| YT-9 | Chọn/hiện người phụ trách PA xử lý | Y_THUC §7.3, §7.4 | 🟡 | Máy chủ nhận `ownerUserId` (`measures.ts:252`); giao diện chỉ có câu ghi chú | YT2 / PR-Form | S | – |
| YT-10 | Bổ sung ghi chú cho PA đã thực hiện (B10) | Y_THUC B10 | 🟡 | Máy chủ cho phép (`measures.ts:325`); `XemPhuongAnPanel` chỉ đọc | YT2 | S | – |
| YT-11 | "Gần đây:" ở hồ sơ lớp bấm mở được chi tiết | NGUON v1 §33.3 | 🟡 | chữ thường | YT2 | S | – |
| YT-12 | Ba bộ lọc phụ `Chưa xử lý / Có PA đang chuẩn bị / >5 ngày` | NGUON v3 §15 | ❌ (nguồn cho hoãn) | SOS_V3 §7.1 ghi hoãn; plan không ghi | YT2 (tuỳ chọn) | S | câu hỏi 4.13 |
| YT-13 | Không chồng panel lên panel (Ghi vi phạm lồng trong Modal) | design §18.1 · 12.14 | 🟡 | theo 12.14 | YT2 | S | – |
| YT-14 | Nợ sau rà soát PR-K3: phép kiểm `recentByStudent` so id; `rowsForCategory` thiếu `useMemo` deps; gửi thừa `MeasureDetail` | 12.15 | ❌ | `ClassYThucCard.tsx` | YT2 | S | – |

### 1.7. Luật học thuật / rule book / hệ giao diện ngoài PR-S

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| RB-1 | Chốt `-` cuối tuần chạy **kể cả không ai mở web** | RB §17.1 | 🟡 | `settleNoShows` chỉ gọi khi mở trang (attempts, absence, mywork); Netlify không có tác vụ định kỳ | PR-AN | S–M | **câu hỏi 4.6** |
| RB-2 | Mọi hạn hiển thị qua `<Han loai=…>` | §3 20/09 · HE_GIAO_DIEN §4 · CASE-07 | 🟡 | Mới ở SkillBoard, ScoreEntry; ~17 file tự viết "hạn/quá hạn" (CasePanel, WorkList, BranchPulse, MockDetailPage, ClassRoster…) | S-chữ | M | – |
| RB-3 | Chuyển lớp: lý do bắt buộc + lựa chọn "Không có lưu ý" | RB §10 | 🟡 | `students.ts:154` lý do tuỳ chọn | S-luật | S | câu hỏi 4.16 |
| RB-4 | Ngày nghiệp vụ ≠ ngày ghi nhận hiện trên màn (MT-P10); `useNgayNghiepVu()` thay mọi chỗ tự đọc `demoDate` | 12.7 · HE_GIAO_DIEN | 🟡 | chưa hiện ở màn nào | S-chữ | S | – |
| RB-5 | Đường "hiệu chỉnh điểm có lý do" cho GV (thông báo lỗi `-` đè điểm đang nhắc tới nó) | 12.9 | ❌ | không tìm thấy; **không gắn PR nào** | R-c | M | R11 |
| RB-6 | GVCN có còn bấm "Hoàn thành case" cho case môn khác (C02)? | 12.13 | ❓ quyết | hiện vẫn được | S-luật | S | câu hỏi 4.15 |
| RB-7 | "Ngôn ngữ" và "Từ vựng/Ngữ pháp" của Listening chồng nghĩa; taxonomy tách triệu chứng/nguyên nhân | RB §13-8 · design §5.2 | 🟡 | `shared/domain/cases.ts:330-403` 2 tầng | hoãn (cần tổ chuyên môn) | L | câu hỏi 4.14 |
| RB-8 | "Sửa điểm làm mất căn cứ case" | 12.2 | ❓ | chưa kiểm được bằng đọc mã | S-luật (kiểm + phép kiểm) | S | – |
| RB-9 | Lưu trữ HV sau khi kết thúc (O08, "chờ chốt") | `shared/domain/students.ts:12` | ❓ quyết | – | S-luật | S | câu hỏi 4.17 |

### 1.8. Form case, chọn người, bằng chứng (design §17.5, §22.4, §22.5)

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| F-1 | **CASE-ATTACH:** Đính kèm tệp + liên kết ngay dưới ô Mô tả trong form tạo case (học thuật), tab nhập bù, bước xác minh SOS | §3 20/09 · design §17.5 ("không phải ý tưởng để gác") | ❌ | `BangChung` chỉ ở CasePanel, SkillBoard, yThuc; `QuickReport.tsx` không có. BAN_DO ghi CASE-04 ✅ nên phần form này **khuất tầm mắt** | PR-Form | M | câu hỏi 4.8 |
| F-2 | Ô chọn người có tìm kiếm (≥ 3 ký tự) cho **mọi** trường chọn người, lưu ID thay chữ tự do | design §22.5 | ❌ | `PeoplePicker.tsx` có nhưng **không màn nào dùng**; chữ tự do ở `CasePanel.tsx:934`, `CaseSosControls.tsx:145`, `ConfirmMeasurePanel.tsx:84`, `QuickReport.tsx:385`; `<select>` ở `MgmtTasksPage.tsx:545, 553`, `TeacherAssignPanel.tsx:84` | PR-Form | M–L | câu hỏi 4.7 |
| F-3 | Nhập bù: bố cục thẻ 3 dòng, chọn người bằng ID | design §22.4 | ❌ | `QuickReport.tsx:385` | PR-Form | S | F-2 |
| F-4 | Cảnh báo trùng case trước khi lưu (cùng HV + kỹ năng) | plan §20 DS07 (chưa duyệt) | ❌ | – | hoãn | M | §6 bảng |

### 1.9. An toàn và vận hành trước khi có người dùng thật (12.15, 12.16, 12.17, 12.18)

| Mã | Nội dung | Nguồn | TT | Bằng chứng | PR đề xuất | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| AN-1 | Giới hạn số lần thử `/auth/login` | 12.15 | ❌ | grep không thấy rate limit ở `server/src` | PR-AN | S | – |
| AN-2 | Phiên hết hạn | 12.15 · 12.16 | ✅ | `auth.ts:39` `PHIEN_HET_HAN_SAU_NGAY = 30` | – | – | – |
| AN-3 | Lỗi 409/500 trả nguyên câu SQL/thông điệp nội bộ | 12.15 | ❌ | `server/src/app.ts:48` (`details.raw`), `:52` (`'Lỗi hệ thống: ' + message`) | PR-AN | S | – |
| AN-4 | `/api/health` công khai, hỏi DB mỗi lần | 12.15 | 🟡 | `app.ts:29-31` chỉ trả `ok/seeded` — rủi ro thấp | PR-AN | S | – |
| AN-5 | Hàm Netlify dừng sau 10 giây, giao dịch bị cắt giữ khoá ghi Turso | 12.15 | ❌ | không có cấu hình timeout ở `netlify.toml` | PR-AN + đo ở Z2c | S–M | – |
| AN-6 | `/auth/register` mở cho mọi người | 12.16 | 🟡 | `routes/index.ts:1578`; tài khoản cần duyệt (`accounts.ts:149, 206`) | PR-AN | S | câu hỏi 4.11 |
| AN-7 | Màn đăng nhập bản chính không hiện "máy chủ chưa chạy" (suy từ `/demo/accounts`) | 12.16 · 12.17 | ❌ | `WelcomePage.tsx:89-93` | PR-AN | S | – |
| AN-8 | Thẻ case đếm bằng chứng mỗi thẻ một truy vấn (N+1) | 12.18 | ❌ | `server/src/cases/cases.ts` ~2380 | PR-AN (tối ưu Turso) hoặc Z2c Step 6 | S | – |
| AN-9 | Hồ sơ HV gọi `/violation-warning` 2 lần | 12.18 | ✅ | **PR-Qb (23/09):** `StudentYThucSection.tsx` nhận prop `canhBao` từ `StudentDetailPage.tsx`, không tự gọi lại | Q-b | – | – |
| AN-10 | 375px: bảng Mock Test và bảng HV lớp cuộn ngang trong thẻ; nhãn `dự kiến dd/mm` lòi 23px | 12.18 | ✅ | **PR-Qb (23/09):** bảng lượt thêm `min-w-[640px]` trong `overflow-x-auto`; `HanhTrinh.tsx` (thay `JourneyTimeline.tsx`) không còn nhãn "dự kiến" tuyệt đối vị trí | Q-b | – | – |
| AN-11 | Build cần mạng (thư viện Linux); bản gói ghi `nodejs24.x` dù toml ghi Node 22 | 12.15 | 🟡 ghi nhận | – | Z2c (ghi vào TRIEN_KHAI) | S | – |
| AN-12 | Netlify Blobs nhất quán sau cùng; đường tải kho tệp thật của `sao-luu` chưa chạy | 12.16 · 12.17 | ❓ | – | Z2c Task 10 | S | – |
| AN-13 | Phép kiểm cũ: `db().name` luôn `""`; tên máy giả `*.turso.io` → `.invalid` | 12.17 | ❌ | – | S-luật | S | – |
| AN-14 | Không có màn tạo chi nhánh / quản trị đơn vị báo cáo (chỉ lệnh `them-chi-nhanh`) | 24.2 · 12.17 | ❌ | – | tuỳ chọn | M | câu hỏi 4.18 |

### 1.10. Tài liệu lệch mã (cần sửa trong cùng PR đầu tiên chạm tới)

| Mã | Nội dung | TT | Bằng chứng |
|---|---|---|---|
| DOC-1 | plan.md §23.3b K2-1…K2-7 chưa tick dù đã merge #44/#46 | ❌ | `git log`: `a386b1c`, `edf8704` |
| DOC-2 | plan.md §22.10 và dòng §3 cuối (20/09) còn ghi C08/C01 "chưa chốt"; `LUAT_CHO_CHOT` §6.5, §7; `policy.ts:79`; chú thích `absence.ts:605` (C10 "chờ QL") | ❌ | xem §3 |
| DOC-3 | plan.md §22.5 (PR-K cũ) chưa ghi ⚰️, dễ bị làm lại | ❌ | §22.5 |
| DOC-4 | plan.md §12.2 còn "gộp đợt cửa sổ bốn ngày", "hạn xác minh SOS ba ngày" (mô hình đã bỏ) | ⚰️ | plan.md:1724-1725 |
| DOC-5 | BAN_DO: "Thay 13/4" ghi ❌ (thật ✅); "KetQuaDot/TyLe chưa màn nào dùng" (thật 🟡); "Tạm ngưng" ❌ (thật 🟡); "Mốc học tập" 🟡 (thật ❌); PeoplePicker 🟡 (thật ❌ không màn nào dùng); "Phân tích là route riêng" (đã có tab Thực trạng); hồ sơ lớp "danh sách HV đứng một mình" (đã có 4 thẻ); "Cần chú ý" còn ở CaseBoardPage (đã sửa K6b); P12 plan cũng lệch | ❌ | báo cáo đối chiếu |
| DOC-6 | HĐSL §2 còn chỉ số Ý thức cũ; HĐSL §6 "bốn chỉ số 501"; Y_THUC còn V11–V14 "không chính xác" | ⚰️ | – |

### 1.11. PR-Z2c — Deploy (plan chi tiết `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md` Task 10–11)

| Mã | Nội dung | TT |
|---|---|---|
| Z2c-1 | Step 1 hỏi DB `pisatracking` cùng vùng · Step 2 deploy nháp · 2a tập dượt init trên DB tạm · 2b tập dượt khôi phục qua mạng | ❌ |
| Z2c-2 | Step 3 init bản chính (chủ sản phẩm chạy) · 3b lên địa chỉ chính thức (chưa báo GV) | ❌ |
| Z2c-3 | Step 4 luồng đầu–cuối (init → CN → tài khoản → lớp → HV → MT → điểm SOS → case + PA điền sẵn + Phối hợp → vi phạm → PA xử lý → tệp) · Step 5 đo 5 trang · Step 6 gộp truy vấn trang > 3 s | ❌ |
| Z2c-4 | Step 7 dọn dữ liệu thử · Step 8 khoá bản nháp · 8b kết nối nguội > 10 phút · Step 9 nhật ký | ❌ |
| Z2c-5 | Task 11 rà soát độc lập (khác model người code) · check xanh · PR · báo chủ sản phẩm | ❌ |
| Z2c-6 | Kiểm trên **máy tính bảng và điện thoại thật** (12.4) + bấm qua các hộp thoại chưa ai bấm (12.10, 12.11) | ❌ |

**Chặn Z2c:** mọi PR ở mục 5 đã merge + mọi PR có migrate đã chạy lặp trên bản sao DB thử. Vì bản chính **rỗng** nên các migrate mới không có rủi ro dữ liệu thật — đây là lợi thế lớn của việc làm hết trước deploy.

---

## 2. Yêu cầu của chủ sản phẩm (nguồn A) CHƯA TỪNG thành việc

Đã grep `plan.md`, `BAN_DO_OVERHAUL.md`, `docs/superpowers/*`. "Chưa thành việc" = không có ở bất kỳ danh sách bước nào của PR (có thể có một câu nhắc gián tiếp).

| # | Yêu cầu | Nguồn gốc | Mã ở mục 1 | Vì sao quan trọng |
|---|---|---|---|---|
| 1 | **Sửa PA xử lý đang chuẩn bị** (thêm/bỏ vi phạm, sửa, xoá) — máy chủ xong, giao diện không có nút | NGUON v1 §25–26, §33.2 · v3 §22, §26 | YT-2 | Lõi luồng GVCN; hiện gom nhầm là không sửa được |
| 2 | **Chi tiết vi phạm thấy các PA liên quan** | NGUON v1 §32 | YT-1 | Chỉ còn ô K5 cũ không PR nào nhận |
| 3 | **Tệp bằng chứng cho vi phạm** (không đính được ở đâu cả) | NGUON v1 §12.8, §13 · v3 §18 | K2-6f | 12.14 ghi sai là "lưu xong vẫn đính được" |
| 4 | Sửa/xoá vi phạm từ trong PA và từ hồ sơ lớp, kể cả vi phạm đã xử lý | NGUON v3 §19 | YT-3, YT-6 | – |
| 5 | "Theo thời gian" là danh sách tra cứu đầy đủ có lọc ngày | NGUON v3 §16, §42 | YT-6 | – |
| 6 | Ô Môn tự điền (lỗi V04) · nút Xác nhận có thể không sáng sau khi tải thư | Y_THUC V04, B13 | YT-4, YT-5 | Hai lỗi thật/nghi lỗi, chưa có việc |
| 7 | Cảnh báo ở dòng HV danh sách lớp (W05 nơi thứ 3) · chọn người phụ trách PA xử lý | Y_THUC W05, §7.4 | YT-8, YT-9 | – |
| 8 | **CASE-ATTACH trong form tạo case / nhập bù / xác minh SOS** | §3 20/09 · design §17.5 | F-1 | Quyết định đã duyệt, bị che vì CASE-04 ✅ |
| 9 | **Ô chọn người có tìm kiếm, lưu ID** cho mọi trường chọn người | design §22.5 | F-2 | Q6 chỉ làm 1 ô lọc; dữ liệu người thực hiện đang là chữ tự do |
| 10 | Thanh ngữ cảnh Tổng quan: Normal/FT/Cả hai + "Dữ liệu đến {ngày}" | design §4.1, §18.2 | P6b | – |
| 11 | Đầu hồ sơ lớp có tóm tắt + 2 vấn đề nổi bật + chế độ Điểm/Cần hỗ trợ | design §8.3 | Q10 | Q4 chỉ dựng khung |
| 12 | Phân tích: danh sách mobile + cột thao tác; F04 ở máy chủ (theo vấn đề cụ thể, HV duy nhất, trung vị) | design §5.1, §5.3 | P8b, P9b | P8/P9 chỉ nói bố cục |
| 13 | Hồ sơ Test: menu chọn đợt khác; nút Nhập điểm mang đợt | design §22.1, §20.3 | R15, R16 | – |
| 14 | Kế hoạch Test: tiêu đề "Mock Test" khi chỉ FT; lưu một phần giữ hàng lỗi | design §18.8, §9 | R9b | – |
| 15 | Vận hành: dòng số đầu trang, số facet đúng, điều kiện hoàn tất việc cha | design §7.2 | R3b | – |
| 16 | Test mở mặc định theo vai | design §17.1, §17.6.3 | O2b | – |
| 17 | Nút `Nhập điểm` trên hàng lớp · bỏ cặp nút phạm vi (code chỉ đổi chữ) · modal thêm HV hàng loạt | design §18.5, §22.7, §22.6 | Q11, Q12, Q13 | – |
| 18 | **Chốt `-` tự chạy kể cả không ai mở web** | RB §17.1 | RB-1 | Trên Netlify không có tác vụ định kỳ → số liệu có thể thấy `-` chưa chốt |
| 19 | Mọi hạn qua `<Han>` (6 đồng hồ) | §3 20/09 · HE_GIAO_DIEN §4 | RB-2 | Plan chỉ nhắc KetQuaDot/TyLe |
| 20 | Mọi số dashboard qua `<SoLieu>` (BranchPulse, Highlights, badge lớp) | HĐSL luật 1 | P6c | – |
| 21 | Normal: đường đóng tín hiệu SOS không tạo case (S1 tưởng đã có) | RB §18.2 · Q-V3-1 | S1 | Cần viết lại S1 |
| 22 | Chuyển lớp: lý do bắt buộc + "Không có lưu ý" | RB §10 | RB-3 | – |
| 23 | Đường hiệu chỉnh điểm có lý do cho GV | 12.9 | RB-5 | Thông báo lỗi đang nhắc tới đường không tồn tại |
| 24 | Lỗi link `/tong-quan?cn=` | (phát hiện) | O7 | – |
| 25 | Việc §12 gắn nhãn "PR-X" nhưng không có trong bước của PR đó: nút Ghi vi phạm ở dòng lớp (→Q), bảng 5×4 + lọc lớp + SOS1/2/3 (→P), 375px (→Q), Undo toast, `performedBy`, `activeClassOf`, "Xem vi phạm đó" | 12.14, 12.15, 12.18 | K2-6a…e, P13–P15, AN-10 | Nay đã có mã và PR ở mục 5 |

---

## 3. Mâu thuẫn giữa các nguồn — quyết định mới hơn thắng

| # | Mâu thuẫn | Bên thắng (plan.md §3) | Việc cần làm |
|---|---|---|---|
| 1 | "Biện pháp xử lý", cấm gọi là "phương án" (NGUON v1 §17, Y_THUC §3, TU_DIEN bản đầu, design §19.1 "tránh PA trong tiêu đề") ↔ PR-HV D1 "Phương án (PA)", màn trộn "PA xử lý"/"PA học thuật" | **D1, 22/09** | S7 phải quét theo từ điển mới; NGUON/Y_THUC/SOS_V3 vẫn chữ cũ — chỉ ghi chú, không sửa nguồn gốc |
| 2 | Đánh dấu "không chính xác" (NGUON v1 §15, Y_THUC V11–V14, RB §18.3) ↔ sửa/xoá thẳng (v3 §19) | **v3, 21/09 tối** | DOC-6 |
| 3 | SOS chỉ là tín hiệu, xác minh rồi mới tạo case (RB §3.4, §17.3, C05, NGUON v1 §3) ↔ FT tự tạo case + PA điền sẵn + Phối hợp (v3) | **v3, 21/09 tối**; Normal giữ mô hình tín hiệu (Q-V3-1) | P1 ô "Chờ xác minh quá hạn" giờ chỉ phủ Normal → câu hỏi 4.1; S1 viết lại |
| 4 | Ba khu vực xếp dọc (Y_THUC §7.3) ↔ gom theo học sinh + toggle Theo thời gian | **v3, 21/09 tối** | – |
| 5 | Hồ sơ lớp: design §18.6 ba tab · §22.2 menu trực tiếp · Q4 ghi tab "Ý thức" ↔ 4 tab, tab tên `Ý thức & Phối hợp` | **21/09 + 21/09 tối** | Q4 dùng tên v3 |
| 6 | Tên ba tab Công việc §7.1 ↔ §18.4 | **§18.4 (21/09)** | R1 |
| 7 | Mức case: RB §4.2 "bỏ Bình thường" ↔ `Cần chú ý` → `Bình thường` | **21/09** (đã làm) | – |
| 8 | C08: plan §22.10, dòng §3 cuối (20/09), RB §18.7, LUAT §6.5/§7, `policy.ts:79` "chưa chốt" ↔ C08 đóng: Normal dùng `-`, GV ghi, tự dời | **21/09 đêm** | R14; DOC-2. RB §3.3/§17.1 "Normal không `-`" cũng bị thay |
| 9 | C01 "chờ xác nhận" (dòng §3 cuối, RB §17.7) ↔ C01 đóng, hai mốc riêng | **21/09** | DOC-2 |
| 10 | 17/09 hai nút `Việc của tôi / Cả phạm vi` ↔ dropdown Người phụ trách | **20/09** | Q12 (mã chỉ đổi chữ) |
| 11 | P7 góc nhìn "Ý thức" ↔ "Ý thức & Phối hợp"; §22.5 PR-K cũ ↔ §23.3 PR-K v3 | **21/09 tối** | DOC-3 |
| 12 | Q9 "Toàn bộ / kỹ năng / **Ý thức**" (viết trước 21/09, khi Ý thức còn là case) ↔ mô hình vi phạm; spec PR-HV §4.4 giữ Hành trình như cũ | chưa có quyết định | câu hỏi 4.12 |
| 13 | design §4.1 ô số 1 "HV có SOS gần nhất" ↔ §18.2 "HV dưới kỳ vọng" ↔ mã hiện tại (có "Case thiếu PA học thuật" — PR-HV (12) chốt bộ lọc này) | §18.2 mới hơn §4.1; PR-HV không chốt bộ ô Tổng quan | câu hỏi 4.1 |
| 14 | R11 "điểm **hoặc** `-`" ↔ R14 Normal `-` = dời lịch (không bao giờ "hoàn tất bằng `-`") | cả hai 21/09 đêm, không mâu thuẫn thật | Ghi rõ: vế "hoặc `-`" chỉ áp FT |
| 15 | R5 (D04) "chỉ khoá nút Nộp" ↔ mã khoá cả form (`editWindow`) | **D04, 20/09** | R5 |
| 16 | R8b nhãn MT mở hồ sơ HV đúng đợt ↔ O2 đưa hồ sơ đợt vào khu Test | chưa quyết | câu hỏi 4.3 |
| 17 | P6 WorkList là màn đầu của GV ↔ khu Công việc hiện chỉ Quản trị/QL CN thấy (`routes/index.ts:143-148`) mà tab "Hỗ trợ học viên" chính là WorkList | chưa quyết | câu hỏi 4.2 |
| 18 | §22.11 / §3 21/09 "chưa đặt mốc deploy" ↔ §3 21/09 tối "deploy đêm nay" ↔ **chủ sản phẩm 22/09: làm hết rồi deploy** | **22/09 (câu hỏi này)** | Cần thêm một dòng §3 ghi quyết định 22/09 và đánh ⚰️ §23.4 "sau deploy" |
| 19 | §23.4 thứ tự O→Q→P→R→S ↔ đánh số §22.4–22.9 (O, K, P, Q, R, S) | **§23.4** | Mục 5 giữ tinh thần O trước, S-chữ cuối |
| 20 | 12.14 "lưu xong vẫn đính kèm vi phạm được" ↔ mã không có chỗ nào | **mã** | K2-6f |
| 21 | S16 nghiệm thu "Vũ Thu Uyên hết lệch 29/28" ↔ bản chính rỗng (§3 21/09 tối) | luật vẫn làm; phép kiểm tự dựng dữ liệu | S16 |

---

## 4. Câu hỏi cần chủ sản phẩm quyết (gộp một lần)

| # | Câu hỏi | Phương án | Đề xuất |
|---|---|---|---|
| 4.1 | Bốn ô số Tổng quan là gì, khi FT đã tự tạo case (không còn "chờ xác minh" ở FT)? | (a) theo §18.2 nguyên văn, ô 3 = tín hiệu chờ xác minh quá hạn (chỉ Normal); (b) ô 3 = **case chờ xác định nguyên nhân quá hạn** (FT) + tín hiệu Normal gộp; (c) giữ bộ hiện tại (có "Case thiếu PA học thuật") | **(b)**: HV dưới kỳ vọng · HV có case mở · Chờ xác định nguyên nhân/xác minh quá hạn · PA cần cập nhật |
| 4.2 | GV có thấy khu Công việc không? "Xem tất cả" ở Tổng quan trỏ đâu? | (a) GV thấy khu Công việc, chỉ tab Hỗ trợ học viên; (b) GV không thấy, "Xem tất cả" mở trang việc riêng ở Tổng quan | **(a)**, nhất quán 4 khu vực và theo quyền |
| 4.3 | "Mở đúng đợt" dẫn về đâu? | (a) hồ sơ HV `?dot=<attemptId>&kn=<skill>` mở tab Học thuật đúng đợt; (b) hồ sơ đợt trong khu Test | **(a)** cho HV; nút "Hồ sơ đợt" thứ cấp dẫn khu Test |
| 4.4 | S1 với lớp Normal | (a) dựng route đóng tín hiệu không tạo case, bắt lý do; (b) bỏ S1 (Normal luôn tạo case hoặc để tín hiệu treo) | **(a)**, cỡ S–M |
| 4.5 | S13: nhập lại `-` sau khi QL đã đảo kết luận | (a) không làm gì, giữ quyết định QL; (b) báo QL | **(a)** + một dòng giải thích trên ô |
| 4.6 | Chốt `-` trên Netlify | (a) Netlify Scheduled Function đầu thứ Hai (miễn phí); (b) chỉ chốt khi mở trang (hiện tại) | **(a)** |
| 4.7 | Người thực hiện PA: lưu ID người hay chữ tự do? | (a) chọn người, lưu ID, cho "Người ngoài (gõ tên)" khi cần (tutor ngoài); (b) giữ chữ tự do + gợi ý | **(a)** — làm trước deploy vì DB rỗng, không phải chuyển dữ liệu cũ |
| 4.8 | Đính kèm ngay trong form khi bản ghi chưa có id (case mới, vi phạm mới) | (a) tạo nháp khi mở form (giữ idempotencyKey) rồi đính kèm; (b) lưu trước, khối Bằng chứng hiện ngay trong panel sau khi lưu, không đóng panel | **(b)** — đơn giản, không có bản ghi mồ côi |
| 4.9 | Có làm "Undo 10 giây" cho ghi vi phạm không? | (a) có, dùng route xoá sẵn có; (b) bỏ, vì đã có Sửa/Xoá | **(a)**, cỡ S |
| 4.10 | Duyệt chữ đang "chờ duyệt" ở `TU_DIEN_VA_CHU.md` (dòng 190–199 PR-K/K2, bảng PR-HV §8, hai cách viết trạng thái case từ SOS §7 ↔ §8) | (a) duyệt cả gói; (b) từng dòng | **(a)**, chọn "Chờ GVBM xác định nguyên nhân · hạn {ngày}" cho danh sách, "Xác định nguyên nhân {kỹ năng}" cho Việc cần làm |
| 4.11 | `/auth/register` ở bản chính | (a) giữ (cần QTHT duyệt); (b) tắt, QTHT tạo tài khoản | **(a)** + AN-1 rate limit |
| 4.12 | Hành trình có hiện vi phạm/PA xử lý không (lựa chọn "Ý thức" ở Q9)? | (a) có, mốc vi phạm/PA xử lý; (b) không, chỉ học thuật — Ý thức xem ở tab riêng | **(b)** — tránh lặp tab `Ý thức & Phối hợp` |
| 4.13 | Ba bộ lọc phụ Chưa xử lý / Có PA đang chuẩn bị / >5 ngày (v3 §15 cho hoãn) | (a) làm; (b) hoãn tiếp | **(a)** — rẻ (S) khi đã sửa YT-6 |
| 4.14 | Taxonomy vấn đề (tách triệu chứng/nguyên nhân; Listening "Ngôn ngữ" vs "Từ vựng/Ngữ pháp") | (a) chờ tổ chuyên môn; (b) bên design tự đề xuất | **(a)** — ghi vào hoãn |
| 4.15 | GVCN có còn "Hoàn thành case" môn khác không (sau C02)? | (a) không (khớp C02); (b) có | **(a)** |
| 4.16 | Chuyển lớp: lý do bắt buộc? | (a) bắt buộc + "Không có lưu ý"; (b) tuỳ chọn | **(a)** theo RB §10 |
| 4.17 | O08: sau bao lâu đưa HV đã kết thúc vào lưu trữ? | 30 ngày · 90 ngày · chỉ khi QL bấm | **Chỉ khi QL bấm** (đơn giản, không tác vụ ngầm) |
| 4.18 | Có cần màn tạo chi nhánh / sắp đơn vị báo cáo trong web? | (a) có (QTHT); (b) giữ lệnh `them-chi-nhanh` | **(b)** với 1–2 chi nhánh |
| 4.19 | Xác nhận lại Q-V3-1…9 (bên design tự chốt tối 21/09; chỉ Q-V3-4 có lời chủ sản phẩm) | (a) duyệt cả gói; (b) rà từng câu | **(a)**, nhấn mạnh Q-V3-1 (Normal giữ tín hiệu) |
| 4.20 | F09: "GV thuộc chi nhánh" nghĩa là gì (hiện suy từ vai + CN, `classes.ts:632-636`) | (a) theo vai tại CN; (b) theo phân công lớp đang hoạt động | **(a)** giữ như mã |
| 4.21 | "Làm hết" có gồm các khối đã hoãn ở mục 6 không? | xem mục 6 | Đề xuất: **không** gồm §6 phân tích GV và kho ý tưởng; **có** gồm vài DS rẻ đã trùng việc thật (DS05, DS06 đã làm, DS16) |

---

## 5. Chia PR để làm trước deploy

### 5.1. Danh sách PR (chia lại PR-O/Q/P/R/S)

Lý do chia lại: PR-R cũ gồm 3 khối không liên quan (Công việc · đường vào · lịch Test) và chạm ~15 file; PR-Q và PR-R cùng sửa `StudentDetailPage`/`JourneyTimeline`/`ClassRoster`; PR-S trộn luật máy chủ với quét chữ toàn web. Chia theo **bộ file** để chạy song song được.

| PR | Phạm vi (mã) | File chính | Cỡ | Model (B) |
|---|---|---|---|---|
| **PR-O** · Khung 4 khu vực | O1–O7, **R1** (khung Công việc 3 tab bọc trang cũ), redirect `/hoc-thuat`, `/tien-trinh`, `/tien-do-cong-viec` | `App.tsx`, `routes/index.ts` (khối nav), `OverviewPage.tsx` (đổi tên tab), trang mới `TestPage.tsx`, `CongViecPage.tsx`, `BranchPulse.tsx:231` | M | Sonnet 5 · High (B: Fable 5.1 · Medium) |
| **PR-AN** · An toàn trước người dùng thật | AN-1, AN-3, AN-4, AN-5, AN-6 (theo 4.11), AN-7, AN-8, **RB-1** (Scheduled Function chốt `-`) | `server/src/app.ts`, `auth.ts`, `routes/index.ts` (khối `/auth`), `WelcomePage.tsx`, `netlify.toml`, `netlify/functions/` (hàm định kỳ mới), `cases.ts` (~2380 chỉ hàm đếm) | S–M | Opus 5 · High (B: Fable 5.1 · High) |
| **PR-S1** · Luật máy chủ | S1 (theo 4.4), S11–S17, RB-3, RB-6, RB-8, RB-9, AN-13 | `absence.ts`, `branchpulse.ts`, `cycles.ts`, `transition.ts`, `students.ts`, `signals.ts`, `effectiveness.ts` (loại case tự đóng), `schema.sql` + `migrate.ts`, `server/src/tests/*` | M–L | Opus 5 · XHigh (B: Fable 5.1 · High) |
| **PR-S2** · Điều chỉnh PA học thuật | S2 + S4 (một luồng "giữ / điều chỉnh / thay, có lý do, có lịch sử") | `cases.ts` (recordFollowUp, sửa PA), `sosAuto.ts`, `schema.sql`/`migrate.ts` (bảng lịch sử), `CasePanel.tsx`, `SkillBoard.tsx` | M–L | Opus 5 · XHigh (B: Fable 5.1 · High) |
| **PR-Qa** · Học viên & Lớp + hồ sơ lớp 4 tab | Q1–Q5, Q10–Q13, K2-6a, YT-8 | `StudentsPage.tsx`, `ClassOverviewPage.tsx`, `ClassRoster.tsx`, `IntakePanel.tsx`, `ClassYThucCard.tsx` (chỉ di chuyển vào tab), `ClassIssueBoard.tsx` | L | Fable 5.1 · High (B: Sonnet 5 · High) |
| **PR-YT2** · Ý thức: phần còn thiếu so với NGUON | YT-1…YT-7, YT-9…YT-14, K2-6b…f | `web/src/modules/yThuc/*` (ClassYThucCard, RecordViolationPanel, ConfirmMeasurePanel, CreateMeasurePanel, XemPhuongAnPanel, StudentYThucSection, panel chi tiết vi phạm mới), `server/src/yThuc/board.ts`, `measures.ts`, `students/profile.ts` | M–L | Sonnet 5 · High (B: Opus 5 · High) — đặc tả đã khoá |
| **PR-Qb** · Hồ sơ HV: hành trình + đường vào đúng đợt | Q9, R7, R8 (a–d + notifications JOIN), AN-9, AN-10 | `StudentDetailPage.tsx`, `JourneyTimeline.tsx`, `ClassRoster.tsx` (nhãn MT), `StudentsPage.tsx` (badge lớp — R8a), `ClassOverviewPage.tsx` (nút nhập điểm mang scope), `routes/index.ts` (`/notifications`), `shared/domain/display.ts` | M–L | Fable 5.1 · High (B: Sonnet 5 · High) |
| **PR-Pa** · Tổng quan | P1–P6, P6b, P6c | `OverviewPage.tsx`, `MetricTiles.tsx`, `Highlights.tsx`, `BranchPulse.tsx`, `WorkList.tsx` (chế độ preview), `server/src/worklist/dashboard.ts`, `highlights.ts`, `mywork.ts` (thứ tự ưu tiên) | L | Fable 5.1 · High (B: Opus 5 · High) |
| **PR-Pb** · Phân tích | P7–P15 | `CaseBoardPage.tsx`, `IssueAnalysis.tsx`, `WeeklyBoard.tsx`, `YThucAnalysisView.tsx`, `server/src/cases/effectiveness.ts`, `yThuc/thongKe.ts`, `yThuc/phoiHop.ts`, `worklist/metrics.ts`, `shared/domain/metrics.ts` | L | Opus 5 · XHigh (B: Fable 5.1 · High) |
| **PR-Ra** · Công việc | R2–R6, R3b, **Q6** (cùng `WorkList.tsx`) | `WorkList.tsx`, `mywork.ts`, `MgmtTasksPage.tsx`, `mgmttasks.ts`, `MeetingPage.tsx`, `meeting.ts`, `schema.sql`/`migrate.ts` (nháp báo cáo, lịch sử dời hạn, người cần hỗ trợ) | L | Opus 5 · XHigh (B: Fable 5.1 · High) |
| **PR-Rc** · Lịch Test + luật điểm | R9–R16, RB-5 | `MockPlanPanel.tsx`, `MockDetailPage.tsx` (tách `SkillWeekModal`), `RegularSheetPage.tsx`, `normal/regular.ts`, `fasttrack/attempts.ts`, `skillSchedule.ts`, `permissions.ts`, `policy.ts`, `ui/Filters.tsx` | L | Opus 5 · XHigh (B: Fable 5.1 · High) |
| **PR-Form** · Chọn người + bằng chứng trong form | F-1, F-2, F-3, S5, YT-9 (nếu chưa làm ở YT2) | `PeoplePicker.tsx`, `QuickReport.tsx`, `CasePanel.tsx`, `CaseSosControls.tsx`, `ConfirmMeasurePanel.tsx`, `MgmtTasksPage.tsx`, `TeacherAssignPanel.tsx`, `cases.ts` / `measures.ts` (lưu ID người), `schema.sql`/`migrate.ts` | M–L | Opus 5 · High (B: Fable 5.1 · High) |
| **PR-S3** · Chữ, trạng thái rỗng, hạn | S7, S9, RB-2 (`<Han>` toàn web), RB-4, DS16 (script quét chữ, nếu duyệt), chữ chờ duyệt (4.10), DOC-1…DOC-6 | gần mọi file JSX, `ui/chu.ts`, `TU_DIEN_VA_CHU.md`, `plan.md`, `BAN_DO_OVERHAUL.md`, `LUAT_CHO_CHOT.md`, `policy.ts` chú thích | L | Fable 5.1 · High (B: Sonnet 5 · High) |
| **PR-Z2c** · Deploy | Z2c-1…Z2c-6 | không đổi nghiệp vụ; chỉ gộp truy vấn trang chậm | M | Opus 5 · XHigh (B: Fable 5.1 · High); rà soát bằng model khác |

### 5.2. Ma trận chồng file (✖ = cùng sửa, phải chạy tuần tự; · = không chung)

| File \ PR | O | AN | S1 | S2 | Qa | YT2 | Qb | Pa | Pb | Ra | Rc | Form | S3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `App.tsx` | ✖ | · | · | · | · | · | · | · | · | · | · | · | ✖ |
| `routes/index.ts` | ✖ nav | ✖ auth | ✖ nhỏ | ✖ nhỏ | · | ✖ nhỏ | ✖ notif | ✖ nhỏ | ✖ nhỏ | ✖ nhỏ | ✖ nhỏ | ✖ nhỏ | · |
| `schema.sql` / `migrate.ts` | · | · | ✖ | ✖ | · | · | · | · | · | ✖ | · | ✖ | · |
| `OverviewPage.tsx` | ✖ | · | · | · | · | · | · | ✖ | · | · | · | · | ✖ |
| `BranchPulse.tsx` / `branchpulse.ts` | ✖ (1 dòng) | · | ✖ (.ts) | · | · | · | · | ✖ | · | · | · | · | ✖ |
| `WorkList.tsx` / `mywork.ts` | · | · | · | · | · | · | · | ✖ | · | ✖ | · | · | ✖ |
| `StudentsPage.tsx` | · | · | · | · | ✖ | · | ✖ (R8a) | · | · | · | · | · | ✖ |
| `ClassOverviewPage.tsx` | · | · | · | · | ✖ | · | ✖ (1 nút) | · | · | · | · | · | ✖ |
| `ClassRoster.tsx` | · | · | · | · | ✖ | · | ✖ | · | · | · | · | · | ✖ |
| `ClassYThucCard.tsx` | · | · | · | · | ✖ (di chuyển) | ✖ | · | · | · | · | · | · | ✖ |
| `StudentDetailPage.tsx` / `JourneyTimeline.tsx` | · | · | · | · | · | · | ✖ | · | · | · | · | · | ✖ |
| `web/src/modules/yThuc/*` (khác) | · | · | · | · | · | ✖ | · | · | ✖ (YThucAnalysisView) | · | · | ✖ (ConfirmMeasurePanel) | ✖ |
| `CasePanel.tsx` / `SkillBoard.tsx` | · | · | · | ✖ | · | · | · | · | · | · | · | ✖ | ✖ |
| `QuickReport.tsx` | · | · | · | · | · | · | · | · | · | · | · | ✖ | ✖ |
| `cases.ts` | · | ✖ (1 hàm) | · | ✖ | · | · | · | · | · | · | · | ✖ | · |
| `effectiveness.ts` | · | · | ✖ | · | · | · | · | · | ✖ | · | · | · | · |
| `CaseBoardPage.tsx` / `IssueAnalysis.tsx` | ✖ (redirect/tab) | · | · | · | · | · | · | · | ✖ | · | · | · | ✖ |
| `MgmtTasksPage.tsx` / `MeetingPage.tsx` | ✖ (bọc tab) | · | · | · | · | · | · | · | · | ✖ | · | ✖ (picker) | ✖ |
| `Mock*` / `RegularSheetPage` / `attempts.ts` / `permissions.ts` | · | · | ✖ (absence cạnh attempts) | · | · | · | · | · | · | · | ✖ | · | ✖ |
| `measures.ts` / `profile.ts` | · | · | · | · | · | ✖ | · | · | · | · | · | ✖ | · |

`routes/index.ts` và `schema.sql`/`migrate.ts` là file "chỉ thêm khối": xung đột gỡ được bằng giữ cả hai, nhưng hai PR có migrate **không** nên merge cùng lúc — merge xong một cái, cái sau rebase và chạy lại `npm run migrate` lặp.

### 5.3. Thứ tự chạy (đợt song song)

```
Đợt 1 (song song):  PR-O  ·  PR-AN  ·  PR-S1
Đợt 2 (sau O):      PR-Qa ·  PR-Pa  ·  PR-Rc  ·  PR-S2 (sau S1 vì cùng migrate)
Đợt 3:              PR-YT2 (sau Qa)  ·  PR-Qb (sau Qa)  ·  PR-Pb (sau S1)  ·  PR-Ra (sau Pa, cùng WorkList)
Đợt 4:              PR-Form (sau S2, YT2, Ra — cùng CasePanel/ConfirmMeasurePanel/MgmtTasksPage)
Đợt 5:              PR-S3 (chữ, cuối cùng — chạm gần mọi JSX)
Đợt 6:              PR-Z2c (deploy)
```

Giữ tinh thần §23.4 (O trước, hồ sơ lớp/HV sớm vì GV dùng hằng ngày, chữ cuối). Không bao giờ chạy hai PR cùng sửa một file ✖ ở ma trận. Mỗi PR có "KIỂM" bấm thử ba vai như §22; PR-Pb, PR-Ra, PR-Rc, PR-S1, PR-S2 dùng `requesting-code-review` (logic/dữ liệu). Mỗi PR cần một kế hoạch chi tiết kiểu `docs/superpowers/plans/` do session planning viết trước (theo `PROMPT_SESSION_CODE.md` "Sau deploy").

Ước lượng tổng: ~13 PR trước Z2c; khoảng 4 cỡ L, 7 cỡ M–L, 2 cỡ S–M.

---

## 6. Việc chủ sản phẩm đã hoãn — xác nhận "làm hết" có gồm không

| Khối | Nội dung | Lý do hoãn gốc | Nguồn | Đề xuất |
|---|---|---|---|---|
| **Design plan §6 + góc nhìn `Giáo viên` của §18.3** | Bảng GV cho QL (GV · lớp/môn · HV phụ trách · có kết quả gần nhất · HV dưới kỳ vọng · vấn đề phổ biến · case thiếu PA · cập nhật đúng hạn · PA có kết quả); hồ sơ chuyên môn `Giảng dạy / Case phụ trách / Phương án thực hiện` | "Tính năng mới hoàn toàn, quy mô bằng 2 PR. Cần D02 áp ở API, tìm kiếm, drill-down và xuất dữ liệu (không chỉ ẩn menu), và cần hai chỉ số `dung-han-cap-nhat` + `do-phu-danh-gia`. Không chặn việc hằng ngày của GV" (§3 21/09, §22.10, BAN_DO §10). Hai chỉ số nay **đã có** (PR-N); `BranchPulse.tsx:60-66, 194` có mầm "Theo giáo viên" | plan §22.10 | Hỏi lại. Nếu làm: +2 PR (Opus 5 · XHigh), sau PR-Pb. Đề xuất **vẫn hoãn** — nhạy cảm (xếp hạng GV), cần dữ liệu thật mới có nghĩa |
| **Design plan §11 — I01–I26** kho ý tưởng sản phẩm | Nhãn "Đề xuất, chưa duyệt" | Chưa duyệt | design §11 · §22.10 | Không làm trừ khi duyệt từng mục |
| **plan.md §20 — DS01–DS18** ý tưởng thiết kế | DS01 bản tin thứ Hai · DS02 đếm ngược ô `-` · DS03 hoàn tác 10 s · DS04 hộp "Cách đọc" · DS05 quy ước URL (**trùng R7 — đã vào PR-Qb**) · DS06 thẻ "Việc tiếp theo" (**đã làm ở PR-HV**) · DS07 cảnh báo trùng case trước khi lưu · DS08 nhãn "hỗ trợ đồng thời" (**trùng P9b**) · DS09 trung tâm chất lượng dữ liệu · DS10 tóm tắt bàn giao · DS11 lưu chế độ xem · DS12 chế độ họp tuần · DS13 thư viện PA · DS14 skeleton · DS15 script tương phản · DS16 script quét chữ · DS17 ảnh trước/sau · DS18 trang demo component (**đã có** `/dev/thanh-phan`) | "Không mục nào được code khi chưa có dòng ở mục 3" | plan §20 | Đề xuất duyệt riêng các mục rẻ có lợi cho vận hành thật: **DS16** (S3), **DS04** (S3), **DS02** (Rc), **DS14** (S3). Còn lại hoãn |
| **§20.1 ba ý tưởng đã loại** | Điểm "chất lượng giáo viên" · risk score HV · Kanban/Gantt mặc định | Đã loại — đừng đề xuất lại | plan §20.1 | Không làm |
| Taxonomy vấn đề §5.2 (triệu chứng/nguyên nhân) | – | Cần tổ chuyên môn | design §5.2 · RB §13-8 | Hoãn (câu hỏi 4.14) |
| C08 trong bảng hoãn §22.10 | – | "Chủ sản phẩm chưa trả lời" | plan §22.10 | ⚰️ — đã đóng 21/09 đêm, nay là R14 |
