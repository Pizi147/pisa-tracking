# BC-PH-KY-NANG — khớp / khác

Nguồn yêu cầu: chủ SP 28/11 (`plan.md` mục 4, dòng "Chủ SP 28/11 (Báo cáo PH)") + hai lời thêm trong phiên ("không ghi / để lại điểm", "quyết định ở cả lúc xuất lẫn lúc GV", "panel rộng hơn cũng được") + PTA Plan chốt [XM] 28/11.
Không có mockup mới: thêm nút / ô / chữ theo mẫu sẵn có (thanh chọn nhiều em, ô tick, dải nút) — `plan.md` 1.3b. Ảnh trước | sau ở thư mục này (tối, Be Vietnam Pro đã nạp).

## 1. Truy vết yêu cầu → thành phần → ảnh

| Yêu cầu | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| Em không học kỹ năng → không cần báo cáo | ô "Không học" (`TabBaoCaoPh`, `phanKhongCan` máy chủ) | `*-tab-*` | KHỚP |
| Bỏ chi tiết tới từng kỹ năng | hàng "Không cần báo cáo: Cả em · L · R · W1 · W2 · S" trên `ThanhChonNhieu` (`dongTren`) | `*-chon-*` | KHỚP — chọn tại chỗ, không mở hộp |
| Kỹ năng "có cần" (PTA chốt 28/11) | hàng "Cần báo cáo … dù không học" (chỉ kỹ năng em đã chọn không học) | `sau-can-*` | KHỚP |
| Mức không bắt buộc, vẫn nhắc "nên chọn" | `HangThang` "● nên chọn" (vàng nhẹ); panel đọc "· nên chọn" | `*-panel-*` | KHỚP |
| Chèn thông tin dưới ô Đề xuất cải thiện | `viet-ghi mot` — `KhoiDaGhi` dưới `DuoiOChu`, hết bề ngang | `*-panel-chu-*` | KHỚP |
| Không ghi điểm — lúc GV | ô tick "Ghi vào báo cáo" mép phải dòng Điểm (`DongDiem`) | `sau-panel-*` | KHỚP (đúng chỗ chủ SP khoanh) |
| Không ghi điểm — lúc xuất | ô tick "Ghi điểm" cạnh Xuất (tab lớp) · trong khối Tháng (Học viên & Lớp › Xuất Excel › Báo cáo PH) | `sau-tab-*` | KHỚP — một kiểu ở hai nơi |
| Panel rộng hơn | `KhungPanel rong="viet"` 960 px | `sau-panel-*` | **KHÁC** khung chung 720 px — lý do: chủ SP 28/11 "làm panel rộng hơn cũng được"; panel viết có danh sách em 200 px + form + khối "Bạn đã ghi" dưới ô, 720 làm tiêu chí xuống 3 dòng (ảnh trước). Chỉ panel này |

BỎ: không. GIỮ: mọi thao tác cũ (mục 2).

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bỏ báo cáo em | Tick em → "Không báo cáo · n em" | Giữ (mặc định "Cả em"); thêm chọn từng kỹ năng không cần / cần trên cùng thanh |
| Khôi phục | Em bỏ cả em | + em bỏ / ghi đè theo kỹ năng (xoá mọi quyết định của em đợt đó) |
| Hoàn tác | Đảo bỏ / khôi phục | Trả từng em về đúng quyết định trước |
| Ô phần em không học | Phải viết | "Không học", không bấm, không đếm (Head chọn "Cần báo cáo" → ô thường) |
| Đủ một phần | Mọi tiêu chí có mức + chữ | Có chữ; tiêu chí trống nhắc "nên chọn" |
| Chèn "Bạn đã ghi" | Cột phải 280 px | Dưới ô chữ, hết bề ngang; Chèn / Hoàn tác chèn giữ |
| Điểm trong tệp | Luôn in | GV bỏ "Ghi vào báo cáo" (từng em) hoặc người xuất bỏ "Ghi điểm" (cả tệp) |
| Đặt nhanh · Viết · Lưu · em tiếp · Xuất · Đợt | Giữ | Giữ |
