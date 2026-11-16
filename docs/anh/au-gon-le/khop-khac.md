# AU-GON · PR3 LE — khớp / khác

Ảnh SAU (demo, 1440): `sau-a307-khong-quyen-1440.png` (TVV gõ /test) · `sau-a218-dau-trang-ql-1440.png` (QL, "+ Lớp") · `sau-b310-viet-mo-san-panel-1440.png` (GVCN 7, panel viết mở sẵn). TRƯỚC chỉ là chữ: A3-07 về trang đầu im lặng; A2-18 menu ⋯ một mục; B3-10 bảng không panel nào mở (ảnh audit `anh/b3` 06). Phần còn lại (A2-13, A2-26, B2-08, B2-11) không đổi hình có thể chụp.

| Mã | Thay đổi | Mockup |
|---|---|---|
| A3-07 | Đường lạ / vai không có quyền (`/test`, `/phan-tich`, `/cong-viec`, `/quan-tri`, `/nhap-diem…`, mọi `*`) → MỘT màn dải trung tính: "Không có quyền · Trang này dành cho: {vai}." hoặc "Không thấy · Địa chỉ này không có trang nào." + "Về trang đầu ›". `/tutor/*` vẫn về trang đầu (Tutor ẩn, chủ SP 22/10) | KHỚP dáng 403 của hồ sơ HV |
| B2-08 | HV & Lớp chỉ gọi `/my-work` khi `session.nav.workSupport` (cờ badge). Head tutor / CX: không gọi, không chip "!" (đo: Head tutor 0 lần `/my-work`, trước 1 lần 403) | — |
| A2-13 | Lưới Điểm lớp thường (QL): nút chỉ hiện khi còn em có ít dòng hơn số mốc chương trình; đổi tên "Tạo bài còn thiếu". Lớp rỗng giữ "Tạo bài kiểm tra theo chương trình" | — |
| A2-18 | HV & Lớp 1440: bỏ ⋯ một mục → nút "+ Lớp" cạnh "+ Thêm học viên"; 375 giữ ⋯ (Xuất · Thêm · + Lớp mới). **Mockup ⑥ K2 sửa:** `hoc-vien-lop.html` (7 đầu trang 1440) + `hoc-vien-lop-ghi-chu.md` | sửa mockup |
| A2-26 | Ô chọn GV cho một môn: "Dạy được {môn} · {CN}" trước, "Chưa có kỹ năng {môn}" sau; không còn trộn trong "GV khác". **Chưa:** bỏ tài khoản không có vai GV (QL) — máy chủ `teacherCandidatesBranch` cố ý gồm QL (kiêm GVCN) → [XM] hỏi PTA Plan | — |
| B3-10 | "Viết ›" Báo cáo PH: link thêm `&viet=1` (web) → hồ sơ lớp tự mở panel viết phần của tôi ở em đầu còn thiếu, rồi gỡ tham số. Đổi trang giữ nguyên; −1 bấm, 0 tự tìm. Không đổi JSON máy chủ | — |
| B2-11 | ĐÃ CÓ SẴN: chip "Nhập điểm · 21" mang `title` + tên đọc màn "21 bài chờ nhập điểm" (đo: title = "21 bài chờ nhập điểm") — không sửa | — |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Tạo lớp (QL, 1440) | ⋯ › + Lớp mới | nút "+ Lớp" (một bấm) |
| Tạo bài lớp thường | nút luôn hiện | chỉ khi thiếu bài |
| Viết Báo cáo PH từ việc | đổi trang, tự tìm ô "–" | đổi trang + panel viết mở sẵn |
Không mất thao tác nào.

## Turso
B2-08: −1 request (`/my-work` 403) với Head tutor / CX. Còn lại không đổi.
