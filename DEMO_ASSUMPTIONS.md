# Những điều đã chốt, và những điều còn treo

Chỉ ghi thứ **thực sự thay đổi cách phần mềm chạy**. Lịch sử tranh luận nằm ở mục 9 của
`PISA_Design_Master_Reference.md`.

---

## 1. Cách chấm và kết luận

| | |
|---|---|
| **Writing** | Bốn tiêu chí cho cả W và S. W1 và W2 là **hai ô nhập điểm riêng**; band Writing = `(W1 + W2×2) / 3`, làm tròn 0.5 |
| **Kỳ vọng của một lượt** | `mục tiêu − 1.0` ở MT1, `− 0.5` ở MT2, `− 0` từ MT3 |
| **Mức SOS** | Số **kỹ năng có band** dưới kỳ vọng: 1 → SOS 1, 2 → SOS 2, từ 3 → SOS 3. Đếm trên **bốn** kỹ năng (Writing gộp) |
| **Thiếu điểm ≠ trượt** | Kết luận ngay trên phần điểm đang có; ô chưa chấm **không** bị đếm là dưới kỳ vọng. Giao diện ghi rõ *"mới có 2/4 kỹ năng"* |
| **Kỹ năng không mock** | Quản lý/Admin CN đánh dấu cho từng lượt; kỹ năng đó rời khỏi mẫu số, và lượt **không còn Overall** |
| **Lớp thường** | Chấm `số câu đúng / tổng`, đạt từ **60%** tính trên tỷ lệ thật (25/42 hiện "60%" nhưng vẫn trượt). Không band, không kỳ vọng, không Overall |

## 2. Tuần và hạn

| | |
|---|---|
| **Tuần** | Thứ Hai → Chủ nhật. Thuộc **tháng chứa thứ Năm** của tuần đó |
| **Tuần của một lượt** | Tuần **kế hoạch** Quản lý chốt. Speaking lệch ngày vẫn là cùng lượt, cùng tuần |
| **Hạn nhập điểm** | Lớp FT: **thứ Tư tuần kế tiếp**. Lớp thường: **hết Chủ nhật chính tuần đó**. Chưa có tuần thì **không có hạn** |
| **Hạn xử lý một vấn đề** | Suy từ mức gấp: **7 · 5 · 3 ngày** (bình thường · cần chú ý · gấp). Dùng chung cho cả hạn Quản lý trả lời đề xuất |
| **Hạn hai việc trao đổi** | **Hết Chủ nhật của tuần kế tiếp tuần làm bài**, không co giãn theo ngày chấm |
| **Báo cáo tuần** | Sửa tới hết thứ Tư tuần kế tiếp rồi khoá; chỉ Quản trị hệ thống mở lại được, có dấu vết |

## 3. Theo dõi học viên

| | |
|---|---|
| **Một vấn đề** | = **một lượt × một kỹ năng**. Một kỹ năng có nhiều vấn đề khác nhau theo thời gian, nên mỗi cái một vòng đời: xong phương án thì đóng, lượt sau trượt lại thì mở cái mới |
| **"Mạch" theo kỹ năng** | **Không phải một bảng** — là cách gom khi hiển thị (cùng em, cùng lộ trình, cùng kỹ năng, xếp theo lượt). Vẫn đọc được *"Listening trượt lần thứ ba"* |
| **Hai đầu mục** | **Học thuật** (năm ô L · R · W1 · W2 · S) và **Ý thức** (Chuyên cần · BTVN · Tham gia trên lớp · Khác). Không hơn |
| **W1 hay W2** | So **riêng từng task** với cùng kỳ vọng. Hệ quả: một em band Writing **đạt** vẫn có thể có vấn đề ở W1 — band gộp đang che một lỗ hổng thật. Và số vấn đề ≠ mức SOS: SOS đếm **học viên** trên 4 kỹ năng, vấn đề đếm **việc** trên 5 ô |
| **Giáo viên / Giáo trình** | **Không** nằm trong hệ thống theo dõi học viên — đó không phải vấn đề của em. Chúng thuộc **Báo cáo tuần chi nhánh**, nơi đã có sẵn đúng ba nhóm |
| **Hoàn cảnh kèm theo** | Đã bỏ. Thay bằng một ô **Ghi chú** không bắt buộc |
| **Vấn đề GV báo** | `sos_level` để **trống** — SOS là số kỹ năng dưới kỳ vọng ở một bài, giáo viên không có bài nào để đếm. Mức gấp là thang riêng |

## 4. Khi có SOS, hệ thống tự sinh gì

| Sinh ra | Chi tiết |
|---|---|
| **Một vấn đề cho mỗi kỹ năng** dưới kỳ vọng | Kèm phương án tự sinh (xem dưới) |
| **Hai việc trao đổi**, đúng một bộ cho **cả lượt** | GVCN + GVBM gặp học sinh · CS gặp phụ huynh. **Không** phải phương án hỗ trợ: không duyệt, không hẹn xem lại, không kết quả chuyên môn — chỉ xác nhận đã diễn ra. Áp cho **cả lớp thường** |
| **Một phương án hỗ trợ** cho mỗi kỹ năng | SOS 1–2 → xếp tự học · SOS 3 → tutor · **từ MT3 luôn tutor** (gần ngày thi thì tự học không kịp). Sinh ở trạng thái *đã lên kế hoạch, chưa có người thực hiện, chưa gửi duyệt* — máy không đặt tutor thay người. **Lớp thường không** có phần này (không có mức SOS theo band) |

**SOS chỉ là chỉ báo**, không phải một hệ thống công việc song song. Mọi can thiệp — dù sinh
từ SOS hay giáo viên tự ghi — đều quy về cùng một chỗ theo kỹ năng.

## 5. Phương án, đề xuất và duyệt

**Hai họ việc, tách bạch:**

| Phương án hỗ trợ *(giáo viên tự làm)* | Đề xuất *(Quản lý luôn phải trả lời)* |
|---|---|
| Xếp tự học · Học tutor · Điều chỉnh cách dạy · Khác | Lùi lịch thi · Hỗ trợ học thuật ngoài định mức · Meeting CX/GĐCN · Khác |

Chọn một mục ở cột phải **tức là** đang xin ý kiến, nên ô tick *"cần Quản lý duyệt"* chỉ hiện
ở cột trái. Với cột trái, **chính giáo viên** quyết định có gửi duyệt hay không.

- Chỉ **đề xuất** (trạng thái *đã lên kế hoạch*) mới gửi duyệt được. Đang chờ thì **chưa cập
  nhật kết quả được** — việc thật chưa diễn ra.
- Quản lý: **duyệt** · **không duyệt** (bắt buộc ghi lý do) · **góp ý** (KHÔNG kết thúc việc chờ).
- Đã trả lời rồi thì **không sửa đè**. Đổi ý thì đề xuất lại, để hồ sơ giữ cả lý do lần trước.
- **Cập nhật kết quả** là việc của **người thực hiện**; quá hạn thì Quản lý cũng thấy.

## 6. Quyền

| | Quản trị HT | Admin CN | Quản lý | Giáo viên |
|---|:--:|:--:|:--:|:--:|
| Chốt **tuần** kế hoạch MT | ✓ | — | ✓ | — |
| Chốt **ngày** trong tuần | ✓ | ✓ | ✓ | GV Speaking đổi được ngày Speaking |
| Nhập điểm | nhập bù | — | — | ✓ đúng kỹ năng được phân công |
| Ghi nhận hỗ trợ | ✓ | ✓ | ✓ | ✓ trong phạm vi phụ trách |
| **Đề xuất phương án** *(màn việc)* | ✓ | — | ✓ | ✓ lớp mình dạy |
| Duyệt phương án | ✓ | — | ✓ | — |
| Kết thúc theo dõi | ✓ | — | ✓ | GVCN của chính lớp đó |
| Phân công giáo viên | ✓ | ✓ | ✓ | — |
| Tiến trình công việc | ✓ | — | ✓ | — |

Hai điểm dễ nhầm:

- **Admin chi nhánh không nhập bù điểm.** Người không dạy kỹ năng đó thì không có căn cứ nào
  để chấm; giáo viên vắng là chuyện đổi phân công, không phải chuyện văn phòng gõ điểm hộ.
- **Quyền ghi nhận ≠ trách nhiệm quyết định.** Admin CN vẫn ghi hộ được việc CS gọi phụ
  huynh, nhưng màn việc không giao cho họ *"đề xuất phương án hỗ trợ"*.

Phạm vi luôn là **quyền của vai trò × chi nhánh của chính grant đó × phân công lớp/kỹ năng**.
Chỉ grant có `branch_id` để trống mới là toàn hệ thống.

**Bỏ phân công không phải là xoá:** dòng cũ đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn
thấy đúng ai dạy lúc đó, và điểm đã nhập giữ nguyên tên người nhập.

---

## 7. Còn treo — cần bạn quyết khi có dịp

| Điểm | Đang làm tạm | Vì sao cần chốt |
|---|---|---|
| **Phạm vi hạn nhập điểm riêng** | Áp cho **cả lượt**, không tách từng kỹ năng. Đổi lịch thì **giữ** hạn riêng | Nguồn chỉ nói "được đặt deadline khác" |
| **Speaking ngoài tuần kế hoạch** | **Từ chối**; muốn xếp ngoài tuần thì Quản lý đổi tuần trước | Tránh âm thầm đổi tuần qua đường xếp ngày |
| **Dòng nhập hàng loạt ngoài phạm vi** | Bỏ qua dòng đó kèm lý do, **không** làm hỏng cả lô | Nếu muốn chặt hơn (sai một dòng huỷ cả lô) thì nói |
| **Lộ trình khi bảng nhập bỏ trống** | Kế thừa lộ trình của **lớp** | Sai nếu một lớp chứa học viên nhiều lộ trình khác nhau |
| **Lưu trữ học viên** | 14 ngày kể từ `finished_at`; chỉ ẩn khỏi danh sách, **không** đóng lịch/vấn đề còn dở | Mốc chính xác và quyền khôi phục |
| **Kỹ năng không mock ở mức task** | Bỏ Writing là bỏ **cả W1 và W2** | Nếu chỉ cần mock một task thì phải có quy tắc tính W riêng |
| **Admin CN và Tiến trình công việc** | Không cấp quyền | Nếu cần thì đề xuất một quyền hẹp, không mở lại quyền họp toàn phần |
