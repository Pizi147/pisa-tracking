# PT-a — khớp / khác mockup v19 #1481 (ô số Phân tích + tab Giáo viên + panel GV)

Mockup: `thiet-ke/v19/phan-tich.html` (PR #1481, chủ SP duyệt 12/11 cả các [XM] theo đề xuất). Ảnh cặp mockup | web (seed 14/09, QL Monbay, tối):
`cap-1440-gv.png` (khung 1a), `cap-375-gv.png` (khung 7a), `cap-1440-panel.png` (khung 2a — bấm "5" Chưa làm của một GV).
Mockup dữ liệu 12/11, seed 14/09 → số khác, so bố cục / dáng.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Ảnh | Đánh giá |
|---|---|---|---|
| 0 | Ô số bấm được = hộp nhỏ (nền `--os-nen`, viền `--os-vien` ≥ 3 : 1, chữ 600), không gạch chân khi đứng yên; rê = nền đậm + viền nhấn + gạch chân; focus vòng nhấn | cap-1440-gv | KHỚP |
| 0 | Quá hạn = hộp đỏ + ⚠ (Chưa làm, Chưa phân công, S chéo chung) | cap-1440-gv | KHỚP |
| 0 | Đang chờ = hộp vàng (`text-soon`) | — | KHỚP theo mã (dùng ở PT-b: Chưa chốt PA, Thiếu điểm, Chưa xử lý, Chưa có KQ) |
| 0 | Vượt / Tăng · Chưa đạt / Giảm chỉ tô số trong hộp trung tính | (Chi nhánh, PT-b) | KHỚP (Tiến bộ ↑ Tăng / ↓ Giảm đổi sang `kq-vuot` / `kq-duoi` — hết ⚠ sai nghĩa) |
| 0 | Số 0 / "—" mờ, không hộp | cap-1440-gv | KHỚP |
| 0 | Ô đang mở panel: viền nhấn 2 px (`aria-expanded`) | cap-1440-panel | KHỚP |
| 0 | Số trong chip SOS giữ dáng chip | (SOS) | KHỚP — chip lên tiêu đề cột ở PT-b (XM-7) |
| 1a | Dải 4 thẻ; "Chưa làm" đỏ ⚠ + "đã qua hạn · + n bài S chéo chung"; "Chưa phân công" hộp lớn | cap-1440-gv | KHỚP |
| 1a | Nhóm cột Chấm Test · bài / Việc, mỗi nhóm Đúng hạn · Làm muộn · Chưa làm · **% đúng hạn** (cột riêng, chữ thường) | cap-1440-gv | KHỚP |
| 1a | Cột "Đạt kỳ vọng Test · lượt" (không nhóm "Học trò") — hộp % + phân số mờ, thẳng cột | cap-1440-gv | KHỚP |
| 1a | Tên + môn hai dòng, cột tên 280 / 8 cột số 112 đều / Đạt 200; hàng 52 | cap-1440-gv | KHỚP |
| 1a | Hàng chân "Chưa phân công" + "S chéo chung" — số ở cột Chưa làm, cột khác "—", cột % trống | cap-1440-gv | KHỚP (seed không có bài chưa phân công → web chỉ hiện S chéo chung) |
| 1a | "Thi thật theo GV ›", ⓘ, Tìm GV, Xuất Excel | cap-1440-gv | KHỚP |
| 2a | Panel tiêu đề "Tên GV · Chấm Test", tab Chưa làm · Làm muộn · Đúng hạn có ô đếm (Chưa làm đỏ), mở đúng tab của ô bấm | cap-1440-panel | KHỚP |
| 2a | Cột Học viên đầu dòng → Bài → Hạn → trạng thái quá hạn đỏ | cap-1440-panel | KHỚP |
| 2a | Chân "Hồ sơ GV ›" | cap-1440-panel | KHỚP (giữ thêm nút Đóng — thao tác cũ) |
| 2a | Panel rộng 720 (mockup 640) | cap-1440-panel | KHÁC (GIỮ): bậc rộng `rong` có sẵn của `KhungPanel` gần nhất; trước là 1040 |
| 2a | Nhóm theo lớp ("MB FT 101 · 5 bài") | cap-1440-panel | KHÁC (GIỮ): giữ cột Lớp + thứ tự quá hạn lâu nhất toàn panel (nhóm lớp đẩy bài quá hạn lâu xuống dưới) |
| 2a | Dòng "loại" nhỏ "Số · Phân tích GV" + "5 bài" trên bảng | cap-1440-panel | KHÁC (GIỮ): mẫu đầu panel chung `KhungPanel` / `BangLuotPanel` mọi panel số |
| 2b–2d | Đang tải (khung xám) · rỗng · lỗi + Thử lại | — | KHỚP theo mã (`Skeleton`, `ErrorState onRetry` của `BangLuotPanel` không đổi) |
| 7a | Thẻ 375: tên · môn, nhóm Chấm Test / Việc nhãn trên hộp, "n % đúng hạn" cuối tiêu đề nhóm, Đạt kỳ vọng hộp + phân số; Chưa phân công / S chéo chung một dòng | cap-375-gv | KHỚP |
| 7a | Tìm GV + Xuất Excel một hàng | cap-375-gv | KHỚP |
| 7a | Dải thẻ 375: web 4 thẻ (mockup vẽ 2) | cap-375-gv | KHÁC (GIỮ): bốn số đã duyệt V2, không bỏ |

Đếm: 23 dòng · 19 KHỚP · 4 KHÁC (GIỮ mẫu chung / thao tác cũ) → 19 / 23 = **83 % khớp tuyệt đối; 100 % tính KHÁC (GIỮ)**. Hình ảnh (hộp, màu, cỡ, hàng, cột) theo mockup.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm số bảng / thẻ Phân tích → panel | chữ màu nhấn, gần như số thường | hộp nhỏ, cùng một lần bấm |
| Bấm "+ 108 S chéo chung" ở từng dòng GV | dòng phụ mọi GV, panel = toàn bộ bài của GV đó | hàng chân "S chéo chung", panel chỉ dòng S chéo chung (`sc=1`, cùng nguồn — số = số dòng) |
| Bấm "Chưa phân công" | ô gộp 3 cột | số ở cột Chưa làm của hàng chân |
| % đúng hạn | chữ nhỏ dưới ô Đúng hạn | cột riêng (chỉ đọc) |
| Panel GV: tab Chưa làm · Làm muộn · Đúng hạn, mở đúng tab (#1483) | có | GIỮ; số tab trong ô đếm |
| Panel GV → hồ sơ GV | (không có) | "Hồ sơ GV ›" ở chân |
| Tìm GV · Xuất Excel · Thi thật theo GV › · ⓘ · ▸ tách chi nhánh (Tất cả) · phân trang · Đóng / Esc | có | GIỮ |

Mất thao tác: không.

## Turso

Không đổi đường máy chủ, không thêm request: hộp số là CSS; % đúng hạn tính ở web từ ba số đã có; hàng S chéo chung lấy `sChung` đã có trong dòng GV và mở
CÙNG đường `/phan-tich/giao-vien/o` của ô "+ n" cũ (lọc `sc=1` ở web). Dòng panel đã mang trạng thái đúng hạn / muộn / chưa (`dongViec.trangThai`, #1483) —
điểm 1 PTA ghi không cần thêm cột. Mở trang: số câu / dòng như trước (đường `/phan-tich/giao-vien?v2=1` không đổi).
