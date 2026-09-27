# YÊU CẦU CHỈNH SỬA VÀ NÂNG CẤP WEBSITE PISA TRACKING

Dưới đây là toàn bộ các yêu cầu cần rà soát, sửa lỗi và nâng cấp. Hãy đọc kỹ từng mục, giữ đúng các luật và workflow đã nêu, đồng thời đảm bảo giao diện và logic hệ thống nhất quán, trực quan và dễ sử dụng.

---

## 1. Lỗi khi tạo lớp

Hiện tại có trường hợp tạo lớp bị fail khi:
- Chọn **2 GVCN**; hoặc
- Không để **GVCN dạy bất kỳ lớp/kỹ năng nào**.

Khi lỗi xảy ra, lớp không hiển thị ở bất kỳ đâu, nhưng hệ thống lại không cho tạo lớp mới cùng tên vì báo trùng tên.

Cần sửa lỗi này để không còn tình trạng lớp đã được tạo trong dữ liệu nhưng không thể nhìn thấy hoặc quản lý ở bất kỳ mục nào.

---

## 2. Chuẩn hóa tên lớp khi tạo lớp mới

Khi tạo lớp mới:

- Bỏ dấu `-` trong tên lớp.
- Không dùng `CP-` nữa, chỉ dùng `CP `, tức là **CP + dấu cách**.
- Để đồng bộ tên lớp, thêm mục **chọn kiểu lớp**.

Quy tắc đặt tên:

- Với lớp **FT**, phần `FT` luôn được hệ thống xác định sẵn, để tên lớp có dạng uniform:  
  **CN FT #**
- Với lớp **normal**, GV chọn một trong 3 phương án:
  - FOU
  - BE
  - ELE

Sau khi chọn, hệ thống tự xác định phần tương ứng trong tên lớp. Không để GV tự nhập thêm `FT`, `FOU`, `BE`, `ELE` vào tên lớp nữa, nhằm đảm bảo tên lớp được đồng bộ.

---

## 3. Bổ sung loại lớp FT RF

Khi tạo lớp FT mới, ngoài **LT1** và **LT2**, bổ sung thêm một loại lớp:

- **RF (Refire)**

Tên lớp uniform của loại này là:

**CN FT RF #**

---

## 4. Luật phân công GV khi tạo lớp

Cần có luật rõ ràng:

- **KHÔNG ĐƯỢC CÓ 2 GV CÙNG ĐẢM NHIỆM 1 NHIỆM VỤ**, bất kể đó là:
  - GVCN; hay
  - Một kỹ năng.
- Giữ nguyên luật: **GVCN phải dạy ít nhất 1 kỹ năng**.

---

## 5. Thêm học viên — Ảnh 1

### 5.1. Sửa giao diện các thông tin phụ

Các thông tin phụ hiện tại đang làm hỏng giao diện và chèn vào các ô.

Cần có cách thể hiện khác để các ô không bị chèn, giao diện gọn và dễ đọc hơn.

### 5.2. Bổ sung cột thông tin

Bổ sung:

- Một cột **Thời gian thi dự kiến** đặt bên cạnh cột **Target** ở cuối.
- Một cột **Email học sinh** đặt sau cột **Ngày sinh**.

Tiếp tục hỗ trợ **paste dữ liệu từ Excel** như hiện tại.

Nếu dữ liệu nào không có thì có thể để trống.

Chỉ các thông tin sau là **BẮT BUỘC**:

1. Họ tên.
2. Email.
3. Tuần bắt đầu.
   - Nếu không chỉnh sửa gì thì mặc định là tuần bắt đầu học của lớp.

Kể cả các thông tin bắt buộc này, GVCN vẫn có thể sửa lại về sau nếu nhập sai.

### 5.3. Định dạng ngày tháng

Không cần phần chọn **“định dạng ngày trong dữ liệu”** nữa.

Mặc định ngày tháng là:

`dd/mm/yyyy`

Riêng cột **Thời gian thi dự kiến** cần cho phép 2 định dạng vì có HS mới chỉ xác định được tháng thi, chưa có ngày cụ thể:

- `dd/mm/yyyy`
- `mm/yyyy`

### 5.4. Tuần bắt đầu học

Tuần bắt đầu học phải **mặc định ngay lập tức theo tuần của lớp**, không cần yêu cầu nhập lại ở bước thêm học viên.

Ở phần thông tin của từng học viên, hãy giữ cách nhập giống box **“Tuần bắt đầu học”** hiện có:

- Có thể tự nhập.
- Có nút hình lịch bên cạnh để chọn ngày.

---

## 6. Đổi tên website

Đổi tên website thành:

**Pisa Tracking**

---

## 7. Chế độ sáng/tối

Thêm một nút nhỏ ở góc trên website để chuyển đổi giữa:

- Giao diện sáng.
- Giao diện tối.

---

## 8. Lựa chọn “Khác” trên toàn website

Rà soát tất cả các trang.

Bất kể ở đâu có phần chọn phân loại, nếu người dùng chọn **“Khác”**, phải hiện ngay một **text box nhỏ** để nhập nội dung cụ thể.

---

## 9. Chuẩn hóa toàn bộ trường nhập ngày/tháng/thời gian

Rà soát **TẤT CẢ CÁC TRANG, TẤT CẢ CÁC PANEL**.

Bất kỳ chỗ nào có phần nhập ngày/tháng/thời gian đều phải cho phép:

- Type trực tiếp ngày hợp lệ bằng số.
- Chọn bằng calendar.

Quy tắc hiển thị giữ đúng ngữ cảnh:

- Phần cần hiển thị theo **ngày** thì vẫn hiển thị ngày.
- Phần cần hiển thị theo **tuần** thì vẫn hiển thị tuần.

Những phần đặc biệt đã có luật riêng từ trước thì **phải hỏi tôi trước khi thay đổi**.

---

## 10. Chuẩn hóa trường nhập tên người thực hiện

Rà soát **TẤT CẢ CÁC TRANG, TẤT CẢ CÁC PANEL**.

Bất kỳ chỗ nào có phần nhập **tên người thực hiện công việc** đều nên dùng dạng **search box nhỏ**, giống một số khu vực đang làm tốt hiện tại.

Tuy nhiên, người dùng vẫn phải có thể nhập tên một người **không có trong danh sách tài khoản của hệ thống**.

---

# 11. Học viên & Lớp

## 11.1. Tab “HV & Lớp”

Khi bấm vào tab **“HV & Lớp”**:

- Không tự động expand một lớp ngay lập tức.
- Hàng tiêu đề như:
  - HV
  - Kết quả gần nhất
  - ...

phải được giữ cố định/cuộn theo khi kéo xuống để dễ quan sát.

## 11.2. Danh sách HV ở giao diện chính — Ảnh 2

Phần thông tin dưới **điểm gần nhất** hiện chưa gọn.

Cần trình bày ngắn gọn hơn và cho phép xuống thêm 1 dòng nếu cần.

Ví dụ với FT:

> MT3 - 7.0 - 3/4 kỹ năng có điểm  
> Không đạt: L R W

Ví dụ với lớp thường:

> Cuối khóa - 2/4 kỹ năng có điểm  
> Không đạt: L R

Ngoài phần này, các khu vực khác cũng nên làm thông tin **nổi bật hơn một chút**, vì giao diện hiện đang hơi đơn điệu.

Đồng thời, hãy **đề xuất xem có nên bổ sung thêm cột thông tin nào hay không**, nhưng không được làm giao diện bị ngợp.

## 11.3. Giao diện hồ sơ lớp

### 11.3.1. Phần “Học Viên” — góc nhìn “Cần hỗ trợ”

Góc nhìn **“Cần hỗ trợ”** nên được expand rộng hơn và chia thành **4 hàng tương ứng 4 kỹ năng**.

Mỗi hàng cần có:

- Thông tin cơ bản về case.
- Phương án đang thực hiện.

**Hãy mockup phần này cho tôi.**

### 11.3.2. Phần “Vi phạm xử lý” — Ảnh 3

Bộ lọc hiện tại đang bị lỗi và gần như không có giá trị sử dụng.

Cần sửa lại.

### 11.3.3. Phần “Phân tích lớp”

Phần kết quả đạt MT theo từng kỹ năng hiện tại khá ổn, nhưng phần expand ra chưa hợp lý.

Hãy tham khảo giao diện **bảng phân tích trong phần Tổng quan** để khi expand có thể nhìn rõ:

- Có bao nhiêu HV gặp vấn đề.
- Có bao nhiêu case ở kỹ năng đó.
- Có bao nhiêu case đang theo dõi.
- Có bao nhiêu case đã có phương án.
- Với các case đã xong: có bao nhiêu case thành công.

Không cần hiển thị **“không thành công”**.

Phần **hiệu quả phương án** cũng cần thể hiện theo hướng:

- Đang thực hiện.
- Đã thực hiện.
- Thành công.
- Tỷ lệ thành công.

## 11.4. Giao diện vi phạm và phương án xử lý vi phạm

Giao diện phần **Vi phạm** và **Phương án xử lý vi phạm** nên tương tự giao diện ở bên ngoài hồ sơ lớp.

Nên có **2 panel đặt cạnh nhau**:

- Một bên: Phương án.
- Một bên: Các vi phạm.

Hiện tại mỗi nội dung đang thành từng hàng riêng, rất khó quan sát.

---

# 12. Hồ sơ HV — Mockup

## 12.1. Lỗi SOS khi chọn “Không cần theo dõi” — Ảnh 4

Khi một trường hợp SOS được đưa về kỹ năng:

- Nếu bấm **“Không cần theo dõi”**, nút **“Xác nhận nguyên nhân”** vẫn còn.
- Nếu bấm cả hai, giao diện lỗi như trong ảnh.

Đây chắc chắn là lỗi và cần sửa ngay.

## 12.2. Phân biệt Case và Phương án

Hiện tại giao diện giữa **Case** và **Phương án** rất khó phân biệt vì các hàng có cùng màu; khác biệt gần như chỉ là nút “play” ở đầu phương án.

Cần có cách thể hiện rõ ràng hơn.

Case cũng nên có thể **collapse/expand** để xem phương án.

Tuy nhiên, khi collapse, các thông tin ở **hàng tiêu đề của case** vẫn phải được giữ lại.

## 12.3. Workflow khi GVBM xác nhận nguyên nhân

Khi GVBM bấm **Xác nhận nguyên nhân**, case phải được mở ngay và panel hiển thị giống như khi mở một case bình thường, nhưng có các khác biệt sau:

### 12.3.1. Không có phần chọn case đã xong từ trước

Không hiển thị lựa chọn này.

### 12.3.2. Không cho chọn kỹ năng

Không được chọn kỹ năng vì đây đã là case của kỹ năng đó.

Vẫn phải chọn:

- Phân loại nguyên nhân.
- Mức độ gấp.

như bình thường.

### 12.3.3. Tên case mặc định

Tên case mặc định là:

**[kỹ năng] không đạt**

GV có thể sửa phần tên này.

Tuy nhiên, tên case luôn phải có 2 phần cố định:

- `MT#` ở đầu — cần làm nổi bật hơn một chút.
- Badge `SOS` ở sau.

### 12.3.4. Ngày bắt đầu theo dõi

Phần **Bắt đầu theo dõi** phải chọn **ngày hôm nay**, vì đây không phải case đã xong.

### 12.3.5. Bằng chứng

Case không cần bằng chứng hoặc file gì cả.

Chỉ cần có **mô tả**.

### 12.3.6. Phương án mặc định theo quy chế SOS

Từ giờ, **phương án tự sinh theo quy chế SOS là KHÔNG ĐƯỢC BỎ, PHẢI LÀM THEO**.

Nếu GV muốn thêm phương án khác thì có thể thêm theo quy trình bình thường.

Sau khi bấm **Tạo case**, hệ thống phải hiển thị ngay **phương án mặc định theo đúng quy chế SOS**.

## 12.4. Workflow khi GVBM chọn “Không cần theo dõi”

Khi GVBM bấm **“Không cần theo dõi”**:

1. Phải ghi rõ lý do cụ thể. Cách nhập lý do hiện tại khá ổn.
2. Hệ thống tự động chuyển vấn đề này cho **QL**.
3. QL phải xác nhận trong vòng **5 ngày làm việc**, tính từ ngày GV bắt đầu xác nhận không theo dõi.
4. Nếu QL duyệt:
   - Case bị hủy.
   - Phương án cũng bị hủy.
5. Tuy nhiên, hệ thống vẫn phải lưu lịch sử rõ ràng rằng:
   - GV đã quyết định không theo dõi.
   - Lý do cụ thể là gì.

## 12.5. Phần tạo case đã xong từ trước

### 12.5.1. Lỗi nhập tên phương án

Hiện tại khi nhập text vào tên phương án, chỉ cần gõ 1 chữ là bị bật ra ngoài, không thể gõ tiếp, giống như hệ thống tự bấm “Xong”.

Cần sửa lỗi này.

### 12.5.2. Validation và thông báo lỗi

Panel này còn nhiều lỗi và chưa giải thích rõ người dùng cần điền như thế nào.

Ví dụ:

- Tôi nhập một vài chữ ở mô tả.
- Tôi nhập một vài chữ ở ghi chú kết luận.
- Khi bấm lưu, hệ thống vẫn báo thiếu nhưng không nói rõ thiếu gì.

Cần báo lỗi chính xác và intuitive hơn.

Ví dụ: nếu mô tả hoặc ghi chú chưa đủ yêu cầu, text box tương ứng có thể chuyển viền đỏ khi người dùng click sang phần khác.

### 12.5.3. Bổ sung kết quả phương án

Cần có một chỗ để điền **Kết quả phương án**.

Hiện tại ở Ảnh 4, phần kết quả phương án đang không có nội dung gì.

### 12.5.4. Đồng bộ giao diện các nút ở KQ PA

Ảnh 4 không thể hiện rõ phần này, nhưng giao diện các nút ở **KQ PA** đang thiếu đồng bộ.

Các nút như:

- Mở case.
- Ghi kết quả.
- ...

đều nên nằm **phía trên phần text phụ bên dưới**.

Hiện tại nút **Ghi kết quả** bị đẩy sang phải, nằm cạnh dòng text, cách thể hiện này không ổn.

---

## 12.6. Phần Ý thức phối hợp

### 12.6.1. Rút gọn workflow xử lý vi phạm

Phần xử lý vi phạm hiện tại khá tốt, nhưng workflow vẫn cần gọn nhẹ hơn.

Không phải lúc nào HS có vấn đề cũng cần:

- Report; hoặc
- Có biện pháp xử lý vi phạm cụ thể.

Trong một số trường hợp, chỉ cần **ghi nhận/xác nhận** là đủ.

Tuy nhiên, không được để GV chỉ ghi nhận mãi nếu HS vi phạm quá nhiều.

Luật cần có:

- Nếu HS có **>= 3 lỗi**, bất kể lỗi gì trong **2 tuần**, GV không thể tiếp tục chỉ “ghi nhận”, mà phải có **phương án xử lý**.
- Phần này **tính trong tuần** như yêu cầu hiện tại.
- Nếu GV thấy lỗi nghiêm trọng thì có thể xử lý ngay, không cần chờ đủ số lỗi.

Ví dụ:

- Thứ 2: HS mắc 1 lỗi → GVCN ghi nhận.
- Thứ 7: HS mắc thêm 1 lỗi → GVCN ghi nhận.
- Chủ nhật tuần sau: HS mắc thêm 1 lỗi → không còn nút ghi nhận nữa, chỉ còn **Xác nhận xử lý**, và đây là bước bắt buộc.

Nếu để quá lâu, cụ thể **hơn 5 ngày**, mà chưa có phương án xử lý được thực hiện thì:

- Đánh dấu quá hạn.
- Báo về cho QL.

### 12.6.2. Workflow “Xác nhận xử lý”

Phần **Ý thức → Xử lý vi phạm** cần đổi workflow.

Hiện tại phải:

> Tổng hợp lỗi → ghi phương án → bắt đầu → xác nhận

Từ giờ hãy **skip** các bước trung gian và chuyển thẳng thành **Xác nhận xử lý**.

Panel chỉ cần hiển thị các thông tin tương tự **bảng xác nhận phương án xử lý hiện tại**.

Yêu cầu:

- Không bắt buộc có file đính kèm.
- Bắt buộc phải có mô tả.
- Không còn chức năng **“Xóa PA”** nữa.
- Bây giờ chỉ cần bấm vào và xác nhận.

### 12.6.3. Phân biệt “Ghi nhận” và “Xác nhận xử lý”

Các trường hợp **ghi nhận thông thường** phải được thể hiện khác biệt rõ ràng với các trường hợp đã có **xác nhận xử lý cụ thể**.

### 12.6.4. Rút gọn các mức xử lý vi phạm

Các cách xử lý vi phạm hiện tại cần rút gọn theo đúng flow:

**Report 1 → Report 2 → Thư cảnh cáo 1 → Report 4 + Meeting CX/GĐCN → Thư cảnh cáo 2**

Ngoài ra, các biện pháp sau chỉ được thực hiện khi có **xác nhận từ QL**:

- Meeting CX/GĐCN.
- Thư cảnh cáo 3.
- Đình chỉ học tạm thời.

QL cần duyệt trong vòng **5 ngày**.

Ngoại lệ:

- Trường hợp **Report 4**, vì đây là quy chế nên **Meeting CX/GĐCN luôn phải được đính kèm trong quy trình**.

Mỗi lần trình các biện pháp cần QL duyệt phải có:

- Mô tả rõ ràng.
- Bằng chứng rõ ràng.

Còn lại, bỏ:

- 2 loại meeting hiện tại.
- Trao đổi ngắn với HV.

---

# 13. Test / Mock Test

## 13.1. Kiểm tra luật thêm dấu “-” khi dời lịch

Rà soát kỹ xem luật thêm dấu `-` hiện đang hoạt động đúng chưa.

Luật:

- Dời kỹ năng đó 1 tuần: được.
- Đến tuần 2 vẫn tiếp tục dời: phải có QL duyệt.

Hiện tại tôi chưa thấy demo thể hiện đúng phần này.

## 13.2. Tự động tạo lịch MT mặc định cho FT và FT RF

Theo đúng quy chế Mock Test, tính từ khi HS FT bắt đầu học:

### FT thông thường

Mặc định có 3 MT:

- MT1: tuần 6.
- MT2: tuần 12.
- MT3: tuần 16.

### FT RF

Mặc định có 2 MT:

- MT1: tuần 4.
- MT2: tuần 8.

Nếu cần thay đổi, QL sẽ sửa sau.

Hiện tại tôi chưa thấy phần này được tích hợp đầy đủ.

### Trường hợp học sinh cũ

Sẽ có rất nhiều HS đã học từ trước khi website được đưa vào sử dụng, thậm chí đã học hơn 20 tuần.

Những HS này **vẫn phải được tạo mặc định các MT theo đúng lộ trình**.

Nếu một MT đã nằm trong quá khứ thì:

- GVCN được quyền nhập đủ điểm tất cả các kỹ năng.
- QL cũng được quyền nhập đủ điểm tất cả các kỹ năng.

Mục tiêu là để hệ thống có đầy đủ dữ liệu lịch sử cụ thể cho HS.

## 13.3. Quy tắc đánh số MT theo lộ trình

Cần nhớ luật:

- Mỗi lần chuyển sang một **lộ trình khác** thì reset MT về **MT1** đối với FT.
- Không được add MT3, MT4 nếu chưa có MT1, MT2.
- MT đầu tiên được ghi nhận luôn phải là **MT1**.
- Sau đó tăng dần theo thứ tự.

## 13.4. Nâng cấp hoàn toàn panel xếp lịch MT

Panel xếp lịch cần được nâng cấp theo hướng sau:

### Bộ lọc/lựa chọn

Cho phép:

- Chọn CN.
- Chọn lớp.
- Tìm HS bằng thanh search.

Những HS đã được chọn phải được đẩy lên đầu danh sách.

### Chọn đợt MT

Cho phép chọn đợt MT, mở rộng số đợt có thể lên đến **MT8**.

Khi chọn một đợt MT:

- Mặc định áp dụng đợt đó cho **tất cả HS đang được chọn**.
- Nếu HS đã làm hoặc bị trùng đợt đó, hệ thống tự chuyển HS sang **MT kế tiếp**.

Nên có một hàng cạnh tên HS để liệt kê:

- MT đã làm.
- MT chưa làm.

QL có thể tick trực tiếp để thao tác thuận tiện hơn.

### Khi QL vẫn muốn ép HS vào đúng đợt MT bị trùng

Nếu QL vẫn muốn ép MT vào tuần/đợt đó, cần có **pop-up panel** cho biết:

- HS đã mock những kỹ năng nào ở đợt MT đó.

### Lịch 4 kỹ năng

Mặc định:

- 4 kỹ năng cùng MT trong **1 tuần**.
- Mặc định là **tuần tiếp theo**.

Thiết kế:

- Thanh chọn **tuần chung** đặt phía trên.
- Bên dưới là lịch riêng của 4 kỹ năng để có thể customize nếu cần.

## 13.5. Nhận xét khi chấm W và S

Từ giờ, khi chấm:

- Writing.
- Speaking.

cần có thêm một **text box nhận xét chung** ở phía dưới.

Phần nhận xét này **không bắt buộc**.

Riêng Speaking cần thêm phần nhập:

- **Tên GV chấm**.

## 13.6. Panel thêm hoạt động — Ảnh 5

Panel thêm hoạt động hiện tại cần được làm gọn hơn và dùng thuật ngữ hợp lý hơn.

Các thuật ngữ hiện đang dài dòng, ví dụ:

- “Lùi ngày chấm”.
- “Lùi lịch mock”.
- “Hủy kết quả”.

Phần **Lịch sử** hiện tại có thể giữ, nhưng cần thể hiện tốt hơn.

Tôi muốn các chức năng này được **tích hợp trực tiếp vào dashboard của kế hoạch MT** theo cách thông minh, gọn và dễ sử dụng hơn.

## 13.7. Làm nổi bật điểm Writing tổng — Ảnh 5

Điểm **Writing tổng** đáng lẽ phải là thông tin nổi bật nhưng hiện tại lại bị chìm.

Cần làm nổi bật phần này hơn.

## 13.8. Nâng cấp giao diện hồ sơ Mock — Ảnh 5

Phần **Hồ sơ Mock** hiện tại còn kém intuitive hơn cả màn hình chính.

Cần chỉnh theo hướng:

- Hiển thị con số điểm rõ ràng, nổi bật.
- Writing có 4 ô điểm theo 4 tiêu chí, thể hiện rõ ràng.
- Speaking có 4 ô điểm theo 4 tiêu chí, thể hiện rõ ràng.
- Nếu đúng role và đúng GVBM của kỹ năng đó thì GV có thể **nhập điểm trực tiếp, dễ dàng ngay tại đây**.

Có thể thiết kế khá giống **dashboard của lịch test**, vì cách đó tiện lợi và dễ sử dụng hơn nhiều.

## 13.9. Xuất Excel kết quả Mock Test

Thêm một nút cho phép xuất file Excel kết quả Mock Test.

Cần hỗ trợ lọc/xuất linh hoạt theo:

- Chi nhánh.
- Tuần.
- Lớp.
- Thời gian.
- Kết hợp nhiều điều kiện.

Ví dụ:

- Chỉ chi nhánh này trong những tuần này.
- Chỉ lớp này trong khoảng thời gian này.
- Các tổ hợp lọc tương tự.

**Hãy đề xuất cách thiết kế và workflow phù hợp.**

---

# 14. Làm nổi bật thông tin quan trọng qua UX/UI

Website cần làm nổi bật hơn một số thông tin cần thiết qua UX/UI để user có thể:

- Theo dõi thông tin dễ hơn.
- Quan sát nhanh hơn.
- Không bị ngợp.
- Sử dụng giao diện gọn nhẹ và dễ chịu hơn.

---

# 15. Rà soát logic học sinh cũ, thông báo QL và workflow phối hợp

Hiện vẫn còn nhiều vấn đề logic cần đặc biệt chú ý và rà soát, nhất là khi nhập dữ liệu của **học sinh cũ**.

Ngoài ra, cần xem lại cách:

- Thông báo cho QL.
- Gửi yêu cầu QL duyệt.
- Yêu cầu QL cập nhật thông tin.
- Tạo task.
- Theo dõi task.
- Phối hợp giữa các phòng ban.
- Phối hợp công việc trên toàn chi nhánh.

Workflow cần được thể hiện:

- Rõ ràng.
- Chặt chẽ.
- Mạch lạc.
- Dễ hiểu.
- Dễ nhìn.

Đặc biệt, các phần task và các nội dung báo về cho QL để **duyệt/cập nhật thông tin** cần được thiết kế thực sự rõ ràng.

Hiện tại tôi vẫn chưa xác định được cách nào đủ gọn, dễ chịu và tích hợp hợp lý với các hình mẫu giao diện đang có.

**Hãy brainstorm và đưa ra đề xuất cho tôi.**

---

# 16. Lưu ý về model crosscheck

**Từ bây giờ không cần đổi model Fable Crosscheck. Nếu có chạy crosscheck, vẫn giữ Opus 5.5.**
