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
| Case · Xác nhận PA | ĐẠT | form Nội dung / Bắt đầu + 3 nút; `tong-6-…`, `khong-can-theo-doi-gui-head-1440` (form Không cần theo dõi: 3 lý do, quy chế, Đóng / Gửi Head duyệt) |
| Case · PA đang chạy (sau Xác nhận Case) + Hoàn tác | ĐẠT | `xac-nhan-case-pa-dang-chay-hoan-tac-1440` (chip "Đang chạy · KQ hạn…", toast Hoàn tác 9 s) |
| Case · Ghi Mini Test / Ghi kết quả PA | ĐẠT | `tong-6-…`: Tiến triển 5 chip, Nhận xét, Số buổi, Người dạy, chân "chưa chốt" |
| Case Speaking / Pronunciation (S chéo, Tutor / Bổ trợ) | ĐẠT | `tong-4…`, `tong-5…` |
| Case bị Head từ chối (Không cần theo dõi) | ĐẠT (giả lập) | gửi qua UI, Head từ chối qua API `/yeu-cau/24/tu-choi` trên DB scratchpad; GV thấy kết quả ở "Lịch sử · 2" của panel Case (`case-sau-tu-choi-lich-su-1440`) — **không có thẻ việc riêng**; xin PTA xem có cần nổi lên danh sách không |
| Xét lại lộ trình | ĐẠT | thẻ từng em, 3 nút đều; `tong-2…` |
| Bàn giao (GVCN · GVBM · Pronunciation) | ĐÃ SỬA | `sau-ban-giao-1440 / 1280`, `tong-2…`, `tong-4…` |
| Meeting (CX/GĐCN, GVCN meeting, Trao đổi gia đình) | ĐẠT | `tong-2…`, `tong-3…` |
| Báo PH (kết quả Test / REPORT) | ĐẠT | `tong-2…`, `tong-3…` |
| Bổ sung hồ sơ (Sửa thông tin) | ĐẠT | `tong-3…` |
| Việc quản lý: việc tay / được giao · Phụ trách · Hạn · Theo dõi · Việc con · Tệp · Lịch sử | ĐẠT | `tong-3…`, `tong-5…` |
| Cập nhật tiến độ (Tạm ngưng / Dừng hẳn / Hoàn thành) | ĐẠT | `cap-nhat-tien-do-tam-ngung-dung-han-1440` |
| Hoàn thành + Hoàn tác | ĐẠT | Hoàn tác = toast sau Ghi vi phạm (`ghi-vi-pham-hoan-tac-1440`) và sau Xác nhận Case; nút "Hoàn thành Case" ở khối Kết luận (`tong-6…`) — không bấm trên Case thật |
| Ý thức · Ghi vi phạm (nhóm / vi phạm / môn nhiều kỹ năng / ngày / mô tả / bằng chứng) | ĐẠT | `ghi-vi-pham-1440`, `ghi-vi-pham-da-dien-1440` (tạo thật trên DB scratchpad) |
| Ý thức · Chỉ nhắc nhở | ĐẠT | `chi-nhac-nho-1440` |
| Ý thức · Trả lại vi phạm (Head trả qua API; GV: Sửa rồi gửi lại · Giữ nguyên + trả lời · Xoá) | ĐẠT (giả lập) | `vi-pham-bi-tra-lai-1440 / 1280 / 375`; danh sách hai tầng ở 1280 hết "…" (đã sửa) |
| Ý thức · Xác nhận xử lý + cấp bậc | ĐẠT | `tong-2…` |
| Ý thức · Khai cấp bậc lô N70 | ĐẠT (giả lập: 4 em lớp MB FT 101 sửa `created_at` trong 14 ngày) | `khai-cap-bac-lo-N70-1440 / 1280 / 375` |
| Ý thức · Phối hợp (Meeting / sos_coordination) | ĐẠT | cùng panel Meeting |
| 375 — mọi panel trên | ĐẠT | chân lưu cố định, nút 44 px (`vi-pham-bi-tra-lai-375`, `khai-cap-bac-lo-N70-375`, `sau-chu-dai-375`) |

Giả lập: mọi dữ liệu thêm chỉ nằm trong bản chép DB ở scratchpad, KHÔNG commit DB.
Audit (impeccable detect trên tệp đổi): 0 anti-pattern; 2 ghi chú cũ (mặt nạ #000 ở HangTab, chữ 16 px tiêu đề Lớp của tôi). web-design-guidelines: đã áp (Esc / bấm ngoài đóng menu Thêm).

Phát hiện khác (không sửa, không phải lỗi bố cục): chữ "…" ở nút "Không cần theo dõi…", "Thao tác khác", "(bắt buộc)" là chủ ý / chữ cho trình đọc màn.
