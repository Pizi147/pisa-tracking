# OCHON-GAN-DAY — nhóm "Gần đây" trong ô chọn chung · khớp / khác

Nguồn: GD-5 [XM-d] (`docs/anh/gd5/khop-khac.md`) · tờ mẫu ⑤ A5 "Người nhận việc · QL giao" (`thiet-ke/v21/bang-mau.html`) + bảng kê dòng 21 / 22 / 24 (`bang-mau-ghi-chu.md`: "Gần đây → Chi nhánh → Khác", "Tôi → Gần đây → Chi nhánh") · [XM-4] (localStorage, try/catch, 0 dòng đọc).
Seed demo 14/09, QL Nguyễn Khánh Vy (vai 2), Công việc › Việc quản lý › + Giao việc › Người phụ trách: chọn hai người rồi mở lại ô.

## Ảnh (TRƯỚC │ SAU)

| Ảnh | Nội dung |
|---|---|
| `cap-giao-viec-1440-toi.png` | TRƯỚC: Tôi → danh sách chi nhánh phẳng · SAU: Tôi → **Gần đây 2** (người vừa chọn, gần nhất trước, ✓ ở người đang chọn) → Cùng chi nhánh MB 9 |
| `cap-giao-viec-375-sang.png` | như trên, màn chọn toàn màn 375 (⑤ A7): dòng cao 52 px (≥ 44), nhãn nhóm đúng |

Không ✕ / ⋯ nào đổi; chữ không bị cắt.

## 1. Truy vết

| Mục | Mockup / luật | Web | Kết quả |
|---|---|---|---|
| Nhóm "Gần đây" ở đầu, có số | ⑤ A5 | `ChonNguoi` (`ui/PeoplePicker.tsx`) — MỘT chỗ cho mọi ô chọn chung (ChonNguoi, `ChonLoc`, `ChonLop`… đều đi qua đây); hàm thuần `xepGanDay` (`shared/domain/ganDay.ts`) | KHỚP |
| Thứ tự "Tôi → Gần đây → Chi nhánh" | bảng kê dòng 24 | "Tôi" (dòng riêng) giữ trước, "Gần đây" sau | KHỚP |
| Không nhân đôi | — | mục gần đây DỜI lên (rời nhóm cũ) → ↑ ↓ Enter đi qua mỗi người một lần, đúng thứ tự hiện | KHỚP (đo: 4 lần ↓ = Tôi · Nguyễn Khánh Vy · Lê Thanh Bình · Cao Khánh Linh) |
| Chỉ khi chưa gõ | — | đang gõ → danh sách theo chữ như cũ | KHỚP |
| Danh sách ngắn | ⑤ A6 (≤ 7 mục giữ dáng cũ) | < 8 mục → không nhóm | KHỚP |
| Lưu ở đâu | [XM-4] | `localStorage` khoá `pisa-gan-day:{người dùng}:{nhóm}:{nguồn}:{tên ô}`, tối đa 3; đọc / ghi bọc try/catch, hỏng / bị chặn → không nhóm, ô chạy như cũ; 0 request | KHỚP |
| Chọn nhiều | — | thêm một người = ghi gần đây; bỏ chọn không ghi | THÊM (hiển nhiên) |
| Ô Tutor (`tutor.chi`) | — | không áp (đã có nhóm Gợi ý theo nơi dạy) | GIỮ |
| **[XM-GD]** ô `/ref/nguoi` chưa gõ chỉ tải 20 người | — | người gần đây ngoài 20 người đó không hiện ở "Gần đây" (chú thích `ponytail:` trong mã). Cần thì máy chủ nhận thêm id gần đây — PR sau, có thêm câu đọc | HỎI PTA |

## 2. Bảng thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Gõ tìm, ↑ ↓ Enter, Esc, chọn Tôi / tên ngoài / + Mở lớp mới…, chọn nhiều, ✕ bỏ chọn | có | giữ nguyên |
| Chọn lại người vừa chọn | phải tìm trong danh sách | ở nhóm "Gần đây" đầu danh sách |

Không thao tác nào bị mất.

## 3. Turso

0 câu (localStorage trên máy người dùng).

## 4. Phép kiểm

`thanhPhanChung.tests.ts` "OCHON-GAN-DAY · …": dời không nhân đôi, gần nhất trước, nhóm cũ giữ, mục không nhóm → "Khác"; ≤ 7 mục giữ nguyên; khớp id + tên; mục tắt không đưa lên; tối đa 3 không trùng; chuỗi hỏng → rỗng; phím đi theo `options` dựng từ danh sách đã xếp; localStorage bọc try/catch, theo người dùng, không gọi máy chủ. Bấm thử thật (Playwright) ở 1440 + 375.
