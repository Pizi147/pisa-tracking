# BẢN ĐỒ WEB PISA-Tracking theo VAI (đọc mã, chỉ đọc)

Nguồn: `web/src/App.tsx` (router + `nav`), `shared/domain/dieuHuong.ts` (menu/tab), `server/src/platform/nav.ts` (`navOf`), `server/src/seed/data.ts` (`ROLE_PERMISSIONS`), `server/src/permissions.ts` (`can`, `teacherAllows`), `server/src/routes/index.ts` (mọi route `/api/...` nằm ở đây, tiền tố `/api` bỏ qua trong bảng).
Số dòng web có thể lệch ±5 (đọc bằng grep).

## 0. Khoá giải mã vai ↔ quyền (rút từ mã)

| Vai (yêu cầu) | Vai kỹ thuật | Quyền thực (`ROLE_PERMISSIONS`) và ghi chú |
|---|---|---|
| GV môn | `teacher` (không `is_core`) | `attempt.view, score.edit, estimate.edit, schedule.move, case.view, sos.report, sos.edit, case.close, student.view, student.edit, student.add, violation.record, discipline.manage, student.edit_info, test.view, work.view`. `teacherAllows` siết: `score.edit/estimate.edit/sos.edit/case.close(học thuật)` = ĐÚNG kỹ năng mình dạy ở lớp đó; `schedule.move` = chỉ lớp thường, đúng môn; `sos.report/violation.record/attempt.view/student.view` = mọi lớp có phân công. Còn `student.edit/student.add/student.edit_info/discipline.manage` = chỉ lớp mình CHỦ NHIỆM (GV môn KHÔNG có). Không có: `plan.week, class.*, cycle.edit, request.approve, meeting.*, analysis.*, case.approve`. |
| GVCN | `teacher` có phân công `is_core` còn hiệu lực | GV môn + (đủ) `student.edit/add/edit_info`, `discipline.manage`, `case.close` Ý thức, `class.assign_subject` (suy ra, chỉ lớp chủ nhiệm), `duocSuaLichLop` (tuần khai giảng/Progress/Final lớp thường), nhập điểm MT cũ (`lich_su`) mọi ô, xuất Excel MT lớp mình (`xuatMt`). KHÔNG có `class.edit`, `cycle.edit`, `plan.week`, `request.approve`. |
| GV S chéo | `teacher` kỹ năng Speaking, không/ít phân công | `navOf.gvS`: có `lopFtChoGvSpeaking` → vẫn có Test + Công việc. Chấm S chéo lớp FT cùng chi nhánh (`editableSkills` nhánh `laGvSpeakingLop`; `requireXemLuotCham`). `attempt.view` KHÔNG mở rộng cho Case/roster. Không có Học viên & Lớp nếu không có phân công (`student.view` theo phân công). |
| TVV | `consultant` (grant theo chi nhánh) | `attempt.view, case.view, student.view, student.edit_info, student.edit_more, analysis.view, class.create, student.add`. Có Công việc kiểu riêng (`viecTvv`, nhóm Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ) dù không có `work.view`. Không Test. |
| Head tutor | `head_tutor` | CHỈ `tutor.view, tutor.manage`. Menu chỉ còn "Tổng quan"; trang Tutor bị ẩn (`/tutor/*` → `/`). Tổng quan dùng góc nhìn GV (`vai='ht'`). |
| CX | `cx` (grant toàn hệ thống) | Như TVV (cùng danh sách quyền), không có Công việc, không Test. Tổng quan CX "chỉ xem". Có tab Phân công GV (xem). |
| QL | `manager` | `plan.week, schedule.move, attempt.cancel, attempt.skip_skill, deadline.override, attempt.view, case.view, sos.report, sos.edit, case.close, case.approve, class.assign, class.edit, class.create, violation.record, discipline.manage, discipline.stats, student.view, student.edit, student.add, meeting.view, meeting.edit, request.approve, cycle.edit, student.edit_info, test.view, work.view, analysis.view, analysis.view_teacher, tutor.view`. KHÔNG có: `score.edit/override`, `student.edit_more`, `admin.config`, `tutor.manage`. (Vẫn sửa điểm qua nhánh `plan.week` → đường `override`, bắt buộc lý do.) |
| Admin | `office_admin` | `attempt.view, test.view, work.view, plan.week, schedule.move, score.override, case.view, student.view, student.edit_info, analysis.view, analysis.view_teacher`. Công việc chỉ nhóm Chấm điểm (`workChamDiem`). Không `attempt.cancel/skip_skill`, `cycle.edit`, `student.edit`, `student.add`, `class.*`. Sửa lịch lớp thường qua `duocSuaLichLop` (vai `office_admin`). |
| Quản trị hệ thống | `system_admin` | Gần như mọi quyền của QL (trừ `tutor.view` có thêm `tutor.manage`) + `admin.config`; KHÔNG có `score.edit/override`, `estimate.edit`, `student.edit_more`, `discipline.stats` có. Có `admin.config` → `/quan-tri` đủ 6 tab; riêng QTHT bật/tắt "Mở sửa lịch Test", xoá/khôi phục tài khoản, sửa bảng quyền. |

Chú ý: "QT" trong mã/nhận xét = Quản trị (hệ thống) hoặc QL phạm vi toàn hệ thống. Quyền của mỗi người còn nhân với PHẠM VI (grant theo chi nhánh/lớp); bảng dưới ghi vai, không ghi phạm vi.

### `navOf` → ai thấy khu nào (kiểm lại từ `nav.ts` + `HIEN` trong `dieuHuong.ts`)

| Khu / cờ | Điều kiện | Vai thấy |
|---|---|---|
| Tổng quan (`overview`) | luôn true | tất cả 9 vai |
| Học viên & Lớp (`students`) | có phạm vi `student.view` | GV môn, GVCN, TVV, CX, QL, Admin, QTHT (GV S chéo chỉ khi có phân công lớp; Head tutor: không) |
| Test (`test`) | `attempt.view` && `test.view` (hoặc GV S) | GV môn, GVCN, GV S chéo, QL, Admin, QTHT |
| Công việc (`work`) | (`work.view` && (attempt \|\| board \|\| meeting)) \|\| `viecTvv` | GV môn, GVCN, GV S chéo, QL, Admin (chỉ Chấm điểm), QTHT, TVV (chỉ việc TVV) |
| Phân tích (`analysis`) | `analysis.view` | TVV, CX, QL, Admin, QTHT |
| Tutor (`tutor`) | `tutor.view` | **Ẩn khỏi menu mọi vai** (AN-TUTOR; `KHU_VUC` không có mục tutor; route `/tutor/*` → `/`) |
| Quản trị (`admin` / `bangQuyDoi`) | `admin.config` / `xemDuocBangQuyDoi` | Link ở menu Tài khoản (Header): QTHT thấy "Quản trị hệ thống"; QL (không `admin`) thấy "Bảng quy đổi band" → `/quan-tri?tab=band` |
| `workApprove` | `work.view` && `request.approve` | QL, QTHT |
| `workOps` (tab Vận hành) | `work.view` && `canSeeBoard` (`meeting.edit` hoặc `admin.config`) | QL, QTHT |
| `workReports` (Báo cáo đơn vị) | `work.view` && `meeting.view` | QL, QTHT |
| `workRequests` (Yêu cầu của tôi) | support && !chamDiem; web ẩn nếu `workApprove` | GV môn, GVCN, GV S chéo, TVV (QL/QTHT tự duyệt trong hộp, Admin không có) |
| `testPlan` (Kế hoạch Test sửa) | test && `plan.week` | QL, Admin, QTHT |
| `testPlanXem` (Kế hoạch Test chỉ xem) | test && (plan \|\| GV có phân công \|\| GV S) | + GV môn, GVCN, GV S |
| `xuatMt` (Xuất Excel Test) | `phamViXuatMt` | QL, QTHT, Admin (grant có attempt.view+test.view), GVCN (lớp mình); GV môn không |
| `phanTichGv` | `analysis.view_teacher` | QL, Admin, QTHT (TVV, CX không) |
| `hvCuaToi` | consultant && !vai quản lý | TVV |


Viết tắt vai trong bảng: **GVm** = GV môn · **GVCN** · **GVS** = GV S chéo · **TVV** · **HT** = Head tutor · **CX** · **QL** · **AD** = Admin (office_admin) · **QT** = Quản trị hệ thống. "QL+QT" = cả hai. "GV*" = GVm + GVCN + GVS (khi không phân biệt).

---

## BẢNG 1 — TRANG (đường dẫn · tên menu · vai thấy · tab con)

Router `web/src/App.tsx:350-375`; menu `KHU_VUC` (`shared/domain/dieuHuong.ts:50-57`) lọc theo `HIEN` (dòng 60-68). Chưa đăng nhập → `WelcomePage` (App.tsx:339). Link cũ → `duongMoi` (dieuHuong.ts) chuyển hướng.

| # | Đường dẫn | Tên trên menu | Vai thấy (web) | Tab / khu con |
|---|---|---|---|---|
| 0 | (chưa đăng nhập) | — | khách | `WelcomePage`: Đăng nhập · Đăng ký · "Vào nhanh bằng tài khoản demo" (bản demo) |
| 1 | `/` | **Tổng quan** | tất cả 9 vai (`overview` luôn true). Nội dung đổi theo `nav`: TVV `TongQuanTvvV5` · GV*/HT `TongQuanGvV5`+`HaiKhoiGv` · AD `TongQuanAdminV5`+MockTestAdmin+LichSapToi · CX `TongQuanCxV5` (chỉ xem) · QL(1 chi nhánh) `TongQuanQlV5` · QT/QL toàn hệ thống `TongQuanQtV5`. (`OverviewPage.tsx:32-66`) | Không tab. Công tắc Fast Track / Lớp thường + ô chi nhánh (QL, QT, CX). Panel: Chờ duyệt (QL+QT), GV chấm quá hạn (`PanelGvTre`), Lớp cần chú ý, Lịch sắp tới |
| 2 | `/phan-tich` | **Phân tích** | TVV, CX, QL, AD, QT (`nav.analysis`; không đủ → về `/`) | Tab ở `?goc=`: Báo cáo HV · Phân tích GV (chỉ `phanTichGv`: QL, AD, QT) · KQ Thi thật · Test + SOS · Hiệu quả PA · Ý thức (chỉ `discipline.stats`: QL, QT). Đầu trang: ô chi nhánh; hàng lọc: Chương trình · Khoảng thời gian · Lớp |
| 3 | `/hoc-vien` | **Học viên & Lớp** | GVm, GVCN, TVV, CX, QL, AD, QT (`nav.students`); GVS chỉ khi có phân công lớp | Tab `HangTab`: Tất cả · Đang SOS (ẩn với AD) · Lịch thi · Phân công GV (QL, QT, CX). Công tắc Fast Track / Lớp thường; ô "Xem" (phạm vi: Lớp tôi dạy · HV của tôi · chi nhánh…) |
| 4 | `/hoc-vien/lop/:classId` | (trong Học viên & Lớp) | cùng nhóm `/hoc-vien` (theo phạm vi lớp) | Tab: Tổng kết (chỉ lớp đã kết thúc, mặc định) · Học viên (cách xem Tổng hợp · Kết quả đầu ra · Thông tin lớp) · Ý thức & Phối hợp (Vi phạm / Phối hợp SOS) · Phân tích lớp · Báo cáo PH (chương trình có mẫu). Trang con `?xem=cuoi-khoa` (Cuối khoá, lớp thường) |
| 5 | `/hoc-vien/luu-tru` | "Lưu trữ n" (⋯ Thao tác trang) | như #3, KHÔNG có với TVV/CX (menu ẩn mục) | Lớp đã kết thúc · Học viên đã lưu trữ |
| 6 | `/hoc-vien/:id` | (trong Học viên & Lớp) | như #3 | Tab: Học thuật · Ý thức & Phối hợp · Lộ trình & lớp (`HO_SO_TAB_LABEL`) |
| 7 | `/hoc-thuat/case/:id` | (không menu; link từ thông báo / Việc cần làm) | ai xem được Case (`case.view` + phạm vi): GV*, TVV, CX, QL, AD, QT | — (một Case, `CaseRoutePage` → `ThanCase`) |
| 8 | `/test` → `/test/lich` | **Test** | GVm, GVCN, GVS, QL, AD, QT (`nav.test`; TVV/CX/HT về `/`) | Lịch Test tuần (`/test/lich`) · Kế hoạch Test (`/test/ke-hoach`: sửa = QL, AD, QT; chỉ xem = GV có phân công/GVS). "Điểm theo lớp" đã bỏ tab (link cũ `/test/diem-lop?lop=` mở panel Nhập điểm lớp). `/test/cham` → `/cong-viec?nhom=cham-diem` |
| 9 | `/nhap-diem/:classId`, `/bang-diem-thuong/:classId` | (chuyển hướng) | `nav.test` | `ChuyenNhapDiemCu` → Lịch Test lọc lớp hoặc panel Nhập điểm lớp |
| 10 | `/mock-test/:id` | (không menu; link) | ai xem được lượt (`attempt.view` / GVS chấm chéo): GV*, TVV, CX, QL, AD, QT | Hồ sơ lượt Mock Test FT (dòng kỹ năng, Case của lượt) |
| 11 | `/luot-test/:id` | (không menu) | như #10 | Hồ sơ lượt lớp thường |
| 12 | `/cong-viec` | **Công việc** (số = việc cần làm ngay) | GVm, GVCN, GVS, QL, AD (chỉ Chấm điểm), QT, TVV (chỉ việc TVV). CX, HT: không | `/cong-viec` = danh sách MỘT trang `HoTroHocVienTab` với hàng tab hạng mục `TAB_CV`: Chấm điểm · Bài thi Speaking (cham-cheo) · Case học thuật · Ý thức & Phối hợp · Vận hành (+ "Chờ bạn duyệt" đầu hàng cho QL, QT; TVV: Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ). Khối cuối: Yêu cầu của tôi (GVm, GVCN, GVS, TVV), Lớp tôi dạy, Đã bỏ qua |
| 13 | `/cong-viec/yeu-cau` | (link "Yêu cầu của tôi") | `workRequests && !workApprove` = GV*, TVV | Yêu cầu 60 ngày (`YeuCauCuaToi`) |
| 14 | `/cong-viec/van-hanh` | (link) | QL, QT (`workOps`) | Bảng Việc quản lý/Vận hành `TasksBoard` (MgmtTasksPage) |
| 15 | `/cong-viec/bao-cao` | (link) | QL, QT (`workReports`) | Báo cáo đơn vị / họp tuần `MeetingBoard` |
| 16 | `/cong-viec/cho-duyet` | — | → `/cong-viec?nhom=duyet` (QL, QT) | hộp "Chờ bạn duyệt" nằm trong #12 (`HopChoDuyet`) |
| 17 | `/quan-tri` | menu Tài khoản › "Quản trị hệ thống" (QT) · "Bảng quy đổi band" (QL) | QT (`nav.admin`) đủ; QL (`bangQuyDoi`) chỉ 2 tab | Tab `?tab=`: Tài khoản · Chương trình · Chi nhánh · Bảng quy đổi · Quyền & nhật ký · Đã xoá. QL chỉ: Bảng quy đổi (đọc) + Đã xoá |
| 18 | `/ho-so-ca-nhan` | menu Tài khoản › "Hồ sơ cá nhân" | mọi vai đăng nhập | Một trang (ngôn ngữ, kỹ năng `ChonKyNang`, …) |
| 19 | `/giao-vien/:id` | menu Tài khoản › "Hồ sơ giáo viên" (vai `teacher`); tên GV là link cho QL/AD/QT | GV chỉ hồ sơ chính mình; QL, AD(`phanTichGv`), QT xem GV trong phạm vi | Một trang: chỉ số, Bài Test trong kỳ, Học viên, Lớp, Việc, Yêu cầu, Sửa kỹ năng (QL/QT) |
| 20 | `/huong-dan` | nút "?" (Hướng dẫn) ở thanh trên, "Chỉ cho tôi" | mọi vai | (ghi 1 dòng — `HuongDanPage`) |
| 21 | `/tutor/*` | (ẩn) | **không ai** — `<Navigate to="/">` (App.tsx:351); `nav.tutor` true cho HT/QL/QT nhưng `KHU_VUC` không có mục. Mã `tutor/*` còn (TutorPage, PanelTutor, HopTutor, TaiDanhSach) + API `/tutors/*` còn sống | — |
| 22 | `/dev/thanh-phan` | — | chỉ `npm run dev` | bỏ qua |
| 23 | `*` | — | — | về `/` |

Phần khung (mọi trang, `App.tsx` + `platform/Header.tsx`): thanh Công cụ demo `DemoBar` (chỉ bản demo) · tìm kiếm (`/`, Ctrl K; nhóm Học viên · Lớp · Giáo viên [nếu `analysis.view_teacher`]) · nút "?" · chuông Thông báo (Cần làm / Để biết, "Đánh dấu đã đọc") · menu Tài khoản (Góc nhìn đổi vai, Phạm vi được cấp, Hồ sơ cá nhân, Hồ sơ giáo viên, Quản trị hệ thống / Bảng quy đổi band, Đăng xuất) · dải "Góc nhìn: …  Về {vai gốc}" · dải Mất kết nối "Thử lại" · hộp hỏi khi rời trang còn nháp.


---

## BẢNG 2 — THAO TÁC (nút / hộp), gom theo trang › khu

Cột "Vai": **web** = ai thấy nút (cờ `nav`/`viewer`/`can()`), **MC** = ai máy chủ cho (quyền + `teacherAllows`). Chỉ ghi "⚠" khi hai bên lệch. Đường API không ghi `/api`. Dòng web là gần đúng (±5). "—" = chỉ điều hướng/đọc.
Quy ước quyền máy chủ rút gọn: `sos.report` = GVm/GVCN (lớp có phân công, mọi môn), QL, QT · `sos.edit` = GV ĐÚNG kỹ năng, GVCN (Ý thức), QL, QT · `student.edit` = GVCN lớp mình, QL, QT · `student.edit_info` = GVCN, TVV, CX, AD, QL, QT · `student.edit_more` = TVV, CX · `class.edit` / `cycle.edit` / `request.approve` = QL, QT · `plan.week` = QL, AD, QT · `discipline.manage` = GVCN lớp, QL, QT · `violation.record` = mọi GV có phân công lớp, QL, QT.

### A. Khung chung (Header, Đăng nhập, Hồ sơ cá nhân, Demo)

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Đăng nhập | form | Đăng nhập | khách | POST `/auth/login` | platform/WelcomePage.tsx:194 |
| Đăng nhập | form | Đăng ký (chờ QT duyệt) | khách | POST `/auth/register` | WelcomePage.tsx:253 |
| Đăng nhập | demo | Vào nhanh bằng tài khoản demo | khách (bản demo) | POST `/demo/session` | lib/session.tsx:114 |
| Header | menu Tài khoản | Đăng xuất | mọi vai | DELETE `/demo/session` | session.tsx:125 |
| Header | menu Tài khoản › Góc nhìn | chọn vai / Về {vai gốc} | người có `coTheDoiGocNhin` (QL, QT, GV kiêm vai) | PUT `/session/goc-nhin` | session.tsx:133; App.tsx dải góc nhìn |
| Header | chuông Thông báo | Đánh dấu đã đọc · bấm 1 thông báo | mọi vai | POST `/notifications/doc-nhieu` · `/doc-het` · `/:id/read` | Header.tsx:315,317,342 |
| Header | ô tìm | tìm học viên / lớp / GV | mọi vai có phạm vi; nhóm GV chỉ có `analysis.view_teacher` (QL, AD, QT) | GET `/tim/giao-vien` (+ tìm HV/lớp) | Header.tsx:141-260 |
| Header | nút ? | Hướng dẫn / Chỉ cho tôi | mọi vai | PATCH `/me/profile` (đánh dấu đã xem) | huongDan/daXemHd.ts:13 |
| Hồ sơ cá nhân | form | Lưu (ngôn ngữ, kỹ năng GV `ChonKyNang`) | mọi vai | PATCH `/me/profile` | platform/ProfilePage.tsx:85,104; lib/ngonNgu.ts:24,38 |
| Mọi trang | dải Mất kết nối | Thử lại | mọi vai | (tải lại phiên) | App.tsx:318 |
| Mọi trang | toast xoá | Hoàn tác (đưa từ Thùng rác về) | người xoá / QL (xem mục L) | POST `/thung-rac/:id/khoi-phuc` | lib/thungRac.ts:13,32 |
| DemoBar | thanh demo | Đổi tài khoản demo · Dùng ngày thật · kịch bản (Lỗi khi tải, Không lưu được…) | bản demo (không phải bản chính) | PUT `/demo/config` | platform/DemoBar.tsx:38,46 |

### B. Tổng quan `/`

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Tổng quan | đầu trang | Công tắc Fast Track / Lớp thường · ô chi nhánh | QL, QT, CX | GET `/tong-quan/v5` | worklist/OverviewPage.tsx:44; TongQuanV5.tsx:161 |
| Tổng quan (QL/QT) | khối Chờ duyệt | bấm 1 thẻ → panel Duyệt (KhungPanel), Mở ›, Yêu cầu tiếp | QL, QT (`workApprove`) · `request.approve` | GET `/yeu-cau?hop=cho-duyet` (duyệt thật: mục I) | TongQuanV5.tsx:198-219 |
| Tổng quan (QL/QT) | GV chấm quá hạn | bấm 1 GV → `PanelGvTre`; "Nhập điểm …" (nhập hộ); Hồ sơ GV; Phân công GV ở hồ sơ lớp › | QL, QT (+ AD qua khối Mock Test) · nhập điểm = quyền điểm (mục F) | GET `/tong-quan/gv-tre`; PUT `/attempts/:id/scores/:skill` | worklist/PanelGvTre.tsx:42-206 |
| Tổng quan (GV*/HT) | Lớp tôi dạy / Kỹ năng tôi dạy / Lớp tôi chủ nhiệm | link sang lớp, "Việc của tôi ›" | GVm, GVCN, GVS, HT (HT không thẻ lớp) | GET `/tong-quan/lop-toi-day/hai-khoi`, `/my-work` | LopToiDay.tsx:175-254; TongQuanV5.tsx:457-472 |
| Tổng quan (TVV) | HV của tôi | các ô số → `/hoc-vien?loc=` | TVV | GET `/tong-quan/tvv`, `/tong-quan/hoc-vien` | TongQuanV5.tsx:488 |
| Tổng quan (AD) | Mock Test + Lịch sắp tới | số → Lịch Test; "Xem toàn bộ lịch ›" | AD | GET `/tong-quan/mock-test`, `/highlights` | MockTestAdmin.tsx:32; Highlights.tsx:81-141 |
| Tổng quan (CX) | chỉ xem | không nút ghi | CX | GET `/tong-quan/v5` | OverviewPage.tsx:62 |

### C. Học viên & Lớp `/hoc-vien`

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Học viên & Lớp | đầu trang | Xuất Excel | mọi vai có trang · `student.view` (+ `case.view` cho cột Case) | POST `/hoc-vien-lop/xuat` | students/NganXuatDs.tsx:85; StudentsPage.tsx:445 |
| Học viên & Lớp | đầu trang (Xuất › Báo cáo PH) | xuất báo cáo PH nhiều lớp | web: người có đợt báo cáo · MC `xuatBaoCaoPhNhieu` (chưa kiểm sâu) | POST `/hoc-vien-lop/xuat-bao-cao-ph` | NganXuatDs.tsx:58,65 |
| Học viên & Lớp | đầu trang | **+ Thêm học viên** (panel IntakePanel: Dán từ Excel, Xem trước, Thêm vào lớp) | web `data.coTheThemHocVien` · MC `student.add` = GVCN (lớp mình), TVV, CX, QL, QT | POST `/intake/parse` · `/intake/preview` · `/intake/commit` | StudentsPage.tsx:444,632; IntakePanel.tsx:110-144 |
| Học viên & Lớp | ⋯ Thao tác trang | **+ Lớp mới** (ClassCreatePanel: Một lớp / Nhiều lớp) | web `coTheTaoLop` · MC `class.create` = QL, QT, TVV, CX. ⚠ "Nhiều lớp" có GV (slots) cần thêm `class.assign` (TVV/CX bị 403) | POST `/classes` · POST `/classes/bulk` | StudentsPage.tsx:428,628; classes/ClassCreatePanel.tsx:120; LuoiTaoLop.tsx:221 |
| Học viên & Lớp | ⋯ Thao tác trang | Lưu trữ (n lớp · m HV) | GVm, GVCN, QL, AD, QT (ẩn với TVV/CX) | — (→ `/hoc-vien/luu-tru`) | StudentsPage.tsx:430 |
| Học viên & Lớp | tab Tất cả | lọc: Thi tháng này · Có việc quá hạn · Đã thi chờ KQ · Bộ lọc thêm · chip vai TVV/CX | theo vai | GET `/hoc-vien-lop`, `/hoc-vien-lop/theo-vai`, `/my-work` | StudentsPage.tsx:471-500 |
| Học viên & Lớp | hàng lớp ⋯ | **Hồ sơ lớp** | mọi vai | — | StudentsPage.tsx:679 |
| Học viên & Lớp | hàng lớp ⋯ | **Nhập điểm** (PanelNhapDiemLop) | web `viewer.coTheNhapDiem` · MC xem mục F | (mở panel; ghi ở F) | StudentsPage.tsx:680,686 |
| Học viên & Lớp | hàng lớp ⋯ | **+ Học viên** (lớp điền sẵn) | web `coTheThemHocVien` · MC `student.add` | POST `/intake/*` | StudentsPage.tsx:681 |
| Học viên & Lớp | hàng lớp (badge) | n bài chờ chấm · chờ duyệt · Xếp lớp · n việc quá hạn | sang Lịch Test (có nav.test) / Công việc (workApprove) / `?viec=chuyen-tiep` (QL) | — | StudentsPage.tsx:660-668 |
| Học viên & Lớp | dòng học viên ⋯ | **+ Case** | web `coTheBaoCase` · MC `sos.report` | POST `/cases/report` (panel QuickReport) | classes/thaoTacDongHocVien.tsx:103; students/DanhSachHvLop.tsx:52 |
| Học viên & Lớp | dòng học viên ⋯ | **+ Ghi vi phạm** | web `coTheGhiViPham` · MC `violation.record` | POST `/violations` · `/violations/nhieu` | thaoTacDongHocVien.tsx:105; yThuc/RecordViolationPanel.tsx:129,136 |
| Học viên & Lớp | dòng học viên ⋯ | **Xác nhận xử lý** (em cần xử lý Ý thức) | web `coTheGhiViPham && xuLyYThuc` · MC `discipline.manage` ⚠ GVm thấy nút nhưng máy chủ chặn (chỉ GVCN/QL/QT) | POST `/students/:id/y-thuc/xu-ly` | thaoTacDongHocVien.tsx:84; yThuc/XacNhanXuLyPanel.tsx:114 |
| Học viên & Lớp | dòng học viên ⋯ | **Nhập điểm {đợt}** | web `coTheNhapDiem` · MC xem mục F | (panel nhập điểm lớp) | thaoTacDongHocVien.tsx:48,113 |
| Học viên & Lớp | dòng học viên ⋯ (sau vạch) | **Sửa thông tin** | web `coTheSuaHocVien` (GVCN, QL, QT) hoặc `coTheSuaThongTin` (TVV, CX, AD) · MC `student.edit` / `student.edit_info` | PATCH `/students/:id` (+ `/cycles/:id`) | thaoTacDongHocVien.tsx:115; students/StudentManagePanel.tsx:384 |
| Học viên & Lớp | dòng học viên ⋯ | **Cuối khoá…** (lớp thường) | QL, QT (`coTheChuyenTiep`) · `class.edit` / `cycle.edit` | — (trang `?xem=cuoi-khoa`) | shared hocVienLop.ts mucMenuDongHocVien |
| Học viên & Lớp | dòng học viên ⋯ | **Chuyển lớp…** (QL, QT) / **Đề xuất chuyển lớp…** (GVCN) | web `coTheChuyenTiep` / `coTheSuaHocVien && !coTheChuyenTiep` · MC `class.edit` + `student.edit`; đề xuất `student.edit` | POST `/students/:id/transfer` · POST `/students/:id/de-xuat-chuyen-lop` | students/ChuyenLopPanel.tsx:226,233 |
| Học viên & Lớp | dòng học viên ⋯ (TVV/CX/AD) | Sửa thông tin · Tạm dừng/ Kết thúc học · Quay lại học · Kết quả thi thật · Mở hồ sơ | TVV, CX: cả 4 (`student.edit_more`); AD: chỉ Sửa thông tin | xem mục E | shared quanLyHocVien.ts:104 |
| Học viên & Lớp | dòng em đã kết thúc ⋯ | **Quay lại học** | QL, QT (`coTheChuyenTiep`) · `cycle.edit` | POST `/students/:id/hoc-lai` | thaoTacDongHocVien.tsx:73-75; StudentManagePanel.tsx:194 |
| Học viên & Lớp | tab Đang SOS | bấm hàng → Panel một em (PanelMotEm): Mở, Chọn bước tiếp, Gia hạn, Nhập kết quả, Xem thêm › | ẩn với AD · MC `student.view` + `case.view` | GET `/hoc-vien-lop/em/:id`; ghi qua PanelViec | students/PanelMotEm.tsx |
| Học viên & Lớp | tab Lịch thi | sửa ngày thi dự kiến · Ghi chú · Việc tiếp | GVCN, TVV, CX, AD, QL, QT · MC `student.edit` hoặc `student.edit_info` | PUT `/hoc-vien-lop/lich-thi/:cycleId` | students/GocLichThi.tsx:152 |
| Học viên & Lớp | tab Phân công GV | sửa ô GV từng lớp · **Lưu** (HopLuuPhanCong: Lưu mốc mới / Đổi mốc…) · Hoàn tác · Huỷ sửa | web QL, QT, CX (`coGocPc`) ⚠ CX chỉ XEM · MC `class.assign` = QL, QT | POST `/phan-cong/xem-truoc` · `/phan-cong/luu` · `/phan-cong/hoan-tac` · `/phan-cong/cho/doi-moc` · `/phan-cong/cho/huy` | students/GocPhanCongGv.tsx:164,385; classes/HopLuuPhanCong.tsx:73,142,178,298,299 |

### D. Hồ sơ lớp `/hoc-vien/lop/:classId`

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Hồ sơ lớp | đầu trang | **Nhập điểm** (panel) | web `viewer.canEnterScores` (GV đúng môn, GVCN, QL, AD, QT) · MC xem mục F | (panel; ghi ở F) | classes/DauTrangLop.tsx:247 |
| Hồ sơ lớp | đầu trang | **+ Case** (QuickReport) | web `canReportCase` · MC `sos.report` | POST `/cases/report` | DauTrangLop.tsx:249; ClassOverviewPage.tsx:237 |
| Hồ sơ lớp | ⋯ › Lớp | **Thông tin lớp** (panel: số lớp / chương trình / lộ trình; tuần khai giảng / Progress / Final; phân công GV) | web `canEditProgress ‖ canEditSchedule ‖ canAssign ‖ canAssignSubject`, mỗi phần gate riêng · MC `class.edit` (thông tin) / `duocSuaLichLop` = QL, QT, AD, GVCN lớp thường (tuần) / `class.assign` hoặc `class.assign_subject` (phân công) | PATCH `/classes/:id/thong-tin` · PATCH `/classes/:id/progress` · PUT `/classes/:id/teachers` | classes/ThongTinLopPanel.tsx:137,147; ClassProgressPanel.tsx:92; congViec/PanelViec.tsx:370 |
| Hồ sơ lớp | panel phân công | Lưu / Đổi mốc… / Hoàn tác | QL, QT; GVCN (GV bộ môn lớp mình) | POST `/phan-cong/*` | classes/TeacherAssignPanel.tsx:147; HopLuuPhanCong.tsx |
| Hồ sơ lớp | ⋯ › Lớp | **Sửa thông tin học viên** (cả lớp, SuaCaLopPanel) | web `coTheSuaCaLop` · MC `duocSuaCaLop` (GVCN, QL, TVV, CX) | POST `/classes/:id/sua-ca-lop/xem-truoc` · POST `/classes/:id/sua-ca-lop` | students/SuaCaLopPanel.tsx:132,166 |
| Hồ sơ lớp | ⋯ › Lớp | **+ Học viên** (IntakePanel) | web `canAddStudents` · MC `student.add` | POST `/intake/*` | ClassOverviewPage.tsx:235 |
| Hồ sơ lớp | ⋯ › Cuối khoá | **Cuối khoá…** (lớp thường, không liên tục) | web `coTheChuyenTiep ‖ coTheSuaHocVien` · MC `class.edit` / `cycle.edit` | (trang Cuối khoá, mục D-bis) | shared hocVienLop.ts:708 |
| Hồ sơ lớp | ⋯ | **Kết thúc lớp** | QL, QT (`coTheKetThucLop`, lớp hết HV đang học) · `class.edit` | POST `/classes/:id/ket-thuc` | classes/XoaKetThucLopPanel.tsx:87,146 |
| Hồ sơ lớp | ⋯ | **Mở lại lớp** (lớp đã kết thúc) | QL, QT · `class.edit` | POST `/classes/:id/mo-lai` | XoaKetThucLopPanel.tsx:95,142; DauTrangLop.tsx:112 |
| Hồ sơ lớp | ⋯ | **Xoá lớp** (lớp trống, gõ lại mã lớp) | QL, QT · `class.edit` (⚠ chú thích cũ trong mã còn ghi "chỉ Quản trị"; thực tế OV-12a cho QL) | POST `/classes/:id/xoa` | XoaKetThucLopPanel.tsx:37 |
| Hồ sơ lớp | ⋯ › Công cụ | **Xuất Excel** (kết quả Test của lớp) | web `nav.xuatMt && (isCoreTeacher ‖ canPlanWeek)` = GVCN, QL, AD, QT · MC `phamViXuatMt` | POST `/xuat-mt` | DauTrangLop.tsx:178; test/NganXuatMt.tsx:120 |
| Hồ sơ lớp | ⋯ › Công cụ | **Lịch sử** · Lịch sử góp ý tuần (nếu có) | mọi vai xem được lớp | GET `/lich-su`, `/classes/:id/gop-y` | DauTrangLop.tsx:187 |
| Hồ sơ lớp | dải trạng thái | badge Thiếu GV → Phân công · Xếp lớp → Chuyển tiếp · chờ duyệt · thiếu thông tin · Bàn giao · Cuối khoá › | theo cờ viewer / `workApprove` | — | DauTrangLop.tsx:155-166,288 |
| Hồ sơ lớp | dải Bàn giao | **Bàn giao** (phiếu GVCN lớp nguồn: Ghi bàn giao · Giữ và lưu · Điền thay · Xác nhận) | GVCN lớp nguồn, GV bộ môn đúng môn, QL làm thay · MC `quyenBanGiao` | PUT `/lenh-chuyen/:id/nhan-xet-nhap` · POST `/lenh-chuyen/:id/xac-nhan` · PUT `/lenh-chuyen/:id/ban-giao` · PUT `/lenh-chuyen/:id/ban-giao-mon` | classes/BanGiaoPanel.tsx:110,128,142,151,324,353 |
| Hồ sơ lớp | dải Bàn giao GV | **Bàn giao GV** (góp ý / nhận xét chung / xác nhận) | GV nguồn / đích, GVCN, QL | PUT `/ban-giao-gv/:id/gop-y` · `/nhan-xet` · POST `/ban-giao-gv/:id/xac-nhan` | classes/BanGiaoGvPanel.tsx:74,91,135 |
| Hồ sơ lớp | dải Xét lại | **Xét lại** lộ trình (Tiếp tục / Tạm dừng / Kết thúc học · Hoàn tác · nhận xét) | web `coTheChuyenTiep ‖ isCoreTeacher` · MC `class.edit` (QL, QT); GVCN chỉ ghi nhận xét | POST `/classes/:id/xet-lai` · `/xet-lai/hoan-tac` · PUT `/classes/:id/xet-lai/:sid/nhan-xet` | classes/PanelXetLai.tsx:120,157,424 |
| Hồ sơ lớp | tab Học viên › Tổng hợp | **Chọn nhiều học viên** → Lưu trữ · Kết thúc học · Huỷ chuyển lớp · Chuyển lớp… (xem trước + xác nhận) | web `canPlanWeek && can(cycle.edit)` = QL, QT · MC từng việc (`class.edit` / `cycle.edit`) | POST `/hang-loat-hoc-vien/xem-truoc` · POST `/hang-loat-hoc-vien` · (mỗi em) POST `/students/:id/transfer` | classes/TabHocVienLop.tsx:68,109-119; students/hangLoatEm.ts:17; ChuyenLopPanel.tsx:431 |
| Hồ sơ lớp | tab Học viên › mở rộng em | **+ Case** (kỹ năng), Hồ sơ HV ›, Xem chi tiết (panel Case) | web `coTheBaoCase` · `sos.report` | POST `/cases/report` | classes/BangHoSoLop.tsx:424; BangDiemLopThuong.tsx:324 |
| Hồ sơ lớp | tab Học viên › dòng em ⋯ | cùng menu dòng như mục C | như mục C | như mục C | BangHoSoLop.tsx:107; BangDiemLopThuong.tsx:85 |
| Hồ sơ lớp | khối Điểm Test của lớp (cuối trang) | xem điểm theo lượt | web `coTheXemDiem` · `requireXemLuotCham` | GET `/classes/:id/diem-theo-luot` | ClassOverviewPage.tsx:206 |

#### D-ter. Hồ sơ lớp › tab Ý thức & Phối hợp / Báo cáo PH / Cuối khoá

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Hồ sơ lớp › Ý thức | Vi phạm | **+ Ghi vi phạm** (RecordViolationPanel: Ngày, Môn, Nhóm, Vi phạm, Mô tả, + Thêm vi phạm, Xoá dòng, Xong) | web `d.canRecord` · MC `violation.record` | POST `/violations` · `/violations/nhieu` | yThuc/ClassYThucCard.tsx:368; RecordViolationPanel.tsx:129,136 |
| Hồ sơ lớp › Ý thức | Vi phạm | **Đã xem vi phạm này / Bỏ xem / Hoàn tác / Xem lại** (từng em hoặc lô) | web GVCN, QL, QT · MC `discipline.manage` | POST `/students/:id/y-thuc/ghi-nhan` · `/bo-ghi-nhan`; lô POST `/classes/:id/y-thuc/lo/ghi-nhan` | ClassYThucCard.tsx:153,165,178,223,297,298,361 |
| Hồ sơ lớp › Ý thức | Cần làm | **Xác nhận xử lý** (lô) · **Khai / sửa cấp bậc** (lô KhaiBacLoPanel) · Hoàn tác | GVCN lớp, QL, QT · `discipline.manage` | POST `/classes/:id/y-thuc/lo/xu-ly` · `/lo/cap-bac` · `/lo/cap-bac/hoan-tac` | yThuc/LoYThucPanel.tsx:119; KhaiBacLoPanel.tsx:99,122 |
| Hồ sơ lớp › Ý thức | Lịch sử | bấm 1 vi phạm → **Sửa** · **Xoá** (ChiTietViPham); biện pháp: Sửa · Đã thực hiện… · Chưa thực hiện · Thu hồi (XemXuLyPanel) | Sửa/Xoá: người ghi (còn `violation.record`), GVCN, QL, QT · MC `canEditViolation`; biện pháp: `discipline.manage` | PATCH/DELETE `/violations/:id` · PATCH `/discipline-measures/:id` · `/discipline-measures/:id/vi-pham` · POST `/discipline-measures/:id/thu-hoi` · POST `/y-thuc/xu-ly/:id/chua-thuc-hien` · `/da-thuc-hien` | yThuc/ChiTietViPham.tsx:103-110; XemXuLyPanel.tsx:77-124; DaThucHienPanel.tsx:52; DeleteViolationConfirm.tsx:11 |
| Hồ sơ lớp › Ý thức | Phối hợp SOS | **+ Thêm việc** · **Xác nhận** · **Bỏ việc…** · **Đưa lại Cần xử lý / Khôi phục** · sửa hạn | GVCN lớp, QL, QT (GVm chỉ đọc) · MC `discipline.manage` | POST `/attempts/:id/phoi-hop-sos` · `/phoi-hop-sos/:id/confirm` · `/remove` · `/mo-lai` · `/han` | yThuc/PhoiHopSosSection.tsx:213,228,300,362,366,408 |
| Hồ sơ lớp › Phân tích lớp | xem | không nút ghi | mọi vai xem lớp · `attempt.view` | GET `/classes/:id/phan-tich-lop` | classes/PhanTichLopTab.tsx |
| Hồ sơ lớp › Báo cáo PH | từng em | **Viết / Viết hộ** (Em trước / Em sau / Lưu) · Không báo cáo đợt này / Khôi phục · Về điểm gốc | web `coBaoCaoPh` · MC `luuBaoCaoPh` (kiểm theo lớp; chưa kiểm sâu) | PUT `/classes/:id/bao-cao-ph` | classes/TabBaoCaoPh.tsx:343 |
| Hồ sơ lớp › Báo cáo PH | đợt | **+ Đợt báo cáo / Xoá đợt** (HopDotBaoCaoPh) | QL, QT (cấu hình đợt) | POST `/bao-cao-ph/dot` | classes/HopDotBaoCaoPh.tsx:19 |
| Hồ sơ lớp › Báo cáo PH | đầu tab | **Xuất** | như trên | GET `/classes/:id/bao-cao-ph/xuat` | TabBaoCaoPh.tsx; classes/xuatPdfBaoCaoPh.ts |
| Hồ sơ lớp › Tổng kết | lớp đã kết thúc | xem | mọi vai xem lớp | GET `/classes/:id/tong-ket` | classes/TabTongKetLop.tsx |
| Cuối khoá (`?xem=cuoi-khoa`) | bảng Hướng | **Lưu nháp** hướng từng em · Bỏ chọn · Bỏ sửa | QL, QT (`coTheChuyenTiep`); GVCN gợi ý / ghi chú · MC `cycle.edit` | PUT `/classes/:id/lo-trinh-nhap` · DELETE `/classes/:id/lo-trinh-nhap/:studentId` | classes/CuoiKhoaLop.tsx:271,275 |
| Cuối khoá | Kỳ vọng đầu ra | đánh dấu Đạt / Không đạt kỳ vọng | QL, QT (`request.approve`) | PUT `/classes/:id/ky-vong` | CuoiKhoaLop.tsx:257 |
| Cuối khoá | Kết quả đầu ra | nhận xét / đánh giá đầu ra từng em | QL, QT (`class.edit`) | PUT `/classes/:id/danh-gia-dau-ra/:studentId` | CuoiKhoaLop.tsx:300 |
| Cuối khoá | Chuyển lớp cả lớp (Lớp chuyển đến · Tuần · "+ Mở lớp mới…") | **Xác nhận** quyết định · **Huỷ quyết định** | QL, QT · `class.edit` | POST `/classes/:id/transition` · POST `/lenh-chuyen/:id/huy` | CuoiKhoaLop.tsx:250,748; chuyenLopChung.tsx:20 |

### E. Hồ sơ học viên `/hoc-vien/:id` và Lưu trữ `/hoc-vien/luu-tru`

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Hồ sơ HV | đầu trang | **+ Case** | web `viewer.canReport` · MC `sos.report` (GVm, GVCN, QL, QT; TVV/CX/AD KHÔNG có) | POST `/cases/report` | students/StudentDetailPage.tsx:273,445 |
| Hồ sơ HV | đầu trang | **Gia hạn** (HopGiaHan: Hạn mới · Bỏ gia hạn · Lưu) | web `sauThi.coTheGiaHan` · MC `coTheGiaHanSauThi` = QL, QT, TVV (chi nhánh em) | PUT `/cycles/:id/han-sau-thi` | StudentDetailPage.tsx:265; students/HopGiaHan.tsx:35 |
| Hồ sơ HV | đầu trang | **Quay lại học** (em Tạm dừng; nút chính) | web `quyen.quayLai` · MC `student.edit_more` hoặc `student.edit`: TVV, CX, GVCN, QL, QT | POST `/students/:id/quay-lai` · `/hoan-tac-quay-lai` | StudentDetailPage.tsx:284; students/QuayLaiHoc.tsx:40,43,81 |
| Hồ sơ HV | ⋮ | **Sửa thông tin** (StudentManagePanel: họ tên, ngày sinh, email, TVV, dự kiến thi, điểm đầu vào, Target + lý do, môn học; Lưu · em tiếp ›) | web `canEdit ‖ coTheSuaThongTin` · MC `student.edit` (GVCN, QL, QT) hoặc `student.edit_info` (TVV, CX, AD; ghi chú / Target: `edit_more`; Target QL, QT: `cycle.edit`) | PATCH `/students/:id` · PATCH `/cycles/:id` · POST `/cycles/:id/target-revision` · POST `/cycles/:id/mon-dang-ky` | students/StudentManagePanel.tsx:327,384,394,400,405,418 |
| Hồ sơ HV | ⋮ | **Đề xuất sửa thông tin…** (GV lớp em đang học, không có `cycle.edit`) | web `viewer.coTheDeXuatSua` (GVm, GVCN) · MC `guiDeXuatSua` (`laGvLopDangHoc`) | POST `/students/:id/de-xuat-sua` (sửa thẻ: PUT `/yeu-cau/:id`) | StudentManagePanel.tsx:401; duyet/DeXuatSuaPanel.tsx:62,63 |
| Hồ sơ HV | ⋮ | **Chuyển lớp…** (QL, QT) / **Đề xuất chuyển lớp…** (GVCN) | web `lopHoc.quyen.chuyenLop` / `deXuatChuyenLop` · MC `class.edit` + `student.edit` / `student.edit` | POST `/students/:id/transfer` · POST `/students/:id/de-xuat-chuyen-lop` · POST `/lenh-chuyen/:id/huy` | students/ChuyenLopPanel.tsx:223-242 |
| Hồ sơ HV | ⋮ | **Tạm dừng/ Kết thúc học** (HopTamDungKetThuc; một hoặc nhiều em) | web `lopHoc.quyen.tamDung/ketThuc` · MC `student.edit_more` hoặc `student.edit` = TVV, CX, GVCN, QL, QT (AD không) | POST `/hang-loat-hoc-vien/xem-truoc` · POST `/students/:id/status` · POST `/students/:id/hoan-tac-tam-dung` | students/HopTamDungKetThuc.tsx:68,90,106 |
| Hồ sơ HV | ⋮ | **Cuối khoá…** (lớp thường; Lộ trình tiếp theo) | web `quyen.ghiLoTrinhTiep` · MC `cycle.edit` (QL, QT) | PUT `/classes/:id/lo-trinh-nhap` (qua trang Cuối khoá) | shared quanLyHocVien.ts:81 |
| Hồ sơ HV | ⋮ | **Lộ trình** (FT: đổi lộ trình, Sang lớp mới / Về lớp cũ, Hoàn tác) | web `canEdit && cycle && !ratio` = GVCN, QL, QT · MC `duocDoiMon` = `student.edit` hoặc `student.edit_more` = GVCN, QL, QT, TVV, CX. ⚠ TVV, CX được máy chủ nhưng web không hiện mục | POST `/cycles/:id/lo-trinh` · `/cycles/:id/lo-trinh/hoan-tac` | StudentManagePanel.tsx:411,426 |
| Hồ sơ HV | ⋮ | **Kết quả thi thật** (Ngày thi, L R W S, Gia hạn, Lịch sử) | web `canEdit ‖ suaThem (‖ coTheNhapThiThat nếu đã Lưu trữ)` · MC `coTheNhapThiThat` = `student.edit` / `cycle.edit` / `student.edit_more`, + GVCN lớp cuối | PUT `/cycles/:id/outcome` · POST `/cycles/:id/thi-that/khoi-phuc` | students/KetQuaThiThatPanel.tsx:102; PanelBuocTiep.tsx:41 |
| Hồ sơ HV | ⋮ | **Quay lại học** (em Tạm dừng hoặc đã kết thúc) | TVV, CX (Tạm dừng); QL, QT (đã kết thúc, `hocLai`) · MC khớp | POST `/students/:id/quay-lai` · POST `/students/:id/hoc-lai` | StudentManagePanel.tsx:194; QuayLaiHoc.tsx:40 |
| Hồ sơ HV | ⋮ | **Lịch sử** (lịch sử sửa thông tin) | ai sửa được thông tin | GET `/students/:id/lich-su-sua` | shared quanLyHocVien.ts:91 |
| Hồ sơ HV | ⋮ (cuối, vạch đỏ) | **Xoá học viên** (gõ chữ xác nhận; vào Thùng rác 30 ngày) | web `viewer.coTheXoa` = `cycle.edit` · MC `cycle.edit` = QL, QT. ⚠ chú thích cũ trong `quanLyHocVien.ts` còn ghi "chỉ Quản trị" | POST `/students/:id/xoa` | students/XoaHocVienPanel.tsx:43 |
| Hồ sơ HV | dải Chờ duyệt | n yêu cầu chờ bạn duyệt → duyệt tại chỗ | web `viewer.coTheDuyet` = QL, QT · `request.approve` | GET `/yeu-cau?studentId=`; duyệt: mục I | StudentDetailPage.tsx:327 |
| Hồ sơ HV › Học thuật | bảng kỹ năng + Ngăn Case | mở Ngăn Case (mục G); + Case cho {kỹ năng} | như mục G | POST `/cases/report` | students/CotCaseHv.tsx:107,114 |
| Hồ sơ HV › Học thuật | Mock Test (FT) / Kết quả Test (thường) | bấm MT{n} sang hồ sơ lượt; ⋯ dòng lịch: Xếp lịch · Dời lịch · Nhập điểm · Khôi phục kết quả · Xóa · Mở hồ sơ MT | theo mục F | POST `/attempts/:id/bo-tuan` … | students/HangLichMt.tsx:171; StudentDetailPage.tsx:587-792 |
| Hồ sơ HV › Học thuật | Tiến độ trên lớp (lớp thường) | **+ Ghi tiến độ** · Sửa / xoá · Hoàn tác | MC `kyNangGhi` = GV dạy kỹ năng đó, GVCN, QL | POST `/students/:id/bai-tren-lop` · PUT/DELETE `/bai-tren-lop/:id` | students/TienDoTrenLop.tsx:266-275 |
| Hồ sơ HV › Học thuật | Mini Test / Kết luận khoá (lớp thường) | **Ghi Mini Test** · Đạt / Không đạt · Lưu · Sửa | web `viewer.coTheKetLuan` = QL, QT · MC `request.approve` | PUT `/mini-test/:id` · PUT `/students/:id/ket-luan-ft` | students/KetLuanKhoa.tsx:49,109,193 |
| Hồ sơ HV › Ý thức & Phối hợp | đầu thẻ | **Khai / sửa cấp bậc** (Bậc, Tháng xử lý, Ghi chú) | web GVCN, QL, QT · MC `discipline.manage` | POST / PUT `/students/:id/y-thuc/khai-bac` | yThuc/StudentYThucSection.tsx:233; KhaiBacPanel.tsx:61,62 |
| Hồ sơ HV › Ý thức & Phối hợp | đầu thẻ | **+ Ghi vi phạm** | web `d.canRecord` · MC `violation.record` | POST `/violations` | StudentYThucSection.tsx:235 |
| Hồ sơ HV › Ý thức & Phối hợp | Cần làm / Lịch sử | Đã xem vi phạm này · Bỏ xem · Xác nhận xử lý (Tiếp: đính kèm bằng chứng → Gửi Quản lý duyệt · trả lời trong 5 ngày; Đề xuất) · Đã thực hiện… · Chưa thực hiện · Sửa · Thu hồi · Xoá nháp | GVCN, QL, QT (GVm đọc) · MC `discipline.manage` (QL duyệt: mục I) | POST `/students/:id/y-thuc/ghi-nhan` · `/bo-ghi-nhan` · `/xu-ly` · `/de-xuat`; POST `/y-thuc/xu-ly/:id/gui` · `/da-thuc-hien` · `/chua-thuc-hien`; DELETE `/y-thuc/xu-ly/:id`; PATCH `/discipline-measures/:id`; POST `/discipline-measures/:id/thu-hoi` | StudentYThucSection.tsx:94,120,168; XacNhanXuLyPanel.tsx:103-147; XemXuLyPanel.tsx:77-124 |
| Hồ sơ HV › Ý thức & Phối hợp | Phối hợp SOS | + Thêm việc · Xác nhận · Bỏ việc… · Đưa lại · Khôi phục · hạn | GVCN, QL, QT · `discipline.manage` | POST `/attempts/:id/phoi-hop-sos` · `/phoi-hop-sos/:id/*` | yThuc/PhoiHopSosSection.tsx |
| Hồ sơ HV › Lộ trình & lớp | CacLoTrinh / PanelBuocTiep | **Chọn bước tiếp ›** · Đổi · Giữ lựa chọn cũ · Huỷ hẹn · Gia hạn · Lịch sử · Tổng kết | web `buocTiep.coTheChon` · MC `coQuyenBuocTiep` = `cycle.edit` / `student.edit_more` (QL, QT, TVV, CX) | POST `/cycles/:id/buoc-tiep` · DELETE `/cycles/:id/buoc-tiep` | students/CacLoTrinh.tsx:35; PanelBuocTiep.tsx:102,106; PanelLoTrinhMoi.tsx:103,112 |
| Hồ sơ HV › Lộ trình & lớp | Hành trình (trục tuần, chương) | xem; bấm chương mở Ngăn Case | mọi vai xem HV | GET `/students/:id/hanh-trinh`, `/students/:id/lo-trinh` | students/HanhTrinh.tsx; ChuongLop.tsx |
| Hồ sơ HV (lớp thường) | gợi ý mock | **Áp mock gợi ý** | QL, QT (`plan.week`), AD | POST `/cycles/:id/apply-suggested-mocks` | students/StudentPlanPanel.tsx:40 |
| Lưu trữ | tab Học viên đã lưu trữ | chọn nhiều → **Quay lại học** (lớp cũ / chọn lớp) · Hoàn tác · ⋯ Sửa thông tin | QL, QT (`cycle.edit` cho `hocLai`); GVCN, GVm chỉ xem; TVV/CX không có trang | POST `/students/:id/quay-lai` · `/hoan-tac-quay-lai` | students/LuuTruPage.tsx:101,111,217 |
| Lưu trữ | tab Lớp đã kết thúc | **Mở lại** (lớp) | QL, QT · `class.edit` | POST `/classes/:id/mo-lai` | LuuTruPage.tsx; XoaKetThucLopPanel.tsx:142 |

### G. Case (Ngăn Case, trang Case) — dùng chung ở Hồ sơ HV, Hồ sơ lớp, Công việc, `/hoc-thuat/case/:id`

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Case (mọi chỗ) | form + Case (QuickReport) | **Lưu** / thêm Case (chọn HV, kỹ năng, mô tả) · **Nhập Case cũ** (backfill) | web `canReport` · MC `sos.report` | POST `/cases/report` · POST `/cases/backfill` | cases/QuickReport.tsx:217,279 |
| Case | Ngăn Case (CasePanel) | **+ Thêm PA** (FormPa) | web `canEdit` · MC `sos.edit` (GV đúng kỹ năng, QL, QT) | POST `/cases/:id/interventions` | cases/CasePanel.tsx:313; cases/ThaoTacCase.tsx:74 |
| Case | Ngăn Case | **Hoàn thành Case** (kết luận) | web `viewer.canClose` · MC `case.close` (GV dạy kỹ năng; Ý thức: GVCN; QL, QT) | POST `/cases/:id/outcome` | CasePanel.tsx:375; ThaoTacCase.tsx:194 |
| Case | Ngăn Case | **Mở lại** (Case đã hoàn thành) | web `viewer.coTheMoLai` · MC `case.approve` hoặc người đóng được (`canCloseCase`) | POST `/cases/:id/mo-lai` | CasePanel.tsx:588,591 |
| Case | Ngăn Case | **Không cần theo dõi…** (gửi QL) | web `canEdit` · MC `sos.edit` | POST `/cases/:id/dismiss` | CasePanel.tsx:377; yThuc/CaseSosControls.tsx:363 |
| Case | Ngăn Case | **Xoá Case** / **Đề nghị QL xoá Case** / Xoá Case + n PA · Rút lại | web `viewer.xoa` = `ngay` (QL, QT, hoặc người sửa Case) / `xin` (thẻ Chờ duyệt) · MC `cachXoaCase` | DELETE `/cases/:id` · POST `/yeu-cau/:id/rut` | CasePanel.tsx:617,638,658 |
| Case | Ngăn Case | **Sửa** Case (kỹ năng, mô tả, Xong) | web `canEdit` · MC `sos.edit` | PATCH `/cases/:id` | CasePanel.tsx:491,541; students/NganCase.tsx:194 |
| Case | Ngăn Case | **Đổi người phụ trách** | web `doiChu.coThe` · MC `owner.ts` (`class.assign` / `case.approve`) | POST `/cases/:id/nguoi-phu-trach` | CasePanel.tsx:443; cases/DoiNguoiPhuTrach.tsx:26 |
| Case | Ngăn Case (S) | **Dùng nhận xét này / Giữ mô tả đang có** (nhận xét S) · Hoàn tác | web `coTheXacNhan` = người phụ trách S · MC `quyenPhuTrachS` | POST `/cases/:id/xac-nhan-s` · `/hoan-tac-xac-nhan-s` | CasePanel.tsx:539-549 |
| Case | Ngăn Case (SOS tự sinh) | **Xác nhận Case** · Hoàn tác | web `coTheXacNhanCase` · MC `sos.edit` hoặc GVCN lớp em | POST `/cases/:id/xac-nhan` · `/cases/:id/hoan-tac-xac-nhan` | yThuc/CaseSosControls.tsx:143,149 |
| Case | thẻ PA | **Xác nhận PA** (PA theo quy chế) · Hoàn tác xác nhận | web `xacNhanDuoc` · MC `sos.edit` | POST `/interventions/:id/xac-nhan-pa` · `/hoan-tac-xac-nhan` | CasePanel.tsx:752; CaseSosControls.tsx:242,253; ui/SoLieu.tsx:262,268 |
| Case | thẻ PA | **Đề xuất PA khác** (Gửi Quản lý duyệt) · Rút | web PA quy chế · MC `sos.edit` → thẻ Chờ duyệt | POST `/interventions/:id/de-xuat-doi-pa` · POST `/yeu-cau/:id/rut` | CasePanel.tsx:1047,1009; CaseSosControls.tsx:229,237 |
| Case | thẻ PA | **Ghi kết quả / Ghi kết quả cuối / Cập nhật trước hạn** (CapNhatTuan) · sửa lần ghi · Hoàn tác | web `iv.ghiDuoc` · MC `ghiDuocPaMany` (người giữ việc hoặc `sos.edit`) | POST `/interventions/:id/result` · POST `/followups/:id/sua` · `/followups/:id/hoan-tac` · PATCH/DELETE `/followups/:id` | cases/CapNhatTuan.tsx:288,299; CasePanel.tsx:673,1105 |
| Case | thẻ PA | **Kết thúc sớm…** · **Mở lại PA** · Sửa PA · Xoá PA / Đề nghị QL xoá PA | web theo `iv.*` · MC `sos.edit` / `cachXoaPa` | POST `/interventions/:id/ket-thuc` · `/hoan-tac-ket-thuc` · PATCH `/interventions/:id` · DELETE `/interventions/:id` | CasePanel.tsx:771-950 |
| Case | Thêm PA hộp | "Hoàn tác thêm PA" | như Thêm PA | POST `/interventions/:id/hoan-tac-them` | ThaoTacCase.tsx:86 |
| Case | từ Công việc | **Xác nhận PA lô** · Hoàn tác | web nhóm PA · MC `sos.edit` | POST `/interventions/xac-nhan-pa-lo` · `/interventions/hoan-tac-xac-nhan-pa-lo` | congViec/XacNhanPaLo.tsx:100,128 |

### F. Test (`/test/*`), nhập điểm, Hồ sơ lượt (`/mock-test/:id`, `/luot-test/:id`)

Quyền điểm (MC): nhập/sửa ô điểm `saveScore` / `saveRegularScore` → `scoreEditPath`: `score.edit` đúng kỹ năng được phân công (GVm, GVCN) · GVS chấm S chéo lớp FT cùng chi nhánh · GVCN ở lượt MT cũ (`lich_su`, mọi ô) · AD (`score.override`) · QL, QT (qua `plan.week` → đường `override`, bắt buộc lý do). Xếp / dời lịch: `plan.week` (QL, AD, QT) và `schedule.move` (GVm / GVCN, chỉ lớp thường, đúng phần mình dạy); T6 → CN bị khoá trừ QT; QT bật "Mở sửa lịch Test" để mở lại.

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Test › Lịch Test | thanh tuần | chip Tất cả / Fast Track / Lớp thường · Lớp tôi dạy / Tất cả · chi nhánh · Mở tất cả lớp / Thu gọn | Mở tất cả lớp: web `nav.testPlan` (QL, AD, QT) | GET `/cham/lich-test`, `/cham/lich-test/qua-han` | test/LichTestTab.tsx:211 |
| Test › Lịch Test | thanh tuần | **Xuất Excel** (NganXuatMt: Chi nhánh, Lớp, Thời gian theo tuần / tháng / đợt, Chỉ lượt đủ điểm, Cột gọn / đầy đủ) | web `nav.xuatMt` = QL, QT, AD, GVCN · MC `phamViXuatMt` | POST `/xuat-mt` (xem trước GET `/xuat-mt/xem-truoc`) | LichTestTab.tsx:272; test/NganXuatMt.tsx:120 |
| Test › Lịch Test | thanh tuần | **Lịch thi thật** (link sang Học viên & Lớp › Lịch thi) | web `nav.students` | — | LichTestTab.tsx:276 |
| Test › Lịch Test | hàng lớp (mở) | lưới nhúng LuoiNhung: gõ điểm vào ô (lớp thường: đúng / tổng; FT: band theo kỹ năng); Lưu · bài tiếp ›; Điền ô trống; **Mở lưới đầy đủ ›** | web cờ `canEdit` từng ô · MC "Quyền điểm" | PUT `/attempts/:id/scores/:skill` (FT) · PUT `/regular/attempts/:id/scores/:skill` (thường) | test/lichTest/LuoiNhung.tsx:46; cham/LuoiThuong.tsx:159,312 |
| Test › Lịch Test | hàng lớp thường | **Tạo lượt Test** (Progress / Final cho cả lớp) | web `canPlanWeek` · MC `planRegularTests` (chưa kiểm sâu hàm) | POST `/regular/classes/:id/plan` | cham/LuoiThuong.tsx:247; test/keHoach/LopKeHoach.tsx:31 |
| Test › Lịch Test | ô điểm ⋯ | **Xếp lịch · Dời lịch · Dời hạn chấm · Xoá · Vắng · Huỷ điểm · Khôi phục · Khôi phục điểm** (HopThaoTacMt; Lý do bắt buộc đúng chỗ) | theo từng thao tác (xem dòng Mock bên dưới) | xem dòng Mock bên dưới | fasttrack/HopThaoTacMt.tsx:110-165; shared thaoTacMt.ts:59 |
| Test › Lịch Test | panel Nhập điểm lớp (PanelNhapDiemLop; mở từ ⋯ lớp, Hồ sơ lớp, dòng HV, Công việc, `/test/diem-lop?lop=`) | chọn lượt / môn, nhập từng ô, Lưu; lưới FT LuoiFT, lưới thường LuoiThuong, MotKyNang | web `canEnterScores` · MC "Quyền điểm" | PUT scores như trên | cham/PanelNhapDiemLop.tsx; DiemTheoLop.tsx; LuoiChamLop.tsx |
| Nhập điểm (ô) | hộp điểm FT HopNhapDiem | **Lưu · đóng / Lưu điểm · đóng / Lưu · em tiếp › / Lưu · bài tiếp ›** · **Bỏ vắng** · nhận xét · Hoàn tác | như Quyền điểm; Speaking S: GVS | PUT `/attempts/:id/scores/:skill` · POST `/attempts/:id/skills/:skill/khoi-phuc-diem` | fasttrack/HopNhapDiem.tsx:454,564,593,594,821; ScoreEntry.tsx:158,159 |
| Test › Kế hoạch Test | đầu trang | **Xếp lịch Test… / Xếp nhiều MT…** (NganXepLichMt: Xếp theo tuần / Xếp theo học viên / Theo tuần chung) | web `nav.testPlan` (QL, AD, QT) · MC `plan.week`; GV chỉ xem tab (`testPlanXem`) | POST `/ke-hoach-test/hang-loat` · `/ke-hoach-test/dot/kiem` · `/ke-hoach-test/xep-moi` · `/ke-hoach-test/dot` | test/keHoach/NganXepLichMt.tsx:154,209; NganXepHangLoat.tsx:140,171; XepTheoHocVien.tsx:158-247 |
| Test › Kế hoạch Test | đầu trang ⋯ | **Xuất Excel** (kế hoạch) · **Xuất điểm Test** (Theo lớp nhiều MT / Lớp + khoảng tuần / Chỉ điểm / Điểm + nhận xét) | QL, AD, QT (`xuatKeHoach`, `xuatDiemTest`) | POST `/ke-hoach-test/xuat` · `/ke-hoach-test/xuat-diem` | test/keHoach/NganXuatKeHoach.tsx:24,31; NganXuatDiem.tsx:56,70 |
| Test › Kế hoạch Test | hàng lớp | ô kỹ năng → hộp **HopKyNang**: xếp tuần theo kỹ năng · **Xóa lịch / Xóa** · Mở hồ sơ MT · Lịch sử · Lý do | QL, AD, QT (`plan.week`); Xoá kỹ năng thêm `attempt.skip_skill` (QL, QT) | POST `/ke-hoach-test/xep-moi` · `/ke-hoach-test/dot` · POST `/attempts/:id/bo-tuan` | test/keHoach/HopKyNang.tsx:173-282 |
| Test › Kế hoạch Test | ô S Ex | **S Expert**: thêm / dời (Band, Ngày, Nhận xét) · Xoá · Khôi phục | QL, AD, QT (thêm / dời / xoá); chấm = GV Speaking cùng chi nhánh | POST `/s-expert` · PUT/DELETE `/s-expert/:id` · POST `/s-expert/:id/khoi-phuc` | test/keHoach/HopSEx.tsx:46-61 |
| Test › Kế hoạch Test | lưới | **+ Ghi chú lớp / ghi chú lịch** | QL, AD, QT · `plan.week` | POST `/ke-hoach-test/ghi-chu` (GET `.../ghi-chu/lich-su`) | keHoach/GhiChuLichThi.tsx:12; LuoiKeHoach.tsx |
| Test › Kế hoạch Test | xoá lượt MT | **Xoá MT{n}** · Đưa lại cả 4 kỹ năng | QL, AD, QT (`xoaLuot` = `plan.week`); đưa lại: `attempt.skip_skill` (QL, QT) | POST `/attempts/:id/xoa` · POST `/attempts/:id/dua-lai-ca-luot` | test/keHoach/xoaMt.ts:16,29 |
| Test › Kế hoạch Test | Khôi phục kết quả | **Khôi phục kết quả / Khôi phục MT cũ** (Lý do) | QL, QT · `attempt.cancel` | POST `/attempts/:id/khoi-phuc-ket-qua` · POST `/attempts/:id/reopen` | keHoach/HopKhoiPhucKetQua.tsx:29,89 |
| Mock `/mock-test/:id` | menu ⋯ đầu trang | **Đưa lại cả 4 kỹ năng** | web `canSkipSkill` · MC `attempt.skip_skill` (QL, QT) | POST `/attempts/:id/dua-lai-ca-luot` | fasttrack/MockDetailPage.tsx:268,247 |
| Mock | menu ⋯ đầu trang | **Dời lịch cả đợt** | web `canPlanWeek` (QL, AD, QT) · `plan.week` | POST `/attempts/:id/skills/:skill/week` (qua HopKyNang) | MockDetailPage.tsx:273 |
| Mock | menu ⋯ đầu trang | **Dời hạn chấm cả đợt** | web `canOverrideDeadline` (QL, QT) · `deadline.override` | POST `/attempts/:id/deadline` | MockDetailPage.tsx:277,1097 |
| Mock | menu ⋯ đầu trang | **Khôi phục kết quả** · **Khôi phục MT{n} cũ** | web `canCancel` (QL, QT) · `attempt.cancel` | POST `/attempts/:id/khoi-phuc-ket-qua` · `/reopen` | MockDetailPage.tsx:282-288 |
| Mock | menu ⋯ đầu trang | **Xoá MT{n}** (chỉ lượt kiểu mock) | web `canPlanWeek` (QL, AD, QT) · `plan.week` | POST `/attempts/:id/xoa` | MockDetailPage.tsx:290 |
| Mock | dải lượt đã huỷ | **Mở lại lượt** | web `canCancel` (QL, QT) | POST `/attempts/:id/reopen` | MockDetailPage.tsx:325 |
| Mock | dòng kỹ năng | nút chính **Nhập điểm / Sửa điểm / Xếp lịch / Dời lịch / Trả lời đề nghị dời / Khôi phục** + ⋯ (Dời hạn chấm, Vắng, Xoá, Huỷ điểm, Khôi phục điểm) | từ `thaoTacKyNang`: nhập = `c.canEdit`; lịch = `canPlanWeek` hoặc GVCN (dời MT cũ); Dời hạn = QL, QT; Xoá = QL, QT; Vắng = GVCN, QL, AD, QT | POST `/attempts/:id/skills/:skill/` + week · restore · deadline · skip · bao-vang · huy-diem · khoi-phuc-diem; PUT `/attempts/:id/scores/:skill` | MockDetailPage.tsx:740-1004,838,849 |
| Mock | ô Speaking | nhận xét Speaking + GV chấm; nhóm nguyên nhân | người sửa được ô (`cell.canEdit`) | PUT `/attempts/:id/scores/speaking/phu-trach` | MockDetailPage.tsx:224 |
| Mock | khối Case của lượt | mở Ngăn Case / PA (mục G) | web ẩn khối với GVS, AD | — | MockDetailPage.tsx:92 |
| Mock | Phối hợp SOS của lượt | + Thêm việc phối hợp | GVCN, QL, QT · `discipline.manage` | POST `/attempts/:id/phoi-hop-sos` | yThuc/PhoiHopSosSection.tsx:408 |
| Lượt thường `/luot-test/:id` | dòng kỹ năng | **Nhập điểm** / Vắng / Huỷ điểm / Khôi phục điểm / Dời lịch (cùng `thaoTacKyNang`, lớp thường) | `huy` = `attempt.skip_skill`, `han` = `deadline.override` (QL, QT); nhập = Quyền điểm | PUT `/regular/attempts/:id/scores/:skill`; POST `/attempts/:id/skills/:skill/khoi-phuc-diem`; POST `/attempts/:id/reopen` | fasttrack/LuotThuongPage.tsx:128,139,177,315 |
| Test (lưới thường) | ⋯ ô | Dời lịch / Vắng / Huỷ điểm… (HopThaoTacMt, lớp thường) | GVCN, GVm (đúng môn, `schedule.move`), QL, AD, QT | PUT `/regular/attempts/:id/scores/:skill` (noShow / null) · POST `/attempts/:id/skills/:skill/week` | cham/LuoiThuong.tsx:359-375; HopThaoTacMt.tsx:134-149 |

### H. Công việc `/cong-viec` (danh sách một trang HoTroHocVienTab + panel làm tại chỗ `?viec=`)

Tập việc theo vai (MC `/my-work`, `phamViXemViec`): GVm / GVCN / GVS = việc của mình; QL, QT = tất cả trong phạm vi (lọc người, "Làm thay"); AD = chỉ nhóm Chấm điểm; TVV = Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ. Mỗi dòng việc mở panel theo loại (bảng điều phối `congViec/PanelViec.tsx:119-182`).

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Công việc | dòng việc | nút động từ của dòng (Nhập điểm · Chấm · Xác nhận…) / **Làm thay** / Nhập hộ / **Việc tiếp ›** / Đóng / ‹ Công việc | người có việc; "Làm thay" khi máy chủ báo `lamThay` (QL, QT) | (mở panel; xem các dòng dưới) | congViec/DanhSachViec.tsx:205; HoTroHocVienTab.tsx:657,692,693 |
| Công việc | dòng việc mốc | **Bỏ qua** · khu Đã bỏ qua › **Khôi phục** | web `boQuaDuoc` · MC `phamViXemViec = het` (QL, QT) + `case.approve`. nút chỉ hiện khi máy chủ gắn `boQuaDuoc`; AD (phạm vi `cham-diem`) bị `boQuaViec` chặn nên không có nút thực tế | POST `/my-work/bo-qua` | HoTroHocVienTab.tsx:349,559,763 |
| Công việc | dòng việc sau thi | **Gia hạn** | QL, QT, TVV · `coTheGiaHanSauThi` | PUT `/cycles/:id/han-sau-thi` | HoTroHocVienTab.tsx:555; students/HopGiaHan.tsx:35 |
| Công việc | dòng việc xuất BC PH | **Xuất** (NutXuatLopBc) | AD (việc xuat_bc_ph), QL | GET `/classes/:id/bao-cao-ph/xuat` | HoTroHocVienTab.tsx:562 |
| Công việc | cuối trang | **+ Giao việc** (khu Việc quản lý) | QL, QT (`workOps`, `meeting.edit`) | POST `/mgmt-tasks` · POST `/tasks` | HoTroHocVienTab.tsx:778; worklist/MgmtTasksPage.tsx:706,713 |
| Công việc › Chấm điểm | panel Nhập điểm (PanelNhapDiem / PanelNhapDiemTuan / PanelChamSpeaking) | nhập điểm các ô của việc; Lớp tiếp ›; Việc tiếp › | GVm, GVCN, GVS (Chấm Speaking), QL, AD (nhập hộ) · Quyền điểm (mục F) | PUT `/attempts/:id/scores/:skill` · PUT `/regular/attempts/:id/scores/:skill`; GET `/my-work/cham-speaking` | congViec/PanelViec.tsx:131-137,246,292-320; PanelChamSpeaking.tsx |
| Công việc › Case học thuật | Ngăn Case theo `viec`: xac-nhan · ghi-nhan-xet · xac-nhan-pa · ghi-ket-qua · them-pa | Xác nhận / Ghi nhận xét / Xác nhận PA / Ghi kết quả / + Thêm PA | GVm đúng kỹ năng, GVCN, QL · `sos.edit` | xem mục G | PanelViec.tsx:119-130 |
| Công việc › Case học thuật | nhóm PA | **Xác nhận PA lô** · Hoàn tác | như trên | POST `/interventions/xac-nhan-pa-lo` · `/hoan-tac-xac-nhan-pa-lo` | congViec/XacNhanPaLo.tsx:100,128 |
| Công việc › Case học thuật | việc no_owner | **Chọn / đổi người phụ trách** · **Giao** (GVCN / GV môn lớp thiếu GV) | QL, QT (`case.approve` / `class.assign`) | POST `/cases/:id/nguoi-phu-trach` · PUT `/classes/:id/teachers` | PanelViec.tsx:370,394,417; cases/DoiNguoiPhuTrach.tsx:26 |
| Công việc › Case học thuật | phoi_hop_sos / phoi_hop | Phối hợp SOS: + Thêm việc · Xác nhận · Bỏ việc… | GVCN, QL, QT · `discipline.manage` | POST `/phoi-hop-sos/:id/*` | PanelViec.tsx:166-169,266-271,434-441 |
| Công việc › Ý thức & Phối hợp | yt_xu_ly / yt_xem / yt_thuc_hien / khai_bac | **Xác nhận xử lý** lô (LoYThucPanel) · PanelXemViPham (Xác nhận xử lý) · DaThucHienPanel (**Lưu · Đã thực hiện**) · KhaiBacPanel | GVCN, QL, QT · `discipline.manage` | POST `/classes/:id/y-thuc/lo/*` · `/students/:id/y-thuc/*` · POST `/y-thuc/xu-ly/:id/da-thuc-hien` | PanelViec.tsx:142-158; yThuc/PanelXemViPham.tsx:41-54 |
| Công việc › Vận hành | mgmt | NganViecVanHanh: Cập nhật tiến độ · Sửa · + Việc con | người được giao hoặc QL, QT | POST `/mgmt-tasks/:id/update` · PATCH `/mgmt-tasks/:id` | PanelViec.tsx:159; MgmtTasksPage.tsx:342-346,461,554 |
| Công việc › Vận hành | ban_giao | Bàn giao GVCN / môn / GV (mục D) | GVCN, GV môn, QL | PUT / POST `/lenh-chuyen/:id/*`, `/ban-giao-gv/:id/*` | PanelViec.tsx:138-141 |
| Công việc › Vận hành | xet_lai_lo_trinh | PanelXetLai (mục D) | QL, QT | POST `/classes/:id/xet-lai` | PanelViec.tsx:179 |
| Công việc › Vận hành / Sau thi | thi_that / buoc_tiep | PanelSauThi: **nhập Kết quả thi thật · Chọn bước tiếp · Huỷ chọn** | QL, QT, TVV (+ GVCN lớp cuối nhập KQ thi) · `coQuyenBuocTiep` | PUT `/cycles/:id/outcome` · POST / DELETE `/cycles/:id/buoc-tiep` | PanelViec.tsx:162; congViec/PanelSauThi.tsx:89,113,120 |
| Công việc › Chốt ngày thi | missing_data | PanelChotNgayThi (chốt ngày thi) · SuaThongTinMotEm | TVV, GVCN, QL · `student.edit` / `student.edit_info` | PUT `/hoc-vien-lop/lich-thi/:cycleId` · PATCH `/students/:id` | PanelViec.tsx:170-175; PanelSauThi.tsx:245 |
| Công việc › Bổ sung hồ sơ | bo_sung_ho_so (TVV) | PanelBoSungHoSo → Sửa thông tin từng em | TVV | PATCH `/students/:id` | PanelViec.tsx:106,176 |
| Công việc › Báo PH | bao_ph_yt (TVV) | PanelBaoPhTvv: **Ghi kết quả** (Đã báo PH / Chưa liên hệ được + Nội dung) · Sửa hạn · Bỏ việc · Khôi phục | TVV của em, QL chi nhánh (MC `coTheGhi`) | POST `/y-thuc/bao-ph/ghi` · `/y-thuc/bao-ph/:id/han` · `/bo` · `/khoi-phuc` | congViec/PanelBaoPhTvv.tsx:49,103,143,232 |
| Công việc | khối Yêu cầu của tôi | xem yêu cầu 60 ngày: Sửa… · Rút lại | GVm, GVCN, GVS, TVV (QL, QT tự duyệt trong hộp) | GET `/yeu-cau?hop=cua-toi`; PUT `/yeu-cau/:id`; POST `/yeu-cau/:id/rut` | duyet/YeuCauCuaToi.tsx; TheYeuCau.tsx |
| Công việc | khối Lớp tôi dạy | link lớp | GV* | GET `/tong-quan/lop-toi-day` | HoTroHocVienTab.tsx:572 |

### I. Chờ bạn duyệt / thẻ yêu cầu (HopChoDuyet, TheYeuCau; trong Công việc, cũng ở Tổng quan và Hồ sơ HV)

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Công việc › Chờ bạn duyệt | thẻ | **Duyệt** · **Duyệt…** (kèm dữ liệu: + Thêm PA, chuyển lớp…) | web `nav.workApprove` · MC `request.approve` theo phạm vi thẻ = QL, QT | POST `/yeu-cau/:id/duyet` | duyet/HopChoDuyet.tsx:174; TheYeuCau.tsx:139 |
| Công việc › Chờ bạn duyệt | thẻ | **Từ chối…** · **Trả lời…** (thẻ kiểu trả lời) · **Sửa trả lời…** | QL, QT · `request.approve` | POST `/yeu-cau/:id/tu-choi` · `/tra-loi` · `/sua-tra-loi` | TheYeuCau.tsx:95,139 |
| Công việc › Chờ bạn duyệt | thẻ đã xử lý (30 ngày) | **Hoàn tác** (huỷ quyết định) | QL, QT | POST `/yeu-cau/:id/huy-quyet-dinh` | HopChoDuyet.tsx:159; TheYeuCau.tsx:199 |
| Công việc › Chờ bạn duyệt | thanh chọn nhiều | **Duyệt nhiều / Từ chối nhiều** | QL, QT | POST `/yeu-cau/duyet-nhieu` · `/yeu-cau/tu-choi-nhieu` | HopChoDuyet.tsx:198,216 |
| Thẻ yêu cầu | người gửi | **Sửa…** · **Rút lại** | người gửi (GVm, GVCN, TVV…) · MC "chỉ người gửi" | PUT `/yeu-cau/:id` · POST `/yeu-cau/:id/rut` | duyet/DeXuatSuaPanel.tsx:62; yThuc/XemXuLyPanel.tsx:78,112,124; CaseSosControls.tsx:237 |
| Nơi sinh thẻ | Hồ sơ HV / Case / Ý thức | Đề xuất sửa thông tin… · Đề xuất chuyển lớp… · Đề xuất PA khác · Xoá Case / PA (xin) · Thu hồi xử lý Ý thức · Gửi Quản lý duyệt · Không cần theo dõi… | GV theo từng việc | POST `/students/:id/de-xuat-sua` · `/de-xuat-chuyen-lop` · `/interventions/:id/de-xuat-doi-pa` · `/cases/:id/dismiss` · `/y-thuc/xu-ly/:id/gui` | (mục E, G) |

### J. Việc quản lý (Vận hành) `/cong-viec/van-hanh` và Báo cáo đơn vị `/cong-viec/bao-cao`

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Vận hành | đầu bảng | **+ Giao việc** (Việc chi nhánh / Giao GV theo lớp + kỹ năng; Tên công việc, Người phụ trách, Hạn, Giao) | web `data.canEdit` · MC `meeting.edit` = QL, QT | POST `/mgmt-tasks` (Việc chi nhánh) · POST `/tasks` (Giao GV theo lớp + kỹ năng) | worklist/MgmtTasksPage.tsx:165,706,713 |
| Vận hành | chi tiết việc | **Cập nhật tiến độ** (Tạm ngưng: Cần ai hỗ trợ; Ngày xem lại) | người được giao hoặc QL, QT | POST `/mgmt-tasks/:id/update` | MgmtTasksPage.tsx:342,461 |
| Vận hành | chi tiết việc | **Sửa** (đổi hạn cần Lý do dời hạn) · **+ Việc con** | QL, QT · `meeting.edit` | PATCH `/mgmt-tasks/:id` · POST `/mgmt-tasks` | MgmtTasksPage.tsx:345,346,554 |
| Báo cáo đơn vị | từng ô (đơn vị × hạng mục) | **Lưu** nhận định · **+ Chọn việc** · **+ Tạo việc từ mục này** · gỡ việc nối | web `canEdit` đơn vị · MC `meeting.edit` = QL, QT (xem: `meeting.view`) | PUT `/meeting/units/:unitId/reports/:categoryKey` · POST `/meeting/reports/:reportId/tasks` · DELETE `/meeting/reports/:reportId/tasks/:taskId` | worklist/MeetingPage.tsx:343,382,389,465,485 |

### K. Phân tích `/phan-tich`

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Phân tích | đầu trang | ô chi nhánh; hàng lọc Chương trình · Khoảng thời gian · Lớp | TVV, CX, QL, AD, QT · `analysis.view` (phạm vi `phamViPhanTich`) | GET `/phan-tich/*` | phanTich/PhanTichPage.tsx; PhanTich.tsx:114 |
| Phân tích › Báo cáo HV | nút | **In** | cùng nhóm | — (`window.print`) | PhanTich.tsx:138 |
| Phân tích › Test + SOS | nút | **Xuất Excel** · ⋯ Cột hiện · **Xuất kết quả từng lượt** (NganXuatMt) | Xuất từng lượt: web `nav.xuatMt` (QL, QT, AD, GVCN không có trang) · MC `phamViXuatMt` | POST `/xuat-mt` | phanTich/TongHopTestSos.tsx:226,365,366 |
| Phân tích › KQ Thi thật | nút | **Xuất Excel** | cùng nhóm | GET `/phan-tich/thi-that` | phanTich/KetQuaThi.tsx:88 |
| Phân tích › Hiệu quả PA | lọc | Bỏ lọc giáo viên | cùng nhóm | GET `/phan-tich/hieu-qua-pa` | phanTich/HieuQuaPa.tsx:159 |
| Phân tích › Phân tích GV | bảng | đổi bộ cột; link sang `/giao-vien/:id` | web `nav.phanTichGv` = QL, AD, QT · MC `analysis.view_teacher` | GET `/phan-tich/giao-vien` | phanTich/PhanTichGiaoVien.tsx:66,121 |
| Phân tích › Ý thức | nút | **Xuất Excel** | web `can(discipline.stats)` = QL, QT · MC `discipline.stats` | GET `/phan-tich/y-thuc` | phanTich/YThucPhoiHop.tsx:199 |

### L. Quản trị `/quan-tri`, Hồ sơ giáo viên `/giao-vien/:id`, Tutor (ẩn)

| Trang | Khu | Nút / thao tác | Vai (web · MC) | API | web:dòng |
|---|---|---|---|---|---|
| Quản trị › Tài khoản | đầu bảng | **+ Tạo tài khoản** (Họ và tên, Email đăng nhập `.pisa@gmail.com`, Mật khẩu ban đầu, Vai trò, Quyền cấp riêng, Kỹ năng) | QT · `admin.config` | POST `/admin/accounts` (+ PUT roles / permissions / skills, POST password sau khi tạo) | platform/AccountsAdmin.tsx:595-602 |
| Quản trị › Tài khoản | hàng chờ duyệt | **Duyệt** · **Không duyệt** (lý do) · Duyệt lại | QT · `admin.config` | POST `/admin/accounts/:id/approve` · `/decline` | AccountsAdmin.tsx:468,499 |
| Quản trị › Tài khoản | ⋯ hàng | **Sửa thông tin** (họ tên, email, điện thoại, chức danh) | QT | PATCH `/admin/accounts/:id` | AccountsAdmin.tsx:784 |
| Quản trị › Tài khoản | ⋯ hàng | Vai trò · Quyền cấp riêng (Lý do đổi quyền; CapQuyenRieng) · Mật khẩu · Kỹ năng · Gỡ | QT · MC `setRoles` / `setUserPermissions` / `resetPassword` = `admin.config`; kỹ năng: `duocSuaKyNang` (xem chú ý) | PUT `/admin/accounts/:id/roles` · `/permissions` · POST `/admin/accounts/:id/password` · PUT `/admin/accounts/:id/skills` | AccountsAdmin.tsx:595-599; CapQuyenRieng.tsx |
| Quản trị › Tài khoản | ⋯ hàng | **Xoá tài khoản** (gõ họ tên / email) | QT | POST `/admin/accounts/:id/xoa` (GET xem trước) | platform/XoaTaiKhoanPanel.tsx:41 |
| Quản trị › Tài khoản | lọc Đã xoá | **Khôi phục** | QT | POST `/admin/accounts/:id/khoi-phuc` | AccountsAdmin.tsx:125 |
| Quản trị › Chương trình | bảng | **+ Chương trình** · Sửa (Mã, Tên, Môn, Mốc Test, Độ dài, Đạt từ, Liên tục, Chỉ FT) · Lộ trình (Sửa) · Lưu | QT | PUT `/admin/programmes` · PUT `/admin/routes` | platform/CatalogAdmin.tsx:224,228,234,240 |
| Quản trị › Chi nhánh | bảng | **Sửa** (Tên, Địa chỉ, SĐT) · Lưu | QT | PUT `/admin/chi-nhanh/:id` | platform/ChiNhanhAdmin.tsx:32 |
| Quản trị › Bảng quy đổi | bảng số câu → band | **Sửa · Lưu** (Lý do) · **Hoàn tác / Khôi phục** phiên bản · "Tới ô đã đổi kế tiếp" | web `suaDuoc` = QT; QL xem (đọc) · MC `luuBangQuyDoi` = `admin.config` | PUT `/admin/bang-quy-doi` | platform/BangQuyDoiAdmin.tsx:74,298 |
| Quản trị › Quyền & nhật ký | ma trận vai × quyền | **Sửa quyền** · **Lưu** · Huỷ thay đổi (hiện tầm ảnh hưởng) | QT | PUT `/admin/role-permissions` (GET `/admin/permissions/matrix`, `/admin/overview`) | platform/AdminPage.tsx:89-216 |
| Quản trị › Quyền & nhật ký | công tắc | **Mở sửa lịch Test** Bật / Tắt | QT · `admin.config` | PUT `/admin/mo-sua-lich-test` | platform/MoSuaLichTest.tsx:31 |
| Quản trị › Đã xoá | bảng Thùng rác | **Khôi phục** (Case, PA, vi phạm, học viên…) | web QT, QL · MC `khoiPhucRac`: QT mọi mục; QL / người xoá theo `cycle.edit`, `quyenXoaPa` | POST `/thung-rac/:id/khoi-phuc` (GET `/thung-rac`) | platform/DaXoaAdmin.tsx:33; lib/thungRac.ts |
| Hồ sơ GV `/giao-vien/:id` | đầu trang | tên GV, link Việc / Hồ sơ HV | GV (chính mình), QL, AD, QT | GET `/giao-vien/:id`, `/giao-vien/:id/viec`, `/giao-vien/:id/chi-so` | giaoVien/HoSoGiaoVienPage.tsx:87-136 |
| Hồ sơ GV | khối Kỹ năng | **Sửa** kỹ năng · Lưu | web QL, QT (`duocSuaKyNang`); GV chỉ xem · MC `setUserSkills` = `class.assign` ở chi nhánh GV | PUT `/admin/accounts/:id/skills` | HoSoGiaoVienPage.tsx:162 |
| Hồ sơ GV | khối Việc / Yêu cầu | nút "Việc tiếp", link Công việc | GV chính mình (`nav.work`), QL (`workOps`) | — | HoSoGiaoVienPage.tsx:89,136 |
| Tutor (ẨN) | TutorPage / PanelTutor / HopTutor / TaiDanhSach | Thêm tutor · Tải danh sách (Dán từ Excel, Xem trước, Cập nhật) · Gộp… · Xoá tutor · Lưu · Nhận xét buổi (Lưu nhận xét, Sửa, Xoá) · Kết luận | KHÔNG đường vào web (route về `/`). MC còn: xem `tutor.view` (HT, QL, QT); sửa `tutor.manage` (HT, QT) | POST `/tutors` · PATCH/DELETE `/tutors/:id` · POST `/tutors/gop` · `/tutors/gop/hoan-tac` · `/tutors/tai-len` · POST `/tutors/:id/nhan-xet` · PATCH/DELETE `/tutors/nhan-xet/:id` | tutor/HopTutor.tsx:39,52,119,122; PanelTutor.tsx:61,72; TaiDanhSach.tsx:35,41 |
| Hướng dẫn `/huong-dan` | trang | nội dung, nút "Chỉ cho tôi" | mọi vai | — | huongDan/* |


---

## BẢNG 3 — THAO TÁC LẶP Ở NHIỀU NƠI (cùng một việc mở được từ ≥ 2 trang / panel)

| Việc | Các nơi | Tên nút ở mỗi nơi · khác biệt (tên / thứ tự / hộp) |
|---|---|---|
| **Báo vấn đề / + Case** (hộp QuickReport → POST `/cases/report`) | (1) Hồ sơ HV đầu trang · (2) Hồ sơ HV cột Case · (3) Hồ sơ lớp đầu trang · (4) ⋯ dòng học viên (Học viên & Lớp, Hồ sơ lớp tab Học viên) · (5) mở rộng em ở bảng lớp (FT `TomTatKn`, thường `MoRongThuong`) | (1) `+ Case` — HV điền sẵn · (2) `+ Case cho {kỹ năng}` — HV + kỹ năng điền sẵn (CotCaseHv) · (3) `+ Case` — phải CHỌN học viên trong hộp · (4) `+ Case` đầu menu ⋯ (nhóm việc hằng ngày, trước + Ghi vi phạm) · (5) `+ Case` nút nhỏ trong khối "Case đang mở" / tóm tắt kỹ năng. Cùng hộp, khác chỗ điền sẵn. Công việc có biến thể khác: việc `no_plan` mở Ngăn Case `+ Thêm PA` chứ không phải hộp báo mới |
| **Ghi vi phạm** (RecordViolationPanel → POST `/violations` · `/violations/nhieu`) | (1) Hồ sơ lớp tab Ý thức · (2) Hồ sơ HV tab Ý thức · (3) ⋯ dòng học viên | (1) `+ Ghi vi phạm` nút chính xanh, chọn HV (nhiều) trong hộp · (2) `+ Ghi vi phạm` (1 em điền sẵn) · (3) `+ Ghi vi phạm` trong menu ⋯ (đứng sau `+ Case`). Sửa / Xoá vi phạm chỉ ở `ChiTietViPham` (tab Lịch sử), không có ở menu ⋯ |
| **Nhập điểm** (panel PanelNhapDiemLop hoặc ô lưới → PUT `/attempts/:id/scores/:skill` FT · PUT `/regular/attempts/:id/scores/:skill` thường) | (1) Hồ sơ lớp đầu trang · (2) Học viên & Lớp ⋯ lớp · (3) ⋯ dòng học viên · (4) Công việc › Chấm điểm · (5) Tổng quan `PanelGvTre` (QL/AD) · (6) Test › Lịch Test (lưới nhúng, ô trực tiếp) · (7) `/test/diem-lop?lop=` (link cũ) · (8) Hồ sơ Mock `/mock-test/:id` · (9) Hồ sơ lượt thường · (10) Hồ sơ HV bảng Mock (⋯ dòng lịch) | (1) `Nhập điểm` nút cố định · (2) `Nhập điểm` trong ⋯ lớp (thứ 2, sau `Hồ sơ lớp`) · (3) `Nhập điểm {đợt}` (vd Checkpoint 2) — mở đúng lượt của em · (4) nút động từ của dòng việc (`Nhập điểm` / `Chấm` / `Nhập hộ` / `Làm thay`), panel có `Việc tiếp ›`, `Lớp tiếp: {lớp} ›` · (5) `Nhập điểm …` (nhập hộ GV trễ) · (6) gõ thẳng vào ô + `Mở lưới đầy đủ ›` · (8)(9) nút chính từng dòng kỹ năng `Nhập điểm` đổi thành `Sửa điểm` khi đã có điểm · (10) `Nhập điểm`. Hộp khác nhau: panel lớp (nhiều ô) / hộp một ô `HopNhapDiem` (`Lưu · đóng`, `Lưu · em tiếp ›`, `Lưu · bài tiếp ›`) / lưới `LuoiThuong` (`Điền ô trống`) |
| **Chuyển lớp** (ChuyenLopPanel / CuoiKhoaLop) | (1) ⋯ dòng học viên · (2) Hồ sơ HV ⋮ · (3) Hồ sơ lớp › Tổng hợp › Chọn nhiều · (4) Cuối khoá lớp thường (cả lớp) · (5) hộp Tạm dừng/ Kết thúc học · (6) thẻ Chờ duyệt (`Duyệt…`) | (1)(2) QL/QT `Chuyển lớp…`; GVCN `Đề xuất chuyển lớp…` (hộp "de-xuat" → thẻ Chờ duyệt, QL quyết) · (3) `Chuyển lớp…` (thanh dính đáy; chỉ lớp FT; vòng POST từng em) · (4) cột "Lớp chuyển đến" + Tuần, `Xác nhận` (POST `/classes/:id/transition`, gửi theo lô) · (5) nút `Chuyển lớp…` mở lại hộp chuyển · (6) hộp chuyển mở từ thẻ. API: một em POST `/students/:id/transfer`; cả lớp POST `/classes/:id/transition`; đề xuất POST `/students/:id/de-xuat-chuyen-lop`; duyệt POST `/yeu-cau/:id/duyet` |
| **+ Thêm học viên** (IntakePanel → `/intake/parse|preview|commit`) | Học viên & Lớp đầu trang · ⋯ lớp (`+ Học viên`) · Hồ sơ lớp ⋯ › Lớp · ⋯ Thao tác trang (điện thoại) | `+ Thêm học viên` (nút chính, lớp chọn trong hộp) / `+ Học viên` (lớp điền sẵn) — cùng hộp |
| **+ Lớp mới** (ClassCreatePanel → POST `/classes` · `/classes/bulk`) | Học viên & Lớp ⋯ Thao tác trang · tab Phân công GV · Cuối khoá (mở lớp mới cho em) · hộp Chuyển lớp (`+ Mở lớp mới…`) | `+ Lớp mới` / `+ Mở lớp mới…` (khoá "cho {n} em · {lớp}", không mở hồ sơ lớp sau khi tạo: `moHoSo={false}`) |
| **Sửa thông tin học viên** (StudentManagePanel / SuaThongTinMotEm / SuaCaLopPanel → PATCH `/students/:id`, `/cycles/:id`) | ⋯ dòng học viên · Hồ sơ HV ⋮ · Hồ sơ lớp ⋯ (cả lớp) · Công việc (missing_data, bổ sung hồ sơ) · Lưu trữ ⋯ · Lịch thi (ô ngày) | `Sửa thông tin` (một em) / `Sửa thông tin học viên` (cả lớp, bảng nhiều em, xem trước) / việc Công việc `Sửa thông tin` mở panel một em có `Lưu · em tiếp ›`. Thứ tự: ở ⋯ dòng nằm SAU vạch (việc hiếm), ở ⋮ hồ sơ nằm ĐẦU |
| **Tạm dừng / Kết thúc học / Quay lại học** | ⋯ dòng (TVV, CX, AD) · Hồ sơ HV ⋮ + đầu trang · Hồ sơ lớp chọn nhiều · Lưu trữ · PanelXetLai · Công việc sau thi | Tên: `Tạm dừng/ Kết thúc học` (một hộp, ô "Có thể quay lại học"), `Quay lại học`, Xét lại: `Tạm dừng` · `Kết thúc học`; API: POST `/students/:id/status` (một em) · POST `/hang-loat-hoc-vien` (nhiều) · POST `/students/:id/quay-lai` / `/hoc-lai` · Xét lại POST `/classes/:id/xet-lai` |
| **Gia hạn** (hạn Chọn bước tiếp → PUT `/cycles/:id/han-sau-thi`) | Hồ sơ HV đầu trang · Công việc dòng · Panel một em · PanelBuocTiep · KetQuaThiThatPanel | luôn `Gia hạn`; hộp HopGiaHan (`Hạn mới`, `Bỏ gia hạn`, `Lưu`) |
| **Kết quả thi thật / Chọn bước tiếp** | Hồ sơ HV ⋮ (`Kết quả thi thật`) · Hồ sơ HV tab Lộ trình (`Chọn bước tiếp ›`) · Công việc PanelSauThi · Panel một em (`Nhập kết quả`, `Chọn bước tiếp`) · ⋯ dòng TVV/CX/AD | tên khác nhau cho cùng PUT `/cycles/:id/outcome` + POST `/cycles/:id/buoc-tiep`; hộp riêng `KetQuaThiThatPanel` (hồ sơ) vs `PanelSauThi` (Công việc) |
| **Phân công GV** | Học viên & Lớp tab Phân công GV · Hồ sơ lớp ⋯ `Thông tin lớp` (phần phân công; link `?viec=phan-cong` từ badge Thiếu GV) · Công việc `no_owner` · Tổng quan PanelGvTre (link) | Tab: bảng nhiều lớp, `Lưu` → hộp HopLuuPhanCong (`Lưu mốc mới` / `Đổi mốc…` / `Quay lại sửa`) → POST `/phan-cong/luu`. Hồ sơ lớp / Công việc: panel một lớp, `Giao` → PUT `/classes/:id/teachers`. Hai API khác nhau cho việc "đổi GV một lớp" |
| **Xác nhận xử lý Ý thức** | ⋯ dòng HV · Hồ sơ HV tab Ý thức · Hồ sơ lớp tab Ý thức (lô) · Công việc (yt_xu_ly, yt_xem) | `Xác nhận xử lý` (một em: XacNhanXuLyPanel → POST `/students/:id/y-thuc/xu-ly`) · lô nhiều em (LoYThucPanel → POST `/classes/:id/y-thuc/lo/xu-ly`) · PanelXemViPham `Xác nhận xử lý` |
| **Xuất Excel** | Học viên & Lớp · Lịch Test · Hồ sơ lớp ⋯ · Phân tích Test + SOS · Kế hoạch Test · Phân tích KQ Thi thật / Ý thức · Báo cáo PH | Tên khác: `Xuất Excel` (danh sách HV: POST `/hoc-vien-lop/xuat`; Excel MT: POST `/xuat-mt`) · `Xuất kết quả từng lượt` (Phân tích) · `Xuất điểm Test` / `Xuất Excel` kế hoạch (POST `/ke-hoach-test/xuat-diem`, `/xuat`) · `Xuất` (Báo cáo PH). Cờ hiện khác nhau (`nav.xuatMt` vs không cờ) |
| **Xếp / Dời lịch Test** | Kế hoạch Test (`Xếp lịch Test…`, `Xếp nhiều MT…`, HopKyNang) · Hồ sơ Mock (`Dời lịch cả đợt`, `Xếp lịch`/`Dời lịch` từng kỹ năng) · ⋯ ô Lịch Test · Hồ sơ HV bảng lịch MT (`Xếp lịch`, `Dời lịch`) | cùng hộp HopThaoTacMt / HopKyNang; API KHÁC: Kế hoạch dùng `/ke-hoach-test/dot|xep-moi|hang-loat`; Hồ sơ Mock / ⋯ ô dùng `/attempts/:id/skills/:skill/week`; "Xóa lịch" dùng `/attempts/:id/bo-tuan` |
| **Duyệt yêu cầu / thẻ** | Công việc › Chờ bạn duyệt · Tổng quan khối Chờ duyệt (panel) · Hồ sơ HV (dải "n yêu cầu chờ bạn duyệt") · badge "chờ duyệt" ở lớp (chỉ link) · Hồ sơ GV (khối yêu cầu) | `Duyệt` / `Duyệt…` / `Từ chối…` / `Trả lời…` / `Hoàn tác`; Tổng quan chỉ mở panel + link `Mở ›` |
| **Thêm PA / Ghi kết quả PA / Xác nhận PA** | Ngăn Case (Hồ sơ HV, Hồ sơ lớp, `/hoc-thuat/case/:id`) · Công việc (Case học thuật) · thẻ Chờ duyệt | `+ Thêm PA`, `Ghi kết quả` / `Ghi kết quả cuối` / `Cập nhật trước hạn`, `Xác nhận PA` — cùng NganCase; Công việc thêm `Xác nhận PA lô` (POST `/interventions/xac-nhan-pa-lo`) khác API với từng PA (`/interventions/:id/xac-nhan-pa`) |
| **Giao việc** | Công việc `+ Giao việc` · Vận hành `+ Giao việc` · Báo cáo đơn vị `+ Tạo việc từ mục này` · `+ Việc con` | cùng hộp tạo; API khác theo loại: Việc chi nhánh POST `/mgmt-tasks`; Giao GV theo lớp + kỹ năng POST `/tasks` |
| **Phối hợp SOS** | Hồ sơ lớp tab Ý thức (phân đoạn Phối hợp) · Hồ sơ HV tab Ý thức · Công việc (phoi_hop_sos) · Hồ sơ Mock | `+ Thêm việc`, `Xác nhận`, `Bỏ việc…`, `Đưa lại Cần xử lý`, `Khôi phục` (PhoiHopSosSection, cột 1 khác: "luot" vs "hocVien") |
| **Mở Hồ sơ lớp / Cuối khoá** | ⋯ lớp (`Hồ sơ lớp`) · tên lớp (link) · ⋯ hồ sơ lớp `Cuối khoá…` · ⋯ dòng HV `Cuối khoá…` · badge `Cuối khoá ›` · Hồ sơ HV ⋮ `Cuối khoá…` | cùng đích `?xem=cuoi-khoa` |
| **Hoàn tác xoá / Khôi phục Thùng rác** | toast `Hoàn tác` (Case, PA, vi phạm, tệp, học viên) · Quản trị › Đã xoá `Khôi phục` | cùng POST `/thung-rac/:id/khoi-phuc`; riêng S Expert có `/s-expert/:id/khoi-phuc` |

---

## MỤC "LẠ KHI ĐỌC MÃ"

1. **Web hiện nút, máy chủ cấm**: ⋯ dòng HV `Xác nhận xử lý` — web chỉ cần `coTheGhiViPham` (mọi GV có phân công) + em cần xử lý; máy chủ `xacNhanXuLy` đòi `discipline.manage` (chỉ GVCN lớp, QL, QT) → GVm bấm sẽ 403 (`thaoTacDongHocVien.tsx:84` ↔ `yThuc/xuLy.ts:157`).
2. **Web ẩn, máy chủ cho**: ⋮ hồ sơ HV `Lộ trình` (đổi lộ trình / môn FT) web chỉ `canEdit` (GVCN, QL, QT) nhưng `duocDoiMon` còn cho TVV, CX (`student.edit_more`) (`quanLyHocVien.ts:82` ↔ `fasttrack/monDangKy.ts:51`).
3. **Web hiện, máy chủ chặn một phần**: TVV, CX có `+ Lớp mới` (`class.create`) nhưng chế độ "Nhiều lớp" kèm GV (slots) cần thêm `class.assign` → 403 (`intake.ts:739`); web không ẩn ô GV.
4. **Tutor**: `nav.tutor` true cho Head tutor, QL, QT và có đủ API `/tutors/*` + module `modules/tutor/*`, nhưng `KHU_VUC` không có mục menu và `/tutor/*` → `/` — Head tutor chỉ còn Tổng quan góc nhìn GV (không có thẻ gì). Chủ SP đã chốt AN-TUTOR; mã chưa dọn.
5. **API máy chủ không còn nút web gọi** (đối chiếu mọi `api.post/put/patch/del` + GET literal): `PATCH /cases/:id/follow-until`, `POST /cases/:id/followups`, `POST /students/:id/archive` · `/unarchive`, `POST /students/:id/cycles`, `POST /attempts/:id/cancel`, `PUT /cycles/:id/baseline`, `POST /ke-hoach-test/thi-lai`, `POST /attempts/scores/lo` · `/regular/scores/lo`, `PATCH /tasks/:id`, `GET /meeting/tutor-rollup`, `GET/PUT /students/:id/lo-trinh-tiep` · `/classes/:id/lo-trinh-tiep` (chỉ còn khoá menu cùng tên). Ngược lại: không thấy nút web nào gọi route không tồn tại (mọi lời gọi literal đều khớp một route).
6. **Cùng việc, hai API khác nhau**: (a) Giao việc `POST /mgmt-tasks` vs `POST /tasks` (cùng hộp `MgmtTasksPage`); (b) nhập điểm / vắng / huỷ điểm: FT `PUT /attempts/:id/scores/:skill` + `POST …/bao-vang` · `…/huy-diem` vs lớp thường `PUT /regular/attempts/:id/scores/:skill` {noShow / null} (cùng hộp `HopThaoTacMt`); (c) xếp / dời lịch Test: `/ke-hoach-test/dot|xep-moi` vs `/attempts/:id/skills/:skill/week`; (d) đổi GV một lớp: `PUT /classes/:id/teachers` vs `POST /phan-cong/luu`; (e) chuyển lớp: `/students/:id/transfer` · `/classes/:id/transition` · `/yeu-cau/:id/duyet`; (f) Quay lại học `POST /students/:id/quay-lai` vs `/hoc-lai` (em đã kết thúc); (g) sửa kỹ năng GV nằm dưới tiền tố admin `PUT /admin/accounts/:id/skills` nhưng QL cũng gọi được (Hồ sơ GV).
7. **Chú thích mã đã cũ**: `quanLyHocVien.ts` ghi `Xoá học viên` "chỉ Quản trị", `XoaKetThucLopPanel` / DauTrangLop ghi `Xoá lớp` "vẫn chỉ Quản trị" — thực tế `cycle.edit` / `class.edit` nên QL cũng xoá (OV-12a); `ROLE_PERMISSIONS.consultant` ghi "Không Test, không Công việc" nhưng `navOf.viecTvv` cho TVV khu Công việc riêng; `nav.ts` chú thích `xuatMt` "QL/QT + GVCN" nhưng AD cũng có (grant có `attempt.view` + `test.view`).
8. **Kế hoạch Test**: GV, GVS có tab (`testPlanXem`) nhưng chỉ xem; mọi đường ghi đòi `plan.week` (QL, AD, QT) — nút ẩn nhờ `nav.testPlan`, khớp. Lưu ý riêng: T6 → CN khoá xếp lịch kể cả QL/AD (trừ QT), QT bật "Mở sửa lịch Test" để mở.
9. **Phân công GV tab**: CX thấy tab (`coGocPc`) nhưng `class.assign` không thuộc CX → chỉ xem; web chỉ khoá bằng cờ `quyenPhanCongGv.sua` từ máy chủ (không dùng `can()` ở web).
10. **Admin (AD) vẫn sửa được điểm**: `office_admin` có `score.override` nên nhập / sửa điểm ngoài phân công; khu Công việc chỉ nhóm Chấm điểm; `Bỏ qua` việc mốc bị `boQuaViec` chặn (`phamViXemViec` khác `het`).
11. **Phạm vi GVS**: `navOf.gvS` mở Test + Công việc cho GV Speaking không có phân công lớp, nhưng "Học viên & Lớp" và Hồ sơ lớp vẫn đòi `student.view` theo phân công → GVS không có menu Học viên (chủ ý OV-14c).

---
Phương pháp: đọc `App.tsx`, `dieuHuong.ts`, `nav.ts`, `data.ts`, `permissions.ts`, `routes/index.ts` + các service; nút lấy từ `t('…')` quanh `<button>/MenuDong/KhungPanel` và bảng `thaoTacKyNang`, `mucMenuDongHocVien`, `menuHoSoLop`, `mucQuanLyHocVien`. Không chạy ứng dụng. Chỗ ghi "chưa kiểm sâu" = chưa đọc hết hàm máy chủ.
