# RA-UI · Phụ lục B — Học viên & Lớp · Lưu trữ · Hồ sơ lớp · Hồ sơ HV · Case · Hồ sơ GV

> Agent đọc mã (29/10, `main` `42c629ed`), **chưa bấm thử**. Rộng panel: không `rong` = 480 · `rong` = 720 · `toan` = hết màn (≤ 1440); 375 mọi panel toàn màn (`ui/KhungPanel.tsx:384`).
> Cột "Cần soi" = điểm rủi ro hình ảnh để chụp / kiểm, chưa phải lỗi đã xác nhận.

## B1. Học viên & Lớp `/hoc-vien` (`students/StudentsPage.tsx`)

| Màn / route | Khu | Loại | Vai | Mở bằng | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|---|
| /hoc-vien | đầu trang | trang | mọi vai có `students` | menu "Học viên & Lớp" | StudentsPage.tsx:396 | h1 22 ✓; một hàng: h1 + FT/Lớp thường + Phạm vi + Chi nhánh + "Xuất Excel · n HV" + "+ Thêm học viên" + ⋯ → xuống dòng 375–768 |
| /hoc-vien | đầu trang | menu ⋯ | "+ Lớp mới" QL/QT; "Lưu trữ · n lớp · m HV" trừ TVV/CX; "+ Thêm học viên" (chỉ điện thoại) | ⋯ | :402-407 | nhãn dài |
| /hoc-vien | tab | tab | Tất cả, Lịch thi: mọi vai · Đang SOS: trừ Admin | `?view=sos` / `lich-thi` | :411-415 | số trên tab |
| /hoc-vien | Tất cả · dải lọc | dải lọc | mọi vai | mặc định | :425-446 | ô tìm + "Thi tháng này · n" + chip + "Có việc quá hạn · n" (trừ CX) + "Đã thi · chờ kết quả · n" + "Bộ lọc thêm" — nhiều chip một hàng; số "!" / "…" khi lỗi / tải |
| ?loc=can-chu-y / tam-dung / sap-thi | Tất cả | chip | TVV, CX | chip | :432, :84-90 | thêm 3 chip; giải thích ở `title` |
| ?view=cho-buoc-tiep / loc=thieu_tt | Bộ lọc thêm › Theo vai | chip | TVV, CX | | :449-453 | chip đang bật hiện 2 lần |
| ?qh=1 · ?lt=1 | Bộ lọc thêm (Case/PA, Kỹ năng, Kết quả, Thời gian, Xếp em) | khối mở | trừ Admin | "Bộ lọc thêm" | :447-481 | cột nhãn `sm:w-40`; 375 nhãn hết dòng |
| ?phamVi=cua-toi | đầu trang | select Phạm vi | TVV mặc định của tôi; CX | | :346-360 | |
| /hoc-vien | rỗng | rỗng | TVV | không em | :486 | "Chưa có học viên nào của bạn" + câu giải thích + "Xem cả chi nhánh" |
| /hoc-vien | rỗng | rỗng | mọi vai | lọc không khớp | :489-491 | "Không có học viên nào khớp" + câu "Bỏ bớt từ khoá…" + "Xoá tìm" |
| /hoc-vien | rỗng | rỗng | TK không phạm vi | | :489 | "Bạn chưa được cấp phạm vi nào" + câu |
| /hoc-vien | lỗi / tải | | mọi vai | | :420-421, :483-484 | ErrorState; Skeleton 6 hàng; TVV/CX thêm ErrorState `/theo-vai` |
| /hoc-vien | hàng lớp `DauLop` | hàng | mọi vai | | :633-651 | mã + "n HV" + "GVCN {tên}" + SOS 1·2·3 + chip + ⋯ một hàng: tên GVCN dài, 375 |
| /hoc-vien | ⋯ hàng lớp `MenuLop` | menu ⋯ | Hồ sơ lớp · Nhập điểm (GV/GVCN) · + Học viên | | :600-614 | |
| ⋯ › Nhập điểm | `PanelNhapDiemLop` | panel toàn | GV, GVCN | | cham/PanelNhapDiemLop.tsx:24 | lưới rộng |
| /hoc-vien | bảng em `BangHvGon` | bảng | mọi vai | ≥ sm | DanhSachHvLop.tsx:144-155 | cột 210·104·224·140·112·180·Việc ≈ 970 px+; tên cắt + title; dòng phụ "Kết thúc học · Tạm dừng" |
| /hoc-vien 375 | thẻ `TheHvGon` | thẻ | mọi vai | | :241-260 | tên + PH cắt |
| hàng em ⋯ | menu | GV/GVCN/QL/QT: + Ghi vi phạm · Xác nhận xử lý · + Case · Nhập điểm {đợt} ─ Sửa thông tin · Cuối khoá… · Chuyển lớp… · Đề xuất chuyển lớp… | ⋯ | classes/thaoTacDongHocVien.tsx:96-112 | |
| hàng em ⋯ (em kết thúc) | menu | QL | | :87-89 | chỉ "Quay lại học" |
| hàng em ⋯ | menu | TVV, CX, Admin: Sửa thông tin · Tạm dừng/ Kết thúc học · Quay lại học · Kết quả thi thật ─ Mở hồ sơ | | :90-95 | |
| ⋯ › + Case | `QuickReport` | panel 480 | GV, GVCN, QL | | cases/QuickReport.tsx:492,521 | |
| ⋯ › + Ghi vi phạm | `RecordViolationPanel` | panel 480 | GV, GVCN, QL | | yThuc/RecordViolationPanel.tsx:190 | |
| ⋯ › Xác nhận xử lý | `XacNhanXuLyPanel` | panel 480 | GVCN, QL | | yThuc/XacNhanXuLyPanel.tsx:156-222 | 3 trạng thái; nút "Tiếp: đính kèm bằng chứng"; tải "Đang tải…" |
| ⋯ › Chuyển lớp… / Đề xuất | `ChuyenLopPanel` | panel 480 | QL / GVCN | | students/ChuyenLopPanel.tsx:222 | |
| ⋯ › Quay lại học | `HocLaiPanel` | panel 480 | QL | | StudentManagePanel.tsx:153 | |
| ⋯ › Sửa thông tin | `SuaThongTinMotEm` | panel 480 | TVV, CX, Admin | | StudentManagePanel.tsx:421 | |
| ⋯ › Tạm dừng/ Kết thúc học | `HopTamDungKetThuc` | hộp Modal | TVV, CX, Admin, QL | | students/HopTamDungKetThuc.tsx:124 | nhãn đậm "Khi lưu, web sẽ" = câu giải thích |
| ⋯ › Kết quả thi thật | `KetQuaThiThatPanel` | panel 480/720 | TVV, CX, QL | | students/KetQuaThiThatPanel.tsx:67 | |
| ô Việc → Case | `PanelMotEm` | panel 480 | GV, GVCN, QL | bấm việc | students/PanelMotEm.tsx:113 | "Em chưa có Case nào."; dòng phụ "Việc tiếp: …" |
| ô Việc → Sau thi | `PanelSauThi` | panel 480 | TVV, QL | | congViec/PanelSauThi.tsx:55 | h3 15 trong panel |
| "+ Thêm học viên" | `IntakePanel` | panel toàn | có quyền | | students/IntakePanel.tsx:170 | |
| ⋯ › + Lớp mới | `ClassCreatePanel` | panel 480 | QL, QT | | classes/ClassCreatePanel.tsx:151 | |
| Xuất Excel | `NganXuatDs` | panel 480 | mọi vai | | students/NganXuatDs.tsx:62 | dòng phụ nối bộ lọc dài |
| ?view=sos | dải lọc + `BangSosGon` | bảng | trừ Admin | tab | :506-521; DanhSachHvLop.tsx:281 | ≈ 1000 px; rỗng "Không có học viên SOS" |
| ?view=sos&classId= | `DaiLop` | dải | | chọn lớp | :656-674 | nút ✕ không 44 px ở 375 |
| ?view=lich-thi | `GocLichThi` | tab + bảng | mọi vai | | students/GocLichThi.tsx:152-165 | dòng phụ "GVCN {tên}"; rỗng có dấu chấm cuối |
| phân trang | `PhanTrang` | thanh | | > 1 trang | :494,497 | |

## B2. Lưu trữ `/hoc-vien/luu-tru`

| Khu | Loại | Vai | Tệp:dòng | Cần soi |
|---|---|---|---|---|
| đầu trang | trang | GV, GVCN, QL, QT, Admin | students/LuuTruPage.tsx:99-107 | "‹ Học viên & Lớp" không 44 px |
| Lớp đã kết thúc | tab | | :111-136 | nút hàng "Tổng kết" + "Mở lại" |
| Học viên đã lưu trữ `?tab=hv` | tab | | :143-165 | nhiều nút một hàng |
| rỗng | | | :120, :143 | "Chưa có lớp nào kết thúc" / "Chưa có học viên nào được lưu trữ" / "Không có … khớp" |
| Mở lại lớp | panel 480 | QL, QT | classes/XoaKetThucLopPanel.tsx:139 | |

## B3. Hồ sơ lớp `/hoc-vien/lop/:id`

| Khu | Loại | Vai | Mở | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|
| đầu trang `DauTrangLop` | trang | mọi vai | mã lớp | classes/DauTrangLop.tsx:166-202 | h1 22 ✓; GVCN · HV · Lượt gần nhất · Đạt % · SOS rồi "Nhập điểm" + "+ Case" + ⋯ một hàng |
| lớp kết thúc | dải | | | :175 | "Lớp đã kết thúc {tuần} — chỉ xem" |
| chip "+n" | menu | | | :206-217 | mục không bấm vẽ như tiêu đề |
| ⋯ Thao tác khác | menu ⋯ | theo quyền | | :142-157; shared/domain/hocVienLop.ts:692 | Thông tin lớp · Sửa thông tin HV · + Học viên · Cuối khoá… · Kết thúc lớp · Xuất Excel · Lịch sử · Lịch sử góp ý tuần · Mở lại lớp · Xoá lớp (đỏ) |
| `ThanhViecLop` | dải việc | GV, GVCN, QL | | classes/ThanhViecLop.tsx | |
| tab | tab | Tổng kết (lớp xong) · Học viên · Ý thức & Phối hợp · Phân tích lớp | `?tab=` | ClassOverviewPage.tsx:156 | |
| Học viên · Cách xem | đoạn | Tổng hợp · Cần hỗ trợ · Kết quả đầu ra · Thông tin lớp (TVV/CX/Admin) | `?che-do=` | classes/TabHocVienLop.tsx:53-87 | phải: "Sửa thông tin" + "Chọn nhiều học viên" |
| Tổng hợp FT `BangHoSoLop` | bảng | mọi vai | | classes/BangHoSoLop.tsx:132 | |
| Tổng hợp lớp thường `BangDiemLopThuong` | bảng | | | classes/BangDiemLopThuong.tsx:146-203 | min-w 1040; **ô chọn tất cả trong `<th>` (G9)** :154 |
| Cần hỗ trợ `BangCanHoTro` | bảng | trừ Admin | | classes/BangCanHoTro.tsx:88 | rỗng "Không có học viên nào đang có Case mở" |
| Kết quả đầu ra `BangKqdrLopFt` | bảng | FT, trừ Admin | | classes/BangKqdrLopFt.tsx:33 | min-w 1080; rỗng 2 câu |
| Thông tin lớp (chỉ đọc) | thẻ | TVV, CX, Admin | | TabHocVienLop.tsx:91-147 | h2 12 đậm |
| Chọn nhiều `ThanhChonNhieu` | thanh dính đáy | QL, QT | | TabHocVienLop.tsx:104 | 4 nút + Bỏ chọn ở 375 |
| Chọn nhiều › xem trước / Chuyển lớp / Tạm dừng | panel 480 / toàn / Modal | QL | | XemTruocHangLoatPanel.tsx:89; ChuyenLopPanel.tsx:417 | |
| ?tab=y-thuc `ClassYThucCard` | tab | mọi vai | | yThuc/ClassYThucCard.tsx:176-281 | **tiêu đề thẻ lặp tên tab**; nhóm h3 Cần xử lý · Chờ QL duyệt · Mới · Chờ TVV báo PH · Chưa xác nhận cấp bậc |
| Ý thức rỗng | rỗng | | | :190 | câu giải thích thừa |
| Nhật ký vi phạm · Phối hợp · Phối hợp SOS | gập / mục | | | :220-253; PhoiHopSosSection.tsx:63-226 | dòng phụ giải thích; nút "Đánh dấu đã làm", "Bỏ ▾" không 44 px |
| Chọn nhiều Ý thức | thanh | QL | | :256-269 | 3 nút có số + toast Hoàn tác |
| Khai bậc cả lớp `LoYThucPanel` (#672) | panel 720/480 | QL | | yThuc/LoYThucPanel.tsx:77,224 | lỗi là chữ đỏ trơn; **chân 375 xếp dọc (PTA 29/10)** |
| hàng em mở · `ChiTietViPham` · `DeleteViolationConfirm` | khối / hộp | GVCN, QL | | ClassYThucCard.tsx:492; ChiTietViPham.tsx:107; DeleteViolationConfirm.tsx:33 | nút không 44 px |
| `KhaiBacPanel` · `DaThucHienPanel` · `XemXuLyPanel` · `PanelBaoPhTvv` | panel 480 | | | yThuc/* | |
| ?tab=phan-tich `PhanTichLopTab` | tab | | | classes/PhanTichLopTab.tsx:34 | |
| ?tab=tong-ket `TabTongKetLop` | tab | lớp xong | | classes/TabTongKetLop.tsx:62-125 | bảng 1000 / 620 |
| cuối trang "Điểm MT / Điểm Test của lớp" | khối gập | | | ClassOverviewPage.tsx:209-231 | h2 chứa nút; chip "còn n ô trống" |
| ⋯ › Thông tin lớp `ThongTinLopPanel` | panel 480 | QL, QT, GVCN | `?viec=phan-cong` | classes/ThongTinLopPanel.tsx:26 | h3 14 |
| ⋯ › Sửa thông tin HV `SuaCaLopPanel` | panel toàn | QL, GVCN | | students/SuaCaLopPanel.tsx:188 | |
| ⋯ › Xuất Excel `NganXuatMt` · Lịch sử `LichSuThayDoi` · Xoá / Kết thúc lớp | panel | | | | |
| `?viec=ban-giao` `BanGiaoPanel` | panel toàn / 720 | GVCN, GVBM, QL | | classes/BanGiaoPanel.tsx:30-282 | h3 base trong panel; 2 câu giải thích (:129, :239) |
| `?viec=xet-lai` `PanelXetLai` | panel 720 | QL, GVCN | | classes/PanelXetLai.tsx:173 | Modal "Chuyển ngay hôm nay?" |
| `?xem=cuoi-khoa` `CuoiKhoaLop` | trang con | QL, GVCN, TVV/CX | ⋯ Cuối khoá… | classes/CuoiKhoaLop.tsx:621-732 | **h1 17 px (V16 đòi 22)**; dòng phụ dài; thanh "Áp cho n em" + "Bỏ chọn" không 44 px; 3 Modal |
| lỗi / tải | | | | ClassOverviewPage.tsx:121 | |

## B4. Hồ sơ HV `/hoc-vien/:id`

| Khu | Loại | Vai | Tệp:dòng | Cần soi |
|---|---|---|---|---|
| đầu `DauHoSo` | trang | mọi vai | students/StudentDetailPage.tsx:254-298 | h1 22 **chứa** badge + "Tạm dừng … · Có thể quay lại" + nhãn sau thi + "Gia hạn" → tên dài xuống dòng |
| nút đầu (GV/QL) | "+ Case" + ⋯ | GV, GVCN, QL | :272-291 | ⋯: Sửa thông tin · Lộ trình · Cuối khoá… · Chuyển lớp… · Đề xuất chuyển lớp… · Kết quả thi thật · Tạm dừng/ Kết thúc học · Quay lại học · Đề xuất sửa thông tin… · Lịch sử · Xoá |
| nút đầu (TVV/CX/Admin) | **mỗi mục là một nút** | TVV, CX, Admin | :286-287 | **nhiều nút một hàng ở 375** |
| `DongThongTin` · `DongLienHe` | dòng | | DauHoSo.tsx:40-87 | nhiều cặp nhãn / giá trị |
| `DaiTamDung` · `DaiHocVienChuyen` · `DaiXetLai` · `DaiChoDuyet` | dải | | DauHoSo.tsx:201-242 | câu giải thích trong dải vàng |
| ô điểm lớn `DiemDau` | ô | | :319 | Overall · L · R · W1 · W2 · S ở 375 |
| "Việc của tôi" / "Đang xử lý" | thanh | | DauHoSo.tsx:99-192 | h2 12 đậm |
| tab | Học thuật · Ý thức & Phối hợp · Lộ trình & lớp | | :333-338 | |
| Học thuật rỗng | rỗng | | :341 | câu giải thích |
| `KetLuanKhoa` + panel Không đạt | khối / panel 480 | GVCN, QL | students/KetLuanKhoa.tsx:54-146 | số 17 |
| Hành trình · {kn} `HanhTrinhKyNang` | thẻ | | students/HanhTrinhKyNang.tsx:302 | ⓘ |
| Overall → bảng MT | thẻ | | :363-369, :642 | min-w 640 |
| Tiến độ trên lớp | thẻ | | students/TienDoTrenLop.tsx:78-247 | câu "Bạn không ghi được…" |
| Case & PA · {kn} `CotCaseHv` · KQ Test lớp thường | cột / thẻ | | | |
| ?tab=y-thuc `StudentYThucSection` | tab | | yThuc/StudentYThucSection.tsx:151 | **h2 17 lặp tên tab** |
| ?tab=y-thuc (em không lộ trình) | **có thể lỗi trang** | | StudentDetailPage.tsx:406 | `cy.ratio` khi `cy = null` — kiểm khi bấm (logic → báo RA-LUONG) |
| ?tab=hanh-trinh `CacLoTrinh` · `HanhTrinh` | thẻ + bảng | | students/CacLoTrinh.tsx:74; HanhTrinh.tsx:131 | cuộn ngang tuần |
| `?tong-ket=` `NganTongKet` | panel 720 | | students/NganTongKet.tsx:192 | |
| `?buoc-tiep=` `PanelBuocTiep` · `PanelLoTrinhMoi` | panel 480 | TVV, QL | students/PanelBuocTiep.tsx:66 | |
| ⋯ Lộ trình `StudentPlanPanel` | panel 720 | QL, GVCN | students/StudentPlanPanel.tsx:61 | rỗng có câu |
| ⋯ Sửa thông tin / Xoá / Lịch sử / Đề xuất sửa | panel 480 | theo quyền | StudentManagePanel.tsx:118-421; duyet/DeXuatSuaPanel.tsx:72 | |
| Quay lại học | panel 480 / Modal | QL | QuayLaiHoc.tsx:87 | |
| "Gia hạn" `HopGiaHan` | Modal 440 | TVV, QL | students/HopGiaHan.tsx:46 | |

## B5. Case `?case=` · `NganCase`

| View | Vai | Tệp:dòng | Cần soi |
|---|---|---|---|
| Case | GV, GVCN, QL | students/NganCase.tsx:389-419 | dải đầu: chip + "mở {tuần} · {tên} báo · hạn … · phụ trách …" **dòng phụ dài**; chân "+ Thêm PA" + nút chính + "Case tiếp ›" |
| chỉ đọc gọn | TVV, CX, GV môn khác | :281-315 | 🔒 + câu "ai làm được" |
| ✓ Đã lưu | | :168-181 | Việc tiếp › · ‹ {tên} · Đóng · Xem Case · Hoàn tác |
| Ghi / Sửa kết quả · Xác nhận Case / Mô tả / Xác nhận PA · Thêm / Sửa PA · Sửa / Hoàn thành Case | GV, GVCN, QL | CapNhatTuan.tsx:384-504; CaseSosControls.tsx:160-419; ThaoTacCase.tsx:146-421 | |
| thân `CasePanel` (DauMuc) | | cases/CasePanel.tsx:212-317 | tooltip dài |
| `/hoc-thuat/case/:id` | | cases/CaseBoardPage.tsx:14-27 | chuyển về hồ sơ |

## B6. Hồ sơ GV `/giao-vien/:id`

| Khu | Tệp:dòng | Cần soi |
|---|---|---|
| đầu trang | giaoVien/HoSoGiaoVienPage.tsx:88-121 | **không có lớp `page`** (khung trang khác); giá trị `NhanDau` 15 đậm; "Từ tuần … đến …" + ⓘ + "Mở Công việc ›" |
| Chỉ số · Lớp đang dạy · Học thuật (Theo kỹ năng / Theo lớp) · Việc · Case đang phụ trách · Yêu cầu đã gửi | :197-585 | số 28 đậm nhiều; rỗng có dấu chấm cuối; nhiều số đậm |
| `OSo` → panel chỉ đọc | ui/OSo.tsx | |

## B7. Khác trong vùng
| Màn | Tệp:dòng | Cần soi |
|---|---|---|
| /mock-test/:id + 3 panel 480 ("Xử lý vắng · …") | fasttrack/MockDetailPage.tsx:311-1200 | ⓘ ×3 |
| /luot-test/:id | fasttrack/LuotThuongPage.tsx:182 | |
| Công việc › Chờ duyệt rỗng | duyet/HopChoDuyet.tsx:212 | "Không có yêu cầu nào đang chờ" **chưa bọc `t()`** (EN) |
| Yêu cầu của tôi rỗng | duyet/YeuCauCuaToi.tsx:38 | |

## B8. Kết quả tìm nhanh
- ↗ còn lại: **0** (trừ `cases.ts partial`).
- Tiêu đề trang không 22: **`classes/CuoiKhoaLop.tsx:625` h1 17 px**.
- Tiêu đề lặp tên tab: `ClassYThucCard.tsx:176`, `StudentYThucSection.tsx:151`.
- Điều khiển trong `<th>`: `BangDiemLopThuong.tsx:154`.
- Nút thiếu 44 px ở 375: StudentsPage.tsx:670 · LuuTruPage.tsx:99 · ChiTietViPham.tsx:107-114 · PhoiHopSosSection.tsx:213-214 · thanh CuoiKhoaLop.
