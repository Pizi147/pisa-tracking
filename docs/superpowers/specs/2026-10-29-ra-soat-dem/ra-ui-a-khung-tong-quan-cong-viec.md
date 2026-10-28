# RA-UI · Phụ lục A — Khung app · Tổng quan · Công việc · Hồ sơ cá nhân · Hướng dẫn · Quản trị

> Agent đọc mã (29/10, `main` `42c629ed`), **chưa bấm thử**. "Cần soi" = điểm rủi ro để chụp / kiểm, chưa phải lỗi đã xác nhận.
> Quyền: QL, QT → Chờ duyệt · Hỗ trợ HV · Vận hành · Họp đơn vị; GV / GVCN → Hỗ trợ HV · Yêu cầu của tôi; Admin VP → chỉ `ho-tro` (nhãn "Chấm điểm"); TVV → `ho-tro` việc của mình; CX → không Công việc.
> `/quan-tri`: QT 4 tab; QL chỉ `?tab=band` chỉ đọc.
> **Chụp trạng thái rỗng / lỗi / đang tải:** DemoBar › Công cụ demo › **Kịch bản giao diện** (Bình thường · Đang tải · Không có dữ liệu · Lỗi khi tải · Không lưu được — `platform/DemoBar.tsx:17-21,115`).
> **Bề rộng chụp thêm:** 768, 1099 / 1100 (bố cục đổi 1 ↔ 2 cột), 1439 / 1440 (ô tìm đổi từ nút sang ô nhập; GV 3 cột).

## A1. Khung app (mọi trang)
| # | Phần | Loại | Vai | Mở | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|---|
| 1 | Thanh xanh trên (≥ 768) | thanh | mọi vai | | App.tsx:127-164, 292-305 | mục dồn vào "Thêm ▾" ở 1024–1280 / zoom 125 %; số cạnh Công việc; "Bản demo nội bộ" ≥ lg |
| 2 | "Thêm ▾" | menu | QL/QT khi hẹp | thu còn ~1100 | App.tsx:116-152 | nhãn "Công việc · n" |
| 3 | Thanh dưới 375 | thanh dính | vai ≥ 2 khu | | App.tsx:166-193, 368-382 | `labelNgan` cắt; vị trí số; chạm 56 px |
| 4 | Logo + đầu 52 px ở 375 | thanh | | | App.tsx:293-300 | chật với 3 nút phải |
| 5-8 | Tìm (≥ 1440 ô, < 1440 kính lúp → ô nổi) + kết quả Học viên / Lớp / GV + không thấy | ô / popover / listbox | vai có `students` | Ctrl K, "/" | platform/Header.tsx:35-281 | kbd đè chữ gõ; chân "↑ ↓ chọn · Enter mở · Esc đóng" xuống dòng 375 |
| 9-13 | Chuông "99+" · hộp Thông báo (Cần làm / Để biết) · rỗng · lỗi · toast | nút / popover | mọi vai | | Header.tsx:285-362 | số cắt; tiêu đề dài; 375 cao 70 vh |
| 14-19 | Menu tài khoản: Góc nhìn · Sáng / Tối / Theo máy · Ngôn ngữ · GVCN / Kỹ năng · Hồ sơ GV / Quản trị / Bảng quy đổi · Đăng xuất | popover | mọi vai | bấm tên (375: tròn 30 px) | Header.tsx:367-468; ui/CongTacGiaoDien.tsx:20 | nhiều nút dọc; chip "Phạm vi được cấp" dài; phạm vi bị cắt |
| 16 | Dải "Góc nhìn: {vai} · {phạm vi}" + "Về {vai}" | dải | vai kiêm nhiệm | | App.tsx:307-320 | |
| 20 | "Hướng dẫn · {màn}" | panel 480 | mọi vai | menu TK | huongDan/NutHuongDan.tsx:29 | rỗng có câu |
| 21-24 | DemoBar + "Chọn tài khoản demo" (Modal 3xl) + "Công cụ demo" (Modal xl) + "Nạp lại dữ liệu mẫu" | dải / hộp | bản demo | | platform/DemoBar.tsx:55-140 | câu giải thích (chỉ bản demo — không lên bản chính) |
| 25-28 | Dải mất kết nối · toast "Chưa tải lại được" · lỗi trang "Trang gặp lỗi khi hiển thị." · khung chờ | dải / lỗi | | | App.tsx:26-41, 202-325 | câu dài ở dải mất kết nối |
| 30-31 | ErrorState / Empty / Forbidden · hỏi "Bỏ chữ, đóng" | | | | ui/ui.tsx:262-320; ui/KhungPanel.tsx:227-270 | |

## A2. Tổng quan `/` (`worklist/TongQuanV5.tsx`, `OverviewPage.tsx`)
| # | Phần | Loại | Vai | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|
| 32 | đầu: h1 · phạm vi · Wxx · kỳ · khung + chi nhánh | trang | mọi vai | TongQuanV5.tsx:43-53; OverviewPage.tsx:41-63 | mã tuần đậm màu nhấn; 375 bộ chọn hết dòng |
| 33 | "Mới dùng PISA TRACKING? …" Xem / Ẩn | dải | người mới | huongDan/DaiMoiDung.tsx:11 | chữ đậm |
| 34-35 | QL 4 ô Đạt MT · Case có PA · Chờ duyệt · Thi tháng này + ⓘ | dải ô | QL (QT có `?cn=`) | :259-278 | 375 hai cột; "– Chưa có dữ liệu" |
| 36-37 | "Lớp cần chú ý" (SOS 260 px) + rỗng | bảng | QL, CX 1 chi nhánh | :159-201 | chip SOS + "n HV" xuống dòng; rỗng 2 câu |
| 38 | "GV cần chú ý" + công tắc Hành chính / Học thuật ở đầu thẻ | bảng | QL có chi nhánh | :225-257 | |
| 39-40 | "Chờ bạn duyệt · n" + panel "DUYỆT" | thẻ + panel 480 | QL/QT | :125-155 | dòng cắt; nhiều nút một hàng |
| 41 | "Điều hướng" (`DiTiep`) | thẻ | mọi vai | :86-102, 283-290 | số đậm đầu dòng |
| 42-43 | panel số `?so-lieu=` · `PanelGvTre` | panel 480/720 | | ui/OSo.tsx:31; worklist/PanelGvTre.tsx:81-178 | tiêu đề dài; h3 dính 15 |
| 44-46 | QT toàn hệ thống: 4 ô · "Theo chi nhánh" + "Toàn hệ thống" · Điều hướng | dải / bảng | QT | :298-361 | bảng 750 → thẻ 375 |
| 47-48 | CX: "· chỉ xem"; ô "Chờ KQ · bước tiếp" (a·b) · Theo chi nhánh / Lớp cần chú ý | dải / bảng | CX | :303-393 | "a·b" khó đọc |
| 50-55 | GV: 4 ô · "Kỹ năng tôi dạy" · GVCN "Lớp tôi chủ nhiệm" · Điều hướng · rỗng chưa phân công | dải / bảng | GV, GVCN | :403-426; worklist/LopToiDay.tsx:147-239 | mã lớp cắt; lưới 3 cột ≥ 1440, 2 cột 1100–1439; rỗng 2 câu |
| 56-57 | TVV: 3 ô · "Thi thật" + Điều hướng | dải / thẻ | TVV | :434-463 | |
| 58-61 | Admin VP: 3 ô MT · "GV chấm quá hạn" · "Lịch sắp tới" (tab tuần) · Điều hướng | dải / thẻ | Admin | worklist/MockTestAdmin.tsx:29-80; Highlights.tsx:74-152 | **h2 15 vs tiêu đề thẻ 17** |

## A3. Công việc `/cong-viec/:tab?`
| # | Phần | Loại | Vai | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|
| 62 | đầu: h1 + "n nhóm · n việc · n HV · n bài · CN" + "n chờ bạn duyệt" + "✓ n xong hôm nay" | trang | GV…TVV | congViec/HoTroHocVienTab.tsx:319-332 | h1 `text-[22px]` thô; **4 `<b>` một dòng** |
| 63-65 | hàng lọc: Việc của ai · Người phụ trách (popover) · khung · chi nhánh · "Mọi hạn" · chip ✕ | bộ lọc | QL/QT (Admin bớt) | :333-360; ChonPhuTrach.tsx:23 | **nhiều điều khiển ở 375** |
| 66, 74 | "👁 Đang xem việc của {GV} — chế độ theo dõi." · "👁 Việc của {ai} — chỉ theo dõi." + Làm thay / Nhập hộ | dải | QL/QT | :361-363, 492-503 | emoji |
| 67 | "Chờ bạn duyệt" + `HopChoDuyet` gọn | nhóm gập | QL/QT | :367-373 | |
| 68-69 | nhóm việc ba tầng (V18) + "Bài thi Speaking tuần này" | danh sách | mọi vai | congViec/DanhSachViec.tsx:86-357 | tên việc cắt; nút dòng rộng; **h2 nhóm 15** — so mockup `v7/cong-viec-2.html` |
| 70 | "Việc quản lý" + "+ Giao việc · Vận hành › · Họp đơn vị ›" | nhóm | QL/QT | :401-406, 506-515 | |
| 71 | "Gia hạn" → `HopGiaHan` | Modal 440 | TVV/QL | students/HopGiaHan.tsx:21 | |
| 72-77 | cột phải rỗng · panel việc tại chỗ (< 1024 toàn màn + "‹ Công việc") · "Em này còn:" · dải "✓ … Hoàn tác" · thẻ "Hết việc {nhóm} của bạn" | panel | mọi vai | :239-486; PanelViec.tsx:109-206; ui/KhuonViec.tsx:216 | nút "Em này còn" xuống dòng; chữ 17 đậm |
| 78-81 | rỗng / không phạm vi / "Xong hết hôm nay ✓" / lỗi | | | :377-392 | |
| 82-83 | cuối trang GV: Yêu cầu của tôi gọn · `LopToiDay` cũ (bảng 8–9 cột) | khối | GV, GVCN | duyet/YeuCauCuaToi.tsx:20; worklist/LopToiDay.tsx:28-125 | **bảng rộng 375–768; trùng Tổng quan GV (G8)** |
| 84 | Admin: tab "Chấm điểm" mà h1 "Công việc" | trang | Admin | dieuHuong.ts; HoTroHocVienTab.tsx:320 | nhãn lệch |
| 85 | TVV: Báo PH / Sau thi / Chốt ngày thi / Bổ sung hồ sơ | danh sách | TVV | :517-527 | |
| 86-98 | panel việc: NganCase · Xác nhận PA cùng lúc · ghi KQ nhanh · Chấm Speaking · Nhập điểm · Bàn giao · Ý thức · Vận hành (720) · Cập nhật tiến độ · Sau thi · Chốt ngày thi · Báo PH + ⋯ · Phối hợp SOS / Sửa thông tin / Xét lại / Phân công | panel 480/720 | theo vai | PanelViec.tsx:144-524; XacNhanPaLo.tsx:140; PanelChamSpeaking.tsx:61; MgmtTasksPage.tsx:278-517; PanelSauThi.tsx:32-261; PanelBaoPhTvv.tsx:43 | Vận hành: 3 nút một hàng, câu gợi ý dài; Sau thi: chân dài "Đã lưu {giờ} · Việc xong · Hoàn tác · Đóng · Việc kế…" |
| 99-101 | Giao việc · Việc con · Sửa công việc | panel 480/720 | QL/QT | MgmtTasksPage.tsx:569-819 | **đoạn giải thích dài `<strong>`/`<em>` (:776-781)** |
| 102-108 | `/cong-viec/cho-duyet`: lọc Trạng thái + Loại · danh sách \| panel "VIỆC · DUYỆT · {LOẠI}" · rỗng · thẻ yêu cầu (Duyệt / Từ chối… / Trả lời… / + Thêm PA / Mở / Sửa… / Rút / Huỷ quyết định) · form trong thẻ | trang | QL/QT | duyet/HopChoDuyet.tsx:160-242; TheYeuCau.tsx:195-333 | chip tràn 375; **nhiều nút một hàng**; câu gợi ý |
| 109-110 | `/cong-viec/yeu-cau` + rỗng | trang | GV/GVCN | YeuCauCuaToi.tsx:34-46 | |
| 111-113 | `/cong-viec/van-hanh`: hàng số (gợi ý ở `title`) · bảng 52rem · rỗng / Forbidden | trang | QL/QT | MgmtTasksPage.tsx:68-202 | gợi ý chỉ ở tooltip (điện thoại không có); cuộn ngang 375 |
| 114-120 | `/cong-viec/bao-cao` Họp đơn vị: Kỳ · chip chi nhánh · bảng 46rem · Việc được giao · Việc đang tồn · panel nộp báo cáo · chọn việc | trang | QL/QT | worklist/MeetingPage.tsx:56-482; ManagerTasks.tsx:30; SignalList.tsx:35 | chip tràn 375; câu dài `<strong>`; rỗng dài |

## A4. Hồ sơ cá nhân · Hướng dẫn · Quản trị · Dev
| # | Màn | Loại | Vai | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|
| 121-124 | `/ho-so-ca-nhan`: Thông tin liên hệ · Vai trò và phạm vi · Đổi mật khẩu | trang max-w-3xl | mọi vai | platform/ProfilePage.tsx:105-186 | gợi ý cả câu; **nút trùng tiêu đề thẻ "Đổi mật khẩu"**; `<b>` |
| 125-126 | `/huong-dan`: mục lục 232 · Xem vai · In · tìm · chip phần · mục gập | trang | mọi vai | huongDan/HuongDanPage.tsx:62-110 | **tiêu đề màn h3 12 px, nhảy cấp từ h1** (:43) |
| 127-128 | `/quan-tri` h1 + câu "Tài khoản, danh mục và cấu hình quyền…" + 4 tab · QL chỉ Bảng quy đổi | trang | QT / QL | platform/AdminPage.tsx:44-73 | câu phụ dưới h1 |
| 129-136 | Tài khoản: Đăng ký chờ duyệt · lọc + "+ Tạo tài khoản" · bảng · ⋯ · panel Tạo / Sửa (720) · Sửa thông tin · Duyệt lại · Xoá tài khoản | thẻ / bảng / panel | QT | platform/AccountsAdmin.tsx:64-700; XoaTaiKhoanPanel.tsx:44 | email dài, bảng rộng 375; `<th>` trống; rỗng câu dài |
| 137-138 | Chương trình: bảng / danh sách 375 · panel | | QT | platform/CatalogAdmin.tsx:85-411 | |
| 139-141 | Bảng quy đổi: thẻ · Áp dụng · Lịch sử phiên bản · xác nhận khôi phục · panel Sửa (720) | | QT / QL | platform/BangQuyDoiAdmin.tsx:61-383 | thẻ tràn mép 375; câu trợ giúp dài |
| 142-146 | Quyền & nhật ký: 4 ô 28 · Quyền theo vai (bảng ≥ 640 / chip) · khối giải thích · xác nhận lưu · Đơn vị báo cáo · Nhật ký | | QT | AdminPage.tsx:81-399 | **khối giải thích nhiều câu + `<strong>`**; Th gợi ý rất dài |
| 147-149 | `/dev/thanh-phan` bảng mẫu V5 + `?cu=1` sân mẫu cũ (6 trạng thái, panel mẫu, chọn tuần trong panel / hộp) | trang dev | | dev/ThanhPhanDemo.tsx; BangMauV5.tsx | dùng để chụp thành phần chung |

## A5. Kết quả tìm nhanh
- ↗: chỉ `HopKhoiPhucKetQua.tsx:100` (+ EN `shared/i18n/en/r1En.ts:161`); `index.css:477-485` luật chết.
- h1: mọi trang trong vùng `text-xl` ✓; `HoTroHocVienTab.tsx:320` viết thô `text-[22px]`.
- Tiêu đề khối lệch cỡ: `Card` h2 17 nhưng `MockTestAdmin.tsx:53`, `DanhSachViec.tsx:162` h2 15.
- Gợi ý chỉ ở `title` (375 không xem được): MgmtTasksPage.tsx:137-150 · AccountsAdmin.tsx:179-184 · AdminPage.tsx:256-264.
- Đậm quá nhiều: HoTroHocVienTab.tsx:324-326 · AdminPage.tsx:342-355 · MgmtTasksPage.tsx:779 · ProfilePage.tsx:156,183 · `DiTiep` TongQuanV5.tsx:103.
- Câu giải thích trên màn: AdminPage.tsx:56,106,336-357 · MeetingPage.tsx:170-182 · ManagerTasks.tsx:37 · YeuCauCuaToi.tsx:39 · BangQuyDoiAdmin.tsx:94,109,328 · MgmtTasksPage.tsx:493,776-781.
- Bảng rộng ở 375: Vận hành 52rem · Họp đơn vị 46rem · Tài khoản · LopToiDay cũ.
- Nhiều nút một hàng: TheYeuCau.tsx:270-290 · lọc Công việc :333-352 · chi tiết Vận hành :341-345 · chip chi nhánh MeetingPage.tsx:159.
