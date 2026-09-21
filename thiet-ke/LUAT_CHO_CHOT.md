# Chín điểm luật chưa chốt — C01…C09

> **CẬP NHẬT 20/09/2026 — chủ sản phẩm đã trả lời.** Xem mục 5 ở cuối file: C02, C03, C04, C06, C07, C09, C10 đã chốt; C01 chờ xác nhận cách hiểu; C08 còn một nửa chưa rõ. Các mục bên dưới giữ nguyên làm lịch sử câu hỏi.

Rule book mục 14. Chủ sản phẩm chưa trả lời. **Không tự chọn phương án thuận tiện nhất rồi
chôn nó vào giữa một hàm.**

---

## 1. Cách code phải đối xử với chúng

Một file duy nhất: `shared/domain/policy.ts`.

```ts
/** C03 — CHƯA CHỐT 20/09/2026.
 *  Sổ ví dụ: hạn Gấp tính từ ngày mở (mở 14/09 → 16/09).
 *  Code hiện tại `deadlineAfterRaise`: ngày nâng mức +2, không muộn hơn hạn cũ (nâng 16/09 → 18/09).
 *  Đang dùng: phương án code hiện tại (giữ nguyên dữ liệu trong khi chờ).
 *  Đổi ở đây, không đổi ở nơi gọi. */
export const C03_HAN_KHI_NANG_GAP = 'ngay-nang-cong-2' as const;
```

Ba ràng buộc:

1. Mỗi điểm chưa chốt là **một hằng số có tên**, kèm chú thích nêu **cả hai phương án** và lý do
   đang chọn cái nào. Không `if` rải rác.
2. Nơi gọi chỉ đọc hằng số. Đổi quyết định = sửa một dòng.
3. **Không viết migration dữ liệu** dựa trên một điểm chưa chốt. Giữ nguyên dữ liệu gốc.

---

## 2. Bảng chín điểm

| Mã | Câu hỏi chưa trả lời | Phương án đang dùng khi chờ | Ảnh hưởng tới màn nào |
|---|---|---|---|
| **C01** | Sau 3 ngày xác minh SOS, phương án đầu tiên có phải nằm trong cùng hạn đó không? | Giữ hai mốc riêng như code hiện tại; UI hiện **hai** `<Han>` khác loại, không gộp | Hồ sơ HV · Công việc · Tổng quan |
| **C02** | GVCN có quyền xử lý case học thuật **trái môn** trong lớp chủ nhiệm không? | Theo AUTH-01 đã code: GVCN cả lớp. **Không mở rộng thêm** | Form +Case · quyền máy chủ |
| **C03** | Nâng mức Gấp thì hạn tính từ ngày mở hay ngày nâng +2? | Code hiện tại: `min(hạn hiện tại, ngày nâng + 2)` | Case Ý thức · badge quá hạn |
| **C04** | Đợt Ý thức đã đóng, có báo cáo mới trong cửa sổ — mở lại hay tạo đợt mới? | Tạo **đợt mới liên kết**, không viết lại kết luận cũ | Form báo vấn đề · hồ sơ HV |
| **C05** | *(Đã chốt 19/09)* SOS có bắt buộc sinh PA trao đổi không? | **Không.** GVCN tự quyết định và tự lập PA | — |
| **C06** | "Phát hiện trước đây nhưng đang xử lý" khác "đã hoàn thành từ trước" thế nào? | Tab `Đã xong từ trước` chỉ nhận case **đã hoàn thành**; case đang xử lý dùng form thường | Form +Case |
| **C07** | Đợt FT chỉ có W1 hoặc W2 thì tính Writing thế nào? | **Chưa hỗ trợ.** Chặn ở cấu hình phạm vi, không lặng lẽ dùng W1 thay Writing tổng | Kế hoạch Test |
| **C08** | Hạn chấm Normal là Chủ nhật tuần thi hay tuần kế? | **Không áp mặc định FT.** Hiện `Hạn chấm theo quy định của lớp`, chờ chốt | Bảng chấm Normal |
| **C09** | Đề nghị dời lịch lần hai tự hết hạn lúc nào, và nếu QL không trả lời? | **Không tự suy "không trả lời" = "từ chối".** Giữ `Chờ quản lý duyệt` cho tới khi có thao tác | Kế hoạch Test · Công việc |

C05 đã có lời chốt; giữ trong bảng để không ai khôi phục luật cũ.

---

## 3. Ngoại lệ của mục 17.1 cũng chưa chốt

Rule book 17.1 chốt "còn dấu '-' hết Chủ nhật thì xác lập không dự thi", nhưng để ngỏ ba câu:

1. Nhập '-' cho một tuần **đã kết thúc từ trước** thì chốt ngay hay cần QL hiệu chỉnh?
2. Ai được sửa kết luận không dự thi **sau** cuối tuần, và việc đó có đảo quyết định duyệt đã
   phát sinh không?
3. Dấu '-' sửa trước cuối tuần nào thì bám **tuần lịch của bài**, không kéo hạn sang tuần nhập
   muộn — cần khẳng định khi code.

Khi triển khai: đặt `C10_NHAP_DAU_TRU_TUAN_QUA_KHU` trong `policy.ts`, mặc định **không tự chốt
ngay** mà tạo một mục chờ QL hiệu chỉnh. Không âm thầm mở lại tuần đã chốt, cũng không cấm sửa
dữ liệu sai.

---

## 4. Hiển thị cho người dùng

Không dựng màn "luật chờ chốt" cho người dùng cuối. Nhưng chỗ nào một điểm chưa chốt ảnh hưởng
trực tiếp tới con số trên màn, ghi một dòng ngắn trung tính, ví dụ hạn Normal: `Hạn chấm theo
quy định của lớp`. Không viết "chưa chốt", không viết mã C trên giao diện người dùng.

---

## 5. Lời chốt ngày 20/09/2026

Nguồn chi tiết: rule book mục 17.7 · `shared/domain/policy.ts`.

| Mã | Đã chốt | Trạng thái mã |
|---|---|---|
| C01 | 3 ngày SOS phải có PA; sau đó Học thuật ghi kết quả mỗi Chủ nhật + chốt cuối đợt, Ý thức hoàn thành hết PA trong hạn 1 tuần | **Chờ xác nhận** cách hiểu (chủ sản phẩm hỏi "đúng không?") |
| C02 | GVCN không xử lý case học thuật trái môn | Đã áp (`permissions.ts`) |
| C03 | Bỏ câu hỏi nâng mức; Ý thức gộp trong 3 ngày đầu, ngoài ra ra case mới; hạn mặc định 1 tuần | Đã áp (cửa sổ gộp 3 ngày; bỏ siết hạn khi nâng mức) |
| C04 | Giữ: đợt mới liên kết | Khớp hành vi cũ |
| C06 | Giữ | Khớp hành vi cũ |
| C07 | Writing phải đủ W1 và W2; thiếu thì báo quá hạn như bình thường | Khớp hành vi cũ |
| C08 | Hạn chấm Normal hết Chủ nhật tuần thi; chưa có bài thì thêm "-" và dời sang tuần sau | Hạn: khớp hành vi cũ. "Thêm - và dời": **chưa rõ, chưa làm** |
| C09 | Chờ QL hết tuần đó; không phản hồi thì huỷ | Khớp hành vi cũ |
| C10 | Chốt ngay | Đã áp |

Sau cuối tuần chỉ Quản lý sửa kết luận; quyết định mới ghi đè trực tiếp, không duyệt lại; audit log chỉ để truy vết.

---

## 6. Chốt ngày 21/09/2026 — bốn điểm Ý thức (Y01–Y04) và đóng C01

Nguồn: `NGUON-Rule-Y-thuc-2026-09-21.md` + trả lời trực tiếp của chủ sản phẩm ngày 21/09/2026.
Đặc tả: `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. Luật: rule book mục 18.

### 6.1. Bốn điểm mới, đã chốt hết

| Mã | Câu hỏi | Đã chốt | Hằng số ở `shared/domain/yThuc.ts` |
|---|---|---|---|
| **Y01** | Ai xác nhận biện pháp nặng (Thư cảnh cáo 1/2/3, Đình chỉ học, CX/GĐCN meeting)? | **GVCN tự làm hết.** Không có bước Quản lý duyệt cho bất kỳ loại nào. Quản lý nhận thông báo khi Thư cảnh cáo hoặc Đình chỉ học được xác nhận | `Y01_AI_XAC_NHAN_BIEN_PHAP_NANG = 'gvcn-tu-lam'` |
| **Y02** | Chuỗi Thư cảnh cáo 1→2→3 đếm trong phạm vi nào? | **Theo lộ trình học** (`learning_cycles.id`). Sang lộ trình mới thì reset về lần 1 | `Y02_PHAM_VI_CHUOI_THU_CANH_CAO = 'theo-lo-trinh'` |
| **Y03** | Ba khu vực Ý thức của GVCN đặt ở đâu? | **Tab `Ý thức` trong hồ sơ LỚP** + tab `Ý thức` gọn trong hồ sơ học viên. **Không** thêm khu vực cấp chính thứ 5 | *(quyết định giao diện, không cần hằng số)* |
| **Y04** | Mấy nhóm vi phạm? | **Năm nhóm:** Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác. Bỏ `Tham gia trên lớp`, dữ liệu cũ đổi sang `Thái độ / hành vi` | `VIOLATION_CATEGORIES` |

Cả bốn đều **đã chốt**, không có phương án chờ. Vẫn khai thành hằng số có tên theo luật ở mục 1,
để lần sau muốn đổi thì sửa một dòng chứ không đi tìm `if` rải rác.

### 6.2. C01 đóng — nguồn 21/09 đã tự trả lời

C01 hỏi: sau 3 ngày xác minh SOS, phương án đầu tiên có phải nằm trong cùng hạn đó không?

Nguồn 21/09 mục 3.2 viết thẳng: *"Không được hiểu rằng trong 3 ngày đó bắt buộc phải hoàn thành
cả phương án Academic Case."* Mục 6 tách rõ hai mốc: **SOS 3 ngày để xác nhận nguyên nhân** ·
**Academic Case 3/5 ngày để có phương án, tính từ ngày Case được tạo**.

Vậy `C01_HAN_XAC_MINH_SOS_GOM_PA = 'hai-moc-rieng'` — **đúng như mã đang chạy**. Không phải sửa gì.
Đổi nhãn hằng số từ "CHƯA NỐI DÂY, chờ xác nhận" thành "ĐÃ CHỐT 21/09/2026, khớp hành vi đang chạy".

### 6.3. C03 và C04 hết hiệu lực

Hai điểm này là luật của mô hình Case Ý thức, mà mô hình đó đã bị bỏ.

| Mã | Luật cũ | Trạng thái mới |
|---|---|---|
| **C03** | Cửa sổ gộp case Ý thức 3 ngày (ngày mở + 2) | **HẾT HIỆU LỰC 21/09/2026.** Không còn gộp theo ngày; mỗi vi phạm là một record độc lập |
| **C04** | Đợt Ý thức đã đóng mà có báo cáo mới thì tạo đợt mới liên kết | **HẾT HIỆU LỰC 21/09/2026.** Không còn đợt; báo cáo mới chỉ là một vi phạm mới |

**Giữ cả hai hằng số trong `policy.ts`** kèm chú thích "hết hiệu lực 21/09/2026, lý do: rule book
mục 18". Xoá hẳn là xoá mất dấu vết một quyết định có thật — đúng thứ mục 1 luật 3 cấm.

### 6.4. Còn đúng một điểm chưa chốt: C08

| Mã | Còn chưa rõ |
|---|---|
| **C08** | Hạn chấm Normal hết Chủ nhật tuần thi — **đã đúng**. Còn chưa rõ: *"chưa có bài thì thêm `-` và dời sang tuần sau"* — **ai** thêm dấu `-` (hệ thống tự thêm hay giáo viên), và Normal có **thật sự dùng** dấu `-` không (hiện Normal luôn đủ bốn môn, không có `-`). Chưa triển khai |

Trên màn Normal, trong khi chờ, giữ câu trung tính `Hạn chấm theo quy định của lớp` theo luật ở
mục 4 — không viết "chưa chốt", không hiện mã C.

### 6.5. Bảng tổng trạng thái sau 21/09/2026

| Mã | Trạng thái |
|---|---|
| C01 | ✅ Đóng 21/09 — hai mốc riêng, khớp mã đang chạy |
| C02 | ✅ Đã chốt, đã nối dây. **Chỉ áp cho case học thuật**, không áp cho Ý thức |
| C03 | ⚰️ Hết hiệu lực 21/09 |
| C04 | ⚰️ Hết hiệu lực 21/09 |
| C05 | ✅ Đã chốt 19/09 |
| C06 | ✅ Đã chốt. Tab "Đã xong từ trước" nay **chỉ còn nhánh Học thuật** |
| C07 | ✅ Đã chốt, khớp hành vi |
| C08 | ⏳ **Chưa chốt hẳn** — điểm duy nhất còn lại |
| C09 | ✅ Đã chốt, khớp hành vi |
| C10 | ✅ Đã chốt, đã nối dây |
| Y01–Y04 | ✅ Đã chốt 21/09, chưa nối dây (chưa có mã Ý thức) |


---

## 7. Tối 21/09/2026 — rulebook v3

| Mã | Trạng thái mới |
|---|---|
| **C05** | ⚰️ **Hết hiệu lực.** Thay bằng Phối hợp SOS điền sẵn (`SOS_VA_PHOI_HOP_V3.md` §5). Giữ hằng số `C05_*` kèm chú thích |
| **Q-V3-1…9** | Quyết định thiết kế v3, xem `SOS_VA_PHOI_HOP_V3.md` §11. Q-V3-4 do chủ sản phẩm chốt |
| **C08** | ⏳ Vẫn là điểm duy nhất chưa chốt |
