# PISA Progress — bản demo chạy trên máy

Đây là **bản demo nội bộ** của hệ thống quản lý học vụ và vận hành PISA IELTS, dùng để bạn
bấm thử giao diện và phát hiện chỗ chưa hợp lý **trước khi** xây sản phẩm thật.

Bản demo lấy **Mock Test** làm trung tâm và nối liền: lịch thi → nhập điểm từng kỹ năng →
kết luận SOS → ghi nhận xử lý → công việc trong họp tuần.

> **Toàn bộ dữ liệu trong bản demo là dữ liệu giả.** Không có tên, số điện thoại hay thông tin
> thật của học viên. Bản demo chỉ chạy trên máy của bạn, không kết nối internet,
> không cần tài khoản dịch vụ nào.

---

## 1. Cần chuẩn bị gì

Chỉ cần **Node.js phiên bản 20 trở lên** (khuyến nghị bản **LTS**).

Kiểm tra bằng cách mở Terminal (macOS) hoặc PowerShell (Windows) và gõ:

```bash
node -v
```

Nếu báo lỗi hoặc số phiên bản nhỏ hơn 20, tải bản LTS tại <https://nodejs.org> rồi cài đặt.

---

## 2. Cài đặt (chỉ làm một lần)

Mở Terminal, đi tới thư mục dự án rồi chạy:

```bash
npm install
```

Lệnh này tải các thư viện cần thiết. Lần đầu có thể mất 1–2 phút.

---

## 3. Tạo dữ liệu mẫu (chỉ làm một lần)

```bash
npm run seed
```

Lệnh này tạo lại toàn bộ dữ liệu giả: **5 chi nhánh** (Monbay, Bãi Cháy, Cẩm Phả, Hải Dương, Uông Bí),
**10 lớp**, **43 tài khoản**, khoảng **71 học viên**, gần **170 lượt Mock Test** kèm điểm từng kỹ năng,
các case SOS ở đủ mức tiến độ, báo cáo họp tuần và công việc.

Màn hình sẽ in ra bảng tóm tắt số lượng bản ghi đã tạo.

---

## 4. Chạy ứng dụng

```bash
npm run dev
```

Một lệnh này chạy **cả giao diện lẫn máy chủ dữ liệu**. Khi thấy dòng:

```
➜  Local:   http://localhost:5173/
```

thì mở trình duyệt và vào địa chỉ: **<http://localhost:5173>**

Để dừng ứng dụng, quay lại Terminal và bấm `Ctrl + C`.

---

## 5. Đăng nhập thử

Màn hình đầu tiên là danh sách **tài khoản mẫu**. Bấm vào một tài khoản là vào luôn,
không cần mật khẩu.

Bản demo có **bốn nhóm tài khoản**: Admin · Admin chi nhánh · Quản lý · Giáo viên.
Màn hình chọn tài khoản đã nhóm sẵn theo bốn loại này.

Gợi ý tài khoản nên dùng đầu tiên:

| Muốn xem gì | Chọn tài khoản |
|---|---|
| Toàn cảnh cả hệ thống + phần Quản trị | **Đặng Quang Nhi** — Admin |
| Toàn cảnh một chi nhánh, họp tuần, xử lý SOS | **Đặng Quang Vy** — Quản lý Monbay |
| Quản lý thứ hai cùng chi nhánh (thử nhiều quản lý) | **Trần Quang Nam** — Quản lý Monbay |
| Màn hình nhập điểm của giáo viên bộ môn | **Trần Hải Đạt** — dạy Listening + Reading lớp MB-FT 101 |
| Giáo viên chỉ dạy Writing Task 1 | **Hoàng Khánh Huy** — W1 lớp MB-FT 101 |
| Góc nhìn giáo viên chủ nhiệm | **Đinh Bảo Vy** — GVCN lớp MB-FT 101 |
| Quyền trong phạm vi một chi nhánh | **Đặng Ngọc Phúc** — Admin chi nhánh Monbay |

Giáo viên đăng nhập sẽ vào thẳng danh sách **Mock cần nhập điểm** của mình; các vai trò khác vào **Tổng quan**.

Muốn đổi tài khoản bất cứ lúc nào: bấm nút **"Đổi tài khoản demo"** ở thanh trên cùng.

Xem `DEMO_SCENARIOS.md` để biết nên bấm vào đâu và kỳ vọng thấy gì.

---

## 6. Dữ liệu được lưu ở đâu

Toàn bộ dữ liệu nằm trong **một tệp duy nhất** trên máy bạn:

```
data/pisa-demo.sqlite
```

- Mọi thay đổi bạn nhập trên giao diện đều được ghi thật vào tệp này.
- Dữ liệu **giữ nguyên** khi bạn tải lại trang hoặc tắt và mở lại ứng dụng.
- Tệp này không được đưa lên Git (đã có trong `.gitignore`).
- Muốn sao lưu trạng thái đang thử: copy tệp đó ra chỗ khác.

---

## 7. Xoá hết và tạo lại dữ liệu ban đầu

Khi bạn đã nhập lung tung và muốn quay về trạng thái sạch:

```bash
npm run seed
```

Lệnh này **xoá toàn bộ thay đổi** của bạn và dựng lại dữ liệu gốc.
Bạn có thể chạy ngay cả khi ứng dụng đang chạy — giao diện sẽ thấy dữ liệu mới sau khi tải lại trang.

---

## 8. Các lệnh khác

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy giao diện + máy chủ dữ liệu |
| `npm run seed` | Xoá và tạo lại dữ liệu mẫu |
| `npm test` | Chạy các kiểm tra tự động (dùng database riêng, không đụng dữ liệu bạn đang thử) |
| `npm run build:server` | Biên dịch lại mã máy chủ (thường không cần gọi trực tiếp) |
| `npm run typecheck` | Kiểm tra lỗi kiểu dữ liệu trong mã nguồn |
| `npm run build` | Đóng gói bản giao diện |

---

## 9. Nếu gặp trục trặc

**Mở trang nhưng không thấy tài khoản nào để chọn**
→ Bạn chưa chạy `npm run seed`. Trang sẽ hiện sẵn hướng dẫn từng bước — làm theo là được.

**Gõ lệnh nhưng báo lỗi `ENOENT ... package.json`**
→ Bạn đang đứng sai thư mục. Lệnh phải được gõ trong thư mục **có tệp `package.json`**.
Mẹo: mở thư mục đó trong File Explorer, bấm vào thanh địa chỉ, gõ `powershell` rồi Enter —
cửa sổ lệnh sẽ mở sẵn đúng chỗ. Gõ `dir` để kiểm tra: phải thấy `package.json` trong danh sách.

**Lệnh `npm run seed` bị dừng giữa chừng, hiện `Assertion failed` hoặc `Cannot find module`**
→ Lỗi của các bản cũ trên Windows, đã được sửa. Hãy tải lại bản mới nhất rồi chạy lại
`npm install` và `npm run seed`.

**Khi cài đặt thấy dòng `npm warn install-scripts ... allowScripts`**
→ Bản npm mới chặn bước cài đặt của một số gói vì lý do an toàn. Nếu sau đó chạy bị lỗi
database, hãy chạy hai lệnh này rồi thử lại:

```bash
npm install-scripts approve better-sqlite3
npm install
```

Nếu máy bạn không nhận lệnh đầu tiên, dùng: `npm rebuild better-sqlite3`

**Báo `EADDRINUSE` (cổng đang bị chiếm)**
→ Có một bản ứng dụng khác đang chạy. Đóng Terminal cũ, hoặc đổi cổng máy chủ:
`PORT=4001 npm run dev` (nhớ sửa cổng tương ứng trong `vite.config.ts`).

**Đăng nhập bằng tài khoản giáo viên nhưng danh sách trống**
→ Bình thường: giáo viên chỉ thấy lớp mình được phân công, và bộ lọc tuần có thể đang ở tuần không có
lượt Mock nào. Bấm **"Điểm tôi cần nhập"** để xem xuyên tuần, hoặc **"Tất cả"** rồi đổi ô **Tuần**.

**Đổi tài khoản nhưng vẫn thấy dữ liệu của tài khoản cũ**
→ Không nên xảy ra: hệ thống tự xoá bộ nhớ đệm khi đổi tài khoản. Nếu gặp, hãy chụp màn hình
và báo lại — đây là lỗi cần sửa.

**Muốn xem giao diện lúc đang tải / không có dữ liệu / bị lỗi**
→ Bấm **"Công cụ demo"** trên thanh trên cùng, chọn kịch bản tương ứng.
Hệ thống **không bao giờ** tự sinh lỗi ngẫu nhiên khi bạn dùng bình thường.

---

## 10. Phạm vi của bản demo

Đây là **bản thử giao diện**, không phải sản phẩm thật:

- Đăng nhập bằng cách chọn tài khoản mẫu — **không phải cơ chế bảo mật dùng cho production**.
  Máy chủ tự quyết định quyền của phiên đăng nhập; giao diện không thể tự khai báo quyền cho mình.
- Chạy trên máy cá nhân, không triển khai online, không có database đám mây.
- Các ngưỡng cảnh báo, bố cục màn hình và một số quy tắc là **giả định thử nghiệm** —
  xem `DEMO_ASSUMPTIONS.md` để biết cái nào cần chốt trước khi làm thật.

Tài liệu liên quan:

- `PRODUCT_DEMO_SPEC.md` — Product / Web Design: **A. Current MVP · B. Simplify–Remove · C. Future Design**
- `DEMO_ASSUMPTIONS.md` — các câu đã chốt (Q1–Q4) và những điểm còn cần bạn xác nhận
- `DEMO_SCENARIOS.md` — **ba luồng chính** để bấm thử, bảng kiểm tra quyền, các tình huống cài sẵn
