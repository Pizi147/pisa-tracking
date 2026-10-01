# Rà PR #145 PR-Pb2-a — mức GỌN (main @ f814ba26)

Người rà: Opus 5.5. Chỉ đọc mã, không chạy `npm run check`.

### [P1] "PA do giáo viên thêm" bỏ PA của Case chưa có lỗi chính → ô "PA hiệu quả" của bảng GV không bằng trang nó mở
- Chỗ: `server/src/phanTich/hieuQuaPa.ts:135-141` (vòng `gvThem`), so với `server/src/phanTich/giaoVien.ts:292-297` (`tapPaHieuQua`)
- Lỗi: trang Hiệu quả PA chỉ đếm PA `preset = 0` của Case **có** lỗi chính (`ma0`). PA của Case chưa có lỗi chính bị `continue`, chỉ hiện ở chân bảng dưới dạng "Case chưa phân loại lỗi". Trong khi đó `paCoKetQua` (Pb2-b dùng cho cột "PA hiệu quả") đếm **mọi** PA `!quyChe` có kết quả.
- Tình huống: GV X phụ trách một Case FT do GV báo, chưa ghi lỗi chính, có 1 PA tự thêm đã có kết quả. Bảng Phân tích GV ghi X có 1 PA. Bấm sang `/phan-tich?goc=hieu-qua-pa&gv=X&tu&den` thì "PA do giáo viên thêm · 0 PA có kết quả". Số trên ô ≠ số khi mở (luật số liệu 3, Q16). Phép kiểm kế hoạch "Σ Số PA hai phần = số PA có kết quả trong phạm vi" cũng sai trong trường hợp này; seed hiện không có Case như vậy nên phép kiểm vẫn qua.
- Sửa: chọn một luật cho cả hai nơi. (a) `tomTat.paCoKetQua` / `caiThien` của `gvThem` tính cả PA của Case chưa phân loại (bảng con vẫn bỏ chúng). Hoặc (b) `paCoKetQua` trả thêm cờ `phanLoai`, Pb2-b lọc theo cờ đó. Thêm phép kiểm với một Case không có `case_issues` primary.
- Nguồn luật: Q16, Hợp đồng a↔b (dòng `hieuQuaPa.ts`), Task 3 phép kiểm "Σ Số PA hai phần", CHUNG §3

### [P2] PA quy chế FT xếp theo mức SOS HIỆN TẠI của Case, không theo mức lúc PA chạy
- Chỗ: `server/src/phanTich/hieuQuaPa.ts:110-113` (`khoaQuyChe` đọc `r.sos` = `sos_cases.sos_level`); mức này bị ghi đè ở `server/src/cases/sos.ts:390`, `:402`
- Lỗi: Case trượt lại thì `sos_level` đổi theo lượt mới. Các PA quy chế đã xong của mức cũ vì thế bị dời sang hàng mức mới.
- Tình huống: Case SOS 1 có PA quy chế đã ghi kết quả, lượt MT sau ra SOS 2 → PA đó hiện ở hàng "SOS 2", hàng "SOS 1" bị hụt.
- Sửa: lấy mức từ mốc của Case (`case_milestones.sos_level` gần nhất ≤ ngày bắt đầu PA), hoặc ghi mức vào PA lúc sinh. Nếu chấp nhận dùng mức hiện tại thì thêm chú thích `ponytail:` và ghi vào "Cách đọc".
- Nguồn luật: Q8 ("FT theo SOS 1 · 2 · 3"), K1-23

### [P2] Hàng con của "PA theo quy chế" sắp theo số PA giảm dần
- Chỗ: `server/src/phanTich/hieuQuaPa.ts:181` (`con.sort(xepSo)` cho cả khối quy chế)
- Lỗi: kế hoạch ghi "thứ tự cố định, không xếp hạng". Hàng lớn (SOS 1·2·3) đã theo thứ tự cố định, nhưng hàng con (loại PA) vẫn đổi chỗ theo số lượng.
- Tình huống: hai bộ lọc khác nhau → thứ tự loại PA trong SOS 2 đảo nhau.
- Sửa: hàng con quy chế sắp theo thứ tự cố định, ví dụ thứ tự khoá `INTERVENTION_KIND_LABEL`.
- Nguồn luật: Q8

### [P2] Hai route đọc của Danh sách Case cũ còn sót, web không còn gọi
- Chỗ: `server/src/routes/index.ts:1461` (`GET /cases`), `:1591` (`GET /cases/queues`)
- Lỗi: grep `web/src` không còn nơi nào gọi hai route này (chỉ còn `invalidate('/cases')`, và `/cases/:id` vẫn dùng). Task 2 ghi "route chỉ Danh sách Case gọi → xoá + sửa phép kiểm cũ". Thân PR không nhắc việc này.
- Tình huống: mã chết vẫn mở API danh sách Case kèm bộ lọc `queue`/`skill` cũ.
- Sửa: xoá hai route và phép kiểm của chúng, hoặc ghi vào "Chuyển cho PR khác" (PR-Dọn).
- Nguồn luật: Task 2 mục Máy chủ

### [P2] Khung Lớp thường: Excel vẫn ghi chữ "SOS"
- Chỗ: `shared/domain/phanTich.ts:469` (dòng đầu Excel `Tổng hợp Test + SOS · …`), `web/src/modules/phanTich/TongHopTestSos.tsx:131` (tên file `tong-hop-test-sos-*.xlsx`); nhãn góc nhìn `phanTich.ts:23`
- Lỗi: đề bài yêu cầu Tổng hợp lớp thường không có chữ SOS. Bảng đã sạch, nhưng tiêu đề Excel và tên file vẫn còn chữ SOS khi khung là Lớp thường.
- Tình huống: QL chọn Lớp thường, bấm Xuất Excel → dòng 1 ghi "Tổng hợp Test + SOS · … · Lớp thường".
- Sửa: tiêu đề Excel và tên file theo `ct` (ví dụ `Tổng hợp Test · Lớp thường`). Nhãn tab góc nhìn để chủ sản phẩm quyết (KIỂM A6 vẫn gọi là "Tổng hợp Test + SOS").
- Nguồn luật: CHUNG §2 "Lớp thường không có SOS", Q12

### [P2] Nghi ngờ — Pre FOU Giữa khoá rơi vào cột "theo môn"
- Chỗ: `server/src/phanTich/tongHop.ts:46-50` (`phanLoaiBaiThuong`)
- Lỗi: Pre FOU không chia môn (`CHUONG_TRINH_KHONG_CHIA_MON`), nhưng bài không phải Cuối khoá vẫn được đếm "môn trượt" từ `ev.skills`, nên ra "Đạt hết" hoặc "1 môn trượt".
- Tình huống: bài Giữa khoá của lớp Pre FOU dưới 70% → hiện ở cột "1 môn trượt". Lớp này không có môn.
- Sửa: nếu Pre FOU có Giữa khoá thì planning chốt cột cho nó (theo % tổng, như `phanTichLop.ts:91`); nếu không có thì bỏ qua mục này.
- Nguồn luật: Q12, PF3

## Đã kiểm, không có lỗi
- "Cả hai": không còn `'ca-hai'` / "Cả hai" (nghĩa khung) trong `shared/`, `server/src` (trừ tests), `web/src`. Chỉ còn câu chú thích tiếng Việt thường. `CHUONG_TRINH = ['ft','thuong']`, FT trước; chỉ còn một bản `ChuongTrinh`. Pb2-b dùng kiểu riêng `KhungPtGv` đúng hợp đồng.
- Link cũ `?ct=ca-hai` → `chuongTrinhTuThamSo` → `'ft'` ở web (`PhanTich.tsx:28`) và ở mọi route theo kỹ năng. Tổng quan QL (VAI-a) dùng công tắc nhớ theo máy, nên bỏ qua `ct` trên URL.
- Khối gộp: `CHI_SO_GOP` + `locKhung` (`metrics.ts:268, 460`) là một chỗ duy nhất. `/phan-tich/y-thuc` dùng `ct: null`, góc Ý thức ẩn công tắc khung và ô Lớp liệt kê mọi lớp. `/metrics/:id` và `/highlights` dùng `ctTuyChon` (vắng → gộp). Hồ sơ GV: `lopCuaGv` / `caseMoCuaGv` mặc định `null`, `oHoSoGv` dùng `ctTuyChon`.
- GV mặc định khung lớp mình dạy: Lịch Test, Kế hoạch Test, Lớp tôi dạy (`khungMacDinhGv`) đã có. "Tất cả" ở Công việc / Học viên là bộ lọc danh sách đã duyệt (MH4, K4-05), không phải nút "Cả hai" của số liệu. Ghi lại để planning xác nhận.
- Danh sách Case: `GOC_NHIN` không còn `'danh-sach'`. Thứ tự `GOC_NHIN` đúng hợp đồng (`…, 'y-thuc', 'giao-vien'`). `duongMoi` chuyển hướng một bước: `goc=danh-sach`, `ky-nang`, `tinh-hinh`, `hang-doi` khác → Vấn đề HV; `due` → Công việc; bỏ quên → `/`. `/?tab=tinh-hinh…` của `summary.ts` cũng vào đúng.
- `/hoc-thuat/case/:id`: Case có em → `<Navigate replace>` sang hồ sơ HV mở Ngăn Case; Case không có em → giữ trang cũ (đã ghi `ponytail:` + PR-Dọn). Không ra 404.
- Link máy chủ: `metrics.ts` (`duongCase`), `profile.ts`, `mywork.ts` khi có em đều trỏ hồ sơ HV; `/hoc-thuat/case/` chỉ dùng khi Case không có em. Không còn `goc=` hay `/phan-tich?` nào sinh từ máy chủ (thông báo, email).
- Hiệu quả PA: quy chế ⇔ `preset = 1` (gồm `bo_tro`) ở `shapePlan`. Khối quy chế không có `nenDung`, hàng lớn theo thứ tự cố định `THU_TU_QUY_CHE`.
- PA huỷ "không cần theo dõi" (`status = 'cancelled'`, `sosAuto.ts:470`) bị loại khỏi `queryPlans` (`status = 'completed'`), nên không vào Số PA và không vào "chưa ghi kết quả".
- `tu`/`den`: `loiKhoangTuan` kiểm Thứ Hai, `tu ≤ den`, tối đa 52 tuần. `toDate = den + 6` tính cả tuần `den`. Có `tu` thì bỏ qua `tg` (máy chủ), và web ẩn ô `tg`.
- Trung vị: `tuanTrungVi`, có nhãn "Thời gian thường mất".
- Mini Test (Q9): một chỗ ở `ketQuaCuoi`, ngưỡng `NGUONG_MINI_TEST` dùng chung từ shared.
- Quyền `gv`: `phamViHoSoGv` lỗi → `rong` (không lộ tên, không lộ số). `branchIds` luôn lấy theo phạm vi người xem (`phamViPhanTich`). Phạm vi rỗng → `none` → rỗng. Quản lý chi nhánh khác không đọc được dữ liệu chi nhánh mình qua `gv`.
- Tổng hợp lớp thường: Giữa khoá theo môn, Cuối khoá 4 dải qua `daiCuoiKhoa` (một nguồn ở `shared/domain/cuoiKhoa.ts`, không gõ lại 50/60/70). Σ các cột kết quả = Bài. Mini Test đếm học viên ở dòng bài Cuối khoá gốc, một câu theo lô 400. `oTongHop` dùng chính `tinh`. Em KCK ngoài mẫu số. Bảng web không có chữ SOS; chú giải màu SOS bị ẩn.
- Trần SQL: `tocDoDuong.ts` có `/phan-tich/hieu-qua-pa?gv&tu&den`, `/phan-tich/tong-hop?ct=ft|thuong`.

## Chuyển cho PR khác
- **Pb2-b:** link P6 ở `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx:101` thiếu `ct`, nên mặc định FT. GV chỉ dạy lớp thường bấm vào sẽ thấy bảng FT rỗng. Nên truyền khung của lớp GV dạy (hợp đồng có `ct={ft|thuong}`).
- **PR-Dọn (có từ trước, không do Pb2-a):** `queryPlans` (`server/src/cases/effectiveness.ts:208-243`) đưa toàn bộ `sids` vào một `IN (…)` không chia lô. Chi nhánh trên 900 học viên sẽ vượt luật 900 tham số. Nay `paCoKetQua` còn được bảng GV gọi, nên đường này chạy nhiều hơn.
- **Planning:** quyết nhãn tab "Tổng hợp Test + SOS" khi khung là Lớp thường (xem P2 Excel ở trên).
