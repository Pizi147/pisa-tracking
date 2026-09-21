# BUSINESS RULE UPDATE — ACADEMIC CASE & DISCIPLINE / BEHAVIOR MANAGEMENT

> **IMPORTANT CONTEXT**
>
> Hệ thống hiện tại đang được xây dựng dựa trên **business rules cũ** mà chúng ta đã thống nhất trước đây, khoảng một ngày trước.
>
> Tuy nhiên, tôi vừa review lại toàn bộ logic liên quan đến **SOS / Case / Phương án / Vi phạm / Theo dõi xử lý** và quyết định thay đổi đáng kể mô hình vận hành.
>
> Vì vậy:
>
> **Hãy coi toàn bộ nội dung trong tài liệu này là BUSINESS RULES MỚI và là source of truth mới nhất.**
>
> Nếu logic/code hiện tại xung đột với nội dung dưới đây thì **ưu tiên business rules mới**, không cố giữ backward compatibility về mặt nghiệp vụ chỉ vì code cũ đã tồn tại.
>
> Tuy nhiên, hãy tận dụng lại cấu trúc, component, data model hoặc UI hiện tại nếu chúng vẫn hợp lý. Không cần đập đi xây lại một cách máy móc.

---

# 1. Mục tiêu của lần refactor này

Mục tiêu chính là làm hệ thống:

- đơn giản hơn;
- practical hơn;
- dễ hiểu với giáo viên;
- ít thao tác;
- ít status/deadline không cần thiết;
- dễ audit lịch sử;
- đúng bản chất nghiệp vụ hơn.

Điểm quan trọng nhất là phải tách rõ hai hệ hoàn toàn khác nhau:

## Học thuật
Dùng **Case Management** để theo dõi tiến trình xử lý một vấn đề học thuật theo thời gian.

Flow bản chất:

**Vấn đề học thuật → Case → Phương án → Theo dõi tiến trình → Kết quả → Đóng Case**

## Ý thức / Vi phạm
Không cần quản lý như Academic Case.

Mục tiêu chính là:

**GV ghi nhận vi phạm → GVCN tổng hợp → chọn/gộp vi phạm → thực hiện Biện pháp xử lý → lưu xác nhận/bằng chứng → lịch sử/thống kê**

Không cố ép cả hai hệ dùng chung một workflow.

---

# 2. HỌC THUẬT — GIỮ CASE MANAGEMENT

Academic Case vẫn là đối tượng dùng để theo dõi một vấn đề học thuật trong một khoảng thời gian.

Academic Case không chỉ dùng để ghi nhận rằng học sinh có vấn đề, mà phải giúp trả lời được:

- vấn đề là gì;
- nguyên nhân là gì;
- đang áp dụng phương án nào;
- tiến triển qua từng tuần ra sao;
- phương án có thay đổi hay không;
- cuối cùng vấn đề có được giải quyết hay không.

---

# 3. SOS Học thuật

## 3.1. SOS là gì?

SOS là một **tín hiệu** phát sinh khi kết quả **Mock Test không đạt mục tiêu**.

SOS chưa phải Academic Case.

SOS chỉ báo rằng:

> Có một kết quả bất thường / không đạt mục tiêu cần giáo viên xác minh nguyên nhân.

---

## 3.2. Deadline của SOS

Sau khi SOS xuất hiện:

- GVBM có tối đa **3 ngày** để xác nhận nguyên nhân.

Deadline 3 ngày này chỉ áp dụng cho việc:

> **xác nhận nguyên nhân của SOS**

Không được hiểu rằng trong 3 ngày đó bắt buộc phải hoàn thành cả phương án Academic Case.

---

## 3.3. Sau khi xác nhận SOS

Sau khi GVBM xác nhận nguyên nhân:

### Trường hợp A — cần tiếp tục theo dõi
- tạo Academic Case mới;
- hoặc gắn SOS vào Academic Case đang mở nếu cùng vấn đề.

### Trường hợp B — không cần Case
- đóng SOS;
- ghi rõ lý do.

Ví dụ:
- dữ liệu Mock Test có vấn đề;
- học sinh có lý do đặc biệt;
- vấn đề chỉ là tình huống đơn lẻ;
- không cần theo dõi dài hạn.

---

# 4. GV có thể tạo Academic Case trực tiếp

Không phải mọi Academic Case đều phải bắt đầu từ SOS.

Nếu GVBM trong quá trình dạy phát hiện học sinh có vấn đề học thuật cần theo dõi, giáo viên được phép:

> **Tạo Academic Case trực tiếp**

Không cần tạo SOS giả trước.

Ví dụ:

- học sinh liên tục không hiểu bài;
- kỹ năng Writing tụt rõ rệt;
- nền tảng Grammar quá yếu;
- Speaking có vấn đề kéo dài;
- khả năng tiếp thu bất thường;
- kết quả trên lớp cho thấy cần can thiệp dù chưa có SOS từ Mock Test.

---

# 5. Logic gộp Academic Case mới

Không tiếp tục dùng rule cũ kiểu:

> “Nếu phát sinh trong 3 ngày thì gộp vào cùng Case, từ ngày thứ 4 thì tạo Case mới.”

Rule này không còn phù hợp với mục tiêu theo dõi tiến trình dài hạn.

## Rule mới

Nếu học sinh:

- đã có Academic Case đang mở;
- và vấn đề mới thuộc cùng môn / kỹ năng / vấn đề cốt lõi;

thì:

> **gắn tín hiệu / SOS / thông tin mới vào Academic Case hiện tại**

Không tạo thêm Case chỉ vì đã qua vài ngày.

---

## 5.1. Khi nào tạo Academic Case mới?

Chỉ tạo Case mới khi:

- đây là một vấn đề khác;
- hoặc Academic Case cũ đã đóng và vấn đề sau đó tái diễn;
- hoặc về mặt chuyên môn thực sự cần tách thành một vấn đề độc lập.

Mục tiêu là tránh việc một vấn đề kéo dài 4 tuần lại bị chia thành 4–5 Case nhỏ, làm mất tính liên tục của tiến trình.

---

# 6. Deadline tạo Phương án cho Academic Case

Sau khi Academic Case được tạo:

- **Case Bình thường:** phải có phương án trong **5 ngày**
- **Case Gấp:** phải có phương án trong **3 ngày**

Deadline tính từ ngày **Academic Case được tạo**.

Cần phân biệt rõ:

- **SOS: 3 ngày để xác nhận nguyên nhân**
- **Academic Case: 3/5 ngày để có phương án**

Đây là hai deadline cho hai mục đích khác nhau.

---

# 7. Phương án Học thuật

Phương án Học thuật là kế hoạch can thiệp để xử lý vấn đề của Academic Case.

Phương án có thể:

- được giữ nguyên;
- điều chỉnh;
- bổ sung;
- thay thế;
- kết thúc khi không còn phù hợp.

Không coi Phương án là một record bất biến.

Cần giữ lịch sử thay đổi để audit được:

- phương án ban đầu là gì;
- đã thay đổi khi nào;
- vì sao thay đổi;
- phương án hiện tại là gì.

---

# 8. Theo dõi Academic Case

Sau khi có phương án:

- cập nhật tiến trình **mỗi Chủ nhật**

Mỗi lần cập nhật nên ngắn gọn và practical, tập trung vào:

- kết quả hiện tại;
- tiến triển;
- vấn đề còn tồn tại;
- giữ nguyên / điều chỉnh / thay phương án;
- ghi chú cần thiết.

Không cần biến weekly update thành một form quá dài.

---

# 9. Timeline của Academic Case

Academic Case cần giữ đầy đủ lịch sử:

- SOS liên quan;
- nguyên nhân;
- ngày tạo Case;
- mức độ Case: Bình thường / Gấp;
- deadline phương án;
- phương án ban đầu;
- các lần điều chỉnh phương án;
- các weekly updates;
- dữ liệu / kết quả liên quan;
- ghi chú;
- kết quả cuối cùng;
- thời điểm đóng Case.

Mục tiêu là khi mở một Academic Case, người dùng phải hiểu được toàn bộ quá trình từ lúc phát hiện vấn đề đến lúc kết thúc.

---

# 10. Đóng Academic Case

Academic Case chỉ đóng khi:

- vấn đề đã được xử lý;
- học sinh đã cải thiện đủ;
- không còn cần theo dõi;
- hoặc có lý do nghiệp vụ rõ ràng khác.

Không đóng Case chỉ vì hết một deadline hành chính.

---

# 11. Ý THỨC / VI PHẠM — BỎ MÔ HÌNH CASE CŨ

Đây là thay đổi lớn.

Logic Ý thức hiện tại có thể đang được xây dựng theo kiểu:

**Vi phạm → Case → Nguyên nhân → Phương án → Deadline → Complete Case**

Không tiếp tục dùng mô hình này.

Ý thức không cần quản lý giống Academic Case.

---

# 12. Mục tiêu mới của phần Ý thức

Phần Ý thức chỉ cần giúp hệ thống:

1. ghi lại học sinh đã vi phạm gì;
2. biết vi phạm xảy ra bao nhiêu lần;
3. tổng hợp các vi phạm;
4. cho GVCN lựa chọn các Biện pháp xử lý phù hợp;
5. lưu lại các lần trao đổi / meeting / report / thư cảnh cáo / đình chỉ;
6. lưu ngày thực hiện;
7. lưu ghi chú;
8. lưu file/link bằng chứng khi cần;
9. thống kê được đã xử lý bao nhiêu lần;
10. audit được lịch sử.

Không cần ép mọi vi phạm phải trở thành một Case.

---

# 13. Violation Records — Ghi nhận vi phạm

Tất cả giáo viên đều được phép ghi nhận vi phạm của học sinh.

Mỗi vi phạm là một record độc lập.

Tối thiểu gồm:

- học sinh;
- ngày xảy ra;
- phân loại;
- mô tả;
- giáo viên ghi nhận;
- bằng chứng / link / file nếu có;
- trạng thái hiệu lực.

---

# 14. Phân loại Violation

Có thể gồm:

- Chuyên cần
- BTVN
- Thái độ / hành vi
- Kỷ luật lớp học
- Khác

Có thể tận dụng category hiện tại nếu phù hợp.

Không cần tạo Case riêng theo từng category.

---

# 15. Báo cáo của GV có thể sai

Đây là rule quan trọng.

Ví dụ:

- GV ghi nhận HS chưa nộp bài;
- sau đó phát hiện HS đã nộp nhưng GV bỏ sót.

Do đó cần hỗ trợ:

- sửa record;
- đánh dấu **Không chính xác / Hủy ghi nhận / Không còn hiệu lực**;
- ghi lý do;
- giữ lịch sử thay đổi nếu phù hợp.

Violation đã được xác định là sai:

- không tính vào thống kê vi phạm chính thức;
- không nên bị xóa vật lý khỏi lịch sử nếu có thể giữ audit trail.

---

# 16. Không tạo Case Ý thức theo từng vi phạm

Không cần:

- mỗi category một Case;
- mỗi môn một Case;
- mỗi giáo viên một Case;
- mỗi ngày một Case;
- mỗi nhóm vi phạm một Case.

Thay vào đó:

> GVCN có một khu vực tổng hợp toàn bộ Violation Records của học sinh.

UI có thể group theo category hoặc thời gian để dễ nhìn, nhưng đó chỉ là cách hiển thị.

Không được hiểu rằng mỗi group là một Case.

---

# 17. Biện pháp xử lý

Thay cho tên cũ **“Phương án kỷ luật”**, dùng tên:

> **Biện pháp xử lý**

Tên này phù hợp hơn vì bao gồm cả biện pháp nhẹ lẫn nặng.

---

# 18. Danh sách Biện pháp xử lý

Theo mức độ tương đối từ nhẹ đến nặng:

1. GV trao đổi ngắn với HS
2. GV meeting với HS
3. Report cho gia đình
4. Thư cảnh cáo lần 1
5. CX / GĐCN meeting với HS / PH
6. Thư cảnh cáo lần 2
7. Đình chỉ học
8. Thư cảnh cáo lần 3
9. Khác

---

# 19. Context về các role khác

Trong workflow thực tế của tổ chức:

- một số bước có thể kéo theo CS/TVV trao đổi với gia đình;
- một số bước có thể cần CX/GĐCN;
- các role khác có thể thực hiện phần việc bên ngoài hệ thống.

Những thông tin này chỉ là **context để hiểu workflow tổ chức**.

Không cần biến chúng thành task hoặc workflow riêng trong module này nếu chúng không thuộc phạm vi đang làm.

---

# 20. Không có thứ tự xử lý cứng

Danh sách Biện pháp xử lý không phải một workflow bắt buộc.

Không có rule:

> Trao đổi → Meeting → Report → Warning → Đình chỉ

Một học sinh có vấn đề nghiêm trọng có thể đi thẳng tới biện pháp nặng hơn.

Ví dụ:

- có thể Report ngay;
- có thể Meeting ngay;
- có thể dùng một biện pháp nặng hơn nếu tình huống nghiêm trọng.

---

# 21. Ngoại lệ: Thư cảnh cáo phải đúng thứ tự

Đây là rule cứng duy nhất về trình tự.

Phải đúng:

- Thư cảnh cáo lần 1
- Thư cảnh cáo lần 2
- Thư cảnh cáo lần 3

Không cho phép:

- tạo / xác nhận Thư cảnh cáo lần 2 nếu chưa có lần 1 đã thực hiện;
- tạo / xác nhận Thư cảnh cáo lần 3 nếu chưa có lần 2 đã thực hiện.

Các Biện pháp xử lý khác không cần tuân theo chuỗi cứng.

---

# 22. Một Biện pháp có thể chứa nhiều Violation

Một Biện pháp xử lý có thể gắn với nhiều vi phạm khác nhau.

Không yêu cầu:

- cùng category;
- cùng môn;
- cùng giáo viên;
- cùng ngày.

Ví dụ:

Học sinh A có:

- thiếu BTVN Writing;
- thiếu BTVN Reading;
- thiếu BTVN Listening;
- đi muộn 2 lần ở hai môn khác nhau;

GVCN có thể gom tất cả vào:

> **1 Report cho gia đình**

---

# 23. Một nhóm Violation có thể có nhiều Biện pháp xử lý

Không dùng quan hệ:

> 1 nhóm lỗi = 1 Biện pháp

Cùng một nhóm vi phạm có thể được xử lý bằng nhiều Biện pháp.

Ví dụ:

- GV meeting với HS;
- Report cho gia đình;
- Thư cảnh cáo lần 1;

có thể được thực hiện cùng lúc hoặc gần nhau và cùng liên quan tới các lỗi giống nhau.

---

# 24. Data relationship của Violation và Biện pháp

Cần hỗ trợ quan hệ:

> **many-to-many**

Tức là:

- một Violation có thể gắn với nhiều Biện pháp xử lý;
- một Biện pháp xử lý có thể chứa nhiều Violation.

Đây là business rule quan trọng, không nên implement theo kiểu one-to-one hoặc one-to-many đơn giản.

---

# 25. Biện pháp có thể thay đổi trước khi thực hiện

Một số Biện pháp xử lý bên ngoài có thể mất khoảng **3–5 ngày** mới thực hiện được.

Trong thời gian đó có thể xảy ra:

- phát sinh thêm Violation;
- GVCN muốn gộp thêm Violation mới vào cùng Report;
- phát hiện một Violation là sai;
- cần bỏ một Violation khỏi Biện pháp;
- cần chỉnh nội dung;
- cần thay đổi phạm vi xử lý.

Do đó Biện pháp xử lý không nên bị khóa ngay từ lúc tạo.

---

# 26. Trạng thái tối thiểu của Biện pháp xử lý

Tối thiểu cần hai trạng thái:

## Đang chuẩn bị

Cho phép:

- thêm Violation;
- bỏ Violation;
- sửa ghi chú;
- sửa nội dung;
- thay đổi thông tin liên quan;
- điều chỉnh phạm vi xử lý.

## Đã thực hiện

Khi xác nhận đã thực hiện:

- lưu thông tin thực tế;
- giữ snapshot lịch sử;
- audit được Biện pháp đã thực hiện với những Violation nào.

---

# 27. Xác nhận Biện pháp đã thực hiện

Không chỉ dùng một checkbox “Done”.

Khi GVCN xác nhận Biện pháp đã được thực hiện, cần lưu tối thiểu:

- loại Biện pháp;
- ngày thực hiện thực tế;
- người thực hiện;
- ghi chú / mô tả;
- danh sách Violation liên quan;
- link / file bằng chứng nếu cần.

---

# 28. Thông tin tối thiểu theo từng Biện pháp

## GV trao đổi ngắn với HS
Bắt buộc:
- ngày thực hiện;
- ghi chú ngắn.

## GV meeting với HS
Bắt buộc:
- ngày meeting;
- nội dung / ghi chú.

## Report cho gia đình
Bắt buộc:
- ngày report;
- nội dung tóm tắt.

Link/file có thể optional.

## Thư cảnh cáo
Bắt buộc:
- ngày gửi;
- lý do / nội dung;
- file hoặc link thư.

## CX / GĐCN meeting với HS / PH
Bắt buộc:
- ngày meeting;
- ghi chú;
- người tham gia nếu cần.

## Đình chỉ học
Bắt buộc:
- ngày;
- lý do;
- bằng chứng / quyết định nếu cần.

## Khác
Cho phép:
- tên biện pháp;
- ngày;
- mô tả;
- bằng chứng nếu có.

---

# 29. Không ép GVCN phải xử lý mọi Violation ngay

Không cần tạo deadline cứng cho từng Violation.

Không cần:

- mọi Violation phải có Biện pháp;
- mọi Violation phải được xử lý trong X ngày;
- auto tạo Case;
- auto tạo Biện pháp.

Một số vi phạm nhỏ có thể chỉ cần theo dõi.

---

# 30. Cảnh báo 5 ngày

Tuy nhiên cần một reminder đơn giản.

Rule:

> Nếu kể từ Biện pháp xử lý gần nhất, học sinh đã phát sinh Violation mới và Violation cũ nhất trong nhóm chưa được xử lý đã tồn tại quá **5 ngày**, website cần cảnh báo GVCN.

Ví dụ:

> ⚠ 4 vi phạm mới chưa được xử lý — vi phạm cũ nhất: 6 ngày trước

Mục đích chỉ là nhắc.

Không:

- auto tạo Case;
- auto tạo Biện pháp;
- coi đây là workflow failure nghiêm trọng;
- bắt buộc phải xử lý từng Violation.

---

# 31. Cách hiểu trạng thái của Violation

Một Violation có thể hiển thị các trạng thái UI như:

- Chưa xử lý
- Đang nằm trong Biện pháp đang chuẩn bị
- Đã được xử lý
- Không còn hiệu lực / Sai

Đây là trạng thái hiển thị để người dùng dễ hiểu.

---

# 32. Một Violation đã xử lý vẫn phải giữ lịch sử

Ví dụ:

Violation:
> Không làm BTVN — 12/09

Sau đó được gắn vào:

- Report gia đình — 18/09
- Thư cảnh cáo lần 1 — 18/09

Khi mở Violation đó, phải thấy được các Biện pháp liên quan.

Không được coi “Đã xử lý” là xóa hoặc ẩn khỏi lịch sử.

---

# 33. UI đề xuất cho Ý thức

GVCN nên có ít nhất ba khu vực chính.

---

## 33.1. Vi phạm mới / chưa xử lý

Hiển thị:

- ngày;
- category;
- mô tả;
- GV ghi nhận;
- status;
- warning nếu quá 5 ngày.

Cho phép tick nhiều Violation.

Có nút:

> **Tạo Biện pháp xử lý**

---

## 33.2. Biện pháp đang chuẩn bị

Hiển thị:

- loại Biện pháp;
- ngày tạo;
- các Violation liên quan;
- ghi chú;
- người phụ trách;
- status.

Cho phép:

- thêm Violation;
- bỏ Violation;
- chỉnh sửa;
- xác nhận đã thực hiện.

---

## 33.3. Lịch sử xử lý

Ví dụ:

- 18/09 — Report gia đình — 5 Violations
- 10/09 — Meeting HS — 2 Violations
- 01/09 — Thư cảnh cáo lần 1 — 6 Violations

Cho phép mở chi tiết để xem:

- nội dung;
- ngày;
- người thực hiện;
- bằng chứng;
- Violation liên quan.

---

# 34. Dashboard / thống kê Ý thức

Số liệu phải được tính tự động từ dữ liệu thật.

Không bắt GVCN nhập số thủ công.

Có thể thống kê:

## Violation
- tổng số Violation;
- số theo category;
- số theo thời gian;
- số chưa xử lý;
- số đã xử lý;
- số bị hủy / không chính xác.

## Biện pháp xử lý
- số lần trao đổi ngắn;
- số lần meeting;
- số lần Report gia đình;
- số Thư cảnh cáo lần 1;
- số Thư cảnh cáo lần 2;
- số Thư cảnh cáo lần 3;
- số lần đình chỉ;
- số biện pháp khác.

---

# 35. Tránh duplicate Violation nếu hợp lý

Vì tất cả GV đều có thể ghi nhận Violation, có thể xảy ra việc cùng một tình huống bị ghi hai lần.

Không nên auto merge cứng vì có thể merge nhầm.

Có thể dùng cảnh báo mềm:

> Hôm nay học sinh này đã có một Violation tương tự trong cùng category. Bạn vẫn muốn tạo mới?

Cho phép:
- xem record hiện có;
- vẫn tạo record mới.

Không được tự động xóa hoặc merge dữ liệu nếu chưa chắc chắn.

---

# 36. Migration từ logic cũ

Đây là phần rất quan trọng.

Hãy review code/data model hiện tại và tìm các phần đang dựa trên business rules cũ, ví dụ:

- Case Ý thức;
- merge Case theo 3 ngày;
- deadline Case Ý thức;
- Phương án Ý thức giống Academic;
- Complete Case Ý thức;
- reopen Case Ý thức;
- rule GVCN / GVBM ai được đóng Case;
- status cũ;
- deadline cũ;
- logic một Case chỉ thuộc một category;
- logic one-to-one giữa Case và Phương án;
- các logic khác không còn phù hợp.

Những logic này **không còn mặc định là đúng**.

---

# 37. Nguyên tắc xử lý conflict

Nếu code hiện tại xung đột với tài liệu này:

> **ưu tiên business rules mới trong tài liệu này**

Không cố giữ logic cũ chỉ vì nó đã được implement.

---

# 38. Không cần đập bỏ toàn bộ code

Nếu một phần hiện tại vẫn hữu ích, ví dụ:

- component timeline;
- form upload file;
- audit log;
- permission;
- filter;
- table;
- modal;
- history UI;

thì có thể tái sử dụng.

Mục tiêu là refactor business logic, không phải rewrite toàn bộ ứng dụng bằng mọi giá.

---

# 39. Migration dữ liệu cũ

Nếu dữ liệu cũ có thể migrate hợp lý:

- Case Ý thức cũ → Violation Records;
- Phương án Ý thức cũ → Biện pháp xử lý;
- lịch sử xử lý → Action History;

thì hãy đề xuất cách migrate.

Nếu data model cũ quá lệch với business rules mới, có thể:

> reset/reseed demo data

để phản ánh đúng các tình huống thực tế mới.

Demo data nên có nhiều trường hợp khác nhau, ví dụ:

- Violation đúng;
- Violation bị xác nhận sai;
- nhiều GV cùng ghi Violation;
- nhiều Violation khác category;
- một Report gom nhiều Violation;
- một nhóm Violation có nhiều Biện pháp;
- Biện pháp đang chuẩn bị được thêm Violation mới;
- Violation bị bỏ khỏi Biện pháp;
- Warning Letter 1 → 2 → 3 đúng thứ tự;
- cảnh báo quá 5 ngày;
- Academic Case Bình thường;
- Academic Case Gấp;
- SOS được đóng không tạo Case;
- SOS được gắn vào Case đang mở;
- GV tạo Academic Case trực tiếp.

---

# 40. UX principles

Ưu tiên:

1. practical;
2. intuitive;
3. ít thao tác;
4. dễ scan;
5. dễ audit;
6. không tạo quá nhiều Case;
7. không mất lịch sử;
8. không ép người dùng qua nhiều modal không cần thiết;
9. tránh status/deadline thừa;
10. tận dụng bulk actions khi phù hợp;
11. mobile/desktop đều dễ dùng nếu hệ thống hiện tại hỗ trợ;
12. không biến workflow ngoài phạm vi hiện tại thành task trong hệ thống.

---

# 41. Source of truth sau refactor

Sau khi hoàn thành, cần hiểu hệ thống theo hai mô hình sau.

---

## HỌC THUẬT

**Mock Test không đạt mục tiêu**
→ SOS
→ 3 ngày xác nhận nguyên nhân
→ nếu cần:
- tạo Academic Case;
- hoặc gắn vào Case đang mở
→ Case Bình thường: 5 ngày có phương án
→ Case Gấp: 3 ngày có phương án
→ cập nhật mỗi Chủ nhật
→ điều chỉnh phương án nếu cần
→ đóng Case khi không còn cần theo dõi.

Ngoài ra:

**GV phát hiện vấn đề học thuật trực tiếp**
→ tạo Academic Case
→ 3/5 ngày có phương án
→ weekly tracking
→ close.

---

## Ý THỨC

**GV ghi Violation**
→ Violation xuất hiện trong hồ sơ học sinh
→ GVCN theo dõi / lọc / chọn nhiều Violation
→ tạo một hoặc nhiều Biện pháp xử lý
→ khi Biện pháp còn “Đang chuẩn bị” có thể thêm/bớt Violation
→ khi thực hiện:
- xác nhận ngày;
- ghi nội dung;
- lưu bằng chứng nếu cần
→ lưu lịch sử
→ hệ thống thống kê.

Nếu Violation mới tồn tại quá 5 ngày mà chưa có Biện pháp xử lý mới:

→ cảnh báo GVCN.

---

# 42. Yêu cầu cuối cùng cho implementation

Hãy:

1. review lại logic hiện tại;
2. chỉ ra những phần nào đang conflict với business rules mới;
3. đề xuất cách refactor data model;
4. đề xuất workflow mới;
5. đề xuất UX practical nhất;
6. đề xuất migration cho dữ liệu cũ nếu cần;
7. tận dụng lại các component hiện tại nếu hợp lý;
8. loại bỏ các rule cũ không còn cần thiết;
9. tránh over-engineering;
10. không thay đổi các business rules mới trong tài liệu này.

Anh được khuyến khích chủ động đề xuất cải tiến nếu giúp hệ thống:

- practical hơn;
- intuitive hơn;
- ít thao tác hơn;
- dễ maintain hơn;
- dễ audit hơn.

Tuy nhiên, nếu đề xuất làm thay đổi business rule, hãy **nêu rõ đó là đề xuất riêng và không tự ý implement**.
