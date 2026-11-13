# PISA Tracking — Audit và đề xuất overhaul toàn bộ trải nghiệm

**Tài liệu giao Claude · 13/11/2026 · baseline PR #1512 · bổ sung brainstorm vòng 2**

**Cập nhật:** phần 13 tinh chỉnh đề xuất cũ và bổ sung U01–U14. Đây là phân tích thiết kế tiếp theo dựa trên audit đã có, không phải kết quả kiểm thử mới.

## 1. Yêu cầu của chủ sản phẩm — đọc trước khi triển khai

Website được **giáo viên sử dụng là chính**. GV nhập liệu và thực hiện phần lớn công việc thường nhật. Quản lý chủ yếu quan sát, theo dõi số liệu, xử lý ngoại lệ và chỉnh sửa khi cần. Thiết kế phải phản ánh đúng sự phân công này.

Chủ sản phẩm yêu cầu chủ động xem xét **toàn bộ trang, tab, panel, popup, bảng, bộ lọc, nút bấm và đường điều hướng**. Có thể đề xuất thay cấu trúc mạnh nếu giúp thao tác đơn giản, trực diện, dễ quan sát, nhanh và thuận tiện hơn. Không giới hạn ở đổi màu, khoảng cách hoặc sửa vài nhãn. Đồng thời, không thay đổi chỉ để tạo cảm giác mới: phần đang hiệu quả cần được giữ và dùng nhất quán.

Tài khoản của chủ sản phẩm là quản trị; đã cho phép đổi góc nhìn các vai. Bản production chỉ dùng quan sát trong đợt audit này. Chủ sản phẩm cho phép thử nhập liệu trên demo riêng.

**Claude hãy dùng tài liệu này làm đầu vào để kiểm chứng, thiết kế và triển khai theo từng PR.** Không hiểu đây là xác nhận rằng mọi giả thuyết đều là lỗi đã tái hiện, hoặc mọi chi tiết mockup đã được duyệt. Không tự merge/deploy dựa riêng vào tài liệu này. Hãy làm phần chuẩn bị và sửa đã được giao đến mức cụ thể, có thể kiểm tra; chỉ hỏi quyết định sản phẩm thực sự chưa thể suy ra.

### Nguyên tắc giải quyết xung đột tài liệu

- Đọc `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `plan.md`, các đặc tả mới và luật miền trước khi sửa.
- Yêu cầu overhaul hiện tại mở lại việc **đề xuất bố cục và điều hướng**. Không dùng quyết định cũ “chỉ polish” để bỏ qua yêu cầu này.
- Việc mở lại bố cục không đồng nghĩa mở lại quyền truy cập, công thức điểm, lịch nghiệp vụ, lịch sử hoặc quy tắc duyệt đã chốt.
- Chỉ dẫn trong file này là đề xuất triển khai trừ những phần được ghi rõ là quyết định sẵn có. Khi luật mới hơn đã thay đổi baseline, cập nhật bảng đối chiếu trước khi sửa.

## 2. Mốc phiên bản và mức độ kiểm chứng

| Hạng mục | Kết quả / giới hạn |
| --- | --- |
| Repository | https://github.com/Pizi147/pisa-tracking |
| Website chính thức được quan sát | https://pisa-tracking.netlify.app |
| PR mới nhất tại lần kiểm tra cuối | [#1512 — plan: GV cũ bổ trợ (A)](https://github.com/Pizi147/pisa-tracking/pull/1512), merged 13/11/2026 14:58:39 UTC |
| Commit dùng audit mã nguồn | `301b94b536b851d8eeffed0a2cd6dc85a938f42e` |
| Mốc deploy theo repo | Ghi chú được thêm ở #1479 nói production tới #1478; đây là thông tin trong `plan.md`, chưa xác thực SHA từ runtime Netlify |
| Mốc audit trước | PR #1454, commit `730f9319b9d986e52e8bbd7bfeb3ce6cabe5f670` |
| Đối chiếu lịch sử | Đã lấy lịch sử merge #1455–#1512; tập trung thay đổi sau mốc deploy được ghi nhận và những sửa chữa liên quan audit cũ |
| Kiểm tra tự động hiện tại | `npm run check`: 5.670 kiểm tra chức năng và 73 kiểm tra tốc độ đạt; kiểm tra kiểu, esbuild, hook, CSS hoàn tất |
| Phần không chạy trong suite | SQLD/Hrana được bỏ qua vì máy không có `sqld`; không suy ra remote DB đã được kiểm chứng |
| Demo local | Đã seed DB thử riêng và khởi động `npm run dev`; không dùng kết nối Turso production |
| Giới hạn demo UI | Trình duyệt kiểm tra không truy cập được local; chưa chạy trọn E2E nhập liệu trên demo bằng trình duyệt |
| Tái hiện độc lập bổ sung | Lỗi tổng số bài bằng hàm domain đã build; lỗi gửi–rút–gửi lại bằng service thật trên DB demo riêng |
| Live đã quan sát | Tổng quan quản trị và GV; Công việc GV, nhóm chấm điểm, panel nhóm lớp và hộp nhập điểm; danh sách HV; hồ sơ lớp; lịch Test; hồ sơ HV, Case/PA mở rộng, tab Ý thức & Phối hợp; Tổng quan TVV |
| Chưa quan sát đủ bằng UI | Toàn bộ biến thể QL/Admin/CX; mọi panel quản trị; xuất file thực tế; mobile, dark mode và lỗi mạng có kiểm soát; mọi tổ hợp quyền |

**Phân biệt ba lớp:** live đã deploy, mã nguồn HEAD, và quyết định mới chỉ nằm trong plan. Ví dụ live đã thấy tab Ý thức & Phối hợp theo bố cục cũ; HEAD đã có `TinhHinh.tsx` và các thay đổi #1504/#1506/#1507. Không dùng việc live chưa có chức năng mới để kết luận HEAD thiếu chức năng đó.

Đây là audit kết hợp quan sát và đọc mã có trọng tâm, không phải chứng nhận mọi nút đã được thử. Phần overhaul bên dưới bao phủ toàn bộ bề mặt sản phẩm ở mức thiết kế; phụ lục nguồn giúp Claude hoàn tất kiểm kê từng control, kể cả control nằm ngoài file tên `Panel`.

## 3. Những thay đổi mới phải giữ đúng

| Nhóm PR | Điều cần đối chiếu khi overhaul |
| --- | --- |
| #1456, #1458, #1460, #1461 | Các sửa sau audit cũ: lưu nháp/kết quả PA, xung đột sửa, cấu hình chi nhánh, kết quả thao tác lô/lưu trữ. Không tái mở nguyên trạng các lỗi cũ khi đã được sửa |
| #1463, #1465 | Môn/chương trình và cách nhập điểm theo loại Test; không ép mọi lớp vào một form IELTS |
| #1468–#1471 | Hướng dẫn mới theo vai; cập nhật cùng giao diện, không bỏ lại tài liệu chỉ đường cũ |
| #1475–#1476 | Nhãn Speaking chấm chéo/Nhập điểm; quyền TVV sửa tuần bắt đầu theo phạm vi đã chốt |
| #1478–#1479 | Hotfix thứ tự migration và ghi nhận deploy; khi chuẩn bị release phải kiểm tra migration trên bản sao, không chỉ build UI |
| #1483, #1486, #1490 | Các sửa ô số, drilldown và tab Phân tích; tận dụng cơ chế đã có, không tạo engine thống kê khác |
| #1487–#1488 | Bố cục Ý thức ở lớp và Công việc; kiểm tra HEAD thay vì chỉ ảnh production |
| #1500–#1503 | Tổng kết lộ trình, lưu trữ, mốc báo cáo PH, kết quả thi thật theo GV; phân biệt học viên/lộ trình/lớp và dữ liệu lịch sử |
| #1504, #1506, #1507 | Tình hình học tập, nhắc nhở, cách xử lý và duyệt; xem các luật dưới đây |
| #1505, #1508, #1509 | Tỷ lệ tuần GV và lùi mốc phân công đầu tiên; tác động thống kê lịch sử, không chỉ nội dung popup |
| #1511–#1512 | Chủ SP đã chọn phương án A cho GV cũ bổ trợ. Đây là plan/spec ở baseline, **chưa phải bản sửa quyền đã triển khai** |

### Các ranh giới nghiệp vụ không được làm sai

1. Quyền = capability × phạm vi × phân công; không suy “vai cao hơn” thì mặc nhiên có toàn bộ dữ liệu. GVCN là phân công/capability trên lớp, không tạo một role độc lập mới.
2. GV bộ môn xem bức tranh chung nhưng sửa phần được giao. GVCN có quyền rộng hơn theo luật hiện hành; không tự cấp quyền sửa mọi kỹ năng chỉ vì giao diện muốn tiện.
3. Quản lý thiên về giám sát nhưng vẫn phải giữ các quyền chỉnh sửa/can thiệp đang được phép. Không biến QL thành read-only tuyệt đối.
4. “Test” nội bộ khác “thi thật”. Ước lượng của GV khác điểm chính thức. Không trộn chúng thành một con số mới nhất không có nguồn.
5. Tuần/lộ trình là theo học viên và chu kỳ học khi luật yêu cầu; không lấy tuần lớp thay cho tuần mọi em. Mốc báo cáo PH phải theo logic đã sửa ở #1502.
6. Kết quả PA đã chốt dùng Lưu → Sửa theo quy định; không thêm Undo đại trà cho kết quả cuối cùng. Nháp, chốt, sửa lịch sử là các trạng thái khác nhau.
7. “Chỉ nhắc nhở” không cộng vào luật vi phạm/bậc/việc. Xử lý mặc định nâng một bậc; các lựa chọn khác đi qua QL theo đặc tả hiện hành. Chờ duyệt chưa sinh việc TVV; duyệt hoặc tự chốt theo hạn mới sinh việc.
8. GV báo tình hình → TVV theo hạn 5 ngày; TVV hỏi tình hình → GVCN theo hạn 3 ngày. Giữ cách tính ngày nghiệp vụ hiện có, không tự thay thành 72/120 giờ. Báo theo lô tối đa 8 em; hỏi từng em.
9. Thi thật theo GV: đối chiếu band kỹ năng với target theo quyết định #1503; tỷ lệ tuần dạy của #1505 chia tuần chung theo 1/k. Không thay bằng overall hoặc chỉ gán GV hiện tại.
10. Không đưa lại nhập điểm bằng dán Excel nếu đã bỏ theo quyết định sản phẩm. Nhập danh sách HV là luồng riêng.
11. Học bổ trợ/học bù/1–1 phải linh hoạt theo PA và số buổi; không nhân dịp overhaul xây thêm một hệ thống lịch cố định nặng nề.
12. Không mở lại trang Tutor độc lập chỉ vì còn file nguồn: route hiện tại chuyển về trang chính, cần tôn trọng phạm vi sản phẩm đang dùng.

## 4. Danh sách lỗi và rủi ro ưu tiên

P1: chặn công việc hoặc có thể khiến người dùng hiểu sai dữ liệu đã lưu. P2: sai lệch thông tin/khả năng phục hồi nhưng có đường xử lý khác. Mức ưu tiên là đề xuất xử lý, không phải mức độ sự cố đã đo trên production.

### F01 — Tổng số bài ở đầu Công việc không khớp nhóm bên dưới · P2 · ĐÃ TÁI HIỆN

**Quan sát:** góc nhìn GV hiển thị đầu trang “5 việc · 7 bài”, trong khi nhóm nhập điểm có 28 bài/5 lớp; panel và các lớp con cộng thành 28. Con số “5 việc” có thể là phạm vi nhiều tab, không tự kết luận nó sai chỉ vì tab hiện một nhóm.

**Nguồn:** `shared/domain/gopViec.ts:122–157`, `web/src/modules/congViec/HoTroHocVienTab.tsx:404,459`.

**Nguyên nhân:** nhóm tính tổng `so` để viết tiêu đề nhưng object được spread từ phần tử đầu, không ghi đè `soBai`. Header cộng `soBai` của nhóm nên lấy số bài lớp đầu.

**Tái hiện domain:** 5 item cùng tuần/chủ việc, khác lớp, `soBai=[7,4,4,10,3]`. Tổng input và con = 28; title nhóm = 28; giá trị dùng cộng header = 7.

**Sửa:** chuẩn hóa đại lượng tổng ở tầng grouping hoặc một hàm tính từ lá dùng chung. Không cộng đồng thời cha và con. Bộ lọc chi nhánh phải dựng lại tổng đúng. Nhãn thể hiện rõ “việc”, “học viên”, “bài”, “nhóm” và phạm vi toàn hàng đợi/tab.

**Nghiệm thu:** 1 lớp, 5 lớp, nhiều chi nhánh, một em nhiều việc, rỗng, lọc, hoàn tất một bài; mọi vị trí cùng phạm vi cho cùng số.

### F02 — GV cũ bổ trợ mất lối vào/quyền/việc sau chuyển lớp · P1 · ĐÃ CÓ ĐẶC TẢ, CHƯA TRIỂN KHAI

**Nguồn:** `docs/superpowers/specs/2026-11-13-gv-cu-bo-tro-design.md`, `server/src/cases/cases.ts` tại `kiemXemCase`, `server/src/cases/giuKetQua.ts`, logic `mywork.ts`.

Đặc tả xác định Case đọc theo quyền lớp mới có thể 403; lưu kết quả gọi `caseDetail` trong transaction gây rollback; việc rơi vào người phụ trách lớp mới; hồ sơ lớp cũ và hồ sơ GV thiếu lối tiếp tục. Đợt audit này xác nhận nhánh mã/đặc tả, chưa tái hiện toàn luồng browser với hai tài khoản.

**Thực hiện phương án A đã chọn**, không tạo phương án cạnh tranh:

- Người dạy của PA `bo_tro_mien_phi` đang chạy có quyền tạm với đúng HV/Case đó; xem hồ sơ lớp hiện tại theo phạm vi đặc tả, kể cả đổi chi nhánh.
- Không cấp thêm quyền sửa điểm, vi phạm, lớp hoặc HV khác. Không giả lập một phân công GV mới làm sai KPI.
- Việc Ghi kết quả bổ trợ/Ghi Mini Test về người dạy thực tế; GVCN mới theo dõi và làm thay đúng luật có sẵn.
- Có lối từ Công việc, lớp cũ “Đã chuyển · đang bổ trợ”, hồ sơ GV “Em đang bổ trợ” và tìm kiếm. Tất cả dẫn tới cùng dữ liệu.
- Hết/kết thúc/hủy PA hoặc chốt Mini Test thì thu hồi đúng điều kiện đã chốt. Cờ UI và quyền server dùng cùng logic.

**Nghiệm thu:** người thực hiện cũ làm được lần đầu, GV khác vẫn bị từ chối, hết PA hết quyền, lớp mới chỉ xem, mọi mutation ngoài scope bị chặn; kiểm tra chuyển chi nhánh và chi phí truy vấn.

### F03 — Chữ nhập tiếp khi đang gửi có thể bị mất hoặc hiển thị như đã gửi · P1 · XÁC NHẬN ĐƯỜNG MÃ, CẦN E2E MẠNG CHẬM

**Nguồn:** `web/src/modules/yThuc/TinhHinh.tsx`, `HopTinhHinh` khoảng 155–171 và 218–219; `PanelHoiTinhHinh` khoảng 255–284.

- Hộp gửi chụp nội dung ở thời điểm request; textarea vẫn sửa được. Thành công luôn đóng hộp, có thể mất phần gõ sau lúc bấm gửi.
- Panel trả lời gửi nội dung A, người dùng gõ thêm B trong khi chờ; khi thành công `setXong(true)`, khối “Đã trả lời” lại render `chu.trim()` hiện tại. B có thể được trình bày như đã lưu dù request chỉ chứa A.

**Sửa:** thống nhất snapshot/revision của payload; chỉ đánh dấu đã lưu cho snapshot server chấp nhận. Nếu giữ khả năng gõ tiếp, giữ phần mới là dirty/nháp và không tự đóng. Hoặc khóa riêng các trường đang gửi nếu thao tác ngắn, thông báo rõ. Chặn gửi trùng đồng bộ; xử lý Đóng/Escape/Việc tiếp khi pending, không để kết quả cũ cập nhật nhầm đối tượng mới.

**Nghiệm thu:** network delay, gõ tiếp, đổi học viên, đóng panel, lỗi 500, retry, gửi hai lần; UI không khẳng định phần chưa gửi là đã lưu.

### F04 — Hoàn tác gửi lô bỏ qua kết quả thất bại từng em · P2 · XÁC NHẬN MÃ

**Nguồn:** `TinhHinh.tsx:161–163`: `Promise.allSettled(...)` rồi refresh, không đọc các kết quả.

Một request hoàn tác lỗi hoặc đã được người nhận xử lý có thể để lại một phần dữ liệu mà người gửi không biết phần nào còn hiệu lực.

**Sửa:** bảng kết quả bền trong phiên cho từng em; “Đã rút 6/8, 2 chưa rút được” kèm lý do và retry chỉ phần lỗi. Không tạo toast thành công chung cho một batch chỉ thành công một phần. Refresh dữ liệu đúng phạm vi.

**Nghiệm thu:** 0/n, n/n, một phần, timeout không rõ đã commit hay chưa, bản ghi đã có kết quả; không thử lại những em đã hoàn tác thành công.

### F05 — Gửi lại sau Rút nhận bản đã rút · P1 · ĐÃ TÁI HIỆN SERVICE + DB DEMO

**Nguồn:** `server/src/yThuc/tinhHinh.ts:99–102`, hàm `guiTinhHinh`; `rutTinhHinh:159–180`.

**Bước:** gửi nội dung A → Rút thông thường (giữ lịch sử) → gửi lại A cho cùng em/cùng người/cùng chiều trong 2 phút.

**Kết quả thử local:** `first=1, resend=1, trang_thai='rut'`. API trả thành công với ID đã rút. Việc mới không được khôi phục như ý định gửi lại.

**Nguyên nhân:** chống gửi trùng theo nội dung/thời gian không xét trạng thái bản ghi.

**Sửa:** phân biệt retry của cùng một ý định với một lần gửi mới sau Rút. Ưu tiên idempotency key cho từng submission nếu phù hợp kiến trúc hiện tại; hoặc sửa quy tắc dedup theo trạng thái/lifecycle, không chỉ thêm điều kiện tùy tiện rồi bỏ các ca retry sau mất mạng. Giữ lịch sử Rút.

**Nghiệm thu:** retry cùng request không nhân đôi; gửi–rút–gửi lại tạo yêu cầu đang mở hợp lệ; Undo xóa ngay khác Rút giữ lịch sử; kiểm tra cả hai chiều GV→TVV và TVV→GVCN; batch và race concurrent.

### F06 — Sửa kết quả PA cũ có thể thiếu bảo vệ dirty state · P2 · CẦN KIỂM CHỨNG

`web/src/modules/cases/CapNhatTuan.tsx:473`: `useBaoDangSua(!sua && daSua)` loại nhánh sửa kết quả cũ khỏi guard này. Các trường và wrapper khác có thể còn bảo vệ, nên chưa kết luận mất dữ liệu chắc chắn.

Claude phải thử sửa số buổi, ghi chú, kết luận rồi Đóng/Escape/Back/chuyển việc. Nếu thiếu guard, so sánh bản gốc với bản đang sửa và chặn rời khi dirty; không chỉ bảo vệ ô ghi chú mà bỏ số buổi. Không đổi quy tắc “kết quả chốt → sửa” thành Undo.

### F07 — “Xong hôm nay” cần đúng phạm vi dữ liệu · P2 UX · ĐỌC MÃ

Các trạng thái giữ dòng hoàn tất trong Công việc hiện có phần lưu theo phiên component. Nếu con số chỉ là các việc làm từ khi mở trang, nhãn “Xong hôm nay” khiến người dùng kỳ vọng reload vẫn còn.

Chọn một hợp đồng rõ: đổi thành “Vừa hoàn tất”/“Xong trong phiên này”, hoặc lấy lịch sử trong ngày từ server. Không kết luận bản ghi nghiệp vụ hoàn tất đã mất chỉ vì dòng UI biến mất sau reload. Đo chi phí truy vấn nếu chọn lịch sử server.

### Không tái đưa lỗi cũ vào backlog một cách máy móc

HEAD đã có kiểm tra revision/cycle trong lưu PA, xử lý transaction và xung đột, khóa gửi chung giữa nháp/chốt, cơ chế chỉ xóa nháp đúng snapshot và các sửa liên quan audit cũ. Giữ các cơ chế này khi tách component. Một giao diện đẹp hơn nhưng mất bảo vệ race là hồi quy.

## 5. Nhận xét UX chính và hướng thiết kế

Điểm tốt cần giữ: lối làm tại chỗ, Lưu & tiếp, grouping công việc, thông tin nguồn điểm/kỳ vọng, điều hướng trước/sau HV, hồ sơ lớp/HV có liên kết, trạng thái tạm khi thiếu điểm, quyền theo phạm vi và các bản sửa nháp gần đây.

Vấn đề chính là **thứ tự ưu tiên thông tin chưa luôn khớp với người đang làm việc**. Trang GV vẫn bắt đầu bằng số liệu tổng quan; bảng rộng và nhiều tầng mở khiến việc nhập một mục phải giữ khá nhiều ngữ cảnh trong đầu. Ở hồ sơ lớp đã quan sát, header/thống kê/thông tin bàn giao hoàn tất chiếm đáng kể phần đầu trước bảng HV. Ở hồ sơ HV, bảng lịch sử Test có thể đứng trước Case/PA đang cần hành động; trong Case mở rộng, nhiều thao tác quản trị/xóa cùng hiện diện với cập nhật thường nhật.

Đây là đề xuất thay ưu tiên sản phẩm. Cách Tổng quan và Công việc tách nhau là thiết kế có chủ đích trước đây, không gọi đó là lỗi lập trình.

### 5.1. Kiến trúc điều hướng theo vai

| Vai/góc nhìn | Trang vào đề xuất | Hành động nổi bật | Giữ ở lớp thứ hai |
| --- | --- | --- | --- |
| GV bộ môn | Bàn làm việc: việc đến hạn + lớp tôi dạy | Nhập điểm, cập nhật PA, ghi tình hình/vi phạm đúng quyền | Thống kê cá nhân, lịch sử, báo cáo |
| GV có phân công chủ nhiệm | Cùng Bàn làm việc, thêm nhóm việc GVCN | Xác nhận/chọn PA, trả lời TVV, xử lý ý thức, theo dõi tổng thể | Cấu hình lớp, báo cáo chuyên sâu |
| GV cũ còn bổ trợ | Cùng Bàn làm việc + Em đang bổ trợ | Ghi kết quả, Mini Test | Lớp mới chỉ xem, không trộn thành lớp đang dạy |
| Quản lý | Tổng quan chi nhánh | Xem ngoại lệ, duyệt, can thiệp, truy xuống dữ liệu | Nhập liệu hàng loạt và cấu hình ít dùng |
| TVV | Việc phối hợp + HV của tôi | Báo PH, hỏi GVCN, bổ sung thông tin được phép, theo dõi thi/lộ trình | Dữ liệu học thuật chủ yếu xem; không lộ nút ghi điểm |
| Quản lý TVV nếu có trong grants hiện hành | Tổng quan nhóm được giao | Theo dõi tồn đọng/phân công | Không tự tạo role backend mới chỉ để có menu |
| Admin chi nhánh | Công việc vận hành | Hồ sơ/lớp/lịch trong quyền thật | Phân tích phục vụ vận hành |
| CX | Tổng quan phù hợp quyền hiện hành | Theo dõi chất lượng và ngoại lệ | Không suy toàn quyền từ tên CX |
| Quản trị hệ thống | Tổng quan + lối vào Quản trị rõ | Tài khoản, quyền, cấu hình, nhật ký | Không lấy trang quản trị làm bố cục mặc định cho mọi vai |

Đề xuất menu GV: **Bàn làm việc · Lớp & học viên · Test**; hồ sơ cá nhân/GV và báo cáo phụ trong vị trí ổn định. Công việc đầy đủ có thể là một view của Bàn làm việc; tái dùng cùng API và ID công việc, không tạo hàng đợi thứ hai. QL giữ Tổng quan/Phân tích rõ ràng. Trạng thái đổi góc nhìn luôn hiện ở header, có nút trở lại; không lẫn xem vai với cấp quyền.

### 5.2. Bàn làm việc GV

- Phần đầu trả lời ngay: hôm nay làm gì, cho lớp/em nào, hạn nào, còn bao nhiêu.
- Một danh sách ưu tiên: quá hạn → đến hạn → sắp đến hạn; có nhãn lý do, không chỉ màu đỏ. Phân biệt “của tôi”, “đang chờ người khác”, “làm thay được”.
- Nhóm theo hành động/lớp/tuần khi giúp nhập liên tục. Mỗi nhóm có nút cụ thể “Nhập 12 bài”, “Cập nhật 3 PA”, không bắt bấm vào một phần trăm để bắt đầu.
- Ngữ cảnh lớp/kỹ năng/tuần lấy từ việc; không hỏi chọn lại thông tin đã biết.
- Sau lưu, giữ dấu vết kết quả ở đúng dòng, giảm count, chuyển tiếp có chủ đích; không đẩy danh sách khiến bấm nhầm.
- Có “Lớp đang dạy” và “Em đang bổ trợ” để vào khi chưa có công việc được sinh. Không ép mọi lối vào qua hàng đợi.
- KPI cá nhân vẫn xem được nhưng sau khu vực hành động. “Không còn việc” có lối vào lớp, không biến thành trang trống.

## 6. Overhaul theo từng trang và bề mặt

Các mục dưới đây là đặc tả đề xuất, không ngụ ý mọi lỗi đã xuất hiện trên live. Claude phải đối chiếu component hiện tại và loại bỏ phần trùng với chức năng đã tốt ở HEAD.

### 6.1. Tổng quan và Phân tích

**GV:** ưu tiên công việc như trên, thu gọn KPI. **QL:** giữ số liệu đầu trang nhưng mỗi ô số phải có định nghĩa kỳ/phạm vi, mẫu số, dữ liệu thiếu và drilldown khớp. Tránh dùng tỷ lệ không có số em/việc gốc. Bộ lọc chi nhánh, FT/lớp thường, kỳ báo cáo giữ nhất quán khi đi sâu rồi quay lại.

Phân tích chia theo câu hỏi thực tế: lớp nào cần hỗ trợ; GV đang quá tải/chưa hoàn tất; PA nào hiệu quả; ý thức/phối hợp tồn đọng; kết quả thi thật. Giữ các tab đã sửa #1490 nếu đáp ứng. Không xây thêm dashboard lặp số liệu mà thiếu hành động. Bảng drilldown phải dẫn đến đúng HV/Case/lượt Test và giữ context nguồn. Xuất báo cáo dùng cùng bộ lọc và giải thích dữ liệu thiếu như màn hình.

### 6.2. Danh sách Lớp & học viên

Cho GV mặc định thấy lớp đang phụ trách: mã lớp, kỹ năng mình dạy, vai GVCN nếu có, tuần/chương trình, việc cần làm và nút vào làm. Có chuyển sang danh sách HV để tìm xuyên lớp. Giữ tìm kiếm nhanh và nhớ bộ lọc theo người/góc nhìn, không mang bộ lọc không hợp lệ sang vai khác.

Ở danh sách HV, mặc định chỉ cột cần quyết định: tên, lớp, tình trạng cần chú ý, việc tiếp theo, người phụ trách. Chi tiết điểm có thể mở rộng hoặc chọn cột. Không làm mất khả năng so sánh nhiều em chỉ để biến tất cả thành card. Thao tác lô chỉ xuất hiện khi chọn dòng; luôn hiện số chọn và phạm vi “trang này/tất cả kết quả”.

Thêm HV/import: đi từ lớp thì điền sẵn lớp; preview lỗi từng dòng, chống trùng tên+ngày sinh theo logic hiện hành, mã HV tự sinh. Cho sửa dữ liệu trước khi xác nhận, không bắt nhập lại lô thành công khi một phần lỗi. Kết quả lô phải tồn tại đủ lâu để xử lý tiếp.

### 6.3. Hồ sơ lớp — nơi GV vận hành lớp

Thứ tự đề xuất: **header gọn → việc của tôi ở lớp → bảng làm việc → thông tin/lịch sử phụ**.

- Header giữ mã lớp, chương trình, tuần, môn/vai của tôi. Giáo viên khác và cấu hình đầy đủ mở khi cần.
- Thông tin chuyển/nhận lớp đã hoàn tất chuyển thành dòng lịch sử thu gọn; cảnh báo còn cần hành động mới chiếm vị trí nổi bật.
- Bảng có chế độ nhiệm vụ: theo dõi tổng thể, nhập điểm, cập nhật tiến độ, ý thức/phối hợp. Đừng nhồi mọi cột và mọi popup vào một view.
- Mỗi chế độ dùng cùng danh sách HV và giữ bộ lọc/vị trí; tránh chuyển tab khiến mất em đang làm.
- Tab Báo cáo PH/Phân tích/Tổng kết vẫn truy cập được nhưng không chiếm vị trí CTA chính khi GV đang nhập liệu.
- Cuối khóa, xét lại, bàn giao và chuyển lớp dùng preview tác động: ai chuyển, PA nào mang theo, người làm tiếp, mốc nào giữ lại. Không bắt GV tự suy từ nhiều nhãn rời rạc.
- Em đã chuyển nhưng còn bổ trợ hiển thị tách roster đang học, đúng spec A; không tính lại vào sĩ số hoặc KPI đang học.

### 6.4. Hồ sơ học viên

Header gọn: tên/mã, lớp hiện tại, kỹ năng/vai của người xem, target, mốc thi hoặc tuần học liên quan. Liên hệ và thông tin cá nhân mở khi cần, không đẩy thao tác xuống dưới.

Đầu tab học thuật có **“Cần làm với em này”** gồm đúng công việc trong quyền, rồi tóm tắt kỹ năng có nguồn/mốc. Giữ bảng lịch sử Test để đối chiếu, nhưng không để lịch sử dài chặn Case đang cần xử lý. Không trộn điểm MT2 của kỹ năng này với MT3 của kỹ năng khác mà bỏ nhãn nguồn.

Giữ ba nhóm dễ hiểu: Học thuật; Ý thức & Phối hợp; Lộ trình & lớp. Kỹ năng được chọn phải áp dụng nhất quán cho khu vực cần lọc; ghi rõ những khu vực vẫn là toàn hồ sơ. Trước/Sau HV giữ đúng danh sách nguồn. Trở về lớp/Công việc khôi phục bộ lọc và vị trí.

“+ Case” là hành động theo quyền/ngữ cảnh, không mặc định thắng “Cập nhật PA đến hạn”. Thao tác hồ sơ/chuyển lớp/lưu trữ/xóa nằm trong menu phụ được đặt tên rõ. Nếu chỉ xem, giải thích người phụ trách và đường phối hợp, không trình bày như form hỏng.

### 6.5. Case và phương án

Một Case cần đọc được theo chuỗi: **vấn đề → người phụ trách → PA đang chạy → kết quả cần cập nhật → điều kiện kết thúc**.

- Mặc định ưu tiên PA đang chạy và việc tiếp theo; lịch sử/PA kết thúc thu gọn.
- Chỉ một vùng chỉnh sửa chính trong cùng thời điểm. Tránh panel mở panel rồi popup nhỏ chứa thao tác quan trọng.
- Một header ngữ cảnh xuyên suốt: HV, lớp, kỹ năng, Case, PA, kỳ cập nhật/hạn.
- Phân biệt người phụ trách Case, người dạy PA, người nhập kết quả; không gom thành “GV”.
- Form tạo/sửa PA có mặc định từ quy chế, giải thích hệ quả đủ ngắn. Chọn PA, xác nhận, đổi PA, xin ý kiến và đổi người phụ trách phải thể hiện trạng thái hiện tại/tiếp theo.
- Ghi kết quả: nội dung thực hiện, số buổi/tiến độ, nhận định và bước tiếp theo theo loại PA. Không đưa tất cả trường của mọi loại PA vào một form.
- Lưu nháp không đóng việc; chốt kết quả chỉ thành công sau phản hồi server. Hai tab sửa cùng PA phải phát hiện conflict và giữ chữ người dùng.
- Xóa PA, xóa Case, kết thúc sớm, không cần theo dõi là các hành động khác nhau, đưa vào nhóm phụ; xác nhận tác động bằng tên đối tượng và trạng thái. Không đặt hàng loạt nút nguy hiểm sát CTA cập nhật hằng ngày.
- Mini Test và bổ trợ sau Final có lối rõ, đúng người thực hiện cũ; kết thúc khóa/lộ trình không làm biến mất việc còn trách nhiệm.

### 6.6. Test, lịch Test và nhập điểm

Đối với GV, ưu tiên “Bài cần nhập của tôi”, sau đó lịch tuần. Cùng một lượt Test phải có một nguồn dữ liệu và form dùng chung dù mở từ Công việc, lớp, HV hay Test.

- L/R nhập số câu đúng khi phù hợp thang điểm; W/S dùng tiêu chí đúng chương trình. Có nhãn nguồn và quy đổi rõ, không cho nhầm band với số câu.
- Trên desktop, bảng nhập nhiều em có vùng làm việc đủ rộng; bảng và form tiêu chí đặt cạnh nhau khi thực sự đủ chỗ. Không dồn bảng rộng vào nửa màn rồi mở thêm popup chật.
- Trên mobile, một em/một kỹ năng với Trước/Sau và header cố định phù hợp; không thu nhỏ nguyên bảng desktop đến mức khó bấm.
- Giữ Lưu & tiếp; chỉ chuyển sau lưu thành công, focus ô đầu của em tiếp theo. Lỗi ở em hiện tại giữ nguyên nội dung.
- Phân biệt `0`, chưa nhập, vắng, chưa đủ tiêu chí, hủy lượt, không áp dụng. Không tự coi bỏ trống là 0 hoặc vắng.
- Speaking chấm chéo: chọn GV chấm đúng scope và giải thích thay đổi áp cho bài nào. Không đổi attribution bài đã lưu ngoài ý định.
- Kế hoạch Test: người có quyền mới xếp/đổi lịch; hiển thị tuần cá nhân và tuần lịch đúng ngữ cảnh. Xếp lô có preview và kết quả từng em.
- Điểm thi thật dùng luồng riêng, có nguồn/mốc/ngày thi; attribution tuần GV hiển thị được cách tính và trường hợp thiếu phân công.

### 6.7. Ý thức & Phối hợp, tình hình học tập

Tách rõ **ghi nhận**, **xử lý**, **trao đổi tình hình**, **báo PH** bằng nhãn và trạng thái; không biến mọi thông tin GV gửi thành vi phạm.

- “Ghi nhận” cho chọn Nhắc nhở/Vi phạm với giải thích tác động ngay tại lựa chọn.
- Khi xử lý, mặc định đúng luật, cho thấy bậc hiện tại → bậc dự kiến; lựa chọn khác ghi rõ cần duyệt và hạn. Không cho người dùng tưởng đã áp dụng khi mới gửi đề xuất.
- Hộp “Báo tình hình” từ lớp/HV điền sẵn em, hiện người nhận và hạn, cho nhóm tối đa 8 em đúng luật. Mỗi em vẫn có trạng thái độc lập.
- TVV hỏi GVCN có câu hỏi gốc, người trả lời, hạn; trả lời xong phải thể hiện nội dung server đã nhận, không chỉ state cục bộ.
- Công việc TVV ưu tiên người cần liên hệ, lý do, thông tin học thuật cần biết, kết quả liên hệ và bước tiếp. Không ép TVV phải mở nhiều tab chỉ để biết GV vừa báo gì.
- Rút, Hoàn tác, Sửa, Đã thực hiện và Đóng việc phải khác nhau cả copy lẫn tác động. Cập nhật lịch sử có người làm/thời điểm nhưng không nhồi tất cả log vào màn chính.
- Batch một phần lỗi phải chỉ rõ từng em còn việc, theo F04.

### 6.8. Chuyển lớp, bàn giao, lộ trình, lưu trữ

Tạo một trải nghiệm nhiều bước ngắn chỉ khi quyết định có phụ thuộc: chọn đối tượng → chọn đích/mốc → xem ảnh hưởng → xác nhận → kết quả. Không xây wizard cho một thay đổi đơn giản.

Preview luôn phân biệt: trạng thái học viên, membership lớp, learning cycle, Test/Case/PA đang chạy, người tiếp tục làm. Không xóa lịch sử lớp cũ để giao diện “sạch”. Giữ thứ tự lưu trữ mới theo #1501. Khi khôi phục hoặc thao tác lô, trình bày phần đã xong/phần lỗi và tiếp tục xử lý được.

Tổng kết lộ trình theo #1500 giữ đủ diễn biến; không gọi điểm mới nhất là kết quả cả khóa. Mốc báo cáo PH và phân công backdate cần có nguồn rõ khi xem số liệu lịch sử.

### 6.9. Quản trị và cấu hình

Không bỏ qua vì GV ít dùng: quản trị sai sẽ ảnh hưởng toàn bộ workflow.

- Nhóm theo việc: con người & quyền; chi nhánh/lớp/chương trình; mốc/ngưỡng/quy đổi; nhật ký & dữ liệu đã xóa. Mỗi nhóm có mô tả tác động ngắn.
- Tài khoản hiển thị vai, phạm vi, phân công và quyền riêng ở các cột/khối rõ; không gom thành một nhãn “Admin”. Xem trước tác động khi thay quyền.
- Sửa cấu hình một trường vẫn giữ optimistic concurrency; không gửi toàn object stale ghi đè trường người khác.
- Cấu hình ngưỡng/kỳ vọng/quy đổi/hạn có ví dụ kết quả tính và phạm vi áp dụng nếu có thể lấy từ domain. Giải thích có ảnh hưởng dữ liệu cũ không theo luật thật.
- Nhật ký có bộ lọc người/đối tượng/loại/thời gian; liên kết về đối tượng còn tồn tại. Thùng rác/khôi phục giữ danh tính và kiểm quyền.
- Tác vụ xóa tài khoản, lớp, HV có hậu quả cụ thể và đối tượng rõ; không nút icon trần hoặc lời hỏi chung “Bạn chắc chứ?”.

### 6.10. Hồ sơ cá nhân, hồ sơ GV, hướng dẫn và lớp giao diện chung

Hồ sơ GV thêm “Em đang bổ trợ” theo spec A; tách thành tích hiện tại và lịch sử, phạm vi kỹ năng và tỷ lệ tuần. Hồ sơ cá nhân giữ cài đặt gọn; không khiến người dùng đổi góc nhìn ngoài ý muốn.

Hướng dẫn theo vai và việc: “Nhập điểm một lớp”, “Cập nhật PA”, “Báo tình hình cho TVV”, “Trả lời TVV”, “Theo dõi duyệt”. Link mở đúng màn; phần hướng dẫn phải cập nhật cùng PR đổi đường đi. Không thêm một tour dài bắt buộc trước khi làm việc.

Tìm kiếm toàn cục cần tìm lớp/HV và em còn bổ trợ đúng scope. Chuông dẫn đến đúng việc, phân biệt còn việc/đã hoàn tất; badge và Công việc dùng chung định nghĩa. Header, bộ lọc, menu tài khoản, trạng thái đang xem vai, toast, tooltip, confirm, empty/error/loading, trang đăng nhập và 403/404 cũng thuộc phạm vi overhaul.

## 7. Hợp đồng chung cho panel, form và nút

### 7.1. Chọn đúng bề mặt

| Tác vụ | Bề mặt đề xuất | Điều kiện |
| --- | --- | --- |
| Đọc nhanh một lý do/định nghĩa | Tooltip hoặc popover | Không chứa thao tác lưu quan trọng; dùng được bàn phím/touch |
| Sửa một giá trị ngắn | Inline hoặc hộp neo nhỏ | Nhìn rõ đối tượng, kiểm tra lỗi tại chỗ |
| Ghi kết quả/điền nhiều trường | Panel đủ rộng; mobile toàn màn/bottom sheet phù hợp | Header và footer ổn định, form có vùng cuộn riêng hợp lý |
| Nhập nhiều em/nhiều tiêu chí | Workspace bảng + editor hoặc trang chuyên dụng | Không ép vào popup nhỏ/nhiều lớp overlay |
| Quyết định ảnh hưởng nhiều đối tượng | Preview rồi confirm | Thể hiện số lượng/tác động/ngoại lệ |
| Xem lịch sử dài | Vùng mở rộng hoặc trang chi tiết | Không buộc cuộn qua để làm việc thường nhật |

### 7.2. Quy tắc nút toàn hệ thống

- Mỗi vùng thao tác có một CTA chính theo trạng thái hiện tại; các hành động còn lại phân cấp rõ.
- Dùng động từ cụ thể: “Lưu kết quả”, “Lưu & tiếp”, “Gửi TVV”, “Gửi đề xuất”, “Xác nhận bàn giao”. Chỉ dùng “Lưu” khi ngữ cảnh không thể nhầm.
- Nút icon có tên truy cập và vùng bấm đủ lớn; tác vụ thường dùng không chỉ xuất hiện khi hover.
- Nút disabled có lý do gần đó; nếu hoàn toàn không có quyền thì không render như hành động khả dụng. Server vẫn kiểm quyền.
- Trong request: có trạng thái tiến hành, chặn submit trùng, giữ context. Success chỉ sau server chấp nhận, error giữ dữ liệu nhập.
- Sau lưu: ghi rõ đã lưu gì, vào đâu, ai nhận, việc có đóng không; chuyển tiếp có thể dự đoán.
- Đóng/Escape/Back/đổi tab/đổi học viên xử lý dirty state nhất quán. Không xác nhận bỏ thay đổi nếu người dùng chưa đổi gì.
- Xóa/Rút/Hủy/Không cần theo dõi/Kết thúc sớm không dùng thay nhau. Cảnh báo dựa trên hậu quả thật; tránh hỏi xác nhận cho mọi thao tác thường ngày.
- Undo chỉ có ở nghiệp vụ hỗ trợ. Nếu không thể hoàn tác, cung cấp Sửa hoặc quy trình khắc phục hợp lệ.
- Tránh dropdown trong dropdown và panel chồng panel. Focus trả lại đúng nút mở khi đóng.

### 7.3. Trạng thái phải được thiết kế cùng màn chính

Mọi bề mặt phải có: tải lần đầu; refresh có dữ liệu cũ; rỗng thật; bộ lọc không có kết quả; không có quyền; dữ liệu thiếu; lưu thành công; lỗi validation; lỗi mạng; conflict; thao tác lô một phần; đối tượng bị thay đổi/xóa ở tab khác. Không coi loading/error là việc thêm sau cùng.

### 7.4. Hình thức và khả năng sử dụng

Giữ nhận diện PISA và hệ token/font hiện hành nếu không có lý do tốt để đổi. Tăng phân cấp bằng thứ tự, nhóm và nhãn trước khi thêm màu/card. Dữ liệu dạng bảng dùng số thẳng cột và đơn vị nhất quán; không tô đỏ mọi thứ chưa hoàn tất. Status có chữ/icon chứ không dựa vào màu.

Kiểm tra tối thiểu 375px, 768px và 1440px, sáng/tối. Cỡ vùng chạm khoảng 44px cho control mobile; focus nhìn thấy, label gắn input, tab order hợp lý. Bàn phím điện thoại không che CTA/ô lỗi. Bảng rộng chỉ cuộn trong vùng bảng, giữ tên HV để không nhập nhầm; trang không tràn ngang ngoài ý muốn. Không khóa chiều cao cố định gây cắt nội dung tiếng Việt/tiếng Anh.

## 8. Workflow mục tiêu và cách đo

Các mục tiêu dưới đây là **mục tiêu thiết kế**, chưa phải số click/thời gian đã đo ở bản hiện tại. Claude cần đo baseline và bản mới cùng dữ liệu/cùng vai. Không tối ưu số click bằng cách bỏ bước xác nhận nghiệp vụ cần thiết.

| Workflow | Đường đi mục tiêu | Thành công được tính khi |
| --- | --- | --- |
| GV nhập điểm đến hạn | Bàn làm việc → nhóm lớp/kỹ năng đã chọn → nhập → Lưu & tiếp | Không phải chọn lại lớp/tuần đã có trong việc; bài lưu đúng người và lượt |
| GV cập nhật PA | Việc hoặc hồ sơ HV → form kỳ hiện tại → Lưu kết quả | Đúng PA/cycle; không mất nháp; không đóng nhầm PA |
| GV báo tình hình | Lớp/HV → Báo tình hình → nội dung → Gửi TVV | Người nhận/hạn thấy trước; dữ liệu đã gửi khớp UI |
| GVCN trả lời TVV | Việc → đọc câu hỏi → trả lời → Gửi | Nội dung lưu thật hiển thị; việc/người nhận cập nhật đúng |
| GVCN xử lý ý thức | Việc → xem ghi nhận và bậc → cách xử lý → xác nhận/gửi duyệt | Không phát sinh việc báo PH trước khi đủ điều kiện |
| QL theo dõi | Tổng quan → chỉ số/ngoại lệ → danh sách → chi tiết | Cùng phạm vi và mẫu số; quay lại không mất bộ lọc |
| GV cũ bổ trợ | Việc/Em đang bổ trợ/lớp cũ → HV → kết quả/Mini Test | Không cần nhờ QL nhập hộ chỉ vì em chuyển lớp |
| Chuyển lớp | Chọn em → đích/mốc → preview → xác nhận | Lịch sử giữ, PA còn trách nhiệm vẫn có người làm/lối vào |
| Thao tác lô | Chọn dòng → preview → thực hiện → kết quả từng dòng | Xử lý tiếp được phần lỗi, không nhân đôi phần thành công |

Mục tiêu gợi ý: từ hàng đợi đã có context đến form nhập chính không quá 2 thao tác điều hướng; sau khi đang ở form nhập liên tục, không chọn lại context giữa từng em. Đo thời gian hoàn thành và số lần nhầm context, không chỉ số click. Nhờ ít nhất một GV bộ môn và một GVCN thử những tác vụ có thật trước khi kết luận cải thiện.

## 9. Ma trận nghiệm thu bắt buộc

| Nhóm | Ca thử cần có | Kết quả mong đợi |
| --- | --- | --- |
| Phân quyền | GVBM đúng/sai kỹ năng, GVCN, QL đúng/sai chi nhánh, TVV đúng/sai HV, Admin/CX theo grants | Cả UI và API đúng scope; đổi góc nhìn không làm lộ dữ liệu cache |
| Bổ trợ | GV cũ, GV khác, chuyển chi nhánh, PA kết thúc/hủy/Mini Test chốt | Cấp/thu hồi quyền đúng lifecycle; không có quyền ghi ngoài Case được giao |
| Lưu dữ liệu | Nhập tiếp khi pending, hai lần bấm, lỗi mạng, retry sau timeout | Không mất chữ, không lưu trùng, không hiển thị dữ liệu chưa lưu như đã lưu |
| Xung đột | Hai tab sửa cùng PA/cấu hình, đổi cycle trong khi đang mở | Conflict rõ; giữ bản người dùng; không last-write-wins ngoài chủ đích |
| Tổng số | Nhóm cha/con, 5 lớp, lọc chi nhánh, một em nhiều việc | Header, dòng, panel, badge cùng scope khớp |
| Tình hình | Gửi–rút–gửi lại, Undo, trả lời, batch lỗi một phần | Không trả thành công với bản đã rút; n/m đúng; retry đúng phần |
| Điểm | 0/null/vắng, thiếu tiêu chí, W1/W2, L/R, Speaking chéo, lớp thường | Domain và UI nhất quán; không lấy thiếu dữ liệu thành 0 |
| Lịch sử | Chuyển lớp, đổi GV, backdate phân công, lộ trình mới | Attribution và số liệu lịch sử đúng phiên bản luật |
| Điều hướng | Deep link, refresh, Back, mở từ lớp/việc/tìm kiếm | Giữ context, bộ lọc, vị trí và đối tượng; không bẫy modal |
| Mobile/accessibility | 375/768/1440, sáng/tối, bàn phím, focus, tên dài | Không cắt CTA, không tràn trang, đủ label, thao tác được không dùng chuột |
| Xuất báo cáo | Bộ lọc kỳ/chi nhánh/kỹ năng, thiếu dữ liệu | File khớp màn hình và định nghĩa chỉ số |
| Hiệu năng | Trang GV, bảng lớp, hàng đợi, drilldown, quyền bổ trợ | Không N+1, không tải cả hệ thống rồi lọc client, đo request/query/rows trước–sau |
| Migration | Bản sao DB, chạy lần hai, dữ liệu phân công đầu tiên đồng thời | Idempotent đúng thiết kế; xem tác động KPI trước deploy |

Không dùng việc suite hiện có pass để thay cho các ca F01–F06. Thêm regression đúng hành vi trước khi sửa; test phải phát hiện được bug cũ, không chỉ snapshot mã mới.

## 10. Kế hoạch giao Claude theo từng PR

| Đợt | Nội dung | Điều kiện kết thúc |
| --- | --- | --- |
| 0 — chốt baseline | Refresh main/PR; xác định deployed SHA nếu có; kiểm kê routes/components/controls; đối chiếu luật mới | Bảng phạm vi, bằng chứng và khoảng trống; không gộp live và HEAD |
| 1 — độ tin cậy | F01, F03, F04, F05; kiểm chứng F06/F07 và sửa nếu cần | Regression + demo kết quả; không đợi overhaul mới sửa lỗi lưu |
| 2 — bổ trợ | Triển khai A của #1512 | Test quyền dương/âm, chuyển chi nhánh, thu hồi, work ownership và lối vào |
| 3 — thiết kế toàn luồng | Mockup Bàn làm việc, lớp, HV, workspace nhập, PA, phối hợp, QL và mobile | Chủ SP xem được trước/sau, lý do và tradeoff; thống nhất điều hướng |
| 4 — nền giao diện | Header/nav theo vai, context, panel/form/footer/dirty/success/error thống nhất | Các trang đang dùng không hồi quy; deep link cũ vẫn hoạt động |
| 5 — GV thường nhật | Bàn làm việc → lớp → HV → nhập điểm → PA, từng màn/PR | Workflow liền mạch, đo thao tác trước/sau |
| 6 — phối hợp/vận hành | Ý thức, tình hình, TVV, chuyển lớp/bàn giao/lộ trình/lưu trữ | Quyền/hạn/duyệt/batch/handoff đúng |
| 7 — giám sát/quản trị | QL/Phân tích, hồ sơ GV, cấu hình, tài khoản, nhật ký, hướng dẫn | Số liệu khớp, không tăng quyền ngoài ý định, hướng dẫn mới |
| 8 — nghiệm thu | Kiểm kê không còn bề mặt bỏ sót; thử vai/thiết bị/mạng và migration | Báo cáo ca pass/fail/blocked; ảnh demo đã ẩn dữ liệu thật; danh sách hạn chế |

Không thực hiện một PR khổng lồ thay cả frontend/backend. Dùng vertical slice có đường đi hoàn chỉnh và có thể review. Giữ API/domain hiện có khi đủ dùng; không tái viết backend để phục vụ mỹ thuật. Sau mỗi thay đổi quyền hoặc dữ liệu, chạy kiểm tra phù hợp và security review theo quy trình repo. Không thêm request ở mọi lần gõ/hover; không prefetch dữ liệu các vai không có quyền.

## 11. Đầu ra Claude phải trả

1. Bảng xác nhận F01–F07: còn lỗi/đã sửa/không tái hiện/luật mới thay đổi, kèm bằng chứng.
2. Sơ đồ điều hướng theo vai và mockup các màn thay đổi cấu trúc; ưu tiên GV làm việc thực tế.
3. Danh mục tất cả route/tab/panel/form/control với quyết định **Giữ / Sửa / Gộp / Bỏ / Di chuyển**, lý do và PR phụ trách. Không để control không có quyết định.
4. Mỗi PR: vấn đề cụ thể, hành vi trước/sau, luật giữ nguyên, test phù hợp, ảnh demo desktop/mobile, query/request trước–sau nếu chạm dữ liệu.
5. Traceability từ yêu cầu chủ SP → màn/luồng → component/API → acceptance test. Đánh dấu phần chưa kiểm chứng; không viết “đã audit toàn bộ” khi chỉ xem trang tổng quan.
6. Cuối đợt: checklist hồi quy, cập nhật hướng dẫn, những quyết định còn cần chủ SP; không hỏi lại những điều đã chốt trong tài liệu/spec A.

### Prompt bắt đầu có thể dùng trực tiếp

> Hãy đọc toàn bộ tài liệu này và đối chiếu với main hiện tại của Pizi147/pisa-tracking. Trọng tâm là GV là người thao tác chính, QL chủ yếu giám sát và can thiệp. Chủ động rà soát toàn bộ route, tab, panel, form, bảng và nút; đề xuất thay cấu trúc khi cần để workflow trực diện và nhanh hơn. Trước tiên kiểm chứng F01–F07, giữ những sửa đã có, thực hiện phương án A của #1512 theo đúng luật quyền tạm. Tách bản production, HEAD và plan chưa code. Hoàn thiện thiết kế và kế hoạch theo từng PR, không bỏ qua các bề mặt phụ/quản trị/mobile/error. Lỗi độ tin cậy có thể xử lý độc lập trước overhaul; thay bố cục lớn cần mockup cụ thể theo quy trình repo. Không sửa luật nghiệp vụ để làm UI trông đơn giản. Báo cáo bằng chứng, kiểm tra, phần còn thiếu; không tự merge/deploy.

## 12. Nguồn mã và quyết định tham chiếu

Các đường dẫn nguồn dưới đây trỏ đúng baseline; Claude cập nhật vị trí dòng nếu main đã đổi.

- [Luật và quyết định trong plan.md](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/plan.md)
- [PRODUCT.md](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/PRODUCT.md), [DESIGN.md](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/DESIGN.md)
- [Routes và prefetch](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/web/src/App.tsx)
- [F01 grouping](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/shared/domain/gopViec.ts#L122), [header Công việc](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/web/src/modules/congViec/HoTroHocVienTab.tsx#L404)
- [F03/F04 giao diện Tình hình](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/web/src/modules/yThuc/TinhHinh.tsx#L155)
- [F05 service Tình hình](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/server/src/yThuc/tinhHinh.ts#L99)
- [F06 form kết quả PA](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/web/src/modules/cases/CapNhatTuan.tsx#L473)
- [Spec A GV cũ bổ trợ](https://github.com/Pizi147/pisa-tracking/blob/301b94b536b851d8eeffed0a2cd6dc85a938f42e/docs/superpowers/specs/2026-11-13-gv-cu-bo-tro-design.md)
- [Đặc tả Tình hình học tập](https://github.com/Pizi147/pisa-tracking/tree/301b94b536b851d8eeffed0a2cd6dc85a938f42e/docs/superpowers/specs/2026-11-12-tinh-hinh-hoc-tap)


## 13. Brainstorm vòng 2 — làm workflow rõ hơn và giảm gánh nhập liệu

**Bổ sung theo yêu cầu chủ SP sau bản audit đầu tiên.** Phần này phân tích lại những gì đã ghi nhận ở baseline #1512; không phải một đợt kiểm tra PR mới hoặc danh sách lỗi mới được tái hiện. Các ví dụ dùng dữ liệu giả định. Nếu nội dung bố cục ở phần 5–10 có nhiều cách hiểu, áp dụng phần tinh chỉnh dưới đây cho đề xuất thiết kế. Luật nghiệp vụ và các mức bằng chứng F01–F07 không thay đổi.

### 13.1. Năm điều cần chỉnh trong chính bản đề xuất trước

| Đề xuất trước | Rủi ro khi làm máy móc | Tinh chỉnh |
| --- | --- | --- |
| Thêm Bàn làm việc cho GV | Thành trang thứ ba lặp Tổng quan và Công việc | Tái cấu trúc điểm vào hiện có; một hàng đợi công việc, nhiều lối truy cập có context; tên menu có thể giữ “Công việc” nếu dễ hiểu hơn |
| Xếp quá hạn trước mọi thứ | Việc cũ hoặc đang chờ người khác che công việc GV thực sự làm được hôm nay | Phân biệt khả năng hành động trước, rồi xếp theo hạn trong từng nhóm; không âm thầm sửa hạn hay xóa tồn đọng |
| Thêm chế độ/tab theo tác vụ | Thêm quá nhiều bộ lọc và tầng điều hướng | Chỉ đưa lên mức tab khi mục tiêu hoặc cấu trúc dữ liệu khác hẳn; còn lại dùng lựa chọn gọn trong cùng màn |
| Một CTA chính cho mỗi vùng | Nhiều vùng đều có nút màu nổi làm màn vẫn rối | Một hành động ưu tiên ở vùng đang làm; các dòng còn lại dùng nút/link nhẹ. Khi mở editor, CTA của editor chiếm ưu tiên |
| Nhớ lớp/tuần/bộ lọc | Tự điền tuần cũ hoặc lớp cũ khi đổi người/vai, gây nhập nhầm | Deep link của việc thắng giá trị đã nhớ; luôn hiện context trước khi nhập. Chỉ nhớ tùy chọn trình bày an toàn; kiểm lại scope khi đổi vai |

**Mục tiêu mới rõ hơn:** giảm số quyết định GV phải tự suy, số lần nhập lại cùng dữ liệu và số lần phải hỏi “việc này đến lượt ai?”. Không chỉ giảm số click.

### 13.2. U01 — Một nơi làm việc, không bắt GV đổi vai để làm việc hằng ngày

**Căn cứ:** người dùng có thể vừa dạy bộ môn, vừa chủ nhiệm, vừa còn trách nhiệm bổ trợ sau khi em chuyển lớp. Audit trước đã ghi nhận nhiều góc nhìn và spec A.

Trong góc nhìn GV, hiển thị các nhiệm vụ hợp lệ theo phân công dưới nhãn “Bộ môn”, “Chủ nhiệm”, “Bổ trợ”. Đây là nhãn trách nhiệm, không phải ba role mới. Cùng một công việc xuất hiện qua nhiều điều kiện quyền vẫn chỉ có một bản ghi và một lần tính vào tổng.

Không yêu cầu GV đổi menu tài khoản từ “bộ môn” sang “chủ nhiệm” để tiếp tục với cùng em. Nếu tài khoản còn là QL, giữ góc nhìn quản lý riêng theo cơ chế quyền hiện hành; không tự hợp tất cả quyền của tài khoản vào một màn nhập liệu.

**Nghiệm thu:** một người là GVBM lớp A, GVCN lớp B và GV bổ trợ em C nhìn thấy đủ việc được giao, không trùng; mở từ bất kỳ lối nào vẫn cùng quyền và lịch sử. Khi đổi góc nhìn, draft/cache không trộn và không tự gửi với quyền rộng hơn.

### 13.3. U02 — Tách trạng thái công việc, trạng thái lưu và trạng thái học tập

**Căn cứ:** F03/F05 cho thấy UI có thể biểu thị thành công không khớp dữ liệu thật; F07 cho thấy nhãn hoàn tất dễ bị hiểu rộng hơn phạm vi của nó.

Ba câu hỏi khác nhau phải có ba cách trả lời rõ:

| Câu hỏi | Ví dụ nhãn | Không được suy ra |
| --- | --- | --- |
| Nội dung của tôi đã lưu chưa? | Chưa lưu / Đang lưu / Đã lưu nháp / Đã gửi / Chưa xác định kết quả | Đã lưu nháp không có nghĩa đã gửi người nhận |
| Việc hiện đang đến lượt ai? | Bạn cần làm / Chờ TVV / Chờ QL duyệt / Chưa có người phụ trách / Đã xong bước của bạn | GV đã gửi không có nghĩa cả quy trình hoàn tất |
| Tình hình học tập của em thế nào? | Thiếu điểm / SOS tạm / Đạt kỳ vọng / PA đang chạy | Hết việc không có nghĩa em đạt mục tiêu |

Dùng mapping từ trạng thái nghiệp vụ hiện có trước khi thêm trạng thái DB. “Đã lưu” là phản hồi của thao tác; “Chờ TVV” là tình trạng phối hợp. Có thể cùng hiển thị, không gộp thành một badge xanh chung.

**Nghiệm thu:** lưu nháp, gửi duyệt, duyệt, người nhận phản hồi và kết thúc đều có nhãn đúng; người thử giải thích được bước tiếp theo mà không mở lịch sử kỹ thuật.

### 13.4. U03 — Hàng đợi có thể hành động và một lối xử lý việc bị kẹt

Chia ở mức trình bày thành **Cần tôi làm · Đang chờ · Đã xử lý gần đây**. Với “Đang chờ”, hiện chờ ai, từ khi nào, hạn và lý do; không cộng chung vào số việc GV phải làm ngay. Việc chưa có người nhận hoặc thiếu dữ liệu bắt buộc phải hiện thành ngoại lệ đúng scope cho người có quyền xử lý.

Không tạo nút “Hoàn thành” để dọn việc vốn chưa xong. Không thêm Snooze làm thay đổi hạn nghiệp vụ. Nếu sau này cho ghim/ẩn bớt về mặt trình bày, cần giữ số tồn đọng và lối xem lại; trước mắt chỉ cần bộ lọc rõ.

Mỗi loại việc cần trả lời được: điều kiện sinh việc; ai làm; điều kiện đóng; điều kiện chuyển người; điều kiện hết hiệu lực. Tránh việc “mồ côi” vẫn đếm nhưng không ai mở hoặc xử lý được.

**Nghiệm thu:** thử mất phân công, thiếu GVCN/TVV, chuyển chi nhánh và người nhận đổi giữa chừng. Hiển thị đúng fallback đã có trong luật; nếu luật chưa định nghĩa thì ghi rõ cần quyết định, không âm thầm giao QL mọi việc.

### 13.5. U04 — Giữ ổn định danh sách trong lúc nhập liên tục

**Căn cứ:** đã quan sát nhóm nhiều lớp, panel và Lưu & tiếp; lỗi tổng số bài làm tăng nguy cơ hiểu sai vị trí công việc.

Khi bắt đầu một lượt nhập, giữ danh sách ID và thứ tự đang làm để việc refetch/điểm vừa thay đổi không làm dòng kế tiếp nhảy. Hiện “Em 3/12 · còn 9 bài trong danh sách này”. Số này khác tổng việc toàn hệ thống. Việc mới đến có tín hiệu nhẹ và nhập vào danh sách khi người dùng chọn làm mới hoặc kết thúc lượt.

Giữ thứ tự không có nghĩa bỏ kiểm tra mới nhất: trước mutation vẫn kiểm quyền, revision và trạng thái em/lượt Test. Em đã chuyển lớp hoặc bài vừa được người khác chấm thì giải thích và cho bỏ qua/xem bản mới. Không tự ghi đè chỉ để giữ nhịp nhập.

Nút “Bỏ qua em này” chỉ chuyển vị trí trong lượt làm, không đánh vắng, không hoàn tất và không xóa việc. Cuối lượt cho thấy đã lưu, đã bỏ qua, còn lỗi. Không tự sang lớp/tuần khác bằng một lần Enter khó nhận biết.

**Nghiệm thu:** người khác chấm một bài trong danh sách khi GV đang ở bài trước; filter loại dòng sau lưu; kết quả không nhảy sai em, lặp em hoặc bỏ mất việc chưa làm.

### 13.6. U05 — Chuỗi ngữ cảnh luôn đủ để tránh nhập nhầm

Các lỗi nhập nhầm khó nhận biết hơn lỗi form đỏ. Trên editor, luôn có tên HV + mã nhận diện khi cần phân biệt trùng tên + lớp + kỹ năng + mốc đang ghi. Không bắt người dùng ghi nhớ context nằm ngoài panel.

Phân biệt ba loại thời gian: **ngày thực hiện, kỳ được báo cáo, thời điểm nhập hệ thống**. Ví dụ “Kết quả W1–W2 NOV · nhập ngày 13/11” có thể cần thiết; không gọi cả ba là “Ngày”. “Tuần học 12” phải khác “W2 NOV”. Nhãn gọn trên màn, định nghĩa đầy đủ khi mở thông tin.

Deep link từ việc có đủ context thì bỏ bước chọn lại. Mở từ tìm kiếm chưa có kỹ năng/lượt thì yêu cầu chọn đúng một lần; tuyệt đối không dùng âm thầm lượt nhập cuối của em khác.

**Nghiệm thu:** hai em trùng tên, một em nhiều PA cùng kỹ năng, chuyển lớp giữa kỳ, nhập bù tuần trước; payload và nhãn khớp.

### 13.7. U06 — Một lần ghi nhận, tái sử dụng đúng nguồn cho phối hợp

**Căn cứ:** luồng GV báo tình hình → TVV báo PH và TVV hỏi → GVCN trả lời có nguy cơ buộc người dùng chép lại nội dung ở nhiều nơi.

Panel phối hợp nên dẫn chiếu nội dung nguồn, người ghi và thời điểm; phần người nhận nhập là kết quả/bước tiếp theo, không yêu cầu chép lại toàn bộ vấn đề. Báo cáo PH có thể lấy dữ liệu đã có để **xem trước**, người có trách nhiệm duyệt nội dung trước khi dùng.

Nếu cần giữ nguyên căn cứ tại lúc gửi, dùng snapshot hoặc phiên bản nguồn phù hợp; đừng để sửa ghi chú hôm nay âm thầm thay đổi nội dung được coi là đã gửi trước đó. Hiển thị bản mới và bản tại thời điểm gửi khi có khác biệt quan trọng. Ưu tiên cơ chế lịch sử đã có, không nhân đôi nhiều bảng lưu cùng nội dung tùy tiện.

Không tự động gửi tin ra ngoài, không tự xác nhận “đã báo PH” chỉ vì GV đã ghi tình hình. Ghi nhận nội bộ và liên hệ thực tế vẫn là hai bước khác nhau.

**Nghiệm thu:** sửa nội dung nguồn sau khi TVV đã xử lý; lịch sử vẫn giải thích được TVV đã dựa vào bản nào, không cần nhập lại ghi nhận ban đầu.

### 13.8. U07 — Nhập nhanh bằng cấu trúc gọn, không tạo kết quả hàng loạt giả

Mẫu câu hoặc gợi ý cấu trúc chỉ giúp GV viết đủ ý: “Quan sát cụ thể → đã hỗ trợ gì → cần phối hợp gì”. Không bắt mọi ghi chú thành một form dài; có thể chỉ một ô nội dung kèm gợi ý ngắn.

Dùng lại context lớp/kỹ năng/kỳ và loại hoạt động khi hợp lệ. **Không mặc định sao chép điểm, kết luận tiến bộ, số buổi đã học hoặc nội dung quan sát của em trước sang em tiếp theo.** Nếu có nút áp dụng chung, chỉ cho các trường thật sự dùng chung theo luật; preview tên từng em và giá trị trước khi lưu.

Không cần AI viết nhận xét tự động trong đợt overhaul đầu. Giá trị lớn hơn là giảm nhập lặp và giữ đúng em/đúng nguồn. Nếu sau này thêm AI, đó là phạm vi riêng, đầu ra chỉ là bản nháp cần GV kiểm tra.

**Nghiệm thu:** chuyển từ em A sang B không mang theo kết luận cá nhân A; áp dụng lô không vượt giới hạn 8 em của luồng báo tình hình.

### 13.9. U08 — Nháp có thể tiếp tục nhưng không hứa làm việc offline

Tận dụng cơ chế nháp hiện có; mở rộng có chọn lọc cho form dài hoặc có rủi ro mất chữ. Mỗi nháp gắn với tài khoản, đối tượng, loại hành động, kỹ năng/kỳ/cycle và revision liên quan. Không dùng một khóa “ghi-chu” chung cho mọi em.

Khi quay lại có nháp, nói rõ nháp nào, thời điểm nào, cho tiếp tục hoặc bỏ. Nếu dữ liệu gốc đã đổi, hiển thị đối chiếu và yêu cầu xem lại phần liên quan; không tự nạp nháp stale rồi gửi đè.

Nếu mạng ngắt sau submit, trạng thái có thể là “Chưa xác định kết quả”; kiểm tra bản đã commit bằng ID/idempotency trước khi gửi lại. Không nói “Lưu thất bại” chắc chắn khi chỉ mất phản hồi. Không xây hàng đợi mutation offline tổng quát trong đợt đầu vì quyền/phân công/điểm có thể thay đổi trong thời gian offline.

Khi hết phiên, hướng dẫn đăng nhập lại và khôi phục đúng nháp nếu còn quyền; nếu quyền bị thu hồi, không tự mở lại dữ liệu hoặc xuất nó ra ngoài. Quy định thời hạn giữ/xóa nháp và xử lý máy dùng chung trước khi mở rộng lưu lâu dài.

**Nghiệm thu:** reload, hết phiên, đổi tài khoản, chuyển cycle, mất phản hồi sau commit; không thất thoát nháp hợp lệ và không lẫn dữ liệu giữa người dùng.

### 13.10. U09 — QL nhìn thấy điểm nghẽn và chất lượng dữ liệu, không chỉ bảng thành tích

Trang QL cần trả lời ba câu: **việc nào đang kẹt, kẹt ở bước nào, ai có thể gỡ?** Ưu tiên ngoại lệ như chưa có người phụ trách, quá hạn xử lý, thiếu dữ liệu khiến chưa thể kết luận, bổ trợ chưa có người thực hiện. Mỗi ngoại lệ dẫn đúng chi tiết và hành động trong quyền.

Đặt cạnh tỷ lệ kết quả thông tin độ đầy đủ: “7/12 em đủ dữ liệu” hoặc “5 em chưa đủ điểm”, theo định nghĩa metric hiện hành. Thiếu điểm không được tô như học lực yếu hoặc coi là không đạt. Chưa ghi nhận tiến độ không tự đồng nghĩa GV không dạy/học sinh không học.

Không xếp hạng GV chỉ bằng số việc còn lại: một việc có thể là 28 bài, một việc khác là một câu trả lời. Giữ phân loại khối lượng theo đơn vị. Dữ liệu lịch sử backdate/phân công chia tuần có thể thay đổi tỷ lệ; popup giải thích nguồn và thời điểm cập nhật, không tự đưa ra kết luận đánh giá nhân sự.

**Nghiệm thu:** cùng tỷ lệ nhưng mẫu số khác; một lớp thiếu điểm; công việc nhóm nhiều bài; số liệu và drilldown không khiến người xem hiểu thiếu dữ liệu thành kết quả kém.

### 13.11. U10 — Một hợp đồng đếm chung cho mọi bề mặt

F01 nên dẫn tới rà soát cả hệ thống: mỗi counter cần khai báo **đơn vị, phạm vi, trạng thái, thời điểm tính**. Ví dụ “28 bài chưa nhập · 5 lớp · tuần này” rõ hơn “28 việc”. Các vị trí dùng cùng scope phải lấy cùng kết quả tính hoặc cùng selector; không tự parse số từ chuỗi tiêu đề.

Cùng một em có hai PA là một HV nhưng có thể hai nhiệm vụ. Một nhóm 5 lớp là một nhóm hiển thị nhưng 5 lớp và 28 bài. Badge thông báo có thể chỉ đếm việc cần làm ngay; nếu khác tổng trang, nhãn phải nói được vì sao. Không ép mọi số khác nhau thành giống nhau khi chúng có định nghĩa khác.

**Nghiệm thu:** một bộ fixture được dùng kiểm tra header, nhóm, panel, ô Tổng quan và xuất file theo đúng phạm vi; thay filter/hoàn thành một lá cập nhật tất cả số liên quan, không đếm hai lần.

### 13.12. U11 — Thông báo theo sự kiện cần hành động, không tạo thêm áp lực nhắc việc

Tái dùng Công việc và chuông hiện có. Thông báo nói rõ điều gì đổi, người nào cần làm bước tiếp theo, đối tượng và hạn. Gộp các thông báo trùng về một đối tượng/sự kiện khi phù hợp; refetch không được tạo thông báo mới.

“Đã đọc” không phải “đã xử lý”. Mở thông báo cũ về việc đã hoàn tất thì đến trang có trạng thái hiện tại, không một form còn cho gửi lại hành động đã xong. Không thêm email/push/nhắc tất cả hoặc đổi luật hạn chỉ để tăng tương tác. Các kênh ngoài website cần yêu cầu sản phẩm riêng.

**Nghiệm thu:** GV đã làm ở trang lớp thì chuông/Công việc không vẫn dẫn tới một hành động stale; cập nhật nhiều lần cùng dữ liệu không spam.

### 13.13. U12 — Tách nhập liệu, xem cùng người khác và báo cáo gửi ra ngoài

Tình huống cần thử: GV mở web khi đang chiếu màn hình trong lớp. Ghi chú nội bộ, thông tin liên hệ và nội dung phối hợp không nên tự mở nổi bật chỉ vì có thông báo. Mặc định các vùng riêng tư ở trạng thái thu gọn; không làm mất lối truy cập của người có quyền.

Nếu thực tế GV thường chiếu web, cân nhắc một chế độ trình bày ẩn thông tin nội bộ, tên nhãn rõ và có thể bật/tắt; không bắt làm feature này trước khi xác nhận nhu cầu. Đây là tùy chọn trình bày, không thay authorization.

Báo cáo PH phải có preview riêng, chọn dữ liệu được phép đưa ra ngoài theo luật trung tâm; không coi mọi ghi chú nội bộ là nội dung gửi PH. Không dùng xuất toàn bảng như một đường tắt thay cho báo cáo đúng đối tượng.

**Nghiệm thu:** mở thông báo, mở hồ sơ và preview báo cáo; không tự đưa ghi chú nội bộ vào bản gửi chỉ vì nó đang hiện trên trang GV.

### 13.14. U13 — Sửa thông tin sai và xem tác động trước khi sửa

Ngoài luồng tạo mới, cần thiết kế thao tác sửa sau khi người khác đã dựa vào dữ liệu: sửa điểm, ngày thi, target, tuần bắt đầu, phân công hoặc kết quả PA. Chỉ ra những chỉ số/việc có thể được tính lại theo luật hiện hành; không hứa phục hồi mọi tác động bằng Undo.

Trường đơn giản sửa inline; trường có ảnh hưởng dây chuyền cần preview ngắn và kiểm tra revision. Không hỏi xác nhận mọi lỗi chính tả, nhưng cũng không để đổi mốc làm dịch cả báo cáo mà chỉ có toast “Đã lưu”.

Giữ actor thực hiện và owner nghiệp vụ tách nhau: QL nhập thay GV không tự biến QL thành người dạy/chấm. Khi có thao tác làm thay, ghi ai làm thay và cho ai theo audit log hiện có; lý do chỉ bắt buộc khi quy chế yêu cầu.

**Nghiệm thu:** QL sửa hộ, sửa điểm làm thay đổi SOS, thay mốc báo cáo; dữ liệu dẫn xuất nhất quán và lịch sử giải thích được thay đổi.

### 13.15. U14 — Chuyển sang giao diện mới có đường quay lại và không làm mất việc dở

Triển khai theo workflow hoàn chỉnh: từ việc → nhập → lưu → tiếp theo → quay về. Không ra mắt header mới trong khi liên kết vẫn dẫn vào panel cũ không giữ context. Deep link cũ phải đến đúng em/việc, không chỉ chuyển về trang chủ.

Nếu dùng cờ rollout, giữ đơn giản và thời hạn loại bỏ rõ; không duy trì hai bộ form, hai cách tính số và hai nguồn quyền lâu dài. Có cách quay lại bản giao diện trước khi cần, nhưng không rollback dữ liệu nghiệp vụ mới ghi để rollback layout.

Ngày đầu dùng mới cần chỉ dẫn ngắn tại chỗ “Nhập điểm ở đây”, không tour dài. Hướng dẫn theo vai và ảnh minh họa cập nhật cùng release. Trước triển khai, kiểm tra nháp cũ/URL cũ vẫn xử lý đúng; ghi rõ thay đổi nếu draft không tương thích và cho người dùng phục hồi hợp lệ.

**Nghiệm thu:** đang có nháp khi đổi phiên bản, bookmark một việc cũ, chuyển thiết bị, quay lại lớp; không mất đường vào hoặc trạng thái đang làm.

### 13.16. Đặt thứ tự để tránh biến overhaul thành quá tải tính năng

| Mức triển khai | Nội dung | Lý do |
| --- | --- | --- |
| Làm trước | F01/F03/F04/F05; kiểm chứng F06; quyền bổ trợ A; U02/U05/U10 | Độ tin cậy và hiểu đúng dữ liệu là nền của thao tác nhanh |
| Cốt lõi overhaul GV | U01/U03/U04; lớp/HV/editor gọn; U06/U07 theo luồng sẵn có | Giảm chuyển vai, nhập lặp và nhầm đối tượng |
| Cốt lõi QL/TVV | U09/U11/U13; đồng bộ với workflow GV | QL nhìn được ngoại lệ; người nhận hiểu việc tiếp theo |
| Hoàn thiện phục hồi/rollout | U08/U14; kiểm thử mobile, session và mạng | Đảm bảo làm việc dài và chuyển phiên bản không mất dữ liệu |
| Cân nhắc sau khi chứng minh nhu cầu | Chế độ trình chiếu riêng U12; cá nhân hóa sâu; automation mới | Có thể hữu ích nhưng chưa có quan sát đủ để ưu tiên trước |

**Chưa nên làm trong đợt này:** dashboard kéo thả, menu tùy biến quá sâu, chatbot phủ toàn web, AI tự chốt nhận xét, gamification số việc, thêm kênh nhắc tự động, engine offline toàn bộ, xây lại hệ thống lịch. Những thứ này chưa giải quyết trực tiếp các điểm nghẽn đã quan sát và có thể tạo thêm cấu hình.

### 13.17. Năm kịch bản prototype phải chứng minh được

1. **GV vừa xong một lớp:** mở lớp đang dạy → thấy đúng kỹ năng/tuần → nhập các bài còn thiếu → bỏ qua một em chưa có bài mà không đánh vắng → cuối lượt biết chính xác đã lưu gì và còn gì.
2. **GV bị gián đoạn:** đang nhập PA thì mở xem thông tin Test → quay lại còn chữ → mất mạng sau khi bấm lưu → nhận trạng thái chưa xác định → kiểm tra được server đã nhận hay chưa, không gửi trùng.
3. **GV kiêm GVCN:** xong nhập điểm bộ môn → chuyển sang câu hỏi TVV của lớp chủ nhiệm → trả lời → thấy việc chuyển sang trạng thái chờ phù hợp; không đổi vai ba lần và không đếm cùng việc hai lần.
4. **Em chuyển lớp nhưng còn bổ trợ:** em rời roster đang học, vẫn có lối ở Em đang bổ trợ → GV cũ ghi Mini Test đúng quyền → khi kết thúc quyền tạm thu hồi; GVCN mới theo dõi được mà không phải tạo Case trùng.
5. **QL mở web buổi sáng:** thấy việc bị kẹt và dữ liệu thiếu → mở đúng đối tượng → can thiệp trong quyền → actor làm thay được ghi đúng → quay lại số liệu/ngoại lệ cập nhật cùng phạm vi.

Với mỗi kịch bản, ghi: hoàn thành được không; số lần chọn lại context; trường phải nhập lại; lỗi nhầm em/tuần; lần cần người hướng dẫn; thời gian làm; dữ liệu sau reload. So sánh trước/sau cùng người và cùng dữ liệu thử. Không lấy thời gian bấm của người đã biết hệ thống để kết luận GV mới dùng sẽ dễ.

### 13.18. Chỉ dẫn bổ sung cho Claude

> Hãy dùng U01–U14 để tinh chỉnh thiết kế, không biến tất cả thành feature mới. Trước mỗi đề xuất, chỉ ra phần hiện tại đã có và phần thật sự còn thiếu. Tái dùng quyền, nguồn dữ liệu, form và hàng đợi hiện hành. Ưu tiên giảm nhập lại, giữ đúng đối tượng, nhìn rõ người làm bước tiếp theo và trạng thái lưu thật. Dùng năm kịch bản ở 13.17 làm xương sống prototype; cho mỗi nâng cấp biết nó cải thiện bước nào và đánh đổi gì. Các trạng thái/bộ đếm mới trước hết là phép chiếu từ domain hiện có, không tự thay hạn, owner hoặc quy trình. Những việc chưa có bằng chứng nhu cầu để sau; không làm phức tạp web chỉ để hoàn thành một checklist overhaul.


## Phụ lục A — Bản đồ route không được bỏ sót

Route lấy từ `web/src/App.tsx` ở baseline. Bảng này là phạm vi thiết kế/QA; không phải danh sách màn đã thử đủ bằng browser.

| Route | Phạm vi kiểm kê / xử lý |
| --- | --- |
| `/` | Tổng quan theo vai; đề xuất Bàn làm việc GV; ô số, drilldown, bộ lọc, CTA |
| `/phan-tich` | Mọi tab phân tích, kỳ, chi nhánh, bảng, drilldown, xuất báo cáo |
| `/hoc-vien` | View lớp/HV, tìm kiếm, lọc, thêm/import, chọn lô, SOS, lịch thi thật, xuất |
| `/hoc-vien/lop/:classId` | Header, roster, công việc, điểm/tiến độ, Ý thức, phân tích, PH, tổng kết/bàn giao |
| `/hoc-vien/luu-tru` | Lớp và HV lưu trữ, thứ tự mới, tìm, khôi phục/thao tác lô trong quyền |
| `/hoc-vien/:id` | Học thuật, Ý thức & Phối hợp, Lộ trình & lớp, header/điểm, trước/sau, menu |
| `/hoc-thuat/case/:id` | Deep link Case; parity với Case trong hồ sơ, quyền và context quay lại |
| `/test/:tab?` | Lịch Test tuần, Kế hoạch Test, lưới điểm, xếp lịch, Speaking chấm chéo, xuất |
| `/nhap-diem/:classId` | Route cũ: chuyển hướng giữ được context hữu ích, không vòng lặp |
| `/bang-diem-thuong/:classId` | Route cũ: chuyển hướng và dữ liệu lớp thường đúng |
| `/mock-test/:id` | Chi tiết lượt FT, kỹ năng, tiêu chí, SOS tạm/chính thức, lịch sử sửa |
| `/luot-test/:id` | Chi tiết lượt lớp thường, thang điểm/chương trình, trạng thái thiếu/vắng |
| `/cong-viec/:tab?` | Mọi nhóm việc, tab, bộ lọc, panel tại chỗ, next, badge, kết quả trong phiên |
| `/quan-tri` | Mọi tab được cấp quyền; tài khoản/chi nhánh/chương trình/quy đổi/ngưỡng/hạn/nhật ký/đã xóa |
| `/ho-so-ca-nhan` | Thông tin/cài đặt cá nhân, validation và lưu |
| `/giao-vien/:id` | Phân công, KPI, tuần dạy, em đang bổ trợ, quyền xem |
| `/huong-dan` | Tìm/chọn hướng dẫn theo vai, link tác vụ, nội dung khớp overhaul |
| `/tutor/*` | Hiện redirect về `/`; giữ tương thích, không coi file cũ là feature đang public |
| `/dev/thanh-phan` | Bộ mẫu UI dev; cập nhật để phản ánh component mới, không mở cho production ngoài cấu hình |
| `*` và cổng đăng nhập | Route không tồn tại, session hết hạn, 403, loading và lỗi truy cập |

## Phụ lục B — Kiểm kê mã UI để Claude không bỏ sót control

Danh mục dưới đây được tạo từ **tất cả file TSX trong `web/src/modules` và `web/src/ui`** ở baseline, không chỉ tên có chữ Panel/Page. Có cả component phụ và file có thể không còn được route sử dụng. Claude phải truy ngược import để phân biệt đang hoạt động, dùng gián tiếp và không còn dùng; không xóa chỉ vì tên cũ.

`Điểm control` là số dấu mở JSX cho button/input/select/textarea/a/Link/NavLink hoặc tên component chứa Button trong mã, dùng để định vị chỗ cần rà. Đây **không phải số nút hiển thị thực tế**, không đếm được mọi control sinh động và không chứng minh đã kiểm tra. Mỗi file vẫn phải được xem dù số đếm là 0. Ngoài danh mục này, rà `App.tsx`, cổng session/login, CSS và các render helper ngoài hai thư mục khi chúng sinh UI.

Bảng quyết định Claude cần tạo cho mỗi control thực tế:

| Màn / trạng thái / vai | Control / component | Quyền + API | Giữ/Sửa/Gộp/Bỏ/Di chuyển | Lý do + sau thao tác | Ca nghiệm thu / PR |
| --- | --- | --- | --- | --- | --- |
| Điền khi kiểm kê | Nhãn thật và đường dẫn nguồn | Capability, scope, endpoint | Một quyết định rõ | Context, loading, error, success | Liên kết bằng chứng |

Tổng cộng **282 file TSX** trong phạm vi quét này.

### `web/src/modules/cases`

| File | Điểm control trong mã |
| --- | ---: |
| `BuoiTutorO.tsx` | 5 |
| `CapNhatTuan.tsx` | 10 |
| `CaseBoardPage.tsx` | 0 |
| `CasePanel.tsx` | 37 |
| `ChiTietKyNang.tsx` | 4 |
| `DoiNguoiPhuTrach.tsx` | 2 |
| `DoiPa.tsx` | 1 |
| `DongXinYKien.tsx` | 0 |
| `FormPa.tsx` | 4 |
| `NeedsEvaluation.tsx` | 1 |
| `QuickReport.tsx` | 13 |
| `SkillBoard.tsx` | 1 |
| `TaiCho.tsx` | 8 |
| `ThaoTacCase.tsx` | 3 |

### `web/src/modules/cham`

| File | Điểm control trong mã |
| --- | ---: |
| `DiemTheoLop.tsx` | 8 |
| `DongThi.tsx` | 0 |
| `GvCham.tsx` | 2 |
| `LuoiChamLop.tsx` | 2 |
| `LuoiFT.tsx` | 12 |
| `LuoiThuong.tsx` | 5 |
| `MotKyNang.tsx` | 5 |
| `NganLichSuBai.tsx` | 0 |
| `PanelNhapDiemLop.tsx` | 1 |

### `web/src/modules/classes`

| File | Điểm control trong mã |
| --- | ---: |
| `BanGiaoGvPanel.tsx` | 5 |
| `BanGiaoPanel.tsx` | 12 |
| `BangCanHoTro.tsx` | 2 |
| `BangDiemLopThuong.tsx` | 4 |
| `BangHoSoLop.tsx` | 13 |
| `BangKqdrLopFt.tsx` | 2 |
| `CanhBaoYThuc.tsx` | 0 |
| `ClassCreatePanel.tsx` | 6 |
| `ClassIssueBoard.tsx` | 0 |
| `ClassOverviewPage.tsx` | 1 |
| `ClassProgressPanel.tsx` | 4 |
| `CuoiKhoaLop.tsx` | 40 |
| `DaiChuyenLop.tsx` | 12 |
| `DauTrangLop.tsx` | 4 |
| `HopDotBaoCaoPh.tsx` | 3 |
| `HopLuuPhanCong.tsx` | 11 |
| `LuoiTaoLop.tsx` | 9 |
| `PanelXetLai.tsx` | 12 |
| `PhanTichLopTab.tsx` | 0 |
| `TabBaoCaoPh.tsx` | 26 |
| `TabHocVienLop.tsx` | 2 |
| `TabTongKetLop.tsx` | 1 |
| `TeacherAssignPanel.tsx` | 1 |
| `TenGiaoVien.tsx` | 1 |
| `ThanhViecLop.tsx` | 2 |
| `ThongTinLopPanel.tsx` | 6 |
| `XoaKetThucLopPanel.tsx` | 6 |
| `banGiaoChung.tsx` | 1 |
| `chuyenLopChung.tsx` | 0 |
| `thaoTacDongHocVien.tsx` | 0 |

### `web/src/modules/congViec`

| File | Điểm control trong mã |
| --- | ---: |
| `ChonPhuTrach.tsx` | 3 |
| `CongViecPage.tsx` | 1 |
| `DanhSachViec.tsx` | 11 |
| `HoTroHocVienTab.tsx` | 22 |
| `PanelBaoPhTvv.tsx` | 14 |
| `PanelChamSpeaking.tsx` | 4 |
| `PanelSauThi.tsx` | 15 |
| `PanelViec.tsx` | 9 |
| `PanelViecLuoi.tsx` | 0 |
| `XacNhanPaLo.tsx` | 8 |

### `web/src/modules/dev`

| File | Điểm control trong mã |
| --- | ---: |
| `BangMau.tsx` | 2 |
| `BangMauV5.tsx` | 24 |
| `SanMauNen.tsx` | 8 |
| `ThanhPhanDemo.tsx` | 11 |

### `web/src/modules/duyet`

| File | Điểm control trong mã |
| --- | ---: |
| `DeXuatSuaPanel.tsx` | 4 |
| `HopChoDuyet.tsx` | 26 |
| `TheYeuCau.tsx` | 17 |
| `YeuCauCuaToi.tsx` | 1 |

### `web/src/modules/fasttrack`

| File | Điểm control trong mã |
| --- | ---: |
| `CaseLuotKn.tsx` | 2 |
| `DongThoiGianLuot.tsx` | 1 |
| `HopNhapDiem.tsx` | 24 |
| `HopThaoTacMt.tsx` | 3 |
| `LuotThuongPage.tsx` | 7 |
| `MockDetailPage.tsx` | 14 |
| `NhanXet.tsx` | 3 |
| `ODiemLon.tsx` | 2 |
| `ScoreEntry.tsx` | 11 |

### `web/src/modules/giaoVien`

| File | Điểm control trong mã |
| --- | ---: |
| `HoSoGiaoVienPage.tsx` | 17 |

### `web/src/modules/huongDan`

| File | Điểm control trong mã |
| --- | ---: |
| `HuongDanPage.tsx` | 6 |
| `MucHuongDan.tsx` | 2 |
| `NutHuongDan.tsx` | 12 |
| `chiChoToi.tsx` | 0 |

### `web/src/modules/phanTich`

| File | Điểm control trong mã |
| --- | ---: |
| `BaoCao.tsx` | 2 |
| `BoChonThoiGian.tsx` | 2 |
| `HieuQuaPa.tsx` | 2 |
| `KetQuaThi.tsx` | 6 |
| `PhanTich.tsx` | 1 |
| `PhanTichGiaoVien.tsx` | 4 |
| `PhanTichPage.tsx` | 0 |
| `TongHopTestSos.tsx` | 2 |
| `YThucPhoiHop.tsx` | 5 |
| `dungChung.tsx` | 3 |

### `web/src/modules/platform`

| File | Điểm control trong mã |
| --- | ---: |
| `AccountsAdmin.tsx` | 30 |
| `AdminPage.tsx` | 0 |
| `BangQuyDoiAdmin.tsx` | 12 |
| `CapQuyenRieng.tsx` | 2 |
| `CatalogAdmin.tsx` | 19 |
| `CauHinhCaseSos.tsx` | 4 |
| `ChiNhanhAdmin.tsx` | 0 |
| `DaXoaAdmin.tsx` | 2 |
| `DemoBar.tsx` | 7 |
| `HanMacDinhAdmin.tsx` | 8 |
| `Header.tsx` | 15 |
| `HopChuong.tsx` | 6 |
| `KyVongNguongAdmin.tsx` | 8 |
| `MoSuaLichTest.tsx` | 1 |
| `NhatKyChung.tsx` | 3 |
| `ProfilePage.tsx` | 9 |
| `QuyenTheoVai.tsx` | 9 |
| `SuaTaiDong.tsx` | 6 |
| `SuaVaiChiNhanh.tsx` | 2 |
| `WelcomePage.tsx` | 14 |
| `XoaTaiKhoanPanel.tsx` | 2 |
| `cauHinh/BangDanhSach.tsx` | 22 |
| `cauHinh/BangMoc.tsx` | 10 |

### `web/src/modules/students`

| File | Điểm control trong mã |
| --- | ---: |
| `BangHocVienLop.tsx` | 0 |
| `BangSos.tsx` | 0 |
| `BieuDoD.tsx` | 4 |
| `CacLoTrinh.tsx` | 5 |
| `ChuongLop.tsx` | 6 |
| `ChuyenLopPanel.tsx` | 11 |
| `ClassRoster.tsx` | 0 |
| `CotCaseHv.tsx` | 5 |
| `DanhSachHvLop.tsx` | 12 |
| `DauHoSo.tsx` | 6 |
| `GocLichThi.tsx` | 4 |
| `GocPhanCongGv.tsx` | 7 |
| `HangLichMt.tsx` | 2 |
| `HangLichThi.tsx` | 16 |
| `HanhTrinh.tsx` | 11 |
| `HanhTrinhKyNang.tsx` | 4 |
| `HocVienTheoVai.tsx` | 1 |
| `HopGiaHan.tsx` | 4 |
| `HopTamDungKetThuc.tsx` | 5 |
| `IntakePanel.tsx` | 13 |
| `KetLuanKhoa.tsx` | 10 |
| `KetQuaThiThatPanel.tsx` | 6 |
| `LuuTruPage.tsx` | 13 |
| `MissingBadge.tsx` | 1 |
| `NganCase.tsx` | 8 |
| `NganCaseLuoi.tsx` | 0 |
| `NganTongKet.tsx` | 5 |
| `NganXuatDs.tsx` | 6 |
| `PanelBuocTiep.tsx` | 8 |
| `PanelLoTrinhMoi.tsx` | 8 |
| `PanelMotEm.tsx` | 11 |
| `QuayLaiHoc.tsx` | 2 |
| `StudentDetailPage.tsx` | 8 |
| `StudentManagePanel.tsx` | 18 |
| `StudentPlanPanel.tsx` | 3 |
| `StudentsPage.tsx` | 29 |
| `SuaCaLopPanel.tsx` | 7 |
| `TienDoTrenLop.tsx` | 15 |
| `TomTatLuuTru.tsx` | 0 |
| `XemTruocHangLoatPanel.tsx` | 4 |
| `XoaHocVienPanel.tsx` | 1 |
| `chonNhieuHocVien.tsx` | 4 |
| `diemLanTruoc.tsx` | 1 |
| `phanCongGv/BangLopPc.tsx` | 1 |
| `phanCongGv/OGv.tsx` | 1 |
| `phanCongGv/ThanhLuuPc.tsx` | 2 |
| `phanCongGv/TheLopPc.tsx` | 3 |
| `phanCongGv/TongHopPc.tsx` | 6 |

### `web/src/modules/test`

| File | Điểm control trong mã |
| --- | ---: |
| `KeHoachTestTab.tsx` | 7 |
| `LichTestTab.tsx` | 8 |
| `NganXuatMt.tsx` | 3 |
| `NganXuatTest.tsx` | 0 |
| `TestPage.tsx` | 0 |
| `keHoach/ChipKyNang.tsx` | 7 |
| `keHoach/GhiChuLichThi.tsx` | 3 |
| `keHoach/HangSEx.tsx` | 2 |
| `keHoach/HopKhoiPhucKetQua.tsx` | 6 |
| `keHoach/HopKyNang.tsx` | 13 |
| `keHoach/HopSEx.tsx` | 5 |
| `keHoach/LopKeHoach.tsx` | 3 |
| `keHoach/LuoiKeHoach.tsx` | 5 |
| `keHoach/NganXepHangLoat.tsx` | 7 |
| `keHoach/NganXepLichMt.tsx` | 12 |
| `keHoach/NganXuatKeHoach.tsx` | 2 |
| `keHoach/TimKeHoach.tsx` | 2 |
| `keHoach/TimLop.tsx` | 2 |
| `keHoach/TuanNho.tsx` | 3 |
| `keHoach/XepTheoHocVien.tsx` | 12 |
| `lichTest/DaiSo.tsx` | 1 |
| `lichTest/HangLop.tsx` | 2 |
| `lichTest/KhoiNo.tsx` | 3 |
| `lichTest/LuoiNhung.tsx` | 1 |
| `lichTest/NhomDau.tsx` | 0 |

### `web/src/modules/tutor`

| File | Điểm control trong mã |
| --- | ---: |
| `HopTutor.tsx` | 9 |
| `PanelTutor.tsx` | 8 |
| `TaiDanhSach.tsx` | 6 |
| `TutorPage.tsx` | 8 |

### `web/src/modules/worklist`

| File | Điểm control trong mã |
| --- | ---: |
| `ChonChuongTrinh.tsx` | 1 |
| `Highlights.tsx` | 4 |
| `LamDongSoLieu.tsx` | 0 |
| `LopToiDay.tsx` | 3 |
| `ManagerTasks.tsx` | 0 |
| `MeetingPage.tsx` | 12 |
| `MgmtTasksPage.tsx` | 22 |
| `MockTestAdmin.tsx` | 1 |
| `OverviewPage.tsx` | 0 |
| `PanelGvTre.tsx` | 9 |
| `SignalList.tsx` | 1 |
| `TongQuanV5.tsx` | 10 |
| `WorkList.tsx` | 0 |

### `web/src/modules/yThuc`

| File | Điểm control trong mã |
| --- | ---: |
| `BangLan.tsx` | 7 |
| `BangPhoiHop.tsx` | 23 |
| `CaseSosControls.tsx` | 8 |
| `ChiTietViPham.tsx` | 6 |
| `ClassYThucCard.tsx` | 18 |
| `DaThucHienPanel.tsx` | 4 |
| `DeleteViolationConfirm.tsx` | 0 |
| `KhaiBacLoPanel.tsx` | 9 |
| `KhaiBacPanel.tsx` | 6 |
| `KhoiDuyetYThuc.tsx` | 1 |
| `LoYThucPanel.tsx` | 4 |
| `NhanViPham.tsx` | 0 |
| `PanelXemViPham.tsx` | 4 |
| `PhoiHopSosSection.tsx` | 23 |
| `RecordViolationPanel.tsx` | 15 |
| `StudentYThucSection.tsx` | 15 |
| `ThangYThuc.tsx` | 4 |
| `TinhHinh.tsx` | 16 |
| `XacNhanXuLyPanel.tsx` | 8 |
| `XemXuLyPanel.tsx` | 12 |
| `khoiYThuc.tsx` | 2 |
| `panelYThuc.tsx` | 0 |

### `web/src/ui`

| File | Điểm control trong mã |
| --- | ---: |
| `Bang.tsx` | 0 |
| `BangChung.tsx` | 15 |
| `BangLuotPanel.tsx` | 10 |
| `BieuTuong.tsx` | 0 |
| `ChipSos.tsx` | 1 |
| `ChonLop.tsx` | 2 |
| `ChonNgay.tsx` | 0 |
| `ChuDich.tsx` | 1 |
| `CongTacGiaoDien.tsx` | 1 |
| `CongTacKhung.tsx` | 2 |
| `DongHan.tsx` | 5 |
| `Drawer.tsx` | 5 |
| `Filters.tsx` | 10 |
| `Han.tsx` | 0 |
| `HangNhom.tsx` | 1 |
| `HangTab.tsx` | 1 |
| `HopNeo.tsx` | 0 |
| `HopXacNhanChung.tsx` | 0 |
| `KetQuaDot.tsx` | 0 |
| `KhungPanel.tsx` | 5 |
| `KhuonViec.tsx` | 8 |
| `LichNho.tsx` | 8 |
| `LichSuThayDoi.tsx` | 4 |
| `LuoiTrongPanel.tsx` | 0 |
| `Menu.tsx` | 2 |
| `MenuDong.tsx` | 2 |
| `Nhan.tsx` | 1 |
| `NutLuat.tsx` | 1 |
| `NutMon.tsx` | 1 |
| `NutNgonNgu.tsx` | 2 |
| `ODiem.tsx` | 2 |
| `OKhac.tsx` | 1 |
| `OMt.tsx` | 2 |
| `ONgay.tsx` | 2 |
| `OSo.tsx` | 1 |
| `OSuaTaiCho.tsx` | 6 |
| `PeoplePicker.tsx` | 3 |
| `PhanTrang.tsx` | 5 |
| `SaveState.tsx` | 1 |
| `SoLieu.tsx` | 10 |
| `TepCho.tsx` | 9 |
| `ThanhTruocSau.tsx` | 3 |
| `TheDong.tsx` | 0 |
| `TheKetQuaSos.tsx` | 0 |
| `ToKhop.tsx` | 0 |
| `Toast.tsx` | 1 |
| `TuanDayGv.tsx` | 8 |
| `TyLe.tsx` | 0 |
| `ViecTiep.tsx` | 2 |
| `chanRoiNhap.tsx` | 0 |
| `loiForm.tsx` | 1 |
| `ui.tsx` | 12 |

## Phụ lục C — Các merge sau mốc deploy ghi trong repo

Nguồn: lịch sử first-parent từ merge #1478 đến HEAD audit. Danh mục chứng minh đã xác định phạm vi thay đổi; không tuyên bố mọi dòng diff của từng PR đều được review độc lập. Đặc biệt PR plan/mockup không tương đương feature đã code.

| PR | Merge | Nhánh công việc |
| --- | --- | --- |
| [#1512](https://github.com/Pizi147/pisa-tracking/pull/1512) | `301b94b5` | `plan-1311-gv-cu-a` |
| [#1511](https://github.com/Pizi147/pisa-tracking/pull/1511) | `cb71d297` | `plan-1311-gv-cu` |
| [#1507](https://github.com/Pizi147/pisa-tracking/pull/1507) | `bdb2bd4b` | `claude/tinh-hinh-panel` |
| [#1506](https://github.com/Pizi147/pisa-tracking/pull/1506) | `1f7581f6` | `claude/tinh-hinh-tab` |
| [#1504](https://github.com/Pizi147/pisa-tracking/pull/1504) | `133755b8` | `claude/tinh-hinh-may-chu` |
| [#1510](https://github.com/Pizi147/pisa-tracking/pull/1510) | `c90a687d` | `plan-1211-duyet-th` |
| [#1509](https://github.com/Pizi147/pisa-tracking/pull/1509) | `fd65be9f` | `claude/tinh-lui-phan-cong` |
| [#1505](https://github.com/Pizi147/pisa-tracking/pull/1505) | `684fd4e9` | `claude/tl-gv-code` |
| [#1508](https://github.com/Pizi147/pisa-tracking/pull/1508) | `e01e475c` | `plan-1211-tl-gv` |
| [#1500](https://github.com/Pizi147/pisa-tracking/pull/1500) | `0048f0a0` | `lt-tong-ket-lo-trinh` |
| [#1503](https://github.com/Pizi147/pisa-tracking/pull/1503) | `2e17238e` | `lt-thi-that-gv` |
| [#1501](https://github.com/Pizi147/pisa-tracking/pull/1501) | `579e5aba` | `lt-luu-tru-thu-tu` |
| [#1502](https://github.com/Pizi147/pisa-tracking/pull/1502) | `64f1e764` | `claude/bc-ph-moc-cf86ee` |
| [#1499](https://github.com/Pizi147/pisa-tracking/pull/1499) | `9b5b1ddb` | `plan-1211-bc-moc` |
| [#1498](https://github.com/Pizi147/pisa-tracking/pull/1498) | `2ddc03bb` | `plan-1211-duyet-v20` |
| [#1497](https://github.com/Pizi147/pisa-tracking/pull/1497) | `e56306d7` | `claude/mockup-tinh-hinh-27a7dd` |
| [#1496](https://github.com/Pizi147/pisa-tracking/pull/1496) | `483531ca` | `claude/mockup-tl-gv-f128dc` |
| [#1495](https://github.com/Pizi147/pisa-tracking/pull/1495) | `37f8c7e3` | `plan-1211-sau-viec-chot` |
| [#1494](https://github.com/Pizi147/pisa-tracking/pull/1494) | `aa8786b1` | `plan-1211-sau-viec` |
| [#1490](https://github.com/Pizi147/pisa-tracking/pull/1490) | `eb5b0cd8` | `pt-b-cac-tab` |
| [#1493](https://github.com/Pizi147/pisa-tracking/pull/1493) | `686efbcd` | `plan-1211-duyet-1490` |
| [#1492](https://github.com/Pizi147/pisa-tracking/pull/1492) | `06890fee` | `plan-1211-sos-mau` |
| [#1491](https://github.com/Pizi147/pisa-tracking/pull/1491) | `7b2b91ae` | `plan-1211-pt-b-sua` |
| [#1488](https://github.com/Pizi147/pisa-tracking/pull/1488) | `b37713f7` | `claude/yt-b-cv` |
| [#1487](https://github.com/Pizi147/pisa-tracking/pull/1487) | `dff7bf1d` | `claude/yt-a-lop` |
| [#1486](https://github.com/Pizi147/pisa-tracking/pull/1486) | `b099d9a8` | `pt-a-o-so-gv` |
| [#1489](https://github.com/Pizi147/pisa-tracking/pull/1489) | `f1d9d866` | `plan-1211-duyet-anh` |
| [#1485](https://github.com/Pizi147/pisa-tracking/pull/1485) | `ce7a3a9a` | `plan-1211-duyet-mockup` |
| [#1482](https://github.com/Pizi147/pisa-tracking/pull/1482) | `8e55071b` | `claude/mockup-yt-36305e` |
| [#1481](https://github.com/Pizi147/pisa-tracking/pull/1481) | `bd3f3fbe` | `mockup-pt-v19` |
| [#1484](https://github.com/Pizi147/pisa-tracking/pull/1484) | `e9f47305` | `plan-1211-pt-so-loi` |
| [#1483](https://github.com/Pizi147/pisa-tracking/pull/1483) | `2ec6d832` | `claude/pt-so-loi-81d0f8` |
| [#1480](https://github.com/Pizi147/pisa-tracking/pull/1480) | `e4579b27` | `plan-1211-pt-yt` |
| [#1479](https://github.com/Pizi147/pisa-tracking/pull/1479) | `01b07cad` | `plan-deploy-261111` |
