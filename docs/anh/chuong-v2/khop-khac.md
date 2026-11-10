# CHUONG-V2 — khớp / khác mockup

Mockup: `thiet-ke/2026-11-11-chuong-v2/chuong-v2.html` (chủ SP duyệt vòng 2, "Duyệt, code đi"). Ảnh cặp (trái mockup, phải web thật, tối):
`cap-1440-gv.png` (B1, GVCN vai 7) · `cap-1440-ql.png` (B2, QL vai 2) · `cap-1440-qt.png` (B3, Quản trị vai 1) · `cap-1440-xem-tat-ca.png` (B6) ·
`cap-375-gv.png` (C1) · `cap-375-tvv.png` (C3, TVV vai 23) · `cap-375-xem-tat-ca.png` (C4). Dữ liệu web = seed demo (khác số của mockup là đúng).
Phông: `document.fonts.check('14px "Be Vietnam Pro"')` = true mọi ảnh.

## Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần | Web | Ảnh | Kết quả |
|---|---|---|---|---|---|
| 1 | B1 C1 | Số trên chuông = số badge Công việc | `so` của App (`summary.canLamNgay`) | 1440-gv, 375-gv | KHỚP |
| 2 | B1 | Chấm số khi có quá hạn | dáng badge Công việc quá hạn (nền đỏ sẫm, chữ đỏ, viền) — mockup: đỏ đặc | 1440-gv | KHÁC — một số một dáng với badge đứng cạnh (web hiện có); đổi cả hai theo mockup = PR riêng nếu chủ SP muốn |
| 3 | B1 | Đầu khối "Việc cần làm" + "Công việc ›" | `.chv-v-dau` | 1440-gv | KHỚP |
| 4 | B1 | Hàng "⚠ n quá hạn · m hôm nay · k việc" | `.chv-tom`, số từ `/my-work` | 1440-gv, 1440-ql | KHỚP |
| 5 | B1 | Dòng loại 4 cột (tên · số việc · chip · ›) | `.chv-viec` | 1440-gv | KHỚP |
| 6 | B1 | Chip "⚠ n quá hạn" / "n hôm nay" | `.chv-td` | 1440-gv | KHỚP |
| 7 | B1 | "● n mới" ở hàng phụ dưới tên | `.chv-moi` (localStorage) | — (máy chụp chưa từng mở chuông → không "mới", đúng luật) | KHỚP (mã) |
| 8 | B2 B3 | Hàng chi nhánh "MB 6 · UB 1" khi > 1 CN | `.chv-phu` | 1440-qt | KHỚP |
| 9 | B2 | Thẻ duyệt | nhóm "Chờ bạn duyệt · n yêu cầu" dưới vạch, KHÔNG cộng vào đầu khối — mockup: dòng "Duyệt yêu cầu" trong danh sách và trong tổng | 1440-ql, 1440-qt | KHÁC — đầu khối phải bằng số Công việc / ô "Việc của tôi" / chuông (một nguồn): seed QL `/my-work` 11 việc · 6 quá hạn, thẻ duyệt 9 · 1 quá hạn; gộp thì đầu khối "20 · ⚠ 7" lệch chuông 6. Tên = tab Công việc |
| 10 | B1 | Đầu khối "Cập nhật · n chưa đọc · Xem tất cả ›" | `.chv-cn-dau` | 1440-gv | KHỚP |
| 11 | B1 | Tin hai hàng: loại · giờ / nội dung, kết quả chữ + màu, "›" | `.chv-tin` + `tachTin` | 1440-gv, 1440-ql | KHỚP |
| 12 | B1 | Nền lặng khối Cập nhật, kẻ mảnh giữa tin | `.chv-cn` | 1440-gv | KHỚP |
| 13 | B6 C4 | Xem tất cả: ‹ · "Cập nhật n chưa đọc" · nút chữ "Đánh dấu đã đọc" | `.chv-x-dau` | 1440-xem-tat-ca, 375-xem-tat-ca | KHỚP |
| 14 | B6 C4 | Nhóm ngày Hôm nay / Hôm qua / Tuần này / Trước đó, đầu nhóm dính | `nhomNgayTin`, `.chv-x-nhom` | 1440-xem-tat-ca | KHỚP (seed chỉ có nhóm Hôm nay — tin tạo sau ngày demo) |
| 15 | C1–C4 | 375: hộp neo hai mép, ≤ 70 vh, dòng ≥ 48 px, link ≥ 44 px | lớp sẵn có + `@media (max-width: 639px)` | 375-* | KHỚP |
| 16 | B4 B5 B7 | Không việc (✓ "Không còn việc nào") · đang tải (khung xám) · lỗi Cập nhật (Thử lại) | `.chv-xong`, `.chv-tai`, `LoiTaiNho` | — (seed vai nào cũng có việc; có trong mã) | KHỚP (mã) |
| — | (ngoài mockup) | Nhiều loại việc (GV seed 13 loại) → danh sách việc cuộn trong hộp, Cập nhật luôn thấy ở đáy | `flex` + `overflow-y-auto` | 1440-gv | GIỮ — mockup không vẽ trường hợp tràn |
| — | (dữ liệu) | Giờ "Ghi nhận 10/11 20:21" | `thoiGianThongBao` sẵn có | 1440-gv | dữ liệu demo: tin tạo sau ngày demo 14/09 — bản chính hiện giờ / ngày như cũ |

**14 / 16 KHỚP (87,5 %) — dưới cổng 90 %**, 2 KHÁC có lý do (#2 dáng chấm, #9 Chờ bạn duyệt tách) — chờ chủ SP quyết khi duyệt ảnh cặp.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở / đóng chuông, Esc, bấm ngoài | có | GIỮ (Header như cũ) |
| Số trên chuông | tin chưa đọc | = badge Công việc (việc cần làm ngay) |
| Bấm một việc | từng dòng thông báo → chỗ làm | dòng loại → `/cong-viec?loai=…` (+ `nguoi=toi` QL / Admin, `cn=tat-ca` khi > 1 CN); "Công việc ›" đầu khối. Lý do: chuông không liệt kê từng em (chủ SP) |
| Thẻ chờ duyệt | từng thẻ một dòng | "Chờ bạn duyệt" → Công việc › Chờ bạn duyệt |
| Đăng ký tài khoản chờ duyệt (QT) | dòng Cần làm | dòng "Duyệt tài khoản · n tài khoản" → Quản trị |
| Bấm tin Cập nhật | mở đường của tin + đánh dấu đọc | GIỮ (`duongThongBao`; ghi đọc lỗi vẫn mở đúng chỗ) |
| Đánh dấu đã đọc (cả Góc nhìn khác: chỉ tin đang thấy) | nút đầu hộp | GIỮ ở Xem tất cả |
| Góc nhìn khác: chỉ tin mở được, "Mở ở vai gốc…" | có | GIỮ |
| Lỗi tải → Thử lại | có | GIỮ (khối Cập nhật) |
| Hạn từng việc, dòng "bấm tới đâu ›" | mỗi dòng | BỎ ở chuông (hạn gom "n quá hạn / n hôm nay"; chi tiết ở Công việc) |
| Tin việc đã xong rơi xuống "Để biết" | có | BỎ (việc xong không nơi nào còn báo) |

## Dòng đọc / request (đo PR)

- Mở MỌI trang: trước `GET /notifications` lúc tab hiện (13 câu GV / QL; QT 25 câu; trần dòng 66–449) → **0** (chỉ tải khi mở chuông).
- Khối Việc: dùng bản `/my-work` App đã tải cho badge → **0 request thêm**. Thẻ duyệt: `/yeu-cau/dem` App đã tải → 0.
- Mở chuông: `GET /notifications` như trước (máy chủ chưa đổi; bỏ đồng bộ tự động = PR máy chủ riêng).
