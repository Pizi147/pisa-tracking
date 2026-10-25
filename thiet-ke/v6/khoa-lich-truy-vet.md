# Truy vết — `khoa-lich.html` (V6 · Khoá đổi lịch MT cuối tuần — chỉ trạng thái)

> **MOCKUP-V6 · CHỜ CHỦ SP DUYỆT** (25/10). Cho P6 KHOA-LICH. Nguồn: spec 24/10 mục 3.5, R4.3; Q6–Q8 (chủ SP chọn khuyến nghị 25/10). Không đổi bố cục — chỉ trạng thái khoá trên màn có sẵn.
> Ảnh: `anh/khoa-lich-{1440-toi,375}.png`, từng khung `anh/khoa-lich-k1…k5-*.png` (+ `-375`). Dữ liệu demo **T6 18/09/2026** (khoá W2 SEP · W3 SEP · W4 SEP).

| Yêu cầu | Khung | Thành phần |
|---|---|---|
| Kế hoạch Test thứ Sáu | k1 | dải vàng một dòng "Thứ Sáu – Chủ nhật không đổi lịch MT của tuần trước / này / sau (mở lại thứ Hai 21/09)"; ô tuần khoá: 🔒 + viền đứt + `title` lý do; ô ngoài 3 tuần sửa được |
| Hộp kỹ năng | k2 | lượt đang ở tuần khoá → lý do + ngày mở, chỉ Đóng; lượt ở tuần mở → tuần khoá tắt 🔒 trong danh sách tuần đích |
| Hàng loạt | k3 | "Đã xếp 4 em" + lỗi từng em (tên — lượt, tuần khoá, ngày mở) |
| Quản trị không khoá | k4 | cùng hộp, không dải / 🔒 (vai gốc `system_admin`) |
| Vẫn mở | k5 | nhập điểm / "-" · duyệt "Dời lịch Test" (Q7) · Progress / Final lớp thường (Q6) |

| Thao tác | Trước | Sau |
|---|---|---|
| QL dời MT thứ Sáu – CN trong 3 tuần | được | bị chặn, lý do + ngày mở; Quản trị vẫn làm được |
| Nhập điểm, "-", duyệt thẻ dời, khôi phục vắng, đường gián tiếp (Q8) | được | được (giữ) |

Giả định: chữ dải dùng đúng câu của plan; ngày "mở lại thứ Hai" tính theo ngày nghiệp vụ giờ VN. Không [XM].
