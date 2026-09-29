# Việc nhỏ còn lại sau rà đợt 2 (29/09/2026)

Ghi lại mọi phát hiện Minor của người rà PR #117–#121 mà chưa PR nào làm, kèm PR nhận. Session planning soạn kế hoạch PR nhận thì đọc bảng này. Dòng "(đã giao)" là đã làm trong PR gốc.

| Nguồn | Việc | Giao |
|---|---|---|
| Rà #117 lần 2 | Thẻ Xin ý kiến sau "Bổ sung": câu cũ + mới dính một dòng → `whitespace-pre-line` phần lý do | PR-UXF |
| Rà #117 lần 2 | `duyetNhieu`: id sai định dạng → 400 trước 403 (không lộ dữ liệu) | PR-Dọn |
| Rà #117 lần 2 | `apDungCaLop` vế `d.toClass.ft ||` nhận target cả FT→FT (vô hại: chỉ QL/QT gọi) — ghi chú, không sửa | PR-Dọn |
| Rà #117 lần 2 | GVCN vẫn gửi `thangThi` khi chuyển FT→FT — planning coi là cố ý (chỉ rút target + lộ trình) | — |
| Rà #117 lần 1 | Dải Tổng quan QL chưa theo bộ lọc chi nhánh/chương trình (đã ghi thân PR #117) | PR-UXF |
| Rà #118 lần 2 | NganXepHangLoat.tsx:249 — Pre FOU hai ô tích trùng ("Chọn Tổng hợp" + "Tổng hợp") → ẩn ô "Chọn …" khi ky.length === 1 | PR-MON lúc gộp (đã giao) |
| Rà #118 lần 2 | KeHoachTestTab.tsx:113-116 — "Luật xếp lịch Test" cứng L/R/W/S + "W = W1 + W2" ở tab Lớp thường | PR-MON lúc gộp (đã giao) |
| Rà #119 lần 2 | Thông báo duyệt `duyet/yeuCau.ts:177-179` còn "QL đã duyệt / QL từ chối / QL đã trả lời" → viết đủ "Quản lý" | PR-UXF (hoặc PR-SOS nếu chạm file) |
| Rà #119 lần 2 | Bảng HV lớp: em có MT lịch sử ghi "Chưa có kết quả" nhưng hàng điểm hiện MT2 lịch sử ▼5.0 đỏ — ngược nghĩa; điểm lịch sử nên xám / có nhãn `lịch sử` | PR-HVL |
| Rà #119 lần 2 | `moTaDoiLan2` (absence.ts:176) chỉ còn phép kiểm dùng; `decideAbsenceMove` không chặn lượt lịch sử (chưa có đường vào) | PR-Dọn |
| Rà #120 | 🔴 Thêm 35 em FT = 1935 câu SQL (~55/em, do taoMtMacDinh/apLichMacDinh) → Turso quá hạn giờ, cả lô thất bại | PR-TOC (sau MON), giao session MT |
| Rà #120 | Năm không cận (ngày sinh 01/01/1000, tuần 9999 tạo tuần năm 9998) | PR-TOC |
| Rà #120 | Thêm vào lớp ngoài phạm vi trả 200 · 0 em, lỗi rỗng → 403 | PR-TOC |
| Rà #120 | `fullName` dạng object → 500 (có từ trước) | PR-TOC |
| Rà #120 | updateCycle đổi Thi dự kiến ngày → tháng qua API giữ exam_period_id cũ (giao diện luôn gửi tuần) | PR-Dọn |
| Rà #120 | "Đã thi tới MT" = 6 với tuần khai giảng: MT3–6 xếp tuần hiện tại/tương lai, chỉ báo 2 MT lịch sử → nên nhắc lùi tuần bắt đầu | PR-XLMT |
| Rà #120 | Toast "Đã đọc 4 dòng" che nút "Thêm n học viên" vài giây | PR-UXF |
| Rà #118 lần 3 | mywork `lopMap`: `allProgrammes()` chỉ lấy chương trình active → lớp thuộc chương trình đã ngưng không xác định khung (câu cũ LEFT JOIN không lọc) | PR-Dọn |
| Rà #118 lần 3 | `openMoveRequests` (GET /api/move-requests) lỗi "no such column s.code" (đã ghi #119) | PR-Dọn |
| Rà #121 | Ngày sinh năm 0208 báo "Ngày không có thật" thay câu cận năm (vẫn chặn đúng ô) | PR-Dọn |
| Rà #121 | Lớp thường khai giảng trước (năm nay − 3) → tuần mặc định cả lô báo lỗi dòng 0 (rất hiếm) | PR-Dọn |
| Rà #121 | Đo thật Thêm HV 35 em + chuyển cả lớp 32 em trên DB THỬ Turso (ước 1–6 s) — cần chủ sản phẩm đồng ý | trước deploy |
| Rà #121 lần 2 | cycles.ts:160-173 — lộ trình cũ ngoài khoảng năm có exam_date nhưng exam_period_id rỗng/lệch: gửi lại đúng examDate cũ vẫn 400 → chỉ kiểm examPeriodId khi examDate đổi (chưa gặp được; DB reset) | PR-Dọn |
