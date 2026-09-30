# Việc nhỏ còn lại sau rà đợt 2–5 (cập nhật 01/10/2026)

Mọi phát hiện Minor của người rà PR #117–#143 chưa PR nào làm, kèm PR nhận. Kiểm kê đầy đủ trước đợt 6: 2026-10-01-kiem-ke-truoc-dot-6.md.

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
| Rà cuối đợt 3 A | Seed PA 15 hạn ghi kết quả rơi Chủ nhật 20/09 → migrate R-PA5 dời lại mỗi DB mới | PR-Dọn |
| Rà cuối đợt 3 A | PATCH /cycles đổi target (chỉ API) không ghi lịch sử đổi target, không đòi lý do (có từ trước) | PR-Dọn |
| Rà cuối đợt 3 B | Dòng em sau khi QL từ chối vẫn ghi "2 vi phạm / 2 tuần" (board.ts / ClassYThucCard) — dễ hiểu nhầm | PR-UXF |
| Rà cuối đợt 4 HVL | Demo H1 thiếu "Case chung" (reportIssue bắt buộc kỹ năng; hàng "Chung" chỉ có phép kiểm thuần) | PR-Dọn |
| Rà cuối đợt 4 HVL | Ô hạn hiện "hết T2 14/09", kế hoạch ghi "hạn hết T2" — chữ đủ chỉ ở tooltip | PR-UXF |
| Rà cuối đợt 4 HVL | Việc Nhập điểm quá hạn đỏ ở cột Việc tiếp theo của GV nhưng em không vào chip Cần làm (theo Q3) — dễ hiểu nhầm | PR-VAI |
| Rà cuối đợt 4 HVL | Trần tốc độ nâng: /classes/6/transition 37 (dự kiến 33), chuyenCaLopSangFT 200 (+23 %) — planning chấp nhận | — |
| Rà cuối đợt 4 XUAT | nav.ts gọi phamViXuatMt: GV thêm 1 câu SQL mỗi lần tải phiên | PR-Dọn |
| Rà cuối đợt 4 SANG | Hạn (ui/Han.tsx) + "Chờ 4 kỹ năng" + "SOS 1 tạm thời" 11 px, E4 muốn 12 px — kế hoạch SANG chọn A (giữ 11 px) | chủ sản phẩm nếu muốn đổi |
| Rà cuối đợt 4 SANG | 375 px: ô tìm bị ép "Tìm học", tên tài khoản cắt "Nguyễn K…" | PR-UXD |
| Kế hoạch VAI-a 01/10 | VAI-a bỏ việc GVCN "Ghi lộ trình tiếp theo" (Q30-1). Badge "chưa có lộ trình tiếp theo" ở hồ sơ lớp (`classes.ts:91-106`, `loTrinhTiep.ts:220`) còn đúng không, hay cũng bỏ / đổi chữ theo lệnh chuyển lớp của QL | PR-Dọn |
