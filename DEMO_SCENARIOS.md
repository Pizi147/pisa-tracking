# Các luồng để bạn bấm thử

> Vòng **D — hồ sơ học viên và vấn đề học vụ**. Trọng tâm lần này: **hai nguồn vấn đề, một vòng đời**;
> **ghi nhận nhanh** (nhận xét bằng lời là đủ); **hồ sơ học viên** dựng quanh một lộ trình với hành trình
> gom thành chương; tab **Tình hình chung** cho Quản lý.
>
> Muốn xem nhanh phần mới nhất thì bắt đầu từ **Luồng 15 → 19**.

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
   + Overall + kết luận SOS → **Vấn đề học vụ** → **Quy trình gợi ý** cho mức đó.
5. Khối **Vấn đề học vụ** dùng đúng khung của hồ sơ học viên và tab Tình hình chung: *vì sao đang theo dõi →
   đã làm gì → quan sát được gì → bước tiếp theo*. Bấm **+ Ghi một việc đã làm**, chọn *Đã xong* mà
   **để trống ngày** → bị chặn: ghi "đã xong" phải có ngày thật.
6. Tick **"Người khác làm, tôi nhập hộ"** rồi gõ `CS Ngọc Diệp` → bản ghi giữ tên CS làm người thực hiện
   và ghi rõ bạn là người nhập. Bỏ tick → người thực hiện là chính bạn, và đó là **lời khai tường minh**,
   không phải hệ thống tự đoán.
7. **Quy trình gợi ý** nằm riêng bên dưới, **chỉ đọc**. Nó nhắc nên làm gì, không phải việc đã làm.
8. Mở **Lịch sử thay đổi** ở cuối trang để xem lịch sử dời lịch và lịch sử đổi mức.

**Cần thấy:** mỗi KPI mở đúng danh sách · đổi tuần không mất việc cũ · gợi ý tách khỏi việc đã làm ·
"đã xong" phải có ngày · người nhập không mặc định là người làm.
**Không còn** bước "Xác nhận (Head)": xem `DEMO_ASSUMPTIONS.md` mục Q7.

Ví dụ hay để mở: các dòng `Case SOS` của lớp `CP-FT 110` (thi 22/09) và `MB-FT 101` (thi 10/09, đã quá hạn).

---

## Luồng 3 — Quản lý cập nhật Tiến trình công việc và việc tồn

**Tài khoản:** `Đặng Quang Vy` (Quản lý Monbay)

1. Mở **Tiến trình công việc**. Quản lý Monbay chỉ thấy **Monbay** và **Tutor part-time** —
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

## Luồng 6 — Hai lộ trình, hai mục tiêu, không trộn dữ liệu

**Tài khoản:** `Đặng Quang Vy`, mở `/hoc-vien/4` (Hoàng Thu Ninh — **LT1 target 6.5**, **LT2 target 7.0**)

1. Đầu trang có **bộ chọn lộ trình**. Đang ở LT2; bấm sang **LT1** — **cả trang đổi theo**: mục tiêu,
   các lần đánh giá, đường đi từng kỹ năng, vấn đề, hành trình.
2. Lựa chọn nằm trên **đường dẫn** (`?lo-trinh=…`), nên bấm Back quay đúng lộ trình vừa xem, và gửi
   đường dẫn cho người khác thì họ mở ra đúng màn hình đó.
3. LT1 có MT1–MT3; LT2 **bắt đầu lại từ MT1** vì đã có mục tiêu mới. Kỳ vọng LT2 MT1 = 7.0 − 1.0 = **6.0**.
4. Xem một học viên ở lớp `UB-FT 401` để thấy trường hợp ngược lại: **học tiếp trong cùng lộ trình**
   thì MT **tăng tiếp** (MT5) và mục tiêu giữ nguyên, nên kỳ vọng bằng đúng mục tiêu.
5. **Đường đi từng kỹ năng** chỉ nối các mốc **trong cùng một lộ trình** — không nối xuyên qua lộ trình
   khác, vì hai bên có mục tiêu khác nhau.

**Cần thấy:** đổi lộ trình đổi cả trang · không lượt nào xuất hiện ở cả hai lộ trình · Back giữ đúng chỗ.

---

## Luồng 7 — Lớp là gốc: từ danh sách lớp tới nhập điểm

**Vai:** `Hoàng Khánh Huy` (giáo viên W1, lớp MB-FT 101) hoặc `Đặng Ngọc Phúc` (Admin chi nhánh MB).

1. Mở **Học viên**. Màn hình mở ra là **danh sách lớp**, không phải danh sách 400 học viên.
   Mỗi dòng lớp có badge — và **chỉ có badge khi thật sự có việc cần làm**.
2. Bấm **nền dòng** một lớp → danh sách học viên mở ra ngay tại chỗ. Mỗi em hiện chuỗi
   `MT1 ✓ · MT2 ✓ · MT3 W4 OCT`, kết quả gần nhất và ghi nhận của giáo viên.
   Đây chính là phần *tiến độ / mock test* trước đây tách riêng.
3. Bấm **nền dòng lớp thứ hai** → lớp thứ nhất **vẫn mở**. Hai lớp đặt cạnh nhau mà so.
4. Bấm **badge** `N cần nhập điểm` → chuyển sang hàng đợi đã lọc sẵn theo lớp đó.
   Roster **không** bị đóng mở theo — badge và nền dòng là hai vùng bấm khác nhau.
5. Bấm **tên lớp** → mở Class Overview (trang riêng của lớp), cũng không kích hoạt đóng mở.
6. Gõ tên một học viên vào ô **Tìm** → trả về đúng **lớp chứa em đó**.
7. Mở hồ sơ một em rồi bấm **Back** → ô tìm kiếm, bộ lọc và **các lớp đang mở** còn nguyên.

**Bằng bàn phím:** Tab tới dòng lớp, **Enter** mở, **Space** đóng. Dòng lớp có `aria-expanded`
để trình đọc màn hình đọc đúng trạng thái.

---

## Luồng 8 — Thêm học viên hàng loạt từ Excel

**Vai:** `Đặng Ngọc Phúc` (Admin chi nhánh Monbay).

1. **Học viên** → **Thêm học viên**. Dán thẳng vùng bảng từ Excel/Google Sheets vào ô dán,
   hoặc gõ thẳng vào lưới.
2. Chọn **định dạng ngày** đúng với dữ liệu. `12/05/2008` là mơ hồ — hệ thống **không đoán**.
3. Xem trước **tự chạy**, không phải bấm nút nào: dòng thiếu họ tên, lớp không tồn tại, ngày
   không đọc được đều hiện lỗi ngay tại ô.
4. Nút ghi rõ **Thêm 1 học viên** chứ không phải 3 — nó đếm đúng số dòng sẽ được ghi.
   Nút bị khoá khi còn dòng lỗi; bấm **Bỏ qua N dòng lỗi** là gỡ xong trong một lần.
5. Bấm Thêm → báo *"Đã thêm 1 học viên, bỏ qua 2 dòng"*. Mở lại lớp thấy em vừa thêm;
   hai dòng hỏng **không** để lại rác trong dữ liệu.
6. Bấm Thêm lần nữa với đúng lô đó → **không** tạo thêm học viên trùng.

**Thử thêm:** dòng bỏ trống cột **Lộ trình** vẫn được tạo lộ trình **kế thừa từ lớp**
(vào lớp LT1 thì đang học LT1), chỉ cảnh báo *"Chưa có target — nhập được nhưng chưa tính
được kỳ vọng"*. Hệ thống không tự đoán target.

---

## Luồng 9 — Admin CN: cập nhật ngày MT hàng loạt

**Vai:** `Đặng Ngọc Phúc` (Admin chi nhánh Monbay). Ngày demo **23/09/2026** = W4 SEP.

1. **Học viên → Cần cập nhật ngày MT**. Chỉ hiện MT **đã đến tuần**: nhóm *Tuần này* (W4 SEP) và
   nhóm *Quá hạn* (W3 SEP còn sót). MT của W2 OCT trở đi **không** xuất hiện — chưa đến lượt thì
   chưa phải việc.
2. Tick vài em → chọn **Buổi L/R/W** → chọn ngày → **Cập nhật N lượt**.
   Ô ngày bị chặn trong đúng tuần kế hoạch của những em đang chọn.
3. Không có ô nhập **giờ** ở bất cứ đâu — giờ mock đã bỏ.
4. Chọn các em thuộc **hai tuần khác nhau** → hệ thống nói rõ một ngày không thể nằm trong mọi tuần.

**Thử thêm:** đăng nhập bằng một **giáo viên Writing** rồi gọi thẳng API cập nhật ngày → bị từ chối.
Giáo viên **Speaking** sửa được **ngày Speaking**, nhưng vẫn không sửa được ngày L/R/W.

---

## Luồng 10 — Quản lý: lên kế hoạch MT hàng loạt

**Vai:** `Đặng Quang Vy` (Quản lý Monbay).

1. **Học viên → Lên kế hoạch MT**. Panel **trượt từ phải**, đủ rộng để vừa thấy danh sách vừa đặt tuần.
2. Mặc định chỉ liệt kê em **chưa có tuần MT tiếp theo** — đó là việc đang tồn của Quản lý.
   Bấm **Xem cả lớp để xếp trước** khi muốn xếp sẵn lượt sau cho cả lớp.
3. Chọn tuần bằng `← W4 OCT ▼ →`, tick nhiều em, rồi chọn **kỹ năng lượt này yêu cầu**.
4. Bỏ tick **Speaking** → lượt này **ngay từ đầu không yêu cầu Speaking**. Mở chi tiết lượt vừa tạo:
   Speaking nằm ở nhóm *không yêu cầu*, và lượt được coi là **xong khi đủ L/R/W** — không chờ Speaking.
5. Bỏ tick **cả bốn** kỹ năng → hệ thống từ chối: một lượt không có kỹ năng nào thì không đánh giá được gì.

---

## Luồng 11 — Ghi nhận nhanh: nhận xét bằng lời là đủ

**Vai:** `Đinh Bảo Vy` (GV Reading, lớp MB-FT 101).

1. Mở lớp → mở hồ sơ một học viên → bảng **Điểm chính thức và ghi nhận của giáo viên**.
   Một bảng, hai cột, kèm cột **Δ**.
2. Cột giữa hiện **nguyên văn nhận xét** — ví dụ *"Làm matching ổn, mất điểm ở TRUE/FALSE/NOT GIVEN."*
   Đó thường là thứ hữu ích nhất trên cả bảng: một con số 6.0 không nói được điều đó.
3. Bấm **Ghi nhận** ở dòng Reading. Ô đầu tiên là **nhận xét**, và **chỉ cần thế là lưu được** —
   chọn *"Không, chỉ nhận xét"* ở phần điểm.
4. Lưu xong: dòng đó hiện nhận xét, cột **Δ để trống**. Nhận xét bằng lời **không bị quy ra số** để đem
   trừ — và cũng không nên, vì như thế là bịa ra một phép đo không có.
5. Thử lại với *"Ước chừng một band"* → con số được ghi kèm chữ **(nhận định)**. Với *"Có bài, nhập số
   câu đúng"* → hệ thống tự quy ra band, đúng cùng công thức với điểm chính thức.
6. Để trống **cả** nhận xét lẫn điểm rồi bấm Lưu → bị chặn: một dòng không có gì thì không nói lên điều gì.
7. Thử ghi nhận kỹ năng **không** được phân công → không có nút, và gọi thẳng API cũng bị từ chối.

**Cần thấy:** Δ **không tô màu tốt/xấu** — nó chỉ là khoảng cách hai con số. Điểm chính thức là kết quả
một bài làm trong một buổi; ghi nhận là nhận định qua cả quá trình dạy. Bên nào cao hơn cũng không tự nó
nói lên điều gì đáng khen hay đáng lo.

**Lưu ý:** giáo viên ghi được **bất kỳ lúc nào** — không phụ thuộc tuần MT, hạn nhập điểm hay cửa sổ sửa
báo cáo tuần. Ghi nhận **không bao giờ** ghi đè điểm chính thức, và **không** tự sinh ra vấn đề học vụ.

---

## Luồng 12 — Tiến trình công việc: dữ kiện tự sinh và khoá thời gian

**Vai:** `Đặng Quang Vy` (Quản lý).

1. **Tiến trình công việc** → mục **Việc hệ thống nhìn ra**. Mỗi dòng ghi rõ **việc của ai**
   (tuần MT → Quản lý, ngày MT → Admin chi nhánh) và bấm vào mở đúng bản ghi cấu thành.
2. Nhập đủ điểm cho một lượt ở màn khác rồi quay lại → con số *thiếu điểm* **tự giảm**.
   Không có nút "Đã xong" — đánh dấu chỉ che một con số vẫn đang đúng.
3. Chọn tuần bằng `←` `→` thay vì mở dropdown. Danh sách chỉ khoảng **hai tháng** quanh tuần đang xem
   và **một tuần tới**; chọn một tuần cũ thì cửa sổ **dịch theo**.
4. Mở một tuần **tương lai** → không nhập được báo cáo, và hệ thống **nói rõ vì sao**.
   Gọi thẳng API cũng bị từ chối — quy tắc nằm ở máy chủ, không phải chỉ làm mờ nút.
5. **Thêm việc** → không còn trường *Loại*; **Người phụ trách** là ô **gõ để tìm** kèm vai trò và chi nhánh;
   **Người theo dõi** đã có sẵn Quản lý của chi nhánh đó.
6. Sau `Tutor part-time` không còn badge *Đơn vị độc lập*. Nhóm báo cáo là **Học sinh / Phụ huynh**.

---

## Luồng 13 — Lớp thường: nhập điểm Foundation

**Vai:** `Đặng Quang Nhi` (Quản trị hệ thống) hoặc giáo viên của lớp `MB-FOUND 12`.

1. **Học viên** → mở lớp **MB-FOUND 12**. Dòng lớp ghi rõ **Foundation**, không phải lớp FT.
2. Roster hiện **Giữa khoá ✓ · Cuối khoá W1 OCT** — không còn "Chưa có kế hoạch".
3. Bấm vào một bài → mở **bảng điểm lớp thường**. Cột kỹ năng là
   **Listening · Reading · Prep-Writing · Pronunciation** — có Pronunciation, không có Writing task 1/2.
4. Mỗi ô là **số câu đúng / tổng số câu**. Nhập `39` và `40` → hiện ngay **97.5% · Đạt**.
5. Thử nhập `45/40` → bị từ chối: số câu đúng không thể lớn hơn tổng.
   Thử để trống tổng → bị từ chối: nhập số câu đúng thì phải nhập cả tổng.
6. Bỏ trống một kỹ năng → dòng đó hiện **Chờ 1 môn · Chưa đủ điểm để kết luận**, và **không** sinh case SOS.
   Đây là điểm mấu chốt: **thiếu điểm khác với trượt**.
7. Nhập nốt kỹ năng cuối, cho một em trượt 2 môn → dòng đó thành **SOS 2**, dùng đúng hệ thống case
   của lớp FT.

**Thử thêm:** đặt **tổng số câu chung** ở đầu bảng (ví dụ Listening 40) → các ô còn trống lấy sẵn con
số đó, dòng nào đề khác thì sửa riêng.

**Ca đáng chú ý:** `25/42` hiện ra **60%** nhưng thực tế là 59,5% nên vẫn là **Chưa đạt** — hệ thống
xét trên tỷ lệ chính xác, không xét trên số đã làm tròn.

---

## Luồng 14 — Giáo viên biết mình dạy gì ở lớp nào

**Vai:** bất kỳ giáo viên nào.

1. Mở **Học viên**. Mỗi dòng lớp có một badge nhỏ ghi kỹ năng bạn phụ trách ở **chính lớp đó**:
   `L Pron` ở lớp này, `W1` ở lớp kia, `R` ở lớp nữa. Kèm `GVCN` nếu bạn là chủ nhiệm.
2. Không phải mở từng lớp ra dò — một giáo viên dạy nhiều lớp và ở mỗi lớp có thể ôm bộ kỹ năng khác nhau.
3. Mở **Class Overview** của một lớp: đầu trang nhắc lại **"Bạn phụ trách: L · Pron"**.

---

## Luồng 15 — Giáo viên báo vấn đề TRƯỚC khi có bài đánh giá

**Vai:** giáo viên bất kỳ, ví dụ `Đinh Bảo Lam` (Listening · W2 · Speaking, lớp MB-FT 101).

Đây là **nguồn thứ hai** của vấn đề học vụ. Trước đây hệ thống chỉ biết em nào đang đuối sau khi có đủ
điểm Mock — nhưng giáo viên nhìn thấy vấn đề trên lớp từ nhiều tuần trước đó, và không có chỗ nào để nói ra.

1. **Học viên** → mở một lớp → bấm tên một học viên để vào hồ sơ.
2. Bấm **Ghi nhận vấn đề** ở góc trên bên phải.
3. Chỉ cần **một câu**: *"Ba tuần nay em không làm bài nghe ở nhà, trên lớp cũng ít tập trung."*
   Chọn mức **Cần chú ý**. Bấm **Ghi nhận**.
4. Ngăn kéo mở ngay ra vấn đề vừa tạo. Nhìn phần đầu: có nhãn **Cần chú ý**, **không** có nhãn SOS —
   SOS là số kỹ năng dưới kỳ vọng ở một bài cụ thể, ở đây chưa có bài nào.
5. Phần *Phân loại, hoàn cảnh, ngày phát hiện* đều **tuỳ chọn** — mở ra bằng dòng
   *"+ Phân loại và hoàn cảnh (không bắt buộc)"*. Form dài thì giáo viên bỏ qua, và một form không ai điền
   thì không có dữ liệu nào cả.
6. Bấm **+ Ghi một việc đã làm** → chọn *Trao đổi với học viên*, mô tả một câu, chọn *Đã xong* và điền ngày.
7. Bấm **+ Ghi lại kết quả xem lại** → chọn *Có tiến bộ*, ghi *"Đã nộp bài đủ hai tuần liên tiếp"*.
8. Cuộn xuống **Hành trình học**: mọi việc vừa làm nằm chung **một chương**, không rải thành bốn dòng rời.
9. Bấm hai lần nút Ghi nhận (hoặc F5 rồi gửi lại) → **không** tạo vấn đề thứ hai.

**Đổi sang `Đặng Quang Vy` (Quản lý MB)** → **Tổng quan → Tình hình chung** → thấy ngay vấn đề vừa báo. Không ai phải nhập
thêm một bản báo cáo nào để Quản lý biết chuyện này.

**Vấn đề có sẵn để xem:** `case/114` (Hoàng Minh Mai, cần chú ý) · `case/115` (Phạm Thanh Quân, **gấp**) ·
`case/116` (Vũ Minh Trâm, bình thường) · `case/118` (Hoàng Tuấn Hà, **đã kết thúc theo dõi**).

---

## Luồng 16 — Hồ sơ học viên: hiểu tình hình trong ba mươi giây

**Vai:** `Đặng Quang Vy` (Quản lý MB), mở hồ sơ một học viên lớp FT.

Đọc từ trên xuống, mỗi khối trả lời đúng một câu hỏi:

| Khối | Câu hỏi |
|---|---|
| **Điểm đầu vào → Hiện tại → Mục tiêu** | Em đi từ đâu tới đâu, còn cách đích bao xa |
| **So với mốc gần nhất** · **Đang cần chú ý** | Có theo kịp không, đang vướng gì |
| **Đường đi từng kỹ năng** | Kỹ năng nào đã tiến, kỹ năng nào đứng yên |
| **Vấn đề học vụ** | Ai phát hiện, đã làm gì, quan sát được gì |
| **Các lần đánh giá** | Bảng điểm chi tiết |
| **Hành trình học** | Toàn bộ câu chuyện theo thời gian |

Những điều nên để ý:

1. **Điểm đầu vào** phần lớn ghi *"Chưa rõ"* — hệ thống **không** lấy MT1 làm điểm đầu vào. Bấm
   **Điểm đầu vào** để nhập, và nó **bắt chọn nguồn**: bài kiểm tra đầu vào · kết quả cuối lộ trình trước ·
   điểm bên ngoài · nhập tay có ghi chú.
2. **Hiện tại** chỉ lấy Overall từ **một lượt** có đủ bốn kỹ năng, kèm dòng *"Overall ở MT2"*. Không ghép
   bốn kỹ năng mới nhất của bốn lượt khác nhau.
3. **So với mốc gần nhất** nói *đạt kỳ vọng* hay *có kỹ năng dưới kỳ vọng*, kèm kỳ vọng đã chốt của chính
   mốc đó. Nếu mới có 2/4 kỹ năng thì có dòng cảnh báo là kết luận **còn có thể đổi**.
4. **Cố tình không có nhãn tổng hợp** kiểu *"đang ổn / có nguy cơ"*. Không có cảnh báo **không** đồng nghĩa
   đang theo kịp — hai điều đó khác nhau, nên nói tách ra.
5. **Đã tăng** và **Còn cách đích** đều là phép trừ nên **không tô màu**. Thiếu điểm đầu vào thì cột
   *Đã tăng* để trống, không điền số 0.
6. Bấm **Đổi mục tiêu** → **bắt ghi lý do**. Lưu xong, các lượt đã chốt **vẫn giữ kỳ vọng cũ**: đổi mục
   tiêu không chấm lại quá khứ.
7. Bấm **Kết luận** → *đạt · chưa đạt · **chưa có căn cứ kết luận***. Đóng lộ trình chỉ nói "không học theo
   lộ trình này nữa"; có đạt hay không là kết luận riêng.

**Hồ sơ lớp thường** (`/hoc-vien/25`, `MB-FOUND 12`) có bộ ba **khác**: *khoá học · bài đã làm · kết quả
gần nhất*. Lớp thường không có band, mục tiêu IELTS hay ngày thi — dựng ba con số IELTS ở đây là bịa.

---

## Luồng 17 — Tình hình chung: tab thứ hai của Quản lý

**Vai:** `Đặng Quang Vy` (Quản lý MB) hoặc `Đặng Quang Nhi` (Quản trị hệ thống, thấy cả năm chi nhánh).

1. Ở **Tổng quan**, Quản lý có **hai tab**: *Việc của tôi* và *Tình hình chung*. Hai câu hỏi khác nhau —
   *"tôi phải làm gì bây giờ"* và *"cả chi nhánh đang thế nào"* — nhưng không cần cả hai cùng lúc.
   Giáo viên và Admin chi nhánh **không có** tab thứ hai.
2. Bấm **Tình hình chung**. Ba ô ở đầu là **ba trạng thái loại trừ nhau**, cộng lại **đúng bằng** số dòng
   trong bảng bên dưới:

   | Trạng thái | Nghĩa là |
   |---|---|
   | Chưa có phương án hỗ trợ | Chưa có hướng xử lý và cũng chưa ai ghi việc nào |
   | Đang xử lý | Đã có hướng xử lý, hoặc đã có ít nhất một phương án được ghi |
   | Đã xong | Đã kết thúc theo dõi — làm mờ và đẩy xuống cuối, **không giấu đi** |

   Cộng thử: ba số ở ba ô phải đúng bằng con số trong tiêu đề *Vấn đề (N)*.
3. Ngay dưới đó là **Cần chú ý** — *Tới hạn xem lại* và *Mức cao hoặc gấp*. Hai cái này là **câu hỏi**,
   không phải phần của một tổng: một em có thể vừa tới hạn xem lại vừa ở mức cao.
4. **Mỗi lựa chọn lọc kèm số ngay trên nút**, nên đọc được `Học sinh 18 › Listening 6` mà không phải bấm
   thử. Chọn *Listening* → các nhóm vấn đề đổi số theo, nhưng **các kỹ năng khác không về 0** (đếm chéo
   kiểu facet), nên vẫn đi tiếp được.
5. Có riêng nút **"Chưa phân loại"**. Phần lớn vấn đề sinh từ điểm nằm ở đó — hệ thống chỉ biết kỹ năng nào
   dưới kỳ vọng, **vì sao** thì phải có người dạy nhận định. Cộng `Học sinh + Giáo viên + Giáo trình +
   Chưa phân loại` phải ra đúng tổng.
6. Mọi lựa chọn nằm **trên đường dẫn** (`?tab=tinh-hinh&ky-nang=listening`). Bấm **Back** → về đúng bộ lọc
   trước đó; gửi đường dẫn cho người khác vẫn ra đúng màn hình.
7. Bấm một dòng → vấn đề mở trong **ngăn kéo**, không rời màn hình. Bấm **Mở trang riêng** → cùng bản ghi
   ấy ở một đường dẫn chia sẻ được (`/hoc-thuat/case/…`).
8. Nhóm **Giáo viên** nói về cách dạy có thể cải thiện — **không** phải bảng xếp hạng giáo viên.

---

## Luồng 17b — Đề xuất phương án và duyệt

**Vai:** `Ngô Khánh Bình` (Giáo viên Bãi Cháy) rồi `Hoàng Khánh Huy` (Quản lý Bãi Cháy).

1. Vào bằng **Hoàng Khánh Huy**. Màn Tổng quan mở ra đã có nhóm **Chờ duyệt phương án (1)** với nhãn
   **Quá hạn duyệt**: *"Ngô Khánh Bình đề xuất: Đề nghị lùi MT3 sang tuần sau… — quá hạn 8 ngày"*.
   Case này ở mức **Gấp** nên Quản lý chỉ có **3 ngày** để trả lời, không phải 7.
2. Bấm vào dòng đó → mở hồ sơ em, khối *Đã làm gì và quan sát được gì* có một phương án mang nhãn
   **Chờ Quản lý duyệt · hạn 15/09/2026**. Chưa có nút *Cập nhật kết quả* — **đang chờ thì việc chưa làm**.
3. Bấm **Trả lời đề xuất**. Ba lựa chọn:

   | | |
   |---|---|
   | **Duyệt** | Phương án chạy tiếp, mở khoá *Cập nhật kết quả* |
   | **Không duyệt** | **Bắt buộc** ghi lý do — nút *Gửi* mờ cho tới khi có chữ |
   | **Góp ý** | Ghi lại góp ý nhưng **vẫn còn chờ**: đề xuất không rời khỏi việc của bạn |

4. Thử **Góp ý** trước, gõ *"Cho tôi xem bài gần nhất"* → nhãn vẫn là **Chờ Quản lý duyệt**, và dòng
   *"Quản lý (Hoàng Khánh Huy): Cho tôi xem bài gần nhất"* hiện ngay dưới phương án.
5. Bấm **Trả lời đề xuất** lần nữa → chọn **Duyệt** → nhãn đổi thành **Đã duyệt**, và nút
   **+ Cập nhật kết quả** xuất hiện.
6. Bấm **Trả lời đề xuất** lần thứ ba → **bị từ chối**: *"Phương án này đã được duyệt rồi."* Đổi ý là
   chuyện bình thường, nhưng ghi đè sẽ xoá mất lý do đã ghi — nên đổi ý thì giáo viên đề xuất lại, hồ sơ
   giữ cả hai lần.
7. Muốn xem đầu kia: đổi sang một giáo viên, mở một vấn đề, bấm **+ Ghi phương án hỗ trợ**, chọn tình
   trạng **Đã lên kế hoạch** → ô *"Cần Quản lý duyệt trước khi làm"* xuất hiện. Chọn **Đã xong** → ô đó
   biến mất, kèm một dòng giải thích: việc đã làm rồi thì không còn gì để duyệt.

---

## Luồng 17c — Phân công giáo viên vào lớp

**Vai:** `Đặng Quang Vy` (Quản lý MB) hoặc `Đặng Ngọc Phúc` (Admin chi nhánh MB).

1. **Học viên** → mở lớp `MB-FT 101` → thẻ **Phân công và kỹ năng** có nút **Sửa phân công**.
   Đăng nhập bằng một giáo viên thì **không có nút này**.
2. Trong hộp thoại: một hàng **GVCN** và một hàng cho **mỗi kỹ năng của chương trình lớp đó**.
   Mỗi hàng là một **danh sách** chứ không phải một ô chọn — có lớp hai người cùng dạy một kỹ năng, và ô
   chọn một-người sẽ âm thầm đá mất người thứ hai.
3. Ô chọn *+ Thêm giáo viên* chỉ liệt kê người **có vai trò giảng dạy ở chi nhánh của lớp**, kèm số lớp
   họ đang dạy để không dồn hết vào một người.
4. Bấm **×** cạnh một tên để bỏ phân công, rồi **Lưu**.
5. Mở lại hộp thoại → mục **Đã từng dạy lớp này** có tên vừa bỏ, kèm khoảng thời gian. **Bỏ phân công
   không phải là xoá**: dòng cũ đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn thấy đúng ai dạy lúc đó,
   và điểm đã nhập giữ nguyên tên người nhập.
6. Đổi sang chính giáo viên vừa bị bỏ → mở trang nhập điểm của lớp đó → **kỹ năng ấy không sửa được nữa**.
   Các kỹ năng khác của họ không bị ảnh hưởng, và ngày bắt đầu phân công của những dòng không đổi **giữ
   nguyên** — đóng rồi mở lại là bịa ra một lần đổi người không có thật.

---

## Luồng 18 — Sửa điểm không xoá lịch sử hỗ trợ

**Vai:** `Đặng Quang Nhi` (Quản trị hệ thống).

1. **Tổng quan → Tình hình chung** → mở một vấn đề sinh từ điểm đã có vài việc đã làm (ví dụ `case/78`, `case/81`, `case/8`).
2. Đếm số việc trong khối *Đã làm gì và quan sát được gì*.
3. Bấm mã MT ở phần đầu để mở trang điểm → sửa một kỹ năng lên cho **đạt kỳ vọng**.
4. Quay lại vấn đề: **mọi việc đã làm vẫn còn**, mức SOS đổi theo điểm mới, và lịch sử đổi mức nằm trong
   *Lịch sử thay đổi*.
5. Ngay trên trang điểm, khối **Vấn đề học vụ** vẫn hiện kèm một dòng giải thích: điểm nay đã đạt, nhưng
   vấn đề còn đây để tra lại đã hỗ trợ những gì. Người có quyền quyết định có kết thúc theo dõi hay không.

**Vì sao quan trọng:** giấu vấn đề đi khi điểm đã lên nghĩa là xoá luôn dấu vết của công sức hỗ trợ em —
đúng phần đáng đọc nhất. Và điểm lên **không** tự chứng minh là nhờ việc hỗ trợ.

---

## Luồng 19 — Ai được kết thúc theo dõi

**Vai:** lần lượt ba tài khoản, cùng một vấn đề.

1. `Đinh Bảo Vy` (GV Reading, **không** phải GVCN của MB-FT 101): mở vấn đề của một học viên lớp đó →
   ghi được việc đã làm, ghi được kết quả xem lại, nhưng phần **Bước tiếp theo** có dòng giải thích rằng
   chỉ GVCN của lớp và Quản lý mới kết thúc theo dõi được.
2. `Trần Quang Nam` (**GVCN** MB-FT 101): cùng vấn đề đó → chọn hướng xử lý và **kết thúc theo dõi** được.
3. `Đặng Quang Vy` (Quản lý MB): kết thúc được mọi vấn đề trong chi nhánh.
4. Thử kết thúc mà **không chọn hướng xử lý** → bị chặn.
5. Chọn hướng **"Chỉ theo dõi"** → **không** có ô kết thúc: "chỉ theo dõi" nghĩa là vấn đề **vẫn còn mở**.
6. Chặn ở **máy chủ**, không chỉ ẩn nút: gọi thẳng API bằng tài khoản giáo viên bộ môn cũng bị từ chối.

---

## Kiểm tra quyền (bấm nhanh)

| Thử | Tài khoản | Kỳ vọng |
|---|---|---|
| Chỉ sửa được kỹ năng được phân công | `Đinh Bảo Vy` (GV Reading lớp MB-FT 101) | Chỉ ô **R** mở được; L/W/S chỉ đọc |
| GVCN **không** có quyền lịch | `Trần Quang Nam` (GVCN MB-FT 101) | Không có nút **Đổi tuần** lẫn **Chốt ngày**; gọi thẳng API cũng bị từ chối |
| Quản lý chốt tuần nhưng không chốt ngày | `Đặng Quang Vy` | Có **Đổi tuần**, không có **Chốt ngày giờ** |
| Admin CN chốt ngày nhưng không chốt tuần | `Đặng Ngọc Phúc` | Có **Chốt ngày giờ**, không có **Đổi tuần** |
| Admin CN **không** vào Tiến trình công việc | `Đặng Ngọc Phúc` | Menu **không** có *Tiến trình công việc*; gọi API báo cáo bị từ chối |
| Không thấy dữ liệu ngoài chi nhánh | `Đặng Quang Vy` (Quản lý MB) | Không thấy lớp `CP-FT 110`; gọi thẳng URL của Mock lớp CP bị **API từ chối**, không chỉ ẩn nút |
| Mỗi chi nhánh một Quản lý, một Admin | `Đặng Quang Vy` (QL MB) · `Đặng Ngọc Phúc` (Admin MB) | Dữ liệu mẫu để đúng một người mỗi vai mỗi chi nhánh cho dễ theo dõi; hệ thống vẫn hỗ trợ nhiều người |
| Giáo viên không có Tiến trình công việc | bất kỳ giáo viên nào | Menu **không** có *Tiến trình công việc* |
| Lớp thường: GV chỉ nhập kỹ năng mình dạy | `Đinh Bảo Lam` (GV Reading lớp `MB-FOUND 12`) | Nhập được Reading; gọi API nhập Pronunciation bị từ chối; nhập `writing1` bị từ chối vì chương trình Foundation không có kỹ năng đó |
| Nhập hàng loạt ngoài phạm vi bị chặn ở máy chủ | `Đặng Quang Vy` (Quản lý MB) | Dán dòng có lớp `CP-FT 110`: xem trước báo *nằm ngoài phạm vi*, bấm Thêm thì dòng đó bị bỏ qua và **không** có học viên nào được tạo |
| Không còn bước *Xác nhận (Head)* | bất kỳ tài khoản nào | Chi tiết vấn đề **không** còn nút *Xác nhận (Head)*. Dấu xác nhận cũ trong dữ liệu vẫn giữ để tra lại |
| Giáo viên bộ môn **không** kết thúc được theo dõi | `Đinh Bảo Vy` (GV Reading MB-FT 101) | Ghi được việc đã làm và kết quả xem lại; phần *Bước tiếp theo* nói rõ chỉ GVCN và Quản lý mới kết thúc được. Gọi thẳng API cũng bị từ chối |
| GVCN kết thúc được theo dõi lớp mình | `Trần Quang Nam` (GVCN MB-FT 101) | Chọn hướng xử lý rồi kết thúc được |
| Kết thúc theo dõi phải có hướng xử lý | `Đặng Quang Vy` | Bỏ trống hướng xử lý → bị chặn. Chọn *"Chỉ theo dõi"* → **không** có ô kết thúc, vì "chỉ theo dõi" nghĩa là vẫn còn mở |
| Ghi *"đã xong"* phải có ngày thật | bất kỳ tài khoản nào ghi được | Chọn *Đã xong* mà để trống ngày → bị chặn ở máy chủ |
| Người nhập không mặc định là người làm | `Đặng Quang Vy` | Tick *"Người khác làm, tôi nhập hộ"* và gõ tên → bản ghi giữ **tên người ngoài**, kèm ghi chú ai nhập hộ |
| Giáo viên chỉ ghi nhận kỹ năng mình dạy | `Đinh Bảo Vy` (GV Reading MB-FT 101) | Chỉ dòng **Reading** có nút *Ghi nhận*; gọi API ghi nhận Speaking bị từ chối |
| Giáo viên báo được vấn đề ngoài kỹ năng mình dạy | `Đinh Bảo Vy` | Báo được *"em hay nghỉ học"* dù chỉ dạy Reading — quyền **báo vấn đề** đi theo phạm vi chăm sóc, không theo kỹ năng. Nhưng vẫn **không** ghi được điểm kỹ năng khác |
| Vấn đề của học viên ngoài phạm vi bị chặn | `Trần Quang Nam` (GVCN MB) | Gọi API báo vấn đề cho học viên lớp `CP-FT 110` bị từ chối |
| Quản lý cập nhật được ngày MT | `Đặng Quang Vy` | Có cả **Đổi tuần** lẫn cập nhật **ngày thực tế** — học viên nghỉ thì sửa được ngay |
| Báo cáo tuần tương lai bị chặn ở máy chủ | `Đặng Quang Vy` | Mở một tuần cuối năm: ô nhập khoá, và gọi thẳng API vẫn bị từ chối |
| Giáo viên không huỷ được lịch | `Trần Quang Nam` (GVCN MB-FT 101) | **Không** có nút *Huỷ lịch* |
| GV L/R/W không sửa được ngày MT | `Đinh Bảo Vy` (GV Reading MB-FT 101) | Gọi API cập nhật ngày L/R/W **và** ngày Speaking đều bị từ chối |
| GV Speaking chỉ sửa ngày Speaking | `Đinh Bảo Lam` (GV Speaking MB-FT 101) | Sửa được **ngày Speaking**; ngày L/R/W bị từ chối |
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
| **Sang lộ trình mới, MT đánh lại từ 1** | `/hoc-vien/4` (Hoàng Thu Ninh) — LT1 target 6.5 có MT1–MT3, LT2 target 7.0 bắt đầu lại MT1 |
| **Học tiếp cùng lộ trình, MT tăng tiếp** | Một học viên `UB-FT 401` — MT5, target giữ nguyên |
| **Ghi nhận CHỈ CÓ nhận xét, không điểm** | 144 ghi nhận trong dữ liệu mẫu — cột Δ để trống, đúng như thiết kế |
| **Ghi nhận có điểm ước lượng** | 145 ghi nhận — con số kèm chữ *(nhận định)* để phân biệt với đo từ bài thật |
| **Giáo viên báo vấn đề, chưa có bài nào** | `case/114` cần chú ý · `case/115` **gấp** · `case/116` bình thường · `case/117` cần chú ý · `case/118` **đã kết thúc theo dõi** |
| **Vấn đề nhiều việc đã làm và có lần xem lại** | `case/78`, `case/81`, `case/92` — mỗi vấn đề 5 việc |
| **Việc mới lên kế hoạch, chưa làm** | Các vấn đề còn ở trạng thái *Chưa xử lý* — có tên người nhưng **chưa có ngày** |
| **Hỗ trợ học thuật đang thực hiện, chưa xong** | Các vấn đề *Đang xử lý* — có ngày bắt đầu, chưa có ngày xong, kèm hẹn xem lại |
| **Hẹn xem lại đã quá hạn** | `case/79` hẹn 03/08 · `case/1`, `case/7`, `case/10` hẹn 31/08 |
| **Theo dõi KHÔNG hẹn ngày** | Có trong dữ liệu — và **không bao giờ** bị coi là quá hạn |
| **Vấn đề chưa phân loại** | Phần lớn vấn đề sinh từ điểm — hệ thống không tự chẩn đoán nguyên nhân |
| **Chuyển lớp** | `/hoc-vien/3` — lượt đã xong giữ lớp cũ, lượt chưa xong sang lớp mới |
| **Tạm dừng rồi quay lại học** | Một học viên `BC-FT 205` |
| **Kết thúc học và lưu trữ** | Hai học viên `BC-FT 205`: một em vừa xong (còn hiện, làm dịu màu), một em đã quá hai tuần |
| **Warning / WL** | Một học viên `UB-FT 401` — thử bộ lọc *Warning / WL* |
| **Case SOS ở đủ bốn mức tiến độ** | Chưa ghi nhận · Có tên chưa có ngày · Đang xử lý · Đã xong |
| **Lớp thường** | `MB-FOUND 12` (`/hoc-vien/25`), `BC-BE 80`, `HD-ELE 01` — hồ sơ có bộ ba riêng, bảng điểm theo số câu đúng, không có band |

---

## Kiểm tra tự động

```bash
npm test
```

Chạy **120 kiểm tra** trên một database riêng (`data/test.sqlite`), phủ 16 nhóm:
quy đổi điểm và công thức · kỳ vọng theo lộ trình · kỹ năng không mock và tiến độ ·
tuần/lịch/hạn nhập · quyền lịch tách tuần với ngày · quyền theo vai trò × chi nhánh × phân công ·
lộ trình và số lần MT · ghi nhận nhanh của giáo viên · tổng quan và các nhóm vấn đề ·
xử lý sau đánh giá và lưu dữ liệu · nhập hàng loạt · lớp thường · tổng hợp theo tuần ·
**vấn đề học vụ: hai nguồn một vòng đời**.

### Nâng cấp dữ liệu đang có

```bash
npm run migrate
```

Chuyển database cũ sang mô hình mới mà **không xoá gì**: giữ nguyên mã học viên, enrollment, từng lượt MT,
điểm W1/W2 và lịch sử vấn đề. Từ vòng D còn:

- gắn học viên và lộ trình cho các vấn đề cũ vốn chỉ có mã bài;
- dựng lại năm ô hỗ trợ cũ thành **bản ghi việc đã làm** — ngày trao đổi thật thì ghi *đã xong*, còn
  ngày bắt đầu hỗ trợ học thuật chỉ ghi *đang thực hiện*, **không** tự nâng thành đã xong;
- đánh dấu các vấn đề đóng theo hệ thống cũ là **đóng-kiểu-cũ**, ghi rõ là thiếu căn cứ, **không** bịa
  ra một kết luận;
- chuyển bảng đánh giá GV cũ thành **ghi nhận nhanh**, giữ nguyên người và ngày;
- gắn **mã chương trình** cho khoá lớp thường, và chỉ khi mọi bài trong khoá cùng một chương trình —
  mập mờ thì để trống.

Thiếu người, thiếu ngày hay thiếu kết quả thì để **"chưa rõ"**, không suy từ người nhập hay ngày tạo bản
ghi. Chạy lại lần hai thì **không làm gì thêm**.

Đã kiểm chứng trên **bản sao thật** của database trước khi sửa: giữ nguyên từng ô điểm, từng mã vấn đề,
mọi mục tiêu đã chốt; 153 việc đã làm và 24 khoá được dựng lại; khoá ngoại sạch.
