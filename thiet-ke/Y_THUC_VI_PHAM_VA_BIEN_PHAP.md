# Ý thức — Vi phạm và Biện pháp xử lý

> **⚠ BẢN v3 (tối 21/09/2026) THAY MỘT PHẦN FILE NÀY** — đọc `thiet-ke/SOS_VA_PHOI_HOP_V3.md` mục 1 trước.
> Hết hiệu lực: V11–V14 (đánh dấu không chính xác → **sửa/xoá thẳng**), `violation_count_at_confirm`,
> trạng thái `Không còn hiệu lực`, bố cục ba khu vực §7.3 (→ **Theo học sinh / Theo thời gian**), tên tab `Ý thức`
> (→ **`Ý thức & Phối hợp`**). Phần còn lại giữ nguyên.

Phiên bản 1.0 · 21/09/2026 · **Đặc tả thiết kế để triển khai.** Chưa phải mô tả web hiện tại.

> **File này thay hẳn mô hình "Case Ý thức".** Nguồn: `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md`
> (chủ sản phẩm gửi 21/09/2026) + bốn lời chốt cùng ngày ghi ở mục 2.
>
> Thứ tự ưu tiên khi mâu thuẫn:
> 1. `NGUON-Rule-Y-thuc-2026-09-21.md` — nguồn
> 2. File này — diễn giải đủ chi tiết để code
> 3. `PISA-Rulebook-2026-09-19.md` mục 18 — bản tóm luật
> 4. Mã nguồn hiện tại — **hiện trạng, không phải luật**
>
> Mọi đoạn nói về "Case Ý thức", "đợt Ý thức", "cửa sổ gộp ba ngày", "hạn PA Ý thức 3/5 ngày",
> "hạn hoàn thành case Ý thức 7 ngày", "tái diễn lần 2/3" trong các file cũ đều **HẾT HIỆU LỰC**.

---

## 1. Hai hệ hoàn toàn khác nhau

Đây là điểm dễ sai nhất. Không ép hai hệ dùng chung một vòng đời.

| | HỌC THUẬT | Ý THỨC |
|---|---|---|
| Đơn vị theo dõi | **Case** — một vấn đề, sống nhiều tuần | **Vi phạm** — một sự việc, một dòng |
| Việc mình làm cho em | **Phương án** — có kết quả, có hiệu quả | **Biện pháp xử lý** — có bằng chứng đã làm |
| Câu hỏi trả lời | Vấn đề có được giải quyết không? | Đã ghi nhận gì và đã xử lý bao nhiêu lần? |
| Có đo cải thiện? | **Có** — năm mức, vào bảng hiệu quả | **KHÔNG.** Không hỏi tiến bộ, không vào bảng hiệu quả |
| Hạn cứng | 3/5 ngày có phương án · cập nhật mỗi Chủ nhật | **Không có hạn cứng nào.** Chỉ một cảnh báo mềm 5 ngày |
| Trạng thái | open / in_progress / done | Vi phạm 4 trạng thái hiển thị · Biện pháp 2 trạng thái thật |
| Quan hệ | 1 case → n phương án | **n vi phạm ↔ n biện pháp (nhiều–nhiều)** |
| Ai ghi | GVBM đúng môn · GVCN đúng môn · QL | **Mọi giáo viên** ghi vi phạm |
| Ai xử lý | GV đúng kỹ năng mình dạy (C02) | **GVCN** và QL trong phạm vi |

**Bảng `sos_cases` từ nay là bảng CASE HỌC THUẬT.** Cột `track` và giá trị `'behaviour'` bị gỡ.

---

## 2. Bốn lời chốt ngày 21/09/2026

| Mã | Câu hỏi | Lời chốt |
|---|---|---|
| **Y01** | Ai xác nhận biện pháp nặng — Thư cảnh cáo 1/2/3, Đình chỉ học, CX/GĐCN meeting? | **GVCN tự làm hết.** Không có bước Quản lý duyệt cho bất kỳ loại biện pháp nào. Quản lý xem được và nhận thông báo, nhưng không phải cửa phê duyệt |
| **Y02** | Chuỗi Thư cảnh cáo 1→2→3 đếm trong phạm vi nào? | **Theo lộ trình học** (`learning_cycles.id`). Em học lại hoặc lên lộ trình mới thì chuỗi reset về lần 1 |
| **Y03** | Ba khu vực Ý thức của GVCN đặt ở đâu? | **Tab `Ý thức` trong hồ sơ LỚP.** Thêm tab `Ý thức` gọn trong hồ sơ từng học viên. **Không** thêm khu vực cấp chính thứ 5 |
| **Y04** | Phân loại vi phạm — mấy nhóm? | **Năm nhóm:** Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác. **Bỏ** `Tham gia trên lớp`; dữ liệu cũ đổi sang `Thái độ / hành vi` |

---

## 3. Từ vựng — một khái niệm một chữ

Bổ sung `TU_DIEN_VA_CHU.md` mục 1. Vi phạm bảng này là lỗi nghiệp vụ, không phải lỗi biên tập.

| Khái niệm | Chữ dùng trên web | Tuyệt đối không viết |
|---|---|---|
| Một sự việc học viên vi phạm, do một GV ghi | `Vi phạm` | "case Ý thức", "đợt", "báo cáo Ý thức", "violation" |
| Việc GVCN làm để xử lý một nhóm vi phạm | `Biện pháp xử lý` | "phương án kỷ luật", "phương án Ý thức", "phương án" |
| Biện pháp đã tạo, chưa làm xong, còn sửa được | `Đang chuẩn bị` | "nháp", "chờ duyệt", "đang xử lý" |
| Biện pháp đã làm xong, đã có bằng chứng | `Đã thực hiện` | "hoàn thành", "đóng", "done" |
| Vi phạm chưa gắn vào biện pháp nào | `Chưa xử lý` | "mới", "đang mở" |
| Vi phạm đang nằm trong một biện pháp Đang chuẩn bị | `Đang chuẩn bị xử lý` | "đang xử lý" |
| Vi phạm nằm trong ít nhất một biện pháp Đã thực hiện | `Đã xử lý` | "đã đóng", "đã giải quyết" |
| Vi phạm bị xác định là ghi sai | `Không còn hiệu lực` | "đã xóa", "hủy", "sai" |
| Thao tác đánh dấu ghi sai | `Đánh dấu không chính xác` | "xóa vi phạm", "hủy ghi nhận" |
| Nhắc GVCN có vi phạm để lâu | `Cần xử lý` | "quá hạn", "vi phạm trễ hạn" |

**Bốn đơn vị đếm không bao giờ cộng vào nhau:** số vi phạm · số học viên có vi phạm ·
số biện pháp · số lần một loại biện pháp.

---

## 4. Mô hình dữ liệu

Bốn bảng mới + một bảng bằng chứng dùng chung. DDL đặt ở `server/src/schema.sql`;
từ vựng thuần ở `shared/domain/yThuc.ts` (module thứ chín, xem mục 11).

### 4.1. `violations` — sổ vi phạm

```sql
CREATE TABLE violations (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  -- Lộ trình lúc ghi. Dùng cho phạm vi chuỗi Thư cảnh cáo (Y02) và thống kê theo khoá.
  cycle_id INTEGER REFERENCES learning_cycles(id),
  -- Lớp em đang học lúc ghi. Giữ để chuyển lớp không mang lịch sử cũ sang lớp mới.
  class_id INTEGER REFERENCES classes(id),

  -- attendance | homework | conduct | classroom | other   (Y04 — NĂM nhóm)
  category TEXT NOT NULL,
  -- Môn GV đang dạy khi thấy. TÙY CHỌN: tự điền theo phân công, GV sửa được, bỏ trống được.
  -- Cần để đọc ra được câu "thiếu BTVN Writing" trong ví dụ mục 22 của nguồn.
  skill TEXT,

  occurred_on TEXT NOT NULL,          -- ngày XẢY RA, do GV khai; mặc định hôm nay
  reported_on TEXT NOT NULL,          -- ngày hệ thống ghi nhận; KHÁC occurred_on
  reported_by INTEGER NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,          -- bắt buộc, tối thiểu 10 ký tự

  -- TRẠNG THÁI HIỆU LỰC — chỉ HAI giá trị thật.
  -- Bốn trạng thái người dùng thấy (Chưa xử lý / Đang chuẩn bị xử lý / Đã xử lý / Không còn
  -- hiệu lực) là SUY RA, không lưu: ba cái đầu suy từ bảng nối, cái thứ tư là cột này.
  -- Lưu trạng thái xử lý ở đây là cách chắc chắn nhất để nó lệch với bảng nối.
  valid INTEGER NOT NULL DEFAULT 1,   -- 1 = còn hiệu lực | 0 = đã đánh dấu không chính xác
  invalid_reason TEXT,                -- bắt buộc khi valid = 0
  invalidated_by INTEGER REFERENCES users(id),
  invalidated_at TEXT,

  idempotency_key TEXT UNIQUE,        -- bấm hai lần hoặc thử lại sau lỗi mạng không tạo hai dòng
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX idx_violation_student ON violations(student_id, occurred_on);
CREATE INDEX idx_violation_class ON violations(class_id, occurred_on);
CREATE INDEX idx_violation_valid ON violations(valid) WHERE valid = 1;
```

**KHÔNG có những cột dưới đây** — và đó là quyết định, không phải thiếu sót:

| Không có | Vì sao |
|---|---|
| `severity` mức độ nặng nhẹ | Nguồn không có. Bắt GV đoán mức, mà GVCN nhìn *số lần* + *số ngày* là đủ ra quyết định |
| `status` xử lý | Suy từ bảng nối `measure_violations`. Lưu hai nơi là lệch hai nơi |
| `due_date` hạn | Nguồn mục 29 cấm deadline cứng cho từng vi phạm |
| `episode_no` lần thứ mấy | Không còn khái niệm "đợt" |
| `urgency` mức ưu tiên | Không còn case nên không còn mức ưu tiên |

### 4.2. `discipline_measures` — biện pháp xử lý

```sql
CREATE TABLE discipline_measures (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),
  class_id INTEGER REFERENCES classes(id),

  -- CHÍN LOẠI, xếp nhẹ đến nặng để BÀY RA. Thứ tự KHÔNG phải workflow bắt buộc (nguồn mục 20).
  --   talk_short | meeting_student | family_report | warning_1 |
  --   meeting_cx | warning_2 | suspension | warning_3 | other
  kind TEXT NOT NULL,
  -- Chỉ dùng khi kind = 'other': tên biện pháp do GVCN tự đặt. Bắt buộc lúc đó.
  custom_name TEXT,

  -- HAI TRẠNG THÁI, KHÔNG BA.
  --   preparing : còn sửa được — thêm hoặc bớt vi phạm, sửa ghi chú, đổi loại
  --   done      : đã thực hiện — chốt snapshot, không sửa danh sách vi phạm nữa
  -- KHÔNG có 'pending_approval': Y01 chốt GVCN tự làm hết, không có cửa duyệt.
  status TEXT NOT NULL DEFAULT 'preparing',

  owner_user_id INTEGER REFERENCES users(id),   -- người phụ trách, mặc định GVCN của lớp
  note TEXT,                                    -- nội dung hoặc ghi chú, dùng cả hai trạng thái

  -- Chỉ có khi status = 'done'. Bắt buộc lúc xác nhận.
  performed_on TEXT,                            -- ngày THỰC HIỆN THỰC TẾ, có thể khác hôm nay
  performed_by INTEGER REFERENCES users(id),    -- người thực hiện, khi có tài khoản
  performer_name TEXT,                          -- hoặc ghi tên khi không có tài khoản
  participants TEXT,                            -- người tham gia, dùng cho meeting_cx
  confirmed_by INTEGER REFERENCES users(id),    -- ai bấm Xác nhận
  confirmed_at TEXT,

  -- SỐ VI PHẠM LÚC XÁC NHẬN — ảnh chụp, không đếm lại.
  -- Nguồn mục 26: "giữ snapshot lịch sử". Nếu sau này một vi phạm trong nhóm bị đánh dấu không
  -- chính xác thì số này KHÔNG đổi (biện pháp đó đã thực sự được làm với n vi phạm), nhưng
  -- thống kê vi phạm thì loại nó ra. Hai câu hỏi khác nhau, hai con số khác nhau.
  violation_count_at_confirm INTEGER,

  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TEXT
);
CREATE INDEX idx_measure_student ON discipline_measures(student_id, status);
CREATE INDEX idx_measure_class ON discipline_measures(class_id, status);
CREATE INDEX idx_measure_preparing ON discipline_measures(status) WHERE status = 'preparing';
```

### 4.3. `measure_violations` — bảng nối NHIỀU–NHIỀU

Đây là bảng quan trọng nhất của cả mô hình (nguồn mục 24).

```sql
-- MỘT vi phạm gắn NHIỀU biện pháp; MỘT biện pháp chứa NHIỀU vi phạm.
-- Không cài one-to-one, không cài one-to-many, không nhét foreign key vào bảng nào cả.
--
-- Ví dụ thật phải chạy được: một nhóm 6 vi phạm cùng lúc đi vào 3 biện pháp
-- (GV meeting + Report gia đình + Thư cảnh cáo lần 1), và một trong 6 vi phạm đó
-- còn nằm trong một Report của tháng trước.
CREATE TABLE measure_violations (
  measure_id INTEGER NOT NULL REFERENCES discipline_measures(id),
  violation_id INTEGER NOT NULL REFERENCES violations(id),
  added_by INTEGER REFERENCES users(id),
  added_at TEXT NOT NULL,
  PRIMARY KEY (measure_id, violation_id)
);
CREATE INDEX idx_mv_violation ON measure_violations(violation_id);
```

**Luật gỡ:** chỉ gỡ được vi phạm khỏi biện pháp `preparing`. Biện pháp `done` thì danh sách
đóng băng — gỡ ra là viết lại lịch sử của một việc đã làm thật.

### 4.4. `violation_history` — nhật ký sửa vi phạm

```sql
-- Nguồn mục 15: "giữ lịch sử thay đổi nếu phù hợp". Sửa mô tả, đổi nhóm, đổi ngày, hủy ghi nhận.
CREATE TABLE violation_history (
  id INTEGER PRIMARY KEY,
  violation_id INTEGER NOT NULL REFERENCES violations(id),
  field TEXT NOT NULL,           -- description | category | skill | occurred_on | valid
  old_value TEXT,
  new_value TEXT,
  reason TEXT,                   -- bắt buộc khi field = 'valid'
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_vh_violation ON violation_history(violation_id);
```

### 4.5. `attachments` — kho tệp và liên kết DÙNG CHUNG

**Hiện hệ thống chưa có bảng nào lưu tệp hoặc liên kết.** Rule mới bắt buộc Thư cảnh cáo và
Đình chỉ học phải có tệp hoặc liên kết, nên đây là hạ tầng phải dựng. Dựng **một bảng dùng
chung** cho cả bốn chỗ cần (case học thuật, phương án, vi phạm, biện pháp) — làm riêng bốn lần
là bốn lần sai khác nhau.

```sql
CREATE TABLE attachments (
  id INTEGER PRIMARY KEY,
  -- sos_case | case_intervention | violation | discipline_measure
  owner_type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,

  -- file | link — hai loại, một bảng. Người dùng thấy cùng một khối "Bằng chứng".
  kind TEXT NOT NULL,
  -- kind='link': URL đầy đủ. kind='file': đường dẫn tương đối trong data/uploads/.
  url TEXT NOT NULL,
  display_name TEXT NOT NULL,     -- tên tài liệu người dùng đọc
  mime_type TEXT,
  size_bytes INTEGER,

  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_attachment_owner ON attachments(owner_type, owner_id);
```

Ba luật của khối bằng chứng, áp ở **mọi** chỗ dùng:

1. **Lỗi tải tệp không được làm mất nội dung đang nhập** (rule book mục 4.1). Tải tệp là một
   request riêng; form giữ nguyên, lỗi hiện tại dòng tệp đó.
2. Quyền xem tệp bằng quyền xem bản ghi chủ. Không có đường tải nào bỏ qua kiểm quyền.
3. Giữ người tải và ngày tải. Xóa tệp là hành động có audit, không phải một dấu X im lặng.

---

## 5. Luật nghiệp vụ — đánh số để nghiệm thu

### 5.1. Ghi vi phạm

| Mã | Luật |
|---|---|
| **V01** | **Mọi giáo viên** có phân công dạy lớp đó được ghi vi phạm cho học viên của lớp. Không cần em phải có SOS |
| **V02** | Bắt buộc: học viên · ngày xảy ra · nhóm · mô tả từ 10 ký tự. Tùy chọn: môn · tệp hoặc liên kết |
| **V03** | `occurred_on` mặc định **hôm nay**; cho chọn ngày quá khứ (GV nhớ ra sau), **không** cho chọn ngày tương lai |
| **V04** | `skill` tự điền theo môn GV được phân công ở lớp đó. GV dạy nhiều môn thì để trống và cho chọn |
| **V05** | Nhóm `Khác` thì mô tả phải từ 30 ký tự — nếu không, `Khác` thành đúng cái ô "chưa rõ" vô nghĩa |
| **V06** | **Cảnh báo trùng mềm:** nếu cùng học viên, cùng nhóm, cùng `occurred_on` đã có vi phạm còn hiệu lực, hiện ngay trong form: *"Ngày {d} em này đã có 1 vi phạm nhóm {nhóm} do {GV} ghi."* kèm hai nút `Xem vi phạm đó` và `Vẫn ghi vi phạm mới`. **KHÔNG tự gộp, KHÔNG chặn** (nguồn mục 35) |
| **V07** | Gửi lại cùng một request (`idempotency_key`) không tạo dòng thứ hai |
| **V08** | Ghi vi phạm **không** sinh biện pháp, **không** sinh case, **không** sinh việc cho ai, **không** đặt hạn nào |

### 5.2. Sửa và hủy ghi nhận

| Mã | Luật |
|---|---|
| **V09** | Sửa được `description` · `category` · `skill` · `occurred_on`. Mỗi lần sửa ghi một dòng `violation_history` |
| **V10** | Người sửa hoặc hủy: **người ghi** (sửa lỗi của chính mình) · **GVCN của lớp** · **Quản lý trong phạm vi**. Giáo viên khác không sửa được vi phạm của đồng nghiệp |
| **V11** | `Đánh dấu không chính xác` **bắt buộc có lý do**. Không xóa vật lý bao giờ |
| **V12** | Vi phạm `valid = 0` **không tính vào bất kỳ thống kê vi phạm nào**, và không tính vào cảnh báo 5 ngày |
| **V13** | Vi phạm đã nằm trong biện pháp **`done`** vẫn hủy được. Biện pháp giữ nguyên `violation_count_at_confirm`, và màn chi tiết biện pháp hiện dòng: *"1 trong {n} vi phạm của biện pháp này sau đó được xác định là không chính xác."* Không gỡ khỏi bảng nối |
| **V14** | Vi phạm `valid = 0` vẫn hiện trong lịch sử của học viên — **gạch ngang, xám, kèm lý do hủy**. Đây là dữ liệu audit, không phải rác |

### 5.3. Biện pháp xử lý

| Mã | Luật |
|---|---|
| **B01** | Người tạo và xác nhận biện pháp: **GVCN của lớp** và **Quản lý trong phạm vi**. GVBM không tạo, nhưng đọc được |
| **B02** | Một biện pháp phải có **ít nhất một vi phạm** của **đúng một học viên**. Không gom vi phạm của nhiều em vào một biện pháp |
| **B03** | Vi phạm gom vào một biện pháp **không cần** cùng nhóm, cùng môn, cùng GV ghi, cùng ngày (nguồn mục 22) |
| **B04** | Một nhóm vi phạm **được gắn vào nhiều biện pháp** cùng lúc hoặc gần nhau (nguồn mục 23) |
| **B05** | **Không có thứ tự xử lý bắt buộc.** Đi thẳng tới biện pháp nặng là hợp lệ (nguồn mục 20) |
| **B06** | **Ngoại lệ duy nhất — chuỗi Thư cảnh cáo.** Trong **cùng một lộ trình** (Y02): không tạo và không xác nhận được `warning_2` nếu chưa có `warning_1` ở trạng thái `done`; tương tự `warning_3` cần `warning_2` là `done`. Kiểm ở **máy chủ**, không chỉ ẩn nút |
| **B07** | Chuỗi Thư cảnh cáo reset khi em sang lộ trình mới — học lại hoặc lên chương trình khác |
| **B08** | Cùng một lộ trình **chỉ có tối đa một** `warning_1`, một `warning_2`, một `warning_3`. Muốn gửi thư thứ tư thì dùng `other` và ghi rõ tên |
| **B09** | `preparing` cho phép: thêm vi phạm · bỏ vi phạm · đổi loại biện pháp · sửa ghi chú · đổi người phụ trách · đổi hoặc xóa tệp. Không có hạn nào |
| **B10** | `done` thì **khóa danh sách vi phạm**. Vẫn sửa được `note` và tệp, có ghi audit — đó là bổ sung bằng chứng, không phải viết lại phạm vi |
| **B11** | Đổi loại biện pháp khi `preparing` phải kiểm lại B06 với loại mới |
| **B12** | Xóa biện pháp: chỉ khi `preparing`, và do người tạo hoặc GVCN hoặc QL. Biện pháp `done` không xóa được |
| **B13** | Xác nhận `done` bắt buộc: `performed_on` · người thực hiện · nội dung hoặc ghi chú. Thêm tệp-hoặc-liên-kết **bắt buộc** với `warning_1/2/3` và `suspension` |
| **B14** | `performed_on` cho chọn ngày quá khứ (việc làm rồi mới vào ghi), **không** cho ngày tương lai |
| **B15** | Xác nhận `done` **không** hỏi tiến bộ, **không** có năm mức kết quả, **không** mở vòng theo dõi hành vi (nguồn mục 12 và rule book 17.2) |
| **B16** | Một Report gia đình gom 3 vi phạm **đếm là MỘT report**, không phải ba (rule book 17.2) |

### 5.4. Ô bắt buộc theo từng loại biện pháp

Nguồn mục 28. Một form, tự đổi ô bắt buộc — không dựng chín form.

| Mã loại | Nhãn trên web | Ngày | Nội dung | Tệp/liên kết | Người tham gia |
|---|---|---|---|---|---|
| `talk_short` | GV trao đổi ngắn với HS | bắt buộc | bắt buộc, ngắn | tùy chọn | — |
| `meeting_student` | GV meeting với HS | bắt buộc | bắt buộc | tùy chọn | — |
| `family_report` | Report cho gia đình | bắt buộc | bắt buộc, tóm tắt | tùy chọn | — |
| `warning_1` | Thư cảnh cáo lần 1 | bắt buộc | bắt buộc, lý do | **bắt buộc** | — |
| `meeting_cx` | CX / GĐCN meeting với HS / PH | bắt buộc | bắt buộc | tùy chọn | tùy chọn |
| `warning_2` | Thư cảnh cáo lần 2 | bắt buộc | bắt buộc, lý do | **bắt buộc** | — |
| `suspension` | Đình chỉ học | bắt buộc | bắt buộc, lý do | **bắt buộc** | — |
| `warning_3` | Thư cảnh cáo lần 3 | bắt buộc | bắt buộc, lý do | **bắt buộc** | — |
| `other` | Khác | bắt buộc | bắt buộc, mô tả | tùy chọn | — |

`other` thêm một ô bắt buộc nữa: **tên biện pháp** (`custom_name`).

Nút `Xác nhận đã thực hiện` **mờ đi kèm câu nói thiếu gì** — không bao giờ để bấm rồi báo lỗi
đỏ: `Cần đính kèm tệp hoặc liên kết thư cảnh cáo`.

### 5.5. Cảnh báo 5 ngày — định nghĩa chính xác

Nguồn mục 30. Đây là **nhắc mềm**, không phải lỗi quy trình.

```
Tập cần xử lý của một học viên
  = các vi phạm của em đó
      có valid = 1
      và KHÔNG xuất hiện trong measure_violations với bất kỳ measure_id nào

Cảnh báo bật khi
  tập cần xử lý KHÔNG rỗng
  VÀ  (ngày nghiệp vụ hôm nay − min(occurred_on của tập)) > 5 ngày
```

| Mã | Luật |
|---|---|
| **W01** | Câu cảnh báo: `⚠ {n} vi phạm chưa được xử lý — vi phạm cũ nhất: {k} ngày trước` |
| **W02** | Cảnh báo **KHÔNG** tự tạo case, **KHÔNG** tự tạo biện pháp, **KHÔNG** đặt hạn, **KHÔNG** tính là quá hạn của ai |
| **W03** | Vi phạm đã nằm trong biện pháp `preparing` **ra khỏi** tập cần xử lý — GVCN đã bắt tay vào việc rồi |
| **W04** | Vi phạm `valid = 0` không bao giờ vào tập cần xử lý |
| **W05** | Cảnh báo hiện ở **ba nơi**: đầu tab Ý thức của hồ sơ lớp · dòng học viên trong danh sách lớp (nhãn nhỏ) · một dòng trong Việc cần làm của GVCN |
| **W06** | Số ngày tuổi (`⚠9n`) hiện cạnh **từng** vi phạm chưa xử lý, không chỉ ở dòng tổng — để không ai phải tự trừ ngày |

---

## 6. Quyền — bảng đầy đủ

Áp ở **máy chủ** trước; giao diện chỉ ẩn nút cho gọn mắt.

| Hành động | GVBM dạy lớp đó | GVCN lớp đó | Quản lý trong CN | Quản trị hệ thống |
|---|---|---|---|---|
| Xem vi phạm của lớp | ✅ | ✅ | ✅ | ✅ |
| Ghi vi phạm | ✅ | ✅ | ✅ | ✅ |
| Sửa vi phạm **của chính mình ghi** | ✅ | ✅ | ✅ | ✅ |
| Sửa vi phạm **người khác ghi** | ❌ | ✅ | ✅ | ✅ |
| Đánh dấu không chính xác | ✅ của mình | ✅ | ✅ | ✅ |
| Xem biện pháp | ✅ | ✅ | ✅ | ✅ |
| Tạo hoặc sửa biện pháp | ❌ | ✅ | ✅ | ✅ |
| Xác nhận đã thực hiện — **mọi loại, kể cả nặng (Y01)** | ❌ | ✅ | ✅ | ✅ |
| Xóa biện pháp `preparing` | ❌ | ✅ | ✅ | ✅ |
| Xem thống kê Ý thức cả chi nhánh | ❌ | ❌ | ✅ | ✅ |

Ba điều dễ hiểu nhầm:

- **C02 không áp cho Ý thức.** C02 nói "mọi giáo viên chỉ xử lý case đúng kỹ năng mình dạy" —
  đó là luật của **case học thuật**. Vi phạm không thuộc kỹ năng nào, và GVCN là người xử lý.
- **Ghi vi phạm không cần đúng môn.** Cô dạy Writing thấy em đi muộn thì ghi được nhóm Chuyên cần.
- **Quản lý không phải cửa duyệt** (Y01), nhưng nhận **thông báo** khi một `warning_1/2/3` hoặc
  `suspension` được xác nhận — để biết chuyện nặng đã xảy ra trong chi nhánh mình.

---

## 7. Giao diện

Nguyên tắc: **nhìn phát hiểu · ít bấm · workflow một mạch không ngắt · mọi ràng buộc nói trước
khi bấm, không báo lỗi sau.**

### 7.1. Bản đồ đường đi

```
GVBM  ── hồ sơ lớp · tab Học viên ── nút [Ghi vi phạm] ngay ở dòng học viên
                                          └─> panel Ghi vi phạm (7.2)

GVCN  ── hồ sơ lớp · tab Ý THỨC ──── ba khu vực xếp dọc (7.3)
      │                                  ├─> panel Tạo biện pháp (7.4)
      │                                  └─> panel Xác nhận đã thực hiện (7.5)
      └─ Công việc · Hỗ trợ học viên ── 1 dòng nhắc, bấm nhảy sang tab Ý thức (7.10)

Ai    ── hồ sơ học viên · tab Ý THỨC ─ lịch sử của riêng em (7.6)
                                          ├─> panel chi tiết Vi phạm (7.7)
                                          └─> panel chi tiết Biện pháp (7.8)

QL    ── Tổng quan · tab Phân tích · góc nhìn Ý THỨC ─ thống kê (7.9)
```

**Không thêm khu vực cấp chính thứ 5** (Y03). Bốn khu vực giữ nguyên:
`Tổng quan / Học viên & Lớp / Test / Công việc`.

### 7.2. Panel `Ghi vi phạm` — GVBM, mục tiêu 15 giây

```
┌─ Ghi vi phạm · Nguyễn An · lớp 6.5A ─────────── (panel phải) ──┐
│                                                                  │
│  Ngày xảy ra   [21/09/2026]   ← mặc định hôm nay                │
│                                                                  │
│  Nhóm vi phạm                                                    │
│   ( ) Chuyên cần        (•) BTVN                                 │
│   ( ) Thái độ / hành vi ( ) Kỷ luật lớp học    ( ) Khác          │
│                                                                  │
│  Môn  [Writing ▾]   ← tự điền môn bạn dạy lớp này; bỏ trống được│
│                                                                  │
│  Mô tả *                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Không nộp bài Writing Task 2 buổi 21/09                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  + Đính kèm tệp      + Thêm liên kết          (tùy chọn)         │
│                                                                  │
│  ┌ i ──────────────────────────────────────────────────────────┐│
│  │ Ngày 21/09 em này đã có 1 vi phạm nhóm BTVN do cô Hà ghi.  ││
│  │ [Xem vi phạm đó]          [Vẫn ghi vi phạm mới]            ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│                              [Huỷ]      [Ghi vi phạm]           │
└──────────────────────────────────────────────────────────────────┘
```

- **Năm nhóm là năm nút radio bày phẳng**, không dropdown — GV thấy hết lựa chọn trong một lần nhìn.
- Không hỏi mức độ, không hỏi hạn, không hỏi ai xử lý, không hỏi biện pháp.
- Cảnh báo trùng (V06) hiện **trong form**, không phải pop-up chặn đường.
- Nút đặt ở **dòng học viên trong bảng lớp** — không phải mở hồ sơ em rồi mới tìm nút.
- Lưu xong: toast `Đã ghi vi phạm cho Nguyễn An` kèm link `Hoàn tác` trong 10 giây. Panel đóng,
  **con trỏ về đúng dòng học viên** để ghi tiếp em khác.

### 7.3. Tab `Ý thức` của hồ sơ lớp — ba khu vực, GVCN (Y03)

```
┌─ Lớp 6.5A · [Học viên] [Phân tích lớp] [Ý thức] [Giáo viên] ────────┐
│                                                                       │
│  ⚠ 3 học viên có vi phạm chưa xử lý quá 5 ngày                       │
│                                                                       │
│ ═══ 1. VI PHẠM CHƯA XỬ LÝ  (12) ════════════════════════════════════ │
│  [Tất cả học viên ▾] [Tất cả nhóm ▾] [⚠ Chỉ quá 5 ngày]            │
│                                                                       │
│  ☑ ▾ Nguyễn An                                        4 vi phạm  ⚠   │
│      ☑ 12/09  BTVN · Writing      Không nộp T2        cô Hà   ⚠9n   │
│      ☑ 14/09  BTVN · Reading      Không nộp bài       cô Lan  ⚠7n   │
│      ☑ 15/09  Chuyên cần          Đi muộn 20 phút     cô Hà   ⚠6n   │
│      ☐ 20/09  Thái độ / hành vi   Nói chuyện trong giờ cô Mai        │
│  ☐ ▸ Trần Bình                                        2 vi phạm      │
│  ☐ ▸ Lê Cường                                         6 vi phạm  ⚠   │
│                                                                       │
│  ┌ Đã chọn 3 vi phạm của Nguyễn An ────────────────────────────────┐ │
│  │                              [ Tạo Biện pháp xử lý → ]          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ═══ 2. BIỆN PHÁP ĐANG CHUẨN BỊ  (2) ════════════════════════════════ │
│  Report cho gia đình · Nguyễn An            tạo 18/09 · 3 ngày       │
│    5 vi phạm  ·  phụ trách: cô Thu (GVCN)                           │
│    [+ Thêm vi phạm]  [Sửa]  [✓ Xác nhận đã thực hiện]               │
│                                                                       │
│  Thư cảnh cáo lần 1 · Trần Bình             tạo 20/09 · 1 ngày       │
│    6 vi phạm  ·  i cần tệp hoặc liên kết thư khi xác nhận            │
│    [+ Thêm vi phạm]  [Sửa]  [✓ Xác nhận đã thực hiện]               │
│                                                                       │
│ ═══ 3. LỊCH SỬ XỬ LÝ ═══════════════════════════════════════════════ │
│  18/09   Report cho gia đình     Lê Cường     5 vi phạm      2 tệp   │
│  10/09   GV meeting với HS       Nguyễn An    2 vi phạm              │
│  01/09   Thư cảnh cáo lần 1      Lê Cường     6 vi phạm      1 tệp   │
│                                          [Xem tất cả lịch sử →]      │
└───────────────────────────────────────────────────────────────────────┘
```

Bảy quyết định thiết kế, mỗi cái có lý do:

1. **Gom vi phạm theo HỌC VIÊN, không theo ngày.** Đơn vị ra quyết định là *em nào*. Gộp 3 vi
   phạm của An vào 1 Report là thao tác thật; gộp vi phạm của 3 em khác nhau là vô nghĩa.
2. **Tick nhiều rồi một nút** — bulk action, nguồn mục 40 điểm 10.
3. **Số ngày tuổi cạnh từng dòng** (`⚠9n`) — không ai phải tự trừ ngày (W06).
4. **Thanh "Đã chọn n vi phạm" dính đáy khu vực 1**, hiện ngay khi tick dòng đầu tiên. Tick vi
   phạm của em thứ hai thì thanh đổi thành
   `Đã chọn 3 của Nguyễn An và 1 của Trần Bình — một biện pháp chỉ xử lý một học viên` (B02),
   nút mờ, kèm `[Chỉ giữ Nguyễn An]`.
5. **Khu 2 luôn mở, không thu gọn.** Đây là việc đang dở của chính GVCN; giấu nó là cách chắc
   chắn nhất để nó bị quên.
6. **Khu 2 nói trước "cần tệp gì" ngay khi còn `preparing`** — GVCN đi scan thư trước, không
   phải bấm Xác nhận rồi mới biết thiếu.
7. **Khu 3 chỉ 3 dòng gần nhất.** Lịch sử cần *có*, không cần *chiếm màn*.

Khổ 375px: ba khu vực xếp dọc nguyên thứ tự; mỗi vi phạm thành một thẻ; ô tick ở góc trái thẻ;
thanh "Đã chọn" dính đáy màn hình.

### 7.4. Panel `Tạo Biện pháp xử lý`

```
┌─ Tạo Biện pháp xử lý · Nguyễn An ───────────── (panel phải) ──┐
│  Đang gom 3 vi phạm:                                           │
│   · 12/09  BTVN · Writing     Không nộp T2            [x]      │
│   · 14/09  BTVN · Reading     Không nộp bài           [x]      │
│   · 15/09  Chuyên cần         Đi muộn 20 phút         [x]      │
│   [+ Thêm vi phạm khác của Nguyễn An]                          │
│                                                                 │
│  Loại biện pháp *                                               │
│   nhẹ ──────────────────────────────────────────────── nặng     │
│   ( ) GV trao đổi ngắn với HS                                   │
│   ( ) GV meeting với HS                                         │
│   (•) Report cho gia đình                                       │
│   ( ) Thư cảnh cáo lần 1                                        │
│   ( ) CX / GĐCN meeting với HS / PH                             │
│   ( ) Thư cảnh cáo lần 2   [khóa] chưa gửi Thư cảnh cáo lần 1   │
│   ( ) Đình chỉ học                                              │
│   ( ) Thư cảnh cáo lần 3   [khóa] chưa gửi Thư cảnh cáo lần 2   │
│   ( ) Khác  →  [tên biện pháp ...............................]  │
│                                                                 │
│  Người phụ trách   [Thu (GVCN) ▾]                               │
│  Ghi chú           [..........................................] │
│                                                                 │
│      [Huỷ]   [Lưu — Đang chuẩn bị]   [Xác nhận đã làm luôn →]   │
└─────────────────────────────────────────────────────────────────┘
```

- **Xếp nhẹ đến nặng để ĐỌC, không để BẮT theo thứ tự** (B05). Có chữ `nhẹ ─ nặng` để GVCN đọc
  được mức tương đối; chọn thẳng cái nào cũng được.
- **Chỉ ba dòng Thư cảnh cáo bị khóa, và khóa thì nói lý do NGAY TẠI DÒNG** (B06) — không để
  bấm rồi mới báo lỗi. Đây là khác biệt lớn nhất về cảm giác dùng.
- **Hai nút lưu, vì có hai loại việc thật:**
  - `Lưu — Đang chuẩn bị`: việc cần 3–5 ngày mới làm được (Report, Thư cảnh cáo).
  - `Xác nhận đã làm luôn →`: việc vừa làm tại chỗ (trao đổi ngắn với em cuối buổi). Bấm nút
    này mở luôn 7.5, **không phải tạo rồi vào sửa hai lần**.

### 7.5. Panel `Xác nhận đã thực hiện`

```
┌─ Xác nhận đã thực hiện ────────────────────── (panel phải) ──┐
│  Thư cảnh cáo lần 1 · Trần Bình · 6 vi phạm                   │
│                                                                │
│  Ngày thực hiện *      [20/09/2026]                            │
│  Người thực hiện *     [Thu (GVCN) ▾]  hoặc  [ghi tên ......] │
│  Lý do / nội dung *                                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Tệp hoặc liên kết thư *                                       │
│   + Đính kèm tệp      + Thêm liên kết                          │
│                                                                │
│  Sáu vi phạm được xử lý bằng biện pháp này:                    │
│   · 05/09 BTVN · 08/09 Chuyên cần · 11/09 BTVN ·               │
│     12/09 Thái độ · 15/09 BTVN · 17/09 Kỷ luật lớp học         │
│                                                                │
│  i Cần đính kèm tệp hoặc liên kết thư cảnh cáo                 │
│                            [Huỷ]   [Xác nhận đã thực hiện]     │
│                                     ^^^^^ mờ đến khi đủ ô      │
└────────────────────────────────────────────────────────────────┘
```

- **Ô bắt buộc đổi theo loại** (5.4). Không dựng chín form.
- **Không có ô nào hỏi tiến bộ, kết quả hay mức cải thiện** (B15).
- Danh sách vi phạm hiện ra để GVCN kiểm lần cuối trước khi đóng băng (B10).
- Lưu xong: `Đã lưu. Trần Bình: 6 vi phạm chuyển sang Đã xử lý.` Biện pháp rời khu 2, lên khu 3.

### 7.6. Tab `Ý thức` của hồ sơ học viên

```
┌─ Nguyễn An · [Điểm] [Case học thuật] [Ý thức] [Hành trình] ───┐
│  ⚠ 4 vi phạm chưa xử lý — cũ nhất 9 ngày trước                │
│                                                                 │
│  Vi phạm            12 · trong đó 4 chưa xử lý, 1 không hiệu lực│
│  Biện pháp đã làm    3 · 1 Report gia đình, 2 GV meeting        │
│                                                                 │
│  ── Dòng thời gian ────────────────────────── [Ghi vi phạm]  ──│
│  21/09  [VP] Thái độ / hành vi            Chưa xử lý           │
│  18/09  [BP] Report cho gia đình          5 vi phạm   2 tệp    │
│  15/09  [VP] Chuyên cần                   Đã xử lý             │
│  14/09  [VP] BTVN · Reading               Đã xử lý             │
│  13/09  [VP] BTVN            (gạch ngang) Không còn hiệu lực   │
│           └ cô Hà đánh dấu 15/09: "em đã nộp, tôi bỏ sót"      │
│  12/09  [VP] BTVN · Writing               Đã xử lý             │
│  10/09  [BP] GV meeting với HS            2 vi phạm            │
└─────────────────────────────────────────────────────────────────┘
```

- **Một dòng thời gian trộn vi phạm `[VP]` và biện pháp `[BP]`** theo ngày — đọc được cả câu
  chuyện, không phải ghép hai bảng trong đầu.
- Vi phạm hết hiệu lực: **gạch ngang, xám, kèm lý do ngay bên dưới** (V14). Không giấu.
- Hai con số đầu tab **không cộng vào nhau** và nói rõ đơn vị.

### 7.7. Panel chi tiết `Vi phạm`

```
┌─ Vi phạm · 12/09/2026 ────────────────────── (panel phải) ──┐
│  Nguyễn An · lớp 6.5A                                        │
│  Nhóm: BTVN · Môn: Writing                                   │
│  Ghi bởi cô Hà · 12/09/2026                                  │
│  "Không nộp bài Writing Task 2"                              │
│  Tệp: anh-chup-lop.jpg                                       │
│                                                               │
│  Trạng thái: Đã xử lý                                        │
│                                                               │
│  Biện pháp liên quan (2)                                      │
│   · 18/09  Report cho gia đình        [mở]                   │
│   · 18/09  Thư cảnh cáo lần 1         [mở]                   │
│                                                               │
│  Lịch sử                                                      │
│   14/09  cô Hà sửa mô tả                                     │
│                                                               │
│         [Sửa vi phạm]   [Đánh dấu không chính xác]            │
└───────────────────────────────────────────────────────────────┘
```

Nguồn mục 32: *"Khi mở Violation đó, phải thấy được các Biện pháp liên quan."* — đó là khối
`Biện pháp liên quan`. "Đã xử lý" **không** có nghĩa là xóa hoặc ẩn khỏi lịch sử.

`Đánh dấu không chính xác` mở hộp nhỏ, **lý do bắt buộc**, có câu cảnh báo khi vi phạm đang
nằm trong biện pháp đã thực hiện:

> Vi phạm này đã nằm trong 2 biện pháp đã thực hiện. Đánh dấu không chính xác sẽ loại nó khỏi
> mọi thống kê, nhưng **giữ nguyên** hai biện pháp đó — vì chúng đã thực sự được làm.

### 7.8. Panel chi tiết `Biện pháp`

Hiện: loại · trạng thái · ngày thực hiện · người thực hiện · người xác nhận · nội dung ·
bằng chứng · **danh sách vi phạm liên quan** (bấm mở 7.7) · dòng lưu ý V13 nếu có.

### 7.9. Góc nhìn `Ý thức` trong Phân tích — Quản lý

Thêm một mục vào thanh góc nhìn của tab Phân tích:
`Vấn đề học viên | Kết quả hỗ trợ | Giáo viên | Theo tuần | Ý thức`

```
┌─ Phân tích · Ý thức ── [Monbay ▾] [Tất cả lớp ▾] [12 tuần gần nhất ▾] ─┐
│                                                                          │
│  VI PHẠM                                                                 │
│  ┌────────────────┬───────┬─────────┬──────────┬───────────────────────┐│
│  │ Nhóm           │ Tổng  │ Chưa xử │ Đã xử lý │ Không còn hiệu lực    ││
│  ├────────────────┼───────┼─────────┼──────────┼───────────────────────┤│
│  │ BTVN           │   48  │     11  │      36  │                   1   ││
│  │ Chuyên cần     │   31  │      6  │      25  │                   0   ││
│  │ Thái độ/hành vi│   12  │      4  │       8  │                   0   ││
│  │ Kỷ luật lớp học│    5  │      1  │       4  │                   0   ││
│  │ Khác           │    3  │      0  │       3  │                   0   ││
│  └────────────────┴───────┴─────────┴──────────┴───────────────────────┘│
│  99 vi phạm · 34 học viên · 22 vi phạm chưa xử lý                       │
│                                                                          │
│  BIỆN PHÁP ĐÃ THỰC HIỆN                                                  │
│  GV trao đổi ngắn        18      Thư cảnh cáo lần 1      6               │
│  GV meeting với HS       12      Thư cảnh cáo lần 2      2               │
│  Report cho gia đình      9      Thư cảnh cáo lần 3      0               │
│  CX / GĐCN meeting        4      Đình chỉ học            1               │
│                                  Khác                    2               │
│  → 54 biện pháp đã thực hiện · 3 đang chuẩn bị                          │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Mọi số tính tự động từ dữ liệu thật** (nguồn mục 34). Không có ô nào cho GVCN nhập tay.
- **Không có cột "tỷ lệ cải thiện", không có bảng hiệu quả.** Gia đình đã nhận report không
  chứng minh em tiến bộ — bịa một chỉ số thành công cho một cuộc gọi là nói dối bằng số.
- **Bấm mọi số** mở panel đúng danh sách tạo nên nó (hợp đồng số liệu, luật 1).
- Ba đơn vị (vi phạm · học viên · biện pháp) **có nhãn riêng, không cộng**.

### 7.10. Một dòng trong `Việc cần làm` của GVCN

Thay **hai** nhóm việc cũ (hạn phương án Ý thức, hạn hoàn thành case Ý thức) bằng **một** dòng:

```
⚠  Lớp 6.5A — 3 học viên có vi phạm chưa xử lý quá 5 ngày      [Mở tab Ý thức →]
```

Không có hạn, không tô đỏ như quá hạn, không tính vào "đúng hạn cập nhật".

---

## 8. Số liệu — bổ sung `HOP_DONG_SO_LIEU.md`

Tám chỉ số mới, khai đủ tám trường như mọi chỉ số khác. Mỗi chỉ số bằng **một hàm trả về tập ID**.

| id | Tên | Đơn vị | Thời gian | Định nghĩa bắt buộc |
|---|---|---|---|---|
| `vi-pham-tong` | Vi phạm | vi phạm | phát sinh trong kỳ | `valid = 1`. Đếm theo `occurred_on`, **không** theo `reported_on` |
| `vi-pham-chua-xu-ly` | Vi phạm chưa xử lý | vi phạm | hiện trạng | `valid = 1` và không có dòng nào trong `measure_violations` |
| `vi-pham-khong-hieu-luc` | Vi phạm không còn hiệu lực | vi phạm | phát sinh trong kỳ | `valid = 0`. Đứng **riêng**, không trừ vào `vi-pham-tong` trên cùng một hàng |
| `hv-co-vi-pham` | Học viên có vi phạm | học viên | phát sinh trong kỳ | `COUNT DISTINCT student_id` trên vi phạm `valid = 1` |
| `hv-can-xu-ly` | Học viên cần xử lý | học viên | hiện trạng | Có ít nhất một vi phạm chưa xử lý **và** cái cũ nhất quá 5 ngày (mục 5.5) |
| `bien-phap-da-thuc-hien` | Biện pháp đã thực hiện | biện pháp | kết quả trong kỳ | `status = 'done'`, đếm theo `performed_on`. Một Report gom n vi phạm bằng **MỘT** |
| `bien-phap-dang-chuan-bi` | Biện pháp đang chuẩn bị | biện pháp | hiện trạng | `status = 'preparing'`. Không có hạn nên không có "quá hạn" |
| `bien-phap-theo-loai` | Biện pháp theo loại | biện pháp | kết quả trong kỳ | Chín loại, tách riêng `warning_1/2/3`. Không gộp ba thư thành một dòng |

Ba chỉ số cũ **phải sửa định nghĩa**:

| id | Sửa gì |
|---|---|
| `hv-co-case-mo` | Chỉ đếm case **học thuật**. Ý thức không còn case |
| `case-mo` | Chỉ case học thuật |
| `case-thieu-pa` | Chỉ case học thuật |

Hai luật riêng của nhóm chỉ số này:

1. **Ý thức nằm hoàn toàn ngoài mọi bảng hiệu quả hỗ trợ** (`pa-co-ket-qua`,
   `ty-le-co-cai-thien`). Không có đường nào đưa biện pháp vào mẫu số.
2. **Ý thức không vào `dung-han-cap-nhat`** — không có hạn nào để đúng hay trễ.

---

## 9. Phải gỡ khỏi hệ thống cũ — checklist

Quét theo `grep -rl "behaviour\|Ý thức" web/src shared server/src` — hiện **36 file**.

### 9.1. Dữ liệu và luật thuần

| Gỡ | Ở đâu |
|---|---|
| `THREAD_TRACKS` · `ThreadTrack` · `THREAD_TRACK_LABEL` | `shared/domain/cases.ts` — case chỉ còn học thuật, không còn hai nhánh |
| `BEHAVIOUR_TOPICS` · `BEHAVIOUR_TOPIC_LABEL` · `topicFromBehaviourCode` | thay bằng `VIOLATION_CATEGORIES` ở `shared/domain/yThuc.ts` |
| `'behaviour'` khỏi `CASE_CATEGORIES` (6 xuống **5**) | `shared/domain/cases.ts` và mọi bảng có cột thứ 6 |
| Nhánh `behaviour` của `ISSUE_TAXONOMY` | `shared/domain/cases.ts` |
| `BEHAVIOUR_MERGE_WINDOW_DAYS` · `behaviourMergeUntil` | `shared/domain/cases.ts` — không còn cửa sổ gộp |
| `BEHAVIOUR_CASE_DAYS` · `behaviourCaseDeadline` · `BEHAVIOUR_CYCLE_DAYS` | `shared/domain/cases.ts` — không còn hạn 7 ngày |
| `BEHAVIOUR_OUTCOMES` · `BEHAVIOUR_OUTCOME_LABEL` · `outcomesFor` · `outcomeLabelFor` | `shared/domain/cases.ts` — Ý thức không đo kết quả |
| `CONTACT_KINDS` (`talk_student`/`talk_parent`/`warning_letter`) và `CONTACT_KIND_*` | thay bằng chín loại biện pháp. Đây là chỗ dễ sót nhất |
| `SELF_SERVE_KINDS_BY_TRACK` · `PROPOSAL_KINDS_BY_TRACK` · `interventionKindsFor` | bỏ tham số `track` |
| `C03_CUA_SO_GOP_CASE_Y_THUC_NGAY` · `C04_BAO_CAO_MOI_SAU_KHI_DONG` | `shared/domain/policy.ts` — ghi "hết hiệu lực 21/09/2026", **không xoá dấu vết** |
| Cột `track` · `episode_no` · `merge_until` · `urgency_raised_at` | `server/src/schema.sql`, bảng `sos_cases` |
| Bảng `case_reports` | là "báo cáo nguồn của một đợt Ý thức" — khái niệm không còn. Dữ liệu chuyển thành `violations` |

### 9.2. Máy chủ

| Gỡ hoặc sửa | File |
|---|---|
| Toàn bộ nhánh `if (track === 'behaviour')` trong `reportIssue`, khoảng 120 dòng | `server/src/cases/cases.ts` |
| `raiseBehaviourUrgency` · `addCaseReport` | `server/src/cases/cases.ts` |
| Nhánh behaviour của `caseDetail` · `closeCaseOutcome` · `updateResult` | `server/src/cases/cases.ts` |
| `behaviourDue` trong tính hạn phương án | `server/src/cases/cases.ts` khoảng dòng 1023 |
| Tín hiệu `track = 'behaviour'` | `server/src/cases/signals.ts` · `sos.ts` |
| `classBehaviourBoard` | `server/src/classes/classes.ts` — viết lại thành `classViolationBoard` |
| Nhóm việc Ý thức trong `GROUP_META` | `server/src/worklist/mywork.ts` |
| Đếm case Ý thức | `summary.ts` · `weekly.ts` · `branchpulse.ts` · `metrics.ts` · `dashboard.ts` · `meeting.ts` |
| Sinh case Ý thức trong seed | `server/src/seed/build.ts` · `students.ts` · `journeys.ts` · `data.ts` |
| Thông báo loại case Ý thức | `server/src/routes/index.ts` |
| Quyền Ý thức theo case | `server/src/permissions.ts` — theo bảng mục 6 |

### 9.3. Giao diện

| Gỡ hoặc sửa | File |
|---|---|
| Công tắc `Học thuật / Ý thức` ở đầu form | `web/src/modules/cases/QuickReport.tsx` — form chỉ còn học thuật |
| Cờ `behaviour` và mọi nhánh theo nó | `web/src/modules/cases/CasePanel.tsx` |
| Cột thứ 6 `Ý thức` của bảng kỹ năng | `web/src/modules/cases/SkillBoard.tsx` |
| Ô đếm case gộp cả Ý thức | `web/src/modules/students/StudentDetailPage.tsx` |
| Toàn bộ bảng "số đợt case từng nhóm" | `web/src/modules/classes/ClassBehaviourBoard.tsx` — **viết lại** thành ba khu vực 7.3 |
| Cột Ý thức | `web/src/modules/classes/ClassIssueBoard.tsx` |
| Hàng Ý thức trong bảng kỹ năng | `web/src/modules/cases/IssueAnalysis.tsx` — thêm góc nhìn 7.9 |
| Bộ lọc `track = Ý thức` | `web/src/modules/cases/CaseBoardPage.tsx` |
| Mốc Ý thức kiểu "mở case đợt 2" | `web/src/modules/students/JourneyTimeline.tsx` |
| Nhãn Ý thức trong danh sách việc | `web/src/modules/worklist/ManagerTasks.tsx` |

### 9.4. Việc ĐỪNG làm

- **Đừng đổi tên bảng `sos_cases`.** Nó chạm hàng trăm câu truy vấn; đổi tên là một PR riêng
  không mang lại gì cho người dùng. Chỉ gỡ cột `track` và viết lại chú thích đầu bảng.
- **Đừng xoá `case_interventions`.** Phương án học thuật vẫn dùng nó nguyên vẹn.
- **Đừng gộp `violations` vào `sos_cases`** cho "đỡ một bảng". Hai vòng đời khác nhau; gộp là
  quay lại đúng cái mô hình vừa bỏ.
- **Đừng xoá dấu vết C03 và C04 trong `policy.ts`** — ghi "hết hiệu lực 21/09/2026" kèm lý do.

---

## 10. Dữ liệu demo — reseed, không migrate

Nguồn mục 39 cho phép `reset/reseed`. Mô hình lệch quá xa để migrate có ý nghĩa, và bộ demo
phải dựng được **15 tình huống** nguồn liệt kê. Bảng bám sát:

| # | Tình huống | Dựng thế nào |
|---|---|---|
| 1 | Vi phạm đúng | mọi vi phạm mặc định |
| 2 | Vi phạm bị xác nhận sai | 1 vi phạm `valid = 0`, lý do *"em đã nộp, tôi bỏ sót"* |
| 3 | Nhiều GV cùng ghi vi phạm cho một em | Nguyễn An: cô Hà (Writing), cô Lan (Reading), cô Mai (Chuyên cần) |
| 4 | Nhiều vi phạm khác nhóm | một em có đủ BTVN, Chuyên cần, Thái độ |
| 5 | Một Report gom nhiều vi phạm | Report gia đình 18/09 chứa **5** vi phạm |
| 6 | Một nhóm vi phạm có nhiều biện pháp | 6 vi phạm của Lê Cường vào GV meeting **và** Report **và** Thư cảnh cáo lần 1 |
| 7 | Biện pháp `preparing` được thêm vi phạm mới | Report của Nguyễn An tạo 18/09, thêm vi phạm 20/09 vào sau |
| 8 | Vi phạm bị bỏ khỏi biện pháp | có dòng `violation_history`, vi phạm quay lại `Chưa xử lý` |
| 9 | Thư cảnh cáo 1 đến 2 đến 3 đúng thứ tự | một em có đủ ba thư, ba ngày khác nhau, mỗi thư có tệp |
| 10 | Cảnh báo quá 5 ngày | ít nhất 3 em có vi phạm chưa xử lý, cái cũ nhất 6 đến 9 ngày |
| 11 | Case học thuật Bình thường | giữ như hiện tại |
| 12 | Case học thuật Gấp | giữ như hiện tại |
| 13 | SOS đóng, không tạo case | signal `noted` kèm **lý do** |
| 14 | SOS gắn vào case đang mở | signal `linked` vào case cũ |
| 15 | GV tạo case học thuật trực tiếp | case `origin_kind = 'teacher_report'`, không có signal |

Ba tình huống bổ sung để kiểm phần dễ sai nhất:

| # | Tình huống | Vì sao cần |
|---|---|---|
| 16 | Vi phạm hết hiệu lực **nằm trong** biện pháp đã thực hiện | kiểm V13 — số snapshot không đổi, thống kê loại ra |
| 17 | Một vi phạm nằm trong **hai** biện pháp ở **hai thời điểm khác nhau** | kiểm nhiều–nhiều thật, không phải hai dòng cùng lúc |
| 18 | Em chuyển lộ trình sau khi đã có Thư cảnh cáo lần 2 | kiểm Y02 — chuỗi reset, lần 1 chọn lại được |

`DEMO_SCENARIOS.md` và `DEMO_ASSUMPTIONS.md` hiện tại sẽ **sai hoàn toàn** sau reseed — viết
lại một file gọn thay vì sửa.

---

## 11. Module thứ chín — ranh giới mã

`CODE_MAP.md` hiện có tám module. Ý thức là **module thứ chín**, không nhét vào `cases/`.

```
server/src/yThuc/          violations.ts · measures.ts · thongKe.ts
web/src/modules/yThuc/     ViolationForm.tsx · ClassViolationBoard.tsx
                           MeasureForm.tsx · MeasureConfirm.tsx
                           ViolationPanel.tsx · MeasurePanel.tsx
                           StudentViolationTab.tsx
shared/domain/yThuc.ts     VIOLATION_CATEGORIES · MEASURE_KINDS
                           MEASURE_REQUIRED_FIELDS · WARNING_CHAIN
                           CANH_BAO_NGAY = 5
server/src/platform/attachments.ts   kho tệp và liên kết dùng chung
web/src/ui/BangChung.tsx             khối "Bằng chứng" dùng chung
```

Vì sao tách module: `server/src/cases/cases.ts` đã **3033 dòng**. Nhồi thêm hai vòng đời nữa
vào đó là cách chắc chắn nhất để không ai sửa được nó nữa. Hai hệ khác nhau thì hai module.

---

## 12. Nghiệm thu — bộ tối thiểu

Mỗi dòng phải chạy được thật, không phải "component đã có".

| # | Kịch bản | Phải thấy |
|---|---|---|
| 1 | GVBM Writing ghi vi phạm nhóm Chuyên cần | ghi được; môn tự điền `Writing`, sửa được, bỏ trống được |
| 2 | GVBM ghi vi phạm thứ hai cùng em, cùng nhóm, cùng ngày | cảnh báo mềm hiện **trong form**, vẫn tạo được dòng thứ hai |
| 3 | GVBM mở tab Ý thức của lớp | đọc được ba khu vực, **không** thấy nút Tạo biện pháp |
| 4 | GVCN tick 3 vi phạm của An và 1 của Bình | nút mờ, câu `một biện pháp chỉ xử lý một học viên`, nút `Chỉ giữ Nguyễn An` |
| 5 | GVCN chọn Thư cảnh cáo lần 2 khi chưa có lần 1 | dòng đó khóa kèm lý do tại dòng. Gọi thẳng API cũng bị máy chủ từ chối |
| 6 | Gửi Thư cảnh cáo lần 1 `done` rồi mở lại form | lần 2 mở khóa, lần 3 vẫn khóa |
| 7 | Em chuyển lộ trình mới sau khi có Thư lần 2 | lộ trình mới: lần 1 chọn được, lần 2 khóa |
| 8 | Xác nhận Thư cảnh cáo không đính tệp | nút mờ, câu `Cần đính kèm tệp hoặc liên kết thư cảnh cáo` |
| 9 | Xác nhận `GV trao đổi ngắn` chỉ có ngày và ghi chú | lưu được. Không hỏi tệp, không hỏi tiến bộ |
| 10 | Report gia đình gom 5 vi phạm, xác nhận | thống kê `Report gia đình` tăng **1**, không tăng 5 |
| 11 | Một nhóm 6 vi phạm vào 3 biện pháp | mở một vi phạm thấy **cả 3** biện pháp liên quan |
| 12 | Thêm vi phạm mới vào Report `preparing` | thêm được; vi phạm đó ra khỏi `Chưa xử lý` |
| 13 | Bỏ một vi phạm khỏi Report `preparing` | bỏ được; vi phạm quay lại `Chưa xử lý`, có dòng lịch sử |
| 14 | Thử bỏ vi phạm khỏi Report `done` | bị từ chối ở máy chủ, câu lỗi nói rõ lý do |
| 15 | Đánh dấu không chính xác một vi phạm đã xử lý | cảnh báo hiện; lưu xong biện pháp giữ `5 vi phạm`, thống kê vi phạm giảm 1 |
| 16 | Em có 4 vi phạm chưa xử lý, cũ nhất 9 ngày | cảnh báo ở **ba nơi** (W05), câu đúng số `4` và `9` |
| 17 | Gắn 4 vi phạm đó vào một biện pháp `preparing` | cảnh báo **tắt ngay**, chưa cần xác nhận (W03) |
| 18 | Mọi số ở góc nhìn Ý thức | bấm số nào cũng ra đúng danh sách tạo nên số đó |
| 19 | Ý thức và bảng hiệu quả | không có đường nào đưa biện pháp vào `ty-le-co-cai-thien` |
| 20 | Tải tệp lỗi giữa lúc nhập | nội dung form **còn nguyên**, lỗi hiện tại dòng tệp |
| 21 | Khổ 375px, tab Ý thức của lớp | ba khu vực dọc, không cuộn ngang, thanh `Đã chọn` dính đáy |
| 22 | GVBM gọi API tạo biện pháp | máy chủ từ chối, không chỉ ẩn nút |
| 23 | Tổng quan và hồ sơ HV đếm case | cả hai chỉ đếm case **học thuật**, khớp nhau |
| 24 | `grep -ri "case ý thức\|behaviour" web/src` | không còn kết quả nào ngoài chú thích lịch sử có ghi ngày |

---

## 13. Quy tắc cập nhật file này

- Sửa file này thì ghi một dòng vào `plan.md` mục 14 trong **cùng commit**.
- Không viết "TBD". Chưa chốt thì đưa vào `LUAT_CHO_CHOT.md` có mã, không để trống ở đây.
- File này là **đặc tả**, không phải sổ tiến độ. Đừng tick "đã làm" vào đây — tiến độ ở `plan.md`.
