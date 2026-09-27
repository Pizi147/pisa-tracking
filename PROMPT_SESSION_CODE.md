# Prompt cho session coding

Copy **cả khối** trong khung của PR cần làm, dán vào một session Claude Code **mới**. Một PR một session.
Cập nhật: 21/09/2026 (chiều). Lộ trình: `plan.md` mục 23–24 · plan chi tiết bản chính:
`docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`.

**Đã xong:** PR-N (#32) · PR-J (#34) · PR-T (#39) · PR-K (#42).

---

## 0. Chọn model và mức suy nghĩ (effort) cho từng PR

> **Cập nhật 27/09/2026 (yêu cầu 16 của chủ sản phẩm):** người **rà chéo** luôn là **Opus 5.5** ở một session riêng —
> không đổi sang Fable để rà nữa. Nếu PR do Opus 5.5 code thì vẫn rà bằng Opus 5.5 nhưng **session khác**. Bảng model
> của các PR đợt 1–6 sau deploy nằm ở `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §8 (bảng
> dưới đây là của các PR cũ, giữ làm lịch sử).

**Cách làm việc:** session **planning** (Opus) viết kế hoạch chi tiết → session **coding** làm theo → quay lại session
planning rà soát. Chọn model ở ô chọn model của Claude Code **trước khi dán prompt**. Tên mức effort có thể khác một
chút trên giao diện — chọn mức **gần nhất**.

| PR | Làm gì | **Khuyến nghị** | **Phương án B** | Tách thêm? | Vì sao |
|---|---|---|---|---|---|
| **PR-T** | Luật SOS v3 phía máy chủ | Sonnet 5 · High | Fable 5.1 · High | Không | Đặc tả rất chi tiết, có mã luật để viết phép kiểm. Dùng B nếu Sonnet kẹt ở phép kiểm luật quá 2 lần |
| **PR-K** | Giao diện Ý thức & Phối hợp | Sonnet 5 · High | Fable 5.1 · High | Không | Làm giao diện theo bố cục đã khoá, chữ đã viết sẵn |
| **PR-K2** | Sửa 4 lỗi sau rà soát PR-K (`plan.md` 23.3b) | Sonnet 5 · High | Fable 5.1 · Medium | Có — PR riêng | Nhỏ, chỉ giao diện, chạy song song với Z2a |
| **PR-Z2a** | Hạ tầng Netlify + Turso (Task 0–6b) | **Fable 5.1 · High** *(đổi 22/09)* | Sonnet 5 · High | Không | Thử thật 22/09: lỗi nặng nhất chỉ lộ sau khi gói mã; có 2 cửa dừng + deploy nháp thật → cần phán đoán tốt. Người rà: session planning (Opus) |
| **PR-HV** | Hồ sơ học viên + Ý thức & Phối hợp theo prototype v3, đổi "biện pháp" → "phương án", bỏ "Hãy" | **Fable 5.1 · High** | Opus 5 · High | Không | Giao diện lớn, thành phần dùng chung hai trang; đổi chữ phải vào cùng lúc. Song song Z2b; Z2c đợi PR này |
| **PR-Z2b** | An toàn dữ liệu bản chính (Task 6c–9) | **Opus 5 · XHigh** | Fable 5.1 · High | — | Một quyết định sai ở đây có thể chạm **dữ liệu thật** → dùng model mạnh |
| **PR-Z2c** | Deploy bản chính + đo tốc độ + rà soát (Task 10–11) | **Opus 5 · XHigh** | Fable 5.1 · High | — | Chạm dữ liệu thật + quyết định tối ưu trang chậm. **Người rà: Fable 5.1** (khác Opus đã code Z2b — session planning cho agent Fable rà) |
| *Rà soát sau mỗi PR* | Dán vào session planning | Opus 5 · High | Opus 5 · XHigh (PR lớn) | — | Người rà khác người code |
| PR-O *(sau deploy)* | Điều hướng 4 khu vực | Sonnet 5 · High | Fable 5.1 · Medium | Không | Phạm vi hẹp |
| PR-Q *(sau deploy)* | Học viên & Lớp · hồ sơ lớp/HV | Sonnet 5 · High | Fable 5.1 · High | Không | Giao diện rộng nhưng đặc tả đã có |
| PR-P *(sau deploy)* | Tổng quan · Phân tích | Sonnet 5 · High | Fable 5.1 · High | Thường không | Chỗ nào định nghĩa số liệu còn mơ hồ → nhờ Opus rà riêng, không cần tách PR |
| PR-R *(sau deploy)* | Công việc · Kế hoạch Test · đường vào nhập điểm | **Opus 5 · XHigh** | Fable 5.1 · High | Không | PR lớn và phức tạp nhất — dùng model mạnh ngay từ đầu |
| PR-S *(sau deploy)* | Biên tập chữ · nợ kỹ thuật | Sonnet 5 · High | Fable 5.1 · Medium | Không | Chỉ nâng model nếu PR bắt đầu đụng luật nghiệp vụ |
| Session planning mới | Tiếp nối session này | **Opus 5 · XHigh** | Opus 5 · High | — | Viết kế hoạch + rà soát cần suy luận dài |

**Muốn đơn giản hơn:** chạy **cả ba PR-Z2a/b/c bằng Fable 5.1 · High** — tốn hơn một chút nhưng khỏi đổi model giữa
chừng. Khi đó phần rà soát ở Task 11 phải làm ở session planning (Opus), vì người rà phải khác người code.

---

## 1. Thứ tự làm

```
PR-T  → rà soát → merge                       ✅ #39
PR-K  → rà soát → merge                       ✅ #42
PR-K2  ┐ chạy SONG SONG được (khác bộ file) → rà soát → merge (K2 trước nếu xong cùng lúc)
PR-Z2a ┘ (không hỏi token — bạn đã làm TRIEN_KHAI mục 2-5; chỉ dừng nếu cửa 🛑 không đạt)
PR-Z2b ┐ chạy SONG SONG (PR-HV đóng băng các file của Z2b tới Task 9)
PR-HV  ┘ → rà soát → merge
PR-Z2c → rà soát → merge        (CHỈ sau khi PR-Z2b VÀ PR-HV đã merge — chủ sản phẩm chốt 22/09; sẽ dừng hỏi bạn: database Turso CHÍNH; TRIEN_KHAI mục 6-7; xin phép đưa lên chính thức)
```

**Không chạy song song** hai PR nào ở trên — mỗi PR dựa vào PR trước đã merge. **Ngoại lệ duy nhất:** PR-K2 và PR-Z2a
(khác bộ file, đã kiểm 22/09), và PR-Z2b với PR-HV (PR-HV đóng băng file của Z2b tới Task 9).
Merge xong một PR thì **mở session mới** cho PR sau — đừng dán tiếp vào session cũ.

**Có gộp Z2b + Z2c thành một mạch không? — Không (chốt 22/09).** Cùng model (Opus 5 · XHigh) thì được, nhưng **giữa hai
phần bắt buộc có một lượt rà soát + merge.** Lý do: Z2b viết đúng những lệnh sẽ chạy lên database **chính** (khởi tạo, thêm
chi nhánh, sao lưu); Z2c **chạy** chúng. Gộp liền một mạch = chạy mã chạm dữ liệu thật **trước khi** có người thứ hai đọc
nó. Chỗ tiết kiệm được chỉ là một lần mở session (~5 phút); cái giá nếu lệnh khởi tạo sai là làm lại bản chính. Tách
vẫn nhanh: Z2b nhỏ (~1 giờ), rà trong 15 phút.

---

## PR-T — Máy chủ theo rulebook v3

**Model:** Sonnet 5 · High · **B:** Fable 5.1 · High

```
Làm PR-T ở plan.md mục 23.1, chỉ PR-T. Chỉ máy chủ + shared/domain + seed demo, KHÔNG sửa giao diện.

Skill superpowers dùng (gọi bằng tool Skill):
- using-git-worktrees: tạo nhánh pr-t-may-chu-v3 trước khi code.
- test-driven-development: BẮT BUỘC cho mọi mã luật S01-S09, P01-P10, V11'-V14' — phép kiểm đỏ trước.
- systematic-debugging: chỉ khi có phép kiểm gãy mà chưa rõ vì sao.
- verification-before-completion: npm run check xanh trước khi báo xong.
- requesting-code-review: MỘT lượt rà diff trước khi mở PR (luật dữ liệu thật — đáng làm).
- finishing-a-development-branch: commit, push, mở PR (không draft). KHÔNG tự merge.
Không cần: brainstorming, executing-plans, kiểm ngược (mutation), chụp ảnh.

Đọc trước khi code: thiet-ke/SOS_VA_PHOI_HOP_V3.md (đặc tả chính — đọc hết), rule book mục 19,
plan.md mục 23.0-23.1.

Ba chỗ dễ sai nhất:
1. Chỉ lượt Mock Test FAST TRACK mới tự tạo case / điền sẵn phương án / Phối hợp SOS. Lớp Normal
   giữ nguyên mô hình tín hiệu cũ — có phép kiểm khoá điều này (nghiệm thu §10 mục 8).
2. Chạy lặp (lưu điểm lại, chấm lại) không được nhân đôi case, phương án, việc phối hợp.
   Tận dụng dedup_key của case_signals và UNIQUE của sos_coordination_actions.
3. Sửa điểm làm SOS giảm/hết: việc phối hợp 'done' và phương án đã xác nhận KHÔNG bị xoá.

Phương án điền sẵn chưa xác nhận KHÔNG vào effectiveness.ts và KHÔNG sinh nghĩa vụ cập nhật tuần.

Kế hoạch sai/thiếu so với mã thật: sửa tại chỗ trong plan.md và ghi một dòng mục 14. Nếu phải CHỌN
GIỮA HAI CÁCH LÀM VỀ NGHIỆP VỤ: dừng lại hỏi tôi, không tự chọn.

Báo xong bằng tiếng Việt cơ bản (tôi không đọc code): đã làm gì, số phép kiểm, link PR, cái gì CHƯA làm.
```

---

## PR-K — Giao diện Ý thức & Phối hợp  *(sau khi PR-T đã merge)*

**Model:** Sonnet 5 · High · **B:** Fable 5.1 · High

```
Làm PR-K ở plan.md mục 23.3, chỉ PR-K. PR-T đã merge.

Skill superpowers dùng:
- using-git-worktrees: nhánh pr-k-giao-dien-y-thuc-v3.
- verification-before-completion: npm run check xanh + bấm thử MỘT lượt mỗi vai (GVBM, GVCN,
  Quản lý) + khổ 375px, theo nghiệm thu §10 mục 5, 7, 9-15 của SOS_VA_PHOI_HOP_V3.md.
- systematic-debugging: chỉ khi gặp lỗi chưa rõ nguyên nhân.
- finishing-a-development-branch: commit, push, mở PR. KHÔNG tự merge.
Không cần: TDD cho giao diện (chỉ dùng nếu phải thêm hàm máy chủ), brainstorming,
requesting-code-review, kiểm ngược, chụp ảnh.

Đọc: thiet-ke/SOS_VA_PHOI_HOP_V3.md mục 7 (bố cục — THẮNG Y_THUC_VI_PHAM_VA_BIEN_PHAP.md §7 ở chỗ
khác nhau), Y_THUC §7.2 §7.4 §7.5 (ba form giữ nguyên), TU_DIEN_VA_CHU.md mục 6-7 (mọi chữ đã viết
sẵn, đừng tự sáng tác). Prototype tham khảo: thiet-ke/tham-khao/*.html — chỉ để hình dung.

Nguyên tắc: GVCN nhìn THEO HỌC SINH trước. Mở rộng tại chỗ, không trang mới, không thẻ số lớn.
Mọi ràng buộc nói trước khi bấm (nút mờ kèm câu thiếu gì), không báo lỗi đỏ sau khi bấm.
Tận dụng StudentDetailPage, ClassOverviewPage, SkillBoard, IssueAnalysis, BangChung, SoLieu có sẵn.
Chưa đổi hồ sơ lớp thành 4 tab (việc sau deploy) — chỉ thay tab Ý thức.
PR-T đã để sẵn cho bạn (đọc ghi chú 12 và 14 dưới mục 23.1): dòng "case chờ xác định nguyên nhân"
của GVBM đã có ở máy chủ (nhóm cause trong myWork) — chỉ VẼ ra, đừng viết lại luật; và một chữ cứng
"Cần chú ý" còn sót ở CaseBoardPage.tsx phải đổi sang đọc URGENCY_LABEL (việc K6b).

Báo xong bằng tiếng Việt cơ bản: link PR, vai nào đã bấm thử, cái gì CHƯA làm.
```

---

## PR-K2 — Sửa sau rà soát PR-K  *(chạy song song được với PR-Z2a)*

**Model:** Sonnet 5 · High · **B:** Fable 5.1 · Medium · **Tách PR riêng:** có — khác bộ file với Z2a, nhỏ, rà nhanh.
**Để sẵn:** ~1 giờ. Không dừng hỏi bạn, trừ khi phải sửa file của Z2a.

```
Làm PR-K2 ở plan.md mục 23.3b, chỉ PR-K2 (K2-1 → K2-7). PR-K (#42) đã merge.
Đây là sửa sau rà soát: KHÔNG thêm tính năng ngoài danh sách, KHÔNG đổi luật nghiệp vụ.
Việc ở K2-6 là GHI LẠI, không làm.

Một session khác có thể đang làm PR-Z2a cùng lúc. KHÔNG sửa: server/src/db.ts, server/src/platform/attachments.ts,
server/src/yThuc/violations.ts, server/src/routes/index.ts phần /demo và /auth/info, web/src/App.tsx,
web/src/modules/platform/WelcomePage.tsx, package.json. Buộc phải sửa → dừng, ghi plan.md mục 14, hỏi tôi.

Skill superpowers (gọi bằng tool Skill):
- using-git-worktrees: nhánh pr-k2-sua-sau-ra-soat.
- test-driven-development: CHỈ nếu K2-1 phải sửa máy chủ (phép kiểm "số = số dòng danh sách" đỏ trước).
- systematic-debugging: khi gặp lỗi chưa rõ nguyên nhân.
- verification-before-completion: npm run check xanh + bấm thử đúng các kịch bản ở K2-7, dán kết quả thật.
- finishing-a-development-branch: commit, push, mở PR (không draft). KHÔNG tự merge.

Đọc trước: plan.md mục 23.3b; thiet-ke/SOS_VA_PHOI_HOP_V3.md §7.1, §7.5, §7.6; thiet-ke/TU_DIEN_VA_CHU.md mục 6-7.
Nguyên tắc: ràng buộc nói TRƯỚC khi bấm (nút mờ + câu thiếu gì), không báo lỗi đỏ sau khi bấm; mọi số bấm ra đúng
danh sách; chữ lấy từ TU_DIEN_VA_CHU.md, không tự sáng tác.

Báo xong bằng tiếng Việt cơ bản: link PR, số phép kiểm trước/sau, kịch bản nào đã bấm thử, cái gì chưa làm.
```

---

## PR-Z2a — Hạ tầng bản chính  *(PR-T và PR-K đã merge)*

**Model:** **Fable 5.1 · High** · **B:** Sonnet 5 · High
**Vì sao không còn Sonnet:** ngày 22/09 session planning đã chạy thử thật và thấy lỗi quan trọng nhất chỉ lộ ra **sau khi
Netlify gói mã** (máy chủ sập lúc nạp). Kế hoạch đã có sẵn cách sửa và lệnh tự kiểm, nhưng phần này có 2 cửa dừng, deploy
nháp thật và đo tốc độ, nên cần model phán đoán tốt hơn. Người rà sau đó là session planning (Opus), khác model người code.
**Tách thêm:** không — Task 0→6b là một khối hạ tầng, tách nữa thì PR giữa chừng không chạy được.
**Để sẵn:** ~2–3 giờ. Bạn **đã làm xong** TRIEN_KHAI mục 2 (database thử), 3, 4, 5 nên session **không** hỏi token.
Nó chỉ dừng hỏi nếu: Netlify CLI chưa đăng nhập, biến của site trỏ nhầm database, hoặc một cửa dừng 🛑 không đạt.
**Máy phải bật và có mạng suốt lúc chạy** (nó deploy nháp từ máy bạn).

```
Bạn thực thi PHẦN A (PR-Z2a) của kế hoạch đưa PISA Progress lên làm BẢN CHÍNH trên Netlify + Turso.
Dữ liệu thật của trung tâm sẽ nằm trên hạ tầng này. Chất lượng và an toàn quan trọng hơn tốc độ.

KẾ HOẠCH: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md
Bạn CHỈ làm Task 0 → Task 6b (Phần A). KHÔNG làm Task 7 trở đi dù thấy tiện.
Đọc HẾT file kế hoạch trước khi gõ lệnh đầu tiên — bảng "SỬA 22/09/2026 SAU THỬ THẬT" ở đầu, "Global Constraints",
"Ba phần — ba PR", "Hướng dẫn riêng cho model thực thi" (mục 8–10 mới), rồi plan.md mục 24 và TRIEN_KHAI.md.
Chỗ nào ghi "🆕 22/09" là đã được chạy thử thật trên mã hiện tại — nó THẮNG chữ cũ bên cạnh.

TÌNH TRẠNG LÚC BẮT ĐẦU (22/09):
- main đã có PR-T (#39) và PR-K (#42). Có thể đã có thêm PR-K2 — không sao, N0 sẽ lớn hơn 581.
- Chủ sản phẩm ĐÃ làm TRIEN_KHAI mục 2 (database THỬ pisa-thu-nghiem, vùng Ohio), 3 (Netlify CLI, đã đăng nhập),
  4 (site đã tạo và nối — .netlify/state.json nằm trên main), 5 (ba biến trỏ database THỬ).
  → Lấy URL/token bằng `netlify env:get` như Task 3 Step 1. KHÔNG xin token qua chat.
- Một session khác có thể đang làm PR-K2 (web/src/modules/yThuc/*, SkillBoard.tsx, CaseSosControls.tsx). Đừng sửa
  các file đó.

CÁCH LÀM:
- Làm ĐÚNG thứ tự, tick từng bước (- [x]) ngay trong file kế hoạch. Mỗi task: npm run check xanh (số phép kiểm KHÔNG
  giảm) → một commit. Ghi số phép kiểm + mọi điều bất ngờ + mọi chỗ phải tự quyết vào "Nhật ký thực thi" cuối file.
- Trước mỗi commit tự rà diff: chỉ chạm đúng các file ở mục "Files" của task? Không có token/mật khẩu?
- Task 5 có lệnh mới `npm run thu-goi` (gói máy chủ như Netlify rồi chạy ở thư mục khác). Nó phải HỎNG khi bỏ
  Step 1b và ĐẠT khi có — chứng minh cả hai chiều, ghi Nhật ký. Đây là chốt chặn lỗi nặng nhất đã tìm thấy.

SKILL SUPERPOWERS (gọi bằng tool Skill, đúng lúc — bảng ở "Hướng dẫn riêng cho model thực thi" mục 10):
- using-git-worktrees (Task 0, nhánh pr-z2a-ha-tang) · executing-plans (suốt quá trình)
- test-driven-development: mọi bước "Phép kiểm đỏ" — chạy thấy ĐỎ trước, ghi lại, rồi mới viết mã.
- systematic-debugging: BẤT KỲ lúc nào check đỏ, gói lỗi, hay địa chỉ nháp lỗi mà chưa rõ vì sao. KHÔNG sửa phép kiểm cũ cho xanh.
- verification-before-completion: trước khi đánh dấu xong mỗi cửa dừng (Task 3, Task 6b) và trước khi mở PR.
- requesting-code-review: sau Task 6b, cho một agent rà TOÀN BỘ diff Phần A đối chiếu kế hoạch (nhất là: vá _metadata,
  THU_MUC_MA, chặn /demo, kho tệp, không token trong repo). Rồi receiving-code-review để xử lý góp ý có lý lẽ.
- finishing-a-development-branch: mở PR (không draft). KHÔNG tự merge.
Không cần: brainstorming, writing-plans, kiểm ngược, chụp ảnh.

NĂM ĐIỀU TUYỆT ĐỐI:
1. KHÔNG đổi kiểu gọi database sang async (không thêm await vào prepare/get/all/run). Gate Task 3 hoặc 6b không
   đạt → DỪNG, báo tôi. Không tự nghĩ đường khác.
2. KHÔNG ghi token, mật khẩu, URL có token vào bất kỳ file nào trong repo, Nhật ký, PR, hay câu trả lời.
3. Chỉ dùng database Turso THỬ. URL lấy từ Netlify không chứa "pisa-thu-nghiem" → DỪNG NGAY, báo tôi.
4. KHÔNG `netlify deploy --prod` trong Phần A. Chỉ deploy NHÁP (`netlify deploy --build`, không --prod).
5. KHÔNG đổi luật nghiệp vụ, KHÔNG dọn mã hay tối ưu ngoài task. Thấy gì đáng sửa → ghi plan.md mục 12.

KHI NÀO DỪNG HỎI TÔI (tôi không biết code — nói tôi bấm gì, mục nào của TRIEN_KHAI.md):
- `netlify status` không ra tên site, hoặc thiếu biến môi trường → nói đúng mục TRIEN_KHAI cần làm lại.
- Một cửa dừng 🛑 rơi vào ô "Dừng" của bảng quyết định trong kế hoạch.
- Mã thật khác kế hoạch tới mức phải chọn giữa hai cách: dừng, ghi Nhật ký, hỏi. Đừng đoán.

KHI XONG, báo tôi bằng tiếng Việt cơ bản: link PR; địa chỉ bản nháp đã chạy; 8 dòng kiểm trên địa chỉ nháp
(đạt/hỏng); bảng thời gian tải 7 trang; số phép kiểm trước/sau; góp ý rà soát đã xử lý; việc tôi cần làm tiếp.
```

---

## PR-HV — Hồ sơ học viên + Ý thức & Phối hợp theo prototype v3  *(chạy song song với PR-Z2b; Z2c đợi PR này)*

**Model:** **Fable 5.1 · High** · **B:** Opus 5 · High (nếu dùng B thì người rà là Fable/Sonnet, không phải Opus)
**Tách PR:** không — thành phần dùng chung cho cả hồ sơ học viên lẫn hồ sơ lớp, và đổi chữ "biện pháp" → "phương án"
phải vào cùng lúc trên mọi màn (tách ra thì có lúc màn này ghi "biện pháp", màn kia ghi "phương án" cho cùng một thứ).
**Để sẵn:** ~4–5 giờ. Session sẽ dừng hỏi bạn: (1) trước khi chạy bản demo trên máy (nếu bạn đang mở demo thì tắt);
(2) ở Task 9 — chỉ làm tiếp khi **PR-Z2b đã merge**.

```
Làm PR-HV theo kế hoạch docs/superpowers/plans/2026-09-22-ho-so-hoc-vien-overhaul.md (Task 0 → Task 10).
Đặc tả đã duyệt: docs/superpowers/specs/2026-09-22-ho-so-hoc-vien-overhaul-design.md.
Hình của chủ sản phẩm: thiet-ke/tham-khao/ho-so-hoc-vien-v3.html và thiet-ke/tham-khao/ho-so-lop-v3.html.
Đọc HẾT kế hoạch và đặc tả trước khi gõ lệnh đầu tiên — nhất là "Global Constraints", "Hướng dẫn riêng cho model
thực thi", "Kiểu dữ liệu thật mà giao diện dùng".

MỤC TIÊU (tiếng thường): hồ sơ học viên thành 3 tab ngay dưới đầu trang (Học thuật · Ý thức & Phối hợp · Hành trình),
4 ô số mới, thẻ case học thuật gọn kiểu thẻ SOS với mỗi phương án một khối 3 phần, tab Ý thức & Phối hợp của hồ sơ
học viên và hồ sơ lớp làm theo prototype v3; đổi mọi chữ "biện pháp"/"BP" người dùng thấy thành "phương án"/"PA"
(màn trộn: "PA xử lý" / "PA học thuật"); bỏ "Hãy" ở đầu câu nhắc.

CHẠY SONG SONG VỚI PR-Z2b (hạ tầng bản chính). TUYỆT ĐỐI không sửa trước Task 9: server/src/db.ts,
server/src/migrate.ts, server/src/migrate/run.ts, server/src/moiTruong.ts, server/src/platform/khoTep.ts,
server/src/platform/attachments.ts, server/src/yThuc/measures.ts, server/src/ops/*, server/src/seed/*,
server/src/tests/banChinh.tests.ts, TRIEN_KHAI.md, package.json. Task 9 là cửa 🛑: chỉ làm khi PR-Z2b ĐÃ merge vào
main (gộp main vào nhánh trước). Chưa merge → dừng, báo tôi.

Lưu ý: tôi có thể đang mở bản demo bằng npm run dev ở thư mục chính (cổng 4000 và 5173). Trước khi chạy npm run dev
hoặc bất cứ thứ gì dùng hai cổng đó, DỪNG và nhắn tôi tắt demo — đừng chạy song song.

SKILL SUPERPOWERS (bảng đầy đủ ở "Hướng dẫn riêng cho model thực thi"):
- using-git-worktrees (nhánh pr-hv-ho-so-hoc-vien) · executing-plans (suốt quá trình, tick từng bước trong file kế hoạch)
- test-driven-development: mọi hàm thuần ở shared/domain/hoSoHocVien.ts và mọi trường máy chủ mới — đỏ trước, rồi xanh.
- frontend-design: CHỈ cho quyết định hình ảnh nằm trong khuôn đặc tả (khoảng cách, cỡ chữ, màu từ ui.tsx) — không đổi thiết kế.
- systematic-debugging: khi đỏ/lỗi chưa rõ. KHÔNG sửa phép kiểm cũ cho xanh (trừ phép bám câu chữ đã đổi — kế hoạch liệt kê).
- verification-before-completion: ảnh trước/sau ở thiet-ke/anh/pr-hv/ (desktop + 375px, ba vai), dán kết quả lệnh thật.
- requesting-code-review (một agent rà cả diff) → receiving-code-review, trước khi mở PR.
- finishing-a-development-branch: PR không draft, KHÔNG tự merge.

BA ĐIỀU TUYỆT ĐỐI:
1. KHÔNG đổi luật nghiệp vụ, quyền, API hay tên trong mã/database. Chỉ đổi giao diện và chữ hiển thị (+ hai trường
   chỉ-đọc kế hoạch đã nêu: attachmentCount, headline.next.overdue).
2. Chữ lấy từ đặc tả §5 và thiet-ke/TU_DIEN_VA_CHU.md — không tự sáng tác. Thiếu câu → ghi TU_DIEN kèm "(PR-HV, chờ duyệt)".
3. Dữ liệu thật thiếu trường mà thiết kế cần, hoặc phải chọn giữa hai cách → dừng, ghi Nhật ký, hỏi tôi. Đừng đoán.

KHI XONG, báo tôi bằng tiếng Việt cơ bản: link PR; ảnh trước/sau đã lưu ở đâu; vai nào đã bấm thử; số phép kiểm
trước/sau; Task 9 đã làm chưa; góp ý rà soát đã xử lý; cái gì chưa làm.
```

---

## PR-Z2b — An toàn dữ liệu bản chính  *(sau khi PR-Z2a đã merge)*

**Model:** **Opus 5 · XHigh** · **B:** Fable 5.1 · High
**Để sẵn:** ~2 giờ (thêm Task 6c–6e sau rà soát Opus 22/09). Không cần bạn cung cấp gì — phần này làm trên máy, với
database thử và file tạm. Nó sẽ thử một lệnh Netlify bằng một biến vô hại (không đụng database).

```
Bạn thực thi PHẦN B (PR-Z2b) của kế hoạch đưa PISA Progress lên làm BẢN CHÍNH trên Netlify + Turso.
Phần này viết các lệnh CHẠM DỮ LIỆU THẬT: khởi tạo database bản chính, thêm chi nhánh, sao lưu.
Một lỗi ở đây có thể làm mất hoặc hỏng dữ liệu thật của trung tâm. Cẩn thận hơn tốc độ.

KẾ HOẠCH: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md
Bạn CHỈ làm Task 6c → 6d → 6e → 7 → 8 → 9 (Phần B). PR-Z2a đã merge.
Ba task 🆕 22/09 làm TRƯỚC Task 7 — đều từ rà soát độc lập Opus của Phần A:
  6c  chốt seed so NGUYÊN tên máy chủ + chặn cứng tên bản chính (tên bản chính "pisatracking" nằm trọn trong
      tên bản thử "pisatracking-demo"). Phần A đã dời chốt vào recreateSchema — Step 4 của 6c đã được viết lại
      cho khớp mã thật; KHÔNG thêm chốt thứ hai ở seed/run.ts.
  6d  npm run migrate vào Turso phải có xác nhận, và KHÔNG tạo tài khoản admin/mật khẩu mặc định pisa2026.
  6e  bản nháp luôn dùng database thử, chỉ bản chính thức dùng pisatracking; kho tệp theo database; xoá tệp sau
      giao dịch ở deleteMeasure; viết lại TRIEN_KHAI mục 5-6-8 (biến môi trường theo loại deploy).
Trước khi gõ lệnh: đọc HẾT file kế hoạch, và ĐỌC KỸ bảng "Nhật ký thực thi" — Phần A đã ghi ở đó những gì
khác kế hoạch (thư viện, đường dẫn, tên cột...). Rồi đọc TRIEN_KHAI.md mục 7 và 10 (chủ sản phẩm sẽ làm
đúng theo đó — lệnh và tên biến phải khớp từng chữ).

CÁCH LÀM:
- superpowers:executing-plans · nhánh pr-z2b-an-toan-du-lieu (superpowers:using-git-worktrees).
- Tick từng bước trong file kế hoạch, ghi Nhật ký sau mỗi task. npm run check xanh → commit.
- superpowers:test-driven-development BẮT BUỘC cho Task 6c, 6d, 6e, 7 và 8: viết phép kiểm, chạy thấy ĐỎ, ghi lại,
  rồi mới viết mã. Đặc biệt ba tính chất sau PHẢI có phép kiểm chứng minh:
    (a) init-ban-chinh TỪ CHỐI khi database đã có bất kỳ dữ liệu nào, và khi từ chối thì KHÔNG ghi gì cả;
    (b) init-ban-chinh không tạo bất cứ dữ liệu demo nào và không đặt ngày demo;
    (c) file sao lưu mở lại được và mọi bảng có đúng số dòng như nguồn.
- Task 7 Step 1-2 là CHUYỂN CHỖ mã (cắt-dán), không viết lại. Số phép kiểm phải KHÔNG đổi sau bước đó.
- superpowers:systematic-debugging khi đỏ mà chưa rõ vì sao. Không sửa phép kiểm cũ cho xanh.
- Trước khi kết thúc: tự rà lại mọi đường trong init-ban-chinh, them-chi-nhanh, sao-luu và trả lời bằng
  chữ vào Nhật ký: "Có đường nào ghi đè / xoá dữ liệu đã có không?" — câu trả lời phải là KHÔNG, kèm lý do.
- superpowers:verification-before-completion → superpowers:finishing-a-development-branch (không draft,
  KHÔNG tự merge).

BA ĐIỀU TUYỆT ĐỐI:
1. KHÔNG chạy bất kỳ lệnh nào với database Turso bản chính. Kiểm bằng file tạm và database THỬ. KHÔNG đổi, xoá
   hay đặt lại hai biến TURSO_* thật trên Netlify — Task 6e chỉ thử cú pháp bằng biến vô hại PISA_THU_NGU_CANH.
2. KHÔNG ghi token, mật khẩu vào repo. Không xin mật khẩu quản trị của tôi.
3. KHÔNG đổi luật nghiệp vụ, không làm task của Phần A hay Phần C.

Mã thật khác kế hoạch tới mức phải chọn giữa hai cách → dừng, ghi Nhật ký, hỏi tôi.

KHI XONG, báo tôi bằng tiếng Việt cơ bản: link PR; ba lệnh mới đã chạy thử được chưa; số phép kiểm
trước/sau; câu trả lời cho "có đường nào ghi đè dữ liệu không"; việc còn lại.
```

---

## PR-Z2c — Deploy bản chính + rà soát độc lập  *(sau khi PR-Z2b VÀ PR-HV đã merge)*

**Model người CODE Phần C:** **Opus 5 · XHigh** · **B:** Fable 5.1 · High
**Người RÀ (🆕 22/09, chốt):** Phần B (PR-Z2b, PR-Z2b2) do **Opus** code → người rà **PHẢI khác Opus** → **người rà là
Fable 5.1**: session planning cho một agent **Fable** rà toàn bộ PR-Z2a + PR-Z2b + PR-Z2b2 + PR-Z2c. Session code (Opus)
vẫn tự chạy `requesting-code-review` ở Task 11, nhưng lượt đó **không thay được** lượt rà Fable.
**Điều kiện bắt đầu:** `main` đã có PR-Z2b (#49), PR-Z2b2 **và PR MÃ của PR-HV** — PR #50 chỉ là kế hoạch PR-HV, không tính.
**Để sẵn:** ~1,5–2 giờ **ngồi cùng máy**. Session sẽ dừng hỏi bạn: tạo database **chính** (`TRIEN_KHAI.md` mục 2),
đổi biến (mục 6), chạy khởi tạo (mục 7), rồi cùng bấm thử 12 bước, và **xin phép** trước khi đưa lên chính thức.

```
Bạn thực thi PHẦN C (PR-Z2c): đưa PISA Progress lên BẢN CHÍNH THẬT trên Netlify + Turso, kiểm trên địa chỉ
thật, đo tốc độ, và rà soát độc lập toàn bộ PR-Z2a + PR-Z2b.
Sau phần này giáo viên thật sẽ dùng web. Cẩn thận hơn tốc độ.

KẾ HOẠCH: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md
Bạn CHỈ làm Task 10 → Task 11 (Phần C). PR-Z2a, PR-Z2b (#49) và PR-Z2b2 (phiên đăng nhập) đã merge; PR MÃ của PR-HV cũng phải đã merge (PR #50 chỉ là kế hoạch).
Đọc HẾT file kế hoạch và TOÀN BỘ bảng "Nhật ký thực thi" (Phần A và B đã ghi mọi điều khác kế hoạch).
Đọc TRIEN_KHAI.md — tôi (chủ sản phẩm, không biết code) sẽ làm đúng theo file đó.

CÁCH LÀM:
- superpowers:executing-plans · nhánh pr-z2c-deploy (superpowers:using-git-worktrees) — chỉ cần nếu Task 10
  Step 6 phải sửa mã; nếu không có mã đổi thì chỉ cập nhật Nhật ký + plan.md.
- Deploy CHỈ bằng Netlify CLI từ thư mục repo trên main mới nhất: `netlify deploy --build` (nháp) rồi
  `netlify deploy --build --prod` (chính thức). Site KHÔNG nối GitHub.
- Tôi tự làm những bước chạm bí mật: tạo database chính, đổi biến Netlify (mục 6), chạy init-ban-chinh
  (mục 7). Bạn hướng dẫn tôi bằng số mục của TRIEN_KHAI.md, chờ tôi báo xong.
- TRƯỚC `--prod`: hỏi tôi đồng ý bằng một câu rõ ràng.
- Task 10 Step 6 (trang chậm): chỉ gộp truy vấn của ĐÚNG trang > 3 giây, không đổi kết quả trả về;
  superpowers:test-driven-development không bắt buộc ở đây nhưng npm run check phải xanh sau mỗi trang.
- Tập dượt TRƯỚC khi khởi tạo bản chính — cả hai BẮT BUỘC: Task 10 Step 2a (TRIEN_KHAI mục 7a, khởi tạo trên database
  tạm) và Step 2b (tập dượt khôi phục qua mạng, cuối TRIEN_KHAI mục 11.2). Hỏng ở bước nào → dừng, báo tôi.
- Task 11: superpowers:requesting-code-review — RÀ ĐỘC LẬP toàn bộ thay đổi của PR-Z2a, PR-Z2b và PR-Z2b2
  (bạn là Opus, cùng model người code Phần B → ghi rõ vào Nhật ký; lượt rà chính thức do agent Fable 5.1 của session
  planning làm)
  (git log để tìm hai PR đó), trả lời bốn câu hỏi trong kế hoạch. Nếu bạn là CÙNG model đã code Z2a hoặc Z2b,
  ghi rõ vào Nhật ký. Sửa mọi lỗi Critical/Important (TDD cho mỗi lỗi sửa).
- superpowers:verification-before-completion trước MỌI câu "đã xong".
- superpowers:finishing-a-development-branch nếu có mã đổi (không draft, KHÔNG tự merge).

BA ĐIỀU TUYỆT ĐỐI:
1. KHÔNG xin, không ghi, không in token hay mật khẩu. Không chạy npm run seed khi có biến Turso.
2. KHÔNG xoá hay ghi đè dữ liệu database bản chính bằng lệnh nào. Dọn dữ liệu thử (Task 10 Step 7) chỉ theo
   cách kế hoạch ghi, và chỉ khi tôi đồng ý.
3. KHÔNG đổi luật nghiệp vụ.

KHI XONG, báo tôi bằng tiếng Việt cơ bản: địa chỉ web chính thức; 12 bước kiểm đạt/không; bảng thời gian tải
các trang; lỗi rà soát đã sửa; link PR (nếu có); ba việc tôi làm tiếp (gửi link cho GV, sao lưu hằng tuần...).
```

---

## Prompt rà soát — dán vào session **planning** sau mỗi PR

**Model:** Opus 5 · High · **B:** Opus 5 · XHigh (với PR-Z2b, PR-Z2c, PR-R)

```
Session coding vừa báo xong PR-<X> (link: <link PR>). Rà soát giúp tôi:
1. Diff có làm đúng kế hoạch không (plan.md mục 23/24 hoặc docs/superpowers/plans/... tương ứng)?
2. Có bước nào tick mà thật ra chưa làm?
3. Có chỗ nào tự quyết một điểm nghiệp vụ thay vì hỏi tôi?
4. Với PR chạm dữ liệu thật (Z2b, Z2c): có đường nào ghi đè / xoá dữ liệu, hay để lộ token?
Báo bằng tiếng Việt cơ bản, nói rõ cái gì cần tôi chốt và có nên merge không.
```

---

## Sau deploy — dùng khi quay lại

Thứ tự: `PR-O → PR-Q → PR-P → PR-R → PR-S` (model ở bảng mục 0). Đặc tả: `plan.md` mục 22.4–22.9 (bỏ phần mục 23 đã
làm) và `thiet-ke/BAN_DO_OVERHAUL.md`. Hồ sơ lớp ở PR-Q: 4 tab `Học viên | Ý thức & Phối hợp | Phân tích lớp | Giáo viên`.

**Nên:** trước mỗi PR sau deploy, nhờ session planning viết **kế hoạch chi tiết** kiểu
`docs/superpowers/plans/...` như PR-Z2 rồi mới code — vì lúc đó web đã có dữ liệu thật.

Khuôn prompt chung (thay `<X>` và `<mục>`):

```
Làm PR-<X> ở plan.md mục <mục>, chỉ PR-<X>. Đọc thiet-ke/BAN_DO_OVERHAUL.md phần tương ứng trước
design plan để biết cái gì đã có / hết hiệu lực. Bản chính đang chạy với dữ liệu thật: nếu PR đổi
schema thì phải có bước npm run migrate chạy lặp không lỗi, KHÔNG được làm mất dữ liệu.

Skill: using-git-worktrees · verification-before-completion (npm run check + bấm thử một lượt các vai
liên quan) · finishing-a-development-branch (không tự merge). Chỉ dùng test-driven-development khi thêm
hoặc đổi luật ở máy chủ. Chỉ dùng requesting-code-review cho PR-R (lớn nhất). Không chụp ảnh, không
kiểm ngược.

Kế hoạch sai so với mã: sửa tại chỗ + một dòng mục 14. Phải chọn giữa hai cách về nghiệp vụ: hỏi tôi.
Báo xong bằng tiếng Việt cơ bản: link PR, cái gì CHƯA làm.
```

| PR | Làm gì | Mục |
|---|---|---|
| PR-O | Điều hướng 4 khu vực + redirect link cũ | 22.4 |
| PR-Q | Học viên & Lớp · hồ sơ lớp 4 tab · hồ sơ HV 4 ô · hành trình | 22.7 |
| PR-P | Tổng quan mới · Phân tích 4 góc nhìn (không có góc nhìn Giáo viên) | 22.6 |
| PR-R | Công việc 3 tab · Kế hoạch Test · 4 đường vào nhập điểm · nút dời lịch Normal | 22.8 |
| PR-S | Biên tập chữ · trạng thái rỗng · nợ kỹ thuật (bỏ S3 đã làm ở PR-T) | 22.9 |
