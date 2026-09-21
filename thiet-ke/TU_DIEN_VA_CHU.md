# Từ điển khái niệm và bộ chữ tiếng Việt

Hai việc trong một file, vì chúng là một vấn đề: **cùng một thứ phải gọi bằng cùng một chữ ở
mọi màn.** Cụ thể hóa rule book mục 2 và design plan mục 19.

---

## 1. Mười hai khái niệm không được nhập làm một

Rule book mục 2. Vi phạm bảng này là lỗi nghiệp vụ, không phải lỗi biên tập.

| Khái niệm | Chữ dùng trên web | Tuyệt đối không viết |
|---|---|---|
| Kết quả cảnh báo từ điểm một đợt Test | `SOS 1/2/3` | "mức gấp", "mức ưu tiên" |
| Dữ liệu điểm cho thấy cần tìm nguyên nhân | `Tín hiệu cần xác minh` | "case", "vấn đề đã xác định" |
| Vấn đề cụ thể của một em, đúng kỹ năng, có phân loại | `Case học thuật` | "SOS", "tín hiệu" |
| ~~Một đợt xử lý BTVN/chuyên cần/tham gia~~ | ~~`Case Ý thức`~~ | **HẾT HIỆU LỰC 21/09/2026** — xem mục 6 |
| Một hoạt động hỗ trợ có người làm và kết quả riêng | `Phương án` (PA) | "task", "việc được giao" |
| Kết thúc một hoạt động | `Kết thúc phương án` | "hoàn thành case" |
| Kết luận cả vấn đề | `Hoàn thành case` | "đóng phương án" |
| Đã có đủ điểm các môn bắt buộc của đợt | `Đã đủ điểm` | "đạt", "hoàn tất" |
| Overall đủ dữ liệu và đạt kỳ vọng | `Đạt kỳ vọng` | "đạt cả đợt" khi còn thiếu môn |
| GV báo học viên không làm bài | `Không có bài` (trước CN) → `Không dự thi` (sau chốt) | "vắng" khi chưa chốt, "0 điểm" |
| Lùi ngày xử lý/chấm bài | `Hẹn xử lý` | "dời lịch thi" |
| Đổi tuần thi | `Đổi lịch` | "hẹn xử lý" |

Ba đơn vị đếm **không bao giờ cộng vào nhau**: số SOS hiện tại · số case đang mở · số phương án.

---

## 2. Nhãn thay thế — bảng đối chiếu

Áp dụng ở **mọi biến thể trong code**: nhãn, tiêu đề, modal, trạng thái rỗng, lỗi, toast,
tooltip, aria-label. Không đổi một chỗ rồi coi là xong.

### Màn hồ sơ Test

| Hiện tại | Thay bằng |
|---|---|
| Kế hoạch MT *(khối chứa cả kết quả)* | `Thông tin đợt Mock Test` |
| Tuần hoàn tất | `Tuần dự kiến hoàn tất` |
| Target lúc đánh giá | `Mục tiêu tại thời điểm đánh giá` |
| Chưa xác nhận đã thi | `Chờ nhập điểm` — **và bỏ hẳn vai trò cổng chặn chấm** |
| Bỏ khỏi phạm vi | `Kỹ năng không kiểm tra trong đợt này` |
| Hủy lượt MT *(nút đỏ đầu trang)* | Chuyển vào menu ngoại lệ theo quyền, ghi rõ hủy phần nào |

### Khối case và phương án

| Hiện tại | Thay bằng |
|---|---|
| Chưa có gì diễn ra | `Chưa có phương án hỗ trợ` |
| Ghi lại phương án đầu tiên để lần sau còn biết đã thử gì cho em | `Thêm phương án hỗ trợ và người phụ trách` |
| Chưa có phương án hỗ trợ nào — chưa ai bắt tay vào việc | `Chưa có phương án hỗ trợ` |
| Chưa làm gì cho em thì chưa có gì để kết luận | `Cần cập nhật kết quả phương án trước khi hoàn thành case` |
| Đã làm gì *(form nhập bù)* | `Phương án đã áp dụng` |
| Người làm | `Người thực hiện` |
| + thêm dòng | `+ Thêm phương án` |
| Lịch sử và kết thúc phương án | *(bỏ nút, mở tại dòng)* |
| Mở trang riêng | *(bỏ nút, GIỮ route `/hoc-thuat/case/:id`)* |

### Danh sách lớp, học viên, nhập liệu

| Hiện tại | Thay bằng |
|---|---|
| Lớp là gốc… *(dòng hướng dẫn dưới tiêu đề)* | *(bỏ)* |
| badge chỉ xuất hiện… *(chân trang)* | *(bỏ — số bấm được thì hình thức phải cho thấy)* |
| Em nào vào muộn thì ghi đè… | `Có thể chọn tuần bắt đầu riêng cho từng học viên.` |
| Cả lô này vào một lớp… | *(bỏ nếu lớp đích đã rõ trên header)* |
| Bỏ qua 1 dòng lỗi | *(bỏ nút — thay bằng `Xem {n} dòng cần sửa`)* |
| Thêm 0 học viên | Nút `Thêm học viên`, trạng thái disabled |
| Việc của tôi / Cả phạm vi quản lý | Dropdown `Người phụ trách`: Tôi · Tất cả trong phạm vi · Chọn giáo viên |
| Hai mốc kiểm tra đếm từ đây *(lớp FT)* | FT: `Lịch Mock Test được xếp riêng cho từng học viên` · Normal: `Các mốc kiểm tra được tính từ tuần khai giảng` |
| Tiến độ lớp *(menu)* | `Lộ trình` |

### Badge đếm — phải nói đang đếm của ai

| Ngữ cảnh | Chữ |
|---|---|
| Phần GV cần tự làm | `Bạn cần chấm: {n} bài` |
| Toàn lớp | `Lớp còn {n} bài chưa nhập điểm` |
| Thiếu mục tiêu khi nhập HV | `Thiếu mục tiêu: {n} học viên` |

Không vừa ghi toàn lớp vừa dẫn tới việc riêng (RB 17.4, design plan 22.7).

---

## 3. Mẫu câu trạng thái

| Tình huống | Câu |
|---|---|
| Ô điểm gợi ý | `Nhập - nếu học viên không làm bài` |
| Sau khi lưu dấu '-' | `Không có bài · Có thể sửa đến hết Chủ nhật {ngày}` |
| Sau khi chốt cuối tuần | `Không dự thi · Tuần {mã tuần}` |
| Chưa đến lịch | `Chưa đến lịch kiểm tra` |
| Đến lịch, chưa có điểm | `Chờ nhập điểm` |
| Đang chờ QL | `Chờ quản lý duyệt` |
| Tìm người chưa đủ ký tự | `Nhập ít nhất 3 ký tự để tìm giáo viên` |
| Tìm người không ra kết quả | `Không tìm thấy giáo viên phù hợp` |
| Tooltip tuần hoàn tất | `Tuần dự kiến hoàn tất là tuần kiểm tra muộn nhất của các kỹ năng trong đợt.` |
| Báo cáo đơn vị chưa nộp | `Chưa báo cáo` — **không phải** `Ổn` |
| Nháp báo cáo | `Nháp · chưa nộp` |

---

## 4. Nguyên tắc viết

- Ngắn, có đối tượng, có động từ: `Cập nhật kết quả`, `Chọn tuần thi`, `Chờ quản lý duyệt`.
- Không đại từ mơ hồ: "em này", "lượt đó", "máy", "đường này", "chốt chung".
- Không giải thích mô hình dữ liệu trên màn đọc. Đưa vào tooltip `Cách tính` hoặc hộp `Cách đọc`.
- Không viết hoa cả dòng dài. Không dùng dấu gạch không giải thích trong trường cần trạng thái.
- **Không viết lại ghi chú thật do giáo viên nhập.** Biên tập chỉ chạm chuỗi của hệ thống.
- Câu có số liệu động phải lấy dữ liệu hiện hành; mô tả tại thời điểm phát sinh phải có nhãn
  lịch sử (`lúc mở: 2/4 kỹ năng`).

---

## 5. Cách áp dụng

1. Gom chuỗi hệ thống về `shared/domain/*` theo đúng tám module, hoặc một `web/src/ui/chu.ts`
   nếu chỉ là nhãn trình bày. Không hard-code tiếng Việt rải rác trong JSX.
2. Trước khi đổi một chuỗi, `grep` toàn repo tìm **mọi biến thể** — kể cả trong test, seed và
   thông báo máy chủ.
3. Nghiệm thu bằng cách mở từng màn ở ba vai, không bằng một lần tìm–thay.

---

## 6. Ý thức — từ vựng mới, chốt 21/09/2026

Mô hình Case Ý thức bị bỏ. Nguồn: `NGUON-Rule-Y-thuc-2026-09-21.md`; đặc tả:
`Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. **Vi phạm bảng này là lỗi nghiệp vụ, không phải lỗi biên tập.**

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

### 6.1. Năm nhóm vi phạm — đúng năm chữ này

`Chuyên cần` · `BTVN` · `Thái độ / hành vi` · `Kỷ luật lớp học` · `Khác`

Bỏ `Tham gia trên lớp` (Y04). Dữ liệu cũ đổi sang `Thái độ / hành vi`.

### 6.2. Chín biện pháp — đúng chín chữ này, xếp nhẹ đến nặng

1. `GV trao đổi ngắn với HS`
2. `GV meeting với HS`
3. `Report cho gia đình`
4. `Thư cảnh cáo lần 1`
5. `CX / GĐCN meeting với HS / PH`
6. `Thư cảnh cáo lần 2`
7. `Đình chỉ học`
8. `Thư cảnh cáo lần 3`
9. `Khác` — kèm ô tên biện pháp tự đặt

Thứ tự này là thứ tự **BÀY RA**, không phải quy trình bắt buộc. Trên màn có chữ `nhẹ ─ nặng`
ở hai đầu danh sách để người đọc biết mức tương đối.

### 6.3. Mẫu câu trạng thái của Ý thức

| Tình huống | Câu |
|---|---|
| Cảnh báo quá 5 ngày | `⚠ {n} vi phạm chưa được xử lý — vi phạm cũ nhất: {k} ngày trước` |
| Cảnh báo ở đầu tab lớp | `⚠ {n} học viên có vi phạm chưa xử lý quá 5 ngày` |
| Tuổi một vi phạm chưa xử lý | `⚠{k}n` đặt cuối dòng, không cần chữ "ngày" |
| Tuổi một biện pháp đang chuẩn bị | `tạo {ngày} · {k} ngày` |
| Thư cảnh cáo bị khoá | `chưa gửi Thư cảnh cáo lần {k-1}` — ghi ngay tại dòng bị khoá |
| Thiếu tệp khi xác nhận | `Cần đính kèm tệp hoặc liên kết thư cảnh cáo` |
| Chọn vi phạm của hai em | `Đã chọn {a} của {tên A} và {b} của {tên B} — một biện pháp chỉ xử lý một học viên` |
| Cảnh báo trùng trong form | `Ngày {d} em này đã có {n} vi phạm nhóm {nhóm} do {GV} ghi.` |
| Chưa đủ ký tự tìm người | `Nhập ít nhất 3 ký tự để tìm giáo viên` |
| Vi phạm hết hiệu lực trong lịch sử | `{người} đánh dấu {ngày}: "{lý do}"` — dòng phụ dưới vi phạm bị gạch ngang |
| Biện pháp có vi phạm bị hủy sau đó | `{k} trong {n} vi phạm của biện pháp này sau đó được xác định là không chính xác.` |
| Lưu vi phạm xong | `Đã ghi vi phạm cho {tên}` + link `Hoàn tác` |
| Xác nhận biện pháp xong | `Đã lưu. {tên}: {n} vi phạm chuyển sang Đã xử lý.` |
| Trạng thái rỗng, khu vi phạm chưa xử lý | `Không còn vi phạm nào chưa xử lý.` |
| Trạng thái rỗng, khu biện pháp đang chuẩn bị | `Chưa có biện pháp nào đang chuẩn bị.` |
| Trạng thái rỗng, lịch sử | `Lớp này chưa có biện pháp xử lý nào.` |

### 6.4. Mức case học thuật — đổi chữ

| Hiện tại | Thay bằng |
|---|---|
| `Cần chú ý` *(mức thấp của case, hạn 5 ngày)* | `Bình thường` |
| `Gấp` *(hạn 3 ngày)* | giữ nguyên |

Lý do: nguồn 21/09 gọi là "Case Bình thường"; và `Cần chú ý` không cho thấy nó là mức **thấp
hơn** `Gấp`. Câu "bỏ Bình thường" ở rule book mục 4.2 hết hiệu lực.


---

## 7. Bản v3 — tối 21/09/2026

| Hiện tại / cũ | Thay bằng |
|---|---|
| Tab `Ý thức` | `Ý thức & Phối hợp` · sub-tab `Vi phạm & xử lý` · `Phối hợp SOS` |
| `Không còn hiệu lực` · `Đánh dấu không chính xác` | **Bỏ.** Chỉ còn `Sửa` · `Xoá` |
| Toggle chế độ xem | `Theo học sinh` · `Theo thời gian` |
| Xác nhận xoá | `Xoá vi phạm này? Nó sẽ bị gỡ khỏi {n} biện pháp.` |
| Case từ SOS chờ | `Chờ GVBM xác định nguyên nhân · hạn {ngày}` |
| Phương án điền sẵn | `Gợi ý tự động · chờ xác nhận` |
| Đóng case từ SOS | `Không cần theo dõi` · lý do: `Học sinh có lý do đặc biệt` · `Tình huống đơn lẻ` · `Khác` |
| Sáu việc phối hợp | `Trao đổi ngắn với HS` · `Trao đổi với gia đình` · `GVCN meeting với HS` · `CX / GĐCN meeting với HS` · `CX / GĐCN meeting với HS / PH` · `Khác` |
| Trạng thái việc phối hợp | `Cần xử lý` · `Đã xong` · `Đã bỏ · {lý do}` |
| Lý do bỏ việc | `Không cần trong trường hợp này` · `Đã xử lý theo cách khác` · `Trùng với Biện pháp khác` · `Khác` · *(hệ thống)* `Không còn phù hợp do sửa điểm` |
| Tiến độ một lượt | `{a}/{b} hoàn thành` |
| Mức case `Cần chú ý` | `Bình thường` |

**Không** dùng `Report cho gia đình` cho Phối hợp SOS — chữ đó chỉ thuộc biện pháp xử lý vi phạm.
