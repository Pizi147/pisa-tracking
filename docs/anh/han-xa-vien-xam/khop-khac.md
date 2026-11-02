# HINH-HAN-XA-1 — hạn xa = viên xám (`ChipHan`)

Nguồn: mockup v7 `thiet-ke/v7/cong-viec-2.html` `.td` (hạn xa) · `.td.sap` / `.td.qua` (gần / quá hạn). Chủ SP quyết 02/11 (plan.md "02/11 khuya").
Sửa một chỗ `web/src/ui/Nhan.tsx` `ChipHan` → 34 nơi dùng (Công việc, panel việc, hồ sơ HV, Chờ duyệt, Ý thức, Chấm Test, số liệu…) đổi theo.

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần | Web | Ảnh | Kết quả |
|---|---|---|---|---|
| `#manA` 1440 tối | viên hạn xa "hạn 21/09" | `ChipHan` hạn > 3 ngày | `cong-viec-gv-1440-toi.png`, `zoom-*.png` | KHỚP |
| `[data-k=b1]` 375 sáng | viên hạn dưới tên việc | như trên, 375 | `cong-viec-gv-375-sang.png` | KHỚP |
| `.td.sap` / `.td.qua` | viên ⚠ vàng / đỏ | giữ như cũ (chỉ đệm 8 → 9 px theo mockup) | như trên | KHỚP |
| `.td.sap.nay` (viền trong "hôm nay") | — | GIỮ như cũ (không vẽ viền, ngoài phạm vi việc) | — | KHÁC (giữ) |

Đo kiểu tính (Playwright, cùng chế độ tối): mockup `22px · 0 9px · rgb(23,36,64) · rgb(186,198,222) · 12px · 600` = web `22px · 0 9px · rgb(23,36,64) · rgb(186,198,222) · 12px · 600`.

**KHỚP: 6 / 6 thuộc tính viên hạn xa = 100 %** (cao, đệm, nền, màu chữ, cỡ, độ đậm). Phần còn lại của màn Công việc không chạm.

## Thao tác trước → sau

| Thao tác | Trước | Sau |
|---|---|---|
| Đọc hạn xa | chữ phụ "hạn 18/09" | viên xám "hạn 18/09" (cùng chữ, không chỉ bằng màu) |
| Rê chuột xem hạn đủ | `title` | `title` (giữ) |
| Hạn gần / quá hạn | viên ⚠ vàng / đỏ | giữ |

Không mất thao tác nào (chỉ đổi hình). Không đổi dữ liệu, không thêm request.

## Viên trong dòng chữ (PTA hỏi 03/11)
- `trong-dong-cho-duyet-1440-toi.png` (QL, Công việc › Yêu cầu): viên ở cột hạn, không lệch dòng chữ hai bên.
- `trong-dong-ho-so-hv-1440-toi.png` (GV, hồ sơ HV, đầu thẻ Case): viên cao 22 px cạnh tiêu đề 24 px, căn trên — thẳng hàng.
