# Bàn giao session PLANNING — 13/10 tối (hết OV) → session planning mới (chạy local)

## Hiện trạng (đã kiểm)
- **Đã merge hết OV** tới OV-10b #363 (main `d2ef84d`+). Mọi PR đều rà + `npm run check` xanh trên bản đã gộp main trước khi merge.
- Bản chính vẫn chạy **#285**. Chưa deploy.
- `kiem-truoc-ov1b / ov3b / ov1c` đã chạy trên **bản chính** 13/10 (kết quả ở dưới).
- Còn mở: **OV-1e** (`2026-10-14-pr-ov1e-giu-lich-thi-lai.md`) — sửa migrate `prOv1b` để em đang chờ thi lại giữ lịch thi lại. **Phải merge trước deploy.**

## Kết quả kiểm trước deploy (bản chính, 13/10)
- `kiem-truoc-ov3b`: 0 lộ trình thành nháp; 1 lệnh chuyển chờ bàn giao (CP ELE 30, 8 em) giữ hạn. → ổn.
- `kiem-truoc-ov1c`: 77 Case SOS MT đổi — 69 "Đóng · Chờ chốt SOS" (lượt chưa đủ điểm, chốt thì mở lại), 5 "Đóng · Overall đạt", 3 "Giữ · ghi mốc". → đúng luật.
- `kiem-truoc-ov1b`: 48 ô "-" đổi. ~10 em đang có lịch thi lại W2/W3 OCT sẽ mất lịch → **OV-1e** sửa. Phạm Vũ Minh Anh (CP FT 140, MT2 L): vắng lần 2 → huỷ phần thi (đúng luật; QL Khôi phục được).
- Sau khi OV-1e merge: chủ SP chạy lại `kiem-truoc-ov1b` (PowerShell: `$env:TURSO_DATABASE_URL = "..."`, `$env:TURSO_AUTH_TOKEN = "..."`, `npm run build:server`,
  `node dist-server/server/src/ops/kiemTruocOv1b.js`) → planning đọc → deploy theo `DEPLOY_2026-10.md`.
- **Mã Turso bản chính đã lộ trong chat 13/10** → sau deploy: tạo mã mới ở Turso, cập nhật `TURSO_AUTH_TOKEN` trên Netlify, thu hồi mã cũ (nhắc chủ SP).
- Migrate mới từ #285: 11 cái (plan.md mục 5).

## Quyết định chủ SP 13/10 (đã vào plan.md mục 3 / các PR)
KCK nhẹ (OV-9) · TVV quyền (OV-8b) · bước tiếp sau thi chỉ QL (OV-8a) · liên hệ mọi vai xem, không bắt buộc, GV không thấy ô nhập (OV-10b) · email không bắt buộc (OV-2c) ·
W/S Band tự tính, Band thẳng chỉ MT cũ + MT0 (OV-4c) · lưới chấm: em Lưu trữ khoá, Kết thúc học nhập bù được, Tạm dừng như thường (OV-1d) · "tôi theo bạn" cho OV-1e.
Điểm đã báo chủ SP, chưa ai đòi đổi: lớp thường Target "-" = KCK (Case nhẹ, không PA Bổ trợ) · ô "Thiếu thông tin" Tổng quan TVV không tính ngày sinh / email ·
TVV / CX nhập liên hệ từng em (Sửa cả lớp vẫn chỉ QL).

## Việc của session planning mới (chủ SP 13/10 — tự quyết, gom câu hỏi ở cuối)
1. **Rà chức năng toàn web** (mọi trang × mọi thao tác × mọi vai: QL, Quản trị, GVCN, GVBM, Admin, TVV, CX): lỗi, chặn cứng (nút ra 403/400 vô lý, không có đường sửa),
   xung đột giữa các PR OV (luật chồng nhau, số liệu hai nguồn), bước thừa có thể bỏ / gộp để tối giản workflow (CLAUDE.md "Nguyên tắc workflow + UX").
2. **impeccable audit toàn web** (mọi trang, nút, badge, panel, chữ; 1440 tối + 375 sáng): chấm điểm, đề xuất nâng cấp UX/UI trong khuôn DESIGN.md (không làm lại).
3. Gộp 1 + 2 thành **một đặc tả rà soát cuối** (`docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md`) + **kế hoạch PR "OV-11x"** (mỗi file ≤ 200 dòng,
   Đầu ra · Ranh giới · Kiểm · Prompt; ghi PR song song được, tối đa 3) → cập nhật plan.md (mục 0, 2, 4, 5, 9.3). Sau OV-11x: deploy → PR-EN → PR-SOTAY.
4. Đưa chủ SP prompt chạy được ngay đêm nay; cuối báo cáo: **câu hỏi chưa chắc** (đề xuất mặc định đã áp dụng + hỏi có đổi không).
