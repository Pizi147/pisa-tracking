# PISA Progress — Yêu cầu chỉnh sửa demo và trải nghiệm quản lý học viên

Tôi cần bạn thực hiện các đầu việc dưới đây. Hãy nghiên cứu kỹ toàn bộ yêu cầu, chủ động đề xuất ý tưởng và hỏi lại bất cứ điểm nào chưa rõ, thiếu thông tin hoặc có mâu thuẫn. Không tự suy diễn hay thay đổi nội dung nghiệp vụ; nếu muốn thay đổi, hãy hỏi tôi trước.

Tôi chưa cần một website hoàn chỉnh. Mục tiêu hiện tại là bản demo thể hiện rõ các chức năng chính: **hành trình học viên, tổng hợp thông tin học viên, case và quá trình xử lý case**.

Bạn được khuyến khích đề xuất và overhaul giao diện để tăng tính thực tế, dễ sử dụng và trực quan. Những yêu cầu này cần được xem xét xuyên suốt tất cả các trang, bảng và cột thông tin, không chỉ trang Học viên. Hãy trao đổi rõ các đề xuất và cách bạn hiểu yêu cầu để triển khai đúng định hướng.

## Quy ước thuật ngữ

- **Quản trị hệ thống (System Admin)**; **Admin chi nhánh (Admin CN)**; **Quản lý (QL)**; **Giáo viên (GV)**; **Giáo viên chủ nhiệm (GVCN)**; **Chi nhánh (CN)**.
- Dùng **học viên** thống nhất trong giao diện.
- **Case** và **vấn đề** cùng chỉ một đối tượng; ưu tiên “case”, dùng “vấn đề” tại vị trí phù hợp để người dùng dễ hiểu.
- **Đề xuất chờ duyệt/Chờ duyệt:** phương án do GV đề xuất để giải quyết một case, đang chờ Quản lý duyệt. **Quá hạn cập nhật case/Quá hạn cập nhật:** đã quá thời hạn theo dõi việc xử lý nhưng chưa cập nhật tình hình, kết quả. Áp dụng đúng hai khái niệm này cho mọi bộ lọc, badge và bảng tổng hợp.
- **Mock Test (MT)**, đánh số **MT1, MT2, MT3…**; phân biệt **tuần kế hoạch MT**, **ngày MT cụ thể** và **ngày thi** của học viên.
- **Normal** là nhóm lớp thường **FOU, BE, ELE**. Giữ tên **FT**, **LT1/LT2**, **OVR**, **Target** trong những ngữ cảnh tương ứng.
- **Listening (L)**, **Reading (R)**, **Speaking (S)**, **Writing 1 (W1)**, **Writing 2 (W2)**, **Ý thức/Khác**; thống nhất cách viết **Pronunciation** và **Prep Writing (PrepW)**.

## 1. Màn hình chính

Mở rộng phần **“Lớp của bạn”** để chiếm khoảng **25–30% tổng chiều rộng của hai bảng thông tin**.

## 2. Dữ liệu demo

Reset và tạo lại toàn bộ dữ liệu demo. Không cần quá nhiều dữ liệu, nhưng phải đủ các tình huống và phù hợp với định hướng website hiện tại. Khắc phục tình trạng số liệu lộn xộn, không thống nhất và sai lệch giữa các phần.

## 3. Hành trình học viên

Hành trình học viên hiện chưa rõ như tôi mong muốn. Ngay tại **hồ sơ học viên**, cần nhìn thấy hành trình và ưu tiên các case đang theo dõi, cần xử lý. Nếu chưa hiểu yêu cầu, hãy hỏi lại và triển khai ngay khi đã rõ.

## 4. Điểm kiểm tra của lớp Normal

Không tính điểm kiểm tra của **FOU, BE, ELE** theo thang IELTS. Điều kiện đạt là **≥60%**.

Vì tổng số câu hoặc thang điểm thay đổi theo bài kiểm tra, người nhập cần ghi cả điểm đạt được và tổng điểm, ví dụ:

- GV Pronunciation nhập **15/30 → Không đạt**.
- GV Prep Writing nhập **30/40 → Đạt**.

## 5. Lên kế hoạch MT

Sửa lỗi của nút **“Lên kế hoạch MT”**: không chuyển được tuần, không nhập được tên học viên. Đồng thời thiết kế lại panel để hỗ trợ:

- Chọn lớp trước để hiện toàn bộ danh sách học viên của lớp, hoặc tìm chọn trực tiếp học viên.
- Chọn ô **MT1/2/3/4/5/6/7…** riêng cho từng học viên, sau đó chốt cùng một tuần. Không được sửa lượt MT đã có và đã hoàn thành.
- Ví dụ: chọn **MT2 của Nguyễn A** và **MT4 của Nguyễn B**, rồi xếp vào cùng một tuần.
- Lọc học viên chưa có **MT1/2/3…** trong cả chi nhánh hoặc theo lớp để đăng ký hàng loạt.

## 6. Bộ lọc học viên theo vai trò

Đổi tên và hiển thị các bộ lọc theo bảng sau:

| STT | Bộ lọc | Giáo viên | Quản lý | Admin CN |
|---|---|:---:|:---:|:---:|
| 1 | Lớp | ✓ | ✓ | ✓ |
| 2 | SOS | ✓ | ✓ | |
| 3 | Case đang xử lý — đang theo dõi | ✓ | ✓ | |
| 4 | Case thiếu phương án | ✓ | ✓ | |
| 5 | Case quá hạn — quá hạn cập nhật kết quả sau xử lý | ✓ | ✓ | |
| 6 | Cần nhập điểm MT | ✓ | ✓ | ✓ |
| 7 | Chưa có lịch MT | | ✓ | ✓ |
| 8 | Cần cập nhật ngày MT | | | ✓ |

Chỉ hiển thị bộ lọc cần thiết theo vai trò. Cách gọi và nguyên tắc hiển thị cần được đồng bộ, hiện diện nhất quán ở các trang liên quan.

## 7. Quy trình vận hành

### 7.1. Tài khoản và phạm vi hoạt động

Khi website bắt đầu hoạt động, cần có tài khoản **Quản trị hệ thống mặc định của tôi**, từ đó tôi có thể tạo tài khoản và cấp quyền cho Quản lý, Admin CN và GV.

- Một Quản lý có thể quản lý và giảng dạy tại nhiều chi nhánh.
- Một Admin CN có thể phụ trách nhiều chi nhánh nhưng không giảng dạy.
- Một GV có thể chỉ làm giáo viên, dạy tại nhiều chi nhánh hoặc đồng thời có vai trò Quản lý.
- GV tự đăng ký phải khai báo các chi nhánh hoạt động và chờ tôi duyệt sau khi đăng ký.
- Đăng ký bằng email của trung tâm; chỉ email có đuôi **`.pisa@gmail.com`**, ví dụ **`dung.pisa@gmail.com`**, mới hợp lệ.

### 7.2. Hồ sơ cá nhân

Sau khi tạo tài khoản, người dùng có thể cập nhật hồ sơ: họ tên, các kỹ năng có thể phụ trách, số điện thoại và email(s).

### 7.3. Quyền Quản trị hệ thống

Quản trị hệ thống có toàn quyền quản lý hệ thống cơ bản: tạo/sửa lộ trình, tạo/sửa loại lớp và cấp quyền xem thông tin theo từng vai trò hoặc từng cá nhân.

Ví dụ: tôi có thể cấp cho **Nguyễn Yến — Quản lý CN Monbay** quyền quan sát toàn bộ thông tin của cả hệ thống.

### 7.4. Tạo lớp, thêm học viên và nhập Excel

Quản trị hệ thống, Quản lý và Admin CN có thể được cấp quyền tạo lớp/học viên mới, sử dụng panel trượt tương tự phần thêm học viên hiện tại.

- Thông tin cơ bản gồm tên lớp và loại lớp **FT/Normal**.
- Lớp FT chỉ cần đánh số; lớp Normal cần chọn **FOU, BE hoặc ELE**.
- Nếu lớp đã có, chọn trực tiếp lớp đó để thêm học viên.
- Phần thêm học viên hiện tại tương đối hợp lý. Riêng nhập từ Excel cần rút gọn còn **5 cột**: **Họ và tên, Lớp, Ngày sinh, Điểm đầu vào, Target**.
- Điểm đầu vào ưu tiên **OVR**; không phải học viên nào cũng có điểm đầu vào chi tiết, có thể bổ sung về sau. Những thông tin khác cũng có thể cập nhật sau.

### 7.5. Tuần bắt đầu học và thời điểm thi

Cần ghi nhận học viên bắt đầu học từ **tuần nào** và dự kiến thi vào **tháng, năm nào**. Không bắt buộc ngày bắt đầu học cụ thể; ngày thi cụ thể có thể cập nhật sau.

**Admin CN, Quản lý và GVCN của lớp** được chỉnh sửa các thông tin này. Đây không hẳn là nhóm “công việc phải làm”, nhưng cần được bổ sung sớm. Gộp các thông tin còn thiếu vào badge **“Thiếu thông tin”**, hiển thị trên cả thanh lớp và học viên để những vai trò có trách nhiệm nhận biết.

### 7.6. Tiến độ lớp FT và Normal

- **FT:** tuần học viên bắt đầu học quyết định lịch MT tương lai theo cơ chế đã được lập trình. Nếu chưa rõ cơ chế này, hãy hỏi lại.
- **Normal:** tuần bắt đầu của từng học viên không quan trọng bằng **tuần bắt đầu của lớp**, vì mỗi loại lớp đã có mốc tuần làm **Progress Test** và **Final Test**.
- Thông tin lớp phải thể hiện đang học **LT1 hay LT2**, ở **tuần nào**.
- **Admin CN và Quản lý CN** được thay đổi tuần tiến độ học của lớp.

### 7.7. Phân công giáo viên

Các vai trò nêu trên có thể phân công GV vào lớp theo nguyên tắc:

- Mỗi kỹ năng chỉ có **một GV**.
- Một GV có thể dạy nhiều kỹ năng trong cùng lớp.
- Chỉ **một GV trong danh sách được phân công** làm GVCN.
- Nếu thiếu GV hoặc chưa phân công GVCN, hiển thị nhãn nhắc Admin CN/Quản lý xử lý, ví dụ **“Thiếu GV R, L”**.

### 7.8. Trách nhiệm của Quản lý CN

Phân biệt rõ **việc cần phải làm** với **quyền có thể làm**. Quản lý CN cần:

- Xem, sửa và bổ sung **tuần kế hoạch MT** cho học viên nếu chưa có.
- Duyệt, cung cấp phương án xử lý cho các trường hợp học viên cần hỗ trợ khi cần thiết.

### 7.9. Trách nhiệm của Admin CN

- Cập nhật **ngày MT cụ thể**: xác nhận học viên đi MT ngày nào trong tuần đã có kế hoạch.
- Cập nhật thông tin thiết yếu của lớp và học viên; hỏi lại nếu chưa rõ những thông tin cần cập nhật.
- Phân công GV đúng kỹ năng và phân công GVCN.

### 7.10. Trách nhiệm của Giáo viên

- Nhập điểm MT hằng tuần cho học viên nếu có.
- Báo cáo nội dung cần hỗ trợ khi học viên có vấn đề.
- Đề xuất phương án xử lý, ghi rõ thời gian thực hiện và theo dõi.
- Cập nhật kết quả sau thời gian hỗ trợ và theo dõi.

### 7.11. Theo dõi hỗ trợ theo kỹ năng

Một case có thể có nhiều phương án xử lý đồng thời. Cần tổ chức thông tin theo các hạng mục: **Listening, Reading, Writing 1, Writing 2, Speaking, Ý thức/Khác** để dễ theo dõi.

Mỗi hạng mục hiển thị:

- Band hiện tại dựa trên **điểm MT chính thức gần nhất**, trình bày gọn trong hạng mục.
- Điểm GV đánh giá chỉ xuất hiện trong ngữ cảnh **cập nhật tình hình, kết quả xử lý case**, theo mục 7.17; bỏ cách hiển thị thường trực cạnh điểm MT.
- Lịch sử thay đổi và các lần hỗ trợ của GV, gồm nội dung, thời gian, kết quả.
- Khi bấm vào, mở màn hình case cụ thể.

Tôi chưa xác định được cách trình bày đủ rõ, trực quan và không gây quá tải. Hãy đề xuất thiết kế; đây là phần **phải triển khai trong đợt code gần nhất**.

### 7.12. Gộp case do GV báo cáo và case phát sinh từ SOS

Hai nguồn phải được đưa về cùng một hệ thống case. Sau mỗi đợt MT, nếu học viên có SOS, hệ thống sinh case tương ứng và đưa vào danh sách cần xử lý của từng hạng mục ở mục 7.11.

**Mức SOS tính theo số kỹ năng chưa đạt trong 4 kỹ năng L, R, W, S:** 1 kỹ năng → SOS 1; 2 kỹ năng → SOS 2; 3 kỹ năng trở lên → SOS 3. Việc tách Writing thành W1/W2 để xử lý không làm tăng số kỹ năng dùng để xác định mức SOS.

**Ví dụ 1:** Học viên A không đạt **2/4 kỹ năng ở MT1: L và S → SOS 2**, sinh **3 case**:

| Hạng mục | Case | Phương án mặc định |
|---|---|---|
| Listening | MT1 - Listening dưới kỳ vọng | Xếp tự học |
| Speaking | MT1 - Speaking dưới kỳ vọng | Xếp tự học |
| Ý thức/Khác | MT1 - 2 kỹ năng dưới kỳ vọng | Hai phương án: trao đổi với học viên và trao đổi với phụ huynh |

Phương án mặc định tuân theo tài liệu đã gửi trước đây. Không tách “liên hệ với học viên/phụ huynh” thành phần riêng như trước.

Các kỹ năng đã đạt kỳ vọng không sinh case. Kể cả W1 chưa đạt nhưng W2 kéo điểm Writing tổng hợp đủ đạt, vẫn không cần hỗ trợ và không tính SOS cho Writing.

**Ví dụ 2:** Học viên B không đạt **1/4 kỹ năng ở MT2: W → SOS 1**. Vì Writing tách thành W1 và W2, cần xem xét:

- Cả W1 và W2 chưa đạt: sinh **3 case** — W1, W2 và Ý thức/Khác.
- Chỉ một trong hai chưa đạt: sinh **2 case** — W1 hoặc W2, và Ý thức/Khác.

### 7.13. Nhận diện nguồn và cảnh báo case trùng

Case phát sinh từ SOS có tiền tố **MT1/2/3…**, giúp nhận diện nguồn. Không cần tách thành một nhóm xử lý riêng vì case do GV báo cáo và case từ SOS có cùng tính chất, mục đích và cách xử lý.

Khi GV thêm case cho kỹ năng đã có case học thuật chưa giải quyết xong, hiển thị pop-up thông báo. Nếu GV xác định đây là **vấn đề khác, cần xử lý riêng**, vẫn cho phép các case tồn tại song song.

### 7.14. Thời gian theo dõi và kết quả của case học thuật

- Mỗi case có thể áp dụng nhiều phương án.
- Case học thuật **bắt buộc có thời gian theo dõi và kết quả**.
- Với case từ MT, hạn theo dõi mặc định là **hết tuần MT tiếp theo**, có thể thay đổi.
- Kết quả có thể là nhận xét định tính, ví dụ “có tiến bộ”, “đã làm tốt hơn việc…”.
- GV có thể cập nhật kết quả sớm hơn và chi tiết theo từng mốc nếu muốn và/hoặc có đủ bằng chứng, theo định hướng đã nêu trong prompt trước.

### 7.15. Phương án thuộc Ý thức/Khác

Các phương án này thường mang tính thông báo. Cần cập nhật **đã hoàn thành** và **ngày thực hiện**; ghi chú là tùy chọn.

GV và Quản lý vẫn có thể chọn theo dõi dài hạn đối với phương án/case thuộc nhóm này khi có trường hợp đặc biệt.

### 7.16. Chốt kết quả và duy trì case xuyên suốt hành trình

Chỉ sau khi cập nhật đầy đủ kết quả của **tất cả phương án**, GV mới được chốt kết quả chung của case: mức độ thành công, kết thúc hẳn hay kéo dài theo dõi để có phương án mới.

Không tạo các case chồng lặp cho cùng một vấn đề. Ví dụ: cùng một khó khăn về cảm âm Listening của một học viên phải được theo dõi trong **một case**, không tách thành hai case giống nhau.

Đối với MT cũng tương tự: nếu sau MT1, GV đánh giá đã xử lý xong nhưng đến MT2 điểm vẫn chưa đạt, case đó vẫn là **vấn đề tiếp diễn**. Đổi tên đầu việc sang MT2 và tiếp tục hiển thị đầy đủ các phương án cũ cùng kết quả để theo dõi triệt để.

Một case có thể kéo dài **suốt quá trình học của học viên**. Điều này thể hiện những điểm GV còn chưa xử lý được và mức độ chưa triệt để của các phương án đã áp dụng — đó là mục đích quan trọng của website.

Bản hiện tại chưa đáp ứng được mong muốn này. Tôi cần bạn quan sát, nghiên cứu kỹ, đề xuất nhiều ý tưởng và hỏi lại những điểm chưa rõ để làm đúng.

### 7.17. Bỏ các phần điểm, ghi nhận riêng; tối giản đánh giá của GV

Bỏ toàn bộ các khu vực riêng **“Điểm chính thức”**, **“Ghi nhận của GV”** và giao diện cập nhật đánh giá GV riêng như trước. Điểm MT vẫn được nhập và sử dụng theo các yêu cầu về MT và bảng học viên; phần đánh giá của GV được lồng ghép vào **cập nhật tình hình, kết quả xử lý case**.

Về khả năng đánh giá điểm học viên ngoài luồng cập nhật case, hãy cân nhắc cả hai hướng sau:

- Có thể đề xuất một **phần hoặc nút nhỏ, tối giản, ít nổi bật** để GV đánh giá điểm học viên khi cần. Không trình bày thành một bảng riêng hay khu vực lớn, gây rối giao diện.
- Nếu ngay cả cách làm tối giản này vẫn gây rối hoặc làm trải nghiệm phức tạp hơn, **bỏ qua chức năng đánh giá điểm riêng đó**; chỉ giữ đánh giá trong luồng cập nhật tình hình, kết quả xử lý case.

Ưu tiên giao diện gọn và rõ. Không còn yêu cầu hiển thị thường trực điểm GV đánh giá cạnh điểm MT trong bảng học viên hay trong từng hạng mục kỹ năng.

### 7.18. Overhaul hồ sơ học viên và màn hình case

Ở **ảnh 4 và 5**, màn hình học viên và case hiện vừa rối mắt vừa sơ sài: tôi không biết cần theo dõi gì, ghi nhận ở đâu và hiểu thông tin như thế nào. Trải nghiệm này chưa thể chấp nhận được.

Cần tổ chức lại thông tin cho dễ đọc, làm nổi bật đúng nội dung quan trọng và thể hiện một **student journey hoàn chỉnh**: nhìn vào phải nhận ra hành trình và vấn đề của học viên.

### 7.19. Áp dụng trên toàn website

Nghiên cứu toàn bộ yêu cầu và điều chỉnh cách hiển thị ở **tất cả các trang, cột và bảng thông tin** theo cùng định hướng. Các yêu cầu bảng bên dưới là tham khảo cụ thể; ngoài ra, hãy chủ động đề xuất cách cải thiện và trao đổi những ý tưởng của bạn.

## 8. Tab Học viên

### 8.1. Bộ lọc và trạng thái thu gọn/mở rộng

Áp dụng bộ lọc ở mục 6. Khi chọn bộ lọc, **giữ nguyên trạng thái thu gọn/mở rộng của từng lớp**, chỉ lọc lại danh sách theo điều kiện đã chọn; không reset trạng thái giao diện. Áp dụng nguyên tắc tương tác này nhất quán trên website.

### 8.2. Chuyển chi nhánh

Với Quản trị hệ thống hoặc người có quyền tương ứng, thêm thanh tab phụ phía trên để chuyển giữa các chi nhánh; bên dưới hiển thị danh sách như bình thường.

### 8.3. Thanh lớp

Căn phải các badge và sử dụng các dạng badge khác nhau theo thiết kế đã chốt trước đây.

### 8.4. Bảng học viên khi mở rộng lớp

Sắp xếp các cột:

**Học viên · Target · Ngày thi · OVR MT gần nhất · Listening · Reading · Speaking · Writing 1 · Writing 2 · Trạng thái · Việc cần làm.**

Quy tắc cho **6 cột điểm** — OVR và 5 cột kỹ năng:

- Hiển thị điểm MT, có chỉ báo tăng/giảm cạnh điểm.
- Badge điểm MT dùng màu đỏ/xanh.
- Bỏ phần điểm GV đánh giá đặt cạnh điểm MT, dấu phân cách so sánh và ô “--” dành cho đánh giá chưa có. Đánh giá của GV thực hiện theo mục 7.17.

**Trạng thái:** thể hiện thông tin cần lưu ý, ví dụ **Đúng tiến độ**, **SOS 1/2/3 hiện tại**, **5 case chưa hoàn thành**.

**Việc cần làm:**

- Dùng badge ngắn gọn, chỉ hiển thị công việc đúng trách nhiệm của người xem.
- Màu sắc phải hợp lý và đồng bộ với các trang khác; nếu chưa có hệ màu phù hợp, dùng cùng một tông màu chung.
- Nếu cột hẹp, xếp badge thành chồng; các nội dung còn lại căn giữa theo chiều cao của hàng.

Hãy góp ý về thông tin quan trọng cần bổ sung, điểm cần lưu ý và nguy cơ bảng quá dày, đặc biệt ở cột Việc cần làm.

### 8.5. Giải thích tiêu đề cột

Khi rê chuột một lúc lên tiêu đề, hiển thị tooltip nhỏ giải thích ngắn gọn, dễ hiểu. Tránh ngôn ngữ cứng nhắc; giúp người dùng hiểu chữ viết tắt và ý nghĩa của thông tin trong cột.

### 8.6. Trang chi tiết lớp và học viên

Overhaul toàn bộ theo định hướng trên. Hãy đề xuất thiết kế thực tế, dễ dùng, trực quan, gọn mắt; tránh thông tin thừa và ưu tiên làm nổi bật thông tin quan trọng. Tôi chưa có thiết kế cụ thể, cần bạn chủ động đóng góp ý tưởng.

## 9. Tab Tổng quan — đổi “Việc của tôi” thành “Toàn cảnh công việc”

### 9.1. “Xác nhận đã trao đổi”

Theo hướng mới, tôi cho rằng **“Xác nhận đã trao đổi”** cùng tầng và thuộc **“Kết quả sau hỗ trợ”**. Hãy kiểm tra nhận định này; nếu đúng, bỏ phần riêng đó.

### 9.2. Đổi “Chi nhánh đang tắc ở đâu” thành “Việc cần lưu ý”

Đưa bảng xuống dưới dãy ô thông tin và cho phép thu gọn/mở rộng.

**Khi xem tất cả chi nhánh:**

- Chỉ Quản trị hệ thống hoặc người được cấp quyền mới thấy.
- Mỗi hàng tổng hợp theo **chi nhánh**, không liệt kê từng lớp.
- **Hàng cuối** là tổng toàn bộ dữ liệu theo cột. Áp dụng tương tự với bảng theo GV.

**Khi chọn một chi nhánh — tương tự góc nhìn Quản lý CN:**

- Hiển thị tổng dữ liệu toàn chi nhánh ở **hàng đầu**.
- Bên dưới chia thành **Normal** và **FT**, mặc định thu gọn. Mỗi hàng nhóm có tổng dữ liệu của nhóm; mở rộng mới thấy từng lớp.
- Với bảng GV, chọn chi nhánh mới hiển thị danh sách GV tại chi nhánh đó và số liệu tổng tương ứng ở hàng đầu.

**Sắp xếp:** bấm tiêu đề cột để sắp xếp từ cao xuống thấp, bấm lại để đảo chiều. Hàng tổng chi nhánh luôn cố định ở đầu, không bị sắp xếp theo.

**Các cột của bảng lớp:**

**Lớp · Sĩ số · HV cần hỗ trợ · Case · Thiếu phương án · Quá hạn cập nhật case · Đề xuất chờ duyệt.**

- **HV cần hỗ trợ:** đếm số học viên; một học viên có nhiều case vẫn chỉ tính một lần.
- **Case:** tổng số case.
- **Đề xuất chờ duyệt:** số phương án GV đề xuất để giải quyết case, đang chờ Quản lý duyệt.
- **Quá hạn cập nhật case:** đã quá thời hạn theo dõi việc xử lý nhưng chưa có cập nhật tình hình, kết quả.

**Các cột của bảng GV:**

**Giáo viên · MT chưa nhập · MT quá hạn nhập · Case · Thiếu phương án · Quá hạn cập nhật case · Đề xuất chờ duyệt.**

- **Case:** số case đang phụ trách.
- **Phạm vi số liệu:** các cột chỉ tính dữ liệu của GV tại **chi nhánh đang xem**.
- Ví dụ: GV A dạy **3 lớp ở Monbay** và **2 lớp ở Cẩm Phả**. Khi xem Monbay, GV A xuất hiện với số case chỉ thuộc 3 lớp tại Monbay. Khi chuyển sang Cẩm Phả, GV A tiếp tục xuất hiện nhưng số case chỉ thuộc 2 lớp tại Cẩm Phả. Các chỉ số khác cũng giới hạn theo chi nhánh tương ứng.

**Điều hướng từ số liệu:** bấm một con số phải đưa người dùng đến đúng hàng công việc tương ứng. Nếu nội dung ở trang khác, chuyển đến đúng trang và bộ lọc tương ứng.

Ví dụ: bấm số **Case của Monbay** → danh sách lớp Monbay → lọc học viên có case, giữ trạng thái giao diện như mục 8.1.

**Tooltip:** rê chuột một lúc lên tiêu đề cột để hiện giải thích ngắn gọn, dễ hiểu về nội dung hoặc chữ viết tắt.

## 10. Đổi “Tình hình chung” thành “Thực trạng”

### 10.1. Bộ lọc — ảnh 1

- Bỏ bộ lọc **“Đầu mục”**, thay bằng bộ lọc loại lớp **Normal/FT**.
- Chọn loại lớp trước, sau đó mới hiện bộ lọc **“Kỹ năng”**, đồng thời đổi tên bộ lọc này thành **“Cụ thể”**.
- Trong “Cụ thể”, xếp các mục kỹ năng trước, sau đó đến các vấn đề về ý thức.
- Bỏ phần **“Cụ thể”** đang nằm riêng bên dưới vì rối và không cần thiết.

### 10.2. Góc nhìn mặc định — ảnh 2

- Quản trị hệ thống cần góc nhìn tổng hợp nhiều chi nhánh.
- Quản lý CN khi mở **Thực trạng** phải vào thẳng góc nhìn **theo lớp**, như ảnh 3; không cần bấm thêm vào bảng để mở danh sách lớp.
- Trong bảng theo lớp, đặt hàng **“Cả chi nhánh”** ở đầu.
- Bấm tên lớp để mở trực tiếp trang chi tiết lớp đó.

### 10.3. Lỗi chuyển chi nhánh và số liệu — ảnh 3

- Sửa lỗi chọn Monbay nhưng giao diện không thay đổi.
- Làm rõ ý nghĩa số liệu. Hiện có trường hợp sĩ số lớp là 8 nhưng số ca SOS lớn hơn 8 khiến tôi khó hiểu; cần rà soát cùng việc reset dữ liệu ở mục 2.

### 10.4. Tên bảng case

Đổi tên bảng **“Vấn đề”** bên dưới thành **“Vấn đề - Case”**.

### 10.5. Hai chế độ xem

Thực trạng gồm:

- Bảng tổng hợp **chi nhánh/lớp** như hiện tại.
- Bảng tổng hợp **theo tuần**, tương tự phần đang có ở trang Báo cáo tuần.

Hãy đề xuất cách chuyển giữa hai chế độ: thanh tab, slider hoặc cách trình bày phù hợp.

### 10.6. Bảng tổng hợp chi nhánh/lớp

Áp dụng các cơ chế của bảng công việc ở mục 9: phân biệt góc nhìn Quản trị hệ thống và Quản lý CN; tổng dữ liệu ở hàng đầu; sắp xếp theo cột; nhóm Normal/FT có thể thu gọn/mở rộng cho Quản lý CN; bấm số liệu để đến đúng nội dung cần xem.

Các cột của chế độ **“Tất cả”**:

**Chi nhánh/Lớp · Case · SOS 3 · SOS 2 · SOS 1 · L · R · W1 · W2 · S · Ý thức · Đang xử lý · Thiếu phương án · Quá hạn cập nhật · Chờ duyệt.**

- Cột đầu là **Chi nhánh** với Quản trị hệ thống, **Lớp** với Quản lý CN.
- Các cột kỹ năng và Ý thức đếm số case theo từng mục.
- Case **Pronunciation của lớp FOU** được tổng hợp vào **S**.
- Case **Prep Writing của lớp Normal** được tổng hợp vào **W2**.
- Từ bộ cột “Tất cả”, giảm và chọn cột cần thiết cho từng chế độ: **Mặc định**, **SOS**, **Cụ thể** — case theo kỹ năng và ý thức, **Cần chú ý**.

### 10.7. Bảng tổng hợp theo tuần

Áp dụng các cơ chế liên quan ở mục 10.6, với điều chỉnh:

- Không cần sắp xếp theo cột hoặc thu gọn/mở rộng theo lớp vì bảng chỉ xem theo tuần.
- Thay bằng nhóm **theo tháng**, có thể thu gọn/mở rộng; hàng tháng hiển thị tổng dữ liệu tháng.
- Không bắt buộc điều hướng từ số liệu vì khó lọc đủ ngữ cảnh. Nếu có thể mở đúng dữ liệu — ví dụ danh sách học viên SOS 2 ở một tuần cụ thể — hãy triển khai.

Các cột:

**Tuần · Lượt MT · Đạt · SOS 1 · SOS 2 · SOS 3 · Case · Đang xử lý · Thiếu phương án · Chờ duyệt.**

Khoảng thời gian: **4 tuần, 8 tuần, 12 tuần gần nhất và 6 tháng gần nhất**.

## 11. Thống nhất thuật ngữ và ngôn ngữ giao diện

“Vấn đề” và “case” cùng nghĩa trong hệ thống này. Ưu tiên **“case”**, lựa chọn vị trí phù hợp cho từng cách gọi.

Đổi nút **“+ Nội dung cần hỗ trợ”** ở tab Học viên thành **“+ Case”**.

Rà soát toàn bộ nhãn, nội dung lưu ý và hướng dẫn trên website để thống nhất cách gọi, tránh gây nhầm lẫn. Không chỉ chuẩn hóa “case/vấn đề”, mà cả những thuật ngữ khác. Ngôn ngữ cần rõ ràng, tự nhiên, nhất quán và dễ hiểu.

## 12. Báo cáo tuần

Tạm thời bỏ phần **Báo cáo tuần**; chưa cần thiết ở giai đoạn này, sẽ cập nhật sau.

---

Các tham chiếu đến ảnh 1–5, tài liệu và prompt trước được giữ nguyên. Nếu chưa có hoặc chưa đọc được những nguồn này, hãy hỏi lại tôi thay vì tự đoán nội dung.
