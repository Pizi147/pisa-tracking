# PISA — Design Master Reference

Phiên bản 1.5 · Cập nhật 09/09/2026 · Dự án `Pizi147/pisa-tracking`

> Số phiên bản ở đây trước nay ghi 1.0 trong khi changelog đã tới 1.4 — đọc từ trên xuống
> thì tưởng tài liệu chưa cập nhật. Nay hai chỗ khớp nhau.

## 0. Cách dùng tài liệu

Đây là living reference cho toàn bộ thiết kế đã bàn, kể cả đang dùng, chưa triển khai, tạm gác, thay thế và đề xuất mới. Không phải danh sách yêu cầu phải code tất cả. Khi bắt đầu một vòng làm việc mới, đọc mục 1–9 trước; tra các phụ lục khi cần lý do và chi tiết nguồn.

| Trạng thái | Ý nghĩa |
|---|---|
| CURRENT | Yêu cầu mới nhất do người dùng nêu; cần thực hiện, không đồng nghĩa code đã có |
| BASELINE-PR4 | Tài liệu/mã nguồn PR #4 đang thể hiện; chỉ là căn cứ phiên bản, không tự chứng minh owner duyệt mọi chi tiết |
| PROPOSED | Đề xuất thiết kế của vòng review này; Claude được cải tiến trong phạm vi |
| OPEN | Chưa đủ quyết định nghiệp vụ; không tự đoán |
| DEFERRED | Giữ cho tương lai, không đưa vào UI hiện tại |
| SUPERSEDED | Đã được yêu cầu mới thay thế; chỉ giữ để tra lịch sử |

Thứ tự ưu tiên: **lời người dùng mới nhất → CURRENT trong master/prompt hiện hành → quyết định trước còn hiệu lực → nguồn vận hành → hiện trạng code → đề xuất/giả định**. Code hoặc assistant nói “đã chốt” không được tự nâng ưu tiên hơn lời người dùng. Nếu có xung đột chưa giải quyết, ghi OPEN và chỉ chặn phần phụ thuộc.

Claude được tự do thêm ý tưởng practical/intuitive, đổi IA/layout/interaction để giảm thao tác và nhập trùng. Chỉ những thay đổi nghiệp vụ/quyền/trách nhiệm chưa được xác định mới cần owner quyết định. Không biến bộ tài liệu thành khuôn cứng cho UI.

### Nguồn đã tổng hợp

| Mã | Nguồn | Vai trò |
|---|---|---|
| S0 | `PISA_Progress_Management_Context_Handoff.md`, đủ 50 mục | Context gốc; nguyên văn ở Phụ lục A, có nhiều phần nay đã gác/thay thế |
| S1 | `PISA_Local_Demo_Prompt.md` | Cụ thể hóa demo ban đầu, nhiều giả định; lịch sử ở mục 7 |
| S2 | `Pasted markdown(2).md` | Reset scope Mock-first, bốn role, đơn giản hóa mạnh |
| S3 | DOCX Quy trình phối hợp SOS Mock Test | Mốc FT LT1/LT2 và hành động phối hợp |
| S4 | `FORM_MOCK_TEST_THEO_TUAN.xlsx` | Quy đổi L/R, kỳ vọng, SOS và ý nghĩa số liệu |
| S5 | `MEETING_MINUTES_HEADS.xlsx` | Báo cáo theo đơn vị/kỳ, công việc; có khác biệt danh mục/công thức nguồn |
| S6 | `PISA_Mock_First_Redesign_Claude_Prompt.md` | Đề xuất overhaul trước PR4; câu hỏi không còn mở nếu S7 đã ghi nhận quyết định |
| S7 | PR #4, spec/assumptions/source tại head `3d52b545afbb7aa35eeffd56dc10d336cb15f70e` | Baseline triển khai đã merge, không phải đích redesign mới |
| S8 | `Web Redesign & System Logic Revision Prompt.md`, 16 nhóm yêu cầu | Hướng hiện hành do người dùng cung cấp |
| S9 | Bản chỉnh trực tiếp `Web_Redesign_System_Logic_Revision_Prompt.md` | Giữ S8, bổ sung review và đề xuất ở vòng này |

Repo/PR: https://github.com/Pizi147/pisa-tracking/pull/4 . Review lần này đọc source và tài liệu; chưa chạy lại UI hoặc kiểm thử trình duyệt. Test 43/43 trong PR là báo cáo của tác giả PR, không phải kết quả kiểm tra của lần tổng hợp này. Chưa sửa source code/GitHub trong vòng này.

## 0b. CURRENT — trạng thái sau vòng D (09/09/2026)

Đây là MỘT chỗ duy nhất nói phiên bản đang chạy làm được gì. Mọi mục CURRENT rải rác ở
các phần dưới, nếu mâu thuẫn với bảng này, đều đã lỗi thời.

Ba cột trạng thái có nghĩa khác nhau và không được đọc lẫn:

| Trạng thái | Nghĩa |
|---|---|
| **Owner chốt** | Chính chủ trung tâm đã quyết bằng lời, ngày ghi kèm |
| **Đã chạy** | Đã có trong code, có kiểm tra tự động và đã chạy thử trên trình duyệt |
| **Đề xuất** | Claude tự quyết trong phạm vi được giao; owner chưa duyệt từng chi tiết |

| Mã | Nội dung | Trạng thái |
|---|---|---|
| **D50** | Vấn đề học vụ có HAI NGUỒN — sinh từ điểm, và giáo viên báo trực tiếp — nhưng dùng CHUNG một vòng đời: ghi nhận → phân loại → tác động → xem lại → chốt hướng xử lý | Owner chốt 09/09 · Đã chạy |
| **D51** | Vấn đề giáo viên báo mang MỨC ĐỘ GẤP (bình thường / cần chú ý / gấp), KHÔNG mang mức SOS 1/2/3. SOS là kết luận từ điểm; gán nó cho một quan sát trên lớp là làm hai loại thông tin trông giống nhau trong khi bản chất khác hẳn | Owner chốt 09/09 · Đã chạy |
| **D52** | Kết thúc theo dõi một vấn đề: chỉ GVCN của lớp và Quản lý. Giáo viên bộ môn báo được, ghi việc đã làm được, nhưng không tự kết luận là xong | Owner chốt 09/09 · Đã chạy |
| **D53** | SOS tính NGAY trên phần điểm đang có, không chờ đủ bốn kỹ năng. Kết luận được đánh dấu là TẠM THỜI và có thể tăng khi các kỹ năng còn lại vào. Áp dụng cho cả lớp FT và lớp thường | Owner chốt 09/09 · Đã chạy |
| **D54** | Lớp thường KHÔNG có cơ chế miễn kỹ năng. Dời lịch sang tuần khác thì được, nhưng bộ kỹ năng của chương trình luôn đủ | Owner chốt 09/09 · Đã chạy |
| **D55** | Hạn nhập điểm lớp thường: HẾT CHỦ NHẬT của chính tuần đó. Chưa có tuần kế hoạch thì KHÔNG có hạn — để trống chứ không dựng một hạn giả | Owner chốt 09/09 · Đã chạy |
| **D56** | Báo cáo tuần điền được tới HẾT THỨ TƯ tuần kế tiếp rồi khoá cứng; chỉ Quản trị hệ thống mở lại được, và mỗi lần mở đều có dấu vết | Owner chốt 09/09 · Đã chạy |
| **D57** | Bỏ hết giờ khỏi lịch đánh giá — chỉ còn ngày | Owner chốt 09/09 · Đã chạy |
| **D58** | Bảng tổng hợp theo tuần cho Quản lý, mười cột, gom theo tháng, mọi con số bấm được để mở đúng các bản ghi tạo nên nó | Owner chốt 09/09 · Đã chạy |
| **D59** | GHI NHẬN NHANH thay bảng "Đánh giá GV": tối thiểu chỉ cần MỘT nhận định bằng lời HOẶC một điểm ước lượng. Ba kiểu căn cứ ghi rõ (nhận định · có bài L/R · có chấm bốn tiêu chí). Nhận định bằng lời KHÔNG bị quy ra số để đem trừ | Đề xuất · Đã chạy |
| **D60** | Lộ trình có ĐIỂM XUẤT PHÁT kèm nguồn, KẾT LUẬN CUỐI và LỊCH SỬ ĐỔI MỤC TIÊU. Hệ thống không lấy MT1 làm điểm đầu vào; đóng lộ trình không đồng nghĩa đạt mục tiêu; đổi mục tiêu phải có lý do và không chấm lại quá khứ | Đề xuất · Đã chạy |
| **D61** | Hồ sơ học viên dựng quanh MỘT lộ trình, có bộ chọn lộ trình trên đường dẫn. Thứ tự khối: đầu vào→hiện tại→đích · so với mốc + đang vướng gì · từng kỹ năng · vấn đề · các lần đánh giá · hành trình | Đề xuất · Đã chạy |
| **D62** | Hành trình gom thành CHƯƠNG: mọi việc quanh một vấn đề nằm chung một chỗ, mọi ghi nhận trong một tuần nằm chung một chỗ | Đề xuất · Đã chạy |
| **D63** | ~~Màn HỌC THUẬT cho Quản lý: bốn hàng đợi và lọc theo chi nhánh / nhóm vấn đề / kỹ năng~~ **Thay bằng D74** — bốn hàng đợi cố tình chồng nhau nên bốn số không cộng thành gì, và người đọc không biết mình đang nhìn một phép chia hay một danh sách | Thay thế 10/09 |
| **D64** | Phân loại vấn đề chỉ ba nhóm gốc: Học sinh · Quá trình dạy · Chương trình. Phụ huynh, sức khoẻ, gia đình, đi lại, lịch cá nhân, áp lực bên ngoài chỉ là BỐI CẢNH kèm theo, không phải nhóm thứ tư và không phải nguyên nhân đã xác minh | Đề xuất · Đã chạy |
| **D65** | Một vấn đề có NHIỀU tác động, mỗi tác động nhiều lần xem lại. Ghi "đã xong" phải có ngày thật; người nhập KHÔNG mặc định là người làm — khai "chính tôi làm" là một thao tác tường minh, và tên người ngoài hệ thống (CS, phụ huynh) được giữ nguyên | Đề xuất · Đã chạy |
| **D66** | Chỉ còn MỘT đường ghi cho vấn đề học vụ. Năm cột hỗ trợ cũ trong `sos_cases` chỉ còn để dữ liệu cũ không mất và để bước nâng cấp đọc một lần | Đề xuất · Đã chạy |
| **D67** | Quy trình phối hợp theo lần MT × mức SOS giữ nguyên nội dung nhưng chuyển thành GỢI Ý CHỈ ĐỌC, tách khỏi việc đã làm. Trước đây điền tên vào ô hướng dẫn là vấn đề trông như đã xử lý xong dù chưa ai làm gì | Đề xuất · Đã chạy |
| **D68** | Màn TỔNG QUAN là VIỆC CỦA CHÍNH NGƯỜI ĐANG XEM, không phải một bảng số theo tuần. Mỗi dòng là một học viên, một câu lý do, một nút bấm được. Việc người xem không có quyền làm thì KHÔNG XUẤT HIỆN — máy chủ lọc trước khi trả về, chứ không phải giao diện ẩn nút | Owner chốt 10/09 · Đã chạy |
| **D69** | Việc gấp KHÔNG tách thành nhóm riêng. "Quá hạn nhập điểm" và "chưa ai bắt tay vào" là hai chuyện khác hẳn nhau; gộp vào một nhóm "Cần làm ngay" thì nhìn vào không biết cái nào là cái nào. Việc gấp xếp lên đầu TRONG nhóm của nó, nhóm nào có việc quá hạn thì xếp trước | Owner chốt 10/09 · Đã chạy |
| **D70** | Nhãn quá hạn nói rõ QUÁ HẠN CÁI GÌ: Quá hạn nhập điểm · Quá hạn hỗ trợ · Quá hạn duyệt · Quá hạn cập nhật kết quả · Quá hạn cập nhật ngày MT. Một chữ "Quá hạn" trơ trọi bắt người đọc đọc tiếp cả dòng, trong khi cùng màn hình đang có năm loại hạn | Owner chốt 10/09 · Đã chạy |
| **D71** | CHÍNH NGƯỜI ĐỀ XUẤT quyết định phương án của mình có cần Quản lý duyệt hay không, theo từng phương án. Bắt duyệt hết là biến phần mềm thành cửa xin phép; không duyệt gì thì việc tốn tiền lại không ai chịu trách nhiệm. Đã gửi duyệt thì CHỜ — chưa cập nhật kết quả được, vì việc thật sự chưa diễn ra | Owner chốt 10/09 · Đã chạy |
| **D72** | Quản lý phải trả lời trong 3 ngày (SOS 3 hoặc mức gấp) hoặc 7 ngày: duyệt · không duyệt (BẮT BUỘC ghi lý do) · góp ý. GÓP Ý KHÔNG KẾT THÚC VIỆC CHỜ. Đã trả lời rồi thì không sửa đè — đổi ý thì đề xuất lại, để hồ sơ giữ cả hai lần và không xoá mất lý do đã ghi. `approval_state` NULL nghĩa là KHÔNG cần duyệt, khác hẳn `pending` | Owner chốt 10/09 · Đã chạy |
| **D73** | Cập nhật kết quả sau hỗ trợ là việc của NGƯỜI THỰC HIỆN (không có tài khoản thì người ghi). Quá hạn thì Quản lý cũng thấy, để việc không rơi mất khi người thực hiện quên | Owner chốt 10/09 · Đã chạy |
| **D74** | Màn Học thuật cũ thành TAB THỨ HAI của Tổng quan cho Quản lý, với BA TRẠNG THÁI LOẠI TRỪ NHAU cộng lại đúng bằng tổng: chưa có phương án hỗ trợ · đang xử lý · đã xong (làm mờ và đẩy xuống cuối, KHÔNG giấu). Hai câu hỏi thật sự khác biệt còn lại (tới hạn xem lại · mức cao hoặc gấp) xuống dưới và nói rõ là câu hỏi | Owner chốt 10/09 · Đã chạy |
| **D75** | Mọi lựa chọn lọc kèm SỐ ĐẾM, tính chéo theo kiểu facet (mỗi chiều đếm trên tập đã lọc bởi các chiều KHÁC). Có riêng lựa chọn "Chưa phân loại" để các số cộng lại đúng bằng tổng — thiếu nó thì "Học sinh 3" nằm cạnh danh sách 34 dòng và người đọc chỉ có thể kết luận là hệ thống đếm sai | Đề xuất · Đã chạy |
| **D76** | Phân công giáo viên vào lớp: Quản lý VÀ Admin chi nhánh (`class.assign`) — tạo được lớp thì phải xếp được người dạy. Mỗi kỹ năng là một DANH SÁCH (có lớp hai người cùng dạy một kỹ năng). Màn hình gửi lên NGUYÊN bức tranh, không gửi từng thao tác thêm/bớt. BỎ PHÂN CÔNG KHÔNG PHẢI LÀ XOÁ: dòng cũ đóng lại bằng `effective_to`, dòng không đổi giữ nguyên `effective_from` | Owner chốt 10/09 · Đã chạy |
| **D77** | Admin chi nhánh MẤT HẲN `score.override` (đóng O05). Người không dạy kỹ năng đó thì không có căn cứ nào để chấm; giáo viên vắng là chuyện đổi phân công chứ không phải chuyện văn phòng gõ điểm hộ. Đường nhập bù chỉ còn ở Quản trị hệ thống và vẫn ghi nhật ký riêng | Owner chốt 10/09 · Đã chạy |
| **D78** | Quyền GHI NHẬN và trách nhiệm QUYẾT ĐỊNH là hai chuyện khác nhau. Admin chi nhánh giữ `sos.edit` để ghi hộ việc CS gọi phụ huynh, nhưng màn việc không giao cho họ "đề xuất phương án hỗ trợ" — đó là việc của người DẠY em hoặc của Quản lý | Đề xuất · Đã chạy |
| **D79** | Một vấn đề = MỘT LƯỢT × MỘT KỸ NĂNG. Một kỹ năng có nhiều vấn đề khác nhau theo thời gian (MT2 dính bẫy distractors, MT4 thiếu từ vựng) nên mỗi cái phải có vòng đời riêng: xong phương án thì đóng, lượt sau trượt lại thì mở vấn đề mới. "MẠCH" theo kỹ năng KHÔNG phải một bảng — nó là cách gom khi hiển thị, nên vẫn đọc được "Listening trượt lần thứ ba" mà không thêm tầng dữ liệu nào. Thay phương án mạch-là-thực-thể đã bàn trước đó | Owner chốt 10/09 · Vòng 3 |
| **D80** | Học thuật chia 5 ô L · R · W1 · W2 · S. W1 và W2 so RIÊNG với cùng kỳ vọng. SOS vẫn đếm 4 kỹ năng (Writing gộp) nên SOS và số case là HAI ĐƠN VỊ KHÁC NHAU, giao diện phải nói rõ. Một em band Writing đạt vẫn có thể có case ở W1 — band gộp đang che một lỗ hổng thật | Owner chốt 10/09 · Vòng 3 |
| **D81** | SOS chỉ là INDICATOR, không phải hệ thống công việc song song. Nó gắn nhãn mức độ và kích hoạt vài việc mặc định; mọi can thiệp học thuật dù sinh từ SOS hay giáo viên tự ghi đều quy về cùng một mạch kỹ năng | Owner chốt 10/09 · Vòng 3 |
| **D82** | Hai việc trao đổi bắt buộc (GVCN+GVBM gặp HS, CS gặp PH) nằm ở bảng LIÊN HỆ riêng, không phải phương án hỗ trợ: không duyệt, không hẹn xem lại, không kết quả chuyên môn. Nhét vào bảng phương án thì mỗi màn hình phải viết một câu "trừ hai loại này ra" | Đề xuất · Owner duyệt 10/09 |
| **D83** | Hai họ việc tách bạch: PHƯƠNG ÁN HỖ TRỢ (giáo viên tự làm) và ĐỀ XUẤT (luôn cần Quản lý trả lời). Chọn nhóm Đề xuất tức là đang xin ý kiến, nên ô tick "cần duyệt" chỉ còn ở nhóm thứ nhất — bớt một quyết định mỗi lần ghi | Đề xuất · Owner duyệt 10/09 |
| **D84** | Vấn đề Giáo viên và Giáo trình rời khỏi hệ thống theo dõi học sinh, về Báo cáo tuần chi nhánh (đã có sẵn đúng ba nhóm ở Q3). Không làm module mới — hai nơi ghi cùng một loại vấn đề là thứ đang cố tránh. Đảo một phần D64, có chủ ý | Owner chốt 10/09 · Vòng 3 |
| **D85** | Bảng và dashboard trải hết chiều rộng; khối nhiều chữ trải hết nhưng CHIA CỘT thay vì kéo dài một dòng quá tầm mắt. Tuỳ chỉnh cột làm ở mức 3-4 bộ đặt sẵn nhớ theo tài khoản, chưa bật/tắt từng cột | Owner chốt 10/09 · Vòng 3 |
| **D86** | Chi tiết Listening đổi thành: Từ vựng/ngữ pháp · Kỹ năng làm bài · Cảm âm · Hay dính bẫy distractors · Tâm lý/khả năng tập trung · Nghe hiểu ý chính · Khác. Reading: Từ vựng/ngữ pháp · Kỹ năng làm bài · Mơ hồ ý chính · Tư duy logic · Khác. W và S giữ nguyên bốn tiêu chí chấm, dùng CHUNG cho cả W1 lẫn W2 | Owner chốt 10/09 · Vòng 3a |
| **D87** | HẠN SUY THẲNG TỪ MỨC GẤP: 7 · 5 · 3 ngày. Một bảng duy nhất cho cả hạn xử lý vấn đề lẫn hạn Quản lý trả lời đề xuất — trước đó là hai ngưỡng rời nhau cùng nói một chuyện | Owner chốt 10/09 · Vòng 3a |
| **D88** | Hai việc trao đổi bắt buộc áp cho CẢ lớp thường; nhưng lớp thường KHÔNG tự sinh phương án hỗ trợ, vì quy định SOS 1-2 tự học / SOS 3 tutor gắn với mức SOS theo band mà lớp thường không có | Owner chốt 10/09 · Vòng 3a |
| **D89** | Quản lý chi nhánh có tab Báo cáo tuần riêng, và tạo được hai loại việc: VIỆC CHI NHÁNH (giáo trình, vận hành — không gắn học viên) và VIỆC GIAO GIÁO VIÊN (gắn lớp/kỹ năng/học viên, TOẢ RA thành phương án trong mạch từng em). Một task cho lớp 13 em là MỘT task cập nhật một lần, không phải 13 bản sao | Owner chốt 10/09 · Vòng 3b |
| **D90** | Nâng cấp dữ liệu cũ KHÔNG bịa ra phép tách không có căn cứ: chỉ gắn kỹ năng cho vấn đề trượt đúng một kỹ năng; trượt từ hai trở lên thì để trống và giao diện ghi rõ "chưa gắn kỹ năng". Chỉ những lượt chấm TỪ NAY mới sinh vấn đề theo từng kỹ năng | Đề xuất · Đã chạy |
| **D91** | CHIỀU RỘNG: bảng và dashboard trải HẾT; khối nhiều chữ trải hết bằng cách CHIA CỘT chứ không kéo dài một dòng quá tầm mắt. Bảng rộng hơn màn hình thì cuộn TRONG CHÍNH NÓ (`.table-scroll`) — để cả trang trượt ngang là lỗi nặng nhất ở màn hẹp vì thanh điều hướng trôi theo | Owner chốt 10/09 · Vòng 3b |
| **D92** | Cột phải của Tổng quan ĐỔI THEO VAI: giáo viên và Quản lý thấy "Lớp của bạn"; Admin chi nhánh thấy "Lớp của chi nhánh" (tên cũ sai — nó vốn hiện toàn bộ lớp của chi nhánh chứ không phải lớp họ dạy); Quản trị hệ thống bỏ hẳn. Cột này CUỘN RIÊNG, không dính theo cuộn của cả trang | Owner chốt 10/09 · Vòng 3b |
| **D93** | Bảng tổng hợp của Quản lý dùng CHUNG `listCases` với danh sách bên dưới, nên số trên bảng và số dòng khi bấm vào luôn khớp. Ô dạng `12/5` = tổng / chưa có phương án. SOS đếm HỌC VIÊN, cột kỹ năng đếm VẤN ĐỀ — hai đơn vị khác nhau, giao diện phải nói rõ. Hàng tổng cộng từ chính các hàng trên | Đề xuất · Đã chạy |
| **D94** | Khối riêng của Quản lý có hai cách nhìn: THEO LỚP mở sẵn (câu hỏi mỗi sáng) và THEO NGƯỜI thu gọn (khi phải đi thúc ai). Bảng theo người KHÔNG tô màu tốt/xấu và KHÔNG xếp hạng — một bảng "giáo viên nào chậm nhất" biến công cụ điều phối thành công cụ đánh giá, và người ta sẽ học cách làm đẹp số thay vì làm việc | Owner chốt 10/09 · Vòng 3b |
| **D95** | Hai việc trao đổi tới tay ĐÚNG NGƯỜI: gặp học sinh → người DẠY lớp đó; gọi phụ huynh → văn phòng. Quản lý thấy cả hai vì họ là người đôn đốc. Bày cả hai cho mọi vai thì ai cũng nhận một danh sách quá nửa là việc người khác, rồi bỏ qua cả những dòng thật sự của mình | Đề xuất · Đã chạy |
| **D96** | Bộ cột đặt sẵn (`user_prefs`) thay cho bật/tắt từng cột. Mười lăm ô tick là thứ dễ làm nhưng gần như không ai dùng, và đúng chỗ hệ thống bắt đầu rối | Owner chốt 10/09 · Vòng 3b |

Những điều vòng này CỐ TÌNH KHÔNG làm, và lý do:

- **Không dựng nhãn tổng hợp kiểu "đang ổn / có nguy cơ / sắp trượt".** Chưa có quy tắc nào
  được chốt cho một nhãn như thế, mà một nhãn sai còn tệ hơn không có nhãn. Thay vào đó nói
  hai chuyện tách bạch: SO VỚI MỐC (từng kỹ năng đạt hay dưới kỳ vọng đã chốt) và ĐANG CẦN
  CHÚ Ý (có vấn đề nào đang mở, ai báo, đã làm gì).
- **Không nội suy kỳ vọng theo tuần.** "Tuần này lẽ ra phải được 6.0" là một con số bịa; kỳ
  vọng chỉ tồn tại ở đúng các mốc MT.
- **Không ghép bốn kỹ năng mới nhất của bốn lượt khác nhau thành một Overall.** Bốn buổi khác
  nhau cộng lại không phải là một bài thi.
- **Không tự kết luận tác động tạo ra thay đổi.** Lần xem lại là QUAN SÁT SAU HỖ TRỢ; điểm lên
  cũng không tự kết thúc theo dõi.

## 1. Hướng sản phẩm hiện hành

**D01 — CURRENT:** Internal academic + branch operations; theo dõi học sinh, assessment, SOS, trạng thái xử lý và nhận định quản lý. Không mở rộng thành CRM/ERP/LMS/task platform.

**D02 — CURRENT:** Nhập dữ liệu một lần, các module chỉ là view của cùng record. Liên kết bằng ID; không copy điểm/case/Warning thành dữ liệu rời để làm báo cáo. UX gọn, ít menu/filter/badge; overview đủ scan, detail đủ phân tích; bulk update, autosave/no reload cho chỉnh sửa thường xuyên.

**D03 — CURRENT:** Bỏ accent xanh lá nổi bật; pastel/light blue hoặc pink hay sắc nhẹ tương đương. Clean/calm, tương phản đọc được. Desktop-first nhưng có layout mobile thực tế, không ép mọi cột desktop vào màn hẹp.

**D04 — ĐÃ TRIỂN KHAI vòng B; vòng D thêm `Học thuật`; từ 10/09 rút còn HAI mục, xem D74:** Navigation nay là `Tổng quan → Học viên`; Học thuật thành tab thứ hai của Tổng quan cho Quản lý, còn Tiến trình công việc và Quản trị là lối phụ trong menu tài khoản. Học viên class-first, cùng Student Detail chứa tiến độ/hồ sơ/Journey/SOS. `Cần nhập điểm` và `Cần xếp lịch` là view/shortcut theo vai trò, không menu độc lập. Đã chọn **Option B**: điều hướng còn ba mục, `Mock test` và `Họp tuần` không còn là menu riêng; đường dẫn cũ `/mock-test`, `/mock-test/lop/:id`, `/hop-tuan` đều chuyển hướng chứ không 404. Tiến độ MT gộp vào roster của lớp (`MT1 ✓ · MT2 ✓ · MT3 W4 OCT`), không còn màn hình tiến độ riêng.

**D05 — ĐÃ TRIỂN KHAI vòng B:** Class row: click tên mở Class Overview; click badge mở tập bản ghi tương ứng (đã lọc sẵn theo lớp); click vùng khác expand roster. Một search tìm lớp hoặc học sinh — gõ tên học viên trả về đúng lớp chứa em đó. Ba vùng bấm chặn nổi bọt sự kiện, đã kiểm chứng trên trình duyệt thật. Dòng lớp là `role="button"` có `aria-expanded`, mở bằng Enter và Space. **NHIỀU lớp mở cùng lúc và độc lập** — mở lớp thứ hai không đóng lớp thứ nhất, vì việc thật là đặt hai lớp cạnh nhau mà so. Lớp đang mở, search và bộ lọc chi nhánh đều nằm trên URL nên Back khôi phục đúng ngữ cảnh. Roster lazy load khi expand; badge chỉ hiện khi có việc cần làm và đếm theo phân công của chính người đang xem.

## 2. Tổ chức, quyền và phân công

**D06 — CURRENT:** Năm chi nhánh MB Monbay, BC Bãi Cháy, CP Cẩm Phả, HD Hải Dương, UB Uông Bí. Mở rộng bằng dữ liệu. Tutor part-time là reporting unit, không phải chi nhánh thứ sáu. Chi nhánh có nhiều quản lý, thường 2–3.

**D07 — CURRENT:** Quản trị hệ thống (`system_admin`), Quản lý (`manager`, Head), Admin chi nhánh (`branch_admin`, nhân sự văn phòng), Giáo viên (`teacher`). Consultant/Consultant Manager DEFERRED; trường tư vấn viên trên hồ sơ chỉ là metadata. Không dùng chung nhãn “Admin” gây nhầm quản trị phần mềm với văn phòng.

**D08 — CURRENT:** Role + permission + scope + assignment; một user nhiều grants, không ghép permission của grant A với scope của B. Backend và frontend đều kiểm tra; giới hạn cả field/read/search. Role view không nâng quyền; đổi tài khoản demo riêng và xóa cache cũ.

**D09 — CURRENT:** GVCN là capability theo lớp/thời gian; GVBM xem toàn cảnh học vụ lớp được giao, sửa skill được giao. W1/W2 là phân công riêng. GVCN thêm tình hình chung, Report/WL và thời gian nhận/xử lý; không có quyền lịch hay mọi điểm chỉ vì chủ nhiệm.

| Capability | Quản trị hệ thống | Quản lý | Admin CN | Giáo viên/GVCN | Nguồn/trạng thái |
|---|---|---|---|---|---|
| Tạo lớp, thêm học sinh/bulk | Có theo scope | Có theo scope | Có theo scope | Không được cấp trong yêu cầu | S8 CURRENT |
| Tạo programme/template | Có | Override lớp nếu được cấp | Override lớp nếu được cấp | Không | S8 CURRENT; chi tiết override OPEN |
| Chốt tuần MT | `plan.week` — ngoại lệ quản trị | `plan.week` | Không | Không | ĐÃ TRIỂN KHAI vòng A |
| Chốt ngày/giờ LRW trong tuần | `schedule.date` — ngoại lệ | Không (không gộp với quyền tuần) | `schedule.date` | Không | ĐÃ TRIỂN KHAI vòng A |
| Chốt ngày S | `schedule.date` | Không | `schedule.date` | `schedule.speaking` theo phân công | ĐÃ TRIỂN KHAI vòng A; S ngoài tuần bị từ chối |
| Đổi custom deadline | `deadline.override` | `deadline.override` | `deadline.override` | Không | ĐÃ TRIỂN KHAI vòng A; phạm vi theo skill vẫn OPEN (O02) |
| Kỹ năng không mock của MT | `attempt.skip_skill` | `attempt.skip_skill` | `attempt.skip_skill` | Không | ĐÃ TRIỂN KHAI vòng A |
| Hủy MT | Có | Có | Có | Không kể cả GVCN | S7 ghi đã chốt, không bị S8 thay thế |
| Nhập điểm | `score.override` | Không | Không | `score.edit` đúng skill/task và lớp | Owner chốt 10/09 (D77): Admin CN mất `score.override`, O05 đóng |
| Ước lượng giáo viên | Không | Không | Không | `estimate.edit` đúng skill được giao | ĐÃ TRIỂN KHAI vòng A |
| Report/WL tình hình chung | Theo quyền quản trị | Theo scope | Trường nhập hộ OPEN | GVCN lớp đó; GVBM không tự có quyền tổng hợp | S0/S8 |
| Tiến trình công việc | `meeting.view/edit` | `meeting.view/edit` | KHÔNG cấp | Không | ĐÃ TRIỂN KHAI vòng A; capability hẹp cho Admin CN vẫn chờ owner |
| Đóng/mở lại SOS | `case.close` | Không | `case.close` | GVCN của chính lớp đó | Owner chốt 09/09 (Q12) |
| Duyệt phương án hỗ trợ | `case.approve` | Không | `case.approve` | Không | Owner chốt 10/09 (D71–D72) |
| Phân công giáo viên vào lớp | `class.assign` | `class.assign` | `class.assign` | Không | Owner chốt 10/09 (D76) |

**D10 — CURRENT:** Giáo viên lớp mới cần thông tin bàn giao. **OPEN:** quyền đọc/sửa lịch sử sau khi hết assignment, xử lý case xuyên chi nhánh, actor nhập hộ và quyền override học thuật. Không mặc định giữ quyền vĩnh viễn theo một enrollment quá khứ.

## 3. Học sinh, lớp, programme và lifecycle

**D11 — CURRENT:** Student ID tự sinh, unique, giữ nguyên xuyên chuyển lớp/LT/học lại. Student + enrollment history; không chỉ thay classId. Giữ điểm, estimate, SOS, Report/WL và journey. Roster tính theo thời gian hiệu lực; lịch học bổ trợ không nhân đôi học sinh chính.

**D12 — ĐÃ TRIỂN KHAI vòng C:** Mã lớp bắt đầu branch code; không hardcode FT5/FT10. Quản lý cấu hình FT type, kỹ năng, số buổi chính; template có phiên bản. `FOU` là mã canonical của Foundation; `FOUND` chỉ được ÁNH XẠ KHI ĐỌC. Cột `classes.kind` giữ nguyên chữ đã gõ, cột `classes.programme_code` là mã chuẩn hoá mà mọi tính toán đọc vào — không đổi mã lớp lịch sử. Kỹ năng của lớp lấy theo chương trình, nên lớp Foundation có Pronunciation chứ không có Writing task 1/2.

**D13 — CURRENT:** Chỉ ba trạng thái học sinh: Active đang học; Inactive tạm dừng; Finished dừng hẳn. LT1/LT2 là lộ trình/cycle, không phải status. Finished làm dịu màu, khoảng hai tuần vào Archive; archive không xóa dữ liệu. **OPEN:** chính xác 14 ngày từ mốc nào, quyền khôi phục, xử lý lịch/case còn mở. **PROPOSED:** archive metadata riêng, không là status thứ tư và không tự đóng nghĩa vụ.

**D14 — ĐÃ CHỐT 09/09/2026 (owner), triển khai vòng A:** Ranh giới cycle là LỘ TRÌNH, không phải "học lại". Học tiếp/học lại TRONG cùng lộ trình thì số MT tăng tiếp (MT6, MT7…), target giữ nguyên, nên kỳ vọng vẫn bằng target (từ MT3 trở đi đã là bằng target). Sang lộ trình mới (LT1 → LT2) mới đánh số lại từ MT1 vì đã có target mới. Định danh `UNIQUE(cycle_id, attempt_no)`; mỗi cycle giữ target và ngày thi IELTS riêng. **Vẫn OPEN:** mốc tuần học tính lại từ đâu sau pause/repeat.

**D15 — ĐÃ TRIỂN KHAI vòng B:** Bulk Add/Paste/Excel: tên, lớp, DOB, ngày IELTS dự kiến, lộ trình, consultant metadata, tuần MT; prefill lớp nếu mở từ lớp. Preview/sửa/import nhanh. Đã thêm target và mốc bắt đầu cycle. **Tuần MT đề xuất chỉ thành KẾ HOẠCH khi người nhập có `plan.week`** — người không có quyền vẫn thêm được học viên nhưng tuần đề xuất bị bỏ qua, để đường nhập hàng loạt không thành lối vượt quyền lập kế hoạch. Tuần đề xuất lấy theo mốc **tuần HỌC** (MT1 tuần 6, MT2 tuần 12, MT3 tuần 16). Lộ trình bỏ trống thì **kế thừa từ lớp**; thiếu target vẫn nhập được, chỉ cảnh báo chưa tính được kỳ vọng — hệ thống không tự đoán target.

**D16 — ĐÃ TRIỂN KHAI vòng B:** Import server-side validate, duplicate candidates thay auto merge; ID trong transaction, idempotency, lỗi từng dòng, giữ tên gốc/ngày chuẩn. Paste TSV và `.xlsx/.csv` chung panel. Classes/Teachers/Enrollments/historical scores import đầy đủ là hướng mở rộng; vòng này tập trung lớp/HS/enrollment/kế hoạch cần dùng, không ép nhập lịch sử tất cả. **Đã chốt thêm:** ngày đọc theo định dạng người dùng CHỌN (`d/m/y`·`m/d/y`·ISO), chuỗi mơ hồ thì báo lỗi chứ không đoán. Xem trước chạy TỰ ĐỘNG (debounce 400ms), không đợi bấm nút, để lỗi hiện ra trước khi ghi. Nhãn nút đếm đúng số dòng SẼ ghi. Còn dòng lỗi thì khoá nút — không để dòng nào âm thầm biến mất khỏi lô — nhưng gỡ được trong một lần bấm "Bỏ qua N dòng lỗi". Dòng ngoài phạm vi quyền bị bỏ qua kèm lý do và KHÔNG làm hỏng cả lô: một dòng sai không kéo theo 39 dòng đúng; máy chủ kiểm hai lớp (lúc xem trước và một lần nữa ngay trước khi ghi).

**D17 — CURRENT:** Journey giữ LT bắt đầu/kết thúc, học lại, chuyển lớp, pause/resume, ngày IELTS thay đổi, assessment, estimate, SOS/Report/WL. Chỉ `Tất cả / Assessment / Warning–WL` làm nhóm lọc; không filter riêng từng lifecycle event. Journey là câu chuyện học, audit kỹ thuật ở phần khác.

## 4. Assessment, lịch, điểm và Teacher Estimate

**D18 — ĐÃ CHỐT & TRIỂN KHAI vòng C:** Quản lý chốt Planning Week sớm. Admin CN **và Quản lý** CẬP NHẬT NGÀY MT THỰC TẾ theo lịch bộ phận xếp lịch đã bố trí từ Chủ nhật tuần trước — đây không phải "chốt lịch", và khi học viên nghỉ phải dời thì Quản lý sửa được ngay. **CHỈ NGÀY, KHÔNG GIỜ**: giờ mock đã bỏ hoàn toàn. GV Speaking cập nhật được NGÀY Speaking của học viên mình; GV L/R/W tuyệt đối không, GVCN cũng không. LRW/S là cùng attempt, có thể khác ngày. **Việc phụ thuộc thời điểm:** "cần cập nhật ngày" chỉ là việc khi ĐÃ ĐẾN tuần MT (hoặc đã qua mà còn thiếu); MT các tuần sau không surface. Badge "Chưa có ngày" đã bỏ khỏi mọi nơi, thay bằng một màn thao tác HÀNG LOẠT duy nhất. Ngày Mock không đụng ngày IELTS chính thức.

**D19b — ĐÃ CHỐT 09/09/2026 (owner), triển khai vòng A:** TUẦN KẾT QUẢ của một lượt là TUẦN KẾ HOẠCH do Quản lý chốt (`planned_period_id`). LRW và Speaking lệch tuần không làm lượt bị đếm hai lần. Hạn nhập điểm và việc "cần nhập điểm" của giáo viên vẫn tính riêng theo từng kỹ năng.

**D19 — CURRENT:** Tuần thứ Hai–Chủ nhật; thuộc tháng có nhiều ngày hơn (tháng chứa thứ Năm); W1…W4/5 theo tháng, key ngày đầu tuần+năm. `28/9–4/10/2026 → W1 OCT`, `7–13/9/2026 → W2 SEP`. `W10 NOV` không hợp lệ, còn tuần học 10 của BE/ELE hợp lệ. Ngày chi tiết ở detail; tổng quan ưu tiên mã tuần.

**D20 — ĐÃ TRIỂN KHAI vòng A:** Hạn mặc định là thứ Tư tuần kế tiếp sau buổi mock CỦA CHÍNH KỸ NĂNG đó — LRW theo lịch chính, Speaking theo lịch Speaking. Có ngày mock thực tế thì tính theo ngày đó, chưa có thì theo lịch. Chỉ MỘT hạn hiệu lực: hạn tự đặt (`deadline.override`, có người/thời điểm/lý do và nút "Dùng lại hạn mặc định") thay hạn mặc định. Chưa có lịch nào thì KHÔNG có hạn, hiển thị "Chưa có lịch" thay vì dựng hạn giả. Hết ngày hạn mới tính quá hạn, ngày nghiệp vụ `Asia/Ho_Chi_Minh`. **Vẫn OPEN (O02):** override theo từng kỹ năng thay vì cả lượt; đổi lịch có giữ hạn riêng không; Speaking ngoài tuần kế hoạch có cần Quản lý duyệt không.

**D21 — CURRENT:** MT khoảng 2–5 lần, mốc gợi ý FT W6/12/16/20/24, MT4/5 tùy chọn. Tuần học khác tuần lịch. Không prefill năm lịch đã chốt cho mọi em. Dời/hủy giữ attempt và lịch sử; không sinh lượt mới chỉ vì đổi ngày.

**D22 — ĐÃ TRIỂN KHAI vòng A, mở rộng vòng C:** Mặc định MỌI kỹ năng đánh giá đều bắt buộc. Khi thực tế học viên không mock một kỹ năng, Quản lý/Admin CN đánh dấu NGOẠI LỆ "không mock" cho chính lượt đó (`attempt_skill_skips`), và SOS tính trên các kỹ năng còn lại. Không ai đánh dấu thì hệ thống chờ đủ bốn, không tự suy. Đánh dấu sau khi đã có điểm thì GIỮ điểm cũ và ghi lịch sử. Tiến độ từng kỹ năng tách sáu trạng thái: không mock · chờ xếp lịch · sắp tới · chưa ghi nhận · đã mock chưa nhập điểm · đã có điểm. Ngày lịch trôi qua KHÔNG chứng minh đã mock. **Vòng C:** kỹ năng yêu cầu chọn NGAY KHI LÊN KẾ HOẠCH (mặc định đủ bốn, bỏ tick là không yêu cầu từ đầu). Phân biệt tuyệt đối **Không yêu cầu** với **Thiếu điểm**: lượt xong khi đủ điểm các kỹ năng ĐƯỢC YÊU CẦU, không chờ kỹ năng không yêu cầu. Không cho phép một lượt không yêu cầu kỹ năng nào.

**D23 — BASELINE-PR4, tiếp tục dùng nếu không có thay đổi:** L/R raw 0–40 bảng nội bộ; W1/W2/S mỗi phần bốn tiêu chí, average làm tròn 0.5; W=(W1+2W2)/3 làm tròn 0.5; Overall bốn band cùng attempt làm tròn 0.5. W1/W2 không thành hai môn SOS. S8 yêu cầu detail có raw/band và criteria; overview bốn band L/R/W/S. Phụ lục B giữ bảng L/R và luật FT chính xác.

**D24 — ĐÃ CHỐT 09/09/2026 (owner), triển khai vòng A:** SOS tính trên tập kỹ năng thực mock, giữ nguyên ngưỡng 1/2/≥3, kèm nhãn "Đánh giá trên N kỹ năng". Chỉ áp dụng khi có ĐÁNH DẤU không mock; không đánh dấu thì vẫn chờ đủ bốn. Lượt có kỹ năng bị loại thì KHÔNG có Overall IELTS, vì lượt đó không còn là bài bốn kỹ năng — điểm cũ của kỹ năng bị loại vẫn hiện để tra lại. **Vẫn OPEN:** trường hợp W chỉ bắt buộc một task; hiện W là một môn trọn gói, bỏ W là bỏ cả W1 và W2.

**D25 — ĐÃ TRIỂN KHAI vòng C:** Đổi tên **Ước lượng GV → ĐÁNH GIÁ GV**. Cập nhật bất kỳ lúc nào theo skill giáo viên — không phụ thuộc tuần MT, hạn nhập điểm hay lịch assessment — riêng với assessment official. **Nhập GIỐNG Mock**: L/R nhập raw/40, W/S nhập bốn tiêu chí; band là kết quả TÍNH RA, không gõ tay. **Một bảng chung** với điểm Mock kèm cột Δ, không phải hai bảng rời; bấm một ô mở căn cứ (raw hoặc bốn tiêu chí). **Δ = Mock − Đánh giá GV**, đọc theo học viên: dương = đang thể hiện tốt hơn mức GV đánh giá. (Bảng ví dụ trong prompt ghi Δ ngược với quy tắc màu ngay dưới nó; đã theo quy tắc màu vì nó nói rõ ý nghĩa cần đọc ra.) Có ngày/người/lịch sử. So latest Mock ↔ latest estimate tại nơi hữu ích, không mọi màn. **PROPOSED:** Student Progress/Detail là nơi chính; comparison cùng skill/scale, hiện cả ngày, không khẳng định chênh lệch là tiến bộ thật. **OPEN:** tổng hợp estimate W1/W2 hay giữ riêng. Không ghép điểm nhiều attempt thành một bài/Overall giả.

**D26 — ĐÃ TRIỂN KHAI vòng C:** FOU 8 tuần: Progress Test tuần học 4, Final tuần 8; L/R/Prep-W/Pronunciation. BE/ELE 10 tuần: Progress tuần5, Final tuần10; L/R/Prep-W/Speaking. Mỗi skill nhập score/total biến thiên; ≥60% Pass, <60% Fail. SOS theo 1/2/≥3 môn Fail. Reuse Assessment/SOS engine với scoring policy khác, không dùng FT band/commitment/MT intervention mặc định. **Đã làm:** dùng CHUNG `assessment_attempts` / `assessment_scores` / `sos_cases`; chỉ đổi cách chấm (`ratio`), mốc theo tuần học, và bộ kỹ năng theo chương trình. Lớp thường không có band, không có kỳ vọng theo target, không có Overall — để trống chứ không dựng số giả. Chuyển từ lớp FT sang lớp thường thì MỞ KHOÁ MỚI, không mượn lộ trình IELTS đang có.

**D27 — ĐÃ TRIỂN KHAI phần đã rõ, vòng C:** Hạn nhập, miễn skill, checklist hỗ trợ/escalation và closure cho lớp thường; total per paper/student và rubric số lẻ nếu có. **Đã làm:** đặt total chung cho cả lớp rồi override từng dòng; kiểm ở MÁY CHỦ `total > 0`, `0 ≤ score ≤ total`, cả hai đều là số nguyên; xét trên tỷ lệ CHÍNH XÁC trước khi làm tròn hiển thị (25/42 hiện "60%" nhưng vẫn là chưa đạt). Chương trình nằm trong bảng `programmes` + `programme_skills` + `programme_checkpoints` — thêm chương trình là thêm dữ liệu, không sửa mã; KHÔNG dựng curriculum builder. **Vẫn OPEN:** hạn nhập điểm lớp thường, miễn kỹ năng ở bài thường, cách ghi nhận đã làm bài, checklist hỗ trợ và tiêu chí đóng case của lớp thường.

**D28 — CURRENT:** Không dùng từ “thi” cho Mock trong UI. Dùng MT/Mock/Mock Test; từ “thi” dành cho IELTS chính thức. “Đã xong” cần thể hiện đúng completion; “Thiếu S”, “Chưa mock L/R” theo thực tế. Progress Test/Final Test gọi bài kiểm tra.

## 5. SOS, Report/WL và vận hành quản lý

**D29 — CURRENT (mở rộng vòng A):** FT expectation MT1 target−1, MT2−0.5, từ MT3 TRỞ ĐI bằng target — áp dụng cho cả MT6, MT7… của đợt học tiếp trong cùng lộ trình. Per skill L/R/W/S. Bằng kỳ vọng đạt; fail count 1/2/≥3 tương ứng SOS1/2/3. Áp dụng FT LT1/LT2 từ DOCX; không suy số MT học lại nếu chưa có quyết định. Chỉ tính khi đủ căn cứ theo policy được chốt.

**D30 — CURRENT:** Hỗ trợ theo bảng MT×SOS giữ ở detail, không tự cấp buổi học/lùi lịch IELTS. CS trao đổi PH ngoài hệ thống, ghi tên/ngày, tách actor thực hiện và người nhập. MT5 không tự sinh thời lượng hỗ trợ. Ngày hẹn tương lai khác đã thực hiện; có tên thiếu ngày chưa chứng minh đã làm.

**D31 — CURRENT:** Không auto-create Warning Letter; SOS học thuật khác Warning/WL kỷ luật. Report/WL là record/reference con người quyết định, không generate văn bản. GVCN cập nhật đã nhận, thời điểm, vấn đề/note và tiến trình. Nhận tài liệu phải phản ánh các view cùng nguồn.

**D32 — ĐÃ TRIỂN KHAI vòng C:** Case ba trạng thái chưa xử lý/đang xử lý/đã xử lý, **ba màu khác nhau ngay ở danh sách** kèm một dòng ngữ cảnh (mốc follow-up gần nhất, hoặc "Chưa có follow-up") — không phải mở chi tiết mới biết case đã được làm hay chưa. Acknowledgment (`acknowledged_by/at`) là metadata, tránh một trạng thái thứ tư không có giá trị. Ví dụ bốn trạng thái của S8 là gợi ý, không luật cố định. Report/WL không bắt buộc ở mọi SOS; nhiều references per student, liên kết case khi có. Nhận tài liệu không tự đóng case. **OPEN:** ai là người nhận được ghi, quyền close/reopen, tiêu chí resolved, acknowledgment nhập hộ.

**D33 — PROPOSED:** Sau sửa điểm, result revision thay đổi nhưng giữ case/history; kết quả 0 hoặc thiếu lại không tự xóa hay coi đã can thiệp xong. Không duplicate SOS case mỗi refresh. Số case khác số học sinh; học sinh có thể có nhiều case.

**D34 — ĐÃ BỎ, vòng C:** Head=Quản lý; xác nhận Head không dành Admin CN. Code `confirmCase` chỉ ghi người/ngày; không là gate của `updateCase` hay khóa điểm. **ĐÃ BỎ khỏi hệ thống.** Đối chiếu code chứng minh bước này không khoá điểm, không là điều kiện đổi trạng thái, không mở khoá bước nào và không gắn một trách nhiệm riêng nào — một cửa duyệt không bảo vệ điều gì. Quyền `sos.confirm`, hàm `confirmCase`, endpoint và nút đã gỡ; case kết thúc bằng chính trạng thái xử lý. Cột `head_confirmed_by/at` và lịch sử cũ GIỮ NGUYÊN để tra lại. Quyền đóng case vẫn OPEN.

**D35 — ĐÃ TRIỂN KHAI vòng A:** Bốn card — lịch MT tuần (kèm số chưa có ngày) · chưa nhập đủ điểm (kèm số quá hạn) · case SOS chưa xử lý · case SOS đang xử lý. Hai card SOS đếm CASE, rời nhau theo `status` và phủ hết case chưa xong; mỗi card mở đúng danh sách cấu thành (có test khoá lại). Case tồn tính đến hôm nay, không đổi theo tuần đang xem.

**D36 — CURRENT:** Họp tuần đổi thành Tiến trình công việc cạnh Tổng quan, chỉ Quản lý/System Admin. Bên trong Báo cáo tuần expand chi nhánh; tên chi nhánh mở Branch Overview. Admin CN chỉ được phần báo cáo nếu owner cấp riêng, không tự mở mọi quyền PR4.

**D37 — ĐÃ TRIỂN KHAI vòng C:** System generates facts → Manager adds judgement/context. Tín hiệu ĐỌC THẲNG từ dữ liệu, có khoá ổn định theo nguồn, TỰ HẾT khi nguồn được xử lý và KHÔNG tạo bản ghi mới mỗi lần đọc — không có nút "Đã xong" vì đánh dấu chỉ che một con số vẫn đúng. Mỗi tín hiệu ghi rõ VIỆC CỦA AI (tuần MT → Quản lý, ngày MT → Admin CN) và mở đúng bản ghi cấu thành. Auto facts về assessment, điểm, SOS, missing scores, Warning, case/student status. Manager ghi nhận định, vấn đề, nguyên nhân, ưu tiên, note, hướng xử lý. Student Progress Report khác Branch Weekly Report khác trạng thái nhận tài liệu.

**D38 — ĐÃ TRIỂN KHAI vòng C:** Ba nhóm branch Giáo viên / **Học sinh–Phụ huynh** / Giáo trình (vấn đề vận hành đến từ cả hai phía, một nhóm chung thay vì tách hai module); Tutor có Số lượng tutor/Chất lượng dạy học/Các vấn đề khác. 5×3+3=18 hiện tại nhưng tính động, không hardcode. Source năm nhóm là lịch sử; trống nghĩa chưa báo cáo, không phải Ổn.

**D39 — ĐÃ TRIỂN KHAI vòng C:** Không tạo task management vì đã có Base. Dữ liệu→việc cần chú ý→cập nhật→báo cáo cùng nguồn. Thiếu điểm tự hết khi đủ, case xử lý theo ghi nhận thực tế. Chỉ việc quản lý đặc thù nhập tay. **Trường "Loại" ĐÃ BỎ** khỏi form: nó không đổi routing, quyền, hạn hay cách tổng hợp; chỗ duy nhất nó tác động là một nhánh lọc yếu mà chính hạn của việc đã nói rồi. Cột cũ giữ giá trị lịch sử. **Thêm Người theo dõi** (nhiều người, không phải owner, được cập nhật khi tiến độ đổi), mặc định là Quản lý của chính chi nhánh đó. Người phụ trách và người theo dõi đều chọn bằng ô GÕ ĐỂ TÌM kèm vai trò/chi nhánh, không phải dropdown dài. **PROPOSED:** derived signals với key nguồn ổn định + ghi chú hành động/link Base; không sync Base ở MVP; giữ task cũ dạng lịch sử/reference khi migrate, không xóa âm thầm.

**D40 — ĐÃ CHỐT phần thời gian, vòng C:** **Báo cáo tuần chỉ cập nhật được trong HAI NGÀY CUỐI của chính tuần đó**, enforce ở MÁY CHỦ chứ không chỉ làm mờ nút — đầu tuần chưa có gì để báo cáo, tuần tương lai lại càng không (lỗi cũ: mở một tuần cuối năm vẫn nhập bình thường). Ô chọn tuần là CỬA SỔ TRƯỢT ~2 tháng lịch sử quanh tuần đang xem + 1 tuần tới, kèm mũi tên ← →. Báo cáo live cho kỳ mở; snapshot facts/version nếu cần lưu "tuần đó báo cáo gì", không tạo approval. Owner quyết định hồi tố/khóa nếu vận hành yêu cầu. Aggregation theo tuần nào khi skill khác tuần còn OPEN; workload skill và số lượt assessment phải dùng hai lát cắt rõ. Monthly tổng hợp cùng quy tắc tuần, không đếm trùng attempt/HS.

## 6. Kỹ thuật/UX nền tảng còn hiệu lực

**D41 — CURRENT:** SPA, lưu thật database local, fake seed nhất quán, demo clock, không API key/cloud bắt buộc. Stack PR4 React/TypeScript/Vite + Node/Express + SQLite có thể giữ; không framework rewrite chỉ để đổi UI.

**D42 — CURRENT:** Shared components, data/template-driven, không page riêng mỗi lớp/branch, không business rule chôn trong UI. Academic scores/estimate/facts derived dùng một logic trung tâm. Transactions cho mutation liên quan, validation server, scoped query, invalidation các view đúng nguồn.

**D43 — CURRENT:** Audit actor/time/before/after cho dữ liệu quan trọng; lifecycle narrative khác audit kỹ thuật. Template/rule version hoặc snapshot bất biến cho lịch sử. Archive/soft delete thay xóa dữ liệu quan trọng. Không reset DB mặc định khi overhaul; có migration và lệnh reset demo riêng.

**D44 — CURRENT:** Autosave có Saving/Saved/Error/Retry, giữ draft và chống request cũ ghi đè; bulk chỉ ghi đối tượng đúng quyền/chọn thực tế. Import/chuyển lớp/hủy/đổi quyền dùng commit rõ. Loading/empty/error/no permission/no data thể hiện đúng, không spinner vô hạn/nút giả.

**D45 — ĐÃ TRIỂN KHAI vòng B:** Class summary query trước, lazy roster/detail/history khi expand, tránh N+1, tránh fetch tất cả rồi lọc trên frontend. Caching aggregates phải có invalidation. Đã đo trên trình duyệt thật ở 390/414/768/1024/1440: không trang nào tràn ngang. Danh sách lớp dùng MỘT nhóm truy vấn cho toàn bộ số liệu badge (có test khoá lại), roster chỉ nạp khi expand. Keyboard và focus đã kiểm chứng; pastel không mất contrast.

**D46 — CURRENT:** Notification chỉ khi cần hành động, dedup theo sự kiện, in-app trong demo. Demo tools giữ scenes/loading/empty/error/save failure; không gây lỗi ngẫu nhiên. Không mở rộng Demo Assumption thành tài liệu ý tưởng xa; master giữ backlog, assumptions chỉ quyết định chặn thực sự.

## 7. Các ý tưởng đang gác và giả định lịch sử

Các mục dưới không trở lại UI chỉ vì còn trong tài liệu. Nếu muốn bật, phải có scope mới.

| ID | Thiết kế từng bàn | Trạng thái hiện tại và chi tiết cần giữ |
|---|---|---|
| F01 | Attendance theo session | DEFERRED: Present/Absent/Late/Excused; giáo viên đúng assignment cập nhật; concern không tự WL |
| F02 | WeeklyLearningRecord | DEFERRED: student×enrollment×teaching skill×Monday week; expectedMain/attendedMain/supplemental, homework assigned/completed, note; estimate hiện đã trở lại riêng |
| F03 | Bổ trợ linh hoạt | DEFERRED: học ghép/tutor/1-1/giáo viên thay, số buổi và optional activity; không full timetable; assignment thay phải đúng thời gian |
| F04 | Không đếm trùng aggregate/detail | DEFERRED nhưng giữ nguyên tắc: mỗi chiều có nguồn tổng hợp hoặc chi tiết; chuyển nguồn kiểm tra chênh lệch; không cộng cả hai |
| F05 | Attendance rate | GIẢ ĐỊNH DEMO CŨ: attended main/expected main; bổ trợ không tự bù vắng; 5 main+7 bổ trợ không thành 240%; expected=0/thiếu không tự 0%/100%; Present/Late tính attended, Excused xử lý mẫu số chưa chốt |
| F06 | Homework | DEFERRED: nhiều bài/skill, Completed/Incomplete/Missing/Late; Late không đủ suy completion; counts không vượt assigned; trống khác0 |
| F07 | Concern threshold | OPEN+DEFERRED: 80% attendance/70% homework chỉ là giả định demo S1, không policy chính thức; version/config, không auto WL |
| F08 | Consultant/Consultant Manager | DEFERRED: assigned-student/team/branch scope, read-only học vụ; không lộ notes/incident/audit nhạy cảm; không CRM. Metadata tư vấn viên đang dùng không bật role |
| F09 | Entrance Test | GIỮ KIẾN TRÚC/LỊCH SỬ, nhập mới chưa bắt buộc ở vòng này; tách official result và estimate, giữ test type/date/source |
| F10 | Student Progress Report đầy đủ | GIỮ KHÁI NIỆM: định kỳ, học sinh/ngày/nhận xét/đề xuất/tác giả, khác branch report; chưa buộc editor dài hoặc generate document. S8 bật tracking Report/WL |
| F11 | Incident reference tổng quát | DEFERRED ngoài các record Warning/Report cần hiện tại; date/type/reason/description/author/note/status/follow-up; không phát hành văn bản |
| F12 | Issue Center | SUPERSEDED khỏi UI: object title/scope/risk/owner/status/note + linked student/class/branch/meeting/task; Open/Discussing/In Progress/Resolved chỉ là design cũ |
| F13 | Full task CRUD/board | SUPERSEDED khỏi MVP vì Base. Giữ lịch sử model assignee/deadline/priority/source/status/attachment/blockedReason; không clone carry-over |
| F14 | Task timing cũ | ARCHIVE: Not Started/In Progress/Paused/Completed; Due Soon≤3 ngày là demo rule; no due khác0; paused vẫn có thể overdue; completed không báo open overdue |
| F15 | Long-term task | ARCHIVE: source workbook loại Trong kỳ/Dài hạn do người dùng chọn; không dùng tuổi >21 ngày để tự đổi loại. Ý tưởng “kéo dài theo ngưỡng” S1 không thay luật workbook |
| F16 | Meetings/Agenda/Decision | DEFERRED: Period→Reports→Issues→Decisions→Tasks→Follow-up, entities sourceMeeting/sourceIssue/sourceBranchReport; hiện không pipeline bắt buộc |
| F17 | Expected vs actual syllabus | DEFERRED chi tiết: quản lý nhập week/stage/checkpoint; FT không tự chậm chỉ vì học lâu; Normal template timeline; S8 hiển thị cycle/checkpoint cần thiết |
| F18 | Report categories năm nhóm | SUPERSEDED: sĩ số/lớp, dạy học, HS/PH, nhân sự GV, giáo trình; PR4 ghi chốt ba nhóm. Giữ category version cho lịch sử |
| F19 | Global search đầy đủ | DEFERRED mở rộng teacher/branch/phone theo quyền; hiện ưu tiên tên/mã HS/lớp không dấu |
| F20 | Import mở rộng | DEFERRED presets Teachers/Classes/historical scores hàng loạt, exports report; giữ architecture chung, không tạo nút giả |
| F21 | Course builder sâu | DEFERRED: nhiều FT stages, PET/KET/custom, per-student/weekly overrides; hiện template programme form gọn + version/class override |
| F22 | Production | DEFERRED: auth thật, DB production, backup, deploy/monitoring/migration vận hành; demo session không phải production auth |
| F23 | Long-term ambition | DEFERRED: parent communication/portal, CRM integration, automatic sync, scheduling đầy đủ, analytics/forecasting, AI summaries, richer reports |
| F24 | Seed ban đầu | ARCHIVE: 100–120 HS,12 lớp,15–20 user,8 tuần,3 kỳ,12 issues/20 tasks; không phải chỉ tiêu hiện tại. Giữ cases khó nhưng loại task/consultant khỏi UI demo hiện hành |

Seed cases đáng giữ để review khi đúng scope: đa role khác chi nhánh, GVCN chỉ dạy một skill, hai HS trùng tên/DOB, chuyển Normal→FT, pause/resume/repeat, một số skill, W1/W2 khác người, estimate không official, thiếu khác0, template v1/v2, source note privacy, lỗi save giữ draft. Cases homework/bổ trợ/task chỉ bật khi scope trở lại.

## 8. Decision history — những điểm không được vô tình khôi phục

| Trước đây | Hiện hành |
|---|---|
| Dark navy/teal-green | S8 chọn accent nhẹ blue/pink; Claude quyết palette phù hợp |
| 8 menu → 4 menu Mock-first | S8 cho overhaul tiếp; đề xuất 3 menu, chưa khóa layout |
| GVCN được dời lịch | S8: GVCN chỉ xem; quản lý tuần, Admin CN ngày, GV S ngày S |
| Một ngày Mock bắt buộc ngay lúc tạo | Cho tuần-only, lịch S riêng và ngày/giờ chốt sau |
| Không có Not required; mọi MT phải đủ4 | S8 required skills per attempt; đủ required là completion; SOS rút gọn OPEN |
| Không gộp official Writing từ W1/W2 ở prompt đầu | S7 ghi đã chốt band official W=(W1+2W2)/3; estimate vẫn riêng, rule gộp estimate chưa chốt |
| Teacher Estimate/regular assessment/import tạm bỏ ở Mock-first | S8 đưa trở lại explicit scope |
| Elementary ví dụ12 tuần ở S0 | S8 BE/ELE10 tuần; FOU8 tuần |
| Trạng thái HS paused/transferred/completed/withdrawn | S8 Active/Inactive/Finished; sự kiện/enrollment giữ chi tiết |
| `UNIQUE(student, MT number)` | Cần cycle để phục vụ LT/học lại; numbering OPEN |
| Họp tuần report thủ công + task CRUD | Tiến trình công việc auto facts + judgement + tracking, Base giao việc |
| Admin CN truy cập meeting toàn phần | S8 không cấp mặc định module quản lý |
| Warning/WL chỉ đọc ở PR4 | S8 GVCN cập nhật trạng thái nhận/xử lý; không tự phát hành |
| Head checkbox giữ vì sheet có cột | S8 yêu cầu đánh giá; đề xuất bỏ/gộp, không tự dựng gate |
| Branch report chủ yếu nhập tay, không tự detect | S8 facts tự sinh, judgement vẫn do người; không auto quyết thái độ/Warning |
| STOP trước code trong context gốc | Đã chuyển sang vòng demo/iteration; ChatGPT review+prompt, Claude code theo scope mới, không hỏi lại gate cũ |

## 9. OPEN — chỉ hỏi điều thực sự còn thiếu

| ID | Quyết định cần owner | Đề xuất để cân nhắc, không tự coi đã duyệt |
|---|---|---|
| ~~O01~~ | ĐÃ CHỐT 09/09/2026: SOS tính trên tập kỹ năng thực mock khi có đánh dấu "không mock"; không đánh dấu thì chờ đủ bốn. Còn lại: W chỉ bắt buộc một task | Xem D24 |
| O02 | Deadline default theo planned/actual, S ngoài tuần, override scope, reschedule giữ override? | Deadline từng skill; override có actor/reason; không tự kéo dài |
| ~~O03~~ | ĐÃ CHỐT 09/09/2026: reset theo LỘ TRÌNH, học lại cùng lộ trình thì MT tăng tiếp và target giữ nguyên. Còn lại: mốc tuần học sau pause | Xem D14 |
| O04 | Report/WL “đã nhận” là ai nhận, entry hộ, ai close/reopen SOS, điều kiện resolved | Ack metadata; receipt không tự resolved |
| O05 | Quyền override điểm, ngày thực tế, case và lịch sử chuyển CN | Capability riêng, không ghép quyền rộng từ role name |
| O06 | Writing estimate W1/W2, thang estimate lớp thường | Giữ theo task/scale, không tự tạo band tổng |
| O07 | Assessment thường: deadline, required skills, hỗ trợ/escalation | Reuse result/case nhưng policy theo programme |
| O08 | Archive “khoảng2tuần”, restore, lịch/case pending | 14 ngày từ finished_at là đề xuất; không xóa nghĩa vụ |
| ~~O09~~ | ĐÃ CHỐT 09/09/2026: tuần kết quả = tuần kế hoạch của lượt. Còn lại: snapshot báo cáo tuần | Xem D19b |
| O10 | Admin CN/System Admin import tuần đã được chốt ngoài web | Draft/provenance không tự trở thành quản lý phê duyệt |
| O11 | Loại class override và quyền quản lý/cấu hình sâu | Form gọn dựa template, không builder |

Q1–Q7 cũ trong PR4 **không hỏi lại từ đầu**. Q2 về đủ4 nay cần giải quyết xung đột do required skills mới; Head purpose được user mở lại. Ba nhóm report và CS ngoài hệ thống không còn là câu hỏi chưa chốt trong baseline.

## 10. Review PR #4 và đóng góp ở vòng này

Các link sau trỏ về source được đọc, không phải kết quả chạy UI:

| ID | Căn cứ | Đóng góp và decision liên quan |
|---|---|---|
| R01 | [schema](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/server/src/schema.sql): planned_date NOT NULL, UNIQUE student/MT | Week-only, cycle, lịch giờ/S và required skills D14/18/22 |
| R02 | [scoring](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/server/src/services/scoring.ts): complete cần4 band+expectation | Tách completion/evaluation; không thiếu target mà báo thiếu điểm D22–24 |
| R03 | [mock](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/server/src/services/mock.ts): skillCells lấy class_skills, filter tuần firstTestDate | Required per attempt và workload theo skill D20/22/40 |
| R04 | [permissions](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/server/src/permissions.ts): core có mock.schedule; context student gom lịch sử CN | Quyền lịch mới, kiểm tra transfer khác CN và assignment lịch sử D08–10 |
| R05 | [Students UI](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/web/src/pages/Students.tsx) list phẳng; [student service](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/server/src/services/students.ts) latest theo sốMT | Class-first, latest có date/cycle/scale D04/05/25 |
| R06 | [SOS](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/server/src/services/sos.ts): confirmCase metadata, updateCase độc lập | Head không được giả nhận là gate; bỏ/gộp và receipt riêng D31–34 |
| R07 | [Meeting UI](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/web/src/pages/Meeting.tsx) report/manual task | Facts+judgement, bỏ task platform D36–40 |
| R08 | [Overview UI](https://github.com/Pizi147/pisa-tracking/blob/3d52b545afbb7aa35eeffd56dc10d336cb15f70e/web/src/pages/Overview.tsx) card all SOS link sos_open | Mỗi KPI đúng denominator/filter/source D35/40 |
| R09 | Schema chưa có TeacherEstimate/cycle/programme assessment/Report receipt | Thêm dữ liệu thật cho yêu cầu, không chỉ label/timeline text D14/25–27/31 |

### Checklist cập nhật mỗi vòng

1. Nêu nguồn user/commit/ngày, không nhầm observed implementation với owner decision.
2. Cập nhật Dxx và thêm dòng “thay thế” ở mục8; giữ lịch sử.
3. Đề xuất mới ghi PROPOSED; chỉ đổi CURRENT khi user chốt hoặc là lựa chọn UX đã được giao tự quyết, nêu rõ loại quyết định.
4. Phần ngoài scope sang mục7, không xóa khỏi trí nhớ và không tự đưa trở lại sản phẩm.
5. Đồng bộ master, prompt hiện hành và repo spec/assumptions/scenarios sau khi triển khai.
6. Ghi rõ đã review code hay đã chạy browser/test; không dùng build/pass của phiên bản cũ cho phiên bản mới.

### Changelog

- 09/09/2026 — v1.5 (vòng D — hồ sơ học viên và vấn đề học vụ, đã code và chạy): xem bảng
  CURRENT ở mục 0b. Tóm tắt: **hai nguồn vấn đề, một vòng đời** (sinh từ điểm và giáo viên
  báo); **ghi nhận nhanh** thay bảng Đánh giá GV, nhận định bằng lời là đủ; **lộ trình có
  điểm xuất phát, kết luận cuối và lịch sử đổi mục tiêu**; **hồ sơ học viên** dựng lại quanh
  một lộ trình với hành trình gom thành chương; **màn Học thuật** cho Quản lý với bốn hàng (từ 10/09 thay bằng tab Tình hình chung, xem D74)
  đợi; **một đường ghi duy nhất** cho vấn đề học vụ, kể cả ở trang điểm. Năm sửa theo yêu cầu
  owner cũng nằm trong vòng này (bỏ giờ MT, bảng tổng hợp tuần, hạn lớp thường hết chủ nhật,
  SOS tính ngay, khoá báo cáo tuần sau thứ Tư). Bốn lỗi im lặng được phát hiện khi chạy thử
  trên trình duyệt chứ không phải từ đọc code: khoá lớp thường thiếu mã chương trình nên hồ
  sơ dựng bảng band IELTS cho lớp Foundation; vấn đề sinh từ điểm không ghi học viên nên hồ
  sơ không thấy nó; không khai được "chính tôi làm"; dữ liệu mẫu vẫn viết vào năm cột cũ.
  **120 kiểm tra nghiệp vụ đạt**; năm luồng A–E chạy thật trên trình duyệt; nâng cấp kiểm
  chứng trên bản sao thật của database, chạy lại lần hai không đổi gì thêm.

- 10/09/2026 — v1.6 (vòng 2 của đợt overhaul, đã code và chạy): **Màn Tổng quan là việc của chính người đang xem** — mỗi dòng một học viên, một câu lý do, một nút bấm được; việc không có quyền làm thì máy chủ không trả về. Sáu nhóm việc đặt tên theo đúng chữ người dùng dùng (`Nhập điểm Test` · `Chờ duyệt phương án` · `Kết quả sau hỗ trợ` · `Phương án hỗ trợ` · `Cập nhật ngày MT` · `Chưa có tuần kế hoạch`), mỗi nhóm có một dòng nói rõ nó nghĩa là gì, và nhãn quá hạn **nói rõ quá hạn cái gì** thay vì một chữ "Quá hạn" trơ trọi. Dải ô đếm lên nguyên một hàng trên cùng; cột lớp hẹp lại (17rem) vì đó là chỗ tra cứu, không phải chỗ làm việc. **Đề xuất phương án và duyệt**: chính giáo viên quyết định phương án của mình có cần duyệt hay không; đã gửi duyệt thì chờ, chưa cập nhật kết quả được; Quản lý trả lời trong 3 hoặc 7 ngày, không duyệt thì bắt buộc ghi lý do, **góp ý không kết thúc việc chờ**, và đã trả lời rồi thì không sửa đè. **Kết quả sau hỗ trợ** là việc của người thực hiện; quá hạn thì Quản lý mới thấy. **Phân công giáo viên** cho Quản lý và Admin chi nhánh, mỗi kỹ năng là một danh sách, bỏ phân công chỉ đóng dòng cũ lại chứ không xoá. **Tình hình chung** thành tab thứ hai của Tổng quan với ba trạng thái cộng lại đúng bằng tổng và số đếm ở mọi lựa chọn lọc (tính chéo kiểu facet, có riêng "Chưa phân loại"). Admin chi nhánh **mất hẳn** `score.override` (đóng O05) và không còn bị giao việc "đề xuất phương án hỗ trợ" — quyền ghi nhận và trách nhiệm quyết định là hai chuyện khác nhau. Sửa hai lỗi thật: `sos_cases` không có cột `class_id` (truy vấn duyệt phương án hỏng ngay khi chạy), và điều kiện quá hạn xem lại trước đây loại trừ việc ĐÃ XONG — tức gần như không việc nào bị coi là quá hạn. Dữ liệu mẫu: hẹn xem lại neo quanh ngày demo chứ không neo vào ngày thi, nên có đủ cả quá hạn · hôm nay · còn hạn; giáo viên là người ghi phương án chứ không phải văn phòng. **137 kiểm tra nghiệp vụ đạt**; kiểm chứng trên trình duyệt thật theo từng vai (Giáo viên · Admin CN · Quản lý MB/CP/BC) và chạy đầu-cuối hai luồng mới: đề xuất → duyệt → mở khoá cập nhật kết quả, và sửa phân công → dòng cũ đóng lại đúng ngày.

- 09/09/2026 — v1.4 (lớp thường + tinh chỉnh, đã code và chạy): **Lớp thường FOU/BE/ELE** dùng chung bảng dữ liệu và chung hệ thống case SOS với lớp FT, chỉ đổi cách chấm (`số câu đúng / tổng số câu`, đạt từ 60%), mốc theo TUẦN HỌC (FOU 4/8, BE·ELE 5/10) và bộ kỹ năng theo chương trình. Xét trên tỷ lệ chính xác chứ không làm tròn phần trăm rồi mới so. Thiếu điểm KHÁC trượt — phải đủ điểm mọi kỹ năng mới kết luận và mới sinh case, để không đẩy học viên lên SOS oan. Không có band, kỳ vọng hay Overall. Chương trình nằm trong bảng (`programmes` + `programme_skills` + `programme_checkpoints`), mã cũ `FOUND` chỉ ánh xạ khi đọc chứ không đổi mã lớp lịch sử. Chuyển từ lớp FT sang lớp thường thì mở khoá mới. Bảng điểm riêng có ô số câu đúng / tổng, đặt tổng chung cho cả lớp rồi sửa từng dòng. **Δ trong bảng so sánh bỏ màu tốt/xấu**: điểm Mock và Đánh giá GV là hai thứ khác hẳn nhau, bên nào cao hơn cũng không tự nó là khen hay cảnh báo — chỉ còn là khoảng cách hai con số. **Badge kỹ năng**: mỗi dòng lớp ghi rõ người đang xem dạy kỹ năng nào ở chính lớp đó (`L R`, `R W1`) kèm `GVCN`. **Dữ liệu mẫu gọn lại** để dễ theo dõi: mỗi chi nhánh đúng một Quản lý và một Admin văn phòng, ba giáo viên mỗi chi nhánh dạy 2–3 lớp, lớp đông hơn (26 tài khoản thay vì 43, 108 học viên). Sửa hai chỗ trùng lặp nguồn sự thật: seed đánh giá GV giờ đọc thẳng phân công thật thay vì chép lại bảng phân công, và chương trình học đọc một lượt thay vì mỗi lớp một lượt (test N+1 bắt được). **97 kiểm tra nghiệp vụ đạt**; kiểm chứng trên trình duyệt thật theo từng vai và không trang nào tràn ngang ở 390→1440px.

- 09/09/2026 — v1.3 (vòng C, đã code và chạy): **Lịch MT** — bỏ hoàn toàn giờ mock, chỉ lưu ngày; Quản lý được thêm quyền cập nhật ngày thực tế; GV Speaking sửa được ngày Speaking, GV L/R/W và GVCN không; "cần cập nhật ngày" chỉ tính khi đã đến tuần, badge "Chưa có ngày" bỏ khỏi mọi nơi, thay bằng một màn thao tác hàng loạt cho Admin CN (chọn nhiều em · một ngày · một lần bấm), có nhóm quá hạn tuần trước. **Kế hoạch MT** — panel trượt từ phải, chọn nhiều em, đặt tuần, tick kỹ năng lượt này yêu cầu; phân biệt "không yêu cầu" với "thiếu điểm"; Quản lý xếp trước được cho cả lớp. **Đánh giá GV** (đổi tên từ Ước lượng GV) — nhập raw/40 hoặc bốn tiêu chí như Mock, band tính ra; gộp một bảng với điểm Mock kèm cột Δ có màu, Δ = Mock − Đánh giá GV đọc theo học viên; bấm ô mở căn cứ; giáo viên cập nhật bất kỳ lúc nào đúng kỹ năng mình phụ trách. **SOS** — ba trạng thái ba màu kèm dòng follow-up ngay ở danh sách; "Head xác nhận" BỎ hẳn khỏi quy trình (quyền, hàm, endpoint, nút), giữ dữ liệu cũ. **Tiến trình công việc** — tín hiệu tự sinh từ dữ liệu, tự hết khi nguồn được xử lý, ghi rõ việc của ai; báo cáo tuần khoá ngoài hai ngày cuối tuần và chặn ở máy chủ; ô chọn tuần thành cửa sổ trượt có mũi tên ← →; nhóm "Học sinh / Phụ huynh"; bỏ badge "Đơn vị độc lập"; tổng hợp tutor theo chính tutor. **Công việc** — bỏ trường "Loại", thêm Người theo dõi mặc định là Quản lý chi nhánh, người phụ trách và người theo dõi chọn bằng ô gõ để tìm kèm vai trò/chi nhánh. **Badge** nén lại, ôm sát nội dung, mô tả rút còn "3 kỹ năng". Sửa một lỗi định tuyến: `GET /attempts/no-plan` và `/attempts/date-duty` bị `/attempts/:id` nuốt vì khai báo sau. **83 kiểm tra nghiệp vụ đạt**; đã kiểm chứng trên trình duyệt thật theo từng vai (Quản lý · Admin CN · Giáo viên) và không trang nào tràn ngang ở 390/414/768/1024/1280/1440px.

- 09/09/2026 — v1.2 (vòng B, đã code và chạy): điều hướng còn ba mục (`Tổng quan · Tiến trình công việc · Học viên`), `Mock test` và `Họp tuần` không còn là menu riêng, đường dẫn cũ chuyển hướng chứ không 404. Học viên lấy LỚP làm gốc: danh sách lớp với badge chỉ hiện khi có việc, ba vùng bấm tách bạch (tên lớp · badge · nền dòng), nhiều lớp mở độc lập, trạng thái mở + search + bộ lọc nằm trên URL nên Back giữ đúng ngữ cảnh, roster lazy load, danh sách lớp dùng một nhóm truy vấn. Tiến độ MT gộp vào roster (`MT1 ✓ · MT2 ✓ · MT3 W4 OCT`) — không còn màn hình tiến độ riêng. Hai hàng đợi `Cần nhập điểm` / `Cần xếp lịch` là view của cùng màn hình. Thêm học viên hàng loạt: dán TSV từ Excel, định dạng ngày do người dùng chọn (không đoán), xem trước tự chạy, nhãn nút đếm đúng số dòng sẽ ghi, "Bỏ qua N dòng lỗi" một lần bấm, gợi ý trùng chứ không tự gộp, lộ trình kế thừa từ lớp, tuần MT chỉ thành kế hoạch khi người nhập có `plan.week`, idempotency chống bấm hai lần. Tạo lớp với ràng buộc mã theo chi nhánh. **65 kiểm tra nghiệp vụ đạt**; đã kiểm chứng trên trình duyệt thật: tương tác chuột/bàn phím, chống nổi bọt sự kiện, Back giữ ngữ cảnh, luồng nhập hàng loạt đầu-cuối, và không trang nào tràn ngang ở 390/414/768/1024/1440px. Vòng C (lớp thường FOU/BE/ELE, workflow SOS/Report/WL, Tiến trình công việc auto facts) chưa làm.

- 09/09/2026 — v1.1 (vòng A, đã code và chạy): owner chốt O01/O03/O09. Triển khai: hệ màu pastel blue; bỏ từ "thi" cho Mock; tách `learning_cycles` khỏi hồ sơ học viên; `assessment_attempts` với tuần kế hoạch + ngày giờ LRW/Speaking riêng + hạn tự đặt; `attempt_skill_skips`; `assessment_scores` với ngày mock thực tế; `teacher_estimates`; tách quyền `plan.week` / `schedule.date` / `schedule.speaking` / `score.edit` / `score.override` / `estimate.edit` / `attempt.skip_skill` / `deadline.override`; GVCN mất quyền lịch; Admin CN mất quyền Tiến trình công việc; ba trạng thái học viên + lưu trữ sau 14 ngày; migration tại chỗ giữ nguyên dữ liệu cũ. 51 kiểm tra nghiệp vụ đạt; đã chạy trình duyệt ở 1440/1280/1024/768/390px. Vòng B (Học viên class-first) và vòng C (lớp thường, workflow SOS, Tiến trình công việc) chưa làm.
- 09/09/2026 — v1.0: khôi phục S0 đủ50 mục; hợp nhất S1–S8; giữ backlog và quyết định thay thế; đối chiếu PR4; bổ sung D04/05/14/20/22/24/25/32–34/39–40 cùng OPEN O01–O11; chỉnh trực tiếp prompt S8 thành S9, vẫn đủ16 nhóm yêu cầu. Chưa code thay đổi website.

---

## Phụ lục A — Nguyên văn context 50 mục (ARCHIVE)

**Toàn bộ phần dưới là snapshot lịch sử S0. Các chữ “hiện tại”, “bắt buộc”, “không được thay đổi” trong snapshot chỉ phản ánh thời điểm tài liệu đó được tạo. Không dùng chúng để ghi đè CURRENT/mục8 ở trên.** Giữ nguyên để không mất design points từng bàn, gồm field/entity/role/flow chưa dùng.

### PISA Progress Management System — Context Handoff

> Tài liệu này tổng hợp toàn bộ context, quyết định sản phẩm và business logic đã được thống nhất trước khi chuyển sang một Work session / model khác để tiếp tục thiết kế hệ thống.
>
> **Mục tiêu của tài liệu:** giúp model mới hiểu đúng bối cảnh, không phải suy đoán lại từ đầu, và không tự ý thay đổi business logic đã chốt.

---

#### 1. Tầm nhìn sản phẩm

Xây dựng một **website nội bộ quản lý học vụ + theo dõi tiến độ học sinh + theo dõi tình hình vận hành chi nhánh** cho toàn bộ hệ thống trung tâm ngoại ngữ PISA IELTS.

Hệ thống phục vụ chủ yếu cho:

- Quản lý / Head
- Giáo viên
- Admin
- Tư vấn viên
- Quản lý tư vấn viên

Mục tiêu cốt lõi:

1. **Quản lý** nhìn được toàn cảnh hệ thống, phát hiện vấn đề nhanh và theo dõi việc xử lý.
2. **Giáo viên** cập nhật thông tin học tập của học sinh nhanh, gọn, không bị quá tải bởi form.
3. **GVCN/Core Teacher** có thể tổng hợp tình hình học sinh và cập nhật các thông tin rộng hơn về thái độ/hành vi học tập.
4. **Admin** quản lý cấu hình, template, role, permission, branch, class type... mà không cần sửa source code.
5. **Tư vấn viên** có thể xem tiến độ học sinh mình phụ trách để trao đổi với phụ huynh tốt hơn, nhưng hệ thống **chưa phải CRM**.
6. Hệ thống phải đủ linh hoạt cho mô hình đào tạo khá tự do của trung tâm.

---

### 2. Nguyên tắc sản phẩm quan trọng

#### 2.1. Không xây ERP giáo dục quá lớn ngay từ đầu

Core workflow nên xoay quanh hai dòng chính:

##### Academic / Student Tracking

`Student → Class → Progress → Issue → Action`

##### Branch / Operations Tracking

`Branch → Weekly Report → Issue → Meeting Decision → Action → Follow-up`

Hai dòng này hội tụ tại:

- **Issue Center**
- **Task / Action Center**

---

#### 2.2. Data-driven, không hard-code

Không được tạo:

- component riêng cho từng chi nhánh;
- page riêng cho từng lớp;
- logic cố định cho FT5/FT10/FT16...;
- logic warning bị hard-code sâu trong UI;
- một hệ thống riêng biệt hoàn toàn cho FT và Normal.

Tất cả nên được điều khiển bằng:

- data;
- template;
- configuration;
- role;
- permission;
- scope;
- per-class override;
- per-student override khi cần.

---

#### 2.3. UX phải gọn

Mục tiêu thiết kế:

- clean;
- professional;
- modern;
- minimal;
- desktop-first nhưng responsive;
- thao tác nhanh;
- ít click;
- ít form;
- ưu tiên bulk update;
- không reload page sau mỗi thao tác;
- có autosave;
- không nhồi biểu đồ/KPI không dẫn đến hành động.

UI ban đầu có thể theo phong cách:

- dark premium internal dashboard;
- nền xanh đen;
- accent teal/green;
- subtle border;
- rounded cards;
- typography rõ;
- status color nhất quán.

---

### 3. Cấu trúc tổ chức

Hiện tại có khoảng 4–5 chi nhánh, nhưng có thể tăng trong tương lai.

Hệ thống phải hỗ trợ:

- thêm chi nhánh;
- sửa chi nhánh;
- archive / tạm ngưng chi nhánh;
- phân quyền theo chi nhánh;
- reporting unit riêng ngoài branch nếu cần.

Ví dụ reporting unit:

- Tutor Part-time;
- Phòng ban chuyên môn;
- nhóm vận hành riêng.

---

### 4. Hai loại lớp chính

#### 4.1. FT Class

FT là lớp học chính/dài hạn, Student Journey dài và linh hoạt.

Đặc điểm:

- có thể học trong thời gian dài;
- nhiều stage / milestone;
- thay đổi giáo viên;
- đổi lớp;
- học lại;
- nâng band;
- học thêm/bổ trợ;
- học ghép lớp khác;
- học tutor;
- học 1-1;
- có thể chỉ học một số skill;
- có thể học nhiều buổi hơn khung chuẩn.

Không ép FT vào timeline 8–10 tuần.

FT nên dựa trên:

- Stage;
- Milestone;
- Academic checkpoint;
- Test history;
- Student movement;
- Teacher assessment.

Admin có thể cấu hình stage.

---

#### 4.2. Normal Class

Normal Class có chương trình tương đối cố định hơn nhưng vẫn có nhiều loại:

- Foundation: ví dụ khoảng 8 tuần;
- Elementary: ví dụ khoảng 12 tuần;
- PET/KET hoặc chương trình đặc biệt có thể kéo dài khác.

Normal Class dùng:

- Course Template;
- Week / stage;
- Checkpoint;
- Progress Test;
- Final Test;
- Expected Progress vs Actual Progress.

Admin có thể tạo template và áp vào lớp.

Sau khi áp template vào lớp đặc biệt, Manager/Admin vẫn có thể chỉnh override cho lớp đó.

---

### 5. Template và versioning

Template cần có version.

Ví dụ:

- Normal Template v1 = 8 tuần;
- v2 = 10 tuần.

Nếu Admin thay template:

- lớp cũ vẫn giữ version cũ;
- lớp mới có thể dùng version mới;
- không được làm thay đổi lịch sử của lớp đang/đã học.

Áp dụng versioning cho:

- Course Template;
- FT Stages;
- Normal Timeline;
- Warning Policy;
- Assessment Template nếu cần;
- Report Category nếu cần.

---

### 6. Session / Skill model

#### 6.1. Khung FT phổ biến

Hai khung phổ biến:

##### FT5
5 buổi / tuần:

- 1 Listening
- 1 Reading
- 1 Writing 1
- 1 Writing 2
- 1 Speaking

##### FT10
10 buổi / tuần:

- 2 Listening
- 2 Reading
- 2 Writing 1
- 2 Writing 2
- 2 Speaking

Nhưng thực tế rất linh hoạt.

Ví dụ:

- FT6;
- FT8;
- FT12;
- học sinh thuộc FT5 nhưng học 12 buổi;
- học sinh chỉ học 1–2 skill;
- học sinh đi học ghép với lớp khác;
- học tutor;
- học 1-1;
- có giáo viên dạy thay.

---

#### 6.2. Không over-engineer scheduling

Không cần xây full scheduling system ngay.

Mục tiêu hiện tại chỉ cần đủ để giáo viên/GVCN ghi nhận chính xác:

- học sinh có đi học đủ không;
- homework có làm đủ không;
- học skill gì;
- số buổi chính;
- số buổi bổ trợ;
- số buổi học thêm;
- nếu cần thì ghi loại buổi: class khác / tutor / 1-1.

Có thể mô hình theo hướng nhẹ:

##### Weekly Learning Record

Mỗi skill có thể có:

- expected sessions;
- attended sessions;
- supplemental sessions;
- homework assigned;
- homework completed;
- teacher note;
- teacher estimate.

Nếu cần chi tiết hơn thì mở activity/session cụ thể.

---

### 7. Homework linh hoạt

Không ép mỗi skill = 1 homework / tuần.

Giáo viên có thể:

- giao 1 bài;
- giao 2 bài;
- giao nhiều bài hơn nếu cần.

Các trạng thái đơn giản:

- Completed;
- Incomplete;
- Missing;
- Late.

Mục tiêu: giúp giáo viên ghi nhanh, không bắt buộc quá nhiều dropdown.

---

### 8. Student lifecycle

Student lifecycle phải giữ lịch sử đầy đủ.

Một học sinh có thể:

- Active;
- Paused;
- Transferred;
- Completed;
- Withdrawn;
- học từ Normal lên FT;
- chuyển lớp;
- học lại;
- đúp lớp;
- học lại lần 2/3 để nâng band;
- tạm dừng rồi quay lại;
- học nhiều phase khác nhau.

Không được overwrite lịch sử.

Nên dùng:

`Student + Enrollment History`

Thay vì đơn giản chỉ lưu `student.classId`.

---

### 9. Student ID

Hiện tại dữ liệu cũ chưa có mã học viên.

Nguồn hiện có thường gồm:

- Lớp;
- Họ tên;
- Ngày sinh;
- Target;
- Tư vấn viên phụ trách.

Website phải tự sinh Student ID, ví dụ:

`PISA-000001`

Khi import cần có duplicate detection dựa trên các field khả dụng, ví dụ:

- Name;
- DOB;
- Class;
- Phone nếu có.

---

### 10. Excel / CSV import

Do trung tâm làm việc nhiều bằng Excel, import là requirement quan trọng.

Cần hỗ trợ import:

- Students;
- Classes;
- Teachers;
- Enrollments;
- Historical scores nếu cần.

Flow import:

`Upload → Preview → Validate → Detect duplicate → Show errors → Confirm Import`

Không bắt Admin nhập hàng nghìn học sinh thủ công.

---

### 11. User roles

Các user-facing role hiện tại:

1. Admin
2. Manager / Head
3. Teacher
4. Consultant
5. Consultant Manager

Nhưng backend **không được chỉ dựa vào role cố định**.

Cần dùng:

`Role + Permission + Scope + Assignment`

Một user có thể có nhiều role cùng lúc.

Ví dụ:

- vừa Admin;
- vừa Manager;
- vừa Teacher.

---

### 12. Role switcher

Nên có một nút nhỏ trên UI để user đổi góc nhìn giữa các role mà tài khoản thực sự sở hữu.

Ví dụ:

`Admin View / Manager View / Teacher View`

Điều này giúp:

- kiểm tra UI;
- dùng nhiều chức năng;
- thuận tiện cho user đa nhiệm.

**Không được dùng role switcher như cơ chế tự nâng quyền.**

Backend vẫn kiểm tra permission thực tế.

---

### 13. Teacher assignment

#### 13.1. Core Teacher / GVCN không phải role

Core Teacher là **assignment/capability theo từng lớp**.

Ví dụ một người có thể:

- Core Teacher của FT16;
- Speaking Teacher của FT18;
- đồng thời là Manager ở một branch.

---

#### 13.2. Subject Teacher / GVBM

Các skill chính:

- Listening;
- Reading;
- Writing 1;
- Writing 2;
- Speaking.

GVBM:

- được xem toàn bộ thông tin lớp/học sinh của lớp mình;
- được theo dõi dữ liệu từ các skill khác;
- nhưng chỉ được chỉnh dữ liệu học tập thuộc skill mình phụ trách.

Có thể cập nhật:

- attendance;
- homework;
- skill progress;
- skill teacher estimate;
- notes liên quan skill.

---

#### 13.3. Core Teacher / GVCN

Ngoài quyền giống Teacher bình thường, GVCN có thể cập nhật thêm:

- overall learning attitude;
- tình hình học tập tổng thể;
- nhận xét tổng hợp;
- Student Progress Report;
- trạng thái vấn đề học tập;
- thông tin dùng để theo dõi report / warning reference.

---

### 14. Teacher UX

Teacher Dashboard nên tập trung:

`My Classes → Students Needing Attention → Updates Required`

Không bắt giáo viên vào từng Student Detail để cập nhật từng trường.

Ưu tiên bulk update theo lớp.

Ví dụ:

| Student | Attendance | Homework | Skill |
|---|---|---|---|
| A | Present | Completed | Listening |
| B | Absent | Missing | Listening |
| C | Late | Completed | Listening |

Có thể:

- bulk save;
- autosave;
- filter theo skill;
- filter theo class;
- xem tổng hợp các skill khác nhưng chỉ edit skill được cấp.

---

### 15. Attendance

Status:

- Present;
- Absent;
- Late;
- Excused.

GVBM cập nhật attendance cho skill/buổi mình phụ trách.

Hệ thống có thể tổng hợp để hiển thị tín hiệu học tập.

Ví dụ:

- vắng nhiều;
- đi muộn nhiều.

Nhưng **không tự tạo Warning Letter**.

---

### 16. Homework

Status:

- Completed;
- Incomplete;
- Missing;
- Late.

Hệ thống có thể tổng hợp:

- completion rate;
- missing trend;
- học tập có vấn đề hay không.

Nhưng chỉ dừng ở **signal / attention indicator**.

Không tự động biến thành disciplinary warning.

---

### 17. Learning attitude / warning philosophy

Đây là quyết định quan trọng:

- hệ thống không tự quyết Warning Letter;
- GVBM cung cấp dữ liệu attendance/homework/progress;
- Core Teacher nhận thông tin từ các giáo viên;
- Core Teacher đánh giá tình hình;
- Core Teacher / Manager cập nhật thông tin report/warning reference.

Hệ thống chỉ có thể tính:

- attendance concern;
- homework concern;
- learning attitude signal;
- needs attention.

Nhưng **quyết định report / WL là con người**.

---

### 18. Incident / Warning Letter

Không cần xây như một hệ thống tạo document chính thức trên web ở giai đoạn này.

Incident và WL chủ yếu để:

- ghi lại;
- cập nhật;
- đối chiếu;
- xem lịch sử.

Có thể lưu:

- date;
- type;
- reason;
- description;
- created by;
- note;
- status/reference;
- follow-up.

Không cần generate warning letter document.

---

### 19. Student Progress Report

Giữ Student Progress Report như một object riêng, dùng để:

- tổng hợp tiến độ;
- lưu nhận xét định kỳ;
- giúp Manager / Consultant / Core Teacher theo dõi;
- đối chiếu theo thời gian.

Không trộn Student Progress Report với Branch Report.

---

### 20. Official Score vs Teacher Estimate

Phải tách riêng.

#### Official Score

Nguồn chính:

- Entrance Test;
- Mock Test.

Lưu theo skill:

- Listening;
- Reading;
- Writing;
- Speaking;
- Overall.

Mỗi test phải lưu:

- date;
- test type;
- score;
- note;
- entered by.

Không overwrite điểm cũ.

---

#### Teacher Estimate

Giáo viên có thể tự đánh giá theo tuần, tách theo skill.

Ví dụ:

- Listening ~6.0
- Reading ~6.0
- Writing ~5.5
- Speaking ~6.0

Teacher Estimate phải hiển thị rõ là estimate, không phải official score.

---

### 21. Student Profile / Student Journey

Student Detail phải giúp hiểu nhanh:

> Học sinh bắt đầu từ đâu → đã học gì → hiện ở đâu → tiến bộ thế nào → có vấn đề gì → bước tiếp theo là gì.

Summary nên có:

- Student Name;
- Student ID;
- Class;
- Branch;
- Target;
- Current official score;
- Teacher estimate;
- Exam date;
- Attendance status;
- Homework status;
- Academic Progress;
- Warning / attention status.

Student Journey Timeline có thể gồm:

- Enrollment;
- Class movement;
- Stage;
- Progress Test;
- Mock Test;
- Teacher Estimate;
- Report;
- Warning reference;
- Teacher Note;
- route change;
- pause;
- repeat;
- exam date.

---

### 22. Manager Dashboard

Manager Dashboard ưu tiên:

`Overview → Problem Detection → Action → Drill-down`

Không bắt Manager đọc từng Student Detail ngay.

Nên có:

- total branches;
- active classes;
- FT classes;
- Normal classes;
- active students;
- classes on track;
- delayed classes;
- students needing attention;
- warning students;
- new reports;
- unresolved issues;
- overdue tasks;
- due soon;
- in progress;
- completed;
- long-term tasks not closed.

Filter theo:

- branch;
- class type;
- teacher;
- time range;
- toàn hệ thống / scoped branch.

---

### 23. Branch Overview

Giữ logic từ web Meeting Minutes cũ.

Các nhóm:

1. Sĩ số & tình hình lớp
2. Chất lượng dạy học
3. Học viên & phụ huynh
4. Nhân sự giáo viên
5. Giáo trình / chương trình học

Status:

- Ổn;
- Cần theo dõi;
- Có vấn đề;
- Chưa báo cáo.

Dữ liệu ban đầu chủ yếu do Manager nhập tay.

Không cần auto-detect sâu ở giai đoạn đầu.

---

### 24. Syllabus / class progress

Phần syllabus ban đầu chủ yếu do Manager:

- xác định lớp đang ở tuần/stage nào;
- cập nhật actual progress;
- sửa lại nếu cần.

Hệ thống có thể hiển thị:

`Expected Progress vs Actual Progress`

nhưng không cần cố tự động hóa quá nhiều ngay.

---

### 25. Issue Center

Issue là **object riêng**, nhưng phải gọn.

Không auto-detect issue trong giai đoạn đầu.

Manager sẽ:

- tự nhập issue;
- bàn bạc risk;
- assign người xử lý;
- liên kết task nếu cần.

Issue có thể gồm:

- Title;
- Scope;
- Risk Level;
- Owner;
- Status;
- Note;
- Linked Branch;
- Linked Class;
- Linked Student;
- Linked Meeting;
- Linked Task;
- Created At;
- Resolved At.

Issue lifecycle đơn giản:

- Open;
- Discussing;
- In Progress;
- Resolved.

---

### 26. Meeting / Weekly Operation Cycle

Đây là module quan trọng lấy từ web Meeting Minutes cũ.

Flow:

`Meeting Period → Branch Reports → Issues → Decisions → Tasks → Follow-up`

Dữ liệu theo:

- Month;
- Week;
- Meeting period.

Cần giữ lịch sử từng tuần.

---

### 27. Meeting entity

Nên có:

- Meeting;
- MeetingPeriod;
- MeetingAgenda;
- MeetingDecision.

Task / Issue có thể liên kết về:

- sourceMeeting;
- sourceIssue;
- sourceBranchReport.

---

### 28. Task Management

Task Management giữ đơn giản.

Task gồm:

- title/content;
- assignee;
- branch;
- scope;
- linked student;
- linked class;
- linked issue;
- linked meeting;
- created date;
- deadline;
- priority;
- status;
- note;
- created by;
- completedAt;
- optional attachment;
- optional blocked reason.

Status:

- Not Started;
- In Progress;
- Paused;
- Completed.

Deadline state tự tính:

- Overdue;
- Due Soon;
- On Track.

Không cho user nhập deadline state thủ công.

---

### 29. Carry-over task

Task chưa xong sang tuần sau vẫn tiếp tục xuất hiện.

Không duplicate record.

Giữ:

- original created date;
- source meeting;
- original deadline;
- history.

---

### 30. Consultant

Consultant có thể xem học sinh mình phụ trách.

Được xem:

- Student Summary;
- Class;
- Student Journey;
- Attendance summary;
- Homework summary;
- Official Test;
- Progress;
- Warning / report status phù hợp;
- Academic Summary;
- Student Progress Report.

Không được:

- sửa attendance;
- sửa homework;
- sửa academic progress;
- chỉnh class;
- tạo warning;
- chỉnh lộ trình;
- sửa dữ liệu học tập.

---

### 31. Consultant Manager

Consultant Manager có scope rộng hơn Consultant.

Có thể xem:

- học sinh của team;
- học sinh của branch;
- các consultant trong scope.

Vẫn chủ yếu read-only về academic.

Không biến hệ thống thành CRM ở giai đoạn này.

---

### 32. Teacher Notes và privacy

Teacher Notes nội bộ quá chi tiết **không mặc định hiển thị đầy đủ cho Consultant**.

Consultant chỉ cần xem:

- Academic Summary;
- Student Progress Report;
- Warning / concern status;
- thông tin đủ để trao đổi với phụ huynh.

---

### 33. Role + Scope + Permission

Ví dụ:

##### Admin
Full access theo permission được cấp.

##### Manager
Quản lý branch / organization scope được giao.

##### Teacher
View class được giao, edit skill được giao.

##### Core Teacher
Teacher + quyền cập nhật tổng hợp lớp/học sinh.

##### Consultant
View assigned students.

##### Consultant Manager
View wider consultant/team/branch scope.

Permission phải check cả:

- frontend;
- backend/API.

---

### 34. Autosave / SPA behavior

Requirement bắt buộc:

- autosave;
- không reload page sau thao tác;
- smooth interactions.

UI feedback:

- Saving...
- Saved ✓
- Save failed / Retry

Phải xử lý:

- loading;
- empty;
- error;
- no permission;
- no data.

---

### 35. Audit Log

Dữ liệu quan trọng phải có lịch sử.

Lưu:

- user;
- action;
- entity;
- timestamp;
- before;
- after.

Ví dụ:

- chuyển lớp;
- sửa homework;
- nhập mock test;
- đổi warning policy;
- sửa template;
- đổi enrollment.

---

### 36. Soft Delete / Archive

Không hard-delete dữ liệu quan trọng.

Dùng:

- Active;
- Inactive;
- Archived;
- DeletedAt nếu cần.

Áp dụng cho:

- Student;
- User;
- Class;
- Branch;
- Template;
- các entity quan trọng.

---

### 37. Search & Filter

Global Search:

- Student Name;
- Student ID;
- Class;
- Teacher;
- Branch;
- Phone nếu có quyền.

Filter:

- Branch;
- Teacher;
- FT / Normal;
- Class;
- Status;
- Warning;
- Progress;
- Date range.

---

### 38. Notification

Chỉ alert những thứ cần hành động.

Có thể gồm:

- task overdue;
- task due soon;
- student attendance concern;
- homework concern;
- class progress issue;
- exam date approaching;
- issue assigned;
- report waiting follow-up.

Không spam notification cho update nhỏ.

---

### 39. Information Architecture đề xuất

Sidebar không nên quá nhiều menu.

Core:

- Dashboard
- Students
- Classes
- Issues
- Tasks
- Reports
- Meetings
- Administration

Không cần menu riêng cho:

- Homework;
- Attendance;
- Mock Test;
- Warning;
- Teacher Notes.

Các dữ liệu này nằm trong Student/Class.

---

### 40. Core database entities

Tối thiểu nên có:

- User
- Role
- Permission
- Scope
- Branch
- ReportingUnit
- Class
- ClassType
- CourseTemplate
- CourseTemplateVersion
- CourseStage
- Student
- Enrollment
- StudentJourneyEvent
- SkillAssignment
- WeeklyLearningRecord
- Attendance
- Homework / Assignment
- Assessment
- TeacherEstimate
- TeacherNote
- StudentProgressReport
- IncidentReference
- WarningReference
- Issue
- Task
- BranchReport
- ReportPeriod
- Meeting
- MeetingPeriod
- MeetingAgenda
- MeetingDecision
- AuditLog
- Notification

Không nhất thiết phải implement tất cả trong MVP, nhưng architecture phải không chặn việc thêm sau.

---

### 41. Quan hệ quan trọng

##### Student
có nhiều Enrollment theo thời gian.

##### Class
có nhiều Teacher assignment.

##### Teacher
có thể dạy nhiều class/skill.

##### Student
có thể có per-skill / per-week override khác home class.

##### Issue
có thể liên kết Student / Class / Branch / Meeting / Task.

##### Task
có thể sinh từ Issue / Meeting / Branch Report.

##### Template
phải versioned.

---

### 42. Data source ban đầu

Phần lớn dữ liệu ban đầu sẽ nhập tay hoặc import từ Excel.

Các dữ liệu như:

- student info;
- branch;
- class;
- target;
- consultant;
- syllabus;
- class progress;

chưa cần auto-sync với hệ thống khác trong giai đoạn đầu.

---

### 43. Phân biệt dữ liệu tự động và nhập tay

#### Nhập tay / do con người quyết định

- Branch status;
- Issue;
- Warning/Report reference;
- syllabus current stage;
- student overall concern;
- learning attitude tổng hợp;
- manager decisions.

#### Hệ thống có thể tự tổng hợp

- attendance count;
- homework completion;
- test trend;
- overdue task;
- due soon;
- current official test;
- teacher estimate history;
- progress summaries.

Hệ thống **không tự đưa ra Warning Letter**.

---

### 44. Bản local prototype đầu tiên

Giai đoạn đầu cần có:

- web local chạy được;
- seed data giả;
- nhiều branch giả;
- nhiều class FT/Normal;
- student có trạng thái khác nhau;
- attendance/homework/test data giả;
- issue/task/meeting data giả;
- nhiều role giả;
- role switcher;
- UI đủ hoàn chỉnh để click thử.

Mục đích:

> Nhìn thấy → dùng thử → phát hiện UX chưa hợp lý → chỉnh tiếp.

Không cố khóa UI quá sớm.

---

### 45. Development phases

Không yêu cầu AI phân tích xong rồi code luôn.

Nên chia gate.

#### Phase 1 — Product Analysis
Tóm tắt mục tiêu, workflow, role, problem.

#### Phase 2 — Simplification
Giữ / bỏ / gộp / thiếu.

#### Phase 3 — Information Architecture
Sidebar, pages, hierarchy, navigation.

#### Phase 4 — Permission Matrix
Admin / Manager / Teacher / Consultant / Consultant Manager.

#### Phase 5 — Data Architecture
Schema + relationship.

#### Phase 6 — Screen Specification
Manager Dashboard, Teacher Dashboard, Students, Student Detail, Classes, Class Detail, Issues, Tasks, Reports, Meetings, Admin.

#### Phase 7 — UX Review
Giảm click, form, field, duplicate data.

##### STOP / REVIEW GATE

Chỉ sau khi Product Spec được approve mới chuyển sang:

#### Phase 8 — Local Prototype
Seed data + local-running web.

#### Phase 9 — Iteration
Dùng thử và sửa UX.

#### Phase 10 — Production Planning
Auth, DB thật, deployment, backup, monitoring, migration.

---

### 46. Workflow làm việc với AI

Người dùng dự kiến:

##### ChatGPT / Astra
dùng cho:

- Product thinking;
- UX;
- Web design;
- architecture;
- specification;
- prompt;
- review;
- iteration.

##### Claude
dùng chủ yếu cho:

- implementation;
- code;
- repo;
- debugging;
- refactor.

Nguyên tắc:

> Không để coding model tự quyết business logic lớn nếu chưa có spec rõ.

---

### 47. Các nguyên tắc không được tự thay đổi

1. Core Teacher không phải role hệ thống.
2. Subject Teacher được xem toàn lớp nhưng chỉ edit skill được giao.
3. Consultant chủ yếu read-only.
4. Student có thể học cực kỳ linh hoạt, không ép vào schedule cứng.
5. Không biến website thành CRM ngay.
6. Không auto-create Warning Letter.
7. Issue ban đầu do Manager nhập và thảo luận.
8. Branch Report và Student Progress Report là hai object khác nhau.
9. Incident/WL chủ yếu là record/reference.
10. Excel import là requirement quan trọng.
11. Student ID tự sinh.
12. Enrollment phải giữ lịch sử chuyển lớp/học lại.
13. Template phải có versioning.
14. Task carry-over không duplicate.
15. Autosave + no page reload.
16. Role permission phải check backend.
17. Một user có thể có nhiều role.
18. Role switcher chỉ đổi UI context, không nâng quyền.
19. Prototype đầu tiên phải có fake data để test.
20. Ưu tiên simplicity trước automation.

---

### 48. Những giả định hiện tại có thể thay đổi sau khi dùng prototype

Các phần sau chưa cần khóa cứng:

- exact attendance threshold;
- exact homework concern threshold;
- exact dashboard KPI;
- exact Teacher Dashboard layout;
- exact Student Detail layout;
- exact number of report categories;
- exact session granularity;
- exact issue severity labels;
- exact notification rules;
- exact visual design.

Các phần này nên được điều chỉnh sau khi người dùng nhìn và sử dụng bản local prototype.

---

### 49. Ambition dài hạn

Nếu hệ thống chạy tốt, có thể mở rộng sau:

- parent communication;
- CRM integration;
- scheduling;
- automatic sync;
- analytics;
- AI summaries;
- parent portal;
- performance forecasting;
- richer reporting.

Nhưng **không xây các phần này ở MVP nếu làm phức tạp core workflow**.

---

### 50. Tóm tắt một câu

> Xây một internal academic + operations control system cho PISA IELTS, tập trung vào Student Journey, Class Progress, Branch Reporting, Issue/Task follow-up và role-based collaboration, với UX cực gọn, data-driven, linh hoạt theo từng lớp/học sinh, hỗ trợ Excel import và có local prototype seeded data trước khi triển khai production.



---

## Phụ lục B — Luật và ý nghĩa workbook đã đối chiếu

Giữ các bảng L/R, kỳ vọng FT, can thiệp và ý nghĩa thống kê để tham chiếu mà không cần tìm lại Excel. Đoạn “Q2” dưới đây là câu hỏi của thời điểm S6; xem D24/O01 để biết trạng thái hiện nay. Công thức S/W đã được S7 ghi chốt ở D23. Không áp dụng bảng can thiệp FT cho FOU/BE/ELE.



### 5.1. Kỳ vọng và SOS

Áp dụng FT LT1/LT2 theo DOCX; không tự mở rộng sang FOUND/BE/ELE.

| Lần | Mốc dự kiến | Kỳ vọng cho từng kỹ năng |
|---|---|---|
| MT1 | Tuần học FT 6 | Cam kết − 1.0 |
| MT2 | Tuần học FT 12 | Cam kết − 0.5 |
| MT3 | Tuần học FT 16 | Cam kết |
| MT4, nếu có | Tuần học FT 20 | Cam kết |
| MT5, nếu có | Tuần học FT 24 | Cam kết |

Kỹ năng có band **nhỏ hơn** kỳ vọng là không đạt; bằng kỳ vọng là đạt. Đếm theo bốn kỹ năng, không theo chênh lệch Overall: 0 không đạt → Đạt kỳ vọng; 1 → SOS 1; 2 → SOS 2; từ 3 → SOS 3. Áp dụng Q2 cho trường hợp thiếu dữ liệu. Không tự hạ kỳ vọng hoặc làm tròn lại kỳ vọng.

`Overall Mock = ROUND(AVERAGE(L, R, W, S) * 2, 0) / 2`, chỉ khi đủ bốn band. Tái hiện làm tròn Excel cho điểm không âm, không dùng phép làm tròn về số chẵn ở điểm giữa. Đây là Overall bốn kỹ năng; không dùng công thức này để tự quyết cách tính band W/S từ tiêu chí.

### 5.2. Bảng quy đổi L/R chính xác

Nguồn: `Bang quy doi!A5:C45`. Mỗi mảng dưới đây có 41 phần tử, index là số câu đúng 0–40. Dùng đúng bảng nội bộ này, không thay bằng bảng IELTS tìm trên mạng.

```json
{
  "listeningByRaw": [0,0,1,2.5,2.5,3,3,3.5,3.5,3.5,4,4,4,4.5,4.5,4.5,5,5,5,5,5.5,5.5,5.5,6,6,6,6,6.5,6.5,6.5,7,7,7,7.5,7.5,8,8,8.5,8.5,9,9],
  "readingByRaw": [0,0,1,1.5,2.5,2.5,3,3,3.5,3.5,4,4,4,4.5,4.5,5,5,5,5,5.5,5.5,5.5,5.5,6,6,6,6,6.5,6.5,6.5,7,7,7,7.5,7.5,8,8,8.5,8.5,9,9]
}
```

### 5.3. Hành động SOS

Mọi mức SOS có trao đổi HS, phối hợp PH, hỗ trợ học thuật và thông báo GVCN/GVBM. Người trao đổi HS ở SOS2 từ MT2 là GVBM; các trường hợp còn lại là GVCN + GVBM theo bảng. CS là người trao đổi PH trong nguồn, cần xử lý trách nhiệm theo Q4.

| MT | SOS | Học thuật | Vận hành | Meeting bổ sung |
|---|---|---|---|---|
| MT1 | 1 hoặc 2 | Xếp tự học một tháng tiếp theo | Không có yêu cầu tại bảng | Không có yêu cầu tại bảng |
| MT1 | 3 | Tutor đến MT2 | Không có yêu cầu tại bảng | GVCN gặp HS |
| MT2 | 1 | Xếp tự học một tháng tiếp theo | Không có yêu cầu tại bảng | Không có yêu cầu tại bảng |
| MT2 | 2 | Xếp tự học một tháng tiếp theo | Không có yêu cầu tại bảng | GVCN gặp HS |
| MT2 | 3 | Ưu tiên tutor với GV đến MT3, hoặc đề xuất lùi lịch thi kèm phương án hỗ trợ | Không có yêu cầu tại bảng | CX/GĐCN gặp HS |
| MT3 hoặc MT4 | 1 | Tutor đến lúc thi | Không có yêu cầu tại bảng | Không có yêu cầu tại bảng |
| MT3 hoặc MT4 | 2 | Tutor đến lúc thi | Chính sách bổ trợ theo case | GVCN gặp HS |
| MT3 hoặc MT4 | 3 | Ưu tiên tutor với GV đến lúc thi | Chính sách bổ trợ theo case | CX/GĐCN gặp HS |
| MT5 | 1 | Hỗ trợ chuyên môn; nguồn chưa quy định hình thức/thời lượng | Không có yêu cầu tại bảng | Không có yêu cầu tại bảng |
| MT5 | 2 | Hỗ trợ chuyên môn; nguồn chưa quy định hình thức/thời lượng | Chính sách bổ trợ theo case | GVCN gặp HS |
| MT5 | 3 | Hỗ trợ chuyên môn; nguồn chưa quy định hình thức/thời lượng | Chính sách bổ trợ theo case | CX/GĐCN gặp HS |

Lưu ý nguồn: dòng MT2 SOS3 trong bảng DOCX không nhắc CS–PH, nhưng bước chung của DOCX và dòng tương ứng trong sheet `Quy trinh SOS` có. Không vì thiếu ở một ô mà xóa bước trao đổi PH; nêu khác biệt này khi chốt Q4. Từ MT3 SOS2/3 có hỗ trợ vận hành nhưng loại/quyền lợi cụ thể là quyết định theo case, không phải tự động cấp.

### 5.4. Ý nghĩa số liệu Excel — giữ đúng khi chuyển lên web

| Nguồn | Ý nghĩa thực tế | Hệ quả thiết kế |
|---|---|---|
| `Nhap diem!Y` | Ngày có kết quả − ngày thi | Gọi là thời gian trả kết quả/chấm, không phải số ngày quá hạn deadline |
| `Nhap diem!AL` | Ngày trao đổi HS hoặc PH sớm nhất − ngày thi | Thời gian bắt đầu can thiệp; không phải thời gian hoàn tất case |
| `Tong hop tuan!C` | Đếm dòng học sinh/lượt Mock theo tháng–tuần | Không tự gọi là học sinh duy nhất hoặc lịch dự kiến |
| `Tong hop tuan!I:J` | Số SOS có ngày trao đổi HS/PH | Không dùng chỉ tên người thực hiện để chứng minh đã làm |
| `Tong hop tuan!K` | Có ngày bắt đầu hỗ trợ học thuật | Nếu ngày tương lai, phân biệt đã xếp với đã bắt đầu |
| `Tong hop tuan!L` | Tổng SOS trừ số có người trao đổi HS ở cột AA | Không gọi chính xác đây là case chưa có người điều phối; định nghĩa lại rõ nếu thêm owner |
| `Tong hop tuan!M:N` | Trung bình thời gian chấm và can thiệp | Không có dữ liệu hiển thị dấu gạch, không phải 0 ngày |
| Hướng dẫn về tuân thủ | Chỉ là chỉ báo có người thực hiện trong số SOS | Không trình bày thành tỷ lệ hoàn tất toàn bộ quy trình |
| `MEETING_MINUTES_HEADS`, `TỔNG HỢP!E5:E6` | Công thức đếm hạn có `#REF!`, cache 0 không đáng tin | Tính lại từ hạn và tiến độ task theo ý nghĩa nguồn; không sao chép số 0 hoặc lỗi công thức |

Đây là các đặc điểm của file nguồn, không phải đánh giá code/PR hiện tại. Dòng mẫu, số cache và nhãn tuần mẫu không được coi là quy tắc nghiệp vụ.



## Phụ lục C — Coverage 50 mục gốc

Nguyên văn đủ50 mục ở Phụ lục A; bảng này chỉ cách tra trạng thái mới.

| Mục S0 | Nơi đối chiếu hiện hành |
|---|---|
| 1–2 Tầm nhìn/nguyên tắc | D01–05, mục8 |
| 3 Tổ chức | D06 |
| 4–7 Loại lớp/template/session/homework | D12/26/27, F01–07/F21 |
| 8–10 Lifecycle/ID/import | D11–17 |
| 11–14 Roles/switcher/assignment/teacher UX | D07–10/D44 |
| 15–18 Attendance/homework/attitude/Incident-WL | F01–07/F11, D31–33 |
| 19–21 Student report/official-estimate/Journey | D17/23/25/31/37, F09–10 |
| 22–24 Dashboard/Branch/syllabus | D35–40, F17–18 |
| 25–29 Issues/Meetings/Tasks/carry-over | F12–16, D39 |
| 30–33 Consultant/privacy/permissions | F08, D07–10 |
| 34–38 Autosave/audit/archive/search/notification | D13/43–46, F19 |
| 39–43 IA/entities/relations/sources/derived-manual | D02/04/11/14/37/39–43, mục8 |
| 44–46 Prototype/phases/AI workflow | D41/46, F22/24, mục8 |
| 47–50 Guardrails/open/future/summary | Mục0/7/8/9 |

Prompt hiện hành đã cập nhật đầy đủ trong `Web_Redesign_System_Logic_Revision_Prompt.md`: giữ mọi nhóm S8 và thêm sections17–18 về căn cứ PR4, migration, test và cập nhật master. Cả hai file dùng cùng danh sách OPEN; không coi việc gửi prompt là chốt các công thức còn thiếu.
