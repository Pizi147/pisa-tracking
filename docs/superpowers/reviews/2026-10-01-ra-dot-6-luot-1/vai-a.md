# Rà PR #147 PR-VAI-a — Tổng quan theo vai · Công việc · chuông (mức ĐẦY ĐỦ)

Người rà: Opus 5.5 · đọc trên `main` @ `f814ba26` (worktree `ra6`), đối chiếu kế hoạch `2026-10-01-pr-vai-a-tong-quan-theo-vai.md`
(Task 0–12, Q1–Q27) và mockup 23 (màn A, B, C, D). Chỉ đọc mã, không chạy `npm run check`.
Commit của PR đều ghi `Co-Authored-By: Claude Opus 5.5` (đúng model kế hoạch).

Tổng: **0 P0 · 7 P1 · 9 P2**.

---

## P1

### [P1] Phối hợp SOS thành việc thật nhưng đếm cả lượt LỚP THƯỜNG: việc trùng, sai người nhận, chữ "SOS" ở lớp thường
- Chỗ: `server/src/worklist/mywork.ts:824-838` (khối `phoi_hop_sos`) · `server/src/yThuc/phoiHop.ts:287-325` (`myCoordinationLines`) · so với `mywork.ts:787-820` (việc `phoi_hop` "Báo phụ huynh qua TVV")
- Lỗi: `myCoordinationLines` đếm mọi lượt có `sos_coordination_actions` chưa xong của lớp GVCN chủ nhiệm, không lọc FT. Lượt Giữa khoá / Cuối khoá lớp thường có một việc `bao_ph_tvv` (`phoiHop.ts:121`, `cuoiKhoa.ts:372`), nên cũng bị tính.
- Tình huống:
  - (a) Em MB FOU 12 trượt Giữa khoá. Dòng `bao_ph_tvv` ở trạng thái `pending` → GVCN có hai việc cho cùng một hành động ở cùng nhóm Case học thuật: "Báo phụ huynh qua TVV · em · Giữa khoá" (`phoi_hop`) và "Phối hợp SOS · MB FOU 12 · 1 lượt" (`phoi_hop_sos`).
  - (b) Em Cuối khoá < 50%. Việc Báo PH là của Quản lý (`mywork.ts:808`, PR-LT2b), nhưng GVCN lớp em đang học vẫn nhận "Phối hợp SOS · … · 1 lượt", và việc này không bao giờ hết nếu GVCN không tự bấm.
  - (c) Tiêu đề "Phối hợp SOS" xuất hiện ở lớp thường, trái luật "lớp thường không có SOS".
- Sửa: trong `myCoordinationLines` (hoặc chỉ ở khối `phoi_hop_sos`), chỉ đếm lượt `a.kind = 'mock'` / lớp FT. Lượt lớp thường đã có việc `phoi_hop` riêng. Thêm phép kiểm cho GVCN lớp thường có `bao_ph_tvv` đang chờ: phải không có `phoi_hop_sos`.
- Nguồn luật: Q14 (ví dụ "Phối hợp SOS · MB FT 101"), K5-10, CHUNG §2 (lớp thường không SOS), mục đề bài 5 (không tạo trùng, không sai người nhận).

### [P1] Thông báo Báo lên (`kind = 'bao_len'`) rơi vào nhóm "Để biết" của Quản lý
- Chỗ: `shared/domain/duongHoSo.ts` `LOAI_CAN_LAM` (khoảng :104-107) · `server/src/platform/thongBao.ts:34-35` · nơi gửi `server/src/duyet/yeuCau.ts:107` (`kind: baoLen ? 'bao_len' : 'duyet_moi'`)
- Lỗi: `bao_len` không có trong `LOAI_CAN_LAM`. `con_viec` cũng chỉ tính cho `duyet_moi` và `duyet_qua_han`.
- Tình huống: Case chờ nguyên nhân quá hạn, hoặc vi phạm quá 5 ngày, sinh thẻ Báo lên và gửi chuông cho Quản lý. Chuông xếp dòng này vào "Để biết", dù đây là thẻ đang chờ chính Quản lý quyết, và mockup B coi Báo lên là tầng 1. Phép kiểm (10a) không phủ loại này vì danh sách kiểm (`prVaiA.tests.ts:538`) cũng thiếu `bao_len`.
- Sửa: thêm `bao_len` vào `LOAI_CAN_LAM`; thêm `'bao_len'` vào điều kiện `con_viec` của `yeu_cau_duyet` (`ycd.trang_thai = 'cho'`). Thêm phép kiểm.
- Nguồn luật: Q18 (Cần làm = thẻ đang chờ chính người đọc), T76, mockup D.

### [P1] Lớp tôi dạy: khung nhớ chung khoá `pisa.khung.tong-quan` với Quản lý → giáo viên một khung có thể thấy bảng rỗng và không có công tắc
- Chỗ: `web/src/modules/worklist/LopToiDay.tsx:25-35, 64` · `web/src/modules/worklist/OverviewPage.tsx:43, 90` · `web/src/ui/CongTacKhung.tsx:32-33`
- Lỗi: Quản lý (phần Số liệu) và giáo viên (Lớp tôi dạy) đọc/ghi cùng khoá localStorage. Khi khoá đã có giá trị, `LopToiDay` bỏ qua `khungMacDinhGv`. `CongTacKhung` lại tự ẩn khi khung kia có 0 lớp.
- Tình huống: một máy (máy chung ở trung tâm, hoặc bản demo đổi vai) đã ghi `thuong` vì Quản lý bấm "Lớp thường" ở Số liệu. GV chỉ dạy FT mở Tổng quan → `ct = thuong` → bảng ghi "Bạn không dạy lớp thường nào đang mở", và công tắc bị ẩn (`dem.ft > 0`, `dem.thuong = 0`). GV không còn cách nào xem lớp mình. Trường hợp ngược lại cũng vậy.
- Sửa: khi `!(data.coFt && data.coThuong)` thì luôn dùng `khungMacDinhGv`, bỏ giá trị đã nhớ (như Công việc đang làm ở `HoTroHocVienTab.tsx:72-73`). Tách khoá riêng cho GV, ví dụ `'lop-toi-day'`.
- Nguồn luật: Q12 ("Dạy một khung → ẩn công tắc"), Q31-1, mockup A/C.

### [P1] Việc Chấm điểm "Quá hạn" vẫn theo hạn trơn, không theo cờ ô (Task 11 vế 3 rơi giữa hai PR)
- Chỗ: `server/src/worklist/mywork.ts:254-259` (`urgencyOf`), `:372` (bucket `score`). So với `platform/week.ts:101` `quaHanNhapDiem` mà `bai-qua-han-nhap-diem` dùng (qua `scoreDebtCells` → `overdue`).
- Lỗi: kế hoạch Task 11 yêu cầu "việc Chấm điểm quá hạn ⇔ ô có `overdue` (tuần thi đã hết)". Nhật ký VAI-a ghi "chưa làm — làm ở cổng gộp". UXF-a cũng chuyển việc này cho VAI-a (kế hoạch UXF-a :457, :495). Kết quả là không PR nào làm.
- Tình huống: một môn có hạn nhập trước Chủ nhật tuần thi và đã qua hạn, nhưng tuần thi chưa hết.
  - Công việc tô dòng này "Quá hạn"; chip Quá hạn đếm nó; badge đỏ của GV (`/my-work/dem` = `summary.overdue`) cũng cộng nó.
  - Cần xử lý "n bài chưa nhập điểm quá hạn" thì không tính nó.
  - Hệ quả: "Xem và nhắc" mở Công việc ra nhiều GV hơn cột "Người giữ việc". Số đỏ của GV lệch với Lịch Test (khối Nợ đọc `x.overdue`).
- Sửa: bucket `score` đọc cờ `overdue` của ô, đã có sẵn ở `myPendingDetail[].overdue` và `pendingDetail[].overdue`: `urgency = any(overdue) ? 'overdue' : (due === today ? 'today' : 'normal')`. Thêm phép kiểm hai đường với `bai-qua-han-nhap-diem`.
- Nguồn luật: Task 11 (phép kiểm thứ 3), kế hoạch UXF-a "Chuyển cho PR khác" (`urgencyOf`), HOP_DONG_SO_LIEU §1.

### [P1] Q6 thiếu vế "m bài chưa có người chấm" ở dòng "lớp thiếu GV môn"
- Chỗ: `server/src/worklist/tongQuan.ts:131-138` (còn chú thích `// ponytail: vế "m bài chưa có người chấm" chờ … PR-UXF-a (chưa merge) — thêm ở cổng gộp.`)
- Lỗi: UXF-a đã merge (hàng "Chưa phân công", `DebtCell.userId = null`), nhưng không ai thêm vế `m`. Dòng chỉ có "n lớp thiếu GV môn · k Case chưa có người nhận".
- Tình huống: QL MB có 12 bài nợ thuộc môn chưa phân công GV. Mockup B ghi "· 12 bài chưa có người chấm", màn thật không nói gì. Chú thích `ponytail:` cũng đã sai sự thật.
- Sửa: đếm số ô `userId === null` của `scoreDebtCells` (hoặc chỉ số tương ứng của UXF-a) trong cùng phạm vi, gắn vào `kem`, rồi xoá chú thích.
- Nguồn luật: Q6, mockup B.

### [P1] "Xem hết (n)", "Tất cả việc (N)" và "Xem và nhắc" mở Công việc đang bị lọc theo khung đã nhớ → số không khớp
- Chỗ: `web/src/modules/worklist/ViecCuaToi.tsx:78, 111` · `web/src/modules/worklist/KhoiCanXuLy.tsx` (`den` của dòng bài/PA, do `server/src/worklist/tongQuan.ts:103, 113` dựng) · `web/src/modules/congViec/HoTroHocVienTab.tsx:70-75`
- Lỗi: Công việc áp khung đã nhớ (`pisa.khung.cong-viec`) khi người xem có việc ở cả hai khung. Các link từ Tổng quan không gửi `khung=tat-ca`.
- Tình huống: GV dạy FT và lớp thường, trước đó đã chọn "Fast Track" ở Công việc. Điện thoại ghi "Xem hết (7)", bấm vào thì chip "Đến hết tuần" chỉ còn 5. Bình thường hai số phải bằng nhau: phép kiểm (9a) và Q2 so hai đường. Tương tự, QL bấm "Xem và nhắc" có thể không thấy đủ tên GV ở cột Người giữ việc.
- Sửa: thêm `&khung=tat-ca` vào ba loại link (`/cong-viec?loc=den-het-tuan`, `/cong-viec`, `den` của Cần xử lý), vì Công việc đọc `khung` trên URL trước giá trị đã nhớ.
- Nguồn luật: Q1, Q2, Q4, Task 9 phép kiểm ("soXemHet = số chip Đến hết tuần — hai đường").

### [P1] Trang đầu gọi lặp route nặng: GV tính `myWork` 3 lần, QL tính `/tong-quan/quan-ly` 2 lần mỗi lần mở
- Chỗ:
  - GV: `web/src/modules/worklist/ViecCuaToi.tsx:32` và `LopToiDay.tsx:31` cùng `useApi('/my-work')`; thêm `App.tsx` `/my-work/dem` (gọi `myWork` trọn).
  - QL: `KhoiCanXuLy.tsx:27` và `DaiChoDuyet` `:112` cùng `useApi('/tong-quan/quan-ly…')`.
  - `useApi` không gộp yêu cầu trùng (`lib/useApi.ts` gọi `api.get`, không cache).
- Lỗi: trước PR, dải Chờ duyệt dùng chung dữ liệu với Cần xử lý (một `useApi`). Nay mỗi khối tự gọi.
- Tình huống:
  - GV mở Tổng quan: khoảng 3 × 66–85 câu (`/my-work` ×2 + `/my-work/dem`) + 47 (`/lop-toi-day`) + `/yeu-cau/dem` + `/notifications`, tức trên 250 câu SQL một lần tải trên Turso.
  - QL: 2 × 71 câu + `quetLenhDenHan` hai lần.
  - `tocDoDuong.ts` đo từng route riêng nên không bắt được. Trang đầu khó giữ < 3 s (mốc tập dượt Z2c).
- Sửa:
  - QL: `OverviewPage` gọi `/tong-quan/quan-ly` một lần và truyền xuống `DaiChoDuyet` / `KhoiCanXuLy`.
  - GV: `OverviewPage` gọi `/my-work` một lần, truyền cho `ViecCuaToi` và `LopToiDay`.
  - `/my-work/dem`: dùng `cachedGet`, hoặc để `ViecCuaToi` cập nhật badge từ `summary.overdue` khi đang ở Tổng quan.
- Nguồn luật: Q16 ("một lần myWork ~76 câu" — chính kế hoạch đã ngại chi phí này), CHUNG §5 (không truy vấn lặp), memory "trang < 3 s".

---

## P2

### [P2] Badge quá hạn của GV không tải lại sau khi nhập điểm
- Chỗ: `web/src/App.tsx` (`useApi('/my-work/dem', [])`). Màn nhập điểm chỉ gọi `invalidate('/cham' | '/attempts' | '/ke-hoach-test')`, không gọi `invalidate('/my-work')`.
- Lỗi: badge chỉ tải lại khi có `invalidate('/my-work')` (Case/kế hoạch), mà loại việc quá hạn hay gặp nhất là nhập điểm.
- Tình huống: GV nhập xong 4 bài quá hạn, thanh trên/dưới vẫn đỏ "4" cho tới khi tải lại trang.
- Sửa: lưu điểm thì gọi thêm `invalidate('/my-work')`, hoặc `ViecCuaToi`/Công việc đẩy `summary.overdue` vào badge.
- Nguồn luật: Q16 ("tự tải lại khi /my-work bị làm mới").

### [P2] "Cách tính" mở rồi tự đóng ngay khi bấm (đặc biệt trên điện thoại)
- Chỗ: `web/src/ui/SoLieu.tsx:131-137`
- Lỗi: `onMouseEnter` / `onFocus` đặt `true`, sau đó `onClick` đảo `!howTo` → `false`.
- Tình huống: trên điện thoại Android, chạm vào nút sẽ phát lần lượt `mouseenter` → `focus` → `click`, nên chú thích vừa mở đã đóng. Trên máy tính, bấm khi đang rê chuột cũng đóng. Q10 đòi "rê chuột, Tab, bấm". *Nghi ngờ mạnh, chưa chạy trình duyệt.*
- Sửa: `onClick={() => setHowTo(true)}` (đóng bằng Esc / blur / rời chuột), hoặc bỏ `onMouseEnter` khi `pointerType === 'touch'`.
- Nguồn luật: Q10, K1-08.

### [P2] Chuông: "Case còn chờ nguyên nhân" viết lại luật thứ hai, thiếu vế "Không cần theo dõi"
- Chỗ: `server/src/platform/thongBao.ts:32-33` · luật gốc ở `server/src/cases/sosState.ts:131-147` (`awaitingCauseCaseIds`, có `LA_CASE_SOS` + `NOT CO_THE_KHONG_THEO_DOI`)
- Lỗi: `con_viec` chỉ xét `status != 'done'` và chưa có `case_issues primary`.
- Tình huống: GVBM đã gửi thẻ "Không cần theo dõi" (đang chờ QL). Case không còn chờ GVBM, nhưng chuông vẫn để ở "Cần làm".
- Sửa: dùng chung đoạn SQL `CO_THE_KHONG_THEO_DOI('sc')` / `LA_CASE_SOS('sc')` trong cùng câu.
- Nguồn luật: Q18, HOP_DONG_SO_LIEU §1 (một luật).

### [P2] `duyet_tu_choi` ở lại "Cần làm" mãi
- Chỗ: `server/src/platform/thongBao.ts:34-35`
- Lỗi: `con_viec` không tính cho `duyet_tu_choi`.
- Tình huống: GV đã "Sửa và gửi lại", hoặc thẻ đã đóng, nhưng dòng "Quản lý từ chối …" vẫn ở Cần làm cho tới khi bị đẩy khỏi 50 dòng.
- Sửa: với `duyet_tu_choi`, `con_viec = (ycd.trang_thai = 'tu_choi')`.
- Nguồn luật: Q18.

### [P2] Chuông điện thoại `top-14` đè lên thanh trên khi có DemoBar
- Chỗ: `web/src/modules/platform/Header.tsx` (div `fixed inset-x-2 top-14`) · `web/src/App.tsx:102` (`{!banChinh && <DemoBar />}` nằm trên header)
- Tình huống: ở bản demo/nháp (có DemoBar), header không nằm ở y = 0. Bảng neo cố định ở 56 px từ mép trên nên che một phần thanh trên. Bản chính không bị.
- Sửa: neo theo đáy header, ví dụ dùng `top` tính từ `getBoundingClientRect` của nút, hoặc một biến CSS chiều cao DemoBar.
- Nguồn luật: Q21, mockup D (neo ngay dưới thanh trên).

### [P2] Dòng "Chuyển lớp cả lớp" ghi hạn "trước {tuần}" đã qua mà vẫn nhãn "Cần làm"
- Chỗ: `server/src/worklist/tongQuan.ts:122-129`
- Tình huống: lớp đã hết khoá từ W3 SEP mà còn em chưa có lệnh. Dòng ghi "trước W4 SEP" (đã qua) với nhãn Cần làm, không có "Quá hạn".
- Sửa: tuần đó < tuần này thì `trangThai: 'qua-han'` (truyền vào `quaHan` của `sapCanXuLy` như Vận hành).
- Nguồn luật: Q24, §7.3.

### [P2] "Bài chờ chấm" ở Lớp tôi dạy đếm số EM, không đếm số BÀI
- Chỗ: `shared/domain/congViec.ts:105-115` (`baiChoChamTheoLop` cộng `it.count`). `count` của việc `score` = `students.size` (`mywork.ts:390`).
- Tình huống: "Nhập điểm Reading, Writing · 4 em" bị tính 4, trong khi đơn vị "bài" của UXF-a (một ô) là 8 hoặc hơn. Số lệch với "Còn n bài" ở Lịch Test, nơi link của chính ô này mở tới.
- Sửa: đếm ô (số kỹ năng × em) từ bucket, hoặc ghi rõ "em".
- Nguồn luật: Q12, T53 Q2 (đơn vị bài).

### [P2] Người phụ trách ở dòng phụ việc là 11 px
- Chỗ: `web/src/modules/worklist/WorkList.tsx:62` (`text-[11px]`). Dòng phụ chứa `it.owner` / "chưa ai phụ trách".
- Tình huống: tên người giữ việc trên dòng việc (Tổng quan GV, Công việc) nhỏ hơn 12 px.
- Sửa: tách phần người ra một `span text-xs`, hoặc nâng dòng phụ lên 12 px.
- Nguồn luật: Q31-4, CHUNG §2.

### [P2] Lặt vặt (gọn mã, trường hợp hiếm)
- `mywork.ts` khối `ky_vong_dau_ra` (:1104-1117): `LEFT JOIN enrollments … status='active'`. Em có hai ghi danh active sẽ ra hai việc trùng `key`. *Nghi ngờ*, vì seed một ghi danh mỗi em.
- Việc "Đánh dấu kỳ vọng đầu ra" và nút "Mở hồ sơ" (Cần xử lý một em) mở `duongHoSoHocVien(id)`, không tới mục Kết luận khoá như kế hoạch Task 7.
- Khai bậc (`mywork.ts:1046-1050`) chép lại điều kiện của `coTheKhai` (`xuLy.ts:319`), không gọi chung một hàm. Q25 viết `tuanCuaHanGhiKetQua` riêng thay vì dùng `nhanTuanGhiKetQua` (`display.ts:326`). Kết quả hiện trùng, nhưng là luật thứ hai.
- `Header.tsx` nút "Đọc hết": `await api.post` không `try/catch`. Lỗi mạng thành unhandled rejection, không có toast.
- `DaiChoDuyet` nuốt lỗi (`useApi(...).data`): lỗi tải thì dải biến mất, không báo.
- Mã chết sau khi bỏ `next_step`: `classAlerts` (`schedule.ts:584`) và `demCanQuanLyTheoLop` (`cuoiKhoa.ts:567`) không còn nơi gọi ngoài phép kiểm.
- Q20: thân thông báo Case mới là "Case mới sau MT2: {tên Case} · hạn dd/mm", không có "Reading 5.0, kỳ vọng 6.0" như mockup D. Nhật ký đã ghi lý do, cần chủ sản phẩm chấp nhận.
- Q19 không migrate: dòng cũ trên bản nháp (kind `sos` "Mang theo PA Bổ trợ", `discipline` "… để biết", `schedule_move` "Đã tự dời") vẫn ở Cần làm, và `duyet_ket_qua` từ chối cũ ở Để biết. Bản chính reset DB nên không ảnh hưởng. Chỉ cần biết khi thử trên nháp.

---

## Đã kiểm, không có lỗi
- Phạm vi chi nhánh, mục **Cần xử lý**:
  - mọi dòng đi qua `metricSet` (`resolveScope` → 403 khi hỏi chi nhánh ngoài phạm vi);
  - `lopThieuGvMon` dùng `CLASS_ASSIGN`, `hvLenFtChuaKyVong` dùng `REQUEST_APPROVE`, chỉ số (c) dùng `PLAN_WEEK` — cả ba qua `classScopeSql`;
  - `lopChoLenhChuyen` dùng `can(CLASS_EDIT, {classId})`;
  - tên Người giữ việc chỉ lấy từ `chiTiet` của tập đã lọc phạm vi; phép kiểm phủ định (1d), (2b–2d), (3b) có mặt.
- Dải Chờ duyệt:
  - `demYeuCau(p,{branchId})` ném 403 với chi nhánh ngoài quyền duyệt; `hopChoDuyet` lọc `trongPhamVi` trước `branchId`;
  - số "chờ / quá hạn / Báo lên" = `demHop`, khớp số thẻ khi mở `?qua-han=1` / `?phan=bao-len` (cùng điều kiện `han_duyet < homNay`).
- Khối chỉ dành cho Quản lý: `/tong-quan/quan-ly` và `/tong-quan/diem-chu-y` chặn GV (`laQuanLy` = `MEETING_VIEW`); GV dùng nhánh `!canSeeBoard`, không render khối QL.
- Lớp tôi dạy: `oLopToiDay` ném 403 với lớp không dạy; hàng chỉ gồm lớp có phân công hiệu lực hôm nay; số mỗi ô = số dòng `oLopToiDay` (cùng `tinhLopToiDay`).
- Số trên Cần xử lý = panel: `SoLieuO` gửi `branchId`, không gửi `ct` → `program = null`, đúng tập mà `tongQuanQuanLy` đếm.
- `trongKhoiHomNay` là một luật cho khối việc (desktop), `baViecDau` (điện thoại) và chip `den-het-tuan` (`khopLocNhanh`). Phần lệch duy nhất là bộ lọc khung ở Công việc, đã ghi thành P1 ở trên.
- `next_step` đã bỏ sạch:
  - không còn ở kiểu, `GROUP_META`, danh sách nhóm, `NHOM_CUA_LOAI`, `DongViec`, web, thông báo;
  - phép kiểm `lenLop` / `prCt` / `nenGiaoDien` đã sửa, không xoá;
  - việc "Chuyển lớp cả lớp" (`placement`) của QL vẫn còn, qua `lopChoLenhChuyen`, cùng hàm với dòng Cần xử lý Q8b;
  - nhãn nhật ký `next_step` (`loTrinhTiep.ts:132`) và `case_followups.next_step` vẫn giữ đúng.
- Chuông, các mục khác:
  - "Đọc hết" là một `UPDATE … WHERE user_id = ? AND read_at IS NULL`, chỉ đụng thông báo của người gọi;
  - `LIMIT 50`, chưa đọc lên trước;
  - giờ theo giờ VN (hôm nay chỉ giờ);
  - mỗi lần mở chuông thì tải lại;
  - điện thoại `fixed inset-x-2`, `max-h-[70vh]`, cuộn bên trong;
  - `duongThongBao` nhận `duyet_tu_choi`, `tu_doi_lich`.
- Khai bậc Ý thức:
  - chỉ GVCN (`isCore`, `em.gvcnId === p.userId`), GVBM không có;
  - cửa sổ 14 ngày tính `[hôm nay − 13, hôm nay]`, một việc mỗi lớp;
  - không trùng với các việc `yt_*`, vì đó là việc khác.
- Kỳ vọng đầu ra: cùng `hvLenFtChuaKyVong` cho chỉ số và việc; `ghiKetLuanFt` xoá được việc với em đã chuyển, vì `applyTransition` ghi `lo_trinh_tiep_theo.da_ap_dung_luc`.
- Tầng 3 Quản lý: công tắc `Fast Track · Lớp thường` mặc định FT, không có "Cả hai"; 4 ô, Điểm đáng chú ý, Lịch, bảng chi nhánh đều nhận `ct`; Cần xử lý và Chờ duyệt không nhận `ct`. Q11 lớp thường có `ctLop`, `ctLop` lạ → 400.
- Q6: "Case chưa có người phụ trách" đã thay bằng `lop-thieu-gv-mon`, nút "Sửa phân công" (một lớp → `?viec=phan-cong`, nhiều lớp → panel). Riêng vế `m` còn thiếu, đã ghi P1.
- Q23: `gvNo` lấy từ `pendingOwners` (không thêm câu SQL), sắp theo tên, có ghi "chưa phân công"; cột 12 px; bản hẹp đưa vào dòng phụ; giữ ô Đợt `MT3 · W3 SEP` của UXF-a.
- Turso:
  - mọi câu mới dùng `?`; `IN` chia lô 400 ở các tập lớn (`ctLop`, `overdueUpdatePlans`);
  - không N+1 cho người/hạn (một câu mỗi chỉ số);
  - có trần tốc độ cho các route mới (`/tong-quan/diem-chu-y`, `/tong-quan/lop-toi-day`, `/tong-quan/lop-toi-day/o`, `/my-work/dem`, `/metrics/lop-thieu-gv-mon`).
- Cổng gộp `53c334df` với Pb2-a: so từng dòng Pb2 thêm vào với bản gộp. Chỉ thiếu các dòng VAI-a cố ý thay thế: `ct` trên URL Tổng quan, dòng U3, `mau` ở `CAN_XU_LY`, `LichSapToi ct={null}` cho GV. Vẫn giữ `CHI_SO_GOP`, `locKhung`, `duongCase`, `ctTuyChon`.
- Sau khi UXF-a và VAI-b gộp đè:
  - `chiTiet` / `nguoi` / `han` của VAI-a vẫn còn, khoá theo `baiId`, ô chưa phân công không thêm người (không ra "#null");
  - `lopCuaTap('bai')` có;
  - `gvNo` và `weekStart` cùng tồn tại;
  - `HoTroHocVienTab` đếm bằng `demNhomChip`, không còn `soNhac`;
  - `trongKhoiHomNay` / `baViecDau` còn nguyên.
- Model thật: mọi commit của PR ghi `Co-Authored-By: Claude Opus 5.5`.

## Chuyển cho PR khác
- **`urgencyOf` theo cờ ô quá hạn** (việc Chấm điểm): VAI-a và UXF-a đều để cho nhau. Cần giao rõ cho lượt 2 hoặc PR-Dọn (xem P1 ở trên).
- **Q6 vế "m bài chưa có người chấm"**: chưa làm, giao lượt 2.
- Badge / cờ "chưa có lộ trình tiếp theo" ở hồ sơ lớp và Học viên & Lớp (`classes.ts:91-106`, `loTrinhTiep.ts:220`) còn sau khi bỏ việc `next_step`. Kế hoạch đã chuyển planning → PR-Dọn.
- Dọn mã chết `classAlerts`, `demCanQuanLyTheoLop` → PR-Dọn.
- `pa-can-cap-nhat` (Cần xử lý) và việc `ghi_ket_qua_pa` (Công việc) lọc khác nhau (em Tạm dừng, nhóm PA bổ trợ chung gộp một dòng). Có sẵn từ trước VAI-a nhưng làm "Xem và nhắc" lệch. *Nghi ngờ*, giao PR-Dọn soi.
- "Người giữ việc" (Cần xử lý, `scoreDebt.teacherOf`: phân công hiệu lực, người đầu tiên) và "GV chấm" (Lịch Test, `ownersByClass`) đọc hai nguồn tên. Cần kiểm hai nguồn cho cùng kết quả → PR-Dọn.
- Thanh dưới biểu tượng (UX-D9), bảng quản trị thành thẻ → PR-UXD (kế hoạch đã ghi).
- Tiêu đề thông báo còn lại chưa theo mẫu "việc + em + lớp" → PR-S3 (kế hoạch đã ghi).
