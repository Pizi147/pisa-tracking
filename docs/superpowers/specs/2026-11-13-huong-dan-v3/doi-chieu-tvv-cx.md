# HD-V3-C · Đối chiếu Hướng dẫn TVV + CX (+ Head tutor) với mã main 3fac03216 (13/11)

Phạm vi: `shared/huongDan/tvv.ts`, `cx.ts`, `headTutor.ts`. Không đụng `qt.ts` / vai Quản trị (PTA 13/11). Mã so: `web/src`, `server/src`, `shared` ở `main` (3fac03216).
Cách làm: ba lượt đọc mã chỉ-đọc (Công việc TVV · Học viên / hồ sơ / lớp · Tổng quan / Phân tích / chuông), sau đó tôi kiểm lại bằng grep các điểm quyết định (đánh dấu ✔ kiểm lại). Điểm nào chỉ suy từ mã, chưa chạy giao diện: ghi (suy).

Ký hiệu: **CÓ** đúng, **THIẾU** chưa có, **SAI** chữ / luật lệch mã, **CŨ** từng đúng nay đã đổi.
Chữ trong `«…»` là nhãn thật trên web.

---

## 0. Quyền gốc và đường vào (cơ sở cho mọi dòng dưới)

| | TVV (`consultant`) | CX (`cx`) | Nguồn |
|---|---|---|---|
| Quyền | attempt.view · case.view · student.view · student.edit_info · student.edit_more · analysis.view · class.create · student.add | như TVV, **toàn hệ thống** | `server/src/seed/data.ts:103,105`; migrate không thu hẹp (`prOv8b.ts:12-24`, `prOv13p.ts:21-24`) |
| Không có | student.edit, cycle.edit, score.edit, sos.report, violation.record, discipline.manage, class.edit, request.approve, class.assign, test.view, work.view, analysis.view_teacher | như TVV | cùng nơi |
| Thanh trên | Tổng quan · Học viên & Lớp · **Công việc** · Phân tích | Tổng quan · Học viên & Lớp · Phân tích (**không** Công việc, không Test) | `shared/domain/dieuHuong.ts:50-76`, `server/src/platform/nav.ts:25-47` |
| Công việc | MỘT tab, 4 nhóm | không có | `nav.ts:33` (`viecTvv`), `shared/domain/tongQuan.ts:82-88` (`NHOM_CV_TVV`) |
| Báo cáo PH | xem + xuất | **không** | `shared/domain/baoCaoPh.ts:112` (`VAI_XUAT_BC`) ✔ |
| Đổi Lộ trình đang học · Môn học · tích KCK | **làm** | **không** (chỉ thấy chữ KCK) | `server/src/fasttrack/monDangKy.ts:44-60` ✔, `cycles.ts:523` |
| Chọn Bước tiếp · Gia hạn hạn sau thi · Ghi KQ Báo PH | **làm** | không (chỉ xem "Chờ QL / TVV chọn bước tiếp") | `permissions.ts:772-775`, `loTrinh/thiThat.ts:62-64`, `yThuc/baoPhTvv.ts:138-141` |
| Sửa thông tin (kể cả Target + lý do) · Tạm dừng/ Kết thúc học · Quay lại học (em Tạm dừng) · Kết quả thi thật (kể cả em Lưu trữ) | làm | làm | `students/students.ts:869-871`, `loTrinh/thiThat.ts:50-52`, `fasttrack/cycles.ts:512,541` |
| Case · điểm · Ý thức · Phối hợp SOS | chỉ xem (ngoại lệ: TVV **ghi kết quả Báo PH**) | chỉ xem | không có quyền ghi |

"CX giữ quyền sửa (không «chỉ xem»)" của lời chủ SP: đúng với mã — CX sửa thông tin, Target, Tạm dừng/ Kết thúc học, Quay lại học, Kết quả thi thật. Chỉ **xem** ở: Case, điểm, Ý thức, Phối hợp SOS, Bước tiếp. `cx.ts` hiện không viết CX "chỉ xem" sai chỗ nào ngoài các mục này → không có câu cần bỏ, chỉ cần thêm cho rõ CX KHÔNG đổi Lộ trình / Môn học.

---

## 1. Route × màn Hướng dẫn (đây là chỗ phép kiểm phủ route của A sẽ đỏ)

`manCuaDuong` khớp tiền tố dài nhất (`shared/huongDan/index.ts:36-48`). Cột "HD hiện khớp" là kết quả khi bấm "?" ở route đó.

| Route (`web/src/App.tsx`) | Vai vào được | HD hiện khớp (TVV / CX) | Kết luận |
|---|---|---|---|
| `/` :380 | TVV, CX, HT | `tong-quan` | CÓ; nội dung SAI (mục 3.1) |
| `/phan-tich` :383 | TVV, CX (cờ `analysis`) | `phan-tich` | CÓ; nội dung SAI (3.2) |
| `/hoc-vien` :384 | TVV, CX | `hoc-vien` | CÓ; nội dung SAI (3.3) |
| `/hoc-vien/lop/:classId` :385 | TVV, CX | `ho-so-lop` | CÓ; nội dung SAI (3.4) |
| `/hoc-vien/luu-tru` :386 | TVV, CX (gõ URL / link «Tìm trong HV lưu trữ ›» ở ô tìm; **không** có mục trong menu ⋯ của TVV / CX — `StudentsPage.tsx:427`) | **`ho-so-hv` (SAI: tiền tố `/hoc-vien/` nuốt)** | **THIẾU màn `luu-tru`** (3.5) |
| `/hoc-vien/:id` :387 | TVV, CX | `ho-so-hv` | CÓ; nội dung THIẾU / SAI (3.6) |
| `/hoc-thuat/case/:id` :389 | TVV, CX (`case.view`) | không khớp → "chưa có hướng dẫn" | máy chủ sinh link này trong chuông / việc; trang chỉ **chuyển** sang hồ sơ HV + mở ngăn Case (`CaseBoardPage.tsx:14-27`) → map về `ho-so-hv` hoặc loại trừ khỏi phép kiểm (đề xuất: map `/hoc-thuat/case/` → `ho-so-hv`) |
| `/test/:tab?` :390, `/nhap-diem/:id` :394, `/bang-diem-thuong/:id` :395 | **không** (chuyển về `/` — `App.tsx:390-395`, "OV-11i") | — | không cần màn; phép kiểm phải loại theo `nav.test` (đã là `CAN_NAV`) |
| `/mock-test/:id` :396, `/luot-test/:id` :397 | TVV, CX nếu `attempt.view` trong phạm vi lượt; **chỉ xem** (`chiDoc = !!vaiXemHocVien(roles)` — `MockDetailPage.tsx:164`, `LuotThuongPage.tsx:77`) | không khớp | **THIẾU màn `luot-test`** (3.7) |
| `/cong-viec/:tab?` :398 | **TVV** (CX không) | `cong-viec` | CÓ cho TVV; nội dung THIẾU (3.8). CX: không vào |
| `/ho-so-ca-nhan` :404 | cả hai | `ho-so-ca-nhan` | CÓ |
| `/giao-vien/:id` :405 | **không** — máy chủ 403 "Hồ sơ giáo viên dành cho Quản lý." (`giaoVien/phamVi.ts:29`); menu Tài khoản chỉ hiện khi có vai `teacher` (`Header.tsx:354`) | — | loại khỏi phép kiểm cho TVV / CX |
| `/huong-dan` :406 | cả hai | `huong-dan` | CÓ |
| `/quan-tri`, `/dev/*`, `/tutor/*` | không / không làm | — | ngoài phạm vi |

Head tutor (`ht`): `/`, `/ho-so-ca-nhan`, `/huong-dan` (không có Học viên & Lớp, không Phân tích — `nav.ts`, `dieuHuong.ts`); mục 6.

Phép kiểm HD-NAV hiện chỉ duyệt thanh điều hướng (`prHd.tests.ts:35-41`) nên chưa thấy lỗ `/hoc-vien/luu-tru` ↔ `ho-so-hv`: **đây là lỗi trong chính khung** (`ManHd.duong` của `ho-so-hv` là `/hoc-vien/` mà không loại `luu-tru`). Việc của A (khung): khớp `luu-tru` dài hơn trước khi rơi vào `ho-so-hv`. Phía C chỉ thêm màn `luu-tru` có `duong: ['/hoc-vien/luu-tru']` (dài hơn `/hoc-vien/` nên thắng).

---

## 2. Việc (`lam` — "Tôi muốn…") — TVV

| id | Hiện nói | Mã thật | Kết luận |
|---|---|---|---|
| `xem-viec` | Công việc: Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ; quá hạn ⚠ đầu nhóm | đúng 4 nhóm (`tongQuan.ts:82-86`); **Báo PH còn gồm «Phối hợp SOS» / «Báo PH · Meeting CX/GĐCN»** (`tongQuan.ts:87,133-148`); lọc «Lọc theo hạn» (Mọi hạn · Quá hạn · Hôm nay · Hạn đến) + «Lọc thêm» (`HoTroHocVienTab.tsx:487-512`); chuông «Việc cần làm» (`HopChuong.tsx:187-212`) | **THIẾU** Phối hợp SOS, chuông, lọc hạn |
| `xem-thi-thang` | «Báo PH đúng hạn · Thi tháng này · **Chờ KQ · Lộ trình tiếp**» | Tổng quan TVV **5 ô**: «Việc của tôi ›» · «Báo PH đúng hạn» · «Thi tháng này ›» · «Chờ KQ thi thật ›» · «Chưa chốt lộ trình tiếp ›» (`TongQuanV5.tsx:505-531`; AUDIT-UI B2 tách ô) | **CŨ** (tên ô gộp) |
| `bao-ph` | dòng em nhóm Báo PH (hạn 5 ngày); «Đã báo PH» / «Chưa liên hệ được», **ghi chú**; «Lưu · việc tiếp ›» | khớp: hạn 5 ngày lịch tính cả ngày lưu, đến 23:59 (`shared/domain/baoPhTvv.ts:1-15`); nút dòng «Ghi báo PH» (`baoPhTvv.ts:463`); panel «Báo PH · {tên}»: «Kết quả» (Đã báo PH / Chưa liên hệ được) · «Ngày» · **«Nội dung» bắt buộc** (`PanelBaoPhTvv.tsx:95-96,197-202`; server `baoPhTvv.ts:255`) · «Lưu · việc tiếp ›» / «Lưu» | **CŨ** "ghi chú" → «Nội dung» bắt buộc; **THIẾU** việc sinh **ngay** khi GVCN lưu xử lý, kể cả «Chờ QL duyệt» (`xuLy.ts:199,610-611`; N1); ô ② «Chờ QL duyệt · QL trả lời trước {ngày}» (`PanelBaoPhTvv.tsx:168-169`); khi thu hồi: việc mới «{bậc} đã thu hồi» (QL tick «Nhờ TVV báo lại PH» ở `TheYeuCau.tsx:308`, `XemXuLyPanel.tsx:252` — **ô của QL, TVV không thấy**; TVV chỉ nhận việc) ✔ |
| (mới) `bao-ph-meeting` | — | Luật Phối hợp SOS V2 (chủ SP 11/11 khuya): GVCN xác nhận meeting CX/GĐCN → **TVV báo PH, xếp họp, báo lại kết quả**; dòng «Báo PH · Meeting CX/GĐCN», nút «Ghi KQ» (`DanhSachViec.tsx:481-484`); panel `PanelPhoiHop` cột ① Học viên · ② GVCN xác nhận · ③ «Báo PH · kết quả»; form «Kết quả» (Đã báo PH / Chưa liên hệ được) · «Ngày» · «Nội dung» (bắt buộc; tối thiểu ký tự theo cấu hình); hạn = 5 ngày lịch từ lúc GVCN xác nhận (`phoiHop.ts:359-382`, `shared/domain/sos.ts:167`); em chưa có TVV → GVCN báo | **THIẾU** (việc mới, một lối chính: Công việc › Báo PH) |
| (mới) `han-bao-ph` | — | «Sửa hạn» (link trong panel Báo PH → ô «Hạn mới», «Lưu hạn», «Huỷ sửa», «Về mặc định {ngày}» — `DongHan.tsx:83`, `PanelBaoPhTvv.tsx:173`); «Bỏ việc…» ở ⋯ «Thao tác phụ» + lý do, Hoàn tác / «Khôi phục» (`PanelBaoPhTvv.tsx:85,243-251`); N34 | **THIẾU**. Gộp vào bước của `bao-ph` hoặc việc riêng (mục 5 chọn) |
| `chot-ngay-thi` | nhóm «Chốt ngày thi», ô «Chốt»: «Ngày thi» / «Dời tháng dự kiến»; Lưu | khớp (`PanelSauThi.tsx:227-269`; nút chân «Chốt ngày» (lỗi → «Thử lại»); không hạn `viecTvv.ts:117`) | **CÓ**; chữ nút chân sửa «Lưu ở chân panel» → «Chốt ngày» |
| `thi-that` | nhóm «Sau thi»; «Lưu điểm», «Không thi»; "điểm lưu riêng, chưa cần chọn bước tiếp" | panel «Sau thi · {tên}» **một panel hai bước**: bước 1 «Kết quả thi thật» (L R W S + Overall máy tính; «Lưu điểm» · «Sửa điểm» · «Không thi»), bước 2 «Bước tiếp» mở sau khi lưu (`PanelSauThi.tsx:33-206`); dòng «Cập nhật kết quả thi thật», nút «Nhập KQ thi», **không hạn** (`thiThat.ts:278-280`); lối tắt hồ sơ: «Kết quả thi thật» (FT **hoặc KET / PET**) + thanh «Cập nhật kết quả thi thật ›» (chỉ TVV của em — `students/viecHocVien.ts:70-74`) | **CÓ** phần lớn; **CŨ** câu "chưa cần chọn bước tiếp" (bước 2 nằm ngay trong panel); thêm KET / PET |
| `buoc-tiep` | «hạn: **ngày thi + 7**, Gia hạn được» | hạn = **muộn hơn của (ngày thi + 7 / ngày gia hạn) và (ngày có KQ + 7)** (`shared/domain/tongKetLoTrinh.ts:137-155` ✔); ⓘ web «bước tiếp hạn 7 ngày từ ngày có kết quả» (`HoTroHocVienTab.tsx:794`); nút dòng «Chốt bước tiếp» + «Gia hạn» (hộp «Hạn mới» · «Lý do» · «Gia hạn» · «Bỏ gia hạn»); hai hướng «Tạm dừng/ Kết thúc học» (ô «Có thể quay lại học», nút chốt «Tạm dừng» hoặc «Kết thúc học» theo ô) / «Lộ trình mới» (→ `PanelLoTrinhMoi`); cả «Chọn bước tiếp ›» ở hồ sơ | **SAI** hạn; **THIẾU** nút «Gia hạn» ở dòng, ô «Có thể quay lại học» |
| `bo-sung` | «Điền phần còn thiếu, lưu»; «Học viên & Lớp, lọc **Thiếu thông tin**» | dòng tổng «Bổ sung hồ sơ thiếu · n em», nút «Bổ sung»; panel `SuaThongTinMotEm` «Sửa thông tin · em {n}/{m}», «Bỏ qua ›», «Lưu · em tiếp ›» (`PanelViec.tsx:101-113`, `StudentManagePanel.tsx:454-459`); trường thiếu: Ngày sinh · Email · Tuần bắt đầu · Target FT (`viecTvv.ts:60-61`); chip «Thiếu thông tin» nay ở «Bộ lọc thêm ▾ › Theo vai» (`StudentsPage.tsx:86-92`) | **CŨ** (nhãn panel, nút, chỗ chip); **[XM-C1]** xem mục 7 |
| `sua-hv` | «Sửa thông tin» ở hồ sơ; **cả lớp: «hồ sơ lớp, tab Học viên › Sửa thông tin»** | nút «Sửa thông tin» đầu hồ sơ CÓ; **cả lớp = ⋯ «Thao tác khác» › «Sửa thông tin học viên»** (`hocVienLop.ts:696-723`, `SuaCaLopPanel.tsx:194`): cột Target mở, Tuần bắt đầu khoá, cột «Môn học» chỉ TVV, «Lý do đổi Target · {n} em» | **SAI** lối cả lớp |
| (mới) `doi-lo-trinh` | — | LO-TRINH-THEO-HV (chủ SP 11/11): ở «Sửa thông tin» › khối «Lộ trình đang học» chọn **LT1 · LT2 · RF** (`StudentManagePanel.tsx:509-520`); đổi → MT đã có điểm / QL chốt tay đứng yên; MT chưa thi xếp lại theo lịch lộ trình mới, không về tuần đã qua (`:524-526`); Môn học, Target, điểm đầu vào giữ; có nhật ký («Lịch sử» › «Khôi phục bản trước»). **Chỉ TVV, CX không** (`monDangKy.ts:44-60` ✔). Cũng «Môn học · FT {lộ trình}» chỉ TVV, ô tích KCK chỉ TVV | **THIẾU** |
| `tam-dung` | «Tạm dừng/ Kết thúc học», ô «Có thể quay lại học», «Quay lại học» | khớp (`HopTamDungKetThuc.tsx:152-160,75`); **«Quay lại học»** cũng ở ⋯ cuối dòng (em Tạm dừng), hồ sơ Lưu trữ (nút chính) và trang Lưu trữ (chọn nhiều → thanh đáy «Quay lại học · n em»); **em «Kết thúc học» TVV / CX KHÔNG quay lại được** (cần cycle.edit — `luuTru.ts` `coTheQuayLai`) | **CÓ**; **THIẾU** lối ⋯ + Lưu trữ + giới hạn Kết thúc học |
| `xem-case` | hồ sơ › tab «Học thuật» › ô kỹ năng › «Case & phương án» chỉ xem; **"Cần gọi PH: số điện thoại nằm trong Case"** | Case chỉ xem CÓ. **SĐT không nằm trong panel Case** (`CasePanel.tsx` không có điện thoại ✔). Chỗ gọi PH thật: panel Báo PH «Điện thoại» (nút `tel:` — `PanelBaoPhTvv.tsx:183`); panel một em › khối «Phụ huynh» › «Gọi» (`PanelMotEm.tsx:184-190`); hồ sơ › «Liên hệ» | **SAI** câu gọi PH |
| `lich-su` | «Lịch sử» ở hồ sơ; lọc **Thông tin · Target / lộ trình · Trạng thái** | «Lịch sử» CÓ (cả hồ sơ lớp); nhãn lọc lấy từ máy chủ (`LichSuThayDoi.tsx:148`), «Khôi phục bản trước» ở từng dòng | **chưa kiểm** nhãn lọc — bỏ tên lọc, giữ «Lọc lịch sử» (an toàn) |
| `loc-hv` | «Phạm vi: **HV của tôi** · Chi nhánh»; lọc «**Cần chú ý**…»; «bấm dòng em mở panel một em»; ⋯ «Sửa thông tin · Tạm dừng · Kết thúc học · Kết quả thi thật · Mở hồ sơ» | ô tên «**Xem**» (`StudentsPage.tsx:363-376`): «HV của tôi» (mặc định, chỉ khi được gán ≥ 1 em) + tên từng chi nhánh; đoạn «Tất cả · Đang SOS · Lịch thi»; chip «Thi tháng này · Tạm dừng · Sắp thi · Đã thi · chờ KQ · **Có việc quá hạn**»; «Bộ lọc thêm ▾» › nhóm «Theo vai»: «Thiếu thông tin», «Chờ chọn bước tiếp»; **chip «Cần chú ý» đã bỏ** (`StudentsPage.tsx:85`, U04); bấm **TÊN** em → hồ sơ; `PanelMotEm` mở từ nút «{n} Case · {m} PA», nhãn sau thi, cột Việc; ⋯ «Thao tác khác»: Sửa thông tin · Tạm dừng/ Kết thúc học · Kết quả thi thật (FT / KET·PET) · **Quay lại học** (em Tạm dừng) · Mở hồ sơ | **SAI** (nhãn Xem, chip bỏ, bấm tên, vị trí Thiếu thông tin) |
| `them-hv` | «+ Lớp mới · + Học viên (một em hoặc dán danh sách)» | nút đầu trang **«+ Thêm học viên»** (`StudentsPage.tsx:441`); «+ Lớp mới» nằm trong ⋯ «Thao tác trang» (`:425`); «+ Học viên» chỉ ở ⋯ hàng lớp / hồ sơ lớp; dán = ô «Dán vùng bảng từ Excel / Google Sheets» + «Đọc nội dung đã dán» trong panel «Thêm học viên» (`IntakePanel.tsx:177-228`); **Dán Excel chỉ để thêm học viên** (chủ SP 13/11; không còn dán điểm) | **SAI** nhãn / chỗ |
| `tim-kiem` | «/ hoặc Ctrl K», 2 chữ, nhóm «Học viên · Lớp» | đúng (`Header.tsx:70,93-104`); hộp «Trong phạm vi bạn xem được»; link «Tìm trong HV lưu trữ ›» (= **lối vào trang Lưu trữ**); ô ghi «Tìm học viên, lớp, GV…» nhưng TVV / CX không có dòng GV | **CÓ**; thêm «Tìm trong HV lưu trữ ›» |
| `phan-tich` | «Từ tuần → Đến tuần» (Chi nhánh mặc định một tháng, tab khác 2 tuần) | ba tab «Chi nhánh · Thi thật · SOS» (lớp thường: SOS đổi nhãn «Test») ✔; kỳ = hai nút «**Toàn bộ** · **Chọn khoảng tuần**» + hai ô tuần nối «→» (chữ «Từ tuần / Đến tuần» chỉ ở `aria-label`) (`BoChonThoiGian.tsx:19-31`); mặc định Chi nhánh = tháng chứa hôm nay, tab khác 2 tuần (`PhanTich.tsx:54`); **«Xuất Excel»** cả 3 tab (`dungChung.tsx:85-93`; Chi nhánh thêm «In»); «Dữ liệu đến {ngày}», lọc «Chương trình», ô «Lớp»; không tab «Giáo viên» / «Ý thức» | **SAI** kỳ; **THIẾU** «Xuất Excel» |
| (mới) `xuat-bao-cao-ph` | — | **TVV (không CX)**: ở «Học viên & Lớp» › «Xuất Excel» → ngăn `NganXuatDs`, khối **«Mẫu»**: «Danh sách» \| «Báo cáo PH» (ô «Tháng», bảng đếm, «Xuất {n} HV») (`NganXuatDs.tsx:39,109-114`); hồ sơ lớp tab **«Báo cáo PH»** (chỉ lớp có mẫu FT / FOU / BE / ELE): «Xuất Excel lớp», «Xuất PDF lớp», cột «Xuất» «Excel» / «PDF» từng em (`TabBaoCaoPh.tsx:127-131,231-241`); không viết, không «+ Đợt báo cáo» | **THIẾU** (luật Báo cáo PH TVV theo dõi + xuất em · lớp · chi nhánh) |
| (mới) `xuat-ds` | — | «Xuất Excel» danh sách HV theo bộ lọc (TVV và CX) | **THIẾU** (có thể gộp vào `xuat-bao-cao-ph` thành một việc «Xuất Excel» — mục 5) |
| (mới) `luu-tru` | — | trang Lưu trữ: lớp đã kết thúc (nút «Tổng kết»; «Mở lại» không có) · HV đã lưu trữ («Sửa thông tin», «Quay lại học» chỉ em Tạm dừng, «Tổng kết», «Chọn nhiều học viên») (`LuuTruPage.tsx:178-230`) | **THIẾU** |
| (mới) `chuong` | — | chuông V2 (`HopChuong.tsx`): TVV có khối «Việc cần làm» + «Cập nhật»; số chuông = badge Công việc (quá hạn + hôm nay); bấm một loại → Công việc lọc `?loai=` | **THIẾU** (gộp vào `xem-viec` như lối tắt) |
| (mới) `xem-diem-lan-thi` | — | `/mock-test/:id`, `/luot-test/:id` chỉ xem điểm + «Lịch sử» (`LuotThuongPage.tsx:454`) | **THIẾU** màn (3.7), không cần việc riêng |

Ghi chú Đạt Target thi thật / HV SOS 2–3: **chỉ có ở CX** (mục 3), TVV chỉ có Báo PH đúng hạn / Thi tháng này / Chờ KQ / Chưa chốt lộ trình tiếp.

`VAI_KHAC_TVV`: đúng, thêm «Ghi vi phạm, Xác nhận xử lý — việc của GVCN», «Phối hợp SOS (xác nhận meeting) — việc của GVCN», «Đổi hạn, đổi người phụ trách — việc của QL» nếu đúng nhãn (chưa cần).

---

## 3. Màn / tab (`man` — "Màn này")

### 3.1 `tong-quan` (TVV)
- `dangO.cau` "Việc của tôi và bốn số…" **CŨ** → 5 ô. Mục `tvv-tq-o` "Bốn số của TVV" **CŨ**/**SAI** (`tvv.ts:218`): đúng là «Việc của tôi ›» (cả ô bấm → `/cong-viec`, thêm « ›» khi có số — `TongQuanV5.tsx:467`) + «Báo PH đúng hạn» (bấm số mở panel `/tong-quan/tvv/o?o=bao-ph`; mẫu 0 hiện «—») + 3 ô bấm → `/hoc-vien?phamVi=cua-toi&…` (`thi=1` · `view=da-thi` · `view=cho-buoc-tiep`). Dưới 640 px: «Chưa chốt LT tiếp».
- Đầu trang: «Tổng quan · HV của tôi · {mã tuần} · kỳ {…}» + link «HV của tôi ›» (`OverviewPage.tsx:53`, `lienKetTq` :548). Không ô Chi nhánh, không công tắc khung, không bảng nào dưới dải ô (`TongQuanV5.tsx:505-531`).
- `data-hd="tq-tom-tat"` có (`TongQuanV5.tsx:79`).

### 3.2 `phan-tich` (TVV, CX): xem hàng `phan-tich` ở mục 2; `data-hd` `pt-goc` (có), `pt-hang-loc`, `pt-thoi-gian` có thể dùng cho "Chỉ cho tôi".
- CX thấy «Theo GV» trong tab «Thi thật» (`thiThatThongKe.ts:19`), TVV không.
- Ô «Đạt Target thi thật» → panel chỉ đọc `/phan-tich/bao-cao/o?…&o=dat-target-thi` (`baoCao.ts:352-354`).

### 3.3 `hoc-vien`
- Đủ nội dung ở `loc-hv` / `them-hv`. TVV: «HV của tôi» mặc định; CX: «Mọi chi nhánh» (nhóm «Khác»; chữ là «Mọi chi nhánh», không «Tất cả») + **tab «Phân công GV»** (chỉ CX, chỉ xem — `StudentsPage.tsx:124`, `phanCongGv.ts:488-492`) **THIẾU**.
- Cột bảng (`DanhSachHvLop.tsx:268-280`): Học viên · Lộ trình · MT gần nhất · Hỗ trợ · Ý thức · Lịch thi · «Việc của tôi» (TVV) hoặc «Phụ huynh» (CX; SĐT bấm gọi `tel:`) · ⋯.
- Mục `cx-hvl-menu` (`cx.ts:74`): thiếu «Quay lại học»; ⋯ tên «Thao tác khác».
- Mục `hv-tim` lấy `mucGv('hoc-vien','hv-tim')` — nội dung do A viết cho GV; **phải kiểm lại sau khi A merge** (có thể nói «Nhập điểm», «+ Case» mà TVV / CX không có).

### 3.4 `ho-so-lop`
- Tab thật (`hocVienLop.ts:747-752`): «Học viên» · «Ý thức & Phối hợp» · «Phân tích lớp» · **«Báo cáo PH»** (chỉ TVV, chỉ lớp có mẫu) (+ «Tổng kết» đầu khi lớp đã kết thúc).
- Cách xem ở tab Học viên (`TabHocVienLop.tsx:50-54`): «Tổng hợp» · «Kết quả đầu ra» (khi có đợt) · «Thông tin lớp» (chỉ đọc: Lớp / Phân công / Tuần khai giảng). **«Cần hỗ trợ» đã bỏ khỏi mã.** `tvv-lop-xem` (`tvv.ts:158`) **SAI**: "Thông tin lớp: liên hệ, Target, dự kiến thi" và "Cần hỗ trợ".
- Đầu trang (`DauTrangLop.tsx:248-258`): dòng giáo viên + **«TVV» {TVV chính của lớp}** (`tvvChinhCuaLop`, **THIẾU**), ⋯ «Thao tác khác»: «Sửa thông tin học viên» · «+ Học viên» · «Lịch sử»; **không** «Nhập điểm», «+ Case», «Thông tin lớp», «Cuối khoá…».
- TVV thêm khối «Ở lớp này · học viên của tôi» (`TabHocVienLop.tsx:100,135-153`) và khối «Việc của tôi» (`ThanhViecLop.tsx`); cuối trang gập «Điểm Mock Test của lớp» / «Điểm Test của lớp» (chỉ đọc).
- `tvv-lop-sua` (`tvv.ts:157`) **SAI** ("Tab Học viên › Sửa thông tin"; "sửa nhiều em một lần" ĐÚNG, "Lý do đổi Target chung" ĐÚNG).

### 3.5 `luu-tru` — **THIẾU** (`/hoc-vien/luu-tru`, `LuuTruPage.tsx`)
- Bạn đang ở: lớp đã kết thúc + học viên đã Tạm dừng / Kết thúc học. Trước: «Học viên & Lớp» (nút «‹ Học viên & Lớp»).
- Việc: «Sửa thông tin» (em lưu trữ), «Quay lại học» (em **Tạm dừng** — Kết thúc học thì không, cần cycle.edit), «Tổng kết», thi thật nhập ở hồ sơ em. Không làm: «Mở lại» lớp (QL), xoá / khôi phục «Đã xoá» (QL / QT — chưa xác minh TVV / CX có thấy khối `DaXoaAdmin`).
- Lối vào TVV / CX: ô tìm «Tìm trong HV lưu trữ ›» hoặc gõ URL; **không** có mục trong menu ⋯ của Học viên & Lớp (`StudentsPage.tsx:427`).

### 3.6 `ho-so-hv`
- `tvv-hv-nut` (`tvv.ts:145`): thiếu **«Bước tiếp…»** (khi đã chọn, TVV), «Quay lại học» ở em Tạm dừng đã có; «Kết quả thi thật (FT)» → **FT hoặc KET / PET**; thứ tự nút thật (`quanLyHocVien.ts:53-101`): Sửa thông tin · Tạm dừng/ Kết thúc học · Bước tiếp… · Kết quả thi thật · Quay lại học · Lịch sử; **không** «+ Case», «Chuyển lớp…», «Cuối khoá…». CX: không có «Bước tiếp…» và không «Chọn bước tiếp ›» (`PanelBuocTiep.tsx:137-138`).
- Thanh «Việc cần làm» đầu hồ sơ: «Chọn bước tiếp ›» (TVV của em / QL) và «Cập nhật kết quả thi thật ›» (chỉ TVV của em) (`students/viecHocVien.ts:58-74`). **THIẾU**.
- `tvv-hv-tab` (`tvv.ts:147`): ba tab «Học thuật» · «Ý thức & Phối hợp» · «Lộ trình & lớp» ĐÚNG tên. Nội dung:
  - «Học thuật»: chỉ xem (không «+ Ghi tiến độ», không «Kết luận khoá») ✔.
  - **«Ý thức & Phối hợp»** (Ý thức V2, `yThuc/StudentYThucSection.tsx`): hai đoạn «Vi phạm» · «Phối hợp SOS» (lớp thường «Phối hợp»). TVV: đoạn «Vi phạm» › «Cần làm» › nhóm **«Chờ TVV báo PH»** › nút **«Ghi kết quả báo PH»** (`:196,281`; chỉ khi `coTheGhi` — TVV của em / TVV cùng chi nhánh / QL / GVCN khi việc sau Meeting và em chưa có TVV) → mở `PanelBaoPhTvv`. CX thấy «Chờ TVV». Không «Ghi vi phạm», «Xác nhận xử lý», «Khai / sửa cấp bậc» → cột hiện «Chờ GVCN». **Màn Ý thức không hiện dòng điểm** (chủ SP 11/11 tối). Hiện câu "Phối hợp SOS GVCN làm với em, gia đình" **CŨ** không nói Ý thức V2.
  - **«Phối hợp SOS»**: TVV / CX chỉ xem (`BangPhoiHop.tsx:215-233`, `phoiHop.ts:589-598` — `canAct` = GVCN + QL); riêng việc TVV sau Meeting CX: «Chờ bạn báo PH» + «Ghi kết quả». Kết quả phối hợp hiện ngày · trạng thái · Nội dung · «Xem đủ» (YTHUC-GON).
  - «Lộ trình & lớp»: lưới tuần theo lớp, mọi lượt Test (`StudentDetailPage.tsx:424-436`); thẻ «Hành trình học tập».
- `tvv-hv-thi-that` / `cx-hv-thi-that` (`tvv.ts:136-137`): "Lưu xong, mở bước tiếp ở Công việc › Sau thi" (TVV): lưu đủ KQ → `KetQuaThiThatPanel` **chuyển thẳng** sang «Bước tiếp» (`KetQuaThiThatPanel.tsx:71-72`) → **CŨ**. CX "Chờ QL / TVV chọn bước tiếp" ĐÚNG.
- Khối «Lộ trình đang học» của «Sửa thông tin» (đổi LT1 · LT2 · RF, «Môn học», KCK): xem `doi-lo-trinh`.

### 3.7 `luot-test` — **THIẾU** (`/mock-test/:id`, `/luot-test/:id`)
- Chỉ xem điểm lượt Test của em (không ô nhập, không «Vắng / Dời / Huỷ»); ⋯ dòng kỹ năng: «Lịch sử». Case chỉ xem. Trước: hồ sơ em (hoặc nguồn). Không làm: nhập điểm, dời lịch (GV / QL). Phép kiểm A sẽ đòi mục này nếu coi `/mock-test` · `/luot-test` là route TVV / CX vào được (không `nav` chặn).

### 3.8 `cong-viec` (TVV)
- `dangO` đúng. THIẾU: nhóm «Báo PH» gồm **Báo PH vi phạm + Phối hợp SOS (Meeting CX/GĐCN)**; ⓘ cạnh tên nhóm nói hạn (đúng); không «Làm thay» / «Chờ bạn duyệt» / «Yêu cầu của tôi» (TVV chỉ việc của mình — `routes/index.ts:568-570` 403 nếu xin của người khác); danh sách rỗng «Không còn việc đang mở» + link «HV của tôi ›».
- `tvv-cv-nhom` có thể giữ, thêm 1 mục «Việc nào ở nhóm nào» (Báo PH = vi phạm + Meeting CX/GĐCN · Sau thi = KQ thi thật + Bước tiếp · Chốt ngày thi · Bổ sung hồ sơ).

### 3.9 `ho-so-ca-nhan`, `huong-dan`: CÓ (dùng mục của GV — kiểm lại sau khi A sửa `hs-sua`, `hd-dung`). Menu Tài khoản của TVV / CX: «Hồ sơ cá nhân» · «Giao diện» (Theo máy · Sáng · Tối) · «Ngôn ngữ» (VI \| EN) · «Đăng xuất»; **không** «Đã xoá», «Hồ sơ giáo viên» (`Header.tsx:285-377`).

---

## 4. CX riêng (`cx.ts`)

| id / màn | Hiện nói | Mã thật | Kết luận |
|---|---|---|---|
| `xem-so` / `tong-quan` | "Bốn số: Đạt MT · Đạt Target thi thật · HV SOS 2–3 · **Chờ KQ · Lộ trình tiếp**"; "bấm hàng xem một chi nhánh" | **5 ô**: «Đạt MT» · «Đạt Target thi thật» · «HV SOS 2–3 ›» · «Chờ KQ thi thật ›» · «Chưa chốt lộ trình tiếp ›» (`TongQuanV5.tsx:428-451`); ô 1–2 chỉ FT (lớp thường «—» + «chỉ Fast Track»); bảng «Theo chi nhánh» (cột Chi nhánh · Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa PA) **hàng KHÔNG bấm được** (`onHang={cx ? undefined…}` :404); chọn chi nhánh bằng ô «Chi nhánh» đầu trang (`Filters.tsx:263-288`); sau khi chọn: «Lớp cần chú ý» (≤ 5, `data-hd="tq-lop-chu-y"`); đầu trang link «Lịch thi ›» · «Báo cáo HV ›» (→ `/phan-tich?goc=bao-cao`, tab «Chi nhánh», **không** Báo cáo PH); công tắc «Fast Track \| Lớp thường» khi có cả hai | **SAI / CŨ** |
| Đạt Target thi thật · HV SOS 2–3 | — | «HV SOS 2–3 ›» → `/hoc-vien?view=sos&muc=23[&cn=]` (tab «Đang SOS»); «Đạt Target thi thật» → panel chỉ đọc | **THIẾU** giải thích đích bấm |
| `loc-hv` | "mở ở Tất cả; bấm lọc **Cần chú ý**; Phạm vi Tất cả chi nhánh" | ô «Xem» · «Mọi chi nhánh»; chip «Cần chú ý» đã bỏ; CX **không** có «Có việc quá hạn»; thêm tab «Phân công GV» (xem) | **SAI** |
| `meeting` | "GVCN hẹn meeting… Xem việc: hồ sơ em › tab Ý thức & Phối hợp › Phối hợp SOS. GVCN bấm **Xác nhận meeting** kèm ghi chú; hạn 5 ngày" | nhãn «Xác nhận meeting» đúng (`PhoiHopSosSection.tsx:345`). Luật V2: sau khi GVCN xác nhận, **TVV** báo PH + xếp họp + báo kết quả (CX thấy «Chờ {TVV}» ở cột ③) | **CŨ** phần nào CX theo dõi gì; sửa theo luật V2 |
| `thi-that` | «Kết quả thi thật», Ngày thi / L R W S / Không thi / Lưu | khớp (`KetQuaThiThatPanel.tsx`); **FT hoặc KET / PET**; nhập được cả em Lưu trữ | **CÓ**; thêm KET / PET |
| `sua-hv`, `tam-dung`, `xem-case`, `lich-su` | dùng lại của TVV | CX **không** đổi Lộ trình / Môn học / KCK; «Quay lại học» (em Tạm dừng) CÓ, Kết thúc học không | thêm dòng "CX không đổi Lộ trình, Môn học" |
| `phan-tich` CX | "mặc định 2 tuần vừa qua cho mọi tab"; `cx-pt`: «Toàn bộ · Chọn khoảng tuần» | Chi nhánh = tháng; tab khác 2 tuần; «Toàn bộ · Chọn khoảng tuần» ĐÚNG; thêm «Xuất Excel» | **SAI** mặc định |
| Báo cáo PH | — | CX **không** có (không tab «Báo cáo PH», không mẫu «Báo cáo PH») | ghi vào `vaiKhac` CX: «Xuất báo cáo PH — việc của TVV» |
| `them-hv` CX | mọi chi nhánh | như TVV; cùng sửa nhãn | **SAI** nhãn |
| Chuông CX | — | chỉ khối «Cập nhật» (không «Việc cần làm», không số chuông) (`HopChuong.tsx`) | **THIẾU** (một dòng trong `xem-so`) |
| Tab «Phân công GV» | — | chỉ xem | **THIẾU** |
| Cột «Phụ huynh» (SĐT bấm gọi) | — | CX có (TVV có cột «Việc của tôi») | **THIẾU** (việc "Gọi PH") |
| `tu` | «Meeting CX/GĐCN» ĐÚNG | | CÓ |
| `luat` `cx-luat-thi-that` | "CX nhập được, cả khi em đã Lưu trữ; Bước tiếp… hạn ngày thi + 7" | hạn SAI (như TVV) | **SAI** |

---

## 5. Luật mới — soát nhanh (lời chủ SP 06–13/11 liệt kê trong đề)

| Luật | TVV | CX | Việc cần ghi |
|---|---|---|---|
| Báo PH TVV: sinh ngay, «Chờ QL duyệt», «Nhờ TVV báo lại» | CÓ trong mã; HD THIẾU. «Nhờ TVV báo lại PH» là ô của **QL** (không phải TVV): TVV chỉ nhận việc «{bậc} đã thu hồi» | không | `bao-ph` + luật `tvv-luat-bao-ph` |
| «Báo PH kết quả Test» (GVCN làm, lớp thường) | **không** vào Công việc TVV (nhóm `phoi_hop` ngoài `NHOM_VIEC_TVV` — `mywork.ts:1285-1308`; cho GVCN, `viecHocVien.ts:135-142`) | không | chỉ `vaiKhac`: «Báo PH kết quả Test — việc của GVCN» |
| Báo cáo PH (TVV theo dõi + xuất Excel em · lớp · chi nhánh) | CÓ mã; HD THIẾU (`xuat-bao-cao-ph`) | không có | việc mới + panel `xuat-ds` |
| Ý thức V2 (TVV cập nhật vi phạm) | CÓ mã (Báo PH vi phạm; **không** ghi vi phạm); HD THIẾU | CX xem «Chờ TVV» | `bao-ph` + `ho-so-hv` tab |
| Phối hợp SOS V2 | CÓ mã (TVV chỉ báo lại kết quả Meeting CX/GĐCN); HD **CŨ** `tvv-luat-phoi-hop` (còn nói TVV làm Trao đổi với gia đình) | chỉ xem | viết lại `tvv-luat-phoi-hop` |
| CX giữ quyền sửa | — | đúng (mục 0) | giữ; thêm "CX không đổi Lộ trình / Môn học" |
| Đạt Target thi thật (Tổng quan CX) | — | ô + panel chỉ đọc | `xem-so` |
| Chờ KQ · Lộ trình tiếp (tách 2 ô) | CŨ | CŨ | sửa |
| HV SOS 2–3 (CX) | — | ô → `/hoc-vien?view=sos&muc=23` | `xem-so` |
| Lộ trình theo HV (TVV đổi lộ trình) | CÓ mã (TVV, không CX); HD THIẾU | không | `doi-lo-trinh` |
| Thi thật | CÓ; KET / PET; hạn bước tiếp SAI | như TVV (xem) | sửa |
| Chuông V2 | THIẾU | THIẾU | dòng trong `xem-viec` / `xem-so` |
| Dán Excel chỉ thêm HV | THIẾU nhãn thật | THIẾU | `them-hv` |
| «Sửa thông tin cả lớp» đã đổi chỗ (⋯ › «Sửa thông tin học viên») | SAI | SAI | `sua-hv` |
| Hạn mặc định / N34 sửa hạn | THIẾU (`han-bao-ph`) | không | xem trên |
| Môn chương trình (KET / PET L+S · R+W), Môn học | THIẾU (ghi «Môn học» chỉ TVV) | không | `doi-lo-trinh` |
| «tuần 5/8» lớp thường (G1-10) | không thấy dòng nào nói "W" cho lớp thường trong `tvv.ts` / `cx.ts` (grep) | | không cần sửa |
| Quản trị bỏ «Đã xoá» khỏi menu | `tvv.ts` / `cx.ts` không nhắc | | không cần sửa |

---

## 6. Head tutor (`headTutor.ts`) — chỉ ghi chỗ sai

- `xem-tong-quan`: "Case đang xử lý của bạn. Khối lớp chỉ hiện khi bạn có lớp dạy; trang Tutor tạm ẩn" — Tổng quan của `ht` dùng góc nhìn GV (`OverviewPage.tsx:35,54`) + link «Hồ sơ GV của tôi ›» (`TongQuanV5.tsx:549`; máy chủ cho tự xem hồ sơ mình `giaoVien/phamVi.ts:22`). **Không sai**; thêm link «Hồ sơ GV của tôi ›» không bắt buộc.
- `sua-ho-so`: "Bấm tên bạn › Hồ sơ cá nhân… VI | EN · Theo máy · Sáng · Tối" ĐÚNG (`Header.tsx:285-377`). `data-hd="tai-khoan"` có.
- Không việc Tutor nào (hoãn). **Không có chỗ sai → không sửa `headTutor.ts`** (trừ khi A đổi `mucGv('huong-dan','hd-dung')` / `hs-sua`).

---

## 7. Phát hiện ngoài phạm vi Hướng dẫn (chuyển PTA, không tự sửa)

- **[XM-C1] Việc «Bổ sung hồ sơ thiếu» đòi «Tuần bắt đầu» (`viecTvv.ts:60-61`, `missingForStudent`) nhưng hộp «Sửa thông tin» chỉ cho QL / GVCN sửa «Tuần bắt đầu»** (`StudentManagePanel.tsx:270,528` ✔ — `quanLy = quyen.canEdit`). TVV mở panel «Bổ sung hồ sơ» với em thiếu Tuần bắt đầu sẽ không điền được → việc không bao giờ hết. Hướng dẫn tôi sẽ viết "thiếu Ngày sinh / Email / Target FT: điền ở đây; **Tuần bắt đầu: QL / GVCN**" (đúng mã) và nêu cho PTA quyết (cho TVV sửa hay bỏ khỏi "thiếu" của TVV).
- Ô tìm ghi «Tìm học viên, lớp, GV…» cho TVV / CX nhưng không có kết quả GV (`Header.tsx:187`, `giaoVien/phamVi.ts:70-71`): lỗi nhỏ giao diện.
- `/hoc-vien/luu-tru`: TVV / CX vào được qua URL / ô tìm nhưng không có mục menu → tương thích hay không là quyết của PTA (HD chỉ ghi như mã đang chạy).

---

## 8. Panel làm việc đề xuất cho `PanelHd` / `KhungPanel hd=` (mỗi panel một dòng lý do)

Panel TVV / CX mở (tất cả dùng `KhungPanel` — `web/src/ui/KhungPanel.tsx`); chỉ `ngan-case` và `nhap-diem` có `hd=` hiện nay (`NganCase.tsx:85,92,152`, `PanelNhapDiemLop.tsx:26`, `PanelChamSpeaking.tsx:73`). Giá trị tên: **do A đặt** trong `kieu.ts`; dưới là đề xuất tên + panel.

| Giá trị đề xuất | Component (tệp) | Ai mở | Lý do | Ưu tiên |
|---|---|---|---|---|
| `bao-ph` | `PanelBaoPhTvv` (`congViec/PanelBaoPhTvv.tsx`) | TVV, (QL làm thay) | việc TVV chạm nhiều nhất; nhiều quy tắc ẩn (hạn, «Chờ QL duyệt», «Sửa hạn», «Bỏ việc…») | cao |
| `phoi-hop-tvv` | `PanelPhoiHop` → `BangPhoiHop` (`congViec/PanelViec.tsx:436`) | TVV (GVCN, QL cùng panel nhưng nội dung khác) | Phối hợp SOS V2: TVV chỉ ghi ③ «Báo PH · kết quả» | cao |
| `sau-thi` | `PanelSauThi` (`congViec/PanelSauThi.tsx:33`) | TVV (QL) | hai bước KQ + Bước tiếp, hạn, «Gia hạn» | cao |
| `chot-ngay-thi` | `PanelChotNgayThi` (`PanelSauThi.tsx:227`) | TVV (QL) | ô «Chốt» hai lựa chọn | trung bình |
| `sua-thong-tin` | `SuaThongTinMotEm` (`students/StudentManagePanel.tsx:120`) | TVV, CX (QL, GVCN, Admin dùng chung) | mọi sửa hồ sơ + «Lộ trình đang học» + «Lý do đổi Target»; cũng là panel của «Bổ sung hồ sơ» | cao — **A / B phải thống nhất tên** (panel dùng chung nhiều vai) |
| `thi-that` | `KetQuaThiThatPanel` + `PanelBuocTiep` (`students/`) | TVV, CX (QL, GVCN) | KQ thi thật có Bước tiếp ngay trong panel; CX chỉ xem bước tiếp | trung bình |
| `them-hv` | `IntakePanel` (`students/IntakePanel.tsx`) | TVV, CX (QL, GV) | chỗ duy nhất còn «Dán Excel» (chỉ thêm HV) | cao |
| `xuat-ds` | `NganXuatDs` | TVV (có mẫu «Báo cáo PH»), CX (chỉ «Danh sách») | luật Báo cáo PH | cao |
| `sua-ca-lop` | `SuaCaLopPanel` (`classes/`) | TVV, CX (QL) | nhiều em một lần + «Lý do đổi Target · {n} em» | trung bình |
| `mot-em` | `PanelMotEm` (`students/PanelMotEm.tsx`) | TVV, CX (chỉ đọc) | panel nhanh từ Học viên & Lớp | thấp (có thể bỏ) |

Phần tử `data-hd` có thể dùng cho "Chỉ cho tôi" (có sẵn trong mã): `hvl-xuat` (nút «Xuất Excel»), `hvl-goc`, `hvl-loc-them`, `hvl-lich-thi`, `pt-hang-loc`, `pt-thoi-gian`, `tq-lop-chu-y` (CX, khi đã chọn chi nhánh), `cv-loc-them`, `cv-tom`, `cv-dong`, `tq-tom-tat`, `tim-hv`, `tai-khoan`, `nut-hd`. Không cần thêm `data-hd` mới nếu bỏ «Chỉ cho tôi» ở việc mới (mỗi việc dùng `cv-dong` / `hvl-xuat` sẵn có).

---

## 9. Tóm tắt số liệu và kế hoạch giai đoạn 2

- **TVV `lam`** (hiện 15 việc): giữ 15; sửa nội dung 13 việc (SAI/CŨ: `xem-thi-thang`, `bao-ph`, `thi-that`, `buoc-tiep`, `bo-sung`, `sua-hv`, `tam-dung`, `xem-case`, `loc-hv`, `them-hv`, `phan-tich`, `chot-ngay-thi`(nhãn nút), `xem-viec`); **thêm 6 việc**: `bao-ph-meeting`, `han-bao-ph` (hoặc gộp), `doi-lo-trinh`, `xuat-bao-cao-ph` (gộp `xuat-ds`), `luu-tru`, (chuông gộp vào `xem-viec`). Không bỏ việc nào.
- **TVV `man`**: sửa 7 (`tong-quan`, `phan-tich`, `hoc-vien`, `ho-so-lop`, `ho-so-hv`, `cong-viec`, mục `hv-tim` chờ A); **thêm 2 màn** `luu-tru`, `luot-test`; (`/hoc-thuat/case/` map hoặc loại).
- **TVV `luat`** (`LUAT_TVV`): sửa `tvv-luat-thi-that` (hạn), `tvv-luat-phoi-hop` (viết lại theo V2); thêm `tvv-luat-bao-ph` (sinh ngay, hạn 5 ngày, Sửa hạn, Bỏ việc); `tvv-luat-tam-dung` giữ; `tvv-luat-target` giữ.
- **TVV `tu`**: sửa «Bước tiếp» ("Thôi học" → «Tạm dừng/ Kết thúc học», N11), «Cần chú ý» (chip đã bỏ — chỉ còn "Cần chú ý trước" làm thứ tự xếp), thêm «Báo PH đúng hạn» nếu chưa; giữ phần `HD_GV.tu` dùng chung.
- **CX**: `lam` 11 việc → sửa 7 (`xem-so`, `loc-hv`, `meeting`, `thi-that`, `them-hv`, `phan-tich`, `sua-hv`…), thêm 2 (`goi-ph` gộp `loc-hv`; `xuat-ds` Excel); `man` sửa 3 (`tong-quan`, `phan-tich`, `hoc-vien` + tab «Phân công GV») + thêm `luu-tru`, `luot-test`; `luat` sửa `cx-luat-thi-that`; `vaiKhac` thêm «Xuất báo cáo PH — việc của TVV».
- **Head tutor**: không sửa.
- **Bản Anh**: mọi chữ mới qua `t()` + khoá ở `shared/i18n/en/hdV3c.ts` (tsc báo thiếu).
- **Chờ A**: giá trị `PanelHd` + hàm khớp `luu-tru`; danh sách `CHO_C`; mục `mucGv(...)` dùng lại (3.3, 3.9). **Chờ PTA**: [XM-C1].

Ước Turso: 0 câu mới (nội dung tĩnh).
