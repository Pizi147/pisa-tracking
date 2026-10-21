# 01 — Quyết định chủ SP 22/10 + cách chạy đợt V5

> Nguồn: brief [`00-brief-chu-sp.md`](00-brief-chu-sp.md) (chủ SP, ngày chốt 21/10, giao 22/10) + logo [`logo-pisa.png`](logo-pisa.png) + bảng tiêu chí KPI [`kpi-tieu-chi.jpg`](kpi-tieu-chi.jpg) (chỉ định hướng thông tin hiển thị, KHÔNG tính điểm KPI — C08).
> Soạn: PTA Plan, 22/10/2026.

## 1. Thứ tự nguồn từ 22/10

1. Brief 00 (mục 3 "đã chốt" C01–C23) + câu trả lời chủ SP ở mục 2 dưới.
2. Luật nghiệp vụ đã chốt và đã vào mã (`plan.md` 1.6, Rulebook §21) — ở điểm brief không thay.
3. Mã, dữ liệu, quyền hiện hành (xác minh, không tin truy vết).
4. Bộ overhaul 20–21/10 (`../2026-10-20-ke-hoach-overhaul/`) và mockup V4 (`thiet-ke/mockup-v4-*`): **tham khảo**, không còn là yêu cầu đã duyệt khi trái brief (brief mục 4).

## 2. Chủ SP trả lời 22/10 (chỗ brief chạm luật đã code)

| Câu | Chủ SP chọn |
|---|---|
| Brief mục 3 "Không dùng quy tắc MT cũ gặp `-` thì huỷ ngay" ↔ luật 4 bản sửa 21/10 đã code (#503) | **Giữ #503: MT cũ (≥ 2 tuần) `-` = huỷ ngay** (Hoàn tác 10 s, khôi phục được, lịch sử). MT hiện tại: lần 1 dời, lần 2 huỷ, đếm theo tuần — như #503. Câu trong brief KHÔNG áp. |
| Hạn việc TVV "5 ngày lịch" | **Hết 23:59 giờ VN ngày (lưu + 4)** — ví dụ lưu T2 14/09 10:00 → hết 23:59 T6 18/09. |
| Mọi câu "Cần chủ SP xác nhận / chọn" còn mở (29 câu ở mockup V4 #492 #493; câu ở PR #496, #497, #500, #501, #502, #503, #504, #505) | **Làm theo khuyến nghị** của PR / PTA, trừ chỗ brief 00 nói khác (brief thắng). |

## 3. Brief thay gì của V4 (tóm tắt — chi tiết brief mục 3–4)

- Tổng quan = **tình hình theo vai**, không còn hàng đợi + form làm việc ở giữa (thay bố cục B / Q-A2). Việc nằm ở **Công việc**.
- **TVV có menu Công việc** (thay Q-A1 ① "việc TVV ở Tổng quan").
- Hệ màu **xanh + hồng + trắng PISA** từ logo; trắng là nền đọc chính (khuyến nghị hướng 1 "PISA sáng, rõ", có thể kết hợp hướng 3). Hồng nhận diện ≠ lỗi / SOS. Dark mode chỉ là bộ token tương ứng, cùng cấu trúc.
- Báo cáo: số mở **panel dữ liệu chỉ đọc** (định nghĩa, phạm vi, tử / mẫu); không có Thêm PA / Tạo Case / Duyệt / Làm thay trong panel báo cáo (thay "panel C").
- Test: **Lịch tuần** (một tuần, chuyển tuần) gộp tình trạng chấm cho QL / Admin; bỏ tab "Tình trạng chấm" riêng. Chấm Test 4 nhóm: Quá hạn → Hạn tuần này → Bài thi Speaking tuần này (mở) → Hạn tuần sau (gập).
- Báo PH: **Đã báo PH / Chưa liên hệ được + Ngày (mặc định hôm nay) + Ghi chú**; "Chưa liên hệ được" = một lần thử, việc còn mở, giữ hạn. Kết thúc ngoại lệ (nếu nghiệp vụ có) là thao tác phụ.
- **Sau thi** một tuyến: Kết quả thi thật → Bước tiếp; lưu điểm riêng được ("Đã có kết quả · Chưa chốt bước tiếp").
- Hồ sơ lớp: xử lý việc + **đánh giá đầu ra ngay trong panel**; tách W1 / W2. HV & Lớp: W tổng + "W1 · W2" dòng phụ.
- Hồ sơ GV làm lại: **Hành chính** + **Giảng dạy – Học thuật**; Phân tích GV = một bảng hai nhóm cột.
- Mặc định 3 MT, không tự gợi ý / sinh việc MT4; QL thêm tay ở Kế hoạch Test; không xoá MT4+ đã có.
- Đổi nhãn cột lịch "Thi thật" → "Ngày thi". Badge Đạt cùng hệ với SOS; "Đã thi · chờ KQ" kiểu khác hẳn.
- Quy tắc Overall khi đánh giá GV (brief 15): Overall đạt → không tính kỹ năng dưới kỳ vọng là tạch; Overall chưa đủ dữ liệu → trạng thái riêng. Chỉ cho báo cáo / đánh giá GV, không đổi máy SOS / Case.

## 4. Cách chạy (chủ SP 22/10)

- PR mới chạy trên **session cloud** (môi trường "Pisatracking"); không mở session code local mới. Session cloud không nhắn lại được → PTA Plan rà qua PR trên GitHub.
- Đợt V5 theo brief mục 19: **A** rà soát + quyết định + hệ màu / bảng mẫu V5 → **B** mockup theo vai và tình huống T01–T22 → **C** kế hoạch triển khai. Mockup V5 nằm ở `thiet-ke/v5/`; tài liệu ở thư mục này.
- PR mockup / tài liệu: chủ SP bấm merge (chế độ Auto chặn PTA tự merge). Không code sản phẩm ở đợt A–B.
- Đang dở từ đợt 21/10: BANG-1 #505 (chụp lại ảnh cặp, chờ chủ SP) — giữ; khi hệ màu V5 duyệt, bảng mẫu và `Bang` đổi màu theo V5 ở PR sau.
- Đã tạm huỷ (dùng lại kế hoạch khi cần): SEED-UX (`claude/seed-ux-6214d7`), CHU-THI (`claude/chu-thi-fb3e30`; nhãn cột "Thi thật" → "Ngày thi" theo C21 thêm vào đây).
