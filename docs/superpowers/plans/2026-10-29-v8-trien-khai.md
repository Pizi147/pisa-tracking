# Kế hoạch triển khai V8 — chủ SP duyệt mockup 29/10

## Chủ SP 29/10 (nguyên văn ý)
- "Mockup màu sắc và bố cục **rất ok**" — duyệt 4 mockup `thiet-ke/v8/` (#688): Hồ sơ lớp, Tổng quan, Công việc QL, Phân tích.
- Web phải **bắt chước khớp hình ảnh càng gần càng tốt**, nhất là **màu, shading, quan hệ giữa background — nền khối — các thành phần thông tin**.
- Menu ⋯ hàng học viên sắp lại: **+ Case · + Ghi vi phạm · Xác nhận xử lý · Nhập điểm {đợt}** │ vạch │ **Sửa thông tin · Chuyển lớp… / Đề xuất chuyển lớp…** — không cần mockup.
- 13 câu hỏi trong `thiet-ke/v8/README.md` chưa trả lời riêng → làm **đúng như mockup đang vẽ** (mockup đã duyệt thắng — CLAUDE.md mục 2); câu nào mockup chưa vẽ thì giữ web hiện tại.

## Luật áp mọi PR dưới
- HÌNH ẢNH theo v8 SÁT (màu, nền, viền, bóng / tầng nền `bg → surface → surface-2`, độ đậm, cỡ chữ, khoảng cách, 4 tầng phân cấp); TÍNH NĂNG giữ đủ (bảng thao tác TRƯỚC → SAU trong `-ghi-chu.md` của từng mockup — chỉ dời chỗ, không bỏ).
- Một màn một PR · ảnh cặp toàn trang mockup v8 | web (1440 tối + 375 sáng, cùng vai, đặt cạnh nhau, zoom từng khối) · cổng ≥ 90 % KHỚP · chủ SP duyệt ảnh cặp trước merge (PR đổi bố cục).
- Critique mỗi PR mục tiêu ≥ 35/40 (cổng 28/10). Kiểm nhanh theo `pisa-slot/KIEM-NHANH.txt` (+ 6 tệp luật giao diện).

## Thứ tự PR đề xuất
| # | PR | Phạm vi | Ghi chú |
|---|---|---|---|
| 0 | **NEN-V8** (làm trước, nhỏ) | Đo token mockup v8 (`v5-nen.css` + `v7/bang-mau-moi.css` mà v8 dùng) với `web/src/index.css` + Tailwind: nền trang, nền khối, nền ô phụ, viền, bóng, chữ phụ — ở tối và sáng; sửa lệch ở token chung (một chỗ áp mọi màn) | đo bằng `getComputedStyle` trên mockup và web cùng khối; ảnh cặp 4 màn |
| 1 | **MENU-DONG** (nhỏ, không mockup) | `shared/domain/hocVienLop.ts` `mucMenuDongHocVien`: thứ tự Case → Vi phạm → Xác nhận xử lý → Nhập điểm │ Sửa thông tin → Chuyển lớp / Đề xuất chuyển lớp / việc hiếm như cũ | vạch ngăn `MUC_MENU_DONG_HIEM` giữ; kiểm phép kiểm khoá thứ tự (prHvl…) |
| 2 | **V8-HSL** Hồ sơ lớp | `thiet-ke/v8/ho-so-lop.html` + `-ghi-chu.md` | nối tiếp #687 (thẻ 375 đã có) |
| 3 | **V8-TQ** Tổng quan | `thiet-ke/v8/tong-quan.html` (QL · GV · TVV) | `LopToiDay` độ rộng cột có phép kiểm EN (TEN-CHI-SO, R1-EN-2) |
| 4 | **V8-CV** Công việc QL | `thiet-ke/v8/cong-viec-ql.html` | "Chờ bạn duyệt" vào cột trái; QL mặc định giữ "Tất cả" như mockup |
| 5 | **V8-PT** Phân tích | `thiet-ke/v8/phan-tich.html` (6 tab) | tên tab "Kết quả Test / Thi thật" giữ như mockup (câu 4 chưa trả lời) |

PR 2–5 khác màn → chạy song song được (≤ 2 PR giao diện cùng lúc, Q-2), sau khi #676–#687 merge (cùng tệp).
