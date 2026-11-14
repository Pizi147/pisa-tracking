# Overhaul V6 — lời chủ SP (nguyên văn, mới nhất ở dưới)

Session planning "PTA Overhaul" (mở 13/11). Mọi lời chủ SP về overhaul V6 ghi ở đây NGAY trong lượt nhận. Lời mới hơn thắng lời cũ về cùng điều.

## 13/11 — lời 1: giao việc (kèm tệp đề xuất ChatGPT)

Tệp kèm: `D:\Download\Pisa tracking web\PISA-Teacher-First-Overhaul-PR1512-Claude.md` → chép nguyên ở `nguon/de-xuat-chatgpt.md` (audit + đề xuất của ChatGPT, baseline #1512: F01–F07 lỗi, mục 5–8 hướng thiết kế, U01–U14 brainstorm vòng 2, phụ lục route + 282 tệp TSX).

> "đây là đề xuất gửi từ chatGPT, cứ đọc tham khảo và xem xét, những phần về bug thì gửi qua session 'PTA Plan' để nó giao cho session khác xử lý.
> Tôi đang cần overhaul lại TOÀN BỘ tất cả các trang, panels, nút, không có giới hạn nào cả, thay đổi cấu trúc cũng được, hoàn toàn thoải mái, nhưng bản thân bạn vừa đọc những đề xuất này, thì riêng bạn cũng phải tự lên ý tưởng thật kĩ càng, chắc chắn, và cho tôi plan chi tiết, kể cả về model và effort tương ứng phù hợp để sửa đổi. Tôi muốn website trực diện hơn và đảm bảo trải nghiệm người dùng tốt hơn ở mọi vai (chủ yếu là GV vì là người đưa input chính), mọi thứ phải gọn gàng, workflow mượt, dễ chịu, logic, dễ nhìn, rõ ràng, đẹp nếu được. Cứ thoải mái trong mọi thứ và sử dụng các bộ skills về thiết kế hợp lý để làm mọi thứ tốt hơn, có gì không hiểu hỏi ngay. Nên nhớ, luôn nghĩ đến người dùng, khi họ vào web họ đang cần làm gì có những luật gì thì nên hiển thị như thế nào."

PTA Overhaul hiểu:
- Đề xuất ChatGPT = tham khảo, không phải quyết định. PTA Overhaul phải tự có ý tưởng riêng, chắc chắn.
- Phạm vi: TOÀN BỘ trang, panel, nút; được đổi cấu trúc (bố cục, điều hướng). Luật nghiệp vụ `plan.md` 1.6 KHÔNG tự đổi — đề xuất trái luật ghi [XM] hỏi.
- Mục tiêu: trực diện · gọn · workflow mượt, logic · dễ nhìn, rõ · đẹp nếu được. Mọi vai, GV trước (người nhập chính).
- Cách nghĩ: người dùng vào web đang cần làm gì → có luật gì → hiển thị thế nào.
- Đầu ra: plan chi tiết từng PR, có model + effort.
- Lỗi: chuyển PTA Plan.

Đã làm trong lượt:
- 13/11: gửi PTA Plan F01, F03, F04, F05, F06, F07 (đã đối chiếu mã `origin/main` 802f1b685; F02 = GV-CU-BO-TRO #1514 đang chạy).

## 13/11 — lời 2: không giới hạn, kể cả điều đã chốt về bố cục

Bối cảnh: PTA Overhaul báo hai điều đã chốt có thể vướng — 05/11 bác hướng làm lại Công việc thành bảng rộng ("thà như cũ còn hơn, cải thiện cái cũ thôi") và sáng 13/11 "Không cần đổi tổng quan nữa" (bỏ gộp Tổng quan GV) — và nói sẽ hỏi rõ.

> "cứ thoải mái hết tất cả mọi nơi không sợ gì hết"

PTA Overhaul hiểu:
- MỌI quyết định cũ về bố cục / điều hướng / giao diện đều mở lại cho overhaul V6: trang đầu theo vai, Tổng quan, thứ tự menu, khung Công việc, hồ sơ lớp / HV, Quản trị… Lời này (mới hơn) thắng "Không cần đổi tổng quan nữa" sáng 13/11 và các chốt bố cục trước đó.
- Hướng từng bị bác (bảng rộng một dòng một việc, 05/11) vẫn coi là bài học khẩu vị — không đề xuất lại đúng kiểu đó nếu không có lý do mới.
- Luật NGHIỆP VỤ (`plan.md` 1.6: hạn, quyền, ai làm việc gì, cách tính) KHÔNG nằm trong "thoải mái": đề xuất nào đụng thì ghi [XM] hỏi riêng.
- Quy trình giữ: mockup duyệt trước khi code, một màn một PR, chủ SP duyệt ảnh cặp.

## 13/11 — lời 3: luật nghiệp vụ — không tự đổi, nhưng được đề xuất; chia hai nhóm

Bối cảnh: PTA Overhaul nói "luật nghiệp vụ tôi vẫn không tự đổi; đề xuất nào đụng tới thì hỏi riêng từng điểm".

> "không tự đổi nhưng cứ thoải mái thấy chỗ nào có thể nâng cấp thì nâng cấp, đề xuất cho tôi, chia 2 nhóm là đè xuất nên có và cái vi phạm luật, ghi rõ luật tôi bảo và bạn định làm gì, tại sao thấy không cần thiết, có những luật core thì tôi nghĩ không nên đụng vào thôi"

PTA Overhaul hiểu:
- Không tự đổi luật, nhưng ĐƯỢC (và nên) đề xuất nâng cấp ở mọi chỗ, kể cả chỗ đụng luật.
- Mọi bản đề xuất / thiết kế / plan chia HAI NHÓM:
  - **Nhóm 1 — Nên có:** không trái luật nào; làm được ngay khi chủ SP duyệt thiết kế.
  - **Nhóm 2 — Đụng luật:** mỗi dòng ghi đủ ba ý — (a) luật chủ SP đã bảo (nguyên văn / mã luật + ngày), (b) PTA định làm gì thay, (c) vì sao thấy luật đó không còn cần. Chỉ làm khi chủ SP đồng ý từng dòng.
- **Luật core không đụng**, cũng không đưa vào nhóm 2. PTA sẽ liệt kê danh sách "luật core" theo cách hiểu của mình trong bản thiết kế để chủ SP sửa (dự kiến: cách tính SOS / Overall / kỳ vọng, thang vi phạm, quyền theo vai + phạm vi, ai giữ việc nào, các bước duyệt của QL, luật vắng / dời MT, hạn theo quy chế).

## 13/11 — lời 4: GV thật đang vấp ở đâu (trả lời câu hỏi 1)

Câu hỏi của PTA Overhaul: "GV thật ở các chi nhánh (không phải bạn) đang phản hồi gì khi dùng web: họ hay hỏi, hay kẹt, hay bỏ không làm ở chỗ nào?"

> "họ không biết thao tác ở đâu như thế nào, cần phải làm gì, nhập điểm chỗ nào, thấy UX/UI loạn và khó theo dõi, nhiều cái thừa thãi"

PTA Overhaul hiểu — năm điều overhaul V6 phải chữa, theo đúng thứ tự GV nói:
1. **Không biết thao tác ở đâu, như thế nào** → mỗi vai MỘT chỗ bắt đầu rõ ràng; một loại việc một cách làm, mở từ đâu cũng giống nhau.
2. **Không biết cần phải làm gì** → mở web là thấy việc của mình, nói thẳng "làm gì · cho lớp / em nào · hạn nào", không phải đi tìm qua tab / ô số.
3. **Không biết nhập điểm chỗ nào** → việc số một của GV phải có MỘT cửa tên rõ "Nhập điểm", luôn nhìn thấy (hiện có ~7 lối vào, không lối nào hiển nhiên).
4. **Loạn, khó theo dõi** → một bộ dáng chung cho cùng loại thông tin ở mọi màn; ít tầng, ít kiểu.
5. **Nhiều cái thừa** → cắt: menu, tab, bộ lọc, ô số, nút cùng nghĩa, chữ.
Đây là thước đo nghiệm thu của overhaul: một GV mới mở web tự trả lời được "tôi cần làm gì" và "nhập điểm ở đâu" trong vài giây, không cần hướng dẫn.

## 13/11 — lời 5: luật và logic ổn; GV rối vì không biết làm thế nào, quy chế mới chưa rõ → web phải hỗ trợ nhiều hơn

> "nói chung luật và logic thì khá ok, không có nhiều phàn nàn, chỉ là họ bị rối không biết nên làm thế nào, cũng một phần là do quy chế mới nhiều người chưa rõ, nhưng ý là cũng cần hỗ trợ họ nhiều hơn ấy"

PTA Overhaul hiểu:
- Luật + logic GIỮ. Overhaul V6 là việc **dẫn đường và hỗ trợ**, không phải đổi nghiệp vụ → nhóm "Đụng luật" (lời 3) dự kiến rất ngắn.
- Gốc rối có hai phần: (a) web không chỉ rõ làm gì, ở đâu, thế nào; (b) GV chưa thuộc quy chế mới.
- Vì (b): web phải **mang quy chế tới đúng chỗ làm** — GV không cần thuộc quy chế vẫn làm đúng. Mỗi việc cho thấy: vì sao có việc này (theo quy chế) · cần làm gì · lưu xong thì chuyện gì xảy ra (ai nhận, hạn nào). Lựa chọn mặc định = đúng quy chế; chọn khác thì ghi ngay hệ quả ("cần QL duyệt").
- Không trái lời 07/11 "bỏ chú thích": không thêm đoạn giải thích tĩnh trên màn; chỉ một dòng ngắn gắn với đúng việc / đúng nút (thuộc loại "lưu ý cần thiết: hậu quả, bước kế, ràng buộc" chủ SP cho giữ), chi tiết ở ⓘ / Hướng dẫn.

## 13/11 — lời 6: chọn mẫu C (có chỉnh); phải xem kỹ luật core rồi mới biết giao diện cần gì

Bối cảnh: PTA Overhaul đưa ba hướng trang đầu GV (A việc dẫn đường · B lớp dẫn đường · C "Hôm nay" = việc bên trái + lớp bên phải, có dòng "Đang chờ người khác · 2" và mỗi lớp một nút "Nhập điểm"), khuyên C.

> "cần phải xem kĩ luật core để biết giao diện có những cái gì hợp lý hay không, mẫu C ổn nhưng đâu cần 'đang chờ người khác' làm gì? và không phải lớp nào cũng cần nhập điểm ok?"

PTA Overhaul hiểu:
- **Hướng C được chọn** làm khung trang đầu GV (việc + lớp trên một trang).
- **Bỏ "Đang chờ người khác"** khỏi trang đầu: GV chỉ cần thấy việc CỦA MÌNH.
- **Nút "Nhập điểm" không gắn cứng vào mọi lớp:** chỉ hiện ở lớp / thời điểm thật sự có bài cần người đó nhập, đúng theo luật (lịch Test theo tuần, theo em, theo kỹ năng được phân công).
- **Giao diện phải suy ra từ luật core, không vẽ trước rồi ép luật vào:** trước khi thiết kế, PTA Overhaul đọc kỹ luật theo 4 mảng (Test + nhập điểm · SOS / Case / PA · Ý thức / phối hợp / TVV · lớp / lộ trình / quyền) và viết bản "luật core → việc sinh ra → người làm cần thấy gì" ở `luat/`; mọi thành phần giao diện phải chỉ ra được nó phục vụ luật / việc nào, không có thì bỏ.

## 13/11 — lời 7: web hiện tại là nền đã có ý đồ — học từ nó; vấn đề chỉ ở UI/UX

> "nên nhớ một điều là website hiện tại cũng đã được tối ưu rất nhiều, các luật, các thao tác logic và mọi thứ gần như đều có ý đồ rõ ràng và đã xây dựng khá chắc chắn, hiện tại chỉ có vấn đề nhiều về UI/UX nên tôi mới cần bạn sửa, nên có thể học tập từ website đang có để hiểu rõ hơn logic, luật và các thao tác, những design thêm nhất là những PR gần về đây trong khoảng 3-4 lần deploy gần nhất đều có ý đồ hết, nên cứ học tập và rút ra những thứ cần rút"

PTA Overhaul hiểu:
- Overhaul V6 = sửa **UI/UX** (cách bày, cách dẫn đường, độ gọn, hình ảnh). **Luật, logic, thao tác đã có là nền** — không làm lại, không coi là thừa khi chưa hiểu ý đồ.
- Nguồn học: (a) chính web đang chạy — tự bấm thử theo từng vai; (b) mã; (c) các PR + mockup của **3–4 lần deploy gần nhất** (và phần đã merge chưa deploy): mỗi thiết kế thêm đều có ý đồ của chủ SP → phải rút ý đồ rồi mới động vào.
- Hệ quả cho cách làm: mỗi thay đổi giao diện phải ghi "thao tác / ý đồ cũ là gì → sau overhaul nằm ở đâu" (bảng TRƯỚC → SAU, như luật V5 "nâng cấp, không chép mockup"); thứ gì định BỎ phải nêu ý đồ gốc và vì sao không còn cần — đưa chủ SP quyết, không tự bỏ.
- Việc làm ngay: thêm một bản đọc "ý đồ thiết kế 3–4 lần deploy gần nhất" (`luat/5-y-do-thiet-ke-gan-day.md`) cạnh 4 bản luật core; PTA Overhaul tự chạy bản thử, đi hết các luồng theo từng vai trước khi vẽ lại mẫu C.

## 13/11 — lời 8: đừng quên Speaking chấm chéo

Bối cảnh: PTA Overhaul gửi bản luật core một trang (B4: "Speaking của Mock / MT0 = chấm chéo: một việc chung cho mọi GV Speaking của chi nhánh").

> "đừng quên speaking chấm chéo, cũng là một cái nhức đầu đấy"

PTA Overhaul hiểu:
- Speaking chấm chéo là một **luồng riêng phải thiết kế kỹ** trong overhaul, không coi như một dòng "nhập điểm" thường: việc không thuộc riêng ai, ai chấm cũng được, chấm xong còn bước GV phụ trách Speaking của lớp "Xác nhận Case Speaking".
- Việc làm ngay: đọc lại mọi lời chủ SP + luật về S chéo (T18, N7, N8 ③, N10 S Ex, các đoạn 08–13/11), xem luồng thật trên bản thử bằng tài khoản GV Speaking, rồi đưa thành một mục riêng trong thiết kế (ai thấy gì, lúc nào, làm ở đâu, xong thì sao).

## 13/11 — lời 9: Speaking chấm chéo không cần mục riêng, đừng khác nhập điểm thường

Bối cảnh: PTA Overhaul viết "Speaking chấm chéo sẽ là một mục riêng trong thiết kế, không gộp vào 'nhập điểm' thường" và nghĩ tới việc gom danh sách theo tuần Test → lớp.

> "speaking chấm chéo ý là không cần phải một mục riêng, nói chung làm thế nào cho hợp lý thôi chứ đừng khác quá so với nhập điểm thông thường"

PTA Overhaul hiểu (sửa cách hiểu lời 8):
- Speaking chấm chéo **không làm thành một khu / kiểu màn riêng**. Nó phải **giống nhập điểm thường hết mức**: cùng chỗ (nhóm Chấm điểm), cùng dáng dòng (kỹ năng · lớp · tuần Test · số bài · hạn), cùng panel / lưới nhập, cùng "Lưu · bài tiếp".
- Chỗ khác chỉ giữ đúng phần luật buộc phải khác: là việc chung của nhóm GV Speaking (một nhãn nhỏ "chấm chéo"), ô "GV chấm", cách tính quá hạn theo luật 09/11.
- Hệ quả: danh sách phẳng xếp theo tên em hiện nay → theo tuần Test + lớp như các kỹ năng khác (đúng N39). Tab riêng "Speaking chấm chéo" (đổi tên 13/11, #1475) → đề xuất gộp vào Chấm điểm; đưa vào nhóm "Nên có" để chủ SP quyết, không tự bỏ.

## 13/11 — lời 10 (câu hỏi): S chấm chéo có nên là tab riêng?

Bối cảnh: sau lời 9, PTA Overhaul đề xuất gộp tab "Speaking chấm chéo" vào Chấm điểm.

> "nên tách ra thành một tab riêng không? vì nó cũng hơi khác, ý bạn thế nào?"

PTA Overhaul trả lời (ĐỀ XUẤT, chờ chủ SP chốt): **giữ tab riêng, nhưng bên trong giống hệt nhập điểm thường.**
- Khác nhau thật nằm ở "việc của ai", không ở "làm thế nào": tab Chấm điểm = bài của riêng tôi (tính vào số việc, hạn của tôi); S chấm chéo = bài chung của nhóm GV Speaking, gồm cả lớp tôi không dạy và MT0, cách tính quá hạn riêng (lời 09/11). Trộn hai loại vào một danh sách thì GV không còn phân biệt được bài nào bắt buộc là của mình, và bài chung (có thể vài chục dòng) đè lên bài riêng.
- Tab này đã có ý đồ (chia tab hạng mục 06/11, đổi tên 13/11 #1475) → giữ.
- Cái sửa là BÊN TRONG tab (đúng lời 9): dòng "Speaking · lớp · tuần Test · số bài · hạn" theo tuần + lớp, tuần mới ở trên, tuần cũ gập; mở ra cùng panel / lưới nhập, cùng "Lưu · bài tiếp". Đầu tab ghi thẳng "Việc chung của nhóm GV Speaking · n bài" thay cho "0 việc".
- Đề xuất thêm (chờ chốt): lớp tôi đang dạy Speaking xếp lên đầu tab; ở cột "Lớp của tôi" của trang đầu, lớp đó ghi "Speaking tuần này · n bài · chấm chéo" và mở đúng panel này.

## 13/11 — lời 11: chốt Speaking chấm chéo

Câu hỏi của PTA Overhaul (hộp bước tiếp): "Giữ tab riêng cho Speaking chấm chéo, bên trong giống nhập điểm thường?"

> "Đồng ý"

ĐÃ CHỐT:
- **Giữ tab riêng "Speaking chấm chéo"** ở Công việc (không gộp vào Chấm điểm).
- **Vẫn MỘT dòng việc chung "Chấm Speaking"** (giữ ý đồ OV-14c: bài chung không đếm thành nhiều việc cho từng GV).
- **Bên trong panel giống nhập điểm thường:** gom theo tuần Test → lớp, cùng lưới nhập, cùng "Lưu · bài tiếp"; tuần mới ở trên, tuần cũ gập.
- Đầu tab ghi thẳng "Việc chung của nhóm GV Speaking · n bài" thay cho "0 việc".
- Luật không đổi: ai chấm được, hạn, cách tính quá hạn (09/11).
Đi kèm, còn là đề xuất (duyệt ở mockup): lớp tôi dạy Speaking xếp đầu tab · cột "Lớp của tôi" ghi "Speaking tuần này · n bài · chấm chéo".

## 13/11 — lời 12: duyệt hướng mẫu C bản 2, làm mockup; GV có việc Báo cáo PH

Bối cảnh: PTA Overhaul gửi `02-de-xuat-hai-nhom.md` (mẫu C bản 2, nhóm 1 "Nên có", nhóm 2 "Đụng luật" 2.1–2.7; dòng 2.6 đề xuất KHÔNG tạo việc Báo cáo PH, chỉ một dòng nhắc).

> "Duyệt hướng bản C và làm mockup đi, còn nhóm 2 ý 2.6 cần chú ý là task báo cáo PH không cần tạo cho các vai khác, nhưng GV thì vẫn cần phải làm và có hạn rõ ràng mà, xuất hiện từ ngày 20 hàng tháng và hạn thường là 30 hàng tháng (tháng 2 - ngày 28)"

ĐÃ CHỐT:
- **Hướng mẫu C bản 2** (trang đầu GV = Công việc + "Lớp của tôi" + "+ Ghi"; gồm 2.1, 2.2). Bước tiếp: làm mockup.
- **2.6 (sửa đề xuất của PTA):** **GV CÓ việc "Báo cáo PH"** — việc thật, có hạn: **hiện từ ngày 20 hằng tháng, hạn ngày 30 (tháng 2: ngày 28)**. Vai khác KHÔNG tạo việc này. Với GV, lời này thay lời 05/11 "Không cần tạo hẳn task báo cáo PH đâu". Mốc 20 → 30 / 28 khớp đợt tháng FT đang có trong mã (`shared/domain/baoCaoPh.ts` `dotThang`).

PTA Overhaul tự chốt chi tiết (chủ SP duyệt lại ở mockup): một dòng mỗi lớp "Viết Báo cáo PH · {lớp} · Tháng n · còn x / y em · hạn 30/n"; người giữ = GV có phần phải viết ở lớp đó (GV kỹ năng: phần mình; GVCN: phần Chung); xong khi đủ phần của mình cho mọi em; bấm "Viết ›" sang tab Báo cáo PH của hồ sơ lớp; tính như việc thường (vào số việc, quá hạn sau hạn). Việc Admin "Xuất báo cáo PH" giữ như cũ.

CÒN HỎI: (a) lớp thường (đợt Progress / Final: mở thứ Hai tuần Test, hạn Chủ nhật tuần đó) có tạo việc cho GV như FT không — chủ SP mới nói "hàng tháng"; (b) các dòng nhóm 2 chưa trả lời: 2.3 (việc "Điền Target" về TVV), 2.4 (S chấm chéo: người nhập không phải GV Speaking phải chọn "GV chấm"), 2.5 (một định nghĩa "GV Speaking"), 2.7 (tin Cập nhật cho GVCN khi TVV báo PH vi phạm xong).

Mockup: làm ① trang đầu GV trước (đề bài `03-de-bai-mockup-1.md`, 26 dòng R); chủ SP duyệt rồi mới làm ② hồ sơ lớp · ③ hồ sơ HV · ④ trang đầu TVV cùng ngôn ngữ đó.

## 13/11 — lời 13: nhóm 2 theo đề xuất hết; Báo cáo PH lớp thường cũng giao việc; Fable chỉ làm plan

Câu hỏi của PTA Overhaul: "Các dòng 2.3, 2.4, 2.5, 2.7 làm theo đề xuất của tôi chứ?" + "Báo cáo PH lớp thường (đợt Progress / Final) có tạo việc cho GV như FT không?"

> "theo đề xuất hết nhé, báo cáo lớp thường cũng giao việc, nếu có kết hoạch rồi thì giao session khác làm không? vì đâu cầu fable làm mockup đâu, chỉ làm plan thôi có lẽ sẽ tốt hơn? bạn nghĩ sao?"

ĐÃ CHỐT (nhóm 2 của `02-de-xuat-hai-nhom.md`):
- **2.3** Việc "Điền Target" bỏ khỏi GVCN; TVV giữ (nằm trong "Bổ sung hồ sơ thiếu"); GVCN chỉ thấy nhắc "Em chưa có Target" kèm "Đề xuất sửa".
- **2.4** Speaking chấm chéo: người nhập KHÔNG phải GV Speaking (QL / Admin nhập hộ) phải chọn "GV chấm" trước khi lưu; không ghi ngầm người nhập là người chấm.
- **2.5** MỘT định nghĩa "GV Speaking" = theo quyền N7 (có kỹ năng Speaking trong hồ sơ HOẶC đang dạy Speaking một lớp FT), dùng ở quyền, ô chọn người chấm và sổ đếm.
- **2.7** TVV báo PH về vi phạm xong → GVCN nhận một tin "Cập nhật" (không vào số việc).
- **2.6 (bổ sung lời 12):** Báo cáo PH **lớp thường cũng giao việc cho GV** — theo đợt Progress / Final đang có trong mã (mở thứ Hai tuần Test, hạn Chủ nhật tuần đó); FT: 20 → 30 (tháng 2: 28).

VỀ CÁCH LÀM (chủ SP hỏi ý, PTA Overhaul đồng ý): session Fable này **chỉ làm phần đọc + quyết**: đề bài, thiết kế, plan PR, rà theo đề bài. **Dựng mockup và code giao session khác** (Opus 5.5 / Sonnet 5.5) qua PTA Plan. Mockup ① đang do một agent Opus dựng → để chạy nốt; từ ② trở đi là session riêng, ghi trong plan.

## 13/11 — lời 14: hạn Báo cáo PH lớp thường

> "hạn báo cáo cho lớp thường để thứ 3 tuần tiếp theo, sau tuần làm test"

ĐÃ CHỐT (đổi luật đang chạy): đợt Báo cáo PH lớp thường (Progress / Final) vẫn mở thứ Hai tuần Test, **hạn = thứ Ba tuần kế tiếp** (thứ Hai tuần Test + 8 ngày). Mã đang là Chủ nhật tuần Test (`shared/domain/baoCaoPh.ts` `dotTuan`, + 6 ngày). Áp cho cả việc mới của GV lẫn tab Báo cáo PH và việc Admin "Xuất báo cáo PH" (cùng một hàm đợt). FT giữ 20 → 30 (tháng 2: 28).

## 13/11 — lời 15: PTA Overhaul tự giao session mockup

> "Từ sau bạn tự giao session làm mockup luôn không cần phải gửi qua PTA plan nữa, nhiều bước thừa quá"

ĐÃ CHỐT (cách làm, áp từ nay): **session mockup do PTA Overhaul tự mở và giao** (Opus 5.5 / Sonnet 5.5), không qua PTA Plan. Session CODE, rà, check chung, merge PR code, deploy vẫn là việc PTA Plan (chủ SP chưa đổi phần này).

## 14/11 — lời 16: ba câu Báo cáo PH theo đề xuất · Head tutor như GV · thông báo · giao đợt trước ngày · việc logic về PTA Plan

Câu hỏi của PTA Overhaul: ba câu về việc Báo cáo PH (quá hạn hiện 7 ngày rồi rời + không sinh cho đợt cũ · GVCN kiêm kỹ năng một dòng · đợt QL thêm bất chợt có sinh việc) + báo "Head tutor giữ Tổng quan cũ".

> "1. Ba câu trả lời: Theo đề xuất hết
> 2. Head tutor vẫn là GV là chính, nên view nên như của GV là chính nha
> 3. Nên có thông báo cho Admin khi GV hoàn thành xong hết báo cáo, và báo cần nhắc GV khi đến ngày hạn mà chưa xong, và quá hạn
> 4. Việc giao Báo cáo PH có thể giao trước ngày, hiện tại đang bị khóa là cần phải giao từ ngày hôm nay trở về quá khứ, hơi bị hạn chế
> 5. Ngoài ra: Những cái gì liên quan đến logic, lỗi, luật mà bạn phát hiện ra, hoặc tôi đã chốt thay đổi (đối với luật/ logic là chủ yếu) thì gửi plan qua cho PTA Plan để nó tự giao session khác làm, bạn chỉ giao việc liên quan đến thiết kế (nhưng vẫn cần xử lý rà soát luật lệ, logic, workflow để cố gắng cải thiện)"

ĐÃ CHỐT:
1. Việc Báo cáo PH của GV: quá hạn hiện thêm **7 ngày rồi tự rời**, không sinh việc cho đợt đã qua trước ngày bật · GVCN vừa dạy kỹ năng vừa viết phần Chung: **một dòng** · đợt QL / Admin thêm bất chợt **có sinh việc** (hạn QL đặt).
2. **Head tutor xem như GV** (trang đầu, menu như GV) — thay điều PTA Overhaul tự chốt "Head tutor giữ Tổng quan cũ".
3. **Thông báo Báo cáo PH:** Admin nhận tin khi GV đã xong hết báo cáo (PTA hiểu: theo lớp × đợt, cùng lúc việc "Xuất báo cáo PH" xuất hiện); GV được nhắc khi **tới ngày hạn mà chưa xong** và khi **quá hạn** (PTA hiểu: việc vào nhóm "hôm nay" / "quá hạn" của badge + chuông theo cơ chế đang có, không thêm kênh mới).
4. **Đợt Báo cáo PH do QL / Admin thêm được đặt ngày mở ở tương lai** (nay chỉ từ hôm nay về trước).
5. **Chia việc:** logic · lỗi · luật (PTA Overhaul phát hiện hoặc chủ SP chốt đổi) → PTA Overhaul viết plan gửi **PTA Plan tự giao session**. PTA Overhaul **chỉ giao việc thiết kế** (session mockup — lời 15), nhưng vẫn phải rà luật, logic, workflow để đề xuất cải thiện.

Đã làm trong lượt: viết `05-plan-logic-luat.md` (8 PR LG-1 … LG-8 + mục nhờ xem) gửi PTA Plan.

## 14/11 — lời 17: duyệt mockup ① kèm 3 chỉnh; ô chọn có tìm ở mọi nơi

Bối cảnh: PTA Overhaul gửi mockup ① `thiet-ke/v21/trang-dau-gv.html` (#1544) và hỏi "Duyệt mockup ① trang đầu GV để tôi mở session mockup ②–⑤?".

> "1. Speaking chấm chéo thì phải hiểu là chủ yếu toàn chấm cho lớp khác, nên cứ để theo thứ tự lớp mặc định
> 2. Phần lớp của tôi bên cạnh đừng để mặc định 'nhập điểm' đẻ chung cùng các việc khác ở cột cuối, và đổi cột cuối để thành 'Việc cần làm' (tất nhiên chỉ hiện việc của người đó) và hiện ra số việc + loại việc, thể hiện rõ hơn đừng để mỗi text, và khi bấm vào sẽ hiện ra panels tương ứng, hoặc đưa đến trang tương ứng nhé
> 3. '+Ghi' thay bằng '+ Task', và xếp theo thứ tự: Case, Vi phạm/ Nhắc nhở, Tình hình học tập.
> 4. Còn lại duyệt nhé, tôi thấy khá ok
> 5. Cái này không cần phải làm ngay trong mockup 1, để chỗ khác cũng được, nhưng có một thứ tôi vừa nhớ ra, là những hộp box search + chọn (kiểu chọn tên, lớp, HV, người phụ trách,...) cần là hộp mặc định ở TẤT CẢ những chỗ cần chọn nhé, thay hết bộ dropdown thành bộ search + dropdown chọn, và tất nhiên nên hiện những cái relevant, kiểu chuyển lớp thì nên hiện ra lớp ở trong cùng chi nhánh, GV cùng chi nhánh,... trước"

ĐÃ CHỐT:
- **Mockup ① DUYỆT** kèm 3 chỉnh (đang sửa vào mockup):
  1. Speaking chấm chéo: các lớp xếp theo **thứ tự lớp mặc định** — BỎ đề xuất "lớp tôi dạy Speaking lên đầu".
  2. "Lớp của tôi": **không có nút "Nhập điểm" riêng**; cột cuối tên **"Việc cần làm"** — chỉ việc của người xem, mỗi loại việc một nút-chip rõ (loại + số), Nhập điểm nằm chung trong đó; bấm = mở panel tương ứng hoặc sang trang tương ứng.
  3. Nút **"+ Task"** (thay "+ Ghi"); thứ tự: **Case · Vi phạm / Nhắc nhở · Tình hình học tập**.
- **Ô chọn có tìm (search + chọn) là mặc định ở TẤT CẢ chỗ cần chọn** tên / lớp / HV / người phụ trách…; thay hết dropdown; **mục liên quan hiện trước** (chuyển lớp: lớp cùng chi nhánh; GV cùng chi nhánh…). Không bắt buộc ở mockup ① → đưa vào mockup ⑤ (bảng mẫu thành phần) + một đợt PR thay toàn web.

PTA Overhaul hiểu thêm (chủ SP sửa nếu sai): (a) "Còn lại duyệt" = mockup ①; bản thiết kế `04-thiet-ke.md` là bản gom những điều chủ SP đã chốt từng lời, PTA Overhaul tiếp tục làm theo nó; (b) ô chọn có tìm áp cho chỗ chọn người / lớp / học viên và danh sách dài; danh sách ngắn cố định (vd 5 nhóm vi phạm, "Mọi hạn") giữ dáng chip / ô chọn thường.

Đã làm trong lượt: giao sửa mockup ① theo 3 chỉnh; viết `06-de-bai-mockup-2-5.md` (đề bài mockup ② hồ sơ lớp · ③ hồ sơ HV · ④ trang đầu TVV · ⑤ bảng mẫu thành phần, có ô chọn có tìm).

## 14/11 — lời 18 (câu hỏi): session mockup là session con hay tác vụ nền?

> "có nên cho hẳn nhứng session làm mockup thành session con không hay chạy background tasks như bây giờ?"

PTA Overhaul trả lời (ĐỀ XUẤT, chờ chủ SP chốt): **mockup ②–⑤ nên là session con** (mỗi mockup một session Opus 5.5, worktree + PR riêng) — chủ SP mở ra xem, góp ý thẳng trong session đó, không phải chuyển lời qua PTA Overhaul; nhiều vòng sửa không dồn vào session Fable. **Tác vụ nền chỉ dùng cho việc ngắn** (đọc mã, sửa nhỏ như 3 chỉnh của mockup ①). Session mockup ghi lời chủ SP vào tệp ghi chú của mockup; PTA Overhaul chép vào `loi-chu-sp.md` khi rà.

## 14/11 — lời 19: tên "Chấm Speaking"

> "đổi speaking chấm chéo thành 'Chấm Speaking' là được rồi"

ĐÃ CHỐT: tên tab / nhãn tính năng **"Chấm Speaking"** (thay "Speaking chấm chéo" — tên đặt 13/11 ở #1475). Áp: tab Công việc, đầu panel, nút-chip "Việc cần làm", Hướng dẫn "?". Dải đầu tab vẫn ghi "Việc chung của nhóm GV Speaking · n bài". Luật không đổi. Đã giao sửa vào mockup ①; đổi chữ trên web đi cùng PR giao diện của tab này.

## 14/11 đêm — lời 20: mockup ① duyệt hẳn (4 chỉnh, không mockup lại) · mockup khác = session con · chạy qua đêm

> "Mockup 1:
> 1. Như đã nói, việc chấm speaking toàn là chấm chéo, nên đừng hiện công việc chấm speaking ở bảng lớp của tôi
> 2. Để các đầu việc trong box nhỏ thì được, nhưng thôi đừng thêm icon bút viết, flag làm gì, hơi thừa thãi, và sắp xếp cho hợp lý để nhìn đỡ rối mắt là ok
> 3. Việc bấm vào từng việc chuyển sang trang rất hợp lý, tôi cần những thứ như thế
> 4. Việc 'Báo cáo PH' nên để vào tab 'vận hành' giờ đã nhiều tab rồi nên làm gọn đi nhé
> 5. Còn lại ok, duyệt nhé, không cần mockup lại đâu
>
> Các mockup khác mở thành session con.
>
> Bây giờ tôi sẽ đi ngủ, bạn cứ tự chủ động làm tiếp, tự chủ động đề xuất, giao việc, chọn model, effort khi giao cho session, rà và để lại mockup ở session con mai tôi duyệt, những gì động vào luật, logic, bug cần sửa để cho mọi thứ hợp lý, cứ nhắn cho PTA Plan và bảo nó y hệt là tôi đang ngủ, tự chủ động rà, duyệt, merge, mọi thứ, archive thứ đã xong, sáng mai báo cáo cho tôi cụ thể và hỏi tôi những cái cần thiết là được. Bạn cũng vậy cái gì cảm tháy tự quyết được cứ tự quyết, còn nếu thấy không chắc chắn thì cứ tổng hợp lại rồi hỏi tôi mai tôi sẽ trả lời sau. Ngoài ra cần gì bây giờ thì suy nghĩ kĩ đi và hỏi luôn ngay bây giờ. Và khi bạn gửi cho PTA Plan, nó có tự giao việc cho session con được luôn không hay tôi lại vẫn phải bấm nút confirm như những đợt vừa rồi? có cách nào bypass việc đấy không vì tôi còn đi ngủ"

ĐÃ CHỐT — mockup ① DUYỆT HẲN, không vẽ lại; bốn chỉnh dưới đây áp thẳng khi code và ở mockup ②–⑤ (thắng hình trong `thiet-ke/v21/trang-dau-gv.html`):
1. Bảng "Lớp của tôi" **không hiện việc Chấm Speaking** (việc này toàn chấm chéo, chỉ nằm ở tab Chấm Speaking).
2. Nút-chip "Việc cần làm": giữ hộp nhỏ, **bỏ biểu tượng** (bút, cờ…); xếp gọn, đỡ rối.
3. Bấm một việc → mở panel / sang trang tương ứng: **giữ, làm rộng ra các chỗ khác**.
4. Việc **"Báo cáo PH" nằm trong tab "Vận hành"** — không thêm tab riêng (đã nhiều tab).
5. Mockup ②–⑤: **mỗi cái một session con**.

CHẠY QUA ĐÊM: PTA Overhaul tự quyết việc tự quyết được (đề xuất, giao session thiết kế, chọn model + effort, rà mockup, để mockup ở session con chờ chủ SP duyệt sáng mai); việc luật / logic / lỗi → nhắn PTA Plan, nói rõ chủ SP đang ngủ: tự rà, duyệt, merge, archive, sáng báo cáo. Điều không chắc → gom lại hỏi sáng mai.

## 14/11 đêm — lời 21: PTA Overhaul làm thay PTA Plan cho việc phát sinh

> "vì sẽ còn những việc mà bạn giao thêm trong quá trình rà soát nếu phát hiện ra đúng không? nếu bạn gửi tin nhắn cho PTA Plan mà nó không tự giao việc được cho session con mà cần tôi confirm, thì tốt nhất là bạn chủ động làm thay nó luôn từ giờ, có cái gì thì cũng tự chủ động chọn model, effort và giao cho session con, tự chủ động rà duyệt và merge như PTA Plan đã làm nhé"

ĐÃ CHỐT (áp từ nay): việc phát sinh trong lúc rà (kể cả logic / lỗi / luật) — **PTA Overhaul tự giao session con, tự chọn model + effort, tự rà, duyệt và merge** như PTA Plan vẫn làm; không phải chuyển qua PTA Plan rồi chờ chủ SP bấm thẻ. Sửa lời 16 ý 5 ở phần "ai giao".
PTA Overhaul hiểu: (a) các việc ĐÃ gửi PTA Plan (F01–F07, L1–L8, LG-1…LG-8, GD-1…GD-3) và các session PTA Plan đã mở vẫn do PTA Plan theo dõi — không giao trùng; (b) vẫn giữ: không deploy; PR đổi bố cục dừng ở ảnh cặp chờ chủ SP (Q-6); điều không chắc gom lại hỏi sáng.
Đã làm trong lượt: mở sẵn hai session dự bị (`du-bi-1` Opus 5.5 · high, `du-bi-2` Sonnet 5.5 · medium) vì app chỉ cho mở session ở lượt của chủ SP; việc phát sinh trong đêm giao cho hai session này bằng tin nhắn.

## 14/11 đêm — lời 22: để ý tác vụ chạy nền

> "nhớ để ý những việc chạy background, không cần thì tắt, như cái vừa rồi nếu tôi tắt nhầm thì cứ tự bật lại"

ĐÃ CHỐT (cách làm): tác vụ nền / tiến trình không còn cần thì PTA Overhaul tự tắt (chỉ theo cổng / worktree của mình); cái nào chủ SP tắt nhầm mà còn cần thì tự bật lại, không hỏi. Bản chạy thử cổng 5310 chủ SP vừa tắt: không còn cần (các session mockup tự chạy bản thử riêng) → không bật lại.

## 14/11 sáng — lời 23: chủ SP đã dậy — code về lại PTA Plan

> "Tôi đã dậy nên từ giờ chuyển qua PTA Plan làm code nhé, 2 session dự bị nếu cần thì archive đi"

ĐÃ CHỐT: hết chế độ qua đêm của lời 21. Từ nay việc CODE (logic, lỗi, giao diện) → PTA Overhaul viết plan gửi **PTA Plan** giao, rà, merge. PTA Overhaul giữ: đề bài, thiết kế, plan, rà theo đề bài, tự giao session mockup (lời 15). Đã archive hai session dự bị (`du-bi-1` — #1568 đã merge; `du-bi-2` — #1562 đã merge).

## 14/11 sáng — lời 24 (chủ SP nói trong session mockup ⑤, session đó chuyển lại): dòng việc một dạng · "Chấm Speaking"

> "1. Kể cả những trường hợp chỉ có 1 học sinh, thì vẫn để mọi thứ đồng bộ theo form ở bảng công việc: Lớp - Tên công việc ngắn gọn như hiện tại. 2. Không cần ghi là 'việc chung của nhóm GV Speaking' - Ghi là 'Chấm Speaking' là được rồi"

ĐÃ CHỐT (thay lời 11 và `04-thiet-ke.md` 5.5 ở phần chữ đầu tab; áp cho mockup ①–⑤ và khi code):
1. **Dòng việc luôn một dạng "Lớp · tên việc ngắn"**, kể cả việc của MỘT em (vd "MB FT 101 · Reading", "MB FOU 12 · Xác nhận xử lý"); tên em là thẻ phụ (link) cạnh tuần / số bài / SOS. Bỏ dạng "đầu em + cây việc". Em con trong dòng gộp "n em" vẫn đứng đầu bằng tên em.
2. Dải đầu tab / nhóm ghi **"Chấm Speaking"** — không ghi "Việc chung của nhóm GV Speaking".
Đã áp ở mockup ⑤ (#1558). Mockup ① (đã merge) còn dạng cũ → code theo lời này, không vẽ lại.

## 15/11 — lời 25 (chủ SP nói trong session mockup ②; session đó THUẬT LẠI, nguyên văn ở `thiet-ke/v21/ho-so-lop-ghi-chu.md` mục 0 trên PR #1560)

Theo session mockup ② (chủ SP đã duyệt "làm đi" trong session đó) — áp cho hồ sơ lớp:
1. Phần mở rộng một em giữ đúng khung web hiện tại (Điểm theo lượt │ thẻ Kỹ năng → Điểm · Case · PA · Kết quả PA); nâng cấp: bấm ô điểm trên hàng mở sẵn đúng kỹ năng (ô có viền); thẻ kỹ năng có việc quá hạn của người xem mang ⚠.
2. Lớp thường dùng CÙNG khung (đơn vị là Môn: Progress / Final, %, kỳ vọng 70 %, Bổ trợ miễn phí, Mini Test) — thay khối "Case đang mở" 08/11.
3. Bỏ TVV khỏi đầu trang hồ sơ lớp và khỏi dòng "TVV …" dưới tên em; TVV ghi nhỏ ở đầu khối trái của phần mở rộng.
PTA Overhaul CHƯA tự áp sang hồ sơ HV (mockup ③): session ② đề xuất "TVV không ở đầu" cho cả hồ sơ HV, nhưng đó là đề xuất của session, không phải lời chủ SP → hỏi chủ SP.

## 15/11 — lời 26: TVV ở hồ sơ HV giữ

Câu hỏi của PTA Overhaul: hồ sơ học viên (mockup ③) có bỏ TVV khỏi đầu trang như hồ sơ lớp không.

> "không bỏ ở Hồ sơ HV"

ĐÃ CHỐT: hồ sơ HV GIỮ TVV ở dòng thông tin đầu hồ sơ. Việc bỏ TVV (lời 25 ý 3) chỉ áp cho hồ sơ lớp. Mockup ③ không đổi.

## 15/11 — lời 27 (chủ SP nói trong session mockup ⑤; session đó chuyển lại): duyệt mockup ⑤

> "ok rồi nhé"

Theo session mockup ⑤: chủ SP trả lời câu này về mockup ⑤ bản đã sửa (dòng việc một dạng, "Chấm Speaking", chuông dáng 11/11). PTA Overhaul ghi nhận là **mockup ⑤ ĐÃ DUYỆT** (`thiet-ke/v21/bang-mau.html`, PR #1558 đã merge) — chủ SP báo lại nếu hiểu sai.

## 15/11 — lời 28 (chủ SP nói trong session mockup ③; session đó chuyển lại nguyên văn): duyệt mockup ③ kèm 3 chỉnh

> "1. 'Không cần theo dõi' cũng thành nút hẳn nhé, mờ hơn chẳng hạn nhưng đừng để mỗi một dòng chữ như vậy
> 2. 'Xác nhận xử lý' cũng nên là một nút hẳn, không để là chữ
> 3. Cấp bậc xử lý vi phạm có progress bar khá ok nhưng cần làm nổi bật hơn phần WL1 và WL2 nhé
> 4. Còn lại duyệt, những panels, nút các thứ cần đồng bộ với những chỗ cần động bộ khi code nhé"

ĐÃ CHỐT: **mockup ③ hồ sơ HV ĐÃ DUYỆT** (`thiet-ke/v21/ho-so-hv.html`, PR #1559 đã merge, 3 chỉnh đã vào mockup). Áp chung khi code (ý 4): "Không cần theo dõi" và "Xác nhận xử lý" là NÚT (không là chữ link) ở mọi nơi có chúng — tab Ý thức lớp, panel Công việc, hồ sơ HV; thang cấp bậc vi phạm làm nổi WL 1, WL 2 ở mọi nơi hiện thang; panel / nút / dòng việc / dòng quy chế dùng chung một bộ thành phần (mockup ⑤).

## 15/11 — lời 29 (chủ SP nói trong session mockup ④; session đó chuyển lại): duyệt mockup ④

> "Duyệt mockup rồi nhé"

ĐÃ CHỐT: **mockup ④ trang đầu TVV ĐÃ DUYỆT** (`thiet-ke/v21/trang-dau-tvv.html`, PR #1557 đã merge; bản đã áp lời 24). Các [XM] của mockup này chưa có lời riêng → làm theo đề xuất trong tệp ghi chú, trừ khi chủ SP nói khác.

## 15/11 — lời 30 (chủ SP nói trong session mockup ②; session đó chuyển lại): duyệt mockup ②

> "duyệt nhé"

ĐÃ CHỐT: **mockup ② hồ sơ lớp ĐÃ DUYỆT** (`thiet-ke/v21/ho-so-lop.html`, PR #1560 đã merge; bản cuối gồm chip mở thẳng panel, bỏ badge trùng với GV, phần mở rộng em theo web, lớp thường cùng khung, bỏ TVV ở đầu trang). Cả năm mockup ①–⑤ đã duyệt → plan giao diện đợt 2: `09-plan-giao-dien-dot-2.md`, gửi PTA Plan.

## 15/11 — lời 31: merge mockup, archive, bàn giao sang session overhaul plan mới

> "merge xong hết mockup archive hết những gì đã xong và cho tôi prompt bàn giao sang session overhaul plan mới"

Đã làm: năm mockup ①–⑤ đã merge (#1544 / #1547, #1560, #1559, #1557, #1558); archive bốn session mockup + hai session dự bị; plan giao diện đợt 2 (`09`) đã gửi PTA Plan; prompt bàn giao đưa chủ SP trong chat. Session planning mới đọc thư mục này theo thứ tự: `loi-chu-sp.md` → `04-thiet-ke.md` (mục 12–14 thắng mục 5) → `05`, `07`, `09` (plan) → `08-bao-cao-sang.md` (17 câu hỏi còn mở) → `luat/`.

## 15/11 — lời 32 (session PTA Overhaul mới): ba chỗ tài liệu ↔ mã lệch

Câu hỏi của PTA Overhaul (câu 12, 13, 14 ở `08-bao-cao-sang.md`): (1) MT0 gõ "-": mã chỉ ghi vắng, Rulebook ghi áp luật vắng như Mock — theo bên nào (PTA đề xuất theo mã); (2) việc Bước tiếp sau thi: N6 "TVV của em", mã cho mọi TVV cùng chi nhánh — đề xuất theo mã; (3) xoá học viên / lớp trống: Rulebook "chỉ Quản trị", mã cho QL — đề xuất theo mã.

> "1. áp luật vắng như mock
> 2. theo đề xuất
> 3. theo đề xuất
>
> 3 câu nhỏ hơn hỏi luôn và cho đề xuất đi"

ĐÃ CHỐT:
1. **MT0 gõ "-" áp luật vắng như Mock** (lần 1 dời sang tuần sau, lần 2 huỷ — N38) — BÁC đề xuất của PTA; mã phải sửa (nay chỉ ghi dấu, không dời, hết tuần thành "Không dự thi") → LG-9 ở `05-plan-logic-luat.md`, gửi PTA Plan.
2. **Việc Bước tiếp sau thi: giữ như mã** — việc giao cho TVV của em, mọi TVV cùng chi nhánh làm thay được. Sửa chữ N6 trong tài liệu.
3. **Xoá học viên / lớp trống: QL làm được** (giữ như mã; có Thùng rác 30 ngày). Sửa chữ Rulebook.
Câu 1–11 ở `08`: coi là đã chốt theo năm mockup đã duyệt (lời 27–30). Còn hỏi: câu 15, 16, 17.

## 15/11 — lời 33: ba câu nhỏ (câu 15, 16, 17 ở `08`) theo đề xuất

Đề xuất của PTA Overhaul: (15, đụng luật N5) thẻ "Thu hồi xử lý vi phạm" hết 5 ngày QL chưa duyệt → tự chốt theo GVCN, như thẻ xử lý; (16) chip "Việc cần làm" quá hạn: giữ như mockup, mọi loại việc một dáng (⚠ + đỏ), không tách riêng Nhập điểm; (17) badge tab "Chấm Speaking": badge mờ (số bài) + ⚠ khi có bài quá hạn, không đỏ, không cộng vào badge menu.

> "Theo đề xuất hết"

ĐÃ CHỐT:
1. **Thẻ "Thu hồi xử lý vi phạm" hết hạn duyệt (5 ngày, theo Hạn mặc định) mà QL chưa duyệt → tự chốt theo GVCN** (thu hồi có hiệu lực: dòng "Đã thu hồi", bậc tính lại, TVV đã báo thì có việc "Báo lại PH") — như thẻ xử lý vi phạm (D3). ĐỔI luật đang chạy (nay chờ mãi) → LG-10 ở `05-plan-logic-luat.md`, gửi PTA Plan.
2. **Chip "Việc cần làm" quá hạn: giữ như mockup** — mọi loại việc cùng một dáng ⚠ + đỏ.
3. **Badge tab "Chấm Speaking": mờ (số bài) + ⚠ khi có bài quá hạn**; không đỏ; không cộng vào badge menu / chuông. Thắng hình mockup ① (badge đỏ "6", [XM-2]). Ghi ở `04-thiet-ke.md` mục 15.
Cả 17 câu ở `08-bao-cao-sang.md` đã có trả lời.

## 15/11 — lời 34: mockup các màn còn lại · rà đồng bộ · nâng cấp (kể cả Phân tích)

Bối cảnh: chủ SP hỏi "không còn mockup nào cần làm nữa hả?"; PTA Overhaul trả lời theo plan thì hết (các màn còn lại chỉ làm gọn mật độ ở GD-10, không mockup), đề xuất làm thêm mockup Học viên & Lớp và Lịch Test tuần.

> "1. Luôn nhớ là cần đồng bộ những chỗ cần đồng bộ, với những gì tôi đã chốt tất nhiên. Làm mockup những phần còn lại đi.
> 2. Rà soát xem có chỗ nào tôi đã chốt ở các mockup trước rồi chưa đồng bộ, hoặc đơn thuần là chỗ nào cùng chức nằng mà chưa có tính đồng bộ thì cũng làm luôn nhé, gửi ảnh tôi xem trước xem có cần sửa gì không
> 3. Nững chỗ bạn đề xuất làm mockup nâng cấp bạn cứ mockup nhé, phần phân tích cũng xem lại xem bạn thấy ổn chưa, nâng cấp được gì thì cũng brainstorm làm nhé /superpowers:brainstorming"

PTA Overhaul hiểu:
1. **Làm mockup cho các màn còn lại** (nay ở GD-10 chỉ "làm gọn mật độ, không mockup"): Học viên & Lớp · Test (Lịch Test tuần, Kế hoạch Test, trang lượt) · Phân tích · Quản trị · Hồ sơ GV · Lưu trữ · Tổng quan QL / Admin / CX. Luật xuyên suốt: **chỗ cần đồng bộ thì đồng bộ, theo đúng những gì chủ SP đã chốt**.
2. **Rà đồng bộ:** (a) điều đã chốt ở mockup ①–⑤ / lời 17–33 mà mockup nào đó chưa theo; (b) chỗ cùng chức năng mà dáng / cách làm chưa giống nhau (kể cả chưa có lời chốt). Sửa luôn vào mockup, **gửi ảnh chủ SP xem trước** khi coi là xong.
3. **Nâng cấp:** các màn PTA Overhaul đề xuất (Học viên & Lớp, Lịch Test tuần) cứ làm mockup; **Phân tích** xem lại, thấy nâng cấp được gì thì brainstorm rồi làm.
Hệ quả cho plan: GD-10 ("không mockup") chờ đợt mockup này; `09-plan-giao-dien-dot-2.md` sẽ sửa sau khi mockup được duyệt.

## 15/11 — lời 35: duyệt 6 mockup đợt 2 kèm chỉnh

Bối cảnh: PTA Overhaul gửi kết quả rà (`10-ra-dong-bo.md`) và đề xuất 6 mockup: ⓪ sửa đồng bộ ①–⑤ · ⑥ Học viên & Lớp (tab Lịch thi có badge số việc, việc thành nút-chip) · ⑦ Test · ⑧ Tổng quan QL / Admin / CX + Hồ sơ GV · ⑨ Phân tích (chỉnh, thêm ô "Sắp thi · còn SOS") · ⑩ Quản trị + Lưu trữ; tự quyết tên bậc viết "Report 1", "WL 1".

> "0: Bảng mẫu ok nhưng nên nhớ là badge công việc của nhập điểm bên cạnh chỉ ghi số thôi, không thêm chữ 'bài' nữa
> 6: Tab lịch thi không cần việc, cần thông tin về lịch thi và thông tin hiện tại cần thiết của HV thôi
> 7: oke thử mockup đi, tôi chưa hình dung ra
> 8: Gom chung cái gì được thì gom chung
> 9: Ok
> 10: Ok
>
> Tên bậc cần viết hoa hết và viết đủ ở một số chỗ cần thiết, bạn tự đề xuất"

ĐÃ CHỐT:
- **⓪** làm. **Badge / chip việc Nhập điểm chỉ ghi SỐ, không thêm chữ "bài"** ("Nhập điểm 6"). PTA áp chung: mọi nút-chip "Việc cần làm" và badge tab = chữ loại việc + số, không đơn vị.
- **⑥ Tab Lịch thi KHÔNG cần việc** (bác đề xuất badge số việc + nút-chip việc): tab này là THÔNG TIN — lịch thi + thông tin hiện tại cần thiết của HV.
- **⑦** làm mockup để chủ SP hình dung rồi mới quyết.
- **⑧ Gom chung cái gì được thì gom chung.**
- **⑨, ⑩** làm như đề xuất (⑨ gồm ô "Sắp thi · 6 tuần · còn SOS").
- **Tên bậc vi phạm: VIẾT HOA hết; viết đủ ở chỗ cần** — bác cách PTA tự quyết ("Report 1", "WL 1"). Chỗ nào viết đủ: PTA đề xuất, chủ SP duyệt ở mockup ⓪.

PTA Overhaul đề xuất (duyệt ở mockup):
- Tên bậc: luôn hoa — **REPORT 1 … · WL 1 · WL 2**. Viết đủ **"WARNING LETTER 1"** ở nơi người ta QUYẾT hoặc nơi PHỤ HUYNH đọc: thang cấp bậc (mốc WL) · panel Xác nhận xử lý / Thu hồi (dòng "Bậc kế", nút chọn) · bậc hiện tại ở khối của em trong tab Ý thức · dòng lịch sử xử lý · việc TVV "Báo PH" và Báo cáo PH / tệp xuất · Hướng dẫn "?". Viết tắt **"WL 1"** ở nơi chật: chip, cột bảng, dòng việc, badge, ô số, 375.
- Tab Lịch thi: hàng = em · lớp · lịch thi (tháng dự kiến / ngày đã chốt / chờ KQ / KQ) · thông tin hiện tại (Target, MT gần nhất, SOS, lộ trình + tuần học). Không badge việc, không cột việc. Thao tác đang có (Chốt / Sửa ngày, Đặt / Dời tháng, Ghi KQ, Bước tiếp, Sửa KQ, + Ghi chú, Hoàn tác) GIỮ — bấm thẳng giá trị để sửa / mở dưới hàng; việc tới hạn của TVV nằm ở trang Công việc của TVV.
Đề bài: `11-de-bai-mockup-dot-2.md`. Sáu session con Opus 5.5 · high.

## 15/11 — lời 36 (chủ SP nói trong session mockup ⓪; session đó chuyển lại nguyên văn): thang cấp bậc không ghi chữ WARNING LETTER

Bối cảnh: mockup ⓪ vẽ thang cấp bậc xử lý vi phạm có chữ "WARNING LETTER 1 / 2" trong thanh (theo đề xuất "viết đủ ở thang cấp bậc" của PTA Overhaul ở lời 35).

> "KHÔNG ĐỂ HẲN CHỮ WARNING LETTER vào trong progress bar, ý là chỉ để nó khác màu và nổi bật hơn thôi, vẫn đẻ progress bar như bình thường"

ĐÃ CHỐT (sửa đề xuất tên bậc ở lời 35, làm rõ lời 28 ý 3): **thang cấp bậc là thanh vạch bình thường, KHÔNG có chữ trong thanh**; mốc WL 1 / WL 2 chỉ **khác màu và nổi hơn** (vạch đỏ, đậm hơn). Tên bậc viết đủ "WARNING LETTER 1" vẫn dùng ở: danh sách bậc khi mở "Thang ▾" · panel Xác nhận xử lý / Thu hồi (dòng "Bậc kế", nút chọn) · bậc hiện tại của em ở tab Ý thức · dòng lịch sử xử lý · nội dung báo PH. Viết tắt "WL 1" ở chip, cột bảng, dòng việc, badge, 375. Áp mọi nơi có thang (hồ sơ HV, panel Xác nhận xử lý, tab Ý thức lớp).

PTA Overhaul quyết khi rà mockup ⓪ (chủ SP duyệt lại ở mockup ⓪):
- **Chân panel việc:** khi panel mở từ một danh sách còn việc kế → "Đóng" · "Lưu" · **"Lưu · việc tiếp ›"** (nút chính); không còn việc kế hoặc panel mở lẻ → "Đóng" · "Lưu". Giữ nút gộp đang có trên web (D.V12, R1-LUU-TIEP 26/10) — bảng mẫu ⑤ D2 và mockup ① ② bỏ nút gộp làm mỗi việc thêm một bấm. Thay dòng "chân panel → theo ⑤ D2" ở `10-ra-dong-bo.md` mục B.
- **Hộp Tình hình học tập từ "+ Task":** một hộp (chọn em + Nội dung + "Gửi TVV") như mockup ① K5c; ⑤ F3 sửa theo.

## 15/11 — lời 37: duyệt mockup ⓪, ⑦ · chỉnh ⑥, ⑧, ⑨, ⑩

Bối cảnh: sáu mockup đợt 2 (⓪ #1607 · ⑥ #1611 · ⑦ #1606 · ⑧ #1613 · ⑨ #1609 · ⑩ #1614) đã qua rà của PTA Overhaul, chờ chủ SP.

> "M0: ok
> M6:
> 1. Lịch thi: Dòng text bên dưới lịch thi hơi vướng, và không cần cột lộ trình đâu, còn cái chữ target trên đầu bảng để làm gì? xóa đi
> 2. Còn lại ok
> M7: duyệt
> M9: Sắp thi tính đến tháng tiếp theo thôi, ví dụ đang ở tháng 11 thì tính lịch thi đến hết tháng sau nhé. Còn lại ok
> M8: những chỗ phần ghi việc mà có text ở dưới đêm việc đúng hạn/ quá hạn đang hơi bị intrusive và loạn quá, nên nghĩ làm thế nào để hiển thị tốt hơn đi
> M10: Lưu trữ vẫn chia theo chi nhánh, và danh sách học sinh vẫn chia theo lớp, lớp số to nhất xếp lên đầu"

ĐÃ CHỐT:
- **⓪ ĐÃ DUYỆT** (sửa đồng bộ năm mockup ①–⑤) — gồm: chân panel việc giữ nút gộp "Lưu · việc tiếp ›"; tên bậc VIẾT HOA, bảng "viết đủ │ viết tắt" (⑤ H5); thang không chữ (lời 36); hộp Tình hình học tập một hộp; công thức Writing vào ⓘ. Merge #1607.
- **⑦ Test ĐÃ DUYỆT.** Merge #1606.
- **⑥ Học viên & Lớp: duyệt kèm chỉnh tab Lịch thi** — (a) bỏ dòng chữ phụ dưới giá trị lịch thi; (b) bỏ cột Lộ trình; (c) bỏ chữ "Target" ở đầu bảng. Còn lại ok (gồm lọc theo trạng thái thi, bỏ chữ đỏ "quá hạn").
- **⑨ Phân tích: duyệt kèm chỉnh** — ô "Sắp thi · còn SOS" tính **tới hết tháng kế tiếp** (đang tháng 11 → lịch thi tới hết tháng 12), không phải 6 tuần.
- **⑧ Tổng quan + Hồ sơ GV: CHƯA duyệt** — chỗ ghi việc có dòng chữ dưới số đếm đúng hạn / quá hạn "intrusive và loạn" → nghĩ cách hiển thị tốt hơn, gửi lại.
- **⑩ Quản trị + Lưu trữ: chỉnh Lưu trữ** — vẫn **chia theo chi nhánh**; danh sách học viên vẫn **chia theo lớp**, **lớp số to nhất xếp lên đầu**. (Quản trị: chưa có lời riêng → coi như ok cùng lượt.)

PTA Overhaul hiểu (chủ SP sửa nếu sai):
- ⑥ (c): bỏ cả cột Target và nhãn nhóm "Hiện tại" khỏi bảng Lịch thi (Target vẫn có khi mở hàng). Thông tin hiện tại còn MT gần nhất · SOS.
- ⑨: tính theo lịch thi của em — ngày đã chốt HOẶC tháng dự kiến — rơi vào tháng này hoặc tháng sau; nhãn ô ghi mốc cụ thể ("Sắp thi · tới hết T12 · còn SOS").
- ⑧: mỗi ô bảng chỉ còn MỘT thành phần, không dòng chữ phụ dưới số; tách cột theo đúng tên của Phân tích GV (% đúng hạn · Chưa làm); chi tiết mở khi bấm hộp.

## 15/11 — lời 38: tab Lịch thi giữ cột Target, chỉ bỏ nhãn "Hiện tại"

Bối cảnh: PTA Overhaul hiểu lời 37 ý M6 (c) là bỏ cả cột Target, cho mockup ⑥ sửa như vậy rồi hỏi lại.

> "bỏ mỗi cái nhãn hiện tại bên trên thôi, chả hiểu để làm gì, target thì luôn cần chứ"

ĐÃ CHỐT (sửa cách hiểu của PTA ở lời 37): bảng Lịch thi **GIỮ cột Target** ("target thì luôn cần"); chỉ bỏ **nhãn nhóm "Hiện tại"** phía trên các cột. Bảng: Học viên · Lịch thi · Target · MT gần nhất · SOS · Ghi chú. Cột Lộ trình vẫn bỏ; ô lịch thi một dòng.
Bài học cho các mockup khác: không đặt nhãn nhóm phía trên đầu cột khi tên cột đã tự rõ; Target của em là thông tin luôn hiện ở các bảng về thi.
Trạng thái mockup đợt 2: ⓪ #1607, ⑦ #1606, ⑨ #1609 đã merge (⑨ đã sửa ô "Sắp thi · tới hết tháng sau", gồm cả tháng dự kiến) · ⑥ #1611 đang sửa lại theo lời này · ⑧ #1613, ⑩ #1614 đang sửa theo lời 37.
