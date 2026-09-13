# Bấm thử: mười bốn luồng đáng xem

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

Chín lớp, 62 học viên, năm chi nhánh. Không lớp nào thừa:

| Lớp | Tình huống |
|---|---|
| `MB-FT 101` | MT3 rơi đúng **tuần này**, chưa có ngày → việc của Admin CN hôm nay |
| `MB-FT 102` | MT2 tuần này **đã có ngày** → để so với lớp trên |
| `MB-FOU 12` | Tuần học 8/8 → **đang trong tuần Final Test** |
| `BC-FT 205` | MT2 **tuần trước** vẫn chưa có ngày → đã quá hạn |
| `BC-ELE 01` | Tuần học 5/10 → **đang trong tuần Progress Test**; và lớp này **chưa có GVCN** |
| `CP-FT 110` | Ba đợt MT đã xong → **case kéo dài qua ba lượt** |
| `HD-FT 302` | Lớp **mới mở**, chưa có kết quả nào; **thiếu GV W1 và W2** |
| `UB-FT 401` | Bốn đợt MT, đợt cuối vừa thi tuần trước |
| `UB-FOUND 07` | **Đã học hết 8 tuần** → sáu em cần xếp lớp tiếp. Mã lớp cố ý giữ chữ cũ "FOUND" |

---

## 1 · Mỗi vai thấy một màn hình khác nhau

Mở **Tổng quan** lần lượt bằng ba tài khoản:

| Vai | Phải thấy |
|---|---|
| `huy.le.pisa@gmail.com` — Giáo viên Monbay | Nhập điểm · Kết quả sau hỗ trợ · Phương án hỗ trợ |
| `ha.tran.pisa@gmail.com` — Quản lý Monbay | Thêm **Việc cần lưu ý** và **Chờ duyệt phương án**, và tab thứ hai **Thực trạng** |
| `khoa.dang.pisa@gmail.com` — Admin CN Monbay | **Chỉ** Cập nhật ngày MT, và không có bộ lọc case nào |

Đây là lọc **ở máy chủ**, không phải ẩn nút: việc bạn không có quyền làm thì không được trả về.

Nhãn quá hạn nói rõ **quá hạn cái gì** — *Quá hạn nhập điểm*, *Quá hạn hỗ trợ*, *Quá hạn duyệt* —
chứ không phải một chữ "Quá hạn" trơ trọi.

## 2 · Ba thông báo của lớp Normal

Vai **Quản trị hệ thống** → **Tổng quan**. Nhóm **Mốc của lớp** có đúng ba dòng:

- `UB-FOUND 07` — *Đã học hết 8 tuần, 6 học viên cần xếp lớp tiếp (Beginner hoặc Fulltime IELTS)*
- `MB-FOU 12` — *Final Test tuần này · đang ở tuần 8/8*
- `BC-ELE 01` — *Progress Test tuần này · đang ở tuần 5/10*

Bấm **Xếp lớp tiếp theo** ở dòng đầu → panel **Tiến độ lớp** mở ra, nói rõ còn bao nhiêu em và
hai đường đi. **Hệ thống không tự chuyển ai** — nó chỉ nói "đến lúc rồi".

## 3 · Bảng "Việc cần lưu ý"

Vai **Quản trị hệ thống** → **Tổng quan**. Bảng ngay dưới tiêu đề:

- Chưa chọn chi nhánh → mỗi hàng là một **chi nhánh**, hàng cuối là tổng.
- Bấm tiêu đề cột **Quá hạn cập nhật case** → sắp từ cao xuống thấp; bấm lại → đảo chiều.
  Hàng tổng **không** bị cuốn theo.
- Bấm một con số → sang **Học viên** với đúng bộ lọc tạo nên con số đó.
- Chọn một chi nhánh ở ô trên cùng bên phải → hàng đầu thành **Cả chi nhánh**, dưới là hai nhóm
  **Normal** và **Fulltime IELTS**, thu gọn sẵn. Mở ra mới thấy từng lớp.
- Bấm **▾ Việc cần lưu ý** ở tiêu đề → gập cả bảng lại, phần việc của chính mình lên ngay.
- **+ Xem theo giáo viên** → bảng theo người: *MT chưa nhập · MT quá hạn nhập · Case · …*
  Cố tình **không** tô màu tốt/xấu và **không** xếp hạng.

## 4 · Bảng học viên khi mở một lớp

Vai **Quản trị hệ thống** → **Học viên** → bấm thanh lớp `MB-FT 101`.

Cột: **Học viên · Target · Ngày thi · OVR · L · R · S · W1 · W2 · Trạng thái · Việc cần làm**.

- Mỗi ô điểm có **mũi tên** so với lượt trước; rê chuột lên hiện *"Lượt trước 5.5 → lượt này 6"*.
- Rê chuột lên **tiêu đề cột** một lúc → một câu giải thích. Thử cột **OVR** và **W2**.
- Cột **Việc cần làm** chỉ hiện việc **của chính bạn**. Đổi sang một tài khoản giáo viên rồi mở
  lại cùng lớp đó — cột này ngắn hẳn đi.
- Dòng phụ dưới tên em là dải **MT1 ✓ · MT2 ✓ · MT3 W3 SEP**.
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

- Hàng **Cả chi nhánh** ở đầu, dưới là hai nhóm **Normal** và **Fulltime IELTS** thu gọn sẵn.
- Bấm tên lớp → mở **thẳng trang lớp** đó.
- Bốn bộ cột: **Mặc định · SOS · Cụ thể · Cần chú ý · Tất cả**. Chọn một bộ rồi thoát, đăng nhập lại
  → **vẫn là bộ đó**; đăng nhập bằng người khác → bộ mặc định.
- Đổi sang tab **Theo tuần** → bảng xu hướng, gom theo **tháng**, mỗi hàng tháng mang tổng của tháng.
  Bốn khoảng: **4 tuần · 8 tuần · 12 tuần · 6 tháng**.
- Cộng thử cột **Đạt + SOS 1 + SOS 2 + SOS 3** ở một tuần bất kỳ — đúng bằng cột **Lượt MT**.

## 7 · Bộ lọc của Thực trạng

Trong khối **Lọc**:

- Không còn bộ lọc "Đầu mục". Thay bằng **Loại lớp**: *Tất cả · Normal · Fulltime IELTS*.
- Chọn một loại lớp → bộ lọc **Cụ thể** mới hiện ra, kỹ năng trước rồi tới ý thức.
  Chưa chọn loại lớp thì không hiện, vì danh sách "cụ thể" của hai loại lớp khác nhau.
- Số trên mỗi chip đếm **trong loại lớp đang chọn** — bấm vào ra đúng bấy nhiêu dòng.
- Case **Pronunciation** của lớp Foundation gộp vào cột **S**; case **Writing** của lớp Normal gộp
  vào **W2**. Xem bộ cột **Cụ thể** để kiểm.

## 8 · Case sống suốt khoá

Vai **Quản trị hệ thống** → **Học viên** → lớp `CP-FT 110` → mở một em có SOS.

- Hồ sơ em có **bảng sáu hạng mục**: `L · R · W1 · W2 · S · Ý thức/Khác`. Hạng mục đang ổn vẫn có
  mặt, ghi *"Không có case"* — để nhìn một lần là biết cả bức tranh.
- Mỗi hàng có **đường điểm** `5.0 → 5.5 → 6.0`, mũi tên tăng/giảm, và dòng hỗ trợ đang chạy.
- Mở một case đã kéo dài → **dòng thời gian** có nhiều mốc: *mở ở MT1 · lặp lại ở MT2 · lặp lại ở MT3*.
  Mọi phương án cũ và kết quả cũ **vẫn còn nguyên** — đó chính là thứ nói lên mức độ chưa triệt để.
- Tên case đổi theo lượt mới nhất, nhưng **vẫn là một case**.

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

Vai **Quản lý** hoặc **Admin CN** → **Học viên** → mở lớp `MB-FT 101` → **Sửa phân công**.

- Trang lớp có bảng **một kỹ năng một dòng**, kể cả kỹ năng **chưa ai dạy**. Mở `HD-FT 302` để thấy
  hai dòng *Chưa phân công* ở W1 và W2; mở `BC-ELE 01` để thấy *Chưa có GVCN*.
- Thử giao hai người cho cùng một kỹ năng → **bị chặn**.
- Thử gỡ hết kỹ năng của GVCN → **bị chặn**: chủ nhiệm một lớp mà không dạy em nào buổi nào thì
  không có căn cứ nào để nhận xét.
- Bỏ một tên rồi **Lưu**, mở lại → tên đó nằm ở **Đã từng dạy lớp này** kèm khoảng thời gian.

## 12 · Lịch MT tự đề xuất

Vai **Quản lý** → hồ sơ một em lớp FT → **Kế hoạch học**.

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

Đã kiểm chứng trên **bản sao thật**: khoá ngoại sạch, không email nào trùng, mọi tài khoản đăng
nhập được, và **chạy lại lần hai không làm gì thêm**.
