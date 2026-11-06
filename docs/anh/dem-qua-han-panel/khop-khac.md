# DEM-QUA-HAN b — panel số "Việc đúng hạn" / "Chấm Test đúng hạn" (chủ SP 06/11)

Không mockup mới: PTA giao dùng lại khung panel số (`BangLuotPanel`) + tab cùng dáng tab Chưa đạt · Đạt + dòng việc kiểu Công việc. Không đổi trang Công việc, không đổi bảng Phân tích GV.

## Lời chủ SP (06/11)
- "khi bấm vào số tỷ lệ công việc đúng hạn cũng hiện lên luôn danh sách việc ĐANG QUÁ HẠN, và cũng phân loại rõ qua từng tab trong đó là việc gì, thuộc tuyến case hay bàn giao hay gì? làm gọn nhẹ dễ nhìn thôi"
- "cái chia tab này không phải là của công việc đâu nhé mà là panel thể hiện số liệu ấy?"
- "Chắc chấm test không cần vì có hẳn một cột cho chấm test rồi, panel bên đó làm lại cho gọn là được"

## Truy vết yêu cầu → thành phần → ảnh

| Yêu cầu | Thành phần | Ảnh |
|---|---|---|
| Việc đang quá hạn đầu panel | máy chủ `xepViec` (mở → trễ → đúng hạn); đầu panel "n việc · ⚠ m đang quá hạn" | `sau-viec-*` |
| Tab theo loại / tuyến, có số, rỗng ẩn, không tab Chấm Test | `TAB_VIEC_HAN` (Case – PA – Kết quả · Bàn giao · Ý thức · Báo PH · Khác), `tabViecHanCua`; một loại → không tab; số đỏ khi tab có việc quá hạn | `sau-viec-tab-case-*`, `sau-viec-tab-*` (tab Ý thức) |
| Ý thức chỉ Xử lý vi phạm bắt buộc | máy chủ #1114 (`VIEC_CO_HAN` chỉ `yt_xu_ly`) | `sau-viec-tab-*` |
| Dòng gọn, bấm mở đúng việc | cột Việc (link `href` = chính `href` dòng Công việc; Kết quả PA → Case mở đúng PA) · Học viên · Lớp · Hạn · Đúng hạn | mọi ảnh sau |
| Panel Chấm Test gọn, bài quá hạn chưa chấm trước | ô "Chấm Test đúng hạn" mở CÙNG panel số (`cot=cham-diem`, cùng `tapChamDiem`); bài → trang lượt đúng kỹ năng | `truoc-cham-*` → `sau-cham-*` |
| 375 | thẻ (`theRieng`): việc + tình trạng · em · lớp · hạn / ngày làm | `*-375-sang.png` |

## Thao tác TRƯỚC → SAU

| Trước | Sau | Lý do |
|---|---|---|
| Việc đúng hạn: bảng PA (Học viên · Lớp · Case · PA · Hạn · Ngày ghi · Đúng hạn) | bảng việc (Việc · Học viên · Lớp · Hạn · Đúng hạn), tab theo loại việc | chủ SP: phân loại theo tab, gọn |
| Bấm tên HV → hồ sơ HV | giữ; thêm bấm tên việc → mở đúng việc (Case / PA / trang lượt / việc Công việc) | "bấm mở đúng việc" |
| Chấm Test: panel riêng, lọc Tất cả · Trễ | panel số chung, bài quá hạn / trễ xếp đầu (không cần lọc) | chủ SP: làm gọn; GIỮ đủ dòng, số = ô |
| Chấm Test: cột Tuần Test, Lần nhập đầu | tuần Test thành dòng phụ dưới bài; ngày nhập dưới tình trạng ("nhập dd/mm") | gọn, không mất thông tin |
| Chấm Test: "sửa dd/mm · lần sửa không tính" | **bỏ** dòng ngày sửa; Cách tính ghi "lần sửa sau không tính" | gọn; số không đổi (tính theo lần nhập đầu). [XM] nếu cần giữ ngày sửa |
| Chấm Test: chân "Không tính: n ô vắng đã xác nhận…" + "Mở Lịch Test / Chấm Test ›" | Cách tính ghi luật không tính; mỗi bài mở đúng trang lượt | gọn; số ô vắng không còn hiện — [XM] |
| Hồ sơ GV: ô Việc / Điểm đúng hạn mở danh sách chữ | cùng panel dòng việc như Phân tích GV | một danh sách một kiểu mở |

## [XM] cho PTA
1. Panel Chấm Test bỏ ngày "sửa dd/mm" và số "n ô vắng đã xác nhận" của panel cũ — cần giữ thì thêm dòng phụ / dòng chân (không đổi số).
2. Tab loại việc không ghi vào URL (như tab Chưa đạt · Đạt sẵn có); panel đã ở URL (`so-lieu`).
3. Đường cũ `/phan-tich/giao-vien/cham-diem` còn (phép kiểm, đo) nhưng web không gọi nữa — gỡ ở PR dọn nếu PTA đồng ý.
