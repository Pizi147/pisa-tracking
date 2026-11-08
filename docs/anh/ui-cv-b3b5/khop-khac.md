# UI-CV (PR 1) — Công việc: badge tab một nghĩa (B3), dòng việc theo loại (B4), 375 chạm cả dòng (B5)

Nguồn: mockup đã duyệt `thiet-ke/2026-11-08-audit-ui-mockup.html` khu B3 · B4 · B5 + câu hỏi chip "Không cần theo dõi" (chủ SP 08/11: "Còn lại làm y như mockup đề xuất… về mặt hình ảnh nhớ bắt chước chính xác, tính năng thì nên lưu ý những cái mockup chưa vẽ"; chốt B3 A · B4 A · B5 A).
Dữ liệu: seed demo 14/09/2026, GVCN Trần Ngọc Hà (vai 7). Phông đã kiểm `document.fonts.check('500 15px "Be Vietnam Pro"') === true` trước khi chụp.
Ảnh cặp (trái mockup | phải web, toàn trang): `b3-1440-toi|sang.png` · `b4-1440-toi|sang.png` · `b5-375-sang|toi.png`.

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| B3 `.tab-hang .tb` 15 px, chưa chọn 500 mờ, đang chọn 700 + gạch 2 px | `HangTab` (`DanhSachViec.tsx`) | b3-1440-* | KHỚP |
| B3 `.bd.do` = số cần làm ngay (quá hạn + hạn hôm nay), 0 → không badge, rê "4 quá hạn trong 7 việc" | `badgeTab` (`shared/domain/tongQuan.ts`) · `BadgeTabSo`, `chuBadgeTab` (`ui/Nhan.tsx`) | b3-1440-* | KHỚP |
| B3 badge vàng chỉ khi tab không quá hạn mà có hạn hôm nay; BỎ badge trắng (tổng) | `BadgeTabSo` | — (seed hôm nay không có tab như vậy) | KHỚP (phép kiểm CVT-1) |
| B3 GIỮ "27 việc · 9 quá hạn" đầu trang, tab mặc định = tab đầu có quá hạn | `HoTroHocVienTab` (`tong`, `tabMacDinh`) | b3-1440-* | GIỮ |
| B3 tab "Chờ bạn duyệt": badge = yêu cầu quá hạn (mockup B6 "Chờ bạn duyệt 1") | `HoTroHocVienTab` `bd` | ảnh QL (PR 2) | KHỚP |
| B4 mỗi loại việc một thẻ `.nhom` + `.dai-nhom` (nền surface-2, vạch trái 3 px nhấn, 15/700, chip "n việc", "⚠ n quá hạn") | `DanhSachViec` | b4-1440-* | KHỚP |
| B4 BỎ mục "Quá hạn" riêng — quá hạn lên đầu mục loại | `chiaMucTab` | b4-1440-* | KHỚP |
| B4 tên dòng = kỹ năng / đối tượng 15/500 ("Listening, Reading") — BỎ chữ "Nhập điểm" trong tên | `boDongTu` (`DanhSachViec.tsx`) | b4-1440-* | KHỚP (áp cả Thêm PA · Mô tả Case · Kết quả PA — xem dưới) |
| B4 dòng phụ = thẻ nền nhạt `.the-phu .tag.nhat` ("MB FT 101" "W1 JUL" "4 bài"; "Progress W3 AUG") | `DongPhu`, `tachTuan` | b4-1440-* | KHỚP |
| B4 hạn một dòng ("⚠ 68 ngày · 08/07", "⚠ còn 2 ngày · 16/09", "hạn 23/09") — BỎ mã tuần ở cột hạn | `CotHan` | b4-1440-* | KHỚP |
| B4 dòng gộp "Cả lớp" + nút "4 lớp ▾" | `DongLop` (`caTuan`) | b4-1440-* | KHỚP |
| B4 lưới cột [tên | hạn 136 | nút 112], dòng ≥ 50 px | `COT_VIEC`, `DONG` | b4-1440-* | KHỚP |
| B4 vạch dọc cây ở x = 30 px đi xuyên chữ (dư từ `chung.css`, mockup đã bỏ thụt 54 px) | — | — | BỎ (lỗi vẽ mockup) |
| B4 GIỮ nút "Nhập điểm", panel phải, "Việc tiếp ›", khay em, "Yêu cầu của tôi", "Lớp tôi dạy" | như cũ | b4-1440-* | GIỮ |
| B5 375: ẩn nút, chạm cả dòng, "›" mờ bên phải, hạn dưới tên | `CotNut` (`an375`), `O_HAN` | b5-375-* | KHỚP |
| B5 375: dải nhóm "Mock Test · 5 · ⚠ 4" (số dạt phải), tab "Speaking" | `DanhSachViec` (`max-sm:sr-only`), `HangTab` (`ngan`) | b5-375-* | KHỚP |
| B5 375: "27 việc · 9 quá hạn" dòng riêng dưới tiêu đề | `HoTroHocVienTab` `cv-tom` | b5-375-* | KHỚP |
| B1 câu hỏi chip "Không cần theo dõi" cột hẹp → "Không theo dõi", tên đủ khi rê | `ChoDuyetGon` (`TongQuanV5.tsx`) — #1247 (UI-TQ) đã làm; gộp main giữ bản #1247, thêm chữ đủ cho trình đọc màn | — | KHỚP |

## Khác mockup (có lý do)

- Số liệu thật của seed: "Mock Test 4 việc · ⚠ 3", "Âu Nhật Nam … 1 bài", "Hồ Thu Trang … 2 bài" — mockup vẽ số minh hoạ ("5 việc · ⚠ 4", thiếu thẻ số bài ở hai dòng). Đếm vẫn đi qua một hàm (`chiaMucTab` từ dòng máy chủ).
- Phần mockup không vẽ, sửa đồng bộ theo luật: các tab Case học thuật / Ý thức & Phối hợp / Vận hành / TVV cùng dáng thẻ nhóm; QL "Tất cả" (người giữ việc đầu dòng phụ, chữ mờ + biểu tượng, không thẻ — v12 S13); dòng có huy hiệu TVV giữ xuống dòng; nút phụ Gia hạn / Bỏ qua / Xuất lớp vẫn hiện ở 375; "Xem lại" dòng vừa lưu vẫn hiện ở 375.
- Thẻ phụ không đủ chỗ ở ≥ 640: ẩn cả thẻ (hàng cao đúng một thẻ), không cắt nửa thẻ — mockup chỉ có dòng ngắn; QL "Tất cả" có dòng 5 thẻ. Rê chuột thấy đủ chữ.
- Bỏ động từ trong tên dòng chỉ ở loại mà tên mục nói đúng động từ: Nhập điểm (mục Mock Test / Progress / Checkpoint), Thêm PA (mục Phương án → "PA học thuật · Reading", đúng ví dụ CV1), Mô tả Case, Ghi kết quả PA. GIỮ "Xác nhận Case · Listening", "Xác nhận PA · …", "Ghi Mini Test" vì chung mục với việc khác — bỏ động từ thì ở 375 (không nút) không phân biệt được.
- Chữ "tuần" trước mã tuần (U01 #3) bỏ theo mockup: tuần nay là thẻ riêng "W1 JUL" có tháng, không lẫn W1 Writing. Panel, "Tiếp: …" giữ tên đủ.
- [XM nhỏ] Nút "4 lớp ▾" mở panel lô Nhập điểm cả tuần như cũ (không mở khay) — giữ thao tác lô; "▾" theo mockup, trình đọc màn đọc "Nhập điểm · 4 lớp".

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở việc (1440) | nút động từ / bấm dòng / bấm tên | như cũ |
| Mở việc (375) | nút động từ (tên gãy 2–3 dòng) | chạm cả dòng hoặc tên (nút ẩn, V18) — cùng panel |
| Mở khay "n em ▾" | nút / dòng | như cũ, nút vẫn hiện ở 375 |
| Nhập điểm cả tuần nhiều lớp | nút "15 bài" | nút "4 lớp ▾" (cùng panel lô) |
| Gia hạn · Bỏ qua · Xuất lớp | nút phụ | như cũ, hiện cả 375 |
| Xem lại việc vừa lưu | "Xem lại" | như cũ |
| Mở hồ sơ em | tên em ở dòng phụ | tên em trong thẻ phụ (vẫn là link) |
| Lọc hạn / Lọc thêm / Của tôi–GV–Tất cả / chi nhánh | như cũ | như cũ |
| "Xem thêm n dòng" | mỗi mục | mỗi thẻ nhóm |

Không mất thao tác nào.

## Dòng đọc Turso

Không đổi: mọi thay đổi chỉ ở giao diện, đếm từ `/my-work` đã nạp (badge, đầu nhóm). Không thêm request. Trước = sau.

## Phép kiểm đã sửa (luật đổi theo quyết định 08/11)

- `prCvTab` CVT-1: badge = quá hạn + hôm nay (bỏ đỏ / vàng / trắng); mục "Quá hạn" bỏ, quá hạn đầu mục.
- `donHinh` CV-0611: "›" sau tên chỉ ≥ 640 khi chưa có nút (375: "›" mờ bên phải mọi dòng, B5).
- `prUiCongViec` CV-HANG-DEU: dòng phụ ≥ 640 = một hàng thẻ (B4).
