# Bàn giao PTA Plan — 27/10/2026 tối (session planning cũ đầy ngữ cảnh)

Đọc tệp này trước. Mọi việc chi tiết nằm ở các kế hoạch dẫn dưới đây; đây chỉ là trạng thái và luật làm việc mới nhất.

## 1. Luật làm việc mới nhất (chủ SP 27/10 — thắng ghi chép cũ)
- Tên session planning: **PTA Plan**. Session code nhắn tới tên này bằng SendMessage.
- Trả lời chủ SP bằng tiếng Việt đơn giản, ngắn.
- **Không deploy** khi chủ SP chưa bảo. Lần deploy cuối: 27/10 14:19.
  - Migration mới sau đó: `prSvBaiLop2` (#623).
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
- **Cổng critique:** chấm MỘT lần, ≥ 25/40 và không P0 / P1 là đạt khi cần nhanh; mục tiêu thường ≥ 35, gửi chủ SP được từ ~31.
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

## 2. PR đang mở (lúc bàn giao)
| PR | Việc | Trạng thái / việc PTA |
|---|---|---|
| #619 | D4 màu web | Chủ SP duyệt. PTA cũ đang check (worktree `scratchpad/p619`). Xong → merge → nhắn MAU-WEB-2 + 6C-NHO gộp main |
| #635 | D8 sửa nhỏ UI (Lịch Test cột "của bạn", 3 lỗi do-khung #608, "Chờ mô tả / nguyên nhân", 409 tải lại) | PTA đã thụt hàng "Tổng số câu" (commit `ba003295`, chủ SP yêu cầu). Cần: chụp lại Lịch Test lớp thường cho chủ SP xem → chạy check đầy đủ (run.js session chạy bị 127) → merge |

## 3. Session đang chạy (báo về PTA Plan khi mở PR)
- **HSL-FT** (M4 PR 2, trang lượt Test FT): đang check, sắp mở PR. Kế hoạch `2026-10-27-m4-code.md`.
- **6C-NHO** (D9): sửa nốt `LuoiThuong` / `PhanTichGiaoVien` / `HoSoGiaoVienPage` (trùng tệp #619).
- **MAU-WEB-2** (D10): code xong, chờ #619 merge rồi dựng lại nhánh từ main, check, mở PR.
  - PTA đã trả lời [XM]: "Chờ n kỹ năng" giữ badge V4; cột Việc HV & Lớp chữ thường, màu nhấn chỉ khi rê; 375 badge sát nhau để sau.
- **SAU-D7-NHO** (D11): 4 điểm nhỏ máy chủ #633.
- **6b-3 PILOT-VIEC**, **6b-4 PILOT-GV-TRE**, **M5 ② UI-HO-SO-HV-2**: vừa mở 27/10 ~22:00 (kế hoạch `2026-10-27-m6-code.md`, `2026-10-27-m5-code.md`).

## 4. Chờ PR trước merge mới chạy
- **M4 PR 3 HSL-LT** (trang lượt lớp thường): sau HSL-FT. Prompt cuối `2026-10-27-m4-code.md`.
- **6c** (áp dần bảng kê panel `docs/superpowers/specs/2026-10-27-panel-inventory.md`: chống mất chữ lỗi 5, lỗi tải ≠ rỗng lỗi 6, panel chồng lỗi 9, rồi Gộp / Bỏ; + dòng danh sách Case có điểm [XM-1 #632]): sau 6b-3, 6b-4.

## 5. Việc nhỏ ghi để sau
- 375:
  - badge sát nhau (HV & Lớp);
  - "vắng W2 SEP" cắt chữ SEP;
  - thẻ "15 bài của GV khác" 2 dòng (#635).
- View Case: chip lượt chưa link ↗ (chờ route trang lượt M4).
- Bật nút Dịch AI: chủ SP tự gắn khoá OpenAI theo `docs/huong-dan/bat-dich-ai.md` (không xem / nhập khoá).

## 6. Kế hoạch / tài liệu chính
- `docs/superpowers/plans/2026-10-27-sua-toi.md` — D1–D11 (đợt sửa sau deploy 14:19).
- `2026-10-27-m4-code.md`, `2026-10-27-m5-code.md`, `2026-10-27-m6-code.md` — code M4 / M5 / M6.
- Mockup đã duyệt:
  - `thiet-ke/v7/ho-so-luot-test.html` (M4);
  - `thiet-ke/v7/ho-so-hv.html` (M5);
  - `thiet-ke/v7/panel-pilot.html` (M6);
  - `thiet-ke/v7/cong-viec-2.html` (Công việc);
  - `thiet-ke/v7/bang-mau-moi.html` (màu).
- Đã merge tối 27/10: #618 #622 #623 #624 #626 #627 #628 #629 #630 #632 #633 (+ kế hoạch #625 #631 #634 #636).
