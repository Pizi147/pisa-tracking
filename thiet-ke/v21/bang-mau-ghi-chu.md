# v21 · Bảng mẫu thành phần (mockup ⑤) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/bang-mau.html` (+ `v21.css` chỉ đọc, `bang-mau.css` phần mới). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/06-de-bai-mockup-2-5.md` mục ⑤ R5.1–R5.9 + "Luật chung".
Ảnh: `thiet-ke/v21/anh/bang-mau/<khung>-{toi|sang}.png` (37 khung × 2) + `a1-bam-thu-*.png` (ô chọn chạy thật). Chụp bằng chrome-headless-shell có sẵn (Playwright cache), không cài gói; phông Be Vietnam Pro + Inter đã nạp (`document.fonts.check` = true); soát tự động: không phần tử tràn khung, không chữ bị cắt, không chữ < 12 px.
Không chạy web thật: mọi dáng đang có đọc từ mã `web/src` + mockup ① (đủ cho tờ mẫu; màn ②–④ mới cần chạy web).

Tờ này là nguồn dáng cho session code dựng MỘT bộ thành phần dùng chung (04 mục 5.3, 5.9, 12 mục 5.11). Mọi thành phần đã có ở mockup ① vẽ lại đúng dáng ①; chỉ thêm biến thể + trạng thái. Áp lời 20 (chủ SP 14/11 đêm): nút-chip không biểu tượng · "Lớp của tôi" không có Chấm Speaking · Báo cáo PH trong Vận hành · bấm việc = panel / đúng trang · "+ Task" · "Chấm Speaking".

## 1. Bảng kê R5.2 — mọi chỗ chọn người / lớp / học viên trong `web/src` (63 chỗ)

Rà đủ (không lấy mẫu) trên `origin/main` fb9d62eb8: mọi `<select>`, `Menu`, `MenuDong`, `ChonNguoi`, `ChonLop`, ô gợi ý / combobox tự viết, `datalist`. Đường tệp tính từ `web/src/`.

**Kết luận:** web ĐÃ CÓ ô chọn có tìm dùng chung — `ChonNguoi` (`ui/PeoplePicker.tsx:115`: combobox ARIA, tìm không dấu, ↑ ↓ Enter Esc, dòng mờ `tat`, "Tôi", "Dùng tên ngoài hệ thống", nhóm Tutor) và `ChonLop` (`ui/ChonLop.tsx:14`, dựng trên `ChonNguoi`). 47 / 63 chỗ (A + B) đã dùng hai ô này → PR thay chỉ cần **nâng cấp hai ô** (nhóm có nhãn + số, chọn nhiều có chip + trần, toàn màn ở 375 — mẫu A) và **thay 16 chỗ còn lại**: 9 `<select>` (C) + 7 ô tự viết (D). `Menu` / `MenuDong` không chỗ nào dùng để chọn người / lớp (chỉ là menu thao tác — xem mục 3).

Cột "nhóm liên quan trước" là đề xuất của tờ mẫu (theo lời 17 ý 5: "chuyển lớp thì nên hiện ra lớp ở trong cùng chi nhánh, GV cùng chi nhánh… trước"). Mọi nhóm phải lấy từ dữ liệu máy chủ đã trả (vd `/ref/nguoi` đã trả `cungLop`, `monDay`) — không tải cả danh sách chi nhánh khi mở trang (04 mục 12).

#### A. `ChonNguoi` — chọn người (31)

| # | tệp:dòng | màn / hộp | chọn gì | 1 / n | hiện tại | nhóm liên quan trước (đề xuất) | nguồn dữ liệu | máy chủ có đường tìm |
|---|---|---|---|---|---|---|---|---|
| 1 | modules/cases/BuoiTutorO.tsx:26 | Cập nhật tuần PA Tutor → Buổi n | Tutor của buổi | một | ChonNguoi `tutor.chi` (+ "Tutor khác") | **Tutor gợi ý của PA → Tutor cùng kỹ năng → Khác** | `/tutors/chon?paId&q` | có: `/tutors/chon` |
| 2 | modules/cases/CapNhatTuan.tsx:368 | Cập nhật tuần PA (Case) | Người dạy / thực hiện PA (nhóm Tutor đầu) | một | ChonNguoi (+ tên ngoài) | **Tutor gợi ý → GV của lớp → Cùng chi nhánh → Khác** | `/ref/nguoi?nhom=nhan_vien&q` + `/tutors/chon?paId` | có: `/ref/nguoi`, `/tutors/chon` |
| 3 | modules/cases/CasePanel.tsx:469 | Panel Case → "Đổi người phụ trách" | Người phụ trách Case | một | ChonNguoi `ds` | **GV dạy kỹ năng của Case ở lớp → GV khác của lớp → Cùng chi nhánh** | `GET /cases/:id` (`doiChu.ungVien`) | chưa (danh sách ứng viên trả kèm Case) |
| 4 | modules/cases/CasePanel.tsx:852 | Panel Case → PA → "Đổi người dạy / thực hiện" | Người dạy PA | một | ChonNguoi (+ tên ngoài) | **GV của lớp (kỹ năng của Case) → Cùng chi nhánh → Khác** | `/ref/nguoi?nhom=giao_vien&studentId&q` | có: `/ref/nguoi` |
| 5 | modules/cases/DoiNguoiPhuTrach.tsx:39 | Panel Việc (Công việc) → Đổi người phụ trách Case | Người phụ trách Case | một | ChonNguoi `ds` | **như #3** | `GET /cases/:id` (`doiChu.ungVien`, qua PanelViec:423) | chưa |
| 6 | modules/cases/FormPa.tsx:93 | Form PA (Thêm / Đổi PA: ThaoTacCase:147, DoiPa:52, CapNhatTuan:380/390, CaseSosControls:187/355) | Người dạy / thực hiện PA | một | ChonNguoi (+ Tutor, tên ngoài) | **như #2** | `/ref/nguoi?nhom=giao_vien&studentId&cungChiNhanh&q` + `/tutors/chon?studentId` | có: `/ref/nguoi`, `/tutors/chon` |
| 7 | modules/cases/QuickReport.tsx:557 | Báo Case (mở từ trang lớp) | Học viên (em) | một | ChonNguoi `ds` | **Lớp này (một nhóm)** | `/classes/:id/roster` (ClassOverviewPage:76) | có: `/classes/:id/roster?q` (chưa dùng) |
| 8 | modules/cases/QuickReport.tsx:661 | Báo Case → dòng "Đã làm" | Người thực hiện | một mỗi dòng | ChonNguoi (+ tên ngoài) | **GV của lớp → Cùng chi nhánh → Khác** | `/ref/nguoi?nhom=giao_vien&studentId&q` | có: `/ref/nguoi` |
| 9 | modules/cham/GvCham.tsx:100 (`NutGvCham`, gọi ở cham/LuoiFT.tsx:219, :243 · cham/MotKyNang.tsx:207 · fasttrack/MockDetailPage.tsx:725) | Panel "GV chấm Speaking" (Nhập điểm lưới FT, một kỹ năng, hồ sơ Mock) | GV chấm S | một | nút → KhungPanel → ChonNguoi `gv_speaking` (+ tên ngoài) | **GV Speaking của lớp → GV Speaking chi nhánh** | `/ref/nguoi?nhom=gv_speaking&q` | có: `/ref/nguoi` |
| 10 | modules/classes/ClassCreatePanel.tsx:300 | Tạo lớp → Phân công | GVCN / GV từng môn | một mỗi ô | ChonNguoi `ds` | **GV dạy môn này ở chi nhánh → GV khác chi nhánh** | `/ref/teachers?branchId` | chưa |
| 11 | modules/classes/LuoiTaoLop.tsx:353 | Tạo nhiều lớp (lưới) → ô GV | GV mỗi vai | một mỗi ô | ChonNguoi `ds` | **như #10** | `/ref/teachers?branchId` (một GET mỗi chi nhánh, :96) | chưa |
| 12 | modules/congViec/ChonPhuTrach.tsx:106 (gọi ở congViec/HoTroHocVienTab.tsx:507) | Công việc → Hỗ trợ học viên → "Một GV ▾" (QL/QT) | GV để lọc việc | một (lọc) | nút menu tự viết + ChonNguoi | **Tôi → GV chi nhánh đang xem → Khác** | `/ref/nguoi?nhom=giao_vien&q`; tra tên từ `?nguoi=` bằng `/ref/users` (CẢ danh sách) | có: `/ref/nguoi` |
| 13 | modules/congViec/PanelViec.tsx:395 | Panel Việc "Phân công GV / GVCN" | GVCN / GV môn của lớp | một | ChonNguoi `ds` | **GV đang dạy lớp → GV dạy môn này ở chi nhánh → Khác** | `/classes/:id/teachers` (`candidates`) | chưa |
| 14 | modules/congViec/XacNhanPaLo.tsx:177 | Xác nhận PA cùng lúc → Người dạy chung | Người dạy | một | ChonNguoi (+ Tutor) | **như #2** | `/ref/nguoi?nhom=giao_vien&q` + `/tutors/chon?classId` | có |
| 15 | modules/congViec/XacNhanPaLo.tsx:219 | Xác nhận PA cùng lúc → Người dạy riêng từng em | Người dạy | một mỗi em | ChonNguoi (+ Tutor) | **như #2** | `/ref/nguoi?studentId&q` + `/tutors/chon?studentId` | có |
| 16 | modules/fasttrack/HopNhapDiem.tsx:516 | Hộp Nhập điểm → Người chấm | Người chấm Speaking | một | ChonNguoi `gv_speaking` / `nhan_vien` (+ tên ngoài) | **như #9** | `/ref/nguoi?q` | có |
| 17 | modules/students/phanCongGv/OGv.tsx:48 (`ChonGvPc`, gọi ở students/GocPhanCongGv.tsx:370) | Học viên & Lớp → Phân công GV → ô GV | GV | một mỗi ô | NoiNeo + ChonNguoi `ds` + "Bỏ trống" | **GV dạy môn này ở chi nhánh → Khác** | `/hoc-vien-lop/phan-cong?branchId` | chưa |
| 18 | modules/students/StudentManagePanel.tsx:480 | Sửa thông tin học viên → TVV | TVV | một | ChonNguoi `ds` | **TVV đang giữ em → TVV chi nhánh** | `/students/:id` (`tvvChon`) | chưa |
| 19 | modules/students/SuaCaLopPanel.tsx:291 | Sửa cả lớp (lưới) → cột TVV | TVV | một mỗi em | ChonNguoi `ds` | **như #18** | `/classes/:id/sua-ca-lop` (`tvv`) | chưa |
| 20 | modules/worklist/MgmtTasksPage.tsx:194 | Việc quản lý → lọc "Người phụ trách" | Người phụ trách | một (lọc) | ChonNguoi `nhan_vien` | **Tôi → Chi nhánh → Khác** | `/ref/nguoi?q` | có |
| 21 | modules/worklist/MgmtTasksPage.tsx:502 | Panel Công việc → "Cần ai hỗ trợ" | Người hỗ trợ | một | ChonNguoi (+ tên ngoài) | **Gần đây → Chi nhánh → Khác** | `/ref/nguoi?nhom=nhan_vien&q` | có |
| 22 | modules/worklist/MgmtTasksPage.tsx:588 | Sửa công việc → Người phụ trách | Người phụ trách | một | ChonNguoi (+ tên ngoài) | **Gần đây → Chi nhánh của việc → Khác** | `/ref/nguoi?chiNhanh&q` | có |
| 23 | modules/worklist/MgmtTasksPage.tsx:591 | Sửa công việc → Người theo dõi | Người theo dõi | một | ChonNguoi | **như #22** | `/ref/nguoi?chiNhanh&q` | có |
| 24 | modules/worklist/MgmtTasksPage.tsx:792 | Giao việc / Việc con → Người phụ trách | Người phụ trách | một | ChonNguoi (+ Tôi, tên ngoài) | **Tôi → Gần đây → Chi nhánh của việc** | `/ref/nguoi?chiNhanh&q` | có |
| 25 | modules/worklist/MgmtTasksPage.tsx:795 | Giao việc / Việc con → Người theo dõi | Người theo dõi | một | ChonNguoi | **như #22** | `/ref/nguoi?chiNhanh&q` | có |
| 26 | modules/yThuc/BangPhoiHop.tsx:318 | Bảng Phối hợp SOS → đổi người | Người thực hiện | một | ChonNguoi | **GVCN lớp → TVV của em → Chi nhánh** | `/ref/nguoi?nhom=nhan_vien&q` | có |
| 27 | modules/yThuc/DaThucHienPanel.tsx:78 | Đã thực hiện (xử lý vi phạm) | Người thực hiện | một | ChonNguoi | **GVCN lớp em → GV của lớp → Chi nhánh** | `/ref/nguoi?studentId&q` | có |
| 28 | modules/yThuc/LoYThucPanel.tsx:259 | Lô Ý thức | Người | một | ChonNguoi | **như #27** | `/ref/nguoi?q` | có |
| 29 | modules/yThuc/PhoiHopSosSection.tsx:327 | Phối hợp SOS (họp / việc) | Người / Người thực hiện | một | ChonNguoi | **như #26** | `/ref/nguoi?q` | có |
| 30 | modules/yThuc/XacNhanXuLyPanel.tsx:339 | Xác nhận xử lý vi phạm | Người thực hiện | một | ChonNguoi | **như #27** | `/ref/nguoi?studentId&q` | có |
| 31 | modules/yThuc/XemXuLyPanel.tsx:167 | Xem xử lý → ghi tiến độ | Người thực hiện | một | ChonNguoi | **như #27** | `/ref/nguoi?studentId&q` | có |

#### B. `ChonLop` — chọn lớp (16)

| # | tệp:dòng | màn / hộp | chọn gì | 1 / n | hiện tại | nhóm liên quan trước (đề xuất) | nguồn dữ liệu | máy chủ có đường tìm |
|---|---|---|---|---|---|---|---|---|
| 32 | modules/classes/CuoiKhoaLop.tsx:548 | Cuối khoá lớp → dòng từng em | Lớp đích | một mỗi em | ChonLop + "+ Mở lớp mới…" | **Lớp theo luồng chuyển tiếp → Cùng chi nhánh (cả lớp chỉ cùng chi nhánh, L-12)** | `/classes/:id/transition` (`candidates`) | chưa |
| 33 | modules/classes/CuoiKhoaLop.tsx:659 | Cuối khoá lớp → thanh "Lớp cho các em đã chọn" | Lớp đích (áp nhiều em) | một | ChonLop + Mở lớp mới | **như #32** | `/classes/:id/transition` | chưa |
| 34 | modules/classes/CuoiKhoaLop.tsx:745 | Cuối khoá lớp → "Lớp cho cả nhóm" | Lớp đích của nhóm | một | ChonLop + Mở lớp mới | **như #32** | `/classes/:id/transition` | chưa |
| 35 | modules/classes/HopDotBaoCaoPh.tsx:106 | Đợt báo cáo mới → Áp cho lớp "+ lớp" | Lớp | nhiều (chip) | ChonLop `noi` | **Lớp đang chạy cùng chương trình → Chi nhánh** | `/bao-cao-ph/lop?branchId` | chưa |
| 36 | modules/classes/PanelXetLai.tsx:359 | Xét lại lộ trình → dòng từng em | Lớp học lại / lên | một mỗi em | ChonLop | **Lớp theo hướng (học lại / lên) cùng chi nhánh → Chi nhánh khác** | `/classes/:id/xet-lai` | chưa |
| 37 | modules/students/ChuyenLopPanel.tsx:328 | Chuyển lớp / Đề xuất chuyển lớp (một em) | Lớp chuyển đến | một | ChonLop | **Cùng chi nhánh → Chi nhánh khác (lời 17 ví dụ chuyển lớp)** | `/chuyen-lop/lop-dich?studentId` | chưa |
| 38 | modules/students/ChuyenLopPanel.tsx:552 | Chuyển lớp nhiều em → dòng từng em | Lớp chuyển đến | một mỗi em | ChonLop + Mở lớp mới | **như #37** | `/chuyen-lop/lop-dich?studentId` — MỘT GET MỖI EM (:545) | chưa |
| 39 | modules/students/IntakePanel.tsx:200 | Thêm học viên (dán Excel) → "Thêm vào lớp" | Lớp | một | ChonLop | **Lớp của tôi → Cùng chi nhánh** | `/ref/classes` (mọi lớp trong phạm vi) | chưa (`/ref/classes` không có `q`) |
| 40 | modules/students/PanelLoTrinhMoi.tsx:179 | Lộ trình mới → "Lớp khác" | Lớp | một | ChonLop | **Cùng chi nhánh → Chi nhánh khác** | `/students/:id/hoc-lai/lop-dich` | chưa |
| 41 | modules/students/QuayLaiHoc.tsx:106 | Quay lại học (Lưu trữ) | Lớp | một | ChonLop | **Lớp cũ của em → Cùng chi nhánh → Khác** | `/students/:id/quay-lai` | chưa |
| 42 | modules/students/StudentManagePanel.tsx:231 | Học lại / đổi lớp (StudentManagePanel) | Lớp | một | ChonLop | **như #40** | `/students/:id/hoc-lai/lop-dich` | chưa |
| 43 | modules/students/XemTruocHangLoatPanel.tsx:139 | Thao tác hàng loạt "Học lại · n học viên" | Lớp | một | ChonLop | **như #40** | `/students/:ids[0]/hoc-lai/lop-dich` | chưa |
| 44 | modules/test/keHoach/NganXepHangLoat.tsx:213 | Xếp lịch Test (lớp thường) → Lớp | Lớp | một | ChonLop | **Lớp có Test tuần này → Chi nhánh** | `/ke-hoach-test/lop` (KeHoachTestTab:40) | có một phần: `/ke-hoach-test/tim` (lớp + HV) |
| 45 | modules/test/keHoach/NganXepLichMt.tsx:259 | Xếp lịch Mock Test → Lọc "+ lớp" | Lớp FT | nhiều (chip) | ChonLop `noi` | **Lớp FT chi nhánh đang xem** | `/ke-hoach-test/lop?branchId` | có một phần: `/ke-hoach-test/tim` |
| 46 | modules/test/keHoach/XepTheoHocVien.tsx:309 | Xếp lịch Mock Test → Theo học viên → "+ lớp" | Lớp FT | nhiều (chip) | ChonLop `noi` | **như #45** | `/ke-hoach-test/lop` (prop) | có một phần: `/ke-hoach-test/tim` |
| 47 | modules/worklist/MgmtTasksPage.tsx:756 | Giao việc (giao GV) → Lớp | Lớp | một | ChonLop | **Lớp người nhận dạy → Chi nhánh** | `GET /classes` (bảng tóm tắt ĐẦY ĐỦ mọi lớp, nặng) | có: `/classes?q` (mã lớp + tên em) |

#### C. `<select>` chọn người / lớp / em — CẦN THAY (9)

| # | tệp:dòng | màn / hộp | chọn gì | 1 / n | hiện tại | nhóm liên quan trước (đề xuất) | nguồn dữ liệu | máy chủ có đường tìm |
|---|---|---|---|---|---|---|---|---|
| 48 | modules/classes/TabBaoCaoPh.tsx:416 | Báo cáo PH · viết (điện thoại) | Em đang viết ("Em n · tên ✓") | một (đi tới em) | `<select>` + nút ‹ › | **Em chưa viết xong → Đã xong (giữ ‹ ›)** | `/classes/:id/bao-cao-ph/phan` (`em`) | không cần (đã nạp) |
| 49 | modules/congViec/PanelChamSpeaking.tsx:84 | Chấm Speaking → "Mọi lớp (n)" | Lớp (lọc) | một | `<select>` | **theo mã lớp mặc định (lời 17 ý 1) — chỉ thêm tìm** | `/my-work/cham-speaking` (lớp suy từ dòng) | chưa |
| 50 | modules/duyet/HopChoDuyet.tsx:267 | Chờ duyệt → lọc "Lớp" | Lớp (lọc) | một | `<select>` dáng nút lọc | **Lớp có thẻ đang chờ (một nhóm)** | `/yeu-cau?…` (lớp suy từ dòng + `lopDangLoc`) | chưa |
| 51 | modules/phanTich/PhanTich.tsx:139 | Phân tích → "Mọi lớp ▾" (+ nhóm "Đã kết thúc") | Lớp (lọc) | một | `OChon` (select bọc, phanTich/dungChung.tsx:50) | **Lớp đang chạy → Đã kết thúc (nhóm đang có)** | `/ref/classes?branchId&tg/khoảng` | chưa |
| 52 | modules/platform/NhatKyChung.tsx:59 | Quản trị → Nhật ký chung → "Người" | Người (lọc) | một | `ChonDangNut` (select bọc, ui/ui.tsx:596) | **Người có trong nhật ký đang xem** | `/admin/nhat-ky` (`nguoi`) | chưa |
| 53 | modules/students/GocLichThi.tsx:239 | Học viên & Lớp → Lịch thi → "Mọi TVV" | TVV (lọc, theo TÊN chữ) | một | `<select>` SELECT_GON | **Tôi (khi là TVV) → TVV chi nhánh** | `/hoc-vien-lop/lich-thi` (suy từ dòng) | chưa |
| 54 | modules/students/StudentsPage.tsx:388 | Học viên & Lớp → "Mọi lớp" | Lớp (lọc) | một | `<select>` SELECT_GON | **Lớp của tôi → Chi nhánh** | `/hoc-vien-lop` (`rows`) | có: `/hoc-vien-lop?q` (ô Tìm cạnh đó) |
| 55 | modules/tutor/HopTutor.tsx:147 | Trang Tutor → Gộp tên gõ tay → "Gộp vào" | Tutor | một mỗi tên | `<select>` + "+ Thêm vào danh sách" | **Tutor tên gần giống → Khác** | danh sách tutor của trang (`/tutors`) | có nhưng không hợp: `/tutors/chon` buộc `paId` / `classId` / `studentId` |
| 56 | modules/yThuc/TinhHinh.tsx:202 | Thẻ Ý thức lớp → Báo / Hỏi tình hình → "+ Chọn em" | Em | nhiều (thêm chip, ≤ 8; Hỏi = 1) | `<select>` | **Lớp này → Lớp khác của tôi (≤ 8)** | `/classes/:id/y-thuc` (`emLop`) | có: `/classes/:id/roster?q` (chưa dùng) |

#### D. Ô gợi ý / danh sách chọn tự viết (7)

| # | tệp:dòng | màn / hộp | chọn gì | 1 / n | hiện tại | nhóm liên quan trước (đề xuất) | nguồn dữ liệu | máy chủ có đường tìm |
|---|---|---|---|---|---|---|---|---|
| 57 | modules/platform/Header.tsx:204 | Thanh trên → Tìm (/, Ctrl K) | Em, lớp, GV → mở hồ sơ | một | combobox tự viết (≥ 2 ký tự) | **Em → Lớp → GV (ô tìm toàn cục, cùng dáng nhóm)** | `/students?q` (web cắt 6) + `/tim/giao-vien?q` + `/ref/classes` lọc tại chỗ (cắt 4) | có: `/students`, `/tim/giao-vien`; lớp: chưa |
| 58 | modules/test/keHoach/TimKeHoach.tsx:58 (gọi ở test/KeHoachTestTab.tsx:175, :192) | Kế hoạch Test → "Tìm lớp, học viên hoặc email" | Lớp hoặc em → mở | một | combobox tự viết, trễ 200 ms | **Lớp → Học viên** | `/ke-hoach-test/tim?q&branchId` | có: `/ke-hoach-test/tim` |
| 59 | modules/test/keHoach/TimLop.tsx:35 → test/keHoach/NganXuatKeHoach.tsx:86 | Xuất kế hoạch → "Thu hẹp: tìm lớp FT…" | Lớp | một | combobox tự viết, lọc web (8) | **Lớp FT chi nhánh đang xem** | `/ke-hoach-test/lop` | chưa (lọc web) |
| 60 | modules/test/keHoach/TimLop.tsx:35 → test/NganXuatMt.tsx:196 | Xuất MT → "Tìm lớp… (trống = mọi lớp)" | Lớp | một | như trên | **như #59** | `/ke-hoach-test/lop` | chưa |
| 61 | modules/yThuc/RecordViolationPanel.tsx:354 (ô gõ :377; gọi :243) | Ghi vi phạm (mở từ thẻ Ý thức lớp) → Học viên | Em | nhiều (≤ TOI_DA_EM_GHI_VI_PHAM, "Cả lớp") | nút ▾ + ô gõ + danh sách tick tự viết | **Lớp này (+ Cả lớp) → Lớp khác của tôi** | `/classes/:id/roster` (ClassYThucCard:50) | có: `/classes/:id/roster?q` |
| 62 | modules/test/keHoach/XepTheoHocVien.tsx:322 | Xếp lịch Mock Test → Theo học viên → tìm + tick 1–3 em | Em | nhiều (≤ 3) | ô tìm + danh sách tick + chip lọc | **Lớp đã chọn (một nhóm mỗi lớp)** | `/ke-hoach-test/ft/:id` (mỗi lớp đã chọn) | chưa |
| 63 | modules/classes/banGiaoChung.tsx:36 `DsEmBanGiao` (gọi ở classes/BanGiaoGvPanel.tsx:142, classes/BanGiaoPanel.tsx:190) | Bàn giao → "Học viên cần bàn giao" | Em đang xem | một (đi tới em) | listbox tự viết ↑ ↓ | **Em còn thiếu → Đã xong (giữ ↑ ↓)** | `/ban-giao-gv/:id`, `/lenh-chuyen/…/ban-giao` | không cần |

Ghi chú bảng chính:
- Dòng 48 và 63 là danh sách ĐI TỚI em trong panel (master–detail), không phải ô nhập: nếu thay bằng ô tìm thì giữ ‹ › / ↑ ↓.
- Dòng 3, 5, 10, 11, 13, 17–19, 32–43 cố ý dùng danh sách có sẵn của nơi gọi (quyền, chi nhánh, luật lớp đích) — `ChonNguoi ds` / `ChonLop ds` lọc tại chỗ, không gọi máy chủ. Giữ; chỉ thêm nhóm.
- **Giữ, không thay** (không phải ô chọn người / lớp): danh sách tick em trong một lớp đã nạp (`classes/CuoiKhoaLop.tsx:489, :568, :737, :776` · `students/ChuyenLopPanel.tsx:62, :321, :554` · `classes/PanelXetLai.tsx:288` · `test/keHoach/NganXepHangLoat.tsx:233` · `test/keHoach/NganXepLichMt.tsx:326` · ô tick hàng loạt `OChon` ở `classes/BangDiemLopThuong.tsx:186`, `classes/BangHoSoLop.tsx:169, :203`, `students/LuuTruPage.tsx:240`, `yThuc/ClassYThucCard.tsx:209`); ô tìm LỌC bảng (`students/StudentsPage.tsx:380`, `students/LuuTruPage.tsx:174`, `students/GocPhanCongGv.tsx:309`, `yThuc/ClassYThucCard.tsx:482`, `phanTich/PhanTichGiaoVien.tsx:243`, `platform/AccountsAdmin.tsx:145`, `tutor/TutorPage.tsx:121`, `congViec/PanelChamSpeaking.tsx:82`); chọn chương trình / lộ trình (4 chỗ, vài mục: `classes/LuoiTaoLop.tsx:318, :327`, `classes/ThongTinLopPanel.tsx:187`, `students/IntakePanel.tsx:311`).
- **Ranh giới (R5.1):** danh sách ngắn cố định ≤ 7 mục, không phải người / lớp → GIỮ chip chọn (`.nut-chon`) hoặc ô chọn thường (A6). 47 `<select>` cố định đã kê (Phụ 3 của bản rà): chi nhánh, vai trò, loại PA, nhóm nguyên nhân, nhóm vi phạm, môn, hạn, tuần, xếp theo, trạng thái… — giữ. Chi nhánh (`OChiNhanh`, 20 nơi) ngoài phạm vi.

**Đường tìm ở máy chủ đang có** (`server/src/routes/index.ts`): `GET /ref/nguoi` (`q`, `nhom` giao_vien · nhan_vien · gv_speaking, `studentId`, `cungChiNhanh`, `chiNhanh`; chưa gõ 20, có gõ 12; đã trả `cungLop`, `monDay`) · `/tutors/chon` (≤ 20, cần `paId` / `classId` / `studentId`) · `/tim/giao-vien` (≥ 2 ký tự, 4 dòng) · `/classes/:id/roster?q` (một lớp; web chưa dùng `q`) · `/ke-hoach-test/tim` (lớp + HV ≤ 8 mỗi loại) · `/students?q` (không LIMIT, mỗi dòng thêm 3 câu con) · `/classes?q` (nặng). **Chưa có** đường tìm lớp theo mã dùng chung (`/ref/classes` không có `q`).

**Cảnh báo dòng đọc Turso (chủ SP 30/10, 06/11) — cho PR thay:**
1. Dòng 12 `ChonPhuTrach`: tải cả `/ref/users` chỉ để tra một tên từ `?nguoi=`.
2. Dòng 38 `ChuyenLopPanel:552`: một GET `/chuyen-lop/lop-dich` cho MỖI em.
3. Dòng 47 `MgmtTasksPage:756`: `GET /classes` đầy đủ chỉ để lấy mã lớp + sĩ số.
4. Dòng 57 ô tìm thanh trên: `/students?q` không LIMIT (mỗi dòng 3 câu con), web mới cắt còn 6.
Đề xuất cho PR: thêm `LIMIT` ở máy chủ cho 4 đường trên; nhóm "liên quan trước" tính từ dữ liệu đã trả (không thêm request khi mở trang); đo trước → sau ở `tocDoDuong.ts`.

## 2. Bảng câu dòng quy chế (R5.5) — GV · GVCN · TVV · QL (+ Admin)

Soạn từ mục "Người làm cần thấy gì" + bảng "Việc sinh ra" của `luat/1`–`4` và lời 12–20; KHÔNG thêm luật. 83 câu, mỗi câu ≤ 90 ký tự (dài nhất 66). `{…}` = máy điền (ngày, tên, số). Câu đổi theo lựa chọn đang chọn (cột "Biến thể"). Đặt câu ở `shared/` cạnh hàm luật, không viết tay từng nơi (04 mục 5.3). Việc "Báo cáo PH" nằm trong tab Vận hành (lời 20); hạn lớp thường = thứ Ba tuần sau tuần Test (lời 14).

| # | Vai | Việc | Biến thể | Dòng quy chế | Ký tự | Nguồn |
|---|---|---|---|---|---|---|
| Q1 | GV | Nhập điểm Mock Test (L, R, W1, W2) | mặc định | "-" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ | 47 | luat/1 T-17 |
| Q2 | GV | Nhập điểm Mock Test (L, R, W1, W2) | đã quá hạn | Quá hạn từ {24/09}, vẫn nhập được · "-" = vắng, lần 2 huỷ | 55 | luat/1 T-15, T-17 |
| Q3 | GV | Nhập điểm Mock Test (L, R, W1, W2) | ô Writing | "-" ở một task = vắng cả Writing · Writing = (W1 + 2×W2) / 3 | 60 | luat/1 T-18, T-11 |
| Q4 | GV | Nhập điểm Mock Test (L, R, W1, W2) | band dưới kỳ vọng (MT mới nhất) | Dưới kỳ vọng: nhận xét + nhóm nguyên nhân thành mô tả Case | 58 | luat/1 T-13; luat/2 C-08 |
| Q5 | GV | Nhập điểm Mock Test (L, R, W1, W2) | tuần Test cách ≥ 2 tuần | "-" lúc này = Không dự thi, không dời | 37 | luat/1 T-17 |
| Q6 | GV | Nhập điểm Mock Test (L, R, W1, W2) | chưa tới tuần Test | Chưa tới tuần Test {W4 SEP} · em làm sớm thì nhờ QL dời lịch | 58 | luat/1 T-14, mục 4 |
| Q7 | GV | Nhập điểm Progress / Final (lớp thường) | mặc định | Đạt từ 70 % · "-" = vắng: dời sang tuần sau, không huỷ | 54 | luat/1 T-10, T-17 |
| Q8 | GV | Nhập điểm Progress / Final (lớp thường) | Progress môn dưới 70 % | Dưới 70 %: lưu xong có Case + PA Bổ trợ, bạn xác nhận trong 5 ngày | 66 | luat/2 C-06, việc cause |
| Q9 | GV | Nhập điểm MT0 (L, R, W) | mặc định | MT0: "-" chỉ ghi dấu, không dời · hết tuần thành Không dự thi | 61 | luat/1 mục 4 ("-" MT0) |
| Q10 | GV Speaking | Chấm Speaking (việc chung) | mặc định | Việc chung của nhóm GV Speaking · GV chấm mặc định là bạn | 57 | luat/1 T-09, mục 4; 04 mục 5.5 |
| Q11 | GV Speaking | Chấm Speaking (việc chung) | có nhận xét, bạn không phụ trách S lớp này | Có nhận xét: GV Speaking của lớp {Lê Quang Vinh} xác nhận Case | 60 | luat/1 mục 2 (score cc); luat/2 C-08 |
| Q12 | QL · Admin | Chấm Speaking — nhập hộ | người nhập không phải GV Speaking | Bạn nhập hộ: chọn GV chấm trước khi lưu | 39 | 04 mục 5.10 S4 (2.4) |
| Q13 | GV | Mô tả Case | mặc định | Hạn {19/09} (5 ngày; SOS 3: 3) · lưu xong bạn xác nhận PA | 55 | luat/2 C-10, mục 2–3 |
| Q14 | GV | Xác nhận PA | Xác nhận (mặc định) | PA quy chế chạy từ hôm nay · ghi kết quả 2 tuần một lần | 55 | luat/2 C-11, C-14, mục 4 |
| Q15 | GV | Xác nhận PA | Không cần theo dõi | Không cần theo dõi: QL duyệt trong 5 ngày · duyệt thì Case đóng | 63 | luat/2 C-19, mục 4 |
| Q16 | GV | Chọn PA (GV đã có PA khác loại) | Theo PA quy chế (mặc định) | PA của bạn dừng, kết quả giữ | 28 | luat/2 C-13, mục 4 |
| Q17 | GV | Chọn PA (GV đã có PA khác loại) | Giữ PA của tôi | QL duyệt trong 3 ngày · quá hạn theo bạn | 40 | luat/2 C-13; luat/4 mục 4 (giu_pa_gv) |
| Q18 | GV | Thêm PA (Case tay) | loại GV tự làm | Hạn {19/09} (5 ngày; Gấp: 3) · lưu xong PA chạy | 45 | luat/2 C-10, C-12, việc no_plan |
| Q19 | GV | Thêm PA (Case tay) | Hỗ trợ học thuật · Khác | Loại này cần QL duyệt · QL nhận thẻ khi bạn lưu | 47 | luat/2 C-12, việc no_plan |
| Q20 | GV | Ghi kết quả PA | Giữ nguyên (mặc định) | Kỳ 2 tuần · hạn thứ Ba {22/09} · Lưu là chốt, đổi bằng Sửa | 56 | luat/2 C-14, C-16 |
| Q21 | GV | Ghi kết quả PA | Điều chỉnh · Thay PA | Điều chỉnh / Thay PA cần lý do | 30 | luat/2 mục 4 (Ghi kết quả PA) |
| Q22 | GV | Ghi kết quả PA | Kết thúc PA | Chỉ kết thúc khi Tiến bộ rõ hoặc Tiến bộ một phần | 49 | luat/2 C-15, mục 4 |
| Q23 | GV | Ghi kết quả PA | Xin hỗ trợ QL | Xin hỗ trợ QL: PA vẫn chạy · QL nhận thẻ | 40 | luat/2 C-15, mục 3 |
| Q24 | GV | Ghi kết quả PA | PA quy chế | PA quy chế: không thay, không kết thúc sớm | 42 | luat/2 C-15 |
| Q25 | GV | Ghi kết quả PA | kỳ cuối (chạm mốc / đạt ở MT sau) | Kết quả cuối: lưu xong PA khép | 30 | luat/2 C-17, mục 4 |
| Q26 | GV (người dạy bổ trợ) | Ghi Mini Test | mặc định | Từ 70 %: Case tự hoàn thành · dưới 70 %: QL quyết | 49 | luat/2 C-20, việc mini_test |
| Q27 | GV | Xác nhận Case (Progress môn < 70 %) | mặc định | Hạn {19/09} (5 ngày) · PA Bổ trợ đã chạy · quá hạn báo QL | 55 | luat/2 việc cause |
| Q28 | GV phụ trách S | Xác nhận Case Speaking | Dùng nhận xét người chấm (mặc định) | Nhận xét của {Hà Minh Ngọc} thành mô tả Case | 42 | luat/2 C-08, việc xem_nx_s |
| Q29 | GV phụ trách S | Xác nhận Case Speaking | Viết khác | Viết khác: tối thiểu 10 ký tự · thay nhận xét người chấm | 56 | luat/2 việc xem_nx_s; mục 6.7 |
| Q30 | GV | Hoàn thành Case | mặc định | Kết luận tối thiểu 8 ký tự · mở lại được | 40 | luat/2 C-18 |
| Q31 | GV | Hoàn thành Case | còn PA đang chạy | Còn {1} PA đang chạy: PA dừng khi bạn hoàn thành Case | 51 | luat/2 C-18, mục 4 |
| Q32 | GV | + Task › Case | mặc định | Mô tả 8–300 ký tự · lưu xong bạn thêm PA trong 5 ngày | 53 | luat/2 C-09, C-10 |
| Q33 | GV | + Task › Case | mức Gấp | Gấp: hạn thêm PA 3 ngày | 23 | luat/2 C-10 |
| Q34 | GV | + Task › Vi phạm / Nhắc nhở | Vi phạm (mặc định) | GVCN nhận việc xem · đủ 3 trong 2 tuần thì phải xử lý | 53 | luat/3 Y-04, Y-05, mục 4 |
| Q35 | GV | + Task › Vi phạm / Nhắc nhở | Chỉ nhắc nhở | Không tính vào bậc, không sinh việc | 35 | luat/3 Y-03 |
| Q36 | GV | + Task › Tình hình học tập | mặc định | TVV báo PH trong 5 ngày · kết quả về chuông của bạn | 51 | luat/3 Y-17, vòng đời (b) |
| Q37 | GV | Viết Báo cáo PH (tab Vận hành) | FT | Tháng {9} · hạn 30/{09} · bạn viết phần mình cho mọi em | 51 | luat/3 Y-21; lời 12, 20 |
| Q38 | GV | Viết Báo cáo PH (tab Vận hành) | lớp thường | {Progress W3 SEP} · hạn thứ Ba tuần sau ({22/09}) | 45 | lời 13, 14; luat/3 Y-21 |
| Q39 | GVCN | Viết Báo cáo PH (tab Vận hành) | GVCN | Bạn viết phần Chung · GV kỹ năng viết phần môn mình | 51 | luat/3 Y-21; lời 16 ý 1 |
| Q40 | GV | Viết Báo cáo PH (tab Vận hành) | quá hạn | Quá hạn vẫn viết được · việc rời sau 7 ngày | 43 | lời 16 ý 1; 04 mục 11.5 |
| Q41 | GV | Bàn giao môn (chuyển lớp) | mặc định | Một câu mỗi em · hạn {20/09} · quá hạn em vẫn chuyển | 50 | luat/4 L-17 |
| Q42 | GV cũ | Bàn giao (đổi GV) | mặc định | Hạn 5 ngày · xác nhận xong GV mới nhận tin | 42 | luat/4 L-18, việc ban_giao đổi GV |
| Q43 | GV | Việc được giao (Vận hành) | mặc định | Hạn do QL đặt · ghi Hoàn thành khi xong | 39 | luat/4 việc mgmt |
| Q44 | GVCN | Xem vi phạm mới | mặc định | Đã xem vẫn đếm · đủ 3 trong 2 tuần thì phải xử lý | 49 | luat/3 Y-04, Y-05 |
| Q45 | GVCN | Xác nhận xử lý | Nâng 1 bậc (mặc định) | Nâng 1 bậc: xong ngay · TVV {Đặng Hải Yến} báo PH, hạn {18/09} | 58 | luat/3 Y-07, Y-08, Y-14 |
| Q46 | GVCN | Xác nhận xử lý | Không nâng · Vượt bậc | Gửi QL duyệt 5 ngày · hết hạn giữ cách của bạn · TVV chưa có việc | 65 | luat/3 Y-08, Y-09 |
| Q47 | GVCN | Xác nhận xử lý | Ngoài thang | Ngoài thang: cần tệp bằng chứng · QL duyệt 5 ngày | 49 | luat/3 Y-06, Y-10 |
| Q48 | GVCN | Ghi "Đã thực hiện" | mặc định | Lưu xong bậc {WARNING LETTER 1} mới được tính | 43 | luat/3 mục 2 (a), mục 6.6 |
| Q49 | GVCN | Ghi "Đã thực hiện" | Meeting, PH dự | PH dự Meeting: TVV khỏi báo PH | 30 | luat/3 mục 2 (a), mục 4 |
| Q50 | GVCN | Thu hồi xử lý | mặc định | Gửi QL duyệt · bậc tính lại · TVV đã báo thì nhờ báo lại PH | 59 | luat/3 Y-11 |
| Q51 | GVCN | Xác nhận cấp bậc HV cũ | mặc định | Khai một lần cho chuỗi này · quá 14 ngày việc tự hết | 52 | luat/3 Y-12, việc khai_bac |
| Q52 | GVCN | Tình hình học tập (TVV hỏi) | mặc định | Hạn {16/09} (3 ngày) · lưu xong TVV nhận chuông | 45 | luat/3 Y-18 |
| Q53 | GVCN | Phối hợp SOS | Xác nhận (mặc định) | Ghi ngày làm + nội dung · em rời dòng | 37 | luat/2 C-21, mục 4 |
| Q54 | GVCN | Phối hợp SOS | Meeting CX/GĐCN | Meeting: hạn {18/09} · xác nhận xong TVV nhận việc báo PH | 55 | luat/2 C-21; luat/3 Y-19 |
| Q55 | GVCN | Phối hợp SOS | Bỏ | Bỏ: chọn lý do · em rời dòng | 28 | luat/2 mục 4 |
| Q56 | GVCN | Báo PH kết quả Test (lớp thường) | mặc định | Không hạn · đánh dấu khi đã báo PH | 34 | luat/3 Y-20 |
| Q57 | GVCN | Bàn giao n em (chuyển lớp) | mặc định | Nhận xét chung + Xác nhận · hạn {20/09} · quá hạn em vẫn chuyển | 61 | luat/4 L-17 |
| Q58 | GVCN | Nhập điểm MT cũ | mặc định | MT cũ: không hạn · MT trong 4 tuần gần đây vẫn sinh Case | 56 | luat/1 T-20, việc lich-su |
| Q59 | GVCN | Đề xuất chuyển lớp | mặc định | QL lớp nguồn quyết định · duyệt xong bạn nhận việc bàn giao | 59 | luat/4 L-15, L-17 |
| Q60 | TVV | Báo PH (vi phạm · tình hình) | Đã báo PH (mặc định) | Hạn {18/09} · GV của lớp đọc được nội dung | 40 | luat/3 Y-14, Y-15 |
| Q61 | TVV | Báo PH (vi phạm · tình hình) | Chưa liên hệ được | Chưa liên hệ được: việc còn mở · thử lại trước {18/09} | 52 | luat/3 Y-15; mục 6.3 |
| Q62 | TVV | Báo PH · Meeting CX/GĐCN | mặc định | Hạn {18/09} (5 ngày từ ngày GVCN xác nhận) · GV đọc được nội dung | 63 | luat/2 việc phoi_hop_tvv |
| Q63 | TVV | + Task › Hỏi tình hình học tập | mặc định | GVCN trả lời trong 3 ngày · kết quả về chuông của bạn | 53 | luat/3 Y-18 |
| Q64 | TVV | Chốt ngày thi | mặc định | Không hạn · lưu xong lịch thi thành Đã chốt ngày | 48 | luat/4 L-19; luat/3 mục 3 |
| Q65 | TVV | Cập nhật kết quả thi thật | mặc định | Đủ 4 kỹ năng hoặc Không thi · lưu xong bạn chọn Bước tiếp | 57 | luat/3 mục 3 (thi_that); luat/4 L-20 |
| Q66 | TVV | Chọn bước tiếp | Lộ trình mới | Lộ trình mới: Target giữ, đầu vào = KQ thi thật, Case cũ đóng | 61 | luat/4 L-21 |
| Q67 | TVV | Chọn bước tiếp | Tạm dừng / Kết thúc học | Em vào Lưu trữ · hạn {21/10} | 26 | luat/4 L-09, L-21; luat/3 mục 3 |
| Q68 | TVV | Bổ sung hồ sơ thiếu | mặc định | Không hạn · đủ Ngày sinh, Email, Tuần bắt đầu, Target là xong | 61 | luat/3 mục 3 (bo_sung_ho_so) |
| Q69 | QL | Duyệt Xử lý Ý thức | mặc định | Còn {3} ngày · hết hạn máy chốt theo GVCN · từ chối cần lý do | 59 | luat/3 Y-09; luat/4 L-25 |
| Q70 | QL | Duyệt PA khác quy chế | mặc định | Còn {2} ngày · quá hạn máy chốt theo PA của GV | 44 | luat/4 mục 4 (giu_pa_gv); luat/2 C-13 |
| Q71 | QL | Duyệt thẻ khác (Đề xuất PA, Không cần theo dõi, Xin xoá, Đề xuất sửa) | mặc định | Hạn 5 ngày · quá hạn vẫn chờ · từ chối cần lý do | 48 | luat/4 mục 4, L-25 |
| Q72 | QL | Duyệt thu hồi xử lý | mặc định | Không tự chốt · duyệt thì bậc tính lại | 38 | luat/3 mục 3 (thu_hoi_y_thuc) |
| Q73 | QL | Duyệt đề xuất chuyển lớp | mặc định | Duyệt = mở Chuyển lớp điền sẵn | 30 | luat/4 mục 4 |
| Q74 | QL | Chốt lộ trình (Cuối khoá) | theo gợi ý (mặc định) | Hạn thứ Năm {01/10} · Thứ Hai sau máy tự chuyển lớp | 49 | luat/4 L-12, việc chot_len_ft |
| Q75 | QL | Chốt lộ trình (Cuối khoá) | chọn khác gợi ý | Khác gợi ý: cần lý do | 21 | luat/4 mục 5 |
| Q76 | QL | Xét lại lộ trình | mặc định | Không làm gì = Tiếp tục · Tiếp tục khi Final < 50 cần lý do | 59 | luat/4 L-14, mục 5 |
| Q77 | QL | Kỳ vọng đầu ra | Không đạt do Trung tâm | Do Trung tâm: Case + Tutor 10 buổi mỗi kỹ năng cho GV lớp FT | 60 | luat/4 L-13 |
| Q78 | QL | Chuyển lớp một em | mặc định | Bắt đầu Thứ Hai tuần sau · Case, PA mở sang GV lớp mới | 54 | luat/4 L-15, mục 5; luat/2 C-07 |
| Q79 | QL | Chuyển lớp một em | Ngay hôm nay | Ngay hôm nay: em sang lớp mới từ hôm nay | 40 | luat/4 L-15 |
| Q80 | QL | Xếp lịch MTn (PA chờ mốc) | mặc định | Chưa có lịch thì PA chưa có mốc kết quả cuối · Bỏ qua được | 58 | luat/1 mục 2 (moc); luat/4 mục 3 |
| Q81 | QL | Phân công GV (Case chưa có người phụ trách) | mặc định | Phân công xong, Case về người đó | 32 | luat/2 việc no_owner |
| Q82 | QL · Admin | Nhập hộ điểm | trước tuần Test | Bạn nhập hộ · trước tuần Test: hỏi dời về tuần này rồi lưu | 58 | luat/1 T-08, T-14 |
| Q83 | Admin | Xuất báo cáo PH | mặc định | Lớp đủ báo cáo · việc tự rời sau 7 ngày | 39 | luat/3 mục 3 (xuat_bc_ph) |

## 3. R5.9 — một dáng cho mỗi loại: chọn dáng nào, bỏ dáng nào ở tệp nào

| Loại | Chọn (một dáng) | Bỏ / đổi về dáng chọn — tệp |
|---|---|---|
| Thanh tab | Tab hạng mục v17 ở Công việc (`congViec/DanhSachViec.tsx:138`, mockup ① `.tabs .tab .bd`): chữ 14 / 600, gạch dưới 2 px màu nhấn, badge viên tròn — đỏ = quá hạn, vàng = hôm nay, mờ = chỉ đếm; tab con trong khối / panel dùng đúng dáng này (bỏ lề âm). Một thành phần = `ui/HangTab.tsx` nâng theo dáng này (H1) | Biến thể của `HangTab`: `v8` (15 px, cao 42 — `classes/ClassOverviewPage.tsx`, `students/StudentsPage.tsx`) · `soMo` (viên mờ — `cases/QuickReport.tsx`, `classes/DaiChuyenLop.tsx`, `students/HanhTrinhKyNang.tsx`, `students/phanCongGv/BangLopPc.tsx`, `students/StudentsPage.tsx`, `test/keHoach/XepTheoHocVien.tsx`, `tutor/TaiDanhSach.tsx`, `yThuc/LoYThucPanel.tsx`, `ui/KetQuaDot.tsx` → thành badge "mờ" của dáng chung) · `cap="con"` chữ 12 (`cases/QuickReport.tsx`, `worklist/Highlights.tsx`). Tablist tự viết → `HangTab`: `cham/DiemTheoLop.tsx:180`, `congViec/DanhSachViec.tsx:138` (dáng gốc, chuyển vào `HangTab`), `huongDan/NutHuongDan.tsx:73`, `yThuc/BangLan.tsx:404`, `ui/BangLuotPanel.tsx:516, :535`, `ui/SoLieu.tsx:540` |
| Menu thả | `.menu-tha` v21 (mockup ① menu "+ Task", ⋯ hộp nhập): nền surface, viền line-strong, bo 10, bóng; mục 14 / 500; nhãn nhóm 12 / 600; ngăn `hr`; mục nguy hiểm chữ đỏ; mục tắt ghi lý do ngay dưới (H2). Một thành phần = `ui/MenuDong.tsx` (22 nơi) | `ui/Menu.tsx` (5 nơi: `fasttrack/MockDetailPage.tsx`, `students/StudentDetailPage.tsx`, `test/keHoach/LuoiKeHoach.tsx`, `yThuc/ClassYThucCard.tsx`, `ui/ThanhTruocSau.tsx`) gộp vào `MenuDong` · `role="menu"` tự viết: `congViec/ChonPhuTrach.tsx:90`, `yThuc/BangPhoiHop.tsx:270` |
| Dải chỉ số | Một hàng mỏng cao 44, viền line, mỗi ô "nhãn + ô số `OSo`" (số gạch chân màu nhấn, bấm → panel chỉ đọc; 0 không bấm; xấu có ⚠); 375 lưới 2 cột (H3) | Khối / ô số to → dải: `worklist/TongQuanV5.tsx` (5 chỉ số TVV — R4.2), `classes/DauTrangLop.tsx` (Lượt mới nhất · Đạt MT · SOS — R2.1), `test/lichTest/DaiSo.tsx`, `worklist/LamDongSoLieu.tsx`, `giaoVien/HoSoGiaoVienPage.tsx`, `yThuc/PhoiHopSosSection.tsx` / `yThuc/BangPhoiHop.tsx` (dòng đếm). Phân tích (`phanTich/*`: biểu đồ, bảng "Toàn bộ") giữ — không phải dải chỉ số [XM-11] |
| Kiểu lịch sử | `ui/LichSuThayDoi.tsx` (9 nơi): gập "Lịch sử · n" → dòng giờ · người · việc · cũ → mới · Khôi phục (H4) | Lịch sử tự viết → `LichSuThayDoi`: `cham/NganLichSuBai.tsx` (+ `cham/LuoiThuong.tsx`), `fasttrack/DongThoiGianLuot.tsx` (+ `fasttrack/LuotThuongPage.tsx`, `fasttrack/MockDetailPage.tsx`), lịch sử ô ở `fasttrack/HopNhapDiem.tsx`, `test/keHoach/HopKyNang.tsx`, "các lần thử" ở `congViec/PanelBaoPhTvv.tsx`. Giữ riêng: `students/HanhTrinh.tsx` (hành trình lộ trình, không phải lịch sử sửa) [XM-12]; `platform/NhatKyChung.tsx` là TRANG nhật ký — dòng dùng cùng dáng |

## 4. Bảng truy vết khung → thành phần → luật / việc → TRƯỚC → SAU

| Khung | Thành phần | Phục vụ | Trước (web / mockup) | Sau (v21 ⑤) | Loại |
|---|---|---|---|---|---|
| A1–A7 | Ô chọn có tìm (một / nhiều, nhóm liên quan, dòng phụ, tô khớp, phím, rỗng, tải, lỗi, tắt, 375 toàn màn) | lời 17 ý 5; 04 mục 12 (5.11) | `ChonNguoi` / `ChonLop` (47 chỗ, chưa nhóm, chưa chip nhiều), 9 `<select>`, 7 ô tự viết, ① K5b `.goi-y` | MỘT thành phần cho 63 chỗ; nhóm có nhãn + số; chip + "n / 8"; 375 toàn màn | ĐỔI / GỘP |
| A6 | Ranh giới danh sách ngắn | lời 17 (PTA hiểu b) | chip / ô chọn thường | GIỮ (≤ 7 mục, không phải người / lớp) | GIỮ |
| B1–B3 | Dòng việc: lớp × tuần · một em · gộp "n em ▾" (mở ▴) · việc chung · đổi trang "›" · quá hạn / hôm nay / còn hạn / không hạn · chọn · rê · focus · tải / hết / lỗi | 04 mục 5.3; N39; lời 11, 20 | v12 / v18 + ① | cùng dáng ①; thêm "hôm nay", "không hạn", focus | GIỮ + THÊM trạng thái |
| C1–C2 | Nút-chip "Việc cần làm" | lời 17 ý 2; lời 20 ý 2; 04 mục 13 | ① `.vc` có biểu tượng | không biểu tượng; thứ tự Nhập điểm · Case · Ý thức · Vận hành; "›" chỉ khi đổi trang | ĐỔI (lời 20) |
| D1–D4 | Panel việc: đầu · ngữ · thân · dòng quy chế · chân + trạng thái lưu (chưa lưu, đang lưu, đã lưu + Hoàn tác + Việc tiếp, lỗi giữ chữ, nháp, đã chốt + Sửa) · chỉ xem · tải · lỗi · 375 | 04 mục 5.3; lời 5; luat/5 mục 3 | `PanelViec` / `KhungPanel`, ① K2 K4 K5 | một mẫu cho mọi panel việc | GIỮ + THÊM trạng thái |
| D5 | Bảng câu dòng quy chế (83 câu) | lời 5; luat/1–4 | mỗi panel một kiểu, có panel không có | câu trong `shared/`, đổi theo lựa chọn | THÊM |
| E1–E8 | Hộp nhập điểm gọn: FT L/R (câu → band) · W/S tiêu chí · lớp thường đúng / tổng · lỗi · vắng + ⋯ · hỏi "-" vào ô có điểm · đang lưu / đã lưu + Hoàn tác · 375 neo đáy | luat/1 T-10, T-11, T-13, T-17, mục 4; ① K2b | `HopNhapDiem` tới 7 nút một hàng | chân "⋯ · Vắng · Lưu · bài tiếp ›" mọi kỹ năng | ĐỔI (① đã duyệt) |
| F1–F4 | Menu "+ Task" + bước chọn em (ô chọn có tìm) | lời 17 ý 3; luat/3 Y-01, Y-17 | ① K5a–c; nút cũ ở tab Ý thức / hồ sơ | menu chung H2; chọn em = mẫu A; 375 menu neo đáy | GIỮ + ĐỔI ô chọn |
| G1–G4 | Hộp chuông: GIỮ đúng dáng v2 — đầu khối (số = badge) · một dòng mỗi LOẠI việc (tên + "● n mới" · "n việc" · chip quá hạn / hôm nay · ›) · Cập nhật nhẹ ở dưới · bấm một loại → Công việc đúng tab (Báo cáo PH → Vận hành; không có dòng Chấm Speaking) | chuông v2 (chủ SP 11/11); PTA Overhaul sửa R5.8 14/11; lời 20 ý 3, 4 | v2: một dòng mỗi loại → `/cong-viec?loai=…` | giữ dáng; đích bấm = Công việc ĐÚNG tab của loại | GIỮ dáng / ĐỔI đích |
| H1–H4 | Một tab · một menu · một dải chỉ số · một lịch sử | 04 mục 5.9; lời 4 (4) | nhiều dáng (mục 3) | một dáng mỗi loại | GỘP |

## 5. Bảng thao tác TRƯỚC → SAU (mức thành phần)

| Thao tác | Trước | Sau | Ghi chú |
|---|---|---|---|
| Chọn người / lớp / em | gõ trong `ChonNguoi` / `ChonLop`, hoặc cuộn `<select>`, hoặc ô tự viết mỗi nơi một kiểu | gõ (không dấu) hoặc chọn ngay trong nhóm liên quan; ↑ ↓ Enter Esc Tab | mọi tham số đang có của `ChonNguoi` giữ: "Tôi", tên ngoài hệ thống, `choTrong`, Tutor, "+ Mở lớp mới…" |
| Chọn nhiều em (Tình hình ≤ 8, Ghi vi phạm, "Cả lớp") | `<select>` "+ Chọn em" thêm chip (`TinhHinh.tsx:202`); nút ▾ + tick (`RecordViolationPanel`) | ô chọn nhiều: chip + ✕, Backspace, đếm "n / 8", tới trần mục tắt | "Cả lớp" của Ghi vi phạm giữ thành mục đầu nhóm "Lớp này" |
| Đi tới em trong panel (Báo cáo PH 375, Bàn giao) | `<select>` + ‹ › ; listbox ↑ ↓ | giữ ‹ › / ↑ ↓; thêm ô tìm cùng dáng | không mất phím |
| Bấm dòng việc, "n em ▾", Việc tiếp › | Công việc | giữ | |
| Bấm chip Việc cần làm | ① có biểu tượng | không biểu tượng, cùng đích | lời 20 |
| Lưu panel, Hoàn tác, Lưu nháp, Sửa | mỗi panel một chỗ | một chân chung | |
| Nhập một ô: Lưu, Lưu · bài tiếp ›, Vắng, Khôi phục, Bỏ vắng, Lưu · đóng | 7 nút | 2 nút + ⋯ (như ① K2b) | [XM-8] "Lưu" ở lại |
| Bấm một loại việc ở chuông | sang `/cong-viec?loai=…` | sang Công việc, mở đúng tab của loại đó (Nhập điểm → Chấm điểm · Chọn PA, Kết quả PA → Case học thuật · Xử lý vi phạm, Phối hợp SOS → Ý thức & Phối hợp · Viết Báo cáo PH, Bàn giao → Vận hành) | [XM-1] |
| Đánh dấu đã đọc, Xem tất cả Cập nhật | chuông v2 | giữ | |
| Mở ⋯ / menu, chọn mục | `Menu`, `MenuDong`, menu tự viết | một menu | |
| Bấm ô số | `OSo` | giữ, trong dải mỏng | |
| Xem lịch sử, Khôi phục | `LichSuThayDoi` + 6 kiểu tự viết | một kiểu | |

Không thao tác nào bị mất.

## 6. [XM] — chỗ phải tự đoán hoặc đụng quyết định cũ

1. **[XM-1] Chuông — ĐÃ CHỐT (PTA Overhaul 14/11):** giữ đúng dáng chuông v2 chủ SP đã duyệt 11/11 ("Mở chuông tôi chỉ cần thấy công việc cần làm, bao nhiêu việc… gộp số công việc vào cho đỡ bị rối"): khối Việc cần làm một dòng mỗi LOẠI việc + số, khối Cập nhật nhẹ ở dưới. Chỉ đổi hành vi bấm: một loại → trang Công việc đúng tab (G1 → G2). Bản "dòng việc chuẩn + mở panel tại chỗ" của lượt đầu đã BỎ. Không có dòng Chấm Speaking (việc chung không đếm, như v2). Thêm loại mới "Viết Báo cáo PH" (S1) → tab Vận hành. Turso: dùng `/my-work` đã nạp, 0 request thêm.
2. **[XM-2] Nút-chip "›"** — 04 mục 13 đưa Báo cáo PH vào chip "Vận hành" ở "Lớp của tôi" → ở trang đầu không còn chip đổi trang. Biến thể "›" giữ cho chỗ khác (ví dụ hồ sơ HV: "Báo cáo PH · còn 1 em ›" sang tab Báo cáo PH hồ sơ lớp) — mockup ③ quyết.
3. **[XM-3] Nhóm "Khác" khi chọn em** — đề bài ví dụ "Lớp này → Lớp của tôi → Khác". GV chỉ ghi / báo cho em lớp mình dạy (luat/3 Y-01, Y-17) → GV không có nhóm "Khác"; QL có "Khác · chi nhánh" (A5).
4. **[XM-4] Nhóm "Gần đây"** (người nhận việc, A5) — nhớ người vừa chọn bằng `localStorage` (bọc try/catch, 0 dòng đọc). Đề xuất; bỏ được.
5. **[XM-5] Máy chủ cho nhóm** — `/ref/nguoi` đã trả `cungLop`, `monDay` → đủ "GV của lớp → Cùng chi nhánh → Khác". Lớp: chưa có đường tìm theo mã dùng chung (`/ref/classes` không `q`) → PR thay dùng `ds` đang có, hoặc thêm `q` + `LIMIT`. Bốn chỗ tốn dòng đọc ở mục 1.
6. **[XM-6] Màu badge tab** — ① chỉ có badge đỏ. Tờ mẫu thêm vàng (hôm nay) và mờ (chỉ đếm, thay `soMo`) để một dáng phủ mọi tab.
7. **[XM-7] Biểu tượng trong menu "+ Task"** — lời 20 bỏ biểu tượng ở NÚT-CHIP; menu giữ biểu tượng như ① K5a.
8. **[XM-8] "Lưu" ở lại** của hộp nhập — giữ nguyên [XM-3] của mockup ① (⋯ chỉ có Lưu · đóng, Khôi phục điểm, Bỏ vắng).
9. **[XM-9] Hộp nhập ở 375** neo đáy màn (E8) — đề xuất; chưa đối chiếu web thật ở 375.
10. **[XM-10] Câu Q27 (Xác nhận Case lớp thường)** — luat/2 C-06 "Case + PA Bổ trợ ngay" ↔ bảng việc `cause` "lưu xong PA Bổ trợ chạy". Câu theo C-06 ("PA Bổ trợ đã chạy"); PTA kiểm mã khi code.
11. **[XM-11] Dải chỉ số ở Tổng quan QL / Admin** (`LamDongSoLieu`, ô số lớn) — 04 mục 5.9 nói một dải; đổi sang dải mỏng làm mất "số lớn" của trang QL → hỏi trước khi làm màn đó.
12. **[XM-12] Hành trình** (`students/HanhTrinh.tsx`) không phải lịch sử sửa → giữ dáng riêng.
13. **[XM-13] Tab con** chữ 12 (`cap="con"`) bỏ — tab con cùng cỡ 14, phân biệt bằng chỗ đặt (trong khối).
14. **[XM-14] Chưa gõ** — mỗi nhóm hiện tối đa ~5 mục + "Gõ để tìm thêm"; nhóm xa ("Chi nhánh khác") chỉ hiện khi gõ (đỡ dài, đỡ dòng đọc).

## 7. Tự rà R5.1–R5.9 + luật chung

| R | Đạt / Chưa | Khung |
|---|---|---|
| R5.1 ô chọn có tìm: gõ tìm + danh sách thả | Đạt (chạy thật ở A1) | A1, A2 |
| R5.1 mục liên quan trước, có nhãn nhóm (chuyển lớp · GV · em) | Đạt | A1, A2, A5, F2, F3 |
| R5.1 dòng phụ · tô chữ khớp · phím ↑ ↓ Enter Esc | Đạt | A1, A2, A4 |
| R5.1 chọn một + chọn nhiều (chip ✕, trần 8) | Đạt | A3, A4, A1 (Học viên) |
| R5.1 rỗng "Không thấy '…'" · đang tải · lỗi · tắt | Đạt | A3 |
| R5.1 375 mở toàn màn | Đạt | A7 |
| R5.1 ranh giới danh sách ngắn ghi rõ | Đạt | A6 + mục 1 |
| R5.2 bảng kê đủ (tệp · chọn gì · nhóm đề xuất · đường tìm máy chủ) | Đạt — 63 chỗ + phần giữ | mục 1 |
| R5.3 dòng việc: lớp × tuần · một em · "n em ▾" · việc chung · đổi trang › · quá hạn / hôm nay / còn hạn / không hạn · đang chọn | Đạt (+ rê, focus, tải, hết, lỗi) | B1, B2, B3 |
| R5.4 nút-chip: loại + số, quá hạn ⚠, đổi trang ›, không biểu tượng | Đạt | C1, C2 |
| R5.5 panel: khung · đầu · thân · dòng quy chế · chân (chính · phụ · Việc tiếp › · trạng thái lưu) | Đạt | D1a, D1b, D2, D3, D4 |
| R5.5 bảng câu GV · GVCN · TVV · QL, ≤ 90 ký tự, có biến thể, ghi nguồn | Đạt — 83 câu, dài nhất 66 | D5, mục 2 |
| R5.6 hộp nhập gọn FT L/R · W/S tiêu chí · lớp thường đúng / tổng; chân Lưu · bài tiếp › + Vắng + ⋯ | Đạt | E1–E8 |
| R5.7 menu "+ Task" + bước chọn em | Đạt | F1–F4 |
| R5.8 chuông: dáng v2 (một dòng mỗi loại việc + số), bấm → Công việc đúng tab; Cập nhật nhẹ ở dưới | Đạt (XM-1 đã chốt) | G1–G4 |
| R5.9 một tab · một menu · một dải chỉ số · một lịch sử; dáng bỏ ở tệp nào | Đạt | H1–H4, mục 3 |
| Chung: nút-chip không biểu tượng · không Chấm Speaking ở Lớp của tôi · Báo cáo PH trong Vận hành · "+ Task" · "Chấm Speaking" | Đạt | C2, B1, F1 |
| Chung: Sáng + Tối · 1440 + 375 · đủ trạng thái · tên bịa · chú thích ngoài khung · không thêm thành phần ngoài đề bài | Đạt | mọi khung; ảnh `anh/bang-mau/` |

Đã dùng skill impeccable (context + layout; craft-floor), soát tự động một vòng + sửa một lượt (lớp `.x` của ① đè khối Cập nhật, dòng phụ ô chọn, ô nhập 375). Chưa chạy `critique` chấm điểm.
