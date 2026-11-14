# GD-1b — Dòng việc "Lớp · tên việc ngắn" + "Chấm Speaking" (chủ SP lời 24, `04-thiet-ke.md` mục 14)

Mẫu hướng: mockup ⑤ `thiet-ke/v21/bang-mau.html` khu B (PR #1558, chưa duyệt — dùng làm hướng theo PTA Plan). Lời 24 thắng hình mockup khi khác.
Ảnh cặp (trái mockup ⑤ B1 / B2 · phải web, demo 14/09, GVCN Trần Ngọc Hà — vai 7):
`cap-1440-toi.png` (tab Chấm điểm) · `cap-1440-case.png` (tab Case học thuật) · `cap-1440-y-thuc.png` (tab Ý thức & Phối hợp) · `cap-375-case.png` (375 sáng).
Dữ liệu demo khác dữ liệu mockup — không tính lệch.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup / lời | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | B1 ① dòng lớp × tuần "MB FT 101 · Listening, Reading" + thẻ tuần, số bài | `DongLop` / `DongViec` — tên = `voiLop()` | cap-1440-toi | KHỚP |
| 2 | B1 ② **việc một em cùng dạng "Lớp · tên việc"**, tên em là thẻ phụ (link) (lời 24) | `DongViec`: tên "MB FOU 12 · Reading", dòng phụ "Âu Nhật Nam · …" (link hồ sơ em) | cap-1440-toi, cap-1440-case | KHỚP |
| 3 | B1 ③ dòng gộp "MB FT 112 · Mô tả Case" + "3 em ▾" | `DongLop` (khay em giữ) | cap-1440-case (MB FT 101 · Mô tả Case · 4 em ▾) | KHỚP |
| 4 | B1 ④ dải "Chấm Speaking" (bỏ "Việc chung của nhóm GV Speaking"), đếm bài, vạch mờ | `MUC_CV` 'cham-cheo' = "Chấm Speaking"; đếm bài + vạch mờ giữ (GD-1) | — (GV 7 không dạy S) | KHỚP (mã) |
| 5 | Panel Chấm Speaking: không ghi "Việc chung" | `PanelChamSpeaking` nhãn loại "Việc · Chấm Speaking" (cùng dạng "Việc · {tab}" panel khác) | — | KHỚP (mã) |
| 6 | Ô việc gọn Ý thức / Phối hợp: cũng "Lớp · tên việc" | `DongGon`: tên "MB FT 101 · Xem vi phạm mới", bỏ mã lớp mờ ở dòng 2; chip tên em giữ | cap-1440-y-thuc | KHỚP |
| 7 | B1 ⑤ Báo cáo PH "MB FT 101 · Viết Báo cáo PH" | việc LG-3 đi qua cùng `DongViec` / `DongLop` | — (seed: đợt chưa mở cho GV 7) | KHỚP (mã) |
| 8 | B2 375: cùng dòng, chạm cả dòng, hạn xuống hàng | dáng 375 sẵn có | cap-375-case | KHỚP |
| 9 | Bỏ dạng "vòng chữ đầu + tên em + cây việc" | web không còn dạng đó ở danh sách việc (dòng một em vẽ phẳng) | cap-1440-case | KHỚP |

**KHỚP 9 / 9 = 100 %** về những gì lời 24 đổi.

## 2. KHÁC (có lý do)
- **KHÁC-1** Ô vuông biểu tượng đầu dòng (`.av vuong`) và vạch hạn "Quá hạn / Hôm nay / Hạn đến …" của mockup ⑤ — web GIỮ dáng dòng V18 đã duyệt (không ô vuông, quá hạn đầu mục). Mockup ⑤ chưa duyệt; lời 24 chỉ đổi dạng tên. Đổi dáng này là việc của PR "bộ thành phần chung" sau khi ⑤ duyệt.
- **KHÁC-2** Tên em ở dòng phụ là chữ link (hover gạch chân) như web đang có, mockup vẽ thẻ nền xám.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Bấm dòng việc → panel tại chỗ / sang trang | có | có | GIỮ |
| Bấm tên em → hồ sơ em | dòng phụ | dòng phụ | GIỮ |
| "n em ▾" mở khay em; chip tên em (Ý thức) mở việc của em | có | có | GIỮ |
| Đọc lớp của việc | dòng phụ (chữ mờ) | đầu tên dòng "Lớp · …" | ĐỔI chỗ (lời 24) |
| Tên mục / panel Chấm Speaking | "Việc chung của nhóm GV Speaking" · "Việc chung · Chấm Speaking" | "Chấm Speaking" · "Việc · Chấm Speaking" | ĐỔI chữ (lời 24) |

Không thao tác nào bị mất.

## 4. Sửa kèm
- Ô việc gọn (`DongGon`) cao cố định 64 px → tối thiểu 64 px: tên dài sau khi thêm lớp ("MB FT 101 · Meeting CX/GĐCN (sau Mock)") xuống dòng không đè chip tên em.

## 5. Turso
Chỉ đổi hiển thị — 0 câu, 0 request thêm.
