# Rà #157 PR-UXF-b (mã tuần + việc sót) — người rà Opus 5.5

Mã: `main` @ `df0d57cf` (worktree `scratchpad\ra6`). Mức: ĐẦY ĐỦ cho Task 9–10, GỌN cho phần còn lại.
Phép thử lẻ (`npx tsx`, foreground) để ở `ra-luot2\thu\tuan.ts`, `vn20.ts`. Không chạy `npm run check`.

Tổng: **P0: 0 · P1: 2 · P2: 7**

---

## Task 10 (R5-5) — Case của lớp trước giữ tên môn lớp đó

### [P1] Nhóm "Từ lớp trước" dựa vào `sos_cases.attempt_id` nên không giữ được: Case tay không bao giờ vào nhóm, còn Case G+V quay lại hàng Writing ngay khi em trượt Writing ở bài Giữa khoá BE
- Chỗ: `server/src/cases/cases.ts:2204-2205` (`ct_attempt`, `lop_attempt` đọc theo `sos_cases.attempt_id`), `:2267-2270`. Thêm `server/src/normal/regular.ts:794-829` (`taoCaseGiuaKhoa`) và `server/src/cases/cases.ts:584` (Case tay ghi `attempt_id` NULL).
- Lỗi: muốn biết Case "thuộc lớp nào", mã đọc lớp của **lượt mới nhất đã chạm Case**. Nhưng `attempt_id` là con trỏ thay đổi theo thời gian (chính `regular.ts:793` ghi rõ "attempt_id chỉ trỏ lượt mới nhất"), và với Case tay thì nó là NULL.
- Tình huống:
  1. Em FOU có Case G+V tự tạo. Em lên BE: `chuyenCaseSangLoTrinh` dời Case sang lộ trình BE (`systemClose.ts:151`). Bảng kỹ năng xếp Case vào "Từ lớp trước" — đúng.
  2. Bài Giữa khoá BE của em trượt Writing. `taoCaseGiuaKhoa` tìm Case đang mở theo (em, lộ trình BE, `category='writing'`) và **gặp đúng Case G+V**. Nó ghi mốc "Trượt lại", nối tín hiệu Writing vào Case G+V và `UPDATE sos_cases SET attempt_id = <bài BE>` (`regular.ts:814-820`). Từ đây `ct_attempt = 'BE'`, nên Case G+V **trở lại hàng Writing**, tên "Writing". Nhóm "Từ lớp trước" biến mất. Việc trượt Writing ở BE bị nhập vào Case G+V của FOU.
  3. Case G+V do GV tự báo ở FOU (QuickReport, `attempt_id = NULL`) có `ct_attempt = NULL`. Điều kiện `c.ct_attempt && …` sai nên Case nằm ở hàng Writing của BE ngay từ đầu, đúng lỗi R5-5 mô tả.
  4. Phép kiểm `UXF-b (10)` chỉ chọn Case có `attempt_id` (JOIN `assessment_attempts a ON a.id = sc.attempt_id`), nên không gặp ca 2 và ca 3.
- Sửa: lấy chương trình gốc của Case từ một nguồn **không đổi**. Cách không cần migrate: chương trình lộ trình lúc tạo Case, đọc từ mốc `route_changed` đầu tiên (`case_milestones`) hoặc lớp của tín hiệu đầu tiên (`MIN(case_signals.id)`). Với Case tay, nguồn là lộ trình cũ trước mốc chuyển. Trong `taoCaseGiuaKhoa`, khi Case đang mở có tên môn gốc khác tên môn của lớp hiện tại thì **không nối vào**, mà mở Case mới. Vế này đổi luật Case đi theo em, nên cần chủ sản phẩm chốt.
- Nguồn luật: kế hoạch Task 10, Câu 3 = A ("Case của lớp trước mà tên môn khác … nhóm riêng"), Q3 kiểm kê R5-5. Việc gộp theo `category` qua chuyển chương trình đã có từ PR-LT2a. Task 10 chỉ sửa phần hiển thị nên lỗi gốc vẫn còn.

### [P1] Ngăn Case và màn danh sách Case vẫn gọi Case G+V là "Writing", khác bảng kỹ năng
- Chỗ: `server/src/cases/cases.ts:1532` (`ctCase` = chương trình của lộ trình Case = BE sau khi chuyển), `:1554` `topicLabel`, `:1557` `categoryLabel`, `:1579` `categories` (bộ nguyên nhân); web `students/NganCase.tsx:102` (`kyNang={data.categoryLabel}`).
- Lỗi: bảng kỹ năng ghi "G+V · từ MB FOU 12". Bấm vào Case đó, Ngăn Case lại ghi "Writing", và panel Xác nhận nguyên nhân hiện bộ nguyên nhân Writing của BE. Riêng `listCases` (`:1816` `class_ct` theo lớp của lượt) thì ghi "G+V". Một Case có hai tên trên hai màn.
- Tình huống: em FOU có Case G+V mở → lên BE → mở hồ sơ, bấm Case trong nhóm "Từ lớp trước" → đầu ngăn ghi "Writing", Xác nhận nguyên nhân ghi "Writing".
- Sửa: dùng **một** hàm "chương trình hiển thị của Case" (cùng nguồn với phát hiện trên) cho `skillSupportBoard`, `caseDetail` và `listCases`.
- Nguồn luật: Câu 3 = A ("tên môn theo chương trình của lớp Case"), luật số liệu "một hàm, một nguồn" (CHUNG mục 3).

### [P2] Nghi ngờ: người phụ trách Case G+V sau khi lên BE là GV Writing của BE
- Chỗ: `server/src/normal/cuoiKhoa.ts:240-245`. `suggestCaseOwner({ classId: <lớp BE>, category: 'writing' })` gán chủ Case = GV ô `writing` của lớp mới.
- Lỗi: PR không đổi luật này (có từ S5F-a, M-04 "chủ Case = GV đúng môn lớp MỚI"). Nhưng R5-5 coi G+V ≠ Writing, nên Case nằm nhóm "G+V · từ MB FOU 12" mà người phụ trách lại là GV Writing của BE.
- Tình huống: em FOU (Case G+V do GV L·R·G+V phụ trách) lên BE → chủ Case thành GV Writing BE.
- Sửa: chủ sản phẩm chốt. Hoặc giữ như hiện nay (G+V bàn giao cho GV Writing), hoặc giữ chủ cũ cho Case "Từ lớp trước".
- Nguồn luật: yêu cầu rà "lớp mới không bị gán sai người phụ trách"; Câu 3.

### [P2] Phép kiểm Task 10 yếu hơn kế hoạch
- Chỗ: `server/src/tests/prUxfB.tests.ts:367` (`tongCase(b) >= 1`), `:377-389`.
- Lỗi: kế hoạch đòi kiểm "Σ Case trên bảng không đổi". Phép kiểm chỉ kiểm "≥ 1". Phép kiểm phủ định chỉ kiểm GV lớp BE khác bị chặn cả bảng, điều vốn đã đúng trước PR. Không có ca Case tay, cũng không có ca trượt lại Writing ở BE (hai ca của phát hiện P1 đầu).
- Sửa: so Σ Case trước và sau khi chuyển. Thêm hai ca của P1.
- Nguồn luật: kế hoạch Task 10, "Phép kiểm".

---

## Task 9 (R5-4) — Báo phụ huynh theo Case

Đã lần theo mọi đường tạo, xoá và hồi việc `bao_ph_tvv` (xem mục "Đã kiểm"). Luật đúng Câu 2 = A. Không thấy việc trùng, việc mồ côi, hay việc đã làm bị đổi trạng thái. Còn một chỗ:

### [P2] Việc Báo PH ĐÃ LÀM vẫn bị đổi "4 nội dung" khi Case được duyệt "Không cần theo dõi" sau đó
- Chỗ: `server/src/yThuc/phoiHop.ts:264` (`boBaoPh`), `:281-288` (`tinh`, `noiDungBaoPh`), `:296` (gắn `noiDung` cho mọi dòng `bao_ph_tvv`, kể cả `done`).
- Lỗi: 4 nội dung không lưu lại mà tính lại mỗi lần đọc, và giờ trừ thêm môn "Không cần theo dõi" bất kể thời điểm. Trạng thái `done` được giữ, nhưng **nội dung đã báo** của việc đã làm bị viết lại.
- Tình huống: bài Giữa khoá trượt R và G+V → GVCN báo PH cả hai môn, đánh dấu đã làm → tuần sau Quản lý duyệt "Không cần theo dõi" cho Case G+V → mở Phối hợp, việc đã làm giờ ghi "Môn khó khăn: R". Hồ sơ không còn khớp với những gì đã báo phụ huynh.
- Sửa: với dòng `done`, chỉ trừ môn có Case đóng **trước** `performed_on`. Cho `monBoKhoiBaoPh` trả thêm `closed_at` (cùng câu, không thêm câu SQL).
- Nguồn luật: Câu 2 = A ("việc đã làm giữ nguyên"); đề rà "việc đã làm thì giữ nguyên".

---

## Mã tuần (GỌN)

### [P2] `docTuanLich`: cuối năm gõ "W1 JAN" nhảy về tháng Giêng của năm hiện tại, tức là lùi một năm
- Chỗ: `shared/domain/hienThiNgay.ts:42` (`nam = owningMonthOf(mondayOfDate(h)).year`).
- Lỗi: mã tuần không ghi năm được hiểu là năm hiện tại. Cuối tháng 12, người dùng gõ "W1 JAN" để chỉ tháng Giêng sắp tới, nhưng được tuần cách đó một năm.
- Tình huống (đã chạy `thu/tuan.ts`, `thu/vn20.ts`):
  - `homNay = 2026-12-28`, ô tuần có `toiThieu` hôm nay, gõ "W1 JAN" → lỗi "Không được trước W5 DEC". Câu lỗi khó hiểu, vì người dùng đang gõ tuần sau chứ không phải tuần trước.
  - Ô không có `toiThieu` (ví dụ Phân tích "Đến tuần") → lặng lẽ nhận 29/12/2025.
  - Gõ "W5 SEP" (tuần không có thật) → báo câu chung "Gõ mã tuần như W4 SEP…", không nói rằng tháng 9 chỉ có 4 tuần.
- Sửa: khi không ghi năm, chọn năm làm tuần gần `homNay` nhất (±6 tháng). Thêm câu lỗi riêng cho tuần không có thật.
- Nguồn luật: Q6 (đúng chữ Q6, nhưng là bẫy; báo để planning quyết).

### [P2] Ô tuần mời gõ "W4 SEP" mà bàn phím điện thoại chỉ có số
- Chỗ: `web/src/ui/ONgay.tsx:67` (`inputMode="numeric"`; placeholder "W4 SEP hoặc dd/mm" ở `:68`), `web/src/ui/LichNho.tsx:218` (`inputMode="numeric"`, placeholder "W4 SEP hoặc 28/09").
- Lỗi: ở 375 px, `inputMode="numeric"` mở bàn phím số, không gõ được chữ W, S, E, P.
- Sửa: `inputMode={kieu === 'tuan' ? 'text' : 'numeric'}`. Ô của `LichNho` thì luôn dùng `text`.
- Nguồn luật: Q6 ("gõ được cả `W4 SEP` …"), kiểm 375 px.

### [P2] Còn mã tuần kèm năm hoặc thiếu `homNay` trên màn (bảng B5 bỏ sót)
- Chỗ:
  - `web/src/modules/fasttrack/HopThaoTacMt.tsx:102`: toast báo vắng lớp thường "dời sang ${r.tuanMoi}", trong đó `tuanMoi = moi.code` từ `server/src/normal/regular.ts:716`, nên ra "W4 SEP 2026".
  - `HopThaoTacMt.tsx:105`: `tuanLich(r.tuanMoi)` thiếu `homNay`, nên tuần năm sau không có năm.
  - `server/src/fasttrack/absence.ts:565`: lỗi "Tuần W4 SEP 2026 đã bắt đầu…".
  - `server/src/platform/week.ts:243`: "Tuần W3 SEP 2026 chưa bắt đầu…", hiện ở `MeetingPage.tsx:145` qua `ew.reason`; cùng câu ở `worklist/meeting.ts:294`.
- Lỗi: `period.code` (khoá dữ liệu có năm) đưa thẳng lên màn — kế hoạch đã ghi "Cấm". Không chỗ nào trong số này có trong B5.
- Sửa: `tuanLich(week_start, demoToday())` ở máy chủ. Web dùng `tuanLich(x, homNay)`.
- Nguồn luật: kế hoạch "Cấm: `pr.code` … đưa thẳng lên màn"; Global "không mã thô trên màn".

### [P2] Dòng "Tạm dừng từ" mới (Q13) dùng bộ định dạng ngày cục bộ
- Chỗ: `shared/domain/hoSoHocVien.ts:267` gọi `ngayNgan` (`:165`, tự cắt `slice(8,10)/slice(5,7)`).
- Lỗi: thêm một chỗ dùng bộ định dạng ngày thứ hai thay vì `ngay(d, homNay)`. Ngày Tạm dừng ở năm khác không có năm.
- Sửa: `ngay(tamDungTu, homNay)`. Nếu không có `homNay` thì truyền vào `oHocThuat`.
- Nguồn luật: Global "Một hàm mã tuần/ngày"; quét `slice(8,10)`.

---

## Đã kiểm, không có lỗi
- **Task 9 · đường chạy chính:** `refreshRegularOutcome` → `dongBoBaoPh(a, monBaoPh(...))` chạy sau `taoCaseGiuaKhoa`. Môn trượt chưa có Case vẫn tính (đúng lựa chọn ghi trong thân PR).
- **Task 9 · duyệt "Không cần theo dõi":** `apDungKhongTheoDoi` là nơi duy nhất ghi `dismiss_reason_code`. Hàm chạy trong giao dịch của hộp duyệt, đồng bộ mọi bài nối với Case qua `case_signals`, nên Case được duyệt muộn cũng chạy đúng.
- **Task 9 · Case FT:** Case FT được duyệt "Không cần theo dõi" thì `dongBoBaoPhCuaBai` thoát luôn (`kind !== 'progress'`).
- **Task 9 · sửa điểm:** sửa điểm lên đạt → Case bị rút, môn không còn trượt nên tự rời việc. Sửa lên rồi sửa xuống lại: `raiseSignal` mở lại tín hiệu với `case_id = NULL` (`signals.ts:95-97`), Case mới được tạo, môn tính lại. Không dính Case cũ đã rút hay đã "Không cần theo dõi".
- **Task 9 · huỷ lượt:** dòng ghi `system_luot_huy` (`attempts.ts:1247`) không bị hồi, vì `dongBoBaoPh` chỉ hồi dòng `system_sos_changed`.
- **Task 9 · việc đã làm và việc trùng:** `done` không bị đổi trạng thái. Mỗi bài chỉ có một dòng (tìm theo `attempt_id + kind`), chạy lặp không sinh dòng thứ hai.
- **Task 9 · đóng tự động:** Case đóng vì kết thúc khoá hoặc đổi chương trình (`system_close_reason`) không làm môn rời việc — đúng Câu 2 = A (chỉ bỏ khi "Không cần theo dõi" hoặc rút vì sửa điểm).
- **Task 9 · Cuối khoá và các đường khác:** Báo PH Cuối khoá (`cuoiKhoa.ts:367`) không bị ảnh hưởng, vì Cuối khoá không sinh tín hiệu. Tạm dừng và KCK không có đường riêng chạm Báo PH.
- **Task 9 · SQL:** `monBoKhoiBaoPh` dùng một câu `theoLo`, chỉ tham số `?`.
- **Task 10 · bảng kỹ năng:** Σ Case giữ nguyên (mỗi Case đúng một hàng; `oNgoai` và hàng chuẩn đều loại `tuLopTruoc`). L, R giữ hàng. Hàng "Từ lớp trước" không mượn điểm của lộ trình mới.
- **Task 10 · các nơi đọc bảng:** `tenKn` ở `profile.ts:390` không bị đè. `viecHocVien` dùng `r.label` nên ghi "G+V". Khoá chọn hàng `khoaHang` tách được hàng chuẩn và nhóm cũ.
- **Task 10 · SQL và số đếm:** không thêm câu (hai subselect). Truy vấn đếm Case ở Tổng quan và Phân tích không bị PR chạm nên số không đổi nghĩa.
- **Mã tuần · `docTuanLich`:**
  - đi rồi về khớp mọi Thứ Hai từ 29/12/2025 tới 03/01/2028, thử với 3 giá trị `homNay`: 0 lỗi;
  - nhận chữ thường và khoảng trắng thừa ("  W4   SEP  ");
  - W5 DEC ra 28/12, W5 OCT ra 26/10, W1 JAN ra 29/12/2025 (đúng luật Thứ Năm);
  - W0, W6, W5 SEP, "W1 SEPT", "W4SEP" đều ra null.
- **Mã tuần · ô chọn tuần:** `hienONgay` ra `W4 AUG`, `phuONgay` ra `24/08 – 30/08`. `docONgay` nhận cả `W4 SEP` lẫn `23/09`, giữ `chotTuan` (`moc="cuoi"`). Câu lỗi khoảng nói mã tuần.
- **Mã tuần · năm (VN20 của Dọn-a):** còn nguyên sau cổng gộp (`oNgay.ts:17-21` `padStart(4)`; `docONgay('28/09/0208')` báo câu cận năm; phép kiểm `prDonA (4c)` còn).
- **Mã tuần · nơi gọi:** `ONgay` truyền `homNay` ở cả 3 chỗ gọi `hienONgay`. Ô "Gõ tuần" của `LichNho` chỉ bật cho `WeekPicker` (kiểu tuần).
- **Mã tuần · dọn bộ định dạng:** đã xoá `weekCodeShortOf`, `weekLabel`, `formatDateVi`, `rangeOf` và các hàm `dm` cục bộ (git grep sạch).
- **Mã tuần · chỗ phải giữ ngày:** không bị đổi nhầm — hạn (`<Han>`), "Đã xin Quản lý hỗ trợ dd/mm" (chuyển sang `DongXinYKien` vẫn dùng `ngan`), "xác nhận dd/mm" ở dải chuyển lớp, ngày thi `KetLuanKhoa`, lịch sử Ngăn Case, "Tạm dừng từ", `MeetingPage` hạn nộp.
- **G5 · `attemptHref`:** tương đương bản cũ với mọi tổ hợp `kind`/`classId`. Đường cũ `/mock-test/:id` và `/bang-diem-thuong/:id?kind=` giữ nguyên, nên link cũ không gãy. `kn` lọc qua `KY_NANG_HOP_LE`; lớp thường bỏ `kn`.
- **G5 · neo Kết luận khoá:** `muc=ket-luan-khoa` đi rồi về khớp, giá trị lạ bị bỏ. `id="ket-luan-khoa"` chỉ vẽ một lần (`StudentDetailPage.tsx:290`). Việc `ky_vong_dau_ra` có `muc` và `lo-trinh` (một câu `theoLo`).
- **K2-26:** chưa từng có nút, route hay việc "Ghi hướng cho cả lớp" (git grep sạch), nên không có gì treo lại. Dữ liệu `lo_trinh_tiep_theo.huong` (`chua_ro`, `xep_sau`) vẫn được đọc như cũ, không sập.
- **Task khác (gọn):** U5 thẻ Lịch thi dùng `tuanLich(week_start, ngu.homNay)`. VN26 `tuChoi` không thêm câu. O2 `soViPhamMo` một nguồn. VN28 bỏ `boTienTo`. O1 `xinYKien`: một câu cho cả bảng, rỗng thì không gọi.

## Chuyển cho PR khác
- **Planning / chủ sản phẩm:** luật gốc của R5-5 — `taoCaseGiuaKhoa` gộp Case theo `category` qua chuyển chương trình (Writing BE nhập vào Case G+V FOU), và người phụ trách Case "Từ lớp trước" (P1 đầu, P2 người phụ trách).
- **PR-Dọn(-b):** badge "chưa có lộ trình tiếp theo" (`nhacLoTrinh`, `loTrinhTiep.ts:195`, `classes.ts:113`). Câu 1 = A nên badge cũng nên bỏ (kế hoạch đã giao Dọn).
- **PR-Dọn(-b):** `StudentsPage.WorkQueue` cùng `caseFollowUp` ("Đã hỗ trợ · dd/mm" tự cắt chuỗi ở `attempts.ts:156`) và `pendingWeeks` — mã chết, B5 #11 và #19.
- **PR-S3 hoặc Dọn-b:** mã tuần có năm còn sót (P2 "bảng B5 bỏ sót").
- **Nghi ngờ (có từ trước, không phải lỗi của PR):** thông báo `schedule_move`/`tu_doi_lich` gọi `duongDotTest({ id })` không có `kind`, nên lượt lớp thường vẫn mở `/mock-test/{id}` (`duongHoSo.ts`, trước PR cũng vậy). Cần kiểm hồ sơ Mock có chuyển sang bảng điểm lớp thường không.
