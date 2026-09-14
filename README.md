# PISA Progress — bản demo chạy trên máy

Đây là **bản demo nội bộ** của hệ thống quản lý học vụ và vận hành PISA IELTS, dùng để bạn
bấm thử giao diện và phát hiện chỗ chưa hợp lý **trước khi** xây sản phẩm thật.

Trung tâm của bản demo là **hồ sơ học viên**: em bắt đầu ở đâu, đang ở đâu, đích ở đâu, đang vướng gì,
ai đã làm gì để hỗ trợ, quan sát được gì sau đó, và bước tiếp theo là gì.

**Hai mục điều hướng, không hơn:** **Tổng quan** · **Học viên**.

- **Tổng quan** — *"tôi phải làm gì bây giờ"*. Mỗi dòng là một học viên, một câu lý do, và một nút mà
  **chính người đang xem** bấm được. Việc bạn không có quyền làm thì không xuất hiện.
- **Học viên** — *"lớp tôi đang thế nào"*. Vào theo lớp: lớp → học viên → tiến độ → xếp lịch → nhập điểm.

Quản lý có thêm tab **Thực trạng** ngay trong Tổng quan — *"học viên đang yếu ở đâu"* — vì hai câu
hỏi đó cần cả hai, nhưng không cần cùng lúc.

Mock test không còn là menu riêng — lịch và điểm nằm ngay trong lớp của học viên. Hồ sơ cá nhân và
Quản trị hệ thống là lối vào phụ trong menu tài khoản.

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
**9 lớp** (6 lớp FT + 3 lớp Normal Foundation/Elementary), **26 tài khoản** (mỗi chi nhánh 1 Quản lý +
1 Admin văn phòng + 3 giáo viên, cộng tài khoản Quản trị hệ thống), **62 học viên**, **168 lượt Mock Test**
và các bài kiểm tra lớp Normal kèm điểm từng kỹ năng, **138 case sinh từ điểm** cộng **8 case giáo viên
tự báo**, với **242 việc đã làm** và **51 lần xem lại**, cùng báo cáo tuần và công việc.

Quy mô cố tình **nhỏ**, và **mỗi lớp là một tình huống** — lớp sắp Final Test, lớp đang trong tuần
Progress Test, lớp đã hết chương trình, lớp thiếu GV, lớp chưa có GVCN, case kéo dài qua ba lượt MT.
Bảng đầy đủ nằm ở `DEMO_SCENARIOS.md`.

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

Màn hình đầu tiên có **ba cách vào**:

| Cách | Dùng khi nào |
|---|---|
| **Đăng nhập** | Đường thật: email + mật khẩu. Tài khoản Quản trị hệ thống mặc định là `dovutuanphong95.pisa@gmail.com`, mật khẩu `pisa2026` |
| **Giáo viên đăng ký** | Thử luồng tự đăng ký: khai chi nhánh rồi chờ Quản trị hệ thống duyệt |
| **Vào nhanh bằng tài khoản demo** | Bấm một tài khoản là vào, **không cần mật khẩu** — dùng cái này khi muốn đổi vai liên tục để so sánh màn hình |

Mọi tài khoản mẫu dùng chung mật khẩu **`pisa2026`**, email theo mẫu `ten.ho.pisa@gmail.com`
(ví dụ `ha.tran.pisa@gmail.com`). Chỉ email đuôi **`.pisa@gmail.com`** mới hợp lệ — áp cho mọi vai.

> Bản demo **không gửi email thật** và **không có luồng quên mật khẩu**. Quên thì vào
> **Quản trị hệ thống → Tài khoản → Sửa** để đặt lại hộ.

Bản demo có **bốn nhóm tài khoản**. Màn hình "Vào nhanh" đã nhóm sẵn theo bốn loại này:

| Nhóm | Là ai |
|---|---|
| **Quản trị hệ thống** | Người quản trị **phần mềm**: tài khoản, vai trò, cấu hình. Không phải chức danh vận hành |
| **Admin chi nhánh** | Nhân sự **văn phòng** chi nhánh: danh sách lớp, giáo viên, việc trung gian giữa các phòng ban |
| **Quản lý** | Điều hành chuyên môn của chi nhánh. Chốt tuần kế hoạch, xem toàn cảnh vấn đề học vụ, kết thúc theo dõi |
| **Giáo viên** | GVCN và/hoặc GVBM, quyền theo phân công lớp và kỹ năng |

Gợi ý tài khoản nên dùng đầu tiên:

| Muốn xem gì | Chọn tài khoản |
|---|---|
| Toàn cảnh cả hệ thống, quản trị tài khoản và danh mục | **Đỗ Vũ Tuấn Phong** — `dovutuanphong95.pisa@gmail.com` |
| Bảng **Việc cần lưu ý**, tab **Thực trạng**, chốt **tuần** kế hoạch | **Trần Ngọc Hà** — `ha.tran.pisa@gmail.com` (Quản lý Monbay) |
| **Duyệt phương án hỗ trợ** (có một đề xuất đã quá hạn duyệt) | **Đặng Thanh Quân** — `quan.dang.pisa@gmail.com` (Quản lý Bãi Cháy) |
| Chốt **ngày** MT trong tuần đã có kế hoạch | **Đặng Bảo Khoa** — `khoa.dang.pisa@gmail.com` (Admin CN Monbay) |
| Góc nhìn GVCN, dạy nhiều kỹ năng (L · W2 · S) | **Đỗ Thu Huy** — `huy.do.pisa@gmail.com` (GVCN lớp MB-FT 101) |
| Giáo viên chỉ dạy một kỹ năng | **Đỗ Minh Chi** — `chi.do.pisa@gmail.com` (W1 lớp MB-FT 101) |

Mỗi vai trò mở vào đúng việc thường làm nhất. Đây chỉ là lối vào, không đổi quyền.

> **Lịch MT tách làm hai bước:** Quản lý chốt **tuần** trước (`MT2 → W3 OCT`), Admin chi nhánh chốt
> **ngày** khi tới gần tuần đó (`14/10`). Speaking có thể khác ngày nhưng vẫn là cùng một lượt MT.
> Lịch **chỉ có ngày, không có giờ**.

> **Muốn xem nhanh phần mới nhất?** Đăng nhập bằng tài khoản Quản trị hệ thống: màn **Tổng quan** mở ra
> có bảng **Việc cần lưu ý** (thu gọn được, sắp theo cột, bấm số là đi đúng chỗ) và nhóm **Mốc của lớp**
> với ba lớp Normal đang ở ba trạng thái khác nhau. Đổi sang tab **Thực trạng** để xem hai chế độ
> chi nhánh/lớp và theo tuần. `DEMO_SCENARIOS.md` đi qua đủ mười sáu luồng, kể cả tự đăng ký và duyệt
> tài khoản, cấp quyền riêng cho một người, và sửa lộ trình / loại lớp.

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

Bộ dữ liệu gốc: **11 lớp · 71 học viên · 5 chi nhánh**, đủ bốn chương trình Foundation ·
Beginner · Elementary · Fast Track, ngày demo cố định **14/09/2026**. Chạy lại nhiều lần cho ra
đúng bộ cũ, không nhân đôi bản ghi nào. Danh sách từng tình huống và chỗ bấm để xem nằm ở
[`DEMO_SCENARIOS.md`](DEMO_SCENARIOS.md).

---

## 8. Các lệnh khác

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy giao diện + máy chủ dữ liệu |
| `npm run seed` | **Xoá** và tạo lại dữ liệu mẫu |
| `npm run migrate` | Nâng cấp database đang có lên schema mới, **không xoá dữ liệu** |
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

- **`vong4/`** — bộ tài liệu bàn giao **vòng 4 đang chạy**. Bắt đầu ở `vong4/README.md`.
  Chỗ nào mâu thuẫn với các tài liệu bên dưới thì `vong4/` thắng
- `PISA_Design_Master_Reference.md` — sổ quyết định: trạng thái từng quyết định, cái gì đã chốt, cái gì còn chờ
- `PRODUCT_DEMO_SPEC.md` — Product / Web Design: **A. Current MVP · B. Simplify–Remove · C. Future Design**
- `DEMO_ASSUMPTIONS.md` — các câu đã chốt (Q1–Q15) và những điểm còn cần bạn xác nhận
- `DEMO_SCENARIOS.md` — **mười chín luồng** để bấm thử, bảng kiểm tra quyền, các tình huống cài sẵn.
  Phần mới nhất bắt đầu từ **Luồng 15**
