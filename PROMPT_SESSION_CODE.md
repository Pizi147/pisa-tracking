# Prompt cho session coding

Copy **cả khối** trong khung của PR cần làm, dán vào một session Claude Code **mới**. Một PR một session.
Cập nhật: 21/09/2026 (chiều). Lộ trình: `plan.md` mục 23–24 · plan chi tiết bản chính:
`docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`.

**Đã xong:** PR-N (#32) · PR-J (#34).

---

## 0. Chọn model và mức suy nghĩ (effort) cho từng PR

**Cách làm việc:** session **planning** (Opus) viết kế hoạch chi tiết → session **coding** làm theo → quay lại session
planning rà soát. Chọn model ở ô chọn model của Claude Code **trước khi dán prompt**. Tên mức effort có thể khác một
chút trên giao diện — chọn mức **gần nhất**.

| PR | Làm gì | **Khuyến nghị** | **Phương án B** | Tách thêm? | Vì sao |
|---|---|---|---|---|---|
| **PR-T** | Luật SOS v3 phía máy chủ | Sonnet 5 · High | Fable 5.1 · High | Không | Đặc tả rất chi tiết, có mã luật để viết phép kiểm. Dùng B nếu Sonnet kẹt ở phép kiểm luật quá 2 lần |
| **PR-K** | Giao diện Ý thức & Phối hợp | Sonnet 5 · High | Fable 5.1 · High | Không | Làm giao diện theo bố cục đã khoá, chữ đã viết sẵn |
| **PR-Z2a** | Hạ tầng Netlify + Turso (Task 0–6b) | Sonnet 5 · High | Fable 5.1 · High | — | Phần lớn là làm theo kế hoạch đã được thử trước (511/512 phép kiểm chạy được với thư viện mới) |
| **PR-Z2b** | An toàn dữ liệu bản chính (Task 7–9) | **Opus 5 · XHigh** | Fable 5.1 · High | — | Một quyết định sai ở đây có thể chạm **dữ liệu thật** → dùng model mạnh |
| **PR-Z2c** | Deploy bản chính + đo tốc độ + rà soát (Task 10–11) | **Opus 5 · XHigh** | Fable 5.1 · High | — | Chạm dữ liệu thật + quyết định tối ưu trang chậm. **Người rà phải khác model đã code Z2a/Z2b** |
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
PR-T  → rà soát → merge
PR-K  → rà soát → merge
PR-Z2a → rà soát → merge        (sẽ dừng 2 lần hỏi bạn: database Turso THỬ; TRIEN_KHAI mục 3-4-5)
PR-Z2b → rà soát → merge
PR-Z2c → rà soát → merge        (sẽ dừng hỏi bạn: database Turso CHÍNH; TRIEN_KHAI mục 6-7; xin phép đưa lên chính thức)
```

**Không chạy song song** hai PR nào ở trên — mỗi PR dựa vào PR trước đã merge.
Merge xong một PR thì **mở session mới** cho PR sau — đừng dán tiếp vào session cũ.

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

Báo xong bằng tiếng Việt cơ bản: link PR, vai nào đã bấm thử, cái gì CHƯA làm.
```

---

## PR-Z2a — Hạ tầng bản chính  *(sau khi PR-T và PR-K đã merge)*

**Model:** Sonnet 5 · High · **B:** Fable 5.1 · High
**Để sẵn:** ~2 giờ. Session sẽ **dừng hỏi bạn hai lần**: (1) URL + token database Turso **thử** (`TRIEN_KHAI.md` mục 2);
(2) làm `TRIEN_KHAI.md` mục 3–4–5 để nó deploy bản nháp.

```
Bạn thực thi PHẦN A (PR-Z2a) của kế hoạch đưa PISA Progress lên làm BẢN CHÍNH trên Netlify + Turso.
Dữ liệu thật của trung tâm sẽ nằm trên hạ tầng này. Chất lượng và an toàn quan trọng hơn tốc độ.

KẾ HOẠCH: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md
Bạn CHỈ làm Task 0 → Task 6b (Phần A). KHÔNG làm Task 7 trở đi dù thấy tiện.
Đọc HẾT file kế hoạch trước khi gõ lệnh đầu tiên — nhất là "Global Constraints", "Ba phần — ba PR",
"Hướng dẫn riêng cho model thực thi". Rồi đọc plan.md mục 24 và TRIEN_KHAI.md.

CÁCH LÀM:
- Gọi superpowers:executing-plans. Làm ĐÚNG thứ tự, tick từng bước (- [x]) ngay trong file kế hoạch.
- Nhánh: pr-z2a-ha-tang (superpowers:using-git-worktrees ở Task 0).
- Mỗi task kết thúc: npm run check xanh (số phép kiểm KHÔNG giảm) → một commit. Ghi số phép kiểm vào
  bảng "Nhật ký thực thi" cuối file kế hoạch, cùng mọi điều bất ngờ và mọi chỗ bạn phải tự quyết.
- Trước mỗi commit tự rà diff: chỉ chạm đúng các file ở mục "Files" của task? Không có token/mật khẩu?

SKILL SUPERPOWERS (gọi bằng tool Skill, đúng lúc):
- using-git-worktrees (Task 0) · executing-plans (suốt quá trình)
- test-driven-development: ở mọi bước ghi "Phép kiểm đỏ" — chạy thấy ĐỎ trước, ghi lại, rồi mới viết mã.
- systematic-debugging: BẤT KỲ lúc nào npm run check đỏ mà chưa rõ vì sao. TUYỆT ĐỐI không sửa phép kiểm cũ cho xanh.
- verification-before-completion: trước khi kết thúc Phần A.
- finishing-a-development-branch: mở PR (không draft). KHÔNG tự merge.
Không cần: brainstorming, writing-plans, requesting-code-review (Phần C sẽ rà), kiểm ngược, chụp ảnh.

BỐN ĐIỀU TUYỆT ĐỐI:
1. KHÔNG đổi kiểu gọi database sang async (không thêm await vào prepare/get/all/run). Kế hoạch đã thử: đổi thư
   viện sang libsql là đủ. Gate Task 3 hoặc 6b không đạt → DỪNG, báo tôi. Không tự nghĩ đường khác.
2. KHÔNG ghi token, mật khẩu, URL có token vào bất kỳ file nào trong repo, kể cả Nhật ký và chú thích.
3. Chỉ dùng database Turso THỬ (pisa-thu-nghiem). Không bao giờ đụng database bản chính trong Phần A.
4. KHÔNG đổi luật nghiệp vụ, KHÔNG dọn mã hay tối ưu ngoài task. Thấy gì đáng sửa → ghi plan.md mục 12.

KHI NÀO DỪNG HỎI TÔI:
- Gate Task 3 và Task 6b: hỏi đúng nguyên văn kế hoạch ghi. Tôi không biết code — nói tôi làm mục nào của
  TRIEN_KHAI.md, đừng giải thích kỹ thuật.
- Mã thật khác kế hoạch tới mức phải chọn giữa hai cách: dừng, ghi Nhật ký, hỏi. Đừng đoán.
- Trước Task 0: main chưa có PR-T và PR-K → dừng, báo tôi.

KHI XONG, báo tôi bằng tiếng Việt cơ bản: link PR; địa chỉ bản nháp đã chạy; bảng thời gian tải 5 trang;
số phép kiểm trước/sau; việc còn lại; việc tôi cần làm tiếp.
```

---

## PR-Z2b — An toàn dữ liệu bản chính  *(sau khi PR-Z2a đã merge)*

**Model:** **Opus 5 · XHigh** · **B:** Fable 5.1 · High
**Để sẵn:** ~1,5 giờ. Không cần bạn cung cấp gì — phần này chỉ làm trên máy, với database thử và file tạm.

```
Bạn thực thi PHẦN B (PR-Z2b) của kế hoạch đưa PISA Progress lên làm BẢN CHÍNH trên Netlify + Turso.
Phần này viết các lệnh CHẠM DỮ LIỆU THẬT: khởi tạo database bản chính, thêm chi nhánh, sao lưu.
Một lỗi ở đây có thể làm mất hoặc hỏng dữ liệu thật của trung tâm. Cẩn thận hơn tốc độ.

KẾ HOẠCH: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md
Bạn CHỈ làm Task 7 → Task 9 (Phần B). PR-Z2a đã merge.
Trước khi gõ lệnh: đọc HẾT file kế hoạch, và ĐỌC KỸ bảng "Nhật ký thực thi" — Phần A đã ghi ở đó những gì
khác kế hoạch (thư viện, đường dẫn, tên cột...). Rồi đọc TRIEN_KHAI.md mục 7 và 10 (chủ sản phẩm sẽ làm
đúng theo đó — lệnh và tên biến phải khớp từng chữ).

CÁCH LÀM:
- superpowers:executing-plans · nhánh pr-z2b-an-toan-du-lieu (superpowers:using-git-worktrees).
- Tick từng bước trong file kế hoạch, ghi Nhật ký sau mỗi task. npm run check xanh → commit.
- superpowers:test-driven-development BẮT BUỘC cho Task 7 và Task 8: viết phép kiểm, chạy thấy ĐỎ, ghi lại,
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
1. KHÔNG chạy bất kỳ lệnh nào với database Turso bản chính. Kiểm bằng file tạm và database THỬ.
2. KHÔNG ghi token, mật khẩu vào repo. Không xin mật khẩu quản trị của tôi.
3. KHÔNG đổi luật nghiệp vụ, không làm task của Phần A hay Phần C.

Mã thật khác kế hoạch tới mức phải chọn giữa hai cách → dừng, ghi Nhật ký, hỏi tôi.

KHI XONG, báo tôi bằng tiếng Việt cơ bản: link PR; ba lệnh mới đã chạy thử được chưa; số phép kiểm
trước/sau; câu trả lời cho "có đường nào ghi đè dữ liệu không"; việc còn lại.
```

---

## PR-Z2c — Deploy bản chính + rà soát độc lập  *(sau khi PR-Z2b đã merge)*

**Model:** **Opus 5 · XHigh** · **B:** Fable 5.1 · High
**Quan trọng:** chọn model **khác** model đã code PR-Z2a/Z2b (ví dụ Z2a dùng Sonnet, Z2b dùng Opus → Z2c dùng Fable;
hoặc Z2a Sonnet, Z2b Fable → Z2c Opus). Nếu không đổi được, cứ chạy, nhưng sau đó dán **prompt rà soát** ở cuối file
này vào session planning.
**Để sẵn:** ~1,5–2 giờ **ngồi cùng máy**. Session sẽ dừng hỏi bạn: tạo database **chính** (`TRIEN_KHAI.md` mục 2),
đổi biến (mục 6), chạy khởi tạo (mục 7), rồi cùng bấm thử 12 bước, và **xin phép** trước khi đưa lên chính thức.

```
Bạn thực thi PHẦN C (PR-Z2c): đưa PISA Progress lên BẢN CHÍNH THẬT trên Netlify + Turso, kiểm trên địa chỉ
thật, đo tốc độ, và rà soát độc lập toàn bộ PR-Z2a + PR-Z2b.
Sau phần này giáo viên thật sẽ dùng web. Cẩn thận hơn tốc độ.

KẾ HOẠCH: docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md
Bạn CHỈ làm Task 10 → Task 11 (Phần C). PR-Z2a và PR-Z2b đã merge.
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
- Task 11: superpowers:requesting-code-review — RÀ ĐỘC LẬP toàn bộ thay đổi của PR-Z2a và PR-Z2b
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
