# Ba luồng chính để bạn bấm thử

Ngày demo mặc định: **23/09/2026** (thứ Tư, tuần `W4 SEP · 21/09 – 27/09`).
Chọn ngày này để thấy đủ ba mốc hạn cùng lúc: tuần `W2 SEP` đã quá hạn nhập điểm,
tuần `W3 SEP` **đúng hạn hôm nay** (chưa quá hạn), tuần `W4 SEP` và `W1 OCT` còn ở phía trước.

Đổi tài khoản bất cứ lúc nào bằng nút **Đổi tài khoản demo** ở thanh trên cùng.

---

## Luồng 1 — Giáo viên nhập điểm cả lớp

**Tài khoản:** `Trần Hải Đạt` (Giáo viên, Monbay — dạy **Listening + Reading** lớp `MB-FT 101`,
đồng thời là **GVCN** lớp `MB-FT 102`)

1. Đăng nhập xong bạn vào thẳng **Mock Test** với bộ lọc **"Điểm tôi cần nhập"**.
   Chỉ hiện đúng việc còn thiếu của bạn — bộ lọc này xét **xuyên tuần** nên việc tồn từ tuần trước
   không biến mất.
2. Chọn `Lớp = MB-FT 101` rồi bấm **Nhập điểm cả lớp**. Đổi ô **Tuần** sang `W2 SEP · 07/09 – 13/09`.
3. Trong bảng: cột **L** và **R** là ô nhập số câu đúng; **W1 / W2 / S** chỉ hiện band —
   bạn không được phân công nên không sửa được. Dòng phụ đề ghi rõ *"Bạn được nhập: L, R"*.
4. Gõ số câu đúng rồi bấm **Enter** — điểm được lưu ngay và con trỏ nhảy xuống ô cùng cột ở dòng dưới.
   Band hiện ngay bên cạnh.
5. Ô còn thiếu của tuần `W2 SEP` hiện **Quá hạn 16/09/2026** màu đỏ. Xoá trắng một ô đã nhập rồi
   lưu lại: điểm quay về **trống**, không thành 0.
6. Tải lại trang (F5) — điểm vừa nhập vẫn còn.

**Cần thấy:** chỉ sửa được kỹ năng được phân công · ô trống khác 0 · hạn bám ngày thi thực tế ·
lưu thật xuống database.

---

## Luồng 2 — Quản lý: từ Tổng quan tới xử lý SOS

**Tài khoản:** `Đặng Quang Vy` (Quản lý Monbay) hoặc `Đặng Quang Nhi` (Quản trị hệ thống)

1. Mở **Tổng quan**. Bốn cụm số:
   - *Lịch Mock W4 SEP* — số lượt có lịch, kèm dòng phụ tách **đã thi / học sinh duy nhất / đã huỷ**.
   - *Chưa nhập đủ điểm* — kèm số **đã quá hạn** (hai số khác nhau).
   - *Lượt SOS đã chốt* — tách theo mức 1 / 2 / 3.
   - *Case cần xử lý* — tính **đến hôm nay**, không theo tuần.
2. Đổi ô **Tuần** sang tuần khác: số của tuần đổi theo, còn **case và việc quá hạn giữ nguyên**.
3. Bấm một dòng trong **Việc cần làm trước** → mở thẳng chi tiết lần Mock đó.
4. Trong chi tiết Mock, đọc từ trên xuống: lịch và cam kết → điểm từng kỹ năng → bốn kỹ năng đánh giá
   + Overall + kết luận SOS → **checklist xử lý theo đúng MT × mức SOS**.
5. Ở khối **Xử lý sau Mock**: điền tên người trao đổi HS nhưng **để trống ngày** → trạng thái bước đó là
   *"Có tên, chưa có ngày"*, **chưa** tính là đã làm. Điền thêm ngày ở tương lai → *"Đã xếp lịch"*.
   Điền ngày đã qua → *"Đã thực hiện"*. Bấm **Lưu ghi nhận**.
6. Bấm **Xác nhận (Head)** — thao tác riêng, không tự suy ra từ trạng thái case.
   **Head chính là Quản lý**: đăng nhập bằng `Đặng Ngọc Phúc` (Admin chi nhánh) thì nút này không hiện,
   và gọi thẳng API cũng bị từ chối.
7. Mở **Lịch sử thay đổi** ở cuối trang để xem lịch sử dời lịch và lịch sử cập nhật xử lý.

**Cần thấy:** mỗi KPI mở đúng danh sách · đổi tuần không mất việc cũ · checklist đúng bảng nguồn ·
tên người không thay được cho ngày thực hiện.

Ví dụ hay để mở: các dòng `Case SOS` của lớp `CP-FT 110` (thi 22/09) và `MB-FT 101` (thi 10/09, đã quá hạn).

---

## Luồng 3 — Quản lý cập nhật Họp tuần và công việc tồn

**Tài khoản:** `Đặng Quang Vy` (Quản lý Monbay)

1. Mở **Họp tuần**. Quản lý Monbay chỉ thấy **Monbay** và **Tutor part-time** —
   Tutor là *đơn vị độc lập*, **không phải chi nhánh thứ sáu**.
2. Dòng tổng kết bên phải đếm theo danh mục thật: `Chưa báo cáo / Ổn / Cần theo dõi / Có vấn đề`
   **trên 6 mục** (2 đơn vị × 3 nhóm). Với Admin là **trên 18 mục** (5×3 + 3) — mẫu số tính lại, không hardcode.
3. Bấm vào tên đơn vị để mở ba ô nhập. Ô **chưa nhập hiện "Chưa báo cáo"**, không phải "Ổn".
   Đổi trạng thái, ghi chú ngắn rồi bấm **Lưu**.
4. Xuống khối **Công việc**, để bộ lọc ở *Chưa xong*:
   - `CV-0001`, `CV-0008` thuộc kỳ **W3 SEP** nhưng vẫn hiện khi đang xem W4 SEP — việc tồn **không biến mất**,
     giữ nguyên mã và lịch sử, **không** bị nhân bản sang tuần mới.
   - `CV-0005` không có hạn → **"Chưa có hạn"**, không bao giờ bị tính quá hạn.
   - Bấm *Đã xong* để thấy `CV-0004` hoàn thành **sau** hạn 15/09 nhưng **không** bị báo quá hạn.
   - `CV-0009` có nhãn **"Từ case SOS"** — việc sinh từ case, giữ liên kết về lần Mock gốc.
5. Bấm một dòng để mở, đổi **Tiến độ**, bấm **Lưu**. Đổi tuần rồi quay lại — thay đổi vẫn còn.
6. Bấm **Thêm việc** để tạo việc mới ngay tại chỗ, không cần đi qua "sự việc → issue → agenda".

**Cần thấy:** ô trống là chưa báo cáo · Tutor tách riêng · việc tồn xuyên kỳ · hạn tính đúng bốn trạng thái.

---

## Kiểm tra quyền (bấm nhanh)

| Thử | Tài khoản | Kỳ vọng |
|---|---|---|
| Chỉ sửa được kỹ năng được phân công | `Hoàng Khánh Huy` (W1 lớp MB-FT 101) | Chỉ ô **W1** mở được khung tiêu chí; W2 chỉ đọc |
| GVCN dời lịch nhưng không sửa mọi điểm | `Đinh Bảo Vy` (GVCN MB-FT 101, dạy Speaking MB-FT 102) | Có nút **Dời lịch**; ở MB-FT 101 chỉ đọc điểm, không sửa |
| Không thấy dữ liệu ngoài chi nhánh | `Đặng Quang Vy` (Quản lý MB) | Không thấy lớp `CP-FT 110`; gọi thẳng URL của Mock lớp CP bị **API từ chối**, không chỉ ẩn nút |
| Nhiều quản lý cùng chi nhánh | `Trần Quang Nam`, `Đinh Bảo Lam` (đều là Quản lý MB) | Cả ba quản lý MB đều thao tác được |
| Giáo viên không có Họp tuần | bất kỳ giáo viên nào | Menu chỉ còn **3 mục**, không có *Họp tuần* |
| Chỉ Quản lý xác nhận được Head | `Đặng Ngọc Phúc` (Admin chi nhánh MB) | **Không** thấy nút *Xác nhận (Head)*; các thao tác văn phòng khác (dời lịch, nhập bù điểm, sửa hồ sơ) vẫn làm được |
| Giáo viên không huỷ được lịch | `Đinh Bảo Vy` (GVCN MB-FT 101) | Có nút **Dời lịch**, **không** có nút *Huỷ lịch* |
| Quản trị hệ thống thấy phần quản trị | `Đặng Quang Nhi` | Menu tài khoản có mục **Quản trị hệ thống** |

---

## Tình huống đã cài sẵn trong dữ liệu mẫu

| Tình huống | Ở đâu |
|---|---|
| **Thi lệch tuần** — Speaking thi trước 1 tuần, 4 kỹ năng còn lại tuần sau, mỗi kỹ năng một hạn riêng | `Đinh Thu Đạt`, lớp `MB-FT 101`, MT2 (nhãn *Thi lệch ngày* trong bảng nhập điểm) |
| **Quá hạn nhập điểm** | Các lượt MT2 tuần `W2 SEP` còn thiếu kỹ năng (`MB-FT 101`, `BC-FT 205`) |
| **Đúng hạn hôm nay, chưa quá hạn** | Các lượt MT2 tuần `W3 SEP` (`MB-FT 102`, `CP-FT 111`) |
| **Đã huỷ lịch** | Một học sinh lớp `HD-FT 302` — không tính vào "đã thi" hay "thiếu điểm" |
| **Đã dời lịch** | Một học sinh lớp `CP-FT 110` — xem *Lịch sử thay đổi* trong chi tiết Mock |
| **Chuyển lớp** | `Hồ Gia Hà` (`/hoc-vien/3`) — MT1/MT2 giữ lớp cũ `MB-FT 101`, MT3 chuyển sang `MB-FT 102` |
| **Tạm dừng rồi quay lại học** | Một học sinh lớp `BC-FT 205` — cả hai sự kiện nằm trong bộ lọc *Tất cả* |
| **Warning / WL và ước lượng giáo viên** | Một học sinh lớp `UB-FT 401` — thử bộ lọc *Warning / WL* và *Assessment* |
| **Case SOS ở đủ bốn mức tiến độ** | Chưa ghi nhận · Có tên chưa có ngày · Đang xử lý · Đã xong + Head xác nhận |
| **MT3 có hỗ trợ vận hành** | Lớp `UB-FT 401` MT3 mức SOS 2/3 |
| **Lớp không thuộc FT** | `MB-FOUND 12`, `BC-BE 80`, `HD-ELE 01` — không có điểm cam kết nên không có kỳ vọng và SOS |

---

## Kiểm tra tự động

```bash
npm test
```

Chạy **40 kiểm tra** trên một database riêng (`data/test.sqlite`), phủ 10 nhóm kịch bản nghiệm thu:
quy đổi điểm · kỳ vọng và mức SOS · thiếu điểm và tiêu chí S/W · tuần và hạn nhập ·
lập/dời/huỷ lịch · quyền theo vai trò × chi nhánh × phân công · nhập điểm và hành động SOS ·
họp tuần và công việc · tổng quan tuần · hồ sơ học viên và lưu dữ liệu.
