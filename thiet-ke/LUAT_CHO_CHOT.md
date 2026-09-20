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
