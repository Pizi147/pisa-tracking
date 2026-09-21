# SOS tự tạo Case · Phối hợp SOS · Ý thức & Phối hợp — bản v3

Phiên bản 1.0 · 21/09/2026 (tối) · **Đặc tả để triển khai.**

> **Nguồn:** `thiet-ke/NGUON-Rule-v3-YThuc-PhoiHop-2026-09-21.md` (chủ sản phẩm gửi tối 21/09).
> UX tham khảo: `thiet-ke/tham-khao/*.html` — **chỉ là tham khảo**, file này thắng prototype.
>
> **File này THAY một phần `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`** — xem mục 1. Phần nào của file đó
> không bị nhắc ở đây thì vẫn giữ nguyên hiệu lực.

---

## 1. Cái gì bị thay, cái gì giữ

| Luật / thiết kế cũ | Trạng thái | Thay bằng |
|---|---|---|
| Rule 21/09 sáng §3: SOS chỉ là tín hiệu; GVBM xác minh rồi **mới** tạo Case | ⚰️ | SOS (Mock Test) **tự tạo hoặc tự gắn Case** cho từng kỹ năng trượt — mục 3 |
| Rule book §3.4: "không tự tạo tutor/tự học chỉ vì có SOS" | ⚰️ | Case từ SOS **tự điền sẵn phương án** theo bảng mặc định — mục 4 |
| C05: SOS không tự sinh việc trao đổi | ⚰️ | **Phối hợp SOS** tự điền sẵn việc theo bảng MT × SOS — mục 5 |
| Y_THUC V11–V14: "Đánh dấu không chính xác", không xoá vật lý | ⚰️ | **Sửa hoặc xoá thẳng** — mục 6 |
| Y_THUC `violation_count_at_confirm` (ảnh chụp số vi phạm) | ⚰️ | Hiện **số vi phạm đang gắn**, xoá vi phạm thì số tự giảm |
| Y_THUC §7.3: tab lớp **ba khu vực xếp dọc** | ⚰️ | Sub-tab **Vi phạm & xử lý**, mặc định **Theo học sinh**, toggle **Theo thời gian** — mục 7 |
| Tên tab `Ý thức` | ⚰️ | **`Ý thức & Phối hợp`**, hai sub-tab `Vi phạm & xử lý` · `Phối hợp SOS` |
| Chín biện pháp, nhiều–nhiều, chuỗi thư cảnh cáo theo lộ trình, cảnh báo 5 ngày, quyền | ✅ giữ | — |
| Case học thuật tạo tay: 5 ngày (Bình thường) / 3 ngày (Gấp) có phương án | ✅ giữ | Mức `Cần chú ý` đổi tên **`Bình thường`** |
| Lớp **Normal** (Progress/Final Test) | ✅ giữ mô hình tín hiệu cũ | v3 chỉ nói Mock Test. Normal **không** tự tạo case, **không** preload — quyết định Q-V3-1 |

Ba luồng tách riêng, **không dùng chung bảng**:

```
Academic Case      vấn đề → nguyên nhân → phương án → tiến trình → kết quả → đóng
Vi phạm + Biện pháp  ghi vi phạm → GVCN xem theo HS → gom → biện pháp → xác nhận
Phối hợp SOS       Mock có SOS → việc phối hợp điền sẵn → GVCN xác nhận / bỏ kèm lý do
```

---

## 2. SOS Event — không có bảng mới

**SOS Event = chính lượt Mock Test** (`assessment_attempts`, một học viên × một MT) có `sos_level ≥ 1`.
Không thêm bảng, không có trạng thái Mở/Đang xử lý/Mở lại cho SOS Event.

Nó chỉ là **mỏ neo** để nối: các Case học thuật liên quan (qua `case_signals`, xem 3.3) và các việc
Phối hợp SOS (qua `sos_coordination_actions.attempt_id`).

Mức SOS giữ nguyên cách tính hiện có (`server/src/fasttrack/scoring.ts` → `resultOf`):
bốn kỹ năng L/R/W/S, **Writing là 1 kỹ năng**. SOS1 = 1 trượt · SOS2 = 2 · SOS3 = từ 3.

---

## 3. Case học thuật tự tạo từ SOS

### 3.1. Luật

| Mã | Luật |
|---|---|
| **S01** | Khi một lượt **Mock Test (Fast Track)** có kỹ năng dưới kỳ vọng, với **mỗi** kỹ năng trượt: tìm case **đang mở** cùng học viên + lộ trình + hạng mục → có thì **gắn** vào (thêm mốc), chưa có thì **tạo case mới**. Không tạo case mới cho mỗi MT nếu cùng kỹ năng còn đang theo dõi |
| **S02** | **Writing:** tầng SOS tính 1 kỹ năng, nhưng case tách **W1 / W2**. Giữ đúng luật hai tầng đang có ở `signals.ts`: Writing tổng trượt thì xét task nào dưới kỳ vọng → tạo/gắn đúng case task đó; cả hai dưới → cả hai. **Không có case Writing tổng** |
| **S03** | Case tạo từ SOS **có sẵn ít nhất một phương án** (mục 4) ngay lúc tạo |
| **S04** | GVBM đúng kỹ năng có **3 ngày** (tính cả ngày đầu, từ ngày case/SOS phát sinh) để: (a) chọn **nguyên nhân** (phân loại vấn đề); (b) **xác nhận / chỉnh / thay** phương án điền sẵn. **Không** có thêm hạn 3/5 ngày lập phương án cho case từ SOS |
| **S05** | Trong 3 ngày đó GVBM có thể bấm **`Không cần theo dõi`** + chọn nhanh lý do: `Học sinh có lý do đặc biệt` · `Tình huống đơn lẻ` · `Khác` (chỉ `Khác` mới hiện ô chữ). Case **đóng**, giữ lịch sử, phương án điền sẵn **huỷ** (không tính thất bại), **không vào** bất kỳ thống kê hiệu quả nào (Q-V3-4) |
| **S06** | Case từ SOS luôn phải có **≥1 phương án đang hoạt động** cho tới khi đóng. Thay phương án = kết thúc cái cũ (`superseded`) + tạo cái mới trong **một** thao tác |
| **S07** | Sau khi xác nhận, case đi **đúng workflow học thuật thường**: cập nhật mỗi Chủ nhật, điều chỉnh, bằng chứng, đóng khi xong. **Không** có lớp "tiến trình SOS" riêng |
| **S08** | Sửa điểm làm kỹ năng hết trượt: dùng đúng cơ chế thu hồi đang có (`withdrawSignalsNoLongerValid` / `caseHasIndependentBasis`). Case chỉ có căn cứ là SOS đó và phương án **chưa xác nhận** → tự huỷ; case đã có việc thật → giữ |
| **S09** | Case **tạo tay** (không từ SOS): giữ luật cũ — `Bình thường` 5 ngày, `Gấp` 3 ngày để có phương án, tính từ ngày tạo |

### 3.2. Trạng thái hiển thị của case từ SOS

| Tình trạng | Nhãn trên web |
|---|---|
| Chưa chọn nguyên nhân hoặc chưa xác nhận phương án | `Chờ GVBM xác định nguyên nhân · hạn {ngày}` |
| Phương án điền sẵn chưa xác nhận | trên dòng phương án: `Gợi ý tự động · chờ xác nhận` + nút `Xác nhận` · `Sửa` · `Thay` |
| Đã xác nhận | như case thường |
| Đóng vì không cần theo dõi | `Không cần theo dõi · {lý do}` |

### 3.3. Gợi ý cài đặt — tận dụng cái đang có

`case_signals` giữ vai **dây nối SOS ↔ Case**: khi S01 chạy, ghi một dòng `status = 'linked'`, `case_id`
trỏ case vừa tạo/gắn, `verify_due` = hạn 3 ngày của S04. Nhờ vậy cơ chế thu hồi khi sửa điểm (S08) và
khoá chống trùng `dedup_key` (đợt × kỹ năng) **dùng lại được nguyên vẹn**. Không tạo bảng nối mới.

Thêm vào `case_interventions`: `preset INTEGER NOT NULL DEFAULT 0` (1 = điền sẵn từ SOS) và
`confirmed_by`, `confirmed_at`. Phương án `preset = 1` mà `confirmed_at IS NULL` **không vào** thống kê
hiệu quả và **không** sinh nghĩa vụ cập nhật tuần.

Thêm vào `sos_cases`: `dismiss_reason_code`, `dismiss_reason_text` cho S05.

---

## 4. Phương án điền sẵn cho case từ SOS

Theo **số MT** của lượt và **mức SOS của cả lượt**. Áp cho **từng** case kỹ năng trượt.

| MT | SOS1 / SOS2 | SOS3 |
|---|---|---|
| **MT1** | `Tự học` · 1 tháng | `Tutor` · đến MT2 |
| **MT2** | `Tự học` · 1 tháng | `Tutor` · đến MT3 |
| **MT3, MT4** | `Tutor` · đến lúc thi | `Tutor` · đến lúc thi |
| **MT5 trở đi** | `Khác` — mô tả: `Hỗ trợ chuyên môn — cần GVBM/P. Học thuật xác nhận` | như cột trái |

Cách tính **ngày dự kiến kết thúc** (`followup_due`):

| Nhãn | Cách tính |
|---|---|
| 1 tháng | Chủ nhật đầu tiên **sau** ngày tạo + 30 ngày |
| đến MT{n+1} | Chủ nhật của tuần kỹ năng **muộn nhất** của lượt MT kế tiếp nếu đã có lịch; chưa có lịch thì để trống, mô tả ghi `đến MT{n+1}` |
| đến lúc thi | Ngày thi dự kiến nếu có (`examPlanOf`); chưa có thì để trống, mô tả ghi `đến lúc thi` |

Người thực hiện mặc định: **GVBM của đúng kỹ năng** ở lớp em đang học. **Không** đưa RETAKE/REFIRE hay
chính sách hỗ trợ phức tạp vào phạm vi.

Hằng số bảng này đặt ở `shared/domain/sos.ts` → `DEFAULT_ACADEMIC_SUPPORT` (một bảng tra, không `if` rải rác).

---

## 5. Phối hợp SOS

### 5.1. Dữ liệu — một bảng mới

```sql
-- MỘT việc phối hợp của GVCN sau một lượt Mock có SOS.
-- KHÔNG phải vi phạm, KHÔNG phải biện pháp xử lý, KHÔNG phải phương án học thuật.
-- Dùng chung component giao diện với Biện pháp (ghi chú, ngày, tệp, xác nhận) nhưng KHÔNG chung bảng.
CREATE TABLE sos_coordination_actions (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),   -- SOS Event
  student_id INTEGER NOT NULL REFERENCES students(id),
  -- talk_student | talk_family | gvcn_meeting | cx_meeting_student | cx_meeting_family | other
  kind TEXT NOT NULL,
  custom_name TEXT,                     -- bắt buộc khi kind = 'other'
  preset INTEGER NOT NULL DEFAULT 0,    -- 1 = điền sẵn theo bảng 5.3
  -- pending (cần xử lý) | done (đã xong) | removed (đã bỏ, có lý do)
  status TEXT NOT NULL DEFAULT 'pending',
  performed_on TEXT, performed_by INTEGER REFERENCES users(id), performer_name TEXT,
  note TEXT,
  -- not_needed | handled_otherwise | duplicate_measure | other | system_sos_changed
  remove_reason_code TEXT, remove_reason_text TEXT,
  removed_by INTEGER REFERENCES users(id), removed_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT
);
-- SỬA 21/09 (PR-T): `UNIQUE (attempt_id, kind, custom_name)` KHÔNG chặn gì khi custom_name NULL (SQLite coi mỗi NULL là một giá trị riêng),
-- tức chạy lặp sẽ nhân đôi việc. Khoá đúng phải bọc COALESCE:
CREATE UNIQUE INDEX uq_sca_attempt_kind ON sos_coordination_actions(attempt_id, kind, COALESCE(custom_name, ''));
CREATE INDEX idx_sca_attempt ON sos_coordination_actions(attempt_id);
CREATE INDEX idx_sca_student ON sos_coordination_actions(student_id, status);
```

`attachments.owner_type` thêm giá trị `sos_coordination_action`.

**Trạng thái "Hoàn thành" của một lượt là SUY RA, không lưu:** mọi việc của lượt đó là `done` hoặc `removed`.
Hiển thị `{số done}/{số việc chưa bị bỏ}`.

### 5.2. Sáu loại việc

`Trao đổi ngắn với HS` · `Trao đổi với gia đình` · `GVCN meeting với HS` · `CX / GĐCN meeting với HS` ·
`CX / GĐCN meeting với HS / PH` · `Khác`

**Không** dùng `Report cho gia đình` cho SOS — đó là biện pháp xử lý vi phạm.

### 5.3. Bảng điền sẵn — MT × SOS

| MT | SOS1 | SOS2 | SOS3 |
|---|---|---|---|
| MT1 | HS + gia đình | HS + gia đình | HS + gia đình + **GVCN meeting HS** |
| MT2 | HS + gia đình | + GVCN meeting HS | + **CX/GĐCN meeting HS** |
| MT3 | HS + gia đình | + GVCN meeting HS | + **CX/GĐCN meeting HS/PH** |
| MT4, MT5 trở đi | HS + gia đình | + GVCN meeting HS | + **CX/GĐCN meeting HS** |

`HS` = Trao đổi ngắn với HS · `gia đình` = Trao đổi với gia đình. Dấu `+` = thêm vào cột bên trái.
MT3 SOS3 là **ngoại lệ duy nhất** dùng meeting có PH. Hằng số: `shared/domain/sos.ts` → `DEFAULT_SOS_COORDINATION`.

### 5.4. Luật

| Mã | Luật |
|---|---|
| **P01** | Lượt Mock có SOS lần đầu → tạo các việc `preset = 1` theo 5.3. Chạy lặp (lưu điểm lại, chấm lại) **không** nhân đôi (khoá `UNIQUE`) |
| **P02** | Mức SOS **tăng** khi nhập thêm điểm → **thêm** việc còn thiếu. Việc đã có giữ nguyên |
| **P03** | Mức SOS **giảm hoặc hết** do sửa điểm → việc `pending` không còn trong bảng mới tự chuyển `removed` với `system_sos_changed`. Việc `done` **giữ nguyên** — việc đã làm thật không bị xoá |
| **P04** | Người thao tác: **GVCN** của lớp em đang học và **Quản lý** trong phạm vi. GVBM chỉ xem |
| **P05** | GVCN **thêm** việc bất kỳ trong sáu loại, **bỏ** việc bất kỳ `pending` |
| **P06** | Bỏ việc: **lý do chọn nhanh ngay tại dòng**, không mở hộp thoại — `Không cần trong trường hợp này` · `Đã xử lý theo cách khác` · `Trùng với Biện pháp khác` · `Khác` (chỉ `Khác` hiện ô chữ ngắn). Lưu vết vào lịch sử |
| **P07** | Xác nhận xong: bắt buộc **ngày thực hiện** (không cho ngày tương lai); ghi chú và tệp tuỳ chọn. Không hỏi tiến bộ |
| **P08** | Phối hợp SOS **độc lập** với Case học thuật: hoàn thành cái này không đóng cái kia và ngược lại |
| **P09** | Chỉ Mock Test Fast Track. Normal không có Phối hợp SOS (Q-V3-1) |
| **P10** | Không có hạn cứng, không vào "đúng hạn cập nhật", không vào bảng hiệu quả |

---

## 6. Vi phạm — sửa và xoá thẳng

| Mã | Luật (thay V11–V14) |
|---|---|
| **V11′** | Ghi sai thì **sửa trực tiếp** hoặc **xoá**. Không có quy trình "đánh dấu không chính xác", không có trạng thái `Không còn hiệu lực` |
| **V12′** | Sửa/xoá được ở mọi nơi: danh sách lớp, hồ sơ học viên, bên trong biện pháp đang chuẩn bị — **kể cả** khi vi phạm đã nằm trong biện pháp **đã thực hiện** |
| **V13′** | Xoá vi phạm: xoá dòng ở `violations`, các dòng `measure_violations` và tệp gắn với nó. Mọi số liệu tự cập nhật. Ghi **một dòng `audit_logs`** (ai, lúc nào, nội dung đã xoá) — chỉ để truy vết, không hiện trên giao diện |
| **V14′** | Biện pháp **đã thực hiện** mất hết vi phạm do xoá: vẫn giữ biện pháp (việc đã làm thật), hiện `0 vi phạm`. Số trên biện pháp luôn là **số đang gắn**, không phải ảnh chụp |
| **V10** | *(giữ)* Người sửa/xoá: người ghi · GVCN · Quản lý trong phạm vi |
| — | Hộp xác nhận xoá **một dòng**: `Xoá vi phạm này? Nó sẽ bị gỡ khỏi {n} biện pháp.` + `Xoá` / `Huỷ`. Không cần gõ lý do |

Dữ liệu cũ có `valid = 0` → nâng cấp bằng cách **xoá** (ghi audit). Cột `valid`, `invalid_*`,
`violation_count_at_confirm` ngừng dùng; giữ hay gỡ cột do session coding quyết theo đường an toàn cho `migrate`.

Trạng thái hiển thị của vi phạm còn **ba**: `Chưa xử lý` · `Đang chuẩn bị xử lý` · `Đã xử lý`.

---

## 7. Giao diện

Nguyên tắc: **GVCN nhìn theo HỌC SINH trước**. Mở rộng tại chỗ (inline), **không** mở trang mới cho vài dòng,
**không** thêm thẻ số lớn cho đầy màn.

### 7.1. Hồ sơ lớp — tab `Ý thức & Phối hợp`

```
Lớp MB-FT 101 · [Học viên] [Ý thức & Phối hợp] [Phân tích lớp] [Giáo viên]
┌───────────────────────────────────────────────────────── [+ Ghi vi phạm] ┐
│ [ Vi phạm & xử lý 5 ]  [ Phối hợp SOS 2 ]                                 │
│                                                                            │
│ [Tất cả][BTVN][Chuyên cần][Thái độ][Kỷ luật][Khác]    (•)Theo học sinh ( )Theo thời gian │
│                                                                            │
│ ▸ Lê Quang Huy     5 vi phạm · 3 BTVN · 2 Chuyên cần   ⚠ cũ nhất 6 ngày  1 BP đang chuẩn bị │
│ ▾ Nguyễn Minh Anh  2 vi phạm · 1 BTVN · 1 Thái độ                          │
│   ┌ Vi phạm ───────────────────────────────┐ ┌ Xử lý ───────────────────┐ │
│   │ ☐ 20/09 Thái độ  Nói chuyện nhiều · GV Linh ✎ 🗑 │ │ Chưa có biện pháp đang │ │
│   │ ☐ 14/09 BTVN     Thiếu Listening · GV Nam   ✎ 🗑 │ │ chuẩn bị               │ │
│   │ [Tạo biện pháp từ 0 vi phạm đã chọn]      │ │ Gần đây: —              │ │
│   └────────────────────────────────────────────┘ │ [Hồ sơ học viên →]      │ │
│                                                   └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

| Quyết định | Lý do |
|---|---|
| Mặc định **Theo học sinh**, mỗi lần vào tab đều về mặc định | Nguồn §13. Không nhớ lựa chọn — ít trạng thái ẩn |
| Số đếm trên nút sub-tab: `Vi phạm & xử lý {số HS cần xử lý}` · `Phối hợp SOS {số lượt chưa hoàn thành}` | Nhìn là biết bên nào có việc |
| Dòng HS: tên · tổng + chia theo nhóm · **cảnh báo ngay trên dòng** `⚠ cũ nhất {k} ngày` · `{n} BP đang chuẩn bị` | Nguồn §23: cảnh báo theo HS có ích hơn một banner chung |
| Sắp xếp dòng: có cảnh báo trước → nhiều vi phạm chưa xử lý → tên | Em cần chú ý nổi lên đầu |
| Chỉ hiện HS **có** vi phạm (theo bộ lọc) | Không kéo 18 dòng rỗng |
| Bấm dòng → **mở tại chỗ**, hai cột: `Vi phạm` (có ô tick, sửa ✎, xoá 🗑) · `Xử lý` (biện pháp đang chuẩn bị + nút `Xác nhận`, 3 biện pháp gần nhất, link `Hồ sơ học viên`) | Không trang mới, không ngăn kéo chồng |
| Tick vi phạm → nút `Tạo biện pháp từ {n} vi phạm` trong chính khối đó | Không còn lỗi "chọn vi phạm của hai em" — mỗi khối là một HS |
| Bộ lọc nhóm áp **cùng một logic** cho cả hai chế độ: Theo HS chỉ hiện HS có vi phạm nhóm đó, số là số của nhóm đó; Theo thời gian chỉ hiện dòng nhóm đó | Nguồn §38 |
| **Theo thời gian:** danh sách phẳng mới nhất trước: `ngày · tên HS · nhóm · mô tả · GV ghi · ✎ 🗑` | Để tra cứu, không phải chỗ xử lý chính |
| Bỏ ba khu vực xếp dọc của đặc tả cũ, bỏ thanh "Đã chọn n vi phạm" dính đáy | Đã có trong khối của từng HS |
| Chưa làm bộ lọc phụ `Chưa xử lý / Có BP đang chuẩn bị / >5 ngày` | Nguồn §15 cho phép hoãn; cảnh báo đã nằm trên dòng |

### 7.2. Hồ sơ lớp — sub-tab `Phối hợp SOS`

```
▾ Lê Quang Huy   MT2 · SOS2 · Writing + Speaking            2/3 hoàn thành
    Trao đổi ngắn với HS        15/09 · Đã xong
    Trao đổi với gia đình       16/09 · Đã xong
    GVCN meeting với HS         Cần xử lý   [Xác nhận] [Bỏ ▾]
    [+ Thêm việc]
▸ Nguyễn Minh Anh MT3 · SOS3 · Listening + Writing + Speaking  1/3 hoàn thành
```

- Chỉ hiện lượt **chưa hoàn thành** mặc định; một nút `Hiện cả lượt đã xong`.
- **Không** hiện phương án học thuật ở đây; một dòng xám `Hỗ trợ học thuật xem ở bảng kỹ năng`.
- `Xác nhận` mở **tại dòng** ô ngày (mặc định hôm nay) + ghi chú + tệp → `Lưu`. Không hộp thoại.
- `Bỏ ▾` mở bốn lý do chọn nhanh tại dòng (P06).

### 7.3. Hồ sơ học viên — tab `Ý thức & Phối hợp`

Thêm vào bộ tab hiện có của `StudentDetailPage.tsx` (đang là `Điểm và case` · `Hành trình`), **không** dựng lại hồ sơ.

```
[ Vi phạm & xử lý ] [ Phối hợp SOS 1 ]                           [+ Ghi vi phạm]
5 vi phạm trong lộ trình · 3 BTVN · 2 Chuyên cần · 1 BP đang chuẩn bị · Thư cảnh cáo: lần 1
[Tất cả][BTVN][Chuyên cần][Thái độ][Kỷ luật][Khác]      [7 ngày][30 ngày][Tất cả]
☐ 18/09 Vi phạm    Thiếu Reading · BTVN · GV An                  ✎ 🗑
  18/09 Biện pháp  Report cho gia đình · Đang chuẩn bị · 3 vi phạm   [Mở]
☐ 15/09 Vi phạm    Không nộp Writing · BTVN · GV Hà · ⚠ 6 ngày    ✎ 🗑
  12/09 Biện pháp  GV meeting với HS · Đã thực hiện               [Xem]
[Tạo biện pháp từ {n} vi phạm đã chọn]
```

- **Không** có toggle Theo HS (đã là một em). Tóm tắt là **một dòng chữ**, không thẻ số.
- Một dòng thời gian trộn vi phạm + biện pháp; chỉ vi phạm có ô tick.
- Sub-tab `Phối hợp SOS`: danh sách theo lượt `MT3 · SOS3  3/3 · Hoàn thành`, bấm để mở việc như 7.2.

### 7.4. Hai hằng số giao diện không đổi từ đặc tả cũ

Form `Ghi vi phạm` (Y_THUC §7.2), form `Tạo biện pháp` (§7.4) và `Xác nhận đã thực hiện` (§7.5) **giữ nguyên**,
trừ: bỏ mọi chỗ nói "không chính xác". Nút `Ghi vi phạm` có ở: dòng HS tab `Học viên`, đầu tab `Ý thức & Phối hợp`
của lớp, và đầu tab của hồ sơ học viên.

### 7.5. Case học thuật từ SOS — trên bảng kỹ năng hiện có

Không màn mới. Trên thẻ case ở `SkillBoard.tsx`:
- dòng trạng thái `Chờ GVBM xác định nguyên nhân · hạn {ngày}` + nút chính `Xác định nguyên nhân`
  (mở đúng ô phân loại đang có trong form case);
- phương án điền sẵn hiện nhãn `Gợi ý tự động · chờ xác nhận` + `Xác nhận` · `Sửa` · `Thay`;
- nút phụ `Không cần theo dõi` (S05) với ba lý do chọn nhanh tại chỗ.

### 7.6. Số liệu cho Quản lý — không thêm dashboard

Trong tab Phân tích (Thực trạng) hiện có, thêm **một** góc nhìn `Ý thức & Phối hợp` gồm ba bảng nhỏ,
mọi số bấm được (hợp đồng số liệu):

1. **Vi phạm theo nhóm:** Tổng · Chưa xử lý · Đang chuẩn bị · Đã xử lý (5 hàng nhóm).
2. **Biện pháp đã thực hiện theo loại:** 9 hàng, ba thư cảnh cáo tách riêng.
3. **Phối hợp SOS:** số lượt có SOS · đã hoàn thành · đang xử lý; tách theo SOS1/2/3.

Bộ lọc: chi nhánh · lớp · khoảng thời gian (dùng bộ chọn đang có). **Không** có tỷ lệ cải thiện.

---

## 8. Chỉ số — bổ sung `HOP_DONG_SO_LIEU.md`

| id | Đơn vị | Định nghĩa |
|---|---|---|
| `vi-pham-khong-hieu-luc` | — | ⚰️ **Bỏ** (không còn trạng thái này) |
| `phoi-hop-luot-sos` | lượt | Lượt Mock FT có `sos_level ≥ 1` trong phạm vi/kỳ |
| `phoi-hop-dang-xu-ly` | lượt | Lượt có ≥1 việc `pending` |
| `phoi-hop-hoan-thanh` | lượt | Lượt có ≥1 việc và mọi việc `done` hoặc `removed` |
| `case-cho-xac-dinh-nguyen-nhan` | case | Case từ SOS chưa có nguyên nhân hoặc còn phương án điền sẵn chưa xác nhận |

---

## 9. Dữ liệu demo — chỉ để phát triển

Bản chính dùng **dữ liệu rỗng** (quyết định 21/09 tối). Bộ demo `npm run seed` vẫn giữ cho máy dev, bổ sung
đủ tình huống nguồn §39: HS nhiều nhóm · HS chỉ 1 vi phạm · HS cảnh báo >5 ngày · biện pháp đang chuẩn bị ·
đã thực hiện · Thư cảnh cáo lần 1 · cùng HS có Phối hợp SOS · nhiều HS khác mức SOS · một case từ SOS chờ xác
định nguyên nhân · một case đóng vì `Không cần theo dõi`.

---

## 10. Nghiệm thu tối thiểu

| # | Kịch bản | Phải thấy |
|---|---|---|
| 1 | Nhập điểm MT2 cho HS: Writing (chỉ W2 dưới) + Speaking dưới → SOS2 | Tạo case W2 + Speaking (không có case W1, không case Writing tổng); mỗi case có `Tự học · 1 tháng` chờ xác nhận; 3 việc phối hợp (HS, gia đình, GVCN meeting) |
| 2 | Nhập lại cùng điểm | Không nhân đôi case, phương án, việc phối hợp |
| 3 | HS đã có case Speaking đang mở, MT3 lại trượt Speaking | Gắn vào case cũ (thêm mốc), không tạo case mới |
| 4 | Sửa điểm Speaking thành đạt | Case Speaking chưa xác nhận tự huỷ; SOS2 → SOS1: việc `GVCN meeting` đang `pending` thành `removed · system_sos_changed` |
| 5 | GVBM bấm `Không cần theo dõi` · `Tình huống đơn lẻ` | Case đóng, không vào thống kê hiệu quả |
| 6 | GVBM Reading cố xác nhận case Writing | Máy chủ từ chối (C02) |
| 7 | GVCN bỏ việc `Trao đổi với gia đình` chọn `Đã xử lý theo cách khác` | Không mở hộp thoại; lượt tính `1/2` thay vì `1/3` |
| 8 | Lớp Normal có Progress Test trượt 2 môn | **Không** tự tạo case, **không** có Phối hợp SOS |
| 9 | Xoá một vi phạm nằm trong Report gia đình **đã thực hiện** | Report còn, số vi phạm giảm 1; thống kê giảm 1; có dòng `audit_logs` |
| 10 | Tab lớp, bộ lọc BTVN, đổi Theo HS ↔ Theo thời gian | Cùng một tập vi phạm BTVN ở cả hai chế độ |
| 11 | Mở tab lớp lần hai sau khi đã chọn Theo thời gian | Về lại Theo học sinh |
| 12 | HS có vi phạm cũ nhất 6 ngày chưa xử lý | `⚠ cũ nhất 6 ngày` nằm **trên dòng của HS đó** |
| 13 | Hồ sơ HV, lọc `7 ngày` + `BTVN` | Chỉ vi phạm/biện pháp đúng khoảng; tạo biện pháp từ vi phạm đã tick |
| 14 | Quản lý mở góc nhìn `Ý thức & Phối hợp` | Ba bảng, bấm số ra đúng danh sách |
| 15 | Khổ 375px | Dòng HS xuống hai hàng, khối mở tại chỗ xếp một cột, không cuộn ngang |

---

## 11. Quyết định v3 do bên thiết kế tự chốt (chủ sản phẩm cho phép 21/09 tối)

| Mã | Quyết định |
|---|---|
| Q-V3-1 | Lớp Normal giữ mô hình tín hiệu cũ; không tự tạo case, không preload, không Phối hợp SOS. v3 chỉ nói Mock Test |
| Q-V3-2 | SOS Event = lượt Mock; `case_signals` làm dây nối SOS ↔ Case; không bảng mới cho SOS Event |
| Q-V3-3 | Phương án điền sẵn chưa xác nhận không vào hiệu quả, không sinh nghĩa vụ cập nhật tuần |
| Q-V3-4 | *(chủ sản phẩm chốt)* Case từ SOS được đóng ngay `Không cần theo dõi` kèm lý do chọn nhanh |
| Q-V3-5 | Sửa điểm làm SOS thay đổi: thêm việc thiếu; việc `pending` không còn phù hợp tự bỏ với lý do hệ thống; việc `done` giữ |
| Q-V3-6 | Xoá vi phạm ghi `audit_logs`; biện pháp hiện số vi phạm đang gắn, không ảnh chụp |
| Q-V3-7 | Tab lớp luôn mở ở Theo học sinh; không nhớ lựa chọn |
| Q-V3-8 | Hồ sơ lớp: mở rộng tại chỗ hai cột thay cho ngăn kéo — ít lớp chồng hơn |
| Q-V3-9 | Quản lý xem số liệu Ý thức & Phối hợp bằng **một góc nhìn** trong Phân tích hiện có, không dashboard mới |
