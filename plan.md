# PISA Progress — Kế hoạch giai đoạn sau PR18

> # 🔴 ĐỌC MỤC 23 VÀ 24 TRƯỚC — thứ tự hiện hành: ~~PR-T~~ ✅ → ~~PR-K~~ ✅ → ~~PR-K2~~ ✅ → ~~PR-K3~~ ✅ → PR-Z2a → PR-Z2b → PR-Z2c (bản chính Netlify + Turso)
>
> **22/09:** PR-K2 = sửa sau rà soát PR-K (mục 23.3b), đã merge (#44). PR-K3 = sửa sáu việc nhỏ sau rà soát PR-K2 (mục 14, nhánh
> `pr-k3-gan-day-theo-hoc-vien`). Kế hoạch Z2 đã được **chạy thử thật** và sửa — xem bảng "SỬA 22/09" ở đầu
> `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`.
>
> Model và effort cho từng PR: `PROMPT_SESSION_CODE.md` mục 0. Deploy **thủ công** bằng Netlify CLI: `TRIEN_KHAI.md`.
>
> Mục 24 **thay PR-Z** của mục 23.2: bản chính chạy Netlify + Turso, không cần máy luôn bật.
>
> Rulebook v3 (tối 21/09) đảo ba luật: SOS **tự tạo case + điền sẵn phương án**, **Phối hợp SOS**, vi phạm
> **sửa/xoá thẳng**. Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md`. Mục 22 giữ làm đặc tả cho các PR **sau deploy**.
>
> ---
>
> ## (lịch sử) ĐỌC MỤC 22 TRƯỚC — lộ trình đã đổi ngày 21/09/2026
>
> **Mục 4 (lộ trình PR1…PR-H) đã xong và KHÔNG còn là lộ trình đang chạy.** Lộ trình hiện hành
> là **8 PR ở mục 22**, gọi là `PR-N · PR-J · PR-O · PR-K · PR-P · PR-Q · PR-R · PR-S`.
>
> Hai việc đã thay đổi bản chất kế hoạch:
>
> 1. **Chủ sản phẩm bỏ hẳn mô hình Case Ý thức** (21/09/2026). Thay bằng **Vi phạm** và
>    **Biện pháp xử lý** quan hệ nhiều–nhiều. Luật: rule book **mục 18**. Đặc tả đủ để code:
>    `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. **36 file đang dính chữ `behaviour` phải gỡ.**
> 2. **Phát hiện một lỗ hổng của chính file này:** mục 4 chỉ chép design plan mục 18 vào **một**
>    PR (PR-I — hồ sơ Test). **Bảy trang còn lại của mục 18 chưa bao giờ trở thành việc** —
>    Tổng quan, Phân tích, Công việc, Học viên & Lớp, Hồ sơ lớp, Hồ sơ học viên, Kế hoạch Test.
>    Cả điều hướng bốn khu vực (D01) cũng chưa làm: `App.tsx` vẫn ba mục, không có khu vực Test.
>    Từ nay mọi yêu cầu của design plan phải có một dòng trong `thiet-ke/BAN_DO_OVERHAUL.md`
>    với nhãn tình trạng và PR phụ trách.
>
> **Dành cho session code:** đây là file kế hoạch **sống**. Đọc hết mục 0–3 **và mục 22** trước
> khi gõ dòng code đầu tiên, rồi làm **đúng một PR** theo mục tương ứng. Các bước dùng ô đánh
> dấu (`- [ ]`); đánh dấu xong từng bước ngay trong file này.
>
> **Goal:** Hoàn thiện luồng Test — số liệu khớp danh sách, đường vào nhập điểm ngắn, lịch
> Test theo từng kỹ năng, và chấm điểm không bắt xác nhận thừa.
>
> **Architecture:** Không đổi mô hình nghiệp vụ, không migration ở PR1. Gốc của phần lớn lỗi
> là **cùng một khái niệm có hai định nghĩa ở hai chỗ**; cách sửa là rút luật ra **một hàm
> duy nhất** rồi bắt mọi nơi gọi nó, thay vì đi sửa từng màn cho khớp.
>
> **Tech Stack:** TypeScript · React 18 + Vite · Express · better-sqlite3 · Tailwind.
> Kiểm thử: `server/src/tests/run.ts` (harness `check()` tự viết, không phải Jest/Vitest).
>
> **Spec:** `D:\Download\PISA-PR17-Audit-and-Change-Register.md` (sổ audit — nguồn luật chính,
> mục 13 và 14 là bản mới nhất) · `vong7/BRIEF_OVERHAUL_SAU_PR15.md` (đề bài gốc).

---

## 0. HƯỚNG DẪN DÙNG VÀ CẬP NHẬT FILE NÀY

### 0.1. File này dùng để làm gì

Một session khác — không đọc được hội thoại đã sinh ra kế hoạch này — phải code được **chỉ
bằng file này** cộng với repo. Vì thế mọi thứ ở đây là đường dẫn thật, tên hàm thật, luật
viết đủ chữ. Không có "TBD", không có "xử lý lỗi cho phù hợp".

### 0.2. Bắt buộc cập nhật — đây là quy tắc, không phải lời khuyên

**Mỗi lần kế hoạch thay đổi thì sửa file này TRONG CÙNG commit với thay đổi đó.** Cụ thể:

| Khi nào | Phải làm gì trong file này |
|---|---|
| Chủ sản phẩm chốt một quyết định mới | Thêm một dòng vào **mục 3**, có ngày. Nếu nó thay thế quyết định cũ thì ghi rõ "thay thế ...", **không xoá dòng cũ** |
| Làm xong một bước | Đánh dấu `- [x]` ngay tại bước đó |
| Làm xong một PR | Chuyển cả mục PR đó xuống **mục 2** (đã xong, có bằng chứng), ghi số PR và cách đã kiểm |
| Phát hiện kế hoạch sai khi bắt tay vào code | Sửa mục PR đó, **và** ghi một dòng vào **mục 14** nói vì sao đổi |
| Phát hiện lỗi mới ngoài phạm vi | Thêm vào **mục 12 (backlog)**. Đừng tự mở rộng PR đang làm |
| Chốt xong thiết kế cho PR2 hoặc PR3 | Viết chi tiết mức task cho PR đó, thay cho phần mô tả thiết kế hiện có |

Không cập nhật file này = lần bàn giao sau lại rơi vào đúng cái bẫy ở mục 1.2.

### 0.3. Làm một PR mỗi lần

PR1 → PR-A → PR2 → PR3, và PR-B chen vào lúc nào cũng được (mục 4). **Đừng gộp.** Lý do ở
mục 4; chúng được chia theo phụ thuộc thật, không phải chia cho đẹp.

### 0.4. CHẠY MỘT MẠCH — thứ tự làm và thứ tự merge

> **Cập nhật 20/09/2026. Chủ sản phẩm đi vắng dài ngày và muốn code liền một mạch.**
> Bỏ phương án chia nhiều nhánh song song. **Một nhánh, năm chặng, commit riêng từng chặng.**

```bash
git fetch origin
git checkout -b worktree-batch-thiet-ke-sau-pr28 origin/main
```

| Chặng | Nội dung | Mục | Đụng năm file PR-D? |
|---|---|---|---|
| 1 | **PR-E** — nền giao diện dùng chung | 15 | Không |
| 2 | **PR-F** — hợp đồng số liệu | 16 | Không |
| 3 | **PR-G** — dấu '-' và chốt cuối Chủ nhật | 17 | Không |
| — | **Hợp nhất PR-D vào nhánh này** (mục 21) | 21 | — |
| 4 | **PR-I** — hồ sơ Test gọn, áp hệ giao diện vào khối case | 18 | **Có** |
| 5 | **PR-H** — biên tập tiếng Việt toàn web | 19 | **Có** |

**Commit riêng từng chặng**, đừng gộp thành một commit khổng lồ. Chặng nào xong thì chạy
`npm run check` (mục 13.1) rồi mới sang chặng sau. Hỏng ở chặng 4 mà chặng 1–3 đã commit sạch
thì còn lùi lại được.

**Ba chặng đầu chạy được ngay, không cần chờ ai.** Chúng không chạm file nào trong danh sách
dưới đây — đó là lý do chúng được xếp trước, không phải vì chúng dễ hơn.

### 0.5. Năm file PR-D đang giữ

PR-D (mục 11) đang được làm ở một worktree khác, trên nhánh riêng theo quy ước
`worktree-pr-d-khung-case-gon`. Nó đang **tái cấu trúc** đúng năm file này:

```
web/src/modules/cases/SkillBoard.tsx
web/src/modules/cases/CasePanel.tsx
web/src/modules/cases/CaseBoardPage.tsx
web/src/modules/students/StudentDetailPage.tsx
web/src/modules/fasttrack/MockDetailPage.tsx
```

**Chặng 1–3 tuyệt đối không mở năm file này.** Cần một thay đổi chạm vào chúng thì ghi xuống,
để sang chặng 4 làm — lúc đó PR-D đã nằm trong nhánh rồi.

Có đúng **một** chỗ dễ vấp: PR-E Step 8 quét mọi nơi dùng bộ chọn tuần, mà `CaseBoardPage.tsx`
là một trong số đó. Bỏ qua riêng file này ở chặng 1, ghi vào việc của chặng 4.

**Trước khi bắt đầu, xem nhánh PR-D tên thật là gì và đã có gì chưa:**

```bash
git fetch origin
git branch -a | grep pr-d
git log --oneline origin/main..origin/worktree-pr-d-khung-case-gon   # nếu đã push
```

Chưa có nhánh PR-D trên `origin` nghĩa là session kia chưa đẩy lên — xem mục 21.3 để biết làm gì.

---

## 1. Ràng buộc bất biến

### 1.1. Ba ràng buộc của chủ sản phẩm

1. **Chủ sản phẩm KHÔNG BIẾT CODE.** Báo cáo bằng tiếng Việt, nói *cái gì đổi trên màn hình*.
   Không nói tên hàm, tên bảng dữ liệu.
2. **Đừng để máy chủ chạy ngầm.** Xong việc thì tắt, kiểm cổng 5173 và 4000 đã trống.
3. **Đừng merge, đừng deploy, đừng gửi gì ra ngoài** nếu chủ sản phẩm không bảo.

Thêm: **LOGICAL · SIMPLE · PRACTICAL · USER-FRIENDLY · INTUITIVE.** Không overhaul toàn hệ
thống. Không reset bộ demo. Không mở rộng phân quyền.

### 1.2. Cái bẫy đã sập một lần — đừng sập lần nữa

**File bàn giao KHÔNG phải bằng chứng.** `BAN_GIAO_CHAT_TIEP_THEO.md` §3.3 ghi ô điểm "chênh
lệch so với lượt trước" như một quyết định — trong khi sổ audit §13.4 (17/09) đã chốt ngược
lại. File bàn giao chép lại **thứ đã code**, không phải **thứ đã chốt**, và vòng sau tin nó
nên tưởng quyết định là sai.

*(Các file `BAN_GIAO*.md` đã được **xoá ngày 21/09/2026** chính vì bài học này — xem mục 14.
Bài học thì giữ: **đừng dùng một bản mô tả hiện trạng làm bằng chứng cho một quyết định.**)*

**Và một cái bẫy thứ hai, sập ngày 21/09/2026:** file này từng chỉ chép design plan **mục 18
vào một PR** (PR-I — hồ sơ Test), nên bảy trang còn lại của mục 18 **chưa bao giờ trở thành
việc**. Đọc `plan.md` thì tưởng gần xong; đọc design plan thì thấy còn cả một overhaul chưa bắt
đầu. **Một đặc tả không được chép thành việc thì nó không tồn tại đối với người code.** Từ nay
mọi yêu cầu của design plan phải có một dòng trong `thiet-ke/BAN_DO_OVERHAUL.md` với nhãn tình
trạng và PR phụ trách.

Thứ tự tin cậy: **sổ audit mục 13–14 > brief vong7 > code đang chạy > file bàn giao.**
Và chạy thật > đọc code.

### 1.3. Kỹ thuật dễ vấp

| Chuyện | Phải làm thế nào |
|---|---|
| Biên dịch | Dùng **`tsc`**. **TUYỆT ĐỐI KHÔNG** `tsx` hay `esbuild` làm trình chạy TS — cả hai đã từng làm hỏng máy chủ sản phẩm (Windows) |
| Đường dẫn khi import | Bắt buộc có đuôi `.ts` / `.tsx`. Thiếu là gãy |
| Sau khi sửa máy chủ | **Bắt buộc** `npm run build:server`. `npm run dev` KHÔNG tự dựng lại máy chủ |
| Kiểm kiểu dữ liệu | `npx tsc -p tsconfig.build.json --noEmit` và `npx tsc -p tsconfig.web.json --noEmit` |
| Chạy kiểm thử | `npm test` — hiện **445 phép kiểm** sau PR-N N1–N6 (437 sau N1–N4; 421 sau lời chốt C01–C10; đầu đợt batch là 360, sau chặng 0 là 367, sau chặng 2 là 393, sau chặng 3 là 409, sau chặng 4 là 414, sau chặng 5 là 416, sau rà soát là 420; con số 319 cũ đã lạc hậu), phải đạt hết. `npm run check` chạy cả chuỗi mục 13.1. Harness **không có bộ lọc**: nó chạy cả bộ, nên xác minh một phép kiểm mới bằng cách tìm tên nó trong kết quả |
| Ngày demo | **14/09/2026** cố định. Không lấy ngày thật của máy. Đọc qua `demoToday()` ở máy chủ, `session.demoDate` ở web |
| Quy ước tuần | Thứ Hai → Chủ nhật; tuần thuộc tháng chứa ngày thứ Năm của nó |
| Sao chép database | Phải chép **cả ba** file `.sqlite`, `.sqlite-wal`, `.sqlite-shm`. Chép mỗi `.sqlite` sẽ ra bản CŨ |
| Đăng nhập demo | Trang đăng nhập có tab **"Vào nhanh bằng tài khoản demo"** — bấm một tài khoản là vào, **không cần mật khẩu**. Dùng đường này |
| `gh` CLI | Đã cài ở `C:\Program Files\GitHub CLI\gh.exe` nhưng **chưa `gh auth login`**, và PATH của session cũ không có nó. Gọi bằng đường dẫn đầy đủ |

---

## 2. Trạng thái đã kiểm bằng chứng — ĐỪNG LÀM LẠI

Mọi dòng dưới đây đã được đọc code **và** chạy thật, không phải suy từ tài liệu.

### 2.1. Đã xong (PR18, merge vào `main` ở `4c9f11f`)

| Việc | Bằng chứng |
|---|---|
| Hồ sơ A: bốn ô số, bảng kỹ năng, thẻ case đóng/mở riêng | Bấm thử trên trình duyệt |
| Thẻ case: mỗi phương án **một dòng**, ghi kết quả **ngay trong dòng** | Lưu thật, hạn nhảy 30/08 → 20/09, thẻ tự cập nhật |
| Hành trình: hai cách đọc — "Điểm và can thiệp" · "Dòng sự kiện" | Bấm thử, cả khổ máy tính và 375px |
| Mốc Ý thức có tên và ngày | Bấm thử |
| Tab **Tình hình đơn vị** trong Tiến độ công việc (sổ §14.3 mục 3) | Bấm thử, không lỗi ở bảng điều khiển |
| Bảng chấm mở ra ở **tuần hiện tại** (sổ §14.3 mục 4) | Mở `/nhap-diem/3` → W3 SEP 2026 · 14/09–20/09 |
| Tuần từ đường dẫn được giữ và **được bơm vào ô chọn** kể cả khi ngoài cửa sổ 26 tuần | `/nhap-diem/3?periodId=10` → "W1 FEB 2026 · 02/02 – 08/02" |
| Nhãn "Cần nhập điểm MT" → "Cần nhập điểm Test" (§14.3 mục 1) | Có trên màn |
| Bỏ chữ "chưa ăn thua" (§14.3 mục 2) | Không còn trên màn |

`5487b14` trên `main` là commit revert một commit lỗi (`8c6fcdc` "okay") vốn chứa dấu xung đột
chưa giải quyết. `main` hiện lành: 319/319 đạt, hai lệnh kiểm kiểu sạch.

### 2.1b. Đã xong trong đợt batch 20/09/2026 (nhánh `worktree-batch-thiet-ke-sau-pr28`, chưa hợp nhất)

Không có nhánh PR-D trên `origin` lúc bắt đầu, nên PR-D được làm luôn ở chặng 0 và bước "hợp nhất PR-D" của mục 21.2 không xảy ra.
Mọi chặng đều chạy `npm run check` xanh trước khi commit; số phép kiểm cuối là 420 (416 sau chặng 5, thêm 4 sau rà soát độc lập — mục 12.12).

| Chặng | Việc | Commit | Bằng chứng |
|---|---|---|---|
| 0 | PR-D — khung case gọn (mục 11) | `b5a48ad` | 7 phép kiểm mới; bấm thử hồ sơ học viên, bảng case |
| 1 | PR-E — nền giao diện dùng chung (mục 15) | `e39edd8` | 16 phép kiểm; trang thử `ThanhPhanDemo` (chỉ chạy ở chế độ dev) |
| 2 | PR-F — hợp đồng số liệu (mục 16) | `012d9f8` | 10 phép kiểm, kiểm ngược F01/F02/F03/F05 |
| 3 | PR-G — dấu `-` và chốt cuối Chủ nhật (mục 17) | `4970016` | 16 phép kiểm; bấm thử GVCN + GVBM, đổi ngày demo qua 21/09 |
| 4 | PR-I — hồ sơ Test gọn (mục 18) | `4fae005` | 5 phép kiểm; bấm thử Quản lý, GVBM, GVCN, 375px |
| 5 | PR-H — biên tập tiếng Việt (mục 19) | commit cuối của nhánh | 2 phép kiểm; bấm thử một phần — xem 12.11 |

Việc chưa làm của từng chặng nằm ở mục 12.9 · 12.10 · 12.11 và mục 14 — **đừng coi các mục 15–19 là đã "xong hẳn"** chỉ vì đã tick.

### 2.2. Phân công GV — máy chủ đã chặn đủ, đừng viết lại

`server/src/classes/classes.ts:690–760` đã kiểm ở **máy chủ**, không chỉ ở giao diện:

- mỗi kỹ năng chỉ **một** GV (báo lỗi rõ nếu xếp hai người);
- một GV dạy nhiều kỹ năng thì được;
- đúng **một** GVCN, **và** GVCN phải dạy ít nhất một kỹ năng của lớp;
- chỉ chọn được người thuộc chi nhánh của lớp (`teacherCandidates`, dòng 603);
- giữ lịch sử phân công (`status='ended'` + `effective_to`).

Còn thiếu so với sổ §13.5 → đó là **PR-B**, mục 9.

### 2.3. Hai lỗi đã tái hiện được, có số

**Lỗi 1 — badge có số, bấm vào trống.** Chạy trực tiếp trên `data/pisa-demo.sqlite`:

| Vai | Badge cộng lại | Danh sách đích |
|---|---|---|
| Quản trị hệ thống | **28** | **0** |
| Quản lý Monbay | **0** | 0 |

Nguyên nhân, đã xác định: badge ở `server/src/classes/classes.ts:180` đếm theo `x.canEdit`
(= `editableSkills`, gồm cả quyền **sửa hộ**), còn danh sách ở
`server/src/fasttrack/attempts.ts:543` lọc theo `c.mine` (= `mySkills`, chỉ đường **phân
công**). Hai định nghĩa, hai kết quả. Xem `server/src/permissions.ts:306` và `:325`.

Phép kiểm hiện có (`server/src/tests/run.ts:1195`) chỉ so badge với danh sách **cho giáo
viên**, nên nó xanh mà lỗi vẫn sống. Quản lý thì badge 0 vì không có quyền sửa nào, nên vòng
lặp bỏ qua họ (`if (!editable.length) continue;`, dòng 159).

**Lỗi 2 — không tạo được case Ý thức.** `web/src/modules/cases/QuickReport.tsx:80`:

```ts
const causes = track === 'academic' && topic ? issuesForTopic(topic) : [];
```

Chọn nhóm **Ý thức/Khác** → `causes` rỗng → không có nút phân loại nào để bấm →
`primaryCode` trống → dòng 133 chặn với *"Hãy chọn phân loại vấn đề"*, và máy chủ cũng từ
chối y hệt (`server/src/cases/cases.ts:453`). **Không có đường thoát.** Bộ demo có case Ý
thức là vì seed đổ thẳng vào database. Đây là sổ audit **CASE-01**, mức **P0**.

**Lỗi 3 — RLW rơi khỏi bảng tuần** (sổ §13.6.3), đã xác nhận bằng đọc code:
`server/src/fasttrack/attempts.ts:1137` trong `classScoreSheet`:

```ts
if (period) { sql += ' AND a.planned_period_id = ?'; params.push(period.id); }
```

Lọc theo tuần của **cả đợt**. RLW thi tuần này nhưng đợt hoàn tất ở tuần sau thì cả đợt
không hiện ra ở bảng tuần này.

---

## 3. Quyết định đã chốt

Thêm dòng mới ở cuối, có ngày. **Không xoá dòng cũ** — ghi "thay thế" nếu bị thay.

| Ngày | Quyết định | Nguồn |
|---|---|---|
| 17/09/2026 | Giữ **hồ sơ A**. Không thiết kế lại trong giai đoạn này | Sổ §14.1 |
| 17/09/2026 | Ô điểm: `±` là **điểm − kỳ vọng của chính đợt đó**, KHÔNG phải chênh với lượt trước. Xu hướng nếu có thì ghi bằng **chữ trung tính** ("Tăng 0.5 so với MT1"), không mũi tên màu | Sổ §13.4 · §14.1 |
| 17/09/2026 | Màu điểm: dưới kỳ vọng **đỏ** · bằng **xanh dương** · vượt **xanh lá** · thiếu dữ liệu **xám**. Lịch sử giữ kỳ vọng của chính đợt đó | Sổ §13.4 |
| 17/09/2026 | Badge và danh sách đích dùng **hai phạm vi tách bạch**: "Việc của tôi" / "Trong phạm vi quản lý". Badge mở đúng tập đã tạo nên số đó. KHÔNG chữa bằng cách giao toàn bộ việc GV cho QL | Sổ §13.6.1 |
| 17/09/2026 | Normal **không có** Hủy Test / Hủy kỹ năng. Luôn chờ đủ bốn môn. *(Thay thế câu "Normal hủy lịch hẹn" ở sổ §2)* | Sổ §13.7 |
| 18/09/2026 | PR18 làm `±` **sai** so với quyết định 17/09 → thành **lỗi phải sửa**, không phải thiết kế phải bàn | Đọc `cases.ts:2161` |
| 18/09/2026 | Badge đếm **bài kỹ năng**, không đếm lượt Test. Nhãn phải nói rõ đơn vị | Chủ sản phẩm |
| 18/09/2026 | **CASE-01** làm thành **PR riêng, ngay sau PR1**, trong cùng giai đoạn này | Chủ sản phẩm |
| 18/09/2026 | Chia **cách 1**: PR1 số và đường vào → PR2 bộ chọn tuần + Kế hoạch Test → PR3 chấm điểm. Hai PR nhỏ độc lập | Chủ sản phẩm |
| 18/09/2026 | Ngoài `±`, làm **bốn màu điểm dễ nhìn hơn** | Chủ sản phẩm |
| 19/09/2026 | Case **Ý thức/Khác** khi tạo mới **không được chọn ngày lẫn hạn** — ngày mở luôn là hôm nay, hạn 3/5 ngày và 7 ngày tự ép. Học thuật giữ ô ngày | Chủ sản phẩm |
| 19/09/2026 | Thêm tab **"Đã xong từ trước"** trong form `+ Case`, cho **cả hai nhóm** học thuật và Ý thức. Đây là chỗ **duy nhất** được nhập ngày quá khứ, và bắt buộc có ngày hoàn thành | Chủ sản phẩm |
| 19/09/2026 | Case nhập bù **KHÔNG vào mẫu số hiệu quả hỗ trợ**. Vẫn hiện đủ trên hồ sơ và hành trình theo tuần. *(Làm rõ câu "ngày quá khứ không tự chứng minh hiệu quả" ở sổ mục 2)* | Chủ sản phẩm |
| 19/09/2026 | Một lần nhập bù ghi được **nhiều dòng phương án**, mỗi dòng `tên việc · người làm · từ → đến`. Kết quả và ghi chú ghi **một lần** cho cả case | Chủ sản phẩm |
| 19/09/2026 | Quyền case theo **đúng kỹ năng mình dạy** (AUTH-01): học thuật GVBM đúng kỹ năng · GVCN cả lớp · QL tất cả. **Ý thức/Khác chỉ GVCN và QL** — GVBM báo được vấn đề nhưng không tạo/xử lý phương án | Chủ sản phẩm · Sổ §13.12 |
| 19/09/2026 | Bỏ nút **"Mở trang riêng"** khỏi mọi màn, nhưng **GIỮ route** `/hoc-thuat/case/:id` cho link sâu từ thông báo và badge | Chủ sản phẩm |
| 19/09/2026 | Bỏ ô **điểm tự chấm** khỏi cập nhật phương án (CASE-05). Giữ ô điểm ở màn Hoàn thành case, nơi đã hiện đúng tiêu chí của kỹ năng | Chủ sản phẩm |
| 20/09/2026 | **Rule book mục 17 ưu tiên hơn mọi mô tả cũ mâu thuẫn.** Dấu '-' còn đến hết Chủ nhật = **không dự thi**, bỏ bước GVCN xác minh thường lệ. Ý thức gộp **ba ngày đầu** (thay bốn ngày). SOS **không** tự sinh PA trao đổi | `PISA-Rulebook-2026-09-19.md` §17 |
| 20/09/2026 | Bốn khu vực cấp chính: **Tổng quan / Học viên & Lớp / Test / Công việc**. Phân tích là tab trong Tổng quan, có URL riêng. *(Thay phương án năm menu ở bản brainstorm)* | Design plan §17.1, chủ sản phẩm duyệt D01 |
| 20/09/2026 | **Hồ sơ Test bỏ hẳn khối case/phương án.** Dữ liệu case vẫn ở hồ sơ học viên; trên màn Test chỉ còn một liên kết `Hồ sơ học viên` | Design plan §22.1 |
| 20/09/2026 | Kết quả PA: tổng improved + partial gọi là **"Có cải thiện"**, vẫn hiện hai mức riêng. **Chưa đủ dữ liệu không vào bảng và không vào mẫu số** | D03 đã duyệt · Design plan §17.3 |
| 20/09/2026 | Báo cáo đơn vị: **lưu nháp cả tuần**, nộp theo cửa sổ cuối tuần. Ba trạng thái tách bạch **Nháp / Đã nộp / Chưa báo cáo**; nháp không tính đã báo cáo | D04 đã duyệt · Design plan §17.4 |
| 20/09/2026 | Form tạo case có **Đính kèm tệp + Thêm liên kết ngay dưới ô Mô tả**, cho cả học thuật và Ý thức, dùng lại ở nhập bù. Bằng chứng vẫn tùy chọn; yêu cầu là form phải hỗ trợ | CASE-ATTACH · Design plan §17.5 |
| 20/09/2026 | Bỏ cặp nút **Việc của tôi / Cả phạm vi quản lý** khỏi mặt chính Tổng quan và Học viên; thay bằng dropdown **Người phụ trách**. Không đổi ràng buộc quyền | Design plan §22.7 |
| 20/09/2026 | *(Thiết kế)* Mọi hạn hiển thị qua component **`<Han loai=…>`**, `loai` bắt buộc — sáu đồng hồ của rule book không dùng chung một cách hiển thị | Bên design · `thiet-ke/HE_GIAO_DIEN.md` §4 |
| 20/09/2026 | *(Thiết kế)* Tiến độ một đợt Test chỉ được render bằng **`<KetQuaDot>`**. Chưa đủ điểm thì Overall ghi `Chưa đủ điểm`, **cấm** badge đạt. Đơn vị đếm là **bốn kỹ năng L/R/W/S**, W1/W2 là hai bài nhập | Bên design · đóng lỗi MT-P01/MT-P02 |
| 20/09/2026 | *(Thiết kế)* Phần trăm chỉ được render qua **`<TyLe n N>`**: n/N trước, % sau; `N=0` ghi `Chưa có dữ liệu`; `N<5` gắn nhãn mẫu nhỏ | Bên design · Rule book §11 |
| 20/09/2026 | *(Thiết kế)* **Một chỉ số = một hàm trả về tập ID.** Số là `tap.length`; drill-down gọi lại đúng hàm đó với đúng quyền | Bên design · `thiet-ke/HOP_DONG_SO_LIEU.md` |
| 20/09/2026 | *(Thiết kế)* Chín điểm luật chưa chốt **C01–C09** phải nằm thành hằng số có tên ở `shared/domain/policy.ts`, chú thích cả hai phương án. Không rải `if`, không viết migration dựa trên điểm chưa chốt | Bên design · `thiet-ke/LUAT_CHO_CHOT.md` |
| 20/09/2026 | *(Thiết kế)* **Code một mạch trên MỘT nhánh, năm chặng** (mục 0.4). PR-D do một session khác giữ; năm file ở **mục 0.5** bị khoá cho tới khi PR-D được hợp nhất. **PR-D merge trước, nhánh batch merge sau** — lý do và cách gỡ xung đột ở mục 21 | Chủ sản phẩm 20/09 |
| 20/09/2026 | Buổi Writing của Fast Track chỉ chốt "Không dự thi" khi **cả hai task W1 và W2 đều là `-`**; chỉ một task `-` mà task kia có điểm hoặc chưa nhập thì buổi đó không phải vắng | Chủ sản phẩm (chấp nhận đề xuất) |
| 20/09/2026 | **`mức gấp` → `mức độ ưu tiên`**: SOS là tình trạng của học viên; mức độ ưu tiên là mức cấp bách của case. Đã đổi chữ ở mã và giao diện | Chủ sản phẩm |
| 20/09/2026 | **C02:** GVCN không xử lý case học thuật trái môn; mọi giáo viên chỉ xử lý case đúng kỹ năng mình dạy. Case Ý thức vẫn chỉ GVCN | Chủ sản phẩm · rule book 17.7 |
| 20/09/2026 | **C03** *(thay câu hỏi cũ)*: bỏ luật siết hạn khi nâng mức. Chỉ Ý thức: báo cáo khác cùng phân loại trong **3 ngày đầu** của case cũ thì lồng vào, không thì ra case mới; hạn mặc định 1 tuần | Chủ sản phẩm · rule book 17.7 |
| 20/09/2026 | **C04, C06, C07, C09 giữ như hiện tại:** đợt Ý thức đã đóng → đợt mới liên kết; tab "Đã xong từ trước" chỉ nhận case đã hoàn thành; Writing phải đủ W1 và W2 (thiếu thì báo quá hạn như thường); đề nghị dời lần hai không được Quản lý phản hồi hết tuần đó thì **huỷ** (GV tự trao đổi với QL ngoài website) | Chủ sản phẩm |
| 20/09/2026 | **C10:** nhập "-" cho tuần đã kết thúc từ trước thì **chốt ngay**. Sau cuối tuần chỉ Quản lý sửa kết luận; quyết định mới ghi đè trực tiếp, không duyệt lại; audit log chỉ để truy vết | Chủ sản phẩm |
| **21/09/2026** | **BỎ HẲN MÔ HÌNH CASE Ý THỨC.** Thay bằng **Vi phạm** (mỗi sự việc một record độc lập, mọi GV ghi được) và **Biện pháp xử lý** (9 loại, 2 trạng thái) quan hệ **nhiều–nhiều**. Không còn đợt, không còn cửa sổ gộp 3 ngày, không còn hạn 3/5/7 ngày của Ý thức, không còn tái diễn lần 2/3, không đo cải thiện. Chỉ một **cảnh báo mềm 5 ngày** | Chủ sản phẩm · `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` · rule book §18 |
| 21/09/2026 | **Y01:** GVCN **tự xác nhận hết** mọi biện pháp, kể cả Thư cảnh cáo và Đình chỉ học. **Không có bước Quản lý duyệt.** Quản lý nhận thông báo khi Thư cảnh cáo hoặc Đình chỉ học được xác nhận | Chủ sản phẩm |
| 21/09/2026 | **Y02:** chuỗi Thư cảnh cáo 1→2→3 đếm **theo lộ trình học** (`learning_cycles.id`). Sang lộ trình mới thì reset về lần 1. Đây là **rule cứng duy nhất về trình tự**, kiểm ở máy chủ | Chủ sản phẩm |
| 21/09/2026 | **Y03:** ba khu vực Ý thức của GVCN đặt ở **tab `Ý thức` của hồ sơ LỚP**, cộng một tab `Ý thức` gọn ở hồ sơ học viên. **Không** thêm khu vực cấp chính thứ 5 | Chủ sản phẩm |
| 21/09/2026 | **Y04:** **năm nhóm vi phạm** — Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác. **Bỏ `Tham gia trên lớp`**, dữ liệu cũ đổi sang `Thái độ / hành vi` | Chủ sản phẩm |
| 21/09/2026 | **Hồ sơ lớp: 4 tab** `Học viên \| Ý thức \| Phân tích lớp \| Giáo viên`. `Lộ trình` và `Chuyển tiếp lớp` là **nút ở header**, không phải tab — chúng là hành động, không phải cách xem. *(Hoà giải ba đặc tả chồng nhau: design plan §18.6 ba tab, §22.2 menu trực tiếp, và tab Ý thức mới)* | Chủ sản phẩm |
| 21/09/2026 | **Hoãn sau deploy bản chính:** design plan **§6 + góc nhìn `Giáo viên` của §18.3** (phân tích theo giáo viên). Là tính năng mới hoàn toàn, quy mô bằng 2 PR, cần D02 áp ở API/tìm kiếm/drill-down/xuất dữ liệu. Ghi lại ở `BAN_DO_OVERHAUL.md` §10 để không ai đề xuất lại như việc mới | Chủ sản phẩm |
| 21/09/2026 | **Chưa đặt mốc deploy vào kế hoạch.** Làm xong 8 PR rồi bàn riêng — không tự suy điều kiện deploy | Chủ sản phẩm |
| 21/09/2026 | **C01 đóng.** Nguồn 21/09 §3.2 viết thẳng "không được hiểu rằng trong 3 ngày đó bắt buộc phải hoàn thành cả phương án" → **hai mốc riêng**, đúng như mã đang chạy. `C03` và `C04` **hết hiệu lực** (là luật của mô hình Case Ý thức đã bỏ) — giữ hằng số kèm chú thích, không xoá dấu vết. **C08 là điểm duy nhất còn chưa chốt** | Rule book §18.6 · `LUAT_CHO_CHOT.md` §6 |
| 21/09/2026 | *(Thiết kế)* Đổi tên mức case học thuật: **`Cần chú ý` → `Bình thường`** (5 ngày). `Gấp` giữ (3 ngày). Thay câu "bỏ Bình thường" ở rule book §4.2 | Bên design, theo chữ trong nguồn 21/09 |
| 21/09/2026 | *(Thiết kế)* Ba tab Công việc dùng tên **§18.4**: `Hỗ trợ học viên / Vận hành / Báo cáo đơn vị`. Bỏ tên §7.1 (`Việc học viên / Việc vận hành / Tình hình đơn vị`) — hai mục cùng design plan gọi một thứ bằng hai chữ | Bên design · `TU_DIEN_VA_CHU.md` |
| 21/09/2026 | *(Thiết kế)* Dựng **một bảng `attachments` dùng chung** cho case, phương án, vi phạm, biện pháp. Hiện **chưa có bảng nào lưu tệp hoặc liên kết** ở bất kỳ đâu; rule mới bắt buộc Thư cảnh cáo và Đình chỉ học phải có. Làm riêng bốn lần là bốn lần sai khác nhau. Đóng luôn CASE-04 | Bên design |
| 21/09/2026 | *(Thiết kế)* **Ý thức là module thứ chín**, không nhét vào `cases/`. Lý do: `cases.ts` đã 3033 dòng | Bên design · `CODE_MAP.md` |
| 21/09/2026 | *(Thiết kế)* Vi phạm **không có mức độ nặng/nhẹ** và **không có hạn riêng** — nguồn không có, và GVCN nhìn *số lần* + *số ngày* là đủ ra quyết định. Vi phạm **có ô Môn tùy chọn**, tự điền theo phân công | Bên design |
| 21/09/2026 | *(Thiết kế)* Dữ liệu demo **reseed**, không migrate (nguồn §39 cho phép). Bộ demo phải dựng đủ **18 tình huống** ở `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §10. Hai tệp demo cũ viết lại thành **một file gọn** `DEMO.md` | Bên design |
| **21/09/2026 (tối)** | **Rulebook v3 — `thiet-ke/NGUON-Rule-v3-YThuc-PhoiHop-2026-09-21.md`.** Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md`. Ba luật **đảo ngược** chốt sáng cùng ngày: (1) Mock Test có SOS **tự tạo/gắn Case** cho từng kỹ năng trượt (W1/W2 tách) và **tự điền sẵn phương án** (tự học 1 tháng / tutor…); GVBM có 3 ngày xác định nguyên nhân + xác nhận phương án — thay "SOS chỉ là tín hiệu" và rule book §3.4; (2) **Phối hợp SOS** — việc trao đổi HS/gia đình/meeting điền sẵn theo bảng MT×SOS, GVCN xác nhận hoặc bỏ kèm lý do chọn nhanh — thay C05; (3) vi phạm ghi sai thì **sửa hoặc xoá thẳng**, không còn "đánh dấu không chính xác" — thay V11–V14 | Chủ sản phẩm |
| 21/09/2026 (tối) | Tab `Ý thức` → **`Ý thức & Phối hợp`**, hai sub-tab `Vi phạm & xử lý` · `Phối hợp SOS`. Hồ sơ lớp: vi phạm **mặc định Theo học sinh**, toggle **Theo thời gian**, bộ lọc nhóm áp cùng logic cho cả hai. Hồ sơ học viên giữ tab gọn, không toggle. *(Thay bố cục "ba khu vực xếp dọc" của `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §7.3)* | Chủ sản phẩm · v3 §11–§16 |
| 21/09/2026 (tối) | Case tự tạo từ SOS được **đóng ngay "Không cần theo dõi"** kèm lý do chọn nhanh; không vào thống kê hiệu quả | Chủ sản phẩm (Q-V3-4) |
| 21/09/2026 (tối) | **Deploy bản chính đêm nay**, dữ liệu **rỗng + tài khoản thật** (bỏ dữ liệu demo, bỏ "Vào nhanh", bỏ ngày giả). Quy mô: 1–2 chi nhánh, 200–300 HV, 30–40 GV/QL. **Chỉ dùng hạ tầng miễn phí.** Phạm vi tối thiểu: GV nhập được mọi thông tin HV (điểm, case, phương án, vi phạm, biện pháp, phối hợp SOS); QL xem được số liệu SOS, case, Ý thức. **Không cần** các tổ hợp công việc chi nhánh/toàn hệ thống | Chủ sản phẩm |
| 21/09/2026 (tối) | **Lộ trình đổi:** mục 23 (3 PR đêm nay: `PR-T` · `PR-K` · `PR-Z`) thay thứ tự mục 22. `PR-O` · `PR-P` · `PR-Q` · `PR-R` và phần lớn `PR-S` chuyển sang **sau deploy** | Chủ sản phẩm · bên design |
| **21/09/2026 (chiều)** | **Bản chính chạy Netlify + Turso + Netlify Blobs**, miễn phí, không máy nào phải luôn bật. Chọn Turso thay Supabase vì Turso cùng ngôn ngữ SQLite — Supabase (Postgres) phải dịch thêm ~1.000 câu truy vấn. Làm tối 21/09 bằng gói Max, **sau** PR-T và PR-K. Thay `PR-Z` và `TRIEN_KHAI.md` bản "máy luôn bật". Xem mục 24 | Chủ sản phẩm · bên design |
| **21/09/2026 (chiều, sau)** | **Deploy thủ công** bằng Netlify CLI từ thư mục trên máy (`netlify deploy --build`, rồi `--prod`); site **không** nối GitHub, merge PR không tự đổi web. Kéo-thả thư mục không dùng được (không mang Functions). Hệ quả kỹ thuật: build trên Windows phải đóng gói nhị phân Linux của `libsql` — thêm Task 6b | Chủ sản phẩm |
| 21/09/2026 (chiều, sau) | **PR-Z2 chia ba PR:** PR-Z2a hạ tầng (Task 0–6b, Sonnet 5 · High) · PR-Z2b an toàn dữ liệu (Task 7–9, Opus 5 · XHigh / B: Fable 5.1 · High) · PR-Z2c deploy + đo + rà soát độc lập (Task 10–11, Opus 5 · XHigh / B: Fable 5.1 · High; người rà khác người code) | Chủ sản phẩm |
| 21/09/2026 (chiều, sau) | **Từ nay mọi kế hoạch/prompt gửi sang session khác phải ghi rõ model + effort khuyến nghị và phương án B** (bảng ở `PROMPT_SESSION_CODE.md` mục 0). Cách làm việc: Opus viết plan chi tiết → session khác code theo plan → quay lại planning rà soát | Chủ sản phẩm |
| 21/09/2026 (tối) | *(Thiết kế)* Q-V3-1…Q-V3-9 ở `SOS_VA_PHOI_HOP_V3.md` §11 — đáng chú ý: **lớp Normal giữ mô hình tín hiệu cũ** (v3 chỉ nói Mock Test); SOS Event không có bảng mới; tab lớp luôn mở ở Theo học sinh; QL xem Ý thức & Phối hợp bằng **một góc nhìn** trong Phân tích hiện có | Bên design |
| **21/09/2026 (đêm)** | **C08 đóng (21/09 đêm):** lớp Normal **có dùng** dấu `-`. **Giáo viên** ghi `-` khi em chưa làm bài của tuần (máy KHÔNG tự thêm); ghi `-` thì kỹ năng đó **tự dời sang tuần sau**. Hạn chấm Normal vẫn hết Chủ nhật tuần thi → việc `R14` ở mục 22.8 | Chủ sản phẩm |
| 21/09/2026 (đêm) | **S16 chốt (21/09 đêm):** lộ trình học của em **kết thúc** (`learning_cycles` rời trạng thái `active`) mà còn case mở → máy **tự đóng** case, lý do hệ thống `Học viên kết thúc khoá`, ghi `audit_logs`, vẫn xem lại được trong lịch sử; case đóng kiểu này **không** tính vào thống kê hiệu quả | Chủ sản phẩm |
| 21/09/2026 (đêm) | **S17 chốt (21/09 đêm):** em có case **Fast Track** đang mở mà chuyển sang lớp **Normal** → máy **tự đóng** case, lý do hệ thống `Chuyển sang lớp Normal`, ghi `audit_logs`, xem lại được trong lịch sử, **không** tính vào thống kê hiệu quả. Cùng kiểu với S16 | Chủ sản phẩm |
| 21/09/2026 (đêm) | **R11 chốt (21/09 đêm):** đợt Test **hoàn tất** = mọi kỹ năng bắt buộc đã có điểm **hoặc** dấu `-` **và** đã hết Chủ nhật của tuần thi. Trước đó GV có quyền sửa bình thường; sau đó **chỉ Quản lý** sửa được, mỗi lần sửa ghi `audit_logs`. Khớp luật đã chốt "sau cuối tuần chỉ Quản lý sửa kết luận" | Chủ sản phẩm |
| **22/09/2026** | **PR-Z2a đổi model sang Fable 5.1 · High** (B: Sonnet 5 · High). Lý do: thử thật cho thấy kế hoạch cũ ra một máy chủ sập ngay khi Netlify nạp (`import.meta.url` rỗng trong bản gói CommonJS) và sót một đường đăng nhập không mật khẩu (`POST /demo/session`); đã sửa trong kế hoạch, nhưng phần này cần phán đoán ở cửa dừng | Session planning |
| 22/09/2026 | **Z2b và Z2c KHÔNG gộp một mạch** dù cùng model: giữa hai phần bắt buộc rà soát + merge, vì Z2b viết lệnh chạm database chính còn Z2c chạy chúng | Chủ sản phẩm hỏi · session planning chốt |
| 22/09/2026 | **PR-K2** (mục 23.3b) sửa 4 lỗi rà soát PR-K; chạy song song với PR-Z2a (khác bộ file) | Session planning |
| 22/09/2026 | `.netlify/state.json` (mã site, không phải bí mật) **giữ trong git** để worktree của session code biết site nào; phần còn lại của `.netlify/` bị bỏ qua | Session planning |
| **22/09/2026** | **Bản nháp KHÔNG BAO GIỜ chạm dữ liệu thật:** biến Turso của database `pisatracking` chỉ đặt cho bản chính thức (`--context production`); mọi bản nháp dùng `pisatracking-demo`; kho tệp Netlify Blobs đặt tên theo database. Task 10 đổi thứ tự: đưa lên địa chỉ chính thức (chưa báo giáo viên) rồi kiểm luồng ở đó | Session planning (rà soát Opus Z2a, Important 5) |
| 22/09/2026 | Tên database thật: thử = `pisatracking-demo`, bản chính = `pisatracking` | Chủ sản phẩm |
| **22/09/2026** | **PR-HV — hồ sơ học viên theo prototype v3** (`thiet-ke/tham-khao/ho-so-hoc-vien-v3.html`, `ho-so-lop-v3.html`). (D1) "Biện pháp (xử lý)" → **"Phương án (PA)"** ở mọi chữ người dùng thấy; màn trộn ghi "PA xử lý" / "PA học thuật" — **thay luật cũ** của `TU_DIEN_VA_CHU.md` cấm gọi biện pháp là phương án. (D2) Hồ sơ học viên **3 tab** `Học thuật` (mặc định) · `Ý thức & Phối hợp` · `Hành trình`, không có tab Tổng quan. (D3) **Bỏ "Hãy"** ở đầu câu nhắc (đảo K3-6). (D4) **Z2c đợi PR-HV merge**; PR-HV chạy song song Z2b. (D5) **Q7, Q8 của PR-Q chuyển sang PR-HV**. Đặc tả: `docs/superpowers/specs/2026-09-22-ho-so-hoc-vien-overhaul-design.md` | Chủ sản phẩm |
| 20/09/2026 | **C01 và C08 chưa chốt hẳn:** C01 — chủ sản phẩm mô tả (3 ngày phải có PA; Học thuật cập nhật mỗi Chủ nhật + chốt cuối đợt; Ý thức hoàn thành hết PA trong 1 tuần) và hỏi lại "đúng không?"; C08 — hạn chấm Normal hết Chủ nhật tuần thi (đã đúng), còn "chưa có bài thì thêm - và dời sang tuần sau" chưa rõ ai thêm và Normal có dùng "-" không | Chủ sản phẩm · chờ trả lời |
| 23/09/2026 | **C08 phần dấu `-` ĐÃ NỐI DÂY (PR-Rc1):** giáo viên ghi `-` ở lớp thường thì môn đó tự dời sang tuần sau (`server/src/normal/regular.ts` → `reportRegularNoShow`, dùng lại `setSkillWeek`); máy không tự thêm `-`. Nút dời lịch một môn cho lớp thường (R12) và phần lịch của R14 vẫn là việc PR-Rc2 | PR-Rc1 |
| 26/09/2026 | **Sau đánh giá giao diện toàn web** (`thiet-ke/DANH_GIA_GIAO_DIEN_2026-09-26.md`, 24/40): (1) giữ nguyên thang SOS 1 vàng / SOS 2 cam / SOS 3 đỏ để đồng bộ; **SOS tạm thời mang màu của mức SOS đó**, viền đứt, luôn có chữ "tạm thời" (thay dòng "đỏ" ở HE_GIAO_DIEN §5; đã sửa file đó); (2) thứ tự sửa: **"sửa sai sự thật" trước** (gói UX-A, UX-B); (3) **chưa sửa ngay**, ghép vào các prompt UI sắp tới theo bảng "File → mục" của `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` | Chủ sản phẩm |

---
| 02/10/2026 | Chữ mang nội dung (meta dòng, nhãn ô, lời nhắc) tối thiểu **12 px**; tiêu đề cột bảng và badge giữ 11–11,5 px | Chủ sản phẩm, critique 02/10 (Q-K) |
| 02/10/2026 | Tách mục "Không cần duyệt — để QL biết" khỏi **Chờ duyệt** thành nhóm "Để QL biết"; badge Chờ duyệt chỉ đếm mục cần bấm Duyệt | Chủ sản phẩm, critique 02/10 (Q-D) |
| 02/10/2026 | Badge ba kiểu: **tròn đặc** = trạng thái học viên/lớp (tạm thì viền đứt) · **vuông viền liền** = trạng thái việc · **vuông viền đứt khi tạm** = kết quả điểm (`KetQuaDot`); cùng cỡ 11,5 px | Chủ sản phẩm, critique 02/10 (Q-H) |

## 4. Lộ trình và phụ thuộc

| PR | Nội dung | Chờ ai | Vì sao ở vị trí này |
|---|---|---|---|
| **PR1** | Số khớp danh sách, và đường đi tới đó | — | Lỗi đang chặn việc hàng ngày, và **không cần dựng thứ gì mới** |
| **PR-A** | Mở lại việc tạo case Ý thức (CASE-01) | — | P0 đang chặn hẳn một tính năng. Nhỏ, độc lập |
| **PR2** | Bộ chọn tuần dùng chung → Kế hoạch Test | PR1 | Bộ chọn tuần là nền cho PR3; Kế hoạch Test là màn cần nó nhất |
| **PR3** | Chấm điểm, dấu "–", màn hồ sơ Test gọn | PR2 | Dùng bộ chọn tuần của PR2 cho việc hoãn hạn chấm |
| **PR-B** | Phân công GV — nốt phần còn thiếu | — | Không chặn ai; ba luật chính đã chạy đúng (mục 2.2) |
| **PR-C** | Form case đúng và gọn — ô trùng, ngày Ý thức, tab nhập bù, AUTH-01 | — | Chủ sản phẩm ưu tiên 19/09. Gom vì cùng đụng form tạo case, máy chủ và tầng quyền |
| **PR-D** | Khung case gọn — gộp hai khối lồng nhau làm một | PR-C | Dùng form đã sửa ở PR-C. Thuần màn hiển thị hồ sơ. **Đang làm ở session/nhánh khác — mục 0.5** |
| **PR-E** | Nền giao diện dùng chung — `<Han>`, `<KetQuaDot>`, `<TyLe>`, `<NgayNghiepVu>`, sửa bố cục bộ chọn tuần (mục 15) | — | Bốn PR sau đều cần bộ component này. Làm trước thì không phải sửa lại nhãn ba lần |
| **PR-F** | Hợp đồng số liệu — một chỉ số một hàm, `<SoLieu>`, đóng F01/F02/F03/F05 (mục 16) | PR-E | F01 là P0: hai chi nhánh cùng tuần đang cộng lẫn. Cần `<TyLe>`/`<SoLieu>` của PR-E |
| **PR-G** | Dấu '-' và chốt không dự thi cuối Chủ nhật (mục 17) | — | Rule book §17.1 là chốt mới nhất và chưa có luồng nào. Không đụng file PR-D nên chạy song song được |
| **PR-I** | Hồ sơ Test gọn + áp hệ giao diện vào khối case (mục 18) | **PR-D đã nằm trong nhánh** + PR-E, PR-G | Sửa đúng năm file PR-D đang giữ. Làm trước khi hợp nhất PR-D là xung đột chắc chắn — thứ tự merge ở **mục 21** |
| **PR-H** | Biên tập tiếng Việt toàn web theo bộ chữ (mục 19) | PR-D, PR-I | Chạm gần như mọi file JSX. Làm cuối để chỉ phải quét một lần |

**Năm chặng trên chạy một mạch trên một nhánh** — xem mục 0.4. Thứ tự merge với nhánh PR-D và
cách gỡ từng loại xung đột ở **mục 21**.

**Giá phải trả của cách 1, đã chấp nhận:** bảng chấm bị chạm hai lần — PR1 đổi *hàng nào hiện
ra*, PR2 đổi *cách chọn tuần*. Hai phần khác nhau của cùng màn hình, không phải làm lại.

---

## 5. PR1 — Số khớp danh sách, và có đường đi tới đó

**Mục tiêu người dùng thấy:** badge ghi "8 bài cần chấm", bấm vào ra đúng 8 bài đó; bảng chấm
tuần này hiện RLW thi tuần này; việc nợ từ ba tuần trước không mất khi đổi tuần.

**PR1 không đổi cấu trúc dữ liệu, không migration, không reset demo.** Toàn bộ nằm ở đường
*đọc*: cách đếm, cách lọc, cách hiển thị. Không mở thêm quyền cho ai.

### 5.1. Bố cục file

| File | Trách nhiệm sau PR1 |
|---|---|
| `shared/domain/people.ts` | Thêm `WorkScope` + nhãn. Đây là nơi duy nhất đặt tên phạm vi — đúng triết lý sẵn có của file |
| `shared/domain/fasttrack.ts` | Thêm `pendingSkillsOf()` — **luật đếm duy nhất**, đứng cạnh `awaitingScore()` |
| `server/src/permissions.ts` | Thêm `defaultWorkScope(p)`. Không sửa `mySkills` / `editableSkills` |
| `server/src/fasttrack/attempts.ts` | `Cell` thêm `required`; `listAttempts` nhận `scope`, trả `pendingSkills` + `pendingOwners`; `classScoreSheet` lọc theo lịch từng kỹ năng |
| `server/src/classes/classes.ts` | `needScores` đếm **ô**, theo `scope`, qua `pendingSkillsOf()` |
| `server/src/routes/index.ts` | Nhận `scope` trên `/attempts` và `/classes` |
| `server/src/cases/cases.ts` | `delta` → `gap` (so kỳ vọng) + `trend` (so lượt trước) |
| `web/src/modules/students/StudentsPage.tsx` | Nút chuyển phạm vi, nhãn badge, cột GV phụ trách, cột "nợ từ tuần" |
| `web/src/modules/classes/ClassOverviewPage.tsx` | Nhãn badge |
| `web/src/modules/cases/SkillBoard.tsx` | `ScoreCell` đọc `gap`/`trend`; làm bốn màu dễ nhìn hơn |
| `server/src/tests/run.ts` | Phép kiểm mới |

**Điểm kiến trúc quan trọng:** badge và danh sách phải gọi **cùng một hàm** `pendingSkillsOf()`.
Sửa cho hai chỗ "ra số giống nhau" mà vẫn để hai đoạn đếm riêng thì chúng sẽ lệch lại ở lần
sửa sau. Đó chính là cách lỗi này sinh ra lần đầu.

---

### Task 1: Luật đếm duy nhất

**Files:**
- Modify: `shared/domain/fasttrack.ts` (thêm cuối file, cạnh `awaitingScore` dòng 196)
- Modify: `shared/domain/people.ts` (thêm cuối phần bộ lọc học viên)
- Test: `server/src/tests/run.ts`

**Interfaces:**
- Produces: `WorkScope`, `WORK_SCOPE_LABEL`, `pendingSkillsOf(cells, scope)` — Task 2, 3, 4 đều dùng.

- [x] **Step 1: Viết phép kiểm cho luật đếm**

Thêm vào `server/src/tests/run.ts`, ngay trước phép kiểm ở dòng 1195:

```ts
check('Luật đếm bài cần chấm — một hàm, hai phạm vi', () => {
  const cells = [
    { skill: 'listening', required: true,  scored: false, progress: 'due' as const,      mine: true  },
    { skill: 'reading',   required: true,  scored: false, progress: 'due' as const,      mine: false },
    { skill: 'writing1',  required: true,  scored: true,  progress: 'due' as const,      mine: true  },
    { skill: 'writing2',  required: false, scored: false, progress: 'due' as const,      mine: true  },
    { skill: 'speaking',  required: true,  scored: false, progress: 'upcoming' as const, mine: true  },
  ];
  const mine = domain.pendingSkillsOf(cells, 'mine');
  const managed = domain.pendingSkillsOf(cells, 'managed');
  assert(mine.join(',') === 'listening', `mine phải chỉ ra listening, đang ra: ${mine.join(',')}`);
  assert(
    managed.join(',') === 'listening,reading',
    `managed phải ra listening,reading, đang ra: ${managed.join(',')}`,
  );
});
```

**Lưu ý harness:** `run.ts` bind cả `shared/domain` vào biến `domain` (dòng 42), nên gọi
`domain.pendingSkillsOf(...)`. Đừng thêm tên vào khối destructure ở dòng 20 — thêm vào đó là
sửa một dòng nhiều phép kiểm khác đang dùng, không cần thiết.

- [x] **Step 2: Chạy và xác nhận nó HỎNG**

```bash
npm test
```

Kỳ vọng: phép kiểm mới báo ✗ với `domain.pendingSkillsOf is not a function`.
Nếu nó **đạt** ngay thì dừng lại — nghĩa là hàm đã tồn tại và mục 2 của file này sai.

- [x] **Step 3: Viết hàm**

Thêm cuối `shared/domain/fasttrack.ts`:

```ts
/**
 * BÀI CẦN CHẤM — MỘT LUẬT DUY NHẤT, dùng cho CẢ badge và danh sách.
 *
 * Đây là chỗ lỗi cũ sinh ra: badge đếm theo "được phép sửa", danh sách lọc theo "được phân
 * công", nên Quản trị thấy badge 28 rồi bấm vào ra rỗng. Hai phép đếm riêng thì dù có sửa
 * cho khớp hôm nay, lần sửa sau chúng lại lệch. Nên chỉ có một hàm, và hai nơi cùng gọi nó.
 *
 * `mine`     kỹ năng người đang xem ĐƯỢC PHÂN CÔNG dạy — việc của chính họ.
 * `managed`  mọi bài chưa chấm trong phạm vi họ được xem, ai phụ trách cũng tính. Đây là
 *            con số để ĐÔN ĐỐC, nên nó không phụ thuộc việc người xem có quyền sửa hay không.
 */
export type PendingCell = {
  skill: string;
  required: boolean;
  scored: boolean;
  progress: SkillProgress;
  mine: boolean;
};

export function pendingSkillsOf(cells: PendingCell[], scope: 'mine' | 'managed'): string[] {
  return cells
    .filter((c) => c.required && !c.scored && awaitingScore(c.progress))
    .filter((c) => (scope === 'mine' ? c.mine : true))
    .map((c) => c.skill);
}
```

- [x] **Step 4: Đặt tên phạm vi ở một chỗ**

Thêm cuối phần bộ lọc học viên trong `shared/domain/people.ts`:

```ts
/**
 * HAI PHẠM VI CÔNG VIỆC — đặt tên ở ĐÂY vì cùng lý do với `STUDENT_FILTERS`: chủ sản phẩm
 * yêu cầu "cách gọi phải giống hệt nhau ở mọi trang". Mỗi màn tự viết nhãn của mình là cách
 * chắc chắn nhất để cùng một việc mang hai cái tên.
 *
 * Cố ý để hai vai thấy HAI CON SỐ KHÁC NHAU ở cùng một lớp: GVBM Listening thấy 2, Quản lý
 * thấy 8. Họ hỏi hai câu khác nhau. Vì thế badge BẮT BUỘC ghi kèm phạm vi, không để trơ
 * một con số rồi ai đoán nấy.
 */
export const WORK_SCOPES = ['mine', 'managed'] as const;
export type WorkScope = (typeof WORK_SCOPES)[number];
export const WORK_SCOPE_LABEL: Record<WorkScope, string> = {
  mine: 'Việc của tôi',
  managed: 'Trong phạm vi quản lý',
};
export const WORK_SCOPE_HINT: Record<WorkScope, string> = {
  mine: 'Kỹ năng bạn được phân công dạy.',
  managed: 'Mọi bài chưa chấm trong phạm vi bạn được xem, kèm tên giáo viên phụ trách.',
};
```

- [x] **Step 5: Chạy và xác nhận nó ĐẠT**

```bash
npm test
```

Kỳ vọng: `✓ Luật đếm bài cần chấm — một hàm, hai phạm vi`, và **320 đạt, 0 không đạt**.

- [x] **Step 6: Commit**

```bash
git add shared/domain/fasttrack.ts shared/domain/people.ts server/src/tests/run.ts
git commit -m "Luật đếm bài cần chấm gom về một hàm dùng chung"
```

---

### Task 2: Ô điểm biết mình có bắt buộc hay không

> **Cập nhật 18/09/2026 (session code PR1):** giả định của mục này SAI. Đọc
> `server/src/fasttrack/attempts.ts` thì `SkillCell` (tên thật của "`Cell`" nói ở đây) đã có
> sẵn `required: boolean`, độc lập với `canEdit`/`mine`, và đã được gán trong `skillCells()`
> từ trước (rất có thể từ PR18). Không cần sửa sản phẩm — chỉ thêm đúng phép kiểm ở Step 1 để
> khoá lại hành vi đó (đã ĐẠT ngay, không cần Step 3). Xem mục 14.

`pendingSkillsOf` cần `required`, nhưng `Cell` hiện chỉ có `canEdit` và `mine` — cả hai đã
nhân `required` vào rồi nên không tách ra được. Quản lý không có quyền sửa nào, nên
`canEdit` của họ luôn `false` và không dùng để đếm phạm vi quản lý được.

**Files:**
- Modify: `server/src/fasttrack/attempts.ts:190–204` (kiểu `Cell`) và `:270–287` (dựng ô)
- Test: `server/src/tests/run.ts`

**Interfaces:**
- Consumes: `pendingSkillsOf` (Task 1)
- Produces: `Cell.required: boolean` — Task 3 và 4 dùng.

- [x] **Step 1: Viết phép kiểm**

```ts
check('Ô điểm nói rõ kỹ năng có bắt buộc, độc lập với quyền người xem', () => {
  const a = conn
    .prepare(`SELECT a.* FROM assessment_attempts a WHERE a.status != 'cancelled' LIMIT 1`)
    .get() as any;
  const d = attempts.attemptDetail(P.mbManager, a.id);
  assert(d.cells.length > 0, 'Không lấy được ô điểm nào để kiểm');
  assert(
    d.cells.every((c: any) => typeof c.required === 'boolean'),
    'Mọi ô điểm phải có trường required',
  );
  assert(
    d.cells.some((c: any) => c.required) && d.cells.every((c: any) => !c.canEdit),
    'Quản lý không sửa được ô nào nhưng vẫn phải thấy ô nào bắt buộc',
  );
});
```

`attemptDetail` ở `server/src/fasttrack/attempts.ts:576`; các phép kiểm sẵn có đã gọi nó theo
đúng kiểu này (xem `run.ts:381`).

- [x] **Step 2: Chạy và xác nhận nó HỎNG**

```bash
npm test
```

Kỳ vọng: ✗ với "phải có trường required".

- [x] **Step 3: Thêm trường**

Trong kiểu `Cell` (`attempts.ts:190–204`), thêm ngay trên `canEdit`:

```ts
  /**
   * KỸ NĂNG NÀY CÓ BẮT BUỘC TRONG ĐỢT — không phụ thuộc người đang xem.
   *
   * `canEdit` và `mine` đều đã nhân `required` vào, nên không tách lại được từ chúng. Quản lý
   * không có quyền sửa ô nào, nên đếm phạm vi quản lý bằng `canEdit` sẽ luôn ra 0 — đó đúng
   * là lỗi badge 0 của Quản lý.
   */
  required: boolean;
```

Trong phần dựng ô (`attempts.ts` khoảng dòng 275, cạnh `canEdit`), thêm:

```ts
      required,
```

- [x] **Step 4: Chạy và xác nhận nó ĐẠT**

```bash
npm run build:server && npm test
```

Kỳ vọng: **321 đạt, 0 không đạt**.

- [x] **Step 5: Commit**

```bash
git add server/src/fasttrack/attempts.ts server/src/tests/run.ts
git commit -m "Ô điểm mang theo required, độc lập với quyền người xem"
```

---

### Task 3: Badge và danh sách cùng một số

**Files:**
- Modify: `server/src/permissions.ts` (thêm `defaultWorkScope`)
- Modify: `server/src/fasttrack/attempts.ts` — `AttemptFilters` (dòng 363–372), phần dựng
  hàng (dòng 470–490 cho Normal, 540–550 cho FT), bộ lọc `need` (dòng 566)
- Modify: `server/src/classes/classes.ts:135–196`
- Modify: `server/src/routes/index.ts` (đường `/attempts`, `/classes`)
- Test: `server/src/tests/run.ts`

**Interfaces:**
- Consumes: `pendingSkillsOf` (Task 1), `Cell.required` (Task 2)
- Produces: `listAttempts(p, { scope })` → mỗi hàng có `pendingSkills: string[]` và
  `pendingOwners: Record<string, string | null>`; `listClassSummaries(p, { scope })` →
  `needScores` là **số ô**. Task 4 dùng cả hai.

- [x] **Step 1: Viết phép kiểm — đây là phép kiểm chặn lỗi gốc**

```ts
check('Badge bằng đúng danh sách — cả ba vai, cả hai phạm vi', () => {
  for (const [who, p] of [
    ['Quản trị', P.admin], ['Quản lý MB', P.mbManager], ['GV W1', P.w1Teacher],
  ] as const) {
    for (const scope of ['mine', 'managed'] as const) {
      const rows = classesSvc.listClassSummaries(p, { scope }).rows;
      for (const c of rows) {
        const listed = attempts
          .listAttempts(p, { classId: c.id, need: 'my_scores', scope })
          .rows.reduce((n: number, r: any) => n + r.pendingSkills.length, 0);
        assert(
          c.needScores === listed,
          `${who} · ${scope} · lớp ${c.code}: badge ${c.needScores} khác danh sách ${listed}`,
        );
      }
    }
  }
});
check('Phạm vi quản lý nhìn thấy việc mà người xem không được phân công', () => {
  const managed = classesSvc.listClassSummaries(P.admin, { scope: 'managed' }).rows
    .reduce((n: number, c: any) => n + c.needScores, 0);
  const mine = classesSvc.listClassSummaries(P.admin, { scope: 'mine' }).rows
    .reduce((n: number, c: any) => n + c.needScores, 0);
  assert(managed > 0, 'Quản trị phải thấy có việc trong phạm vi quản lý');
  assert(mine === 0, 'Quản trị không dạy lớp nào nên "việc của tôi" phải bằng 0');
});
```

Sửa luôn phép kiểm cũ ở dòng 1195 (`Badge "cần nhập điểm" theo đúng phân công của người đang
xem`): nó so badge với **số hàng**, giờ badge là **số ô**. Đổi thành so với tổng
`pendingSkills.length` như trên, giữ nguyên tên phép kiểm.

- [x] **Step 2: Chạy và xác nhận nó HỎNG**

```bash
npm test
```

Kỳ vọng: ✗ ở cả hai phép kiểm mới, và thông báo chỉ ra đúng lớp bị lệch.

- [x] **Step 3: Phạm vi mặc định**

Thêm vào `server/src/permissions.ts`, cạnh `mySkills` (dòng 325). Nhớ thêm `WorkScope` vào
khối import từ `../../shared/domain/index.ts` ở đầu file:

```ts
/**
 * PHẠM VI MỞ RA MẶC ĐỊNH. Ai có dạy thì thấy việc của mình trước — người vừa dạy vừa quản
 * vẫn mở ở "việc của tôi", vì việc của mình mới là thứ không ai làm thay được.
 */
export function defaultWorkScope(p: Principal): WorkScope {
  const today = demoToday();
  return p.assignments.some((a) => activeAt(a, today)) ? 'mine' : 'managed';
}
```

- [x] **Step 4: Đếm ô ở danh sách lớp**

Trong `server/src/classes/classes.ts`:

- `listClassSummaries` nhận thêm `scope?: WorkScope` trong bộ lọc; thiếu thì
  `defaultWorkScope(p)`.
- **Bỏ** dòng `if (!editable.length) continue;` (dòng 159) — chính nó làm Quản lý ra 0.
- Cả hai nhánh (Normal và FT) dựng danh sách ô rồi gọi `pendingSkillsOf(cells, scope)`, và
  `bump` theo **độ dài mảng**, không phải `+1` mỗi đợt:

```ts
    /*
     * ĐẾM Ô, KHÔNG ĐẾM ĐỢT. Chấm xong ba trong bốn môn mà số không giảm thì người dùng
     * tưởng mình chưa làm gì. Và dùng ĐÚNG hàm mà danh sách đích dùng, để hai số không
     * thể lệch.
     */
    const pending = pendingSkillsOf(cells, scope);
    if (pending.length) {
      needScores.set(a.class_id, (needScores.get(a.class_id) ?? 0) + pending.length);
    }
```

Nhánh Normal đang dùng `regularSkillViews`; map sang `PendingCell` tại chỗ:

```ts
      const cells = editableOrAll.map((k) => {
        const row = rows.find((r) => r.skill === k);
        const v = views.get(k);
        return {
          skill: k,
          required: !!v,
          scored: row?.raw_score !== null && row?.raw_score !== undefined,
          progress: v?.progress ?? 'upcoming',
          mine: mineSkills.includes(k),
        };
      });
```

`editableOrAll` là bộ kỹ năng của chương trình (`skillsByClass`), **không** phải
`editableByClass` — phạm vi quản lý phải đếm cả môn người xem không sửa được.

- [x] **Step 5: Trả `pendingSkills` ở danh sách đợt**

Trong `server/src/fasttrack/attempts.ts`:

- `AttemptFilters` thêm `scope?: WorkScope`.
- `PendingCell` dùng `scored`, còn `Cell` của FT dùng `band`, nên cần một bộ chuyển. Viết nó
  **một lần**, cạnh `skillCells`, để hai nhánh cùng gọi:

```ts
/** Đưa ô điểm về đúng hình dạng mà luật đếm dùng chung cần. */
function pendingInputOf(cells: Cell[]): PendingCell[] {
  return cells.map((c) => ({
    skill: c.skill,
    required: c.required,
    scored: c.band !== null,
    progress: c.progress,
    mine: c.mine,
  }));
}
```

- Nhánh FT dựng hàng thêm (nhánh Normal đã có `cells` dạng `PendingCell` sẵn từ Step 4, dùng
  thẳng, không qua bộ chuyển):

```ts
        /* Tập bài cần chấm THEO PHẠM VI ĐANG XEM — cùng hàm với badge ở danh sách lớp. */
        pendingSkills: pending,
        /* Ai phụ trách từng bài — danh sách của Quản lý là để ĐÔN ĐỐC, nên phải có tên. */
        pendingOwners: ownersOf(a.class_id, pending),
```

  với `const pending = domain.pendingSkillsOf(pendingInputOf(cells), scope);` tính một lần
  phía trên, không gọi hai lần.

`ownersOf(classId, skills)` đọc `teacher_assignments` đang hiệu lực, trả
`{ [skill]: full_name | null }`. Đặt nó cạnh `loadBundle` và nạp một lần cho cả danh sách,
đừng hỏi từng hàng.

- Giữ nguyên `myPendingSkills` và `myPendingDetail` — nhiều màn khác đang dùng.
- Bộ lọc dòng 566 đổi sang `pendingSkills`:

```ts
    case 'my_scores':
      mapped = mapped.filter((m) => m.pendingSkills.length > 0 && m.status !== 'cancelled');
      break;
```

- [x] **Step 6: Nhận `scope` trên đường API**

`server/src/routes/index.ts`: cả `/attempts` và `/classes` đọc `qStr(req, 'scope')`, chỉ nhận
giá trị thuộc `WORK_SCOPES`, sai thì bỏ qua và để máy chủ tự chọn mặc định. **Không** báo lỗi
vì tham số hỏng — màn hình vẫn phải mở được.

- [x] **Step 7: Chạy và xác nhận nó ĐẠT**

```bash
npm run build:server && npm test
```

Kỳ vọng: **323 đạt, 0 không đạt**.

- [x] **Step 8: Commit**

```bash
git add server/src shared/domain
git commit -m "Badge và danh sách việc cần chấm dùng cùng một phép đếm theo phạm vi"
```

---

### Task 4: Bảng chấm hiện đúng bài của tuần đang xem

**Files:**
- Modify: `server/src/fasttrack/attempts.ts:1127–1163` (`classScoreSheet`)
- Test: `server/src/tests/run.ts`

**Interfaces:**
- Consumes: `loadSkillRows` / `skillScheduleOf` từ `server/src/fasttrack/skillSchedule.ts`

- [x] **Step 1: Viết phép kiểm T08**

```ts
check('T08 · RLW tuần này, S tuần sau: mỗi bảng tuần hiện đúng phần của nó', () => {
  const row = conn
    .prepare(
      `SELECT ask.attempt_id, a.class_id,
              MIN(ask.planned_period_id) AS early, MAX(ask.planned_period_id) AS late
         FROM attempt_skills ask
         JOIN assessment_attempts a ON a.id = ask.attempt_id
        WHERE ask.required = 1 AND ask.planned_period_id IS NOT NULL AND a.status != 'cancelled'
        GROUP BY ask.attempt_id
       HAVING early != late
        LIMIT 1`,
    )
    .get() as any;
  assert(row, 'Bộ demo phải có ít nhất một đợt tách tuần để kiểm — xem DEMO.md');

  for (const periodId of [row.early, row.late]) {
    const sheet = attempts.classScoreSheet(P.admin, row.class_id, periodId);
    assert(
      sheet.rows.some((r: any) => r.attemptId === row.attempt_id),
      `Đợt ${row.attempt_id} phải hiện ở bảng tuần ${periodId} vì có kỹ năng thi tuần đó`,
    );
  }
});
```

- [x] **Step 2: Chạy và xác nhận nó HỎNG**

```bash
npm test
```

Kỳ vọng: ✗ ở **một** trong hai tuần — tuần không phải `planned_period_id` của đợt.

- [x] **Step 3: Lọc theo lịch từng kỹ năng**

Trong `classScoreSheet`, thay dòng 1137:

```ts
  if (period) { sql += ' AND a.planned_period_id = ?'; params.push(period.id); }
```

bằng:

```ts
  /*
   * LỌC THEO LỊCH TỪNG KỸ NĂNG, KHÔNG THEO TUẦN CỦA CẢ ĐỢT.
   *
   * RLW thi tuần này còn Speaking tuần sau thì đợt HOÀN TẤT ở tuần sau. Lọc theo
   * `a.planned_period_id` như bản trước làm cả đợt biến mất khỏi bảng tuần này — giáo viên
   * mở ra thấy trống trong khi đang có ba bài phải chấm.
   *
   * Quy ước "kết quả của đợt thuộc tuần hoàn tất" KHÔNG đổi. Chỗ này chỉ quyết định
   * HÀNG NÀO HIỆN RA ĐỂ CHẤM.
   */
  if (period) {
    sql += ` AND (
      a.planned_period_id = ?
      OR EXISTS (SELECT 1 FROM attempt_skills ask
                  WHERE ask.attempt_id = a.id AND ask.required = 1
                    AND ask.planned_period_id = ?)
    )`;
    params.push(period.id, period.id);
  }
```

Giữ `a.planned_period_id = ?` ở nhánh đầu: đợt cũ chưa có dòng lịch kỹ năng nào vẫn phải hiện
ra (xem chú thích của `loadSkillRows` — danh sách là màn chỉ đọc, không tự tạo dòng).

- [x] **Step 4: Chạy và xác nhận nó ĐẠT**

```bash
npm run build:server && npm test
```

Kỳ vọng: **324 đạt, 0 không đạt**.

- [x] **Step 5: Commit**

```bash
git add server/src/fasttrack/attempts.ts server/src/tests/run.ts
git commit -m "Bảng chấm theo tuần lọc theo lịch từng kỹ năng"
```

---

### Task 5: Giao diện — phạm vi, nhãn, và việc nợ không mất

**Files:**
- Modify: `web/src/modules/students/StudentsPage.tsx` — badge (353–355), `WorkQueue` (380–450)
- Modify: `web/src/modules/classes/ClassOverviewPage.tsx:96`
- Kiểm: bằng tay trên trình duyệt (mục 13.2)

**Interfaces:**
- Consumes: `pendingSkills`, `pendingOwners`, `needScores` (Task 3); `WORK_SCOPE_LABEL` (Task 1)

- [x] **Step 1: Nút chuyển phạm vi**

Đặt cạnh thanh bộ lọc học viên, dùng đúng kiểu tab của dự án (xem `StudentDetailPage.tsx:283`):

```tsx
{/*
  PHẠM VI LƯU VÀO ĐƯỜNG DẪN, không vào state: tải lại trang và bấm Back phải giữ đúng chỗ
  người dùng đang đứng. Không có trên đường dẫn thì KHÔNG tự đặt — để máy chủ chọn mặc định
  theo vai, rồi hiện ra phạm vi nó đã chọn.
*/}
<span className="flex flex-wrap gap-1">
  {WORK_SCOPES.map((s) => (
    <button key={s} type="button"
      className={`btn btn-sm ${scope === s ? 'btn-primary' : 'btn-ghost'}`}
      title={WORK_SCOPE_HINT[s]}
      onClick={() => {
        const next = new URLSearchParams(params);
        next.set('scope', s);
        setParams(next);
      }}>
      {WORK_SCOPE_LABEL[s]}
    </button>
  ))}
</span>
```

- [x] **Step 2: Nhãn badge nói rõ đơn vị và phạm vi**

`{cls.needScores} bài cần chấm`, và `title` của nó là `WORK_SCOPE_HINT[scope]`. Bỏ chữ "lượt".
Sửa cả `ClassOverviewPage.tsx:96` cho khớp — hai màn không được gọi khác nhau.

- [x] **Step 3: Hàng đợi bỏ khoá theo tuần**

`WorkQueue` **không** nhận tuần. Tiêu đề đổi thành `{n} bài cần chấm`, và thêm một cột
**"Nợ từ tuần"** lấy tuần thi của chính kỹ năng còn thiếu (`pendingDetail[].weekCode`, hoặc
`period.code` nếu đợt chưa tách lịch). Cột "Việc cần làm" đọc `pendingSkills`; khi
`scope === 'managed'` thì hiện thêm tên người phụ trách từ `pendingOwners`.

- [x] **Step 4: Nói rõ khi Quản lý nhập hộ**

Ở phạm vi quản lý, dòng nào người xem không được phân công thì ghi một dòng nhỏ **"bạn không
phụ trách bài này — nhập sẽ được ghi là sửa hộ"**. Máy chủ đã phân biệt sẵn
(`scoreEditPath` trả `'override'`, `server/src/permissions.ts:330`); việc ở đây chỉ là **nói
ra** điều đó, không đổi quyền.

- [x] **Step 5: Kiểm bằng tay**

Theo mục 13.2. Bắt buộc thử bằng **cả ba** tài khoản: một GVBM · Quản lý Monbay · Quản trị.

- [x] **Step 6: Commit**

```bash
git add web/src
git commit -m "Hai phạm vi công việc hiện rõ trên màn, badge ghi đơn vị là bài"
```

---

### Task 6: Sáu đường vào nhập điểm

> **Cập nhật 18/09/2026 (session code PR1):** khảo sát cả sáu đường trước khi sửa cho thấy
> phạm vi thật lớn hơn nhiều so với hai bước mô tả sẵn ở đây — bốn trên sáu đường cần dựng
> mới (một quy ước tham số "đợt đang focus" trên hồ sơ học viên, tay bấm trên mốc hành
> trình, sửa hướng hai nhãn MT2/MT3/Final, và một bộ resolver cho thông báo). Đó là việc
> **thiết kế thêm**, không phải nốt hai bước còn thiếu của Task này — làm ẩu để "cho xong"
> sẽ tạo ra đúng kiểu vá tạm mà mục 1.2 cảnh báo. Theo mục 0.3 (đừng gộp) và mục 3
> ("phát hiện lỗi mới ngoài phạm vi → thêm vào mục 12, đừng tự mở rộng PR đang làm"),
> quyết định là: làm **Step 1** (đã đúng sẵn, chỉ xác nhận) + sửa đúng **một lỗi thật đã xác
> định** (thông báo không điều hướng đi đâu, mục 12.5), rồi dừng Task 6 ở đây. Bốn đường còn
> lại ghi vào backlog mục 12.5 làm PR riêng.

**Files:**
- Modify: `web/src/modules/students/StudentsPage.tsx`, `web/src/modules/classes/ClassOverviewPage.tsx`,
  `web/src/modules/students/StudentDetailPage.tsx`, `web/src/modules/students/JourneyTimeline.tsx`

Theo bảng sổ §13.9. Mỗi đường mang theo **học viên + đợt + kỹ năng đang focus** trên đường dẫn.

| Xuất phát | Đích | Trạng thái sau khảo sát 18/09 |
|---|---|---|
| Thanh điều hướng chính | Hàng đợi, phạm vi mặc định theo vai | OK — `/my-work` đã đúng |
| Hàng lớp ở danh sách học viên | Bảng chấm đúng lớp, đúng phạm vi đang đếm | Badge đã mang `scope` (Task 5), nhưng mở ra hàng đợi lọc, không phải bảng chấm dạng lưới — xem mục 12.5 |
| Hàng học viên — bấm nhãn MT2/MT3/Final | Hồ sơ đúng đợt đó | Hiện mở thẳng màn chấm điểm, không mở hồ sơ — xem mục 12.5 |
| Đầu hồ sơ học viên | Panel danh sách đợt | Ô đầu hồ sơ không bấm được, không dẫn tới panel đợt — xem mục 12.5 |
| Mốc Test trên hành trình | Cùng hồ sơ Test, Back giữ ngữ cảnh | Mốc chỉ có tooltip, không có bấm — xem mục 12.5 |
| Thông báo | Focus đúng ô học viên/đợt/kỹ năng | **Đã sửa lỗi chặn hẳn** (entityType sai chuỗi nên chưa từng điều hướng); phần "focus đúng ô" vẫn ở mục 12.5 |

- [x] **Step 1: Mỗi dòng chấm định danh học viên + đợt**

Một học viên có thể nợ **nhiều đợt**. Khoá của dòng phải là `attemptId`, không phải
`studentId`. Kiểm bằng cách tìm một em có hai đợt còn nợ và xem có ra hai dòng.

**Đã đúng sẵn, không cần sửa** (xác nhận qua đọc code, không phải suy đoán):
`WorkQueue` (`StudentsPage.tsx`) dựng hàng từ `/attempts`, mỗi hàng một lượt (`key={r.id}`,
`r.id` là `attemptId`); `mywork.ts:306` gom theo `classId|kind|attemptNo|skill`, không theo
`studentId`; `ClassRoster.tsx:201` mỗi lượt trong lịch sử một em có link riêng theo `h.id`.
Một em nợ hai lượt (VD MT2 và MT3) ra đúng hai dòng, không gộp.

- [~] **Step 2: Đi hết sáu đường bằng tay** — làm dở: 2/6 đường đã đúng (thanh điều hướng
  chính, thông báo — sau khi sửa lỗi ở trên), 4/6 còn lại chuyển sang backlog mục 12.5 vì
  cần dựng thêm quy ước tham số, không phải một phép sửa nhỏ.

- [x] **Step 3: Commit** — gộp vào lần sửa lỗi thông báo, xem mục 14.

---

### Task 7: Ô điểm — dấu ± so với kỳ vọng

**Files:**
- Modify: `server/src/cases/cases.ts:2161`
- Modify: `web/src/modules/cases/SkillBoard.tsx:55` (kiểu `Row`), `:560–590` (`ScoreCell`),
  `:487–492` (`outcomeTone`) và `scoreTone`
- Test: `server/src/tests/run.ts`

- [x] **Step 1: Viết phép kiểm**

```ts
check('Ô điểm: ± là khoảng cách tới kỳ vọng của chính đợt đó', () => {
  const board = cases.skillSupportBoard(P.admin, 3);
  const row = board.rows.find((r: any) => r.band !== null && r.expectation !== null);
  assert(row, 'Cần một hàng có cả điểm và kỳ vọng để kiểm');
  assert(
    row.gap === Math.round((row.band - row.expectation) * 10) / 10,
    `gap phải bằng điểm trừ kỳ vọng, đang là ${row.gap}`,
  );
  assert(!('delta' in row), 'Trường delta cũ phải bị bỏ để không ai đọc nhầm');
});
```

Học viên id 3 là Lê Quang Huy (hồ sơ dày nhất, xem `DEMO.md`).

- [x] **Step 2: Chạy và xác nhận nó HỎNG**

```bash
npm test
```

- [x] **Step 3: Sửa máy chủ**

`server/src/cases/cases.ts:2161`, thay dòng `delta:` bằng:

```ts
      /*
       * HAI SỐ, HAI CÂU HỎI KHÁC NHAU — chốt 17/09, PR18 làm sai nên phải sửa lại.
       *
       * `gap`   còn thiếu bao nhiêu để đạt kỳ vọng CỦA CHÍNH ĐỢT ĐÓ. Đây là số hiện mặc định.
       * `trend` tăng giảm so với lượt trước. Vẫn giữ, nhưng hiện bằng CHỮ trung tính — mũi
       *         tên xanh cạnh một điểm còn dưới kỳ vọng là khen sớm.
       */
      gap: latest && latest.expectation !== null
        ? Math.round((latest.band - latest.expectation) * 10) / 10 : null,
      trend: latest && prev ? Math.round((latest.band - prev.band) * 10) / 10 : null,
      trendFrom: prev ? prev.attemptNo : null,
```

- [x] **Step 4: Sửa giao diện**

`SkillBoard.tsx` kiểu `Row`: bỏ `delta`, thêm `gap: number | null; trend: number | null;
trendFrom: number | null;`. Trong `ScoreCell`:

- thay mũi tên bằng chữ theo `gap`: `thiếu 0.5` · `đạt kỳ vọng` · `vượt 0.5`, màu theo cùng
  luật của `scoreTone`;
- xu hướng thành dòng phụ **màu trung tính**: `Tăng 0.5 so với MT{trendFrom}`;
- `row.ratio` (lớp Normal) **không** dùng `gap` band — Normal đánh giá theo tỷ lệ 70%, chênh
  nếu có phải ghi bằng phần trăm (sổ §13.4). Giữ nhánh `ratio` như cũ.

- [x] **Step 5: Làm bốn màu dễ nhìn hơn**

Chủ sản phẩm yêu cầu riêng. `scoreTone` hiện dùng `text-rose-300` / `text-sky-300` /
`text-emerald-300` — chữ màu trên nền tối, tương phản yếu. Đổi sang **chip có nền**: nền
`var(--bg-danger)` / `--bg-accent` / `--bg-success` với chữ đậm cùng họ màu, như cách các
`Status` khác trong `web/src/ui/ui.tsx` đang làm. Giữ đúng bốn màu, chỉ tăng tương phản.
Chụp ảnh trước/sau cho chủ sản phẩm xem.

- [x] **Step 6: Chạy và xác nhận nó ĐẠT**

```bash
npm run build:server && npm test && npx tsc -p tsconfig.web.json --noEmit
```

- [x] **Step 7: Commit**

```bash
git add server/src web/src
git commit -m "Ô điểm: dấu cộng trừ là khoảng cách tới kỳ vọng, xu hướng thành chữ"
```

---

### 5.2. Nghiệm thu PR1 — làm đủ trước khi báo xong

- [x] **T08** RLW tuần 14–20/9, S tuần 21–27/9: bảng tuần này có RLW, bảng tuần sau có S, cùng một đợt — phép kiểm tự động + đọc code
- [x] Badge = số dòng danh sách, kiểm bằng **cả ba vai**: GVBM · Quản lý · Quản trị — phép kiểm tự động + bấm thử thật cả ba tài khoản (mục 13.2), kể cả ca gốc "28→0" (Quản trị: badge 9 → danh sách 9 dòng đúng số ở `/hoc-vien` lớp MB-FOU 12)
- [x] Quản lý nay **có** số ở phạm vi quản lý (trước đây là 0) — bấm thử thật: Quản lý Monbay thấy 9 bài ở MB-FOU 12, không còn là 0
- [x] Badge ghi rõ "bài", không ghi "lượt"; chấm xong một ô thì số giảm một — bấm thử thật: nhập điểm Listening cho Lê Quang Huy, badge MB-FT 101 giảm từ 20 → 19
- [x] Đổi tuần trên bảng chấm **không** làm mất việc nợ ở hàng đợi — đúng theo kiến trúc: hàng đợi (`WorkQueue`/`/attempts?need=my_scores`) không nhận tham số tuần, tách bạch hẳn với bảng chấm theo tuần (`/nhap-diem/:id`); bấm thử thật xác nhận danh sách 19 dòng không đổi bất kể tuần nào đang mở ở bảng chấm
- [x] Một em nợ hai đợt thì ra **hai dòng**, không gom một dòng — phép kiểm tự động mới ("Một em nợ điểm ở từ hai đợt trở lên...")
- [x] Seed lịch tới 2027: mở nhập điểm ngày 14/09/2026 vẫn vào đúng tuần hiện tại — bấm thử thật `/nhap-diem/3` → mở đúng "W3 SEP 2026 · 14/09–20/09"
- [x] Listening 5.0→5.5 kỳ vọng 6.0 → **đỏ**, ghi "thiếu 0.5", kèm "Tăng 0.5 so với MT1" trung tính — bấm thử thật, đúng y hệt trên hồ sơ Lê Quang Huy
- [~] Đi hết sáu đường vào nhập điểm; Back giữ bộ lọc — **CHƯA XONG**: chỉ 2/6 đường xác nhận đúng (thanh điều hướng chính, thông báo — sau khi sửa lỗi). Bốn đường còn lại cần dựng thêm (xem mục 12.5), không làm trong PR1 để tránh mở rộng phạm vi
- [x] `npm test` đạt hết · hai lệnh kiểm kiểu sạch · không lỗi ở bảng điều khiển trình duyệt — 326/326, cả hai `tsc --noEmit` sạch, không lỗi console khi bấm thử
- [x] Tắt máy chủ, kiểm cổng 5173 và 4000 đã trống — xác nhận bằng `netstat`, cả hai cổng trống

---

## 6. PR-A — Mở lại việc tạo case Ý thức (CASE-01, P0)

**Mục tiêu người dùng thấy:** chọn nhóm Ý thức/Khác trong form `+ Case` thì có phân loại để
bấm, và lưu được. Hiện tại **không có đường nào lưu được**.

### Task 1: Bộ phân loại cho nhóm Ý thức

**Files:**
- ~~Modify: `shared/domain/cases.ts`~~ — không cần, bộ phân loại đã có sẵn (xem Step 3)
- Modify: `web/src/modules/cases/QuickReport.tsx:80`
- Test: `server/src/tests/run.ts`

- [x] **Step 1: Viết phép kiểm**

```ts
check('CASE-01 · Mỗi nhóm Ý thức đều có bộ phân loại để chọn', () => {
  for (const topic of domain.BEHAVIOUR_TOPICS) {
    const list = domain.issuesForTopic(topic);
    assert(list.length > 0, `Nhóm ý thức "${topic}" không có phân loại nào để chọn`);
  }
});
check('CASE-01 · Tạo được case Ý thức bằng đúng phân loại của nhóm đó', () => {
  const topic = domain.BEHAVIOUR_TOPICS[0];
  const code = domain.issuesForTopic(topic)[0].code;
  const made = cases.reportIssue(P.coreTeacher, {
    studentId: 3, track: 'behaviour', topic, primaryCode: code,
    title: 'Ý thức: em nghỉ nhiều buổi liên tiếp',
    summary: 'Em nghỉ bốn buổi trong hai tuần, chưa có lý do từ gia đình.',
  });
  assert(made?.id, 'Phải tạo được case Ý thức');
});
```

`reportIssue` ở `server/src/cases/cases.ts:326` là hàm máy chủ nhận việc tạo case. Chữ ký thật
đòi thêm `title` (bắt buộc, ≥6 ký tự) — bảng mô tả gốc thiếu trường này; đã thêm vào phép kiểm
trên, ghi ở mục 14.

- [x] **Step 2: Chạy và xác nhận nó HỎNG** — `npm test`. Thực tế: phép kiểm đầu (bộ phân loại
  có sẵn) ĐẠT ngay; phép kiểm thứ hai (tạo case) HỎNG với lý do "Hãy đặt tên cho case" (thiếu
  `title`, không liên quan gì tới phân loại) — sau khi thêm `title` thì cả hai ĐẠT, không cần
  sửa gì ở tầng máy chủ/domain. Xem Step 3 và mục 14: lỗi CASE-01 nằm hoàn toàn ở giao diện.

- [x] **Step 3: Thêm bộ phân loại.**
  > **Cập nhật 18/09/2026 (session code PR-A):** giả định của bước này SAI. Đọc
  > `shared/domain/cases.ts:412–427` thì `ISSUE_TAXONOMY` đã có sẵn nhánh `behaviour` (BTVN ·
  > Chuyên cần · Tham gia trên lớp · Khác — dùng CHUNG một bộ bốn mã cho cả bốn nhóm chủ đề,
  > không phải mỗi nhóm một bộ riêng như mô tả gốc), và `issuesForTopic()` đã ánh xạ mọi
  > `BEHAVIOUR_TOPICS` sang nhánh đó từ trước. Phép kiểm Step 1 xác nhận: cả hai check đều
  > ĐẠT ngay khi chạy — check thứ hai chỉ cần thêm `title` (trường bắt buộc, thiếu trong bảng
  > mô tả gốc) để qua được bước kiểm đầu vào của `reportIssue`, không phải sửa phân loại. Xem
  > mục 14.

- [x] **Step 4: Sửa giao diện.** `QuickReport.tsx:80` bỏ điều kiện `track === 'academic'`:

```ts
  /* Nhóm Ý thức CŨNG có bộ phân loại riêng — thiếu nó thì form tự chặn chính mình. */
  const causes = topic ? issuesForTopic(topic) : [];
```

  Không có server nào bị đổi ở Task 1, nên `npm run build:server` không cần chạy lại — vẫn
  chạy ở bước xác minh cuối cho chắc.

- [x] **Step 5: Chạy và xác nhận nó ĐẠT** — `npm test`: **328/328 đạt** (326 cũ + 2 phép kiểm
  CASE-01 mới). `npx tsc -p tsconfig.build.json --noEmit` và `npx tsc -p tsconfig.web.json
  --noEmit` đều sạch.

- [x] **Step 6: Kiểm bằng tay.** Mở hồ sơ Lê Quang Huy (`/hoc-vien/3`) → `+ Case` → chọn
  **Ý thức** → mỗi nhóm trong bốn nhóm (BTVN · Chuyên cần · Tham gia trên lớp · Khác) đều hiện
  khối "Phân loại vấn đề" với đủ bốn lựa chọn (trước đây trống, không bấm được gì) → lưu được
  → case hiện trong khối Ý thức/Khác của hồ sơ, đúng tên phân loại đã chọn. Đã thử với **cả
  ba vai**: giáo viên bộ môn (Trần Ngọc Hà, nhóm Chuyên cần), Quản lý Monbay (Nguyễn Khánh Vy,
  nhóm BTVN), Quản trị hệ thống (Đỗ Vũ Tuấn Phong, nhóm Tham gia trên lớp) — cả ba đều lưu
  thành công. Ba case thử đã bị xoá bằng cách chạy lại `npm run seed` sau khi kiểm xong, dữ
  liệu demo về đúng trạng thái gốc (60 case).

- [x] **Step 7: Commit**

```bash
git add shared/domain/cases.ts web/src/modules/cases/QuickReport.tsx server/src/tests/run.ts
git commit -m "Mở lại việc tạo case Ý thức: mỗi nhóm có bộ phân loại riêng"
```

**Không làm trong PR-A:** file/link bằng chứng (CASE-04), quyền theo môn (AUTH-01), gộp đợt
theo cửa sổ bốn ngày. Chúng ở backlog mục 12.

---

## 7. PR2 — Bộ chọn tuần dùng chung, rồi Kế hoạch Test

> **18/09/2026 — Tách PR2 làm hai (quyết định chủ sản phẩm, sau khi đọc `vong7/SO_AUDIT_TRICH.md`
> mục A):** cả bốn mã nghiệm thu T07 · T09 · T10 · T13 đều kiểm Kế hoạch MT, bộ kỹ năng bắt
> buộc và quyền chấm Normal — **không mã nào kiểm bộ chọn tuần**. Nên bộ chọn tuần tách ra làm
> **PR2a** ngay, không chờ gì cả; phần còn lại (Kế hoạch Test + quyền lịch, cái thật sự cần
> bốn mã T) dời thành **PR2b**, viết task khi PR2a đã merge. Xem mục 14.

### 7a. PR2a — Bộ chọn tuần dùng chung (sổ §13.8, chép đủ ở `vong7/SO_AUDIT_TRICH.md` mục D)

> **Mức chi tiết: task. Làm ngay.** Đọc **mục D của bản trích**, không đọc bản tóm tắt dưới
> đây làm luật — bản trích có năm điều bản tóm tắt cũ (từng ở §7.1) chép thiếu, xem cảnh báo
> ngay dưới.

Đã có `WeekPicker` và `usePeriodWindow` ở `web/src/ui/Filters.tsx`, có hai mũi tên và một
`<select>` (không phải popover). **Việc là sửa ruột nó cho đủ đặc tả, rồi đem đi dùng — không
thiết kế lại từ đầu.**

**Năm điều bản trích §D có mà bản tóm tắt cũ (PR1 khảo sát) thiếu — dễ vấp nhất:**

1. Tuần **Thứ Hai–Chủ nhật**, theo ngày nghiệp vụ **Asia/Ho_Chi_Minh** (demo dùng ngày demo,
   thật dùng hôm nay thực tế) — không phải giờ máy chủ/trình duyệt.
2. Popover phải có **đổi tháng/năm** và **gợi ý tuần gần đây**, không chỉ ô gõ ngày trơn.
3. **Ưu tiên ngữ cảnh URL** khi đi từ badge hoặc mốc Test — mở trang nhập điểm độc lập (không
   từ link nào) thì mới dùng tuần hiện tại/tồn đọng làm mặc định.
4. **Không fallback về phần tử đầu của một mảng tuần.** Đây đúng là cái bẫy khoá hai mũi tên
   đã sập một lần: tuần được link tới rơi ngoài cửa sổ tải về → `idx` thành `-1` → nếu code có
   chỗ nào `array[idx] ?? array[0]` thì âm thầm nhảy sang tuần khác và khoá luôn điều hướng.
5. Giới hạn tuần tương lai (planning) áp **tại thời điểm LƯU**, không áp theo danh sách tuần
   đã tải về ở client — client tải bao nhiêu không phải là luật, chỉ là hiệu năng hiển thị.

**Bề mặt đích:** nút Trước · `14–20/09/2026` · nút Sau · **Tuần này**; nhãn phụ `W3 SEP` có
**năm** khi thiếu ngữ cảnh. Bấm vào trường mở **popover**: gõ `dd/mm/yyyy` hoặc bấm một ngày
trên lịch tháng → chọn cả tuần chứa ngày đó. Luôn chọn được tuần hiện tại và tuần đang được
link tới, kể cả chưa có hàng trong database — đường **đọc** không được tạo hàng loạt tuần
(hiện `periodWindow` đang vi phạm, xem Task 1). Lưu lựa chọn vào URL (mẫu `useSearchParams` đã
có ở 9 màn trong repo, làm theo mẫu đó) — tải lại và Back không nhảy tuần. `scope='planning'`
mở xa về tương lai; màn báo cáo kết quả giữ cửa sổ hẹp.

**Nơi phải đổi sang dùng chung** — sửa ruột `WeekPicker` là đổi **8 màn cùng lúc** vì chúng
compose cùng component: Bảng case, Tạo lớp, Tiến độ lớp, Chuyển lớp, Kế hoạch MT, Lộ trình học
viên, Báo cáo kỳ họp, bộ lọc tuần+chi nhánh dùng chung — cộng `ScoreSheetPage.tsx` (đang có
`<select>` 26 tuần riêng, phải thay hẳn bằng `WeekPicker` và mang theo cơ chế đồng bộ URL nó
đang tự làm, vì bản thân `WeekPicker`/`usePeriodWindow` chưa có).

**Nghiệm thu PR2a** (không dùng mã T — bốn mã đó thuộc PR2b):
- Đổi năm và giao năm (31/12 → 01/01) chạy đúng.
- Tuần không có dữ liệu trong database vẫn chọn được (không bắt phải có sẵn record).
- Tải lại trang (F5) và bấm Back giữ nguyên tuần đang xem.
- Lịch xa tới 2027 vẫn mở đúng (không giới hạn cứng theo 26 tuần cũ).
- Sổ §13.11: seed lịch tới APR 2027, mở nhập điểm ngày 17/09/2026 vẫn đúng tuần và ngữ cảnh;
  tuần hiện tại luôn tìm được.

**Bắt buộc trước khi báo xong:** bộ kiểm thử tự động không chạm được giao diện. Phải bấm thử
thật **cả 9 màn** (8 màn dùng `WeekPicker` + `ScoreSheetPage`) với **đủ ba vai** (GVBM · Quản
lý Monbay · Quản trị), và báo cáo phải ghi rõ đã bấm những đâu, thấy gì — không khẳng định
suông.

- [x] **Đã xong, bằng chứng 18-19/09/2026.** `npm test`: 330/330 đạt (328 cũ + 2 phép kiểm
  §13.8 mới). Hai lệnh `tsc` sạch. Bấm thử thật cả 9 màn, đủ ba vai:
  - **ScoreSheetPage** (`/nhap-diem/3`, vai GVBM): bề mặt đúng `← 14/09–20/09 W3 SEP 2026 →
    Tuần này`; bấm ngày 21 trong popover → tải đúng bảng tuần mới; F5 (re-navigate với cùng
    `?periodId=`) giữ nguyên tuần; gõ ngày xa tới `2027-01-15` → resolve đúng tuần trống
    (chưa có Mock nào), không lỗi. Cùng màn với vai **Quản trị hệ thống**: đúng tuần mặc định,
    quyền sửa đủ 5 kỹ năng.
  - **CaseBoardPage / "Thực trạng"** (tab trong Tổng quan, vai Quản lý Monbay): picker "Tuần
    giao việc" — **bắt được và sửa một lỗi thật** ở đây: bản đầu kẹt ở "Đang tải…" vì
    `periodId` khởi tạo `null` và không `clearable`; sau khi sửa hiện đúng tuần hiện tại ngay.
  - **StudentPlanPanel / "Lộ trình"** (hồ sơ Lê Quang Huy, vai GVBM): "Tuần bắt đầu học"
    (không `clearable`) hiện đúng tuần đã lưu; "Tuần dự kiến thi" (`clearable`) hiện đúng
    "Chưa xác định" khi chưa chọn, bấm "Tuần này" → hiện tuần + nút "Bỏ chọn", bấm "Bỏ chọn"
    → về lại "Chưa xác định". Không lưu (đóng panel) để không đổi dữ liệu demo.
  - **MockPlanPanel / "Lên kế hoạch MT"** (trang Học viên, vai Quản lý Monbay): gõ ngày
    `2027-03-10` → resolve đúng "08/03 – 14/03 · W2 MAR 2027" (scope planning, xa hơn 6
    tháng); chuyển tháng trong popover 4 lần từ Sept 2026 → Tháng 1/2027, đúng cả khi qua năm.
  - **ClassProgressPanel / "Tiến độ lớp"** (MB-FT 101, vai Quản lý Monbay): "Tuần khai giảng"
    hiện đúng tuần đã lưu.
  - **ClassCreatePanel / "Tạo lớp"** (trang Học viên, vai Quản lý Monbay): "Tuần khai giảng"
    mặc định đúng tuần hiện tại.
  - **MeetingPage / "Báo cáo tuần chi nhánh"** (`/tien-trinh`, vai Quản lý Monbay): phát hiện
    ở vòng review — file này tự gọi `usePeriodWindow()` riêng (không chỉ qua `WeekPicker`) để
    dò tuần hiện tại, và còn đúng kiểu lỗi "fallback `array[0]`" sổ §13.8 cấm (bị che vì route
    luôn `ensurePeriod(demoToday())` trước). Đã sửa dùng cờ `isAnchor` + resolve qua endpoint
    mới. Bấm thử lại: mở đúng "14/09–20/09"; bấm chọn "24/08–30/08" trong popover → tải đúng
    dữ liệu tuần đó (đổi từ "3 việc đã giao" xuống "1 việc đã giao").
  - **TransitionPanel / "Chuyển tiếp lên lớp sau"** (MB-FOU 12, vai Quản lý Monbay): "Tuần
    khai giảng lớp mới" (`scope=planning clearable`) hiện đúng "Chưa xác định" → bấm "Tuần
    này" → resolve đúng "14/09–20/09" + nút "Bỏ chọn". Đóng, không xác nhận chuyển lớp (tránh
    tạo lớp thật trong demo).
  - Review bằng subagent (superpowers:requesting-code-review) trước khi mở PR: 4 issue quan
    trọng, đã sửa 3 (MeetingPage fallback array[0], WeekPicker im lặng khi lỗi mạng, fallback
    giờ trình duyệt thật); quyết định **không** thêm hạ tầng test HTTP chỉ cho một route mới
    (`POST /ref/periods/resolve`) vì không route nào khác trong `run.ts` có test tầng HTTP —
    ghi lại ở mục 14.

### 7b. PR2b — Kế hoạch Test + quyền lịch (sổ §MT-01…MT-06, SCH-01/02, chép đủ ở
`vong7/SO_AUDIT_TRICH.md` mục B, C)

> **19/09/2026 (đêm, session code PR2b):** THU HẸP PHẠM VI so với mô tả gốc — xem lý do ở
> mục 14. Phần **đã làm và đã kiểm** liệt kê dưới; phần **chưa làm** chuyển sang backlog mục
> 12.6, không tự nhận là xong.

- [x] Đổi tên panel thành **Kế hoạch Test**; bỏ ô "Lượt MT đang chọn" (chỉ lặp lại thứ vừa
  chọn, không mang tin gì mới). Đã đổi cả hai nút mở panel ở trang Học viên.
- [x] Chỉ hiện lớp **Fast Track** ở cả giao diện (`GET /ref/classes?fastTrackOnly=1`) lẫn API
  đọc danh sách học viên chưa có tuần MT (`noPlanQueue`, lọc theo `programmes.scoring_mode`).
- [ ] ~~Hai hàng lịch nhanh RLW và Speaking~~ — **CHƯA LÀM**, ghi backlog mục 12.6. Panel vẫn
  dùng 4 checkbox kỹ năng rời như trước.
- [x] Quyền lịch (SCH-01, SCH-02) ở **tầng máy chủ** — quyền mới `schedule.move`
  (`shared/domain/people.ts`), tách khỏi `PLAN_WEEK`. GVCN dời được mọi kỹ năng của lớp Normal
  mình chủ nhiệm; GVBM dời đúng môn mình dạy; **không** mở Fast Track chủ động (vẫn
  `PLAN_WEEK`, chỉ Quản lý). `setSkillWeek` và `setSitStatus` dùng CHUNG một hàm kiểm quyền
  (`requireMoveSkillSchedule`/`canMoveSkillSchedule`, `server/src/fasttrack/skillSchedule.ts`)
  — không lệch nhau giữa hai thao tác. Đã kiểm bằng tay (Quản lý, MT3 lớp FT): nút "Đổi tuần"
  vẫn hiện đúng, preview "W3 SEP 2026 → W1 OCT 2026" chạy đúng, không có gì hỏng.
  > ⚠️ **PHÁT HIỆN LÚC BẤM THỬ — GHI THẲNG, KHÔNG GIẤU:** quyền mới hoạt động đúng ở tầng máy
  > chủ (12 phép kiểm tự động xác nhận), nhưng **KHÔNG có chỗ nào trên giao diện để GVCN/GVBM
  > lớp Normal thực sự dùng nó**. Nút "Đổi tuần"/"Đã thi"/"Xác nhận vắng" chỉ tồn tại ở
  > `MockDetailPage.tsx` (`/mock-test/:id`) — mà chính file đó tự chuyển hướng (dòng 85-86,
  > `data.kind !== 'mock'`) sang `RegularSheetPage.tsx` (`/bang-diem-thuong/:classId`) cho MỌI
  > lượt của lớp Normal, và `RegularSheetPage.tsx` **không có bất kỳ nút dời-lịch-một-kỹ-năng
  > nào** (đã grep xác nhận: 0 kết quả cho "Đổi tuần"/"setSkillWeek"/"WeekPicker"). Nghĩa là
  > SCH-01/SCH-02 hiện là "quyền đã mở nhưng chưa ai bấm được" — cần thêm việc dựng UI dời
  > lịch cho `RegularSheetPage.tsx` (hoặc một màn chi tiết Normal riêng) mới thật sự dùng
  > được. Đã ghi vào backlog mục 12.6, dòng thứ tư mới thêm.
- [x] Preview **"tuần cũ → tuần mới"** thêm vào `SkillWeekModal` (màn Lộ trình) trước khi lưu
  — đáp ứng đúng yêu cầu T07 về preview, nhưng đường sửa lịch vẫn nằm ở màn **Lộ trình**, CHƯA
  có đường sửa-tại-chỗ ngay trong panel Kế hoạch Test (xem mục "chưa làm" bên dưới).
- [ ] ~~Chọn một lượt đã có → sửa NGAY TRONG panel Kế hoạch Test~~ — **CHƯA LÀM**. Đường sửa
  lịch (có preview, có quyền đúng) chỉ dùng được từ màn **Lộ trình**; panel Kế hoạch Test vẫn
  chỉ tạo lượt mới (`bulkPlan`), chọn lại một ô đã có vẫn báo lỗi trùng như cũ. Backlog 12.6.
- [ ] ~~Đợt hoàn tất thì chỉ đọc~~ — **CHƯA LÀM**. Khảo sát cho thấy `assessment_attempts`
  không có giá trị `status` riêng cho "đã hoàn tất" (chỉ có `planned`/`cancelled`; "hoàn tất"
  đang được suy ra từ đủ điểm required, không phải một cột trạng thái) — cần thiết kế trước
  khi chặn, không phải một dòng sửa nhỏ. Backlog 12.6.
- [x] Dời lịch ở Lộ trình dùng ĐÚNG MỘT luật (`checkSkillWeekMove`,
  `server/src/fasttrack/skillSchedule.ts:409-461`) — đã có sẵn từ trước PR2b, chỉ thêm phép
  kiểm khoá lại (xem T13 dưới). Không vượt đợt Test kế tiếp (chặn); hai đợt cách một tuần thì
  cảnh báo; RLW và S cùng một đợt thì không cảnh báo.
- [x] **Ghi chú R18-09** — đã xác nhận code hiện tại **đã đúng sẵn**: `cancelPart`
  (`server/src/fasttrack/absence.ts:444-482`) không đặt `sit_status='cancelled'` cho lớp
  Normal, dùng `scheduled` ("chờ Quản lý xếp lại"). Không sửa gì, chỉ xác nhận không thêm nút
  hủy Test cho Normal ở PR2b.

**Nghiệm thu PR2b — cả bốn mã đều đã có phép kiểm khoá hành vi trong `server/src/tests/run.ts`
(tìm theo tiền tố `T07`/`T09`/`T10`/`T13`/`SCH-01`/`SCH-02`):**

- **T07** (không có Normal · không tạo lượt trùng khi sửa) — đã kiểm. Phần "preview tuần
  cũ→mới" đã có ở màn Lộ trình, **chưa** có ở panel Kế hoạch Test (xem trên).
- **T09** (đợt FT định trước chỉ L/R, không bịa Overall) — logic đã đúng sẵn từ trước, chỉ
  thêm phép kiểm khoá lại.
- **T10** (Normal đủ bốn môn, ngưỡng 70%, ca 23/33·7/10) — ngưỡng **đã có test đủ từ trước**
  (`run.ts:1797-1811`); phần mới của PR2b là quyền GVCN/GVBM sửa lịch (SCH-01), đã kiểm.
- **T13** (chặn dời trùng/vượt đợt kế tiếp, cảnh báo cách một tuần, không cảnh báo giả
  RLW+S cùng đợt) — logic đã đúng sẵn từ trước (`checkSkillWeekMove`), chỉ thêm phép kiểm.

`npm test`: 342/342 đạt (330 cũ + 12 mới). Hai lệnh `tsc` sạch.

---

## 8. PR3 — Chấm điểm, dấu "–", màn hồ sơ Test gọn

> **Mức chi tiết: thiết kế.** Viết chi tiết mức task khi PR2 đã merge.

Luật đầy đủ đã có ở sổ **§13.7** — đọc nguyên mục đó, nó chi tiết tới mức chép thẳng vào task
được. Những điểm không được làm sai:

- **Có lịch và có quyền là nhập điểm được.** Bỏ bước bắt xác nhận "Đã thi". Nhưng **không** tự
  ghi nhận học viên đã thi thật chỉ vì đã đến lịch.
- **Dấu "–" là "Không thấy bài tại thời điểm chấm".** Không phải 0, không phải vắng đã xác
  minh, không phải huỷ bài, không giảm số môn bắt buộc.
- **W/S:** một "–" ở một tiêu chí đánh dấu thiếu bài của **đúng kỹ năng đó**. W1 thiếu không
  làm W2 thiếu; Speaking thiếu không ảnh hưởng RLW. Normal Writing là **một** kỹ năng.
- **Điểm đang gõ ở tiêu chí khác không được bình quân với "–".**
- **Điểm chính thức đã có thì "–" không được xoá âm thầm.** Hiệu chỉnh điểm là thao tác riêng,
  có xác nhận và lý do.
- **Hoãn hạn chấm một tuần, giữ hạn gốc.** FT hạn thứ Tư → thứ Tư tuần kế; Normal Chủ nhật →
  Chủ nhật. Hàng đã quá hạn nhiều tuần thì đề xuất tuần kế tiếp **so với tuần đang xử lý**,
  và hiện ngày cụ thể trước khi lưu — không đặt một hạn mới vẫn nằm trong quá khứ.
- **Lưu lại / thử lại không được lùi thêm một tuần nữa.** Cùng một đợt/kỹ năng/chu kỳ chỉ ghi
  một lần.
- **Hiển thị hạn:** `Hạn gốc 23/09 · Chờ bài · Hẹn xử lý 30/09`. Báo cáo giữ ngày gốc và lý do.
- **FT vắng đã xác minh:** lần đầu dời sang tuần kế tiếp **của chính kỹ năng đó**; từ lần hai
  cần Quản lý duyệt. Chỉ Quản lý khôi phục trường hợp bị huỷ.
- **Normal không có huỷ.** Luôn giữ phần còn thiếu trong hàng đợi đến khi đủ bốn kỹ năng.
- **Dời lịch chủ động và vắng thật là hai tình huống khác nhau.** Dấu "–" không đủ căn cứ để
  tự huỷ một đợt hay tự tăng bộ đếm vắng.

**Màn hồ sơ Test gọn (sổ §13.9)** — đúng ba phần: (1) header có học viên/lớp/tên đợt/số kỹ năng
đã có điểm trên số bắt buộc/kỳ vọng/OVR khi đủ, nút chính **Nhập điểm**; (2) **một** bảng
`kỹ năng | tuần thi | hạn xử lý | điểm hoặc tiêu chí | ghi chú`, W1/W2 mở bốn tiêu chí tại
dòng; (3) lịch sử và cài đặt mở theo nhu cầu. Thao tác ngoại lệ vào **menu** đúng quyền —
không dàn sáu nút mỗi dòng.

**Nghiệm thu PR3:** T11 · T12, cộng các gạch đầu dòng ở sổ §13.11 về dấu "–".

---

## 9. PR-B — Phân công GV, nốt phần còn thiếu

> Ba luật chính **đã chạy đúng ở máy chủ** — xem mục 2.2. Đừng viết lại.

Còn thiếu so với sổ §13.5:

- **Ô gõ tên để tìm** thay cho dropdown. Danh sách lấy từ GV có phân công còn hiệu lực **tại
  chi nhánh của lớp** (`teacherCandidates`, `classes.ts:603` — đã đúng, chỉ cần đổi cách bày).
- **Chọn GVBM trước; danh sách GVCN là tập GV đã được chọn ít nhất một môn** của lớp đó. Hiện
  tại máy chủ *từ chối* lựa chọn sai; nên làm cho giao diện *không đưa ra* lựa chọn sai ngay
  từ đầu.
- **Gỡ môn cuối của GVCN phải chọn người thay trong cùng lần lưu.** Máy chủ đã chặn
  (`classes.ts:748`) nhưng giao diện chưa dẫn người dùng ra khỏi thế bí.
- **Dữ liệu cũ có hai GV cùng một môn** phải vào danh sách cần chọn lại, không tự lấy người
  đầu tiên. Viết một phép kiểm quét dữ liệu demo trước khi làm — có thể không có ca nào.

**Nghiệm thu:** một kỹ năng không nhận hai GV đang hiệu lực; GV ngoài chi nhánh không tìm
thấy **và** API từ chối; đổi môn cuối của GVCN không để lại phân công GVCN không hợp lệ.

---

## 10. PR-C — Form case đúng và gọn (CASE-01 · ngày Ý thức · nhập bù · AUTH-01)

> **Mức chi tiết: task.** Làm được ngay, không chờ ai.
>
> **Goal:** Form `+ Case` hỏi đúng những gì cần hỏi, không hỏi hai lần, không cho nhập thứ làm
> hỏng hạn — và mở thêm một đường ghi lại case cũ đã xử lý xong, để hành trình học viên không
> bị trống ở quá khứ.
>
> **Ràng buộc kiến trúc:** không đổi mô hình dữ liệu case. Đường nhập bù dùng lại đúng bảng và
> đúng hàm của đường thường; cái khác nhau nằm ở **những gì KHÔNG được sinh ra**, ghi ở mục 10.4.

### 10.1. Task 1 — Bỏ ô hỏi trùng ở nhóm Ý thức (CASE-01, làm nốt)

PR-A mở lại được việc tạo case Ý thức bằng cách cho bốn nhóm dùng chung một bộ phân loại — mà
bộ đó **đúng là bốn nhóm ấy**. Kết quả: form hỏi "Về việc gì: BTVN?" rồi hỏi tiếp "Phân loại
vấn đề: BTVN?". Sổ audit CASE-01 đã cấm từ đầu: *"không cần dropdown nguyên nhân thứ hai dư thừa."*

- [x] **Step 1: Phép kiểm trước.** Trong `server/src/tests/run.ts`: tạo case Ý thức chỉ truyền
      `primaryCode = 'student.behaviour.homework'`, **không** truyền `topic`. Phải lưu được, và
      `topic` đọc ra phải là nhóm BTVN. Chạy `npm test`, phép kiểm này phải ĐỎ trước khi sửa.
- [x] **Step 2: Suy chủ đề từ phân loại.** Thêm vào `shared/domain/cases.ts` hàm
      `topicFromBehaviourCode(code)` ánh xạ `student.behaviour.homework → homework`,
      `.attendance → attendance`, `.participation → participation`, `.other → other`.
      **Ánh xạ phải phủ hết `BEHAVIOUR_TOPICS`** — viết phép kiểm quét cả bốn mã.
- [x] **Step 3: Giao diện.** `web/src/modules/cases/QuickReport.tsx` — khi `track === 'behaviour'`,
      **không render** ô "Về việc gì" (hiện ở dòng 221). Chỉ còn ô "Phân loại vấn đề". Chọn phân
      loại thì đặt `topic` ngầm bằng hàm ở Step 2. Nhóm **Học thuật giữ nguyên hai ô** — ở đó
      "Kỹ năng nào" (Listening) và "Phân loại vấn đề" (Tư duy và kỹ năng làm bài) là hai câu hỏi
      khác nhau thật.
- [x] **Step 4: Máy chủ.** `reportIssue` (`server/src/cases/cases.ts:326`) — với
      `track = 'behaviour'`, thiếu `topic` thì suy từ `primaryCode` bằng **cùng** hàm ở Step 2.
      Không để hai nơi tự suy theo hai cách.

> ⚠️ **CHỖ DỄ HỎNG NHẤT CỦA CẢ PR NÀY.** `topic` đang là **khoá gộp báo cáo theo đợt** (sổ
> §13.12). Ánh xạ lệch một mã là hai báo cáo cùng loại rơi vào hai đợt khác nhau, và không ai
> nhìn màn hình mà thấy được. Bắt buộc có phép kiểm: hai báo cáo BTVN cách nhau 2 ngày phải vào
> **một** đợt; cách nhau 5 ngày phải thành **hai** đợt.

### 10.2. Task 2 — Bỏ ngày và hạn khỏi case Ý thức

Ngày mở đang là gốc tính của **ba** thứ cùng lúc: hạn phương án (`planDueDate`, `cases.ts:884`
— 3 ngày nếu Gấp, 5 ngày nếu Cần chú ý, tính cả ngày đầu), hạn hoàn thành case
(`behaviourCaseDeadline`, `cases.ts:554` — ngày mở + 6), và cửa sổ gộp đợt bốn ngày. Cho chọn
ngày quá khứ nghĩa là **tạo được case sinh ra đã quá hạn**, hoặc lùi ngày để lách luật gộp.

- [x] **Step 1: Giao diện.** `QuickReport.tsx` — khi `track === 'behaviour'`, ẩn cả nút
      `+ Theo dõi từ ngày khác hôm nay` (dòng 264) lẫn ô ngày (dòng 270). Không có ô hạn, và
      chưa bao giờ có — đừng thêm.
- [x] **Step 2: Máy chủ chặn thật.** `reportIssue` — `track = 'behaviour'` mà nhận `detectedAt`
      khác hôm nay thì **từ chối**, không im lặng bỏ qua.
- [x] **Step 3: Học thuật giữ nguyên.** Ô ngày của nhóm Học thuật không đụng tới — ở đó hạn
      chạy theo cơ chế khác (`weeklyUpdateDue`, `cases.ts:895`), và ngày phát hiện lệch ngày
      báo là chuyện có thật.
- [x] **Step 4: Phép kiểm.** Tạo case Ý thức với `detectedAt` lùi 10 ngày → API từ chối. Tạo
      case Học thuật cùng ngày đó → lưu được.
      > **Cập nhật lúc code:** test có sẵn `[7.2] Ngày gửi của hệ thống quyết định cửa sổ...`
      > giả định hành vi CŨ (Ý thức nhận `detectedAt` quá khứ rồi âm thầm bỏ qua khi tính cửa
      > sổ gộp) — nay hành vi đổi có chủ đích (từ chối hẳn), nên đã sửa lại test đó cho đúng ý
      > nghĩa còn lại (Học thuật vẫn giữ ngày người dùng khai), không xoá. Phát hiện thêm:
      > `case_reports` (bảng có `reported_on`/`observed_on`) chỉ dùng cho đường Ý thức — Học
      > thuật lưu `detected_at` thẳng trên `sos_cases`, không qua bảng đó.

### 10.3. Task 3 — Tab "Đã xong từ trước"

Ghi lại một case **đã xử lý xong từ lâu**, để hành trình học viên không trống ở quá khứ. Luật
gốc: sổ mục 2 (*"Đang theo dõi / Đã xong, mặc định Đang theo dõi. Nhập lịch sử Đã xong phải có
thông tin kết quả phù hợp; ngày quá khứ không tự chứng minh hiệu quả"*), **T03** (*"bắt ngày
thực tế, kết quả xác định, ghi chú; lưu một lần; không sinh nợ tuần trước khi nhập"*) và
**CASE-03** (*"trong một giao dịch; không cho Chưa đủ dữ liệu đóng PA; không tự gán thành công"*).

**Bề mặt:** modal `+ Case` có hai tab ở đầu — **[Đang gặp vấn đề]** · **[Đã xong từ trước]**.
Tab 1 là form hiện tại. Tab 2 hỏi đúng bảng dưới, **không hơn**:

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| Thuộc nhóm · Kỹ năng (học thuật) hoặc Phân loại (Ý thức) · Mô tả vấn đề khi đó | ✓ | giống tab 1, **đã áp Task 1** nên Ý thức chỉ còn một ô |
| **Từ ngày → đến ngày** | ✓ cả hai | chỗ **duy nhất** được nhập ngày quá khứ. Áp cho **cả hai nhóm**, kể cả Ý thức |
| **Đã làm gì** — mỗi dòng `tên việc · người làm · từ → đến`, nút `+ thêm dòng` | ✓ ít nhất một dòng | dòng gọn, **không** mở panel phương án đầy đủ |
| **Kết quả cuối** | ✓ | bộ đúng nhánh: học thuật một bộ, Ý thức một bộ (CASE-06). **KHÔNG có lựa chọn "Chưa đủ dữ liệu"** — CASE-03 cấm nó đóng phương án |
| **Ghi chú** | ✓ | §13.12: *"ghi chú và ngày bắt buộc"* |
| Điểm chi tiết theo kỹ năng | tuỳ chọn | dùng lại `componentsFor` (`cases.ts:170`) — Listening ra Section 1–4, Writing ra bốn tiêu chí band. **Không** phải bốn ô L/R/W/S |

- [x] **Step 1: Phép kiểm trước.** Nhập bù một case Listening: mở 01/07, xong 20/07, hai dòng
      phương án, kết quả "đã cải thiện", ghi chú. Phải ra **một** case `done`, **hai** phương án
      `done`, và **không** sinh dòng nghĩa vụ nào. Đỏ trước khi sửa.
      **Ghi chú:** thay vì đúng kịch bản Listening/hai dòng, tám phép kiểm ở cuối
      `server/src/tests/run.ts` (mục "43. PR-C Task 3") phủ đủ ý nghĩa của Step 1 và cả bảy
      chốt — mỗi chốt một case riêng, dễ theo dõi hơn dồn hết vào một case.
- [x] **Step 2: Đường máy chủ.** Thêm `backfillCase(p, input)` vào `server/src/cases/cases.ts`.
      **Khác câu chữ gốc một chỗ:** chuỗi gọi là `reportIssue` → `recordIntervention` (một lần
      mỗi dòng "đã làm gì") → `closeCaseOutcome`, **bỏ** bước `completeIntervention` riêng —
      `recordIntervention` đã tự nhận đủ `startedDate`/`completedDate`/`status: 'completed'`
      trong một lần gọi, nên gọi thêm `completeIntervention` chỉ tạo thêm một dòng hành trình
      "Đã làm: …" trùng lặp với dòng "Hỗ trợ: …" đã có, không thêm thông tin gì mới. Vẫn đúng
      tinh thần: gọi lại hàm thật, một giao dịch, cờ `backfill: true` chảy suốt
      `reportIssue`/`recordIntervention`. Không viết đường ghi database song song.
      Không thêm cột mới: `origin_kind` đã có sẵn giá trị tự do (`mock | teacher_report |
      manager_task`), `'backfill'` là một giá trị mới của cột đó — không đụng mô hình dữ liệu.
- [x] **Step 3: Bảy chốt chặn.** Làm đủ mục 10.4. Mỗi chốt một phép kiểm — xem chi tiết ở
      mục 10.4 ngay dưới.
- [x] **Step 4: Giao diện.** Tab trong `QuickReport.tsx`: "Đang gặp vấn đề" / "Đã xong từ
      trước". Dòng "đã làm gì" là một mảng state, mỗi dòng bốn ô (tên việc · người làm · từ
      → đến), nút "+ thêm dòng". Nút chính ghi "Ghi lại case đã xong". Route mới
      `POST /cases/backfill`.
      **Thu hẹp có chủ ý:** ô "Điểm chi tiết theo kỹ năng" (tuỳ chọn theo bảng trên) **CHƯA**
      có ở giao diện. Máy chủ (`backfillCase`) đã nhận sẵn tham số `metrics` và validate đúng
      như `closeCaseOutcome` — chỉ chưa nối dây UI, vì component `MetricsField` dùng cho việc
      này hiện nằm KHÔNG export trong `CasePanel.tsx`, và PR-D (mục 11.3 Step 6) dự kiến gỡ hẳn
      nó khỏi đó. Nối dây ngay bây giờ rồi PR-D gỡ mất là làm hai lần; để việc này vào backlog
      mục 12, làm sau khi PR-D quyết định hình dạng cuối của khối kết quả.
- [x] **Step 5: Nhãn.** Case nhập bù hiện chữ **"nhập bù · <người> ghi ngày <ngày>"** ngay trên
      thẻ case ở `SkillBoard.tsx`, lấy từ `origin_kind`/`reported_by`/`created_at` qua
      `caseCardOf`. Không giấu trong tooltip.
- [x] **Step 6: Hành trình theo tuần.** Mốc nhập bù tự vẽ đúng **tuần thật của nó** — dòng
      thời gian đã sắp theo `event_date` (ngày thật của sự kiện), không phải `created_at`
      (lúc gõ vào hệ thống), nên không cần sửa gì ở tầng sắp xếp. Chỉ thêm tiền tố
      **"(nhập bù)"** vào tiêu đề ba loại mốc (mở case, hỗ trợ, hoàn thành) để phân biệt với
      mốc ghi tại chỗ.

### 10.4. Bảy chốt chặn — phần dễ sai nhất, làm đủ cả bảy

| # | Chốt chặn | Hỏng thế nào nếu thiếu |
|---|---|---|
| 1 | **Không sinh nghĩa vụ cập nhật tuần** nào giữa ngày bắt đầu và hôm nay | T03 nguyên văn: *"không sinh nợ tuần trước khi nhập"*. Phương án bắt đầu tháng 7 sẽ đẻ ra ~10 dòng quá hạn giả trong hàng đợi |
| 2 | **Không có hạn nào** — không hạn lập phương án, không hạn hoàn thành, không vào hàng đợi quá hạn | Case Ý thức nhập bù kéo ba tuần là chuyện **đã xảy ra**, không phải vi phạm. Đem `behaviourCaseDeadline` áp lên nó thì mọi case cũ hiện đỏ |
| 3 | **Không gộp vào đợt đang mở**, kể cả khi ngày rơi trong cửa sổ bốn ngày | Cửa sổ bốn ngày để gộp báo cáo **mới** về cùng một chuyện. Case tháng 7 gộp vào đợt tháng 9 là sai hẳn |
| 4 | **Không tạo tín hiệu, không đổi mức SOS** | Nhập bù là trí nhớ, không phải một bài đánh giá |
| 5 | **Không vào mẫu số hiệu quả hỗ trợ** (`server/src/cases/effectiveness.ts`) | Chủ sản phẩm chốt 19/09/2026. Nhưng **vẫn hiện đủ** trên hồ sơ và hành trình theo tuần — đó là mục đích của tính năng |
| 6 | **Không kích hoạt cảnh báo case trùng** như đường thường | Case cũ trùng hạng mục với case đang mở là bình thường. **Nhưng** phải cảnh báo khi trùng với một case nhập bù khác **cùng khoảng thời gian** — đó mới là nhập hai lần |
| 7 | **Ghi rõ là nhập bù**: ai nhập, nhập lúc nào, lưu cùng case | *"Ngày quá khứ không tự chứng minh hiệu quả."* Người đọc sau ba tháng phải phân biệt được ghi tại chỗ với nhớ lại rồi điền |

### 10.5. Task 4 — AUTH-01: dạy kỹ năng nào sửa kỹ năng đó

Lỗ quyền P0 ở backlog mục 12.1. Tin tốt: **hệ thống đã có sẵn dây đúng, chỉ đang đấu nhầm.**
`hasAssignment(p, ctx, need)` (`server/src/permissions.ts:171`) đã hỗ trợ ba chế độ
`'any' | 'skill' | 'core'`, và `'skill'` đang dùng đúng cho `SCORE_EDIT`. Nhưng
`PERMISSIONS.SOS_EDIT` — quyền của case — đang gọi `hasAssignment(p, ctx, 'any')`
(`permissions.ts:205`), tức **có dạy bất kỳ môn nào ở lớp là sửa được mọi case của lớp**.

Luật chủ sản phẩm chốt 19/09/2026:

| Nhóm case | Ai được tạo, sửa, nhập bù |
|---|---|
| **Học thuật** | **GVBM** đúng kỹ năng mình dạy · **GVCN** mọi kỹ năng trong lớp mình · **Quản lý** tất cả |
| **Ý thức / Khác** | **GVCN** và **Quản lý**. GVBM **báo được vấn đề** nhưng không tạo/xử lý phương án |

Lý do Ý thức khác: case Ý thức **không có kỹ năng** nên không có gì để "đúng môn mình dạy", và
sổ §13.12 chốt *"GV trong lớp có thể báo vấn đề; chỉ QL/GVCN tạo và xử lý PA Ý thức."*

- [x] **Step 1: Phép kiểm trước.** Ba ca, đều phải ĐỎ trước khi sửa: (a) GV Listening sửa case
      Reading cùng lớp → bị từ chối; (b) GV Listening tạo phương án Ý thức → bị từ chối;
      (c) GV Listening sửa case Listening cùng lớp → cho qua.
      **Ghi chú 19/09/2026:** ba ca viết bằng `P.subjectTeacher` (GVBM thuần của MB-FT 101),
      không dùng `P.lrTeacher` như câu chữ gốc — trong đúng bộ demo này, người dạy Listening
      của lớp MB-FT 101 lại chính là GVCN (một người hai vai, có thật ngoài đời), nên dùng
      `P.lrTeacher` để kiểm "GVBM sai môn bị chặn" sẽ luôn PASS sai lý do (qua được vì là
      GVCN, không phải vì đúng môn). Ba phép kiểm nằm ở cuối `server/src/tests/run.ts`.
- [x] **Step 2: Truyền kỹ năng vào ngữ cảnh.** Mọi nơi gọi `can(p, SOS_EDIT, ctx)` cho case học
      thuật phải truyền `ctx.skill` = hạng mục của case. `hasAssignment(..., 'skill')` trả
      `false` khi `ctx.skill` rỗng — nên **thiếu truyền là khoá hết**, không phải mở hết. Rà
      từng nơi gọi, đừng chỉ sửa `teacherAllows`.
      **Đã rà hết:** `cases.ts` (hàm `sosEditCtx` dùng chung ở 8 nơi `require_`, 1 nơi
      `viewer.canEdit`, và `skillSupportBoard` tính riêng từng dòng thay vì một cờ chung cho
      cả bảng); `signals.ts` (`viewOf`, `linkSignalToCase`, `assignSignal`); `attempts.ts` và
      `profile.ts` (hai trường hiển thị, đổi sang `SOS_REPORT` vì đó là quyền BÁO, không phải
      quyền SỬA); `worklist/mywork.ts` (ba nơi lọc hàng đợi việc — `dueActions`, `dueReviews`,
      `caseRows` — hai câu SQL đầu phải thêm `sc.topic` vào SELECT vì trước đó thiếu cột).
- [x] **Step 3: Đổi luật.** Trong `teacherAllows` (`permissions.ts:193`), tách `SOS_EDIT` khỏi
      cụm `ATTEMPT_VIEW`/`STUDENT_VIEW`: case học thuật dùng `'skill'`, case Ý thức dùng
      `'core'`. `ATTEMPT_VIEW` và `STUDENT_VIEW` **giữ nguyên `'any'`** — xem trong lớp mình là
      đúng, chỉ sửa mới cần siết. Thêm quyền `SOS_REPORT` riêng (rộng, như `ATTEMPT_VIEW` cũ)
      cho đúng việc BÁO vấn đề, tách khỏi `SOS_EDIT` đã siết. *(Đã làm, kèm nhánh thứ sáu: đếm sai đơn vị (`yeuCau` > 4, hoặc `coDiem` > `yeuCau`) bị chặn thành "Số liệu tiến độ không hợp lệ" thay vì vẽ ra. **Chưa nối vào màn thật nào** — chỗ dùng thật là PR-I Step 3.)*
- [x] **Step 4: Nhập bù theo cùng luật.** `backfillCase` dùng đúng kiểm tra này, không đường riêng.
      **Chưa làm được — không phải bỏ sót mà vì chưa tới lượt:** hàm `backfillCase` là một
      phần của PR-C Task 3 ("Đã xong từ trước"), và Task 3 **chưa bắt đầu** tại thời điểm ghi
      dòng này. Khi viết Task 3, hàm đó phải gọi `sosEditCtx`/cùng luật `SOS_EDIT` như mọi nơi
      khác — ghi rõ ở đây để không quên khi làm Task 3.
- [x] **Step 5: Kiểm API trực tiếp.** Sổ SCH-01 nhấn: *"kiểm API trực tiếp, không chỉ ẩn nút."*
      Gọi thẳng endpoint bằng tài khoản GV sai môn phải nhận 403.
      Ba phép kiểm Step 1 gọi thẳng `cases.recordIntervention()` — đúng hàm dịch vụ mà route
      Express gọi, ném `HttpError(403, ...)` qua `require_`/`forbidden()` — không đi qua UI,
      không chỉ ẩn nút. Không có thời gian dựng một request HTTP thật qua `supertest`/`fetch`
      trong đêm nay; nếu chủ sản phẩm muốn kiểm ở tầng HTTP thật, đó là việc còn lại.

### 10.6. Nghiệm thu PR-C

Chạy thật, đủ **bốn vai**: GVBM Listening · GVBM Reading · GVCN · Quản lý.

- Form `+ Case` nhóm Ý thức chỉ còn **một** ô phân loại, không còn ô "Về việc gì".
- Nhóm Ý thức **không có** ô ngày nào. Nhóm Học thuật vẫn có.
- Hai báo cáo BTVN cách 2 ngày → một đợt; cách 5 ngày → hai đợt.
- Tab "Đã xong từ trước" nhập được **cả hai nhóm**, bắt buộc từ ngày → đến ngày, ít nhất một
  dòng phương án, kết quả và ghi chú.
- Case nhập bù: không sinh dòng quá hạn nào · không hiện hạn · không đổi SOS · không vào tỷ lệ
  hiệu quả · hiện đúng tuần cũ trên hành trình · có nhãn "nhập bù".
- GV Listening **không** sửa được case Reading và **không** tạo được phương án Ý thức, cả trên
  giao diện lẫn khi gọi thẳng API.
- `npm test` xanh; hai lệnh `tsc` sạch.

---

## 11. PR-D — Khung case gọn

> **Mức chi tiết: task.** Phụ thuộc **PR-C** (dùng form đã sửa).
>
> **Goal:** Một case đọc ở **một** khối, không phải hai khối lồng nhau hiển thị cùng một dữ
> liệu theo hai kiểu.

### 11.1. Vấn đề

Hồ sơ học viên đang có **một khung case lồng trong một khung case**. Khối trên là
`SkillBoard.tsx`; bấm "Lịch sử và kết thúc phương án" (`SkillBoard.tsx:319`) thì nó nhúng
nguyên `CasePanel.tsx` vào bên dưới. Hai khối hiển thị **cùng một case** bằng hai cách trình
bày khác nhau. Chủ sản phẩm: *"rất rối rắm và thừa"*.

### 11.2. Bề mặt đích

```
▾ Listening · Listening mất điểm ở Section 3                    [SOS 1]
  Phân loại: Tư duy và kỹ năng làm bài · mở 12/07/2026
  "Em theo kịp Section 1–2 nhưng mất mạch khi có ba người nói."

  ▸ ✓ Thêm một buổi tutor Listening mỗi tuần      [Tiến bộ một phần] 14/08
      Trần Ngọc Hà · từ 20/08 → 14/09                      [Ghi kết quả]

  ▾ ✓ Nghe chép chính tả Section 3, hai bài/tuần  [Tiến bộ một phần] 24/08
      Trần Ngọc Hà · từ 14/07 → 10/08                      [Ghi kết quả]
      ├ 24/08 · chu kỳ 1 · Tiến bộ một phần · ⚠ cập nhật trễ
      │   "MT2 Listening lên 5.5 nhưng kỳ vọng cũng lên 6.0..."
      └ 10/08 · bắt đầu thực hiện

  Case đang xử lý, chưa kết luận.
  [+ Thêm phương án]  [Hoàn thành case]
```

### 11.3. Các bước

- [x] **Step 1: Gỡ hai nút thừa.** Bỏ nút "Lịch sử và kết thúc phương án" (`SkillBoard.tsx:319`)
      và bỏ hẳn phần nhúng `CasePanel` bên dưới nó. *(Đã làm. `CasePanel` chỉ còn ở trang riêng và ngăn kéo.)*
- [x] **Step 2: Bỏ nút "Mở trang riêng", GIỮ đường dẫn.** Gỡ nút ở `SkillBoard.tsx:323`,
      `CaseBoardPage.tsx:482`, `StudentDetailPage.tsx:324`, `MockDetailPage.tsx:292`. **KHÔNG
      xoá route `/hoc-thuat/case/:id`** — thông báo và badge đang trỏ vào đó; xoá là gãy link
      sâu. Chủ sản phẩm chốt 19/09/2026. *(Đã làm ở cả bốn chỗ; route còn nguyên, kiểm bằng cách mở thẳng `/hoc-thuat/case/1`.
      Ngăn kéo `CasePanel` ở hồ sơ học viên và Bảng case vẫn còn — chỉ bỏ nút dẫn sang trang riêng.)*
- [x] **Step 3: Hai nút thật vào chân khối case.** `+ Thêm phương án` và `Hoàn thành case`, đặt
      cùng dòng trạng thái. Dùng lại đúng hai hàm `CasePanel` đang gọi (`:256`, `:265`) — không
      viết luồng mới. *(Đã làm: `ActionDialog` và `OutcomeDialog` của `CasePanel` được `export` rồi gọi thẳng từ thẻ case. Thẻ tự
      mang `canClose` + `closeBlockers` từ máy chủ — cùng hai hàm nút cũ vẫn hỏi — nên nút "Hoàn thành case" mờ kèm đúng lý do.)*
- [x] **Step 4: Timeline phương án đóng/mở tại dòng.** Mỗi dòng phương án có mũi tên. **Đóng mặc
      định**, chỉ hiện kết quả mới nhất như hiện nay. Mở ra thấy lịch sử cập nhật của **chính
      phương án đó**. Lý do đóng mặc định: Lê Quang Huy có 5 case, mở hết là một trang cuộn vô
      tận. Sổ CASE-08 cũng chốt: *"không mở tất cả mặc định."* *(Đã làm. Máy chủ trả thêm ghi chú, số chu kỳ và cờ trễ cho từng
      lần cập nhật để mở lịch sử ngay tại dòng.)*
- [x] **Step 5: Panel "Ghi kết quả" hai lựa chọn.** `InlineResult` trong `SkillBoard.tsx` thêm
      một cặp lựa chọn: *Ghi kết quả, tiếp tục theo dõi* (phương án vẫn chạy) hoặc *Hoàn thành
      phương án* (hiện thêm ô ngày kết thúc, phương án đóng). **Một** panel, **một** nút chính
      đổi chữ theo lựa chọn — không phải hai nút cạnh nhau. *(Đã làm. Máy chủ chỉ cho kết thúc suông khi kết quả tốt — nên kết quả
      chưa tốt khoá nút chính và mở lối "Thay bằng phương án khác hoặc nhờ Quản lý" sang hộp thoại đầy đủ, đã mở sẵn tab Kết thúc.)*
- [x] **Step 6: Bỏ ô điểm tự chấm khỏi cập nhật phương án (CASE-05).** Gỡ `MetricsField` khỏi
      `ResultDialog` (`CasePanel.tsx:1356`) và khỏi panel ghi kết quả. Ô đó đang bày **bốn kỹ
      năng L/R/W/S** cho một case Listening — chủ sản phẩm gọi là "RẤT VÔ LÝ", và sổ CASE-05 đã
      chốt bỏ từ trước. **Dữ liệu điểm tự chấm cũ đã lưu thì GIỮ, không xoá** (CASE-05 nguyên
      văn: *"giữ quan sát định lượng lịch sử nếu đã có"*). *(Đã làm: `MetricsField` và `metricsPayload` xoá hẳn. Có phép kiểm khoá
      việc điểm cũ vẫn đọc được.)*
- [x] **Step 7: Màn "Hoàn thành case" giữ nguyên.** Nó đang dùng `componentsFor` nên đã hiện
      **đúng tiêu chí của kỹ năng** (Listening → Section 1–4). Không đụng. Chỉ thêm nhánh Ý thức
      theo CASE-06: ghi chú bắt buộc + ngày + nút Hoàn thành case, **không** có ô điểm. *(Đã làm, và phải chạm cả máy chủ: `closeCaseOutcome`
      trước đây bắt MỌI case chọn mức tiến bộ, kể cả Ý thức. Nay case Ý thức không cần và lưu trống — rule book §17.2 "không hỏi
      Có tiến bộ/Không tiến bộ". Case học thuật vẫn bắt buộc.)*

### 11.4. Nghiệm thu PR-D

- Mở hồ sơ **Lê Quang Huy** (`/hoc-vien/3` — 5 case, một case hai phương án hạn khác nhau) và
  **Đinh Ngọc Quyên** (hai case song song cùng một kỹ năng): mỗi case đọc ở **một** khối.
- Không còn nút "Lịch sử và kết thúc phương án", không còn nút "Mở trang riêng".
- Dán thẳng `/hoc-thuat/case/<id>` vào thanh địa chỉ vẫn mở đúng case.
- Mở/đóng timeline từng phương án chạy đúng; mặc định đóng.
- "Ghi kết quả" cho chọn theo dõi tiếp hoặc hoàn thành phương án, đúng một nút chính.
- Không còn ô điểm L/R/W/S ở bất kỳ màn cập nhật phương án nào; điểm tự chấm cũ vẫn đọc được.
- Đủ **ba vai**: GVBM · Quản lý Monbay · Quản trị.

---

## 12. Backlog — KHÔNG thuộc giai đoạn này

Hoãn **không** có nghĩa là đã xong. Đừng đánh dấu hoàn tất vì chưa làm.

### 12.1. P0 còn tồn — sổ §4.A

| Mã | Lỗi | Vì sao đáng ghi |
|---|---|---|
| ~~**AUTH-01**~~ | Quyền case chỉ kiểm "có phân công **bất kỳ** môn nào ở lớp" | **ĐÃ RA KHỎI BACKLOG 19/09/2026 → mục 10.5 (PR-C).** Giữ dòng này để không ai đi tìm lại |
| ~~**DATA-01**~~ | ~~`weekly.ts` lọc scope ở tập đợt thi, nhưng các phép đếm case/HV sau đó chỉ lọc `planned_period_id`~~ | **ĐÃ ĐÓNG ở PR-F (chặng 2, commit `012d9f8`)**, khoá bằng phép kiểm F01; PR-N thêm danh sách khi bấm số và số học viên duy nhất (mục 14, 21/09). Giữ dòng này để không ai đi tìm lại |

### 12.2. Case và Ý thức

~~CASE-04 file/link bằng chứng~~ **(ĐÃ ĐÓNG ở PR-N N5–N6, 21/09/2026 — cho case và phương án học thuật; vi phạm/biện pháp nối ở PR-J)** · CASE-07 nhãn hạn đúng nghĩa · gộp đợt theo cửa sổ bốn ngày ·
hạn xác minh SOS ba ngày · sửa điểm làm mất căn cứ case.

**Đã ra khỏi backlog 19/09/2026** — đừng làm lại ở đây: **CASE-05** (bỏ điểm tự chấm khỏi cập
nhật phương án) và **CASE-06** (bộ kết quả riêng cho Ý thức) nay nằm ở **mục 11 (PR-D)**;
phần còn lại của **CASE-01** (hai ô hỏi trùng) nằm ở **mục 10.1 (PR-C)**.

**Mới thêm 19/09/2026 (PR-C Task 3):** ô "Điểm chi tiết theo kỹ năng" của tab "Đã xong từ
trước" chưa nối dây giao diện. `backfillCase` (server) đã nhận sẵn `metrics` và validate như
`closeCaseOutcome`; chỉ thiếu component UI vì `MetricsField` hiện không export trong
`CasePanel.tsx` và PR-D dự kiến gỡ hẳn nó — nối dây sau khi PR-D quyết định hình dạng cuối
của khối kết quả, để không phải làm hai lần.
**Cập nhật 20/09/2026 (PR-D làm xong):** `MetricsField` đã bị gỡ. Hình dạng cuối là `ComponentsField` (Section 1–4 theo đúng
kỹ năng) ở màn Hoàn thành case — nối ô của tab nhập bù theo hình đó, không dựng lại `MetricsField`.

### 12.3. Thống kê và báo cáo

"Chưa đủ dữ liệu" không vào mẫu số hiệu quả (ANALYSIS-06) · cây Normal/FT → kỹ năng → phân
loại → chi nhánh/lớp (ANALYSIS-01) · drill-down ra đúng số (ANALYSIS-02) · WORK-02 ma trận
báo cáo · WORK-03 liên kết task thật.

### 12.4. Chưa có bằng chứng, cần chạy thật

- Hồ sơ trên **máy tính bảng và điện thoại thật** — hiện chỉ kiểm bằng khổ mô phỏng 375px.
- Rà các màn phụ theo **mục 17** của brief (tiêu chuẩn UI).

### 12.5. Bốn đường vào nhập điểm còn lại của Task 6 (khảo sát 18/09/2026)

**Đã xong (PR-Qb, 23/09/2026) — cả bốn đường + quy ước tham số duy nhất.** Xem R7/R8 ở mục 15
(đánh dấu `[x]`) và Nhật ký thực thi của `docs/superpowers/plans/2026-09-23-pr-qb-ho-so-hoc-vien.md`.
Bảng dưới giữ lại để đọc lịch sử khảo sát, không còn là việc cần làm.

PR1 chỉ sửa lỗi thông báo không điều hướng (đã xong, xem mục 14). Bốn đường sau cần dựng
mới, không phải sửa nhỏ — làm PR riêng, có kèm quyết định thiết kế trước khi code:

| Đường | Hiện trạng | Việc cần làm |
|---|---|---|
| Hàng lớp ở danh sách học viên → bảng chấm | Badge "X bài cần chấm" (đã có `scope` từ Task 5) mở **hàng đợi lọc** (`WorkQueue`), không mở **bảng chấm dạng lưới** (`ScoreSheetPage`/`RegularSheetPage`). Nút "Nhập điểm test" thật ở `ClassOverviewPage.tsx:157–164` không mang `scope` | Quyết định trước: hàng đợi lọc có tính là "bảng chấm" theo sổ §13.9 không, hay phải là lưới chấm? Nếu là lưới, nút ở ClassOverviewPage cần mang `scope` |
| Nhãn MT2/MT3/Final ở `ClassRoster.tsx:200–212` → hồ sơ đúng đợt | Link thẳng tới `/mock-test/:id` hoặc `/bang-diem-thuong/:classId` (màn chấm điểm), không phải `/hoc-vien/:id` (hồ sơ) | Cần một quy ước tham số "đợt đang focus" trên `StudentDetailPage` trước, xem dòng dưới |
| Đầu hồ sơ học viên → panel danh sách đợt | `HeaderStats`/`Stat` ở `StudentDetailPage.tsx:355–416` là `<div>` tĩnh, không bấm được | Thêm `onClick` mở tab đợt (đã có sẵn ở `tier3==='scores'`, dòng 217–222 · 418–466); cần định vị đúng đợt nếu có tham số focus |
| Mốc Test trên hành trình → cùng hồ sơ Test | `JourneyTimeline.tsx` — mốc chỉ có `title` (tooltip), không có `onClick`; chỉ mục case đã có `onOpenCase` | Thêm `onClick` cho mốc Test, dùng chung quy ước tham số focus với hai dòng trên |
| Thông báo → focus đúng ô | Điều hướng đã chạy lại (sửa 18/09), nhưng chỉ tới đúng TRANG — `sos_case`/`case_signal`/`skill_move_requests` không tra được `studentId` để mở đúng hồ sơ (bảng `notifications` không có cột đó; không được thêm cột ở PR1) | Thêm JOIN ở `GET /notifications` để trả kèm `studentId` đã tra sẵn theo `entity_type` — **không đổi schema**, chỉ đổi câu SELECT |

**Việc chung cho bốn dòng trên:** một quy ước tham số duy nhất trên `StudentDetailPage`
(gợi ý: `?attempt=<id>` hoặc `?focus=<attemptId>:<skill>`) để "mở đúng đợt/kỹ năng" — dựng
lẻ tẻ ở từng nơi gọi thì lại sinh ra đúng kiểu hai định nghĩa một khái niệm mà mục 5.1 cảnh
báo.

### 12.6. PR2b thu hẹp lại lúc code (đêm 19/09/2026) — phần còn thiếu

Xem mục 7b để biết phần đã làm. Bốn việc sau **chưa làm**, không phải đã xong rồi quên ghi:

| Việc | Vì sao chưa làm đêm nay | Việc cần làm khi quay lại |
|---|---|---|
| Hai hàng lịch nhanh RLW/Speaking trong panel Kế hoạch Test | Đổi cách bày 4 checkbox rời thành hai hàng xếp riêng từng kỹ năng là một thiết kế UI cần cân nhắc, không phải đổi một dòng | Thiết kế lại khối "Kỹ năng lượt này yêu cầu" trong `MockPlanPanel.tsx`, tách RLW/Speaking thành hai nhóm bấm riêng |
| Sửa lịch một lượt **ngay trong** panel Kế hoạch Test (có preview) | Panel hiện chỉ gọi `bulkPlan`→`createAttempt` (luôn INSERT); sửa thật phải gọi `setSkillWeek` (UPDATE) cho từng kỹ năng của lượt đã chọn — cần dựng lại luồng chọn/preview trong chính panel, không chỉ thêm một dòng | Khi bấm vào ô MT đã có lịch (`had`, `MockPlanPanel.tsx` `MockSlots`), mở modal cùng kiểu `SkillWeekModal` (đã có preview + đúng quyền từ PR2b) thay vì gọi `pick()`→`bulkPlan` |
| "Đợt hoàn tất thì chỉ đọc" ở `setSkillWeek` | `assessment_attempts.status` không có giá trị riêng cho "hoàn tất" — trạng thái này đang được SUY ra (đủ điểm required), không phải một cột. Chặn nhầm có thể khoá luôn việc hiệu chỉnh hợp lệ | Xác định rõ "hoàn tất" nghĩa là gì ở tầng dữ liệu trước khi chặn — cần chủ sản phẩm xác nhận định nghĩa, không tự suy |
| **Nút dời lịch một kỹ năng cho lớp Normal — chưa có ở BẤT KỲ đâu trên giao diện** | Quyền `schedule.move` đã mở đúng ở máy chủ (12 phép kiểm xác nhận), nhưng nút "Đổi tuần"/"Đã thi"/"Xác nhận vắng" chỉ tồn tại ở `MockDetailPage.tsx`, mà file đó tự điều hướng MỌI lượt Normal sang `RegularSheetPage.tsx` — nơi không có nút nào như vậy. Phát hiện lúc bấm thử tay, không phải lúc viết kế hoạch | Dựng UI dời lịch cho `RegularSheetPage.tsx` (hoặc một màn chi tiết riêng cho lượt Normal) — tái dùng `moveableSkills`/`canMoveSkillSchedule` đã có sẵn ở máy chủ, chỉ còn thiếu giao diện |

### 12.7. Việc chặng 1 (PR-E) chưa làm hoặc để lại — 20/09/2026

- **`<KetQuaDot>` và `<TyLe>` chưa có màn thật nào dùng.** Chúng có luật, có kiểm thử và có trang thử; nối vào màn là việc của PR-I
  (Step 3) và PR-F (Step 5). Đừng ghi PR-E là "đã sửa MT-P01" — nó mới **đóng cửa lỗi ở component**, các màn cũ còn tự vẽ câu riêng.
- **`useNgayNghiepVu()` chưa thay các chỗ khác** đang tự đọc `session.demoDate` hoặc `fmtDate`; MT-P10 (ngày nghiệp vụ ≠ ngày ghi nhận)
  chưa hiện ở màn nào.
- **Không có dữ liệu demo nào đang quá hạn nhập điểm**, nên dạng chữ "quá hạn n ngày" mới được kiểm bằng phép kiểm thuần, chưa nhìn
  được trên màn thật.
- **DS14 (skeleton đúng hình dáng bảng)** ghi ở mục 20 là "trong PR-E" nhưng mục 20 chưa được duyệt — không làm.
- Ảnh chụp trước/sau và ảnh thang xám (nghiệm thu 15.3): công cụ chụp ảnh hết thời gian chờ nên **chưa có**; đã đo bằng cấu trúc
  trang thay vì bằng mắt.


### 12.8. Việc chặng 2 (PR-F) chưa làm hoặc phát hiện thêm — 20/09/2026

- ~~**Bốn chỉ số đã khai báo nhưng CHƯA có hàm tập ID:** `hv-sos-hien-tai`, `hv-duoi-ky-vong-mon`, `dung-han-cap-nhat`, `do-phu-danh-gia`.~~ **Đã có hàm ở PR-N (21/09/2026).** Ô "Học viên dưới kỳ vọng" của design plan §18.2 vẫn chưa được dựng ở giao diện — việc của PR-P.
- **Chưa phải mọi số trên Tổng quan đi qua `<SoLieu>`.** Bảng "Việc cần lưu ý" (sáu cột), "Theo chi nhánh" và các cột của bảng phân tích vẫn là số trần dùng bộ đếm riêng (`branchpulse.ts`, `weekly.ts`). Chúng khớp với `<SoLieu>` ở dữ liệu demo hiện tại (kiểm thật: 20 HV / 33 case ở cả hai nơi), nhưng chưa được đảm bảo bằng cấu trúc.
- **Nhóm "chưa xác định nguồn" (F03) chưa hiện ở giao diện** — có hàm `planOutcomesUnattributed`, chưa có màn nào gọi.
- **Dữ liệu demo: học viên đã kết thúc khoá mà case còn mở** (Vũ Thu Uyên, case 57 `in_progress`, ghi danh `completed` từ 26/04). Là lý do duy nhất khiến Tổng quan đếm 29 mà Thực trạng đếm 28. Chưa có luật nào đóng/giao lại case khi một em kết thúc lộ trình — cần chủ sản phẩm quyết định.
- **Case Fast Track mở mà em chuyển sang Normal** (ví dụ case `writing1`) biến khỏi tab Normal của Thực trạng, vì hạng mục `writing1` không có ở bộ Normal. Tổng quan vẫn đếm. Chưa quyết định hiện nó ở đâu.
- **Lỗi có sẵn được sửa nhân tiện (không nằm trong kế hoạch):** `issueScopeOf` + `studentsOf` hiểu danh sách chi nhánh rỗng là "toàn hệ thống" (mục 16 Step 6). Nếu có nơi nào khác đang truyền `branchIds: []` và trông cậy vào hành vi cũ thì sẽ thấy rỗng.
- ~~`GET /metrics/:id` trả cả `ids` cho mỗi lần gọi~~ **Đã sửa ở PR-N (N4).**


### 12.9. Việc chặng 3 (PR-G) chưa làm hoặc cần chủ sản phẩm quyết — 20/09/2026

- **Không có nút cho Quản lý hiệu chỉnh dấu `-` nhập cho tuần đã kết thúc (C10).** Có hàm `resolveLateNoShow` và route `POST /attempts/:id/scores/:skill/no-show/resolve` (đã kiểm), nhưng giao diện chưa có chỗ bấm; Quản lý chỉ nhận thông báo. Ô hiện `Chờ quản lý hiệu chỉnh`.
- **Hai câu ngỏ của §17.1 chưa trả lời:** ai được sửa kết luận không dự thi SAU cuối tuần, và việc đó có đảo quyết định duyệt đã phát sinh không. Hiện: chỉ Quản lý qua đường sửa trạng thái thi có sẵn, và không đảo gì. Chưa thử đường đó với ô có dấu `-`.
- **Quyết định kế hoạch không nêu, cần xác nhận:** buổi Writing chỉ chốt vắng khi CẢ HAI ô W1/W2 đều `-` (mục 17.3 Step 5).
- **Chỉ GVCN được báo khi chốt**, Quản lý không (DS01 "bản tin thứ Hai" chưa duyệt, không làm).
- **Đường "hiệu chỉnh điểm có lý do" cho giáo viên chưa có** — thông báo lỗi khi `-` đè lên điểm chính thức nhắc tới nó.
- Hồ sơ Mock Test (`MockDetailPage`) dùng chung các ô đã sửa nên có dấu `-` nhưng **chưa bấm thử ở màn đó**; khổ 375px của bảng chấm cũng chưa xem.
- C01–C09 mới là hằng số ghi lại quyết định (mục 17.3 Step 1), chưa nối vào nơi gọi.


### 12.10. Việc chặng 4 (PR-I) chưa làm hoặc chưa kiểm — 20/09/2026

- **Nghiệm thu "Phạm Bảo Ngọc chỉ có R=7.0" không dựng được nguyên văn:** dữ liệu demo hiện tại MT3 của Ngọc có L=6.5 và R=7.0. Đã thấy thật: xoá R thì đầu trang ghi `1/4` + `SOS 1 tạm thời` và Overall `Chưa đủ điểm` không badge đạt; "R đạt, Overall chưa đủ điểm, không badge" nằm ở phép kiểm `<KetQuaDot>` của chặng 1.
- **Hộp thoại đổi lịch / hẹn xử lý / khôi phục / xử lý vắng / trả lời đề nghị được nối vào menu và nút chính mới nhưng chưa bấm qua từng hộp thoại ở chặng này** — chỉ thấy đúng nút chính đúng vai (GVCN: `Xử lý vắng`; Quản lý: `Trả lời đề nghị`). Nội dung các hộp thoại giữ nguyên, trừ tên.
- **Không có nút "Ghi nhận vắng" nào được bấm thử.** Đường đi giữ nguyên nhưng nay ở menu.
- **Hồ sơ Test của lớp Normal** không đi qua màn này (chặn cửa chuyển sang bảng điểm thường) — không ảnh hưởng, không bấm.
- **Chưa xem khổ tablet.** Điện thoại 375px: không cuộn ngang cả trang, hàng tiêu đề ẩn, mỗi bài một thẻ.
- Nhãn "Chờ nhập điểm" và "Hạn nhập điểm 23/09" đứng cạnh nhau ở cùng một dòng — hai câu đúng nhưng gần nhau; để lượt biên tập tiếng Việt (chặng 5).
- Dữ liệu demo trên máy dev bị thay đổi khi bấm thử (điểm Writing Task 1 của Ngọc) — không nằm trong repo.


### 12.11. Việc chặng 5 (PR-H) chưa làm hoặc chưa kiểm — 20/09/2026

- **Chưa quét từng màn theo kiểu "một khái niệm một chữ":** mới áp các dòng bảng §2 và các chữ sai bắt được bằng grep. Còn lại: mọi `<Empty>` chưa được kiểm "thiếu gì + ai điền được + nút"; nhiều `SectionNote` giải thích mô hình dữ liệu còn nguyên; đại từ mơ hồ ("em này", "lượt đó") còn ở CHÚ THÍCH mã (không hiện trên giao diện) và một số chuỗi ít gặp chưa tìm ra bằng grep.
- ~~`mức gấp`~~ — **đã chốt 20/09/2026: đổi thành `mức độ ưu tiên`** (mục 3). Còn nhãn từng mức (ví dụ chữ "Gấp") và hạn 7/5/3 ngày giữ nguyên; chữ "Gấp" ở tên mức chưa đổi.
- **`Chọn giáo viên` trong ô `Người phụ trách` chưa làm** (cần lọc theo giáo viên ở máy chủ).
- **Chưa bấm thật:** hộp thoại thêm học viên hàng loạt (nút `Xem N dòng cần sửa`); form nhập bù (`Phương án đã áp dụng`, `+ Thêm phương án`); trạng thái rỗng của khối phương án; tooltip `Tuần dự kiến hoàn tất` ở bảng điểm Normal; bảng nhãn ở ba vai không được mở từng màn — chỉ mở: danh sách học viên (Quản lý, GVBM Hà), tổng quan lớp (GVBM Hà), ô `Người phụ trách` ở tổng quan (Quản lý), và hồ sơ Test ở chặng 4.
- Nhãn `Chờ nhập điểm` đứng cạnh `Hạn nhập điểm 23/09` ở hồ sơ Test vẫn còn.


### 12.12. Sau rà soát độc lập toàn nhánh — 20/09/2026

Một người rà soát độc lập đọc toàn bộ diff của nhánh. Đã sửa (mỗi lỗi có phép kiểm đỏ trước, trừ ghi chú): ô "-" quá Chủ nhật mà không được chốt (W1 "-", W2 có điểm) tự nhận "Không dự thi" và bị khoá; bài "-" vẫn nằm trong "việc của tôi" (`myPendingSkills`/`myPendingDetail`) và trong đếm chi nhánh (`branchpulse`); hiệu quả phương án mở rộng quyền của giáo viên một lớp ra cả chi nhánh (kiểm này **xanh ngay khi viết** vì dữ liệu mẫu không có phương án ngoài lớp — sửa theo đọc mã, chưa có phép kiểm phân biệt được); `?classId=` ở bảng thực trạng không kiểm quyền; nút "Xử lý vắng" hiện cho cả giáo viên bộ môn (nay đi theo `viewer.canHandleAbsence`); case Ý thức đã hoàn thành hiện "đang xử lý"; "Mở lại lượt" không báo lỗi; thông báo "-" muộn trỏ sai thực thể; Quản lý xác nhận một task Writing lẻ bỏ qua luật hai task; `sit_note` "Không dự thi…" còn lại sau khi dời.

**Còn để lại, chưa sửa:**
- Đếm chi nhánh (`branchpulse`) chỉ loại ô có dấu "-" một cách thô, không xét cặp W1/W2 như bảng chấm.
- Báo lại "-" cho cùng một tuần sau khi Quản lý đã đảo kết luận chốt là không-làm-gì (cờ đã chốt còn nguyên) — dấu không hiện lại, cũng không chốt lại.
- Chuỗi `sit_note` bắt đầu bằng "Không dự thi" vẫn là thứ luật dời lần đầu dựa vào để nhận ra bài đã chốt (`fromNoShow`) — nên thay bằng cờ riêng.
- `resolveLateNoShow` xác nhận cho Writing mới chặn khi thiếu một task; chưa có phép kiểm riêng cho nhánh đó.
- Phép kiểm `PR-H` về `workScope` chỉ kiểm hàm thuần, chưa kiểm trường máy chủ trả về.


### 12.13. Áp lời chốt C01–C10 ngày 20/09/2026

Xem mục 3 và `shared/domain/policy.ts` (nay ghi rõ điểm nào đã nối dây). Đã áp vào mã: **C02** (quyền), **C03** (cửa sổ gộp 3 ngày, bỏ siết hạn khi nâng mức — dữ liệu mẫu và phép kiểm đổi theo), **C10** (chốt ngay). C04/C06/C07/C09 khớp hành vi cũ. Rule book (mục 17.7) và `LUAT_CHO_CHOT.md` đã cập nhật.

**Hệ quả cần biết:**
- Hàm và đường "Quản lý hiệu chỉnh dấu '-' nhập cho tuần đã qua" (mục 12.9 dòng đầu) **không còn dùng** khi C10 = chốt ngay; mã giữ lại cho phương án cũ. Sau cuối tuần Quản lý sửa qua đường sửa trạng thái thi có sẵn (ghi đè trực tiếp, có audit).
- **C02 kéo theo:** GVCN không còn nhận việc "gặp học viên" của case môn khác (phép kiểm đổi theo). **Chưa quyết:** GVCN có còn bấm "Hoàn thành case" cho case môn khác không — hiện vẫn được.
- **C03:** cửa sổ gộp đổi từ 4 sang 3 ngày *(hiểu "3 ngày đầu" = ngày mở + 2 ngày sau)*; case đã có sẵn trong CSDL giữ `merge_until` cũ (không có migration). Nâng mức ưu tiên vẫn xảy ra khi gộp nhưng không còn đổi hạn phương án.
- **C09:** tài liệu từng ghi ngược lại mã; nay tài liệu khớp mã.
- **C01 và C08 chưa nối dây** — chờ chủ sản phẩm xác nhận (mục 3, dòng cuối).

### 12.14. PR-K (mục 23.3) chưa làm hoặc để lại — 21/09/2026 đêm

PR-K #42 chỉ làm đủ cho deploy đêm nay (K7 nói rõ "không kiểm ngược, không chụp ảnh" — mức
kiểm nhẹ hơn mục 22, xem bảng ở mục 23.0). Năm việc dưới đây bị bỏ qua có chủ đích vì lý do kỹ
thuật hoặc để không phình phạm vi đêm nay, không phải quên:

| Việc | Vì sao chưa làm đêm nay | Làm ở đâu khi quay lại |
|---|---|---|
| Đính kèm tệp ngay lúc đang **ghi** vi phạm mới (`RecordViolationPanel.tsx`) | `BangChung` cần `ownerId` — vi phạm mới soạn trong form chưa có `id` (chưa `POST`). Phải lưu xong mới có bản ghi để đính kèm | Bất kỳ ai chạm lại `RecordViolationPanel`: lưu nháp trước (tạo vi phạm ngay khi mở form, giữ `idempotencyKey`) rồi mở `BangChung` ngay trong form — hoặc chấp nhận "chỉ đính kèm được sau khi lưu" là hành vi cuối cùng và bỏ dòng này khỏi backlog |
| Nút `Ghi vi phạm` ở **từng dòng học viên** trong bảng lớp (`ClassRoster.tsx`) — đặc tả §7.4 và mục 22.5 K1 đều nói rõ vị trí này | Ưu tiên thời gian đêm nay: chỉ làm 2/3 vị trí đặc tả nêu (đầu tab Ý thức & Phối hợp của lớp, đầu tab của hồ sơ học viên) | **PR-Q (mục 22.7)** — PR-Q vốn đã sửa `ClassRoster.tsx`/hàng lớp (Q1) và dựng tab `Ý thức` của bốn tab hồ sơ lớp (Q4); thêm nút này cùng lúc, đỡ phải mở lại file lần hai |
| Nút `Xem vi phạm đó` trong cảnh báo trùng mềm V06 (chỉ còn `Vẫn ghi vi phạm mới`) | Panel `Ghi vi phạm` đang nằm lồng trong Modal khác (mở từ lớp/hồ sơ HV) — mở thêm panel chi tiết vi phạm chồng lên cần một tầng điều hướng nữa, để lại cho gọn thời gian | Chưa gắn với PR nào; làm cùng lúc với việc dựng lại panel chi tiết Vi phạm (§7.7) nếu có |
| Bảng "Vi phạm theo nhóm: Tổng · Chưa xử lý · Đang chuẩn bị · Đã xử lý" đúng 5 hàng nhóm của §7.6 | Máy chủ (`yThucMetric`) mới có `vi-pham-tong`/`vi-pham-chua-xu-ly` đếm theo TOÀN lớp/chi nhánh, chưa cắt theo từng nhóm (category), và không có chỉ số riêng cho "đang chuẩn bị"/"đã xử lý". K5 dùng tạm bốn chỉ số tổng thay bảng 5×4 | **PR-P (mục 22.6, P7–P9)** — PR-P vốn làm lại toàn bộ trang Phân tích (bốn góc nhìn, trong đó có "Ý thức"); thêm chỉ số cắt theo nhóm lúc đó, tránh viết `yThucMetric` hai lần |
| Bộ lọc **lớp** ở góc nhìn Ý thức & Phối hợp của Quản lý (chỉ có chi nhánh + khoảng thời gian) | `yThucMetric`/`phoiHopMetric` chỉ nhận `branchId`/`from`/`to`, chưa nhận `classId` | Cùng **PR-P** như dòng trên — thêm tham số `classId` cho cả hai hàm chỉ số một lượt |

### 12.15. PR-K2 (mục 23.3b K2-6) chưa làm hoặc để lại — 22/09/2026

- **22/09/2026 (PR-HV, D3) — đảo K3-6:** chủ sản phẩm chốt **bỏ "Hãy"** ở đầu câu nhắc trên mọi chữ giao diện và câu báo máy chủ ("Hãy chọn học viên." → "Chọn học viên."); luật ghi ở `TU_DIEN_VA_CHU.md` §4, phép quét tự động ở `server/src/tests/hoSoHocVien.tests.ts`. Hai việc K2-6 dưới đây đã làm ở PR-HV: số `Phối hợp SOS {n}` trên tab con, nút `[Mở]`/`[Xem]` ở dòng thời gian.

- **Sau rà soát PR-K3 (22/09), để PR-S:** phép kiểm `recentByStudent` mới đếm số lượng, chưa kiểm đúng 3 biện pháp **mới nhất** được chọn (so id); `rowsForCategory` ở `ClassYThucCard.tsx` tính lại mỗi lần vẽ và thiếu trong mảng phụ thuộc `useMemo`; `recentByStudent` gửi nguyên `MeasureDetail` dù chỉ dùng `kindLabel`.
- **Sau rà soát Opus PR-Z2a (22/09), trước khi có người dùng thật (chưa gắn PR):** chưa giới hạn số lần thử `/auth/login`; phiên không hết hạn; lỗi 409/500 trả nguyên câu SQL; `/api/health` công khai và hỏi database mỗi lần gọi; hàm Netlify mặc định dừng sau 10 giây — giao dịch bị cắt giữa chừng giữ khoá ghi Turso tới khi hết giờ phía Turso; `npm run build` cần mạng ở bản sao mới (tải thư viện Linux); bản gói ghi `nodejs24.x` dù `netlify.toml` ghi Node 22 (CLI lấy Node của máy build).

Rà soát độc lập PR-K (22/09) phát hiện thêm sáu việc ngoài năm việc đã ghi ở mục 12.14 (ba dòng
trùng với 12.14 nên không lặp lại ở đây). K2-6 nói rõ: **ghi lại, không làm ở PR-K2**.

| Việc | Vì sao chưa làm ở PR-K2 | Làm ở đâu khi quay lại |
|---|---|---|
| Số Phối hợp SOS chia theo `SOS1`/`SOS2`/`SOS3` (§7.6 bảng 3) | `phoiHopMetric` đếm gộp mọi mức SOS trong một chỉ số, chưa cắt theo mức | **PR-P** — cùng lúc làm lại trang Phân tích, thêm tham số mức cho ba chỉ số `phoi-hop-*` |
| ✅ **Đã làm ở PR-HV (22/09/2026, `HangTab` — số lượt chưa hoàn thành, J5)** — Số `Phối hợp SOS {n}` trên nhãn sub-tab ở hồ sơ học viên (`StudentYThucSection.tsx`, đúng hình §7.3) | Sub-tab hiện chỉ có chữ `Phối hợp SOS`, chưa có số đếm như bên hồ sơ lớp (`ClassYThucCard.tsx` đã có) | Người chạm lại `StudentYThucSection.tsx`: thêm `coord.data?.rows.length` (hoặc số lượt chưa hoàn thành) vào nhãn nút, cùng khuôn với hồ sơ lớp — **PR-Q** |
| ✅ **Đã làm ở PR-HV (22/09/2026, `XemPhuongAnPanel.tsx` + nút `Mở`/`Xem` ở `DongThoiGian`)** — Nút `[Mở]`/`[Xem]` cho biện pháp ở dòng thời gian hồ sơ học viên (§7.3) | Dòng thời gian (`StudentYThucSection.tsx` ~153–165) chỉ có nút `Xác nhận` cho biện pháp đang chuẩn bị; biện pháp đã thực hiện không có cách mở lại chi tiết từ dòng đó | **PR-Q** — cần một panel/route xem chi tiết một biện pháp đã thực hiện (lịch sử, bằng chứng), chưa có ở giao diện |
| Toast `Hoàn tác` sau khi ghi vi phạm (Y_THUC §7.2) | `RecordViolationPanel.tsx` chỉ báo `Đã ghi vi phạm cho {tên}`, không có link hoàn tác; cần route huỷ vi phạm vừa tạo trong một khung thời gian ngắn | Chưa gắn PR — làm cùng lúc với việc dựng lại toast dùng chung nếu có, hoặc **PR-Q** |
| Máy chủ tự lấy người đang đăng nhập làm `performedBy` khi để trống (`measures.ts` ~390, hàm `confirmMeasure`) | Hiện máy chủ đòi `performedBy` tường minh; PR-K vá tạm bằng cách giao diện tự gửi `session.user.id` khi ô trống (xem mục 14, log PR-K) — vá đúng nhưng không robust cho các đường gọi khác | Sửa `confirmMeasure`: `performedBy` để trống thì mặc định `p.userId`, cùng khuôn `performerSelf` của `case_interventions` — bất kỳ ai chạm lại `measures.ts` |
| Lớp dùng để kiểm nút `Ghi vi phạm` ở `profile.ts` ~891 (`canRecordViolation`, biến `current`) có thể lệch với `activeClassOf` ở `access.ts` sau khi học viên chuyển lớp | Hai nơi tính "lớp em đang học" không cùng một nguồn — `current` là biến cục bộ của trang hồ sơ, `activeClassOf` truy vấn DB mới mỗi lần; chưa xác nhận có lệch thật trong dữ liệu hay chỉ là rủi ro lý thuyết | Bất kỳ ai chạm lại `profile.ts`: đổi `current?.class_id` trong `viewer.canReport`/`canRecordViolation`/`canClose` thành gọi `activeClassOf(studentId)` — MỘT nguồn duy nhất |

### 12.16. PR-Z2a (hạ tầng Netlify + Turso) thấy nhưng KHÔNG sửa — 22/09/2026

Phần A chỉ đổi nơi chạy và nơi cất dữ liệu. Những điều dưới đây thấy trong lúc làm, cố ý để nguyên:

| Việc | Vì sao chưa làm | Làm ở đâu khi quay lại |
|---|---|---|
| Màn đăng nhập bản chính không hiện khối "máy chủ chưa chạy" khi máy chủ sập | `WelcomePage.tsx` suy `serverDown` từ lỗi của `/demo/accounts`; bản chính không gọi đường đó nữa. Form đăng nhập vẫn báo lỗi khi bấm | Suy `serverDown` từ `/auth/info` — PR giao diện sau deploy |
| Dựng bộ demo lên Turso **từ máy ở Việt Nam** rất chậm (~0,5 giây mỗi câu lệnh, toàn bộ seed là một giao dịch) | Đúng bản chất "mỗi câu một lượt mạng". Chỉ ảnh hưởng database THỬ; bản chính bắt đầu rỗng | Không cần làm. Nếu còn phải seed database thử nhiều lần: chạy seed ra file rồi `turso db create --from-file` |
| Khoá chặn "đường dẫn tệp nằm ngoài thư mục tải lên" giờ ném lỗi thường (500) thay vì 403 | Khoá chuyển vào `khoTepODia` theo plan; chỉ xảy ra khi cột `attachments.url` bị sửa tay trong database | Không ưu tiên |
| **`npm run migrate` chưa có chốt chặn Turso** (rà soát Phần A) — chạy với biến Turso sẽ nâng cấp thẳng database thật và có thể tạo tài khoản quản trị mật khẩu mặc định | `migrate/run.ts` nằm ngoài phạm vi Phần A | ✅ **Đã làm ở PR-Z2b (Task 6d):** Turso cần `PISA_CHO_PHEP_MIGRATE_TURSO` = nguyên tên máy chủ; bỏ tài khoản/mật khẩu mặc định |
| `DB_PATH` (giờ có thể là URL Turso) được in ở log seed/migrate — sẽ lộ token nếu ai đó nhét `?authToken=` vào URL | URL chuẩn của Turso không chứa token; TRIEN_KHAI tách token thành biến riêng | ✅ **Đã làm ở PR-Z2b:** `DB_PATH` bỏ phần `?…`/`#…` (có phép kiểm) |
| Netlify Blobs mặc định "nhất quán sau cùng": tải xuống NGAY sau khi tải lên có thể báo không thấy tệp trong vài chục giây | `connectLambda` 11.1.0 chưa bật được `consistency: strong` | Theo dõi ở Task 6b Step 6 / Task 10; nếu gặp thật thì xử lý ở Phần C |
| Có sẵn từ trước, ngoài phạm vi: phiên đăng nhập không hết hạn; `/auth/register` mở cho mọi người (cần duyệt mới dùng được) | Không thuộc PR hạ tầng | Xem xét trước khi gửi link cho giáo viên |
| File database ở **thư mục main gốc** trên máy chủ sản phẩm còn ở mô hình trước PR-J (cảnh báo khi `npm run dev`) | Không thuộc mã; chỉ là dữ liệu cũ trên máy | Chủ sản phẩm chạy `npm run seed` ở thư mục gốc khi tiện |

### 12.18. PR-HV (hồ sơ học viên v3) thấy nhưng KHÔNG sửa — 22/09/2026

Ghi theo yêu cầu chủ sản phẩm sau rà soát PR #52 (làm sau, không làm ở PR-HV):

| Việc | Ở đâu | Làm khi nào |
|---|---|---|
| Thẻ case đếm bằng chứng bằng một `SELECT COUNT(*)` **mỗi thẻ** (`caseCardOf`, `attachmentCount`) — gộp thành một truy vấn theo lô qua `countAttachments()` của `platform/attachments.ts` | `server/src/cases/cases.ts` ~2380 | Khi tối ưu số truy vấn cho Turso (mạng, mỗi truy vấn một vòng đi về) |
| ✅ **Đã làm ở PR-Qb (AN-9, 23/09/2026).** Hồ sơ học viên gọi `/students/:id/violation-warning` **hai lần** (dấu ⚠ trên tab ở `StudentDetailPage` và banner trong `StudentYThucSection`) | `web/src/modules/students/StudentDetailPage.tsx`, `web/src/modules/yThuc/StudentYThucSection.tsx` | Xong — `warn` nâng lên trang, truyền xuống qua prop `canhBao` |
| ✅ **Đã làm ở PR-Qb (AN-10, 23/09/2026).** Ở 375px, bảng Mock Test (`IeltsAttempts`) và bảng Học viên của lớp (`ClassRoster`) cuộn ngang **trong thẻ**; nhãn `dự kiến dd/mm` của `JourneyTimeline` lòi 23px khỏi `main` | `StudentDetailPage.tsx`, `ClassRoster.tsx`, `HanhTrinh.tsx` (thay `JourneyTimeline.tsx` đã xoá) | Xong — bảng thêm `min-w-[640px]` trong khung `overflow-x-auto` sẵn có; `HanhTrinh.tsx` không còn nhãn "dự kiến" tuyệt đối vị trí nào |

### 12.17. PR-Z2b (an toàn dữ liệu bản chính) thấy nhưng KHÔNG sửa — 22/09/2026

| Việc | Vì sao chưa làm | Làm ở đâu khi quay lại |
|---|---|---|
| `npm run sao-luu` chép các bảng **lần lượt**, không trong một giao dịch đọc — ai ghi giữa chừng thì bản sao có thể lệch vài dòng giữa các bảng | Một giao dịch dài trên Turso có thể chặn người đang ghi dữ liệu thật; chép từ Việt Nam mất ~2 phút | Lệnh in dòng nhắc "chạy lúc không ai nhập liệu". Nếu cần bản sao nhất quán tuyệt đối: dùng point-in-time của Turso |
| Chi nhánh thêm bằng `them-chi-nhanh` có đơn vị báo cáo đứng **sau** "Tutor part-time" trong danh sách | Sửa thứ tự của dòng Tutor là sửa dữ liệu đã có — lệnh cố ý không sửa gì ngoài dòng mới | Nếu thứ tự hiển thị quan trọng: màn quản trị đơn vị báo cáo (chưa có) |
| `migrate()` vẫn ghi vài **mốc nâng cấp** vào bảng `demo_config` (`migrated_at`, `normal_pass_threshold`…) kể cả trên Turso | Đó là mốc nâng cấp (và mốc đổi luật có audit), không phải ngày demo hay dữ liệu demo | Không cần làm. Nếu đổi tên bảng `demo_config` thì làm cùng |
| Lệnh `netlify env:set` in lại **cả giá trị** vừa đặt ra màn hình (Netlify CLI 27.8.0) | Hành vi của Netlify CLI | `TRIEN_KHAI.md` mục 6 đã dặn đóng cửa sổ sau khi dán token |
| PowerShell 5.1 hiện dòng `TỪ CHỐI` của các lệnh bằng chữ đỏ kèm `NativeCommandError` | Là cách PowerShell hiện stderr — đúng nghĩa "bị từ chối" | Không cần làm |
| Đường **tải kho tệp** của lệnh `sao-luu` thật chưa chạy với Netlify Blobs THẬT (cần Personal access token của chủ sản phẩm) | Không xin token của chủ sản phẩm; phép kiểm chạy trên máy chủ Blobs cục bộ đúng giao thức `siteID + token` | **Phần C (Task 10)**: chủ sản phẩm chạy mục 10 có hai biến Netlify một lần, xem thư mục `…-tep` có tệp |
| **(Chủ sản phẩm 22/09: không cần làm)** `init-ban-chinh` khi database có bảng nhưng rỗng: không đòi đủ bộ bảng của schema (bảng thiếu → lỗi lúc chèn → cuộn lại) | Database Turso mới tạo không có bảng nào; đường "có bảng rỗng" không xảy ra trong luồng thật | Không làm |
| **(Chủ sản phẩm 22/09: không cần làm)** `migrate` chỉ tự sao lưu trước khi nâng cấp khi database là FILE cục bộ | TRIEN_KHAI 11.1 bắt chạy `sao-luu` trước; `migrate/run.ts` cũng nhắc | Không làm |
| ~~Bản sao lưu chứa mã phiên đăng nhập còn hiệu lực~~ | ✅ **Chủ sản phẩm quyết 22/09: BỎ.** Làm ở **PR-Z2b2**: sao lưu và khôi phục không chép dòng `demo_sessions` (giữ cấu trúc); tính chất (c) thành "mọi bảng đúng số dòng như nguồn, TRỪ bảng phiên luôn rỗng có chủ đích"; phiên hết hạn sau 30 ngày không dùng (`auth.ts`) | Xong |
| File sao lưu **kiểu tên cũ** (`pisa-NĂM-THÁNG-NGÀY-GIỜPHÚT.sqlite`, không có tiền tố database — chỉ có nếu đã chạy `sao-luu` trước 22/09) **không được tự dọn** | Luật 14 bản chỉ đụng file đúng tiền tố của database đang sao lưu — không đoán được file cũ thuộc database nào | Xoá tay nếu muốn, vô hại. TRIEN_KHAI mục 10 đã ghi |
| `npm run dev` trong cửa sổ có biến Turso: máy chủ ở chế độ bản chính → kho tệp là Netlify Blobs, trên máy không có ngữ cảnh Blobs nên **tải tệp lên sẽ lỗi** | Cố ý: tệp của một database Turso không được nằm rải trên ổ đĩa máy dev. Tập dượt 7a chỉ cần đăng nhập | Nếu cần thử tệp với Turso trên máy: `netlify dev` |
| Giao diện bản máy dev (không `VITE_BAN_CHINH`) + máy chủ chế độ bản chính → màn đăng nhập hiện khối "chưa có dữ liệu mẫu" **thay cho form đăng nhập** (`WelcomePage` suy từ lỗi `/demo/accounts`) | TRIEN_KHAI 7a đặt `VITE_BAN_CHINH='1'` trước `npm run dev` | Cùng việc ở 12.16: suy `serverDown`/`noData` từ `/auth/info` |
| Mỗi lần `sao-luu` có hai biến Netlify là tải lại **toàn bộ** kho tệp (14 bản đầy đủ) | Tệp ≤ 4 MB, trung tâm nhỏ; đơn giản và mỗi bản tự đủ | Theo dõi dung lượng Drive; nếu lớn: chỉ tải tệp mới |
| Khôi phục sang database MỚI → kho tệp theo tên database mới, đang trống (tệp cũ vẫn ở kho cũ) | Chủ sản phẩm chốt 22/09: chép kho tệp là việc tay | TRIEN_KHAI 11.2 bước 5; session code chép kho khi cần |
| ✅ **Đã làm ở PR-S1 (AN-13).** Phép kiểm cũ (Phần A) `db().name` luôn là `""` ở libsql 0.5.29 → nửa điều kiện "không mở database từ xa" không bao giờ đỏ | Nửa còn lại (không còn biến Turso trong môi trường) vẫn kiểm đúng | Kiểm bằng `DB_PATH` thay `db().name` khi quay lại |
| ✅ **Đã làm ở PR-S1 (AN-13).** Phép kiểm của Phần A còn dùng tên máy chủ giả `*.turso.io` (chỉ ra mạng nếu một chốt bị hỏng); phép của Phần B đã đổi sang `.invalid` | Không sửa phép cũ trong PR này | Đổi sang `.invalid` khi quay lại |

### 12.19. PR-S1 (luật máy chủ) thấy nhưng KHÔNG sửa — 22/09/2026

| Việc | Vì sao chưa làm | Làm ở đâu khi quay lại |
|---|---|---|
| Sau S16, một tín hiệu `withdrawn` của em ĐÃ KẾT THÚC học vẫn có thể "sống lại" nếu điểm cũ bị sửa xuống chưa đạt (`raiseSignal` mở lại tín hiệu `withdrawn`) | Ngoài phạm vi; hiếm (sửa điểm của em đã nghỉ) | Luật tín hiệu, cân nhắc chặn cho học viên `finished` |
| `systemClose.ts` có hàm riêng "khoá này có phải lớp thường" (`ratioOfCycle`) song song `isRatioCycle` của `normal/regular.ts` — cố ý để tránh vòng import cycles → systemClose → regular → attempts → cycles; hướng lệch là an toàn (đóng ít hơn) | Gỡ cần tách `isRatioCycle` ra một mô-đun lá | Khi có dịp dọn `normal/regular.ts` |
| Case hệ thống tự đóng lấy hướng xử lý `other` ("Khác") nếu chưa có — người đọc chỉ thấy "Khác" nếu màn không hiện lý do | Chỉ máy chủ ở PR này | **PR-Pa / PR-LT:** hiện `systemCloseLabel` ("Học viên kết thúc khoá" …) cạnh Case đã đóng |
| Tạo Case từ tín hiệu gửi lại KHÔNG kèm `idempotencyKey` sau khi đã thành công → 400 "đã được xử lý" (đúng luật, nhưng người bấm hai lần sẽ thấy lỗi) | Form tạo Case chưa đổi ở PR này | **PR-Pa / PR-Form:** form "Tạo Case" từ tín hiệu luôn gửi `idempotencyKey` |
| RB-6: Case dữ liệu cũ có `topic` ngoài bộ kỹ năng thì GVCN không hoàn thành được (Quản lý vẫn được) | Sau rulebook v3 chưa thấy dòng nào như vậy | Kiểm khi dựng bản chính |
| `scoreDebtCells` nạp dữ liệu mọi lượt còn ô chưa chấm của lớp đang mở (đã lọc trước lượt chấm đủ); chưa đo trên Turso | Đo cần database từ xa | **PR-Z2c Step 5** — đo thời gian mở bảng chi nhánh |
| `routes/index.ts` có một dòng import thứ hai từ `shared/domain/index.ts` (`transferReasonText`) — cố ý để không đụng khối import đầu file PR-O đang sửa | Tránh xung đột PR-O | Gộp vào khối import chung sau khi PR-O merge |

### 12.20. Đánh giá giao diện toàn web 26/09 — kế hoạch chờ ghép

Nguồn: `thiet-ke/DANH_GIA_GIAO_DIEN_2026-09-26.md` (77 trang/panel, 27 đỏ · 39 vàng · 11 xanh). Kế hoạch: `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md`, gồm sáu gói UX-A → UX-F và bảng "File → mục". **Mọi prompt UI mới chạm file nằm trong bảng đó phải ghép các mục tương ứng**, hoặc ghi rõ lý do không ghép. Có một lỗi nhỏ nên cân nhắc làm sớm dù chưa tới đợt: **A1**, ký tự 0x08 trong regex SOS ở `web/src/lib/format.ts:85` làm SOS 1 hiện màu xanh dương ở Tổng quan GV và Công việc. Câu hỏi chặn Q1, Q2, Q4–Q8 nằm cuối file kế hoạch.

### 12.21. Critique toàn web 02/10 — làm cả 5 gói (chủ sản phẩm chốt 02/10)

Nguồn: `/impeccable critique` 02/10 (26/40, tăng từ 24/40). Kế hoạch: `docs/superpowers/plans/2026-10-02-ux-sau-critique.md`, gồm năm gói UX-G → UX-K và bảng "File → mục". UX-G (trạng thái sai/lệch màu, Lịch Test cắt nút, thông báo dùng giờ thật) làm trước. Đã chốt: chữ nội dung tối thiểu 12 px; tách "Để QL biết" khỏi Chờ duyệt. Badge ba kiểu như H1 (Q-H). Còn chờ: Q-B.

### 13.1. Trước mỗi commit

```bash
npm run build:server && npm test && npx tsc -p tsconfig.build.json --noEmit && npx tsc -p tsconfig.web.json --noEmit
```

Cả bốn phải sạch. `npm test` phải **đạt hết** — số phép kiểm chỉ tăng, không giảm.

### 13.2. Bấm thử thật trước khi báo xong

Chủ sản phẩm đọc bằng mắt, không đọc số phép kiểm.

```bash
npm run dev
```

Rồi mở http://localhost:5173, đăng nhập qua tab **"Vào nhanh bằng tài khoản demo"**.

| Xem gì | Mở đâu |
|---|---|
| Hồ sơ dày nhất (5 case, 2 PA hạn khác nhau, Ý thức 2 đợt) | Học viên → **MB-FT 101 → Lê Quang Huy** (`/hoc-vien/3`) |
| Hai case song song cùng một kỹ năng | **CP-FT 110 → Đinh Ngọc Quyên** → Writing Task 2 |
| Bảng chấm | `/nhap-diem/3` |
| Tiến độ công việc và tab Tình hình đơn vị | `/tien-do-cong-viec` |

Kiểm bằng **ba vai**: một GVBM · Quản lý Monbay · Quản trị hệ thống. Lỗi badge chỉ lộ ra ở
vai Quản trị và Quản lý.

### 13.3. Dọn sau khi xong — ràng buộc số 2 của chủ sản phẩm

```bash
pkill -f concurrently
curl -s -o /dev/null -w "5173:%{http_code}\n" --max-time 3 http://localhost:5173
curl -s -o /dev/null -w "4000:%{http_code}\n" --max-time 3 http://localhost:4000
```

Cả hai phải **không** trả về gì. Nếu đã gỡ Playwright tạm thì `git checkout -- package.json
package-lock.json`.

### 13.4. Báo cáo cho chủ sản phẩm

Nói **cái gì đổi trên màn hình**, bằng tiếng Việt, không tên hàm. Mục nào chưa làm thì ghi
**chưa làm** — đừng ghi hoàn tất khi còn component chưa nối. Kèm ảnh trước/sau cho mỗi màn
đã đổi.

---

## 14. Lịch sử cập nhật file này

| Ngày | Ai | Đổi gì và vì sao |
|---|---|---|
| 02/10/2026 | Claude (session planning, `/impeccable critique`) | Thêm mục 12.21 và kế hoạch `2026-10-02-ux-sau-critique.md` sau critique toàn web (trang, panel, chữ, badge) |
| 30/09/2026 | Claude (session code PR-LT2b, nhánh `pr-lt2b-cuoi-khoa`, Sonnet 5.5) | 30/09 PR-LT2b: Cuối khoá lớp thường — % tổng → dải (< 50 · 50–59 · 60–69 · ≥ 70) + hướng gợi ý; sau chuyển: Case `chuyen_cap` (không phải Case SOS) + PA Bổ trợ miễn phí + Mini Test một lần mỗi em, Báo PH qua TVV (việc của Quản lý), Case Tutor FT; Kết luận kỳ vọng đầu ra BE/ELE; điểm nhập sau khi đã chuyển áp ở lộ trình mới (Q30-4). Bỏ thẻ Quyết định Cuối khoá (Q30-3). |
| 30/09/2026 | Claude (session code PR-LT2a, nhánh `pr-lt2a-giua-khoa`, Sonnet 5.5) | 30/09 PR-LT2a: Giữa khoá tự tạo Case + PA Bổ trợ (FOU chung 2 buổi/tuần), kế hoạch bài giảng qua Quản lý, Báo PH qua TVV, bỏ tín hiệu lớp thường, bỏ nhãn SOS lớp thường, M1b. |
| 29/09/2026 | Claude (session code PR-SOS, nhánh `pr-sos-sos-v4`, Opus 5.5) | 29/09 PR-SOS: SOS v4 — PA quy chế chờ xác nhận, Xác nhận Case → Xác nhận PA, Không cần theo dõi qua Quản lý, Ghi kết quả cuối, bỏ Dự kiến kết thúc, HangCase/HangPA. **Migrate** `server/src/migrate/prSos.ts`: 2 cột `sos_cases.han_xac_nhan`, `case_interventions.moc_quy_che`; gỡ `migratePaQuyChe` của PR-N1. Kế hoạch `docs/superpowers/plans/2026-09-29-pr-sos-sos-v4.md` |
| 29/09/2026 | Claude (session code PR-NHAP, nhánh `pr-nhap-them-hoc-vien`, Opus 5.5) | **PR-NHAP — Thêm học viên** (đặc tả `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §4.2 YC-5.1…5.4 · T8, T9 · H6 · K2-19, K2-20, K2-21, K2-41; kế hoạch `docs/superpowers/plans/2026-09-29-pr-nhap-them-hoc-vien.md`). Panel theo mockup M2: cột Email (bắt buộc khi thêm mới), Thi dự kiến (`dd/mm/yyyy` hoặc `mm/yyyy`), cột Tình trạng + dòng chi tiết; bỏ ô "Định dạng ngày"; bảng dán bắt buộc có dòng tiêu đề, cột nhận theo tên; tuần bắt đầu điền sẵn = tuần khai giảng (planning chốt 29/09), xem trước báo "n MT sẽ là MT lịch sử"; cột "Đã thi tới MT" (0–8) tạo sẵn lượt lịch sử; lộ trình theo lớp; thêm xong panel ở lại với dòng còn lỗi + khối kết quả (số MT lịch sử chưa có điểm, nút Nhập điểm MT lịch sử); đổi tuần bắt đầu ở Thông tin HV báo trước MT nào dời sang tuần nào. Thông tin HV sửa email, ngày sinh, tuần bắt đầu có kiểm ở máy chủ. **Migrate** `server/src/migrate/prNhap.ts`: chỉ thêm 2 cột `students.email`, `learning_cycles.exam_date`, không đổi dữ liệu cũ, không lệnh chạy thử. Gộp sau PR-DUYET #117 và PR-MT #119 |
| 18/09/2026 | Claude + chủ sản phẩm | Tạo file. Soát prompt giai đoạn mới, đối chiếu sổ audit, tái hiện được lỗi badge (28→0) và CASE-01. Chốt: `±` so kỳ vọng · badge đếm bài kỹ năng · CASE-01 thành PR riêng · chia PR theo cách 1 |
| 18/09/2026 | Claude (session code PR1) | Task 2 sai giả định: `SkillCell.required` đã tồn tại và độc lập với `canEdit`/`mine` từ trước — không cần sửa sản phẩm, chỉ thêm phép kiểm khoá hành vi. Ghi chú tại mục Task 2 |
| 18/09/2026 | Claude (session code PR1) | Task 6 lớn hơn nhiều so với mô tả: khảo sát 6 đường phát hiện 4/6 cần dựng mới (quy ước tham số focus, tay bấm mốc hành trình). Thu hẹp về đúng 1 lỗi đã xác định (thông báo sai `entityType` nên chưa từng điều hướng, `web/src/modules/platform/Header.tsx`) + xác nhận Step 1 đã đúng sẵn; 4 đường còn lại chuyển sang backlog mục 12.5 làm PR riêng |
| 18/09/2026 | Claude (session code PR1) | PR1 (Task 1–7) hoàn tất, bấm thử thật bằng cả ba vai — mục 5.2 đã cập nhật bằng chứng cho từng dòng. Chỉ mục "sáu đường vào nhập điểm" còn dở (2/6), đã ghi rõ trong mục 5.2 và 10.5, không tự nhận là xong |
| 18/09/2026 | Claude (session code PR-A) | Task 1 Step 3 sai giả định: `shared/domain/cases.ts:412–427` đã có sẵn nhánh phân loại `behaviour` (bốn mã BTVN/Chuyên cần/Tham gia/Khác dùng CHUNG, không phải mỗi nhóm một bộ riêng như mô tả gốc) và `issuesForTopic()` đã ánh xạ đúng — không cần sửa domain/server. Lỗi CASE-01 nằm ĐÚNG MỘT chỗ: `QuickReport.tsx:80` tự chặn với điều kiện `track === 'academic'`. Đã sửa đúng một dòng đó. Phép kiểm Step 1 cũng cần thêm trường `title` (bắt buộc ở `reportIssue`, thiếu trong bảng mô tả gốc của plan) |
| 18/09/2026 | Chủ sản phẩm (đọc `PISA-PR17-Audit-and-Change-Register.md` gốc) | Trích `vong7/SO_AUDIT_TRICH.md` (mục 8 T01–T19 · MT-01…MT-06 · SCH-01/02 · §13.5 · §13.8 · §13.9 · §13.11) vì ba trong bốn mã nghiệm thu T07/T09/T10/T13 mà `plan.md` §7.4 (cũ) nhắc tới không có định nghĩa ở đâu trong repo — chặn hẳn việc viết tiêu chí nghiệm thu cho PR2. Đối chiếu phát hiện: không mã T nào kiểm bộ chọn tuần → **tách PR2 thành PR2a (bộ chọn tuần, làm ngay) và PR2b (Kế hoạch Test + quyền lịch, chờ PR2a merge)**; `plan.md` §7.1 cũ chép thiếu năm điều so với sổ §13.8 gốc (múi giờ, popover đổi tháng/năm, ưu tiên ngữ cảnh URL, cấm fallback phần tử đầu mảng tuần, giới hạn tương lai áp tại lúc lưu); ghi chú R18-09 xác nhận Normal không có luồng hủy Test, thay hẳn mô tả cũ ở MT-05/T12/brief 10.6. Mục 7 đã viết lại theo PR2a/PR2b |
| 19/09/2026 | Claude (session code PR2a) | PR2a hoàn tất. Review bằng subagent trước khi mở PR phát hiện `MeetingPage.tsx` (không nằm trong danh sách file PR2a sửa, nhưng tự gọi `usePeriodWindow()` riêng) vẫn còn đúng kiểu lỗi "fallback `array[0]`" sổ §13.8 cấm — bị che bởi việc route `/ref/period-window` luôn `ensurePeriod(demoToday())` trước nên chưa lộ ra khi bấm thử các màn khác. Đã sửa và bấm thử lại. **Quyết định:** không thêm hạ tầng test HTTP (kiểu supertest) chỉ để kiểm route `POST /ref/periods/resolve` mới — không route nào khác trong `server/src/tests/run.ts` có test tầng HTTP, toàn bộ file kiểm ở tầng service; route mới chỉ bọc `isIsoDate()` (đã có nơi khác dùng) quanh `ensurePeriod()` (đã có phép kiểm §13.8 riêng). Thêm test HTTP cho một route là phá vỡ tính nhất quán của cả file kiểm thử |
| 19/09/2026 | Chủ sản phẩm + Claude (session thiết kế) | Chủ sản phẩm xem màn hình thật và chỉ ra hai lỗi giao diện: (1) khung case ở hồ sơ học viên là **hai khối lồng nhau hiển thị cùng một case** — bấm "Lịch sử và kết thúc phương án" thì `SkillBoard.tsx:319` nhúng nguyên `CasePanel.tsx` vào dưới; (2) form `+ Case` nhóm Ý thức **hỏi cùng một câu hai lần** ("Về việc gì" và "Phân loại vấn đề" đều ra BTVN/Chuyên cần/Tham gia/Khác). Truy nguyên: lỗi (2) do chính PR-A tạo ra khi vá CASE-01 bằng cách cho bốn nhóm dùng chung bộ phân loại mà bộ đó đúng là bốn nhóm ấy — trong khi sổ CASE-01 đã cấm từ đầu *"không cần dropdown nguyên nhân thứ hai dư thừa"*. Cả hai lỗi chỉ lộ khi **chạy thật**; đọc code và bộ kiểm thử đều thấy đúng. Thêm yêu cầu mới: bỏ ngày/hạn khỏi case Ý thức, và tab **"Đã xong từ trước"** để nhập bù case cũ. Viết thành **mục 10 (PR-C)** và **mục 11 (PR-D)**; ba mục cuối dời số 10→12, 11→13, 12→14 cùng mọi tham chiếu nội dòng. AUTH-01, CASE-05, CASE-06 ra khỏi backlog vào hai mục mới |
| 19/09/2026 (đêm) | Claude (session code PR2b) | PR2b lớn hơn mô tả gốc — khảo sát cho thấy "sửa lượt đã có + preview" không tồn tại (panel cũ chỉ tạo mới qua `bulkPlan`/`createAttempt`, chọn lại một ô đã có luôn báo lỗi trùng), phải dựng luồng sửa thật, không phải sửa nhỏ. Thu hẹp: làm đủ quyền lịch SCH-01/SCH-02 ở tầng máy chủ (việc nặng nhất), đổi tên panel + lọc FT (MT-01), thêm preview tuần cũ→mới vào modal sửa lịch **ở màn Lộ trình** (không phải trong chính panel Kế hoạch Test), và viết phép kiểm khoá cả bốn mã T07/T09/T10/T13 — hoá ra T09/T10/T13 logic nền đã đúng sẵn từ trước, chỉ thiếu phép kiểm gắn mã. **Bấm thử tay phát hiện thêm một lỗ hổng quan trọng không thấy được khi chỉ đọc code**: quyền `schedule.move` mở đúng ở máy chủ nhưng KHÔNG có nút nào trên giao diện để GVCN/GVBM lớp Normal thật sự dùng nó — `MockDetailPage.tsx` (nơi duy nhất có nút "Đổi tuần") tự chuyển hướng mọi lượt Normal sang `RegularSheetPage.tsx`, nơi không có nút dời lịch nào. Bốn việc chưa làm (hai hàng RLW/Speaking, sửa lịch ngay trong panel Kế hoạch Test, "đợt hoàn tất thì chỉ đọc", và nút dời lịch cho màn Normal) chuyển sang backlog mục 12.6, không tự nhận là xong. 342/342 test đạt. **Đã merge vào `main` qua PR #26** |
| 19/09/2026 (đêm) | Claude (session code PR-C) | PR-C Task 1–4 hoàn tất theo kế hoạch, có phép kiểm cho từng bước (347 phép kiểm xanh, hai lệnh `tsc` sạch). Ba việc lệch câu chữ gốc, đều ghi tại chỗ trong mục 10: (1) Task 4 Step 1 dùng `P.subjectTeacher` thay vì `P.lrTeacher` — trong bộ demo, người dạy Listening của MB-FT 101 lại chính là GVCN của lớp đó, dùng người đó để kiểm "sai môn bị chặn" sẽ luôn PASS sai lý do; (2) Task 3 Step 2 bỏ bước gọi `completeIntervention` riêng — `recordIntervention` đã tự đủ trong một lần gọi, gọi thêm chỉ sinh một dòng hành trình trùng lặp; (3) Task 3 Step 4 CHƯA nối dây ô "Điểm chi tiết theo kỹ năng" (tuỳ chọn) — máy chủ đã sẵn sàng, chỉ chờ PR-D quyết định hình dạng cuối của `MetricsField` để tránh làm hai lần, ghi vào backlog mục 12.2. Bấm thử tay một lượt bằng tài khoản Quản trị hệ thống qua trình duyệt thật (cổng tách riêng 4091/5191, seed lại sau khi xong): mở modal `+ Case` ở lớp MB-FT 101, chuyển tab "Đã xong từ trước", điền đủ (Reading, phân loại "Quản lý thời gian", 01/07→20/07/2026, một dòng "đã làm gì", kết quả "Có tiến bộ", ghi chú), bấm "Ghi lại case đã xong" — ra toast "Đã ghi lại case đã xong", mở lại hồ sơ học viên thấy đúng nhãn **"nhập bù · Đỗ Vũ Tuấn Phong ghi ngày 18/09/2026"** trên thẻ case, đúng ngày mở 01/07/2026 (không phải hôm nay), có nhãn "case song song", dòng phương án hiện đủ người làm và khoảng ngày. **Chưa làm, ghi thẳng thay vì giấu:** mới bấm thử được đúng MỘT vai (Quản trị hệ thống) trên đúng MỘT kịch bản (case học thuật). Ba vai còn lại của mục 10.6 (GVBM Listening · GVBM Reading · GVCN) và nhánh Ý thức của tab nhập bù, cùng ba màn PR2b/PR-C khác (Kế hoạch Test, form case thường, khung case PR-D) **chưa bấm thử tay** — chỉ có bằng chứng qua bộ kiểm thử tự động. Đây là việc còn lại trước khi PR-C sẵn sàng merge thật |
| 19/09/2026 (đêm, tiếp) | Claude (session code PR-C) | Mở PR #27 (nhánh `worktree-pr-c-form-case-gon` → `main`), chưa merge. Dựng một subagent đọc toàn bộ diff review độc lập trước khi mở PR — không có lỗi Critical, nhưng tìm ra ba lỗi Important đều thuộc "tầng trung thực" của tab nhập bù: (1) máy chủ **không** chặn ghi chú kết luận dưới 10 ký tự dù giao diện có chặn — gọi thẳng API là bỏ qua được lý do bắt buộc phải ghi, đúng chỗ tính năng sinh ra để chặn; (2) và (3) hai kiểm dữ liệu (mô tả "Khác" ≥30 ký tự, ngày một dòng "đã làm gì" không đảo ngược) chỉ có ở máy chủ, chưa có ở giao diện — người dùng thấy lỗi chung chung thay vì lỗi rõ ràng tại chỗ. Đã vá cả ba, thêm một phép kiểm cho lỗi (1). Sau vá: 348 phép kiểm xanh, hai lệnh `tsc` sạch. Ghi kết quả review làm một bình luận trên PR #27. Cũng mở PR #28 riêng (nhánh `worktree-docs-ban-giao-pr-c`) chỉ cập nhật `BAN_GIAO.md` — không gộp vào PR-C để giữ đúng phạm vi |
| 19/09/2026 (đêm, hợp nhất) | Claude (session code PR-C) | `main` đã tiến lên (PR2b merge, #26) sau khi PR-C branch từ `f1e3591` — GitHub báo PR #27 có xung đột. Hợp nhất `origin/main` vào nhánh PR-C, giải xung đột ở bốn file (`plan.md`, `server/src/permissions.ts`, `server/src/seed/data.ts`, `server/src/tests/run.ts`) — toàn bộ là cộng dồn (cả hai nhánh cùng thêm quyền/nhãn/phép kiểm mới ở cuối danh sách, không nhánh nào sửa đè lên dòng của nhánh kia), không có xung đột nghiệp vụ thật. Giữ cả `schedule.move` (PR2b) lẫn `sos.report`/`sos.edit` (PR-C) trong `ROLE_PERMISSIONS`, giữ cả hai nhánh `explain()`, nối các phép kiểm SCH-01/T09/T13 (PR2b) vào sau các phép kiểm CASE-01/AUTH-01/nhập bù (PR-C) |
| 20/09/2026 | Claude (session thiết kế) | Đọc `thiet-ke/PISA-Rulebook-2026-09-19.md` v1.1 và `thiet-ke/PISA-Design-Plan-after-PR28.md` v1.2, brainstorm bổ sung rồi viết thành việc làm được. Thêm **mục 15–19** (PR-E nền giao diện · PR-F hợp đồng số liệu · PR-G dấu '-' và chốt cuối Chủ nhật · PR-I hồ sơ Test gọn · PR-H biên tập), **mục 20** (kho ý tưởng thiết kế DS01–DS18 + ba ý tưởng đã loại), 13 dòng vào mục 3 và sáu dòng vào lộ trình mục 4. Đặt số mục mới ở **cuối file** thay vì chen vào giữa, để khỏi đánh số lại mục 12/13/14 và mọi tham chiếu nội dòng đang trỏ tới chúng. Tạo thư mục `thiet-ke/` bốn file: hệ giao diện, hợp đồng số liệu, từ điển + bộ chữ, chín điểm luật chưa chốt. **Chưa sửa một dòng mã sản phẩm nào.** Bản đầu chia năm PR thành nhiều nhánh song song; chủ sản phẩm đi vắng dài ngày nên **đổi sang một nhánh năm chặng** (mục 0.4 viết lại), thêm **mục 0.5** (năm file PR-D đang giữ) và **mục 21** (thứ tự merge + cách gỡ bốn loại xung đột, viết cho người không đọc code). Bốn chỗ quyết định đáng ghi lại: (1) chia chặng theo **file bị khoá**, không theo chủ đề — nhờ vậy ba chặng đầu chạy được ngay mà không chờ PR-D; (2) **PR-D merge trước, batch merge sau**, vì PR-D gỡ và xếp lại còn batch thêm lên trên — ngược thứ tự là biến việc của máy thành việc của người; (3) hàm chốt dấu '-' viết thành **hàm thuần theo tuần lịch của bài**, không theo thời điểm chạy, nên gọi ở đường đọc như `sweepExpiredMoves()` đã đủ đáp ứng "kể cả không ai mở web", không cần dựng cron; (4) bốn lỗi lặp ở nhiều màn (hạn không rõ loại, badge đạt khi chưa đủ điểm, % không mẫu số, tuần rớt hàng) đóng **ở component** để `tsc` chặn, không đóng bằng kỷ luật review |
| 20/09/2026 | Claude (session batch, chặng 0 — PR-D) | **Không có nhánh PR-D nào trên `origin`** (nhánh cục bộ `claude/pr-d-implementation-fe6460` không có commit nào, chỉ đứng ở merge PR #28), nên theo mục 21.3 cách B, session batch làm luôn PR-D thành **chặng 0**, trên MỘT nhánh `worktree-batch-thiet-ke-sau-pr28`; mục 0.5 và bước hợp nhất PR-D ở mục 21.2 không còn áp dụng. Kế hoạch mục 11 sai/thiếu ở ba chỗ, đã sửa tại chỗ: (1) Step 7 nói "chỉ thêm nhánh Ý thức" nhưng máy chủ `closeCaseOutcome` bắt MỌI case chọn mức tiến bộ nên giao diện một mình không bỏ được — phải chạm máy chủ (Ý thức lưu trống); (2) Step 5 chỉ mô tả kết thúc phương án bằng một ngày, trong khi máy chủ chỉ cho kết thúc suông khi kết quả tốt — thiếu đường cho kết quả chưa tốt, đã thêm lối sang hộp thoại đầy đủ để không mất khả năng khi khối nhúng bị gỡ; (3) số dòng `SkillBoard.tsx:319/323`, `CasePanel.tsx:256/265` trong kế hoạch đã lệch so với file thật (PR-C đã đẩy các dòng đi). Cũng đính chính hai số trong mục 1.3: bộ kiểm thử đang là **360** phép kiểm trước chặng 0 (không phải 319), và **không có `npm run check`** trong `package.json` dù cả brief lẫn mục 13.1 nhắc — đã thêm script `check` chạy đúng chuỗi bốn lệnh ở 13.1. Thêm 7 phép kiểm PR-D (367/367). Bấm thử bằng trình duyệt thật: Quản trị, GVCN Trần Ngọc Hà, GVBM Phạm Thu Trang (Speaking), Quản lý Nguyễn Khánh Vy trên hồ sơ Lê Quang Huy; mở link sâu `/hoc-thuat/case/1`; không lỗi console. **Chưa bấm thử:** hồ sơ Đinh Ngọc Quyên (hai case song song cùng kỹ năng), khổ 375px, và ảnh chụp màn hình (công cụ chụp ảnh hết thời gian chờ — đã kiểm bằng cấu trúc trang và chữ trên màn, không phải bằng mắt) |
| 20/09/2026 | Claude (session batch, chặng 1 — PR-E) | Kế hoạch mục 15 sai/thiếu ở bốn chỗ, đã sửa tại chỗ: (1) **thiếu `shared/domain/display.ts`** — kế hoạch đặt luật `<TyLe>`/`<KetQuaDot>` "ở tầng thuần" trong `run.ts` nhưng harness chỉ import được `shared/`, không dựng được React; nên luật phải ở một module thuần của `shared/`, component chỉ vẽ. (2) Step 6 nói bộ chọn tuần "rớt ba hàng vì thiếu `min-width:0`", đúng, nhưng còn một nguyên nhân thứ hai không có trong kế hoạch: `flex-wrap` bọc CẢ ba nút cùng trường, cộng bề rộng cố định `w-52` của từng nơi gọi — nên bỏ hẳn prop `className` thay vì chỉ thêm `min-width:0`. (3) Step 7 nói "bỏ dropdown hàng chục tuần" nhưng popover hiện có đã là lịch tháng rồi; việc thật sự sai là nó không đi qua portal nên bị ngăn kéo/modal cắt, và `Esc` đóng luôn cả ngăn kéo. (4) Step 8 chỉ nói "sửa CSS panel chứa" nhưng quét ra hai lỗi hành vi: `<label>` bọc nhiều nút chuyển cú bấm chữ sang nút "Tuần trước", và `MockPlanPanel` ép bộ chọn vào nửa panel. Thêm 16 phép kiểm PR-E (383 tổng). Bấm thử trình duyệt thật: trang thử `/dev/thanh-phan` (Quản lý), bảng chấm `/nhap-diem/3` (Quản lý và GVBM Speaking), bộ chọn trong ngăn kéo/hộp thoại/375px, panel Lộ trình. **Chưa làm/chưa thấy:** dạng "quá hạn" trên dữ liệu thật (demo không có), ảnh chụp và thang xám, GVCN ở chặng này, và chưa nối `<KetQuaDot>`/`<TyLe>` vào màn thật (mục 12.7) |
| 20/09/2026 | Claude (session batch, chặng 2 — PR-F) | Kế hoạch mục 16 sai/thiếu ở sáu chỗ, đã sửa tại chỗ: (1) **thiếu hai lớp cho F03** — kế hoạch chỉ nói "hiện trạng theo nơi đang chăm sóc, lịch sử theo đơn vị tại thời điểm hỗ trợ" mà không nói dữ liệu ở đâu; nó nằm ở `enrollments.started_at/ended_at` (đã có sẵn), và phải thêm một nhóm "chưa xác định nguồn" cho phương án không có lần ghi danh bao phủ. (2) **F05 không chỉ là bỏ một hàng:** `undetermined` nằm ở CẢ bảng loại phương án LẪN bảng phân loại vấn đề, và bỏ nó đi thì mất chỗ báo có phương án chưa đánh giá — nên phải thêm liên kết "Cần bổ sung đánh giá" và hai route danh sách. (3) Step 6 nói "trả đúng tập ID" nhưng bỏ sót một lỗi cùng họ có sẵn trong `issueScopeOf`: chi nhánh ngoài quyền cho ra `[]` và `[]` bị hiểu thành "không lọc" — tức lộ toàn bộ học viên. (4) Step 7 nói "bốn ô số" ở Tổng quan nhưng **Tổng quan hiện không có ô số nào** (mã ghi rõ dải thẻ số đã bị bỏ ở bản trước), nên bốn ô phải dựng mới, và chỉ bốn chỉ số có hàm tập ID được dùng. (5) Kiểu `donVi` của đặc tả thiếu `nghia-vu`. (6) **Đối soát F10 (Step 8) — kết quả:** Tổng quan 29 HV, Thực trạng 28 HV (bộ dữ liệu của phép kiểm, sau khi các phép kiểm trước đó đã thêm và chuyển học viên; ở bộ demo mới nạp thì cả hai nơi cùng 20 HV / 33 case — số case của phép kiểm không được ghi lại). Chênh một em (Vũ Thu Uyên, id 39) đã kết thúc khoá mà case Reading còn `in_progress`: Tổng quan đếm theo case, Thực trạng đếm theo nơi đang học — **hai định nghĩa đều đúng, khác nhau**, nên đã đổi nhãn cho khác nhau thay vì ép một bên thắng. Còn một nguyên nhân thứ hai ở tập case (em chuyển FT→Normal, case `writing1`). Phép kiểm F10 khoá đúng hai điều: Thực trạng ⊂ Tổng quan, và mọi chênh lệch đều thuộc hai nguyên nhân đã biết — chênh lệch nào khác là lỗi mới. **Kiểm ngược (mutation):** dựng lại đồng thời bốn lỗi F01/F02/F03/F05 thì đúng bốn phép kiểm gãy, khôi phục thì xanh. Thêm 10 phép kiểm PR-F (393 tổng). Bấm thử trình duyệt thật: bốn ô ở Tổng quan (Quản trị và Quản lý Monbay), số ô = tiêu đề panel = số dòng ở cả bốn; 403/404/501 qua HTTP; bảng hiệu quả mới và liên kết "Cần bổ sung đánh giá" ở Writing 2; GVBM không thấy ô số. **Chưa làm/chưa thấy:** mục 12.8 (bốn chỉ số chưa có hàm, số trần còn lại, nhóm chưa xác định nguồn chưa hiện), bảng phân tích của hồ sơ LỚP (chỉ kiểm bằng `tsc`), ảnh chụp, khổ 375px của panel `<SoLieu>` |
| 20/09/2026 | Claude (session batch, chặng 3 — PR-G) | Kế hoạch mục 17 sai/thiếu ở năm chỗ, đã sửa tại chỗ: (1) **không nói dấu `-` lưu ở đâu** — cần năm cột mới trên `assessment_scores` và một bước migration (chỉ thêm cột, không suy ngược dữ liệu cũ). (2) **Lỗ hổng Step 7 chỉ lộ khi bấm thử ở trình duyệt thật:** phép kiểm máy chủ chạy ở ngày demo 14/09 nên xanh, nhưng chốt luôn xảy ra ngay hết Chủ nhật, lúc đó "tuần kế tiếp" đã bắt đầu và luật vắng cũ chuyển thẳng Quản lý — lần dời đầu của GVCN không bao giờ xảy ra được. Đã sửa hẹp và thêm phép kiểm dời ở ngày 21/09. (3) Step 5 không nói buổi Writing chỉ có W1 `-` thì sao — quyết định: chỉ chốt khi cả W1 và W2 đều `-`. (4) Step 10 nói "lưu từng dòng" nhưng bảng đã lưu từng ô; cái thiếu là chỉ báo trạng thái RIÊNG TỪNG DÒNG — đã thêm. (5) Mục 17.1 gợi ý dùng khuôn `sweepExpiredMoves`; đã dùng, nhưng phải gọi thêm ở `saveScore` để ô đã hết Chủ nhật được nhìn đúng là `absent` ngay lần lưu sau. Thêm 16 phép kiểm PR-G (409 tổng): hàm thuần ở 14 ngày khác nhau, bộ chữ, C01–C10, mười lần chạy một lần chốt, chạy chậm vẫn ra ngày hiệu lực cũ, ô trống không tự vắng, sửa trước chốt, điểm chính thức không bị `-` xoá, W1/W2 (một lần đếm), quyền GVCN/GVBM, sau chốt không mở lại, Normal, C10 xác nhận/từ chối, dời sáng thứ Hai. **Kiểm ngược:** đổi `>` thành `>=` và bỏ điều kiện "đủ mọi ô" thì đúng hai phép kiểm gãy. Bấm thử trình duyệt thật bằng GVCN, GVBM (đổi ngày demo qua 21/09): gõ `-` + Enter, Esc, xoá ô, số vẫn nhập được, hai mốc cạnh nhau, khoá sau chốt, dời lần đầu. **Chưa làm/chưa thấy:** mục 12.9 (nút cho Quản lý xử lý C10, hai câu ngỏ §17.1, Mock Test và 375px chưa bấm, lần dời thứ hai qua đường chốt mới), ảnh chụp |
| 20/09/2026 | Claude (session batch, chặng 4 — PR-I) | Mục 18 sai/thiếu ở bốn chỗ, đã sửa tại chỗ: (1) **Step 8 chẩn đoán sai chỗ** — coi MT-P09 là lỗi hiển thị, nhưng nguyên nhân là máy chủ ghi người nhập cả khi XOÁ điểm; đã sửa ở máy chủ bằng TDD (đỏ trước, xanh sau) và giữ luật "ô dở dang vẫn có người nhập". (2) **MT-P03 nằm ở bộ nhãn dùng chung** `SKILL_PROGRESS_LABEL`, không ở màn Test — Step 5 nói "bỏ nút" nhưng chữ `Chưa xác nhận đã thi` vẫn còn nguyên trên chip trạng thái; đã đổi nhãn (đổi cả các màn khác dùng nó) và thêm phép kiểm. (3) Step 9 đòi lịch sử "điểm" nhưng điểm không có bảng lịch sử riêng — đã dựng `scoreHistory` từ nhật ký, và không có lịch sử "kỳ vọng" vì hệ thống không lưu. (4) Mục 18 nói "sửa năm file PR-D đang giữ" — không còn nghĩa vì PR-D nằm trong nhánh (chặng 0). Việc chưa nói trong kế hoạch: bỏ khối case cũng kéo theo bỏ `sosCase` · `caseSteps` · `caseHistory` · `tasks` khỏi dữ liệu chi tiết lượt. Thêm 5 phép kiểm PR-I (414 tổng). Bấm thử trình duyệt thật (Quản lý, GVBM Speaking, GVCN): nhập W1 bằng bốn ô tại dòng, xoá và nhập lại Reading (hết/lại có "Nhập bởi"), lịch sử điểm hiện đủ, menu `Thêm` và `Chỉnh lịch` đúng quyền, hộp thoại huỷ, nút chính `Xử lý vắng` / `Trả lời đề nghị`, 375px không tràn ngang. **Chưa làm/chưa thấy:** mục 12.10 |
| 20/09/2026 | Claude (session batch, chặng 5 — PR-H) | Mục 19 và bảng chữ có bốn điểm không khớp với mã, đã xử lý tại chỗ: (1) **Phép "grep chuỗi cũ → không còn kết quả" không chạy nguyên văn được với `mức gấp`:** bảng §1 cấm gọi SOS là "mức gấp", nhưng mức gấp của case là khái niệm thật đang dùng ở dữ liệu mẫu, luật hạn và giao diện; đã loại nó khỏi phép quét và ghi vào 12.11 để chốt. (2) **Bảng §2 thiếu dòng `Hoàn thành phương án`** — lẫn với `Hoàn thành case` ở bảng §1; bắt được nhờ đọc §1, không nhờ §2; đã đổi thành `Kết thúc phương án` ở `NEXT_STEP_LABEL` và thẻ case. (3) **`Bỏ qua N dòng lỗi` → `Xem N dòng cần sửa` là đổi hành vi**, không chỉ đổi chữ (bỏ nút bỏ-qua-hàng-loạt). (4) **Badge "Bạn cần chấm / Lớp còn" cần máy chủ nói phạm vi đang đếm** — thêm `workScope` vào tóm tắt từng lớp thay vì để giao diện đoán. Kế hoạch mục 19 Step 1, 4, 6 nói "toàn web/mỗi khối rỗng/chân trang" nhưng không nói cách kiểm; đã làm phần bảng chữ nêu tên và ghi phần còn lại ở 12.11. Thêm 2 phép kiểm PR-H (416 tổng): grep chữ cũ trên mã nguồn (kể cả chú thích) và badge/nhãn phạm vi. **Kiểm ngược:** trước khi sửa, phép grep báo đỏ 36 chỗ. Bấm thử: danh sách học viên ở Quản lý (`Lớp còn N bài chưa nhập điểm`) và GVBM (`Bạn cần chấm: N bài`), tổng quan lớp, ô `Người phụ trách`. **Chưa làm/chưa thấy:** mục 12.11 |
| 20/09/2026 | Claude (session batch, rà soát độc lập) | Kế hoạch mục 17.4 ("sáu phép kiểm") chỉ kiểm hàm đếm thuần và bảng chấm; **không kiểm các đường đọc khác** nên "bài đã báo `-` không còn là bài cần chấm" chỉ đúng ở `pendingSkillsOf` — "việc của tôi" và đếm chi nhánh vẫn tính. Kế hoạch mục 16 Step 6 ("cùng bộ quyền") cũng chưa nói phạm vi theo LỚP của giáo viên khác phạm vi CHI NHÁNH. Đã sửa các lỗi ở 12.12; thêm 4 phép kiểm (420 tổng). |
| 20/09/2026 | Claude (session batch, áp lời chốt C01–C10) | Kế hoạch mục 17 và bảng chín điểm coi C01–C09 là "chưa chốt, không nối dây"; khi chủ sản phẩm chốt, **tài liệu cũ (rule book §17.1, §17.2) vẫn ghi "C03 cần chọn" và "C09 giữ chờ mãi" trong khi mã làm ngược** — đã cập nhật rule book 17.7, `LUAT_CHO_CHOT.md`, `policy.ts` và mục 3. Ba điểm được nối dây (C02, C03, C10) kéo theo đổi dữ liệu mẫu (cửa sổ gộp) và bốn phép kiểm cũ; xem 12.13. Thêm 1 phép kiểm C02 (421 tổng), viết lại phép kiểm C10. |
| **21/09/2026** | Claude (session thiết kế) | **Hai việc, không phải một.** (1) Chủ sản phẩm gửi rule mới **bỏ hẳn mô hình Case Ý thức**, thay bằng Vi phạm và Biện pháp xử lý quan hệ nhiều–nhiều. Đối chiếu từng dòng với mã: phần **Học thuật gần như đã đúng sẵn** (chỉ 4 điểm sửa — lý do đóng SOS, lịch sử điều chỉnh phương án, đổi tên mức, rút gọn cập nhật tuần), phần **Ý thức phải thay mô hình** và **36 file đang dính `behaviour`** phải gỡ. Phát hiện thêm: **hệ thống chưa có bảng nào lưu tệp hoặc liên kết** ở bất kỳ đâu, mà rule mới bắt buộc Thư cảnh cáo và Đình chỉ học phải có — nên dựng một bảng `attachments` dùng chung, đóng luôn CASE-04. Viết `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` (DDL, luật có mã V01–V14/B01–B16/W01–W06, quyền, bảy màn có sơ đồ, tám chỉ số, 18 tình huống demo, 24 mục nghiệm thu), rule book **mục 18**, và bốn điểm chốt mới **Y01–Y04**. **C01 đóng** (nguồn 21/09 §3.2 tự trả lời: hai mốc riêng, đúng như mã đang chạy); **C03 và C04 hết hiệu lực** vì là luật của mô hình đã bỏ — giữ hằng số kèm chú thích, không xoá dấu vết. Còn **C08 là điểm duy nhất chưa chốt**. (2) **Phát hiện một lỗ hổng của chính file này:** mục 4 chỉ chép design plan **mục 18 vào một PR** (PR-I — hồ sơ Test), nên **bảy trang còn lại của mục 18 chưa bao giờ trở thành việc** — Tổng quan, Phân tích, Công việc, Học viên & Lớp, Hồ sơ lớp, Hồ sơ học viên, Kế hoạch Test; kể cả điều hướng bốn khu vực (D01) cũng chưa làm (`App.tsx` vẫn ba mục, không có khu vực Test). Đọc `plan.md` thì tưởng gần xong; đọc design plan thì thấy còn cả một overhaul chưa bắt đầu — **và không ai nối hai tài liệu lại.** Đã viết `thiet-ke/BAN_DO_OVERHAUL.md` làm tầng nối đó: mỗi yêu cầu → tình trạng mã nguồn đã kiểm → PR phụ trách, có bốn nhãn `Đã làm / Một phần / Chưa làm / Hết hiệu lực`. Trong lúc đối chiếu tìm ra **một chốt chặn không ai nói ra:** bốn hàm chỉ số đang trả `501` (`hv-duoi-ky-vong-mon`, `hv-sos-hien-tai`, `dung-han-cap-nhat`, `do-phu-danh-gia`) **chặn** Tổng quan mới và Phân tích theo giáo viên — nếu dựng màn trước, người code sẽ tự viết phép đếm thứ hai, và hai phép đếm sẽ **khớp nhau trên dữ liệu demo** rồi lệch khi dữ liệu thật vào; vì vậy chúng lên PR đầu tiên. Viết **mục 22** — lộ trình hiện hành **8 PR** (`PR-N · PR-J · PR-O · PR-K · PR-P · PR-Q · PR-R · PR-S`) chia bốn chặng, năm mốc chủ sản phẩm kiểm. Bốn xung đột giữa design plan và rule mới được đánh dấu `Hết hiệu lực` thay vì xoá. Ba đặc tả chồng nhau về Hồ sơ lớp (§18.6 ba tab · §22.2 menu trực tiếp · tab Ý thức mới) được hoà giải thành **4 tab + hai nút header**. Hoãn sau deploy: **§6 phân tích theo giáo viên**. **Chưa sửa một dòng mã sản phẩm nào.** |
| 21/09/2026 | Claude (session PR-N, N1–N4) | Mục 22.2 sai/thiếu ở bốn chỗ so với mã thật, đã sửa tại chỗ: (1) **N2 — DATA-01 đã đóng từ PR-F** (chặng 2), nhưng plan 12.1 và `BAN_DO_OVERHAUL.md` §9 vẫn ghi "chưa làm"; nếu làm theo kế hoạch sẽ viết lại một bản sửa đã có. Việc thật còn lại của N2 khác hẳn: danh sách khi bấm số của bảng tuần, và một lỗi luật 4 mà kế hoạch không nhắc — hàng tháng/hàng tổng "HV có case" cộng số học viên theo tuần (demo: 22 so với 20 duy nhất). (2) **N3 — "khớp nhờ may" là nói nhẹ:** chúng đã lệch (79/28/27/6 so với 81/29/28/31 trên dữ liệu kiểm thử), vì bốn nguyên nhân ghi ở N3; và cột "quá hạn cập nhật" của bảng khác ĐƠN VỊ với chỉ số (case so với phương án). (3) **Sổ 11 chỉ số không có chỉ số cho cột "Đề xuất chờ duyệt"** của bảng — nên bảng không thể "gọi hàm chỉ số" cho cột đó; đã thêm `pa-cho-duyet` (sổ nay có 12; phép kiểm PR-F "đúng mười một" đổi thành mười hai và ghi lý do). (4) **"Thiếu phương án" có ba định nghĩa khác nhau** (kế hoạch chỉ nhắc bảng "Việc cần lưu ý"): chỉ số dùng "chưa có hướng xử lý và chưa có tác động nào", bảng phân tích dùng "chưa có phương án chưa huỷ", bảng tuần và bảng theo loại vấn đề dùng hai biến thể nữa; đã gom về `isNoPlanCase` (đổi hành vi có chủ đích, ghi ở N3). Hợp đồng để ngỏ ở bốn hàm N1 — chọn và ghi vào sổ chỉ số, chờ chủ sản phẩm xác nhận nếu muốn khác: chỉ tính em đang học; phạm vi theo nơi em đang học; "đợt hợp lệ" = đã có điểm; nghĩa vụ = phương án × chu kỳ. **Kiểm ngược:** 9 lần cố ý làm hỏng (lấy đợt cũ nhất; mẫu số lẫn em chưa có điểm; coi có dữ liệu là đạt; đếm phương án chờ duyệt là nợ; coi mọi cập nhật là đúng hạn; hàng chi nhánh bỏ case ngoài lớp; cộng học viên theo tuần; bỏ hướng xử lý khỏi định nghĩa thiếu phương án; trả `ids` khi không xin) — cả chín đều làm ít nhất một phép kiểm PR-N gãy, mã đã khôi phục. Thêm 16 phép kiểm (437). Bấm thử trình duyệt thật (Quản trị, dữ liệu dev): hàng tổng của "Việc cần lưu ý" và bốn ô số cùng 22/7/15; thêm một case chưa có phương án qua API thì bảng và ô số **cùng** lên 23/8. **Chưa làm:** N5–N6 (kho tệp, khối Bằng chứng) — commit sau |
| 21/09/2026 | Claude (session PR-N, N5–N6) | Mục 22.2 thiếu/sai ở ba chỗ: (1) **N5 không nói gì về nơi lưu tệp, dung lượng, đuôi được nhận, đường tải** — đã chọn (thư mục `data/uploads` ngoài DB và ngoài git, tên do máy chủ sinh, 10 MB, danh sách đuôi an toàn không có HTML/SVG/tệp chạy được, một đường tải có kiểm quyền) và ghi ở N5. (2) **Hai trong bốn loại chủ (`violation`, `discipline_measure`) chưa có bảng** — kế hoạch nói bảng dùng chung cho cả bốn nhưng chỉ hai loại có nơi chủ; hai loại kia bị từ chối rõ ràng cho tới PR-J (có phép kiểm khoá), PR-J chỉ cần thêm dòng vào bảng quyền chủ. (3) **CASE-04 ghi ở 12.2 là "chưa làm" và nay đã đóng** — đã gạch. Quy ước chọn khi kế hoạch im lặng: quyền thêm/gỡ = quyền sửa case theo luật C02 (không tự nghĩ luật thứ hai). **Kiểm ngược:** 10 lần cố ý làm hỏng (bỏ kiểm quyền xem ở đường tải; bỏ kiểm quyền xem ở danh sách; bỏ kiểm quyền sửa ở đường gỡ; bỏ audit khi gỡ; bỏ audit khi thêm; nhận tệp .html; nhận liên kết `javascript:`; bỏ kiểm quyền sửa khi thêm liên kết; bỏ giới hạn 10 MB; cho tên tệp có `../`) — **chín bị bắt** ngay ở phép kiểm N5. Lần thứ mười (tên tệp có `../`) **không** làm phép kiểm nào gãy: xét lại thì đó là lớp phòng thủ thừa — tệp luôn lưu dưới tên uuid do máy chủ sinh nên `../` không thể đi đâu; nhưng chưa có phép kiểm nào khoá điều đó, nên đã thêm một phép khoá **tính chất an toàn** (tệp luôn ở trong thư mục tải lên, tên hiển thị không còn dấu đường dẫn), không khoá cách làm. Thêm 8 phép kiểm (445). Bấm thử trình duyệt thật (Quản trị, Quản lý Cẩm Phả, GV bộ môn ngoài phạm vi): thêm/gỡ tệp và liên kết ở case và phương án; tải về đúng nội dung; `save_failure` giữ nguyên mô tả đang gõ; GV ngoài phạm vi nhận 403; màn 375px không tràn ngang. **Chưa làm:** nối `BangChung` vào vi phạm/biện pháp (PR-J/K, chưa có bản ghi chủ); quét virus và xem trước tệp ngay trong trang (ngoài đặc tả); tệp đã gỡ khỏi DB do xoá cả case (chưa có đường xoá case nên chưa phát sinh — PR-J phải nhớ khi thêm) |
| 21/09/2026 | Claude (session PR-J, hoàn tất) | **Kế hoạch sai/thiếu — ghi tại chỗ.** (1) **J1** ghi "Năm bảng" nhưng chỉ có bốn (bảng thứ năm là `attachments` của PR-N). (2) Đặc tả không nói vi phạm bị bỏ khỏi biện pháp ghi `violation_history` bằng giá trị `field` nào — dùng `field = 'measure'` (cũ/mới là mã biện pháp), không sửa DDL. (3) Đặc tả không nói biện pháp chứa vi phạm đã hủy thì xác nhận thế nào — chọn: **không xác nhận được** cho tới khi bỏ vi phạm đó ra, để ảnh chụp đếm đúng vi phạm thật. (4) Repo chưa có phép kiểm HTTP — tách `server/src/app.ts` khỏi `index.ts`, đây là các phép kiểm HTTP đầu tiên. (5) **J9 chỉ nói "gỡ 36 file", không nói database ĐANG CÓ dữ liệu cũ:** sáu hàm nâng cấp cũ trong `migrate.ts` đọc `track`/'behaviour' vô điều kiện và hàm `migrateNormalFourSkills` lọc `WHERE track = 'academic'` — gỡ cột là `npm run migrate` vỡ trên mọi database sạch. Đã thêm bảo vệ "đời cũ" cho từng hàm, và một bước chuyển đổi cuối chuỗi: báo cáo → vi phạm, việc trao đổi → biện pháp (`talk_student` → GV meeting với HS, `talk_parent` → Report gia đình), **`warning_letter` cũ → loại Khác, không bịa thành Thư cảnh cáo lần 1/2/3** (bịa là phá chuỗi 1→2→3), phần suy đoán (tín hiệu Ý thức, hạn, đợt) bị bỏ; chạy lặp lại không đổi gì. (6) **§10 nói "giữ như hiện tại" cho tình huống 12 (case học thuật Gấp) nhưng bộ demo cũ chỉ có case mức Gấp ở phía Ý thức** — gỡ Ý thức là mất luôn nó; đã gán mức Gấp cho case Speaking tái diễn của Lê Quang Huy. Tình huống 11 "Bình thường": mức *Bình thường* đã bỏ từ trước, mức mặc định là *Cần chú ý* — ghi ở `DEMO.md`. (7) **§10 dùng ngày 18/09 và 20/09** — sau ngày demo cố định 14/09; bộ dựng nay từ chối mọi dòng sau ngày demo, các mốc dời về 04–12/09. Tên "cô Lan, cô Mai" không có trong bộ demo (mười giáo viên cố định) — dùng giáo viên thật của MB-FT 101. (8) **Huy hiệu số case ở bảng lớp và danh sách "case SOS chưa xong" lệch nhau sẵn từ trước** (danh sách không đòi mức SOS > 0, huy hiệu thì đòi) và bị che bởi các case Ý thức tự sinh; gỡ Ý thức làm nó lộ (CP-FT 110: 2 so với 3). Đã sửa danh sách cho cùng luật với huy hiệu, phép kiểm cũ giữ nguyên. (9) **K8/K9 ở mục 22.5 giả định chưa ai gỡ khỏi `mywork.ts` và giao diện** — phần lớn đã gỡ ở PR-J (buộc phải gỡ mới qua được `typecheck`); đã sửa hai dòng đó. **Làm:** bốn bảng + từ vựng `yThuc.ts` + quyền (`violation.record`, `discipline.manage`, `discipline.stats`; C02 KHÔNG áp) + `violations.ts` + `measures.ts` + cảnh báo 5 ngày (MỘT hàm cho ba nơi) + tám chỉ số + `board.ts` + đường API; gỡ mô hình Case Ý thức ở `shared/domain`, `server/src`, bộ demo và web (`ClassBehaviourBoard.tsx` xoá; `CASE_CATEGORIES` 6 → 5; `CONTACT_KINDS`, `BEHAVIOUR_*`, cột `track` ở `sos_cases`/`case_signals`/`tasks`, bảng `case_reports` — hết; `C03_*`/`C04_*` giữ, ghi "HẾT HIỆU LỰC 21/09/2026" kèm lý do); reseed đủ 18 tình huống; hai tệp demo cũ gộp thành `DEMO.md`; CODE_MAP.md thêm module thứ chín. **Phép kiểm:** 445 (main) → 512. Ở `run.ts` 35 phép cũ về Case Ý thức bị xoá (mô hình không còn), 11 phép đổi/thêm (chuyển sang học thuật, khẳng định sự biến mất, và bốn phép nhập bù học thuật khôi phục sau rà soát); `yThuc.tests.ts` có 91 phép (65 ở commit đầu + 4 nâng cấp database cũ, trong đó một phép chạy đúng lệnh `migrate` trên database mang schema THẬT của thời trước PR-J + 13 soi dữ liệu demo + 6 khẳng định mô hình cũ đã gỡ + 2 về khoá gửi lại + 1 về chuyển lớp); mọi mã V01–V14, B01–B16, W01–W06 đều có phép kiểm. **Kiểm ngược (mutation):** 57 lần cố ý làm hỏng luật (ở mô hình mới) — cả 57 bị bắt (hai lần đầu chỉ bị bắt bởi lỗi biên dịch, đã làm lại bằng biến thể đúng kiểu); bốn lần làm hỏng bộ demo (bỏ tệp của Thư 2, bỏ ngày thêm muộn, dời vi phạm cũ nhất, bỏ dòng "bỏ khỏi biện pháp") — cả bốn bị bắt bởi phần "PR-J · 0". **Rà soát độc lập (subagent, trước khi mở PR):** không có lỗi Critical; năm điểm Important — bốn đã sửa: (1) bước nâng cấp XOÁ tệp bằng chứng của case/phương án cũ → nay chuyển chủ sang biện pháp/vi phạm thay thế và `npm run migrate` tự sao lưu database (`.truoc-pr-j.bak`) trước khi xoá; (2) khoá gửi lại (idempotency) phát lại bản ghi của người khác/học viên khác → nay từ chối; (3) bốn phép kiểm nhập bù học thuật bị xoá nhầm cùng phép về Ý thức → khôi phục; (4) chưa có phép kiểm nâng cấp database thật → thêm, kèm bản chụp schema cũ ở `scripts/fixtures/`. **Điểm thứ (5) — chủ sản phẩm chốt 21/09/2026: vấn đề Ý thức ĐI THEO HỌC VIÊN sang lớp mới.** Cảnh báo 5 ngày tính theo học viên ở MỌI nơi (tab lớp, dòng học viên, Việc cần làm, hồ sơ, chỉ số `hv-can-xu-ly`), và bảng Ý thức của lớp lấy vi phạm chưa xử lý cùng biện pháp đang chuẩn bị của học viên ĐANG HỌC ở lớp, dù ghi ở lớp cũ (`warningsFor` bỏ tham số lớp; `listMeasures` theo lớp đi theo ghi danh hiện tại; phép kiểm W05 chuyển lớp). Chú thích DDL "chuyển lớp không mang lịch sử cũ" ở đặc tả §4.1 nay chỉ còn nghĩa là cột `class_id` ghi lớp lúc ghi. Máy chủ cũng cảnh báo khi khởi động nếu database còn mô hình cũ. Các mục Minor (hiệu năng `board.ts`, ngày xảy ra không kiểm với ngày thực hiện biện pháp, ...) chuyển sang PR-K. **Chưa làm:** giao diện Ý thức (PR-K); bấm thử bằng trình duyệt các màn Ý thức vì chưa có màn. |

| 21/09/2026 (tối) | Claude (session thiết kế) | Rà PR-J (#34): đạt, 512 phép kiểm, không còn `behaviour`, tự vá đúng chỗ `migrate` sẽ vỡ trên DB cũ. Đọc rulebook v3 + hai prototype: v3 **đảo ba luật chốt sáng cùng ngày** (SOS tự tạo case + điền sẵn phương án; Phối hợp SOS; vi phạm sửa/xoá thẳng) — theo v3 vì là nguồn mới nhất. Viết `thiet-ke/SOS_VA_PHOI_HOP_V3.md` (luật S/P/V′, DDL `sos_coordination_actions`, hai bảng điền sẵn, bố cục Theo học sinh/Theo thời gian, 15 mục nghiệm thu, Q-V3-1…9), rule book **mục 19**, cập nhật từ điển/hợp đồng số liệu/luật chờ chốt. Chủ sản phẩm muốn **deploy bản chính đêm nay** (miễn phí, dữ liệu rỗng, phạm vi tối thiểu) → viết **mục 23**: ba PR `PR-T` ∥ `PR-Z` rồi `PR-K`; các PR overhaul còn lại sang sau deploy. Netlify **không dùng được** (không có ổ đĩa lâu dài cho SQLite) → `TRIEN_KHAI.md` hướng dẫn máy ở trung tâm + Tailscale Funnel (miễn phí, https cố định) và phương án Oracle Always Free. Viết lại `PROMPT_SESSION_CODE.md`: bớt skill và bớt kiểm ở giao diện, **giữ nguyên độ chặt** ở luật dữ liệu thật, khởi tạo DB rỗng, sao lưu |
| 21/09/2026 (chiều) | Claude (session thiết kế) | Chủ sản phẩm hỏi lại về Netlify. Đính chính: vấn đề **không phải** "máy chủ phải chạy liên tục" (Netlify Functions chạy theo lượt gọi là đủ) mà là **chỗ cất dữ liệu** (file SQLite + tệp tải lên trên ổ đĩa). Kiểm mã: phiên đăng nhập lưu trong DB (chạy được), không có tác vụ chạy ngầm, tệp nhận qua `memoryStorage` (dễ chuyển), 1.035 chỗ gọi DB đồng bộ ở 51 file + 77 chỗ `tx(...)`, cú pháp riêng SQLite: 55 `lastInsertRowid` · 34 `PRAGMA` · 12 `INSERT OR …` · 5 `GROUP_CONCAT` · 2 `julianday`. Kết luận: **Turso** (không phải Supabase) + Netlify + Blobs. Viết **mục 24** (PR-Z2, có bước thử nhanh Z0 để tìm đường tắt không phải đổi sang async), viết lại `TRIEN_KHAI.md`, thay prompt PR-Z bằng PR-Z2 |
| 21/09/2026 (chiều, tiếp) | Claude (session thiết kế) | Viết kế hoạch chi tiết PR-Z2 cho model thực thi Sonnet/Fable: `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`. Trước khi viết, **thử thật** thay `better-sqlite3` bằng `libsql` (bản tương thích, nối được Turso qua mạng) trên bản sao repo: 493/512 → sửa giao dịch lồng bằng savepoint → 511/512 → sửa `.run(null)` → lỗi còn lại chỉ là dọn thư mục tạm trên Windows. Kết luận: **giữ kiểu gọi đồng bộ**, không đổi 1.035 chỗ. Phát hiện: không có màn/API tạo chi nhánh (chỉ seed tạo) → `CHI_NHANH` + `them-chi-nhanh`. Quyết định thiết kế trong plan: `purgeAttachmentsOf` không xoá tệp trong kho (chạy trong giao dịch, xoá tệp không cuộn lại được); `seed` bị chặn khi trỏ tới Turso (trừ database thử có tên chỉ định); chế độ bản chính bật bằng `BAN_CHINH=1` / `VITE_BAN_CHINH=1` thay vì `NODE_ENV` |
| 21/09/2026 (chiều, sau) | Claude (session thiết kế) | Chủ sản phẩm muốn **deploy thủ công từ thư mục máy**, chia PR-Z2 theo độ nhạy dữ liệu, và luôn được ghi rõ model/effort. Làm: (1) chia plan chi tiết thành **Phần A/B/C = PR-Z2a/b/c**; (2) thêm **Task 6b** — đóng gói nhị phân Linux của `libsql` (build trên Windows, Netlify chạy Linux) và **deploy nháp thật** với database thử ngay cuối Phần A, để có số đo tốc độ Netlify↔Turso thật **trước** khi chạm dữ liệu bản chính; (3) Task 10 đổi sang CLI (`deploy --build` nháp → xin phép → `--prod`), Task 11 yêu cầu người rà khác model người code; (4) **viết lại `TRIEN_KHAI.md` cho người không biết code**: mở PowerShell đúng thư mục, dán lệnh, chỗ nào thay `<...>`, từng nút bấm trên Turso/Netlify, bảng tra biến; (5) `PROMPT_SESSION_CODE.md`: bảng model + effort + phương án B cho mọi PR, ba prompt Z2a/Z2b/Z2c; (6) prompt bàn giao session planning mới: `PROMPT_BAN_GIAO_PLANNING.md` |
| 21/09/2026 (đêm) | Claude (session PR-T) | **PR-T hoàn tất phần máy chủ (T1–T8).** Kế hoạch mục 23.1 sai/thiếu ở các chỗ ghi ngay dưới danh sách T1–T9 (DDL UNIQUE với NULL không chặn trùng; phương án điền sẵn phải theo mức SOS của cả lượt; luật chống nhân đôi mốc; phạm vi P03; S05 không khoá theo ngày; MT5+ không cần duyệt thêm; "Chủ nhật sau +30 ngày"). Viết lại 6 phép kiểm cũ của luật 6.2 (Mock FT nay tự tạo case) và ~25 phép kiểm "đánh dấu không chính xác" (nay xoá thẳng). Bộ phép kiểm 512 → 574. Chưa làm: chữ cứng `Cần chú ý` ở `CaseBoardPage.tsx:451` (giao diện, thuộc PR-K) |
| 21/09/2026 (đêm) | Claude (session PR-T) | **Chủ sản phẩm chốt 2 chỗ mở của PR-T.** (1) MT5+ phương án `Khác` chỉ cần GVBM/Quản lý xác nhận — đúng ý. (2) Phương án A: hạn 3 ngày của S04 thành dòng **Việc cần làm** nhóm `cause` (GVBM phụ trách thấy ngay, Quản lý chỉ khi quá hạn, có tính vào tổng quá hạn). Bộ phép kiểm 579 → 580. PR-K K6 chỉ còn vẽ nhóm này |
| 21/09/2026 (đêm) | Claude (session PR-K) | **PR-K hoàn tất K1–K7, giao diện Ý thức & Phối hợp (nhánh `pr-k-giao-dien-y-thuc-v3`).** Máy chủ của PR-T đã đủ cho gần hết K1–K6 — phần lớn việc là GIAO DIỆN thuần trên các route đã có; chỉ thêm bốn chỗ máy chủ nhỏ, tận dụng hàm đã có: (1) `myCoordinationLines()` ở `phoiHop.ts` + route `GET /y-thuc/my-coordination` — một dòng Việc cần làm mới của GVCN, viết TDD (test trước, 581/581 xanh), cùng khuôn với `myWarningLines` đã có; (2) `caseCardOf()` (`cases.ts`) thêm `sos: sosCaseState(caseId)` + `topic` vào thẻ case và `preset`/`confirmedAt` vào từng phương án — dữ liệu này ĐÃ tính sẵn cho `caseDetail()` nhưng chưa từng chảy tới bảng kỹ năng (`skillSupportBoard`) mà `SkillBoard.tsx` đọc; (3) `profile.ts` thêm `viewer.canRecordViolation`/`canManageDiscipline` (bọc lại `can()`/`canManageDiscipline()` có sẵn) cho tab Ý thức của hồ sơ học viên biết ẩn nút; (4) K6b — `CaseBoardPage.tsx:451` đổi chữ cứng `Cần chú ý` sang đọc `URGENCY_LABEL` (PR-T để lại, chủ sản phẩm nhắc lại giữa chừng). Module mới `web/src/modules/yThuc/` (11 file): `RecordViolationPanel`/`CreateMeasurePanel`/`ConfirmMeasurePanel`/`DeleteViolationConfirm` (ba form + hộp xoá một dòng của §7.2/§7.4/§7.5, giữ nguyên chữ); `ClassYThucCard` (K2 — khối mới chèn vào `ClassOverviewPage` SAU danh sách học viên, KHÔNG phải bốn tab như bản vẽ SOS_VA_PHOI_HOP_V3.md §7.1 vì trang lớp hiện tại là các Card xếp dọc, không có tab bar; K2 tôn trọng đúng cấu trúc thật thay vì dựng lại trang); `PhoiHopSosSection` (dùng chung giữa lớp và học viên); `StudentYThucSection` (K3, tab thứ ba cạnh "Mock Test"/"Hành trình học tập"); `CaseSosControls` (K4, ba việc: `CauseDeterminationPanel` dùng lại `issuesForTopic` của form case cũ, `PresetPlanActions` ba nút Xác nhận/Sửa/Thay, `DismissCaseForm` — gắn vào `SkillBoard.tsx`); `YThucAnalysisView` (K5, Chip thứ ba "Ý thức & Phối hợp" cạnh "Phân tích vấn đề"/"Danh sách case" trong `CaseBoardPage.tsx`); `YThucReminders` (K6, hai dòng nhắc mềm của GVCN ở `OverviewPage.tsx` — dòng thứ ba, "case chờ xác định nguyên nhân" của GVBM, đã tự hiện qua `WorkList.tsx` vì nhóm `cause` đã hoàn chỉnh từ PR-T, không cần code thêm). Mở rộng hai component dùng chung: `BangChung` nhận thêm `ownerType: 'sos_coordination_action'`; `SoLieu` nhận thêm prop `extra` (tham số lọc như `kind`) để chín ô "Biện pháp theo loại" dùng chung một chỉ số mà bấm ra đúng danh sách của từng loại — không có prop này thì DrillDown sẽ trộn cả chín loại vào một danh sách. **Hai lỗi tự bắt được khi bấm thử tay, không lộ ra lúc đọc code:** (1) `ConfirmMeasurePanel` gọi `POST /measures/:id/confirm` bỏ trống `performedBy` khi để trống ô "Người thực hiện" — khác `case_interventions` (có `performerSelf` tự suy ra chính mình), `discipline_measures.confirmMeasure` đòi ID tường minh, máy chủ từ chối "Cần chọn hoặc ghi tên người thực hiện"; sửa bằng gửi `session.user.id` khi bỏ trống. (2) `ClassYThucCard`/`StudentYThucSection` khai `canManage: boolean` trong kiểu dữ liệu nhưng KHÔNG dùng nó ở đâu — ô tick, nút "Tạo biện pháp", nút "Xác nhận" hiện với mọi vai kể cả GVBM; máy chủ vẫn từ chối đúng nhưng giao diện không ẩn nút cho gọn mắt như mọi chỗ khác của app. Sửa: gộp `canManage` (từ máy chủ) và một hàm `canEditViolation(v)` tính ở giao diện (`canManage || v.reportedBy === session.user.id`, đúng V10) để ẩn/hiện ô tick, nút Tạo biện pháp, nút Xác nhận, và từng cặp Sửa/Xoá theo đúng người ghi. **Bấm thử trình duyệt thật cả bốn vai** (Quản trị hệ thống, GVCN Trần Ngọc Hà, GVBM Phạm Thu Trang, Quản lý Nguyễn Khánh Vy) trên dữ liệu seed: ghi vi phạm → tạo biện pháp → "Xác nhận đã làm luôn" → xác nhận đã thực hiện (một mạch, đúng theo §7.4); xoá vi phạm ra đúng câu "Nó sẽ bị gỡ khỏi N biện pháp"; Theo học sinh ↔ Theo thời gian cùng một tập vi phạm; Phối hợp SOS xác nhận/bỏ việc/thêm việc tại lớp; case từ SOS: xác định nguyên nhân → Xác nhận / Sửa / Thay đều đúng, "Không cần theo dõi" đóng case và hiện đúng câu kết luận (tái dùng khối `outcomeNote` có sẵn, không cần UI riêng); góc nhìn Ý thức & Phối hợp của Quản lý — bấm số "Thư cảnh cáo lần 1" ra đúng ba dòng, số theo đúng phạm vi chi nhánh khi đổi vai; GVBM xác nhận: không thấy ô tick/nút Tạo biện pháp/Xác nhận, nhưng vẫn Sửa/Xoá được đúng một dòng do chính mình ghi; khổ 375px hai cột "Vi phạm"/"Xử lý" xếp dọc, không tràn ngang. `npm run check`: 581/581, `tsc` sạch cả hai lệnh. **Chưa làm, ghi thẳng (mục 12.14 có bảng đầy đủ):** đính kèm tệp lúc đang ghi vi phạm (chỉ đính kèm được sau khi lưu, ở panel sửa/xác nhận — vi phạm chưa có `id` lúc soạn form); nút "Ghi vi phạm" ở từng dòng học viên tại tab Học viên/`ClassRoster.tsx` (đặc tả §7.4 có nhắc, ưu tiên thời gian nên chỉ làm nút ở đầu tab Ý thức & Phối hợp của lớp và của hồ sơ học viên — hai trong ba chỗ đặc tả nêu; **gắn vào PR-Q**); nút "Xem vi phạm đó" trong cảnh báo trùng mềm V06 (chỉ còn "Vẫn ghi vi phạm mới"); bảng "Vi phạm theo 5 nhóm × 4 trạng thái" đúng hình ASCII của §7.6 — máy chủ mới có tổng + chưa xử lý theo toàn lớp, chưa có chỉ số cắt theo từng nhóm nên K5 chỉ dùng đúng bốn chỉ số đã đăng ký (**gắn vào PR-P**); bộ lọc "lớp" ở góc nhìn Quản lý (máy chủ `yThucMetric`/`phoiHopMetric` chỉ nhận `branchId`+`from`/`to`, chưa nhận `classId`; **gắn vào PR-P**); chưa bấm thử ảnh hưởng của việc xoá vi phạm lên biện pháp đã thực hiện qua giao diện (đã có phép kiểm máy chủ V14′, chưa lặp lại bằng tay); chưa test kịch bản HS chưa xếp lớp (`activeClassOf` null). |
| 21/09/2026 (đêm, sau) | Claude (session planning) | **Chủ sản phẩm chốt bốn câu treo, cả bốn theo khuyến nghị:** C08 (GV ghi `-` ở Normal → dời tuần sau; việc mới R14), S16 và S17 (tự đóng case kèm lý do hệ thống), R11 (hoàn tất = đủ điểm/dấu `-` + hết Chủ nhật; sau đó chỉ Quản lý sửa). Ghi ở mục 3, 22.8, 22.9, `LUAT_CHO_CHOT.md` §6.4. |
| 22/09/2026 | Claude (session planning) | **Rà soát PR-K (#42) + thử thật kế hoạch Z2 trên mã sau PR-K.** Rà soát: không lỗi nghiêm trọng, 4 lỗi đáng sửa → mục 23.3b PR-K2. Thử thật (bản sao riêng, không commit): 581/581 sau Task 1 + vá `_metadata`; gói hàm như Netlify → sập lúc nạp nếu không sửa `db.ts`; sau sửa chạy được cả tải lên/tải xuống. Sửa kế hoạch Z2 Phần A tại chỗ (nhãn 🆕 22/09): vá `_metadata`, ép kiểu `authToken`, `uploadsDir`, `purgeAttachmentsOf` 4 tham số, `connectLambda` có điều kiện, Node 22, lệnh `npm run thu-goi`, chặn `POST /demo/session` + ẩn `demoAdmin`, lấy token bằng `netlify env:get`. Prompt: PR-K2 mới, PR-Z2a viết lại (Fable 5.1 · High) |
| 22/09/2026 (sau) | Claude (session planning) | **Rà soát PR-K2 (#44), PR-K3 (#46): đạt.** **Rà soát độc lập Opus nhánh PR-Z2a:** không lỗi nghiêm trọng; 603/603; thử 14 kiểu lách `/demo` đều 404; kiểm phép kiểm không xanh giả. Còn phải có trước dữ liệu thật → thêm vào Phần B: Task 6c viết lại cho khớp mã (chốt đã nằm trong `recreateSchema`) + chặn cứng tên bản chính; **Task 6d** migrate vào Turso cần xác nhận, bỏ admin/mật khẩu mặc định; **Task 6e** bản nháp dùng database thử, kho tệp theo database, xoá tệp sau giao dịch ở `deleteMeasure`. Phần C: Task 10 đổi thứ tự (kiểm trên địa chỉ chính thức trước khi báo giáo viên), bật lại bảo vệ bản nháp, kiểm kết nối nguội > 10 phút |
| 22/09/2026 (tối) | Claude (session planning) | **PR-HV lên kế hoạch.** Chủ sản phẩm gửi 2 prototype v3 và yêu cầu làm lại hồ sơ học viên, đổi "biện pháp" → "phương án", bỏ "Hãy". Session planning mở demo thật, chụp màn hiện tại, cho agent đọc mã (bản đồ file, 13+5 chỗ "biện pháp/BP" trên giao diện, 64 chỗ "Hãy"), hỏi gộp 3 câu (cả ba theo khuyến nghị) + chuyển Q7/Q8 từ PR-Q (chủ sản phẩm đồng ý). Viết đặc tả + kế hoạch 11 task (Fable 5.1 · High), cửa 🛑 cho file Z2b. Prototype chép vào `thiet-ke/tham-khao/` |
| 22/09/2026 | Claude (session PR-K3, nhánh `pr-k3-gan-day-theo-hoc-vien`) | **PR-K3 — sáu lỗi/việc nhỏ sau rà soát PR-K2 (#44).** (1) §7.1 "Gần đây" của khu 3: `board.ts` thêm `recentByStudent: Record<number, MeasureDetail[]>` — tối đa 3 biện pháp mới nhất **của từng học viên** (dựng từ `done` đã tải, không thêm truy vấn; `done` đã sắp mới nhất trước nên chỉ cần lấy 3 phần tử đầu gặp mỗi học viên); `history.latest` (3 dòng của CẢ LỚP) giữ nguyên cho chỗ khác đang dùng. `ClassYThucCard.tsx` đọc `recentByStudent[studentId]` thay vì lọc `history.latest`. (2)+(3) Viết lại `rowsForCategory()` trong `ClassYThucCard.tsx`: một học viên chỉ hiện ở một nhóm nếu có vi phạm (chưa xử lý HOẶC nằm trong biện pháp Đang chuẩn bị) thuộc đúng nhóm đó — **bắt thêm một lỗi ngoài đặc tả lúc bấm thử**: code ban đầu (bám sát chữ "0 vi phạm chưa xử lý") vẫn để lọt học viên CÒN vi phạm chưa xử lý ở nhóm khác vào mọi nhóm chỉ vì có bất kỳ biện pháp Đang chuẩn bị nào (tái hiện bằng Nguyễn Minh An/MB-FT 101: 4 vi phạm BTVN+Chuyên cần+Thái độ, biện pháp cũng không có nhóm Kỷ luật, nhưng vẫn hiện ở bộ lọc "Kỷ luật lớp học") — sửa tổng quát theo đúng nguyên tắc "chỉ hiện đúng nhóm có vi phạm liên quan", không chỉ theo đúng câu chữ của việc 2. `allCount` (số nút sub-tab) = `rowsForCategory(null).length`, độc lập bộ lọc đang chọn. (4) Ẩn khung "Vi phạm" rỗng + nút "Tạo biện pháp từ 0 vi phạm đã chọn" khi học viên không còn vi phạm chưa xử lý (chỉ còn biện pháp Đang chuẩn bị); giữ cột "Xử lý". (5) canRecord của `classViolationBoard` **đã đúng sẵn** (dùng `can(p, VIOLATION_RECORD, {classId})`, GVBM trái môn → true qua `hasAssignment(..., 'any')`); chỉ thêm phép kiểm `K3-5` ghi lại hành vi (không sửa mã). (6) `RecordViolationPanel.tsx`: "Chọn học viên." → "Hãy chọn học viên." (khớp mẫu câu "Hãy chọn…" của các form khác). TDD: viết đỏ trước cho K3-1 (`recentByStudent` thiếu → lỗi) và K3-5 (K3-5 đã xanh ngay vì hành vi có sẵn), rồi sửa `board.ts` cho K3-1 xanh. Bộ phép kiểm máy chủ 581 → **583**. Bấm thử trình duyệt thật (GVCN Trần Ngọc Hà, lớp MB-FT 101, seed mới): "Gần đây" đúng theo từng em (Lê Quang Huy và Phạm Bảo Ngọc mỗi em 3 biện pháp riêng, không trộn); tick hết vi phạm của một em rồi tạo biện pháp `talk_short` → em còn "0 vi phạm, 1 BP đang chuẩn bị" chỉ hiện ở "Tất cả" và đúng nhóm (BTVN/Chuyên cần) của biện pháp, số nút sub-tab không đổi; khổ 375px không tràn ngang. `npm run check`: `tsc` sạch cả hai lệnh |
| 22/09/2026 | Claude (session PR-Z2b, nhánh `pr-z2b-an-toan-du-lieu`, Opus 5) | **PR-Z2b — an toàn dữ liệu bản chính (Task 6c → 9 của kế hoạch Z2).** Phép kiểm **605 → 642**. Chốt seed so nguyên tên máy chủ + chặn cứng tên bản chính `pisatracking-…`; `migrate` vào Turso cần xác nhận, bỏ tài khoản/mật khẩu mặc định; bản nháp dùng database thử (biến Turso bản chính chỉ `--context production`, cú pháp đã thử bằng biến vô hại), kho tệp theo database; `init-ban-chinh`, `them-chi-nhanh`, `sao-luu`. **Bất ngờ:** (1) kế hoạch sót bộ đếm mã học viên `student_code_seq` — thiếu thì học viên thứ hai trùng mã (đã tái hiện); (2) `npm run` trên Windows thoát kép tham số khi script bắt đầu bằng `npm` → "Uông Bí" thành "^Uông^ Bí^"; (3) libsql trên Windows không nhả file sau `close()` nếu đã `prepare` → sao lưu ghi bằng `VACUUM INTO`; (4) `@netlify/blobs` có `siteID + token` thì luôn gọi API thật (bỏ qua biến ngữ cảnh). Ba lệnh đã chạy thật: máy dev, file tạm, và qua mạng với database THỬ (sao lưu 2.426 dòng; `init-ban-chinh`/`them-chi-nhanh` từ chối, database giữ nguyên từng byte). Việc thấy mà không sửa: mục 12.17 |
| 22/09/2026 | Claude (session PR-Z2b2, nhánh `pr-z2b2-phien-dang-nhap`, Opus 5) | **PR-Z2b2 — tiếp theo PR-Z2b (#49 đã merge).** Chủ sản phẩm quyết: **BỎ mã đăng nhập khỏi bản sao lưu** — `demo_sessions` (bảng DUY NHẤT chứa mã đăng nhập; không có bảng mã đặt lại mật khẩu) giữ cấu trúc, không chép dòng khi sao lưu và khi khôi phục (kể cả từ bản sao lưu kiểu cũ còn phiên); tính chất (c) thành "mọi bảng đúng số dòng và đúng từng dòng như nguồn, TRỪ bảng phiên đăng nhập luôn rỗng có chủ đích". Session planning quyết: **phiên hết hạn sau 30 ngày không dùng** (`auth.ts`, giờ thật; cột `last_seen_at` có sẵn nên không cần migrate). Phép kiểm **660 → 662**. Kế hoạch Phần C: Task 10 Step 2b (tập dượt khôi phục) thành BẮT BUỘC; người rà Phần C là Fable 5.1 (khác Opus đã code Phần B); PR #50 chỉ là kế hoạch PR-HV, không thay cho PR mã PR-HV. TRIEN_KHAI 7a (Chrome/Edge), 9, 10 (file tên kiểu cũ không tự dọn), 11.2 (sau khôi phục mọi người đăng nhập lại) |
| 22/09/2026 | Claude (session PR-HV, nhánh `pr-hv-ho-so-hoc-vien`, Fable 5.1) | **PR-HV — hồ sơ học viên 3 tab + Ý thức & Phối hợp theo prototype v3; "biện pháp" → "phương án"; bỏ "Hãy".** Phép kiểm **605 → 614** (+9: phép quét chữ D1/D3, `parseHoSoTab`, `ketQuaTestGanNhat`, `quaHan`, `headline.next` có động từ + `overdue`, `demTheoNhomViPham`, `tienDoCase`, `viecTiepPhuongAn`, `attachmentCount`) → gộp `main` (Z2b, Z2b2) → **671**. Hai trường máy chủ **chỉ đọc** thêm: `attachmentCount` trên thẻ case (`caseCardOf`), `headline.next.overdue` + câu bắt đầu bằng động từ (`headlineOf`, thêm ứng viên "Cập nhật PA" chưa quá hạn — trước đây ô ghi "Không có" khi mọi việc đúng hạn, và giao diện đọc cờ `overdue` chưa hề tồn tại). Luật hiển thị thuần ở `shared/domain/hoSoHocVien.ts`. Thành phần mới `HangTab`, `OSoNho`, `DongThoiGian`, `TheSos`, `TheCase`/`KhoiPhuongAn`, `XemPhuongAnPanel`. **Quyết định khi plan im lặng:** (1) `ops/` cũng đóng băng tới Task 9 (`initBanChinh.ts` 2 chỗ "hãy"); (2) kiểm ngược `<`→`<=` không đỏ vì demo không có hạn = hôm nay → tách `quaHan` + phép biên; (3) thứ tự nhóm vi phạm theo hằng thật (Chuyên cần trước BTVN); (4) dấu ✓ PA đã xong xám thay xanh lá (luật `ui.tsx`); (5) màn trộn thêm ngoài bảng: cột `Thiếu phương án` ở `summary.ts`/`WeeklyBoard.tsx`, `no_plan` ở `cases.ts:1590`, ba tiêu đề chuông duyệt PA; (6) `preview_start` chạy từ thư mục chính → dùng `npm run dev` trong worktree; ảnh chụp bằng Playwright (cài tạm, không vào repo). **Không đổi:** `people.ts` nhãn bộ lọc `Case thiếu phương án`, `chu.ts` (CasePanel), tiêu đề mốc Hành trình, chú giải dài (J6). **Chưa làm (đúng phạm vi):** ô số bấm được (PR-R), Q9 Hành trình và hồ sơ lớp 4 tab (PR-Q), toast Hoàn tác và nút Ghi vi phạm ở `ClassRoster` (K2-6 còn lại). Ảnh trước/sau: `thiet-ke/anh/pr-hv/` |
| 22/09/2026 | Claude (session PR-S1, nhánh `pr-s1-luat-may-chu`, Opus 5) | **PR-S1 — luật máy chủ (đợt 1, song song PR-O).** Phép kiểm **672 → 719**. Tín hiệu SOS lớp thường từng môn có hai lối ra **Tạo Case** (đúng môn, đúng khoá, mốc mở mang điểm; Case Writing lớp thường — nửa máy chủ F07) và **Bỏ qua** (một bấm, lý do không bắt buộc, audit; nhãn "Đã bỏ qua"); dòng việc `verify` + `SignalView` mang sẵn `kind/score/total/actions/caseDraft`; chỉ số mới `tin-hieu-qua-han` ("Chờ xác minh quá hạn"). S16/S17: một hàm `cases/systemClose.ts` (hệ thống tự đóng Case, cột `sos_cases.system_close_reason`) — thôi học tự đóng; hoàn tất khoá không cờ giữ Case. S11 cột `attempt_skills.absent_from_no_show`; S12 + §6 ô nợ điểm đi qua hàm bảng chấm (`worklist/scoreDebt.ts`); S13 dòng giải thích; RB-3 lý do chọn nhanh + "Không có lưu ý"; RB-6 GVCN chỉ hoàn thành Case đúng môn; RB-8 lớp thường đối soát sau sửa điểm bằng hàm chung với FT; RB-9 lưu trữ chỉ khi Quản lý bấm (`/students/:id/archive`); AN-13; chữ lớp thường ở `caseHeadline`/`standingLine`; seed 70%. Quyết định Q1–Q13 ghi ở plan PR-S1. **Chuyển cho PR khác:** nút Lưu trữ + lựa chọn "em thôi học" (cờ `dongCaseKhiKetThuc`) → LT; giao diện dòng tín hiệu → Pa; luồng gọi S17 (`closeCasesOnProgrammeSwitch`) → LT; dấu "-" lớp thường → Rc1; nửa giao diện F07 → Form. |
| 23/09/2026 | Claude (session PR-Rc1, nhánh `pr-rc1-cham-diem`, Opus 5.5) | **PR-Rc1 — chấm điểm: Cần chấm, Lịch Test, một lưới chấm chung.** Phép kiểm **779 → 804**. Luật thuần `shared/domain/chamDiem.ts`; máy chủ `server/src/cham/canCham.ts` (`chamSheet` · `canChamList` · `lichTest`) — một lưới cho hai loại lớp, máy chủ trả `mode`; giao diện `web/src/modules/cham/` thay `ScoreSheetPage.tsx` và `RegularSheetPage.tsx` (đã xoá), điện thoại chấm một kỹ năng một lúc. C08 dấu `-` lớp thường nối dây (mục 3, 23/09); RB-5 sửa ô đã có điểm phải ghi lý do (cả hai cửa lưu); R15 chọn đợt khác trên hồ sơ Test; R16 nút nhập điểm mang đợt; DS02 đếm ngược ô `-` (chỉ FT). Tick R13; ghi chú (chưa tick) ở R8, R14. R15, R16, RB-5 không có ô riêng trong file này — nguồn ở `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.4, §1.7. Chưa làm (PR-Rc2): R9–R12, R14 phần lịch, T15. Kế hoạch và nhật ký: `docs/superpowers/plans/2026-09-22-pr-rc1-cham-diem.md` |
| 23/09/2026 | Claude (session PR-Rc2, nhánh `pr-rc2-ke-hoach-test`, Sonnet 5) | **PR-Rc2 — Kế hoạch Test: lưới cả lớp FT, xếp lịch hàng loạt, lớp thường theo lớp, R11.** Phép kiểm **866 → 888**. Luật thuần `shared/domain/keHoachTest.ts` (trạng thái ô nhóm, đợt hoàn tất, tuần đa số, tóm tắt xem trước); máy chủ `server/src/keHoach/keHoachTest.ts` — **chỉ gọi lại** `createAttempt`/`setSkillWeek`/`planRegularTests`, không dựng đường ghi lịch thứ hai; R11 ở file riêng `server/src/fasttrack/hoanTat.ts` (suy mỗi lần đọc, **không migrate** — Q14). **T15** (trùng tuần với đợt lân cận → CHẶN cả hai chiều, không còn chỉ cảnh báo) ở `checkWeekVsNeighbours` (tách từ `checkSkillWeekMove`, kiểm được cả đợt CHƯA tạo). **T9** (`standing.ts` dùng `target_at_attempt` thay vì target hiện tại của lộ trình). Giao diện `web/src/modules/test/keHoach/`: `LuoiFT.tsx` · `HopSuaTuan.tsx` · `NganXepHangLoat.tsx` (5 bước một màn, xem trước, lưu một phần giữ hàng lỗi — R9b) · `BangThuong.tsx` · `HopDoiLichThuong.tsx`; xoá `MockPlanPanel.tsx`; tách `NutLuat` (ⓘ) dùng chung ra `web/src/ui/NutLuat.tsx`. Tick R9, R9b, R10, R11, R12, R14 (phần lịch). Quyết định Q1–Q16 ghi ở kế hoạch PR-Rc2. Kế hoạch và nhật ký: `docs/superpowers/plans/2026-09-23-pr-rc2-ke-hoach-test.md` |
| 23/09/2026 | Claude (session PR-UX1, nhánh `pr-ux1-lich-test`, Opus 5.5) | **PR-UX1 — Lịch Test chấm tại chỗ, bỏ tab Cần chấm.** Phép kiểm **1186 → 1192** (+ 20 tốc độ). Khu Test còn Lịch Test · Kế hoạch Test; `/test/can-cham` và mọi lối cũ (Việc cần làm › Chấm điểm, badge "n bài chờ chấm", `?view=my_scores`, `missing_scores`) về Lịch Test đúng lớp/môn. Máy chủ `lichTest` trả đủ một lời gọi (dải số, Nợ tuần trước `noTuanTruoc`, hàng lớp kèm nhãn + cờ tự mở); `/cham/lich-test` 16 → 26 câu SQL. Web tách lưới dùng chung `cham/LuoiChamLop.tsx`, Lịch Test mở lưới ngay dưới hàng lớp / dòng Nợ. N-1b: kết quả lưới lớp thường tô theo SOS 1/2/3, chưa đủ điểm xám. **Không migrate.** Kế hoạch và nhật ký: `docs/superpowers/plans/2026-09-23-pr-ux1-lich-test.md` |
| 23/09/2026 | Claude (session PR-LT, nhánh `pr-lt-len-lop-chuyen-lop`, Sonnet 5) | **PR-LT — Lên lớp, chuyển lớp: lộ trình tiếp theo, chuyển tiếp cả lớp, chuyển một em, lịch sử lớp, khu Lưu trữ.** Phép kiểm **1026 → 1116+** (mốc B của nhánh; chưa cộng dồn `main` vì chưa rebase/merge). Luật thuần `shared/domain/lenLop.ts` (`luatDoiLop`, bảng Q dùng chung mọi luồng đổi lớp/khoá). Máy chủ mới: `classes/loTrinhTiep.ts`, `classes/luatLoTrinh.ts` (Chuyển lớp một em, mọi chi nhánh — Q3), `classes/lichSuLop.ts`, `classes/luuTru.ts`; `classes/transition.ts` viết lại (Chuyển tiếp cả lớp, mỗi em một hướng, ghi theo lô — Q20). **Hoàn tất S16/S17 nối dây** (PR-S1 để lại "Chuyển cho LT"): nút Lưu trữ/Bỏ lưu trữ (`/students/:id/archive`, `/unarchive`, RB-9), lựa chọn "em thôi học" gọi `closeCasesBySystem`, luồng sang Fast Track thật gọi `closeCasesOnProgrammeSwitch` (S17); badge `systemCloseLabel` hiện ở `CasePanel.tsx` (RB-3 web). Q22 (chủ sản phẩm chốt 23/09): lớp `finished`/HV lưu trữ vào chế độ **chỉ xem** (`classOverview`/`classRoster` ép mọi cờ viewer `false`; khu Lưu trữ `LuuTruPage.tsx`, ⋯ góc phải trang Học viên & Lớp). Bấm thử thật (seed + Playwright kênh Chrome, đẩy demo date để có lớp thường hết khoá) bắt được và sửa ngay hai lỗi hiển thị (nhãn hướng "Lên —" thiếu `programmeCode` theo dòng ở `TransitionPanel.tsx`; badge `systemCloseLabel` thiếu tiền tố "Hệ thống tự đóng ·" ở `CasePanel.tsx`) — chi tiết và ảnh ở Nhật ký kế hoạch riêng. **CÓ migrate:** bảng `lo_trinh_tiep_theo`, cột `enrollments.end_kind`, `classes.finished_at` — chạy `npm run migrate` trên bản chính trước khi deploy mã; PR-Ra cũng có migrate, merge lần lượt rồi chạy lại phép kiểm lặp migrate. Kế hoạch và nhật ký đầy đủ: `docs/superpowers/plans/2026-09-23-pr-lt-len-lop-chuyen-lop.md`. |
| 24/09/2026 | Claude (session PR-UX2, nhánh `pr-ux2-ke-hoach-test`, Sonnet 5) | **PR-UX2 — Kế hoạch Test: L · R · W · S riêng, tìm lớp, lớp thường như FT.** Phép kiểm **1186 → 1201** (+15), không migrate. Bỏ cặp "RLW / S": mỗi đợt xếp riêng từng kỹ năng (W = chấm cả W1 và W2), ô cùng tuần gộp chip `L R W S · W3 SEP`, đợt xong gọn `Xong ✓`. Máy chủ `keHoach/keHoachTest.ts` viết lại theo từng kỹ năng — vẫn **chỉ gọi lại** `createAttempt`/`setSkillWeek`/`setSkillSkip`/`planRegularTests`; `checkWeekVsNeighbours` nêu kỹ năng của đợt lân cận ("Trùng tuần W3 SEP với MT3 (S)"); `planRegularTests` nhận `studentIds`/`kinds`. Lớp thường xếp theo học viên × kỹ năng, ghi tuần trong khoá `W5/10`. Xếp lịch hàng loạt trên `KhungPanel` 720px, **lưu theo em** (em có bài chặn thì cả em không lưu) và **sửa lỗi R9b** (tick không còn bị lưới tải lại ghi đè thành cả lớp). Hộp kỹ năng neo cạnh chip, bộ chọn tuần gọn `‹ W3 SEP ›`, khởi tạo bằng tuần hiện có (Bổ sung sau rà #87). Xoá `LuoiFT`/`BangThuong`/`HopDoiLichThuong`/`HopSuaTuan` của Kế hoạch Test. Kế hoạch và nhật ký: `docs/superpowers/plans/2026-09-23-pr-ux2-ke-hoach-test.md` |
| 24/09/2026 | Claude (session PR-UX4, nhánh `pr-ux4-phan-tich-v2`, Sonnet 5) | **PR-UX4 — Phân tích v2** (đặc tả overhaul 23/09 §4 + N-1b, mockup 16 v2). Tab Phân tích còn 5 góc nhìn: Tổng hợp Test + SOS (mặc định; hàng lớn/nhỏ, màu Đạt/SOS 1–3, chú giải) · **Tổng hợp vấn đề HV** (đếm HV theo loại lỗi, gộp loại lỗi chung, "so với lần Test trước") · **Hiệu quả PA** ("Ít dữ liệu" < 5, "Nên dùng", Thời gian trung bình) · Ý thức & Phối hợp (2 danh sách: Học viên cần chú ý, Lớp nhiều vi phạm; Excel 3 sheet) · Danh sách Case (thêm bộ lọc "Học viên cần chú ý"). Việc của "Chưa ai nhận" thành **2 dòng Cần xử lý** (sổ 28 → 30 chỉ số, `CAN_XU_LY_TOI_DA` 8 → 10). Không migrate. Xoá `vanDe.ts`, `VanDeHocVien.tsx`, `IssueAnalysis.tsx`, `YThucAnalysisView.tsx` và route `/issue-board*` phạm vi chi nhánh. Chi tiết: `docs/superpowers/plans/2026-09-23-pr-ux4-phan-tich-v2.md` (Nhật ký thực thi). |
| 24/09/2026 | Claude (session PR-XOA, nhánh `pr-xoa-du-lieu`, Opus 5.5) | **PR-XOA — Xoá học viên, xoá tài khoản, lưu trữ tự động (chỉ Quản trị hệ thống).** Phép kiểm **1325 → 1365** (+ 20 tốc độ). Xoá học viên: một giao dịch, 36 câu gom theo tập (không đổi theo số lượt), tệp Blobs xoá sau khi chốt, phép kiểm "không sót" dựng từ `PRAGMA foreign_key_list` (29 bảng / 52 cạnh). Xoá tài khoản: xoá hẳn nếu chưa có dấu vết, xoá mềm (khoá, ẩn, tên "(đã xoá)", email giải phóng) nếu có; chặn tự xoá / QT cuối / GVCN lớp đang học. HV thôi học tự vào Lưu trữ. **CÓ MIGRATE** (`users.deleted_at` + đưa em đã thôi học vào Lưu trữ, một lần). Lệnh chỉ đọc `npm run kiem-sau-xoa`. Kịch bản dọn dữ liệu thử bản chính (chỉ viết): Task 8 của `docs/superpowers/plans/2026-09-24-pr-xoa-du-lieu.md` |
| 26/09/2026 | Claude (session planning, Opus 5.5 · skill impeccable critique) | Đánh giá giao diện toàn web: 4 người chấm độc lập + máy dò tự động, 309 ảnh thật, 24/40. Thêm `thiet-ke/DANH_GIA_GIAO_DIEN_2026-09-26.md`, kế hoạch `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md`, dòng quyết định màu SOS và thứ tự sửa ở mục 3, việc chờ ghép ở mục 12.20; sửa HE_GIAO_DIEN §2 và §5 (SOS tạm thời theo màu mức). `.gitignore` thêm `.impeccable/`. Chưa sửa mã sản phẩm |
| 27/09/2026 | Claude (session planning, Opus 5.5 · skill brainstorming + impeccable shape + taste redesign) | **Kế hoạch nâng cấp sau deploy.** Chép nguồn chủ sản phẩm vào `thiet-ke/nguon-27-09/` (yêu cầu chỉnh sửa, feedback đội ngũ, quy định lớp thường P. Học thuật) và 5 ảnh vào `thiet-ke/anh/nguon-27-09/`. Thêm `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` (chẩn đoán 8 vấn đề gốc, xung đột J1–J15), đặc tả `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` (ma trận YC-1…YC-16, luật mới lớp/MT/SOS v4/Ý thức v4/hộp Chờ duyệt, lớp thường theo quy định, UX/UI, 6 đợt PR) và mockup `thiet-ke/mockup/19-nang-cap-27-09.html` (M1–M12). Chủ sản phẩm chốt 4 câu Q27-1…4 (thang Ý thức bắt buộc theo thứ tự; chỉ MT lịch sử gần nhất tạo Case; một hộp Chờ duyệt có phân loại; RF mọi MT = target). Đặc tả **thay** S04–S06, Q-V3-1, Q-V3-4 của SOS v3 và Y01, B05, W02 của Ý thức. Người rà chéo từ nay luôn Opus 5.5. Chưa sửa mã sản phẩm |
| 28/09/2026 | Claude (session code, Opus 5.5) | **PR-N1** (hai PR: #108 Task 0–5b, PR sau Task 6–13): tên **Pisa Tracking**; hạn ghi kết quả PA **hết Thứ Hai** (+migrate dời hạn CN → T2, lệnh chỉ đọc `chay-thu:n1`); báo lỗi form rõ (lý do dưới ô, chân "n ô cần sửa ↑"); Toast Hoàn tác 5 giây; UX-A A1–A9; PA quy chế SOS gán tự động chạy ngay (S4-1, +migrate PA chờ xác nhận) |
| 28/09/2026 | Claude (session planning, Opus 5.5 · brainstorming + dispatching-parallel-agents) | **Vòng 2 kế hoạch nâng cấp.** Chủ sản phẩm chỉnh 9 ý (Q27-5…13: "5 ngày" là ngày lịch, bỏ Placement, bỏ dòng "hôm nay · Đổi", thêm **Pre FOU**, hạn ghi kết quả PA **hết Thứ Hai**, Phân tích giữ trong Tổng quan, thang Ý thức một dòng ký hiệu **WL**, **hệ môn học** FOU L·R·G+V·P / Pre FOU không chia môn / hai khung FT–Lớp thường). Rà toàn web bằng 5 agent chỉ đọc → `thiet-ke/ra-27-09/K1…K5.md`: **253 phát hiện, 13 P0**. Đặc tả thêm §3.1c (6 câu đang theo khuyến nghị), T55–T78, §4.9 (P0 + bảng PR → mã phát hiện), §5.6, §5.7, §5.8 (22 mâu thuẫn), §6.6; tách PR-LT2 thành LT2a/LT2b, thêm PR-MON, PR-Pb2 bỏ "Danh sách Case". Mockup 19 sửa M1, M4, M6, M9, M10, M11. Chưa sửa mã sản phẩm |
| 29/09/2026 | Claude (session code PR-DUYET, nhánh `pr-duyet-cho-duyet`, Opus 5.5) | **PR-DUYET — hộp Chờ duyệt (một hộp, có phân loại)** (đặc tả `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §5.5, §7.6 · T41–T44, T54, T64, T66, T69, T77, T78 · Q27-3, Q-D; kế hoạch `docs/superpowers/plans/2026-09-29-pr-duyet-cho-duyet.md`, Câu 1 = B). Phép kiểm **1444 → 1470** (+ 20 tốc độ). Bảng `yeu_cau_duyet` (hộp thư — bảng nguồn vẫn là sự thật; `chotYeuCau` idempotent cùng giao dịch), giao kèo loại thẻ `server/src/duyet/loaiYeuCau.ts` (PR-SOS/YT4/LT2/MT thêm một phần tử). Đề xuất PA và Dời lịch lần 2 vào hộp (bỏ nhóm việc `decide`/`decide_move`, bỏ Góp ý, bỏ nút Duyệt ở dòng việc, bỏ panel Trả lời đề xuất); **Xin hỗ trợ QL không còn dừng PA** (thẻ Xin ý kiến, QL Trả lời); **Đề xuất sửa thông tin HV** — quyền mới `cycle.edit` (target, lộ trình → QL; GVCN vẫn chuyển lớp); **Báo lên** Case chờ nguyên nhân quá hạn (Nhắc trỏ đúng dòng qua `notifications.duong`); quét khi đọc đóng thẻ chết + báo quá hạn một lần; quyền mới `request.approve`. Web: tab Chờ duyệt (QL tab đầu, badge), Yêu cầu của tôi (GV), Việc học viên (Của tôi · Của GV (nhắc), chip 4 nhóm), dải Tổng quan, Quản trị Đăng ký chờ duyệt, Vận hành người phụ trách ngoài hệ thống (`tasks.assignee_name`). **Migrate** `server/src/migrate/prDuyet.ts` + `npm run chay-thu:duyet` (chỉ đọc) |
| 29/09/2026 | Claude (session code PR-LOP, nhánh `pr-lop-tao-lop`, Opus 5.5) | **PR-LOP — tạo lớp, tên lớp mới, lộ trình RF, chương trình Pre FOU, phân công** (đặc tả `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.2 T1–T7, T51, T55, T56, T62, T71, T78 · Q27-8, Q27-13 · YC-1…YC-4 · L1–L4 · MH1, MH6, MH9 · M-09, M-20 · PF1, PF4, PF5, PF6; kế hoạch `docs/superpowers/plans/2026-09-28-pr-lop-tao-lop.md`). Phép kiểm **1401 → 1419** (+18, sau gộp `main` có PR-N1; + 20 tốc độ). Tạo lớp một lệnh, một giao dịch (`POST /classes` → `taoLopVaPhanCong`), kiểm ba luật phân công trước khi ghi (`shared/domain/phanCong.ts`), mỗi ô một người; tên lớp máy ghép `{CN} {FT \| FT RF \| Pre FOU \| FOU \| BE \| ELE} {số}` (`shared/domain/tenLop.ts`), tìm nhận cả kiểu cũ có `-`, sắp xếp số tự nhiên; Quản trị › Lộ trình & chương trình sửa số tuần có tác dụng, không thêm mã mới; lớp demo `MB FT RF 12`. **Migrate** `server/src/migrate/prLop.ts`: cột `classes.so_tuan/tuan_giua_khoa/tuan_cuoi_khoa` (chụp số tuần lớp cũ), dòng RF + Pre FOU, đổi tên lớp cũ theo mẫu (bỏ qua lớp va chạm/không theo mẫu), chỉ mục `ux_classes_ma_chuan` khi dữ liệu sạch; lệnh chỉ đọc `npm run chay-thu:lop`, `npm run kiem-lop-mo-coi`. **Cờ `CHO_TAO_PRE_FOU = false`** — tạo lớp Pre FOU khoá tới **PR-MON** (PF6). Việc chuyển PR-MT/MON/NEN/SOS/LT2b/UXF/S3 ở bảng "Chuyển cho PR khác" của kế hoạch |
| 29/09/2026 | Claude (session code PR-MON, nhánh `pr-mon-he-mon-hoc`, Opus 5.5) | **PR-MON — hệ môn học theo chương trình, Pre FOU một ô Tổng hợp, hai khung FT / Lớp thường** (đặc tả 27/09 §3.1b Q27-13 · T55–T57, T60, T78 · MH1–MH9 · M-09 · PF1, PF2, PF6; kế hoạch `docs/superpowers/plans/2026-09-29-pr-mon-he-mon-hoc.md`). Phép kiểm **1444 → 1478** (+34; + 20 tốc độ). Tên môn MỘT nguồn `tenMon`/`tenMonNgan` (FOU `L · R · G+V · P`, Pre FOU `Tổng hợp`); kỹ năng phụ trách được chỉ `L R W1 W2 S` (Quản trị sửa được, gợi ý phân công không tự điền); lịch/nợ điểm/lưới/Kế hoạch Test/Case/vi phạm theo bộ môn chương trình; Pre FOU chạy thật (một dòng lịch, % tổng, Case Tổng hợp, GVCN dạy luôn) và **mở tạo lớp Pre FOU** (`CHO_TAO_PRE_FOU = true`); nguyên nhân Case theo môn (G+V, P, Tổng hợp); công tắc `CongTacKhung` ở Lịch Test, Kế hoạch Test, Công việc; Tổng hợp/Tổng quan không trộn môn hai khung. **Migrate** `server/src/migrate/prMon.ts` (`user_skills`), chạy thử `npm run chay-thu:mon`; sửa bước migrate cũ không chèn 4 dòng lịch vào lượt Pre FOU. Demo `MB Pre FOU 03`. Việc chuyển PR khác ở kế hoạch |
| 28/09/2026 | Claude (session PR-NEN, nhánh `pr-nen-nen-giao-dien`, Opus 5.5) | **PR-NEN — nền giao diện (đợt 1, làn C).** Phép kiểm **1367 (mốc B) → 1413**, sau khi gộp PR-LOP **1444**, không migrate. Thành phần chung mới (đặc tả 27/09 §7.6, thay luật "không thêm component thứ sáu" của HE_GIAO_DIEN §3): `ONgay` + lịch tự vẽ `LichNho` (mọi ô ngày/tuần/tháng gõ `dd/mm/yyyy` hoặc bấm lịch, "Gần đây"; `ChonNgayGan/ChonTuan/ChonThang` thành lớp bọc, bỏ `NgayDoiDuoc`) · `OKhac` (Khác → Ghi rõ ≥ 3 ký tự ở web và máy chủ, bỏ luật 30 ký tự) · `NutChon` · `BoLocDoan` · `NhanTrangThai` (6 nhãn) · `useGiuFocus` (panel/Modal/lịch giữ và trả focus, Esc chỉ đóng lớp trên cùng) · "Bỏ qua tới nội dung"; `ChonNguoi` mở danh sách ngay, chữ "ngoài hệ thống"; mọi panel về `KhungPanel`; 4 loại hạn mới (Q16). Luật thuần `shared/domain/oNgay.ts`, `khac.ts`, `trangThai.ts`, `banPhim.ts`, phép kiểm `thanhPhanChung.tests.ts`. **Ngoại lệ:** Q12 — việc Vận hành chưa nhận tên ngoài hệ thống (cần cột mới) → PR-DUYET; Q13 — người theo dõi Vận hành và người phụ trách xử lý Ý thức giữ chỉ tài khoản. **Cổng merge:** PR-N1 lúc rebase đầu mới merge Task 0–5b; sau khi N1 phần 2 (#110) merge, rebase lại (R2) và ô Ghi rõ + ô ngày bắt buộc đi vào luật `useLoiForm` của từng form (form nhỏ trong dòng giữ nút chính mờ + câu lỗi dưới ô); 7 panel Task 9 có form nhưng chưa dùng `Truong` (Tài khoản, Danh mục ×2, Thêm học viên, Lộ trình, Lộ trình lớp, Ô báo cáo, Chi tiết công việc) chưa áp `useLoiForm`; phần chờ PR-LOP (làm sau khi LOP #112 merge, gộp `main` một lần): Chuyển tiếp lớp → `KhungPanel longTrong` (panel Tạo lớp mở đè không làm mất dữ liệu đang điền), 3 ô ngày/tháng → `ONgay`, `PhanDoan` của form lớp → `NutChon`, "Cách xem" tab Học viên của lớp → `BoLocDoan`, xoá hàm `Drawer`; ô tìm đầu trang gộp học viên + lớp (LOP K1-43) đi chung bằng phím mũi tên. Tài liệu: `CODE_MAP.md`, `thiet-ke/HE_GIAO_DIEN.md` §2 (token nền theo `index.css`) §3 §4 §9 §10, `thiet-ke/TU_DIEN_VA_CHU.md` §11 |
| 29/09/2026 | Claude (session code PR-YT4, nhánh `pr-yt4-y-thuc-v4`, Opus 5.5) | **PR-YT4 — Ý thức v4: Ghi nhận / Xác nhận xử lý, thang bắt buộc, QL duyệt biện pháp nặng** (đặc tả 27/09 §5.4–§5.8). Phép kiểm **1575 (mốc B) → 1622**, sau rebase lên main (PR-TOC, PR-KCK) **1643** (+ 22 tốc độ). Một cửa trạng thái `server/src/yThuc/trangThai.ts`; luật thuần v4 ở `shared/domain/yThuc.ts`; `xuLy.ts` (Ghi nhận, Xác nhận xử lý, Khai bậc, Đề xuất → thẻ `y_thuc`, Đã thực hiện); Báo lên `bao_len_y_thuc`; loại hạn `xu-ly-vi-pham`; chỉ số `bien-phap-cho-duyet`, `hv-theo-bac`. Xoá `measures.ts`, `canhBao.ts`, `viPhamLop.ts` và bốn panel PA v3. **CÓ migrate** `server/src/migrate/prYt4.ts` (3 cột + bảng `y_thuc_khai_bac`; DB sẽ reset). Demo a–m ở `DEMO.md` mục 1. Kế hoạch + nhật ký: `docs/superpowers/plans/2026-09-29-pr-yt4-y-thuc-v4.md`. |
| 30/09/2026 | Claude (session code PR-XUAT, nhánh `pr-xuat-xuat-excel-mt`, Sonnet 5.5) | **PR-XUAT — Xuất Excel kết quả Mock Test / Test lớp thường** (YC-13.9, T40). Phép kiểm **1722 (mốc B) → 1759 sau rebase lên PR-HSM** (+ 25 tốc độ). Luật thuần `shared/domain/xuatMt.ts`; máy chủ `server/src/phanTich/xuatMt.ts` (phạm vi: Quản lý/Quản trị theo chi nhánh · GVCN lớp mình, **GVBM không xuất**; một câu lấy lượt, tuần của lượt = tuần sớm nhất; xem trước = xuất); ngăn `NganXuatMt.tsx` mở từ Lịch Test, hồ sơ lớp ⋮, Phân tích › Tổng hợp Test. **Không migrate, không quyền mới.** Task 8 (cột Nhận xét W, Nhận xét S, GV chấm S — YC-13.5) **đã làm sau khi PR-HSM merge** (rebase lên `ada8f6c4`). Kế hoạch + nhật ký: `docs/superpowers/plans/2026-09-29-pr-xuat-xuat-excel-mt.md`. |
| 30/09/2026 | Claude (session code PR-SANG, nhánh `pr-sang-sang-toi-font`, Sonnet 5.5) | **PR-SANG — giao diện sáng/tối, phông Be Vietnam Pro, cỡ chữ tối thiểu** (YC-7, T15, T16, E4, E9). Phép kiểm **1799 (mốc B) → 1809** (+ 10 của `prSang.tests.ts` S1–S9), không migrate, không sửa máy chủ. Hai khối token ở `index.css` (`:root` tối, `:root[data-theme="light"]` sáng) + `tailwind.config.js` ánh xạ mọi cấp màu Tailwind về biến (không sửa component để làm sáng); nút ◐ (`CongTacGiaoDien`) nhớ theo máy, script `index.html` chống nháy; 4 chỗ màu cứng gỡ; 101 chỗ chữ < 11 px → 0. **🛑 6a đã hỏi:** Be Vietnam Pro không có số cùng độ rộng → chủ sản phẩm chọn chữ số 0–9 lấy từ Inter (`@fontsource/inter` qua `unicode-range`). Đo AA trang thật (18 trạng thái, 1440 px): sáng 64 → 0, tối 40 → 0; `bg-sky-*` / `opacity-55` / `text-amber-200/70` đổi sang token. Tối trước = sau, chỉ lệch mục cố ý (nền DemoBar, `slate-600→500`, badge `doing-bg`). Thanh đầu 375 px: ô tìm `min-w-[4.5rem]`. Sửa `CLAUDE.md` "giữ phông Inter" → Be Vietnam Pro. Chưa bấm tay: panel Thêm PA, lịch `ONgay`, toast. |
| 02/10/2026 | Claude (session planning, Sonnet 5.5) | **Cập nhật Rulebook v1.3 + outline sổ tay người dùng.** Năm agent đọc song song đặc tả 27/09, kế hoạch PR 28/09–01/10 và code `main` (HEAD `0aad2a0a`): ~190 luật đối chiếu, mọi chỗ lệch ghi ở `docs/so-tay/doi-chieu-02-10/`. Rulebook thêm **mục 20** (bảng thay thế 18 dòng, bảng hạn, thang Ý thức, dấu "-", hộp Chờ duyệt, lớp thường, chuyển lớp, ma trận quyền, 9 điểm còn mở P01–P09) và đánh dấu **[ĐÃ THAY]** ở §5, §10, §17.7 C01/C08, §18.3, §19. Chốt C08 (02/10): Normal có dùng "-", còn "-" thì dời tuần đến khi có điểm hoặc QL huỷ kết quả môn — **code mới làm một phần** (thiếu nút QL huỷ, bộ đếm, lối ra khi vướng đợt kế). Thêm `docs/so-tay/` (outline hai sổ tay, bản đồ màn hình 35 màn). Không đổi code. |
---

## 15. PR-E — Nền giao diện dùng chung

> **Chặng 1.** Không phụ thuộc PR nào. **Không đụng năm file ở mục 0.5.**
> Nhánh: `worktree-batch-thiet-ke-sau-pr28` (dùng chung cho cả năm chặng — mục 0.4).
>
> **Goal:** Bốn lỗi đang lặp ở nhiều màn — hạn không nói rõ hạn gì, badge "đạt" khi chưa đủ
> điểm, phần trăm không có mẫu số, bộ chọn tuần rớt ba hàng — được đóng **ở component**, để
> các PR sau không phải sửa lại từng màn.
>
> **Đặc tả đầy đủ:** `thiet-ke/HE_GIAO_DIEN.md`. Mục này chỉ là thứ tự việc.

### 15.1. Bố cục file

| File | Trách nhiệm sau PR-E |
|---|---|
| `shared/domain/display.ts` | **Mới (không có trong bản kế hoạch gốc).** Luật hiển thị dưới dạng hàm thuần: `deadlineView` · `attemptProgressView` · `rateView`/`rateText` · `businessDateText`. Ba component chỉ là lớp vẽ mỏng phía trên — luật nằm đây để kiểm được bằng bộ kiểm thử máy chủ (harness không dựng được React) |
| `web/src/ui/Han.tsx` | **Mới.** `<Han loai={...} han={...} hanGoc? hen? tienTo? ghiChu? />` — sáu loại hạn + `du-kien-ket-thuc` |
| `web/src/ui/KetQuaDot.tsx` | **Mới.** Một câu duy nhất cho tiến độ một đợt Test |
| `web/src/ui/TyLe.tsx` | **Mới.** `n/N` trước, `%` sau; `N=0` → `Chưa có dữ liệu`; `N<5` → nhãn mẫu nhỏ |
| `web/src/ui/ngayNghiepVu.ts` | **Mới.** `useNgayNghiepVu()` — một nguồn ngày nghiệp vụ cho UI |
| `web/src/modules/dev/ThanhPhanDemo.tsx` | **Mới.** Trang thử `/dev/thanh-phan`, chỉ có khi chạy `npm run dev` |
| `web/src/ui/Filters.tsx` | `WeekPicker` (`:98`): sửa bố cục một hàng + popover lịch |
| `web/src/ui/ui.tsx` | Gom bảng tone về một chỗ; không thêm component mới ở đây |
| `web/src/modules/fasttrack/ScoreEntry.tsx` | `DeadlinePill` (`:201`) gọi `<Han loai="nhap-diem">` thay vì tự dựng chuỗi |
| `shared/domain/week.ts` | Dùng lại hàm mã tuần đang có cho popover — **không viết hàm tính tuần thứ hai** |
| `server/src/tests/run.ts` | Phép kiểm cho luật của `<TyLe>` và `<KetQuaDot>` ở tầng thuần |

### 15.2. Các bước

- [x] **Step 1: `<Han>`.** Sáu `loai` bắt buộc theo bảng `thiet-ke/HE_GIAO_DIEN.md` §4:
      `xac-minh-sos` · `lap-pa` · `cap-nhat-pa` · `thuc-hien-y-thuc` · `hoan-thanh-y-thuc` ·
      `nhap-diem`, cộng `du-kien-ket-thuc` (**không phải hạn**, luôn trung tính, không bao giờ
      ghi "quá hạn"). `loai` không có giá trị mặc định — thiếu thì `tsc` phải báo lỗi.
      Quá hạn đếm từ **hạn gốc**. Có hẹn xử lý thì hiện cả hai: `Hạn nhập điểm 23/09 · Hẹn xử lý 30/09`. *(Đã làm. `loai` thiếu → `TS2741` — đã thử tháo dòng bảo vệ để xem đúng thông báo lỗi.)*
- [x] **Step 2: `DeadlinePill` dùng `<Han>`.** `ScoreEntry.tsx:201` đang tự dựng bốn nhánh chuỗi
      (`Hạn riêng môn này` / `Hạn riêng cả đợt` / `Hạn` / `Quá hạn`). Giữ nguyên **nghĩa**, đổi
      **đường render**. Đây là chỗ duy nhất của PR-E chạm module fasttrack — đừng mở rộng. *(Đã làm: nguồn hạn riêng môn/cả đợt thành ghi chú đứng sau; ngày viết `23/09` thay vì `23/09/2026` theo HE_GIAO_DIEN §2.)*
- [x] **Step 3: `<KetQuaDot>`.** Năm nhánh ở `thiet-ke/HE_GIAO_DIEN.md` §5. Hai luật cứng:
      (a) `coDiem < yeuCau` → Overall render chữ `Chưa đủ điểm`, **cấm** badge đạt (lỗi MT-P01);
      (b) đơn vị đếm là **bốn kỹ năng L/R/W/S** — W1/W2 là hai *bài nhập*, không bao giờ ghi
      `1/5` ở chỗ đang nói kỹ năng.
- [ ] **Step 4: `<TyLe>`.** Thứ tự `n/N` rồi `(%)`. `N=0` → `Chưa có dữ liệu`, **không** render
      `0%`. `N<5` → nhãn `mẫu nhỏ`. Component **không nhận** prop kiểu `xepHang`/`totNhat`. *(Đã làm; có dòng `@ts-expect-error` ở trang thử để `tsc` gãy nếu ai thêm prop xếp hạng. Cũng **chưa nối vào màn thật** — PR-F Step 5 là chỗ dùng đầu tiên.)*
- [x] **Step 5: `useNgayNghiepVu()`.** Một nguồn duy nhất cho UI, đọc cùng đồng hồ với
      `demoToday()` ở máy chủ. Nơi nào ngày nghiệp vụ khác ngày ghi nhận thật thì hiện cả hai:
      `Ngày nghiệp vụ 14/09 · Ghi nhận 19/09`. **Không sửa timestamp thật.** (Lỗi MT-P10.) *(Mới dựng hook + hàm và dùng ở `<Han>` và bộ chọn tuần; **chưa quét các màn khác** đang tự đọc `session.demoDate` hoặc `fmtDate` — ghi vào backlog mục 12.7.)*
- [x] **Step 6: Sửa bố cục `WeekPicker`.** Một hàng flex, gap 8px, cao 40–44px; mũi tên
      `flex:none`, trường tuần `flex:1` **`min-width:0`** — thiếu dòng này chính là nguyên nhân
      wrap trong ảnh. Panel ~600px: chỉ `Tuần này` xuống hàng. Trường tuần luôn ghi tuần **đang
      chọn thật**, không để trống rồi chú thích dưới. *(Đã làm. Đo thật: panel 600px cả bốn phần một hàng; 300px thì `‹ trường ›` một hàng, chỉ `Tuần này` xuống; mọi nút cao 40px; 375px không tràn ngang. Bỏ prop `className` (bề rộng do khung chứa quyết định) — bỏ luôn ở kiểu dữ liệu để `tsc` liệt kê hết nơi gọi cho Step 8.)*
- [x] **Step 7: Popover lịch.** Bấm trường tuần mở popover: gõ ngày hoặc chọn tuần, đổi
      tháng/năm. Bỏ dropdown hàng chục tuần. Render qua portal; kiểm z-index **trong `Drawer` và
      trong modal** — hiện đang bị cắt. *(Đã làm: portal ra `body`, `position: fixed`, `z-70` (ngăn kéo/modal là `z-50`), tự lật lên khi hết chỗ, kẹp trong màn hình. Đo thật trong ngăn kéo VÀ hộp thoại: nằm ngoài DOM của chúng, nằm trọn trong màn hình, ở trên cùng. `Esc` chỉ đóng lịch, không đóng luôn ngăn kéo/modal. Popover từ trước đã là lịch tháng, không phải dropdown nhiều tuần — phần "bỏ dropdown" của kế hoạch đã đúng sẵn.)*
- [x] **Step 8: Quét mọi nơi dùng bộ chọn tuần.** `CaseBoardPage` · `MeetingPage` ·
      `TransitionPanel` · `ClassCreatePanel` · `ClassProgressPanel` · `StudentPlanPanel` ·
      `ScoreSheetPage` · `MockPlanPanel`. Sửa CSS của **panel chứa**, không chỉ của component.
      **Trừ `CaseBoardPage.tsx`** — file này thuộc danh sách khoá ở mục 0.5, để sang chặng 4. *(`CaseBoardPage.tsx` không còn bị loại trừ: PR-D đã làm ở chặng 0 trên cùng nhánh. Có chín nơi gọi ở tám file; `MeetingPage` và `ScoreSheetPage` chỉ cần bỏ `className`. **Hai việc ngoài CSS phát hiện khi quét:** (1) `MockPlanPanel` để bộ chọn trong lưới hai cột chỉ có một ô nên bị ép nửa panel — đổi thành một cột; (2) bốn bộ chọn nằm trong `<Field>`/`<label>`: nhãn bọc nhiều nút thì bấm vào chữ sẽ bấm nút ĐẦU TIÊN, tức "Tuần trước" — `Field` nhận thêm `as="div"`. Kiểm thật ở panel Lộ trình: bấm chữ nhãn, tuần không nhảy.)*
- [x] **Step 9: Trang demo component nội bộ.** Một route dev dựng đủ sáu trạng thái mỗi
      component: rỗng · một bản ghi · nhiều · tên dài · lỗi tải · không quyền. Không có trang này
      thì nghiệm thu mục 15.3 không làm được. *(Đã làm: `/dev/thanh-phan`, mỗi component đủ sáu ô; hai ô lỗi tải/không quyền là của khối chứa nên hiện `ErrorState`/`Forbidden` chuẩn. Route gắn theo `import.meta.env.DEV` ngay chỗ `import()`.)*

### 15.3. Nghiệm thu PR-E

- `<Han>` thiếu `loai` → **`tsc` báo lỗi**, không phải cảnh báo lúc chạy.
- Ép `coDiem=1, yeuCau=4, dat=true` vào `<KetQuaDot>`: ra `Chưa đủ điểm`, không ra badge đạt.
- `<TyLe n={0} N={0}>` → `Chưa có dữ liệu`. `<TyLe n={1} N={1}>` → `1/1 (100%) · mẫu nhỏ`.
- Bộ chọn tuần trong panel 600px, modal rộng và mobile: **không rớt hàng ngẫu nhiên**, popover
  không bị cắt trong `Drawer`.
- Ảnh chụp chuyển sang xám vẫn đọc được mọi trạng thái (không có tín hiệu chỉ bằng màu).
- `git diff --name-only origin/main` **không chứa** file nào trong danh sách khoá ở mục 0.5.
- `npm run check` (mục 13.1) xanh; bấm thử thật đủ ba vai theo mục 13.2.

---

## 16. PR-F — Hợp đồng số liệu và "Vì sao số này?"

> **Chặng 2.** Phụ thuộc chặng 1 (dùng `<TyLe>`). **Không đụng năm file ở mục 0.5.**
>
> **Goal:** Một chỉ số = một hàm trả về **tập ID**. Số là `tap.length`, danh sách khi bấm vào
> là chính tập đó. Hết chuyện hai màn hiện hai số dưới cùng một cái tên.
>
> **Đặc tả đầy đủ:** `thiet-ke/HOP_DONG_SO_LIEU.md`.

### 16.1. Bố cục file

| File | Trách nhiệm sau chặng 2 |
|---|---|
| `shared/domain/metrics.ts` | **Mới.** Kiểu `ChiSo` + khai báo mười một chỉ số, đủ tám trường |
| `server/src/worklist/weekly.ts` | **F01 (P0)** — ba truy vấn case/HV/chờ duyệt nhận tập attempt ID đã lọc quyền, không tự lọc `planned_period_id` |
| `server/src/cases/effectiveness.ts` | **F02** tách hiện trạng/lịch sử trong `issueBoard` · **F03** `planOutcomes` theo đơn vị lịch sử · **F05** bỏ hàng `undetermined` khỏi bảng hiệu quả |
| `server/src/routes/index.ts` | Một route drill-down dùng chung, nhận `metricId` + phạm vi, trả đúng tập ID |
| `web/src/ui/SoLieu.tsx` | **Mới.** Số + tooltip `Cách tính` + bấm mở panel danh sách |
| `web/src/modules/worklist/OverviewPage.tsx` | Bốn ô số đi qua `<SoLieu>` |
| `web/src/modules/cases/IssueAnalysis.tsx` | Bảng hiệu quả dùng `<TyLe>`; `Chưa đủ dữ liệu` ra ngoài bảng |
| `server/src/tests/run.ts` | Phép kiểm F01/F02/F03/F05 + phép kiểm "số = độ dài tập" |

### 16.2. Các bước

- [x] **Step 1: Sổ chỉ số.** `shared/domain/metrics.ts` theo bảng mười một chỉ số ở
      `thiet-ke/HOP_DONG_SO_LIEU.md` §2. Thiếu một trong tám trường thì không được lên dashboard. *(Đã làm: `shared/domain/metrics.ts`, mười một chỉ số đủ tám trường, có phép kiểm khoá. Kiểu `donVi` của đặc tả thiếu `nghia-vu` dù bảng của chính nó dùng "nghĩa vụ" cho `dung-han-cap-nhat` — đã thêm. **Chỉ BẢY trên mười một chỉ số có hàm tập ID** (`hv-co-case-mo` · `case-mo` · `case-thieu-pa` · `tin-hieu-cho-xac-minh` · `pa-can-cap-nhat` · `pa-co-ket-qua` · `ty-le-co-cai-thien`). Bốn chỉ số còn lại (`hv-sos-hien-tai` · `hv-duoi-ky-vong-mon` · `dung-han-cap-nhat` · `do-phu-danh-gia`) đã khai báo nhưng máy chủ trả 501 "chưa có danh sách" — xem mục 12.8.)*
- [x] **Step 2: F01 — P0, làm trước.** `weekly.ts`: tập attempts đã lọc chi nhánh/chương
      trình/quyền, nhưng ba truy vấn sau đó chỉ lọc `planned_period_id` → **hai chi nhánh cùng
      tuần đang cộng lẫn vào nhau**. Sửa: ba truy vấn nhận chính tập attempt ID được phép.
      Phép kiểm: dựng hai CN cùng tuần, lọc một CN, khẳng định kết quả không chứa ID của CN kia. *(Đã làm. Ba truy vấn nhận `a.id IN (các lượt được phép)`. Phép kiểm dùng tuần thật `W3 AUG 2026` (MB 5 case, CP 4 case), đếm sự thật bằng SQL độc lập, và tự khoá tiền đề "tuần này chỉ có case ở đúng hai chi nhánh". **Đã kiểm ngược (mutation): trả `weekly.ts` về bản cũ thì phép kiểm gãy.** Hệ quả phụ: case của lượt đã huỷ nay không còn được đếm, vì cùng tập lượt với các cột kết luận.)*
- [x] **Step 3: F02.** `issueBoard`: `students` đang đếm từ **mọi** case của phân loại trong khi
      `openCases` đã lọc chưa done. Tách `hv-co-case-mo` (hiện trạng) khỏi chỉ số lịch sử. Hiệu
      quả lịch sử **vẫn phải** đọc được PA của case đã đóng — đừng sửa bằng cách lọc bỏ hết. *(Đã làm. "HV đang gặp" chỉ đếm em có case CHƯA kết luận; thêm `studentsEver` cho chỉ số lịch sử; hiệu quả vẫn đọc được phương án của case đã đóng. Cột bảng đổi tên "HV đang gặp" + tooltip nói rõ. Kiểm ngược đã gãy đúng phép kiểm F02.)*
- [x] **Step 4: F03.** `planOutcomes` lấy HV từ enrollment đang active rồi đọc PA lịch sử → em
      chuyển chi nhánh làm mất mẫu ở nơi cũ và mọc ở nơi mới. Luật: **hiện trạng theo nơi đang
      chăm sóc, lịch sử theo đơn vị/người thực hiện tại thời điểm hỗ trợ.** Không đủ dữ liệu quá
      khứ thì ghi `chưa xác định nguồn`, **không** quy cho nơi hiện tại. *(Đã làm — phần nặng nhất. Kết quả gán theo LẦN GHI DANH bao phủ ngày phương án xảy ra (`enrollments.started_at/ended_at`), không theo lớp hiện tại. Phép kiểm dựng một em CP→MB thật: kết quả giữ ở CP, hiện trạng sang MB. Phương án không có lần ghi danh nào bao phủ ngày ấy vào nhóm "chưa xác định nguồn" (`planOutcomesUnattributed`). **Nhóm này mới có ở máy chủ, CHƯA hiện ở giao diện.** Bộ demo có em ghi danh với ngày khai giảng SAU ngày demo — phương án của em đó đúng luật là "chưa xác định nguồn". Kiểm ngược đã gãy đúng phép kiểm F03.)*
- [x] **Step 5: F05.** Mẫu số đã loại `undetermined` nhưng response vẫn trả hàng/cột đó. Chuyển
      thành liên kết `Cần bổ sung đánh giá` **ngoài** bảng hiệu quả. Không xoá hồ sơ gốc. *(Đã làm. Hàng/cột `undetermined` ra khỏi bảng hiệu quả và bảng vấn đề; thành liên kết `Cần bổ sung đánh giá · n phương án` ngoài bảng, mở danh sách đúng phương án đó (`/issue-board/needs-evaluation`, cả bản cho bảng lớp). Hai mức `Có tiến bộ` / `Tiến bộ một phần` hiện riêng, tổng `Có cải thiện` qua `<TyLe>` (D03). Kiểm thật: Writing 2 Fast Track có đúng 1 phương án, danh sách mở ra đúng 1 dòng.)*
- [x] **Step 6: Route drill-down dùng chung.** Nhận `metricId` + phạm vi, gọi **đúng hàm đã sinh
      ra con số**, áp **cùng bộ quyền**. Phạm vi rỗng trả rỗng, không hiểu thành toàn hệ thống. *(Đã làm: `GET /metrics/:id` (`?rows=1` thêm dòng, `?branchId=`). Hỏi chi nhánh ngoài quyền → **403**, không trả tập rút gọn; mã lạ → 404; chỉ số chưa có hàm → 501; phạm vi rỗng → `n=0` + "Không có dữ liệu trong phạm vi". Kiểm thật qua HTTP bằng Quản lý CP và GVBM MB. **Tìm thêm một lỗi cùng họ:** `issueScopeOf` trả `branchIds: []` khi hỏi chi nhánh ngoài quyền, và `studentsOf` coi mảng rỗng là "không lọc" — tức MỌI học viên. Đã sửa: `[]` nghĩa là rỗng.)*
- [x] **Step 7: `<SoLieu>`.** Hover → tooltip đọc thẳng từ `ChiSo` (câu hỏi, tập đủ điều kiện,
      quy tắc khử trùng, mốc thời gian, ngày dữ liệu). Bấm → panel `{n} {đơn vị} — {tên}` giữ
      nguyên bộ lọc, có đường quay lại. *(Đã làm một phần. `<SoLieu>` xong (tooltip đọc thẳng `ChiSo`, bấm mở panel `{n} {đơn vị} — {tên}`), bốn ô ở đầu Tổng quan đi qua nó, và kiểm thật số ô = tiêu đề panel = số dòng ở cả bốn ô. **KHÔNG đạt yêu cầu "không còn số nào nằm ngoài `<SoLieu>`":** bảng "Việc cần lưu ý" (sáu cột), bảng "Theo chi nhánh" và các cột của hai bảng phân tích vẫn là số trần. Ô "Học viên dưới kỳ vọng" của design plan chưa có vì `hv-sos-hien-tai` chưa có hàm. Bốn ô hiện là: HV có case đang mở · Case thiếu phương án · Tín hiệu cần xác minh · PA cần cập nhật.)*
- [x] **Step 8: Đối soát F10.** Xuất tập ID sinh ra số ở Toàn cảnh và ở Phân tích rồi `diff`.
      Chênh lệch chỉ được chấp nhận khi **giải thích được bằng định nghĩa khác nhau**, và khi đó
      hai màn **phải đổi nhãn cho khác nhau**. Ghi kết quả đối soát vào báo cáo, kể cả khi hoá ra
      cả hai đều đúng. *(Đã làm — kết quả đối soát ở mục 14 và 12.8. Tóm tắt: **29 HV (Tổng quan) so với 28 HV (Thực trạng)**, chênh đúng MỘT em đã kết thúc khoá mà case còn mở; hai màn định nghĩa khác nhau nên đã đổi nhãn (Thực trạng "HV đang gặp — đang học", Tổng quan nói rõ "kể cả em đã kết thúc khoá"). Ở tập case còn một nguyên nhân thứ hai: em chuyển FT→Normal mà case `writing1` còn mở thì không có hàng ở tab Normal.)*

### 16.3. Nghiệm thu PR-F

- Hai CN cùng tuần: lọc một CN, mọi cột và mọi drill-down không chứa ID CN kia.
- Ba PA đủ kết quả (tiến bộ · một phần · không tiến bộ) + một PA chưa đủ dữ liệu →
  tỷ lệ **2/3**, không phải 2/4. Số PA khác số HV, hiện đủ cả hai đơn vị.
- Một PA cập nhật 4 lần rồi kết thúc: đóng góp **một** kết quả cuối.
- Một case đóng + một case mở cùng lỗi: `hv-co-case-mo` chỉ đếm em có case mở; bảng hiệu quả vẫn
  đọc được kết quả lịch sử.
- HV chuyển CN sau khi kết thúc PA: hiện trạng sang nơi mới, lịch sử giữ nơi cũ.
- Gọi thẳng route drill-down bằng tài khoản ngoài phạm vi → **bị từ chối**, không trả tập rút gọn.
- Mọi số trên Tổng quan bấm được và ra đúng độ dài tập; không còn số nào nằm ngoài `<SoLieu>`.

---

## 17. PR-G — Dấu '-' và chốt không dự thi cuối Chủ nhật

> **Chặng 3.** Không phụ thuộc chặng nào trước; **không đụng năm file ở mục 0.5.**
>
> **Goal:** Rule book §17.1 — GV nhập `-` để báo em có lịch nhưng không làm bài; sửa được đến
> hết Chủ nhật; còn `-` khi hết Chủ nhật thì xác lập **không dự thi**. **Bỏ bước GVCN xác minh
> thường lệ.**
>
> **Nguồn: `thiet-ke/PISA-Rulebook-2026-09-19.md` §17.1 — chốt mới nhất, thay các mô tả cũ mâu
> thuẫn.** Mọi câu cũ kiểu "mọi dấu '-' chỉ hẹn
> chấm, luôn cần GVCN xác minh vắng" đã hết hiệu lực (rule book §17.5).

### 17.1. Quyết định kỹ thuật quan trọng — đọc trước khi code

Rule book yêu cầu việc chốt xảy ra **"kể cả không ai mở web"**. Dự án này không có cron.
Cách làm đúng **không phải** dựng cron, mà là làm hàm chốt thành **hàm thuần theo thời gian**:

> Kết quả chốt là hàm của (dấu `-` đang có · **tuần lịch của chính bài đó** · ngày nghiệp vụ
> hiện tại), **không** phải hàm của thời điểm chạy. Chạy Chủ nhật 23:59, sáng thứ Hai, hay thứ
> Năm tuần sau đều ra **cùng một kết quả và cùng một ngày hiệu lực**.

Nhờ vậy chỉ cần gọi nó ở đường đọc, đúng như `sweepExpiredMoves()` đang được gọi từ
`server/src/worklist/mywork.ts:437`. Dùng lại đúng khuôn mẫu đó, **đừng phát minh cơ chế thứ hai**.

### 17.2. Bố cục file

| File | Trách nhiệm sau PR-G |
|---|---|
| `shared/domain/policy.ts` | **Mới.** `C10_NHAP_DAU_TRU_TUAN_QUA_KHU` và các hằng C01–C09 (xem `thiet-ke/LUAT_CHO_CHOT.md`) |
| `shared/domain/fasttrack.ts` | Trạng thái `khong-co-bai` và `khong-du-thi`; hàm thuần quyết định chốt |
| `server/src/fasttrack/skillSchedule.ts` | Mốc cuối tuần theo **tuần lịch của bài**, Asia/Ho_Chi_Minh |
| `server/src/fasttrack/absence.ts` | Sau khi chốt thì nối vào luật vắng đã có (lần 1 dời, lần 2 QL duyệt) |
| `server/src/fasttrack/attempts.ts` | `Cell` mang trạng thái mới; sweep gọi ở đường đọc |
| `web/src/modules/fasttrack/ScoreEntry.tsx` | Ô điểm nhận lệnh `-`; hai chuỗi trạng thái |
| `web/src/modules/fasttrack/ScoreSheetPage.tsx` | Bàn phím: `Tab` · `Enter` · `-` · `Esc`; lưu từng dòng |
| `server/src/schema.sql` · `server/src/migrate.ts` | **Không có trong bản kế hoạch gốc.** Năm cột `no_show_*` trên `assessment_scores` + bước nâng cấp `migrateNoShowMarks` (idempotent, chỉ thêm cột) |
| `server/src/tests/run.ts` | Sáu phép kiểm ở mục 17.4 (thực tế 16 phép kiểm, xem mục 14) |

### 17.3. Các bước

- [x] **Step 1: `policy.ts`.** Chín hằng C01–C09 + `C10`. Mỗi hằng có chú thích nêu **cả hai
      phương án** và lý do đang chọn cái nào. Không rải `if`, **không viết migration** dựa trên
      một điểm chưa chốt. *(Đã làm: `shared/domain/policy.ts`, C01–C10 đủ chú thích hai phương án. **Chỉ C10 được code đọc**; C01–C09 là hành vi đang chạy vẫn viết cứng ở nơi gọi — đổi hằng số CHƯA đổi hành vi, cần nối từng chỗ. **C09 lệch:** LUAT_CHO_CHOT ghi phương án chờ là "giữ chờ Quản lý duyệt", nhưng code hiện tại (`sweepExpiredMoves`) tự huỷ khi hết hạn — hằng số ghi giá trị của tài liệu, code vẫn chạy cách cũ, đã nói rõ trong chú thích.)*
- [x] **Step 2: Lệnh `-` ở ô điểm.** L/R: gõ `-` thay cho số. W1/W2/S: **một** dấu `-` trong bốn
      tiêu chí là đủ báo chưa có bài **cho đúng bài đó**. Ô trống vẫn chỉ là chưa nhập; `-`
      không phải 0; điểm 0 vẫn là điểm 0. *(Đã làm: L/R gõ `-` thay số; W1/W2/S một dấu `-` trong bốn tiêu chí (hoặc bấm nút trong hộp thoại) là đủ, lưu ở `assessment_scores` (năm cột mới, có migration idempotent). `-` không phải 0 và không ghi `entered_by` (đúng MT-P09).)*
- [x] **Step 3: Hai chuỗi trạng thái.** Gợi ý trong ô: `Nhập - nếu học viên không làm bài`. Sau
      lưu: `Không có bài · Có thể sửa đến hết Chủ nhật {ngày}`. Sau chốt:
      `Không dự thi · Tuần {mã tuần}`. *(Đã làm: hai câu trạng thái đúng bộ chữ, dựng ở `noShowText`. Gợi ý `Nhập - nếu học viên không làm bài` nằm ở `title`/`aria-label` của ô và ở chú thích dưới bảng — không hiện thành chữ mờ trong ô vì ô chỉ rộng 4rem.)*
- [x] **Step 4: Hàm chốt thuần.** Theo mục 17.1. **Idempotent**: gọi mười lần ra một lần chốt,
      bộ đếm vắng không tăng thêm. Mỗi lần lịch/kỹ năng chỉ chốt **một lần**. *(Đã làm: `noShowStateOf` (thuần) + `settleNoShows` (gọi ở `classScoreSheet`, `attemptDetail`, `saveScore`, `mywork`). Phép kiểm chạy hàm ở 14 ngày khác nhau và khẳng định cùng ngày hiệu lực cuối Chủ nhật, và mười lần chạy chỉ chốt một lần (bộ đếm = số dòng `skill_no_show_settled` trong lịch sử lịch). **Kiểm ngược:** đổi `>` thành `>=` và bỏ điều kiện "đủ mọi ô" thì đúng hai phép kiểm gãy.)*
- [x] **Step 5: Không lây sang bài khác.** `-` ở W1 **không** xoá W2/S, không tạo điểm 0. Nếu
      W1/W2 cùng một buổi Writing thì bộ đếm vắng **không tăng hai lần** — đếm theo đơn vị
      lịch/buổi, không theo số ô. *(Đã làm, kèm MỘT QUYẾT ĐỊNH KẾ HOẠCH KHÔNG NÊU: buổi Writing chỉ chốt vắng khi CẢ HAI ô W1 và W2 đều `-`. Chỉ W1 `-` mà W2 trống hoặc đã có điểm thì buổi đó KHÔNG phải vắng (em có làm, hoặc chưa biết). Rule book §17.1 chỉ nói "không đếm hai lần" — cần chủ sản phẩm xác nhận ý này.)*
- [x] **Step 6: Sửa trước chốt thì không tính vắng.** Đổi `-` thành điểm hợp lệ trước cuối tuần
      → không có lần vắng nào. Đã có **điểm chính thức** thì `-` không được xoá âm thầm — phải
      đi đường hiệu chỉnh có lý do. *(Đã làm. Nhập điểm hoặc tiêu chí sau `-` thì dấu hết hiệu lực; `-` đè lên điểm chính thức bị từ chối với lời nhắc dùng hiệu chỉnh có lý do. **Đường "hiệu chỉnh điểm có lý do" cho giáo viên CHƯA tồn tại** — thông báo lỗi chỉ đường tới một chức năng chưa có.)*
- [x] **Step 7: Nối vào luật vắng đã có.** Sau chốt: lần đầu dời đúng tuần kế tiếp (quyền GVCN),
      từ lần hai QL duyệt, chỉ QL khôi phục phần FT đã huỷ. **Quyền bấm dời lần đầu của GVCN
      không được mở cho mọi GVBM** chỉ vì GV là người báo `-`. *(Đã làm, và **bấm thử trình duyệt thật phát hiện một lỗ hổng kế hoạch không thấy được:** chốt xảy ra ngay khi hết Chủ nhật, nên sáng thứ Hai "tuần kế tiếp" LUÔN đã bắt đầu, mà luật vắng cũ chuyển thẳng Quản lý khi tuần đích đã bắt đầu — nên "lần đầu GVCN dời" không bao giờ xảy ra với bài không dự thi. Đã sửa hẹp: lần dời ĐẦU của bài đã chốt chỉ cần tuần đích CHƯA KẾT THÚC; tuần đích đã qua hẳn thì vẫn sang Quản lý. Mọi trường hợp vắng khác giữ nguyên. Kiểm thật: báo `-` ngày 14/09, đổi ngày demo sang 21/09, GVCN dời → "đã dời sang W4 SEP", GVBM bị từ chối. **Chưa kiểm lại** lần dời thứ hai (Quản lý duyệt) và khôi phục sau khi đi qua đường chốt mới — chỉ có phép kiểm cũ của luật vắng.)*
- [x] **Step 8: Hai mốc không thay nhau.** `Hạn nhập điểm 23/09` (thứ Tư tuần kế, cho bài **có**
      thực hiện) và mốc chốt Chủ nhật (cho bài GV đã báo không có) hiện **khác tên, cạnh nhau**.
      Dùng `<Han loai="nhap-diem">` của chặng 1 — nó đã có sẵn trong cùng nhánh. **Đừng** tự
      dựng component hạn thứ hai. *(Đã làm ở bảng chấm: cột hạn hiện `Hạn nhập điểm 23/09` (qua `<Han loai="nhap-diem">`) và cạnh đó `L: Không có bài · Có thể sửa đến hết Chủ nhật 20/09` — hai tên khác nhau. Mốc chốt là một câu trạng thái, không dựng component hạn thứ hai.)*
- [x] **Step 9: Normal không đổi.** Chốt vắng áp dụng cho Mock. Normal **vẫn phải đủ bốn môn**,
      không có huỷ nghĩa vụ Test. Đừng mang giới hạn FT sang Normal. *(Đã làm: máy chủ từ chối `-` với lớp Normal; `RegularSheetPage` không đổi, và không có chốt vắng nào chạm Normal.)*
- [x] **Step 10: Bàn phím ở bảng nhập điểm.** `Tab` sang ô kế · `Enter` xuống dòng · `-` là lệnh
      không có bài · `Esc` huỷ ô đang sửa. Trạng thái lưu **từng dòng** (`SaveState`), không lưu
      cả bảng rồi báo một lỗi chung. *(Làm một phần: `Enter` xuống dòng và `Esc` huỷ ô đang sửa (kiểm thật) và `-` là lệnh; `Tab` là mặc định của trình duyệt. Mỗi dòng có chỉ báo lưu riêng (Đang lưu / Đã lưu / Lưu lỗi + Thử lại). **Chưa làm:** phím mũi tên và Enter chỉ có ở hai ô L/R; ô W1/W2/S là nút mở hộp thoại nên chưa đi bàn phím giữa các ô như hai ô kia.)*

### 17.4. Nghiệm thu PR-G

1. `-` ở tuần 14–20/09, còn nguyên hết ngày 20/09 → chốt `Không dự thi`. Sửa thành điểm trước đó
   → **không** tính vắng. Ô trống → **không** tự vắng.
2. S tuần 21–27/09 **không** bị chốt trong tuần 14–20/09.
3. Chạy hàm chốt lặp nhiều lần: số lần vắng **không tăng**; ngày hiệu lực không đổi.
4. `-` ở W1 không xoá W2; nếu cả hai thuộc một buổi Writing thì **không** đếm hai lần vắng.
5. Đã có điểm chính thức: `-` không xoá được nếu không đi đường hiệu chỉnh có lý do.
6. Vắng lần 1 → dời tuần sau; lần 2 → chờ QL; điểm RLW đã có **không mất**; chỉ QL khôi phục.
7. Normal bốn môn ba tuần: không có huỷ; `7/10` đạt, `23/33` chưa đạt.
8. `git diff --name-only origin/main` không chứa file khoá ở mục 0.5.

---

## 18. PR-I — Hồ sơ Test gọn và áp hệ giao diện vào khối case

> **Chặng 4.** Chỉ bắt đầu **sau khi PR-D đã được hợp nhất vào nhánh batch** (mục 21.2 bước 3).
> Sửa đúng năm file PR-D đang giữ. Phụ thuộc: PR-D + PR-E + PR-G.
>
> **Goal:** Hồ sơ Mock Test chỉ còn phục vụ đợt kiểm tra; các component của PR-E được dùng thật
> ở khối case và bảng điểm, không chỉ nằm trong trang demo.

### 18.1. Quyết định nền — rule book §17.5 và design plan §22.1

**Hồ sơ MT bỏ hẳn khối case/hỗ trợ**: timeline case, phương án, gợi ý trao đổi/tutor, form hoàn
thành case. **Không** giữ lại một card gọn ở cuối chỉ vì component đã có. Dữ liệu case và liên
kết lịch sử vẫn nguyên ở hồ sơ học viên; một liên kết `Hồ sơ học viên` ở đầu trang là đủ.

Đây là **thay thế** mục 20.2 khu vực C của design plan, không phải bổ sung.

### 18.2. Các bước

- [x] **Step 1: Gỡ khối case khỏi `MockDetailPage.tsx`.** Bỏ hẳn, không thu gọn. Giữ route và
      liên kết `Hồ sơ học viên`. *(Đã làm. Bỏ hẳn khối case, phương án, quy trình gợi ý, việc gắn với case và "Kết quả" — kể cả ở máy chủ: dữ liệu chi tiết lượt không còn `sosCase` · `caseSteps` · `caseHistory` · `tasks`. Còn liên kết `Hồ sơ học viên`. Route giữ nguyên.)*
- [x] **Step 2: Gộp hai bảng thành một.** Hiện có `Lịch theo kỹ năng` và `Điểm theo kỹ năng` lặp
      kỹ năng/hạn/trạng thái. Một bảng làm việc duy nhất, năm cột: **Kỹ năng · Lịch kiểm tra ·
      Điểm · Tình trạng và hạn · Thao tác**. *(Đã làm: `SkillWorkTable`, năm cột, một dòng mỗi bài nhập (L · R · W1 · W2 · S). Không còn chỗ nào lặp hạn hay trạng thái.)*
- [x] **Step 3: Thu gọn bốn thẻ kỹ năng + Overall.** Tiến độ đợt lên header qua `<KetQuaDot>`;
      điểm từng môn nằm ở dòng tương ứng. Không lặp năm ô lớn ngay dưới cùng bộ điểm. *(Đã làm: đầu trang có DUY NHẤT một chỗ đếm — `Đã có điểm 1/4 kỹ năng` + `<KetQuaDot>` + Kỳ vọng + Overall (cũng qua `<KetQuaDot phan="overall">`). Bỏ năm thẻ lớn; kết luận từng môn (Đạt/Dưới kỳ vọng) nằm ở dòng của môn. Câu tiêu đề `scheduleHeadline` không còn hiện ở màn này (máy chủ vẫn dựng cho danh sách) vì nó nói "Có điểm 1/4" bằng chữ khác `<KetQuaDot>`.)*
- [x] **Step 4: Mở tiêu chí ngay tại dòng.** W1/W2/S: bốn ô + `Lưu`/`Huỷ` tại dòng; đóng lại thấy
      điểm và ngày cập nhật. Writing tổng là **một dòng phụ** dưới W1/W2, nói rõ là điểm tính từ
      hai task — **không** có ô nhập Writing tổng thứ ba. *(Đã làm: `InlineScoreEditor` — L/R một ô, W1/W2/S bốn ô + `Lưu`/`Huỷ` ngay tại dòng; Enter lưu, Esc huỷ, `-` là lệnh. Dùng CHUNG hàm dựng lệnh (`rawPatchFrom` · `criteriaPatchFrom`) với bảng chấm cả lớp và khung tiêu chí cũ nên hai nơi nhập không lệch luật. Writing (tổng) là dòng phụ chỉ đọc. Bấm thử: nhập 6 / 6.5 / 6 / 6 → xem trước Band 6.0 → Enter → dòng hiện `Band 6.0 · 6 · 6.5 · 6 · 6`.)*
- [x] **Step 5: Bỏ nút `Đã thi` khỏi luồng chấm thường.** Có lịch và đúng quyền thì nhập được.
      Vắng là ngoại lệ có xác minh riêng; **không** tự ghi đã thi thật chỉ vì đến ngày. *(Đã làm. Bỏ nút `Đã thi` và `Bỏ xác nhận`. Ghi nhận vắng còn là ngoại lệ trong menu dòng (`Ghi nhận vắng`, `Bỏ ghi nhận vắng`). **Phát hiện ngoài kế hoạch:** chữ `Chưa xác nhận đã thi` (MT-P03) nằm ở `SKILL_PROGRESS_LABEL` của `shared/domain/fasttrack.ts`, không ở màn này — đã đổi thành `Chờ nhập điểm` (và `Đã thi, chờ nhập điểm`) nên đổi ở MỌI màn dùng nhãn này. Máy chủ đã đúng từ trước: có điểm thì tự suy ra đã thi, đến ngày không tự ghi — thêm phép kiểm khoá lại.)*
- [x] **Step 6: Một hành động chính mỗi dòng.** `Nhập/Sửa điểm` là nút chính. `Đổi lịch` · `Hẹn
      xử lý` · `Lịch sử` vào menu theo quyền. **`Huỷ lượt MT` rời khỏi đầu trang**, vào menu
      ngoại lệ của QL, phải nói rõ huỷ phần nào và giữ phần đã có điểm. *(Đã làm. Mỗi dòng MỘT nút chính chọn theo việc đang chặn dòng: đề nghị dời đang chờ → `Trả lời đề nghị`; đã vắng → `Xử lý vắng`; phần thi huỷ / chưa xếp tuần → `Khôi phục và đặt tuần`; còn lại `Nhập điểm`/`Sửa điểm`. Menu `Thêm`: `Đổi lịch` · `Hẹn xử lý` (bộ chữ: đổi tuần thi = Đổi lịch, lùi ngày chấm = Hẹn xử lý) · vắng · phạm vi · `Lịch sử`. `Huỷ lượt MT` + `Đổi lịch cả đợt` + `Hẹn xử lý cả đợt` nằm ở menu `Chỉnh lịch` đầu trang, chỉ hiện đúng quyền; hộp thoại huỷ nói rõ huỷ phần chưa có điểm, giữ phần đã có điểm. **Lưu ý:** máy chủ vẫn huỷ CẢ LƯỢT — chữ "huỷ phần nào" chỉ mô tả đúng hành vi đó, chưa có huỷ từng phần.)*
- [x] **Step 7: Áp `<Han>` vào khối case ở `SkillBoard.tsx`.** Đây là chỗ F11 sai: `Dự kiến kết
      thúc` của PA đang bị trình bày như hạn phải làm. Dùng `loai="du-kien-ket-thuc"` (trung
      tính) cho ngày dự kiến và `loai="cap-nhat-pa"` cho nghĩa vụ cập nhật tuần. *(Đã làm ở `SkillBoard.tsx`: hạn xác minh SOS → `xac-minh-sos`; hạn làm của phương án → `thuc-hien-y-thuc`; **dự kiến xong → `du-kien-ket-thuc` (luôn trung tính, không còn tô đỏ / "quá hạn")**; nghĩa vụ báo kết quả hằng tuần → `cap-nhat-pa`. Đã thấy `Xác minh nguyên nhân · hạn 16/09` trên hồ sơ học viên thật; **chưa thấy dòng phương án có hạn** vì dữ liệu demo hiện không có.)*
- [x] **Step 8: Người cập nhật ≠ người nhập điểm.** Ô điểm trống mà vẫn hiện "Người nhập" là sai
      (MT-P09). Tách hai khái niệm; không dùng tác giả thao tác làm bằng chứng đã có điểm. *(Đã làm, bằng TDD — và kế hoạch chẩn đoán SAI chỗ: đây không chỉ là lỗi hiển thị. Máy chủ ghi `entered_by`/`entered_at` cả khi một thao tác XOÁ điểm, nên ô trống vẫn mang tên "người nhập". Nay ô hoàn toàn trống thì hết người nhập; ô dở dang (mới một tiêu chí) vẫn giữ. Ai sửa gì, lúc nào nằm ở lịch sử (Step 9).)*
- [x] **Step 9: Lịch sử thay đổi thu gọn cuối trang.** Đếm số thay đổi; mở ra thấy ai sửa
      điểm/lịch/kỳ vọng/phạm vi, trước–sau, ngày và lý do. Không xếp log kỹ thuật ngang kết quả
      học tập. *(Đã làm: `scoreHistory` (đọc từ nhật ký `score.*`) + lịch/phạm vi trong MỘT dòng thời gian, thu gọn mặc định, đếm số thay đổi; trạng thái thi máy ghi bằng mã được đổi thành chữ. **Chưa làm:** lịch sử "kỳ vọng" — hệ thống không có bản ghi thay đổi kỳ vọng để hiện.)*

### 18.3. Nghiệm thu PR-I

- Dữ liệu Phạm Bảo Ngọc chỉ có R=7.0: R đạt, Overall ghi `Chưa đủ điểm`, **không** badge đạt.
- Đủ bốn môn nhưng một môn dưới kỳ vọng, Overall vẫn đạt: hai thông tin cùng đúng, trình bày riêng.
- Header và nội dung cùng nói `1/4`; không còn chỗ nào ghi `1/5 kỹ năng`.
- RLW tuần 14–20/09 và S tuần 21–27/09 cùng một đợt: hạn 23/09 và 30/09, bảng chấm đúng môn từng tuần.
- Trên hồ sơ MT **không còn** khối case/PA nào; bấm `Hồ sơ học viên` ra đủ case.
- Desktop bảng gọn; mobile mỗi bài một thẻ, chỉ vùng dữ liệu cuộn, không tràn ngang cả trang.
- Đủ ba vai GVBM · GVCN · QL, đi từ menu thật tới lưu và quay lại.

---

## 19. PR-H — Biên tập tiếng Việt toàn web

> **Chặng 5, làm cuối cùng.** Chạm gần như mọi file JSX nên chỉ quét một lần, sau khi PR-D và
> chặng 4 đã nằm trong nhánh.
>
> **Goal:** Một khái niệm gọi bằng đúng một chữ ở mọi màn. Bỏ các câu nói thiếu tự nhiên và các
> đoạn giải thích mô hình dữ liệu trên màn đọc.
>
> **Bộ chữ đầy đủ:** `thiet-ke/TU_DIEN_VA_CHU.md`. Mục này chỉ là cách áp dụng.

### 19.1. Các bước

- [x] **Step 1: Gom chuỗi hệ thống.** Nhãn nghiệp vụ về `shared/domain/*` theo đúng tám module;
      nhãn thuần trình bày về `web/src/ui/chu.ts`. Không hard-code tiếng Việt rải rác trong JSX. *(**Làm một phần.** Có `web/src/ui/chu.ts` cho các câu trình bày dùng từ hai nơi (tooltip tuần dự kiến hoàn tất, mốc kiểm tra FT/Normal, trạng thái rỗng phương án, việc "không kiểm tra kỹ năng trong đợt"); nhãn nghiệp vụ nằm ở `shared/domain` (`WORK_SCOPE_LABEL`, `needScoresText`, `SKILL_PROGRESS_LABEL`, `NEXT_STEP_LABEL`). **Chưa gom** mọi chữ tiếng Việt còn nằm trong JSX — làm hết là một đợt riêng và không kiểm được bằng một lệnh grep.)*
- [x] **Step 2: Mười hai khái niệm không được nhập làm một** (`TU_DIEN_VA_CHU.md` §1). Vi phạm
      bảng này là **lỗi nghiệp vụ**, không phải lỗi biên tập. *(**Làm bằng rà soát các chữ sai, chưa rà từng chuỗi.** Bắt được hai chỗ bảng §2 không có: `Hoàn thành phương án` (trong `NEXT_STEP_LABEL` và ở thẻ case) lẫn với `Hoàn thành case` → đổi thành `Kết thúc phương án`; thông báo máy chủ `Đóng case thì phải chọn hướng xử lý` → `Hoàn thành case…`. **`mức gấp` cố ý KHÔNG bị cấm trong phép quét:** bảng §1 cấm gọi kết quả SOS là "mức gấp", nhưng mức gấp của case là một khái niệm thật, riêng, đang dùng ở dữ liệu mẫu, luật hạn và giao diện — xem mục 14.)*
- [x] **Step 3: Áp bảng nhãn thay thế** (`TU_DIEN_VA_CHU.md` §2), theo từng nhóm màn. *(Đã làm mọi dòng của §2 có mặt trong mã: hồ sơ Test (`Thông tin đợt Mock Test`, `Tuần dự kiến hoàn tất`, `Mục tiêu tại thời điểm đánh giá`, `Kỹ năng không kiểm tra trong đợt này`), khối case (`Chưa có phương án hỗ trợ`, `Phương án đã áp dụng`, `Người thực hiện`, `+ Thêm phương án`), lớp/học viên (`Lộ trình`, dòng mốc kiểm tra theo loại lớp, bỏ dòng `Lớp là gốc…` và chân trang badge, `Có thể chọn tuần bắt đầu riêng cho từng học viên.`, `Thêm học viên` khi 0 dòng, `Xem N dòng cần sửa`), ô chọn `Người phụ trách`. **Hai chỗ đổi hành vi, không chỉ đổi chữ:** nút `Bỏ qua N dòng lỗi` bị bỏ (chỉ còn tick bỏ qua từng dòng, và nút mới chỉ đưa tới dòng đầu cần sửa); ô `Người phụ trách` mới có hai lựa chọn — `Chọn giáo viên` **chưa làm** vì cần lọc theo giáo viên ở máy chủ.)*
- [x] **Step 4: Trạng thái rỗng có ích.** Mỗi khối rỗng phải nói **thiếu cái gì + ai điền được +
      một nút**. Bỏ `Chưa có gì diễn ra`, `chưa ai bắt tay vào việc`, `chưa làm gì cho em thì
      chưa có gì để kết luận`. *(**Chỉ làm các câu bảng chữ nêu tên.** Ba câu cũ (`Chưa có gì diễn ra`, `chưa ai bắt tay vào việc`, `Chưa làm gì cho em…`) đã hết khỏi mã. **Chưa quét mọi `<Empty>`** xem đã nói đủ "thiếu gì + ai điền được + một nút" chưa.)*
- [x] **Step 5: Badge nói rõ đếm của ai.** `Bạn cần chấm: {n} bài` (việc riêng) hoặc `Lớp còn {n}
      bài chưa nhập điểm` (toàn lớp). Không vừa nói toàn lớp vừa dẫn tới việc riêng. *(Đã làm ở danh sách lớp và tổng quan lớp: `Bạn cần chấm: {n} bài` cho việc riêng, `Lớp còn {n} bài chưa nhập điểm` cho toàn lớp — máy chủ nay trả `workScope` cho từng lớp để giao diện KHÔNG phải đoán (đây là thay đổi ngoài kế hoạch). Tiêu đề danh sách `cần chấm` ở hàng đợi chưa đổi.)*
- [x] **Step 6: Bỏ chân trang giải thích.** Đơn vị đặt ở tên cột; công thức vào tooltip `Cách
      tính`. Nếu số bấm được thì **hình thức phải cho thấy điều đó**, không dạy bằng một đoạn văn. *(**Chỉ bỏ hai chân trang bảng chữ nêu tên** ở trang Học viên; ý "Case SOS đếm case, không đếm học viên" chuyển vào tooltip của badge. Các `SectionNote` khác trên nhiều màn **chưa bị quét**.)*
- [x] **Step 7: Quét mọi biến thể.** Trước khi đổi một chuỗi, `grep` toàn repo — kể cả test, seed
      và thông báo máy chủ. **Không chạm ghi chú thật do giáo viên nhập.** *(Đã làm: phép kiểm `PR-H · Grep các chuỗi cũ…` chạy đúng lệnh grep của tài liệu trên `web/src`, `shared`, `server/src` — kể cả chú thích — nên chữ cũ không quay lại lặng lẽ. Không chạm ghi chú do giáo viên nhập, seed hay test.)*

### 19.2. Nghiệm thu PR-H

- Mở từng màn ở ba vai, không nghiệm thu bằng một lần tìm–thay.
- `grep` các chuỗi cũ trong bảng §2 của bộ chữ → không còn kết quả nào ngoài file tài liệu.
- Câu có số liệu động lấy dữ liệu hiện hành; mô tả tại thời điểm phát sinh có nhãn lịch sử
  (`lúc mở: 2/4 kỹ năng`), không để hai câu đều trông như mô tả hiện tại.
- Không còn đại từ mơ hồ ("em này", "lượt đó", "máy", "chốt chung") trên giao diện.

---

## 20. Kho ý tưởng thiết kế bổ sung — ĐỀ XUẤT, chưa duyệt

> Kết quả buổi brainstorm 20/09/2026 của bên design, sau khi đọc rule book và design plan.
> **Không mục nào ở đây được code khi chưa có dòng tương ứng ở mục 3.** Đưa vào để lần sau khỏi
> nghĩ lại, không phải để làm hết.
>
> Khác với I01–I26 ở design plan §11 (ý tưởng sản phẩm), bảng này là **ý tưởng thiết kế/trình
> bày** — thứ bên design quyết được trong phạm vi đã giao.

| ID | Ý tưởng | Giải quyết việc gì | Chi phí | Nên làm khi nào |
|---|---|---|---|---|
| DS01 | Bản tin thứ Hai "Chốt cuối tuần": những bài vừa chuyển thành *Không dự thi*, ai bị ảnh hưởng, đường sửa nếu có quyền | Chốt tự động mà không ai biết là chốt âm thầm | Thấp | Ngay sau PR-G |
| DS02 | Đồng hồ đếm ngược nhẹ trong ô `-`: `Còn 2 ngày để sửa` — chỉ chữ, không tô đỏ | Người nhập biết mình còn cửa sửa | Rất thấp | Trong PR-G · **✔ đã làm ở PR-Rc1 (23/09)**, chỉ lớp FT (lớp thường ghi `Đã dời sang …`) |
| DS03 | Hoàn tác 10 giây cho nhập điểm, `-`, kết thúc phương án | Giảm sợ thao tác không đảo được | Trung bình | Sau PR-F |
| DS04 | Hộp **"Cách đọc"** mỗi trang, thay các chân trang dài | §18 bỏ chân trang nhưng phần giải thích vẫn cần một nhà | Thấp | Trong PR-H |
| DS05 | Quy ước URL thống nhất: route + tham số `phạm vi/tuần/đợt/kỹ năng`, Back giữ ngữ cảnh | Deep-link từ thông báo/badge/hành trình đang mỗi nơi một kiểu | Trung bình | Trước PR-I |
| DS06 | Thẻ **"Việc tiếp theo"** chuẩn: động từ + người + hạn | Hiện đang hiện một ngày cũ trơ trọi (F11, ảnh hồ sơ) | Thấp | Trong PR-I |
| DS07 | Cảnh báo trùng case **trước khi lưu**: gợi ý case đang mở cùng HV + cùng kỹ năng | Hai GV mở hai case cho một vấn đề | Trung bình | Sau PR-D |
| DS08 | Nhãn **"Có hỗ trợ đồng thời"** ngay trên dòng PA | Rule book §11 cấm quy tiến bộ cho riêng một PA | Thấp | Trong PR-F |
| DS09 | Trung tâm chất lượng dữ liệu: bốn danh sách — thiếu điểm · thiếu người phụ trách · thiếu nguyên nhân · thiếu kết quả, mỗi dòng một nút | Chỗ thiếu dữ liệu đang bị tô như chỗ ổn | Trung bình | Sau PR-F |
| DS10 | Bản tóm tắt bàn giao học viên/lớp, người nhận xác nhận | Đổi lớp/đổi GV đang làm mất mạch theo dõi | Trung bình | Sau PR-I |
| DS11 | Lưu chế độ xem cá nhân (bộ lọc đã đặt tên, chia sẻ bằng URL không vượt quyền) | GV lọc lại y hệt mỗi ngày | Trung bình | Sau DS05 |
| DS12 | Chế độ họp tuần: một trang chỉ đọc, in/xuất được, đi từ số liệu → quyết định → giao việc | Dùng lại report/task đang có, không tạo bản ghi tuần trùng | Cao | Sau PR-F |
| DS13 | Thư viện phương án theo vấn đề, có ghi **điều kiện áp dụng** và cỡ mẫu | GV tìm cách đã có người thử | Cao | Sau nền số ổn |
| DS14 | Skeleton đúng hình dáng bảng thật, thay spinner giữa màn | Nhảy bố cục khi tải xong | Rất thấp | Trong PR-E |
| DS15 | Script CI kiểm tương phản và cỡ chữ tối thiểu | "Chữ nhỏ mờ cho kết quả/hạn" là lỗi lặp lại | Thấp | Sau PR-E |
| DS16 | Script quét chuỗi tiếng Việt hard-code ngoài bộ chữ | Biên tập một lần rồi lại trôi | Thấp | Cuối PR-H |
| DS17 | Bắt buộc ảnh trước/sau cho mỗi PR có sửa UI, lưu ở `thiet-ke/anh/` | Nghiệm thu đang dựa vào "component đã có" | Rất thấp | Từ PR-E trở đi |
| DS18 | Trang demo component nội bộ (đã đưa vào PR-E Step 9) | Không có nơi thử sáu trạng thái của một component | Thấp | PR-E |

### 20.1. Ba ý tưởng bị loại, ghi lại để khỏi đề xuất lần nữa

- **Điểm tổng hợp "chất lượng giáo viên".** Rule book §11 và D02 cấm xếp hạng bằng số SOS thô;
  một con số gộp còn khó giải thích hơn. Muốn có rubric đánh giá GV thì phải chốt riêng.
- **Risk score tổng hợp cho học viên.** Design plan §4.1 đã loại: không thêm điểm rủi ro khó
  giải thích. Thứ tự ưu tiên công việc dùng tiêu chí hiển thị rõ, người dùng đổi được.
- **Kanban/Gantt làm mặc định cho Công việc.** Bảng là mặc định; Kanban chỉ là tuỳ chọn *sau*
  nếu thực tế có nhu cầu kéo việc (design plan §7.2).

---

## 21. Thứ tự merge và cách gỡ xung đột

> Viết cho chủ sản phẩm — người **không đọc code**. Mục này trả lời đúng một câu: *"có hai
> nhánh, kéo cái nào trước?"*

### 21.1. Câu trả lời ngắn: PR-D TRƯỚC, luôn luôn

**Merge PR-D vào `main` trước. Rồi mới tới nhánh batch.** Không bao giờ ngược lại.

Lý do, nói bằng tiếng Việt thường: PR-D đang **gỡ bỏ và xếp lại** những khối giao diện cũ.
Nhánh batch thì **thêm cái mới lên trên**. Nếu gỡ trước rồi mới thêm, cái mới được đặt lên một
nền đã sạch — máy tự ghép được. Nếu thêm trước rồi mới gỡ, PR-D phải đi gỡ những khối vừa được
thêm vào mà nó chưa từng thấy — chỗ nào cũng phải quyết định bằng tay.

Cùng một lượng công việc, nhưng một thứ tự thì máy làm, thứ tự kia thì người làm.

### 21.2. Trình tự đầy đủ

| Bước | Việc | Lệnh |
|---|---|---|
| 1 | Session batch làm xong **chặng 1–3** (PR-E, PR-F, PR-G), commit sạch, `npm run check` xanh | — |
| 2 | Session PR-D làm xong, đẩy nhánh lên, **mở PR và merge vào `main`** | — |
| 3 | Kéo `main` mới về nhánh batch | `git fetch origin && git merge origin/main` |
| 4 | Gỡ xung đột nếu có — xem 21.4 | — |
| 5 | Chạy lại `npm run check`, bấm thử thật | mục 13.1 · 13.2 |
| 6 | Làm tiếp **chặng 4–5** (PR-I, PR-H) trên nền đã có PR-D | — |
| 7 | Mở PR cho nhánh batch, merge vào `main` | — |

Bước 3 dùng **merge**, không dùng `rebase`. Nhánh batch lúc đó đã có ba chặng commit; rebase sẽ
phát lại từng commit lên nền mới và bắt gỡ xung đột nhiều lần cho cùng một chỗ. Merge chỉ hỏi
một lần.

### 21.3. Nếu PR-D chưa xong mà chặng 1–3 đã xong

Đây là tình huống dễ xảy ra nhất khi chủ sản phẩm đi vắng. **Đừng ngồi chờ, và cũng đừng lao
vào sửa năm file kia.** Chọn một trong hai:

**Cách A — khuyến nghị.** Mở PR cho chặng 1–3 ngay, merge vào `main`. PR-D sau đó kéo `main` về
và tự gỡ phần của nó. Phần xung đột rơi vào session PR-D, là session **đang mở đúng những file
đó** nên biết rõ nhất. Chặng 4–5 làm sau, ở một lượt riêng.

**Cách B.** Nếu session PR-D đã dừng hẳn hoặc chưa làm được gì (`git branch -a | grep pr-d`
không thấy nhánh nào trên `origin`), thì session batch làm luôn PR-D theo mục 11 như **chặng
3.5**, rồi chạy tiếp chặng 4–5. Một nhánh làm tất, không còn xung đột nào cả.

Chọn cách B thì báo cho session kia dừng trước, **đừng để hai nơi cùng sửa `SkillBoard.tsx`**.

### 21.4. Bốn loại xung đột có thể gặp, và cách gỡ từng loại

| File | Vì sao đụng nhau | Cách gỡ |
|---|---|---|
| `plan.md` | PR-D đánh dấu `- [x]` ở **mục 11**; batch sửa **mục 15–21** và thêm dòng vào **mục 14** | **Giữ cả hai bên.** Hai bên sửa hai mục khác nhau, không bên nào đè lên nội dung của bên kia. Xung đột chỉ vì hai đoạn nằm gần nhau |
| `server/src/tests/run.ts` | Cả hai cùng **thêm phép kiểm vào cuối file** | **Giữ cả hai bên**, nối phép kiểm của batch xuống dưới phép kiểm của PR-D. Đã xảy ra đúng kiểu này ở lần hợp nhất PR-C (mục 14) — thuần cộng dồn |
| `BAN_GIAO.md` | Cả hai cùng cập nhật trạng thái bàn giao | **Giữ bản của PR-D**, rồi thêm một đoạn mới cho batch. Đừng cố trộn hai câu thành một |
| Năm file ở mục 0.5 | Chỉ xảy ra nếu chặng 1–3 lỡ chạm vào | **Giữ hoàn toàn bản của PR-D**, bỏ phần của batch, rồi làm lại thay đổi đó ở chặng 4. Tuyệt đối không cố ghép tay — PR-D đã xếp lại cấu trúc file, ghép tay sẽ ra một file không giống bên nào |

Ba dòng đầu đều là **cộng dồn**: không có mâu thuẫn nghiệp vụ thật, chỉ là hai người cùng viết
thêm vào một chỗ. Dòng cuối là loại duy nhất phải bỏ đi một bên — và nếu chặng 1–3 làm đúng mục
0.5 thì nó sẽ không xảy ra.

### 21.5. Dấu hiệu đã gỡ sai

Sau khi gỡ xong, kiểm ba điều này trước khi commit:

1. `npm run check` (mục 13.1) **xanh hết** — không phải "chỉ còn vài lỗi cũ".
2. Mở tay hồ sơ học viên **Lê Quang Huy** (`/hoc-vien/3`): mỗi case đọc ở **một** khối, không có
   khối lồng khối. Nếu thấy hai khối hiện cùng một case → đã giữ nhầm bản cũ của PR-D.
3. `git diff origin/main --stat` xem có file nào **bị mất nội dung** không. Một file JSX đột ngột
   ngắn đi vài trăm dòng là dấu hiệu gỡ xung đột đã bỏ mất một bên.

Gỡ sai thì `git merge --abort` rồi làm lại — rẻ hơn nhiều so với đi tìm một khối giao diện biến
mất sau khi đã commit.

### 21.6. Không làm những việc này

- **Không `git push --force`** lên nhánh PR-D. Đó là nhánh của session khác; ép đẩy là xoá việc
  của họ.
- **Không `rebase`** nhánh batch sau khi đã có ba chặng commit (lý do ở 21.2 bước 3).
- **Không merge nhánh batch vào nhánh PR-D** để "cho nó có sẵn component mới". Làm vậy là đảo
  ngược thứ tự ở 21.1 và kéo toàn bộ xung đột về đúng session đang bận nhất.
- **Không gộp năm chặng thành một commit.** Hỏng ở chặng 4 thì không lùi lại được.

---

# 22. LỘ TRÌNH HIỆN HÀNH — 8 PR, chốt 21/09/2026

**Mục này thay mục 4.** Mục 4 là lộ trình của đợt trước (PR1 → PR-H), đã xong và merge ở PR 30.

## 22.0. Đọc gì trước khi gõ dòng code đầu tiên

Theo đúng thứ tự. Bỏ bước nào là làm lại bước đó.

| # | File | Vì sao |
|---|---|---|
| 1 | `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` | Nguồn mới nhất của chủ sản phẩm. Bỏ hẳn mô hình Case Ý thức |
| 2 | `thiet-ke/PISA-Rulebook-2026-09-19.md` **mục 18** | Luật. Mục 18 ưu tiên hơn mục 17, mục 17 ưu tiên hơn mọi mô tả cũ |
| 3 | `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | Đặc tả tới mức DDL, luật có mã (V/B/W), bảy màn, 24 mục nghiệm thu |
| 4 | `thiet-ke/BAN_DO_OVERHAUL.md` | Yêu cầu nào của design plan đã có, cái nào chưa, PR nào làm |
| 5 | `thiet-ke/HE_GIAO_DIEN.md` · `HOP_DONG_SO_LIEU.md` · `TU_DIEN_VA_CHU.md` | Trước khi dựng màn, trước khi code một con số, trước khi viết một chữ |
| 6 | `plan.md` mục 0–3 và **mục 12** (nợ cũ) | Quy tắc cập nhật, quyết định đã chốt, và việc còn nợ |

**Ba thứ tuyệt đối không làm:**

- Đừng đổi tên bảng `sos_cases`. Nó chạm hàng trăm câu truy vấn và không mang lại gì cho người dùng.
- Đừng xoá hằng số `C03_*` và `C04_*` trong `policy.ts`. Ghi "hết hiệu lực 21/09/2026" kèm lý do.
- Đừng viết phép đếm thứ hai cho một khái niệm đã có hàm chỉ số. Gọi hàm đó.

## 22.1. Bản đồ 8 PR và lý do thứ tự

```
CHẶNG A — NỀN (2 PR · không đổi mặt ngoài)
  PR-N  Nền số liệu + kho bằng chứng
  PR-J  Ý thức — nền dữ liệu
  ▶ chủ sản phẩm chỉ đọc báo cáo, không cần bấm

CHẶNG B — Ý THỨC + KHUNG (2 PR)
  PR-O  Điều hướng bốn khu vực
  PR-K  Ý thức — giao diện đầy đủ
  ▶ KIỂM 1: bấm thử bằng GVBM · GVCN · Quản lý

CHẶNG C — OVERHAUL BẢY TRANG (3 PR)
  PR-P  Tổng quan + Phân tích          ▶ KIỂM 2
  PR-Q  Học viên & Lớp + Hồ sơ lớp + Hồ sơ HV + Hành trình   ▶ KIỂM 3
  PR-R  Công việc + Kế hoạch Test + đường vào nhập điểm      ▶ KIỂM 4

CHẶNG D — DỌN VÀ CHỐT (1 PR)
  PR-S  Học thuật theo rule mới + biên tập chữ + nợ kỹ thuật ▶ KIỂM 5
```

**Ba lý do cho thứ tự này, đọc kỹ vì làm sai là làm lại:**

1. **PR-N đứng đầu, trước cả Ý thức.** Bốn hàm chỉ số đang trả lỗi `501`
   (`hv-duoi-ky-vong-mon`, `hv-sos-hien-tai`, `dung-han-cap-nhat`, `do-phu-danh-gia`) **chặn**
   Tổng quan mới (§18.2) và Phân tích. Nếu dựng màn trước, người code sẽ tự viết phép đếm thứ
   hai — đúng lỗi "badge ghi 28, bấm vào ra 0", và lần này khó thấy hơn vì hai phép đếm sẽ
   **khớp nhau trên dữ liệu demo** rồi lệch khi dữ liệu thật vào. Bảng `attachments` cũng ở đây
   vì Ý thức cần nó ngay.
2. **PR-O (khung điều hướng) trước PR-P/Q/R.** Đổi điều hướng sau khi đã overhaul bảy trang là
   sửa bảy trang hai lần.
3. **Biên tập chữ ở PR cuối.** Nó chạm gần mọi file JSX; làm sớm là quét hai lần.

**Không chạy song song hai session.** PR-J/PR-K và PR-P/PR-Q cùng sửa `StudentDetailPage.tsx`,
`ClassOverviewPage.tsx`, `IssueAnalysis.tsx`. Hai nhánh cùng sửa ba file đó là xung đột chắc chắn.

---

## 22.2. PR-N — Nền số liệu và kho bằng chứng

**Mục tiêu người dùng thấy:** chưa thấy gì mới. Đây là PR mở đường — nhưng nó đóng một lỗi P0
đang làm số sai mà người xem không phát hiện được.

### Bước

- [x] **N1. Bốn hàm chỉ số đang trả 501.** Viết hàm trả **tập ID** cho
      `hv-sos-hien-tai`, `hv-duoi-ky-vong-mon`, `dung-han-cap-nhat`, `do-phu-danh-gia`.
      Định nghĩa bắt buộc: `thiet-ke/HOP_DONG_SO_LIEU.md` mục 2. Khai đủ tám trường ở
      `shared/domain/metrics.ts`. Mỗi hàm một phép kiểm so `số` với `danh sách`. *(Đã làm. Hàm ở `server/src/worklist/danhGia.ts` + `metrics.ts`; sổ chỉ số ở `shared/domain/metrics.ts` đã sửa lời cho khớp. **Chỗ hợp đồng để ngỏ, đã chọn và ghi vào sổ:** (a) "hiện tại" chỉ tính em ĐANG HỌC; (b) phạm vi theo NƠI EM ĐANG HỌC chứ không theo lớp của từng lượt — nếu lọc theo lớp của lượt thì Quản lý một chi nhánh đọc sai "đợt mới nhất" của em vừa chuyển tới; (c) "đợt mới nhất hợp lệ" = không huỷ + đã có ít nhất một kỹ năng có điểm, xếp theo tuần kế hoạch → số MT → id; (d) `hv-duoi-ky-vong-mon` nhận `?skill=` (Listening/Reading/Writing/Speaking, môn lạ bị từ chối), không nêu môn thì "bất kỳ môn nào"; mẫu số trả ở `denominatorIds`; (e) `dung-han-cap-nhat`: nghĩa vụ = MỘT phương án × MỘT chu kỳ, mã `id phương án × 1000 + chu kỳ`; "đến hạn" là hạn < ngày dữ liệu (cùng luật với `pa-can-cap-nhat`); mặc định mọi nghĩa vụ đã qua hạn, giới hạn kỳ bằng `?from=&to=`; loại phương án chờ duyệt, case Ý thức và case nhập bù; (f) `do-phu-danh-gia`: mẫu số = em đang học có ít nhất một đợt không huỷ đã đến lịch (kể cả chưa chấm), tử số = đợt đã đến lịch mới nhất đủ điểm — em chấm đủ mà trượt vẫn "có dữ liệu". SOS tạm thời / kết quả cuối trả ở `splits`. 4 phép kiểm, mỗi phép so với SỰ THẬT ĐỘC LẬP dựng bằng SQL.)*
- [x] **N2. DATA-01 (P0).** `server/src/worklist/weekly.ts` lọc phạm vi ở tập đợt thi, nhưng
      các phép đếm case/HV/chờ duyệt sau đó **chỉ** lọc `planned_period_id` → hai chi nhánh cùng
      tuần cộng lẫn số của nhau. Sửa: dùng chính tập attempt ID đã được phép; danh sách khi bấm
      số dùng **cùng tập đó**. Phép kiểm: hai chi nhánh cùng tuần, số của CN A không chứa CN B. *(**Kế hoạch SAI ở đây — xem mục 14.** DATA-01 đã được PR-F đóng ở chặng 2 (commit `012d9f8`, `weekly.ts` lọc theo tập lượt đã được phép, phép kiểm F01); `plan.md` 12.1 và `BAN_DO_OVERHAUL.md` vẫn ghi "chưa làm". Việc thật còn lại của N2 là hai chỗ khác, đã làm: (a) danh sách khi bấm một số của bảng tuần là CHÍNH tập ID sinh ra số đó — `weeklyDrill` + route `GET /weekly-rollup/ids`, mọi số của bảng là `.size` của một tập; (b) **luật 4 bị vi phạm ở giao diện:** hàng tháng và hàng tổng của "HV có case" cộng số học viên của từng tuần — trên dữ liệu demo là **22 trong khi số học viên duy nhất là 20**. Nay máy chủ trả `totals.caseStudents` và `totals.byMonth` đếm duy nhất, giao diện dùng hai số đó. Chưa nối các ô của bảng tuần vào panel danh sách (đó là việc của bảng "Theo tuần" ở PR-P).)*
- [x] **N3. Đưa số trần qua hợp đồng số liệu.** `branchpulse.ts` (bảng "Việc cần lưu ý", sáu
      cột), "Theo chi nhánh" và các cột bảng phân tích đang dùng bộ đếm riêng. Chúng khớp với
      `<SoLieu>` **nhờ may**, không nhờ cấu trúc. Cho chúng gọi hàm chỉ số. *(Đã làm — và **giả định "khớp nhau nhờ may" của kế hoạch là YẾU: chúng đã LỆCH thật.** Trên dữ liệu của bộ kiểm thử bảng "Việc cần lưu ý" ghi 79 case / 28 học viên / 27 thiếu phương án / 6 quá hạn cập nhật; sổ chỉ số ghi 81 / 29 / 28 / 31. Bốn nguyên nhân: hai case rơi khỏi bảng vì lớp không còn hoạt động; "quá hạn cập nhật" đếm CASE còn chỉ số đếm PHƯƠNG ÁN; case chia về lớp LÚC ĐÁNH GIÁ thay vì nơi em ĐANG được chăm sóc (rule book §11); và cộng số học viên qua các lớp (luật 4). Nay `branchPulse` lấy năm tập ID từ `metricSet` (cùng hàm với `<SoLieu>`) rồi chỉ CHIA về lớp / nhóm / chi nhánh; hàng tổng là chính tập gốc; mỗi hàng kèm `ids`. **Thêm chỉ số `pa-cho-duyet`** vì sổ 11 chỉ số không có chỉ số nào cho cột "Đề xuất chờ duyệt". **"Thiếu phương án" có BA định nghĩa** (chỉ số · bảng phân tích · bảng theo tuần · bảng theo loại vấn đề); nay cả bốn gọi `isNoPlanCase` ở `shared/domain/cases.ts` — thay đổi hành vi: case đã chọn hướng "chỉ theo dõi" hoặc đã có phương án bị huỷ KHÔNG còn bị tính là thiếu phương án ở bảng phân tích và bảng tuần. Cột "Quá hạn cập nhật case" của bảng đổi tên "Phương án cần cập nhật" cho đúng đơn vị. **Chưa làm:** các ô của bảng "Việc cần lưu ý" và bảng phân tích chưa mở panel danh sách bằng `<SoLieu>` (số và tập ID đã khớp, còn nối giao diện là PR-P); cột "MT chưa nhập / quá hạn nhập" của bảng theo giáo viên và cột "Sĩ số" không phải chỉ số của sổ nên vẫn đếm riêng.)*
- [x] **N4. `GET /metrics/:id` không trả `ids`** khi không có `rows=1`. *(Đã làm: `metricResponse` — đường lấy số chỉ trả `n`, `numerator`, `denominator`, `splits` (số); `ids`, `numeratorIds`, `denominatorIds`, `splitIds` và `rows` chỉ có khi xin `rows=1`. Ô số ở Tổng quan không đổi vì chỉ đọc `n`. Thêm `?skill=` `?from=` `?to=` cho route.)*
- [x] **N5. Bảng `attachments` dùng chung.** DDL ở `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §4.5.
      `server/src/platform/attachments.ts`: thêm/xoá/liệt kê, `owner_type` ∈
      `sos_case | case_intervention | violation | discipline_measure`. Ba luật bắt buộc:
      (a) lỗi tải tệp **không làm mất nội dung đang nhập** — tải là request riêng;
      (b) quyền xem tệp = quyền xem bản ghi chủ, không có đường tải nào bỏ qua kiểm quyền;
      (c) xoá tệp có audit. *(Đã làm. Bảng có ở cả `schema.sql` (DB mới) và `migrate.ts` (DB cũ, chạy lặp không lỗi) — nhớ `npm run migrate` trên DB dev. `server/src/platform/attachments.ts`: liệt kê / thêm liên kết / thêm tệp / mở / gỡ; đuôi được nhận và mức 10 MB nằm ở `shared/domain/attachments.ts` để máy chủ và giao diện đọc CÙNG một danh sách. Tệp lưu ở `data/uploads/<loại>/<uuid>.<đuôi>` (đã nằm trong .gitignore), tên do máy chủ sinh — tên người dùng chỉ là tên hiển thị; đường dẫn máy chủ **không bao giờ** ra khỏi API. Đường tải duy nhất là `GET /api/attachments/:id/download`, kiểm quyền xem bản ghi chủ trước khi mở tệp. Quyền thêm/gỡ = quyền SỬA bản ghi chủ, lấy từ chính `caseAccess` của case (luật C02: GV đúng môn); phương án thừa hưởng quyền của case chứa nó. Thêm và gỡ đều ghi audit. Liên kết chỉ nhận http/https. Không nhận .html/.svg/.exe/.sh (thứ chạy được trong trình duyệt của người tải). Loại `violation` và `discipline_measure` **chưa có nơi chủ** (chờ PR-J) — hiện bị từ chối rõ ràng chứ không lặng lẽ nhận, phép kiểm có khoá điều này. **Kế hoạch thiếu:** không nói tệp lưu ở đâu, giới hạn dung lượng, đuôi nào được nhận, và chưa có đường tải nào — đã chọn và ghi ở trên.)*
- [x] **N6. `web/src/ui/BangChung.tsx`** — khối "Bằng chứng" dùng chung: `+ Đính kèm tệp` /
      `+ Thêm liên kết`, danh sách có tên hiển thị, người tải, ngày. Nối vào **case và phương án
      học thuật** ngay trong PR này (đóng CASE-04 đang tồn ở mục 12.2). *(Đã làm. Khối gắn ở thẻ case (`SkillBoard.tsx`, không gắn cho case Ý thức cũ), trong lịch sử từng phương án (chỉ tải danh sách khi mở dòng đó) và ở `CasePanel.tsx`. **Luật (a) làm bằng cấu trúc, không bằng lời hứa:** khối này không nằm trong form nào, tải tệp là một request riêng, trạng thái lỗi nằm ở DÒNG tệp đó kèm "Thử lại"/"Bỏ" — nên ô mô tả người dùng đang gõ ở bên cạnh không bị đụng tới. Gỡ tệp có bước xác nhận ("Việc này được ghi lại"). Bấm thử trình duyệt thật: xem Bằng chứng ở dưới.)*

### Nghiệm thu PR-N

1. Gọi `GET /metrics/hv-duoi-ky-vong-mon` trả số; bấm mở danh sách ra **đúng** tập tạo nên số đó.
2. Hai chi nhánh cùng một tuần: số của mỗi bên **không** chứa học viên của bên kia.
3. Bảng "Việc cần lưu ý" và `<SoLieu>` cùng một con số **vì gọi cùng hàm**, chứng minh bằng
      cách đổi dữ liệu demo rồi thấy cả hai đổi theo.
4. Tải một tệp vào case học thuật, ngắt mạng giữa lúc nhập mô tả → **mô tả còn nguyên**, lỗi
      hiện tại dòng tệp.
5. Người không có quyền xem case gọi thẳng đường tải tệp của case đó → bị từ chối.
6. `npm run check` xanh; số phép kiểm chỉ tăng.

**Kết quả nghiệm thu (21/09/2026, session PR-N):** (1) ✅ cả 12 chỉ số trả số và danh sách cùng một tập, phép kiểm chạy đủ 12; (2) ✅ hai chi nhánh cùng tuần không lẫn (2 phép kiểm luật 4 + drill-down); (3) ✅ bấm thử: thêm một case chưa có phương án bằng API thì bảng "Việc cần lưu ý" và ô số **cùng** lên 23/8; (4) ✅ bấm thử trình duyệt thật với `scenario: save_failure` (máy chủ từ chối ghi): tải tệp báo lỗi ngay tại dòng tệp, kèm "Thử lại", còn mô tả đang gõ ở ô bên cạnh **còn nguyên**; (5) ✅ phép kiểm cấp dịch vụ + bấm thử: GV Monbay gọi đường tải/danh sách của case ngoài phạm vi nhận 403, quản lý đúng chi nhánh thì được; **không có phép kiểm HTTP trong repo** (quyết định PR2a ở mục 14), nên đường multer/download được kiểm bằng trình duyệt thật chứ không bằng `npm test`; (6) ✅ `npm run check` xanh, 445 phép kiểm (từ 437).

---

## 22.3. PR-J — Ý thức, nền dữ liệu

**Mục tiêu:** mô hình mới chạy được ở máy chủ; mô hình Case Ý thức bị gỡ sạch. Chưa có màn nào.

### Bước

- [x] **J1. Năm bảng.** `violations` · `discipline_measures` · `measure_violations` ·
      `violation_history`. DDL nguyên văn ở `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §4.
      **Chép đúng, kể cả chú thích** — chú thích giải thích vì sao KHÔNG có cột nào. *(Đã làm. **Bốn bảng mới chứ không phải năm** — bảng thứ năm là `attachments`, đã dựng ở PR-N; kế hoạch đếm nhầm. DDL chép BẰNG SCRIPT từ chính file đặc tả (không gõ lại tay) vào `schema.sql` và `migrate.ts`; phép kiểm so cột từng bảng với đặc tả và khoá "không có `severity`/`status`/`due_date`/`episode_no`/`urgency`".)*
- [x] **J2. `shared/domain/yThuc.ts`.** `VIOLATION_CATEGORIES` (5) · `MEASURE_KINDS` (9, xếp
      nhẹ→nặng) · `MEASURE_KIND_LABEL` · `MEASURE_REQUIRED_FIELDS` (bảng §5.4) ·
      `WARNING_CHAIN` · `CANH_BAO_NGAY = 5` · `Y01_*`, `Y02_*` theo luật `LUAT_CHO_CHOT.md` §1.
- [x] **J3. `server/src/yThuc/violations.ts`.** Ghi (V01–V08) · sửa (V09–V10) · đánh dấu không
      chính xác (V11–V14) · cảnh báo trùng mềm V06 trả về bản ghi đang có, **không chặn**.
- [x] **J4. `server/src/yThuc/measures.ts`.** Tạo (B01–B05) · **chuỗi Thư cảnh cáo B06–B08 kiểm
      ở máy chủ, phạm vi lộ trình** · sửa khi `preparing` (B09, B11) · khoá khi `done` (B10) ·
      xoá (B12) · xác nhận (B13–B16) với ô bắt buộc theo loại.
- [x] **J5. Cảnh báo 5 ngày.** Một hàm duy nhất theo định nghĩa §5.5. Dùng lại ở cả ba nơi W05.
- [x] **J6. `server/src/yThuc/thongKe.ts`.** Tám chỉ số mới, mỗi cái một hàm trả tập ID
      (`HOP_DONG_SO_LIEU.md` §5). Sửa định nghĩa ba chỉ số cũ thành "chỉ case học thuật". *(Đã làm.
      Lời định nghĩa ba chỉ số cũ đã sửa ở sổ chỉ số; bộ lọc trong mã tự thành "chỉ học thuật" khi gỡ `track`, và phép kiểm
      "Ý thức nằm ngoài mọi bảng hiệu quả" khoá điều đó.)*
- [x] **J7. Quyền.** Bảng §6 vào `server/src/permissions.ts`. **C02 không áp cho Ý thức** —
      C02 là luật của case học thuật; vi phạm không thuộc kỹ năng nào.
- [x] **J8. Đường API.** `server/src/routes/index.ts`. Thông báo cho Quản lý khi một
      `warning_1/2/3` hoặc `suspension` được xác nhận (Y01 — thông báo, **không** phải duyệt).
- [x] **J9. GỠ mô hình cũ.** Checklist 36 file ở `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §9.1 và §9.2.
      Làm theo đúng thứ tự: `shared/domain` → `server/src/cases` → `server/src/worklist` →
      `seed`. Giữ hằng số `C03_*`/`C04_*` kèm chú thích "hết hiệu lực 21/09/2026". *(Đã làm, kể cả
      phần web tối thiểu để `npm run typecheck` xanh — xem dòng mục 14. Chữ `behaviour` chỉ còn ở
      MỘT dòng `migrate.ts` có ghi ngày; phép kiểm quét mã khoá điều đó.)*
- [x] **J10. Reseed demo.** 18 tình huống ở §10. Sửa `server/src/seed/students.ts` +
      `journeys.ts` + `build.ts`. Viết lại hai tệp demo cũ thành **một file gọn** `DEMO.md`; xoá hai
      file cũ. *(Đã làm: thêm `server/src/seed/yThucSeed.ts` cho phần Ý thức; `DEMO.md` có bảng 18 tình
      huống; hai tệp cũ đã xoá và mọi đường dẫn tới chúng đã sửa.)*
- [x] **J11. Phép kiểm.** Ít nhất một phép kiểm cho mỗi mã luật V01–V14, B01–B16, W01–W06. *(Đã làm, kèm
      mười tám phép kiểm soi dữ liệu demo ở phần "PR-J · 0" của `yThuc.tests.ts`.)*

### Bảy chỗ dễ sai nhất của PR-J

1. **Gỡ cột `track` sót một nơi** → case học thuật hỏng. Grep `track` trong `server/src/cases/`
   **và** `shared/domain/cases.ts` **và** `seed/`.
2. **`CASE_CATEGORIES` từ 6 xuống 5.** Mọi bảng có cột thứ sáu phải bỏ cột đó, không để cột rỗng.
3. **`CONTACT_KINDS`** (`talk_student`/`talk_parent`/`warning_letter`) là chỗ dễ sót nhất — nó
   rải ở `cases.ts`, `effectiveness.ts`, `classBehaviourBoard`, `ClassBehaviourBoard.tsx`.
4. **Chuỗi Thư cảnh cáo phải kiểm ở máy chủ**, không chỉ ẩn nút. Có phép kiểm gọi thẳng API.
5. **`violation_count_at_confirm` là snapshot** — không đếm lại. Hủy một vi phạm sau đó **không**
   đổi số này, nhưng **có** đổi thống kê vi phạm. Hai con số, hai câu hỏi.
6. **Vi phạm `valid = 0` phải ra khỏi mọi thống kê** nhưng **ở lại** lịch sử học viên.
7. **Cảnh báo 5 ngày dùng một hàm duy nhất.** Ba nơi hiển thị gọi cùng hàm đó.

### Nghiệm thu PR-J

Bộ 24 mục ở `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §12, phần kiểm được ở tầng máy chủ:
mục 5 · 6 · 7 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 19 · 22 · 23 · 24.
Cộng thêm: `npm run check` xanh, `npm run seed` chạy lại được, và
`grep -rn "behaviour" server/src shared` chỉ còn chú thích lịch sử **có ghi ngày**.

---

## 22.4. PR-O — Điều hướng bốn khu vực

**Mục tiêu:** `Tổng quan / Học viên & Lớp / Test / Công việc` (D01, quyết định 20/09, chưa làm).
**Chỉ dựng khung.** Nội dung từng trang giữ nguyên, đổi ở PR-P/Q/R.

### Bước

- [ ] **O1.** `web/src/App.tsx` → `NAV` thành bốn mục. Hiện tại ba mục và **không có khu vực Test**.
- [ ] **O2.** Khu vực **Test** là điểm đến mới: hàng đợi chấm, lịch Test, Kế hoạch Test, hồ sơ đợt.
      Gom các route Test đang rải rác (`/nhap-diem/:classId`, `/bang-diem-thuong/:classId`,
      `/mock-test/:id`) về dưới khu vực này. Nhập điểm **luôn có lối trực tiếp** ở đây.
- [ ] **O3.** Tổng quan có hai tab `Tổng quan | Phân tích`, **URL riêng** cho tab Phân tích để
      đi thẳng được (§18.3). Chưa đổi nội dung Phân tích.
- [ ] **O4.** Đổi nhãn `Học viên` → `Học viên & Lớp` (§18.5).
- [ ] **O5. Redirect mọi link cũ.** Đã có tiền lệ tốt trong repo: `LegacySheetRedirect`,
      `/hop-tuan → /tien-trinh`, `/mock-test → /hoc-vien`. Làm y hệt cho mọi đường bị đổi.
      **Một link chết đắt hơn là chưa đổi điều hướng.**
- [ ] **O6.** Hiển thị theo capability, không theo tên vai (§17.1). Phần không có quyền thì
      **bỏ hẳn**, không để ô khoá lớn chiếm diện tích.

### Nghiệm thu PR-O

1. Bốn khu vực hiện đúng với Quản lý; GVBM không thấy mục không có quyền, và **không** thấy ô khoá.
2. Mọi URL trong `git grep -n "to=\"/"` cũ còn mở được (trực tiếp hoặc qua redirect).
3. Tab Phân tích mở được bằng URL trực tiếp, `Back` giữ ngữ cảnh.
4. Khổ 375px: bốn mục không tràn, không cuộn ngang cả trang.

---

## 22.5. PR-K — Ý thức, giao diện đầy đủ

**Mục tiêu:** GVBM ghi vi phạm trong 15 giây; GVCN gom vi phạm và xác nhận biện pháp trong một trang.

Bố cục từng màn: `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §7, có sơ đồ ASCII cho từng panel. **Dựng
theo đúng sơ đồ đó**, kể cả thứ tự ô và vị trí nút.

### Bước

- [ ] **K1.** `web/src/modules/yThuc/ViolationForm.tsx` — panel Ghi vi phạm (§7.2).
      Năm nhóm là **năm radio bày phẳng**, không dropdown. Cảnh báo trùng **trong form**.
      Nút `Ghi vi phạm` đặt ở **dòng học viên trong bảng lớp**, không phải trong hồ sơ em.
      Lưu xong: toast + `Hoàn tác` 10 giây, con trỏ về đúng dòng để ghi tiếp em khác.
- [ ] **K2.** `ClassViolationBoard.tsx` — tab `Ý thức` của hồ sơ lớp, **ba khu vực** (§7.3).
      Gom theo **học viên**, không theo ngày. Tuổi `⚠9n` cạnh từng dòng. Thanh `Đã chọn` dính
      đáy khu vực 1. Khu 2 **luôn mở**, và nói trước "cần tệp gì".
      **Xoá** `web/src/modules/classes/ClassBehaviourBoard.tsx`.
- [ ] **K3.** `MeasureForm.tsx` — Tạo biện pháp (§7.4). Chín loại xếp nhẹ→nặng có chữ
      `nhẹ ─ nặng`; **ba dòng Thư cảnh cáo bị khoá phải nói lý do ngay tại dòng**. Hai nút lưu:
      `Lưu — Đang chuẩn bị` và `Xác nhận đã làm luôn →`.
- [ ] **K4.** `MeasureConfirm.tsx` — Xác nhận đã thực hiện (§7.5). **Một form, ô bắt buộc đổi
      theo loại.** Nút `Xác nhận` **mờ kèm câu nói thiếu gì**, không báo lỗi đỏ sau khi bấm.
- [ ] **K5.** `ViolationPanel.tsx` (§7.7) và `MeasurePanel.tsx` (§7.8).
      Vi phạm phải thấy **các biện pháp liên quan** (nguồn §32). Hộp `Đánh dấu không chính xác`
      có lý do bắt buộc và câu cảnh báo V13.
- [ ] **K6.** `StudentViolationTab.tsx` — tab `Ý thức` của hồ sơ học viên (§7.6).
      **Một dòng thời gian trộn vi phạm và biện pháp** theo ngày. Vi phạm hết hiệu lực gạch
      ngang, xám, **kèm lý do ngay bên dưới**.
- [ ] **K7.** Góc nhìn `Ý thức` trong Phân tích (§7.9). Mọi số **bấm được**, ra đúng tập.
      **Không** có cột tỷ lệ cải thiện, **không** có bảng hiệu quả.
- [ ] **K8.** Một dòng nhắc trong Việc cần làm của GVCN (§7.10). *(Phần "xoá hai nhóm việc Ý thức cũ khỏi
      `GROUP_META`" đã làm ở PR-J — J9 buộc phải gỡ vì hai nhóm đó đọc bảng phương án Ý thức. Còn lại
      đúng một việc: THÊM dòng nhắc; hàm cho dòng đó là `myWarningLines` ở `server/src/yThuc/canhBao.ts`.)*
- [ ] **K9. GỠ giao diện cũ.** *(Phần lớn đã gỡ ở PR-J vì không gỡ thì `npm run typecheck` đỏ: công tắc
      `Học thuật / Ý thức` ở `QuickReport.tsx`, nhánh `behaviour` ở `CasePanel.tsx`/`SkillBoard.tsx`/
      `JourneyTimeline.tsx`, bộ lọc `nhom` ở `CaseBoardPage.tsx`, `ClassBehaviourBoard.tsx` và tab "Ý thức"
      cũ ở `ClassOverviewPage.tsx`. Việc còn lại của K9 là rà lại bằng `grep` + bấm thử, không phải gỡ từ
      đầu.)* Checklist §9.3: công tắc `Học thuật / Ý thức` ở `QuickReport.tsx`;
      cờ `behaviour` ở `CasePanel.tsx`; cột thứ sáu ở `SkillBoard.tsx` và `ClassIssueBoard.tsx`;
      bộ lọc `track` ở `CaseBoardPage.tsx`; mốc Ý thức kiểu "đợt 2" ở `JourneyTimeline.tsx`.
- [ ] **K10.** Hồ sơ học viên: cảnh báo vi phạm là **banner** phía trên, **không** thêm ô số thứ
      năm (§18.7 chốt đúng bốn ô).
- [ ] **K11.** Khổ 375px cho cả bảy màn.

### Nghiệm thu PR-K

Toàn bộ 24 mục ở §12, **bấm thử thật bằng ba vai**: GVBM (chỉ ghi được), GVCN (làm hết),
Quản lý (làm hết + xem thống kê chi nhánh). Cộng thêm:
`grep -ri "case ý thức\|behaviour" web/src` không còn kết quả nào ngoài chú thích có ghi ngày.

**▶ KIỂM 1 — chủ sản phẩm bấm thử ở đây.**

---

## 22.6. PR-P — Tổng quan và Phân tích

Yêu cầu: design plan §4 + §18.2 (Tổng quan) · §5 + §18.3 (Phân tích).
Tình trạng từng dòng: `BAN_DO_OVERHAUL.md` mục 3 và mục 4.

### Bước

- [ ] **P1. Tổng quan, bốn ô số** có nhãn và mẫu số: `Học viên dưới kỳ vọng` ·
      `Học viên có case đang mở` · `Chờ xác minh quá hạn` · `Phương án cần cập nhật`.
      Dùng hàm chỉ số của PR-N. Bấm ô ra đúng tập.
- [ ] **P2. Khối `Cần xử lý`** — 5–8 dòng thật, mỗi dòng: đối tượng + cần làm gì + người phụ
      trách + hạn + **một** nút. Thứ tự ưu tiên §4.1: quá hạn xác minh/duyệt → thiếu chủ trách
      nhiệm → thiếu PA → thiếu kết quả → lịch gần. **Không** thêm risk score tổng hợp.
- [ ] **P3. Khối `Điểm đáng chú ý`** — tối đa ba nhận định **có số và link nguồn**. Không đoạn văn dài.
- [ ] **P4. BỎ khỏi màn chính:** `<WorkList>` đầy đủ (chỉ giữ preview 5–8 việc + `Xem tất cả`)
      và `<Highlights>` khổ lớn (rút thành `Lịch sắp tới` gọn, ba tab tuần, không hiện nhóm 0).
- [ ] **P5. Bảng `Theo chi nhánh`** — tên cột dễ hiểu, số có đơn vị, hàng mở tới lớp.
      Thay kiểu `13/4` bằng hai cột `13 case mở` và `4 chưa có PA`.
      Nếu chỉ một chi nhánh thì ưu tiên bảng lớp, không bắt đọc một hàng CN thừa.
- [ ] **P6. GV:** màn đầu là `Việc cần làm` + `Học viên cần hỗ trợ` trong phạm vi mình.
      Không thấy bảng chi nhánh.
- [ ] **P7. Phân tích — bốn góc nhìn** `Vấn đề học viên | Kết quả hỗ trợ | Theo tuần | Ý thức`.
      **Chưa làm góc nhìn `Giáo viên`** — hoãn sau deploy, xem `BAN_DO_OVERHAUL.md` §10.
- [ ] **P8. `Vấn đề học viên`:** ma trận hàng là vấn đề cụ thể, cột là CN hoặc lớp; ô là
      `n HV / N HV thuộc phạm vi kỹ năng`. Bấm số mở panel `{n} học viên — {vấn đề}` có tên,
      lớp, case, PA hiện tại, cập nhật gần nhất. **Không** dùng một panel case cho cả số HV lẫn số PA.
- [ ] **P9. `Kết quả hỗ trợ`:** tiêu đề ngữ cảnh `Listening · {phân loại} · {kỳ}`; thanh tỷ lệ
      nhỏ **trong ô**, không chart lớn. Nhóm `chưa xác định nguồn` (F03) hiện ra — đã có hàm
      `planOutcomesUnattributed`, chưa màn nào gọi. Liên kết `Cần bổ sung đánh giá` **ngoài** bảng hiệu quả.
- [ ] **P10. `Theo tuần`:** nhóm cột `Kết quả Test` và `Tình trạng xử lý hiện nay` phân cách nhẹ.
      Cột ít dùng vào bộ chọn cột, không bắt kéo ngang mười mấy cột.
- [ ] **P11. Bỏ** danh sách `Việc đã giao` ở cuối khu phân tích. Bỏ tên mơ hồ `Thực trạng`.
      **Không** để hai bảng tổng hợp gần trùng nhau cùng hiện mặc định.
- [ ] **P12. Nối `<KetQuaDot>` và `<TyLe>` vào màn thật.** Hai component này có luật, có phép
      kiểm, có trang thử — **chưa màn nào dùng** (mục 12.7). Các màn cũ còn tự vẽ câu riêng.

### Nghiệm thu PR-P
1. Bốn ô số có số thật, bấm ra đúng tập. 2. Màn đầu desktop **không** còn hàng đợi đầy đủ và
khối Sự kiện nổi bật lớn. 3. Ảnh desktop + 375px ở hai vai QL và GVBM. 4. Mọi phần trăm đi qua
`<TyLe>`; `N=0` ghi `Chưa có dữ liệu`, `N<5` có nhãn mẫu nhỏ. 5. Dữ liệu rỗng / ít / nhiều đều đọc được.

**▶ KIỂM 2.**

---

## 22.7. PR-Q — Học viên & Lớp, Hồ sơ lớp, Hồ sơ học viên, Hành trình

> **22/09/2026:** **Q7 và Q8 chuyển sang PR-HV** (kế hoạch `docs/superpowers/plans/2026-09-22-ho-so-hoc-vien-overhaul.md`) — **đã làm ở PR-HV** (nhánh `pr-hv-ho-so-hoc-vien`, 22/09/2026). PR-Q giữ phần còn lại (danh sách Học viên & Lớp, hồ sơ lớp 4 tab, Q9 Hành trình). Đừng làm lại Q7/Q8 ở đây.

Yêu cầu: §8.3 · §8.4 · §18.5 · §18.6 · §22.2 (lớp) và §8.1 · §8.2 · §18.7 (hồ sơ HV).
Tình trạng từng dòng: `BAN_DO_OVERHAUL.md` mục 6 và mục 7.

### Bước

- [ ] **Q1. Danh sách lớp:** một ô tìm kiếm dùng được tên HV / mã HV / mã lớp. Lọc chi nhánh
      dùng dropdown khi nhiều CN — **không** bày đồng thời dropdown và dải tab CN.
      Hàng lớp chỉ 2–3 thông tin: bài cần chấm, case mở, mốc sắp tới.
- [ ] **Q2.** Đổi badge `case SOS` thành nhãn **chính xác với tập đếm**. Case còn mở **không**
      đồng nghĩa em hiện vẫn SOS.
- [ ] **Q3.** Lớp mặc định thu gọn khi danh sách dài; tìm kiếm **tự mở** lớp chứa kết quả.
- [ ] **Q4. Hồ sơ lớp — bốn tab** `Học viên | Ý thức | Phân tích lớp | Giáo viên` (chốt 21/09).
      `Lộ trình` và `Chuyển tiếp lớp` là **nút ở header**, không phải tab.
      **Bỏ màn trung gian `Thông tin lớp` chứa tiếp hai tab** (§22.2) — nhưng các trường
      tên/mã/chương trình vẫn phải có nơi sửa hợp lý, **không bị mất vì gỡ tab**.
- [ ] **Q5.** Tab `Giáo viên` dùng **chung** form Phân công (`TeacherAssignPanel.tsx`),
      không hai bộ form. Ba luật phân công ở máy chủ **đã đúng** (`classes.ts:690–760`) —
      **đừng viết lại**.
- [ ] **Q6.** Ô `Chọn giáo viên` trong dropdown `Người phụ trách` — chưa làm (mục 12.11),
      cần lọc theo giáo viên ở máy chủ. Dùng `PeoplePicker.tsx` đã có.
- [x] **Q7. Hồ sơ HV — bốn ô đầu** → làm ở **PR-HV** (D5, spec 2026-09-22). Đổi thành `Kết quả Test gần nhất` · `Kỹ năng cần hỗ trợ` ·
      `Case đang mở` · `Việc cần làm tiếp`. Ô Test dùng `<KetQuaDot>`; Normal ghi đủ/thiếu bao
      nhiêu môn, **không bịa OVR**. Ô việc có **động từ và hạn**, không dùng một ngày cũ làm nội dung.
- [x] **Q8.** → làm ở **PR-HV** (D5, spec 2026-09-22). Mỗi phương án một khối ba phần: `Nội dung và người làm | Kết quả gần nhất và ngày |
      Việc tiếp theo và hạn`. Mobile xếp dọc đúng thứ tự. PA đã xong thu gọn phía dưới;
      **không** giấu PA đang chạy sau "và một việc nữa".
- [ ] **Q9. Hành trình:** chọn `Toàn bộ / một kỹ năng / Ý thức`, mặc định 6–8 tuần và các case
      đang mở. Thêm **thanh chặng gọn** (vào lớp → Test → hỗ trợ → chuyển tiếp).
      Mốc đọc được bằng **tên và ngày**, không cần hover mới hiểu.
      Đổi `Các mốc đã qua` → `Mốc học tập`. **Không** trộn nhật ký chỉnh sửa kỹ thuật vào hành trình.

### Nghiệm thu PR-Q
1. Bốn tab hồ sơ lớp đúng thứ tự; `Lộ trình`/`Chuyển tiếp` là nút header và vẫn mở được.
2. Không còn màn trung gian `Thông tin lớp`, nhưng vẫn sửa được tên/mã/chương trình.
3. Bốn ô hồ sơ HV đúng nhãn mới; ô Test dùng `<KetQuaDot>`.
4. Khối case hai phương án song song + ghi chú dài + tên GV dài: không tràn, không cắt (§18.9).
5. Ảnh desktop + 375px, ba vai. 6. `npm run check` xanh.

**▶ KIỂM 3.**

---

## 22.8. PR-R — Công việc, Kế hoạch Test, đường vào nhập điểm

Yêu cầu: §7 + §18.4 (Công việc) · §9 + §18.8 + §22.3 (Test).
Tình trạng từng dòng: `BAN_DO_OVERHAUL.md` mục 5 và mục 8.

### Bước

- [ ] **R1. Ba tab một nơi:** `Hỗ trợ học viên / Vận hành / Báo cáo đơn vị` (tên §18.4 —
      **không** dùng tên §7.1). Hiện `MgmtTasksPage` và `MeetingPage` là hai route riêng.
- [ ] **R2. `Hỗ trợ học viên`:** bốn bộ lọc nhanh `Tất cả / Quá hạn / Đến hạn / Chờ duyệt`.
      **Bỏ chuỗi hơn mười nút lọc ngang.** Loại việc và người phụ trách dùng dropdown có tìm kiếm.
- [ ] **R3. `Vận hành`:** bảng năm cột `Công việc / Người phụ trách / Hạn hoàn thành / Trạng thái /
      Cập nhật gần nhất`. **Bỏ ghi chú bị lặp** ở cả Trạng thái và Cập nhật.
      Tên việc tối đa 2 dòng; ghi chú mới nhất 1–2 dòng, ngày cạnh ghi chú.
      `Tạm ngưng` phải có **lý do + người cần hỗ trợ + ngày xem lại**, và **không** xoá quá hạn gốc.
      Dời hạn **lưu ngày cũ và lý do**; độ trễ không reset bằng cách sửa deadline.
      Việc con quá hạn hiện **tên việc con**, không chỉ badge.
- [ ] **R4. `Báo cáo đơn vị` — đảo thứ tự:** tuần+kỳ+phạm vi → số đã nộp/còn thiếu → ma trận
      đơn vị → cần quyết định trong họp. `Việc đã giao` và tồn học vụ xuống phần thu gọn.
      **Bảng phải hiện ngay màn đầu desktop**, không cần cuộn qua hai danh sách.
- [ ] **R5. Ba trạng thái tách bạch `Nháp / Đã nộp / Chưa báo cáo`** (D04). Lưu nháp cả tuần,
      nộp theo cửa sổ cuối tuần. **Nháp không tính đã báo cáo.** Chỉ khoá nút `Nộp`, không khoá form.
      Nút `Lưu nháp` và `Nộp báo cáo` **tách rõ**.
- [ ] **R6. Liên kết báo cáo ↔ task thật (F06).** `meetingBoard` đang gợi ý theo "cùng nhóm +
      cùng CN" và ẩn task thứ 7. Nếu giữ gợi ý thì phải gọi `Việc cùng nhóm`, **không**
      `Việc xử lý báo cáo này`.
- [x] **R7. Quy ước URL cho "mở đúng đợt".** **Xong (PR-Qb, 23/09/2026):** một hàm dựng + một hàm
      đọc ở `shared/domain/duongHoSo.ts` (`duongHoSoHocVien`, `docThamSoHoSo`) — tham số
      `?dot=<attemptId>&kn=<skill>` (không phải `?attempt=`/`?focus=` như gợi ý ban đầu), mọi nơi
      tạo link đều gọi hàm này, không còn chỗ nào tự dựng chuỗi tham số riêng.
- [x] **R8. Bốn đường vào nhập điểm** (mục 12.5). **Xong (PR-Qb, 23/09/2026):** (a) badge lớp
      `?scope=mine` khi Phạm vi = Lớp tôi dạy (đường badge → lưới chấm/`ClassOverviewPage` do Qa/Rc1
      đã dựng trước đó, Qb chỉ thêm `scope`); (b) nhãn MT ở `ClassRoster.tsx` mở đúng hồ sơ đợt qua
      `duongHoSoHocVien`; (c) bốn ô số đầu hồ sơ HV bấm được (`Stat` nhận `onClick`, vẽ `<button>`);
      (d) ghim Đợt Test trên trục Hành trình (`HanhTrinh.tsx`, thay `JourneyTimeline.tsx` đã xoá) có
      `onClick` điều hướng `?dot=`. Cộng thêm: `GET /notifications` JOIN `student_id`/`attempt_id`
      theo `entity_type` (`server/src/platform/thongBao.ts`, không đổi schema) + `Header.tsx` dùng
      `duongThongBao` để điều hướng đúng loại.
      *(23/09, PR-Rc1 đã làm trước phần lưới: một lưới chấm chung `/nhap-diem/:classId` nhận `?periodId=`
      `?kind=` `?kn=` `?hv=`; Test › Cần chấm lọc theo lớp có chip bỏ lọc — đây chính là "lưới chấm" mà nút
      `&scope=mine` của Qb trỏ tới.)*
- [x] **R9. Kế hoạch Test — panel mới** năm phần: `Lớp và học viên → Lượt Test và lịch hiện tại →
      Lịch mới → Kiểm tra thay đổi → Lưu`. Bỏ bố cục `một tuần chung + bốn checkbox + dãy MT1–MT7`
      làm đường thao tác mặc định; dãy lượt vào phần lịch sử thu gọn.
      Hai hàng lịch nhanh **RLW** và **Speaking** tách riêng.
      Cấu hình kỹ năng bắt buộc **tách khỏi** sửa lịch, để không bỏ môn nhầm khi chỉ dời tuần.
      *(23/09, PR-Rc2: lưới cả lớp FT (`web/src/modules/test/KeHoachTestTab.tsx` + `keHoach/LuoiFT.tsx`), hai hàng
      RLW/S đúng ý; xếp lịch hàng loạt 5 bước có xem trước, lưu một phần giữ hàng lỗi (`NganXepHangLoat.tsx`, R9b);
      cấu hình kỹ năng bắt buộc giữ tách riêng (`setSkillSkip`, hồ sơ đợt) như kế hoạch nói.)*
      *(24/09, PR-UX2: **Kế hoạch Test L/R/W/S riêng, lớp thường theo HV, R9b** — chip từng kỹ năng, ngăn hàng loạt trên `KhungPanel`, tick R9b chỉ đặt một lần mỗi đợt.)*
- [x] **R10. Ô đã có lịch mở chỉnh sửa** với tuần cũ → mới, **không** cho chọn rồi báo lỗi trùng.
      Hiện panel chỉ gọi `bulkPlan` → `createAttempt` (luôn INSERT); sửa thật phải gọi
      `setSkillWeek` cho từng kỹ năng, mở modal cùng kiểu `SkillWeekModal` đã có preview và quyền.
      *(23/09, PR-Rc2: `HopSuaTuan.tsx` — bấm ô đã xếp mở hộp sửa, xem trước qua `/ke-hoach-test/nhom/kiem`
      (`kiemTuanNhom` → `checkWeekVsNeighbours`), lưu qua `setSkillWeek`.)*
- [x] **R11. "Đợt hoàn tất thì chỉ đọc"** — `assessment_attempts.status` **không** có giá trị
      riêng cho "hoàn tất"; trạng thái này đang được **suy ra** từ đủ điểm required.
      **Định nghĩa rõ ở tầng dữ liệu trước khi chặn**, vì chặn nhầm khoá luôn việc hiệu chỉnh hợp lệ.
      Nếu chưa chắc thì **để ngỏ và ghi vào mục 12**, đừng đoán.
      **R11 chốt (21/09 đêm):** đợt Test **hoàn tất** = mọi kỹ năng bắt buộc đã có điểm **hoặc** dấu `-` **và** đã hết Chủ nhật của tuần thi. Trước đó GV có quyền sửa bình thường; sau đó **chỉ Quản lý** sửa được, mỗi lần sửa ghi `audit_logs`. Khớp luật đã chốt "sau cuối tuần chỉ Quản lý sửa kết luận".
      *(23/09, PR-Rc2: **suy mỗi lần đọc, không lưu cột riêng** (Q14, không migrate) — `server/src/fasttrack/hoanTat.ts`
      → `dotHoanTat`/`dotHoanTatMany`/`quyenSuaSauHoanTat` (Quản lý sửa được qua `PLAN_WEEK`, không cấp `score.override`
      — Q1). Nối vào `saveScore`, `saveRegularScore`, `reportRegularNoShow`; nhật ký `score.override` kèm `sauHoanTat: true`.
      Web: nhãn "Đã hoàn tất" + `SkillCell.khoa` ở `cham/LuoiFT.tsx` · `LuoiThuong.tsx` · `MotKyNang.tsx`.)*
- [x] **R12. Nút dời lịch một kỹ năng cho lớp Normal** — hiện **không có ở bất kỳ đâu**.
      Quyền `schedule.move` đã mở đúng ở máy chủ (12 phép kiểm). Dựng UI ở
      `RegularSheetPage.tsx`, tái dùng `moveableSkills`/`canMoveSkillSchedule` đã có.
      *(23/09, PR-Rc1: `RegularSheetPage.tsx` đã xoá; lưới lớp thường nay ở `web/src/modules/cham/LuoiThuong.tsx` — dựng nút ở đó.)*
      *(23/09, PR-Rc2: nút dời lịch của R12 **chuyển vào Kế hoạch Test** (§4 đặc tả — GV lớp thường không dời lịch ở
      đây nữa, chỉ Quản lý; GV dời bằng dấu `-` ở lưới chấm) — `keHoach/HopDoiLichThuong.tsx` (Q11, mở từ ô hoặc từ
      nút "Dời một môn"), máy chủ `doiLichThuong` gọi `setSkillWeek`.)*
- [x] **R13. Bộ chọn tuần** — kiểm ở panel 600px, modal rộng và mobile (§22.8 điểm 3).
      Nút **không** rớt hàng ngẫu nhiên; popover **không** bị cắt bởi z-index.
      *(23/09, PR-Rc1: mã tuần trong bộ chọn theo G-6 — `W3 SEP`, không kèm năm; bấm thử ba khổ ở bước KIỂM cuối PR-Rc1.)*
- [x] **R14. Dấu `-` cho lớp Normal (C08).** **C08 đóng (21/09 đêm):** lớp Normal **có dùng** dấu `-`. **Giáo viên** ghi `-` khi em chưa làm bài của tuần (máy KHÔNG tự thêm); ghi `-` thì kỹ năng đó **tự dời sang tuần sau**. Hạn chấm Normal vẫn hết Chủ nhật tuần thi. Tái dùng luật dấu `-` của Fast Track (PR-G)
      và `canMoveSkillSchedule` của R12; khác FT ở chỗ: Normal ghi `-` là **dời lịch**, không xác lập
      "không dự thi". Phép kiểm máy chủ: ghi `-` → lịch kỹ năng sang tuần sau; không ghi gì → máy không tự thêm.
      *(23/09, PR-Rc1: **phần dấu `-` xong** — `normal/regular.ts` → `reportRegularNoShow`, dùng lại `setSkillWeek`,
      có phép kiểm máy chủ. Chưa tick: phần lịch dựa trên nút dời lịch của R12 — PR-Rc2.)*
      *(23/09, PR-Rc2: **phần lịch xong** — Kế hoạch Test lớp thường (`bangThuong`) gộp em bị dấu `-` dời tuần vào
      cột `khac` của đúng môn đó (R14 phần lịch); `BangThuong.tsx` hiện dòng phụ vàng "{n} HV → {tuần}" kèm tên em.)*

### Nghiệm thu PR-R
1. Ba tab một nơi, tên đúng §18.4. 2. Bảng báo cáo đơn vị hiện ngay màn đầu desktop.
3. Lưu nháp giữa tuần được, `Nộp` bị khoá ngoài cửa sổ, nháp **không** tính đã báo cáo.
4. Cả bốn đường vào mở đúng đợt và đúng kỹ năng. 5. Bấm ô MT đã có lịch → sửa được, không lỗi trùng.
6. Lớp Normal dời được lịch một kỹ năng. 7. Bộ chọn tuần ở ba khổ, không rớt hàng, không cắt popover.

**▶ KIỂM 4.**

---

## 22.9. PR-S — Học thuật theo rule mới, biên tập chữ, nợ kỹ thuật

### Bước — Học thuật (rule book §18.2)

- [ ] **S1.** Đóng SOS không tạo Case: **bắt buộc ghi lý do** (`resolution_note`).
- [x] **S2. Lịch sử điều chỉnh phương án.** *(PR-S2)* Hiện sửa nội dung phương án là **ghi đè, mất bản cũ**.
      Rule mới bắt buộc audit được: phương án ban đầu là gì · đổi khi nào · **vì sao đổi** ·
      hiện tại là gì. Chuỗi "thay thế" (`superseded_by`) đã có, giữ; thêm nhật ký sửa nội dung.
      **PR-S2:** bảng `case_intervention_revisions` (bản cũ · bản mới · ngày · ai · lý do); Điều chỉnh = cùng PA, không đổi loại; Thay = chuỗi `superseded_by` có sẵn + lý do bắt buộc; sửa gợi ý lúc xác nhận cũng ghi lịch sử; `completeIntervention` thôi ghi đè mô tả. Nghiệm thu mục 2 khoá bằng phép kiểm "Điều chỉnh hai lần".
- [ ] **S3.** Đổi tên mức: `Cần chú ý` → **`Bình thường`** (5 ngày). `Gấp` giữ (3 ngày).
      Grep **mọi biến thể** kể cả test, seed và thông báo máy chủ.
- [x] **S4.** *(PR-S2)* Cập nhật tuần rút gọn theo nguồn §8: kết quả hiện tại · tiến triển · vấn đề còn
      tồn · giữ nguyên / điều chỉnh / thay phương án · ghi chú. Không biến thành form dài.
      **PR-S2:** form Ghi kết quả 5 mục (kết quả · tiến triển · vấn đề còn tồn · Giữ nguyên/Điều chỉnh/Thay phương án/Kết thúc phương án · ghi chú hoặc lý do), dùng chung ở hồ sơ học viên và ngăn Case (`web/src/modules/cases/CapNhatTuan.tsx`).
- [ ] **S5.** Ô `Điểm chi tiết theo kỹ năng` của tab nhập bù — nối dây theo hình
      `ComponentsField` (mục 12.2). `backfillCase` ở máy chủ **đã nhận sẵn** `metrics` và validate.
- [ ] **S6.** Tab `Đã xong từ trước` **chỉ còn nhánh Học thuật** — nhánh Ý thức không còn lý do tồn tại.

### Bước — biên tập chữ và trạng thái rỗng

- [ ] **S7.** Quét **từng màn** theo "một khái niệm một chữ". Mục 12.11 ghi rõ chưa làm:
      mọi `<Empty>` chưa được kiểm "**thiếu gì + ai điền được + nút nào**"; nhiều `SectionNote`
      giải thích **mô hình dữ liệu** còn nguyên trên màn đọc.
- [ ] **S8.** Bỏ dòng `Lớp là gốc…`, chân trang `badge chỉ xuất hiện…`, chân bảng
      `năm cột số… đừng chia chung`. Đơn vị đặt ở **tên cột**; công thức vào tooltip `Cách tính`.
- [ ] **S9.** Nhãn `Chờ nhập điểm` và `Hạn nhập điểm 23/09` đang đứng cạnh nhau ở cùng một dòng
      hồ sơ Test — hai câu đúng nhưng gần nhau (mục 12.10).
- [ ] **S10.** FT ghi `Lịch Mock Test được xếp riêng cho từng học viên`; Normal ghi
      `Các mốc kiểm tra được tính từ tuần khai giảng`. Kiểm đúng ngữ cảnh, không đổi lẫn.

### Bước — nợ kỹ thuật (mục 12.12)

- [x] **S11.** *(PR-S1)* Chuỗi `sit_note` bắt đầu bằng "Không dự thi" đang bị dùng làm **cờ nhận biết**
      (`fromNoShow`). Thay bằng **cột riêng**. Một chuỗi chữ làm cờ là một quả bom hẹn giờ:
      lượt biên tập tiếng Việt sau sẽ vô tình gỡ nó.
- [x] **S12.** *(PR-S1)* Đếm chi nhánh (`branchpulse`) loại ô có dấu `-` **một cách thô**, không xét cặp
      W1/W2 như bảng chấm. Dùng cùng một hàm với bảng chấm.
- [x] **S13.** *(PR-S1)* Báo lại `-` cho cùng một tuần sau khi Quản lý đã đảo kết luận chốt là
      **không-làm-gì** (cờ đã chốt còn nguyên): dấu không hiện lại, cũng không chốt lại. Quyết định rõ.
- [x] **S14.** *(PR-S1)* `resolveLateNoShow` xác nhận cho Writing mới chặn khi thiếu một task — **chưa có
      phép kiểm riêng** cho nhánh đó.
- [x] **S15.** *(PR-S1)* Phép kiểm `PR-H` về `workScope` chỉ kiểm hàm thuần, **chưa kiểm** trường máy chủ trả về.
- [x] **S16.** *(PR-S1)* Dữ liệu demo: **học viên đã kết thúc khoá mà case còn mở** (Vũ Thu Uyên, case 57).
      Là lý do duy nhất khiến Tổng quan đếm 29 mà Thực trạng đếm 28.
      ~~Chưa có luật nào đóng hoặc giao lại case khi một em kết thúc lộ trình.~~
      **S16 chốt (21/09 đêm):** lộ trình học của em **kết thúc** (`learning_cycles` rời trạng thái `active`) mà còn case mở → máy **tự đóng** case, lý do hệ thống `Học viên kết thúc khoá`, ghi `audit_logs`, vẫn xem lại được trong lịch sử; case đóng kiểu này **không** tính vào thống kê hiệu quả. Phép kiểm máy chủ + demo Vũ Thu Uyên hết lệch 29/28.
      **PR-S1:** gắn vào `setStudentStatus('finished')`; `setOutcome`/`updateCycle` chỉ khi có cờ `dongCaseKhiKetThuc: true`; hoàn tất khoá không cờ (Lên lớp thường tiếp, PR-LT) giữ Case. PA đã xong có kết quả thật vẫn tính hiệu quả (planning review 22/09, Q7).
- [x] **S17.** *(PR-S1)* Case Fast Track mở mà em chuyển sang Normal (ví dụ hạng mục `writing1`) biến khỏi
      tab Normal của Phân tích, Tổng quan vẫn đếm. ~~Chưa quyết định hiện ở đâu.~~
      **S17 chốt (21/09 đêm):** em có case **Fast Track** đang mở mà chuyển sang lớp **Normal** → máy **tự đóng** case, lý do hệ thống `Chuyển sang lớp Normal`, ghi `audit_logs`, xem lại được trong lịch sử, **không** tính vào thống kê hiệu quả. Cùng kiểu với S16. Phép kiểm máy chủ.

### Nghiệm thu PR-S
1. Đóng SOS không lý do → bị từ chối. 2. Sửa nội dung phương án hai lần → đọc lại được cả hai
bản cũ và lý do đổi. 3. `grep -rn "Cần chú ý" .` không còn kết quả nào là nhãn mức case.
4. Mở **từng** màn ở ba vai, mọi `<Empty>` nói đủ "thiếu gì + ai điền + nút nào".
5. `grep -rn "sit_note" server/src` không còn chỗ nào dùng chuỗi chữ làm cờ.
6. `npm run check` xanh; số phép kiểm chỉ tăng.

**▶ KIỂM 5 — nghiệm thu toàn web.**

---

## 22.10. Việc hoãn — đã chốt 21/09, đừng đề xuất lại như việc mới

| Khối | Vì sao hoãn | Đọc ở đâu |
|---|---|---|
| **Design plan §6 + góc nhìn `Giáo viên` của §18.3** — phân tích theo giáo viên | Tính năng mới hoàn toàn, quy mô bằng 2 PR. Cần D02 áp ở **API, tìm kiếm, drill-down và xuất dữ liệu** (không chỉ ẩn menu), và cần hai chỉ số `dung-han-cap-nhat` + `do-phu-danh-gia` mà PR-N mới tạo. Không chặn việc hằng ngày của GV | `BAN_DO_OVERHAUL.md` §10 |
| **Design plan §11** kho ý tưởng mở rộng · **plan.md §20** kho ý tưởng thiết kế | Chưa duyệt. §20.1 đã ghi ba ý tưởng bị loại — đừng đề xuất lại | design plan §11 · plan.md §20 |
| ~~**C08** — Normal có dùng dấu `-` không, và ai thêm~~ | ~~Chủ sản phẩm chưa trả lời. Trên màn giữ câu trung tính `Hạn chấm theo quy định của lớp`~~ — đóng 21/09 đêm, việc R14 (PR-Rc1) | `LUAT_CHO_CHOT.md` §6.4 |

## 22.11. Mốc deploy

**Chưa đặt vào kế hoạch** (chốt 21/09/2026). Làm xong 8 PR rồi bàn riêng.
Đừng tự suy điều kiện deploy từ việc một PR đã tick.

---

# 23. LỘ TRÌNH ĐÊM 21/09/2026 — BẢN CHÍNH VÀ DEPLOY (thay thứ tự mục 22)

**Mục này thay thứ tự mục 22.** Đã xong: `PR-N` (#32), `PR-J` (#34). Chủ sản phẩm muốn deploy bản chính
**đêm nay**, dữ liệu rỗng, hạ tầng miễn phí, phạm vi tối thiểu: *GV nhập được mọi thông tin HV; QL xem được
số liệu SOS, case, Ý thức.* Nguồn luật mới: `thiet-ke/SOS_VA_PHOI_HOP_V3.md` (rulebook v3).

## 23.0. Ba PR đêm nay

```
PR-T  Máy chủ theo v3            ─┐  chạy SONG SONG được (không chung file,
PR-Z  Chuẩn bị bản chính         ─┘  trừ package.json — gỡ xung đột bằng giữ cả hai dòng)
PR-K  Giao diện Ý thức & Phối hợp + case từ SOS   ← sau PR-T
      ▶ chủ sản phẩm bấm thử 10 phút → merge → deploy
```

**Sau deploy** (không làm đêm nay): `PR-O` điều hướng 4 khu vực · `PR-P` Tổng quan/Phân tích mới ·
`PR-Q` Học viên & Lớp/Hồ sơ · `PR-R` Công việc/Kế hoạch Test · phần còn lại của `PR-S` · §6 phân tích
theo GV. Mục 22.4–22.9 giữ nguyên làm đặc tả cho lúc đó, chỉ bỏ những gì mục 23 đã làm.

**Mức kiểm tra đêm nay — cố ý nhẹ hơn mục 22, nhưng không bỏ phần có thể làm hỏng dữ liệu thật:**

| Loại việc | Mức kiểm |
|---|---|
| Luật tạo/gắn case, preload, phối hợp SOS, xoá vi phạm, quyền | **Đầy đủ**: phép kiểm máy chủ cho từng mã luật (S/P/V′) |
| Khởi tạo DB rỗng, tắt demo, sao lưu | **Đầy đủ**: chạy thật trên DB rỗng từ đầu |
| Giao diện | Bấm thử **một lượt** mỗi vai (GVBM, GVCN, QL) + khổ 375px. Không chụp ảnh, không kiểm ngược |
| Chữ, trạng thái rỗng, bố cục đẹp | Chỉ phần nằm trong màn mới làm. Phần còn lại → sau deploy |

## 23.1. PR-T — Máy chủ theo rulebook v3

Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md` mục 2–6, 8. Chỉ máy chủ + `shared/domain` + seed demo.

- [x] **T1. Bảng tra thuần** `shared/domain/sos.ts`: `DEFAULT_ACADEMIC_SUPPORT` (bảng §4, tra theo số MT +
      mức SOS) và `DEFAULT_SOS_COORDINATION` (bảng §5.3), `COORDINATION_KINDS` (6), `COORDINATION_REMOVE_REASONS`
      (4 + `system_sos_changed`), `CASE_DISMISS_REASONS` (3). Phép kiểm thuần: đủ 5 MT × 3 mức cho cả hai bảng;
      MT3 SOS3 là dòng duy nhất có `cx_meeting_family`.
- [x] **T2. Schema + migrate:** bảng `sos_coordination_actions` (DDL §5.1); `case_interventions` thêm `preset`,
      `confirmed_by`, `confirmed_at`; `sos_cases` thêm `dismiss_reason_code`, `dismiss_reason_text`;
      `attachments.owner_type` nhận `sos_coordination_action`. `npm run migrate` chạy lặp không lỗi.
- [x] **T3. SOS tự tạo/gắn case (S01–S03, S08, S09).** Sửa `server/src/cases/signals.ts` (điểm vào hiện tại khi
      có kết quả dưới kỳ vọng): **chỉ lượt Mock FT** — với mỗi kỹ năng trượt (luật Writing hai tầng giữ nguyên)
      tìm case mở cùng HS + lộ trình + hạng mục → gắn (mốc `repeat`) hoặc tạo; ghi `case_signals` `linked` làm
      dây nối, `verify_due` = hạn 3 ngày; case mới có phương án `preset = 1` theo `DEFAULT_ACADEMIC_SUPPORT`,
      `followup_due` tính theo §4, người thực hiện = GVBM đúng kỹ năng. Lớp Normal **không đổi** (Q-V3-1).
      Phép kiểm: nghiệm thu §10 mục 1, 2, 3, 4 (phần case), 8.
- [x] **T4. Xác nhận / thay / đóng case từ SOS (S04–S07).** Hàm + route: xác nhận phương án điền sẵn
      (`confirmed_*`); thay = `superseded` + tạo mới trong **một** giao dịch, không bao giờ để case 0 phương án
      đang hoạt động; `Không cần theo dõi` (lý do bắt buộc, `Khác` cần chữ) → đóng case, huỷ phương án điền sẵn.
      Phương án điền sẵn chưa xác nhận **loại khỏi** `effectiveness.ts` và khỏi nghĩa vụ cập nhật tuần.
      Quyền: GVBM đúng kỹ năng (C02) + QL. Thêm chỉ số `case-cho-xac-dinh-nguyen-nhan`.
      Phép kiểm: §10 mục 5, 6.
- [x] **T5. Phối hợp SOS (P01–P10).** `server/src/yThuc/phoiHop.ts`: sinh việc điền sẵn khi lượt có SOS
      (gọi từ cùng điểm với T3), đồng bộ khi mức SOS đổi (P02, P03), thêm / xác nhận / bỏ việc, danh sách theo
      lớp và theo HS. Quyền: GVCN lớp em đang học + QL; GVBM chỉ đọc. Ba chỉ số `phoi-hop-*` (§8).
      Phép kiểm: §10 mục 1 (phần phối hợp), 2, 4 (phần phối hợp), 7, 8 + quyền.
- [x] **T6. Xoá vi phạm (V11′–V14′).** Thay đường "đánh dấu không chính xác" bằng **xoá**: xoá dòng + dòng nối
      + tệp, ghi `audit_logs`. Số vi phạm của biện pháp là số đang gắn. Migrate: dòng `valid = 0` cũ → xoá (có
      audit). Gỡ chỉ số `vi-pham-khong-hieu-luc`. Phép kiểm: §10 mục 9 + quyền V10.
- [x] **T7. Đổi tên mức** `Cần chú ý` → `Bình thường` ở mọi chỗ (nhãn, seed, thông báo, phép kiểm). Mã
      `attention` giữ nguyên, chỉ đổi chữ.
- [x] **T8. Seed demo** thêm các tình huống v3 §9 (chỉ cho máy dev).

**Kết quả PR-T (nhánh `pr-t-may-chu-v3`) — chỗ kế hoạch sai/thiếu và những điều đã QUYẾT theo đúng chữ của đặc tả (ghi tại chỗ, không phải hai cách để chọn):**

1. **DDL §5.1 sai:** `UNIQUE (attempt_id, kind, custom_name)` KHÔNG chặn trùng khi `custom_name` NULL (SQLite coi mỗi NULL là giá trị riêng) → chạy lặp nhân đôi việc phối hợp. Đã thay bằng chỉ mục duy nhất `(attempt_id, kind, COALESCE(custom_name,''))`; có phép kiểm chặn trùng; đã sửa DDL trong `SOS_VA_PHOI_HOP_V3.md`.
2. **T3 thiếu trường hợp "đang làm dở nhiều kỹ năng":** điểm nhập từng kỹ năng bởi từng GVBM nên case đầu ra đời khi lượt mới SOS1. Đặc tả §4 nói phương án theo **mức SOS của cả lượt** → phương án điền sẵn **chưa xác nhận** đi theo mức mới nhất của lượt đã mở nó (`resyncUnconfirmedPresets`); đã xác nhận thì không bao giờ bị đụng; case cũ được lượt sau *gắn* thêm mốc thì giữ phương án của nó.
3. **T3 thiếu luật chống nhân đôi mốc:** lưu lại điểm làm case vừa tạo bị ghi thêm mốc "Trượt lại" cho chính lượt đã mở nó. Đã chặn (tín hiệu đã nối vào đúng case thì không ghi mốc thứ hai) — có phép kiểm.
4. **P03 hẹp hơn chữ:** "việc `pending` không còn trong bảng mới tự bỏ" chỉ áp cho việc **điền sẵn** (`preset = 1`); việc GVCN tự thêm không bao giờ bị máy đụng. Việc bị **hệ thống** bỏ được **hồi lại** khi mức SOS lên lại (điểm sửa qua sửa lại); việc do **người** bỏ thì không bao giờ hồi.
5. **S05:** "3 ngày" là **hạn làm**, không khoá theo ngày (quá 3 ngày vẫn bấm `Không cần theo dõi` được). Chỉ đóng được khi case **chưa có việc thật** (chưa xác nhận phương án, chưa ghi kết quả) và là case **tự tạo từ SOS**; ngược lại dùng `Chốt kết quả case` như thường.
6. **MT5 trở lên:** phương án `Khác` dùng loại `other_proposal` (nhãn "Khác") + mô tả đúng chữ đặc tả; **xác nhận của GVBM/Quản lý là đủ** — không kéo thêm bước Quản lý duyệt (đặc tả không nói có).
7. **"Chủ nhật đầu tiên sau (ngày tạo + 30 ngày)"** đọc đúng nghĩa đen: rơi đúng Chủ nhật thì sang Chủ nhật kế tiếp. "Đến lúc thi" chỉ lấy khi lộ trình đã chốt **tuần** thi (hết Chủ nhật tuần đó); mới biết tháng thì để trống.
8. **Xoá vi phạm:** cột `valid`, `invalid_*`, `violation_count_at_confirm` **giữ trong schema, ngừng dùng** (đường an toàn cho `migrate`). `migrate` xoá dòng `valid = 0` cũ (kèm audit). Mã vi phạm có thể **tái dùng** sau khi xoá dòng cao nhất (SQLite không AUTOINCREMENT) — audit khác nhau ở `entity_label`/nội dung; phép kiểm không đếm audit theo mã một mình.
9. **Đơn vị chỉ số mới `luot-sos` ("lượt")** cho ba chỉ số `phoi-hop-*`; sổ chỉ số nay có 23 chỉ số. `vi-pham-khong-hieu-luc` đã bỏ.
10. **Rà soát độc lập (một lượt) tìm ra một lỗi thật, đã sửa + phép kiểm:** case tự tạo đã **đóng** (`Không cần theo dõi` hay chốt kết quả) bị **tạo lại** khi lưu điểm kỹ năng khác / chấm lại chính lượt đó (đảo quyết định của GVBM). Nay tín hiệu đã nối vào một case thì không bao giờ tạo case mới cho chính lượt đó; chỉ tạo lại khi tín hiệu được mở lại (thu hồi rồi trượt lại) hoặc ở lượt sau. Cũng sửa: xoá tệp bằng chứng **sau khi** giao dịch chốt (migrate + xoá vi phạm), không nhắc "xem lại" case đã đóng, ngày "1 tháng" không trôi theo ngày bấm lưu, `recordFollowUp` chặn phương án chưa xác nhận, lượt Mock đã huỷ không hiện ở Phối hợp, giới hạn độ dài chữ.
11. **Biện pháp ĐANG CHUẨN BỊ mất hết vi phạm do xoá không bị xoá ngầm** (là bản nháp của GVCN): hiện `0 vi phạm`, không xác nhận được (luật B02 đã có). Đặc tả V14′ chỉ nói về biện pháp đã thực hiện.
12. **Hạn 3 ngày của S04 nay có dòng việc riêng (chủ sản phẩm chốt 21/09 đêm, phương án A):** nhóm `cause` "Xác định nguyên nhân" trong `myWork` — GVBM phụ trách thấy ngay khi case ra đời, Quản lý CHỈ thấy khi đã quá hạn (nhãn "Quá hạn xác định nguyên nhân"), người khác không thấy; biến mất khi đủ nguyên nhân + phương án đã xác nhận hoặc case đóng. PR-K K6 chỉ còn vẽ nhóm này ra giao diện.
13. **Không điền ngược Phối hợp SOS cho dữ liệu cũ:** database đã có lượt SOS từ trước PR-T chỉ có việc phối hợp khi lượt đó được chấm lại; bản chính bắt đầu từ dữ liệu rỗng nên không ảnh hưởng.
14. **Chưa làm (cố ý — thuộc PR-K, cấm sửa giao diện ở PR này):** nhãn mức `Cần chú ý` còn một chỗ chữ cứng trong giao diện: `web/src/modules/cases/CaseBoardPage.tsx:451`. Mọi chỗ khác đọc nhãn từ `URGENCY_LABEL` nên đã tự đổi.
- [x] **T9.** `npm run check` xanh (PR #39). Cập nhật mục 14 + `BAN_DO_OVERHAUL.md`. Mở PR, **không tự merge**.

## 23.2. PR-Z — Chuẩn bị bản chính — ⚰️ HẾT HIỆU LỰC, thay bằng PR-Z2 ở mục 24

Không đổi nghiệp vụ. Mục tiêu: một lệnh build, một lệnh chạy, DB rỗng có tài khoản quản trị, không lộ gì của
bản demo. Chạy được trên **bất kỳ máy nào có Node 20** — hướng dẫn đưa lên mạng ở `TRIEN_KHAI.md`.

- [ ] **Z1. Một cổng cho tất cả.** Khi `NODE_ENV=production`, Express phục vụ luôn thư mục build của Vite
      (`dist/`) và trả `index.html` cho mọi đường không phải `/api` (để link sâu như `/hoc-vien/12` mở được).
      Thêm `npm start` = chạy máy chủ đã build ở chế độ production.
- [ ] **Z2. Cấu hình bằng biến môi trường:** `PORT`, `DATA_DIR` (chứa file SQLite **và** thư mục tải lên;
      mặc định `./data` như hiện tại), `COOKIE_SECURE=1` khi chạy sau https. Không đổi hành vi máy dev.
- [ ] **Z3. Tắt mọi thứ của bản demo khi production:** route `/api/demo/*` (trừ những gì màn đăng nhập thật
      cần), khối "Vào nhanh bằng tài khoản demo", `DemoBar` (đổi ngày demo, chế độ kịch bản), trang
      `/dev/thanh-phan`. `demoToday()` phải ra **ngày thật** (không đặt `demo_date`); `scenario_mode` luôn `normal`.
- [ ] **Z4. `npm run init-ban-chinh`:** tạo DB **rỗng** từ `schema.sql` ở `DATA_DIR` + dữ liệu nền bắt buộc
      (vai trò, quyền, chương trình, danh mục — tách phần này ra khỏi `seed.ts` thành một hàm dùng chung, để
      seed demo và init bản chính dùng **cùng** một nguồn) + **một** tài khoản Quản trị hệ thống lấy email/mật
      khẩu từ `ADMIN_EMAIL` / `ADMIN_PASSWORD`. **Từ chối chạy** nếu DB đã có dữ liệu (không bao giờ xoá dữ
      liệu thật). Không tạo chi nhánh/lớp/HV giả.
- [ ] **Z5. Kiểm DB rỗng từ đầu tới cuối** (phần quan trọng nhất của PR này): init → đăng nhập quản trị → tạo
      chi nhánh → tạo tài khoản GV/QL → tạo lớp + phân công → thêm HV → xếp MT → nhập điểm → thấy tín hiệu/case.
      Mọi màn chính mở được **không lỗi** khi bảng còn rỗng (trạng thái rỗng, không trang trắng).
      Ghi các lỗi tìm được vào PR, sửa những lỗi chặn đường này.
- [ ] **Z6. `npm run sao-luu`:** sao lưu an toàn khi đang chạy (API `backup` của better-sqlite3) ra
      `BACKUP_DIR` (mặc định `DATA_DIR/sao-luu`) tên `pisa-YYYY-MM-DD-HHmm.sqlite` + nén thư mục tải lên; giữ 14
      bản gần nhất. `BACKUP_DIR` riêng để trỏ được vào thư mục Google Drive — **không bao giờ** đặt file SQLite
      đang chạy trong thư mục đồng bộ đám mây (dễ hỏng file).
- [ ] **Z7.** `npm run check` xanh. Cập nhật `README.md` (mục chạy bản chính), mục 14. Mở PR, không tự merge.

## 23.3. PR-K — Giao diện Ý thức & Phối hợp (bản v3)

Đặc tả: `SOS_VA_PHOI_HOP_V3.md` mục 7 (**thắng** `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §7 ở mọi chỗ khác nhau).
Form ghi vi phạm / tạo biện pháp / xác nhận giữ theo Y_THUC §7.2, §7.4, §7.5. Chữ: `TU_DIEN_VA_CHU.md` mục 6.

- [x] **K1.** `web/src/modules/yThuc/`: form ghi vi phạm, tạo biện pháp, xác nhận (ô bắt buộc theo loại, nút mờ
      kèm câu thiếu gì), sửa/xoá vi phạm (hộp xác nhận một dòng). Dùng `BangChung` cho tệp.
- [x] **K2. Hồ sơ lớp**: tab `Ý thức & Phối hợp` thay dạng xem Ý thức cũ; sub-tab `Vi phạm & xử lý` (Theo học
      sinh mặc định, mở tại chỗ hai cột, Theo thời gian, bộ lọc nhóm chung) và `Phối hợp SOS` (§7.2). Nút
      `Ghi vi phạm` ở dòng HS tab Học viên. *(Chưa đổi thành 4 tab — việc của PR-Q sau deploy; chỉ đổi tab Ý thức.
      Trang lớp hiện là các Card xếp dọc, không có tab bar — K2 chèn một Card mới sau danh sách học viên, đúng
      cấu trúc thật; nút "Ghi vi phạm" ở dòng HS trong `ClassRoster.tsx` CHƯA làm, xem mục 14.)*
- [x] **K3. Hồ sơ học viên**: thêm tab `Ý thức & Phối hợp` cạnh hai tab hiện có (§7.3); banner cảnh báo 5 ngày
      phía trên, không thêm ô số.
- [x] **K4. Case từ SOS trên bảng kỹ năng** (§7.5): trạng thái chờ xác định nguyên nhân, nhãn gợi ý tự động +
      Xác nhận/Sửa/Thay, `Không cần theo dõi` với lý do chọn nhanh.
- [x] **K5. QL:** góc nhìn `Ý thức & Phối hợp` trong tab Phân tích/Thực trạng hiện có — ba bảng nhỏ §7.6, số bấm
      được qua `<SoLieu>`. *(Bảng "vi phạm theo 5 nhóm × 4 trạng thái" đúng hình ASCII §7.6 chưa làm — máy chủ
      chưa có chỉ số cắt theo từng nhóm; dùng bốn chỉ số tổng đã đăng ký thay thế, xem mục 14.)*
- [x] **K6. Việc cần làm**: GVCN một dòng nhắc vi phạm quá 5 ngày + một dòng `{n} lượt Phối hợp SOS cần xử lý`;
      GVBM một dòng `{n} case chờ xác định nguyên nhân` (nhóm `cause` trong `myWork` — **máy chủ đã có từ PR-T**,
      K6 chỉ vẽ ra giao diện, không viết lại luật; dòng GVBM tự hiện qua `WorkList.tsx` có sẵn, không cần code
      thêm). Thêm `myCoordinationLines()` (mới, viết TDD) cho dòng Phối hợp SOS.
- [x] **K6b.** `web/src/modules/cases/CaseBoardPage.tsx` khoảng dòng 451 còn chữ cứng `Cần chú ý` → đổi đọc
      `URGENCY_LABEL` để hiện đúng `Bình thường` (PR-T mục "Kết quả" điểm 14 để lại việc này cho PR-K).
- [x] **K7.** Bấm thử một lượt ba vai + 375px theo §10 mục 5, 7, 9–15. `npm run check` xanh. Mục 14.
      Mở PR, không tự merge. *(Bấm thử cả bốn vai — Quản trị, GVCN, GVBM, Quản lý — xem mục 14 để biết chi tiết
      từng kịch bản.)*

## 23.3b. PR-K2 — Sửa sau rà soát PR-K (thêm 22/09/2026)

**Nguồn:** rà soát độc lập PR-K (#42) của session planning, 22/09. Không có lỗi nghiêm trọng (quyền kiểm đúng ở máy chủ,
không lộ dữ liệu, chạy được với database rỗng). Bốn lỗi đáng sửa + vài việc nhỏ rẻ. **Chỉ giao diện**, trừ K2-1 có thể
chạm một route danh sách. Không đổi luật nghiệp vụ.

**Model:** Sonnet 5 · High · **B:** Fable 5.1 · Medium. **Chạy song song được với PR-Z2a** — không chung file (Z2a sửa
`db.ts`, `attachments.ts`, `violations.ts`, `routes/index.ts` phần `/demo` và `/auth/info`, `WelcomePage.tsx`, `App.tsx`;
K2 sửa `web/src/modules/yThuc/*`, `SkillBoard.tsx`, `CaseSosControls.tsx`). Nếu K2 buộc phải sửa một trong các file của Z2a
→ dừng, ghi mục 14, hỏi. Merge K2 trước Z2a nếu cả hai xong cùng lúc.

- [ ] **K2-1 🔴 trước deploy — số và danh sách phải khớp khi lọc ngày.** `web/src/modules/yThuc/YThucAnalysisView.tsx`:
      các số tính với `from`/`to` nhưng `<SoLieu>` chỉ đưa `branchId` (+ `kind`) vào đường bấm ra danh sách → chọn khoảng
      ngày thì số và danh sách lệch nhau (vi phạm hợp đồng số liệu, xem chú thích cảnh báo ở `SoLieu.tsx` ~dòng 43).
      Sửa: mọi `<SoLieu>` trong file nhận `extra={{ ...(from && { from }), ...(to && { to }), ...(kind nếu có) }}`.
      Rồi **kiểm máy chủ**: route danh sách mà `<SoLieu>` mở (đọc `SoLieu.tsx` để biết đường) có đọc `from`/`to` cho
      từng chỉ số Ý thức & Phối hợp không. Không đọc → sửa ở máy chủ theo TDD: phép kiểm "với một khoảng ngày, số của
      chỉ số = số dòng của danh sách" cho `vi-pham-tong` và `phoi-hop-luot-sos`.
- [ ] **K2-2 — biện pháp `Đang chuẩn bị` không được biến khỏi tab lớp.** `ClassYThucCard.tsx` (~dòng 73–83, 178–192):
      dòng học viên hiện chỉ lấy từ `unhandled.students`; em đã gom hết vi phạm vào một biện pháp đang chuẩn bị thì rơi
      khỏi danh sách → GVCN không `Xác nhận` được từ tab lớp. Sửa: dòng = **hợp** của học viên có vi phạm chưa xử lý và
      học viên có biện pháp trong `preparing[]`. Cột `Xử lý` hiện thêm `Gần đây:` với tối đa 3 biện pháp gần nhất từ
      `history.latest` (máy chủ đã trả), rỗng thì `Gần đây: —` (đúng hình `SOS_VA_PHOI_HOP_V3.md` §7.1).
- [ ] **K2-3 — không báo lỗi đỏ sau khi bấm; nút mờ + câu thiếu gì trước khi bấm.** Làm theo mẫu đã đúng ở
      `ConfirmMeasurePanel` (dùng chung hàm kiểm nếu có, như `measureMissing`). Các chỗ:
      `RecordViolationPanel.tsx` ~66–70 (độ dài mô tả) · `CreateMeasurePanel.tsx` ~52–53 (danh sách vi phạm rỗng — nút
      hiện vẫn bấm được sau khi gỡ hết; `Khác` thiếu tên) · `CaseSosControls.tsx` ~81 (thay phương án < 8 ký tự) và
      ~147–148 (lý do `Không cần theo dõi`) · `PhoiHopSosSection.tsx` ~176–177, ~227–228. Lỗi **từ máy chủ** (mất mạng, hết
      quyền) vẫn hiện như cũ — chỉ bỏ lỗi đỏ cho điều kiện biết trước được.
- [ ] **K2-4 — case đóng "Không cần theo dõi" phải nói rõ.** `SkillBoard.tsx`: `c.sos.dismissed` đã có kiểu (~dòng 55) nhưng
      không vẽ. Hiện đúng chữ đặc tả `Không cần theo dõi · {lý do}` (`SOS_VA_PHOI_HOP_V3.md` dòng ~74) trên thẻ case, lý do
      lấy nhãn lý do chọn nhanh (hoặc chữ tự gõ khi lý do là `Khác`).
- [ ] **K2-5 — việc nhỏ rẻ, cùng các file trên:**
      a. Dòng học viên ở tab lớp chia theo nhóm: `5 vi phạm · 3 BTVN · 2 Chuyên cần` (§7.1). Máy chủ chưa trả số theo nhóm
         thì đếm ở giao diện từ danh sách vi phạm đã tải — không thêm route.
      b. Nút `+ Ghi vi phạm` của thẻ lớp (`ClassYThucCard.tsx` ~98) chỉ hiện khi người xem ghi được (dùng cờ quyền máy chủ
         đã trả, ví dụ `viewer.canRecordViolation`; thẻ lớp chưa có cờ thì thêm một trường `canRecord` vào câu trả lời của
         bảng lớp, tính bằng **đúng** hàm quyền mà route ghi vi phạm dùng).
      c. `YThucReminders`: đổi `Alert tone="warn"` sang tông trung tính (P10: nhắc mềm không được trông như quá hạn).
      d. `CauseDeterminationPanel` (`CaseSosControls.tsx` ~21): không có nguyên nhân nào cho chủ đề → hiện một câu giải
         thích thay vì nút `Lưu` mờ im lặng. Chữ: lấy từ `TU_DIEN_VA_CHU.md` nếu có; không có thì xem mục e.
      e. Ngày dự phòng `new Date().toISOString().slice(0,10)` (ngày UTC — chậm một ngày trước 7 giờ sáng ở Việt Nam) ở
         4 file của `web/src/modules/yThuc/` → dùng `useNgayNghiepVu()` (hoặc hook ngày nghiệp vụ có sẵn — tìm trong
         `web/src/lib`).
      f. **Chữ tự viết ngoài bộ chữ:** "Chưa có gì trong khoảng này" · "Không có lượt Phối hợp SOS nào" · "Đã chọn nguyên
         nhân" · "Case đã đóng — Không cần theo dõi" · "Đã thay phương án" · "Chỉ hiện lượt chưa xong" · "Vi phạm này
         chưa nằm trong biện pháp nào." · "Đã xoá vi phạm" · `SectionNote` của panel biện pháp. Với mỗi câu: có câu tương
         đương trong `TU_DIEN_VA_CHU.md` → dùng câu đó. Không có → **giữ** câu, và thêm một dòng vào `TU_DIEN_VA_CHU.md`
         mục 6 kèm ghi chú `(PR-K, chờ chủ sản phẩm duyệt)` — để câu không còn "ẩn".
- [ ] **K2-6 — ghi lại việc CHƯA làm, đừng làm ở PR này** (chuyển sang PR-Q/PR-S sau deploy; ghi vào `BAN_DO_OVERHAUL.md`
      và mục 12): nút `Ghi vi phạm` ở từng dòng `ClassRoster.tsx` · link `Xem vi phạm đó` ở cảnh báo trùng V06 · bảng
      5 nhóm × 4 trạng thái (§7.6) · lọc theo lớp ở góc nhìn Quản lý · số Phối hợp SOS chia SOS1/2/3 · số `Phối hợp SOS {n}`
      ở hồ sơ học viên · nút `[Mở]`/`[Xem]` cho biện pháp đã thực hiện ở dòng thời gian học viên · đính kèm tệp ngay lúc
      ghi vi phạm mới · toast `Hoàn tác` sau khi ghi vi phạm (Y_THUC §7.2) · máy chủ tự lấy người đang đăng nhập làm
      `performedBy` khi để trống (`measures.ts` ~390) · lớp dùng để kiểm nút ghi vi phạm ở `profile.ts` ~891 lệch với
      `activeClassOf` ở máy chủ sau khi em chuyển lớp.
- [ ] **K2-7.** `npm run check` xanh. Bấm thử: Quản lý chọn khoảng ngày → bấm từng số → danh sách **đúng bằng** số; GVCN gom
      hết vi phạm của một em vào biện pháp `Đang chuẩn bị` → em vẫn còn ở tab lớp, bấm được `Xác nhận`; GVBM không thấy
      `+ Ghi vi phạm` nếu không có quyền; một case đóng `Không cần theo dõi` hiện lý do; khổ 375px. Mục 14. Mở PR, không
      tự merge.

## 23.4. Sau khi merge ba PR

1. Làm theo `TRIEN_KHAI.md` để đưa bản chính lên mạng.
2. Việc còn lại **sau deploy**, theo thứ tự `PR-O → PR-Q → PR-P → PR-R → PR-S` (Q trước P vì hồ sơ lớp/HV là
   chỗ GV dùng hằng ngày; Tổng quan/Phân tích mới là việc của QL, đợi được).

---

# 24. BẢN CHÍNH TRÊN NETLIFY + TURSO — thay `PR-Z` của mục 23.2

**Chốt 21/09/2026 (chiều):** bản chính chạy trên **Netlify** (giao diện + Netlify Functions cho máy chủ) và
**Turso** (database, cùng họ SQLite với bản đang chạy), tệp tải lên ở **Netlify Blobs**. Miễn phí, không cần
máy nào luôn bật, `git push` là tự deploy. Làm **tối 21/09 với gói Max (Opus)**, sau khi `PR-T` và `PR-K` đã merge.

`PR-Z` ở mục 23.2 **hết hiệu lực** (nó viết cho kiểu "một máy luôn bật"). Thay bằng `PR-Z2` dưới đây.

## 24.0. Vì sao Turso, không phải Supabase

| | Turso | Supabase |
|---|---|---|
| Loại database | libSQL — **cùng ngôn ngữ SQLite** với mã hiện tại | Postgres — ngôn ngữ khác |
| `schema.sql` (~1.400 dòng) | Chạy **nguyên văn** | Phải dịch từng bảng (kiểu khoá tự tăng, chỉ mục một phần, kiểu ngày…) |
| Chỗ dùng cú pháp riêng SQLite (đã đếm) | Không phải sửa | 55 `lastInsertRowid` · 34 `PRAGMA` · 8 `INSERT OR IGNORE` · 4 `INSERT OR REPLACE` · 5 `GROUP_CONCAT` · 2 `julianday` · mọi dấu `?` → `$1` |
| Đổi cách gọi thành "hỏi rồi chờ" (async) | Có | Có |
| Chạy phép kiểm ở máy dev | Dùng file cục bộ `file:data/...`, **cùng một đường code** | Phải dựng Postgres cục bộ hoặc gọi mạng khi test |

Tức là Supabase = **cùng** khối việc async **cộng thêm** dịch SQL cho ~1.000 câu truy vấn. Turso chỉ có khối
async. Supabase vẫn là lựa chọn tốt nếu sau này cần đăng nhập Google hay realtime — không cần bây giờ.

## 24.1. Kiểm rủi ro đã làm (21/09)

| Chỗ có thể vỡ trên Netlify | Kết quả kiểm mã | Việc cần làm |
|---|---|---|
| Phiên đăng nhập | Lưu ở bảng `demo_sessions` trong DB → **chạy được** | Không |
| Tác vụ chạy ngầm | **Không có** `setInterval`/cron; chốt dấu `-` cuối tuần chạy lúc đọc | Không |
| Tệp tải lên | `multer.memoryStorage()` rồi ghi ổ đĩa | Đổi nơi ghi sang Netlify Blobs; **hạ giới hạn 10 MB → 4 MB** vì Functions nhận tối đa ~6 MB mỗi lần gọi |
| Gọi database | **1.035 chỗ / 51 file**, kiểu đồng bộ; **77** chỗ dùng `tx(...)` | Khối việc chính — Z2 |
| Độ trễ | Mỗi câu hỏi DB thành một lượt đi mạng. Trang nào hỏi DB trong vòng lặp (N+1) sẽ chậm | Đặt Turso **cùng vùng** với Functions; đo 5 trang nặng nhất (Z8) |
| Thời gian tối đa một lần gọi | Functions mặc định ~10 giây | Đo ở Z8; trang nào vượt thì gộp truy vấn |
| Dữ liệu cũ | Bản chính **rỗng** — không có gì phải chuyển | Chỉ chạy `schema.sql` + dữ liệu nền |

## 24.2. PR-Z2 — các bước (tóm tắt) · **chia ba PR Z2a / Z2b / Z2c — xem plan chi tiết mục "Ba phần"**

> **Kế hoạch chi tiết để thực thi: `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`** (12 task, có code,
> phép kiểm, hai gate 🛑). Danh sách Z0–Z9 dưới đây chỉ là tóm tắt — **khi hai nơi khác nhau, file chi tiết thắng.**
>
> **Đã thử trước (21/09, session thiết kế):** thay `better-sqlite3` → `libsql` và chạy toàn bộ phép kiểm với file cục bộ:
> **511/512 đạt** sau ba sửa nhỏ (giao dịch lồng → savepoint; một câu `.run(null)`; dọn thư mục tạm trên Windows).
> → **Không phải đổi 1.035 chỗ gọi DB sang async.** Còn phải chứng minh đường mạng tới Turso (gate Task 3).
> Phát hiện thêm: **không có màn nào tạo chi nhánh** → lệnh khởi tạo nhận `CHI_NHANH`, thêm `npm run them-chi-nhanh`.
>
> **Tình trạng 22/09:** Z0–Z5 xong ở **PR-Z2a** (Z0 chọn đường **a** — `libsql` đồng bộ chạy qua mạng, nên **Z2 không
> cần làm**). Z6, Z7 và phần tài liệu của Z9 xong ở **PR-Z2b**. **Z8 (deploy thật) là PR-Z2c.** Chi tiết + số đo: Nhật ký
> cuối file kế hoạch chi tiết.

- [x] **Z0. Thử nhanh (≤ 45 phút) — chọn đường.** (a) Thư viện `libsql` (bản tương thích `better-sqlite3`, gọi
      đồng bộ) có nối được Turso từ trong một Netlify Function không? Nếu **có** → không phải đổi 1.035 chỗ sang
      async, Z2 chỉ còn đổi chỗ khởi tạo kết nối. (b) Nếu **không** → dùng `@libsql/client` (bản `/web` hoặc
      `/http` trong Function để khỏi kéo mã native), đi Z2 đầy đủ. (c) Đo thời gian một câu `SELECT 1` từ
      Function tới Turso ở vùng đã chọn. **Ghi kết quả + đường đã chọn vào mục 14 trước khi làm tiếp.**
- [x] **Z1. Một cửa kết nối.** `server/src/db.ts` đọc `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`; máy dev và
      phép kiểm dùng `file:data/pisa-demo.sqlite` — **cùng một đường code**, không có nhánh riêng cho test.
- [x] **Z2. Đổi cách gọi DB** (chỉ khi Z0 chọn đường b). Làm **theo module**, mỗi module một lượt, chạy
      `npm test` sau mỗi lượt: `platform` → `students` → `classes` → `fasttrack` → `normal` → `cases` →
      `yThuc` → `worklist` → `routes` → `seed` → `migrate`. `tx(...)` → giao dịch ghi của libSQL
      (`client.transaction('write')` hoặc `batch`). **Không** đổi luật nghiệp vụ nào; **không** gộp hay
      "tối ưu" truy vấn ở bước này — chỉ đổi cách gọi. Mọi phép kiểm cũ phải xanh nguyên số lượng.
- [x] **Z3. Máy chủ thành Netlify Function.** Bọc `server/src/app.ts` (đã tách ở PR-J) bằng `serverless-http`
      thành `netlify/functions/api.ts`. `netlify.toml`: lệnh build, thư mục `dist`, chuyển `/api/*` →
      function, mọi đường khác → `index.html` (link sâu như `/hoc-vien/12` mở được).
      `npm run dev` ở máy dev **không đổi**.
- [x] **Z4. Tệp tải lên → Netlify Blobs** (`@netlify/blobs`), máy dev vẫn ghi `data/uploads`. Giới hạn
      **4 MB** ở `shared/domain/attachments.ts` (máy chủ và giao diện đọc chung). Luật quyền tải xuống giữ nguyên.
- [x] **Z5. Tắt mọi thứ của bản demo khi production** (như 23.2 Z3 cũ): route `/api/demo/*` trừ phần đăng nhập
      thật cần, "Vào nhanh bằng tài khoản demo", `DemoBar`, `/dev/thanh-phan`; `demoToday()` ra ngày thật;
      `scenario_mode` luôn `normal`; cookie `Secure` khi chạy https.
- [x] **Z6. `npm run init-ban-chinh`** — chạy **từ máy của chủ sản phẩm**, trỏ vào Turso qua biến môi trường:
      tạo bảng từ `schema.sql` + dữ liệu nền (vai trò, quyền, chương trình, danh mục — tách khỏi `seed.ts`
      thành hàm dùng chung) + **một** tài khoản quản trị từ `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
      **Từ chối chạy nếu DB đã có dữ liệu.** Có phép kiểm cho việc từ chối này.
- [x] **Z7. `npm run sao-luu`** — chạy từ máy chủ sản phẩm: tải toàn bộ DB Turso về một file
      `pisa-YYYY-MM-DD-HHmm.sqlite` trong `BACKUP_DIR` (trỏ vào thư mục Google Drive được), giữ 14 bản.
      File đó mở lại được bằng chính mã hiện tại (`file:`) — có phép kiểm.
- [ ] **Z8. Deploy thật + kiểm trên địa chỉ thật** (phần quan trọng nhất): init → đăng nhập quản trị → tạo chi
      nhánh → tài khoản GV/QL → lớp + phân công → thêm HV → xếp MT → nhập điểm có SOS → thấy case + phương án
      điền sẵn + Phối hợp SOS → ghi vi phạm → tạo biện pháp → tải một tệp. Mọi màn chính mở được khi bảng
      rỗng. **Đo thời gian tải** hồ sơ học viên, bảng chấm cả lớp, Tổng quan, Thực trạng, tab Ý thức & Phối
      hợp của lớp: trang nào > 3 giây thì gộp truy vấn của **chính trang đó** (không tối ưu lan man).
- [x] **Z9.** Cập nhật `README.md` (máy dev vẫn như cũ + một mục "Bản chính"), `CODE_MAP.md`, mục 14.
      Mở PR, **không tự merge**.

## 24.3. Thứ tự tối nay

```
Bây giờ (Sonnet):   PR-T  →  PR-K                       ← như mục 23, không đổi
Tối nay (Max/Opus): merge PR-T, PR-K  →  PR-Z2 (Z0 → Z9)
Chủ sản phẩm:       tạo tài khoản Turso + Netlify (TRIEN_KHAI.md mục 2) trong lúc Z0–Z5 chạy
                    → dán biến môi trường → Z8 kiểm trên địa chỉ thật → merge → gửi link cho GV
```

**Không** chạy PR-Z2 song song với PR-T/PR-K: Z2 đổi cách gọi DB ở **mọi** file máy chủ — chạy song song là
xung đột chắc chắn.
