# PR-D ho-so-lop-luu-pc — khớp / khác mockup `thiet-ke/v9/phan-cong-gv.html` (#k9, khung 21)

Ảnh cặp (trái mockup, phải web): `d1-1440.png` (QL · MB FT 103 · Thông tin lớp › Phân công › Sửa › đổi S › Lưu phân công → hộp).
Ảnh web đơn (mockup không vẽ): `d1-375-web.png` (QL, 375 sáng: hộp thành tấm dưới đáy màn) · `d1-gvcn-1440-web.png` (GVCN: hàng GVCN chỉ đọc + "Đổi GVCN: nhờ Quản lý chi nhánh", đổi S → hộp → Lưu → toast; đã bấm thử cả hai vai, lưu được).
Cách chụp: `KHUNG_BASE=http://localhost:<cổng> PW=<playwright> node <bản anh-cap có bước bấm> thiet-ke/v9/phan-cong-gv.html "#k9 figure >> nth=0" hoc-vien/lop/4 2 1440 …`

## Bảng truy vết khung → thành phần → ảnh
| Khung | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| #k9 0 hộp Lưu | `HopLuuPhanCong` (cùng hộp với góc): Hiệu lực · Đổi người (ô tích bàn giao) · "→ n việc … góp ý · hạn" · dòng GV cũ vẫn xem · Quay lại sửa / Lưu · tạo n việc | `d1-1440`, `d1-375-web` | KHỚP chữ + hình. KHÁC có lý do: hộp neo cạnh TRÁI panel — panel web là ngăn kéo sát mép phải màn, không còn chỗ bên phải |
| #k9 0 lưới ô Phân công | `LuoiPhanCong` (giữ V4: ô "Đổi" + danh sách) | `d1-1440` | KHÁC có lý do: giữ thao tác cũ (mockup select) |
| #k9 0 chip "Nháp · n ô đổi" | `PhanThongTin nhanPhu`: chip `pc-nhan-nhap` cạnh tiêu đề Phân công khi có ô đổi | `d1-1440` | KHỚP |
| #k9 0 Huỷ / Lưu phân công | giữ ở đầu phần Phân công (V4) | `d1-1440` | KHÁC có lý do (giữ vị trí nút) |
| Hàng GV đầu hồ sơ lớp + Thông tin lớp (xem) | `DongChoDoi`: "{môn} {A} → {B} từ {W1 NOV}", lỗi áp ⚠ chỉ QL (mockup ghi chú khu 3) | — (đã chụp trực tiếp trong phiên, không có khung vẽ) | KHỚP chữ ghi chú |

Tỉ lệ: 5 / 6 dòng KHỚP hoặc GIỮ có lý do (≈ 83 %); KHÁC còn lại đều có lý do (neo hộp bên trái vì ngăn kéo sát mép phải; nút Huỷ / Lưu và ô "Đổi" giữ theo V4) — chờ chủ SP quyết. Đo bằng mắt, không đo điểm ảnh.

## Thao tác TRƯỚC → SAU
| Nơi | Trước | Sau |
|---|---|---|
| Lưu phân công ở Thông tin lớp, có cặp A → B | `PUT /classes/:id/teachers`, hôm nay, không bàn giao | cùng hộp hiệu lực + bàn giao với góc (`POST /phan-cong/luu`), Hoàn tác toast |
| Lưu không cặp (Chưa có → B, bỏ người) | như trên | lưu thẳng hôm nay, toast + Hoàn tác |
| Lưới ô, Đã từng dạy, FOU Tách/Gộp, GVCN chỉ đổi ô bộ môn, 409 gộp | — | GIỮ |
| Lịch đổi chờ | không thấy ở hồ sơ lớp | hàng GV + Thông tin lớp hiện "… từ W? MON" |

## Đo
`classOverview` gộp lịch chờ vào câu `gop_y_tuan` (UNION ALL): +0 câu, đã kiểm D2.

## Rà
`/web-design-guidelines` trên 4 tệp web chạm: không vi phạm (nút thật, nhãn aria, danh sách có `aria-label`, chip có chữ không chỉ màu, hộp giữ focus + Esc). `/impeccable audit` chưa chạy trọn bộ — chỉ rà tay các mục tương đương (tương phản dùng token sẵn có, 375 đã chụp, mục chạm ≥ 44 px dùng lại nút sẵn có).
