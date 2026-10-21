# 02 — Rà soát route, màn, thành phần → GIỮ / SỬA / GỘP / BỎ

> V5-A, 22/10. Đọc mã trên `main` (e3965ae7). Router `web/src/App.tsx:294-325`; menu theo vai `server/src/platform/nav.ts:14-51` → `shared/domain/dieuHuong.ts:46-71`.
> Quyết định ở đây là **[ĐX] đề xuất thiết kế** trừ dòng ghi **[CHỐT]** (brief C01–C23 / 01-quyết định). Không đổi quyền, không đổi nghiệp vụ.

## 1. Route / màn

| Route | Màn (component) | Quyết định | Lý do (một dòng) |
|---|---|---|---|
| `/` | Tổng quan `worklist/OverviewPage` | **SỬA (làm lại)** | [CHỐT C04] tình hình theo vai, bố cục B (`07` mục 2); bỏ khối việc / form giữa trang |
| `/` (GV) | hiện chuyển `/cong-viec` (`OverviewPage.tsx:71`, `nav.ts:34`) | **SỬA** [ĐX] | brief 6.4 muốn GV có Tổng quan (tiến độ cá nhân, kỹ năng tôi dạy ↔ lớp tôi chủ nhiệm); chỉ đổi cờ nav, không thêm quyền |
| `/` (TVV) | `HocVienCuaToi` (`OverviewPage.tsx:60-67`) | **SỬA** | [CHỐT brief 6.5] thay bảng "HV của tôi" dàn trải bằng nhóm cần chú ý + 4 chỉ số |
| `/` (Admin) | `MockTestAdmin` + `LichSapToi` (`:82-86`) | **SỬA** | brief 6.6: độ đủ lịch Test / phân công + thiếu sót vận hành |
| `/` (CX) | ô số + `BranchPulse` + `HocVienCuaToi` (`:120-146`) | **SỬA** | theo B; bỏ nhánh `workApprove` chết ở `:124` (CX không có quyền này) |
| `/hoc-vien` | HV & Lớp `students/StudentsPage` | **SỬA** | [CHỐT C18, brief 12] hàng lớp gọn, W + "W1 · W2" dòng phụ, nhiều việc một HV, SOS có chú giải |
| `/hoc-vien/lop/:classId` | Hồ sơ lớp `classes/ClassOverviewPage` | **SỬA** | [CHỐT C17, C18] tách W1 / W2, làm việc + đánh giá đầu ra trong panel; Ý thức & Phối hợp phân cấp màu |
| `/hoc-vien/luu-tru` | Lưu trữ `LuuTruPage` | **GIỮ** (đổi màu) | đúng mục đích, ít dùng |
| `/hoc-vien/:id` | Hồ sơ HV `StudentDetailPage` (tab Học thuật · Ý thức & Phối hợp · Hành trình) | **SỬA** | brief 11: thanh Việc cần làm trước bảng, Hành trình theo từng kỹ năng, W1 / W2, dữ liệu trên lớp tuỳ chọn |
| `/hoc-thuat/case/:id` | `CaseBoardPage` | **GIỮ** (đổi màu, nút động từ) | trang riêng cho Case dài là bậc 5 hợp lệ (G5) |
| `/test/lich` | Lịch Test / Chấm Test `TestPage` | **SỬA** | [CHỐT C13, C14] một tuần + chuyển tuần, bỏ ba khung lịch; tình trạng chấm trong lịch cho QL / Admin; Chấm Test 4 nhóm |
| `/test/ke-hoach` | Kế hoạch Test `KeHoachTestTab` | **GIỮ** (+ sửa) | [CHỐT C20] nơi duy nhất thêm MT4+; xem `bỏ` dòng "Tạo MT4" xem trước ở mục 3 |
| `/test/diem-lop` (cũ) | đã gỡ, link cũ mở `PanelNhapDiemLop` | **GIỮ** chuyển hướng | đã gộp (OV-15b) |
| "Tình trạng chấm" | **không có trong mã** (grep rỗng) | — | brief C13 yêu cầu bỏ tab riêng — mã đã không có; tình trạng nằm ở Công việc (nhóm Chấm điểm) + "Trễ chấm" Tổng quan QL → V5 đưa vào Lịch tuần |
| `/nhap-diem/:classId`, `/bang-diem-thuong/:classId` | `ChamDiemPage` | **GỘP** vào Lịch tuần / panel chấm | brief 8.2 "không bắt đổi trang chỉ để nhập một ô"; giữ route làm chuyển hướng |
| `/mock-test/:id` | `MockDetailPage` | **GIỮ** (đổi màu) | chi tiết một lượt; mở từ tên lượt |
| `/cong-viec` | Công việc `CongViecPage` (một danh sách, 4 nhóm `NHOM_VIEC`) | **SỬA** | brief 7: một nguồn việc, đếm "việc / bài / HV" rõ, việc của người xem trước; QL xem người khác = chỉ xem |
| `/cong-viec` (TVV) | **chưa có** (`work.view` thiếu — `server/src/seed/data.ts:99-103`) | **THÊM** [CHỐT C05] | TVV có Công việc riêng: Báo PH + Sau thi. Cần cờ nav + quyền xem việc của chính mình — xem `03` mục 3 |
| `/cong-viec/cho-duyet` | `cho-duyet` | **GỘP** vào Công việc + cột "Chờ bạn" Tổng quan QL | một nguồn, hai lối vào, cùng panel duyệt |
| `/cong-viec/yeu-cau` | `yeu-cau` | **GIỮ** | GV xem yêu cầu đã gửi |
| `/cong-viec/van-hanh` | `van-hanh` | **GIỮ** | việc vận hành |
| `/cong-viec/bao-cao` | `MeetingBoard` "Báo cáo đơn vị" | **SỬA tên** [ĐX] | trùng chữ "Báo cáo" với Phân tích › Báo cáo → đổi "Họp đơn vị" (một khái niệm một tên) — [XM] chủ SP xác nhận tên |
| `/phan-tich` | Phân tích 6 tab (Báo cáo · Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức) | **SỬA** | [CHỐT C22] Báo cáo tách HV / GV; số mở panel chỉ đọc; [CHỐT C07] Phân tích GV = một bảng hai nhóm cột |
| `/phan-tich` Kết quả thi | `KetQuaThi` | **SỬA** | [CHỐT C16] "Cập nhật KQ thi thật" chuyển sang Sau thi (Công việc TVV / hồ sơ HV); ở đây chỉ đọc |
| `/tutor` | `TutorPage` | **GIỮ** (đổi màu, tỷ lệ kèm mẫu) | brief 16 |
| `/giao-vien/:id` | Hồ sơ GV `HoSoGiaoVienPage` (một trang, đếm nhóm → Công việc) | **SỬA (làm lại)** | [CHỐT C06] Hành chính + Giảng dạy – Học thuật, phương án C (`07` mục 3) |
| `/quan-tri` | Quản trị (Tài khoản · Chương trình · Quyền & nhật ký) | **GIỮ** (đổi màu) | ngoài phạm vi UX đợt này |
| `/ho-so-ca-nhan` | `ProfilePage` | **GIỮ** | |
| `/huong-dan` | `HuongDanPage` | **SỬA** sau | cập nhật chữ theo màn mới ở giai đoạn C |
| `/dev/thanh-phan` | `ThanhPhanDemo` | **GIỮ** (chỉ bản dev) | thay bằng bảng mẫu V5 khi code |
| Thanh trên | `platform/Header.tsx`: tìm kiếm (`:137-199`), chuông (`:213-274`), menu tài khoản | **SỬA** | brief 7: chuông = thông báo chưa đọc (dấu riêng), badge Công việc = số việc; không trộn hai nghĩa |
| Thanh dưới 375 | `chiaThanhDuoi` (`dieuHuong.ts:89`) | **GIỮ** | tối đa 5 nút; kiểm T21 (bàn phím không che nút lưu) |

## 2. Thành phần `web/src/ui`

| Thành phần | Quyết định | Lý do |
|---|---|---|
| `Bang.tsx` | **GIỮ** (đổi token) | một bảng cho cả hệ, đã đúng 44 / 64 px, căn theo kiểu cột, thẻ ở 375 — bảng mẫu V5 mục 5 bám nó |
| `KhungPanel.tsx`, `KhuonViec.tsx` | **GIỮ + SỬA** | khung đúng; thêm dòng "loại panel" (VIỆC / BÁO CÁO · CHỈ ĐỌC) + chân trạng thái lưu thống nhất |
| `Drawer.tsx` (Modal, ConfirmDialog) | **GIỮ** | chỉ để xác nhận hậu quả lớn |
| `Nhan.tsx` (`CHIP_TRON`, `CHIP_VUONG`, `QuaHan`, `ChipHan`) | **SỬA** | thay bằng 4 nhóm badge một kích thước (bảng mẫu mục 3); chiều cao 18 → 22 |
| `ChipSos.tsx` | **SỬA** | SOS vàng → cam → **đỏ** (bỏ magenta trùng hồng nhận diện); cùng họ viền với Đạt [CHỐT C23] |
| `KetQuaDot.tsx`, `ODiem.tsx`, `OMt.tsx` | **GIỮ** (đổi token) | ô điểm một mẫu, ✓ / ✗ trước số; thêm dòng phụ W1 · W2 nơi thiếu |
| `TyLe.tsx` | **SỬA** | đảo thứ tự: **% to trước**, "n/N đơn vị" dưới [CHỐT C03]; giữ "Chưa có dữ liệu", "mẫu nhỏ" |
| `SoLieu.tsx`, `SoLieuO.tsx`, `OSoNho.tsx` | **GỘP** → một `OSo` | một dáng "số gạch chân → panel chỉ đọc" (G6) |
| `SaveState.tsx` | **GIỮ + SỬA** | một chỗ hiện đang lưu / đã lưu / lỗi / chưa lưu ở chân panel |
| `ONgay.tsx`, `LichNho.tsx` | **GIỮ** | luật ô ngày 06/10 |
| `ChonNgay.tsx` | **BỎ** dần | lớp bọc cũ quanh `ONgay` |
| `Filters.tsx` (`WeekPicker`…) | **SỬA** | Lịch tuần: một tuần + ‹ › ; báo cáo: Từ tuần – Đến tuần |
| `HangTab.tsx`, `HangNhom.tsx`, `MenuDong.tsx`, `Menu.tsx` | **GIỮ** | |
| `CongTacKhung.tsx` (FT / Thường / Tất cả) | **GIỮ** | |
| `ViecTiep.tsx` | **SỬA** | nút động từ thay "Mở" (brief 5.3) |
| `DongThoiGian.tsx`, `LichSuThayDoi.tsx` | **GIỮ** | lịch sử gập trong panel |
| `PeoplePicker`, `OKhac`, `loiForm`, `TepCho`, `BangChung`, `NutLuat`, `PhanTrang`, `ThanhTruocSau`, `Toast`, `BieuTuong`, `chu.ts`, `giuFocus`, `useBamNgoai` | **GIỮ** | không chạm bố cục |
| `ui.tsx` `KpiTile` | **SỬA** | thành ô chỉ số V5 (28 px + mẫu số) |
| `index.css` token | **SỬA** | ánh xạ `v5-nen.css` (tên mới ↔ biến cũ) ở PR nền đầu giai đoạn C |

## 3. Thứ trong mã trái brief — cần BỎ

| Ở đâu | Là gì | Quyết định |
|---|---|---|
| `server/src/worklist/metrics.ts:868-881`, `shared/domain/tongQuan.ts:118`, `server/src/phanTich/baoCao.ts:137` | chỉ số "học viên FT xong MT3, chưa có MT kế tiếp" hiện ở Tổng quan Cần xử lý + Báo cáo chú ý | **BỎ** [CHỐT C20] — đây là gợi ý MT4 tự động; giữ cho HV chưa có **ngày thi** thì đổi tên "Xong MT mặc định · chưa có lịch thi" ([XM] chủ SP có cần dòng này không) |
| `shared/domain/keHoachTest.ts:284-299` | panel Xếp lịch MT xem trước "Tạo MT4" khi MT3 xong | **SỬA**: chỉ hiện khi QL chủ động chọn thêm lượt, không tự đề xuất |
| `shared/domain/phanTichGv.ts:83-87` | màu < 50 đỏ / 50–69 vàng / ≥ 70 xanh ở Phân tích GV | **BỎ màu ngưỡng** [CHỐT C08 "không tự xếp loại"] — giữ số + mẫu nhỏ |
| `server/src/classes/phanTichLop.ts:149-152` (`danhGiaMon` theo kỹ năng) | Phân tích GV tính kỹ năng dưới kỳ vọng là chưa đạt kể cả khi Overall đạt | **SỬA** [CHỐT C09, C10, brief 15] — logic báo cáo, giai đoạn C |
| `web/src/modules/worklist/OverviewPage.tsx:124` | nhánh `workApprove` cho CX (không bao giờ đúng) | **BỎ** (mã chết) |
| `server/src/permissions.ts:477` | chữ lỗi "Chỉ Quản lý mới chốt được tuần MT" nhưng Admin cũng có `plan.week` | **SỬA chữ** (không đổi quyền) |
