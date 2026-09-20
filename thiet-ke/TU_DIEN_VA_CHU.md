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
| Một đợt xử lý BTVN/chuyên cần/tham gia | `Case Ý thức` | "case học thuật", "SOS ý thức" |
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
