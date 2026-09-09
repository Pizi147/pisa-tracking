# Các luồng để bạn bấm thử

> Vòng overhaul **A — nền tảng**. Trọng tâm lần này: tách **tuần kế hoạch** với **ngày giờ**,
> đánh dấu **kỹ năng không mock**, **lộ trình** và số lần MT, **ước lượng giáo viên**, hệ màu mới,
> và bỏ chữ "thi" cho Mock.

Ngày demo mặc định: **23/09/2026** (thứ Tư, tuần `W4 SEP · 21/09 – 27/09`).
Đổi tài khoản bất cứ lúc nào bằng nút **Đổi tài khoản demo** ở thanh trên cùng.

Mỗi vai trò mở vào đúng việc của mình: Giáo viên → *Điểm tôi cần nhập*;
Admin chi nhánh → *Cần xếp lịch*; Quản lý và Quản trị hệ thống → *Tổng quan*.

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

## Luồng 4 — Tuần kế hoạch và ngày giờ là hai việc khác nhau

**Tài khoản:** `Đặng Quang Vy` (Quản lý Monbay) và `Đặng Ngọc Phúc` (Admin chi nhánh Monbay)

1. Đăng nhập `Đặng Ngọc Phúc` — vào thẳng **Cần xếp lịch**: các lượt đã có tuần nhưng chưa có ngày.
2. Mở một dòng. Khối *Kế hoạch và lịch* cho thấy đã có **Tuần kế hoạch** còn **Buổi chính** ghi
   *Chưa chốt ngày*. Admin chi nhánh thấy nút **Chốt ngày giờ** nhưng **không** thấy **Đổi tuần**.
3. Bấm **Chốt ngày giờ**, nhập một ngày **ngoài tuần** đó → hệ thống từ chối và nói rõ phải để Quản lý
   đổi tuần trước. Nhập ngày trong tuần → lưu được.
4. Nhập thêm **Buổi Speaking** ở ngày khác. Vẫn là **cùng một lượt MT**, không tách thành lượt mới.
5. Đổi sang `Đặng Quang Vy` (Quản lý), mở đúng lượt đó: thấy **Đổi tuần** nhưng **không** thấy
   **Chốt ngày giờ**. Đổi sang một tuần khác → ngày cũ nằm ngoài tuần mới nên **bị bỏ để xếp lại**,
   hệ thống không tự dịch bảy ngày.
6. Đổi sang một tài khoản giáo viên và mở cùng lượt: **không có nút lịch nào**, kể cả GVCN.
   Giáo viên Speaking của lớp thì đổi được **riêng** lịch Speaking.

**Cần thấy:** tuần chốt sớm không cần ngày · ngày ngoài tuần bị chặn · Speaking khác ngày vẫn cùng lượt ·
GVCN chỉ đọc lịch.

---

## Luồng 5 — Học viên không mock một kỹ năng

**Tài khoản:** `Đặng Quang Vy` (Quản lý Monbay)

1. Mở một lượt đã xong đủ bốn kỹ năng. Ghi lại **Overall** và mức **SOS** hiện tại.
2. Ở khối bốn kỹ năng đánh giá, bấm **Đánh dấu không mock** dưới Speaking.
3. Kết quả: Speaking chuyển sang *Không mock*, mức SOS **tính lại trên ba kỹ năng còn lại**,
   và **Overall biến mất** vì lượt này không còn là bài bốn kỹ năng. **Band cũ của Speaking vẫn hiện**
   để tra lại — đánh dấu không mock không xoá điểm.
4. Dòng ghi chú nói rõ *Đánh giá trên 3 kỹ năng*. Ô Speaking không còn bị tính thiếu điểm hay quá hạn.
5. Thử nhập điểm cho Speaking → bị từ chối vì kỹ năng đã đánh dấu không mock.
6. Bấm **Tính lại kỹ năng này** để hoàn tác; mọi thứ trở lại như cũ và lịch sử ghi cả hai lần thay đổi.

**Cần thấy:** không đánh dấu thì hệ thống **chờ đủ bốn**, chỉ khi có đánh dấu mới rút gọn mẫu số.

---

## Luồng 6 — Lộ trình, số lần MT và ước lượng giáo viên

**Tài khoản:** `Đặng Quang Vy`, mở `/hoc-vien/4`

1. Bảng **Các lần Mock Test** có cột **Lộ trình**: LT1 có MT1–MT3, rồi LT2 **bắt đầu lại từ MT1**
   vì đã có target mới. Kỳ vọng LT2 MT1 = target mới − 1.0.
2. Xem một học viên ở lớp `UB-FT 401` để thấy trường hợp ngược lại: **học tiếp trong cùng lộ trình**
   thì MT **tăng tiếp** (MT5) và target giữ nguyên, nên kỳ vọng bằng đúng target.
3. Khối **Ước lượng giáo viên so với điểm Mock**: mỗi kỹ năng có ước lượng, **ngày ước lượng và người
   đánh giá**, điểm Mock kèm **nguồn** (`LT1 · MT2 · 10/09/2026`) và chênh lệch.
4. Hành trình ghi cả `Bắt đầu lộ trình LT1`, `Bắt đầu lộ trình LT2` kèm target, các lần lên kế hoạch
   và đổi tuần.

**Cần thấy:** hai cột so sánh luôn có ngày và nguồn riêng; không có Overall ghép từ nhiều lượt.

---

## Kiểm tra quyền (bấm nhanh)

| Thử | Tài khoản | Kỳ vọng |
|---|---|---|
| Chỉ sửa được kỹ năng được phân công | `Hoàng Khánh Huy` (W1 lớp MB-FT 101) | Chỉ ô **W1** mở được khung tiêu chí; W2 chỉ đọc |
| GVCN **không** có quyền lịch | `Đinh Bảo Vy` (GVCN MB-FT 101) | Không có nút **Đổi tuần** lẫn **Chốt ngày giờ**; gọi thẳng API cũng bị từ chối |
| Quản lý chốt tuần nhưng không chốt ngày | `Đặng Quang Vy` | Có **Đổi tuần**, không có **Chốt ngày giờ** |
| Admin CN chốt ngày nhưng không chốt tuần | `Đặng Ngọc Phúc` | Có **Chốt ngày giờ**, không có **Đổi tuần** |
| Admin CN **không** vào Tiến trình công việc | `Đặng Ngọc Phúc` | Menu chỉ còn 3 mục, không có *Họp tuần*; gọi API báo cáo bị từ chối |
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
| **Đã chốt tuần, chưa có ngày** | Nhiều lượt — mở lối tắt *Cần xếp lịch* của Admin chi nhánh |
| **Speaking mock khác ngày với buổi chính** | Lớp `MB-FT 101` MT2 — vẫn là một lượt MT, mỗi kỹ năng một hạn |
| **Kỹ năng không mock** | Một số lượt MT2 — SOS tính trên ba kỹ năng, không có Overall |
| **Đã mock nhưng chưa nhập điểm** | Khác hẳn *chưa mock*: cột **Tiến độ** trong chi tiết phân biệt rõ |
| **Hạn nhập điểm riêng** | Một lượt ở `MB-FT 101` — Admin chi nhánh gia hạn tới 30/09 kèm lý do |
| **Quá hạn nhập điểm** | Các lượt tuần `W2 SEP` còn thiếu kỹ năng |
| **Đúng hạn hôm nay, chưa quá hạn** | Các lượt tuần `W3 SEP` |
| **Đã huỷ lượt** | Một học viên `HD-FT 302` — không tính vào "đã xong" hay "thiếu điểm" |
| **Đổi tuần kế hoạch** | Một học viên `CP-FT 110` — xem *Lịch sử thay đổi* trong chi tiết |
| **Sang lộ trình mới, MT đánh lại từ 1** | `/hoc-vien/4` — LT1 có MT1–MT3, LT2 bắt đầu lại MT1 với target cao hơn |
| **Học tiếp cùng lộ trình, MT tăng tiếp** | Một học viên `UB-FT 401` — MT5, target giữ nguyên |
| **Ước lượng giáo viên** | Hầu hết học viên FT, tách theo W1/W2 và có ngày đánh giá |
| **Chuyển lớp** | `/hoc-vien/3` — lượt đã xong giữ lớp cũ, lượt chưa xong sang lớp mới |
| **Tạm dừng rồi quay lại học** | Một học viên `BC-FT 205` |
| **Kết thúc học và lưu trữ** | Hai học viên `BC-FT 205`: một em vừa xong (còn hiện, làm dịu màu), một em đã quá hai tuần |
| **Warning / WL** | Một học viên `UB-FT 401` — thử bộ lọc *Warning / WL* |
| **Case SOS ở đủ bốn mức tiến độ** | Chưa ghi nhận · Có tên chưa có ngày · Đang xử lý · Đã xong |
| **Lớp không thuộc FT** | `MB-FOUND 12`, `BC-BE 80`, `HD-ELE 01` — chưa có lộ trình nên chưa có MT (vòng C) |

---

## Kiểm tra tự động

```bash
npm test
```

Chạy **51 kiểm tra** trên một database riêng (`data/test.sqlite`), phủ 10 nhóm:
quy đổi điểm và công thức · kỳ vọng theo lộ trình · kỹ năng không mock và tiến độ ·
tuần/lịch/hạn nhập · quyền lịch tách tuần với ngày · quyền theo vai trò × chi nhánh × phân công ·
lộ trình và số lần MT · ước lượng giáo viên · tổng quan và hai nhóm case SOS ·
xử lý sau Mock và lưu dữ liệu.

### Nâng cấp dữ liệu đang có

```bash
npm run migrate
```

Chuyển database cũ sang mô hình mới mà **không xoá gì**: giữ nguyên mã học viên, enrollment, từng lượt MT,
điểm W1/W2 và lịch sử SOS. Những thứ không suy ra được (kỹ năng không mock, ước lượng giáo viên,
lịch Speaking riêng) được để trống chứ không bịa. Chạy lại lần hai thì không làm gì thêm.
