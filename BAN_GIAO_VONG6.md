> ⚠️ **TÀI LIỆU LỊCH SỬ — KHÔNG PHẢI LUẬT.** Bàn giao hiện hành là `BAN_GIAO.md`; kế hoạch
> đang chạy là `plan.md`. File này chép lại *thứ đã code ở vòng đó*, không phải *thứ đã
> chốt* — đã có một lần tin nó và đi sai (xem `BAN_GIAO.md` mục 5). Chỉ dùng để tra lịch sử.

# Báo cáo bàn giao — vòng 6 (sau PR14)

Một trang. Đọc xong là biết **cái gì đã đổi**, **mở gì trước**, và **chỗ nào còn chưa chắc**.

Ngày demo cố định: **14/09/2026**. Toàn bộ tên người và số liệu là **giả**.

---

## 1. Những chỗ sai logic đã sửa

Đây là các lỗi **nghiệp vụ** — không phải đổi giao diện — tìm ra khi đi thử từng luồng.

| Chỗ sai | Trước đây màn hình hiện gì | Bây giờ |
|---|---|---|
| Nhầm *"được phép nhập"* với *"việc của mình"* | Giáo viên nào có quyền sửa điểm một kỹ năng là **hiện luôn** việc nhập điểm đó, kể cả lớp mình không dạy. Quản lý mở máy ra thấy hàng chục việc nhập điểm không phải của mình | Chỉ hiện việc của **người được phân công** kỹ năng đó ở lớp đó. Quyền sửa vẫn giữ nguyên — vào lớp vẫn nhập hộ được, chỉ là không bị nhồi vào danh sách việc |
| Con số của chi nhánh đếm cả chi nhánh khác | Quản lý một chi nhánh mở bảng tuần vẫn thấy tổng của cả trung tâm ở vài ô | Mọi con số đều cắt đúng theo chi nhánh đang chọn |
| Tiêu đề case mất phần dữ kiện | Case nào có người viết tay tóm tắt thì **mất luôn** dòng "MT2: 2 kỹ năng dưới kỳ vọng" — đọc tiêu đề không biết case sinh ra từ đâu | Tiêu đề luôn giữ dữ kiện gốc, ghi chú tay nối vào sau dấu gạch: *"MT2: 2 kỹ năng dưới kỳ vọng — em hay bỏ nghe phần cuối"* |
| Học viên đã học xong bị coi như chưa có kết quả | Hồ sơ của em đã kết thúc lộ trình hiện "chưa có kết quả" dù có đủ điểm | Khi không còn chu kỳ đang chạy thì lấy **chu kỳ gần nhất**, hiện đúng kết quả cuối cùng |
| Mức SOS lấy nhầm bài | Mức SOS gom từ nhiều lượt kiểm tra | Chỉ lấy từ **lượt gần nhất có kết quả** — đúng cách giáo viên nhìn |
| Case sinh ra không có ai phụ trách | Case tự sinh từ điểm nằm chơ vơ, không ai đứng tên, trôi thành quá hạn | Case sinh ra là gán ngay **GVCN của lớp**; case cũ quá lâu thì đã được khép đúng cách |
| Phương án thay thế không nối vào nhau | Đổi phương án thì phương án cũ đứng riêng, không biết cái nào thay cái nào | Phương án cũ ghi rõ **"Được thay thế"** và trỏ sang phương án mới |
| Phương án được duyệt chạy sai ngày | Chu kỳ theo dõi tính từ ngày **đề xuất** | Tính từ ngày **được duyệt** |
| Đề xuất bị từ chối bị đánh dấu như bị thay thế | Từ chối và thay thế nhìn giống nhau | Hai lý do khép khác nhau, đọc là phân biệt được |
| Case tái diễn bị chặn | Em yếu lại ở đúng kỹ năng cũ thì hệ thống tưởng trùng, **không mở case mới** | Mở được case mới, nối vào case cũ, và case cũ có thêm mốc "tái phát" — kết quả cũ không bị viết lại |
| Việc nhập điểm nổ tung thành từng học viên | Một lớp 10 em thiếu điểm Listening = **10 dòng việc** | Gom thành **một dòng**: lớp · bài · kỹ năng · số em còn thiếu |
| Mốc của lớp lẫn vào việc phải làm | Sự kiện "tuần này lớp có Final Test" nằm chung với việc cần bấm | Tách hẳn: sự kiện ở khu **Sự kiện nổi bật**, việc ở khu **Việc cần lưu ý** |
| Bảng tuần đếm sai đơn vị | Cột "Case" đếm **lượt kiểm tra có case**, không phải số học viên | Mỗi cột ghi rõ đếm cái gì; số học viên và số lượt tách riêng |

---

## 2. Những khu vực đã làm lại

| Khu vực | Đã làm gì |
|---|---|
| **Tổng quan → Toàn cảnh** | Bỏ ba chỗ hiện cùng một con số. Còn hai khối: **Sự kiện nổi bật** (thu gọn sẵn, tuần này / tuần tới / tuần nữa, Normal và Fast Track tách riêng) và **Việc cần lưu ý** (bảng gom theo chín nhóm việc, bấm số là lọc ngay danh sách bên dưới) |
| **Tổng quan → Thực trạng** | Bảng tuần đếm lại đúng đơn vị, bỏ cột vô nghĩa, thêm màn **Phương án & kết quả** — xem mỗi loại hỗ trợ đang chạy bao nhiêu, đã xem lại bao nhiêu, kết quả ra sao |
| **Trang Học viên** | Hai bộ cột tách hẳn: lớp Normal xem **mốc kiểm tra · L·R·W·S · theo dõi**; lớp Fast Track xem thêm **target · dự kiến thi · Overall · W1/W2**. Nút **Gọn / Đầy đủ** đổi mật độ. Lịch sử điểm hiện 2–3 mốc gần nhất ngay trên dòng |
| **Hồ sơ học viên** | Bỏ thanh dính đầu trang, bỏ nhãn "Gấp", bố cục lại bốn phần: em là ai → đang ở đâu → đang vướng gì → đã làm gì. Đọc được nội dung case **mà không cần mở ra** |
| **Tiến độ công việc** | Khu mới: việc quản lý có **nhóm việc**, **việc con** và **lịch sử thay đổi** |
| **Nhãn và nút toàn site** | Sáu họ nhãn dùng chung một bộ quy tắc màu; nút và panel gom về một kiểu |
| **Bộ dữ liệu demo** | Dựng lại **từ hành trình từng em**, không phải sinh ngẫu nhiên. Xem mục 4 |

---

## 3. Đã kiểm những luồng nào

**Kiểm tự động — 235 bài, đạt hết.** Trong đó có một nhóm mới chạy ngay sau khi dựng dữ liệu, để bắt lỗi *dữ liệu demo* chứ không phải lỗi mã: đủ 24 tình huống dữ liệu cần có, không có việc "đã xong" nào mang ngày tương lai, số case quá hạn chỉ chiếm thiểu số, bảng "Theo giáo viên" cộng đúng theo người phụ trách case.

**Kiểm bằng mắt trên trình duyệt:**

- Bốn khổ màn hình: **360 · 768 · 1280 · 1920** — không lỗi tràn chữ, không vỡ bảng, không có lỗi đỏ nào trong nhật ký trình duyệt.
- Sáu màn: Toàn cảnh · Thực trạng · Thực trạng theo tuần · danh sách lớp · hồ sơ học viên · Tiến độ công việc.
- Ba vai: **Quản trị hệ thống**, **Quản lý Monbay**, **Giáo viên Trần Ngọc Hà** — mỗi vai thấy đúng phần của mình.
- Sáu hồ sơ tiêu biểu (J01 · J04 · J05 · J09 · J12a · J12b) mở ra đúng như mô tả trong `DEMO_SCENARIOS.md`.

---

## 4. Bộ demo có gì

| | Số lượng |
|---|---|
| Chi nhánh | **5** (Monbay · Bãi Cháy · Cẩm Phả · Hải Dương · Uông Bí) |
| Lớp | **13** (11 đang chạy, 2 đã kết thúc) |
| Học viên | **41** (40 đang học, 1 đã học xong) |
| Giáo viên | **10** (2 người dạy ở hai chi nhánh) |
| Tài khoản đăng nhập | **21** |
| Lượt kiểm tra | **115**, với **369** ô điểm kỹ năng |
| Case | **52** |
| Phương án hỗ trợ | **80** |
| Lần cập nhật kết quả | **62** |
| Việc quản lý | **14** |
| Lịch sử dữ liệu | từ **12/2025** đến ngày demo **14/09/2026** |

Mỗi lớp là **một tình huống riêng**: lớp đang tuần Progress Test, lớp tuần Final Test, lớp đã hết chương trình, lớp thiếu giáo viên bộ môn, lớp chưa có GVCN, lớp có bài kiểm tra quá hạn chấm, lớp dùng mã cũ. Bảng đầy đủ ở [`DEMO_SCENARIOS.md`](DEMO_SCENARIOS.md).

---

## 5. Nên mở cái gì trước

**Ba phút:** đăng nhập **Quản lý Bãi Cháy — Trần Hải Đăng** (`dang.tran.pisa@gmail.com`, mật khẩu `pisa2026`). Màn Tổng quan của người này đầy đủ nhất: có đề xuất chờ duyệt quá hạn, có bài kiểm tra quá hạn chấm, có lớp chưa có GVCN.

**Mười phút:** mở đúng sáu hồ sơ này, theo thứ tự.

| # | Hồ sơ | Xem để hiểu điều gì |
|---|---|---|
| 1 | **Nguyễn Minh An** · PISA-000001 · MB-FT 101 | Một em đi qua **ba chương trình** từ 12/2025, và một case cũ **theo em sang lớp mới** |
| 2 | **Trần Thu Hà** · PISA-000002 · MB-FT 101 | Hỗ trợ **có tác dụng**: SOS 2 → SOS 1, một case khép "Tiến bộ rõ rệt", một case vẫn theo dõi tiếp |
| 3 | **Hồ Thanh Tùng** · PISA-000020 · CP-FT 110 | **Case tái diễn**: yếu lại ở đúng kỹ năng cũ, case mới nối vào case cũ mà không xoá lịch sử |
| 4 | **Lý Tuấn Bình** · PISA-000022 · CP-FT 110 | **Nhận định ban đầu sai**, đổi phương án giữa chừng, và hệ thống ghi nhận đúng việc đó |
| 5 | **Phạm Gia Hân** · PISA-000027 · HD-BE 21 | **Bàn giao khi chuyển lớp**: cô cũ làm chu kỳ 1, thầy mới làm chu kỳ 2 |
| 6 | **Lý Thanh Trúc** · PISA-000034 · UB-FT 401 | **Kết quả thi thật** chưa đạt target — so với **Dương Minh Quân** cùng lớp, cùng ngày thi, đạt target |

Ba vai nên đổi qua lại để so sánh: **Quản trị hệ thống** (Đỗ Vũ Tuấn Phong) thấy cả trung tâm · **Quản lý Monbay** (Nguyễn Khánh Vy) thấy một chi nhánh · **Giáo viên Trần Ngọc Hà** (`ha.tran.pisa@gmail.com`) chỉ thấy lớp mình dạy.

---

## 6. Còn hạn chế, và chỗ chưa xác minh

**Biết trước, cố tình để vậy:**

- Bản demo chạy trên **một máy**, dữ liệu nằm trong một tệp. Không có nhiều người dùng cùng lúc, không có đám mây.
- Đăng nhập demo bỏ qua mật khẩu là **để thử vai cho nhanh**, không phải cơ chế bảo mật thật.
- Không gửi email, không có luồng quên mật khẩu, không có thông báo đẩy.
- Lịch kiểm tra **chỉ có ngày, không có giờ**, và không có phòng thi hay giám thị.

**Chưa xác minh hết:**

- Chỉ kiểm bằng mắt trên **Chromium**. Safari và Firefox chưa mở thử.
- Màn **Quản trị hệ thống** (tài khoản, vai trò, danh mục) chưa kiểm lại trong vòng này — vòng trước đã kiểm và chưa đụng vào.
- **In ấn / xuất file** chưa làm và chưa thử.
- Bộ demo dừng ở **41 học viên**. Bảng chạy mượt ở quy mô này; quy mô vài nghìn em **chưa đo**.
- Các ngưỡng cảnh báo (bao nhiêu ngày thì tính quá hạn, bao nhiêu phần trăm thì tính đạt) vẫn là **giả định thử nghiệm** — danh sách cần chốt nằm ở [`DEMO_ASSUMPTIONS.md`](DEMO_ASSUMPTIONS.md).

---

Tài liệu đi kèm: [`README.md`](README.md) cách chạy · [`DEMO_SCENARIOS.md`](DEMO_SCENARIOS.md) bấm vào đâu thấy gì · [`DEMO_ASSUMPTIONS.md`](DEMO_ASSUMPTIONS.md) những điểm cần bạn chốt · [`CODE_MAP.md`](CODE_MAP.md) bản đồ mã nguồn.
