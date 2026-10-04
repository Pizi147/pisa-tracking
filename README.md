# Pisa Tracking — bản demo chạy trên máy

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
**13 lớp** (11 đang chạy + 2 đã kết thúc), **16 tài khoản** (mỗi chi nhánh 1 Quản lý,
10 giáo viên dùng chung cả trung tâm, cộng tài khoản Quản trị hệ thống), **41 học viên**,
**115 lượt kiểm tra** với **379 ô điểm kỹ năng**, **33 case**, **37 phương án hỗ trợ**,
**18 lần cập nhật kết quả**, **35 vi phạm** và **14 biện pháp xử lý** (phần Ý thức), và **14 việc quản lý**,
có lịch sử từ **12/2025**.

Dữ liệu **không sinh ngẫu nhiên**: mỗi em có một hành trình được viết tay theo đúng chiều đời thật —
ghi danh → chương trình → bài kiểm tra → vấn đề → phương án → cập nhật kết quả → chuyển tiếp.
**Mỗi lớp là một tình huống**: lớp đang tuần Progress Test, lớp tuần Final Test, lớp đã hết chương trình,
lớp thiếu GV bộ môn, lớp chưa có GVCN, lớp có bài quá hạn chấm. Bảng đầy đủ nằm ở `DEMO.md`.

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

**Báo trùng cổng** (`EADDRINUSE` hoặc `Port 5173 is in use`): thường là một cửa sổ khác còn đang chạy `npm run dev` — tắt nó đi. Muốn chạy song
song thì đổi cổng (PowerShell), rồi vào địa chỉ mới, ví dụ <http://localhost:5180>:

```powershell
$env:PORT='4100'; $env:WEB_PORT='5180'; npm run dev
```

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
| **Màn Tổng quan đầy đủ nhất**: đề xuất quá hạn duyệt, bài quá hạn chấm, lớp chưa có GVCN | **Trần Hải Đăng** — `dang.tran.pisa@gmail.com` (Quản lý Bãi Cháy) |
| Bảng **Việc cần lưu ý** và tab **Thực trạng** của một chi nhánh đông lớp | **Nguyễn Khánh Vy** — `vy.nguyen.pisa@gmail.com` (Quản lý Monbay) |
| Chốt **ngày** MT trong tuần đã có kế hoạch | **Vũ Thuỳ Dương** — `duong.vu.pisa@gmail.com` (Admin CN Monbay) |
| Góc nhìn GVCN, thấy đúng lớp mình dạy | **Trần Ngọc Hà** — `ha.tran.pisa@gmail.com` (GVCN lớp MB FT 101) |
| Giáo viên dạy ở **hai** chi nhánh, số liệu mỗi nơi đứng riêng | **Phạm Thu Trang** — `trang.pham.pisa@gmail.com` (Monbay + Bãi Cháy) |

Mỗi vai trò mở vào đúng việc thường làm nhất. Đây chỉ là lối vào, không đổi quyền.

> **Lịch MT tách làm hai bước:** Quản lý chốt **tuần** trước (`MT2 → W3 OCT`), Admin chi nhánh chốt
> **ngày** khi tới gần tuần đó (`14/10`). Speaking có thể khác ngày nhưng vẫn là cùng một lượt MT.
> Lịch **chỉ có ngày, không có giờ**.

> **Chỉ có mười phút?** Mở [`DEMO.md`](DEMO.md) — **sáu hồ sơ học viên nên mở
> đầu tiên**, mỗi hồ sơ minh hoạ một tình huống khác nhau (đi qua ba chương trình · hỗ trợ có tác
> dụng · case tái diễn · đổi phương án giữa chừng · bàn giao khi chuyển lớp · kết quả thi thật),
> kèm hướng dẫn bấm vào đâu, đăng nhập bằng ai, và cần thấy gì.

Muốn đổi tài khoản bất cứ lúc nào: bấm nút **"Đổi tài khoản demo"** ở thanh trên cùng.

Xem `DEMO.md` để biết nên bấm vào đâu và kỳ vọng thấy gì.

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

Bộ dữ liệu gốc: **13 lớp · 41 học viên · 10 giáo viên · 5 chi nhánh**, đủ bốn chương trình Foundation ·
Beginner · Elementary · Fast Track, ngày demo cố định **14/09/2026**. Chạy lại nhiều lần cho ra
đúng bộ cũ, không nhân đôi bản ghi nào. Danh sách từng tình huống và chỗ bấm để xem nằm ở
[`DEMO.md`](DEMO.md).

> Chạy `npm run seed` là **mất hết** những gì bạn đã nhập tay. Muốn giữ lại thì copy tệp
> `data/pisa-demo.sqlite` ra chỗ khác **trước khi** chạy.

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
→ Bản npm mới chặn bước cài đặt của một số gói vì lý do an toàn. Thư viện database (`libsql`)
tải sẵn tệp chạy cho từng hệ điều hành nên không cần bước này. Nếu sau đó chạy bị lỗi database,
hãy chạy lại lệnh này rồi thử:

```bash
npm install
```

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
  xem phần B của `DEMO.md` để biết cái nào cần chốt trước khi làm thật.

Tài liệu liên quan:

- **`plan.md`** — **kế hoạch duy nhất**: đã làm, còn lại, thứ tự đợt, model, prompt
- **`thiet-ke/`** — **nguồn luật và đặc tả hiện hành.** Bắt đầu ở `thiet-ke/README.md`.
  Chỗ nào mâu thuẫn với tài liệu khác thì `thiet-ke/` thắng:
  - `NGUON-Rule-Y-thuc-2026-09-21.md` — nguồn mới nhất của chủ sản phẩm
  - `PISA-Rulebook-2026-09-19.md` — luật sản phẩm; **mục 18 là bản mới nhất**
  - `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` — đặc tả Vi phạm và Biện pháp xử lý
  - `BAN_DO_OVERHAUL.md` — yêu cầu nào của design plan đã có, cái nào chưa
  - `PISA-Design-Plan-after-PR28.md` — đặc tả thiết kế; mục 17–22 là bản mới nhất

> **Đã xoá 21/09/2026:** `BAN_GIAO*.md` (bàn giao giữa các chat cũ),
> `PISA_Design_Master_Reference.md` và `PRODUCT_DEMO_SPEC.md` (đã bị `thiet-ke/` thay hẳn),
> `vong4/` (đã xong từ lâu). Chúng là **lịch sử, không phải luật**, và giữ lại chỉ tạo rủi ro
> đọc phải luật cũ. Cần tra lại thì dùng `git log`.
- `DEMO.md` — **một tệp cho cả bản demo**: mục lục kịch bản D1–D18 ở đầu, Ý thức v4 (mục 1), sáu hồ sơ nên mở đầu tiên, bảng
  kịch bản J01–J12, SOS · lịch MT · lớp thường · chuyển lớp · Phân tích giáo viên (mục 9–17), và (phần B) những điều đã chốt
  cùng những điểm còn treo
- `CODE_MAP.md` — bản đồ mã nguồn, dành cho người sẽ tiếp tục xây phần mềm

---

## 11. Bản chính trên mạng (Netlify + Turso)

Bản chính (giáo viên dùng thật) chạy trên **Netlify**, dữ liệu ở **Turso**, tệp tải lên ở **Netlify Blobs**. Mọi bước —
tạo database, đặt biến môi trường, khởi tạo, deploy, sao lưu — nằm trong **`TRIEN_KHAI.md`**, viết cho người không cần
biết code. **Reset bản chính (10/2026): `TRIEN_KHAI.md` mục 1a "Reset bản chính"** — mười bước, làm một lần sau PR-DEPLOY.
Kế hoạch kỹ thuật cũ (PR-Z2, PR-DEPLOY) đã gộp vào lịch sử git: `git show 575e898d:docs/superpowers/plans/`.

**Máy dev không đổi gì:** `npm run dev`, `npm run seed`, `npm test`, `npm run check`, `npm run migrate` vẫn chạy như trên
với file `data/pisa-demo.sqlite`. Các lệnh chỉ dùng cho bản chính:

| Lệnh | Tác dụng |
|---|---|
| `npm run init-ban-chinh` | Khởi tạo database bản chính **rỗng** (bảng, vai trò, chi nhánh, một tài khoản quản trị). Database đã có dữ liệu → từ chối, không ghi gì |
| `npm run kiem-sau-init` | CHỈ ĐỌC: kiểm database vừa khởi tạo — bảng nền, chi nhánh, không dữ liệu demo, không tài khoản mang mật khẩu demo, khoá ngoại. Dòng cuối `Đạt.` hoặc `CÓ VẤN ĐỀ` |
| `npm run xoa-kho-tep` | Xoá sạch kho tệp bằng chứng của database đang trỏ tới (chỉ khi reset tại chỗ, mục 1a). Bắt gõ lại tên kho; kho database thử bị từ chối |
| `npm run them-chi-nhanh -- MÃ "Tên"` | Thêm một chi nhánh. Mã đã có → từ chối |
| `npm run sao-luu` | Chép toàn bộ database (và tệp bằng chứng) ra một file `.sqlite` mang tên database; giữ 14 bản mỗi database. Chỉ đọc database |
| `npm run khoi-phuc` | Chép một file sao lưu vào một database **mới, hoàn toàn trống** (`TRIEN_KHAI.md` mục 11.2). Đích đã có dữ liệu → từ chối |

`npm run seed` **từ chối** chạy khi đang trỏ tới Turso (nó xoá sạch database); `npm run migrate` vào Turso cần xác nhận
(`TRIEN_KHAI.md` mục 11.1).
