# PISA CRM — Tổng hợp yêu cầu và đề xuất OVERHAUL UX/UI cho Claude

**Ngày chốt:** 21/10/2026  
**Mục đích:** Giao Claude rà soát toàn website, brainstorm, thiết kế lại và dựng mockup để chủ sản phẩm xem xét trước khi triển khai.  
**Phạm vi:** Toàn bộ UX/UI, không chỉ chỉnh màu hoặc sửa vài màn của V4.

## 1. Chỉ thị trực tiếp cho Claude

UX/UI hiện tại chưa đáp ứng mong đợi: thông tin dày, thiếu điểm nhấn, nhiều bước thao tác, Tổng quan chưa thực sự là tổng quan, các màn báo cáo và làm việc bị trộn mục đích. Hãy coi đây là một đợt thiết kế lại toàn diện.

Bạn có toàn quyền chủ động brainstorm và xử lý các quyết định thiết kế: tổ chức lại thông tin, thay bố cục, giảm hoặc gộp thành phần, thiết kế lại bảng, panel, điều hướng, trạng thái và hệ màu. Không bị ràng buộc bởi việc một màn đã được vẽ trong V4 hoặc một thành phần đã có trong code. Đưa ra ý tưởng tốt hơn khi cần, giải thích ngắn gọn lợi ích và đánh đổi.

Quyền chủ động này dành cho thiết kế và đề xuất triển khai; không được âm thầm đổi nghiệp vụ, mở rộng quyền, bỏ bước duyệt, sửa dữ liệu thật hoặc tự thêm cách tính KPI. Phần đã được người dùng chốt phải được giữ. Các đề xuất trong tài liệu này là điểm xuất phát để phát triển, không phải trần giới hạn sáng tạo.

Hãy làm việc theo trình tự: đọc nguồn và code hiện tại → rà soát vấn đề → so sánh các hướng thiết kế → chọn hướng khuyến nghị → dựng mockup theo vai và tình huống → lập kế hoạch triển khai. Không dừng ở một bài tư vấn chung chung hoặc chỉ đổi CSS.

## 2. Cách đọc nguồn và thứ tự ưu tiên

### 2.1. Nguồn đã cung cấp

8 cặp mockup HTML và truy vết cùng tiền tố `mockup-v4-`:

- `tong-quan.html` và `tong-quan-truy-vet.md`.
- `cong-viec.html` và `cong-viec-truy-vet.md`.
- `cham-test.html` và `cham-test-truy-vet.md`.
- `viec-tvv.html` và `viec-tvv-truy-vet.md`.
- `ho-so.html` và `ho-so-truy-vet.md`.
- `hoc-vien-lop.html` và `hoc-vien-lop-truy-vet.md`.
- `phan-tich-tutor.html` và `phan-tich-tutor-truy-vet.md`.
- `bang-mau.html` và `bang-mau-truy-vet.md`.

Hai ảnh tham chiếu: `PISA ielts - LOGO-01.png` và `Screenshot 2026-10-21 095552.jpg` (trích bảng tiêu chí KPI).

Tài liệu cũ liên quan: `PISA_CRM_MASTER_PROMPT_UX_UI_OVERHAUL_FINAL.md`. Khi có quyền truy cập, đọc bản hiện hành để giữ các nghiệp vụ không được thay đổi trong đợt này.

### 2.2. Thứ tự ưu tiên

1. Yêu cầu và câu trả lời xác nhận mới nhất được tổng hợp trong tài liệu này.
2. Quy tắc nghiệp vụ đã chốt trước đó, tại những điểm không bị yêu cầu mới thay thế.
3. Code, dữ liệu và quyền hiện hành để xác minh cách hệ thống thực sự hoạt động.
4. Mockup V4, truy vết và các đề xuất trước đây: nguồn tham khảo, không tự coi là yêu cầu đã duyệt.

Phân biệt rõ **YÊU CẦU ĐÃ CHỐT**, **ĐỀ XUẤT THIẾT KẾ**, **CẦN XÁC MINH NGHIỆP VỤ**. Không biến một đề xuất của người thiết kế thành quyết định của chủ sản phẩm.

### 2.3. Giới hạn của lần rà soát này

Tài liệu được tổng hợp từ góp ý trực tiếp, nội dung/cấu trúc HTML và truy vết V4, cùng hai ảnh tham chiếu. Đây không phải báo cáo đã kiểm thử website chạy thật hoặc đã xác minh toàn bộ mã nguồn GitHub. Phần lớn HTML là các khung trạng thái tĩnh; một số script chỉ sinh dữ liệu mẫu. Các tuyên bố như “2 bấm”, “không tràn ở 1280”, “luôn đồng bộ” trong truy vết là mục tiêu cần kiểm tra, không phải kết quả kiểm thử.

## 3. Những điểm đã chốt, không hỏi lại

| Mã | Yêu cầu |
|---|---|
| C01 | OVERHAUL toàn website, cho phép thay các bố cục V4 |
| C02 | Toàn bộ giao diện theo nhận diện xanh + hồng + trắng PISA; được điều chỉnh sắc độ cho phù hợp website |
| C03 | Ưu tiên phần trăm cho tiến độ/tỷ lệ công việc ở nơi hợp lý; điểm số giữ bản chất điểm |
| C04 | Tổng quan gọn, theo vai, ưu tiên tình hình và số liệu; không mặc định tích hợp form công việc |
| C05 | TVV có trang Công việc riêng để đồng bộ; bỏ hướng V4 chỉ để việc TVV ở Tổng quan |
| C06 | Hồ sơ GV thiết kế lại theo hai nhóm Hành chính và Giảng dạy–Học thuật; bỏ bảng cũ không phục vụ nhu cầu |
| C07 | Phân tích GV là một bảng tổng hợp có hai nhóm thông tin trên; hồ sơ GV chi tiết hơn |
| C08 | Ảnh KPI chỉ định hướng thông tin hiển thị, không tính điểm KPI, không tự xếp loại GV |
| C09 | MT đạt kỳ vọng Overall của lượt đó: không tính kỹ năng thấp hơn kỳ vọng là tạch khi đánh giá GV |
| C10 | Thi thật đối chiếu Target đầu ra; đạt Overall Target thì áp dụng nguyên tắc không tính kỹ năng tạch như trên |
| C11 | Ghi nhận tiến bộ/bài kiểm tra trên lớp hằng tuần là tùy chọn, không sinh nghĩa vụ hoặc việc bắt buộc |
| C12 | Mọi GV có kỹ năng Speaking đều thấy bài chấm chéo trong phạm vi chi nhánh được phép, kể cả không phụ trách lớp Speaking |
| C13 | Lịch Test chuyển sang cách xem theo tuần; tích hợp tình trạng chấm dành cho QL/Admin, không cần trang Tình trạng chấm riêng |
| C14 | Chấm Test: Quá hạn → Hạn tuần này → Bài thi Speaking tuần này (mở sẵn) → Hạn tuần sau (gập sẵn) |
| C15 | Form báo PH của TVV: Đã báo PH / Chưa liên hệ được, ngày mặc định ngày nhập, ghi chú kết quả; không thêm các lựa chọn rườm rà |
| C16 | Cập nhật KQ thi thật thuộc Sau thi, cùng tuyến với bước tiếp/lộ trình tiếp theo; được lưu riêng điểm khi chưa chốt bước tiếp |
| C17 | Hồ sơ lớp phải xử lý việc ngay tại panel, gồm đánh giá kết quả đầu ra; không bắt vào từng hồ sơ HV |
| C18 | Hồ sơ lớp tách W1 và W2; HV & Lớp dùng W tổng hợp, kèm W1/W2 nhỏ bên dưới |
| C19 | Một GV có nhiều việc cho cùng HV thì hiện đủ từng việc, ưu tiên việc của chính người xem |
| C20 | Mặc định 3 MT; sau MT3 không tự gợi ý thêm MT, không tự sinh việc yêu cầu xếp thêm; QL chủ động thêm trong Kế hoạch Test |
| C21 | Đổi nhãn cột lịch “Thi thật” thành “Ngày thi”; không đổi sai nghĩa các nhãn “Kết quả thi thật” hoặc “Điểm thi thật” |
| C22 | Báo cáo tách rõ nội dung HV/GV; bấm số mở panel dữ liệu liên quan, tuyệt đối không phải panel làm việc |
| C23 | Badge Đạt đồng bộ với hệ SOS; Đã thi/chờ KQ phải có cách thể hiện khác, không gây nhầm với kết quả học tập |

### Nghiệp vụ nền phải giữ

- Việc TVV phát sinh ngay khi GVCN lưu xử lý vi phạm, không đợi một thời điểm khác do thay giao diện.
- Hạn 5 ngày là 5 ngày lịch. Quy ước tính ngày bắt đầu và giờ hết hạn phải đối chiếu nguồn chính thức; xác nhận “5 ngày lịch” tự nó chưa chốt “ngày lưu + 4 lúc 23:59”.
- Dữ liệu đã lưu vẫn được chỉnh sửa nếu vai trò có quyền, có lịch sử; các bước duyệt bắt buộc vẫn giữ.
- Trong cùng chuỗi dời MT: dấu `-` lần 1 dời sang tuần tiếp theo, lần 2 hủy; với MT hiện tại giữ luồng gửi duyệt đã chốt. Không dùng quy tắc “MT cũ gặp dấu - thì hủy ngay” nếu trái nguyên tắc này.
- Không xóa lịch sử MT4 trở lên đã tồn tại để ép về 3 MT. “Mặc định 3 MT” không đồng nghĩa chỉ cho phép tối đa 3 MT.

## 4. Các mâu thuẫn V4 cần xử lý

| V4 / vấn đề | Hướng xử lý mới |
|---|---|
| Tổng quan lấy hàng đợi + form phải làm trung tâm | Thiết kế lại thành Tổng quan theo vai; việc có nơi xử lý riêng |
| TVV không có menu Công việc | Thêm Công việc cho TVV |
| Panel chỉ số loại C chứa nút Thêm PA/Tạo Case | Ở Báo cáo chỉ mở dữ liệu; không chèn form hay CTA xử lý nghiệp vụ |
| Tab Tình trạng chấm riêng | Gộp vào Lịch tuần, theo quyền |
| TVV dùng 4 hàng chip về phương thức/phản hồi | Rút thành trạng thái + ngày + ghi chú |
| Lịch thi chứa Cập nhật KQ thi thật | Chuyển sang Sau thi, nối với bước tiếp |
| Mobile bỏ W1/W2 | Giữ khả năng nhìn W1/W2; HV & Lớp dùng dòng phụ gọn, hồ sơ lớp tách rõ |
| “Đạt” chỉ chữ trong khi SOS có badge | Đồng bộ hệ badge kết quả |
| Lịch/việc tự gợi ý MT4 sau MT3 | Loại bỏ gợi ý/việc tự sinh; chỉ QL chủ động thêm |
| V4 Chấm Test nói QL nhập hộ, Công việc nói QL không score.edit | Không suy quyền theo tên vai; xác minh ma trận quyền, cùng quyền thì cùng hành vi ở mọi lối vào |
| “Cùng số” nhưng nơi đếm bài, nơi đếm nhóm việc | Chốt đơn vị đếm; chỉ yêu cầu bằng nhau khi cùng đơn vị và phạm vi |
| Sau lưu nơi tự chuyển ngay, nơi đợi 10 giây, nơi bấm Việc kế | Dùng quy tắc thống nhất theo hành động người dùng; không chuyển khi chưa lưu xong hoặc còn bản nháp |
| Một số nguồn ghi đã/chờ chủ SP duyệt | Không suy ra đã duyệt từ ghi chú, lịch dự kiến hoặc tiêu đề khung |

Không để tài liệu truy vết cũ tiếp tục ra lệnh trái yêu cầu mới. Cập nhật cả truy vết và tiêu chí nghiệm thu khi thay mockup.

## 5. Định hướng thẩm mỹ và thành phần dùng chung — đề xuất

### 5.1. Ba hướng để brainstorm

1. **PISA sáng, rõ:** nền trắng, thanh điều hướng xanh, màu hồng làm điểm nhấn có chọn lọc, bảng sạch và nhịp đọc rõ. Đây là hướng khuyến nghị.
2. **PISA theo khu nội dung:** các khu hành chính/học thuật/hỗ trợ dùng nền nhạt và dấu hiệu hình ảnh riêng, vẫn chung một hệ màu.
3. **PISA tập trung nhiệm vụ:** trang Công việc tối ưu mật độ và bàn phím; Tổng quan/Báo cáo ưu tiên khoảng thở, tỷ lệ và xu hướng.

Có thể kết hợp hướng 1 với 3. Không biến website thành một bảng điều khiển toàn thẻ số hoặc phủ mọi nền bằng xanh đậm. Dựng ít nhất hai phương án thực sự khác bố cục cho Tổng quan và hồ sơ GV, rồi chọn hướng có lý do.

### 5.2. Nguyên tắc màu và chữ

- Lấy màu gốc từ logo đã cung cấp, xây các sắc độ đậm/nhạt cho chữ, nền, viền, hover và focus.
- Trắng là nền đọc chính; xanh tạo cấu trúc; hồng tạo điểm nhấn. Hồng nhận diện không mặc nhiên có nghĩa lỗi hoặc SOS.
- Giữ màu ngữ nghĩa cho lỗi/quá hạn, cảnh báo, đạt, thiếu dữ liệu; luôn kèm chữ hoặc ký hiệu.
- Badge cùng chiều cao, padding, cỡ chữ, mức đậm. Không trộn badge nền đặc, pill quá lớn và chữ rời cho cùng một nhóm trạng thái.
- Phân biệt rõ: kết quả học tập, tình trạng lịch thi, tiến độ xử lý, và mức SOS.
- Chữ phụ W1/W2, hạn, tên GV phải đọc được; không dùng chữ quá nhỏ để ép bảng vừa màn hình.
- Nếu giữ dark mode, thiết kế token tương ứng; không dùng việc đổi màu làm lý do khiến bản sáng/sẫm khác cấu trúc.

### 5.3. Tương tác

- Tên đối tượng mở hồ sơ; số liệu báo cáo mở bảng giải thích; nút động từ mở việc. Hình thức phải giúp đoán được hành vi.
- Nút nên là “Ghi kết quả PA”, “Chốt ngày”, “Nhập điểm” thay vì “Mở” ở mọi nơi.
- Panel việc có bối cảnh ngắn, form, lịch sử gập và trạng thái lưu rõ. Panel báo cáo có định nghĩa chỉ số, phạm vi và bảng dữ liệu.
- Giữ bộ lọc, vị trí cuộn và hàng đang xem khi đóng panel/quay lại.
- “Lưu” ở lại để kiểm tra; “Lưu và tiếp” mới chuyển. Có thể đề xuất chế độ nhập liên tục cho chấm điểm nhưng không chuyển khi dữ liệu chưa lưu hoặc đang lỗi.
- Tự lưu phải có trạng thái đang lưu/đã lưu/lỗi, tránh một nút Lưu và cơ chế tự lưu cùng nghĩa nhưng hoạt động khác nhau.
- Không dùng Hoàn tác để đi vòng quy trình thu hồi/duyệt bắt buộc. Nêu rõ phạm vi hoàn tác của từng hành động.

## 6. Tổng quan theo vai — đề xuất cụ thể

### 6.1. Bố cục khuyến nghị

Đầu trang gọn: tên trang, phạm vi, kỳ xem nếu cần. Tiếp theo 3–4 chỉ số thực sự quan trọng. Bên dưới tối đa 2–3 khối chính trong trạng thái mặc định. Không coi số lượng này là luật cứng nếu vai cần ít hơn.

Tổng quan trả lời: “Tình hình thuộc phạm vi của tôi ra sao? Chỗ nào cần chú ý? Tôi nên đi đâu để xem tiếp?”. Trang Công việc trả lời: “Tôi cần làm gì và làm ngay ở đâu?”.

### 6.2. Quản lý

- Chỉ số đầu: tỷ lệ HV đạt MT, tỷ lệ Case đã có PA, số đề xuất chờ duyệt, số HV sẽ thi tuần này. Chỉ chọn các chỉ số phù hợp dữ liệu thực tế.
- Bảng duyệt gọn: loại đề xuất, đối tượng, người gửi, thời gian chờ. Xem chi tiết trong panel; giữ đủ bối cảnh trước khi quyết định.
- Bảng lớp cần chú ý: tách FT/lớp thường; tên lớp, tỷ lệ đạt, SOS, Case chưa có PA, số em thi tuần này. Không nhồi tất cả chỉ số của hồ sơ lớp vào đây.
- Bảng GV cần chú ý: GV, việc quá hạn, Case chưa có PA, kết quả học thuật đáng xem. Cho lọc Hành chính/Học thuật nếu bảng quá rộng.
- Chỉ nổi bật vấn đề thực sự; không dựng thêm cảnh báo chấm bài khắp màn hình khi chấm bài vốn đều.

### 6.3. Quản trị

Tổng hợp theo chi nhánh, chỉ ra nơi cần xem sâu. Dùng tỷ lệ có mẫu số và số lượng vấn đề. Khi chọn chi nhánh mới chuyển về mức chi tiết quản lý. Không mở mặc định danh sách mọi lớp và mọi GV toàn hệ thống.

### 6.4. Giáo viên

- Tiến độ công việc cá nhân, bài chấm đến hạn, Case đang cần xử lý, xu hướng kết quả HV của kỹ năng mình phụ trách.
- Tách “kỹ năng tôi dạy” và “lớp tôi chủ nhiệm” khi người dùng kiêm vai; không cộng trùng thành một số nghĩa vụ.
- Khối lớp/HV cần chú ý ngắn; dẫn tới đúng bộ lọc và đúng việc.
- Speaking chấm chéo là nguồn bài có thể chấm, không phải toàn bộ nợ cá nhân của mọi GV Speaking.

### 6.5. TVV

- Tỷ lệ hoàn tất báo PH trong kỳ; số trường hợp chưa liên hệ được; số HV thi tuần này; số HV đang chờ kết quả/bước tiếp.
- Thay bảng “HV của tôi” dàn trải bằng các nhóm cần chú ý có ý nghĩa và đường dẫn đến danh sách đúng lọc.
- Công việc chi tiết nằm ở trang Công việc riêng, không đặt form báo PH lớn ngay Tổng quan.

### 6.6. Admin, CX, Head tutor

- Admin: độ đầy đủ lịch Test và phân công trong kỳ, thiếu sót vận hành, các việc thuộc quyền.
- CX: trường hợp học viên cần theo dõi/phối hợp thuộc phạm vi; không dựng thêm trách nhiệm chưa có trong hệ thống.
- Head tutor: buổi/tutor cần chú ý, mức đầy đủ feedback và các việc quản lý tutor.
- Nếu một vai không có việc, không dành cả khối chỉ để viết “Không có việc của bạn”.
- Claude phải xác minh vai thực tế trong code; các nội dung trên là hướng thiết kế, không phải cấp quyền mới.

## 7. Công việc và số liệu theo người phụ trách

- Có một nguồn nhiệm vụ dùng chung cho Công việc, thanh việc trong hồ sơ, bộ lọc Cần làm và nhắc việc.
- Phạm vi cá nhân dựa trên phân công/quyền thực tế; không lấy toàn bộ bài của lớp rồi hiển thị như nợ của GV.
- Một HV có Case R và W do cùng GV phụ trách: hiển thị hai việc riêng, có nhãn kỹ năng và trạng thái/hạn riêng.
- Có thể gom theo HV/lớp để dễ đọc nhưng phải phân biệt “3 nhóm”, “7 việc”, “12 bài”.
- Badge menu Công việc nên đếm việc đang cần xử lý của người xem; đề xuất này cần ghi rõ đơn vị và phạm vi. Không ép bằng số bài chấm.
- Số thông báo chưa đọc và số việc cần làm là hai ý nghĩa khác nhau. Nếu chuông dùng số việc, phần thông báo chưa đọc dùng dấu hiệu riêng và giải thích rõ.
- QL xem người khác là chế độ theo dõi; chỉ hiện Làm thay nếu có quyền. Một nhiệm vụ không được nhân bản thành hai việc chỉ vì xuất hiện ở hai màn.
- Số việc không đổi chỉ vì thu gọn nhóm hoặc phân trang.

## 8. Test và lịch tuần

### 8.1. Chấm Test

Giữ hướng danh sách + khu chấm tại chỗ nếu hiệu quả, nhưng tổ chức theo thứ tự đã chốt:

1. **Quá hạn:** việc/bài của chính GV, quá hạn lâu nhất trước.
2. **Hạn tuần này:** chỉ phần thuộc trách nhiệm GV.
3. **Bài thi Speaking tuần này:** mở sẵn, cho mọi GV có kỹ năng S trong phạm vi chi nhánh được phép, kể cả không dạy lớp S.
4. **Hạn tuần sau:** mặc định thu gọn, ghi rõ số bài/nhóm bên ngoài.

Nhãn Speaking dựa trên tuần thi, không đánh đồng với tuần hết hạn chấm. Một bài xuất hiện qua nhiều lối xem vẫn là một bản ghi; không tính trùng ở số tổng. Bài chấm chéo chưa được nhận/chấm không trở thành nợ cá nhân của tất cả GV Speaking.

Chỉ hiện cột/ô GV có thể xử lý; bối cảnh điểm khác chỉ bổ sung khi giúp nhận xét. Giữ lối xem bài đã chấm để sửa theo quyền. Chưa đủ nhận xét bắt buộc không được coi là hoàn tất chỉ vì đã có số điểm.

### 8.2. Lịch tuần

- Một tuần đang xem, chuyển tuần đơn giản; bỏ ba khung lịch kiểu cũ.
- Dòng lịch gọn: lớp, lượt Test, kỹ năng/người phụ trách phù hợp, tuần/ngày nếu có, tiến độ điểm.
- Vẫn mở khu chấm ngay trên lịch theo quyền; không bắt đổi sang trang khác chỉ để nhập một ô.
- QL/Admin xem thêm tình trạng chấm trong cùng lịch; chưa tới hạn thì trung tính, quá hạn còn thiếu điểm mới đỏ.
- Bỏ menu/tab Tình trạng chấm riêng. Giữ Kế hoạch Test để người có quyền chủ động lập lịch.
- Lịch sử tuần cũ vẫn xem/sửa theo quyền; “chỉ hiện theo tuần” không có nghĩa chỉ được xem tuần hiện tại.

### 8.3. MT mặc định và chuỗi dời

- Mặc định 3 MT. Khi đủ 3, trạng thái hợp lý là hoàn tất kế hoạch mặc định, không hiện “thiếu MT4”.
- QL thêm MT4+ thủ công trong Kế hoạch Test nếu cần; không ảnh hưởng lịch sử đã có.
- Phân biệt lượt MT bổ sung và lần dời của cùng MT. Dời MT3 không tự trở thành MT4.
- Kiểm tra chuỗi dấu `-` xuyên các tuần và màn nhập khác nhau; lần thứ hai trong cùng chuỗi phải được nhận ra.
- Giữ luồng duyệt của MT hiện tại; không thực hiện dời/hủy tức thì chỉ vì mockup vẽ như vậy.

## 9. Công việc TVV và Sau thi

### 9.1. Báo PH

Form mặc định chỉ gồm:

1. **Đã báo PH / Chưa liên hệ được**.
2. **Ngày**, mặc định ngày nhập.
3. **Ghi chú kết quả**.

Phía trên có bối cảnh đọc được: HV, lớp, lần xử lý, nội dung GVCN, hạn và thông tin liên hệ cần thiết. Không nhập lại dữ liệu GVCN. Bỏ lựa chọn Cách liên hệ, PH phản hồi, Đồng ý phối hợp... dưới dạng các trường riêng bắt buộc.

Đề xuất: ghi nhận “Chưa liên hệ được” là một lần thử, giữ việc mở và giữ hạn; lần sau tiếp tục trong cùng việc. Không tự coi một lần không liên hệ được là đã xong. Nếu hệ thống có kết thúc ngoại lệ, giữ trong thao tác phụ theo đúng nghiệp vụ, không thêm một dãy lựa chọn vào form chính. Lịch sử các lần ghi giữ được ngày, người nhập và nội dung.

### 9.2. Sau thi: một tuyến, cho lưu từng phần

- Lịch thi: chốt/sửa ngày thi và các thông tin trước thi.
- Sau thi: **Kết quả thi thật → Bước tiếp/lộ trình tiếp theo** trong cùng không gian xử lý.
- Có thể nhập và lưu điểm ngay; không bắt chọn lộ trình/tạm dừng/kết thúc học để lưu điểm.
- Sau khi lưu riêng điểm, hiển thị “Đã có kết quả · Chưa chốt bước tiếp”; phần tiếp còn mở và có hạn nếu nghiệp vụ quy định.
- Gộp giao diện không được làm mất hai trạng thái nghiệp vụ hoặc hạn riêng của bước tiếp.
- Giữ một người phụ trách rõ ràng; gán lại TVV không được vô tình reset hạn.
- Chỉnh sửa kết quả đã lưu có lịch sử; không tự tạo thêm một tuyến Sau thi trùng lặp.

## 10. Hồ sơ lớp

- Đầu trang chỉ thông tin thiết yếu: tên lớp, chương trình, GVCN, số HV và bối cảnh khóa học thật sự cần.
- Các tab/cách xem có mục đích rõ, tránh quá nhiều tầng trước khi tới bảng chính.
- Bảng điểm tách W1 và W2. Có thể giữ W tổng hợp nếu cần tính Overall nhưng không dùng nó thay hai cột thành phần.
- Cột Ngày thi thể hiện đúng ngày hoặc trạng thái chưa chốt. Không hiển thị một tháng dự kiến như một ngày thi đã xác nhận.
- Cột Việc ưu tiên nhiệm vụ của GV đang xem; nhiều kỹ năng có việc thì nhiều dòng, không giấu việc thứ hai trong dấu ba chấm.
- Bấm từng việc mở panel ngay tại hồ sơ lớp, đúng HV và kỹ năng; đóng panel vẫn ở đúng hàng.
- **Đánh giá kết quả đầu ra phải làm được ngay tại đây.** Đề xuất danh sách đánh giá liên tiếp: bối cảnh điểm trước/sau, nhận xét, bước tiếp, Lưu/Lưu và em tiếp. Không biến “Kết quả lớp trước” thành tên thay thế nếu đó thực chất là tác vụ đánh giá đầu ra.
- Lưới nhập Test có thể thu gọn để tránh chiếm cả trang; mở đúng lượt cần xử lý, không cuộn bất ngờ khi vừa vào hồ sơ.

### Ý thức & Phối hợp

Thiết kế lại thứ bậc hình ảnh, dùng màu có chủ đích. Trong một hàng/thẻ phải phân biệt được:

- Học viên và việc hiện cần làm.
- Vi phạm đang chờ xử lý so với lịch sử đã xử lý.
- Bậc xử lý hiện tại và trạng thái duyệt/thu hồi.
- Tình trạng TVV báo PH.
- Phối hợp SOS là một nhóm riêng về học thuật, không trình bày như thêm một vi phạm.

Đề xuất dùng nền nhạt cho nhóm thông tin, badge bậc xử lý, nhãn trạng thái báo PH và một CTA rõ. Chi tiết/lịch sử mở dưới hàng hoặc trong panel; không dàn toàn bộ nhật ký mặc định. Quá hạn phải thấy ngay nhưng không tô đỏ cả bảng.

## 11. Hồ sơ HV và hành trình học tập

- Đầu hồ sơ gọn: danh tính, lớp hiện tại, Target, ngày thi/trạng thái lịch, thông tin liên hệ theo quyền.
- Thanh **Việc cần làm** đặt ngay trước các bảng; liệt kê đủ việc theo kỹ năng và cho làm tại chỗ.
- Không lặp cùng một việc ở nhiều khối trên cùng trang.
- Hành trình cho xem riêng Listening, Reading, Writing, Speaking; Writing truy được W1/W2.
- Mỗi kỹ năng có điểm theo thời gian, mốc kỳ vọng/Target phù hợp và diễn biến tiến bộ. Khi kỳ vọng đổi, hiển thị mốc đổi, không dùng Target hiện tại tô lại toàn bộ lịch sử.
- Cho GV tự ghi nhận xét tiến bộ hoặc bài kiểm tra trên lớp, hoàn toàn tùy chọn.
- Ghi rõ loại dữ liệu: MT chính thức, thi thật, bài kiểm tra trên lớp, nhận xét định tính. Không đưa bài trên lớp vào chỉ số MT/thi thật mặc định.
- Không ép quy đổi điểm /10, /20, /40 thành band nếu chưa có quy tắc hợp lệ. Có thể hiển thị theo từng chuỗi/thang điểm riêng.
- Khoảng trống dữ liệu khác với không tiến bộ. “Tuần này chưa ghi nhận” không tự trở thành cảnh báo.
- Đề xuất có biểu đồ kỹ năng + bảng mốc bên dưới, hoặc tab kỹ năng với timeline; tránh radar làm hình thức chính vì khó đọc diễn biến theo thời gian.

## 12. HV & Lớp

- Hàng nhóm lớp chỉ giữ tên lớp, số HV, người phụ trách nếu cần, các số SOS có viền; bỏ chuỗi metadata dài.
- SOS chỉ số + viền trên hàng lớp phải có chú giải/nhãn truy cập để hiểu thứ tự 1/2/3, không chỉ phân biệt bằng màu.
- Cột W có điểm tổng hợp nổi bật; dòng phụ “W1 … · W2 …” cân đối và đọc được ở desktop/mobile.
- Khi bật Cần làm, tăng chiều cao đúng các hàng nhiều việc; mỗi việc có kỹ năng, hạn và hành động riêng.
- Nhóm theo HV giúp tránh lặp thông tin, nhưng bộ đếm phải nói rõ số HV và số việc.
- Giữ việc cấp lớp ở hàng lớp thay vì gán giả cho một HV.
- Lịch thi nên hiển thị ngày đã chốt, tháng/tuần dự kiến và chưa có lịch bằng trạng thái rõ. Không dùng ô ghi chú trống để tự suy ra trạng thái nghiệp vụ “Chưa kết luận”.
- Xuất dữ liệu: phạm vi theo bộ lọc, thấy số HV được chọn, không đổi tập dữ liệu âm thầm khi phân trang/tìm kiếm.

## 13. Hồ sơ GV — đề xuất thiết kế mới

Bỏ bảng hiện tại không đáp ứng nhu cầu. Đầu hồ sơ chỉ tên, chi nhánh, kỹ năng, vai trò và lớp phụ trách. Bộ lọc kỳ dùng chung cho cả hai phần.

### 13.1. Hành chính

Chọn các chỉ số có dữ liệu thật:

- Tỷ lệ công việc hoàn thành đúng hạn.
- Tỷ lệ cập nhật điểm đầy đủ đúng hạn theo phân công.
- Việc/bài còn quá hạn hiện tại.
- Thời gian phản hồi vấn đề HV nếu hệ thống có mốc phản hồi đáng tin cậy.

Bên dưới: xu hướng theo kỳ, phân bố theo loại việc, danh sách việc trễ để giải thích số. Không lấy bài Speaking chấm chéo chưa giao làm nợ cá nhân.

### 13.2. Giảng dạy – Học thuật

- Tỷ lệ đạt test định kỳ và số lượng đạt/chưa đạt/chưa đủ dữ liệu.
- Diễn biến điểm theo kỹ năng, theo lớp và qua các MT.
- Tỷ lệ HV có tiến bộ, kèm định nghĩa và tập HV có hai mốc so sánh hợp lệ.
- Case/PA: tỷ lệ có PA, tỷ lệ PA đã có kết quả, kết quả cải thiện.
- Tỷ lệ đạt mục tiêu đầu ra qua thi thật, kèm số HV đã có kết quả.
- Danh sách HV cần xem sâu và các yếu tố liên quan tới thời gian GV phụ trách.

Không thể hiện “GV gây ra kết quả này” chỉ từ tương quan điểm. Khi đổi GV giữa kỳ, cần quy tắc gắn dữ liệu theo thời gian phân công; tránh đổ toàn bộ kết quả lịch sử cho GV hiện tại.

### 13.3. Hai hướng mockup để so sánh

- **A — Hai tab Hành chính/Học thuật:** mỗi tab có 3–4 chỉ số, một xu hướng chính và bảng chi tiết. Ưu điểm gọn, phù hợp màn nhỏ.
- **B — Hai khu trên cùng trang:** xem nhanh được cả hai nhóm, mỗi khu có mở rộng chi tiết. Ưu điểm đối chiếu nhanh nhưng cần kiểm soát chiều dài.

Khuyến nghị A nếu dữ liệu nhiều; không để người dùng phải đổi tab chỉ để biết GV còn vấn đề hành chính nào đang mở — có thể dùng một dòng tóm tắt chung ở đầu.

## 14. Phân tích và báo cáo

### 14.1. Báo cáo học viên

Tập trung kết quả và hỗ trợ: tỷ lệ đạt, tiến bộ theo kỹ năng, SOS, Case chưa có PA, PA có kết quả/cải thiện, thi thật và mục tiêu đầu ra. Chấm đúng hạn là thông tin phụ, không chiếm phần lớn báo cáo.

### 14.2. Báo cáo giáo viên

Tập trung công việc và kết quả học viên thuộc phạm vi GV. Hai nhóm Hành chính/Học thuật được tổng hợp trong cùng một bảng phân tích GV, không tạo hai bảng độc lập buộc đối chiếu thủ công.

Đề xuất cột mặc định:

| Nhận diện | Hành chính | Học thuật |
|---|---|---|
| GV, kỹ năng, phạm vi lớp | % việc đúng hạn; % cập nhật điểm đúng hạn; việc quá hạn | % đạt test; % tiến bộ; % đạt Target thi thật; số HV cần chú ý |

Nếu quá rộng, cho chọn cột hoặc bộ cột gọn/đầy đủ; vẫn cùng một bảng và một định nghĩa. Mỗi tỷ lệ có mẫu số qua dòng phụ hoặc chi tiết. Hồ sơ GV là nơi xem sâu, không cố đưa toàn bộ hồ sơ lên bảng tổng hợp.

### 14.3. Panel báo cáo chỉ để đọc và giải thích

- Tiêu đề khớp chỉ số vừa bấm.
- Hiện chi nhánh, chương trình, kỳ, kỹ năng và cách tính.
- Bảng có đúng HV/GV/bài/PA tạo nên con số; số điểm, trạng thái, mốc thời gian liên quan.
- Khi bấm 75% = 15/20, panel giải thích 15 đạt trong 20 đủ điều kiện, không chỉ liệt kê 15 tên mà không có mẫu số.
- Có thể tìm, lọc, xem hồ sơ để tra cứu hoặc xuất theo quyền; không có form Thêm PA, Tạo Case, Ghi kết quả, Duyệt hay Làm thay.
- Dữ liệu lịch sử trong kỳ không bị thay bằng trạng thái hôm nay mà không ghi rõ.
- Số dòng trang hiện tại có thể nhỏ hơn tổng do phân trang; tổng panel phải khớp tập dữ liệu gốc.
- Bấm một số phải mở đúng tập đó, không mở một danh sách chung rồi bắt tự lọc lại.

## 15. Quy ước số liệu và công thức đề xuất

Đây là đề xuất cần Claude kiểm tra với dữ liệu hiện hành; không phải cơ chế tính điểm KPI.

| Chỉ số | Công thức/định nghĩa đề xuất | Điều cần thể hiện |
|---|---|---|
| Hoàn thành công việc | Số việc đã hoàn tất / tổng việc hợp lệ trong cùng phạm vi | Không trộn việc/bài/HV; nêu kỳ và trạng thái loại trừ |
| Công việc đúng hạn | Việc hoàn tất trước/đúng hạn / việc có hạn thuộc kỳ đang xét | Nên xét tập có hạn trong kỳ để không bỏ qua việc chưa làm đã trễ |
| Cập nhật điểm đúng hạn | Bài/ô đã đủ dữ liệu bắt buộc trước hạn / bài/ô đến hạn thuộc trách nhiệm | Chốt rõ đơn vị bài hay ô; không tính ô của người khác |
| Đạt test | HV/lượt đạt / HV/lượt đủ dữ liệu đánh giá trong kỳ | Nếu cùng HV có nhiều lượt, ghi rõ đang đếm lượt hay HV |
| Đạt đầu ra thi thật | HV đạt Overall Target / HV có kết quả thi thật hợp lệ trong phạm vi | Hiện riêng số chưa có KQ; không tự tính chưa có KQ là trượt |
| Tiến bộ | HV tăng điểm theo định nghĩa / HV có hai mốc so sánh hợp lệ | Hai mốc, thang điểm và kỹ năng phải so sánh được |
| Case có PA | Case đã có PA hợp lệ / Case cần PA trong cùng tập | Không dùng số HV làm mẫu số cho số Case |
| PA có cải thiện | PA có kết quả cải thiện / PA đã có kết quả đánh giá | PA chưa đánh giá hiển thị riêng |

Quy tắc chung:

- Tỷ lệ luôn có tử số/mẫu số khi mở chi tiết; mẫu số 0 hiển thị “Chưa có dữ liệu”.
- Hiển thị phần trăm làm chính ở nơi phù hợp, số tuyệt đối để biết quy mô và hành động.
- Tổng hệ thống = tổng tử số / tổng mẫu số, không lấy trung bình đơn giản các phần trăm chi nhánh.
- Phân biệt kỳ báo cáo với ảnh chụp trạng thái hiện tại. Các nhãn “trong kỳ”, “hiện tại”, “đến ngày…” phải đúng.
- Không dùng cùng màu/biểu tượng cho “thiếu dữ liệu” và “chưa đạt”.
- “Cải thiện” từ nhận xét GV và “tăng điểm” từ bài test là hai chỉ số khác nhau.
- Khi có dữ liệu ít, hiển thị quy mô; không tự đặt ngưỡng KPI xanh/vàng/đỏ từ ảnh tham chiếu.

### Quy tắc Overall khi xem kết quả GV

1. MT: xét kỳ vọng Overall của chính lượt MT. Thi thật: xét Overall so với Target đầu ra áp dụng cho lần thi.
2. Nếu Overall đạt, không tính kỹ năng thấp hơn kỳ vọng là tạch trong đánh giá GV.
3. Nếu Overall chưa đạt, mới xét kỹ năng dưới kỳ vọng trong nhóm chưa đạt của GV phụ trách.
4. Nếu Overall chưa đủ dữ liệu, giữ trạng thái riêng; không suy ra đạt hoặc tạch.
5. Điểm kỹ năng thực tế vẫn hiển thị, không sửa số điểm để làm đẹp tỷ lệ.
6. Đây là quy tắc báo cáo/đánh giá GV đã chốt. Không tự suy ra phải xóa Case/SOS hoặc dừng hỗ trợ học thuật của HV; thay đổi máy nghiệp vụ SOS nếu cần phải có xác nhận riêng.

## 16. Tutor, bảng mẫu và các trang còn lại

- Tutor áp dụng cùng nhận diện, tỷ lệ kèm mẫu số, phân biệt không có buổi và kết quả thấp.
- Kết luận tutor là nhận xét quản lý; không biến thành điểm KPI do thấy ảnh KPI GV.
- Giữ thao tác nhận xét gọn, bảo vệ bản nháp, không tự chuyển tutor khi chưa lưu.
- Bảng mẫu phải cập nhật theo hệ màu, badge, W1/W2, panel và số liệu mới; không cho sân mẫu cũ thắng yêu cầu mới chỉ vì đã dựng trước.
- Rà soát cả tìm kiếm, bộ lọc tuần, kế hoạch Test, hộp duyệt, thông báo, biểu mẫu thêm/sửa, trang rỗng/lỗi, in/xuất và mobile. Tránh chỉ đổi giao diện 8 màn được cung cấp.

## 17. Các điểm cần xác minh trong code, không chặn brainstorm

Claude tự kiểm tra và ghi kết quả, chỉ hỏi chủ sản phẩm khi thực sự chưa có căn cứ nghiệp vụ:

1. Quyền nhập điểm hộ của QL/Admin/QT; quyền xem hồ sơ GV, dữ liệu chi nhánh và sửa lịch.
2. Quy ước chính xác của 5 ngày lịch, múi giờ, tính ngày đầu và ngày quá hạn.
3. Hạn bước tiếp sau thi: lấy ngày có kết quả hay ngày nhập; giữ đúng luật hiện hành, không reset khi sửa.
4. Định nghĩa đạt, kỳ vọng, KCK, dữ liệu chưa đủ và công thức W/Overall hiện hành.
5. Gán kết quả học thuật cho GV khi đổi phân công; nhận diện người chấm S khác người dạy S.
6. Trạng thái kết thúc ngoại lệ của việc báo PH; thu hồi xử lý khi TVV đã ghi kết quả.
7. Phạm vi mặc định của báo cáo và quy tắc loại việc hủy/thu hồi khỏi mẫu số.

Không yêu cầu người dùng trả lời lại 5 điểm đã xác nhận tại mục 3. Có thể dựng mockup với giả định được ghi rõ trong khi xác minh, nhưng không đưa giả định thành thay đổi backend âm thầm.

## 18. Tình huống bắt buộc phải có trong mockup và nghiệm thu

| Mã | Tình huống | Kết quả cần thấy |
|---|---|---|
| T01 | GV dạy R và W, một HV có Case ở cả hai | Hai việc riêng, mở đúng kỹ năng; không mất việc hoặc nhân bản HV vô nghĩa |
| T02 | GV chỉ dạy một kỹ năng trong lớp | Số bài/nợ cá nhân không chứa bài của GV khác |
| T03 | GV có kỹ năng S nhưng không dạy lớp S | Thấy bài Speaking tuần này trong chi nhánh được phép; không bị gán toàn bộ là nợ |
| T04 | HV đã hoàn tất MT1–MT3 | Không tự tạo gợi ý/việc MT4; QL vẫn thêm thủ công được |
| T05 | MT đã dời, nhập dấu - lần hai ở tuần khác | Nhận đúng chuỗi, xử lý hủy/duyệt theo luật, không dời vô hạn |
| T06 | Overall MT đạt nhưng R dưới kỳ vọng | Không tính R tạch trong báo cáo GV; vẫn hiển thị điểm R thật |
| T07 | Overall chưa đạt và R thấp | Có thể tính R chưa đạt theo tập đủ điều kiện và phân công đúng |
| T08 | Chưa đủ điểm Overall | Hiển thị chưa đủ dữ liệu, không gán đạt/trượt |
| T09 | TVV chỉ nhập điểm thi thật, chưa chọn bước tiếp | Lưu điểm thành công; bước tiếp vẫn chưa hoàn tất |
| T10 | TVV chưa liên hệ được PH | Ghi được ngày/nội dung, giữ lịch sử và không tự đóng việc trái nghiệp vụ |
| T11 | Báo cáo 75% = 15/20 | Panel chỉ đọc giải thích đúng 20 trường hợp, không có form xử lý |
| T12 | Đánh giá đầu ra nhiều HV trong hồ sơ lớp | Làm trong panel, không phải mở từng hồ sơ HV |
| T13 | W tổng hợp tại HV & Lớp | Có W1/W2 bên dưới; hồ sơ lớp tách rõ hai điểm |
| T14 | Hạn tuần sau, chưa quá hạn | Gập mặc định ở Chấm Test; lịch tuần không cảnh báo đỏ như đã trễ |
| T15 | Hai người cùng sửa/lưu hoặc mạng lỗi | Không mất bản nháp, không báo thành công giả, có cách tải lại/xử lý xung đột |
| T16 | Chuyển panel khi đang nhập | Không tự bỏ chữ; hỏi hoặc giữ bản nháp theo hành vi đã thống nhất |
| T17 | Bộ lọc/nhóm/phân trang thay đổi | Tổng và panel vẫn cùng phạm vi; không nhầm số dòng đang thấy với tổng |
| T18 | GV ghi điểm bài trên lớp thang /10 | Không tự trộn vào band MT hoặc KPI; ghi nhận tuần là tùy chọn |
| T19 | Không có dữ liệu/mẫu số 0 | Không hiển thị 0% như thất bại |
| T20 | Tổng hợp nhiều chi nhánh có quy mô khác nhau | Tỷ lệ tổng có trọng số theo mẫu số, không trung bình phần trăm |
| T21 | Mobile mở bàn phím trong panel | Nút lưu và ô đang nhập truy cập được, không bị thanh dưới che |
| T22 | Thu hồi/chỉnh sửa một xử lý đã duyệt | Lịch sử và bước duyệt bắt buộc được giữ; Hoàn tác không vượt quyền |

## 19. Đầu ra Claude cần thực hiện

### Giai đoạn A — Rà soát và quyết định thiết kế

- Kiểm tra toàn bộ route/thành phần hiện tại; ghi màn nào giữ, sửa, gộp, bỏ.
- Ma trận vai × trang × thông tin × hành động để tránh thừa dữ liệu và sai quyền.
- Bảng mâu thuẫn V4 → quyết định mới → màn bị ảnh hưởng.
- Brainstorm ít nhất hai hướng bố cục cho Tổng quan và hồ sơ GV; chọn hướng khuyến nghị, không chỉ thay màu giữa hai phương án.
- Từ điển chỉ số: tên, đơn vị, tử số, mẫu số, kỳ, phạm vi vai, trường hợp thiếu dữ liệu, nội dung panel.

### Giai đoạn B — Mockup có thể review

Dựng đủ phạm vi:

1. Hệ màu PISA + bảng mẫu/badge/panel dùng chung.
2. Tổng quan từng vai thực tế, đặc biệt QL/QT, GV và TVV.
3. Hồ sơ GV chi tiết và bảng Phân tích GV hai nhóm thông tin.
4. Báo cáo HV/GV với panel dữ liệu chỉ đọc.
5. Công việc TVV, form báo PH đơn giản và tuyến Sau thi lưu từng phần.
6. Chấm Test bốn nhóm; Lịch tuần tích hợp tình trạng điểm.
7. Hồ sơ lớp, đánh giá đầu ra tại chỗ, Ý thức & Phối hợp có phân cấp màu.
8. Hồ sơ HV, thanh việc và hành trình từng kỹ năng.
9. HV & Lớp với hàng lớp gọn, W1/W2 và nhiều việc trên một HV.
10. Các trạng thái tải/rỗng/lỗi/đang lưu/đã lưu/chỉ xem, desktop và mobile.

Dùng dữ liệu giả nhất quán giữa các màn: cùng người, lớp, lượt MT, hạn và số tổng. Không lấy tên một người nhưng đổi vai/kỹ năng/lớp vô cớ giữa mockup. Ghi rõ dữ liệu demo, không trình bày như số liệu thực tế.

Các tương tác chính phải minh họa được: lọc, mở/đóng panel, xem hai việc một HV, lưu riêng điểm, chuyển tuần và xem chi tiết tỷ lệ. Nếu chỉ là khung tĩnh, ghi rõ giới hạn; không dùng ảnh tĩnh làm bằng chứng workflow đã hoạt động.

### Giai đoạn C — Kế hoạch triển khai và kiểm tra

- Tách phần nền dùng chung, số liệu/quyền, từng module và các phụ thuộc.
- Liệt kê dữ liệu cần bổ sung nếu có, tránh thay schema chỉ vì đổi giao diện.
- Kiểm tra ở 1440, 1280 và 375–390 px, thêm kích thước trung gian; dùng cùng hệ responsive thay vì chỉ dựng hai bức desktop/mobile rời nhau.
- Kiểm tra thao tác bàn phím, focus, nội dung dài, nhiều việc, dữ liệu rỗng và lỗi lưu.
- Đo số bước theo kịch bản thực tế, tách việc điều hướng khỏi nhập dữ liệu; không hứa “chấm cả lớp 1 bấm” chỉ vì mở được lưới trong 1 bấm.
- Cập nhật truy vết, loại tiêu chí cũ đã bị thay thế. Không triển khai/publish thay đổi thật chỉ từ tài liệu góp ý này khi chưa có yêu cầu triển khai.

## 20. Tiêu chí đánh giá cuối cùng

Bản mới phải giúp người dùng:

- Vào Tổng quan là hiểu nhanh tình hình thuộc vai của mình.
- Vào Công việc là thấy đúng việc, đúng kỹ năng và đúng số lượng cá nhân.
- Xử lý việc của HV ngay tại hồ sơ lớp khi phù hợp.
- Xem báo cáo là hiểu số liệu, không bị đưa vào một form làm việc.
- Xem GV là phân biệt được chất lượng hành chính và kết quả học thuật.
- Nhận ra website thuộc PISA qua hệ xanh–hồng–trắng nhất quán, rõ ràng và có điểm nhấn.

**Hãy chủ động đề xuất thêm ý tưởng ngoài tài liệu này nếu chúng cải thiện rõ trải nghiệm. Đừng giữ một bố cục kém chỉ vì V4 đã vẽ nó. Nhưng mọi cải tiến phải đi cùng cách dùng cụ thể, dữ liệu đúng nghĩa và nghiệp vụ đã được chốt.**
