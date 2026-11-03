# HINH-HAN-XA-2 — cột Trạng thái hồ sơ lượt 150 px

Nguồn: chủ SP quyết 02/11 (plan.md "02/11 khuya": "Cột Trạng thái hồ sơ lượt: 150 px") theo critique 29/10 — **khác mockup có chủ ý**
(mockup v7 `ho-so-luot-test.html` cột 17 % ≈ 238 px; #784 đã đặt theo mockup, nay chủ SP chốt hẹp lại). Quyết định mới hơn thắng mockup (CLAUDE.md mục 1).

## Sửa
- `MockDetailPage.tsx` `ROW_GRID` (lượt FT) và `LuotThuongPage.tsx` `LUOI_MON` (lượt lớp thường, cùng khung): cột 4 `minmax(11rem,1fr)` / `minmax(10rem,1.2fr)` → `150px`.
  Đo 1440: FT 237 → 150 px, lớp thường 242 → 150 px; phần dư sang Nhận xét / Case.
- Chip trạng thái vốn `nowrap` → ở 150 px hai nhãn tràn ("Vắng lần 1 · chờ xếp lại" +16 px, "Nhập bù, không tính hạn" +25 px).
  `O_CHIP_XUONG_DONG` (`ui/Nhan.tsx`): chip trong ô này được xuống dòng cân (`text-wrap: balance`, bo 11 px) — không cắt chữ, không đổi chữ, không thêm khoá EN.
- 375 (< `md`): không đổi (ô Trạng thái nằm trong dòng gói, không theo cột).

## Kiểm
- Quét Playwright `/mock-test/1…260` + `/luot-test/1…260` vai QL 1440: 356 trang có bảng, 1 394 ô Trạng thái — **0 ô tràn** (chỉ đổi 150 px, chưa cho chip xuống dòng: 10 ô tràn ở id 1…120).
- Ảnh: `bang-ft-1440-toi-truoc|sau.png`, `bang-thuong-1440-toi-truoc|sau.png` (trước | sau) · `luot-ft-1440-toi.png`, `luot-thuong-1440-toi.png`, `luot-thuong-375-sang.png` (mockup | web;
  `anh-cap` chụp mockup v7 ở chế độ sáng — mockup v7 không có công tắc tối).

## Khớp
| Thành phần | Mockup | Web | Kết quả |
|---|---|---|---|
| Bề rộng cột Trạng thái | 17 % (~238 px) | 150 px | KHÁC — quyết định chủ SP 02/11 |
| Chip trạng thái (màu, cỡ 12 / 600, chấm, cao 22) | `.nhan` | `Status` / `Nhan` không đổi | KHỚP |
| Chữ đủ, không cắt | nowrap (cột rộng) | xuống dòng cân khi dài | KHỚP (nghĩa) |
| Dòng phụ dưới chip (hạn, người làm) | chữ phụ 12 | giữ | KHỚP |
| 375 | gói dòng | không đổi | KHỚP |

KHỚP 4 / 5 = 80 % so với mockup; dòng KHÁC duy nhất là bề rộng chủ SP đã chốt (đúng việc của PR).

## Thao tác trước → sau
Không đổi thao tác: mở kỹ năng (bấm dòng / ▸), ô điểm, Nhập điểm / Xếp lại bài vắng, ⋯, Lịch sử lượt — giữ nguyên vị trí, chỉ cột Trạng thái hẹp lại.
