# RA-UI-8 — Hồ sơ lớp 375 thẻ em + đầu trang gọn (critique a mục 28, 29 + mật độ đầu trang)

Loại PR: **sửa nhỏ**, không đổi bố cục khối, không mất thao tác. Mockup: `thiet-ke/v5/ho-so-lop.html` (1440 + 375). Báo cáo gốc: `critique-a-tong-quan-cong-viec-hv.md` mục 28–31 (nhánh `claude/ra-ui-5`).

## Sửa
| # | Chỗ | Trước | Sau | Lý do |
|---|---|---|---|---|
| 28 | Bảng HV hồ sơ lớp < 640 px (`BangHoSoLop`) | `the375={false}`: chỉ thấy Học viên · Target · MT, điểm phải cuộn ngang | Thẻ mỗi em (chế độ thẻ của `Bang`): tên + Kết quả (+ Ngày thi khi có lịch) · L R W S Overall (dòng phụ W1 · W2 / "vắng …" dưới ô) · Target · MT · hàng cuối "n Case · n PA" trái, ⋯ phải; Case mở ngay cuối thẻ | P1 critique 28; mockup 375 = thẻ em đủ điểm |
| 28b | `Bang` (chung) | chế độ thẻ không có lớp hàng / phần mở thêm | thêm `lopHang` (row-muted, nền đang chọn) + `sauThe` (phần mở cuối thẻ) — tuỳ chọn, bảng khác không đổi | `hangRieng` không dùng ở thẻ |
| 28c | Ô W / S bấm (điểm thành phần) | nút cao 44 px ở điện thoại → thẻ thưa | vùng chạm 44 px bằng `after` (nút giữ cỡ chữ) | thẻ gọn như mockup, vẫn đủ vùng chạm |
| 28d | Thẻ: ô điểm | chữ 17 px (dáng bảng 1440) | 15 px (`ODiem` `doc`) | mockup 375 |
| 29 | Kẻ hàng cột tên dính (`.bang td.sticky-col`, 640–1023 px) | hàng cao lẻ (tên + nhãn "Ý thức · cần xử lý") mất / lệch vạch ở cột dính | vạch đáy bằng bóng trong, cùng hàng điểm ảnh với phần cuộn (đo pixel: trùng); hàng đang mở giữ vạch trái 3 px | P1 critique 29 |
| B1 | Đầu hồ sơ lớp | khoảng cách khối 12 px · hàng số liệu cách dòng 10 px · trang 16 px ở 375 | 8 px (mockup `.dau-lop` / `.so-lop`) · 8 px · 12 px ở 375 (mockup `.trang`) | mật độ theo mockup |
| B2 | Dải lớp chuyển (`DaiLopChuyen`) không dải nào | khối rỗng vẫn ăn một khoảng cách | ẩn (`empty:hidden`) | |

Đo (GVCN 7, MB FT 101): bảng bắt đầu 1440: 376 → 364 px · 375: 818 → 788 px. Thẻ em ~235 px (mockup ~165–230).

## Ảnh
`ho-so-lop-1440-toi.png` · `ho-so-lop-375-sang.png` — Mockup | TRƯỚC | SAU (phần đầu trang, 1100 / 2000 px đầu).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước (375) | Sau (375) | 1440 |
|---|---|---|---|
| Mở hồ sơ em (tên) | có | có | không đổi |
| ⋯ hàng em (Ghi vi phạm · + Case · Sửa thông tin · Chuyển lớp… · Nhập điểm theo quyền) | cuộn ngang mới tới | góc dưới phải thẻ | không đổi |
| Bấm W / S → Điểm thành phần (+ Sửa ›) | cuộn ngang | trên thẻ | không đổi |
| Case + PA → mở Case dưới em → Ghi KQ PA / Sửa / Lịch sử (panel tại trang) | cuộn ngang | cuối thẻ | không đổi |
| Chọn nhiều học viên (QL) → ô chọn + nền chọn + thanh thao tác | có | có (ô chọn cạnh tên trong thẻ) | không đổi |
| Lọc Tất cả · SOS · Chưa đủ dữ liệu | có | có | không đổi |
| Nhập điểm (đầu trang, ⋯ em) → panel ô sửa tại chỗ | có | có | có |
Không mất thao tác nào.

## Thử ô sửa / thao tác (Playwright, `thu8.mjs`, 46/46 ĐẠT — 375 và 1440 như nhau)
- Bảng: 375 = 33 thẻ, 0 hàng bảng; 1440 = 33 hàng. Đủ L R W S Overall + "7.0 · 7.0". Tên → `/hoc-vien/48`. ⋯ mở 4 mục, Esc đóng. W → hộp Điểm thành phần (W1 · W2 + Sửa ›), Esc đóng. Case + PA mở / gập, nút trong Case mở panel tại trang. Chọn nhiều: ô chọn, nền chọn, thanh thao tác. Bảng không gửi yêu cầu ghi nào.
- Ô sửa điểm (Nhập điểm → L Bùi Thảo Vy): bấm ô → hộp sửa, con trỏ trong ô · gõ 30 + Esc → hỏi "Bỏ điểm …? Bỏ · Gõ tiếp" (không mất chữ), Gõ tiếp giữ 30, Bỏ → ô giữ "Nhập", không gửi gì · gõ 30 + Enter → PUT 200, ô "30 câu, band 7.0" · kịch bản "Không lưu được": gõ 31 + Enter → PUT 503, ô giữ giá trị cũ, hộp giữ "31", không báo xong · trả kịch bản normal → Enter lưu 31 (200) · xoá số + Enter → ô về trống (dọn dữ liệu thử). Kịch bản luôn trả `normal` (try/finally).

## Phép kiểm
`typecheck` · `kiem-esbuild` (0 cảnh báo) · `zRaUiChay` 298 đạt, 1 đỏ EN-HOSO (đã biết, không do PR). Không phép kiểm nào phải sửa mốc; chỉ cập nhật chú thích cũ ở `prHvl` (BangHoSoLop 375 "cuộn ngang" → thẻ).

## Đề xuất chưa làm (cần sắp lại khối — chờ PTA / chủ SP)
Đầu trang web vẫn cao hơn mockup (bảng bắt đầu ~364 px vs ~170 px ở mockup 1440) vì có khối mockup không vẽ: dòng GV bộ môn, badge (bài chờ chấm / việc quá hạn), thanh 3 việc, hàng Cách xem (Tổng hợp · Cần hỗ trợ · Kết quả đầu ra) + Sửa thông tin.
1. Gộp badge "n bài chờ chấm · n việc quá hạn" vào cùng hàng GV bộ môn (bớt ~36 px).
2. Thanh việc: một hàng gọn "Việc của tôi ở lớp: n · quá hạn n ›" thay 3 ô (mockup chỉ có "Việc của tôi ở lớp 6 việc" ở hàng số liệu) — bớt ~70 px.
3. Hàng Cách xem: đưa vào hàng chip lọc của bảng hoặc dời Sửa thông tin vào ⋯ (375: bớt ~90 px — nút đoạn 3 mục đang xuống 2 dòng + Sửa thông tin một dòng riêng).
4. Thẻ 375: Target · MT đang là 2 dòng nhãn — có thể gộp một dòng "Target 7.0 · MT3" (cần thêm kiểu cột cho thẻ `Bang`).
