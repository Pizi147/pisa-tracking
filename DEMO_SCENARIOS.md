# 25 tình huống nên bấm thử

Bao gồm đầy đủ 17 tình huống học vụ được yêu cầu, cộng thêm các tình huống về phân quyền,
vận hành và nhập liệu.

Mỗi mục ghi rõ: **dùng tài khoản nào → mở màn nào → làm gì → kỳ vọng thấy gì**.
Tất cả mã học viên, mã lớp và mã công việc dưới đây là mã thật trong dữ liệu mẫu.

Ngày demo mặc định: **10/09/2026**. Tuần hiện tại: **07/09 – 13/09/2026**.

> Đổi tài khoản: bấm **"Đổi tài khoản demo"** ở thanh trên cùng.
> Nếu dữ liệu đã bị bạn sửa nhiều, chạy `npm run seed` để về trạng thái gốc.

---

## 5 kịch bản nên thử trước

Nếu bạn chỉ có 15 phút, thử theo đúng thứ tự này: **2 → 8 → 12 → 16 → 17**.
Đây là các điểm dễ sai nhất và cũng là các quyết định quan trọng nhất cần bạn duyệt.

---

## A. Quyền và phạm vi

### 1. GVBM xem được mọi skill nhưng chỉ sửa skill được giao

- **Tài khoản:** Lê Minh Tú (chỉ dạy Listening lớp FT-A01)
- **Đường dẫn:** Lớp học → **FT-A01** → tab **Cập nhật tuần**
- **Làm gì:** Nhập số vào cột "Buổi chính" ở skill **Listening**. Sau đó bấm nút skill **Speaking**.
- **Kỳ vọng:**
  - Ở Listening: nhập được, hiện "Đang lưu…" rồi "Đã lưu".
  - Ở Speaking: **xem đầy đủ số liệu của cả lớp** nhưng mọi ô bị khoá, có banner
    *"Bạn đang xem Speaking ở chế độ chỉ đọc"* kèm giải thích tại chỗ.
  - Sidebar **không có** mục Cuộc họp hay Quản trị.
  - Trong Lớp học chỉ thấy **FT-A01, FT-B01, FT-D01** — các lớp được phân công.

### 2. ⭐ Multi-role không bị cộng nhầm phạm vi

- **Tài khoản:** Phạm Đức Anh — vừa **Quản lý chi nhánh Cầu Giấy**, vừa **GV Speaking lớp FT-B01 (Hà Đông)**
- **Đường dẫn:** Lớp học
- **Kỳ vọng:**
  - Thấy **4 lớp Cầu Giấy** (quyền quản lý) + **FT-B01 của Hà Đông** (quyền giáo viên).
  - Mở **FT-A01** (Cầu Giấy) → tab Cập nhật tuần: sửa được **cả 5 skill**.
  - Mở **FT-B01** (Hà Đông) → chỉ sửa được **Speaking**; các skill khác chỉ đọc.
  - Cột "Phân công của tôi" ở danh sách lớp chỉ hiện badge tại FT-B01.
- **Điểm cần soi:** quyền quản lý ở Cầu Giấy **không** được dùng ở Hà Đông, và quyền giáo viên
  ở Hà Đông **không** mở rộng thành quyền quản lý.

### 3. GVCN là phân công theo lớp, không phải vai trò hệ thống

- **Tài khoản:** Vũ Hải Yến — **GVCN FT-A01**, dạy Speaking ở FT-A01 **và** FT-B01 (không chủ nhiệm B01)
- **Đường dẫn:** Tổng quan → thẻ lớp
- **Kỳ vọng:**
  - Thẻ **FT-A01** có badge **GVCN**; thẻ **FT-B01** thì không.
  - Mở hồ sơ một học viên FT-A01 → tab **Báo cáo & ghi nhận**: có nút *Viết báo cáo* và
    *Ghi nhận cảnh báo*.
  - Mở hồ sơ một học viên **chỉ thuộc FT-B01** → **không** có hai nút đó.
  - Trong menu tài khoản (góc phải trên): GVCN hiện dưới dạng **badge tại lớp**,
    không phải một vai trò toàn hệ thống.

### 4. Giáo viên dạy thay hết hiệu lực thì mất quyền

- **Tài khoản:** Trần Quốc Bảo (Admin)
- **Đường dẫn:** Lớp học → **FT-A01** → tab **Phân công**
- **Kỳ vọng:** dòng **Mai Đình Phúc — GVBM Reading** có trạng thái **"Hết hiệu lực"**
  (phân công kết thúc 11/08/2026). Đăng nhập bằng tài khoản này thì không sửa được Reading nữa.

---

## B. Dữ liệu học tập theo tuần

### 5. Học viên FT tiến bộ tốt, không có tín hiệu cần chú ý

- **Học viên:** **PISA-000001 — Nguyễn Minh Anh** (FT-A01)
- **Đường dẫn:** Học viên → tìm `PISA-000001`
- **Kỳ vọng:** header hiện *"Không có tín hiệu vượt ngưỡng"*; có 2 bài official
  (Entrance 5.5 → Mock 6.0) cho thấy tiến bộ; tab **Hành trình** hiện đủ chuỗi sự kiện.

### 6. Chuyên cần thấp nhưng **chưa** có ghi nhận cảnh báo

- **Học viên:** **PISA-000002 — Trần Bảo Long** (FT-A01)
- **Kỳ vọng:**
  - Badge **"Cần chú ý"** (màu vàng) kèm câu giải thích có số thực, ví dụ
    *"Chuyên cần 60% (15/25 buổi chính), dưới ngưỡng 80%"*.
  - Tab **Báo cáo & ghi nhận** → mục Ghi nhận cảnh báo: **trống**.
- **Điểm cần soi:** "Cần chú ý" và "Có ghi nhận cảnh báo" là **hai badge khác nhau**.
  Hệ thống không tự biến tín hiệu thành cảnh báo.

### 7. Thiếu bài tập nhiều tuần → đã có vấn đề và công việc theo dõi

- **Học viên:** **PISA-000003 — Lê Thu Phương** (FT-A01)
- **Kỳ vọng:**
  - Badge cần chú ý vì bài tập dưới 70%.
  - Header có dòng **"Bước tiếp theo"** trỏ tới **TASK-0001** *(Liên hệ phụ huynh…)*,
    hiện người xử lý **Vũ Hải Yến** và hạn **04/09/2026 (quá hạn)**.
  - Badge **Vấn đề ISS-0001**; bấm vào mở thẳng drawer vấn đề, trong đó thấy công việc liên kết.

### 8. ⭐ Có ghi nhận cảnh báo do người nhập, kèm lịch sử theo dõi

- **Học viên:** **PISA-000004 — Phạm Nhật Duy** (FT-A01)
- **Đường dẫn:** hồ sơ → tab **Báo cáo & ghi nhận**
- **Kỳ vọng:**
  - Ghi nhận cảnh báo mức **Cảnh báo**, trạng thái **Đang theo dõi**, có kế hoạch theo dõi.
  - Có thêm **Ghi nhận sự việc** riêng.
  - Vấn đề **ISS-0006** và công việc theo dõi 3 tuần.
- **So sánh ngay sau đó:** đổi sang tài khoản **Đặng Kim Chi (tư vấn viên)** rồi mở lại
  học viên này → phần mô tả chi tiết bị ẩn, chỉ còn thông tin đủ để trao đổi với phụ huynh.

### 9. Buổi bổ trợ không làm tỷ lệ chuyên cần vượt 100%

- **Học viên:** **PISA-000009 — Bùi Hà My** (FT-A01)
- **Đường dẫn:** hồ sơ → tab **Học tập theo tuần** → tuần **07/09 – 13/09**
- **Kỳ vọng:**
  - Tổng **5 buổi chính** (1 mỗi skill) + **7 buổi bổ trợ** trong tuần.
  - Cột "Tổng buổi" = 12; cột "Tỷ lệ chuyên cần" = **100%**, **không phải 240%**.
  - Mở drawer chi tiết (nút `⋯` ở bảng Cập nhật tuần) → thấy danh sách buổi bổ trợ
    ghi rõ loại (tutor / 1-1) và tên giáo viên là **ghi chú**, không cấp quyền.

### 10. "Chưa cập nhật" khác hẳn "đã nhập 0 buổi"

- **So sánh hai học viên trong cùng lớp FT-A01, cùng một bảng:**
  - **PISA-000015 — Trịnh Bảo Trâm**: ô trống, badge **"Chưa cập nhật"**,
    **không** bị tính là vắng học, **không** có tín hiệu cần chú ý.
  - **PISA-000016 — Cao Minh Quang**: nhập số **0**, badge **"Đã cập nhật"**,
    tỷ lệ chuyên cần **0%**, **có** tín hiệu cần chú ý.
- **Đường dẫn:** Lớp học → FT-A01 → Cập nhật tuần → skill Listening

### 11. Học viên chỉ đăng ký một số skill

- **Học viên:** **PISA-000008 — Ngô Tuấn Kiệt** (FT-A01, chỉ học Listening + Speaking)
- **Đường dẫn:** Lớp học → FT-A01 → Cập nhật tuần → chọn skill **Reading**
- **Kỳ vọng:** dòng của học viên này hiện **"Không áp dụng"**, ô nhập bị khoá, và
  **không** bị tính vào số dòng "chưa cập nhật" ở dòng tổng phía trên bảng.

---

## C. Lịch sử học viên

### 12. ⭐ Chuyển từ Normal lên FT — giữ cả hai lần học và điểm cũ

- **Học viên:** **PISA-000005 — Hoàng Diệu Linh**
- **Đường dẫn:** hồ sơ → tab **Tổng quan** (bảng *Các lần học*) và tab **Điểm & đánh giá**
- **Kỳ vọng:**
  - **Hai lần học**: `NM-A01` trạng thái *Đã chuyển lớp*, và `FT-A01` trạng thái *Đang học*.
  - Tab Điểm: **Progress Test và Final Test thang 10** của lớp Foundation **vẫn còn**,
    trong đó có điểm **9.5** — chứng tỏ **không bị quy đổi thành band IELTS**.
  - Cùng bảng có Entrance Test **thang IELTS** của lớp FT, mỗi bài ghi rõ thang điểm riêng.
  - Tab **Hành trình** có sự kiện *Chuyển lớp* đúng ngày.

### 13. Tạm dừng rồi quay lại — và học lại lần 2

- **Tạm dừng/quay lại:** **PISA-000006 — Vũ Đăng Khoa** — hai lần học ở FT-A01,
  lần đầu trạng thái *Tạm dừng*, lần hai *Đang học* (lần 2). Hành trình có sự kiện
  *Tạm dừng học* và *Quay lại học*.
- **Học lại:** **PISA-000007 — Đỗ Khánh Chi** — lần 1 *Đã hoàn thành*, lần 2 *Đang học*,
  mỗi lần có Mock Test riêng (6.0 → 6.5).
- **Kỳ vọng chung:** lịch sử **không bị ghi đè**; trong bảng Cập nhật tuần, tên học viên
  có ghi chú nhỏ *"lần học 2"*.

### 14. Writing 1 / Writing 2 tách riêng, không thành điểm Writing chính thức

- **Học viên:** **PISA-000010 — Dương Quốc Việt**
- **Đường dẫn:** hồ sơ → tab **Điểm & đánh giá**
- **Kỳ vọng:**
  - Bảng *Ước lượng của giáo viên*: **Writing 1 = 5.0** và **Writing 2 = 6.0** — hai dòng riêng,
    có ghi chú khác nhau.
  - Bảng *Điểm kiểm tra chính thức*: **Writing = 6.5** — **khác** trung bình của hai ước lượng (5.5).
  - Hai bảng nằm tách nhau, có ghi chú nhắc rõ đây là ước lượng chứ không phải điểm chính thức.

### 15. Chưa có bài official / bài official thiếu skill

- **Chưa thi:** **PISA-000011 — Lý Thảo Nguyên** — header hiện *"Chưa có bài official"*,
  nhưng vẫn có đủ 5 ước lượng của giáo viên.
- **Thiếu skill:** **PISA-000012 — Đinh Gia Huy** — Mock Test có Listening/Reading/Writing,
  ô **Speaking hiện "Chưa có"**, danh sách học viên ghi chú *"thiếu 1 skill"*.
  Hệ thống **không** lấy điểm Speaking từ bài khác để lấp vào.

### 16. ⭐ Trùng họ tên + ngày sinh — dò trùng nhưng không tự gộp

- **Cặp trùng:** **PISA-000013** và **PISA-000014** — cùng tên **Nguyễn Văn Hải**,
  cùng ngày sinh **08/03/2007**, khác lớp (FT-A01 và FT-B01).
- **Đường dẫn:** Học viên → tìm `Nguyen Van Hai` (gõ **không dấu** cũng ra)
- **Kỳ vọng:** hiện **hai hồ sơ riêng biệt**, hai mã học viên khác nhau, không bị gộp.
- **Thử thêm luồng import:** Học viên → **Nhập từ Excel/CSV** → tải *tệp mẫu chuẩn* →
  sửa một dòng thành `Nguyễn Văn Hải` / `08/03/2007` / lớp `FT-A01` → nhập lại tệp đó.
  Ở bước **Xử lý trùng**, hệ thống liệt kê cả hai hồ sơ, ghi rõ **khớp theo Họ tên + Ngày sinh**,
  và bắt bạn chọn: *liên kết* / *tạo riêng* / *bỏ qua*.

---

## D. Lớp học và chương trình

### 17. ⭐ Template có version — lớp cũ không bị ảnh hưởng

- **Tài khoản:** Trần Quốc Bảo (Admin)
- **Kỳ vọng ban đầu:**
  - **NM-A01** (Foundation Cầu Giấy) đang dùng **Foundation v1 — 8 tuần**.
  - **NM-C01** (Foundation Thanh Xuân, mở sau) đang dùng **Foundation v2 — 10 tuần**.
  - **NM-B01** (Foundation Hà Đông) dùng **v1** nhưng có **override riêng**.
- **Làm gì:** Quản trị → tab **Chương trình & phiên bản** → Foundation → **Tạo phiên bản mới**.
- **Kỳ vọng sau đó:** xuất hiện **v3**, nhưng cột *Lớp đang dùng* của v1 **không đổi**;
  mở lại **NM-A01** → tab Tiến độ chương trình vẫn là **8 tuần của v1**.

### 18. Override chỉ ảnh hưởng đúng một lớp

- **Đường dẫn:** Lớp học → **NM-B01** → tab **Tiến độ chương trình**
- **Kỳ vọng:** mốc **"Tuần 4 — Progress Test"** được đổi tên và **bỏ hạn**
  (badge *"Đã điều chỉnh riêng cho lớp"*, cột Hạn hiện *"Không đặt hạn"*).
- **Đối chiếu:** mở **NM-A01** → cùng mốc `f1-w4` vẫn **có hạn** như bản gốc.

### 19. Lớp FT không có mốc kèm hạn thì không bị đánh giá chậm

- **Đường dẫn:** Lớp học → **FT-A01** → tab **Tiến độ chương trình**
- **Kỳ vọng:** badge **"Chương trình không cấu hình hạn — không đánh giá chậm"**;
  mọi mốc hiện *"Không đặt hạn"* dù lớp đã học 10 tuần.
- **Đối chiếu:** **FT-C01** dùng lộ trình có mốc kèm hạn → bị đánh dấu **Chậm**,
  và xuất hiện trong khối *"Lớp chậm theo mốc chương trình"* của Tổng quan quản lý.

---

## E. Vận hành

### 20. Báo cáo chi nhánh: "Chưa gửi" khác "Ổn"

- **Tài khoản:** Trần Quốc Bảo (Admin)
- **Đường dẫn:** Báo cáo → tab **Báo cáo chi nhánh** → kỳ **Tuần 07/09 – 13/09**
- **Kỳ vọng:**
  - **Cầu Giấy, Thanh Xuân, Long Biên**: có báo cáo (bản nháp).
  - **Hà Đông** và **Tutor Part-time**: badge đỏ **"Chưa gửi"** — khác hẳn màu xanh "Ổn".
  - **PISA Vinh**: chi nhánh chưa có lớp nào — dùng để xem trạng thái rỗng.
  - **Tutor Part-time** là **đơn vị báo cáo riêng, không thuộc chi nhánh nào**.
- **Làm thêm:** mở báo cáo Cầu Giấy → đổi trạng thái một nhóm → thấy *"Đã lưu"*;
  bấm **Gửi báo cáo** khi còn nhóm "Chưa báo cáo" → bị chặn kèm lời giải thích.

### 21. Kỳ họp: quyết định → công việc → carry-over không nhân bản

- **Đường dẫn:** Cuộc họp → chọn **Họp vận hành tuần 07/09 – 13/09**
- **Kỳ vọng:**
  - Khối **"Việc chưa xong từ kỳ trước"** hiện **chính các công việc cũ**:
    **TASK-0001**, **TASK-0002** (đều quá hạn), **TASK-0004** (Tạm dừng **và vẫn quá hạn**),
    kèm cột **Kỳ họp gốc** và ngày tạo gốc — **không phải bản sao mới**.
  - Khối **"Việc đã hoàn thành từ các kỳ trước"** vẫn tra được **TASK-0009**, **TASK-0011**.
  - Số lượng công việc trong hệ thống **không tăng** khi bạn mở đi mở lại kỳ họp.
- **Làm thêm:** chọn một vấn đề → **Ghi quyết định** → từ quyết định bấm
  **Tạo công việc từ quyết định** → sang kỳ họp khác vẫn thấy **cùng một mã công việc**.

### 22. Công việc: trạng thái hạn do hệ thống tính

- **Đường dẫn:** Công việc
- **Kỳ vọng:**
  - View **Quá hạn**: có **TASK-0004** dù đang **Tạm dừng** — tạm dừng không dừng đồng hồ.
  - View **Hoàn thành**: **TASK-0009** hiện *"Đã đóng"*, **không** còn cảnh báo quá hạn.
  - Có ít nhất một công việc **"Chưa có hạn"** (TASK-0013), không bị coi là "Trong hạn".
  - View **Công việc kéo dài** lọc theo ngưỡng 21 ngày, có ghi rõ ngưỡng.
- **Thử quyền:** đăng nhập **Vũ Hải Yến**, mở **TASK-0001** (được giao cho cô) →
  chỉ sửa được **trạng thái, ghi chú, lý do tạm dừng**; có dòng giải thích vì sao
  không đổi được người thực hiện hay hạn.

### 23. Ghi chú nội bộ không lọt sang tư vấn viên

- **Bước 1 — tài khoản Vũ Hải Yến:** mở **PISA-000002 (Trần Bảo Long)** → tab Tổng quan →
  thấy ghi chú badge đỏ **"Nội bộ"**: *"Học viên nghỉ nhiều vào ca tối…"*.
- **Bước 2 — đổi sang Đặng Kim Chi (tư vấn viên):** mở lại đúng học viên đó.
- **Kỳ vọng:**
  - Ghi chú nội bộ **biến mất hoàn toàn** — không chỉ bị ẩn ở giao diện mà **không có trong dữ liệu trả về**.
  - Báo cáo tiến độ chỉ còn phần **"Tóm tắt chia sẻ"**, badge *"Bản dành cho tư vấn"*.
  - Sidebar không có **Lớp học / Vấn đề / Cuộc họp / Quản trị**.
  - Có dòng giải thích ngay trên hồ sơ về phạm vi của tài khoản tư vấn.
- **Kiểm chứng thêm:** tìm kiếm trên thanh header bằng từ khoá trong ghi chú nội bộ →
  không ra kết quả nào với tài khoản tư vấn viên.

---

## F. Nhập liệu và công cụ demo

### 24. Import báo lỗi rõ ràng, không nhập âm thầm

- **Tài khoản:** Trần Quốc Bảo hoặc Nguyễn Thu Hà
- **Đường dẫn:** Học viên → **Nhập từ Excel/CSV** → **Tải tệp mẫu có lỗi** → nhập lại chính tệp đó
- **Kỳ vọng ở bước "Kiểm tra & lỗi":** đúng **4 dòng lỗi**, mỗi dòng ghi rõ lý do —
  thiếu họ tên · lớp không tồn tại · ngày `30/13/2007` không hợp lệ · tư vấn viên không hợp lệ.
  Các dòng lỗi được **bỏ qua một cách rõ ràng**, phần còn lại vẫn nhập được.
- **Thử chống trùng:** bấm **Xác nhận nhập** hai lần liên tiếp → lần hai báo
  *"Phiên nhập này đã được ghi trước đó"*, **không** tạo thêm học viên.
- **Thử giới hạn quyền:** đăng nhập **Nguyễn Thu Hà** (chỉ Cầu Giấy) và nhập file có lớp
  `FT-B01` → dòng đó bị báo **"nằm ngoài phạm vi bạn được cấp quyền"**.

### 25. Công cụ demo: đồng hồ và các trạng thái giao diện

- **Đường dẫn:** thanh trên cùng → **Công cụ demo**
- **Thử đổi ngày demo** sang `2026-09-20` → quay lại Công việc: các công việc trước đó
  *Sắp đến hạn* chuyển thành *Quá hạn*. Đặt lại bằng nút **"Dùng ngày thật"** hoặc gõ lại `2026-09-10`.
- **Thử kịch bản giao diện:**
  - *Đang tải* → xem skeleton.
  - *Lỗi khi tải* → xem màn hình lỗi có nút **Thử lại**.
  - *Lưu thất bại* → vào bảng Cập nhật tuần, sửa một ô: hiện **"Lưu lỗi — Thử lại"**,
    **giá trị bạn gõ vẫn còn nguyên trong ô** (không bị mất, không báo đã lưu giả).
    Tắt kịch bản rồi bấm **Thử lại** → lưu thành công.
- **Lưu ý:** hệ thống **không bao giờ tự bật lỗi** khi bạn dùng bình thường.

---

## Bảng tra nhanh tài khoản mẫu

| Tài khoản | Vai trò và phạm vi | Dùng để thử |
|---|---|---|
| Trần Quốc Bảo | Admin toàn hệ thống | Quản trị, template version, nhật ký |
| Nguyễn Thu Hà | Quản lý **chỉ Cầu Giấy** | Giới hạn phạm vi chi nhánh |
| Phạm Đức Anh | Quản lý Cầu Giấy **+** GV Speaking FT-B01 (Hà Đông) | **Multi-role không cộng scope** |
| Lê Minh Tú | GV **chỉ Listening** FT-A01 | Giới hạn theo skill |
| Vũ Hải Yến | **GVCN FT-A01** + GV Speaking FT-A01 & FT-B01 | GVCN theo lớp, không phải role |
| Mai Đình Phúc | GV dạy thay, phân công **đã hết hạn** | Mất quyền khi hết hiệu lực |
| Đặng Kim Chi | Tư vấn viên — **12 học viên** | Chỉ đọc, không thấy ghi chú nội bộ |
| Hoàng Lan Phương | Quản lý tư vấn — nhóm rộng hơn, **không** toàn hệ thống | Phạm vi nhóm |
| Đỗ Trung Kiên | Quản lý Hà Đông | Đối chiếu phạm vi chéo |
| Hà Anh Quân | Phụ trách **Tutor Part-time** | Đơn vị báo cáo ngoài chi nhánh |
| Lâm Hoài An | Quản lý **PISA Vinh** (chưa có lớp) | **Trạng thái rỗng** |

## Bảng tra nhanh mã dữ liệu

| Mã | Học viên | Tình huống |
|---|---|---|
| PISA-000001 | Nguyễn Minh Anh | Tiến bộ tốt, không concern |
| PISA-000002 | Trần Bảo Long | Chuyên cần thấp, **chưa** có cảnh báo |
| PISA-000003 | Lê Thu Phương | Thiếu bài tập → ISS-0001 + TASK-0001 |
| PISA-000004 | Phạm Nhật Duy | **Có ghi nhận cảnh báo** + theo dõi |
| PISA-000005 | Hoàng Diệu Linh | Normal → FT, giữ cả hai lần học và điểm thang 10 |
| PISA-000006 | Vũ Đăng Khoa | Tạm dừng rồi quay lại |
| PISA-000007 | Đỗ Khánh Chi | Học lại lần 2 |
| PISA-000008 | Ngô Tuấn Kiệt | Chỉ học Listening + Speaking |
| PISA-000009 | Bùi Hà My | 5 buổi chính + 7 buổi bổ trợ |
| PISA-000010 | Dương Quốc Việt | Writing 1 ≠ Writing 2 ≠ Writing official |
| PISA-000011 | Lý Thảo Nguyên | Chưa có bài official, chỉ có ước lượng |
| PISA-000012 | Đinh Gia Huy | Bài official **thiếu Speaking** |
| PISA-000013 / PISA-000014 | Nguyễn Văn Hải (×2) | **Trùng tên + ngày sinh** |
| PISA-000015 | Trịnh Bảo Trâm | **Chưa cập nhật** dữ liệu |
| PISA-000016 | Cao Minh Quang | **Đã nhập 0 buổi** |
