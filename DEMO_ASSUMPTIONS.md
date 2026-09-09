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
| O05 | **Quyền sau khi hết phân công / chuyển khác chi nhánh** | Giữ nguyên cơ chế PR #4: quyền theo phân công đang hiệu lực | Chưa kiểm tra kỹ tình huống chuyển khác chi nhánh |
| — | **Dòng nhập hàng loạt ngoài phạm vi quyền** | Dòng đó bị **bỏ qua kèm lý do**, không ghi gì — nhưng **không làm hỏng cả lô**. Một dòng sai không kéo theo 39 dòng đúng | Đường kia là ném lỗi cả lô: an toàn như nhau nhưng bắt Admin CN dán lại từ đầu. Nếu bạn muốn chặt hơn (sai một dòng là huỷ cả lô) thì nói, đổi là một dòng code |
| — | **Lộ trình khi bảng nhập bỏ trống cột Lộ trình** | **Kế thừa lộ trình của lớp** (vào lớp LT1 thì đang học LT1). Target vẫn để trống và cảnh báo "chưa tính được kỳ vọng" | Bắt gõ lại lộ trình đã hiển nhiên là thừa. Nhưng nếu có lớp chứa học viên nhiều lộ trình khác nhau thì quy tắc này sai — cần bạn xác nhận |
| O06 | **Ước lượng Writing** | Giữ **riêng theo từng task** W1/W2, không tự gộp thành một band Writing | Công thức 1:2 là của điểm chính thức, không tự áp cho ước lượng |
| O08 | **Lưu trữ học viên** | 14 ngày kể từ `finished_at`; lưu trữ chỉ ẩn khỏi danh sách, **không** đóng lịch/case còn dở, **không** phải trạng thái thứ tư | Mốc chính xác và quyền khôi phục cần bạn chốt |
| — | **Kỹ năng không mock ở mức task** | Bỏ Writing là bỏ **cả W1 và W2**; không cho bỏ riêng một task | Nếu chỉ cần mock một task thì phải có rule tính W riêng |
| — | **Admin chi nhánh và Tiến trình công việc** | **Không** cấp quyền. Họ theo dõi lịch/điểm qua Mock Test và Học viên | Nếu cần, đề xuất một capability hẹp chứ không mở lại quyền họp toàn phần của PR #4 |

Các mục O04 (Report/WL, ai đóng case), O07 (lớp thường), O10, O11 thuộc vòng B và C, chưa triển khai nên chưa chặn gì.
| — | **Chiều của Δ trong bảng so sánh** | `Δ = Mock − Đánh giá GV`: dương = em đang **thể hiện tốt hơn** mức giáo viên đánh giá | Bảng ví dụ trong prompt ghi Δ = +0.5 khi Đánh giá GV **cao hơn** Mock, nhưng quy tắc màu ngay dưới lại nói "Mock < Đánh giá GV → warning". Hai điều đó **ngược nhau**. Đã theo quy tắc màu vì nó nói rõ ý nghĩa cần đọc ra — muốn đổi chiều thì sửa một dòng |
| — | **Cửa sổ sửa báo cáo tuần** | Hai ngày cuối tuần đó (thứ Bảy + Chủ nhật) | Prompt nói "2 ngày cuối của tuần đó" nhưng không nói đó là ngày nào theo lịch làm việc thật. Nếu trung tâm họp thứ Sáu thì cần dịch lại |
| — | **Sửa báo cáo tuần đã qua** | Đóng hẳn, không cho sửa hồi tố | Prompt nói "historical completed report → theo permission hiện hành" nhưng chưa có permission nào cho việc này. Đang chọn mặc định an toàn |
| — | **Bỏ hẳn "Head xác nhận"** | Đã gỡ quyền, hàm, endpoint và nút; giữ nguyên dữ liệu cũ | Đã đối chiếu code: bước này không khoá điểm, không là điều kiện đổi trạng thái, không mở khoá gì. Nếu có mục đích nghiệp vụ nào tôi chưa biết thì nói, khôi phục được |
| — | **Bỏ trường "Loại" của công việc** | Đã gỡ khỏi form; cột cũ giữ giá trị lịch sử | Chỗ duy nhất nó tác động là một nhánh lọc yếu ("việc dài hạn chưa xong" luôn coi là cần chú ý) — điều mà chính hạn của việc đã nói rồi |
| — | **Tổng hợp Tutor** | Báo cáo chi nhánh là đầu vào; tutor là đơn vị được tổng hợp. Giữ **nhẹ**, không dựng hồ sơ tutor riêng | Prompt nói nếu chưa thiết yếu thì giữ nhẹ. Muốn có hồ sơ tutor thật (danh sách tutor, gắn từng ghi nhận vào từng người) thì cần bảng riêng |
| — | **Chiều của Δ** | Chỉ là **khoảng cách** giữa hai con số, **không** tô màu tốt/xấu | Anh/chị đã xác nhận: điểm Mock và Đánh giá GV là hai thứ khác hẳn nhau, bên nào cao hơn cũng không phải cảnh báo |
| — | **Hạn nhập điểm lớp thường** | Chưa có hạn riêng | Nguồn chưa nói. Hiện chỉ đánh dấu "chưa đủ điểm", không tính quá hạn như lớp FT |
| — | **Miễn kỹ năng ở bài kiểm tra lớp thường** | Chưa có | Lớp FT có "không yêu cầu kỹ năng"; lớp thường hiện bắt buộc đủ bộ kỹ năng của chương trình. Cần thì thêm được |
| — | **Tiêu chí đóng case của lớp thường** | Dùng chung ba trạng thái với lớp FT | Nguồn nói "workflow ngắn hơn nhưng logic tương tự". Nếu lớp thường cần bước xử lý khác thì cho biết |
| — | **Tổng số câu mỗi kỹ năng** | Không cố định, phải nhập từng bài; có đặt tổng chung cho cả lớp | Nguồn nói số câu không cố định. Nếu thực tế mỗi kỹ năng luôn cố định một con số thì khai báo sẵn trong chương trình được |

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
