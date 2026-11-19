# S4-LUAT phần 3 — N56 ① + đề xuất 2 (chủ SP 20/11)

Không mockup mới (bỏ một bước, dùng lại form + dải làm thay sẵn có — plan.md 1.3b). Ảnh: `truoc/` | `sau/`, 1440 tối + 375 sáng, tài khoản demo Head Monbay (id 2),
việc mẫu "Ghi kết quả PA · Reading" của GV Trần Ngọc Hà (`/cong-viec?nguoi=tat-ca&viec=action:45`).

| Ảnh | Nội dung |
|---|---|
| `truoc/n56-1-lam-thay-*` | Trước: mở việc của GV khác → TÓM TẮT chỉ đọc + nút "Làm thay" |
| `truoc/n56-1-sau-bam-lam-thay-*` | Trước: phải bấm "Làm thay" mới ra form |
| `sau/n56-1-lam-thay-*` | Sau: mở việc → FORM ngay (dòng loại "Làm thay · Case học thuật") |
| `sau/n56-1-lam-thay-dai-*` | Sau: đầu thân panel có dải "Bạn đang làm thay Trần Ngọc Hà. · Chỉ xem" |
| `sau/n56-1-chi-xem-*` | Sau: bấm "Chỉ xem" → tóm tắt như cũ, nút "Làm thay" mở lại form |

## Bảng thao tác TRƯỚC → SAU

| Ai · việc | Trước | Sau |
|---|---|---|
| Head mở việc của GV khác, làm thay được | Tóm tắt → bấm **Làm thay** → form (2 bước) | Form ngay + dải làm thay (1 bước) |
| … muốn chỉ xem | Mặc định là xem | Bấm **Chỉ xem** ở dải → tóm tắt (nhớ theo việc đó) |
| … ở tóm tắt muốn làm | Bấm **Làm thay** | Giữ: bấm **Làm thay** |
| Head mở việc không có quyền làm thay | Tóm tắt + "Chỉ {ai} hoặc Head làm được" | Giữ nguyên |
| Việc của chính mình | Form, không dải | Giữ nguyên |
| Nhập điểm / Chấm Speaking của người khác | Mở thẳng lưới (CV-SUA-1011) | Giữ nguyên |
| Head điền thay bàn giao (phiếu GV đổi / phiếu chuyển lớp) khi người được giao còn hạn | Hỏi "Head vẫn điền thay?" ở MỖI ô lưu | Hỏi **một lần** cho phiếu đang mở; đóng panel mở lại thì hỏi lại |

Không mất thao tác nào. Quyền máy chủ không đổi (máy chủ vẫn kiểm `canXacNhan` từng lần; web chỉ gửi kèm mã đã đồng ý). Nhật ký vẫn ghi người làm thay.

## Ghi nhận (không sửa trong PR này)
- Panel Case tự cuộn tới form PA đang mở, nên dải "Bạn đang làm thay" nằm trên vùng nhìn (cuộn lên là thấy); dòng loại "Làm thay · …" luôn thấy ở đầu panel.
  Muốn dải luôn hiện → chuyển `cvNgoai.dai` lên phần đầu cố định của `KhungPanel` (thành phần chung, đổi mọi panel Công việc) — để PTA quyết.
