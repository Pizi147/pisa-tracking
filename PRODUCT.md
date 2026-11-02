# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Giáo viên** (GVCN, GVBM; GV Speaking chấm chéo): nhập điểm Test, ghi "-" khi em không có bài, nhận xét W/S, xử lý Case và Phương án (PA) của học viên mình dạy.
- **Quản lý chi nhánh (QL)**: xếp và dời lịch Test (chỉ QL lo Test), duyệt yêu cầu, nhắc việc GV, quyết định Cuối khoá / lộ trình tiếp theo.
- **Quản trị**: như QL trên toàn hệ thống, quản lý tài khoản, quyền.
- Dùng chủ yếu trên **máy tính ở trung tâm, trong giờ làm việc**; điện thoại để tra nhanh (vẫn phải dùng được ở 375 px).
- Học viên / phụ huynh **không** dùng PISA.

## Product Purpose
Theo dõi tiến bộ học viên một trung tâm IELTS: lịch Test, điểm, SOS, Case học thuật và PA, Ý thức (vi phạm / biện pháp), chuyển lớp và lộ trình.
**Thành công = không em nào bị bỏ sót**: mỗi em có lịch Test, có điểm, có Case/PA khi tụt; hệ thống nhắc đúng người, đúng hạn.

## Positioning
Công cụ làm việc nội bộ (chế độ Operate) thay sổ điểm và bảng tính rời rạc: luật nghiệp vụ của trung tâm (SOS, Case, hạn, dấu "-") đã nằm sẵn trong hệ thống, người dùng chỉ làm việc của mình.

## Operating Context
- Hai chương trình: **Fast Track (FT)** — Mock Test `MT{n}`, Overall và kỳ vọng; **Lớp thường** — Progress Test / Final Test, đếm theo môn.
- Nhiều chi nhánh; tuần T2→CN, thuộc tháng chứa thứ Năm; thời gian trên màn ghi bằng **mã tuần** `W2 OCT` (ngày chỉ cho hạn cụ thể, ngày thi, ngày sinh, nhật ký).
- Luật nghiệp vụ: `thiet-ke/PISA-Rulebook-2026-09-19.md` (mục 20 ưu tiên). Kế hoạch và quyết định: `plan.md`.
- Bản chính chạy Netlify + Turso.

## Capabilities and Constraints
- Thuật ngữ cố định: SOS, Case, PA, Mock Test / MT, Progress Test, Final Test, Lộ trình, Ý thức, Chờ duyệt, Phối hợp.
- Chữ trên web ngắn: nhãn 1–3 từ, không thêm câu giải thích dưới nút/ô; tiếng Anh hoặc nửa Anh nửa Việt khi tự nhiên hơn. Bản tiếng Anh cho GV nước ngoài sẽ làm sau (PR-EN).
- Ô nhập ngày ở mọi nơi: ô gõ được + nút lịch (`ONgay`); không làm hàng nút "Hôm nay · Hôm qua…".
- Quyền kiểm ở máy chủ; giao diện chỉ ẩn bớt.

## Brand Commitments
- Tên: **PISA Progress**. Không logo / khẩu hiệu bắt buộc.
- Giọng: tiếng Việt đơn giản, thẳng, như đồng nghiệp nói với nhau; không văn mẫu, không cảm thán.

## Evidence on Hand
- Mockup đã duyệt: `thiet-ke/mockup-*.html`.
- Không có khách hàng, số liệu công khai hay lời chứng thực — không bịa.

## Product Principles
1. **Không em nào bị bỏ sót**: mọi việc còn thiếu (chưa lịch, chưa điểm, chưa PA, quá hạn) phải hiện ra cho đúng người và nhắc đúng hạn.
2. **Nghĩ tới đầu ra trước**: việc không đổi đầu ra (em có lịch, có điểm…) thì không thêm bước, câu hỏi, trạng thái hay điều kiện chặn.
3. **Workflow gọn, làm tại chỗ**: thao tác xong ngay nơi đang đứng (hộp, panel, menu ⋯) — hạn chế chuyển qua trang khác; không để người dùng kẹt.
4. **Làm điều hiển nhiên, không hỏi lại** (vd đổi mốc lớp thì bài dời theo).
5. **Sửa trên nền có sẵn, không làm lại**: nhất quán với màn đã có trước khi thêm cái mới.

## Accessibility & Inclusion
- Chữ không nhỏ hơn 11 px; vùng bấm ≥ 44 px trên điện thoại.
- Màu trạng thái luôn kèm chữ/ký hiệu (quá hạn luôn có ⚠), đủ tương phản ở cả sáng và tối.
