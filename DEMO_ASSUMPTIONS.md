# Giả định và điểm cần chốt

Chỉ ghi những câu **thực sự cần bạn quyết định**. Không mở rộng thành tài liệu lớn.

## 1. Đã chốt trong đợt này

| Mã | Câu hỏi | Quyết định đang áp dụng |
|---|---|---|
| **Q1** | Chấm Writing/Speaking thế nào? | Bốn tiêu chí cho **cả S và W**. Writing tách **W1 và W2 thành hai kỹ năng nhập điểm riêng** (có giáo viên chỉ dạy một task), phân công theo từng task. Band Writing = `(W1 + W2×2) / 3`, làm tròn về 0.5 |
| **Q2** | Thiếu điểm thì kết luận thế nào? | **Chờ đủ các kỹ năng bắt buộc mới chốt SOS.** Trong lúc chờ hiển thị tiến độ `n/n`, không kết luận "Đạt kỳ vọng". Speaking có thể mock khác tuần: mỗi kỹ năng có lịch và hạn riêng. *Mở rộng ở Q8.* |
| **Q3** | Danh mục họp: 3 hay 5 nhóm? | **Ba nhóm** cho chi nhánh (Giáo viên · Học sinh · Giáo trình) và ba nhóm riêng cho Tutor part-time. Mẫu số tính lại từ danh mục, không hardcode |
| **Q4** | Ai trao đổi phụ huynh khi bỏ tài khoản tư vấn? | **Giữ nguyên bước và người thực hiện bên ngoài (CS)**, hệ thống chỉ ghi **tên người làm và ngày**. Tách người điều phối case, người thực hiện và tài khoản ghi nhận |
| **Q5** | Gọi vai trò quản trị phần mềm là gì để không lẫn với Admin chi nhánh? | **`Quản trị hệ thống`** (`system_admin`). Admin chi nhánh là **nhân sự văn phòng** (danh sách lớp, giáo viên, việc trung gian giữa các phòng ban), nên hai vai trò không dùng chung chữ "Admin" |
| **Q6** | Ai được huỷ lịch Mock? | **Quản trị hệ thống · Admin chi nhánh · Quản lý.** Giáo viên, kể cả GVCN, không huỷ được |
| **Q7** | Head là vai trò nào? | **Head chính là Quản lý.** Không tách thêm cấp. Admin chi nhánh không xác nhận Head; Quản trị hệ thống giữ quyền này như đường sửa sai cuối cùng |
| **Q8** | MT chỉ mock một số kỹ năng thì SOS tính thế nào? | Mặc định vẫn phải đủ bốn. Khi thực tế học viên không mock một kỹ năng, **Quản lý/Admin chi nhánh đánh dấu "không mock"** cho chính lượt đó và SOS tính trên các kỹ năng còn lại, giữ ngưỡng 1/2/≥3. Không ai đánh dấu thì **chờ đủ bốn**. Lượt bị loại kỹ năng thì không có Overall IELTS |
| **Q9** | Số MT khi học lại hoặc sang lộ trình mới? | Ranh giới là **lộ trình**. Học tiếp trong cùng LT1 → MT **tăng tiếp** (MT6, MT7…), target giữ nguyên nên kỳ vọng bằng target. Sang LT2 → **đánh số lại từ MT1** vì có target mới |
| **Q10** | Lượt có LRW và Speaking khác tuần thì tính vào tuần nào? | **Tuần kế hoạch của lượt** (tuần Quản lý chốt). Một lượt chỉ thuộc đúng một tuần. Hạn nhập điểm và việc của giáo viên vẫn tính riêng theo từng kỹ năng |

## 2. Đang áp dụng theo suy luận — cần bạn xác nhận

Mã `Oxx` khớp với mục 9 của `PISA_Design_Master_Reference.md`.

| Mã | Điểm | Đang làm | Vì sao cần chốt |
|---|---|---|---|
| O02 | **Phạm vi hạn nhập điểm riêng** | Hạn riêng áp cho **cả lượt MT**, không tách từng kỹ năng. Đổi lịch **giữ nguyên** hạn riêng đã đặt | Nguồn chỉ nói "được đặt deadline khác". Tách theo kỹ năng và ứng xử khi dời lịch cần bạn quyết |
| O02 | **Speaking ngoài tuần kế hoạch** | Bị **từ chối**; muốn xếp ngoài tuần phải để Quản lý đổi tuần trước | Tránh việc âm thầm đổi tuần qua đường xếp ngày |
| O05 | **Ai được nhập bù điểm ngoài phân công** | Quản trị hệ thống và Admin chi nhánh có `score.override`; **Quản lý không có**. Đường này ghi nhật ký riêng (`score.override`) để còn siết lại được | Cần đường sửa khi GVBM vắng, nhưng nguồn không nói ai. Đã tách thành capability riêng nên đổi ý chỉ là một dòng dữ liệu |
| O05 | **Quyền sau khi hết phân công / chuyển khác chi nhánh** | Giữ nguyên cơ chế PR #4: quyền theo phân công đang hiệu lực | Chưa kiểm tra kỹ tình huống chuyển khác chi nhánh — thuộc vòng B |
| O06 | **Ước lượng Writing** | Giữ **riêng theo từng task** W1/W2, không tự gộp thành một band Writing | Công thức 1:2 là của điểm chính thức, không tự áp cho ước lượng |
| O08 | **Lưu trữ học viên** | 14 ngày kể từ `finished_at`; lưu trữ chỉ ẩn khỏi danh sách, **không** đóng lịch/case còn dở, **không** phải trạng thái thứ tư | Mốc chính xác và quyền khôi phục cần bạn chốt |
| — | **Kỹ năng không mock ở mức task** | Bỏ Writing là bỏ **cả W1 và W2**; không cho bỏ riêng một task | Nếu chỉ cần mock một task thì phải có rule tính W riêng |
| — | **Admin chi nhánh và Tiến trình công việc** | **Không** cấp quyền. Họ theo dõi lịch/điểm qua Mock Test và Học viên | Nếu cần, đề xuất một capability hẹp chứ không mở lại quyền họp toàn phần của PR #4 |

Các mục O04 (Report/WL, ai đóng case), O07 (lớp thường), O10, O11 thuộc vòng B và C, chưa triển khai nên chưa chặn gì.

## 3. Giả định kỹ thuật của bản demo (không phải quy tắc nghiệp vụ)

- **Đăng nhập bằng cách chọn tài khoản mẫu.** Phiên do máy chủ cấp; giao diện không tự khai quyền.
  Đây **không** phải cơ chế xác thực dùng cho sản phẩm thật.
- **Đồng hồ demo cố định `23/09/2026`** để trạng thái quá hạn ổn định khi xem lại. Đổi trong *Công cụ demo*.
- **Nâng cấp dữ liệu tại chỗ**: `npm run migrate` chuyển database cũ sang mô hình lộ trình + tuần kế hoạch,
  giữ nguyên mã học viên, enrollment, từng lượt MT, điểm W1/W2 và lịch sử SOS. Những giá trị không suy ra
  được (kỹ năng không mock, ước lượng giáo viên, lịch Speaking riêng) được để trống, không bịa.
  `npm run seed` vẫn là lệnh **xoá và tạo lại** và chỉ chạy khi bạn chủ động gọi.
- Toàn bộ tên người, lớp và sự kiện là **dữ liệu giả**, không lấy từ tài liệu nguồn.
- *Công cụ demo* có các kịch bản `Đang tải / Không có dữ liệu / Lỗi khi tải / Lưu thất bại` để xem giao diện
  ở trạng thái xấu. Hệ thống **không bao giờ** tự sinh lỗi khi dùng bình thường.

## 4. Điểm trong file nguồn không được dùng làm quy tắc

- `MEETING_MINUTES_HEADS` → `TỔNG HỢP!E5:E6` có công thức lỗi `#REF!` và cache `0`.
  Bản demo **tính lại** từ hạn và tiến độ, không sao chép số 0.
- `Tong hop tuan!C` đếm **dòng học sinh / lượt Mock** theo tháng–tuần, không phải học sinh duy nhất
  hay lịch dự kiến — hai số này được tách riêng.
- `Tong hop tuan!L` = tổng SOS trừ số case có người trao đổi HS. Đây **không** đúng nghĩa "case chưa có
  người điều phối"; bản demo dùng khái niệm riêng và không tái sử dụng nhãn cũ.
- Nhãn tháng/tuần trong các dòng mẫu Excel **không** được coi là quy tắc chia tuần.
