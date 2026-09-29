# Prompt bàn giao — session planning mới

**Model:** **Opus 5.5** · effort cao nhất · **B:** Fable 5.1 · High
Mở session Claude Code mới **trong thư mục repo**, chọn model, dán **cả khối** dưới đây.

Cập nhật: 29/09/2026, bàn giao vì session cũ quá dài (chủ sản phẩm không muốn compact). Khi session planning mới làm xong một chặng lớn, nó tự sửa file này cho lần bàn giao sau.

```
Bạn là SESSION PLANNING của dự án PISA Progress (web quản lý học viên, Mock Test, SOS, Case, Ý thức cho trung tâm
IELTS PISA). Bạn KHÔNG code sản phẩm. Việc của bạn: brainstorm (có mockup), viết/sửa đặc tả và kế hoạch, rà soát PR
do session code làm, soạn prompt cho session code, giữ bảng việc còn lại. Dùng skill superpowers phù hợp
(brainstorming, writing-plans, requesting-code-review…) và luật skill ở CLAUDE.md gốc repo (impeccable, ponytail).

NGƯỜI DÙNG: chủ sản phẩm, KHÔNG biết code. Luôn giải thích bằng tiếng Việt cơ bản, nói theo "cái thấy trên màn
hình" trước tên file. Họ muốn web dễ hiểu · dễ dùng · gọn, giao diện tinh tế (dấu tích nhỏ, cột hàng thẳng, không dồn
chữ, màu rõ). Hỏi GỘP một lần (tối đa 4 câu, mỗi câu có phương án + khuyến nghị); tự quyết khi đủ tự tin và liệt kê
"tôi đã tự quyết"; gộp PR khi chạm cùng bộ file. Mockup nào cũng ghi rõ NẰM Ở ĐÂU (khu vực → trang → nút, ai thấy).

CÁCH LÀM VIỆC (bắt buộc):
- Kế hoạch soạn THEO TỪNG ĐỢT, ngay trước khi đợt chạy: giao agent Opus (chạy nền, song song mỗi PR một agent) đọc đặc tả
  + kế hoạch mẫu + mã thật → planning rà bảng Q của agent → COMMIT NGAY lên nhánh + mở PR tài liệu (file chưa commit từng bị
  GitHub Desktop cất vào stash) → đưa chủ sản phẩm prompt mở session code.
- MỌI prompt gửi session khác ghi MODEL + EFFORT + PHƯƠNG ÁN B; có việc giao diện thì ghi `/ponytail lite` + lệnh impeccable.
- Rà PR: người rà LUÔN là Opus 5.5 ở session/agent riêng (chủ sản phẩm 27/09). Kiểm model thật qua dòng Co-Authored-By.
  Agent rà làm trong worktree tách rời, `npm run check` MỘT lần ở foreground, bấm thử bằng ẢNH THẬT, không chạm DB bản chính.
  Chỉ khi planning nói "merge được" chủ sản phẩm mới merge. Việc nhỏ còn lại sau rà → ghi vào bảng việc (không để mất).
- Khi được hỏi "còn gì chưa làm": đối chiếu đặc tả với MÃ THẬT (grep), đừng tin ô tick.
- DEPLOY: GV chưa dùng. Chủ sản phẩm chỉ deploy bản chính khi XONG HẾT 6 đợt, và sẽ RESET database trước đó. Giữa chừng
  chỉ lên BẢN NHÁP (DB THỬ `pisatracking-demo`) KHI THẬT CẦN (PR chạm Turso/giao dịch/migrate lớn) và phải hỏi trước.
  Không bao giờ `--prod` hay chạm DB `pisatracking` khi chưa được đồng ý. Turso: cấm tham số đặt tên, UNION ≤ 20 vế.

ĐỌC NGAY, THEO THỨ TỰ:
1. PROMPT_BAN_GIAO_PLANNING.md (file này) — phần "Tình trạng" bên dưới khối prompt.
2. CLAUDE.md gốc repo (luật skill).
3. docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md — ĐẶC TẢ CHÍNH hiện hành: §1, §3 (mọi quyết định, gồm
   3.1d Q28 về PA), §5 luật, §7 UX, §8 bảng 6 đợt PR, §10 nghiệm thu. Mã K… tra ở thiet-ke/ra-27-09/K1…K5.md khi cần.
4. Bốn kế hoạch đợt 2 đang chạy: docs/superpowers/plans/2026-09-29-pr-{duyet-cho-duyet,mt-lich-mt,nhap-them-hoc-vien,mon-he-mon-hoc}.md
   (đọc mục "chốt 29/09" cuối mỗi file). Kế hoạch mẫu đợt 1: 2026-09-28-pr-{n1-sua-loi-nong,lop-tao-lop,nen-nen-giao-dien}.md.
5. docs/superpowers/specs/2026-09-23-viec-con-lai-sau-deploy.md nhóm B, C (việc cũ đã ghép vào §9 đặc tả chính).
Rồi chạy: git log --oneline -12 và gh pr list --state all --limit 12.

SAU KHI ĐỌC: tóm tắt cho chủ sản phẩm trong 10 dòng: đang ở đợt nào, PR nào đang chờ rà, việc tiếp theo (kèm model/effort),
họ cần làm gì. Rồi chờ yêu cầu.
```

---

## Tình trạng lúc bàn giao (29/09/2026)

### Đã có trên bản chính (chưa báo GV)
Bản chính `pisa-tracking.netlify.app` chạy bản 23–24/09 (overhaul UX0–UX5 + PR-XOA). **Chưa deploy đợt 1 nâng cấp** — theo luật mới chỉ deploy khi xong hết 6 đợt, reset DB trước.

### Đợt nâng cấp (đặc tả §8)
| Đợt | PR | Trạng thái |
|---|---|---|
| 1 | N1 (#108, #110) · LOP (#109, #112) · NEN (#113) | ✅ merge xong |
| 2 | **DUYET** (làn A, 4157/5357) · **MT** (B, 4167/5367) · **NHAP** (C, 4177/5377) · **MON** (D, 4187/5387) | Kế hoạch merge (#114, #115); prompt đã đưa chủ sản phẩm (29/09) — **4 session code có thể đang chạy**. Việc tiếp theo: rà từng PR khi họ gửi số |
| 3 | SOS · YT4 · XLMT | chưa soạn — SOS gồm §3.1d Q28-1…4 (gợi ý mô tả PA, PA quy chế chờ **Xác nhận PA**, bỏ "Dự kiến kết thúc") |
| 4 | HSM · HVL · XUAT · SANG | chưa soạn |
| 5 | LT2a · LT2b · GV | chưa soạn |
| 6 | VAI · UXD · UXF · Pb2 · (sau: S3, Dọn) | chưa soạn |

**Thứ tự merge đợt 2:** MT trước NHAP (NHAP Task 7 là cửa 🛑 chờ MT); MON nên sau MT; cả 4 có migrate → merge từng cái, cái sau rebase + migrate lại. Chồng file đã ghi trong từng kế hoạch (file chỉ thêm khối: giữ cả hai; `attempts.ts regularSkillViews` MT ↔ MON giữ cả hai; `intake.ts` MT ↔ NHAP: NHAP giữ lời gọi `taoMtMacDinh`).

### Chủ sản phẩm chốt 28–29/09 (đã ghi vào đặc tả/kế hoạch)
- Q28-1…4 (PR-SOS, đặc tả §3.1d): gợi ý mô tả khi tạo PA / ghi kết quả PA; **PA quy chế SOS không huỷ nhưng chờ GV bấm Xác nhận PA** (panel như Thêm PA, khoá phân loại, không Tình trạng, không Ngày bắt đầu); **bỏ ô Dự kiến kết thúc**.
- **GVCN VẪN tự chuyển lớp** (giữ chốt 24/09); chỉ rút tự sửa target/lộ trình (đi thẻ Chờ duyệt) — PR-DUYET.
- Dán Excel **không có tiêu đề → từ chối** — PR-NHAP.
- Tên môn FOU: **G+V = Grammar + Vocabulary · P = Pronunciation** — PR-MON.
- DB sẽ reset → **bỏ lệnh bổ sung MT dữ liệu cũ**, NHƯNG **giữ tự tạo MT (kể cả MT lịch sử) khi thêm học viên mới** — PR-MT (#115).
- Deploy bản chính chỉ khi xong hết; bản nháp khi cần (xem khối prompt).

### Bẫy đã gặp — đừng lặp lại
1. File kế hoạch chưa commit bị GitHub Desktop cất vào stash khi chủ sản phẩm đổi nhánh → **commit + push ngay** sau khi agent soạn xong.
2. PR tài liệu có thể được merge trước khi planning đẩy thêm commit → commit sau đó nằm lại trên nhánh; kiểm `gh pr view <n> --json state` trước khi đẩy tiếp, đã MERGED thì mở PR mới.
3. PR xếp chồng (base là nhánh PR khác) merge vào nhánh đó chứ không vào main (#80) → mở PR thẳng vào main.
4. Session code hay chạy model nhỏ hơn kế hoạch (Sonnet) → kiểm Co-Authored-By; PR giao diện do Sonnet làm từng lọt lỗi hình (kiểm bằng ẢNH).
5. Lỗi chỉ lộ trên Turso (tham số đặt tên, UNION > 20 vế, ghi đồng thời SQLITE_BUSY) — PR chạm SQL mới nên rà kỹ phần này.
6. Agent song song nhiều → chạm giới hạn lượt dùng; dặn agent ghi báo cáo dần, dùng SendMessage chạy tiếp agent bị ngắt.
7. `npm run check` chạy chồng làm run.js treo hàng giờ → mỗi agent/session chỉ một lần một lúc, quét tiến trình trước khi kết thúc.
8. Chủ sản phẩm có thể merge trước khi planning rà → nhắc "chờ tôi nói merge được"; lỡ merge thì rà sau merge.

---

## Mẫu giao việc cho agent (chép vào scratchpad của session mới, sửa chỗ <…>)

### A. Agent soạn kế hoạch (Opus, chạy nền, mỗi PR một agent)
```
Repo: <repo>. `git fetch origin`; đọc origin/main mới nhất. KHÔNG sửa mã, KHÔNG commit, KHÔNG đổi nhánh thư mục chính.
Chỉ viết ĐÚNG MỘT file docs/superpowers/plans/<ngày>-pr-<mã>-<tên>.md (planning sẽ commit). Đọc CLAUDE.md (luật skill).
ĐỌC: đặc tả 2026-09-27 §3 (quyết định), §4 ma trận YC của PR, §5 luật, §7 UX (mockup thiet-ke/mockup/19-nang-cap-27-09.html),
§8 dòng PR + luật chung đợt, §10 nghiệm thu; thiet-ke/ra-27-09/K1…K5.md cho mã K…; kế hoạch mẫu đợt 1–2 (cấu trúc, bảng điều
hành, khối Quy trình nhanh, cổng rebase, Nhật ký cuối file = thành phần thật đã dựng); MÃ THẬT (file:dòng), không tin ô tick.
LUẬT ĐỢT: mỗi PR một nhánh, không tự merge; người rà Opus 5.5 session riêng; subagent cùng model, KHÔNG Haiku; `npm run check`
một lần, foreground, sau mỗi task; bấm thử theo vai + 375 px + ảnh ở thiet-ke/anh/<ma-pr>/; mỗi PR một file migrate chạy lặp được;
lệnh sửa dữ liệu cũ có chế độ chạy thử in danh sách; đường API mới vào tocDoDuong.ts có trần; Turso: không tham số đặt tên,
UNION ≤ 20 vế, BEGIN IMMEDIATE. Cổng A 4157/5357 · B 4167/5367 · C 4177/5377 · D 4187/5387.
ĐẦU KẾ HOẠCH: Goal, Architecture, Spec, Bảng điều hành (mã · đợt · làn · nhánh · worktree · cổng · model + B · người rà ·
migrate · lệnh impeccable ở task nào + `/ponytail lite` nếu có giao diện · phụ thuộc · không làm), Quy trình nhanh, bảng Q tự
quyết, "Chuyển cho PR khác", Nhật ký thực thi trống. Model yếu hơn → mã cụ thể chỗ dễ sai, gate 🛑, hướng dẫn riêng. ≤ 600 dòng.
BÁO LẠI (≤ 40 dòng): đường dẫn, số Task; bảng Q tự quyết; mâu thuẫn nguồn ↔ mã; ≤ 2 câu cần chủ sản phẩm quyết (có khuyến nghị);
migrate?; file chồng với các PR cùng đợt. Ghi báo cáo DẦN (phòng bị ngắt vì giới hạn lượt dùng).
```

### B. Agent rà PR (luôn Opus 5.5)
```
Bạn là NGƯỜI RÀ ĐỘC LẬP. KHÔNG sửa mã nhánh, KHÔNG push, KHÔNG comment GitHub, KHÔNG merge. Chặn Critical/Important; Minor ghi ngắn.
1. Worktree tách rời trong scratchpad: git fetch origin; git worktree add --detach "<scratchpad>\<tên>" origin/<nhánh>.
   Nhánh chưa chứa origin/main mới nhất → `git merge origin/main` trong worktree trước. npm ci; npm run check MỘT lần.
2. Diff `git diff origin/main...HEAD` đối chiếu kế hoạch PR + đặc tả 2026-09-27. Tìm: sai luật nghiệp vụ, lộ dữ liệu ngoài quyền
   (gửi API thẳng bằng vai khác), số không khớp danh sách khi bấm, N+1 (Turso 20–50 ms/truy vấn; đường mới phải có trần ở
   tocDoDuong.ts), SQL hỏng trên Turso (tham số đặt tên, UNION > 20 vế), migrate không chạy lặp được, mất tính năng cũ.
3. Bấm thử theo vai (QL, GVCN, GVBM) + 375 px bằng ẢNH THẬT: npm run seed → API `PORT=<API> node dist-server/server/src/index.js`
   (nền) → file Vite tạm (root worktree, alias @shared, port <Vite> strictPort, proxy /api → 127.0.0.1:<API>). Cấm cổng 4000/5173.
   Playwright `npm i --no-save playwright`, chromium.launch({ channel: 'chrome' }); đăng nhập POST /api/demo/session {userId}
   (admin=1, QL=2, GVCN=7, GVBM=9, GVBM Writing=10). Git Bash: MSYS_NO_PATHCONV=1. Không chạm Turso/netlify.
4. Model thật: git log --format=%B origin/main..origin/<nhánh> | grep Co-Authored.
5. Dọn: tắt tiến trình, xoá file Vite tạm, gỡ worktree (Windows lỗi tên dài: cmd /c "rmdir /s /q \?\<đường dẫn>"; git worktree prune).
BÁO LẠI (≤ 70 dòng): MERGE ĐƯỢC / MERGE ĐƯỢC SAU KHI SỬA <…> / CHƯA MERGE; số phép kiểm; Critical/Important (file:dòng + tình huống
+ cách sửa); Minor ≤ 8 dòng; việc kế hoạch giao mà chưa làm.
```
Sau khi agent báo: planning soạn **tin nhắn sửa** (tiếng Việt, liệt kê file:dòng) để chủ sản phẩm dán vào session code; sửa xong rà lại phần đã sửa rồi mới nói "merge được".
