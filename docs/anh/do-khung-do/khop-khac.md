# DO-KHUNG-DO — đo khung trên main, phân loại lỗi

Đo trên `73395c4ed` (main sạch, `npm run seed`, cổng riêng): **70 lỗi** + 176 miễn, 62 kịch bản ✗, **không crash** (9 kịch bản 375 cuối lượt của 31/10 không lặp lại). Sau PR: **0 lỗi**, 425 ✓, 216 miễn (thêm 40 do 5 tab Phân tích mới đo).

## Phân loại

| Lỗi | Loại | Xử lý |
|---|---|---|
| Bảng điểm lớp thường g1 tới −83 px | **Thật** (16 px) + công cụ | ⋯ ẩn giữ chỗ 32 px cuối ô nên chữ / ô trong ô lệch trái 16 px so tiêu đề → tiêu đề chừa cùng chỗ (`index.css`, chỉ máy có rê chuột ≥ 640). 83 px là do công cụ so mép trái; ô của `Bang` nay căn theo `text-align` |
| `gv-nhap-diem` "Hạn" g1 75 px | Công cụ | Chữ dài lấp kín ô bị đoán "giữa" → lấp ≥ 90 % thì theo `text-align` |
| "·" đầu panel | Công cụ | KhungPanel cố ý cắt dấu đầu dòng → (f) bỏ chữ `aria-hidden` |
| `cv-tvv-sau-thi-375` "thi IELTS" mất 2 chữ đầu | **Thật** (ẩn dưới lỗi "·") | Mục dài gãy dòng lùi vào vùng cắt 20 px. KhungPanel: "·" và nội dung thành hai cột flex — sửa cho mọi panel có `dong2` dài |
| `panel-sua-tt`, `chon-nhieu-hv` hết giờ | Công cụ | Nút đã dời / đổi tên: ⋯ › "Sửa thông tin học viên", "Chọn nhiều" |
| `test-diem-lop-375` tên cắt 5 px (5 màn) | **Thật** | Thẻ `LuoiFT`: thiếu chỗ thì chip xuống dòng, không cắt tên |
| `phan-tich-375` ⓘ | Công cụ | Chỉ đệm vùng chạm 44 px chạm mép (ⓘ nguyên vẹn) → (d) tính hộp nội dung |
| `hv-thuong-375` Progress Test | **Thật** | Cột Lượt 112 → 136 (chữ 112 + đệm 24) |
| `hv-hanh-trinh-375` Case · MT1 · SOS tràn | **Thật** | Cột tên hẹp 160 → 180 (trục mất 20 px) |
| `cv-ho-tro-375` "Nếu duyệt" | **Thật** | < 640 xuống dòng thay vì cắt (hậu quả phải đọc được; `title` không dùng được ở điện thoại) |

## Công cụ thêm
- `do-bang` g1 tính đúng cột khi đầu cột `rowSpan`.
- `do-khung` thêm 5 tab Phân tích (1440 / 375 / 1366 / 1280). Lỗi g1–g3 ở đó là chủ ý mockup v8 (cột cây thụt cấp, tiêu đề thẳng viền chip, hàng con 38, dòng phụ nhiều dòng) → miễn `PT-BANG`.

## Bảng thao tác TRƯỚC → SAU
Không đổi thao tác, quyền, luồng. Không mất thao tác nào.

## KHÁC (chủ SP xem ảnh)
- `test-diem-lop-375-toi.png`: em có chip dài cao thêm ~30 px (chip xuống hàng riêng) — đổi lấy tên đủ.
- `cv-ho-tro-375-toi.png`: mỗi thẻ duyệt thêm 1 dòng.

## Để sau (ngoài phạm vi, đo EN cuối PR)
- EN: dòng "If approved: PA bắt đầu hôm nay…" và "ĐA" chưa dịch ở `cv-ho-tro` (có từ trước).
- EN: `bang-diem-thuong` g1 3,1 px + g3 67 (chữ "Comment" dài hơn "Nhận xét"), `gv-nhap-diem` "Expected" −3,2 px.

Ảnh: `bang-diem-thuong-1440-toi.png` · `cv-tvv-sau-thi-375-toi.png` · `test-diem-lop-375-toi.png` · `hv-hanh-trinh-375-toi.png` · `cv-ho-tro-375-toi.png` · `hv-thuong-375-toi.png` (trái / trên = main, phải / dưới = PR).
