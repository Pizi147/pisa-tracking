# PROMPT TRIỂN KHAI PISA PROGRESS — TỔNG HỢP QUYẾT ĐỊNH SAU PR15

Bạn đang tiếp tục phát triển repository **Pizi147/pisa-tracking**. Hãy triển khai toàn bộ yêu cầu bên dưới thành một thay đổi hoàn chỉnh, nhất quán giữa UI, API, dữ liệu, phân quyền, báo cáo và demo.

Mục tiêu xuyên suốt: **LOGICAL — SIMPLE — PRACTICAL — USER-FRIENDLY — INTUITIVE**.

Hồ sơ học viên là trọng tâm: mở hồ sơ phải hiểu học viên đang ở đâu trong hành trình, đang mắc vấn đề gì, ai đang xử lý, phương án nào đang dùng, kết quả ra sao và tiếp theo cần làm gì. Lần này cần thay đổi cấu trúc và luồng thực tế, không chỉ sửa màu, nhãn hoặc bổ sung vài badge.

## 0. Cách làm và thứ tự ưu tiên

### 0.1. Nền tảng đối chiếu

- PR15 đã merge. Bản main gần nhất đã được review trong cuộc trao đổi là commit `718f81f13d72599ef693e5480b7372fc5d8d7b7b`; head PR15 là `3fb9ac8660ce5eec94c2d3a9bce37794b4a7d195`.
- Trước khi sửa, đọc branch hiện tại, hướng dẫn repository, schema/migrations, code map và các luồng liên quan. Nếu đã có thay đổi sau mốc trên, đối chiếu và giữ phần đúng; không lùi về PR15 hoặc ghi đè công việc mới một cách máy móc.
- Prompt này tổng hợp các quyết định sau PR15 và là đặc tả hiện hành cho phạm vi này. Những câu đã bị thay thế trong prompt cũ, comment cũ, test cũ hoặc seed cũ không được tiếp tục coi là yêu cầu.
- Thứ tự ưu tiên: prompt này → quyết định trước chưa bị thay thế → code hiện tại. Đặc biệt đọc bảng thay thế tại mục 1.
- Bối cảnh nghiệp vụ đã tham khảo CP Student current mapping: theo dõi xuyên suốt đầu vào, quá trình học, tín hiệu, case, hỗ trợ, kết quả và chuyển tiếp. Không bịa dữ liệu còn thiếu hoặc suy quan hệ nhân quả chỉ từ điểm tăng sau hỗ trợ.
- Chức năng báo cáo họp đã tham khảo MEETING_MINUTES_HEADS. Nội dung cần thiết được mô tả đầy đủ tại mục 14; không cần có workbook mới hiểu được yêu cầu. Công thức quá hạn/sắp đến hạn trong bản workbook đã review có `#REF!`, không dùng các số đó làm chuẩn.

### 0.2. Quyền chủ động

Bạn được chủ động overhaul UI, tổ chức component/module, bố cục, wording, tương tác và cách triển khai để đạt mục tiêu. Không cần xin lại những quyết định đã chốt ở đây. Có thể đề xuất cách thực hiện tốt hơn nếu vẫn giữ nguyên ý nghĩa nghiệp vụ.

Chỉ hỏi khi phát hiện một mâu thuẫn nghiệp vụ thực sự chưa được đặc tả giải quyết; nêu tình huống cụ thể, tác động và phương án khuyến nghị. Không dừng ở kế hoạch, mockup hoặc vài chỉnh sửa bề mặt. Hoàn thành cả phần liên quan cần thiết để hệ thống chạy nhất quán.

Không thêm module ngoài phạm vi như hồ sơ giáo viên đầy đủ, ERP, xếp lớp tự động hay hệ thống dự đoán hiệu quả. Không tự thêm bước duyệt cho thao tác đã được phép. Không tự merge/deploy nếu chưa có chỉ dẫn triển khai tương ứng.

### 0.3. Tránh ảnh hưởng sai sang các phần khác

Tách nghĩa của dữ liệu trước khi sửa giao diện. Một quy tắc phải có một nơi sở hữu, các màn cùng dùng quy tắc đó. Đặc biệt không vá riêng số đếm trên một màn; không cấp quyền rộng cho GVCN để xử lý một ngoại lệ nhỏ; không dùng lại hàm FT cho Normal nếu luật khác nhau.

Lập ma trận yêu cầu → dữ liệu/API/UI bị ảnh hưởng → kiểm thử → bằng chứng hoàn thành. Chọn thứ tự triển khai theo phụ thuộc và tự tiến hành. Các thay đổi schema cần migration; không coi reset database là cách triển khai duy nhất.

## 1. Những quyết định mới thay thế quy tắc cũ

| Chủ đề | Quy tắc phải triển khai |
|---|---|
| SOS | Chỉ sinh tín hiệu/dấu mốc; không tự sinh case hoàn chỉnh hoặc phương án. GV phải xác định/cập nhật case trong 3 ngày |
| Mô tả case | Tên và mô tả đều bắt buộc |
| Mức độ case | Có đúng Cần chú ý và Gấp để tính hạn; bỏ Bình thường. Không rải badge Gấp cạnh mọi tiêu đề |
| Phân loại | Bắt buộc khi hoàn thiện case; không cho chọn Chưa rõ để hoàn tất |
| Tạo phương án | Hai lựa chọn Đang theo dõi / Đã xong; mặc định Đang theo dõi |
| Cập nhật học thuật | Hạn Chủ nhật hằng tuần, tách khỏi ngày dự kiến kết thúc phương án |
| Chưa đủ dữ liệu | Tiếp tục theo dõi; không thành công, không thất bại, không vào tổng hợp hiệu quả hoặc mẫu số |
| Ý thức/Khác | Case theo đợt ngắn; gộp báo cáo trong cửa sổ 4 ngày; phương án phải xong trong 3/5 ngày, case trong 7 ngày |
| Lịch test | Một đợt có lịch và hạn chấm riêng từng kỹ năng; kết quả vẫn thuộc một đợt duy nhất |
| Đổi lịch Normal | QL, GVCN và GVBM được điều chỉnh theo phạm vi; GVBM chỉ môn mình phụ trách |
| Đổi lịch FT | QL chỉnh lịch chủ động; GVCN có ngoại lệ dời do vắng một lần theo từng kỹ năng, các lần tiếp theo cần QL duyệt |
| Normal pass | Từ 70% trở lên, xét tỷ lệ gốc |
| Role | Bỏ Admin chi nhánh; giữ System Admin |
| Kế hoạch thi thật | Có thể lưu tháng, tuần hoặc ngày chính xác; không chỉ tháng/tuần |
| Click kỹ năng trong hồ sơ | Mở hành trình/case ngay tại kỹ năng, không chỉ lọc một danh sách khác phía dưới |
| Thứ tự case | Đang mở trước, cập nhật nghiệp vụ mới nhất trước; đã hoàn thành dưới |
| Hoàn thành case | Một thao tác hoàn thành; bỏ kéo dài theo dõi và Chọn hướng xử lý |
| Báo cáo chi nhánh | Ba nhóm Giáo viên, Học sinh/Phụ huynh, Giáo trình; Tutor part-time là đơn vị báo cáo riêng |

## 2. Mô hình nghiệp vụ và những bất biến

Phân biệt rõ:

1. **Đợt test:** MT1/MT2… của một học viên trong một lộ trình FT, hoặc Progress/Final Test của chương trình Normal.
2. **Phần thi kỹ năng:** phạm vi yêu cầu, lịch, xác nhận thi/vắng, hạn chấm, điểm và lịch sử dời của kỹ năng trong đợt đó.
3. **Tín hiệu từ điểm:** kỹ năng dưới kỳ vọng, cần GV xác minh; chưa phải case hoàn chỉnh.
4. **Case:** vấn đề đã được xác định, có tên/mô tả/phân loại/mức độ/người chịu trách nhiệm.
5. **Báo cáo thành phần:** một báo cáo của một GV trong một đợt case Ý thức/Khác.
6. **Phương án:** việc hỗ trợ một case, có người thực hiện, thời gian, trạng thái và kết quả.
7. **Lần cập nhật:** ghi nhận tiến độ/kết quả của một phương án; không phải một phương án mới.
8. **Công việc quản lý:** độc lập với phương án học viên, có thể liên kết làm căn cứ.
9. **Báo cáo kỳ họp:** tình hình đơn vị/mục báo cáo trong một kỳ; không phải ảnh chụp tự động toàn bộ task.

Các bất biến:

- Không dùng số case thay số học viên hoặc số tín hiệu. Một học viên có nhiều case; một case có nhiều phương án; một phương án có nhiều cập nhật.
- Người phụ trách case, người thực hiện phương án và người nhập bản ghi là các khái niệm riêng. Mỗi case có một người chịu trách nhiệm chính.
- Điểm chính thức, quan sát hỗ trợ, trạng thái thực hiện và kết luận case không thay thế nhau.
- Thiếu dữ liệu không phải 0, trượt hoặc đạt. Không có case không chứng minh học tốt.
- Lớp/chi nhánh nguồn của lịch sử khác lớp/chi nhánh hiện chịu trách nhiệm. Chuyển lớp giữ đủ cả hai ngữ cảnh.
- Mỗi đợt test có định danh ổn định. Tách tuần, dời hoặc khôi phục một phần thi không tạo MT mới hoặc ghép điểm từ đợt khác.
- Hành động đã hoàn thành không tự trở thành hiệu quả. Gửi report/thư cảnh cáo không tự chứng minh hành vi đã cải thiện.
- Các thao tác lưu lại, retry, nhiều người thao tác đồng thời không được nhân tín hiệu, case, báo cáo nguồn, phương án, lần dời hoặc thông báo cùng sự kiện.

## 3. Vai trò, trách nhiệm và tìm kiếm

### 3.1. Bỏ Admin chi nhánh

Bỏ role `branch_admin` khỏi role có thể giao mới, UI tài khoản, quyền và hàng công việc dành riêng role này. Giữ System Admin. Giữ lịch sử ai đã làm gì và dữ liệu thật; không xóa hồ sơ/công việc cần thiết chỉ vì bỏ một role.

Rà quyền cũ của Admin chi nhánh và chuyển nhiệm vụ nghiệp vụ phù hợp cho QL/GVCN theo bảng bên dưới. Không tự biến mọi tài khoản Admin cũ thành QL toàn hệ thống. Tài khoản/việc chưa có người phù hợp cần được nhận diện để phân công, không bỏ mất.

System Admin tiếp tục quản trị kỹ thuật và quyền hệ thống theo cấu hình hợp lệ; không mặc định nhận tất cả nợ nhập điểm hoặc cập nhật thay nhân sự nghiệp vụ.

### 3.2. Ma trận nghiệp vụ

| Thao tác | QL | GVCN | GVBM |
|---|---|---|---|
| Sửa thông tin HV, target, đầu vào, kế hoạch thi thật | Trong phạm vi quản lý | HV trong lớp phụ trách | Không tự mở quyền ngoài hiện có |
| Tạo/cập nhật case học thuật, thêm phương án học thuật | Trong phạm vi | Khi đồng thời phụ trách đúng kỹ năng | Đúng kỹ năng/lớp được phân công |
| Báo cáo/tạo case Ý thức/Khác | Trong phạm vi | Lớp phụ trách | Bất kỳ môn được phân công trong lớp đó |
| Thêm và xử lý phương án Ý thức/Khác | Trong phạm vi | Lớp phụ trách | Không, trừ đồng thời là GVCN |
| Lập/đổi lịch MT chủ động | Có | Không; trừ ngoại lệ dời do vắng | Không |
| Xác nhận vắng và dời MT lần đầu | Có | Đúng ngoại lệ ở mục 10 | Báo không thấy bài, không tự duyệt dời |
| Duyệt dời MT từ lần thứ hai; khôi phục phần MT đã hủy | Có | Không | Không |
| Đổi lịch test Normal | Có | Các môn trong lớp phụ trách | Môn mình phụ trách |
| Chuyển lớp, bàn giao HV | Trong phạm vi | HV lớp phụ trách | Không tự mở quyền |
| Xem đầy đủ Tiến độ công việc | QL và System Admin theo scope | Chỉ khi có thêm role phù hợp | Chỉ công việc/việc con được giao qua Tổng quan/thông báo |

Quyền nhập điểm vẫn theo phân công môn hoặc quyền sửa hộ hợp lệ. Quyền chỉnh hồ sơ không tự mở quyền sửa điểm hoặc lập MT.

Thực thi tại backend và UI, kể cả endpoint hàng loạt, import, link trực tiếp, khôi phục và route cũ. Chuyển CN không mở quyền xem toàn bộ HV của CN khác. GVBM Normal không được chọn nhóm nhiều môn để dời cả những môn ngoài phân công.

### 3.3. Search toàn cục

Tìm được **học viên, lớp và giáo viên** theo tên/mã phù hợp, phân nhóm kết quả và ghi lớp/chi nhánh giúp phân biệt trùng tên. Chỉ trả dữ liệu người dùng được xem. Hồ sơ GV đầy đủ để tương lai; hiện chọn giáo viên mở thông tin phân công/danh sách lớp có quyền xem, không link tới trang trống.

## 4. Overhaul hồ sơ học viên — ưu tiên cao nhất

### 4.1. Đầu hồ sơ: nhìn ra hiện trạng ngay

Không sticky/fixed và không tạo thanh tóm tắt học viên khác bám theo khi cuộn.

Hiển thị gọn:

- Tên, mã, lớp/CN, chương trình hoặc lộ trình, GVCN.
- Đầu vào; FT có target và kế hoạch thi thật. Normal có chương trình và tuần kết thúc, không có target IELTS.
- Đợt test gần nhất có kết quả, đủ/chưa đủ bao nhiêu kỹ năng; SOS hiện hành nếu có, ghi tạm thời khi chưa đủ.
- Một câu tổng hợp kỹ năng đang dưới kỳ vọng/tín hiệu cần xác minh, vấn đề đang xử lý và việc tiếp theo quan trọng nhất.
- Dải mốc gọn về giai đoạn trước/hiện tại và mốc tiếp theo; không thêm nhiều thẻ KPI trùng nhau.
- +Case và menu ba chấm.

Ví dụ Listening đã đạt nhưng W2/S còn dưới kỳ vọng: phải nói rõ từng kỹ năng; không làm toàn HV hết SOS chỉ vì Listening đạt, cũng không khiến case cũ đang chờ kết luận trông như vẫn chưa đạt.

### 4.2. Khối chính: Tiến độ và hỗ trợ theo kỹ năng

Normal dùng L/R/W/S/Ý thức-Khác. FT dùng L/R/W1/W2/S/Ý thức-Khác.

Mỗi hàng trả lời:

| Kỹ năng | Kết quả gần nhất | Vấn đề đang theo dõi | Hỗ trợ, kết quả và việc tiếp theo |
|---|---|---|---|
| Ví dụ Listening | MT3 6.5, kỳ vọng 6.5, đạt | Tên case cụ thể hoặc tín hiệu cần xác minh | Phương án hiện tại; kết quả mới nhất kèm ngày; người phụ trách/hạn cần thiết |

Có thể thêm lịch sử 2–3 mốc điểm ngắn trong hàng, nhưng không làm tên vấn đề và kết quả hỗ trợ chìm đi. Điểm, kỳ vọng và ngày phải cùng nguồn đợt test; không âm thầm lấy điểm cũ lấp ô mới thiếu.

**Bấm hàng mở nội dung ngay bên dưới:** biểu đồ kỹ năng, case hiện tại, lịch sử đã kết thúc. Không chỉ thêm bộ lọc rồi bắt cuộn tìm ở một khối khác. Bỏ danh sách case thứ hai bị lặp dưới bảng.

Một kỹ năng có nhiều case thì thấy đủ các case độc lập. Mở một case không tự đóng case khác. Kỹ năng không có case vẫn xem được điểm/lịch sử, phân biệt không có dữ liệu với không có vấn đề.

### 4.3. Case đọc được ngay

Thứ tự thông tin:

1. Tên vấn đề, phân loại, người chịu trách nhiệm.
2. Phương án đang thực hiện: nội dung, người làm, ngày kết thúc dự kiến/hạn cập nhật liên quan.
3. Kết quả mới nhất: nhãn, ngày, nhận xét cụ thể.
4. Việc tiếp theo và thao tác chính.
5. Lịch sử cũ thu gọn.

Case đang mở trước; trong nhóm mở xếp theo cập nhật nghiệp vụ mới nhất rồi ngày tạo. Không dùng cập nhật nền làm case nhảy lên đầu. Case hoàn thành/vô hiệu hóa ở dưới. Phương án hiện tại và cập nhật mới nhất ở trên những gì đã xong.

Không nhân nhiều badge cho cùng một ý. Mức độ được lưu và dùng tính hạn; không cần badge Gấp ở cạnh mọi đề mục case. Không hiện một SOS toàn học viên như thể là mức trượt riêng của một kỹ năng đã đạt.

### 4.4. Biểu đồ tiến bộ gắn với hỗ trợ

- Một kỹ năng mỗi lần xem, mặc định khoảng thời gian gần đây, có toàn lộ trình.
- Đường điểm chính thức và đường kỳ vọng ở trên.
- Các khoảng thực hiện phương án ở phía dưới trên cùng trục thời gian; đánh dấu các lần đánh giá hỗ trợ.
- Bấm điểm MT hoặc khoảng phương án mở đúng dữ liệu chi tiết.
- Nhiều phương án thì nhóm theo case, thu gọn; không đổ tất cả text/badge lên đường điểm.
- Không nối thang Normal và FT trên cùng đường số; không đổi điểm tự chấm thành điểm chính thức; không giả ngày thi chính xác khi chỉ có tuần.
- Điểm sửa dùng giá trị hiện hành, chi tiết có lịch sử sửa; không vẽ thành hai lần thi.
- Không gán quan hệ nhân quả như “tutor làm tăng 1 band” chỉ từ thứ tự thời gian.
- Mobile có danh sách mốc tương đương dễ đọc, không ép người dùng kéo một biểu đồ quá rộng.

### 4.5. Hành trình toàn HV

Phần cuối giữ những mốc xuyên chương trình: vào học, vào lớp, chuyển chương trình/CN, đổi target/kế hoạch thi, bàn giao case, kết quả thi thật, kết luận lộ trình. Không lặp nguyên mọi cập nhật phương án đã có ở kỹ năng. Mở toàn hành trình xem được lịch sử lớp/lộ trình cũ, kể cả case bàn giao.

## 5. Menu và các panel trong hồ sơ học viên

### 5.1. FT: đúng bốn mục theo thứ tự

**1. Thông tin học viên**

QL/GVCN sửa được họ tên, ngày sinh, lộ trình, target, kế hoạch thi thật tháng/tuần/ngày, đầu vào OVR và từng kỹ năng, tư vấn viên. “Sửa lộ trình” không có nghĩa đổi nhãn LT1 thành LT2 rồi kéo lịch sử sang; giữ định danh giai đoạn, học lại mở giai đoạn mới.

**2. Lộ trình** — thay Kế hoạch học

QL/GVCN xem/sửa tuần bắt đầu học, kế hoạch thi thật, target. Đổi target bắt buộc lý do và ngày hiệu lực. Phía dưới là bảng các MT; mỗi MT mở được lịch từng kỹ năng. Chỉ QL lập/đổi lịch MT chủ động; GVCN vẫn có ngoại lệ dời do vắng qua luồng riêng.

**3. Chuyển lớp**

Chọn lần lượt CN đích → lớp đích, ngày hiệu lực, lý do, thông tin bàn giao, lưu ý, người tiếp nhận. Tất cả có dấu * và kiểm tra bắt buộc. Lưu ý có thể chọn rõ “Không có lưu ý thêm” thay vì ép nhập filler. Người nhận phải phù hợp nơi đến và có trách nhiệm tiếp nhận.

Bố cục theo thông tin chuyển, vấn đề đang bàn giao và người nhận; hiển thị sẵn case/phương án/hạn còn mở để người bàn giao không phải chép lại. Chuyển có ngày tương lai chỉ có hiệu lực đúng ngày. Không đổi nguồn lịch sử hoặc mất case khi chưa có lớp mới.

**4. Kết luận lộ trình**

FT là học viên đã thi IELTS thật: nhập kết quả thật phù hợp và ghi chú; bỏ “Chọn một bài đã có”, không lấy MT làm thi thật. Học lại mở lộ trình mới. Kết thúc lộ trình không tự xóa/đóng thành công các case chưa xử lý; phải nhìn được nội dung còn cần bàn giao.

Bỏ các mục menu dư, gộp chức năng cần giữ vào bốn mục trên.

### 5.2. Dữ liệu chung giữa các panel

Target/kế hoạch thi/đầu vào xuất hiện ở nhiều panel phải dùng cùng dữ liệu và validation, không hai nguồn sự thật. Sửa target ở đâu cũng hỏi lý do/ngày hiệu lực. Giữ mục tiêu hiệu lực lúc đánh giá cho lịch sử; không tự viết lại SOS quá khứ khi thay target từ hôm nay. Sửa lỗi target lịch sử là thao tác hiệu chỉnh có nhật ký và đối soát.

Lưu rõ độ chính xác kế hoạch thi thật: tháng, tuần, ngày. Có tháng thì hiện tháng; bỏ cụm “chưa xác định tuần”. Không bịa ngày đầu tháng/tuần rồi hiển thị số ngày còn lại như ngày thi chính xác. Chỉ đếm ngày chính xác khi có ngày thật.

### 5.3. Normal

- Không target IELTS, không LT1/LT2; giai đoạn là chương trình/lớp Foundation, Beginner, Elementary…
- Thay kế hoạch thi IELTS bằng tuần kết thúc chương trình.
- Đầu vào chỉ cần OVR, không form năm kỹ năng FT.
- Không menu Lộ trình riêng; thông tin giai đoạn nằm trong Thông tin học viên. Lịch test Normal chỉnh từ màn lớp/test phù hợp, không qua Kế hoạch MT FT.
- Kết luận lấy Final Test L/R/W/S của đúng đợt, kể cả thi nhiều tuần. Thiếu môn thì vẫn chưa đủ, không tự chốt hoặc cho môn thiếu bằng 0.
- Học tiếp, học lại hoặc xuống level mở ghi danh/giai đoạn phù hợp; lịch sử cũ giữ nguyên.

## 6. Tín hiệu SOS và tạo case

### 6.1. Giữ cách tính SOS nhưng đổi đối tượng tự sinh

- SOS lấy từ đợt MT gần nhất có kết quả trong lộ trình hiện hành, không lấy mức cao nhất của các case còn mở.
- Chưa đủ phạm vi điểm: kết luận tạm thời trên dữ liệu hợp lệ đang có, ghi rõ thiếu môn nào/lịch môn đó; không lấy SOS của lộ trình cũ giả làm SOS hiện tại.
- Một kỹ năng chính dưới kỳ vọng → SOS1; hai → SOS2; ba hoặc bốn → SOS3.
- Writing đánh giá bằng W tổng hợp `(W1 + 2 × W2) / 3` theo làm tròn/expectation hiện có đã được chấp nhận. W1 và W2 cùng trượt vẫn chỉ là một kỹ năng khi tính SOS.
- W tổng hợp đạt thì không tự cảnh báo W1/W2 theo quy tắc đã chốt. W tổng hợp trượt thì task nào dưới kỳ vọng có tín hiệu riêng; thiếu một task chưa kết luận W.
- Normal dùng ngưỡng 70% theo mục 11, không công thức band FT.

### 6.2. Tín hiệu chưa phải case đầy đủ

Kết quả dưới kỳ vọng chỉ sinh dấu mốc/tín hiệu cần GV xác minh. **Không auto tutor, tự học, report gia đình hoặc trao đổi học viên.** Loại bỏ các đường autoSupport cũ, kể cả khi nhập từng môn, chấm lại hoặc chạy seed.

Ví dụ W tổng hợp và S trượt, W1/W2 đều dưới kỳ vọng: SOS2; bốn mốc ở W1, W2, Speaking, Ý thức/Khác. Không phải bốn case hoàn chỉnh hay bốn phương án.

- GVBM chịu trách nhiệm xác minh môn mình; GVCN nhận mốc Ý thức/Khác để xem tình hình chung.
- Mốc Ý thức/Khác từ SOS không tự kết luận thiếu ý thức. GVCN ghi nhận đã xem/nhận định; chỉ tạo case ý thức khi có vấn đề thật, không ép tạo nguyên nhân giả để xóa nợ.
- **Mọi mức SOS đều phải được cập nhật/xác định case trong 3 ngày tính cả ngày đầu.** Với mốc chung, GVCN phải ghi nhận xử lý trong cùng hạn.
- Tính từ lúc tín hiệu được ghi nhận/giao trách nhiệm trong hệ thống; không lùi về thứ Hai tuần thi đã qua khiến GV quá hạn ngay khi điểm vừa được công bố.
- Tín hiệu còn chờ phải xuất hiện ở hồ sơ, hàng công việc và tổng hợp riêng; không tính như case đã xác định. Không hoàn thiện bằng giá trị Chưa rõ.
- Nếu cùng vấn đề đã có case mở: liên kết tín hiệu, cập nhật nhận định cần thiết; không mặc định thêm case/phương án mới.
- Nếu vấn đề độc lập: được tạo case khác cùng kỹ năng có chủ đích. Case đã đóng tái diễn: tạo case mới liên kết case cũ, giữ kết luận cũ.
- Nhập điểm bổ sung trong cùng đợt, retry hoặc sửa điểm không nhân tín hiệu nguồn. Giữ thời điểm/hạn ban đầu của tín hiệu còn hợp lệ, không reset hạn do lưu lại.

### 6.3. Form tạo/cập nhật case

Các trường bắt buộc:

1. Tên case cụ thể.
2. Mô tả.
3. Mức độ: **Cần chú ý / Gấp**.
4. Nhóm: Học thuật / Ý thức-Khác.
5. Kỹ năng hoặc Về việc gì phù hợp nhóm.
6. **Phân loại vấn đề**, thay “Vì sao”.

Theo dõi từ ngày: không bắt buộc, trống lấy hôm nay. Bỏ trường Ghi chú dư vì đã có mô tả. Không cho chọn Chưa rõ để hoàn thiện. Chọn Khác vẫn phải mô tả vấn đề cụ thể. Nhận định nguyên nhân nằm trong tên/mô tả/phân loại, không coi máy đã chẩn đoán từ điểm.

Phân loại thuộc case, phương án tham chiếu lại; không bắt nhập lặp và tạo hai phân loại mâu thuẫn. Một phân loại chính dùng để cộng báo cáo; nếu giữ nhãn phụ thì không cộng chúng như nhiều case.

### 6.4. Danh mục phân loại

| Kỹ năng | Danh mục |
|---|---|
| Listening | Từ vựng/Ngữ pháp; Tư duy và kỹ năng làm bài; Tâm lý và độ tập trung; Ngôn ngữ; Khác |
| Reading | Từ vựng/Ngữ pháp; Kỹ năng làm bài; Tư duy logic; Quản lý thời gian; Khác |
| Writing W1/W2 | Giữ Đáp ứng yêu cầu đề; Tổ chức bài/liên kết ý; Từ vựng; Ngữ pháp; Khác |
| Speaking | Giữ Trôi chảy/mạch lạc; Từ vựng; Ngữ pháp; Phát âm; Khác |
| Ý thức/Khác | BTVN; Chuyên cần; Tham gia trên lớp; Khác |

Listening “Ngôn ngữ” cần giải thích ngắn về nhận diện âm, nối âm, trọng âm, tốc độ lời nói để phân biệt với vốn từ/ngữ pháp. Không thêm các option cũ vào form mới khiến hai bộ phân loại cùng tồn tại. Migration giữ code lịch sử hoặc map có căn cứ; trường hợp không map được không tự đoán.

## 7. Case Ý thức/Khác: gộp theo đợt, giữ từng báo cáo nguồn

### 7.1. Nguồn và trách nhiệm

QL và tất cả GV được phân công trong lớp đều được báo cáo vấn đề ý thức. Chỉ QL/GVCN thêm và xử lý phương án. GVCN là người đảm bảo case được xử lý, không biến GV báo cáo thành người phải gọi gia đình mặc định.

### 7.2. Cửa sổ gộp đã chốt

Một đợt case chứa nhiều báo cáo cùng học viên, cùng phân loại trong cùng ngữ cảnh học tập. Mỗi báo cáo giữ người gửi, kỹ năng/nguồn SOS, thời điểm, mô tả, tài liệu liên quan. Không ghi đè nội dung trước.

- Ngày mở là ngày 1; cửa sổ gộp là bốn ngày lịch bao gồm ngày đầu.
- Case mở 14/9: báo cáo 14–17/9 có thể gộp. Từ 18/9 mở đợt mới.
- Chỉ gộp vào case còn mở. Case đã hoàn thành giữ nguyên; báo cáo mới mở đợt nối tiếp, không viết lại kết luận.
- Xét cửa sổ bằng ngày gửi hệ thống, không bằng ngày người dùng nhập ở Theo dõi từ ngày để tránh đổi cửa sổ bằng backdate.
- Nếu một case cùng loại cũ còn mở nhưng đã ngoài cửa sổ, vẫn mở đợt mới theo luật này; liên kết để thấy tiếp diễn.
- Lần tiếp diễn tăng theo đợt, không theo mỗi báo cáo trong đợt. Gọi lần 1/2/3 và ghi ngày; không gọi tuần sau khi thực tế vẫn cùng tuần.
- Khi có báo cáo bổ sung đủ điều kiện gộp, nâng case thành **Gấp**, dù người gửi chọn Cần chú ý.
- Hạn phương án sau nâng = hạn sớm hơn giữa hạn hiện tại và ngày nâng mức +2 ngày. Hạn case vẫn ngày mở +6 ngày; không reset từ báo cáo sau.
- Gửi lại cùng request không tạo báo cáo thứ hai và không tự nâng mức.

### 7.3. Giao diện báo cáo gộp

Hiện “Thiếu BTVN — lần 2 · 2 báo cáo”, người phụ trách, hạn và phương án chung. Dưới đó là các nút nguồn như Listening · 14/9, W1 · 16/9, SOS · MT3. Bấm xem tác giả/ngày/mô tả từng nguồn. FT tách W1/W2.

Phương án chung của case giải quyết toàn bộ báo cáo thành phần. Không gộp mọi phân loại vào một case chỉ vì cùng một cuộc gọi. Nếu một report gia đình xử lý nhiều case khác loại, liên kết cùng một lần thực hiện vào các case, đếm một report thật; không tự đóng tất cả case liên kết.

## 8. Phương án hỗ trợ và các loại hạn

### 8.1. Danh mục theo nhóm

| Nhóm case | Phương án GV thực hiện | Cần xét duyệt từ Quản lý |
|---|---|---|
| Học thuật | Xếp tự học; Học tutor; Điều chỉnh cách dạy; **Tăng cường bài tập** | Hỗ trợ học thuật; Khác |
| Ý thức/Khác | Report cho gia đình; Meeting với học sinh; Gửi thư cảnh cáo | Meeting CX/GĐCN; Lùi lịch thi; Khác |

Bỏ “Khác” tự thực hiện. Giữ đúng thuật ngữ CX/GĐCN, không tự đổi chức danh. Lùi lịch thi trong một đề xuất phải có đối tượng rõ (kế hoạch thi thật hoặc phần MT liên quan) và áp quy tắc đúng đối tượng; không để mã cũ `reschedule_mt` âm thầm sửa sai lịch. Một yêu cầu dời do vắng tại trang chấm không tự tạo case Ý thức/Khác giả.

### 8.2. Form thêm phương án

- “Việc gì” đổi thành **Phương án**, bắt buộc.
- Mô tả ngắn bắt buộc; bên dưới có file hoặc link tùy chọn, xem lại được đúng phương án/lần cập nhật, kiểm quyền tài liệu.
- Tình trạng bắt buộc đúng hai lựa chọn: **Đang theo dõi / Đã xong**, mặc định Đang theo dõi.
- Bỏ checkbox Người khác làm tôi nhập hộ. Vẫn lưu người nhập và người thực hiện riêng. QL giao phương án cho GV thì không ghi QL thành người đã làm; hiển thị người thực hiện rõ, có thể gợi ý từ phân công.
- “Hạn xem lại” đổi thành **Dự kiến kết thúc phương án**. Đây là hạn hoàn thành, không chỉ ngày nhắc.
- Học thuật không chọn ngày thì mặc định Chủ nhật tuần tiếp theo tính từ khi bắt đầu thực hiện. Ngày bắt đầu tương lai chỉ chạy nghĩa vụ khi thực sự đến ngày, không giả phương án đã làm.
- Phương án cần duyệt ở trạng thái chờ duyệt, chưa được coi đang thực hiện hoặc đã xong. Không thêm lựa chọn trạng thái thủ công để vượt việc duyệt. Sau duyệt chốt ngày bắt đầu và ngày kết thúc hợp lệ.
- Nhập lịch sử Đã xong phải có ngày hoàn thành thực tế, không tương lai; học thuật phải có kết quả hợp lệ và ghi chú ngay trong cùng lần lưu. Không sinh nợ cập nhật hằng tuần lùi về trước lúc nhập lịch sử.
- Ý thức/Khác áp luồng riêng tại mục 9.2: đã xong + ngày, không bắt năm mức kết quả học thuật.

### 8.3. Bảng hạn phải triển khai

Các hạn theo ngày tính cả ngày đầu, theo ngày nghiệp vụ địa phương; 3 ngày là ngày đầu +2, 5 ngày là +4, 7 ngày là +6. Tránh lệch ngày vì server UTC. Các tuần dùng Thứ Hai–Chủ nhật và cùng quy ước chọn tuần trong toàn app.

| Nghĩa vụ | Bắt đầu tính | Hạn |
|---|---|---|
| Xác minh/cập nhật case từ SOS | Tín hiệu được ghi nhận/giao việc | 3 ngày cho mọi mức SOS |
| Có phương án học thuật | Case được xác định/ghi nhận và giao trách nhiệm; lưu dấu thời điểm, không reset do đổi owner | Gấp 3 ngày; Cần chú ý 5 ngày |
| Cập nhật phương án học thuật | Phương án bắt đầu hoạt động | Trước hết Chủ nhật hằng tuần |
| Kết thúc phương án học thuật | Theo ngày dự kiến đã chốt | Ngày riêng; mặc định Chủ nhật tuần tiếp theo |
| Có và hoàn thành phương án Ý thức/Khác | Nhận case | Gấp 3 ngày; Cần chú ý 5 ngày |
| Hoàn thành case Ý thức/Khác | Nhận/mở đợt case | 7 ngày |

Hạn tín hiệu và hạn phương án là hai bước khác nhau; hoàn thiện case không xóa dấu chậm xác minh. Đổi người phụ trách/chuyển lớp không tự reset các hạn đã phát sinh. Backdate Theo dõi từ ngày không tạo nợ giả trước lúc nhân sự nhận trách nhiệm; giữ lịch sử quan sát riêng.

Tạo phương án học thuật sát Chủ nhật vẫn phải cập nhật Chủ nhật tuần đó; nếu chưa đủ dữ liệu thì ghi đúng và tiếp tục. Ví dụ bắt đầu 19/9 → cập nhật 20/9, kết thúc mặc định 27/9. Kết thúc đúng Chủ nhật dùng một lần cập nhật kết thúc đáp ứng cả hai nghĩa vụ, không bắt bấm hai lần.

Ý thức/Khác không dùng mặc định Chủ nhật tuần tiếp theo nếu vượt hạn 3/5 ngày. Hạn kết thúc case không kéo dài vì thêm phương án hoặc có báo cáo gộp.

Chờ duyệt là việc của QL; không báo GV đã chậm thực hiện một phương án chưa được duyệt. Vẫn giữ hiển thị hạn case/đề nghị liên quan; không ẩn việc chỉ vì đang chờ. Không thay luật 3/5 hoặc deadline case bằng comment cũ về một chu kỳ duyệt khác. Nếu có SLA duyệt hiện hữu còn hợp lệ, giữ và thể hiện riêng, không tạo một thời hạn nghiệp vụ mới không có căn cứ.

## 9. Cập nhật kết quả và hoàn thành

### 9.1. Học thuật

Panel cập nhật có hai tab:

**Tiếp tục theo dõi**

- Kết quả: Tiến bộ rõ / Tiến bộ một phần / Không tiến bộ / Kém hơn / Chưa đủ dữ liệu.
- Ghi chú cụ thể; lưu được ngay, không bắt chọn thêm bước tiếp theo.
- Không hoàn thành phương án, không tạo phương án mới chỉ để sang tuần mới.

**Kết thúc phương án**

- Kết quả, ghi chú, ngày hoàn thành thực tế và bước tiếp theo.
- Chỉ thao tác kết thúc hoặc nhập lịch sử Đã xong hợp lệ mới coi phương án hoàn thành.
- Chưa đủ dữ liệu buộc tiếp tục theo dõi; không được chọn để đóng phương án thông thường.
- Giữ các bước tiếp theo có ý nghĩa: không cần hỗ trợ thêm/đề nghị hoàn thành case khi đủ điều kiện, thay phương án, nhờ QL hỗ trợ. Không đưa “tiếp tục chính phương án này” vào tab kết thúc; nhu cầu đó thuộc tab theo dõi.
- Thay phương án: lưu kết quả cuối, đóng phương án cũ với lý do Được thay thế, liên kết bản mới. Không ghi thành công giả và không xóa kết quả kém của phương án cũ.
- Nhờ QL thì có hàng chờ/người nhận và quyết định rõ; không báo phương án kế tiếp đang chạy trước khi được duyệt.

Bỏ hoàn toàn điểm tự chấm khỏi cập nhật từng phương án. Không dùng nút Đánh dấu đã làm song song tạo luồng kết thúc thứ hai không hỏi kết quả.

### 9.2. Ý thức/Khác

QL/GVCN hoàn thành phương án bằng **Đã xong + ngày thực hiện**. Không yêu cầu thang năm mức, kể cả nhập phương án đã xong từ đầu. Case hoàn thành có **ghi chú bắt buộc + ngày hoàn thành**, rồi nút Hoàn thành case.

Không tự kết luận học viên tiến bộ vì gia đình đã nhận report. Thống kê nhóm này tập trung hành động đã thực hiện và số đợt tái diễn; không bịa chỉ số thành công học thuật cho một lần liên lạc.

### 9.3. Hoàn thành case học thuật

- Một nút Hoàn thành case và panel kết luận; bỏ Kéo dài theo dõi, Chọn hướng xử lý, Đổi hướng xử lý và luồng disposition riêng.
- Điều kiện: các phương án/công việc hỗ trợ và yêu cầu duyệt liên quan đã được xử lý hợp lệ, không còn bước đang chờ bị bỏ quên. Chỉ ra cụ thể mục nào chặn; không dựa vào một boolean hoặc ghi chú chung khiến người dùng không biết phải làm gì.
- Kết quả chung phải được người có quyền kết luận; không tự hoàn thành case do điểm mới đạt, ngày qua hoặc không có phương án.
- Không ép chấm cả năm kỹ năng. Nếu bổ sung đánh giá chi tiết thì tùy chọn và đúng kỹ năng của case:

| Case FT | Các thành phần có thể ghi ở phần kết luận |
|---|---|
| Listening | Section 1–4 |
| Reading | Passage 1–3 |
| W1 | Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy |
| W2 | Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy |
| Speaking | Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation |

Chỉ nhập phần thực sự được đánh giá, không bắt điền các Section không liên quan. L/R cần ghi đơn vị đạt/tổng nếu dùng số, không coi điểm Section/Passage là band IELTS chính thức. Normal dùng cấu trúc đánh giá phù hợp chương trình, không áp rubric IELTS lên mọi lớp. Quan sát này không ghi đè điểm Test chính thức và không thay SOS.

### 9.4. Sửa điểm và thu hồi tín hiệu sai

Phân biệt:

1. Trượt thật ở MT trước, MT mới đạt: giữ case/hỗ trợ lịch sử; thông báo đã đạt và cần kết luận nếu case còn mở; không sinh thêm phương án mặc định.
2. Cùng một MT nhập sai trượt rồi sửa đạt: cập nhật tín hiệu nguồn, không tạo một sự kiện tiến bộ giả.
3. Case chỉ có căn cứ từ điểm sai: rút khỏi danh sách đang xử lý dưới lý do Không còn hợp lệ do sửa điểm, giữ audit.
4. Case có căn cứ từ đợt khác hoặc quan sát độc lập: giữ, yêu cầu xem lại nhu cầu tiếp tục; không xóa hỗ trợ thực tế.

Phương án tự sinh cũ chưa thực hiện do dữ liệu sai phải được vô hiệu hóa/hủy đúng lý do; không tính thành công/thất bại. Không tự hủy phương án cũ chỉ vì nó mang nguồn auto nếu vấn đề vẫn có thật và đã có người xác nhận/thực hiện.

Đối soát cùng lúc SOS, tín hiệu, case, phương án, nhật ký, worklist, biểu đồ và báo cáo. Không để mốc “trượt” và “đạt” của cùng một bản sửa bài được đọc như hai lần thi.

## 10. Lịch test theo kỹ năng, dời lịch và hạn chấm

### 10.1. Một đợt, nhiều lịch kỹ năng

FT phổ biến RLW một buổi, Speaking buổi khác hoặc tuần sau; cũng có thể ngược lại. Normal có thể thi các môn trong 2–3 tuần. Tất cả điểm vẫn thuộc một đợt có định danh ổn định.

- FT mặc định đủ L/R/W/S; dữ liệu nhập W1/W2 riêng nhưng W là một kỹ năng đánh giá.
- FT được QL xác định trước chỉ mock một số kỹ năng, rất hiếm. Đủ điểm phạm vi yêu cầu là hoàn tất đợt. Không tính Overall khi không đủ bốn kỹ năng chính, không lấy điểm cũ lấp môn không thi.
- Writing được yêu cầu như một kỹ năng đánh giá thì phải đủ W1/W2 để tính W. Không âm thầm suy band W từ một task.
- Không dùng bỏ yêu cầu môn sau khi HV vắng để hợp thức hóa đợt thiếu thành hoàn tất. Thay phạm vi hợp lệ là hành động QL có lý do/lịch sử riêng, không xóa dấu vắng.
- Normal luôn phải đủ L/R/W/S. Không có thao tác miễn môn để hoàn tất Progress/Final Test.
- Tách đã thi, đã có điểm, đã hoàn tất phạm vi yêu cầu và đạt kỳ vọng. Có đủ điểm không đồng nghĩa đạt.

Hiển thị ví dụ: “MT3 · Có điểm 3/4 kỹ năng · Chờ Speaking tuần 21–27/9”. W1/W2 đều đã có mới tính W là kỹ năng đã đủ.

### 10.2. Panel Kế hoạch MT

Đổi tên Lên kế hoạch MT thành Kế hoạch MT. Bỏ Lượt MT đang chọn. Chỉ có lớp FT trong danh sách và API; chọn lớp là hiện đủ HV lớp đó, không chỉ những em chưa có lịch.

- Mỗi HV được chọn lượt MT riêng; vẫn xếp hàng loạt chung lịch khi phù hợp.
- Lượt đã hoàn thành nhạt nhưng đọc được, không sửa lịch như lượt chưa thi.
- Lượt đã có lịch chưa đến: màu nổi hơn, hiện tuần. Lượt đang được chọn có dấu/viền riêng.
- Chọn lượt đã có lịch là sửa lịch, không gọi create rồi báo trùng. Preview tuần cũ → mới cho từng dòng, báo lỗi tại đúng HV/kỹ năng; không mất lựa chọn còn hợp lệ.
- Nhập lịch nhanh bằng hai dòng RLW và Speaking; Speaking mặc định cùng tuần nhưng chỉnh được. RLW áp cùng tuần cho L/R/W1/W2.
- Có Xếp riêng từng kỹ năng cho trường hợp cần. Đây là cách nhập nhanh, không phải hai đợt test riêng.
- Panel Lộ trình trong hồ sơ HV có bảng MT mở ra từng kỹ năng và chỉnh trực tiếp; không bắt áp lại toàn bộ lịch gợi ý.
- Trang chi tiết MT cũ có thể giữ thao tác đổi lịch nhưng phải dùng cùng kiểm tra/quyền, không đường vòng.

### 10.3. Quyền và nguyên nhân đổi lịch

**FT xếp chủ động:** QL điều chỉnh theo nhu cầu lịch học, gồm tách RLW/S ngay từ đầu hoặc đổi trước khi thi. Ghi lý do và lịch sử; không tính là một lần dời do vắng. GVCN/GVBM không được cấp quyền đổi lịch FT chung để làm ngoại lệ.

**Normal:** QL và GVCN được đổi lịch các môn trong lớp; GVBM được đổi môn mình phụ trách. UI chọn nhóm phải tôn trọng scope kỹ năng. Các thay đổi thông báo cho người liên quan, giữ audit; không áp nhầm hạn chế FT vào mọi thao tác đổi lịch Normal. Trường hợp Normal đã bị đóng lịch hẹn do xử lý vắng theo mục 10.6 thì QL là người đặt lại để xử lý ngoại lệ đó.

**Đã có bài nhưng chưa chấm:** là việc chấm, không được dời lịch thi để xóa quá hạn. Lịch sử thực tế sai thì dùng hiệu chỉnh có căn cứ/audit, không coi là dời do vắng.

### 10.4. Ràng buộc khi đổi lịch

- Giữ thứ tự các đợt MT trong cùng lộ trình. Khi lịch đã tách kỹ năng, kiểm trên lịch hợp nhất: phần cuối của MT trước phải trước phần đầu MT sau; không cho dời một phần sang/trùng/vượt đợt kế tiếp còn hiệu lực, không đảo số lượt.
- Hai đợt ở các tuần liền nhau, khoảng cách một tuần: cảnh báo nhưng người có quyền có thể xác nhận. Không cảnh báo RLW và S của cùng đợt là “hai MT quá gần”.
- Kiểm cả MT trước và sau; nếu chưa có lịch lân cận thì không bịa giới hạn.
- Không tự dịch các MT khác để làm cho lịch mới hợp lệ; chỉ rõ đợt/kỹ năng xung đột để QL xử lý.
- Phần đã thi/đã có điểm không dời như một lịch tương lai; giữ điểm và lịch thật. Chỉ đổi phần chưa thi.
- Đổi lịch giữ cùng attempt/skill ID, đánh dấu nguồn thủ công, không bị cơ chế tự tính lịch từ tuần bắt đầu ghi đè.
- Không đổi phạm vi kỹ năng bắt buộc chỉ vì panel đổi tuần có các tick mặc định.

### 10.5. Hạn chấm riêng từng kỹ năng

| Loại | Hạn |
|---|---|
| FT | Hết thứ Tư sau tuần thi của chính kỹ năng đó |
| Normal | Hết Chủ nhật tuần thi của chính kỹ năng đó |

Ví dụ RLW thi tuần 14–20/9 → hạn 23/9; Speaking thi tuần 21–27/9 → hạn 30/9. Dời Speaking chỉ đổi hạn Speaking; không gia hạn các môn RLW đã thi. Tuần mới chưa đến thì không hiện nợ nhập điểm hoặc quá hạn cho môn đó.

Trang chấm phân biệt: Chưa đến lịch / Chưa xác nhận đã thi / Đã thi chờ chấm / Đã xác nhận vắng / Đã có điểm / Chờ duyệt dời / Đã hủy lịch-phần thi phù hợp. Có thể dùng status đơn giản hơn ở UI nhưng không trộn các ý nghĩa này trong dữ liệu.

### 10.6. Vắng, dời có giới hạn và khôi phục

GV báo Không thấy bài → GVCN xác minh vắng/chưa thi. Điểm trống chưa đủ để xác nhận vắng.

- Bộ đếm dời do vắng theo **kỹ năng trong từng đợt**, không theo toàn học viên, không dùng chung một lượt miễn phí cho RLW và S.
- Vắng buổi RLW: một thao tác nhóm cập nhật các kỹ năng bị ảnh hưởng; vắng S chỉ ảnh hưởng S. Nếu kỹ năng trong nhóm có số lần/lịch khác nhau, xử lý rõ từng phần, không vượt quyền bằng nhóm.
- Lần đầu: GVCN dời đúng tuần kế tiếp của lịch đang có; không chọn tùy ý, không lấy tuần hiện tại để nhảy nhiều tuần khi xử lý muộn. Nếu tuần đích đã qua hoặc đụng MT sau, chuyển QL giải quyết.
- Lần thứ hai trở lên: GVCN gửi đề nghị, QL duyệt mới có hiệu lực. Chưa duyệt không tự thay lịch.
- Hạn duyệt: **trước khi tuần mới được đề nghị bắt đầu**. QL từ chối hoặc hết hạn chưa đồng ý → hủy phần thi/lịch hẹn bị ảnh hưởng theo hai loại bên dưới. Không hủy ngay lúc vừa gửi đề nghị.
- Nếu đề nghị gửi khi mốc duyệt đã qua, chuyển xử lý trực tiếp cho QL thay vì giả một khoảng chờ đã hết; không tự coi đã được duyệt.
- FT: hủy phần chưa thi, giữ điểm các phần hoàn thành. Đợt hiện chưa đủ kết quả do phần bị hủy; không tính môn đó 0 hoặc coi là môn vốn không yêu cầu. Không dựng Overall. Chỉ QL khôi phục phần này và đặt tuần mới trong cùng thao tác.
- Normal: hủy **lịch hẹn**, giữ nghĩa vụ thi đủ môn. Đợt vẫn chưa hoàn tất, môn còn thiếu chuyển Chờ QL xếp lại. QL đặt lại lịch; không làm biến mất môn hoặc tự cho hoàn tất vì đã thi các môn khác.
- Dời chủ động hợp lệ không tăng bộ đếm vắng. Dời/khôi phục/đổi người phụ trách không reset bộ đếm. Lần thao tác của QL được ghi rõ, không giả là lượt miễn phí mới của GVCN.
- Không xóa điểm, lịch sử hoặc kết quả hợp lệ khi hủy; chỉ dừng đúng hàng công việc của lịch/phần thi đã hủy. Normal vẫn có việc chờ xếp lại.
- Backend chống thao tác đồng thời/retry gây dời hai lần, duyệt sau khi tự hủy mà không qua khôi phục, hoặc cập nhật điểm vào phần đã bị hủy.

### 10.7. Kết quả và báo cáo khi tách tuần

- Một đợt có **tuần kế hoạch hoàn tất** bằng tuần muộn nhất trong các kỹ năng bắt buộc theo lịch có hiệu lực.
- Bảng kết quả theo tuần dùng tuần kế hoạch hoàn tất: mỗi đợt đúng một lần, kể cả chưa đủ điểm. Ghi rõ đây là tuần kế hoạch hoàn tất, không giả ngày đã hoàn thành thực tế.
- Lịch công việc/thi tuần này dùng lịch riêng từng kỹ năng/buổi. Các số này khác đơn vị với số đợt kết quả.
- Khi đổi lịch, cập nhật vị trí tổng hợp kế hoạch theo quy tắc trên, giữ audit tuần cũ/mới. Không tuyên bố đây là snapshot bất biến của cuối tuần trước.
- Môn chưa xếp lại/đã hủy khiến chưa có kế hoạch hoàn tất hợp lệ: hiện trạng thái tương ứng và hàng cần xử lý, không âm thầm bỏ môn để tính đợt xong. Giữ khả năng tra lịch kế hoạch trước khi hủy.
- Điểm đến trước tạo SOS tạm thời/tín hiệu ngay khi đủ căn cứ cho kỹ năng đó; điểm đến sau cập nhật cùng đợt, không auto nhân phương án hoặc tạo lại case.

## 11. Normal đạt từ 70%

- Mọi bài kiểm tra kỹ năng Normal, gồm Progress/Final, đạt khi `điểm / tổng điểm >= 0.70`.
- Xét tỷ lệ gốc trước làm tròn. 7/10 đạt; 69/100 trượt; 23/33 vẫn dưới 70% dù nhãn làm tròn có thể thành 70%.
- Thiếu điểm/tổng là thiếu dữ liệu. Đợt hoàn tất khi đủ cả bốn kỹ năng, không đồng nghĩa cả bốn đạt.
- Không sửa công thức band, kỳ vọng, Writing hoặc SOS FT.
- Cùng quy tắc dùng cho nhập điểm, kết luận, tín hiệu, hồ sơ, bảng lớp/tuần, báo cáo và demo/tests. Rà hết nhãn/hardcode 60% cũ.
- Chuyển quy tắc phải đối soát dữ liệu suy ra và ghi dấu thay đổi, không sửa điểm gốc, xóa kết luận cũ hoặc bịa nợ quá hạn từ quá khứ. Với dữ liệu lịch sử đã chốt, giữ được căn cứ quy tắc đã áp dụng; báo cáo hiện hành phải có cách tính thống nhất và rõ phạm vi, không hai màn cùng dữ liệu nói hai kết luận không giải thích.

## 12. Trang Học viên, nhập danh sách và tạo lớp

### 12.1. Thêm học viên

Chọn lớp trước ở đầu panel; mỗi lần thêm nhiều HV là thêm vào lớp đã chọn. Mở từ hồ sơ lớp thì chọn sẵn đúng lớp. Lớp không còn là một cột dữ liệu dán.

FT nhận các cột: **Họ tên, Ngày sinh, OVR đầu vào, L, R, W, S đầu vào, Target, Tuần bắt đầu**.

Normal nhận: **Họ tên, Ngày sinh, OVR đầu vào, Tuần bắt đầu**. Không bày trường FT rồi bắt người dùng điền '-'.

- Dấu '-' hoặc ô trống là chưa có thông tin, không thành 0. Họ tên/lớp phải có để tạo; báo lỗi tại dòng thiếu tên, không tạo HV tên '-'.
- W đầu vào là Writing tổng, không tự chia W1/W2. OVR đầu vào nhập độc lập theo dữ liệu chính thức; không tự thay thế chỉ vì thiếu các môn.
- Có tuần bắt đầu mặc định cho lô và cho phép ghi đè từng dòng. Chọn/nhận dạng tuần có khoảng ngày rõ, không lẫn tuần thứ mấy của tháng với ngày.
- Có preview bảng, lỗi tại ô, sửa ngay, bỏ qua dòng có chủ ý; nút lưu ghi số HV hợp lệ thực sự.
- Hỗ trợ paste Excel/Sheets có/không header theo mapping rõ; không silently shift cột. Định dạng ngày sinh có lựa chọn, parse đúng.
- Cảnh báo khả năng trùng hồ sơ dựa dữ kiện phù hợp; không tự gộp người chỉ trùng tên. HV đã tồn tại nên dùng ghi danh/chuyển lớp, không mặc định tạo mã mới.
- Không nhập lịch MT ngoài quyền QL qua import.

### 12.2. Tạo lớp

Form tạo lớp có thông tin hiện hữu cần thiết và phân công **GVCN + GVBM** ngay trong cùng panel. Môn phù hợp chương trình; một người có thể nhiều vai/môn nếu phân công hợp lệ. Thiếu phân công phải rõ, không gán bừa.

### 12.3. Danh sách bên ngoài

Gọn, dễ scan, giữ cấu trúc theo lớp và tìm kiếm. Normal/FT dùng cột phù hợp.

- Tên/mã, mốc/đợt Test, điểm gần nhất, tín hiệu/case hiện tại, hành động chính.
- FT có target/kế hoạch thi; Normal không có cột target/thi IELTS trống.
- Có thể xem 2–3 mốc điểm gần nhất, cùng hàng là cùng đợt; không lấp điểm thiếu bằng dữ liệu cũ không ghi nguồn. Mốc mới nhất nổi hơn, không cần các số delta nhỏ gây rối.
- “Dự kiến thi” chỉ hiện tháng/tuần/ngày đang có, bỏ “chưa xác định tuần”. Chưa có kế hoạch thì '—'.
- Cảnh báo hồ sơ thiếu chỉ nổi khi thông tin ảnh hưởng xử lý/lập kế hoạch; không gắn badge thiếu thông tin giống nhau lên mọi HV.
- Một hành động chính và xem thêm nếu có nhiều việc; tránh cùng một việc vừa là badge vừa thành nhiều dòng.

## 13. Hồ sơ lớp và chuyển tiếp

### 13.1. Đầu trang và menu

- “Nhập điểm cả lớp” đổi thành **Nhập điểm test**.
- Có **+Case**, mở cùng form tạo case nhưng thêm chọn HV ở đầu, giữ toàn bộ quy tắc/quyền.
- Thêm học viên dùng cơ chế mục 12, chọn sẵn lớp này.
- “Quản lý lớp” đổi thành menu ba chấm dọc. **Thông tin lớp** gộp Tiến độ lớp và Phân công GV.
- Box đầu gọn: chương trình/CN, tuần học-kết thúc, sĩ số hiện tại, GVCN/GVBM, mốc Test, cảnh báo cần hành động. Phân công gọn và ở trên.

### 13.2. Chuyển tiếp lên lớp sau — chỉ Normal

- Bỏ trường Lớp đích cho cả lớp bị lặp/thừa.
- Form tạo lớp tiếp theo đầy đủ như Tạo lớp, gồm phân công; bên dưới chọn HV cần chuyển.
- Chuyển nhóm chính vào lớp mới. Các em không chọn nằm trong **Chưa xếp lớp tiếp theo**, không bị coi học xong hoặc biến mất.
- Chọn một/nhiều em ngoại lệ chuyển thủ công vào lớp có sẵn: khác lớp, cùng level hoặc thấp hơn, có lý do/bàn giao. Không cần engine tự xếp lớp.
- Chuyển đúng ngày hiệu lực, không ghi đè Final Test/lịch sử chương trình cũ; case còn mở bàn giao rõ.
- FT không hiện Chuyển tiếp lên lớp sau; vẫn có Chuyển lớp cho nhu cầu chuyển ngang/CN.

### 13.3. Hai dạng xem danh sách HV

**Học thuật:** chi tiết hơn danh sách ngoài; kết quả Test phù hợp, tiến độ đủ/chưa đủ từng môn/lịch tách tuần, tín hiệu/case và hành động đúng môn. Giữ cấu trúc nhất quán, không hai nơi dùng hai cách tính.

**Ý thức:** hàng là HV; cột là số đợt case BTVN, Chuyên cần, Tham gia trên lớp, Khác; số report gia đình đã thực hiện; số thư cảnh cáo đã gửi.

- Đếm case sau gộp, không lấy số báo cáo thành phần làm số case.
- Đếm lần report/gửi thư thực tế, không đếm phương án dự kiến; một lần liên kết nhiều case đếm một lần.
- Mặc định giai đoạn HV học tại lớp hiện tại, có lựa chọn toàn hành trình ghi rõ phạm vi. Chuyển lớp không mang tất cả lịch sử cũ giả thành sự việc của lớp mới.
- Bấm số mở được các bản ghi tạo ra số đó.

### 13.4. Bảng phân tích vấn đề của lớp

Đặt sau box lớp; gọn/thu gọn được để không đẩy danh sách HV quá xa.

- Normal tab L/R/W/S; FT L/R/W1/W2/S, không mất W1/W2 vì dùng bốn tab cố định.
- Hàng là phân loại vấn đề của môn.
- Các số cần có: Case, Phương án, PA đang theo dõi, PA thành công, PA không thành công; mở chi tiết xem loại PA có hiệu quả/kém hiệu quả với số n/N và %.
- Có thể đưa các cột phương án dài vào phần mở rộng, nhưng không bỏ thông tin người dùng cần.
- Cách tính thống nhất mục 15, không chia số PA thành công cho số case để ra tỷ lệ PA.

## 14. Tiến độ công việc và báo cáo kỳ họp

### 14.1. Sửa số bộ lọc

Số trên bốn nhóm công việc phải tính từ phạm vi quyền/CN/các bộ lọc chung trước khi áp chính bộ lọc nhóm. Chọn Học sinh/Phụ huynh không làm Giáo trình/Giáo viên/Tutor về 0.

Các chiều khác cũng phải có quy tắc rõ: số dự đoán khi chọn lựa chọn đó, không lấy danh sách đã lọc chính lựa chọn hiện tại để tính anh em. Không đếm trên trang đang phân trang; dùng toàn tập hợp phù hợp.

### 14.2. Bố cục hai tab

**Công việc**

- Dòng tổng hợp gọn: đang thực hiện, quá hạn, đến hạn trong ba ngày, tạm ngưng. Các nhóm có thể chồng nhau thì không trình bày như phép chia cộng bằng tổng.
- Bốn nhóm giữ: Học sinh/Phụ huynh, Giáo trình, Giáo viên, Tutor. Một bảng công việc có bộ lọc, sắp xếp, phân trang/xem thêm.
- Mỗi dòng nói việc gì, ai làm, hạn, trạng thái và cập nhật gần nhất. Không lặp cùng ghi chú ở nhiều cột.
- Một task xuyên nhiều tuần, không nhân bản mỗi tuần. Task con một cấp, người phụ trách và theo dõi, lịch sử cập nhật.
- Trạng thái: Chưa bắt đầu, Tiếp tục xử lý, Đã hoàn thành, Tạm ngưng, Dừng hẳn. Tạm ngưng/dừng có lý do; tạm ngưng có thể hẹn xem lại, không làm mờ như hoàn thành. Dừng nhắc thực hiện khi tạm ngưng nhưng giữ dấu hạn gốc.
- Hạn task con mặc định trước cha một ngày lúc tạo, sửa được; đổi hạn cha không tự dời task con cũ. Cảnh báo hạn con bất hợp lý.
- “2/4 việc con xong” không quy thành 50% khối lượng. Hoàn thành task cha là quyết định hợp lệ của người phụ trách/QL, không tự theo tỷ lệ.
- QL/System Admin xem tab đầy đủ theo scope. GV chỉ mở/cập nhật việc/việc con được giao qua Tổng quan/thông báo/link hợp lệ, không đọc cả bảng quản lý.

**Báo cáo kỳ họp**

- Chọn kỳ tuần/tháng; tình hình báo cáo khác trạng thái task.
- Ba nhóm báo cáo CN: **Giáo viên, Học sinh/Phụ huynh, Giáo trình**. Gợi ý nội dung bên trong: giáo viên về phân công, thái độ, chất lượng dạy, tương tác/phối hợp; học sinh về sĩ số/lịch, lực học, thái độ/phụ huynh; giáo trình về phù hợp/đề xuất điều chỉnh.
- Tutor part-time là đơn vị báo cáo riêng: Số lượng tutor, Chất lượng dạy học, Các vấn đề khác. Không ép ba mục này vào một bộ cột chi nhánh không phù hợp.
- Trạng thái báo cáo: Ổn, Cần theo dõi, Có vấn đề; ô chưa nhập là Chưa báo cáo, không mặc định Ổn.
- Dòng tổng hợp: đã báo cáo/còn thiếu/có vấn đề. Ma trận đơn vị × mục báo cáo; bấm ô mở tình trạng, bằng chứng cụ thể, người/ngày báo cáo, công việc liên quan. Số mục dự kiến phải dựa cấu trúc hiện hành, không hardcode 28 của sheet cũ.
- Có thể tạo hoặc liên kết task ngay từ báo cáo, không tạo lại task đang có mỗi kỳ.
- Kỳ trước giữ nội dung người báo cáo đã ghi cho kỳ đó; task liên kết có trạng thái hiện tại và lịch sử riêng. Không giả trạng thái hiện tại là trạng thái cuối kỳ trước.
- Hàng công việc quá hạn/sắp hạn hiện tại phải ghi phạm vi hiện tại, không giả phụ thuộc kỳ báo cáo đã chọn nếu thực tế tính toàn bộ.
- Lưu một báo cáo theo đơn vị/mục/kỳ với lịch sử chỉnh sửa, không copy vô tận những dòng kỳ cũ và dữ kiện cũ sang kỳ mới.

Không tự tạo case/phương án học viên từ task quản lý hoặc tự đóng case khi task liên kết xong. Giữ luồng quản lý gọn, không thêm tầng intervention/duyệt vô nghĩa cho task thông thường.

## 15. Trang Thực trạng và thống kê hiệu quả

### 15.1. Cấu trúc

Giữ bảng tuần nhưng cập nhật cách quy tuần đợt test theo mục 10.7. Không thêm hệ thống snapshot toàn bộ tại cuối tuần.

Phần phân tích vấn đề làm lại:

1. Hai tab Normal / FT.
2. Hàng kỹ năng: Normal L/R/W/S/Ý thức-Khác; FT L/R/S/W1/W2/Ý thức-Khác.
3. Chọn kỹ năng → bảng phân loại vấn đề.
4. Tổng hợp theo CN, mở lớp, bấm số xem HV/case. Giới hạn tầng bảng hợp lý, chi tiết cuối mở panel.

Bỏ bộ lọc Cần chú ý hiện tại gây lệch số; bỏ bảng Phương án & kết quả độc lập. Phương án/kết quả tích hợp trong phần mở rộng của đúng nhóm vấn đề đang xem.

Mỗi nhóm vấn đề thấy số HV đang gặp, case đang mở, thiếu phương án, đang hỗ trợ. “Chưa xác định vấn đề” của tín hiệu xuất hiện thành tập cần xử lý riêng, không thêm lại lựa chọn Chưa rõ vào form hoàn thiện case.

### 15.2. Đơn vị và phạm vi

- HV đếm duy nhất trong từng ô; tổng HV toàn CN phải deduplicate. Một HV thuộc nhiều phân loại thì tổng các hàng có thể lớn hơn số HV duy nhất, ghi rõ.
- Case, báo cáo nguồn, phương án, cập nhật và đợt test là đơn vị riêng.
- Hiện trạng lấy nơi đang chịu trách nhiệm. Báo cáo lịch sử giữ lớp/CN nguồn; không chuyển toàn bộ thành tích hỗ trợ cũ sang CN mới mà không ghi nguồn.
- Số summary, bộ lọc và drilldown dùng cùng scope/quyền/thời gian, gồm cả nhóm chưa phân loại được do dữ liệu legacy. Không rơi mất bản ghi làm tổng có vẻ đẹp.
- Cột xử lý case gắn với kết quả tuần là **trạng thái xử lý hiện tại**; không gọi là “tại cuối tuần đó”.

### 15.3. Hiệu quả phương án học thuật

- Thành công: Tiến bộ rõ, Tiến bộ một phần.
- Không thành công: Không tiến bộ, Kém hơn.
- **Chưa đủ dữ liệu: tiếp tục theo dõi, không vào nhóm thành công/không thành công, không vào mẫu số hoặc bảng tổng hợp hiệu quả.** Vẫn lưu lịch sử và tính trong lượng công việc/PA đang theo dõi khi phù hợp, không xóa khỏi hệ thống.
- Tính một kết quả cuối cho mỗi PA đã kết thúc đủ điều kiện; bốn lần cập nhật tuần không phải bốn PA hay bốn thành công.
- Tỷ lệ loại PA = số PA loại đó kết thúc có tiến bộ / tổng PA loại đó đã kết thúc có kết quả xác định trong phạm vi. Hiện n/N trước %.
- Bao gồm kết quả từ case đã hoàn thành; nếu chỉ dùng case mở thì mất phần thành công đã khép.
- PA bị thay thế có kết quả cuối vẫn giữ và tính đúng quan sát; lý do dừng là thông tin riêng, không loại hết PA kém vì đã bị thay.
- PA hủy do sai dữ liệu, chưa được duyệt, chưa thực hiện hoặc không có kết quả xác định không là thất bại. Không tự suy hiệu quả từ status completed.
- Có thời gian báo cáo rõ, ví dụ mặc định 12 tuần gần nhất có thể đổi; hiện trạng vấn đề vẫn là hiện tại. Hai phạm vi được ghi ngay chỗ đọc, không lẫn nhau.
- Không gọi loại PA “tốt nhất” chỉ vì 1/1; luôn hiện cỡ mẫu và các trường hợp cụ thể, không xếp hạng chắc chắn khi mẫu ít.
- Ý thức/Khác không ép vào tỷ lệ tiến bộ học thuật. Báo cáo hành động đã thực hiện và tái diễn là dữ liệu phù hợp đã có.

## 16. Kết nối Toàn cảnh và các màn còn lại

Không phá những chức năng đang đúng của PR15. Toàn cảnh cập nhật các hàng việc phát sinh từ mô hình mới:

- Tín hiệu SOS cần xác định case trong 3 ngày.
- Case học thuật chưa có phương án trong hạn 3/5 ngày.
- Cập nhật học thuật tuần này và kết thúc PA đến hạn/quá hạn, phân biệt lý do.
- Case Ý thức/Khác cần hoàn thành hành động/case.
- Chấm điểm đúng kỹ năng và tuần thi; không nhắc Speaking trước lịch của nó.
- QL cần duyệt dời lần tiếp theo, khôi phục/xếp lại Normal, yêu cầu hỗ trợ.
- HV chưa xếp lớp tiếp theo và thiếu người phụ trách cần thiết.

Gộp việc có cùng hành động theo lớp/test/kỹ năng khi hợp lý; hàng cần ghi đúng tên Test, người chịu trách nhiệm và hạn. Không giao mọi việc cho người chỉ có quyền sửa hộ.

Summary giáo viên đếm case thực sự được giao, không toàn case trong các lớp họ dạy; không lấy recorded_by thay owner. Số bấm được phải mở đúng tập dữ liệu, giữ bộ lọc/ngữ cảnh/back.

Sự kiện nổi bật tách khỏi hàng công việc; tuần hiện tại/tiếp theo có Test Normal, MT theo buổi/kỹ năng, thi thật đã biết lịch. Kế hoạch thi thật chỉ có tháng không được tự nhét vào một tuần.

## 17. Tiêu chuẩn UI và thiết kế hệ thống

- Rõ hierarchy: hiện trạng/hành động/kết quả nổi hơn metadata và hướng dẫn.
- Không tạo thêm section, badge, modal lồng modal nếu không giúp quyết định. Nội dung dài dùng mở rộng tại chỗ hoặc panel chi tiết thống nhất.
- Bảng có tên cột/đơn vị rõ, text đủ rộng, số căn hợp lý; tooltip chỉ bổ trợ, không là nơi duy nhất giải thích một con số.
- Không dùng ký hiệu như 33/7 không biết nghĩa, không hiển thị dấu trượt ở ô chưa có điểm.
- Dùng màu có tiết chế và kèm chữ/icon; giữ độ tương phản, cỡ chữ dễ đọc, focus/keyboard/touch.
- Danh sách lớn dùng phân trang/xem thêm, lazy load chi tiết. Không tải mọi CasePanel cho cả lớp ngay khi mở hồ sơ.
- Điều hướng, URL/deep link, trạng thái mở rộng và bộ lọc quay lại được giữ hợp lý. Không còn filter ẩn làm danh sách không khớp số.
- Thiết kế desktop/tablet/mobile, đặc biệt các bảng điểm, panel import, lịch kỹ năng và form nhiều trường; không chỉ thu nhỏ chữ để nhét.
- Không hiện ghi chú triển khai, schema, quyền API hoặc đoạn giải thích máy móc dài trong giao diện người dùng. Chỉ giữ giải thích giúp họ chọn đúng hành động.

## 18. Dữ liệu, migration và demo

### 18.1. Migration

- Tách lịch/required-scope/trạng thái thi/hạn chấm theo kỹ năng từ lịch chung cũ có mapping rõ. Giữ attempt ID, điểm, người nhập, liên kết case và lịch sử.
- Lịch chung cũ có thể dùng để khởi tạo lịch các môn khi có căn cứ, nhưng không bịa ngày thi chính xác, xác nhận có mặt hoặc nguyên nhân vắng.
- Bỏ role Admin CN không xóa audit hoặc tài khoản một cách mù quáng; chuyển/phân công trách nhiệm cần thiết.
- Dữ liệu case cũ chưa có phân loại không được tự nhận hoàn chỉnh hoặc map bừa. Hiện yêu cầu rà soát phù hợp, tránh làm mất lịch sử.
- Phương án auto cũ chỉ vô hiệu khi có căn cứ sai/không còn áp dụng; không xóa việc thực tế đã diễn ra. Lịch sử quyết định vẫn đọc được.
- Case disposition/metrics cũ còn dữ liệu được giữ đọc, nhưng không còn luồng nhập mới trái đặc tả.
- Các trường ngày tạo, ngày quan sát, ngày hiệu lực, ngày thực hiện và ngày nhập không bị gộp thành một ngày để tiện sort.
- Recompute/projection một cách có kiểm soát: không tạo lại hàng loạt nợ quá hạn từ dữ liệu cũ, không gây side effect khi chỉ mở trang báo cáo.

### 18.2. Demo

Giữ demo nhỏ, có chủ đích, hành trình đủ dài; sửa/reseed demo khi cần cho schema mới, không dùng reset thay migration và không đụng dữ liệu thật. Không bắt người dùng xác nhận lại việc chỉnh bộ demo đã được cho phép.

Bổ sung hoặc tái sử dụng hồ sơ cho ít nhất các trường hợp:

1. FT RLW tuần trước, S tuần sau, cùng một MT; có cả chiều ngược lại.
2. FT chỉ mock 1–2 kỹ năng đã chọn từ đầu; hoàn tất đúng scope, không Overall giả.
3. Normal bốn môn trải 2–3 tuần, luôn cần đủ bốn, ngưỡng 70%.
4. QL đổi lịch chủ động không tăng lần vắng; GVCN dời vắng lần đầu; lần hai được duyệt/từ chối/quá hạn duyệt.
5. Hủy riêng S giữ RLW; QL khôi phục có lịch mới, không reset count.
6. Normal hủy lịch hẹn môn còn thiếu, vẫn chờ QL xếp lại và chưa kết thúc đợt.
7. GVBM Normal đổi được môn mình, không đổi môn khác; GVCN đổi nhiều môn.
8. W1/W2/S dưới kỳ vọng → SOS2, bốn mốc, chưa có phương án tự sinh; GV hoàn thiện case trong hạn/ngoài hạn.
9. Cùng bài nhập sai rồi sửa đạt; và trường hợp trượt thật MT trước rồi MT sau tiến bộ.
10. Case Ý thức ngày 14/9, gộp 16/9, nâng Gấp; báo cáo 18/9 thành đợt mới; case đóng không bị gộp lại.
11. PA học thuật tạo sát Chủ nhật, cập nhật Chưa đủ dữ liệu, sau đó tiến bộ; không vào thống kê hiệu quả trước khi đủ dữ liệu/kết thúc.
12. PA không tiến bộ bị thay thế, kết quả cũ không biến mất khỏi báo cáo; report đã gửi nhưng hành vi tái diễn.
13. Chuyển CN có case bàn giao, nhóm HV chuyển lớp kế tiếp và vài em học lại/chưa xếp tiếp.
14. Báo cáo kỳ họp có mục Ổn/Cần theo dõi/Có vấn đề/Chưa báo cáo, task liên kết tiếp tục qua nhiều kỳ.

Không biến tất cả HV thành thiếu thông tin hoặc đỏ quá hạn. Có cả ổn định, đã cải thiện, đang theo dõi đúng hạn và một số trường hợp quá hạn. Ngày demo thống nhất, không có kết quả/thực hiện ở tương lai so với ngày demo. Tình huống lịch cũ cần chọn ngày demo/fixture phù hợp, không suy thời gian thật từ ảnh cũ.

Ghi lại các tài khoản/hồ sơ nên mở đầu tiên và kỳ vọng từng tình huống để chủ sản phẩm kiểm tra được ngay.

## 19. Các điểm code PR15 đã phát hiện — đối chiếu, không áp patch mù

- `web/src/modules/worklist/MgmtTasksPage.tsx`: số nhóm lấy từ rows đã lọc chính group nên nhóm khác về 0.
- `server/src/cases/sos.ts`: autoSupportPlan/ensureBehaviourCase còn sinh phương án; sửa điểm thêm mốc đạt nhưng không đối soát việc phát sinh từ điểm sai.
- `web/src/modules/cases/SkillBoard.tsx`: click chỉ lọc danh sách bên dưới, không mở hành trình tại chỗ.
- `web/src/modules/cases/StudentCases.tsx`, `CasePanel.tsx`: bố cục/timeline cũ; ActionDialog mặc định completed; DispositionDialog vẫn còn; form metrics hỏi cả danh mục môn.
- `server/src/cases/cases.ts`: cần rà cả sort, điều kiện hoàn thành, projection deadline/owner/case state và API metrics/disposition, không chỉ sửa component.
- `server/src/worklist/outcomes.ts`: đang loại PA superseded khỏi kết quả, có thể làm mất bằng chứng PA kém đã được thay.
- `web/src/modules/fasttrack/MockPlanPanel.tsx` gọi bulk-plan tạo mới dù chọn lại lượt có lịch; `server/src/fasttrack/planning.ts` gọi createAttempt báo trùng.
- `web/src/modules/students/StudentPlanPanel.tsx`: chủ yếu áp lịch gợi ý, không sửa trực tiếp lịch từng môn.
- `server/src/fasttrack/attempts.ts`: setPlanningWeek chưa đủ ràng buộc thứ tự/khoảng cách/count, chưa chặn done ở hàm; reopen không yêu cầu lịch mới.
- `web/src/modules/fasttrack/ScoreSheetPage.tsx`: thiếu luồng xác nhận vắng/dời/duyệt mới; `MockDetailPage.tsx` có Đổi tuần/Hủy/Mở lại cần dùng cùng service mới.
- `shared/domain/normal.ts`: threshold còn 0.6.

Các tên file là điểm xuất phát của review trước; nếu branch đã đổi, truy vết chức năng tương ứng. Comment cũ có thể trái logic mới; cập nhật hoặc xóa comment sai, không để nó dẫn lần sửa sau quay lại quy tắc đã bỏ.

## 20. Kiểm thử và bàn giao bắt buộc

### 20.1. Kiểm thử nghiệp vụ có ý nghĩa

Kiểm tra ít nhất:

- Một MT tách tuần vẫn một kết quả; scope FT giới hạn và Normal đủ bốn khác nhau; W1/W2 chỉ một W cho SOS.
- Hạn chấm từng môn, môn chưa thi không quá hạn; dời S không kéo hạn RLW.
- Đổi lịch tạo/sửa đúng ID; thứ tự MT, cảnh báo 7 ngày; lịch manual không bị tự động ghi đè.
- Dời chủ động không tăng vắng; count riêng từng môn; lần đầu GVCN, lần hai QL; chờ duyệt, từ chối, timeout, khôi phục; giữ điểm phần đã thi.
- Normal GVCN/GVBM/QL được đổi đúng phạm vi; API trực tiếp không vượt môn/CN; học viên vẫn thiếu môn sau hủy lịch hẹn.
- Normal biên dưới/đúng/trên 70%, mẫu số khác nhau, thiếu dữ liệu, nhãn và SOS/báo cáo đồng nhất.
- SOS chỉ sinh tín hiệu, hạn 3 ngày, không auto PA; nhập từng môn hoặc retry không tạo trùng.
- Sửa điểm đối soát tất cả màn; không xóa case có căn cứ độc lập, không ghi tiến bộ giả hoặc gửi lại nợ sai.
- Quyền tạo case/PA theo môn; ý thức mọi GV báo nhưng chỉ GVCN/QL xử lý; Admin CN đã bỏ.
- Gộp bốn ngày bao gồm ngày đầu, ranh giới 17/18, case đã đóng, nâng hạn không kéo dài, đếm đợt/report không trùng.
- Hạn có PA vs hạn cập nhật tuần vs hạn kết thúc PA vs hạn case; sát Chủ nhật; pending approval không tính GV đang làm.
- Nhập PA đã xong đúng luồng học thuật/ý thức, Chưa đủ dữ liệu không kết thúc và không vào tỷ lệ; thay PA giữ kết quả thất bại cũ.
- Kết luận case không đòi chấm mọi môn, không còn extend/disposition; các blocker đúng và có đường xử lý.
- Số nhóm công việc không về 0 do chọn nhóm; mọi count click ra đúng records với cùng scope, kể cả phân trang.
- Báo cáo hiệu quả lấy PA đã kết thúc, gồm case đã đóng, đúng n/N, không đếm mỗi update; ý thức không giả hiệu quả học thuật.
- Target có ngày hiệu lực, kế hoạch thi tháng/tuần/ngày một nguồn; đổi panel không làm mất dữ liệu.
- Import đúng lớp, dấu '-', W đầu vào tổng, thiếu tên, duplicate; chuyển lớp/ngày hiệu lực/ngoại lệ không mất HV.
- Bảng tuần một đợt một lần theo tuần kế hoạch hoàn tất; lịch tuần theo kỹ năng không bị cộng như số đợt.

### 20.2. Kiểm tra UI bằng thao tác thực tế

Mở các tài khoản QL, GVCN, GVBM và System Admin phù hợp. Đi trọn luồng thay vì chỉ xem trang mặc định. Kiểm tra desktop/tablet/mobile, loading/empty/error/permission, tên dài/nhiều case, biểu đồ ít/nhiều mốc.

Phải chứng minh hồ sơ đã đổi cấu trúc: nhìn được hiện trạng, click kỹ năng mở tại chỗ, case hiện tại/kết quả mới nổi, không lặp case, header không sticky, menu gọn. Kiểm tra các panel import, tạo lớp, MT tách lịch và bảng ý thức thực sự dùng được.

### 20.3. Bàn giao

Hoàn thành code, migrations, demo/fixtures và tài liệu cần thiết. Báo cáo ngắn gọn:

1. Ma trận yêu cầu → nơi đã triển khai → cách kiểm chứng.
2. Những thay đổi dữ liệu/quyền và cách chạy migration/demo.
3. Ảnh trước/sau các màn chính, đặc biệt hồ sơ học viên/case/Kế hoạch MT/hồ sơ lớp/báo cáo.
4. Các tài khoản và hồ sơ mẫu để kiểm tra các tình huống quan trọng.
5. Kiểm thử thực sự đã chạy, kết quả, giới hạn còn lại; không dùng số lượng test thay bằng chứng nghiệp vụ/UI.

Không tuyên bố hoàn tất nếu mới sửa giao diện nhưng API còn luật cũ, hoặc dữ liệu đúng ở hồ sơ nhưng sai ở Toàn cảnh/Thực trạng. Mục tiêu là một hệ thống thống nhất, đọc rõ hành trình học viên và thực hiện được công việc hằng ngày.
