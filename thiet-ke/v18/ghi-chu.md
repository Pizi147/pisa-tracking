# v18 — mockup HS1 · HS2 · CV6 (chờ chủ SP duyệt)

Nguồn: audit 08/11 (`docs/superpowers/specs/2026-11-08-audit-ui/bao-cao.md` dòng HS1, HS2, CV6) → `plan.md` "Việc để sau — [XM] từ #1240–#1242" (4), (5) → chủ SP 10/11 "HS1, HS2, CV6 VẪN LÀM".
Ảnh "trước" chụp từ main `d8dec605f` (seed demo, hôm nay 14/09/2026). Không đổi luật nghiệp vụ, không thêm đọc máy chủ.

| Tệp | Màn | Mục |
|---|---|---|
| `ho-so-hv.html` | Hồ sơ HV (`DiemDau` trong `HanhTrinhKyNang.tsx`, `TienDoTrenLop.tsx`, lưới hai cột `StudentDetailPage.tsx`) | HS1, HS2 |
| `cong-viec-dai-nhom.html` | Công việc — dải gập `DaiNhom` (`DanhSachViec.tsx`; dùng ở `HoTroHocVienTab.tsx` NhomGap, DaBoQua) | CV6 |

## Truy vết yêu cầu → khung

| Yêu cầu (audit) | Khung | Kết quả |
|---|---|---|
| HS1 — ghi "MT3 · W2 SEP" một lần trên dải; Overall giữ "kỳ vọng 7.0"; 375 hết cắt "kỳ vọn…" | A1, A2, B1, B2 | dòng "Mock Test gần nhất · MT3 · W2 SEP"; 5 thẻ kỹ năng không dòng phụ |
| HS1 — thẻ khác nguồn | C2 | thẻ S "từ MT2" đậm (không chữ "vắng" — HSL-GON 05/11) |
| HS1 — em chưa có MT | C3, C7 | "Chưa có điểm Mock Test", thẻ "—" (thay 6 lần "chưa có điểm") |
| HS1 — đã thi / lớp thường | — | GIỮ như web (bảng D) |
| HS2 — Tiến độ rỗng thu thành một dòng (M7) | A2, B2, C4 | một dòng hết bề ngang; Case lấy cả hàng; 375 Case trước |
| HS2 — ghi từ dòng rỗng | C1, C6 | form cũ mở tại chỗ trong khung đó |
| CV6 — chevron 16 cạnh tên, cả dải bấm được | A1, A2, B1, B2, C1–C3 | chevron sau tên / chip, xoay khi mở; cả dải một nút; ⓘ bấm riêng |
| CV6 — biểu tượng | A1 | Lớp tôi dạy = bảng lớp (đã có trong mã); Yêu cầu của tôi = phiếu gửi |

## Đề xuất kèm (nhỏ, bỏ được nếu chủ SP không muốn)
- Lớp tôi dạy mở trong dải: bỏ tiêu đề lặp "Lớp tôi dạy" bên trong (giữ ⓘ + Fast Track | Lớp thường).

## Ngoài phạm vi, thấy khi chụp ảnh (chưa sửa)
- Hồ sơ HV (em Chu Nhật Minh, 1440): thẻ việc "Ghi kết quả PA · Reading" — nút "Ghi kết quả PA" đè lên dòng chữ PA (ảnh `anh/truoc-hs-hai-cot-1440.png`).
