# Sổ audit — BẢN TRÍCH

> **Trích ngày 18/09/2026** từ `PISA-PR17-Audit-and-Change-Register.md` (chủ sản phẩm giữ
> bản gốc, không nằm trong repo).
>
> **Bản gốc mới là luật.** File này chỉ chép lại nguyên văn những mục mà session code cần tới,
> để không phải dừng việc đi xin từng mục một. Nếu bản trích và bản gốc mâu thuẫn thì
> **bản gốc thắng** — và người phát hiện phải sửa lại file này cùng một ngày trích mới.
>
> Thứ tự tin cậy vẫn như `plan.md` mục 1.2:
> **sổ audit gốc mục 13–14 > `vong7/BRIEF_OVERHAUL_SAU_PR15.md` > code đang chạy > file bàn giao**
>
> **Đã trích:** mục 8 (T01–T19) · MT-01…MT-06 · SCH-01, SCH-02 · §13.5 · §13.8 · §13.9 · §13.11.
> **Chưa trích:** mọi thứ còn lại. Cần thì xin chủ sản phẩm rồi bổ sung vào đây.

---

## A. Mục 8 — Nghiệm thu bắt buộc, bằng thao tác và dữ liệu cụ thể

Đây là các mã `T…` mà `plan.md` nhắc tới ở phần nghiệm thu từng PR.

| Mã | Thao tác | Đạt khi |
|---|---|---|
| T01 | GV Listening mở học viên có case Reading và Ý thức | Chỉ báo Ý thức được; không sửa học thuật trái môn hoặc tạo PA Ý thức. API trực tiếp cũng bị chặn. |
| T02 | Gửi báo cáo BTVN ngày 14/9, W1 gửi cùng loại ngày 16/9, rồi gửi ngày 18/9 | Hai báo cáo đầu gộp đúng đợt, giữ nguồn và mức độ/hạn theo luật; ngày 18/9 thành đợt mới. UI tạo được case. |
| T03 | Thêm PA học thuật đã hoàn tất trong quá khứ | Bắt ngày thực tế, kết quả xác định, ghi chú; lưu một lần; không sinh nợ tuần trước khi nhập. |
| T04 | PA có 4 cập nhật tuần rồi kết thúc | Chỉ một PA và một kết quả cuối trong hiệu quả. Chưa đủ dữ liệu không đóng và không vào mẫu số. |
| T05 | Nhập MT3 dưới kỳ vọng rồi sửa chính MT3 thành đạt | Tín hiệu sai được thu hồi; không còn PA tự sinh mới. Lịch sử hiệu chỉnh giữ nguyên; case độc lập không bị xóa. |
| T06 | MT2 thấp, MT3 đạt thật sau hỗ trợ | SOS hiện hành đổi theo MT mới; không xóa case/lịch sử. Người có quyền chốt kết quả case. |
| **T07** | **Kế hoạch MT, chọn một lớp FT có cả HV đã/chưa có lịch** | **Hiện cả lớp; không có Normal; sửa lượt cũ không tạo duplicate; thấy preview tuần cũ → mới.** |
| T08 | RLW tuần 14–20/9, S tuần 21–27/9 | Cùng một attempt; hạn chấm lần lượt 23/9 và 30/9; không tạo nợ Speaking từ tuần RLW. |
| **T09** | **Đợt FT định trước chỉ L/R** | **Đủ điểm L/R thì kết quả đợt đủ; không chờ S/W, không bịa Overall bốn môn.** |
| **T10** | **Normal bốn môn trải ba tuần** | **GVCN sửa được trong lớp, GVBM đúng môn; luôn chờ đủ bốn môn. 23/33 vẫn dưới 70%, 7/10 đạt.** |
| T11 | GVCN xác minh vắng S, dời lần đầu rồi vắng tiếp | Lần đầu đúng tuần kế tiếp của lịch S; lần hai cần QL; chờ duyệt không tự đổi lịch. Không ảnh hưởng RLW đã thi. |
| T12 | Hết hạn duyệt và khôi phục | Hủy đúng phần/lịch; không xóa điểm. Chỉ QL đặt lịch mới; bộ đếm vắng không reset. Normal vẫn phải đủ môn. |
| **T13** | **Dời phần cuối MT2 trùng/vượt phần đầu MT3** | **Chặn, chỉ rõ xung đột. Hai đợt cách một tuần chỉ cảnh báo; hai buổi cùng đợt không bị hiểu là hai MT.** |
| T14 | Hai CN cùng có MT ở một tuần; lọc một CN rồi Normal/FT | Các cột lượt, case, HV, chờ duyệt và drilldown giữ cùng phạm vi. Tài khoản CN không thấy số liệu CN khác. |
| T15 | Hai HV có ba case cùng phân loại, bốn PA gồm hai thành công, một không thành công, một chưa đủ dữ liệu | HV=2, case=3; hiệu quả đủ điều kiện=2/3, không phải 2/4; click từng số ra đúng đơn vị. |
| T16 | HV chuyển CN sau khi một PA kết thúc | Hiện trạng sang CN mới; thành tích hỗ trợ lịch sử vẫn có nguồn CN cũ. |
| T17 | Công việc: chọn nhóm rồi trạng thái; báo cáo: mở bằng menu | Số các nhóm không sụp về 0 do tự lọc; thấy tab báo cáo; tạo/liên kết task đúng ô, đọc lại kỳ cũ không thay nội dung. |
| T18 | File/link ở case và PA, upload lỗi, người ngoài scope truy cập | Giữ nội dung đang nhập, báo lỗi rõ; mở đúng bằng chứng; kiểm quyền, không chỉ ẩn nút. |
| T19 | Hồ sơ ở desktop và điện thoại; case dài và nhiều case | Header không sticky; không lặp chart; đọc được vấn đề/PA/kết quả/việc tiếp theo; bàn phím mở/đóng được. |

**In đậm** là bốn mã `plan.md` §7.4 dùng làm nghiệm thu PR2.

---

## B. MT-01 … MT-06 — Kế hoạch MT / Kế hoạch Test

| Mã | Hiện trạng ghi trong sổ | Phải thành |
|---|---|---|
| MT-01 | Panel vẫn tên "Lên kế hoạch MT", còn trường "Lượt MT đang chọn", lấy danh sách lớp chưa giới hạn FT. | Đổi tên **Kế hoạch MT**; bỏ trường thừa; **FT ở cả UI và API**; chọn lớp hiện cả lớp ngay. |
| MT-02 | Panel còn chọn một tuần chung và bộ kỹ năng chung, gọi bulk-plan. Chọn lượt đã có không thành luồng chỉnh lịch rõ ràng. | **Hai hàng lịch nhanh RLW và Speaking**, vẫn xếp riêng từng kỹ năng được. Chọn lượt đã có để sửa, **hiện tuần cũ → tuần mới**; không tạo lại attempt hoặc thay required skills vì một tick mặc định. |
| MT-03 | MT đã có lịch chỉ nhận biết bằng dấu/tooltip; MT hoàn tất, đang có lịch, đang chọn chưa tách đủ rõ. | Hiện trực tiếp tuần kế hoạch; **trạng thái có chữ**. Lượt hoàn tất **chỉ đọc**. **Lỗi báo theo từng học viên/kỹ năng**, giữ các lựa chọn hợp lệ khác. |
| MT-04 | Lộ trình có lịch gợi ý và link sang trang MT, chưa là bảng chỉnh từng kỹ năng ngay trong panel. | Dùng **chung bộ chỉnh lịch** với Kế hoạch MT; QL sửa ngay, GV xem đúng quyền; mở từng MT để thấy kỹ năng/tuần/hạn chấm. Không phải áp lại toàn bộ lịch gợi ý. |
| MT-05 | Trang chấm chưa hoàn thiện hành động "Chưa thấy bài" → xác minh vắng ngay trong công việc đang chấm. | Thao tác theo môn/nhóm buổi, **giữ điểm các môn đã có**. Hiện pending approval, hủy, chờ QL xếp lại; thông báo đúng người. |
| MT-06 | Nền tảng split schedule đã có; cần kiểm các đường bulk/legacy dùng cùng luật. | Dời S **không đổi hạn RLW**; cùng attempt; đúng required set; **cảnh báo** khi hai đợt cách một tuần, **không cảnh báo** khi RLW và S cùng đợt; không dời phần đã thi để xóa nợ chấm. |

> Ghi chú **R18-09** trong sổ: **Normal không có thao tác hủy bài Test**; luôn phải đủ bốn kỹ
> năng. Quyết định này **thay** luồng hủy lịch hẹn Normal ở mục 2, MT-05, T12 và brief 10.6.
> Dùng "chờ bài / chờ xếp lại", không yêu cầu QL khôi phục bài Normal.

---

## C. SCH-01, SCH-02 — Quyền lịch

| Mã | Hiện trạng ghi trong sổ | Phải thành |
|---|---|---|
| SCH-01 | `setSkillWeek` luôn yêu cầu `PLAN_WEEK`; GV không được cấp quyền này. Normal không có nhánh quyền đúng môn; `RegularSheetPage` chủ yếu hiển thị lịch. | Cho **GVCN** đổi môn của lớp Normal và **GVBM** đổi đúng môn mình phụ trách; **không mở quyền FT chủ động**. Có nút đổi ngay tại lịch/chấm Normal. Kiểm cả **API trực tiếp** và thao tác nhóm. |
| SCH-02 | `canSetSitStatus` và `setSitStatus` dựa `PLAN_WEEK`, trong khi GVCN cần xác nhận vắng trước khi xin/dời lần đầu. Luồng ngoại lệ có backend nhưng bị nghẽn ở bước đầu. | GVBM báo "Chưa thấy bài" → GVCN xác minh → dời đúng tuần kế tiếp hoặc gửi QL. **Cùng một capability theo vai trò ở cả UI và API**; **không cấp `PLAN_WEEK` chung để chữa tạm**. |

---

## D. §13.8 — Bộ chọn tuần dùng chung toàn website

Một component, các ngữ cảnh dùng **cùng một hành vi**: Kế hoạch MT, Lộ trình, nhập điểm Test,
dời lịch, hạn xử lý, báo cáo kỳ họp, Thực trạng, lịch lớp và các panel liên quan.

- Bề mặt gọn: nút Trước · `14–20/09/2026` · nút Sau · **Tuần này**. Có nhãn phụ `W3 SEP` nếu cần; **khoảng ngày là định danh dễ đọc chính**.
- Bấm trường mở **popover**: gõ ngày hoặc khoảng tuần; chọn một ngày trên **lịch tháng** sẽ chọn cả tuần chứa ngày đó. Có đổi tháng/năm và **gợi ý tuần gần đây**, **không dropdown vài chục dòng**.
- Parse ngày Việt Nam rõ `dd/mm/yyyy`; nhãn `W3 SEP` **phải có năm** nếu thiếu ngữ cảnh. Tuần **Thứ Hai–Chủ nhật**, ngày nghiệp vụ **Asia/Ho_Chi_Minh**; demo dùng ngày demo, môi trường thật dùng hôm nay thực tế.
- **Luôn chọn được tuần hiện tại và tuần đang được link tới, dù chưa có record trong database.** API read **không** được tạo hàng loạt hàng trăm tuần; chỉ `ensurePeriod` khi nghiệp vụ lưu cần ID.
- **Ưu tiên ngữ cảnh URL** khi đi từ badge/mốc Test; mở trang nhập điểm độc lập thì dùng công việc hiện tại cùng tồn đọng, hoặc tuần hiện tại nếu đang ở chế độ tuần. **Không fallback về phần tử đầu của một mảng tuần.**
- **Lưu lựa chọn vào URL** để reload và Back không nhảy tuần; đổi năm / giao tháng / giao năm và tuần không có dữ liệu đều phải hoạt động.
- Chọn tuần tương lai ở chế độ **planning** không bị giới hạn như màn báo cáo kết quả; **giới hạn theo nghiệp vụ tại thời điểm lưu, không theo danh sách đã tải**.

---

## E. §13.9 — Điều hướng Test ngắn và màn Test gọn

| Điểm xuất phát | Hành động đề xuất | Đích |
|---|---|---|
| Thanh điều hướng chính | Nhập điểm Test | Hàng đợi Test; GV mặc định việc của mình, QL mặc định phạm vi quản lý |
| Hàng lớp ở danh sách HV | Nhập điểm Test · n | Bảng đúng lớp, gồm các phần cần chấm trong phạm vi đang được đếm |
| Hàng HV | Bấm nhãn MT2/MT3/Final | Hồ sơ đúng attempt; không bắt mở HV rồi kéo xuống |
| Đầu hồ sơ HV | MT gần nhất / Xem các Test | Mở panel danh sách đợt, chọn một đợt |
| Mốc MT trên hành trình | Bấm mốc | Cùng hồ sơ Test, giữ ngữ cảnh quay lại |
| Thông báo / công việc | Nhập điểm Listening | Focus đúng ô của HV/đợt/kỹ năng |

Một hàng HV có thể có nhiều đợt còn nợ, vì vậy **mỗi dòng chấm phải định danh HV + đợt**;
không ghi đè kết quả bằng cách gom một hàng HV qua nhiều MT.

Màn hồ sơ Test đề xuất **chỉ ba phần**:

1. **Header:** HV, lớp, tên đợt, số kỹ năng có điểm trên số required, kỳ vọng và OVR khi đủ. Nút chính **Nhập điểm**; nút phụ bảng cả lớp. Lịch và sửa ngoại lệ đặt trong **menu đúng quyền**.
2. **Một bảng:** `kỹ năng | tuần thi | hạn xử lý | điểm/tiêu chí | ghi chú/trạng thái`. Gộp bảng lịch và bảng điểm đang bị lặp; W1/W2 mở bốn tiêu chí ngay tại dòng. **Không dàn sáu nút trên mỗi môn.**
3. **Lịch sử và cài đặt** mở theo nhu cầu. Normal **không có nút hủy**; MT chuyên biệt vẫn giữ thao tác QL nếu còn hợp lệ nhưng không đặt nút đỏ nổi cạnh nhập điểm mặc định.

Khi mở từ "Nhập điểm cả lớp" của một học viên, truyền attempt và các tuần liên quan, ưu tiên
môn còn thiếu hoặc đang focus. Với tách RLW/S, có chế độ **Theo đợt** và **Theo tuần**; header
nói rõ đang xem **tuần thi** hay **tuần xử lý**. Hàng đợi mặc định hiển thị các việc chưa xong
tới hiện tại, **không làm mất khoản tồn đọng vì đổi tuần**.

---

## F. §13.5 — Phân công GV (cho PR-B)

- Tại một thời điểm hiệu lực: mỗi lớp/kỹ năng có **tối đa một GV** đang được phân công; lớp đủ phân công phải có đúng một GV cho mỗi kỹ năng yêu cầu và một GVCN.
- Một GV được phụ trách nhiều kỹ năng. FT giữ W1/W2 riêng; Normal dùng Writing.
- Mỗi ô là **combobox** chọn một người, gõ tên để tìm. Danh sách lấy từ những GV **có phân công làm việc tại CN của lớp còn hiệu lực**, không lấy từ toàn hệ thống và cũng không chỉ từ quyền truy cập CN.
- Chọn các GVBM trước; danh sách GVCN là **tập duy nhất của những GV đã được chọn ít nhất một môn cho lớp đó**. GVCN là phân công của lớp, **không tạo thêm role**.
- Đổi hoặc bỏ môn cuối cùng của GVCN hiện tại thì phải chọn người thay thế **trong cùng lần lưu**, hoặc giữ bản nháp "cần phân công"; không âm thầm để GVCN không dạy môn nào.
- Lưu **cả bộ** phân công cùng ngày hiệu lực **trong một giao dịch**. Backend kiểm CN, tư cách GVCN, một người trên một môn, và chống hai thao tác đồng thời tạo phân công chồng nhau. **Giữ lịch sử người cũ**; không viết lại người chấm hay PA cũ.
- Áp **cùng một luật** ở tạo lớp, chỉnh lớp, chuyển tiếp, và import/API. Dữ liệu cũ có hai GV cùng môn phải đưa vào danh sách **cần chọn lại**, không tự lấy người đầu tiên.

---

## G. §13.11 — Nghiệm thu bổ sung

- Hai case cùng Listening đều mở được; case đầu có hai PA hạn 20/09 và 27/09, case sau 04/10. Cập nhật một PA không sửa PA khác. Nhận định luôn có ngày.
- Listening 5.0→5.5 nhưng kỳ vọng 6.0: **đỏ**, thiếu 0.5. Bằng kỳ vọng: **đạt**; vượt: **xanh lá**. Không có điểm: **xám**, không tính delta.
- Lịch sử MT giữ kỳ vọng **đúng thời điểm**; không tô xanh chỉ vì delta so với MT cũ dương. MT chưa đủ OVR **không có màu đạt/trượt giả**.
- Hai PA chồng tuần nhưng kết thúc khác nhau phải đọc được trên **cùng một trục tuần**; mọi đoạn tương lai có nhãn **Dự kiến**.
- Một kỹ năng **không nhận hai GV** đang hiệu lực; GV ngoài CN không tìm thấy và **API từ chối**. Đổi môn cuối của GVCN không được để lại phân công GVCN không hợp lệ.
- QL bấm badge "5 Test cần nhập" thì thấy **đúng tập 5 đơn vị đã được đếm**; GV chỉ thấy danh sách và quyền đúng môn. Phải ghi rõ `n` là **lượt Test** hay **bài kỹ năng**, không để nhãn mơ hồ.
- Seed lịch tới **APR 2027**: mở nhập điểm ngày 17/09/2026 vẫn đúng tuần và đúng ngữ cảnh. **Tuần hiện tại luôn tìm được.**
- RLW tuần này, S tuần sau: bảng chấm tuần này có RLW; bảng tuần sau có S. Báo cáo kết quả vẫn **chỉ một attempt** theo quy ước tuần hoàn tất.
- Chấm **không qua nút "Đã thi"**; dấu `–` ở một tiêu chí W1 **không** xóa W2 hay S, **không** sinh điểm 0, **không** đóng đợt, **không** tự xác nhận vắng.
- Lưu lại `–` lần nữa **không lùi thêm một tuần**; đổi lại thành điểm hợp lệ thì giải quyết đúng trạng thái "chờ bài" và giữ lịch sử. **Điểm chính thức đã có không bị `–` xóa lặng lẽ.**
- Normal thiếu một môn suốt ba tuần vẫn là **một đợt chưa đủ** — không hủy, không bị bỏ khỏi danh sách cần xử lý.
- Mỗi đường badge / mốc / header / thông báo phải tới **đúng attempt và đúng kỹ năng**, và **Back giữ nguyên bộ lọc và ngữ cảnh**.

> **Giới hạn ghi trong sổ:** phần bổ sung này phân tích source PR17 và ảnh gửi kèm; minh họa là
> **thiết kế đề xuất**. Tại thời điểm viết sổ, chưa sửa/deploy website và chưa xác minh dữ liệu
> production.

---

## H. Lịch sử bản trích này

| Ngày trích | Trích những mục nào | Vì sao |
|---|---|---|
| 18/09/2026 | Mục 8 (T01–T19) · MT-01…MT-06 · SCH-01, SCH-02 · §13.5 · §13.8 · §13.9 · §13.11 | `plan.md` §7.4 nhắc T07 · T09 · T10 · T13 làm nghiệm thu PR2, nhưng ba trong bốn mã đó không có định nghĩa ở đâu trong repo — chặn hẳn việc viết tiêu chí nghiệm thu. Trích luôn các mục PR2/PR3/PR-B cần tới để không phải xin từng lần. |
