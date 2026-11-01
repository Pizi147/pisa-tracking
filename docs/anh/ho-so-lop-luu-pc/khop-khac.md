# PR-D ho-so-lop-luu-pc — khớp / khác mockup `thiet-ke/v9/phan-cong-gv.html` (#k9, khung 21)

Ảnh cặp (trái mockup, phải web): `d1-1440.png` (QL · MB FT 102 · Thông tin lớp › Phân công › Sửa › đổi S › Lưu phân công → hộp).
Cách chụp: `KHUNG_BASE=http://localhost:<cổng> PW=<playwright> node <bản anh-cap có bước bấm> thiet-ke/v9/phan-cong-gv.html "#k9 figure >> nth=0" hoc-vien/lop/4 2 1440 …`

## Bảng truy vết khung → thành phần → ảnh
| Khung | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| #k9 0 hộp Lưu | `HopLuuPhanCong` (cùng hộp với góc): Hiệu lực · Đổi người (ô tích bàn giao) · "→ n việc … góp ý · hạn" · dòng GV cũ vẫn xem · Quay lại sửa / Lưu · tạo n việc | `d1-1440` | KHỚP chữ + hình. KHÁC: hộp neo cạnh TRÁI panel (mockup cạnh phải) |
| #k9 0 lưới ô Phân công | `LuoiPhanCong` (giữ V4: ô "Đổi" + danh sách) | `d1-1440` | KHÁC có lý do: giữ thao tác cũ (mockup select) |
| #k9 0 chip "Nháp · n ô đổi" | chưa có | — | KHÁC (xem [XM] plan.md) |
| #k9 0 Huỷ / Lưu phân công | giữ ở đầu phần Phân công (V4) | `d1-1440` | KHÁC có lý do (giữ vị trí nút) |
| Hàng GV đầu hồ sơ lớp + Thông tin lớp (xem) | `DongChoDoi`: "{môn} {A} → {B} từ {W1 NOV}", lỗi áp ⚠ chỉ QL (mockup ghi chú khu 3) | — (đã chụp trực tiếp trong phiên, không có khung vẽ) | KHỚP chữ ghi chú |

Tỉ lệ: 4 / 6 dòng KHỚP hoặc GIỮ có lý do; 2 dòng KHÁC hình (neo hộp, chip Nháp) chờ chủ SP quyết.

## Thao tác TRƯỚC → SAU
| Nơi | Trước | Sau |
|---|---|---|
| Lưu phân công ở Thông tin lớp, có cặp A → B | `PUT /classes/:id/teachers`, hôm nay, không bàn giao | cùng hộp hiệu lực + bàn giao với góc (`POST /phan-cong/luu`), Hoàn tác toast |
| Lưu không cặp (Chưa có → B, bỏ người) | như trên | lưu thẳng hôm nay, toast + Hoàn tác |
| Lưới ô, Đã từng dạy, FOU Tách/Gộp, GVCN chỉ đổi ô bộ môn, 409 gộp | — | GIỮ |
| Lịch đổi chờ | không thấy ở hồ sơ lớp | hàng GV + Thông tin lớp hiện "… từ W? MON" |

## Đo
`classOverview` gộp lịch chờ vào câu `gop_y_tuan` (UNION ALL): +0 câu, đã kiểm D2.
