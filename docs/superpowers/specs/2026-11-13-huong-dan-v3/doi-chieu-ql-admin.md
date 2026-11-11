# HD-V3-B · Đối chiếu Hướng dẫn QL + Admin với mã main (13/11)

Người làm: session HD-V3-B (Sonnet 5.5 · high). Nguồn mã: `main` 3fac03216 (sau #1466). Đối tượng: `shared/huongDan/ql.ts` (QT dùng lại — `qt.ts`) và
`shared/huongDan/admin.ts`. Chỉ ĐỌC mã; chưa sửa gì. Quy ước: **CÓ** (đúng mã, giữ) · **THIẾU** (việc / màn / panel có thật mà Hướng dẫn chưa có) ·
**SAI** (khác mã hiện tại) · **CŨ** (đúng ngày 05/11, sau đó luật / nhãn đổi). Dẫn `tệp:dòng` là mã web / máy chủ; `ql.ts:n` · `admin.ts:n` là nội dung Hướng dẫn.
Phần `/quan-tri` chỉ giữ lối QL thật sự dùng (Cấu hình hệ thống xem-chỉ-đọc, Đã xoá, Hạn mặc định, Band & ngưỡng) — mục 9 ghi rõ.

## 0. Kết luận nhanh

- QL: 28 việc (`lam`) → khoảng **15 CÓ (sửa nhẹ chữ) · 10 CŨ / SAI một phần · 3 SAI hẳn** (Khôi phục thứ đã xoá, Lưu trữ ở hồ sơ HV, Phân tích 6 tab). THIẾU **8 việc** mới + **2 màn** chưa có mục (`/hoc-thuat/case/:id`, `/giao-vien/:id`) (mục 4–5). Số là ước lượng theo bảng mục 3.
- Admin: 10 việc → **CÓ 5 · SAI / CŨ 4 · THIẾU 3** (Xuất báo cáo PH, Thông tin lớp, Chuông). Tab Phân tích Admin đếm sai (4 tab, không phải 6).
- Lỗi lặp nhiều nhất: (1) Phân tích đổi từ 6 tab sang **5 tab Chi nhánh · SOS · Thi thật · Giáo viên · Ý thức** (V2); (2) "Xuất Excel" gom thành MỘT nút **Xuất Excel…** hai tab Điểm Test / Lịch Test (G1-08);
  (3) "Đã xoá" KHÔNG còn ở menu Tài khoản (07/11) mà là tab trong `/quan-tri`; (4) Học viên & Lớp đổi "Phạm vi / Cần làm / 3 góc" thành ô **Xem** + chip lọc; (5) ⋯ hồ sơ HV không có "Lưu trữ" (N11: **Tạm dừng/ Kết thúc học**);
  (6) hạn thẻ duyệt nay đọc từ **Hạn mặc định** (QL xem, Quản trị sửa); (7) Phối hợp SOS và Báo cáo PH chưa có trong Hướng dẫn QL; (8) Admin được đổi lộ trình (11/11 XM 2), `admin.ts` nói "chỉ xem".

## 1. Route (`App.tsx`) × màn Hướng dẫn hiện có — QL và Admin

Điều kiện vào: `nav.*` ở `server/src/platform/nav.ts:34-69`; tab Test / Công việc ở `shared/domain/dieuHuong.ts:117-205`. QL = `manager`; Admin = `office_admin` (`seed/data.ts:96`: attempt.view, test.view, work.view, plan.week, schedule.move, score.override, case.view, student.view, student.edit_info, analysis.view, analysis.view_teacher).

| Route (`App.tsx`) | QL vào? | Admin vào? | Màn HD hiện tại (`manCuaDuong`) | Kết luận |
|---|---|---|---|---|
| `/` (`:380`) | có | có | QL `tong-quan` · Admin `tong-quan` | CÓ (nội dung: mục 5) |
| `/phan-tich` (`:383`) | có | có (nav.analysis) | `phan-tich` | CÓ màn, **SAI nội dung** (6 tab cũ) |
| `/hoc-vien` (`:384`) | có | có | `hoc-vien` | CÓ màn, **CŨ nội dung** |
| `/hoc-vien/lop/:id` (`:385`) | có | có | `ho-so-lop` | CÓ màn, CŨ |
| `/hoc-vien/luu-tru` (`:386`) | có | **không** (Admin không có Lưu trữ; menu "Thao tác trang" chỉ vai quản lý, `StudentsPage.tsx:429-431` — `laVai` loại TVV/CX; Admin: cần kiểm ở GĐ2) | QL `luu-tru` · Admin **không có** | QL CÓ; Admin: xem mục 6 |
| `/hoc-vien/:id` (`:387`) | có | có | `ho-so-hv` | CÓ, CŨ |
| `/hoc-thuat/case/:id` (`:389`) | có | có (case.view) | **không khớp** (không có mục `/hoc-thuat/`) | **THIẾU** — link sâu từ thông báo / email; chuyển về hồ sơ HV mở Case, hoặc mở thẳng ngăn Case (`?viec=ghi-ket-qua`) `CaseBoardPage.tsx:14-30` |
| `/test/:tab?` (`:390`) | có | có | `lich-test` (`/test`, `/test/lich`) · `ke-hoach` · `diem-lop` | CÓ; `diem-lop` là link cũ (`dieuHuong.ts:128`, `TestPage.tsx:36-47`) |
| `/nhap-diem/:id` · `/bang-diem-thuong/:id` (`:394-395`) | có | có | `nhap-diem` | CÓ — nhưng đây là **chuyển hướng** (`ChuyenNhapDiemCu`, `dieuHuong.ts:138-153`), không phải màn |
| `/mock-test/:id` · `/luot-test/:id` (`:396-397`) | có | có | `nhap-diem` | CÓ (hồ sơ lượt Test) |
| `/cong-viec/:tab?` (`:398`) | có | có | `cong-viec` · `van-hanh` · `bao-cao` | CÓ; `yeu-cau` / `cho-duyet` chuyển hướng (`CongViecPage.tsx:41-46`) |
| `/quan-tri` (`:403`) | có (nav.bangQuyDoi, 4 tab chỉ-đọc + Đã xoá) | **không** | QL `quan-tri` (CÓ, **CŨ**) | mục 9 |
| `/ho-so-ca-nhan` (`:404`) | có | có | `ho-so-ca-nhan` | CÓ |
| `/giao-vien/:id` (`:405`) | có (QL trong phạm vi) | **không**? (`duongHoSoGiaoVien` chỉ `laQuanLy`, `hocVienLop.ts:735-741`) | **không khớp** | **THIẾU** cho QL (hồ sơ GV — tên GV ở Phân tích GV, Tổng quan là link) |
| `/huong-dan` (`:406`) | có | có | `huong-dan` | CÓ |
| `/tutor/*` (`:382`) | chuyển về `/` | — | — | bỏ (AN-TUTOR) |

## 2. Thanh điều hướng, tab Test / Công việc / Phân tích — nhãn thật

- Khu vực (`dieuHuong.ts:50-58`): **Tổng quan · Học viên & Lớp · Test · Công việc · Phân tích**. Admin: không có `workApprove` / `workOps` / `workReports` (`nav.ts:54-62`).
- **Test** (`dieuHuong.ts:117-130`): CHỈ 2 tab — **Lịch Test tuần** · **Kế hoạch Test**. "Điểm theo lớp" là tab ẨN (link cũ mở Lịch Test + panel Nhập điểm lớp). QL và Admin đều có Kế hoạch Test (`testPlan = test && plan.week`).
- **Công việc** (`CongViecPage.tsx:1-55`): MỘT danh sách `/cong-viec` (HoTroHocVienTab), không còn hàng 4 tab. Trong đó (`HoTroHocVienTab.tsx:216`): tab nhóm **Chờ bạn duyệt** (QL) · **Chấm điểm** · **Bài thi Speaking** · **Case học thuật** · **Ý thức & Phối hợp** · **Việc quản lý** (QL; vai Admin hiện nhãn "Vận hành", `tongQuan.ts:33,125`). Ô **Việc của ai: Của tôi · Của GV · Tất cả** (`congViec.ts:318`, `HoTroHocVienTab.tsx:474`) · **Lọc theo hạn** (Mọi hạn / Quá hạn / Hôm nay / Hạn đến …) · **Lọc thêm** (một GV · khung · chi nhánh) (`:489-509`). Cuối tab Việc quản lý: **+ Giao việc**, **Vận hành ›**, **Họp đơn vị ›** (`:785-787`). Hai trang `/cong-viec/van-hanh`, `/cong-viec/bao-cao` có "‹ Công việc".
- Mục trong tab (`tongQuan.ts:134-137`): Mock Test · Progress / Final Test · Checkpoint · Speaking chấm chéo · Mô tả Case · Phương án · Kết quả PA · Báo PH · Vi phạm · Phối hợp SOS · Phân công · Bàn giao · Sau thi · Lộ trình · Chốt ngày thi · Thiếu dữ liệu · Bổ sung hồ sơ · Việc được giao · **Báo cáo PH** · Khác.
- **Phân tích** (`phanTich.ts:29-41`, `PhanTich.tsx:33,128`): **Chi nhánh · SOS** (lớp thường ghi "Test") **· Thi thật · Giáo viên · Ý thức**. Giáo viên cần `analysis.view_teacher` (QL, Admin có); **Ý thức cần `discipline.stats` — Admin KHÔNG có** (`seed/data.ts:96`) → Admin thấy 4 tab. Khoảng mặc định: Chi nhánh = một tháng, các tab khác 2 tuần (`PhanTich.tsx:55-58`); ô chương trình, "Từ tuần → Đến tuần", "Toàn bộ", "Chọn khoảng tuần", ô Lớp; **Xuất Excel** mọi tab (`BaoCao.tsx:215`, `KetQuaThi.tsx:119`, `PhanTichGiaoVien.tsx:210`, `TongHopTestSos.tsx:384`, `YThucPhoiHop.tsx:199`); **In** chỉ tab Chi nhánh (`PhanTich.tsx:152`); SOS có thêm **Xuất kết quả từng lượt** (`TongHopTestSos.tsx:245`, cần `nav.xuatMt`).
- Menu Tài khoản (`Header.tsx:351-366`): Góc nhìn · Hồ sơ cá nhân · (Hồ sơ giáo viên nếu có vai GV) · **Cấu hình hệ thống** (QL) / Quản trị hệ thống · Giao diện · Ngôn ngữ · Đăng xuất. **Không có "Đã xoá"** (`Header.tsx:351` ghi chú chủ SP 07/11).
- Chuông (`HopChuong.tsx:163-218`): hai khối **Việc cần làm** (nhóm theo loại, chi nhánh, "n mới", ⚠ quá hạn / hôm nay; số = số badge Công việc; "Chờ bạn duyệt" là nhóm riêng `:83`) và **Cập nhật** (+ **Xem tất cả**, **Đánh dấu đã đọc**).

## 3. QL — bảng việc `lam` (mỗi dòng: lối chính hiện tại → kết luận → sửa)

| # | Việc (`ql.ts`) | Lối chính trong HD | Đối chiếu mã | KL | Sửa ở GĐ2 |
|---|---|---|---|---|---|
| 1 | `duyet` (`:28`) | Công việc › Chờ bạn duyệt | Tab "Chờ bạn duyệt" `HoTroHocVienTab.tsx:216`; nút **Duyệt / Duyệt… / Từ chối… / Trả lời… / + Thêm PA** `TheYeuCau.tsx:228-241`; hàng lọc `HopChoDuyet.tsx:257-264` | **CÓ** (bước đúng) | `tatThem: 'Thông báo'` → "Chuông › Việc cần làm › Chờ bạn duyệt" (`HopChuong.tsx:83`); thêm dòng "hạn trả lời lấy từ Hạn mặc định" (xem #29) |
| 2 | `nhap-ho` (`:38`) | Tổng quan › Bài chấm quá hạn | `TongQuanV5.tsx:269,306` (cột **Bài chấm quá hạn**, số ⚠ mở `PanelGvTre`, nút **Nhập hộ** `DanhSachViec.tsx:204`) | **CÓ** | lối tắt 'Công việc › Của GV': đổi "nhóm Chấm điểm" → tab **Chấm điểm** |
| 3 | `sua-diem` (`:46`) | Test › Lịch Test tuần | Lịch Test tuần CÓ (`LichTestTab.tsx`); sửa / xoá điểm đã có: ghi **Lý do sửa** (`HopNhapDiem.tsx`, `ScoreEntry.tsx`) | **CÓ** | bước 3 "(chỉ QL)" → "QL · Admin" (Admin có `score.override`); `loiTat: 'diem-lop'` đổi nhãn "panel Nhập điểm lớp" |
| 4 | `case-lam-thay` (`:54`) | Công việc › Của GV › Case học thuật | Nhãn nhóm CÓ (`tongQuan.ts:33`, `congViec.ts:318`); Ghi KQ PA có **Lưu nháp** + Lưu = chốt không Hoàn tác (`CapNhatTuan.tsx:461`, chip "Có nháp" `DanhSachViec.tsx:382`); "Chọn PA" khi PA GV ≠ PA quy chế (`CaseSosControls.tsx:225-296`) | **CÓ · CŨ** | thêm bước "Lưu nháp / Lưu / Sửa"; tên việc: Xác nhận PA · Ghi kết quả PA · **Chọn PA** (GV chọn Theo quy chế / Giữ PA của tôi) |
| 5 | `xem-case` (`:61`) | Hồ sơ HV › Case & phương án | Khối "Case & phương án" CÓ; tab **Học thuật** `hoSoHocVien.ts:22-25` | **CÓ** | giữ |
| 6 | `tao-case` (`:68`) | Hồ sơ HV › + Case cho một kỹ năng | Nút **+ Case** đầu hồ sơ `StudentDetailPage.tsx:273-276`; **+ Case cho {kỹ năng}** trong khối Case khi đang chọn một kỹ năng `CotCaseHv.tsx:125` | **CÓ** | thêm lối tắt nút **+ Case** đầu hồ sơ; giữ bước hiện có |
| 7 | `case-hoan-thanh` (`:75`) | Trong Case | Panel Case `ngan-case`; "Hoàn thành Case" `KhungPanel tieuDe='Hoàn thành Case'` | **CÓ** | thêm: xoá Case / PA mềm, **Hoàn tác** + **Đã xoá** 30 ngày (N24, N28, N37) — "5 giây" sai (xem mục 8) |
| 8 | `doi-chu-case` (`:81`) | Trong Case › Đổi người… | CÓ (`DoiNguoiPhuTrach.tsx`, `PanelViec.tsx:404` "Chọn người phụ trách") | **CÓ** | giữ |
| 9 | `ket-thuc-pa` (`:87`) | Trong Case › ⋯ ở dòng PA | `Kết thúc PA` + ô "Hoàn thành Case" (#1374 #1375) | **CÓ · CŨ** | thêm "kết thúc PA cuối có ô Hoàn thành Case"; PA quy chế "Kết thúc sớm…" form chưa có ô đó (việc để sau) |
| 10 | `chuyen-lop` (`:94`) | Hồ sơ HV › ⋯ › Chuyển lớp… | `quanLyHocVien.ts:16,67-68`, `ChuyenLopPanel.tsx:62,260,322` | **CÓ · THIẾU** | thêm: ô "Theo luồng chuyển tiếp lộ trình" (N25), ô **Reset bậc vi phạm** (N36); nhãn nút là **Chuyển ngay** / **Duyệt và quyết định**; GVCN **Đề xuất chuyển lớp…** là thẻ QL |
| 11 | `sua-hv` (`:101`) | Hồ sơ HV › ⋯ › Sửa thông tin | CÓ (`quanLyHocVien.ts:12`); **ô "Lộ trình đang học"** đổi được (LO-TRINH-THEO-HV) `StudentManagePanel.tsx:510-516` | **CÓ · THIẾU** | thêm bước "Lộ trình đang học: LT1 · LT2 · RF; lượt MT đã có điểm giữ, chưa thi đề xuất lại" + ai đổi được (QL · Quản trị · GVCN lớp đang học · TVV · Admin, `profile.ts:795-798`); luật 'theo HV, không theo lớp' |
| 12 | `them-hv` (`:108`) | Học viên & Lớp › + Lớp mới · + Học viên | `StudentsPage.tsx:425,441` (**+ Lớp mới** trong ⋯ **Thao tác trang**, **+ Thêm học viên** nút chính — nhãn "+ Học viên" SAI); Dán Excel chỉ ở thêm học viên `IntakePanel.tsx:68` | **CÓ · SAI nhãn** | nhãn **+ Thêm học viên**; "+ Lớp mới" nằm trong ⋯ (hoặc nút ở 375); bước Dán Excel đúng — thêm "bỏ Dán Excel điểm (chủ SP 13/11)" KHÔNG cần (không ghi chú tĩnh) |
| 13 | `luu-tru` (`:114`) | Hồ sơ HV › ⋯ › Lưu trữ | **KHÔNG có mục "Lưu trữ" trong ⋯ hồ sơ HV** (`quanLyHocVien.ts:11-24`); đường vào Lưu trữ = **Tạm dừng/ Kết thúc học** (N11, `PHU_VIEC` `:117`) hoặc hồ sơ lớp "Chọn nhiều học viên" `TabHocVienLop.tsx:29` | **SAI** | viết lại: "⋯ › **Tạm dừng/ Kết thúc học** (ô 'Có thể quay lại học') — em vào Lưu trữ"; xem lại: **Học viên & Lớp › ⋯ Thao tác trang › Lưu trữ · n lớp · n HV** → trang Lưu trữ: tab **Lớp đã kết thúc · Học viên đã lưu trữ** (`LuuTruPage.tsx:179-180`); **Quay lại học** (một / nhiều em, `:253`) |
| 14 | `lich-su` (`:121`) | Hồ sơ HV › ⋯ › Lịch sử | `NHAN_VIEC_QUAN_LY['lich-su-sua']='Lịch sử'` `:23`; hồ sơ lớp ⋯ nhóm **Công cụ › Lịch sử** (+ **Lịch sử góp ý tuần**) `hocVienLop.ts:715-716`, `DauTrangLop.tsx:187` | **CÓ** | giữ |
| 15 | `lich-thi` (`:128`) | Học viên & Lớp › Lịch thi | Tab **Lịch thi** `StudentsPage.tsx:450`; nút **Xuất Excel** `:440` mở panel **Xuất Excel** (`NganXuatDs.tsx:99`: Mẫu **Danh sách / Báo cáo PH**, Phạm vi, Tháng, Cột) | **CÓ · THIẾU** | thêm mẫu **Báo cáo PH** theo tháng (Excel chi nhánh — xem #31); nhãn "**Xuất {n} HV**" `:104`; Test › Lịch Test tuần có link **Lịch thi thật ›** `LichTestTab.tsx:281` |
| 16 | `chot-lo-trinh` (`:134`) | Công việc › Chốt lộ trình | Việc tên **Chốt lộ trình** `chuong.ts:20`; hồ sơ lớp thường ⋯ nhóm **Cuối khoá › Cuối khoá…** (`hocVienLop.ts:710`), không còn "Hồ sơ lớp › Chốt lộ trình" (`ql.ts:284` SAI) | **CÓ · SAI lối tắt** | lối tắt: "Hồ sơ lớp › ⋯ › **Cuối khoá…**"; hạn **T5 tuần trước tuần Final** (N20) — "hạn 7 ngày" SAI (`ql.ts:138`) → "hạn theo Hạn mặc định (gốc T5 tuần trước Final)" |
| 17 | `buoc-tiep` (`:141`) | Công việc › Chọn bước tiếp | Việc **Chọn bước tiếp** `chuong.ts:18`; ⋯ hồ sơ HV **Bước tiếp…** `:15` | **CÓ** | giữ; thêm lối tắt "⋯ › Bước tiếp…" |
| 18 | `xep-lich` (`:149`) | Test › Kế hoạch Test | Nút **Xếp nhiều MT…** (FT) / **Xếp lịch Test…** `KeHoachTestTab.tsx:229-231`; chip **Chưa đủ MT** `:164` (đúng); **Xóa lịch** `HopKyNang.tsx`; "Dời hạn chấm · Huỷ điểm" `thaoTacMt.ts` | **CÓ** | `buoc 4` ".. **Xóa lịch**" đúng; nút **Xuất Excel…** nằm cạnh (xem #22) |
| 19 | `thi-lai-s-ex` (`:156`) | Kế hoạch Test › ô MT · S Ex | `NganXepLichMt.tsx` "Thi lại"; S Ex | **CÓ** | giữ |
| 20 | `xem-lich-test` (`:162`) | Test › Lịch Test tuần | `LichTestTab.tsx:255-300`: tuần ‹ ›, **Lớp tôi dạy / Tất cả**, **Mở tất cả lớp**, **Lịch thi thật ›**, khối **Quá hạn chấm** `KhoiNo.tsx`, **Test tuần này** | **CÓ** | thêm **Xuất Excel…** (xem #22) |
| 21 | — | — | Panel Nhập điểm lớp thường G1-11 (Kết quả dưới tên, ô môn hai tầng) `PanelNhapDiemLop.tsx` | **THIẾU** | bước riêng cho lớp thường trong mục `p-nhap-diem` |
| 22 | `xuat-test` (`:168`) | Test › Kế hoạch Test › Xuất Excel | **MỘT nút "Xuất Excel…"** ở Lịch Test tuần (`LichTestTab.tsx:277`) và Kế hoạch Test (`KeHoachTestTab.tsx:229`); panel hai tab **Điểm Test · Lịch Test** (`NganXuatTest.tsx:11-32`, tab Lịch chỉ khi `nav.testPlan`); Điểm Test: Khung lớp (Fast Track / Lớp thường) · Chi nhánh · Lớp · Thời gian **Theo tuần / tháng / đợt** · **Mọi lượt / Chỉ lượt đủ điểm** · Cột **Gọn / Gọn + nhận xét (chỉ FT) / Đầy đủ** `NganXuatMt.tsx:205-237` | **SAI · CŨ** | viết lại bước: nút **Xuất Excel…** → tab **Điểm Test** / **Lịch Test** → chọn → **Xuất Excel · n lượt**; bỏ "13 cột", "Xuất điểm Test", "Điểm + nhận xét / Chỉ điểm"; bỏ "Điện thoại: nút nằm trong Lọc" (`ql.ts:314`, G1-08 đưa lên hàng tiêu đề) |
| 23 | `xem-viec` (`:176`) | Công việc | CÓ — nhãn "Của tôi · Của GV · Tất cả", chip **⚠ quá hạn** đã thành ô **Lọc theo hạn** | **CÓ · CŨ** | bước 2: "Quá hạn" nằm ở ô **Mọi hạn ▾** (không còn chip) `HoTroHocVienTab.tsx:489-494` |
| 24 | `phan-cong` (`:182`) | Công việc › Chưa có người phụ trách | Nút việc là **Chọn người phụ trách** (Case) hoặc **Phân công** (lớp thiếu GV) `mywork.ts:1485-1486`; **"Phân công…" KHÔNG có** | **SAI nhãn** | "việc **Chọn người phụ trách** / **Phân công GV {môn}** (mục **Phân công**)" |
| 25 | `van-hanh` (`:188`) | Công việc › Vận hành | Trang `/cong-viec/van-hanh`; vào từ tab **Việc quản lý** › **Vận hành ›** `HoTroHocVienTab.tsx:786`; **+ Giao việc** `:785` | **CÓ** | mô tả lối vào đúng: "tab Việc quản lý" |
| 26 | `bao-cao-tuan` (`:194`) | Công việc › Họp đơn vị | **Họp đơn vị ›** `:787`, trang `MeetingPage.tsx` "Tình hình đơn vị" | **CÓ** | giữ |
| 27 | `phan-tich` (`:200`) | Tổng quan › Phân tích | mục 2 — 5 tab, không 6; khoảng mặc định; Excel mọi tab; In chỉ tab Chi nhánh | **SAI** | viết lại bước (mục 7.4) |
| 28 | `khoi-phuc` (`:206`) | "Tài khoản › Đã xoá" + hd `tai-khoan` | **Không có "Đã xoá" ở menu Tài khoản** (`Header.tsx:351`). Lối thật: menu Tài khoản › **Cấu hình hệ thống** (QL) › tab **Đã xoá** `AdminPage.tsx:37,44`; hoặc `/hoc-vien/luu-tru`. `DaXoaAdmin.tsx:69-82`: cột Mục · Người xoá · Lúc xoá · Giữ đến, nút **Khôi phục**, giữ 30 ngày | **SAI** | `loiChinh.chu` → "Cấu hình hệ thống › Đã xoá" (`duong: /quan-tri?tab=da-xoa`, chi `qt-tab`); bỏ `tatThem: 'Bảng quy đổi band › tab Đã xoá'`; ghi "Hoàn tác" 10 giây hay 5? (xem mục 8) |
| 29 | `tim-kiem` (`:213`) | Ô tìm trên thanh trên | `Header.tsx:187,251`; placeholder **Tìm học viên, lớp, GV…** | **CÓ** | giữ |

(Không đánh số ở bảng trên các luật `luat` / `tu`: xem mục 8.)

## 4. QL — việc THIẾU (chưa có trong `lam`)

| Việc đề xuất (id) | Nhóm | Lối chính | Bằng chứng |
|---|---|---|---|
| `phoi-hop-sos` · Phối hợp SOS: theo dõi / làm thay | case | Công việc › tab **Ý thức & Phối hợp** › mục **Phối hợp SOS** (QL "Tất cả" thấy dòng của mọi GVCN) | `mywork.ts:1308-1330` ("QL bấm thẳng như GVCN"); `tongQuan.ts:46,134`; luật 11/11 khuya: chỉ GVCN làm, **QL theo dõi / làm thay không cần nút**, TVV chỉ báo KQ Meeting CX / GĐCN; dòng QL không có nút "Làm thay" riêng (`DanhSachViec.tsx:204`: `lamThay` false cho `phoi_hop_sos`) → bấm dòng, làm luôn. Lối tắt: hồ sơ lớp / HV › tab **Ý thức & Phối hợp** (`hocVienLop.ts:748`, `hoSoHocVien.ts:25`), `ClassYThucCard.tsx:30-39` ("Vi phạm \| Phối hợp SOS") |
| `y-thuc-duyet` · Duyệt thẻ Ý thức / nhận Báo QL | duyet | đã trong `duyet` — tách bước "thẻ Ý thức: WL 3, Meeting CX/GĐCN, Đình chỉ…" (hiện nằm ở luật `ql-y-thuc-bao`) | giữ trong `duyet`, chỉ sửa chữ |
| `pa-khac-quy-che` · QL trả lời "PA khác quy chế" | duyet | Hộp duyệt › thẻ **PA khác quy chế** (Duyệt / Từ chối…) | `yeuCauDuyet.ts:77` (`giu_pa_gv`, hạn Hạn mặc định gốc 3 ngày; quá hạn máy chốt theo GV; Từ chối → PA quy chế chạy ngay); thẻ thuộc nhóm Học thuật `hoc-thuat` |
| `bao-cao-ph` · Báo cáo PH: viết hộ, thêm / bỏ đợt, xuất | hv | Hồ sơ lớp › tab **Báo cáo PH** (QL viết hộ — `baoCaoPh.ts:20,40`, `vietHo`) | Tab chỉ khi chương trình có mẫu (`hocVienLop.ts:751-753`); **Đợt báo cáo ▾**, **+ Đợt báo cáo**, **Không báo cáo đợt này / Xoá đợt**, **Khôi phục**, **Phần của bạn · Viết {phần} n/tổng**, **Xuất PDF lớp / Xuất Excel lớp**, cột **Xuất** PDF / Excel từng em `TabBaoCaoPh.tsx:116-130,182-188,229-241`; Excel nhiều lớp: Học viên & Lớp › **Xuất Excel** › Mẫu **Báo cáo PH** › Tháng `NganXuatDs.tsx:110-134`; Báo PH kết quả Test lớp thường: GVCN → việc TVV, mục **Báo PH** |
| `ghi-vi-pham` · Ghi vi phạm | hv | Hồ sơ lớp › tab **Ý thức & Phối hợp** › **+ Ghi vi phạm**; ⋯ dòng em › **+ Ghi vi phạm** | `ClassYThucCard.tsx:404`, N26 menu ⋯ dòng em. Luật G3-19 (13/11): GV dạy 1 môn → mặc định môn đó, ≥ 2 môn **bắt chọn**; **chỉ QL (và Quản trị) không dạy môn nào được để trống môn** — cần xác minh chỗ chọn môn ở GĐ2 (`panelYThuc.tsx` / `RecordViolationPanel`) |
| `hang-doi-gvcn-cuoi-khoa` · Cuối khoá lớp thường | hv | Hồ sơ lớp thường › ⋯ › **Cuối khoá…** | `hocVienLop.ts:710`; trang con `?xem=cuoi-khoa` (`duongLoTrinhLop`); ô Hướng: Lên lớp · Học lại · Chuyển lớp · **Tạm dừng/ Kết thúc học** · Chưa có hướng (`CuoiKhoaLop.tsx:211`); hộp điểm "Progress Test: 80 %" / "Final Test: 82 %", ô môn "✓ 18/20" (#1337); **Xét lại lộ trình** (`PanelXetLai.tsx`), Mini Test bổ trợ — hiện chỉ có `chot-lo-trinh` ngắn |
| `chuong-v2` · Chuông: việc cần làm và Cập nhật | khac | Chuông (cạnh "?") | `HopChuong.tsx:163-218`; số chuông = số badge Công việc; "Cập nhật" thay "Để biết"; không thêm đoạn chú thích — chỉ 2 bước |
| `xem-ho-so-gv` · Xem hồ sơ giáo viên | khac | Phân tích › Giáo viên (hoặc Tổng quan › bảng Giáo viên) › bấm tên GV | `App.tsx:405`, `HoSoGiaoVienPage.tsx` (Kỳ xem: Từ tuần → đến; **Việc của {tên} ›**; số Đúng hạn, Đạt kỳ vọng Test, Case có PA; QL / Quản trị sửa kỹ năng `:154`) |
| `giao-hoc-lop` · Lộ trình theo HV | hv | gộp vào `sua-hv` (mục #11) | không tách |

## 5. QL — màn / tab / panel (cột "màn" của `man`)

| Màn | Route | KL | Việc cần sửa |
|---|---|---|---|
| `tong-quan` | `/` | **CÓ · CŨ** | Dải 5 ô: **Việc của tôi ›** (XM 3, `TongQuanV5.tsx:339,457`) + **Đạt MT · Case có PA · Chờ duyệt · Thi tháng này**; "Chỉ số" `ql-tq-cho-duyet` không nhắc "Việc của tôi ›". Khối **Chờ bạn duyệt** có link **Hộp duyệt ›** `:213`; **Lớp cần chú ý** cột Đạt MT · SOS hiện tại · Case chưa PA · Thi tháng này `:230-231`; **Giáo viên** (Hành chính / Học thuật) `:268-273,321` |
| `phan-tich` | `/phan-tich` | **SAI** | 5 tab (mục 2) + công tắc KCK ở ô Đạt Target / Tổng thể; bấm một lần mở panel |
| `hoc-vien` | `/hoc-vien` | **CŨ** | **Xem** (ô chọn chi nhánh / phạm vi) `StudentsPage.tsx:365`; **Fast Track / Lớp thường** `:344-347`; tab **Tất cả · Đang SOS · Lịch thi · Phân công GV** `:447-451`; chip **Thi tháng này**, **Có việc quá hạn**, **Đã thi · chờ KQ**, **Bộ lọc thêm** `:474-481`; nút **Xuất Excel**, **+ Thêm học viên**, ⋯ **Thao tác trang** (+ Lớp mới · Lưu trữ) `:425-441`. Câu "Phạm vi: Lớp tôi dạy · Chi nhánh · Cần làm … Thiếu email" `ql.ts:268` **SAI** (đã thay) |
| `ho-so-lop` | `/hoc-vien/lop/:id` | **CŨ** | Tab **Học viên · Ý thức & Phối hợp · Phân tích lớp · Báo cáo PH** (+ **Tổng kết** nếu lớp đã kết thúc) `hocVienLop.ts:745-755`; nút **Nhập điểm · + Case · ⋯** (M2 §1); ⋯: **Thông tin lớp · Sửa thông tin học viên · + Học viên | Cuối khoá… · Kết thúc lớp | Xuất Excel · Lịch sử · Lịch sử góp ý tuần | Mở lại lớp · Xoá lớp** `:696-725`; dải **Việc của tôi** `ThanhViecLop`; badge n việc quá hạn |
| `ho-so-hv` | `/hoc-vien/:id` | **CŨ** | 3 tab **Học thuật · Ý thức & Phối hợp · Lộ trình & lớp**; ⋯: **Sửa thông tin · Chuyển lớp… · Tạm dừng/ Kết thúc học | Cuối khoá… · Bước tiếp… · Lịch MT · Kết quả thi thật · Quay lại học · Lịch sử | Xoá học viên (Quản trị)** `quanLyHocVien.ts:11-24,53-101`; `ql-hv-menu` (`ql.ts:298`) có "Lưu trữ" SAI |
| `luu-tru` | `/hoc-vien/luu-tru` | **CÓ · CŨ** | thêm nút **Quay lại học** (một / nhiều em), kết quả lô "Xong n/m" `LuuTruPage.tsx:122-160,253` |
| `lich-test` | `/test`, `/test/lich` | **CŨ** | `lt-xuat` (mục #22); thêm **Lịch thi thật ›** `:281` |
| `ke-hoach` | `/test/ke-hoach` | **CÓ** | thêm **Xuất Excel…** cạnh **Xếp nhiều MT…** |
| `diem-lop` | `/test/diem-lop` | **CŨ** | link cũ → panel Nhập điểm lớp; viết "Bạn đang ở: Lịch Test tuần › panel Nhập điểm · {lớp}"; giữ route để phép kiểm phủ |
| `nhap-diem` | `/nhap-diem`, `/bang-diem-thuong` (chuyển hướng), `/mock-test/:id`, `/luot-test/:id` | **CÓ** | giữ |
| `cong-viec` | `/cong-viec` | **CŨ** | thay "Chờ bạn duyệt → Hộp duyệt" mô tả; mục `cv-nhap-ho`: "tab **Chấm điểm**" (không "nhóm Chấm điểm"); thêm bước tab **Ý thức & Phối hợp** |
| `van-hanh` · `bao-cao` | `/cong-viec/van-hanh`, `/cong-viec/bao-cao` | **CÓ** | `muc: []` → thêm 1 mục cho "Việc làm ở đây" nếu phép kiểm đòi |
| `quan-tri` | `/quan-tri` | **CŨ** | mục 9 |
| `ho-so-ca-nhan` · `huong-dan` | — | **CÓ** | giữ |
| **`case-rieng` (mới)** | `/hoc-thuat/case/:id` | **THIẾU** | "Bạn đang ở: Case (link từ thông báo / email); mở hồ sơ HV · panel Case"; không làm ở đây: duyệt → Công việc |
| **`ho-so-gv` (mới)** | `/giao-vien/:id` | **THIẾU** (QL) | "Hồ sơ {GV}: kỹ kỳ xem, số đúng hạn…" ; không làm: nhập điểm hộ → Lịch Test |
| Panel (thêm) | — | **THIẾU** | mục 6 |

## 6. Panel làm việc — đề xuất `PanelHd` cho QL / Admin (mỗi dòng một lý do)

Khung A quyết giá trị `PanelHd` và `KhungPanel hd=`; B chỉ đề xuất theo tần suất dùng của QL / Admin. Hiện có `ngan-case` (QL), `nhap-diem` (QL, Admin). Đề xuất bổ sung (panel QL mở hằng tuần, gõ nhiều):

| Đề xuất `hd` | Panel | Tệp | Vì sao | Vai |
|---|---|---|---|---|
| `duyet` | Duyệt / Từ chối / Xin ý kiến (`KhungPanel loai='Việc · Duyệt'`) | `HopChoDuyet.tsx:409`, `TongQuanV5.tsx:217` | việc hằng ngày của QL; nút đổi theo loại thẻ (Duyệt… , Trả lời…, Huỷ quyết định) | QL |
| `chuyen-lop` | Chuyển lớp / Đề xuất chuyển lớp | `ChuyenLopPanel.tsx:280-293` | nhiều ô, 2 luật (Chuyển ngay không hoàn tác, Reset bậc, Theo luồng) | QL |
| `sua-hv` | Sửa thông tin học viên (có Lộ trình đang học) | `StudentManagePanel.tsx:510` | luật LO-TRINH-THEO-HV, Target lý do, Môn đăng ký | QL, Admin |
| `xuat-excel` | **Xuất Excel** (Học viên & Lớp) · **Xuất Excel…** (Test) | `NganXuatDs.tsx:99`, `NganXuatTest.tsx`, `NganXuatMt.tsx` | 3 panel khác nhau; Mẫu Báo cáo PH / Điểm Test / Lịch Test hay bị hỏi | QL, Admin |
| `buoc-tiep` | Chọn bước tiếp sau thi / Kết quả thi thật | `PanelSauThi.tsx`, `KetQuaThiThatPanel.tsx` | hạn 7 ngày, Gia hạn | QL |
| `cuoi-khoa` | Cuối khoá… (trang con) / Xét lại lộ trình | `CuoiKhoaLop.tsx`, `PanelXetLai.tsx` | thao tác lô, hộp điểm % + câu | QL |
| `xep-lich-mt` | Xếp nhiều MT… / hộp kỹ năng MT (Dời · Vắng · Bỏ khỏi đợt) | `NganXepLichMt.tsx`, `HopKyNang.tsx` | luật vắng / dời (N38) | QL, Admin |
| `bao-cao-ph` | panel Viết báo cáo PH ({phần}) | `TabBaoCaoPh.tsx:367` | QL viết hộ | QL |
| `ghi-vi-pham` | Ghi vi phạm / Xác nhận xử lý | `panelYThuc.tsx` | chọn môn bắt buộc | QL |

Ghi chú: Admin chỉ dùng được `nhap-diem`, `sua-hv` (Sửa thông tin), `xuat-excel`, `xep-lich-mt`; không có `ngan-case` (case.view chỉ xem, `admin.ts` đã không khai panel Case — đúng).

## 7. Luật mới cần soát — kết quả từng dòng

1. **Hộp duyệt / 3 thẻ duyệt hạn chung** — `ql-han-duyet` (`ql.ts:396`: "5 ngày … Dời lịch Test thẻ cũ … Báo QL không hạn") **CŨ**. Mã: `ql_duyet_pa` = Đề xuất PA, xin ý kiến, đề xuất sửa thông tin, xử lý / thu hồi Ý thức, xin xoá, **không cần theo dõi**, **đề xuất chuyển lớp** — "tính cả ngày gửi" (`HanMacDinhAdmin.tsx:24`, gốc 5 ngày `hanMacDinh.ts:14`); `giu_pa_gv` (PA khác quy chế) 3 ngày riêng (`:25`, `:19`). → sửa `ql-han-duyet`: "hạn trả lời lấy từ Cấu hình hệ thống › Hạn mặc định (gốc 5 ngày; PA khác quy chế 3 ngày, quá hạn máy chốt theo GV)".
2. **Hạn mặc định** — tab trong `/quan-tri` (QL xem, Quản trị sửa; `AdminPage.tsx:33,44`, `HanMacDinhAdmin.tsx:86` "Quản trị hệ thống sửa; Quản lý xem."). 15 hạn (`hanMacDinh.ts:11-37`). `ql-cau-hinh` (`ql.ts:368`) liệt kê tab thiếu **Case & SOS** và **Đã xoá** — **CŨ**.
3. **Case & SOS** — tab `Case & SOS` (`AdminPage.tsx:35`, QL xem): nhóm nguyên nhân / PA / mốc SOS. QL **chỉ xem**. THIẾU trong `ql-cau-hinh`.
4. **SOS tạm / PA khác quy chế** — xem #4 và mục 4 (`giu_pa_gv`).
5. **Phối hợp SOS** — mục 4.
6. **Báo cáo PH** — mục 4. Admin: việc "Xuất báo cáo PH · {lớp} · {đợt}" (`xuatBaoCaoPh.ts:264-290`): chỉ vai Admin ở chi nhánh lớp; lớp đủ → hiện 7 ngày kể từ ngày đủ, nút **Xuất lớp**; đợt quá hạn chưa đủ → "thiếu n em" tới 7 ngày; ở tab **Vận hành**, mục **Báo cáo PH** (`tongQuan.ts:50,147`, `HoTroHocVienTab.tsx:565-568`). **QL KHÔNG nhận việc này.**
7. **Phân tích V2 + Excel** — mục 2, #27. Công tắc KCK / "Đạt Target · Tổng thể" (plan 12/11).
8. **Test "Xuất Excel…"** — #22. **Panel Nhập điểm lớp thường** — #21.
9. **Môn chương trình KET / PET** — Quản trị sửa Môn mọi chương trình lớp thường (#1463, MON-CT-1311); QL chỉ xem trong tab **Chương trình** (`AdminPage.tsx:30`). Ảnh hưởng người dùng QL: chữ môn ở Kế hoạch Test, Ghi vi phạm, Cuối khoá đọc bộ môn thật (`session.tsx:127`). THIẾU một câu trong `ql-cau-hinh`: "Chương trình: môn học của KET / PET mặc định L+S · R+W; Quản trị sửa".
10. **Chuyển lớp / Cuối khoá** — #10, #16, mục 4.
11. **Lộ trình theo HV** — #11 (+ #29 của Admin).
12. **Đã xoá** — #28.
13. **Dán Excel chỉ thêm HV** — #12. Mã: Dán còn ở `IntakePanel.tsx`, `BangQuyDoiAdmin.tsx`, `TaiDanhSach.tsx` (Tutor hoãn); không còn ở lưới điểm (grep `cham/`, `fasttrack/` không có "Dán"). `ql.ts` không nhắc Dán Excel điểm → CÓ.
14. **Chuông V2** — mục 4.
15. **Ghi vi phạm** — mục 4 (QL được để trống môn).
16. **Hoàn tác** — `ql.ts` ghi "5 giây" ở 3 chỗ (`:78,210,396-`) **SAI**: `HOAN_TAC_MS = 10_000` (`shared/domain/hoanTac.ts:2`, dùng ở `ui/Toast.tsx:2`). → ghi "10 giây" (hoặc bỏ số: "ngay sau khi xoá"). Quá thời gian: **Đã xoá** (30 ngày).

## 8. Chữ cũ / sai luật — danh sách sửa nhanh (QL)

| Tệp:dòng | Chữ hiện tại | Sửa |
|---|---|---|
| `ql.ts:28-35` | `tatThem: ['Thông báo']` | "Chuông › Chờ bạn duyệt" |
| `ql.ts:41-43` | "Panel Chấm quá hạn" | panel `PanelGvTre`: tiêu đề **Nhập hộ {môn}** / **Nhập điểm {môn}**, nút chính **Nhập hộ** (`PanelGvTre.tsx:75,193`) |
| `ql.ts:49-51` | "Sửa … (chỉ QL)" | "QL · Admin" |
| `ql.ts:56-58` | "Công việc › Của GV › Case học thuật" | giữ nhãn, thêm Lưu nháp / Chọn PA |
| `ql.ts:70-73` | "+ Case cho … ở khối Case & phương án" | CÓ — chỉ thêm lối tắt "**+ Case** đầu hồ sơ" |
| `ql.ts:78` | "Hoàn tác trong 5 giây" | xem mục 7.16 |
| `ql.ts:98` | "Ngay hôm nay → Chuyển ngay (không hoàn tác); tuần khác → Quyết định chuyển lớp" | thêm "Theo luồng chuyển tiếp lộ trình", "Reset bậc vi phạm"; kiểm lại nhãn nút lệnh tuần khác (`ChuyenLopPanel.tsx:260`: **Duyệt và quyết định** khi QL duyệt thẻ; **Lưu / Quyết định…** khi lệnh) |
| `ql.ts:111` | "**+ Lớp mới** · **+ Học viên** (điện thoại: trong ⋯)" | "**+ Thêm học viên** · ⋯ **Thao tác trang** › **+ Lớp mới**" |
| `ql.ts:118` | "⋯ › Lưu trữ · Chọn nhiều học viên › Lưu trữ" | mục #13 |
| `ql.ts:138` | "(hạn 7 ngày) … Hồ sơ lớp › Chốt lộ trình" | mục #16 |
| `ql.ts:172-173,314` | "Xuất Excel: Kế hoạch Test 13 cột … Xuất điểm Test … Điện thoại: Lọc" | mục #22 |
| `ql.ts:179` | "chip ⚠ quá hạn" | ô **Mọi hạn ▾ › Quá hạn** |
| `ql.ts:185` | "nút **Phân công…**" | **Chọn người phụ trách** / **Phân công** |
| `ql.ts:203,255-258` | "Sáu tab: Báo cáo HV · Phân tích GV · Test + SOS · Kết quả Test / Thi · Hiệu quả PA · Ý thức" | 5 tab mới |
| `ql.ts:208-211,367` | "Tài khoản › Đã xoá" | "Cấu hình hệ thống › Đã xoá" |
| `ql.ts:268` | "**Phạm vi**: Lớp tôi dạy · Chi nhánh · **Cần làm** …" | ô **Xem**, chip lọc |
| `ql.ts:298` | "⋯ … Lưu trữ" | bỏ "Lưu trữ", thêm "Cuối khoá… · Bước tiếp… · Lịch MT" |
| `ql.ts:322-325` | "chip Chưa đủ MT" | giữ (đúng) |
| `ql.ts:344` | hàng lọc Hộp duyệt | CÓ (`PHAN_LOAI_LABEL`) |
| `ql.ts:396` | `ql-han-duyet` | mục 7.1 |
| `ql.ts:402` | "Sửa điểm sau hoàn tất" | giữ (luật còn) |
| `ql.ts:421` | `tu` "Chốt lộ trình": "Việc QL trước Final" | giữ; thêm "T5 tuần trước Final" nếu có chỗ |

## 9. `/quan-tri` — chỉ lối QL thật sự dùng

QL vào bằng menu Tài khoản › **Cấu hình hệ thống** (`Header.tsx:362-366`); trang `h1 = "Cấu hình hệ thống"` + dòng "Quản trị hệ thống sửa; Quản lý xem." (`AdminPage.tsx:56-58`); 6 tab chỉ-đọc (`AdminPage.tsx:44`): **Chương trình · Chi nhánh · Band & ngưỡng · Hạn mặc định · Case & SOS · Đã xoá**. `data-hd="qt-tab"` có sẵn (`:57`) — dùng cho "Chỉ cho tôi".

- **Đã xoá** (QL khôi phục) — mục #28.
- **Band & ngưỡng** — QL xem bảng quy đổi (BAND-QUY-DOI, `nav.bangQuyDoi`); tên cũ "Bảng quy đổi band" → **Band & ngưỡng** (`ql.ts:209` SAI).
- **Hạn mặc định**, **Case & SOS** — mục 7.2–3.
- **Chương trình · Chi nhánh** — chỉ xem; KET / PET mục 7.9.
- Không viết gì về Tài khoản · Quyền & nhật ký (việc của Quản trị, giữ `vaiKhac`).

## 10. Admin — bảng việc `lam`, màn, luật

| # | Việc (`admin.ts`) | Đối chiếu mã | KL | Sửa |
|---|---|---|---|---|
| A1 | `nhap-ho` (`:21`) Công việc › Chấm điểm | tab **Chấm điểm** (vai Admin `nhanTabCongViec` `dieuHuong.ts:185`); Lọc **Việc của ai** không có (Admin không có `workApprove`; `chiChamDiem` → `nguoi` mặc định tất cả) — `hd cv-loc-them` nên kiểm có dựng cho Admin | **CÓ · kiểm `data-hd`** | `HoTroHocVienTab.tsx:450` `cv-loc-them` — xác nhận ô "Lọc thêm" có cho Admin (CHI_VAI trong phép kiểm) |
| A2 | `xem-gv-tre` (`:29`) Tổng quan › GV chấm quá hạn | `MockTestAdmin.tsx:57` **GV chấm quá hạn**; số GV mở panel | **CÓ** | giữ |
| A3 | `xem-so-mt` (`:36`) Tổng quan › Mock Test | `MockTestAdmin.tsx:48-53`: **Lượt MT tuần này · Bài chưa nhập điểm · HV chưa đủ MT** + **Việc của tôi ›** đầu dải (XM 3) | **CÓ · THIẾU** | thêm "Việc của tôi ›" (4 ô một hàng) |
| A4 | `xep-lich` (`:42`) Test › Kế hoạch Test | Admin có `plan.week`, `schedule.move`; "⋯: Huỷ điểm · Nhật ký · Xóa lịch — mục 'Chỉ Quản lý'" (`thaoTacMt.ts`) | **CÓ** | giữ |
| A5 | `xem-lich-test` (`:49`) | `LichTestTab.tsx` | **CÓ** | thêm **Xuất Excel…** (A6) |
| A6 | `xuat-test` (`:55`) "Xuất Excel: Kế hoạch Test 13 cột … Xuất điểm Test…" | Admin: `phamViXuatMt` → `chiNhanh` (grant branch) ⇒ **`nav.xuatMt` = true** (`xuatMt.ts` `phamViXuatMt`, `nav.ts:67`); `nav.testPlan` true ⇒ panel có **cả hai tab Điểm Test · Lịch Test** | **SAI · CŨ** | như #22 |
| A7 | `sua-hv` (`:63`) "Target, lộ trình: chỉ xem — Quản lý / TVV sửa" | **Admin đổi được Lộ trình** (không đổi Môn) `monDangKy.ts:59-61` (`duocDoiLoTrinh = duocDoiMon \|\| laAdminCua`), `profile.ts:795-798`; Target: **chưa kiểm** ở Admin (Target sửa thẳng QL / TVV / CX theo `ql.ts:403`; Admin chưa xác minh) | **SAI** | bước 2: "Lộ trình đang học: Admin đổi được (LT1 · LT2 · RF); Môn, Target: Quản lý / TVV" — kiểm Target ở GĐ2 |
| A8 | `lich-thi` (`:69`) | `StudentsPage.tsx:450,440`; Admin: tab **Lịch thi** có (không có **Đang SOS**, `StudentsPage.tsx:449`) | **CÓ** | mẫu **Báo cáo PH** có trong panel Xuất Excel — Admin `VAI_XUAT_BC` có Admin (`baoCaoPh.ts:42`): thêm một câu |
| A9 | `tim-kiem` | CÓ | **CÓ** | giữ |
| A10 | `phan-tich` (`:82`) "Sáu tab" | Admin **4 tab** (không Ý thức) + Excel / In | **SAI** | mục 2 |
| A11 | **THIẾU** `xuat-bc-ph` — Xuất báo cáo PH | Công việc › tab **Vận hành** › mục **Báo cáo PH** (dòng "Xuất báo cáo PH · {lớp} · {đợt}", hiện 7 ngày, nút **Xuất lớp**; dòng thiếu em: **Báo cáo PH ›** mở tab) `xuatBaoCaoPh.ts:264-290`, `HoTroHocVienTab.tsx:565-568`, `TabBaoCaoPh.tsx:287-302` | **THIẾU** | việc mới nhóm `diem`/`hv`, Công việc là lối chính; lối tắt Hồ sơ lớp › tab **Báo cáo PH** (Admin `quyetDot`: **+ Đợt báo cáo**, **Không báo cáo đợt này**, **Xuất PDF / Excel lớp**; **không viết hộ** — chỉ QL, `baoCaoPh.ts:20`); Excel nhiều lớp: Học viên & Lớp › **Xuất Excel** › Mẫu Báo cáo PH |
| A12 | **THIẾU** `thong-tin-lop` — Admin sửa lịch lớp thường | `duocSuaLichLop` có `office_admin` (`permissions.ts:566-573`); hồ sơ lớp thường ⋯ **Thông tin lớp** (`hocVienLop.ts:703`, `canEditSchedule`) | **THIẾU** | một mục ngắn |
| A13 | **THIẾU** `chuong-v2` | Chuông (số = Công việc) | **THIẾU** | như QL mục 4 |

**Màn Admin:**
- `tong-quan` CÓ, thêm "Việc của tôi ›". `phan-tich` SAI (4 tab). `hoc-vien` CÓ — Admin **không có** Đang SOS / Phân công GV: `StudentsPage.tsx:124` `coGocPc = laVaiQuanLy || cx`. `ho-so-lop` CÓ (+ Báo cáo PH, Thông tin lớp). `ho-so-hv` CÓ (⋯: Sửa thông tin · Lịch sử; `Lịch MT` không, `canEdit` false) — kiểm "Lộ trình đang học" ở Sửa thông tin.
- `lich-test` · `ke-hoach` · `diem-lop` · `nhap-diem` CÓ. `cong-viec` — nhãn tab đầu **Chấm điểm** + **Vận hành** (mục **Báo cáo PH**) — thêm. `ho-so-ca-nhan`, `huong-dan` CÓ.
- **THIẾU màn:** `/hoc-thuat/case/:id` (case.view) — mục "Case (chỉ xem)".
- **Panel:** `nhap-diem` (đã có), `sua-hv`, `xuat-excel`, `xep-lich-mt` (mục 6).
- `luat` Admin (`admin.ts:187-190`): "Chỉ Quản lý: … Target, lộ trình" **SAI một phần** (lộ trình Admin có); `han-cham`, `dau-gach` CÓ.
- `vaiKhac` Admin: "Đổi Target, lộ trình — việc của QL" → chỉ "Đổi Target / Môn".

## 11. Kế hoạch giai đoạn 2 (sau khi PTA nhắn A đã merge)

1. `git fetch` + rebase `origin/main`; đọc `CHO_B` + giá trị `PanelHd` mới của A; xoá vai mình khỏi `CHO_B`.
2. `ql.ts`: sửa #1–#29 theo mục 3, thêm 6 việc mới (mục 4), 2 màn mới (`case-rieng`, `ho-so-gv`), 7–9 mục `p-*` (mục 6), sửa `ql-han-duyet`, `ql-cau-hinh`, nhãn mục 8.
3. `admin.ts`: sửa A6–A10, thêm A11–A13, màn `case-rieng`, mục `p-*`, `luat`.
4. `qt.ts`: kiểm lại QT dùng lại `ql.ts` (không sửa nội dung Quản trị — ngoài phạm vi); chạy lại HD-NAV cho vai `qt`.
5. `data-hd`: cần thêm cho (a) `qt-tab` đã có · (b) ô **Xem** / nút Xuất Excel ở Học viên & Lớp (`hvl-xuat` có) · (c) nút **Xuất Excel…** của Lịch Test / Kế hoạch Test (**chưa có `data-hd`**, `LichTestTab.tsx:277`, `KeHoachTestTab.tsx:229`) · (d) tab **Báo cáo PH** hồ sơ lớp · (e) số chuông. Đề xuất tên: `test-xuat`, `lop-bc-ph`.
6. Phép kiểm: nhãn `<b>…</b>` phải có trong nguồn web (nếu A làm).
7. Kiểm `npm run check`, ảnh 1440 + 375 (tối): "?" ở **panel Duyệt** và **Xuất Excel…** (2 chỗ mới).

## 12. [XM] / điều cần PTA / A trả lời

- **[XM-1]** `ql.ts:78,210` "5 giây" → "10 giây" (`HOAN_TAC_MS`); B sửa theo mã, không cần hỏi — ghi để PTA biết.
- **[XM-2]** Thêm mục `PanelHd` nào do **A** quyết; B đề xuất 9 panel (mục 6). Nếu A chỉ cho 3–4 giá trị, B giữ `duyet`, `xuat-excel`, `chuyen-lop`, `sua-hv`.
- **[XM-3]** `ql.ts` có `luat` / `tu` — chỉ sửa 2 dòng (`ql-han-duyet`, `chot-lo-trinh`) hay rà cả `luat`? B làm sửa nhỏ, không rà tất.
- **[XM-4]** Admin sửa Target? (`student.edit_info` chỉ thông tin; chưa kiểm hàm Target) — B kiểm ở GĐ2, ghi kết quả.
- **[XM-5]** `qt.ts` dùng lại `ql.ts`: mọi sửa `ql.ts` đi theo QT; việc Quản trị hệ thống (Tài khoản, Quyền, Chương trình sửa) **không** đụng (anti-goal đề bài). Đồng ý.
- **Chưa xác minh (ghi để không coi là đạt):** chỗ chọn môn ở "Ghi vi phạm" (QL để trống được); Admin có Lưu trữ / Tạm dừng / sửa Target không; nhãn nút lệnh Chuyển lớp "tuần khác"; bản Anh (`t()`) của chữ mới sẽ kiểm ở GĐ2 bằng `tsc`.

## 13. Đính chính + kết quả giai đoạn 2 (PR HD-V3-B)

- Đính chính mục 1: Admin **vào được** `/hoc-vien/luu-tru` (ô tìm "Tìm trong HV lưu trữ ›"; phép HD-ROUTE xác nhận) — đã thêm màn `luu-tru` và `ho-so-gv` cho Admin.
- Đã làm: sửa `ql.ts`, `admin.ts` theo mục 3–10; màn mới `ho-so-gv` (QL, Admin), `luu-tru` (Admin); panel `ket-qua-pa · phoi-hop-sos · vi-pham · xu-ly-vi-pham · ban-giao · bao-cao-ph · chuyen-lop · xuat-excel · lo-trinh` (QL), `xuat-excel` (Admin); `data-hd="test-xuat"`; bản Anh `shared/i18n/en/hdV3b.ts`; phép kiểm: bỏ `CHO_B`, `NHAN_VAI` thêm `ql`, `admin`.
- Không làm (đã chốt): `/hoc-thuat/case/:id` không cần màn (phép HD-ROUTE: link Case chuyển sang hồ sơ HV hoặc panel Case); `qt.ts` giữ nguyên (chủ SP 13/11).
