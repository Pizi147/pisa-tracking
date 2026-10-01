# Rà #155 PR-Dọn-a — mức ĐẦY ĐỦ (Opus 5.5)

- Bản rà: `main` @ `df0d57cf`. Diff PR: `f872df73^1..f872df73`, gồm 15 commit. Tất cả commit có `Co-Authored-By: Claude Opus 5.5`, đúng model kế hoạch.
- Có 3 phép chứng minh chạy bằng `node --experimental-transform-types`, từng lần riêng, mỗi lần một DB seed tạm trong `scratchpad/ra-luot2/dona/proof/`. Không chạy `npm run check`. Không sửa worktree `ra6`.
- **Tổng: 1 P0 · 1 P1 · 10 P2.**

---

### [P0] `POST /tasks` (việc giao GV) ghi Case và PA vào học viên chi nhánh khác: máy chủ tin `classId`, `studentIds`, `branchId` do web gửi
- Chỗ: `server/src/worklist/meeting.ts:568-575` (`createTask`), `:513-528` (`fanOutToStudents`), `server/src/routes/index.ts:1863`.
- Lỗi: quyền chỉ kiểm `MEETING_EDIT` theo `branchId` do thân yêu cầu gửi (hoặc `anyScope` khi `branchId` null). Máy chủ không đối chiếu `classId` và `studentIds` với phạm vi người gọi, cũng không đối chiếu chúng với chi nhánh của việc. `fanOutToStudents` mở Case `in_progress` và ghi PA cho từng em.
- Tình huống (đã chạy, `proof/p2.mts`): QL MB gọi `createTask({ kind: 'teacher_task', classId: <CP FT 110>, topic: 'listening', title, branchId: MB })`.
  - Kết quả: 200. Lớp CP có thêm 5 Case (6 → 11) và 5 PA mới.
  - Bỏ hẳn `branchId` vẫn được 200, việc có `branch_id = NULL` ("Toàn hệ thống") và vẫn toả vào lớp CP.
  - `studentIds` không có trần, không bỏ trùng, mỗi em 3–4 câu trong một `BEGIN IMMEDIATE`. Một thân 12 MB giữ khoá ghi Turso rất lâu.
  - `followerIds` nhận id người dùng bất kỳ, không kiểm.
- Ghi chú: lỗi có từ trước PR. Bảng "Quét an toàn 244 đường" của kế hoạch chỉ ghi `/tasks` ở #26 (bấm đúp), bỏ sót lỗ này. Câu 1 = A của Dọn-b sẽ dồn mọi "+ Giao việc" vào đường này.
- Sửa:
  - Lớp của việc: `require_(MEETING_EDIT, { classId })`, và chi nhánh lớp phải trùng `branchId` của việc.
  - `studentIds`: lấy giao với ghi danh `active` của `classId`, hoặc kiểm `STUDENT_VIEW` từng em. Bỏ trùng, trần 500 (Q6), đọc qua `theoLo`.
  - `branchId` null chỉ cho Quản trị, hoặc chỉ khi `unitId` là đơn vị Tutor.
  - `followerIds`: chỉ nhận người hợp lệ trong phạm vi.
- Nguồn luật: kế hoạch Architecture "Giá trị do máy chủ tự tính… không đọc từ thân yêu cầu"; Global Constraints (Quyền); CHUNG §4.

### [P1] Case của em đã chuyển lớp: danh sách hiện theo lớp hiện tại, còn mở chi tiết và đóng Case vẫn kiểm theo lớp của lượt → thấy dòng nhưng mở ra 403
- Chỗ:
  - `server/src/cases/cases.ts:1767-1768`, `:1910`: `LOP_CUA_CASE` dùng lớp hiện tại;
  - `:281-298`: `loadCase`, `c.class_id = attempt_class_id ?? current`;
  - `:1405`: `caseDetail`;
  - `:273-275`: `canCloseCase` đã bỏ vế `MEETING_EDIT`;
  - `:2407`: `canClose` ở bảng kỹ năng tính theo lớp đang học.
- Lỗi: Q5 chỉ đổi `listCases`. `caseDetail`, `closeCaseOutcome` và `setDisposition` vẫn lấy lớp của lượt. `grantCovers` đòi mọi chi nhánh trong ngữ cảnh (lớp cũ cộng em) trùng grant. GVBM/GVCN thì `hasAssignment` xét lớp cũ.
- Tình huống (đã chạy, `proof/p1.mts`):
  - Em MB FT 101 có Case gắn lượt, chuyển sang MB FT 105 (cùng chi nhánh).
  - GVCN lớp 105 gọi `listCases({ classId: 105 })` thì thấy Case. Gọi `caseDetail` thì 403.
  - Trên web: bấm dòng → hồ sơ HV `?case=` → `NganCase` gọi `/cases/:id` → "Case này nằm ngoài phạm vi bạn được xem".
  - Với em chuyển **chi nhánh**: QL chi nhánh mới thấy dòng (phép kiểm 1c chỉ kiểm danh sách) nhưng mở ra 403.
  - Từ khi bỏ vế `MEETING_EDIT` ở `canCloseCase`: QL chi nhánh mới thấy nút Hoàn thành bật (`canClose` tính theo lớp đang học), bấm thì máy chủ trả 403.
  - Trước PR, danh sách cũng ẩn các Case này, nên hai đường khớp nhau. Nay hai đường lệch nhau.
- Sửa: dùng một biểu thức lớp cho mọi kiểm quyền trên Case. Hoặc `loadCase` dùng `COALESCE(lớp đang học, lớp của lượt)` cho quyền xem/sửa/đóng (giữ `attempt_class_id` để hiển thị). Hoặc lùi Q5. Thêm phép kiểm 1c vế "mở chi tiết + đóng được".
- Nguồn luật: Q5 ("QL chi nhánh mới và GVCN mới vẫn thấy Case cũ"); CHUNG §3 (số trên danh sách = dòng mở được).

### [P2] Badge "n HV chưa có lệnh chuyển lớp" ≠ số dòng có cờ ở bảng học viên khi em đã có "tiếp theo: …"
- Chỗ: `shared/domain/hocVienLop.ts:186-188` (`khoaLopThuong`: `tiepTheo` thắng `nhacLoTrinh`); `server/src/classes/classes.ts:126`, `:669`.
- Lỗi: badge đếm mọi em chưa có lệnh (`emChuaCoLenh`). Dòng của em mà GVCN đã ghi lộ trình tiếp theo lại hiện "tiếp theo: X", không hiện "chưa có lệnh chuyển lớp".
- Tình huống: lớp FOU tuần Cuối khoá, 7 em chưa có lệnh, 3 em đã có bản ghi "tiếp theo". Badge ghi 7, bảng chỉ có 4 dòng mang cờ.
- Sửa: dòng phụ ưu tiên cờ "chưa có lệnh chuyển lớp" khi lớp đang nhắc (hoặc ghi cả hai). Phép kiểm 10d thêm vế "số dòng có cờ".
- Nguồn luật: kế hoạch Task 10 (10d-B: "= số em có cờ ở bảng học viên của lớp").

### [P2] `pa-can-cap-nhat` và "Ghi kết quả PA" chọn PA đại diện của nhóm bổ trợ trên hai tập khác nhau
- Chỗ: `server/src/worklist/metrics.ts:401-404` (MIN id trên tập quá hạn `< hôm nay`, không lọc `NOT_UNCONFIRMED_PRESET`, `sc.status`); `server/src/worklist/mywork.ts:486-495` (MIN id trên tập hạn `≤ hôm nay`).
- Tình huống: nhóm bổ trợ có PA id 10 hạn hôm nay và PA id 11 quá hạn.
  - Chỉ số đếm 1 (id 11).
  - Công việc chỉ có `action:10`, mức "hôm nay", không có dòng quá hạn.
  - Kết quả: ô = 1, danh sách quá hạn = 0.
- Sửa: một hàm SQL/TS chọn đại diện nhóm, dùng chung cho hai đường, cùng điều kiện lọc.
- Nguồn luật: Task 6 (6c); HOP_DONG_SO_LIEU §1.

### [P2] `vuaGhi` gộp lặng lẽ hai bản ghi KHÁC nhau vì khoá thiếu trường
- Chỗ:
  - `server/src/worklist/mgmttasks.ts:450`: khoá thiếu `assignee_user_id`, `due`, `caseIds`;
  - `server/src/worklist/meeting.ts:590`: khoá thiếu `topic`, `studentIds`, `assignee`;
  - `server/src/cases/cases.ts:811` kết hợp `:3021-3026`: PA thay thế.
- Lỗi và tình huống: trong 10 giây, cùng QL tạo "Kiểm tra sổ" cho người A rồi cho người B. Lần hai nhận lại việc của A, báo thành công, B không có việc.
  - Giao việc GV cùng tiêu đề cho kỹ năng L rồi R cũng bị gộp tương tự.
  - Ở nhánh `propose` của `updateResult`: PA mới trùng loại và mô tả với PA vừa ghi trong 10 giây thì `created` lấy PA mới nhất, có thể chính là PA cũ. Khi đó `superseded_by` trỏ về chính nó.
- Sửa: đưa đủ các trường nghiệp vụ vào `khop`. Nhánh `propose` bỏ qua `vuaGhi`, như `backfill`.
- Nguồn luật: Task 3 (#26 "cùng người, cùng đối tượng, cùng nội dung").

### [P2] Q11 "một hàm chọn lộ trình" mới dùng ở Hành trình; ba nơi kia vẫn tự chọn
- Chỗ: `server/src/fasttrack/cycles.ts:43-49` (`loTrinhTinhTuan`). Chỉ `students/hanhTrinh.ts:310` gọi. `profile.ts:773` (`dangChay`), `transition.ts:66`, `luatLoTrinh.ts:366` vẫn dùng `cy.status='active'` riêng.
- Lỗi: khi em đang học mà không có lộ trình `active`, `loTrinhTinhTuan` rơi về "lộ trình bắt đầu muộn nhất trước ngày vào". Hành trình khi đó có "tuần học thứ n", còn đầu hồ sơ và panel Chuyển lớp không có.
- Sửa: ba nơi kia gọi `loTrinhTinhTuan(…, { dangHoc: true })`, hoặc bỏ nhánh rơi về khi `dangHoc`.
- Nguồn luật: Task 4 (Q11: "`profile.ts`, `luatLoTrinh.ts:366`, `transition.ts:180` gọi với `dangHoc: true`").

### [P2] `completeIntervention` còn sống dù route đã xoá; chỉ phép kiểm gọi
- Chỗ: `server/src/cases/cases.ts:1013`; nơi gọi duy nhất `server/src/tests/dieuChinhPa.tests.ts:358`.
- Sửa: xoá hàm cùng phép kiểm, hoặc ghi lý do giữ.
- Nguồn luật: Q14 / Task 7 ("Hàm dịch vụ chỉ xoá khi grep không còn nơi gọi ngoài route và phép kiểm").

### [P2] Task 9(f) không làm: `lopHocCua` vẫn tính `nhacLoTrinh` theo luật cũ
- Chỗ: `server/src/classes/loTrinhTiep.ts:184-201`. Luật cũ: hai tuần cuối và chưa ghi lộ trình. Web không đọc trường này.
- Lỗi: còn câu SQL thừa ở hồ sơ HV, và còn luật thứ hai trái Câu 2 = B. Hồ sơ đã ≤ 90 câu nên không chặn.
- Sửa: bỏ `tiepTheo`/`nhacLoTrinh` khỏi `lopHocCua` như kế hoạch.
- Nguồn luật: Task 9 (f).

### [P2] (9b) "JSON hồ sơ HV giống hệt" chỉ so một lần, không thành phép kiểm bền
- Chỗ: `server/src/tests/prDonA.tests.ts:706` (khối 9 chỉ có 9e/9f/9g); Nhật ký Task 9.
- Người rà đã tự kiểm: cùng một DB, mã trước và sau PR, 4 vai × 3 em (FT id 1, lớp thường id 8, Tạm dừng id 39). Kết quả **giống hệt từng byte** (`proof/prof.mts`). Không có lỗi dữ liệu. Chỉ thiếu khoá cho PR sau.
- Sửa: lưu ảnh chụp JSON vào phép kiểm, hoặc bỏ mục 9b khỏi danh sách "đạt".
- Nguồn luật: Task 9 (9b).

### [P2] Chữ tự do mới đi vào DB không qua `chuTuDo`
- Chỗ:
  - `server/src/fasttrack/cycles.ts:498`: `reviseTarget.reason`, nay cả PATCH `/cycles/:id` `lyDo` đi vào;
  - `server/src/classes/lenhChuyen.ts:530`: `guiDeXuatChuyenLop.lyDo`.
- Lỗi: không trần độ dài, không có câu báo "Tối đa n ký tự".
- Sửa: `chuTuDo(…, 'Lý do', 2000)`.
- Nguồn luật: Q4.

### [P2] `POST /ref/periods/resolve`: mọi người đăng nhập tạo được `report_periods` cho ngày bất kỳ
- Chỗ: `server/src/routes/index.ts:295-299`.
- Lỗi: không kiểm quyền, không kiểm cận năm. `0001-01-01` và `9999-12-27` đều được ghi. Lỗi có từ trước PR, bảng quét bỏ sót.
- Sửa: cận năm (`canNamGan`) và `requireAuth` kèm một quyền ghi (`PLAN_WEEK` hoặc `STUDENT_EDIT` bất kỳ phạm vi).
- Nguồn luật: CHUNG §4 (máy chủ không tin giá trị web).

### [P2] Chú thích lạc chỗ ở `week.ts`
- Chỗ: `shared/domain/week.ts:28-34`. JSDoc "Tháng sở hữu tuần…" nay nằm trên `tuanKetQuaCuaHan`, còn `owningMonthOf` mất chú thích.
- Sửa: dời chú thích về đúng hàm.

---

## Đã kiểm, không có lỗi
- **Quét #1** `createAttempt`:
  - lộ trình phải thuộc em (400);
  - lớp lấy từ ghi danh `active`, bỏ `classId` khỏi kiểu;
  - mọi nơi gọi (`keHoachTest.ts:562`, `pb2bSeed`, `prMtSeed`) không còn gửi `classId`;
  - route `POST /attempts` đã xoá.
- **#2, #4, #13, #22:** route và hàm đã xoá.
  - Grep `web/src`, `shared`, `netlify`, `scripts`, `tests` (gọi HTTP), `tocDoDuong`: không còn nơi gọi 21 route đã xoá. Web chỉ còn `invalidate('/overview')`, vô hại.
  - Quét lại `routes/index.ts`: 222 route. Route không có `principalOf`/`require_` chỉ còn: demo (404 trên bản chính), auth, `/ref/periods*`, `/intake/parse` (không đọc DB), `/ref/programmes`, `/ref/routes` (đã `requireAuth`).
- **#3** `visibleClasses` → `classScopeSql`. **#5** `caseIds` ≤ 50, `caseAccess().requireView`, việc cha `coQuyenViec`, `require_` sau khi tính `taskBranchId`.
- **#6/#25:** nhập bù `require_(SOS_REPORT)` ở dòng đầu; khoá kiểm trong `tx`; web gửi `idempotencyKey`.
- **#7** `/ref/nguoi`: `STUDENT_VIEW` trước `activeClassOf`; luôn lọc theo phạm vi.
- **#8** `listCases`: lọc, cột chi nhánh và `can()` dùng một biểu thức. Vế chi tiết và đóng Case lệch, xem P1.
- **#9** `/ref/users`, `/ref/teachers`. **#10:** progress `ATTEMPT_VIEW`, suggested-mocks `STUDENT_VIEW`, `/admin/routes` `ADMIN_CONFIG`. `/ref/routes` vốn đã không có `inUse`.
- **#11** `duyetNhieu`: 403 trước 400; mã sai dạng lỗi riêng từng dòng.
- **#12:** 9 chỗ 400 → 403 (absence ×4, cases ×2, mgmttasks ×2, meeting ×1).
- **#14, #16, #17:** trần mảng 500 / 200 / 50; `theoLo` ở `xepHangLoat`, `issueBoard`. Các `IN` còn lại dựng từ phạm vi hoặc lớp, không từ thân yêu cầu.
- **#19, #20:** ngày tương lai 400; `route ∈ activeRouteCodes()`; `POST /students/:id/cycles` chỉ lấy khoá cần.
- **#23, #24:** `chuTuDo` kiểm kiểu và trần, không cắt ngầm, có ở các chỗ trong danh sách.
- **#26:** `created_at` của 4 bảng ghi bằng `nowIso()`, so chuỗi ISO với `Date.now()−10 s` đúng định dạng. Khoá thiếu trường, xem P2.
- **#27:** `xoaNho()` sau `ROLLBACK` và `ROLLBACK TO`.
- **Q8 `HV_DANG_HOC_SQL`:** 34 chỗ thay bằng đúng chuỗi cũ (`s.status='active' AND s.archived_at IS NULL`), nên **không đổi nghĩa** chỗ nào. Các chỗ sĩ số `e.status='active' AND s.archived_at IS NULL` (có em Tạm dừng) giữ nguyên ở 9 tệp. Không có chỗ "tính cả em đã thôi học" nào bị lọc.
- **Q9:** `listAttempts` thêm `c.status='active'` cho `chiDangHoc`/`my_scores`. Ba nơi gọi (Công việc, Lịch Test, bảng lớp) cùng luật với Nợ điểm.
- **Q10** "Đề ra PA": `ownerId = owner_user_id`, `mine` đúng; khoá `support:{caseId}` trùng hồ sơ.
- **Q13:** `phanCongDangHieuLuc` dùng chung cho `teacherOf` (Nợ điểm), `ownersByClass` (Lịch Test), `ownerOf` (Công việc).
- **Q15/Q16/Q17/VN10/VN20:** `reviseTarget` có lịch sử; web không gửi `targetScore` qua PATCH. Ngày → tháng bỏ tuần cũ, panel gửi lại tuần cũ vẫn được bỏ. Cận năm chỉ khi khác tuần mặc định. MT lịch sử không duyệt dời. `hop` đệm năm 4 chữ số.
- **`ky_vong_dau_ra`:** `GROUP BY l.student_id` lấy `MAX(l.id)` (cột trần SQLite theo dòng MAX). Mỗi em một dòng, lớp là lớp nguồn.
- **Câu 2 = B:** badge và chỉ số dùng cùng `emChuaCoLenh` và cùng mốc `mocKetKhoa(...).tuCuoiKhoa`. Lệch số dòng có cờ, xem P2.
- **Hồ sơ HV ≤ 90 câu:** gom `diem:`/`bo-mon:`, `dongHocVien`, `activeClassOf`, `cyclesOf`/`currentCycle` (cùng thứ tự chọn với `ORDER BY (status='active') DESC, seq DESC`), `periodById`, `programmeCodeOfCycle`. JSON trước/sau **giống hệt** (người rà chạy lại).
- **Turso:** không có tham số đặt tên trong diff; ghi nhiều dòng đều trong `tx()` (`BEGIN IMMEDIATE`); không thêm UNION.
- **Cổng gộp:** `git diff f872df73 df0d57cf` trên `cases.ts`, `attempts.ts`, `mywork.ts`, `metrics.ts`, `loaiYeuCau.ts`, `profile.ts`, `oNgay.ts`, `week.ts` chỉ có phần UXF-b (bỏ `supportLineOf`/`scheduleHeadline`/`weekCodeShortOf`, `duongDotTest`, `href` kỳ vọng). Mọi khối Dọn-a còn nguyên: `chuTuDo`, `vuaGhi`, `LOP_CUA_CASE`, `HV_DANG_HOC_SQL`, `hop` đệm năm.
- **Task 8:** `newClass`/`builtin`/`code`/`route` cũ đã bỏ; web không gửi các khoá đó. `TruongDeXuat` một bản. `CaseRoutePage` chỉ chuyển hướng.
- **Task 10:** seed hạn Thứ Hai, câu demo Q27, khoá Q28 có phép kiểm.

## Chuyển cho PR khác
- **P0 `POST /tasks`:** cần sửa trước DEPLOY. Hợp lý nhất là ở **Dọn-b**, vì Câu 1 = A dồn "+ Giao việc" vào đường này. Cách khác là một PR sửa nóng máy chủ.
- **P1 lớp của Case:** planning chốt một luật cho mọi kiểm quyền trên Case: Q5 mở rộng cho `loadCase`/`caseDetail`/đóng Case, hay lùi Q5.
- **Tốc độ:** `/classes/6/overview` lớp thường mới đo đúng lớp, trần 97/93/100, sát trần cứng 100. Ghi theo dõi cho PR-DEPLOY / sau deploy, kèm khoảng 20 lời gọi `invalidate('/overview')` còn ở web cho PR-S3 (đã có trong kế hoạch).
- **(9b):** thêm phép kiểm JSON bền ở Dọn-b nếu muốn khoá.
