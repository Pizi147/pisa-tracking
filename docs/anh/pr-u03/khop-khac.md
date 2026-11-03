# U03 · Hồ sơ lớp (audit 03/11) — CHỜ CHỦ SP DUYỆT ẢNH CẶP

Loại PR: **làm lại màn** (một màn một PR). Mockup `thiet-ke/audit-0311/u03-ho-so-lop.html` (vòng 3, chủ SP duyệt 03/11). Bảng ý: `docs/superpowers/specs/2026-11-03-audit-overhaul/13-ra-ux-a.md` mục U03 #1–22. Luật chung: `30-pr-giao-dien.md`.
Dữ liệu web là demo MB FT 101 (14/09/2026, vai GVCN 7) — tên / số khác mockup (CP FT 116), bố cục so theo khung. Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') = true` trước khi chụp.

## Ảnh cặp (mockup | web; 1440 tối, 375 sáng; toàn trang)
| Tệp | Khung |
|---|---|
| `a1-mo-rong-1440-toi.png` | A1 · bấm tên em → mở rộng: Điểm theo lượt + 5 ô kỹ năng + tóm tắt kỹ năng (chọn sẵn kỹ năng có Case) |
| `a2-panel-1440-toi.png` | A2 · "Xem chi tiết" → panel Case phải |
| `a3-luoi-mt-1440-toi.png` | A3 · Điểm Mock Test mở (thẻ lượt "n/N có điểm đủ", không "Đủ điểm") |
| `b1-the-em-375-sang.png` | B1 · thẻ em 375 mở: bảng lượt W gộp + 5 ô kỹ năng + tóm tắt dọc |
| `c1-khong-case-1440-toi.png` | C1 · chọn R (không Case): "Không có Case" + "+ Case", Kết quả PA "–" (chỉ web) |
| `c5-the-tieu-chi-1440-toi.png` | C5 · rê ô S → thẻ tiêu chí "S FC · LR · GRA · P → band" (chỉ web) |

## Truy vết khung → thành phần → ảnh
| Khung | Thành phần | Kết quả | Ghi chú |
|---|---|---|---|
| A1 đầu | Mã lớp 22/700 + chip nhạt Fast Track · n HV · tuần · khai giảng | KHỚP | `.tag.nhat` |
| A1 đầu | GVCN · L · R · S · W1 · W2 thành ô nhãn 12 trên – tên 15/600 dưới, vạch ngăn | KHỚP | 375 giữ "+k" |
| A1 đầu | Lượt mới nhất · Đạt MTx · SOS (ô nhãn – giá trị) …… badge đổi trang | KHỚP | SOS: tổng "n HV" như mockup + GIỮ chip theo mức nhỏ sau (không mất thông tin); Đạt giữ % + n/N + ⓘ |
| A1 | Việc của tôi · n + 3 ô + "+n ở Công việc ›"; quá hạn "⚠ quá hạn n ngày" | KHỚP | PTA 03/11 mọi màn |
| A1 | Tab Học viên · Ý thức & Phối hợp · Phân tích lớp | GIỮ | tab Ý thức không đổi (UI-2 của AUDIT-Y-THUC) |
| A1 | Nút đoạn "Tổng hợp / Cần hỗ trợ" | BỎ (FT) | #1; còn "Kết quả đầu ra" khi có đợt → nút đoạn vẫn hiện (chỉ một mục thì ẩn) |
| A1 | Chip lọc Tất cả · SOS · Chưa đủ dữ liệu …… Chọn nhiều | KHỚP | bỏ chữ "Lượt của từng HV · tuần" (#10) |
| A1 | Cột Học viên · Target · MT gần nhất · L R W S Overall (cùng rộng 76) · Kết quả · Ngày thi · ⋯ | KHỚP | #20; bỏ cột Case · PA (#2) |
| A1 | Ô W chỉ một số (không dòng W1 · W2) | KHỚP | #4 |
| A1 | Chip SOS "SOS n · L, W, S" | KHỚP | kỹ năng vào chip vì bỏ cột Case · PA |
| A1 | Ngày thi chip nhạt "Dự kiến MM/YYYY" · "Thi dd/mm" | KHỚP | `.lich` |
| A1 | MT nhập lịch sử tô ✓ / ✗ như MT thường | KHỚP | #5 (máy chủ #860 đã merge) |
| A1 | Bấm tên → mở rộng ngay dưới hàng (hàng tô nhấn, ▾) | KHỚP | #6, #14 |
| A1 | Điểm theo lượt: MT mới nhất đậm + 2 lượt trước (thiếu → Đầu vào), L R W1 W2 S OVR Kỳ vọng, "MT3 ›" mở hồ sơ lượt, "Lượt tới …" | KHỚP | demo chưa có lượt tới ở em này → không hiện thẻ |
| A1 | 5 ô kỹ năng "trước → mới" + "Có Case · có PA" / "Có Case" / "Không Case" | KHÁC chữ | mockup "Có Case · PA chạy": `/cases?classId=` chỉ có số PA, không trạng thái → "có PA" (không thêm câu đọc) |
| A1 | Tóm tắt kỹ năng: tên · phụ trách · Hồ sơ HV › · Xem chi tiết / + Case · dòng tiêu chí · Điểm · Case · PA · Kết quả PA | KHỚP | #7, #21; Case · PA: tên Case + tuần mở + PA (loại · đang chạy / chờ xác nhận) |
| A1 | Bấm ô điểm trên hàng = mở em với kỹ năng đó (W → bài thấp hơn) | KHỚP | #8 |
| A1 | Rê / focus ô W · S → thẻ tiêu chí; ô chỉ có band không thẻ | KHỚP | #22; cả ô W1 · W2 · S ở Điểm theo lượt |
| A2 | Panel Case: đầu "CASE · kỹ năng" · "em · kỹ năng" + chip SOS phải · dải Điểm MTn (✗ số lớn) · Kỳ vọng · Phụ trách · Mở; thân Case bỏ dòng tên / Điểm lặp; Ghi kết quả PA có "● Chưa lưu" + Lưu · "Lưu · kỹ năng tiếp ›" | KHỚP | 04/11: dùng lại panel Case phủ (PTA chấp nhận); thân Case (mục vạch trái, chip nguyên nhân, trích Mô tả, PA + tag) là của #882 (U02 c2 + U03 A2); trạng thái + Đổi người / Sửa GIỮ dưới dải số |
| A3 | Lưới MT: bỏ "Đủ điểm"; "Chưa xếp lịch" thay "Chờ 0 kỹ năng"; thẻ lượt "n/N có điểm đủ" | KHỚP | #13, N33 ④ — áp cả LuoiThuong · MotKyNang · LuotThuongPage · MockDetailPage |
| B1 | Thẻ em 375: lưới 5 ô giữ; chạm tên mở cuối thẻ; bảng lượt W gộp (không Kỳ vọng) | KHỚP | #17 |
| C1 / C4 | Kỹ năng không Case: "Không có Case" + "+ Case" (theo quyền) · chưa có kết quả PA "–" | KHỚP | |
| C2 | Em chưa có lượt: "Chưa có điểm." + Lượt tới | KHỚP | |
| C3 | Lỗi tải chi tiết: chỉ trong vùng tóm tắt + Thử lại | KHỚP | lỗi tải Case |

Ước khớp: 24 / 25 dòng KHỚP (96 %).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Vì sao |
|---|---|---|---|
| Bấm tên em | đổi trang hồ sơ HV | mở rộng tại chỗ; "Hồ sơ HV ›" trong tóm tắt (mang danh sách Trước / Sau) | chủ SP 03/11 |
| Cột Case + PA → thẻ Case dưới hàng (Ghi KQ PA · Sửa · Thêm PA · Lịch sử) | có | ô kỹ năng → tóm tắt → "Xem chi tiết" = panel Case có đủ các thao tác đó | chủ SP bỏ cột |
| Bấm ô W / S → hộp điểm thành phần + "Sửa ›" | có | rê = thẻ tiêu chí; bấm = mở tóm tắt (dòng tiêu chí); sửa qua "MT3 ›" hồ sơ lượt | chủ SP 03/11 vòng 2 |
| Cách xem "Cần hỗ trợ" (FT) | có | bỏ | chủ SP 03/11 |
| Nhập điểm · + Case · ⋯ đầu trang · badge · Việc của tôi · chip lọc · Chọn nhiều + thanh hàng loạt · ⋯ hàng (N26) · Kết quả đầu ra · Thông tin lớp · Điểm Mock Test gập (Dán Excel) · tab Ý thức · Phân tích lớp · MT gần nhất → hồ sơ HV đúng lượt | có | có | GIỮ |
| + Case cho kỹ năng không có Case | qua ⋯ hàng | thêm nút ở tóm tắt (cùng panel + Case) | mockup C1 |
| Ghi kết quả PA → sang Case kỹ năng kế của em | đóng, mở lại | "Lưu · kỹ năng tiếp ›" (chỉ khi mở từ hồ sơ lớp và còn Case kỹ năng kế) | mockup A2 chân |

## [XM] hỏi PTA
- **Cần hỗ trợ lớp thường:** bảng ý U03 chỉ vẽ FT; lớp thường không có mở rộng kỹ năng nên GIỮ cách xem "Cần hỗ trợ" ở lớp thường. Muốn bỏ cả lớp thường → PR riêng.
- **Panel A2:** dùng panel Case sẵn có (phủ) — PTA chấp nhận 03/11. Thẻ PA trong thân theo #882 (thẻ), mockup U03 A2 vẽ dòng nhãn – giá trị: PTA quyết giữ một kiểu.

## Turso
Mở trang: không đổi (`/roster` thêm 4 tiêu chí từ dòng điểm đã đọc: **+0 câu, +0 dòng**). Mở một em: **0 câu**. Chọn kỹ năng có Case: **1** `/cases/:id` (trước: mở Case dưới hàng gọi `/cases/:id` cho MỌI Case của em; rê ô W/S trước gọi `/attempts/:id` — nay 0).

## Chú thích `ponytail:`
Không có.
