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
| Phát hiện kế hoạch sai khi bắt tay vào code | Sửa mục PR đó, **và** ghi một dòng vào **mục 12** nói vì sao đổi |
| Phát hiện lỗi mới ngoài phạm vi | Thêm vào **mục 10 (backlog)**. Đừng tự mở rộng PR đang làm |
| Chốt xong thiết kế cho PR2 hoặc PR3 | Viết chi tiết mức task cho PR đó, thay cho phần mô tả thiết kế hiện có |

Không cập nhật file này = lần bàn giao sau lại rơi vào đúng cái bẫy ở mục 1.2.

### 0.3. Làm một PR mỗi lần

PR1 → PR-A → PR2 → PR3, và PR-B chen vào lúc nào cũng được (mục 4). **Đừng gộp.** Lý do ở
mục 4; chúng được chia theo phụ thuộc thật, không phải chia cho đẹp.

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

---

## 4. Lộ trình và phụ thuộc

| PR | Nội dung | Chờ ai | Vì sao ở vị trí này |
|---|---|---|---|
| **PR1** | Số khớp danh sách, và đường đi tới đó | — | Lỗi đang chặn việc hàng ngày, và **không cần dựng thứ gì mới** |
| **PR-A** | Mở lại việc tạo case Ý thức (CASE-01) | — | P0 đang chặn hẳn một tính năng. Nhỏ, độc lập |
| **PR2** | Bộ chọn tuần dùng chung → Kế hoạch Test | PR1 | Bộ chọn tuần là nền cho PR3; Kế hoạch Test là màn cần nó nhất |
| **PR3** | Chấm điểm, dấu "–", màn hồ sơ Test gọn | PR2 | Dùng bộ chọn tuần của PR2 cho việc hoãn hạn chấm |
| **PR-B** | Phân công GV — nốt phần còn thiếu | — | Không chặn ai; ba luật chính đã chạy đúng (mục 2.2) |

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
> khoá lại hành vi đó (đã ĐẠT ngay, không cần Step 3). Xem mục 12.

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
- Kiểm: bằng tay trên trình duyệt (mục 11.2)

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

Theo mục 11.2. Bắt buộc thử bằng **cả ba** tài khoản: một GVBM · Quản lý Monbay · Quản trị.

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
> ("phát hiện lỗi mới ngoài phạm vi → thêm vào mục 10, đừng tự mở rộng PR đang làm"),
> quyết định là: làm **Step 1** (đã đúng sẵn, chỉ xác nhận) + sửa đúng **một lỗi thật đã xác
> định** (thông báo không điều hướng đi đâu, mục 10.5), rồi dừng Task 6 ở đây. Bốn đường còn
> lại ghi vào backlog mục 10.5 làm PR riêng.

**Files:**
- Modify: `web/src/modules/students/StudentsPage.tsx`, `web/src/modules/classes/ClassOverviewPage.tsx`,
  `web/src/modules/students/StudentDetailPage.tsx`, `web/src/modules/students/JourneyTimeline.tsx`

Theo bảng sổ §13.9. Mỗi đường mang theo **học viên + đợt + kỹ năng đang focus** trên đường dẫn.

| Xuất phát | Đích | Trạng thái sau khảo sát 18/09 |
|---|---|---|
| Thanh điều hướng chính | Hàng đợi, phạm vi mặc định theo vai | OK — `/my-work` đã đúng |
| Hàng lớp ở danh sách học viên | Bảng chấm đúng lớp, đúng phạm vi đang đếm | Badge đã mang `scope` (Task 5), nhưng mở ra hàng đợi lọc, không phải bảng chấm dạng lưới — xem mục 10.5 |
| Hàng học viên — bấm nhãn MT2/MT3/Final | Hồ sơ đúng đợt đó | Hiện mở thẳng màn chấm điểm, không mở hồ sơ — xem mục 10.5 |
| Đầu hồ sơ học viên | Panel danh sách đợt | Ô đầu hồ sơ không bấm được, không dẫn tới panel đợt — xem mục 10.5 |
| Mốc Test trên hành trình | Cùng hồ sơ Test, Back giữ ngữ cảnh | Mốc chỉ có tooltip, không có bấm — xem mục 10.5 |
| Thông báo | Focus đúng ô học viên/đợt/kỹ năng | **Đã sửa lỗi chặn hẳn** (entityType sai chuỗi nên chưa từng điều hướng); phần "focus đúng ô" vẫn ở mục 10.5 |

- [x] **Step 1: Mỗi dòng chấm định danh học viên + đợt**

Một học viên có thể nợ **nhiều đợt**. Khoá của dòng phải là `attemptId`, không phải
`studentId`. Kiểm bằng cách tìm một em có hai đợt còn nợ và xem có ra hai dòng.

**Đã đúng sẵn, không cần sửa** (xác nhận qua đọc code, không phải suy đoán):
`WorkQueue` (`StudentsPage.tsx`) dựng hàng từ `/attempts`, mỗi hàng một lượt (`key={r.id}`,
`r.id` là `attemptId`); `mywork.ts:306` gom theo `classId|kind|attemptNo|skill`, không theo
`studentId`; `ClassRoster.tsx:201` mỗi lượt trong lịch sử một em có link riêng theo `h.id`.
Một em nợ hai lượt (VD MT2 và MT3) ra đúng hai dòng, không gộp.

- [~] **Step 2: Đi hết sáu đường bằng tay** — làm dở: 2/6 đường đã đúng (thanh điều hướng
  chính, thông báo — sau khi sửa lỗi ở trên), 4/6 còn lại chuyển sang backlog mục 10.5 vì
  cần dựng thêm quy ước tham số, không phải một phép sửa nhỏ.

- [x] **Step 3: Commit** — gộp vào lần sửa lỗi thông báo, xem mục 12.

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
- [x] Badge = số dòng danh sách, kiểm bằng **cả ba vai**: GVBM · Quản lý · Quản trị — phép kiểm tự động + bấm thử thật cả ba tài khoản (mục 11.2), kể cả ca gốc "28→0" (Quản trị: badge 9 → danh sách 9 dòng đúng số ở `/hoc-vien` lớp MB-FOU 12)
- [x] Quản lý nay **có** số ở phạm vi quản lý (trước đây là 0) — bấm thử thật: Quản lý Monbay thấy 9 bài ở MB-FOU 12, không còn là 0
- [x] Badge ghi rõ "bài", không ghi "lượt"; chấm xong một ô thì số giảm một — bấm thử thật: nhập điểm Listening cho Lê Quang Huy, badge MB-FT 101 giảm từ 20 → 19
- [x] Đổi tuần trên bảng chấm **không** làm mất việc nợ ở hàng đợi — đúng theo kiến trúc: hàng đợi (`WorkQueue`/`/attempts?need=my_scores`) không nhận tham số tuần, tách bạch hẳn với bảng chấm theo tuần (`/nhap-diem/:id`); bấm thử thật xác nhận danh sách 19 dòng không đổi bất kể tuần nào đang mở ở bảng chấm
- [x] Một em nợ hai đợt thì ra **hai dòng**, không gom một dòng — phép kiểm tự động mới ("Một em nợ điểm ở từ hai đợt trở lên...")
- [x] Seed lịch tới 2027: mở nhập điểm ngày 14/09/2026 vẫn vào đúng tuần hiện tại — bấm thử thật `/nhap-diem/3` → mở đúng "W3 SEP 2026 · 14/09–20/09"
- [x] Listening 5.0→5.5 kỳ vọng 6.0 → **đỏ**, ghi "thiếu 0.5", kèm "Tăng 0.5 so với MT1" trung tính — bấm thử thật, đúng y hệt trên hồ sơ Lê Quang Huy
- [~] Đi hết sáu đường vào nhập điểm; Back giữ bộ lọc — **CHƯA XONG**: chỉ 2/6 đường xác nhận đúng (thanh điều hướng chính, thông báo — sau khi sửa lỗi). Bốn đường còn lại cần dựng thêm (xem mục 10.5), không làm trong PR1 để tránh mở rộng phạm vi
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
trên, ghi ở mục 12.

- [x] **Step 2: Chạy và xác nhận nó HỎNG** — `npm test`. Thực tế: phép kiểm đầu (bộ phân loại
  có sẵn) ĐẠT ngay; phép kiểm thứ hai (tạo case) HỎNG với lý do "Hãy đặt tên cho case" (thiếu
  `title`, không liên quan gì tới phân loại) — sau khi thêm `title` thì cả hai ĐẠT, không cần
  sửa gì ở tầng máy chủ/domain. Xem Step 3 và mục 12: lỗi CASE-01 nằm hoàn toàn ở giao diện.

- [x] **Step 3: Thêm bộ phân loại.**
  > **Cập nhật 18/09/2026 (session code PR-A):** giả định của bước này SAI. Đọc
  > `shared/domain/cases.ts:412–427` thì `ISSUE_TAXONOMY` đã có sẵn nhánh `behaviour` (BTVN ·
  > Chuyên cần · Tham gia trên lớp · Khác — dùng CHUNG một bộ bốn mã cho cả bốn nhóm chủ đề,
  > không phải mỗi nhóm một bộ riêng như mô tả gốc), và `issuesForTopic()` đã ánh xạ mọi
  > `BEHAVIOUR_TOPICS` sang nhánh đó từ trước. Phép kiểm Step 1 xác nhận: cả hai check đều
  > ĐẠT ngay khi chạy — check thứ hai chỉ cần thêm `title` (trường bắt buộc, thiếu trong bảng
  > mô tả gốc) để qua được bước kiểm đầu vào của `reportIssue`, không phải sửa phân loại. Xem
  > mục 12.

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
theo cửa sổ bốn ngày. Chúng ở backlog mục 10.

---

## 7. PR2 — Bộ chọn tuần dùng chung, rồi Kế hoạch Test

> **Mức chi tiết: thiết kế.** Viết chi tiết mức task **khi PR1 đã merge**, vì lúc đó mới biết
> chắc `WeekPicker` còn lại những gì. Session nào bắt tay vào PR2 thì viết task rồi cập nhật
> mục này, theo quy tắc 0.2.

### 7.1. Bộ chọn tuần dùng chung (sổ §13.8)

Đã có `WeekPicker` và `usePeriodWindow` ở `web/src/ui/Filters.tsx`, có hai mũi tên và cửa sổ
tuần trượt. **Việc là đem nó đi dùng và bù phần thiếu, không phải thiết kế lại.**

- Bề mặt: `← · 14–20/09/2026 · → · Tuần này`. Khoảng ngày là định danh chính; mã `W3 SEP` là
  nhãn phụ, **có năm** khi thiếu ngữ cảnh.
- Bấm vào trường mở popover: gõ ngày `dd/mm/yyyy`, hoặc chọn ngày trên lịch tháng → chọn cả
  tuần chứa ngày đó. **Không dropdown vài chục dòng.**
- Luôn chọn được tuần hiện tại và tuần đang được link tới, kể cả khi chưa có hàng trong
  database. Đường API **đọc** không được tạo hàng loạt tuần; chỉ `ensurePeriod` khi nghiệp vụ
  lưu cần ID.
- Lưu lựa chọn vào đường dẫn. Tải lại và Back không nhảy tuần.
- `scope='planning'` mở xa về tương lai; màn báo cáo kết quả giữ cửa sổ hẹp.

**Nơi phải đổi sang dùng chung:** `ScoreSheetPage.tsx` (đang là `<select>` 26 tuần — đúng cái
sổ bảo đừng làm), `MockPlanPanel.tsx`, Lộ trình, báo cáo kỳ họp, Thực trạng.

### 7.2. Kế hoạch Test (sổ §MT-01…MT-06)

- Đổi tên panel thành **Kế hoạch Test**; bỏ trường "Lượt MT đang chọn"; chỉ hiện lớp FT ở
  **cả** giao diện và API.
- Hai hàng lịch nhanh **RLW** và **Speaking**, vẫn xếp riêng từng kỹ năng được.
- Chọn một lượt đã có → sửa lịch, hiện **tuần cũ → tuần mới** trước khi lưu. Không tạo lại
  đợt, không đổi bộ kỹ năng bắt buộc vì một cái tick mặc định.
- Lỗi báo theo **từng học viên/kỹ năng**, giữ các lựa chọn hợp lệ còn lại.
- Đợt hoàn tất thì chỉ đọc.
- Dời lịch ở Kế hoạch Test và ở panel Lộ trình dùng **cùng** luật và quyền. Không vượt đợt
  Test kế tiếp; hai đợt cách một tuần thì **cảnh báo**; RLW và S cùng một đợt thì **không**
  cảnh báo.

### 7.3. Quyền lịch (sổ SCH-01, SCH-02)

`setSkillWeek` (`server/src/fasttrack/skillSchedule.ts:499`) hiện luôn đòi `PLAN_WEEK`, mà GV
không có quyền đó. Mở cho **GVCN** đổi lịch Normal trong lớp mình và **GVBM** đổi đúng môn
mình phụ trách. **Không** mở quyền FT chủ động — FT chủ động vẫn là của Quản lý.

### 7.4. Nghiệm thu PR2

T07 · **T09** · T10 · T13, cộng: đổi năm và giao năm chạy đúng; tuần không có dữ liệu vẫn
chọn được; tải lại và Back giữ tuần; lịch xa tới 2027 vẫn mở đúng.

**T09** là ca chủ sản phẩm nêu riêng: *một đợt FT định trước chỉ thi L/R thì đủ điểm L/R là
đợt hoàn tất* — không chờ S/W, và **không bịa Overall bốn môn** khi thiếu cấu phần. Nó nằm ở
PR2 vì PR2 là chỗ bộ kỹ năng bắt buộc của đợt được đặt.

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

## 10. Backlog — KHÔNG thuộc giai đoạn này

Hoãn **không** có nghĩa là đã xong. Đừng đánh dấu hoàn tất vì chưa làm.

### 10.1. P0 còn tồn — sổ §4.A

| Mã | Lỗi | Vì sao đáng ghi |
|---|---|---|
| **AUTH-01** | Quyền case chỉ kiểm "có phân công **bất kỳ** môn nào ở lớp" | GV Listening sửa được case Reading, tạo được PA Ý thức dù không phải GVCN. Lỗ quyền |
| **DATA-01** | `server/src/worklist/weekly.ts` lọc scope ở tập đợt thi, nhưng các phép đếm case/HV sau đó chỉ lọc `planned_period_id` | Hai chi nhánh cùng tuần **cộng lẫn số của nhau**. Sai theo hướng người xem không phát hiện được |

### 10.2. Case và Ý thức

CASE-04 file/link bằng chứng · CASE-05 bỏ điểm tự chấm khỏi cập nhật PA · CASE-06 bộ kết quả
riêng cho Ý thức · CASE-07 nhãn hạn đúng nghĩa · gộp đợt theo cửa sổ bốn ngày · hạn xác minh
SOS ba ngày · sửa điểm làm mất căn cứ case.

### 10.3. Thống kê và báo cáo

"Chưa đủ dữ liệu" không vào mẫu số hiệu quả (ANALYSIS-06) · cây Normal/FT → kỹ năng → phân
loại → chi nhánh/lớp (ANALYSIS-01) · drill-down ra đúng số (ANALYSIS-02) · WORK-02 ma trận
báo cáo · WORK-03 liên kết task thật.

### 10.4. Chưa có bằng chứng, cần chạy thật

- Hồ sơ trên **máy tính bảng và điện thoại thật** — hiện chỉ kiểm bằng khổ mô phỏng 375px.
- Rà các màn phụ theo **mục 17** của brief (tiêu chuẩn UI).

### 10.5. Bốn đường vào nhập điểm còn lại của Task 6 (khảo sát 18/09/2026)

PR1 chỉ sửa lỗi thông báo không điều hướng (đã xong, xem mục 12). Bốn đường sau cần dựng
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

---

## 11. Lệnh kiểm bắt buộc

### 11.1. Trước mỗi commit

```bash
npm run build:server && npm test && npx tsc -p tsconfig.build.json --noEmit && npx tsc -p tsconfig.web.json --noEmit
```

Cả bốn phải sạch. `npm test` phải **đạt hết** — số phép kiểm chỉ tăng, không giảm.

### 11.2. Bấm thử thật trước khi báo xong

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

### 11.3. Dọn sau khi xong — ràng buộc số 2 của chủ sản phẩm

```bash
pkill -f concurrently
curl -s -o /dev/null -w "5173:%{http_code}\n" --max-time 3 http://localhost:5173
curl -s -o /dev/null -w "4000:%{http_code}\n" --max-time 3 http://localhost:4000
```

Cả hai phải **không** trả về gì. Nếu đã gỡ Playwright tạm thì `git checkout -- package.json
package-lock.json`.

### 11.4. Báo cáo cho chủ sản phẩm

Nói **cái gì đổi trên màn hình**, bằng tiếng Việt, không tên hàm. Mục nào chưa làm thì ghi
**chưa làm** — đừng ghi hoàn tất khi còn component chưa nối. Kèm ảnh trước/sau cho mỗi màn
đã đổi.

---

## 12. Lịch sử cập nhật file này

| Ngày | Ai | Đổi gì và vì sao |
|---|---|---|
| 18/09/2026 | Claude + chủ sản phẩm | Tạo file. Soát prompt giai đoạn mới, đối chiếu sổ audit, tái hiện được lỗi badge (28→0) và CASE-01. Chốt: `±` so kỳ vọng · badge đếm bài kỹ năng · CASE-01 thành PR riêng · chia PR theo cách 1 |
| 18/09/2026 | Claude (session code PR1) | Task 2 sai giả định: `SkillCell.required` đã tồn tại và độc lập với `canEdit`/`mine` từ trước — không cần sửa sản phẩm, chỉ thêm phép kiểm khoá hành vi. Ghi chú tại mục Task 2 |
| 18/09/2026 | Claude (session code PR1) | Task 6 lớn hơn nhiều so với mô tả: khảo sát 6 đường phát hiện 4/6 cần dựng mới (quy ước tham số focus, tay bấm mốc hành trình). Thu hẹp về đúng 1 lỗi đã xác định (thông báo sai `entityType` nên chưa từng điều hướng, `web/src/modules/platform/Header.tsx`) + xác nhận Step 1 đã đúng sẵn; 4 đường còn lại chuyển sang backlog mục 10.5 làm PR riêng |
| 18/09/2026 | Claude (session code PR1) | PR1 (Task 1–7) hoàn tất, bấm thử thật bằng cả ba vai — mục 5.2 đã cập nhật bằng chứng cho từng dòng. Chỉ mục "sáu đường vào nhập điểm" còn dở (2/6), đã ghi rõ trong mục 5.2 và 10.5, không tự nhận là xong |
| 18/09/2026 | Claude (session code PR-A) | Task 1 Step 3 sai giả định: `shared/domain/cases.ts:412–427` đã có sẵn nhánh phân loại `behaviour` (bốn mã BTVN/Chuyên cần/Tham gia/Khác dùng CHUNG, không phải mỗi nhóm một bộ riêng như mô tả gốc) và `issuesForTopic()` đã ánh xạ đúng — không cần sửa domain/server. Lỗi CASE-01 nằm ĐÚNG MỘT chỗ: `QuickReport.tsx:80` tự chặn với điều kiện `track === 'academic'`. Đã sửa đúng một dòng đó. Phép kiểm Step 1 cũng cần thêm trường `title` (bắt buộc ở `reportIssue`, thiếu trong bảng mô tả gốc của plan) |
