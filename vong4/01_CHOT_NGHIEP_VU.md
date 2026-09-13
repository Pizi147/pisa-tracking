# Vòng 4 — Chốt nghiệp vụ

Nguồn: `PISA_Claude_Prompt.md` (owner gửi 12/09/2026) + bốn vòng hỏi đáp 12–13/09/2026.
Ngày chốt: **13/09/2026**. Trạng thái: **CURRENT** — thay thế mọi quyết định cũ mâu thuẫn.

> Đọc tài liệu này TRƯỚC khi viết dòng code nào của vòng 4. Chỗ nào mâu thuẫn với
> `PISA_Design_Master_Reference.md`, tài liệu này thắng — master reference đã được đánh dấu
> SUPERSEDED ở đúng những mục đó.

---

## 0. Ba thứ bị đảo ngược so với vòng 3

Vòng 3a (đã merge, PR #9) làm đúng theo lời owner lúc đó. Prompt mới đảo ngược. Owner đã xác
nhận lại ngày 13/09: **theo prompt mới**.

| Vòng 3a đã làm | Vòng 4 phải làm | Hệ quả kỹ thuật |
|---|---|---|
| Hai việc trao đổi (học viên/phụ huynh) nằm ở bảng riêng `student_contacts`, tách khỏi học thuật | Chúng là **hai phương án của một case "Ý thức/Khác"** | Bỏ bảng `student_contacts`, bỏ `ContactPanel`, bỏ nhóm việc `contact`; **di trú** dữ liệu cũ sang case + `case_interventions` |
| Case gắn với **một lượt MT × một kỹ năng**; mở lại thì tạo mạch mới nối vào mạch cũ | Case gắn với **một học viên × một hạng mục**, sống xuyên suốt khoá học | `sos_cases` bỏ ràng buộc theo `attempt_id`; thêm bảng mốc; đổi khoá gộp |
| Có khu "Điểm chính thức" và "Ghi nhận của GV" (`skill_checkins`) | **Bỏ hẳn cả hai**, kể cả chức năng GV chấm điểm ngoài luồng case | Bỏ bảng `skill_checkins`, bỏ mọi endpoint/UI liên quan; đánh giá của GV chỉ còn nằm trong "cập nhật kết quả case" |

Lý do owner chọn bỏ hẳn `skill_checkins` (Q3): giữ thêm một đường chấm điểm song song tạo hai
nguồn số liệu đá nhau — đúng thứ đang làm bảng biểu lộn xộn. GV muốn ghi nhận gì thì đã có
nút **"+ Case"**.

---

## 1. Case — mô hình mới

### 1.1. Đơn vị case

**Một case = một học viên × một hạng mục.** Sáu hạng mục:

| Mã | Nhãn giao diện | Loại |
|---|---|---|
| `listening` | Listening (L) | học thuật |
| `reading` | Reading (R) | học thuật |
| `writing_1` | Writing 1 (W1) | học thuật |
| `writing_2` | Writing 2 (W2) | học thuật |
| `speaking` | Speaking (S) | học thuật |
| `behaviour` | Ý thức/Khác | ý thức |

Lớp Normal quy về cùng sáu hạng mục này để mọi bảng tổng hợp dùng chung một bộ cột:

- **Pronunciation** (lớp FOU) → hạng mục **`speaking`**
- **Writing** của lớp Normal → hạng mục **`writing_2`**

> Quy tắc thứ hai là chữ của owner trong prompt (mục 10.6, khi môn đó còn tên "Prep Writing").
> Môn nay đổi tên thành **W**, nhưng ánh xạ giữ nguyên vì Writing ở trình độ Normal là viết
> đoạn/bài — gần Task 2 hơn Task 1.

### 1.2. Vòng đời — case sống xuyên suốt

Khoá gộp: **`(student_id, category)`**. Mỗi cặp chỉ có **một case đang mở**.

- MT sau lại trượt cùng hạng mục → **KHÔNG mở case mới**. Thêm một **mốc** vào case đang mở,
  đổi tên case sang MT mới nhất, giữ nguyên toàn bộ phương án và kết quả cũ.
- Case đã **chốt "kết thúc hẳn"** mà MT sau lại trượt → **mở lại chính case đó**, ghi mốc
  `tái phát`. Không tạo case mới, không tạo case-nối-case.
- Một case có thể kéo dài suốt khoá học. Đó là mục đích: nhìn vào biết phương án cũ chưa ăn thua.

**Ngoại lệ duy nhất — case Ý thức/Khác tự sinh từ MT:**

| Nguồn case Ý thức/Khác | Vòng đời |
|---|---|
| **Tự sinh sau một đợt MT có SOS** (chứa 2 việc trao đổi) | Case **thông báo**, gắn với đúng lượt MT đó. Xong cả 2 việc → đóng. MT sau có SOS → case Ý thức/Khác **mới**. Khoá gộp là `(student_id, 'behaviour', attempt_id)` |
| **Do GV tự báo** (chuyên cần, BTVN, tham gia trên lớp, khác) | **Sống dai** như case học thuật. Khoá gộp là `(student_id, 'behaviour')` |

### 1.3. Tên case

Tên tự sinh, cập nhật theo mốc mới nhất:

```
MT1 - Listening dưới kỳ vọng        → sau MT2 vẫn trượt → MT2 - Listening dưới kỳ vọng
MT1 - 2 kỹ năng dưới kỳ vọng        (case Ý thức/Khác của đợt MT1)
```

Tiền tố `MT1/MT2/MT3…` là cách nhận diện case sinh từ điểm. Case do GV báo không có tiền tố.
**Không tách case-từ-SOS và case-do-GV-báo thành hai nhóm xử lý riêng** — cùng bản chất,
cùng cách xử lý (prompt 7.13).

### 1.4. Cảnh báo case trùng

GV bấm "+ Case" cho một hạng mục **đã có case học thuật chưa xong** → hiện pop-up:

> Học viên này đang có case *"MT2 - Listening dưới kỳ vọng"* chưa xử lý xong.
> [Ghi vào case đang có] [Đây là vấn đề khác, mở case riêng]

Chọn vế phải thì hai case tồn tại song song — hợp lệ, nhưng phải là quyết định có ý thức.

---

## 2. SOS và việc case tự sinh sau MT

### 2.1. Mức SOS

Tính trên **4 kỹ năng L, R, W, S** — trong đó **W là band tổng hợp** `(W1 + W2×2) / 3`,
làm tròn nửa điểm.

| Số kỹ năng dưới kỳ vọng | Mức |
|---|---|
| 1 | SOS 1 |
| 2 | SOS 2 |
| ≥ 3 | SOS 3 |

Việc tách W1/W2 để xử lý **không làm tăng** số kỹ năng dùng để tính SOS.

### 2.2. Sinh case sau mỗi đợt MT

```
Với mỗi kỹ năng trong { L, R, S }:
    band < kỳ vọng  →  1 case học thuật

Với Writing:
    band W tổng hợp >= kỳ vọng  →  KHÔNG sinh case nào, kể cả khi riêng W1 dưới kỳ vọng
    band W tổng hợp <  kỳ vọng  →  so W1 và W2 với CÙNG kỳ vọng đó:
                                     cả hai trượt  → 2 case (W1 và W2)
                                     một trượt     → 1 case (đúng task trượt)

Nếu SOS >= 1:
    thêm 1 case Ý thức/Khác "MT{n} - {số} kỹ năng dưới kỳ vọng"
    với 2 phương án: trao đổi với học viên · trao đổi với phụ huynh
```

Kiểm chứng bằng đúng hai ví dụ của owner:

| Ví dụ | Kết quả đúng |
|---|---|
| MT1, trượt L và S → SOS 2 | **3 case**: Listening · Speaking · Ý thức/Khác ("MT1 - 2 kỹ năng dưới kỳ vọng") |
| MT2, trượt W (cả W1 và W2) → SOS 1 | **3 case**: W1 · W2 · Ý thức/Khác |
| MT2, trượt W (chỉ một task) → SOS 1 | **2 case**: W1 *hoặc* W2 · Ý thức/Khác |

### 2.3. Phương án mặc định — GIỮ NGUYÊN, không đổi

Owner xác nhận (Q1): quy tắc cũ giữ nguyên.

```
Case học thuật:
    attemptNo >= 3            → tutor
    sosLevel  >= 3            → tutor
    còn lại                   → xếp tự học

Case Ý thức/Khác tự sinh:
    2 phương án cho MỌI mức SOS:
        · GVCN + GVBM trao đổi với học sinh
        · CS trao đổi với phụ huynh
```

Phương án tự sinh ở trạng thái **đã lên kế hoạch**, **không có người thực hiện**,
**không tự gửi duyệt**. Máy nói "theo quy định em này phải có cái này"; ai làm và có đúng là
cái đó không thì người quyết định.

---

## 3. Thời hạn

### 3.1. Hạn của phương án — theo độ cấp bách

| Độ cấp bách | Nguồn | Hạn |
|---|---|---|
| Bình thường | SOS 1 | 7 ngày |
| Cần chú ý | SOS 2 | 5 ngày |
| Gấp | SOS 3 | 3 ngày |

### 3.2. Hạn cập nhật kết quả của case — hết tuần MT tiếp theo

Case sinh từ MT: hạn theo dõi mặc định là **hết tuần có MT kế tiếp** của học viên đó, sửa được.

> **Diễn giải cần owner xác nhận khi chạy phase 1:** hai mốc trên là hai việc khác nhau —
> 3/5/7 ngày là hạn **làm** phương án; hết tuần MT sau là hạn **báo kết quả** của cả case.
> Nếu owner muốn chỉ một mốc, bỏ mốc 3/5/7 và giữ mốc tuần MT.

### 3.3. Chốt kết quả case

GV chỉ được chốt kết quả chung của case **sau khi mọi phương án đã có kết quả**. Ba lựa chọn:

1. Mức độ thành công (định tính, ví dụ "có tiến bộ", "đã làm tốt hơn việc…")
2. Kết thúc hẳn
3. Kéo dài theo dõi + thêm phương án mới

Phương án thuộc Ý thức/Khác thường chỉ cần **đã hoàn thành** + **ngày thực hiện**; ghi chú tuỳ
chọn. GV/Quản lý vẫn chọn theo dõi dài hạn được khi có trường hợp đặc biệt.

---

## 4. Lịch học và lịch MT

### 4.1. Lớp FT — lịch MT mặc định theo tuần bắt đầu học

| Lượt | Tuần học thứ |
|---|---|
| MT1 | 6 |
| MT2 | 12 |
| MT3 | 16 |
| MT4 | 20 |
| MT5 | 24 |

- Tuần bắt đầu học là **tuần học thứ 1**.
- **Đa số học viên chỉ có 3 lượt MT.** MT4, MT5 là dự phòng.
- **LT1 và LT2 dùng chung lịch này**, không khác nhau.
- Target khác nhau **không** làm lịch khác nhau. Đây là lịch mặc định; **Quản lý chủ động xếp
  lại** khi cần, và hệ thống không được ghi đè cái Quản lý đã xếp.

> Hằng số `MOCK_FT_STUDY_WEEK` trong `shared/domain.ts` đã đúng bộ số này. Việc còn thiếu là
> **tuần bắt đầu học của học viên** và cơ chế tự đề xuất lịch từ đó.

### 4.2. Lớp Normal — mốc kiểm tra theo tuần học của LỚP

| Chương trình | Số tuần | Progress Test | Final Test |
|---|---|---|---|
| FOU (Foundation) | 8 | tuần 4 | tuần 8 |
| BE (Beginner) | 10 | tuần 5 | tuần 10 |
| ELE (Elementary) | 10 | tuần 5 | tuần 10 |

- Tuần bắt đầu của **từng học viên** không quan trọng bằng **tuần bắt đầu của lớp**.
- Thông tin lớp phải hiện **đang ở tuần thứ mấy** (ví dụ `BE · tuần 5/10 · Progress Test tuần này`).
- **Lớp Normal KHÔNG có LT1/LT2** — đó là khái niệm của lộ trình FT.
- **Admin CN và Quản lý CN** được thay đổi tuần tiến độ của lớp.

> `PROGRAMME_TEMPLATES` trong `shared/domain.ts` đã đúng bộ số này.

### 4.3. Kỹ năng theo chương trình

| Chương trình | Kỹ năng có đánh giá |
|---|---|
| FT | L · R · W1 · W2 · S (band IELTS) |
| FOU | L · R · **W** · Pronunciation |
| BE, ELE | L · R · **W** · S |

**Bỏ hẳn tên "Prep Writing" / `prep_writing`** — gọi là **W** (`writing`). Đổi tên trong
`PROGRAMME_TEMPLATES`, `REGULAR_SKILLS`, nhãn, và di trú dữ liệu cũ.

### 4.4. Chấm điểm lớp Normal

- **Không dùng thang IELTS.** Đạt khi `điểm đạt / tổng điểm >= 60%`, xét trên **tỷ lệ chính
  xác** chứ không làm tròn phần trăm rồi mới so (25/42 hiện "60%" nhưng **trượt**).
- Người nhập ghi **cả điểm đạt và tổng điểm**, vì thang đổi theo từng bài: `15/30` → Không đạt,
  `30/40` → Đạt.
- **Vẫn giữ nhập điểm x/y** cho Progress/Final Test (owner xác nhận 13/09).
- **Cái bỏ đi:** với học viên lớp Normal, phần cập nhật case **không có ô chấm band** —
  chỉ nhận xét bằng lời.

> Phần chấm x/y ≥60% **đã có sẵn trong code** (`server/src/services/regular.ts`). Vòng 4 chỉ
> đổi tên `prep_writing` → `writing` và rà lại giao diện.

---

## 5. Thông tin học viên và lớp còn thiếu

### 5.1. Trường mới

| Trường | Áp cho | Bắt buộc |
|---|---|---|
| **Tuần bắt đầu học** của học viên | mọi học viên | có |
| **Tháng/năm thi dự kiến** | **chỉ lớp FT** | có với FT; lớp Normal để trống, **không** bị badge nhắc |
| Ngày thi cụ thể | FT | không — cập nhật sau |
| Ngày bắt đầu học cụ thể | mọi học viên | không — chỉ cần tuần |

Người sửa được: **Admin CN · Quản lý · GVCN của lớp**.

### 5.2. Badge "Thiếu thông tin"

Gom mọi thông tin còn thiếu vào **một badge duy nhất**, hiện trên **cả thanh lớp và dòng học
viên**, để vai có trách nhiệm nhìn thấy. Đây không phải "việc phải làm" trong hàng đợi công
việc, nhưng cần được bổ sung sớm.

### 5.3. Tạo lớp / thêm học viên / nhập Excel

- Quản trị hệ thống, Quản lý, Admin CN — **được cấp quyền** tạo lớp và học viên. Dùng panel
  trượt giống phần thêm học viên hiện có.
- Thông tin lớp: tên lớp + loại lớp **FT / Normal**. FT chỉ cần đánh số; Normal phải chọn
  **FOU / BE / ELE**.
- Lớp đã có → chọn thẳng lớp đó để thêm học viên.
- **Nhập Excel rút còn đúng 5 cột:** `Họ và tên · Lớp · Ngày sinh · Điểm đầu vào · Target`.
- Điểm đầu vào ưu tiên **OVR**; không phải ai cũng có điểm chi tiết, bổ sung sau được.

### 5.4. Phân công giáo viên

- Mỗi kỹ năng của một lớp chỉ có **một GV**.
- Một GV dạy được **nhiều kỹ năng** trong cùng lớp.
- Đúng **một GV trong danh sách phân công** làm **GVCN**.
- Thiếu GV hoặc chưa có GVCN → nhãn nhắc, ví dụ **"Thiếu GV R, L"**, cho Admin CN/Quản lý.

---

## 6. Vai trò — việc phải làm vs quyền được làm

| Vai | Việc phải làm |
|---|---|
| **Quản lý CN** | Xem/sửa/bổ sung **tuần kế hoạch MT**. Duyệt và cung cấp phương án khi cần |
| **Admin CN** | Cập nhật **ngày MT cụ thể** trong tuần đã có kế hoạch. Cập nhật thông tin thiết yếu của lớp và học viên. Phân công GV đúng kỹ năng và phân công GVCN |
| **Giáo viên** | Nhập điểm MT hằng tuần. Báo case khi học viên có vấn đề. Đề xuất phương án kèm thời gian. Cập nhật kết quả sau thời gian hỗ trợ |

**Admin CN KHÔNG nhập điểm** — bộ lọc "Cần nhập điểm MT" của Admin CN chỉ để **xem và đôn đốc GV**
(owner xác nhận Q9). Quyền `score.override` của Admin CN đã bị bỏ từ vòng 2, giữ nguyên.

### Bộ lọc học viên theo vai

| # | Bộ lọc | GV | QL | Admin CN |
|---|---|:--:|:--:|:--:|
| 1 | Lớp | ✓ | ✓ | ✓ |
| 2 | SOS | ✓ | ✓ | |
| 3 | Case đang xử lý — đang theo dõi | ✓ | ✓ | |
| 4 | Case thiếu phương án | ✓ | ✓ | |
| 5 | Case quá hạn — quá hạn cập nhật kết quả sau xử lý | ✓ | ✓ | |
| 6 | Cần nhập điểm MT | ✓ | ✓ | ✓ (chỉ xem) |
| 7 | Chưa có lịch MT | | ✓ | ✓ |
| 8 | Cần cập nhật ngày MT | | | ✓ |

Chỉ hiện bộ lọc cần thiết theo vai. Cách gọi phải **giống hệt nhau ở mọi trang**.

---

## 7. Tài khoản và đăng nhập

Owner chọn **phương án đăng nhập thật** (Q7).

- Màn **đăng nhập email + mật khẩu**. Mật khẩu lưu dạng băm. Không gửi email thật,
  không có luồng quên mật khẩu.
- **Tài khoản Quản trị hệ thống mặc định**: `dovutuanphong95.pisa@gmail.com`. Mật khẩu ban đầu
  đặt tạm, hiện rõ trong `README` và màn đăng nhập demo, owner đổi sau.
- **GV tự đăng ký**: khai các chi nhánh hoạt động → vào hàng đợi **chờ Quản trị hệ thống duyệt**.
  Người duyệt sửa được danh sách chi nhánh trước khi duyệt.
- **Chỉ email đuôi `.pisa@gmail.com` mới hợp lệ**, ví dụ `dung.pisa@gmail.com`.
  Áp cho **mọi vai**, không riêng GV tự đăng ký.
- Phạm vi hoạt động:
  - Quản lý: nhiều chi nhánh, **được giảng dạy**
  - Admin CN: nhiều chi nhánh, **không giảng dạy**
  - GV: nhiều chi nhánh, có thể kiêm vai Quản lý
- **Hồ sơ cá nhân**: họ tên, các kỹ năng phụ trách được, số điện thoại, email(s).
- **Quyền của Quản trị hệ thống**: tạo/sửa lộ trình, tạo/sửa loại lớp, và **cấp quyền xem theo
  từng vai hoặc từng cá nhân** — ví dụ cấp cho *Nguyễn Yến, Quản lý CN Monbay* quyền quan sát
  toàn hệ thống.

---

## 8. Dữ liệu demo

- **Reset toàn bộ.** Ngày demo: **14/09/2026** (thứ Hai).
- Quy mô **nhỏ hơn hiện tại** — đủ tình huống, không cần nhiều.
- Mỗi chi nhánh: **1 Quản lý + 1 Admin CN**, vài GV (một số GV dạy 2 chi nhánh).
- Phải có sẵn các tình huống: học viên thiếu thông tin · lớp thiếu GV · lớp chưa có GVCN ·
  case kéo dài qua 2 lượt MT · case đã chốt rồi tái phát · đề xuất chờ duyệt · quá hạn cập nhật ·
  lớp Normal đang giữa khoá và lớp sắp Final Test.
- **Số liệu phải nhất quán giữa các màn** — đây là lỗi owner nêu đích danh.

---

## 9. Ba lỗi owner báo — nguyên nhân đã xác định

| Lỗi | Nguyên nhân trong code | Cách sửa |
|---|---|---|
| Chọn Hải Dương nhưng bảng không đổi | `web/src/pages/Overview.tsx:76` dùng state React của dropdown; `web/src/pages/Academic.tsx:61` đọc tham số `cn` trên URL. **Hai bộ lọc chi nhánh độc lập trên cùng một màn** | Một nguồn duy nhất — đưa cả hai về tham số URL |
| Sĩ số 8 nhưng SOS = 11 | `server/src/services/summary.ts` đếm **lượt** chứ không đếm **người**: một em SOS 1 ở MT1 rồi SOS 3 ở MT2 bị đếm ở cả hai cột | Đếm theo **mức SOS hiện tại** của mỗi học viên, mỗi em chỉ vào đúng một cột. Tổng ba cột ≤ sĩ số |
| "Lên kế hoạch MT": không chuyển được tuần, không nhập được tên | (1) `MockPlanPanel` mở ra với `periodId = null` → `WeekPicker` tính `idx = -1` nên **cả hai mũi tên ← → bị khoá**, ô select hiện một tuần nhưng state vẫn rỗng, nút lưu không sáng. (2) `PERIOD_WINDOW_FORWARD_WEEKS = 1` → **chỉ xếp được tối đa 1 tuần tương lai**. (3) **Không hề có ô gõ tên học viên** | Thiết kế lại panel theo mục 10 dưới đây |

---

## 10. Thiết kế lại panel "Lên kế hoạch MT"

- Chọn **lớp** trước để hiện toàn bộ danh sách học viên của lớp, **hoặc gõ tìm thẳng học viên**.
- Chọn ô **MT1/2/3/4/5/6/7…** **riêng cho từng học viên**, rồi chốt **cùng một tuần**.
  Ví dụ: MT2 của Nguyễn A và MT4 của Nguyễn B xếp vào cùng một tuần.
- **Không được sửa lượt MT đã có và đã hoàn thành.**
- Lọc học viên **chưa có MT1/2/3…** trong cả chi nhánh hoặc theo lớp để đăng ký hàng loạt.
- Cửa sổ chọn tuần phải mở đủ xa về **tương lai** (lịch MT là việc của tương lai).

---

## 11. Đặt lại tên và thống nhất ngôn ngữ

| Cũ | Mới |
|---|---|
| Tab "Việc của tôi" | **Toàn cảnh công việc** |
| "Chi nhánh đang tắc ở đâu" | **Việc cần lưu ý** |
| Tab "Tình hình chung" | **Thực trạng** |
| Bảng "Vấn đề" | **Vấn đề - Case** |
| Nút "+ Nội dung cần hỗ trợ" | **+ Case** |
| Bộ lọc "Đầu mục" | bỏ, thay bằng bộ lọc loại lớp **Normal/FT** |
| Bộ lọc "Kỹ năng" | **Cụ thể** (chỉ hiện sau khi chọn loại lớp) |
| Tab "Báo cáo tuần" | **bỏ tạm** |

Quy ước từ ngữ dùng thống nhất toàn site:

- **học viên** (không dùng "học sinh")
- **case** ưu tiên hơn **vấn đề**; dùng "vấn đề" ở chỗ người dùng dễ hiểu hơn
- **Đề xuất chờ duyệt** = phương án GV đề xuất, đang chờ Quản lý duyệt
- **Quá hạn cập nhật case** = quá hạn theo dõi nhưng chưa cập nhật tình hình/kết quả
- Phân biệt **tuần kế hoạch MT** · **ngày MT cụ thể** · **ngày thi**
- **Quản trị hệ thống · Admin CN · Quản lý · GV · GVCN · Chi nhánh (CN)**
- Viết đúng **Pronunciation**; **Normal** là nhóm FOU/BE/ELE

---

## 12. Việc Quản lý giao cho GV

Tab "Báo cáo tuần" bị bỏ, nhưng chức năng **Quản lý giao task cho GV** (làm ở vòng 3b) **giữ
lại**: chuyển thành nút **"+ Giao việc"** trong màn **Thực trạng**, góc nhìn theo lớp
(owner đồng ý Q8, "để tạm đó").

Cơ chế toả ra giữ nguyên: một việc giao cho cả lớp vẫn là **một việc, cập nhật một lần**, nhưng
**toả ra** thành phương án trong hồ sơ từng học viên. Case mở kiểu này ghi rõ *mở theo yêu cầu
Quản lý* và vào thẳng **đang xử lý**, nên không đội con số "chưa có phương án" lên sai.

---

## 13. Hai bảng tổng hợp — giữ cả hai, không sợ trùng

Owner xác nhận (Q10): giữ cả hai, phân vai rõ.

| Bảng | Ở đâu | Trả lời câu hỏi |
|---|---|---|
| **Việc cần lưu ý** | Tab Tổng quan | **Ai phải làm gì** |
| **Bảng tổng hợp chi nhánh/lớp** | Tab Thực trạng | **Học viên đang yếu ở đâu** |

Chi tiết cột của từng bảng: xem `PISA_Claude_Prompt.md` mục 9.2 và 10.6 — giữ nguyên, không diễn giải lại.

---

## 14. Những gì owner giao Claude tự quyết

- Cách trình bày mục **7.11** (theo dõi hỗ trợ theo kỹ năng) — owner nói rõ chưa nghĩ ra cách
  trình bày đủ gọn, giao Claude đề xuất, và **phải làm trong đợt code gần nhất**.
- Overhaul **hồ sơ học viên** và **màn hình case** (7.18) — owner nói hiện "vừa rối mắt vừa sơ
  sài", chưa có thiết kế cụ thể.
- Cách chuyển giữa hai chế độ xem của Thực trạng (10.5): tab, slider hay cách khác.
- Rủi ro bảng quá dày ở cột "Việc cần làm" (8.4) — owner mời góp ý.
