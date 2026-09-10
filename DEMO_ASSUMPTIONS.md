# Giả định và điểm cần chốt

Chỉ ghi những câu **thực sự cần bạn quyết định**. Không mở rộng thành tài liệu lớn.

## 1. Đã chốt trong đợt này

| Mã | Câu hỏi | Quyết định đang áp dụng |
|---|---|---|
| **Q1** | Chấm Writing/Speaking thế nào? | Bốn tiêu chí cho **cả S và W**. Writing tách **W1 và W2 thành hai kỹ năng nhập điểm riêng** (có giáo viên chỉ dạy một task), phân công theo từng task. Band Writing = `(W1 + W2×2) / 3`, làm tròn về 0.5 |
| **Q2** | Thiếu điểm thì kết luận thế nào? | **Kết luận NGAY trên phần điểm đang có** *(owner chốt 09/09/2026, thay quy tắc cũ "chờ đủ")*. Chỉ cần một kỹ năng bắt buộc đã chấm và đã biết mục tiêu. Mức SOS là **tạm thời**, có thể tăng khi các kỹ năng còn lại vào — giao diện ghi rõ *"mới có 2/4 kỹ năng"*. **Thiếu điểm vẫn khác trượt**: ô chưa chấm không bị đếm thành môn dưới kỳ vọng. *Mở rộng ở Q8.* |
| **Q3** | Danh mục họp: 3 hay 5 nhóm? | **Ba nhóm** cho chi nhánh (Giáo viên · Học sinh · Giáo trình) và ba nhóm riêng cho Tutor part-time. Mẫu số tính lại từ danh mục, không hardcode |
| **Q4** | Ai trao đổi phụ huynh khi bỏ tài khoản tư vấn? | **Giữ nguyên bước và người thực hiện bên ngoài (CS)**, hệ thống chỉ ghi **tên người làm và ngày**. Tách người điều phối case, người thực hiện và tài khoản ghi nhận |
| **Q5** | Gọi vai trò quản trị phần mềm là gì để không lẫn với Admin chi nhánh? | **`Quản trị hệ thống`** (`system_admin`). Admin chi nhánh là **nhân sự văn phòng** (danh sách lớp, giáo viên, việc trung gian giữa các phòng ban), nên hai vai trò không dùng chung chữ "Admin" |
| **Q6** | Ai được huỷ lịch Mock? | **Quản trị hệ thống · Admin chi nhánh · Quản lý.** Giáo viên, kể cả GVCN, không huỷ được |
| **Q7** | Head là vai trò nào? | **Head chính là Quản lý.** Không tách thêm cấp. Bước "Head xác nhận" đã **bỏ hẳn**; thay vào đó, **kết thúc theo dõi** một vấn đề là quyền của **GVCN lớp đó và Quản lý** *(owner chốt 09/09/2026)* |
| **Q8** | MT chỉ mock một số kỹ năng thì SOS tính thế nào? | Mặc định cả bốn kỹ năng đều **bắt buộc**. Khi học viên thực sự không mock một kỹ năng, **Quản lý/Admin chi nhánh đánh dấu "không mock"** cho chính lượt đó và kỹ năng ấy rời khỏi mẫu số, giữ ngưỡng 1/2/≥3. Không ai đánh dấu thì kỹ năng đó vẫn **bắt buộc** — nhưng theo Q2, hệ thống vẫn kết luận tạm thời trên phần điểm đang có chứ không đứng im chờ. Lượt bị loại kỹ năng thì **không có Overall IELTS** |
| **Q9** | Số MT khi học lại hoặc sang lộ trình mới? | Ranh giới là **lộ trình**. Học tiếp trong cùng LT1 → MT **tăng tiếp** (MT6, MT7…), target giữ nguyên nên kỳ vọng bằng target. Sang LT2 → **đánh số lại từ MT1** vì có target mới |
| **Q10** | Lượt có LRW và Speaking khác tuần thì tính vào tuần nào? | **Tuần kế hoạch của lượt** (tuần Quản lý chốt). Một lượt chỉ thuộc đúng một tuần. Hạn nhập điểm và việc của giáo viên vẫn tính riêng theo từng kỹ năng |
| **Q11** | Vấn đề do giáo viên báo có mức SOS không? | **Không.** Nó mang **mức độ gấp** (bình thường / cần chú ý / gấp) — nhận định của người báo. SOS 1/2/3 là kết luận từ điểm; gán nó cho một quan sát trên lớp là làm hai loại thông tin trông giống nhau trong khi bản chất khác hẳn *(owner chốt 09/09/2026)* |
| **Q12** | Ai kết thúc theo dõi một vấn đề? | **GVCN của chính lớp đó, và Quản lý.** Giáo viên bộ môn báo được, ghi việc đã làm được, nhưng không tự kết luận là xong *(owner chốt 09/09/2026)* |
| **Q13** | Hạn nhập điểm của lớp thường? | **Hết Chủ nhật của chính tuần đó.** Khác lớp FT (thứ Tư tuần kế tiếp) vì lớp thường làm bài và chấm ngay trong tuần, không có buổi Speaking lệch ngày phải chờ. Chưa có tuần kế hoạch thì **không có hạn** *(owner chốt 09/09/2026)* |
| **Q14** | Lớp thường có miễn kỹ năng không? | **Không.** Dời lịch sang tuần khác thì được, nhưng bộ kỹ năng của chương trình luôn đủ *(owner chốt 09/09/2026)* |
| **Q16** | Ai được nhập bù điểm ngoài phân công? | **Chỉ Quản trị hệ thống.** Admin chi nhánh **mất hẳn** `score.override` — người không dạy kỹ năng đó thì không có căn cứ nào để chấm; giáo viên vắng thì Quản lý đổi phân công chứ văn phòng không gõ điểm hộ. Đường nhập bù vẫn ghi nhật ký riêng *(owner chốt 10/09/2026, đóng O05)* |
| **Q17** | Phương án hỗ trợ có phải xin duyệt không? | **Chính giáo viên đề xuất quyết định**, theo từng phương án. Trao đổi với em sau buổi học thì tự làm; xếp tutor hay lùi lịch thi thì gửi duyệt. Đã gửi duyệt thì **chờ**, chưa cập nhật kết quả được. Quản lý phải trả lời trong **3 ngày** (case SOS 3 hoặc mức gấp) hoặc **7 ngày**: duyệt · không duyệt (bắt buộc ghi lý do) · góp ý (KHÔNG kết thúc việc chờ). Đã trả lời rồi thì không sửa đè — đổi ý thì đề xuất lại, để hồ sơ giữ cả hai lần *(owner chốt 10/09/2026)* |
| **Q18** | Ai phân công giáo viên vào lớp? | **Quản lý và Admin chi nhánh** (`class.assign`) — Admin chi nhánh tạo được lớp nên cũng phải xếp được người dạy. Giáo viên không. Bỏ phân công **không xoá lịch sử**: dòng cũ đóng lại theo ngày, báo cáo cũ đọc lại vẫn thấy đúng ai dạy lúc đó *(owner chốt 10/09/2026)* |
| **Q19** | Ai cập nhật kết quả sau hỗ trợ? | **Người thực hiện** (không có tài khoản thì người ghi). Quá hạn thì **Quản lý cũng thấy**, để việc không rơi mất *(owner chốt 10/09/2026)* |
| **Q15** | Báo cáo tuần sửa được tới bao giờ? | Tới **hết thứ Tư tuần kế tiếp**, rồi khoá cứng. Chỉ **Quản trị hệ thống** mở lại được, và mỗi lần mở đều có dấu vết *(owner chốt 09/09/2026)* |

## 2. Đang áp dụng theo suy luận — cần bạn xác nhận

Mã `Oxx` khớp với mục 9 của `PISA_Design_Master_Reference.md`.

| Mã | Điểm | Đang làm | Vì sao cần chốt |
|---|---|---|---|
| O02 | **Phạm vi hạn nhập điểm riêng** | Hạn riêng áp cho **cả lượt MT**, không tách từng kỹ năng. Đổi lịch **giữ nguyên** hạn riêng đã đặt | Nguồn chỉ nói "được đặt deadline khác". Tách theo kỹ năng và ứng xử khi dời lịch cần bạn quyết |
| O02 | **Speaking ngoài tuần kế hoạch** | Bị **từ chối**; muốn xếp ngoài tuần phải để Quản lý đổi tuần trước | Tránh việc âm thầm đổi tuần qua đường xếp ngày |
| O05 | **Quyền sau khi hết phân công / chuyển khác chi nhánh** | Giữ nguyên cơ chế PR #4: quyền theo phân công đang hiệu lực | Chưa kiểm tra kỹ tình huống chuyển khác chi nhánh |
| — | **Dòng nhập hàng loạt ngoài phạm vi quyền** | Dòng đó bị **bỏ qua kèm lý do**, không ghi gì — nhưng **không làm hỏng cả lô**. Một dòng sai không kéo theo 39 dòng đúng | Đường kia là ném lỗi cả lô: an toàn như nhau nhưng bắt Admin CN dán lại từ đầu. Nếu bạn muốn chặt hơn (sai một dòng là huỷ cả lô) thì nói, đổi là một dòng code |
| — | **Lộ trình khi bảng nhập bỏ trống cột Lộ trình** | **Kế thừa lộ trình của lớp** (vào lớp LT1 thì đang học LT1). Target vẫn để trống và cảnh báo "chưa tính được kỳ vọng" | Bắt gõ lại lộ trình đã hiển nhiên là thừa. Nhưng nếu có lớp chứa học viên nhiều lộ trình khác nhau thì quy tắc này sai — cần bạn xác nhận |
| O06 | **Ghi nhận Writing** | Giữ **riêng theo từng task** W1/W2, không tự gộp thành một band Writing | Công thức 1:2 là của điểm chính thức, không tự áp cho ghi nhận của giáo viên |
| O08 | **Lưu trữ học viên** | 14 ngày kể từ `finished_at`; lưu trữ chỉ ẩn khỏi danh sách, **không** đóng lịch/case còn dở, **không** phải trạng thái thứ tư | Mốc chính xác và quyền khôi phục cần bạn chốt |
| — | **Kỹ năng không mock ở mức task** | Bỏ Writing là bỏ **cả W1 và W2**; không cho bỏ riêng một task | Nếu chỉ cần mock một task thì phải có rule tính W riêng |
| — | **Admin chi nhánh và Tiến trình công việc** | **Không** cấp quyền. Họ theo dõi lịch/điểm qua Mock Test và Học viên | Nếu cần, đề xuất một capability hẹp chứ không mở lại quyền họp toàn phần của PR #4 |
| — | **Cửa sổ sửa báo cáo tuần** | Mở từ thứ Bảy tuần đó, đóng hết thứ Tư tuần kế tiếp | Owner đã chốt mốc đóng (Q15). Mốc **mở** vẫn là suy luận: nếu trung tâm muốn điền sớm hơn trong tuần thì nói |
| — | **Sửa báo cáo tuần đã qua** | Đóng hẳn, không cho sửa hồi tố | Prompt nói "historical completed report → theo permission hiện hành" nhưng chưa có permission nào cho việc này. Đang chọn mặc định an toàn |
| — | **Bỏ hẳn "Head xác nhận"** | Đã gỡ quyền, hàm, endpoint và nút; giữ nguyên dữ liệu cũ | Đã đối chiếu code: bước này không khoá điểm, không là điều kiện đổi trạng thái, không mở khoá gì. Nếu có mục đích nghiệp vụ nào tôi chưa biết thì nói, khôi phục được |
| — | **Ba nhóm phân loại vấn đề** | Chỉ **Học sinh · Quá trình dạy · Chương trình**. Phụ huynh, sức khoẻ, gia đình, đi lại, lịch cá nhân, áp lực bên ngoài là **bối cảnh kèm theo**, không phải nhóm thứ tư | Đây là bộ phân loại **vận hành**, không phải bộ chẩn đoán chính thức của IELTS. Danh sách chi tiết trong từng nhánh có thể thêm/bớt — mã giữ ổn định, mục nào thôi dùng thì cho nghỉ chứ không xoá lịch sử |
| — | **Mức độ gấp của vấn đề giáo viên báo** | Ba mức: bình thường · cần chú ý · gấp. Là nhận định, không phải kết luận tính toán | Owner đã chốt là **không** dùng SOS 1/2/3 cho nguồn này (Q11). Ba mức này là đề xuất; muốn hai mức hay bốn mức thì đổi một dòng |
| — | **"Chưa phân loại" là trạng thái hợp lệ** | Vấn đề sinh từ điểm để trống phân loại cho tới khi có người dạy nhận định | Hệ thống chỉ biết kỹ năng nào dưới kỳ vọng; **vì sao** thì phải có người quan sát. Không tự chẩn đoán nguyên nhân, và "chưa phân loại" **không** phải nhóm thứ tư |
| — | **Điểm xuất phát của lộ trình** | Phải ghi rõ **nguồn**; thiếu căn cứ thì hiển thị "chưa rõ" và tắt phép tính "đã tăng" | Hệ thống **không** lấy MT1 làm điểm đầu vào. Nếu trung tâm có quy ước khác (ví dụ luôn dùng bài kiểm tra đầu vào) thì khai báo được |
| — | **Kết luận cuối lộ trình** | Ba giá trị: đạt · chưa đạt · **chưa có căn cứ kết luận**. Tách khỏi việc đóng lộ trình | Chưa rõ cam kết của trung tâm là **Overall** hay **từng kỹ năng tối thiểu**. Chưa có quy tắc nên hệ thống hiển thị số liệu và để người có quyền tự kết luận, không tự suy |
| — | **Ghi nhận không kèm điểm** | Nhận định bằng lời là đủ; điểm ước lượng là **tuỳ chọn** và được đánh dấu rõ là nhận định hay đo từ bài thật | Bảng cũ bắt buộc có điểm nên nhận xét thường ngày không có chỗ ghi. Nếu trung tâm muốn bắt buộc có điểm ở một số kỳ nhất định thì cần quy tắc riêng |
| — | **Người thực hiện một việc hỗ trợ** | Khai **tường minh**: "chính tôi làm", hoặc gõ tên người ngoài hệ thống. Người nhập **không** mặc định là người làm | CS gọi phụ huynh thì người làm là CS chứ không phải giáo viên đang gõ. Ngày của việc và ngày nhập là hai mốc riêng |
| — | **Đo tiến bộ theo tháng / theo số buổi học** | **Chưa làm.** Không có mẫu số đáng tin (nghỉ giữa chừng, học bù, đổi lớp) nên không dựng một con số trông có vẻ chính xác | Cần dữ liệu điểm danh thật mới tính được. Điểm danh và bài tập vẫn đang gác lại |
| — | **Bỏ trường "Loại" của công việc** | Đã gỡ khỏi form; cột cũ giữ giá trị lịch sử | Chỗ duy nhất nó tác động là một nhánh lọc yếu ("việc dài hạn chưa xong" luôn coi là cần chú ý) — điều mà chính hạn của việc đã nói rồi |
| — | **Tổng hợp Tutor** | Báo cáo chi nhánh là đầu vào; tutor là đơn vị được tổng hợp. Giữ **nhẹ**, không dựng hồ sơ tutor riêng | Prompt nói nếu chưa thiết yếu thì giữ nhẹ. Muốn có hồ sơ tutor thật (danh sách tutor, gắn từng ghi nhận vào từng người) thì cần bảng riêng |
| — | **Chiều của Δ** | Chỉ là **khoảng cách** giữa hai con số, **không** tô màu tốt/xấu | Anh/chị đã xác nhận: điểm Mock và Đánh giá GV là hai thứ khác hẳn nhau, bên nào cao hơn cũng không phải cảnh báo |
| — | **Tiêu chí kết thúc theo dõi của lớp thường** | Dùng **chung** vòng đời với lớp FT | Nguồn nói "workflow ngắn hơn nhưng logic tương tự". Nếu lớp thường cần bước xử lý khác thì cho biết |
| — | **Tổng số câu mỗi kỹ năng** | Không cố định, phải nhập từng bài; có đặt tổng chung cho cả lớp | Nguồn nói số câu không cố định. Nếu thực tế mỗi kỹ năng luôn cố định một con số thì khai báo sẵn trong chương trình được |

## 3. Giả định kỹ thuật của bản demo (không phải quy tắc nghiệp vụ)

- **Đăng nhập bằng cách chọn tài khoản mẫu.** Phiên do máy chủ cấp; giao diện không tự khai quyền.
  Đây **không** phải cơ chế xác thực dùng cho sản phẩm thật.
- **Đồng hồ demo cố định `23/09/2026`** để trạng thái quá hạn ổn định khi xem lại. Đổi trong *Công cụ demo*.
- **Nâng cấp dữ liệu tại chỗ**: `npm run migrate` chuyển database cũ sang mô hình lộ trình + tuần kế hoạch,
  giữ nguyên mã học viên, enrollment, từng lượt MT, điểm W1/W2 và lịch sử vấn đề. Từ vòng D còn dựng lại
  các ô hỗ trợ cũ thành bản ghi việc đã làm, chuyển bảng đánh giá GV cũ thành ghi nhận nhanh, và gắn mã
  chương trình cho khoá lớp thường. Những giá trị không suy ra được (người thực hiện, ngày thật, kết quả)
  được để **"chưa rõ"**, không bịa từ người nhập hay ngày tạo bản ghi.
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
