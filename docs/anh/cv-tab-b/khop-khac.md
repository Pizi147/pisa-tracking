# CV-TAB b — GV nhiều chi nhánh · QL chỉ thấy việc chi nhánh mình · KHỚP / KHÁC

Mockup đã duyệt (chủ SP 06/11 khuya): `thiet-ke/v17-nhap/` a1 (GV 2 chi nhánh), a2 (QL Cẩm Phả xem "Của GV · Dũng"), b (375). Nối tiếp PR a (#1126).

**Dữ liệu ảnh:** seed demo không có GV nào có VIỆC ở hai chi nhánh (GV vai 9 dạy Monbay + Bãi Cháy, vai 14 Cẩm Phả + Hải Dương, nhưng việc chỉ ở một). Để chụp, DB demo CỤC BỘ
(không commit, đã trả lại chủ phân công gốc sau khi chụp) chuyển tạm 6 phân công: BC FT 205 L · R · GVCN → vai 9; CP FT 110 L · R · GVCN → vai 14; HD FT 302 L · R · GVCN → vai 14.
Phép kiểm CVT-3 chạy trên seed nguyên (GV hai chi nhánh theo phân công).

| Ảnh | Khung | Web |
|---|---|---|
| `cap-1440-a1.png` | a1 `.man` | `/cong-viec?nhom=cham-diem` · GV vai 9 · 1440 tối |
| `cap-1440-a2.png` | a2 `.man` | `/cong-viec?nguoi=14&cn=3&nhom=cham-diem` · QL Cẩm Phả (vai 4) · 1440 tối |
| `cap-375-b.png` | b `.man` | `/cong-viec?nhom=cham-diem` · GV vai 9 · 375 sáng |

## Bảng truy vết khung → thành phần → ảnh

| Khung (mockup) | Thành phần / tệp web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| a1 `.seg` "Tất cả chi nhánh 12 · Monbay 7 · Cẩm Phả 5", mặc định Tất cả | `BoLocDoan` (mẫu "Của tôi / Của GV / Tất cả" sẵn có) trong `HoTroHocVienTab`; số = `demDongViec` theo CN | a1 | KHỚP |
| b `.seg` 375 "Tất cả CN 12 · …" một khối hết bề rộng | cùng ô, nhãn ngắn "Tất cả CN" < 640 px | b | KHỚP |
| a1 / b `.cn` thẻ mã chi nhánh sau tên việc (11 px) | `TenCn` (`DanhSachViec.tsx`) — dính chữ cuối của tên, chỉ khi GV có việc ở > 1 CN; chữ 12 px (thang chữ khoá không có 11) | a1, b | KHỚP |
| badge tab đếm theo CN đang chọn | lọc tại máy trước khi đếm (`tatCaViec`) | a1 | KHỚP |
| a2 `.tom` "{GV} · n việc ở {CN} · m quá hạn" | dòng tóm tắt đầu trang | a2 | KHỚP |
| a2 `.ghi-cn` "{GV} dạy cả {CN} — việc ở {CN} do QL {CN} theo dõi, không hiện ở đây." | `cnAn` của `/my-work?nguoi=` + dòng 13 px mờ trên hàng tab | a2 | KHỚP — chữ "việc ở đó" thay lặp tên CN (nhiều CN thì nối ", ") |
| a2 hàng lọc "Nguyễn Hoàng Dũng ▾ · Mọi khung ▾ · Chi nhánh Cẩm Phả ▾" hiện sẵn | "Lọc thêm · 2" mở sẵn (Một GV · Chi nhánh) | a2 | KHÁC — giữ "Lọc thêm" của U01 #1 (một hàng lọc); mở sẵn khi đang bật nên vẫn thấy cả ô |
| a2 tab "Chấm điểm 1 · Case học thuật 2" | tab theo việc GV ở Cẩm Phả (dữ liệu demo khác) | a2 | KHỚP bố cục |
| (GIỮ) ô Chi nhánh trong Lọc thêm (QL / Admin / QT) | `BranchFilter` — GV có dải CN thì ẩn ô này (một chỗ chọn chi nhánh) | a2 | GIỮ |

Ước KHỚP: 8 / 9 ≈ 89 % thô; KHÁC duy nhất là hàng lọc QL (giữ quyết định U01 #1 đã duyệt — không đổi hàng lọc trong PR này). Hỏi PTA [XM-2].

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| GV dạy 2 chi nhánh xem việc | ô Chi nhánh trong Lọc thêm (chỉ khi tài khoản có > 1 chi nhánh theo vai; gọi lại máy chủ), mặc định chi nhánh đã nhớ | dải "Tất cả chi nhánh · {CN}" ngay hàng lọc, mặc định Tất cả, lọc tại máy (không gọi lại) |
| Biết việc thuộc chi nhánh nào | đọc mã lớp | thẻ CN sau tên việc |
| QL CP xem việc một GV dạy 2 chi nhánh | chỉ việc CP (máy chủ đã lọc theo quyền), không nói gì về chi nhánh kia | như cũ + dòng "… dạy cả {CN} — việc ở đó do QL {CN} theo dõi" |
| QL / Admin / QT chọn chi nhánh | ô Chi nhánh (Lọc thêm) | như cũ |

Không mất thao tác.

## Máy chủ (đã kiểm hiện trạng)

- `viecCuaNguoi` đã lọc dòng theo quyền xem lớp / em của người xem (`can(ATTEMPT_VIEW)`) → QL một chi nhánh không thấy việc chi nhánh khác: ĐÚNG từ trước, không sửa luật.
- Thêm: `WorkItem.cn` (chi nhánh lớp, từ `bangLop()` đã nhớ — 0 câu) · `myWork().chiNhanh` (mã + tên khi việc ở > 1 CN) · `viecCuaNguoi().cnAn` (chi nhánh GV dạy theo phân công đang hiệu lực mà người xem không xem được).
  Tên chi nhánh: `bangChiNhanh()` nhớ theo tiến trình (`nhoThamChieu`, khoá phiên bản DB) — 0 câu khi DB chưa đổi, 1 câu ≤ 5 dòng sau ghi.
- Dòng tuần nhiều lớp (Nhập điểm theo tuần) ở > 1 chi nhánh: `cn = null` (`gopViec.ts`), hiện ở mọi CN.
- Phân tích GV (#1114, `viecQuaHanMo`): dựng Công việc của QL chi nhánh `c.cn` với `branchId: c.cn` → "Việc đúng hạn" chỉ trong chi nhánh đang xem — đã đúng, không sửa.

## Quyết định / lệch

- Dải CN của GV theo **chi nhánh có việc** (> 1), không theo chi nhánh có phân công — CN không có việc thì một ô "0" vô ích.
- Việc không gắn lớp (Giao việc…) / dòng tuần nhiều CN hiện ở MỌI chi nhánh (như luật khung MH4 — không bao giờ giấu việc); tổng các ô CN có thể > "Tất cả" (`ponytail:` trong mã).
- GV: `/my-work` không còn gửi `branchId` (trước: chi nhánh đã nhớ nếu tài khoản > 1 CN) — một lần nạp, lọc tại máy.

## [XM]

- [XM-2] a2 vẽ Một GV · Mọi khung · Chi nhánh thẳng trên hàng lọc; web giữ "Lọc thêm ▾" (U01 #1, mở sẵn khi đang bật). Đổi hàng lọc QL theo a2?
