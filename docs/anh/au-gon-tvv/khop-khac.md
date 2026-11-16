# AU-GON · PR1 TVV-GON — khớp / khác

Ảnh cặp TRƯỚC | SAU (demo, tối, TVV Phan Mai): `cap-cv-1440.png` · `cap-cv-375.png` (Công việc · panel Báo PH) · `cap-ho-so-hv…` = `cap-hs-1440.png` · `cap-hs-375.png` (hồ sơ HV).
Mockup tham chiếu: ④ (#k1 dòng việc, #k2 panel) và ③ (#k6 đầu hồ sơ). Phông Be Vietnam Pro đã nạp (`document.fonts`).

| Mã | Thay đổi | Mockup |
|---|---|---|
| A3-01 | Dòng Báo PH: bỏ "còn n ngày" ở thẻ phụ (hạn chỉ ở cột) và bỏ bậc lặp "REPORT 1" ở thẻ phụ (bậc đã ở tên dòng) | KHỚP ④ #k1 |
| A3-02 | Tiêu đề panel: "Báo PH · REPORT 1" / "Sau thi" / "Chốt ngày thi" (tên em chỉ ở dòng dưới) | KHỚP ④ #k2 |
| A3-16 | Panel Công việc ≥ 1024: khung cao ≤ 100dvh − 18rem → chân (Đóng · Lưu · Lưu · việc tiếp) luôn trong màn 1440 × 900 (trước: dưới mép, y ≈ 1049) | KHỚP (chân dính đáy như 375) |
| A3-18 | Chốt ngày thi: bỏ chữ "hiện" trơ | — |
| A3-19 | Dòng Sau thi: "Thi 05/09" (bỏ thứ, bỏ "Đã thi" lặp); bỏ ⚠ trước "Chưa liên hệ được" | KHỚP ④ #k1 |
| A3-22 | Chân panel việc TVV: chỉ hiện "● Chưa lưu" khi form khác lúc mở | — |
| P1-14 | Hồ sơ HV TVV / CX / Admin: một dáng "+ Task" + "⋯" (375: bớt ~3 hàng nút) | KHỚP ③ #k6 |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Sửa thông tin · Tạm dừng / Kết thúc học · Kết quả thi thật · Lịch sử (TVV / CX / Admin) | 4–5 nút rời đầu hồ sơ | cùng mục trong "⋯" (đủ mục, chỉ đổi chỗ) |
| + Task, Quay lại học (lưu trữ) | nút | không đổi |
| Ghi báo PH / Lưu / Lưu · việc tiếp / Đóng | chân panel dưới mép màn ở 1440 × 900 | cùng nút, trong màn |
Không mất thao tác nào.

## Dòng đọc Turso
Không đổi (chỉ chữ + class; B1-09 không thuộc PR này). Server chỉ đổi chuỗi `chuDaThi` (một chuỗi trong câu có sẵn).
