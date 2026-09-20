# PISA Progress — Design plan sau PR28

**Cập nhật mới nhất: mục22, ngày19/09/2026.** Mục22 thay các đề xuất trái chốt mới: hồ sơ MT KHÔNG chứa khối case/hỗ trợ, quản lý lớp mở trực tiếp ba mục, bỏ hai nút phạm vi khó hiểu; dấu '-' và Ý thức theo rule book mục17. Các mục trước giữ làm lịch sử thiết kế, không triển khai phần đã bị thay thế.

Ngày: 19/09/2026. Phiên bản 1.2. Trạng thái: audit mã nguồn + thiết kế; các hướng đề xuất được chủ sản phẩm đồng ý tiếp tục phát triển. CHƯA triển khai website. Mục 18–19 cụ thể hóa giao diện và nội dung tiếng Việt; mục 17 giữ các quyết định về vai trò và nghiệp vụ. Không coi đồng ý thiết kế là mọi ý tưởng mở rộng phải triển khai cùng lúc.

## 1. Mục tiêu và phạm vi

Xây dựng nền tảng để GV/QL biết học viên đang ở đâu, có vấn đề gì, đã hỗ trợ thế nào, kết quả ra sao và cần làm gì tiếp; đồng thời nhìn được mẫu hình của lớp, chi nhánh, giáo viên và phương án hỗ trợ để cải thiện dạy học.

LOGICAL · SIMPLE · PRACTICAL · USER-FRIENDLY · INTUITIVE.

Yêu cầu mới cho phép nghiên cứu overhaul toàn hệ thống, thay giới hạn “chỉ sửa ít” của đợt PR18. Đây là quyền đề xuất/thiết kế, không tự động phê duyệt mọi ý tưởng mới, sửa nghiệp vụ, reset dữ liệu, merge hay deploy. Bố cục hồ sơ A và các luật đã chốt vẫn là nền tảng trừ khi có quyết định thay thế rõ ràng.

Nguồn đối chiếu:
- Quyết định trong hội thoại, sổ `PISA-PR17-Audit-and-Change-Register.md` phiên bản 2 (nhất là mục 13–14).
- Tám ảnh người dùng gửi ngày 19/09: Toàn cảnh, Thực trạng, Công việc, Tình hình đơn vị, Học viên, Hồ sơ lớp, Hồ sơ HV, Kế hoạch Test. Ảnh được đọc trực tiếp trong hội thoại; không có ảnh mới của tất cả modal và vai trò.
- Mã nguồn ở merge PR28: `bc5c88d769654e631269d3d00ab35fc85d8f180d`.
- `plan.md`, `BAN_GIAO.md` và lịch sử PR19–28.

Giới hạn: kiểm tra tĩnh các module liên quan và ảnh, chưa chạy ứng dụng/database, chưa kiểm thử tương tác bằng từng vai, chưa chứng minh bản người dùng đang chạy cùng SHA. Không gọi số test do tác giả ghi là kết quả tự chạy lại. Các ý tưởng mới có nhãn “Đề xuất”; các điểm suy ra từ ảnh cần nghiệm thu runtime được ghi riêng.

## 2. Hiện trạng thực sự đến PR28

PR28 chỉ cập nhật bàn giao. PR27 đã merge trước PR28; bàn giao vẫn nói PR27 chưa merge và main ở PR26, nên tài liệu đã lạc hậu. Không branch tiếp dựa trên câu chữ đó.

| Nhóm quyết định cũ | Tình trạng đã kiểm | Hành động tiếp |
|---|---|---|
| Hồ sơ A, header không sticky, mở kỹ năng/case tại chỗ, màu theo kỳ vọng | Đã có nền tảng; ảnh hiện ± theo kỳ vọng và ngày kết quả PA | Giữ; làm rõ tóm tắt, thống nhất nơi xử lý case, cải thiện khả năng đọc |
| Tình hình đơn vị ở Tiến độ công việc | Đã có tab | Cần đảo thứ tự nội dung; báo cáo hiện nằm sau hai danh sách dài |
| Badge và hàng đợi nhập điểm cùng phạm vi | PR20 có thay đổi; ảnh có Việc của tôi/Trong phạm vi quản lý, đếm bài cần chấm | Kiểm lại số→danh sách bằng vai GV/QL, không coi lỗi PR17 vẫn nguyên trạng |
| Bộ chọn tuần chung, mặc định hiện tại | PR24 đã làm, ảnh có Trước/Sau/Tuần này | Sửa bố trí trong panel; ảnh đang bị xếp dọc nhiều hàng. Kiểm giao năm và URL |
| Tạo case Ý thức | PR22/27 sửa form và luồng nhập bù | Không ghi là vẫn không tạo được; còn nghiệm thu đủ vai và nhánh kết luận |
| AUTH-01: sửa case đúng quyền/môn | PR27 thêm kiểm quyền | Nghiệm thu GVBM khác môn/GVCN/QL; không mở lại quyền rộng để chữa UI |
| Mỗi kỹ năng một GV, một GVCN dạy ít nhất một môn | Có ràng buộc máy chủ | Combobox, danh sách GVCN phụ thuộc môn, và định nghĩa GV thuộc CN còn cần hoàn thiện |
| Panel sửa lịch đã có, RLW/S khác tuần | CHƯA hoàn thiện | `MockPlanPanel` vẫn gửi một periodId tới bulk-plan; chọn lượt đã có dẫn tới lỗi trùng |
| Dời lịch Normal bởi GV | Quyền máy chủ đã bổ sung | `RegularSheetPage` chưa có hành động dời lịch kỹ năng |
| Dấu “-” = chưa thấy bài | Chưa có luồng hoàn chỉnh | Ô điểm hiện chuyển draft thành Number; chưa có lệnh nghiệp vụ thiếu bài |
| Case/PA/file/link | Thiếu trong form đang đọc | Thiết kế bằng chứng dùng chung, hoàn thiện API và quyền |
| Bỏ tự chấm điểm ở cập nhật PA | CHƯA xong | `ResultDialog` còn `MetricsField` |
| Hoàn thành Ý thức khác học thuật | Chưa thống nhất luồng thường | `OutcomeDialog` không nhận track và vẫn hỏi thang tiến bộ học thuật |
| Phân tích CN→lớp, drill-down đúng đơn vị, hiệu quả theo vấn đề | Một phần | Cần hoàn thiện cả phép tính và đường xem, không chỉ thêm chart |

### 2.1. Lỗi/rủi ro có căn cứ mã nguồn, cần ưu tiên

**F01 — Báo cáo tuần chưa giữ đủ scope (P0).** Tập attempts lọc chi nhánh/chương trình/quyền, nhưng ba truy vấn case/HV/chờ duyệt sau đó chỉ lọc planned_period_id. Các chi nhánh cùng tuần có thể bị cộng lẫn. Sửa dùng chính tập attempt ID được phép; danh sách khi bấm số dùng cùng tập này. Không chỉ vá nhãn.

**F02 — “HV đang gặp” có thể lẫn case đã đóng (P1).** Trong `issueBoard`, students đếm từ mọi case của phân loại, openCases mới lọc chưa done. Nếu UI gọi là hiện trạng, đây là hai tập khác nhau. Tách chỉ số hiện tại và lịch sử; hiệu quả lịch sử vẫn cần PA của case đã đóng.

**F03 — Hiệu quả cũ đi theo lớp hiện tại (P1).** `planOutcomes` lấy tập HV từ enrollments active rồi đọc PA lịch sử. HV chuyển CN có thể làm mất mẫu ở CN cũ và xuất hiện tại CN mới. Hiện trạng theo nơi đang chăm sóc; lịch sử theo đơn vị/người thực hiện tại thời điểm hỗ trợ. Nếu dữ liệu quá khứ không đủ, ghi “chưa xác định nguồn”, không tự quy cho nơi hiện tại.

**F04 — Hiệu quả chưa lọc tới vấn đề cụ thể (P1).** `planEffectiveness` lọc category/kỹ năng; chưa có taxonomy code trong đầu vào. Xem “nghe nối âm” không được nhận tỷ lệ PA của toàn Listening.

**F05 — Kết quả chưa xác định còn trong bảng hiệu quả (P1).** Mẫu số success+failure đã loại undetermined, nhưng response vẫn có hàng/cột undetermined. Quyết định cũ là đưa nhóm này ra hàng cần bổ sung/theo dõi, không vào bảng tổng hợp hiệu quả. Không xóa hồ sơ gốc.

**F06 — “Task liên quan” chưa là liên kết thật (P1).** `meetingBoard` chọn tối đa 6 task cùng nhóm và CN. Cùng nhóm không chứng minh cùng vấn đề; task thứ 7 bị ẩn. Cần quan hệ tường minh báo cáo↔task; nếu gợi ý cùng nhóm phải gọi “Việc cùng nhóm”, không “Việc xử lý báo cáo này”.

**F07 — Form case Normal vẫn dùng bộ môn FT (P0/P1).** `QuickReport` và `reportIssue` dùng ENTRY_SKILLS cho học thuật thay vì bộ môn chương trình; thông báo máy chủ liệt kê W1/W2. Cần Normal Writing riêng, FT W1/W2 riêng ở form, API, nhập bù và phân quyền. Nghiệm thu thực tế Normal Writing trước khi kết luận đã sửa.

**F08 — Bằng chứng và cập nhật case chưa liền mạch (P1).** Form tạo case không có file/link, ResultDialog còn điểm tự chấm; kết luận Ý thức chưa phân nhánh. PR-D còn là kế hoạch; không coi chuyển mục khỏi backlog là đã triển khai.

**F09 — Nguồn GV thuộc chi nhánh khác với yêu cầu (P1, cần duyệt định nghĩa).** `teacherCandidates` dựa user_roles, chấp nhận role teacher/manager với branch_id NULL hoặc trùng CN. Đây là quyền phủ chi nhánh, chưa chắc là phân công giảng dạy tại CN như đã yêu cầu. Cần chốt: danh sách nhân sự giảng dạy được phân công CN là nguồn chuẩn; quyền QL toàn hệ thống không tự biến người đó thành GV tại mọi CN.

**F10 — Hai bảng số khác nhau nhưng tên gần giống (cần đối soát runtime).** Ảnh Toàn cảnh: 18 HV cần hỗ trợ/32 case; Thực trạng: 20 HV có case/34 case. Chưa đủ để khẳng định số nào sai vì có thể scope/lớp active/trạng thái khác. Bắt buộc xuất tập ID tạo số ở từng màn, so phần chênh; nếu định nghĩa khác cần đổi nhãn, nếu cùng định nghĩa phải sửa bộ tính.

**F11 — Nguồn ngày/hạn gây hiểu sai.** Ảnh hồ sơ có “Việc tiếp theo 30/08” trong ngày xem 14/09, và PA học thuật “quá hạn làm” trong khi đây có thể là hạn cập nhật tuần. Hiển thị “Cập nhật PA — quá hạn … ngày”; tách hạn cập nhật, dự kiến kết thúc, hạn xác minh, hạn thực hiện Ý thức.

**F12 — Tài liệu trạng thái sai.** BAN_GIAO và một số checkbox plan chưa theo PR27/28. Mỗi bàn giao phải ghi SHA/PR xác nhận; luật sản phẩm và tiến độ triển khai không được trộn.

## 3. Kiến trúc trải nghiệm đề xuất

Đề xuất năm điểm đến cấp cao, có thể dùng sidebar gọn và rút còn icon khi cần; không bắt thêm năm hệ thống dữ liệu:

| Điểm đến | Câu hỏi chính | Nội dung |
|---|---|---|
| Tổng quan | Tình hình học viên thế nào, cần quyết định gì? | Sức khỏe học tập, điểm nghẽn, 3–5 phát hiện đáng xem, lịch gần, liên kết hành động |
| Học viên & Lớp | Em/lớp này đang ở đâu? | Danh sách lớp/HV, hồ sơ A, hành trình, case, bàn giao |
| Test | Cần xếp/chấm/xử lý bài nào? | Hàng đợi chấm, lịch Test, kế hoạch, hồ sơ đợt |
| Phân tích | Vấn đề nào phổ biến, hỗ trợ nào có kết quả? | Vấn đề, hiệu quả, lớp/CN/GV, bảng tuần |
| Công việc | Ai cần làm gì và họp tuần cần chốt gì? | Việc học viên, việc vận hành, tình hình đơn vị |

Nếu năm menu quá nhiều, giữ ba menu hiện tại nhưng Tổng quan có tab “Tổng quan / Phân tích”, Học viên có đường Test nổi bật, Công việc có ba tab rõ. Khuyến nghị năm điểm đến khi mở rộng analytics, vì ba menu hiện tại đang giấu nhiều mục không liên quan dưới nhau. Đây là D01 cần người dùng chọn; mặc định thiết kế chi tiết theo phương án năm điểm đến.

Một bản ghi có một định danh, một màn xử lý chuẩn. Dashboard/notification/report chỉ đưa người dùng đến đúng bản ghi và giữ bộ lọc khi quay lại. Không sao chép PA thành task để làm đầy hàng công việc.

### Phân vai

- GVBM: mặc định lớp/môn mình phụ trách, việc đến hạn, HV cần hỗ trợ, xu hướng các lớp mình dạy; xem đủ bối cảnh HV theo quyền hiện có, chỉ sửa đúng quyền.
- GVCN: toàn bộ hành trình lớp mình, vấn đề liên môn, Ý thức/PH, bàn giao, phối hợp GV.
- QL: phạm vi chi nhánh/toàn hệ thống được cấp; điểm nghẽn, nhu cầu nguồn lực, chất lượng hỗ trợ, phân tích GV.
- Không giả lập “QL có mọi việc của GV”; quyền xem tổng hợp, nhập hộ, phân công và người thực hiện là các khái niệm khác nhau.

## 4. Overhaul Tổng quan / Toàn cảnh

### 4.1. Bố cục màn đầu

1. Thanh ngữ cảnh duy nhất: phạm vi, Normal/FT/Cả hai, ngày dữ liệu. Chế độ hiện tại mặc định; khoảng thời gian áp dụng rõ cho phần phát sinh/hiệu quả bên dưới.
2. Bốn ô: **HV có SOS gần nhất / số HV đánh giá được**; **HV có case đang mở**; **Tín hiệu chưa xác minh quá 3 ngày**; **PA thiếu cập nhật/quá hạn đánh giá**. Không cộng các ô thành tổng.
3. “Cần quyết định”: tối đa 5 dòng thật, ví dụ đề xuất tutor chưa duyệt, thiếu GV môn, case nhiều tuần chưa có cập nhật. Mỗi dòng nói ảnh hưởng bao nhiêu HV, ai cần quyết định, hành động gì.
4. “Điểm đáng chú ý”: 3–5 nhận định sinh từ quy tắc và dữ liệu có nguồn; bấm xem danh sách. Ví dụ minh họa: “8/20 học viên Listening đang gặp khó khăn nghe nối âm; 5 em chưa có PA.” Không dùng số minh họa như số thật.
5. Ma trận chi nhánh gọn: sĩ số, đủ dữ liệu đánh giá, HV SOS, HV có case, case thiếu PA, cập nhật quá hạn. CN→lớp→HV.
6. Lịch 3 tuần sắp tới đặt cuối hoặc cột bên; giữ ý tưởng Sự kiện nổi bật nhưng giảm diện tích khi không có nhiều sự kiện.

Thứ tự ưu tiên công việc không phải mức độ case mới: quá hạn xác minh/duyệt → thiếu chủ trách nhiệm → thiếu PA → thiếu kết quả → lịch gần. Tiêu chí hiển thị rõ, người dùng có thể đổi sắp xếp. Không thêm risk score tổng hợp khó giải thích.

### 4.2. Những thứ bỏ/chuyển

- Bỏ danh sách “Việc đã giao” dài khỏi Thực trạng; chỉ giữ việc liên quan trực tiếp đến vấn đề đang phân tích, còn tất cả việc ở Công việc.
- Hàng Việc của tôi ở Tổng quan chỉ là preview 5–8 việc + Xem tất cả, không lặp nguyên hàng đợi.
- Thay kiểu `13/4` bằng cột `13 case mở` và `4 chưa có PA`; bỏ giải thích dài bắt người đọc giải mã.
- Chú giải kỹ thuật chuyển vào tooltip “Cách tính”; thông tin ảnh hưởng quyết định vẫn ở mặt chính: n/N, kỳ dữ liệu, thiếu điểm, trạng thái tạm thời.

## 5. Overhaul Thực trạng thành Phân tích học viên

Ba chế độ cùng bộ lọc gốc: **Vấn đề hiện tại | Kết quả hỗ trợ | Theo tuần**. Không trộn số tồn hiện tại với kết quả trong 12 tuần trong một hàng mà thiếu nhãn.

### 5.1. Vấn đề hiện tại

- Normal / FT trước; sau đó kỹ năng: Normal L R W S Ý thức/Khác; FT L R S W1 W2 Ý thức/Khác.
- Mặc định dạng ma trận: hàng là vấn đề cụ thể, cột là CN hoặc lớp. Ô có `n HV / N HV thuộc phạm vi kỹ năng`, kèm số case mở nếu mở chi tiết.
- Bấm CN mở lớp ngay dưới; bấm số HV mở danh sách HV duy nhất; bấm case mở case. Không đổi dropdown liên tiếp rồi bắt QL nhớ số.
- Dạng danh sách thay thế khi ít lớp hoặc trên mobile: vấn đề → CN → lớp → HV; cùng dữ liệu, không hai phép tính.
- Các cột thao tác cần thiết: chưa có PA, đang hỗ trợ, thiếu cập nhật, cần đánh giá kết quả. Không dàn mọi cột lên một bảng.
- “Tín hiệu cần xác minh” là khối riêng: chưa có chẩn đoán, owner, hạn 3 ngày. Không gán “Khác” để ép vào phân loại.

### 5.2. Phân loại đủ cụ thể để ra quyết định

Đề xuất cấu trúc: kỹ năng → nhóm vấn đề → lỗi cụ thể. Ví dụ Listening → xử lý âm thanh → nối âm/âm cuối; Listening → hiểu thông tin → mất mạch hội thoại; Reading → quản lý thời gian → thiếu thời gian Passage 3. Cần tổ chuyên môn duyệt danh mục, không tự coi taxonomy mẫu là bộ chuẩn đã chốt.

Một case có một phân loại chính để thống kê độc quyền và vài nhãn phụ tùy chọn (dạng bài, section/passage/tiêu chí). Tiêu đề viết tự do mô tả học viên; không dùng tiêu đề để nhóm số bằng so khớp chữ. Phân biệt triệu chứng quan sát với nguyên nhân giả thuyết/đã xác minh; không bắt GV khẳng định một nguyên nhân chưa biết.

Chọn lỗi cụ thể có thể tự điền nhóm cha; không thêm ba dropdown bắt buộc. Nhóm Khác có mô tả; QL xem định kỳ để bổ sung danh mục, giữ alias/phiên bản cũ.

### 5.3. Kết quả hỗ trợ

Đầu tiên chọn chương trình, kỹ năng và vấn đề cụ thể; sau đó mới so các loại PA. Bảng đề xuất:

| Loại PA | HV đã hỗ trợ | PA đủ kết quả | Có tiến bộ | Tiến bộ một phần | Không tiến bộ/Kém hơn | Thời gian hỗ trợ |
|---|---|---|---|---|---|---|
| Tutor theo nhóm nhỏ | n HV duy nhất | n PA | n | n | n | Trung vị, nếu đủ ngày thực tế |

- Code hiện gộp improved và partial vào success. Đề xuất đổi nhãn trình bày thành **Có cải thiện (gồm một phần)**, vẫn cho thấy hai mức riêng. Không tự đổi công thức cũ thành “đạt mục tiêu” khi dữ liệu chưa đo điều đó.
- Tỷ lệ = số PA đã kết thúc có cải thiện / số PA đã kết thúc có kết quả xác định, cùng cohort/phân loại/phạm vi/kỳ. n/N đi trước phần trăm.
- “Chưa đủ dữ liệu” nằm trong danh sách cần đánh giá, không trong bảng/tỷ lệ hiệu quả. “Đang thực hiện” cũng không là thất bại.
- Một PA cập nhật 5 lần chỉ đóng góp một kết quả cuối. PA bị thay thế vẫn giữ kết quả cuối hợp lệ; PA hủy/chưa thực hiện không tự là thất bại.
- Case nhập bù đang bị loại khỏi hiệu quả trong PR27: giữ để so sánh nền, không âm thầm đưa lại; muốn đánh giá dữ liệu nhập bù cần quyết định riêng.
- Tách bằng chứng điểm Test chính thức và nhận định GV. Điểm tăng không tự chứng minh PA thành công.
- Nhiều PA đồng thời: ghi “Có hỗ trợ đồng thời”; không quy toàn bộ tiến bộ cho từng PA. Có thể xem theo gói hỗ trợ, nhưng phải định nghĩa gói và cách đếm trước khi triển khai.
- Không đặt huy hiệu “tốt nhất” cho 1/1=100%. Mẫu nhỏ hiện n/N và nhãn dữ liệu hạn chế; nếu xếp thứ tự thì theo cỡ mẫu/độ phù hợp trước, không theo % đơn thuần. Không coi n≥5 là đủ chứng minh kết luận.
- Theo dõi thời gian tới lần ghi nhận cải thiện là chỉ số quan sát, không bằng chứng nhân quả. Thiếu ngày không suy từ ngày nhập hệ thống.

### 5.4. Giữ bảng tuần nhưng nói đúng câu hỏi

Giữ W1 SEP/W2 SEP… và năm. Đợt Test tính một lần ở tuần kế hoạch hoàn tất; bảng chấm theo lịch từng kỹ năng. Hai quy tắc phục vụ hai câu hỏi khác nhau.

Nhóm kết quả Test có các cột không chồng: đạt, SOS1/2/3 đã đủ dữ liệu, kết quả tạm thời, chưa đủ kết luận. Nêu rõ số lượt khác số HV duy nhất trong cả kỳ.

Nếu cột case hiển thị trạng thái hiện tại của case phát sinh từ tuần đó, đặt nhóm cột “Tình trạng xử lý hiện nay”, không gọi “tại cuối tuần”. Không tự dựng snapshot quá khứ chưa có. Muốn xem xu hướng tồn đọng cuối tuần thực sự phải xây lịch sử trạng thái tái dựng được trước; đây là giai đoạn sau cần duyệt.

## 6. Phân tích theo giáo viên — yêu cầu mới trọng tâm

Mục tiêu: QL phát hiện lớp cần hỗ trợ, nhu cầu đào tạo GV và cách can thiệp có kết quả. Không dùng số SOS thô làm bảng xếp hạng năng lực.

### 6.1. Ba góc nhìn tách biệt

| Góc nhìn | Quy trách nhiệm theo | Đo gì |
|---|---|---|
| Học viên tôi đang dạy | Phân công môn/lớp hiệu lực | Số HV, độ phủ đánh giá, SOS và vấn đề theo đúng môn |
| Case tôi phụ trách | Owner case theo thời gian | Xác minh, lập PA, cập nhật, việc bị chặn, kết luận |
| Hỗ trợ tôi thực hiện | Người thực hiện PA | Loại PA, kết quả đủ điều kiện, thời gian, bằng chứng |

Người nhập hộ không phải người dạy/người làm; GVCN không mặc nhiên nhận mọi kết quả của GVBM. Dạy nhiều môn có thể xem từng môn hoặc HV duy nhất toàn bộ, phải ghi đúng đơn vị. Lịch sử phân công không viết lại theo người hiện tại.

### 6.2. Bảng QL nên thấy

GV | lớp/môn | HV phụ trách | có kết quả gần nhất hợp lệ | HV dưới kỳ vọng của môn | vấn đề phổ biến | case thiếu PA | cập nhật đúng hạn | PA có kết quả xác định.

Bấm GV mở hồ sơ chuyên môn: danh sách lớp, phân bố vấn đề theo kỹ năng, diễn biến cohort, case phụ trách, PA đã thực hiện và nhu cầu hỗ trợ. Không biến thành hồ sơ nhân sự/lương/chấm công.

Đối với SOS toàn học viên, hiển thị bối cảnh ở GVCN; đối với GVBM ưu tiên tỷ lệ dưới kỳ vọng đúng môn. Không quy SOS3 toàn em cho GV Listening chỉ vì Reading/Writing yếu.

### 6.3. Điều kiện so sánh

- Luôn kèm mẫu số và độ phủ điểm: 3/12 HV đã đánh giá, 12/20 HV có dữ liệu là hai dữ kiện.
- So cùng chương trình, giai đoạn học, kỹ năng, khoảng trình độ ban đầu; cần thấy lớp mới nhận/bàn giao.
- Tách vấn đề có trước khi nhận lớp với phát sinh sau đó; không mặc định phát sinh sau là do GV gây ra.
- Nhiều case được báo có thể là ghi nhận tốt; hiển thị mức độ đầy đủ dữ liệu, không thưởng việc ít báo cáo.
- Không áp một điểm tổng hợp “chất lượng GV” ở giai đoạn đầu. Đề xuất GV xem dữ liệu của mình; QL xem người trong phạm vi, so sánh đồng nghiệp chỉ theo quyền được duyệt.

## 7. Overhaul Tiến độ công việc

### 7.1. Một nơi làm việc, ba tab

**Việc học viên | Việc vận hành | Tình hình đơn vị.**

Việc học viên là hàng đợi suy ra từ Test/case/PA/duyệt, không tạo bản sao. Việc vận hành là task được giao thật (giáo trình, tuyển tutor, phần mềm…). Có thể giao task vận hành để hỗ trợ nhiều case, nhưng hoàn thành task không tự hoàn thành case.

Mặc định GV vào Việc học viên của mình; QL vào nhóm đang cần mình quyết định. Lưu lựa chọn cá nhân để lần sau tiếp tục được.

### 7.2. Việc vận hành

- Đầu trang: tổng việc chưa xong, quá hạn, chờ người khác, cần quyết định, vừa hoàn thành trong kỳ. Những nhóm chồng nhau không vẽ thành tổng chia phần.
- Bộ lọc chính: người phụ trách, nhóm, CN, trạng thái. Nhóm facet tính trên tập trước khi áp chính nhóm đó; count và kết quả cùng scope.
- Một hàng: việc cần đạt, người làm, hạn, trạng thái, cập nhật gần nhất có ngày, bước tiếp theo. Loại nội dung ghi chú bị lặp ở cả Trạng thái và Cập nhật.
- “Tạm ngưng” phải có lý do, người cần hỗ trợ và ngày xem lại. Tạm ngưng không tự xóa quá hạn gốc; đề xuất hiển thị hạn cam kết + ngày xem lại khác nhau.
- Dời hạn lưu ngày cũ/lý do; thời gian trễ không bị reset bằng sửa deadline. Không ép đổi luật SLA hiện tại trước khi duyệt.
- Việc con quá hạn hiện tên việc con khi mở, không chỉ badge. Hoàn tất việc cha cần điều kiện rõ với việc con.
- Table làm mặc định; Kanban là tùy chọn sau nếu thực tế có nhu cầu kéo việc. Không dùng Gantt cho mọi công việc.

### 7.3. Tình hình đơn vị — sửa thứ tự ngay

Ảnh hiện tại đặt “Việc đã giao” và “Việc đang tồn” trước bảng Tình hình đơn vị, làm người dùng phải cuộn tới cuối mới đọc đúng nội dung tab.

Thứ tự mới:
1. Tuần/kỳ + phạm vi + số đơn vị đã báo cáo/còn thiếu. Nếu chỉ báo cáo được cuối tuần, hiện giờ/ngày mở và trạng thái; không viết “Chưa/Không còn cập nhật được” mơ hồ.
2. Ma trận đơn vị × Giáo viên / HV–PH / Giáo trình. Tutor là đơn vị riêng với ba nhóm của Tutor.
3. Click ô mở ghi nhận, tác giả/ngày, bằng chứng và công việc liên kết thật.
4. “Cần quyết định trong cuộc họp”: báo cáo có vấn đề, cần QL hỗ trợ, việc quá hạn liên quan. Tạo/link công việc ngay tại ô, không sinh việc trùng mỗi tuần.
5. Phần tồn học vụ tự động và các việc khác thu gọn dưới cùng, luôn có số và link.

Trạng thái Chưa báo cáo là thiếu dữ liệu, không “Ổn”. Kỳ tháng hiển thị nhận định mới nhất và diễn biến từng tuần; “từng có vấn đề trong tháng” không thay thế trạng thái mới nhất.

**Đề xuất cần duyệt D04:** cho lưu nháp báo cáo cả tuần, chốt/nộp trong cửa sổ cuối tuần hiện hành. Nháp không tính đã báo cáo. Giữ lịch sử chỉnh sửa, tránh bắt người dùng nhớ cả tuần tới cuối tuần mới nhập.

## 8. Hồ sơ học viên, lớp và hành trình

### 8.1. Giữ A, sửa trọng tâm

Ảnh hiện tại ô “Hiện tại 5.5 Listening” dễ bị hiểu thành overall. Đổi thành nhãn cụ thể, hoặc tóm tắt “1/5 kỹ năng dưới kỳ vọng”; OVR hiển thị riêng khi đủ. “Việc tiếp theo” có động từ, owner và hạn thay vì chỉ ngày cũ.

Mỗi dòng kỹ năng: điểm/kỳ vọng/thiếu-vượt, case mở, PA đang chạy, kết quả gần nhất có ngày, hành động kế tiếp. Click mở case tại chỗ, mỗi case thu/mở riêng.

PR-D nên hoàn thiện một khối case chính: tên/nguyên nhân đã xác minh → PA → kết quả → việc tiếp theo; +PA và Hoàn thành ở đúng khối. Lịch sử PA mở tại dòng; giữ URL riêng cho deep-link nhưng không bắt người dùng đi qua hai giao diện cùng case.

Ý thức/Khác không hiện “chưa có điểm/chưa có dữ liệu” như môn học. Hiện báo cáo nguồn, đợt xử lý/tái diễn, hành động, deadline và kết luận thực tế. Đã gọi PH không tự là học viên đã cải thiện.

### 8.2. Hành trình hai độ sâu, cùng dữ liệu

- Mặc định: “Chặng học” gọn (vào lớp → đánh giá → hỗ trợ → đánh giá lại → chuyển tiếp), mỗi chặng tóm tắt điều gì thay đổi. Đây là đề xuất trình bày bổ sung cần xem mẫu; không thay hồ sơ A bằng timeline dày.
- Chi tiết: giữ timeline tuần W1 SEP… 6–8 tuần, mỗi case/PA một làn, điểm Test đúng ngày/kỳ vọng, kế hoạch tương lai rõ nét đứt.
- Tên PA và kết quả quan trọng không chỉ nằm trong tooltip/chấm hình học; có danh sách cập nhật bên cạnh/ở dưới trên mobile.
- Chọn điểm/PA mở đúng hồ sơ/ghi nhận. Chuyển lớp/lộ trình, thay GV và thi thật là mốc ngữ cảnh riêng; không nối Normal và FT thành một đường số.
- Không suy quan hệ nhân quả từ PA nằm cạnh điểm tăng; chi tiết ghi nguồn bằng chứng. Câu giải thích dài hiện tại chuyển thành “Cách đọc”.

### 8.3. Hồ sơ lớp

Đầu lớp: GVCN, GVBM tóm tắt, số HV, mốc Test sắp tới, bài chờ chấm, case mở/thiếu PA. Khu vực chính là danh sách HV và hành động; phân tích lớp ở tab/khối gọn tránh chiếm màn đầu khi GV vào chấm.

Chế độ “Cần hỗ trợ” hiển thị vấn đề cụ thể và việc tiếp theo; chế độ “Điểm” có hai mốc gần nhất như hiện tại; Ý thức là chế độ riêng. Giữ một nguồn số với Phân tích.

### 8.4. Danh sách Học viên

Giữ theo lớp làm mặc định nhưng thêm dạng danh sách HV khi tìm kiếm xuyên lớp. Khi tìm em chỉ mở đúng lớp liên quan. Hàng lớp chỉ 2–3 thông tin quan trọng, tránh cả chùm badge vàng.

Một badge “20 bài cần chấm” phải mở đúng 20 bài theo cùng scope; nút chấm cả lớp mang scope và đợt/kỹ năng đang quan tâm. Nợ cũ không mất khi tuần mới bắt đầu. Phân biệt “cần nhập điểm” với “chưa thấy bài” để QL biết vấn đề nằm ở đâu.

## 9. Hoàn thiện Test, không làm lại nền đã tốt

- Panel Kế hoạch chọn chương trình rõ: nếu chỉ FT, gọi “Kế hoạch Mock Test” trong panel; entry Test có lựa chọn Normal/FT thay vì tên chung nhưng chỉ FT không giải thích.
- Chọn lớp/HV → thấy đợt/lịch hiện tại → Xếp mới hoặc Đổi lịch. Hai hàng RLW và S có tuần riêng; mở nâng cao để tách thêm. Lượt đã có là chỉnh, không chọn rồi nhận lỗi trùng.
- Preview thay đổi theo từng HV/kỹ năng, chặn đè điểm/vi phạm thứ tự, cảnh báo khoảng cách MT. Nếu lưu một phần, giữ các hàng thất bại để sửa, không đóng toàn panel làm mất lỗi.
- Thêm hành động dời lịch đúng môn ở Normal; không có hủy bài, vẫn bắt đủ bốn môn và 70%.
- Hoàn thiện “-” theo sổ cũ: thiếu bài khác vắng, giữ tuần thi/hạn gốc/lịch xử lý kế tiếp; idempotent; W1 không ảnh hưởng W2. Quy tắc thi W1/W2 cùng buổi khác với trạng thái thiếu bài từng phần.
- Không yêu cầu xác nhận Đã thi mới chấm. Chấm khi có lịch/quyền không tự bịa ngày thi thực tế.
- Deep-link đến đúng attempt/kỹ năng từ lớp/HV/hành trình/notification. Chốt một quy ước URL, Back giữ ngữ cảnh.
- Đợt đủ kết quả: lịch mặc định chỉ đọc; hiệu chỉnh điểm có quyền/lý do/audit riêng, không khóa mất sửa sai. Đây là đề xuất làm rõ trạng thái hoàn tất, không thêm nút xác nhận thừa.

## 10. Hợp đồng số liệu trước khi vẽ dashboard

Mỗi chỉ số phải có: tên, câu hỏi, đơn vị, tập đủ điều kiện, trạng thái, thời gian, scope, quy tắc khử trùng, drill-down, ngày cập nhật và phiên bản định nghĩa.

| Chỉ số | Định nghĩa đề xuất |
|---|---|
| HV SOS hiện tại | HV duy nhất theo đợt mới nhất hợp lệ, không MAX SOS mọi lịch sử; tạm thời/thiếu điểm tách rõ |
| HV dưới kỳ vọng môn | HV duy nhất có kết quả môn so kỳ vọng đợt tương ứng, mẫu số HV có thể đánh giá môn |
| HV có case đang mở | HV duy nhất có ít nhất một case còn hoạt động trong phạm vi hiện tại |
| Case mở | Số case, không số HV, không số tín hiệu SOS |
| Tín hiệu cần xác minh | Signal còn hiệu lực chưa được xác minh, có hạn 3 ngày; sửa điểm thu hồi signal sai |
| Thiếu PA | Case đủ điều kiện cần hỗ trợ nhưng chưa có PA hợp lệ; chờ duyệt tách riêng để không quy chậm cho GV |
| PA có kết quả | PA đã kết thúc với kết quả xác định; một PA một dòng cuối |
| Tỷ lệ có cải thiện | (improved + partial) / (improved + partial + unchanged + worse); n/N cùng cohort, loại nhập bù/unknown theo luật hiện tại |
| Đúng hạn cập nhật | Số nghĩa vụ cập nhật hoàn thành đúng hạn / nghĩa vụ đến hạn trong kỳ; không số click ghi chú |
| Độ phủ đánh giá | HV có dữ liệu đủ điều kiện / HV cần được đánh giá trong phạm vi, không đồng nhất với tỷ lệ đạt |
| Tái diễn Ý thức | Đợt mới liên kết đợt trước, không số nguồn báo cáo gộp trong một đợt |

Không cộng số HV theo lớp/chi nhánh/tuần thành tổng nếu một người có thể ở nhiều tập. Tổng toàn phạm vi phải COUNT DISTINCT theo định nghĩa. Scope rỗng phải trả rỗng, không hiểu thành toàn hệ thống; API drill-down áp cùng quyền như số tổng.

Hiện tại, phát sinh trong kỳ và kết quả trong kỳ là ba thời gian khác nhau. Mỗi biểu đồ ghi rõ. Chỉnh điểm hồi tố có thể đổi kết quả lịch sử “theo dữ liệu đã hiệu chỉnh”; không quảng cáo đó là snapshot bất biến cuối tuần.

## 11. Kho ý tưởng mở rộng — chưa tự coi đã duyệt

| ID | Ý tưởng | Giá trị | Điều kiện/ưu tiên |
|---|---|---|---|
| I01 | Bản tin 3–5 phát hiện có nguồn | QL đọc nhanh trước họp | Quy tắc minh bạch, số bấm được; sớm |
| I02 | Heatmap vấn đề×CN/lớp | Nhận diện vấn đề tập trung | n/N, hiện số 0 khác thiếu dữ liệu; sớm |
| I03 | Hồ sơ chuyên môn GV | Nhìn đúng lớp/môn/case/PA | Phân vai và lịch sử attribution; sau nền số |
| I04 | Thư viện PA theo vấn đề | GV tìm cách hỗ trợ đã có kinh nghiệm | Mẫu nhỏ, ghi điều kiện áp dụng, không tự auto tutor |
| I05 | Đánh dấu PA đã triển khai đúng kế hoạch | Phân biệt PA không hiệu quả và chưa làm đủ | Ghi gọn, không thêm nhật ký nặng; cần duyệt |
| I06 | Mục tiêu quan sát khi lập PA | Kết quả có tiêu chí cụ thể | Ví dụ hoàn thành 3 buổi/nhận diện âm cuối; không tự chấm 5 môn |
| I07 | Mẫu cập nhật 20–30 giây | Giảm công sức GV | Nhận định + ghi chú/bằng chứng + bước tới; không auto chốt |
| I08 | Tìm case tương tự | Học kinh nghiệm giữa các lớp | Quyền xem, ẩn danh khi cần, không gộp case khác nhau |
| I09 | So gói PA đồng thời | Phản ánh can thiệp thực tế | Định nghĩa gói, mẫu đủ, tránh nhân đôi thành công |
| I10 | Diễn biến cùng nhóm HV qua các MT | Tránh xu hướng do thay học viên | Cohort cố định và mẫu số từng mốc; sau nền số |
| I11 | Cảnh báo tiến bộ chậm nhiều mốc | Can thiệp sớm | Xét kỳ vọng/giai đoạn/thiếu điểm; không tạo risk score bí mật |
| I12 | Phát hiện case trùng trước lưu | Giảm hai GV mở cùng vấn đề | Gợi ý case đang có, không tự gộp trái ý |
| I13 | Cảnh báo quá tải người thực hiện | QL điều phối tutor/GV | PA thực hiện, thời lượng nếu có; không chỉ đếm case |
| I14 | Theo dõi nút nghẽn chờ duyệt/chờ lịch/chờ PH | Đúng người chịu trách nhiệm | Deadline và blocker rõ; sớm |
| I15 | Chế độ họp tuần | Từ số liệu→quyết định→giao việc | Dùng lại report/task; không tạo bản ghi tuần trùng |
| I16 | Bản tóm tắt bàn giao HV | Đổi lớp/GV không mất lịch sử | Tự lấy case/PA mở, owner mới xác nhận; sớm |
| I17 | Tóm tắt trao đổi phụ huynh | Chuẩn bị nội dung nhanh | Bản nháp kiểm duyệt, không tự gửi; sau |
| I18 | Xuất danh sách/đọc số theo bộ lọc | Kiểm tra và dùng trong họp | Excel/CSV đúng quyền, giữ định nghĩa và kỳ; sớm |
| I19 | Lưu chế độ xem cá nhân | GV không lọc lặp mỗi ngày | URL/share view không vượt quyền; sớm |
| I20 | Trung tâm chất lượng dữ liệu | Biết thiếu điểm/owner/nguyên nhân/kết quả | Số liệu thiếu không tô xanh; sớm |
| I21 | Thời gian từ signal→xác minh→PA→kết quả | Nhìn hiệu suất quy trình | Giữ timestamp thực tế, loại nhập bù khỏi SLA |
| I22 | Quan sát Ý thức trước/sau hỗ trợ | Biết tái diễn, tuân thủ kế hoạch | Nếu chưa có đủ attendance/HW nền thì không bịa tỷ lệ |
| I23 | So hiệu quả theo mức đầu vào/chặng | PA nào phù hợp ai | Không đồng nhất hiệu quả giữa cohort khác; sau |
| I24 | Bản nháp báo cáo trong tuần | Giảm ghi nhớ và tổng hợp thủ công | Không tính nháp là đã nộp; cần duyệt D04 |
| I25 | Chế độ sáng/tối, độ dày bảng | Tăng dễ đọc lâu dài | Ưu tiên typography/tương phản trước, không đổi theme để che UX |
| I26 | AI gợi ý phân loại/tóm tắt | Giảm nhập liệu khi dữ liệu đã chuẩn | Chỉ gợi ý, người xác nhận, có nguồn; chưa ưu tiên auto-decision |

Không triển khai tất cả cùng lúc. Các ý tưởng nhằm phục vụ một quyết định/hành động; nếu không chỉ ra được người dùng sẽ làm gì sau khi xem, không đưa widget lên trang chính.

## 12. Bốn đề xuất đã trình duyệt — xem quyết định mới tại mục 17

**D01 — Điều hướng:** đề xuất năm điểm đến Tổng quan / Học viên & Lớp / Test / Phân tích / Công việc. Có thể giữ ba menu với tab, nhưng không nên tiếp tục trộn task vận hành trong phân tích học vụ.

**D02 — Phân tích GV:** đề xuất triển khai ngay ba góc nhìn dạy học–case–PA, QL xem trong scope, GV xem bản thân. Không xếp hạng năng lực theo SOS hoặc tỷ lệ thành công thô. Cần duyệt nếu muốn GV xem dữ liệu đồng nghiệp.

**D03 — Kết quả PA:** đề xuất đổi nhãn success thành “Có cải thiện”, hiển thị improved/partial riêng, giữ công thức hiện tại và loại chưa đủ dữ liệu. Mục tiêu “đạt mục tiêu hỗ trợ” là phép đo bổ sung tương lai, không tự coi partial là đạt mục tiêu.

**D04 — Báo cáo đơn vị:** đề xuất nháp cả tuần, nộp/chốt cuối tuần; giữ trạng thái Chưa báo cáo đến khi nộp, có lịch sử sửa. Không tự bỏ cửa sổ báo cáo đã có.

Các lỗi đã xác định, đường vào còn thiếu và luật cũ không cần hỏi lại. Tên taxonomy chi tiết, tiêu chí so sánh GV, cách ghi mục tiêu PA cần tổ chuyên môn góp ý trước khi thành quy định bắt buộc.

## 13. Lộ trình triển khai đề xuất

| Đợt | Mục tiêu | Nội dung | Điều kiện xong |
|---|---|---|---|
| A — Số đúng, luồng không bị chặn | Có thể tin số và làm việc | F01/F02/F03/F07, Normal dời lịch, scope/đơn vị, tài liệu trạng thái | Test xuyên CN, chuyển lớp, Normal Writing, click số ra đúng tập |
| B — Một case đọc và cập nhật ở một chỗ | Khép vòng hỗ trợ | PR-D còn thiếu, file/link, tách Ý thức, bỏ tự chấm PA, deadline đúng nghĩa | GV ghi nhận→PA→cập nhật→kết luận đúng quyền, không hai khung lặp |
| C — Tổng quan và Công việc | Màn chính rõ mục đích | Điều hướng D01, Tổng quan mới, ba tab Công việc, ma trận đơn vị ở trên | QL tìm vấn đề/quyết định trong màn đầu; task links thật |
| D — Phân tích và hiệu quả | Trả lời vấn đề/PA nào | Taxonomy, CN→lớp, drill-down, cohort/kết quả, bảng tuần | n/N, thời gian, scope, đơn vị/nguồn lịch sử đều đối soát được |
| E — Góc nhìn GV và tri thức hỗ trợ | Phát triển chất lượng | D02/D03, phân tích theo môn/phân công, thư viện PA | Không quy sai người/so khác cohort; dữ liệu đủ điều kiện |
| F — Tối ưu hành trình/Test | Giảm thao tác dài hạn | Hoàn tất panel split/edit, dấu '-', deep-link, bàn giao, hành trình hai độ sâu | Kịch bản FT/Normal xuyên tuần, nhiều PA, quay lại giữ context |

Có thể đưa các lỗi Test chặn vận hành từ F lên A; thứ tự không phải lý do hoãn lỗi nghiêm trọng. Chia mỗi đợt thành PR vừa phải có ảnh trước/sau, đừng dồn thành một PR overhaul lớn. Chưa tự reset demo: chỉ thêm fixture kiểm chứng và migration có kiểm soát; giữ điểm/case/lịch sử.

## 14. Checklist nghiệm thu và demo có chủ đích

1. Hai CN cùng tuần: lọc một CN, mọi cột và drill-down không chứa ID CN kia.
2. Một HV hai case cùng môn, một case hai PA song song khác hạn; cập nhật PA A không thay PA B.
3. Một case đóng và một case mở cùng lỗi: “đang gặp” chỉ đếm HV có case mở; hiệu quả vẫn đọc kết quả lịch sử hợp lệ.
4. Chuyển CN sau kết thúc PA: hiện trạng sang nơi mới, kết quả lịch sử giữ nơi/người thực hiện cũ.
5. Ba PA đủ kết quả: improved, partial, unchanged; một insufficient đang theo dõi. Tỷ lệ có cải thiện 2/3, không 2/4; n HV khác n PA.
6. PA cập nhật 4 lần rồi kết thúc: chỉ một kết quả cuối; đồng thời có nhãn hỗ trợ khác đang chạy.
7. GV dạy Listening nhưng lớp có SOS do Reading: không quy SOS đó thành tỷ lệ yếu Listening của GV.
8. GV nhận lớp đã có nhiều SOS: phân biệt trước/sau bàn giao, không sửa lại người chịu trách nhiệm lịch sử.
9. Normal Writing tạo case đúng W; GVBM đúng môn dời lịch được trên UI; API trái quyền bị từ chối.
10. FT RLW/S khác tuần: bảng chấm đúng kỹ năng/tuần, cùng attempt, báo cáo đợt chỉ một lần.
11. “-” một tiêu chí W1 không xóa W2/điểm cũ, retry không lùi thêm tuần, thiếu bài không tự thành vắng.
12. Badge n bài cần chấm→danh sách đúng n, đủ tồn đọng; QL/GV scope khác nhau giải thích được.
13. Tình hình đơn vị có bảng báo cáo ngay trên cùng; tạo hoặc link task vào đúng ô, có hơn 6 task vẫn xem đủ; mở kỳ cũ không gắn nhầm task tương lai.
14. Nháp không tính đã báo cáo; “Ổn” phải có người nộp, ngày; tháng không giả là snapshot tuần cuối.
15. Ý thức hai báo cáo cùng đợt: 1 HV, 1 case, 2 nguồn; PA đã làm không tự đóng case; tái diễn là đợt mới.
16. Sửa điểm nhập nhầm: thu hồi signal sai, giữ audit/case độc lập/công việc thực đã làm; đạt ở MT sau không xóa lịch sử.
17. Điểm tăng nhưng dưới kỳ vọng vẫn đỏ; bằng xanh dương, vượt xanh lá; thiếu dữ liệu xám, Normal không dùng band delta.
18. File upload lỗi giữ bản nháp; người ngoài scope không xem file qua URL trực tiếp; link bằng chứng đúng đối tượng.
19. Desktop/mobile: chữ chính dễ đọc, timeline cuộn trong vùng, không tràn cả trang, không thao tác chỉ có hover.
20. Bàn giao: requirement ID→commit→route/vai→ảnh/kết quả; mục chưa chạy thật phải ghi chưa chạy, không dùng tổng test xanh thay bằng chứng UI.

## 15. Chỉ mục nguồn mã đã kiểm

Tất cả link chốt ở merge PR28, không trỏ main có thể đổi:

- [PR28](https://github.com/Pizi147/pisa-tracking/pull/28), [PR27](https://github.com/Pizi147/pisa-tracking/pull/27), [PR26](https://github.com/Pizi147/pisa-tracking/pull/26), [PR24](https://github.com/Pizi147/pisa-tracking/pull/24), [PR20](https://github.com/Pizi147/pisa-tracking/pull/20).
- [Kế hoạch triển khai](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/plan.md): phần 7b, 8, 9, 11, 12 ghi rõ việc chưa làm.
- [Bàn giao](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/BAN_GIAO.md): trạng thái PR đã cũ.
- [weekly.ts](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/worklist/weekly.ts): F01, thời gian bảng tuần.
- [effectiveness.ts](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/cases/effectiveness.ts): F02–F05, định nghĩa success/partial, nhập bù.
- [meeting.ts](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/worklist/meeting.ts): F06, báo cáo tháng, quan hệ task.
- [MeetingPage](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/web/src/modules/worklist/MeetingPage.tsx): thứ tự task/tồn/bảng báo cáo.
- [QuickReport](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/web/src/modules/cases/QuickReport.tsx), [cases.ts](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/cases/cases.ts): F07, nhập bù, form/bằng chứng.
- [CasePanel](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/web/src/modules/cases/CasePanel.tsx): F08, MetricsField, OutcomeDialog.
- [classes.ts](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/classes/classes.ts): teacherCandidates và ràng buộc phân công.
- [MockPlanPanel](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/web/src/modules/fasttrack/MockPlanPanel.tsx): một tuần chung, bulk-plan, chọn lượt đã có.
- [RegularSheetPage](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/web/src/modules/normal/RegularSheetPage.tsx): chưa nối UI đổi lịch kỹ năng.
- [ScoreEntry](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/web/src/modules/fasttrack/ScoreEntry.tsx): chưa có lệnh thiếu bài bằng dấu '-'.
- [branchpulse.ts](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/worklist/branchpulse.ts), [summary.ts](https://github.com/Pizi147/pisa-tracking/blob/bc5c88d769654e631269d3d00ab35fc85d8f180d/server/src/worklist/summary.ts): hai góc tổng hợp cần đối soát tập ID, phân tích người phụ trách hiện có chưa phải phân tích chất lượng dạy học.

## 16. Quy tắc cập nhật plan này

Giữ tài liệu này làm plan thiết kế mới; sổ PR17 là lịch sử quyết định/audit cũ. Mỗi lần chốt mới ghi ngày, nội dung thay thế, ID, trạng thái Đề xuất/Đã duyệt/Đang làm/Đã kiểm. Không đánh dấu đã làm vì đã có route hoặc đã chuyển sang một mục plan khác. Không tự diễn giải mọi brainstorm thành yêu cầu bắt buộc.

Chưa sửa repo, chưa gửi nhận xét GitHub, chưa merge/deploy. D01–D04 đã được phản hồi ngày 19/09/2026; xem mục 17, không hỏi duyệt lại các nội dung đã chốt.

## 17. Quyết định sau review — 19/09/2026

### 17.1. D01: giữ đủ năm chức năng, được gộp trang hợp lý và thiết kế theo vai

Chủ sản phẩm đồng ý năm nhóm chức năng, giao quyền chủ động gộp khi hợp lý; không bắt buộc năm menu giống nhau cho mọi vai. Quyết định thiết kế tiếp theo: bốn khu vực cấp chính **Tổng quan / Học viên & Lớp / Test / Công việc**. Phân tích nằm trong Tổng quan, có tab rõ và URL riêng để đi thẳng, không bị giấu ở cuối trang.

| Vai trò | Tổng quan | Học viên & Lớp | Test | Công việc |
|---|---|---|---|---|
| QL | Toàn cảnh CN; Phân tích gồm HV/vấn đề/PA/GV, lọc từng lớp/từng GV | Các lớp/HV trong CN được quản lý | Lịch, tình trạng chấm, ngoại lệ, duyệt theo quyền; không mặc định mở lưới nhập điểm | Theo dõi/phân công/duyệt; vận hành; Tình hình đơn vị |
| GVBM | Việc và học viên cần chú ý; Hồ sơ chuyên môn của tôi, chỉ dữ liệu bản thân | Lớp/HV trong phạm vi được cấp; sửa đúng môn/quyền | Mặc định bài mình cần chấm; lịch liên quan | Việc được giao và phần cập nhật mình có quyền; không hiện quản trị CN/bảng GV khác |
| GVCN | Như GV, thêm chăm sóc lớp chủ nhiệm và việc liên môn/Ý thức | Bối cảnh cả lớp chủ nhiệm theo quyền đã có | Bài thiếu cần xác minh, lịch và yêu cầu dời thuộc trách nhiệm | Phối hợp hỗ trợ, Ý thức/PH, bàn giao theo phân công |

Không có trang hay tab chỉ vì role mang tên đó: hiển thị theo capability và scope thực tế. GV có task vận hành được giao vẫn thấy task đó; không ẩn mất nghĩa vụ chỉ vì ẩn màn quản trị. GVCN là phân công lớp, không mở quyền xem hồ sơ chuyên môn đồng nghiệp. Người có nhiều vai dùng quyền hợp lệ theo phạm vi, không cần dựng nhiều tài khoản.

Không nhân bản nguyên hàng đợi ở Tổng quan và Công việc: Tổng quan là preview + hành động tới nguồn. Nhập điểm luôn có lối trực tiếp ở Test. Thiết kế này được lựa chọn trong phạm vi quyền gộp trang chủ sản phẩm đã giao; cần kiểm khả dụng khi làm prototype, không hỏi lại số menu như một quyết định nghiệp vụ.

### 17.2. D02: quyền xem dữ liệu giáo viên đã chốt

- QL xem toàn bộ số liệu GV trong chi nhánh mình quản lý: tổng hợp cả CN, chi tiết từng lớp, chi tiết từng GV; kết hợp bộ lọc GV×lớp×môn×kỳ. QL nhiều CN chỉ xem các CN đã được cấp, không tự mở toàn hệ thống.
- GV chỉ xem **hồ sơ chuyên môn/thống kê của chính mình**, không xem hồ sơ hoặc số liệu cá nhân của GV khác. Quyết định này nói về dữ liệu GV, không tước quyền xem hồ sơ HV/lớp phục vụ giảng dạy/chủ nhiệm đã có.
- Áp dụng ở API, tìm kiếm, drill-down và xuất dữ liệu, không chỉ giấu menu. Biết tên GVBM khác trên hồ sơ lớp là thông tin phối hợp, không là quyền mở analytics cá nhân của họ.
- QL vẫn xem được số SOS, tỷ lệ, vấn đề cụ thể và so sánh/sắp xếp dữ liệu giữa các GV; không che số liệu vì lo diễn giải.

Giải thích “xếp hạng bằng SOS thô”: chỉ dựa số HV SOS để kết luận GV A tốt/kém hơn B. Ví dụ A có 8/40 HV SOS, B có 4/10; số tuyệt đối và tỷ lệ cho hai hình ảnh khác nhau, nhưng ngay cả tỷ lệ cũng chưa xét đầu vào, chặng học, môn gây SOS, độ phủ điểm và lớp vừa nhận. Đây là lời giải thích phương pháp, không là quyết định xếp hạng đã được người dùng phê duyệt. Thiết kế mặc định hiển thị dữ liệu có bối cảnh và không tự gán thứ hạng/chất lượng GV. Nếu sau này muốn rubric đánh giá GV, phải chốt riêng.

### 17.3. D03: kết quả PA — đã duyệt

Dùng “Có cải thiện” cho tổng improved + partial; vẫn hiển thị “Có tiến bộ” và “Tiến bộ một phần” riêng. Không tự đổi thành đạt mục tiêu hoàn toàn. Chưa đủ dữ liệu tiếp tục theo dõi, không vào bảng/tỷ lệ hiệu quả; giữ nguồn bằng chứng, cỡ mẫu và phạm vi.

### 17.4. D04: nháp báo cáo đơn vị — đã duyệt

Được lưu nháp cả tuần; nộp/chốt theo cửa sổ cuối tuần đã có. Nháp không tính đã báo cáo và không hiện như nhận định chính thức. Người có quyền xem/sửa nháp theo phạm vi báo cáo; lưu tác giả/ngày/lịch sử. Phân biệt rõ Nháp / Đã nộp / Chưa báo cáo, tránh ghi xong nội dung mà người dùng tưởng đã nộp.

### 17.5. CASE-ATTACH: đính kèm ngay phần mô tả case — xác nhận bắt buộc có chức năng

- Trong form tạo case, ngay dưới ô Mô tả có **Đính kèm tệp** và **Thêm liên kết**, không bắt tạo case xong rồi mở trang khác.
- Áp dụng case học thuật và Ý thức/Khác; dùng lại ở nhập bù. Khi xác minh tín hiệu SOS thành case cũng có cùng khối bằng chứng.
- Có thể gắn nhiều tệp/link, đặt tên dễ hiểu, xem trước danh sách, bỏ mục chọn nhầm trước lưu. Việc cung cấp bằng chứng vẫn tùy chọn trừ khi có quyết định mới; yêu cầu là form phải hỗ trợ, không ép mọi case phải upload.
- Lưu gắn đúng case/nguồn ghi nhận, tác giả và ngày; đọc được tại phần mô tả case trong hồ sơ A và màn chi tiết. Không chỉ nhét URL vào văn bản tự do, không chỉ đính ở PA.
- Upload chưa xong/lỗi phải hiện rõ, giữ mô tả và bản nháp, không báo lưu đầy đủ trong khi bỏ mất tệp. Liên kết ngoài không tự được cấp quyền truy cập; tệp hệ thống tuân quyền xem case ở cả đường tải trực tiếp.
- Đây là xác nhận lại CASE-04 và ưu tiên triển khai đợt B, không phải ý tưởng để gác vô thời hạn. Không thay các yêu cầu bằng chứng ở PA/cập nhật đã có.

### 17.6. Nghiệm thu bổ sung

1. QL mở tổng CN → lớp → từng GV; tổng và chi tiết cùng scope/đơn vị; không truy cập CN ngoài quyền.
2. GV mở hồ sơ chuyên môn bản thân được; đổi URL/API sang GV khác bị từ chối, không lấy được số qua export hoặc ô tổng hợp. Vẫn xem thông tin lớp/HV và GV phối hợp theo quyền cần thiết.
3. Menu GV không chứa quản trị/analytics GV khác; nhiệm vụ hợp lệ được giao không biến mất. QL vào Test mặc định thấy quản lý lịch/chấm, GV vào Test mặc định thấy bài của mình.
4. Tạo case Học thuật/Ý thức với tệp + link ngay dưới mô tả; mở lại hồ sơ thấy đủ. Upload lỗi giữ nội dung; không có tệp vẫn tạo được case hợp lệ.
5. Nháp báo cáo giữa tuần không tăng số đã báo cáo; nộp trong cửa sổ hợp lệ mới tăng; lịch sử giữ người/ngày thay đổi.

Các ý tưởng I01–I26 khác giữ trạng thái đề xuất theo mục 11; sự đồng ý D01–D04 không tự duyệt mọi chức năng mở rộng.

## 18. Đặc tả giữ / sửa / thay giao diện — chốt hướng ngày 19/09/2026

Chủ sản phẩm đồng ý các hướng đề xuất, yêu cầu nói rõ hình thức từng trang và cho phép chủ động biên tập ngôn ngữ. Mục này thay các lựa chọn bố cục còn mơ hồ ở phần brainstorm. Đây là đặc tả thiết kế để triển khai theo từng đợt, không phải báo cáo đã sửa web. Những luật đã chốt giữ nguyên; việc bỏ một khối giao diện không có nghĩa xóa dữ liệu hoặc nghiệp vụ của khối đó.

### 18.1. Hệ giao diện chung

**Giữ:** phong cách tối hiện tại, màu xanh cho thao tác chính, bảng khi cần so nhiều bản ghi, khả năng mở/thu, mã tuần W1 SEP có năm và khoảng ngày, các trạng thái có nhãn chữ.

**Chỉnh:** bớt màu nền xanh khác nhau; dùng nền trang, bề mặt nội dung và trạng thái đang chọn. Phần chữ chính 14–16px ở desktop, phụ khoảng 12–13px; không dùng chữ nhỏ/mờ cho kết quả, hạn, người phụ trách. Đây là định hướng kích thước để kiểm trực quan, không ép độ cao hàng cố định khiến cắt nội dung. Khoảng cách giữa hai khu vực lớn 20–24px, trong một khối 12–16px. Số liệu canh phải; tên/nội dung canh trái; ngày và đơn vị nhất quán. Mỗi vùng có tối đa một nút chính nổi bật, các thao tác khác là nút phụ/menu.

**Bỏ:** bảng lồng nhiều bảng/khung; nhiều badge cùng nghĩa cạnh nhau; đoạn giải thích nội bộ dưới mọi bảng; chữ in hoa cả dòng dài; dấu gạch không giải thích trong trường cần trạng thái; khối trống lớn chỉ để giữ bố cục. Không dùng xanh lá cho điểm tăng nhưng dưới kỳ vọng. Không dùng icon một mình cho hành động ít quen thuộc.

**Điều hướng:** desktop dùng một thanh điều hướng ngang gọn với bốn khu vực đã chốt, không thêm sidebar thứ hai chỉ để đổi hình thức. Trong trang dùng một hàng tab rõ. Mobile menu gọn, giữ hành động đang dùng trong nội dung; chỉ thanh thao tác của form/bảng cần thiết mới cố định, header hồ sơ HV vẫn không sticky. Mỗi trang có một tiêu đề, một thanh bộ lọc chính, không lặp tên trang ở ba khung.

**Đọc chi tiết:** số tổng bấm mở panel bên phải với tiêu đề, bộ lọc và danh sách đúng đơn vị. Case đang xem trong hồ sơ mở tại chỗ. Thao tác nhiều bước như kế hoạch Test dùng panel rộng; mobile mở toàn màn hình. Không chồng panel lên panel: thay nội dung và có Quay lại, giữ bản nháp.

### 18.2. Tổng quan — thay bố cục chính

| Xử lý | Nội dung |
|---|---|
| Giữ | Phạm vi chi nhánh; lịch sự kiện gần; bảng CN mở tới lớp; liên kết vào việc cần làm |
| Chỉnh | Bảng CN dùng tên cột dễ hiểu, số có đơn vị; lịch sự kiện rút gọn theo tuần; phân biệt dữ liệu hiện tại với kết quả trong kỳ |
| Bỏ khỏi màn chính | Danh sách công việc đầy đủ và nhiều hàng filter của hàng đợi; khối Sự kiện nổi bật lớn chiếm màn đầu; bảng giải thích bằng đoạn văn dài |
| Thay bằng | Tóm tắt học viên → Cần xử lý → So sánh chi nhánh → Lịch sắp tới |

**Khung desktop cho QL, từ trên xuống:**
1. Tiêu đề Tổng quan; bên phải chọn CN và phạm vi chương trình; dòng nhỏ “Dữ liệu đến {ngày}”.
2. Bốn ô số có nhãn và mẫu số/đơn vị. Nhãn “Học viên dưới kỳ vọng”, “Học viên có case đang mở”, “Chờ xác minh quá hạn”, “Phương án cần cập nhật”. Chỉ dùng nhãn dưới kỳ vọng nếu phép tính đúng nghĩa; SOS toàn học viên vẫn có mức riêng khi mở.
3. Hai cột khoảng 2:1. Cột rộng “Cần xử lý”: 5–8 dòng, mỗi dòng nêu đối tượng + cần làm gì + người phụ trách + hạn + một nút. Cột hẹp “Điểm đáng chú ý”: tối đa ba nhận định có số và link nguồn, không đoạn văn AI dài.
4. “Theo chi nhánh”: một bảng gọn, hàng mở tới lớp. Nếu chỉ có một CN thì ưu tiên bảng lớp, không bắt đọc một hàng CN thừa.
5. “Lịch sắp tới”: ba tab tuần; mỗi sự kiện một dòng/chip có tên lớp, loại Test, số HV. Không hiện nhóm 0 nếu không phục vụ so sánh.

**GV:** không thấy bảng CN hoặc phân tích GV khác. Màn đầu là “Việc cần làm” và “Học viên cần hỗ trợ” trong phạm vi mình; lịch Test liên quan bên dưới. GVCN có thêm việc lớp chủ nhiệm. Nếu một phần không có quyền thì bỏ phần đó, không để ô khóa lớn chiếm diện tích.

### 18.3. Phân tích — thay toàn bộ cách tổ chức Thực trạng

Giữ dữ liệu Normal/FT, nhóm kỹ năng, bảng tuần, các số có thể mở chi tiết. Bỏ tên mơ hồ “Thực trạng” và danh sách “Việc đã giao” ở cuối khu vực phân tích. Không giữ hai bảng tổng hợp gần trùng nhau cùng xuất hiện mặc định.

**Đường vào:** Tổng quan có tab **Tổng quan | Phân tích**. Trong Phân tích chọn góc nhìn bằng một thanh gọn **Vấn đề học viên | Kết quả hỗ trợ | Giáo viên | Theo tuần**. Không thêm hàng tab thứ ba cho tất cả chiều; Normal/FT và kỹ năng nằm trong thanh lọc nội dung.

**Vấn đề học viên:** trên là lựa chọn chương trình/kỹ năng; bên dưới là bảng có hàng nhóm vấn đề và các lớp/CN. Chỉ hiển thị một chiều so sánh tại một thời điểm. Hàng mở/thu cho CN→lớp, ô là n HV, màu nền nhẹ để quét nhanh nhưng số vẫn đọc được. Click mở panel “{n} học viên — {vấn đề}”, có tên, lớp, case, PA hiện tại, cập nhật gần nhất. Không dùng một panel case cho cả số HV lẫn số PA.

**Kết quả hỗ trợ:** tiêu đề ngữ cảnh rõ “Listening · {phân loại} · {kỳ}”; một bảng loại PA, cỡ mẫu, mức cải thiện và thời gian nếu đủ dữ liệu. Có thanh tỷ lệ nhỏ nằm trong ô thay chart lớn. Bấm mức kết quả mở đúng PA kèm ghi nhận. Dữ liệu chưa đủ kết luận nằm ở liên kết “Cần bổ sung đánh giá” ngoài bảng hiệu quả, không đưa vào tỷ lệ.

**Giáo viên:** bảng GV theo CN của QL; bấm người mở hồ sơ với ba mục Giảng dạy / Case phụ trách / Phương án thực hiện. Bộ lọc lớp và môn giữ nguyên ngữ cảnh. GV chỉ có “Hồ sơ chuyên môn của tôi”, không thấy bộ chọn người hoặc tổng số GV khác.

**Theo tuần:** giữ bảng tháng có hàng tuần mở/thu; nhóm cột Kết quả Test và Tình trạng xử lý hiện nay phân cách nhẹ. Cột kỹ thuật/ít dùng nằm ở chọn cột, không buộc kéo ngang mười mấy cột mặc định. Giữ tên tuần mã web và năm.

### 18.4. Công việc — sửa mạnh bố cục, giữ bảng làm mặc định

Giữ các nhóm việc vận hành và trạng thái thật; giữ người làm, hạn, lần cập nhật; giữ báo cáo đơn vị. Bỏ phần ghi chú bị lặp ở cột Trạng thái và Cập nhật. Bỏ khoảng trống lớn giữa tab và nội dung trong ảnh. Không giữ chuỗi hơn mười nút lọc ngang trên một hàng.

**Ba tab:** Hỗ trợ học viên / Vận hành / Báo cáo đơn vị. Đây là nhãn ngắn hơn của ba nhóm chức năng ở mục 17, không đổi luật dữ liệu.

**Hỗ trợ học viên:** bốn bộ lọc nhanh Tất cả / Quá hạn / Đến hạn / Chờ duyệt; loại việc và người phụ trách dùng dropdown tìm kiếm. Dòng việc có HV/lớp → yêu cầu cụ thể → hạn/người làm → nút xử lý. QL có “Trong phạm vi quản lý”, GV mặc định “Việc của tôi”.

**Vận hành:** dòng số gọn; bộ lọc Nhóm việc / Người phụ trách / Trạng thái / Chi nhánh. Bảng năm cột Công việc / Người phụ trách / Hạn hoàn thành / Trạng thái / Cập nhật gần nhất. Tên việc tối đa 2 dòng trước khi mở; ghi chú mới nhất 1–2 dòng, ngày cạnh ghi chú. Click hàng mở chi tiết gồm mục tiêu, việc con, nhật ký và liên kết. Không mặc định thêm Kanban/Gantt.

**Báo cáo đơn vị:** thay bố cục hoàn toàn theo thứ tự: tuần+kỳ → số đã nộp/còn thiếu → ma trận đơn vị → vấn đề cần quyết định. “Việc đã giao” và tồn học vụ chuyển xuống phần thu gọn hoặc qua link về đúng tab. Bảng báo cáo phải xuất hiện ngay màn đầu ở desktop thông thường, không cần cuộn qua hai danh sách.

Mỗi ô ma trận hiển thị trạng thái bằng chữ, một dòng tóm tắt nếu có; bấm mở panel để nhập nháp, đính kèm nếu được hỗ trợ, xem lịch sử và link task. Nút Lưu nháp / Nộp báo cáo tách rõ. Trong kỳ chưa được nộp, vẫn lưu nháp được theo quyết định mới; chỉ khóa nút Nộp, không khóa toàn form.

### 18.5. Học viên & Lớp — giữ cấu trúc, chỉnh để bớt dày

Giữ tìm kiếm, nhóm theo lớp, điểm hai mốc gần nhất, phân biệt Normal/FT và mở/thu lớp. Chỉnh tiêu đề khu vực thành “Học viên & Lớp”; tìm kiếm chỉ có một ô dùng được tên HV/mã HV/mã lớp. Lọc chi nhánh dùng dropdown khi nhiều CN, không đồng thời bày dropdown và dải tab CN.

Hàng lớp có tên lớp, chương trình, số HV và tối đa ba mục quan trọng: bài cần chấm, case mở, mốc sắp tới. Nút “Nhập điểm” xuất hiện khi có quyền và có đường vào ổn định, không bắt tìm qua nhiều cấp. Đổi badge “case SOS” thành nhãn chính xác với tập đếm; không tự coi case còn mở là học viên hiện vẫn SOS.

Bỏ dòng hướng dẫn “Lớp là gốc…” dưới tiêu đề. Bỏ chân trang giải thích “badge chỉ xuất hiện…”; nếu số có thể bấm thì hình thức phải cho thấy được, không cần dạy người dùng bằng một đoạn văn.

Khi danh sách dài, lớp mặc định thu gọn; tìm kiếm tự mở lớp chứa kết quả. Giao diện “Điểm” giữ bảng; “Cần hỗ trợ” hiện tên vấn đề, PA và bước tiếp theo. Không bày tất cả thông tin của cả hai chế độ trong một bảng siêu rộng.

### 18.6. Hồ sơ lớp — sắp xếp lại trọng tâm

Giữ bảng học viên, phân tích lớp và phân công. Đầu lớp hiện GVCN, số HV, chương trình, mốc gần; nút Nhập điểm / Thêm case / Thêm HV theo quyền.

Đưa danh sách HV thành nội dung chính mặc định. Ba tab **Học viên | Phân tích lớp | Giáo viên** dùng cùng trang. Phân tích lớp không chiếm cả màn đầu mỗi khi GV cần chấm; tóm tắt hai vấn đề nổi bật có thể đặt trên bảng HV. Tab Giáo viên vẫn dùng từng môn một người; nút sửa mở form combobox đúng phạm vi.

Bỏ đoạn chân bảng dài về “năm cột số… đừng chia chung”. Đơn vị đặt ở tên cột; công thức ở “Cách tính”. Bỏ câu giải thích kỹ thuật “kỹ năng đi theo chương trình, không suy từ tên lớp” khỏi màn đọc; form tự chọn đúng bộ môn.

### 18.7. Hồ sơ học viên — giữ A, thay các phần gây phân tán

**Giữ:** header không sticky; điểm theo kỳ vọng; kỹ năng mở case bên dưới; case thu/mở riêng; PA song song; lịch sử, bằng chứng và timeline tuần.

**Sửa rõ:** bốn ô đầu đổi thành **Kết quả Test gần nhất / Kỹ năng cần hỗ trợ / Case đang mở / Việc cần làm tiếp**. Ô Test ghi đợt/ngày, OVR nếu đủ; Normal ghi đủ/thiếu bao nhiêu môn và đạt bao nhiêu môn, không bịa OVR. Ô việc có động từ và hạn, không dùng một ngày cũ làm nội dung chính. SOS là thông tin có nhãn kèm đợt, không thay toàn bộ đánh giá.

Mỗi case mở có: tên vấn đề+trạng thái → mô tả và tệp/link → từng PA → nút Thêm phương án / Hoàn thành case. Mỗi PA một khối ba phần dễ đọc: **Nội dung hỗ trợ và người làm | Kết quả gần nhất và ngày | Việc tiếp theo và hạn**. Mobile xếp dọc theo đúng thứ tự. PA đã xong thu gọn phía dưới; nếu cần xem song song thì người dùng mở từng PA. Không giấu PA đang chạy sau “và một việc nữa”.

**Bỏ:** khung CasePanel thứ hai lặp case; hai nút “Lịch sử và kết thúc phương án”/“Mở trang riêng” đứng như bước bắt buộc. Giữ route riêng cho link, lịch sử mở tại PA. Bỏ ô điểm cho Ý thức/Khác, thay bằng nguồn báo cáo và tình trạng xử lý. Bỏ điểm tự chấm trong cập nhật PA, giữ đánh giá đúng kỹ năng ở kết luận case khi phù hợp.

**Hành trình:** giữ tuần và làn PA trong chế độ chi tiết. Thay việc mở toàn bộ mọi kỹ năng thành chọn “Toàn bộ / một kỹ năng / Ý thức”, mặc định khoảng 6–8 tuần và các case đang mở. Thêm thanh chặng gọn để nhận biết vào lớp, Test, hỗ trợ, chuyển tiếp; không thêm biểu đồ thứ ba lặp lại điểm. Mốc đọc được bằng tên/ngày, không cần hover mới hiểu. “Các mốc đã qua” đổi “Mốc học tập”; sắp theo thời gian có chủ đích, không trộn nhật ký chỉnh sửa kỹ thuật vào hành trình chính.

### 18.8. Kế hoạch Test — thay cấu trúc panel

Giữ chọn lớp/HV, lượt Test riêng từng em, mã tuần và batch khi cần. Bỏ bố cục “một tuần chung + bốn checkbox + dãy MT1–MT7” làm đường thao tác mặc định. Giữ dữ liệu lịch sử MT; dãy lượt có thể nằm trong phần lịch sử thu gọn, không xóa khả năng chọn lượt cao hơn.

Panel mới từ trên xuống: **Lớp và học viên → Lượt Test và lịch hiện tại → Lịch mới → Kiểm tra thay đổi → Lưu**. Đây là nhóm nội dung trên một panel, không bắt qua năm màn wizard.

Mỗi hàng HV: tên | lượt đang chọn | RLW hiện tại | S hiện tại | thay đổi dự kiến. Khối lịch chung cho lựa chọn: RLW [chọn tuần], S [chọn tuần], mặc định cùng tuần; mở “Xếp riêng từng kỹ năng” khi cần. Cấu hình kỹ năng bắt buộc tách khỏi sửa lịch, tránh bỏ môn nhầm khi chỉ dời tuần.

Ô đã có lịch mở chỉnh sửa với tuần cũ→mới; không cho chọn rồi báo lỗi trùng. Ô đã hoàn tất chỉ xem lịch; hiệu chỉnh điểm đi đường riêng đúng quyền. Nếu chỉ FT, tiêu đề panel “Kế hoạch Mock Test”; khu vực Test vẫn bao gồm Normal. Nút mũi tên/tuần/Tuần này cùng một hàng desktop, mobile xuống hàng có chủ đích, không thành ba hàng rời như ảnh.

### 18.9. Nghiệm thu giao diện

Mỗi trang phải có ảnh desktop/mobile ở vai QL và GV liên quan; dữ liệu rỗng/ít/nhiều đều đọc được. Kiểm riêng khối case hai PA song song, ghi chú dài, tên GV dài, tuần giao năm và lỗi tải tệp. Không nghiệm thu chỉ bằng “component đã có”. Những phần bỏ ở UI vẫn truy cập được nếu là chức năng/lịch sử cần thiết; chỉ bỏ hẳn các phần trùng lặp và diễn giải nội bộ thừa.

## 19. Biên tập tiếng Việt cho toàn bộ giao diện

### 19.1. Phạm vi và nguyên tắc

Đã rà tám ảnh trong hội thoại. Các chuỗi ở bảng dưới lấy từ ảnh hoặc rút đúng cụm nhìn thấy; chỗ chữ nhỏ không đủ để xác nhận nguyên văn không được trình bày như trích dẫn. Những trạng thái mới là câu đề xuất, không khẳng định có trong ảnh. Khi triển khai phải tìm toàn bộ biến thể trong code, kể cả modal/empty/error/toast, không chỉ đổi một ảnh chụp.

- Ngắn, trực tiếp, có đối tượng: “Cập nhật kết quả”, “Chọn tuần thi”, “Chờ quản lý duyệt”. Không “chốt chung”, “em này”, “lượt đó”, “máy”, “đường này” nếu chưa rõ đang nói gì.
- Dùng **học viên** trong nhãn và hướng dẫn hệ thống; giữ lời GV nguyên văn trong ghi chú/bằng chứng, không tự biên tập nội dung người dùng đã lưu. Tên demo vô nghĩa được sửa riêng trong fixture nếu cần, không sửa dữ liệu thật.
- Case là thuật ngữ người dùng đã quen: dùng “Case đang mở”, “Tạo case”, “Hoàn thành case” nhất quán. “Vấn đề” chỉ nội dung/phân loại; không dùng hai từ như hai đơn vị thống kê khác nhau cho cùng một số. Dùng “Phương án hỗ trợ”, tránh PA trong tiêu đề chính; viết tắt khi bảng quá chật và có giải thích.
- “Test” dùng cho khu vực chung, “Mock Test” cho FT, “Giữa khóa/Cuối khóa” cho Normal. “Nhập điểm” ở nút khi ngữ cảnh đã rõ; “Nhập điểm Test” ở điểm vào chung. Viết hoa nhất quán, không xen “Nhập điểm test/MT/Test”.
- Ba thời gian không nhập nhằng: **Tuần thi / Hạn nhập điểm / Hẹn xử lý**. Case/PA dùng **Hạn xác minh / Hạn cập nhật / Dự kiến kết thúc** theo trường thật, không thay toàn bộ “hạn làm” bằng cùng một nhãn cho cả Ý thức và học thuật.
- Giải thích cần thiết: đơn vị, mẫu số, kỳ, trạng thái thiếu/tạm thời, điều kiện đang chặn thao tác. Giải thích nội bộ: thuật toán, cách lưu ID, đối tượng nào không cộng với nhau, “không suy từ tên lớp” → chuyển trợ giúp hoặc bỏ vì UI đã rõ.
- Không dùng một lời nhắc dài để bù cho layout gây hiểu nhầm. Đổi nhãn/cột/bố cục trước. Tooltip không được là nơi duy nhất chứa lỗi chặn, deadline hoặc kết quả cần đọc.

### 19.2. Danh mục tiêu đề và nhãn thay thế

| Chuỗi/nhóm hiện tại | Xử lý và câu dùng mới |
|---|---|
| Tổng quan → Toàn cảnh / Thực trạng | Tab Tổng quan / Phân tích |
| “Việc của bạn, tính đến …” | “Cập nhật đến {ngày}” nếu là ngày dữ liệu; danh sách cá nhân dùng tiêu đề “Việc cần làm” |
| “Học viên đang yếu ở đâu — cả case sinh từ điểm và case giáo viên báo.” | “Theo dõi vấn đề học tập và kết quả hỗ trợ.” |
| Sự kiện nổi bật | Lịch sắp tới |
| Việc cần lưu ý | Trong màn mới: Theo chi nhánh; việc cần hành động đặt ở Cần xử lý |
| HV cần hỗ trợ | Học viên có case đang mở nếu phép tính là case; không gọi chung nếu thiếu tín hiệu chưa xác minh |
| Case / 13/4 | Tách Case đang mở / Chưa có phương án; không dùng phân số giả |
| Thiếu phương án | Chưa có phương án |
| Cần cập nhật | Cần cập nhật kết quả; khi quá hạn ghi Quá hạn cập nhật |
| Tuần giao việc trong Thực trạng | Bỏ khỏi phân tích hiện trạng nếu không lọc dữ liệu đó; tuần của việc giao đặt ở form giao việc |
| Việc đã giao | Công việc liên quan, CHỈ khi đã có liên kết thật; danh sách toàn bộ chuyển Công việc |
| Tiến độ công việc | Menu Công việc; nội dung bên trong có trạng thái/tiến độ |
| Tình hình đơn vị | Tab Báo cáo đơn vị; khối bên trong vẫn có tên đơn vị/kỳ |
| “Việc quản lý đang làm, và tình hình các đơn vị trong tuần.” | “Theo dõi công việc và báo cáo theo đơn vị.” Hoặc bỏ phụ đề khi hai tab đã đủ rõ |
| “Công việc quản lý vận hành — không phải case của học viên.” | Bỏ; tab Vận hành đã giải thích phạm vi |
| Mọi nhóm / Mọi trạng thái | Tất cả nhóm / Tất cả trạng thái |
| Tiếp tục xử lý (trạng thái việc) | Đang thực hiện; nếu là nút để tiếp tục sau tạm ngưng thì giữ “Tiếp tục công việc” |
| Dừng hẳn | Đã dừng |
| Việc đang tồn | Việc chưa hoàn thành |
| Chưa/Không còn cập nhật được báo cáo tuần này | Tách hai trạng thái: “Có thể nộp báo cáo từ {ngày}. Bạn vẫn có thể lưu nháp.” / “Đã hết hạn nộp báo cáo tuần này.” Hành động sửa sau hạn theo quyền thật |
| Cả phạm vi quản lý / Trong phạm vi quản lý | Thống nhất Trong phạm vi quản lý, chỉ hiện khi người dùng có scope đó |
| Lớp là gốc… | Bỏ toàn bộ câu; ô tìm có placeholder “Tìm học viên hoặc lớp” |
| Chưa có tuần MT | Chưa xếp lịch Mock Test, đúng tập dữ liệu FT |
| Case quá hạn cập nhật | Quá hạn cập nhật case |
| Bạn phụ trách: L R W1 W2 S | “Kỹ năng phụ trách: …”; không gán cho QL tất cả môn chỉ vì quyền sửa hộ |
| Phân công giáo viên / Chủ nhiệm | Giáo viên phụ trách / Giáo viên chủ nhiệm |
| Hiện tại — 5.5 Listening | Kỹ năng cần hỗ trợ; điểm Listening hiện ở dòng Listening, không tạo nhãn overall giả |
| Việc tiếp theo — 30/08 | Việc cần làm tiếp — “Cập nhật kết quả Listening · Quá hạn {n} ngày” |
| Tiến độ và hỗ trợ theo kỹ năng | Kết quả và hỗ trợ theo kỹ năng |
| Chưa có dữ liệu / chưa có điểm ở Ý thức | Bỏ ô điểm; thay thông tin báo cáo và xử lý |
| Ghi kết quả | Cập nhật kết quả |
| Lịch sử và kết thúc phương án | Bỏ nút kết hợp; lịch sử mở ở từng PA, kết thúc trong cập nhật PA |
| Điểm và can thiệp | Điểm và phương án hỗ trợ |
| Dòng sự kiện | Nhật ký học tập |
| Các mốc đã qua | Mốc học tập |
| Hiện 4 case đã hoàn thành | Xem 4 case đã hoàn thành |
| Kế hoạch Test (panel chỉ FT) | Kế hoạch Mock Test |
| Chọn lượt MT riêng cho từng em, rồi chốt chung một tuần | “Chọn học viên và xếp lịch theo từng kỹ năng.” |
| Tuần MT | Tuần thi |
| Kỹ năng lượt này yêu cầu | Kỹ năng cần thi |
| Chỉ em chưa có | Lọc theo lịch Test; lựa chọn ví dụ “Chưa xếp lịch MT3” |
| Học viên chưa có tuần MT tiếp theo · 3 em đang thiếu | “3 học viên chưa được xếp lịch Mock Test tiếp theo” |
| Xem cả lớp để xếp trước | Xem toàn bộ học viên |
| Chọn lượt MT | Lượt Mock Test |
| Chưa chọn em nào | Nút disabled “Chọn học viên để tiếp tục”; sau chọn đổi “Lưu lịch cho {n} học viên” |
| Target / OVR trong bảng rộng | Mục tiêu / Overall; bảng hẹp có thể viết OVR với tooltip “Điểm Overall” |

### 19.3. Ghi chú chân bảng/chân trang — bỏ gì, giữ gì

| Ghi chú đang thấy trong ảnh (rút gọn) | Quyết định và nội dung thay thế |
|---|---|
| “Ô dạng 12/5 nghĩa là 12 case… mức SOS đếm học viên… các cột kỹ năng đếm case…” | Bỏ đoạn. Tách hai cột số; ghi đơn vị ngay đầu cột. Trong Cách tính giữ: “Một học viên có thể có nhiều case. Số học viên được tính không trùng trong phạm vi đang xem.” |
| “Môn W của lớp Normal có cột riêng, KHÔNG gộp vào W2…” | Không đặt ở chân bảng. Tab Normal/FT quyết định đúng bộ môn; tooltip khi cần: “Writing của lớp thường được tổng hợp riêng với Writing Task 1 và Task 2.” |
| “Hai loại lớp có bộ môn khác nhau nên không gộp vào một bảng.” | Bỏ khỏi cạnh tab; người dùng chọn Normal/FT đã đủ |
| “Hiện trạng vấn đề là hiện tại. Hai cột kết quả tính trong 12 tuần…” | Tách hai chế độ. Dòng ngữ cảnh: “Vấn đề đang theo dõi · Cập nhật đến {ngày}”; màn hiệu quả: “Kết quả hỗ trợ · {từ ngày}–{đến ngày}” |
| “Bốn nhóm này chồng nhau… nên chúng không cộng thành 10 việc.” | Bỏ đoạn khỏi thanh số. Có tooltip: “Một công việc có thể thuộc nhiều nhóm.” Tổng việc chưa xong hiện riêng, không vẽ các nhóm như phần của một tổng |
| “Một công việc có MỘT định danh xuyên nhiều tuần — không nhân bản mỗi tuần…” | Bỏ khỏi UI. Nếu cần ở trợ giúp: “Công việc chưa hoàn thành được tiếp tục theo dõi ở các tuần sau.” |
| “Những việc này tự hết khi dữ liệu nguồn được xử lý — không có nút đánh dấu đã xong…” | Thay một câu cạnh tiêu đề: “Danh sách tự cập nhật khi điểm, case hoặc lịch Test thay đổi.” Phần giải thích còn lại chuyển trợ giúp |
| “Năm cột số là năm đơn vị khác nhau nên đừng chia chung cho nhau…” | Bỏ. Đặt tên cột kèm đơn vị; trong Cách tính hiệu quả: “Tỷ lệ có cải thiện chỉ tính các phương án đã kết thúc và có kết quả đánh giá.” |
| “Cách đếm ở đây dùng chung một bộ với trang Thực trạng…” | Bỏ khỏi UI; tính nhất quán là tiêu chí nghiệm thu, không phải lời nhắc người dùng |
| “Badge chỉ xuất hiện khi có việc cần làm… bấm badge…” | Bỏ. Badge có trạng thái tương tác rõ, tooltip ngắn “Xem {n} bài cần chấm” nếu cần |
| “Mỗi kỹ năng dùng một giáo viên… không suy từ tên lớp.” | Bỏ khỏi màn xem. Trong form phân công có một hướng dẫn cần thiết: “Chọn giáo viên cho từng kỹ năng. Giáo viên chủ nhiệm phải đang dạy ít nhất một kỹ năng của lớp.” |
| “Hai thứ nằm thẳng cột nhau KHÔNG có nghĩa cái này gây ra cái kia — phần sau vạch ‘tuần này’ là dự kiến…” | Tương lai có nhãn “Dự kiến” ngay thanh. Trong Cách đọc: “Biểu đồ thể hiện điểm và thời gian hỗ trợ; kết quả từng phương án được ghi nhận riêng.” |
| “Phần này là hành trình của CẢ em, không riêng lộ trình đang xem…” | Thay bằng bộ chọn “Lộ trình hiện tại / Toàn bộ quá trình học”; nếu cần phụ đề “Bao gồm các lớp và lộ trình trước đây.” |
| “Ô xám đậm là lượt đã làm xong… ô viền xanh… chọn lại sẽ báo lỗi…” | Bỏ đoạn. Từng lượt có nhãn Đã hoàn thành / Đã xếp lịch / Chưa xếp lịch; lượt đã có được mở sửa đúng quyền, không hướng dẫn người dùng làm một thao tác sẽ lỗi |
| “Các em xếp chung một tuần vẫn có thể ở những lượt MT khác nhau.” | Trong thao tác hàng loạt, chỉ khi cần: “Có thể chọn lượt Mock Test khác nhau cho từng học viên.” |
| Banner “Toàn bộ là dữ liệu giả, không phải dữ liệu thật của trung tâm.” | Rút thành “Bản demo · Dữ liệu minh họa”. Ngày demo vẫn hiển thị rõ vì ảnh hưởng lịch/hạn |

### 19.4. Mẫu câu cho trạng thái, form và lỗi

| Tình huống | Câu hiển thị |
|---|---|
| Không có kết quả sau lọc | “Không có kết quả phù hợp với bộ lọc.” + nút “Xóa bộ lọc” |
| Chưa có case mở | “Không có case đang mở.” Không suy ra học viên hoàn toàn không có vấn đề |
| Điểm chưa đủ | “Đã có điểm 3/4 kỹ năng · Còn thiếu Speaking” |
| Có điểm, chưa có kỳ vọng | “Chưa có mức kỳ vọng để đối chiếu.” |
| Chờ duyệt PA | “Chờ quản lý duyệt · Đề xuất ngày {ngày}” |
| Kết quả PA chưa đủ dữ liệu | “Chưa đủ dữ liệu đánh giá · Cập nhật {ngày}” |
| Lưu nháp report | “Đã lưu nháp. Báo cáo chưa được nộp.” |
| Nộp report thành công | “Đã nộp báo cáo tuần {mã tuần}.” |
| File/link mô tả case | “Tệp và liên kết” với nút “Đính kèm tệp” / “Thêm liên kết”; nhãn phụ “Không bắt buộc” |
| Upload lỗi | “Chưa tải được tệp {tên}. Nội dung đã nhập vẫn được giữ.” + “Thử lại” |
| Không có quyền sửa | “Bạn chỉ có quyền xem nội dung này.” Chỉ nêu phạm vi cụ thể nếu chắc chắn từ quyền thực tế |
| Lưu lịch một phần | “Đã lưu lịch cho {n} học viên. {m} học viên cần kiểm tra lại.” Giữ lỗi tại từng hàng |
| Chưa thấy bài bằng '-' | “Chưa thấy bài · Hẹn xử lý {ngày}”. Không dùng “Vắng” trước khi xác minh |

Không tự áp nhãn “Đã lưu” khi còn lỗi một phần. Không dùng “Không có dữ liệu” cho mọi tình huống: chưa nhập điểm, không có quyền, không có kết quả lọc và tải thất bại cần câu riêng.

### 19.5. Cách áp dụng và nghiệm thu biên tập

1. Tạo danh mục chuỗi hiển thị chung cho các khái niệm dùng lặp; một thuật ngữ một cách viết. Không đổi mã trạng thái/database chỉ vì đổi nhãn.
2. Rà cả tám màn, form tạo/sửa, tooltip, xác nhận, toast, empty/error và màn mobile; không sửa các ghi chú do GV/QL thật đã viết.
3. Mỗi chân bảng còn lại phải trả lời một câu hỏi người dùng cần để đọc đúng số hoặc thao tác. Nếu chỉ mô tả implementation hay biện minh cho UI thì bỏ/chuyển Cách tính.
4. Nội dung “Cách tính” phải khớp công thức thực tế; không sửa chữ cho có vẻ đúng khi query còn sai.
5. Ảnh nghiệm thu không còn note dài nhỏ/mờ dưới mọi bảng. Lỗi tại trường, hạn/đơn vị/kết quả vẫn đọc được ngay, không bị giấu hết vào tooltip.
6. Ngôn ngữ mới thuộc phạm vi đã được chủ sản phẩm cho phép chủ động biên tập. Nếu thay câu làm thay đổi điều kiện nghiệp vụ (ví dụ status hay SLA), dừng ở đổi nhãn đúng nghĩa và ghi rõ phần nghiệp vụ cần xử lý; không lấy biên tập làm lý do tự đổi luật.

## 20. Hồ sơ Mock Test / Test — bổ sung theo ảnh Phạm Bảo Ngọc ngày 19/09

**Đã được điều chỉnh bởi mục22:** bỏ toàn bộ khu vực C Hỗ trợ liên quan và các tiêu chí nghiệm thu card case trên trang MT. Các phần lịch/điểm/quyền tiếp tục dùng nếu không trái chốt mới. Dấu '-' theo rule book mục17 thay bước xác minh thường lệ.

Mục này cụ thể hóa PR3 trong `plan.md` mục 8 và sổ PR17 mục 13.9. Là thiết kế cần thực hiện, chưa phải tính năng đã hoàn tất. PR28 chỉ sửa bàn giao; một số nền tảng lịch/quyền/tuần đã có nhưng ảnh mới vẫn thể hiện bố cục và thao tác cũ. Chưa xác minh bản localhost cùng SHA PR28, chưa kiểm thử runtime. Không gọi toàn bộ màn là chưa làm; giữ những phần có ích dưới đây.

### 20.1. Giữ / chỉnh / bỏ

| Thành phần | Quyết định | Thực hiện cụ thể |
|---|---|---|
| HV, mã, lớp tại lúc đánh giá, MT và lộ trình | Giữ | Header gọn; lớp hiện tại khác lớp đánh giá thì ghi đúng bối cảnh, không đổi lịch sử |
| Target/kỳ vọng | Giữ, chỉnh nhãn | Mục tiêu lộ trình và Kỳ vọng MT này; kỳ vọng là căn cứ màu. Thi thật dự kiến là thông tin phụ, không chiếm một ô ngang ngang tiến độ chấm |
| Đếm kỹ năng có điểm | Giữ, sửa tính nhất quán | Một nguồn tính cho header, bảng, kết luận và mô tả động của tín hiệu. FT 1/4 là bốn band L/R/W/S; W1/W2 là hai bài nhập, không gọi 1/5 kỹ năng ở cùng chỗ |
| Lịch từng kỹ năng | Giữ | Đã có dữ liệu RLW/S khác tuần, không bỏ hoặc ép một tuần để vừa UI |
| Hai bảng Lịch theo kỹ năng và Điểm theo kỹ năng | Thay | Gộp thành một bảng làm việc; không hiển thị cùng hạn/trạng thái hai lần |
| Bốn thẻ kỹ năng + Overall dưới bảng | Thu gọn | Overall/tiến độ đợt ở header; điểm từng môn tại dòng tương ứng. Không lặp năm ô lớn ngay dưới cùng bộ điểm |
| Nút Đã thi/Bỏ xác nhận | Bỏ khỏi luồng chấm thường | Có lịch và đến thời điểm phù hợp thì được nhập theo quyền. Vắng là ngoại lệ có xác minh; không tự ghi đã thi thật chỉ vì đến lịch |
| Đổi tuần/Hạn riêng/Bỏ khỏi phạm vi hàng loạt | Thu vào thao tác phù hợp | Một menu mỗi dòng, chỉ hiện theo quyền và tình trạng. Chức năng không hợp lệ không được mở bằng API |
| Hủy lượt MT đỏ đầu trang | Bỏ vị trí hiện tại | Ngoại lệ QL trong menu; phải cho biết hủy phần nào, giữ phần có điểm. Normal không có hủy nghĩa vụ Test |
| Xếp cả đợt một tuần | Chuyển vào Chỉnh lịch | Là tùy chọn của QL, không là CTA thường trực ngang nhập điểm, không ghi đè phần đã thi/chấm |
| Nguyên CasePanel dài dưới MT | Thay bằng component gọn dùng chung | Danh sách case liên quan có mở/thu theo A, không sao chép giao diện cũ hoặc tạo bản case thứ hai |
| Quy trình gợi ý sau SOS | Giữ theo nhu cầu | Gợi ý ngắn trong thao tác lập PA, không auto-tutor và không hiển thị như công việc đã giao |
| Lịch sử thay đổi | Giữ, thu gọn | Lịch, điểm, phạm vi và quyết định; mở khi cần, có người/ngày/lý do |

### 20.2. Bố cục đích: ba khu vực chính và lịch sử thu gọn

**A. Đầu trang — hiểu đúng đợt trong vài giây**

- Dòng 1: Phạm Bảo Ngọc · MT3; phụ: mã HV · lớp tại lúc đánh giá · lộ trình.
- Dòng 2: `Đã có điểm 1/4 kỹ năng` · `Kỳ vọng 7.0` · `Overall: Chưa đủ điểm`. Nếu chỉ R có điểm7.0 thì R đạt, không có badge Overall đạt.
- Nếu có SOS tạm thời: `SOS 1 tạm thời · 2/4 kỹ năng có điểm`; không chỉ hiện màu mà thiếu phạm vi. Nếu các điểm đang có đều đạt: `Các kỹ năng đã chấm đều đạt · Còn thiếu 3 kỹ năng`, không khẳng định cả đợt đạt.
- Ngày/tuần dự kiến hoàn tất và thi IELTS dự kiến nằm trong Thông tin đợt mở rộng. Chỉ đưa lên mặt chính khi ảnh hưởng việc đang làm.
- Liên kết phụ: Hồ sơ học viên; Nhập điểm lớp. Chỉnh lịch/menu ngoại lệ theo quyền. Không header sticky cao che nội dung.

**B. Điểm và lịch kiểm tra — nơi làm việc chính**

| Cột | Nội dung |
|---|---|
| Kỹ năng | L/R/W1/W2/S với FT; L/R/W/S với Normal |
| Lịch kiểm tra | Mã tuần W3 SEP + khoảng ngày, tách lịch từng môn; ngày năm rõ khi cần |
| Điểm | L/R: số đúng và band; W1/W2/S: band, mở tiêu chí ngay tại dòng |
| Tình trạng và hạn | Chưa đến lịch / Chờ nhập điểm / Chưa thấy bài / Có điểm / Chờ QL / Đã hủy phần thi hợp lệ. Chỉ một trạng thái chính, hạn phù hợp ngay dưới |
| Thao tác | Nhập/Sửa điểm nếu có quyền; menu Đổi lịch/Hẹn xử lý/Lịch sử tùy vai và tình trạng |

- Writing tổng hợp hiện một dòng phụ dưới W1/W2, rõ là điểm tính từ hai task, không có ô nhập Writing tổng thứ ba.
- Khi mở tiêu chí W/S, bốn ô và nút Lưu/Hủy chỉnh sửa ở ngay dòng; đóng lại thấy điểm và ngày cập nhật. Không cần mở thêm nhiều panel.
- Điểm có màu so với kỳ vọng và chênh lệch; xu hướng MT cũ chỉ phụ. Không dùng màu trạng thái Đang chờ như màu đạt điểm.
- '-' là lệnh Chưa thấy bài được giải thích ngắn trong ô và cho thấy ngày hẹn trước khi lưu. Không yêu cầu thao tác xác nhận Đã thi riêng. Giữ chính sách hoãn/vắng trong rule book; không đơn giản hóa UI bằng cách bỏ phê duyệt cần thiết.
- Có điểm nhưng chưa đủ tiêu chí: trạng thái Chưa đủ điểm của đúng bài, không chốt band giả. Đã có điểm chính thức thì '-' không âm thầm xóa.
- Trường chỉ đọc có lý do ngắn như “GV Reading phụ trách”; không mở quyền chỉ vì muốn nhập trên cùng bảng.
- Hạn gốc và hẹn xử lý mới hiện cạnh nhau khi khác: `Hạn nhập 23/09 · Hẹn xử lý 30/09`. Không xóa lịch sử trễ bằng ghi đè.
- Không tự thay cơ chế lưu hiện hành nếu chưa kiểm soát giao dịch. Đề xuất ưu tiên lưu từng dòng/tiêu chí với thông báo rõ; nếu giữ lưu toàn bảng phải chỉ rõ số thay đổi chưa lưu và lỗi từng dòng.

**C. Hỗ trợ liên quan đến đợt Test**

- Tách `Cần xác minh` (signal còn hiệu lực) khỏi `Case đang theo dõi` (đã có nguyên nhân). Không gán nhãn Khác cho tín hiệu chưa được xác minh.
- Tín hiệu gọn: kỹ năng, điểm/kỳ vọng, người phụ trách, hạn3 ngày, nút Cập nhật nguyên nhân. Không dựng một timeline case trống cao hàng trăm pixel.
- Case dùng card A: tên vấn đề, kỹ năng, trạng thái, lần cập nhật/ngày; mở thấy mô tả/file/link và từng PA độc lập, hạn/kết quả/ngày.
- Chỉ đưa case có liên kết thực sự với đợt hoặc đang xử lý tín hiệu của đợt. Các case khác vẫn ở hồ sơ HV, không tự coi cùng kỹ năng là cùng nguồn.
- Case lịch sử có snapshot “lúc mở 2/4” phải ghi rõ lịch sử; trạng thái hiện tại 1/4 dùng dữ liệu hiện hành. Không để hai câu đều trông như mô tả hiện tại.
- Thu hồi điểm sai: tín hiệu không còn hiệu lực không nằm trong việc cần xử lý; lịch sử ghi lý do. Case GV xác minh độc lập không tự biến mất.
- Bỏ nút Mở trang riêng khỏi mặt chính, giữ deep link cho thông báo/đường dẫn. Người dùng xử lý tại chỗ bằng component chung.

**D. Lịch sử thay đổi**

Thu gọn mặc định, đếm số thay đổi; mở được ai sửa điểm/lịch/kỳ vọng/phạm vi, trước–sau, ngày và lý do. Không xếp log kỹ thuật ngang với kết quả học tập.

### 20.3. Phân vai và điểm vào

| Vai | Mặt chính ưu tiên | Giới hạn |
|---|---|---|
| GVBM | Bài mình cần chấm, điểm/kỳ vọng, tín hiệu môn mình | Chỉ thao tác môn được giao; không tự đổi lịch FT chủ động hoặc hủy |
| GVCN | Tiến độ cả đợt, môn thiếu/chờ bài, xác minh vắng | Dời FT do vắng theo luật; quyền nhập hộ/học thuật trái môn cần tuân thủ ma trận chốt, không suy từ layout |
| QL | Toàn đợt trong scope, lịch, đề nghị, dữ liệu thiếu và hỗ trợ | Hành động ngoại lệ có lý do/lịch sử, không tự xóa điểm đã có |

Đi từ badge HV, nhãn MT trong lớp, mốc hành trình, thông báo hoặc hàng chấm đều tới đúng đợt/kỹ năng; Back giữ bộ lọc. Nút Nhập điểm lớp truyền lớp, đợt và tuần liên quan, không fallback APR2027. Mở độc lập dùng tuần hiện tại/ngày demo phù hợp.

### 20.4. Những lỗi ưu tiên trước thẩm mỹ

1. Overall trống nhưng Đạt kỳ vọng (ảnh có bằng chứng trực tiếp).
2. 1/4 ở header nhưng 2/4 trong nội dung case; L trống nhưng case L dưới kỳ vọng. Cần tái hiện hiệu chỉnh/xóa điểm, xác định dữ liệu lịch sử hay stale; không đoán nguyên nhân.
3. Chấm vẫn phụ thuộc xác nhận Đã thi hoặc thiếu đường nhập dù đã đến lịch.
4. Đơn vị đếm khác nhau: kỹ năng4, ô bài5, case và tín hiệu; nhãn phải khớp.
5. Người cập nhật trạng thái không được hiển thị như đã nhập điểm khi ô điểm trống.
6. Ngày demo14/09 nhưng ngày cập nhật19/09: kiểm đồng hồ nghiệp vụ và audit, không tự xóa timestamp thật hoặc sửa ngày để đẹp ảnh.

### 20.5. Biên tập tiếng Việt riêng màn Test

| Câu hiện tại | Câu/thao tác thay |
|---|---|
| Kế hoạch MT (khối chứa cả kết quả) | Thông tin đợt Mock Test |
| Tuần hoàn tất | Tuần dự kiến hoàn tất |
| Target lúc đánh giá | Mục tiêu tại thời điểm đánh giá |
| Chưa xác nhận đã thi | Chờ nhập điểm khi đến lịch; không dùng câu này làm cổng chặn chấm |
| Chưa có gì diễn ra | Chưa có phương án hỗ trợ |
| Ghi lại phương án đầu tiên để lần sau còn biết đã thử gì cho em | Thêm phương án hỗ trợ và người phụ trách |
| Chưa có phương án hỗ trợ nào — chưa ai bắt tay vào việc | Chưa có phương án hỗ trợ; không suy chưa ai làm gì ngoài hệ thống |
| Chưa làm gì cho em thì chưa có gì để kết luận | Cần cập nhật kết quả phương án trước khi hoàn thành case; chỉ dùng nếu đúng điều kiện chặn |
| Bỏ khỏi phạm vi | Kỹ năng không kiểm tra trong đợt này; chỉ nằm ở phần cấu hình hợp lệ trước thực hiện |
| Note dài phân biệt tuần học và tuần lịch | Giữ nhãn chính; tooltip: “Tuần dự kiến hoàn tất là tuần kiểm tra muộn nhất của các kỹ năng trong đợt.” |

Không viết lại ghi chú thật của GV. Những câu có số liệu động phải lấy dữ liệu hiện hành; mô tả tại thời điểm phát sinh phải có nhãn lịch sử.

### 20.6. Nghiệm thu

- Ảnh trước/sau cùng dữ liệu Phạm Bảo Ngọc: chỉ R7.0, Overall chưa đủ; không kết luận cả đợt đạt.
- Có đủ bốn môn nhưng một môn dưới kỳ vọng, Overall vẫn đạt: hai thông tin cùng đúng và được trình bày riêng.
- RLW/S khác tuần cùng đợt, W1/W2 đủ/thiếu tiêu chí, FT chỉL/R, Normal bốn môn khác tuần.
- Sửa điểm làm hết SOS; không còn tín hiệu sai nhưng giữ case độc lập/công việc đã thực hiện.
- '-' một bài, retry, điểm có sẵn, vắng lần1/lần2, chờ duyệt và khôi phục; Normal không có hủy nghĩa vụ.
- Hai case và hai PA song song đọc được khi mở/thu, kết quả có ngày, file/link xem được.
- Desktop bảng gọn; mobile từng thẻ kỹ năng hoặc cuộn nội bộ, không làm toàn trang tràn ngang. Điều khiển bằng bàn phím và nhãn chữ không phụ thuộc màu.
- Kiểm GVBM/GVCN/QL từ menu thật tới lưu và quay lại, không chỉ chụp component độc lập.

## 21. Liên kết rule book và điểm chưa chốt

File `PISA-Rulebook-2026-09-19.md` tổng hợp SOS, học thuật, Ý thức, PA, lịch/hoãn/vắng/hủy, quyền, thống kê và luật phụ từ prompt gửi lại. Phân biệt Đã chốt/Code hiện hành/Cần chốt/Đề xuất. Các mã C01–C09 ở đó là những chỗ nguồn chưa đồng nhất hoặc thiếu ngoại lệ; không tự biến đề xuất UI thành đổi luật.

Đặc biệt không quên: chỉ bỏ Admin CN; chưa đủ dữ liệu không là thất bại; mô tả case có file/link; Ý thức có nguồn báo cáo và hạn riêng; Normal không hủy nghĩa vụ Test. Việc giữ Cần chú ý/Gấp trong form tính hạn là theo sổ chốt sau prompt đầu, khác việc bỏ badge Gấp lặp trên tiêu đề.

## 22. Overhaul bổ sung — chốt từ ba ảnh panel ngày19/09/2026

Đã đọc trực tiếp ba ảnh: bộ chọn tuần trong Tiến độ lớp, PA nhập bù ở +Case, nhập học viên. Đây là cập nhật thiết kế và luật; chưa sửa website hay xác nhận các modal bằng thao tác runtime.

### 22.1. Hồ sơ MT chỉ phục vụ đợt kiểm tra

**Bỏ hẳn khỏi trang:** khối Case/hỗ trợ, timeline case, phương án, gợi ý trao đổi/tutor, form hoàn thành case. Không giữ card gọn ở cuối chỉ vì đã có component. Dữ liệu case và liên kết lịch sử vẫn ở hồ sơ HV; một liên kết Hồ sơ học viên ở đầu là đủ để đi tiếp khi cần.

**Bố cục đề xuất mới:**
1. Header gọn: tên HV · MT3, lớp/lộ trình; nút phụ Hồ sơ HV, Nhập điểm lớp; chọn đợt khác bằng menu tìm được, không cần quay về HV.
2. Một dải kết quả: số kỹ năng có điểm / số yêu cầu, kỳ vọng, Overall nếu đủ. SOS và chênh lệch điểm là thông tin của Test, vẫn giữ; không kèm quản lý case. Không có Overall thì Chưa đủ điểm, không badge đạt giả.
3. Một khu vực **Điểm và lịch kiểm tra**: mỗi bài một hàng, điểm và lịch/hạn ngay cạnh. L/R nhập số đúng; W1/W2/S mở tiêu chí ngay hàng. Dòng Writing tổng phân biệt với hai bài. Không còn bảng lịch riêng rồi bảng điểm riêng rồi năm thẻ điểm lặp.
4. **Lịch sử thay đổi** thu gọn cuối trang; cấu hình phạm vi/lịch/ngoại lệ trong Chỉnh lịch hoặc menu theo quyền.

Tập trung làm việc trên trang, không phát sinh thêm tab nếu một bảng đã đủ. Desktop cột thẳng, tên bài có chiều rộng ổn định, điểm dễ nhìn. Mobile mỗi bài một card cùng thứ tự thông tin; chỉ vùng dữ liệu cần cuộn, không toàn trang.

Luồng '-': tại ô nhập có gợi ý `Nhập - nếu học viên không làm bài`. Sau lưu hiện `Không có bài · Có thể sửa đến hết Chủ nhật {ngày}`; đến cuối tuần chốt `Không dự thi` theo rule book17. Không thêm nút xác nhận vắng cho trường hợp đã chốt bằng dấu '-'. Hạn nhập điểm và hạn chốt không dự thi trình bày khác tên, không thay nhau. Ngoại lệ dời lần2/khôi phục vẫn đúng quyền QL.

### 22.2. Quản lý lớp: bỏ một tầng điều hướng

Menu lớp mở trực tiếp:
- **Lộ trình** (đổi từ Tiến độ lớp): tuần khai giảng, giai đoạn/mốc chương trình tương ứng, thông tin lớp cần chỉnh liên quan.
- **Phân công GV**: mở ngay bảng chọn người theo môn/GVCN.
- **Chuyển tiếp lớp**: chỉ Normal, mở ngay tạo/chọn lớp và danh sách chuyển.

Bỏ màn trung gian Thông tin lớp chứa tiếp hai tab. Các trường tên/mã/chương trình hiện hữu vẫn cần nơi sửa hợp lý trong Lộ trình hoặc thông tin cơ bản, không bị mất vì gỡ tab. Nếu đã có tab Giáo viên trên hồ sơ lớp, nút chỉnh mở cùng form Phân công, không hai bộ form.

Ảnh FT có câu “Hai mốc kiểm tra đếm từ đây” nhưng dưới lại nói FT không có hai mốc chung: bỏ câu chung sai ngữ cảnh. Normal nói `Các mốc kiểm tra được tính từ tuần khai giảng`; FT nói ngắn `Lịch Mock Test được xếp riêng cho từng học viên` và có liên kết Kế hoạch Mock Test nếu cần. Bỏ hướng dẫn dùng tên cũ Kế hoạch học.

### 22.3. Bộ chọn tuần thống nhất toàn web

Ảnh: nút Trước nằm hàng riêng, trường tuần hàng riêng, Sau/Tuần này hàng dưới. Đây là lỗi bố cục component/khung chứa, không chỉ lỗi một màn.

- Desktop/panel đủ rộng: cùng một hàng **Trước | W3 SEP 2026 · 14–20/09 | Sau | Tuần này**; chiều cao40–44px, gap8px, nút mũi tên cố định, trường tuần co giãn min-width0.
- Panel hẹp: ba phần Trước/trường/Sau vẫn cùng hàng; chỉ Tuần này xuống hàng riêng có chủ ý. Không wrap từng nút ngẫu nhiên; không dùng mũi tên vô chủ cách xa trường tuần.
- Bấm trường tuần mở một popover lịch: gõ ngày hoặc chọn tuần, đổi tháng/năm; hiện khoảng ngày và mã tuần đúng hàm web. Không dropdown hàng chục tuần, không chia nhiều nơi tính mã tuần.
- Ghi tuần đang chọn thực tế ngay trên trường; nếu có mặc định thì điền thật, không để ô trống nhưng footnote nói đang dùng một ngày khác.
- Quét mọi nơi dùng: Lộ trình lớp, Kế hoạch Test, Lộ trình HV, hồ sơ Test, bảng chấm, đổi lịch, báo cáo tuần và các bộ lọc thời gian. Sửa component và CSS của panel chứa; kiểm portal/z-index để popover không bị cắt.
- Lỗi chọn tuần tại chỗ, bàn phím/nhãn accessible, Back/URL giữ ngữ cảnh, năm rõ khi giao năm; ngày demo/tuần hiện tại nhất quán.

### 22.4. +Case nhập bù: Phương án đã áp dụng

Đổi **Đã làm gì** → **Phương án đã áp dụng**, **Người làm** → **Người thực hiện**, **+ thêm dòng** → **+ Thêm phương án**.

Mỗi PA một card gọn:
- Dòng1: mô tả phương án toàn chiều rộng.
- Dòng2: Người thực hiện toàn chiều rộng, có tìm kiếm.
- Dòng3: hai ô Bắt đầu/Kết thúc bằng nhau; không mũi tên đứng một mình cuối dòng. Với panel rộng có thể để người và hai ngày cùng hàng theo grid cố định; panel600px ưu tiên bố cục ba dòng ổn định.
- Nút xóa nhỏ có nhãn ở góc card; không xóa toàn case. Ngày bắt đầu/kết thúc đúng thứ tự, lỗi ngay trường, không đẩy lệch card khác.
- Mô tả/case và bằng chứng file/ảnh/link có vùng riêng rõ. Ý thức chỉ hoàn thành và bằng chứng, không render thang học thuật ở dưới. Học thuật vẫn giữ kết quả tương ứng luồng nhập bù.

### 22.5. Ô chọn người có tìm kiếm trên toàn hệ thống

Người thực hiện PA: chỉ role Giáo viên, gõ từ3 ký tự để gợi ý (đáp ứng yêu cầu3–5); tìm có/không dấu, không phân biệt hoa thường; phản hồi có debounce và giới hạn kết quả. Chưa đủ ký tự ghi `Nhập ít nhất 3 ký tự để tìm giáo viên`.

- Dropdown ghi tên và thông tin phân biệt tên trùng như CN/mã; chọn lưu ID, không tên tự do.
- Không có kết quả: `Không tìm thấy giáo viên phù hợp`; không tự tạo người mới.
- Bàn phím lên/xuống/Enter/Esc, xóa/chọn lại; dữ liệu tải trễ không thay kết quả của lượt gõ mới; không tải toàn danh bạ không cần thiết.
- Quét Người phụ trách/Người thực hiện/Phân công GV/GVCN/Người tiếp nhận/Tư vấn viên/Người duyệt và các form tương tự. Dùng chung tương tác, **khác tập người hợp lệ theo trường**. Chỉ Người thực hiện PA dùng teacher-only; không lọc người duyệt QL thành teacher-only.
- Phân công lớp vẫn chỉ GV thuộc CN được phân công; GVCN là GV dạy ít nhất một môn lớp. Form lịch sử cần giữ người từng làm, không âm thầm đổi sang GV hiện tại hoặc xóa tên không còn active.
- API kiểm ID/quyền/phạm vi, không chỉ lọc dropdown. Tìm kiếm không mở quyền GV xem hồ sơ chuyên môn đồng nghiệp.

### 22.6. Thêm học viên: căn thẳng, đọc được và không bỏ dữ liệu lỗi âm thầm

Ảnh có ba vấn đề: ô nhập lệch hàng vì chú thích nhiều dòng; bảng quá rộng so với panel; nền là MB-FOU12 nhưng lớp đích MB-FT101. Chưa biết người dùng đã chủ động đổi lớp hay app mặc định sai: phải kiểm ngữ cảnh, không kết luận từ ảnh.

- Mở từ hồ sơ lớp: mặc định đúng lớp đó. Mở từ Học viên: chọn lớp trước. Nếu cho đổi lớp, phải là thao tác rõ ràng, header và form đổi đồng bộ, không tự lấy lớp đầu danh sách.
- Modal nhập hàng loạt rộng theo viewport (tối đa khoảng1440px, chừa lề); không dùng drawer hẹp rồi ép 10cột. Mobile có cuộn trong bảng hoặc sửa từng dòng bằng card.
- Vùng1: lớp đích và tuần bắt đầu dùng cùng component tuần; nhãn `Tuần bắt đầu học mặc định`. Không “cho cả lô”.
- Vùng2: dán Excel/Sheets + định dạng ngày, nút `Đọc dữ liệu` hoặc tự phân tích có trạng thái rõ. Gợi ý cột ngắn, không đoạn giải thích mô hình dài.
- Vùng3: bảng xem trước, header và ô cùng chiều rộng cột; hàng input căn trên/cùng baseline. Họ tên rộng nhất, ngày đủ rộng, điểm nhỏ đồng đều; lỗi nằm dòng phụ có bố cục, không làm ô điểm rơi thấp/cao khác nhau.
- Header nhóm điểm đầu vào OVR/L/R/W/S, Mục tiêu, Tuần bắt đầu; Normal chỉ các cột phù hợp, không ô target FT giả.
- Thiếu target là thông tin cần bổ sung, không cảnh báo dài dọc cột; dùng một câu ngắn ở phần tóm tắt `Thiếu mục tiêu: {n} học viên`. Không tô đỏ nếu vẫn được nhập.
- Bỏ nút **Bỏ qua 1 dòng lỗi**. Dòng rỗng hoàn toàn không đếm; dòng có dữ liệu lỗi giữ để sửa hoặc xóa chủ động. Có thể bấm `Xem {n} dòng cần sửa` để focus, không tự bỏ chúng.
- Footer: `Hủy` và `Thêm {n} học viên`; chưa có dữ liệu hợp lệ thì nút `Thêm học viên` disabled, không `Thêm 0 học viên`. Đề xuất chặn lưu đến khi dòng lỗi được sửa/xóa để tránh mất người trong một lần nhập. Không sửa luật trường thiếu cho phép.
- Copy: “Em nào vào muộn thì ghi đè...” → `Có thể chọn tuần bắt đầu riêng cho từng học viên.` “Cả lô này vào một lớp...” bỏ nếu lớp đích đã rõ. Ghi chú thiếu dữ liệu gọn `Để trống hoặc nhập - nếu chưa có thông tin.`

### 22.7. Thay hai nút Việc của tôi / Cả phạm vi quản lý

Mục đích hiện tại: phân biệt việc mình được giao với việc của mọi người trong phạm vi được xem. Mục đích có ích nhưng hai nút đặt ở trang danh sách HV khiến người dùng tưởng đổi quyền xem/học viên, và có thể làm badge đếm đổi khó hiểu.

**Quyết định thiết kế:** bỏ cặp nút khỏi thanh chính Tổng quan và Học viên, giữ nguyên ràng buộc quyền.
- Tổng quan QL: Chi nhánh/Lớp nói rõ phạm vi; khối tổng hợp theo phạm vi, phần việc có tiêu đề Cần xử lý. Nếu lọc người thì đặt Người phụ trách ngay trong khối việc, không làm mọi biểu đồ đổi nghĩa.
- Tổng quan GV: mặc định học viên/công việc được phân công; ghi ngữ cảnh `Các lớp bạn đang phụ trách`, không cần nút chọn một phạm vi không dùng được.
- Học viên: lọc Chi nhánh/Lớp, giữ xem hồ sơ theo quyền. Chọn `Cần nhập điểm Test` thì hiện bộ lọc Người phụ trách nếu cần, mặc định Tôi với GV; QL Tất cả GV trong phạm vi. Nhãn số phải nói đang đếm bài của ai.
- Công việc/Test: một dropdown **Người phụ trách** (Tôi/Tất cả trong phạm vi/Chọn GV nếu có quyền) thay hai nút phạm vi mơ hồ. Dropdown không làm GV xem hồ sơ chuyên môn GV khác.
- Badge và danh sách đích dùng cùng scope. Nếu một badge chỉ đếm phần GV cần làm, ghi `Bạn cần chấm: n bài`; nếu toàn lớp, ghi `Lớp còn n bài chưa nhập điểm`. Không vừa nói toàn lớp vừa dẫn đến việc riêng.
- Không đổi scope ngầm khi click; URL/back giữ bộ lọc; QL có quyền xem không bị nhận toàn bộ việc của GV thành việc mình.

### 22.8. Nghiệm thu và quy tắc thay thế

1. Hồ sơ MT không còn khối case/PA; điểm/kỳ vọng/tiến độ/SOS hợp lệ và lịch sử vẫn đủ.
2. Menu lớp mở trực tiếp Lộ trình/Phân công GV/Chuyển tiếp Normal; không qua Thông tin lớp thêm tab.
3. Week picker thử trong panel600px, modalrộng và mobile; nút không rớt hàng ngẫu nhiên, không cắt popover.
4. PA nhập bù nhiều dòng, tên dài và báo lỗi ngày: ô không tràn; dropdown chọn đúng role/quyền và tên trùng.
5. Import nhiều dòng có lỗi/thiếu mục tiêu/tên dài: hàng thẳng, không bỏ học viên âm thầm, không sai lớp đích; footer không che dòng cuối.
6. Hai nút phạm vi cũ biến mất khỏi mặt chính; bộ lọc thay thế đúng vai, số và danh sách khớp.
7. '-' và ba ngày gộp Ý thức theo rule book17, không triển khai bốn ngày hoặc GVCN xác minh mọi '-' từ bản cũ.
8. Ghi chú footer ngắn, không câu nói thiếu tự nhiên, không thay nội dung ghi chú thật do GV viết.
