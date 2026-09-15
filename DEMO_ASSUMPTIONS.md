# Những điều đã chốt, và những điều còn treo

Chỉ ghi thứ **thực sự thay đổi cách phần mềm chạy**. Lịch sử tranh luận nằm ở
`vong4/01_CHOT_NGHIEP_VU.md` và mục 9 của `PISA_Design_Master_Reference.md`.

Khi hai nguồn nói khác nhau, thứ tự ưu tiên là: **lời owner mới nhất** → `vong4/01_CHOT_NGHIEP_VU.md`
→ `PISA_Claude_Prompt.md` → `PISA_Design_Master_Reference.md` → mã đang chạy.

---

## 1. Cách chấm và kết luận

| | |
|---|---|
| **Writing** | Bốn tiêu chí cho cả W và S. W1 và W2 là **hai ô nhập điểm riêng**; band Writing = `(W1 + W2×2) / 3`, làm tròn 0.5 |
| **Kỳ vọng của một lượt** | `mục tiêu − 1.0` ở MT1, `− 0.5` ở MT2, `− 0` từ MT3 |
| **Mức SOS** | Số **kỹ năng có band** dưới kỳ vọng: 1 → SOS 1, 2 → SOS 2, từ 3 → SOS 3. Đếm trên **bốn** kỹ năng (Writing gộp) |
| **SOS là tình trạng HIỆN TẠI** | Mức của một em là mức ở **lượt MT mới nhất** em đã làm, không cộng dồn. Nên tổng ba cột SOS **không bao giờ** vượt sĩ số |
| **SOS lấy từ KẾT QUẢ BÀI, không từ case** *(vòng 6 — THAY cách cũ)* | Mức SOS hiện tại đọc từ **lượt đánh giá gần nhất có điểm trong lộ trình đang chạy**. Đóng một case **không** làm mức SOS đổi; một MT mới đạt **không** tự đóng case nào; case của lộ trình trước **không** thành SOS của lộ trình mới. Một chỗ tính duy nhất: `server/src/students/standing.ts` |
| **Lộ trình đã khép vẫn có kết luận** *(vòng 6)* | Em đã hoàn thành lộ trình và đi thi thật thì đầu hồ sơ vẫn nói kết quả gần nhất, không ghi *"chưa có kết quả"* |
| **Thiếu điểm ≠ trượt** | Kết luận ngay trên phần điểm đang có; ô chưa chấm **không** bị đếm là dưới kỳ vọng. Giao diện ghi rõ *"mới có 2/4 kỹ năng"* |
| **Kỹ năng không mock** | Quản lý/Admin CN đánh dấu cho từng lượt; kỹ năng đó rời khỏi mẫu số, và lượt **không còn Overall** |
| **Lớp Normal** | Chấm `số câu đúng / tổng`, đạt từ **60%** tính trên tỷ lệ thật (25/42 hiện "60%" nhưng vẫn trượt). Không band, không kỳ vọng, không Overall |

## 2. Tuần và hạn

| | |
|---|---|
| **Tuần** | Thứ Hai → Chủ nhật. Thuộc **tháng chứa thứ Năm** của tuần đó |
| **Tuần của một lượt** | Tuần **kế hoạch** Quản lý chốt. Speaking lệch ngày vẫn là cùng lượt, cùng tuần |
| **Lịch MT mặc định của lớp FT** | Sinh từ **tuần bắt đầu học** của từng em: tuần học **6 · 12 · 16 · 20 · 24**. Hệ thống chỉ **đề xuất**, người bấm áp; lượt Quản lý đã chốt tay hoặc em đã làm xong thì **đứng yên** |
| **Mốc kiểm tra lớp Normal** | Theo **tuần học của LỚP**: FOU tuần 4 và 8; BE/ELE tuần 5 và 10. Admin CN và Quản lý xê dịch được; để ô trống là **quay lại** mốc mặc định |
| **Hạn nhập điểm** | Lớp FT: **thứ Tư tuần kế tiếp**. Lớp Normal: **hết Chủ nhật chính tuần đó**. Chưa có tuần thì **không có hạn** |
| **Hạn một chu kỳ xử lý** *(vòng 5 — THAY luật cũ theo mức gấp)* | **Chủ nhật của tuần thứ hai**, tính tuần case xuất hiện là tuần thứ nhất. Case mở 14/09/2026 → hạn **27/09/2026**, không phải 04/10. Case Ý thức/Khác: **một tuần** kể từ lúc phương án bắt đầu |
| **Phương án cần duyệt** | Chu kỳ thực hiện **bắt đầu khi được duyệt**, không phải khi gửi. Thời gian chờ hiện riêng và quy trách nhiệm cho Quản lý |
| **Chu kỳ tiếp theo** | Bắt đầu từ lần xác nhận tiếp tục/điều chỉnh, tính lại theo đúng cách trên. Hạn cũ và việc cập nhật trễ **giữ nguyên** trong lịch sử — không reset để che quá hạn |
| **Hạn cập nhật kết quả case** | **Hết tuần MT tiếp theo**, đổi được |

> Mức gấp (*bình thường · cần chú ý · gấp*) vẫn còn để xếp thứ tự việc, nhưng **không còn quyết
> định hạn**. Luật `7 · 5 · 3 ngày` của các vòng trước đã bị thay.


## 3. Case — mô hình vòng 5

Vòng 5 **nới** mô hình vòng 4 ở hai chỗ: một em có thể có **nhiều case cùng hạng mục**, và case
đã chốt xong mà vấn đề tái phát thì **mở case mới nối vào case cũ** chứ không mở lại case cũ.

| | |
|---|---|
| **Một case** | = **một học viên × một hạng mục**. Sáu hạng mục: `L · R · W1 · W2 · S · Ý thức/Khác`. Không hơn |
| **Case còn mở, trượt lại** | MT2 yếu lại ở đúng hạng mục đó thì **giữ nguyên case**, thêm mốc tái diễn và mở một chu kỳ xử lý tiếp. Tên case đổi theo lượt mới nhất |
| **Case đã chốt xong, tái phát** *(vòng 5)* | Mở **case MỚI**, nối vào case cũ bằng `previous_case_id`; case cũ được thêm mốc *tái phát* và **giữ nguyên** trạng thái đã đóng. Không mở lại một case đã kết luận |
| **Nhiều case cùng hạng mục** *(vòng 5)* | Được phép, khi người tạo chọn **mở case riêng**. Case thứ hai mang cờ `parallel` và **không** dùng khoá chống trùng |
| **Mức 0 là mức hợp lệ** | Chấm lại một bài cũ thành đạt thì case **hạ về 0 và mang mốc "đã đạt lại"**, không bị xoá — xoá là mất luôn những việc đã làm cho em vì nó |
| **Tên case** | Sinh từ điểm: `MT2 - Listening dưới kỳ vọng`. Case Ý thức sinh sau MT: `MT2 - Trao đổi sau SOS 2`. Lớp Normal dùng tên bài thật (`Cuối khoá - …`), **không** gắn nhãn MT |
| **Tên case tạo tay** *(vòng 5)* | Người tạo **tự nhập tên**, và tên đó thắng tên tự sinh ở **mọi màn**. Hệ thống không tự gán cụm *"… dưới kỳ vọng"* cho case tạo tay |
| **Case GV báo** | `sos_level` để **trống** — SOS là số kỹ năng dưới kỳ vọng ở một bài, giáo viên không có bài nào để đếm. Mức gấp là thang riêng |
| **Case trùng** | GV báo lại một hạng mục đã có case chưa xong → hệ thống **hỏi trước**: ghi vào case đang có (mặc định), hay mở case song song có chủ ý |
| **Quy tắc Writing** | W1 và W2 so **riêng từng task**. Nhưng nếu band Writing **gộp** đã đạt thì **không có case nào** ở cả W1 lẫn W2, dù một task dưới kỳ vọng |
| **Người phụ trách case** *(vòng 6)* | Mỗi case có **một người phụ trách chính**; mỗi phương án có **người thực hiện riêng**; người ghi hộ lưu riêng. Không suy người phụ trách từ toàn bộ giáo viên dạy lớp. Chưa xác định được thì hiện **"Chưa có người phụ trách"** và đó là một **việc cần làm**, không phải một ô trống |
| **Dòng mô tả của case sinh từ điểm** *(vòng 6)* | Luôn nói **bài nào và mấy kỹ năng dưới kỳ vọng** trước, ghi chú của người dạy đứng sau. Trước đây chỉ cần ai đó gõ một câu là phần căn cứ biến mất |
| **Chốt kết quả case** | Chỉ chốt được khi **mọi phương án đã khép lại**, không còn việc đang chạy, đang chờ duyệt hay yêu cầu hỗ trợ chưa xử lý — và case **chưa có phương án nào** cũng không đủ điều kiện. Giao diện nói rõ còn thiếu gì. Bốn mức: *đã tốt hơn hẳn · có tiến bộ · chưa chuyển biến · tệ hơn* |
| **Điểm giáo viên tự chấm** *(vòng 5)* | Ghi kèm khi cập nhật kết quả hoặc kết luận case, **tuỳ chọn**. Lưu riêng: **không** ghi đè điểm entrance/mock/test, **không** đổi mức SOS, và trên biểu đồ tiến bộ dùng **ký hiệu khác**, không nối chung một đường |

## 4. Khi có SOS, hệ thống tự sinh gì

| Sinh ra | Chi tiết |
|---|---|
| **Một case cho mỗi hạng mục** dưới kỳ vọng | Kèm phương án tự sinh (xem dưới) |
| **Một case Ý thức/Khác** cho cả lượt | Mang đúng **hai việc trao đổi**: GVCN/GVBM gặp học viên · CS gặp phụ huynh. Một lượt trượt ba kỹ năng vẫn chỉ **một** bộ hai việc |
| **Một phương án hỗ trợ** cho mỗi hạng mục học thuật | SOS 1–2 → xếp tự học · SOS 3 → tutor · **từ MT3 luôn tutor**. Sinh ở trạng thái *đã lên kế hoạch, chưa có người thực hiện, chưa gửi duyệt* — máy không đặt tutor thay người. **Lớp Normal không** có phần này |

## 5. Phương án, đề xuất và duyệt

| Phương án hỗ trợ *(giáo viên tự làm)* | Đề xuất *(Quản lý luôn phải trả lời)* |
|---|---|
| Xếp tự học · Học tutor · Điều chỉnh cách dạy · Khác | Lùi lịch thi · Hỗ trợ học thuật ngoài định mức · Meeting CX/GĐCN · Khác |

Chọn một mục ở cột phải **tức là** đang xin ý kiến, nên ô tick *"cần Quản lý duyệt"* chỉ hiện
ở cột trái.

- Đang chờ duyệt thì **chưa cập nhật kết quả được** — việc thật chưa diễn ra.
- Quản lý: **duyệt** · **không duyệt** (bắt buộc ghi lý do) · **góp ý** (KHÔNG kết thúc việc chờ).
- Đã trả lời rồi thì **không sửa đè**. Đổi ý thì đề xuất lại, để hồ sơ giữ cả lý do lần trước.
- **Cập nhật kết quả** là việc của **người thực hiện**; quá hạn thì Quản lý cũng thấy.

### Kết thúc một chu kỳ (vòng 5)

Một nút duy nhất — **Cập nhật kết quả** — hỏi ba câu: kết quả, ghi chú, bước tiếp theo. Ba nút cũ
(*Đánh dấu đã làm*, *Ghi quan sát*, *Hướng xử lý*) đã gộp vào đây.

| Kết quả | Bước tiếp theo được phép |
|---|---|
| Tiến bộ rõ rệt · Tiến bộ một phần | Hoàn thành phương án · Theo dõi thêm |
| Chưa thay đổi · Kém hơn · Không đủ căn cứ | **Bắt buộc** chọn: Tiếp tục phương án cũ · Đề xuất phương án mới · Xin hỗ trợ từ Quản lý |

Kết quả chưa tốt **không có đường "ghi nhận rồi thôi"** — một kết quả *Kém hơn* mà không ai phải
làm gì tiếp là một kết quả sẽ bị quên, và em đó nằm im.

- **Theo dõi thêm / Tiếp tục phương án cũ** → mở chu kỳ mới trên **chính phương án đó**, không
  sinh một phương án thứ hai giống hệt.
- **Đề xuất phương án mới** → phương án cũ khép lại với lý do **"Được thay thế"** và nối sang
  phương án mới. **Không** đánh dấu là đã hoàn thành thành công — nó không thành công, đó là cả
  lý do phải thay.
- **Xin hỗ trợ từ Quản lý** → chu kỳ **dừng lại**, chuyển sang chờ Quản lý. Thời gian chờ tính
  cho Quản lý.

Case Ý thức/Khác dùng **ba** mức kết quả riêng: *Đã tiến bộ · Không thay đổi · Kém hơn*. Case đó
**đóng được cả khi kết quả xấu**, miễn mọi phương án đã khép lại và giáo viên đã ghi kết luận —
và màn hình **giữ đúng kết quả xấu**, không tô xanh như đã giải quyết xong.

## 5b. Đơn vị đếm — vòng 6

Sáu đơn vị **không bao giờ** được trộn, và mỗi bảng phải nói rõ mình đang đếm cái nào:

| Đơn vị | Ví dụ |
|---|---|
| **Học viên** | Một em có ba case = **1** học viên |
| **Lượt Test / lượt MT** | Một lượt MT sinh ba case = **1** lượt |
| **Case** | …và **3** case |
| **Phương án** | Một phương án có ba lần cập nhật = **1** phương án |
| **Lần / chu kỳ cập nhật** | …và **3** lần cập nhật |
| **Nhóm công việc** | Một dòng nhập điểm cho sáu em = **1** nhóm việc, **6** học viên cần nhập |

Hệ quả cụ thể, đã sửa ở vòng 6:

- Cột tên **"Case"** đếm đúng từng case, không đếm *"lượt MT có case"*. Bảng nào cần số học
  viên thì có cột **"HV có case"** riêng.
- **Quá hạn** là **thuộc tính của một việc**, không phải một bản ghi việc bổ sung — nên nó
  không bao giờ được đếm thành một dòng thứ hai.
- Bảng theo tuần có **sáu cột kết luận loại trừ nhau** cộng lại đúng bằng số lượt:
  *Đạt · SOS 1 · SOS 2 · SOS 3 · Tạm thời · Chưa đủ điểm*. Một bài chưa đủ điểm nằm ở **đúng
  một** trong hai cột cuối.
- **"Được phép sửa" khác "đây là việc của tôi".** Quản trị hệ thống và Quản lý sửa được điểm
  mọi kỹ năng để gỡ sự cố, nhưng việc **nhập điểm** chỉ thuộc về người được **phân công** dạy
  kỹ năng đó. Lớp thiếu giáo viên có nhãn *"Thiếu GV …"* riêng — đó mới là việc cần làm, và
  nó là việc **phân công**.
- Mọi bảng tổng hợp chỉ đếm **trong phạm vi người đang xem**. Hàng tổng của Quản lý một chi
  nhánh là tổng của chi nhánh đó, không phải của cả trung tâm.

## 5c. Công việc quản lý — vòng 6

Bảng **Tiến độ công việc** là mục điều hướng riêng, chỉ **Quản trị hệ thống** và **Quản lý
chi nhánh** nhìn thấy toàn bộ tab. Giáo viên vẫn nhận và cập nhật được việc con giao cho mình,
nhưng qua Toàn cảnh chứ không qua tab quản lý.

| | |
|---|---|
| **Một định danh xuyên nhiều tuần** | Việc chưa xong hiện sang tuần sau, **không** nhân bản thành một bản ghi mới mỗi tuần |
| **Bốn nhóm** | Học sinh / Phụ huynh · Giáo trình · Giáo viên · Tutor |
| **Năm trạng thái** | Chưa bắt đầu · Tiếp tục xử lý · Đã hoàn thành · Tạm ngưng · Dừng hẳn |
| **Tạm ngưng và Dừng hẳn** | **Bắt buộc có lý do**. Tạm ngưng nên có ngày xem lại để không rơi vào quên lãng |
| **Việc con** | **Một tầng**, không có việc cháu. Hạn mặc định của việc con là **trước hạn việc cha một ngày**, nhưng sửa được — và hai mốc độc lập với nhau |
| **Đóng việc cha** | Không đóng được khi còn việc con chưa khép |
| **Người theo dõi** | Xem được, **không** cập nhật hộ. Khác hẳn người phụ trách |
| **Mỗi lần cập nhật là một dòng lịch sử** | Không đè lên trạng thái cũ |
| **Gắn case làm căn cứ** | Một công việc quản lý **liên kết** tới case để nói con số từ đâu ra, nhưng **không** tự tạo phương án trong case và **không** tự đóng case nào |

## 6. Vai trò, bộ lọc và quyền

Bảy bộ lọc học viên, định nghĩa **một chỗ** trong `shared/domain/people.ts` để mọi trang gọi giống hệt nhau:

| # | Bộ lọc | GV | QL | Admin CN |
|---|---|:--:|:--:|:--:|
| 1 | Theo lớp | ✓ | ✓ | ✓ |
| 2 | SOS | ✓ | ✓ | |
| 3 | Case đang xử lý | ✓ | ✓ | |
| 4 | Case thiếu phương án | ✓ | ✓ | |
| 5 | Case quá hạn cập nhật | ✓ | ✓ | |
| 6 | Cần nhập điểm MT | ✓ | ✓ | ✓ *(chỉ xem để đôn đốc)* |
| 7 | Chưa có tuần MT | | ✓ | |

Bảng quyền:

| | Quản trị HT | Admin CN | Quản lý | Giáo viên |
|---|:--:|:--:|:--:|:--:|
| Chốt **tuần** của một lượt MT | ✓ | — | ✓ | — |
| Nhập điểm | nhập bù | — | — | ✓ đúng kỹ năng được phân công |
| **Xem danh sách case** | ✓ | — | ✓ | ✓ |
| Ghi nhận xử lý case | ✓ | ✓ | ✓ | ✓ trong phạm vi phụ trách |
| Duyệt phương án | ✓ | — | ✓ | — |
| Kết thúc theo dõi | ✓ | — | ✓ | GVCN của chính lớp đó |
| Phân công giáo viên · sửa tiến độ lớp | ✓ | ✓ | ✓ | — |
| Tạo tài khoản, cấp vai, sửa danh mục | ✓ | — | — | — |

Ba điểm dễ nhầm:

- **Admin chi nhánh không nhập bù điểm.** Người không dạy kỹ năng đó thì không có căn cứ nào
  để chấm; giáo viên vắng là chuyện đổi phân công, không phải chuyện văn phòng gõ điểm hộ.
- **Xem case và ghi nhận xử lý là HAI quyền khác nhau.** Admin CN vẫn ghi hộ được việc CS gọi
  phụ huynh, nhưng không có bốn bộ lọc case — hồ sơ chuyên môn từng em không phải việc của văn phòng.
- **Quyền cấp riêng cho cá nhân** cộng thêm vào quyền của vai, không thay thế. Sửa vai "Quản lý"
  là sửa cho tất cả Quản lý, nên có đường cấp riêng cho một người.

Phạm vi luôn là **quyền của vai × chi nhánh của chính grant đó × phân công lớp/kỹ năng**.
Chỉ grant có `branch_id` để trống mới là toàn hệ thống.

**Bỏ phân công không phải là xoá:** dòng cũ đóng lại theo ngày, nên báo cáo cũ đọc lại vẫn
thấy đúng ai dạy lúc đó, và điểm đã nhập giữ nguyên tên người nhập.

## 7. Phân công giáo viên

- **Mỗi kỹ năng đúng một giáo viên.** Một giáo viên dạy được nhiều kỹ năng.
- **Mỗi lớp đúng một GVCN**, và GVCN **phải dạy ít nhất một kỹ năng ở chính lớp đó** — chủ nhiệm
  một lớp mà không dạy em nào buổi nào thì không có căn cứ nào để nhận xét và theo dõi.

## 8. Tài khoản và đăng nhập

- **Email + mật khẩu**, mật khẩu băm scrypt với muối riêng từng người.
- **Chỉ email đuôi `.pisa@gmail.com`** hợp lệ, áp cho **mọi vai**. Kiểm ở máy chủ, không chỉ ở ô nhập.
- Tài khoản Quản trị hệ thống mặc định: `dovutuanphong95.pisa@gmail.com`, mật khẩu ban đầu `pisa2026`.
- **GV tự đăng ký** khai chi nhánh mình hoạt động → vào hàng đợi. Chưa duyệt thì **chưa có vai trò nào**.
  Người duyệt **sửa được** danh sách chi nhánh trước khi đồng ý. Từ chối thì **bắt buộc ghi lý do**.
- **Không gửi email thật, không có luồng quên mật khẩu.** Quên thì Quản trị hệ thống đặt lại hộ.
- Một người mang được **nhiều vai ở nhiều chi nhánh**: Quản lý **được** giảng dạy, Admin CN **không**,
  Giáo viên có thể kiêm vai Quản lý.
- **Lộ trình và loại lớp là dữ liệu**, Quản trị hệ thống sửa được. **Không có nút xoá** — chỉ ngừng
  dùng, vì xoá một thứ đang có lớp dùng là làm hỏng lịch sử của chính những em đó.

---

## 9. Còn treo — cần bạn quyết khi có dịp

| Điểm | Đang làm tạm | Vì sao cần chốt |
|---|---|---|
| **Phạm vi hạn nhập điểm riêng** | Áp cho **cả lượt**, không tách từng kỹ năng. Đổi lịch thì **giữ** hạn riêng | Nguồn chỉ nói "được đặt deadline khác" |
| **Speaking ngoài tuần kế hoạch** | **Từ chối**; muốn xếp ngoài tuần thì Quản lý đổi tuần trước | Tránh âm thầm đổi tuần qua đường xếp ngày |
| **Dòng nhập hàng loạt ngoài phạm vi** | Bỏ qua dòng đó kèm lý do, **không** làm hỏng cả lô | Nếu muốn chặt hơn (sai một dòng huỷ cả lô) thì nói |
| **Lộ trình khi bảng nhập bỏ trống** | Kế thừa lộ trình của **lớp** | Sai nếu một lớp chứa học viên nhiều lộ trình khác nhau |
| **Lưu trữ học viên** | 14 ngày kể từ `finished_at`; chỉ ẩn khỏi danh sách, **không** đóng lịch/case còn dở | Mốc chính xác và quyền khôi phục |
| **Kỹ năng không mock ở mức task** | Bỏ Writing là bỏ **cả W1 và W2** | Nếu chỉ cần mock một task thì phải có quy tắc tính W riêng |
| **Chuyển lớp khi lớp Normal hết chương trình** | **Đã chốt vòng 5:** hệ thống dựng sẵn **lớp nháp** của chương trình kế tiếp và **chọn sẵn cả lớp**; người phụ trách xác nhận thì mới chuyển. Vẫn **không tự chuyển ai** | — |
| **Case còn mở sau khi chuyển lớp** | Case cũ **không mất**: bảng lớp mới hiện nhãn **"n case bàn giao"** riêng, và nó **không** bị tính thành mức SOS của lớp mới — mức SOS là kết luận của một lượt trong một chương trình | — |
| **Sửa bảng quyền theo vai** | **Đã làm vòng 5:** bấm một ô là bật/tắt ngay, ghi nhật ký từng lần. Hai quyền `admin.config` và `student.view` của vai Quản trị hệ thống KHÔNG gỡ được | — |
| **Tab Báo cáo tuần** | **Bỏ tạm** (owner chốt mục 12). Chức năng Quản lý giao việc cho GV thì giữ, chuyển vào Thực trạng | Khi nào cần lại thì mở, mã và dữ liệu vẫn còn |
| **Đánh giá điểm của GV ngoài luồng case** | **Bỏ hẳn** — điểm GV ước lượng chỉ còn trong phần cập nhật kết quả case | Owner nêu hai hướng ở mục 7.17, chọn hướng gọn hơn |
| **Báo cáo "đúng trạng thái tại cuối tuần trước"** | **Không làm** đợt này (owner chốt mục 4.1). Mở một tuần cũ thì kết quả Test thuộc tuần đó, còn tình hình xử lý case ghi rõ là **"tình trạng hiện tại"** | Dựng lại ảnh chụp quá khứ cần lưu lịch sử trạng thái từng ngày — một việc lớn và chưa cần |
| **Cột "Trễ chấm TB"** | **Bỏ** khỏi bảng theo tuần. Hệ thống chỉ biết **tuần kế hoạch**, không biết ngày làm bài, nên một cột nói *"số ngày từ ngày làm bài"* là nói sai cách nó được tính | Muốn có lại thì phải khai ngày làm bài của từng lượt |
| **Ngày sinh học viên** | Vẫn lưu và sửa được, nhưng **không** còn lên badge *"Thiếu thông tin"*: nó là thông tin hành chính, không cản trở buổi dạy hay việc đánh giá nào | — |
