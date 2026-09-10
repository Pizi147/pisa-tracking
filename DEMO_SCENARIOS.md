# Bấm thử: mười hai luồng đáng xem

Mỗi luồng nói **vào đâu · bấm gì · phải thấy gì**. Không mô tả lại toàn bộ màn hình.

Chạy `npm run seed` rồi `npm run dev`, mở http://localhost:5173, bấm **Đổi tài khoản demo**
ở thanh trên cùng để chuyển vai. Ngày demo cố định là **23/09/2026**.

---

## 1 · Mỗi vai thấy một màn hình khác nhau

Mở **Tổng quan** lần lượt bằng ba tài khoản:

| Vai | Phải thấy |
|---|---|
| `Trần Quang Nam` — Giáo viên | Nhập điểm Test · Kết quả sau hỗ trợ · Phương án hỗ trợ |
| `Đặng Quang Vy` — Quản lý MB | Thêm **Chờ duyệt phương án**, và tab thứ hai **Tình hình chung** |
| `Đặng Ngọc Phúc` — Admin CN MB | **Chỉ** Cập nhật ngày MT |

Đây là lọc **ở máy chủ**, không phải ẩn nút: việc bạn không có quyền làm thì không được trả về.

Mỗi dòng là một học viên, một câu lý do, một nút bấm được. Nhãn quá hạn nói rõ **quá hạn cái
gì** — *Quá hạn nhập điểm*, *Quá hạn hỗ trợ*, *Quá hạn duyệt* — chứ không phải một chữ
"Quá hạn" trơ trọi.

## 2 · Ghi một nội dung cần hỗ trợ

Vai **Giáo viên** → **Học viên** → mở một em → **+ Nội dung cần hỗ trợ**.

1. Một câu mô tả là đủ để gửi.
2. **Thuộc nhóm nào** (Học thuật / Ý thức) và **Kỹ năng nào** là **bắt buộc** — không có chỗ
   cất thì vấn đề biến mất khỏi mọi bảng tổng hợp.
3. Chọn **Ý thức** → hàng kỹ năng đổi thành *Chuyên cần · BTVN · Tham gia trên lớp · Khác*.
4. Mở **+ Nguyên nhân và ghi chú** → danh sách nguyên nhân đổi theo kỹ năng đã chọn.
   Listening có *Cảm âm · Hay dính bẫy distractors · Tâm lý…*; Reading có *Tư duy logic…*
5. Ý thức **không có** tầng nguyên nhân — bốn nhóm đã là chỗ cất cuối cùng.

## 3 · Một lượt trượt nhiều kỹ năng sinh nhiều vấn đề

Vai **Quản lý** → **Tổng quan → Tình hình chung**.

- Ba ô đầu trang là **ba trạng thái loại trừ nhau**, cộng lại **đúng bằng** con số trong
  tiêu đề *Vấn đề (N)*. Cộng thử.
- Hàng **Kỹ năng** cũng cộng lại bằng đúng tổng — kể cả kỹ năng riêng của lớp thường
  (Prep-Writing, Pronunciation).
- Chọn *Listening* → các nhóm đổi số theo, nhưng **các kỹ năng khác không về 0**: số được
  tính chéo, nên vẫn đi tiếp được.
- Mở hồ sơ một em có SOS 2 → thấy **hai** vấn đề, mỗi kỹ năng một cái, mỗi cái một phương án.

## 4 · Hai việc trao đổi bắt buộc

Vẫn ở hồ sơ một em vừa có SOS: khối **Liên hệ** có đúng **hai dòng** cho lượt đó — GVCN+GVBM
gặp em, và CS gặp phụ huynh.

- Hạn là **Chủ nhật của tuần kế tiếp** tuần làm bài.
- Không có nút duyệt, không có hẹn xem lại, không có ô kết quả — chỉ **Đã trao đổi** + ghi chú.
- Một lượt trượt ba kỹ năng vẫn chỉ có **một** bộ hai việc: trao đổi là với em và với phụ
  huynh, không phải với từng kỹ năng.

## 5 · Đề xuất và duyệt

Vai `Hoàng Khánh Huy` (Quản lý Bãi Cháy). Màn Tổng quan mở ra đã có **Chờ duyệt phương án**
với nhãn **Quá hạn duyệt** — case đó ở mức *Gấp* nên Quản lý chỉ có **3 ngày**.

1. Bấm dòng đó → phương án mang nhãn **Chờ Quản lý duyệt · hạn …**, và **chưa** có nút
   *Cập nhật kết quả*: đang chờ thì việc thật chưa diễn ra.
2. **Trả lời đề xuất** → chọn **Góp ý** → nhãn **vẫn là** đang chờ. Góp ý không xoá nợ.
3. Trả lời lại → **Duyệt** → nhãn đổi, nút *+ Cập nhật kết quả* xuất hiện.
4. Thử trả lời lần ba → **bị chặn**: *"Phương án này đã được duyệt rồi."* Đổi ý thì đề xuất
   lại, để hồ sơ giữ cả lý do lần trước.

Đầu kia: vai giáo viên → **+ Ghi phương án hỗ trợ** → ô chọn có **hai nhóm**. Chọn một mục
trong **Đề xuất** (Lùi lịch thi, Meeting CX/GĐCN…) → ô tick *"cần duyệt"* **biến mất**, vì
chọn nhóm đó tức là đang xin ý kiến.

## 6 · Phân công giáo viên

Vai **Quản lý** hoặc **Admin CN** → **Học viên** → mở lớp `MB-FT 101` → **Sửa phân công**.
Vai giáo viên **không có** nút này.

- Mỗi kỹ năng là một **danh sách**, không phải một ô chọn — có lớp hai người cùng dạy một kỹ năng.
- Bỏ một tên rồi **Lưu**, mở lại → tên đó nằm ở **Đã từng dạy lớp này** kèm khoảng thời gian.
- Đổi sang chính giáo viên vừa bị bỏ → **không sửa được điểm** kỹ năng ấy nữa; các kỹ năng
  khác của họ không đổi.

## 7 · Sửa điểm không xoá lịch sử hỗ trợ

Vai `Đặng Quang Nhi` (Quản trị hệ thống) → mở một vấn đề đã có vài việc đã làm → đếm số việc
→ bấm mã MT ở đầu trang → sửa một kỹ năng lên cho **đạt kỳ vọng**.

Quay lại: **mọi việc đã làm vẫn còn**, mức hạ xuống 0, và lịch sử đổi mức nằm trong nhật ký.
Xoá vấn đề đi là mất luôn những việc đã làm cho em vì nó.

## 8 · Lịch MT tách làm hai bước

- **Quản lý** chốt **tuần** (`MT3 → W2 OCT`).
- **Admin CN** chốt **ngày** khi tới gần tuần đó — và chỉ được nhắc **khi đã tới tuần**, chứ
  không nhắc trước hàng tháng.
- Speaking có thể khác ngày nhưng vẫn là **cùng một lượt**. Lịch chỉ có ngày, không có giờ.

## 9 · Lớp thường

Mở `MB-FOUND 12`. Chấm theo **số câu đúng / tổng**, đạt từ 60% — không band, không kỳ vọng,
không Overall. Bảng điểm riêng, đặt tổng chung cho cả lớp rồi sửa từng dòng.

Lớp thường **vẫn có** hai việc trao đổi khi trượt, nhưng **không** tự sinh phương án hỗ trợ:
quy định "SOS 1–2 tự học, SOS 3 tutor" gắn với mức SOS theo band, mà lớp thường không có.

## 10 · Bảng tổng hợp và khối của Quản lý

Vai **Quản lý** → **Tổng quan**. Ngay trên việc của chính họ có khối **Chi nhánh đang tắc ở đâu**:
mỗi lớp một dòng, bốn cột (chưa nhập điểm · chưa có phương án · quá hạn cập nhật · chờ tôi duyệt).
Bấm **+ Xem theo giáo viên** để đổi sang cách nhìn theo người — cố ý **không** tô màu tốt/xấu và
**không** xếp hạng.

Sang tab **Tình hình chung**: bảng **Tổng hợp theo chi nhánh** ở trên cùng.

- Bốn **bộ cột đặt sẵn**: Mặc định · Theo kỹ năng · Cần chú ý · Tất cả. Chọn một bộ rồi đăng
  xuất, đăng nhập lại → **vẫn là bộ đó**; đăng nhập bằng người khác → bộ mặc định.
- Ô dạng `12/5` = 12 vấn đề, 5 chưa có phương án. Bấm vào số là mở đúng danh sách đó.
- Bấm một **hàng chi nhánh** → xuống tầng **lớp** của chính chi nhánh ấy.
- Cộng thử cột *Vấn đề đang mở*: hàng tổng phải bằng tổng các hàng trên, và bằng đúng con số
  trong tiêu đề danh sách bên dưới.

## 11 · Báo cáo tuần và giao việc

Vai **Quản lý** → **Tổng quan → Báo cáo tuần** (tab thứ ba, chỉ Quản lý thấy).

Bấm **+ Giao việc** → hai loại khác hẳn nhau:

| **Việc chi nhánh** | **Giao giáo viên** |
|---|---|
| Giáo trình, vận hành. Không gắn học viên nào | Gắn lớp và kỹ năng, và **toả ra** hồ sơ từng em |

Chọn *Giao giáo viên* → chọn lớp → hộp thoại nói rõ *"việc này sẽ hiện trong hồ sơ của 13 em
lớp MB-FT 102… nhưng vẫn là **một việc**, cập nhật một lần"*.

Sau khi giao, mở hồ sơ một em trong lớp đó → thấy phương án ấy ở đúng ô kỹ năng. Em nào chưa có
vấn đề ở kỹ năng đó thì hệ thống mở một vấn đề mới, ghi rõ **mở theo yêu cầu Quản lý**, và đưa
thẳng vào *đang xử lý* — nó đã có phương án rồi, chính là việc này, nên **không** đội con số
"chưa có phương án hỗ trợ" lên sai.

## 12 · Ghi nhận nhanh

Vai giáo viên → hồ sơ học viên → khối **Ghi nhận nhanh**. Tối thiểu chỉ cần **một nhận định
bằng lời** *hoặc* một điểm ước lượng — không bắt điền đủ.

Nhận định bằng lời **không** bị quy ra số để đem trừ với điểm Mock. Ghi được **bất kỳ lúc
nào**, không phụ thuộc tuần MT hay hạn nhập điểm.

---

## Nâng cấp dữ liệu cũ

```bash
npm run migrate
```

Chuyển database cũ sang mô hình mới **không xoá gì**. Nguyên tắc: **không bịa ra một phép
tách không có căn cứ.**

- Vấn đề trượt **đúng một** kỹ năng → gắn được kỹ năng chắc chắn.
- Trượt **từ hai** kỹ năng trở lên → **để trống**, vì những việc đã làm không ghi lại là làm
  cho kỹ năng nào; chia bừa là dựng ra một lịch sử sai. Giao diện ghi rõ *"chưa gắn kỹ năng"*.
- Hai việc trao đổi chuyển sang bảng **Liên hệ**, giữ nguyên người làm và ngày.
- *Buổi gặp riêng* → **Meeting CX/GĐCN**, *Chính sách vận hành* → **Đề xuất · Khác**.
- *Hoàn cảnh kèm theo* → gộp vào **Ghi chú**, dịch mã sang tiếng Việt chứ không để `context.family`.
- Phân loại **Giáo viên / Giáo trình** gỡ khỏi vấn đề của học viên.

Đã kiểm chứng trên **bản sao thật**: 122 vấn đề giữ nguyên, từng ô điểm khớp, 187 lần trao
đổi chuyển đủ, khoá ngoại sạch, **chạy lại lần hai không làm gì thêm**.
