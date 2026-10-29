# Khối 2 — Mockup v10: panel có thông tin + bảng em gọn (bước 1, trước code)

Đặc tả đã duyệt: `docs/superpowers/specs/2026-10-30-dot-toc-do-panel-design.md` khối 2 + mục 5b ý 2, 4.
Sau khi chủ SP duyệt mockup → PTA soạn kế hoạch code (máy chủ `rowsFor` + panel chung trước, rồi từng màn).

## Prompt (dán vào session mới, tên "PANEL-V10", local, Opus 5.5 effort medium)

```
Bạn là session soạn MOCKUP "PANEL-V10" của PISA Tracking (repo D:\Github\Pisa-tracking). Không viết mã sản phẩm.
Worktree: .claude/worktrees/panel-v10 (từ origin/main), nhánh claude/panel-v10. Không Fable. /ponytail lite đầu phiên. Skill: impeccable (shape, critique), karpathy-guidelines.

Đọc trước: CLAUDE.md (đặc biệt "Dòng đọc Turso", luật giao diện, "Nâng cấp không chép mockup") · DESIGN.md · plan.md 1.6 (N26–N30)
· docs/superpowers/specs/2026-10-30-dot-toc-do-panel-design.md (khối 2, mục 5b ý 2 và 4 — ĐÃ DUYỆT) · thiet-ke/v8/*.html (nền, màu, panel hiện hành — học sát hình ảnh)
· web/src/ui/SoLieu.tsx (NganDanhSach, DiemDong — panel "Đạt Test · lớp" hồ sơ GV là mẫu đang ổn) · server/src/worklist/metrics.ts (rowsFor)
· web hồ sơ lớp, bảng em (BANG-EM-GON: quá nhiều ô màu — ảnh chủ SP 29/10: SOS đỏ, từng ô điểm kỹ năng đỏ, hạn đỏ, WL, Dự kiến).

Làm: thiet-ke/v10/panel-thong-tin.html (+ thiet-ke/v10/panel-thong-tin-ghi-chu.md), 1440 + 375, tối + sáng, dữ liệu giả thật (tên Việt, mã tuần W2 OCT):
1. Mẫu DÒNG HV có điểm dùng chung: "Tên · MT3 · W2 OCT · L 6.0 · R ▼5.0 · W ▼5.5 · S 6.5 · Overall ✗ 5.5 / KV 6.5" — chỉ tô kỹ năng dưới kỳ vọng TỪNG KỸ NĂNG của chính lượt
   (thi thật: so Target), dấu ▼ (không chỉ màu), "tạm" khi lượt chưa chốt, ẩn lớp khi tiêu đề panel đã có lớp; biến thể lớp thường (% từng môn, ▼ môn trượt); thiếu kỹ năng (—).
2. Panel tiêu biểu dùng mẫu đó: SOS 2 · lớp · Đạt MT · lớp (tab Chưa đạt · Đạt) · Bài quá hạn nhập điểm ("MT2 · R · thi W2 OCT · ⚠ quá 6 ngày · Hà chấm", không lặp tên) ·
   Tiến bộ kỹ năng (chip ▲ Tăng / ▼ Giảm đầu dòng) · Panel một em (hộp "Vì sao SOS" có số) · Cần bổ sung đánh giá ("n PA chưa có kết quả ⓘ") · Xét lại lộ trình (khối "Khi lưu" 1 dòng + ⓘ).
3. Panel duyệt Công việc QL (v8): chân Lưu / Duyệt dính · "Lịch sử · n" · chip SOS ở "Chờ bạn duyệt".
4. Bảng em hồ sơ lớp gọn (BANG-EM-GON): chỉ việc cần làm có màu; điểm kỹ năng chữ thường, chỉ tô kỹ năng hụt; chip SOS nhỏ; GIỮ mọi cột / thao tác hiện có (⋯, Nhập điểm, việc).
4b. Đề xuất chủ SP 30/10 (vẽ để chủ SP xem, không phải luật):
   - Trang Học viên & Lớp (bảng chính): cột "Việc" HẸP hơn và lùi về bên phải, để các cột thông tin (tên, điểm, SOS…) giãn ra.
   - Hồ sơ lớp, bảng em: tên TVV của em ghi NHỎ, MỜ (chữ phụ text-faint) ngay dưới tên HV — dễ nhìn mà không tranh chỗ; em chưa có TVV → không ghi gì.
     Dữ liệu: `students.consultant_user_id` → tên người dùng — JOIN trong câu danh sách em đang có, 0 câu thêm (ghi vào ghi-chu.md).
5. Trạng thái: đủ điểm · thiếu kỹ năng · lượt tạm · rỗng · lỗi tải (dải .bao-loi v8) · danh sách dài (≥ 20 dòng) · 375.
Mỗi panel ghi trong ghi-chu.md: dữ liệu từng dòng lấy từ đâu (hàm máy chủ hiện có) và ƯỚC DÒNG ĐỌC thêm (0 khi vẽ ô số; ≤ ~4 câu khi mở panel ở trang khác Tổng quan) — vượt thì cảnh báo.
Cổng: impeccable critique ≥ 35/40 (chạm 30 thì tối đa 2 vòng nữa, rồi chỉ cần không P0/P1). Câu hỏi cho chủ SP gom ở đầu ghi-chu.md (≤ 5, có khuyến nghị).
Xong: commit + mở PR "MOCKUP-V10 (chờ chủ SP duyệt)", KHÔNG merge; Artifact xem được (Artifact tool) gửi link; nhắn "PTA Plan" (SendMessage) đường PR + link + điểm critique + câu hỏi.
```
