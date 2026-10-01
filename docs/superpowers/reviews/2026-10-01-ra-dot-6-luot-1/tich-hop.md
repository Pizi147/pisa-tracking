# Rà tích hợp — đợt 6 lượt 1 (main @ f814ba26)

Người rà: Opus 5.5 · 01/10/2026 · worktree `scratchpad/ra6` (không sửa file, `git status` sạch sau khi rà).

## Bước 1 · Phép kiểm
- `npm ci` rồi `npm run check` **một lần**, foreground, `timeout 900`, log `%TEMP%\check-ra6.log`. Chạy ~13 phút (15:04 → 15:17), **exit 0**, không segfault, không treo.
- Phép kiểm chính: **TẤT CẢ 2162 KIỂM TRA ĐỀU ĐẠT** (0 ✗).
- Tốc độ: **28 KIỂM TRA ĐỀU ĐẠT**. Route mới đo được: `QL /phan-tich/giao-vien?cn=1&ct=ft` 40 câu (trần 48) · `QT` 37 (44) · `QL …&ct=thuong&thang=2026-09` 34 · `…/cham-diem` QL 24 (34) / QT 23 (33).
- Typecheck (`tsc -p tsconfig.web.json --noEmit && tsc -p tsconfig.build.json --noEmit`): sạch.
- Sau check: không còn tiến trình `run.js` / `tocDo.run.js`.

## Bước 2 · Quét chéo
- Hàm trùng sau cổng gộp — mỗi hàm **một** định nghĩa:
  - `tuanHocFt` `shared/domain/hienThiNgay.ts:45` · `chuTuanHoc` `shared/domain/hienThiNgay.ts:39` · `khoangTamDung` `server/src/students/tamDung.ts:9`
  - `baiId` `shared/domain/cases.ts:61` · `khacGoiY` `shared/domain/chuyenLop.ts:72` · `paCoKetQua` `server/src/phanTich/hieuQuaPa.ts:43` · `trongKhoiHomNay` `shared/domain/congViec.ts:53`
- `ca-hai` / `"Cả hai"`: không còn ngoài phép kiểm. Còn trong chú thích "đã bỏ" (`shared/domain/tongQuan.ts:13,18`) và phép kiểm link cũ (`prPb2a.tests.ts:58-63`, `prPb2b.tests.ts:303-307`, `prVaiA.tests.ts:363`). Chữ "cả hai" thường (không phải nút) có ở nhiều chú thích — không phải lỗi.
- `/16` ở tuần FT: không còn. Trúng chỉ là chú thích lịch MT 6/12/16 (`server/src/classes/schedule.ts:45`, `shared/domain/lichMt.ts:4`, `server/src/schema.sql:483`), `DauHoSo.tsx:26` (chú thích "không bao giờ n/16"), `seed.ts:276` ("MB FOU 14 / 16"). Trên màn: chỉ có tỷ số "0/16 lần cập nhật PA", "5/16" (Phân tích GV), không phải tuần.
- "ca tối" / "đổi ca" / "buổi tối": còn 5 chỗ, **không do 5 PR này** (xem P2 ở dưới).
- `next_step` của nhóm việc: đã bỏ khỏi `/my-work` (`prVaiA (6a)(6d)` khoá lại). Còn `next_step` hợp lệ ở `case_followups` (cases.ts, boTro.ts) và `journey_events` (`loTrinhTiep.ts:132`) — không thuộc nhóm việc.
- Trần SQL cho route mới trong `tocDoDuong.ts`: có đủ `/my-work/dem` (:268-270), `/tong-quan/diem-chu-y` (:258-260), `/tong-quan/lop-toi-day` (:263-264), `/tong-quan/lop-toi-day/o` (:267), `/phan-tich/giao-vien` (:628-629), `/phan-tich/giao-vien/cham-diem` (:633-634). **Thiếu** `POST /notifications/doc-het` (P2 dưới).

## Bước 3 · Bấm thử theo vai
- API `PORT=4117` (`node dist-server/server/src/index.js`) + Vite 5317 (cấu hình tạm **ngoài** worktree: `scratchpad/ra-dot6-tmp/vite-ra6.config.mjs`, proxy → 4117). DB riêng của worktree (`npm run seed`, ngày demo 14/09/2026).
- Dựng em Tạm dừng qua API như kế hoạch VAI-b Q21 (seed không có): HV 1 Tạm dừng từ 08/09 (đang dừng), HV 2 Tạm dừng 17/08 → Quay lại 01/09.
- Playwright kênh Chrome: **68 ảnh** (64 màn + 4 ảnh panel Chuyển lớp), 1440 và 375. Sáng + tối ở Tổng quan GV/QL, hồ sơ HV FT/FOU/Tạm dừng, Hành trình, Phân tích GV, hồ sơ GV. Kết quả từng ảnh: `anh/ket-qua.jsonl`.
- **Không màn nào tràn ngang** (`document.scrollWidth` = bề rộng khung; không phần tử nào vượt mép mà không nằm trong khung cuộn riêng).
- **Không lỗi console** (chỉ 2 cảnh báo React Router future flag, có sẵn). **Không request 4xx/5xx.**
- Panel Chuyển lớp (MB FOU 21, QL): em Ngô Minh Huy CT, Web gợi ý "Lên BE + bổ trợ", chọn "Học lại" + lớp đích MB FOU 16, không ghi lý do → ô "Lý do * khác Web gợi ý" hiện, bấm "Tiếp tục" → báo "Ghi lý do ngắn", **không** sang bước 2, không có POST (cả 1440 và 375). Gửi thẳng `POST /classes/21/transition` (cờ `khacGoiY:false` gian) → máy chủ trả `failed: "Ghi lý do ngắn"`. Đạt.
- Số trên ô = số dòng khi bấm:
  - `/metrics/*?rows=1` (QL, admin; ft/thường/gộp; 9 chỉ số của Tổng quan + Cần xử lý): n = số dòng ở mọi tổ hợp.
  - Lớp tôi dạy: `duoiKyVong`/`sos`/`caseMo` của bảng = số dòng `/tong-quan/lop-toi-day/o` (4 cặp GV × lớp).
  - Phân tích GV: ô Chấm điểm `9/28` (Hà) = 28 dòng panel, 9 đúng hạn.
  - Tile "Case chờ xác nhận nguyên nhân · 1 quá hạn" (FT) và dải Báo lên "2 Case chờ nguyên nhân quá hạn" (gộp hai khung, 1 FT + 1 thường) — khớp.
  - Hiệu quả PA "8 PA có kết quả · 7 có cải thiện" = Điểm đáng chú ý "7/8 PA … có cải thiện".
  - **Lệch:** cột "Bài chờ chấm" của Lớp tôi dạy (P1 #1).

---

### [P1] "Bài chờ chấm / bài quá hạn" ở Lớp tôi dạy đếm HỌC VIÊN, không đếm bài — lệch hồ sơ GV
- Chỗ: `shared/domain/congViec.ts:105-115` (`baiChoChamTheoLop` cộng `it.count`), `server/src/worklist/mywork.ts:391` (`count: students.size`), hiển thị `web/src/modules/worklist/LopToiDay.tsx:43-55`
- Lỗi: `count` của việc Chấm điểm là số HV (dòng phụ "MT1 · 10 HV"), nhưng bảng Lớp tôi dạy ghi là "bài" ("15 quá hạn"; điện thoại "15 bài quá hạn").
- Tình huống: GV Trần Ngọc Hà, MB FT 101 (dạy L, R): Tổng quan hiện **15** bài quá hạn (10 HV MT1 + 5 HV MT2); hồ sơ GV cùng người cùng lớp (`/giao-vien/7`, cột "Bài quá hạn") hiện **22**; ô QL "79 bài chưa nhập điểm quá hạn" cũng đếm theo bài. Bấm số 15 mở Lịch Test, không có danh sách 15 dòng.
- Sửa: lấy số bài từ cùng hàm tập bài của `bai-qua-han-nhap-diem` / hồ sơ GV (`scoreDebt`, `chuaNhap`/`quaHan` theo lớp) thay vì cộng `count` HV; hoặc đổi chữ thành "HV" — nhưng T53 Q2 chốt đơn vị "bài".
- Nguồn luật: VAI-a Task 8 (chú thích `LopToiDay.tsx:14` "Σ bài của việc Chấm điểm"); T53 Q2 (đơn vị bài); CHUNG §3 "mỗi con số một hàm trả tập ID".

### [P1] Cần xử lý "em chưa có lệnh chuyển lớp": hạn đã qua vẫn "Cần làm", không quá hạn
- Chỗ: `server/src/worklist/tongQuan.ts:79` (`sapCanXuLy` chỉ truyền cờ quá hạn cho `van-hanh-can-quyet-dinh`), `:121-124` (hạn `trước ${tuanLich(ketThuc + 7)}`); `shared/domain/tongQuan.ts:124`
- Lỗi: hạn "trước {tuần sau tuần kết thúc lớp}" được tính nhưng không so với hôm nay, nên dòng luôn `can-lam`.
- Tình huống: QL Monbay, ngày demo 14/09 (W3 SEP): dòng "6 lớp · 21 em chưa có lệnh chuyển lớp" nhãn **Cần làm**, cột Hạn "**trước W1 SEP**" (đã qua 2 tuần); cùng lúc dải Chờ duyệt có "3 Lớp hết khoá còn em chưa có lệnh" (Báo lên). Dòng không được xếp lên đầu cùng nhóm quá hạn.
- Sửa: truyền `{ 'hv-chua-co-lenh-chuyen': !!ketThuc && addDays(ketThuc, 7) <= today }` vào `sapCanXuLy` (như Vận hành); khi quá hạn đổi chữ hạn sang "quá hạn từ {tuần}".
- Nguồn luật: VAI-a Q8b, Q24 ("chuyển lớp → trước {mã tuần}"); mockup 23 màn B (nhãn trạng thái Quá hạn / Cần làm).

### [P1] Cổng gộp chưa làm vế "m bài chưa có người chấm" của dòng thiếu GV (Q6)
- Chỗ: `server/src/worklist/tongQuan.ts:132-138` (còn `// ponytail: vế "m bài chưa có người chấm" chờ hàng "Chưa phân công" của PR-UXF-a (chưa merge) — thêm ở cổng gộp.`)
- Lỗi: UXF-a (#149) đã merge và đã có `chuaPhanCong` (`server/src/giaoVien/hoSo.ts:307-376`, `scoreDebt.ts:18`), nhưng cổng gộp VAI-a/UXF-a không thêm vế `m`.
- Tình huống: lớp thiếu GV một môn có bài quá hạn → dòng Cần xử lý chỉ ghi "n lớp thiếu GV môn · k Case chưa có người nhận", thiếu "m bài chưa có người chấm". (Seed Monbay hiện không có lớp thiếu GV nên màn không lộ.)
- Sửa: lấy `m` từ cùng tập bài `userId = null` của `scoreDebt` (hàng "Chưa phân công"), thêm vào `kem`; xoá chú thích `ponytail:`.
- Nguồn luật: VAI-a Q6, Nhật ký VAI-a 01/10 Task 1 ("làm ở cổng gộp").

### [P2] `POST /notifications/doc-het` không có trần số câu SQL
- Chỗ: `server/src/routes/index.ts:2023`; `server/src/tests/tocDoDuong.ts` (không có dòng `doc-het`)
- Lỗi: route mới của VAI-a (Task 9, Q18) không có trong bộ đo tốc độ.
- Tình huống: hiện là một câu `UPDATE` (`server/src/platform/thongBao.ts:60-62`) nên không chậm; nhưng sửa sau thành N+1 sẽ không bị chặn.
- Sửa: thêm một dòng đo POST (hoặc phép kiểm `demTruyVan === 1` trong prVaiA).
- Nguồn luật: CHUNG §5 "route mới phải có trần"; VAI-a Task 9.

### [P2] Phân tích › Giáo viên: ô khoảng hiện ngày "24/08/2026 – 14/09/2026" thay vì mã tuần
- Chỗ: `web/src/modules/phanTich/PhanTichGiaoVien.tsx:134-136` (`<ONgay kieu="tuan" gon …>`)
- Lỗi: hai ô chọn tuần hiện ngày đầy đủ; mockup 25 ghi "W1 SEP – W4 SEP". Dòng mô tả bên dưới đã dùng mã tuần ("W4 AUG – W3 SEP").
- Tình huống: QL mở `/phan-tich?goc=giao-vien&cn=1&ct=ft` → thấy "24/08/2026" và "14/09/2026" (1440 và 375).
- Sửa: dùng ô chọn tuần hiện `tuanLich` (như `OTuan` của panel Chuyển lớp), hoặc hiện mã tuần cạnh ô.
- Nguồn luật: kế hoạch Pb2 dòng 142 (mã tuần `W2 SEP`, ngày chỉ cho hạn cụ thể…); chủ sản phẩm 30/09; mockup 25.

### [P2] Hồ sơ HV lớp thường: hai tuần "Cuối khoá" khác nhau trên cùng màn
- Chỗ: `server/src/students/profile.ts:471` (`thiDuKien = Cuối khoá {khoa.tuanKetThuc}`) vs ô Sắp tới (`mocKeTiep`, `profile.ts:631`) và bảng Kết quả kiểm tra
- Lỗi: đầu hồ sơ lấy tuần kết thúc lớp, ô Sắp tới lấy tuần của bài Cuối khoá đã xếp lịch.
- Tình huống: HV 8 Đỗ Gia Bảo (MB FOU 12): đầu hồ sơ "tuần học 8/8 · Cuối khoá **W3 SEP**"; ô Sắp tới "Cuối khoá · **W1 OCT** · 4 môn · xét lên BE"; bảng "Cuối khoá W1 OCT".
- Sửa: đầu hồ sơ ưu tiên tuần bài Cuối khoá (cùng nguồn ô Sắp tới), chỉ rơi về `tuanKetThuc` khi chưa có bài; hoặc đổi nhãn đầu hồ sơ thành "kết thúc lớp W3 SEP".
- Nguồn luật: VAI-b Q7 (mỗi ô một nguồn), kế hoạch VAI-b dòng 191/259 (ví dụ giả định cùng tuần W4 OCT).

### [P2] Nghi ngờ: nhãn "hạn hết T2 12/09" cho hạn rơi vào Thứ Bảy
- Chỗ: `shared/domain/display.ts:261` (`'cap-nhat-pa': tien 'hạn hết T2'`), ánh xạ mới `LOAI_HAN_CUA_VIEC.ghi_ket_qua_pa = 'cap-nhat-pa'` (`shared/domain/tongQuan.ts:52`, VAI-a Q13)
- Lỗi: chữ luôn ghi "hết T2" bất kể ngày; PA 45 (Lý Minh Châu) `action_due = 2026-09-12` (Thứ Bảy) hiện "hạn hết T2 12/09", ở hồ sơ GV "tuần W1 SEP".
- Tình huống: dữ liệu do seed đặt (`server/src/seed/sosV3Seed.ts:89`); đường ghi thật dùng `weeklyUpdateDue` (Thứ Hai). Nghi ngờ chỉ lộ ở bộ demo, nhưng bộ demo là thứ chủ sản phẩm bấm thử.
- Sửa: seed đặt `action_due` về Thứ Hai; hoặc `deadlineView` chỉ dùng tiền tố "hết T2" khi ngày là Thứ Hai.
- Nguồn luật: PR-N1 R-PA3; VAI-a Q24.

### [P2] Còn chữ "ca tối" / "buổi tối" (không do 5 PR)
- Chỗ: `web/src/modules/platform/WelcomePage.tsx:313` (placeholder "Ví dụ: dạy ca tối thứ 3, 5, 7" — GV thấy lúc tự khai), `server/src/seed/seed.ts:345` ("thiếu giáo viên dự phòng ca tối"), `server/src/seed/ctSeed.ts:109` ("lớp học buổi tối"), `server/src/seed/yThucSeed.ts:210` ("lịch học buổi tối"), `web/src/modules/dev/ThanhPhanDemo.tsx:107`
- Lỗi: trái luật "không có ca học cố định".
- Sửa: đổi chữ placeholder và seed (vd "dạy tối thứ 3, 5, 7" → "rảnh thứ 3, 5, 7").
- Nguồn luật: CHUNG §2; chủ sản phẩm 30/09–01/10.

### [P2] Panel Sửa phân công lớp FOU: gợi ý "dạy được L, R, W1" / "dạy được S" dùng mã FT
- Chỗ: `web/src/modules/classes/ClassCreatePanel.tsx:256` (`skillShort` của kỹ năng tự khai)
- Lỗi: ô lớp thường là L·R·G+V và P, nhưng dòng gợi ý ghi W1, S.
- Tình huống: QL mở `/hoc-vien/lop/28?viec=phan-cong` (MB FOU 14): "Lê Thanh Bình · 1 lớp — dạy được L, R, W1"; "Ngô Bích Ngọc · 2 lớp — dạy được S" ở ô P.
- Sửa: đổi tên kỹ năng theo khung lớp (`tenMonNgan(ct, …)`) khi hiện ở lớp thường.
- Nguồn luật: luật FOU 2 GV (01/10); bảng lớp thường 4 cột L·R·W(G+V)·S(P). Có từ MH6, Pb2-b chạm panel này.

---

## Đã kiểm, không có lỗi
- `npm run check`: 2162 + 28 tốc độ đạt, typecheck sạch, một lần chạy.
- Hàm trùng sau cổng gộp: 7 hàm, mỗi hàm một định nghĩa; nơi gọi đều import bản chung.
- `ca-hai` / "Cả hai": không còn ngoài phép kiểm và chú thích "đã bỏ".
- FT không "n/16": `chuTuanHoc(…, null)` ở mọi nơi FT; HV 1 (đang dừng) và HV 2 (dừng 2 tuần rồi quay lại) cùng "tuần học thứ 14", trục Hành trình bỏ 2 tuần dừng (W2 AUG = 11 → W1 SEP = 12).
- `next_step` của nhóm việc: đã gỡ.
- Trần SQL: đủ cho 6 route GET mới.
- 375 px: 32 ảnh, không tràn ngang; bảng rộng cuộn trong khung riêng.
- Sáng/tối: Tổng quan GV/QL, hồ sơ HV, Hành trình, Phân tích GV, hồ sơ GV — không thấy chữ mất màu hay nền thiếu token.
- Console và mạng: 0 lỗi, 0 request 4xx/5xx trên 68 lần tải.
- Chuyển lớp khác Web gợi ý: chặn ở web và ở máy chủ (không tin cờ `khacGoiY` của thân yêu cầu).
- Số khớp: 9 chỉ số Tổng quan/Cần xử lý (n = số dòng), Lớp tôi dạy 3 cột × 4 lớp, Phân tích GV Chấm điểm, Báo lên ↔ tile, Hiệu quả PA ↔ Điểm đáng chú ý, tổng các hàng Theo lớp = hàng "Cả Monbay".
- KCK (HV 72): "KCK · không đặt kỳ vọng MT, không SOS", ô Kết quả không SOS.
- Lớp thường không SOS: ô Kết quả hồ sơ FOU và panel Chuyển lớp không hiện SOS (máy chủ có `sosLevel` của bài Cuối khoá FOU, nhưng `ketQuaGanNhat` bỏ qua cho lớp thường).

## Chuyển cho PR khác
- PR-Dọn: chữ "ca tối"/"buổi tối" ở WelcomePage + seed; tên kỹ năng theo khung trong gợi ý phân công; seed `action_due` Thứ Hai.
- Lượt 2 / PR-Dọn: vế `m` của dòng thiếu GV (Q6); trần `POST /notifications/doc-het`.
- Ghi chú môi trường: trong dev, React StrictMode gọi đôi mọi `GET` (vd `/tong-quan/quan-ly` ×2, `/my-work` ×2) — chỉ ở dev, không phải lỗi.

Ảnh: `scratchpad/ra-dot6/anh/` (68 PNG + `ket-qua.jsonl`). Log check: `%TEMP%\check-ra6.log`.
