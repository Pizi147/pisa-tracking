# V8-HSL-2 — Dòng Overall đầu bảng FT, tab Phân tích lớp · CHỜ CHỦ SP DUYỆT ẢNH CẶP

Mockup `thiet-ke/v8/ho-so-lop.html` khung D. Vai GVCN 7, lớp MB FT 101, 1440 tối + 375 sáng.
Cột TRƯỚC = cùng bản web, chỉ ẩn dòng Overall (chặn API khi chụp). Cột đầu và độ đậm cũ xem `docs/anh/v8-hsl/d-phan-tich-*.png`.

| Tệp | Nội dung |
|---|---|
| `d-phan-tich-1440-toi.png` · `d-phan-tich-375-sang.png` | mockup D · TRƯỚC · SAU |
| `d-panel-overall-1440-toi.png` · `d-panel-overall-375-sang.png` | bấm ô Overall MT1: Chưa đạt · Đạt, dòng điểm đúng lượt |

## Truy vết khung → thành phần
| Thành phần | Kết quả | Ghi chú |
|---|---|---|
| Dòng "Overall" đầu bảng FT, không mũi tên, nền hàng lớn đậm, chữ 700 | KHỚP | `.hang-lon`; các dòng kỹ năng giữ `.hang-lon.dong` nhạt hơn |
| Ô "✗ a/b" dưới nửa, chữ màu dưới kỳ vọng (G12) | KHỚP | ✗ cộng màu `text-kq-duoi`, thử bằng dữ liệu giả 3/19: seed không có ô dưới nửa |
| Ô Overall màu chữ thường, không gạch chân | KHÁC | theo luật "ô số = mở tại chỗ" + plan (`oPhanTichLop … 'overall'`): số nhấn, gạch chân, bấm mở panel. Tính năng theo luật |
| Số hàng kỹ năng độ đậm thường | KHỚP | trước đậm 700 (dòng D "số đậm" của V8-HSL) |
| Cột đầu 220 px (1440) | KHỚP | trước 160 |
| 375: thấy đủ MT1 · MT2 · MT3 | KHỚP | cột đầu 140 (mockup 120), bảng FT tối thiểu 480 px; lớp thường giữ 560 vì ô có chữ "HV đạt" |
| 375: "Writing 1" một dòng | KHÁC | web giữ tên đầy đủ "Writing Task 1" (V8-HSL đã duyệt), xuống hai dòng ở cột 140 |
| Hàng cao 48 | KHÁC | giữ 40 / 44 của `.hang-lon` dùng chung nhiều màn |

**KHỚP 5 / 8 thành phần; 3 KHÁC có lý do** (luật ô số · giữ tên đã duyệt · thành phần chung). Cổng ≥ 90 % tính trên cả màn: `docs/anh/v8-hsl/khop-khac.md` dòng D "Overall" chuyển KHÁC → KHỚP, 25 / 27, tính cả GIỮ / BỎ 27 / 29 ≈ 93 %.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Mở dòng kỹ năng ra hai bảng nhỏ · `?ky-nang=` | có | có |
| ⓘ cách tính | có | có, thêm một câu về dòng Overall |
| Xem em của ô Overall | không có | bấm ô → panel Chưa đạt · Đạt, Esc đóng |

Không mất thao tác. Lớp thường không đổi (lớp 6: `ca-bai` + 4 môn, không có Overall).

## Dòng đọc Turso
`/classes/:id/phan-tich-lop`: 8 câu, 712 dòng trước = sau (JOIN thêm `report_periods` trong cùng câu), trần 24/25/23 giữ.
Đường mới `/classes/:id/issue-board/o?cot=overall&kind=mt1`, chỉ chạy khi MỞ: 9 câu, 276 dòng (đọc đúng một đợt; đọc cả lớp là 721). Trần 11 câu, 360 dòng. Vượt mốc panel "≤ ~4 câu" vì dùng lại hàm tính của ô để số = danh sách; vẫn nhẹ hơn panel `cot=case` cùng tab (16 câu).

## [XM] cần PTA quyết
- Dòng kỹ năng của bảng này VẪN tính em KCK có Target (`danhGiaMon` không loại), dòng Overall thì không (đúng kế hoạch, cùng Đạt MT). Có em KCK thì mẫu số Overall nhỏ hơn dòng kỹ năng. Không sửa ở PR này vì đổi số đang hiện; ⓘ đã ghi rõ.
- Cột Overall dùng Target hiện tại của em (`danhGiaMon`), không phải Target lúc lượt như Kết quả Test. Em đổi Target sau lượt thì hai màn có thể lệch; giữ để cùng dòng kỹ năng.

## Phép kiểm sửa mốc
- `hocVienLop` PR-Qa §3.7: khung FT thêm "Overall" đầu danh sách dòng (mockup v8 D đã duyệt); số ô kỹ năng giữ nguyên.

## Thử
Playwright 375 + 1440: hàng đầu `Overall 7/9 14/19 2/3 — —` · bấm ô → panel `Overall · MT1 9 học viên`, Chưa đạt 2 · Đạt 7, dòng điểm MT1 · W4 AUG · Esc đóng · không tràn ngang · bản Anh có nhãn ⓘ · 0 lỗi tải. `impeccable detect`: 0 · web-design-guidelines: `<table>` ngữ nghĩa, `tabular-nums`, nút thật có `aria-label`, không lỗi mới · `/ponytail-review`: Lean already.
