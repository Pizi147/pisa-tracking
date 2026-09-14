# Bấm thử: những luồng đáng xem

Mỗi luồng nói **vào đâu · bấm gì · phải thấy gì**. Không mô tả lại toàn bộ màn hình.

Chạy `npm run seed` rồi `npm run dev`, mở http://localhost:5173.
Ngày demo cố định là **14/09/2026** (thứ Hai, tuần W3 SEP).

**Ba cách vào:**

| | |
|---|---|
| **Đăng nhập** | `dovutuanphong95.pisa@gmail.com` · mật khẩu `pisa2026` — tài khoản Quản trị hệ thống |
| **Giáo viên đăng ký** | Tự khai chi nhánh, vào hàng đợi chờ duyệt |
| **Vào nhanh bằng tài khoản demo** | Bấm một tài khoản là vào, không cần mật khẩu — dùng cái này để đổi vai liên tục |

Mọi tài khoản mẫu dùng chung mật khẩu `pisa2026`, email theo mẫu `ten.ho.pisa@gmail.com`.

---

## Dữ liệu demo: mỗi lớp là một tình huống

Mười một lớp, 71 học viên, năm chi nhánh, đủ bốn chương trình. Không lớp nào thừa:

| Lớp | Chương trình | Tình huống |
|---|---|---|
| `MB-FT 101` | Fast Track | MT3 rơi đúng **tuần này** → việc của Admin CN hôm nay |
| `MB-FT 102` | Fast Track | MT2 tuần này, để so với lớp trên |
| `MB-FOU 12` | Foundation | Tuần học 8/8 → **đang trong tuần Final Test** |
| `BC-FT 205` | Fast Track | MT2 **tuần trước** vẫn trống điểm → đã quá hạn |
| `BC-ELE 01` | Elementary | Tuần học 5/10 → **đang trong tuần Progress Test**; lớp này **chưa có GVCN** |
| `CP-FT 110` | Fast Track | Ba đợt MT đã xong → **case kéo dài qua ba lượt** |
| `HD-FT 302` | Fast Track | Lớp **mới mở**, chưa có kết quả nào; **thiếu GV W1 và W2** |
| `HD-BE 21` | Beginner | Tuần học 7/10; **bốn em vừa từ Foundation lên**, mang theo case bàn giao |
| `HD-FOU 05` | Foundation | Đã học xong; bốn em đã lên Beginner, **hai em chưa xếp được lớp** |
| `UB-FT 401` | Fast Track | Bốn đợt MT, đợt cuối vừa thi tuần trước |
| `UB-FOUND 07` | Foundation | **Đã học hết 8 tuần** → sáu em cần xếp lớp tiếp. Mã lớp cố ý giữ chữ cũ "FOUND" |

### Mười ba tình huống case, mỗi cái một em

Dựng riêng để bấm thử từng nhánh workflow. Vào **Học viên** → mở lớp → mở em.

| Xem gì | Lớp | Mở hồ sơ em rồi tìm |
|---|---|---|
| Case **tên tự nhập**, chưa có phương án nào | `CP-FT 110` | *Đọc chậm, không kịp bài Reading* — nút **Hoàn thành case** mờ, có ghi rõ còn thiếu gì |
| **Hai case cùng một kỹ năng** mở song song | `MB-FT 101` | *Phát âm đuôi -s, -ed* và *Vốn từ Speaking* — cái thứ hai có nhãn **Song song** |
| **Tái phát** sau khi đã chốt xong | `UB-FT 401` | *Nghe sót số và tên riêng* (đã hoàn thành) và bản **Tái phát sau MT4** nối vào nó |
| **Ba chu kỳ nối tiếp** trên một phương án | `CP-FT 110` | *Writing Task 2 lạc đề* — chu kỳ 1 tiến bộ một phần, chu kỳ 2 chưa đổi, chu kỳ 3 đang chạy |
| Phương án **bị thay thế** | `BC-FT 205` | *Reading sai dạng T/F/NG* — phương án cũ ghi **Được thay thế**, không phải đã thành công |
| **Xin hỗ trợ Quản lý** | `BC-FT 205` | *Em gần như không nói trong giờ Speaking* — chu kỳ dừng, chờ Quản lý |
| **Hạn 14/09 → 27/09** | `MB-FT 102` | *Writing Task 1 thiếu câu tổng quan* — mở đúng ngày demo, hạn hiện **27/09/2026** |
| Chu kỳ **chỉ chạy từ lúc được duyệt** | `UB-FT 401` | *Cần học thêm ngoài giờ cho Writing* — gửi 24/08, duyệt 07/09, hạn tính từ 07/09 |
| Quản lý **không duyệt**, có lý do | `HD-FT 302` | *Đề nghị chuyển em sang lớp khác* — kèm hướng sửa và một phương án thay thế |
| **Điểm giáo viên tự chấm** | `MB-FT 101` | *Task 1 mô tả số liệu rời rạc* → tab **Hành trình học tập** → hình thoi rỗng trên biểu đồ |
| Case **Ý thức/Khác** đóng với kết quả xấu | `CP-FT 110` | *Không làm bài về nhà ba tuần liền* — đã đóng, kết quả **Kém hơn**, không tô xanh |
| **FOU → BE** chuyển cả lớp | `HD-BE 21` | Bốn em có nhãn **case bàn giao**; mở hồ sơ → **Toàn bộ hành trình** thấy cả lớp cũ |
| **BE → FT** chuyển một em vào lớp có sẵn | `HD-FT 302` | Em chuyển vào giữa chừng, lộ trình Fast Track mới với target riêng |

## 1 · Mỗi vai thấy một màn hình khác nhau

Mở **Tổng quan** lần lượt bằng ba tài khoản:

| Vai | Phải thấy |
|---|---|
| `huy.le.pisa@gmail.com` — Giáo viên Monbay | Nhập điểm · Kết quả sau hỗ trợ · Phương án hỗ trợ |
| `ha.tran.pisa@gmail.com` — Quản lý Monbay | Thêm **Việc cần lưu ý** và **Chờ duyệt phương án**, và tab thứ hai **Thực trạng** |
| `khoa.dang.pisa@gmail.com` — Admin CN Monbay | Không có bộ lọc case nào; thấy "Cần nhập điểm MT" nhưng chỉ để đôn đốc |

Đây là lọc **ở máy chủ**, không phải ẩn nút: việc bạn không có quyền làm thì không được trả về.

Nhãn quá hạn nói rõ **quá hạn cái gì** — *Quá hạn nhập điểm*, *Quá hạn hỗ trợ*, *Quá hạn duyệt* —
chứ không phải một chữ "Quá hạn" trơ trọi.

## 2 · Ba thông báo của lớp Normal

Vai **Quản trị hệ thống** → **Tổng quan**. Nhóm **Mốc của lớp** có đúng ba dòng:

- `UB-FOUND 07` — *Đã học hết 8 tuần, 6 học viên cần xếp lớp tiếp (Beginner hoặc Fast Track)*
- `MB-FOU 12` — *Final Test tuần này · đang ở tuần 8/8*
- `BC-ELE 01` — *Progress Test tuần này · đang ở tuần 5/10*

Bấm **Xếp lớp tiếp theo** ở dòng đầu → panel **Chuyển tiếp lên lớp sau** mở ra, nói rõ còn bao
nhiêu em và hai đường đi. **Hệ thống không tự chuyển ai** — nó chỉ nói "đến lúc rồi", dựng sẵn
lớp nháp và chọn sẵn cả lớp, rồi chờ người phụ trách xác nhận.

## 3 · Bảng "Việc cần lưu ý"

Vai **Quản trị hệ thống** → **Tổng quan**. Bảng ngay dưới tiêu đề:

- Chưa chọn chi nhánh → mỗi hàng là một **chi nhánh**, hàng cuối là tổng.
- Bấm tiêu đề cột **Quá hạn cập nhật case** → sắp từ cao xuống thấp; bấm lại → đảo chiều.
  Hàng tổng **không** bị cuốn theo.
- Bấm một con số → sang **Học viên** với đúng bộ lọc tạo nên con số đó.
- Chọn một chi nhánh ở ô trên cùng bên phải → hàng đầu thành **Cả chi nhánh**, dưới là hai nhóm
  **Normal** và **Fast Track**, thu gọn sẵn. Mở ra mới thấy từng lớp.
- Bấm **▾ Việc cần lưu ý** ở tiêu đề → gập cả bảng lại, phần việc của chính mình lên ngay.
- **+ Xem theo giáo viên** → bảng theo người: *MT chưa nhập · MT quá hạn nhập · Case · …*
  Cố tình **không** tô màu tốt/xấu và **không** xếp hạng.

## 4 · Bảng học viên khi mở một lớp

Vai **Quản trị hệ thống** → **Học viên** → bấm thanh lớp `MB-FT 101`.

Cột: **Học viên · Target · Dự kiến thi · OVR · L · R · S · W1 · W2 · Trạng thái · Việc cần làm**.

- Cột **Dự kiến thi** nói đúng mức chắc chắn đang có, không nói hơn: `W2 FEB 2027` khi đã chốt
  tuần, `DEC 2026 · chưa xác định tuần` khi mới biết tháng, `Chưa xác định` khi chưa biết gì.
  Chỉ khi đã có tuần mới có đếm ngược — biết mỗi tháng mà vẫn hiện "còn 134 ngày" là bịa.

- Mỗi ô điểm có **mũi tên** so với lượt trước; rê chuột lên hiện *"Lượt trước 5.5 → lượt này 6"*.
- Rê chuột lên **tiêu đề cột** một lúc → một câu giải thích. Thử cột **OVR** và **W2**.
- Cột **Việc cần làm** chỉ hiện việc **của chính bạn**. Đổi sang một tài khoản giáo viên rồi mở
  lại cùng lớp đó — cột này ngắn hẳn đi.
- Dòng phụ dưới tên em là dải **MT1 ✓ · MT2 ✓ · MT3 W3 SEP 2026**. Mã tuần luôn kèm **năm**.
- Bấm một bộ lọc bất kỳ ở hàng trên → **lớp vẫn mở**. Trạng thái thu gọn/mở rộng là thứ bạn đã
  sắp đặt, bộ lọc chỉ đổi danh sách.

## 5 · Thanh tab chi nhánh

Vẫn ở **Học viên**, vai Quản trị hệ thống: thanh **Tất cả · Monbay · Bãi Cháy · Cẩm Phả · Hải Dương ·
Uông Bí** ngay dưới tiêu đề. Một cú bấm thay cho ba động tác của ô select, và nhìn là biết mình
có mấy chi nhánh.

Badge trên thanh lớp **căn phải**, nên mắt quét dọc một cột thay vì nhặt chúng ở mỗi dòng một chỗ.

## 6 · Thực trạng — hai chế độ xem

Vai `ha.tran.pisa@gmail.com` (Quản lý Monbay) → **Tổng quan → Thực trạng**.

Vào thẳng **góc nhìn theo lớp**, không phải bấm thêm: người quản một chi nhánh mà phải bấm vào
chi nhánh của chính mình là một cú bấm thừa lặp lại mỗi ngày.

- Hàng **Cả chi nhánh** ở đầu, dưới là hai nhóm **Normal** và **Fast Track** thu gọn sẵn.
- Bấm tên lớp → mở **thẳng trang lớp** đó.
- Bốn bộ cột: **Mặc định · SOS · Cụ thể · Cần chú ý · Tất cả**. Chọn một bộ rồi thoát, đăng nhập lại
  → **vẫn là bộ đó**; đăng nhập bằng người khác → bộ mặc định.
- Đổi sang tab **Theo tuần** → bảng xu hướng, gom theo **tháng**, mỗi hàng tháng mang tổng của tháng.
  Bốn khoảng: **4 tuần · 8 tuần · 12 tuần · 6 tháng**.
- Cộng thử cột **Đạt + SOS 1 + SOS 2 + SOS 3** ở một tuần bất kỳ — đúng bằng cột **Lượt MT**.

## 7 · Bộ lọc của Thực trạng

Trong khối **Lọc**:

- Không còn bộ lọc "Đầu mục". Thay bằng **Loại lớp**: *Tất cả · Normal · Fast Track*.
- Chọn một loại lớp → bộ lọc **Cụ thể** mới hiện ra, kỹ năng trước rồi tới ý thức.
  Chưa chọn loại lớp thì không hiện, vì danh sách "cụ thể" của hai loại lớp khác nhau.
- Số trên mỗi chip đếm **trong loại lớp đang chọn** — bấm vào ra đúng bấy nhiêu dòng.
- Case **Pronunciation** của lớp Foundation gộp vào cột **S**; case **Writing** của lớp Normal gộp
  vào **W2**. Xem bộ cột **Cụ thể** để kiểm.

## 8 · Case sống suốt khoá

Vai **Quản trị hệ thống** → **Học viên** → lớp `CP-FT 110` → mở một em có SOS.

Hồ sơ có **ba tầng**, đọc từ trên xuống là ra kết luận:

1. **Theo dõi hỗ trợ theo kỹ năng** — sáu hạng mục `L · R · W1 · W2 · S · Ý thức/Khác`, hạng mục
   đang ổn vẫn có mặt và ghi *"Không có case"*. Ô đó là **màu xám**, không phải xanh: chưa ai mở
   case không đồng nghĩa học tốt.
2. **Các case của em** — mỗi case một **khối riêng, mở đóng độc lập**. Case đang xử lý mặc định
   mở, case đã hoàn thành thu gọn. Mở một case không đóng case khác. Có bộ lọc hạng mục và hai
   phạm vi: **Lộ trình này** và **Toàn bộ hành trình**.
3. **Mock Test | Hành trình học tập** — bảng điểm, và biểu đồ tiến bộ kèm dòng thời gian.

Trong một case: phần đang làm nổi bật nhất, chu kỳ cũ thu gọn thành dòng kết quả. **Không còn
node "Mở case"** — ngày mở và người tạo đã ở ngay đầu case.

Tên case tự sinh đổi theo lượt mới nhất, nhưng **vẫn là một case**. Case do người tạo đặt tên thì
giữ nguyên tên đó ở mọi màn.

## 9 · Cảnh báo case trùng

Vai giáo viên → hồ sơ một em đã có case Listening chưa xong → **+ Case** → chọn Listening.

Hệ thống **hỏi trước**: ghi vào case đang có, hay mở một case song song vì đây là vấn đề khác.
Mặc định là **ghi vào case đang có** — đó là điều đúng trong đa số trường hợp.

## 10 · Đề xuất và duyệt

Vai `quan.dang.pisa@gmail.com` (Quản lý Bãi Cháy). Màn Tổng quan có **Chờ duyệt phương án** với
nhãn **Quá hạn duyệt** — case đó ở mức *Gấp* nên Quản lý chỉ có **3 ngày**, hạn 06/09 mà nay đã 14/09.

1. Bấm dòng đó → phương án mang nhãn **Chờ Quản lý duyệt · hạn …**, và **chưa** có nút
   *Cập nhật kết quả*: đang chờ thì việc thật chưa diễn ra.
2. **Trả lời đề xuất** → **Góp ý** → nhãn **vẫn là** đang chờ. Góp ý không xoá nợ.
3. Trả lời lại → **Duyệt** → nhãn đổi, nút *+ Cập nhật kết quả* xuất hiện.
4. Thử trả lời lần ba → **bị chặn**. Đổi ý thì đề xuất lại, để hồ sơ giữ cả lý do lần trước.

Bốn trạng thái đều có sẵn trong dữ liệu mẫu: chờ duyệt còn hạn (`CP-FT 110`), chờ duyệt quá hạn
(`BC-FT 205`), đã duyệt (`MB-FT 102`), không duyệt kèm lý do (`HD-FT 302`).

## 11 · Phân công giáo viên

Vai **Quản lý** hoặc **Admin CN** → **Học viên** → mở lớp `MB-FT 101` → **Quản lý lớp** →
**Phân công giáo viên**.

- Trang lớp có bảng **một kỹ năng một dòng**, kể cả kỹ năng **chưa ai dạy**. Mở `HD-FT 302` để thấy
  hai dòng *Chưa phân công* ở W1 và W2; mở `BC-ELE 01` để thấy *Chưa có GVCN*.
- Thử giao hai người cho cùng một kỹ năng → **bị chặn**.
- Thử gỡ hết kỹ năng của GVCN → **bị chặn**: chủ nhiệm một lớp mà không dạy em nào buổi nào thì
  không có căn cứ nào để nhận xét.
- Bỏ một tên rồi **Lưu**, mở lại → tên đó nằm ở **Đã từng dạy lớp này** kèm khoảng thời gian.

## 12 · Lịch MT tự đề xuất

Vai **Quản lý** → hồ sơ một em lớp FT → **Quản lý học viên** → **Kế hoạch học**.

- Khai **tuần bắt đầu học** → bảng bên dưới đề xuất **MT1 · MT2 · MT3** đúng mốc tuần học **6 · 12 · 16**.
- Cột **Hiện tại** nói trước từng lượt sẽ ra sao: *Chưa có, sẽ tạo · Sẽ dời sang tuần đề xuất ·
  Quản lý đã chốt, giữ nguyên · Đã làm xong, giữ nguyên*.
- Bấm **Áp lịch** → lượt Quản lý đã chốt tay và lượt đã làm xong **đứng yên**.

Panel **Lên kế hoạch MT** (nút ở tab Học viên): chuyển tuần bằng hai mũi tên ← →, gõ tìm tên học
viên, chọn **MT khác nhau cho từng em** rồi xếp chung một tuần. Lượt đã làm xong là ô xám không bấm được.

## 13 · Tài khoản: tự đăng ký và duyệt

1. Thoát tài khoản → tab **Giáo viên đăng ký**. Thử email `abc@gmail.com` → bị chặn, chỉ đuôi
   `.pisa@gmail.com` mới hợp lệ.
2. Đăng ký đúng → màn hình nói **đang chờ duyệt**. Thử đăng nhập ngay → báo đúng là đang chờ,
   không phải "sai mật khẩu".
3. Đăng nhập bằng `dovutuanphong95.pisa@gmail.com` / `pisa2026` → menu tài khoản →
   **Quản trị hệ thống** → tab **Tài khoản**.
4. Hàng đợi có đăng ký vừa rồi. **Sửa lại chi nhánh** (thêm BC chẳng hạn) rồi **Duyệt**.
5. Đăng nhập lại bằng tài khoản vừa duyệt → vào được, và có đúng hai chi nhánh.

Thử **Không duyệt** với một đăng ký khác: bắt buộc ghi lý do, và người đăng ký đọc đúng câu đó
khi thử đăng nhập.

## 14 · Quyền cấp riêng cho một người

Vẫn ở **Quản trị hệ thống → Tài khoản**: tìm `ha.tran.pisa@gmail.com` (Quản lý Monbay) → **Sửa**.

1. **+ Cấp thêm quyền** → chọn *Xem lịch và kết quả MT* → phạm vi **Toàn hệ thống** → **Lưu**.
2. Đổi sang tài khoản đó → nay xem được lớp của **cả năm chi nhánh**, không chỉ Monbay.
3. Nhưng vẫn **không chốt được tuần** ở chi nhánh lạ — quyền xem riêng không kéo theo quyền sửa.
4. Gỡ quyền đó ra → trở lại như cũ ngay.

Đây chính là ví dụ owner đưa ra: sửa vai "Quản lý" là sửa cho **tất cả** Quản lý, nên phải có
đường cấp riêng cho một người.

## 15 · Lộ trình và loại lớp là dữ liệu

**Quản trị hệ thống → Lộ trình và loại lớp**.

- Thêm lộ trình `LT3` → mở panel **Tạo lớp**, `LT3` đã có trong ô chọn lộ trình.
- Cột **Đang dùng** của `LT1` khác 0 → **không có nút xoá**, chỉ có ngừng dùng. Ngừng dùng rồi thì
  `LT1` biến khỏi ô chọn khi tạo mới, nhưng lớp cũ vẫn đọc được bình thường.
- Mở loại lớp `FOU` → **cách chấm** và **bộ kỹ năng** bị khoá, kèm câu giải thích vì sao: đổi cách
  chấm là đổi ý nghĩa của mọi điểm đã nhập từ trước.
- Tên, số tuần và hai mốc kiểm tra thì sửa thoải mái.

## 16 · Hồ sơ cá nhân

Menu tài khoản → **Hồ sơ cá nhân**. Sửa được họ tên, điện thoại, **kỹ năng phụ trách được** và
**email phụ**. Đổi mật khẩu phải nhập mật khẩu hiện tại.

Hai ô cố ý **không** sửa được, và màn hình nói rõ vì sao thay vì chỉ làm mờ: **email đăng nhập**
(đổi là đổi danh tính tài khoản) và **vai trò** (tự cấp cho mình thì bước duyệt thành vô nghĩa).

"Kỹ năng phụ trách được" là **năng lực**, dùng để gợi ý khi phân công — khác hẳn "đang dạy kỹ năng
nào ở lớp nào", và không cho quyền nhập điểm.

## 17 · Hai nút thay cho sáu

**Đầu hồ sơ học viên** chỉ còn **+ Case** và **Quản lý học viên**. Bấm nút thứ hai → panel bên
phải liệt kê năm việc quản trị: *Kế hoạch học · Điểm đầu vào · Đổi mục tiêu · Kết luận lộ trình ·
Chuyển lớp*. Chọn một việc thì **thân panel đổi ngay tại chỗ**, có nút *← Chọn việc khác* quay lại.
Không có modal chồng lên modal.

**Đầu trang lớp** giữ **Nhập điểm cả lớp** ở nguyên chỗ cũ — đó là việc hằng ngày. Ba việc quản trị
gom vào **Quản lý lớp**: *Tiến độ lớp · Phân công giáo viên · Chuyển tiếp lên lớp sau*.

Trong case, **một nút cho một việc**: *Cập nhật kết quả* hỏi đủ ba câu — kết quả, ghi chú, bước tiếp
theo. Ba nút cũ (*Đánh dấu đã làm*, *Ghi quan sát*, *Hướng xử lý*) đã gộp vào đây.

## 18 · Sáu họ nhãn, hai luật màu

Nhìn một dòng bất kỳ là phân biệt được sáu loại thông tin bằng **hình dạng trước, màu sau**:

| Họ | Ví dụ | Hình thức |
|---|---|---|
| Mức độ | `SOS 1` `SOS 3` | Nền đặc, bo tròn hẳn |
| Trạng thái xử lý | `▶ Đang xử lý` `◷ Chờ QL duyệt` `✓ Đã hoàn thành` | Nền nhẹ, có biểu tượng |
| Việc cần làm | `Nhập điểm L, R` | Viền vuông, gạch dọc bên trái, bấm được |
| Cảnh báo | `⚠ Quá hạn` `⚠ Thiếu 2 thông tin` | Dấu tam giác, màu mạnh |
| Kết quả | `✓ Tiến bộ rõ rệt` `↓ Kém hơn` | Biểu tượng kết quả |
| Thông tin | `GVCN` `Speaking` `LT2` | Chữ mờ, viền mảnh |

Hai luật không được phá:

- **Xanh lá chỉ dành cho KẾT QUẢ.** *"Đã lưu"*, *"đã hoàn thành phương án"*, *"không có case"* đều
  không phải tin tốt — chúng chỉ là việc đã xong hoặc chưa có tin gì.
- **Màu không bao giờ đứng một mình.** Mỗi họ có hình dạng và biểu tượng riêng, nên người không
  phân biệt được màu vẫn đọc ra nghĩa.

Chỗ nhìn rõ nhất: mở `CP-FT 110` → một em có case đã đóng với kết quả *Kém hơn*. Trạng thái ghi
**Đã hoàn thành** (xám), kết quả ghi **↓ Kém hơn** (đỏ). Hai thông tin khác nhau, không gộp.

## 19 · Biểu đồ tiến bộ

Hồ sơ một em lớp FT → tab **Hành trình học tập**.

- Chọn từng kỹ năng. Lớp Fast Track vẽ **band** kèm **đường kỳ vọng** nét đứt của từng mốc; lớp
  Normal vẽ **điểm gốc** dạng `13/30`.
- **Hình thoi rỗng** là điểm giáo viên tự chấm khi cập nhật case. Nó **đứng riêng, không nối vào
  đường điểm chính thức** — hai loại điểm không chấm bằng cùng một thước.
- Kỹ năng mới có **một mốc** thì màn hình nói thẳng *"Chưa đủ dữ liệu"* thay vì vẽ một chấm rồi
  để người xem tự tưởng tượng ra xu hướng.
- Đổi lộ trình ở đầu trang là đổi cả biểu đồ: hai chương trình chấm trên hai thang khác nhau nên
  không trộn vào một hình.

## 20 · Tổng quan — một khu "Việc cần làm"

Vai **Giáo viên** → **Tổng quan**.

Bản trước là bảy danh sách mở đồng thời, trang rất dài, mọi dòng nổi bật ngang nhau. Nay:

- **Dải ô số** vẫn ở trên đầu, nhưng **bấm là lọc** chứ không nhảy xuống một cái hộp khác.
  Con số nào thì ra đúng danh sách tạo nên con số đó. Bộ lọc nằm trên địa chỉ trang, nên gửi
  đường dẫn cho người khác vẫn ra đúng danh sách ấy.
- **Một khu duy nhất** bên dưới, với ba chiều lọc đứng cạnh nhau:
  *Tất cả · Quá hạn · Đến hạn · Chờ duyệt* · loại việc · **Việc của tôi / Cả phạm vi quản lý**.
  Mỗi nút kèm số đếm, và số đếm tính trong phạm vi đang chọn — bấm vào không bao giờ ra rỗng.
- **Một dòng năm ô**: học viên hoặc lớp · việc cần làm · người phụ trách · hạn · trạng thái.
  Trước đây ba ô sau nằm lẫn trong một câu văn nên không lọc và không quét bằng mắt được.
- Danh sách dài thì **Xem thêm**, và **luôn hiện tổng số**.

Giáo viên mở lên thấy **việc của mình** trước. Quản lý bấm một cái là sang cả phạm vi mình
quản — trừ khi hôm đó không có việc nào mang tên mình, thì mở thẳng vào toàn phạm vi chứ
không cho một màn hình trống.

## 21 · Sửa bảng quyền theo vai

Vai **Quản trị hệ thống** → **Quản trị hệ thống** → tab **Quyền và nhật ký**.

- Bấm thẳng vào một ô trong bảng là **bật/tắt ngay**, không có nút *Lưu* riêng. Người mang vai
  đó làm được hay không làm được việc đó **ngay lập tức**, không cần đăng nhập lại.
- Mỗi lần đổi là **một dòng nhật ký** ở cuối trang, ghi cả trạng thái trước và sau.
- Thử bỏ tick **Cấu hình hệ thống** hoặc **Xem học viên** của vai *Quản trị hệ thống* →
  **bị chặn**: gỡ xong thì không còn ai vào lại được chính màn này.
- Đổi bằng tài khoản không phải Quản trị hệ thống → **bị chặn**.

## 22 · Chú thích tiêu đề cột

Đưa chuột lên tiêu đề cột ở bất kỳ bảng nào → hiện một câu nói rõ **cột đó đang đếm cái gì**.

Những chỗ dễ hiểu nhầm nhất đều có: *Lớp lúc đánh giá* (lớp em học vào lúc làm bài, không phải
lớp hiện tại) · *Kỳ vọng* (tính theo mục tiêu tại thời điểm đó) · *Tuần* của lớp Normal (tuần
học của LỚP, không phải tuần MT) · *Tình trạng nhập* (thiếu điểm khác với chưa đạt) ·
*Kết quả* (số kỹ năng dưới kỳ vọng — chính là mức SOS).

---

## Nâng cấp dữ liệu cũ

```bash
npm run migrate
```

Chuyển database cũ sang mô hình mới **không xoá gì**. Nguyên tắc: **không bịa ra một phép
tách không có căn cứ.**

- Case rải rác theo từng lượt MT được **gộp** thành một case cho mỗi `học viên × hạng mục`, giữ
  đủ mốc của từng lượt.
- Hai việc trao đổi chuyển thành phương án trong case Ý thức/Khác của chính lượt đó.
- `prep_writing` đổi thành `writing` trên cả mười bảng có nhắc tới nó.
- Thêm quyền `case.view` và cấp lại cho đúng ba vai — thiếu bước này thì tài khoản cũ mở màn
  Học viên lên sẽ mất sạch bộ lọc case.
- Đặt **email và mật khẩu** cho tài khoản cũ chưa có, và tạo tài khoản Quản trị hệ thống mặc định
  nếu chưa tồn tại — nếu không thì sau khi cập nhật, chính người chủ hệ thống là người duy nhất
  không vào được.
- Nạp bảng **lộ trình** từ danh sách viết cứng cũ.
- **Vòng 5:** bổ sung các cột của workflow chu kỳ hai tuần (`cycle_no`, `cycle_started_on`,
  `closed_reason`, `superseded_by`, `next_step`, `cycle_due`, `late`, `metrics`, `title`,
  `previous_case_id`, `previous_class_id`), rồi điền mốc bắt đầu chu kỳ cho phương án cũ theo
  ngày đã có — không bịa ra ngày mới, cũng không để trống khiến phương án cũ trông như chưa
  từng chạy. Phương án đã hoàn thành được ghi lý do khép lại là **đã xong**, không phải bị
  thay thế.

Đã kiểm chứng trên **bản sao thật**: khoá ngoại sạch, không email nào trùng, mọi tài khoản đăng
nhập được, và **chạy lại lần hai không làm gì thêm**.
