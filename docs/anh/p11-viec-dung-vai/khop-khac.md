# P11 VIEC-DUNG-VAI — ảnh trước / sau, thao tác TRƯỚC → SAU

Seed demo 14/09/2026, lớp MB FT 101. GV = Trần Ngọc Hà (GVCN), QL = Nguyễn Khánh Vy (QL MB). 1440 tối, 375 sáng.

## Ảnh

| Màn | Vai | Trước | Sau |
|---|---|---|---|
| HV & Lớp lọc MB FT 101 | GV 1440 | `truoc-gv-hv-lop-1440-toi.jpg` | `sau-gv-hv-lop-1440-toi.jpg` |
| HV & Lớp | GV 375 | `truoc-gv-hv-lop-375-sang.jpg` | `sau-gv-hv-lop-375-sang.jpg` |
| Hồ sơ lớp (thanh Việc cần làm) | GV 1440 | `truoc-gv-ho-so-lop-1440-toi.jpg` | `sau-gv-ho-so-lop-1440-toi.jpg` |
| HV & Lớp lọc MB FT 101 | QL 1440 | `truoc-ql-hv-lop-1440-toi.jpg` | `sau-ql-hv-lop-1440-toi.jpg`, `sau-ql-hv-lop-1440-toi-xem-them.jpg` (Hà Gia Bình đã mở) |
| HV & Lớp | QL 375 | `truoc-ql-hv-lop-375-sang.jpg` | `sau-ql-hv-lop-375-sang.jpg` |

GV trước = sau trên seed: đã kiểm cả 16 GV, `/my-work` của GV không có dòng `mine = false`. Phần GV của PR là: máy chủ `viec-theo-em` không còn
trả việc của GV khác (trước đây có, VDV-3 / SVLOP-4) + web lọc `mine` ở cột Việc, chip "Có việc quá hạn", badge quá hạn đầu hồ sơ lớp (chốt chặn
khi dữ liệu thật có dòng không người giữ). Hồ sơ lớp không còn cột Việc theo em (bỏ từ UI-HO-SO-LOP); thanh Việc cần làm vốn đã chỉ việc của mình — QL giữ nguyên nên không chụp.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| GV xem ô Việc của em | việc gấp nhất + "+n việc" (từ `/my-work` của GV, có thể lẫn dòng không phải của GV) | như cũ, chỉ việc `mine` |
| QL / Admin xem ô Việc | một việc gấp nhất + "+n việc" (mọi môn lẫn nhau) | mỗi môn một dòng (việc gấp nhất của môn · hạn · "+n việc"), một dòng cho việc không gắn môn; 3 dòng gấp nhất |
| QL mở hết việc của em | không có (phải sang Công việc) | "Xem thêm (n)" mở tại chỗ, "Thu gọn" đóng |
| Bấm một việc | làm tại chỗ (`onMoViec`: ngăn Case / panel việc / trang việc) | như cũ, ở mọi dòng |
| TVV / CX | việc của mình | không đổi |
| 375 | nút việc cao theo chữ | mỗi dòng ≥ 44 px, hạn cùng hàng bên phải |
| Chip "Có việc quá hạn", sắp "Cần chú ý trước" | cùng nguồn `viec` | không đổi nguồn (GV: lọc `mine` trước khi dựng) |

Không mất thao tác nào.

## Ghi chú
- Môn = nhãn `phu` có sẵn của `/my-work` (Nhập điểm nhiều môn lấy môn đầu: "Listening, Reading" → dòng Listening). Ghi Mini Test / Ý thức / Báo PH / Điền Target… → dòng không môn.
- Lệch có sẵn (không do PR này, không sửa): số "n việc quá hạn" ở hộp lớp HV & Lớp (GV 10) ≠ badge đầu hồ sơ lớp (GV 6) — hai nguồn đếm khác nhau.
