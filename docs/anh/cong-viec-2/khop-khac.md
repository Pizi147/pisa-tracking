# CONG-VIEC-2 (D5b) — Công việc ba tầng: ảnh cặp, khớp / khác, thao tác TRƯỚC → SAU

Mockup đã duyệt: `thiet-ke/v7/cong-viec-2.html` (#621, chủ SP 27/10 "theo khuyến nghị"). Seed demo 14/09/2026.
Vai: GV = Phạm Thu Trang (id 9, có kỹ năng S — cũng là "GV S"), QL = Nguyễn Khánh Vy (id 2), TVV = Nguyễn Thu Hương (id 23). 1440 tối, 375 sáng.

## Ảnh

| Màn | Vai | Mockup \| web | Trước | Sau |
|---|---|---|---|---|
| Công việc | GV 1440 | `cap-gv-1440-toi.jpg` (khung A) | `truoc-gv-1440-toi.jpg` | `sau-gv-1440-toi.jpg` |
| Công việc | GV 375 | `cap-gv-375-sang.jpg` (B1) | `truoc-gv-375-sang.jpg` | `sau-gv-375-sang.jpg` |
| Công việc | GV S 375 | `cap-gv-s-375-sang.jpg` (C6) | — (cùng tài khoản GV) | — |
| Công việc | QL 1440 | `cap-ql-1440-toi.jpg` (C1) | `truoc-ql-1440-toi.jpg` | `sau-ql-1440-toi.jpg` |
| Công việc | QL 375 | `cap-ql-375-sang.jpg` (C4) | `truoc-ql-375-sang.jpg` | `sau-ql-375-sang.jpg` |
| Công việc | TVV 1440 | `cap-tvv-1440-toi.jpg` (C3) | `truoc-tvv-1440-toi.jpg` | `sau-tvv-1440-toi.jpg` |
| Công việc | TVV 375 | `cap-tvv-375-sang.jpg` (C5) | `truoc-tvv-375-sang.jpg` | `sau-tvv-375-sang.jpg` |
| Thẻ "Hết việc {nhóm}" | TVV 1440 | khung D8 | — | `sau-tvv-het-viec-1440-toi.jpg` |

Dữ liệu mockup là dữ liệu giả của mockup (Mỹ Đình, 18/09); web là seed demo — tên, số việc khác nhau là do dữ liệu, không phải bố cục.

## Truy vết khung → thành phần

| Khung mockup | Thành phần web | Khớp |
|---|---|---|
| ① dải nhóm: `--surface-2`, vạch trái 3 px một màu nhấn, biểu tượng, 15 / 700, chip "n việc", phụ "n HV / bài", ⚠ quá hạn / hôm nay, ▾, dính khi cuộn | `DaiNhom` (`DanhSachViec.tsx`) — dùng cả cho nhóm máy chủ, "Chờ bạn duyệt", "Việc quản lý" rỗng | KHỚP |
| Nhóm chấm chéo vạch xám | `DaiNhom trungTinh` ("Bài thi Speaking tuần này") | KHỚP |
| Vạch hạn Chấm điểm 13 / 600, "Hạn sau…" gập | `VachHan` | KHỚP |
| ② khối em: vòng tròn chữ đầu, tên 15 / 600 ↗ link hồ sơ, lớp 13, SOS một lần, "+ n việc ở {nhóm}" | `MucNhom` + `xepTheoEm` (mọi em, kể cả một việc) | KHỚP |
| ③ việc: thụt 54, nét cây, tên 15 / 500 không lặp tên em, phụ 13, hạn cột cố định, nút cột cố định | `DongViec` (`COT_VIEC` 1fr · 136 · 112) | KHỚP (cột hạn 136 thay 140 để vừa 1024) |
| ② lớp / nhóm em: ô vuông biểu tượng, chính dòng là việc | `DongLop` | KHỚP |
| Dòng gộp: ô chồng có số, "n em ▾" mở khay nền chìm; `moCaDong` làm cả dòng | `DongLop` (gộp) + `DongCon` | KHỚP |
| Chip hạn ("quá hạn n ngày" đỏ ⚠, ≤ 2 ngày vàng ⚠, xa hạn xám, "không hạn" mờ) | `ChipHan` sẵn có (cùng đầu panel) | KHÁC nhỏ: chữ "Quá hạn n ngày" / "Hạn dd/mm" viết hoa đầu, xa hạn là chữ mờ không nền — giữ một nguồn với đầu panel (luật "cùng số liệu cùng hàm") |
| "hạn hôm nay" đậm + viền | `ChipHan` "⚠ Hạn 18/09" vàng | KHÁC: V8 "hạn = ngày thật, kể cả hôm nay" thắng; đầu nhóm vẫn có "⚠ n hạn hôm nay" |
| "việc tiếp" đi hết nhóm (sau → vòng lên), hết nhóm → "Hết việc {nhóm} của bạn" + "Còn: {nhóm} · n việc" + Đóng / Việc tiếp › | `HoTroHocVienTab` (`xoay` + `HetViecNhom`) | KHỚP; "Hoàn tác" → "‹ Xem lại việc vừa lưu" (xem dưới) |
| Panel phải M6 ② | `PanelViec` không đổi | GIỮ |
| QL "Chờ bạn duyệt" là nhóm đầu trong cột danh sách, thẻ gọn | dải đầu cùng dáng `DaiNhom`; thân giữ `HopChoDuyet gon` bề rộng đủ trên lưới hai cột | KHÁC [XM]: giữ hộp duyệt đủ rộng như V4 đã duyệt (thẻ có "Nếu duyệt…", 3 nút) — dời vào cột 600 px làm thẻ vỡ dòng |
| QL Tất cả: người giữ việc dưới hạn | `CotHan` dòng người | KHỚP |
| Danh sách 600 px · panel phải | `xl:grid-cols-[600px_…]` (`lg` 520) | KHỚP |
| 375: chạm cả dòng, hạn dưới tên, ẩn nút trừ "n em ▾" / Gia hạn, dải nhóm xuống hai dòng | như mockup; nút ≥ 44 px | KHỚP |

BỎ: dòng việc không còn lặp tên em ("Xác nhận Case Pronunciation · Lê Hoàng Anh" → khối "Lê Hoàng Anh" + "Xác nhận Case Pronunciation"); dòng phụ không lặp phần tên việc đã nói (Vận hành "Lớp MB FOU 23"; TVV "Report 1").
GIỮ: mọi bộ lọc, đếm, gập, "Xem thêm 10 việc", giữ chỗ dòng vừa lưu, Gia hạn, ⓘ luật TVV, Làm thay / Nhập hộ, dải Mới dùng, Yêu cầu của tôi, Lớp tôi dạy.
Nhóm nguyên nhân / nhóm việc: KHÔNG đổi — đúng danh sách máy chủ (`gomNhomViec`). Tên việc ("Ghi nhận xét" → "Mô tả Case") thuộc D6 MO-TA-CASE (máy chủ), PR này hiện đúng chữ máy chủ gửi.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Bước |
|---|---|---|---|
| Tìm việc của một em | quét tên em trong tên việc / dòng phụ; em 1 việc và em 2 việc khác dáng | quét cột tên em (vòng tròn chữ đầu), mọi em cùng dáng | = · nhanh hơn |
| Mở làm một việc | bấm dòng / nút → panel phải | như cũ | 1 = 1 |
| Xem hồ sơ em | link ở panel | tên em ↗ ở danh sách + ở panel | 2 → 1 |
| Làm liền nhiều việc | Lưu · việc tiếp › chỉ đi tới cuối nhóm; việc cuối: không có nút tiếp | đi hết nhóm, vòng lên đầu; hết nhóm → thẻ "Hết việc…" + Việc tiếp › sang nhóm sau | = · không kẹt |
| Dòng gộp mở danh sách em | bấm dòng / "n em ▾" → em bên dưới | như cũ, khay nền chìm, mỗi em một dòng (tên em · phụ · hạn · nút) | 1 = 1 |
| Dòng làm cả dòng (Xác nhận PA lô, Nhập điểm theo tuần) · Ý thức lô | bấm dòng / nút → panel lô | như cũ, ô chồng có số | 1 = 1 |
| Việc mở trang (Bổ sung hồ sơ, Chốt lộ trình…) | dấu "↗" sau tên | dấu "›" (G6; "↗" chỉ còn cho hồ sơ) [XM chốt] | = |
| Lý do của việc | rê chuột dòng (`title`) | như cũ | = |
| Gập / mở nhóm · Xem thêm 10 việc · vạch hạn sau tuần | bấm đầu nhóm / nút | như cũ (thêm ▾ bên phải) | = |
| Lọc hạn · FT / Lớp thường · chi nhánh · chip lọc từ link ✕ · Của tôi / Của GV / Tất cả · chọn GV | hàng bộ lọc | như cũ | = |
| QL: Chờ bạn duyệt (Duyệt · Từ chối… · Mở, tích nhiều) | khối đầu | như cũ, dải cùng dáng nhóm | = |
| QL: + Giao việc · Vận hành › · Họp đơn vị › | cuối "Việc quản lý" | như cũ | = |
| TVV: Gia hạn sau thi · ⓘ luật nhóm · badge trạng thái | ở dòng / đầu nhóm | như cũ | = |
| Theo dõi · Làm thay / Nhập hộ | dải 👁 + nút ở dòng | như cũ | = |
| Đổi việc khi đang gõ | hộp "Bỏ chữ đang gõ?" | như cũ | = |

Không mất thao tác nào. Thẻ "Hết việc": mockup vẽ "Hoàn tác"; web chưa có hoàn tác chung cho mọi loại panel việc nên thẻ có
"‹ Xem lại việc vừa lưu" — mở lại đúng panel vừa lưu (panel vẫn gắn, chỉ ẩn), sửa / hoàn tác bằng chính panel đó. "Việc tiếp" ưu tiên việc đang
hiện; việc sau "Xem thêm" / vạch hạn gập vẫn tính — không báo "Hết việc" khi nhóm còn việc.

## Cổng critique (impeccable, chấm một lần — luật 27/10 tối)
29/40 (10 heuristic, mỗi mục 3). Không P0. 2 P1 đã sửa sau khi chấm (không chấm lại): ① thẻ Hết việc thiếu đường sửa việc vừa lưu → "‹ Xem lại việc
vừa lưu"; ② "Hết việc" báo sai khi việc còn nằm sau "Xem thêm" → việc tiếp không còn đòi việc đang hiện. P2 đã sửa: nút cột 112 px cho xuống dòng
thay vì cắt chữ; dòng phụ TVV không lặp "Report 1". P2 để lại (ngoài phạm vi, D2 / D3 lo bộ lọc): đầu trang QL ở 375 nhiều bộ lọc; chữ "n yêu cầu
chờ duyệt ›" của GV (`YeuCauCuaToi`).
