# HV-YT-BO-TAB-CON — hồ sơ HV · tab Ý thức & Phối hợp: bỏ hai tab con, Phối hợp SOS ngay dưới thang (mockup `thiet-ke/v23/thang-y-thuc.html` Y1 · Y3)

Lý do: #2000 (PR-6) giữ tab con chỉ để đỡ đọc Turso; chủ SP 23/11 bỏ lo dòng đọc → làm đúng v23.

Ảnh cặp (trái mockup · phải web, demo 14/09, GVCN Trần Ngọc Hà — vai 7):
- `cap-1440-toi-co-sos.png` — em có Phối hợp SOS (HV 88 Kiều Thảo Nhi, `/hoc-vien/88?tab=y-thuc`)
- `cap-375-sang-co-sos.png`
- `cap-1440-toi-khong-sos.png` — em không có Phối hợp (HV 60 Võ Minh Triết): không vẽ khối
- `cap-375-sang-khong-sos.png`

Phần trên tab (đầu hồ sơ, Việc cần làm, Thang | Đang chờ) không đổi trong PR này — đã duyệt ở #2000.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | Y1 không có tab con "Tình hình học tập / Ý thức" · "Phối hợp SOS" | `StudentYThucSection` bỏ `TabNho` | cap-1440-toi-co-sos | KHỚP |
| 2 | Y1 hai cột Thang \| Vi phạm chưa xử lý (≥ 1280), Y3 xếp dọc | giữ từ #2000 | cả 4 ảnh | KHỚP |
| 3 | Y1 khối Phối hợp SOS NGAY DƯỚI thang | khối mới giữa lưới hai cột và Lịch sử | cap-1440-toi-co-sos · cap-375-sang-co-sos | KHỚP |
| 4 | Y1 đầu khối "Phối hợp SOS" 14/700 · "n việc" 13 mờ · "+ Thêm việc" nút viền nhỏ bên phải, vạch dưới | `BangPhoiHopHoSo tieuDe` | cap-1440-toi-co-sos | KHỚP |
| 5 | Y3 375: đầu khối một hàng | cùng thành phần (nút 44 px) | cap-375-sang-co-sos | KHỚP |
| 6 | Dải lượt: SOS · MT · Overall / kỳ vọng · Học thuật › | `KhoiLuot` (giữ) | cap-1440-toi-co-sos | KHỚP (thêm Trượt + "x/y việc xong" + "mọi lượt" — GIỮ, xem KHÁC-1) |
| 7 | Dòng việc: tên · dòng phụ · thanh chấm (N58) · hạn · nút | `DongViecHoSo` (giữ) | cap-1440-toi-co-sos | KHỚP |
| 8 | Lớp thường: "Phối hợp" (không SOS) | `tenPhoiHop` (giữ) | — | KHỚP (mã) |
| 9 | Em không có Phối hợp → không vẽ khối | `coord.data.rows.length === 0` → không vẽ | cap-1440-toi-khong-sos · cap-375-sang-khong-sos | KHỚP |
| 10 | Lỗi tải Phối hợp | đầu khối + `LoiTaiNho` (Thử lại) | — | KHỚP (mã) |
| 11 | Sáng / tối | token sẵn có | 375 sáng · 1440 tối | KHỚP |

**KHỚP 11 / 11.**

## 2. KHÁC (có lý do)
- **KHÁC-1** dải lượt web có thêm Trượt L R W S, "0/3 việc xong", "mọi lượt": thông tin đã có ở V4 / #2000, mockup không vẽ — giữ (luật nâng cấp, không bỏ thông tin).
- **KHÁC-2** mockup vẽ Phối hợp SOS là thẻ riêng; web ở cùng một thẻ tab với Thang (như #2000 gộp hai thẻ Thang / Vi phạm chưa xử lý vào một thẻ), ngăn bằng vạch. Màu, cỡ chữ, khoảng cách như mockup.
- **KHÁC-3** "n việc" ở đầu khối = tổng việc (chưa bỏ) của mọi lượt hiện trong khối — khớp nghĩa "2 việc" của mockup. Badge tab con cũ đếm số **lượt** chưa xong; số lượt chưa xong vẫn đọc được ở dải lượt ("x/y việc xong").
- **KHÁC-4** Lịch sử (gập) vẫn là dải toàn bề rộng dưới Phối hợp SOS (mockup Y1 đặt trong cột phải) — theo đề bài PR: Thang | Đang chờ → Phối hợp SOS → Lịch sử.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Xem Phối hợp SOS | bấm tab con "Phối hợp SOS" | thấy ngay dưới thang | ĐỔI (bớt 1 bấm) |
| + Thêm việc | link ở dải lượt | nút ở đầu khối (lượt mới nhất chưa xong); lượt khác giữ link ở dải lượt | ĐỔI chỗ |
| Xác nhận · Bỏ việc… · Ghi kết quả · Sửa · ⋯ · Sửa hạn · Hoàn tác | dòng việc | dòng việc | GIỮ |
| Mọi lượt · Xem việc ▸ (lượt đã xong gập) · Học thuật › | có | có | GIỮ |
| Hỏi / Báo tình hình · + Vi phạm / Nhắc nhở · Xác nhận / Sửa cấp bậc | chân / đầu khối thang | như cũ | GIỮ |
| Link `?tab=y-thuc&sub=phoi-hop` (Công việc, thông báo, viecHocVien, giaoViec, bảng lớp) | mở tab con Phối hợp + cuộn | cuộn tới khối Phối hợp SOS (em không có → đầu tab); không đổi máy chủ | GIỮ |
| BPXL (không xem Ý thức): tab chỉ Phối hợp | bảng | bảng + cùng đầu khối | GIỮ |
| Hồ sơ lớp: tab con Tình hình / Phối hợp | có | có (ngoài phạm vi — đề bài chỉ hồ sơ HV) | GIỮ |

## 4. Tốc độ
- Hai request `/students/:id/y-thuc` và `/students/:id/phoi-hop-sos` vẫn bắt đầu cùng lúc khi mở tab (hai `useApi` cùng component — trước đây cũng đã tải song song để đếm badge, chỉ ẩn sau tab con).
- Đo `/hoc-vien/88?tab=y-thuc&sub=phoi-hop` (Edge, demo): **11 request API trước = sau**; không đổi đường máy chủ nên không đổi câu / trần `tocDoDuong.ts`.
