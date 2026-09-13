# Vòng 4 — Kế hoạch 4 phase

Chốt 13/09/2026. Đọc `01_CHOT_NGHIEP_VU.md` trước.

Mỗi phase là **một PR**. Không gộp hai phase vào một PR — owner cần xem và dùng thử từng bước.

---

## Nguyên tắc xuyên suốt cả 4 phase

1. **Không tự đổi nghiệp vụ.** Giao diện được overhaul mạnh; nghiệp vụ đã chốt thì không.
   Thấy mâu thuẫn → hỏi owner ngay, không đoán.
2. **Không để server chạy ngầm.** Chỉ bật khi cần chụp màn hình hoặc chạy thử luồng, xong thì
   tắt và kiểm cổng `5173`/`4000` đã trống. Owner đã nhắc đích danh việc này.
3. **Không merge, không deploy, không gửi thông báo ra ngoài** nếu owner không yêu cầu.
4. **Giải thích cho người không biết code.** Owner là giáo viên IELTS. Mô tả PR viết bằng
   tiếng Việt, tránh thuật ngữ, nói cái gì thay đổi trên màn hình chứ không nói tên hàm.
5. **Màn hẹp.** Mọi bảng phải chạy đúng ở 360 · 414 · 820 · 1280 · 1920px. Bảng rộng hơn khung
   nhìn thì cuộn trong chính nó, **không để cả trang trượt ngang**.
6. **Di trú, không xoá.** Mỗi lần đổi cấu trúc dữ liệu phải có migration chạy được trên bản sao
   database thật, kiểm `PRAGMA foreign_key_check`, và chạy lần hai không đổi gì thêm.
7. **Chạy `npm run test` trước khi push.** Vòng 3b để lại 161 kiểm tra nghiệp vụ đạt.

---

## Phase 1 — Lõi case *(làm trước, quan trọng nhất)*

Đây là phần owner nói **"phải triển khai trong đợt code gần nhất"**. Mọi bảng ở phase 3 đều
đếm từ dữ liệu này; làm sau sẽ phải đếm lại.

### Việc

| # | Nội dung | Mục prompt |
|---|---|---|
| 1.1 | **Sửa ngay 2 lỗi owner nhìn thấy**: bộ lọc chi nhánh không ăn; SOS lớn hơn sĩ số | 10.3 |
| 1.2 | Đổi đơn vị case sang **học viên × hạng mục**, case sống xuyên suốt, có mốc theo từng MT | 7.16 |
| 1.3 | Gộp hai việc trao đổi vào **case Ý thức/Khác**; bỏ `student_contacts`, `ContactPanel`, nhóm việc `contact`; di trú dữ liệu cũ | 7.12, 9.1 |
| 1.4 | Sinh case sau MT theo đúng quy tắc W1/W2 và SOS ở mục 2 của tài liệu chốt | 7.12 |
| 1.5 | Pop-up **cảnh báo case trùng** khi GV thêm case cho hạng mục đã có case chưa xong | 7.13 |
| 1.6 | Thời gian theo dõi + **chốt kết quả case** (3 lựa chọn), chỉ mở khi mọi phương án đã có kết quả | 7.14, 7.16 |
| 1.7 | Phương án Ý thức/Khác: **đã hoàn thành + ngày thực hiện**, ghi chú tuỳ chọn | 7.15 |
| 1.8 | **Bỏ hẳn** "Điểm chính thức", "Ghi nhận của GV", bảng `skill_checkins` và mọi UI liên quan | 7.17 |
| 1.9 | **Theo dõi hỗ trợ theo kỹ năng** — 6 hạng mục, mỗi hạng mục có band MT gần nhất, lịch sử hỗ trợ, bấm vào mở màn case. *Claude tự đề xuất thiết kế* | 7.11 |
| 1.10 | **Overhaul hồ sơ học viên + màn hình case** — student journey nhìn phát ra ngay. *Claude tự đề xuất thiết kế* | 3, 7.18 |
| 1.11 | Thống nhất thuật ngữ: "+ Case", "Vấn đề - Case", **học viên**, các nhãn ở mục 11 tài liệu chốt | 11 |

### Xong khi

- Một học viên trượt Listening ở MT1 rồi trượt tiếp ở MT2 → **đúng một case Listening**, tên
  đổi thành "MT2 - Listening dưới kỳ vọng", còn nguyên phương án và kết quả của MT1.
- Case đã chốt "kết thúc hẳn" mà MT sau trượt lại → **case đó mở lại**, có mốc "tái phát".
- Hai ví dụ ở mục 2.2 tài liệu chốt sinh **đúng số case**.
- Không còn chữ "Điểm chính thức", "Ghi nhận của GV", "Nội dung cần hỗ trợ" ở bất kỳ đâu.
- Bảng tổng hợp: tổng ba cột SOS **không bao giờ lớn hơn sĩ số**.
- Chọn chi nhánh ở màn Thực trạng thì **bảng đổi theo**.

---

## Phase 2 — Dữ liệu và vận hành

Phải có trường dữ liệu mới rồi mới reset được, nếu không lại reset hai lần.

| # | Nội dung | Mục prompt |
|---|---|---|
| 2.1 | **Tuần bắt đầu học** của học viên + **tháng/năm thi dự kiến** (chỉ FT) | 7.5 |
| 2.2 | Badge **"Thiếu thông tin"** gom mọi thứ còn thiếu, hiện ở thanh lớp và dòng học viên | 7.5 |
| 2.3 | **Lịch MT mặc định của FT** sinh từ tuần bắt đầu (tuần 6, 12, 16, 20, 24); Quản lý sửa đè được và hệ thống không ghi đè lại | 7.6 |
| 2.4 | Lớp Normal hiện **đang ở tuần thứ mấy / mấy tuần**, tuần Progress và Final Test; Admin CN và Quản lý sửa tuần tiến độ | 7.6 |
| 2.5 | Đổi `prep_writing` → `writing` (**W**) ở FOU/BE/ELE, gồm nhãn và di trú dữ liệu | Q6 |
| 2.6 | **Tạo lớp và học viên** bằng panel trượt; nhập Excel rút còn **5 cột** | 7.4 |
| 2.7 | **Phân công GV**: mỗi kỹ năng một GV, đúng một GVCN, nhãn "Thiếu GV R, L" | 7.7 |
| 2.8 | **Sửa và thiết kế lại panel "Lên kế hoạch MT"** theo mục 10 tài liệu chốt | 5 |
| 2.9 | **Reset toàn bộ dữ liệu demo**, ngày demo 14/09/2026, quy mô nhỏ, đủ tình huống | 2 |
| 2.10 | Viết lại `DEMO_ASSUMPTIONS.md` và `DEMO_SCENARIOS.md` cho khớp dữ liệu mới | — |

### Xong khi

- Tạo một học viên FT mới, khai tuần bắt đầu → hệ thống **tự đề xuất** 3 tuần MT đúng mốc 6/12/16.
- Panel "Lên kế hoạch MT" chuyển được tuần, gõ được tên học viên, chọn được MT khác nhau cho
  từng em rồi xếp chung một tuần.
- Không màn nào còn số liệu lệch nhau.

---

## Phase 3 — Bảng và màn hình

Phần owner nhìn thấy nhiều nhất, nhưng chỉ đẹp khi dữ liệu dưới đã đúng.

| # | Nội dung | Mục prompt |
|---|---|---|
| 3.1 | **Bộ lọc theo vai** đúng bảng ở mục 6 tài liệu chốt, đồng bộ mọi trang | 6 |
| 3.2 | **Tab Học viên**: giữ trạng thái thu gọn/mở rộng khi lọc; thanh tab chi nhánh; badge căn phải | 8.1–8.3 |
| 3.3 | **Bảng học viên**: `Học viên · Target · Ngày thi · OVR · L · R · S · W1 · W2 · Trạng thái · Việc cần làm`; chỉ báo tăng/giảm; badge đỏ/xanh; bỏ điểm GV cạnh điểm MT | 8.4 |
| 3.4 | **Tooltip tiêu đề cột** ở mọi bảng | 8.5, 9.2 |
| 3.5 | Đổi tên **"Toàn cảnh công việc"**; bảng **"Việc cần lưu ý"** thu gọn được, hàng tổng, sắp xếp theo cột, bấm số đi đúng chỗ | 9 |
| 3.6 | **Thực trạng**: bộ lọc mới, góc nhìn mặc định theo vai, hai chế độ xem (chi nhánh/lớp và theo tuần), nhóm Normal/FT thu gọn | 10 |
| 3.7 | Nút **"+ Giao việc"** chuyển vào Thực trạng | 12 + Q8 |
| 3.8 | **Bỏ tab Báo cáo tuần** | 12 |
| 3.9 | Mở rộng **"Lớp của bạn"** lên **25–30%** chiều rộng | 1 |
| 3.10 | Overhaul **trang chi tiết lớp** | 8.6 |

---

## Phase 4 — Tài khoản

Độc lập với 1–3, làm cuối để không chặn phần chính.

| # | Nội dung | Mục prompt |
|---|---|---|
| 4.1 | Màn **đăng nhập** email + mật khẩu; tài khoản Quản trị hệ thống mặc định | 7.1 |
| 4.2 | **GV tự đăng ký** + hàng đợi chờ duyệt; kiểm tra đuôi `.pisa@gmail.com` | 7.1 |
| 4.3 | Tạo tài khoản, cấp vai, gán nhiều chi nhánh | 7.1 |
| 4.4 | **Hồ sơ cá nhân**: họ tên, kỹ năng phụ trách được, điện thoại, email(s) | 7.2 |
| 4.5 | Quản trị hệ thống: tạo/sửa lộ trình, tạo/sửa loại lớp, **cấp quyền xem theo vai hoặc theo cá nhân** | 7.3 |

---

## Điểm cần owner xác nhận khi bắt đầu phase 1

1. **Hai mốc thời hạn** (mục 3.2 tài liệu chốt): 3/5/7 ngày là hạn *làm* phương án, hết tuần MT
   sau là hạn *báo kết quả* case — đúng ý owner chứ? Hay owner chỉ muốn một mốc?
2. Thiết kế mục **7.11** và **7.18** do Claude đề xuất — trình bản phác cho owner xem **trước
   khi code xong cả phase**, để không phải làm lại.
