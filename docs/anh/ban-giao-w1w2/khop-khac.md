# BAN-GIAO-W1W2-UI — panel bàn giao chuyển lớp theo mockup v11 (chủ SP duyệt 03/11)

Mockup: `thiet-ke/v11/ban-giao-w1w2.html` (N31). Ảnh cặp mockup | web (`scripts/anh-cap.mjs`, DB demo cục bộ, ngày demo 14/09; dữ liệu thử: MB FT 102 chuyển 4 em,
Mr. Khoa Lê (8) dạy W1 + W2, GVCN Ms. Linh Cao (10); Kiều Thu Trang chỉ học W1, Tạ Thu Quỳnh lớp mới vẫn Mr. Khoa dạy W1, Mạc Đức Long có câu Writing cũ):
- `cap-gvbm-w1w2-1440-toi.png` (khu 2) · `cap-gvbm-w1w2-375-sang.png` (khu 4) — GV dạy cả W1 + W2
- `cap-gvcn-1440-toi.png` · `cap-gvcn-375-sang.png` (khu 1) — GVCN lớp cũ

## Bảng thành phần — KHỚP / KHÁC

| # | Thành phần | Kết quả | Ghi chú |
|---|---|---|---|
| 1 | Nhãn "VIỆC · BÀN GIAO" (GVBM + GVCN) | KHỚP | thêm ở PR này |
| 2 | Tiêu đề "Bàn giao môn W1 · W2 · {lớp}" | KHỚP | |
| 3 | Dòng ngữ cảnh "n em · hạn … · mỗi em một câu mỗi task" | KHỚP | hạn cùng thành phần `Han` |
| 4 | Đầu bảng: Học viên · Kết quả · "W1 · Writing Task 1 · a/b em đã có" · W2 | KHỚP | số em không tính em không học / cùng GV |
| 5 | Ô nhập mỗi em mỗi task, nhãn đọc màn "W1 · {em}" | KHỚP | |
| 6 | Trạng thái dưới ô: ● Đang gõ · Đang lưu… · ✓ Đã lưu · lỗi giữ chữ | KHỚP | `aria-live` / `role=alert` |
| 7 | Ô nét đứt "Không học W2" | KHỚP | |
| 8 | Ô nét đứt "Cùng GV · không cần bàn giao" | KHỚP | trước: chữ thường |
| 9 | Gợi ý "Writing · cũ: … — người, ngày" dưới ô còn trống | KHỚP | |
| 10 | Chân: "Tự lưu khi rời ô" + nút "Còn W1: n em · W2: m em ↑" (màu vàng, tới ô trống đầu) | KHỚP | |
| 11 | Câu báo Đóng khi còn ô lỗi "…bấm Đóng lần nữa thì chữ ở ô lỗi sẽ mất." | KHỚP | cả panel đổi GV |
| 12 | 375: mỗi em một thẻ, chip W1 / W2 + "Writing Task n" trên ô 44 px | KHỚP | |
| 13 | Công việc: MỘT việc "Bàn giao môn W1 · W2 · {lớp}", "GVBM · W1 a/b em · W2 c/d em" | KHỚP | đã kiểm `/api/my-work` bản chạy |
| 14 | GVCN: W1 / W2 hai dòng, "Điền thay" là nút (44 px ở 375) | KHỚP | |
| 15 | GVCN: dòng "W · Writing · cũ" chỉ đọc | KHỚP | (#843; ảnh dữ liệu thử em đầu không có câu cũ) |
| 16 | Panel trượt cạnh phải, cao hết màn (mockup vẽ hộp giữa màn có nền tối) | KHÁC | `KhungPanel` chung của mọi panel; panel GVCN đã duyệt cũng vậy |
| 17 | Nút Đóng ở trái chân (mockup: phải) | KHÁC | luật chân panel chung (S3) — mọi panel |
| 18 | Cột Kết quả là câu tự điền ("MT2 đạt kỳ vọng"), mockup vẽ điểm ✓ / ✗ từng task | KHÁC | dữ liệu tự điền có sẵn (`tuDien.ketQua`); đổi sang điểm từng task cần máy chủ thêm trường — không làm trong PR này |

KHỚP 15/18 = **83 %** (dưới cổng 90 %): 3 KHÁC trên đều là luật / thành phần dùng chung đã có — **xin chủ SP đồng ý lý do** (Q-5: KHÁC tính khi chủ SP đồng ý) → 18/18.

## Thao tác TRƯỚC → SAU

| Trước (main) | Sau | Giữ / đổi — vì sao |
|---|---|---|
| GV dạy cả W1 + W2: hai việc "Bàn giao môn W1", "Bàn giao môn W2", mở hai lần | MỘT việc, bảng hai cột | ĐỔI — N31 (mockup duyệt) |
| Việc W1 hoặc W2 lẻ (task kia đã đủ / GV chỉ dạy một task) | Như cũ; GV dạy cả hai mở việc lẻ vẫn thấy đủ hai cột | GIỮ |
| Đi ô: Tab | Tab W1 → W2 → em sau | GIỮ |
| Ô "Cùng GV" chữ thường | Ô nét đứt cùng kiểu "Không học" | ĐỔI hình (mockup) |
| Tự lưu khi rời ô, chỉ "Đã lưu" / lỗi | thêm "● Đang gõ" / "Đang lưu…" như panel đổi GV | ĐỔI hình (mockup) |
| Chân "Tự lưu khi rời ô · a/b em đã có" | Một cột: như cũ + "Còn n em ↑"; hai cột: "Còn W1 … · W2 … ↑" | ĐỔI — tới ô trống nhanh |
| "Giữ và lưu" khi phiếu cần làm lại | Giữ, theo từng ô | GIỮ |
| Đóng khi còn ô lỗi (#832) | Giữ cách làm, câu mới nói rõ mất chữ | ĐỔI chữ (N31) |
| GVCN "Điền thay" là link chữ | Nút nhỏ (44 px ở 375) | ĐỔI hình (mockup) |
| Deep link `?lenh=` focus ô của em | Focus ô cột đầu của em | GIỮ |

Không bỏ thao tác nào.
