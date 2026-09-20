# PISA Progress — Kế hoạch giai đoạn sau PR18

> **Dành cho session code:** đây là file kế hoạch **sống**. Đọc hết mục 0–4 trước khi gõ dòng
> code đầu tiên, rồi làm **đúng một PR** theo mục tương ứng. Các bước dùng ô đánh dấu
> (`- [ ]`); đánh dấu xong từng bước ngay trong file này.
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

Thứ tự tin cậy: **sổ audit mục 13–14 > brief vong7 > code đang chạy > file bàn giao.**
Và chạy thật > đọc code.

### 1.3. Kỹ thuật dễ vấp

| Chuyện | Phải làm thế nào |
|---|---|
| Biên dịch | Dùng **`tsc`**. **TUYỆT ĐỐI KHÔNG** `tsx` hay `esbuild` làm trình chạy TS — cả hai đã từng làm hỏng máy chủ sản phẩm (Windows) |
| Đường dẫn khi import | Bắt buộc có đuôi `.ts` / `.tsx`. Thiếu là gãy |
| Sau khi sửa máy chủ | **Bắt buộc** `npm run build:server`. `npm run dev` KHÔNG tự dựng lại máy chủ |
| Kiểm kiểu dữ liệu | `npx tsc -p tsconfig.build.json --noEmit` và `npx tsc -p tsconfig.web.json --noEmit` |
| Chạy kiểm thử | `npm test` — hiện **319 phép kiểm**, phải đạt hết. Harness **không có bộ lọc**: nó chạy cả bộ, nên xác minh một phép kiểm mới bằng cách tìm tên nó trong kết quả |
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

---

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
  assert(row, 'Bộ demo phải có ít nhất một đợt tách tuần để kiểm — xem DEMO_SCENARIOS.md');

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

Học viên id 3 là Lê Quang Huy (hồ sơ dày nhất, xem `DEMO_SCENARIOS.md`).

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
      cho đúng việc BÁO vấn đề, tách khỏi `SOS_EDIT` đã siết.
- [ ] **Step 4: Nhập bù theo cùng luật.** `backfillCase` dùng đúng kiểm tra này, không đường riêng.
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

- [ ] **Step 1: Gỡ hai nút thừa.** Bỏ nút "Lịch sử và kết thúc phương án" (`SkillBoard.tsx:319`)
      và bỏ hẳn phần nhúng `CasePanel` bên dưới nó.
- [ ] **Step 2: Bỏ nút "Mở trang riêng", GIỮ đường dẫn.** Gỡ nút ở `SkillBoard.tsx:323`,
      `CaseBoardPage.tsx:482`, `StudentDetailPage.tsx:324`, `MockDetailPage.tsx:292`. **KHÔNG
      xoá route `/hoc-thuat/case/:id`** — thông báo và badge đang trỏ vào đó; xoá là gãy link
      sâu. Chủ sản phẩm chốt 19/09/2026.
- [ ] **Step 3: Hai nút thật vào chân khối case.** `+ Thêm phương án` và `Hoàn thành case`, đặt
      cùng dòng trạng thái. Dùng lại đúng hai hàm `CasePanel` đang gọi (`:256`, `:265`) — không
      viết luồng mới.
- [ ] **Step 4: Timeline phương án đóng/mở tại dòng.** Mỗi dòng phương án có mũi tên. **Đóng mặc
      định**, chỉ hiện kết quả mới nhất như hiện nay. Mở ra thấy lịch sử cập nhật của **chính
      phương án đó**. Lý do đóng mặc định: Lê Quang Huy có 5 case, mở hết là một trang cuộn vô
      tận. Sổ CASE-08 cũng chốt: *"không mở tất cả mặc định."*
- [ ] **Step 5: Panel "Ghi kết quả" hai lựa chọn.** `InlineResult` trong `SkillBoard.tsx` thêm
      một cặp lựa chọn: *Ghi kết quả, tiếp tục theo dõi* (phương án vẫn chạy) hoặc *Hoàn thành
      phương án* (hiện thêm ô ngày kết thúc, phương án đóng). **Một** panel, **một** nút chính
      đổi chữ theo lựa chọn — không phải hai nút cạnh nhau.
- [ ] **Step 6: Bỏ ô điểm tự chấm khỏi cập nhật phương án (CASE-05).** Gỡ `MetricsField` khỏi
      `ResultDialog` (`CasePanel.tsx:1356`) và khỏi panel ghi kết quả. Ô đó đang bày **bốn kỹ
      năng L/R/W/S** cho một case Listening — chủ sản phẩm gọi là "RẤT VÔ LÝ", và sổ CASE-05 đã
      chốt bỏ từ trước. **Dữ liệu điểm tự chấm cũ đã lưu thì GIỮ, không xoá** (CASE-05 nguyên
      văn: *"giữ quan sát định lượng lịch sử nếu đã có"*).
- [ ] **Step 7: Màn "Hoàn thành case" giữ nguyên.** Nó đang dùng `componentsFor` nên đã hiện
      **đúng tiêu chí của kỹ năng** (Listening → Section 1–4). Không đụng. Chỉ thêm nhánh Ý thức
      theo CASE-06: ghi chú bắt buộc + ngày + nút Hoàn thành case, **không** có ô điểm.

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
| **DATA-01** | `server/src/worklist/weekly.ts` lọc scope ở tập đợt thi, nhưng các phép đếm case/HV sau đó chỉ lọc `planned_period_id` | Hai chi nhánh cùng tuần **cộng lẫn số của nhau**. Sai theo hướng người xem không phát hiện được |

### 12.2. Case và Ý thức

CASE-04 file/link bằng chứng · CASE-07 nhãn hạn đúng nghĩa · gộp đợt theo cửa sổ bốn ngày ·
hạn xác minh SOS ba ngày · sửa điểm làm mất căn cứ case.

**Đã ra khỏi backlog 19/09/2026** — đừng làm lại ở đây: **CASE-05** (bỏ điểm tự chấm khỏi cập
nhật phương án) và **CASE-06** (bộ kết quả riêng cho Ý thức) nay nằm ở **mục 11 (PR-D)**;
phần còn lại của **CASE-01** (hai ô hỏi trùng) nằm ở **mục 10.1 (PR-C)**.

**Mới thêm 19/09/2026 (PR-C Task 3):** ô "Điểm chi tiết theo kỹ năng" của tab "Đã xong từ
trước" chưa nối dây giao diện. `backfillCase` (server) đã nhận sẵn `metrics` và validate như
`closeCaseOutcome`; chỉ thiếu component UI vì `MetricsField` hiện không export trong
`CasePanel.tsx` và PR-D dự kiến gỡ hẳn nó — nối dây sau khi PR-D quyết định hình dạng cuối
của khối kết quả, để không phải làm hai lần.

### 12.3. Thống kê và báo cáo

"Chưa đủ dữ liệu" không vào mẫu số hiệu quả (ANALYSIS-06) · cây Normal/FT → kỹ năng → phân
loại → chi nhánh/lớp (ANALYSIS-01) · drill-down ra đúng số (ANALYSIS-02) · WORK-02 ma trận
báo cáo · WORK-03 liên kết task thật.

### 12.4. Chưa có bằng chứng, cần chạy thật

- Hồ sơ trên **máy tính bảng và điện thoại thật** — hiện chỉ kiểm bằng khổ mô phỏng 375px.
- Rà các màn phụ theo **mục 17** của brief (tiêu chuẩn UI).

### 12.5. Bốn đường vào nhập điểm còn lại của Task 6 (khảo sát 18/09/2026)

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

---

## 13. Lệnh kiểm bắt buộc

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
| `web/src/ui/Han.tsx` | **Mới.** `<Han loai={...} han={...} hanGoc? hen? />` — sáu loại hạn + `du-kien-ket-thuc` |
| `web/src/ui/KetQuaDot.tsx` | **Mới.** Một câu duy nhất cho tiến độ một đợt Test |
| `web/src/ui/TyLe.tsx` | **Mới.** `n/N` trước, `%` sau; `N=0` → `Chưa có dữ liệu`; `N<5` → nhãn mẫu nhỏ |
| `web/src/ui/ngayNghiepVu.ts` | **Mới.** `useNgayNghiepVu()` — một nguồn ngày nghiệp vụ cho UI |
| `web/src/ui/Filters.tsx` | `WeekPicker` (`:98`): sửa bố cục một hàng + popover lịch |
| `web/src/ui/ui.tsx` | Gom bảng tone về một chỗ; không thêm component mới ở đây |
| `web/src/modules/fasttrack/ScoreEntry.tsx` | `DeadlinePill` (`:201`) gọi `<Han loai="nhap-diem">` thay vì tự dựng chuỗi |
| `shared/domain/week.ts` | Dùng lại hàm mã tuần đang có cho popover — **không viết hàm tính tuần thứ hai** |
| `server/src/tests/run.ts` | Phép kiểm cho luật của `<TyLe>` và `<KetQuaDot>` ở tầng thuần |

### 15.2. Các bước

- [ ] **Step 1: `<Han>`.** Sáu `loai` bắt buộc theo bảng `thiet-ke/HE_GIAO_DIEN.md` §4:
      `xac-minh-sos` · `lap-pa` · `cap-nhat-pa` · `thuc-hien-y-thuc` · `hoan-thanh-y-thuc` ·
      `nhap-diem`, cộng `du-kien-ket-thuc` (**không phải hạn**, luôn trung tính, không bao giờ
      ghi "quá hạn"). `loai` không có giá trị mặc định — thiếu thì `tsc` phải báo lỗi.
      Quá hạn đếm từ **hạn gốc**. Có hẹn xử lý thì hiện cả hai: `Hạn nhập điểm 23/09 · Hẹn xử lý 30/09`.
- [ ] **Step 2: `DeadlinePill` dùng `<Han>`.** `ScoreEntry.tsx:201` đang tự dựng bốn nhánh chuỗi
      (`Hạn riêng môn này` / `Hạn riêng cả đợt` / `Hạn` / `Quá hạn`). Giữ nguyên **nghĩa**, đổi
      **đường render**. Đây là chỗ duy nhất của PR-E chạm module fasttrack — đừng mở rộng.
- [ ] **Step 3: `<KetQuaDot>`.** Năm nhánh ở `thiet-ke/HE_GIAO_DIEN.md` §5. Hai luật cứng:
      (a) `coDiem < yeuCau` → Overall render chữ `Chưa đủ điểm`, **cấm** badge đạt (lỗi MT-P01);
      (b) đơn vị đếm là **bốn kỹ năng L/R/W/S** — W1/W2 là hai *bài nhập*, không bao giờ ghi
      `1/5` ở chỗ đang nói kỹ năng.
- [ ] **Step 4: `<TyLe>`.** Thứ tự `n/N` rồi `(%)`. `N=0` → `Chưa có dữ liệu`, **không** render
      `0%`. `N<5` → nhãn `mẫu nhỏ`. Component **không nhận** prop kiểu `xepHang`/`totNhat`.
- [ ] **Step 5: `useNgayNghiepVu()`.** Một nguồn duy nhất cho UI, đọc cùng đồng hồ với
      `demoToday()` ở máy chủ. Nơi nào ngày nghiệp vụ khác ngày ghi nhận thật thì hiện cả hai:
      `Ngày nghiệp vụ 14/09 · Ghi nhận 19/09`. **Không sửa timestamp thật.** (Lỗi MT-P10.)
- [ ] **Step 6: Sửa bố cục `WeekPicker`.** Một hàng flex, gap 8px, cao 40–44px; mũi tên
      `flex:none`, trường tuần `flex:1` **`min-width:0`** — thiếu dòng này chính là nguyên nhân
      wrap trong ảnh. Panel ~600px: chỉ `Tuần này` xuống hàng. Trường tuần luôn ghi tuần **đang
      chọn thật**, không để trống rồi chú thích dưới.
- [ ] **Step 7: Popover lịch.** Bấm trường tuần mở popover: gõ ngày hoặc chọn tuần, đổi
      tháng/năm. Bỏ dropdown hàng chục tuần. Render qua portal; kiểm z-index **trong `Drawer` và
      trong modal** — hiện đang bị cắt.
- [ ] **Step 8: Quét mọi nơi dùng bộ chọn tuần.** `CaseBoardPage` · `MeetingPage` ·
      `TransitionPanel` · `ClassCreatePanel` · `ClassProgressPanel` · `StudentPlanPanel` ·
      `ScoreSheetPage` · `MockPlanPanel`. Sửa CSS của **panel chứa**, không chỉ của component.
      **Trừ `CaseBoardPage.tsx`** — file này thuộc danh sách khoá ở mục 0.5, để sang chặng 4.
- [ ] **Step 9: Trang demo component nội bộ.** Một route dev dựng đủ sáu trạng thái mỗi
      component: rỗng · một bản ghi · nhiều · tên dài · lỗi tải · không quyền. Không có trang này
      thì nghiệm thu mục 15.3 không làm được.

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

- [ ] **Step 1: Sổ chỉ số.** `shared/domain/metrics.ts` theo bảng mười một chỉ số ở
      `thiet-ke/HOP_DONG_SO_LIEU.md` §2. Thiếu một trong tám trường thì không được lên dashboard.
- [ ] **Step 2: F01 — P0, làm trước.** `weekly.ts`: tập attempts đã lọc chi nhánh/chương
      trình/quyền, nhưng ba truy vấn sau đó chỉ lọc `planned_period_id` → **hai chi nhánh cùng
      tuần đang cộng lẫn vào nhau**. Sửa: ba truy vấn nhận chính tập attempt ID được phép.
      Phép kiểm: dựng hai CN cùng tuần, lọc một CN, khẳng định kết quả không chứa ID của CN kia.
- [ ] **Step 3: F02.** `issueBoard`: `students` đang đếm từ **mọi** case của phân loại trong khi
      `openCases` đã lọc chưa done. Tách `hv-co-case-mo` (hiện trạng) khỏi chỉ số lịch sử. Hiệu
      quả lịch sử **vẫn phải** đọc được PA của case đã đóng — đừng sửa bằng cách lọc bỏ hết.
- [ ] **Step 4: F03.** `planOutcomes` lấy HV từ enrollment đang active rồi đọc PA lịch sử → em
      chuyển chi nhánh làm mất mẫu ở nơi cũ và mọc ở nơi mới. Luật: **hiện trạng theo nơi đang
      chăm sóc, lịch sử theo đơn vị/người thực hiện tại thời điểm hỗ trợ.** Không đủ dữ liệu quá
      khứ thì ghi `chưa xác định nguồn`, **không** quy cho nơi hiện tại.
- [ ] **Step 5: F05.** Mẫu số đã loại `undetermined` nhưng response vẫn trả hàng/cột đó. Chuyển
      thành liên kết `Cần bổ sung đánh giá` **ngoài** bảng hiệu quả. Không xoá hồ sơ gốc.
- [ ] **Step 6: Route drill-down dùng chung.** Nhận `metricId` + phạm vi, gọi **đúng hàm đã sinh
      ra con số**, áp **cùng bộ quyền**. Phạm vi rỗng trả rỗng, không hiểu thành toàn hệ thống.
- [ ] **Step 7: `<SoLieu>`.** Hover → tooltip đọc thẳng từ `ChiSo` (câu hỏi, tập đủ điều kiện,
      quy tắc khử trùng, mốc thời gian, ngày dữ liệu). Bấm → panel `{n} {đơn vị} — {tên}` giữ
      nguyên bộ lọc, có đường quay lại.
- [ ] **Step 8: Đối soát F10.** Xuất tập ID sinh ra số ở Toàn cảnh và ở Phân tích rồi `diff`.
      Chênh lệch chỉ được chấp nhận khi **giải thích được bằng định nghĩa khác nhau**, và khi đó
      hai màn **phải đổi nhãn cho khác nhau**. Ghi kết quả đối soát vào báo cáo, kể cả khi hoá ra
      cả hai đều đúng.

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
| `server/src/tests/run.ts` | Sáu phép kiểm ở mục 17.4 |

### 17.3. Các bước

- [ ] **Step 1: `policy.ts`.** Chín hằng C01–C09 + `C10`. Mỗi hằng có chú thích nêu **cả hai
      phương án** và lý do đang chọn cái nào. Không rải `if`, **không viết migration** dựa trên
      một điểm chưa chốt.
- [ ] **Step 2: Lệnh `-` ở ô điểm.** L/R: gõ `-` thay cho số. W1/W2/S: **một** dấu `-` trong bốn
      tiêu chí là đủ báo chưa có bài **cho đúng bài đó**. Ô trống vẫn chỉ là chưa nhập; `-`
      không phải 0; điểm 0 vẫn là điểm 0.
- [ ] **Step 3: Hai chuỗi trạng thái.** Gợi ý trong ô: `Nhập - nếu học viên không làm bài`. Sau
      lưu: `Không có bài · Có thể sửa đến hết Chủ nhật {ngày}`. Sau chốt:
      `Không dự thi · Tuần {mã tuần}`.
- [ ] **Step 4: Hàm chốt thuần.** Theo mục 17.1. **Idempotent**: gọi mười lần ra một lần chốt,
      bộ đếm vắng không tăng thêm. Mỗi lần lịch/kỹ năng chỉ chốt **một lần**.
- [ ] **Step 5: Không lây sang bài khác.** `-` ở W1 **không** xoá W2/S, không tạo điểm 0. Nếu
      W1/W2 cùng một buổi Writing thì bộ đếm vắng **không tăng hai lần** — đếm theo đơn vị
      lịch/buổi, không theo số ô.
- [ ] **Step 6: Sửa trước chốt thì không tính vắng.** Đổi `-` thành điểm hợp lệ trước cuối tuần
      → không có lần vắng nào. Đã có **điểm chính thức** thì `-` không được xoá âm thầm — phải
      đi đường hiệu chỉnh có lý do.
- [ ] **Step 7: Nối vào luật vắng đã có.** Sau chốt: lần đầu dời đúng tuần kế tiếp (quyền GVCN),
      từ lần hai QL duyệt, chỉ QL khôi phục phần FT đã huỷ. **Quyền bấm dời lần đầu của GVCN
      không được mở cho mọi GVBM** chỉ vì GV là người báo `-`.
- [ ] **Step 8: Hai mốc không thay nhau.** `Hạn nhập điểm 23/09` (thứ Tư tuần kế, cho bài **có**
      thực hiện) và mốc chốt Chủ nhật (cho bài GV đã báo không có) hiện **khác tên, cạnh nhau**.
      Dùng `<Han loai="nhap-diem">` của chặng 1 — nó đã có sẵn trong cùng nhánh. **Đừng** tự
      dựng component hạn thứ hai.
- [ ] **Step 9: Normal không đổi.** Chốt vắng áp dụng cho Mock. Normal **vẫn phải đủ bốn môn**,
      không có huỷ nghĩa vụ Test. Đừng mang giới hạn FT sang Normal.
- [ ] **Step 10: Bàn phím ở bảng nhập điểm.** `Tab` sang ô kế · `Enter` xuống dòng · `-` là lệnh
      không có bài · `Esc` huỷ ô đang sửa. Trạng thái lưu **từng dòng** (`SaveState`), không lưu
      cả bảng rồi báo một lỗi chung.

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

- [ ] **Step 1: Gỡ khối case khỏi `MockDetailPage.tsx`.** Bỏ hẳn, không thu gọn. Giữ route và
      liên kết `Hồ sơ học viên`.
- [ ] **Step 2: Gộp hai bảng thành một.** Hiện có `Lịch theo kỹ năng` và `Điểm theo kỹ năng` lặp
      kỹ năng/hạn/trạng thái. Một bảng làm việc duy nhất, năm cột: **Kỹ năng · Lịch kiểm tra ·
      Điểm · Tình trạng và hạn · Thao tác**.
- [ ] **Step 3: Thu gọn bốn thẻ kỹ năng + Overall.** Tiến độ đợt lên header qua `<KetQuaDot>`;
      điểm từng môn nằm ở dòng tương ứng. Không lặp năm ô lớn ngay dưới cùng bộ điểm.
- [ ] **Step 4: Mở tiêu chí ngay tại dòng.** W1/W2/S: bốn ô + `Lưu`/`Huỷ` tại dòng; đóng lại thấy
      điểm và ngày cập nhật. Writing tổng là **một dòng phụ** dưới W1/W2, nói rõ là điểm tính từ
      hai task — **không** có ô nhập Writing tổng thứ ba.
- [ ] **Step 5: Bỏ nút `Đã thi` khỏi luồng chấm thường.** Có lịch và đúng quyền thì nhập được.
      Vắng là ngoại lệ có xác minh riêng; **không** tự ghi đã thi thật chỉ vì đến ngày.
- [ ] **Step 6: Một hành động chính mỗi dòng.** `Nhập/Sửa điểm` là nút chính. `Đổi lịch` · `Hẹn
      xử lý` · `Lịch sử` vào menu theo quyền. **`Huỷ lượt MT` rời khỏi đầu trang**, vào menu
      ngoại lệ của QL, phải nói rõ huỷ phần nào và giữ phần đã có điểm.
- [ ] **Step 7: Áp `<Han>` vào khối case ở `SkillBoard.tsx`.** Đây là chỗ F11 sai: `Dự kiến kết
      thúc` của PA đang bị trình bày như hạn phải làm. Dùng `loai="du-kien-ket-thuc"` (trung
      tính) cho ngày dự kiến và `loai="cap-nhat-pa"` cho nghĩa vụ cập nhật tuần.
- [ ] **Step 8: Người cập nhật ≠ người nhập điểm.** Ô điểm trống mà vẫn hiện "Người nhập" là sai
      (MT-P09). Tách hai khái niệm; không dùng tác giả thao tác làm bằng chứng đã có điểm.
- [ ] **Step 9: Lịch sử thay đổi thu gọn cuối trang.** Đếm số thay đổi; mở ra thấy ai sửa
      điểm/lịch/kỳ vọng/phạm vi, trước–sau, ngày và lý do. Không xếp log kỹ thuật ngang kết quả
      học tập.

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

- [ ] **Step 1: Gom chuỗi hệ thống.** Nhãn nghiệp vụ về `shared/domain/*` theo đúng tám module;
      nhãn thuần trình bày về `web/src/ui/chu.ts`. Không hard-code tiếng Việt rải rác trong JSX.
- [ ] **Step 2: Mười hai khái niệm không được nhập làm một** (`TU_DIEN_VA_CHU.md` §1). Vi phạm
      bảng này là **lỗi nghiệp vụ**, không phải lỗi biên tập.
- [ ] **Step 3: Áp bảng nhãn thay thế** (`TU_DIEN_VA_CHU.md` §2), theo từng nhóm màn.
- [ ] **Step 4: Trạng thái rỗng có ích.** Mỗi khối rỗng phải nói **thiếu cái gì + ai điền được +
      một nút**. Bỏ `Chưa có gì diễn ra`, `chưa ai bắt tay vào việc`, `chưa làm gì cho em thì
      chưa có gì để kết luận`.
- [ ] **Step 5: Badge nói rõ đếm của ai.** `Bạn cần chấm: {n} bài` (việc riêng) hoặc `Lớp còn {n}
      bài chưa nhập điểm` (toàn lớp). Không vừa nói toàn lớp vừa dẫn tới việc riêng.
- [ ] **Step 6: Bỏ chân trang giải thích.** Đơn vị đặt ở tên cột; công thức vào tooltip `Cách
      tính`. Nếu số bấm được thì **hình thức phải cho thấy điều đó**, không dạy bằng một đoạn văn.
- [ ] **Step 7: Quét mọi biến thể.** Trước khi đổi một chuỗi, `grep` toàn repo — kể cả test, seed
      và thông báo máy chủ. **Không chạm ghi chú thật do giáo viên nhập.**

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
| DS02 | Đồng hồ đếm ngược nhẹ trong ô `-`: `Còn 2 ngày để sửa` — chỉ chữ, không tô đỏ | Người nhập biết mình còn cửa sửa | Rất thấp | Trong PR-G |
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
