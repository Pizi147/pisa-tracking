# PISA Tracking — Prompt triển khai theo ưu tiên, chuẩn bị deploy và cải thiện UX

**Ngày tổng hợp:** 26/10/2026, giờ Việt Nam.  
**Repository:** `Pizi147/pisa-tracking`.  
**Mốc mã nguồn đã đối chiếu:** `main` tại `10cbbad06826e8ba200ff03dc5366d660c05a418`, sau PR #587.  
**Cách dùng:** gửi nguyên file này cho Claude Code trong repository. Đây là yêu cầu brainstorm, lập kế hoạch và thực hiện theo từng giai đoạn; không chỉ trả lời bằng một bản đề xuất.

---

## 0. Nhiệm vụ của bạn

Bạn phụ trách cả logic sản phẩm, workflow, UX/UI và chất lượng triển khai của PISA Tracking. Hãy đọc toàn bộ prompt, kiểm tra `main` mới nhất, đối chiếu mockup, quyết định của chủ sản phẩm và code thật, rồi triển khai theo thứ tự:

**1 → 2 → 3 → mốc sẵn sàng deploy sớm → 4 → 5 → 6.**

Tôi muốn deploy khá sớm. Vì vậy, không để overhaul hồ sơ hoặc toàn bộ hệ thống panel trở thành điều kiện phải hoàn thành trước lần phát hành đầu. Tuy nhiên, lỗi có bằng chứng về mất dữ liệu, sai quyền, sai điểm hoặc migration nguy hiểm trong phạm vi release phải được xử lý trước phát hành, dù phát hiện ở phần khác.

Mục tiêu xuyên suốt: **logical, workflow đơn giản, nhẹ nhàng, intuitive, simple**. Người dùng nhìn vào phải biết mình đang xem gì, vì sao cần xử lý, ai làm, cần làm gì và khi nào xong. Đừng làm giao diện “gọn” bằng cách giấu mất thông tin cần thiết, thu nhỏ chữ, hoặc buộc người dùng mở nhiều tầng mới làm được việc.

Bạn được chủ động bổ sung ý tưởng ngoài sáu mục nếu có ích. Hãy phân biệt rõ:

- Yêu cầu mới đã chốt trong prompt này.
- Luật nghiệp vụ cũ còn hiệu lực.
- Lỗi đã kiểm chứng bằng code hoặc chạy thử.
- Phản ánh của chủ sản phẩm cần tái hiện.
- Đề xuất mới để xem xét, chưa phải quyết định sản phẩm.

Không cần hỏi lại những điều đã rõ. Hãy tự giải quyết lựa chọn kỹ thuật thông thường và báo ngắn gọn những gì bạn đã tự quyết. Nếu còn câu hỏi thực sự làm thay đổi kết quả nghiệp vụ, gộp tối đa bốn câu với một khuyến nghị mỗi câu; vẫn tiếp tục phần công việc độc lập.

## 1. Hiện trạng đã rà soát để bạn bắt đầu đúng chỗ

### 1.1. Phạm vi và độ chắc chắn

Bản tổng hợp này đã đọc mã nguồn chọn lọc của router, nhập điểm, Lịch Test, hồ sơ HV/Mock Test, Case, panel, chart, dịch AI; đối chiếu các quyết định V5/V6, kế hoạch hiện hành và PR đang mở. Đã xem trực quan ảnh mockup và ảnh đối chiếu mockup–web được lưu trong repository.

**Chưa đăng nhập và thao tác trên production; chưa xác nhận SHA production; chưa chạy build, test suite hoặc end-to-end của toàn ứng dụng.** Ảnh trong repo là bằng chứng thiết kế/ảnh nghiệm thu tại thời điểm chụp, không phải ảnh trực tiếp của production ngày 26/10. Không được dùng báo cáo này để tuyên bố toàn website đã được kiểm thử.

Khi bắt đầu, ghi riêng: SHA `main`, SHA nhánh triển khai, SHA đang chạy nếu xác minh được. Các ghi chú deploy trong `plan.md` có nhiều lớp lịch sử; không lấy một dòng cũ làm kết luận phiên bản đang chạy.

### 1.2. Những điểm đáng chú ý trên snapshot

| Mã | Hiện trạng đã thấy | Ý nghĩa cho công việc lần này |
|---|---|---|
| HT01 | `HopNhapDiem.tsx` vẫn có nhãn “Lưu · em tiếp ›”; nút tiếp phụ thuộc `onTiep` do caller truyền. | Đổi nhãn là chưa đủ. Cần rà cơ chế chọn bài tiếp ở mọi điểm vào. |
| HT02 | `LuoiFT.tsx` và `MotKyNang.tsx` tìm **hàng phía sau, cùng kỹ năng, ô sửa được**; hết hàng thì đóng. Predicate đang thấy không yêu cầu ô đó còn thiếu band. | Có cơ sở để yêu cầu hàng đợi bài còn cần nhập, không chỉ “em tiếp”; chưa thấy nhánh chuyển sang kỹ năng khác trong các callback này. |
| HT03 | Trong `HopNhapDiem`, nhánh `luu(false)` chọn `onDong`. Trong khi DESIGN V5 nêu “Lưu ở lại”. | Kiểm chứng hành vi tại từng caller; chốt lại một quy ước nhất quán, tránh nút cùng tên mà đóng/chuyển khác nhau. |
| HT04 | Chưa thấy điều kiện ẩn nút tiếp trực tiếp dựa trên điểm đạt kỳ vọng trong phần footer của `HopNhapDiem` đã đọc. | “Đạt kỳ vọng thì chỉ còn Lưu” là phản ánh cần tái hiện theo đúng màn, vai, callback và kết quả refetch; không đoán nguyên nhân do ngưỡng điểm. |
| HT05 | Test hiện có các thành phần `ChamTestTab`, `LichTestTab`, `KeHoachTestTab`; Lịch Test dùng `HangLop`, lưới nhúng và số liệu tiến độ. | Ưu tiên cấu trúc hiện tại và mockup `dieu-chinh-cuoi.html` khu a. Không phục hồi bố cục ba khung cũ chỉ vì một nhận xét nhắc tới nó. |
| HT06 | V5 có nền dùng lại: bảng, badge, ô số, `KhungPanel`, `NganDanhSach`, `PanelViec`, `NganCase`, lưu nháp theo việc và `luuRoiTiep`. | Nâng cấp trên nền này; không dựng một framework panel hoặc hàng đợi lưu thứ hai khi chưa có nhu cầu thực. |
| HT07 | `NganDanhSach` đã hỗ trợ ngữ cảnh, hạn, người làm, điểm, mở việc tại chỗ và trở lại danh sách. `NganCase` đã có các view Case/PA/kết quả và bước tiếp. | Không mô tả toàn bộ panel hiện nay là “chỉ có tên”. Tìm đúng caller đang trả thiếu dữ liệu hoặc nối luồng chưa tốt; giữ phần đang làm đúng. |
| HT08 | Hồ sơ HV đã có các ô Overall/kỹ năng, chart theo kỹ năng, Tiến độ trên lớp, Case & PA và bảng Mock Test. | Làm rõ thứ bậc và nguồn dữ liệu; không mặc định phải thêm dashboard hoặc biểu đồ mới cho mọi phần. |
| HT09 | P3 UI-CHUNG #573 đã bỏ cách xem Góp ý hàng tuần khỏi giao diện chính; dữ liệu/route lịch sử được giữ. | Yêu cầu mới về góp ý tuần phải được thiết kế lại có chủ đích. Không khôi phục nguyên bảng cũ rồi tạo thêm một chỗ nhập trùng Tiến độ trên lớp. |
| HT10 | P14 DICH #580 đã merge. Có `server/src/dich/dich.ts`, `ChuDich.tsx`, cấu hình máy chủ, cache, hạn mức và kiểm quyền theo nguồn. | Công việc là rà, hoàn thiện, cấu hình và kiểm chứng kích hoạt; không xây lại tích hợp dịch AI từ đầu. Chưa xác minh đã bật ở production. |
| HT11 | P7 #582, P9b #583, P9a #584 đã được ghi nhận vào main. P8 mới có plan qua #587; PR #586 P13 KET-PET còn mở lúc rà. | Kiểm lại trước khi làm, tránh đụng việc đang triển khai. Chart/queue cần biết phạm vi môn đăng ký và thang điểm thực sự đã có trên nhánh release. |
| HT12 | `shared/i18n/en/nenPanel.ts` còn “Lưu và tiếp” → “Save and next”. | Đây là ví dụ cụ thể cần biên tập EN theo hành vi, không chỉ rà thiếu key. |

### 1.3. Nhận xét trực quan từ mockup và ảnh trong repo

1. **Lịch Test:** mô hình tuần → lớp → bảng HV hợp lý, nhưng các dải nhóm, hàng lớp và đầu cột lưới đều dùng nền gần nhau; khi nhiều lớp mở, ranh giới cấp thông tin dễ bị lẫn. Cải thiện thứ bậc sẽ hiệu quả hơn thêm khung.
2. **Chấm Test:** danh sách việc bên trái và vùng xử lý bên phải phù hợp. Ảnh web có nhiều nhóm quá hạn và bảng nhỏ trong vùng làm việc; cần làm rõ “đang chấm lớp/lượt/kỹ năng nào” và bước sau lưu. Không chỉ làm đẹp vùng nhập mà bỏ qua danh sách nguồn.
3. **Hồ sơ HV:** các ô điểm đầu trang và chọn kỹ năng là nền tốt. Chart tuần dành nhiều diện tích cho ít điểm; bên dưới tiếp tục có Tiến độ, Case/PA và bảng MT. Cần tổ chức để vừa xem nhanh vừa tra lịch sử, không lặp cùng thông tin ở nhiều khối.
4. **Case/PA:** ảnh web đã có nhiều thông tin hữu ích nhưng xếp hộp trong hộp, nhiều tiêu đề và nhiều tầng màu. Nên tách rõ thông tin nền, việc cần làm và lịch sử; không cắt mất nội dung để giảm chiều cao.
5. **Panel báo cáo:** mockup Phân tích đã có tử/mẫu, điểm, kỳ vọng, kết quả và ngoài mẫu. Đây là ví dụ tốt để tái sử dụng, không phải thứ cần xóa toàn bộ.
6. Một số ảnh mockup cũ còn chữ “nhận xét bắt buộc ≥10 ký tự” hoặc cấu trúc cũ. **Không sao chép luật trong ảnh cũ** khi N8/N9 và quyết định mới đã thay đổi.

## 2. Luật làm việc và xử lý xung đột

### 2.1. Đọc nguồn theo thứ tự

Đọc `CLAUDE.md`, `plan.md` (đặc biệt 1.1–1.6 và việc chưa làm), Rulebook, `DESIGN.md`, đặc tả liên quan; đối chiếu code và quyết định mới nhất. Mockup V5/V6 không có nghĩa cùng một trạng thái: ghi rõ tham chiếu, đã duyệt, đã triển khai, bị thay thế hay chưa rõ.

Prompt này là ý kiến mới của chủ sản phẩm. Nó cập nhật **ưu tiên phát hành, hành vi tiếp việc, hướng cải thiện panel, hồ sơ và góp ý tuần**. Nó không cho phép tự thay công thức điểm, quyền, hạn nghiệp vụ, dữ liệu lịch sử hoặc quy tắc SOS.

Giải quyết ngay các xung đột sau trong decision log:

| Xung đột | Cách hiểu áp dụng lần này |
|---|---|
| Luật cũ “deploy sau toàn bộ overhaul” so với muốn deploy sớm | Chuẩn bị mốc phát hành sau 1–2–3 khi đủ an toàn. 4–5–6 có thể phát hành sau; không tự deploy. |
| Luật cũ “tinh chỉnh, không làm lại” so với yêu cầu overhaul 4–5–6 | Được thiết kế lại các phần được yêu cầu; giữ dữ liệu, năng lực đang có và logic đã chốt. Không đổi toàn bộ hệ nhận diện ngoài nhu cầu. |
| V5 C22/V11 “số → panel chỉ đọc” so với yêu cầu làm việc nối tiếp trong panel | Panel chỉ số vẫn phải giải thích đúng số liệu. Từ dòng phù hợp, người có quyền được mở việc liên quan ngay trong cùng panel; báo cáo tổng hợp không tự biến thành form. Không dùng luật “chỉ đọc” làm lý do bắt redirect một việc có thể làm tại chỗ. Ghi rõ quy tắc mới ở DESIGN/plan sau khi chốt thiết kế. |
| Góp ý tuần đã được gỡ so với yêu cầu xem lại | Được brainstorm và mockup cách đưa góp ý tuần vào trải nghiệm mới, ưu tiên một nguồn nhập/đọc với Tiến độ trên lớp. Việc bật lại quyền ghi, chuyển dữ liệu hay tạo việc nhắc mới cần quyết định rõ; không suy ra từ yêu cầu làm đẹp. |
| “Panel đủ dài” so với khung gọn cũ | Được rộng/dài theo nội dung và có cuộn; không cắt văn bản cần thiết. Vẫn vừa viewport, dùng được trên điện thoại, giữ nút thao tác dễ thấy và có phân trang khi cần. |
| Yêu cầu nhiều ý tưởng so với luật cũ “một khuyến nghị” | Đưa 2–3 phương án khác biệt thật cho các overhaul lớn, rồi chỉ rõ một phương án khuyến nghị. Không bắt chủ SP tự ghép mọi lựa chọn. |

### 2.2. Giữ các bất biến nghiệp vụ

- Quyền = vai + phạm vi + phân công/kỹ năng + mốc hiệu lực; UI không thay kiểm quyền máy chủ. GVCN không mặc nhiên có quyền nhập mọi môn.
- Điểm chính thức, teacher estimate, Bài/Tiến độ trên lớp và S Ex phải tách đúng bản chất. Không đưa dữ liệu phụ vào Overall, SOS hoặc KPI trái luật.
- N9: ô nhập điểm xong khi có band; thiếu nhận xét/nhóm nguyên nhân chỉ nhắc theo luật, không tạo nợ chấm và không chặn Lưu. Các nhiệm vụ Case riêng thực sự bắt buộc vẫn giữ.
- N8: nhận xét và mô tả Case chỉ đồng bộ theo cơ chế đã chốt; khi đã sửa riêng mô tả thì không tự ghi đè. Speaking chấm chéo giữ bước xác nhận đúng người.
- N4/N15: “Vắng”, dời/hủy/khôi phục, lịch MT cuối tuần và các ngoại lệ giữ đúng luật. Không coi “không chặn cứng” là bỏ mọi kiểm tra cần thiết.
- N13/N22: môn đăng ký chỉ áp FT theo quyết định hiện hành; môn không học không thành thiếu điểm. Không tự tạo Overall đủ bộ môn khi dữ liệu không đủ.
- N16: tiêu chí W/S số nguyên 0–9, band/Overall vẫn x.5; không sửa lại dữ liệu cũ bằng migration chỉ vì chỉnh UI.
- P12: kỳ vọng/Target lịch sử theo dữ liệu đã chốt tại thời điểm phù hợp; không lấy Target hiện tại tô lại toàn bộ quá khứ.
- N17/N20–N22: giữ quyết định Cuối khoá/Xét lại, quyền QL/GVCN, thời hạn và ngoại lệ MT0. Dùng lại không gian đã triển khai.
- Ngày nghiệp vụ, mã tuần và múi giờ Việt Nam dùng helper hiện có; không trộn giờ thật vào demo hoặc tự đổi nghĩa tuần.
- “Thi” là thi thật, “Test” là kiểm tra nội bộ; một khái niệm một tên. Giữ thuật ngữ đã chốt, chỉ sửa EN hoặc đổi nhãn VI khi có lý do trong phạm vi.
- Không âm thầm xóa dữ liệu, lịch sử, thao tác xuất/Excel, sửa sau lưu, hoàn tác/khôi phục hoặc khả năng truy cập của một vai đang được phép.

### 2.3. Skills và cách triển khai

Kiểm skill thực sự có trước khi gọi. Không báo đã dùng skill hay chạy review nếu không có kết quả.

| Công việc | Skill/công cụ cần dùng hợp lý |
|---|---|
| Rà hiện trạng, chọn thiết kế | `karpathy-guidelines`; `superpowers:brainstorming`; `impeccable critique` ở chế độ Operate; `ui-ux-pro-max` nếu có và giúp được quyết định |
| Kế hoạch PR | `superpowers:writing-plans`, nêu giả định, đầu ra và test kiểm được |
| Thực hiện | `superpowers:executing-plans`; `ponytail` theo CLAUDE; PR UI dùng `/ponytail lite`; TDD/debugging cho logic và lỗi có hành vi kiểm được |
| UI | `impeccable clarify`, `layout`, `harden`, `adapt`; `polish` chỉ khi thực sự overhaul trong phạm vi |
| Trước PR | `/ponytail-review`; `impeccable audit` và `web-design-guidelines` cho phần UI thay đổi |
| Rà sâu | `/security-review` khi đổi quyền/dịch AI; `/code-review high` khi sửa lưu điểm, dữ liệu, migration hoặc luồng chính |

Không cài plugin mới chỉ vì “sử dụng tất cả skills”. Chọn đủ kỹ năng cần thiết, không chạy mọi skill theo nghi thức. Không dùng skill để ép thêm bước, animation hoặc kiến trúc nặng. Giữ quy định không dùng Fable của repository; không tự nhận đã chạy bằng model nào nếu không kiểm được.

Làm việc theo PR nhỏ, server/shared trước nếu cần, rồi từng màn. Đừng tách những thay đổi phụ thuộc chặt thành PR không thể kiểm chứng; cũng đừng gom cả sáu mục thành một PR khổng lồ.

Trước mỗi thay đổi, trả lời bằng một impact note ngắn:

> Vấn đề xảy ra ở đâu → ai gặp → đầu ra cần đạt → dữ liệu/quyền/luồng nào bị ảnh hưởng → có gây khóa hoặc ngõ cụt không → cách đơn giản hơn → sửa sai/quay lại thế nào → test chứng minh.

## 3. Ưu tiên 1 — Lưu và bài/việc tiếp theo thực sự liền mạch

### 3.1. Hành vi mong muốn

Không chỉ đổi “Lưu · em tiếp” thành một chuỗi khác. Hãy sửa mô hình điều hướng sau lưu:

- Trong chấm điểm: dùng **“Lưu · bài tiếp”** hoặc biến thể ngắn tự nhiên, thống nhất toàn web.
- Trong xử lý công việc: **“Lưu · việc tiếp”**.
- **Lưu:** lưu thành công và ở lại ngữ cảnh đang xử lý để người dùng xem/sửa. Nếu một hộp con đóng về bảng sau lưu là chủ đích riêng, phải giải thích rõ và làm nhất quán; không âm thầm coi “Lưu” là thoát khỏi phiên làm việc.
- **Lưu · bài tiếp:** chỉ chuyển sau khi máy chủ xác nhận đã lưu; tiếp bài chưa hoàn thành hợp lệ, không phụ thuộc điểm đạt hay dưới kỳ vọng.
- Lỗi lưu: ở nguyên bài, giữ toàn bộ điểm/nhận xét/lý do, focus hoặc chỉ rõ ô lỗi; không đổi học viên/kỹ năng.
- Hết kỹ năng hiện tại nhưng chính GV còn bài ở kỹ năng khác được phân công: chuyển tới bài còn thiếu ở kỹ năng đó trong cùng phạm vi làm việc.
- Hết bài trong phạm vi: hiện “Đã xong phần của bạn” và tóm tắt ngắn. Nếu còn việc chấm khác ngoài phạm vi, cho “Việc tiếp” rõ ràng. Không nói “đã chấm xong cả lớp” khi GV khác vẫn còn bài.
- “Chưa có thay đổi” không được báo là đã ghi dữ liệu mới. Cho đi tiếp nếu bài hiện tại đã hoàn thành; không bỏ qua ô trống chỉ vì người dùng bấm Lưu.

### 3.2. Quy tắc chọn bài tiếp — khuyến nghị cần hiện thực hóa

1. Chụp danh sách/định danh công việc của phiên nhập để việc vừa lưu biến mất khỏi bộ lọc không làm nhảy sai chỉ mục.
2. Ưu tiên bài còn thiếu ở **cùng kỹ năng, cùng lớp, cùng phạm vi lượt/tuần đang làm**, theo thứ tự ổn định người dùng đang thấy.
3. Nếu đang ở giữa danh sách, hết phần phía sau thì tìm các bài còn thiếu phía trước trong cùng phạm vi; không bỏ sót chỉ vì vị trí bắt đầu.
4. Hết kỹ năng đó → kỹ năng khác GV được phân công còn thiếu trong cùng phạm vi. Tôn trọng kỹ năng/lượt riêng của từng HV, không giả định cả lớp cùng MT.
5. Hết phạm vi này → công việc chấm tiếp theo của chính người xem theo thứ tự danh sách Công việc/Chấm Test hiện hành. Không tự nhảy sang Case, việc quản lý hoặc lớp khác khi nhãn nút chỉ nói “bài tiếp”. Có thể đổi CTA sang “Việc tiếp” để người dùng chủ động tiếp tục.
6. Bỏ qua bài đã đủ điểm, ô không thuộc môn đăng ký, ô không có quyền, ô hủy/không còn hợp lệ. “Vắng” xử lý theo trạng thái nghiệp vụ, không tự biến thành bài cần chấm lại của tuần cũ.
7. Nếu bài tiếp vừa được người khác làm hoặc quyền vừa thay đổi, tải lại phạm vi tối thiểu và chọn mục hợp lệ tiếp theo; không lặp vô hạn, không mở ô chỉ đọc làm ngõ cụt.

Đây là quy tắc mặc định đề nghị. Nếu code hiện có đã giải quyết tốt một phần, dùng lại. Tránh xây hệ thống task engine mới chỉ để giải quyết vài callback.

Hiển thị đích tiếp theo ngắn trong vùng phù hợp, ví dụ “Tiếp: Reading · Minh Anh”; không thêm một màn xác nhận mỗi lần chuyển kỹ năng. Khi đổi kỹ năng, đổi đồng bộ tiêu đề, cột/tab đang chọn, thang điểm và focus.

### 3.3. Điểm vào phải cùng hành vi

Rà Chấm Test, Lịch Test với lưới mở, hồ sơ lớp, panel Công việc, hồ sơ MT, mobile một kỹ năng, nhập từ đường dẫn cũ và Speaking chấm chéo. Dán Excel/bulk giữ luồng riêng phù hợp nhưng dùng chung cách xác định hoàn thành và phạm vi quyền.

Những file khởi điểm: `HopNhapDiem.tsx`, `LuoiFT.tsx`, `MotKyNang.tsx`, `ChamTestTab.tsx`, `PanelViec.tsx`, `ScoreEntry.tsx`, `MockDetailPage.tsx`, `shared/domain/khoPanel.ts`. Tìm toàn bộ caller trước khi đổi chữ ký callback.

### 3.4. Nghiệm thu

| Tình huống | Kết quả bắt buộc |
|---|---|
| Điểm dưới, bằng, trên kỳ vọng | Cùng quy tắc Lưu/tiếp; không mất nút tiếp vì đã đạt |
| Bài cuối của L, GV còn R | Lưu thành công → đúng bài R còn thiếu, focus đúng ô |
| Bài cuối phía dưới nhưng phía trên còn trống | Không bỏ sót bài phía trên |
| Hàng kế đã có điểm | Bỏ qua trong luồng chấm bài thiếu; không buộc GV mở lại |
| Thiếu nhận xét MT | Không chặn lưu/chuyển trái N9; nhắc và Case riêng vẫn đúng |
| Mạng chậm, lỗi, bấm đôi, Enter liên tiếp | Không lưu trùng, không nhảy hai bài, không mất chữ |
| Đang gõ nhận xét | Enter xuống dòng; phím tắt lưu không phá bộ gõ/IME |
| Refetch làm dòng vừa xong biến mất | Bài kế vẫn đúng, số đếm cập nhật đúng |
| Chấm chéo S, S Ex, vắng/dời, lớp thường | Đúng quyền, đơn vị, thang và hạn; không kéo nhầm vào SOS/KPI |
| P8 đã có/chưa có trên nhánh release | Không coi môn không học là nợ; không dựa vào field chưa được triển khai |
| Người khác vừa hoàn thành bài kế | Không mở mục chết, không ghi đè dữ liệu ngoài ý muốn |
| Hết phần của GV | Trạng thái kết thúc rõ, không panel trống hoặc tự đóng bất ngờ |

## 4. Ưu tiên 2 — Phân cấp bảng lịch/điểm Test rõ ràng

### 4.1. Xác minh bố cục đang dùng trước

Xác định bản đang chạy còn bố cục “ba khung lịch Test” hay đã dùng Lịch Test tuần V5. Nếu bố cục cũ không còn thuộc release, ghi “không áp dụng”, không dựng lại.

Phạm vi chính: `/test/lich`, `/test/ke-hoach`, `/test/cham`, bảng kết quả trong hồ sơ lớp và lưới nhúng liên quan. Khu Test không được lẫn với lịch thi thật.

### 4.2. Hệ phân cấp đề nghị

| Cấp | Nội dung | Cách thể hiện |
|---|---|---|
| Ngữ cảnh trang | Tuần/khoảng tuần, chi nhánh, FT/lớp thường, bộ lọc | Thanh công cụ riêng, giữ mẫu đã có; không nhét điều khiển vào tiêu đề cột |
| Nhóm | Test trong tuần, quá hạn hoặc nhóm nghiệp vụ còn dùng | Dải nhóm có tên/đơn vị rõ, khoảng cách và nền riêng vừa đủ |
| Lớp/lượt | Mã lớp, số HV, các lượt trong lớp, phần của GV, tiến độ, hạn | Hàng nhóm nổi bật hơn hàng HV; nút mở/thu và link hồ sơ lớp tách biệt |
| Đầu bảng | HV, MT/lượt, kỹ năng, kỳ vọng, Overall, kết quả | Nhỏ hơn tiêu đề lớp, cố định khi cuộn nếu phù hợp |
| Học viên/bài | Tên, đúng lượt của em, điểm, trạng thái | Nền đọc dữ liệu; tên làm mốc; điểm thẳng cột; hàng đang nhập nổi rõ |
| Chi tiết của bài | Nhận xét, nguyên nhân, lịch sử, dời/vắng, S Ex | Nằm đúng hàng/ngữ cảnh; không ngụy trang thành một HV khác |

Ưu tiên chiều cao, khoảng cách, độ đậm, thụt cấp và đường phân cách; không giải quyết bằng thêm màu cho mọi cấp. Dùng màu trên điểm/kết quả theo nghĩa hiện có, không tô cả hàng đỏ chỉ vì một môn dưới kỳ vọng.

### 4.3. Những điều phải giữ

- Một lớp có thể chứa MT khác nhau ở từng HV; hiển thị đúng, không ép thành một lượt chung.
- Các con số phải có đơn vị: HV, bài, việc, lượt. Ví dụ số bài quá hạn có thể khác số GV quá hạn; panel phải giải thích được.
- Tổng, bảng, bộ lọc, xuất Excel và drill-down cùng tập dữ liệu/quyền.
- Đang chấm, chưa chấm, đủ điểm, chờ kỹ năng, vắng, đã hủy và không học môn là các trạng thái khác nhau.
- Cột tên đủ làm mốc khi cuộn ngang. Sticky header/cột không che ô điểm, menu hoặc hộp nhập.
- Không mất Nhập điểm, Dán Excel, Xuất, lịch sử, sửa/khôi phục đang có chỉ vì mockup không vẽ.
- Mở/thu lớp không làm mất bản nháp hoặc ô lưu lỗi. Khi quay lại vẫn đúng tuần, lớp, dòng và vị trí.
- Mobile ưu tiên đọc tên–lượt–điểm–việc; có cách xem chi tiết rõ, không cần đoán biểu tượng.

Tạo hai phương án nhỏ trên **cùng dữ liệu và cùng trạng thái**: A giữ bảng hiện tại, tăng phân cấp; B chia vùng nhóm/lớp rõ hơn. Khuyến nghị A nếu đáp ứng tốt và giảm thời gian deploy. Chỉ làm B khi lợi ích thực sự rõ.

Nghiệm thu bằng 0/1/nhiều lớp, nhiều lớp cùng mở, lớp có HV khác lượt, tên dài, hàng S Ex, 50+ HV, sáng/tối, 1440/1280/375 và zoom. Đánh giá bằng việc người xem phân biệt được ngay “đây là nhóm, lớp hay HV”, không bằng cảm giác “đẹp hơn”.

## 5. Ưu tiên 3 — Hoàn thiện tiếng Anh và kích hoạt dịch AI trước deploy

### 5.1. Hai công việc độc lập

**A. Ngôn ngữ giao diện:** nhãn, lỗi, trạng thái, tooltip, thông báo, hướng dẫn, xuất dữ liệu. Dùng hệ i18n/glossary kiểm soát được.

**B. Dịch nội dung do người dùng nhập:** nhận xét Test, Case, PA, bàn giao. Dùng P14 hiện có, có nút Dịch, giữ bản gốc, theo quyền và hạn mức.

Không dùng AI mỗi lần render để dịch toàn bộ UI. Không tự dịch tên người, mã lớp, enum, khóa dữ liệu hoặc thay nội dung gốc trong DB.

### 5.2. Rà EN sau khi chốt phần UI của release

Làm 1–2 trước; sau đó rà EN cho **toàn bộ phạm vi release**, không chỉ hai nhãn mới. Các nhóm 4–5–6 sau này cũng phải có lượt rà EN cuối trước khi phát hành riêng, tránh “dịch xong rồi lại thêm hàng loạt chữ Việt”.

Lập glossary VI–EN có ngữ cảnh, nguồn quyết định và từ cần giữ nguyên. Phân biệt:

- Kỳ vọng của lượt và Target; đạt MT/Test và đạt Target thi thật.
- Test nội bộ và kỳ thi thật.
- Case, PA, tiến triển/kết quả kỳ và kết quả cuối.
- Bài chấm, lượt Test, việc của người xem và số HV.
- Người phụ trách và người thực hiện; GV bộ môn và GVCN.
- Chưa có dữ liệu, không thuộc phạm vi, vắng và không học môn.

Ví dụ cần sửa đã thấy: “Save and next” nên thành “Save & next” hoặc “Save & next assessment/task” theo hành vi cụ thể. Không tự dịch “bài” luôn thành “lesson”, hoặc “PA” luôn thành “solution” khi nghĩa là kế hoạch can thiệp.

Rà cả chuỗi ghép động, số ít/nhiều, biến nội suy, lỗi từ server, dấu thời gian, aria-label, validation, thông báo và trang hướng dẫn. Kiểm ngôn ngữ EN theo mọi vai có quyền dùng, đặc biệt GV nước ngoài; liệt kê rõ vùng chủ ý giữ VI nếu có quyết định sản phẩm, không che thiếu sót bằng fallback âm thầm.

Test key thiếu, key trùng/ghi đè, biến bị mất và chữ EN làm vỡ nút/cột/footer. Không đổi thuật ngữ bằng replace hàng loạt không đọc ngữ cảnh.

### 5.3. P14 đã có — kiểm chứng trước khi bổ sung

Code snapshot cho thấy:

- `POST /api/dich` nhận định danh nguồn, cột, ngôn ngữ đích và kỹ năng khi cần; máy chủ tự đọc chữ.
- Kiểm quyền trước đọc cache/gọi nhà cung cấp.
- Che một số tên/email/SĐT bằng placeholder, cache bản đã che, không ghi đè gốc.
- Mặc định 300 lần/ngày toàn trung tâm, 50 lần/người/ngày; cache hit không tính lượt; lượt gọi lỗi vẫn tính.
- Timeout 8 giây; không có khóa hoặc `DICH_TAT=1` thì tắt.
- Cấu hình ở `server/src/moiTruong.ts`: `OPENAI_API_KEY`, `DICH_MODEL`, `DICH_TRAN_NGAY`, `DICH_TRAN_NGUOI`, `DICH_TAT`; `DICH_GIA` chỉ dành thử nghiệm và bị bỏ qua ở bản chính.
- Snapshot đặt model mặc định `gpt-5.4-mini`; code gửi `reasoning_effort: 'none'`, trong plan cũ ghi `'minimal'`. **Đối chiếu code và tài liệu API chính thức ở thời điểm kích hoạt**, không sao chép plan cũ hoặc mặc định model nào cũng hỗ trợ cùng tham số.

Các điểm cần rà thêm có mục tiêu:

1. Prompt dịch phải giữ số, điểm, tuần, phủ định, thuật ngữ nghiệp vụ và placeholder; nội dung nhận xét là dữ liệu để dịch, không phải lệnh cho mô hình.
2. Kiểm placeholder đầu ra: mất, lặp hoặc đổi placeholder không được làm lộ/sai tên. Giữ bản gốc và báo chưa dịch được khi đầu ra không hợp lệ.
3. Bộ che dữ liệu hiện tại không đồng nghĩa ẩn danh tuyệt đối. Không gửi thêm hồ sơ, địa chỉ hoặc dữ liệu ngoài đoạn cần dịch; kiểm các mẫu dữ liệu thật đã khử nhận diện trước khi bật.
4. Không xem được bản gốc thì cũng không xem được bản dịch, kể cả cache hit, khác vai/chi nhánh hoặc sau đổi quyền.
5. Chữ gốc thay đổi trong lúc dịch: không hiển thị phản hồi cũ lên nội dung mới. Đổi học viên/Case phải reset đúng trạng thái.
6. Khi đổi glossary/prompt đáng kể, cân nhắc version cache để không giữ mãi bản dịch cũ; không mở rộng kiến trúc nếu chưa cần.
7. Hết lượt, timeout, không cấu hình, lỗi nhà cung cấp đều không làm hỏng luồng lưu/chấm. API dịch chậm không được chặn công việc chính.
8. Không tự mở rộng dịch sang Tutor, Bài trên lớp, S Ex hoặc nguồn khác nếu chưa có kiểm quyền và yêu cầu tương ứng.

### 5.4. Đầu ra bắt buộc: hướng dẫn chủ SP tự bật dịch

Viết hướng dẫn riêng, tiếng Việt đơn giản, từng bước, đúng code cuối cùng. Mỗi bước nêu **vào đâu → bấm gì → điền gì → nhìn thấy gì là đúng → lỗi thì làm gì**. Chủ SP không biết code.

Hướng dẫn phải bao gồm:

1. Tạo/chọn project API và thiết lập billing/quyền sử dụng model; nêu rõ tài khoản ChatGPT và sử dụng API là hai phần cần kiểm tra riêng. Tra tài liệu chính thức mới nhất trước khi hướng dẫn tên menu, giá, model hoặc giới hạn.
2. Tạo secret key trong project phù hợp; chủ SP tự nhập vào cấu hình máy chủ, không gửi key trong chat/PR, không đặt tiền tố `VITE_`, không để lộ trong bundle trình duyệt.
3. Tìm đúng site và environment Netlify; đặt biến dành cho Functions/runtime. Nêu đầy đủ các biến trên và giá trị mặc định từ code; không nhầm production với deploy preview.
4. Kiểm migration P14 đã nằm trong bản release và DB đích đã có bảng cần thiết. Bật nút dịch không được làm trước khi server/DB tương thích.
5. Chọn `DICH_MODEL` đã xác minh hoạt động với endpoint/tham số hiện dùng; đừng yêu cầu chủ SP đoán tên model.
6. Redeploy theo quy trình dự án, mở lại phiên nếu cờ bật nằm trong session. Nêu tình huống nút không xuất hiện do chữ cùng ngôn ngữ UI hoặc bộ đoán không chắc, không vội kết luận thiếu key.
7. Dịch một nhận xét thử không có dữ liệu nhạy cảm; kiểm Dịch → đang dịch → bản dịch → Xem bản gốc, rồi thử lỗi/hết lượt bằng môi trường thử.
8. Hướng dẫn xem usage và cảnh báo chi phí. **Hạn số lần gọi không phải trần tiền tuyệt đối**; không hứa ngân sách nhà cung cấp là hard cap nếu chưa xác minh.
9. Cách tắt nhanh bằng `DICH_TAT=1`, triển khai lại theo cơ chế môi trường thực tế; cách thay/thu hồi key khi cần, không ảnh hưởng dữ liệu gốc.

Mốc release 1 chỉ hoàn tất khi UI EN đã rà và phần dịch AI có trạng thái rõ: **đã bật và kiểm thử thật**, hoặc **code sẵn sàng, còn bước cấu hình cụ thể của chủ SP**. Không báo “đã tích hợp xong” nếu mới dùng dịch giả.

## 6. Mốc deploy sớm sau 1–2–3

Chuẩn bị release candidate sau ba ưu tiên đầu. Không tự deploy hoặc tự merge thay chủ SP ngoài quyền đã được cấp rõ trong phiên làm việc.

Checklist ngắn nhưng có bằng chứng:

- Chốt chính xác commit/phạm vi release; đối chiếu main và PR đang mở. Nếu P8/P13 chưa sẵn sàng, nêu tác động và phương án release phù hợp; không triển khai nửa schema/nửa UI.
- Xác minh các mục SUA-NO-RA, CHAM-LAI, SUA-CHAM-LAI và nợ trong plan đã xử lý hay chưa bằng code/PR; không coi ô tick cũ là nguồn quyết định.
- Test hồi quy nhập điểm/quyền/SOS/Case và luồng sau lưu; `npm run check`, build production theo script thật. Không lặp cả bộ test nhiều lần khi không có thay đổi mới.
- PR UI có ảnh đối chiếu cùng vai, cùng dữ liệu, cùng trạng thái; đủ desktop/mobile, sáng/tối theo phạm vi. Giữ cổng nghiệm thu của repo; không tự chấm phần trăm “khớp” khi chưa đánh giá.
- Danh sách migration tính từ **commit đã deploy thật** đến release candidate; backup, tập dượt trên bản sao và kiểm chạy lại an toàn. Không dùng danh sách migration cũ trong một dòng plan làm danh sách cuối.
- Kiểm tệp bằng chứng cũ/mới và cách truy cập sau đổi DB, không chỉ bảng SQL.
- Kiểm luồng demo/production, biến môi trường, key bí mật, cache và asset cũ sau deploy. Không thử phá dữ liệu production.
- Smoke test đúng các vai bị ảnh hưởng; có kế hoạch rollback code và dữ liệu tương thích, không mặc định rollback code luôn đủ nếu schema đã đổi.
- Chuẩn bị hướng dẫn deploy cho chủ SP và danh sách thao tác tay cuối cùng. Báo rõ “sẵn sàng deploy”, “còn blocker” hoặc “còn bước cấu hình”, không dùng một chữ “xong” cho mọi trạng thái.

Các đề xuất 4–5–6 tiếp tục theo thứ tự sau mốc này, không trộn vào release 1 trừ phần dùng chung tối thiểu bắt buộc.

## 7. Ưu tiên 4 — Overhaul hồ sơ Test/Mock Test

### 7.1. Làm rõ đối tượng trước khi vẽ

Phân biệt bốn việc: xem lịch/kế hoạch Test; chấm một lớp/kỹ năng; xem kết quả một lượt của một HV; xử lý Case phát sinh. Chúng có liên quan nhưng không phải cùng một trang.

Route hiện có `/mock-test/:id` và `MockDetailPage.tsx` là điểm bắt đầu. Xác minh Test lớp thường đang dùng route/component nào; không tự bịa route `/test/:id` rồi đưa vào plan như đã tồn tại.

Một hồ sơ lượt Test cần trả lời nhanh: **ai — lớp nào lúc Test — Test/lượt nào — lịch nào — điểm gì — so với mốc nào — trạng thái gì — ai cần làm gì tiếp**.

### 7.2. Ba hướng mockup

| Phương án | Cấu trúc | Phù hợp / đánh đổi |
|---|---|---|
| A — Bảng kết quả làm trung tâm, khuyến nghị | Đầu hồ sơ ngắn → tóm tắt kết quả → bảng kỹ năng → phần nhận xét/Case mở đúng kỹ năng → lịch sử | Dễ đối chiếu, ít học lại, dùng được cho nhiều thang điểm |
| B — Chọn kỹ năng, vùng chi tiết cạnh bên | Thanh điểm/kỹ năng → một vùng chi tiết điểm, tiêu chí, nhận xét và Case của kỹ năng đang chọn | Tốt khi GV xử lý một môn; phải tránh giấu kết quả toàn bài |
| C — Dòng thời gian lượt Test | Tóm tắt kết quả luôn hiện → lịch thi/chấm, lần sửa, Case/PA liên quan theo thời gian | Tốt cho truy vết; không nên làm mặc định nếu phải cuộn lâu mới thấy điểm |

Cùng một bộ dữ liệu và cùng nhiệm vụ cho cả ba; không chỉ đổi màu hoặc đổi vị trí card rồi gọi là ba ý tưởng. Có thể ghép A làm mặc định, B cho vùng xử lý và C cho lịch sử nếu không tạo thêm tầng thao tác.

### 7.3. Nội dung và hành vi

- Tên HV/link hồ sơ, lớp **tại thời điểm Test**, lượt/loại bài, lịch gốc và lịch thực tế nếu đã dời, người chấm và hạn còn liên quan.
- Bảng L/R/W1/W2/S, W tổng khi phù hợp, raw score/tiêu chí theo quyền, band, kỳ vọng **của lượt**, Overall và kết quả.
- Phân biệt thiếu điểm, không học, vắng, dời, hủy, có điểm nhưng thiếu nhận xét; không gom hết thành dấu “—”. Giữ quy ước gọn nhưng có nhãn/chi tiết tra được.
- S Ex có định danh và vị trí riêng, không tạo ấn tượng tham gia Overall/SOS.
- KET/PET hoặc thang phần trăm chỉ dùng dữ liệu/logic đã thực sự được triển khai; không quy đổi sang IELTS hoặc trộn đơn vị.
- Nhận xét theo kỹ năng, nguồn nhận xét, tình trạng xác nhận S và liên hệ Case rõ. Mở Case/PA đúng đối tượng, tránh tạo trùng.
- Một hành động chính theo quyền/trạng thái; thao tác phụ đúng chỗ. Người chỉ xem vẫn có ngữ cảnh hữu ích.
- Lịch sử sửa điểm/nhận xét và lý do truy cập được, không chiếm hết màn mặc định.
- Đi từ lớp/việc/biểu đồ sang hồ sơ rồi quay lại phải giữ nguồn, kỹ năng, bộ lọc và vị trí.

Không gom sửa logic tính điểm vào PR đổi bố cục nếu không có lỗi được chứng minh. Nghiệm thu không mất thao tác đang có, dữ liệu nhất quán với bảng lớp và hồ sơ HV, EN không vỡ, chữ dài không bị cắt mất ý.

## 8. Ưu tiên 5 — Hồ sơ học viên, chart và góp ý tuần

### 8.1. Thứ tự thông tin

Thiết kế sao cho GV/QL mở hồ sơ trả lời được trong vài giây:

1. Em đang học ở đâu, lộ trình nào, Target/kỳ vọng nào và kết quả gần nhất từ đâu?
2. Kỹ năng nào cần chú ý, so với lần trước ra sao?
3. Tôi cần làm việc gì, hạn nào; ai khác đang xử lý việc gì?
4. Đã thử phương án nào, kết quả gần nhất ra sao?
5. Muốn tra chi tiết thì mở đúng điểm/Test/Case/lịch sử ở đâu?

Giữ các vùng hiện có nếu còn hữu ích. Không tự đổi dữ liệu đầu vào của chart chỉ để vẽ đường đẹp; không đưa thông tin nhạy cảm lên đầu trang nếu vai đó không cần/không có quyền.

### 8.2. Ý tưởng chart — cần 3 phương án thật

| Phương án | Nội dung | Điểm mạnh / điều cần tránh |
|---|---|---|
| A — Một kỹ năng, các mốc Test và kỳ vọng, khuyến nghị | Chọn Overall/L/R/W1/W2/S; điểm thật theo thời gian, kỳ vọng từng lượt; nhãn lượt/ngày vừa đủ; bảng ngắn dưới chart | Dễ đọc; bỏ bớt nhãn tuần không cần thiết khi dày, không giấu khoảng thiếu |
| B — Nhiều biểu đồ nhỏ cùng thang | 4–5 chart nhỏ để so tiến triển kỹ năng; chọn một chart để xem sâu | So sánh nhanh; desktop phù hợp, mobile cần thu gọn. Không trộn band và phần trăm |
| C — Ma trận lượt × kỹ năng và chênh lệch | Hàng = Test, cột = kỹ năng; số + ký hiệu đạt/chưa đạt + chênh với lượt trước; chart nhỏ tùy chọn | Đọc chính xác, ít diện tích; không biến màu thành tín hiệu duy nhất |

Không mặc định dùng radar chart: khó đọc tiến bộ theo thời gian và khó xử lý thiếu dữ liệu. Nếu đề xuất, phải nêu nhiệm vụ cụ thể nó làm tốt hơn ba cách trên.

Các ý tưởng bổ sung đáng thử:

- Chọn điểm trên chart mở chi tiết lượt/kỹ năng tại chỗ; link riêng tới hồ sơ đầy đủ.
- Chỉ rõ nguồn/ngày của từng ô điểm đầu trang nếu các kỹ năng lấy từ các lượt khác nhau; không tạo một “Overall tổng hợp” từ các lượt khác nhau.
- Kỳ vọng lịch sử theo từng lượt, Target hiện tại là tham chiếu khác; đường đổi mốc phải đọc được, không vẽ lẫn.
- Sự kiện đổi lớp/lộ trình, bắt đầu PA hoặc thi thật là marker tùy chọn, không đưa mọi ghi chú thành nhãn chồng nhau trên chart.
- Thiếu dữ liệu là khoảng thiếu; không nối thành “không tiến bộ”, không điền 0, không tự ngoại suy tương lai.
- 0 điểm, 1 điểm, nhiều điểm cùng tuần, vắng/dời, MT0, dữ liệu trên 80 tuần, thay Target và nhiều lộ trình cần thiết kế rõ. `HanhTrinhKyNang.tsx` hiện có vòng tạo trục tối đa 80 tuần: kiểm hành vi dữ liệu dài, không kết luận lỗi production nếu chưa tái hiện.
- Có bảng dữ liệu tương đương chart cho tra cứu/bàn phím; tooltip phải mở được bằng focus/tap, không chỉ hover.

### 8.3. Góp ý tuần — thiết kế lại nhưng không tạo nhập trùng

Yêu cầu mới là xem lại cả phần góp ý tuần. Hiện P3 đã rút bảng này khỏi giao diện chính; `Tiến độ trên lớp` vẫn có hoạt động/điểm/nhận xét. Đề nghị brainstorm:

**A. Gộp trải nghiệm đọc vào Tiến độ trên lớp — khuyến nghị:** một khu vực theo tuần/kỹ năng, có điểm bài nếu có, nhận xét và người ghi. Góp ý tuần cũ hiển thị nguồn “Góp ý tuần” và chỉ đọc cho tới khi chốt cách sửa. Không ép hợp nhất bảng DB để gộp UI.

**B. Nhật ký tuần trong hồ sơ HV:** dòng mới nhất mở sẵn; lịch sử theo tuần thu gọn; ghi nhanh tại chỗ theo quyền. Phù hợp theo dõi sâu từng em, nhưng phải có lối vào từ lớp để GV không mở từng hồ sơ chỉ để ghi vài câu.

**C. Ghi nhanh theo lớp/kỹ năng:** danh sách HV, tuần và một ô ghi ngắn; nội dung xuất hiện lại trong hồ sơ. Chỉ triển khai nếu GV thực sự cần thao tác hàng loạt; không tái tạo một bảng nghĩa vụ bắt buộc chỉ vì có dữ liệu tuần.

Quy tắc chung:

- Góp ý định tính không tự thành điểm, SOS, việc quá hạn hoặc KPI.
- Không bắt buộc giáo viên ghi đủ mọi tuần hoặc mọi HV khi nghiệp vụ chưa yêu cầu.
- Một nhận xét có định danh, người ghi, kỹ năng, tuần, lớp/ngữ cảnh tại thời điểm ghi và lịch sử sửa; tránh sao chép bản ghi sang nhiều nơi rồi lệch nhau.
- Chuyển lớp/xem tuần cũ phải giữ đúng lịch sử; không chỉ lấy roster hiện tại khiến góp ý cũ biến mất.
- Nếu chỉ tổng hợp đọc từ nhiều nguồn, ghi rõ nguồn, không gọi tất cả là “góp ý tuần” khiến hiểu nhầm.
- Lưu nháp/lưu thật rõ, mạng chậm không mất chữ, đổi tuần/đổi HV không ghép nhầm phản hồi. Không bật autosave mới trái quy ước hiện hành mà chưa đánh giá.
- Không thêm AI sinh nhận xét, chấm chất lượng GV hoặc tóm tắt đánh giá HV trong đợt này nếu chưa có yêu cầu riêng.

Mockup tối thiểu: HV đủ điểm, HV ít/chưa có dữ liệu, nhiều Case/PA, nhiều lộ trình, chỉ xem, ghi góp ý/tiến độ, đang lưu/lỗi và tuần lịch sử sau chuyển lớp.

## 9. Ưu tiên 6 — Rà và nâng cấp toàn bộ hệ thống panel

### 9.1. Lập inventory trước khi viết framework

Rà toàn website: Tổng quan các vai, Học viên & Lớp, hồ sơ HV/lớp/GV, Test/lịch/chấm/hồ sơ MT, Công việc, Phân tích, Ý thức & Phối hợp, thông báo, tìm kiếm, Lưu trữ, Quản trị; Tutor kiểm theo trạng thái thực tế, không tự mở lại route đang tắt.

Tìm cả drawer bên phải, expand trong bảng, inline panel, modal, hộp con và popover. Không gọi mọi popup nhỏ là “panel dữ liệu” rồi nhét thêm thông tin thừa vào bộ chọn ngày hoặc hộp xác nhận.

Inventory phải có:

| Màn/route | Vai | Nút/số mở | Ý nghĩa và đơn vị | Component/API | Thông tin hiện có | Thiếu gì | Việc làm tại chỗ | Đường hồ sơ đầy đủ | Back/đóng/nháp | Giữ/sửa/gộp/bỏ |
|---|---|---|---|---|---|---|---|---|---|---|
| Điền từng điểm vào thực tế | | | | | | | | | | |

Tìm mọi caller của `KhungPanel`, Drawer/Dialog/Modal, `NganDanhSach`, `OSo`, `OChiSo`, `useMoSoLieu`, `PanelViec`, `NganCase`, trạng thái expand và navigation trong handler. Không chỉ grep tên “Panel” rồi tuyên bố đã rà toàn web.

### 9.2. Hợp đồng thông tin của panel

Một panel dữ liệu tốt phải có:

1. **Đầu panel:** đang xem gì, phạm vi nào, tuần/kỳ nào, đơn vị và tổng liên quan. Nếu mở từ số, danh sách phải đúng tập tạo ra số đó.
2. **Dữ liệu đủ quyết định:** đối tượng + ngữ cảnh + trạng thái + người phụ trách + hạn/kết quả liên quan. Không chỉ tên.
3. **Bước tiếp:** việc phù hợp quyền, làm ngay trong panel nếu hợp lý; hoặc lý do chưa thể làm và đường xử lý thật.
4. **Tra cứu sâu:** tên HV/GV/lớp/điểm là link tới đúng hồ sơ; có link xem đầy đủ khi hữu ích, nhưng link không phải toàn bộ giá trị của panel.
5. **Trạng thái:** tải, lỗi, rỗng, không quyền, dữ liệu vừa thay đổi, đã lưu; không đồng nhất lỗi tải với không có dữ liệu.

“Đủ thông tin” không có nghĩa tải toàn bộ hồ sơ hoặc toàn bộ lịch sử ngay từ đầu. Ưu tiên thông tin phục vụ tác vụ; phần lịch sử mở khi cần, văn bản có thể mở đầy đủ trong panel.

### 9.3. Ví dụ nội dung tối thiểu theo loại số

| Bấm vào | Panel cần cho thấy |
|---|---|
| Số GV quá hạn | GV, lớp, loại việc/bài, kỹ năng/lượt, số bài hoặc việc, hạn cụ thể, quá hạn bao lâu, nguyên nhân trạng thái nếu có, ai có thể xử lý; click tên GV mở hồ sơ |
| Số bài chưa chấm | HV/lớp, lượt Test, kỹ năng, ngày/tuần thi, người chấm/phân công, phần còn thiếu, hạn; chấm tại chỗ nếu có quyền |
| Số HV dưới kỳ vọng | HV/lớp, điểm từng môn cần thiết, Overall nếu hợp lệ, kỳ vọng của lượt, mức SOS đúng, Case/PA đang có, việc tiếp của ai |
| Số Case chưa PA | HV, kỹ năng/vấn đề, mô tả đủ hiểu, người phụ trách, trạng thái/hạn, lý do còn thiếu PA nếu dữ liệu có; thêm PA ngay trong cùng panel |
| Số PA chờ kết quả | PA và Case nguồn, người làm, kỳ cần ghi, hạn, kết quả kỳ trước, phần đang chờ; ghi kết quả tại chỗ |
| Tỷ lệ đạt Test/thi thật | Tử/mẫu, thời kỳ, mốc so, danh sách đủ điều kiện, điểm/kết luận, nhóm loại trừ rõ; drill vào hồ sơ hoặc công việc liên quan theo quyền |
| Số việc TVV hoặc bàn giao | HV/lớp, thông tin cần bổ sung hoặc kết quả cần ghi, người phụ trách, hạn, bước đang chờ; không đưa người xem sang trang lớn chỉ để tìm lại cùng việc |

Không bịa “nguyên nhân”, hạn hoặc người chịu trách nhiệm khi DB chưa có. Hiện trạng thiếu phải được ghi rõ, không thay bằng dữ liệu suy diễn.

### 9.4. Không còn panel trung gian rỗng

Nếu mở ra chỉ có một box và nút “đến trang X”, chọn một trong hai:

- Bổ sung đủ ngữ cảnh và thao tác để panel hữu ích.
- Nếu nhiệm vụ thực sự chỉ là điều hướng, biến điểm vào thành link trực tiếp, ký hiệu rõ; bỏ panel trung gian.

Không ép mọi thứ vào panel. Trang lớn vẫn cần cho phân tích sâu, toàn hồ sơ hoặc tác vụ thực sự rộng. Người dùng có quyền chủ động mở hồ sơ; đó là ngoại lệ có chủ đích, không phải thất bại của thiết kế panel.

### 9.5. Panel liền mạch và quay lại đúng chỗ

- Danh sách → Case → PA → kết quả là các view trong **một không gian panel**, không panel chồng panel.
- Có Back nội bộ về đúng view/dòng trước đó; không đóng panel rồi nhảy về đầu trang.
- Phân biệt Back trong panel, Back trình duyệt và link hồ sơ. Quy tắc URL/history phải được mô tả và test, không để người dùng bấm Back thì thoát cả chuỗi ngoài ý muốn.
- Giữ filter, scroll, selection và nháp theo đúng đối tượng. Không tái dùng form của HV A cho HV B vì component chưa reset.
- Sau lưu cập nhật danh sách nguồn và các count liên quan; không bắt reload cả trang. Giữ vị trí vừa xử lý bằng phản hồi thành công ngắn nếu cần, tránh dòng biến mất làm nhảy mắt.
- Đóng bằng X/Esc/bấm ngoài theo cùng quy tắc mất nháp; không hỏi hai lần. Đang lưu không được bị một panel khác thay thế làm mất phản hồi.
- Đổi vai/đăng xuất/mất quyền phải xử lý nháp đúng phạm vi người dùng, không lộ nội dung cho tài khoản tiếp theo.
- Dùng lại `khoPanel`, draft store và thành phần hiện có khi đáp ứng được. Chỉ thêm stack/view controller nhỏ nếu cần; không tạo framework toàn cục khổng lồ.

### 9.6. Overhaul bộ ba Case — phương án — kết quả

Đề nghị một khung có thứ bậc rõ:

**A. Ngữ cảnh cố định ngắn:** HV/link hồ sơ, lớp, kỹ năng, Case, trạng thái, người giữ việc và hạn.

**B. Vấn đề:** từ lượt nào, điểm/kỳ vọng hoặc ghi nhận nào, mô tả và nhóm nguyên nhân. Không lặp nguyên đoạn này trong mọi khối PA.

**C. Phương án:** mỗi PA có tên/loại, mục tiêu, người thực hiện, thời gian/mốc, trạng thái và kết quả gần nhất. Phân biệt PA đang làm, chờ xác nhận, đã kết thúc; không gộp thành một khối chữ không có nhãn.

**D. Kết quả:** kỳ đang ghi, dữ kiện kỳ trước, mức tiến triển, nhận xét, quyết định tiếp theo đúng nghiệp vụ. Phân biệt “kết quả kỳ” với “kết quả cuối”.

**E. Lịch sử:** mở khi cần, có người–thời điểm–thay đổi. Không đặt lịch sử dài phía trên việc đang cần làm.

Ví dụ luồng phải thử: số “Case chưa PA” → chọn Case → đọc nguyên nhân → thêm PA → lưu → xem PA vừa thêm → xác nhận nếu đúng vai và đến bước đó → ghi kết quả khi hợp lệ → Back về Case → Back về danh sách. Không tạo bước “duyệt” mới chỉ để đủ chuỗi minh họa.

Với nhiều chữ: nhãn trường và giá trị khác độ đậm; xuống đoạn có ý nghĩa; mô tả đầy đủ mở trong cùng panel; footer rõ một hành động chính. Tránh hộp lồng hộp ba bốn tầng. Không biến tất cả thành accordion đóng sẵn khiến người dùng phải mở từng mảnh để hiểu.

### 9.7. Kích thước, hiệu năng và khả năng truy cập

- Panel được rộng theo nội dung, có thể dùng phần lớn màn hình; không giữ chiều rộng hẹp cứng chỉ vì mẫu cũ.
- Desktop có header/footer dễ tìm; vùng cuộn rõ. Mobile dùng toàn màn/vùng phù hợp, bàn phím không che nút, tránh nhiều cuộn lồng nhau.
- Không render/tải hàng nghìn dòng chỉ vì “không giới hạn độ dài”. Phân trang/lazy-load theo mẫu hiện hành, tổng giữ đúng, mở chi tiết không mất dòng đang chọn.
- Load chi tiết khi cần, tránh mỗi dòng một request hoặc một query. Đo hiệu năng thật trước/sau, giữ trần và kiểm tốc độ hiện có; không bịa p95.
- Focus trap đúng phạm vi, mở panel focus có nghĩa, đóng trả focus cho điểm mở; bàn phím, screen reader và tên nút đều dùng được.
- Link trong row không kích hoạt đồng thời row expand. Tooltip/popover/lịch con không làm đóng panel cha khi click.
- Không dùng màu làm tín hiệu duy nhất; không cắt tên/điểm/hạn/hành động cốt lõi bằng ellipsis mà không có đường xem tại chỗ.

Triển khai thử một panel số liệu, một panel việc và chuỗi Case/PA/kết quả trước; nghiệm thu xong mới áp dụng dần các điểm vào còn lại. Đây là bước pilot kỹ thuật, không đổi thứ tự ưu tiên sản phẩm.

## 10. Chuẩn mockup — xem là biết ở đâu và dùng thế nào

Mọi mockup phải có một phần chú thích **ngoài vùng mô phỏng UI**:

| Trường bắt buộc | Ví dụ |
|---|---|
| Mã và tên | M1 — Chấm Test: lưu bài cuối của Listening |
| Trang/route | `/test/cham`, trong vùng nhập bên phải |
| Vai và phạm vi | GV dạy L/R, một chi nhánh; phân biệt người chỉ xem |
| Điểm vào | Từ nhóm chấm của lớp hoặc nút Nhập điểm |
| Trạng thái/dữ liệu | L còn 1 bài, R còn 3 bài; nhận xét chưa có nhưng không bắt buộc |
| Phạm vi vẽ | Toàn trang hay chỉ footer/panel; đánh dấu vùng thay đổi trên sơ đồ ngoài UI |
| Các vùng A/B/C | A danh sách nguồn; B bảng HV; C footer lưu; không đặt ghi chú thiết kế lẫn vào sản phẩm |
| Hành vi bấm | Lưu ở đâu, tiếp tới ai/kỹ năng nào, Back về đâu, X đóng gì |
| Phần giữ/thay | Giữ bộ lọc/Excel; thay quy tắc tiếp bài |
| Trạng thái lỗi | Lưu lỗi, mất quyền, không còn bài tiếp, đang tải |
| Trạng thái duyệt | Đề xuất / đã duyệt / đã thay thế, không tự nhận duyệt |

Mockup HTML trong `thiet-ke/`, có tương tác cho luồng cần chứng minh; ảnh 1440 và 375, sáng/tối theo phạm vi, dữ liệu giả đại diện và chữ thật. Màn nhiều chữ kiểm thêm 1280/zoom.

Nếu chỉ làm một phần trang, vẫn phải có ảnh toàn trang làm mốc và ảnh chi tiết phần đó. Mỗi phương án dùng cùng dữ liệu để so được. Không dùng ảnh đẹp tách rời route/vai rồi để tôi hỏi “cái này ở đâu?”.

Theo `CLAUDE.md`, màn/luồng mới hoặc thay bố cục cần chủ SP duyệt mockup trước khi code; thay chữ/nút nhỏ theo mẫu sẵn có không cần dựng một vòng duyệt mới. Bạn phải chuẩn bị mockup hoàn chỉnh và khuyến nghị cụ thể trước khi xin duyệt. Trong lúc chờ, làm phần độc lập đã được phép. Không dừng toàn dự án vì một màn chưa chốt.

## 11. Đóng góp thêm ngoài sáu mục — đưa vào đúng thời điểm

| Ý tưởng | Lý do | Thời điểm |
|---|---|---|
| Một nguồn định nghĩa “còn bài/còn việc/đã xong” | Tránh Lưu xong mà badge ở màn khác còn nợ; là nền cho mục 1 | Release 1, chỉ trong phạm vi liên quan |
| Quy tắc giữ ngữ cảnh chung cho lớp–HV–Test–Case | Giảm mất filter/scroll và công tìm lại sau xử lý | Tối thiểu ở 1–2; mở rộng ở 6 |
| Bảng truy vết thao tác trước–sau | Ngăn mockup mới vô tình làm mất Excel, lịch sử, sửa/khôi phục | Mọi PR UI |
| Nhãn nguồn cho điểm đầu hồ sơ | Tránh hiểu nhầm các điểm khác lượt là cùng một bài | Mục 5 |
| Tách “lưu thành công” và “nghiệp vụ đã xong” | Lưu nhận xét không có nghĩa PA kết thúc; đủ điểm không có nghĩa Case đã xử lý | Mục 1 và 6 |
| Lỗi một phần có đường thử lại đúng phần lỗi | Không buộc làm lại cả lớp, không gửi lại phần đã thành công | Khi chạm bulk/Excel/PA nhiều dòng |
| Bộ dữ liệu nghiệm thu dùng lại theo vai | So mockup–web và regression bằng cùng tình huống, tránh ảnh seed quá đơn giản | Trước PR UI đầu |
| Đồng bộ hướng dẫn ngay trong web | Hướng dẫn không chỉ sang tab/nút đã bỏ; giảm phải hỏi người quản lý | Trước từng release |
| Đo trải nghiệm theo tác vụ | Đếm click/chuyển trang/nhập lại, thời gian và lỗi quan sát được | Trước/sau thay đổi chính |

Không thêm dashboard, notification, AI tóm tắt, nhiệm vụ tuần hay hệ thống cấu hình mới chỉ vì “có thể hữu ích”. Mỗi ý tưởng phải giải quyết một vấn đề thật và có chi phí/ảnh hưởng được nêu.

## 12. Kế hoạch đầu ra và cách báo tiến độ

### 12.1. Đầu ra đầu tiên

Sau khi đọc và kiểm chứng, trả ngắn gọn:

1. Đang ở commit nào; có xác minh được production không.
2. Bảng sáu ưu tiên: đã có / cần sửa / cần mockup / phụ thuộc.
3. Decision log các xung đột ở mục 2, quyết định đã áp và câu hỏi còn lại nếu thực sự cần.
4. Kế hoạch release 1 với PR nhỏ, file/khu vực ảnh hưởng, tiêu chí hoàn tất và blocker thật.
5. Những gì có thể thực hiện ngay; mockup cụ thể đang cần duyệt, không chỉ một lời hứa “sẽ làm mockup”.

Sau đó thực hiện phần đã đủ điều kiện, không kết thúc ở bản plan. Làm lần lượt; mỗi phần xong cập nhật `plan.md`, trạng thái PR và phần việc còn lại theo quy định repo.

### 12.2. Gợi ý chia gói

| Thứ tự | Gói | Đầu ra có thể kiểm chứng |
|---|---|---|
| 0 | Đối chiếu hiện trạng và luật | Baseline/decision log, xác định PR đang làm trùng |
| 1a | Luồng chọn bài tiếp và lưu | Hành vi nhất quán, test trường hợp đạt/ngưỡng/lỗi/quyền/chuyển kỹ năng |
| 1b | Áp vào các điểm nhập | Không còn caller chạy theo cách “em tiếp” sai phạm vi |
| 2 | Phân cấp bảng Test | Mockup duyệt nếu đổi bố cục, ảnh đối chiếu, đủ thao tác |
| 3a | EN release | Glossary, sửa chuỗi, kiểm các vai và trạng thái |
| 3b | P14 và hướng dẫn bật dịch | Kiểm bảo mật/hạn mức/lỗi, hướng dẫn thao tác tay, ghi rõ trạng thái kích hoạt |
| R1 | Chuẩn bị deploy | Release checklist, migration/backup/rollback và smoke test |
| 4 | Hồ sơ Test/MT | 2–3 mockup → phương án khuyến nghị → triển khai đã duyệt |
| 5 | Hồ sơ HV/chart/góp ý | Thiết kế nguồn dữ liệu rõ, không nhập trùng, kiểm lịch sử |
| 6a | Inventory + hợp đồng panel | Bao phủ mọi điểm vào, danh sách giữ/sửa/gộp/bỏ |
| 6b | Pilot Case–PA–kết quả | Chuỗi tại chỗ hoàn chỉnh, Back/nháp/quyền đúng |
| 6c | Áp dụng còn lại | Rollout theo màn, không một PR toàn website |

### 12.3. Định nghĩa hoàn tất

Một hạng mục chỉ “xong” khi: hành vi đúng luật; không mất khả năng trước đó; quyền server đúng; không mất dữ liệu/nháp; có kiểm thử phù hợp; UI được kiểm theo vai/trạng thái; EN và hướng dẫn cập nhật; nợ còn lại ghi rõ.

Luôn báo riêng **đã code / đã kiểm / đã mở PR / đã merge / đã deploy**. Không lấy test xanh thay cho kiểm ảnh và thao tác; không lấy ảnh đẹp thay cho kiểm logic.

## 13. Bản đồ nguồn để tra nhanh

Các liên kết sau cố định tại snapshot đã rà; khi triển khai hãy đọc phiên bản mới hơn của cùng file và kiểm diff, không áp lại code cũ.

| Nhóm | Nguồn |
|---|---|
| Baseline | [Commit sau PR #587](https://github.com/Pizi147/pisa-tracking/commit/10cbbad06826e8ba200ff03dc5366d660c05a418) |
| Luật | [CLAUDE.md](https://github.com/Pizi147/pisa-tracking/blob/10cbbad06826e8ba200ff03dc5366d660c05a418/CLAUDE.md), [plan.md](https://github.com/Pizi147/pisa-tracking/blob/10cbbad06826e8ba200ff03dc5366d660c05a418/plan.md), [DESIGN.md](https://github.com/Pizi147/pisa-tracking/blob/10cbbad06826e8ba200ff03dc5366d660c05a418/DESIGN.md) |
| Quyết định mới | `docs/superpowers/specs/2026-10-22-overhaul-v5/01-quyet-dinh-22-10.md`, `09-phan-hoi-cuoi-chu-sp.md`; [thiết kế chốt 24–26/10](https://github.com/Pizi147/pisa-tracking/blob/10cbbad06826e8ba200ff03dc5366d660c05a418/docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md) |
| Nút lưu | [HopNhapDiem.tsx](https://github.com/Pizi147/pisa-tracking/blob/10cbbad06826e8ba200ff03dc5366d660c05a418/web/src/modules/fasttrack/HopNhapDiem.tsx), `web/src/modules/cham/LuoiFT.tsx`, `MotKyNang.tsx`, `web/src/modules/test/ChamTestTab.tsx` |
| Lịch Test | `web/src/modules/test/TestPage.tsx`, `LichTestTab.tsx`, `KeHoachTestTab.tsx`, `lichTest/HangLop.tsx`; [mockup điều chỉnh V5](https://github.com/Pizi147/pisa-tracking/blob/10cbbad06826e8ba200ff03dc5366d660c05a418/thiet-ke/v5/dieu-chinh-cuoi.html) khu a |
| Hồ sơ Test | `web/src/modules/fasttrack/MockDetailPage.tsx`, `ScoreEntry.tsx`; `thiet-ke/v5/test.html`, `test-truy-vet.md` |
| Hồ sơ HV/chart | `web/src/modules/students/StudentDetailPage.tsx`, `HanhTrinhKyNang.tsx`; `thiet-ke/v5/ho-so-hv.html`, `ho-so-hv-truy-vet.md`, `dieu-chinh-cuoi.html` khu c |
| Panel | `web/src/ui/KhungPanel.tsx`, `SoLieu.tsx`; `shared/domain/khoPanel.ts`; `web/src/modules/congViec/PanelViec.tsx`; `web/src/modules/students/NganCase.tsx`; `web/src/modules/cases/CasePanel.tsx` |
| Dịch AI | [server/src/dich/dich.ts](https://github.com/Pizi147/pisa-tracking/blob/10cbbad06826e8ba200ff03dc5366d660c05a418/server/src/dich/dich.ts), `server/src/moiTruong.ts`, `web/src/ui/ChuDich.tsx`, `docs/superpowers/plans/2026-10-25-p14-dich.md` |
| i18n | `shared/i18n/index.ts`, `shared/i18n/en.ts`, `shared/i18n/en/nenPanel.ts`, `shared/i18n/en/p14Dich.ts` và toàn bộ module liên quan |
| V6 | `thiet-ke/v6/cuoi-khoa.html`, `xet-lai-lo-trinh.html`, `lo-trinh-moi.html`, `trang-thai-hv.html`, các file truy vết; không thay thế mù quáng V5 ở phần không liên quan |
| Vận hành | `DEPLOY_2026-10.md`, `TRIEN_KHAI.md`, script trong `package.json`; đối chiếu môi trường thật trước khi đưa lệnh |

**Ảnh đã xem trực quan trong lần tổng hợp:**

- `thiet-ke/v5/anh/test-cham-1440-sang.png` và `test-lich-1440-sang.png`.
- `thiet-ke/v5/anh/hv-1440-sang.png` và `cong-viec-gv-1440-sang.png`.
- `thiet-ke/v5/anh/phan-tich-panel-75-1440.png`.
- `thiet-ke/v6/anh/cuoi-khoa-k3-bang-ql.png`.
- `docs/anh/ui-cham-test/cham-1440.png`.
- `docs/anh/ui-lich-tuan/cap-1440-toi.png`.
- `docs/anh/ui-ho-so-hv/cap-1440-sang.png`.
- `docs/anh/ui-cong-viec/web-case-mo-rong-1440-sang.png`.

Ảnh cũ chứa nhãn hoặc luật đã đổi phải được ghi nhận là lệch phiên bản; không biến nó thành yêu cầu khôi phục. Báo cáo audit 17/10 chỉ dùng làm lịch sử/checklist hồi quy: nhiều lỗi đã có PR sửa, không đưa nguyên danh sách lỗi cũ vào backlog như còn tồn tại.

---

**Bắt đầu ngay bằng việc kiểm lại main và trạng thái PR, lập kế hoạch ngắn cho 1–2–3, rồi thực hiện phần đủ điều kiện. Với 4–5–6, chuẩn bị phương án và mockup rõ trang–vai–vị trí trước khi thay bố cục. Mọi thay đổi phải giúp người dùng hiểu nhanh hơn, thao tác ít hơn và không mất dữ liệu.**
