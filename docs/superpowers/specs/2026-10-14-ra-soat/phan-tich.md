> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Rà khu PT — Phân tích + Hồ sơ GV (N = 6, web :5516, DB a6.sqlite, ngày demo 14/09/2026)

## Đã đi
| Trang / API | Vai | Thao tác đã thử |
|---|---|---|
| `/phan-tich` Tổng hợp Test + SOS | QL, QT, QLCP, ADMIN, TVV, CX (GVCN, GVBM → về `/`) | mở sẵn tuần trước (W2 SEP ✓), mở/đóng hàng tuần, bấm số → ngăn danh sách, bấm dòng → hồ sơ lượt MT → "‹ Phân tích" về đúng `mo-hang` |
| `/phan-tich/tong-hop` + `/o` (API) | QL, QT, QLCP, ADMIN, TVV, CX | FT + lớp thường × Theo tuần/lớp/đợt/CN × 8 / 26 tuần: MỌI ô > 0 gọi `/o` → n = số dòng (≈ 2 900 ô, 0 lệch); Σ hàng = Tổng; Đạt+SOS+Thiếu = Lượt |
| Xuất Excel (⋯ › Xuất bảng này · Xuất kết quả từng lượt) | QL (FT, lớp thường) | tải được 4 tệp, đọc lại nội dung, không 500 |
| Tổng hợp vấn đề HV · Hiệu quả PA · Ý thức · Giáo viên | QL | xem 1440, so số với Tổng hợp / Tổng quan |
| Theo giáo viên › panel Chấm điểm (API) | QL | GV 7, 8, 9 — T18: không có ô S chấm chéo trong GVCN / GVBM S |
| `/giao-vien/7` Việc đang có → Công việc lọc sẵn | QL | 4 ô bấm → Công việc đúng số (6 / 17 / 2 / 2) |
| `/giao-vien/:id/viec` vs badge `/my-work` (API) | QL xem GV 7, 8, 9, 10, 17, 19 + chính GV | khớp hết (đếm dòng) |
| Hồ sơ lớp › Phân tích lớp `/hoc-vien/lop/{3,6,30}` + API lớp 3,4,5,6,7,17,30 | QL | mở kỹ năng, 2 bảng nhỏ, mọi số → `/issue-board/o` khớp |
| Quyền API Phân tích / GV | 8 vai | 14 đường × 8 vai |
| Tổng quan "Số liệu" / "Theo lớp" · Học viên & Lớp chip SOS (API) | QL, CX | so tập SOS / Dưới kỳ vọng |
| Mọi góc nhìn bấm số → mở dòng (hồ sơ lượt MT, hồ sơ HV ?case=) | CX, TVV, ADMIN, QLCP | không 403, không link `/giao-vien` cho CX/TVV |
| `/giao-vien/:id` | ADMIN (13), QLCP (13, 14), chính GV 14, CX/TVV (9, gõ link) | so Việc đang có theo người xem |
| Tab Phân tích lớp | GVCN (3, 30), GVBM (3), CX (6) | mở kỹ năng, bấm số |
| Phân tích › Giáo viên: QT không chọn CN · khoảng tuần/tháng/sai ngày (API) | QT, QL | câu "Chọn một chi nhánh"; 400 có câu rõ |
| Thử ghi trên DB riêng | QL | Huỷ cả lượt #187 → so 12 số → Khôi phục; đặt KCK em 47; nhập S chấm chéo có / không GV chấm |
| 375 sáng | QL, CX | Tổng hợp, Vấn đề HV, Hiệu quả PA, Ý thức, Giáo viên, lớp thường, hồ sơ GV, tab Phân tích lớp |

## Phát hiện

### PT-1 · lỗi · Lớp PET/KET: Checkpoint không vào Phân tích lớp, hồ sơ GV, Phân tích GV, Xuất Excel — nhưng Tổng hợp lại đếm
- Trang · vai: `/hoc-vien/lop/30?tab=phan-tich` (MB PET 01) · `/giao-vien/7` khối "Kết quả gần nhất" · Xuất kết quả từng lượt (lớp thường, lớp MB PET 01) · QL.
- Tái hiện: MB PET 01 có 2 em đã chấm Checkpoint 1 (W3 SEP: Lâm Bảo Ngọc 48/60 · 61/80; Hồ Minh Quân 35/60 · 58/80 — chip "SOS · L+S" đã hiện ở bảng điểm).
  → tab Phân tích lớp: cột **"Progress Test · Final Test"**, mọi ô "—"; mở L+S: "Vấn đề ở **listening_speaking**", "Lớp này chưa có Case nào ở listening_speaking" (mã thô tiếng Anh).
  → hồ sơ GV Trần Ngọc Hà: "MB PET 01 · Chưa có điểm". → Xuất kết quả lớp thường, lớp MB PET 01: **0 lượt** (`/xuat-mt/xem-truoc` dem.luot = 0).
  → trong khi Phân tích › Tổng hợp Test (lớp thường, Theo lớp) đếm MB PET 01 = 2 bài, xếp dưới nhóm cột **"Progress Test (theo môn)"** (1 Đạt, 1 "1 môn trượt") — PET không có Progress Test.
  Panel Chấm điểm (Phân tích › Giáo viên, lớp thường) của Hà lại có dòng "L+S" (Checkpoint được đếm là việc chấm) nhưng cột Kết quả môn thì không.
- Đúng ra: PET checkpoint mỗi 6 tuần, chấm đúng/tổng như lớp thường (plan.md mục 3, dòng 11/10 PET/KET); cột theo mốc thật (Checkpoint 1, 2…), tên môn "L+S / R+W"; một bài ở mọi nơi cùng được đếm.
- Nguyên nhân: `server/src/classes/phanTichLop.ts:137` `danhGiaMon` trả null khi `kind` khác `progress`/`final` (hàm này cũng dùng cho Phân tích GV + hồ sơ GV); `:107` cột lấy `prog.checkpoints` — PET lặp mỗi 6 tuần nên mảng rỗng → rơi về `['progress','final']`;
  `server/src/phanTich/xuatMt.ts:180` lớp thường chỉ `a.kind IN ('progress','final')`; chữ thô: `shared/domain/cases.ts:198` `caseCategoryLabel` không có `listening_speaking` / `reading_writing` (`ClassIssueBoard.tsx:30`).
- Đề xuất: sửa lỗi (nhận `checkpoint` ở `danhGiaMon` + cột theo số Checkpoint đã có; `xuatMt` thêm `checkpoint`; nhãn môn PET dùng `tenMon`). Không cần mockup.
- Ảnh: `$SP/anh/phan-tich/lop-30-QL-1440-dark.png`

### PT-2 · lỗi · "Case chờ xác nhận nguyên nhân" ở Tổng hợp vấn đề HV = 15, nơi khác cùng tên = 9
- Trang · vai: `/phan-tich?goc=van-de` (FT, Monbay, 8 tuần) · QL.
- Tái hiện: dòng vàng cuối bảng "**15** Case chờ xác nhận nguyên nhân (1 quá hạn)". Cùng lúc: Tổng hợp Test + SOS cột "Chờ nguyên nhân" Tổng = **9 ⚠1**; Tổng quan ô "Case chờ xác nhận nguyên nhân" = **9**; Hiệu quả PA "0 Case chưa chọn nhóm nguyên nhân".
  Bấm 15 → danh sách gồm cả Case **đã đóng** (#38 bỏ qua "single_incident", #43 đóng hệ thống "Overall đạt"), Case đang làm không từ lượt (#60, #61 in_progress) và #37, #47 không ở trạng thái chờ nguyên nhân.
- Đúng ra: một khái niệm một tên, cùng hàm đếm (CLAUDE.md "Thông tin vừa đủ… cùng một số liệu ở nhiều nơi phải cùng nguồn"). Dòng này thực chất là "Case chưa có nguyên nhân (chưa phân loại)".
- Nguyên nhân: `server/src/phanTich/vanDeHv.ts:161-171` (`vaoChuaPhanLoai` = mọi Case mở / đóng trong khoảng chưa có lỗi) · nhãn `web/src/modules/phanTich/TongHopVanDeHv.tsx:153-157`; nơi khác dùng `trangThaiCaseV4` → `cho-nguyen-nhan` (`tongHop.ts:281`).
- Đề xuất: đổi chữ dòng thành "Case chưa phân loại nguyên nhân" (giữ số 15, vì Σ hàng + dòng này = số Case) **hoặc** tách: "n chờ xác nhận nguyên nhân" (cùng `trangThaiCaseV4`) + phần còn lại. Đổi chữ, không cần mockup.
- Ảnh: `$SP/anh/phan-tich/QL-van-de-1440.png`

### PT-3 · lỗi · Tổng quan "SOS" / "Dưới kỳ vọng" khung Fast Track đếm em vừa lên FT theo Final Test lớp thường cũ (15 vs chip "Đang SOS" 14)
- Trang · vai: `/` Tổng quan › Số liệu › bảng "Theo lớp · Monbay" (Fast Track) · QL (CX "Theo chi nhánh" cùng số).
- Tái hiện: hàng "Cả Monbay" SOS = **15**, MB FT 101 = 9 → bấm 15: có **Chu Nhật Minh (000087)**. Học viên & Lớp (Monbay) chip **"Đang SOS 14"** — không có em này.
  Hồ sơ 000087: "Chưa có kết quả Test", MT1 của FT ở W3 OCT chưa thi; Hành trình: Final Test BE 04 **73 % · Pass** (R 65 %). Phân tích › Tổng hợp FT cũng không có em.
- Đúng ra: số SOS khung FT = em có SOS ở lượt Mock Test (T58/K2-02: "Đang SOS chỉ Fast Track"); em mới lên FT chưa có điểm MT → không SOS, không "dưới kỳ vọng".
- Nguyên nhân: `server/src/worklist/danhGia.ts:173-188` `latestAttempts('valid')` lấy lượt có điểm mới nhất **qua mọi lộ trình** — lộ trình FT chưa có điểm → rơi về Final Test BE; `evaluateRegular` cho `sosLevel` = số môn trượt (1) → `hvSosHienTai` / `hvDuoiKyVongMon` (`:198-221`) đếm. Chip dùng `standingFor` (lộ trình đang chạy) nên không đếm.
- Đề xuất: sửa lỗi — khi lọc khung FT chỉ lấy lượt `mock` (hoặc chỉ lộ trình đang chạy như `standingFor`). Kiểm cả ô "Điểm đáng chú ý" (cùng hàm). Không cần mockup.
- CX (mọi chi nhánh): Tổng quan "Theo chi nhánh" SOS **18** vs chip Học viên & Lớp "sos" **17** — cùng em này.
- Ảnh: `$SP/anh/phan-tich/tong-quan-sos-QL.png`, `$SP/anh/phan-tich/hvl-chip-sos-QL.png`, `$SP/anh/phan-tich/ho-so-87.png`

### PT-4 · lỗi · Huỷ cả lượt → Khôi phục KHÔNG nguyên trạng: yêu cầu "Không cần theo dõi" đang chờ bị đóng, không quay lại (số Chờ duyệt / Chờ nguyên nhân đổi)
- Trang · vai: Hồ sơ lượt MT (Huỷ cả lượt / Khôi phục) → thấy ở Phân tích › Tổng hợp cột Xử lý, Tổng quan "Chờ duyệt" · QL.
- Tái hiện (DB sạch): lượt #187 MT1 Trịnh Bảo Ngọc (MB FT 101, SOS 2, 3 Case; Case #47 có yêu cầu "Không cần theo dõi" đang chờ — yeu_cau_duyet #4).
  1) `POST /attempts/187/cancel` (Huỷ cả lượt, có lý do) → yêu cầu #4 vẫn "cho". 2) mở Học viên & Lớp (`GET /hoc-vien-lop`) → #4 thành **tu_dong**.
  3) `POST /attempts/187/reopen` (Khôi phục) → Case #46-48 mở lại, nhưng #4 vẫn **tu_dong**. Kết quả: Tổng hợp W4 AUG "Chờ duyệt" 2 → 1, "Chờ nguyên nhân" 4 → 5; hộp Chờ duyệt mất một thẻ; GV phải làm lại việc đã gửi.
  (Huỷ → Khôi phục liền nhau, không mở trang nào ở giữa thì nguyên trạng — nên lỗi chỉ lộ khi có người mở trang trong lúc lượt đang huỷ, tức là gần như luôn luôn.)
- Đúng ra: "Khôi phục = nguyên trạng" (plan.md mục 3, dòng 11/10 "Huỷ cả lượt MT giữ điểm ẩn; Khôi phục = nguyên trạng"; đặc tả 3.x huỷ/khôi phục).
- Nguyên nhân: `server/src/duyet/yeuCau.ts:212-231` `quetYeuCau` (chạy ở mọi đường đọc: hộp, my-work, Học viên & Lớp…) đóng thẻ "chết" (Case đã đóng) thành `tu_dong`; bản cất khi huỷ `server/src/fasttrack/ketQuaHuy.ts:113` chỉ có `luot · case · pa · phoiHop · tinHieu`, không có yêu cầu duyệt → `reopenAttempt` (`attempts.ts:1581`) không mở lại.
- Đề xuất: sửa lỗi — cất id các yêu cầu "cho" của Case/PA bị đóng vào bản huỷ, khôi phục thì trả về "cho" (hoặc `quetYeuCau` bỏ qua Case đóng vì `luot_da_huy`). Không cần mockup. (Thuộc vùng Huỷ/Khôi phục — báo chéo.)
- Ảnh: không (tái hiện bằng API + DB riêng, `$SP/pw/pt/huy3.mjs`).

### PT-5 · lỗi · Case đóng vì "Huỷ cả lượt" vẫn được đếm ở Tổng hợp vấn đề HV
- Trang · vai: `/phan-tich?goc=van-de` · QL.
- Tái hiện: Huỷ cả lượt #187 (Trịnh Bảo Ngọc) → Tổng hợp Test + SOS, Tổng quan, chip SOS, Phân tích lớp, Phân tích GV, Xuất Excel đều bỏ lượt (đã kiểm từng nơi: 33→32 lượt, SOS 15→14, chip 14→13, R MT1 7/11→7/10…), **nhưng** Tổng hợp vấn đề HV vẫn "15 Case chờ xác nhận nguyên nhân" — gồm Case #46, #47, #48 (đóng hệ thống `luot_da_huy`) và em vẫn ở cột Số HV (9).
- Đúng ra: lượt huỷ "điểm giữ nhưng ẩn — không tính Overall, SOS, **Phân tích**, Xuất Excel" (đặc tả 3.x Huỷ, OV-4a).
- Nguyên nhân: `server/src/phanTich/vanDeHv.ts:91-104` lấy Case theo học viên "đang mở hoặc đóng trong khoảng", không loại Case của lượt `cancelled` / `system_close_reason = 'luot_da_huy'`.
- Đề xuất: sửa lỗi — loại Case `luot_da_huy` (hoặc Case của lượt cancelled) khỏi `vanDeHv`. Làm cùng PT-2.
- Ảnh: không (API).

### PT-6 · xung đột · Em KCK dưới kỳ vọng: Tổng quan vẫn đếm "Dưới kỳ vọng", Phân tích bỏ hẳn
- Trang · vai: `/` Số liệu (ô "Học viên dưới kỳ vọng", bảng Theo lớp cột Dưới kỳ vọng, "Điểm đáng chú ý") vs `/phan-tich` Tổng hợp cột Dưới kỳ vọng · QL.
- Tái hiện: (demo không có em FT KCK có Target → đặt KCK cho Vũ Ngọc Lan 000047, MB FT 101, Target 7, MT1 L/R/S 5.0 bằng DB riêng — đúng dấu OV-9 "KCK riêng, Target giữ").
  → Tổng quan: "Dưới kỳ vọng" vẫn 21 (có em), mẫu "/29 đánh giá được" vẫn tính em; SOS 15→14 ✓, chip SOS 14→13 ✓.
  → Phân tích › Tổng hợp W4 AUG: lượt của em biến khỏi Lượt MT và khỏi mọi cột Dưới kỳ vọng (`luotKck`).
- Đúng ra: một luật — OV-9 / Q29-1 (`danhGia.ts:84` ghi chính chú thích này): "lượt của em KCK — ngoài mẫu số số liệu SOS / đạt kỳ vọng". Hoặc cả hai nơi đếm em vào "Dưới kỳ vọng · KCK", hoặc cả hai bỏ. Chủ SP chọn.
- Nguyên nhân: `server/src/worklist/danhGia.ts:209-221` `hvDuoiKyVongMon` không gọi `luotKck`; `server/src/phanTich/tongHop.ts:176` có.
- Đề xuất: mặc định theo Q29-1 — bỏ em KCK khỏi tử + mẫu "Dưới kỳ vọng" ở Tổng quan (một dòng `luotKck`). Không cần mockup.
- Ảnh: không (API, đã trả DB về như cũ).

### PT-7 · lỗi nhỏ · Hồ sơ GV › Việc đang có theo người xem: Admin thấy "0" ở nhóm mình không được xem; QL không thấy việc Vận hành không gắn lớp
- Trang · vai: `/giao-vien/13`, `/giao-vien/14` · ADMIN, QLCP (so với chính GV).
- Tái hiện: Admin (CP) mở hồ sơ Ngô Bảo Nam (13): 4 ô **Chấm điểm 0 · Case học thuật 0 · Ý thức 0 · Vận hành 0** — GV tự xem: Case học thuật **3 (2 quá hạn)**, Ý thức 1.
  QLCP mở hồ sơ Hoàng Quang Dũng (14): Vận hành **0 · "—"**; GV tự xem: Vận hành **2 · 1 quá hạn** (việc "Giáo trình BE — Writing" quá hạn, không gắn lớp) — badge Công việc của GV = 1 quá hạn.
- Đúng ra: "Giao diện theo vai đi cùng quyền máy chủ" + "việc đã có không được nơi nào báo 0" (CLAUDE.md); số ở hồ sơ = badge Công việc của GV (ghi chú plan.md mục 4 — phần đếm dòng ĐÃ khớp, xem "Đã kiểm").
- Nguyên nhân: `server/src/worklist/mywork.ts:1341-1347` `viecCuaNguoi`: Admin chỉ nhóm `score`; bỏ dòng không lớp/không HV (việc Giáo trình) — nhưng `HoSoGiaoVienPage.tsx:117-140` vẫn vẽ đủ 4 ô.
- Đề xuất: ẩn ô nhóm người xem không được xem (Admin: chỉ ô Chấm điểm); việc Vận hành không lớp: tính khi GV thuộc chi nhánh người xem, hoặc ô ghi "chỉ việc theo lớp". Ẩn ô / đổi chữ — không cần mockup.
- Ảnh: `$SP/anh/phan-tich/ho-so-gv-13-xem-boi-ADMIN.png`, `$SP/anh/phan-tich/ho-so-gv-14-xem-boi-QLCP.png`, `$SP/anh/phan-tich/ho-so-gv-14-xem-boi-14.png`

### PT-8 · gợi ý · Ngăn danh sách gọi lượt / bài là "đợt Test"
- Trang · vai: `/phan-tich` Tổng hợp, bấm một số ở cột Kết quả · QL, CX.
- Thấy: cột ghi "Lượt MT" / "Bài", ngăn mở ra "**3 đợt Test** — Đạt · W2 SEP", lớp thường "44 đợt Test — Bài kiểm tra · Tổng"; "đợt" ở chỗ khác là MT1/MT2 (Theo đợt). Cột Case: "18 **case**" chữ thường.
- Đúng ra: một khái niệm một tên (CLAUDE.md "Nhất quán").
- Nguyên nhân: `shared/domain/metrics.ts:284` `METRIC_UNIT_LABEL['dot-test'] = 'đợt Test'`, `case: 'case'` (dùng ở `tongHop.ts:315`).
- Đề xuất: đổi chữ — "lượt MT" (FT) / "bài" (lớp thường); "Case". Không cần mockup.
- Ảnh: `$SP/anh/phan-tich/QL-375-light-tong-hop-panel.png`

### PT-9 · gợi ý · Cùng một em: Tổng quan gọi "SOS" (kể cả tạm), Phân tích gọi "Thiếu điểm"
- Trang · vai: `/` Theo lớp (MB FT 105: SOS **5**) vs `/phan-tich` W1 SEP · MB FT 105 (SOS **1** + Thiếu điểm **4**) · QL.
- Thấy: 4 em MB FT 105 MT1 thiếu S (SOS tạm thời). Tổng quan đếm SOS — đầu cột đã ghi "kể cả SOS tạm thời" (đúng luật, chip cũng vậy); Phân tích để "Thiếu điểm" không ghi gì. Không sai luật (OV-1c: tạm không Case — đã kiểm: không Case), chỉ khó đối chiếu.
- Đề xuất: chú giải cột "Thiếu điểm" thêm "gồm lượt SOS tạm thời (chưa chốt)". Đổi chữ.

### PT-10 · gợi ý · Ô "Lớp" của Phân tích không có lớp đã kết thúc, bảng "Theo lớp" thì có
- Trang · vai: `/phan-tich?ct=thuong&theo=lop&tg=26` · QL.
- Thấy: bảng có hàng **MB BE 08** (đã kết thúc), ô chọn Lớp không có MB BE 08 → không lọc được lớp đó (`/ref/classes` chỉ lớp đang chạy; `PhanTich.tsx:97-100`).
- Đề xuất: ô Lớp thêm lớp đã kết thúc có lượt trong khoảng (nhóm "Đã kết thúc"), hoặc bỏ qua. Không chặn.

### PT-11 · gợi ý · CX / TVV mở thẳng `/giao-vien/:id`: câu lỗi không đúng vai + nút "Thử lại" vô ích
- Trang · vai: `/giao-vien/9` (gõ link) · CX, TVV.
- Thấy: "Bạn chỉ xem được hồ sơ giáo viên của chính mình." + nút **Thử lại** (403 thử lại vẫn 403; CX không phải GV). API 403 đúng đặc tả. Không có link nào trong app dẫn tới (đã kiểm: 0 link `/giao-vien` ở mọi góc của CX/TVV).
- Nguyên nhân: `server/src/giaoVien/phamVi.ts:20` một câu cho mọi vai; `web/src/ui/ui.tsx:273` luôn có Thử lại khi có `onRetry`.
- Đề xuất: câu "Hồ sơ giáo viên dành cho Quản lý." + link "‹ Phân tích"; ẩn "Thử lại" khi lỗi 403. Đổi chữ.
- Ảnh: `$SP/anh/phan-tich/CX-giao-vien-9.png`

### PT-12 · gợi ý · Link thẳng `/phan-tich?theo=lop` không mở sẵn hàng đầu (bấm nút "Theo lớp" thì mở)
- Trang · vai: `/phan-tich?theo=lop` · QL. Thấy: URL sau tải `?theo=lop&cn=1`, không `mo-hang`; bấm "Theo lớp" → `mo-hang=lop:3` mở MB FT 101. `?theo=dot`, `?ct=thuong&theo=lop` thì mở.
  Nhiều khả năng hai `setParams` cùng lúc (`PhanTich.tsx:69-77` thêm `cn` · `TongHopTestSos.tsx:96-101` thêm `mo-hang`) đè nhau — chỉ đọc mã, chưa đo. Không chặn (Theo tuần mở đúng tuần trước).

## Đã kiểm, KHÔNG lỗi (để planning khỏi rà lại)
- Mở sẵn **tuần trước** (W2 SEP; CP chỉ có W3 AUG → mở W3 AUG); hàng tuần mở ra theo lớp; Quay lại từ hồ sơ lượt về đúng `mo-hang`.
- Số ↔ danh sách: ≈ 2 900 ô Tổng hợp (6 vai × 2 khung × 4 cách xếp × 8/26 tuần) + ≈ 650 ô Vấn đề HV / Hiệu quả PA / Ý thức (QL, QT, cả "Chỉ vấn đề chính", "Gộp nhóm") + Phân tích lớp 7 lớp: **0 lệch**; Σ hàng = Tổng; Đạt+SOS+Thiếu = Lượt.
- Bộ lọc: chọn lớp / chi nhánh ra đúng hàng của "Theo lớp" / "Theo chi nhánh" (29 phép so); QL = QT lọc Monbay ở 4 góc; đổi khung bỏ lớp đang chọn; Back trình duyệt về bộ lọc cũ.
- **Lượt huỷ (OV-4a)**: Tổng hợp, Tổng quan SOS + Dưới kỳ vọng, chip SOS, Phân tích lớp, Phân tích GV, Xuất Excel đều bỏ lượt (trừ PT-5); khôi phục liền tay → số về như cũ (trừ PT-4).
- **SOS tạm (OV-1c)**: không sinh Case; Tổng hợp xếp "Thiếu điểm"; lượt chốt-mà-thiếu (Trịnh Gia Bảo MT1, S vắng) → SOS 1 ⇒ ghi chú plan.md mục 4 "OV-1c giữ done = đủ điểm… Thiếu điểm" **đã hết**.
- **PET**: chỉ chip "SOS · L+S", không Case (Tổng hợp HV-Case 0). **KCK**: không SOS ở Tổng quan / chip / Phân tích (PT-6 chỉ phần "Dưới kỳ vọng").
- **T18**: panel Chấm điểm GVCN Hà (L/R), GVBM S Trang (chỉ 1 ô tự nhập), Vinh ("không có" dù lớp có 4 ô S quá hạn) — không ô S chấm chéo; nhập S trễ có GV chấm = Linh → Linh 8/20 → 8/21 (trễ 5 ngày), Vinh vẫn "không có".
- **Hồ sơ GV**: Việc đang có = số dòng Công việc lọc sẵn (6 / 17 / 2 / 2 khi bấm) = badge (GV 7, 8, 9, 10, 17, 19 — QL xem và tự xem) ⇒ ghi chú plan.md mục 4 "đếm items lệch badge" **đã xử lý** (PR-VN3); còn PT-7.
- **Quyền**: GVCN/GVBM 403 cả Phân tích (web tự về `/`), xem được tab Phân tích lớp lớp mình; CX/TVV: 403 mọi đường GV, Ý thức, xuất từng lượt (menu ẩn đúng); góc "Giáo viên" + "Ý thức" ẩn (mockup 13/10 duyệt); Admin: Ý thức ẩn + 403, Giáo viên xem được + tên là link; QLCP 403 ngoài CN; tên GV ở CX là chữ.
- **Xuất Excel**: "Xuất bảng này" (QL, QT, ADMIN, CX, TVV) + "Xuất kết quả từng lượt" (QL FT + thường, QT, ADMIN) — 9 tệp tải được, đọc lại đúng cột, sheet "Bộ lọc đã dùng"; không 500.
- **375 sáng** QL (Tổng hợp, Vấn đề HV, Ý thức, Giáo viên, lớp thường, hồ sơ GV, tab Phân tích lớp) + CX (Tổng hợp, Hiệu quả PA): không tràn trang, bảng cuộn ngang trong khung, cột đầu dính, cả hàng bấm được để mở.
- DB riêng đã trả về sạch (reset) sau các phép thử ghi (KCK, huỷ/khôi phục lượt, nhập S).
