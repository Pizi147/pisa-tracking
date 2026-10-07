# Kế hoạch tổng 08/10 — Cuối khoá · Chế tài · PA đồng bộ · Gộp việc

Nguồn: đặc tả `docs/superpowers/specs/2026-10-08-cuoi-khoa-che-tai-gop-viec-design.md` (§1–§7) + §8 dưới đây.
Mockup ĐÃ DUYỆT: `thiet-ke/mockup-panel-cuoi-khoa-2026-10-07.html`, `thiet-ke/mockup-cuoi-khoa-2-2026-10-08.html` (trừ hộp "Sửa PA"),
`thiet-ke/mockup-pa-dong-bo-2026-10-08.html` (cách 1, SỬA theo §8 — không mockup lại). Khi mockup trái §7/§8 → theo §7/§8.

## §8. PA đồng bộ — chủ sản phẩm chốt 08/10 (đè mockup PA)
- **MỘT mẫu PA** cho mọi nơi: Thêm PA, Thay PA, Điều chỉnh, Sửa PA (mới), PA quy chế SOS FT, Bổ trợ Giữa khoá, Bổ trợ miễn phí (chế tài Final), Tutor 10 buổi (kỳ vọng đầu ra).
- Ô: **Loại · Nội dung · Số buổi** (Tutor / Tự học / Bổ trợ; **không bắt buộc**) **· Người dạy** (không bắt buộc; Tự học không có ô này) **· Ngày bắt đầu**.
- **KHÔNG có ô Người theo dõi.** Việc "Kết quả" luôn giao **GVBM của Case** (GVBM môn đó ở lớp hiện tại của em). Lớp chưa phân công GVBM môn đó → chủ Case.
- PA mặc định chế tài: điền sẵn Người dạy = GV cũ dạy kỹ năng đó (không còn dạy → trống), QL sửa / để trống được.
- **Sửa PA** = cùng form (Loại khoá; Số buổi ≥ số đã dạy), nhật ký cũ → mới. Điều chỉnh dùng cùng ô.
- "Ghi kết quả" → **"Kết quả"** ở mọi chỗ (22 chỗ). Panel Kết quả: **Người dạy tuần này** (điền sẵn Người dạy của PA; gộp với "Người phụ trách" của LUI-a2 — một ô); nếu PA có Số buổi → **"Số buổi tuần này" BẮT BUỘC, mặc định 1**, sửa được (0 hợp lệ). Web tự đếm "Đã dạy 5/10 · còn 5"; đủ / vượt buổi → **chỉ gợi ý** "Kết thúc PA".
- Panel Case làm lại theo mockup PA phần Case (đầu một dải, thẻ Vấn đề / Phương án / Bằng chứng, chân Đóng · + Thêm PA · Kết quả).
- Migrate (chỉ thêm cột): `case_interventions.so_buoi`; `case_followups.so_buoi`, `nguoi_day_user_id`, `nguoi_day_ten`. Điền bù: Bổ trợ miễn phí lấy số buổi từ `mini_test`; Tutor kỳ vọng đầu ra = 10. Không cột theo dõi.
- Sửa kèm lỗi "việc mồ côi" (rà #263): người giữ việc Kết quả phải là người THẤY được việc (`mywork.ts:519-547`) — theo luật GVBM của Case ở trên.

## Kiểm xung đột trước khi làm (planning đã rà)
| # | Xung đột | Cách xử |
|---|---|---|
| X1 | Tutor 10 buổi hiện gán người thực hiện = GVBM lớp FT mới (`cuoiKhoa.ts:182-190`) ↔ §3 người dạy = GV cũ | PR-PA: Người dạy = GV cũ, Kết quả = GVBM Case (= GVBM lớp FT mới) — khớp cả hai |
| X2 | LUI-a2 "Người phụ trách" ở Ghi kết quả ↔ §8 "Người dạy tuần này" | Gộp thành một ô "Người dạy tuần này"; cột DB cũ giữ, đọc sang tên mới |
| X3 | Bỏ bước duyệt kế hoạch bổ trợ (§2) ↔ Bổ trợ là PA có Số buổi | PR-CT2 bỏ bước duyệt; PA Bổ trợ dùng mẫu §8 |
| X4 | LCa (#266) chặn đổi Hướng sau quyết định (409) ↔ §1 QL làm một việc "Chốt lộ trình" | LCb: Xác nhận trong panel = ra/sửa quyết định; "Lưu hướng" chỉ cho em chưa quyết |
| X5 | Đề xuất Lên FT duyệt trong tuần Final đi lệnh giữa khoá → thiếu MT0 | Sửa trong #266 (planning đã nhắn) |
| X6 | Chuyển lớp FT → Thường ↔ "Học lại" ở Lưu trữ | Giữ cả hai: Lưu trữ cho em đã kết thúc; Chuyển lớp cho em đang học |
| X7 | `cuoiKhoa.ts`, `boTro.ts`, `mywork.ts` bị PA / CT2 / KV / GOP cùng sửa | Chạy NỐI TIẾP trong một làn (PA → CT2 → KV) và GOP cuối cùng |
| X8 | `lenhChuyen.ts`, `TransitionPanel` bị LCa / LCb / CL cùng sửa | Nối tiếp trong một làn (LCa → LCb → CL) |
| X9 | Hạn chấm MT0 đổi CN → thứ Tư (`shared/domain/mt0.ts:25`) ↔ "Test quá hạn chấm" (LT3) | PR-CT2 chạy lại phép kiểm LT3/MT0; MT0 đi theo luật hạn Final |
| X10 | Gộp việc đếm "dòng" ↔ phép kiểm G-10 (tổng bài chờ chấm = badge), Tổng quan "Cần xử lý" | PR-GOP sửa phép kiểm theo luật mới: badge = số dòng; giữ số bài ở chi tiết |

## Ba làn chạy song song (mỗi làn = một session; PR trong làn nối tiếp)
**Làn A — "PA-CT-KV"** (session mới): PR-PA → PR-CT2 → PR-KV
**Làn B — "LC-CL"** (session PR-LCa đang có): PR-LCa (#266) → PR-LCb → PR-CL
**Làn C — "GOP"** (session mới): chờ A và B xong → PR-GOP

Mỗi PR: phép kiểm đỏ trước theo hành vi · `npm run check` (song song ≤ 3 trên máy) · PR giao diện ảnh 375/1440 sáng/tối + `/impeccable audit` · `/ponytail-review` · mở PR vào main, KHÔNG merge · nhắn session "PLANNING PISA" (ListAgents → SendMessage) "Mở PR #n: <tên>" rồi **DỪNG CHỜ**. Planning rà (gọn) → nhắn lại "sửa: …" hoặc "đã merge #n, làm PR kế" → session `git fetch; git worktree add` nhánh mới từ origin/main và làm tiếp.

### PR-PA (L, Opus 5.5 · XHigh) — §8
Máy chủ: migrate `server/src/migrate/prPa.ts`; một hàm tạo/sửa PA dùng chung cho mọi đường (tay, quy chế SOS, bổ trợ giữa khoá, bổ trợ miễn phí, tutor 10 buổi); Sửa PA (route mới, quyền như Điều chỉnh, nhật ký); Kết quả: số buổi tuần này (bắt buộc khi PA có số buổi, mặc định 1), người dạy tuần này, đếm đã dạy / còn lại, gợi ý kết thúc; người giữ việc Kết quả = GVBM Case (fallback chủ Case) — sửa `mywork.ts` + chỉ số `pa-can-cap-nhat`. Web: một form PA, panel Kết quả, panel Case mới, đổi chữ "Ghi kết quả" → "Kết quả" (22 chỗ, kể cả Công việc, sổ tay chữ trong mã).
Phép kiểm: mọi đường tạo PA ra cùng dạng; Sửa PA không cho số buổi < đã dạy; Kết quả bắt buộc số buổi khi có; đếm đúng qua nhiều tuần; việc Kết quả hiện cho GVBM Case (không mồ côi — sửa assert VN2-1d thành 0 lỗi); migrate chạy lặp được.

### PR-CT2 (M, Opus 5.5 · High) — §1 MT0 + §2
Chế tài Final sinh **khi Final đủ điểm** (không chờ thi hành); 50–59% FOU & BE→ELE = 2 buổi/kỹ năng; BE/ELE lên FT không bổ trợ/Mini Test theo Final; bỏ bước nộp/duyệt kế hoạch bổ trợ (`boTro.ts`); hạn chấm MT0 = thứ Tư tuần sau tuần thi; PA sinh ra dùng mẫu §8.
Phép kiểm: từng dải × chương trình; sinh đúng một lần khi đủ điểm (sửa điểm sau không nhân đôi); BE/ELE→FT không có bổ trợ; MT0 hạn thứ Tư; LT3 khối quá hạn đúng.

### PR-KV (M–L, Opus 5.5 · High, /ponytail lite) — §3
Panel "Kỳ vọng đầu ra · lớp" (mockup cuối khoá 2 phần 3): một việc QL mỗi lớp khi MT0 đủ điểm; Đạt = Overall ≥ ngưỡng (BE 4.0, ELE 4.5); Không đạt: kỹ năng dưới ngưỡng; Trung tâm → mỗi kỹ năng một Case + PA Tutor 10 buổi (Người dạy GV cũ, trống nếu không còn dạy); Học viên → lý do bắt buộc, Case không PA; Lưu một lần; bỏ việc mỗi em (`mywork.ts:1137-1157`, `metrics.ts:565-578`).

### PR-LCb (M, Opus 5.5 · XHigh, /ponytail lite) — §1, §7, X4
Panel "Lộ trình tiếp theo" gộp (mockup 07/10 + cuối khoá 2 phần 1): một việc QL "Chốt lộ trình · lớp" hạn CN tuần 7 (FOU) / 9 (BE/ELE), quá hạn đỏ không chặn; bỏ "Chốt lên FT" + "Chuyển tiếp lớp" riêng; ô gõ tên lớp theo nhóm; GVCN đề xuất trong panel; khoá Hướng GVCN sau quyết định; việc "Xét lại lộ trình · <lớp> · n em" khi "Kết quả không phù hợp lộ trình" (đã lên/lên FT mà Final < 50%; học lại mà Final ≥ 70%) mở Chuyển lớp với các em đã chọn.

### PR-CL (M, Opus 5.5 · High, /ponytail lite) — §1, §7
Chuyển lớp làm lại (mockup cuối khoá 2 phần 2): một ô gõ tên lớp (mọi chi nhánh hợp lệ; mã · chương trình · chi nhánh · sĩ số); ô Tuần (mặc định); Thường→FT / FT→FT chỉ Lý do; FT→Thường: đóng lộ trình FT, MT0 "không dùng", huỷ Mock chưa có điểm, giữ điểm; **Target + Dự kiến thi giữ như cũ** (bỏ ô Target; chỉ hỏi khi chưa có); mở từ "Xét lại lộ trình" chọn sẵn em.

### PR-GOP (M–L, Opus 5.5 · High, /ponytail lite) — §5, §7 Q1
Công việc / Tổng quan "Cần xử lý" / badge: một dòng = một lớp × một loại việc, cho MỌI loại (Nhập điểm, Thêm PA, Kết quả, Báo PH, Ý thức, Mini Test, Kỳ vọng đầu ra, Xét lại lộ trình…), trừ Case SOS FT và thẻ Chờ duyệt (giữ từng dòng). Mở dòng → danh sách em; hạn sớm nhất; có em quá hạn → đỏ; badge đếm dòng. Đo trước/sau trên seed (mục tiêu GVCN ~25, QL ~18). "Nhắc tất cả" (#263) vẫn đúng với dòng gộp.

## PROMPT (dán một lần mỗi session)

### Làn A — session mới, model Opus 5.5 · XHigh
```
Model: Opus 5.5 · XHigh (B: Opus 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng.
Bạn là session code LÀN A. Đọc CLAUDE.md, plan.md mục 1 + 9.0, docs/superpowers/plans/2026-10-08-ke-hoach-tong-cuoi-khoa.md (toàn bộ, nhất là §8, bảng xung đột, Làn A), đặc tả docs/superpowers/specs/2026-10-08-cuoi-khoa-che-tai-gop-viec-design.md, mockup đã duyệt ghi trong kế hoạch.
Làm lần lượt 3 PR: PR-PA → PR-CT2 → PR-KV. Mỗi PR: git fetch origin; worktree .claude/worktrees/<nhánh> từ origin/main MỚI NHẤT (nhánh pr-pa-dong-bo / pr-ct2-che-tai / pr-kv-ky-vong); ponytail full (task giao diện: /ponytail lite); superpowers:subagent-driven-development + test-driven-development (đỏ trước); impeccable layout/clarify/adapt + audit cho phần giao diện; cổng riêng PORT=46x1 WEB_PORT=56x1 (A: 4611/5611), không preview_start, không taskkill hàng loạt, không chạm Turso/Netlify; npm run check (song song ≤ 3 trên máy); Turso: không tham số đặt tên, ≤ 900 tham số, ≤ 200 câu SQL mỗi lần ghi; migrate file riêng chạy lặp được.
Mở PR vào main KHÔNG merge (Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>; body kết "🤖 Generated with [Claude Code](https://claude.com/claude-code)"; một dòng plan.md mục 11). Rồi dùng ListAgents tìm session "PLANNING PISA", SendMessage: "Làn A: mở PR #n <tên> — chờ rà". DỪNG, chờ tin của PLANNING PISA. Tin "sửa: …" → sửa, push, nhắn lại. Tin "đã merge #n, làm PR kế" → làm PR kế tiếp từ origin/main mới. Hết 3 PR thì nhắn "Làn A xong" và dừng.
```

### Làn B — dán vào session PR-LCa đang có
```
Bạn giờ là session code LÀN B. Đọc docs/superpowers/plans/2026-10-08-ke-hoach-tong-cuoi-khoa.md (bảng xung đột X4, X5, X8, Làn B, §7) và đặc tả docs/superpowers/specs/2026-10-08-cuoi-khoa-che-tai-gop-viec-design.md.
Trước hết: xong việc PLANNING PISA đã nhắn cho #266 (sửa (2): đề xuất Lên FT duyệt trong tuần Final phải có MT0), push, nhắn PLANNING PISA. DỪNG chờ.
Sau khi PLANNING PISA nhắn "đã merge #266": làm PR-LCb rồi PR-CL, mỗi PR từ origin/main MỚI NHẤT (nhánh pr-lcb-lo-trinh-tiep / pr-cl-chuyen-lop, worktree .claude/worktrees/), /ponytail lite, impeccable layout/clarify/harden/adapt + audit, ảnh 375/1440 sáng/tối vai QL (2) + GVCN (7), cổng riêng PORT=4621 WEB_PORT=5621, các luật như Làn A (Turso, check ≤ 3, không preview_start, không chạm Turso/Netlify).
Mỗi PR mở xong: nhắn PLANNING PISA "Làn B: mở PR #n <tên> — chờ rà", DỪNG chờ. "sửa: …" → sửa; "đã merge #n, làm PR kế" → làm tiếp. Hết thì nhắn "Làn B xong".
```

### Làn C — session mới, model Opus 5.5 · High
```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng.
Bạn là session code LÀN C. Đọc CLAUDE.md, plan.md mục 1 + 9.0, docs/superpowers/plans/2026-10-08-ke-hoach-tong-cuoi-khoa.md (X10, PR-GOP), đặc tả 2026-10-08 §5, §7, mockup thiet-ke/mockup-cuoi-khoa-2-2026-10-08.html phần 4.
CHƯA LÀM GÌ: dùng ListAgents tìm "PLANNING PISA", nhắn "Làn C sẵn sàng, chờ lệnh", rồi DỪNG chờ. Khi PLANNING PISA nhắn "Làn C bắt đầu": git fetch origin; worktree .claude/worktrees/pr-gop-viec từ origin/main mới nhất; làm PR-GOP (/ponytail lite, test-driven-development, impeccable layout/clarify + audit, ảnh 375/1440 sáng/tối vai QL 2, GVCN 7, GVBM 9; cổng PORT=4631 WEB_PORT=5631; luật như Làn A). Mở PR (không merge), nhắn PLANNING PISA "Làn C: mở PR #n — chờ rà", DỪNG chờ; "sửa: …" → sửa; "đã merge" → nhắn "Làn C xong".
```

## Planning làm gì (tự động)
- Nhận "mở PR #n" → giao agent rà GỌN (luật nghiệp vụ, quyền, mất dữ liệu, migrate, Turso; ảnh chỉ khi PR giao diện) → đạt: gộp main, `npm run check`, tự merge, `git pull` thư mục chính, nhắn "đã merge #n, làm PR kế" cho đúng làn → chưa đạt: nhắn "sửa: …" (file:dòng).
- A và B xong → nhắn Làn C "Làn C bắt đầu".
- Hết: kiểm main một lần, báo chủ sản phẩm bước deploy (có migrate: prLc, prPa — tập dượt như `DEPLOY_2026-10.md` bước C).
