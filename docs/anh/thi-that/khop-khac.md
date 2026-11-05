# PR-4 THI-THAT — khớp / khác mockup v13 (C1–C7)

Mockup: `thiet-ke/v13/phan-tich-thi-that.html`. Ảnh cặp mockup | web: `truoc-*.png` (main trước PR) · `sau-*.png` (nhánh này, DB demo + 17 kết quả thi thật giả để có số).

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Tệp | Ảnh | KHỚP / KHÁC |
|---|---|---|---|---|
| C1 | Tab "Thi thật" (đổi tên), bỏ ô đoạn Mock / Thi thật | `PhanTich` (`shared/domain/phanTich.ts`), `KetQuaThi.tsx` | sau-c1 | KHỚP |
| C1 | 5 thẻ: HV thi · Exceed · Đạt · Fail (số + %) · Không thi | `KetQuaThi.tsx` `DaiChiSo` | sau-c1 | KHỚP |
| C1 | Từng kỹ năng (KN · HV · Exceed · Đạt · Fail · Điểm TB, % mờ dưới) | `BangKyNang` | sau-c1 | KHỚP |
| C1 | Theo GV (GV × kỹ năng, Fail cao trước, tên GV dòng đầu, kẻ giữa GV) | `BangGv` | sau-c1 | KHỚP — chiều cao dòng giữ 44 px như bảng web (mockup ~56 px do lưới giãn) |
| C1 | Danh sách: L R W S · OVR · Target · Kết quả (Exceed / Đạt / Fail) · Bước tiếp | `DanhSach` | sau-c1 | KHỚP — giữ nhóm lớp, phân trang, Bước tiếp chỉ đọc |
| C1 | Hàng lọc (thời gian, lớp), Xuất Excel | nền cũ | sau-c1 | GIỮ nền web (chủ SP 05/11: phần nền giữ web) — ô "Toàn bộ \| Chọn khoảng tuần" giữ, không đổi sang ô ngày |
| C2 | Panel P-TT (cột kỹ năng đang xét tô nền) | `BangLuotPanel` kiểu `'thi-that'` | sau-c2 | KHỚP — khung panel cạnh phải như P-FT (#976) |
| C3 | Panel P-GV + cột Tuần dạy "8/12 · 67 %", dòng "6 / 11 HV Fail · 55 % theo tuần dạy", "W1 tính nửa W" | `BangLuotPanel` + `oThiThat` (`dem`) | sau-c3 | KHỚP |
| C4 | 375 sáng: thẻ chỉ số 2 cột, Từng kỹ năng bảng hẹp, Theo GV thẻ (3 + "Xem n GV còn lại"), danh sách thẻ | `TheGv`, `DanhSach` | sau-c4 | KHỚP |
| C5 | TVV / GV: không có Theo GV (máy chủ trả `gv: null`; panel GV → 403) | `thiThatTab`, `oThiThat` | sau-c5 | KHỚP |
| C6 | Rỗng | `RongDau` (giữ dáng cũ) | sau-c6 | KHỚP |
| C7 | ⋯ Test + SOS "Xuất kết quả từng lượt" | `TongHopTestSos.tsx` (chỉ thêm mục), `xuatMock.ts` | sau-c7 (vai TVV) | KHỚP (XM-3) |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Bấm số thẻ → panel | Lượt thi · Đạt Target · Chưa đạt · Bước tiếp chưa chọn | HV thi · Exceed · Đạt · Fail · Không thi; + mọi số Từng kỹ năng, Theo GV | ĐỔI (2C-4..8) |
| Thẻ "Bước tiếp chưa chọn" | có | bỏ — cột Bước tiếp vẫn ở danh sách ("Chưa chọn" mờ) | BỎ thẻ (mockup C1 không có; chọn ở Sau thi) |
| Ô đoạn Mock Test \| Thi thật | có | bỏ | BỎ (2C-1) |
| Mock: Xếp theo SOS, Mọi kết quả, chip SOS → panel Case | có | bỏ | BỎ (2F: Test + SOS chia mức SOS; Case qua tên em) |
| Xuất Excel Mock | nút cuối hàng lọc (tab Kết quả Test) | ⋯ Test + SOS "Xuất kết quả từng lượt": vai có `xuatMt` → hộp đầy đủ như nay; vai khác → tệp như nút cũ | ĐỔI chỗ, không vai nào mất (XM-3) |
| Xuất Excel thi thật | có | có (cột "Đạt Target" → "Kết quả" Exceed / Đạt / Fail) | GIỮ |
| Lọc thời gian · lớp · chi nhánh | có | có | GIỮ |
| Phân trang 10 / 20 / 50 | có | có | GIỮ |
| Tên em / mã lớp → hồ sơ | có | có (cả panel) | GIỮ |
| Phân tích GV · hồ sơ GV "Kết quả thi thật" | % Pass Target theo lần thi, GV lớp cuối (C10) | % theo tuần dạy; n/m = mục em × kỹ năng GV từng dạy; panel một dòng một mục | ĐỔI SỐ, giữ bố cục (2F) |

## [XM] gửi PTA

- [XM-T1] Phân tích GV / hồ sơ GV: đơn vị "Kết quả thi thật" của GV đổi từ LẦN THI sang MỤC (em × kỹ năng GV dạy); số to = % theo tuần dạy (`pt`), n/m = số mục (= số dòng panel). Hàng lớp ở bảng Học thuật hồ sơ GV = lớp lúc thi của em (có thể là lớp GV không dạy).
- [XM-T2] Phân tích GV chỉ có hàng cho GV có phân công trong khoảng — GV đã thôi dạy trước khoảng không có hàng, nhưng vẫn có ở Theo GV của tab Thi thật.
- [XM-T3] "Điểm TB" ở Theo GV = TB có trọng số tuần dạy (cùng cách tính %).

## Turso

`/phan-tich/thi-that`: ≤ 6 câu (demo đo QL 6 · QT 7 · CX 7 · TVV 8); Theo GV thêm 1 câu phân công theo `class_id` của các em trong tập (ghi danh nhớ chung với lớp lúc thi). Panel ô chỉ tải khi bấm (6–7 câu). Trần ở `tocDoDuong.ts`.
