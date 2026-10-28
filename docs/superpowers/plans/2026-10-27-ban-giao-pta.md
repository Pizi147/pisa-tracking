# Bàn giao PTA Plan — cập nhật 28/10/2026 rạng sáng (sau đêm tự chạy)

Đọc tệp này trước. Mọi việc chi tiết nằm ở các kế hoạch dẫn dưới đây; đây chỉ là trạng thái và luật làm việc mới nhất.

## 1. Luật làm việc mới nhất (chủ SP 27/10 — thắng ghi chép cũ)
- Tên session planning: **PTA Plan**. Session code nhắn tới tên này bằng SendMessage.
- Trả lời chủ SP bằng tiếng Việt đơn giản, ngắn.
- **Không deploy** khi chủ SP chưa bảo. Lần deploy cuối: **28/10 ~01:01**, main `6d2eecc6` (#635 #640 #642), DB `pisatracking-261028` (DB cũ `261027` giữ ~1 tuần).
  - Migration mới sau đó: chưa có (tới `f5dfb984`).
  - Khi chủ SP bảo deploy: soát lại danh sách migration từ commit đã deploy.
  - Cách làm theo bộ nhớ "Cách deploy" + `DEPLOY_2026-10.md`.
- **Chỗ check** (`C:/Users/Admin/AppData/Local/Temp/pisa-slot/check-N`):
  - Tối đa 3 check cùng lúc.
  - **check-3 dành riêng cho PTA merge**; session chỉ dùng check-1 / check-2, xong `rmdir` ngay.
  - Máy quá tải thì check chết giữa chừng (exit 127, "database disk image is malformed", "fork: resource unavailable") — đó KHÔNG phải lỗi mã: chạy lại.
  - Không còn tiến trình check nào chạy mà vẫn còn thư mục chỗ = chỗ treo, gỡ được.
- `npm run check` từ #636 chỉ chạy tsc máy chủ 1 lần (nhanh hơn ~2 phút).
- Gộp lại main sau khi PR khác vừa merge, nếu chỉ vướng `shared/i18n/en.ts` (danh sách `...EN_*`) hoặc `server/src/tests/run.ts`:
  - typecheck + phép kiểm liên quan, không chạy lại cả bộ;
  - en.ts: lấy hợp hai danh sách, bỏ `EN_R1_PHAN_CAP_TEST` (đã gỡ).
- **Cổng critique (chủ SP 28/10, thắng bản cũ):** mục tiêu ≥ 35/40; chạm 30 thì sửa tối đa 2 vòng nữa, rồi chỉ cần không P0 / P1 là đạt.
- **Đêm 28/10 chủ SP uỷ quyền:** tự giao việc, tự rà, tự merge PR giao diện khi ảnh cặp ≥ 90 % KHỚP + đúng luật + check xanh; PR < 90 % chờ chủ SP đồng ý lý do các dòng KHÁC. Đêm khác hỏi lại.
- **Luật / dữ liệu chủ SP đã nhắc gắt:**
  - **N8:** nhận xét MT KHÔNG bắt buộc; nhận xét thành "Mô tả" Case; không có thì việc "Mô tả Case" cho GV phụ trách; S chấm chéo = GV phụ trách S.
  - Form tiến độ trên lớp: cần ít nhất một trong nhận xét / x/y / band.
  - **N13:** bỏ môn thì SOS / Phối hợp / tín hiệu chỉ tính môn còn học.
  - **Thi thật:** kết quả quan trọng nhất, thường là điểm kết, nhưng KHÔNG thêm luật ẩn / chặn; lộ trình kết thúc = ghi KQ + chọn bước tiếp.
  - "Case" luôn là "Case" (không "Vấn đề").
  - Không đổi nhóm nguyên nhân.
  - Màu web phải dễ chịu như mockup (không chói, ít chữ đậm, link không xanh khắp nơi).
  - Không dòng phụ lặp thông tin.
  - Tutor hoãn vô thời hạn.
  - Trước khi viết luật vào plan / prompt: tra bảng luật `plan.md` 1.6.
- PR giao diện: chủ SP duyệt ảnh cặp trước merge. PR máy chủ: PTA rà + check xanh thì tự merge.
- Bộ nhớ (MEMORY.md) đã cập nhật đủ các luật trên.

## 2. Chờ chủ SP sáng 28/10 (ảnh cặp < 90 % — mỗi dòng KHÁC có 1 câu lý do ở đầu khop-khac.md)
| PR / nhánh | Việc | Ghi chú |
|---|---|---|
| #638 HSL-FT | trang lượt Mock Test FT | 79 % (6 KHÁC). PTA đã rà code + máy chủ: đạt. Merge → nhắn HSL-LT |
| #644 6b-3 PILOT-VIEC | panel việc ngăn xếp | 79 % (3 KHÁC; Hoàn tác xác nhận nay đã có ở HOAN-TAC-XN-WEB). Merge → nhắn 6c + HOAN-TAC-XN-WEB |
| nhánh `claude/hsl-lt` (chưa PR) | M4 PR 3 trang lượt lớp thường | critique 31, 85 % (92 % tính KHÁC chấp nhận). Chờ #638; sửa chung `ConLaiLuot` (FT đổi theo) |
| nhánh `claude/panel-6c-d34757` (6c-1, chưa PR) | chống mất chữ, lỗi tải ≠ rỗng, panel chồng, việc để sau | check xanh. Chờ #644 |
| nhánh `claude/panel-6c2` (6c-2, chưa PR) | dòng Case có điểm, 5 hộp xác nhận nhỏ, bỏ mã chết, panel số ↗ mọi dòng, Kết thúc PA hiện lại | critique 30, K② 100 %. Chờ #644 + 6c-1 |
| nhánh `claude/hoan-tac-xn-web` (chưa PR) | Hoàn tác Xác nhận PA / Case trên web, trả lại chữ | check xanh. Chờ #644 |

Thứ tự merge sáng: #638 → nhắn HSL-LT mở PR · #644 → nhắn 6c (6c-1 rồi 6c-2) + HOAN-TAC-XN-WEB mở PR (gộp main, typecheck + phép kiểm liên quan). Check-3 cho PTA.

## 3. Đã merge đêm 27–28/10
#635 #640 #642 (đã deploy) · #645 màu cột Việc · #641 6b-4 GV chấm quá hạn · #643 M5 ② hồ sơ HV hai cột · #646 MAU-MUC 3 mức SOS rỗng · nền vừa · đặc (mockup `thiet-ke/v7/mau-muc.html`, PTA duyệt thay) · #648 HOAN-TAC-XN máy chủ (rà sâu /code-review high, 4 điểm đã sửa) · #647 #649 #650 #651 sửa 375 / do-khung (75 → 58 lỗi; miễn g3 bảng Quá hạn chấm theo T17).
Check đầy đủ trên main sau #643: 4509 + 58 xanh; sau #651: xem bình luận PTA.

## 4. Session (linked từ PTA Plan, sau #651 đều nghỉ)
- hsl-lt, panel-6c, hoan-tac-xn: chờ tin "đã merge #638 / #644" (mục 2).
- mau-muc: xong MAU-MUC + SUA-375 1–3 + SUA-DO-KHUNG; rảnh — dùng cho việc nhỏ tiếp.
- Session cũ (HSL-FT, 6b-3, 6b-4, M5 ②, MAU-WEB-2, 6C-NHO, SAU-D7-NHO): PR đã xong / chờ; có thể lưu trữ khi chủ SP đồng ý.

## 5. Việc để sau (ghi lại, chưa giao)
- cv-cho-duyet 375: 38 lỗi cắt chữ thẻ Chờ duyệt (`duyet/TheYeuCau.tsx`) — sau 6c-2.
- hd-chi "Chỉ cho tôi": đích bước hướng dẫn sai (`shared/huongDan/gv.ts`, `ql.ts`) — sau hsl-lt.
- Khôi phục lượt Test lớp thường đã huỷ (luật không khoá cứng) — PR máy chủ.
- Tên GV ở việc của người khác ("Còn lại" trang lượt FT / LT) — cần trường máy chủ.
- P2 HSL-LT: dòng "Lịch" đầu trang khi các môn khác tuần.
- View Case: chip lượt ↗ trang lượt (sau HSL-FT / HSL-LT merge).
- Bật nút Dịch AI: chủ SP tự gắn khoá theo `docs/huong-dan/bat-dich-ai.md`.

## 6. Kế hoạch / tài liệu chính
- `docs/superpowers/plans/2026-10-27-sua-toi.md` · `-m4-code.md` · `-m5-code.md` · `-m6-code.md` · `2026-10-28-6c-panel-ap.md`.
- Mockup đã duyệt: `thiet-ke/v7/ho-so-luot-test.html` (M4) · `ho-so-hv.html` (M5) · `panel-pilot.html` (M6) · `cong-viec-2.html` · `bang-mau-moi.html` · `mau-muc.html` (28/10).
