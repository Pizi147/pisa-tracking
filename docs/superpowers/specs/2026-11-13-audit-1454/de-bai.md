# PISA Tracking — Prompt rà soát, sửa lỗi và nâng cấp sau PR #1454

Ngày: 11/11/2026. Gửi nguyên tệp này cho Claude. Tài liệu thay thế danh sách việc đang mở trong prompt #1228; không triển khai lại những lỗi đã sửa.

## 1. Yêu cầu dành cho Claude

Hãy xác minh các phát hiện dưới đây trên HEAD đang làm, sửa lỗi có bằng chứng, rồi đề xuất nâng cấp UI/workflow có tác dụng thực tế. Đọc CLAUDE.md, plan.md, PRODUCT.md, DESIGN.md và quyết định mới nhất trước khi sửa. Không tự merge, deploy hoặc thử ghi trên dữ liệu production.

Đầu ra phải có bảng ID → còn lỗi/đã sửa/không tái hiện/chờ quyết định, commit liên quan, bằng chứng kiểm thử và giới hạn còn lại. Không chỉ trả một danh sách gợi ý. Không viết lại hệ thống hoặc thay giao diện toàn diện khi một sửa nhỏ giải quyết được vấn đề.

## 2. Mốc và độ tin cậy

- Repository: https://github.com/Pizi147/pisa-tracking
- PR: https://github.com/Pizi147/pisa-tracking/pull/1454 — đã merge.
- Merge commit trực tiếp rà: `730f9319b9d986e52e8bbd7bfeb3ce6cabe5f670`.
- HEAD nhánh PR: `1a2968bf96a78c4f9cabf6fe8956ef1d66b34ac9`.
- Mốc đối chiếu trước: #1228, `f75170589d3b02c1ba7476af62d74a1ca4830bcb`.
- Phương pháp: đối chiếu GitHub, lịch sử thay đổi, đọc code frontend/backend, kiểm tra các lỗi cũ, xem ảnh mobile đã commit của nháp PA và chạy bộ check/build độc lập.
- Chưa xác minh phiên bản deploy, dữ liệu thật, thao tác trình duyệt đầu-cuối hoặc toàn bộ quyền ở bản live. Không gọi đây là chứng nhận mọi màn hình đều tốt.
- Một số ghi chú repo ghi “13/11”, trong khi GitHub ghi PR merge ngày 11/11. Giữ thứ tự commit/quyết định làm căn cứ; không tự đổi ngày dữ liệu hay coi ghi chú đó là thời điểm chạy kiểm thử.

Phân loại: **mã xác nhận** = nhánh xử lý thấy trực tiếp; **rủi ro cần tái hiện** = cần chạy tình huống để xác định hậu quả thực tế; **đề xuất** = lựa chọn UX, không phải lỗi đã chứng minh. Các vấn đề mới dưới đây chưa được tái hiện trên production.

## 3. Kết luận và những gì phải giữ

Bản hiện tại đã tiến bộ rõ so với #1228. Ưu tiên mới là bảo vệ chữ đang nhập, làm rõ nháp/chốt và sửa đồng thời. Không tiếp tục coi toàn bộ đợt RKC là chưa làm.

Giữ các quyết định mới:

1. Kết quả PA: **Lưu là chốt; muốn đổi thì Sửa**. #1454 chủ động bỏ Hoàn tác ở form này. Không thêm lại nút Hoàn tác chỉ để đáp ứng prompt cũ.
2. Nháp PA lưu trên máy chủ, chưa tạo kết quả, chưa làm việc thành xong, chưa thay hạn; có nhãn Có nháp.
3. Nháp đang gõ trên trình duyệt vẫn hữu ích để phục hồi chữ chưa gửi. Hai loại nháp cần phối hợp an toàn.
4. Tutor đang hoãn; không mở rộng lưu nháp dòng buổi tutor trong đợt này nếu chưa được giao.
5. Dán Excel chỉ giữ cho thêm học viên; không khôi phục dán Excel điểm/API đã bỏ.
6. Giữ bộ màu, typography, layout đã duyệt; thay bố cục một màn một PR, có đối chiếu 1440/375. Không dùng phần trăm “đẹp/khớp” tự ước lượng để chứng minh đạt.
7. Quyền vẫn kiểm tại server theo capability + scope. Lưu nháp không tạo đường vượt quyền ghi kết quả.

## 4. Đóng hoặc điều chỉnh các mục từ #1228

| Mục cũ | Mã ở #1454 | Quyết định cho prompt mới |
|---|---|---|
| F01 KPI Báo PH lọc hạn gốc | `viecDaXong.ts` đã dùng `COALESCE(v.han_chon,v.han)` trong WHERE; hàm công khai đã đổi sang `viecXongCn` | Đóng lỗi lọc hạn cũ ở mức source; kiểm hồi quy, không dùng script cũ gọi hàm đã bỏ |
| F02 debounce Lưu trữ | `LuuTruPage` dùng ref params mới nhất, đồng bộ query ngoài | Đã sửa nguồn gây lỗi; thử Back/Forward và đổi tab nhanh |
| F03 hoàn tác lô báo sai | Đã đếm thành công, báo n/m, không báo thành công khi 0 | Đã sửa nhánh báo sai; nâng cấp phục hồi phần thất bại là đề xuất riêng |
| F04 mất lựa chọn/lý do lỗi lô | Giữ ID chưa xong, tách lỗi, có ref chống bấm lặp | Không giao sửa lại lỗi cũ; cân nhắc hàng đợi tồn tại lâu hơn toast |
| F05 hủy xác nhận thành lỗi | API có dấu `huy`, caller/toast xử lý hủy | Đã có cơ chế phân biệt; rà caller chưa dùng đúng nếu có bằng chứng |
| F06 mất Undo hồ sơ | Có hoàn tác phần thông tin và nêu phạm vi | Không áp dụng nhận xét này sang form PA vừa chủ động bỏ Undo |
| F07 thiếu tuần chặn liên hệ | Validation đã xét `tuanCu` | Đã sửa điều kiện cũ; kiểm fixture hồ sơ lịch sử |
| F08 tutor sau 24h không sửa | `coSua` không còn điều kiện 24h | Đã sửa; không mở rộng sản phẩm Tutor đang hoãn |
| F09 chi nhánh ghi đè khi Undo | Backend vẫn UPDATE toàn bộ trường theo ID; chưa thấy so phiên bản | Giữ, đổi thành N04 bên dưới |
| PDF tiến độ/tên đợt | Hàm xuất đã có callback tiến độ và `tenTepPdf` có đợt | Đã triển khai; nghiệm thu caller và lỗi, không yêu cầu làm mới |
| Prefetch mọi khu | `App.tsx` vẫn có NAP_SAN gọi sau 1.500 ms | Giữ đề xuất đo có chọn lọc, không kết luận mọi tối ưu khởi động lạnh chưa làm |

“Đã sửa từ mã” không thay thế test UI. Không sử dụng kết quả 5.323/5.325 ở #1201 để đánh giá #1454.

## 5. Các vấn đề mới cần ưu tiên

### N01 — Nháp PA có thể bị ghi đè giữa hai phiên

**Ưu tiên P1 kiểm chứng; mã xác nhận thiếu kiểm tra phiên bản.**

Nguồn: `server/src/cases/cases.ts:luuNhapKetQua` khoảng 4272–4289; `server/src/routes/index.ts` route PUT `/interventions/:id/nhap`.

Endpoint đọc PA, kiểm quyền/trạng thái rồi UPDATE `nhap_ket_qua` theo ID. Body chỉ có outcome/note, không mang revision hoặc bản nháp người dùng đã đọc. Hai phiên cùng quyền (kể cả cùng GV trên hai máy) có thể lần lượt ghi và phiên cũ thay nháp mới mà không biết. Audit giúp truy vết nhưng không ngăn người dùng mất bản đang dùng.

**Ca cần tái hiện:** A và B mở cùng PA ở nháp v1. A lưu v2. B vẫn từ v1, sửa một đoạn rồi lưu v3. Kiểm tra server có phát hiện nguồn B đã cũ hay thay v2 hoàn toàn. Lặp với hai tài khoản đều được phép ghi để tránh nhầm lỗi quyền.

**Yêu cầu sửa:** dùng revision/compare-and-swap tại server; kiểm tra và ghi trong cùng giao dịch, gắn audit nhất quán. Khi xung đột, giữ chữ B và cho xem bản mới/chép phần cần giữ; không tự merge nhận xét học thuật và không hiện “Đã lưu” khi bị từ chối. Chỉ hỏi khi thật sự xung đột, không thêm bước cho save bình thường.

**Nghiệm thu:** hai tab/hai máy, cùng và khác người; nháp bị xóa hoặc kết quả đã chốt; retry sau mất phản hồi; không ghi đôi audit vô lý. Số truy vấn/dòng đọc không tăng trên luồng mở Công việc chỉ vì bổ sung version.

### N02 — Phản hồi lưu nháp có thể xóa chữ mới trong kho cục bộ

**Ưu tiên P1 kiểm chứng; có đường đi cụ thể từ mã.**

Nguồn: `CapNhatTuan.tsx:luuNhap` khoảng 414–420; textarea khoảng 469; `KhungPanel.tsx:useNhap/useXoaNhap` khoảng 82–104.

`luuNhap` chụp outcome/progress gửi lên server, chờ rồi gọi `xoaNhap()` không điều kiện. Khi request đang chạy, `ttNhap='dang'` nhưng textarea chỉ `readOnly={busy}`; `busy` dùng cho chốt. Người dùng vẫn gõ B sau khi gửi A. Hook đã lưu B vào kho cục bộ, nhưng phản hồi A có thể xóa kho đó. State màn hình có thể vẫn chứa B; rủi ro là mất khả năng phục hồi khi đóng/mở lại hoặc tải lại, không phải khẳng định textarea lập tức trống.

**Kiểm tra cô lập đã chạy:** thực thi callback `luuNhap` trích từ mã hiện tại với API/kho lưu giả lập: gửi A, đặt bản cục bộ thành B trước phản hồi, giải phóng phản hồi A → serverDraft=A, localRecoveryDraft=null. Đây là bằng chứng callback xóa vô điều kiện; chưa phải React/E2E.

**Tái hiện UI cần hoàn tất:** mạng chậm 2–3 giây; gõ A → Lưu nháp → gõ tiếp B trước phản hồi → đợi phản hồi → đóng/mở lại hoặc reload. Kỳ vọng B được giữ rõ là chưa lưu; server chứa A. Hiện cần kiểm tra B có biến mất khỏi bản phục hồi không.

**Yêu cầu:** chỉ xóa/đánh dấu sạch đúng snapshot đã gửi nếu không có edit mới; nếu đã gõ tiếp, giữ hoặc ghi lại nháp mới. Trạng thái “Đã lưu nháp” chỉ khi form bằng snapshot đã được server xác nhận. Không khóa nhập toàn form lâu chỉ để né race nếu có thể giữ phiên bản edit nhẹ nhàng.

**Nghiệm thu:** chỉ đổi note, chỉ đổi outcome, đổi cả hai; phản hồi lỗi/thành công; đóng panel lúc đang gửi; refresh; không xóa nháp ở công việc khác. Tránh `xoaNhap` toàn kho làm mất các trường không được lưu lên server.

### N03 — Lưu nháp và chốt kết quả có thể chạy chồng

**Ưu tiên P1 kiểm chứng; UI xác nhận chưa có khóa chung.**

Nguồn: `CapNhatTuan.tsx:424–429`. Nút nháp disabled theo `busy || ttNhap==='dang'`; nút chốt chỉ disabled theo `busy`. Vì vậy lúc nháp đang gửi, vẫn có thể bấm chốt. Backend chốt xóa nháp; endpoint lưu nháp kiểm PA khép nhưng PA tiếp tục chạy với quyết định Giữ nguyên có thể vẫn nhận nháp gửi chậm.

**Tái hiện:** trì hoãn PUT nháp, bấm chốt với decision keep, rồi cho PUT hoàn tất sau chốt. Kiểm tra nháp cũ có xuất hiện lại/chip Có nháp có trở lại cho kỳ tiếp không. Đảo thứ tự hoàn tất và thử trên hai phiên. Không kết luận đã xảy ra race thực tế chỉ từ khả năng bấm nút.

**Yêu cầu:** một trạng thái gửi chung trong cùng form hoặc tuần tự hóa rõ; server ràng buộc nháp vào kỳ/revision kết quả đã đọc, không chỉ ID PA. Nháp của kỳ cũ không được ghi lại sau khi kỳ đó chốt. Chốt và xóa nháp cùng giao dịch; không xóa nháp mới hợp lệ từ phiên khác mà không xử lý xung đột.

**Nghiệm thu:** nháp→chốt nhanh, chốt→nháp từ tab cũ, request retry, PA keep/end/replace; số lần ghi chính thức và hạn đúng. Không khôi phục Undo cho kết quả để giải quyết race.

### N04 — Sửa/hoàn tác chi nhánh còn nguy cơ mất cập nhật của người khác

**P2; tiếp nối F09, xác nhận backend hiện tại.**

`ChiNhanhAdmin.tsx` đã có ref `moi` tránh dùng giá trị cũ giữa các ô của cùng màn. Đây là cải thiện có ích nhưng chỉ ở một phiên. `sysconfig.ts:luuChiNhanh` vẫn nhận và UPDATE tên/địa chỉ/SĐT toàn bộ; Undo gửi `r.truoc`, không so version.

A sửa địa chỉ → B sửa SĐT → A Undo có thể trả SĐT của B về cũ. Cả save từ form cũ cũng cần được bảo vệ.

Sửa bằng cập nhật trường thực sự đổi + revision tại server, transaction cho dữ liệu/audit. Ca nghiệm thu gồm hai quản trị sửa trường khác nhau/cùng trường, Undo sau sửa mới, lỗi audit, retry. Không dùng ref frontend thay kiểm tra đồng thời backend. PDF đọc địa chỉ/SĐT chi nhánh cần phản ánh bản cuối đúng.

## 6. Góp ý UI/workflow

### U01 — Trạng thái nháp/chốt thống nhất, không thêm hộp xác nhận

Giữ một hệ chữ: Chưa lưu → Đang lưu nháp → Đã lưu nháp · chưa chốt → Đã lưu kết quả · Sửa. Có nháp không có nghĩa việc đã xong; hạn/quá hạn giữ theo luật. Ghi người lưu và thời điểm đủ để phân biệt bản mới; có thể dùng giờ ở chi tiết để phân biệt nhiều lần trong một ngày.

Ảnh `docs/anh/nhap-kq-pa/sau-form-375.png` cho thấy nút chính Lưu kết quả và nút phụ Lưu nháp phân cấp rõ. Ảnh vẫn có footer “nháp giữ trên máy”; commit cuối PR đã đổi riêng kết quả PA sang “chưa chốt”. **Không báo chữ trong ảnh cũ là lỗi còn trong HEAD.** Chụp lại ảnh nghiệm thu cuối để tài liệu không gây hiểu nhầm.

### U02 — Làm tiếp các em chưa xong ngay trong danh sách

Lưu trữ đã giữ lựa chọn và báo kết quả từng phần. Nâng cấp tiếp là vùng kết quả tồn tại sau toast: Đã xong n/m, Cần chọn lớp, Chưa lưu được; nút Xử lý tiếp mở đúng em và Thử lại chỉ gửi phần lỗi. Không buộc người dùng nhớ tên trong toast dài. Đây là cải tiến trên nền đã sửa, không làm lại F04.

### U03 — Màn nhỏ tập trung tác vụ đang làm

Ảnh mobile của Case có nhiều vùng thông tin trước form kết quả và vùng trống dài dưới. Không suy diễn chiều cao ảnh thành lỗi cuộn trên thiết bị thật. Kiểm tra viewport 375×812 với bàn phím mở: có thấy tên học viên/PA/hạn và nút lưu; khi mở tác vụ có cuộn đúng form; đóng quay lại đúng vị trí. Giảm thông tin lặp quanh form nếu người dùng vẫn nhận ra ngữ cảnh; giữ mở chi tiết khi cần. Không tự dựng panel lồng panel hoặc đổi thiết kế toàn Case.

### U04 — Sau lưu, ưu tiên Sửa và việc tiếp

Tôn trọng quyết định mới: kết quả PA đã lưu có Sửa điền sẵn, lỗi giữ chữ. Kiểm tra sửa lần ghi cũ không lấy hoặc xóa nháp kỳ đang chạy. “Lưu · việc tiếp” chỉ chuyển khi server xác nhận thành công; lỗi hoặc xung đột ở lại đúng người. Không tự động chuyển việc sau Lưu nháp.

### U05 — Hiệu năng theo vai, đo trước khi đổi prefetch

App.tsx vẫn nạp sẵn nhiều module sau 1.500 ms. #1452 đã tối ưu khởi động lạnh, nên đo tách: backend cold start, request API, JS tải nền và render. Đề xuất prefetch theo quyền/khả năng dùng tiếp, giữ tải lười PDF/Excel. Không coi tải mã Admin là lộ dữ liệu; quyền dữ liệu vẫn do server kiểm.

Nghiệm thu cold/warm cache cho GV/TVV/QL, desktop/mobile, request/byte và số dòng đọc Turso. Không đưa số bundle #1201 vào báo cáo như số mới. Không chỉ nâng ngưỡng cảnh báo bundle để “xanh”.

## 7. Phạm vi toàn hệ thống cần nghiệm thu hồi quy

Đây là danh sách ca cần chạy, không phải danh sách lỗi đã phát hiện.

| Khu | Ca trọng tâm |
|---|---|
| Tổng quan/Công việc | Số tổng khớp danh sách; nháp chưa tính xong; làm xong mất việc đúng thời điểm; đổi scope không lẫn |
| Học viên/Lưu trữ | Sửa liên hệ thiếu tuần, đổi lớp/lộ trình, lô một phần lỗi, tìm kiếm nhanh, Back/Forward |
| Test FT/lớp thường | Nhập/sửa/vắng/khôi phục đúng môn; W1/W2; lịch quá khứ/tương lai; giữ điểm cũ và quyền |
| Case/PA | Nháp/chốt/sửa, PA khép, thay PA, kết luận Case; hai phiên cùng làm; nháp cũ không sang kỳ mới |
| Ý thức/Phối hợp | Chuỗi xử lý, đổi hạn, tạm dừng/quay lại; việc Báo PH sau Meeting không đếm trùng |
| Phân tích/sổ nghĩa vụ | Hạn chọn đúng kỳ, việc thiếu ngày xong không bịa ngày; đổi TVV/lớp không làm KPI lệch ngoài luật |
| Báo cáo PH | Nội dung Excel/PDF cùng nguồn, tiến độ thật, tên đợt, tên trùng, lỗi font; không báo ZIP đủ khi thiếu em |
| Quản trị | Scope, hai người sửa chi nhánh, tài khoản khôi phục, Quản trị cuối, quyền của người đã bị thu hồi |
| UI chung | Loading/rỗng/lỗi/403 khác nhau; Tab/Esc/focus; 375 có bàn phím; không mất draft khi điều hướng |

Các nhận xét lịch sử KPI về người giữ việc/thời điểm sửa cuối cần đối chiếu kiến trúc sổ nghĩa vụ mới, không tự áp cơ chế snapshot mới từ prompt cũ. Core Teacher là phân công theo lớp; không tạo role toàn hệ thống. Không lẫn điểm thi chính thức với ước lượng giáo viên hoặc chữ điểm báo cáo PH.

## 8. Kế hoạch giao việc và nghiệm thu

1. Dựng ca N01–N03 trước: request chậm, hai tab, chốt keep. Chọn cơ chế revision chung giải quyết cả ba, nhưng tách thay đổi UI và migration rõ để review.
2. Sửa N04 độc lập, kiểm tra xung đột ở endpoint thật.
3. Kiểm hồi quy các lỗi cũ đã đóng và luồng mới RKC/Phối hợp/sổ nghĩa vụ; không chỉ test regex có chuỗi trong source.
4. Triển khai U01/U02/U04 theo component sẵn có. U03 nếu đổi layout cần mockup desktop/mobile và duyệt như repo quy định.
5. Đo U05 rồi đề xuất thay đổi có số liệu, không tối ưu bằng suy đoán.

Mỗi PR nêu trigger, trước/sau, test, số truy vấn/dòng đọc và đường sửa sai. Không thêm xác nhận cho lưu nháp bình thường. Khi có lỗi, giữ chữ và đúng ngữ cảnh học viên. Không “giải quyết” xung đột bằng âm thầm lấy bản cuối.

## 9. Bằng chứng và giới hạn kiểm tra độc lập

Đã đọc mã merge #1454, so với #1228 và xem ảnh tham chiếu mobile. Chưa chạy browser E2E/live. Các rủi ro N01–N04 được nêu theo code, không gắn số người dùng bị ảnh hưởng.

Kết quả lệnh kiểm tra được ghi ở phần cập nhật cuối. Lần rà này đã chạy lại độc lập và nhận kết quả 5.611 kiểm tra chức năng, 73 kiểm tra tốc độ đạt; SQLD/Hrana bỏ qua vì thiếu sqld. Không coi số test đạt là bằng chứng các tình huống đồng thời mới đã được bao phủ.

## 10. Claude phải bàn giao

- Bảng trạng thái N01–N04/U01–U05 và các hồi quy, không báo sửa lỗi cũ đã hết.
- Bằng chứng tái hiện trước sửa và test sau sửa, gồm hai phiên/request đảo thứ tự; log không có dữ liệu học viên thật.
- Ảnh HEAD mới 1440/375, form nháp/chốt/Sửa/lỗi/xung đột; cập nhật ảnh tham chiếu không còn đúng chữ.
- Mốc commit, kết quả check/build, mục fail/skip và lý do; không gọi skip là pass.
- Điều còn chờ chủ sản phẩm, không tự bật phần Tutor đang hoãn hoặc phục hồi tính năng đã chủ động bỏ.

Nguồn chính: [PR #1454](https://github.com/Pizi147/pisa-tracking/pull/1454), [cây mã được rà](https://github.com/Pizi147/pisa-tracking/tree/730f9319b9d986e52e8bbd7bfeb3ce6cabe5f670). Tìm theo tên hàm khi số dòng dịch chuyển.

### Cập nhật kiểm tra độc lập

- `npm ci --ignore-scripts`: hoàn tất; lần check đầu thiếu pdf-lib/fontkit/fflate là do môi trường cũ, không quy kết lỗi website.
- `npm run build` tại merge #1454: thành công, có cảnh báo chunk lớn trên 500 kB.
- Kiểm tra callback N02 trích nguồn: tái hiện việc xóa kho phục hồi sau phản hồi cũ, với API/storage giả lập; chưa React/E2E.

- `npm run check`: kết thúc mã 0; 5.611 kiểm tra chức năng và 73 kiểm tra tốc độ đạt. TypeScript, kiểm gói esbuild, hook và CSS đều qua; esbuild 0 cảnh báo. SQLD/Hrana bỏ qua vì môi trường không có sqld.
- Log độc lập: `audit/check-1454-ready.log`, `audit/build-1454.log` tại workspace rà soát; không phải tệp đã commit trong repo.
- Kết luận phạm vi: chưa thấy lỗi chặn build/check ở mốc này. Chưa đủ bằng chứng khẳng định bản live không bị chặn hoặc tất cả workflow đều hoạt động; cần kiểm trình duyệt, quyền và các tình huống đồng thời nêu trên.
