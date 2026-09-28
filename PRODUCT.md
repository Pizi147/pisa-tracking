# Product

<!-- impeccable:product-schema 1 -->

<!-- Vòng phỏng vấn của impeccable init: dùng đặc tả docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md §7.1
     (chủ sản phẩm duyệt 27/09/2026) làm câu trả lời — không hỏi lại. Luật chi tiết: thiet-ke/HE_GIAO_DIEN.md. -->

## Platform

web

## Users

- **GVBM (giáo viên bộ môn):** nhập điểm và theo Case của môn mình. Làm trên laptop ở trung tâm, và trên điện thoại giữa hai
  tiết — nên thao tác phải xong nhanh, gọn trong một màn hẹp.
- **GVCN (giáo viên chủ nhiệm):** theo dõi cả lớp, xử lý vi phạm Ý thức.
- **QL (quản lý):** duyệt, nhìn toàn chi nhánh.
- **Quản trị:** cấu hình hệ thống (tài khoản, danh mục).

## Product Purpose

Theo dõi học viên IELTS Fast Track và lớp thường của Pisa: kết quả Test / Mock Test, SOS – Case – phương án hỗ trợ (PA), và Ý
thức (vi phạm, biện pháp). Luật nghiệp vụ lấy từ rule book của trung tâm (`thiet-ke/PISA-Rulebook-2026-09-19.md` và các nguồn
Ý thức trong `thiet-ke/`).

Thành công: mở màn nào cũng thấy ngay (1) điều quan trọng nhất và (2) một nút cho việc tiếp theo.

## Operating Context

- Chế độ **Operate**: người dùng đang làm việc — độ tin cậy và tốc độ quét quan trọng hơn biểu cảm.
- Toàn bộ giao diện **tiếng Việt**. Chữ theo `thiet-ke/TU_DIEN_VA_CHU.md` và `thiet-ke/THUAT_NGU_DA_CHOT.md`.
- **Nền tối là thói quen** của người dùng.
- Phải dùng được ở bề rộng **375 px** (điện thoại) và **chỉ bằng bàn phím**.
- Hai mục điều hướng chính: Tổng quan ("tôi phải làm gì bây giờ") · Học viên ("lớp tôi đang thế nào").

## Capabilities and Constraints

- **Luật "tinh tế" của chủ sản phẩm:** dấu nhỏ gọn nét mảnh (không emoji to); cột và hàng thẳng — số căn phải, mọi số và ngày
  thẳng cột; hàng cao đều; không dồn chữ (dòng phụ tối đa một dòng, không lặp thông tin).
- **Không lộ chữ máy:** không hiện ngày dạng ISO, mã nội bộ, lệnh kỹ thuật. Ngày hiện `dd/mm/yyyy`, tháng `mm/yyyy`, tuần kèm
  khoảng ngày (ví dụ `W4 SEP · 21/09 – 27/09`); giá trị gửi máy chủ luôn ISO.
- **Ngày nghiệp vụ:** "hôm nay" của web và máy chủ là ngày nghiệp vụ (bản demo có thể lùi ngày), không phải đồng hồ máy.
- **Màu không bao giờ là tín hiệu duy nhất:** mọi trạng thái có nhãn chữ.
- **Một vùng một nút chính;** thao tác phá huỷ không bao giờ là nút chính.
- **Bốn trạng thái dữ liệu** cho mọi khối đọc dữ liệu: đang tải · rỗng · lỗi · không có quyền.
- Mọi hạn có loại (không hiện ngày trần cho một nghĩa vụ thời gian); phần trăm luôn kèm n/N; không hiện "Đạt" khi chưa đủ điểm.
- Không có thao tác nào chỉ hiện khi rê chuột.

## Brand Commitments

- Tên sản phẩm: **Pisa Tracking**. (Đầu trang web hiện vẫn ghi tên cũ "PISA Progress".)
- Giữ **nền xanh mực** đang có.
- Giữ **thang mức SOS vàng / cam / đỏ** (SOS 1 / 2 / 3; chủ sản phẩm chốt 26/09/2026).
- Giữ **4 màu điểm** (dưới kỳ vọng · bằng kỳ vọng · vượt kỳ vọng · chưa đủ dữ liệu), chỉ dùng cho điểm số.
- Giữ **khuôn `KhungPanel`**: một khung panel bên cho mọi form.

## Evidence on Hand

- Luật và chữ đã chốt: `thiet-ke/HE_GIAO_DIEN.md`, `thiet-ke/TU_DIEN_VA_CHU.md`, `thiet-ke/THUAT_NGU_DA_CHOT.md`,
  `thiet-ke/HOP_DONG_SO_LIEU.md`.
- Mockup đã duyệt: `thiet-ke/mockup/` (01 → 22).
- Dữ liệu trong bản demo là **dữ liệu giả**. Không bịa lời chứng thực, số liệu hay tên thật của học viên.

## Product Principles

1. **Tinh chỉnh thế giới đang có, không thiết kế lại.** Mọi thay đổi bổ sung vào bộ đang dùng, không dựng hệ thứ hai.
2. **Việc tiếp theo trước tiên.** Mỗi màn trả lời "điều gì quan trọng nhất" và "bấm gì tiếp" trước mọi thông tin khác.
3. **Nhanh và đáng tin hơn đẹp.** Không chuyển động trang trí, không gradient, không card lồng card.
4. **Panel bên trước modal.** Không mở modal khi panel bên là đủ.
5. **Màu có nghĩa, không theo khu.** Không đặt màu mới cho từng khu; màu chỉ mang nghĩa (điểm, mức SOS, trạng thái), luôn kèm chữ.

## Accessibility & Inclusion

- Dùng được chỉ bằng bàn phím; focus luôn thấy được.
- Ô bấm tối thiểu 44 px trên điện thoại.
- Chữ đạt tương phản tối thiểu 4.5:1 trên mọi nền (có phép kiểm đọc token màu).
- Ảnh chụp chuyển sang xám vẫn đọc được mọi trạng thái.
