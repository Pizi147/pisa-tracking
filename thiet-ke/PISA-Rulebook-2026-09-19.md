# PISA Progress — Rule book: SOS, case, phương án và Test

Phiên bản 1.3 · 02/10/2026 · Cập nhật theo chốt mới nhất của chủ sản phẩm và đối chiếu với code `main`.

> **ĐỌC MỤC 20 TRƯỚC (ngày 02/10/2026), RỒI MỤC 19, RỒI MỤC 18.** Mục 20 tổng hợp mọi luật đã đổi từ 21/09 đến nay
> (đặc tả nâng cấp 27/09, các PR đến 01/10, lời chủ sản phẩm 02/10) và đã đối chiếu với code đang chạy; **mục 20 ưu tiên
> hơn mọi mục khác khi trái**. Những chỗ sau trong mục 1–19 đã bị thay và có đánh dấu **[ĐÃ THAY — xem §20.x]**: hạn cập nhật PA
> (Chủ nhật → hết Thứ Hai), "Dự kiến kết thúc", SOS FT điền sẵn và "Không cần theo dõi" đóng ngay, Ý thức (thang bậc: 6 bậc mạch chính rồi Report 7, 8… tăng mãi, hạn thật,
> QL duyệt), SOS lớp thường, dấu "-" lớp thường (C08), môn lớp thường, sửa Target/lộ trình, chuyển lớp, Target/Dự kiến thi lớp thường
> và dán Excel không cần tiêu đề (04/10, §20.1 dòng 19). Chữ gốc giữ nguyên làm lịch sử.
>
> **ĐỌC MỤC 19 RỒI MỤC 18 (lịch sử).** Mục 19 (tối 21/09, rulebook v3) ưu tiên hơn mục 18.
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
- Ngưỡng SOS theo số môn dưới chuẩn cần dùng cùng định nghĩa đã chốt cho Normal; nghiệm thu cả ba mức và trường hợp thiếu môn. Không suy số môn chưa nhập là số môn trượt. **[ĐÃ THAY 27–30/09 — lớp thường không còn nhãn SOS: Giữa khoá tự tạo Case + PA Bổ trợ, Cuối khoá dùng dải % tổng; Pre FOU không chia môn; FOU hiện G+V · P. Xem §20.6]**

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
- Dự kiến kết thúc mặc định Chủ nhật tuần tiếp theo nếu chưa chọn, theo prompt. Đây khác hạn cập nhật tuần. **[ĐÃ THAY 28/09 — bỏ ô "Dự kiến kết thúc", xem §20.1 dòng 2]**
- GVBM phụ trách cập nhật **từng PA đang theo dõi trước hết Chủ nhật hằng tuần**; không bắt nhập lại thông tin không đổi. **[ĐÃ THAY 27/09 — hạn là hết THỨ HAI tuần kế, xem §20.1 dòng 1–3]**
- Cập nhật có hai lựa chọn rõ: **Tiếp tục theo dõi / Kết thúc phương án**. **[ĐÃ THAY 27/09 — nay là Giữ nguyên / Điều chỉnh / Xin hỗ trợ QL, xem §20.1 dòng 3]** Kết quả và ghi chú; không có điểm tự chấm ở bước này.
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
| Đầu vào Normal | OVR theo yêu cầu cũ; không ép target/lộ trình LT của FT **[BỔ SUNG 04/10 — lớp thường cũng có Target/Dự kiến thi, chỉ để theo dõi. Xem §20.1 dòng 19]** |
| Tạo lớp | Phân công GVBM/GVCN ngay trong form; một môn một GV; GVCN dạy ít nhất một môn của lớp |
| Chọn GV | Combobox gõ tìm; chỉ người được phân công giảng dạy tại CN, không suy từ quyền QL toàn hệ thống |
| Thông tin HV | QL/GVCN sửa thông tin theo quyền: tên, ngày sinh, đầu vào, tư vấn viên, mục tiêu/lộ trình/thi dự kiến phù hợp chương trình. **[ĐÃ THAY 29/09 — Target và lộ trình chỉ QL sửa; GVCN "Đề xuất sửa". Xem §20.1 dòng 14]** **[BỔ SUNG 04/10 — lớp thường cũng có Target/Dự kiến thi. Xem §20.1 dòng 19]** |
| Thi thật FT | Có thể mới biết tháng, sau bổ sung tuần/ngày; không ép ngày giả và không hiện “chưa xác định tuần” cạnh tháng đã có |
| Đổi target | Lý do và ngày hiệu lực; cùng nguồn dữ liệu giữa Thông tin HV và Lộ trình |
| Lộ trình | QL chốt lịch MT; GVCN không có toàn quyền lịch FT chủ động chỉ vì được sửa thông tin lộ trình |
| Chuyển lớp | CN → lớp; ngày hiệu lực, lý do, bàn giao, lưu ý, người nhận. Bắt đủ thông tin; có lựa chọn “Không có lưu ý” rõ ràng. **[ĐÃ THAY 30/09 — Quản lý ra lệnh, tự thi hành Thứ Hai; bàn giao GVBM 2 ngày / GVCN 3 ngày. Xem §20.7]** |
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
| **C01** | **[ĐÃ THAY — "mỗi Chủ nhật" nay là hết Thứ Hai; Case SOS dùng một hạn 3 ngày. Xem §20.1 dòng 1, 6]** Trong 3 ngày kể từ SOS phải có phương án; có phương án rồi thì theo luật cũ: **Học thuật** ghi kết quả vào mỗi Chủ nhật hằng tuần và chốt kết quả cuối đợt; **Ý thức** hoàn thành hết phương án trong thời hạn mặc định của case là 1 tuần | Chủ sản phẩm hỏi lại "đúng không?" — **chờ xác nhận cách hiểu**, chưa đổi mã |
| **C02** | GVCN **không** được xử lý case học thuật trái môn: mọi giáo viên, kể cả GVCN, chỉ xử lý case đúng kỹ năng mình dạy. Case Ý thức vẫn chỉ GVCN | Đã áp ở quyền máy chủ |
| **C03** | Bỏ câu hỏi hạn khi nâng mức. **Chỉ với Ý thức:** báo cáo khác cùng phân loại trong **3 ngày đầu** tồn tại của case cũ thì lồng vào case đang có; không thì ra case mới. Hạn mặc định của case vẫn 1 tuần từ ngày mở; nâng mức ưu tiên không siết hạn | Đã áp: cửa sổ gộp 3 ngày (ngày mở + 2), bỏ luật "ngày nâng + 2" |
| **C04** | Giữ: đợt Ý thức đã đóng mà có báo cáo mới thì tạo **đợt mới liên kết**, không mở lại | Khớp hành vi cũ |
| **C05** | (đã chốt 19/09) SOS không bắt buộc sinh phương án trao đổi | — |
| **C06** | Giữ: tab "Đã xong từ trước" chỉ nhận case đã hoàn thành | Khớp hành vi cũ |
| **C07** | Writing **phải đủ cả W1 và W2**. Thiếu một bài nghĩa là giáo viên của bài đó chưa chấm hoặc chấm sai — cứ báo quá hạn như bình thường | Khớp hành vi cũ |
| **C08** | Hạn chấm Normal: hết Chủ nhật của tuần thi. Nếu chưa có bài thì thêm "-" và dời sang tuần sau | **[ĐÃ CHỐT 02/10/2026 — Normal có dùng "-"; còn "-" thì dời tuần liên tục đến khi có điểm hoặc QL xác nhận huỷ kết quả môn đó. Code mới làm một phần: xem §20.4 và §20.13]** ~~Một nửa chưa rõ (ai thêm "-", và Normal có dùng "-" không) — chưa triển khai, chờ trả lời~~ |
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

> **[ĐÃ THAY 27/09 (PR-YT4, Q27-1) — đọc §20.3.]** Đoạn dưới còn đúng ở: ghi vi phạm, sửa/xoá thẳng, năm nhóm, đếm theo hành động thật, Ý thức ngoài bảng hiệu quả. **Không còn đúng ở:** "không có thứ tự xử lý" (nay thang bắt buộc 6 bậc), "chín biện pháp" và "Thư cảnh cáo 1→2→3" (nay Report 1 → Report 2 → WL 1 → Report 4 + Meeting → WL 2 → WL 3), "không có bước Quản lý duyệt" (WL 3 và loại ngoài thang cần QL duyệt), "không có hạn, chỉ cảnh báo mềm 5 ngày" (nay hạn thật 5 ngày + Quá hạn + Báo lên), "hai trạng thái Đang chuẩn bị / Đã thực hiện" (nay sáu nhãn).

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

### 18.7. Còn đúng một điểm chưa chốt: C08 — **[ĐÃ CHỐT 02/10/2026, xem §17.7 và §20.4]**

Hạn chấm Normal hết Chủ nhật tuần thi — đã đúng. Còn chưa rõ: *"chưa có bài thì thêm - và dời
sang tuần sau"* — ai thêm dấu `-` (hệ thống tự thêm hay giáo viên), và Normal có thật sự dùng
dấu `-` không (hiện Normal luôn đủ bốn môn, không có `-`). **Chưa triển khai, chờ trả lời.**


---

## 19. Chốt tối 21/09/2026 — rulebook v3: SOS tự tạo case, Phối hợp SOS, vi phạm sửa/xoá thẳng

> **[MỘT PHẦN ĐÃ THAY 27–30/09 — đọc §20.1 dòng 4, 5, 11, 17.]** Còn đúng: SOS FT tự tạo/gắn Case; GVBM có 3 ngày; tab "Ý thức & Phối hợp". **Đã đổi:** PA quy chế không "điền sẵn rồi chỉnh" mà ở "Chờ xác nhận"; "Không cần theo dõi" phải QL duyệt trong 5 ngày; lớp Normal không còn mô hình tín hiệu; Phối hợp SOS là việc thật không hạn.

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
- **[ĐÃ THAY 06/10 — "MT cũ", PR-MTa T1, xem §20.1 dòng 20]** **MT lịch sử (T34):** lượt có tuần thi kết thúc **trước ngày tạo lượt** — cờ lưu lúc tạo. Không nợ, không hạn, không quá hạn, không vào
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
- **[ĐÃ THAY 06/10 — PR-MTa T4, xem §20.1 dòng 21]** **Tuần đã qua (K2-33, Q8):** chỉ dùng để TẠO MT lịch sử — mọi kỹ năng đều tuần đã qua **và** em vào web sau các tuần đó. Không dời
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

- **[ĐÃ THAY 06/10 — PR-MTa T7, xem §20.1 dòng 24]** **Lý do bắt buộc (K4-15):** dời bài khi tuần thi **đã bắt đầu**, dời hạn chấm, bỏ kỹ năng, báo vắng, huỷ điểm, huỷ lượt, thi lại (≥ 5 ký
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
- **GV Speaking chấm chéo (chủ sản phẩm chốt 30/09):** GV đang được phân công **Speaking** ở một lớp Fast Track nhập được ô **S** Mock của
  **mọi lớp Fast Track cùng chi nhánh** (vì thế cần ghi GV chấm). Chỉ là **quyền**: ô S vẫn là việc / nợ điểm của GV được phân công S
  lớp đó; GV chấm chéo thấy các lớp này ở Lịch Test › "Tất cả" và mở được lưới / hồ sơ Mock, không thấy thêm hồ sơ HV hay Case. Lớp
  thường không áp; chi nhánh khác không áp.
- **Bài đã xác nhận vắng không nhập trong lưới (T53 Q6):** ô hiện "vắng", không ô nhập — nhập bù thì Quản lý "Xếp lại bài vắng" /
  "Khôi phục" trước.
- **Hồ sơ Mock:** năm ô điểm lớn L · R · W · S · Overall; ai sửa được bài nào (GVBM đúng kỹ năng · Quản lý · GVCN với MT lịch sử) bấm ô
  là sửa tại chỗ, sửa điểm đã có vẫn ghi lý do (RB-5). Kết quả đợt dùng mức SOS (chặn trần 3), không đếm số môn trượt.
## PR-HVL — Học viên & Lớp, Cần hỗ trợ theo kỹ năng, Phân tích lớp (30/09/2026)

- **Chip Học viên & Lớp:** `Tất cả · Cần làm · Chờ duyệt · Đang SOS · Thiếu thông tin`. **Cần làm** = em có việc tiếp theo tone đỏ (quá hạn) hoặc vàng (Xác nhận nguyên nhân / Xác nhận PA, Ý thức bắt buộc, Đề ra PA chưa hạn);
  không tính Nhập điểm (đã có badge "bài chờ chấm"). **Chờ duyệt** = em có yêu cầu đang chờ Quản lý. **Đang SOS** chỉ Fast Track. Link cũ `case_working / case_no_plan / case_overdue` mở Cần làm.
- **Lớp thường không SOS ở danh sách** (T58): cột Kết quả ghi `n/4 môn đạt` (Giữa khoá) hoặc `%` tổng (Cuối khoá đủ điểm, Pre FOU) + `Không đạt: …`; SOS lớp thường chỉ còn ở nơi PR-LT2b sẽ sửa.
- **Một nguồn việc tiếp theo** (`viecTiepCuaEm`): việc của một Case = nguyên `viecTiepCuaCase` (chỉ rút gọn chữ); cùng nguồn cho cột Việc tiếp theo, cột Theo dõi bảng điểm FT và Cần hỗ trợ. Việc Nhập điểm trùng chữ ở ≥ 2 em → một dòng "Cả lớp" đầu lớp.
- **Badge lớp theo vai:** GV thấy trước bài chờ chấm / HV quá hạn; Quản lý thấy trước chờ duyệt / cần xếp lớp tiếp. Hiện 2 badge, còn lại "+n" bấm được. Không còn badge "Case mở" (Case vào Cần hỗ trợ).
- **Cần hỗ trợ theo kỹ năng:** chỉ em có Case mở; số hàng theo chương trình (FT L·R·W·S, W nhận cả W1/W2 · BE/ELE L·R·W·S · FOU L·R·G+V·P · Pre FOU một hàng Tổng hợp) + hàng "Chung" cho Case không gắn kỹ năng; mỗi Case một dòng với PA đang làm và việc tiếp + hạn; bấm mở Ngăn Case tại chỗ.
- **Phân tích lớp:** mỗi số là độ dài một tập id, bấm ra danh sách đúng số đó (`/issue-board/o`). "Thành công" của Case = đã xong và kết luận tiến bộ rõ / một phần. Số "Đã thực hiện / Thành công" theo loại PA dùng chung `planOutcomes` với Phân tích › Hiệu quả PA (khác nhau chỉ vì khung thời gian 52 tuần và Case chưa có lỗi chính).
  Lớp thường có dòng "Cả bài" (% tổng ≥ ngưỡng đạt chung); Pre FOU không có.
- **Đầu hồ sơ lớp:** một nút chính theo chặng (`nutChinhDauTrang`); ô Giữa khoá ở Lịch kiểm tra chỉ với chương trình có mốc Giữa khoá; khung hết khoá không tô đỏ.

## PR-LT3 — Lịch Test ba khối, Speaking Mock chấm chéo (chủ sản phẩm chốt 05/10/2026, tối) — **CHƯA CÓ trong code**

Nguồn: ảnh MT4 "W1 OCT" hiện cùng lúc ở "Nợ tuần trước" và Lịch Test tuần W2 OCT. Kiểm code: hạn đúng luật (hạn thứ Tư tuần kế = 07/10); phần gây rối là hai lịch khác bản chất trộn một màn.

- **Hai lịch khác nhau:** *lịch thi của học viên* (em thi môn nào tuần nào, theo `planned_period_id` từng môn) và *lịch chấm của GV* (bài đã thi, còn nợ điểm, hạn chấm). Một MT có môn dời tuần thì hai lịch lệch nhau — bình thường, không phải lỗi.
- **Ba khối ở Lịch Test, một bài đúng một khối** (T15): (1) **Test quá hạn chấm** — chưa chấm, qua hạn (`quaHanNhapDiem`) **và** đã sang tuần thứ hai sau tuần thi, thu gọn mặc định; (2) **Test chấm tuần này** — thi tuần trước, chưa chấm, **ở lại hết tuần (Chủ nhật) kể cả đã quá hạn** (quá hạn chỉ thêm badge "Quá hạn", không đỏ cả dòng; Thứ Hai tuần sau mới sang khối 1), mở sẵn, trình bày như Lịch Test hàng tuần; (3) **Lịch Test tuần này** — ai thi gì tuần đang xem, thu gọn mặc định. Bài thi tuần trước chưa vào khối 1 trong cùng tuần, dù đã quá hạn. Đổi tên "Nợ tuần trước" → "Test quá hạn chấm".
- **Lùi / tiến tuần** (T16): khối 1 **không đổi** theo tuần xem (luôn tính theo hôm nay, theo bộ lọc phạm vi), luôn đi cùng màn; khối 2 chỉ hiện ở tuần hiện tại; khối 3 theo tuần xem. Lùi tuần chỉ để xem lại, không có đường nào làm khối 1 biến mất ngoài việc nhập điểm. Tổng ba khối = badge "n bài chờ chấm".
- **Khối 1** (T17): cột GV chấm kéo rộng, **chỉ tên GV chưa chấm**; lưới học viên là mục con nhẹ của dòng lớp (thụt vào, vạch dọc mảnh, không khung thứ hai).
- **Speaking Mock chấm chéo** (T18): không GV mặc định. Quá hạn → **báo** GVBM Speaking của lớp và GVCN lớp đó, **không tính** quá hạn / trễ / "Chờ bạn chấm" vào hai người này. GV chấm chéo nhập điểm (người ghi ở "GV chấm Speaking") nhập sau mốc trễ thì **tính trễ cho người đó**; tên người ngoài không tài khoản → không tính cho ai. **Thay** các dòng "ô S là việc / nợ điểm của GV được phân công S lớp đó" (PR-HSM, §20.9) **chỉ với Mock**; lớp thường không đổi.
- **Chờ chủ sản phẩm xác nhận:** (a) dải số bốn ô đầu Lịch Test sau khi có ba khối; (b) tiêu đề khối 3 khi xem tuần khác ("Lịch Test W1 OCT"); (c) hiểu câu "không tính quá hạn cho các GV này" như trên.

---

## 20. Tổng hợp luật hiện hành — đối chiếu với code `main` ngày 02/10/2026

**Ưu tiên hơn mục 1–19 khi trái nhau.** Mục 17–19 và các khối PR-MT … PR-HVL ở trên vẫn là lịch sử quyết định; chỗ nào trái mục này thì mục này thắng. Không xoá dấu vết.

**Nguồn:** đặc tả nâng cấp 27/09 và các chốt Q27–Q31 (`docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md`) · kế hoạch PR 28/09–01/10 (`docs/superpowers/plans/`) · bảng thuật ngữ 01/10 · lời chủ sản phẩm 02/10 · code đã merge, HEAD `0aad2a0a`. Đường dẫn code tính từ gốc repo; `sd/` = `shared/domain/`, `ss/` = `server/src/`.

**Nhãn:** **CODE-OK** — code đang chạy đúng luật (đã đối chiếu ngày 02/10) · **CHƯA CÓ** — chủ sản phẩm đã chốt nhưng code chưa làm · **CHỜ CHỐT** — hai nguồn lệch nhau, cần chủ sản phẩm quyết (liệt kê ở 20.13).

**Vì sao cần mục này:** Rulebook dừng ở 21/09 cộng vài khối PR đến 30/09. Đợt nâng cấp 27–28/09 và các PR sau đó đã đổi nhiều luật mà Rulebook chưa chép; ai viết tài liệu hay sổ tay chỉ từ §1–19 sẽ sai (đã xảy ra ngày 02/10). **Viết tài liệu cho người dùng: đối chiếu mục 20 + hàm trong `sd/`, đừng chỉ đọc §1–19.**

### 20.1 Bảng thay thế — luật cũ → luật hiện hành

| # | Luật cũ trong Rulebook | Luật hiện hành | Mã nguồn · code |
|---|---|---|---|
| 1 | §5, §17.7 C01: GVBM cập nhật PA **trước hết Chủ nhật** hằng tuần | Kết quả của tuần Thứ Hai → Chủ nhật phải ghi xong **trước hết Thứ Hai tuần kế**. Ghi ngày Chủ nhật hay Thứ Hai đều khép đúng tuần vừa hết. Áp mọi PA học thuật (FT, lớp thường, PA quy chế, PA bổ trợ); không áp Ý thức, Phối hợp SOS | Q27-9, R-PA1 · `sd/cases.ts:847` `weeklyUpdateDue` · CODE-OK |
| 2 | §5: "Dự kiến kết thúc" mặc định Chủ nhật tuần sau | Bỏ ô "Dự kiến kết thúc" ở mọi form PA. PA thường chạy đến khi GV bấm Kết thúc PA; PA quy chế kết thúc theo mốc quy chế. Dự kiến kết thúc không còn là hạn và không sinh việc | Q28-4 · `ss/cases/cases.ts:725,831` · CODE-OK |
| 3 | §5: cập nhật có hai lựa chọn Tiếp tục theo dõi / Kết thúc PA | Ghi kết quả bắt buộc chọn: **Giữ nguyên · Điều chỉnh** (người + mô tả) **· Xin hỗ trợ QL**. "Xin hỗ trợ QL" không dừng PA; thành thẻ Xin ý kiến (5 ngày), QL trả lời bằng chữ | T63, T64 · `sd/sosV4.ts:48` · `ss/cases/cases.ts:2876,3049` · CODE-OK |
| 4 | §19: SOS FT tự tạo Case và **điền sẵn** PA; GVBM xác nhận/chỉnh | Case tự tạo cùng PA quy chế ở trạng thái **Chờ xác nhận** — không tự chạy, không huỷ được. GVBM đúng kỹ năng có **3 ngày** (tính cả ngày đầu) chọn **một trong hai**: Xác nhận nguyên nhân (rồi Xác nhận PA) hoặc Không cần theo dõi | S4-1, S4-2 · `ss/cases/sosAuto.ts:71-81,184-231,346-385` · CODE-OK |
| 5 | §19: "Không cần theo dõi" đóng ngay kèm lý do | Thành thẻ **Chờ duyệt (Học thuật), QL duyệt trong 5 ngày**. Duyệt → Case và mọi PA chưa xong huỷ (không tính thất bại, ngoài hiệu quả PA). Từ chối (bắt buộc lý do) → Case về "Chờ xác nhận nguyên nhân", hạn mới 3 ngày kể từ ngày từ chối | S4-5…7 · `ss/cases/sosAuto.ts:407-509` · CODE-OK |
| 6 | §18.6: C01 "hai mốc riêng" (3 ngày nguyên nhân, rồi 5/3 ngày có PA) | Chỉ còn đúng cho **Case GV tạo tay** (Bình thường 5 ngày / Gấp 3 ngày). **Case SOS dùng một hạn 3 ngày** cho cả Xác nhận nguyên nhân lẫn Xác nhận PA | SOS-2 · `sd/sosV4.ts:15-17` · CODE-OK |
| 7 | §18.3: Ý thức không có thứ tự xử lý; chín biện pháp; chỉ Thư cảnh cáo 1→2→3 | **Thang bắt buộc 6 bậc** (mục 20.3). Ba loại cũ (trao đổi ngắn, GV meeting, CX meeting HS/PH) bỏ khỏi danh sách | Q27-1, V4-8 · `sd/yThuc.ts:78` · CODE-OK |
| 8 | §18.3 (Y01): GVCN tự làm hết, **không có bước Quản lý duyệt** | **WL 3** và các loại ngoài thang (Meeting CX/GĐCN, Đình chỉ học tạm thời, Khác) **cần QL duyệt trong 5 ngày**, kèm mô tả và bằng chứng (WL 3 đề xuất được bất kỳ lúc nào, không còn là bậc cuối của thang — sửa 02/10) | V4-9, V4-10 · `sd/yThuc.ts:106` · `ss/yThuc/xuLy.ts:384-443` · CODE-OK |
| 9 | §18.3, §18.4: Ý thức không có hạn, chỉ **cảnh báo mềm 5 ngày** | **Hạn thật 5 ngày** (tính cả ngày đầu) → nhãn **Quá hạn** + thẻ **Báo lên** QL. ≥ 3 vi phạm trong tuần này + tuần trước = **bắt buộc xử lý** | V4-2…5 · `sd/yThuc.ts:126,156-208` · CODE-OK |
| 10 | §18.3: biện pháp có hai trạng thái Đang chuẩn bị / Đã thực hiện | Nhãn vi phạm: **Mới · Đã ghi nhận · Cần xử lý · Quá hạn · Chờ QL duyệt · Đã xử lý**. "Đang soạn" chỉ là trạng thái nội bộ, không hiện | YT4-1 · `sd/yThuc.ts:122-129` · CODE-OK |
| 11 | §19: lớp Normal giữ mô hình tín hiệu theo số môn | Lớp thường **không có chữ SOS ở đâu cả**. Giữa khoá: môn < 70 % tự tạo Case + PA Bổ trợ bắt buộc. Cuối khoá: không sinh Case, dùng dải % tổng (mục 20.6) | T58, N1 · `ss/normal/regular.ts:746-838` · CODE-OK |
| 12 | §17.1, §18.7: Normal chưa rõ có dùng "-" không (C08) | **Normal có dùng "-"**; luật chốt 02/10 ở mục 20.4. Code mới làm một phần | Chủ sản phẩm 02/10 · `ss/normal/regular.ts:591-738` · CODE-OK một phần, xem 20.4 |
| 13 | §3.3, §10: Normal luôn đủ bốn môn L/R/W/S | **FOU** hiện L · R · **G+V** · **P**; **Pre FOU** không chia môn (một ô Tổng hợp, chỉ Cuối khoá); BE, ELE L · R · W · S | Q27-13 · `sd/normal.ts:156-163` · CODE-OK |
| 14 | §10: QL/GVCN sửa mục tiêu, lộ trình | Chỉ **QL** sửa Target và lộ trình (`cycle.edit`, bắt lý do + ngày hiệu lực). GVCN bấm **Đề xuất sửa** (lý do bắt buộc — PR-MTa T7 bỏ tối thiểu 15 ký tự). GVCN vẫn tự sửa họ tên, ngày sinh, email, tuần bắt đầu, thi dự kiến | T44 · `ss/fasttrack/cycles.ts:244` · CODE-OK |
| 15 | §10: Chuyển lớp (GVCN làm, có "Không có lưu ý") | Mọi lần chuyển lớp là **lệnh do Quản lý ra**; GVCN chỉ "Đề xuất chuyển lớp"; bàn giao có hạn riêng (mục 20.7) | Q30-1…4 · `ss/classes/lenhChuyen.ts` · CODE-OK |
| 16 | §10: Thêm HV, '-' là thiếu dữ liệu | **Email bắt buộc khi thêm mới**; bảng dán **bắt buộc có dòng tiêu đề** chứa "Họ và tên"; dòng lỗi ở lại panel, không khoá cả lô **[ĐÃ THAY 04/10 — dòng tiêu đề không bắt buộc, xem dòng 19]** | NHAP-1/2 · `ss/classes/intake.ts:245-250` · CODE-OK |
| 17 | §19: Phối hợp SOS điền sẵn, GVCN xác nhận hoặc bỏ | Phối hợp SOS là **việc thật, một dòng mỗi lớp cho GVCN, không hạn**; chỉ sinh từ lượt Mock FT (lớp thường có việc "Báo phụ huynh qua TVV" riêng) | VAI-a·Q14 · `ss/yThuc/phoiHop.ts:307` · CODE-OK |
| 18 | §9, §17.7: không có hộp duyệt chung | **Một hộp "Chờ duyệt"** cho Quản lý (mục 20.5) | Q27-3 · `sd/yeuCauDuyet.ts` · CODE-OK |
| 19 | §10, K2-41/YC-5.2: lớp thường không có Target; dán Excel bắt buộc tiêu đề | **Lớp thường có Target + Dự kiến thi** (chủ sản phẩm 04/10): nhập ở Thêm học viên (lưới 6 cột: Họ tên · Ngày sinh · Email · Target · Dự kiến thi · Tuần bắt đầu) và Thông tin HV; đầu hồ sơ hiện cạnh Cuối khoá. Đổi Target bắt lý do + `cycle.edit` (GVCN: Đề xuất sửa); Dự kiến thi `student.edit`. **Không** kỳ vọng, SOS, MT, Case, việc "Điền Target" theo Target lớp thường; KCK lớp thường không loại em khỏi số liệu lớp thường. Lên lớp / học lại / chuyển giữa các lớp thường **mang theo** Target + Dự kiến thi. Dán Excel **không bắt buộc dòng tiêu đề**: không có thì đọc theo thứ tự cột lưới, panel nói rõ cách đã đọc và cho đổi bằng một nút | PR-NT · `sd/nhapHocVien.ts` (`cotLuoiNhap`, `docDongDan`) · `ss/classes/intake.ts` (`parsePaste`) · `ss/classes/luatLoTrinh.ts` · `ss/fasttrack/cycles.ts` (`apTargetLuotChuaDiem`) · CODE-OK |
| 20 | T34, K2-33(1): MT lịch sử = tuần thi kết thúc trước ngày tạo lượt; tuần đã qua chỉ để tạo MT lịch sử, phải trước ngày em vào web | **MT cũ** (chữ trên màn: "MT cũ", chip "cũ") = lượt được **xếp vào** tuần thi cách tuần hiện tại **≥ 2 tuần** (Chủ nhật tuần thi muộn nhất < thứ Hai tuần trước), tính lúc xếp / dời. Tuần trước = MT thường (có hạn chấm). Bỏ điều kiện ngày vào web | PR-MTa T1 · `sd/lichMt.ts` `laMtCu`, `kiemTuanXep` · `ss/fasttrack/skillSchedule.ts` `tinhLaiMtCu` · CODE-OK · PR-MTa |
| 21 | K2-33: không ai dời lượt có sẵn vào tuần đã qua | **Quản lý / Quản trị** xếp / dời MT **và Test lớp thường** chưa thi về tuần đã qua được (trộn qua / tới được); GVCN / GV chỉ từ tuần này. Thi lại vẫn cần tuần từ tuần này | PR-MTa T4 · `ss/fasttrack/skillSchedule.ts` `setSkillWeek` · CODE-OK · PR-MTa |
| 22 | Q-0310-2: dời MT vượt MT sau đã có điểm → chặn | Dời vượt **không chặn**. Lượt bị vượt: bỏ lịch; có điểm → điểm **chuyển sang `ket_qua_huy`** (không xoá, không tính SOS/báo cáo/Xuất Excel), Case sinh riêng tự đóng "Kết quả MT đã huỷ"; cần xác nhận + lý do. Chưa điểm → không hỏi. Quản lý **khôi phục** được (chặn khi ô đã có điểm mới hoặc lượt vượt vẫn đứng sau). Xếp hàng loạt: dòng mang hệ quả, lưu khi có xác nhận + lý do | PR-MTa T2 · `ss/fasttrack/ketQuaHuy.ts` · `skillSchedule.ts` `kiemXacNhanVuot`, `boLichLuotBiVuot` · CODE-OK · PR-MTa |
| 23 | K4-28: "-" lần 2 → đề nghị chờ Quản lý | Vắng **lần 2** ở Mock → kỹ năng **huỷ (vắng 2 lần)**, chuông GVCN, không tự tạo thẻ. GVCN **Xin dời** → thẻ "Dời lịch" như cũ; QL từ chối hoặc bấm **Không mock lại** → kỹ năng bỏ khỏi đợt (đợt hoàn thành được); thẻ hết hạn → giữ huỷ. Lớp thường giữ luật "-" dời tuần sau | PR-MTa T3 · `ss/fasttrack/absence.ts` `huyVangNoi`, `xinDoi`, `khongMockLai` · CODE-OK · PR-MTa |
| 24 | K4-15, RB-5: lý do ≥ 5 ký tự cho dời lịch (tuần đã bắt đầu), dời hạn, bỏ kỹ năng, báo vắng, sửa điểm, thi lại… | Lý do **bắt buộc chỉ khi** huỷ lượt, huỷ kết quả do dời vượt, Quản lý từ chối. Còn lại tuỳ chọn. **Không còn tối thiểu ký tự ở mọi nơi** (kể cả Đề xuất sửa 15, thẻ Chờ duyệt 3, chuyển lớp 3, đổi Target 5): bắt buộc = không trống | PR-MTa T7 · `sd/thaoTacMt.ts` `canLyDo`, `kiemLyDoThaoTac` · CODE-OK · PR-MTa |
| 25 | L/R chỉ nhận số câu; W/S chỉ 4 tiêu chí | Máy chủ nhận **band trực tiếp** (`band`, 0–9 bậc 0.5) cho L/R/W1/W2/S, không cùng số câu / tiêu chí. Overall, SOS, kỳ vọng như cũ. Ô web là việc PR-MTb | PR-MTa T10 · `sd/chamDiem.ts` `kiemBand`, `docONhapLR` · `ss/fasttrack/attempts.ts` `saveScore` · CODE-OK máy chủ · PR-MTa |
| 26 | — | Người **khác GVCN** dời Test lớp thường → **một chuông** "để biết" cho GVCN (một em một ngày; xếp hàng loạt một chuông cả lớp). GVCN tự dời, "-" không chuông. Không thẻ, không Case | PR-MTa T11 · `ss/fasttrack/skillSchedule.ts` `baoGvcnDoiLichThuong` · CODE-OK · PR-MTa |
| 27 | C08: hạn chấm lớp thường hết Chủ nhật tuần thi; nhập điểm được trước tuần thi | **Không ai** (kể cả Quản lý, Quản trị) nhập điểm khi kỹ năng / môn **chưa tới tuần thi** hoặc chưa xếp tuần — ô khoá; MT cũ và bài quá hạn vẫn nhập (tính trễ như cũ). Hạn chấm lớp thường = **thứ Tư tuần sau** như Fast Track | PR-MTa T19 (chủ sản phẩm 06/10) · `ss/fasttrack/skillSchedule.ts` `kiemDaToiTuanThi` · `ss/platform/week.ts` `skillScoreDeadline` · CODE-OK · PR-MTa |
| 28 | §10.4: phần đã thi / đã có điểm không dời như lịch tương lai | **Quản lý / Quản trị** dời kỹ năng / môn **đã có điểm** (FT và lớp thường) sang tuần bất kỳ, kể cả tuần cũ hơn — điểm đi theo, không đổi; cờ MT cũ tính lại. Dời vượt lượt sau vẫn theo dòng 22. GV giữ luật cũ | PR-MTa T20 (06/10) · `ss/fasttrack/skillSchedule.ts` `setSkillWeek` · `ss/keHoach/keHoachTest.ts` `kiemDotNoi` · CODE-OK · PR-MTa |
| 29 | §10.6: khôi phục phần đã huỷ chỉ vào tuần chưa tới | Quản lý khôi phục vào **tuần này hoặc tuần đã qua** được, rồi nhập điểm ngay | PR-MTa T21 (06/10) · `ss/fasttrack/absence.ts` `restoreCancelledSkill` · CODE-OK · PR-MTa |
| 30 | Dòng 24 (T7): xoá trắng ô có điểm = huỷ điểm, lý do bắt buộc; MT cũ: GVCN chỉ ô trống | Xoá trắng ô đã có điểm rồi Lưu = xoá, **lý do tuỳ chọn** (nhật ký vẫn ghi cũ → mới). Menu **Huỷ điểm** cũng **tuỳ chọn** (chủ sản phẩm 06/10); huỷ lượt, huỷ kết quả do dời vượt, từ chối vẫn bắt lý do. **MT cũ: Quản lý + GVCN lớp đó** sửa / xoá cả ô đã có điểm, kể cả sau khoá 7 ngày (R11) | PR-MTa T22 (06/10) · `ss/fasttrack/attempts.ts` `saveScore` · `ss/normal/regular.ts` `saveRegularScore` · `ss/permissions.ts` `scoreEditPath`, `editableSkills` · CODE-OK · PR-MTa |
| 31 | K4-20: MT lịch sử không nhận "-" | MT cũ nhận **"-" = Không dự thi**: chốt cuối ngay lúc ghi (`no_show_cu`) — kể cả khi lượt sau đó thành MT thường, không tính lần vắng, không tự dời, không Case / thẻ / chuông; ô không còn đếm "còn trống" / "MT cũ chưa nhập"; gỡ dấu hoặc nhập điểm đè được | PR-MTa T23 (06/10) · `ss/fasttrack/attempts.ts` `saveScore` · `ss/fasttrack/absence.ts` `settleNoShows` (bỏ qua MT cũ) · `ss/cham/canCham.ts` `mtLichSuChuaNhap` · CODE-OK · PR-MTa |

### 20.2 Bảng hạn tổng hợp

Mọi hạn "n ngày" là **n ngày liên tiếp theo lịch, tính cả ngày bắt đầu**; không có "ngày làm việc"; quá hạn khi hôm nay > hạn (Q27-5 · `sd/cases.ts:739`). Em **Tạm dừng**: mọi hạn của em dừng, việc ẩn, không bao giờ quá hạn (T65).

| Việc | Hạn | Nguồn |
|---|---|---|
| Xác nhận nguyên nhân SOS (FT) và Case Giữa khoá lớp thường | 3 ngày kể từ ngày ghi nhận; Xác nhận PA cùng hạn đó | `sd/sosV4.ts:15-17` |
| Có PA — Case GV tạo tay | Bình thường 5 ngày · Gấp 3 ngày, từ ngày Case được tạo | `sd/cases.ts:827,837` |
| Ghi kết quả PA hằng tuần | Hết **Thứ Hai** tuần kế | `sd/cases.ts:847` |
| PA quy chế: ghi kết quả cuối | Khi chạm mốc quy chế: "1 tháng" · "đến MT kế tiếp" · "đến lúc thi" (MT5 trở đi: Tutor đến lúc thi). Quá mốc → hạn hết Thứ Hai. Chưa có lịch mốc → PA chạy tiếp, hiện "chờ lịch" | `sd/sos.ts:54-94` |
| QL duyệt một thẻ | 5 ngày. Riêng **kế hoạch bổ trợ 3 ngày**; **dời lịch lần 2** hết Chủ nhật tuần gửi; **Báo lên** không hạn. Quá hạn chỉ báo QL + Quản trị, không tự đóng (trừ lịch thi: hết hạn thì huỷ phần thi) | `sd/yeuCauDuyet.ts:40-61` |
| Chấm Fast Track (và lớp thường từ PR-MTa T19) | Hết **Thứ Tư** tuần kế tiếp tuần thi của chính kỹ năng đó. "Quá hạn" chỉ khi tuần thi đã hết và qua hạn. Hạn riêng: lý do tuỳ chọn (PR-MTa T7) | `ss/platform/week.ts:68-113` |
| Chấm lớp thường | Hết **Thứ Tư** tuần kế tiếp (PR-MTa T19, trước là Chủ nhật tuần thi) | `ss/platform/week.ts:89-92` |
| Dấu "-" Fast Track | Sửa được đến hết Chủ nhật; chốt đầu Thứ Hai (cron 00:05 và 06:05 giờ VN) | `ss/ops/chotVangDinhKy.ts` |
| Ý thức: xử lý | 5 ngày kể từ ngày ghi lên web (hoặc từ ngày vi phạm thứ 3 nếu "bắt buộc"); sau khi QL duyệt: 5 ngày để bấm Đã thực hiện | `sd/yThuc.ts:126,156-208` |
| Bàn giao chuyển lớp | GVBM 2 ngày · GVCN 3 ngày, tính từ ngày ra lệnh; quá hạn không chặn việc chuyển | `sd/chuyenLop.ts:36-39` |
| Mini Test (sau Cuối khoá) | Chủ nhật tuần cuối PA cộng 2 ngày lịch | `sd/cuoiKhoa.ts:89-93` |
| Khoá sửa điểm sau khi đợt hoàn tất | GVBM không sửa; chỉ Quản lý. MT cũ khoá 7 ngày sau lần nhập cuối | `sd/keHoachTest.ts:69-81` |
| Cửa sổ MT cũ sinh Case/PA/Phối hợp | 28 ngày trước ngày tạo | `sd/lichMt.ts:13` |
| Kỳ vọng MT | MT1 = Target − 1.0 · MT2 = Target − 0.5 · MT3 trở đi = Target · RF: mọi MT = Target. Trần MT8 | `sd/fasttrack.ts:15-21` |

### 20.3 Ý thức (thang xử lý) — thay §18.3

- **Ai ghi vi phạm:** mọi giáo viên dạy lớp; bắt buộc học viên · ngày xảy ra · nhóm · mô tả. Năm nhóm (Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác). Sai thì **sửa hoặc xoá thẳng** (§19); người ghi sửa/xoá vi phạm của mình, GVCN lớp em đang học sửa/xoá được mọi vi phạm của em.
- **Thang bắt buộc theo thứ tự** (chủ sản phẩm sửa 02/10), hiện một dòng trên màn. **Mạch chính 6 bậc: Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN → Report 5 → WL 2.** Sau WL 2 thang **không có đỉnh**: Report 7 → Report 8 → Report 9 … tăng số mãi (số Report = số bậc; bậc 3 và bậc 6 là WL nên không có Report 3, Report 6). WL = thư cảnh cáo. **WL 3 không nằm trong thang**: khi GV muốn WL 3 hoặc phương án khác thì phải có QL can thiệp (đề xuất → QL duyệt). Mỗi lần "Xác nhận xử lý", máy tự điền bậc kế tiếp (web không gửi loại). Bậc không lùi, kể cả khi xoá vi phạm. `sd/yThuc.ts:78`
- **GVCN lớp em đang học tự làm được MỌI bậc của thang, kể cả Report 7 trở đi** (một bước, mô tả ≥ 10 ký tự, ngày thực hiện ≤ hôm nay, người thực hiện là GV hoặc tên ngoài, gộp nhiều vi phạm; tệp không bắt buộc). Không hỏi tiến bộ. QL chỉ nhận thông báo "để biết" khi GVCN xử lý WL 1, Report 4 + Meeting, WL 2; Report 1, 2, 5 và Report 7 trở đi không báo.
- **Cần QL duyệt:** WL 3 (đề xuất bất kỳ lúc nào) và ba loại khác **ngoài thang**: Meeting CX/GĐCN đứng riêng, Đình chỉ học tạm thời, Khác (ghi rõ ≥ 3 ký tự). Quy trình: GVCN **đề xuất** (mô tả + ít nhất một tệp/liên kết bằng chứng) → QL duyệt trong 5 ngày → GVCN bấm **Đã thực hiện** (hạn 5 ngày từ ngày duyệt). Từ chối → vi phạm về "Cần xử lý", bậc giữ nguyên. Loại ngoài thang (gồm WL 3) **không đẩy bậc**. Bậc 4 "Report 4 + Meeting" không cần QL, còn "Meeting CX/GĐCN" đứng riêng thì cần — đúng như chốt, dễ bị hỏi lại.
- **Bắt buộc xử lý:** từ 3 vi phạm (mọi nhóm) chưa nằm trong lần xử lý nào, xảy ra trong [Thứ Hai tuần trước, ngày ghi]. Nút "Ghi nhận" biến mất, chỉ còn "Xác nhận xử lý". "Đã ghi nhận" vẫn đếm. Cửa sổ neo vào **ngày ghi** của vi phạm, nên vi phạm ghi muộn vẫn "dính".
- **Quá hạn:** bắt buộc xử lý quá 5 ngày chưa có lần xử lý xong; hoặc vi phạm Mới quá 5 ngày chưa ai Ghi nhận/Xử lý → nhãn Quá hạn + một thẻ **Báo lên** QL cho mỗi em (tự đóng khi hết lý do).
- **Đếm thang theo lộ trình:** FT sang lộ trình mới về Report 1. **Lớp thường đếm liên tục** qua chuỗi Pre FOU → FOU → BE → ELE (kể cả học lại), về Report 1 khi sang FT hoặc nghỉ học. Học sinh cũ: GVCN/QL **khai bậc** một lần (≤ bậc 6 = WL 2; sửa chỉ QL; chỉ khi chuỗi chưa có lần xử lý). Em chuyển lớp: hạn đặt lại từ ngày vào lớp mới; chỉ GVCN lớp đang học xử lý.
- **Ý thức nằm ngoài mọi bảng hiệu quả hỗ trợ**; đếm theo hành động thật (một Report gom ba vi phạm là một Report). Cảnh báo trùng mềm (cùng em, cùng nhóm, cùng ngày) vẫn cho tạo mới.
- Việc Ý thức là **việc thật có hạn**: xử lý bắt buộc, ghi nhận, đã thực hiện, khai bậc.

### 20.4 Dấu "-" (không có bài)

**Fast Track — CODE-OK** (khớp §17.1 và khối PR-MT/PR-XLMT; chốt đầu Thứ Hai chạy bằng cron Netlify, có cả khi không ai mở web):
- GV đúng ô gõ "-"; GVCN/QL báo vắng qua menu (lý do tuỳ chọn — PR-MTa T7, từ Thứ Hai tuần thi). Sửa được đến hết Chủ nhật; điểm thật thắng "-"; ô đã có điểm không xoá được bằng "-".
- Hết Chủ nhật còn "-" → **Không dự thi**. **Lần 1 máy tự dời** sang tuần kế (nếu còn thi được), báo GVCN + GVBM đúng kỹ năng. **Lần 2** (PR-MTa T3, §20.1 dòng 23) → kỹ năng **huỷ (vắng 2 lần)**, chuông GVCN; GVCN **Xin dời** → đề nghị chờ QL (hạn hết Chủ nhật tuần gửi, tuần đích mặc định = tuần chưa bắt đầu gần nhất hợp luật); QL từ chối (lý do bắt buộc, không tối thiểu ký tự) → không mock lại; hết hạn → giữ huỷ. Đề nghị chuyển QL ở lần 1 (xử lý muộn): từ chối / hết hạn → **huỷ phần thi** (giữ điểm các phần khác); chỉ QL khôi phục.
- Nhập "-" cho tuần đã kết thúc: chốt ngay. Sau cuối tuần chỉ QL sửa kết luận, ghi đè trực tiếp. Writing chỉ chốt khi cả W1 và W2 đều "-", đếm một lần.
- **Xoá "-" = hết vắng** (PR-BV, chủ sản phẩm 06/10): ô đã chốt vẫn hiện "-" (kèm tuần mới nếu đã dời) tới khi có điểm. Xoá "-" → trả như trước khi gõ (tuần gốc, lần vắng −1, đề nghị / Xin dời chưa xử lý rút, huỷ vắng 2 lần trở lại); đã có quyết định của người (duyệt, từ chối, khôi phục, không mock lại, xếp lại) thì giữ lịch + trạng thái, thẻ thêm "vắng đã gỡ". Không chuông mới.
- **Ai xoá "-"**: GV chấm ô đó hoặc GVCN đến hết thứ Tư sau tuần có "-"; QL / Quản trị mọi lúc. Quá khung: "Quá hạn chấm — nhờ Quản lý."
- **Xoá điểm rồi nhập lại** (tẩy ô / Huỷ điểm làm Case đóng, nhập lại vẫn trượt) → mở lại đúng Case đó, PA cũ về như trước. Thi lại, sửa thành đạt, lượt khác → Case mới như cũ.

**Lớp thường — chủ sản phẩm chốt 02/10 (thay §17.1 dòng "Normal không hủy", C08 §17.7, §18.7):**
> Normal có dùng "-". Còn "-" thì bài **dời sang tuần sau, lặp lại**, cho đến khi **có điểm** hoặc **QL xác nhận huỷ kết quả điểm môn đó** thì dừng.

Code đã có (`ss/normal/regular.ts:591-738`): GV đúng ô gõ "-" (hoặc GVCN/QL qua menu Báo vắng, lý do tuỳ chọn, từ Thứ Hai tuần thi); môn **dời ngay sang tuần sau của chính bài đó**; lặp không giới hạn; thông báo GVCN từ lần vắng thứ 2 (lần vắng = số lần ghi "-" trừ số lần xoá "-", PR-BV). Xoá "-" khi tuần mới đã có điểm: chỉ hết vắng, lịch và điểm giữ ở tuần mới (PR-BV); khung xoá như Fast Track. Xoá một môn của bài đã đủ điểm → bài về "Chờ điểm".

**CHƯA CÓ trong code (khoảng cách giữa luật chốt và web):**
1. **Không có nút QL "xác nhận huỷ kết quả điểm môn đó".** Gần nhất chỉ có thẻ Báo lên "Cuối khoá dời quá hạn" (QL nhắc GVCN, không huỷ được gì).
2. **Dời đi theo lúc GV ghi "-", không phải "còn '-' cuối tuần thì tự dời".** Không có cron cho lớp thường; mỗi tuần mới GV phải ghi "-" lại bằng tay. Nếu GV không ghi thì ô vẫn nợ điểm.
3. Không có bộ đếm lần "-" riêng (số lần chỉ suy ra từ nhật ký để báo GVCN).
4. Dời bị chặn khi vướng đợt kế (Giữa khoá không qua được tuần Cuối khoá): web báo "Nhờ Quản lý dời lịch ở Kế hoạch Test" và **dấu "-" không lưu**; GV bị kẹt.

### 20.5 Hộp Chờ duyệt của Quản lý

- Mọi việc "xin QL quyết" là **một thẻ** trong **một hộp** Công việc › **Chờ duyệt** (tab đầu của QL/Quản trị; giáo viên xem "Yêu cầu của tôi"). Năm phân loại: **Học thuật · Ý thức · Lịch thi · Thông tin HV · Báo lên**. Duyệt tài khoản đăng ký nằm ở Quản trị, ngoài hộp. `sd/yeuCauDuyet.ts:10-61`
- Các loại thẻ và hạn: xem 20.2. Thẻ gồm: Đề xuất PA · Xin ý kiến · Không cần theo dõi · Kế hoạch bổ trợ (3 ngày) · Dời lịch lần 2 · Đề xuất sửa (target, lộ trình, lịch MT, khác — **không còn trường "Lớp"**) · Đề xuất chuyển lớp · Xử lý Ý thức cần duyệt · Báo lên.
- **Từ chối bắt buộc lý do** (không trống — PR-MTa T7 bỏ tối thiểu 3 ký tự). Xin ý kiến chỉ "Trả lời"; Báo lên chỉ "Nhắc {GV}", không có nút Duyệt, tự đóng khi việc gốc xong. Duyệt hàng loạt chỉ cho Đề xuất PA và Dời lịch cùng loại.
- **Chỉ QL và Quản trị hệ thống duyệt** (quyền `request.approve`) trong phạm vi chi nhánh. **GVCN và GVBM không bao giờ duyệt.** QL kiêm GV tự gửi thì **tự duyệt được**: thẻ ghi "tự duyệt", có nhật ký, báo Quản trị. (Câu "không bao giờ tự duyệt" trong đặc tả T23 đã bị Q-D thay; code theo Q-D.)
- Thẻ quá hạn duyệt: trạng thái đỏ + một thông báo cho QL chi nhánh và Quản trị; thẻ "chết" (PA đã huỷ, Case đã đóng) tự đóng khi quét. Việc quét này **chỉ chạy khi có người mở web**, nên thông báo có thể chậm.

### 20.6 Lớp thường

- **Hệ môn:** FT L · R · W1 · W2 · S (Writing tổng = W) · BE, ELE L · R · W · S · FOU L · R · **G+V** · **P** · Pre FOU **không chia môn** (một ô Tổng hợp, 5 tuần, chỉ Cuối khoá, không Giữa khoá). Kỹ năng GV "phụ trách được" luôn chỉ L · R · W1 · W2 · S. Hai khung **Fast Track / Lớp thường tách hẳn**; không còn "Cả hai" ở các khối theo kỹ năng (QL mặc định xem Fast Track; GV xem khung lớp mình dạy). `sd/normal.ts:14-17,156-163`
- **FOU thường có hai GV** (một người L·R·G+V, một người P); BE/ELE mỗi môn một người; Pre FOU chỉ GVCN (máy gán ô Tổng hợp).
- **Ngưỡng đạt 70 %** trên tỷ lệ chính xác (7/10 đạt, 23/33 chưa). Hạn chấm hết Chủ nhật tuần thi.
- **Giữa khoá (FOU, BE, ELE):** môn dưới 70 % → máy **tự tạo Case** "[Giữa khoá] {môn} không đạt" (không nhãn SOS) + **PA Bổ trợ bắt buộc** đến Cuối khoá. GVBM đúng môn xác nhận nguyên nhân trong 3 ngày; người dạy bổ trợ nộp **kế hoạch bài giảng** (mỗi ô ≥ 15 ký tự) → QL duyệt trong 3 ngày → PA chạy; từ chối thì nộp lại, hạn mới 3 ngày. **FOU: 2 buổi/tuần chung** cho mọi môn trượt (một nhóm, người dạy mặc định GVCN); **BE/ELE: 1 buổi/tuần/môn** (mặc định GVBM môn). FOU: GVBM một môn không nộp hộ và không ghi kết quả PA chung (chỉ người dạy, GVCN, QL). Có môn trượt → việc "Báo phụ huynh qua TVV" cho GVCN. Không còn nút "Bỏ qua" tín hiệu. `ss/cases/boTro.ts`
- **Cuối khoá:** % tổng = Σ điểm / Σ tổng câu (chỉ khi đủ môn), xét trên số chưa làm tròn. Dải **< 50 · 50–59 · 60–69 · ≥ 70 (Pass)**. Gợi ý (không lưu): < 50 học lại + Báo PH qua TVV (việc của QL) · 50–59 "Quản lý cân nhắc" (học lại hoặc lên + bổ trợ) · 60–69 lên + **bổ trợ miễn phí** · ≥ 70 lên. Không sinh Case trước khi chuyển. Sau khi chuyển lên: Case "Cuối khoá {CT} · {môn} không đạt" + PA Bổ trợ miễn phí (FOU/BE/ELE 1 buổi/môn trượt; Pre FOU 4 buổi nếu 50–59, 2 buổi nếu 60–69) + **Mini Test một lần** (≥ 70 % → Case tự hoàn thành; < 70 % → Case mở + Báo lên QL; sửa Mini Test chỉ QL, có lý do). Bổ trợ miễn phí không tính lương GV. `sd/cuoiKhoa.ts:17-99`
- **BE/ELE lên FT:** chỉ QL đánh dấu Đạt / Không đạt **kỳ vọng đầu ra**; nguyên nhân "Trung tâm" → Case FT + PA Tutor 10 buổi/kỹ năng (tính buổi Free, có lương); "Học sinh" → ghi chú, không Case. Writing lớp thường → W2.
- Giữa khoá và Cuối khoá tự có cho em vào lớp (bỏ mốc đã qua, không sinh nợ giả). Lớp thường không có "Bỏ kỹ năng khỏi đợt".
- **Lộ trình tiếp theo (PR-K26, chủ sản phẩm 04/10):** hướng Hệ thống gợi ý theo dải Cuối khoá đứng đầu, các hướng khác thu vào "Hướng khác"; em chưa đủ điểm thì danh sách như cũ. Em **50–59 %**: GVCN ghi **đề xuất**, Quản lý quyết khi ra lệnh chuyển lớp (không thẻ Chờ duyệt); bảng Chuyển tiếp lớp điền sẵn đề xuất đủ thông tin. "Chưa rõ" và "Xếp sau" **gộp thành một hướng "Chưa quyết"** (dữ liệu cũ đã đổi): ngày xem lại tuỳ chọn khi ghi Lộ trình tiếp theo (không ngày → vẫn nhắc hai tuần cuối), bắt buộc ở Chuyển tiếp lớp. GVCN ghi được cho **cả lớp trên một bảng** (⋮ hồ sơ lớp, lưu một lần, tất cả hoặc không) — **từ PR-LCb là panel "Lộ trình tiếp theo"** (xem gạch dưới). `sd/lenLop.ts` · `ss/classes/loTrinhTiep.ts`
- **MT0 (PR-MT0, chủ sản phẩm 05/10, T5/T5b):** em FOU/BE/ELE (không Pre FOU) được ghi hướng **Lên FT** ở Lộ trình tiếp theo (một em hoặc cả lớp) **hoặc QL quyết Lên FT** tự có **MT0** ở tuần Cuối khoá của lớp (lớp chưa có tuần Cuối khoá → MT0 chưa xếp). Bốn kỹ năng L/R/W/S, **chấm band** (W1/W2 như Mock; GV Writing lớp thường nhập cả hai ô), tên môn IELTS, **hạn chấm Chủ nhật tuần sau** tuần thi. GV bộ môn lớp thường đang học nhập điểm (Lịch Test / Nhập điểm, hàng `MT0`). Dời MT0: muộn nhất **thứ Hai tuần 2 FT** (chưa có lộ trình FT: tuần Cuối khoá + 2 tuần), **luôn trước MT1**; không có trong panel Xếp lịch MT. Cuối khoá đổi tuần thì MT0 chưa điểm, chưa ai dời tay **tự dời theo**. Band ≤ Target − 2.0 → chip `W 4.0 SOS` **chỉ để nhìn**: không tín hiệu, Case, PA, Phối hợp, không vào chỉ số SOS, Phân tích, Xuất Excel, kết quả gần nhất, % Cuối khoá, "bài chưa làm". Bỏ Lên FT: MT0 chưa điểm → huỷ (chọn lại thì mở lại cùng lượt); có điểm → giữ, là `MT0 · không dùng`. ~~Việc Quản lý `Chốt lên FT · {lớp}` / `Chuyển tiếp lớp`~~ → **từ PR-LCb một việc `Chốt lộ trình · {lớp}`** (xem gạch dưới). `sd/mt0.ts` · `ss/fasttrack/mt0.ts`
- **Panel "Lộ trình tiếp theo · {lớp} · n em" (PR-LCb, đặc tả 08/10 §1 §7):** lớp thường (Pre FOU, FOU, BE, ELE) có MỘT panel cuối khoá thay "Ghi lộ trình tiếp theo cả lớp" và "Chuyển lớp · {lớp}"; mọi lối (dải "Kết thúc khoá", ⋮ hồ sơ lớp, Lịch Test, badge, Công việc, Tổng quan) mở panel này. Lớp FT giữ panel "Chuyển lớp · {lớp}" (⋮ "Chuyển tiếp lớp…").
  - **GVCN** (STUDENT_EDIT ở lớp): ghi Hướng + Ghi chú, nút "Lưu n em" (chỉ dòng đã đổi). Em đã được Quản lý xác nhận: Hướng thành chữ "Lên FT · {lớp}" + tuần + MT0, kèm "Bạn đề xuất: …" khi khác — **khoá**, vẫn sửa Ghi chú; dải "Quản lý đã xác nhận dd/mm · k em · Hướng khoá".
  - **Quản lý** (CLASS_EDIT): "1 Soạn › 2 Xác nhận". Bước 1: Tuần bắt đầu chung; hàng nhóm theo hướng cần lớp (Lên {bậc kế} / Lên FT / Học lại) với ô gõ tên lớp (mọi chi nhánh, gợi ý "mã · chương trình · chi nhánh · sĩ số"; lớp FT vẫn chỉ cùng chi nhánh), "+ Mở lớp mới…"; chọn nhiều em → "Áp cho n em" / "Huỷ quyết định"; cột "Gợi ý · GVCN" (dòng "GVCN: …", vàng khi khác hướng đang chọn). Target **chỉ chữ** (Lộ trình tiếp theo → Target khoá); ô Target viền đỏ chỉ khi em Lên FT chưa có Target nào; không ô Dự kiến thi (giữ như cũ). Chân "Đóng" · "Lưu hướng" (em chưa có quyết định) · "Tiếp tục · n em". Bước 2: tóm tắt theo nhóm + "Chưa gửi — tên (lý do)" → **"Xác nhận · n em" = ra / sửa quyết định chuyển lớp** (lệnh còn chờ sửa ngay trong panel; đã thi hành thì dùng Chuyển lớp). Lỗi một em không mất phần đã sửa của em khác.
  - **Đề xuất GVCN giữ riêng** ở `huong_gvcn` của Lộ trình tiếp theo: quyết định Quản lý ghi đè Hướng nhưng không xoá đề xuất (dữ liệu đã bị ghi đè trước PR-LCb không khôi phục).
  - **Việc Quản lý `Chốt lộ trình · {lớp}`** (thay `Chốt lên FT` + `Chuyển tiếp lớp`): mỗi lớp thường đang mở **một dòng**, hạn **hết Chủ nhật trước tuần Final** (FOU tuần 7, BE/ELE tuần 9, Pre FOU tuần 4; dời Final thì hạn dời theo; lớp hết khoá chưa có tuần Final → "Chưa có hạn"); hiện từ 13 ngày trước hạn, **không hết hạn**: quá hạn đỏ, không chặn. **Xong khi mọi em đang học có quyết định chuyển lớp đang chờ**. Chữ: "8 em · 2 em chưa có hướng · GVCN đã đề xuất 6" · "6 em · đủ hướng, chưa xác nhận" · "n em chưa xác nhận" · "+ n em chờ duyệt đề xuất". Tổng quan › Cần xử lý: "lớp cần Chốt lộ trình". GVCN không có việc này. Panel QL: dải đỏ "Quá hạn n ngày · Hạn chốt hết CN dd/mm" khi còn em chưa có quyết định. `ss/classes/lenhChuyen.ts` (`lopChoChotLoTrinh`) · `sd/chuyenLop.ts` (`chuViecChotLoTrinh`)
  - "Xét lại lộ trình" (em đã chuyển mà Final không phù hợp lộ trình) **dời sang PR-CL**.
- **Hướng một nguồn (PR-LCa, chủ sản phẩm 07/10):** trước khi thi hành, Hướng + Target của em chỉ nằm ở Lộ trình tiếp theo. QL ra / sửa quyết định Cuối khoá → máy **ghi lại** Lộ trình tiếp theo theo quyết định (giữ ghi chú, tháng thi) + MT0 ngay; Hành trình "QL quyết: … (GVCN: …)" chỉ khi đổi hướng. Đã có quyết định chờ: **không ai đổi Hướng** ở Lộ trình tiếp theo ("Quản lý đã quyết."; sửa ghi chú được), **không ai đổi Target** của quyết định Lên FT ở đó (cả QL) — QL đổi Hướng / Target bằng cách **sửa quyết định**. Huỷ quyết định **không** đổi Lộ trình tiếp theo (MT0 đã huỷ giữ nguyên; chọn lại Lên FT mở lại cùng lượt). Khôi phục quyết định vừa huỷ → Lộ trình tiếp theo + MT0 theo lại quyết định. `ss/classes/loTrinhTiep.ts` (`dongBoTuLenh`)

### 20.7 Chuyển lớp và bàn giao — thay §10 "Chuyển lớp", "Chuyển tiếp Normal"

- **Quản lý ra lệnh** cho mọi lần chuyển (lớp thường hết khoá, FT gộp/tách/đổi lộ trình, một em giữa khoá): em nào, lớp đích, **tuần bắt đầu = Thứ Hai, từ tuần sau trở đi**. Tới Thứ Hai đó web **tự thi hành** (cron + quét khi đọc, chạy lặp an toàn). GVCN **không tự chuyển**; chỉ "Đề xuất chuyển lớp" (lý do ≥ 15 ký tự) → thẻ Thông tin HV → QL "Duyệt" = mở panel điền sẵn rồi ra lệnh. Khác chi nhánh: QL chi nhánh nguồn quyết, chi nhánh đích nhận "Sắp nhận". `sd/chuyenLop.ts:26-34` · `ss/classes/lenhChuyen.ts`
- Sáu hướng: lên lớp · học lại · FT · chuyển lớp · bảo lưu · dừng học. Bảo lưu và dừng học không có lớp đích; **Dừng học không có phiếu bàn giao**, các hướng khác có. Lên FT bắt buộc Target (hoặc KCK) — **không hỏi lại** (PR-LCa): Target ở Lộ trình tiếp theo → Target khoá lớp thường đang chạy (kể cả KCK) → chỉ khi cả hai trống mới báo "Ghi Target (hoặc KCK)". Chọn khác "Web gợi ý" bắt ghi lý do (máy chủ tự tính). Mỗi em tối đa một lệnh chờ.
- **Em thiếu điểm Cuối khoá vẫn chuyển được**; điểm nhập sau áp luật Cuối khoá ở lộ trình mới. Lớp thường tới tuần kết thúc thì **mọi em phải có lệnh**; còn em chưa có lệnh → thẻ Báo lên QL.
- **Bàn giao:** GVBM ghi một câu (≤ 300 ký tự) cho mỗi em, môn mình, hạn **2 ngày**; GVCN lớp cũ viết nhận xét chung ≥ 15 ký tự và **Xác nhận bàn giao** trong **3 ngày**. QL điền/xác nhận thay khi lớp không có GVCN hoặc quá hạn. Quá hạn → thẻ Báo lên; **lệnh vẫn chạy đúng tuần**.
- **MT0 lúc chuyển (PR-MT0):** em sang FT → MT0 chuyển vào lộ trình FT mới, là **điểm đầu vào** khi lộ trình chưa có (nguồn `MT0`; không ghi đè đầu vào đã nhập); MT0 chưa chấm vẫn nhập điểm ở Lịch Test lớp cũ. Em sang hướng khác → MT0 chưa điểm huỷ, có điểm ở lại khoá cũ (`MT0 · không dùng`). Chuyển giữa hai lớp giữ khoá: MT0 không đi theo, chưa điểm thì huỷ. Bảng Chuyển tiếp lớp hiện `MT0` + chip SOS, hoặc `MT0 ✓`.
- **Chuyển tiếp lớp (PR-LCa; lớp thường từ PR-LCb là panel "Lộ trình tiếp theo" §20.6):** bảng **điền sẵn** hướng + Target từ Lộ trình tiếp theo (dù chưa có lớp dự kiến); lớp chuyển đến = lớp dự kiến nếu hợp lệ, hoặc lớp duy nhất hợp lệ của hướng đó. Lên FT ở Lộ trình tiếp theo hoặc quyết định Cuối khoá (Chuyển tiếp lớp) đều có MT0; quyết định giữa khoá chỉ chuyển MT0 đã có. **Thi hành giữ** ghi chú, lớp dự kiến của Lộ trình tiếp theo (chỉ đặt hướng thật, Target thật, ngày áp dụng). Việc QL mỗi lớp: **một việc `Chốt lộ trình · {lớp}`** (PR-LCb, §20.6); lớp thường làm trong panel "Lộ trình tiếp theo", bảng Chuyển tiếp lớp chỉ còn cho lớp FT. `sd/chuyenLop.ts` (`targetLenFt`, `dienSanChuyenTiep`)
- **Chuyển lớp một em làm lại (PR-CL, 08/10):** Hồ sơ HV ⋮ · ⋯ dòng em ở hồ sơ lớp · thẻ duyệt Đề xuất — một panel. **Một ô gõ tên lớp** (mọi chi nhánh; máy chủ chỉ trả lớp hợp lệ; dòng phụ `FT LT1 · CP · 9 em` — GVCN đề xuất không thấy sĩ số), **Tuần bắt đầu** (mặc định tuần sau), **Lý do** bắt buộc. Bỏ ô Chi nhánh, bỏ Dự kiến thi; **Target chỉ hỏi khi em Lên FT mà chưa có Target nào** (ô nhận `6,5` / `KCK`, sai thì báo tại ô). Khối **"Khi chuyển, web sẽ"** do máy chủ tính (cùng hàm với lúc thi hành) hiện trước khi bấm. Em lớp thường **đã tới Cuối khoá** đi đúng luật Cuối khoá (Lên FT có MT0, Học lại mở khoá mới, chỉ lớp chương trình kế tiếp / cùng chương trình / FT) — cùng một hàm cho Chuyển lớp và Duyệt đề xuất. Sửa lệnh đang chờ = gửi lại cùng đường; không gửi Target thì **giữ Target + Dự kiến thi của lệnh**. `ss/classes/luatLoTrinh.ts` (`huongChuyenMotEm`, `xemChuyenLop`) · `sd/chuyenLop.ts` (`dongKhiChuyen`, `phuLopDich`)
- **FT → Thường (học lại sau khi đã lên, PR-CL):** QL / QT, không giới hạn thời gian. Thi hành: đóng lộ trình FT; **MT0 có điểm → "MT0 · không dùng"** (về khoá thường trước), **MT0 chưa điểm → huỷ**; **huỷ bài Mock chưa có điểm** ("Học lại lớp thường"); **giữ mọi điểm đã có**; khoá thường mới **giữ Target của lộ trình FT** (§7); Case FT tự đóng. Khối "Khi chuyển" viền vàng. Bản chụp lộ trình FT giữ đầu vào MT0. `ss/fasttrack/mt0.ts` (`keHoachVeThuong`, `huyKhiVeThuong`, `doiMt0KhiVeThuong`)
- **Việc QL "Xét lại lộ trình · {lớp} · n em" (PR-CL):** em đã chuyển theo quyết định Cuối khoá mà **Final không phù hợp lộ trình** — Lên lớp / Lên FT mà Final < 50%, Học lại mà Final ≥ 70% (tỷ lệ chưa làm tròn). "Chưa có hạn", không nhắc. Việc của QL chi nhánh **lớp em đang học** (lớp đã chuyển đến): gom theo lớp hiện tại, chỉ người sửa được lớp đó (chủ sản phẩm 08/10). Bấm mở từ hồ sơ lớp hiện tại. Bấm "Chuyển lớp…" → **Chuyển lớp nhiều em** (đã chọn sẵn; Tuần + Lý do chung; mỗi em một ô lớp, em chưa chọn lớp = bỏ qua; Target theo em khi cần); gửi từng em, em lỗi giữ hàng đỏ. Dòng tự mất khi em có quyết định mới, thôi học / rời lớp mới, Final hết lệch, hoặc **hết Chủ nhật tuần 2** kể từ tuần bắt đầu. Không nút "Giữ". `ss/normal/cuoiKhoa.ts` (`emXetLaiLoTrinh`) · `sd/cuoiKhoa.ts` (`khongPhuHopLoTrinh`)
- Bảng Chuyển tiếp lớp (`TransitionPanel`) **chỉ còn lớp FT** (PR-CL gỡ nhánh lớp thường).
- Em Tạm dừng không mở được chuyển lớp (QL bấm "Quay lại học" trước). "Tạm dừng" và "Kết thúc học" từ hồ sơ HV giữ như cũ (GVCN làm được, hiệu lực ngay).
- Đã bỏ: thẻ "Quyết định Cuối khoá", "Ghi hướng cả lớp", việc GVCN "Ghi lộ trình tiếp theo". **[04/10 — làm lại "Ghi lộ trình tiếp theo cả lớp" ở ⋮ hồ sơ lớp, chỉ là dự định; xem §20.6]**; **[08/10 PR-LCb — gộp với "Chuyển lớp · {lớp}" thành panel "Lộ trình tiếp theo", §20.6]**

### 20.8 Lịch MT — các điểm bổ sung cho PR-MT / PR-XLMT

Đã đủ ở các khối PR-MT, PR-XLMT. Bổ sung: (a) em có lộ trình FT tự có MT1/2/3 (tuần học 6/12/16; RF MT1/2 tuần 4/8); (b) đổi LT ↔ RF là mở **lộ trình mới**, giữ Target, Case đang mở đi theo em; (c) PA quy chế chuyển lớp FT→FT cùng chương trình **đổi người** sang GVBM lớp mới, đổi chương trình thì hệ thống đóng Case; (d) huỷ cả lượt đóng mọi Case/PA quy chế/việc Phối hợp sinh từ lượt đó ("lượt đã huỷ", không tính thất bại); (e) Target `KCK` = không cam kết: **không kỳ vọng MT, không SOS tự động** (không Case, PA quy chế, Phối hợp), vẫn có lịch MT, nhập điểm, Case tay và Ý thức; (f) việc nhập điểm không tính lớp đã kết thúc và em không đang học.

### 20.9 Ai làm được gì

Vai trong hệ thống chỉ có **3**: Quản trị hệ thống · Quản lý · Giáo viên. **Admin chi nhánh đã bỏ** (vai ở trạng thái retired, không còn quyền). **GVCN và GVBM không phải vai**: suy từ phân công lớp; GVCN dạy ít nhất một môn; mỗi môn một người. Phạm vi của QL là chi nhánh của mình; Quản trị hệ thống là toàn hệ thống. `ss/seed/data.ts:45-81` · `ss/permissions.ts`

| Hành động | Ai làm |
|---|---|
| Nhập điểm FT / lớp thường | GVBM đúng ô (W1 và W2 là hai ô riêng); GVCN chỉ ô môn mình dạy; QL/Quản trị mọi ô |
| Nhập ô S của Mock ở lớp FT khác | GV được phân công Speaking ở một lớp FT nhập được ô S mọi lớp FT cùng chi nhánh (chỉ là quyền, không phải việc/nợ). **Từ PR-LT3 (T18):** Speaking Mock không GV mặc định; quá hạn chỉ báo GVBM Speaking + GVCN lớp đó, không tính nợ cho họ; GV chấm chéo nhập muộn mới bị tính trễ |
| Nhập MT cũ | GVCN ô trống cả 4 kỹ năng; QL mọi ô |
| Sửa điểm đã nhập (lý do tuỳ chọn; xoá trắng ô = huỷ điểm, lý do bắt buộc) | GVBM đúng ô, chỉ trước khi đợt hoàn tất; QL mọi lúc |
| Báo vắng FT | GVCN, QL (GVBM chỉ gõ "-" trong ô) |
| Dời lịch thi một kỹ năng | **FT: chỉ QL.** Lớp thường: GVCN và GVBM đúng môn cũng dời được |
| Dời hạn chấm, bỏ kỹ năng, xếp lịch MT, Kế hoạch Test, thi lại, huỷ lượt, trả lời đề nghị dời lần 2, khôi phục phần đã huỷ | Chỉ QL / Quản trị |
| Tạo Case | QL; mọi GV có phân công trong lớp (bất kỳ môn nào) |
| Xác nhận nguyên nhân SOS, thêm/cập nhật/kết thúc PA, ghi kết quả, hoàn thành Case | QL; GV **đúng kỹ năng mình dạy** (GVCN cũng vậy, C02) |
| Đề xuất PA ngoài danh mục | GV đề xuất → QL duyệt |
| Ghi vi phạm | Mọi GV dạy lớp (kể cả trái môn) |
| Xác nhận xử lý Ý thức, Phối hợp SOS | GVCN lớp em đang học; QL |
| Duyệt WL 3 / loại ngoài thang | Chỉ QL / Quản trị |
| Chuyển lớp: ra lệnh | Chỉ QL; GVCN đề xuất |
| Bàn giao | GVBM ghi môn mình; GVCN xác nhận; QL thay khi cần |
| Kết luận lộ trình FT, Tạm dừng, Kết thúc học | GVCN lớp em đang học; QL |
| Đổi Target, lộ trình | Chỉ QL; GVCN "Đề xuất sửa" |
| Tạo lớp, phân công GV, sửa thông tin lớp | QL / Quản trị |
| Thêm học viên | QL; GVCN **chỉ lớp mình chủ nhiệm** |
| Đánh dấu kỳ vọng đầu ra Cuối khoá | Chỉ QL / Quản trị |
| Lưu trữ học viên | QL |
| Xoá học viên / lớp đã kết thúc, tài khoản, cấu hình, mở lại tuần báo cáo | Chỉ Quản trị hệ thống |
| Duyệt các thẻ trong Chờ duyệt | QL / Quản trị; GV không bao giờ |
| Nhắc việc giáo viên | QL / Quản trị |
| Xuất Excel kết quả Test | QL/Quản trị (theo phạm vi) và GVCN lớp mình; GVBM không |

### 20.10 Tổng quan, hồ sơ giáo viên, Phân tích

- **Tổng quan giáo viên:** "Việc của tôi · hôm nay" = việc **quá hạn** + việc có hạn từ hôm nay **đến hết Chủ nhật tuần này**. Badge đỏ cạnh Công việc = số việc quá hạn. Hộp thông báo (chuông) chia **Cần làm / Để biết**, tối đa 50 dòng.
- **Tổng quan Quản lý:** *Cần xử lý* (có cột **Người giữ việc** và **Hạn**) và dải *Chờ duyệt* luôn gộp hai khung; số liệu theo công tắc **Fast Track · Lớp thường** (mặc định Fast Track). Việc "tự quyết" của QL (Case chờ nguyên nhân quá hạn, vi phạm quá 5 ngày) chỉ nằm ở hộp Chờ duyệt (thẻ Báo lên).
- **Hồ sơ giáo viên:** chỉ-xem, năm khối (Việc đang có · Lớp đang dạy · Kết quả gần nhất · Case đang phụ trách · Yêu cầu đã gửi). GV xem chính mình; QL xem GV có vai giáo viên trong chi nhánh mình; Quản trị tất cả; GV xem đồng nghiệp bị 403. **Không có KPI tháng, không xếp hạng, không hàng tổng; sắp theo tên.** Số trên ô = số dòng khi bấm.
- **Phân tích › Giáo viên** (chỉ QL/Quản trị): Fast Track và Lớp thường tách; mặc định 4 tuần, tối đa 13 tuần. Cột: Chấm điểm · Ghi kết quả PA · Xử lý vi phạm (chỉ GVCN) · PA hiệu quả · Kết quả theo môn · HV tiến bộ · Đang dạy. Màu chỉ ở ô kết quả (đỏ < 50 %, vàng 50–69 %, xanh ≥ 70 %; dưới 5 mục không màu). Có hàng "Chưa phân công" để tổng khớp. **Đúng hạn** = nhập điểm lần đầu không muộn hơn hạn; **quá hạn** = tuần thi đã hết và qua hạn.
- **Phân tích khác:** vẫn là tab trong Tổng quan; góc "Danh sách Case" đã bỏ (link cũ chuyển hướng). Hiệu quả PA tách "PA theo quy chế" (không xếp hạng, không "Nên dùng") và "PA do GV thêm"; PA huỷ do "không cần theo dõi" ngoài mẫu số.
- **Hồ sơ học viên:** FT hiện "tuần học thứ n" tính từ tuần bắt đầu lộ trình của em, **bỏ tuần Tạm dừng, không có mẫu số** (không "n/16"); lớp thường "x/y". Thanh việc chỉ của chính người xem. Ưu tiên **mã tuần** `W2 OCT`; ngày chỉ cho hạn, ngày thi, ngày sinh, nhật ký.

### 20.11 Thông báo

Chỉ chuông trong ứng dụng, không email/Zalo. Chia "Cần làm" (trỏ tới việc/thẻ đang chờ chính người đọc; rời nhóm khi việc xong) và "Để biết". Người nhận chính: Case SOS mới → GVBM đúng môn (xác nhận nguyên nhân) và GVCN lớp ("SOS n") · FT "-" lần 1 máy dời → GVCN + GVBM đúng kỹ năng · lớp thường vắng từ lần 2 → GVCN · thẻ mới trong Chờ duyệt → QL chi nhánh + Quản trị · kết quả duyệt/từ chối → người xin · vi phạm mới do người khác ghi và em thành "bắt buộc" → GVCN · GVCN xử lý WL 1 / Report 4 + Meeting / WL 2 → QL · chuyển lớp → "Sắp nhận" GVCN lớp đích; bàn giao xác nhận → GVCN lớp đích.

### 20.12 Chữ trên màn hình (bảng thuật ngữ 01/10)

Đã chốt: PA viết ngắn, chỗ rộng viết "Phương án" · **Case** luôn hoa · Ý thức: "phương án xử lý" → **lần xử lý** · **Lịch Test** · mục tiêu band → **Target** · QL như PA · nút thoát hộp **Đóng** · "Báo lên" → **Báo QL** · lệnh chuyển lớp → **Xác nhận chuyển lớp**. Các chữ này **chưa lên web** (PR-S3 chưa chạy); sổ tay viết theo chữ đang hiện trên bản chạy, ghi chữ mới trong ngoặc.

### 20.13 Điểm còn mở — cần chủ sản phẩm chốt

| Mã | Điểm | Hiện trạng |
|---|---|---|
| C08-a | Lớp thường: nút QL **"xác nhận huỷ kết quả điểm môn đó"** | Chưa có (20.4 mục 1) |
| C08-b | Lớp thường: dời tự động mỗi tuần còn "-", hay GV ghi "-" lại mỗi tuần như code đang làm? | Code: GV ghi tay |
| C08-c | Lớp thường: dời bị chặn khi vướng đợt kế → GV kẹt | Cần lối ra cho GV |
| P01 | "1 tháng" của PA quy chế: đặc tả = ngày xác nhận + 1 tháng; code = **Chủ nhật đầu tiên sau (ngày xác nhận + 30 ngày)** (`sd/sos.ts:82-90`) | Chờ chốt |
| P02 | Sửa/huỷ lệnh chuyển lớp: kế hoạch ghi chỉ trước tuần bắt đầu; code cho sửa/huỷ **mọi lúc khi còn "chờ"** (`ss/classes/lenhChuyen.ts:208-214`) | Chờ xác nhận ý muốn |
| P03 | PA Bổ trợ Giữa khoá **không tự khép khi chuyển lớp**: GV lớp cũ còn việc "Ghi kết quả cuối" có thể quá hạn | Chưa có luật |
| P04 | Em < 50 % mà QL chọn "Lên": không có bổ trợ miễn phí | Chờ xác nhận |
| P05 | Mini Test "trên 70 %" (văn bản quy định) hay "từ 70 %" (code) | Chờ P. Học thuật |
| P06 | PA Bổ trợ nhóm FOU: GVBM một môn **không** ghi kết quả PA chung (code chặt hơn kế hoạch) | Chờ xác nhận |
| P07 | Hồ sơ giáo viên: QL/Quản trị xem hồ sơ của QL/Quản trị khác bị 404 (chỉ mở cho tài khoản có vai giáo viên) | Chờ xác nhận |
| P08 | Quét huỷ phần thi hết hạn (lần 2) và quét quá hạn duyệt **chỉ chạy khi có người mở web**, không có cron | Chậm tới khi có người mở |
| P09 | Hiệu quả PA quy chế xếp theo mức SOS **hiện tại** của Case, không theo lúc tạo (S6F Câu 3 = A) | Đã giữ, ghi để biết |

### 20.14 Chưa merge — đừng coi là luật đã chạy

UXF-b (mã tuần trên mọi chỗ, "Báo PH theo Case", nhóm "Từ lớp trước") · Dọn-b (nhãn Vận hành, nút "+ Giao việc", Sửa quyền, Hoàn tác) · PR-S3 (chữ thuật ngữ 01/10) · DEPLOY. Cập nhật mục này khi các PR đó merge.

### 20.15 Chữ lỗi thời còn trong code và tài liệu (để dọn)

`sd/policy.ts:18` còn ghi "hết Chủ nhật"; `sd/cases.ts` còn `planEndDefault` và `cycleDeadline` (code chết); comment "dự án không có cron" ở `sd/fasttrack.ts:276` và `ss/fasttrack/absence.ts:636` đã sai (có cron `chot-vang`); README.md vẫn nói "hai mục điều hướng", Admin chi nhánh và dữ liệu cũ; `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` còn "5 ngày làm việc" và "bậc 1…5". Chưa sửa trong PR này.
