# PR giao diện sau audit 03/11 — luật chung + chia session

Chủ SP 03/11 khuya: duyệt hết mockup U01–U10, "Bắt đầu làm". Mỗi màn MỘT PR. Ghi ở plan.md mục 4 (khối 03/11 tối — AUDIT OVERHAUL).

## Chia session (≤ 5 session code cùng lúc)
| Session | Việc, theo thứ tự (PR sau mở khi PR trước đã merge, nhánh mới từ main) | Mockup | Tệp rà / bảng ý |
|---|---|---|---|
| UI-CONG-VIEC | U01 Công việc → U09 Tổng quan + menu tài khoản | `thiet-ke/audit-0311/u01-cong-viec.html` · `thiet-ke/v11/tong-quan.html` | `13-ra-ux-a.md` · `14-ra-ux-b.md` |
| UI-HO-SO-HV | U02 Hồ sơ HV → U07 Hành trình | `audit-0311/u02-ho-so-hv.html` · `u07-hanh-trinh.html` | `13-ra-ux-a.md` |
| UI-HO-SO-LOP | U03 Hồ sơ lớp → bỏ bảng "Cần hỗ trợ" lớp THƯỜNG (PR riêng, chủ SP 04/11) → U08 Phân tích | `audit-0311/u03-ho-so-lop.html` · `v11/phan-tich.html` | `13-ra-ux-a.md` · `14-ra-ux-b.md` |
| UI-HV-TEST | U04 Học viên & Lớp (+ chip bậc Ý thức K7 của U10) → U05 Kế hoạch Test → U06 Lịch Test tuần | `v11/hoc-vien-lop.html` · `ke-hoach-test.html` · `lich-test-tuan.html` · K7 trong `audit-0311/u10-y-thuc.html` | `14-ra-ux-b.md` |
| AUDIT-Y-THUC | UI-1 #878 đã merge → UI-2 tab Ý thức hồ sơ lớp (**sau U03 merge**) → UI-3 tab Ý thức hồ sơ HV (**sau U02 merge**; ĐỒNG BỘ với UI-2 — chủ SP 03/11) | `audit-0311/u10-y-thuc.html` | `u10-y-thuc-bang-y.md` |

Ghi riêng: **U04** cân đối lại các cột, vừa màn **1280** không cuộn ngang (chủ SP — không mockup lại). **U05** chữ "Vắng" màu vàng rõ. **U06** màn để XEM ĐIỂM (không số về GV khác). **U03** "Xem chi tiết" kỹ năng = panel phải; dòng tiêu chí "TA 6 · CC 6 · LR 6.5 · GRA 6 → 6.0" dùng chung với U04 (một hàm). **#860** đã merge: MT lịch sử là kết quả hiện tại.

## Luật chung mọi PR
1. Đọc trước: `CLAUDE.md` · `plan.md` 1.5 (bẫy — nhất là **phông khi chụp ảnh cặp từ worktree**), 1.6 (N1–N35), mục 4 khối 03/11 (mọi lời chủ SP về màn của mình) · `DESIGN.md` Luật V5 · tệp rà + bảng ý của màn · `00` = `D:/Download/Pisa tracking web/PISA-Tracking-Claude-Audit-Overhaul-2026-11-03.md` mục 12, 20 (màn mình), 21.
2. **NÂNG CẤP, không chép:** HÌNH ẢNH (màu, nền, viền, độ đậm, cỡ chữ, khoảng cách) theo mockup SÁT; TÍNH NĂNG theo luật + plan, GIỮ mọi thao tác cũ. Sửa đồng bộ cả phần mockup không vẽ (panel, popover, rỗng / lỗi, chân lưu). Xung đột → ghi [XM], hỏi PTA Plan, không tự bỏ. "Những gì thừa thì đừng thêm text".
3. Skill: đầu phiên `/ponytail lite` · `karpathy-guidelines` · impeccable `layout` + `polish` (PR làm lại màn), `clarify`, `harden`, `adapt` (375) · trước PR: impeccable `audit` + `web-design-guidelines` + `/ponytail-review`.
4. Worktree `.claude/worktrees/<tên-nhánh>`; không đụng thư mục chính. Tắt dev server của mình khi xong (lọc theo cổng / đường worktree của mình).
5. Turso: mỗi màn trả lời "mở trang đọc bao nhiêu câu / dòng"; đọc đúng phạm vi, không gọi lại; đường API mới / đổi có trần ở `server/src/tests/tocDoDuong.ts`; vượt ~30 câu / ~2 000 dòng → báo PTA Plan trước.
6. Ảnh cặp toàn trang mockup | web, 1440 tối + 375 sáng, đủ trạng thái chính; bảng truy vết khung → thành phần → ảnh (có dòng BỎ / GIỮ); `khop-khac.md` có bảng thao tác TRƯỚC → SAU; cổng ≥ 90 % KHỚP. Kiểm `document.fonts.check('600 14px "Be Vietnam Pro"')` = true trước khi chụp.
7. `npm run check` đầy đủ trước khi mở PR, ô **check-1 / check-2** theo `C:/Users/Admin/AppData/Local/Temp/pisa-slot/CACH-DUNG.txt` (check-3 của PTA; mkdir hỏng thì chờ, không chạy ngoài ô).
8. Mở PR → nhắn **PTA Plan** (SendMessage): link PR, ảnh cặp, số câu / dòng, chú thích `ponytail:`. **Chủ SP duyệt ảnh cặp trước merge**, không merge qua đêm, không deploy.
