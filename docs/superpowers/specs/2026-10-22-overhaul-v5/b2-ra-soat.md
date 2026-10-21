# V5-B2 — Rà soát mã: Test · Hồ sơ lớp · Học viên & Lớp · Hồ sơ HV

> Pha 1 của V5-B2 (prompt `prompt-cloud-v5.md`). Đọc mã trên `main` e3965ae (21/10; #500 BANG-0 và #503 LUAT-34 đã merge, #505 BANG-1 chưa merge).
> Đọc mã, chưa chạy app; dẫn `tệp:dòng`. Nhãn: **[ĐÃ KIỂM]** = đọc trong mã · **[BRIEF]** = yêu cầu đã chốt (C.. / T..) · **[ĐỀ XUẤT]** = hướng mockup V5 · **[CẦN XÁC MINH]**.

## 1. Test (`web/src/modules/test`, `cham`, `fasttrack`; `server/src/fasttrack`)

**Hiện trạng [ĐÃ KIỂM]**
- Trang Test có 2 tab: "Lịch Test / Chấm Test" và "Kế hoạch Test" (`shared/domain/dieuHuong.ts:112`). **Chưa có** tab "Tình trạng chấm" — chỉ mockup V4 có (`mockup-v4-cham-test-truy-vet.md:27`).
- Lịch Test: chọn tuần (WeekPicker, `LichTestTab.tsx:263`) + công tắc FT / Lớp thường (:267) + "Lớp tôi dạy | Tất cả" (:282) → dải 3 số (`lichTest/DaiSo.tsx:20-31`) → **ba khối** "Test quá hạn chấm" · "Test chấm tuần này" · "Lịch Test tuần này" (`KhoiNo.tsx:98`, `LichTestTab.tsx:380-381`; luật chia `chamDiem.ts:37-42`). Chấm nằm trong khối, xếp theo lớp, không gom theo hạn.
- Speaking chấm chéo: chỉ Mock (`chamDiem.ts:45`); người chấm = GV có `score.edit` + kỹ năng S ở hồ sơ (`user_skills`) **hoặc** phân công S ở lớp FT; phạm vi mọi lớp FT của chi nhánh trong grant (`server/src/permissions.ts:276-296`). Bài hiện từ thứ Hai tuần thi (`chamDiem.ts:50`). **Không có nhóm Speaking trên trang Test**; hàng "Chấm Speaking · n bài" nằm ở Công việc (`gopViec.ts:43-45`).
- Nợ điểm = ô (kỹ năng × lượt) đã tới tuần thi, chưa band, chưa "-" (`server/src/worklist/scoreDebt.ts:111-115`); gán GV phân công hiệu lực; ô S Mock chấm chéo **không là nợ của ai** (:113-115) → T03 đã đúng ở máy chủ.
- Quyền nhập điểm (`server/src/seed/data.ts:49-110`): GV `score.edit` siết đúng lớp + môn (`permissions.ts:360-365`); QT, Admin VP `score.override`; QL không có `score.edit` nhưng sửa được qua đường override nhờ `PLAN_WEEK` (`permissions.ts:612-619`); MT cũ: QL / GVCN qua `lich_su` (:617). → Mockup: QL / Admin thấy khu chấm **sửa được** (cùng quyền, cùng hành vi mọi lối vào — brief mục 4).
- Lưu điểm Mock: hộp có "Lưu" và "Lưu · em tiếp ›", Enter = em tiếp; đóng khi đã gõ thì hỏi "Bỏ · Gõ tiếp" (`HopNhapDiem.tsx:289-327, 478-479, 516-597`). Lớp thường: tự lưu khi rời ô (`ScoreEntry.tsx:846`) → hai cơ chế lưu khác nhau trên cùng trang.
- Nhận xét bắt buộc ≥ 10 ký tự (Mock, trừ MT cũ) + nhóm nguyên nhân khi dưới kỳ vọng (`shared/domain/nhanXet.ts:37-53`); thiếu → tắt Lưu (`HopNhapDiem.tsx:265-268`) + 400 ở máy chủ. Nhưng dữ liệu cũ **có band, thiếu nhận xét vẫn tính xong** vì nợ chỉ xét band (`scoreDebt.ts:112`).
- W1 / W2: hai cột nhập riêng + W tính sẵn (`cham/LuoiFT.tsx:190-195, 309`); W = (W1 + 2·W2)/3 làm tròn 0,5 (`server/src/fasttrack/scoring.ts:41-47`); Overall = TB 4 band khi đủ 4 kỹ năng (:229-232).

**MT4 — chỗ mã gợi ý / sinh việc (C20, T04)** [ĐÃ KIỂM]
- Mặc định 3 MT: `MOCK_FT_DEFAULT_ATTEMPTS = 3` (`shared/domain/fasttrack.ts:21-27`); máy chủ **không tự tạo** MT4 (`server/src/fasttrack/mtMacDinh.ts:14`, `server/src/classes/schedule.ts:64`). Tối đa MT8 (`lichMt.ts:17`).
- Còn **gợi ý** cần bỏ:
  1. Dòng tóm tắt lớp "MT4 chưa xếp k em" — `tomTatLopFT` (`shared/domain/keHoachTest.ts:225-231`), số từ `server/src/keHoach/keHoachTest.ts:115-126`.
  2. Nút "+ xếp" ở ô MT kế tiếp của lưới Kế hoạch (`server/src/keHoach/keHoachTest.ts:334-339, 366`) — giữ cho QL thêm tay, nhưng sau MT3 phải là thao tác chủ động, không nổi như việc còn thiếu.
  3. Chỉ số / việc nhắc `hv-ft-xong-mt-cuoi-chua-mt-ke` "học viên FT xong MT3, chưa có MT kế tiếp" (`shared/domain/tongQuan.ts:118`, `shared/domain/metrics.ts:262`, `server/src/worklist/metrics.ts:868-880`) + cột "Chưa lịch Test" (`server/src/worklist/bangChiNhanh.ts:203, 219`) → **đây là chỗ "tự sinh việc MT4"**; V5 bỏ (xong MT3 = "Xong 3 MT").
  4. "MT mới" (`dotMtMoi`, `keHoachTest.ts:274-279`) và "Tạo MT4 · W…" (`chuSeXep`, :284-296) — giữ, đó là QL thêm tay.
- Lưu ý: trong mã, mã "C20" ở `keHoachOv15c.ts:10` là luật ghi năm vào tuần — **không** phải C20 của brief.

**Chuỗi "-" (T05) — giữ đúng #503** [ĐÃ KIỂM]
- `chuyenVang` (`shared/domain/vang.ts:19-24`): MT cũ **hoặc** đã có ≥ 1 lần vắng trong chuỗi → huỷ; lần đầu → dời sang tuần kế, tuần đó đã qua / vướng thứ tự → thẻ "Dời lịch Test" gửi QL.
- MT cũ = `lich_su` (tuần thi cách hiện tại ≥ 2 tuần, `lichMt.ts:55-57`): "-" → "Đã huỷ" ngay, chuông "để biết" cho QL, Hoàn tác 10 s (máy chủ +5 s) (`attempts.ts:2131-2155`, `vang.ts:27-30`).
- Chuỗi đếm bằng `absence_move_count` theo kỹ năng × đợt, xuyên tuần; gõ lại cùng tuần không làm gì (`attempts.ts:2117-2118`); Writing cần đủ 2 task mới có hiệu lực (:2120-2126).

**Vấn đề → V5**
- Ba khối + dải số + công tắc ⇒ **4 nhóm theo hạn** (C14): Quá hạn → Hạn tuần này → Bài thi Speaking tuần này (mở) → Hạn tuần sau (gập, ghi số bên ngoài). Nhóm Speaking dùng **tuần thi**, không phải tuần hạn.
- Lịch: một tuần + ‹ › (C13); QL / Admin thấy cột tiến độ chấm ngay trong lịch: chưa tới hạn = trung tính, quá hạn còn thiếu mới đỏ (T14).
- Một cơ chế lưu cho khu chấm: "Lưu" ở lại · "Lưu và tiếp"; bài thiếu nhận xét bắt buộc hiện "Thiếu nhận xét", không tính xong [ĐỀ XUẤT — máy chủ hiện vẫn tính xong với dữ liệu cũ: ghi cho V5-C].

## 2. Hồ sơ lớp (`web/src/modules/classes`, `yThuc`)

**Hiện trạng [ĐÃ KIỂM]**
- Đầu trang dày: nhãn "Hồ sơ lớp" + h1 + 3 nút + dòng chi nhánh · LT · n HV · W n/tổng · khai giảng + "Final Test du/tong" + hộp GVCN + dòng GV bộ môn + tối đa 2 badge "+n" + dải Kết thúc / Bàn giao (`DauTrangLop.tsx:151-249`).
- Tab: Tổng kết (lớp đã kết thúc) · Học viên · Ý thức & Phối hợp · Phân tích lớp (`hocVienLop.ts:699-707`); trong tab Học viên thêm **6 cách xem** (`TabHocVienLop.tsx:35-37`) → hai tầng trước khi tới bảng.
- Bảng điểm FT desktop **đã tách W1 / W2** (`ClassRoster.tsx:89-90, 289-298`) nhưng thẻ mobile chỉ có W tổng và đổi nhãn "Đợt" → "Mốc" (:172, 180-182) → lệch C18.
- Cột ngày thi tên **"Dự kiến thi"** (`ClassRoster.tsx:212-214`); ngày chốt và tuần dự kiến cùng mức chữ đậm (`examPlanOf` `server/src/fasttrack/cycles.ts:89-119`, `ExamPlanText` `web/src/ui/ui.tsx:492-505`) → không phân biệt "đã chốt" với "dự kiến" (C21). "Thi thật" là đầu cột nhóm ở tab Tổng kết (`TabTongKetLop.tsx:95`).
- Cột việc ("Theo dõi") chỉ hiện **đúng 1 việc** `viecTiepTheo[0]` (`ClassRoster.tsx:387-394`), xếp đỏ → vàng → xanh, **không ưu tiên việc người xem** (`hocVienLop.ts:535-538`) → trái C19. Nguồn `viecTiepCuaEm` (`hocVienLop.ts:462`), không phải worklist (badge quá hạn đầu trang mới dùng `/my-work`).
- Bấm việc = `<Link>` **đổi trang** (`thaoTacDongHocVien.tsx:58-66`); việc nhập điểm không truyền em / kỹ năng (:38-55) → trái C17. Chỉ "Cần hỗ trợ" mở `NganCase` tại chỗ.
- Đánh giá đầu ra: lớp thường làm được trong hồ sơ lớp (Lộ trình tiếp theo › "Kết quả đầu ra") qua **modal giữa màn**, từng em, không có "em tiếp" (`BangLoTrinhTiep.tsx:178-195, 505-575`); lớp FT chỉ đọc (`BangKqdrLopFt.tsx:24-33`); hồ sơ HV vẫn có "Kết luận khoá" (`KetLuanKhoa.tsx`). Phần lớn chữ gõ cứng, chưa qua `t()`.
- Lưới nhập điểm cuối trang **mở sẵn dưới mọi tab** (`ClassOverviewPage.tsx:48, 145`).
- Ý thức & Phối hợp (`yThuc/ClassYThucCard.tsx`): 5 tiêu đề nhóm cùng xám (:321); khung phải mặc định là **dòng thời gian mọi vi phạm cả lớp, mở sẵn** (:193-203); trạng thái duyệt chỉ là chữ phụ (:330-333); thu hồi chỉ thấy trong `XemXuLyPanel`; TVV báo PH **không có** trên thang, chỉ là việc trong thẻ Phối hợp (`PhoiHopSosSection.tsx:168-181`); mọi thẻ SOS chưa xong đều có nút chính "Xác nhận" (:181).

**V5 [ĐỀ XUẤT]**: đầu trang 1 dòng + 3 số; tab Học viên mở bảng chính ngay; W1 · W2 riêng ở mọi bề rộng; cột "Ngày thi" (ngày chốt đậm / "Dự kiến 11/2026" nhạt + nhãn / "Chưa có lịch"); cột Việc nhiều dòng, việc của người xem lên đầu; bấm việc → panel phải đúng em + kỹ năng; Đánh giá đầu ra liên tiếp trong panel ("Lưu" · "Lưu và em tiếp"); Ý thức = bảng theo em, 4 khối màu nền nhạt (vi phạm chờ · bậc + duyệt · báo PH · Phối hợp SOS tách nhóm), lịch sử gập.

## 3. Học viên & Lớp (`web/src/modules/students`)

**Hiện trạng [ĐÃ KIỂM]**
- Hàng lớp: mã + chuỗi `chuLop` (chương trình · lộ trình · n HV · GVCN) + tối đa 2 badge "+n" + ⋯ (`StudentsPage.tsx:631, 641-642, 699-713`). **Không có số SOS 1/2/3** trên hàng lớp; SOS chỉ là chip "SOS n · R, W" trong ô Kết quả (`BangHocVienLop.tsx:288`), mức phân biệt bằng độ dày viền (`web/src/ui/Nhan.tsx:27-31`); **không có chú giải** trên trang.
- Cột W FT = W tổng + dòng phụ "W1 · W2" 12 px (`BangHocVienLop.tsx:56-70`), mobile vẫn giữ (:194-198) → đã gần C18; V4 từng bỏ — V5 giữ.
- "Cần làm" là một góc riêng: mỗi việc một hàng, tên em ở hàng đầu (`BangCanLam.tsx:63-65, 135-145`); việc cấp lớp = hàng "Cả lớp · n em" (:65, 84). **Đơn vị lẫn**: nút đếm HV (`StudentsPage.tsx:249`), lọc "Quá hạn" đếm việc, "Chờ duyệt" / "Thiếu TT" đếm HV (:417); phân trang theo **việc** nên việc của một em có thể tách sang trang sau (:272).
- Lịch thi: `lichThiOv15f.ts:38-71` đã có 5 trạng thái (chưa có / dự kiến / chưa chốt ngày / đã chốt ngày / đã thi); "chưa rà" **không** suy từ ghi chú trống (:84-89) → giữ (brief 12 bác V4 "Chưa kết luận").
- Xuất: "Xuất Excel · n HV" theo góc + bộ lọc, đủ mọi trang (`StudentsPage.tsx:275-280`); ngăn xuất 2 phạm vi đang lọc / đã chọn (`NganXuatDs.tsx:78-80`); đổi lọc bỏ chọn có báo (`StudentsPage.tsx:288-302`); "Chọn tất cả" chỉ lớp đang mở ở trang này (:322-325) [CẦN XÁC MINH khi làm mã: nhãn nút nên nói rõ phạm vi].

**V5 [ĐỀ XUẤT]**: hàng lớp = mã · n HV · GVCN · 3 ô SOS có viền (1 / 2 / 3) + chú giải một dòng + `aria-label`; bộ lọc Cần làm thành chip lọc trên cùng bảng, đếm "n HV · m việc", phân trang theo HV; việc cấp lớp ở hàng lớp.

## 4. Hồ sơ HV (`StudentDetailPage`, `DauHoSo`, `HanhTrinh`)

**Hiện trạng [ĐÃ KIỂM]**
- Đầu hồ sơ: tên + badge + dòng thông tin + liên hệ + câu tóm tắt máy viết + **4 ô** (Kết quả gần nhất · Học thuật · Ý thức · Sắp tới) (`DauHoSo.tsx:40-61, 203-329`).
- Thanh "Việc của tôi" đã nằm trước tab / bảng (`StudentDetailPage.tsx:293-308`), nhưng **một việc lặp tới 4 chỗ**: câu tóm tắt (`hoSoHocVien.ts:225-235`), ô Học thuật (:291-301), thanh việc, dòng hạn SkillBoard (`cases/SkillBoard.tsx:265`).
- Hành trình: hộp mỗi kỹ năng, FT tách W1 / W2 (`shared/domain/cases.ts:113-115`); tối đa 5 mốc + "Tăng / Giảm / Không đổi" + "?" cho đợt chưa chấm (`hanhTrinh.ts:309-354`); không biểu đồ, không radar; chú giải 9 ký hiệu (`HanhTrinh.tsx:553-584`).
- Kỳ vọng theo lượt từ `target_at_attempt` (`server/src/students/profile.ts:88`) → **không tô lại lịch sử** (đúng brief 11) nhưng kỳ vọng chỉ trong tooltip, không có mốc đổi nhìn thấy.
- Lượt thiếu điểm bị **bỏ qua, không để lỗ** (`server/src/students/hanhTrinh.ts:271-273`) → khoảng trống nhìn như liền mạch.
- Góp ý tuần chỉ ở hồ sơ lớp, chữ tự do ≤ 500, không thang điểm (`shared/domain/gopYTuan.ts:2`, `schema.sql:2085-2095`). **Chưa có chỗ ghi bài trên lớp có điểm** (C11, T18) → V5 vẽ mới; [CẦN XÁC MINH ở V5-C: cần bảng dữ liệu mới, không trộn vào chỉ số MT].

**V5 [ĐỀ XUẤT]**: đầu gọn 2 dòng; thanh Việc cần làm là chỗ duy nhất có việc; tab kỹ năng L · R · W (W1 / W2) · S, biểu đồ đường theo tuần + đường kỳ vọng bậc thang (đổi ở mốc đổi Target) + bảng mốc; ô trống "Chưa có điểm" ≠ "Không đổi"; khu "Bài trên lớp" tuỳ chọn, thang riêng (/10, /20, /40), không quy đổi band.

## 5. Sau thi (chạm B2 ở Hồ sơ HV / Hồ sơ lớp) [ĐÃ KIỂM]
- `KetQuaThiThatPanel` lưu điểm không cần bước tiếp (`KetQuaThiThatPanel.tsx:86-94`); trạng thái `da_thi_cho_kq` → `cho_buoc_tiep` "Có KQ · chờ bước tiếp" → `xong` (`tongKetLoTrinh.ts:126, 141-149`). Mockup B2 chỉ hiện trạng thái; form Sau thi thuộc B1 (`tvv.html`).
- [CẦN XÁC MINH — ghi cho V5-C] Hạn bước tiếp khi KQ về sau ngày thi + 7: hạn = ngày nhập KQ, hôm sau đã quá hạn (`tongKetLoTrinh.ts:122-130`).

## 6. W1 / W2 từng màn

| Màn | Hiện tại | V5 |
|---|---|---|
| Chấm Test / lưới FT | W1, W2 nhập riêng + W tính (`LuoiFT.tsx:190-195`) | Giữ |
| Hồ sơ lớp desktop | W1, W2 riêng, không W tổng | Giữ + W nhỏ cho Overall (tuỳ chọn) |
| Hồ sơ lớp mobile | **Chỉ W tổng** (`ClassRoster.tsx:180-182`) | W1 · W2 riêng (C18) |
| HV & Lớp | W tổng + "W1 · W2" dòng phụ, cả mobile | Giữ, chữ phụ ≥ 12 px (T13) |
| Hồ sơ HV hành trình | W1, W2 hộp riêng | Tab W có 2 đường W1 / W2 |
