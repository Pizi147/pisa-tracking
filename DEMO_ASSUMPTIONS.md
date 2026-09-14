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
| **Hạn làm một phương án** | Suy từ mức gấp: **7 · 5 · 3 ngày** (bình thường · cần chú ý · gấp). Dùng chung cho cả hạn Quản lý trả lời đề xuất |
| **Hạn cập nhật kết quả case** | **Hết tuần MT tiếp theo**, đổi được |

## 3. Case — mô hình vòng 4

Đây là chỗ vòng 4 **đảo ngược** vòng 3, nên đọc kỹ ba dòng đầu.

| | |
|---|---|
| **Một case** | = **một học viên × một hạng mục**. Sáu hạng mục: `L · R · W1 · W2 · S · Ý thức/Khác`. Không hơn |
| **Case sống suốt khoá** | MT2 yếu lại ở đúng hạng mục đó thì **mở lại chính nó** và thêm một mốc, KHÔNG mở case mới. Tên case đổi theo lượt mới nhất |
| **Mức 0 là mức hợp lệ** | Chấm lại một bài cũ thành đạt thì case **hạ về 0 và mang mốc "đã đạt lại"**, không bị xoá — xoá là mất luôn những việc đã làm cho em vì nó |
| **Tên case** | `MT2 - Listening dưới kỳ vọng`. Case Ý thức sinh sau MT tên là `MT2 - Trao đổi sau SOS 2` — nói đúng việc phải làm |
| **Case GV báo** | `sos_level` để **trống** — SOS là số kỹ năng dưới kỳ vọng ở một bài, giáo viên không có bài nào để đếm. Mức gấp là thang riêng |
| **Case trùng** | GV báo lại một hạng mục đã có case chưa xong → hệ thống **hỏi trước**: ghi vào case đang có (mặc định), hay mở case song song có chủ ý |
| **Quy tắc Writing** | W1 và W2 so **riêng từng task**. Nhưng nếu band Writing **gộp** đã đạt thì **không có case nào** ở cả W1 lẫn W2, dù một task dưới kỳ vọng |
| **Chốt kết quả case** | Chỉ chốt được khi **mọi phương án** đã có kết quả. Bốn mức: *đã tốt hơn hẳn · có tiến bộ · chưa chuyển biến · tệ hơn*, kèm ô ghi chú |

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
| **Chuyển lớp khi lớp Normal hết chương trình** | Hệ thống **chỉ báo** "N em cần xếp lớp tiếp" và bày hai đường đi; **không tự chuyển ai** | Nếu muốn chuyển cả nhóm một lần thì cần một màn riêng |
| **Tab Báo cáo tuần** | **Bỏ tạm** (owner chốt mục 12). Chức năng Quản lý giao việc cho GV thì giữ, chuyển vào Thực trạng | Khi nào cần lại thì mở, mã và dữ liệu vẫn còn |
| **Đánh giá điểm của GV ngoài luồng case** | **Bỏ hẳn** — điểm GV ước lượng chỉ còn trong phần cập nhật kết quả case | Owner nêu hai hướng ở mục 7.17, chọn hướng gọn hơn |
