# Pisa Tracking — bản demo: xem gì, ở đâu, và những điều đã chốt

Một tệp duy nhất thay cho hai tệp demo cũ (kịch bản xem và giả định đã chốt). Viết lại ngày **21/09/2026** khi mô hình
**Ý thức** đổi từ "Case Ý thức" sang **Vi phạm và Biện pháp xử lý**; mục 1 viết lại **29/09/2026** theo Ý thức v4 (PR-YT4).

Bản demo **không phải dữ liệu ngẫu nhiên**. Mỗi học viên có một câu chuyện riêng, dựng theo chiều của đời thật:

> Ghi danh → Chương trình → Bài kiểm tra → Vấn đề → Phương án → Cập nhật kết quả → Chuyển tiếp
> và, song song, **Vi phạm → Ghi nhận / Xác nhận xử lý** cho phần Ý thức.

**Ngày demo: 14/09/2026** (thứ Hai, tuần W3 SEP). Mọi thứ tính theo ngày này, không theo ngày thật của máy. Không dòng dữ
liệu nào nằm sau ngày đó — bộ dựng từ chối chạy nếu có. Toàn bộ tên người là **tên giả**. Mật khẩu mọi tài khoản demo ghi ở
màn đăng nhập.

| Muốn mở bằng tư cách | Email |
|---|---|
| Quản trị hệ thống | `dovutuanphong95.pisa@gmail.com` |
| Quản lý Monbay · Bãi Cháy · Cẩm Phả · Hải Dương · Uông Bí | `vy.nguyen` · `dang.tran` · `mai.le` · `anh.pham` · `binh.hoang` + `.pisa@gmail.com` |
| Giáo viên (ví dụ GVCN MB-FT 101) | `ha.tran.pisa@gmail.com` · các cô thầy khác cùng dạng `<tên>.<họ>.pisa@gmail.com` |

---

## 1. Ý thức v4 — Ghi nhận / Xác nhận xử lý, thang bắt buộc (PR-YT4, 29/09/2026)

Một **Vi phạm** do giáo viên ghi (**+ Ghi vi phạm**). GVCN lớp **đang học** đóng từng vi phạm bằng **Ghi nhận** (đã xem, không
cần xử lý — vẫn đếm) hoặc **Xác nhận xử lý** (một lần xử lý theo **thang**: Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN
→ WL 2 → WL 3). **3 vi phạm trong tuần này + tuần trước** → bắt buộc xử lý trong **5 ngày** tính từ ngày ghi lên web (không còn nút
Ghi nhận). WL 3, Meeting CX/GĐCN, Đình chỉ, Khác → **Đề xuất QL duyệt** (có bằng chứng; QL trả lời trong 5 ngày; duyệt xong GVCN ghi
**Đã thực hiện** trong 5 ngày). Em bị xử lý trước khi dùng web: **Khai bậc** một lần ở dòng thang. Nhãn của vi phạm suy ra từ một
hàm (`trangThaiYThuc`): *Mới · Đã ghi nhận · Cần xử lý · Quá hạn n ngày · Chờ QL duyệt · Đã xử lý · {bậc}*. Quá hạn → thẻ
**Báo lên Ý thức** ở hộp Chờ duyệt của QL.

Bộ demo nằm ở `server/src/seed/yThucSeed.ts` (dựng sau khi đặt ngày demo, đề xuất QL duyệt đi qua chính hàm dịch vụ). Phép kiểm
**PR-J · 0** trong `server/src/tests/yThuc.tests.ts` soi từng dòng dưới đây. Lớp **MB FT 101** (GVCN cô Hà), trừ khi ghi khác:

| # | Học viên | Tình huống | Cần thấy |
|---|---|---|---|
| a | **Trần Thu Hà** | 2 vi phạm của GVBM, cô Hà đã Ghi nhận | `✓ Đã ghi nhận · vẫn tính`, không việc |
| b | **Lê Quang Huy** | 3 vi phạm 08–10/09, cùng ghi 10/09 | `Cần xử lý`, hạn 14/09 (còn 1 ngày), nút `Xác nhận xử lý · Report 1` |
| c | **Phạm Bảo Ngọc** | Report 1 tháng 8; 3 vi phạm ghi 07–09/09 | `Quá hạn 1 ngày`, thẻ Báo lên |
| d | **Vũ Hải Đăng** | 1 vi phạm cô Trang ghi 04/09, chưa ai xem | `Quá hạn 6 ngày` (chưa xem), thẻ Báo lên |
| e | **Nguyễn Minh An** | Report 1 → Report 2 → WL 1 (có tệp) + 1 vi phạm Mới | bậc kế `Report 4 + Meeting CX/GĐCN`; nhóm *Mới* |
| f | **Lương Gia Bảo** | khai bậc 5 (WL 2) + 3 vi phạm → đề xuất WL 3 | nhóm *Chờ QL duyệt*; thẻ Ý thức có bằng chứng, hạn 15/09 |
| g | **Kiều Minh Đức** | đề xuất Đình chỉ bị QL từ chối 12/09 | vi phạm về `Cần xử lý`, hạn 16/09; lý do từ chối ở dòng thời gian |
| i | **Tô Ngọc Hân** | HS cũ khai "bậc 2" (H5) | thang: Report 1, Report 2 `khai`; nút `Xác nhận xử lý · WL 1` |
| j | **Quách Thành Nam** | 3 vi phạm 31/08–02/09 rồi **chuyển sang MB FT 102** ngày 12/09 (D15) | ở lớp mới vẫn `Cần xử lý` (dính), hạn đặt lại 16/09 (M-08) |
| k | **Mạc Tuấn Kiệt** | khai WL 1 → Report 4 + Meeting → WL 2 (có tệp) + 1 vi phạm Mới | bậc kế `WL 3 · cần QL` → panel mở thẳng Đề xuất |
| l | **Nguyễn Bảo Trâm** (HD BE 21) | lớp thường FOU → BE, Report 1 ở khoá FOU | cùng một chuỗi thang → bậc kế `Report 2` |
| m | **Hà Phương Linh** | Report 1; Meeting CX/GĐCN QL duyệt 04/09, Đã thực hiện 08/09 | `Đã xử lý · Meeting CX/GĐCN`, bậc giữ Report 1 (M-11) |

Thêm: **Đặng Thu Vân** (BC FT 205) — Report 1 do Quản lý Bãi Cháy **nhập hộ** việc thầy Quân đã gọi; một vi phạm Mới của cô Hân quá
hạn → thẻ Báo lên ở chi nhánh BC. **Ngô Hải Yến** (CP FT 110) — vi phạm thầy Nam (GVCN) tự ghi là *Đã ghi nhận* (Q5). **Trần Hải Kiên**
(HD BE 21 → HD FT 302) — Report 1, 2 ở lớp BE; sang FT là chuỗi thang mới (bậc kế lại là Report 1). **Đỗ Minh Khôi** (bộ SOS v3) —
hai vi phạm GVCN tự ghi, *Đã ghi nhận*. Một vi phạm của Trần Thu Hà đã **xoá** — chỉ còn một dòng `audit_logs`.

Tài khoản nên mở: **cô Hà** (GVCN, id 7) — tab Ý thức & Phối hợp của MB FT 101: khung trái *Quá hạn* (Ngọc, Đăng) › *Bắt buộc*
(Huy, Đức) › *Chờ QL duyệt* (Bảo) › *Mới* (An, Kiệt) › *Đã xử lý 7 ngày* (Linh). **QL Vy** (id 2) — Công việc › Chờ duyệt: chip Ý thức
(đề xuất WL 3 của Bảo) + Báo lên (Ngọc, Đăng). **Cô Linh** (GVCN MB FT 102) — Quách Thành Nam ở nhóm *Bắt buộc*.

Ba điều dễ nhầm, đã chốt:

- **Đã ghi nhận vẫn đếm** vào luật 3 vi phạm / 2 tuần (V4-6); Ghi nhận chỉ tắt việc "xem vi phạm mới".
- **Hạn tính từ ngày ghi lên web** (Câu 2 = A) — ghi muộn một vi phạm cũ không làm GVCN quá hạn ngay.
- **Vấn đề Ý thức đi theo học viên sang lớp mới**: vi phạm chưa xử lý vẫn hiện ở lớp mới, hạn đặt lại từ ngày chuyển, chỉ GVCN lớp
  đang học xử lý được (K5-34).
- **Điểm thấp không sinh vi phạm** — Ý thức chỉ do giáo viên ghi.

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
| **J01** | Nguyễn Minh An · MB-FT 101 | Ba chương trình nối nhau. Case Reading lớp Beginner còn mở → **case bàn giao**, không tính thành SOS lớp Fast Track. Ý thức: mục 1 (e). |
| **J02** | Trần Thu Hà · MB-FT 101 | MT1 SOS 2 → MT2 SOS 1. Reading hết case; Speaking còn một case chu kỳ hai. Ý thức: mục 1 (a). |
| **J03** | Lê Quang Huy · MB-FT 101 | **Hồ sơ dày nhất** — mục 5. Ý thức: mục 1 (b). |
| **J04** | Hồ Thanh Tùng · CP-FT 110 | Hai case Reading: một đã chốt (MT1), một mở (MT3) nối vào cái cũ, có mốc "tái phát". |
| **J05** | Đinh Ngọc Quyên · CP-FT 110 | **Hai case song song** cùng hạng mục Writing Task 2 (bố cục · vốn từ), mỗi case phương án riêng. |
| **J06** | Lý Tuấn Bình · CP-FT 110 | Phương án 1 "Được thay thế" sau "Chưa thay đổi"; phương án 2 "Tiến bộ rõ rệt". |
| **J07** | Phan Minh Tú · BC-FT 205 | Đề xuất **bị từ chối** kèm lý do; **được duyệt** (chu kỳ chạy từ ngày duyệt); **đang chờ**, quá hạn trả lời. Mở bằng Quản lý Bãi Cháy. |
| **J08** | Phạm Bảo Ngọc · MB-FT 101 | MT3 tuần này mới 2/4 kỹ năng → kết luận **tạm thời**; điểm MT2 không lấp vào ô trống. Cũng là ví dụ **tách tuần** (mục 4). Ý thức: mục 1 (c). |
| **J09** | Trần Hải Kiên · HD-FT 302 | Lộ trình mới, chưa có MT → không có SOS; case Speaking từ Beginner cũ theo em như việc bàn giao. Ý thức: chuỗi thang mới khi sang FT (mục 1). |
| **J10** | Phạm Gia Hân · HD-BE 21 | Chuyển lớp giữa chừng khi case còn mở; chu kỳ 1 cô Yến, chu kỳ 2 thầy Dũng. |
| **J11** | Đặng Thu Vân · BC-FT 205 | Học thuật chưa có case. Ý thức: Report 1 do Quản lý nhập hộ, rồi một vi phạm Mới quá hạn → thẻ Báo lên. |
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

## 9. SOS tự tạo case và Phối hợp SOS — SOS v4 (chỉ máy dev)

Học viên MỚI ở `MB-FT 101`, dựng bằng chính các hàm nghiệp vụ (`server/src/seed/sosV3Seed.ts`): nhập điểm Mock Test → máy tự tạo case,
**PA theo quy chế chờ xác nhận** và việc phối hợp; rồi GVBM/GVCN/Quản lý thao tác (Xác nhận Case, Xác nhận PA, Không cần theo dõi, duyệt / từ chối).

**D7 — Case SOS đủ trạng thái v4**

| Trạng thái | Học viên · kỹ năng | Bạn sẽ thấy |
|---|---|---|
| (1) Chờ xác nhận nguyên nhân, còn hạn | **Vũ Ngọc Lan** · Listening | Hai nút `Xác nhận nguyên nhân` / `Không cần theo dõi…` · hạn 16/09 |
| (2) Chờ nguyên nhân **quá hạn** | **Đỗ Minh Khôi** · Writing Task 2 | Thẻ **Báo lên** ở hộp Chờ duyệt của Quản lý |
| (3) Chờ Quản lý duyệt · không theo dõi | **Vũ Ngọc Lan** · Reading | Thẻ Học thuật `Không cần theo dõi` chờ Quản lý |
| (4) Quản lý từ chối → hạn mới 3 ngày | **Trịnh Gia Bảo** · Listening | Lịch sử có `Quản lý từ chối không theo dõi` + lý do |
| (5) Đã huỷ · không cần theo dõi | **Vũ Ngọc Lan** · Speaking | Case đóng, PA quy chế huỷ (không tính thất bại) |
| (6) Đang làm, PA quy chế đã xác nhận | **Đỗ Minh Khôi** · Speaking | PA `từ 07/09`, hạn ghi kết quả hết T2 **đúng ngày demo** (D8) |
| (7) Đã xác nhận Case, PA còn chờ | **Bùi Thảo Vy** · Speaking | Hàng PA `Chờ xác nhận` + nút `Xác nhận PA`; Phối hợp 2/2 hoàn thành |

**D8 — hạn PA:** Khôi · Speaking hạn hết T2 đúng ngày demo · **Lý Minh Châu** · Reading quá hạn 2 ngày · **Hoàng Bảo Ngọc** · Listening ở
tuần mốc → `Ghi kết quả cuối` (GVCN Hà). Không còn Case đóng kiểu cũ "GVBM tự đóng không cần theo dõi".

Ba mức SOS khác nhau (1 · 2 · 3) đều có mặt. Bộ demo Ý thức (mục 1) dùng *xoá thẳng*: vi phạm đã xoá (Trần Thu Hà) chỉ còn dấu vết ở `audit_logs`.

## 9b. PR-KCK — Target "không cam kết" (chỉ máy dev)

Hai em mới ở **MB FT 101**, thêm qua chính luồng Thêm học viên (`buildKckDemo` trong `server/src/seed/sosV3Seed.ts`). Ô Target gõ `KCK`,
`kck`, `-`, `không cam kết` đều hiểu là **KCK**; ô trống vẫn là "chưa có target".

| Học viên | Target | Bạn sẽ thấy |
|---|---|---|
| **Hồ Gia Hân** | `KCK` | MT1 (2 tuần trước) L R S = 5.0 — dưới mọi band FT mà **không** Case, **không** PA quy chế, **không** Phối hợp SOS. Cột Target hiện `KCK` (rê chuột: "Không cam kết đầu ra — không tính SOS"), kỳ vọng `—`, điểm không tô màu SOS |
| **Lê Minh Đức** | `-` | Chưa có điểm. **Không** có việc "Điền target" ở Việc cần làm của GVCN, không nhãn "Thiếu thông tin · target" |

Đổi target ↔ KCK (Quản lý: Lộ trình › Đổi mục tiêu › `Không cam kết (KCK)`; GVCN: Đề xuất sửa › Target › `Không cam kết (KCK)`): MT chưa có
điểm theo target mới (KCK = bỏ kỳ vọng), MT đã có điểm và Case SOS đang mở giữ nguyên. Bảng Tổng hợp và báo cáo tuần không tính lượt của
em KCK vào "Lượt MT".

## 10. PR-MT — lịch MT tự tạo, MT lịch sử, lớp RF, dời do vắng (chỉ máy dev)

Dựng bằng chính các hàm nghiệp vụ (`server/src/seed/prMtSeed.ts`), sau ngày demo 14/09/2026. Tài khoản gợi ý: **Quản lý Nguyễn Khánh Vy**,
**GVCN Trần Ngọc Hà**.

| Kịch bản | Học viên | Bạn sẽ thấy |
|---|---|---|
| D1 · lớp RF | **Phan Gia Hân** (MB FT RF 12) | Mới vào: MT1 W2 OCT (tuần học 4), MT2 W1 NOV (tuần học 8) |
| D1 · RF có SOS | **Đặng Quốc Bảo** (MB FT RF 12) | MT1 kỳ vọng **= target 6.5** (không trừ); L R 6.0 → SOS 2 → PA quy chế `Tutor · đến lúc thi`, Phối hợp theo hàng MT4 |
| D2/D3 · HS cũ | **Lê Minh Khang** (MB FT 101) | Thêm hôm nay, bắt đầu 17 tuần trước: MT1–MT3 nhãn `lịch sử`. MT2 đã nhập SOS 2 — **không** Case (ngoài 4 tuần). MT3 (2 tuần trước) chưa nhập — GVCN Hà nhập thử ở Lịch Test (dòng nhắc cuối trang) → ra Case |
| D4 · dữ liệu cũ | **Trần Hữu Phúc** (MB FT 101) | Em FT không có lượt nào — dòng (2) của `npm run chay-thu:mt` |
| D5 · máy tự dời | **Hồ Ngọc Diệp** | "-" cả bốn kỹ năng tuần trước → chốt sáng thứ Hai → máy dời sang tuần này (vắng lần 1); chuông GVCN + GVBM "Đã tự dời …" |
| D5 · chờ duyệt lần 2 | **Ngô Bảo Châu** | Listening vắng lần 2 → đề nghị chờ Quản lý, hạn hết CN 20/09, tuần đích W4 SEP; Lịch Test hàng lớp `vắng · chờ Quản lý duyệt dời` |
| D5 · đã duyệt | **Lý Thanh Tâm** | Đề nghị lần 2 đã được Quản lý duyệt → Listening sang W4 SEP, đã dời 2 lần |
| D5 · hết hạn | **Võ Minh Triết** | Đề nghị gửi thứ Tư tuần trước, hạn hết CN 13/09 không ai trả lời → Listening bị huỷ phần thi |
| D6 · huỷ lượt | **Phạm Khánh Linh** | MT3 "Huỷ cả lượt", MT2 huỷ rồi **tạo lại cùng số** (cùng dòng); Kế hoạch Test chỉ ô MT kế tiếp có "+ xếp" |
| D16 · LT1 → RF | **Đinh Gia Huy** | Từ MB FT 101 sang MB FT RF 12: lộ trình RF mới có MT1/MT2; Case Listening đi theo (mốc "Sang lộ trình mới") |

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

Phần **Ý thức** của em nằm ở mục 1 (b): ba vi phạm bắt buộc xử lý, hạn hôm nay.

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
| 12b | Đã Report 1 mà vi phạm **vẫn tái diễn** | Đặng Thu Vân — Report 1 13/08, vi phạm mới 06/09 |
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
| **Vi phạm · Lần xử lý Ý thức** | **58** (1 đã xoá, có audit) · **14** (11 theo thang, 3 đề xuất QL duyệt) · 3 khai bậc |
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
| **Ý thức** | Hạn **5 ngày** (`HAN_Y_THUC_NGAY`) tính từ ngày ghi lên web: vi phạm Mới chưa Ghi nhận, vi phạm bắt buộc chưa xử lý, đề xuất QL đã duyệt chưa "Đã thực hiện". Quá hạn → thẻ Báo lên (loại hạn `xu-ly-vi-pham`) |

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

## B6. Ý thức — luật v4 (PR-YT4, chốt 27–29/09/2026)

Nguồn đầy đủ: đặc tả `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §5.4–§5.8 (mã V4-1…V4-12). Luật thuần ở
`shared/domain/yThuc.ts`, một cửa trạng thái ở `server/src/yThuc/trangThai.ts`. `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` là bản v3 (lịch sử).

| | |
|---|---|
| **Vi phạm** | Năm nhóm: BTVN · Chuyên cần · Thái độ / hành vi · Kỷ luật lớp học · Khác. Mô tả ≥ 10 ký tự; nhóm Khác cần ô Ghi rõ. Nút **+ Ghi vi phạm**, không chọn sẵn nhóm. Ghi sai thì sửa hoặc xoá thẳng (một dòng audit) |
| **Ai ghi** | Giáo viên có phân công ở lớp của em. GVCN lớp tự ghi → tự *Đã ghi nhận* (Q5) |
| **Sáu nhãn** | *Mới · Đã ghi nhận · Cần xử lý · Quá hạn n ngày · Chờ QL duyệt (hoặc Đã duyệt · chờ thực hiện) · Đã xử lý · {bậc}* — một hàm quyết, không lưu |
| **Bắt buộc** | 3 vi phạm chưa xử lý trong tuần này + tuần trước (Đã ghi nhận vẫn đếm) → Cần xử lý, hạn 5 ngày từ ngày ghi lên web; quá hạn → thẻ Báo lên |
| **Thang** | Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN → WL 2 → WL 3. Bậc do **máy chủ** quyết (panel cũ → 409). FT: một thang mỗi lộ trình; lớp thường: một thang cho cả chuỗi khoá liền nhau |
| **Cần QL duyệt** | WL 3 · Meeting CX/GĐCN · Đình chỉ · Khác → Đề xuất có bằng chứng; QL trả lời trong 5 ngày; từ chối → vi phạm về Cần xử lý; duyệt → GVCN ghi *Đã thực hiện* trong 5 ngày |
| **Khai bậc** | Em bị xử lý trước khi dùng web: GVCN khai một lần (Report 1 … WL 2) khi chuỗi chưa có lần xử lý nào; chỉ QL sửa |
| **Quyền** | Ghi nhận / Xác nhận xử lý / Đề xuất / Khai bậc: **GVCN lớp đang học** (không phải GVBM), Quản lý và Quản trị theo phạm vi. QL duyệt ở hộp Chờ duyệt |
| **Chỉ số** | vi phạm tổng · cần xử lý · theo nhóm · học viên có vi phạm · học viên cần xử lý · lần xử lý đã xong · chờ duyệt · theo loại · học viên theo bậc. Mỗi chỉ số **một hàm trả tập ID** |

## B7. Đơn vị đếm

Sáu đơn vị **không bao giờ** được trộn, và mỗi bảng phải nói rõ mình đếm cái nào: **Học viên** · **Lượt Test/MT** · **Case** ·
**Phương án** · **Lần cập nhật** · **Nhóm công việc**. Riêng Ý thức thêm ba đơn vị: **Vi phạm** · **Học viên có vi phạm** · **Lần xử lý**.

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
| Ghi nhận · Xác nhận xử lý · Khai bậc | ✓ | ✓ | GVCN lớp đang học |
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

## 11. PR-XLMT — xếp lịch MT nhiều lớp, thao tác theo trạng thái (chỉ máy dev)

Dựng bằng hàm nghiệp vụ (`server/src/seed/xlmtSeed.ts`), sau ngày demo 14/09/2026. Tài khoản gợi ý: **Quản lý Nguyễn Khánh Vy**; X4 thêm
**GVCN lớp MB FOU 12**.

| Kịch bản | Học viên | Bạn sẽ thấy |
|---|---|---|
| X1 · Tạo MT4 | **Tạ Minh Quân** (MB FT 101) | Kế hoạch Test › **Xếp lịch MT…** › đợt MT3: cột Sẽ xếp `Tạo MT4 · W4 SEP` (MT3 đủ 4 điểm) |
| X1 · Xếp nốt | **Lương Bảo Anh** (MB FT 101) | MT3 có L R, chưa W S → `Xếp nốt W S · MT3`; dời bài tuần đã bắt đầu → hiện ô Lý do |
| X1 · Dời | **Hà Gia Bình** (MB FT 101) | MT3 hai tuần nữa, chưa thi → `Dời MT3 · … → …` |
| X2 · chờ duyệt | **Kiều Thu Trang** (MB FT 102) | S vắng, máy tự dời lần 1, vắng lần 2 → chip tím `S · chờ duyệt`; hồ sơ Mock › Trả lời đề nghị dời = thẻ Lịch thi |
| X2 · huỷ phần còn lại | **Mạc Đức Long** (MB FT 102) | MT1 W S đã huỷ → chip gạch ngang `· đã huỷ`; chip **Cần xếp lại (n)** đếm em này |
| X3 · MT lịch sử tuần đã qua | **Đoàn Khánh Chi** (MB FT 101) | MT1–MT3 `lịch sử` (đã nhập bù); chọn MT4 tuần 3 tuần trước cho cả 4 kỹ năng → `Tạo MT4 · … · MT lịch sử`; chỉ L tuần đã qua → chặn |
| X4 · ⋯ ô lớp thường | **Âu Nhật Nam** (MB FOU 12) | Lưới chấm lớp thường: ô L dời sang tuần này vì Báo vắng; ⋯ ô → thao tác theo trạng thái + **Lịch sử** (ngăn Lịch sử một bài) |

## 12. PR-HSM — hồ sơ Mock, nhận xét W/S, GV chấm Speaking (chỉ máy dev)
Dựng bằng `saveScore` (`server/src/seed/hsmSeed.ts`) sau PR-KCK. Tài khoản gợi ý: **GVBM Phạm Thu Trang** (Speaking MB FT 101),
**Lê Minh Khoa** (W1) · **Cao Khánh Linh** (W2), **Quản lý Nguyễn Khánh Vy**, **GVCN Trần Ngọc Hà**.

| Kịch bản | Học viên | Bạn sẽ thấy |
|---|---|---|
| H1 · hồ sơ Mock đủ | **Tạ Minh Quân** MT3 (MB FT 101) | Năm ô điểm lớn; W `W1 … · W2 …`; S `GV chấm: Phạm Thu Trang`; khối Nhận xét Writing (Task 1 · Task 2) + Speaking |
| H2 · GV chấm người ngoài | **Nguyễn Minh An** MT1 (MB FT 101) | Ô S `GV chấm: Cô Lan (giám khảo ngoài)` |
| H3 · đang chấm | **Lương Bảo Anh** MT3 (MB FT 101) | Hồ sơ HV › Mock Test: Kết quả "… còn thiếu 2"; lưới FT cột Trạng thái `Đang chấm · 2/4` |
| H4 · lượt huỷ | **Phạm Khánh Linh** MT3 | Dải "Đã huỷ · lý do · ai · ngày" + **Mở lại lượt MT3** (Quản lý) |
| H4 · MT lịch sử | **Đoàn Khánh Chi** MT1–MT3 | Nhãn `lịch sử`, "Nhập bù, không có hạn"; GVCN Hà sửa được ô lớn |
| H4 · vắng lần 2 chờ duyệt | **Kiều Thu Trang** MT1 (MB FT 102) | Ô S tím `chờ Quản lý duyệt dời lần 2 · hạn …` |
| H4 · huỷ phần | **Mạc Đức Long** MT1 (MB FT 102) | Ô W, S `Đã huỷ phần thi`; hồ sơ HV nhãn `huỷ phần` |
| H4 · RF | **Phan Gia Hân** (MB FT RF 12) | Đầu hồ sơ Mock chữ `RF`, `Kỳ vọng x = target`; hồ sơ HV một dòng "Lộ trình RF — kỳ vọng mọi MT bằng target." |
| X5 · Xuất Excel kết quả Test (PR-XUAT) | Đăng nhập **Quản lý** (Nguyễn Khánh Vy) hoặc **GVCN** (Trần Ngọc Hà) → Test › Lịch Test › **Xuất Excel** | Ngăn 3 khối + xem trước `n lượt · k học viên · m lớp`; bấm Xuất → tệp `.xlsx` (sheet `Mock Test` + `Bộ lọc đã dùng`). GVBM thuần (Phạm Thu Trang) không có nút. Cũng mở được ở hồ sơ lớp ⋮ và Phân tích › Tổng hợp Test |
## 13. PR-HVL — Học viên & Lớp, Cần hỗ trợ theo kỹ năng, Phân tích lớp (chỉ máy dev, 30/09/2026)

Dựng bằng hàm nghiệp vụ (`server/src/seed/hvlSeed.ts`), sau ngày demo. Tài khoản gợi ý: **Quản lý Nguyễn Khánh Vy** (thấy cả hai lớp) và **GVCN Trần Ngọc Hà** (MB FT 101). Phép kiểm `PR-HVL (10)` soi từng dòng ngay sau khi dựng.

| Kịch bản | Học viên | Bạn sẽ thấy |
|---|---|---|
| H1 · hai Case cùng Reading | **Trịnh Bảo Ngọc** (MB FT 101) | Hồ sơ lớp › Học viên › **Cần hỗ trợ**: hàng R hai Case (SOS tự tạo `[MT1]` + Case GV tạo tay), hàng W một Case đang chờ Quản lý duyệt "không theo dõi"; Học viên & Lớp: em có chip **Cần làm** (Xác nhận nguyên nhân) và lớp có badge **chờ duyệt** cho Quản lý |
| H2 · lớp FOU | **Hồ Diệu Linh** (MB FOU 12) | Cần hỗ trợ lớp FOU: hàng `G+V` và `P` mỗi hàng một Case, L R gộp `Không có Case: L · R` |
| H2 · Cuối khoá | **Nguyễn Thảo Vy** (MB FOU 12) | Học viên & Lớp: cột Kết quả `58%`, dòng 1 `Cuối khoá`, không "SOS" |
| H3 · Pre FOU | em ở **MB Pre FOU 03** (đã có từ PR-MON D12) | `64%` một dòng, không dòng 2; Cần hỗ trợ một hàng `Tổng hợp` |
| H4 · MT lịch sử | **Đoàn Khánh Chi** (MB FT 101, đã có từ PR-XLMT X3) | Bảng điểm FT: MT1–MT3 nhãn `lịch sử`, ô điểm **xám**; cột Kết quả `Chưa có kết quả`; không ▾ đỏ |

Hàng **"Chung"** (Case không gắn kỹ năng) không có ở bộ demo: mọi Case phải có kỹ năng khi tạo; hàng này chỉ xuất hiện với Case bàn giao / dữ liệu cũ — kiểm bằng phép kiểm thuần `hangCanHoTro`.

## 14. PR-LT2a — Lớp thường · Giữa khoá (chỉ máy dev, 30/09/2026)

Dựng bằng hàm nghiệp vụ (`server/src/seed/lt2aSeed.ts`), sau ngày demo, ở hai lớp mới **MB FOU 15** (Giữa khoá W2 SEP) và **MB BE 03**. Tài khoản gợi ý: **Quản lý Nguyễn Khánh Vy**, **GVCN Trần Ngọc Hà**, GVBM **Lê Minh Khoa** (G+V, W) và **Phạm Thu Trang** (P, S). Phép kiểm `LT2a (11)` soi từng dòng ngay sau khi dựng. Lớp thường **không có chữ SOS** ở đâu cả.

| Kịch bản | Học viên | Bạn sẽ thấy |
|---|---|---|
| G1 (D9) · trượt G+V, P | **Lê Hoàng Anh** (MB FOU 15) | Hồ sơ › Học thuật: hai hàng `[Giữa khoá] G+V không đạt` (Chờ Quản lý duyệt · kế hoạch bổ trợ, viền tím) và `[Giữa khoá] P không đạt` (Cần làm · Xác nhận nguyên nhân); PA thụt vào `Bổ trợ 2 buổi/tuần · chung các môn trượt…` + `PA chung · G+V, P`. Vy có thẻ **Kế hoạch bổ trợ** ở Chờ duyệt; Phối hợp: `Báo phụ huynh qua TVV` chưa làm |
| G2 · trượt R | **Bùi Minh Châu** (MB FOU 15) | Case Đang làm, PA bổ trợ chạy, một lần ghi kết quả; Báo PH `Đã làm` |
| G3 (D10) · trượt W | **Hoàng Quốc Bình** (MB BE 03) | PA `Bổ trợ 1 buổi/tuần · W` đang chạy sau khi Vy duyệt |
| G4 · trượt S | **Mai Hải Long** (MB BE 03) | Kế hoạch bị từ chối (lý do trong khung vàng); Việc cần làm của Trang: `Nộp kế hoạch bổ trợ` hạn 3 ngày |
| G6 · Hà chưa nộp kế hoạch | **Trương Gia Bảo** (MB FOU 15) | Việc cần làm của Hà: `Nộp kế hoạch bổ trợ · Giữa khoá · G+V · Trương Gia Bảo` hạn 3 ngày (Khoa đã xác nhận nguyên nhân) |
| G5 · Báo lên / Không cần theo dõi | **Phan Khánh Linh**, **Ngô Gia Hân** (MB FOU 15) | Case L chờ nguyên nhân quá hạn → thẻ Báo lên; Case P `Không cần theo dõi` chờ Quản lý duyệt |

Bài Giữa khoá đã qua tuần nên `commitIntake` không tự dựng (M1b bỏ mốc đã qua) — seed xếp bằng `planRegularTests` (Quản lý được xếp tuần đã qua).

- **Hồ sơ giáo viên (PR-GV):** menu tài khoản › Hồ sơ giáo viên (**Trần Ngọc Hà**, id 7). QL MB (Nguyễn Khánh Vy): Tổng quan › Theo lớp › Theo giáo viên › bấm tên. GVBM (Phạm Thu Trang) mở `/giao-vien/7` → 403.
