# YT-b — panel Việc · Ý thức & Phối hợp ở Công việc (mockup `thiet-ke/v19/y-thuc.html` B1–B5, chủ SP duyệt #1482 kể cả XM-1)

Ảnh cặp (trái mockup · phải web, demo 14/09, GVCN Trần Ngọc Hà — vai 7, `/cong-viec?nhom=y-thuc`):
`cap-1440-toi.png` (panel "Trao đổi với gia đình") · `cap-1440-toi-form.png` (form Xác nhận tại dòng) · `cap-375-toi.png` · `cap-1440-sang.png` ·
`cap-1440-xem-vi-pham.png` (panel một em, dải bước — khung B5).
Ở 1440 panel Công việc đứng bên phải danh sách (bố cục Công việc V18 đã duyệt), mockup vẽ phủ — không tính lệch.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | B1 đầu panel: "Việc · Ý thức & Phối hợp" · tên việc · lớp · n em | `PanelPhoiHop` (`dauViec`, giữ) | cap-1440-toi | KHỚP |
| 2 | B1 bỏ ① ② ③ | `BangPhoiHop` đầu cột (đã bỏ ở #1483) | cap-1440-toi | KHỚP |
| 3 | B1 hai cột Học viên · Cần làm (+ ⋯) | `HANG_GOP` (vai GVCN) | cap-1440-toi | KHỚP |
| 4 | B1 ô Học viên: tên · SOS · lượt · Overall ✗ / kỳ vọng · Trượt | `DiemMotDong` (giữ) | cap-1440-toi | KHỚP |
| 5 | B1 nút làm tại dòng rộng cả ô | nút "Xác nhận" `w-full` | cap-1440-toi | KHỚP (chữ — KHÁC-1) |
| 6 | B1 form tại dòng: Ngày · Nội dung · + Tệp · Người thực hiện Tôi · Đổi · Đóng / Lưu | `FormXacNhan` (giữ) | cap-1440-toi-form | KHỚP |
| 7 | B1 dòng vừa lưu ở lại (nền xanh, ✓ ngày · Bạn, Nội dung) + Hoàn tác | `vuaLuu` + Kết quả gộp trong ô Cần làm; Hoàn tác 10 s ở thông báo (giữ) | bấm thử (luồng cũ) | KHỚP |
| 8 | B1 bỏ khối "Đã làm" | `BangPhoiHop` chỉ `can` | cap-1440-toi | KHỚP |
| 9 | B1 chân: "Đã làm · hồ sơ lớp ›" trái · Việc tiếp › phải | `KhungPanel chan.trai` + `chinh` | cap-1440-toi | KHỚP |
| 10 | B1 ⋯: Sửa hạn… · Bỏ việc… | `Menu3` (giữ) | — | KHỚP |
| 11 | B2 TVV: Học viên · GVCN gửi · Báo PH · ⋯; bỏ nhóm "Đã báo"; chân "Đã báo · hồ sơ lớp ›" | `HANG` + đầu cột mới | — (seed không có việc TVV sau Meeting) | KHỚP (mã) |
| 12 | B3 375: thẻ em, nút rộng 44, chân Đã làm · Việc tiếp › | `max-sm` (giữ) | cap-375-toi | KHỚP |
| 13 | B4a hết em: ✓ "Xong việc này ở {lớp}" + Việc tiếp › | `BangPhoiHop` `can` rỗng | — (cần lưu hết 8 em) | KHỚP (mã) |
| 14 | B4b/c đang tải · lỗi | `Skeleton` · `ErrorState` (giữ) | — | KHỚP |
| 15 | B4d lưu lỗi: ở lại form, giữ chữ | `FormXacNhan` (giữ) | — | KHỚP |
| 16 | B5 dải bước không số, ô bước của người xem nền nhấn + "Bạn" | `TienTrinh` bỏ số | cap-1440-xem-vi-pham | KHỚP (chữ bước — KHÁC-2) |
| 17 | B6 sáng | token sẵn có | cap-1440-sang | KHỚP |

**KHỚP 17 / 17 = 100 %** về hình (2 chỗ KHÁC chỉ là chữ, có lý do).

## 2. KHÁC (chữ, có lý do)
- **KHÁC-1** nút "Xác nhận đã trao đổi" (mockup) → giữ **"Xác nhận"**: chữ chung cho mọi loại việc phối hợp (Trao đổi với gia đình, GVCN meeting với HV, Meeting CX…); tên việc đã ở tiêu đề panel. Đổi theo từng loại cần bảng chữ riêng — không thêm.
- **KHÁC-2** dải bước: mockup "Ghi vi phạm · GVCN xem / xử lý · TVV báo PH" → giữ chữ đang chạy "Vi phạm · GVCN xử lý · TVV báo PH" (cùng tên cột tab HV); chỉ bỏ số.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Xác nhận tại dòng (Ngày · Nội dung · + Tệp · Người thực hiện) | ô ② | ô Cần làm | GIỮ |
| Hoàn tác 10 s sau lưu · dòng vừa lưu ở lại | có | có | GIỮ |
| Sửa việc đã làm · Đưa lại Cần xử lý · ⋯ việc đã làm | nhóm "Đã làm" trong panel | hồ sơ lớp › Phối hợp SOS (đã có Sửa, ⋯) — link chân "Đã làm · hồ sơ lớp ›" | ĐỔI chỗ (XM-1 duyệt) |
| TVV: Ghi kết quả (Đã báo PH / Chưa liên hệ được) | ô ③ | cột Báo PH | GIỮ |
| TVV: Sửa kết quả đã báo | nhóm "Đã báo" | hồ sơ lớp › Phối hợp SOS (Sửa khi `coTheGhi`) | ĐỔI chỗ (XM-1) |
| Sửa hạn… · Bỏ việc… (việc chờ) | ⋯ | ⋯ | GIỮ |
| Việc tiếp › | chân | chân | GIỮ |
| Dải ①②③ panel một em (Xem vi phạm mới / Xác nhận xử lý / Báo PH) | số tròn | không số | ĐỔI chữ |

## 4. Turso
Không đổi đường đọc: panel vẫn MỘT request `/classes/:id/phoi-hop-sos?includeDone=1` khi mở. Giữ `includeDone` để em vừa xong việc cuối của lượt vẫn ở lại tại dòng
(Hoàn tác) tới khi đóng panel — chú thích `ponytail:` trong `PanelViec.tsx` (bỏ được nếu giữ ảnh dòng ở trình duyệt; mockup ghi chú đã ước "bỏ includeDone" — chưa làm vì sẽ mất dòng vừa lưu).
