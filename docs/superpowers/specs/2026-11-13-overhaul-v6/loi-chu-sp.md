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
