# UI-CV (PR 2) — B6 một nơi làm việc: bỏ Test › "Chấm Test" và trang "Chờ duyệt", Hộp duyệt thành hàng lọc trong tab "Chờ bạn duyệt"

Nguồn: mockup đã duyệt `thiet-ke/2026-11-08-audit-ui-mockup.html` khu B6 (chủ SP 08/11 chốt **B6 A** — gộp cả hai). Nối tiếp PR 1 (#1252, B3 + B4 + B5).
Dữ liệu: seed demo 14/09/2026 — QL Nguyễn Khánh Vy (vai 2) cho Hộp duyệt, GVCN Trần Ngọc Hà (vai 7) cho Test. Phông kiểm `document.fonts` trước khi chụp.
Ảnh cặp (trái mockup | phải web, toàn trang): `b6-1440-toi|sang.png`, `b6-375-sang|toi.png` (mockup B6 chỉ vẽ 1440 — ghi-chu.md; khung 375 web để soát), `b6-test-gv-1440-toi.png` (trái: ảnh TRƯỚC Test › Chấm Test trong mockup; phải: Test của GV nay chỉ còn Lịch Test tuần · Kế hoạch Test).

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| B6 đầu trang "Công việc · 5 việc" · Của tôi / Của GV / Tất cả · Mọi hạn | `HoTroHocVienTab` (như cũ) | b6-1440-* | GIỮ |
| B6 tab "Chờ bạn duyệt 1" (badge = quá hạn, PR 1 B3) | `HoTroHocVienTab` | b6-1440-* | KHỚP |
| B6 `.hang-loc`: Tất cả · Học thuật · Ý thức · Dời lịch Test · Thông tin HV │ Báo QL · Đã xử lý · 30 ngày · Lớp ▾ (chip viên 32 px, 14 / 500, số mờ; bật = nền nhấn nhạt + viền nhấn) | `HopChoDuyet` (`ChipLoc`, ô Lớp), vẽ hết bề ngang dưới hàng tab (`khuLoc`) | b6-1440-* | KHỚP |
| B6 "Dưới hàng lọc là danh sách khối em như hôm nay" | `CayDuyet` (như cũ) | b6-1440-* | GIỮ |
| B6 BỎ trang "Chờ duyệt" riêng (`/cong-viec/cho-duyet`) | `CongViecPage` → chuyển hướng `/cong-viec?nhom=duyet&…` giữ `xem` · `phan` · `lop` · `qua-han` · `the` · `cn` | — | BỎ (đường cũ vẫn mở đúng chỗ) |
| B6 BỎ tab Test › "Chấm Test" | `dieuHuong.ts` (`TAB_TEST`), `TestPage` (`/test/cham` → `/cong-viec?nhom=cham-diem`), xoá `ChamTestTab.tsx` | b6-test-gv-* | BỎ |
| B6 Test của GV còn Lịch Test tuần · Kế hoạch Test | `tabTestHienThi`, `tabTestMacDinh` (GV mở Lịch Test) | b6-test-gv-* | KHỚP |
| B6 ghi chú: ô "bài còn chấm" ở Lịch Test mở thẳng Công việc › Chấm điểm | `test/lichTest/DaiSo.tsx` | — | **[XM] để UI-TEST-LICH** — B8 làm lại dải số (hai ô) trong cùng tệp; không sửa chéo tệp của session khác |

## Phần mockup không vẽ — sửa đồng bộ

- **Đã xử lý / Báo QL trong danh sách khối em**: dòng không còn phải quyết → cột phải là nhãn trạng thái (+ ngày xử lý) như trang cũ, không nút Duyệt / Từ chối; bấm dòng mở panel duyệt (Huỷ quyết định · Sửa trả lời… trong panel như cũ).
- **Đầu thẻ** "n yêu cầu · ⚠ m quá hạn" đếm đúng danh sách đang lọc (cùng luật `demHop`: hạn < hôm nay); ⓘ "Duyệt nhiều" chỉ ở Chờ duyệt.
- **Rỗng** theo bộ lọc: "Không có yêu cầu nào đang chờ" / "Không có thẻ Báo QL" / "Chưa có yêu cầu nào được xử lý trong 30 ngày" — trong thẻ, hàng lọc giữ.
- **Thẻ mở từ chuông không còn trong danh sách**: panel phải ghi lý do + "Xem ở Đã xử lý" (bật lọc tại chỗ, không đổi trang) · Đóng.
- **"n yêu cầu ở chi nhánh khác · Xem ›"**: đổi `cn=tat-ca` tại chỗ (Công việc hiểu `tat-ca` = mọi chi nhánh trong quyền).
- **Chip "Quá hạn · n ✕"** (từ ô Tổng quan) và lọc lớp từ hồ sơ lớp / Học viên & Lớp giữ, nằm trên hàng lọc.
- **375**: hàng lọc một hàng cuộn ngang (như hàng tab), mép phải mờ; panel duyệt toàn màn có "‹ Công việc" như cũ.
- **Quyền**: tab chỉ có khi `workApprove` (như trang cũ); thông báo `nhom=duyet` chỉ mở được ở vai có quyền duyệt (`moDuocThongBao`); GV vào `/cong-viec?nhom=duyet` → tab mặc định của mình.
- **Thông báo / Quay lại**: "nơi đến" của thông báo ghi "Công việc › Chờ bạn duyệt" (`noiDenThongBao`); nút Quay lại từ hồ sơ ghi "Công việc · Chờ bạn duyệt" (`tenNguon`).

## Mọi chỗ trỏ tới hai nơi cũ (đã đổi)

| Chỗ | Trước | Sau |
|---|---|---|
| Thông báo (máy chủ + web, `duongThe`) | `/cong-viec/cho-duyet?the=` · `?xem=de-biet&the=` | `/cong-viec?nhom=duyet&the=` · `&xem=de-biet&the=` |
| Hồ sơ GV (máy chủ `giaoVien/hoSo.ts` qua `duongThe`) | như trên | như trên |
| Tổng quan QL: "Hộp duyệt ›", ô "Chờ duyệt" | `/cong-viec/cho-duyet` | `/cong-viec?nhom=duyet` |
| Hồ sơ lớp badge "n chờ duyệt", Học viên & Lớp | `/cong-viec/cho-duyet?lop=` | `/cong-viec?nhom=duyet&lop=` |
| Hồ sơ GV "Chờ duyệt ›" | `/cong-viec/cho-duyet` | `/cong-viec?nhom=duyet` |
| Chân "Mở hộp duyệt ›" trong tab | link sang trang hộp | BỎ (hộp là chính tab) |
| `DUONG_TAB_CONG_VIEC['cho-duyet']` | `/cong-viec/cho-duyet` | `/cong-viec?nhom=duyet` |
| Hướng dẫn GV màn "Chấm Test" (`/test/cham`, `data-hd="cham-test-ds"`), lối tắt `cham-test` | có | BỎ; việc Nhập điểm chỉ lối Công việc › Chấm điểm |
| Hướng dẫn QL màn "Hộp duyệt" (`/cong-viec/cho-duyet`), lối tắt `cho-duyet` | có | gộp vào màn Công việc: mục "Lọc yêu cầu chờ duyệt" (`cd-loc`), "Duyệt nhiều"; "Chỉ cho tôi" mở `/cong-viec?nhom=duyet` |
| Ctrl K | không có đích trang (chỉ tìm HV / lớp) | không đổi |
| Bookmark `/test/cham`, `/cong-viec/cho-duyet?…` | trang cũ | chuyển hướng giữ bộ lọc |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Chấm bài (GV) | Test › Chấm Test hoặc Công việc › Chấm điểm | Công việc › Chấm điểm (cùng panel lưới điểm, "Lưu · bài tiếp ›") |
| Chấm Speaking chéo | Test › Chấm Test (nhóm chấm chéo) hoặc Công việc › Bài thi Speaking | Công việc › Bài thi Speaking |
| Lọc duyệt theo trạng thái (Chờ / Báo QL / Đã xử lý) | trang Chờ duyệt (ô đoạn) | chip trên hàng lọc của tab |
| Lọc theo loại | trang Chờ duyệt | chip trên hàng lọc (giữ khi xem Đã xử lý) |
| Lọc theo lớp | chỉ từ link `?lop=` (chip ✕) | ô "Lớp ▾" (lớp có trong danh sách đã nạp) + link `?lop=` |
| Lọc chi nhánh | ô Chi nhánh của hộp | ô Chi nhánh ở "Lọc thêm" của Công việc (cùng `cn`) |
| Duyệt / Từ chối… / Trả lời… / Mở › / Duyệt nhiều / Từ chối nhiều | trang + tab | tab (như cũ) |
| Huỷ quyết định / Sửa trả lời… (Đã xử lý) | trang Chờ duyệt › panel | tab, lọc Đã xử lý › panel |

Không mất thao tác nào.

## Dòng đọc Turso

Giảm: trang Test của GV không còn gọi `/my-work` (tab Chấm Test đếm "Của tôi") và `/my-work/cham-speaking`. Tab "Chờ bạn duyệt" vẫn một lần `GET /yeu-cau?hop=cho-duyet&boiCanh=1` (+ tham số lọc) như trước; đổi chip = một lần đọc như trang cũ. Ô "Lớp ▾" lấy lớp từ danh sách đã nạp, không gọi thêm.

## Phép kiểm sửa vì luật đổi (B6)

`khung.tests.ts` PR-O O2 / O6: GV Test chỉ còn Lịch Test (+ Kế hoạch chỉ xem), mặc định Lịch Test; `/test/cham` → Công việc › Chấm điểm.
