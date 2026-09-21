# Bản demo — xem gì, ở đâu, và những điều đã chốt

Một tệp duy nhất thay cho hai tệp demo cũ (kịch bản xem và giả định đã chốt). Viết lại ngày **21/09/2026** khi mô hình
**Ý thức** đổi từ "Case Ý thức" sang **Vi phạm và Biện pháp xử lý** — bộ demo cũ về Ý thức không còn đúng.

Bản demo **không phải dữ liệu ngẫu nhiên**. Mỗi học viên có một câu chuyện riêng, dựng theo chiều của đời thật:

> Ghi danh → Chương trình → Bài kiểm tra → Vấn đề → Phương án → Cập nhật kết quả → Chuyển tiếp
> và, song song, **Vi phạm → Biện pháp xử lý** cho phần Ý thức.

**Ngày demo: 14/09/2026** (thứ Hai, tuần W3 SEP). Mọi thứ tính theo ngày này, không theo ngày thật của máy. Không dòng dữ
liệu nào nằm sau ngày đó — bộ dựng từ chối chạy nếu có. Toàn bộ tên người là **tên giả**. Mật khẩu mọi tài khoản demo ghi ở
màn đăng nhập.

| Muốn mở bằng tư cách | Email |
|---|---|
| Quản trị hệ thống | `dovutuanphong95.pisa@gmail.com` |
| Quản lý Monbay · Bãi Cháy · Cẩm Phả · Hải Dương · Uông Bí | `vy.nguyen` · `dang.tran` · `mai.le` · `anh.pham` · `binh.hoang` + `.pisa@gmail.com` |
| Giáo viên (ví dụ GVCN MB-FT 101) | `ha.tran.pisa@gmail.com` · các cô thầy khác cùng dạng `<tên>.<họ>.pisa@gmail.com` |

---

## 1. Ý thức — Vi phạm và Biện pháp xử lý (mười tám tình huống)

Ý thức **không còn là case**. Một **Vi phạm** là một sự việc do giáo viên ghi, độc lập, không có mức độ, không có hạn, không
có "đợt". Một **Biện pháp xử lý** là việc GVCN đã làm (hoặc đang chuẩn bị) cho **một học viên** — gom được nhiều vi phạm;
một vi phạm nằm được trong nhiều biện pháp. Trạng thái của vi phạm **không lưu** mà suy ra: *Chưa xử lý · Đang chuẩn bị ·
Đã xử lý · Không hiệu lực*. Quá **5 ngày** chưa xử lý thì hiện cảnh báo — chỉ nhắc, không tạo việc, không tính quá hạn.

> **Giao diện Ý thức là PR-K, chưa có ở bản này.** Bản này có đủ **dữ liệu, luật và quyền** ở máy chủ; muốn xem thì đọc qua
> đường API (`GET /api/students/:id/violations`, `/measures`, `/violation-warning`, `GET /api/classes/:id/y-thuc`,
> `GET /api/metrics/:id` với tám chỉ số Ý thức) hoặc chạy `npm test` — phần **PR-J · 0** soi từng tình huống dưới đây.

Bộ demo Ý thức nằm ở **một tệp**: `server/src/seed/yThucSeed.ts` (bảy học viên). Số liệu: **35 vi phạm** (2 đã đánh dấu không
chính xác), **14 biện pháp** (12 đã thực hiện, 2 đang chuẩn bị).

| # | Tình huống | Ở đâu trong bộ demo | Cần thấy |
|---|---|---|---|
| 1 | Vi phạm đúng | mọi vi phạm mặc định | `valid = 1`, có người ghi, ngày xảy ra, ngày ghi nhận |
| 2 | Vi phạm bị xác nhận sai | **Trần Thu Hà** (MB-FT 101) — vi phạm Reading 10/09 | Không hiệu lực, lý do *"Em đã nộp, tôi bỏ sót"*, một dòng lịch sử |
| 3 | Nhiều giáo viên cùng ghi cho một em | **Nguyễn Minh An** — cô Hà (Reading) · thầy Khoa (Writing 1) · cô Trang (Speaking) · cô Linh (Writing 2) | Bốn dòng độc lập, không gộp thành "đợt" |
| 4 | Nhiều vi phạm khác nhóm | **Nguyễn Minh An** | Đủ BTVN · Chuyên cần · Thái độ / hành vi |
| 5 | Một Report gom nhiều vi phạm | **Lê Quang Huy** — Report gia đình 10/09 | Đúng **5** vi phạm, 3 nhóm, 3 môn, 3 giáo viên, 5 ngày khác nhau |
| 6 | Một nhóm vi phạm có nhiều biện pháp | **Lê Quang Huy** — 6 vi phạm | Vào Meeting với học viên **và** Report **và** Thư cảnh cáo lần 1 |
| 7 | Biện pháp đang chuẩn bị được thêm vi phạm sau | **Nguyễn Minh An** — Report gia đình tạo 04/09, thêm vi phạm 11/09 | Còn *Đang chuẩn bị*; liên kết muộn hơn ngày tạo; vi phạm có dòng lịch sử |
| 8 | Vi phạm bị bỏ khỏi biện pháp | **Trần Thu Hà** — vi phạm 09/09 | Dòng lịch sử thêm rồi bỏ; quay lại *Chưa xử lý* |
| 9 | Thư cảnh cáo 1 → 2 → 3 đúng thứ tự | **Phạm Bảo Ngọc** — 10/08, 28/08, 10/09 | Ba thư, ba ngày khác nhau, **mỗi thư có tệp** |
| 10 | Cảnh báo quá 5 ngày | **An** (9 ngày, 4 vi phạm) · **Đặng Thu Vân** (8 ngày) · **Ngô Hải Yến** (6 ngày) | Câu *"⚠ 4 vi phạm chưa được xử lý — vi phạm cũ nhất: 9 ngày trước"*. Trần Thu Hà và Trần Hải Kiên đúng 5 ngày → **chưa** cảnh báo (cố ý, để thấy ngưỡng) |
| 11 | Case học thuật mức thường | các case học thuật giữ nguyên | Mức mặc định **Cần chú ý** (mức *Bình thường* đã bỏ từ trước, chỉ còn ở dữ liệu cũ) |
| 12 | Case học thuật Gấp | **Lê Quang Huy** — Speaking tái diễn 07/09 | Mức **Gấp**. Trước đây mức này nằm ở case Ý thức; nay nằm ở đây |
| 13 | SOS đóng, không tạo case | tín hiệu **"đã xem, không mở case"** | Luôn kèm **lý do** |
| 14 | SOS gắn vào case đang mở | tín hiệu **"đã gắn"** | Gắn vào một case chưa đóng |
| 15 | Giáo viên tạo case học thuật trực tiếp | các case nguồn *giáo viên báo* | Không có tín hiệu nào đứng sau |
| 16 | Vi phạm hết hiệu lực nằm trong biện pháp đã thực hiện | **Lê Quang Huy** — vi phạm 03/09 bị hủy 12/09 | Biện pháp giữ nguyên; ảnh chụp **vẫn là 6**; thống kê loại nó ra khỏi tổng |
| 17 | Một vi phạm nằm trong hai biện pháp ở hai thời điểm | **Lê Quang Huy** — vi phạm 10/08 | Nằm trong "GV trao đổi ngắn" 14/08 và trong ba biện pháp tháng 9 |
| 18 | Chuyển lộ trình sau Thư cảnh cáo lần 2 | **Trần Hải Kiên** (HD-BE 21 → HD-FT 302) | Chuỗi reset: lần 1 chọn lại được, lần 2 và lần 3 vẫn khóa |

Người **nhập hộ** khác người **thực hiện**: Report gia đình của **Đặng Thu Vân** do Quản lý Bãi Cháy ghi lại việc thầy Quân đã gọi.

Ba điều dễ nhầm, đã chốt:

- **Ngày trong đặc tả (18–20/09) không dùng được** vì sau ngày demo; bộ demo đặt các mốc tương ứng ở tuần 04–12/09.
- **Số "6"** của Meeting/Thư cảnh cáo và số **"5"** của Report cùng đúng: Report không chứa vi phạm 08/09 vì nó xảy ra *sau* ngày Report thực hiện.
- **Vấn đề Ý thức đi theo học viên sang lớp mới** (chủ sản phẩm chốt 21/09/2026): vi phạm chưa xử lý và biện pháp đang chuẩn bị ghi ở lớp cũ vẫn hiện ở tab lớp mới, cảnh báo giữ nguyên số ngày, GVCN lớp mới xử lý tiếp được.
- **Điểm thấp không sinh vi phạm.** Trước đây điểm dưới kỳ vọng còn sinh một tín hiệu Ý thức/Khác cho GVCN; nay không còn — Ý thức chỉ do giáo viên ghi.

---

## 2. Sáu hồ sơ học thuật nên mở đầu tiên

Nếu chỉ có mười phút, mở đúng sáu hồ sơ này là hiểu được cả hệ thống.

| # | Mở hồ sơ | Sẽ thấy gì |
|---|---|---|
| 1 | **Nguyễn Minh An** · PISA-000001 · MB-FT 101 | **Hành trình nhiều chương trình** Foundation → Beginner → Fast Track từ 12/2025. Một case Reading từ lớp Beginner vẫn mở và **theo em sang lớp mới** như một việc bàn giao. Bấm "Toàn bộ hành trình" để thấy điểm của hai chương trình cũ. |
| 2 | **Trần Thu Hà** · PISA-000002 · MB-FT 101 | **SOS giảm dần sau hỗ trợ.** MT1 SOS 2 → hỗ trợ → MT2 SOS 1. Case Reading khép "Tiến bộ rõ rệt"; case Speaking còn theo dõi sang chu kỳ hai dù kết quả gần nhất đã khá lên. |
| 3 | **Hồ Thanh Tùng** · CP-FT 110 | **Case tái diễn.** Reading từng chốt xong ở MT1; MT3 yếu lại → case **MỚI** nối vào case cũ; case cũ giữ nguyên kết quả. |
| 4 | **Lý Tuấn Bình** · CP-FT 110 | **Thay phương án.** Nhận định "thiếu từ vựng" không nhích; xem lại thấy là **giọng**. Phương án cũ khép "Được thay thế" (KHÔNG phải thành công). |
| 5 | **Phạm Gia Hân** · HD-BE 21 | **Bàn giao khi chuyển lớp.** Ghi chú bàn giao ở sự kiện chuyển lớp; chu kỳ hai do giáo viên mới thực hiện. |
| 6 | **Lý Thanh Trúc** · UB-FT 401 | **Kết quả thi thật** 15/08/2026: 6.0 so với target 6.5 — chưa đạt. So với **Dương Minh Quân** cùng lớp (7.0, đạt). |

### Bảng kịch bản đầy đủ

Mã J01–J12 chỉ dùng trong tài liệu này, không hiện ra sản phẩm.

| Mã | Học viên · lớp | Cần thấy gì |
|---|---|---|
| **J01** | Nguyễn Minh An · MB-FT 101 | Ba chương trình nối nhau. Case Reading lớp Beginner còn mở → **case bàn giao**, không tính thành SOS lớp Fast Track. Về Ý thức: xem mục 1 (tình huống 3, 4, 7, 10). |
| **J02** | Trần Thu Hà · MB-FT 101 | MT1 SOS 2 → MT2 SOS 1. Reading hết case; Speaking còn một case chu kỳ hai. Ý thức: tình huống 2, 8. |
| **J03** | Lê Quang Huy · MB-FT 101 | **Hồ sơ dày nhất** — mục 5. Ý thức: tình huống 5, 6, 12, 16, 17. |
| **J04** | Hồ Thanh Tùng · CP-FT 110 | Hai case Reading: một đã chốt (MT1), một mở (MT3) nối vào cái cũ, có mốc "tái phát". |
| **J05** | Đinh Ngọc Quyên · CP-FT 110 | **Hai case song song** cùng hạng mục Writing Task 2 (bố cục · vốn từ), mỗi case phương án riêng. |
| **J06** | Lý Tuấn Bình · CP-FT 110 | Phương án 1 "Được thay thế" sau "Chưa thay đổi"; phương án 2 "Tiến bộ rõ rệt". |
| **J07** | Phan Minh Tú · BC-FT 205 | Đề xuất **bị từ chối** kèm lý do; **được duyệt** (chu kỳ chạy từ ngày duyệt); **đang chờ**, quá hạn trả lời. Mở bằng Quản lý Bãi Cháy. |
| **J08** | Phạm Bảo Ngọc · MB-FT 101 | MT3 tuần này mới 2/4 kỹ năng → kết luận **tạm thời**; điểm MT2 không lấp vào ô trống. Cũng là ví dụ **tách tuần** (mục 4). Ý thức: tình huống 9. |
| **J09** | Trần Hải Kiên · HD-FT 302 | Lộ trình mới, chưa có MT → không có SOS; case Speaking từ Beginner cũ theo em như việc bàn giao. Ý thức: tình huống 18. |
| **J10** | Phạm Gia Hân · HD-BE 21 | Chuyển lớp giữa chừng khi case còn mở; chu kỳ 1 cô Yến, chu kỳ 2 thầy Dũng. |
| **J11** | Đặng Thu Vân · BC-FT 205 | Học thuật chưa có case. Ý thức: hai biện pháp đã thực hiện (một do Quản lý nhập hộ) rồi một vi phạm mới → cảnh báo 8 ngày. |
| **J12** | Dương Minh Quân + Lý Thanh Trúc · UB-FT 401 | Cùng thi 15/08/2026: một em **đạt** 7.0, một em **chưa đạt** (6.0 so với 6.5). |

---

## 3. Điểm dưới kỳ vọng sinh TÍN HIỆU, không tự mở case

> **Từ tối 21/09/2026 (rulebook v3) đoạn này chỉ còn đúng cho lớp NORMAL.** Mock Test Fast Track nay *tự tạo* case cho từng kỹ năng trượt — xem mục 9.

Điểm chỉ sinh **tín hiệu**: *"môn này dưới kỳ vọng, ai đó phải xem"*. Giáo viên bộ môn xác minh môn mình. Máy chỉ đọc được
con số chứ không biết **vì sao**, nên nó không tự mở case hay tự xếp phương án.

**Hạn xác minh: ba ngày, tính cả ngày đầu**, mốc là ngày tín hiệu được ghi nhận (không phải thứ Hai của tuần thi). Ba lối ra:

| Lối ra | Khi nào |
|---|---|
| **Mở case** | Xem lại bài thấy có vấn đề thật; người dạy đặt tên và viết mô tả |
| **Đã xem, không mở case** | Không có vấn đề thật; vẫn phải viết nhận định (bắt buộc — đây là *lý do* của tình huống 13) |
| **Tự thu hồi** | Điểm nguồn được sửa thành đạt; lý do "Không còn hợp lệ do sửa điểm" |

| Mở ở đâu | Cần thấy gì |
|---|---|
| **Chu Minh Hiếu** · MB-FT 102 → hồ sơ (Quản lý Monbay) | Thẻ **"Tín hiệu chờ xác minh"** trước bảng tiến độ: *Reading 5.0 so với kỳ vọng 5.5 · MT2*, hạn 16/09. **Chưa có case nào** — đó là điểm mấu chốt. Bấm **Mở case** để thấy form điền sẵn. |
| **Mai Ngọc Diệp** · BC-FT 205 (Quản lý Bãi Cháy) | Tín hiệu Speaking **đã quá hạn xác minh** (hạn 09/09) — cố ý. |
| Tổng quan của cô **Phạm Thu Trang** | Nhóm việc **"Xác minh tín hiệu"** đứng đầu, kèm nhãn *Quá hạn xác minh*. |

Thử: bấm **"Đã xem, không mở case"** rồi để trống nhận định → không cho lưu.

---

## 9. Rulebook v3 — SOS tự tạo case và Phối hợp SOS (chỉ máy dev)

Ba học viên MỚI ở `MB-FT 101`, dựng bằng chính các hàm nghiệp vụ (`server/src/seed/sosV3Seed.ts`): nhập điểm Mock Test → máy tự tạo case, phương án điền sẵn và việc phối hợp; rồi GVBM/GVCN thao tác.

| Học viên | Lượt | Bạn sẽ thấy |
|---|---|---|
| **Đỗ Minh Khôi** | MT2 · SOS2 (W2 + Speaking) | Hai case từ SOS. Speaking đã có nguyên nhân + phương án xác nhận; **W2 còn `chờ xác định nguyên nhân`**. Phối hợp SOS xong 1/3 (trao đổi với HS đã làm; gia đình và GVCN meeting còn cần xử lý). Có hai vi phạm Ý thức ở cùng em |
| **Vũ Ngọc Lan** | MT1 · SOS3 (L + R + S) | Ba case, phương án `Tutor · đến MT2`. **Case Speaking đã đóng `Không cần theo dõi · Tình huống đơn lẻ`**. Phối hợp SOS3 xong 2/3 (còn GVCN meeting) |
| **Bùi Thảo Vy** | MT3 · SOS1 (Speaking) | Một lượt Phối hợp **đã hoàn thành 2/2** — để thấy trạng thái "xong" |

Ba mức SOS khác nhau (1 · 2 · 3) đều có mặt; có cả lượt đang xử lý lẫn đã hoàn thành. Bộ demo Ý thức (mục 1) nay dùng *xoá thẳng* thay cho "đánh dấu không chính xác": hai vi phạm đã xoá (Trần Thu Hà, Lê Quang Huy) chỉ còn dấu vết ở `audit_logs`.

## 4. Lịch thi tách theo từng kỹ năng

Một đợt kiểm tra **không nhất thiết thi gọn một tuần**. Điểm vẫn thuộc **một đợt duy nhất**; **hạn chấm tính riêng từng môn**:

| | Hạn chấm |
|---|---|
| Fast Track | hết **thứ Tư của tuần kế tiếp** sau tuần thi môn đó |
| Normal | hết **Chủ nhật của chính tuần thi** môn đó |

Dời Speaking sang tuần sau **chỉ đổi hạn Speaking**. Môn chưa đến tuần thi thì chưa nợ điểm, không bao giờ tô đỏ quá hạn.

| Mở ở đâu | Cần thấy gì |
|---|---|
| **Phạm Bảo Ngọc** → MT3 → thẻ "Lịch thi theo kỹ năng" | "Đợt này thi ở nhiều tuần". L, R có điểm (hạn 23/9); Writing chưa chấm; **Speaking** tuần 21–27/9 "Chưa đến lịch", hạn 30/9. "Tuần hoàn tất" là **W4 SEP**. |
| **Tạ Thu Quỳnh** · MB-FT 102 → MT2 | **Chiều ngược lại**: Speaking trước, R/L/W tuần sau. |
| **Lớp MB-FOU 12** → Bảng điểm → bài cuối khoá | Final Test trải **ba tuần**; vẫn phải đủ cả bốn môn mới hoàn tất. |

---

## 5. Hồ sơ dày nhất: Lê Quang Huy (J03)

Mở `Học viên → MB-FT 101 → Lê Quang Huy`: **một em nhiều case thì màn hình đọc ra sao**.

| Hàng kỹ năng | Trạng thái | Bấm vào sẽ thấy |
|---|---|---|
| **Listening** | Đang xử lý | MỘT case qua HAI chu kỳ: tự học (xong, "Tiến bộ một phần") rồi tutor (đang làm, quá hạn cập nhật). |
| **Reading** | Đã kết thúc · có tiến bộ | Phương án có hai lần cập nhật: "Chưa đủ dữ liệu" (không vào mẫu số) rồi "Tiến bộ rõ" kèm điểm tự chấm 32/40. |
| **Writing Task 2** | Đang xử lý | Phương án đầu **không ăn thua** rồi bị thay bằng tutor; thanh cũ đỏ mờ, thanh mới xanh sáng. Kết quả thất bại cũ vẫn ở báo cáo hiệu quả. |
| **Speaking** | Chưa có phương án | Case cũ đóng, rồi **tái diễn** với vấn đề khác; case mới nối vào case cũ. Mức **Gấp**. |

Phần **Ý thức** của em nằm ở mục 1 (tình huống 5, 6, 16, 17): sáu vi phạm, bốn biện pháp, một vi phạm bị hủy sau khi biện pháp đã thực hiện.

---

## 6. Bốn màn nên mở

**Tổng quan → Toàn cảnh** (mở bằng Quản lý Bãi Cháy): sự kiện nổi bật (thu gọn sẵn); bảng "Việc cần lưu ý" — bấm một số là
lọc ngay danh sách bên dưới; "Việc cần làm" mặc định "Việc của tôi". Đổi sang tài khoản giáo viên để thấy danh sách ngắn lại.

**Tổng quan → Thực trạng**: theo tuần (sáu cột kết luận cộng đúng bằng số lượt); theo chi nhánh → Vấn đề; → Phương án &
kết quả (phương án bị thay nằm ở cột "Đã dừng", không bao giờ tính thành công). **Ý thức không có mặt ở đây** — nó ở ngoài mọi bảng hiệu quả hỗ trợ.

**Học viên**: MB-FT 101 (Fast Track: Target · Dự kiến thi · Mốc · OVR · L · R · S · W1 · W2); MB-FOU 12 (Normal: điểm đạt/tổng,
không Target); UB-FOUND 07 và HD-FOU 05 hết chương trình → "N em cần xếp lớp".

**Tiến độ công việc** (chỉ Quản trị và Quản lý): việc cha có bốn việc con (Writing quá hạn khi việc cha còn hạn); một việc
từng tạm ngưng rồi tiếp tục; một việc dừng hẳn có lý do; một việc gắn case làm căn cứ nhưng không tự tạo phương án.

---

## 7. Mười bốn tình huống của đề bài về lịch và điểm

Mỗi dòng có phép kiểm tự động canh chừng (mục **42** của `npm test`).

| # | Tình huống | Mở ở đâu |
|---|---|---|
| 1 | MT tách tuần theo **cả hai chiều** | Phạm Bảo Ngọc · Tạ Thu Quỳnh |
| 2 | FT thi một phần kỹ năng, **không Overall giả** | Đợt MT có kỹ năng "không yêu cầu" |
| 3 | Normal đủ bốn môn, ngưỡng 70% | Lớp MB-FOU 12 |
| 4 | Dời vì vắng: lần đầu GVCN · lần hai chờ duyệt | Nguyễn Minh An · Trần Thu Hà |
| 5 | Huỷ riêng một kỹ năng | Thẻ "Lịch thi theo kỹ năng" có hàng **Đã huỷ** |
| 6 | Kỹ năng chờ xếp lại, đợt **chưa** kết thúc | Hàng "Chưa có tuần" / "Đã xác nhận vắng" |
| 7 | GVBM đổi được môn mình, GVCN đổi nhiều môn | Đăng nhập GVBM rồi thử đổi môn không phải của mình |
| 8 | SOS 2 từ điểm, **không** phương án tự sinh | Bất kỳ case sinh từ MT |
| 9 | Trượt thật ở MT trước rồi tiến bộ | Trần Thu Hà · Lê Quang Huy |
| 11 | "Chưa đủ dữ liệu" rồi mới tiến bộ | Lê Quang Huy → Reading |
| 12 | Phương án bị thay, kết quả thất bại cũ **vẫn còn** | Lê Quang Huy → Writing Task 2 · Lý Tuấn Bình → Listening |
| 12b | Đã report gia đình mà vi phạm **vẫn tái diễn** | Đặng Thu Vân — Report 19/08, vi phạm mới 06/09 |
| 13 | Case bàn giao khi chuyển lớp · em chưa xếp lớp tiếp | Nguyễn Minh An · lớp đã hết chương trình |
| 14 | Báo cáo kỳ họp đủ bốn tình trạng | Tiến trình → Tình hình đơn vị (có ô "Chưa báo cáo") |

*(Tình huống 10 cũ — "đợt Ý thức gộp trong cửa sổ bốn ngày" — đã bỏ cùng mô hình Case Ý thức.)*

---

## 8. Quy mô bộ demo

| | |
|---|---|
| Chi nhánh | 5 — Monbay · Bãi Cháy · Cẩm Phả · Hải Dương · Uông Bí |
| Lớp | 13, trong đó 2 lớp **đã kết thúc** (giữ để tra lịch sử J01) |
| Chương trình | Foundation · Beginner · Elementary · Fast Track |
| Học viên | 41 — 40 đang học, 1 đã kết thúc học |
| Người dùng | 16 — 1 Quản trị hệ thống · 5 Quản lý · 10 giáo viên (**2 người dạy ở hai chi nhánh**) |
| Lượt đánh giá | 115 |
| Tín hiệu từ điểm | 112 (2 chờ xác minh) |
| Case · Phương án | 33 · 37 |
| **Vi phạm · Biện pháp xử lý** | **35** (2 không chính xác) · **14** (12 đã thực hiện, 2 đang chuẩn bị) |
| Công việc quản lý | 14 (gồm 4 việc con) |
| Lịch sử | Từ 12/2025 |

```bash
npm run seed      # dựng lại từ đầu — XOÁ hết dữ liệu demo đang có
npm run dev       # chạy thử ở http://localhost:5173
npm test          # phép kiểm nghiệp vụ
```

`npm run seed` chạy lại bao nhiêu lần cũng cho ra **đúng một bộ dữ liệu**. Nó chỉ đụng vào `data/pisa-demo.sqlite`. Muốn
sửa một câu chuyện học thuật: `server/src/seed/students.ts`; câu chuyện Ý thức: `server/src/seed/yThucSeed.ts`; rồi `npm run seed`.

---

# Phần B — Những điều đã chốt, và những điều còn treo

Chỉ ghi thứ **thực sự thay đổi cách phần mềm chạy**. Thứ tự ưu tiên khi hai nguồn nói khác nhau: **lời owner mới nhất** →
`thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` (cho Ý thức) → `vong4/01_CHOT_NGHIEP_VU.md` → `PISA_Claude_Prompt.md` →
`PISA_Design_Master_Reference.md` → mã đang chạy.

## B1. Cách chấm và kết luận

| | |
|---|---|
| **Writing** | Bốn tiêu chí. W1 và W2 là **hai ô nhập riêng**; band Writing = `(W1 + W2×2) / 3`, làm tròn 0.5 |
| **Kỳ vọng của một lượt** | `mục tiêu − 1.0` ở MT1, `− 0.5` ở MT2, `− 0` từ MT3 |
| **Mức SOS** | Số **kỹ năng có band** dưới kỳ vọng: 1 → SOS 1, 2 → SOS 2, từ 3 → SOS 3. Đếm trên **bốn** kỹ năng (Writing gộp) |
| **SOS là tình trạng HIỆN TẠI** | Mức ở **lượt MT mới nhất** em đã làm, không cộng dồn; tổng ba cột SOS không vượt sĩ số. Một chỗ tính duy nhất: `server/src/students/standing.ts` |
| **SOS lấy từ KẾT QUẢ BÀI, không từ case** | Đóng case **không** đổi mức SOS; MT mới đạt **không** tự đóng case; case của lộ trình trước **không** thành SOS của lộ trình mới |
| **Thiếu điểm ≠ trượt** | Kết luận trên phần điểm đang có; ô chưa chấm không bị đếm là dưới kỳ vọng |
| **Kỹ năng không mock** | Kỹ năng đó rời mẫu số và lượt **không còn Overall** |
| **Lớp Normal** | `số câu đúng / tổng`, đạt từ **70%** trên tỷ lệ thật; không band, không kỳ vọng, không Overall |

## B2. Tuần và hạn

| | |
|---|---|
| **Tuần** | Thứ Hai → Chủ nhật; thuộc **tháng chứa thứ Năm** của tuần đó |
| **Lịch MT mặc định lớp FT** | Sinh từ **tuần bắt đầu học** của từng em: tuần **6 · 12 · 16 · 20 · 24**. Hệ thống chỉ đề xuất, người bấm áp |
| **Mốc lớp Normal** | Theo tuần học của LỚP: FOU tuần 4 và 8; BE/ELE tuần 5 và 10 |
| **Hạn nhập điểm** | Lớp FT: thứ Tư tuần kế tiếp. Lớp Normal: hết Chủ nhật của chính tuần đó. Chưa có tuần thì không có hạn |
| **Hạn một chu kỳ xử lý case học thuật** | **Chủ nhật của tuần thứ hai**, tính tuần case xuất hiện là tuần thứ nhất (case mở 14/09/2026 → hạn 27/09) |
| **Phương án cần duyệt** | Chu kỳ bắt đầu **khi được duyệt**, không phải khi gửi |
| **Chu kỳ tiếp theo** | Hạn cũ và cập nhật trễ **giữ nguyên** trong lịch sử — không reset để che quá hạn |
| **Ý thức** | **Không có hạn.** Duy nhất một mốc: cảnh báo khi vi phạm chưa xử lý quá **5 ngày** (`CANH_BAO_NGAY`) |

## B3. Case học thuật

| | |
|---|---|
| **Một case** | = một học viên × một hạng mục. **Năm** hạng mục: `L · R · W1 · W2 · S` (Ý thức không còn là hạng mục) |
| **Case còn mở, trượt lại** | Giữ nguyên case, thêm mốc tái diễn và mở chu kỳ tiếp |
| **Case đã chốt, tái phát** | Mở case **MỚI** nối vào case cũ bằng `previous_case_id`; case cũ giữ trạng thái đã đóng |
| **Nhiều case cùng hạng mục** | Được, khi người tạo chọn **mở case riêng** (cờ `parallel`, không dùng khoá chống trùng) |
| **Mức 0 là mức hợp lệ** | Chấm lại bài cũ thành đạt thì case hạ về 0 kèm mốc "đã đạt lại", không xoá |
| **Case GV báo** | `sos_level` để **trống**; mức gấp là thang riêng (*Cần chú ý · Gấp*) |
| **Quy tắc Writing** | W1, W2 so riêng từng task; nhưng nếu band Writing **gộp** đã đạt thì không có case nào ở W1 lẫn W2 |
| **Người phụ trách** | Mỗi case một người phụ trách chính; mỗi phương án một người thực hiện. Chưa có thì hiện "Chưa có người phụ trách" và đó là một việc cần làm |
| **Chốt kết quả case** | Chỉ chốt được khi mọi phương án đã khép lại và case **có ít nhất một phương án**. Bốn mức: *tốt hơn hẳn · có tiến bộ · chưa chuyển biến · tệ hơn* |
| **Điểm giáo viên tự chấm** | Tuỳ chọn khi cập nhật kết quả; lưu riêng, không ghi đè điểm chính thức, không đổi mức SOS |
| **C02** | GVCN **không** xử lý case học thuật trái môn. **Không áp cho Ý thức** — GVCN xử lý Ý thức cả lớp |

## B4. Khi có SOS, hệ thống sinh gì

**Mock Test Fast Track (rulebook v3, 21/09/2026 tối):** mỗi kỹ năng trượt được *tự tạo hoặc tự gắn* một case, kèm phương án điền sẵn chờ GVBM xác nhận, và một lượt *Phối hợp SOS* cho GVCN — xem mục 9. **Lớp Normal:** chỉ **tín hiệu** (mục 3 ở trên). *Từ 21/09/2026* không còn tự sinh case Ý thức, không còn hai việc trao đổi tự sinh, không còn
tự sinh phương án xếp tự học / tutor. Người xác minh quyết định.

## B5. Phương án, đề xuất và duyệt

| Phương án hỗ trợ *(giáo viên tự làm)* | Đề xuất *(Quản lý luôn phải trả lời)* |
|---|---|
| Xếp tự học · Học tutor · Điều chỉnh cách dạy · Tăng cường bài tập | Lùi lịch thi · Hỗ trợ học thuật ngoài định mức · Meeting CX/GĐCN · Khác |

Chọn một mục ở cột phải **tức là** xin ý kiến. Đang chờ duyệt thì chưa cập nhật kết quả được. Quản lý: **duyệt** · **không
duyệt** (bắt buộc lý do) · **góp ý** (không kết thúc việc chờ). Đã trả lời thì không sửa đè — đổi ý thì đề xuất lại.

**Cập nhật kết quả** là một nút duy nhất, hỏi ba câu: kết quả, ghi chú, bước tiếp theo.

| Kết quả | Bước tiếp theo được phép |
|---|---|
| Tiến bộ rõ rệt · Tiến bộ một phần | Hoàn thành phương án · Theo dõi thêm |
| Chưa thay đổi · Kém hơn · Không đủ căn cứ | **Bắt buộc** chọn: Tiếp tục phương án cũ · Đề xuất phương án mới · Xin hỗ trợ từ Quản lý |

Đề xuất phương án mới → phương án cũ khép "Được thay thế", không tính thành công.

## B6. Ý thức — luật đã chốt 21/09/2026

Nguồn đầy đủ: `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. Mã luật V01–V14 (vi phạm), B01–B16 (biện pháp), W01–W06 (cảnh báo).

| | |
|---|---|
| **Vi phạm** | Năm nhóm: BTVN · Chuyên cần · Thái độ / hành vi · Kỷ luật lớp học · Khác. Mô tả bắt buộc (≥ 10 ký tự; nhóm Khác ≥ 30). Môn tự điền theo phân công của người ghi, sửa được, bỏ trống được |
| **Ai ghi** | Giáo viên có phân công ở lớp của em (`violation.record`). Ghi hai lần cùng em, cùng nhóm, cùng ngày → **cảnh báo mềm**, vẫn ghi được |
| **Hủy vi phạm** | "Đánh dấu không chính xác" kèm lý do; không xóa. Đứng ngoài mọi thống kê Ý thức |
| **Biện pháp** | **Chín loại**: GV trao đổi ngắn · GV meeting với HS · Report cho gia đình · Thư cảnh cáo lần 1 · CX / GĐCN meeting · Thư cảnh cáo lần 2 · Đình chỉ học · Thư cảnh cáo lần 3 · Khác. Hai trạng thái *Đang chuẩn bị → Đã thực hiện*. **Không có bước duyệt** (Y01): GVCN tự xác nhận mọi loại; Quản lý nhận **thông báo** khi Thư cảnh cáo hoặc Đình chỉ được xác nhận |
| **Một biện pháp một học viên** | Nhưng gom nhiều vi phạm; một vi phạm nằm trong nhiều biện pháp (nhiều–nhiều) |
| **Chuỗi Thư cảnh cáo** | 1 → 2 → 3 bắt buộc, kiểm ở **máy chủ**, phạm vi **theo lộ trình** (Y02): chuyển lộ trình thì chuỗi reset |
| **Ảnh chụp** | `violation_count_at_confirm` ghi số vi phạm lúc xác nhận và **không bao giờ đếm lại** |
| **Quyền** | Xem: như xem học viên. Tạo/xác nhận/xóa biện pháp: **GVCN của lớp** (không phải GVBM), Quản lý và Quản trị theo phạm vi. Thống kê Ý thức: Quản lý và Quản trị |
| **Tám chỉ số** | vi phạm tổng · chưa xử lý · không hiệu lực · học viên có vi phạm · học viên cần xử lý · biện pháp đã thực hiện · đang chuẩn bị · theo loại. Mỗi chỉ số **một hàm trả tập ID** |

## B7. Đơn vị đếm

Sáu đơn vị **không bao giờ** được trộn, và mỗi bảng phải nói rõ mình đếm cái nào: **Học viên** · **Lượt Test/MT** · **Case** ·
**Phương án** · **Lần cập nhật** · **Nhóm công việc**. Riêng Ý thức thêm ba đơn vị: **Vi phạm** · **Học viên có vi phạm** · **Biện pháp**.

- **Quá hạn** là thuộc tính của một việc, không phải một bản ghi việc bổ sung.
- Bảng theo tuần có **sáu cột kết luận loại trừ nhau** cộng đúng bằng số lượt: *Đạt · SOS 1 · SOS 2 · SOS 3 · Tạm thời · Chưa đủ điểm*.
- **"Được phép sửa" khác "đây là việc của tôi".** Quản trị và Quản lý sửa được điểm để gỡ sự cố, nhưng việc **nhập điểm** chỉ thuộc người được phân công.
- Mọi bảng tổng hợp chỉ đếm **trong phạm vi người đang xem**.

## B8. Công việc quản lý

Bảng **Tiến độ công việc** chỉ Quản trị và Quản lý thấy. Một định danh xuyên nhiều tuần; bốn nhóm (Học sinh / Phụ huynh ·
Giáo trình · Giáo viên · Tutor); năm trạng thái (Chưa bắt đầu · Tiếp tục xử lý · Đã hoàn thành · Tạm ngưng · Dừng hẳn). Tạm
ngưng và Dừng hẳn **bắt buộc lý do**. Việc con **một tầng**; không đóng việc cha khi còn việc con chưa khép. Mỗi lần cập nhật
là một dòng lịch sử. Gắn case làm căn cứ **không** tự tạo phương án hay đóng case.

## B9. Vai trò và quyền

| | Quản trị HT | Quản lý | Giáo viên |
|---|:--:|:--:|:--:|
| Chốt **tuần** của một lượt MT | ✓ | ✓ | — |
| Nhập điểm | nhập bù | — | ✓ đúng kỹ năng được phân công |
| Xem danh sách case | ✓ | ✓ | ✓ |
| Duyệt phương án | ✓ | ✓ | — |
| Ghi vi phạm | ✓ | ✓ | ✓ có phân công ở lớp |
| Tạo / xác nhận biện pháp | ✓ | ✓ | GVCN của lớp |
| Thống kê Ý thức cả chi nhánh | ✓ | ✓ | — |
| Phân công giáo viên · sửa tiến độ lớp | ✓ | ✓ | — |
| Tạo tài khoản, cấp vai, sửa danh mục | ✓ | — | — |

Vai **Admin chi nhánh đã bỏ**: dòng vai còn trong bảng ở trạng thái đã bỏ để đọc lịch sử, không cấp mới được. Phạm vi luôn là
**quyền của vai × chi nhánh của chính grant đó × phân công lớp/kỹ năng**; chỉ grant có `branch_id` để trống mới là toàn hệ
thống. **Bỏ phân công không phải là xoá**: dòng cũ đóng theo ngày, báo cáo cũ vẫn đúng ai dạy lúc đó.

## B10. Phân công giáo viên, tài khoản

- **Mỗi kỹ năng đúng một giáo viên**; một giáo viên dạy được nhiều kỹ năng. **Mỗi lớp đúng một GVCN**, và GVCN **phải dạy ít nhất một kỹ năng ở chính lớp đó**.
- Đăng nhập **email + mật khẩu** (scrypt, muối riêng). **Chỉ email đuôi `.pisa@gmail.com`**, kiểm ở máy chủ. Không gửi email thật, không có luồng quên mật khẩu — Quản trị đặt lại hộ.
- GV tự đăng ký khai chi nhánh → vào hàng đợi; chưa duyệt thì chưa có vai. Từ chối bắt buộc ghi lý do.
- Một người mang được nhiều vai ở nhiều chi nhánh: Quản lý **được** giảng dạy.
- **Lộ trình và loại lớp là dữ liệu**; **không có nút xoá** — chỉ ngừng dùng.

## B11. Còn treo — cần bạn quyết khi có dịp

| Điểm | Đang làm tạm | Vì sao cần chốt |
|---|---|---|
| **Phạm vi hạn nhập điểm riêng** | Áp cho cả lượt; đổi lịch thì giữ hạn riêng | Nguồn chỉ nói "được đặt deadline khác" |
| **Speaking ngoài tuần kế hoạch** | Từ chối; muốn xếp ngoài tuần thì Quản lý đổi tuần trước | Tránh âm thầm đổi tuần |
| **Dòng nhập hàng loạt ngoài phạm vi** | Bỏ qua dòng kèm lý do, không làm hỏng cả lô | Nếu muốn chặt hơn thì nói |
| **Lộ trình khi bảng nhập bỏ trống** | Kế thừa lộ trình của lớp | Sai nếu lớp có học viên nhiều lộ trình |
| **Lưu trữ học viên** | 14 ngày từ `finished_at`; chỉ ẩn khỏi danh sách | Mốc chính xác và quyền khôi phục |
| **Kỹ năng không mock ở mức task** | Bỏ Writing là bỏ cả W1 và W2 | Nếu chỉ cần mock một task thì cần quy tắc tính W riêng |
| **Tab Báo cáo tuần** | Bỏ tạm; chức năng giao việc cho GV giữ ở Thực trạng | Khi cần lại thì mở, mã và dữ liệu còn |
| **Báo cáo "đúng trạng thái cuối tuần trước"** | Không làm; tuần cũ ghi rõ "tình trạng hiện tại" | Cần lưu lịch sử trạng thái từng ngày |
| **Cột "Trễ chấm TB"** | Bỏ; hệ thống chỉ biết tuần kế hoạch, không biết ngày làm bài | Muốn có lại phải khai ngày làm bài |
| **Ngày sinh học viên** | Lưu và sửa được, không còn lên badge "Thiếu thông tin" | — |
| **Giao diện Ý thức** | **PR-K** — bản này mới có dữ liệu, luật, quyền và API | Chưa có màn ghi vi phạm / tạo biện pháp cho người dùng cuối |
