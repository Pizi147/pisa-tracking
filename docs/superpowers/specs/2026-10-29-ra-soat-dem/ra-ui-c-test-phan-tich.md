# RA-UI · Phụ lục C — Test · hồ sơ lượt · Phân tích · thành phần chung

> Agent đọc mã (29/10, `main` `42c629ed`), **chưa bấm thử**. "Cần soi" = điểm rủi ro để chụp / kiểm, chưa phải lỗi đã xác nhận.

## C0. Tab theo vai (`dieuHuong.ts:118-127`, `server/src/platform/nav.ts:16-56`)
| Vai | /test | /phan-tich | /mock-test · /luot-test |
|---|---|---|---|
| GV / GVCN | Chấm Test · Lịch Test tuần · Kế hoạch Test **chỉ xem** | không (về `/`) | có; sửa kỹ năng được phân; GVCN thêm ⋯ Báo vắng / Xếp lại |
| QL / QT | Lịch Test tuần · Kế hoạch Test | 6 tab: Báo cáo HV · Phân tích GV · Test + SOS · Kết quả Test · Hiệu quả PA · Ý thức | đủ |
| Admin VP | Lịch Test tuần · Kế hoạch Test | 5 (không Ý thức) | không Khôi phục / Huỷ lượt |
| TVV / CX | không (về `/`) | 4 (không Phân tích GV, Ý thức) | chỉ xem |

Tab mặc định: `cham` nếu có, không thì `lich` (TestPage.tsx:27). Một tab → ẩn hàng tab.

## C1. Test `/test`
| # | Màn / khu | Loại | Vai | Mở | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|---|
| 1 | /test đầu trang + HangTab | trang | GV, QL, QT, Admin | menu Test | test/TestPage.tsx:45 | h1 22 ✓ |
| 3 | /test/cham danh sách + khung phải | tab | GV, GVCN | | test/ChamTestTab.tsx:114 | lưới 440 + 1fr; 375 đổi chỗ, "‹ Chấm Test" |
| 4 | dòng đếm "Của tôi: n việc · n bài" + ⓘ | khu | GV | | :121-123 | **3 `<b>` một dòng** |
| 5 | nhóm Quá hạn / Hạn đến / Speaking chấm chéo / Hạn sau | gập | GV | | :125-138 | rỗng từng nhóm có dấu chấm cuối |
| 6-7 | rỗng | rỗng | GV | | :117, :154 | "Không còn bài nào cần chấm" · "Chọn một việc bên trái để chấm" |
| 8-9 | `PanelViec` / `PanelChamSpeaking` tại chỗ | panel trong trang | GV | bấm dòng | congViec/PanelViec.tsx:109; PanelChamSpeaking.tsx:32 | chip "chấm chéo · không tính nợ" |
| 11 | /test/lich thanh: ‹W› · FT/Lớp thường · Lớp tôi dạy/Tất cả · chi nhánh · Xuất Excel · "Lịch thi thật ›" | tab | GV, QL, QT, Admin | | test/LichTestTab.tsx:257-270 | **nhiều điều khiển một hàng**, xuống dòng < 1024 |
| 12 | 375 "Lọc · n ▾" | khối mở | | | :265-279 | |
| 14 | `DaiSo` "đã chấm · còn chấm · quá hạn" | dải số | | | lichTest/DaiSo.tsx:19-44 | |
| 15-17 | ▸ Quá hạn chấm + bảng 8 cột + nút "Nhập điểm / Xem / Thu" | gập + bảng | | | lichTest/KhoiNo.tsx:108-142 | **nút chính ở mọi hàng**; cột GV chấm xuống dòng; 375 còn 2 cột |
| 18 | lưới nhúng `LuoiNhung` + "Mở lưới đầy đủ ›" | lưới con | | "Nhập điểm" | lichTest/LuoiNhung.tsx:37 | ErrorState trong ô bảng |
| 20 | số "bài quá hạn" → `DanhSachNguon` | panel 480/720 | | bấm số | LichTestTab.tsx:301 | nhãn "BÁO CÁO · CHỈ ĐỌC" |
| 21-22 | ▸ Test tuần này + hàng lớp `HangLop` | gập + bảng | | | LichTestTab.tsx:312; lichTest/HangLop.tsx:139 | mã lớp cắt; chip dài "vắng · chờ Quản lý duyệt dời" |
| 23-25 | mở lớp FT → `LuoiFT` + chú giải + rỗng | lưới | | bấm hàng | cham/LuoiFT.tsx:176-670 | **rộng ở 375** (ô 96, cột tên dính); rỗng có câu hướng dẫn |
| 26 | ô FT → `HopNhapDiem` | popover 400 / tấm đáy 375 | GV được phân, QL, QT, Admin | bấm ô | fasttrack/HopNhapDiem.tsx:687 | max-h 85vh; hỏi "Bỏ chữ?" |
| 27 | Sửa điểm có lý do | popover 288 | QL, QT, Admin | gõ đè ô có điểm | fasttrack/ScoreEntry.tsx:437 | placeholder "?" (:812) |
| 28 | "GV chấm Speaking" `GvCham` | panel 480 | GV, QL | | cham/GvCham.tsx:95 | câu giải thích dài |
| 29-33 | mở lớp thường → `LuoiThuong` + ⋯ ô + toast "-" + ô "Đã vắng · chờ xếp lại" + rỗng | lưới | | | cham/LuoiThuong.tsx:117-455 | dòng phụ "L dời sang W4 SEP" cắt; **⋯ hiện khi rê, đè số**; chữ trạng thái cắt ô hẹp |
| 34 | `HopThaoTacMt` (Nhập/Sửa điểm, Xếp/Dời lịch, Dời hạn chấm, Bỏ khỏi đợt, Vắng, Huỷ điểm, Xếp lại bài vắng, Trả lời đề nghị dời, Khôi phục…) | panel 480 | theo quyền | ⋯ | fasttrack/HopThaoTacMt.tsx:201 | z-70 trong panel |
| 35 | `NganLichSuBai` | panel 480 | | ⋯ Lịch sử | cham/NganLichSuBai.tsx:23 | |
| 36 | hỏi ô chưa lưu | **`window.confirm` gốc** | | đóng lưới còn ô | LichTestTab.tsx:184, :307 | hộp trình duyệt, khác `ConfirmDialog` |
| 37 | "MT cũ chưa nhập · …" | dòng nhắc | GVCN, QL | | :327-341 | chữ xám nhỏ dưới thẻ |
| 38 | Xuất Excel `NganXuatMt` | panel 480 | QL, QT, Admin, GVCN | | test/NganXuatMt.tsx:146-234 | câu giải thích trên màn; rỗng dài |
| 39-42 | rỗng / không phạm vi / lỗi | | | | LichTestTab.tsx:207-294 | "{W} không có Test nào" + câu |
| 43-49 | `/test/diem-lop?lop=` cũ → `PanelNhapDiemLop` (toàn) + `DiemTheoLop` + `LuoiChamLop` + `MotKyNang` | panel toàn | GV, QL, QT, Admin | link cũ / ⋯ Nhập điểm | cham/PanelNhapDiemLop.tsx:24; DiemTheoLop.tsx:158-289; MotKyNang.tsx:73 | câu MT cũ (:228); hỏi "Còn ô đang lưu…"; tooltip dài |
| 50 | /test/ke-hoach thanh lọc: FT/thường · "Tuần W · n lớp" · Cần xếp lại · chi nhánh · tìm · ⓘ · "n học viên" · Xuất Excel · Xuất điểm Test · "Xếp nhiều MT…" | tab | QL, QT, Admin; GV chỉ xem | | test/KeHoachTestTab.tsx:128-207 | **rất nhiều điều khiển**; ⓘ nhiều `<b>`; chữ chưa `t()` |
| 52 | `TimKeHoach` | popover | | gõ | keHoach/TimKeHoach.tsx:56 | |
| 53-55 | thẻ lớp `LopKeHoach` + `LuoiKeHoach` + `ChipKyNang` | thẻ + lưới | | mở lớp | keHoach/LuoiKeHoach.tsx:100-124; ChipKyNang.tsx:141 | rộng ở 375; chip 168 cắt chữ |
| 56 | ghi chú lịch tại chỗ | ô sửa | QL, QT, Admin | | keHoach/GhiChuLichThi.tsx:46 | |
| 57 | "+ MT" | menu | QL, QT, Admin | | LuoiKeHoach.tsx:257 | |
| 58-60 | `HopKyNang` + ⋯ + `HopThaoTacMt` chồng | popover 520 / tấm đáy + panel z-70 | | bấm chip | keHoach/HopKyNang.tsx:355-533 | **popover → panel chồng** |
| 61 | `HopSEx` | Modal | QL… | "+ S Ex" | keHoach/HopSEx.tsx:69 | |
| 62-63 | `HopKhoiPhucMt` + `ConfirmDialog` | Modal | QL, QT | chip đã huỷ | keHoach/HopKhoiPhucKetQua.tsx:36-136 | **"Mở {mt} mới ↗" (:100) — ↗ cuối cùng trên web** |
| 64-66 | `NganXepLichMt` (Xếp theo tuần / theo học viên) + `XepTheoHocVien` | panel toàn | QL, QT, Admin | "Xếp nhiều MT…" | keHoach/NganXepLichMt.tsx:59-334; XepTheoHocVien.tsx:281-451 | **ô chọn tất cả trong `<th>` (:334, G9)**; bảng 960 / 860; 2 nhóm điều khiển ở đầu panel |
| 67 | `NganXepHangLoat` lớp thường | panel 720 | | "Xếp lịch Test…" | keHoach/NganXepHangLoat.tsx:198 | |
| 68-69 | `NganXuatKeHoach` · `NganXuatDiem` | panel 720 / 480 | QL… | | keHoach/NganXuat*.tsx | nhiều ô |
| 70-71 | rỗng / lỗi | | | | KeHoachTestTab.tsx:122-212 | |

## C2. Hồ sơ lượt `/mock-test/:id` · `/luot-test/:id`
| # | Khu | Loại | Tệp:dòng | Cần soi |
|---|---|---|---|---|
| 72-73 | đầu: DuongVe · h1 tên HV · chọn đợt · ⓘ · tag; dải "Lớp lúc Test · Lịch · Target · Kỳ vọng" | trang | fasttrack/MockDetailPage.tsx:306-340 | xuống dòng 375 |
| 74 | "Nhập điểm lớp ›" + menu "Chỉnh lịch" (mỗi mục có dòng gợi ý) | menu | :247-351 | chữ gợi ý dưới mục |
| 75 | dải "Đã huỷ" + câu "Chỉ Quản lý khôi phục được…" | dải | :294-302 | câu giải thích |
| 76 | Tóm tắt lượt (Overall ⓘ, SOS, Hạn chấm, Còn lại) | thẻ | :356-386 | ⓘ dài |
| 77-78 | "Kết quả theo kỹ năng" lưới 7 cột + câu vàng "Chưa có kế hoạch hợp lệ…" | bảng | :915-935, :917 | 375 = 2 cột; câu nên vào ⓘ |
| 79-82 | ⋯ kỹ năng · hàng mở (Nhận xét, Case & PA, Lịch sử) · S Ex · Lịch sử lượt | menu / vùng mở | :659-976, :418 | **h2 14 trong hàng mở vs h2 17 của thẻ** |
| 83-88 | Dời hạn chấm · Xử lý vắng · Trả lời đề nghị dời (panel 480) · HopKyNang · Khôi phục · NganCase | panel / hộp | :425-1204 | |
| 89-90 | rỗng / 403 / 404 | | :192, :922; ui/ui.tsx:272 | |
| 91-97 | `/luot-test/:id` cùng khung: dải huỷ / khôi phục, Tóm tắt, "Kết quả theo môn", ⋯, Nhận xét | trang | fasttrack/LuotThuongPage.tsx:99-463 | câu giải thích ở dải |

## C3. Phân tích `/phan-tich`
| # | Khu | Loại | Vai | Tệp:dòng | Cần soi |
|---|---|---|---|---|---|
| 98-101 | đầu + "Dữ liệu đến {ngày}" + chi nhánh; tab; Chương trình · Thời gian (Toàn bộ / Chọn khoảng tuần) · Lớp · In; `ONgay` → `LichNho` | trang | QL, QT, Admin, TVV, CX | phanTich/PhanTichPage.tsx:24; PhanTich.tsx:100-119; BoChonThoiGian.tsx:20 | 2 ô tuần xuống dòng 375 |
| 102-106 | Báo cáo HV: thẻ chỉ số + "Kết quả MT" + "Tiến bộ theo kỹ năng" + In | tab | 5 vai | phanTich/BaoCao.tsx:36-130 | thẻ h2 17 + ⓘ; câu chú dưới số; bảng rộng 375 |
| 107-110 | Phân tích GV: Gọn/Đầy đủ · tìm · bảng + panel "Chấm Test đúng hạn · {GV}" + rỗng chọn chi nhánh | tab | QL, QT, Admin | phanTich/PhanTichGiaoVien.tsx:73-193 | nhiều cột "Đầy đủ"; rỗng có câu |
| 111-114 | Test + SOS: Xếp theo · chú giải màu · ⋯ cột; bảng 2 hàng đầu nhóm | tab | 5 vai | phanTich/TongHopTestSos.tsx:206-293 | **ⓘ trong `<th>` nhóm (:273)**; rộng 375 |
| 115-119 | Kết quả Test: tab con Mock / Thi thật; bảng 1180 / 1100 | tab | 5 vai | phanTich/KetQuaThi.tsx:38-254 | **rất rộng**; 2 tầng tab |
| 120-124 | Hiệu quả PA: dòng ngữ cảnh + chip GV; bảng PA GV thêm / PA quy chế; dòng đếm | tab | 5 vai | phanTich/HieuQuaPa.tsx:111-196 | ⓘ 3 đoạn; câu phụ trên màn; `<b>` bọc OSo; rỗng 2 câu |
| 125-126 | Ý thức: "HV cần chú ý" + "Lớp nhiều vi phạm" | tab | QL, QT | phanTich/YThucPhoiHop.tsx:100-181 | rỗng có câu |
| 127-128 | panel số `NganDanhSach` / `PanelGvTre` | panel 480/720 | | ui/SoLieu.tsx:423-460; ui/OSo.tsx:44 | tab ▼▲★ + Fail/Pass/Exceed tiếng Anh; nhãn "BÁO CÁO · CHỈ ĐỌC" |

## C4. Thành phần chung (`web/src/ui`) — chụp ở bảng mẫu `/dev/thanh-phan`
| Thành phần | Tệp:dòng | Trạng thái | Cần soi |
|---|---|---|---|
| `KhungPanel` | ui/KhungPanel.tsx:166-397 | 480 / 720 / toàn; đầu v3 (h2 17) vs đầu một dòng (h2 14 cắt); dòng loại; tab; ‹; chân Huỷ/Đóng/Xoá + chính; "n ô cần sửa ↑"; hỏi "Bỏ chữ đang gõ?"; z 60/70/80 | **hai cỡ h2**; **chân 375 xếp dọc (PTA)**; nhóm `Khoi` h3 12 xám |
| `Modal` | ui/Drawer.tsx:5-34 | đầu h2 14 + ✕ | h2 nhỏ hơn panel |
| `ConfirmDialog` | Drawer.tsx:60 | thường / nguy hiểm / đang xử lý / hỏi bỏ chữ | |
| `Menu`, `MenuDong` | ui/Menu.tsx:27; MenuDong.tsx:33 | mục có gợi ý, nguy hiểm, tắt, vạch ngăn | ⋯ chỉ hiện khi rê ở LuoiThuong |
| `Toast` | ui/Toast.tsx:15-40 | ok / lỗi / Hoàn tác | 375 đáy 20 |
| `ErrorState`, `LoiTaiNho`, `Empty`, `Forbidden`, `Skeleton` | ui/ui.tsx:262-322 | | nhiều `Empty` có câu gợi ý dài |
| `Card` | ui/ui.tsx:13-22 | h2 `.h-khoi text-lg` (17) | |
| `Th` | ui/ui.tsx:435-460 | nút sắp xếp trong `<th>` (chưa ai dùng) | G9 |
| `Bang` | ui/Bang.tsx:16-110 | đầu nhóm, `dinh` (≥ 1280), thẻ 375 / cuộn, `day` | |
| `OSo` | ui/OSo.tsx:31 | 0 xám; > 0 gạch dưới nhấn; đỏ / trễ | |
| `Nhan`, `NhanKq`, `ChipHan`, `ChipSos` | ui/Nhan.tsx:11-139; ChipSos.tsx:11 | đủ tông, tạm, đứt | |
| `ONgay`, `LichNho`, `NutLuat` | ui/ONgay.tsx:46; LichNho.tsx:248; NutLuat.tsx:11 | | popover lịch ở 375; hộp ⓘ 22rem |

## C5. Kết quả tìm nhanh
- ↗ còn: `test/keHoach/HopKhoiPhucKetQua.tsx:100` "Mở {mt} mới ↗" (duy nhất trong TSX) · `index.css:479` `.ten-ho-so::after "↗"` bị `content:none` đè (:497) — luật chết, xoá.
- `<th>` chứa điều khiển: `NganXepLichMt.tsx:334` (ô chọn tất cả) · `BangDiemLopThuong.tsx:154` · `ui.tsx:452` (Th sort, chưa dùng) · `TongHopTestSos.tsx:273` (ⓘ span, giáp ranh).
- h1 không theo token: `CuoiKhoaLop.tsx:625` 17 px (sai cỡ) · `DauTrangLop.tsx:179`, `HoTroHocVienTab.tsx:320`, `StudentDetailPage.tsx:256` dùng `text-[22px]` (đúng cỡ, giá trị thô).
- `window.confirm` gốc: `LichTestTab.tsx:184, :307`.
- Chữ chưa `t()`: KeHoachTestTab, HieuQuaPa, YThucPhoiHop, TongHopTestSos, NganXepLichMt, HopChoDuyet:212 (EN lẫn tiếng Việt).
- Không có: `HangLichMt` (là `HangLop`), Dán Excel (đã bỏ R1-BO-DAN-EXCEL), `EmptyState` (là `Empty`).
