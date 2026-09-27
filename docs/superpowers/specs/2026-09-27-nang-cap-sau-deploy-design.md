# Nâng cấp sau deploy — Đặc tả tổng (27/09/2026)

> **Trạng thái:** bản nháp chờ chủ sản phẩm duyệt. Chưa giao session code.
> **Người soạn:** session planning (Opus 5.5). **Nhánh:** `ke-hoach-nang-cap-27-09`.
>
> **Nguồn (đọc kèm):**
> - `thiet-ke/nguon-27-09/YEU_CAU_CHINH_SUA.md` — **yêu cầu chính**, không được bỏ sót mục nào (ma trận §4).
> - `thiet-ke/nguon-27-09/FEEDBACK_DOI_NGU.md` — gợi ý của đội ngũ → phân tích ở `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md`.
> - `thiet-ke/nguon-27-09/NGUON_QUY_DINH_LOP_THUONG.md` — quy định P. Học thuật cho lớp thường (§6).
> - Ảnh chủ sản phẩm: `thiet-ke/anh/nguon-27-09/anh1…anh5` (yêu cầu gọi là "Ảnh 1…5").
> - Kế hoạch cũ chưa làm: `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` (gói UX-A…F),
>   `docs/superpowers/specs/2026-09-23-viec-con-lai-sau-deploy.md` (PR-GV, Pb2, S3, Dọn) — ghép ở §9.
> - Mockup: `thiet-ke/mockup/19-nang-cap-27-09.html` (M1…M12).

---

## 1. Tóm tắt cho chủ sản phẩm (đọc 3 phút)

**Làm gì:** 16 nhóm yêu cầu của anh/chị + luật lớp thường mới + những việc cũ chưa làm, chia thành **6 đợt**,
mỗi đợt 2–3 session code chạy song song. Đợt 1 sửa các lỗi đang cản việc trên bản chính.

| Đợt | Nội dung chính | Anh/chị kiểm gì sau đợt |
|---|---|---|
| **1** | Sửa lỗi nóng (lớp biến mất, SOS hai nút chồng, ô tên PA tự đóng, bộ lọc vi phạm, báo lỗi rõ, màu SOS sai) · tạo lớp kiểu tên mới + RF · ô ngày/ô "Khác"/ô chọn người thống nhất toàn web · tên web "Pisa Tracking" | Tạo thử 1 lớp FT, 1 lớp RF, 1 lớp FOU; bấm thử mọi ô ngày |
| **2** | Hộp **Chờ duyệt** cho QL (có phân loại) · lịch MT tự tạo + học sinh cũ + đánh số MT · Thêm học viên mới (email, ngày thi, tuần bắt đầu) | Thêm thử HS cũ đã học 20 tuần; xem MT1–MT3 tự hiện |
| **3** | SOS mới (Xác nhận nguyên nhân / Không cần theo dõi → QL duyệt) · **Ý thức mới** (Ghi nhận / Xác nhận xử lý, thang bậc) · panel Xếp lịch MT mới | Đi hết một vòng SOS và một vòng vi phạm |
| **4** | Hồ sơ Mock mới (điểm to, 4 ô tiêu chí, nhập tại chỗ, nhận xét W/S) · Xuất Excel MT · Học viên & Lớp (dòng kết quả, Cần hỗ trợ 4 hàng, Phân tích lớp) · **chế độ sáng/tối** | Xem mockup M4, M10 so với web thật |
| **5** | Luật lớp thường theo quy định P. Học thuật · hồ sơ giáo viên + KPI tháng | Nhập thử một Giữa khoá trượt |
| **6** | Tổng quan theo vai, hồ sơ HV "hiểu trong 30 giây", điện thoại, số liệu khớp, chữ cuối, dọn lỗi nhỏ | Dùng thử trên điện thoại |

**Anh/chị cần làm ngay:** đọc bảng **§3.2 "Những gì tôi tự quyết"** (54 dòng) và gạch dòng nào không đồng ý;
xem mockup `thiet-ke/mockup/19-nang-cap-27-09.html` (M4 là mockup "Cần hỗ trợ" anh/chị yêu cầu).

---

## 2. Nguồn luật — thứ tự ưu tiên từ 27/09/2026

1. **Yêu cầu chủ sản phẩm 27/09** (`YEU_CAU_CHINH_SUA.md`) + 4 câu trả lời §3.1.
2. **Quy định lớp thường** của P. Học thuật (§6) — áp cho FOU, BE, ELE; Pre-FOUND chỉ ghi lại.
3. Đặc tả này (§5, §6) — **thay** các phần tương ứng của:
   `thiet-ke/SOS_VA_PHOI_HOP_V3.md` (S04, S05, S06, Q-V3-1, Q-V3-4),
   `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` (Y01, B05, B12, B13, W02, danh sách 9 biện pháp),
   `thiet-ke/PISA-Rulebook-2026-09-19.md` (kỳ vọng MT theo lộ trình RF; nhập danh sách không lập lịch MT).
4. Các file cũ ở `thiet-ke/` — vẫn đúng ở chỗ không bị nhắc lại ở đây.
5. Mã nguồn — **hiện trạng, không phải luật**.

Danh sách xung đột đầy đủ (J1–J15): `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` mục J.

---

## 3. Quyết định

### 3.1. Chủ sản phẩm chốt 27/09 (qua 4 câu hỏi)

| Mã | Câu hỏi | Chốt |
|---|---|---|
| **Q27-1** | Thang xử lý Ý thức | **Bắt buộc theo thứ tự.** Mỗi lần "Xác nhận xử lý", web tự điền bậc kế tiếp. Muốn nặng hơn → "Đề xuất QL duyệt" |
| **Q27-2** | MT đã qua của HS cũ, nhập bù có SOS | **Chỉ MT gần nhất tạo Case** (tuần thi trong 4 tuần trước ngày nhập); MT cũ hơn chỉ lưu điểm + mức SOS |
| **Q27-3** | Nơi QL nhận yêu cầu duyệt | **Một hộp "Chờ duyệt", có phân loại** |
| **Q27-4** | Kỳ vọng MT của lộ trình RF | **Mọi MT của RF = target** |

### 3.2. Những gì tôi tự quyết — anh/chị gạch dòng nào không đồng ý

Ký hiệu ⚠ = điểm tôi ít chắc nhất, nên xem trước.

| # | Chủ đề | Tôi quyết |
|---|---|---|
| T1 | Tên lớp | `{CN} {KIỂU} {số}`: `MB FT 101`, `MB FT RF 12`, `MB FOU 12`, `MB BE 03`, `MB ELE 05`. Phần số: 1–4 chữ số, được thêm **một** chữ cái cuối (`101A`). Không phân biệt hoa/thường khi kiểm trùng |
| T2 | Lớp cũ | Đổi tên lớp đang có sang kiểu mới lúc migrate (`CP-FT 139` → `CP FT 139`). Ô tìm lớp chấp nhận cả kiểu cũ có dấu `-` |
| T3 | RF | RF là **một lộ trình** như LT1/LT2 (không phải chương trình mới). Lớp RF tên có chữ `RF` |
| T4 ⚠ | RF — PA quy chế và Phối hợp SOS | Vì mọi MT của RF bằng target, RF dùng **hàng "MT3 trở đi"** của bảng FT: PA `Tutor · đến lúc thi`; việc phối hợp theo hàng `MT4, MT5 trở đi` |
| T5 | Tạo lớp | **Một lệnh duy nhất** tạo lớp + phân công. Phân công sai → không tạo gì, báo lỗi ngay tại ô sai. Tạo xong mở thẳng hồ sơ lớp |
| T6 | Phạm vi mặc định | Người có vai **Quản lý / Quản trị** mở Học viên & Lớp ở phạm vi **Chi nhánh** (kể cả khi có dạy lớp). GV thuần giữ "Lớp tôi dạy" |
| T7 | Lớp "tàng hình" đã lỡ tạo trên bản chính | Lệnh chỉ đọc liệt kê lớp không có phân công; QT xoá bằng nút "Xoá lớp" đã có hoặc bổ sung phân công — hỏi anh/chị từng lớp lúc deploy |
| T8 | Email học viên | Bắt buộc khi **thêm mới**. HS đã có mà thiếu email: **không** bật badge "Thiếu thông tin" (không cản chuyên môn), chỉ hiện "chưa có email" trong Thông tin HV |
| T9 | Ngày thi dự kiến | Thêm ô ngày cụ thể (tuỳ chọn). Gõ `mm/yyyy` → chỉ lưu tháng. Gõ `dd/mm/yyyy` → lưu ngày, tự suy ra tuần và tháng |
| T10 ⚠ | Placement lớp thường | Khi thêm HV vào lớp **BE/ELE**: thêm cột tuỳ chọn "Placement (IELTS)" — phục vụ quy định mục IV (kỳ vọng đầu ra). FOU không có |
| T11 | Ô ngày thống nhất | Một ô **gõ được `dd/mm/yyyy`** + **nút lịch** mở lịch tự vẽ (không dùng lịch của trình duyệt vì nó hiện `mm/dd/yyyy` trên máy tiếng Anh). Giữ nguyên luật từng chỗ (ví dụ "không sau hôm nay"). Danh sách gợi ý nhanh cũ ("Hôm nay", "Hôm qua"…) chuyển thành nút "Gần đây" trong lịch |
| T12 ⚠ | Chỗ ngày **đặc biệt** — giữ dạng hiện tại (yêu cầu 9 bảo hỏi trước) | (a) dòng thu gọn "Bắt đầu theo dõi: hôm nay · **Đổi**" giữ nguyên, bấm Đổi mới mở ô ngày mới; (b) thanh `‹ tuần ›` ở Lịch Test / Kế hoạch Test giữ; (c) chip tuần trong ô kỹ năng Kế hoạch Test giữ; (d) "Từ tuần / Đến tuần" của nhập bù giữ nghĩa đầu tuần / cuối tuần; (e) thanh ngày của bản demo không đổi |
| T13 | "Khác" | Một thành phần dùng chung: chọn "Khác" → ô chữ nhỏ hiện **ngay dưới**, bắt buộc ≥ 3 ký tự. Bỏ luật cũ "chọn Khác thì mô tả phải ≥ 30 ký tự" |
| T14 | Ô chọn người | Bấm là thấy danh sách ngay (không bắt gõ 3 ký tự); luôn có dòng "Dùng tên ngoài hệ thống: …". **Ngoại lệ**: phân công GV cho lớp và bộ lọc chỉ chọn tài khoản (vì cần quyền nhập điểm) |
| T15 | Sáng / tối | Nút nhỏ ◐ ở góc phải thanh đầu, cạnh Thông báo. Mặc định **Tối** như hiện nay. Nhớ theo từng máy |
| T16 ⚠ | Font | Tải kèm web font **Be Vietnam Pro** (thiết kế cho dấu tiếng Việt, số cùng độ rộng). Hiện web khai báo Inter nhưng không tải → mỗi máy một font |
| T17 | HV & Lớp mở lớp | Không tự mở lớp nào khi vào trang. Khi đang lọc/tìm thì vẫn mở sẵn các lớp có kết quả (tối đa 5) như hiện nay |
| T18 ⚠ | Dòng kết quả gần nhất (11.2) | `MT3 · kỳ vọng 7.0 · 3/4 kỹ năng có điểm` / `Không đạt: L R W`. Tôi **giữ chữ "kỳ vọng"** trước 7.0 để không lẫn với điểm. Lớp thường: `Cuối khoá · 2/4 kỹ năng có điểm` / `Không đạt: L R` |
| T19 | Cần hỗ trợ (11.3.1) | Mỗi em một khối **4 hàng L · R · W · S**. FT: hàng W có hai dòng con W1, W2. Hàng không có Case: một dòng mờ "—". Chỉ hiện em có ≥ 1 Case mở |
| T20 | Case và PA (12.2) | Case = hàng đậm, vạch trái màu theo trạng thái, có nút gập ▾. PA = dòng thụt vào, nền nhạt hơn, nhãn nhỏ "PA". Gập lại vẫn giữ tiêu đề + `2 PA · 1 đang chạy · hạn …` |
| T21 | Xác nhận nguyên nhân (12.3) | Form tên **"Xác nhận Case"**; tiêu đề hiện `[MT2] Reading không đạt [SOS 2]`, chỉ phần giữa sửa được; máy lưu phần giữa, hai đầu tự ghép |
| T22 | PA quy chế SOS (12.3.6) | **Không xoá, không thay, không kết thúc sớm.** Đổi được người thực hiện. Tự kết thúc ở mốc của nó (1 tháng / MT kế tiếp / lúc thi). Ghi kết quả CN hằng tuần như PA khác |
| T23 | Không cần theo dõi (12.4) | Lúc chờ: Case hiện `Chờ QL duyệt · không theo dõi`, GVBM coi như đã làm đúng hạn 3 ngày. QL **từ chối** (bắt buộc lý do) → Case quay về "Chờ xác nhận nguyên nhân", hạn mới 3 ngày tính từ lúc từ chối. QL quá hạn → thẻ đỏ "Quá hạn duyệt" + báo QL và Quản trị. **Không bao giờ tự duyệt** |
| T24 ⚠ | "5 ngày làm việc" | Thứ Hai → Thứ Bảy, **không tính Chủ nhật** |
| T25 | "2 tuần" của Ý thức (12.6.1) | **Tuần này + tuần trước** (Thứ Hai → Chủ nhật). Đếm mọi vi phạm trong khoảng đó **chưa nằm trong một lần xử lý** — vi phạm đã "Ghi nhận" **vẫn được đếm** |
| T26 | Hạn 5 ngày Ý thức | Tính từ ngày vi phạm thứ 3 (ngày việc xử lý thành bắt buộc). Vi phạm chưa ai Ghi nhận / Xử lý sau 5 ngày cũng thành Quá hạn + báo QL |
| T27 | Thang theo lộ trình | Giữ Y02: đếm trong một lộ trình, sang lộ trình mới thì về Report 1. **HS cũ**: GVCN hoặc QL khai **một lần** "đã xử lý trước khi dùng web: bậc n" (có nhật ký) |
| T28 | Bậc 4, 6 và ngoài thang | Bậc 4 = một lần xử lý gồm hai phần **Report 4 + Meeting CX/GĐCN**, không cần QL. Bậc 6 = **Thư CC 3** (cần QL). **Đình chỉ** và **Meeting CX/GĐCN đứng riêng** đề xuất được bất cứ lúc nào (cần QL), **không** đẩy bậc |
| T29 | Biện pháp cần QL | Ba bước: **Đề xuất** (mô tả + bằng chứng bắt buộc) → **QL duyệt** trong 5 ngày → GVCN bấm **"Đã thực hiện"** (ngày). Report, Thư CC 1, Thư CC 2: **một bước** "Xác nhận xử lý", tệp **không bắt buộc** (theo 12.6.2) |
| T30 | "Khác" trong xử lý | Chỉ còn trong nhánh "Đề xuất QL duyệt" (Khác + ghi rõ) |
| T31 | Chữ "Ghi nhận" | Nút ghi vi phạm đổi thành **"+ Ghi vi phạm"**. "Ghi nhận" từ nay chỉ có một nghĩa: GVCN đã xem, không cần biện pháp |
| T32 | Dữ liệu Ý thức cũ | Biện pháp loại cũ giữ để xem lịch sử, nhãn "(loại cũ)", không chọn mới được. Biện pháp cũ đang "Đang chuẩn bị" → hiện nút "Hoàn tất theo cách cũ" một lần rồi thôi. Session code **đếm trên bản chính (chỉ đọc)** trước khi viết migrate |
| T33 | MT mặc định (13.2) | Tạo khi HS FT có lộ trình: thêm mới, chuyển vào lớp FT, mở lộ trình mới. FT: MT1 tuần 6 · MT2 tuần 12 · MT3 tuần 16. RF: MT1 tuần 4 · MT2 tuần 8. Bốn kỹ năng cùng tuần. Không tự tạo MT4+ |
| T34 | "MT lịch sử" | = MT có tuần thi **kết thúc trước ngày HS được đưa vào web**. GVCN của lớp và QL nhập được cả 4 kỹ năng; không có hạn chấm; không vào "bài quá hạn". Tạo Case theo Q27-2 |
| T35 | HS FT đã có trên bản chính | Lệnh bổ sung MT mặc định chạy **thử** trước (in danh sách), anh/chị duyệt danh sách rồi mới ghi |
| T36 | Đánh số MT (13.3) | MT mới luôn = số lớn nhất + 1; không tạo MTn khi chưa có MT(n−1). Huỷ **cả lượt** MTn → số đó dùng lại cho lượt mới |
| T37 | Xếp lịch MT (13.4) | Tối đa **MT8**. Ép vào đợt trùng → hộp nói kỹ năng nào đã làm ở đợt đó rồi mới hỏi lại. Chỉ QL |
| T38 | Tên thao tác MT (13.6) | "Hẹn xử lý" → **Dời hạn chấm** · "Lùi lịch mock" → **Dời lịch thi** · "Kỹ năng không kiểm tra trong đợt này" → **Bỏ kỹ năng khỏi đợt** · "Ghi nhận vắng" → **Báo vắng** · "Hủy kết quả" → **Huỷ điểm** · "Huỷ lượt MTn" giữ. Mỗi thao tác mở hộp nhỏ có ô lý do |
| T39 | Nhận xét W/S (13.5) | Một ô chung dưới 4 tiêu chí, ≤ 1000 ký tự, không bắt buộc. **GV chấm** (chỉ Speaking): ô chọn người có tên ngoài hệ thống; mặc định người đang nhập nếu là GVBM Speaking |
| T40 | Xuất Excel (13.9) | QL và Quản trị: toàn phạm vi của mình; GVCN: lớp mình. Mỗi dòng = một em × một MT; thêm sheet "Bộ lọc đã dùng" |
| T41 | Hộp Chờ duyệt | Tab **đầu tiên** của Công việc với QL. Chip phân loại: **Tất cả · Học thuật · Ý thức · Lịch thi · Thông tin HV · Báo lên**. Tổng quan QL có dòng `n chờ duyệt · k quá hạn`. Chuông chỉ trỏ vào thẻ. GV có mục "Yêu cầu của tôi" |
| T42 | Dời lịch MT lần 2 | Chuyển vào hộp Chờ duyệt (loại Lịch thi), **giữ luật C09**: hết tuần mà QL không duyệt thì yêu cầu tự huỷ |
| T43 | Đề xuất PA cần QL duyệt (luồng cũ) | Chuyển vào hộp Chờ duyệt (loại Học thuật) |
| T44 | Yêu cầu cập nhật thông tin (mục 15) | Chỗ GV không có quyền sửa (lộ trình, target, lịch MT, lớp) có nút **"Đề xuất sửa"** → thẻ loại "Thông tin HV" |
| T45 | Head cơ sở, TVV | Head cơ sở = vai **Quản lý**. TVV không có tài khoản → "Báo phụ huynh qua TVV" là **việc phối hợp** GV tự đánh dấu (ngày, ghi chú) sau khi đã tạo task trên Base |
| T46 | Lớp thường · Giữa khoá (§6) | Kỹ năng < 70% → Case kỹ năng đó + PA **"Bổ trợ"** bắt buộc đến Cuối khoá (FOU: 2 buổi/tuần chung cho các kỹ năng trượt; BE/ELE: 1 buổi/tuần/kỹ năng), ghi "trừ buổi Free". **Bỏ nút "Bỏ qua"** với Giữa khoá. Kế hoạch bài giảng → QL duyệt trước khi PA bắt đầu |
| T47 ⚠ | Lớp thường · Cuối khoá | "% Cuối khoá" = **tổng câu đúng / tổng số câu của 4 kỹ năng**. Kỹ năng không đạt = kỹ năng < 70%. Mini Test đạt khi **≥ 70%** (quy định ghi "trên 70%" — tôi hiểu là cùng mức Pass chung). Mini Test trượt → Báo lên QL xử lý case-by-case |
| T48 | Cuối khoá vào luồng nào | Vào "Chuyển tiếp lớp / Lộ trình tiếp theo" đã có: web gợi ý hướng theo bảng %, riêng 50–59% bắt buộc QL quyết (thẻ Chờ duyệt) |
| T49 | BE/ELE lên FT | Ở Kết luận khoá, QL đánh dấu "Đạt kỳ vọng đầu ra?" + nguyên nhân (Trung tâm / Học sinh). Trung tâm → web tự tạo PA "Tutor 10 buổi/kỹ năng" ở lộ trình FT. Học sinh → QL đề xuất case-by-case |
| T50 ⚠ | KPI tháng | Hiện ở Phân tích › Theo giáo viên và Theo chi nhánh. Một "HS pass một bài" = % tổng ≥ 70% (Giữa khoá hoặc Cuối khoá). ≥ 70% HS pass → 5 điểm · 60–69% → 3 · < 60% → 0 |
| T51 | Pre-FOUND | Chỉ ghi luật (§6.6). Khi Quản trị thêm chương trình Pre-FOUND, áp như FOU với khác biệt ở §6.6 |
| T52 | Model rà chéo (yêu cầu 16) | Người rà luôn **Opus 5.5** (session riêng). Người code: Sonnet 5 / Fable 5.1; việc chạm dữ liệu thật: Opus 5.5 code + Opus 5.5 rà ở session khác |
| T53 | 7 câu còn treo của đánh giá 26/09 | Q1: "Làm PA … hạn 30/08" là **dự kiến kết thúc** → ghi "Dự kiến kết thúc", không nằm trong Việc cần làm (việc thật là "Ghi kết quả PA" mỗi CN). Q2: đếm theo **bài** = một kỹ năng của một em trong một lượt; luôn ghi đơn vị; tuần chưa hết thì chưa quá hạn. Q4: Lịch Test giữ nhóm theo lớp, dòng Nợ ghi thêm **tên GV** đang nợ. Q5: gộp hai badge lớp; với GV "bài chờ chấm" đứng đầu. Q6: môn đã xác nhận vắng **không** nhập trong lưới; muốn nhập bù thì QL "Khôi phục" trước. Q7: **Phân tích** thành mục menu riêng cho QL/Quản trị. Q8: trên điện thoại "Hôm nay" tối đa **3 việc** + "Xem hết" |
| T54 ⚠ | Hạn duyệt mới của lớp thường | Kế hoạch bổ trợ (Giữa khoá): QL duyệt trong **3 ngày làm việc**. Quyết định Cuối khoá 50–59%: trước ngày khai giảng lớp kế tiếp. Đề xuất sửa thông tin HV: 5 ngày làm việc |

---

## 4. Ma trận yêu cầu — mọi mục của `YEU_CAU_CHINH_SUA.md`

Cột **Hiện trạng** là kết quả đọc mã thật trên `main` @ 705ca9e. Cột **PR** trỏ tới §8.

### 4.1. Lớp (yêu cầu 1–4)

| Mã | Yêu cầu | Hiện trạng (bằng chứng) | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-1 | Tạo lớp fail khi 2 GVCN / GVCN không dạy kỹ năng; lớp tàng hình nhưng chặn trùng tên | `ClassCreatePanel.tsx:65-89` gọi **hai lệnh**: `POST /classes` rồi `PUT /classes/:id/teachers`; lệnh hai bị `setClassTeachers` (`classes.ts:889-901`) từ chối → lớp còn đó, không phân công. Người vừa QL vừa dạy mở trang ở phạm vi "Lớp tôi dạy" (`hocVienLop.ts:72-76` `phamViMacDinh`) nên không thấy | (a) máy chủ: một đường `POST /classes` nhận luôn `slots`, **kiểm ba luật phân công trước**, ghi lớp + phân công trong **một giao dịch**; (b) giao diện: kiểm tại chỗ, nút Tạo lớp khoá kèm lý do; (c) T6 phạm vi mặc định; (d) T7 lệnh chỉ đọc `kiem-lop-mo-coi` + hướng dẫn dọn | Chọn 2 GVCN → không tạo được, ô GVCN báo đỏ; tạo thành công → mở hồ sơ lớp; QL có dạy lớp vẫn thấy lớp mới ở trang Học viên & Lớp | PR-LOP |
| YC-2 | Tên lớp: bỏ `-`, `CP ` thay `CP-`, chọn kiểu lớp, FT cố định `CN FT #`, lớp thường chọn FOU/BE/ELE, GV không tự gõ FT/FOU… | Panel ghép `${branch.code}-` + ô gõ tự do (`ClassCreatePanel.tsx:56,156`); máy chủ bắt đầu bằng `CN-` (`intake.ts:511-512`) | Luồng mới (mockup **M1**): Chi nhánh → **Kiểu lớp** (FT · Lớp thường) → FT: Lộ trình (LT1 · LT2 · RF) / Lớp thường: FOU · BE · ELE → ô chỉ gõ **số**. Dòng xem trước "Lớp sẽ là **MB FT RF 12**". Máy chủ tự ghép mã (T1), từ chối mã sai mẫu. Sửa thông tin lớp (`SuaThongTinLopPanel.tsx`) cũng theo mẫu. Migrate đổi tên lớp cũ (T2) | Không gõ được chữ vào ô số; đổi kiểu lớp thì xem trước đổi theo; lớp cũ hiện tên mới | PR-LOP |
| YC-3 | Loại FT **RF (Refire)** — tên `CN FT RF #` | `ROUTES = ['LT1','LT2']` (`shared/domain/students.ts:41`); lộ trình đọc từ bảng `/ref/routes` | Thêm lộ trình `RF` vào danh mục + hằng số; tên lớp; kỳ vọng MT của RF = target (Q27-4); lịch MT mặc định RF (YC-13.2); PA quy chế / phối hợp theo T4 | Tạo lớp RF, thêm HS → MT1 tuần 4, MT2 tuần 8, kỳ vọng = target | PR-LOP (danh mục, tên) · PR-MT (kỳ vọng, lịch) |
| YC-4 | Không 2 GV cùng một nhiệm vụ; GVCN dạy ≥ 1 kỹ năng | Máy chủ **đã chặn** (`classes.ts:856-901`). Giao diện cho chọn nhiều người mỗi ô (`TeacherPick`, `ClassCreatePanel.tsx:237-271`) và còn ghi "một môn có hai người dạy cũng vậy" (dòng 218) | Mỗi ô (GVCN, từng kỹ năng) là **ô tìm một người**; GVCN không dạy kỹ năng nào → báo ngay dưới ô GVCN "GVCN phải dạy ít nhất một kỹ năng — chọn kỹ năng cho cô/thầy này". Áp cả `TeacherAssignPanel.tsx` (Sửa phân công). Bỏ câu sai | Không có cách nào chọn người thứ hai cho một ô | PR-LOP |

### 4.2. Thêm học viên — Ảnh 1 (yêu cầu 5)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-5.1 | Thông tin phụ đang chèn vào ô, vỡ lưới | Dòng lỗi/lưu ý in dưới từng ô ("Thiếu họ tên", "Chưa có target — nhập được nhưng…") làm hàng cao khác nhau | Hàng **cao cố định**. Ô có vấn đề: viền màu + dấu nhỏ ⚠/!. Cột cuối **"Tình trạng"**: `✓` hoặc `1 lỗi · 1 lưu ý` — bấm mở **một dòng chi tiết trải ngang** ngay dưới hàng. Rút 3 đoạn ghi chú cuối panel còn 2 câu (UX 26/09 §5.2). Mockup **M2** | Dán 20 dòng có lỗi → mọi hàng cùng chiều cao, cột thẳng | PR-NHAP |
| YC-5.2 | Thêm cột **Email** sau Ngày sinh; **Thời gian thi dự kiến** cạnh Target ở cuối; vẫn dán Excel; trống được; bắt buộc: Họ tên, Email, Tuần bắt đầu (mặc định tuần của lớp); GVCN sửa lại được | Chưa có cột `students.email`; có `learning_cycles.exam_month` + `exam_period_id`, **không** lưu ngày (schema.sql:299-319) | Migrate: `students.email`, `learning_cycles.exam_date`. Thứ tự cột FT: `Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Thi dự kiến · Tuần bắt đầu`. Lớp thường: `Họ tên · Ngày sinh · Email · (Placement — BE/ELE, T10) · Tuần bắt đầu`. Nhận dạng cột dán theo **tiêu đề** (không theo thứ tự). Thông tin HV cho GVCN + QL sửa **họ tên, ngày sinh, email, tuần bắt đầu** (có nhật ký) | Dán thiếu cột Email → dòng báo lỗi đúng ô Email; sửa email sau ở Thông tin HV | PR-NHAP |
| YC-5.3 | Bỏ ô "Định dạng ngày"; mặc định `dd/mm/yyyy`; Thi dự kiến nhận `dd/mm/yyyy` **hoặc** `mm/yyyy` | `IntakePanel.tsx:94,257-258` có ô chọn `dmy/mdy/iso` | Bỏ ô chọn; máy chủ chỉ đọc `dd/mm/yyyy` (và `d/m/yyyy`); từ chối ngày không có thật (31/02 — UX-C C10); Thi dự kiến theo T9 | Gõ `05/2027` → "Thi dự kiến 05/2027"; `31/02/2010` → lỗi đúng ô | PR-NHAP |
| YC-5.4 | Tuần bắt đầu điền **ngay** theo tuần của lớp; ô mỗi dòng giống ô "Tuần bắt đầu học": gõ được + nút lịch | Ô đầu panel là ô ngày trình duyệt để trống `dd/mm/yyyy` (ảnh 1); ô dòng là chữ `01/06` | Ô đầu panel điền sẵn tuần khai giảng của lớp ngay khi mở; mỗi dòng dùng **ô ngày thống nhất** kiểu tuần (YC-9) | Mở panel là thấy tuần của lớp; đổi ô đầu → các dòng chưa sửa tay đổi theo | PR-NHAP |

### 4.3. Toàn web (yêu cầu 6–10, 14)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-6 | Đổi tên thành **Pisa Tracking** | "PISA Progress" ở `web/src/App.tsx:84`, `WelcomePage.tsx:137`, `index.html:7`, log máy chủ `server/src/index.ts:21`, tài liệu | Đổi mọi chỗ hiển thị + tiêu đề tab + tài liệu hướng dẫn (README, TRIEN_KHAI, DEMO). Không đổi tên thư mục/repo | Quét chữ "PISA Progress" chỉ còn trong lịch sử/nhật ký | PR-N1 |
| YC-7 | Nút nhỏ góc trên đổi sáng/tối | Chỉ có nền tối: `index.css:7 color-scheme: dark`; 866 chỗ gọi thẳng tên màu `slate-*`/`ink-*` | (1) chuyển bảng màu Tailwind (`slate`, `ink`, `teal`…) sang **biến CSS**; (2) bảng màu sáng (§7.4) đạt tương phản ≥ 4.5:1; (3) sửa chỗ dùng màu cứng (`bg-white/10`, mã hex trong `style`); (4) nút ◐ (T15); (5) phép kiểm tương phản cho **cả hai** chế độ (mở rộng `nenGiaoDien.tests.ts`) | Chụp 10 trang chính ở cả hai chế độ; ảnh xám vẫn đọc được | PR-SANG |
| YC-8 | Chọn "Khác" ở đâu cũng hiện ngay ô chữ nhỏ | Mỗi nơi xử lý một kiểu: phân loại nguyên nhân (không có ô, bắt mô tả ≥ 30 ký tự — `QuickReport.tsx:271`), lý do Không cần theo dõi (có), Phối hợp SOS (có), nhóm vi phạm, lý do chuyển lớp/kết thúc (`students.ts:14-24`), PA đề xuất `other_proposal`, báo cáo tutor `tutor_other`… | Thành phần chung **`OKhac`** (T13) + quét mọi danh sách có mục Khác. Phép kiểm quét: mọi hằng số nhãn có giá trị "Khác" phải đi qua `OKhac` | Bảng kiểm §10.2 đủ ≥ 10 chỗ | PR-NEN |
| YC-9 | Mọi ô ngày/tháng/thời gian: gõ số + chọn lịch; ngày hiện ngày, tuần hiện tuần; chỗ đặc biệt hỏi trước | Ba kiểu: 17 ô ngày trình duyệt (`TransitionPanel`, `MockDetailPage`, `IntakePanel`, `StudentPlanPanel`, `ManagerTasks`, `MgmtTasksPage`, `CaseSosControls`, `PhoiHopSosSection`, `Filters`…); 19 file dùng danh sách thả xuống `ChonNgayGan/ChonTuan/ChonThang` (không gõ, không lịch); `WeekPicker` (có lịch + gõ) | Thành phần chung **`ONgay`** bốn kiểu: `ngay` · `tuan` · `thang` · `ngay-hoac-thang`; gõ `dd/mm/yyyy` (chấp nhận `dd/mm`), nút lịch mở lịch tự vẽ (portal, không bị cắt trong panel), nút "Gần đây". Thay **mọi** chỗ trừ T12 | Phép kiểm: không còn `type="date"`/`"month"` trong `web/src`; `ChonNgayGan/ChonTuan/ChonThang` chỉ còn là lớp bọc `ONgay` | PR-NEN |
| YC-10 | Mọi ô "tên người thực hiện" là ô tìm nhỏ; nhập được người ngoài hệ thống | `ChonNguoi` (`ui/PeoplePicker.tsx`) đã hỗ trợ `kieu:'ngoai'`, dùng ở 10 file. Còn: ô chọn phụ trách bắt gõ 3 ký tự (`congViec/ChonPhuTrach.tsx`); việc Vận hành chỉ nhận tài khoản; GV chấm Speaking chưa có | T14; quét mọi ô người; Vận hành nhận tên ngoài hệ thống (không nhận thông báo) | Bảng kiểm §10.2 | PR-NEN (+ PR-HSM cho GV chấm) |
| YC-14 | Làm nổi bật thông tin quan trọng, gọn, dễ chịu | Chữ phụ 10–11 px dày đặc; số quan trọng cỡ bằng chữ phụ (đánh giá 26/09 §3.6) | Hệ "ba tầng thông tin" §7.5 áp cho mọi màn đụng tới trong các PR; font (T16); cỡ chữ tối thiểu 12 px cho kết quả/hạn (UX-E E4) | Mỗi PR giao diện có ảnh trước/sau; mỗi màn nói rõ "tầng 1" của nó là gì | Mọi PR giao diện |

### 4.4. Học viên & Lớp (yêu cầu 11)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-11.1 | Không tự mở một lớp; hàng tiêu đề (HV, Kết quả gần nhất…) dính khi cuộn | `lopMoSan` mở lớp đầu tiên (`shared/domain/hocVienLop.ts:235-238`); bảng không có tiêu đề dính | T17; tiêu đề cột `position: sticky` trong vùng cuộn của trang (`<main>`), kèm tên lớp đang xem | Cuộn 3 lớp vẫn thấy tiêu đề cột | PR-N1 |
| YC-11.2 | Dòng dưới điểm gần nhất gọn, tối đa 2 dòng (ví dụ FT / lớp thường); các khu khác nổi bật hơn; **đề xuất** thêm cột | Dòng hiện tại dài, bị cắt "…" (ảnh 2): `MT2 · kỳ vọng 6.5 · mới có 2/4 kỹ năng · Thiếu W 6.0, S …` | T18. Badge SOS giữ màu thang SOS; tên em đậm hơn; "Việc tiếp theo" thành liên kết (UX-B B8). **Đề xuất cột mới (chưa làm, chờ anh/chị chọn ở M3):** "Sắp tới" = mốc kế tiếp của em (`MT2 · W2 OCT` hoặc `Cuối khoá · W4 OCT`). Tôi **không** đề xuất thêm cột nào khác | Không còn dấu "…" ở cột kết quả | PR-HVL |
| YC-11.3.1 | "Cần hỗ trợ": rộng hơn, **4 hàng theo 4 kỹ năng**, mỗi hàng: thông tin case + phương án đang làm — **mockup** | `BangCanHoTro.tsx`: mỗi em **một** hàng, chỉ case chính | T19. Mockup **M4** (đã vẽ). Cột: Kỹ năng · Case (tên, nguyên nhân, mức gấp, mở từ) · PA đang làm (tên, người, đến khi) · Việc tiếp + hạn | Em có Case L và S → khối 4 hàng, R và W mờ "—" | PR-HVL |
| YC-11.3.2 | Bộ lọc "Vi phạm xử lý" (ảnh 3) lỗi, gần như vô dụng | **Đã tìm ra**: số trên dòng em chỉ đếm vi phạm *chưa xử lý đúng nhóm*, còn danh sách "Vi phạm gần đây" lấy thêm vi phạm trong phương án đang chuẩn bị **không lọc theo nhóm** (`ClassYThucCard.tsx:126,163-166`) → "0 vi phạm" nhưng hiện 4 dòng BTVN khi lọc Chuyên cần; 12 nút lọc trên 3 hàng | Đợt 1: sửa nhanh cho số và danh sách cùng một tập (PR-N1). Đợt 3: dựng lại tab theo luật Ý thức mới (YC-11.4) — bộ lọc còn 1 hàng: `Tất cả · Cần xử lý · Chờ duyệt · Đã xử lý` + nhóm vi phạm dạng thả xuống | Lọc Chuyên cần → mọi số và mọi dòng đều là Chuyên cần | PR-N1 → PR-YT4 |
| YC-11.3.3 | Phân tích lớp: mở rộng theo kỹ năng giống bảng phân tích Tổng quan: số HV có vấn đề · số case ở kỹ năng · đang theo dõi · đã có phương án · đã xong → thành công (không hiện "không thành công"); hiệu quả PA: đang thực hiện · đã thực hiện · thành công · tỷ lệ thành công | `PhanTichLopTab.tsx` + `ClassIssueBoard.tsx` (năm con số mỗi hàng, cách mở rộng khác Tổng quan) | Mở một kỹ năng → **hai bảng nhỏ** (mockup **M5**): *Vấn đề* (HV gặp vấn đề · Case · Đang theo dõi · Đã có PA · Đã xong → Thành công) và *Hiệu quả PA theo loại* (Đang thực hiện · Đã thực hiện · Thành công · Tỷ lệ thành công `n/N (x%)`, `<TyLe>`, mẫu nhỏ khi N < 5). Mọi số bấm được ra danh sách (hợp đồng số liệu). Số dùng chung hàm với Phân tích › Hiệu quả PA | Số ở tab lớp = số ở Phân tích khi lọc đúng lớp | PR-HVL |
| YC-11.4 | Ý thức + phương án xử lý trong hồ sơ lớp: giống bên ngoài, **hai panel cạnh nhau** (Phương án · Các vi phạm) | Mỗi em một khối xếp dọc, trong khối lại hai cột (ảnh 3) → rất dài | Mockup **M6**: trái **Xử lý** — danh sách em theo trạng thái (Bắt buộc xử lý · Quá hạn · Chờ QL duyệt · Đã xử lý gần đây), mỗi dòng: tên · bậc hiện tại · số vi phạm mở · hạn; phải **Vi phạm** — dòng thời gian của em đang chọn (mặc định: mọi em, mới nhất trước), mỗi vi phạm có nút **Ghi nhận** / chọn để **Xác nhận xử lý**. Trên điện thoại: hai khung thành hai tab | Chọn một em bên trái → bên phải chỉ còn vi phạm của em đó; không cuộn trang quá 2 màn cho lớp 20 em | PR-YT4 |

### 4.5. Hồ sơ học viên — SOS, Case (yêu cầu 12.1–12.5)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-12.1 | Bấm "Không cần theo dõi" mà nút "Xác nhận nguyên nhân" vẫn còn; bấm cả hai thì vỡ giao diện (ảnh 4) | `CaseSosControls.tsx` cho mở **cùng lúc** hai khối chọn | Đợt 1: hai khối loại trừ nhau (mở khối này thì đóng khối kia). Đợt 3: thay bằng luồng YC-12.3 / 12.4 | Không thể thấy hai khối cùng lúc | PR-N1 → PR-SOS |
| YC-12.2 | Case và PA khó phân biệt; Case gập/mở được, gập vẫn giữ thông tin hàng tiêu đề | `SkillBoard.tsx` `TheCase` / `KhoiPhuongAn` cùng màu, khác mỗi dấu ▶ | T20, mockup **M7** | Ảnh xám vẫn phân biệt Case / PA | PR-SOS |
| YC-12.3 | Workflow "Xác nhận nguyên nhân" (12.3.1–12.3.6) | Hiện là một dải chip trong hàng kỹ năng + PA "Gợi ý tự động · chờ xác nhận" với Xác nhận/Sửa/Thay | Bấm **Xác nhận nguyên nhân** → mở **Ngăn Case** với form "Xác nhận Case" (mockup **M7**): không có tab "Đã xong từ trước" (12.3.1); kỹ năng khoá (12.3.2); **bắt buộc** Phân loại nguyên nhân + Mức độ gấp; tên mặc định `{kỹ năng} không đạt`, sửa được, hai phần cố định `[MT#]` (nổi bật) và `[SOS n]` (T21) (12.3.3); Bắt đầu theo dõi = **hôm nay**, không đổi (12.3.4); **không** có khối Bằng chứng, chỉ Mô tả (12.3.5); khối "Phương án theo quy chế SOS" hiện sẵn, không xoá được, có "+ Thêm phương án" (12.3.6). Bấm **Xác nhận Case** → Case chạy, PA quy chế hiện ngay dưới Case, trạng thái "Đang làm" | GVBM đi hết luồng trong ≤ 4 lần bấm + gõ mô tả | PR-SOS |
| YC-12.4 | "Không cần theo dõi": lý do → tự chuyển QL → QL xác nhận trong 5 ngày làm việc → duyệt: Case + PA huỷ; lịch sử ghi rõ GV quyết định + lý do | S05 hiện: GVBM tự đóng ngay (`SOS_VA_PHOI_HOP_V3.md` S05) | Luật §5.3; thẻ loại **Học thuật** trong Chờ duyệt (§5.5); T23, T24 | Duyệt → Case "Đã huỷ · không cần theo dõi"; lịch sử có 3 dòng: GV xin (lý do) · QL duyệt · huỷ PA | PR-SOS (dùng PR-DUYET) |
| YC-12.5.1 | Form "Case đã xong từ trước": gõ 1 chữ vào tên PA là dòng tự đóng | **Đã tìm ra**: `QuickReport.tsx:417` — `dangSua = moSua.includes(i) \|\| !a.description.trim()` → có chữ là coi như xong | Dòng mới luôn ở chế độ sửa cho tới khi bấm **Xong**; thêm phép kiểm | Gõ cả câu không bị đóng | PR-N1 |
| YC-12.5.2 | Báo thiếu nhưng không nói thiếu gì; nên viền đỏ khi rời ô | Chân form ghi "Còn thiếu: Mô tả" trong khi luật là ≥ 15 ký tự (`QuickReport.tsx:265-279`) | Khi rời ô: viền đỏ + câu ngay dưới ô `Cần ít nhất 15 ký tự (đang có 8)`; bộ đếm ký tự nhỏ; chân form liệt kê **tên ô + lý do**; bấm tên ô thì nhảy tới ô đó. Áp cho **mọi form dùng `KhungPanel`** | Gõ 5 ký tự ở Mô tả rồi bấm sang ô khác → thấy đỏ + lý do | PR-N1 |
| YC-12.5.3 | Chỗ điền **Kết quả phương án** (ảnh 4: PA đã xong "Chưa có kết quả") | Form nhập bù chỉ có "Kết quả cuối" của cả Case | Mỗi PA đã áp dụng có ô **Kết quả PA** bắt buộc (Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Chưa đủ dữ liệu — cùng bộ `FOLLOWUP_OUTCOMES`). Hàng PA trong bảng kỹ năng hiện kết quả đó | PA nhập bù hiện kết quả thay vì "Chưa có kết quả" | PR-SOS |
| YC-12.5.4 | Cột KQ PA: nút (Mở case, Ghi kết quả…) nằm **trên** dòng chữ phụ, đồng bộ | "Ghi kết quả" bị đẩy sang phải cạnh dòng chữ (ảnh 4) | Cột bên phải của mọi hàng Case/PA: **nút ở trên, chữ phụ ở dưới**, căn trái cùng một mép | Mọi nút trong cột cùng một mép trái | PR-N1 |

### 4.6. Ý thức (yêu cầu 12.6) — luật đầy đủ ở §5.4

| Mã | Yêu cầu | Làm gì | PR |
|---|---|---|---|
| YC-12.6.1 | Không phải lúc nào cũng cần report/biện pháp; ≥ 3 lỗi trong 2 tuần → bắt buộc xử lý; xử lý ngay nếu nghiêm trọng; > 5 ngày chưa xử lý → quá hạn + báo QL | §5.4 luật V4-1…V4-6; T25, T26 | PR-YT4 |
| YC-12.6.2 | Bỏ bước trung gian (tổng hợp → ghi PA → bắt đầu → xác nhận) → **Xác nhận xử lý** một bước; không bắt buộc tệp; bắt buộc mô tả; bỏ "Xoá PA" | §5.4 V4-7; panel mockup **M6** | PR-YT4 |
| YC-12.6.3 | Ghi nhận thông thường khác biệt rõ với Đã xử lý | §5.4 bảng trạng thái vi phạm | PR-YT4 |
| YC-12.6.4 | Thang Report 1 → Report 2 → Thư CC 1 → Report 4 + Meeting CX/GĐCN → Thư CC 2; QL duyệt Meeting CX/GĐCN, Thư CC 3, Đình chỉ trong 5 ngày; ngoại lệ Report 4; mỗi lần trình QL có mô tả + bằng chứng; bỏ 2 loại meeting + trao đổi ngắn | §5.4 V4-8…V4-12; Q27-1; T27–T32 | PR-YT4 |

### 4.7. Test / Mock Test (yêu cầu 13)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-13.1 | Kiểm luật dấu `-` khi dời: dời 1 tuần được; tuần 2 vẫn dời → QL duyệt; demo chưa thể hiện | Cơ chế **có** (`fasttrack/absence.ts`: `pendingMove`, `canRequest`; nhóm việc "Duyệt dời lịch do vắng" `mywork.ts:147+`) nhưng bộ demo **không có** em nào dời lần hai | (1) kiểm từ đầu tới cuối bằng phép kiểm (FT: `-` lần 1 → tự dời; lần 2 → yêu cầu QL; QL duyệt/không trả lời hết tuần → C09); (2) thêm **2 em demo**: một em chờ duyệt dời lần 2, một em đã được duyệt; (3) hiện rõ ở Lịch Test (`Chờ QL duyệt dời lần 2`) và hộp Chờ duyệt (T42) | Anh/chị mở demo thấy đúng 2 tình huống | PR-MT |
| YC-13.2 | Tự tạo lịch MT mặc định: FT MT1 tuần 6 · MT2 tuần 12 · MT3 tuần 16; RF MT1 tuần 4 · MT2 tuần 8; QL sửa sau; HS cũ (đã học > 20 tuần) vẫn tạo đủ; MT đã qua → GVCN và QL nhập đủ 4 kỹ năng | Hằng số `MOCK_FT_STUDY_WEEK` có; **không** tự tạo — nhập danh sách cố ý không lập lịch (`intake.ts:472-479`) | §5.2 luật M1–M6; T33–T35; Q27-2 | Thêm HS bắt đầu cách đây 22 tuần → thấy MT1, MT2, MT3 đều "MT lịch sử", GVCN nhập được cả 4 kỹ năng; chỉ MT3 (nếu trong 4 tuần) tạo Case | PR-MT |
| YC-13.3 | Đánh số MT: sang lộ trình khác → MT1 (FT); không có MT3, MT4 khi chưa có MT1, MT2; MT đầu tiên luôn là MT1; tăng dần | Số lượt theo lộ trình (đã reset theo `cycle`); nhưng `createAttempt` nhận `attemptNo` tuỳ ý (`attempts.ts:986`) → nhảy cóc được | T36, luật M7 §5.2 — kiểm ở máy chủ cho `createAttempt` và `POST /ke-hoach-test/dot` | Gọi thẳng API tạo MT3 khi chưa có MT2 → bị từ chối, câu lỗi tiếng Việt | PR-MT |
| YC-13.4 | Nâng cấp panel xếp lịch MT: lọc CN, lớp, tìm HS; HS đã chọn lên đầu; chọn đợt tới MT8; trùng/đã làm → tự sang MT kế tiếp; hàng cạnh tên liệt kê MT đã/chưa làm, tick trực tiếp; ép vào đợt trùng → pop-up kỹ năng đã mock; 4 kỹ năng mặc định cùng tuần (tuần tới), thanh tuần chung ở trên, lịch riêng từng kỹ năng bên dưới | `test/keHoach/NganXepHangLoat.tsx` (chọn sẵn đợt sai — UX-C C4; 14 điều khiển) | Dựng lại theo mockup **M9**; T37; giữ "xem trước từng em · lưu theo em · giữ hàng lỗi" đang có | QL xếp MT3 cho 12 em thuộc 2 lớp trong ≤ 5 lần bấm | PR-XLMT |
| YC-13.5 | Chấm W và S: ô nhận xét chung phía dưới (không bắt buộc); S thêm **tên GV chấm** | Chưa có cột nhận xét/GV chấm (`assessment_scores` chỉ có `note`) | Migrate: `assessment_scores.comment`, `examiner_user_id`, `examiner_name`; T39; hiện ở hồ sơ Mock, lưới chấm (hộp 4 tiêu chí), xuất Excel | Nhận xét hiện dưới điểm W ở hồ sơ Mock | PR-HSM |
| YC-13.6 | Panel thêm hoạt động (ảnh 5): gọn, thuật ngữ ngắn; Lịch sử giữ nhưng rõ hơn; tích hợp vào dashboard kế hoạch MT | Menu "Thêm" ở màn một lượt (`MockDetailPage.tsx:373-407`) chạy ngay, lý do ghi cứng | T38; thao tác có mặt ở **hai chỗ dùng chung một hộp**: hộp kỹ năng của Kế hoạch Test (`HopKyNang.tsx`) và hàng kỹ năng ở hồ sơ Mock. Lịch sử: dòng thời gian gọn (biểu tượng · việc · ai · khi · lý do) gập dưới đợt | Không thao tác nào ghi ngay mà không có hộp lý do | PR-XLMT |
| YC-13.7 | Làm nổi bật **Writing tổng** (ảnh 5) | Hàng "Writing (tổng)" chữ nhỏ, xám, lẫn giữa W2 và S | Writing tổng là **một ô điểm lớn** ngang hàng L, R, S; W1/W2 là hai ô con bên trong; công thức thành chữ phụ nhỏ | Nhìn 1 giây thấy 4 điểm kỹ năng + Overall | PR-HSM |
| YC-13.8 | Hồ sơ Mock: điểm to rõ; W 4 ô tiêu chí; S 4 ô tiêu chí; đúng vai + đúng GVBM thì nhập ngay tại đây; giống dashboard Lịch Test | Bảng dòng chữ (ảnh 5); nhập phải sang lưới | Mockup **M10**: đầu trang (em · MT · tuần · lớp · kỳ vọng · kết quả `<KetQuaDot>`), dải 5 ô lớn L · R · W · S · Overall, ô W/S mở 4 ô tiêu chí; bấm ô (nếu có quyền) → sửa tại chỗ, lưu từng ô (`SaveState`), sửa điểm đã có vẫn bắt ghi lý do (RB-5); cột lịch + tình trạng từng kỹ năng gọn bên dưới | GVBM Speaking nhập 4 tiêu chí Speaking ngay ở hồ sơ Mock | PR-HSM |
| YC-13.9 | Nút xuất Excel kết quả MT, lọc linh hoạt (CN · tuần · lớp · thời gian · kết hợp); **đề xuất thiết kế + workflow** | Có thư viện `xlsx` (package.json) và nút xuất ở Phân tích › Tổng hợp Test | Đề xuất §7.8 + mockup **M11**; T40 | Xuất "chi nhánh MB, W1–W4 SEP" ra đúng số dòng như xem trước | PR-XUAT |

### 4.8. Luồng phối hợp, học sinh cũ, model (yêu cầu 15–16)

| Mã | Yêu cầu | Làm gì | PR |
|---|---|---|---|
| YC-15a | Rà logic **học sinh cũ** | Bảng kịch bản §10.3 (HS cũ vào web: lịch MT, MT lịch sử, SOS gần nhất, thang Ý thức khai bậc cũ, lộ trình, email thiếu) — mỗi PR liên quan chạy đúng các dòng của mình | PR-MT, PR-NHAP, PR-YT4 |
| YC-15b | Thông báo QL, gửi yêu cầu QL duyệt, yêu cầu QL cập nhật thông tin, tạo/theo dõi task, phối hợp phòng ban và toàn chi nhánh — **brainstorm + đề xuất** | §5.5 (hộp Chờ duyệt, ba loại đồ vật: Việc · Yêu cầu duyệt · Thông báo), mockup **M8**; phối hợp phòng ban qua "việc phối hợp" có tên ngoài hệ thống (TVV, Phòng xếp lịch) | PR-DUYET (+ PR-VAI cho Tổng quan) |
| YC-16 | Không đổi model Fable crosscheck; crosscheck giữ Opus 5.5 | T52; cập nhật `PROMPT_SESSION_CODE.md` mục 0 | PR tài liệu |

---

## 5. Luật mới

### 5.1. Lớp — tên, kiểu, lộ trình, phân công

| Mã | Luật |
|---|---|
| L1 | Mã lớp do **máy ghép**: `{mã chi nhánh} {FT \| FT RF \| FOU \| BE \| ELE} {số}` (T1). Người dùng chỉ chọn và gõ số |
| L2 | Kiểu lớp **FT** → chọn lộ trình `LT1 · LT2 · RF`. Kiểu **Lớp thường** → chọn `FOU · BE · ELE` (Pre-FOUND sẽ thêm khi Quản trị tạo chương trình) |
| L3 | Mỗi nhiệm vụ (GVCN, từng kỹ năng) **đúng một** người; GVCN phải dạy ≥ 1 kỹ năng của lớp — kiểm ở máy chủ **trước khi ghi** |
| L4 | Tạo lớp và phân công là **một giao dịch**. Được tạo lớp chưa đủ phân công (thiếu kỹ năng), nhưng **không** được tạo với phân công sai luật |

### 5.2. Lịch Mock Test

| Mã | Luật |
|---|---|
| M1 | Khi một em có lộ trình FT (thêm mới, chuyển vào lớp FT, mở lộ trình mới) → tự tạo các lượt **đã lên kế hoạch**: FT `MT1` tuần học 6, `MT2` tuần 12, `MT3` tuần 16; RF `MT1` tuần 4, `MT2` tuần 8. Tuần học 1 = tuần bắt đầu của lộ trình. Bốn kỹ năng cùng tuần |
| M2 | Kỳ vọng: LT1/LT2 giữ `target − 1.0 / − 0.5 / target`; **RF: mọi MT = target** (Q27-4) |
| M3 | **MT lịch sử** (T34): tuần thi kết thúc trước ngày em vào web. Người nhập được: GVBM đúng kỹ năng **và** GVCN của lớp **và** QL. Không hạn chấm, không vào "bài quá hạn", không sinh việc "Nhập điểm" |
| M4 | SOS của MT lịch sử: chỉ lượt **gần nhất** có tuần thi trong **4 tuần** trước ngày em vào web mới tự tạo Case + PA quy chế + Phối hợp SOS (Q27-2). Các lượt cũ hơn: lưu điểm, tính mức SOS để hiển thị, **không** sinh gì |
| M5 | QL sửa/xoá lịch mặc định như lịch thường (luật thứ tự đợt T15 giữ nguyên) |
| M6 | Em FT đã có trên bản chính mà chưa có lượt nào → lệnh `bo-sung-mt-mac-dinh` (chạy thử in danh sách → chạy thật khi chủ sản phẩm duyệt — T35) |
| M7 | Đánh số: lượt mới = `max(attempt_no còn hiệu lực) + 1`; từ chối `MTn` khi chưa có `MT(n−1)`; lượt đầu luôn là `MT1`; sang lộ trình mới đánh lại từ `MT1`; huỷ **cả lượt** thì số đó dùng lại (T36) |
| M8 | Dời do vắng (giữ luật cũ, chỉ làm cho **thấy được**): `-` lần đầu → tự dời đúng tuần kế tiếp; lần hai liên tiếp → yêu cầu **QL duyệt** (thẻ Lịch thi); QL không duyệt hết tuần đó → yêu cầu tự huỷ (C09) |

### 5.3. SOS Fast Track — bản v4 (thay S04, S05, S06 của v3)

| Mã | Luật |
|---|---|
| S4-1 | Mock có kỹ năng dưới kỳ vọng → tự tạo/gắn Case kỹ năng đó (**giữ S01, S02**) + **PA theo quy chế** (bảng v3 §4, RF theo T4) ở trạng thái **bắt buộc**, không còn "gợi ý chờ xác nhận" |
| S4-2 | GVBM đúng kỹ năng có **3 ngày** (tính cả ngày đầu) để chọn **một trong hai**: **Xác nhận nguyên nhân** hoặc **Không cần theo dõi**. Hai lựa chọn loại trừ nhau trên giao diện |
| S4-3 | Xác nhận nguyên nhân = điền form "Xác nhận Case" (YC-12.3): bắt buộc Phân loại nguyên nhân, Mức độ gấp, Mô tả (≥ 15 ký tự); tên theo T21; Bắt đầu theo dõi = hôm nay; không bằng chứng |
| S4-4 | PA quy chế: không xoá / thay / kết thúc sớm (T22). GV thêm PA khác theo luồng thường. Case đóng khi mọi PA đã có kết quả (luật đóng Case giữ nguyên) |
| S4-5 | Không cần theo dõi: chọn lý do (`Học sinh có lý do đặc biệt` · `Tình huống đơn lẻ` · `Khác` + ghi rõ) → tạo **yêu cầu duyệt** loại Học thuật, hạn **5 ngày làm việc** (T24) từ ngày GV gửi. Duyệt → Case + mọi PA chưa xong **huỷ** (không tính thất bại, không vào thống kê hiệu quả); Từ chối → T23 |
| S4-6 | Lịch sử Case ghi: GV quyết định không theo dõi · lý do · QL duyệt/từ chối · ai · khi nào |
| S4-7 | Thu hồi khi sửa điểm (S08) giữ nguyên; Case đang "Chờ QL duyệt" mà điểm sửa thành đạt → yêu cầu duyệt tự đóng với lý do "điểm đã sửa" |

### 5.4. Ý thức — bản v4 (thay Y01, B05, B12, B13 (phần tệp), W02 và danh sách biện pháp)

**Trạng thái của một vi phạm** (hiện bằng đúng một nhãn):

| Nhãn | Nghĩa | Kiểu hiển thị |
|---|---|---|
| `Mới` | chưa ai xem | viền trung tính |
| `Đã ghi nhận` | GVCN đã xem, không cần biện pháp | chữ xám + ✓ mảnh, **không nền** |
| `Cần xử lý` | thuộc tập bắt buộc (≥ 3 / 2 tuần) | nền vàng nhạt |
| `Quá hạn` | quá 5 ngày chưa xử lý | nền cam, "quá hạn n ngày" |
| `Chờ QL duyệt` | nằm trong một đề xuất đang chờ | tím nhạt |
| `Đã xử lý · {tên bậc}` | nằm trong một lần xử lý đã xong | nền trung tính đậm + tên bậc (ví dụ "Đã xử lý · Report 2") |

| Mã | Luật |
|---|---|
| V4-1 | Mọi vi phạm phải được GVCN đóng bằng **Ghi nhận** hoặc **Xác nhận xử lý** |
| V4-2 | **Bắt buộc xử lý**: khi em có **≥ 3** vi phạm (mọi nhóm) trong **tuần này + tuần trước** chưa nằm trong một lần xử lý (T25) → nút Ghi nhận **biến mất** cho các vi phạm đó; chỉ còn **Xác nhận xử lý** |
| V4-3 | GVCN được Xác nhận xử lý **bất cứ lúc nào** (vi phạm nghiêm trọng không cần chờ đủ 3) |
| V4-4 | **Quá hạn**: bắt buộc xử lý mà quá **5 ngày** (T26) chưa có lần xử lý đã xong → nhãn Quá hạn + thẻ **Báo lên** trong hộp Chờ duyệt của QL + thông báo |
| V4-5 | Vi phạm `Mới` quá 5 ngày chưa ai Ghi nhận/Xử lý → cũng Báo lên (thay cảnh báo mềm W01–W06) |
| V4-6 | Ghi nhận **không** đẩy bậc. Ghi nhận xong vẫn đếm vào luật ≥ 3 (T25) |
| V4-7 | **Xác nhận xử lý = một bước** (panel M6): danh sách vi phạm đưa vào (mặc định: mọi vi phạm chưa xử lý của em, tick bỏ được) · bậc (tự điền, không chọn) · ngày thực hiện (≤ hôm nay) · người thực hiện · **Mô tả bắt buộc** · tệp **tuỳ chọn**. Lưu là xong. Không có "Đang chuẩn bị", không có "Xoá PA" |
| V4-8 | **Thang bắt buộc** (Q27-1), đếm theo lộ trình (T27): bậc 1 `Report 1` · bậc 2 `Report 2` · bậc 3 `Thư cảnh cáo 1` · bậc 4 `Report 4 + Meeting CX/GĐCN` (một lần xử lý, không cần QL) · bậc 5 `Thư cảnh cáo 2` · bậc 6 `Thư cảnh cáo 3` (**cần QL**) |
| V4-9 | Ngoài thang, luôn **cần QL**: `Meeting CX/GĐCN` (đứng riêng), `Đình chỉ học tạm thời`, `Khác` (ghi rõ). Không đẩy bậc (T28) |
| V4-10 | Đề xuất cần QL: bắt buộc **mô tả + bằng chứng** (tệp hoặc liên kết). QL duyệt trong **5 ngày** (lịch, theo yêu cầu 12.6.4). Quá hạn → thẻ đỏ + báo Quản trị. Duyệt → GVCN bấm **Đã thực hiện** (ngày). Từ chối → vi phạm quay về `Cần xử lý`, bậc giữ nguyên |
| V4-11 | Bỏ khỏi danh sách chọn: `GV trao đổi ngắn với HV`, `GV meeting với HV`, `CX / GĐCN meeting với HV / PH` (bản cũ). Dữ liệu cũ giữ (T32) |
| V4-12 | Sửa/xoá vi phạm (V11′–V14′ của v3) giữ nguyên. Xoá vi phạm nằm trong lần xử lý đã xong: lần xử lý còn, số vi phạm giảm, **bậc không lùi** |
| V4-13 | Phối hợp SOS **không đổi** (vẫn có trao đổi HS/gia đình, GVCN meeting, CX meeting — đây là việc sau Mock, không phải xử lý vi phạm) |

### 5.5. Hộp "Chờ duyệt" và ba loại đồ vật (mục 15)

**Ba loại đồ vật — mỗi thứ chỉ ở một nơi:**

| Loại | Là gì | Ở đâu | Hết khi nào |
|---|---|---|---|
| **Việc** | có người làm + hạn; **suy ra** từ dữ liệu | Công việc › Việc của tôi; Tổng quan "Hôm nay" | tự biến mất khi làm xong ở bất cứ đâu |
| **Yêu cầu duyệt** | ai đó xin QL quyết định; **lưu** thành bản ghi | Công việc › **Chờ duyệt** (QL); "Yêu cầu của tôi" (người xin) | QL Duyệt / Từ chối, hoặc tự đóng khi không còn ý nghĩa |
| **Thông báo** | tin một chiều | chuông | đọc xong; **luôn trỏ** tới Việc hoặc Yêu cầu, không tự mang việc |

**Bản ghi yêu cầu duyệt (bảng mới dùng chung):** `loai` · `phan_loai` (Học thuật · Ý thức · Lịch thi · Thông tin HV) ·
`doi_tuong` (HS, lớp, Case, lượt MT, xử lý) · `nguoi_xin` · `ly_do` · `bang_chung` · `han_duyet` · `trang_thai`
(`cho` · `duyet` · `tu_choi` · `tu_dong`) · `nguoi_duyet` · `ly_do_tu_choi` · thời điểm. Mỗi loại khai **một hàm
"khi duyệt"** và **một hàm "khi từ chối"** — không viết luồng duyệt riêng từng nơi.

**Các loại ở vòng này:**

| Loại | Phân loại | Người xin | Hạn duyệt | Nguồn |
|---|---|---|---|---|
| Không cần theo dõi Case SOS | Học thuật | GVBM | 5 ngày làm việc | 12.4 |
| Đề xuất PA cần QL (luồng cũ) | Học thuật | GV | theo luật cũ | T43 |
| Kế hoạch bổ trợ lớp thường | Học thuật | GV | 3 ngày làm việc ⚠ | §6 |
| Quyết định Cuối khoá 50–59% | Học thuật | GVCN | trước ngày khai giảng lớp kế tiếp | §6 |
| Meeting CX/GĐCN · Thư CC 3 · Đình chỉ · Khác | Ý thức | GVCN | 5 ngày | 12.6.4 |
| Dời lịch MT lần 2 | Lịch thi | GV | hết tuần (C09) | 13.1 |
| Ép xếp MT vào đợt trùng | Lịch thi | — (QL tự làm, chỉ ghi lịch sử) | — | 13.4 |
| Đề xuất sửa thông tin HV | Thông tin HV | GV | 5 ngày làm việc | T44 |
| **Báo lên** (không có nút Duyệt): vi phạm quá hạn, Case chờ nguyên nhân quá hạn, Mini Test trượt, yêu cầu quá hạn duyệt | Báo lên | hệ thống | — | V4-4, V4-5, T47 |

**Thẻ yêu cầu** (mockup **M8**): `[Phân loại] Loại · Học viên · Lớp` / `Người xin · ngày xin · lý do (2 dòng)` /
`Bằng chứng (nếu có)` / `Hạn duyệt: còn 2 ngày` hoặc `quá hạn 1 ngày` / `[Duyệt] [Từ chối…] [Mở hồ sơ]`. Từ chối
bắt buộc lý do. Chọn nhiều thẻ cùng loại → "Duyệt n yêu cầu".

**Phối hợp phòng ban / toàn chi nhánh:** việc giao cho người **không có tài khoản** (TVV, Phòng xếp lịch) là
**việc phối hợp** gắn vào hồ sơ (Case, lượt Test, Kết luận khoá), người có tài khoản đánh dấu xong. Việc giữa các
chi nhánh đi qua Vận hành (tab đã có) với "Người phụ trách" nhận tên ngoài hệ thống (YC-10).

---

## 6. Lớp thường theo quy định P. Học thuật

Nguồn: `thiet-ke/nguon-27-09/NGUON_QUY_DINH_LOP_THUONG.md`. Áp cho **FOU, BE, ELE**; Pre-FOUND ghi ở §6.6.

### 6.1. Giữ nguyên
- Mức Pass **70%** (đã chạy — `RATIO_PASS_THRESHOLD`).
- Giữa khoá / Cuối khoá, điểm = số câu đúng / tổng số câu, dấu `-` dời tuần sau (C08).

### 6.2. Giữa khoá (Progress Test) — thay mô hình "tín hiệu · Tạo Case / Bỏ qua" (Q-V3-1)

| Mã | Luật |
|---|---|
| N1 | Kỹ năng < 70% → **tự tạo Case** `Giữa khoá · {kỹ năng} không đạt` + **PA Bổ trợ bắt buộc** đến tuần Cuối khoá: FOU `2 buổi/tuần` (một PA chung cho các kỹ năng trượt của em, gắn vào Case kỹ năng trượt đầu tiên, các Case còn lại trỏ tới) ⚠; BE/ELE `1 buổi/tuần/kỹ năng` (mỗi Case một PA). Ghi "trừ buổi Free" |
| N2 | GVBM kỹ năng đó xác nhận nguyên nhân như SOS FT (form "Xác nhận Case", YC-12.3) **và** nộp **kế hoạch bài giảng** (nội dung yếu + kế hoạch) → yêu cầu duyệt **Học thuật** cho QL. PA ở trạng thái `Chờ duyệt kế hoạch` → duyệt → `Đang làm` |
| N3 | Tự tạo **việc phối hợp** "Báo phụ huynh qua TVV" (4 nội dung của quy định) cho GVCN; GVCN đánh dấu xong khi đã tạo task trên Base (T45) |
| N4 | Không còn nút "Bỏ qua". "Không cần theo dõi" vẫn có, đi qua QL duyệt như S4-5 |
| N5 | Hạn 3 ngày xác nhận nguyên nhân như FT |

### 6.3. Cuối khoá (Final Test)

| % Cuối khoá (T47) | Hướng web gợi ý | Cần QL? | Web tự tạo |
|---|---|---|---|
| < 50% | Học lại level hiện tại | Không (QL/GVCN xác nhận ở Chuyển tiếp lớp) | Việc phối hợp "Báo phụ huynh qua TVV" (người làm: QL) |
| 50–59% | QL + GV đánh giá: học lại **hoặc** lên level + bổ trợ | **Có** — thẻ "Quyết định Cuối khoá" | Nếu lên: PA bổ trợ miễn phí (FOU: 1 buổi/kỹ năng trượt, 1 buổi/tuần/kỹ năng, 2 tuần) + **Mini Test** sau buổi cuối |
| 60–69% | Lên level + bổ trợ | Không | PA bổ trợ miễn phí (FOU: 1 buổi/kỹ năng trượt, trong 1 tuần) + Mini Test ở buổi 2 |
| ≥ 70% | Pass, tiếp tục lộ trình | Không | — |

- BE → ELE dùng đúng bảng của FOU (quy định mục V).
- **Mini Test**: một ô ghi `% · ngày` ở hồ sơ HV (không phải một loại Test mới trong lịch). Đạt khi ≥ 70% (T47).
  Trượt → thẻ **Báo lên** cho QL.
- "Miễn phí, không tính lương GV" là nhãn của PA (`Bổ trợ miễn phí`), để P. Học thuật và Phòng xếp lịch đếm được.

### 6.4. BE / ELE lên Fast Track — kỳ vọng đầu ra
- Nhập Placement (IELTS) khi thêm HV vào BE/ELE (T10). Kỳ vọng đầu ra: BE `4.0`, ELE `4.5–5.0`.
- Ở Kết luận khoá lên FT, QL đánh dấu **Đạt / Không đạt kỳ vọng đầu ra** + nguyên nhân (T49):
  Trung tâm → web tạo ở lộ trình FT PA `Tutor 10 buổi/kỹ năng không đạt` (tính buổi Free, có lương GV);
  Học sinh → QL ghi phương án case-by-case (chữ tự do) vào Kết luận.

### 6.5. KPI tháng
Phân tích › Theo giáo viên và Theo chi nhánh có cột **"Tỷ lệ pass tháng"** và **"Điểm KPI"** (T50). Mọi số bấm
được ra danh sách HS tạo nên nó.

### 6.6. Pre-FOUND — ghi lại, áp dụng khi có chương trình (T51)
Giống FOU, khác ở: Giữa khoá trượt → bổ trợ **2 buổi/tuần** (không theo kỹ năng); Cuối khoá 50–59% lên level →
**4 buổi** miễn phí (2 buổi/tuần, 2 tuần), Mini Test sau buổi 4; 60–69% → **2 buổi** (2 buổi/tuần, 1 tuần), Mini
Test ở buổi 2.

---

## 7. Kế hoạch UX/UI (impeccable + taste-skill)

### 7.1. Bản tóm tắt thiết kế (impeccable `shape`)

- **Ai dùng, lúc nào:** GVBM nhập điểm và theo Case của môn mình (laptop ở trung tâm, điện thoại giữa hai tiết);
  GVCN theo dõi cả lớp, xử lý vi phạm; QL duyệt, nhìn chi nhánh; Quản trị cấu hình. Tiếng Việt, nền tối là thói quen.
- **Chế độ:** **Operate** — người dùng đang làm việc; độ tin cậy và tốc độ quét quan trọng hơn biểu cảm.
- **Kết quả mong muốn:** mở màn nào cũng thấy ngay (1) điều quan trọng nhất và (2) một nút cho việc tiếp theo.
- **Hướng thiết kế:** **tinh chỉnh thế giới đang có** (không thiết kế lại): giữ nền xanh mực, thang SOS vàng/cam/đỏ,
  4 màu điểm, khuôn `KhungPanel`. Thêm: chế độ sáng, một font thật, hệ ba tầng thông tin, ngữ pháp trạng thái.
- **Không làm:** hiệu ứng chuyển động trang trí, gradient, card lồng card, modal khi panel bên là đủ, màu mới cho
  từng khu.
- **Ràng buộc:** mọi luật "tinh tế" của chủ sản phẩm (dấu nhỏ gọn, cột/hàng thẳng, không dồn chữ); 375 px; bàn phím.

### 7.2. Chọn skill cho session code

| Skill | Dùng ở PR | Để làm gì |
|---|---|---|
| impeccable `clarify` | PR-N1, PR-NHAP, PR-SOS, PR-YT4 | Câu báo lỗi, nhãn nút, chữ trạng thái |
| impeccable `distill` | PR-YT4, PR-HVL, PR-VAI | Bỏ badge/bộ lọc thừa, một nút chính mỗi vùng |
| impeccable `layout` | PR-HSM, PR-HVL, PR-XLMT | Phân cấp, nhịp khoảng cách, căn cột |
| impeccable `colorize` | PR-SANG, PR-HSM | Nhấn màu có chủ đích (trị "đơn điệu" — yêu cầu 14), bảng màu sáng |
| impeccable `adapt` | PR-UXD | Bảng → thẻ dưới 640 px |
| impeccable `audit` + `polish` | cuối mọi PR giao diện | Kiểm a11y, tương phản, trạng thái; một lượt chau chuốt |
| taste-skill `redesign-skill` | PR-SANG, PR-NEN | Bảng kiểm: font, `tabular-nums`, độ đậm 500/600, hover/active/focus, trạng thái rỗng/lỗi |
| **Không dùng** | — | taste-skill bộ chính / `gpt-tasteskill` / `soft-skill` (thiên landing page, chuyển động GSAP), `minimalist-skill` (bảng màu ấm đơn sắc đánh nhau với màu SOS), `brutalist-skill`, nhóm vẽ ảnh |

Trước khi dùng impeccable trong repo: chạy `/impeccable init` (viết `PRODUCT.md` từ §7.1) và `/impeccable document`
(viết `DESIGN.md` từ `HE_GIAO_DIEN.md` + `index.css`), thêm `.impeccable/` vào `.gitignore` — làm ở PR-NEN Task 0.

### 7.3. Ngữ pháp trạng thái (áp dần trong mọi PR giao diện)
Một dòng = **một** nhãn trạng thái chính (`Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ`) + hạn viết
bằng chữ + người phụ trách bằng tên. Chi tiết và ví dụ: `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` mục C.2.
Màu điểm và mức SOS là hệ riêng (không đổi).

### 7.4. Token

**Chữ** (Be Vietnam Pro, `tabular-nums` cho mọi số):

| Vai | Cỡ | Độ đậm |
|---|---|---|
| Số chính ở hồ sơ Mock, ô đầu hồ sơ | 28 / 20 px | 700 |
| Tiêu đề trang / khối | 20 / 16 px | 700 / 600 |
| Nội dung, số trong bảng | 14 px | 400 / 500 |
| Phụ (không dùng cho kết quả, hạn, người phụ trách) | 12 px | 400 |
| Nhãn nhỏ (`Nhan`) | tối thiểu 11.5 px | 600 |

**Chế độ sáng** — mọi màu đi qua biến CSS; giá trị đề xuất (session code chỉnh cho đạt ≥ 4.5:1 bằng phép kiểm):

| Token | Tối (đang có) | Sáng |
|---|---|---|
| Nền trang | `#0c1220` | `#f5f7fa` |
| Bề mặt / bề mặt 2 | `#141d2f` / `#1a2437` | `#ffffff` / `#eef1f5` |
| Viền | `rgba(160,178,214,.14)` | `rgba(15,23,42,.12)` |
| Chữ chính / phụ | `#dde5f2` / `rgb(147,163,192)` | `#0f172a` / `#475569` |
| Nhấn (nút chính, đang chọn) | `#7db3f0` | `#1d5fbf` |
| SOS 1 · 2 · 3 (chữ / nền) | vàng · cam · đỏ hiện tại | `#8a5a00/#fdf1cf` · `#b4400f/#fde6d8` · `#b42323/#fde2e2` |
| Đạt | `rgb(111,220,159)` | `#157a42/#dcf3e5` |

### 7.5. Ba tầng thông tin (yêu cầu 14 "nổi bật hơn, không ngợp")

| Tầng | Là gì | Cách trình bày |
|---|---|---|
| **1** | con số / quyết định: điểm, mức SOS, việc quá hạn, việc tiếp theo, số chờ duyệt | 16–28 px, đậm, màu nghĩa |
| **2** | tên, mô tả | 14 px, chữ chính |
| **3** | metadata: người nhập, giờ, mã, công thức | 12 px, chữ phụ, **ẩn được** trên điện thoại |

Mỗi màn trong PR phải ghi "tầng 1 của màn này là: …" trong mô tả PR. Ví dụ: hồ sơ Mock → 4 điểm kỹ năng + Overall;
Học viên & Lớp → mức SOS + việc tiếp theo; hộp Chờ duyệt → hạn duyệt.

### 7.6. Thành phần dùng chung mới

| Thành phần | Thay cho | PR |
|---|---|---|
| `ONgay` (ngày · tuần · tháng · ngày-hoặc-tháng) | 17 ô ngày trình duyệt + 3 bộ chọn thả xuống | PR-NEN |
| `OKhac` | mỗi nơi tự làm "Khác" | PR-NEN |
| `ChonNguoi` (mở danh sách ngay) | bản cũ bắt gõ 3 ký tự | PR-NEN |
| `NhanTrangThai` | chữ trạng thái tự đặt ở từng khu | PR-NEN (dựng) → các PR sau (dùng) |
| `TheYeuCau` + `HopChoDuyet` | các chỗ duyệt rời rạc | PR-DUYET |
| `HangCase` / `HangPA` | `TheCase` / `KhoiPhuongAn` cùng màu | PR-SOS |
| `ODiemLon` (ô điểm lớn + 4 ô tiêu chí + sửa tại chỗ) | bảng dòng chữ ở hồ sơ Mock | PR-HSM |
| `ToastHoanTac` | thao tác ghi ngay không hoàn tác | PR-N1 (gói UX-C C1) |

### 7.7. Mockup — `thiet-ke/mockup/19-nang-cap-27-09.html`

| Mã | Nội dung | Nằm ở |
|---|---|---|
| M1 | Tạo lớp (kiểu lớp, xem trước tên, phân công một người mỗi ô) | Học viên & Lớp › + Lớp mới |
| M2 | Thêm học viên (cột mới, cột Tình trạng, dòng chi tiết) | Hồ sơ lớp › + Học viên |
| M3 | Dòng kết quả gần nhất + cột đề xuất "Sắp tới" | Học viên & Lớp › bảng |
| **M4** | **Cần hỗ trợ — 4 hàng theo kỹ năng** (yêu cầu 11.3.1) | Hồ sơ lớp › Học viên › Cần hỗ trợ |
| M5 | Phân tích lớp mở rộng một kỹ năng | Hồ sơ lớp › Phân tích lớp |
| M6 | Ý thức lớp hai khung + panel Xác nhận xử lý | Hồ sơ lớp › Ý thức & Phối hợp |
| M7 | Case/PA phân biệt + form Xác nhận Case | Hồ sơ HV › Học thuật |
| M8 | Hộp Chờ duyệt có phân loại | Công việc › Chờ duyệt (QL) |
| M9 | Xếp lịch MT mới | Test › Kế hoạch Test › Xếp lịch MT |
| M10 | Hồ sơ Mock mới | Test › một lượt MT |
| M11 | Xuất Excel kết quả MT | Test › Kế hoạch Test › Xuất Excel |
| M12 | Ô ngày, ô Khác, ô chọn người, nút sáng/tối | toàn web |

### 7.8. Xuất Excel kết quả Mock Test — thiết kế và luồng (yêu cầu 13.9)

**Luồng:** Test › Kế hoạch Test › nút **Xuất Excel** (cũng có ở Phân tích › Tổng hợp Test) → ngăn bên phải:

1. **Phạm vi**: Chi nhánh (chọn nhiều; QL một chi nhánh thì chọn sẵn) → Lớp (chọn nhiều, lọc theo chi nhánh đã chọn;
   để trống = mọi lớp).
2. **Thời gian**: chọn một trong ba — *Theo tuần* (từ tuần … đến tuần …, ô tuần thống nhất) · *Theo tháng* ·
   *Theo đợt* (MT1…MT8, chọn nhiều). Các điều kiện **cộng dồn** (ví dụ "chi nhánh MB" + "W1–W4 SEP").
3. **Chỉ lượt**: `Đủ điểm` / `Mọi lượt` (mặc định Mọi lượt).
4. **Cột**: *Gọn* (mã, tên, lớp, MT, tuần, L, R, W, S, Overall, kỳ vọng, SOS) / *Đầy đủ* (+ W1, W2, 4 tiêu chí W và
   S, nhận xét W/S, GV chấm, tuần thi từng kỹ năng, người nhập).
5. **Xem trước** (luôn hiện, cập nhật khi đổi lọc): `312 lượt · 87 học viên · 6 lớp` + 5 dòng đầu.
6. **Xuất** → tệp `Pisa-Tracking_MT_{phạm vi}_{khoảng}.xlsx`: sheet `Kết quả` (một dòng = em × MT), sheet `Bộ lọc đã
   dùng` (ai xuất, lúc nào, điều kiện).

Máy chủ trả dữ liệu đã lọc theo quyền (T40); trình duyệt dựng tệp bằng thư viện `xlsx` sẵn có. Mỗi lần xuất ghi nhật ký.

---

## 8. Kế hoạch PR — 6 đợt

Luật chung: mỗi PR một nhánh, **không tự merge**; người rà **Opus 5.5** ở session riêng (T52); subagent cùng model,
**không Haiku**; `npm run check` **một lần, ở foreground**, sau mỗi task; bấm thử theo vai + 375 px + ảnh trước/sau ở
cuối PR (`thiet-ke/anh/<ma-pr>/`); PR có migrate → migrate **DB THỬ** trước deploy nháp. Kế hoạch chi tiết từng PR
soạn **ngay trước đợt của nó** (mã đổi sau mỗi lần merge).

Cổng thử cho ba làn song song: **A 4157/5357 · B 4167/5367 · C 4177/5377** (không dùng 4000/5173).

| Đợt | Làn | PR | Nội dung (mã yêu cầu) | Migrate | Model code (B) | Phụ thuộc |
|---|---|---|---|---|---|---|
| **1** | A | **PR-N1** Sửa lỗi nóng + sửa sai sự thật | YC-6, 11.1, 11.3.2 (sửa nhanh), 12.1 (tạm), 12.5.1, 12.5.2, 12.5.4; gói **UX-A** A1–A9; UX-C **C1** (Toast hoàn tác) | Không | Sonnet 5 · High (Fable 5.1 · High) | — |
| 1 | B | **PR-LOP** Tạo lớp · tên lớp · RF · phân công | YC-1, 2, 3 (danh mục + tên), 4; T1–T7 | **Có** (đổi tên lớp, thêm lộ trình RF) | Fable 5.1 · High (Opus 5.5 · High) | — |
| 1 | C | **PR-NEN** Nền giao diện | YC-8, 9, 10; T11–T14; UX-E **E1, E2, E3, E6**; UX-B **B3**; `NhanTrangThai`; impeccable init/document | Không | Fable 5.1 · High (Opus 5.5 · High) | — |
| **2** | A | **PR-DUYET** Hộp Chờ duyệt | §5.5; T41–T44; chuyển "Duyệt dời lịch" + "Đề xuất PA" vào hộp | **Có** (bảng yêu cầu duyệt) | Opus 5.5 · High (Fable 5.1 · High) | N1, NEN |
| 2 | B | **PR-MT** Lịch MT tự tạo · HS cũ · đánh số · RF · dời lần 2 | YC-13.1, 13.2, 13.3, RF kỳ vọng; §5.2 M1–M8; T33–T36 | **Có** | Opus 5.5 · XHigh (Fable 5.1 · High) | LOP |
| 2 | C | **PR-NHAP** Thêm học viên | YC-5.1–5.4; T8–T10; UX-C **C10** | **Có** (email, ngày thi, placement) | Sonnet 5 · High (Fable 5.1 · High) | NEN (dùng `ONgay`); gọi hàm tạo MT của PR-MT (merge MT trước) |
| **3** | A | **PR-SOS** SOS v4 + Case/PA | YC-12.1–12.5.3; §5.3; T20–T23; UX-B **B1, B2**; UX-C **C5, C6** | Có (nhỏ) | Fable 5.1 · High (Opus 5.5 · High) | DUYET |
| 3 | B | **PR-YT4** Ý thức v4 | YC-11.4, 11.3.2 (dựng lại), 12.6.1–12.6.4; §5.4; T25–T32; UX-B **B7**; UX-D **D5** | **Có** (loại xử lý, trạng thái vi phạm, bậc khai trước) | Opus 5.5 · XHigh (Fable 5.1 · High) | DUYET |
| 3 | C | **PR-XLMT** Xếp lịch MT + thao tác MT | YC-13.4, 13.6; T37, T38; UX-C **C3, C4** | Không | Fable 5.1 · High (Opus 5.5 · High) | MT |
| **4** | A | **PR-HSM** Hồ sơ Mock + chấm W/S | YC-13.5, 13.7, 13.8; T39; UX-C **C2, C9**; UX-E **E5, E8**; UX-F **F8** | **Có** (nhận xét, GV chấm) | Fable 5.1 · High (Opus 5.5 · High) | XLMT |
| 4 | B | **PR-HVL** Học viên & Lớp + hồ sơ lớp | YC-11.2, 11.3.1, 11.3.3; T18, T19; UX-B **B4, B8, B9**; UX-D **D2** | Không | Sonnet 5 · High (Fable 5.1 · High) | YT4 (tab lớp) |
| 4 | C | **PR-XUAT** Xuất Excel MT | YC-13.9; §7.8; T40 | Không | Sonnet 5 · High (Fable 5.1 · Medium) | HSM (cột nhận xét) — hoặc chạy sau HSM |
| 4 | C′ | **PR-SANG** Sáng/tối + font | YC-7, 14 (nền); T15, T16; UX-E **E4, E9** | Không | Sonnet 5 · High (Fable 5.1 · High) | chạy **sau cùng đợt 4** (chạm nhiều file) |
| **5** | A | **PR-LT2** Lớp thường theo quy định | §6; T45–T51 | **Có** | Opus 5.5 · XHigh (Fable 5.1 · High) | DUYET, SOS, NHAP |
| 5 | B | **PR-GV** Hồ sơ GV + Theo giáo viên + KPI | việc cũ PR-GV (23/09 §B) + §6.5 | Không | Fable 5.1 · High (Opus 5.5 · High) | LT2 (KPI) — phần hồ sơ GV chạy song song được |
| **6** | A | **PR-VAI** Tổng quan theo vai + hồ sơ HV 30 giây + đường dẫn sâu | Brainstorm E.1, E.3, E.4 (đường dẫn), T53 Q7, Q8; UX-B **B5, B6** | Không | Fable 5.1 · High (Opus 5.5 · High) | các đợt trước |
| 6 | B | **PR-UXD** Điện thoại | UX-D còn lại (D1, D3, D4, D6–D9) | Không | Fable 5.1 · High (Opus 5.5 · High) | VAI |
| 6 | C | **PR-UXF** Số liệu khớp | UX-F F1–F7; T53 Q2 | Không | Opus 5.5 · High (Fable 5.1 · High) | — |
| sau | — | **PR-S3** chữ cuối · **PR-Dọn** lỗi nhỏ · **PR-Pb2** Phân tích còn lại | kiểm kê 23/09 §B, §C | Không | Sonnet 5 · High | — |

**Deploy:** sau mỗi đợt, deploy gộp một lần (quy trình `TRIEN_KHAI.md`): sao lưu → migrate DB THỬ → nháp → bấm thử →
migrate DB CHÍNH → `--prod`. Đợt 2 có **lệnh bổ sung MT** (T35) cần chủ sản phẩm duyệt danh sách.

**Tách thêm PR?** Chỉ tách PR-YT4 nếu lúc soạn kế hoạch thấy phần migrate dữ liệu cũ (T32) phức tạp → PR-YT4a (luật +
migrate) và PR-YT4b (giao diện). Các PR còn lại để nguyên vì chạm cùng bộ file.

---

## 9. Kế hoạch cũ chưa làm → ghép vào đâu

| Nguồn | Mục | Ghép vào |
|---|---|---|
| UX 26/09 · UX-A | A1–A9 | PR-N1 (A5 theo T53 Q1) |
| UX-B | B1, B2 → PR-SOS · B3 → PR-NEN · B4, B8, B9 → PR-HVL · B5, B6 → PR-VAI · B7 → PR-YT4 | |
| UX-C | C1 → PR-N1 · C2, C9 → PR-HSM · C3, C4 → PR-XLMT · C5, C6 → PR-SOS · C7, C8 → PR-Dọn · C10 → PR-NHAP | |
| UX-D | D2 → PR-HVL · D5 → PR-YT4 · còn lại → PR-UXD | |
| UX-E | E1, E2, E3, E6 → PR-NEN · E4, E9 → PR-SANG · E5, E8 → PR-HSM · E7 → PR-HVL | |
| UX-F | F1–F7 → PR-UXF · F8 → PR-HSM | |
| UX 26/09 câu treo | Q1, Q2, Q4–Q8 | T53 |
| Kiểm kê 23/09 §B | PR-GV → đợt 5 · PR-Pb2, PR-S3 → sau | |
| Kiểm kê 23/09 §C | PR-Dọn (lỗi nhỏ) → sau; riêng `thongTinLop.ts:31` (trùng mã lớp hoa/thường) → PR-LOP; "Chưa phân loại" `vanDe.ts:83` → PR-UXF | |
| Kiểm kê 23/09 · câu treo | GVCN không dạy môn đó không nhập bù Case môn đó (C02) | **Giữ C02**. Khác với M3 (điểm MT lịch sử): M3 là điểm, C02 là Case |
| Kiểm kê 23/09 §D (hoãn có chủ ý) | taxonomy, I01–I26, AN-14… | vẫn hoãn |

---

## 10. Nghiệm thu chung

### 10.1. Mỗi PR
- Mọi mục của PR có dòng trong mô tả PR: mã YC/T → ảnh trước/sau → đạt/không.
- Không chữ máy lọt ra (mã kỹ thuật, ngày ISO, lệnh npm) — phép kiểm quét chữ của UX-A.
- Luật thuần mới có phép kiểm trong `server/src/tests/`.
- Trước khi báo xong: không còn `npm run check` chạy chồng.

### 10.2. Bảng kiểm "toàn web" (PR-NEN phải đi hết, các PR sau không được thêm chỗ mới sai)
- **Ô ngày**: mọi chỗ ở YC-9 cột Hiện trạng + mọi form mới của đợt 2–5.
- **"Khác"**: phân loại nguyên nhân · PA đề xuất · lý do Không cần theo dõi · Phối hợp SOS (loại việc + lý do bỏ) ·
  nhóm vi phạm · xử lý ngoài thang · lý do chuyển lớp / kết thúc học · báo cáo tutor · loại việc Vận hành · lý do
  từ chối duyệt.
- **Chọn người**: người thực hiện PA (4 form) · người thực hiện xử lý Ý thức · Phối hợp SOS · người phụ trách Vận
  hành · bộ lọc phụ trách · GV chấm Speaking.

### 10.3. Kịch bản học sinh cũ (YC-15a)

| # | Kịch bản | Phải thấy | PR |
|---|---|---|---|
| H1 | Thêm HS FT bắt đầu cách đây 22 tuần | MT1–MT3 "MT lịch sử", không việc Nhập điểm quá hạn | PR-MT |
| H2 | GVCN nhập đủ 4 kỹ năng MT2 lịch sử có SOS 2 (tuần thi cách 10 tuần) | Lưu điểm + SOS 2, **không** tạo Case | PR-MT |
| H3 | Nhập MT3 lịch sử có SOS (tuần thi cách 2 tuần) | Tạo Case + PA quy chế + Phối hợp SOS | PR-MT |
| H4 | HS RF mới | MT1 tuần 4, MT2 tuần 8, kỳ vọng = target | PR-MT |
| H5 | HS cũ đã từng bị Report 2 ngoài đời | GVCN khai "đã xử lý: bậc 2" → lần xử lý kế tiếp là Thư CC 1 | PR-YT4 |
| H6 | HS cũ chưa có email | Không badge Thiếu thông tin; Thông tin HV ghi "chưa có email" | PR-NHAP |
| H7 | HS FT đã có trên bản chính, chưa có lượt MT | Có trong danh sách chạy thử của `bo-sung-mt-mac-dinh` | PR-MT |

---

## 11. Chủ sản phẩm cần làm

1. Đọc §3.2, gạch dòng không đồng ý (đặc biệt các dòng ⚠: T4, T10, T12, T16, T18, T24, T47, T50, T54).
2. Mở `thiet-ke/mockup/19-nang-cap-27-09.html` — xem M4 (Cần hỗ trợ) và chọn có thêm cột "Sắp tới" (M3) hay không.
3. Báo "duyệt đặc tả" → session planning soạn kế hoạch chi tiết **đợt 1** (PR-N1, PR-LOP, PR-NEN) và đưa 3 prompt.
4. Trước đợt 1 deploy: cho biết trên bản chính có lớp nào "tàng hình" đã lỡ tạo (T7) — hoặc để session code liệt kê.
