> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Rà chức năng — HỒ SƠ HỌC VIÊN + CASE (mã HV, N=3, web :5513, DB a3)

Ngày demo 14/09/2026 · bản build main (sau OV-10b #363). Xong (25 mục: 1 chặn · 15 lỗi · 3 thừa · 6 gợi ý/câu hỏi).
Ghi chú dữ liệu: DB a3 đã bị thao tác (em 3, 2, 23, 20, 24, 34, 70, 96, 11, 47, 82…) — muốn sạch thì `env.sh 3 reset`. Demo KHÔNG có sẵn em Tạm dừng / có MT0 / có kết quả thi thật: đã tự tạo (Tạm dừng em 2, 3, 23; chốt Lên FT em 11 → MT0; nhập thi thật em 34).

## Đã đi
| Trang | Vai | Thao tác đã thử |
|---|---|---|
| /hoc-vien/{3 FT SOS, 11 FOU, 128 PET, 96 Kết thúc học, 39 Lưu trữ, 20 CP FT, 33 UB FT} | QL, QT | mở hồ sơ, ⋯ menu, cờ `viewer` / `lopHoc.quyen`; CP/UB với QL MB → 403 đúng |
| /hoc-vien/{3, 11, 128, 96, 7, 118} | GVCN (7) | menu, Sửa thông tin (Target → Đề xuất, đầu vào), Tạm dừng (→ HV-10), Case + PA + Kết quả + Sửa kết quả + Hoàn thành + Mở lại (case 82), Xác nhận Case SOS (47/36), Ý thức Bỏ ghi nhận / Ghi nhận (92), Phối hợp SOS, Mini Test, ghi bù Case (→ HV-19); lớp khác 403 đúng |
| /hoc-vien/{3, 7, 12, 118} | GVBM (9) | menu "Đề xuất sửa…", + Case (báo trùng → mở Case riêng), Ghi vi phạm + Sửa; API 403 cho status/PATCH/target/outcome/transfer |
| /hoc-vien/{20, 21, 3} | ADMIN (22, CP) | nút thẳng, Sửa thông tin (không Target), Đề xuất sửa (→ HV-2), Case/Ý thức chỉ đọc; API 403 status/target/transfer/hoc-lai/outcome |
| /hoc-vien/{20, 23, 24, 3} | TVV (23, CP) | Sửa thông tin (Target, TVV = người cùng CN, Liên hệ), Tạm dừng → Quay lại → Thôi học → Hoàn tác, Kết quả thi thật + sửa; API 403: đổi lộ trình, sửa điểm, đóng Case, báo Case, vi phạm, chuyển lớp, lưu trữ, bước tiếp, lộ trình tiếp |
| /hoc-vien/{20, 3, 96, 39} | CX (24) | như TVV, mọi CN; API 403 như TVV; /phan-tich/giao-vien 403 |
| /hoc-vien/{33, 34} › Hành trình › Tổng kết | QL UB (6), GVCN UB (16) | nhập thi thật, Bước tiếp Kết thúc → Sửa → Học lại (→ HV-6), Hoàn tác (DELETE) |
| /hoc-vien/{96, 39} | QL | Lưu trữ (→ HV-8), Học lại + Hoàn tác, Bỏ lưu trữ, nhập điểm bù khi Lưu trữ (chặn đúng) / Kết thúc học (cho đúng) |
| /hoc-vien/{11, 47} | QL | ⋯ Lộ trình tiếp theo (mở đúng hộp ở hồ sơ lớp), chốt Lên FT → MT0, Chuyển lớp, dải Sắp chuyển › Huỷ quyết định |
| /hoc-vien/{3, 70, 73} | QL | Target + KCK (→ HV-18), Lộ trình FT (HopKyNang + Thêm MT4) |
| Quay lại / Trước-Sau | QL, TVV, CX | Học viên & Lớp ?view=sos (giữ lọc + cuộn 200), hồ sơ lớp (giữ cuộn), Sau ›; Công việc / Tổng quan không có link hồ sơ |
| Bốn ô số | QL | Kết quả gần nhất → ?dot, Học thuật → ?kn, Ý thức → tab, Sắp tới → ?dot — đúng |
| 375 sáng | QL, GVCN, TVV | hồ sơ FT, Sửa thông tin, Case, Xác nhận Case, Hành trình, Tạm dừng, Kết quả thi thật, Chuyển lớp (→ HV-23) |
| Không đi | — | Đề xuất chuyển lớp (GVCN) chi tiết, Báo PH gửi thật, Xoá học viên (QT), 1440 sáng / 375 tối |

## Phát hiện

### HV-1 · lỗi · GVCN đổi Target lần 2 bị 400, panel không báo đang có đề xuất chờ, không chỉ chỗ sửa
- Trang · vai: /hoc-vien/3 (Lê Quang Huy, MB FT 101) · GVCN (7)
- Tái hiện: ⋯ Sửa thông tin → Target 7, lý do → Lưu ("Đã lưu · Target gửi Quản lý duyệt") → mở lại Sửa thông tin: ô Target vẫn 6.5, không có dòng "đang chờ duyệt 7.0" → đổi 7.5 + lý do → Lưu.
- Thấy: toast "Đã lưu thông tin · Target chưa lưu: Đã có một đề xuất sửa target của em đang chờ Quản lý duyệt." (400 POST /students/3/de-xuat-sua). Không nói sửa ở đâu; chữ "target" viết thường. Hồ sơ HV của GVCN không hiện đề xuất đang chờ.
  · Đúng ra: plan.md mục 3 dòng 13/10 "Sửa sau khi lưu" — việc đã gửi phải mở lại sửa được; CLAUDE.md "bị chặn thì nói lý do + bước tiếp". Đường sửa có thật (TheYeuCau "Sửa…" ở Công việc › Yêu cầu của tôi, OV-7a) nhưng Sửa thông tin không dẫn tới.
- Nguyên nhân: `web/src/modules/students/StudentManagePanel.tsx:491-496` luôn POST đề xuất mới; `server/src/duyet/deXuatSua.ts:47` chặn trùng; câu thiếu bước tiếp.
- Đề xuất: (a) dưới ô Target hiện "Đang chờ duyệt: 7.0 (gửi 14/09) · Sửa đề xuất" khi có thẻ chờ; hoặc (b) tối thiểu: câu lỗi thêm "— sửa ở Công việc › Yêu cầu của tôi", toast lần đầu cũng nói chỗ xem như `DeXuatSuaPanel` (:59). Không cần mockup (đổi chữ / thêm dòng theo mẫu).
- Ảnh: $SP/anh/ho-so-hv/GVCN-3-luu2.png

### HV-2 · lỗi · Admin (và API cho cả TVV/CX) gửi được "Đề xuất sửa" Target / Lộ trình — trái ma trận vai
- Trang · vai: /hoc-vien/20 (Hồ Thanh Tùng, CP FT 110) · ADMIN (22)
- Tái hiện: Admin mở hồ sơ → nút thẳng "Đề xuất sửa thông tin…" → panel cho chọn Target · Lộ trình · Thông tin khác → Gửi Quản lý. API thẳng: ADMIN POST /students/20/de-xuat-sua {truong:target} → 200; TVV POST /students/21/de-xuat-sua {truong:lo-trinh} → 200; CX POST /students/22/de-xuat-sua {truong:target} → 200.
- Thấy: Admin có nút + máy chủ nhận. Đúng ra: đặc tả OV mục 2 ma trận: Target của Admin "—", Lộ trình tiếp theo Admin "—"; brief chủ SP "ADMIN … không Target". TVV/CX đã sửa Target thẳng (OV-8b) nên đề xuất là thừa; học thuật (lộ trình) không phải việc TVV/CX.
- Nguyên nhân: `server/src/students/profile.ts:1007` `coTheDeXuatSua` = không có cycle.edit + không edit_more + có student.view → Admin = true. `server/src/duyet/deXuatSua.ts:34` chỉ kiểm `STUDENT_VIEW` (câu lỗi lại nói "Chỉ giáo viên của lớp em đang học").
- Đề xuất: máy chủ `guiDeXuatSua` kiểm đúng "GV của lớp em đang học" (teacher assignment), `coTheDeXuatSua` dùng cùng hàm → Admin không còn nút. Ẩn nút, không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/ADMIN-20-dexuat.png

### HV-3 · lỗi · Hồ sơ đã Lưu trữ ghi "chỉ xem" nhưng Sửa thông tin / Lộ trình / Kết quả thi thật vẫn mở và lưu được; API nhận cả + Case
- Trang · vai: /hoc-vien/39 (Vũ Thu Uyên, đã lưu trữ) · QL, QT, CX
- Tái hiện: mở hồ sơ → dải "Học viên đã lưu trữ 26/04 — chỉ xem" → ⋯ (QL) / nút thẳng (CX) có "Sửa thông tin". API: CX PATCH /students/39 {phone} → 200; QL PATCH /students/39 {dob,email:""} → 200 (đã ghi vào DB).
  Em 96 sau khi QL Lưu trữ (dải "chỉ xem"): ⋯ vẫn có Sửa thông tin · Lộ trình · Kết quả thi thật · Học lại · Bỏ lưu trữ; QL PUT /cycles/111/outcome (thi thật) → 200 trên hồ sơ đã lưu trữ; QL POST /cases/report {studentId:96} → 200 (Case 83 tạo trên hồ sơ lưu trữ — web đã ẩn + Case). Đối chiếu: nhập điểm thì máy chủ chặn đúng ("Em đã lưu trữ — Bỏ lưu trữ trước khi nhập điểm."), Kết thúc học (chưa lưu trữ) nhập bù điểm được → 200 (đúng luật).
- Thấy: chữ "chỉ xem" và quyền lệch nhau. Đúng ra: brief "Lưu trữ khoá" (Kết thúc học nhập bù được, Lưu trữ khoá); cùng trang đã ẩn + Case.
- Nguyên nhân: `shared/domain/quanLyHocVien.ts:66,71,74` thêm 'info' / 'lo-trinh' / 'outcome' không xét `lopHoc.chiXem`; `server/src/students/students.ts` (PATCH /students/:id), `PATCH /cycles/:id`, `PUT /cycles/:id/outcome` không chặn `archived_at`.
- Đề xuất: chủ SP chọn một: (khuyến nghị) ẩn Sửa thông tin khi `chiXem` + máy chủ 400 "Đã lưu trữ — Bỏ lưu trữ trước rồi sửa"; hoặc giữ cho sửa và đổi chữ dải thành "đã lưu trữ — chỉ sửa thông tin liên hệ". Không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL-96-luutru.png (⋯ sau Lưu trữ); phần còn lại là API

### HV-4 · lỗi · Ô "Học thuật" ghi "mọi kỹ năng đạt" khi em chưa có điểm nào
- Trang · vai: /hoc-vien/96 (Ngô Thanh Tùng, Kết thúc học, 0 điểm), /hoc-vien/128 (PET, bảng kỹ năng trống), /hoc-vien/73 (Hồ Gia Hân, KCK chưa có Target — MT1 có điểm nhưng "không kỳ vọng") · QL
- Tái hiện: mở hồ sơ → ô thứ hai "Học thuật · 0 Case · mọi kỹ năng đạt", cạnh ô "Kết quả gần nhất — chưa có điểm nào" và bảng kỹ năng "chưa có điểm" cả 5 hàng.
- Thấy: khẳng định "đạt" khi không có điểm. Đúng ra: "chưa có điểm" / "Không có Case mở" (không nói đạt khi chưa thi; luật A 10/10 "kỹ năng thiếu = chưa thi").
- Nguyên nhân: `shared/domain/hoSoHocVien.ts:287` — `rows.some(missed === true) ? 'Không có Case mở' : 'mọi kỹ năng đạt'`: `missed === null` (chưa có điểm) rơi vào nhánh "đạt".
- Đề xuất: chỉ "mọi kỹ năng đạt" khi mọi hàng `missed === false`; còn lại "Không có Case mở". Sửa chữ, không cần mockup. (Phép kiểm `server/src/tests/prVaiB.tests.ts:271` cần thêm ca `missed: null`.)
- Ảnh: $SP/anh/ho-so-hv/QL-96.png, QL-128.png

### HV-5 · lỗi · PET: bảng "Tiến độ theo kỹ năng" vẽ 4 kỹ năng L/R/W/S "chưa có điểm" trong khi Checkpoint 1 đã có điểm L+S, R+W
- Trang · vai: /hoc-vien/128 (Lâm Bảo Ngọc, MB PET 01) · QL (mọi vai)
- Tái hiện: mở hồ sơ → khối Kết quả Test: "Checkpoint 1 · L+S 48/60 · R+W 61/80 · 2/2 môn đạt"; ngay trên, bảng kỹ năng: Listening / Reading / Writing / Speaking đều "chưa có điểm"; GET /students/128/skill-board trả 4 hàng listening…speaking, `points: []`.
- Thấy: cùng em, cùng lượt, hai khối nói ngược nhau. Đúng ra: plan.md mục 3 dòng 11/10 "PET/KET: môn L+S, R+W" — bảng theo 2 môn của chương trình (như lớp thường theo `tenMon`).
- Nguyên nhân: `shared/domain/cases.ts:114-117` `caseCategoriesFor` chỉ biết PREFOU / ratio / FT → PET lấy `NORMAL_CASE_CATEGORIES` (L/R/W/S); điểm PET lưu ở `listening_speaking` / `reading_writing` (`shared/domain/normal.ts:230`).
- Đề xuất: `caseCategoriesFor` trả `['listening_speaking','reading_writing']` cho PET/KET (bảng + QuickReport + Hành trình cùng nguồn), hoặc tối thiểu ẩn bảng kỹ năng với PET. Kiểm lại "+ Case" PET chọn môn nào (chủ SP: PET chỉ chip SOS, Case bàn sau). Không đổi bố cục.
- Ảnh: $SP/anh/ho-so-hv/QL-128.png

### HV-6 · lỗi · Bước tiếp sau thi: nút "Học lại" / "Học tiếp lộ trình mới" hiện cho em còn đang học → luôn 400; đổi "Kết thúc" → "Học lại" cũng 400
- Trang · vai: /hoc-vien/34 và /33 (UB FT 401, lộ trình FT đã đóng, em còn ghi danh active) › Hành trình › Tổng kết › Bước tiếp · QL UB (userId 6)
- Tái hiện: (1) GVCN UB (16) ⋯ Kết quả thi thật 34: 10/09/2026, L6 R6.5 W5.5 S6 → Lưu (ok, "Chưa đạt Target"). (2) QL 6 › Tổng kết › Kết thúc → "Đã chọn Kết thúc — vào Lưu trữ" (máy cho em Kết thúc học + Lưu trữ). (3) Sửa → Học lại → Về lớp cũ → Học lại.
  Em 33 (chưa chọn gì): bấm Học lại hoặc Học tiếp lộ trình mới (lớp 14) → cũng 400.
- Thấy: 400 POST /cycles/40/buoc-tiep "Em đang học — sang lớp khác thì dùng Chuyển lớp ở hồ sơ học viên." (giao dịch quay lui, em vẫn ở Lưu trữ — không mất dữ liệu). Câu sai sự thật ở bước (3): lúc đó em đang Lưu trữ.
  · Đúng ra: plan.md mục 3 dòng 13/10 "Bước tiếp sau thi thật … QL chọn Kết thúc · Học tiếp · Học lại" + "Sửa sau khi lưu"; nút hiện thì phải làm được.
- Nguyên nhân: `server/src/loTrinh/buocTiep.ts:99` chặn mọi lựa chọn ≠ Kết thúc khi `s.status !== 'finished'`; ở bước Sửa, `hoanTac` (:59 `hoanTacKetThuc`) vừa trả em về active nên luôn rơi vào chặn. `coMuc` (:32) và `MucBuocTiep` (`web/src/modules/students/NganTongKet.tsx:200`) không xét em còn học.
  Điều kiện gặp: lộ trình FT đã đóng mà em còn ghi danh (demo: 33, 34 UB FT 401 — dữ liệu `dien_nguoc`; bản chính: lộ trình đóng bằng "Kết luận lộ trình" cũ). Truy vấn DB a3: 1 em như vậy còn chờ (33).
- Đề xuất: với em còn học: Học lại / Học tiếp = cho Kết thúc học trong cùng giao dịch rồi `hocLai` (giống nhánh Kết thúc đã làm), hoặc ẩn hai nút + câu "Em đang học — dùng Chuyển lớp". Sửa câu lỗi. Không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL6-34-ketthuc.png, QL6-34-hoclai-panel.png

### HV-7 · lỗi nhỏ · Tổng kết lộ trình có kết luận CŨ: ô Thi thật "Chờ kết quả thi thật" nhưng Bước tiếp ghi "Gợi ý: Kết thúc · Đạt Target"
- Trang · vai: /hoc-vien/33 › Hành trình › Tổng kết · QL UB (6)
- Tái hiện: mở Tổng kết em 33 (chưa nhập thi thật) → ô "Thi thật: Chờ kết quả thi thật · Nhập kết quả" + ngay dưới "Bước tiếp · Gợi ý: Kết thúc · Đạt Target" + 3 nút chọn.
- Thấy: hai câu ngược nhau trên cùng ngăn ("Đạt Target" lấy từ kết luận cũ `outcome = reached`, không từ thi thật). Đúng ra: một số liệu một nguồn (CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn").
- Nguyên nhân: `server/src/loTrinh/buocTiep.ts:42` `goiY` đọc `bc_ket_luan ?? outcome`; `CO_KET_QUA` (:18) coi kết luận cũ là "có kết quả"; web `NganTongKet.tsx` ô Thi thật chỉ xét `ovr`/`khongThi`.
- Đề xuất: ô Thi thật với kết quả cũ ghi "Kết luận cũ: Đạt Target" (không "Chờ…"), hoặc gợi ý ghi "theo kết luận cũ". Đổi chữ, không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL6-33-tongket.png

### HV-8 · thừa · Lưu trữ ở ⋯ bắt tích "Tôi hiểu…" rồi mới bấm; cùng việc ở Bước tiếp "Kết thúc" thì một bấm + Hoàn tác
- Trang · vai: /hoc-vien/96 ⋯ Lưu trữ · QL
- Tái hiện: ⋯ Lưu trữ → bấm "Lưu trữ" → báo "Chưa đánh dấu xác nhận · 1 ô cần sửa" → tích ô → bấm lại. So với Tổng kết › Bước tiếp › Kết thúc: một bấm, thông báo có Hoàn tác.
- Thấy: 2 thao tác + xác nhận cho việc đảo được (panel tự ghi "không đổi trạng thái, không xoá dữ liệu… xem lại ở khu Lưu trữ"; có Bỏ lưu trữ). Đúng ra: CLAUDE.md "xác nhận chỉ khi hậu quả lớn"; "cùng loại thao tác cùng phản hồi".
- Nguyên nhân: `web/src/modules/students/StudentManagePanel.tsx:215-255` (`LuuTruPanel`, ô `xac-nhan` bắt buộc).
- Đề xuất: bỏ ô tích; nút Lưu trữ lưu ngay + thông báo Hoàn tác (như Thôi học / Kết thúc). Không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL-96-luutru.png

### HV-9 · thừa · Panel lồng panel: Tổng kết lộ trình mở Học lại / Học tiếp / Kết quả thi thật chồng lên trên
- Trang · vai: /hoc-vien/34 › Hành trình › Tổng kết › Sửa › Học lại (cũng: "Nhập kết quả") · QL UB / GVCN UB
- Thấy: panel "Học lại" (z-60, `longTrong`) đè lên ngăn "Tổng kết lộ trình" còn mở phía sau. Đúng ra: CLAUDE.md "không panel lồng panel" — `NganCase` đã làm mẫu "một khung đổi nội dung".
- Nguyên nhân: `web/src/modules/students/NganTongKet.tsx:213, 297` (`HocLaiPanel chong`, `KetQuaThiThatPanel chong`).
- Đề xuất: đổi nội dung ngay trong khung Tổng kết (dòng "← Tổng kết") như `NganCase`, hoặc đóng Tổng kết rồi mở panel. Nếu kế hoạch OV-8a đã duyệt kiểu chồng thì bỏ qua mục này. Đổi bố cục panel → planning quyết có cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL6-34-hoclai-panel.png

### HV-10 · chặn · GVCN cho em Tạm dừng xong thì mất hết quyền với em: không Quay lại học, không Sửa thông tin, không xử lý Ý thức
- Trang · vai: /hoc-vien/3 (Lê Quang Huy, MB FT 101) · GVCN (7, GVCN lớp này)
- Tái hiện: GVCN ⋯ Tạm dừng / Thôi học → Tạm dừng, lý do → Tạm dừng học ("Đã lưu", không có Hoàn tác) → tải lại hồ sơ: đầu trang chỉ còn "+ Case", KHÔNG còn ⋯. API: `viewer.canEdit=false`, `lopHoc.quyen.quayLai=false`, `canManageDiscipline=false`; GVCN PATCH /students/3 → 403 "Bạn chỉ thao tác được trong lớp mình được phân công." Dải vàng vẫn ghi "Quay lại học thì hạn tính lại từ ngày quay lại".
- Thấy: GVCN bấm nhầm Tạm dừng thì không có đường lui (không Hoàn tác, không Quay lại học) — phải nhờ QL / TVV. Ý thức của em (3 vi phạm, bắt buộc Report 1) cũng không còn ai ở lớp xử lý.
  · Đúng ra: CLAUDE.md "làm sai thì sửa / huỷ / khôi phục đường nào", "không để người dùng kẹt"; panel tự ghi "giữ lớp và lộ trình để quay lại sau". TVV / QL vẫn Quay lại được (đã thử TVV em 23: ok).
- Nguyên nhân: `server/src/permissions.ts:193-197` `classesOfStudentDangHoc` chỉ lấy ghi danh `status = 'active'`; Tạm dừng đổi ghi danh thành `paused` → GVCN rơi khỏi phạm vi sửa hồ sơ / Ý thức.
- Đề xuất: coi ghi danh `paused` là "lớp đang học" cho GVCN (sửa hồ sơ, Quay lại, Thôi học, Ý thức); thêm Hoàn tác trên thông báo Tạm dừng (như Thôi học). Không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/GVCN-3-sau-tamdung-mat-quyen.png

### HV-11 · lỗi nhỏ · Em đã chốt "Lên FT": ô Sắp tới vẫn "Final Test · W1 OCT · xét lên BE", không nhắc MT0 tuần này
- Trang · vai: /hoc-vien/11 (Dương Ngọc Ánh, MB FOU 12) · QL, GVCN
- Tái hiện: QL ⋯ Lộ trình tiếp theo (mở đúng hộp ở hồ sơ lớp — đúng đặc tả) → Lên FT · MB FT 104 · tuần 21/09 · Target 6 → Chốt (MT0 tạo, attempt 329, tuần W3 SEP). Về hồ sơ HV: dải "Sắp chuyển MB FT 104 từ W4 SEP"; ô Sắp tới "Final Test · W1 OCT · 4 môn · xét lên BE"; bảng Kết quả Test chỉ có Progress + Final. Công việc GVCN cùng lúc có "Nhập điểm Listening, Reading · MT0 · hạn 23/09". Sau khi nhập MT0 (API, OVR 4.0): Hành trình có "MT0 · 4.0", còn Kết quả gần nhất / Kết quả Test vẫn không có MT0.
- Thấy: "xét lên BE" trái hướng đã chốt; MT0 (việc đang có hạn) không hiện ở đầu hồ sơ. Đúng ra: plan.md mục 3 dòng 11/10 "Lên FT → MT0 … Kết quả đầu ra theo MT0"; CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn".
- Nguyên nhân: `shared/domain/hoSoHocVien.ts:324` luôn ghi "xét lên {bậc kế}" cho Final lớp thường; `server/src/students/profile.ts:564` bỏ MT0 khỏi bảng lớp thường (PR-MT0 cố ý).
- Đề xuất: em có lệnh / lộ trình Lên FT → Sắp tới ưu tiên "MT0 · W3 SEP" (hoặc bỏ "xét lên BE"); cân nhắc thêm dòng MT0 vào Kết quả Test (chủ SP chọn — PR-MT0 đã cố ý bỏ). Đổi chữ, không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/GVCN-11-hanhtrinh-mt0.png, QL-11-chot-lenft.png

### HV-12 · lỗi nhỏ · Hành trình: lớp cũ ghi danh "completed" không có end_kind → cuối thẻ ghi "Kết thúc học" dù em đã lên lớp sau
- Trang · vai: /hoc-vien/1 (Nguyễn Minh An: MB FOU 03 → MB BE 08 → MB FT 101) › Hành trình · QL
- Tái hiện: mở tab Hành trình → thẻ MB FOU 03 cuối thẻ "Kết thúc học · từ W3 FEB 2026"; thẻ MB BE 08 "Kết thúc học · từ W1 JUN" — trong khi em học tiếp BE 08 rồi FT 101 (dòng trên ghi "cuối mỗi thẻ là cách em sang lớp sau").
- Thấy: chữ "Kết thúc học" (= thôi học) cho một lần lên lớp. Đúng ra: "Lên BE / Sang FT" như các ghi danh có `end_kind`.
- Nguyên nhân: `shared/domain/hanhTrinh.ts:607-612` — `endKind` NULL + `status='completed'` → `ket-thuc` mà không xét `sau` (lớp kế tiếp). Demo: 3 ghi danh như vậy; bản chính: mọi ghi danh trước PR-LT.
- Đề xuất: completed + có lớp sau → coi như 'len' (hoặc chữ trung tính "Sang {lớp sau}"). Đổi chữ, không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL-1-hanhtrinh.png

### HV-13 · lỗi · Panel Chuyển lớp báo "bàn giao, hạn hết 16/09" nhưng lệnh lưu xong hạn 18/09 (FT) / 20/09 (Lên FT cuối khoá)
- Trang · vai: /hoc-vien/47 (Vũ Ngọc Lan, MB FT 101) ⋯ Chuyển lớp… · QL; /hoc-vien/11 (MB FOU 12) dải Sắp chuyển › Huỷ quyết định · QL
- Tái hiện: ⋯ Chuyển lớp… → chọn MB FT 102 · W4 SEP · lý do → chân panel "GVCN MB FT 101 bàn giao, hạn hết 16/09." → Quyết định chuyển lớp → dải trên hồ sơ "Bàn giao: đã có 0/4 môn · hạn 18/09". Em 11 (Lên FT đã chốt ở Lộ trình tiếp theo): panel "hạn hết 16/09", dải + thông báo "hạn 20/09".
- Thấy: cùng một hạn hai số. Đúng ra: plan.md mục 3 dòng 11/10 "bàn giao FT 5 ngày"; lớp thường cuối khoá "hết tuần Final, ≥ 2 ngày sau chốt" — `hanBanGiaoLenh` đã làm đúng ở máy chủ.
- Chỗ thứ hai (đã tái hiện): hồ sơ em 47 của GVCN › thanh "VIỆC CỦA TÔI: Bàn giao môn L hạn 15/09" ngay cạnh dải "hạn 18/09" và việc "Bàn giao sang MB FT 102" hạn 18/09 (API `dauHoSo.viec`; Công việc dùng 18/09).
- Nguyên nhân: `web/src/modules/students/ChuyenLopPanel.tsx:168` và `server/src/students/viecHocVien.ts:143` gọi `hanBanGiao` cũ (2 / 3 ngày) thay vì hạn đã lưu trên lệnh (`lenh_chuyen_lop.han_gvbm/han_gvcn`) / `hanBanGiaoLenh` (`shared/domain/chuyenLop.ts:76`).
- Đề xuất: dùng `hanBanGiaoLenh({ nguonFt, boiCanh, tuanFinal, ngay })` như máy chủ (dữ liệu bối cảnh đã có trong `xem`). Sửa lỗi, không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL-47-chuyenlop.png, QL-11-huyquyetdinh.png

### HV-14 · lỗi · Case lớp thường do hệ thống mở (Progress Test không đạt), chưa có PA: Công việc báo "Thêm PA … quá hạn 18 ngày", hồ sơ HV báo "Đang làm", không hạn
- Trang · vai: /hoc-vien/11 (Dương Ngọc Ánh, MB FOU 12, Case 14 Reading "chưa ai phụ trách") · GVCN, QL; /cong-viec (GVCN)
- Tái hiện: GVCN /cong-viec → nhóm Case học thuật: "Quá hạn · Thêm PA học thuật Reading · Dương Ngọc Ánh · MB FOU 12 · Progress Test · chưa ai phụ trách · hạn 27/08 · quá hạn 18 ngày". Mở /hoc-vien/11: câu tóm tắt không có việc trễ; ô Học thuật "R · Đang làm"; bảng kỹ năng Reading "Đang làm · Chưa có PA · Thêm PA" không hạn. API skill-board: `viecTiep {chu:'Thêm PA', loaiHan:'lap-pa', han:null}`.
- Thấy: cùng một việc, hai nơi một bên đỏ 18 ngày, một bên không hạn. Đúng ra: CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn, cùng hàm tính".
- Nguyên nhân: `server/src/cases/cases.ts:1933` và `server/src/cases/caseLop.ts:96` đặt `hanLapPa = null` khi `origin_kind === 'mock'`; `server/src/worklist/mywork.ts:712-715` luôn tính `planDueDate(detected, urgency)` cho mọi Case chưa có PA.
- Đề xuất: một hàm hạn Thêm PA dùng chung cho hồ sơ + Công việc (quyết: Case hệ thống lớp thường có hạn 5 ngày hay không). Sửa lỗi, không cần mockup.
- Ảnh: (đối chiếu API + text) $SP/anh/ho-so-hv/GVCN-11-hanhtrinh-mt0.png

### HV-15 · thừa · FT: hai panel cùng sửa Tuần bắt đầu / Dự kiến thi / Target / Điểm đầu vào (⋯ Sửa thông tin và ⋯ Lộ trình)
- Trang · vai: /hoc-vien/3 · QL, GVCN
- Tái hiện: ⋯ Sửa thông tin → khối "Lộ trình đang học": Tuần bắt đầu, Dự kiến thi, Target (+KCK), Điểm đầu vào. ⋯ Lộ trình → Tuần bắt đầu học, Dự kiến thi, "Đổi Target" / "Đề xuất sửa" (GVCN), "Ghi điểm đầu vào", lịch MT. GVCN còn thêm mục thứ ba "Đề xuất sửa thông tin…" (Target / Lộ trình / Khác) → ba cửa cho Target.
- Thấy: một khái niệm, hai–ba chỗ sửa, chữ khác nhau ("Tuần bắt đầu" / "Tuần bắt đầu học"). Đúng ra: CLAUDE.md "một khái niệm một tên; cùng loại thao tác cùng vị trí"; đặc tả 11/10 "Target gộp vào Sửa thông tin (GVCN → Đề xuất sửa)".
- Nguyên nhân: `web/src/modules/students/StudentPlanPanel.tsx` (Lộ trình) giữ các ô cũ sau khi OV-2b đưa chúng vào `ThongTinPanel`.
- Đề xuất: Lộ trình chỉ còn lịch MT (đổi nhãn menu "Lịch MT"), các ô thông tin chỉ ở Sửa thông tin; GVCN bỏ mục "Đề xuất sửa thông tin…" vì Sửa thông tin đã gửi đề xuất Target. Bớt ô trong panel có sẵn — planning quyết có cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL-3-lotrinh.png, QL-3-suatt.png

### HV-16 · lỗi · Tạm dừng em là tự đóng mọi "Đề xuất sửa" đang chờ (Target…) — Quay lại học không mở lại
- Trang · vai: /hoc-vien/3 · GVCN gửi đề xuất Target 7.0 (yêu cầu id 32) → em bị Tạm dừng (14/09 16:03) → QL Quay lại học
- Tái hiện: (1) GVCN ⋯ Sửa thông tin → Target 7 + lý do → "Target gửi Quản lý duyệt". (2) Tạm dừng em (POST /students/3/status inactive). (3) Quay lại học. DB: `yeu_cau_duyet` 32 `trang_thai = 'tu_dong'`, `ly_do_dong = 'Học viên không còn học hoặc thông tin đã được sửa'`, `xu_ly_luc` = đúng lúc Tạm dừng. Hộp Chờ duyệt của QL không còn thẻ.
- Thấy: đề xuất của GV mất lặng lẽ chỉ vì em nghỉ tạm. Đúng ra: chú thích chính mã "Em thôi học / lưu trữ"; panel Tạm dừng ghi "giữ lớp và lộ trình để quay lại sau"; CLAUDE.md "không mất chữ đang gõ / không báo xong khi chưa lưu".
- Nguyên nhân: `server/src/duyet/loaiYeuCau.ts:279` điều kiện `s.status != 'active'` gồm cả `inactive` (Tạm dừng).
- Đề xuất: đổi thành `s.status = 'finished' OR s.archived_at IS NOT NULL` (đúng chú thích). Kiểm các loại yêu cầu khác có cùng mẫu `status != 'active'`. Sửa lỗi, không cần mockup.
- Ảnh: (DB) — không có ảnh

### HV-17 · lỗi · Hộp Kết luận khoá hiện "Kết quả đầu ra (BE IELTS 4.0) · Đạt / Không đạt" cho em KHÔNG lên FT (BE → ELE); bấm → 400 "Chờ MT0"
- Trang · vai: /hoc-vien/84 (Vương Bảo Ngọc: MB BE 04 → MB ELE 02, `end_kind = len_lop`) · QL (GVCN thấy "Chưa đánh dấu")
- Tái hiện: mở hồ sơ → khối Mini Test / Final Test 64% · "Lên ELE + bổ trợ miễn phí…" · dòng "Kết quả đầu ra (BE IELTS 4.0) · Chưa đánh dấu · [Đạt] [Không đạt]". QL Đạt → PUT /students/84/ket-luan-ft → 400 "Chờ MT0: cần ít nhất 3 kỹ năng có điểm."
- Thấy: việc không thuộc em này (em không có MT0, không lên FT) nhưng nút hiện và lỗi không nói đúng lý do. Đúng ra: plan.md mục 3 dòng 11/10 "Kết quả đầu ra (GVCN đề xuất, QL chốt) cho em Lên FT từ FOU/BE/ELE theo MT0"; đặc tả §3.1.
- Nguyên nhân: `shared/domain/cuoiKhoa.ts:154` vẽ `kyVong` cho mọi FOU/BE/ELE, không xét hướng Lên FT; `server/src/normal/cuoiKhoa.ts:769-770` nhánh UNION thứ hai nhận mọi em đang học lớp FOU/BE/ELE làm "nguồn".
- Đề xuất: chỉ hiện dòng + nhận chốt khi em có lệnh / lộ trình Lên FT (nhánh 1 và 3 của truy vấn); bỏ nhánh 2. Ẩn nút, không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL-84-kqdr.png
- Chiều ngược (đã tái hiện): em 11 (MB FOU 12, ĐÃ chốt Lên FT, MT0 OVR 4.0 > 3.5) — hồ sơ HV KHÔNG có dòng Kết quả đầu ra (hộp Kết luận khoá chỉ vẽ khi Final đã có điểm: `web/src/modules/students/StudentDetailPage.tsx:293` `cuoiKhoa.scored > 0`), dù máy chủ nhận chốt (QL PUT /students/11/ket-luan-ft {dat:true} → 200; máy chủ ghi chú "Không còn đòi bài Final Test"). → Em cần KQĐR thì hồ sơ không có, em không cần thì có.

### HV-18 · lỗi (xung đột OV-9 × SOS chốt) · Tích KCK là viết lại kết quả MT đã chốt thành "Dưới kỳ vọng · KCK", còn Case SOS 2 + hạn của chính lượt đó vẫn chạy
- Trang · vai: /hoc-vien/70 (Trịnh Bảo Ngọc, MB FT 101, MT1 W4 AUG đã chốt SOS 2, 4 Case) · QL
- Tái hiện: ⋯ Sửa thông tin → tích KCK (giữ Target 6.5) + lý do → Lưu. Hồ sơ: câu tóm tắt "KCK · không tính SOS"; ô Kết quả gần nhất "MT1 · Dưới kỳ vọng · KCK" (xám, `sos: null`); bảng kỹ năng cùng lúc: "Reading không đạt · SOS 2 · Cần làm · Chờ xác nhận nguyên nhân · Thêm PA hạn 18/09", W1 "SOS 2 · Chờ Quản lý duyệt"…
- Thấy: một lượt, hai kết luận (không SOS / SOS 2 có hạn quy chế). Target thì ngược lại: đổi Target "các lượt đã chốt vẫn giữ kỳ vọng tính theo Target lúc đó" (chính hồ sơ ghi).
  · Đúng ra: plan.md mục 3 dòng 13/10 KCK nhẹ (dưới kỳ vọng → không SOS, Case nhẹ) + dòng 11/10 SOS MT chốt; cần MỘT luật: KCK áp từ lượt chưa chốt trở đi (như Target), hoặc tích KCK thì Case SOS của lượt cũ chuyển thành Case nhẹ.
- Nguyên nhân: `server/src/fasttrack/attempts.ts:218-224` `kckCuaLuot` đọc cờ HIỆN TẠI của lộ trình (`cy_kck`), không chụp theo lượt như `target_at_attempt`; Case SOS đã tạo không đổi.
- Đề xuất: chụp KCK theo lượt lúc chốt (cột kiểu `kck_at_attempt`, như Target), lượt đã chốt giữ nguyên. Chủ SP xác nhận hướng. Không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/QL-70-kck.png

### HV-19 · lỗi · "+ Case › Đã xong từ trước": GVCN chọn được kỹ năng mình không dạy, điền hết form dài rồi mới 403
- Trang · vai: /hoc-vien/3 · GVCN (7, dạy L + R ở MB FT 101)
- Tái hiện: + Case → Đã xong từ trước → chọn W1 → điền Nhóm, Tên, Mô tả, Từ tuần 24/08, Đến tuần 07/09, PA "Viết lại hai bài Task 1 có chữa" + Tiến bộ một phần, Kết quả cuối, Vì sao → Ghi lại Case đã xong.
- Thấy: thông báo "Bạn không có quyền ghi nhận hỗ trợ cho Case này." (403 POST /cases/backfill; gợi ý "chỉ Case đúng kỹ năng mình dạy" có trong `details.hint` nhưng không hiện). Luật chặn là đúng (plan.md mục 3 dòng 04/10 C02 "giữ chặn"), nhưng nút W1 / W2 / S vẫn bấm được và chặn đến cuối.
  · Đúng ra: CLAUDE.md "bị chặn thì nói lý do + bước tiếp"; brief "nút hiện mà 403 = lỗi".
- Nguyên nhân: `web/src/modules/cases/QuickReport.tsx` chế độ ghi bù không lọc kỹ năng theo môn người xem dạy; máy chủ chặn ở `server/src/cases/cases.ts` (backfill → `teacherAllows`).
- Đề xuất: ở "Đã xong từ trước", kỹ năng không dạy hiện mờ + dòng "Chỉ ghi bù Case môn bạn dạy — báo GV môn đó" (chế độ "Đang gặp vấn đề" giữ mọi kỹ năng). Hiện cả `hint` trong thông báo lỗi. Không cần mockup.
- Ảnh: $SP/anh/ho-so-hv/GVCN-3-ghibu-W1-gui.png

### HV-20 · gợi ý · Case giữ sau "Overall đã đạt" (OV-1c): mốc chỉ nằm trong "Lịch sử kết quả" thu gọn, đầu Case vẫn chip SOS 1
- Trang · vai: /hoc-vien/3?case=5 (Listening, MT1 Overall 5.5 = kỳ vọng) · QL, GVCN
- Thấy: DB có mốc `overall_dat` "Overall 5.5 ≥ kỳ vọng 5.5 — GV xem và tự đóng Case", nhưng ngăn Case chỉ hiện trong "Lịch sử kết quả (3)" (đóng); đầu Case "MT2 · SOS 1 · Đang làm". Đặc tả §3.2 bước 3 "ghi mốc 'Overall đã đạt' để GV tự đóng" — GV khó thấy.
- Nguyên nhân: `web/src/modules/cases/CasePanel.tsx:470-490` mốc chỉ vào `buildLichSu`.
- Đề xuất: một dòng nhắc dưới đầu Case "Overall MT1 đã đạt — xem và Hoàn thành Case nếu ổn". Thêm dòng theo mẫu, không cần mockup.

### HV-21 · gợi ý · Tạm dừng không có Hoàn tác; bấm nhầm rồi Quay lại học ngay vẫn dời hạn
- Trang · vai: /hoc-vien/3 · QL / GVCN / TVV
- Thấy: Tạm dừng → "Đã lưu" (không Hoàn tác; Thôi học có). Tạm dừng rồi Quay lại cùng ngày 14/09: hạn Ý thức "bắt buộc Report 1" đổi 14/09 → 18/09 (đúng luật "hạn tính lại từ ngày quay lại", nhưng là hệ quả của một cú bấm nhầm). Gộp với HV-10.
- Đề xuất: Hoàn tác trên thông báo Tạm dừng (trả nguyên trạng, không tính lại hạn). Không cần mockup.

### HV-22 · gợi ý · Chữ / nhãn nhỏ
- ⋯ / nút thẳng vẫn ghi "Tạm dừng / Thôi học" khi em ĐANG Tạm dừng (panel chỉ còn tab Thôi học) — đổi nhãn "Thôi học" khi `status = inactive` (`shared/domain/quanLyHocVien.ts:68`).
- Sửa vi phạm: tiêu đề panel "Sửa vi phạm · học viên" thay vì tên em (`web/src/modules/yThuc/panelYThuc.tsx:49-55` không truyền `studentName`).
- Tên Case hệ thống hiện thô "[MT2] Listening mất điểm ở Section 3 [SOS 1]" ở câu báo trùng của + Case và thẻ Chờ duyệt ("[MT1] Reading không đạt [SOS 3]"); bảng kỹ năng thì đã tách chip.
- Admin Sửa thông tin: "Target: 6.5 · Quản lý sửa" — từ OV-8b TVV/CX cũng sửa; chữ nên là "Quản lý / TVV sửa".
- Hoàn thành Case: "Kết quả cuối" không điền sẵn theo "PA gần nhất: Tiến bộ rõ" (thêm một bấm).
- Kết quả thi thật: ô OVR trông như ô nhập (readOnly) — dùng chữ thường như "Overall tự tính" ở Sửa thông tin.
- Lộ trình (GVCN): nút "Lịch đã đúng" mờ không nói lý do.
- Câu tóm tắt: em KCK thì mảnh "KCK · không tính SOS" đẩy mất mảnh Ý thức "bắt buộc Report 1, hạn hết …" (tối đa 3 mảnh, `shared/domain/hoSoHocVien.ts:256`) — việc có hạn bị ẩn bởi một nhãn.

### HV-23 · gợi ý · 375: vài nút < 44px
- NganCase: nút "⋯" của PA 28px; Sửa thông tin (TVV): "Đổi" của ô TVV 28px; ô tích KCK / "Không thi" 16px (nhãn bấm được). Không tràn ngang ở mọi màn đã thử (hồ sơ, Sửa thông tin, Tạm dừng, Kết quả thi thật, Chuyển lớp, Case, Xác nhận Case, Hành trình) — QL, GVCN, TVV.
- Ảnh: $SP/anh/ho-so-hv/m375-*.png

### HV-24 · gợi ý · Trước / Sau mất khi mở thẳng hồ sơ em đang Tạm dừng
- /hoc-vien/2 (đang Tạm dừng) mở thẳng: chỉ "‹ Học viên & Lớp", không có "Trước · n/33 · Sau"; trang lớp MB FT 101 vẫn liệt kê em. Nguyên nhân: danh sách dự phòng `GET /classes/:id/roster?chiId=1` (`StudentDetailPage.tsx:191-194`) không có em `paused`.

### HV-25 · câu hỏi chủ SP · Sửa thông tin bắt Ngày sinh cả khi chỉ thêm Liên hệ
- /hoc-vien/19 (Lê Thu Thảo, chưa có ngày sinh) · QT: chỉ gõ SĐT em → Lưu → "1 ô cần sửa ↑" (Ngày sinh). Đúng quyết định 11/10 ("bắt buộc khi thêm / sửa"), nhưng OV-10b "thường TVV nhập liên hệ" — em cũ thiếu ngày sinh thì TVV không thêm được SĐT phụ huynh. Hỏi: chỉ bắt Ngày sinh khi ô đó bị sửa / khi thêm mới?
