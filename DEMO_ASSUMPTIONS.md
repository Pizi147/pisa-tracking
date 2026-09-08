# Giả định thử nghiệm của bản demo

Tài liệu này tách **giả định của bản demo** ra khỏi **business decision đã chốt** trong file
context. Mọi mục dưới đây đều có thể đảo ngược mà không phá kiến trúc.

Ký hiệu:
- 🔒 **Đã chốt trong context** — không tự đổi.
- 🧪 **Giả định demo** — tôi tự quyết để chạy được, bạn xem rồi chốt.
- ❓ **Cần chốt trước production** — chưa đủ thông tin để quyết.

---

## 1. Đơn vị nhập liệu theo tuần

| | Nội dung |
|---|---|
| 🧪 | Đơn vị nhập nhanh là **một học viên × một lần học (enrollment) × một skill giảng dạy × một tuần**, tuần bắt đầu **thứ Hai**. |
| 🧪 | Skill giảng dạy cố định 5 loại: Listening, Reading, Writing 1, Writing 2, Speaking. Đây là *skill giảng dạy*, khác với *skill của bài thi*. |
| 🔒 | Số buổi kỳ vọng lấy từ **cấu hình lớp**, không suy ra từ tên lớp (FT5/FT10/FT16 chỉ là tên). |
| 🧪 | Thứ tự ưu tiên khi xác định số buổi kỳ vọng: `sửa tay trên chính dòng tuần` → `cấu hình theo lần học` → `cấu hình lớp`. Nguồn đang dùng được lưu ở cột `expected_source` và hiện trong cột "Nguồn dữ liệu". |
| 🧪 | Sửa số buổi kỳ vọng cần quyền tổng hợp (GVCN) hoặc quyền sửa tiến độ lớp — GVBM thường không sửa được. |
| ❓ | Có nên cho phép kỳ vọng khác nhau theo từng tuần cụ thể (nghỉ lễ, lịch bù) hay chỉ theo lần học? Hiện đã hỗ trợ ở mức dữ liệu nhưng giao diện chỉ sửa được trên từng dòng. |

## 2. Ô trống, số 0 và "không áp dụng"

| | Nội dung |
|---|---|
| 🔒 | **Chưa nhập ≠ nhập 0.** Ô trống lưu `NULL`, hiển thị "Chưa có dữ liệu", **không** bị tính là vắng học và **không** sinh tín hiệu cần chú ý. |
| 🔒 | Skill học viên không đăng ký hiển thị **"Không áp dụng"**, không tính là thiếu dữ liệu. |
| 🧪 | Dòng chỉ nhập một phần (ví dụ có chuyên cần, chưa có bài tập) gắn nhãn **"Nhập một phần"** để phân biệt với "Đã cập nhật". |
| 🧪 | `expectedMainSessions = 0` hoặc thiếu → hiển thị "—" / "Không áp dụng", **không** ép thành 0% hay 100%. |

## 3. Chuyên cần và buổi bổ trợ

| | Nội dung |
|---|---|
| 🔒 | Tổng buổi đã học = **buổi chính đã tham dự + buổi bổ trợ**. |
| 🔒 | Tỷ lệ tham dự = `buổi chính đã tham dự / buổi chính kỳ vọng`. **Buổi bổ trợ không bù vắng buổi chính**, nên 5 buổi chính + 7 buổi bổ trợ không tạo ra tỷ lệ 240%. |
| 🧪 | Trong drawer chi tiết, **Có mặt** và **Đi muộn** tính là đã tham dự. |
| 🧪 | **Vắng có phép** hiển thị riêng, vẫn nằm trong mẫu số, và không tự tạo quyết định kỷ luật. |
| ❓ | **Cách xử lý "Vắng có phép" chưa được chốt.** Ba lựa chọn: (a) giữ trong mẫu số như hiện tại, (b) loại khỏi mẫu số, (c) tách thành chỉ số riêng. Quyết định này đổi trực tiếp con số chuyên cần nên cần chốt trước khi làm thật. |
| 🧪 | Không cho `attendedMainSessions > expectedMainSessions`. Muốn ghi thêm buổi thì sửa kỳ vọng (đúng quyền) hoặc ghi vào buổi bổ trợ — hệ thống **không âm thầm cắt số**. |
| 🧪 | Buổi bổ trợ ghi: ngày, skill, số buổi, loại (học ghép / tutor / 1-1), lớp hoặc tên giáo viên nếu biết. **Không** yêu cầu dựng thời khóa biểu. |
| 🔒 | Tên giáo viên ghi trong buổi bổ trợ **chỉ là ghi chú**, không cấp quyền sửa dữ liệu. Giáo viên dạy thay chỉ có quyền khi có phân công đúng lớp/skill và **còn hiệu lực**. |

## 4. Nguồn dữ liệu: tổng hợp hay chi tiết

| | Nội dung |
|---|---|
| 🔒 | **Không đếm cộng cả tổng hợp và chi tiết.** Mỗi chiều (chuyên cần / bài tập) chỉ có một nguồn. |
| 🧪 | Khi bắt đầu nhập chi tiết, hệ thống **tự chuyển nguồn** sang "chi tiết", ô tổng hợp thành chỉ đọc, và số liệu tính lại từ chi tiết. Chênh lệch giữa hai cách được hiển thị trước khi chuyển. |
| 🧪 | Có thể chuyển ngược về "nhập tổng hợp"; các bản ghi chi tiết vẫn giữ nguyên, chỉ thôi được dùng để tính. |
| 🔒 | Hệ thống **không tự dựng attendance giả** cho các buổi chưa biết chi tiết. |
| ❓ | Khi chuyển nguồn có nên bắt buộc xác nhận bằng hộp thoại riêng thay vì tự chuyển? Hiện đang tự chuyển kèm cảnh báo chênh lệch. |

## 5. Bài tập

| | Nội dung |
|---|---|
| 🔒 | Nhập nhanh theo `số bài hoàn thành / số bài được giao`. **Không** ép mỗi skill chỉ có một bài. |
| 🔒 | Trạng thái chi tiết: Completed, Incomplete, Missing, Late. |
| 🔒 | **"Nộp muộn" không tự suy ra là đã hoàn thành.** Có cờ `completed` riêng, độc lập với trạng thái. |
| 🧪 | Số bài hoàn thành không được vượt số bài được giao. |

## 6. Ngưỡng tín hiệu cần chú ý

| | Nội dung |
|---|---|
| 🧪 | **Ngưỡng thử nghiệm hiện tại (v2):** chuyên cần dưới **80%**, bài tập dưới **70%**, tính trên **4 tuần** gần nhất. |
| 🔒 | Chỉ tính trên dòng **đã nhập dữ liệu** và có **mẫu số > 0**. |
| 🔒 | Tín hiệu **chỉ là gợi ý cần chú ý**, không phải kết luận về thái độ học tập, và **không tự tạo Issue hay ghi nhận cảnh báo**. |
| 🧪 | Ngưỡng có **version**; đổi ngưỡng tạo phiên bản mới, phiên bản cũ được lưu trữ để tra lại. Mọi phiên bản gắn nhãn **"Thử nghiệm"** trong màn Quản trị. |
| 🧪 | Giao diện luôn hiện **số thực, kỳ tính và lý do** kèm tín hiệu, không chỉ hiện một chấm màu. |
| ❓ | **Ngưỡng chính xác cần chốt sau khi bạn dùng thử.** 80/70 chỉ là điểm khởi đầu. |
| ❓ | Có cần ngưỡng khác nhau theo loại lớp (FT vs Normal) hoặc theo skill không? |

## 7. Điểm số và ước lượng

| | Nội dung |
|---|---|
| 🔒 | **Skill giảng dạy ≠ skill bài thi.** Bài official có Listening, Reading, Writing, Speaking, Overall. **Không** có Overall ghép từ 5 skill giảng dạy. |
| 🔒 | Ước lượng của giáo viên gắn với **skill giảng dạy**, nên Writing 1 và Writing 2 có thể có hai nhận định khác nhau. **Không** lấy trung bình hai giá trị này thành "Writing". |
| 🔒 | Điểm official gần nhất lấy theo **một bài duy nhất**, gần nhất theo ngày, hiển thị kèm loại bài và ngày. Skill thiếu trong bài đó hiện **"Chưa có"**, không lấy từ bài khác. |
| 🔒 | Progress/Final Test của lớp Normal dùng thang riêng (thang 10 / thang 100) và **không quy đổi sang band IELTS**. Dữ liệu mẫu có điểm 9.5/10 để bạn thấy rõ điều này. |
| 🧪 | Quyền nhập điểm official: Admin và Manager trong phạm vi. GVBM nhập **ước lượng** của skill mình dạy. |
| ❓ | **Đây là cấu hình quyền tạm thời**, chưa khóa thành luật theo tên vai trò. Cần chốt ai được nhập điểm chính thức trong thực tế. |

## 8. Công việc và thời gian

| | Nội dung |
|---|---|
| 🔒 | Trạng thái: Chưa bắt đầu, Đang làm, Tạm dừng, Hoàn thành. Trạng thái hạn do **hệ thống tính**, không nhập tay. |
| 🧪 | **"Sắp đến hạn" = trong vòng 3 ngày.** Có thể cấu hình trong Quản trị. |
| 🧪 | Ngày nghiệp vụ theo múi giờ **Asia/Ho_Chi_Minh**; thời điểm lưu ở dạng chuẩn ISO. |
| 🧪 | Công việc **Tạm dừng vẫn có thể quá hạn** — tạm dừng không dừng đồng hồ. |
| 🔒 | Công việc **Hoàn thành** không còn cảnh báo quá hạn. Không có hạn thì hiện "Chưa có hạn", không hiện "Trong hạn". |
| 🧪 | **"Công việc kéo dài" = chưa xong sau 21 ngày** kể từ ngày tạo. Đây là **bộ lọc**, không phải trạng thái nghiệp vụ mới. |
| 🔒 | **Carry-over dùng lại chính công việc cũ** (giữ nguyên mã, ngày tạo, hạn gốc, kỳ họp gốc, lịch sử sửa hạn), không nhân bản mỗi tuần. |
| 🧪 | Người được giao việc chỉ sửa được **trạng thái, ghi chú, lý do tạm dừng**. Đổi người thực hiện, phạm vi hay hạn thuộc về người quản lý công việc. |

## 9. Đồng hồ demo

| | Nội dung |
|---|---|
| 🧪 | Ngày demo mặc định là **10/09/2026**, cố định để trạng thái quá hạn / sắp đến hạn ổn định khi review. |
| 🧪 | Dữ liệu mẫu được sinh **tương đối theo ngày này** (8 tuần trở về trước), nên đổi ngày rồi chạy lại `npm run seed` sẽ ra bộ dữ liệu tương ứng. |
| 🧪 | Đổi ngày demo trong **Công cụ demo**; để trống để dùng ngày thật. |

## 10. Tiến độ chương trình

| | Nội dung |
|---|---|
| 🔒 | FT dùng **stage / milestone linh hoạt**; Normal dùng **timeline / checkpoint theo tuần**. Cùng một bộ giao diện, khác nhau ở dữ liệu. |
| 🔒 | **Lớp chỉ bị đánh giá chậm khi mốc thực sự có hạn được cấu hình.** Lớp FT theo lộ trình linh hoạt không bao giờ tự bị đánh dấu chậm chỉ vì học lâu. |
| 🔒 | Tiến độ thực tế **do người nhập**, có ghi nhật ký thay đổi. |
| 🔒 | Template có **version bất biến sau khi phát hành**. Sửa template tạo version mới; lớp đang chạy giữ nguyên version cũ. |
| 🧪 | Override chương trình chỉ tác động **đúng lớp được chọn**, lưu kèm lý do bắt buộc. |
| 🧪 | Bản demo **không** xây workflow chuyển hàng loạt lớp sang version mới — chỉ áp từng lớp. |

## 11. Báo cáo và kỳ họp

| | Nội dung |
|---|---|
| 🔒 | **Báo cáo chi nhánh** và **Báo cáo tiến độ học viên** là hai đối tượng riêng, biểu mẫu và lịch sử riêng. |
| 🔒 | Một **kỳ báo cáo** dùng chung cho báo cáo đơn vị và kỳ họp — không tạo hai loại "tuần" mâu thuẫn. |
| 🔒 | Báo cáo lưu **snapshot nhãn nhóm + version** tại thời điểm tạo, nên sửa định nghĩa nhóm không làm đổi báo cáo cũ. |
| 🔒 | **"Chưa gửi" khác "Ổn".** Đơn vị chưa gửi hiển thị rõ là chưa báo cáo. |
| 🧪 | Không cho gửi báo cáo khi còn nhóm ở trạng thái "Chưa báo cáo". |
| 🧪 | 5 nhóm báo cáo giữ nguyên như web Meeting Minutes cũ; số lượng nhóm có version nên đổi được sau. |
| 🔒 | Vấn đề và công việc từ báo cáo chỉ tạo khi **người dùng chủ động bấm**, giữ liên kết về báo cáo nguồn. |

## 12. Quyền

| | Nội dung |
|---|---|
| 🔒 | Quyền = **Permission × Scope của chính grant đó × Assignment**. Không có `switch(role)` nào quyết định quyền. |
| 🔒 | **Mỗi grant giữ đúng phạm vi riêng.** Người vừa là Quản lý chi nhánh A vừa là GV Speaking một lớp ở chi nhánh B **không** dùng được quyền quản lý ở B, cũng không dùng được quyền GV ở A. |
| 🔒 | **GVCN là phân công theo lớp**, không phải vai trò hệ thống. Hiển thị dưới dạng badge tại lớp. |
| 🔒 | GVBM **xem được toàn bộ** dữ liệu học vụ của lớp mình, nhưng **chỉ sửa skill được giao**. Quyền chủ nhiệm không tự cấp quyền sửa mọi skill. |
| 🔒 | Tư vấn viên và Quản lý tư vấn **không sửa** dữ liệu học vụ. Ghi chú nội bộ **không lọt** vào response API hay kết quả tìm kiếm của họ. |
| 🧪 | "Góc nhìn" trong menu tài khoản **chỉ đổi menu và trang mở đầu**, không tăng quyền. Backend luôn kiểm tra lại. |
| 🧪 | Kiểm tra ở mức "được vào màn hình này không" (ví dụ trang Cuộc họp) cho phép grant theo chi nhánh đi qua; **nội dung bên trong vẫn được lọc lại theo phạm vi**. |
| 🧪 | Quyền xem lịch sử học viên **sau khi** hết phân công: mặc định demo là **không còn xem được**. |
| ❓ | **Cần chốt:** giáo viên có nên tiếp tục xem hồ sơ học viên cũ sau khi hết phân công không, và trong bao lâu? |
| ❓ | **Cần chốt:** Quản lý tư vấn nên thấy theo *nhóm tư vấn viên* hay theo *chi nhánh*? Demo đang lấy **giao của cả hai** trong cùng một grant. |

## 13. Học viên và lần học

| | Nội dung |
|---|---|
| 🔒 | Học viên có **nhiều lần học (Enrollment)** theo thời gian. Chuyển lớp, học lại, tạm dừng, quay lại đều **giữ lịch sử**, không chỉ đổi `classId`. |
| 🔒 | Chuyển lớp **đóng lần học cũ và mở lần học mới trong cùng một transaction**, ghi journey event, không làm mất dữ liệu học vụ cũ. |
| 🔒 | Student ID tự sinh dạng `PISA-000001`, sinh **ở máy chủ trong transaction**, có ràng buộc duy nhất, kể cả khi import hàng loạt. |
| 🧪 | Đếm "số học viên" luôn theo **mã học viên duy nhất**, không đếm lần học như người riêng. |
| 🧪 | Badge tổng hợp trên hồ sơ **không thay thế** danh sách các lần học — cả hai đều hiển thị. |

## 14. Import Excel/CSV

| | Nội dung |
|---|---|
| 🔒 | Luồng: chọn tệp → chọn sheet → ghép cột → xem trước và kiểm tra → xử lý trùng → xác nhận → tổng kết. |
| 🔒 | Dò trùng chỉ tạo **ứng viên**, người dùng quyết định: tạo mới / liên kết / bỏ qua. **Không bao giờ tự gộp.** |
| 🔒 | Liên kết vào hồ sơ có sẵn **chỉ thêm lần học mới**, không ghi đè tên, ngày sinh hay lịch sử. |
| 🔒 | Backend **validate lại toàn bộ** trước khi ghi; dùng transaction và mã phiên nhập nên bấm hai lần không tạo dữ liệu trùng. |
| 🧪 | Ngày sinh chỉ nhận `dd/mm/yyyy`, `yyyy-mm-dd` và ô ngày của Excel. Các dạng mơ hồ khác bị **báo lỗi**, không tự đoán rồi import âm thầm. |
| 🧪 | Cột tối thiểu: Lớp, Họ tên, Ngày sinh. Tuỳ chọn: Target, Tư vấn viên, Skill đăng ký. |
| 🧪 | Chuẩn hoá tên (bỏ dấu) chỉ dùng để **tìm và dò trùng**, không bao giờ ghi đè tên gốc. |
| 🧪 | **Import điểm số lịch sử chưa có trong bản demo.** Engine dùng chung nên thêm được sau; hiện không đặt nút giả trên giao diện. |

## 15. Ghi nhận cảnh báo và sự việc

| | Nội dung |
|---|---|
| 🔒 | Hệ thống **không tự tạo Warning Letter** và **không phát hành văn bản**. Đây là **ghi nhận để theo dõi và đối chiếu**, do người có quyền nhập. |
| 🔒 | **"Cần chú ý" (tín hiệu tính từ dữ liệu)** và **"Có ghi nhận cảnh báo" (do người nhập)** là hai trạng thái riêng, dùng badge và màu khác nhau. |
| 🧪 | Quyền ghi nhận cảnh báo: GVCN của lớp, hoặc quản lý trong phạm vi. |
| 🧪 | Nội dung chi tiết của ghi nhận sự việc và cảnh báo **không hiển thị nguyên văn** cho tư vấn viên. |

## 16. Giao diện

| | Nội dung |
|---|---|
| 🧪 | Autosave debounce **700ms** cho ô số, **900ms** cho ô ghi chú; lưu theo từng ô. |
| 🔒 | Chống ghi đè bằng `clientSeq` tăng dần: **request cũ đến sau bị bỏ qua**, không ghi đè bản mới. |
| 🔒 | Lưu lỗi thì **giữ nguyên bản nháp** của người dùng và hiện nút "Thử lại" — không bao giờ báo "đã lưu" giả. |
| 🔒 | **Không autosave** cho: chuyển lớp, ghi nhận cảnh báo, import, đổi quyền, lưu trữ dữ liệu. Các thao tác này dùng hộp thoại xác nhận rõ ràng. |
| 🧪 | Sidebar tối đa 8 mục, tự lọc theo quyền; tự thu gọn dưới 1100px. |
| 🧪 | Bảng có tiêu đề dính, cột danh tính cố định khi cuộn ngang, và tuỳ chọn **"Hiện cột bổ sung"** để bạn thử mật độ thông tin. |
| 🧪 | Trạng thái luôn kèm **nhãn chữ**; màu chỉ hỗ trợ, không mang thông tin một mình. |
| ❓ | **Bố cục cụ thể của Dashboard và Hồ sơ học viên chưa khóa** — đây chính là phần cần bạn review và chỉnh. |
| ❓ | Số lượng và thứ tự KPI trên Tổng quan quản lý (hiện 6 chính + 12 mở rộng) cần chốt lại sau khi dùng thử. |

## 17. Ngoài phạm vi bản demo

Không xây trong bản này (và **không đặt nút gây hiểu nhầm**):

CRM · học phí · tuyển sinh · cổng phụ huynh · thời khóa biểu đầy đủ · gửi tin nhắn ·
tóm tắt bằng AI · phát hành văn bản Warning Letter · import điểm số lịch sử ·
chuyển hàng loạt lớp sang version chương trình mới · xác thực dùng cho production ·
triển khai online.
