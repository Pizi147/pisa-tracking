# PISA CRM – PHẢN HỒI CUỐI: ĐIỀU CHỈNH MOCKUP, TINH GỌN UI VÀ HOÀN THIỆN WORKFLOW

> **Trạng thái:** Đã tích hợp 3 xác nhận cuối của người dùng (W1/W2; hạn Test; S Expert). Đây là tài liệu bổ sung cho Master Plan UX/UI hiện có, **không thay thế các quy tắc nghiệp vụ đã chốt trước đó**.
>
> **Phạm vi:** Hoàn thiện các hạng mục được nêu dưới đây và giữ nguyên những phần không bị góp ý. **Tạm hoãn triển khai Tutor**, chỉ lưu vào kế hoạch.

## I. NGUYÊN TẮC CHUNG TRƯỚC KHI TRIỂN KHAI

Đây là những phản hồi cuối cùng của tôi về bản thiết kế và mockup hiện tại.

**Những nội dung tôi không nhắc đến trong phản hồi này được xem là đã phê duyệt.** Không cần tiếp tục hỏi lại hoặc tự ý thay đổi những phần đó, trừ khi phát hiện lỗi nghiêm trọng, mâu thuẫn nghiệp vụ hoặc vấn đề ảnh hưởng trực tiếp đến chức năng.

Đối với những thay đổi nhỏ, **không cần làm lại mockup**. Nếu thực sự cần cập nhật mockup, hãy gộp các điều chỉnh nhỏ vào **một file mockup duy nhất**. Hãy làm đơn giản, tiết kiệm thời gian và token; chúng ta không còn nguồn lực cho nhiều vòng rà soát không cần thiết.

**Ưu tiên đặc biệt trong lúc code:** Giao diện hiện có quá nhiều text trình bày chung chung, quá plain, đơn điệu, thiếu phân cấp, đồng thời nhiều nội dung dàn trải và thừa thãi. Phải chủ động rà soát, rút gọn hoặc loại bỏ ngay trong quá trình triển khai, không đợi một vòng review khác.

### 1. Giảm tối đa text giải thích và thông tin không cần thiết

- Không tùy tiện đưa các đoạn text giải thích quy tắc, diễn giải workflow hoặc hướng dẫn dài lên giao diện chính.
- Những nội dung hướng dẫn/lưu ý không quan trọng hoặc không cần hiển thị liên tục hãy chuyển vào biểu tượng **“?”** hay phần hướng dẫn tương ứng.
- Thông tin chỉ dành cho quản trị viên website hoặc đội ngũ phát triển thì **không hiển thị** trên UI dành cho người dùng không cần biết.
- Rút ngắn hoặc bỏ những câu không giúp người dùng hiểu tình trạng hoặc hoàn thành công việc; không lặp nội dung ở nhiều chỗ.
- Ưu tiên nhãn ngắn gọn, tự nhiên, rõ ý, không biến trang thành manual.
- Vẫn giữ những thông tin thật sự cần để người dùng hiểu trạng thái, tránh sai sót hoặc làm đúng nghiệp vụ.

### 2. Cải thiện phân cấp và cách thể hiện thông tin

- Phân biệt rõ **nhãn / giá trị**, **thông tin chính / thông tin phụ**, **dữ liệu / thao tác**.
- Nhấn mạnh trường quan trọng bằng màu sắc, font weight, cỡ chữ, nhóm thông tin và khoảng cách một cách hợp lý.
- Dùng color coding nhất quán cho điểm, trạng thái và các dữ liệu cần nổi bật; không để mọi trường thông tin đều plain text như nhau.
- Rà soát tất cả các trang/panel có cách hiển thị tương tự; tránh lạm dụng badge hay màu mè quá mức.
- Ưu tiên sự rõ ràng và dễ nhìn hơn là thêm chi tiết trang trí.

### 3. Giao diện tối

Màu xanh ở dark mode hiện hơi ngả tím: **giảm nhẹ sắc tím và làm tối hơn một chút**; giữ đồng bộ ở các thành phần và bảo đảm khả năng đọc.

### 4. “Thi tháng này”, không phải “Thi tuần này”

Tôi đã nhầm trong góp ý trước. **Dữ liệu cần là “Thi tháng này”**. Rà soát tất cả trang, panel, chỉ số, bộ lọc và logic hiển thị liên quan để sửa đồng bộ; đây là **thi thật**, không phải Test/MT.

### 5. Tháng thi dự kiến phải kèm năm

Bất kỳ thông tin **tháng thi dự kiến** nào cũng cần thể hiện **tháng và năm** để tránh nhầm giữa các năm; áp dụng nhất quán trên mọi trang.

### 6. Màu SOS dễ phân biệt hơn

Tăng mức độ khác biệt giữa màu của các cấp SOS, bảo đảm nhận biết nhanh. Hiện tại **chưa cần dành quá nhiều nguồn lực riêng cho tối ưu color-blind accessibility**, nhưng không thay đổi logic phân loại SOS.

---

## II. TỔNG QUAN – VAI TRÒ TVV

Tổng quan TVV chỉ cần **ba nhóm chính**:

1. **Xử lý đúng hạn** (đổi từ “Báo đúng hạn”).
2. **Thi tháng này**.
3. **Chờ KQ / Lộ trình tiếp**.

Không tự thêm nhiều chỉ số hoặc lời giải thích thừa. Hiển thị số liệu rõ ràng, phân cấp tốt và đúng nghiệp vụ.

---

## III. TRANG CÔNG VIỆC

### 1. Làm nổi bật trường thông tin (Ảnh 1)

Thông tin hiện chỉ là plain text; khó phân biệt giá trị nào quan trọng. Sử dụng có chọn lọc **màu sắc, in đậm, kích thước, khoảng cách, phân nhóm**, làm rõ những điều cần chú ý. **Rà soát các chỗ tương tự trên mọi trang**, nhất là panel công việc TVV, không chỉ ở Ảnh 1.

### 2. Expand và chỉnh sửa Case ngay tại chỗ

- Cho người dùng nhấn vào **Case** để mở rộng và xem thông tin chi tiết ngay tại khu vực tương ứng.
- Hiển thị đủ thông tin cần thiết nhưng có phân cấp, không nhồi text.
- Cho sửa các trường mà vai trò được quyền chỉnh sửa, kể cả sau khi lưu; **ghi lịch sử thay đổi**.
- Những bước cần duyệt theo nghiệp vụ **vẫn phải duyệt**, không được bỏ qua.
- Hạn chế chuyển nhiều trang/panel chỉ để xem và sửa Case.

---

## IV. TRANG TEST

### 1. Hiển thị hạn chấm đúng ngày – **ĐÃ CHỐT**

Các cụm “Hạn tuần này” hoặc “Hạn tuần sau” trong mockup chỉ để minh họa. Giao diện thật phải hiển thị **ngày/tháng hạn thực tế**, ví dụ **`28/10`**. Không thêm thứ trong tuần, không cần giải thích quy tắc tính hạn ngay trên giao diện. Ngày hạn được xác định theo **quy tắc nghiệp vụ hiện hành** (ví dụ ngày thứ Tư tương ứng khi quy định hạn là thứ Tư).

### 2. Giữ những điểm tốt của Lịch Test và Kế hoạch Test cũ

Cấu trúc mới đang thay đổi quá nhiều. Tôi muốn UX/UI của **Lịch Test tuần** và **Kế hoạch Test** vẫn khá giống với hệ thống cũ vì hệ thống cũ giúp biết rõ:

- Học viên nào thực hiện Test.
- Ở tuần nào, kỹ năng nào, thuộc MT nào.
- Kế hoạch kiểm tra và điểm tương ứng.

Không thay những workflow cũ đang hữu ích chỉ để giao diện trông mới hơn.

### 3. Trả lại đúng tư duy **Lịch Test tuần** của phiên bản cũ

**Quan trọng về nghiệp vụ:** Lịch MT đi theo **lộ trình riêng của từng học viên**, không phụ thuộc vào “MT gần nhất của lớp” hoặc mặc định cả lớp cùng một MT. Trong một tuần cùng lớp có thể có người làm MT2, người làm MT1, người chỉ thi/test một kỹ năng; học viên không nhất thiết có cùng lịch hay cùng kỹ năng.

Do đó:

- Không lấy dữ liệu MT1/2/3/4 theo lớp làm cách tổ chức chính nếu khiến dữ liệu từng học viên sai hoặc khó hiểu.
- **Cho xem và sửa điểm ngay trên Lịch Test tuần**, theo quyền hạn và lịch sử chỉnh sửa.
- **Giữ bảng/danh sách điểm cụ thể của các học viên thực hiện Test trong tuần** để Admin dễ xem và tổng hợp kết quả theo tuần.
- Không được chỉ còn ba khung tổng quát mà mất danh sách điểm thực tế. Có ba khung cũng không có ý nghĩa nếu người dùng không biết từng học viên thi/test gì và đạt bao nhiêu.
- **Hàng lớp (hàng đầu của lớp)** chỉ cần chỉnh **gọn lại, đơn giản hơn**, không cần phức tạp hóa.
- Kết hợp ưu điểm của bố cục mới với workflow xem/sửa điểm theo tuần đang tốt ở bản cũ.
- Phần **Kế hoạch Test** cũng cần gần hệ thống cũ, hiển thị rõ **kỹ năng, tuần, tháng, năm** và các dữ liệu quan trọng.

### 4. Bổ sung **MT Speaking với Chuyên gia (S Expert / S Ex)** – **ĐÃ CHỐT PHẦN PHẠM VI**

- S Expert là **bài Speaking với chuyên gia bổ sung riêng cho từng học viên khi cần**, không phải học viên nào cũng có.
- **Chỉ Quản lý và Admin** được quyền thêm S Expert.
- S Expert **không mặc định thay thế** bài Speaking MT thông thường.
- Nghiên cứu cách hiển thị và quản lý S Expert trong Lịch Test/Kế hoạch Test, phân biệt rõ với MT Speaking thường; không làm sai workflow Speaking chéo.
- **Quy tắc chấm điểm, cách tính điểm hoặc tác động của điểm S Expert chưa được chốt**: ghi rõ thành hạng mục cần xác nhận riêng, **không tự suy diễn hoặc triển khai logic điểm chưa được duyệt**.

---

## V. HỒ SƠ LỚP

Đây là khu vực còn cần brainstorm về khả năng sử dụng thực tế, không chỉ về hình thức.

### 1. Phần W: bỏ nhãn/khu vực dư thừa, **vẫn giữ W1 và W2 riêng** – **ĐÃ CHỐT**

- Ẩn hoặc thiết kế lại **những nhãn/khu vực W chung đang thừa hoặc gây rối**.
- **W1 và W2 vẫn tách riêng**, không gộp thành một điểm hay xóa dữ liệu thành phần.
- Điểm **W và S** vẫn có thể nhấn để **xem điểm thành phần**, hiển thị gọn, rõ ràng, không cần chuyển trang.
- Thiết kế lại bố cục điểm cho cân đối và nhất quán, tránh lặp nhãn W gây khó nhìn.

### 2. Bỏ badge “Chưa đạt” khi đã là SOS

Nếu học viên đã có trạng thái **SOS** đại diện cho tình trạng đó, không thêm badge **“Chưa đạt”** để lặp ý. Giữ thông tin đủ rõ nhưng gọn.

### 3. Overhaul cột **Case + PA**

- Nhấn vào cột để thấy **danh sách Case** và **các PA gắn với từng Case**, nhận diện mối quan hệ rõ ràng.
- Phân nhóm, làm nổi bật đúng thông tin quan trọng, tránh các trường plain text dày đặc.
- Cho **expand** Case/PA để xem đủ chi tiết và sửa các dữ liệu được phép, tuân thủ lịch sử và quy trình duyệt.
- Ưu tiên tích hợp thao tác của **panel Công việc dành cho Case/PA ngay trên cùng trang** để workflow dễ hiểu, ít chuyển trang.

### 4. Xem lại line chart hành trình học viên

Tôi chưa hình dung line chart sẽ thể hiện hợp lý thế nào khi có cả **điểm MT** và **điểm Test trên lớp**, cùng những kỹ năng/tuần khác nhau.

Hãy brainstorm cách hiển thị rõ hành trình học tập: trục thời gian, loại điểm, kỹ năng, khoảng dữ liệu thiếu, tương tác xem chi tiết. Tránh biểu đồ quá nhiều đường, quá rối; nếu phương án khác tốt hơn thì đề xuất. **Không dựng chart chỉ để có chart.**

### 5. Giữ góp ý giáo viên, đổi tên

Phần góp ý GV **“Bài trên lớp”** vẫn phải giữ; đổi tên thành **“Tiến độ trên lớp”**. Sắp xếp gọn, rõ, dễ theo dõi.

### 6. Học các điểm tốt từ Hồ sơ học viên hiện tại (Ảnh 2)

Tham khảo:

- **Điểm số to, rõ**, nhấn để xem chi tiết.
- Phần **Case / Phương án** hiện tương đối ổn.
- Cố gắng tích hợp trực tiếp các thao tác từ panel Công việc của Case/PA vào cùng trang/hồ sơ sao cho dễ hiểu, ít bước.

Không cần sao chép nguyên xi; chỉ kế thừa những gì tốt và cải thiện.

### 7. Thanh Việc cần làm trên đầu

Hai công việc đứng cạnh nhau hiện khó phân biệt; thiết kế lại để làm rõ từng việc, trạng thái, điểm nhấn và thao tác, không làm thanh quá dày.

---

## VI. HỌC VIÊN & LỚP

### 1. Trang này phải khác Hồ sơ lớp về mục đích và cách hiển thị

Danh sách HV hiện gần như không khác Hồ sơ lớp. Hãy xây dựng cách tổ chức hợp lý cho vai trò **xem danh sách/lọc/tìm hành động**, không bê nguyên bảng của Hồ sơ lớp sang.

Đặc biệt chú ý hai cột bên phải **“Lịch thi”** và **“Việc”**. Tôi nghiêng về **giữ hai cột này tại Học viên & Lớp**, và thay đổi cách hiển thị trùng lặp trong **Hồ sơ lớp**. Cần đánh giá theo giá trị và mục đích của mỗi trang.

### 2. Các chế độ xem phải thực sự khác nhau

Nếu ba chế độ chỉ là ba biến thể của cùng một bảng, gần như không thay đổi thông tin, thì không có lý do tồn tại riêng.

- **Cần làm:** Có thể **bỏ** nếu không đem lại giá trị riêng; đánh giá liệu công việc sẽ hợp lý hơn khi xem trên trang Công việc hoặc khu vực liên quan.
- **SOS:** **Giữ lại**, làm lại để thông tin tập trung vào theo dõi SOS; tham khảo những ưu điểm của chế độ SOS cũ.
- Mỗi chế độ phải có trọng tâm thông tin đúng mục tiêu, thay vì chỉ thay bộ lọc trên cùng một bố cục.

### 3. **Bỏ checkbox cạnh tên học viên** – **ĐÃ CHỐT**

Tôi đã nhắc nhiều lần. Loại bỏ ô tick/checkbox cạnh tên học viên; tổ chức lại thao tác xuất Excel và chọn phạm vi dữ liệu cho phù hợp, không giữ cột checkbox khiến bảng dày/rối.

### 4. Lịch thi: phục hồi mockup cũ, có thể là **V4**

Phần **Lịch thi** trong mockup cũ tôi đã thấy ổn. Tìm lại đúng bản (có thể V4), kế thừa đầy đủ thông tin khi xếp lịch thi. Không tinh giản đến mức mất dữ liệu cần thiết. **Nếu không xác định được chính xác mockup nào**, hãy hỏi thay vì đoán.

---

## VII. HỒ SƠ GIÁO VIÊN (ẢNH 3)

### 1. Dải thông tin phía trên quá rối

Dải text về lớp đang dạy và thông tin tương tự cần **bỏ nếu không quan trọng** hoặc thiết kế lại cho rõ, cân đối, có nhấn mạnh các trường cần chú ý.

### 2. Bộ lọc thời gian tùy chọn hai mốc

Cho chọn **mốc bắt đầu và mốc kết thúc tùy ý** như các chỗ khác; **mặc định khoảng 1 tháng**. Không giới hạn cứng vào mốc sẵn có. Nếu dùng hệ thống lọc tuần chung, cần bảo đảm người dùng tự điều chỉnh được khoảng tương ứng.

### 3. Overhaul bảng Học thuật

Bảng hiện co rúm, mất cân đối; cột ngoài cùng quá rộng mà giá trị chưa rõ. Rà mục đích từng cột, phân bổ chiều rộng, căn chỉnh, loại bớt nội dung không cần; không đánh đổi khả năng đọc lấy bố cục nén.

### 4. **Không dùng “MT gần nhất của lớp”**

Dữ liệu phải đúng theo **lộ trình và MT của từng học viên**; không dùng MT gần nhất của lớp làm đại diện mặc định. Rà toàn bộ vị trí đang sử dụng cách tổng hợp sai này; nếu chưa rõ cách thay thế thì hỏi về nghiệp vụ.

### 5. Bỏ text box giải thích quy tắc

Bỏ các hộp text giải thích quy tắc khỏi UI chính. Nếu thật sự cần với người dùng, chuyển vào **“?”**; nếu chỉ dành cho nhà quản trị/lập trình viên thì không hiển thị.

### 6. Cải thiện phần Lớp đang dạy

Thiết kế rõ hơn, đẹp hơn, cân đối hơn, phân cấp được thông tin và không quá dài/dày.

### 7. Chủ động đề xuất thông tin cần thiết còn thiếu

Hồ sơ GV đang có nhiều thông tin nhưng có thể thiếu nội dung trọng tâm; xác định dữ liệu nên giữ, bỏ, bổ sung theo đúng mục đích theo dõi GV. Không thêm chỉ để cho đầy trang.

---

## VIII. TRANG PHÂN TÍCH

### 1. Khung thời gian **không được khóa cứng**

Bộ lọc theo định hướng đã chốt: **“Toàn bộ”** hoặc **“Chọn khoảng tuần”**. Khi chọn khoảng tuần, người dùng tự chọn **từ tuần nào đến tuần nào**, bất kể khoảng mặc định của từng bảng. Mặc định chỉ là giá trị chọn sẵn, **không phải giới hạn**.

### 2. Phân tích Giáo viên

- Đổi **“Quá hạn nay” → “Quá hạn”**.
- **Giữ “Đạt Target – Thi thật”**, đây là dữ liệu rất quan trọng; hiển thị trong bố cục gọn và rõ.
- Bảng đang **clipped**, lệch/chiều rộng không hợp lý và phải cuộn bất tiện: sửa căn chỉnh, phân bổ cột; không thu chữ quá nhỏ để tránh cuộn.
- **Bỏ “Xử lý vi phạm”** khỏi báo cáo phân tích GV (quá chuyên biệt ở đây); không xóa dữ liệu nghiệp vụ.
- **Bỏ chữ “Mẫu nhỏ”** khỏi giao diện.

### 3. Báo cáo Học viên: thay bảng “Kết quả theo lớp”

Bảng hiện gần như trùng với Tổng quan, ít giá trị phân tích. Hãy đề xuất **bảng/thể hiện khác có thông tin quan trọng hơn, tổng thể hơn và có ý nghĩa phân tích hơn**, không chỉ lặp một nhóm số liệu. Đưa ra phương án tốt, giải thích vì sao hữu ích.

---

## IX. TUTOR – **CHỈ ĐƯA VÀO PLAN, KHÔNG TRIỂN KHAI ĐỢT NÀY**

- Điểm đánh giá cần có **color coding**, phân biệt trực quan hơn, nhất quán với hệ thống.
- Ghi nhận các đề xuất cải thiện bộ lọc/bảng và UX Tutor vào kế hoạch cho đợt sau.
- **Tạm gác toàn bộ thay đổi liên quan đến Tutor**, không gộp vào những PR triển khai hiện tại.
- Có thể xem xét lại **tuần sau**, chưa chốt lịch chính xác.

---

## X. NGUYÊN TẮC TRIỂN KHAI CUỐI

1. **Những phần tôi không góp ý thêm coi như đã duyệt**; không tự ý đảo lại những quyết định khác.
2. Điều chỉnh nhỏ **không cần mockup riêng**; nếu cần thì **một file mockup chung**.
3. Ưu tiên tiết kiệm thời gian/token, tránh vòng brainstorm hoặc review lớn cho những phần đã ổn.
4. Khi code, **rút gọn text thừa**; đưa hướng dẫn ít quan trọng vào dấu **“?”**; bỏ thông tin chỉ quản trị web cần biết.
5. Làm nổi bật các trường thông tin thực sự quan trọng; tránh một màu/loạt plain text.
6. Không để bảng lệch cột, clipping, co rúm hay bố cục mất cân đối.
7. **Kế thừa những workflow cũ đang hoạt động tốt**, đặc biệt hệ thống Test, lịch MT theo cá nhân, xem/sửa điểm theo tuần.
8. Không tự thay đổi nghiệp vụ chấm Test, Speaking chéo, duyệt, lịch MT hoặc tính điểm chỉ để phù hợp mockup.
9. Đơn giản hóa tương tác nhưng **không bỏ các dữ liệu người dùng thật sự cần**.
10. Đồng bộ cách hiển thị điểm, lớp, học viên, Case, PA, trạng thái trên toàn website.
11. Không thêm panel, nút, text box, bộ lọc nếu không có giá trị thực tế.
12. **Tutor hoãn sang đợt sau**.
13. Áp dụng nguyên tắc chỉnh sửa đã chốt: **vai trò có quyền có thể sửa dữ liệu sau khi lưu, có lịch sử; những bước duyệt bắt buộc vẫn được giữ**.
14. Khi thấy chỗ chưa rõ có thể thay đổi **nghiệp vụ**, hãy hỏi đúng điểm đó; không cần hỏi lại các chi tiết thuần UI đã trao quyền chủ động.

### Ba xác nhận cuối đã được tích hợp

| Nội dung | Quyết định cuối cùng |
|---|---|
| Hiển thị W trong Hồ sơ lớp | **Ẩn nhãn/khu vực W dư thừa; giữ W1, W2 riêng; điểm W/S có thể nhấn xem thành phần.** |
| Hiển thị hạn Test | **Chỉ ngày/tháng của hạn thực tế**, ví dụ `28/10`. |
| S Expert | **Bài Speaking chuyên gia bổ sung riêng cho từng HV**, chỉ QL/Admin được thêm, **không mặc định thay thế Speaking MT thường**; quy tắc chấm/tính điểm sẽ chốt riêng. |

**MỤC TIÊU CUỐI CÙNG:** Website phải gọn hơn, rõ hơn, dễ nhìn hơn và dễ sử dụng hơn, trong khi vẫn giữ các chức năng và workflow cũ có giá trị. **Không kéo dài quá trình mockup/thảo luận nếu không cần; tập trung triển khai đúng những nội dung đã thống nhất theo plan hiện hành.**
