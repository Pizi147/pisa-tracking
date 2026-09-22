# Prompt bàn giao — session planning mới

**Model:** model Opus mới nhất có trong ô chọn (chủ sản phẩm nói **Opus 5.5**) · effort cao nhất · **B:** Opus 5 · XHigh
Mở session Claude Code mới **trong thư mục repo**, chọn model, dán **cả khối** dưới đây.

Cập nhật: 23/09/2026 (~00:30), bàn giao vì có model Opus mới. Khi session planning mới làm xong một chặng lớn, nó tự sửa file này cho lần bàn giao sau.

```
Bạn là SESSION PLANNING của dự án PISA Progress (web quản lý học viên, SOS, Case, Ý thức cho trung tâm
IELTS PISA). Bạn KHÔNG code sản phẩm. Việc của bạn: brainstorm (có mockup), viết/sửa kế hoạch, cập nhật
đặc tả, rà soát PR do session coding làm, soạn prompt cho session coding. Dùng skill superpowers phù hợp
(brainstorming, writing-plans, requesting-code-review...).

NGƯỜI DÙNG: chủ sản phẩm, KHÔNG biết code. Luôn giải thích bằng tiếng Việt cơ bản, nói theo "cái thấy trên
màn hình" trước tên file. Họ muốn web DỄ HIỂU · DỄ DÙNG · gọn, giao diện tinh tế (dấu tích nhỏ, cột hàng thẳng,
không dồn chữ). Họ muốn: hỏi GỘP một lần (tối đa 4 câu, mỗi câu có phương án + khuyến nghị); tự quyết khi đủ
tự tin và liệt kê lại "tôi đã tự quyết"; gộp PR khi các việc chạm cùng bộ file. Mockup nào cũng phải nói rõ
module NẰM Ở ĐÂU trong web (khu vực → trang → nút/menu, ai thấy).

CÁCH LÀM VIỆC (bắt buộc):
- Planning soạn kế hoạch chi tiết (giao agent soạn, mình rà từng quyết định Q1…Qn của agent) → session code
  làm → planning rà PR (agent khác model người code) → chỉ khi planning nói "merge được" chủ sản phẩm mới merge.
- MỌI prompt gửi session khác ghi MODEL + EFFORT + PHƯƠNG ÁN B. Người rà phải khác model người code.
- Kế hoạch soạn THEO TỪNG ĐỢT, ngay trước khi đợt chạy (mã đổi sau mỗi lần merge).
- Khi được hỏi "còn gì chưa làm": đối chiếu đặc tả với MÃ NGUỒN THẬT, đừng chỉ tin plan.md.

ĐỌC NGAY, THEO THỨ TỰ:
1. PROMPT_BAN_GIAO_PLANNING.md (file này) — phần "Tình trạng" bên dưới khối prompt.
2. docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md — ĐẶC TẢ CHÍNH (đọc hết; §7 là
   danh sách 16 PR + thứ tự đợt).
3. docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md — mã việc (O…, Q…, P…, R…, S…, YT-…, F-…,
   AN-…, RB-…, DOC-…), §5.2 ma trận chồng file.
4. thiet-ke/mockup/ (mở file HTML khi soạn kế hoạch trang tương ứng) · thiet-ke/THUAT_NGU_DA_CHOT.md (chữ).
5. Kế hoạch làm mẫu: docs/superpowers/plans/2026-09-22-pr-o-khung-4-khu-vuc.md (giao diện) và
   docs/superpowers/plans/2026-09-22-pr-s1-luat-may-chu.md (máy chủ). Kế hoạch của 3 PR đang code:
   …-pr-qa-hoc-vien-lop.md, …-pr-pa-tong-quan.md, …-pr-rc1-cham-diem.md (đọc khi rà PR tương ứng).
6. plan.md: chỉ banner đầu file + mục 3 (bảng quyết định, các dòng 20–22/09). Đừng đọc hết (>250 KB).
7. docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md Task 10–11 — deploy (đợt cuối).
Rồi chạy: git log --oneline -15 và gh pr list --state all --limit 10 để biết PR nào đã có/merge.

SAU KHI ĐỌC: tóm tắt cho chủ sản phẩm trong 10 dòng: đang ở đợt nào, PR nào đang chờ rà, việc tiếp theo
(kèm model/effort), họ cần làm gì. Rồi chờ yêu cầu.
```

---

## Tình trạng lúc bàn giao (23/09/2026, ~00:30)

Bàn giao vì có model mới (chủ sản phẩm nói **Opus 5.5**). Session planning cũ chạy Opus 5 · XHigh.
**Việc đầu tiên của session mới:** chạy `gh pr list --state open` — nếu có PR của Qa/Pa/Rc1 thì rà ngay (xem "Cách rà PR" bên dưới).

### Đã xong: đợt 1 và một phần đợt 2

| PR | Nội dung | Ghi chú rà soát |
|---|---|---|
| #56 PR-S1 | Luật máy chủ: tín hiệu SOS lớp thường (Tạo Case / Bỏ qua), S11–S17, RB-3/6/8/9, ngưỡng 70% | Rà bằng Fable 5.1 → merge được |
| #58 PR-O | Khung 4 khu vực, redirect, hàm ngày/tuần G-6, khu Test/Công việc | Chủ sản phẩm merge trước khi planning rà; rà lại sau merge (Opus 5) → ổn, 3 việc chuyển sang Qa/Ra |
| #61 PR-AN | Giới hạn lần thử đăng nhập/đăng ký, lỗi không lộ SQL, /api/health, hạn 10 s, hàm định kỳ chốt "-" | Rà bằng Fable 5.1 → merge được |
| #64 PR-S2 | Điều chỉnh PA học thuật: Giữ / Điều chỉnh / Thay / Kết thúc, lịch sử điều chỉnh, form Ghi kết quả 5 mục | Rà bằng Fable 5.1 → merge được |

`main` @ `236920d` sau #65. Phép kiểm trên main: **779**. Kế hoạch của mọi PR ở `docs/superpowers/plans/`.

### Đang chạy (3 session code song song)

| PR | Model người code (B) | Người rà | Tình trạng lúc bàn giao |
|---|---|---|---|
| **PR-Qa** Học viên & Lớp + Hồ sơ lớp | Fable 5.1 · High (B: Sonnet 5 · High) | Opus 5 | đang code, ~11 commit; nhánh `pr-qa-hoc-vien-lop` |
| **PR-Pa** Tổng quan | Fable 5.1 · High (B: Opus 5 · High) | Opus 5 | đang code, ~20 commit; nhánh `pr-pa-tong-quan` |
| **PR-Rc1** Cần chấm + Lịch Test + lưới chấm | Opus 5 · XHigh (B: Fable 5.1 · High) | Fable 5.1 | prompt đã đưa chủ sản phẩm, có thể chưa mở session; nhánh `pr-rc1-cham-diem` |

Cổng thử đã chia: Pa 4127/5327 · Qa 4137/5337 · Rc1 4147/5347. Không dùng 4000/5173.
Qa sở hữu phần sửa `shared/domain/hienThiNgay.ts` (Pa và Rc1 chỉ dùng, không sửa).
Rc1 **không** có migrate; Qa và Pa không có migrate → merge thứ tự nào cũng được, chỉ cần rebase.
Xung đột đã biết: Pa ↔ S2 ở `server/src/tests/run.ts` (giữ cả hai khối).

### Lộ trình còn lại — 7 đợt, 3 session song song

| Đợt | PR | Trạng thái |
|---|---|---|
| 1 | O · S1 · AN | ✅ merge xong |
| 2 | Qa · Pa · S2 | S2 ✅; Qa, Pa đang code |
| 3 | Qb hồ sơ HV · YT2 Ý thức · **Rc1** (kéo lên chạy sớm) | Rc1 có kế hoạch; **Qb, YT2 chưa soạn kế hoạch** |
| 4 | Pb Phân tích · Ra Công việc · Rc2 Kế hoạch Test | chưa soạn |
| 5 | GV hồ sơ GV · Form chọn người + bằng chứng · LT lên lớp/chuyển lớp | chưa soạn |
| 6 | S3 quét chữ toàn web | chưa soạn |
| 7 | Z2c deploy | kế hoạch có sẵn (plan 21/09 Task 10–11) |

Model từng PR + lý do xếp đợt: đặc tả §7. **Soạn kế hoạch ngay trước khi đợt chạy**, vì mã đổi sau mỗi lần merge.
Qb cần Qa merge xong; YT2 cần Qa; Ra cần Pa; Rc2 cần Rc1; Form cần S2+YT2+Ra; LT cần Qa+Qb.

### Cách soạn kế hoạch (đang chạy tốt)
Giao agent (Opus, chạy nền) với prompt gồm: (1) đọc đặc tả §ứng với PR + kiểm kê + mockup + 2 kế hoạch mẫu + mã thật;
(2) phạm vi và ranh giới file so với các PR đang chạy song song; (3) đầu kế hoạch ghi model/effort/phương án B/người rà/đợt/nhánh,
dòng "subagent cùng model, KHÔNG Haiku"; (4) mục KIỂM bấm thử theo vai + 375px, ảnh lưu `thiet-ke/anh/pr-…/`;
(5) lưu vào `docs/superpowers/plans/`, KHÔNG commit; (6) báo lại: bảng Q tự quyết · mâu thuẫn nguồn ↔ mã · câu cần chủ sản phẩm quyết · có migrate không.
Rồi planning rà bảng Q, sửa chỗ lệch (gửi lại agent), commit lên nhánh planning, mở PR tài liệu, đưa chủ sản phẩm prompt mở session code.

### Cách rà PR (đang chạy tốt)
Giao agent **khác model người code** (đọc dòng `Co-Authored-By` của commit để biết model thật), chạy nền, yêu cầu:
worktree tách rời `git worktree add --detach <tmp> origin/<nhánh>` + `npm ci` + `npm run check`, cổng thử chưa ai dùng,
không chạm Turso bản chính, gỡ worktree khi xong; đối chiếu kế hoạch + đặc tả + quyết định chủ sản phẩm; báo Critical/Important/Minor
kèm tình huống cụ thể; kết luận "merge được" hay không. Sau đó planning **ghi mọi việc theo sau vào đặc tả §7** (dòng PR sẽ sửa)
rồi mở PR tài liệu — không ghi thì việc biến mất.

### Quyết định cần nhớ (đầy đủ ở đặc tả §3, §5)
- **Lớp thường** (không viết "Normal" trên màn): Giữa khoá · Cuối khoá; điểm **số câu đúng / tổng số câu, cả hai đều điền**;
  đạt ≥ 70%; SOS là **tín hiệu từng môn** về GV môn đó, nút **Tạo Case / Bỏ qua** (lý do không bắt buộc); "-" = dời sang tuần sau.
- **Tuần** luôn `W3 SEP`, `W1 OCT`; tuần trong khoá `W8/8`.
- **Lộ trình tiếp theo** mặc định không hiện; **Chuyển lớp FT → FT giữ nguyên lộ trình**; FT chỉ kết thúc khi Kết luận lộ trình.
- S16 tự đóng Case chỉ khi em **thật sự dừng học**; PA đã xong có kết quả thật vẫn tính hiệu quả.
- PA học thuật: **Thay phương án được phép cả khi "Chưa đủ dữ liệu"** (PA cũ không vào thống kê, không vào F05) — planning sửa Q2 của kế hoạch S2.
- Form Ghi kết quả **giữ** nút "Xin hỗ trợ từ Quản lý" cả khi kết quả tốt (chủ sản phẩm 23/09).
- Đăng ký tài khoản: giữ `/auth/register`, QTHT duyệt; ngưỡng đăng ký sẽ nâng 10 → **30 lần/giờ/IP** ở Z2c.

### Bẫy đã gặp — đừng lặp lại
1. `plan.md` chép đặc tả không đủ → bỏ sót việc. Luôn đối chiếu với mã thật.
2. Lệnh bash dài nhiều dấu nháy/heredoc trên Windows hay hỏng — ghi file bằng Write rồi chạy.
3. Tin chủ sản phẩm gửi lúc session đang chạy dễ bị bỏ qua → dặn họ **bấm Stop rồi mới gửi**.
4. Chủ sản phẩm có thể merge trước khi planning rà (đã xảy ra với #58) → nhắc "chờ tôi nói merge được"; nếu lỡ merge thì rà sau merge.
5. Mockup rời rạc → luôn kèm vị trí (mẫu `12-ban-do-vi-tri.html`).
6. Agent soạn kế hoạch hay tự quyết lệch ý chủ sản phẩm → đọc kỹ bảng Q. Ví dụ thật: agent đặt ngưỡng đăng ký 10 lần/giờ/IP,
   cả chi nhánh chung wifi sẽ bị chặn ngày mở tài khoản; agent định chặn "Thay phương án" khi chưa đủ dữ liệu.
7. Session code có thể giao việc cho model nhỏ hơn kế hoạch (PR-O từng chạy Haiku 4.5) → prompt luôn ghi "subagent cùng model, KHÔNG Haiku";
   kiểm bằng `git log --format=%B main..<nhánh> | grep Co-Authored`.
8. Không bao giờ chạy lệnh vào DB bản chính; không `--prod` khi chưa được đồng ý; token lấy bằng `netlify env:get`.
9. Cổng: mỗi session một cặp riêng; agent rà cũng phải kiểm cổng trống trước khi gửi request (một agent từng gửi nhầm vào máy chủ của session khác).
10. Chủ sản phẩm thích gộp: nhiều kế hoạch + ghi chú rà soát đưa chung một PR tài liệu.
