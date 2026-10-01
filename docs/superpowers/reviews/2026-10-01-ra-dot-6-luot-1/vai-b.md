# Rà PR #148 PR-VAI-b — mức ĐẦY ĐỦ (Opus 5.5, 01/10)

Bản rà: `main` @ `f814ba26` (worktree `ra6`). Merge VAI-b = `435da4d0`. Chỉ đọc mã. Không chạy `npm run check`.
Đã chạy một phép kiểm lẻ `npx tsx` (foreground, ≤ 60 s) để lần `tuanHocFt` / `chuKhoangDung` với dữ liệu tự nghĩ. File tạm đã xoá.

Tổng: **P0: 0 · P1: 3 · P2: 16**

---

### [P1] Hành trình: chương của em đang Tạm dừng bị vẽ như lớp đã rời — tuần học sai, chân "Bảo lưu", không phải chương đang học
- Chỗ: `server/src/students/hanhTrinh.ts:297-303` (`dangHoc = e.status === 'active'`, `tu: tuanHocFt(...) ?? 1`, `den: … : null`); `shared/domain/hanhTrinh.ts:583-591` (`ra` khi `!l.dangHoc`); `web/src/modules/students/ChuongLop.tsx:57-58, 217`
- Lỗi: Tạm dừng chuyển ghi danh sang `paused` (`students.ts:282-285`, `end_kind = 'bao_luu'`, `ended_at` để trống). Commit `0efbae62` sửa đầu hồ sơ ("em Tạm dừng giữ lớp") nhưng chương Hành trình vẫn coi ghi danh `paused` là đã rời lớp.
- Tình huống: em FT học MB FT 101 từ tuần học 1, tuần này là tuần 15, Tạm dừng hôm qua.
  - `dangHoc = false`, nên `tuanHoc.tu = tuanHocFt(batDau, e.started_at) = 1` và `den = null` (vì `ended_at` trống). Thẻ ghi **"tuần học thứ 1"**. Đầu hồ sơ cùng lúc ghi "tuần học thứ 14 · đang dừng". Hai đường không khớp, trái Global Constraints "tuần học thứ n ở đầu hồ sơ = trục".
  - Chân thẻ ghi **"Bảo lưu"** như em đã rời lớp. Thẻ mất viền "đang học" và nút "Xem trục tuần".
  - Trên điện thoại, `ChuongDienThoai` chỉ mở sẵn chương `dangHoc`. Ở đây mọi chương đều gập, trái Q23.
  - Ca biên cùng gốc: chương FT có `ended_at − 1` rơi vào tuần dừng, nên `den = null`. Chương cũ khi đó cũng ghi "tuần học thứ {tu}" thay cho khoảng "tuần học a–b".
  - Cùng gốc, sau cổng gộp `7639d992`, `luatLoTrinh.ts:363` và `transition.ts:180` truyền `mondayOf(today)`. Với em đang dừng, hàm trả `null` nên panel Chuyển lớp / Lên lớp không còn số tuần học. Chỉ đầu hồ sơ tự lùi về tuần trước tuần dừng (`profile.ts:478`). Thành ra ba nơi xử lý "đang dừng" theo ba cách khác nhau.
- Sửa:
  - Coi ghi danh `paused` của em `inactive` là chương đang giữ (`dangHoc`, hoặc một cờ `dangDung`).
  - Dồn luật "đang dừng → tuần trước tuần dừng" vào **một** hàm shared (ví dụ `tuanHocHienTai(batDau, homNay, dung)`), cho đầu hồ sơ, chương và UXF-a cùng gọi.
  - `den` của chương cũ: lấy tuần học cuối **trước** ngày rời lớp, không để `null`.
  - Thêm phép kiểm chương cho em `paused`.
- Nguồn luật: Q1, Q14, Q23, Global Constraints (hai đường tuần học); commit `0efbae62`; mockup 26 bản 2.

### [P1] Ngăn Case vẫn ghi "Quá hạn" ở đầu panel khi em đang Tạm dừng
- Chỗ: `web/src/modules/students/NganCase.tsx:166-167`
- Lỗi: nhãn trạng thái đầu Ngăn Case vẫn là `<NhanTrangThai t={data.trangThaiV4.t}>` và không đọc `data.tamDungTu`. Dữ liệu này máy chủ đã trả (`cases.ts` `caseDetail`). Trong `CasePanel.tsx` chỉ khối PA (`:253`) được thay.
- Tình huống: em Tạm dừng có Case chờ nguyên nhân đã qua `han_xac_nhan`. Khi đó `trangThaiCaseV4` ra `t = 'qua-han'` (`sosV4.ts:79`). Mở Ngăn Case từ bảng kỹ năng thì đầu panel hiện nhãn **"Quá hạn"**, trong khi bảng kỹ năng ngay dưới ghi "Tạm dừng từ 21/09".
- Sửa: ở `NganCase` ngCanh, khi có `data.tamDungTu` và `t === 'qua-han'`, vẽ `<NhanTamDung>` (như `CotCase` / `HangCase`).
- Nguồn luật: Task 4 ("bảng kỹ năng + Ngăn Case"), Q11, KIỂM 5 ("Ngăn Case cũng vậy"), T65.

### [P1] Thanh việc và câu tóm tắt bỏ sót việc "Đề ra PA" (Case chưa có PA), kể cả khi quá hạn
- Chỗ: `server/src/students/viecHocVien.ts:61-104`
- Lỗi: từ `viecTiep` của Case, `viecCuaHocVien` chỉ nhặt "Xác nhận nguyên nhân" và "Chờ Quản lý duyệt · không theo dõi". Việc `Đề ra PA` (`sosV4.ts:117`, hạn `lap-pa`) không thành dòng việc nào. Công việc thì có dòng `support:{caseId}` nhóm `no_plan` (`mywork.ts:649`).
- Tình huống: GV mở Case tay (kể cả em KCK: "Case tay … như mọi em") rồi chưa thêm PA, và hạn lập PA đã qua.
  - Cột Việc tiếp của bảng kỹ năng ghi "Đề ra PA · quá hạn n ngày".
  - Thanh "Việc của bạn" của người phụ trách thì trống. Chính `nguoiLamCua` nói "Đề ra PA → người phụ trách Case".
  - Câu tóm tắt cũng không nêu việc quá hạn này, trái Q31-8.
  - Số việc ở hồ sơ không khớp trang Công việc.
- Sửa:
  - Thêm loại `de-ra-pa`, key `support:{caseId}` như `myWork`, người làm = `c.ownerId`, hạn `v.han`.
  - Đưa loại này vào `VIEC_HOC_THUAT` của `cauTomTat`.
  - Thêm nhóm `no_plan` vào phép kiểm "hai đường".
- Nguồn luật: K3-01, Q2 ("mọi việc của em"), Q31-8, Q12 (KCK có Case tay), `HOP_DONG_SO_LIEU.md` §1.

---

### [P2] Em Tạm dừng: hạn CHƯA quá vẫn hiện ở hàng Case và hàng PA của bảng kỹ năng
- Chỗ: `web/src/modules/cases/SkillBoard.tsx:416` (`<Han>` chỉ bị ẩn khi `t === 'qua-han'`); `:553-554` (`phu` chỉ thay khi `tone === 'overdue'`)
- Lỗi: `DongHan` thay **mọi** hạn bằng nhãn Tạm dừng (commit `0efbae62`: "mọi hạn dừng"). Hàng Case và hàng PA thì chỉ thay hạn đã quá.
- Tình huống: em Tạm dừng có PA với `action_due` ngày mai. Hàng PA vẫn ghi "Ghi kết quả tuần W4 SEP · hạn hết T2 05/10", trong khi cột Việc tiếp cùng bảng ghi "Tạm dừng từ 21/09".
- Sửa: khi `tamDung` thì ẩn / thay mọi hạn ở `HangCase`, `HangPA` (và `CasePanel` `TheKhoiPa`), giống `DongHan`.
- Nguồn luật: T65, Q11, mockup 24 D1 ("mọi hạn đổi thành 'Tạm dừng từ 21/09'").

### [P2] Hàng PA lặp chữ "chưa có lịch"
- Chỗ: `web/src/modules/cases/SkillBoard.tsx:490, 518`
- Lỗi: `khoang` nay đã chứa `p.mocChu`, ví dụ "đến MT2 · chưa có lịch" (`mocChuPa`, `sosV4.ts:39`). Dòng phụ còn nối thêm `{chuaLich && ' · chưa có lịch'}`.
- Tình huống: PA quy chế đã xác nhận, MT2 chưa xếp lịch. Dòng phụ ra "Phạm Quốc Bảo · từ W3 SEP · đến MT2 · chưa có lịch · **chưa có lịch**". Với `until_exam`, dòng phụ ra "… chưa có ngày thi · chưa có lịch".
- Sửa: bỏ span `chuaLich` (hoặc chỉ tô vàng phần mốc trong `khoang`).
- Nguồn luật: Q19, Task 6 (chữ khoảng PA).

### [P2] Hạn xác nhận ở hàng Case của bảng kỹ năng vẫn 11 px
- Chỗ: `web/src/modules/cases/SkillBoard.tsx:416` dùng `<Han>`, và `web/src/ui/Han.tsx:52` là `text-[11px]`
- Lỗi: Q22 / Q31-4 yêu cầu hạn 12 px ở bảng kỹ năng. Phép kiểm quét chuỗi `SkillBoard.tsx` vẫn xanh vì cỡ chữ nằm trong `Han.tsx`.
- Sửa: truyền cỡ 12 px cho `Han` (prop hoặc lớp) ở bảng kỹ năng.
- Nguồn luật: Q22, §3.1g Q31-4.

### [P2] `khoangTamDung` ghép cặp theo `event_date`: Tạm dừng ghi lùi ngày trước lần Quay lại cũ thì mất khoảng đang dừng
- Chỗ: `server/src/students/tamDung.ts:14-20`; `server/src/students/students.ts:252-262` (không chặn)
- Lỗi: `setStudentStatus('inactive', date)` chỉ chặn ngày ở tương lai. Ngày Tạm dừng có thể sớm hơn ngày Quay lại trước đó.
- Tình huống: Tạm dừng 01/09, Quay lại 07/09, rồi Tạm dừng lần nữa với ngày 05/09.
  - Sắp theo ngày ra P(01/09), P(05/09), R(07/09). Pause thứ hai bị bỏ, kết quả chỉ còn `[{01/09–07/09}]`.
  - Em đang `inactive` mà không có khoảng mở, nên `tamDungTu = null`: bảng kỹ năng lại hiện "Quá hạn" và mất dải vàng.
  - Câu tóm tắt dùng `?? today`, ra "Tạm dừng từ {hôm nay}" (sai ngày).
- Sửa: ở `setStudentStatus`, chặn ngày Tạm dừng nhỏ hơn MAX(ngày Quay lại) (cùng kiểu chặn ngày Quay lại ở `:259-261`). Hoặc ghép cặp theo `id` thay cho `event_date`.
- Nguồn luật: Q1, Q11; đề bài riêng (bản ghi pause/resume không theo cặp). Các ca khác đã lần, đều đúng: thiếu resume → `den = null`; hai pause liền nhau → giữ pause đầu; resume lẻ → bỏ.

### [P2] Dừng và Quay lại trong cùng tuần: trục vẫn vẽ một tuần sọc "Tạm dừng" trong khi tuần học không trừ
- Chỗ: `web/src/modules/students/HanhTrinh.tsx:228-233, 275-283`; `shared/domain/hanhTrinh.ts:266-270` (`chuKhoangDung`)
- Lỗi: luật Q1 nói Tạm dừng và Quay lại cùng tuần thì không trừ tuần nào (`tuanHocFt` đúng, đã lần: 15 → 15). Nhưng `b = max(a, cột(den) − 1) = a` vẫn vẽ một cột sọc + chip "Tạm dừng". `chuKhoangDung` ra "W4 JUL". Thẻ chương cũng ghi "Tạm dừng W4 JUL".
- Tình huống: dừng T2 20/07, quay lại CN 26/07. Hàng Tuần học có số ở cột W4 JUL, ngay dưới một dải sọc "Tạm dừng".
- Sửa: khoảng có `mondayOf(tu) === mondayOf(den)` thì không vẽ dải (hoặc ghi rõ "trong tuần, không trừ").
- Nguồn luật: Q1, mockup 26 bản 1 (5).

### [P2] Đầu hồ sơ: em dừng ngay trong tuần đầu lộ trình thì mất cả dòng "tuần học · đang dừng"
- Chỗ: `server/src/students/profile.ts:478-479`
- Lỗi: tính `tuanHocFt(batDau, mondayOf(tu) − 7, dung)` ra tuần trước tuần bắt đầu, nên trả `null`, và `tuanHoc = null`.
- Tình huống: lộ trình bắt đầu T2 08/06, dừng 10/06. Dòng thông tin không còn chữ "đang dừng" (đã lần bằng `tsx`: `null`).
- Sửa: khi `null` thì vẫn trả `{ tuan: 0 hoặc 1, dangDung: true }`, hoặc chỉ ghi "đang dừng". Gộp vào hàm chung ở phát hiện P1 đầu tiên.
- Nguồn luật: mockup 24 D1, Q1.

### [P2] Ô Kết quả gần nhất: mã kỹ năng "dưới kỳ vọng" liên kết tới lượt `kq`, không phải lượt sinh ra điểm của kỹ năng đó
- Chỗ: `web/src/modules/students/StudentDetailPage.tsx:254` (`kyNangHref` dùng `kq.attemptId`); `server/src/students/profile.ts:417` (`duoi` lấy từ `board.rows`, `missed` theo `bandAttemptId` của từng hàng)
- Tình huống: MT2 mới chấm W2, chưa chấm S. Hàng S vẫn `missed` từ MT1. Bấm "S" thì mở `/mock-test/{MT2}?kn=speaking`: ô S của MT2 chưa có điểm, nên trang không cuộn.
- Sửa: `duoi` mang `attemptId: r.bandAttemptId`; liên kết dùng id đó.
- Nguồn luật: Q24 / G5 ("mở hồ sơ Mock · MT · cuộn tới kỹ năng" của đúng đợt).

### [P2] Hành trình: mốc điểm lớp thường có thể mở `/mock-test/` của lượt lớp thường
- Chỗ: `web/src/modules/students/HanhTrinh.tsx` `duongMoc` (`kind: g?.kind ?? (hop.cheDo === 'ielts' ? 'mock' : null)`)
- Lỗi: `data.ghim` chỉ chứa lượt **có tuần** (`hanhTrinh.ts:196`). Mốc điểm của lượt lớp thường chưa xếp tuần (hộp vẫn nhận, `attemptGiaiDoan` không lọc tuần) thì không tìm ra `g`. Khi đó `kind = null`, nên `duongDotTest` rơi vào `/mock-test/{id}`.
- Sửa: `DiemMoc` mang sẵn `kind` + `classId` (máy chủ có `a.kind`, `a.class_id`), không tra lại trong `ghim`.
- Nguồn luật: Q24 (lớp thường giữ đường bảng điểm lớp thường).

### [P2] Còn chỗ trong hồ sơ HV tự ghép `/mock-test/`
- Chỗ: `web/src/modules/students/StudentPlanPanel.tsx:202` (`<a href={`/mock-test/${…}`}>`, tải lại cả trang); `web/src/modules/students/IntakePanel.tsx:228`
- Lỗi: Q24 yêu cầu "mọi chỗ trong hồ sơ HV" đi qua `duongDotTest`. Phép kiểm quét chuỗi chỉ quét 5 file nên bỏ lọt hai chỗ này.
- Sửa: gọi `duongDotTest`; dùng `Link` thay `<a>`.
- Nguồn luật: Q24, Task 8.

### [P2] Việc Ý thức của GVCN ở hồ sơ chỉ có "Xử lý vi phạm", thiếu "Ghi nhận vi phạm mới" và "Đã thực hiện"
- Chỗ: `server/src/students/viecHocVien.ts:126-132`, so với `mywork.ts:1086-1097` (`yt_xem`, `yt_thuc_hien`)
- Lỗi: Q2 chỉ liệt kê Xử lý vi phạm. Nhưng mục tiêu K3-01 là "mọi việc của em". GVCN mở hồ sơ không thấy "Ghi nhận 2 vi phạm mới" hay "Ghi 'Đã thực hiện' Report 2", trong khi Công việc có.
- Sửa: thêm hai loại với key `yt_xem:{sid}`, `yt_thuc_hien:{id}`. Hoặc planning ghi rõ là cố ý.
- Nguồn luật: K3-01, Q2. Đây là "làm khác", để planning quyết.

### [P2] Nghi ngờ: người làm Mini Test ở hồ sơ có thể lệch Công việc
- Chỗ: `server/src/students/viecHocVien.ts:121`, so với `mywork.ts:847`; `cases/boTro.ts:323`
- Lỗi:
  - Hồ sơ lấy `boTro.nguoiDay`, tức dòng PA đầu tiên có `performer_user_id` **hoặc** `performer_name`. Nếu dòng đầu chỉ có tên (người dạy không có tài khoản) thì `userId = null`, và việc rơi về GVCN.
  - Công việc lấy `performer_user_id` đầu tiên khác null trong nhóm.
  - Trường hợp nhóm có cả người không tài khoản lẫn người có tài khoản: hai nơi ra hai người làm khác nhau.
- Sửa: dùng đúng câu của `myWork` (performer_user_id đầu tiên), hoặc tách `nguoiDayCoTaiKhoan`.
- Nguồn luật: Q2 (người làm theo đúng luật Công việc).

### [P2] Hành trình: `programmeCodeOfCycle` gọi mỗi lộ trình (N+1 theo số lộ trình thiếu `programme_code`)
- Chỗ: `server/src/students/hanhTrinh.ts:56, 76`
- Lỗi: lộ trình lớp thường cũ có `programme_code` NULL thì mỗi lộ trình tốn một câu `SELECT … LIMIT 1`. Số lộ trình thường nhỏ, và phép kiểm đếm câu dùng dữ liệu có mã nên không bắt được.
- Sửa: lấy `programme_code` của lớp qua câu lượt đã nạp (`attemptRows.class_programme` theo `cycle_id`).
- Nguồn luật: Q20, CHUNG §5.

### [P2] Hơn 4 chương: khung cuộn ngang không tự tới chương đang học
- Chỗ: `web/src/modules/students/ChuongLop.tsx:86-96`
- Lỗi: Q23 nói chương đang học luôn ở bên phải. Khung `overflow-x-auto` mở ở mép trái, nên lúc mở tab chỉ thấy các chương cũ nhất (trục tuần thì đã tự cuộn về mép phải).
- Sửa: `scrollLeft = scrollWidth` khi gắn khung (như `HanhTrinh.tsx` làm với trục).
- Nguồn luật: Q23.

### [P2] Chữ lệch mockup đã duyệt (nhỏ)
- Chỗ: `ChuongLop.tsx:141` (`nh.chu`), `shared/domain/hanhTrinh.ts:585` (`Lên FT`), `HanhTrinh.tsx` `ChuGiai`, `shared/domain/hoSoHocVien.ts` `oSapToi`
- Lỗi:
  - Ghim chương lớp thường ghi "Giữa · 3/4 môn đạt". Mockup 26 và phép kiểm Task 9 ghi "Giữa khoá · 3/4 môn".
  - Chân chương ghi "Lên FT", mockup ghi "Lên FT + bổ trợ S".
  - Mục chú giải thứ 8 ghi "đợt Test chưa có điểm", mockup ghi "dự kiến".
  - Mockup 24 D1, ô Sắp tới của em Tạm dừng ghi "giữ lịch · Quản lý dời nếu cần"; mã không có.
- Sửa: chỉnh chữ theo mockup, hoặc ghi Nhật ký là cố ý.
- Nguồn luật: mockup 26 bản 2 + bản 1, mockup 24 D1, Q17.

### [P2] Dải "chờ bạn duyệt" trong hồ sơ không truyền `onThemPa`, thẻ Xin ý kiến thiếu nút "+ Thêm PA"
- Chỗ: `web/src/modules/students/DauHoSo.tsx:299` (so với `HopChoDuyet.tsx:132`)
- Lỗi: cùng thẻ `TheYeuCau` nhưng thiếu một nút hộp Chờ duyệt có. Quản lý phải sang hộp hoặc tự mở Case.
- Sửa: truyền `onThemPa={(caseId) => setOpenCase({ caseId, viec: 'them-pa' })}` từ `StudentDetailPage`.
- Nguồn luật: Q9 ("đúng thẻ của hộp Chờ duyệt").

### [P2] `/students/{hv}` đo 96–99 câu với trần cứng 100, không còn chỗ trống
- Chỗ: `server/src/tests/tocDoDuong.ts` (`'QL|QT|GVCN|GVBM /students/1': 100`)
- Lỗi: VAI-b thêm việc theo người, câu tóm tắt và Tạm dừng; đã bù bằng `nho(programmeOfClass)` và JOIN. Nhưng PR sau chỉ cần thêm 2 câu là đỏ. Mỗi câu trên Turso là một lượt mạng.
- Sửa: không phải lỗi của PR. Ghi để PR-Dọn / UXF-b gom lại số câu của `studentProfile`, ví dụ `dongThongTin` đọc `khoangTamDung` và `skillSupportBoard` đọc lại em.
- Nguồn luật: Global Constraints (Tốc độ), CHUNG §5.

---

## Đã kiểm, không có lỗi
- `tuanHocFt`: đã lần bằng `tsx` các ca dừng rồi quay lại khác tuần, cùng tuần (không trừ), dừng hai lần (trừ đúng 3 tuần), dừng chưa quay lại (null tại và sau tuần dừng; tuần trước vẫn đếm), dừng trước tuần bắt đầu rồi quay lại sau (trừ đúng), ngày Chủ nhật (`mondayOfDate(CN 13/09) = 07/09`, tuần có ngày dừng tính là dừng, đúng luật).
- `khoangTamDung`: một câu mỗi lô qua `theoLo` (≤ 900 tham số); mỗi em nằm trọn trong một lô nên ghép cặp không đứt; thiếu resume → `den: null`; hai pause liền → giữ pause đầu; resume lẻ → bỏ.
- Chỉ còn **một** bản `tuanHocFt` / `chuTuanHoc` (`shared/domain/hienThiNgay.ts`) và `khoangTamDung` (`server/src/students/tamDung.ts`); UXF-a (`luatLoTrinh.ts:363`, `transition.ts:180`), `TransitionPanel`, `ChuyenLopPanel` đều gọi bản chung (xem P1 đầu tiên về luật "đang dừng").
- Cổng gộp `1c811e33` (VAI-a vào VAI-b): 7 file chồng (`routes/index.ts`, `tocDoDuong.ts`, `duongHoSo.ts`, `run.ts`, `prSos/panelUx3/lenLop.tests.ts`) — phần đổi của merge so với VAI-a **trùng khít** phần đổi của VAI-b so với gốc (so md5 các dòng +/−); không mất phần nào của VAI-a.
- Cổng gộp `7639d992` (UXF-a nhận VAI-b): lấy nguyên bản VAI-b của `tamDung.ts`, `hienThiNgay.ts`; `f814ba26` = `435da4d0` ở hai file này.
- Câu tóm tắt: dựng từ `viec.cuaBan + viec.nguoiKhac` (mọi người xem cùng tập việc) → GV môn khác vẫn thấy "PA … quá hạn …" của người khác (Q31-8); ≤ 3 mảnh; lớp thường không chữ SOS; KCK / Tạm dừng / Sắp chuyển / Đã kết thúc đứng đầu.
- Thanh việc: `cuaBan` rỗng → `ThanhViec` trả `null` (không vẽ thanh, không "việc của người khác"); em không `active` → `viec` rỗng; key trùng `myWork` (`cause:`, `xnpa:`, `action:`, `kehoach:`, `baoph:`, `minitest:`, `yt_xu_ly:`, `ban_giao:`, `ban_giao_mon:`), người làm Ghi kết quả = `performer_user_id ?? recorded_by` như `mywork.ts:470`.
- Quyền: `studentProfile`, `hanhTrinhHocVien`, `skillSupportBoard` `require_` trước khi trả dữ liệu → QL chi nhánh khác 403; `viewer.coTheDuyet = can(REQUEST_APPROVE, { studentId })` (đúng chi nhánh); `/yeu-cau?studentId=` lọc `trongPhamVi` (QL chi nhánh khác nhận rỗng, không lộ); menu ⋮ chỉ sắp lại + thêm `nhom`/`phu`, tập mục theo quyền giữ nguyên.
- KCK: `viecCuaHocVien`, `oHocThuat`, Ý thức không lọc KCK; `DongMt` "MT1 · KCK"; ô Kết quả "Overall 5.5 · KCK · không đặt kỳ vọng MT".
- Hành trình máy chủ: số câu cố định (lộ trình, lượt, điểm, lịch kỹ năng + skip cũ, Case, PA, follow-up, ghi danh, GVCN, lệnh chuyển, Tạm dừng); `IN` qua `theoLo`; chương trình lớp qua JOIN + `allProgrammes()` một lần.
- Chương chỉ kể hành trình: không hạn, không người giữ việc; Case = `NhanLoai` viền (khung rỗng), PA = chip nền đặc; lớp thường `sos: null` (`cycle_route` trống) → không chip SOS; ghim lớp thường qua `nhanGhim` ratio (không "MT", không "SOS"); "Đọc bàn giao" giữ (`docBanGiao` khi `xac_nhan_luc`).
- Trục: tháng có ngoặc (border-b + hai vạch đầu/cuối, `gridColumn` trải đúng số tuần); ghim hai dòng `MT1 / 5.5` trong **một** cột (`gridColumn: cot + 2`); cột tuần tới có (`khoangTruc` 3 tháng = tuần sau tuần này) và mờ; Case khung viền SOS (lớp thường trung tính), mép phải đứt khi còn mở; PA khối đặc; khối chờ viền đứt tím (R5-2 sửa: PA Bổ trợ `planned` → "Chờ duyệt kế hoạch").
- Bấm chương → `?giai-doan=` + tự "Cả giai đoạn" khi chương kết thúc trước khoảng 3 tháng + cuộn `#truc-tuan`; nút đổi giai đoạn đã bỏ.
- Đã bỏ `/students/:id/lich-su-lop` (route, `lichSuLop.ts`, `LichSuLop.tsx`, trần tốc độ), `episodes`/`allEpisodes`/`Episode`, "Mốc học tập": không còn chỗ gọi nào trong `web/src`, `server/src`, `shared` (chỉ còn chữ trong chú thích).
- G5: `duongDotTest` FT → `/mock-test/{id}?kn=` (kn ngoài danh sách bị bỏ), lớp thường → `/bang-diem-thuong/{lop}?kind=` (bỏ `kn`); `attemptHref` web chỉ gọi hàm này; `MockDetailPage` đọc `?kn=` một lần khi có dữ liệu, kiểm ô có trong đợt, cuộn `#dai-diem` bằng `cuonOnDinh`; hook đặt trước các `return` sớm.
- Bảng kỹ năng < 640 px: `useDienThoai` (`max-width: 639px`) gọi trước `return` sớm, chỉ vẽ `TheKyNangDs` (không vẽ bảng rồi ẩn); Case viền / PA nền ở thẻ; kỹ năng đạt một dòng có dấu tích SVG; vùng bấm ≥ 44 px.
- Token màu sáng/tối: `--soon-bg-rgb`, `--bad-rgb`, `--late-*`, `--sos*-rgb` có ở cả hai theme (`web/src/index.css`).

## Chuyển cho PR khác
- Mã tuần còn lại ở PA quy chế: `mocChuPa` "1 tháng · đến 18/10" (`sosV4.ts:38`) — Nhật ký VAI-b đã ghi, thuộc **UXF-b B5**.
- `attemptHref` bản máy chủ (`fasttrack/attempts.ts`) và G5 ở màn ngoài hồ sơ HV — **UXF-b** (Q24). Kèm hai chỗ trong hồ sơ ở P2 "/mock-test/" nếu UXF-b nhận gọn.
- Bảng Mock Test / Kết quả kiểm tra trên điện thoại, hàng tab điện thoại — **UXD** (Nhật ký audit đã ghi).
- R5-1 (ngày ở dải Sắp chuyển), R5-3, O1, O2 — **UXF-b**.
- Gom số câu `studentProfile` (96–99/100) — **PR-Dọn** (P2 cuối).
- Luật "đang dừng" một hàm cho đầu hồ sơ + chương + panel UXF-a — nếu không sửa trong VAI-b lượt 2 thì giao **UXF-b** (P1 đầu tiên, phần UXF-a).
