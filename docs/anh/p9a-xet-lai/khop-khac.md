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
| 2 (c) | Dòng (c) đang học lại mà Final ≥ 60 % | Nút thứ hai = "Lên {bậc kế}" (lớp bậc kế / FT cùng chi nhánh), ghi quyết định + Hành trình "QL xét lại: Lên BE → …"; Lên FT mà em chưa có Target → ô Target / KCK ngay tại thẻ (`canHoiTarget`, như panel Chuyển lớp) | (test XL-5e) | KHÁC nhỏ: mockup vẽ "Học lại {CT}" cho mọi dòng — với (c) em ĐANG học lại nên nút giữ đường Lên (rà PTA Plan 6) |
| 3a | Học lại → Lớp (ô gõ, chương trình cũ + cùng chi nhánh) + Từ (tuần) + "Khi lưu, web sẽ" | `HangLam`: `ChonLop` (`lopHocLai` máy chủ lọc) + `OTuanBatDau` + khối vàng | `web-1440-toi-hoc-lai.png` | KHÁC nhỏ: ô tuần là nút chọn tuần sẵn có (Ngay hôm nay · 3 tuần · Chọn tuần) thay `<select>` — luật ô ngày/tuần dùng component nhà; "+ Mở lớp mới…" BỎ (ô chọn lớp chung chưa có, mở lớp ở trang HV & Lớp) [XM] |
| 3b | Chọn nhiều → thanh "n em đã chọn · 3 nút · Áp cho n em · Bỏ chọn" | `ThanhAp` | `web-1440-toi-chon-nhieu.png` | KHỚP |
| 3c | Tiếp tục mà Final < 50 % → ô Lý do bắt buộc "Ghi lý do ngắn" | `canLyDo` + máy chủ `luuXetLai` (cùng chữ) | `web-1440-toi-chon-nhieu.png` | KHỚP |
| 3 chân | "Khi lưu: 2 em Tiếp tục BE · 1 em Học lại → … từ …" · "Lưu · 3 em" | `tomTatLuu` ở chân | `web-1440-toi-chon-nhieu.png` | KHỚP |
| 4 | Sau lưu: toast "Đã lưu 3 em · việc Xét lại xong" + Hoàn tác 10 s; thẻ "✓ Tiếp tục BE · QL Vy 01/10" + Sửa; Học lại "→ lớp · từ tuần" + Sửa; Hành trình "QL xét lại: …" | toast `ms 10 000` đếm lùi · `daLuu` · Sửa = `suaId` (đảo + ghi mới cùng giao dịch) · `addJourney` | `web-1440-toi-sau-luu.png` | KHỚP |
| 5a | Lệnh chưa thi hành: dòng ở lớp CŨ (chip "Xét lại n" trong Cuối khoá), sửa hướng = sửa lệnh, nút "Giữ Lên BE" | Việc + thanh Việc cần làm + chip trên dòng em ở hồ sơ lớp cũ → cùng panel; nút "Giữ {hướng}"; Học lại = `raLenh` upsert (sửa lệnh, không lệnh thứ hai); Hoàn tác / Sửa khôi phục nguyên dòng lệnh | `web-1440-toi-lop-cu.png`, `web-1440-toi-cuoi-khoa.png` | KHỚP: trang Cuối khoá (P9b `CuoiKhoaLop`) có chip lọc "Xét lại n" (cùng mẫu "Chưa chốt n" / "Còn bàn giao n") + chip "Xét lại" cạnh tên em → panel tại trang |
| 5b | Mini Test < 70 % → dòng (d) "Mini Test 55 % · cần ≥ 70 %", hạn CN tuần sau, "Đã xét lại" | `lyDoXetLai` (d) · `xetLaiTruoc` · em có dòng (d) → không thẻ "Mini Test chưa đạt" (migrate đóng thẻ đang chờ của em đó); em không ở tập Xét lại → thẻ + chuông QL như trước | — (test XL-5c, XL-10) | KHỚP |
| 5c | Hết hạn → "✓ Tiếp tục BE · tự ghi" | Đường đọc chỉ ẩn dòng quá hạn; quét định kỳ (`chotVangDinhKy` → `quetXetLaiHetHan`) ghi `tu_dong = 1`, Hành trình "… · tự giữ (hết hạn xét lại)". Hạn tính từ ngày mốc mở dòng (Final nhập / sửa, ghi Mini Test) — mở lại sau hạn có hạn mới | — (test XL-5b, XL-9) | KHỚP |
| 6 | GVCN lớp mới: chip "Xét lại", "QL quyết · hạn", ô "Nhận xét 2 tuần đầu" "✓ Đã lưu", không nút quyết | `chiXem` (máy chủ bỏ gợi ý / phụ huynh / lý do chốt / bàn giao) → `NhanXetGvcn` chỉ GVCN lớp ĐÍCH (rời ô lưu, PUT) | `web-1440-toi-gvcn.png`, `web-375-sang-gvcn.png` | KHỚP (dòng "QL Nguyễn Khánh Vy quyết" → "QL quyết": máy chủ không trả tên QL chi nhánh) |
| 7 | 375: màn đầy đủ, nút xếp dọc, chân dính "0 / 3 em đã quyết · Lưu" | KhungPanel toàn màn < 640, nút `max-sm:flex-col` | `cap-375.png` | KHỚP |

Sau gộp main (P9b #583, P7 #582): `TransitionPanel` / `BangLoTrinhTiep` / `TabDauRa` đã gỡ ở main — chip vào `CuoiKhoaLop`; Tạm dừng / Kết thúc học và Hoàn tác đi qua `setStudentStatus` / `hoanTacTamDung` / `hoanTacKetThuc` của P7 (Tạm dừng = vào Lưu trữ, rời tập Xét lại).

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| Mở Xét lại từ Công việc | "Chuyển lớp…" → bảng Chuyển lớp nhiều em | "Xét lại ›" → panel Xét lại | N21 |
| Học lại | Chọn lớp từng em + tuần + lý do chung → `/transfer` | Học lại trên thẻ (lớp + tuần) → `POST /classes/:id/xet-lai` (cùng `raLenh`) | N21: một chỗ quyết |
| Giữ hướng đã chốt | Không có (dòng tự mất sau 2 tuần) | "Tiếp tục {lớp}" + tự giữ khi hết hạn | N21 thay "không nút Giữ" 08/10 |
| Tạm dừng / Kết thúc học | Ở menu ⋯ hồ sơ HV | Thêm trên thẻ (Tạm dừng · Kết thúc học + lý do); menu ⋯ GIỮ | N21 |
| Mini Test < 70 % | Thẻ Báo lên "Mini Test chưa đạt" ở Chờ duyệt | Em có dòng (d) → quyết ở việc Xét lại (thẻ tự đóng); em không ở tập Xét lại → thẻ + chuông QL GIỮ như trước | N21, không để QL mất việc |
| Chuyển lớp nhiều em (`ChuyenLopNhieuEm`) | Mở từ `?viec=xet-lai` và (P9b) từ chọn nhiều em lớp FT | `?viec=xet-lai` → panel Xét lại; chọn nhiều em lớp FT GIỮ (bỏ nhánh tải `/xet-lai-lo-trinh`) | Thay bằng panel Xét lại, không mất đường P9b |
| Lọc em cần Xét lại ở Cuối khoá | Không | Chip "Xét lại n" + chip trên dòng em (trang Cuối khoá lớp cũ) | [XM] PTA Plan |
| Lên FT (dòng (c)) mà em chưa có Target | — | Ô Target / KCK tại thẻ, gửi `mucTieu` | Không để QL kẹt |
| Hoàn tác sau Sửa | — | Trả lại quyết định TRƯỚC Sửa (cùng người, giờ quyết); Hoàn tác tiếp → nguyên trạng | Rà PTA Plan |
| Hoàn tác khi lệnh đã đổi ở Chuyển lớp | — | 409 "Quyết định đã đổi sau khi xét lại — dùng Chuyển lớp." (lệnh giữ bản đã đổi) | Không đè thay đổi người khác |
| Hoàn tác | Không | 10 s (trừ "Ngay hôm nay") + Sửa tới khi lệnh mới thi hành; lệnh chưa thi hành → trả NGUYÊN dòng lệnh (xác nhận bàn giao, phiếu môn, LTT) | N21, N22 ③ |
| Em đang học lại mà Final ≥ 60 % (c) | "Chuyển lớp…" chọn lớp bậc kế | "Lên {bậc kế}" trên thẻ (lớp bậc kế / FT) — cùng `raLenh`, có ghi quyết định Xét lại + Hành trình; Chuyển lớp một em vẫn GIỮ | Không mất đường Lên |

## Bấm thử (seed demo, ngày 14/09/2026; Playwright, máy chủ dev cổng riêng)

**Vòng 1 — QL Nguyễn Khánh Vy, 1440 tối**
1. Công việc › Của tôi › Việc quản lý: "Xét lại lộ trình · MB BE 05 · 3 em · hạn 27/09 · Xét lại ›" và "· MB FOU 25 · 1 em · hạn 04/10" ✓ (`web-1440-toi-cong-viec.png`).
2. Hồ sơ MB BE 05: ô việc "Xét lại lộ trình · MB BE 05 · 3 em" ở thanh Việc cần làm + chip "Xét lại" trên 3 dòng em ✓ → bấm "Xét lại ›" mở panel tại trang ✓.
3. Hứa Đức Anh › Học lại FOU › gõ "FOU 14" chọn MB FOU 14 › tuần W4 SEP → khối vàng "Khi lưu, web sẽ" 4 dòng ✓.
4. Chọn Giang + Nông › thanh "2 em đã chọn" › Tiếp tục BE › Áp cho 2 em → chân "Khi lưu: 1 em Học lại FOU → MB FOU 14 từ W4 SEP · 2 em Tiếp tục BE · Lưu · 3 em" ✓.
5. Lưu → toast "Đã lưu 3 em · việc Xét lại xong · Hoàn tác (10)"; 3 thẻ đã quyết + Sửa ✓. Hoàn tác → thẻ đọc lại từ máy chủ, 3 em về "chưa quyết" ✓.
6. Hồ sơ HV Hứa Đức Anh: dải vàng "Xét lại lộ trình · Final 46 % · đã cho lên · Lên BE · hạn 27/09 · Xét lại" ✓.
7. Hồ sơ lớp cũ MB FOU 25 `?viec=xet-lai`: Lý Minh Khang (lệnh chưa thi hành), nút "Giữ Lên BE · Học lại FOU · Tạm dừng/ Kết thúc học" ✓ (sửa trong lúc bấm thử: trước đó ghi sai "Tiếp tục FOU").

**Vòng 2 — GVCN MB BE 05 Phạm Thu Trang (375 sáng) + QL 375**
1. QL 375: panel toàn màn, nút xếp dọc, chân dính "0/3 em đã quyết · Lưu" ✓.
2. GVCN: chip "Xét lại" trên 3 dòng em ✓ → panel chỉ xem: không nút quyết, không Gợi ý / Phụ huynh / lý do chốt ✓; ghi "Theo được bài nghe, viết còn chậm" rời ô → "✓ Đã lưu" ✓.
3. GVCN 1440 tối: cùng panel chỉ xem ✓ (`web-1440-toi-gvcn.png`).

KHỚP: 15 / 17 dòng khung (2 KHÁC nhỏ có lý do ở trên, 1 [XM] chờ PTA Plan) → ≥ 90 %.
