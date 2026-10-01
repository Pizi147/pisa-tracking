# Rà PR #146 · PR-Pb2-b — mức ĐẦY ĐỦ (Opus 5.5, 01/10)

Phạm vi: `git diff f814ba26^1 f814ba26` (= phần Pb2-b trên `main` @ `f814ba26`), kế hoạch Phần B + hợp đồng a↔b, mockup 25 (cả bảng
"Định nghĩa từng cột", cột "Bấm số mở"), mockup 21, đặc tả §3.1h. Chỉ đọc mã, không chạy `npm run check`.

Tổng: **1 P0 · 6 P1 · 12 P2**. (Có thêm mục người rà UXF-a nhờ soi: `napBai` so với luật UXF-a Q9, Q10, `baiId` — xem hai P1 đầu.)

---

## P0

### [P0] `nhap_dau_ngay` ghi ngay khi ô W1/W2/S mới có MỘT tiêu chí — "lần nhập đầu" sai vĩnh viễn
- Chỗ: `server/src/fasttrack/attempts.ts:1666` (`hasValue = raw !== null || crit.some(v => v !== null)`) → `:1678` (`nhapDau = hasValue ? existing?.nhap_dau_ngay ?? today : null`); dùng ở `server/src/phanTich/giaoVien.ts:170`
- Lỗi: ô tiêu chí được coi là "đã có điểm" khi còn thiếu tiêu chí (band vẫn NULL), nên ngày nhập đầu bị chốt quá sớm; các lần lưu sau giữ ngày đó.
- Tình huống: hạn nhập 22/09. GV gõ tiêu chí 1 của Writing Task 1 ngày 20/09 (web `criteriaPatchFrom` gửi `{ criteria: [6, null, null, null] }`), gõ đủ 3 tiêu chí còn lại ngày 28/09 → `nhap_dau_ngay = 20/09` → bảng GV tính **Đúng hạn**. Nếu GV bỏ dở không bao giờ gõ đủ, ô vẫn "Đúng hạn" mãi. Trong khi đó Nợ điểm (`scoreDebt.ts:95`, `c.band !== null`) và `skillCells` (`cellScored = band !== null`) vẫn coi ô là CHƯA nhập / quá hạn → hai số lệch nhau, phép kiểm chéo UXF-a của kế hoạch ("chưa nhập & trễ ⊇ noDiemCuaGv.filter(overdue)") sẽ hỏng. Cột này không tính lại được từ dữ liệu khác → sai dữ liệu vĩnh viễn.
- Sửa: chỉ đặt ngày khi ô có điểm THẬT: `const coDiemSau = raw !== null || band !== null; nhapDau = coDiemSau ? existing?.nhap_dau_ngay ?? today : null;` (band null do bỏ bớt tiêu chí → NULL như "mất hết điểm"). `buNgayPb2b` (`seed/pb2bSeed.ts:29`) bỏ điều kiện `c1..c4 IS NOT NULL`. Thêm phép kiểm "gõ 1/4 tiêu chí ngày D, đủ 4 ngày D+5 sau hạn → trễ".
- Nguồn luật: Q13 ("lần đầu ô **có điểm**"), mockup 25 Chấm điểm "Lần nhập đầu ≤ hạn nhập", HOP_DONG_SO_LIEU §1 (một số một tập), skillCells "ô có điểm = band".

---

## P1

### [P1] `napBai` chép lại luật nợ điểm thay vì dùng luật chung của UXF-a — lệch Q9: em Kết thúc học / lưu trữ vẫn bị tính "trễ"
- Chỗ: `server/src/phanTich/giaoVien.ts:96-144` (`napBai` tự lặp `skillCells` / `regularSkillViews` như `scoreDebt.ts`, chỉ lọc `a.status != 'cancelled'`), `:127` (`tamDung = hv_status === 'inactive'`), `:165`
- Lỗi: UXF-a Q9 đặt luật "em không ĐANG HỌC không sinh nợ điểm" là `s.status = 'active' AND s.archived_at IS NULL` (`worklist/scoreDebt.ts:33`, `listAttempts({ chiDangHoc })`, `attempts.ts:594`). `napBai` chép vòng lặp nhưng chỉ loại `inactive` → em `finished` / đã lưu trữ vẫn vào tập Chấm điểm.
- Tình huống: em thôi học 10/09 (`setStudentStatus('finished')` không huỷ lượt MT); MT2 W3 SEP của em còn `planned`, hạn 22/09 qua → bảng GV ghi ô **Trễ n ngày, tới hôm nay**, đếm mãi; Tổng quan / Lịch Test / Nợ điểm / hồ sơ GV không có ô đó → "Chấm điểm đúng hạn" lệch số Tổng quan.
- Sửa: dùng chung một điều kiện "em đang học" với UXF-a (xuất một hằng SQL / hàm lọc dùng chung với `scoreDebt`, `listAttempts`) trong câu `napBai` cho tập Chấm điểm (Kết quả vẫn giữ bài đã có điểm); không viết điều kiện thứ hai. Thêm phép kiểm chéo UXF-a của kế hoạch.
- Nguồn luật: UXF-a Q9 (T65), Q20, kế hoạch Task 4 "chéo UXF-a: chưa nhập & trễ ⊇ noDiemCuaGv(...)", HOP_DONG_SO_LIEU §1.

### [P1] Chấm điểm dùng luật trễ riêng `hôm nay > hạn` — lệch UXF-a Q10 (tuần thi chưa hết thì chưa ai trễ)
- Chỗ: `server/src/phanTich/giaoVien.ts:166` (`!x.nhapDau && c.homNay <= x.han` → bỏ qua), `:170` (`dung = nhapDau ≤ han`), `:174` (`tre = ngayCach(han, …)`); luật chung `server/src/platform/week.ts:97-103` `quaHanNhapDiem(han, tuanThi, today)` = qua Chủ nhật tuần thi **và** qua hạn — `viewSkill` (`skillSchedule.ts:334`) và `skillCells` (`attempts.ts:386`) đã dùng, trả sẵn `overdue` mà `napBai` bỏ không đọc.
- Lỗi: hạn bị đặt đè sớm hơn Chủ nhật tuần thi (Q10 "áp cứng cả khi hạn bị đặt đè sớm hơn") → bảng GV tính trễ trong khi mọi màn khác chưa coi là quá hạn.
- Tình huống: tuần thi W3 SEP (14–20/09), hạn đặt đè Thứ Tư 16/09. Hôm nay 18/09 chưa nhập → bảng GV: **Trễ 2 ngày** (có trong mẫu số, panel đỏ); Lịch Test / Nợ điểm / Tổng quan: chưa quá hạn. GV nhập 19/09 (còn trong tuần) → bảng GV vẫn **Trễ 3 ngày** vĩnh viễn, dù theo Q10 chưa từng quá hạn.
- Sửa: một luật: mốc trễ hiệu lực = `max(hạn, Chủ nhật tuần thi)` lấy từ chính `quaHanNhapDiem` (xuất thêm hàm "mốc trễ" ở `week.ts`, `quaHanNhapDiem` gọi lại nó); "chưa nhập & chưa quá hạn" đọc `overdue` của `skillCells` / `regularSkillViews` thay cho `homNay <= han`; số ngày trễ đếm từ mốc đó. Thêm phép kiểm "hạn đè sớm, nhập trong tuần thi → đúng hạn".
- Nguồn luật: UXF-a Q10 (T53 Q2), HOP_DONG_SO_LIEU §1 (một số một hàm), mockup 25 "hạn sau khi dời".

### [P1] Xử lý vi phạm: em Tạm dừng vẫn bị tính trễ cho GVCN
- Chỗ: `server/src/phanTich/giaoVien.ts:273-280` (`tapXuLyViPham` không đọc trạng thái em)
- Lỗi: vi phạm đã chốt hạn rồi em Tạm dừng → qua hạn trong lúc tạm dừng, bảng tính trễ; luật T65 nói em Tạm dừng không bao giờ quá hạn (`trangThaiViPham` trả `han: null`).
- Tình huống: 3 vi phạm chốt `han_xu_ly = 10/09`, em Tạm dừng 08/09, hôm nay 20/09 → ô Xử lý vi phạm của GVCN có 3 mục **trễ**; màn Ý thức của em cùng lúc không báo quá hạn. Em không quay lại (thôi học) → trễ vĩnh viễn. Chấm điểm thì có loại em Tạm dừng (Q20) → hai cột cùng bảng hai luật.
- Sửa: JOIN `students` trong câu `tapXuLyViPham`, bỏ mục chưa phản hồi của em `inactive` (và em đã thôi học — hỏi planning); hoặc khi Tạm dừng thì xoá `han_xu_ly` chưa phản hồi (Quay lại học đã có `ghiDe` để chốt lại).
- Nguồn luật: T65, Q14, mockup 25 "Đúng hạn khi GVCN … trước hạn".

### [P1] Gán người theo `assessment_attempts.class_id` HIỆN TẠI — chuyển lớp giữ khoá đổi người được tính
- Chỗ: `server/src/phanTich/giaoVien.ts:163` (Chấm điểm), `:196` (Kết quả), `:231` (HV tiến bộ) đều `nguoiLuc(x.classId, …)`; `classId` = `a.class_id` hiện tại. `server/src/classes/luatLoTrinh.ts:276` dời mọi lượt `planned` sang lớp mới khi chuyển lớp giữ khoá.
- Lỗi: lượt FT chưa đủ điểm vẫn `planned` (`refreshOutcome`, `attempts.ts:1411`), nên khi em chuyển lớp, ô đã chấm ở lớp cũ được gán cho GV lớp mới (nếu phân công lớp mới có hiệu lực ở ngày đó) hoặc rơi mất (không ai).
- Tình huống: MT3 W3 SEP, GV A (lớp X) nhập L đúng hạn, W2 chưa nhập; em chuyển sang lớp Y từ W4 SEP → `class_id = Y`. Bảng GV: ô L "đúng hạn" và kết quả L tính cho người dạy L ở lớp Y (nếu dạy từ trước W3 SEP) hoặc mất khỏi A; ô W2 trễ đổ cho GV lớp Y. Mockup 25: "Em đã chuyển lớp vẫn tính cho người dạy em **lúc thi**".
- Sửa: lấy lớp của em ở tuần thi (enrollment hiệu lực ở `x.tuan`, nạp theo lô một câu) thay cho `a.class_id`; hoặc ghi chốt lớp lúc thi vào ô/lượt. Thêm phép kiểm "em chuyển lớp vẫn tính cho người dạy lúc thi" (kế hoạch Task 4 có, mã chưa có).
- Nguồn luật: Q15, mockup 25 cột "Kết quả môn mình dạy" (định nghĩa + chú thích nổi).

### [P1] Thiếu các phép kiểm kế hoạch Task 4 ghi rõ (Chấm điểm, Kết quả)
- Chỗ: `server/src/tests/prPb2b.tests.ts` (khối 4c–4j)
- Lỗi: không có: (a) chéo UXF-a "chưa nhập & trễ ⊇ `noDiemCuaGv(...).filter(overdue)` quy về `baiId`"; (b) vắng đã xác nhận / huỷ / MT lịch sử → không có mặt (chỉ có "-" và Tạm dừng); (c) "tuần sau chưa nhập → không có mặt" ở biên khoảng; (d) "em chuyển lớp vẫn tính cho người dạy lúc thi". Hai phép (a), (d) nếu có sẽ bắt được hai P1 ở trên và P0 (ô thiếu tiêu chí).
- Tình huống: —
- Sửa: bổ sung đúng 4 phép kiểm theo kế hoạch.
- Nguồn luật: Kế hoạch Phần B Task 4 "Phép kiểm trước"; CHUNG §1 (mỗi dòng kế hoạch phải có).

### [P1] Lưu "Sửa phân công" lớp FOU có thể âm thầm gán G+V cho người dạy L, R
- Chỗ: `web/src/modules/classes/TeacherAssignPanel.tsx:56-59` (`chonKhiDoiTach(c, fou.gop, false)` khi `nenTachFou` = false) → `slotsTuO` trải ô gộp thành 3 dòng (`shared/domain/phanCong.ts:31-36`)
- Lỗi: lớp FOU có L = R = người 7, G+V **chưa phân công** → mở panel ở chế độ gộp, ô gộp = 7; QL chỉ đổi GVCN rồi Lưu → máy chủ nhận thêm dòng `writing` cho người 7 (phân công mới hiệu lực từ hôm nay) mà QL không chọn. Người 7 từ đó bị tính Chấm điểm/Kết quả G+V.
- Sửa: chỉ gộp sẵn khi L, R, G+V cùng một người (cả ba có người); có môn trống thì mở sẵn tách, hoặc khi lưu chỉ trải ô gộp ra những môn đã có người / người dùng đã đụng tới ô gộp. Hỏi planning nếu Q23 "trống → 2 ô" là chủ ý.
- Nguồn luật: Q23, Q31-5 ("Dữ liệu không đổi"), CLAUDE.md "chống mất/sai dữ liệu".

---

## P2

### [P2] Panel Chấm điểm trả tên của BẤT KỲ tài khoản nào qua `gv=`
- Chỗ: `server/src/phanTich/giaoVien.ts:383-384`
- Lỗi: không kiểm `gv` có phân công ở chi nhánh `cn`; `SELECT full_name FROM users WHERE id = ?` trả tên mọi user id.
- Tình huống: QL CP gọi `/phan-tich/giao-vien/cham-diem?cn=<CP>&gv=1..N` → đọc được tên mọi tài khoản (rows rỗng). Lộ ít (chỉ tên) nhưng là dò được.
- Sửa: `gv` không nằm trong `c.pc` → 404 "Giáo viên không có lớp ở chi nhánh này".
- Nguồn luật: CHUNG §4 phân quyền; kế hoạch Global "mọi đường mới có phép kiểm PHỦ ĐỊNH".

### [P2] Phép kiểm "Không N+1" (4m) thêm lớp KHÔNG có học viên / bài
- Chỗ: `server/src/tests/prPb2b.tests.ts:470-486`
- Lỗi: 2 lớp mới chỉ có phân công, không ghi danh, không lượt → không chứng minh số câu không tăng theo số bài / lớp có dữ liệu (`skillCells` gọi `editableSkills`/`grantCovers` theo lớp). `tocDoDuong` chỉ đo một cỡ dữ liệu.
- Sửa: thêm 2 lớp có em + lượt có điểm (hoặc đo bằng bộ nhân ×3 của `tocDo.run.ts`).
- Nguồn luật: Kế hoạch Task 4 "Không N+1", CHUNG §5.

### [P2] Link P6 hồ sơ GV thiếu `ct`
- Chỗ: `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx:100-101`
- Lỗi: `/phan-tich?goc=hieu-qua-pa&cn=…&gv=…` không `ct` → Pb2-a mặc định FT; GV chỉ dạy lớp thường mở ra bảng FT trống.
- Sửa: thêm `ct=thuong` khi mọi lớp của GV là lớp thường (hoặc khung đầu tiên trong `data.lop`).
- Nguồn luật: Hợp đồng a↔b "URL Hiệu quả PA" (có `ct`), Q26.

### [P2] Chip "Bàn giao" của GVBM mở panel không kèm môn
- Chỗ: `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx:168` (`?viec=ban-giao`, không `&mon=`)
- Lỗi: việc Bàn giao môn ở Công việc dùng `?viec=ban-giao&mon=…` (`banGiao.ts:314`); chip GVBM bỏ `mon` → `BanGiaoPanel` mở phần chung (của GVCN), không mở thẳng môn cần ghi.
- Sửa: chip `loai = 'gvbm'` thêm `&mon=` (mã môn đầu còn thiếu).
- Nguồn luật: Q25 "bấm → hồ sơ lớp" cùng nguồn việc Bàn giao.

### [P2] Ngày "sửa dd/mm" ở panel lấy giờ máy UTC của nhật ký
- Chỗ: `server/src/phanTich/giaoVien.ts:390-397` (`MAX(al.created_at)` → `slice(0, 10)`); `writeAudit` ghi `nowIso()` (UTC)
- Lỗi: bản chính: sửa lúc 0h–7h giờ VN hiện ngày hôm trước; bản demo: ngày sửa là ngày máy (vd 01/10) trong khi nhập đầu là ngày demo (14/09) → "sửa" sau ngày nghiệp vụ hôm nay. Đã có `ponytail:` nhưng chưa nêu lệch múi giờ ở bản chính.
- Sửa: ghi ngày nghiệp vụ của lần sửa vào `after_json` (`ngayNghiepVu: today`) và đọc từ đó; tối thiểu đổi giờ VN trước khi cắt ngày.
- Nguồn luật: Global "ngày nghiệp vụ `demoToday()`", mockup 25 màn C "sửa 26/09".

### [P2] Panel Chấm điểm: cột "Hạn nhập", "Lần nhập đầu" 14 px
- Chỗ: `web/src/modules/phanTich/PhanTichGiaoVien.tsx:345-349` (`td` mặc định `text-sm`)
- Lỗi: luật "kết quả, hạn, người phụ trách 12 px"; cột Kết quả đã 12 px, hạn chưa.
- Sửa: `text-xs` cho hai ô ngày.
- Nguồn luật: CHUNG §2, Global "12 px cho kết quả, hạn".

### [P2] Rời góc "Giáo viên" sang "Hiệu quả PA" mang theo `tu`/`den`/`thang`
- Chỗ: `shared/domain/phanTich.ts:62-64` (`thamSoXoaKhiDoiGoc('hieu-qua-pa')` không xoá `tu`,`den`) + `PhanTichGiaoVien.tsx:105-109` ghi `tu`/`den` lên URL chung
- Lỗi: khoảng của bảng GV thành bộ lọc khoảng của Hiệu quả PA (ẩn ô `tg`, hiện chip khoảng); `thang` không bao giờ được dọn.
- Sửa: khi rời `giao-vien` xoá `tu`, `den`, `thang` (thêm nhánh cho `'giao-vien'` trong `thamSoXoaKhiDoiGoc` — file của Pb2-a, cần planning gom).
- Nguồn luật: chú thích Pb2-a tại `phanTich.ts:59-61` ("để quay lại không bị lọc ngầm").

### [P2] `han_xu_ly` không chốt lại khi chuyển lớp (mốc lớp đổi)
- Chỗ: `server/src/yThuc/trangThai.ts:208-239` (chỉ gọi ở ghi/sửa/xoá vi phạm, từ chối, Quay lại học)
- Lỗi: `trangThaiViPham` tính hạn từ `max(batBuoc, mocLop)`; chuyển lớp đổi `mocLop` → hạn trên màn Ý thức lùi ra, `han_xu_ly` vẫn hạn cũ, gán GVCN lớp cũ. Đúng chữ Q14 ("chỉ Quay lại học ghi đè") nhưng hai hạn khác nhau trên hai màn.
- Sửa: planning quyết: chốt lại khi thi hành lệnh chuyển (như `ghiDe`), hoặc ghi rõ vào chú thích nổi.
- Nguồn luật: Q14, M-08.

### [P2] D18 không dựng "PA GV thêm có kết quả cuối"
- Chỗ: `server/src/seed/pb2bSeed.ts:72-183`
- Lỗi: kế hoạch Task 6 đòi; bộ D18 không tạo Case/PA nào; phép kiểm 4k phải mở 13 tuần mới thấy PA (dựa dữ liệu seed cũ); DEMO.md mục 17 không có dòng PA hiệu quả.
- Sửa: thêm 1–2 PA `preset = 0` có kết quả trong W1–W3 SEP cho Hương/Duyên; dòng DEMO.md.
- Nguồn luật: Kế hoạch Phần B Task 6.

### [P2] Chú thích `migrate.ts` "PR-CT LUÔN ĐỨNG CUỐI" đã sai
- Chỗ: `server/src/migrate.ts:484-485`
- Lỗi: `migratePrPb2b` đứng sau `migratePrCt`; chú thích cũ thành sai (không lỗi chạy — chỉ thêm cột).
- Sửa: sửa chú thích ("PR-CT trước các bước chỉ thêm cột của PR sau").
- Nguồn luật: —

### [P2] Nhật ký B thiếu dòng cổng gộp 2 (`94e45e8e`)
- Chỗ: `docs/superpowers/plans/2026-10-01-pr-pb2-phan-tich-giao-vien.md:788-800`
- Lỗi: cổng gộp VAI-a/VAI-b/UXF-a (bỏ bản `baiId` chép, bỏ route `bo-quen`, 2162 + 28) chỉ ghi ở commit message; Nhật ký dòng cuối vẫn ghi "UXF-a chưa merge → giữ bản `baiId` chép".
- Sửa: thêm một dòng Nhật ký.
- Nguồn luật: Quy trình nhanh "Cổng gộp … ghi Nhật ký".

### [P2] Phép kiểm cũ "PR-Pb · Không N+1 tongHop" bị nới
- Chỗ: `server/src/tests/phanTich.tests.ts:293-304`
- Lỗi: từ `n4 === n26` thành `n26 - n4 ≤ 2 × số lô thêm` — đúng là không N+1 theo lượt, nhưng là nới phép kiểm cũ vì bộ demo lớn lên; đã "báo planning" trong Nhật ký, chưa thấy planning chốt.
- Sửa: planning xác nhận hoặc đo bằng bộ dữ liệu cố định.
- Nguồn luật: Global "phép kiểm cũ đổi kỳ vọng thì sửa, không xoá" (đã theo) + báo planning.

---

## Đã kiểm, không có lỗi
- Migrate: `migrate/prPb2b.ts` kiểm `PRAGMA table_info` từng cột → chạy hai lần không lỗi, không báo; `ALTER TABLE … ADD COLUMN … TEXT`, không tham số; `schema.sql` ba cột ở cuối bảng, cùng kiểu, cùng thứ tự (phép kiểm 1a, 1b, J1, YT4 (2)); `init-ban-chinh` dựng từ `schema.sql` nên đã có cột.
- Mọi đường ghi điểm đi qua `saveScore` / `saveRegularScore` (`PUT /attempts/:id/scores/:skill`, `PUT /regular/attempts/:id/scores/:skill`; dán hàng loạt ở web gọi từng ô; không có nhập Excel điểm; Huỷ điểm `keHoachTest.ts:455,479` gọi `saveScore` null → NULL; Thi lại / xoá tay → `matHet` → NULL; Speaking chấm chéo cùng `saveScore`; `luuNhanXet`, dấu "-", vắng/chốt vắng (`absence.ts`) không đụng cột) — không bỏ sót đường (ngoài P0 ô thiếu tiêu chí).
- Sửa điểm sau giữ `nhap_dau_ngay` (`existing?.nhap_dau_ngay ?? today`), ngày = ngày nghiệp vụ `today`/`demoToday()`.
- `chotHanXuLy`: đọc `trangThaiYThuc` (không chép luật), gọi trong tx ở ghi / sửa / xoá vi phạm, QL từ chối (`loaiYeuCau.ts:335`), Quay lại học (`ghiDe`, sau `addJourney` resume); lô 400, chỉ `?`. `ghiPhanHoi` ở `xacNhanXuLy` + `guiDeXuat` (không ở nháp), `phan_hoi_ngay IS NULL` giữ ngày đầu, ngày = `demoToday()`.
- Quyền bảng GV: `scopeFor(MEETING_VIEW)`; GV → 403; QL chi nhánh khác → 403; QT không `cn` → 400; góc nhìn chỉ trong `/phan-tich` (gác `nav.analysis = MEETING_VIEW`).
- Định nghĩa cột khớp mockup 25: Chấm điểm (phân công ở hạn nhập, loại vắng/huỷ/skip/chờ dời/MT lịch sử/"-"/Tạm dừng/chưa tới hạn chưa nhập, trễ đếm tới hôm nay); Ghi kết quả PA = `metricSet('dung-han-cap-nhat')` → người phụ trách Case; Xử lý vi phạm chỉ GVCN (`na` khi không GVCN), `valid = 1`, `han_xu_ly` trong khoảng; PA hiệu quả = `paCoKetQua` của Pb2-a lọc `!quyChe`, nhóm `success`; Kết quả = `danhGiaMon` tách nguyên thân (`phanTichLop` gọi lại, cùng hành vi), loại KCK; HV tiến bộ FT, W1/W2 riêng, KCK vẫn tính.
- `napBai`: "bài" = một ô `baiId(attemptId, skill)` của UXF-a (W1, W2 riêng); MT lịch sử loại qua `progress = 'lich_su'` (cùng tập `NOT_DEBT`); em `inactive` loại (thiếu `finished`/lưu trữ — xem P1).
- Số ô Chấm điểm = số dòng panel (cùng `tapChamDiem`, phép kiểm 4c); "Trễ" = m − n.
- `chuOPtGv`: "—" = `na`, "không có" = `rong`, < 5 mục "mẫu nhỏ"; `mauKetQuaGv` lấy từ % đã `Math.round`; màu chỉ ở ô kết quả, không thanh.
- Khoảng: `khoangPtGv` ≤ 13 tuần, `tu`/`den` phải Thứ Hai, `thang` = tuần có Thứ Năm thuộc tháng; mặc định 4 tuần.
- Bấm số: Đang dạy → `/giao-vien/{id}`; Chấm điểm → panel; Ghi kết quả PA → `/cong-viec?nguoi&nhom=case-hoc-thuat&khung&cn`; Xử lý vi phạm → lớp `?tab=y-thuc` / `/phan-tich?goc=y-thuc&cn`; PA hiệu quả → URL hợp đồng `goc=hieu-qua-pa&cn&ct=ft&gv&tu&den`; Kết quả → `?tab=phan-tich&ky-nang=` (PhanTichLopTab mở sẵn + cuộn, khoá lạ bỏ qua) hoặc hồ sơ GV.
- SQL: chỉ `?`; lô 400 (`napBai` 404 tham số, panel UNION 2 vế 800 tham số); không câu theo GV; trần `tocDoDuong` cho 3 đường (QL, QT, GVCN 403).
- FOU hai GV: `oPhanCong(…, { tach:false })` chỉ FOU; không truyền `tach` = như cũ (máy chủ không đổi, nhận 4 dòng môn); BE/ELE/FT không đổi; Pre FOU một ô GVCN (`moRongPhanCong` thêm `tong_hop` cho GVCN); lỗi môn hiện ở ô gộp (`loiTaiO`); "GVCN dạy ≥ 1 môn" giữ; gợi ý ô gộp = người khai L/R/W1/W2; nút Gộp tắt + `title` khi khác người; vùng bấm 44 px ở điện thoại.
- Hồ sơ GV: vai một chip `nhanVaiLop` ("GVCN · L R G+V"); lớp thường 4 cột cố định L · R · W (G+V) · S (P), ô chỉ số, Pre FOU một ô kéo 4 cột; viền xanh ô môn mình dạy (`MON_CUA_MINH`) còn; chip "Bàn giao n/m em" 12 px từ `viecBanGiao` một lần; link Case → `duongHoSoHocVien(…, { caseId })`.
- Demo D18 chỉ ở `seed/seed.ts` → `pb2bSeed.ts`; `init-ban-chinh` (`ops/initBanChinh.ts`) chỉ dùng `schema.sql` + `duLieuNen`, không gọi seed; `buNgayPb2b` chỉ seed.
- Cổng gộp `94e45e8e`: diff `569515bf..f814ba26` chỉ chứa phần của Pb2-b, không xoá dòng nào của VAI-a/VAI-b/UXF-a (`hoSo.ts` giữ `baiId`/`noDiemCuaGv` của UXF-a + `ctTuyChon` của Pb2-a; `routes` bỏ `bo-quen` theo VAI-a); một bản `baiId` (`shared/domain/cases.ts`, của UXF-a); Pb2-b không import `ChuongTrinh`/`CHUONG_TRINH`, không `'ca-hai'`; không thêm bản `tuanHocFt`/`chuTuanHoc`/`khoangTamDung` thứ hai; `GOC_NHIN` = `[tong-hop, van-de, hieu-qua-pa, y-thuc, giao-vien]`; `PhanTich.tsx` đúng ba chỗ.
- Chữ trên màn: mã tuần qua `tuanLich`, ngày qua `ngay()` chỉ cho hạn/nhập đầu/sửa; không "n/16", không "ca"; token màu (`slate-*` ánh xạ biến), chú thích nổi mở bằng Tab (`group-focus-within`, `aria-describedby`); thẻ 375 ẩn dòng `na`, bảng `table-layout: fixed` + `table-scroll`.

## Chuyển cho PR khác
- `thamSoXoaKhiDoiGoc` dọn `tu`/`den`/`thang` khi rời góc "Giáo viên" (file của Pb2-a) → **PR-Dọn** hoặc lượt 2.
- Chữ chú thích nổi bảng GV vào `THUAT_NGU_DA_CHOT.md` → **PR-S3** (kế hoạch đã ghi).
- `init-ban-chinh` có ba cột mới · DEMO.md kịch bản D18 đầy đủ → **PR-DEPLOY** (kế hoạch đã ghi).
- Planning quyết: (1) chuyển lớp có chốt lại `han_xu_ly` không; (2) em thôi học còn vi phạm chưa xử lý / lượt `planned` có tính cho GV không; (3) Q23 "G+V trống vẫn gộp" có chủ ý tự gán G+V khi lưu không; (4) xác nhận nới phép kiểm N+1 `tongHop` + nâng trần `congViec30PaChuaNgayThi` 91 → 94.
