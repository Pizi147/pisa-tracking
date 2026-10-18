# PISA Tracking — Prompt tổng hợp overhaul toàn bộ website

**Bản cập nhật ngày 18/10/2026, đã bổ sung xác nhận cuối về câu 5–6: hiện Chốt lộ trình khi cần, giữ dải thống kê gọn và cách xem Theo đợt Test.**

**Bổ sung mới: C31 — xuất Excel danh sách học viên tùy nhu cầu, gồm tất cả học viên có SOS hoặc riêng SOS 3. Nhu cầu đã chốt; các bộ lọc, mẫu cột và thao tác cụ thể bên dưới là đề xuất GPT để Claude tiếp tục cải tiến.**

Tài liệu này thay thế các chỉ dẫn mâu thuẫn trong bản nhận xét OV-14 trước đó. Có thể gửi toàn bộ file cho Claude. Đây là bản tổng hợp yêu cầu, định hướng và đề xuất; không phải thông báo rằng website đã được sửa.

## 0. Chỉ dẫn trực tiếp cho Claude: quyền overhaul và cách đọc

**Chủ sản phẩm cho ChatGPT và Claude quyền tự do overhaul, thiết kế lại hoặc xây dựng lại TOÀN BỘ website: cấu trúc, điều hướng, workflow, từng trang, từng bảng, từng panel, từng nút, từng câu chữ và cách tổ chức mã nguồn. Không bị giới hạn trong ba mockup OV-14, không phải giữ một bố cục chỉ vì phiên bản cũ đã dùng nó.**

Hãy chủ động brainstorm, phản biện và đề xuất phương án tốt hơn. Nếu phải thay nhiều thứ để workflow thực sự đơn giản hơn thì cứ đề xuất rõ ràng và làm có hệ thống. Đừng chỉ sửa màu, khoảng cách hoặc vài nhãn rồi coi là overhaul. Cũng không phải viết lại mọi thứ chỉ để chứng minh đã overhaul: tái sử dụng phần tốt nếu nó phục vụ phương án mới.

**Quyền tự do này luôn đi cùng mục tiêu:** đơn giản, gọn, dễ đọc, dễ dùng, đúng nghiệp vụ, ít thao tác thừa; dữ liệu và lịch sử không bị mất. Những yêu cầu chủ sản phẩm chốt dưới đây là đầu bài cần đáp ứng. Các lựa chọn thiết kế nhỏ nên tự quyết; chỉ hỏi những điểm thật sự làm thay đổi ý nghĩa nghiệp vụ hoặc xung đột trực tiếp với yêu cầu chốt.

### Nhãn phân loại bắt buộc

| Nhãn | Ý nghĩa | Claude cần làm |
|---|---|---|
| **[CHỐT]** | Yêu cầu hoặc lựa chọn chủ sản phẩm đã nói rõ | Đưa vào phương án; không hỏi lại lựa chọn này |
| **[NHU CẦU CHỐT — CÁCH LÀM MỞ]** | Chủ sản phẩm đã xác định cần chức năng, chưa chốt vị trí/bố cục/cách vận hành chi tiết | Tự brainstorm và đề xuất cách làm tốt nhất |
| **[ĐỀ XUẤT GPT]** | Ý tưởng do ChatGPT bổ sung | Phản biện, cải tiến hoặc thay thế; không ghi thành quyết định của chủ sản phẩm |
| **[CẦN LÀM RÕ]** | Chưa đủ thông tin để quyết định một chi tiết quan trọng | Giải thích bằng ví dụ, đưa khuyến nghị và hỏi ngắn gọn |
| **[ĐÃ ĐỐI CHIẾU]** | Quan sát từ nguồn/ảnh đã xem | Dùng làm căn cứ, nhưng kiểm lại mã mới nhất trước khi sửa |

**Thứ tự ưu tiên:** phản hồi mới nhất của chủ sản phẩm → các quyết định cũ còn phù hợp → đề xuất GPT → bản mockup và nhận xét cũ. Không lấy câu đã bị thay thế trong tài liệu cũ để phủ nhận yêu cầu mới.

Các mục 1–8 chứa quyết định và yêu cầu mới. Mục 9–12 phát triển phương án. Mục 13 giải thích câu hỏi 5–6 và ghi nhận các lựa chọn đã chốt. Mục 14–16 là kiểm chứng, cách thực hiện và nguồn.

## 1. Những chỉ dẫn cũ đã bị thay thế

| Nội dung trước đây | Chỉ dẫn hiện có hiệu lực |
|---|---|
| Giữ nền tảng/cấu trúc như một giới hạn của đợt sửa | **Được overhaul toàn bộ**; không có giới hạn cố định về trang, panel, chữ hay kiến trúc |
| Nút Nhắc, Nhắc nhiều, gom nhắc theo GV | **Bỏ toàn bộ thao tác Nhắc thủ công.** Vấn đề cần xử lý được đẩy tự động vào Thông báo |
| Nút chữ “Vì sao?” | Dùng nút **`?`**, nội dung giải thích có phân cấp rõ |
| “Lớp có em bị bỏ sót” | **Lớp cần chú ý** |
| “Em bị bỏ sót” | **HV cần chú ý** |
| “Lớp nào tụt?” | **Test + SOS** |
| “PA có hiệu quả?” | **Hiệu quả PA** |
| “GV nào trễ chấm?” làm bảng chính | **Phân tích GV** dựa trên bảng phiên bản cũ; chấm đúng hạn chỉ là một phần |
| Báo cáo mặc định tuần vừa qua | **Hai tuần hoàn chỉnh vừa qua**, có bộ chọn khoảng thời gian |
| Phân tích chỉ chọn 4/8 tuần | Chọn tuần, từ tuần đến tuần và khoảng thời gian phù hợp; không giới hạn ở 4/8 tuần |
| Hồ sơ lớp gộp W1/W2 dưới W, chỉ giữ mốc mới nhất | **Hồ sơ lớp có OVR, L, R, W1, W2, S; không cần W tổng; hai hàng MT, hàng cũ ít nổi bật** |
| “Chưa lập PA” là nhãn thành phần đầu | **Case trống PA**; nhãn tổng vẫn **Case chưa chốt PA** |
| Khung “Đã thi – Chờ KQ” trên báo cáo | **Bỏ khỏi báo cáo**; không suy thành xoá toàn bộ nghiệp vụ sau thi |
| Số bấm được chỉ mở danh sách tham khảo | Mở **đúng dữ liệu + có khả năng làm việc tại chỗ** nếu người dùng có quyền |
| Chỉ chèn điểm từ Excel rồi nhập nhận xét riêng | Cần hỗ trợ **điểm và nhận xét đi thành từng cặp cột** |

## 2. Quyết định tổng thể về workflow và thao tác

### C01 — Quyền thay đổi toàn bộ

**[CHỐT]** Phạm vi overhaul là toàn bộ website, không chỉ các vùng của OV-14. Claude phải rà xuyên suốt để cùng một ý nghĩa có cùng cách hiển thị, một việc có cách làm nhất quán, không tồn tại nhiều đường thao tác lệch nhau.

### C02 — Bấm là tới đúng dữ liệu và đúng công việc

**[CHỐT]** Ở **mọi trang**, số liệu/nút có thể bấm phải dẫn đến đúng nội dung người dùng đang muốn xem hoặc xử lý:

1. Ưu tiên panel tại chỗ chứa **thông tin chi tiết dễ đọc và thao tác làm việc thực sự**.
2. Nếu panel chỉ thích hợp cho một phần việc, trình bày phần đó gọn gàng, có tối đa một bước rõ ràng để mở trang làm việc đầy đủ.
3. Nếu xử lý trong panel gây chật, phức tạp hoặc thêm tầng vô nghĩa, đưa thẳng đến **trang làm việc chuẩn của chức năng đó**, với đúng ngữ cảnh đã chọn.
4. Không đi qua trang danh sách trung gian rồi bắt chọn lại học viên, lớp, lượt, kỹ năng, thời gian hoặc người phụ trách.
5. Không làm panel chỉ để liệt kê tên khi mục đích là xử lý điểm, Case, PA, lịch hoặc thông tin học viên.

**Ngoại lệ có nghĩa:** `?` mở hướng dẫn; menu mở lựa chọn; bộ lọc đổi phạm vi. Không biến tất cả điều khiển thành panel. Người không có quyền sửa vẫn được xem theo quyền, không được cấp quyền mới chỉ vì panel có thể chứa nút làm việc.

### C03 — Không còn Nhắc thủ công

**[CHỐT]** Bỏ các nút `Nhắc`, `Nhắc GV`, `Nhắc GVCN`, `Nhắc tất cả`, nhắc hàng loạt và workflow phụ thuộc vào việc QL bấm nhắc. Có vấn đề cần xử lý thì hệ thống tự đẩy về **Thông báo**.

**[ĐỀ XUẤT GPT]** Thông báo và Công việc cùng tham chiếu một đối tượng nghiệp vụ. Bấm thông báo mở đúng việc tại chỗ hoặc trang chuẩn; không tạo thêm một “bản sao công việc”. Chống gửi trùng, gom nội dung liên quan, cập nhật khi việc đã xử lý. Đánh dấu đã đọc không đồng nghĩa đã hoàn thành công việc.

Điều kiện gửi lần đầu, cập nhật và mức ưu tiên cần Claude thiết kế theo sự kiện/hạn thực tế. Chưa có quyết định rằng mọi lần sửa chữ đều phải gửi thông báo, hoặc rằng phải gửi email/push hệ điều hành. **Thông báo trong ứng dụng là điểm đến cần có; không tự mở thêm kênh ngoài ứng dụng.**

### C04 — Giúp người dùng bằng nút `?`

**[CHỐT]** Thay chữ “Vì sao?” bằng `?`. Áp dụng hướng dẫn bằng `?` ở **tất cả khu vực nhập/dán Excel**. Box giải thích phải làm nổi bật ý chính, không là một đoạn dài đều màu.

**[ĐỀ XUẤT GPT] Mẫu cấu trúc:** tiêu đề → kết luận in đậm → thông số/căn cứ → việc có thể làm. Ví dụ:

> **Cách xác định SOS 2**  
> Có **2 kỹ năng dưới kỳ vọng** ở MT2.  
> Kỳ vọng: **6.5** · Reading: **5.5** · Writing: **6.0**.  
> Xem kết quả và xử lý Case.

Nút có nhãn hỗ trợ như `Giải thích mức SOS`; chạm và bàn phím đều mở được. Không để một lần bấm vào chip vừa mở giải thích vừa mở việc.

### C05 — Ký hiệu đạt/chưa đạt

**[CHỐT]** Thay cách dùng ký hiệu lên/xuống để biểu diễn đạt/không đạt; đang dễ bị hiểu thành tiến bộ/tụt điểm. Đồng bộ toàn bộ website.

**[ĐỀ XUẤT GPT — chưa phải bộ ký hiệu đã chốt]**

| Ý nghĩa | Cách hiển thị đề xuất |
|---|---|
| Đạt | `✓ Đạt` |
| Chưa đạt | Dấu nhân trong vòng tròn + `Chưa đạt` |
| Thiếu kết quả để kết luận | Biểu tượng vòng tròn rỗng + `Chưa đủ điểm` |
| Vượt kỳ vọng | `✓ Vượt kỳ vọng` khi thật sự cần phân biệt |
| Chênh lệch với kỳ vọng | `Thiếu 0.5 band` hoặc `Vượt 0.5 band`, không mũi tên |
| Xu hướng theo thời gian | `Tăng 0.5 band`, `Giảm 0.5 band`, `Không đổi` trong vùng xu hướng riêng |

Dùng icon vector thống nhất, không dựa vào emoji của từng máy. Ký hiệu trạng thái không phải nút đóng. Ô điểm dày có thể dùng biểu tượng nhỏ cạnh số, nhưng phần giải thích và tên truy cập phải rõ. **Không dùng dấu “=” làm biểu tượng Pass** vì bằng kỳ vọng và đạt không phải lúc nào cũng cùng một quy tắc.

## 3. Mockup 1 — Các lựa chọn đã chốt

| Mã | Nội dung | Quyết định |
|---|---|---|
| C06 | Căn cột | Cân đối lại độ rộng. Căn giữa các cột điểm và nhiều cột số phù hợp; tên, nội dung dài và công việc có thể giữ căn trái |
| C07 | W trong danh sách Học viên & Lớp | Cách thể hiện hiện tại khá ổn; căn giữa |
| C08 | Câu 1 — chip SOS | **A, vàng/cam/đỏ, chỉ viền, không nền đặc**, màu phân biệt rõ hơn |
| C09 | Câu 2 — chữ | Theo khuyến nghị: đầu cột 12 px không in hoa, ô bảng 13 px; các cấp chữ khác theo hệ thống đề xuất, ô nhập mobile 16 px |
| C10 | Câu 3 — bộ lọc | Theo khuyến nghị **A: dải lọc nhất quán dưới tiêu đề, giữ ngữ cảnh khi cuộn** |
| C11 | Câu 4 — thanh trên | Đưa các mục đã đề xuất như giao diện/ngôn ngữ/hướng dẫn vào menu; không giữ các nút lẻ chỉ vì bản cũ có |
| C12 | Câu 5 — điểm trong hồ sơ lớp | **OVR · L · R · W1 · W2 · S**, không cần W tổng; **hai hàng MT**, hàng cũ kém nổi bật hơn |
| C13 | Câu 6 — cột điểm khi mở lớp FT ở danh sách | Đồng ý thêm **OVR · L · R · W · S** như mockup |

**Phải phân biệt hai màn:**

| Màn | Cột điểm chính | Lịch sử MT |
|---|---|---|
| Học viên & Lớp, mở lớp FT | OVR · L · R · W · S; W1/W2 có thể là dòng phụ như mockup | Không áp dụng bắt buộc hai hàng từ yêu cầu hồ sơ lớp sang đây |
| Hồ sơ lớp | OVR · L · R · W1 · W2 · S; **không W tổng** | MT hiện tại/gần nhất và MT trước đó, có nhãn đợt rõ |
| Lưới nhập điểm | Các cột cần nhập theo vai và việc | Có thể cho xem W tổng tính toán ở nơi phù hợp; không suy yêu cầu bỏ W ở hồ sơ lớp thành bỏ W khỏi toàn hệ thống |

**[ĐỀ XUẤT GPT]** Ở hồ sơ lớp, tên học viên xuất hiện một lần cho hai hàng; thêm cột nhỏ `Đợt` để ghi MT3/MT2. Hàng mới chữ chính, hàng trước chữ phụ và nền rất nhẹ. Cùng một hàng phải là cùng một lượt; không lấy L mới nhất của MT3 ghép W2 của MT2. Thiếu điểm ghi trạng thái đúng, không điền điểm cũ vào ô trống của lượt mới. Nếu chỉ có một lượt thì hiện một hàng, không tạo lịch sử giả.

**[ĐỀ XUẤT GPT]** Bảng vẫn cần giảm nhiễu bằng khoảng cách, nhãn rút gọn, ưu tiên nội dung và chi tiết tại chỗ. Có thể nghiên cứu chế độ xem gọn, nhưng **không tự ẩn các cột C12/C13 đã được chủ sản phẩm đồng ý** dưới danh nghĩa tối giản.

## 4. Mockup 2 — Nhập điểm, Excel và đường vào

### C14 — Progress Test và Final Test ở lớp thường

**[CHỐT]** Cả **Progress Test và Final Test** phải xuất hiện để chấm **ngay trong tuần thi và sau tuần thi**. Không bắt đợi hết tuần mới cho chấm; qua tuần không làm bài chưa chấm biến mất.

**[ĐỀ XUẤT GPT — cách diễn giải cần đối chiếu lịch thực]:** mỗi Test có lịch và trạng thái riêng, áp dụng cùng nguyên tắc hiển thị. GPT đang hiểu là mỗi Test mở từ tuần thi tương ứng, chưa suy thành mở một Final còn ở tương lai khi đang thi Progress. Sau tuần thi, bài chưa chấm tiếp tục ở công việc cần xử lý; bài đã chấm còn xem được trong lịch sử/đợt thi, không còn là việc chưa hoàn thành. Nếu yêu cầu “cả 2 test” có nghĩa là luôn hiện đồng thời hai mục để truy cập, hãy giữ cả hai mục và phân biệt trạng thái rõ, không tự khóa quyền nhập ngoài quy tắc hiện hành.

**[ĐỀ XUẤT GPT]** Kiểm đủ Lịch Test/Chấm Test, Công việc GV, bảng điểm lớp và đường mở từ thông báo. Quy tắc xuất hiện và quyền nhập phải nhất quán giữa các điểm vào; hạn chấm không tự thay đổi chỉ vì thời điểm hiển thị sớm hơn.

### C15 — Dán điểm và nhận xét từ Excel

**[CHỐT]** Cấu trúc dán là các cặp điểm–nhận xét:

`Tên học sinh | L (điểm) | Nhận xét L | R (điểm) | Nhận xét R | …`

Có hướng dẫn cụ thể và nút `?`. Mọi chỗ nhập Excel khác cũng cần hướng dẫn tương tự, đúng cấu trúc của chỗ đó.

**[ĐỀ XUẤT GPT] Mẫu theo loại lớp:**

| Loại | Cột sau Tên học sinh |
|---|---|
| Fast Track | L · Nhận xét L · R · Nhận xét R · W1 · Nhận xét W1 · W2 · Nhận xét W2 · S · Nhận xét S |
| Lớp thường | Điểm/nhận xét từng môn của chương trình đang chọn; không ép mọi chương trình có cùng môn |
| Nhập một kỹ năng | Tên học sinh · Điểm kỹ năng đó · Nhận xét kỹ năng đó |

Không thêm W tổng thành một cột phải nhập nếu hệ thống tính từ W1/W2. Không tự kết luận “L (điểm)” là số câu đúng hay band: mẫu phải ghi rõ loại dữ liệu, đơn vị và khoảng hợp lệ theo cơ chế đang dùng. Nếu cho nhập cả hai loại, người dùng chọn một lần cho cả lô, không đoán theo giá trị từng ô.

**Nội dung `?` đề xuất:**

1. Chọn đúng lớp, lượt Test và kỹ năng.
2. Tải hoặc sao chép mẫu có tiêu đề cột.
3. Điền mỗi học viên một dòng; điểm và nhận xét đặt cạnh nhau theo thứ tự mẫu.
4. Sao chép vùng dữ liệu rồi dán vào khung. Mẫu và parser cần thống nhất có nhận hàng tiêu đề hay không; khuyến nghị nhận được cả hai và báo các cột đã nhận diện.
5. Kiểm học viên khớp, ô điểm mới, ô ghi đè và dòng lỗi.
6. Lưu các dòng hợp lệ; nội dung chưa đủ điều kiện còn là nháp, không bị xoá.

**[ĐỀ XUẤT GPT]** Xem trước một bảng gọn ngay trong panel, không wizard nhiều trang. Nhận xét đã dán và hợp lệ được lưu cùng điểm, không bắt mở lại từng em chỉ để dán lần nữa. Những yêu cầu còn thiếu như nhóm nguyên nhân dưới kỳ vọng cần được bổ sung tại chỗ; không âm thầm bỏ luật hiện hành.

Đối chiếu tên phải chịu được trùng tên và tên không dấu. Có thể dùng email/định danh nội bộ khi dữ liệu nguồn có, nhưng không tự sửa mẫu chủ sản phẩm thành bắt buộc thêm một cột email. Trùng/không chắc thì chọn học viên; không đoán. Ô trống không thành 0; ghi đè cần hiện trước/sau; lỗi một phần không làm mất cả lô.

### C16 — Bỏ tab Điểm theo lớp, giữ hai đường vào rõ

**[CHỐT]** Đồng ý bỏ tab điểm theo lớp ở Test. Phải có:

- Đường **Nhập điểm** rõ ràng trong hồ sơ lớp.
- Mục **Nhập điểm** trong nút `…` ở cuối hàng lớp.

**[ĐỀ XUẤT GPT]** `… → Nhập điểm` mở ngay panel nhập điểm của lớp, chọn lượt/môn trong panel nếu chưa có ngữ cảnh; không chuyển qua hồ sơ rồi bắt tìm lại nút. Hồ sơ lớp có hành động Nhập điểm ở đầu vùng Điểm. GV mở đúng phần được phân công; người chỉ có quyền xem thấy Xem điểm. Link cũ giữ ngữ cảnh, không chuyển tùy tiện vào lớp đầu tiên.

## 5. Kế hoạch Test — Các bổ sung đã chốt

### C17 — Xuất Excel đúng các trường

**[CHỐT]** Có nút **Xuất Excel** ở Kế hoạch Test, với thứ tự cột:

```text
Gmail | Tên học sinh | Lớp | MT1 | MT2 | MT3 | MT4 | MT5 | MT6 | MT7 | MT8 | MT9 | MT10
```

Giữ đúng tên `Gmail` ở bản xuất theo yêu cầu. Không thêm cột mã học viên vào bản xuất này.

**[ĐỀ XUẤT GPT]** Vì là Kế hoạch Test, các cột MT được hiểu là **lịch thi**, không phải điểm; Claude cần ghi rõ cách hiểu này. Một hàng một học viên trong phạm vi đang lọc; tiêu đề thông tin/sheet phụ có thể ghi chi nhánh và thời điểm xuất mà không đổi 13 cột chính.

- Các môn cùng tuần: `W4 AUG/2026`.
- Các môn khác tuần: `L/R: W4 AUG/2026; W/S: W1 SEP/2026` trong cùng ô, xuống dòng nếu cần.
- Chưa xếp: `Chưa xếp`; đã huỷ/vắng/chờ duyệt có nhãn nếu là thông tin cần để hiểu lịch, không biến thành điểm 0.
- Không chỉ xuất các lớp đang mở trên màn hình; phạm vi xuất phải rõ. Khuyến nghị mặc định theo bộ lọc hiện tại.
- MT ngoài 1–10 không được mất khỏi website vì định dạng xuất chỉ tới MT10. Nếu có dữ liệu ngoài phạm vi này, ghi rõ trong phần thông tin xuất.

**[CẦN LÀM RÕ nếu dữ liệu thực đòi hỏi]** Nội dung cụ thể mỗi ô MT và cách xuất học viên có nhiều lộ trình/lớp trong kỳ. Claude đề xuất cách gọn nhất, không tự trộn các lượt khác nhau.

### C18 — Tìm theo lớp, học viên và Gmail

**[CHỐT]** Khu vực tìm kiếm hiện chỉ tìm lớp cần tìm thêm **tên học sinh và Gmail**.

**[ĐÃ ĐỐI CHIẾU]** `TimLop.tsx` và `KeHoachTestTab.tsx` hiện lọc theo mã lớp. Đây là căn cứ ở trang Kế hoạch Test, không phải kết luận rằng mọi ô tìm trên toàn website đều chỉ tìm lớp.

**[ĐỀ XUẤT GPT]** Placeholder: `Tìm lớp, học viên hoặc email…`. Kết quả chia Lớp/Học viên; mỗi học viên hiện tên, lớp, email để phân biệt trùng tên. Chọn em thì mở lớp và đưa đúng hàng em vào vùng nhìn thấy, giữ bộ lọc phù hợp; không bắt tự tìm lại trong lớp. Tìm tên có/không dấu, email không phân biệt hoa thường và cắt khoảng trắng. Không giới hạn địa chỉ phải kết thúc bằng `@gmail.com`.

### C19 — Nút Xóa trong hộp xếp lịch: mô tả thay ảnh

**[CHỐT về vị trí và nhu cầu có nút]** Thêm nút **Xóa** tại chân hộp lịch của **một học viên × một đợt Mock Test**.

**Mô tả chính xác ảnh chủ sản phẩm đã gửi:**

- Trang **Test → Kế hoạch Test**, giao diện sáng, chi nhánh **Hải Dương**.
- Lớp **HD FT 03** đang mở, lưới học viên × các cột MT1, MT2, MT3, MT4, MT5, MT6.
- Bấm ô lịch của **Đỗ Trọng Tiến tại MT4** mở hộp neo cạnh ô, ở vùng dưới bên phải bảng.
- Tiêu đề hộp: **Đỗ Trọng Tiến · MT4**. Đầu hộp có menu `…` và nút đóng `×`.
- Trong hộp có hàng **Tuần chung**, ô tuần **W4 SEP** với khoảng ngày **21/09–27/09**, nút tuần trước/sau; bên dưới là L Listening, R Reading, W Writing, S Speaking, mỗi dòng có tuần, trạng thái **chờ chấm** và menu `…`.
- Chân hộp: **Đóng** bên trái, **Lưu** bên phải. Vị trí được đánh dấu đỏ cho nút **Xóa** là **ngay bên phải Đóng**, cùng hàng chân hộp, không nằm trong menu ẩn.
- Việc xoá tác động tới lịch/đợt đang mở, không phải nút xoá học viên, xoá lớp hoặc xoá toàn bộ MT của học viên.

**[ĐÃ ĐỐI CHIẾU]** Thành phần tương ứng là `HopKyNang.tsx` — hộp một đợt neo cạnh chip. Không nhầm với `NganXepLichMt.tsx`, là panel xếp nhiều MT/nhiều học viên. Hộp hiện có menu Huỷ MT và Nhật ký; cần xem lại hành vi này trước khi thêm thao tác trùng.

**[CẦN LÀM RÕ — ảnh chưa xác định được hậu quả nghiệp vụ]** “Xóa” nghĩa là bỏ lịch để xếp lại, hay huỷ hẳn lượt MT? Hai việc khác nhau. **[ĐỀ XUẤT GPT]** Ưu tiên hiểu là `Xóa lịch` để đưa lịch về chưa xếp, vẫn giữ học viên, lượt và lịch sử. Nếu đã có điểm/Case/PA hoặc phần thi đang xử lý, phải nêu đúng ảnh hưởng và dùng cơ chế nghiệp vụ phù hợp; không xoá dây chuyền điểm vì một nút lịch.

Claude có thể đề xuất nhãn **Xóa lịch** rõ hơn “Xóa”; ghi đây là đề xuất câu chữ, không tự nhận chủ sản phẩm đã chọn nhãn mới. Vị trí hành động đã chốt; ý nghĩa xoá cần được xác minh trước khi ghi dữ liệu.

### C20 — Năm đi cùng tuần

**[CHỐT]** Kế hoạch Test hiển thị năm cạnh tuần, ví dụ **`W4 AUG/2026`**. Áp dụng đồng bộ ở chip lịch, hộp chỉnh lịch và dữ liệu xuất liên quan; không chỉ sửa một tiêu đề.

**[ĐỀ XUẤT GPT]** Lưu ngày/tuần thực trong dữ liệu, định dạng khi hiển thị. Chọn từ tuần–đến tuần phải xử lý qua tháng/năm; không suy năm theo ngày hiện tại khi mở lịch cũ.

### C21 — Ghi chú ngay dưới lịch Mock Test

**[NHU CẦU CHỐT — CÁCH LÀM MỞ]** Có khu vực ghi chú và hiển thị **ngay dưới lịch Mock Test trong Kế hoạch Test**.

**[ĐỀ XUẤT GPT]** Ghi chú theo học viên × lượt MT, hiển thị một dòng dưới chip lịch trong ô tương ứng; nội dung dài rút gọn, bấm mở đầy đủ và sửa tại chỗ. Khi hộp lịch mở, có trường `Ghi chú lịch thi` dưới các kỹ năng. Ghi chú chung cho cả lớp có vùng riêng dưới bảng, ghi rõ phạm vi để không nhầm với ghi chú của một em.

Ví dụ: `Chờ xác nhận lịch Speaking` hoặc `Gia đình đề nghị chuyển sang đầu tháng 11`. Đây là thông tin người nhập ghi lại, **không được tự hiểu là lệnh dời lịch**. Có tác giả, thời điểm và lịch sử sửa; không dùng alert/toast tồn tại lâu để hiển thị ghi chú.

Vị trí “ngay dưới lịch” đã chốt; cấp dữ liệu học viên/lượt/lớp ở trên là phương án GPT đề xuất để Claude phản biện.

### C31 — Xuất Excel danh sách học viên theo nhu cầu

**[NHU CẦU CHỐT — CÁCH LÀM MỞ]** Chủ sản phẩm cần xuất Excel danh sách học sinh theo điều kiện tự chọn, ví dụ **chỉ học viên có SOS**, **chỉ SOS 3**, và các nhóm khác phục vụ công việc. Không bị giới hạn vào một danh sách xuất cố định. Claude chủ động đề xuất thêm tình huống hữu ích, ưu tiên thao tác đơn giản và tận dụng bộ lọc sẵn có.

**Phân biệt với C17:** C17 là mẫu Kế hoạch Test cố định 13 cột Gmail/Tên học sinh/Lớp/MT1–MT10. C31 là chức năng xuất danh sách tùy nhu cầu; việc chọn cột cho C31 không làm thay đổi mẫu đã chốt của C17.

#### Phương án GPT khuyến nghị: lọc ở đâu, xuất đúng danh sách ở đó

**[ĐỀ XUẤT GPT]** Đặt nút **Xuất Excel** ở Học viên & Lớp và các panel danh sách mở từ số liệu SOS/Case/Phân tích khi có nhu cầu xuất. Dùng chung một cách xuất, kế thừa đúng bộ lọc, quyền và ngữ cảnh; không bắt sang trang xuất riêng rồi chọn lại điều kiện.

Luồng thường dùng: **lọc danh sách → xem đúng học viên → bấm Xuất Excel**. Ví dụ chọn `SOS 3`, bảng còn 18 học viên thì nút ghi `Xuất Excel · 18 HV`. Đây là số minh họa, không phải dữ liệu thật. Xuất nhanh dùng mẫu cột mặc định; chỉ mở tùy chọn khi cần thay phạm vi/cột.

| Nhu cầu | Cách lọc đề xuất |
|---|---|
| Toàn bộ học viên đang có SOS | SOS: **Có SOS** |
| Chỉ SOS 3 | SOS: **SOS 3** |
| SOS 2 và SOS 3 | Chọn nhiều mức **SOS 2, SOS 3** |
| SOS 3 của một cơ sở hoặc vài lớp | SOS 3 + Cơ sở + Lớp |
| Có SOS và chưa có PA | Có SOS + trạng thái PA **Case trống PA** theo định nghĩa hiện hành |
| Học viên chưa đạt trong kỳ vừa chọn | Kết quả: Chưa đạt + khoảng thời gian kết quả thi |
| Một số học viên chọn thủ công | Tích hàng → **Xuất các HV đã chọn** |

Đây là ví dụ mở rộng của GPT, chưa phải toàn bộ bộ lọc đã được chủ sản phẩm chốt. Mặc định chỉ hiện các bộ lọc hay dùng: **SOS, Cơ sở, Lớp**; các điều kiện như GV phụ trách, Case/PA, kỹ năng, kết quả và thời gian đặt trong **Bộ lọc thêm**, chỉ cung cấp khi dữ liệu có định nghĩa rõ. Không dựng một trình tạo truy vấn phức tạp với nhiều tầng AND/OR.

**Quy tắc lọc cần rõ:** nhiều giá trị trong cùng một nhóm là “hoặc”; giữa các nhóm là “và”. Ví dụ SOS 2 hoặc SOS 3, đồng thời thuộc cơ sở đã chọn. `Có SOS` không đồng nghĩa `Có Case đang mở`; `Không có SOS` không gộp với `Chưa đủ điểm`. SOS tạm/chính thức, mức SOS và trạng thái Case phải dùng đúng nguồn nghiệp vụ đang có, không tự tính lại từ số kỹ năng hoặc đồng nhất SOS với Pass/Fail.

#### Phạm vi xuất và thời điểm dữ liệu

**[ĐỀ XUẤT GPT]** Có hai phạm vi với nhãn rõ:

- **Toàn bộ kết quả đang lọc — N học viên**: mặc định, lấy đủ qua mọi trang dữ liệu, kể cả lớp đang thu gọn; không chỉ lấy các hàng đã tải lên màn hình.
- **Các học viên đã chọn — M học viên**: chỉ xuất các hàng đã tích. Khi thay bộ lọc, bỏ lựa chọn cũ hoặc cảnh báo rõ, không âm thầm xuất học viên nằm ngoài tập đang xem.

Mặc định danh sách SOS phục vụ xử lý là **trạng thái hiện tại**. Nếu cần xem lịch sử, tách nhãn rõ **Trạng thái hiện tại / Có SOS trong khoảng thời gian**, có bộ chọn kỳ tương ứng. Chế độ lịch sử chỉ triển khai khi dữ liệu lưu đủ; không lấy SOS hiện tại rồi gắn nhãn như thể là trạng thái ở kỳ cũ. Không dùng cùng một ô thời gian mơ hồ cho ngày thi, ngày phát sinh Case và ngày cập nhật SOS. Claude cần đối chiếu nguồn dữ liệu trước khi chọn cách tính.

Mặc định **một hàng một học viên**, khử trùng bằng định danh hệ thống, không theo tên. Nếu một em có nhiều Case/MT/lớp liên quan thì tổng hợp có nhãn trong hàng và có thể thêm sheet chi tiết; nếu xuất một hàng mỗi lượt thi phải gọi rõ là **Chi tiết lượt thi**, không báo đó là số học viên. Không tự chọn “SOS cao nhất” thay cho trạng thái hiện hành nếu nghiệp vụ chưa định nghĩa như vậy.

#### Cột dữ liệu: có mẫu sẵn, tùy chỉnh khi cần

**[ĐỀ XUẤT GPT]** Dùng một mẫu mặc định theo ngữ cảnh, kèm mục **Chọn cột** trong tùy chọn xuất. Không bắt chọn lại cột mỗi lần.

| Mẫu đề xuất | Cột mặc định |
|---|---|
| **Danh sách cơ bản** | Tên học sinh, Gmail, Lớp, Cơ sở |
| **Theo dõi SOS** | Tên học sinh, Gmail, Lớp, Cơ sở, Mức SOS, Tạm/Chính thức nếu có, MT liên quan, Kỹ năng cần xử lý, Trạng thái Case, Trạng thái PA, Người phụ trách |
| **Kết quả thi** | Tên học sinh, Gmail, Lớp, Loại Test/MT, Ngày hoặc tuần thi kèm năm, Điểm theo đúng loại Test, Kết quả Đạt/Chưa đạt/Chưa đủ điểm; kỹ năng hụt chỉ phân rã cho trường hợp Fail theo C27 |

Với mẫu SOS, thể hiện kỹ năng cần xử lý theo quy tắc SOS hiện hành; không tự suy từ nhãn Pass/Fail của mẫu kết quả. Nếu cần thêm điểm OVR/L/R/W1/W2/S, mục tiêu, nhận xét hoặc lịch thi thì bật thêm cột phù hợp. Chỉ xuất dữ liệu người dùng được phép xem; file không tự có thêm trường bị ẩn do quyền.

**[ĐỀ XUẤT GPT — bổ sung sau nếu hữu ích]** Cho lưu bộ lọc thường dùng bằng tên tự đặt, ví dụ `SOS 3 · Hải Dương`, hoặc nhớ bộ cột xuất gần nhất. Ưu tiên làm luồng lọc–xuất hoạt động tốt trước; chưa cần xây riêng hệ thống quản lý mẫu báo cáo.

#### File xuất phải dễ dùng và khớp màn hình

**[ĐỀ XUẤT GPT]** Xuất `.xlsx` với tiêu đề rõ, cố định hàng đầu, bật bộ lọc Excel, độ rộng cột hợp lý; điểm là số, email/mã là văn bản. Ghi điều kiện lọc, ý nghĩa khoảng thời gian, thời điểm lấy dữ liệu và số học viên ở sheet **Thông tin xuất** để bảng chính vẫn dễ lọc/sắp xếp. Tên file ví dụ `PISA_HV_SOS3_HaiDuong_2026-10-18.xlsx`.

- Tái sử dụng cùng điều kiện truy vấn với danh sách trên web, gồm tìm tên/email, bộ lọc và quyền; không viết một logic SOS khác riêng cho export.
- Lấy dữ liệu nhất quán cho toàn bộ file. Nếu số lượng thay đổi trong lúc xuất, hiển thị đúng số thực xuất và thời điểm lấy dữ liệu; không cam kết file có đúng số cũ khi dữ liệu đã đổi.
- Không có kết quả: hiện `Không có học viên phù hợp để xuất`; không tải một file trống khó hiểu.
- Dữ liệu nhiều: báo đang tạo file ngay tại trang, giữ bộ lọc khi lỗi và cho thử lại; không chuyển người dùng qua nhiều màn.
- Nội dung do người dùng nhập phải được ghi như văn bản, tránh bị Excel hiểu thành công thức ngoài ý muốn. Ngày/tuần luôn có năm, ô thiếu dữ liệu không thành điểm 0.
- Nếu ghi lịch sử xuất, chỉ ghi ai xuất, lúc nào, phạm vi và số lượng trong nhật ký phù hợp; không tạo thông báo hàng loạt hoặc thêm bước phê duyệt cho thao tác xuất thông thường.

**Yêu cầu Claude:** đánh giá phương án này, đề xuất thêm nhóm xuất thực tế nếu có ích, thống nhất nhãn tiếng Việt và làm mẫu luồng `SOS 3 → danh sách → xuất Excel`. Giữ phân biệt giữa nhu cầu chủ sản phẩm đã chốt với các lựa chọn thiết kế GPT đang đề xuất; không cần hỏi lại việc có cần xuất theo SOS hay không.

## 6. Lịch sử nhập/sửa — yêu cầu xuyên suốt

### C22 — Phạm vi bắt buộc

**[NHU CẦU CHỐT — CÁCH LÀM MỞ]** Gần như mọi nơi nhập/sửa thông tin, điểm, nhận xét… phải lưu lịch sử. Cách xem phải gọn, dễ theo dõi, đầy đủ, không gây gián đoạn.

**[ĐỀ XUẤT GPT] Một mẫu thống nhất:**

| Lớp hiển thị | Cách làm |
|---|---|
| Ngay cạnh dữ liệu | Dòng nhỏ `Cập nhật 14:32 · Nguyễn A` khi hữu ích; hoặc biểu tượng lịch sử có nhãn rõ |
| Ở form/panel | Mục **Lịch sử thay đổi** trong vùng phụ hoặc menu `…`; không chiếm chỗ của hành động chính |
| Khi mở | Timeline nhóm theo mỗi lần lưu, gần nhất trước; lọc người, trường, thời gian nếu dài |
| Chi tiết một lần sửa | Người sửa · thời gian đầy đủ · trường · trước → sau · lý do nếu có · nguồn thao tác |
| Sửa cả lô/nhập Excel | Một lần lưu chung, mở ra từng học viên/ô; không tạo hàng trăm thông báo rời |

Ví dụ:

> **18/10/2026 · 14:32 — Lê Minh Khoa**  
> Writing Task 2: **5.5 → 6.0**  
> Nhận xét: xem phần thay đổi.  
> Nguồn: Nhập điểm từ Excel · Lý do: Chấm lại bài.

**Yêu cầu triển khai đề xuất:** ghi lịch sử ở phía máy chủ trong cùng thao tác cập nhật; chỉ ghi lần lưu có thay đổi, không từng phím gõ. Có lịch sử tạo mới, sửa, xoá/huỷ, dời lịch, thay người phụ trách và thay trạng thái quan trọng. Không cho sửa lại lịch sử như dữ liệu thường; quyền xem lịch sử theo quyền xem dữ liệu.

Ghi chú/nhận xét dài dùng so sánh nội dung gọn, không buộc đọc hai đoạn dài cạnh nhau. Nháp chưa lưu phân biệt với bản đã ghi. Sửa do hệ thống cũng ghi rõ tác nhân/quy tắc. Không bổ sung lịch sử giả cho dữ liệu cũ; có thể đánh dấu “Lịch sử bắt đầu được ghi từ…” khi cần.

**Lịch sử ≠ Hoàn tác ≠ Thông báo:** lịch sử để truy vết; hoàn tác là sửa dữ liệu có kiểm tra phiên bản; thông báo chỉ dành cho điều cần người khác biết/làm. Không gửi thông báo cho mọi sự kiện lịch sử.

## 7. Mockup 3 — Tổng quan, báo cáo, số liệu

### C23 — Tổng quan A và nhãn đã chốt

**[CHỐT]** Chọn **Tổng quan A: ba khối dọc**. Dùng đúng các nhãn:

- **Lớp cần chú ý**.
- **HV cần chú ý**.
- **Case chưa chốt PA** là số tổng; thành phần đầu là **Case trống PA**.
- Cột **HV - Case** xếp chồng, nhưng thiết kế lại cho dễ đọc và đẹp hơn.

**[ĐỀ XUẤT GPT]** Số lớn/đơn vị rõ, canh hàng ổn định: dòng `21 HV`, dòng `34 Case`; cả hai có vùng bấm riêng đủ lớn. Không dùng `21 - 34`, không lệ thuộc màu để đoán đơn vị.

**[CẦN XÁC MINH]** Phân rã Case phải đủ trạng thái và không trùng đếm. Không mặc định chỉ có `Case trống PA` + `PA chờ xác nhận/duyệt` là bao phủ mọi Case chưa chốt, nếu mã còn PA kết thúc nhưng Case chưa xong hoặc trạng thái khác.

### C24 — Báo cáo có khoảng thời gian linh hoạt

**[CHỐT]** Mặc định **hai tuần hoàn chỉnh vừa qua**. Ví dụ đang W3 OCT thì báo cáo **W1 + W2 OCT**. QL tự chọn tuần hoặc khung thời gian; không khoá vào mặc định.

**[ĐỀ XUẤT GPT]** Bộ chọn thống nhất: `2 tuần vừa qua` · `Theo tuần` · `Theo tháng` · `Tùy chọn`; trong Theo tuần có Từ tuần/Đến tuần, có năm và khoảng ngày. Không bỏ hai tuần trước chỉ vì sang tháng/năm mới. Dùng lịch tuần nghiệp vụ hiện hành của trung tâm.

Tên trang có thể giữ **Báo cáo tuần** vì người dùng quen, hoặc đề xuất **Báo cáo học tập** nếu phạm vi tuần/tháng/tùy chọn được mở rộng. Đây là đề xuất tên, **không tự ghi là chủ sản phẩm đã chốt đổi tên trang**.

### C25 — Bỏ khung Đã thi – Chờ KQ khỏi báo cáo

**[CHỐT]** Bỏ khung **Đã thi – Chờ KQ** trên báo cáo vì không phải thông tin cần thiết ở đây. Không thay nó bằng một khung cùng nội dung nhưng tên khác.

Không suy thành bỏ cập nhật kết quả thi thật, xoá việc sau thi, xoá trạng thái chờ kết quả hoặc tắt thông báo liên quan ở các màn vận hành khác.

### C26 — Panel báo cáo phải cho thấy kết quả cụ thể

**[CHỐT]** Bấm số liệu báo cáo mở panel thông tin dễ nhìn, chi tiết. Nếu là điểm, phải hiện ngay **điểm gì, của ai, đợt nào, kết quả thế nào**, không chỉ danh sách tên hoặc link sang nơi khác.

**[ĐỀ XUẤT GPT]** Panel có tiêu đề nói rõ tập dữ liệu, tóm tắt số lượng, bộ lọc đang áp dụng, bảng kết quả và hành động theo quyền. Mở hàng học viên ngay trong panel để sửa/xem nhận xét/lịch sử/Case cần xử lý. Nếu phải mở màn chấm chuyên sâu thì một nút `Mở bảng điểm` giữ đúng lớp/lượt.

### C27 — Bảng kết quả và tỷ lệ Pass/Fail theo thời gian

**[NHU CẦU CHỐT — CÁCH LÀM MỞ]** Phân tích cần bảng thông số về điểm số và tỷ lệ **Pass/Fail** của học sinh đã thi theo tuần, tháng hoặc khoảng tự chọn:

- Học viên **Pass**: không cần phân tích các kỹ năng không đạt trong bảng tổng hợp này.
- Học viên **Fail**: hiện rõ kỹ năng hụt.

**[ĐỀ XUẤT GPT] Tên vùng: Kết quả thi.** Cấu trúc:

| Tầng | Nội dung |
|---|---|
| Bộ lọc | Chi nhánh · chương trình/lớp · loại Test/thi · thời gian |
| Tổng quan | Đủ kết quả để đánh giá · Đạt · Chưa đạt · Tỷ lệ đạt; định nghĩa mẫu số qua `?` |
| Bảng kết quả | Học viên · Lớp · Đợt/ngày thi · Điểm · Mức cần đạt · Kết quả · Kỹ năng cần cải thiện |
| Chi tiết | L/R/W/S hoặc môn tương ứng, điểm chuẩn, chênh lệch, nhận xét, lịch sử và việc tiếp theo |

Với Pass, cột kỹ năng cần cải thiện để gọn, có thể ghi `Đạt`; **không tính/hiển thị phân rã kỹ năng trượt cho nhóm Pass trong thống kê này**. Điểm từng kỹ năng vẫn là dữ liệu gốc có thể xem khi mở chi tiết, không bị xoá.

Với Fail, ví dụ `R: 5.5/6.0 · thiếu 0.5; W: 5.0/6.0 · thiếu 1.0`. Nếu nguyên nhân Fail nằm ở tiêu chí tổng hợp chứ không có ngưỡng từng kỹ năng, ghi đúng tiêu chí tổng hợp chưa đạt, không bịa “kỹ năng trượt”.

**[CẦN LÀM RÕ TRƯỚC KHI CHỐT CÔNG THỨC]**

- Phạm vi có thi thật, Mock Test và lớp thường hay chỉ một loại? GPT đề xuất bộ lọc loại thi để không trộn những thang đo khác nhau; không coi đây là phạm vi đã chốt.
- Pass của từng loại dựa vào Overall/Target, ngưỡng từng kỹ năng hay quy tắc chương trình? Đọc luật hiện hành và trình bày lại, không tự áp một công thức cho mọi loại.
- Một học viên có hai lượt trong khoảng: báo cáo theo **lượt thi** hay **học viên duy nhất**? GPT đề xuất mặc định theo lượt, có số học viên riêng; chủ sản phẩm chưa chọn.
- Chưa đủ điểm không tự thành Fail. Không cộng số kỹ năng Fail thành số học viên Fail. Tỷ lệ = nhóm kết quả hợp lệ tương ứng / tập đủ điều kiện tương ứng, mẫu số ghi rõ.

## 8. Phân tích — tên bảng và phạm vi đã chốt

### C28 — Tên chính thức

| Mục | Nhãn dùng trên giao diện |
|---|---|
| Tổng hợp điểm Test và SOS | **Test + SOS** |
| Hiệu quả phương án | **Hiệu quả PA** |
| Giáo viên | **Phân tích GV** |
| Ý thức | **Ý thức** — giữ thuật ngữ hiện hành |

**[CHỐT]** Không sử dụng “Lớp nào tụt?”, “PA có hiệu quả?”, “GV nào trễ chấm?” làm tên bảng. Chấm bài thường đầy đủ nên không nên tổ chức toàn bộ phân tích GV quanh sự trễ chấm.

### C29 — Thời gian không giới hạn 4/8 tuần

**[CHỐT]** Mọi bảng Phân tích có thể chọn tuần hoặc **từ tuần nào đến tuần nào**, phù hợp nhu cầu xem tháng/khoảng mong muốn; không chỉ có lựa chọn cố định 4–8 tuần.

**[ĐỀ XUẤT GPT]** Dùng cùng bộ chọn thời gian ở các tab, giữ giá trị khi chuyển tab, URL có năm/ngày đầu–cuối. Nếu một chỉ số không áp dụng cho phạm vi/loại chương trình thì giải thích, không đổi bộ lọc ngầm. Lựa chọn nhanh là tiện ích, không thay thế chọn tự do.

**Phân biệt:** bộ chọn thời gian trả lời “khi nào”; cách nhóm dữ liệu theo tuần/lớp/đợt trả lời “xếp bảng thế nào”. Có khoảng tự chọn không có nghĩa phải bỏ góc xem theo đợt.

### C30 — Dùng lại chiều sâu bảng Phân tích GV phiên bản cũ

**[CHỐT]** Dựa vào bảng cũ, làm gọn và thông minh hơn; giữ đánh giá rộng, không biến thành bảng trễ chấm. Chấm đúng hạn/trễ chấm chỉ là một cột hoặc một chỉ số thành phần.

**[ĐÃ ĐỐI CHIẾU]** `web/src/modules/phanTich/PhanTichGiaoVien.tsx` hiện có:

- Đang dạy: số lớp, số HV.
- Đúng hạn: Chấm điểm, Kết quả PA, Xử lý vi phạm.
- PA hiệu quả — ở Fast Track.
- Kết quả môn mình dạy: FT có L/R/W1/W2/S; lớp thường theo môn chương trình.
- HV tiến bộ — ở Fast Track.
- Bộ lọc tuần/tháng, khoảng từ–đến; tử số/mẫu số và “mẫu nhỏ”.

Không bỏ những nhóm nội dung này chỉ để giữ bảng 8 cột. Khả năng lọc thời gian đang có không được mất khi đưa Phân tích thành mục riêng.

## 9. Đề xuất GPT: làm gọn Phân tích GV mà vẫn đủ chiều sâu

### 9.1. Phương án khuyến nghị

Một hàng một GV, bộ lọc chung, bảng chính tập trung vào kết quả học tập; mở rộng tại chỗ cho chi tiết.

| Cột | Thể hiện đề xuất |
|---|---|
| Giáo viên | Tên; vai trò/môn dạy ở dòng phụ |
| Phạm vi giảng dạy | `3 lớp · 42 HV`; bấm xem lớp/HV thuộc phạm vi |
| Kết quả môn dạy | Các mục ngắn có nhãn rõ cho môn thực sự dạy, ví dụ `L 18/24 · 75%`, `R 16/24 · 67%`; tối đa vài dòng trước khi mở chi tiết |
| HV tiến bộ | Số đạt điều kiện tiến bộ / số có dữ liệu so sánh; không ngầm coi bằng điểm là tiến bộ |
| Hiệu quả PA | PA có kết quả tiến bộ / PA đủ điều kiện đánh giá |
| Chấm đúng hạn | `46/48 · 96%`; thông tin quá hạn phụ nhỏ, không làm tâm điểm toàn bảng |
| Theo dõi và xử lý | Hai dòng rõ: `Kết quả PA 5/6 đúng hạn`, `Vi phạm 3/3 đúng hạn`; không trộn thành một “điểm quản lý” |

Nếu GV dạy nhiều môn, có thể dùng mở rộng hàng. **Không gộp tỷ lệ các môn thành trung bình đơn giản** chỉ để được một số đẹp. Có thể có bộ lọc kỹ năng hoặc góc xem chi tiết theo môn khi cần so sánh.

FT và lớp thường dùng đúng định nghĩa môn/ngưỡng. W1/W2 vẫn phân biệt trong phân tích người dạy để phản ánh đúng phân công. Không chuyển mọi kết quả môn/HV tiến bộ sang hồ sơ GV rồi làm bảng tổng mất ý nghĩa.

### 9.2. Panel GV có thể làm việc

Bấm một chỉ số mở panel **đúng chỉ số, đúng GV, đúng thời gian**, không bắt vào hồ sơ GV rồi chọn lại:

- Kết quả môn: học viên/lượt/điểm/mức cần đạt/kết quả; mở bài và nhận xét theo quyền.
- HV tiến bộ: mốc trước/mốc sau, chênh lệch; cách tính rõ.
- Hiệu quả PA: danh sách PA, người thực hiện, thời gian, kết quả; xử lý việc chưa hoàn thành theo quyền.
- Chấm đúng hạn: các bài trong mẫu số, lọc đúng hạn/chậm/chưa nhập; có nhập/chấm tại chỗ nếu được phép.
- Vi phạm: xem hồ sơ xử lý và hành động hiện được giao; không thêm nút Nhắc.

**Trường hợp quan trọng:** `0/20` vẫn có 20 mục có thể xem. Không vô hiệu hoá cả ô chỉ vì tử số bằng 0; panel cần cho biết 20 trường hợp chưa đạt/chưa đúng hạn. Số 0 tuyệt đối không có danh sách thì không giả làm liên kết.

### 9.3. Nguyên tắc đọc số liệu

Giữ tử số/mẫu số, ngày phụ trách và phạm vi lớp trong kỳ. Phân biệt `Không áp dụng`, `Chưa có dữ liệu`, `Mẫu nhỏ`; không dùng cùng một dấu trống cho mọi nghĩa. Mặc định theo tên hoặc nhóm vận hành hợp lý, không tự tạo bảng xếp hạng GV. Nếu đề xuất KPI mới, phải giải thích mẫu số và tính công bằng, không tự thêm điểm tổng hợp từ các chỉ số không cùng đơn vị.

**Phương án dự phòng để Claude brainstorm:** hai góc nhìn trong cùng trang `Kết quả học tập / Theo dõi và xử lý`, dùng chung GV và bộ lọc. Chỉ chọn nếu bảng một màn vẫn quá dày; tránh tạo thêm tầng tab làm người dùng mất ngữ cảnh.

## 10. Họp rà soát lịch thi sắp tới — nhu cầu đã chốt, giải pháp đề xuất

### 10.1. Nhu cầu chủ sản phẩm

**[NHU CẦU CHỐT — CÁCH LÀM MỞ]** Cứ khoảng 1–2 tháng, các bộ phận cùng bàn lịch thi sắp tới của học viên: chọn ngày cụ thể, giữ tháng dự kiến hoặc chuyển sang tháng sau. Ví dụ họp tháng 10 để rà soát học viên thi tháng 11, chốt ngày hoặc chuyển sang tháng 12. Cần tích hợp hợp lý trong website.

**[CÁCH HIỂU ĐỂ ĐỀ XUẤT]** GPT hiểu đây chủ yếu là lịch **thi thật** vì gắn tháng dự kiến và chốt ngày. Cần xác nhận nếu chủ sản phẩm muốn áp dụng cả Mock Test. Không âm thầm trộn hai loại lịch.

### 10.2. Phương án A — khuyến nghị: Rà soát lịch thi trong Test

**[ĐỀ XUẤT GPT]** Trong khu vực Test, có điểm vào **Rà soát lịch thi**, đặt cạnh hoặc bên trong khu vực kế hoạch thi thật. Kế hoạch Mock Test và thi thật phân biệt bằng nhãn rõ; không bắt người dùng sang một “module họp” riêng.

Hai tham số khác nhau:

- **Ngày/kỳ rà soát:** cuộc họp đang diễn ra khi nào.
- **Tháng dự kiến thi cần xem:** ví dụ tháng 11/2026, có thể chọn khoảng nhiều tháng.

Bảng chính đề xuất:

| Cột | Nội dung |
|---|---|
| Học viên | Tên, lớp, GVCN/TVV liên quan |
| Mục tiêu | Target và điều kiện đầu ra đang áp dụng |
| Lịch hiện tại | Tháng/tuần/ngày dự kiến; mức độ đã chốt |
| Kết quả gần nhất | Đợt, ngày, OVR và kỹ năng cần chú ý; mở điểm tại chỗ |
| Ý kiến các bộ phận | Tóm tắt ngắn của GV/GVCN/TVV/CX theo quyền thực tế |
| Kết luận rà soát | Giữ tháng · Chốt ngày · Chuyển tháng · Cần xác nhận |
| Việc tiếp theo | Người thực hiện, nội dung, hạn nếu có |

Workflow gọn:

1. Chọn tháng cần rà soát → tự lấy học viên có lịch dự kiến trong tháng và nhóm liên quan chưa đủ thông tin.
2. Mở một hàng → xem lịch, điểm, Target, ý kiến và ghi kết luận trong cùng panel.
3. Chốt ngày hoặc chuyển tháng → hiển thị thay đổi cũ/mới ngay; cập nhật lịch theo quyền và quy trình hiện hành.
4. Lưu kết luận, người chốt, thời gian, lý do dời nếu có; tạo thông báo/việc tiếp theo từ thay đổi thực tế.
5. Kết thúc buổi họp → tóm tắt số đã chốt, chuyển tháng, còn cần xác nhận. Không phải nhập lại biên bản ở một nơi khác.

Ví dụ: đang họp tháng 10, chọn danh sách tháng 11. Một em chuyển từ `11/2026` sang `12/2026`: danh sách hiện tại vẫn có hàng `Đã chuyển sang 12/2026` đến hết phiên để không mất dấu cuộc họp; danh sách tháng 12 cập nhật theo lịch mới. Không nhân đôi học viên.

### 10.3. Phân biệt các loại dữ liệu

- `Dự kiến tháng 11` không phải ngày thi 01/11.
- `Đã chốt ngày 22/11` không tự có nghĩa đã đăng ký thi.
- Ý kiến “nên dời” chưa phải lịch chính thức đã đổi.
- Không tự dời chuỗi MT hoặc hạn PA khi đổi lịch thi thật nếu chưa kiểm quy tắc phụ thuộc. Có tác động thì hiển thị tóm tắt và dùng quy tắc đã được chốt.
- Họp là một góc làm việc trên dữ liệu lịch chuẩn, không một bản Excel tách rời rồi đồng bộ thủ công.
- Không tự thêm vòng phê duyệt mới. Ai được chốt/cập nhật và trường hợp nào cần xác nhận bám quyền hiện hành; thay quyền là quyết định riêng.

### 10.4. Hai option khác để Claude đánh giá

| Option | Ưu điểm | Đổi lại |
|---|---|---|
| **B — Góc “Lịch thi dự kiến” trong Học viên & Lớp** | Thuận khi bàn chủ yếu theo hồ sơ/khả năng từng học viên | Cần đường vào rõ từ Test để không phân mảnh lịch |
| **C — Chế độ “Rà soát lịch thi” ngay trên Kế hoạch** | Ít thêm điểm điều hướng, dùng cùng bảng và lọc | Nếu kế hoạch hiện chủ yếu là lưới MT1–MT10 thì dễ quá tải, phải phân tách Mock/thi thật rõ |

**Yêu cầu Claude:** brainstorm thêm option nếu có cách đơn giản hơn A; so bằng số thao tác, sự rõ nghĩa, quyền và dữ liệu dùng chung. Chọn một phương án khuyến nghị, không trả lại một danh sách dài rồi bắt chủ sản phẩm tự thiết kế.

## 11. Đề xuất GPT xuyên suốt — không phải quyết định mới của chủ sản phẩm

### 11.1. Panel chuẩn để vừa xem vừa làm

Mỗi panel có: **đối tượng + ngữ cảnh → dữ liệu cần hiểu → thao tác chính → trạng thái lưu → lịch sử/hỗ trợ phụ**. Số trên trang và số hàng trong panel dùng cùng phạm vi/thời gian/đơn vị. Không bấm “12 học viên” rồi ra 12 Case.

Danh sách nhiều em có thể mở rộng hàng để làm, hoặc dùng danh sách trái + vùng làm việc phải. Trên điện thoại, một vùng toàn màn hình và Back về đúng chỗ. Không panel chồng panel chồng hộp; đổi nội dung có đường quay lại hoặc đi thẳng trang chuẩn.

### 11.2. Hàng đợi GV

Giữ hướng GV vào Công việc, mở đúng môn và tự sang việc tiếp đã được đồng ý ở vòng trước. Chỉ chuyển sau khi lưu thành công; giữ nháp nếu lỗi, cho quay lại việc vừa xong. Trong lúc gõ, việc mới không làm nhảy thứ tự/học viên. “Bạn đã chấm xong P” khác “Cả lớp đã đủ điểm”.

Enter ở ô số có thể lưu/đi tiếp; Enter trong nhận xét không nên vô tình gửi form khi đang gõ tiếng Việt. Sau khi đổi lớp/loại việc, phải làm rõ ngữ cảnh mới. Không tự mở bàn phím che tên học viên trên mobile.

### 11.3. Công việc một danh sách vẫn cần lọc

Giữ khả năng lọc người, hạn và loại khi hữu ích. Sắp quá hạn lên đầu từng nhóm không thay cho lọc tất cả việc quá hạn. Nhóm việc quản lý có việc gấp không bị giấu ở cuối chỉ vì đã gập mặc định. Việc chưa có người phụ trách cần lộ rõ để phân công.

**Không có nút Nhắc trong bất kỳ phương án nào.** Hành động tại chỗ là xử lý thực: nhập điểm, ghi nhận xét, xác nhận, chốt phương án, phân công, cập nhật lịch… theo quyền.

### 11.4. Tổng quan ba khối có giới hạn thông tin mở sẵn

Giữ A ba khối; ưu tiên vài việc và vài lớp quan trọng ở đầu, có mở rộng rõ. Không biến ba khối thành ba danh sách rất dài. Nên thử ở màn 1280 px, không chỉ 1440; bộ lọc khi cuộn trên mobile cần gọn nhưng vẫn rõ phạm vi.

### 11.5. Báo cáo số liệu đáng tin

Tách “kết quả trong kỳ” và “việc tồn tại thời điểm xem” nếu cùng xuất hiện. Ghi thời điểm dữ liệu, năm và bộ lọc. Khi in/xuất, không co chữ vô hạn để ép mọi thứ vào một trang A4. Nếu cần bản tóm tắt một trang thì có phụ lục cho chi tiết.

Không dùng 42 học viên × 4 kỹ năng để gọi ngay thành 168 “bài phải chấm” nếu W có W1/W2. Không cộng các nhóm học viên giao nhau thành tổng. So tỷ lệ cần nói rõ phần trăm hay điểm phần trăm. Mẫu ít và thiếu dữ liệu không biến thành kết luận chắc chắn.

### 11.6. Thiết kế nhẹ nhưng không mù thông tin

Chữ số canh giữa khi phù hợp yêu cầu, dùng số có độ rộng nhất quán; tên người và văn bản dài căn trái. Nút chính nổi rõ, nội dung phụ có phân cấp, không phủ chip màu khắp bảng. Màu SOS chỉ hỗ trợ nghĩa đã có bằng chữ/số; chữ trên viền vẫn phải đủ tương phản ở cả sáng/tối.

Ô trống cần phân biệt chưa nhập, không có bài, không được sửa, lỗi tải. Không báo “Đã lưu” khi còn nội dung mới chưa được máy chủ ghi nhận. Nháp phải gắn người dùng/đối tượng/trường, không sang phiên của người khác.

## 12. Bảng câu chữ giao diện để Claude sử dụng

**Claude cần viết tiếng Việt tự nhiên, chuyên nghiệp, ngắn gọn. Không dùng câu hỏi giật gân, tiếng lóng hoặc tên gây quy kết. Giữ các thuật ngữ nghiệp vụ chủ sản phẩm đã chuẩn hóa.**

| Vị trí/ý nghĩa | Câu chữ | Trạng thái |
|---|---|---|
| Bảng lớp cần theo dõi | **Lớp cần chú ý** | CHỐT |
| Nhóm học viên cần theo dõi | **HV cần chú ý** | CHỐT |
| Phân tích Test/SOS | **Test + SOS** | CHỐT |
| Phân tích PA | **Hiệu quả PA** | CHỐT |
| Phân tích giáo viên | **Phân tích GV** | CHỐT theo yêu cầu giữ bảng phân tích GV |
| Case tổng | **Case chưa chốt PA** | CHỐT |
| Case chưa có phương án | **Case trống PA** | CHỐT |
| Hỗ trợ tại chỗ | **?** | CHỐT; tên truy cập mô tả nội dung |
| Đi vào chấm từ lớp | **Nhập điểm** | Đề xuất câu chữ đáp ứng đường vào đã chốt |
| Kết quả nhị phân | **Đạt / Chưa đạt** | Đề xuất GPT; Pass/Fail có thể giải thích ở `?` |
| Thông tin thiếu | **Chưa đủ điểm để đánh giá** | Đề xuất GPT |
| Môn Fail | **Kỹ năng cần cải thiện** | Đề xuất GPT; chi tiết ghi mức thiếu cụ thể |
| Tỷ lệ Pass | **Tỷ lệ đạt** | Đề xuất GPT |
| Vùng dữ liệu điểm thi | **Kết quả thi** | Đề xuất GPT |
| Họp về lịch | **Rà soát lịch thi** | Đề xuất GPT |
| Ý kiến cuộc họp | **Kết luận rà soát** | Đề xuất GPT |
| Tháng cần xem | **Tháng dự kiến thi** | Đề xuất GPT |
| Dời lịch theo tháng | **Chuyển tháng thi** | Đề xuất GPT |
| Chọn lịch cụ thể | **Chốt ngày thi** | Đề xuất GPT |
| Ghi chú trong kế hoạch | **Ghi chú lịch thi** | Đề xuất GPT |
| Lịch sử nhập/sửa | **Lịch sử thay đổi** | Đề xuất GPT |
| Nút trong ảnh | **Xóa**; đề xuất làm rõ thành **Xóa lịch** | Nhu cầu/vị trí CHỐT; nhãn mở rộng chưa chốt |
| Ô tìm Kế hoạch Test | **Tìm lớp, học viên hoặc email…** | Đề xuất GPT |
| Chọn khoảng báo cáo | **Khoảng thời gian** | Đề xuất GPT |
| Lọc tuần | **Từ tuần / Đến tuần** | Đề xuất GPT |
| Xem toàn màn hình | **Mở bảng điểm / Mở hồ sơ / Mở trang xử lý** | Chọn nhãn cụ thể, tránh “Xem thêm” cho mọi thứ |
| Thiếu trường hồ sơ | **Thiếu 2 thông tin** | Đề xuất GPT, rõ hơn “Thiếu 2” |
| Lưu thành công | **Đã lưu lúc 14:32** | Đề xuất GPT |
| Lưu lỗi | **Chưa lưu được. Nội dung bạn nhập vẫn được giữ.** | Chỉ dùng khi nội dung thực sự còn được giữ |
| Không có kết quả tìm | **Không tìm thấy lớp hoặc học viên phù hợp.** | Đề xuất GPT |

Các mẫu xác nhận phải nói đối tượng cụ thể: `Xóa lịch MT4 của Đỗ Trọng Tiến?`, rồi nêu đúng tác động sau khi đã xác định nghiệp vụ. Không viết “Bạn có chắc không?” mà không nói sẽ thay đổi gì.

## 13. Câu hỏi 5–6 trong mockup 3 — giải thích và quyết định đã chốt

**Xác nhận mới nhất của chủ sản phẩm: “1. có / 2. ok / 3. ok” cho ba khuyến nghị dưới đây. Các ý này đã chuyển từ đề xuất GPT thành quyết định CHỐT; Claude không hỏi lại.** Những đề xuất khác trong tài liệu không tự động được chốt bởi xác nhận này.

### 13.1. Câu 5 — Có đưa Chốt lộ trình lên Tổng quan không?

**Câu gốc:** “Cần bạn quyết thêm nhóm Chốt lộ trình khi xem Lớp thường (Cần xử lý cũ có, brief chỉ nêu 3 loại)?”

**Nghĩa đơn giản:** với lớp thường, khi học viên đến lúc cần quyết định lộ trình tiếp theo theo quy trình đang có, QL có cần thấy việc đó ngay trên Tổng quan hay phải vào Công việc/hồ sơ lớp mới thấy? Câu này nói về **vị trí hiển thị**, không tự tạo thêm thủ tục chốt mới.

**[CHỐT Q5]** Có hiển thị **Chốt lộ trình** trong khối cần xử lý trên Tổng quan, chỉ hiện khi có việc thực sự và người xem có trách nhiệm. Bấm mở panel chốt lộ trình tại chỗ; không thêm một card thường trực khi không có việc. Đây là đề xuất GPT đã được chủ sản phẩm đồng ý.

### 13.2. Câu 6 không phải một lựa chọn: nó gộp bảy thay đổi

| Ý trong câu 6 gốc | Giải thích dễ hiểu | Trạng thái sau phản hồi mới |
|---|---|---|
| Bỏ 4 ô số và Điểm đáng chú ý khỏi Tổng quan | Dời phần thống kê tổng hợp sang Phân tích để trang đầu thiên về công việc | **CHỐT:** giữ một dải tóm tắt nhỏ gồm các số dẫn tới công việc; chi tiết thống kê ở Phân tích, không giữ bốn card lớn |
| Phân tích lên thanh trên | Có mục Phân tích riêng, không nằm sâu trong Tổng quan | Đã được đồng ý ở vòng trước, phản hồi mới không phủ định |
| Bỏ Theo tuần/Theo đợt | Bỏ cách nhóm bảng theo tuần hoặc đợt Test | **CHỐT:** giữ bộ chọn tuần/khoảng thời gian và giữ cách nhóm **Theo đợt Test** trong một ô chọn cách xem gọn; không thêm nhiều tầng tab |
| GV → “GV nào trễ chấm?”, chuyển kết quả sang hồ sơ GV | Làm bảng GV chỉ còn tiến độ chấm, kết quả dạy phải mở từng hồ sơ | **Bị bác bỏ rõ.** Dùng Phân tích GV cũ làm nền, giữ kết quả dạy/tiến bộ/PA ở bảng phân tích |
| Tối mặc định → theo máy | Mở sáng/tối theo cài đặt thiết bị | Đã có quyết định trước; đưa tuỳ chọn vào menu |
| Đầu cột 12, không in hoa | Chữ đầu bảng dễ đọc hơn | **Đã chốt** theo khuyến nghị mockup 1 |
| “Đổi” của SOS không tô màu | Chênh lệch số SOS giữa hai kỳ hiển thị chữ trung tính, tránh thêm màu cạnh tranh | Chưa trả lời riêng. **Đề xuất GPT:** ghi `Tăng 2 HV / Giảm 1 HV / Không đổi`, dùng chữ trung tính; không dùng mũi tên gây nhầm |

**[CHỐT Q6a]** Trên Tổng quan, giữ **một dải tóm tắt ngắn**, chỉ chứa số có thể dẫn đến hành động; bấm mở đúng panel làm việc. Thống kê chi tiết đặt ở Phân tích, không phục dựng bốn card lớn. Đây là đề xuất GPT đã được chủ sản phẩm đồng ý.

**[CHỐT Q6b]** Giữ cách nhóm **Theo đợt Test** trong một ô chọn cách xem gọn, không thêm nhiều tầng tab. Bộ chọn tuần/khoảng thời gian vẫn có đầy đủ; hai chức năng không thay thế nhau. Đây là đề xuất GPT đã được chủ sản phẩm đồng ý.

Phần màu của chênh lệch SOS có thể để Claude đề xuất cùng bộ ký hiệu mới; không cần hỏi lại từng mã màu. Các mục đã chốt ở bảng trên không đưa vào danh sách hỏi nữa.

### 13.3. Những điểm khác cần xác minh có chọn lọc

Không hỏi một loạt để trì hoãn cả phương án. Claude có thể làm phần thiết kế còn lại, ghi rõ giả định ở các điểm sau và chỉ xin câu trả lời trước bước triển khai phụ thuộc:

- “Xóa” là xóa lịch để xếp lại hay huỷ lượt MT? Quan trọng vì ảnh chỉ xác định vị trí.
- Bảng kết quả thi gồm loại thi nào và Pass/Fail dùng luật nào? Kiểm code/Rulebook trước khi hỏi lại điều đã có.
- Phần họp rà soát lịch đang nói thi thật hay cả Mock Test? GPT đang đề xuất theo thi thật.
- Ghi chú trong Kế hoạch cần theo từng học viên/lượt hay theo lớp? GPT đề xuất từng lịch làm chính, ghi chú lớp là phần phụ.

## 14. Tiêu chí nghiệm thu và những lỗi không được tái tạo

| Nhóm | Cần chứng minh được |
|---|---|
| Progress/Final lớp thường | Đều xuất hiện trong tuần thi; việc chưa chấm còn sau tuần; quyền nhập thống nhất ở các điểm vào |
| Ký hiệu điểm | Đạt/Chưa đạt không dùng mũi tên lên/xuống; đồng bộ bảng, panel, báo cáo, mobile |
| Hồ sơ lớp | Đúng OVR/L/R/W1/W2/S, không W tổng; hai hàng MT có nhãn, hàng trước ít nổi bật nhưng vẫn đọc được |
| Danh sách Học viên & Lớp | Có OVR/L/R/W/S theo quyết định; W căn giữa và không bị đổi theo quy tắc riêng của hồ sơ lớp |
| Nhập Excel | Nhận cả điểm và nhận xét; mẫu đúng môn/loại điểm; có `?`; không gán sai học viên trùng tên |
| Đường Nhập điểm | Có trong hồ sơ và `…` cuối hàng lớp; không phải chọn lại ngữ cảnh qua nhiều trang |
| Tìm kiếm kế hoạch | Tìm lớp/tên/email; chọn học viên đến đúng hàng; tôn trọng chi nhánh/quyền |
| Xuất Excel | Đúng 13 cột yêu cầu, đúng thứ tự, năm rõ; phạm vi xuất xác định |
| Xuất danh sách tùy nhu cầu (C31) | Có SOS/SOS 3 xuất đúng tập; kết hợp lọc đúng; xuất đủ mọi trang hoặc đúng HV đã chọn; không trùng học viên; phân biệt hiện tại/lịch sử; cột và số lượng khớp phạm vi/quyền; không thay mẫu C17 |
| Hộp xếp lịch | Nút Xóa ở chân hộp đúng đối tượng; tác động rõ, không xoá nhầm điểm/học viên/lớp |
| Ghi chú lịch | Hiện dưới lịch, sửa tại chỗ, tác giả/thời gian/lịch sử có thể xem |
| Lịch sử | Trước/sau, ai, khi nào, nguồn, theo lần lưu; đủ quyền; không bịa lịch sử cũ |
| Thông báo | Không còn nút Nhắc thủ công; không thông báo lặp vô hạn; bấm mở đúng việc; đã đọc khác đã xử lý |
| Tổng quan | A ba khối; nhãn Lớp cần chú ý/HV cần chú ý; hiện Chốt lộ trình khi phát sinh; giữ dải thống kê gọn dẫn tới việc; không giấu việc quan trọng trong nhóm gập |
| Báo cáo | Mặc định 2 tuần hoàn chỉnh trước, chọn thời gian tự do; không có card Đã thi–Chờ KQ |
| Số liệu mở panel | Đúng tập dữ liệu và kết quả chi tiết; có thao tác theo quyền; 0/n không bị mất đường xem mẫu số |
| Kết quả thi | Pass không phân rã kỹ năng Fail trong thống kê; Fail nêu kỹ năng/tiêu chí hụt; thiếu điểm không tự tính Fail |
| Phân tích GV | Giữ chiều sâu bảng cũ, chấm bài chỉ là thành phần; mọi chỉ số có mẫu số/định nghĩa |
| Phân tích thời gian | Chọn từ tuần–đến tuần qua tháng/năm, không chỉ 4/8 tuần; giữ cách xem Theo đợt Test bằng ô chọn gọn; chuyển tab giữ phạm vi |
| Rà soát lịch thi | Phân biệt ý kiến dự kiến với lịch đã chốt; chuyển tháng không mất dấu quyết định hoặc tạo học viên trùng |
| Responsive và nhập liệu | Kiểm mobile khi bàn phím mở, 1280/1440, zoom; không mất tên/ngữ cảnh/nút lưu |

Những điểm bất nhất của mockup cũ vẫn cần kiểm lại: tổng 84 việc so với các nhóm cộng 88; chip `SOS 2 tạm · W` chỉ ghi một kỹ năng; trộn “bài chấm” với “Kết quả PA”; phân rã Case chưa đủ trạng thái; 42 × 4 chưa chắc là số bài chấm. Đây là dấu hiệu cần xác minh ở fixture/nhãn/code, chưa được gọi là lỗi production nếu chưa kiểm.

## 15. Yêu cầu đầu ra và cách Claude tiếp tục

**Nhắc lại: bạn được tự do overhaul TOÀN BỘ website, từng chữ và từng panel. Hãy dùng quyền này để đưa ra phương án nhất quán và đơn giản hơn, không tự giới hạn trong ba mockup.**

1. Đọc yêu cầu mới và đối chiếu `plan.md`, Rulebook, source hiện hành. Lập bảng ngắn **giữ / thay / cần xác minh**, gắn mã C01–C31 để không sót. Quyết định mới ghi rõ thay chỉ dẫn cũ nào.
2. Lập bản đồ trang, panel, số liệu có thể bấm, đường nhập/sửa, nhập Excel và lịch sử trên toàn website. Được thay tổ chức cũ; phải giữ chức năng cần thiết và quyền đúng.
3. Đề xuất một cấu trúc tổng thể nhất quán. Với phần họp lịch thi và bảng GV, phản biện phương án GPT, thêm option nếu tốt hơn, rồi chọn phương án khuyến nghị.
4. Dùng bảng câu chữ mục 12 làm nền. Rà lại mọi nhãn, thông báo lỗi, trạng thái rỗng, xác nhận và hướng dẫn; viết tiếng Việt cụ thể, không nhãn mơ hồ hoặc câu hỏi thiếu chuyên nghiệp.
5. Làm rõ các điểm nghiệp vụ còn mở bằng ví dụ ngắn. **Không hỏi lại** SOS chỉ viền, cỡ chữ, đưa vào menu, hai hàng điểm hồ sơ, tên bảng, bỏ Nhắc, hai tuần báo cáo, chọn khoảng linh hoạt, đường nhập điểm, hiện Chốt lộ trình khi cần, giữ dải tóm tắt gọn hoặc giữ cách xem Theo đợt Test đã chốt.
6. Khi dựng mockup/triển khai, dùng cùng bộ dữ liệu cho các màn liên quan, có tình huống thiếu điểm, trùng tên, đã có điểm, lỗi mạng, hai người sửa, mobile, tháng/năm giao nhau. Bấm được thì phải mở đúng dữ liệu và xử lý được như thiết kế, không chỉ vẽ nút.
7. Phân kỳ theo luồng hoàn chỉnh và phụ thuộc dữ liệu, tránh một đợt sửa chỉ có giao diện đẹp nhưng đường làm việc vẫn rời rạc. Ưu tiên: nguồn dữ liệu/nháp/lịch sử → lưới/chấm/Excel/kế hoạch → panel tại chỗ/thông báo → phân tích/báo cáo → rà soát lịch thi; có thể đổi thứ tự nếu giải thích hợp lý.
8. Không báo đã hoàn thành hoặc đã kiểm thử khi mới dựng mockup. Nêu rõ phần đã đọc, đã chạy, chưa xác minh. Quyền thiết kế lại không đồng nghĩa được bỏ dữ liệu lịch sử hoặc tự đổi công thức nghiệp vụ chưa được xác định.

**Đầu ra hữu ích nhất:** bảng quyết định đã chuẩn hóa; phương án cấu trúc toàn web; mockup/luồng đại diện có trạng thái; định nghĩa số liệu và lịch sử; bảng ánh xạ chức năng cũ → mới; danh sách ngắn câu hỏi còn mở kèm khuyến nghị; sau đó là kế hoạch xây dựng phù hợp với nhiệm vụ Claude được giao.

Không có yêu cầu giữ nguyên kiến trúc kỹ thuật. Nếu cần xây lại phần lớn mã, hãy chỉ ra lợi ích, đường chuyển dữ liệu và cách bảo toàn hành vi đúng; nếu tái sử dụng tốt hơn, cứ tái sử dụng. **Thước đo là trải nghiệm sử dụng và tính đúng, không phải số dòng viết lại.**

## 16. Nguồn đã dùng và phạm vi xác minh

- Phản hồi chủ sản phẩm ngày 18/10/2026 trong cuộc trò chuyện này: nguồn quyết định ưu tiên cao nhất.
- Ảnh `Screenshot_2 - Phương Nguyễn PISA.png`: đã xem trực tiếp; phần hộp xếp lịch được mô tả tại C19 để Claude không cần nhận lại ảnh.
- Ba mockup ngày 17/10 trong `thiet-ke/`, nhánh `claude/plan-ov14-mockup`, commit `7a1361974a89a8d0b9148a20b91abdbf3aaa380c`.
- Repo [Pizi147/pisa-tracking](https://github.com/Pizi147/pisa-tracking), bản nguồn tra cứu `4f4043a4f3f52b1483b84427024fbbf9cd5de823`.
- [PhanTichGiaoVien.tsx](https://github.com/Pizi147/pisa-tracking/blob/4f4043a4f3f52b1483b84427024fbbf9cd5de823/web/src/modules/phanTich/PhanTichGiaoVien.tsx): đã đối chiếu các nhóm chỉ số, bộ lọc và đường mở chi tiết.
- [TimLop.tsx](https://github.com/Pizi147/pisa-tracking/blob/4f4043a4f3f52b1483b84427024fbbf9cd5de823/web/src/modules/test/keHoach/TimLop.tsx) và [KeHoachTestTab.tsx](https://github.com/Pizi147/pisa-tracking/blob/4f4043a4f3f52b1483b84427024fbbf9cd5de823/web/src/modules/test/KeHoachTestTab.tsx): đã xác minh tìm theo lớp ở khu vực này.
- [HopKyNang.tsx](https://github.com/Pizi147/pisa-tracking/blob/4f4043a4f3f52b1483b84427024fbbf9cd5de823/web/src/modules/test/keHoach/HopKyNang.tsx): đã đối chiếu hộp lịch một đợt, menu Huỷ MT/Nhật ký và phân biệt với panel xếp lịch hàng loạt.
- Ảnh repo `thiet-ke/anh/pr-ov11h/ql-1440-toi-giao-vien-thuong.jpg`: đã xem để đối chiếu bảng GV cũ.

Đợt này chưa sửa repo/website, chưa chạy thử luồng mới. Nội dung brainstorm được gắn nhãn, không đánh đồng với yêu cầu đã chốt hay tính năng đã triển khai.
