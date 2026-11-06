# DEM-QUA-HAN b — panel số "Việc đúng hạn" / "Chấm Test đúng hạn" (chủ SP 06/11)

Không mockup mới: PTA giao dùng lại khung panel số (`BangLuotPanel`) + tab cùng dáng tab Chưa đạt · Đạt + dòng việc kiểu Công việc. Không đổi trang Công việc, không đổi bảng Phân tích GV, không đổi số (% / tử / mẫu).

## Lời chủ SP (06/11)
- "khi bấm vào số tỷ lệ công việc đúng hạn cũng hiện lên luôn danh sách việc ĐANG QUÁ HẠN, và cũng phân loại rõ qua từng tab trong đó là việc gì, thuộc tuyến case hay bàn giao hay gì? làm gọn nhẹ dễ nhìn thôi"
- "cái chia tab này không phải là của công việc đâu nhé mà là panel thể hiện số liệu ấy?"
- "Chắc chấm test không cần vì có hẳn một cột cho chấm test rồi, panel bên đó làm lại cho gọn là được"
- "mà quá hạn với trễ là sao, sao không phải là cùng 1 cái à? nhìn bị loạn quá."
- Chốt: "Thôi làm phân loại luôn đi việc đang quá hạn ưu tiên hiện lên, còn việc đã làm rồi cho hẳn sang 1 tab nhé"

## Truy vết yêu cầu → thành phần → ảnh

| Yêu cầu | Thành phần | Ảnh |
|---|---|---|
| Tab loại / tuyến CHỈ việc đang quá hạn, số tab = số quá hạn, rỗng ẩn | `TAB_VIEC_HAN` (Case – PA – Kết quả · Bàn giao · Ý thức · Báo PH · Khác), `tabViecHanCua`; số đỏ | `sau2-viec-gvcn-*`, `sau2-viec-gvcn-y-thuc-*` |
| Việc đã làm sang MỘT tab "Đã làm n" | tab cuối `da-lam`: mọi việc đã làm trong kỳ, dòng phụ ghi loại việc | `sau2-viec-da-lam-*`, `sau2-viec-gvcn-da-lam-*` |
| Mặc định tab loại đầu có việc quá hạn, không có thì "Đã làm" | `tabsViec[0]` (loại có việc quá hạn đứng trước "Đã làm") | `sau2-viec-*`, `sau2-cham-*` |
| Một chữ "Quá hạn" (bỏ "Trễ") | ô Đúng hạn: "⚠ Quá hạn n ngày" (việc mở + làm sau hạn) / "✓ Đúng hạn"; dòng phụ "đã làm dd/mm" · "nhập dd/mm"; Cách tính "làm / nhập sau hạn = quá hạn" | mọi ảnh `sau2-*` |
| Bấm mở đúng việc | cột Việc = link `href` (việc mở = chính dòng Công việc; Kết quả PA → Case mở đúng PA; bài → trang lượt đúng kỹ năng) | — |
| Panel Chấm Test gọn | ô "Chấm Test đúng hạn" mở CÙNG panel số (`cot=cham-diem`, cùng `tapChamDiem`); hai tab "Quá hạn chưa chấm n" · "Đã nhập n" | `truoc-cham-*` → `sau2-cham-*` |
| 375 | thẻ (`theRieng`): việc + tình trạng · em · lớp · hạn / ngày làm / loại | `*-375-sang.png` |

## Thao tác TRƯỚC → SAU

| Trước | Sau | Lý do |
|---|---|---|
| Việc đúng hạn: bảng PA (Học viên · Lớp · Case · PA · Hạn · Ngày ghi · Đúng hạn), trộn việc quá hạn với việc đã làm | tab loại việc (chỉ việc đang quá hạn) + tab "Đã làm"; bảng Việc · Học viên · Lớp · Hạn · Đúng hạn | chủ SP |
| Bấm tên HV → hồ sơ HV | giữ; thêm bấm tên việc → mở đúng việc | "bấm mở đúng việc" |
| Chấm Test: panel riêng, lọc Tất cả · Trễ | panel số chung, tab "Quá hạn chưa chấm" · "Đã nhập" | chủ SP: làm gọn; GIỮ đủ dòng, số = ô |
| Chấm Test: cột Tuần Test, Lần nhập đầu | tuần Test dòng phụ dưới tên bài; ngày nhập dưới tình trạng ("nhập dd/mm") | gọn, không mất thông tin |
| Hai chữ "Quá hạn" / "Trễ" | một chữ "Quá hạn n ngày" + dòng phụ ngày làm | chủ SP |
| Chấm Test: "sửa dd/mm · lần sửa không tính" | **bỏ** dòng ngày sửa; Cách tính ghi "lần sửa sau không tính" | gọn; số không đổi. [XM] nếu cần giữ |
| Chấm Test: chân "Không tính: n ô vắng đã xác nhận…" + "Mở Lịch Test / Chấm Test ›" | Cách tính ghi luật không tính; mỗi bài mở đúng trang lượt | gọn; số ô vắng không còn hiện — [XM] |
| Hồ sơ GV: ô Việc / Điểm đúng hạn mở danh sách chữ | cùng panel tab như Phân tích GV | một danh sách một kiểu mở |

## [XM] cho PTA
1. Panel Chấm Test bỏ ngày "sửa dd/mm" và số "n ô vắng đã xác nhận" của panel cũ — cần giữ thì thêm dòng phụ / dòng chân (không đổi số).
2. Tab không ghi vào URL (như tab Chưa đạt · Đạt sẵn có); panel đã ở URL (`so-lieu`).
3. Đường cũ `/phan-tich/giao-vien/cham-diem` còn (phép kiểm, đo) nhưng web không gọi nữa — gỡ ở PR dọn nếu PTA đồng ý.

## Ảnh
`truoc-*`: trước PR (panel PA / panel Chấm điểm riêng). `sau2-*`: bản chốt (GV demo Phạm Thu Trang — Việc, Chấm Test; GVCN Trần Ngọc Hà — tab Case, Ý thức, Đã làm). 1440 tối · 375 sáng.
