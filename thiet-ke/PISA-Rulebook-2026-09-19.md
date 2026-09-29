# PISA Progress — Rule book: SOS, case, phương án và Test

Phiên bản 1.2 · 21/09/2026 · Cập nhật theo chốt mới nhất của chủ sản phẩm.

> **ĐỌC MỤC 19 RỒI MỤC 18.** Mục 19 (tối 21/09, rulebook v3) ưu tiên hơn mục 18.
>
> **Mục 18:** Chốt ngày 21/09/2026 **bỏ hẳn mô hình Case Ý thức**, thay bằng
> **Vi phạm** và **Biện pháp xử lý** quan hệ nhiều–nhiều. Mục 18 ưu tiên hơn mục 6, mục 17.2
> và mọi đoạn nói về Case Ý thức, đợt Ý thức, cửa sổ gộp ba ngày, hạn 3/5/7 ngày của Ý thức.
> Phần Học thuật chỉ sửa bốn điểm (mục 18.2), phần còn lại giữ nguyên.
> Đặc tả đủ chi tiết để code: `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`.

**Ưu tiên mục 17 khi triển khai** *(trong phạm vi không trái mục 18)*: dấu '-' còn đến hết Chủ nhật được xác lập là không dự thi, không còn bắt GVCN xác minh thường lệ; Ý thức chỉ gộp trong BA ngày đầu và hoàn thành bằng bằng chứng thực hiện, không đánh giá cải thiện; SOS không tự sinh PA trao đổi. Những đoạn lịch sử trái các chốt này hết hiệu lực. **Cập nhật 20/09/2026:** các điểm C01–C10 đã được chủ sản phẩm trả lời — xem mục 17.7 (C01 chờ xác nhận cách hiểu, C08 còn một nửa chưa rõ).

## 1. Cách sử dụng và nguồn

Đây là luật sản phẩm và sổ điểm cần làm rõ, không phải chứng nhận mọi luật đã được triển khai. Không dùng code hiện tại để tự động thay thế quyết định của chủ sản phẩm.

Nhãn:
- **Đã chốt:** quyết định trực tiếp hoặc quy tắc đã ghi trong sổ được duyệt, chưa có quyết định thay thế.
- **Đang có trong code:** xác nhận cách hệ thống tính tại PR28; không tự coi comment nói “owner chốt” là bằng chứng đủ để giải quyết mâu thuẫn.
- **Cần chốt:** hai nguồn mâu thuẫn hoặc chưa đủ chi tiết để triển khai an toàn.
- **Đề xuất:** cải tiến mới, chưa tự áp thành luật.

Nguồn đối chiếu:
1. Hội thoại hiện tại và các quyết định nối tiếp từ PR15 đến PR28.
2. `PISA-PR17-Audit-and-Change-Register.md`, bản 2, nhất là mục 2 và 13–14.
3. `PISA-Design-Plan-after-PR28.md`, bản 1.2, mục 17–19.
4. `Pasted markdown(20260919-122702).md` do người dùng gửi lại: prompt lịch sử cần bảo toàn, không mặc nhiên mới hơn các quyết định đã thay thế nó.
5. Code tại merge PR28 `bc5c88d769654e631269d3d00ab35fc85d8f180d`: `shared/domain/fasttrack.ts`, `shared/domain/cases.ts`, `server/src/fasttrack/scoring.ts`, `skillSchedule.ts`; `plan.md`, `BAN_GIAO.md`.
6. Ảnh hồ sơ MT Phạm Bảo Ngọc vừa gửi, đọc trực tiếp trong hội thoại. Chưa xác minh SHA của bản localhost; chưa chạy kiểm thử bằng các vai trò.

Thứ tự ưu tiên: quyết định trực tiếp mới nhất → sổ chốt có nguồn → prompt lịch sử → code hiện hành. Khi chưa xác định được thứ tự/ý nghĩa, đánh dấu cần chốt; không tự chọn luật thuận tiện nhất.

## 2. Các khái niệm không được nhập làm một

| Khái niệm | Ý nghĩa |
|---|---|
| SOS | Kết quả cảnh báo từ điểm và kỳ vọng của một đợt Test; không phải mức gấp do GV chọn |
| Tín hiệu cần xác minh | Dữ liệu điểm cho thấy cần tìm nguyên nhân; chưa phải case đã chẩn đoán đầy đủ |
| Case học thuật | Một vấn đề cụ thể của học viên, thuộc đúng kỹ năng và có phân loại |
| Case Ý thức/Khác | Một đợt xử lý vấn đề BTVN, chuyên cần, tham gia trên lớp hoặc khác; có thể có nhiều báo cáo nguồn |
| Phương án (PA) | Một hoạt động hỗ trợ có người thực hiện, thời gian và kết quả riêng |
| Kết thúc PA | Kết thúc hoạt động đó; không tự đóng case |
| Hoàn thành case | Kết luận vấn đề sau khi các việc liên quan đã được xử lý hợp lệ |
| Đủ điểm đợt Test | Đã có đủ điểm những kỹ năng bắt buộc của đúng đợt; không đồng nghĩa đạt kỳ vọng |
| Đạt Overall | Điểm Overall đủ dữ liệu và đạt kỳ vọng; không đồng nghĩa mọi môn đều đạt, không tự xóa SOS từng môn |
| Không có bài ('-') | GV báo không có bài; được sửa trong tuần. Nếu còn dấu '-' hết Chủ nhật thì xác lập không dự thi theo mục 17 |
| Dời lịch thi / hẹn xử lý bài | Hai thao tác khác nhau; không đổi tuần thi quá khứ chỉ để xóa quá hạn chấm |

## 3. SOS và điểm Test

### 3.1. Chọn kết quả hiện hành — đã chốt

- SOS hiện tại lấy đợt gần nhất có kết quả hợp lệ, không lấy mức cao nhất toàn bộ lịch sử.
- Đợt mới chưa có điểm không được biến học viên thành “đã đạt”; phải cho biết kết quả đang hiển thị thuộc đợt trước.
- Đợt mới có một phần điểm: đánh giá trên phần có căn cứ và ghi rõ tạm thời, số môn đã có điểm/tổng môn yêu cầu. Không ghép điểm MT cũ vào môn còn thiếu của MT mới.
- Điểm thiếu khác điểm 0. Thiếu kỳ vọng/target không tự tính là đạt hay trượt.
- Một môn đã có điểm dưới kỳ vọng cần được hỗ trợ, không phải chờ toàn đợt chấm xong.
- SOS tạm thời và kết quả cuối phải tách trong báo cáo; chưa đủ điểm không hiện badge đạt cuối cùng ở Overall.

### 3.2. Công thức FT đang có trong code — giữ khi chưa có quyết định đổi

| Nội dung | Công thức/điều kiện |
|---|---|
| Kỳ vọng MT1 | Target của lộ trình tại thời điểm đánh giá − 1.0 |
| Kỳ vọng MT2 | Target − 0.5 |
| Kỳ vọng MT3 trở đi | Bằng target |
| Kỳ vọng lộ trình RF (PR-MT, M2) | **Mọi MT bằng target**; PA quy chế theo hàng "MT3 trở đi", Phối hợp theo hàng MT4. Lộ trình là lộ trình **của lượt** |
| Band W1, W2, S | Trung bình đủ 4 tiêu chí, làm tròn 0.5 theo bộ tính hiện hành |
| Writing tổng | `(W1 + 2 × W2) / 3`, làm tròn 0.5 |
| Overall | Trung bình L/R/W/S, làm tròn 0.5; chỉ có khi đủ cả bốn kỹ năng và đợt yêu cầu cả bốn |
| SOS1 | Một kỹ năng dưới kỳ vọng |
| SOS2 | Hai kỹ năng dưới kỳ vọng |
| SOS3 | Ba hoặc bốn kỹ năng dưới kỳ vọng |

SOS đếm bốn kỹ năng L/R/W/S, không đếm W1 và W2 thành hai môn SOS. Các ô nhập FT vẫn là L/R/W1/W2/S.

L/R dùng bảng quy đổi số câu đúng của trung tâm đang có trong code, không tự thay bằng bảng trên mạng. Việc thay bảng quy đổi là thay luật riêng.

**Writing hai tầng đang có trong code:** nếu Writing tổng đạt thì không tự sinh tín hiệu hỗ trợ W1/W2 chỉ vì một task thấp. Nếu Writing tổng dưới kỳ vọng, xét task nào dưới kỳ vọng để giao về đúng môn. Thiếu một task thì chưa kết luận Writing tổng. GV vẫn có thể báo vấn đề thực tế độc lập. Nếu muốn thay quy tắc hai tầng, cần chốt riêng.

### 3.3. Normal — đã chốt

- Mỗi đợt Progress/Final phải hoàn thành đủ L/R/W/S, dù thực hiện ở 2–3 tuần khác nhau.
- Mỗi kỹ năng đạt khi `điểm đạt / tổng điểm >= 70%`; không làm tròn tỷ lệ trước khi so. Ví dụ 7/10 đạt, 23/33 chưa đạt.
- Không dùng band/target FT để chấm Normal. Writing Normal là W riêng, không gộp vào W2.
- Thiếu môn không suy thành “đạt cả đợt”. Không hủy nghĩa vụ kiểm tra để đóng đợt thiếu môn.
- Ngưỡng SOS theo số môn dưới chuẩn cần dùng cùng định nghĩa đã chốt cho Normal; nghiệm thu cả ba mức và trường hợp thiếu môn. Không suy số môn chưa nhập là số môn trượt.

### 3.4. Tín hiệu và hiệu chỉnh — đã chốt

- Có SOS thì phải cập nhật/xác minh case trong **3 ngày tính cả ngày đầu**. Không áp lại hạn SOS1=7, SOS2=5, SOS3=3 cho bước này.
- GV phải tìm và ghi nguyên nhân/phân loại trước khi trở thành case hoàn chỉnh. Không tự gán “Khác” như thể đã xác minh.
- Không tự tạo tutor/tự học chỉ vì có SOS. Hệ thống có thể gợi ý; người có quyền chọn phương án phù hợp.
- Sửa chính điểm đã nhập nhầm: tính lại kết quả, thu hồi tín hiệu sai và việc suy ra không còn căn cứ; giữ lịch sử sửa. Không xóa công việc thật đã thực hiện hoặc case có căn cứ độc lập.
- MT sau đạt thật: cập nhật SOS hiện tại, giữ hành trình trước đó; người phụ trách kết luận case. Không tự đóng tất cả case chỉ vì điểm đạt.
- **Cần chốt C01:** sau xác minh SOS trong 3 ngày, PA đầu tiên cũng phải có trong cùng hạn hay có hạn riêng? Các nguồn đang dùng “cập nhật case” và “có phương án” không hoàn toàn đồng nghĩa.

### 3.5. Cách hiển thị — đã chốt

- Đỏ: dưới kỳ vọng; xanh dương: bằng; xanh lá: vượt; xám: chưa đủ dữ liệu.
- +/- chính là chênh lệch so với kỳ vọng. Xu hướng so với MT trước là thông tin phụ có nhãn riêng.
- Lịch sử giữ kỳ vọng đúng thời điểm từng MT. Đổi target có lý do và ngày hiệu lực, không âm thầm tô lại lịch sử theo target mới.
- SOS hiện tại, số case mở và số PA là ba đơn vị khác nhau.

## 4. Case học thuật

### 4.1. Tạo và phân loại

- Tên **và mô tả bắt buộc** theo prompt lịch sử đã được sổ PR17 xác nhận thay thế yêu cầu cũ mô tả tùy chọn.
- Có khối đính kèm **file/link tùy chọn ngay trong phần mô tả**. Giữ tác giả, ngày, tên tài liệu và quyền xem. Upload lỗi không làm mất nội dung đang nhập.
- Chọn học viên, nhóm và kỹ năng phù hợp chương trình; chọn phân loại vấn đề bắt buộc khi xác minh/tạo case hoàn chỉnh.
- FT L/R/W1/W2/S; Normal L/R/W/S. Không ép Normal dùng rubric IELTS.
- Phân loại thuộc case; PA tham chiếu lại, không bắt chọn cùng thông tin hai lần.
- Listening theo prompt: Từ vựng/Ngữ pháp; Tư duy và kỹ năng làm bài; Tâm lý và độ tập trung; Ngôn ngữ; Khác.
- Reading: Từ vựng/Ngữ pháp; Kỹ năng làm bài; Tư duy logic; Quản lý thời gian; Khác.
- W1/W2/S: giữ danh mục đã có, không tự sáng tác lại; bản danh mục đầy đủ cần đưa vào phụ lục từ nguồn chuẩn trước khi đổi taxonomy. Không chọn “chưa rõ” cho case hoàn chỉnh.
- Ngày theo dõi mặc định hôm nay. Luồng nhập bù có quy tắc riêng ở mục 7; không dùng backdate để xóa trách nhiệm quá hạn.
- Cho phép nhiều case song song có chủ ý, kể cả cùng kỹ năng nếu vấn đề khác. Khi nghi trùng, gợi ý bổ sung case cũ; không bắt mọi vấn đề cùng kỹ năng chung một case.
- Case tiếp tục qua nhiều MT; kết quả MT mới là mốc của quá trình theo dõi, không mặc nhiên tạo bản sao mỗi tuần.

### 4.2. Mức độ và quyền

- Sổ PR17 đã ghi prompt mới giữ **Cần chú ý/Gấp** để tính hạn; bỏ Bình thường. Yêu cầu bỏ badge Gấp ở tiêu đề không đồng nghĩa xóa toàn bộ cơ chế hạn.
- Case GV báo: học thuật cần có PA trong 5 ngày (Cần chú ý) hoặc 3 ngày (Gấp), tính cả ngày đầu theo quy ước đã ghi.
- SOS có hạn xác minh riêng 3 ngày như mục 3.4; không dùng lựa chọn Cần chú ý để kéo dài hạn SOS.
- QL trong phạm vi và GVBM đúng môn được tạo/xử lý học thuật. Sổ/plan sau đó ghi GVCN có quyền cả lớp, rộng hơn prompt cũ chỉ đúng môn: **C02 cần xác nhận phạm vi GVCN**, không tự mở thêm quyền.
- Vai trò quản lý phạm vi không đồng nghĩa mọi công việc là “việc của tôi”.

## 5. Phương án học thuật và hoàn thành case

- Một case có thể có nhiều PA chạy song song, chủ trách nhiệm, ngày bắt đầu/kết thúc và kết quả riêng.
- Danh mục tự thực hiện trong prompt: ba loại cũ và Tăng cường bài tập. Không bịa tên ba loại khi chưa trích đủ danh mục chuẩn. Phương án ngoài danh mục phải xin QL, gồm Hỗ trợ học thuật/Khác theo luồng duyệt.
- Mô tả PA bắt buộc; cho file/link. Mặc định Đang theo dõi; nhập PA đã xong phải có ngày và kết quả phù hợp, không tự coi ngày quá khứ là bằng chứng đã hoàn thành.
- Dự kiến kết thúc mặc định Chủ nhật tuần tiếp theo nếu chưa chọn, theo prompt. Đây khác hạn cập nhật tuần.
- GVBM phụ trách cập nhật **từng PA đang theo dõi trước hết Chủ nhật hằng tuần**; không bắt nhập lại thông tin không đổi.
- Cập nhật có hai lựa chọn rõ: **Tiếp tục theo dõi / Kết thúc phương án**. Kết quả và ghi chú; không có điểm tự chấm ở bước này.
- Năm mức: Có tiến bộ; Tiến bộ một phần; Không tiến bộ; Kém hơn; Chưa đủ dữ liệu. Giữ mã/nhãn hiện hành tương ứng, không biến “chưa đủ” thành thất bại.
- Chưa đủ dữ liệu: tiếp tục theo dõi, không đóng PA như một kết quả xác định và không vào tổng hợp hiệu quả.
- PA đã kết thúc có kết quả xác định mới đóng góp một lần vào hiệu quả. Nhiều cập nhật của một PA không thành nhiều PA thành công.
- Nút hoàn thành case thực hiện kết luận, không có vòng “chọn hướng xử lý” chung bắt buộc dư thừa. Các PA/duyệt còn dở phải được giải quyết hoặc dừng có lý do, không bị âm thầm đánh dấu xong.
- Đánh giá chi tiết ở kết luận học thuật là tùy chọn, chỉ đúng kỹ năng: L Section1–4; R Passage1–3; W1/W2/S bốn tiêu chí tương ứng. L/R dùng đạt/tổng, không band giả cho section. Normal không ép bộ đề/rubric IELTS không phù hợp.
- Điểm quan sát khi kết luận không ghi đè điểm Test và không thay SOS.
- Case mở/cập nhật mới ở trên; case đã hoàn thành bên dưới. Kết quả gần nhất của mỗi PA có ngày ngay cạnh.

## 6. Ý thức/Khác — không dùng vòng đời học thuật

### 6.1. Nhóm, nguồn và quyền — đã chốt

- BTVN / Chuyên cần / Tham gia trên lớp / Khác. Chọn nhóm một lần, không hỏi thêm một ô phân loại trùng nghĩa.
- GV trong lớp được báo vấn đề; QL/GVCN phụ trách xử lý và tạo PA Ý thức. Không yêu cầu học viên phải SOS mới được báo.
- Mỗi case là một đợt, có thể có nhiều nguồn môn/GV/ngày/mô tả/bằng chứng. Không ghi đè báo cáo trước khi gộp.
- Nhiều nguồn trong một đợt có thể dùng chung PA, ví dụ một báo cáo gia đình tổng hợp vấn đề của L và W1.
- Không tự gắn mức SOS học thuật cho chuyên cần/BTVN.

### 6.2. Gộp và tái diễn — đã chốt, còn một điểm hạn cần giải quyết

- Cùng học viên và cùng phân loại, báo cáo trong **3 ngày lịch tính cả ngày mở** gộp vào case đang tồn tại. Mở 14/09: gộp 14–16/09; từ 17/09 tạo đợt mới. Gộp không khởi động lại cửa sổ ba ngày.
- Báo cáo mới hợp lệ được gộp làm mức chuyển Gấp; giữ từng nguồn để mở đọc. Retry/lưu lại không được thành báo cáo mới.
- Đợt mới liên kết tái diễn lần 2/3…, không tính mỗi nguồn trong cùng đợt là một lần tái diễn.
- Đợt cũ chưa đóng vẫn còn, không bị đợt mới ghi đè hoặc reset hạn.
- Case Ý thức hạn hoàn thành **7 ngày tính cả ngày đầu**: mở 14/09 → hết 20/09.
- PA Ý thức phải **được thực hiện xong** trong 3 ngày nếu Gấp hoặc 5 ngày nếu Cần chú ý; khác học thuật chỉ cần có PA trong hạn đó.
- **C03 — nguồn mâu thuẫn:** sổ ví dụ dùng hạn Gấp từ ngày mở (14→16/09), code `deadlineAfterRaise` dùng ngày nâng mức +2 và không muộn hơn hạn cũ (nâng 16→18/09). Hai kết quả khác nhau; cần chọn trước khi sửa. Giữ nguyên dữ liệu gốc trong khi chờ.
- **C04:** nếu đợt đã đóng trong cửa sổ bốn ngày rồi có báo cáo mới, chưa có quyết định đủ rõ về mở lại/gộp hay tạo đợt; đề xuất tạo đợt mới liên kết, không viết lại kết luận cũ.

### 6.3. Phương án và kết luận

- GV tự thực hiện theo quyền: Báo cáo gia đình, Trao đổi học viên, Gửi thư cảnh cáo.
- Cần QL duyệt: Trao đổi với CX/GĐCN, Lùi lịch thi, Khác. Duyệt PA “lùi lịch” không được bỏ qua luật lịch MT/Normal tương ứng.
- Hoàn thành Ý thức: một thao tác Hoàn thành kèm bằng chứng thực hiện (ghi chú, file, ảnh hoặc link); không ép năm mức cải thiện hoặc một vòng theo dõi kết quả hành vi. Một case có thể có nhiều PA dùng chung cho các nguồn gộp. Cách xử lý PA còn dở và đếm hành động xem mục17.
- Tạo mới Ý thức: plan repo sau đó ghi ngày mở hôm nay, không tự chọn ngày/hạn. Việc lịch sử đi luồng nhập bù. Đây là quyết định ghi trong plan repo, cần đối chiếu khi thay đổi, không đưa trở lại ô backdate trong form thường.
- **C05 đã chốt:** mọi SOS chỉ báo vấn đề. GVCN tự quyết định có trao đổi hay không, tự tạo PA phù hợp và hoàn thành trong khung thời gian đã chốt. Không tự sinh case Ý thức hoặc hai PA trao đổi bắt buộc sau mỗi SOS.

### 6.4. Báo cáo Ý thức

Đếm riêng: HV duy nhất, đợt case, báo cáo nguồn, số báo cáo gia đình/thư cảnh cáo đã thực hiện, đợt tái diễn, việc còn hạn/quá hạn. Không dùng tỷ lệ thành công học thuật. Ví dụ một HV, hai nguồn gộp, hai PA: HV=1; case=1; báo cáo=2; PA=2.

## 7. Nhập bù và dữ liệu lịch sử

Plan repo PR28 ghi luồng “Đã xong từ trước” cho cả học thuật/Ý thức: ngày thực tế, ngày hoàn thành bắt buộc, nhiều PA với tên/người làm/từ–đến; kết luận/ghi chú một lần cho case.

- Case nhập bù vẫn ở hồ sơ và hành trình; không sinh nợ cập nhật của các tuần trước ngày nhập.
- Theo plan hiện hành, **case nhập bù không vào mẫu số hiệu quả hỗ trợ**. Không tự đưa lại bằng suy luận ngày quá khứ là dữ liệu đủ tin cậy.
- Không sao chép kết luận case thành kết quả độc lập của mọi PA chạy song song.
- Ngày theo dõi học thuật ở form thường và nguyên tắc “chỉ nhập bù được ngày quá khứ” trong plan chưa hoàn toàn nhất quán: **C06**, cần tách “phát hiện trước đây nhưng đang xử lý” với “đã hoàn thành từ trước”.

## 8. Một đợt Test, nhiều lịch kỹ năng

- Một học viên × một đợt có một định danh; L/R/W tuần này, S tuần sau vẫn cùng đợt.
- Mỗi kỹ năng có lịch và hạn nhập điểm riêng. Dời S không đổi L/R/W đã thi hoặc đã chấm.
- FT mặc định đủ bốn kỹ năng, Writing có W1/W2. QL có thể chốt trước một đợt chỉ 1–2 kỹ năng; đủ phạm vi đó thì hoàn tất, không bịa Overall.
- Không bỏ kỹ năng khỏi phạm vi sau khi học viên vắng để biến đợt thiếu thành đủ. Normal luôn đủ L/R/W/S.
- **C07:** nếu muốn đợt FT chỉ W1 hoặc W2, mô hình đánh giá hiện tại yêu cầu Writing tổng từ cả hai task; chưa có luật chốt riêng. Không lặng lẽ dùng W1 thay Writing tổng.
- Tuần kế hoạch hoàn tất là tuần muộn nhất của các môn bắt buộc. Dùng để nhóm kết quả đợt trong bảng tuần; không phải ngày hoàn thành thật hay tuần nhập điểm.
- Bảng chấm theo tuần dùng lịch kỹ năng; không chỉ lọc bằng tuần hoàn tất đợt, khiến RLW tuần trước bị mất.
- Có lịch thì được nhập điểm theo quyền; không bắt bấm “Đã thi” trước. Không tự ghi đã thi thật chỉ vì đến ngày.

## 9. Dời lịch, chờ bài, vắng và hủy

| Tình huống | Người xử lý | Cách xử lý đã chốt |
|---|---|---|
| FT đổi lịch chủ động | QL, sau phối hợp GVCN | Sửa lịch tại Kế hoạch MT, Lộ trình hoặc hồ sơ đợt; không tính là vắng |
| Normal đổi lịch kỹ năng | QL/GVCN trong phạm vi; GVBM đúng môn | Được xếp lại, không hủy nghĩa vụ đủ bốn môn |
| Chưa thấy bài khi chấm | GV được giao môn/người có quyền nhập hộ | '-' tạo trạng thái chờ bài và hẹn xử lý; không tự xác nhận vắng |
| FT xác minh vắng lần đầu | GVCN | Dời đúng kỹ năng sang tuần kế tiếp, ghi lần vắng |
| FT vắng từ lần hai | QL duyệt đề nghị | Chưa duyệt không coi lịch mới đã chốt |
| FT không được duyệt/hết hạn xử lý theo luật duyệt | QL/luồng được quy định | Hủy phần bị ảnh hưởng, giữ điểm các phần đã làm; chỉ QL khôi phục và xếp lại |
| Normal chưa thấy bài/vắng nhiều lần | GV/GVCN/QL theo phạm vi | Tiếp tục theo dõi và xếp lại; không áp hủy MT |

### 9.1. Dấu '-' — phiên bản cũ đã bị thay thế

**Không triển khai các gạch đầu dòng cũ bên dưới nếu trái mục17.1.** Đặc biệt, yêu cầu GVCN xác minh mọi dấu '-' trước khi tính vắng và chỉ hoãn chấm vô thời hạn đã hết hiệu lực. Giữ phần bảo toàn điểm, quyền đúng môn và chống ghi lặp.

- L/R: nhập '-' thay điểm; W1/W2/S: một dấu '-' trong bốn tiêu chí đủ báo chưa thấy bài cho đúng bài đó.
- Ô trống chỉ là chưa nhập; '-' không phải 0. Không xóa các môn khác.
- Đã có điểm chính thức thì không cho '-' xóa âm thầm; dùng hiệu chỉnh điểm có lý do.
- Lùi **hẹn xử lý/chấm** một tuần, không lùi tuần thi mặc định và không tăng bộ đếm vắng.
- Giữ hạn gốc, lý do và ngày hẹn mới. Thông báo việc xác minh cho GVCN nhưng không chặn việc lưu điểm các môn khác.
- Retry cùng lần lưu không lùi thêm tuần. Báo thiếu nhiều tuần phải hiện số tuần chờ, không biến mất khỏi hàng công việc.
- Nếu khoản nợ cũ nhiều tuần, ngày hẹn mới phải ở tương lai so với lúc xử lý, không lấy tuần kế của một ngày đã quá khứ. Hiện ngày trước lưu.
- GVCN xác minh vắng thì mới áp cơ chế vắng FT; hoãn chấm không né trạng thái vắng/chờ duyệt/hủy đã xác lập.

### 9.2. Khoảng cách, hạn và tuần

- Không dời phần cuối MT trước trùng/vượt phần đầu MT sau theo sổ đã chốt. Hai đợt cách một tuần có cảnh báo; RLW/S của cùng một đợt không bị cảnh báo như hai MT.
- Dời lịch đã thi không được dùng để xóa quá hạn chấm. Sửa ngày ghi nhầm phải có lịch sử riêng.
- FT: hạn chấm mặc định hết thứ Tư tuần kế tiếp tuần thực hiện kỹ năng. Ví dụ tuần 14–20/09 → 23/09; S tuần 21–27/09 → 30/09.
- Normal: sổ trước ghi hạn Chủ nhật; chưa nêu đủ rõ là Chủ nhật tuần thi hay tuần kế cho mọi loại Test: **C08 cần khóa mốc chính xác**, không áp mặc định FT.
- Có hạn riêng phải có quyền/lý do, giữ hạn gốc. Hạn thực hiện PA, cập nhật PA, nhập điểm và duyệt lịch không dùng chung một trường.
- Tuần Thứ Hai–Chủ nhật, ngày nghiệp vụ Việt Nam; demo dùng ngày demo nhất quán. Dữ liệu nhập sau ngày demo cần cách xử lý rõ, không gây mốc tương lai vô lý.
- Week picker dùng chung: Trước/Sau/Tuần này, gõ ngày/chọn tuần bằng lịch, luôn có tuần hiện tại, giữ tuần từ liên kết/URL; không lấy tuần xa nhất mặc định.
- **C09:** thời điểm tự hết hạn đề nghị dời lần hai cần ghi rõ giờ/ngày và xử lý khi QL chưa phản hồi; không tự suy “chưa phản hồi” bằng “từ chối” nếu chưa có cấu hình được duyệt.

## 10. Phân quyền, hồ sơ và các luật phụ trong prompt gửi lại

Không bỏ sót các mục ngoài ba nhóm luật chính:

| Mục | Quy tắc cần giữ |
|---|---|
| Admin | Chỉ bỏ Admin chi nhánh, giữ System Admin; thay câu cũ “bỏ hẳn Admin” |
| Tìm kiếm | HV, lớp và GV theo quyền; GV không tìm/xem hồ sơ chuyên môn đồng nghiệp |
| Thêm HV | Chọn lớp trước, dán bảng vào đúng lớp đó; '-' ở thông tin nhập là thiếu dữ liệu, khác lệnh chờ bài ở ô chấm |
| Đầu vào FT | Họ tên, ngày sinh, OVR/L/R/W/S, target, tuần bắt đầu; thông tin chưa có để thiếu hợp lệ |
| Đầu vào Normal | OVR theo yêu cầu cũ; không ép target/lộ trình LT của FT |
| Tạo lớp | Phân công GVBM/GVCN ngay trong form; một môn một GV; GVCN dạy ít nhất một môn của lớp |
| Chọn GV | Combobox gõ tìm; chỉ người được phân công giảng dạy tại CN, không suy từ quyền QL toàn hệ thống |
| Thông tin HV | QL/GVCN sửa thông tin theo quyền: tên, ngày sinh, đầu vào, tư vấn viên, mục tiêu/lộ trình/thi dự kiến phù hợp chương trình |
| Thi thật FT | Có thể mới biết tháng, sau bổ sung tuần/ngày; không ép ngày giả và không hiện “chưa xác định tuần” cạnh tháng đã có |
| Đổi target | Lý do và ngày hiệu lực; cùng nguồn dữ liệu giữa Thông tin HV và Lộ trình |
| Lộ trình | QL chốt lịch MT; GVCN không có toàn quyền lịch FT chủ động chỉ vì được sửa thông tin lộ trình |
| Chuyển lớp | CN → lớp; ngày hiệu lực, lý do, bàn giao, lưu ý, người nhận. Bắt đủ thông tin; có lựa chọn “Không có lưu ý” rõ ràng |
| Kết luận FT | Kết quả IELTS thật và ghi chú; không ép chọn một MT làm kết quả thi thật; học lại mở lộ trình mới |
| Kết luận Normal | Dùng Final đủ bốn môn; giữ lịch sử chương trình/lớp cũ khi chuyển tiếp |
| Chuyển tiếp Normal | Tạo lớp kế tiếp và chọn HV chuyển; người chuyển riêng/học lại xử lý thủ công theo lớp đích phù hợp, không ép toàn lớp cùng tiến cấp |
| Hồ sơ lớp | Nhập điểm Test; +Case có chọn HV; thêm HV mặc định lớp hiện tại; dạng xem Điểm và Ý thức |
| Kế hoạch MT | Chỉ FT; chọn lớp hiện cả lớp; bỏ “Lượt MT đang chọn”; phân biệt lượt đã hoàn tất/đã xếp lịch/chưa xếp |

## 11. Thống kê hiệu quả và trách nhiệm

- Hai mức Có tiến bộ/Tiến bộ một phần thuộc nhóm Có cải thiện; Không tiến bộ/Kém hơn là kết quả không cải thiện. Chưa đủ dữ liệu đứng ngoài bảng và mẫu số hiệu quả, không gộp vào thất bại như dòng cuối prompt cũ.
- Tỷ lệ: PA kết thúc có cải thiện / PA kết thúc có kết quả xác định, cùng vấn đề/chương trình/phạm vi/kỳ; không chia số PA thành công cho số case.
- Có n/N trước phần trăm; mẫu nhỏ không gọi “tốt nhất”. Một HV có nhiều case, một case nhiều PA; không cộng các đơn vị vào nhau.
- PA đồng thời: ghi có hỗ trợ đồng thời; kết quả GV ghi không chứng minh riêng một PA gây tiến bộ.
- Lịch sử hiệu quả theo lớp/CN/người thực hiện lúc đó; hiện trạng theo nơi đang chăm sóc. Chuyển lớp không chuyển ngược thành tích lịch sử.
- QL xem tổng dữ liệu GV trong CN, từng lớp/từng GV; GV chỉ xem hồ sơ chuyên môn của mình. Không tự xếp hạng năng lực bằng số SOS thô.
- Giữ bảng tuần. Không gọi cột trạng thái case hiện tại là “tại cuối tuần trước”. Nếu cần báo cáo thời điểm lịch sử thật thì đó là chức năng khác cần dữ liệu phù hợp.

## 12. Hồ sơ MT: kế hoạch đã có, ảnh còn gì sai?

PR28 chỉ sửa bàn giao. `plan.md` mục 8 / PR3 đã có kế hoạch “Chấm điểm, dấu '-', màn hồ sơ Test gọn”, chưa hoàn thiện ở mốc review. Bộ chọn tuần và một số quyền có thay đổi, không đồng nghĩa toàn màn đã xong.

| ID | Thấy trong ảnh | Cách sửa/điều kiện đạt |
|---|---|---|
| MT-P01 | Overall trống nhưng badge Đạt kỳ vọng | Overall thiếu → Chưa đủ điểm; nhận định phần đã chấm đặt riêng, ghi 1/4 |
| MT-P02 | Header 1/4; case còn mô tả 2/4, Listening thấp dù ô L trống | Đối soát nguồn dữ liệu sau sửa/xóa điểm; phân biệt sự kiện lịch sử với trạng thái hiện tại. Không khẳng định đây là lỗi cache khi chưa tái hiện |
| MT-P03 | Writing “Chưa xác nhận đã thi” | Bỏ bước xác nhận bắt buộc trước chấm; dùng Chờ nhập điểm khi đến lịch, giữ vắng là ngoại lệ riêng |
| MT-P04 | Lịch và điểm là hai bảng lặp kỹ năng/hạn/trạng thái | Một bảng theo kỹ năng, W1/W2 mở tiêu chí ngay dòng; lịch và hạn ở cạnh điểm |
| MT-P05 | Nhiều nút mỗi môn, Hủy lượt MT đỏ ở đầu | Một hành động chính; ngoại lệ trong menu đúng quyền, không làm Hủy thành CTA thường dùng |
| MT-P06 | Nguyên CasePanel dài nhúng dưới MT, nhiều note và khối trống | Tóm tắt tín hiệu/case liên quan; mở case gọn cùng component đã chốt, không dựng bản giao diện thứ hai |
| MT-P07 | “Chưa có gì diễn ra”, “chưa ai bắt tay vào việc”, “chưa làm gì... chưa có gì kết luận” | Chưa có phương án hỗ trợ / Thêm phương án hỗ trợ / Cần cập nhật kết quả phương án trước khi hoàn thành case |
| MT-P08 | Note tuần hoàn tất, tuần chương trình và tuần lịch dài, chữ nhỏ | Nhãn Tuần dự kiến hoàn tất + tooltip ngắn; giữ lịch từng môn ở bảng, không giải thích mô hình dữ liệu trên màn |
| MT-P09 | L trống nhưng có “Người nhập” | Phân biệt người cập nhật trạng thái với người nhập điểm; không dùng tác giả thao tác làm bằng chứng có điểm |
| MT-P10 | Demo 14/09 nhưng thao tác hiển thị 19/09 | Kiểm nguồn ngày demo/thực; ngày nhập thật có thể khác ngày nghiệp vụ nhưng phải trình bày nhất quán, không suy là lỗi chắc chắn |

Thiết kế đích: đầu trang HV/lớp/MT, kỳ vọng, tiến độ đủ điểm và kết luận hợp lệ → bảng kỹ năng (lịch, hạn, điểm, trạng thái, thao tác) → tín hiệu/case liên quan gọn → lịch sử mở theo nhu cầu. Nhập điểm Test là hành động chính, liên kết bảng lớp giữ đúng đợt/tuần.

## 13. Đề xuất giảm tải — chưa tự thay luật

1. **Giữ một hạn phản hồi SOS 3 ngày:** phản hồi phải có nguyên nhân và PA đầu tiên hoặc đề nghị QL có lý do. Tránh hai đồng hồ “xác minh rồi lại chờ PA”. Cần chốt C01.
2. **Ý thức: hạn hoàn thành công việc khác kết quả thay đổi hành vi.** Báo cáo PH đã gửi trong 3 ngày có thể hoàn thành PA, nhưng không chứng minh hết vấn đề. Đề xuất hạn 7 ngày là hạn phải kết luận/cập nhật có căn cứ, không tự đóng khi còn việc thật chưa xong.
3. **Cửa sổ gộp đã chốt lại là 3 ngày:** không thay bằng bốn ngày hoặc gộp theo tuần. Không giữ đề xuất cũ như một phương án mặc định.
4. **[ĐÃ BỎ 20/09/2026 — C03, xem 17.7]** Nâng Gấp không tạo quá hạn ngược: khuyến nghị `min(hạn hiện tại, ngày nâng +2)` như code thay vì tính lùi lại từ ngày mở. Không reset hạn case. Cần chọn C03.
5. **Cập nhật tuần theo bảng gọn:** cho nhập nhanh từng PA trong một màn, giữ kết quả/ghi chú riêng; không sao chép “chưa thay đổi” hàng loạt thành đánh giá mới.
6. **Không bắt 'chọn hướng xử lý' chung:** khi thực sự kết thúc PA mà case còn mở, chỉ hỏi hành động cần thiết. Không lặp câu hỏi đó cả lúc cập nhật tuần và hoàn thành case.
7. **Thiếu bài lặp lại:** sau một lần hẹn xử lý, đưa việc xác minh nổi bật cho GVCN; không cho dùng '-' vô hạn để làm đẹp báo cáo. Chưa thêm hình phạt/hủy tự động.
8. **Danh mục nguyên nhân:** “Ngôn ngữ” và “Từ vựng/Ngữ pháp” Listening đang dễ chồng nghĩa. Cần tổ chuyên môn định nghĩa hoặc gộp; chưa tự chuyển dữ liệu lịch sử.
9. **Chỉ thu thông tin dùng được:** báo Ý thức một dropdown nhóm; PA dùng lại phân loại case; dữ liệu HV/lớp/owner tự lấy theo ngữ cảnh; file/link không bắt buộc để không chặn báo cáo nhanh.

## 14. Những điểm cần chủ sản phẩm chốt

**[Đã trả lời 20/09/2026 — xem 17.7]** Ưu tiên C01 (SOS 3 ngày gồm PA?), C02 (GVCN xử lý học thuật trái môn?), C03 (hạn khi nâng Gấp) và C05 (trao đổi sau mọi SOS có bắt buộc?). C04/C06/C07/C08/C09 là các ngoại lệ cần xác nhận trước khi triển khai phần tương ứng; không chặn biên tập/UI hay sửa Overall thiếu điểm.

Không coi việc người dùng gửi lại prompt cũ là phê duyệt khôi phục tất cả luật cũ, đặc biệt Admin, chưa đủ dữ liệu=thất bại, hủy Normal và bắt xác nhận Đã thi.

## 15. Bộ nghiệm thu tối thiểu

1. MT chỉ R=7, target7: R đạt, Overall trống và Chưa đủ điểm; không kết luận cả đợt đã đạt.
2. MT1/2/3 cùng target6.5: kỳ vọng5.5/6.0/6.5; MT3 có phần điểm không kéo MT2 vào chỗ trống.
3. Writing tổng đạt dù W1 thấp: không tự sinh tín hiệu W1 theo quy tắc hai tầng; case GV báo vẫn độc lập.
4. Sửa nhầm L từ thấp thành đạt/xóa do nhập sai: tín hiệu và công việc suy ra đồng bộ; giữ audit, không mất PA thật.
5. Hai case một kỹ năng, một case hai PA: cập nhật đúng một PA; hạn/kết quả không lẫn.
6. PA chưa đủ dữ liệu: còn theo dõi, không đóng và không vào tỷ lệ; các kết quả xác định đếm một lần.
7. Ý thức14/09 +16/09 gộp;17/09 tạo đợt; hạn không bị reset; chỉ QL/GVCN tạo PA.
8. Ý thức hoàn thành report không tự thành “thành công học thuật”.
9. RLW14–20/09, S21–27/09: một MT, hạn23/09 và30/09; hàng chấm đúng môn ở từng tuần.
10. '-' W1 không xóa W2/S, không tạo điểm0, không tự tăng vắng; retry không dời thêm.
11. Vắng S lần đầu dời tuần sau; lần hai chờ QL; không mất điểm RLW; chỉ QL khôi phục.
12. Normal bốn môn ba tuần: không hủy;7/10 đạt;23/33 chưa đạt;GV đúng môn dời được.
13. Đổi target không thay kỳ vọng lịch sử; chuyển CN không chuyển ngược hiệu quả hỗ trợ.
14. File/link ở case/PA lưu và xem đúng quyền; lỗi tải giữ form.
15. Badge số bài và danh sách dùng cùng phạm vi/đơn vị; đi từ MT sang lớp không nhảy tuần xa nhất.

## 16. Liên kết kiểm tra

- PR28: https://github.com/Pizi147/pisa-tracking/pull/28
- Kế hoạch tại mốc review: https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/plan.md
- Công thức: https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/fasttrack/scoring.ts
- Case/hạn: https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/shared/domain/cases.ts

Không phát hành thay đổi luật chỉ từ file này khi còn nhãn Cần chốt. Khi chủ sản phẩm trả lời, cập nhật đúng mã Cxx và lịch sử quyết định, không xóa dấu vết quy tắc bị thay thế.

## 17. Chốt mới nhất — ưu tiên hơn mọi mô tả cũ mâu thuẫn

### 17.1. Không có bài và thời điểm chốt vắng

**Đã chốt:** GV được phân công nhập '-' để báo học viên có lịch Mock tuần đó nhưng không làm bài. Được sửa lại trước khi tuần kết thúc; nếu dấu '-' vẫn còn khi kết thúc Chủ nhật thì coi là không có bài/không dự thi. Không cần một bước GVCN xác minh bắt buộc nữa trong trường hợp này.

- Áp dụng theo đúng kỹ năng/bài đã báo; giữ một đợt Test xuyên nhiều tuần. RLW tuần này, S tuần sau: chỉ chốt môn đến lịch tuần này.
- Dấu '-' ban đầu hiện `Không có bài · Có thể sửa đến hết Chủ nhật {ngày}`. Sau chốt: `Không dự thi · Tuần {mã tuần}`. Đề xuất thời điểm kỹ thuật là hết Chủ nhật theo Asia/Ho_Chi_Minh; chạy xử lý đầu thứ Hai với mốc hiệu lực cuối tuần vừa kết thúc, kể cả không ai mở web.
- Ô trống vẫn là chưa nhập, KHÔNG tự chốt vắng. Điểm0 vẫn là điểm0. Có lịch nhưng chưa đến tuần không tự vắng.
- W1/W2/S có một '-' trong tiêu chí thì đánh dấu đúng bài chưa có bài, không ghi các tiêu chí thành0, không xóa bài khác. Nếu W1/W2 cùng buổi Writing thì bộ đếm vắng không được tăng hai lần do hai ô; phải theo đơn vị lịch/buổi đã định nghĩa.
- Sửa '-' thành điểm hợp lệ trước chốt thì không tính lần vắng đó. Không xóa điểm chính thức cũ bằng '-' không có hiệu chỉnh/lý do.
- Sau chốt, giữ lịch sử và chuyển sang luật dời do vắng đã có: lần đầu đúng tuần kế tiếp, từ lần hai QL duyệt; chỉ QL khôi phục phần FT đã hủy. Quyền bấm dời lần đầu của GVCN không bị mở cho mọi GVBM chỉ vì GV được báo '-'.
- Chốt vắng không đồng nghĩa tự hủy toàn MT và không reset bộ đếm vắng khi đổi lịch; không mất điểm môn đã làm.
- Mỗi lần lịch/kỹ năng chỉ chốt một lần; retry hoặc mở web nhiều lần không tăng bộ đếm. Lịch chủ động do QL đổi hợp lệ trước chốt phải dùng lịch mới, giữ nhật ký.
- Quy định chốt vắng áp dụng cho Mock theo lời chốt mới. Normal tiếp tục không hủy nghĩa vụ đủ bốn môn; không tự đưa giới hạn/hủy FT sang Normal.
- **[ĐÃ CHỐT 20/09/2026 — xem 17.7: chốt ngay; sau cuối tuần chỉ QL sửa và ghi đè trực tiếp]** Ngoại lệ khi triển khai: nhập '-' cho một tuần đã kết thúc từ trước sẽ chốt ngay hay cần hiệu chỉnh do QL? Ai được sửa kết luận vắng sau cuối tuần và có đảo quyết định duyệt đã phát sinh không? Không tự cấm sửa dữ liệu sai, nhưng không âm thầm mở lại tuần đã chốt. Dấu '-' sửa vào trước cuối tuần nào phải bám tuần lịch của bài, không kéo hạn sang tuần nhập muộn.
- Hạn chấm FT thứ Tư tuần sau vẫn là hạn nhập điểm cho bài có thực hiện; chốt dấu '-' Chủ nhật chỉ áp dụng bài đã được GV báo không có. Hai mốc này không thay nhau.

### 17.2. Ý thức: đợt báo cáo và xác nhận đã thực hiện

- Cửa sổ gộp BA ngày lịch, tính cả ngày mở; điều kiện cùng HV/cùng phân loại/case đang tồn tại. Mở thứ Hai14/09 thì thứ Tư16/09 còn gộp, thứ Năm17/09 là case mới. Case đã hoàn thành không tự mở lại; tạo đợt liên kết là cách xử lý đề xuất cho ngoại lệ này.
- Giữ nguồn, người báo, ngày, mô tả và bằng chứng riêng; các PA cùng xử lý những nguồn được gộp. Không nhân PA theo số nguồn.
- Một case có thể có nhiều PA. Người có quyền bấm **Hoàn thành**, bổ sung bằng chứng thực hiện bằng ít nhất một hình thức ghi chú/file/ảnh/link. Ngày hoàn thành mặc định hôm nay, nhập bù giữ ngày thực tế; không bắt nhập một ghi chú rỗng nếu đã có bằng chứng rõ ràng bằng hình thức khác.
- Không hỏi Có tiến bộ/Không tiến bộ, không đo hiệu quả học thuật, không ép tiếp tục theo dõi hành vi. Case đã hoàn thành kết thúc đợt đó; lần mới là đợt mới theo luật.
- Đề xuất UI xác nhận cuối hiển thị các PA đã áp dụng với dấu chọn “Đã thực hiện”; một lần lưu kết thúc case và ghi nhận các PA được xác nhận, không bắt mở từng panel. PA chưa làm phải được giữ đúng thực tế hoặc đánh dấu không thực hiện có lý do, không tự đếm thành report/thư đã gửi.
- Một PA report gia đình dùng chung cho ba nguồn chỉ đếm một report. Đếm report/thư cảnh cáo theo hành động thực sự đã làm, không theo số nguồn, số lần cập nhật hoặc số tệp.
- Giữ hạn PA3/5 ngày và case7 ngày đã chốt; không dùng hạn đó để tự đánh dấu đã làm. Mâu thuẫn cách tính khi nâng Gấp (C03): **đã bỏ 20/09/2026** — nâng mức ưu tiên không siết hạn; xem 17.7.

### 17.3. SOS chỉ báo vấn đề

C05 đã giải quyết: không tự tạo PA trao đổi hoặc case Ý thức theo mức SOS. GVCN quyết định và tự lập/hoàn thành PA trao đổi khi cần trong thời hạn đã chốt. Tín hiệu học thuật vẫn cần nguyên nhân và trách nhiệm GV đúng môn; không chuyển toàn bộ việc học thuật sang GVCN. Không xóa hoạt động thật đã ghi trước đây; ngừng sinh tự động các hoạt động mới theo luật cũ.

### 17.4. Người thực hiện, phạm vi và nhập học viên

- Ô Người thực hiện trong PA đã áp dụng dùng tìm kiếm từ danh sách người có role Giáo viên. Đề xuất bắt đầu gợi ý từ3 ký tự, tìm tên có dấu/không dấu; chọn bản ghi, không lưu tên tự do thành người dùng giả.
- Áp dụng component tìm kiếm chung cho các ô chọn người, nhưng mỗi trường vẫn có bộ lọc quyền riêng. Phân công lớp chỉ GV được phân công CN; GVCN phải dạy ít nhất một môn; không áp bộ lọc teacher cho trường chọn QL phê duyệt.
- Bỏ hai nút “Việc của tôi/Cả phạm vi quản lý” khỏi mặt chính Tổng quan và Học viên. Không bỏ kiểm soát quyền hoặc đổi số liệu âm thầm. Trong hàng công việc dùng bộ lọc Người phụ trách khi cần; phạm vi xem được nói bằng Chi nhánh/Lớp và ngữ cảnh tài khoản.
- Nhập HV: giữ thông tin thiếu hợp lệ ('-' hoặc trống), không coi thiếu target là lỗi chặn nếu luật cho nhập. Dòng rỗng hoàn toàn bỏ qua khi kiểm tra; dòng có dữ liệu nhưng lỗi phải sửa hoặc xóa dòng có chủ ý. Bỏ nút hàng loạt “Bỏ qua 1 dòng lỗi”; không âm thầm làm mất học viên đã dán.

### 17.5. Các yêu cầu cũ hết hiệu lực trong bản này

| Quy tắc/đề xuất cũ | Quy tắc mới |
|---|---|
| Gộp Ý thức bốn ngày | Ba ngày đầu |
| Mọi '-' chỉ hẹn chấm, luôn cần GVCN xác minh vắng | Còn '-' cuối Chủ nhật thì chốt không dự thi |
| SOS có hai PA trao đổi bắt buộc tự sinh | GVCN tự quyết định và lập PA |
| Ép Ý thức theo dõi hiệu quả/tiến bộ | Ghi nhận việc đã làm và chứng cứ, hoàn thành đợt |
| Hồ sơ MT có khối hỗ trợ/case | Bỏ khỏi hồ sơ MT; giữ dữ liệu và xử lý ở hồ sơ HV |

### 17.6. Nghiệm thu mới thay các kịch bản mâu thuẫn trước đó

1. '-' tuần14–20/09 còn ngày20/09: chốt không dự thi khi hết ngày; sửa thành điểm trước đó thì không vắng. Ô trống không tự vắng.
2. S tuần21–27/09 không bị chốt trong tuần14–20/09. Tác vụ chạy lặp không tăng số lần.
3. W1 báo '-' không xóa W2; nếu cả hai thuộc một lần vắng Writing thì không đếm hai lần vắng.
4. Ý thức mở14/09, báo16/09 gộp;17/09 tạo case mới, không kéo dài hạn/cửa sổ cũ.
5. Hai nguồn và hai PA: hoàn thành một lần kèm bằng chứng, không hỏi tiến bộ; một report không đếm thành hai vì hai nguồn.
6. Có SOS không sinh hai PA trao đổi tự động; GVCN vẫn tạo được PA phù hợp.
7. Tìm người3 ký tự hiện đúng GV trong quyền; người không có role GV không chọn được cho Người thực hiện PA.
8. Nhập danh sách có một dòng lỗi: giữ toàn bộ dữ liệu để sửa/xóa dòng, không tự bỏ bằng nút hàng loạt; lớp đích khớp ngữ cảnh mở.

### 17.7. Chốt ngày 20/09/2026 cho các điểm C01–C10

Chủ sản phẩm đã trả lời. Mục này **thay thế** mọi chỗ ghi "cần chốt Cxx" ở trên; không xoá dấu vết các đoạn cũ.

| Mã | Đã chốt | Ghi chú |
|---|---|---|
| **C01** | Trong 3 ngày kể từ SOS phải có phương án; có phương án rồi thì theo luật cũ: **Học thuật** ghi kết quả vào mỗi Chủ nhật hằng tuần và chốt kết quả cuối đợt; **Ý thức** hoàn thành hết phương án trong thời hạn mặc định của case là 1 tuần | Chủ sản phẩm hỏi lại "đúng không?" — **chờ xác nhận cách hiểu**, chưa đổi mã |
| **C02** | GVCN **không** được xử lý case học thuật trái môn: mọi giáo viên, kể cả GVCN, chỉ xử lý case đúng kỹ năng mình dạy. Case Ý thức vẫn chỉ GVCN | Đã áp ở quyền máy chủ |
| **C03** | Bỏ câu hỏi hạn khi nâng mức. **Chỉ với Ý thức:** báo cáo khác cùng phân loại trong **3 ngày đầu** tồn tại của case cũ thì lồng vào case đang có; không thì ra case mới. Hạn mặc định của case vẫn 1 tuần từ ngày mở; nâng mức ưu tiên không siết hạn | Đã áp: cửa sổ gộp 3 ngày (ngày mở + 2), bỏ luật "ngày nâng + 2" |
| **C04** | Giữ: đợt Ý thức đã đóng mà có báo cáo mới thì tạo **đợt mới liên kết**, không mở lại | Khớp hành vi cũ |
| **C05** | (đã chốt 19/09) SOS không bắt buộc sinh phương án trao đổi | — |
| **C06** | Giữ: tab "Đã xong từ trước" chỉ nhận case đã hoàn thành | Khớp hành vi cũ |
| **C07** | Writing **phải đủ cả W1 và W2**. Thiếu một bài nghĩa là giáo viên của bài đó chưa chấm hoặc chấm sai — cứ báo quá hạn như bình thường | Khớp hành vi cũ |
| **C08** | Hạn chấm Normal: hết Chủ nhật của tuần thi. Nếu chưa có bài thì thêm "-" và dời sang tuần sau | **Một nửa chưa rõ** (ai thêm "-", và Normal có dùng "-" không) — chưa triển khai, chờ trả lời |
| **C09** | Đề nghị dời lịch lần hai: chờ Quản lý duyệt hết tuần đó; không phản hồi/thao tác thì **huỷ**. Giáo viên muốn xếp lại thì tự trao đổi với Quản lý ngoài website | Khớp hành vi cũ (tài liệu trước đó ghi ngược lại) |
| **C10** | Nhập "-" cho tuần đã kết thúc từ trước: **chốt ngay** | Đã áp |

**Sau cuối tuần, chỉ Quản lý được sửa kết luận không dự thi.** Quyết định mới của Quản lý **ghi đè trực tiếp** quyết định trước và trở thành quyết định hiện hành; không phát sinh bước duyệt lại. Lịch sử thay đổi chỉ lưu ở mức nhật ký audit để truy vết, không hiển thị và không tham gia luồng việc.

---

## 18. Chốt ngày 21/09/2026 — Ý thức bỏ mô hình Case, ưu tiên hơn mọi mô tả cũ mâu thuẫn

Nguồn: `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` do chủ sản phẩm gửi 21/09/2026.
Diễn giải đủ chi tiết để code: `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`.

**Mục này ưu tiên hơn mục 6, mục 17.2 và mọi đoạn nói về Case Ý thức ở trên.** Không xoá dấu
vết các đoạn cũ; chúng là lịch sử quyết định.

### 18.1. Hai hệ tách hẳn

| | Học thuật | Ý thức |
|---|---|---|
| Đơn vị theo dõi | Case | **Vi phạm** — mỗi sự việc một record độc lập |
| Việc làm cho em | Phương án | **Biện pháp xử lý** |
| Đo cải thiện | Có, năm mức, vào bảng hiệu quả | **Không.** Chỉ ghi nhận việc đã làm và bằng chứng |
| Hạn cứng | 3/5 ngày có phương án; cập nhật mỗi Chủ nhật | **Không có.** Một cảnh báo mềm 5 ngày |
| Quan hệ | 1 case → n phương án | **n vi phạm ↔ n biện pháp, nhiều–nhiều** |

Bảng `sos_cases` từ nay là **bảng case học thuật**. Cột `track` và giá trị `behaviour` bị gỡ.

### 18.2. Học thuật — bốn điểm sửa, phần còn lại giữ nguyên

Đối chiếu từng dòng cho thấy phần Học thuật gần như đã đúng. Chỉ bốn việc:

1. **Đóng SOS không tạo Case phải ghi rõ lý do** — hiện có đường `noted` nhưng chưa bắt buộc lý do.
2. **Phương án phải giữ lịch sử điều chỉnh.** Hiện có chuỗi "thay thế" (`superseded_by`), nhưng
   *sửa nội dung* phương án là ghi đè, mất bản cũ. Rule mới bắt buộc audit được: phương án ban
   đầu là gì, đổi khi nào, vì sao đổi, hiện tại là gì.
3. **Đổi tên mức:** `Cần chú ý` → **`Bình thường`** (5 ngày). `Gấp` giữ nguyên (3 ngày).
   Đây là chữ trong nguồn 21/09; thay câu "bỏ Bình thường" ở mục 4.2.
4. **Cập nhật tuần rút gọn** theo nguồn mục 8: kết quả hiện tại · tiến triển · vấn đề còn tồn ·
   giữ nguyên / điều chỉnh / thay phương án · ghi chú. Không biến thành form dài.

Giữ nguyên, đã đúng: SOS là tín hiệu không phải case · 3 ngày xác nhận nguyên nhân · GV tạo
Case trực tiếp · một case sống suốt khoá cho mỗi kỹ năng · gắn tín hiệu mới vào case đang mở ·
case mới khi vấn đề khác hoặc case cũ đã đóng mà tái diễn · chỉ đóng case khi vấn đề đã xử lý.

### 18.3. Ý thức — luật mới

- **Vi phạm:** mọi giáo viên dạy lớp đều ghi được. Bắt buộc học viên · ngày xảy ra · nhóm · mô tả.
  Tùy chọn môn · tệp hoặc liên kết. Ghi vi phạm **không** sinh case, biện pháp, việc hay hạn nào.
- **Năm nhóm (Y04):** Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác.
  Bỏ `Tham gia trên lớp`; dữ liệu cũ đổi sang `Thái độ / hành vi`.
- **Báo cáo của GV có thể sai.** Sửa được, và đánh dấu `Không còn hiệu lực` kèm **lý do bắt buộc**.
  Không xoá vật lý. Vi phạm hết hiệu lực không vào bất kỳ thống kê nào, nhưng vẫn nằm trong lịch sử.
- **Chín biện pháp xử lý**, thay tên cũ "Phương án kỷ luật", xếp nhẹ đến nặng để BÀY RA:
  GV trao đổi ngắn với HS · GV meeting với HS · Report cho gia đình · Thư cảnh cáo lần 1 ·
  CX / GĐCN meeting với HS / PH · Thư cảnh cáo lần 2 · Đình chỉ học · Thư cảnh cáo lần 3 · Khác.
- **Không có thứ tự xử lý bắt buộc.** Đi thẳng tới biện pháp nặng là hợp lệ.
- **Ngoại lệ cứng duy nhất:** Thư cảnh cáo phải đúng 1 → 2 → 3, kiểm ở **máy chủ**.
  Phạm vi chuỗi là **một lộ trình học** (Y02); sang lộ trình mới thì reset về lần 1.
- **Nhiều–nhiều:** một biện pháp gom nhiều vi phạm khác nhóm, khác môn, khác GV, khác ngày;
  một nhóm vi phạm được xử lý bằng nhiều biện pháp.
- **Hai trạng thái biện pháp:** `Đang chuẩn bị` (thêm hoặc bớt vi phạm, sửa mọi thứ, **không có
  hạn**) và `Đã thực hiện` (chốt snapshot, khoá danh sách vi phạm).
- **Xác nhận đã thực hiện** lưu tối thiểu: loại · ngày thực hiện thực tế · người thực hiện ·
  ghi chú · danh sách vi phạm · tệp hoặc liên kết khi cần. **Không hỏi tiến bộ.**
  Tệp hoặc liên kết **bắt buộc** với ba Thư cảnh cáo và Đình chỉ học.
- **Ai xác nhận (Y01):** GVCN tự làm hết, kể cả biện pháp nặng. **Không có bước Quản lý duyệt.**
  Quản lý nhận thông báo khi một Thư cảnh cáo hoặc Đình chỉ học được xác nhận.
- **Cảnh báo 5 ngày:** nếu học viên còn vi phạm chưa gắn vào bất kỳ biện pháp nào, và cái cũ
  nhất trong đó đã quá 5 ngày, cảnh báo GVCN. Chỉ để nhắc — không tự tạo gì, không tính quá hạn.
- **Đếm theo hành động thật:** một Report gom ba vi phạm đếm là **một** report.
- **Ý thức nằm hoàn toàn ngoài mọi bảng hiệu quả hỗ trợ.** Gia đình đã nhận report không chứng
  minh em tiến bộ.
- **Cảnh báo trùng mềm:** cùng học viên, cùng nhóm, cùng ngày thì nhắc trong form, cho xem bản
  ghi đang có, **vẫn cho tạo mới**. Không tự gộp, không tự xoá.

### 18.4. Các luật cũ hết hiệu lực trong bản này

| Luật cũ | Thay bằng |
|---|---|
| Case Ý thức, đợt Ý thức | Vi phạm — record độc lập |
| Cửa sổ gộp ba ngày (C03) | Không gộp theo ngày. Mỗi vi phạm một dòng |
| Hạn hoàn thành case Ý thức 7 ngày | Không có hạn. Cảnh báo mềm 5 ngày |
| Hạn thực hiện phương án Ý thức 3/5 ngày | Không có hạn |
| Tái diễn lần 2/3, `episode_no` | Không còn đợt nên không còn lần thứ mấy |
| Đợt đã đóng có báo cáo mới thì tạo đợt mới liên kết (C04) | Không còn đợt. Chỉ là một vi phạm mới |
| Nâng mức ưu tiên khi có báo cáo bổ sung | Không còn case nên không còn mức ưu tiên |
| Một case Ý thức thuộc đúng một phân loại | Một biện pháp gom nhiều nhóm khác nhau |
| Ba loại liên hệ `talk_student / talk_parent / warning_letter` | Chín loại biện pháp xử lý |
| Tín hiệu SOS cho Ý thức | SOS chỉ sinh từ Mock Test, chỉ Học thuật |
| Tab "Đã xong từ trước" có nhánh Ý thức | Chỉ còn nhánh Học thuật |
| Chỉ số "Tái diễn Ý thức" | Tám chỉ số mới, xem `HOP_DONG_SO_LIEU.md` |
| Ý thức là cột thứ sáu của bảng phân tích theo kỹ năng | Góc nhìn riêng trong Phân tích |
| `Cần chú ý` (mức case học thuật) | `Bình thường` |
| Bốn nhóm ý thức gồm `Tham gia trên lớp` | Năm nhóm, bỏ `Tham gia trên lớp` |

### 18.5. Nghiệm thu

Bộ 24 mục ở `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` mục 12 **thay** các kịch bản Ý thức ở
mục 15 điểm 7–8 và mục 17.6 điểm 4–5 của sổ này.

### 18.6. C01 — chủ sản phẩm đã tự trả lời bằng nguồn 21/09

C01 hỏi: sau 3 ngày xác minh SOS, phương án đầu tiên có phải nằm trong cùng hạn đó không?

Nguồn 21/09 mục 3.2 và mục 6 trả lời rõ: **hai mốc riêng.** SOS có 3 ngày để *xác nhận nguyên
nhân*, và *không được hiểu rằng trong 3 ngày đó phải hoàn thành cả phương án*. Sau khi Case
được tạo, phương án có hạn riêng 5 ngày (Bình thường) hoặc 3 ngày (Gấp), **tính từ ngày Case
được tạo**.

Vậy `C01_HAN_XAC_MINH_SOS_GOM_PA = 'hai-moc-rieng'` — đúng như mã đang chạy. **C01 đóng.**

### 18.7. Còn đúng một điểm chưa chốt: C08

Hạn chấm Normal hết Chủ nhật tuần thi — đã đúng. Còn chưa rõ: *"chưa có bài thì thêm - và dời
sang tuần sau"* — ai thêm dấu `-` (hệ thống tự thêm hay giáo viên), và Normal có thật sự dùng
dấu `-` không (hiện Normal luôn đủ bốn môn, không có `-`). **Chưa triển khai, chờ trả lời.**


---

## 19. Chốt tối 21/09/2026 — rulebook v3: SOS tự tạo case, Phối hợp SOS, vi phạm sửa/xoá thẳng

Nguồn: `thiet-ke/NGUON-Rule-v3-YThuc-PhoiHop-2026-09-21.md`. Đặc tả: `thiet-ke/SOS_VA_PHOI_HOP_V3.md`.
**Ưu tiên hơn mục 18.** Không xoá dấu vết các mục cũ.

| Luật cũ | Luật mới |
|---|---|
| §3.4, §18.2: SOS là tín hiệu; không tự tạo tutor/tự học chỉ vì có SOS | Mock Test FT có SOS **tự tạo/gắn Case** cho từng kỹ năng trượt (W1/W2 tách, SOS vẫn tính Writing là 1) và **điền sẵn phương án** theo bảng MT × SOS. GVBM có **3 ngày** xác định nguyên nhân + xác nhận/chỉnh phương án. Được đóng ngay `Không cần theo dõi` kèm lý do |
| C05 / §17.3: SOS không tự sinh việc trao đổi | **Phối hợp SOS**: việc trao đổi HS/gia đình/meeting điền sẵn theo bảng MT × SOS; GVCN xác nhận hoặc bỏ kèm lý do chọn nhanh. Không phải vi phạm, không phải biện pháp, không phải case |
| §18.3: vi phạm ghi sai → đánh dấu không còn hiệu lực, không xoá | **Sửa hoặc xoá thẳng**, kể cả khi đã nằm trong biện pháp đã thực hiện. Xoá thì gỡ khỏi biện pháp, số liệu tự cập nhật |
| Tab `Ý thức` | **`Ý thức & Phối hợp`**, hai sub-tab `Vi phạm & xử lý` · `Phối hợp SOS`; hồ sơ lớp mặc định xem **theo học sinh** |
| — | Case tạo tay giữ 5 ngày (**Bình thường**) / 3 ngày (Gấp) để có phương án |
| — | Lớp Normal giữ mô hình tín hiệu (v3 chỉ nói Mock Test) |

## PR-MT — lịch MT tự tạo, MT lịch sử, đánh số, dời do vắng (29/09/2026)

- **M1 — thay luật cũ "nhập danh sách không lập lịch MT":** em có lộ trình FT (Thêm HV, vào lớp FT, mở lộ trình mới, đổi LT ↔ RF) →
  hệ thống **tự tạo** MT1/MT2/MT3 ở tuần học 6/12/16 (RF: MT1/MT2 tuần 4/8), bốn kỹ năng cùng tuần. Tuần do hệ thống tính từ tuần bắt
  đầu học, không lấy từ file dán. Không tự tạo MT4+. Đổi tuần bắt đầu → chỉ lượt hệ thống tự xếp, chưa có điểm, được dời theo.
- **MT lịch sử (T34):** lượt có tuần thi kết thúc **trước ngày tạo lượt** — cờ lưu lúc tạo. Không nợ, không hạn, không quá hạn, không vào
  Lịch Test/Nợ/Việc nhập điểm/độ phủ; không nhận dấu "-", không vào luồng vắng. GVCN của lớp nhập được ô trống cả 4 kỹ năng, Quản lý
  nhập/sửa mọi ô (sửa ô đã có điểm phải có lý do). Khoá sửa (R11) 7 ngày sau lần nhập cuối. Chỉ lượt lịch sử có tuần thi trong **4 tuần**
  trước ngày tạo mới sinh Case/PA quy chế/Phối hợp (ngày phát hiện = hôm nay).
- **Đánh số liền mạch (T36):** MT(n) chỉ tạo khi đã có MT(n−1) — một chốt cho mọi đường tạo lượt. **Huỷ cả lượt** chỉ với MT cuối cùng
  của lộ trình chưa có điểm và chưa thi kỹ năng nào — số đó dùng lại được (xếp lại tính mốc lịch sử / cửa sổ 4 tuần từ lúc xếp lại); còn lại **Huỷ phần còn lại** (kỹ năng chưa điểm và chưa thi), lượt giữ số. Huỷ cả
  lượt đóng Case sinh riêng từ lượt đó ("Lượt đã huỷ", không tính thất bại) và việc Phối hợp còn mở.
- **Dời do vắng (Q-A, T42):** dấu "-" chốt cuối Chủ nhật → lần 1 **máy tự dời** sang tuần kế tiếp (nếu còn thi được) và báo GVCN + GVBM
  đúng kỹ năng; lần 2 thành đề nghị chờ Quản lý, **hạn hết Chủ nhật của tuần gửi**, tuần đích mặc định = tuần chưa bắt đầu gần nhất hợp
  luật thứ tự đợt. Quản lý đổi tuần một kỹ năng đang vắng = một lần dời do vắng. Quản lý đổi kết luận khỏi "vắng" → đề nghị đang chờ rút.

## PR-XLMT — xếp lịch MT nhiều lớp, thao tác MT theo trạng thái (29/09/2026)

- **Trần MT8 (T37):** một lộ trình tối đa MT8; đánh số liền mạch giữ nguyên (PR-MT).
- **Việc từng em khi xếp (K4-17):** chọn đợt MT{n} cho nhiều lớp → mỗi em máy tự chọn: đợt đã đủ điểm → sang MT kế tiếp · đợt dở →
  **Xếp nốt** kỹ năng còn thiếu · đợt chưa thi → **Dời** · chưa có → **Tạo** · MT lịch sử → bỏ qua (chỉ nhập bù). Quản lý bấm đúng đợt
  đã đủ cho riêng em = **Thi lại**: hộp nói kỹ năng đã có điểm rồi mới hỏi; đồng ý → **xoá điểm cũ khỏi ô, giữ trong Lịch sử**, kỹ năng về
  "chờ thi", tuần mới; SOS/kỳ vọng tính theo điểm mới (chủ sản phẩm chốt 29/09, câu 1 = A). Chỉ Quản lý, chỉ lượt Mock đang chạy.
- **Đợt mới mặc định (K4-14):** bốn kỹ năng CÙNG tuần tới; sửa riêng từng kỹ năng bên dưới.
- **Tuần đã qua (K2-33, Q8):** chỉ dùng để TẠO MT lịch sử — mọi kỹ năng đều tuần đã qua **và** em vào web sau các tuần đó. Không dời
  lượt có sẵn vào tuần đã qua; trộn tuần qua/tới bị chặn.
- **Thao tác theo trạng thái (T38, K4-27):** mỗi kỹ năng ≤ 1 nút chính + ≤ 3 mục menu, bảng ở `thaoTacKyNang`:

  | Trạng thái | Nút chính | Menu |
  |---|---|---|
  | chưa tới tuần thi | Nhập điểm | Dời lịch thi (QL) · Bỏ kỹ năng khỏi đợt (QL, FT) |
  | đang tới tuần thi, chưa điểm | Nhập điểm | Báo vắng (GVCN, QL) · Dời hạn chấm · Dời lịch thi (QL) |
  | đã có điểm | Sửa điểm | Huỷ điểm (người nhập được; sau hoàn tất chỉ QL) |
  | vắng | Xếp lại bài vắng (GVCN, QL) | — |
  | chờ duyệt dời | Trả lời đề nghị dời (QL) | — |
  | đã huỷ phần thi | Khôi phục và đặt tuần (QL) | — |
  | MT lịch sử chưa điểm | Nhập điểm | — |

- **Lý do bắt buộc (K4-15):** dời bài khi tuần thi **đã bắt đầu**, dời hạn chấm, bỏ kỹ năng, báo vắng, huỷ điểm, huỷ lượt, thi lại (≥ 5 ký
  tự, máy chủ kiểm). Xếp / đổi tuần **tương lai** không cần lý do. Bài vắng Quản lý xếp lại vẫn không bắt lý do (K4-12).
- **Bỏ kỹ năng (K4-13):** bị chặn khi đã có điểm (dùng Huỷ điểm) hoặc đã tới tuần thi (dùng Báo vắng). Lớp thường không có.
- **Báo vắng (K4-28):** ghi "-" cho mọi ô của kỹ năng (W = W1 + W2) và **chốt ngay** — lần 1 máy tự dời tuần kế tiếp, từ lần 2 thành đề
  nghị Quản lý duyệt (Q-A). Mở từ thứ Hai tuần thi; không cho MT lịch sử. Lớp thường: Báo vắng có lý do = dấu "-" dời tuần sau, thêm GVCN.
- **Quản lý sửa / xoá điểm có lý do ở mọi lúc** (chủ sản phẩm chốt 29/09) — không còn chờ đợt hoàn tất (R11 vẫn chặn GVBM sau hoàn tất).
- **Cần xếp lại (Q7):** kỹ năng vắng chưa có đề nghị chờ + phần thi đã huỷ, lượt còn chạy, không lịch sử. Trễ (chưa chấm) không tính.

## PR-HSM — hồ sơ Mock, nhận xét W/S, GV chấm Speaking (30/09/2026)

- **Nhận xét W/S (YC-13.5):** mỗi **bài nhập** W1, W2, S có một nhận xét, **không bắt buộc**, tối đa 1000 ký tự; L/R không có. Nhận xét
  **không phải điểm**: sửa không cần lý do, không đổi "Nhập bởi", không tính lại SOS; nhật ký giữ bản trước/sau. Ghi được cả khi ô
  chưa có điểm, nhưng không với bài vắng / đã huỷ / ngoài phạm vi. Ô **mất hết điểm** (Huỷ điểm, Thi lại, xoá tay) thì nhận xét và GV
  chấm cũng xoá — nhật ký giữ bản cũ. Quyền sửa nhận xét = quyền sửa chính ô điểm đó (hoàn tất → chỉ Quản lý; MT lịch sử → thêm GVCN).
- **GV chấm Speaking (T39):** tài khoản nhân viên **hoặc** tên người ngoài (2–100 ký tự). Chọn **một lần** ở đầu cột S của lưới, nhớ
  trên máy theo lớp × tuần, áp cho các bài S lưu sau đó; sửa riêng một em trong hộp tiêu chí hoặc ở hồ sơ Mock.
- **Bài đã xác nhận vắng không nhập trong lưới (T53 Q6):** ô hiện "vắng", không ô nhập — nhập bù thì Quản lý "Xếp lại bài vắng" /
  "Khôi phục" trước.
- **Hồ sơ Mock:** năm ô điểm lớn L · R · W · S · Overall; ai sửa được bài nào (GVBM đúng kỹ năng · Quản lý · GVCN với MT lịch sử) bấm ô
  là sửa tại chỗ, sửa điểm đã có vẫn ghi lý do (RB-5). Kết quả đợt dùng mức SOS (chặn trần 3), không đếm số môn trượt.
