# YT-a — tab Ý thức hồ sơ lớp theo em (mockup `thiet-ke/v19/y-thuc.html`, chủ SP duyệt #1482 kể cả XM-2, XM-3)

Ảnh cặp (trái mockup · phải web, demo 14/09, lớp MB FT 101, GVCN Trần Ngọc Hà — vai 7): `cap-1440-toi.png` · `cap-375-toi.png` ·
`cap-1440-toi-lich-su.png` (bấm "Xem lịch sử" hai em) · `cap-1440-sang.png` · `cap-375-sang.png` · `cap-1440-gvbm.png` (vai 9, so khung A5).
Dữ liệu mockup là giả (30 em, ngày 11/11); web là seed — số em / tên / ngày khác nhau là do dữ liệu, không tính lệch.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | A1 thanh công cụ: Vi phạm \| Phối hợp SOS · Tất cả / Việc của tôi · Tìm em · Điểm Mock Test › · Khai / sửa cấp bậc · Chọn nhiều · + Ghi vi phạm | `ClassYThucCard` đầu thẻ (`BoLocDoan`, `ChipLoc`, ô tìm) | cap-1440-toi | KHỚP |
| 2 | A1 đầu cột không số: Học viên · Vi phạm · Đã xử lý · Bước đang làm | `DauCotEm` (+ ⓘ ở Đã xử lý) | cap-1440-toi | KHỚP |
| 3 | A1 nhóm "Chưa xử lý xong · n HV" + ⓘ thứ tự | `dauNhom` | cap-1440-toi | KHỚP (bớt "· n vi phạm" — xem KHÁC-1) |
| 4 | A1 mỗi em một khối (nền, viền, cách 10) | `KhoiEm` | cap-1440-toi | KHỚP |
| 5 | A1 ô Học viên: tên · chip "Đã tới …" · TVV khác TVV chính | `hvEm` + `ChipBac` | cap-1440-toi | KHỚP |
| 6 | A1 mỗi lần một dòng, kẻ đứt giữa các lần | `DongLan` | cap-1440-toi | KHỚP |
| 7 | A1 Vi phạm: ngày · chip môn · tên; bấm mở tại chỗ (Mô tả, Bằng chứng, Sửa · Xoá, Đã xem vi phạm này) | `DsVp` + `ChiTietViPham` (giữ) | bấm thử | KHỚP |
| 8 | A1 "Đã xử lý": GVCN / TVV có nhãn, "—" khi chưa ai làm | `ODaXuLy` | cap-1440-toi | KHỚP |
| 9 | A1 "Bước đang làm": badge bước + hạn + "Lần này …" + nút đúng vai / "Chờ …" | `tiep` các nhóm | cap-1440-toi | KHỚP |
| 10 | A1 Báo PH đang chờ ở cột Bước đang làm | `dongLan` (`phCho`) | cap-1440-toi (Lương Gia Bảo) | KHỚP |
| 11 | A1 vừa Đã xem: nền xanh, "✓ Đã xem … · giờ", Hoàn tác · Xem lại | `vua` | bấm thử | KHỚP |
| 12 | A1 khối viền nhấn khi mở từ việc / thông báo (`?hv=`) | `KhoiEm mo` | — (luồng cũ giữ) | KHỚP |
| 13 | A1 thanh "Xem lịch sử · n" cuối khối, đầu cột Vi phạm | `ThanhLs` | cap-1440-toi | KHỚP |
| 14 | A1 lịch sử mở tại chỗ: đầu "Lịch sử" + Lộ trình \| Cả lịch sử + ⓘ; dòng Đã xem (Xác nhận xử lý · Bỏ xem), Đã xử lý (✓ Xong), Đã thu hồi | `KhungLs` + `dongLs` | cap-1440-toi-lich-su | KHỚP |
| 15 | A1 "Các em khác · n HV · theo tên", mỗi em một dòng gọn: "✓ Chưa có vi phạm" / thanh lịch sử + "Không có vi phạm chờ" | `DongEmGon` | cap-1440-toi | KHỚP |
| 16 | A1 em chưa có bậc: không chip | `hvEm` | cap-1440-toi | KHỚP |
| 17 | A2 375: thẻ em, "Bước đang làm" là hộp, nút 44 px, thanh lịch sử chân thẻ | `KhoiEm` / `DongLan` khung hẹp | cap-375-toi | KHỚP |
| 18 | A2 375 đầu: + Ghi vi phạm rộng + ⋯, phân đoạn, chip lọc, ô tìm | đầu thẻ `max-sm` | cap-375-toi | KHỚP (thứ tự giữ của web: + Ghi trên cùng như mockup) |
| 19 | A3 / A4 sáng | token sẵn có | cap-1440-sang · cap-375-sang | KHỚP |
| 20 | A5a đang tải | `Skeleton` của `Card` (giữ) | — | KHỚP |
| 21 | A5b lỗi tải + Thử lại | `ErrorState` (giữ) | — | KHỚP |
| 22 | A5c lớp chưa vi phạm: vẫn đủ danh sách | `emKhac` ("Các em" khi không em nào chờ) | — | KHỚP |
| 23 | A5d lọc "Việc của tôi" = 0 → câu + "Xem tất cả n HV" | `Empty` | bấm thử | KHỚP |
| 24 | A5e/f lịch sử phải đọc thêm (lớp > 150 dòng): khung tải / lỗi + Thử lại | `LsTai` | — (seed < 150 dòng) | KHỚP (mã; seed không có lớp > 150 dòng) |
| 25 | A5g GVBM: không nút xử lý, "Chờ GVCN …", vẫn + Ghi vi phạm | quyền máy chủ như cũ | cap-1440-gvbm | KHỚP |
| 26 | A5h Chọn nhiều: ô chọn ở ô Học viên, thanh dưới giữ | `OChon` mọi em + `ThanhChonNhieu` | bấm thử | KHỚP |
| 27 | A6 theo vai (GVCN · QL · TVV · GVBM) | nhánh `tiep` như cũ | — | KHỚP |
| 28 | Mockup: TVV "Chưa liên hệ được · lần 1" ở "Đã xử lý", "TVV báo lại · hạn" ở Bước | Báo PH đang mở (kể cả đã gọi lần 1) nằm trọn ở "Bước đang làm" | — | KHÁC-2 |
| 29 | Mockup: dòng lịch sử Đã xem ghi "✓ Xong · đã xem" | web: badge "Đã xem" ở GVCN + hai link ở cột cuối | cap-1440-toi-lich-su | KHÁC-3 |

**KHỚP 27 / 29 = 93 %** (≥ 90 %). KHÁC-1 tính KHỚP (bớt một số đếm phụ).

## 2. KHÁC (có lý do)
- Chữ chip lọc: mockup "Việc của bạn" → web **"Việc của tôi"** — thuật ngữ đã chốt (luật chữ S3: không "Việc của bạn"; cùng tên với "Việc của tôi" ở hồ sơ lớp). Không tính lệch hình ảnh.
- **KHÁC-1** đầu nhóm "Chưa xử lý xong" ghi "n HV", không "· n vi phạm": số vi phạm phải đếm lại qua mọi lần của mọi em (một em nhiều lần) — bỏ cho gọn, không đổi đầu ra.
- **KHÁC-2** Báo PH đang mở (cả "Chưa liên hệ được · lần n") nằm trọn ở cột "Bước đang làm" (một thành phần `OBaoPh`: kết quả lần gần nhất, Nội dung, hạn, Sửa hạn, Xem đủ) — không tách hai cột để không lặp hạn / Nội dung. Xong / bỏ → về "Đã xử lý" dòng TVV như mockup.
- **KHÁC-3** dòng Đã xem trong lịch sử: cột cuối là "Xác nhận xử lý · Bỏ xem" (G3-6, giữ thao tác) — không thêm chữ "✓ Xong · đã xem" vì badge "Đã xem" ở cột Đã xử lý đã nói.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước (V2) | Sau (YT-a) | |
|---|---|---|---|
| + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều · Điểm Mock Test › · ⋯ (375) | đầu tab | đầu tab | GIỮ |
| Vi phạm \| Phối hợp SOS | phân đoạn | phân đoạn | GIỮ |
| Cần làm \| Lịch sử | phân đoạn | **bỏ** — một danh sách mọi em, lịch sử mở trong khối em | ĐỔI (XM-2 duyệt) |
| Số "Cần làm n HV" (việc của người xem) | chip phân đoạn | chip lọc "Việc của tôi · n" (cùng tập G3-14) | GIỮ số |
| Lọc Lịch sử Đã xem / Đã xử lý / Đã thu hồi | chip | **bỏ** (lịch sử theo em) | BỎ (XM-2 duyệt) |
| Phạm vi Lộ trình \| Cả lịch sử | đầu tab Lịch sử | đầu phần lịch sử đang mở (+ ⓘ) | ĐỔI chỗ |
| Tìm em | chỉ Lịch sử | đầu tab, lọc cả danh sách | GIỮ (rộng hơn) |
| Bỏ lọc em ("Lịch sử của em ›" cũ) | nút "tên ×" | không cần — lịch sử của em mở ngay trong khối | ĐỔI |
| Xác nhận xử lý · Đề xuất QL duyệt | Bước tiếp | Bước đang làm | GIỮ |
| Đã xem · n · Đã xem vi phạm này | Bước tiếp · dòng mở | như cũ | GIỮ |
| Hoàn tác · Xem lại (sau Đã xem) | dòng ở lại; Xem lại → tab Lịch sử | dòng ở lại; Xem lại → mở lịch sử em, dòng sáng | GIỮ |
| Bỏ xem · Xác nhận xử lý vi phạm đã xem (G3-6) | Lịch sử | lịch sử em | GIỮ |
| Sửa · Xoá vi phạm · + Tệp · + Liên kết · hộp rê | bấm tên vi phạm | như cũ | GIỮ |
| Xem lần xử lý · Thu hồi… | badge ô ② | badge GVCN ở "Đã xử lý" | GIỮ |
| Duyệt · Từ chối… · Duyệt thu hồi (QL) · Đánh dấu đã thực hiện | Bước tiếp | Bước đang làm | GIỮ |
| Ghi kết quả báo PH · Sửa hạn · Xem đủ Báo PH | ô ③ / Bước tiếp | Bước đang làm (đang mở) / Đã xử lý (xong) | GIỮ |
| Chip bậc → Thang · Khai bậc · Lịch sử của em › | chip mọi em ("chưa có") | chip khi em có bậc; "Lịch sử của em ›" mở lịch sử tại chỗ. Em chưa có bậc: Khai qua nút đầu tab (mọi em) | ĐỔI (mockup) |
| "Xong · 7 ngày" | nhóm riêng | bỏ nhóm; lần xong vào lịch sử em | ĐỔI |
| Chưa xác nhận cấp bậc (khi Chọn nhiều) | nhóm riêng | em đó có dòng ở "Các em khác", có ô chọn | GIỮ |
| `?hv=&mo=…` từ việc / thông báo | cuộn + panel | cuộn tới khối / dòng em (viền nhấn) + panel | GIỮ |

## 4. Turso (đo trước → sau)
- `GET /classes/:id/y-thuc`: **không thêm câu**. Máy chủ đã đọc mọi em (`emCuaLop` + câu tên / TVV, `trangThaiYThuc`) và toàn bộ vi phạm / lần xử lý của lớp (rồi mới cắt 150) — nay trả thêm `emLop` (≈ 30 phần tử) + `soLs` đếm trên danh sách đã đọc + `catLs`.
  **Đo `tocDo.run.js` (seed, cùng máy) main → nhánh:** QL 18 → 18 câu · GVCN / GVBM / GVCN lớp thường 19 → 19 · QT 16 → 16; dòng đọc QL 338 → 338, GVCN / GVBM 339 → 339
  (dữ liệu ×3: 682 / 683 cả hai bên). Trần `tocDoDuong.ts` giữ (24 câu). Phản hồi JSON thêm ≈ 33 phần tử `emLop`.
- "Xem lịch sử": dữ liệu đã nạp → **0 request**. Chỉ khi `catLs` (lớp > 150 dòng) và em thiếu dòng → `GET /students/:id/y-thuc` (đường có sẵn, trần ~103 dòng) khi bấm.

## 5. Việc để sau
- **Tab Ý thức hồ sơ HV** chưa đổi (vẫn ①②③ + 5 cột V2). Chủ SP 03/11: tab HV phải đồng bộ tab lớp → PR riêng YT-c (cột "Đã xử lý" gộp, "Bước đang làm", không số) — chưa có mockup riêng, dùng khối em của A1 bỏ ô Học viên.
