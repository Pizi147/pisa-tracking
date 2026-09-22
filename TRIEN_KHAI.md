# Đưa bản chính lên mạng — hướng dẫn từng bước

Viết 21/09/2026 cho chủ sản phẩm — **không cần biết code**. Làm đúng thứ tự, mỗi bước chỉ làm một việc.
Kế hoạch kỹ thuật phía sau: `docs/superpowers/plans/2026-09-21-ban-chinh-netlify-turso.md`.

> Các lệnh `init-ban-chinh`, `sao-luu`, `them-chi-nhanh` do các PR-Z2 tạo ra. **Chưa merge PR-Z2a/Z2b thì chưa chạy
> được** — đừng lo nếu thử trước mà báo lỗi.

---

## 0. Đọc trước — năm điều cơ bản

### 0.1. Mở PowerShell **đúng thư mục dự án**

1. Mở **File Explorer**, đi tới thư mục dự án:
   `C:\Users\Admin\Downloads\Github\Pisa students tracking\pisa-tracking`
2. Bấm vào **thanh địa chỉ** ở trên cùng (chỗ hiện đường dẫn), xoá hết, gõ `powershell`, bấm **Enter**.
3. Một cửa sổ xanh/đen hiện ra, dòng cuối có chữ `...pisa-tracking>` — đúng thư mục rồi.

### 0.2. Dán và chạy một lệnh

- **Copy** lệnh trong khung xám ở file này → sang PowerShell **bấm chuột phải** (tự dán) → bấm **Enter**.
- Chờ tới khi dòng cuối lại hiện `...pisa-tracking>` mới dán lệnh tiếp theo.
- Chữ đỏ = có lỗi → **chụp màn hình gửi session thiết kế**, đừng thử lung tung.

### 0.3. Chỗ nào phải tự thay

Trong lệnh, phần nằm trong dấu `<...>` là **chỗ bạn thay bằng giá trị của mình**, và **xoá luôn cả dấu `<` `>`**.

> Ví dụ: `netlify env:set BAN_CHINH <giá trị>` → gõ thành `netlify env:set BAN_CHINH 1`

Những chỗ nằm trong dấu ngoặc kép `"..."` thì **giữ dấu ngoặc kép**, chỉ thay phần bên trong.

### 0.4. Luôn cập nhật mã mới nhất trước khi làm gì

Mỗi lần bắt đầu, chạy hai lệnh này (lấy bản mới nhất đã merge trên GitHub về máy):

```powershell
git checkout main
git pull
```

Dòng cuối có chữ `Already up to date.` hoặc danh sách file thay đổi là được.

### 0.5. Hai loại "mật khẩu máy" — giữ kín

| Thứ | Là gì | Giữ ở đâu |
|---|---|---|
| **Token Turso** | Chìa khoá vào database | Một file ghi chú **trên máy bạn**, không gửi nhóm chat, không dán lên GitHub |
| **Mật khẩu quản trị** | Mật khẩu bạn đăng nhập web | Trong đầu hoặc trình quản lý mật khẩu. **Không** đưa cho session Claude nào |

Token của database **thử** thì được đưa cho session coding (nó cần để kiểm). Token của database **bản chính** thì
**chỉ bạn** dùng.

---

## 1. Toàn cảnh — ba dịch vụ, và làm mục nào lúc nào

| Mảnh | Dịch vụ | Chứa gì | Chi phí |
|---|---|---|---|
| Giao diện + máy chủ | **Netlify** | Các trang web và phần xử lý (chỉ chạy khi có người bấm) | Miễn phí |
| Dữ liệu | **Turso** | Học viên, điểm, case, vi phạm… | Miễn phí |
| Tệp tải lên | **Netlify Blobs** | Ảnh, thư cảnh cáo, bằng chứng | Miễn phí, nằm sẵn trong Netlify |

**Bạn deploy thủ công** bằng một lệnh từ thư mục trên máy (mục 8). Merge PR trên GitHub **không** tự làm web thay đổi.

> **Vì sao không kéo-thả thư mục lên Netlify?** Kéo-thả chỉ đưa lên các trang giao diện, **bỏ lại phần máy chủ** —
> web sẽ hiện màn đăng nhập nhưng bấm gì cũng lỗi. Lệnh ở mục 8 đưa lên **cả hai**.

| Khi nào | Làm mục nào | Ai nhắc bạn |
|---|---|---|
| Khi session **PR-Z2a** hỏi (lần 1) | Mục 2 — chỉ tạo database **thử** | Session Z2a |
| Khi session **PR-Z2a** hỏi (lần 2) | Mục 3, 4, 5 | Session Z2a |
| Khi session **PR-Z2c** hỏi | Mục 2 — tạo database **bản chính** · mục 6 · mục 7 | Session Z2c |
| Session Z2c xin phép đưa lên chính thức | Mục 8.2 (hoặc để nó chạy) | Session Z2c |
| Sau khi lên mạng | Mục 9 · mục 10 hằng tuần | — |

---

## 2. Tạo database trên Turso

Làm **hai lần**: lần đầu tên `pisatracking-demo` (thử), lần sau tên `pisatracking` (bản chính). Cách làm giống hệt.

> **Hai tên gần giống nhau — khi dán URL, nhìn kỹ có chữ `-demo` hay không.** Có `-demo` = database **thử**. Không có
> `-demo` = database **bản chính** (dữ liệu thật).

1. Vào <https://app.turso.tech> → **Sign up / Log in** → chọn **Continue with GitHub** → cho phép.
2. Lần đầu vào có thể phải đặt tên tổ chức (organization) — gõ `pisa` là được.
3. Bấm nút **Create Database** (hoặc **New Database**).
4. Ô **Name**: gõ `pisatracking-demo` (lần sau: `pisatracking`).
5. Ô **Location / Region / Group**: chọn vùng **AWS US East (Ohio)** — thường ghi `aws-us-east-2` hoặc có chữ
   **Ohio**. Không có Ohio thì chọn **US East (Virginia)** / `aws-us-east-1`.
   *Lý do:* máy chủ Netlify mặc định đặt ở Ohio; database ở gần thì web nhanh hơn nhiều. **Hai database chọn cùng
   một vùng.**
6. Bấm **Create**. Chờ vài giây tới khi database hiện trong danh sách.
7. Bấm vào tên database vừa tạo. Tìm và **copy hai thứ** vào một file ghi chú trên máy:

   | Thứ | Trông như thế nào | Ở đâu trên trang |
   |---|---|---|
   | **URL** | `libsql://pisatracking-demo-<tên-bạn>.aws-us-east-2.turso.io` | Dòng có chữ **URL** hoặc **Database URL** ở đầu trang |
   | **Token** | Một chuỗi rất dài, bắt đầu bằng `eyJ...` | Bấm **Create Token** (hoặc **Generate Token**) → quyền **Read & Write** (đọc và ghi) → thời hạn **Never** (không hết hạn) → **Create** → copy **ngay** (token chỉ hiện một lần) |

8. Ghi rõ trong file ghi chú token nào của database nào, ví dụ:
   ```text
   THỬ   URL:   libsql://pisatracking-demo-xxx.aws-us-east-2.turso.io
   THỬ   Token: eyJ...
   CHÍNH URL:   libsql://pisatracking-xxx.aws-us-east-2.turso.io
   CHÍNH Token: eyJ...
   ```

---

## 3. Cài và đăng nhập Netlify CLI (một lần duy nhất)

"Netlify CLI" là công cụ gõ lệnh để gửi web từ máy bạn lên Netlify.

1. Nếu chưa có tài khoản: vào <https://app.netlify.com> → **Sign up** → **GitHub** hoặc **Email**.
2. Mở PowerShell đúng thư mục (mục 0.1), chạy:
   ```powershell
   npm install -g netlify-cli
   ```
   Chờ 1–3 phút. Kiểm lại:
   ```powershell
   netlify --version
   ```
   Hiện ra một dòng có số phiên bản là được.
3. Đăng nhập:
   ```powershell
   netlify login
   ```
   Trình duyệt tự mở trang Netlify → bấm **Authorize**. Quay lại PowerShell thấy chữ `You are now logged into your
   Netlify account!` là xong.

---

## 4. Tạo site Netlify (một lần duy nhất)

Vẫn trong PowerShell đúng thư mục:

```powershell
netlify sites:create --name pisa-progress
```

- Nếu nó hỏi chọn **team** → dùng mũi tên lên/xuống chọn team của bạn → **Enter**.
- Nếu báo tên `pisa-progress` **đã có người dùng** → chạy lại lệnh với tên khác, ví dụ `pisa-progress-qn`.
  **Ghi lại tên đã dùng** — gọi là `<tên-site>` ở các bước sau.

Rồi nối thư mục này với site vừa tạo:

```powershell
netlify link --name <tên-site>
```

Thấy chữ `linked` hoặc `already linked` là được. Địa chỉ web của bạn sẽ là `https://<tên-site>.netlify.app`.

> **Không** bấm nối site với GitHub trên trang Netlify — bạn đã chọn deploy thủ công.

---

## 5. Đặt biến môi trường cho site — dùng database **thử**

"Biến môi trường" là mấy thông tin cài sẵn trên Netlify để web biết nối vào database nào. Chạy **ba lệnh**, thay
`<...>` bằng URL và token của database **THỬ** (mục 2, bước 8):

```powershell
netlify env:set TURSO_DATABASE_URL "<URL database THỬ>"
netlify env:set TURSO_AUTH_TOKEN "<Token database THỬ>"
netlify env:set BAN_CHINH 1
```

Mỗi lệnh thấy chữ `Set environment variable` là được. Kiểm lại:

```powershell
netlify env:list
```

Phải thấy đủ ba tên `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BAN_CHINH`.

Các biến này hiện áp cho **mọi** loại deploy (bản nháp lẫn bản chính thức); mục 6 sẽ tách riêng database cho bản
chính thức.

Xong mục này → báo session Z2a: **"đã xong mục 3-4-5 với database thử"**.

---

## 6. Đặt database **bản chính** — CHỈ cho bản chính thức (khi session Z2c yêu cầu)

Bản **chính thức** (địa chỉ giáo viên dùng) nối database **CHÍNH**. Mọi bản **nháp** vẫn nối database **THỬ** như mục
5 — nên thử bản nháp không bao giờ đụng dữ liệu thật.

Chạy **hai lệnh**, dùng URL và token của database **CHÍNH** — chú ý chữ `--context production` ở cuối, **không được bỏ**:

```powershell
netlify env:set TURSO_DATABASE_URL "<URL database CHÍNH>" --context production
```

```powershell
netlify env:set TURSO_AUTH_TOKEN "<Token database CHÍNH>" --context production
```

Mỗi lệnh thấy dòng `Set environment variable ... in the production branch` là được. (Dòng đó in lại cả giá trị vừa
đặt — xong mục này **đóng cửa sổ PowerShell** để token không còn nằm trên màn hình.)

Rồi kiểm lại (hai lệnh này chỉ in **URL**, không in token):

```powershell
netlify env:get TURSO_DATABASE_URL --context production
```

```powershell
netlify env:get TURSO_DATABASE_URL --context deploy-preview
```

| Lệnh | Phải in ra |
|---|---|
| `--context production` | `libsql://pisatracking-<...>` — **không** có chữ `-demo` |
| `--context deploy-preview` | `libsql://pisatracking-demo-<...>` — **có** chữ `-demo` |

Sai một trong hai → **dừng**, chụp màn hình gửi session Z2c. `BAN_CHINH` giữ nguyên `1` cho mọi deploy, không cần đặt lại.

---

## 7. Khởi tạo dữ liệu bản chính (một lần duy nhất, khi session Z2c yêu cầu)

Bước này tạo trong database chính: các bảng, các vai trò và quyền, **chi nhánh thật**, và **một tài khoản quản trị**
của bạn. Chạy trên máy bạn, PowerShell đúng thư mục, sau khi đã làm mục 0.4.

**Bước 7.1 — chuẩn bị (chỉ cần làm một lần sau mỗi lần cập nhật mã):**

```powershell
npm install
```

**Bước 7.2 — điền năm giá trị.** Copy khối dưới vào Notepad, thay đủ năm chỗ `<...>`, rồi mới dán sang PowerShell:

```powershell
$env:TURSO_DATABASE_URL="<URL database CHÍNH>"
$env:TURSO_AUTH_TOKEN="<Token database CHÍNH>"
$env:ADMIN_EMAIL="<email quản trị của bạn>"
$env:ADMIN_PASSWORD="<mật khẩu quản trị mới>"
$env:CHI_NHANH="<danh sách chi nhánh>"
npm run init-ban-chinh
```

| Chỗ thay | Điền gì | Ví dụ |
|---|---|---|
| `URL database CHÍNH` | URL ở mục 2 (dòng CHÍNH) — **không** có chữ `-demo` | `libsql://pisatracking-xxx.aws-us-east-2.turso.io` |
| `Token database CHÍNH` | Token ở mục 2 (dòng CHÍNH) | `eyJ...` |
| `email quản trị của bạn` | Email bạn dùng đăng nhập web. **Phải có đuôi `.pisa@gmail.com`** | `dovutuanphong95.pisa@gmail.com` |
| `mật khẩu quản trị mới` | Mật khẩu **mạnh, mới** — dài ít nhất 10 ký tự, có cả chữ và số. **Không** dùng `pisa2026` | `PisaQN-2026-an-toan` |
| `danh sách chi nhánh` | Mỗi chi nhánh viết `MÃ=Tên`, cách nhau bằng dấu `;`. Mã viết liền, không dấu | `MB=Monbay;BC=Bãi Cháy` |

**Kết quả đúng:** dòng cuối báo đã tạo tài khoản quản trị và liệt kê các chi nhánh. Lệnh này **tự từ chối** nếu
database đã có dữ liệu — không bao giờ xoá dữ liệu thật, nên chạy nhầm lần hai cũng không sao.

**Sau khi chạy xong:** đóng cửa sổ PowerShell đó (để mật khẩu và token không còn nằm trong cửa sổ).

> **Tuyệt đối không chạy `npm run seed`** khi đang có biến Turso — lệnh đó dành cho máy dev và **xoá sạch database**.
> Mã đã chặn việc này, nhưng đừng thử.

**Thêm chi nhánh sau này** (hệ thống chưa có màn tạo chi nhánh):

```powershell
$env:TURSO_DATABASE_URL="<URL database CHÍNH>"
$env:TURSO_AUTH_TOKEN="<Token database CHÍNH>"
npm run them-chi-nhanh -- <MÃ> "<Tên chi nhánh>"
```

Ví dụ dòng cuối: `npm run them-chi-nhanh -- UB "Uông Bí"`.

---

## 8. Deploy — đưa bản mới lên mạng (mỗi lần có PR mới đã merge)

**8.0 — luôn làm trước:**

```powershell
git checkout main
git pull
npm install
```

**8.1 — gửi bản NHÁP (an toàn, không ảnh hưởng người đang dùng):**

```powershell
netlify deploy --build
```

Chờ 2–5 phút (lần build đầu cần mạng để tải thư viện cho Linux). Cuối cùng hiện dòng **`Website draft URL: https://<mã>--<tên-site>.netlify.app`**. Mở địa chỉ đó, đăng
nhập, bấm thử vài trang. Bản nháp luôn dùng database **thử** — thoải mái bấm thử; chỉ bản chính thức (`--prod`) mới có
dữ liệu thật. Vì vậy ở bản nháp, đăng nhập bằng **tài khoản demo** (email và mật khẩu trong `README.md`), không phải
tài khoản quản trị thật của bạn.

**8.2 — đưa lên CHÍNH THỨC** (chỉ khi bản nháp chạy tốt):

```powershell
netlify deploy --build --prod
```

Dòng cuối hiện **`Website URL: https://<tên-site>.netlify.app`** — giáo viên vào địa chỉ này sẽ thấy bản mới.

**Quay lại bản cũ khi bản mới lỗi** (1 phút, không cần lệnh): vào <https://app.netlify.com> → chọn site → mục
**Deploys** → bấm vào **bản deploy trước đó** (bản còn chạy tốt) → nút **Publish deploy**.

---

## 9. Việc đầu tiên sau khi lên mạng

1. Mở `https://<tên-site>.netlify.app` → đăng nhập bằng email và mật khẩu ở mục 7.
2. Kiểm: **không** có nút "Vào nhanh bằng tài khoản demo", ngày hiển thị là **hôm nay** — đúng như vậy.
3. **Quản trị → Tài khoản:** tạo tài khoản **Quản lý** và **Giáo viên** (hoặc để GV tự đăng ký rồi duyệt). Email của
   mọi người phải có đuôi `.pisa@gmail.com`. Chi nhánh đã có sẵn từ mục 7.
4. Tạo **lớp** → phân công GVBM từng môn + GVCN → **thêm học viên** (dán từ Excel) → xếp lịch MT.
5. Gửi địa chỉ web cho giáo viên.

---

## 10. Sao lưu — mỗi tuần một lần

Turso tự giữ dữ liệu, nhưng vẫn nên có **bản sao của riêng mình** trên Google Drive.

1. Cài **Google Drive for desktop** (<https://www.google.com/drive/download/>) nếu chưa có. Trong ổ Drive (thường là
   `G:`), tạo thư mục `pisa-sao-luu`.
2. Mỗi tuần: mở PowerShell đúng thư mục, làm mục 0.4, rồi (copy vào Notepad, thay `<...>`, dán sang):

```powershell
$env:TURSO_DATABASE_URL="<URL database CHÍNH>"
$env:TURSO_AUTH_TOKEN="<Token database CHÍNH>"
$env:BACKUP_DIR="G:\My Drive\pisa-sao-luu"
npm run sao-luu
```

Kết quả: một file `pisa-NĂM-THÁNG-NGÀY-GIỜPHÚT.sqlite` trong thư mục Drive. Máy tự giữ 14 bản mới nhất.

**Muốn sao lưu cả ảnh / thư cảnh cáo đã tải lên**, thêm hai dòng này **trước** dòng `npm run sao-luu`:

```powershell
$env:NETLIFY_SITE_ID="<Site ID>"
$env:NETLIFY_AUTH_TOKEN="<Personal access token>"
```

| Chỗ thay | Lấy ở đâu |
|---|---|
| `Site ID` | <https://app.netlify.com> → chọn site → **Site configuration** → **General** → dòng **Site ID** → copy |
| `Personal access token` | <https://app.netlify.com> → ảnh đại diện góc trên → **User settings** → **Applications** → **Personal access tokens** → **New access token** → đặt tên `sao-luu` → **Generate** → copy ngay |

---

## 11. Khi có sự cố

| Triệu chứng | Làm gì |
|---|---|
| Web báo lỗi sau một lần deploy | Quay lại bản cũ — cuối mục 8 |
| Lệnh báo chữ đỏ | Chụp màn hình cả cửa sổ PowerShell → gửi session thiết kế |
| `netlify` báo "not logged in" | Chạy lại `netlify login` (mục 3 bước 3) |
| `netlify` báo "site not linked" | Chạy lại `netlify link --name <tên-site>` (mục 4) |
| Trang tải chậm (> 3–5 giây) | Ghi lại trang nào, vai nào → gửi session thiết kế |
| Tải tệp báo lỗi | Tệp tối đa **4 MB** — nén ảnh, hoặc dán link Google Drive thay cho tệp |
| Lỡ tay làm hỏng dữ liệu | **Đừng làm gì thêm.** Gửi session thiết kế tên file sao lưu gần nhất ở Drive |
| Netlify / Turso gửi email "sắp hết hạn mức miễn phí" | Gửi session thiết kế. Nâng gói là đổi gói, **không** phải chuyển dữ liệu |

### 11.1. Nâng cấp database bản chính khi có bản mới cần

**Chỉ làm khi session code yêu cầu** (nó sẽ nói rõ "bản này cần chạy migrate"). Bình thường deploy **không** cần bước này.
Lệnh nâng cấp **giữ nguyên dữ liệu**, nhưng vẫn phải sao lưu trước. Mở PowerShell đúng thư mục, làm mục 0.4, rồi làm
đúng ba bước (copy vào Notepad, thay `<...>`, dán sang):

**Bước 1 — sao lưu trước** (như mục 10):

```powershell
$env:TURSO_DATABASE_URL="<URL database CHÍNH>"
$env:TURSO_AUTH_TOKEN="<Token database CHÍNH>"
$env:BACKUP_DIR="G:\My Drive\pisa-sao-luu"
npm run sao-luu
```

Chờ tới khi báo sao lưu xong. Báo lỗi → **dừng**, không làm bước 2.

**Bước 2 — xác nhận đúng database** (gõ tên máy chủ = URL database CHÍNH **bỏ chữ `libsql://` ở đầu**):

```powershell
$env:PISA_CHO_PHEP_MIGRATE_TURSO="<URL database CHÍNH, bỏ libsql:// ở đầu>"
```

> Ví dụ: URL là `libsql://pisatracking-xxx.aws-us-east-2.turso.io` → gõ `pisatracking-xxx.aws-us-east-2.turso.io`.

**Bước 3 — nâng cấp:**

```powershell
npm run migrate
```

**Kết quả đúng:** có dòng `Turso: bỏ qua tài khoản/mật khẩu mặc định của bản demo` và dòng cuối `Hoàn tất` hoặc
`Không có gì để nâng cấp`. Lệnh báo `TỪ CHỐI` → bước 2 gõ chưa đúng tên. Xong thì **đóng cửa sổ PowerShell**.

---

## 12. Bảng tra — mọi tên biến dùng trong file này

| Tên | Đặt ở đâu | Áp cho | Giá trị | Mục |
|---|---|---|---|---|
| `TURSO_DATABASE_URL` | Netlify (lệnh `netlify env:set`) **và** PowerShell khi chạy lệnh init/sao lưu | Netlify: **mọi deploy** = database thử (mục 5); **chỉ bản chính thức** (`--context production`) = database chính (mục 6) | URL database Turso | 5, 6, 7, 10 |
| `TURSO_AUTH_TOKEN` | Như trên | Như trên | Token database Turso | 5, 6, 7, 10 |
| `BAN_CHINH` | Netlify | Mọi deploy | `1` | 5 |
| `ADMIN_EMAIL` | PowerShell, chỉ khi chạy `init-ban-chinh` | Chỉ cửa sổ PowerShell đó | Email quản trị, đuôi `.pisa@gmail.com` | 7 |
| `ADMIN_PASSWORD` | PowerShell, chỉ khi chạy `init-ban-chinh` | Chỉ cửa sổ PowerShell đó | Mật khẩu quản trị mới | 7 |
| `CHI_NHANH` | PowerShell, chỉ khi chạy `init-ban-chinh` | Chỉ cửa sổ PowerShell đó | `MÃ=Tên;MÃ=Tên` | 7 |
| `BACKUP_DIR` | PowerShell, khi sao lưu | Chỉ cửa sổ PowerShell đó | Thư mục Drive | 10 |
| `NETLIFY_SITE_ID` | PowerShell, khi sao lưu (tuỳ chọn) | Chỉ cửa sổ PowerShell đó | Site ID | 10 |
| `NETLIFY_AUTH_TOKEN` | PowerShell, khi sao lưu (tuỳ chọn) | Chỉ cửa sổ PowerShell đó | Personal access token | 10 |
| `PISA_CHO_PHEP_MIGRATE_TURSO` | PowerShell, chỉ khi session code yêu cầu nâng cấp database | Chỉ cửa sổ PowerShell đó | Tên máy chủ database (URL bỏ `libsql://`) | 11.1 |
| `VITE_BAN_CHINH` | Đã có sẵn trong file `netlify.toml` — **bạn không cần đặt** | Mọi deploy | `1` | — |
