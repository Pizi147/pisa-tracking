# MON-CT-1311 — Quản trị sửa Môn mọi chương trình lớp thường

Không đổi bố cục: chỉ thêm thao tác vào ô Môn sẵn có của panel Sửa chương trình (mẫu chip + "+ Môn" của "+ Chương trình") và dùng hộp xác nhận chung (RKC, 409 `canXacNhan`).

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Sửa Môn chương trình gốc (FOU, BE, ELE, PET, KET) | Chỉ đọc | Sửa được: bỏ (×), thêm (+ Môn), đổi thứ tự (‹) |
| Sửa Môn chương trình Quản trị tạo, đã có lớp | Chỉ đọc | Sửa được như trên |
| Sửa Môn Pre FOU / FT | Chỉ đọc | Chỉ đọc + lý do dưới ô ("Pre FOU một ô Tổng hợp, GVCN dạy luôn — không đổi môn." / "Fast Track giữ L · R · W1 · W2 · S.") |
| Lưu Môn khi có lớp đang học | — | Hộp xác nhận: "n lớp đang học · m bài Test chưa có điểm sẽ đổi môn [· phân công cần chọn lại ở k lớp]. Bài đã ghi giữ môn cũ. Lưu môn mới?" — Đóng = không lưu |
| Chỉ đổi thứ tự môn | — | Lưu thẳng, không hỏi (lượt / phân công không đổi) |
| Nhật ký | Lưu chương trình ghi `programme_updated` | Thêm `mon` trước → sau + số lớp / bài đổi / bài giữ / lớp chọn lại GV |
| Tên, Đạt từ, Độ dài, Mốc Test, Còn dùng, + Chương trình | như cũ | như cũ (không mất thao tác nào) |
| QL xem tab Chương trình | Chỉ xem | Chỉ xem; PUT → 403 |

## Ảnh

- `sau-panel-pet-1440.jpg` · `sau-panel-pet-375.jpg` — panel PET: Môn L+S · R+W, sửa được.
- `sau-hop-xac-nhan-1440.jpg` — đổi PET sang L+S · R · W khi có 1 lớp đang học.
- `sau-nhap-diem-pet-1440.jpg` — Nhập điểm MB PET 01 · Checkpoint 1: hai cột L+S /60, R+W /80.
- Trước: ô Môn chỉ đọc ("L · R · W · S" với PET) — mọi chương trình gốc hoặc đã có lớp.

## Lệch / để sau

- [XM] Bàn giao chuyển lớp + Góp ý tuần đọc bộ môn chương trình GỐC (FOU / BE / ELE) theo mẫu, không theo bảng (`boMonCt`, đọc bảng = một câu mỗi em ở phiếu bàn giao — phép kiểm CT 5h). Quản trị đổi môn FOU / BE / ELE thì hai chỗ này vẫn theo mẫu cũ — làm khi chủ SP thật sự đổi môn chương trình gốc.
- Web chỉ dùng mẫu (không bảng) ở: chữ môn của dòng lớp trong Highlights Tổng quan, chữ luật ở tab Kế hoạch Test, danh sách Môn ở form Ghi vi phạm (`monViPham`). KET / PET mặc định (L+S · R+W) đúng; chương trình gốc Quản trị đổi môn thì ba chỗ này còn theo mẫu.
- "Chưa phân công" của môn mới hiện như ô trống thường ở Phân công GV (không thêm chữ / chuông riêng).
