# P9a XET-LAI — bảng truy vết KHUNG → THÀNH PHẦN → ẢNH (KHỚP / KHÁC)

Nguồn: mockup ĐÃ DUYỆT `thiet-ke/v6/xet-lai-lo-trinh.html` (khung 0–7, ảnh `thiet-ke/v6/anh/xet-lai-lo-trinh-{1440-toi,375}.png`) · luật `plan.md` 1.6 N21, N22 ③.
Demo: ngày 14/09/2026 · QL Nguyễn Khánh Vy (MB) · MB FOU 25 → MB BE 05 (vào lớp W3 SEP): Hứa Đức Anh 46 % (a), Giang Thảo My 55 % + Nông Gia Phúc 57 % chốt trước Final (b);
Lý Minh Khang 42 %, lệnh chưa thi hành (dòng ở lớp cũ MB FOU 25). Seed `server/src/seed/xetLaiSeed.ts`.
Ảnh cặp: `cap-*.png` = mockup (trái) | web (phải), toàn trang.

| Khung | Thành phần mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 0 | Mốc thời gian (Chốt lộ trình T5 · Final · vào lớp · Xét lại · hết hạn CN tuần 2) | Luật `hanXetLai` (shared) · việc QL có hạn | — | KHỚP (luật). Phần "Chốt lộ trình hạn T5" thuộc P9b — BỎ ở PR này |
| 1a | Công việc QL "Xét lại lộ trình · {lớp} · n em" · hạn · "Xét lại ›" · dòng phụ tên + % | `mywork.ts` việc `xet_lai_lo_trinh` → đổi trang hồ sơ lớp `?viec=xet-lai` | `web-1440-toi-cong-viec.png` | KHỚP |
| 1b | Hồ sơ lớp: thanh Việc cần làm "Xét lại lộ trình · n em" + chip "Xét lại" trên dòng em | `ThanhViecLop` (việc `mine`) → `PanelViec` → `PanelXetLai`; chip `ChipXetLaiDong` ở `BangDiemLopThuong` / `BangHoSoLop` | `cap-1440-toi.png` | KHỚP (thanh việc dùng ô việc chung, không dải vàng riêng — một chỗ có việc) |
| 1c | Hồ sơ HV: dải vàng lý do + hạn + "Xét lại ›" → panel một em | `DaiXetLai` (StudentDetailPage) → `PanelXetLai studentId` | `web-1440-toi-ho-so-hv.png` | KHỚP ("Xét lại" là nút mở panel tại trang, không đổi trang → không "›") |
| 2 | Panel: loại "VIỆC · XÉT LẠI LỘ TRÌNH", tiêu đề, "Từ … · vào lớp … · hạn", Chọn tất cả · Chưa quyết n, thẻ từng em (lý do đỏ/vàng, Final từng môn ✗, Đã chốt + lý do, Gợi ý, Phụ huynh, GVCN cũ, Bổ trợ Final), 3 nút, chân "0/3 em đã quyết · Đóng · Lưu" | `PanelXetLai` + `TheEm` (KhungPanel rộng 720) | `cap-1440-toi.png` | KHỚP |
| 3a | Học lại → Lớp (ô gõ, chương trình cũ + cùng chi nhánh) + Từ (tuần) + "Khi lưu, web sẽ" | `HangLam`: `ChonLop` (`lopHocLai` máy chủ lọc) + `OTuanBatDau` + khối vàng | `web-1440-toi-hoc-lai.png` | KHÁC nhỏ: ô tuần là nút chọn tuần sẵn có (Ngay hôm nay · 3 tuần · Chọn tuần) thay `<select>` — luật ô ngày/tuần dùng component nhà; "+ Mở lớp mới…" BỎ (ô chọn lớp chung chưa có, mở lớp ở trang HV & Lớp) [XM] |
| 3b | Chọn nhiều → thanh "n em đã chọn · 3 nút · Áp cho n em · Bỏ chọn" | `ThanhAp` | `web-1440-toi-chon-nhieu.png` | KHỚP |
| 3c | Tiếp tục mà Final < 50 % → ô Lý do bắt buộc "Ghi lý do ngắn" | `canLyDo` + máy chủ `luuXetLai` (cùng chữ) | `web-1440-toi-chon-nhieu.png` | KHỚP |
| 3 chân | "Khi lưu: 2 em Tiếp tục BE · 1 em Học lại → … từ …" · "Lưu · 3 em" | `tomTatLuu` ở chân | `web-1440-toi-chon-nhieu.png` | KHỚP |
| 4 | Sau lưu: toast "Đã lưu 3 em · việc Xét lại xong" + Hoàn tác 10 s; thẻ "✓ Tiếp tục BE · QL Vy 01/10" + Sửa; Học lại "→ lớp · từ tuần" + Sửa; Hành trình "QL xét lại: …" | toast `ms 10 000` đếm lùi · `daLuu` · Sửa = `suaId` (đảo + ghi mới cùng giao dịch) · `addJourney` | `web-1440-toi-sau-luu.png` | KHỚP |
| 5a | Lệnh chưa thi hành: dòng ở lớp CŨ (chip "Xét lại n" trong Cuối khoá), sửa hướng = sửa lệnh | Việc + thanh Việc cần làm ở hồ sơ lớp cũ → cùng panel; Học lại = `raLenh` upsert (sửa lệnh, không lệnh thứ hai) | `web-1440-toi-lop-cu.png` | KHÁC [XM]: chip "Xét lại n" trong bảng Cuối khoá chưa thêm — `TabDauRa` / `BangLoTrinhTiep` thuộc P9b, phiên này không được chạm. Hỏi PTA Plan: thêm chip ở P9b hay PR nhỏ sau khi gộp |
| 5b | Mini Test < 70 % → dòng (d) "Mini Test 55 % · cần ≥ 70 %", hạn CN tuần sau, "Đã xét lại" | `lyDoXetLai` (d) · `xetLaiTruoc` · thẻ "Mini Test chưa đạt" không tạo nữa (migrate đóng thẻ đang chờ) | — (test XL-5c) | KHỚP |
| 5c | Hết hạn → "✓ Tiếp tục BE · tự ghi" | `tapXetLai` quét khi đọc + cron CN → `tu_dong = 1`, Hành trình "… · tự giữ (hết hạn xét lại)" | — (test XL-5b) | KHỚP |
| 6 | GVCN lớp mới: chip "Xét lại", "QL quyết · hạn", ô "Nhận xét 2 tuần đầu" "✓ Đã lưu", không nút quyết | `chiXem` → `NhanXetGvcn` (rời ô lưu, PUT) | `web-1440-toi-gvcn.png` | KHỚP (dòng "QL Nguyễn Khánh Vy quyết" → "QL quyết": máy chủ không trả tên QL chi nhánh) |
| 7 | 375: màn đầy đủ, nút xếp dọc, chân dính "0 / 3 em đã quyết · Lưu" | KhungPanel toàn màn < 640, nút `max-sm:flex-col` | `cap-375.png` | KHỚP |

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| Mở Xét lại từ Công việc | "Chuyển lớp…" → bảng Chuyển lớp nhiều em | "Xét lại ›" → panel Xét lại | N21 |
| Học lại | Chọn lớp từng em + tuần + lý do chung → `/transfer` | Học lại trên thẻ (lớp + tuần) → `POST /classes/:id/xet-lai` (cùng `raLenh`) | N21: một chỗ quyết |
| Giữ hướng đã chốt | Không có (dòng tự mất sau 2 tuần) | "Tiếp tục {lớp}" + tự giữ khi hết hạn | N21 thay "không nút Giữ" 08/10 |
| Tạm dừng / Kết thúc học | Ở menu ⋯ hồ sơ HV | Thêm trên thẻ (Tạm dừng · Kết thúc học + lý do); menu ⋯ GIỮ | N21 |
| Mini Test < 70 % | Thẻ Báo lên "Mini Test chưa đạt" ở Chờ duyệt | Dòng (d) ở việc Xét lại | N21 |
| Chuyển lớp nhiều em (`ChuyenLopNhieuEm`) | Chỉ mở từ `?viec=xet-lai` | GỠ (không còn nơi dùng); Chuyển lớp một em GIỮ | Thay bằng panel Xét lại |
| Hoàn tác | Không | 10 s (trừ "Ngay hôm nay") + Sửa tới khi lệnh mới thi hành | N21, N22 ③ |

## Bấm thử

Vòng 1 (QL Vy, 1440 tối): …
Vòng 2 (GVCN MB BE 05, 375 sáng): …
