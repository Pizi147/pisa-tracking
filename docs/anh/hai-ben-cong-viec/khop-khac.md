# Hai cột cố định · Công việc — khop-khac (PR #2094)

Khung: danh sách | ô phải cố định (1440: 656 | 720 · 1280: 520 | 696), đóng và mở panel bằng nhau. Quét bằng Playwright, mở TỪNG việc ở mọi hạng mục, vai GV (7, 8, 9, 10, 12) · TVV (27, 28) · QL (2, 3) · CX (24) · Head tutor (25) · Quản trị (1, không có việc). Ảnh: thư mục này + `panel/`.

## Sửa trong PR (tóm tắt TRƯỚC → SAU)
| Chỗ | TRƯỚC | SAU |
|---|---|---|
| Danh sách 656 / 520 | chữ chi tiết cắt "…" (Final W3 SEP · Tổng h…, Checkpoint…, tên người) | cột lớp / ai thu theo nội dung, chi tiết ăn phần dư và XUỐNG DÒNG (không "…") ở 600–1099 px; < 600 vẫn hai tầng |
| Dải hạng mục khi mở panel | cắt "Đang the…", cuộn mờ mép | tab không vừa dồn vào "Thêm ▾" (mở bằng bấm, Esc / bấm ngoài đóng); không cuộn, không cắt giữa chữ |
| Lớp của tôi (720) | 4 cột cố định 104 / 164 / 1fr / 56 → "Tôi dạy" thừa chỗ | 1 · 1,1 · 1,6 · 0,9 theo phần; số Việc căn giữa cột cuối |
| Bàn giao | "Case đang mở" một đoạn nối " · " chi chít; danh sách em 280 | mỗi Case một dòng (+ người nhận gợi ý mờ); danh sách em 236; nhãn 6,25 rem |
| Ô nhập nhiều chữ trong panel | 3 dòng cố định, 300 ký tự bị cắt | tự dãn 4,5–14 rem, rồi cuộn; ~62 ký tự/dòng ở 1280, ~75 ở 1440 |
| Xác nhận Case › Phương án | một dòng chữ dài "Bổ trợ 2 buổi/tuần · chung các môn trượt · …" | tách " · " thành mẩu có viền, xuống dòng ≤ 72 ký tự, "Sửa" cạnh |
| Hồ sơ lớp 375 · Task nổi | che chip / tab | ẩn khi chạm tablist / chip (đã ở vòng trước) |

## Bảng panel → đạt / đã sửa (1440 trừ khi ghi khác)
| Panel | Kết quả | Ghi chú / ảnh |
|---|---|---|
| Nhập điểm (một / nhiều kỹ năng, Tổng hợp, theo tuần, L+S) | ĐẠT | lưới chia đều trong 720, "Mở lưới đầy đủ ›" + "Cả lớp" đúng chỗ; `tong-1…`, `tong-5…` |
| Chấm Speaking | ĐẠT | chọn GV chấm, bảng 3 cột; `tong-4…` |
| Điểm / Nhập điểm chỉ xem (Pronunciation, Reading) | ĐẠT | `tong-4…`, `tong-5…` |
| Case · Mô tả Case (nguyên nhân, mô tả) | ĐÃ SỬA | ô Mô tả tự dãn; chữ dài 1440 / 1280 / 375: `sau-chu-dai-*` |
| Case · Xác nhận Case | ĐÃ SỬA | Phương án tách mẩu; `xac-nhan-case-pa-tach-mau-1440 / 1280 / 375` |
| Case · Thêm PA | ĐẠT | form Loại PA / Nội dung / Số buổi / Bắt đầu, nhãn rõ; `tong-1…` |
| Case · Xác nhận PA, PA đang chạy, Ghi kết quả PA / Ghi Mini Test | ĐẠT (soi qua danh sách việc + panel Case) | không có panel riêng ở demo với dữ liệu "Ghi kết quả PA" mở được cho vai quét — **chưa chụp riêng** |
| Case Speaking / Pronunciation (tuyến S chéo, Tutor / Bổ trợ) | ĐẠT | `tong-4…`, `tong-5…` (PA Bổ trợ: người dạy, Số buổi) |
| Case bị từ chối / trả lại | CHƯA CHỤP | demo không có Case ở trạng thái này |
| Xét lại lộ trình | ĐẠT | thẻ từng em, 3 nút đều; `tong-2…` |
| Bàn giao (GVCN · GVBM · Pronunciation) | ĐÃ SỬA | `sau-ban-giao-1440 / 1280`, `tong-2…`, `tong-4…` |
| Meeting (CX/GĐCN, GVCN meeting, Trao đổi gia đình) | ĐẠT | 3 cột Học viên · Cần làm · ⋯; `tong-2…`, `tong-3…` |
| Báo PH (kết quả Test / REPORT) | ĐẠT | `tong-2…`, `tong-3…` |
| Bổ sung hồ sơ (Sửa thông tin) | ĐẠT | `tong-3…` |
| Việc quản lý: việc tay / được giao · Phụ trách · Hạn · Theo dõi · Việc con · Tệp · Lịch sử | ĐẠT | `tong-3…`, `tong-5…` |
| Cập nhật tiến độ (Tạm ngưng / Dừng hẳn / Hoàn thành) | ĐẠT | lý do, cần ai hỗ trợ, ngày xem lại, cập nhật; `cap-nhat-tien-do-tam-ngung-dung-han-1440` |
| Hoàn thành + Hoàn tác | CHƯA CHỤP | thao tác ghi dữ liệu — không bấm trên demo chung |
| Ý thức · Xác nhận xử lý + cấp bậc (vi phạm đưa vào, cách xử lý 4 thẻ, ngày, người, mô tả) | ĐẠT | `tong-2…` |
| Ý thức · Phối hợp (Meeting / sos_coordination) | ĐẠT | cùng panel Meeting |
| Ý thức · Ghi vi phạm / nhắc nhở, Trả lại vi phạm (3 lựa chọn TVV), Khai cấp bậc lô N70 | CHƯA CHỤP | không có việc mở được trong demo cho các vai quét (nút + Task › Ghi vi phạm không mở được bằng script). Cần dữ liệu giả lập — xin PTA chỉ vai / lớp có việc này |

Phát hiện khác (không sửa, không phải lỗi bố cục): chữ "…" ở nút "Không cần theo dõi…", "Thao tác khác", "(bắt buộc)" là chủ ý / chữ cho trình đọc màn.
