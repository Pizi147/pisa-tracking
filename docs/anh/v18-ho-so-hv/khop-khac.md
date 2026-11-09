# v18 · Hồ sơ HV — HS1 dải ô điểm · HS2 Tiến độ rỗng · nút đè chữ PA

Mockup: `thiet-ke/v18/ho-so-hv.html` (#1279, chủ SP duyệt 10/11: "tôi vẫn muốn tiến độ trên lớp ở phía bên trái và case bên phải nhé, còn lại ok").
Ảnh cặp mockup | web: `cap-*.png` (1440 tối, 375 sáng; phông Be Vietnam Pro + Inter kiểm `document.fonts.check` = true). Demo 14/09/2026, GV Trần Ngọc Hà.

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần | Tệp | Ảnh | Khớp |
|---|---|---|---|---|
| A1 dòng nguồn "Mock Test gần nhất · MT3 · W2 SEP" | `DiemDau` (dòng `p` trên lưới) | `HanhTrinhKyNang.tsx` | `cap-overall-1440.png`, `cap-overall-375.png` | KHỚP |
| A1 Overall "kỳ vọng 7.0", 5 thẻ kỹ năng không dòng phụ | `DiemDau` (`phu`) | `HanhTrinhKyNang.tsx` | như trên | KHỚP |
| C2 thẻ khác nguồn "từ MT2" đậm | `ODiemTo` (`phuDam`) | `HanhTrinhKyNang.tsx` | — (seed không có em lệch nguồn ở lượt gần nhất; logic: `bandAttemptNo ≠ attemptNo` của lượt Kết quả) | KHỚP (mã) |
| C3 / C7 chưa có MT: "Chưa có điểm Mock Test", thẻ "—" | `DiemDau` (`coDiem`) | `HanhTrinhKyNang.tsx` | `cap-chua-mt-1440.png` | KHỚP |
| A2 / B2 / C4 Tiến độ rỗng: thẻ gọn hai hàng trong cột trái, Case cột phải | `TienDoTrenLop` (`rong`) | `TienDoTrenLop.tsx` | `cap-s-rong-1440.png`, `cap-s-rong-375.png` | KHỚP |
| C1 / C6 + Ghi tiến độ → form trong cột trái | `FormTienDo` (giữ) | `TienDoTrenLop.tsx` | `cap-ghi-1440.png` | KHỚP (form web giữ trường thật: Không có · Điểm · Band) |
| Ô thi thật / lớp thường | `DiemDau` | — | — | GIỮ (không dòng nguồn) |
| Ngoài mockup (PTA 10/11): thẻ việc "Ghi kết quả PA" — chip PA dài đè nút | `OViec` (chip `truncate` + `title`) | `DauHoSo.tsx` | `truoc-sau-the-viec-1440.png` | SỬA |
| Thanh đầu trang, tab, Hành trình, Case, Mock Test | — | — | — | GIỮ |
| BỎ | dòng phụ "MT3" lặp ở 5 thẻ kỹ năng; "MT3 ·" ở Overall; 6 lần "chưa có điểm" khi chưa có MT; đầu thẻ có vạch ngăn khi Tiến độ rỗng | | | |

## Thao tác trước → sau

| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| Bấm ô điểm đổi kỹ năng (`aria-pressed`) | có | có | GIỮ |
| `title` ô điểm "Listening · MT3 · kỳ vọng 7.0" | có | có | GIỮ |
| + Ghi tiến độ (khi ghi được, quyền máy chủ) | đầu thẻ | hàng 2 thẻ rỗng; đầu thẻ khi có ghi nhận | GIỮ |
| Sửa / xoá dòng · Hoàn tác 10 giây · Xem thêm · rê dòng tô tuần chart · ⓘ | có | có | GIỮ |
| Đã xoá dòng cuối → "✓ Đã xoá · Hoàn tác" | có | có (thẻ đủ khi có báo, không thu gọn) | GIỮ |
| Ghi kết quả PA ở thẻ việc | nút bị chữ PA đè | nút rõ; chữ PA đủ ở `title` | SỬA |

Không mất thao tác nào.

## Dòng đọc Turso

Không đổi: không thêm request, không đổi đường API, không thêm câu. Dòng nguồn dùng `attempts[].weekStart` + `bandAttemptNo` đã nạp trong `GET /students/:id` và bảng kỹ năng; "rỗng" dùng `/students/:id/bai-tren-lop` đã nạp.
