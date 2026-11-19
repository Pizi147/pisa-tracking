# TEN-HV-DU — luật N55 (chủ SP 19/11): tên học viên không bao giờ bị cắt "…", hạn chế xuống dòng

Chủ SP thêm 19/11 (giữa lượt): "đồng bộ, để hết mấy chữ test xuống dòng dưới đi" → mọi chữ bài test ("Progress Test ›", "Final Test ›", "MTn ›")
LUÔN ở dòng phụ dưới tên, ở mọi hàng — dòng tên chỉ có tên.

Ảnh: tài khoản demo Head Nguyễn Khánh Vy (vai 2), giao diện tối, phông Be Vietnam Pro đã tải (`document.fonts.check` = true).
Tên dài 4–5 chữ là **tên giả** đổi tạm trong CSDL demo cục bộ để thấy lỗi (không đổi seed).

## PR1 — lưới Nhập điểm lớp thường + lưới FT

| Nơi | Trước | Sau | Ảnh cặp |
|---|---|---|---|
| Lưới lớp thường 1440 (`LuoiThuong.tsx`, Test › Lịch Test tuần / Điểm theo lớp / panel việc) | tên `truncate`, cùng dòng "Progress Test ›" → "Bùi Ngọc Kh…", "Tôn Nữ Hoàn…" | dòng tên chỉ có tên (`ten-hv`, không cắt); "Progress Test ›" đầu dòng phụ (cùng dòng tuần thi + dấu lưu); cột tên 230 → 250 để tên 5 chữ ("Nguyễn Hoàng Phương Thảo Vy") vẫn một dòng | `cap-luoi-thuong-1440.png` |
| Thẻ 375 lớp thường (`MotKyNang.tsx` `DongHv`) | tên + "Final Test ›" chung dòng; tên dài đẩy link xuống dòng riêng 44 px | tên dòng 1, "Final Test ›" đầu dòng phụ, chung dòng "Chưa đạt · 60%" (canh baseline) | `cap-luoi-thuong-375.png` |
| Hàng em chưa có lịch (`MotKyNang.tsx` `hangMo`) | `truncate` | `ten-hv` | — |
| Lưới FT 1440 (`LuoiFT.tsx`) | tên `truncate` cùng dòng "MTn ›" | tên dòng 1, "MTn ›" đầu dòng phụ (cùng "vắng W2 SEP → W3 SEP", tuần thi, dấu lưu) | `cap-luoi-ft-1440.png` |
| Thẻ 375 FT (`LuoiFT.tsx` thẻ) | tên `truncate` (span lồng) | tên + Kết quả dòng 1; "MTn › · kỳ vọng" dòng dưới | `cap-luoi-ft-375.png` |
| Hàng S Expert riêng (`LuoiFT.tsx` `DongSExHv`) | tên `truncate` | `ten-hv`, chip xuống dòng khi thiếu chỗ | — |
| Hồ sơ lớp (`BangHoSoLop.tsx` `TenEm`) | `sm:truncate` (1440 cắt, 375 xuống dòng) | `ten-hv` cả hai cỡ | — |
| Tìm kiếm đầu trang (`Header.tsx`) | kết quả HV `truncate` | `ten-hv` | — |

Thao tác TRƯỚC → SAU: không mất thao tác nào. Tên vẫn mở hồ sơ HV, "{bài} ›" vẫn mở hồ sơ lượt, Enter / mũi tên trong lưới giữ nguyên.
Bỏ `title` trên tên (tên đã hiện đủ, tooltip thừa).

Vùng chạm 375: tên và "{bài} ›" mỗi cái 40 px (trước 44), tên canh đáy, link canh đỉnh — hai dòng sát nhau như một khối (WCAG 2.5.8 ≥ 24 px).

## Chung
- Lớp `.ten-hv` (cuối `web/src/index.css`, NGOÀI `@layer`): `white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: break-word` —
  thắng `truncate` và luật cắt chung của ô bảng `.bang td[data-kieu="ten"]`.
- Phép kiểm `scripts/kiem-ten-hv.mjs` (trong `npm run check`): đỏ khi `ten-hv` đi cùng lớp cắt, khi dòng in `studentName` / `fullName` / `full_name` /
  `tenHv` / `hoTen` có lớp cắt, hoặc khi mất luật `.ten-hv` ngoài @layer. Bỏ qua có chủ ý: chú thích `ten-hv-ok` (vd tên tài khoản đăng nhập ở `Header`).
- Không đổi dữ liệu / máy chủ, không thêm request.

## Đo
- 1440: không còn phần tử tên có `text-overflow: ellipsis` bị tràn (đo bằng script chụp), không tràn ngang trang. Lưới lớp thường 1440 vốn cuộn ngang
  trong khung 45 px (bảng 1434 > khung 1389); cột tên +20 → 65 px, cột Kết quả vẫn thấy đủ chip.
- 375: không tràn ngang (`scrollWidth` = 375).
