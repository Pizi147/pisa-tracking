# SUA-RA-1311 — bảng trạng thái (đề bài mục 10) · 11/11

PR: #1456 (A, đã merge) · #1460 (B, N04, đã merge) · #1461 (C, U02 + U05). Check đầy đủ mỗi PR rc=0; SQLD/Hrana BỎ QUA (máy không có sqld) — không phải đạt.

| ID | Trạng thái | Commit / PR | Bằng chứng |
|---|---|---|---|
| PTA-1 Khôi phục lượt mở lại việc TVV Báo PH (`system_luot_huy`) | ĐÃ SỬA | 46cbd1cbd · #1456 | `prMt` "PR-MT (7) · SUA-RA-1311": đỏ trên main ("khôi phục chưa mở lại việc"), xanh; việc người bỏ giữ |
| PTA-2 Hàm đêm đọc cấu hình Case & SOS | ĐÃ SỬA | 46cbd1cbd · #1456 | `suaRa1311` 2a: gói esbuild `doi-chieu-so` / `chot-vang` trước không có `server/src/platform/cauHinhCaseSos.ts` → luôn bản gốc; 2b/2c lambda ấm đọc bản mới. Gói +1 KB |
| PTA-3 `plan_source_truoc_vang` chuỗi "-" | ĐÃ SỬA | 46cbd1cbd · #1456 | `prBv` V1c (FT + lớp thường): trước trả `auto` khi còn vắng lần 1 |
| PTA-4 Mốc PA quy chế hai hàm | ĐÃ SỬA | 46df78a10, e1c9811da · #1456 | `suaRa1311` 4 (2 ca) đỏ trên main. Bản chép 07/11: main migrate lần 2 vẫn đổi PA 566; PR lần 2 "Không có gì để nâng cấp", băm mọi bảng lần 2 = lần 3 (trừ dấu giờ migrate). PA 541/557 → trống "đến MT3 · chưa có lịch" (MT3 xếp 19/10 trước ngày bắt đầu; main ghi 25/10 < bắt đầu); PA 566 → 01/12 |
| PTA-5 Đọc tăng /students/:id 46→64, skill-board 10→27 | KHÔNG TÁI HIỆN (theo mã) | — | Ca duy nhất: GV 12 · em 431. Em 431 ngày 07/11 có 0 Case; migrate OV-13a (e) sinh 2 Case tạm (898, 899). Lần gọi 2, CÙNG bản chép đã migrate: f8ac410cb 86 / 46 câu, HEAD 65 / 27. Mọi em khác trong kq2 giảm / bằng. Không tối ưu, không đổi trần |
| N04 Chi nhánh sửa / Hoàn tác đè người khác | ĐÃ SỬA (đã merge) | 870936609→63e0c3b43 · #1460 | Tái hiện bản chép: main A Hoàn tác xoá SĐT B vừa sửa. `prChiNhanhLienHe` CNL-4…7 (khác ô, cùng ô 409, Hoàn tác sau sửa mới, gửi lại không nhật ký đôi, lỗi giữa chừng không nửa ghi). Bấm thử dev: 409 dưới ô giữ chữ, Lưu lần nữa ghi, Hoàn tác bị chặn có câu riêng. `/security-review`: 0 |
| U02 Lưu trữ kết quả lô nằm lại | ĐÃ LÀM (chờ merge) | ac33aa749, + chữ · #1461 | `suaRa1311` U02; bấm thử dev (giả lập mạng trong trang): "Xong 1/3 · Cần chọn lớp … Xử lý tiếp · Không lưu được … Thử lại", còn sau khi toast tắt, Thử lại chỉ gửi em lỗi, Xử lý tiếp mở đúng panel em |
| U05 Nạp sẵn theo vai | ĐÃ ĐO + ĐỔI PHẦN CÓ LỢI (chờ merge) | #1461 | Chưa cache: QL/QT 78 tệp 702 KB (không đổi) · GV 702→619 · TVV 702→620 · CX 702→602 · Admin VP 702→655 KB gzip. Đã cache: 0 → 0. Chỉ 4 trang có route chặn theo nav. Nạp theo "khả năng dùng tiếp": chưa làm (thiếu số liệu dùng thật) |
| N01–N03, U01, U03, U04 | Không thuộc session này | — | NHAP-PA-V2 |

## Hồi quy mục 7 (phần của tôi) — đã chạy, cách chạy

Tự động = `npm run check` đầy đủ trên nhánh PR C (5 619 + 73 tốc độ), số phép kiểm theo tệp từ `dist-server/data/lan-cuoi.json`:

| Khu | Ca đề bài | Đã chạy (tệp · số phép) | Thủ công |
|---|---|---|---|
| Học viên / Lưu trữ | liên hệ thiếu tuần, đổi lớp / lộ trình, lô một phần lỗi, tìm nhanh, Back/Forward | prQuyenLienHe 15 · suaRa1228 3 (F05) · prCt 71 · prCt2 19 · prChuyenLopSuaSai 12 · prSvLoTrinh 25 · prLuiB 36 · rkcHocVien 11 · hocVienLop 37 · prTlHvl 8 · suaRa1311 U02 | Lưu trữ: gõ "Trúc" rồi đổi tab trong 100 ms → URL giữ `tab=hv&q=Trúc`, đúng 1 em; Back từ hồ sơ em về đúng `?tab=hv&q=Trúc`. Lô một phần lỗi: như U02 |
| Test FT / lớp thường | nhập / sửa / vắng / khôi phục, W1/W2, lịch quá khứ / tương lai, quyền | prMt 51 · prMta 53 · prMtb 59 · prMtGon 19 · prMtVang 14 · prMt0 30 · prBv 38 (gồm V1c) · rkcDiem 6 · rkcLich 3 · prLt2a 31 · prLt2b 40 · prOv1c 11 · prOv15a–i (~100) · prBoQuaMoc 7 · prXepMtNhac 8 | — |
| Ý thức / Phối hợp | chuỗi xử lý, đổi hạn, tạm dừng / quay lại, Báo PH sau Meeting không đếm trùng | yThuc 52 · yThucGon 19 · prYt4 105 · prYtBaoPh 7 · rkcYThuc 7 · prOv12h 17 · prSvYtTvv 25 · sosV3 76 · prMt (huỷ → khôi phục Báo PH) | — |
| Phân tích / sổ nghĩa vụ | hạn chọn đúng kỳ, việc thiếu ngày xong, đổi TVV / lớp | soNghiaVu 40 · phanTich 51 · prPtPanel 20 · prPtV2ChiNhanh 10 · prPtGvOverall 6 · prViecDungVai 5 · prBaoCaoLichSu 7 · suaRa1228 F01 | — |
| Quản trị | scope, hai người sửa chi nhánh, tài khoản khôi phục, Quản trị cuối, quyền đã thu hồi | anToan 58 · banChinh 80 · prQtv2Quyen 5 · prQtv2Han 7 · prQtv2Band 5 · cauHinhCaseSos 16 · prQuyenRieng 3 · prQuyenKyNang 6 · prQuyenLichMt 4 · prChiNhanhLienHe 7 (nhánh #1460) | Chi nhánh: 4 ca hai tab (xem N04) |

Giới hạn: chưa chạy trên bản live; không có sqld (Hrana bỏ qua); khung trình duyệt ẩn nên không chụp được ảnh; phiên demo dev mất khi tải lại trang trong khung ẩn (do môi trường thử, không theo tiếp). Tài khoản khôi phục / Quản trị cuối / quyền thu hồi chỉ có phép kiểm tự động, không bấm tay.
