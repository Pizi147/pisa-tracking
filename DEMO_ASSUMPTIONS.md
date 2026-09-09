# Giả định và điểm cần chốt

Chỉ ghi những câu **thực sự cần bạn quyết định**. Không mở rộng thành tài liệu lớn.

## 1. Đã chốt trong đợt này

| Mã | Câu hỏi | Quyết định đang áp dụng |
|---|---|---|
| **Q1** | Chấm Writing/Speaking thế nào? | Bốn tiêu chí cho **cả S và W**. Writing tách **W1 và W2 thành hai kỹ năng nhập điểm riêng** (có giáo viên chỉ dạy một task), phân công theo từng task. Band Writing = `(W1 + W2×2) / 3`, làm tròn về 0.5 |
| **Q2** | Thiếu điểm thì kết luận thế nào? | **Chỉ chốt SOS khi đủ cả bốn kỹ năng.** Trong lúc chờ hiển thị tiến độ `n/4`, không kết luận "Đạt kỳ vọng". Có tính tới trường hợp thi lệch tuần: mỗi kỹ năng có ngày thi và hạn nhập riêng |
| **Q3** | Danh mục họp: 3 hay 5 nhóm? | **Ba nhóm** cho chi nhánh (Giáo viên · Học sinh · Giáo trình) và ba nhóm riêng cho Tutor part-time. Mẫu số tính lại từ danh mục, không hardcode |
| **Q4** | Ai trao đổi phụ huynh khi bỏ tài khoản tư vấn? | **Giữ nguyên bước và người thực hiện bên ngoài (CS)**, hệ thống chỉ ghi **tên người làm và ngày**. Tách người điều phối case, người thực hiện và tài khoản ghi nhận |
| **Q5** | Gọi vai trò quản trị phần mềm là gì để không lẫn với Admin chi nhánh? | **`Quản trị hệ thống`** (`system_admin`). Admin chi nhánh là **nhân sự văn phòng** (danh sách lớp, giáo viên, việc trung gian giữa các phòng ban), nên hai vai trò không dùng chung chữ "Admin" |
| **Q6** | Ai được huỷ lịch Mock? | **Quản trị hệ thống · Admin chi nhánh · Quản lý.** Giáo viên, kể cả GVCN, không huỷ được |
| **Q7** | Head là vai trò nào? | **Head chính là Quản lý.** Không tách thêm cấp. Admin chi nhánh không xác nhận Head; Quản trị hệ thống giữ quyền này như đường sửa sai cuối cùng |

## 2. Đang áp dụng theo suy luận từ nguồn — cần bạn xác nhận

| # | Điểm | Đang làm | Vì sao cần chốt |
|---|---|---|---|
| 1 | **Sửa điểm ngoài GVBM phụ trách** | Quản trị hệ thống và Admin chi nhánh sửa được mọi kỹ năng trong phạm vi; Quản lý **không** sửa điểm | Cần đường nhập bù khi GVBM nghỉ. Admin chi nhánh là văn phòng nên hợp lý, nhưng bạn nên xác nhận |
| 2 | **Hạn nhập khi ngày thi lệch ngày kế hoạch** | Hạn bám **ngày thi thực tế của từng kỹ năng**; chưa có ngày thi thì bám ngày kế hoạch | Là cách duy nhất xử lý được ca thi Speaking trước một tuần |
| 3 | **Dời lịch khi đã có điểm** | Vẫn dời được, điểm và ngày thi từng kỹ năng giữ nguyên; deadline tính lại theo ngày thi thực tế nên **không đổi** | Nguồn không nói. Cách này tránh việc dời lịch âm thầm làm mất trạng thái quá hạn |
| 4 | **Việc tạm dừng có bị tính quá hạn không** | **Có** | Chưa có quyết định nghiệp vụ miễn trừ. Không tự miễn |
| 5 | **Kỳ vọng cho lớp không phải FT** | Không áp dụng — học sinh lớp FOUND/BE/ELE không có điểm cam kết nên không phát sinh kỳ vọng và SOS | Nguồn chỉ quy định cho FT LT1/LT2 |
| 6 | **MT5 học thuật** | Ghi "Bổ sung hành động chuyên môn", **không** tự sinh hình thức hay thời lượng tutor | Nguồn để trống phần này |

## 3. Giả định kỹ thuật của bản demo (không phải quy tắc nghiệp vụ)

- **Đăng nhập bằng cách chọn tài khoản mẫu.** Phiên do máy chủ cấp; giao diện không tự khai quyền.
  Đây **không** phải cơ chế xác thực dùng cho sản phẩm thật.
- **Đồng hồ demo cố định `23/09/2026`** để trạng thái quá hạn ổn định khi xem lại. Đổi trong *Công cụ demo*.
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
