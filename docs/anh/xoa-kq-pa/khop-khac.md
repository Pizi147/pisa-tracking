# Xoá một Kết quả PA — VIEC-SAU-LOGIC việc 3 (N37)

Mục theo mẫu sẵn có (⋯ của dòng PA / Case, #923) — không cần mockup. Ảnh trước | sau: `truoc-*.png` · `sau-*.png` (Lịch sử của panel Case, 1440 tối + 375 sáng), `sau-1440-da-xoa-hoan-tac.png` (toast "Đã xoá kết quả PA · Hoàn tác").

## Thao tác TRƯỚC → SAU

| Chỗ | Trước | Sau |
|---|---|---|
| Lịch sử Case · dòng Kết quả PA | không thao tác (chỉ Sửa lần gần nhất ở thẻ PA) | ⋯ → "Xoá kết quả" (cờ máy chủ `f.xoa`, cùng quyền Xoá PA) |
| Bấm "Xoá kết quả" ('ngay') | — | xoá ngay vào Thùng rác, không hỏi, toast Hoàn tác (như Xoá PA) |
| PA theo quy chế, người không phải QL ('xin') | — | bấm là gửi thẻ "Xin xoá" (Xoá kết quả PA · tên PA · dd/mm); QL Duyệt / Từ chối / Huỷ quyết định = Khôi phục |
| Kết quả GẦN NHẤT của PA | Sửa / Hoàn tác (giữ nguyên) | thêm Xoá: PA về như trước lần ghi (đợt, hạn) → việc Kết quả kỳ đó hiện lại |
| Bị chặn | — | toast nói lý do + bước tiếp: Case đã hoàn thành (Mở lại) · lần ghi đã Thay PA / có Mini Test (Sửa kết quả) · PA đang chờ QL trả lời (rút thẻ) |
| Quản trị › Đã xoá | Case · PA · Vi phạm · Tệp · Học viên | + "Kết quả PA" (khôi phục được; PA đã ghi lần mới sau lần xoá gần nhất → 409) |

Không mất thao tác nào. Sửa / Hoàn tác kết quả, Sửa PA, Kết thúc PA, Xoá PA giữ nguyên.

## Hình ảnh
- ⋯ dùng `MenuDong` sẵn có (ô 44 px điện thoại, aria-label "Thao tác khác · tên PA · dd/mm"), cột phải của dòng tiêu đề; tên + nhãn kết quả tự xuống dòng (375: nhãn xuống dòng dưới tên).
- Không đổi màu, cỡ chữ, khoảng cách.
