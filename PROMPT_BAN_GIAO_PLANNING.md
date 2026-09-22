# Prompt bàn giao — session planning mới

**Model:** Opus 5 · XHigh · **B:** Opus 5 · High
Mở session Claude Code mới **trong thư mục repo**, chọn model, dán **cả khối** dưới đây.

Cập nhật: 22/09/2026 (tối). Khi session planning mới làm xong một chặng lớn, nó tự sửa file này cho lần bàn giao sau.

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
5. Kế hoạch đợt 1 làm mẫu: docs/superpowers/plans/2026-09-22-pr-o-khung-4-khu-vuc.md và
   docs/superpowers/plans/2026-09-22-pr-s1-luat-may-chu.md.
6. plan.md: chỉ banner đầu file + mục 3 (bảng quyết định, các dòng 20–22/09). Đừng đọc hết (>250 KB).
7. docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md Task 10–11 — deploy (đợt cuối).
Rồi chạy: git log --oneline -15 và gh pr list --state all --limit 10 để biết PR nào đã có/merge.

SAU KHI ĐỌC: tóm tắt cho chủ sản phẩm trong 10 dòng: đang ở đợt nào, PR nào đang chờ rà, việc tiếp theo
(kèm model/effort), họ cần làm gì. Rồi chờ yêu cầu.
```

---

## Tình trạng lúc bàn giao (22/09/2026 tối)

### Quyết định lớn 22/09
Chủ sản phẩm quyết định **làm HẾT mọi việc còn lại + làm lại UX theo mockup, rồi mới deploy bản chính** (Z2c để cuối).
Buổi brainstorm 22/09 đã duyệt toàn bộ mockup (khung 4 khu vực, Tổng quan, Phân tích, Công việc, Test, Học viên & Lớp,
hồ sơ lớp, hồ sơ HV/Hành trình, Ý thức, hồ sơ GV, lớp thường, lên lớp/chuyển lớp, bản đồ vị trí). Tất cả ghi ở đặc tả chính.

### Đã merge gần đây

| PR | Nội dung |
|---|---|
| #48, #49, #51 | Z2a hạ tầng Netlify + Turso · Z2b an toàn dữ liệu · Z2b2 phiên đăng nhập |
| #52 | PR-HV — hồ sơ học viên 3 tab, "biện pháp" → "phương án (PA)" |
| #53 | Planning: đặc tả UX toàn web, mockup, thuật ngữ đã chốt, kiểm kê, kế hoạch đợt 1 |

### Lộ trình — 7 đợt, 3 session code song song (chủ sản phẩm chốt 22/09 tối; xem demo ~10 phút sau mỗi đợt)

| Đợt | PR | Trạng thái |
|---|---|---|
| 1 | **PR-O** khung 4 khu vực (Sonnet 5 · High, B: Fable 5.1 · Medium) · **PR-S1** luật máy chủ (Opus 5 · XHigh, B: Fable 5.1 · High) · **PR-AN** an toàn (Opus 5 · High, B: Fable 5.1 · High) | O và S1 đang code (22/09 19:45: O xong 3/10 task — commit ghi **Haiku 4.5**, lệch kế hoạch; S1 xong 8/20). AN: kế hoạch đang soạn. Merge **O → S1 → AN**, cái sau rebase (chung `run.ts`, `routes/index.ts`) |
| 2 | PR-Qa Học viên & Lớp + Hồ sơ lớp · PR-Pa Tổng quan · PR-S2 điều chỉnh PA học thuật | chưa soạn kế hoạch |
| 3 | PR-Qb Hồ sơ HV · PR-YT2 Ý thức phần thiếu · PR-Rc1 Cần chấm + Lịch Test + lưới chấm | |
| 4 | PR-Pb Phân tích · PR-Ra Công việc · PR-Rc2 Kế hoạch Test | |
| 5 | PR-GV hồ sơ GV · PR-Form chọn người + bằng chứng · PR-LT lên lớp, chuyển lớp | |
| 6 | PR-S3 quét chữ toàn web | |
| 7 | PR-Z2c deploy | kế hoạch có sẵn (plan 21/09 Task 10–11) |

Lý do xếp đợt ở đặc tả §7. Model từng PR ở đặc tả §7. Khi soạn kế hoạch đợt mới: giao 3 agent song song (mẫu prompt: đọc đặc tả + kiểm kê + mockup,
dùng skill writing-plans, lưu `docs/superpowers/plans/2026-09-2x-pr-….md`, không commit, báo Q-quyết định + mâu thuẫn),
rồi mình rà từng quyết định, gửi agent sửa, commit lên nhánh planning, mở PR, đưa chủ sản phẩm prompt.

### Quyết định mới nhất cần nhớ (đầy đủ ở đặc tả §3, §5)
- **Lớp thường** (không viết "Normal" trên màn): 2 bài/khoá Giữa khoá · Cuối khoá; điểm **số câu đúng / tổng số câu, cả hai
  đều điền** (đề đổi theo mùa); đạt ≥ 70%; SOS chỉ báo **tín hiệu từng môn**, về GV môn đó, nút **Tạo Case / Bỏ qua** (lý do
  không bắt buộc); "-" = dời sang tuần sau.
- **Tuần** luôn viết `W3 SEP`, `W1 OCT`; tuần trong khoá `W8/8`. Không dùng "T5", "tuần 5".
- **Lộ trình tiếp theo** (lớp thường): mặc định KHÔNG hiện khoá tiếp theo; GVCN/QL ghi khi biết. **Chuyển tiếp lớp** cuối khoá
  điền sẵn từ đó, có bước Xác nhận. **Chuyển lớp FT → FT giữ nguyên lộ trình**; FT chỉ kết thúc khi Kết luận lộ trình.
- **Đăng ký tài khoản**: giữ `/auth/register` nhưng phải QTHT duyệt + giới hạn số lần thử.
- S16 (tự đóng Case) chỉ khi em **thật sự dừng học**; PA đã xong có kết quả thật vẫn tính hiệu quả.

### Bẫy đã gặp — đừng lặp lại
1. `plan.md` chép đặc tả không đủ → bỏ sót việc. Luôn đối chiếu với mã thật (kiểm kê 22/09 tìm ~25 yêu cầu chưa từng thành việc).
2. Lệnh bash dài có nhiều dấu nháy/heredoc trên Windows hay hỏng — ghi file bằng công cụ Write rồi chạy.
3. Tin chủ sản phẩm gửi khi một session đang chạy lọt vào kết quả công cụ và bị session đó từ chối như chữ lạ → dặn họ
   **bấm Stop rồi mới gửi**.
4. Chủ sản phẩm từng merge PR trước khi rà xong → luôn nhắc "chờ tôi nói merge được".
5. Mockup rời rạc làm chủ sản phẩm "không hiểu module nằm ở đâu" → luôn kèm vị trí (mockup `12-ban-do-vi-tri.html` là mẫu).
6. Agent soạn kế hoạch hay tự quyết lệch ý chủ sản phẩm (vd đóng Case khi lên lớp) → đọc kỹ bảng Q-quyết định của agent.
7. `.superpowers/` (mockup tạm của brainstorm) đã vào `.gitignore`; bản duyệt chép sang `thiet-ke/mockup/`.
8. Không bao giờ chạy lệnh vào DB bản chính; không `--prod` khi chủ sản phẩm chưa đồng ý; token lấy bằng `netlify env:get`, không xin qua chat.
9. Không dùng cổng 4000/5173 khi chủ sản phẩm đang chạy demo.
