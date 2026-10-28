# Bàn giao PTA Plan — tối 28/10/2026

Đọc tệp này trước, rồi `2026-10-27-ban-giao-pta.md` mục 1 (luật cũ vẫn đúng nếu không bị dòng dưới thay).

## 1. Luật mới trong ngày 28/10 (thắng ghi chép cũ)
- **Hình ảnh theo mockup SÁT, tính năng theo luật + plan** (CLAUDE.md, #657). Rà ảnh cặp: đặt cạnh nhau, cùng giao diện (tối | tối, sáng | sáng), zoom từng khối; lệch hình không lý do = trả về sửa.
- **Bỏ hết ký hiệu ↗** (#669; DESIGN.md G6 / V18 / V19 đã sửa). Tên / mã / chip vẫn là link. Giữ `cases.ts` `partial: '↗'` (ký hiệu tiến triển).
- **Kiểm nhanh** (chủ SP duyệt "Áp ngay"): session code chỉ chạy typecheck + `scripts/kiem-esbuild.mjs` + phép kiểm riêng của PR — luật ở `C:/Users/Admin/AppData/Local/Temp/pisa-slot/KIEM-NHANH.txt`. PTA chạy MỘT `npm run check` đầy đủ chung khi merge mỗi đợt 2–4 PR.
- **Ô check** (`pisa-slot/CACH-DUNG.txt`): giữ ô = `mkdir` + ghi tên worktree vào `ô/ai`; trả ô CHỈ khi `ô/ai` là tên mình. Tối đa 2 ô cho session (check-1, check-2), check-3 của PTA. RAM 15,7 GB: mỗi run.js ~1,9 GB → tối đa ~5 session code cùng lúc, tắt máy chủ dev khi không chụp ảnh. Exit 127 / 134 / 139 / "malformed" = quá tải, chạy lại.
- **Critique**: mục tiêu ≥ 35/40; chạm 30 thì tối đa 2 vòng nữa; xong chỉ cần không P0 / P1.
- **[XM] / "PR riêng" / "Để sau"** trong khop-khac.md phải chép ngay vào mục "Việc để sau" của bàn giao (28/10 sót tab Ý thức từ #547 — chủ SP rất bực).
- **Danh sách hiện tại** (#665): chỉ lượt của lộ trình mới nhất cùng loại + em đang học (`LUOT_HIEN_TAI_SQL`, `server/src/students/tamDung.ts`). Em lưu trữ / kết thúc học ẩn hết; MT chưa làm của lộ trình đã có kết quả thi thật không còn là kế hoạch.
- **Quyền GVCN** (#671): GVCN dời lịch MT tuần đã qua (kể cả có điểm) sang tuần đã qua / tuần này; mọi GV xem Kế hoạch Test lớp mình dạy (chỉ xem).
- **Bảng quy đổi band** (#666): ở DB, Quản trị sửa (QL xem); Listening theo IDP là phiên bản 2; điểm đã nhập giữ band.
- Session nào merge xong, hết việc → archive luôn (chủ SP bảo).

## 2. Deploy — chủ SP: chờ #672, #673, #674 merge rồi deploy MỘT lần
- Lần deploy cuối: 28/10 ~01:01, main `6d2eecc6`, DB `pisatracking-261028`.
- Main hiện `1b6f212e` (+ các PR dưới khi merge).
- **Migration mới từ lần deploy cuối: `migratePrBandQuyDoi`** (#666 — tạo bảng `bang_quy_doi`, v1 bảng cũ, v2 Listening theo IDP). Soát lại danh sách migration từ `6d2eecc6` trước khi deploy.
- Cách làm: bộ nhớ "Cách deploy" + `DEPLOY_2026-10.md` (sao lưu → migrate trên bản sao cục bộ → khôi phục sang DB mới → đổi biến Netlify → deploy). KHÔNG migrate thẳng trên DB bản chính.

## 3. PR đang mở
| PR | Việc | Trạng thái |
|---|---|---|
| #672 KHAI-BAC-LO | khai / sửa cấp bậc cả lớp (chọn tất cả, áp một bậc, ghi chú tuỳ chọn, Hoàn tác cả lô) | critique 36/40; PTA đã rà sâu máy chủ: đạt. **Chờ chủ SP duyệt ảnh.** |
| #673 KHT-GON | màn Kế hoạch Test làm lại | đang sửa vòng cuối theo phương án chủ SP chốt (ô MT chia dòng theo tuần, ô môn có khung "L ✓" / "L" / "S trễ chấm" cuối dòng, điểm tổng ✓/✗, vắng luôn ghi chữ thường, "· không thi W S", nền ô tối + viền). Gộp main rồi gửi chủ SP duyệt. |
| #674 LUOT-HAN-MO | quá hạn của người khác chữ mờ (FT); nhật ký "Khôi phục" | sẵn, không đổi bố cục — PTA merge sau check chung |

## 4. Session đang mở (linked từ PTA Plan cũ)
- `luot-sau` (local_a84abfc9…) — #674.
- `ui-y-thuc` (local_ba853361…) — #672.
- `ke-hoach-test` (local_ba3b2ae2…) — #673.

## 5. Đã merge 28/10 (sau deploy 01:01)
#638 #644 (sáng) · #653 #654 #655 · #656 #657 #658 #659 (mockup KHT) #660 #661 #662 #663 #664 #665 #666 #667 #668 #669 #670 #671.

## 6. Việc để sau
- Chủ SP tự bật nút Dịch AI (`docs/huong-dan/bat-dich-ai.md`).
- P2 còn lại của #673 nếu chủ SP không đòi (375 hàng công cụ, select chi nhánh GV).

## 7. Cách PTA merge một đợt
1. `git worktree add --detach .claude/worktrees/pta-dotN origin/main`, gộp lần lượt các nhánh PR; gỡ xung đột nhỏ (thường `shared/i18n/en.ts` — lấy hợp hai danh sách).
2. node_modules: junction tới thư mục chính (`mklink /J` hoặc PowerShell `New-Item -ItemType Junction`); gỡ junction bằng `[System.IO.Directory]::Delete` TRƯỚC khi xoá worktree.
3. `npm run check` trong ô check-3 (ghi `ai`). Đỏ ở phép băm DL-2 / trần SQL tốc độ thường là hệ quả đúng của PR → nhờ session sửa mốc có lý do.
4. Merge từng PR trên GitHub theo thứ tự đã gộp; PR bị xung đột với main → đẩy commit gộp đã gỡ (đã nằm trong bản kiểm) lên nhánh PR rồi merge. Cuối cùng `git diff <bản kiểm> origin/main` phải rỗng.
